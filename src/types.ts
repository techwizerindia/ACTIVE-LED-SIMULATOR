export interface PitchPreset {
  id: string;
  pitch: number; // mm between LED centres
  moduleWidthMm: number;
  moduleHeightMm: number;
  modulePixelsW: number;
  modulePixelsH: number;
  lampType: string;
  useCase: string;
  category: 'Indoor-Fine' | 'Indoor-Medium' | 'Outdoor';
}

export type SourceMode = 'image' | 'video' | 'webpage' | 'testpattern';

export interface SimulatorConfig {
  presetId: string;
  modulesWide: number;
  modulesHigh: number;
  viewingDistanceM: number;
  sourceUrl: string;
  sourceMode: SourceMode;
  useCorsProxy: boolean;
  showDiodeMask: boolean;
  brightness: number; // 0..2
  glow: number; // 0..1
}
