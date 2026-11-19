// KOR — Ocaksan's flag (docs §10.43). The company that lit the first furnace
// in 1891 and built the city round its works: a charcoal banner, the logo (a
// ring with the furnace flame in it) in ember orange, the name in cream
// stencil, the founding year, an orange stripe along the weighted hem. Hung
// from a turned pole on a cord. Vorsa took it down from the tower; in the
// basement it hangs on the wall beside the map (art/env/hideout.js); the
// finale card paints it as it goes back up the tower's mast.
import { fill, stroke, clip, rng } from '../kit.js';
import { texture } from '../tex.js';
import { letters } from './city.js';

const FIELD = '#2b2623', CREAM = '#e6dcc4', EMBER = '#e2692f', BRASS = '#b8913f';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;

// the logo alone: a ring, the flame standing in it, a bar under the flame
export function ocaksanLogo(g, cx, cy, R, c = EMBER, hi = '#ffc07a') {
  stroke(g, ell(cx, cy, R, R), c, R * 0.2);
  const f = (k, col) => fill(g, `M ${cx} ${cy - R * 0.62 * k} C ${cx + R * 0.48 * k} ${cy - R * 0.12 * k} ${cx + R * 0.36 * k} ${cy + R * 0.34} ${cx} ${cy + R * 0.38} C ${cx - R * 0.36 * k} ${cy + R * 0.34} ${cx - R * 0.48 * k} ${cy - R * 0.12 * k} ${cx} ${cy - R * 0.62 * k} Z`, col);
  f(1, c); f(0.55, hi);
  fill(g, rect(cx - R * 0.42, cy + R * 0.48, cx + R * 0.42, cy + R * 0.6), c);
}

// x: the middle; y: the pole; w: the width; L: from the pole to the hem.
// o.light: -1 lit from the left, 1 from the right; o.tex: the weave (off where
// the texture tiles are not made); o.wall: its shadow on a wall behind it
export function companyFlag(g, x, y, w, L, o = {}) {
  const { light = -1, tex = true, wall = true, seed = 5 } = o;
  const r = rng(seed), hw = w / 2, top = y + w * 0.03, bot = y + L;
  const C = rect(x - hw, top, x + hw, bot);
  if (wall) fill(g, rect(x - hw - light * w * 0.07, top + w * 0.06, x + hw - light * w * 0.07, bot + w * 0.06), '#000', 0.3);

  fill(g, C, FIELD);
  clip(g, C, () => {
    // a thin cream rule inside the edge, the orange stripe over the hem
    stroke(g, rect(x - hw + w * 0.07, top + w * 0.07, x + hw - w * 0.07, bot - w * 0.2), CREAM, w * 0.018, 0.55);
    fill(g, rect(x - hw, bot - w * 0.14, x + hw, bot - w * 0.06), EMBER);
    // the logo, the name, the year
    const ly = top + L * 0.3;
    ocaksanLogo(g, x, ly, w * 0.27);
    letters(g, 'OCAKSAN', x, ly + w * 0.68, w * 0.17, CREAM, { kind: 'sten', align: 'center', jit: 0, track: 0.06, seed: 93 });
    fill(g, rect(x - w * 0.18, ly + w * 0.78, x + w * 0.18, ly + w * 0.8), EMBER, 0.9);
    letters(g, 'KURULUŞ 1891', x, ly + w * 0.98, w * 0.085, CREAM, { kind: 'print', align: 'center', jit: 0, track: 0.12, seed: 94 });

    // the cloth hangs in folds, darker toward the hem
    const fo = g.createLinearGradient(x - hw, 0, x + hw, 0);
    [[0, 0.3], [0.17, -0.07], [0.36, 0.2], [0.58, -0.06], [0.79, 0.18], [1, 0.3]].forEach(([t, k]) => fo.addColorStop(t, k > 0 ? `rgba(0,0,0,${k})` : `rgba(255,236,214,${-k})`));
    fill(g, C, fo);
    const dn = g.createLinearGradient(0, top, 0, bot); dn.addColorStop(0, 'rgba(0,0,0,0)'); dn.addColorStop(1, 'rgba(0,0,0,0.25)');
    fill(g, C, dn);
    const li = g.createLinearGradient(x + light * hw, 0, x - light * hw, 0); li.addColorStop(0, 'rgba(255,190,120,0.2)'); li.addColorStop(0.6, 'rgba(255,190,120,0)');
    fill(g, C, li);
    for (let i = 0; i < 4; i++) fill(g, ell(x - hw + r() * w, top + L * (0.2 + r() * 0.7), w * (0.06 + r() * 0.08), w * (0.05 + r() * 0.06)), '#000', 0.1);
    if (tex) texture(g, 'canvas', 0.4, 1.2);
  });

  // the weighted hem: a thin steel rod with caps
  fill(g, rect(x - hw - w * 0.03, bot - w * 0.02, x + hw + w * 0.03, bot + w * 0.03), '#3a3836');
  fill(g, rect(x - hw - w * 0.03, bot - w * 0.02, x + hw + w * 0.03, bot - w * 0.005), '#8a8680', 0.6);

  // the sleeve over the pole, the pole, its brass ends, the cord to the nail
  fill(g, rect(x - hw, y - w * 0.05, x + hw, top + w * 0.03), '#1c1917');
  const pl = x - hw - w * 0.14, pr = x + hw + w * 0.14, pt = w * 0.035;
  stroke(g, `M ${pl} ${y - w * 0.32} L ${x} ${y - w * 0.5} L ${pr} ${y - w * 0.32}`, '#8a6a34', w * 0.022);
  stroke(g, `M ${pl + w * 0.05} ${y} L ${pl} ${y - w * 0.32} M ${pr - w * 0.05} ${y} L ${pr} ${y - w * 0.32}`, '#8a6a34', w * 0.022);
  fill(g, ell(x, y - w * 0.5, w * 0.025, w * 0.025), '#6a6660');
  fill(g, rect(pl, y - pt, pr, y + pt), '#3e2a1a');
  fill(g, rect(pl, y - pt, pr, y - pt * 0.3), '#7a5a3a', 0.6);
  for (const ex of [pl, pr]) { fill(g, ell(ex, y, w * 0.05, w * 0.05), BRASS); fill(g, ell(ex - w * 0.015, y - w * 0.015, w * 0.016, w * 0.016), '#f0d890', 0.7); }
}
