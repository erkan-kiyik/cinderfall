import { VEX } from './vex.js';
import { HALE } from './hale.js';
import { MORROW } from './morrow.js';
import { KITE } from './kite.js';
import { BRICK } from './brick.js';
export const OPS = { vex: VEX, hale: HALE, morrow: MORROW, kite: KITE, brick: BRICK };

// Visor and lens lights, in the head frame: [x, y, half width, half height],
// with the light colour. The opening and the portraits glow them.
export const VISOR = {
  vex: { c: [255, 122, 53], at: [[3.3, -6.6, 2.3, 0.75]] },
  hale: { c: [62, 232, 224], at: [[2.9, -6.6, 2.0, 0.85]] },
  morrow: { c: [196, 168, 255], at: [[1.6, -6.3, 1.1, 0.85], [4.0, -6.3, 0.55, 0.75]] },
  kite: { c: [143, 208, 255], at: [[3.0, -6.9, 2.5, 1.0]] },
  brick: { c: [255, 201, 60], at: [[3.7, -6.6, 2.0, 0.6]] },
};
