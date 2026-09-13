import { useEffect, useMemo, useRef, useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { LEDCanvas } from './components/LEDCanvas';
import { DEFAULT_PRESET_ID, PITCH_PRESETS, autoFitModules, gcd } from './presets';
import type { SimulatorConfig } from './types';

function initialFor(presetId: string): SimulatorConfig {
  const p = PITCH_PRESETS.find((x) => x.id === presetId) ?? PITCH_PRESETS[0];
  const fit = autoFitModules(p.modulePixelsW, p.modulePixelsH, p.moduleWidthMm, p.moduleHeightMm, p.pitch);
  return {
    presetId,
    modulesWide: fit.w,
    modulesHigh: fit.h,
    viewingDistanceM: Math.max(3, p.pitch * 1.5),
    sourceUrl: '',
    sourceMode: 'testpattern',
    useCorsProxy: false,
    showDiodeMask: true,
    brightness: 1.1,
    glow: 0.35,
    autoFit: true,
  };
}

export default function App() {
  const [config, setConfigRaw] = useState<SimulatorConfig>(() => initialFor(DEFAULT_PRESET_ID));
  const lastPresetRef = useRef(config.presetId);

  const setConfig = (patch: Partial<SimulatorConfig>) => setConfigRaw((c) => ({ ...c, ...patch }));

  // When pitch changes and auto-fit is on, recompute modules
  useEffect(() => {
    if (config.presetId === lastPresetRef.current) return;
    lastPresetRef.current = config.presetId;
    if (!config.autoFit) return;
    const p = PITCH_PRESETS.find((x) => x.id === config.presetId);
    if (!p) return;
    const fit = autoFitModules(p.modulePixelsW, p.modulePixelsH, p.moduleWidthMm, p.moduleHeightMm, p.pitch);
    setConfigRaw((c) => ({
      ...c,
      modulesWide: fit.w,
      modulesHigh: fit.h,
      viewingDistanceM: Math.max(3, p.pitch * 1.5),
    }));
  }, [config.presetId, config.autoFit]);

  const preset = useMemo(
    () => PITCH_PRESETS.find((p) => p.id === config.presetId) ?? PITCH_PRESETS[0],
    [config.presetId]
  );

  const totalPxW = preset.modulePixelsW * config.modulesWide;
  const totalPxH = preset.modulePixelsH * config.modulesHigh;
  const physicalW_m = (preset.moduleWidthMm * config.modulesWide) / 1000;
  const physicalH_m = (preset.moduleHeightMm * config.modulesHigh) / 1000;

  const aspectLabel = useMemo(() => {
    const g = gcd(totalPxW, totalPxH);
    return `${totalPxW / g}:${totalPxH / g}`;
  }, [totalPxW, totalPxH]);

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col lg:flex-row">
      <ControlPanel
        config={config}
        setConfig={setConfig}
        preset={preset}
        totalPxW={totalPxW}
        totalPxH={totalPxH}
        physicalW_m={physicalW_m}
        physicalH_m={physicalH_m}
        aspectLabel={aspectLabel}
      />
      <main className="flex-1 min-h-0 min-w-0 relative">
        <LEDCanvas
          preset={preset}
          config={config}
          totalPxW={totalPxW}
          totalPxH={totalPxH}
          physicalW_m={physicalW_m}
          physicalH_m={physicalH_m}
        />
      </main>
    </div>
  );
}
