import type { PitchPreset } from './types';

export const PITCH_PRESETS: PitchPreset[] = [
  { id: 'P1.25', pitch: 1.25, moduleWidthMm: 300,  moduleHeightMm: 168.75, modulePixelsW: 240, modulePixelsH: 135, lampType: 'SMD 0808/1010', useCase: 'TV Studios, Control Rooms', category: 'Indoor-Fine' },
  { id: 'P1.53', pitch: 1.53, moduleWidthMm: 320,  moduleHeightMm: 160,    modulePixelsW: 208, modulePixelsH: 104, lampType: 'SMD 1010',       useCase: 'Corporate Boardrooms',   category: 'Indoor-Fine' },
  { id: 'P1.86', pitch: 1.86, moduleWidthMm: 320,  moduleHeightMm: 160,    modulePixelsW: 172, modulePixelsH: 86,  lampType: 'SMD 1010/1515',  useCase: 'High-End Retail',        category: 'Indoor-Fine' },
  { id: 'P2',    pitch: 2.0,  moduleWidthMm: 320,  moduleHeightMm: 160,    modulePixelsW: 160, modulePixelsH: 80,  lampType: 'SMD 1515',       useCase: 'Indoor Showrooms',       category: 'Indoor-Fine' },
  { id: 'P2.5',  pitch: 2.5,  moduleWidthMm: 320,  moduleHeightMm: 160,    modulePixelsW: 128, modulePixelsH: 64,  lampType: 'SMD 1515/2020',  useCase: 'Church, Small Stages',   category: 'Indoor-Fine' },
  { id: 'P3',    pitch: 3.0,  moduleWidthMm: 192,  moduleHeightMm: 192,    modulePixelsW: 64,  modulePixelsH: 64,  lampType: 'SMD 2121',       useCase: 'Exhibition, Malls',      category: 'Indoor-Medium' },
  { id: 'P4',    pitch: 4.0,  moduleWidthMm: 320,  moduleHeightMm: 160,    modulePixelsW: 80,  modulePixelsH: 40,  lampType: 'SMD 2121',       useCase: 'Large Indoor Concerts',  category: 'Indoor-Medium' },
  { id: 'P5',    pitch: 5.0,  moduleWidthMm: 320,  moduleHeightMm: 160,    modulePixelsW: 64,  modulePixelsH: 32,  lampType: 'SMD 2121/2727',  useCase: 'Semi-Outdoor Fronts',    category: 'Indoor-Medium' },
  { id: 'P6',    pitch: 6.0,  moduleWidthMm: 192,  moduleHeightMm: 192,    modulePixelsW: 32,  modulePixelsH: 32,  lampType: 'SMD 2727/3535',  useCase: 'Sports Perimeter',       category: 'Outdoor' },
  { id: 'P8',    pitch: 8.0,  moduleWidthMm: 320,  moduleHeightMm: 160,    modulePixelsW: 40,  modulePixelsH: 20,  lampType: 'SMD 3535',       useCase: 'Digital Billboards',     category: 'Outdoor' },
  { id: 'P10',   pitch: 10.0, moduleWidthMm: 320,  moduleHeightMm: 160,    modulePixelsW: 32,  modulePixelsH: 16,  lampType: 'SMD 3535 / DIP',  useCase: 'Highway Walls',          category: 'Outdoor' },
  { id: 'P16',   pitch: 16.0, moduleWidthMm: 256,  moduleHeightMm: 256,    modulePixelsW: 16,  modulePixelsH: 16,  lampType: 'DIP 346',        useCase: 'Stadium Scoreboards',    category: 'Outdoor' },
];

export const DEFAULT_PRESET_ID = 'P10';

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}
