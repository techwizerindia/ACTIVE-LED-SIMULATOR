import { useEffect, useMemo, useRef, useState } from 'react';
import type { PitchPreset, SimulatorConfig } from '../types';

interface Props {
  preset: PitchPreset;
  config: SimulatorConfig;
  totalPxW: number;
  totalPxH: number;
  physicalW_m: number;
  physicalH_m: number;
}

// Blur grows once viewer is beyond the acuity distance for this pitch.
function blurForDistance(distanceM: number, pitchMm: number): number {
  const blendPoint = pitchMm; // rule of thumb: min viewing dist (m) ≈ pitch (mm)
  if (distanceM <= blendPoint) return 0;
  const ratio = Math.min(4, (distanceM - blendPoint) / Math.max(1, blendPoint));
  return ratio * 1.4;
}

// Perspective zoom: closer viewer = larger apparent screen, clamped so we
// never overflow the stage. Reference distance = 2× the pitch (typical near view).
function zoomForDistance(distanceM: number, pitchMm: number): number {
  const ref = Math.max(2, pitchMm * 1.5);
  const raw = ref / Math.max(1, distanceM);
  return Math.max(0.55, Math.min(1.35, raw));
}

export function LEDCanvas({ preset, config, totalPxW, totalPxH, physicalW_m, physicalH_m }: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgError, setImgError] = useState<string>('');
  const [stageSize, setStageSize] = useState({ w: 800, h: 500 });

  // Track stage inner size responsively
  useEffect(() => {
    if (!stageRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setStageSize({ w: Math.max(240, cr.width), h: Math.max(200, cr.height) });
    });
    ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, []);

  // Compute display size — fit BOTH width and height of stage, preserving aspect.
  // Reserve room for bezel padding + stand + label. Then apply distance zoom, clamped.
  const bezel = Math.max(10, Math.min(22, stageSize.w * 0.014));
  const labelReserve = 78; // px reserved under the wall for stats + reflection
  const maxW = stageSize.w - 2 * (bezel + 16);
  const maxH = stageSize.h - labelReserve - 2 * bezel - 20;
  const aspect = totalPxW / totalPxH;

  let baseW = maxW;
  let baseH = baseW / aspect;
  if (baseH > maxH) { baseH = maxH; baseW = baseH * aspect; }

  const zoom = zoomForDistance(config.viewingDistanceM, preset.pitch);
  // Clamp final size to the stage
  let dispW = baseW * zoom;
  let dispH = baseH * zoom;
  if (dispW > maxW) { const s = maxW / dispW; dispW *= s; dispH *= s; }
  if (dispH > maxH) { const s = maxH / dispH; dispW *= s; dispH *= s; }
  dispW = Math.floor(dispW);
  dispH = Math.floor(dispH);

  // Canvas backing size = actual LED resolution
  useEffect(() => {
    if (!canvasRef.current) return;
    canvasRef.current.width = totalPxW;
    canvasRef.current.height = totalPxH;
  }, [totalPxW, totalPxH]);

  // Source loading + draw loop
  useEffect(() => {
    let cancelled = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
      videoRef.current.load();
      videoRef.current = null;
    }
    if (imgRef.current) { imgRef.current.src = ''; imgRef.current = null; }
    setImgError('');

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    const drawTestPattern = (t: number) => {
      const w = canvas.width, h = canvas.height;
      const bars = ['#e11d48', '#f59e0b', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7'];
      const bw = w / bars.length;
      bars.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * bw, 0, bw + 1, h * 0.55); });
      const stepH = h * 0.2;
      for (let i = 0; i < 8; i++) {
        const v = Math.round((i / 7) * 255);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect((i * w) / 8, h * 0.55, w / 8 + 1, stepH);
      }
      const sweepX = ((t / 20) % w);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sweepX, h * 0.75, Math.max(1, w * 0.02), h * 0.25);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, h * 0.75, w, h * 0.05);
      ctx.fillStyle = '#22d3ee';
      ctx.font = `bold ${Math.max(4, Math.floor(h * 0.08))}px monospace`;
      ctx.textBaseline = 'middle';
      ctx.fillText(`${preset.id}  ${totalPxW}x${totalPxH}`, 2, h * 0.775);
    };

    const drawFrame = (src: CanvasImageSource, sw: number, sh: number) => {
      const cw = canvas.width, ch = canvas.height;
      const srcAspect = sw / sh;
      const dstAspect = cw / ch;
      let sx = 0, sy = 0, ssw = sw, ssh = sh;
      if (srcAspect > dstAspect) { ssw = sh * dstAspect; sx = (sw - ssw) / 2; }
      else { ssh = sw / dstAspect; sy = (sh - ssh) / 2; }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(src, sx, sy, ssw, ssh, 0, 0, cw, ch);
    };

    const loop = (t: number) => {
      if (cancelled) return;
      if (config.sourceMode === 'testpattern') drawTestPattern(t);
      else if (config.sourceMode === 'video' && videoRef.current) {
        const v = videoRef.current;
        if (v.readyState >= 2 && v.videoWidth) drawFrame(v, v.videoWidth, v.videoHeight);
      } else if (config.sourceMode === 'image' && imgRef.current) {
        const im = imgRef.current;
        if (im.complete && im.naturalWidth) {
          drawFrame(im, im.naturalWidth, im.naturalHeight);
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    if (config.sourceMode === 'image' && config.sourceUrl) {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onerror = () => setImgError('Failed to load image (CORS or invalid URL). Try enabling CORS proxy.');
      im.src = config.useCorsProxy
        ? `https://images.weserv.nl/?url=${encodeURIComponent(config.sourceUrl.replace(/^https?:\/\//, ''))}`
        : config.sourceUrl;
      imgRef.current = im;
    } else if (config.sourceMode === 'video' && config.sourceUrl) {
      const v = document.createElement('video');
      v.crossOrigin = 'anonymous';
      v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
      v.src = config.sourceUrl;
      v.play().catch(() => setImgError('Video autoplay blocked or CORS denied.'));
      videoRef.current = v;
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelled = true; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [config.sourceMode, config.sourceUrl, config.useCorsProxy, preset.id, totalPxW, totalPxH]);

  // Diode mask geometry
  const cellSize = dispW / totalPxW;
  const dotSize = Math.max(1, cellSize * 0.62);
  const glowPx = Math.max(0, config.glow * cellSize * 0.9);
  const distanceBlur = blurForDistance(config.viewingDistanceM, preset.pitch);

  const iframeUrl = useMemo(() => {
    if (config.sourceMode !== 'webpage' || !config.sourceUrl) return '';
    if (config.useCorsProxy) return `https://api.allorigins.win/raw?url=${encodeURIComponent(config.sourceUrl)}`;
    return config.sourceUrl;
  }, [config.sourceMode, config.sourceUrl, config.useCorsProxy]);

  return (
    <div
      ref={stageRef}
      className="w-full h-full flex flex-col items-center justify-center showroom overflow-hidden relative"
    >
      {/* Ambient stage lights */}
      <div aria-hidden className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 20% 10%, rgba(34,211,238,0.06), transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(168,85,247,0.05), transparent 60%)' }} />

      <div className="relative flex flex-col items-center" style={{ maxWidth: '100%' }}>
        {/* LED-TV style bezel/frame */}
        <div
          className="relative rounded-[14px]"
          style={{
            padding: bezel,
            background:
              'linear-gradient(180deg,#20272f 0%,#0d1116 40%,#05080b 100%)',
            boxShadow:
              '0 30px 80px rgba(0,0,0,0.75), 0 0 0 1px #0a0f14 inset, 0 0 0 2px #1a2028 inset, 0 6px 0 -2px rgba(255,255,255,0.03) inset',
            border: '1px solid #12171e',
          }}
        >
          {/* subtle brand notch */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-[1px] w-16 h-[6px] rounded-b-md"
               style={{ background: 'linear-gradient(180deg,#141a22,#05080b)' }} />
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-[8px] flex items-center gap-1 text-[9px] text-slate-500 tracking-[0.3em]">
            <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
            TECHWIZER LED
          </div>

          {/* Screen surface */}
          <div
            className="relative overflow-hidden rounded-[3px]"
            style={{
              width: dispW,
              height: dispH,
              background: '#000',
              boxShadow: 'inset 0 0 0 1px #0a0f14',
              filter: `brightness(${config.brightness}) blur(${distanceBlur}px)`,
              transition: 'filter 120ms linear, width 120ms ease, height 120ms ease',
            }}
          >
            {config.sourceMode === 'webpage' ? (
              iframeUrl ? (
                <iframe
                  title="led-source-web"
                  src={iframeUrl}
                  className="absolute inset-0"
                  style={{
                    width: dispW,
                    height: dispH,
                    border: 0,
                    filter: 'contrast(1.05) saturate(1.15)',
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                  Enter a webpage URL
                </div>
              )
            ) : (
              <canvas
                ref={canvasRef}
                className="led-canvas absolute inset-0"
                style={{
                  width: dispW,
                  height: dispH,
                  filter: glowPx > 0 ? `drop-shadow(0 0 ${glowPx}px rgba(255,255,255,0.35))` : undefined,
                }}
              />
            )}

            {/* Diode / bezel mask between LEDs */}
            {config.showDiodeMask && cellSize >= 2 && (
              <div
                className="absolute inset-0 pixel-mask"
                style={{
                  backgroundImage: `radial-gradient(circle at center, transparent 0 ${dotSize / 2}px, rgba(0,0,0,0.92) ${dotSize / 2 + 0.5}px)`,
                  backgroundSize: `${cellSize}px ${cellSize}px`,
                }}
              />
            )}

            {/* Sub-pixel glow highlight */}
            {config.glow > 0 && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at center, rgba(255,255,255,${0.06 * config.glow}) 0 ${dotSize / 3}px, transparent ${dotSize / 2}px)`,
                  backgroundSize: `${cellSize}px ${cellSize}px`,
                  mixBlendMode: 'screen',
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Glass reflection sheen */}
            <div aria-hidden className="absolute inset-0 pointer-events-none"
                 style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.02) 100%)' }} />

            {/* Vignette */}
            <div className="absolute inset-0 crt-vignette" />
          </div>
        </div>

        {/* Stand */}
        <div className="mt-1 flex flex-col items-center">
          <div className="w-[36%] h-[6px] rounded-b-md"
               style={{ background: 'linear-gradient(180deg,#1a2028,#05080b)' }} />
          <div className="w-[62%] h-[7px] rounded-md mt-[3px]"
               style={{ background: 'linear-gradient(180deg,#2a323d,#0a0f14)', boxShadow: '0 8px 18px rgba(0,0,0,0.6)' }} />
        </div>

        {/* Floor reflection */}
        <div
          aria-hidden
          className="mt-2 rounded-sm opacity-25"
          style={{
            width: dispW * 0.92,
            height: Math.min(80, dispH * 0.22),
            background: 'linear-gradient(180deg, rgba(34,211,238,0.14), transparent)',
            filter: 'blur(6px)',
            transform: 'scaleY(-1)',
          }}
        />

        {/* Screen physical readout */}
        <div className="mt-1 text-center text-[11px] text-slate-400 font-mono">
          {preset.id} · {totalPxW}×{totalPxH}px · {physicalW_m.toFixed(2)}m × {physicalH_m.toFixed(2)}m ·
          view <span className="text-cyan-300">{config.viewingDistanceM.toFixed(1)}m</span> · zoom {zoom.toFixed(2)}×
          {imgError && <span className="ml-2 text-rose-400">· {imgError}</span>}
        </div>
      </div>
    </div>
  );
}
