import { VEX } from './vex.js';
import { HALE } from './hale.js';
import { MORROW } from './morrow.js';
import { KITE } from './kite.js';
import { BRICK } from './brick.js';
import { solve } from '../figure.js';
export const OPS = { vex: VEX, hale: HALE, morrow: MORROW, kite: KITE, brick: BRICK };

// Visor and lens lights, fitted to the glass each head painter draws (head
// frame; k: the head's own scale). glass: lit softly with a halo round it;
// line: the bright light strip across it; core: shapes lit at full.
export const VISOR = {
  vex: { c: [255, 122, 53],
    glass: ['M 0.9 -8.4 C 2.8 -8.9 4.8 -8.6 5.7 -7.6 L 5.8 -5.6 C 4.6 -5.2 2.6 -5.0 1.0 -5.4 C 0.6 -6.3 0.6 -7.4 0.9 -8.4 Z'],
    line: ['M 1.2 -6.5 C 2.8 -6.7 4.4 -6.6 5.8 -6.3'] },
  hale: { c: [62, 232, 224],
    glass: ['M 1.2 -7.4 L 2.9 -7.6 L 2.9 -5.75 L 1.25 -5.9 Z', 'M 3.2 -7.6 L 4.7 -7.35 L 4.6 -5.6 L 3.2 -5.7 Z'],
    line: ['M 1.5 -6.75 L 2.6 -6.85', 'M 3.5 -6.85 L 4.4 -6.7'] },
  morrow: { c: [196, 168, 255],
    glass: ['M 0.2 -6.2 C 0.8 -7.3 2.2 -7.6 3.0 -7.1 C 3.0 -6.2 2.4 -5.4 1.4 -5.3 C 0.7 -5.3 0.3 -5.6 0.2 -6.2 Z',
      'M 3.6 -7.0 C 4.1 -7.4 4.6 -7.3 4.8 -7.0 C 4.8 -6.3 4.5 -5.6 4.0 -5.5 C 3.7 -5.8 3.5 -6.4 3.6 -7.0 Z'],
    line: ['M 0.9 -6.4 C 1.5 -6.75 2.1 -6.8 2.6 -6.65', 'M 3.9 -6.65 L 4.45 -6.75'] },
  kite: { c: [143, 208, 255],
    glass: ['M 0.3 -8.4 C 2.0 -8.9 4.0 -8.7 5.5 -7.8 L 5.5 -5.6 C 4.0 -5.1 2.0 -5.1 0.5 -5.6 C 0.1 -6.5 0.1 -7.5 0.3 -8.4 Z'],
    line: ['M 0.7 -6.8 C 2.2 -7.05 3.8 -7.0 5.4 -6.7'] },
  brick: { c: [255, 201, 60], k: [0.8 * 1.06, 0.8 * 1.02],
    glass: ['M 2.0 -8.7 L 6.95 -8.75 L 6.95 -7.7 L 5.05 -7.7 L 5.05 -4.4 L 4.15 -4.4 L 4.15 -7.7 L 2.0 -7.7 Z'],
    core: ['M 2.3 -8.45 L 6.8 -8.5 L 6.8 -8.0 L 4.85 -8.0 L 4.85 -4.7 L 4.35 -4.7 L 4.35 -8.0 L 2.3 -8.0 Z'] },
};

const PATHS = new Map();
const path2 = (d) => { let p = PATHS.get(d); if (!p) PATHS.set(d, p = new Path2D(d)); return p; };

// Light an operator's visor. `g` maps figure units (feet origin) to pixels,
// mirrored already if the figure is; `px` is pixels per unit (for the blur).
export function visorLight(g, id, pose, px, alpha = 1) {
  const V = VISOR[id];
  if (!V || alpha <= 0) return;
  const [r, gg, b] = V.c, k = V.k || [1, 1], u = px * k[0];
  const col = (a) => `rgba(${r},${gg},${b},${a * alpha})`;
  const hot = (a) => `rgba(${Math.min(255, r + 70)},${Math.min(255, gg + 70)},${Math.min(255, b + 70)},${a * alpha})`;
  const J = solve(pose);
  g.save();
  g.translate(J.neck[0], J.neck[1]); g.rotate(-J.p.lean - J.p.head); g.scale(k[0], k[1]);
  g.globalCompositeOperation = 'lighter';
  // the halo, no bigger than the glass, then the glass lit from inside
  g.shadowColor = col(0.85); g.shadowBlur = 1.6 * u;
  for (const d of V.glass) { g.fillStyle = col(0.22); g.fill(path2(d)); }
  g.shadowBlur = 0.6 * u;
  for (const d of V.glass) { g.fillStyle = col(0.22); g.fill(path2(d)); }
  // the light strip
  g.shadowColor = col(1); g.shadowBlur = 0.5 * u;
  g.strokeStyle = hot(0.95); g.lineWidth = 0.34; g.lineCap = 'round';
  for (const d of V.line || []) g.stroke(path2(d));
  g.fillStyle = hot(0.95);
  for (const d of V.core || []) g.fill(path2(d));
  g.restore();
}
