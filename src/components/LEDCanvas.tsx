import { useEffect, useMemo, useRef, useState } from 'react';
import type { PitchPreset, SimulatorConfig, SourceMode } from '../types';

interface Props {
  preset: PitchPreset;
  config: SimulatorConfig;
  totalPxW: number;
  totalPxH: number;
  physicalW_m: number;
  physicalH_m: number;
}

// Downscale factor from viewing distance: at very far distance the eye
// integrates pixels together — we simulate with blur + slight brightness lift.
function blurForDistance(distanceM: number, pitchMm: number): number {
  // "Visual acuity distance" ~ pitch (mm) in metres. Beyond that, pixels blend.
  const blendPoint = pitchMm; // in meters this is where blending begins
  if (distanceM <= blendPoint) return 0;
  const ratio = Math.min(4, (distanceM - blendPoint) / Math.max(1, blendPoint));
  return ratio * 1.4; // px of CSS blur
}

export function LEDCanvas({ preset, config, totalPxW, totalPxH, physicalW_m, physicalH_m }: Props) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgError, setImgError] = useState<string>('');
  const [containerW, setContainerW] = useState(800);

  // Resize observer to fit the canvas responsively
  useEffect(() => {
    if (!outerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setContainerW(Math.max(200, cr.width));
    });
    ro.observe(outerRef.current);
    return () => ro.disconnect();
  }, []);

  // Compute rendered display size preserving aspect
  const aspect = totalPxW / totalPxH;
  const dispW = Math.min(containerW - 32, 1400);
  const dispH = Math.round(dispW / aspect);

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

    // cleanup previous
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
      videoRef.current.load();
      videoRef.current = null;
    }
    if (imgRef.current) {
      imgRef.current.src = '';
      imgRef.current = null;
    }
    setImgError('');

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    const drawTestPattern = (t: number) => {
      const w = canvas.width, h = canvas.height;
      // color bars + moving stripe + text
      const bars = ['#e11d48', '#f59e0b', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7'];
      const bw = w / bars.length;
      bars.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * bw, 0, bw + 1, h * 0.55); });
      // black + gray steps
      const stepH = h * 0.2;
      for (let i = 0; i < 8; i++) {
        const v = Math.round((i / 7) * 255);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect((i * w) / 8, h * 0.55, w / 8 + 1, stepH);
      }
      // moving sweep
      const sweepX = ((t / 20) % w);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sweepX, h * 0.75, Math.max(1, w * 0.02), h * 0.25);
      // label
      ctx.fillStyle = '#000';
      ctx.fillRect(0, h * 0.75, w, h * 0.05);
      ctx.fillStyle = '#22d3ee';
      ctx.font = `bold ${Math.max(4, Math.floor(h * 0.08))}px monospace`;
      ctx.textBaseline = 'middle';
      ctx.fillText(`${preset.id}  ${totalPxW}x${totalPxH}`, 2, h * 0.775);
    };

    const drawFrame = (src: CanvasImageSource, sw: number, sh: number) => {
      // Cover-fit
      const cw = canvas.width, ch = canvas.height;
      const srcAspect = sw / sh;
      const dstAspect = cw / ch;
      let sx = 0, sy = 0, ssw = sw, ssh = sh;
      if (srcAspect > dstAspect) {
        // source too wide -> crop sides
        ssw = sh * dstAspect;
        sx = (sw - ssw) / 2;
      } else {
        ssh = sw / dstAspect;
        sy = (sh - ssh) / 2;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(src, sx, sy, ssw, ssh, 0, 0, cw, ch);
    };

    const loop = (t: number) => {
      if (cancelled) return;
      if (config.sourceMode === 'testpattern') {
        drawTestPattern(t);
      } else if (config.sourceMode === 'video' && videoRef.current) {
        const v = videoRef.current;
        if (v.readyState >= 2 && v.videoWidth) {
          drawFrame(v, v.videoWidth, v.videoHeight);
        }
      } else if (config.sourceMode === 'image' && imgRef.current) {
        const im = imgRef.current;
        if (im.complete && im.naturalWidth) {
          drawFrame(im, im.naturalWidth, im.naturalHeight);
          // image is static — no need to keep looping
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
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.autoplay = true;
      v.src = config.sourceUrl;
      v.play().catch(() => setImgError('Video autoplay blocked or CORS denied.'));
      videoRef.current = v;
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [config.sourceMode, config.sourceUrl, config.useCorsProxy, preset.id, totalPxW, totalPxH]);

  // Diode-mask CSS: repeating radial-gradient of small "dots" with dark gaps.
  // Cell size = one LED pixel in *display* pixels.
  const cellSize = dispW / totalPxW; // px per LED
  const dotSize = Math.max(1, cellSize * 0.62);
  const glowPx = Math.max(0, config.glow * cellSize * 0.9);
  const distanceBlur = blurForDistance(config.viewingDistanceM, preset.pitch);

  const iframeUrl = useMemo(() => {
    if (config.sourceMode !== 'webpage' || !config.sourceUrl) return '';
    if (config.useCorsProxy) {
      // AllOrigins proxies HTML; good enough for many sites
      return `https://api.allorigins.win/raw?url=${encodeURIComponent(config.sourceUrl)}`;
    }
    return config.sourceUrl;
  }, [config.sourceMode, config.sourceUrl, config.useCorsProxy]);

  return (
    <div ref={outerRef} className="w-full h-full flex flex-col items-center justify-center gap-4 p-4 showroom">
      {/* Stage floor reflection cue */}
      <div className="relative" style={{ width: dispW, maxWidth: '100%' }}>
        {/* Cabinet bezel */}
        <div
          className="relative rounded-md"
          style={{
            padding: 10,
            background: 'linear-gradient(180deg,#1a2230,#0a0f16)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.75), 0 0 0 2px #0d1420 inset',
          }}
        >
          <div
            className="relative overflow-hidden rounded-sm"
            style={{
              width: dispW,
              height: dispH,
              background: '#000',
              filter: `brightness(${config.brightness}) blur(${distanceBlur}px)`,
              transition: 'filter 120ms linear',
            }}
          >
            {/* Actual pixel data */}
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
                    // fake downsample effect for web pages: strong contrast + slight blur then pixel mask overlays
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

            {/* Diode mask — dark grid between LEDs */}
            {config.showDiodeMask && cellSize >= 2 && (
              <div
                className="absolute inset-0 pixel-mask"
                style={{
                  backgroundImage: `radial-gradient(circle at center, transparent 0 ${dotSize / 2}px, rgba(0,0,0,0.92) ${dotSize / 2 + 0.5}px)`,
                  backgroundSize: `${cellSize}px ${cellSize}px`,
                }}
              />
            )}

            {/* Sub-pixel glow layer (soft highlight) */}
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

            {/* Vignette */}
            <div className="absolute inset-0 crt-vignette" />
          </div>
          {/* Cabinet base plate */}
          <div className="mt-2 h-2 rounded-b bg-gradient-to-b from-[#1a2230] to-[#050810]" />
        </div>

        {/* Floor reflection */}
        <div
          aria-hidden
          className="mx-auto mt-1 rounded-sm opacity-30"
          style={{
            width: dispW * 0.92,
            height: dispH * 0.25,
            background: 'linear-gradient(180deg, rgba(34,211,238,0.10), transparent)',
            filter: 'blur(6px)',
            transform: 'scaleY(-1)',
          }}
        />

        {/* Screen physical readout */}
        <div className="mt-3 text-center text-xs text-slate-400 font-mono">
          {preset.id} · {totalPxW}×{totalPxH} px · {physicalW_m.toFixed(2)}m × {physicalH_m.toFixed(2)}m
          {imgError && <span className="ml-2 text-rose-400">· {imgError}</span>}
        </div>
      </div>
    </div>
  );
}

export type { SourceMode };
