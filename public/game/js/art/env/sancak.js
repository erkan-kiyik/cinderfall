// KOR — the city's banner (docs §10.42). A gonfalon: deep red wool with a
// cream border, the blast furnace and its flame over the year the first
// furnace was lit, cut to a swallow tail with a gold fringe, hung from a
// turned pole on a cord. Older than Vorsa and older than KOR; Vorsa banned it
// (the notice on the governor's office says so). In the basement it hangs on
// the wall beside the map (art/env/hideout.js); the finale card paints it as
// it goes up over the governor's office.
import { fill, stroke, clip, rng } from '../kit.js';
import { texture } from '../tex.js';
import { letters } from './city.js';

const RED = '#7a1f18', CREAM = '#e3d6b8', GOLD = '#b8913f', EMBER = '#e2692f';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;

// x: the middle; y: the pole; w: the width; L: from the pole to a tail's tip.
// o.light: -1 lit from the left, 1 from the right; o.tex: the weave (off where
// the texture tiles are not made); o.wall: its shadow on a wall behind it
export function sancak(g, x, y, w, L, o = {}) {
  const { light = -1, tex = true, wall = true, seed = 5 } = o;
  const r = rng(seed), hw = w / 2, notch = w * 0.42, top = y + w * 0.03;
  const cloth = (dx = 0, dy = 0) => poly([[x - hw + dx, top + dy], [x + hw + dx, top + dy], [x + hw + dx, y + L + dy], [x + dx, y + L - notch + dy], [x - hw + dx, y + L + dy]]);
  const C = cloth();
  // its shadow on the wall, a little down and away from the light
  if (wall) fill(g, cloth(-light * w * 0.07, w * 0.06), '#000', 0.3);

  fill(g, C, RED);
  clip(g, C, () => {
    // the border: a red margin at the edge, then a cream band inside it
    stroke(g, C, CREAM, w * 0.17);
    stroke(g, C, RED, w * 0.09);

    // the furnace: the stack tapering up to its top, a stove either side,
    // the ground line; the flame out of the top, the tap hole glowing
    const s = w * 0.3, ex = x, ey = top + L * 0.36;
    fill(g, poly([[ex - s * 0.42, ey + s * 0.9], [ex - s * 0.26, ey - s * 0.55], [ex + s * 0.26, ey - s * 0.55], [ex + s * 0.42, ey + s * 0.9]]), CREAM);
    fill(g, rect(ex - s * 0.2, ey - s * 0.8, ex + s * 0.2, ey - s * 0.5), CREAM);
    for (const side of [-1, 1]) {
      const a = ex + side * s * 0.62, b = ex + side * s * 0.96, x0 = Math.min(a, b), x1 = Math.max(a, b), cx = (x0 + x1) / 2, rx = (x1 - x0) / 2;
      fill(g, rect(x0, ey - s * 0.15, x1, ey + s * 0.9), CREAM);
      fill(g, ell(cx, ey - s * 0.15, rx, rx * 0.9), CREAM);
      stroke(g, `M ${side < 0 ? x1 : x0} ${ey + s * 0.2} L ${ex + side * s * 0.36} ${ey + s * 0.05}`, CREAM, s * 0.07);
    }
    fill(g, rect(ex - s * 1.1, ey + s * 0.88, ex + s * 1.1, ey + s * 1.04), CREAM);
    fill(g, ell(ex, ey + s * 0.5, s * 0.1, s * 0.14), EMBER);
    const f = (k, c) => fill(g, `M ${ex} ${ey - s * (0.8 + 0.75 * k)} C ${ex + s * 0.36 * k} ${ey - s * (0.8 + 0.4 * k)} ${ex + s * 0.3 * k} ${ey - s * 0.86} ${ex} ${ey - s * 0.8} C ${ex - s * 0.3 * k} ${ey - s * 0.86} ${ex - s * 0.36 * k} ${ey - s * (0.8 + 0.4 * k)} ${ex} ${ey - s * (0.8 + 0.75 * k)} Z`, c);
    f(1, EMBER); f(0.55, '#ffc07a');
    // the year the first furnace was lit, and a cream rule over it
    fill(g, rect(ex - s * 0.9, ey + s * 1.42, ex + s * 0.9, ey + s * 1.5), CREAM, 0.9);
    letters(g, '1891', ex, ey + s * 2.32, s * 0.72, CREAM, { kind: 'sten', align: 'center', jit: 0, track: 0.14, seed: 91 });

    // the wool hangs in folds: dark troughs, lit ridges, darker toward the tails
    const fo = g.createLinearGradient(x - hw, 0, x + hw, 0);
    [[0, 0.3], [0.17, -0.08], [0.36, 0.22], [0.58, -0.07], [0.79, 0.2], [1, 0.32]].forEach(([t, k]) => fo.addColorStop(t, k > 0 ? `rgba(20,4,2,${k})` : `rgba(255,226,200,${-k})`));
    fill(g, C, fo);
    const dn = g.createLinearGradient(0, top, 0, y + L); dn.addColorStop(0, 'rgba(0,0,0,0)'); dn.addColorStop(0.55, 'rgba(0,0,0,0.05)'); dn.addColorStop(1, 'rgba(0,0,0,0.3)');
    fill(g, C, dn);
    // the light it hangs in, warm on one side
    const li = g.createLinearGradient(x + light * hw, 0, x - light * hw, 0); li.addColorStop(0, 'rgba(255,190,120,0.22)'); li.addColorStop(0.6, 'rgba(255,190,120,0)');
    fill(g, C, li);
    // age: the red gone brown in patches, a water mark low down
    for (let i = 0; i < 5; i++) fill(g, ell(x - hw + r() * w, top + L * (0.15 + r() * 0.75), w * (0.06 + r() * 0.1), w * (0.05 + r() * 0.08)), '#3a1a10', 0.1);
    stroke(g, `M ${x - hw} ${y + L * 0.86} C ${x - hw * 0.3} ${y + L * 0.83} ${x + hw * 0.2} ${y + L * 0.89} ${x + hw} ${y + L * 0.85}`, '#2a0e08', w * 0.02, 0.25);
    if (tex) texture(g, 'canvas', 0.4, 1.2);
  });

  // the gold fringe along the tails, a tassel at each tip
  const fr = w * 0.07;
  for (const [ax, ay, bx, by] of [[x - hw, y + L, x, y + L - notch], [x, y + L - notch, x + hw, y + L]]) {
    for (let t = 0.02; t < 1; t += 0.06) { const px = ax + (bx - ax) * t, py = ay + (by - ay) * t; stroke(g, `M ${px} ${py} l ${(r() - 0.5) * fr * 0.3} ${fr}`, GOLD, w * 0.018, 0.9); }
  }
  for (const tx of [x - hw, x + hw]) {
    fill(g, ell(tx, y + L + w * 0.02, w * 0.035, w * 0.035), GOLD);
    for (const d of [-1, 0, 1]) stroke(g, `M ${tx} ${y + L + w * 0.04} l ${d * w * 0.015} ${w * 0.13}`, GOLD, w * 0.016);
  }

  // the sleeve over the pole, the pole, its brass ends, the cord to the nail
  fill(g, rect(x - hw, y - w * 0.05, x + hw, top + w * 0.03), '#5a1610');
  for (let k = 0; k < 5; k++) fill(g, rect(x - hw + (k + 0.5) * (w / 5) - w * 0.006, y - w * 0.05, x - hw + (k + 0.5) * (w / 5) + w * 0.006, top + w * 0.03), '#000', 0.18);
  const pl = x - hw - w * 0.14, pr = x + hw + w * 0.14, pt = w * 0.035;
  stroke(g, `M ${pl} ${y - w * 0.32} L ${x} ${y - w * 0.5} L ${pr} ${y - w * 0.32}`, '#8a6a34', w * 0.022);
  stroke(g, `M ${pl + w * 0.05} ${y} L ${pl} ${y - w * 0.32} M ${pr - w * 0.05} ${y} L ${pr} ${y - w * 0.32}`, '#8a6a34', w * 0.022);
  fill(g, ell(x, y - w * 0.5, w * 0.025, w * 0.025), '#6a6660');
  fill(g, rect(pl, y - pt, pr, y + pt), '#3e2a1a');
  fill(g, rect(pl, y - pt, pr, y - pt * 0.3), '#7a5a3a', 0.6);
  for (const ex of [pl, pr]) { fill(g, ell(ex, y, w * 0.05, w * 0.05), GOLD); fill(g, ell(ex - w * 0.015, y - w * 0.015, w * 0.016, w * 0.016), '#f0d890', 0.7); }
}
