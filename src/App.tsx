import { useMemo, useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { LEDCanvas } from './components/LEDCanvas';
import { DEFAULT_PRESET_ID, PITCH_PRESETS, gcd } from './presets';
import type { SimulatorConfig } from './types';

const initial: SimulatorConfig = {
  presetId: DEFAULT_PRESET_ID,
  modulesWide: 7,
  modulesHigh: 8,
  viewingDistanceM: 8,
  sourceUrl: '',
  sourceMode: 'testpattern',
  useCorsProxy: false,
  showDiodeMask: true,
  brightness: 1.1,
  glow: 0.35,
};

export default function App() {
  const [config, setConfigRaw] = useState<SimulatorConfig>(initial);
  const setConfig = (patch: Partial<SimulatorConfig>) => setConfigRaw((c) => ({ ...c, ...patch }));

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
    <div className="w-full h-full flex flex-col lg:flex-row">
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
