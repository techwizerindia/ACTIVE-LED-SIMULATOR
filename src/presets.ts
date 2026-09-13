import type { PitchPreset } from './types';

// Extended commercial pitch table — indoor fine → outdoor giant walls.
export const PITCH_PRESETS: PitchPreset[] = [
  { id: 'P0.9',   pitch: 0.9,   moduleWidthMm: 320, moduleHeightMm: 180,    modulePixelsW: 356, modulePixelsH: 200, lampType: 'COB / MiniLED',  useCase: 'Broadcast Studios',       category: 'Indoor-Fine' },
  { id: 'P1.25',  pitch: 1.25,  moduleWidthMm: 300, moduleHeightMm: 168.75, modulePixelsW: 240, modulePixelsH: 135, lampType: 'SMD 0808/1010',  useCase: 'TV Studios',              category: 'Indoor-Fine' },
  { id: 'P1.53',  pitch: 1.53,  moduleWidthMm: 320, moduleHeightMm: 160,    modulePixelsW: 208, modulePixelsH: 104, lampType: 'SMD 1010',       useCase: 'Corporate Boardrooms',    category: 'Indoor-Fine' },
  { id: 'P1.667', pitch: 1.667, moduleWidthMm: 320, moduleHeightMm: 160,    modulePixelsW: 192, modulePixelsH: 96,  lampType: 'SMD 1010',       useCase: 'Control Rooms',           category: 'Indoor-Fine' },
  { id: 'P1.86',  pitch: 1.86,  moduleWidthMm: 320, moduleHeightMm: 160,    modulePixelsW: 172, modulePixelsH: 86,  lampType: 'SMD 1010/1515',  useCase: 'High-End Retail',         category: 'Indoor-Fine' },
  { id: 'P2',     pitch: 2.0,   moduleWidthMm: 320, moduleHeightMm: 160,    modulePixelsW: 160, modulePixelsH: 80,  lampType: 'SMD 1515',       useCase: 'Indoor Showrooms',        category: 'Indoor-Fine' },
  { id: 'P2.5',   pitch: 2.5,   moduleWidthMm: 320, moduleHeightMm: 160,    modulePixelsW: 128, modulePixelsH: 64,  lampType: 'SMD 1515/2020',  useCase: 'Church, Small Stages',    category: 'Indoor-Fine' },
  { id: 'P2.6',   pitch: 2.604, moduleWidthMm: 500, moduleHeightMm: 500,    modulePixelsW: 192, modulePixelsH: 192, lampType: 'SMD 2020',       useCase: 'Rental Touring',          category: 'Indoor-Medium' },
  { id: 'P2.9',   pitch: 2.976, moduleWidthMm: 500, moduleHeightMm: 500,    modulePixelsW: 168, modulePixelsH: 168, lampType: 'SMD 2121',       useCase: 'Concert Rental',          category: 'Indoor-Medium' },
  { id: 'P3',     pitch: 3.0,   moduleWidthMm: 192, moduleHeightMm: 192,    modulePixelsW: 64,  modulePixelsH: 64,  lampType: 'SMD 2121',       useCase: 'Exhibition, Malls',       category: 'Indoor-Medium' },
  { id: 'P3.9',   pitch: 3.91,  moduleWidthMm: 500, moduleHeightMm: 500,    modulePixelsW: 128, modulePixelsH: 128, lampType: 'SMD 2121',       useCase: 'Outdoor Rental',          category: 'Indoor-Medium' },
  { id: 'P4',     pitch: 4.0,   moduleWidthMm: 320, moduleHeightMm: 160,    modulePixelsW: 80,  modulePixelsH: 40,  lampType: 'SMD 2121',       useCase: 'Large Indoor Concerts',   category: 'Indoor-Medium' },
  { id: 'P4.8',   pitch: 4.81,  moduleWidthMm: 500, moduleHeightMm: 500,    modulePixelsW: 104, modulePixelsH: 104, lampType: 'SMD 2727',       useCase: 'Outdoor Events',          category: 'Outdoor' },
  { id: 'P5',     pitch: 5.0,   moduleWidthMm: 320, moduleHeightMm: 160,    modulePixelsW: 64,  modulePixelsH: 32,  lampType: 'SMD 2121/2727',  useCase: 'Semi-Outdoor Fronts',     category: 'Indoor-Medium' },
  { id: 'P6',     pitch: 6.0,   moduleWidthMm: 192, moduleHeightMm: 192,    modulePixelsW: 32,  modulePixelsH: 32,  lampType: 'SMD 2727/3535',  useCase: 'Sports Perimeter',        category: 'Outdoor' },
  { id: 'P8',     pitch: 8.0,   moduleWidthMm: 320, moduleHeightMm: 160,    modulePixelsW: 40,  modulePixelsH: 20,  lampType: 'SMD 3535',       useCase: 'Digital Billboards',      category: 'Outdoor' },
  { id: 'P10',    pitch: 10.0,  moduleWidthMm: 320, moduleHeightMm: 160,    modulePixelsW: 32,  modulePixelsH: 16,  lampType: 'SMD 3535 / DIP', useCase: 'Highway Walls',           category: 'Outdoor' },
  { id: 'P12',    pitch: 12.0,  moduleWidthMm: 384, moduleHeightMm: 192,    modulePixelsW: 32,  modulePixelsH: 16,  lampType: 'DIP 346',        useCase: 'Roadside Billboards',     category: 'Outdoor' },
  { id: 'P16',    pitch: 16.0,  moduleWidthMm: 256, moduleHeightMm: 256,    modulePixelsW: 16,  modulePixelsH: 16,  lampType: 'DIP 346',        useCase: 'Stadium Scoreboards',     category: 'Outdoor' },
  { id: 'P20',    pitch: 20.0,  moduleWidthMm: 320, moduleHeightMm: 160,    modulePixelsW: 16,  modulePixelsH: 8,   lampType: 'DIP 546',        useCase: 'Giant Facades',           category: 'Outdoor' },
];

export const DEFAULT_PRESET_ID = 'P4';

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

/**
 * Pick a module count that lands near 16:9 aspect and a sensible physical size
 * for the chosen pitch. Larger pitches → fewer modules (billboards are chunky);
 * fine pitches → more modules (studio walls).
 */
export function autoFitModules(
  modulePxW: number,
  modulePxH: number,
  moduleMmW: number,
  moduleMmH: number,
  pitchMm: number,
) {
  const target = 16 / 9;
  // Target physical width scales with pitch: fine pitch ≈ 3m wide, giant pitch ≈ 12m
  const targetWm = Math.max(2.5, Math.min(15, 2 + pitchMm * 0.9));
  let best = { w: 1, h: 1, score: Infinity };
  for (let w = 2; w <= 24; w++) {
    for (let h = 2; h <= 14; h++) {
      const pxW = w * modulePxW;
      const pxH = h * modulePxH;
      const aspect = pxW / pxH;
      const widthM = (w * moduleMmW) / 1000;
      const heightM = (h * moduleMmH) / 1000;
      if (widthM < 1.2 || heightM < 0.8) continue;
      if (widthM > 20 || heightM > 12) continue;
      const aspectPenalty = Math.abs(aspect - target);
      const sizePenalty = Math.abs(widthM - targetWm) / targetWm;
      const score = aspectPenalty * 2 + sizePenalty;
      if (score < best.score) best = { w, h, score };
    }
  }
  return { w: best.w, h: best.h };
}
