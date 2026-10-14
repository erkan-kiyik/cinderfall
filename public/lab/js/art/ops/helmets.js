// KOR LAB — operator helmets.
//
// Every operator's face is covered: a helmet or mask that carries the
// operator's identity (colour, crest, optics) and keeps the warm operator
// palette, so nothing reads like the Syndicate's steel-blue helmets with red
// visor slits. Head frame: origin at the neck base, facing +x, y down; the
// head spans about x −4.3…5, y −12.4…−2.
import { cel, fill, stroke, clip, blob, curve } from '../kit.js';
import { M, tone } from '../style.js';
import { NECK, HEAD } from './common.js';

const dot = (x, y, r) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

// glowing fill (lenses, visor slits, LEDs)
function glow(g, d, c, blur = 6) {
  g.save(); g.shadowColor = c; g.shadowBlur = blur; fill(g, d, c); g.restore();
}
// smoked visor glass: dark base, a soft gradient and two sharp reflections
function visorGlass(g, d, base, tint, x0, y0, x1, y1) {
  fill(g, d, base);
  clip(g, d, () => {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, tint + 'aa'); gr.addColorStop(0.45, tint + '22'); gr.addColorStop(1, tint + '66');
    g.fillStyle = gr; g.fill(new Path2D(d));
    fill(g, `M ${x0 + 0.6} ${y0 + 0.2} L ${x0 + 2.2} ${y0 + 0.2} L ${x0 + 0.4} ${y1} L ${x0 - 1.2} ${y1} Z`, '#ffffff', 0.18);
    fill(g, `M ${x0 + 2.8} ${y0 + 0.2} L ${x0 + 3.4} ${y0 + 0.2} L ${x0 + 1.6} ${y1} L ${x0 + 1.0} ${y1} Z`, '#ffffff', 0.12);
  });
}
// a neck gaiter instead of skin under the collar
function gaiter(g, t) {
  cel(g, NECK, t, { sh: 1.2, hl: 0 });
  clip(g, NECK, () => stroke(g, 'M -2 -2.2 L 2.2 -1.4', t.k, 0.22, 0.7));
}

// VEX — full-face assault helmet: charcoal shell, ember crest swept back
// like her old hair tips, a big smoked visor with an ember reflection.
export function vexHelmet(g, P) {
  const shell = tone('#4d5562', '#323843', '#22262e', '#0e1014');
  gaiter(g, P.scarf);
  const SHELL = 'M -4.9 -6.2 C -5.4 -10.4 -3.2 -14.2 0.8 -14.4 C 4.4 -14.6 6.2 -12.0 6.2 -9.2 L 6.0 -6.6 C 6.0 -4.4 5.4 -2.5 3.7 -1.7 L 0.9 -1.4 C -1.4 -1.6 -3.4 -2.8 -4.4 -4.4 Z';
  cel(g, SHELL, shell, { sh: 1.5, hl: 0.55 });
  clip(g, SHELL, () => {
    // ember band along the side and a panel seam
    fill(g, 'M -6 -8.6 C -3.0 -9.6 -0.6 -10.0 1.2 -10.1 L 1.2 -9.1 C -0.6 -9.0 -3.0 -8.6 -6 -7.6 Z', P.jacket.m);
    stroke(g, curve([[-4.0, -5.4], [-1.6, -4.6], [1.0, -4.2]]), shell.k, 0.24);
    stroke(g, curve([[-3.6, -12.0], [-0.6, -13.6], [3.0, -13.6]]), shell.l, 0.3, 0.8);
    // chin guard vents
    for (const y of [-3.6, -2.9]) stroke(g, `M 3.0 ${y} L 4.9 ${y - 0.2}`, shell.k, 0.26);
  });
  // the visor
  const VIS = 'M 1.2 -10.2 C 3.2 -10.7 5.4 -10.3 6.3 -9.0 L 6.4 -6.6 C 6.3 -5.5 5.7 -5.0 4.7 -4.9 L 1.6 -5.2 C 1.0 -6.6 0.9 -8.6 1.2 -10.2 Z';
  visorGlass(g, VIS, '#14161c', '#ff7a35', 1.2, -10.4, 6.4, -4.9);
  stroke(g, VIS, shell.k, 0.3);
  // swept crest
  const CREST = 'M -4.4 -11.0 C -3.8 -13.6 -1.4 -15.4 2.0 -15.3 L 1.4 -14.4 C -0.8 -14.4 -2.6 -13.2 -3.5 -11.2 Z';
  cel(g, CREST, P.tip, { sh: 0.4, hl: 0.3 });
  fill(g, 'M -5.6 -10.4 L -4.4 -11.2 L -3.6 -10.4 L -4.6 -9.6 Z', P.tip.d);
  // ear plate with vents and a small ember LED at its top
  const EAR = 'M -2.8 -8.2 C -2.8 -8.6 -2.5 -8.8 -2.1 -8.8 L -0.9 -8.8 C -0.5 -8.8 -0.3 -8.6 -0.3 -8.2 L -0.3 -5.0 C -0.3 -4.6 -0.5 -4.4 -0.9 -4.4 L -2.1 -4.4 C -2.5 -4.4 -2.8 -4.6 -2.8 -5.0 Z';
  cel(g, EAR, shell, { sh: 0.4, hl: 0.3 });
  for (const y of [-6.6, -5.8, -5.0]) stroke(g, `M -2.3 ${y} L -0.8 ${y}`, shell.k, 0.22);
  glow(g, dot(-1.55, -7.8, 0.3), P.tip.l, 4);
}

// HALE — high-cut ballistic helmet (tan), teal goggles, olive balaclava,
// a radio cup with a boom mic.
export function haleHelmet(g, P) {
  const cloth = tone('#5a5f4a', '#40443a', '#2d3029', '#151712');
  gaiter(g, cloth);
  // balaclava: a smooth hood of cloth over the whole head (no features)
  const BAL = 'M 0.6 -12.4 C 3.0 -12.4 4.6 -11.0 4.7 -9.2 L 5.0 -6.4 C 5.2 -4.6 4.7 -2.9 3.4 -2.4 C 2.0 -1.9 0.6 -2.4 -0.8 -3.6 C -2.2 -4.6 -3.8 -5.6 -4.0 -7.6 C -4.3 -10.4 -2.4 -12.4 0.6 -12.4 Z';
  cel(g, BAL, cloth, { sh: 1.1, hl: 0.35 });
  clip(g, BAL, () => {
    // knit texture and a mouth seam
    for (let y = -6.0; y < -2; y += 0.9) stroke(g, `M 0.6 ${y} L 5.4 ${y - 0.15}`, cloth.d, 0.16, 0.7);
    stroke(g, curve([[2.6, -4.2], [3.6, -4.0], [4.8, -4.2]]), cloth.k, 0.26);
  });
  // goggles
  stroke(g, 'M -4.2 -7.6 C -2.0 -8.0 0.2 -7.9 1.2 -7.6', M.black.m, 0.9);
  const GOG = 'M 0.7 -8.6 C 2.4 -9.1 4.5 -9.0 5.6 -8.3 C 5.8 -7.5 5.6 -6.6 5.0 -6.2 C 4.2 -6.0 3.6 -6.3 3.1 -6.6 C 2.6 -6.2 1.8 -6.0 1.1 -6.3 C 0.6 -6.9 0.5 -7.8 0.7 -8.6 Z';
  cel(g, GOG, M.black, { sh: 0.3, hl: 0.2 });
  const L1 = 'M 1.2 -8.2 C 2.0 -8.5 2.7 -8.4 2.9 -8.0 L 2.8 -6.9 C 2.3 -6.6 1.7 -6.6 1.3 -6.9 Z';
  const L2 = 'M 3.4 -8.3 C 4.2 -8.5 5.0 -8.3 5.2 -7.9 L 5.0 -6.8 C 4.5 -6.5 3.9 -6.6 3.5 -6.9 Z';
  for (const L of [L1, L2]) visorGlass(g, L, '#0b3536', '#3ee8e0', 1.2, -8.6, 5.2, -6.6);
  // high-cut helmet
  const H = 'M -4.8 -7.9 C -5.1 -11.6 -2.6 -14.3 0.9 -14.3 C 4.1 -14.3 5.8 -12.3 5.8 -10.0 L 5.2 -9.2 C 3.8 -9.7 1.8 -9.7 0.4 -9.2 C -1.0 -8.6 -2.8 -8.0 -4.8 -7.9 Z';
  cel(g, H, P.plate, { sh: 1.4, hl: 0.5 });
  clip(g, H, () => {
    fill(g, 'M -6 -10.6 L 6 -10.6 L 6 -9.9 L -6 -9.9 Z', P.plate.d, 0.8); // side rail
    for (let x = -3.6; x < 3.6; x += 1.2) fill(g, `M ${x} -10.5 L ${x + 0.6} -10.5 L ${x + 0.6} -10.0 L ${x} -10.0 Z`, P.plate.k, 0.7);
    stroke(g, curve([[-3.4, -12.4], [-0.4, -13.8], [3.2, -13.6]]), P.plate.l, 0.3, 0.8);
    fill(g, 'M -1.2 -13.6 L 1.0 -13.8 L 1.2 -12.6 L -1.0 -12.4 Z', P.pouch.d); // velcro patch
  });
  // NVG mount on the brow
  cel(g, 'M 3.4 -12.2 L 5.6 -12.0 L 5.8 -10.2 L 3.6 -10.2 Z', M.black, { sh: 0.3, hl: 0.2 });
  // radio cup with a teal LED and a boom mic to the mouth
  cel(g, ell(-1.5, -6.9, 1.55, 1.9), M.black, { sh: 0.4, hl: 0.3 });
  glow(g, dot(-1.5, -7.4, 0.34), P.teal.m, 5);
  stroke(g, curve([[-0.4, -5.6], [1.2, -3.8], [3.4, -3.4]]), M.black.m, 0.42);
  fill(g, ell(3.6, -3.45, 0.55, 0.42), M.black.d);
}

// MORROW — the hood stays; under it a full gas mask with two big glowing
// lilac lenses and a front filter.
export function morrowMask(g, P, HOOD) {
  gaiter(g, P.coat);
  const FACE = 'M -0.4 -10.4 C 2.0 -11.0 4.6 -10.6 5.6 -9.0 L 5.9 -6.0 C 6.7 -5.0 6.7 -3.3 5.7 -2.5 C 4.5 -1.4 2.4 -1.2 0.8 -1.8 C -0.3 -2.6 -0.9 -4.0 -0.9 -5.8 C -0.9 -7.6 -0.7 -9.2 -0.4 -10.4 Z';
  cel(g, FACE, P.mask, { sh: 1.2, hl: 0.45 });
  clip(g, FACE, () => {
    stroke(g, curve([[0.2, -3.6], [2.2, -2.6], [4.6, -2.8]]), P.mask.k, 0.24);
    stroke(g, curve([[-0.2, -9.6], [2.4, -10.2], [5.0, -9.2]]), P.mask.l, 0.26, 0.8);
  });
  const lens = (cx, cy, rx, ry) => {
    cel(g, ell(cx, cy, rx + 0.45, ry + 0.45), P.mask, { sh: 0.4, hl: 0.3 });
    stroke(g, ell(cx, cy, rx + 0.45, ry + 0.45), P.mask.k, 0.24);
    const L = ell(cx, cy, rx, ry);
    glow(g, L, P.lens.m, 9);
    clip(g, L, () => {
      fill(g, `M ${cx - rx} ${cy + ry * 0.15} L ${cx + rx} ${cy - ry * 0.35} L ${cx + rx} ${cy + ry} L ${cx - rx} ${cy + ry} Z`, P.lens.d);
      fill(g, ell(cx - rx * 0.35, cy - ry * 0.4, rx * 0.3, ry * 0.22), P.lens.l);
    });
  };
  lens(2.0, -7.6, 1.35, 1.2);
  lens(4.55, -7.5, 0.7, 1.05);
  // front filter and side valve
  const F = 'M 4.0 -4.8 L 6.4 -5.2 C 7.3 -5.0 7.4 -3.0 6.5 -2.7 L 4.2 -2.8 Z';
  cel(g, F, P.can, { sh: 0.5, hl: 0.35 });
  for (const x of [5.0, 5.7]) stroke(g, `M ${x} -4.9 L ${x} -2.8`, P.can.k, 0.22);
  stroke(g, 'M 6.6 -5.1 C 7.1 -4.4 7.1 -3.4 6.6 -2.8', P.lining.m, 0.4);
  cel(g, ell(0.2, -3.6, 0.9, 1.1), P.can, { sh: 0.4, hl: 0.3 });
  // the hood over everything above and behind
  cel(g, HOOD, P.coat, { sh: 1.2, hl: 0.5 });
  clip(g, HOOD, () => {
    fill(g, 'M 6.0 -11.2 C 4.6 -11.6 3.4 -11.4 2.4 -10.8 C 0.6 -9.8 -0.4 -7.6 -0.4 -5.4 C -0.4 -3.2 0.2 -0.6 1.2 1.8 L 2.6 1.8 C 1.2 -0.6 0.8 -3.2 0.8 -5.4 C 0.8 -7.6 1.8 -9.4 3.2 -10.2 C 4.0 -10.6 5.0 -10.8 6.0 -10.6 Z', P.coat.k, 0.75);
    stroke(g, curve([[-4.4, -11.0], [-1.6, -13.4], [2.6, -13.6]]), P.coat.l, 0.3, 0.8);
    stroke(g, curve([[-3.0, -9.0], [-3.6, -5.0], [-3.4, -1.0]]), P.coat.d, 0.3);
  });
}

// KITE — light recon helmet (white, sky stripe), a reflective sky visor,
// a dark face guard, the yellow headset with its antenna, and the auburn bob
// showing at the nape.
export function kiteHelmet(g, P) {
  const guard = tone('#5d6878', '#46505e', '#2f3743', '#151a21');
  gaiter(g, guard);
  // hair at the back, under the helmet
  const BOB = 'M -1.4 -3.0 C -2.0 -4.4 -2.2 -6.4 -1.6 -8.4 L -5.4 -8.4 C -5.6 -6.2 -5.0 -4.0 -3.9 -2.8 C -3.0 -2.4 -2.1 -2.5 -1.4 -3.0 Z';
  cel(g, BOB, P.hair, { sh: 0.7, hl: 0.35 });
  clip(g, BOB, () => stroke(g, curve([[-4.6, -7.6], [-4.2, -5.4], [-3.2, -3.4]]), P.hair.d, 0.26));
  // face guard over the mouth and chin
  const FG = 'M 0.4 -6.4 L 5.7 -6.2 C 6.0 -4.7 5.6 -3.1 4.3 -2.3 C 2.9 -1.6 1.2 -1.8 -0.1 -2.6 C -0.6 -3.8 -0.4 -5.2 0.4 -6.4 Z';
  cel(g, FG, guard, { sh: 0.8, hl: 0.35 });
  clip(g, FG, () => { for (const y of [-4.6, -3.7]) stroke(g, `M 2.8 ${y} L 5.4 ${y - 0.1}`, guard.k, 0.24); });
  // helmet shell
  const H = 'M -4.7 -8.2 C -4.9 -11.8 -2.4 -14.4 0.9 -14.4 C 4.3 -14.4 5.9 -12.2 5.9 -9.8 L 5.8 -9.0 L 0.2 -9.6 L -1.4 -8.2 Z';
  cel(g, H, P.coat, { sh: 1.3, hl: 0.5 });
  clip(g, H, () => {
    fill(g, 'M -1.2 -15 L 0.6 -15 L -0.6 -8 L -2.4 -8 Z', P.sky.m); // sky stripe
    stroke(g, curve([[-3.6, -12.0], [-0.4, -13.8], [3.4, -13.6]]), '#ffffff', 0.3, 0.9);
    stroke(g, 'M -4.6 -8.9 L 5.8 -9.3', P.coat.d, 0.3);
  });
  // wrap visor
  const VIS = 'M 0.2 -9.7 L 6.0 -9.9 C 6.4 -8.7 6.3 -7.1 5.8 -6.1 L 0.5 -6.1 C 0.1 -7.3 0.0 -8.5 0.2 -9.7 Z';
  visorGlass(g, VIS, '#123a66', '#8fd0ff', 0.2, -9.9, 6.3, -6.1);
  stroke(g, VIS, P.dark.k, 0.28);
  // targeting monocle ring on the near side
  stroke(g, ell(2.1, -7.9, 1.05, 0.95), P.yellow.m, 0.38);
  glow(g, dot(2.1, -7.9, 0.28), P.yellow.l, 4);
  // headset cup and antenna
  stroke(g, 'M -2.8 -8.6 L -4.6 -13.0', P.dark.m, 0.45);
  fill(g, dot(-4.6, -13.3, 0.5), P.yellow.m);
  const CUP = 'M -3.6 -8.6 C -3.6 -9.0 -3.3 -9.2 -2.9 -9.2 L -0.9 -9.2 C -0.5 -9.2 -0.2 -8.9 -0.2 -8.5 L -0.2 -5.0 C -0.2 -4.6 -0.5 -4.4 -0.9 -4.4 L -2.9 -4.4 C -3.3 -4.4 -3.6 -4.6 -3.6 -5.0 Z';
  cel(g, CUP, P.dark, { sh: 0.6, hl: 0.3 });
  fill(g, 'M -2.9 -8.5 L -0.9 -8.5 L -0.9 -5.1 L -2.9 -5.1 Z', P.yellow.m);
  fill(g, 'M -2.4 -7.9 L -1.4 -7.9 L -1.4 -5.7 L -2.4 -5.7 Z', P.yellow.d);
}

// BRICK — heavy helmet with a bolted red faceplate and a glowing amber T
// visor; hazard stripes on the brow.
export function brickHelmet(g, P) {
  gaiter(g, P.suit);
  g.save(); g.scale(1.06, 1.02);
  const SHELL = 'M -5.0 -5.0 C -5.6 -10.0 -3.4 -14.8 0.8 -15.0 C 5.0 -15.2 6.8 -12.4 6.8 -9.0 L 6.6 -4.6 C 6.4 -2.6 5.2 -1.4 3.4 -1.2 L -0.2 -1.2 C -2.6 -1.6 -4.4 -2.8 -5.0 -5.0 Z';
  cel(g, SHELL, P.steel, { sh: 1.6, hl: 0.55 });
  clip(g, SHELL, () => {
    stroke(g, curve([[-3.8, -12.6], [-0.6, -14.2], [3.6, -14.0]]), P.steel.l, 0.32, 0.8);
    // hazard band on the brow
    clip(g, 'M -6 -12.4 L 7 -12.4 L 7 -11.2 L -6 -11.2 Z', () => {
      fill(g, 'M -6 -12.4 L 7 -12.4 L 7 -11.2 L -6 -11.2 Z', P.hazard.m);
      for (let x = -7; x < 8; x += 1.6) fill(g, `M ${x} -11.2 L ${x + 0.8} -11.2 L ${x + 2.0} -12.4 L ${x + 1.2} -12.4 Z`, '#1a1c20');
    });
    stroke(g, curve([[-4.4, -4.4], [-2.0, -3.4], [0.6, -3.0]]), P.steel.k, 0.26);
  });
  // faceplate
  const FP = 'M 1.0 -10.8 C 3.6 -11.4 6.4 -10.8 7.0 -8.9 L 7.0 -4.4 C 6.8 -2.8 5.6 -1.8 4.0 -1.6 L 1.4 -1.8 C 0.8 -4.6 0.6 -8.0 1.0 -10.8 Z';
  cel(g, FP, P.plate, { sh: 1.2, hl: 0.5 });
  stroke(g, FP, P.plate.k, 0.3);
  // T visor
  const TV = 'M 2.0 -8.7 L 6.95 -8.75 L 6.95 -7.7 L 5.05 -7.7 L 5.05 -4.4 L 4.15 -4.4 L 4.15 -7.7 L 2.0 -7.7 Z';
  fill(g, TV, '#2a1406');
  glow(g, 'M 2.3 -8.45 L 6.8 -8.5 L 6.8 -8.0 L 4.85 -8.0 L 4.85 -4.7 L 4.35 -4.7 L 4.35 -8.0 L 2.3 -8.0 Z', P.hazard.m, 7);
  for (const [x, y] of [[1.8, -10.0], [6.3, -10.0], [2.2, -2.6], [5.6, -2.4]]) fill(g, dot(x, y, 0.3), P.plate.k);
  // ear armour: a vented plate, no round "eye"
  const EAR = 'M -3.6 -8.8 L -0.4 -9.0 C 0.1 -7.6 0.1 -5.2 -0.4 -3.8 L -2.9 -3.6 C -3.6 -5.0 -3.9 -7.2 -3.6 -8.8 Z';
  cel(g, EAR, P.steel, { sh: 0.5, hl: 0.3 });
  for (const y of [-7.6, -6.6, -5.6, -4.6]) stroke(g, `M -3.1 ${y} L -0.7 ${y - 0.1}`, P.steel.k, 0.3);
  g.restore();
}

export { blob };
