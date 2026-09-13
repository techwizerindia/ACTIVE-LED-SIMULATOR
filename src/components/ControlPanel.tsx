import type { PitchPreset, SimulatorConfig, SourceMode } from '../types';
import { PITCH_PRESETS, autoFitModules } from '../presets';

interface Props {
  config: SimulatorConfig;
  setConfig: (patch: Partial<SimulatorConfig>) => void;
  preset: PitchPreset;
  totalPxW: number;
  totalPxH: number;
  physicalW_m: number;
  physicalH_m: number;
  aspectLabel: string;
}

const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <div className="mb-4">
    <label className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400 mb-1">
      <span>{label}</span>
      {hint && <span className="text-slate-500 normal-case tracking-normal">{hint}</span>}
    </label>
    {children}
  </div>
);

const Stat: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="rounded-md bg-panel2/60 border border-slate-800/70 p-2">
    <div className="text-[10px] uppercase text-slate-500 tracking-wider">{label}</div>
    <div className="font-mono text-cyan-300 text-sm leading-tight">{value}</div>
    {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
  </div>
);

export function ControlPanel(p: Props) {
  const { config, setConfig, preset, totalPxW, totalPxH, physicalW_m, physicalH_m, aspectLabel } = p;

  const physicalW_ft = physicalW_m * 3.28084;
  const physicalH_ft = physicalH_m * 3.28084;
  const totalPixels = totalPxW * totalPxH;
  const modulesTotal = config.modulesWide * config.modulesHigh;

  return (
    <aside className="w-full lg:w-[380px] shrink-0 h-full overflow-y-auto thin-scroll bg-panel border-r border-slate-800/70 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
        <h1 className="text-sm font-semibold tracking-wide">ACTIVE LED · SIMULATOR</h1>
      </div>

      {/* Source */}
      <div className="rounded-lg border border-slate-800/70 bg-panel2/40 p-3 mb-4">
        <Field label="Source Type">
          <div className="grid grid-cols-4 gap-1">
            {(['image', 'video', 'webpage', 'testpattern'] as SourceMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setConfig({ sourceMode: m })}
                className={`text-[11px] py-1.5 rounded border transition ${
                  config.sourceMode === m
                    ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300'
                    : 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                }`}
              >
                {m === 'testpattern' ? 'Test' : m[0].toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </Field>

        {config.sourceMode !== 'testpattern' && (
          <>
            <Field label="Source URL" hint={config.sourceMode}>
              <input
                type="text"
                value={config.sourceUrl}
                onChange={(e) => setConfig({ sourceUrl: e.target.value })}
                placeholder={
                  config.sourceMode === 'image'
                    ? 'https://…/image.jpg'
                    : config.sourceMode === 'video'
                    ? 'https://…/stream.mp4'
                    : 'https://example.com'
                }
                className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono focus:border-cyan-400 outline-none"
              />
            </Field>

            <label className="flex items-center gap-2 text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={config.useCorsProxy}
                onChange={(e) => setConfig({ useCorsProxy: e.target.checked })}
                className="accent-cyan-400"
              />
              Route via CORS proxy
              <span className="text-slate-500 text-[10px]">(images.weserv.nl / allorigins)</span>
            </label>
          </>
        )}
      </div>

      {/* Pitch */}
      <div className="rounded-lg border border-slate-800/70 bg-panel2/40 p-3 mb-4">
        <Field label="Pixel Pitch" hint={`${preset.pitch} mm`}>
          <select
            value={config.presetId}
            onChange={(e) => setConfig({ presetId: e.target.value })}
            className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono focus:border-cyan-400 outline-none"
          >
            {PITCH_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} — {p.moduleWidthMm}×{p.moduleHeightMm}mm · {p.modulePixelsW}×{p.modulePixelsH}px · {p.useCase}
              </option>
            ))}
          </select>
          <input
            type="range"
            min={0}
            max={PITCH_PRESETS.length - 1}
            step={1}
            value={PITCH_PRESETS.findIndex((x) => x.id === config.presetId)}
            onChange={(e) => setConfig({ presetId: PITCH_PRESETS[Number(e.target.value)].id })}
            className="w-full mt-2"
          />
          <div className="text-[10px] text-slate-500 mt-1">{preset.lampType} · {preset.category}</div>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Modules Wide">
            <input
              type="number"
              min={1}
              max={80}
              value={config.modulesWide}
              onChange={(e) => setConfig({ modulesWide: Math.max(1, Math.min(80, Number(e.target.value) || 1)), autoFit: false })}
              className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono focus:border-cyan-400 outline-none"
            />
          </Field>
          <Field label="Modules High">
            <input
              type="number"
              min={1}
              max={40}
              value={config.modulesHigh}
              onChange={(e) => setConfig({ modulesHigh: Math.max(1, Math.min(40, Number(e.target.value) || 1)), autoFit: false })}
              className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono focus:border-cyan-400 outline-none"
            />
          </Field>
        </div>

        <div className="flex items-center justify-between mt-1">
          <label className="flex items-center gap-2 text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={config.autoFit}
              onChange={(e) => setConfig({ autoFit: e.target.checked })}
              className="accent-cyan-400"
            />
            Auto-fit modules
          </label>
          <button
            onClick={() => {
              const fit = autoFitModules(preset.modulePixelsW, preset.modulePixelsH, preset.moduleWidthMm, preset.moduleHeightMm, preset.pitch);
              setConfig({ modulesWide: fit.w, modulesHigh: fit.h, autoFit: true });
            }}
            className="text-[10px] px-2 py-1 rounded border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
          >
            Fit 16:9
          </button>
        </div>

        <div className="text-[11px] text-slate-400 mt-2">
          Module: <span className="font-mono text-slate-200">{preset.moduleWidthMm}×{preset.moduleHeightMm} mm</span> ·
          <span className="font-mono text-slate-200"> {preset.modulePixelsW}×{preset.modulePixelsH} px</span>
        </div>
      </div>

      {/* Viewing distance & visual */}
      <div className="rounded-lg border border-slate-800/70 bg-panel2/40 p-3 mb-4">
        <Field label="Viewing Distance" hint={`${config.viewingDistanceM.toFixed(1)} m`}>
          <input
            type="range"
            min={1}
            max={50}
            step={0.5}
            value={config.viewingDistanceM}
            onChange={(e) => setConfig({ viewingDistanceM: Number(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-slate-500"><span>1m</span><span>50m</span></div>
        </Field>
        <Field label="Brightness" hint={`${config.brightness.toFixed(2)}×`}>
          <input type="range" min={0.4} max={2} step={0.05}
            value={config.brightness}
            onChange={(e) => setConfig({ brightness: Number(e.target.value) })}
            className="w-full" />
        </Field>
        <Field label="Sub-Pixel Glow" hint={`${(config.glow * 100).toFixed(0)}%`}>
          <input type="range" min={0} max={1} step={0.05}
            value={config.glow}
            onChange={(e) => setConfig({ glow: Number(e.target.value) })}
            className="w-full" />
        </Field>
        <label className="flex items-center gap-2 text-xs text-slate-300 select-none mt-1">
          <input
            type="checkbox"
            checked={config.showDiodeMask}
            onChange={(e) => setConfig({ showDiodeMask: e.target.checked })}
            className="accent-cyan-400"
          />
          Show diode / bezel mask
        </label>
      </div>

      {/* Real-time specs */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Real-Time Specs</div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Total Resolution" value={`${totalPxW} × ${totalPxH}`} sub={`${(totalPixels / 1000).toFixed(1)}k pixels`} />
          <Stat label="Aspect Ratio" value={aspectLabel} />
          <Stat label="Physical (m)" value={`${physicalW_m.toFixed(2)} × ${physicalH_m.toFixed(2)}`} sub={`${(physicalW_m * physicalH_m).toFixed(2)} m²`} />
          <Stat label="Physical (ft)" value={`${physicalW_ft.toFixed(1)} × ${physicalH_ft.toFixed(1)}`} />
          <Stat label="Modules" value={`${config.modulesWide} × ${config.modulesHigh}`} sub={`${modulesTotal} total`} />
          <Stat label="Pitch / Lamp" value={`${preset.pitch} mm`} sub={preset.lampType} />
        </div>
      </div>

      <div className="mt-4 text-[10px] leading-relaxed text-slate-500">
        Pipeline: source frame → downsample to {totalPxW}×{totalPxH} → scale up with pixelated
        rendering → diode-mask + glow overlay → viewing-distance blur.
      </div>
    </aside>
  );
}
