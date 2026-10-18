// BULWARK — heavy. Forty-seven; drove a gantry crane on the harbour for
// twenty years (docs/KOR_STORY_CINEMATIC.md §9.2, painted per §10.1). The
// biggest of them: a faded safety-orange work jacket with two reflective
// bands, oil on it; over the chest and on the near shoulder, corrugated plate
// cut from the door of one of Vanta's own containers, its blue paint and white
// code stencils still on it, held on with yellow ratchet straps; navy work
// coveralls with reflective at the knee; thick buff leather gloves; big
// steel-toed boots. A faded yellow hard hat with a headlamp, smoked safety
// glasses, and a half-face mask with two magenta filters; grey stubble round
// it. Built on the body standard in body.js, wider everywhere.
import { M, tone, mat } from '../style.js';
import {
  cel, fill, stroke, clip, blob, curve, fold,
  UPPER, FORE, THIGH, SHIN, PELVIS,
  glove, boot, headShape, skinGlaze, neck, softHair, korBand, stitch, rivet, buckle, grime, scuffs,
} from './body.js';

const PAL = {
  jacket: mat(tone('#f2894a', '#d6632b', '#a2451b', '#4e1e09'), 'canvas', 0.8),
  tapeS: tone('#f1f3f3', '#c6cbce', '#90969b', '#4b4f53'),
  blue: mat(tone('#6f97b8', '#4c7596', '#34546f', '#152637'), 'paint', 0.85),
  rust: tone('#b0663a', '#8a4a26', '#5e3118', '#2a1409'),
  suit: mat(tone('#435069', '#2f394d', '#202737', '#0d1018'), 'canvas', 0.6),
  hat: mat(tone('#f2de96', '#d6ba60', '#a1873a', '#52421a'), 'paint', 0.5),
  mask: mat(tone('#505357', '#36393d', '#25272a', '#0e0f10'), 'rubber', 0.6),
  filter: mat(tone('#f290ce', '#d2489e', '#983272', '#4a1336'), 'rubber', 0.45),
  glove: mat(tone('#d8ba8d', '#b08e62', '#806541', '#3e301e'), 'leather', 0.85),
  boot: mat(tone('#735944', '#503d2e', '#35281e', '#16100b'), 'leather', 0.65),
  toe: mat(tone('#b0aca5', '#85817b', '#5c5954', '#24221f'), 'steel', 0.5),
  sole: mat(tone('#3d3935', '#29251f', '#1a1714', '#0b0908'), 'rubber', 0.6),
  strap: mat(tone('#f2cd55', '#d4a72d', '#9c7819', '#4c3a0a'), 'nylon', 0.6),
  steel: mat(tone('#b4b8ba', '#868b8f', '#5d6266', '#282b2e'), 'steel', 0.6),
  black: mat(tone('#45474b', '#2e3033', '#1f2023', '#0c0d0e'), 'rubber', 0.5),
  skin: mat(tone('#e0a67f', '#bd825d', '#8f5b3f', '#4e2e1e'), 'skin', 0.45),
};
const OIL = 'rgba(24,18,12,0.5)';

// corrugated container steel: the ribs run across `dir` (the clip is the plate)
function corrugate(g, x0, x1, y0, y1, step = 1.5) {
  for (let x = x0; x < x1; x += step) {
    fill(g, `M ${x} ${y0} L ${x + step * 0.42} ${y0} L ${x + step * 0.42} ${y1} L ${x} ${y1} Z`, PAL.blue.l, 0.38);
    fill(g, `M ${x + step * 0.5} ${y0} L ${x + step * 0.62} ${y0} L ${x + step * 0.62} ${y1} L ${x + step * 0.5} ${y1} Z`, PAL.blue.k, 0.42);
  }
}
// rust: blooms along an edge and runs down from it
function rust(g, pts) {
  for (const [x, y, r, run = 0] of pts) {
    fill(g, `M ${x - r} ${y} a ${r} ${r * 0.7} 0 1 0 ${2 * r} 0 a ${r} ${r * 0.7} 0 1 0 ${-2 * r} 0 Z`, PAL.rust.m, 0.75);
    if (run) fill(g, `M ${x - r * 0.3} ${y} L ${x + r * 0.3} ${y} L ${x + r * 0.1} ${y + run} L ${x - r * 0.05} ${y + run} Z`, PAL.rust.d, 0.55);
  }
}
// a ratchet strap's steel ratchet
function ratchet(g, x, y, a = 0) {
  g.save(); g.translate(x, y); g.rotate(a);
  cel(g, 'M -1.2 -0.7 L 1.2 -0.7 L 1.2 0.7 L -1.2 0.7 Z', PAL.steel, { sh: 0.3, hl: 0.25, lw: 0.2 });
  for (let i = -0.8; i < 0.9; i += 0.4) stroke(g, `M ${i} -0.6 L ${i} 0.6`, PAL.steel.d, 0.1);
  cel(g, 'M -0.3 -1.1 L 0.4 -1.1 L 0.4 -0.6 L -0.3 -0.6 Z', PAL.black, { sh: 0.1, hl: 0.1, lw: 0.14 });
  g.restore();
}

function backFar(g) {
  // the far shoulder's plate peeking over the far shoulder
  const FP = blob([[2.6, -24.6], [7.0, -25.6], [10.4, -23.0], [10.6, -19.2], [6.6, -18.8], [3.2, -20.6]]);
  cel(g, FP, PAL.blue, { sh: 0.9, hl: 0.4 });
  clip(g, FP, () => { corrugate(g, 2, 11, -26, -18); rust(g, [[9.6, -21.0, 0.6, 1.2]]); });
}

// --- torso -------------------------------------------------------------------------------
const SUIT = blob([[-9.6, -20.6], [-5.8, -23.3], [0.6, -23.9], [4.9, -23.3], [7.6, -21.0], [8.4, -16.6], [7.8, -11.0], [7.0, -5.4], [7.0, -1.0], [-7.0, -0.8], [-7.8, -6.4], [-9.2, -13.0]]);
const PLATE = blob([[-4.2, -21.4], [1.4, -22.2], [6.6, -21.2], [8.2, -17.0], [8.0, -11.8], [7.2, -9.6], [0.8, -9.0], [-4.0, -9.6], [-4.8, -14.8]]);
function torso(g) {
  cel(g, blob([[-6.8, -4.8], [6.8, -4.9], [7.0, -1.0], [4.6, 1.8], [0.4, 2.4], [-4.4, 1.8], [-7.0, -1.0]]), PAL.suit, { sh: 1.0, hl: 0.4 });
  cel(g, SUIT, PAL.jacket, { sh: 2.4, hl: 0.6 });
  clip(g, SUIT, () => {
    // the two bands, the zip, oil from twenty years of cranes
    for (const y of [-16.6, -9.6]) {
      cel(g, `M -11 ${y} L 10 ${y - 0.3} L 10 ${y + 1.4} L -11 ${y + 1.7} Z`, PAL.tapeS, { sh: 0.2, hl: 0.2, line: false, ao: 0.1 });
      stitch(g, `M -11 ${y + 0.12} L 10 ${y - 0.18}`, PAL.tapeS.d, 0.06, 0.6);
      stitch(g, `M -11 ${y + 1.58} L 10 ${y + 1.28}`, PAL.tapeS.d, 0.06, 0.6);
    }
    // the front zip under its placket, the teeth showing at the open neck
    fill(g, 'M 5.4 -22 C 5.6 -15 5.4 -8 5.6 -1 L 7.4 -1 L 7.4 -22 Z', PAL.jacket.d, 0.45);
    stroke(g, 'M 5.4 -22 C 5.6 -15 5.4 -8 5.6 -1', PAL.jacket.k, 0.3);
    stitch(g, 'M 5.0 -22 C 5.2 -15 5.0 -8 5.2 -1', PAL.jacket.l, 0.07, 0.6);
    for (let y = -21.4; y < -19; y += 0.3) stroke(g, `M 5.5 ${y} l 0.3 0`, PAL.steel.m, 0.1);
    stitch(g, curve([[-6.2, -20.4], [-6.8, -14.4], [-6.4, -8.4], [-6.6, -1.4]]), PAL.jacket.l, 0.08, 0.6);
    for (const [x, y, rx, ry] of [[-5.2, -12.6, 1.4, 0.9], [-3.4, -6.0, 0.9, 1.3], [4.6, -4.0, 1.1, 0.7], [-7.0, -18.8, 0.7, 0.5]]) {
      const og = g.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry)); og.addColorStop(0, OIL); og.addColorStop(0.7, 'rgba(24,18,12,0.25)'); og.addColorStop(1, 'rgba(24,18,12,0)');
      g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = og; g.fillRect(x - rx, y - rx, rx * 2, rx * 2); g.restore();
    }
    // the hip pocket, its flap; folds; grime low down
    cel(g, 'M -6.6 -7.6 L -2.6 -7.8 L -2.4 -1.8 C -3.8 -1.4 -5.4 -1.4 -6.5 -1.7 Z', PAL.jacket, { sh: 0.5, hl: 0.3, lw: 0.26, ao: 0.3 });
    cel(g, 'M -6.8 -8.0 L -2.4 -8.2 L -2.4 -6.0 C -3.8 -5.6 -5.4 -5.6 -6.7 -5.9 Z', PAL.jacket, { sh: 0.4, hl: 0.25, lw: 0.24 });
    stitch(g, 'M -6.6 -6.3 C -5.4 -6.0 -3.8 -6.0 -2.6 -6.4', PAL.jacket.l, 0.07, 0.6);
    fold(g, [[-6.4, -14.2], [-5.6, -11.6], [-6.0, -8.8]], PAL.jacket, 0.3);
    grime(g, -8, 0, 'rgba(50,30,16,0.45)');
  });
  // the container plate: blue corrugated steel, cut with a torch, the code stencilled on it
  cel(g, PLATE, PAL.blue, { sh: 1.6, hl: 0.5 });
  clip(g, PLATE, () => {
    corrugate(g, -5, 9, -23, -8);
    // the port's own code (owner LMN, serial, check digit), the size-type and gross under it;
    // set large and scaled down so the small letters keep their shapes
    const code = (txt, x, y, px, w = 700) => { g.save(); g.translate(x, y); g.scale(1 / 40, 1 / 40); g.font = `${w} ${px * 40}px 'Barlow Condensed', sans-serif`; g.fillText(txt, 0, 0); g.restore(); };
    g.save(); g.fillStyle = 'rgba(236,232,222,0.82)'; g.textBaseline = 'alphabetic';
    code('LMNU', 3.3, -18.9, 1.45); code('482113 7', 3.3, -17.4, 1.2); code('22G1', 4.1, -16.15, 0.72, 600);
    g.restore();
    // the white paint flaking off the code, the torch-cut edge burnt dark, rust round it
    for (const [x, y] of [[7.3, -19.4], [6.9, -16.6], [-1.2, -18.2]]) fill(g, `M ${x} ${y} l 0.5 0.1 l -0.15 0.45 l -0.45 -0.1 Z`, PAL.blue.m);
    stroke(g, curve([[-4.4, -20.6], [-4.6, -15.0], [-4.0, -10.0]]), PAL.rust.k, 0.6, 0.6);
    rust(g, [[-3.8, -19.6, 0.7, 1.6], [-4.2, -13.2, 0.6, 1.2], [7.4, -12.6, 0.5, 1.4], [3.0, -9.6, 0.8], [6.4, -20.8, 0.5, 1.0]]);
    // the lock rod's bracket still bolted to it
    cel(g, 'M 3.6 -15.2 L 6.2 -15.2 L 6.2 -12.6 L 3.6 -12.6 Z', PAL.steel, { sh: 0.3, hl: 0.25, lw: 0.22 });
    for (const [x, y] of [[4.0, -14.8], [5.8, -14.8], [4.0, -13.0], [5.8, -13.0]]) rivet(g, x, y, 0.2, PAL.steel);
    stroke(g, curve([[-3.6, -21.0], [1.4, -21.7], [6.4, -20.8]]), PAL.blue.l, 0.24, 0.6);
  });
  // the ratchet straps: over the near shoulder and round the body
  const S1 = 'M -4.6 -21.0 L -2.8 -21.6 L -1.0 -24.2 L -2.8 -24.4 Z';
  cel(g, S1, PAL.strap, { sh: 0.3, hl: 0.2, lw: 0.24 });
  const S2 = 'M -9.6 -12.4 C -4 -12.8 3 -12.8 8.6 -12.2 L 8.6 -10.8 C 3 -11.4 -4 -11.4 -9.6 -11.0 Z';
  cel(g, S2, PAL.strap, { sh: 0.3, hl: 0.2, lw: 0.24 });
  clip(g, S2, () => { stitch(g, 'M -9.6 -12.1 C -4 -12.5 3 -12.5 8.6 -11.9', PAL.strap.d, 0.06, 0.7); grime(g, -13, -10.4, OIL); });
  ratchet(g, 1.6, -11.6);
}

function chest(g) {
  // the jacket's collar, up, and the mask's hose clip
  const COLLAR = blob([[-5.2, -22.0], [-4.8, -25.2], [-1.4, -26.2], [2.6, -25.8], [4.6, -24.6], [4.6, -22.2], [0.6, -21.6]]);
  cel(g, COLLAR, PAL.jacket, { sh: 0.8, hl: 0.4 });
  clip(g, COLLAR, () => { stitch(g, curve([[-4.8, -23.0], [-0.6, -24.2], [4.4, -23.2]]), PAL.jacket.l, 0.07, 0.6); grime(g, -25, -21.6, OIL); });
  // the dock pass on its lanyard, the photo long gone
  stroke(g, 'M 1.4 -22.0 L 2.6 -16.6', '#2c4f7a', 0.22);
  g.save(); g.translate(2.8, -15.2); g.rotate(-0.08);
  cel(g, 'M -1.0 -1.4 L 1.0 -1.4 L 1.0 1.4 L -1.0 1.4 Z', mat(tone('#f2efe6', '#d8d3c6', '#aaa497', '#5a5649'), 'paint', 0.3), { sh: 0.2, hl: 0.1, lw: 0.14 });
  fill(g, 'M -0.7 -1.0 L 0.1 -1.0 L 0.1 0.0 L -0.7 0.0 Z', '#9aa3ad');
  for (let i = 0; i < 3; i++) fill(g, `M -0.7 ${0.3 + i * 0.3} l 1.3 0 l 0 0.12 l -1.3 0 Z`, '#55524c');
  g.restore();
  // the belt of the coveralls showing under the jacket, a tape measure on it
  cel(g, 'M -7.0 -1.4 C -2 -1.8 3 -1.8 7.0 -1.5 L 7.0 0.2 C 3 -0.1 -2 -0.1 -7.0 0.3 Z', PAL.black, { sh: 0.3, hl: 0.2 });
  cel(g, 'M -6.6 -2.2 L -3.8 -2.3 L -3.6 1.0 L -6.4 1.1 Z', PAL.strap, { sh: 0.4, hl: 0.25, lw: 0.24 });
  fill(g, 'M -6.0 -1.6 L -4.2 -1.7 L -4.1 0.4 L -5.9 0.5 Z', PAL.black.m, 0.85);
  buckle(g, 2.6, -1.8, 1.4, 2.2, PAL.steel);
}

// --- arms ------------------------------------------------------------------------------------
function upper(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.3, 1);
  cel(g, UPPER, t(PAL.jacket), { sh: 1.6, hl: 0.5 });
  clip(g, UPPER, () => { fold(g, [[-1.8, 8.8], [-0.4, 9.7], [1.3, 9.9]], t(PAL.jacket)); grime(g, 4, 12, OIL); });
  if (!ctx.far) korBand(g, t(PAL.black));
  g.restore();
  if (!ctx.far) {
    // the shoulder plate: a curved piece of the same container door, strapped on
    const SP = blob([[-5.4, -3.8], [-1.6, -5.6], [3.0, -5.6], [6.0, -3.4], [5.8, 2.4], [0.0, 2.8], [-5.4, 2.2]]);
    cel(g, SP, PAL.blue, { sh: 1.0, hl: 0.5 });
    clip(g, SP, () => { corrugate(g, -6, 7, -6, 3, 1.4); rust(g, [[-4.6, 1.6, 0.6, 0.8], [5.2, -2.6, 0.5, 1.0], [0.6, 2.2, 0.5]]); stroke(g, 'M -5 1.8 L 5.6 2.0', PAL.rust.k, 0.4, 0.5); });
    for (const [x, y] of [[-4.0, -2.6], [4.6, -2.4]]) rivet(g, x, y, 0.28, PAL.steel);
    cel(g, 'M -6.4 0.2 L 6.6 0.0 L 6.6 1.2 L -6.4 1.4 Z', PAL.strap, { sh: 0.2, hl: 0.15, lw: 0.2 });
  }
}
function fore(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.25, 1);
  cel(g, FORE, t(PAL.jacket), { sh: 1.4, hl: 0.45 });
  clip(g, FORE, () => {
    cel(g, 'M -4 3.6 L 4 3.4 L 4 4.8 L -4 5.0 Z', t(PAL.tapeS), { sh: 0.2, hl: 0.15, line: false, ao: 0.1 });
    fold(g, [[-1.6, 1.4], [0.0, 2.2], [1.6, 2.0]], t(PAL.jacket), 0.26);
    grime(g, 5, 11, OIL);
  });
  g.restore();
  // the glove's long canvas-lined cuff
  const CUFF = blob([[-2.9, 6.6], [2.8, 6.4], [3.2, 9.0], [2.6, 11.2], [-2.5, 11.4], [-3.2, 9.0]]);
  cel(g, CUFF, t(PAL.glove), { sh: 0.7, hl: 0.4 });
  clip(g, CUFF, () => { stitch(g, 'M -3 7.4 C -1 7.1 1 7.0 3 7.2', t(PAL.glove).d, 0.1); scuffs(g, [[0.6, 9.2, 0.5], [-1.4, 10.2, 0.35]], t(PAL.glove).k, 0.35); grime(g, 8, 12, OIL); });
}
function hand(g, ctx) {
  g.save(); g.scale(1.14, 1.08);
  glove(g, ctx, PAL.glove, { knuckle: PAL.glove });
  clip(g, 'M -2.4 2.0 L 2.6 1.8 L 2.6 5.6 L -2.4 5.8 Z', () => grime(g, 2, 6, OIL));
  g.restore();
}

// --- legs ------------------------------------------------------------------------------------
function thigh(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.2, 1);
  cel(g, THIGH, t(PAL.suit), { sh: 1.7, hl: 0.45 });
  clip(g, THIGH, () => {
    stroke(g, curve([[2.6, 0.6], [2.4, 7.0], [2.0, 15.0]]), t(PAL.suit).k, 0.22, 0.7);
    stitch(g, curve([[2.2, 0.6], [2.0, 7.0], [1.6, 15.0]]), t(PAL.suit).l, 0.07, 0.6);
    // the cargo pocket and its flap, a rag hanging out of it
    cel(g, 'M -2.6 4.2 L 1.8 4.0 L 2.0 10.4 C 0.6 10.8 -1.2 10.8 -2.5 10.5 Z', t(PAL.suit), { sh: 0.4, hl: 0.25, lw: 0.22, ao: 0.3 });
    cel(g, 'M -2.8 3.8 L 2.0 3.6 L 2.0 5.8 C 0.6 6.2 -1.2 6.2 -2.7 5.9 Z', t(PAL.suit), { sh: 0.3, hl: 0.2, lw: 0.22 });
    fold(g, [[-2.0, 12.4], [0.0, 13.2], [2.0, 13.0]], t(PAL.suit));
    grime(g, 6, 16, OIL);
  });
  g.restore();
  if (!ctx.far) cel(g, 'M -3.4 5.6 C -2.6 5.4 -1.8 5.6 -1.6 6.2 L -2.0 9.6 C -2.6 9.8 -3.2 9.6 -3.4 9.2 Z', mat(tone('#c9452f', '#a3311f', '#701f13', '#320d07'), 'canvas', 0.6), { sh: 0.3, hl: 0.2, lw: 0.2 });
}
function shin(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.2, 1);
  cel(g, SHIN, t(PAL.suit), { sh: 1.4, hl: 0.4 });
  clip(g, SHIN, () => {
    cel(g, 'M -4 0.6 L 4 0.4 L 4 1.8 L -4 2.0 Z', t(PAL.tapeS), { sh: 0.2, hl: 0.15, line: false, ao: 0.1 });
    scuffs(g, [[1.4, -0.6, 0.6, 0.3]], t(PAL.suit).l, 0.4);
    grime(g, 2, 10, OIL);
  });
  g.restore();
  // big leather work boots, laced high
  const TALL = blob([[-3.1, 6.8], [2.9, 6.5], [3.0, 10.0], [3.1, 15.0], [-3.1, 15.1], [-3.3, 10.0]]);
  cel(g, TALL, t(PAL.boot), { sh: 0.9, hl: 0.4 });
  clip(g, TALL, () => {
    for (let y = 7.6; y < 14.4; y += 1.2) { stroke(g, `M 1.0 ${y} L 2.5 ${y + 0.45} M 2.5 ${y} L 1.0 ${y + 0.45}`, '#d5c4a0', 0.16); rivet(g, 0.9, y + 0.2, 0.13, PAL.steel); }
    fill(g, 'M -3.4 6.6 L 3.2 6.3 L 3.2 7.6 L -3.4 7.9 Z', t(PAL.boot).d, 0.8);
    stitch(g, 'M -2.8 8.0 L -2.7 14.6', t(PAL.boot).l, 0.08, 0.6);
    scuffs(g, [[-1.2, 12.0, 0.6, 0.2], [1.6, 9.6, 0.4]], t(PAL.boot).l, 0.4);
    grime(g, 10, 16, 'rgba(60,46,32,0.5)');
  });
}
function foot(g, ctx) {
  g.save(); g.scale(1.1, 1.08); g.translate(0, -0.18);
  boot(g, ctx, PAL.boot, PAL.sole, { toe: PAL.boot, lace: '#d5c4a0' });
  // the leather worn off the steel toe cap
  clip(g, 'M 3.6 0.15 L 7.2 1.3 L 7.2 2.0 L 3.4 2.0 Z', () => { scuffs(g, [[5.2, 1.0, 0.9, 0.3], [6.4, 1.4, 0.5]], PAL.toe.m, 0.9); scuffs(g, [[5.0, 0.9, 0.5, 0.3]], PAL.toe.l, 0.7); });
  g.restore();
}

// --- head: hard hat and headlamp, safety glasses, the half mask -------------------------------
const GLASSES = 'M 1.5 -8.0 C 2.9 -8.35 4.5 -8.25 5.4 -7.65 L 5.3 -6.35 C 4.5 -5.8 2.9 -5.75 1.85 -6.15 C 1.5 -6.75 1.45 -7.35 1.5 -8.0 Z';
const LAMP = 'M 4.95 -11.15 L 5.55 -11.2 L 5.6 -10.0 L 5.0 -9.95 Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
function head(g) {
  const S = PAL.skin, H = PAL.hat;
  neck(g, S, { wide: 0.35, glaze: true });
  const HD = headShape({ jaw: 1 });
  cel(g, HD, S, { sh: 1.2, hl: 0.35 });
  skinGlaze(g, HD);
  clip(g, HD, () => {
    // grey stubble along the jaw and the back of the head, cropped grey hair
    for (let k = 0; k < 120; k++) { const x = -3.6 + ((k * 37) % 76) / 10, y = -5.8 + ((k * 53) % 46) / 10; if (x < 0.5 || y > -3.2) fill(g, `M ${x} ${y} l 0.08 0.12 l -0.06 0.02 Z`, '#8d8a84', 0.7); }
    softHair(g, 'M -4.2 -8.8 C -3.8 -7.0 -3.5 -5.9 -3.0 -5.0 C -2.6 -5.2 -2.3 -5.4 -2.1 -5.7 C -2.4 -6.7 -2.5 -7.7 -2.4 -8.8 Z', '#6f6b65', 'rgba(206,200,190,0.7)', [0.15, 1], 90, 13);
    cel(g, 'M -1.7 -7.3 C -0.9 -7.6 -0.4 -6.8 -0.5 -6.0 C -0.6 -5.3 -1.3 -5.1 -1.8 -5.6 Z', S, { sh: 0.5, hl: 0.2, line: false, ao: 0.6 });
    stroke(g, 'M -1.3 -6.9 C -0.8 -6.8 -0.8 -6.0 -1.2 -5.8', S.d, 0.14, 0.7);
  });
  // the brow, heavy, and the creases at the eye beside the glasses
  fill(g, 'M 1.4 -8.35 C 2.3 -8.75 3.4 -8.75 4.3 -8.35 L 4.2 -8.0 C 3.4 -8.3 2.3 -8.3 1.5 -8.0 Z', '#4a443d');
  for (const y of [-6.8, -6.4]) stroke(g, `M 1.3 ${y} l -0.6 0.15`, S.d, 0.08, 0.8);
  // the safety glasses, smoked, with the street in them
  stroke(g, 'M 1.6 -7.4 C 0.6 -7.4 -0.6 -7.2 -1.4 -6.9', PAL.black.k, 0.28);
  const gr = g.createLinearGradient(1.6, -8.4, 3.4, -5.8); gr.addColorStop(0, '#2a2d33'); gr.addColorStop(0.45, '#5a616b'); gr.addColorStop(0.55, '#1c1f24'); gr.addColorStop(1, '#101215');
  g.fillStyle = gr; g.fill(new Path2D(GLASSES));
  clip(g, GLASSES, () => { fill(g, 'M 2.0 -8.2 L 2.6 -8.3 L 2.0 -6.0 L 1.4 -6.0 Z', '#ffffff', 0.25); fill(g, 'M 3.6 -6.7 L 5.2 -6.9 L 5.2 -6.5 L 3.6 -6.3 Z', '#ffcf86', 0.3); });
  stroke(g, GLASSES, PAL.black.k, 0.26);
  // the half mask, its two magenta filters and the straps
  stroke(g, 'M 1.0 -4.0 C -0.4 -4.4 -1.8 -4.6 -3.2 -4.4', PAL.black.k, 0.42);
  stroke(g, 'M 1.0 -2.8 C -0.6 -2.4 -2.0 -2.6 -3.0 -3.2', PAL.black.k, 0.42);
  const MASK = 'M 1.2 -5.8 C 2.6 -6.2 4.4 -6.0 5.4 -5.2 C 6.0 -4.2 5.8 -2.6 4.8 -1.8 C 3.6 -1.2 2.0 -1.4 1.2 -2.4 C 0.8 -3.4 0.8 -4.8 1.2 -5.8 Z';
  cel(g, MASK, PAL.mask, { sh: 0.9, hl: 0.4 });
  clip(g, MASK, () => { stroke(g, curve([[1.6, -5.2], [3.6, -5.6], [5.2, -4.8]]), PAL.mask.l, 0.16, 0.7); for (const x of [3.6, 4.2, 4.8]) stroke(g, `M ${x} -2.6 L ${x} -1.8`, PAL.mask.k, 0.12, 0.8); });
  // the far filter peeking past the nose, then the near one, round and bigger
  cel(g, ell(5.6, -3.4, 0.7, 1.15), PAL.filter, { sh: 0.4, hl: 0.25, lw: 0.2 });
  cel(g, ell(2.4, -3.5, 1.15, 1.55), PAL.mask, { sh: 0.4, hl: 0.25, lw: 0.22 });
  cel(g, ell(2.45, -3.5, 0.95, 1.35), PAL.filter, { sh: 0.5, hl: 0.35, lw: 0.2 });
  clip(g, ell(2.45, -3.5, 0.95, 1.35), () => { for (let i = -1.2; i < 1.3; i += 0.4) stroke(g, `M 1.4 ${-3.5 + i} L 3.5 ${-3.5 + i}`, PAL.filter.d, 0.08, 0.7); fill(g, ell(2.2, -4.1, 0.25, 0.3), '#ffffff', 0.35); });
  // the hard hat: a cap with its peak, the ridge, scuffs, the headlamp on its band
  const SHELL = 'M -4.9 -7.4 C -5.3 -10.4 -3.0 -12.8 0.4 -12.9 C 3.4 -13.0 5.2 -11.6 5.4 -9.6 L 7.4 -9.0 C 7.5 -8.6 7.2 -8.3 6.6 -8.3 L 4.8 -8.5 C 2.6 -8.8 -1.4 -8.6 -4.9 -7.4 Z';
  cel(g, SHELL, H, { sh: 1.5, hl: 0.55 });
  clip(g, SHELL, () => {
    cel(g, 'M -1.8 -13 C -0.6 -13.4 1.4 -13.4 2.6 -13 L 2.4 -9 L -1.6 -9 Z', H, { sh: 0.4, hl: 0.3, ao: 0.25, lw: 0.2 });
    // the brim edge, the sweat stain, a sticker half gone, scratches
    stroke(g, 'M -5.0 -7.7 C -1.4 -8.9 2.6 -9.1 4.8 -8.8', H.d, 0.3);
    scuffs(g, [[-3.0, -10.4, 0.5, 0.6], [3.8, -11.0, 0.4, -0.3], [-0.6, -9.6, 0.3]], H.l, 0.7);
    for (const [x, y] of [[-2.2, -11.6], [1.4, -11.0], [3.6, -10.2]]) stroke(g, `M ${x} ${y} l 0.7 0.25`, H.k, 0.06, 0.6);
    g.save(); g.translate(-2.4, -9.6); g.rotate(-0.25); fill(g, 'M -0.9 -0.5 L 0.9 -0.5 L 0.6 0.5 L -0.9 0.5 Z', '#2c4f7a', 0.85); fill(g, 'M -0.6 -0.2 L 0.4 -0.2 L 0.4 0.1 L -0.6 0.1 Z', '#e9e4d6', 0.8); g.restore();
    grime(g, -11, -7.4, 'rgba(70,50,20,0.35)');
  });
  // the lamp's elastic band and the lamp, its lens lit
  stroke(g, 'M -4.8 -8.2 C -1.6 -9.4 2.0 -9.8 4.9 -10.4', '#1e1f22', 0.5);
  for (let x = -4.2; x < 4.6; x += 0.8) fill(g, `M ${x} ${-8.5 - (x + 4.8) * 0.18} l 0.3 -0.06 l 0 0.18 l -0.3 0.06 Z`, '#b9b2a2', 0.6);
  cel(g, 'M 3.2 -11.2 L 5.0 -11.3 L 5.1 -9.9 L 3.3 -9.8 Z', PAL.black, { sh: 0.3, hl: 0.2, lw: 0.22 });
  fill(g, LAMP, '#fff2d0');
  fill(g, 'M 5.1 -10.9 L 5.4 -10.95 L 5.42 -10.3 L 5.12 -10.25 Z', '#ffffff');
}

export const BRICK = {
  id: 'brick', name: 'BULWARK', role: 'AĞIR', pal: PAL,
  pose: { nUpper: 0.32, nFore: 0.04, nHand: 0.0, fUpper: -0.32, fFore: -0.14, fHand: -0.1, nThigh: 0.24, nShin: 0.04, fThigh: -0.3, fShin: -0.04, head: -0.02 },
  parts: { backFar, torso, chest, head, upper, fore, hand, thigh, shin, foot },
};
