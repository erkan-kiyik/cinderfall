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
  // FLINT: the round welding goggles, the fire caught in the green glass
  vex: { c: [255, 168, 96],
    glass: ['M 0.95 -6.8 a 1.2 1.15 0 1 0 2.4 0 a 1.2 1.15 0 1 0 -2.4 0 Z', 'M 3.72 -6.75 a 0.42 0.98 0 1 0 0.84 0 a 0.42 0.98 0 1 0 -0.84 0 Z'],
    line: ['M 1.3 -7.3 C 1.8 -7.6 2.5 -7.6 3.0 -7.3', 'M 3.95 -7.3 L 4.35 -7.3'] },
  // WARDEN: the gold face shield
  hale: { c: [255, 206, 112],
    glass: ['M 1.4 -8.95 C 3.4 -9.25 5.4 -8.95 6.15 -7.95 C 6.65 -6.45 6.55 -4.25 5.95 -2.95 C 5.25 -1.85 3.65 -1.45 2.25 -1.85 C 1.65 -3.45 1.35 -6.05 1.4 -8.95 Z'],
    line: ['M 1.9 -7.6 C 3.6 -8.1 5.4 -7.9 6.2 -7.4'] },
  // VESPER: the Vanta monocle, turned cyan
  morrow: { c: [79, 210, 196],
    glass: ['M 5.08 -6.85 a 0.42 0.72 0 1 0 0.84 0 a 0.42 0.72 0 1 0 -0.84 0 Z'],
    core: ['M 5.29 -6.85 a 0.26 0.5 0 1 0 0.52 0 a 0.26 0.5 0 1 0 -0.52 0 Z'] },
  // SKYE: the mirrored sport glasses
  kite: { c: [126, 200, 255],
    glass: ['M 1.5 -8.05 C 2.9 -8.4 4.5 -8.3 5.35 -7.7 L 5.25 -6.45 C 4.45 -5.85 2.85 -5.8 1.8 -6.2 C 1.5 -6.8 1.45 -7.4 1.5 -8.05 Z'],
    line: ['M 1.7 -7.15 C 3.0 -7.45 4.4 -7.35 5.3 -7.05'] },
  // BULWARK: the headlamp, and a little light in the smoked glasses
  brick: { c: [255, 232, 186],
    glass: ['M 1.5 -8.0 C 2.9 -8.35 4.5 -8.25 5.4 -7.65 L 5.3 -6.35 C 4.5 -5.8 2.9 -5.75 1.85 -6.15 C 1.5 -6.75 1.45 -7.35 1.5 -8.0 Z'],
    core: ['M 4.95 -11.15 L 5.55 -11.2 L 5.6 -10.0 L 5.0 -9.95 Z'] },
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
