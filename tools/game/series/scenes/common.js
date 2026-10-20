// KOR — series: what every scene shares: colour temperatures, the vector
// helpers, a city of dark blocks with lit windows for the far distance.
import { kelvin, rng } from '../../../../public/game/js/cine/noise.js';
export { wall, slab, jersey, prismX, obox, bar } from '../../plate/scenes.js';

export const K = (k, s = 1) => kelvin(k).map((v) => (v / 255) ** 2.2 * s);
export const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k], lerp: (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};
// where a camera at p must turn to look at q
export function aim(p, q) { const d = V.sub(q, p); return { yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])) }; }
// a ring of capsules (a pipe bent round): centre, radius, height, pipe radius, segments
export function ring(c, R, y, r, n, m, o) {
  const out = [];
  for (let k = 0; k < n; k++) { const a0 = (k / n) * 2 * Math.PI, a1 = ((k + 1) / n) * 2 * Math.PI; out.push({ cap: [c[0] + R * Math.cos(a0), y, c[1] + R * Math.sin(a0), c[0] + R * Math.cos(a1), y, c[1] + R * Math.sin(a1), r], m, o }); }
  return out;
}
// a far town: blocks of flats in rows, a window grid on each, a few lit (material 'flats')
export function town(seed, { x0, x1, z0, z1, hMin = 12, hMax = 45, n = 60, avoid = null }) {
  const r = rng(seed), out = [];
  for (let k = 0; k < n; k++) {
    const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0), w = 14 + r() * 30, d = 10 + r() * 14, h = hMin + r() * r() * (hMax - hMin);
    if (avoid && avoid(x, z)) continue;
    out.push({ box: [x - w / 2, 0, z - d / 2, x + w / 2, h, z + d / 2], m: 'flats', o: { seed: k * 13 + seed } });
  }
  return out;
}
