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
  glove, boot, headShape, skinGlaze, skinDetail, neck, softHair, korBand, stitch, rivet, buckle, grime, scuffs,
  clothFolds, brushOf, paintEar, inPath, crease, softBrow,
} from './body.js';
import { rnd } from '../paint.js';
import { texture } from '../tex.js';

const PAL = {
  jacket: mat(tone('#f2894a', '#d6632b', '#a2451b', '#4e1e09'), 'canvas', 0.8),
  tapeS: tone('#f1f3f3', '#c6cbce', '#90969b', '#4b4f53'),
  blue: mat(tone('#6f97b8', '#4c7596', '#34546f', '#152637'), 'paint', 0.85),
  rust: tone('#b0663a', '#8a4a26', '#5e3118', '#2a1409'),
  suit: mat(tone('#435069', '#2f394d', '#202737', '#0d1018'), 'canvas', 0.6),
  hat: mat(tone('#f2de96', '#d6ba60', '#a1873a', '#52421a'), 'paint', 0.5),
  mask: mat(tone('#505357', '#36393d', '#25272a', '#0e0f10'), 'rubber', 0.6),
  filter: mat(tone('#d888b2', '#b14f86', '#7a3260', '#3a1430'), 'rubber', 0.6),
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
  clothFolds(g, SUIT, [[[-8.0, -17.0], [-6.2, -14.4], [-4.6, -11.2]], [[-7.0, -11.6], [-5.0, -9.4], [-2.6, -7.4]], [[-6.8, -4.0], [-4.0, -3.4], [-1.0, -3.8]]], PAL.jacket);
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
  // the jacket's collar turned up: stiff canvas with its points flared at the front, the
  // darker lining in the opening, oil in the stitching
  const Bc = brushOf(g), J = PAL.jacket;
  const COLLAR = 'M -4.8 -22.0 C -5.0 -23.6 -4.5 -25.2 -3.2 -25.9 C -1.6 -26.4 0.4 -26.2 1.8 -25.6 C 2.6 -25.3 3.2 -25.0 3.6 -24.6 L 4.6 -23.3 C 4.2 -22.5 3.6 -22.1 3.0 -21.9 C 1.0 -21.6 -1.6 -21.6 -4.8 -22.0 Z';
  Bc.fill('M 2.4 -25.2 C 3.0 -25.0 3.5 -24.7 3.8 -24.3 L 3.6 -22.4 L 2.6 -22.4 Z', J.k, 0.03);
  cel(g, COLLAR, J, { sh: 0.35, hl: 0.3 });
  Bc.inside(COLLAR, () => {
    // the roll where the collar turns over: a crease along it, the fall below a shade darker
    Bc.fill('M -6 -23.6 C -3 -24.4 0 -24.5 3 -23.9 L 5 -22.6 L 5 -21 L -6 -21 Z', 'rgba(90,30,6,0.25)', 0.15);
    Bc.line('M -4.8 -23.7 C -2.4 -24.5 0.4 -24.6 2.8 -24.0 C 3.4 -23.8 3.9 -23.4 4.2 -23.0', 'rgba(70,24,4,0.6)', 0.14, 0.06);
    Bc.line('M -4.8 -23.9 C -2.4 -24.7 0.4 -24.8 2.8 -24.2', 'rgba(255,200,150,0.35)', 0.08, 0.04);
    Bc.line('M -3.4 -25.8 C -1.6 -26.3 0.4 -26.1 1.8 -25.5 C 2.6 -25.2 3.2 -24.9 3.6 -24.5 L 4.5 -23.3', 'rgba(255,214,170,0.45)', 0.16, 0.08);
    Bc.fill('M -6 -22.6 C -3 -22.3 1 -22.2 5 -21.9 L 5 -21 L -6 -21 Z', 'rgba(60,20,4,0.3)', 0.2);
    grime(g, -25, -21.6, OIL);
  });
  stitch(g, 'M -3.6 -25.2 C -1.6 -25.7 0.6 -25.6 2.4 -24.9 L 3.9 -23.6', J.l, 0.06, 0.55);
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
  clothFolds(g, UPPER, [[[-2.0, 6.0], [-0.4, 6.8], [1.8, 6.4]], [[-1.8, 10.4], [0.0, 11.0], [1.8, 10.6]]], t(PAL.jacket));
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
  // trousers bunched behind the knee, pulled across the thigh from the hip
  clothFolds(g, THIGH, [[[-3.0, 11.0], [-1.0, 11.8], [1.6, 11.4]], [[-2.8, 2.8], [-1.2, 3.4], [-0.2, 4.6]], [[1.4, 7.0], [2.4, 8.2]]], t(PAL.suit));
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

// --- head: hard hat and headlamp, safety glasses, the half mask (docs §10.15) -----------------
// A big, weathered face: a heavy brow over smoked safety glasses, the eye just seen
// through them; a half-face respirator over the nose and mouth, grey elastomer with its
// valve and two magenta filters; grey stubble on the jaw under it; cropped grey hair;
// a faded yellow hard hat, its rim a gutter full of dirt, the headlamp on its band.
const HEAD = 'M -2.9 -3.2 C -3.8 -4.0 -4.2 -5.4 -4.15 -6.7 C -4.1 -8.4 -3.2 -9.8 -1.6 -10.4 C 0.0 -10.9 2.0 -10.8 3.2 -10.1 C 4.0 -9.6 4.3 -8.8 4.35 -8.1 C 4.38 -7.7 4.5 -7.44 4.62 -7.26 C 4.64 -7.04 4.5 -6.9 4.4 -6.82 C 4.62 -6.4 4.9 -5.8 5.12 -5.3 C 5.3 -4.96 5.28 -4.7 5.08 -4.58 C 4.88 -4.5 4.7 -4.48 4.56 -4.44 C 4.7 -4.1 4.76 -3.8 4.72 -3.5 C 4.72 -3.2 4.76 -2.8 4.64 -2.36 C 4.44 -1.8 3.9 -1.5 3.2 -1.5 C 2.2 -1.56 1.2 -1.9 0.4 -2.4 C -0.1 -2.7 -0.5 -3.0 -0.8 -3.3 C -1.3 -2.9 -2.0 -2.8 -2.6 -2.9 Z';
const NECK = 'M -2.6 1.4 C -2.65 0.2 -2.7 -1.2 -2.9 -2.6 L -3.0 -3.4 L 0.0 -3.6 C 0.9 -3.0 1.8 -2.4 2.4 -2.0 C 2.6 -1.0 2.65 0.2 2.6 1.3 Z';
const HAIR = 'M 1.9 -8.5 C 1.4 -8.1 1.1 -7.6 1.0 -7.1 C 0.95 -6.8 0.9 -6.6 0.84 -6.4 L 0.5 -6.7 C 0.2 -7.2 -0.5 -7.4 -1.1 -7.1 C -1.4 -6.7 -1.4 -6.0 -1.2 -5.4 C -1.1 -4.9 -1.1 -4.4 -1.4 -3.9 C -1.8 -3.4 -2.4 -3.1 -2.9 -3.2 C -3.8 -4.0 -4.2 -5.4 -4.15 -6.7 C -4.1 -7.6 -3.8 -8.3 -3.4 -8.7 L 1.9 -8.7 Z';
const STUB = 'M 1.0 -4.2 C 1.2 -3.0 1.8 -2.0 2.8 -1.5 C 3.6 -1.3 4.3 -1.5 4.7 -2.0 L 4.9 -1.0 L -0.8 -1.0 L -0.8 -3.3 C -0.4 -3.6 0.2 -4.0 1.0 -4.2 Z';
const GLASSES = 'M 1.6 -8.05 C 3.0 -8.4 4.6 -8.3 5.5 -7.7 C 5.6 -7.2 5.5 -6.7 5.3 -6.4 C 4.6 -5.85 3.0 -5.8 2.0 -6.1 C 1.65 -6.6 1.55 -7.4 1.6 -8.05 Z';
const MASK = 'M 3.4 -6.1 C 4.2 -6.3 4.9 -6.0 5.3 -5.4 C 5.7 -4.8 5.9 -4.1 5.8 -3.4 C 5.7 -2.6 5.3 -2.0 4.6 -1.7 C 3.8 -1.4 2.8 -1.5 2.0 -1.9 C 1.4 -2.4 1.0 -3.2 1.0 -4.0 C 1.1 -4.8 1.6 -5.5 2.4 -5.9 C 2.7 -6.0 3.0 -6.08 3.4 -6.1 Z';
const SHELL = 'M -5.0 -7.3 C -5.4 -10.4 -3.0 -12.8 0.4 -12.95 C 3.4 -13.05 5.2 -11.6 5.45 -9.6 L 7.4 -9.0 C 7.5 -8.6 7.2 -8.3 6.6 -8.3 L 4.8 -8.5 C 2.6 -8.8 -1.4 -8.6 -5.0 -7.3 Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
function head(g) {
  const B = brushOf(g), Sk = { base: '#a36d4e', lit: 'rgba(246,196,160,1)', dark: 'rgba(70,34,20,1)', red: 'rgba(200,80,56,1)' };
  // the neck, thick, in the jaw's shadow; stubble runs down it
  B.fill(NECK, '#8a5a40', 0.02);
  B.inside(NECK, () => {
    B.fill('M -4 -4 L 0.4 -4 C 0.2 -2.6 0.2 -1.0 0.6 1.6 L -4 1.6 Z', 'rgba(50,24,14,0.5)', 0.4);
    B.fill('M -4 -4 L 3 -4 L 3 -1.8 C 1.6 -1.8 0.2 -1.6 -4 -1.0 Z', 'rgba(40,18,10,0.5)', 0.35);
    B.line('M -0.4 -3.3 C 0.3 -2.0 0.9 -0.8 1.5 0.8', 'rgba(230,170,130,0.3)', 0.34, 0.24);
    texture(g, 'skin', 0.4, 0.9);
  });
  // the head: weathered, red-brown from years in the wind off the water
  B.fill(HEAD, Sk.base, 0.03);
  B.inside(HEAD, () => {
    B.fill('M -5 -11 L 1.4 -11 C 1.0 -8.6 0.9 -6.0 1.3 -3.9 L 1.6 -1 L -5 -1 Z', 'rgba(60,28,16,0.55)', 0.5);
    B.fill('M 2.8 -9.2 C 3.8 -8.8 4.4 -8.0 4.6 -7.0 L 5.3 -4.8 L 3.2 -4.6 C 2.9 -6.0 2.7 -7.6 2.8 -9.2 Z', 'rgba(232,170,128,0.7)', 0.22);
    // the heavy brow ridge over the glasses, the deep crease between the brows, the forehead's lines
    B.line('M 2.4 -8.15 C 3.2 -8.3 4.0 -8.2 4.6 -7.9', 'rgba(250,206,170,0.5)', 0.14, 0.08);
    B.dab(1.6, -6.7, 0.5, 0.6, 'rgba(60,28,16,0.35)');
    B.line('M 1.3 -5.85 C 2.0 -5.9 2.6 -5.94 3.0 -5.96', 'rgba(250,206,170,0.35)', 0.14, 0.1);
    // wind-burnt: red over the cheek and the ear, broken veins, a blue-grey where he shaves
    B.dab(2.0, -5.6, 1.0, 0.6, 'rgba(196,70,50,0.22)');
    B.dab(3.2, -8.6, 1.0, 0.4, 'rgba(214,160,90,0.2)');
    const r = rnd(77), MOT = ['176,72,52', '200,150,90', '110,70,90', '80,40,24', '250,210,180'];
    for (let i = 0; i < 160; i++) { const x = 0.6 + r() * 4.4, y = -9 + r() * 7, rr = 0.06 + r() * 0.2; B.dab(x, y, rr, rr * (0.6 + r() * 0.5), `rgba(${MOT[(r() * MOT.length) | 0]},${0.05 + r() * 0.08})`, 1, 'source-over', r() * 3); }
    for (let i = 0; i < 300; i++) { const x = 0.8 + r() * 4.2, y = -9 + r() * 7; B.dab(x, y, 0.014 + r() * 0.02, 0.012 + r() * 0.016, r() < 0.6 ? 'rgba(70,30,18,0.25)' : 'rgba(255,220,196,0.16)'); }
    texture(g, 'skin', 0.5, 0.9);
    B.line('M -3.9 -7.6 C -4.15 -6.4 -3.95 -5.0 -3.3 -3.9', 'rgba(140,160,186,0.35)', 0.16, 0.14);
  });
  // grey stubble along the jaw and down the neck under the mask: the shadow of it, then the hairs
  B.inside(HEAD, () => B.fill(STUB, 'rgba(86,90,96,0.35)', 0.2));
  B.inside(NECK, () => B.fill(STUB, 'rgba(86,90,96,0.25)', 0.3));
  B.hairs(700, 91, (i, rr) => {
    const x = -0.8 + rr() * 5.8, y = -4.2 + rr() * 3.4;
    if (!inPath(g, STUB, x, y) || !(inPath(g, HEAD, x, y) || inPath(g, NECK, x, y))) return null;
    const v = rr() < 0.6 ? 170 : 70;
    return [x, y, Math.PI / 2 + 0.3 + (rr() - 0.5) * 0.8, 0.04 + rr() * 0.05, `rgb(${v},${v - 2},${v - 6})`, 0.02, 0.55];
  });
  // the hair: cropped grey, the temple gone white, darker at the back
  B.fill(HAIR, 'rgb(104,100,94)', 0.04);
  B.inside(HAIR, () => {
    B.dab(1.5, -7.6, 1.1, 0.8, 'rgba(206,200,190,0.55)');
    B.dab(-3.0, -5.8, 1.3, 2.0, 'rgba(26,22,20,0.45)');
    B.dab(-1.8, -3.3, 1.0, 0.5, 'rgba(160,110,86,0.35)');
    texture(g, 'wool', 0.25, 0.4);
  });
  B.hairs(1100, 93, (i, rr) => {
    const x = -4.2 + rr() * 6.2, y = -8.7 + rr() * 5.6;
    if (!inPath(g, HAIR, x, y)) return null;
    const l = Math.min(1, Math.max(0, (x + 1.2) / 3.2)), salt = rr() < 0.6;
    const v = (salt ? 140 : 60) + l * 60 + (rr() - 0.5) * 24;
    return [x, y, Math.PI * 0.6 + (rr() - 0.5) * 0.5, 0.05 + rr() * 0.07, `rgb(${v + 2 | 0},${v | 0},${v - 4 | 0})`, 0.016, salt ? 0.3 + l * 0.3 : 0.35];
  });
  paintEar(g, -0.4, -6.05, 1.06, Sk);
  // the eye behind the glass: under the heavy brow, crow's feet running back from it
  B.dab(3.8, -7.0, 0.8, 0.5, 'rgba(60,28,16,0.5)');
  B.fill('M 3.3 -6.95 C 3.56 -7.24 3.9 -7.3 4.2 -7.1 C 4.26 -7.0 4.24 -6.9 4.16 -6.86 C 3.86 -6.76 3.56 -6.8 3.3 -6.95 Z', '#9a8a7c', 0.02);
  B.dab(4.05, -7.04, 0.07, 0.08, '#18120e');
  B.line('M 3.28 -6.96 C 3.54 -7.28 3.92 -7.34 4.22 -7.12', 'rgba(30,14,8,0.9)', 0.08, 0.03);
  for (const [dy, l] of [[-0.14, 0.5], [0.02, 0.62], [0.18, 0.5]]) crease(g, `M 2.0 ${-6.95 + dy * 0.5} l ${-l} ${dy * 0.8}`, 0.035, 0.45);
  // the brow, grey and thick, standing over the glasses' bar
  softBrow(g, 2.3, -7.95, 4.5, -7.9, 0.12, '#625a52', 21);
  // the glasses' arm back over the ear, the side shield
  B.line('M 1.7 -7.82 C 0.7 -7.72 -0.2 -7.46 -1.0 -7.06', '#121315', 0.2, 0.01);
  B.fill('M 1.1 -7.9 L 1.7 -8.0 L 1.9 -6.3 L 1.3 -6.6 Z', 'rgba(180,190,196,0.28)', 0.03);
  // the lenses, smoked: the eye is just there behind them, the street lamps in them
  const gr = g.createLinearGradient(3.4, -8.4, 3.2, -5.8);
  gr.addColorStop(0, 'rgba(28,30,34,0.9)'); gr.addColorStop(0.42, 'rgba(70,76,86,0.78)'); gr.addColorStop(0.5, 'rgba(150,158,168,0.7)'); gr.addColorStop(0.56, 'rgba(36,38,44,0.8)'); gr.addColorStop(1, 'rgba(16,17,20,0.9)');
  B.fill(GLASSES, gr, 0.01);
  B.inside(GLASSES, () => {
    B.fill('M 2.2 -8.4 L 2.8 -8.5 L 2.3 -5.9 L 1.7 -5.9 Z', 'rgba(255,255,255,0.18)', 0.05);
    B.dab(4.6, -6.5, 0.3, 0.08, 'rgba(255,200,130,0.6)');
    B.dab(3.4, -6.4, 0.16, 0.05, 'rgba(255,210,150,0.5)');
  });
  B.line('M 1.5 -8.08 C 3.0 -8.46 4.6 -8.36 5.56 -7.74', '#141518', 0.2, 0.01);
  B.line('M 1.6 -8.16 C 3.0 -8.52 4.6 -8.42 5.5 -7.82', 'rgba(150,156,164,0.35)', 0.05, 0.01);
  // the respirator's harness: the head strap up in front of the ear under the hat, the neck
  // strap back under the ear to its clip
  B.line('M 1.4 -5.0 C 1.0 -6.2 0.9 -7.4 1.1 -8.4', '#1d1e21', 0.22, 0.01);
  B.line('M 1.2 -2.8 C 0.0 -2.9 -1.4 -2.9 -2.8 -2.5', '#1d1e21', 0.24, 0.01);
  B.line('M 1.2 -2.9 C 0.0 -3.0 -1.4 -3.0 -2.8 -2.6', 'rgba(140,146,156,0.3)', 0.05, 0.01);
  B.fill('M -2.0 -3.0 L -1.4 -3.0 L -1.4 -2.4 L -2.0 -2.4 Z', '#2a2b2e', 0.01);
  // the half mask: moulded grey elastomer, a softer flange where it seals on the face, the
  // valve cover at the front with its slots, the two filters
  const Mk = PAL.mask;
  B.fill(MASK, Mk.m, 0.02);
  B.inside(MASK, () => {
    B.fill('M 3 -7 L 7 -7 L 7 -4.4 C 5.4 -4.8 4.0 -5.0 3.0 -5.0 Z', 'rgba(150,156,164,0.35)', 0.3);
    B.fill('M 0 -3.4 C 1.6 -3.0 3.4 -2.6 6 -2.8 L 6 -1 L 0 -1 Z', 'rgba(6,7,8,0.5)', 0.35);
    B.line(MASK, 'rgba(120,124,130,0.6)', 0.24, 0.08);
    B.line('M 3.6 -5.95 C 4.3 -6.05 4.9 -5.8 5.25 -5.3', 'rgba(210,214,220,0.5)', 0.08, 0.04);
    texture(g, 'rubber', 0.4, 0.5);
  });
  const V = 'M 5.1 -3.9 C 5.5 -4.0 5.9 -3.9 6.1 -3.6 L 6.1 -2.5 C 5.9 -2.2 5.5 -2.1 5.1 -2.3 Z';
  cel(g, V, PAL.black, { sh: 0.4, hl: 0.3, lw: 0.12 });
  B.inside(V, () => { for (let y = -3.7; y < -2.4; y += 0.24) B.line(`M 5.25 ${y} L 6.0 ${y}`, 'rgba(0,0,0,0.85)', 0.08, 0.01); B.line('M 5.2 -3.85 C 5.5 -3.94 5.8 -3.86 6.0 -3.64', 'rgba(170,176,184,0.5)', 0.05, 0.02); });
  // the far filter just past the valve, the near one big on the cheek: a thick disc on its
  // grey bayonet, a raised rim, the mesh face recessed, the paint chipped on the rim
  const F = PAL.filter;
  B.fill(ell(5.9, -3.75, 0.36, 0.95), F.d, 0.02);
  B.fill(ell(2.55, -3.6, 1.28, 1.55), '#2b2d31', 0.02);
  B.fill(ell(2.6, -3.62, 1.12, 1.38), F.m, 0.02);
  B.inside(ell(2.6, -3.62, 1.12, 1.38), () => {
    B.fill(ell(2.68, -3.6, 0.82, 1.06), F.d, 0.04);
    B.inside(ell(2.68, -3.6, 0.82, 1.06), () => { for (let i = -1.1; i < 1.1; i += 0.16) B.line(`M 1.8 ${-3.6 + i} L 3.6 ${-3.6 + i}`, 'rgba(40,10,30,0.45)', 0.05, 0.01); });
    B.line(ell(2.6, -3.62, 1.0, 1.26), 'rgba(250,190,226,0.35)', 0.08, 0.04);
    B.dab(2.2, -4.4, 0.4, 0.3, 'rgba(255,220,240,0.35)');
    B.dab(3.0, -2.6, 0.7, 0.4, 'rgba(30,6,20,0.4)');
    scuffs(g, [[1.6, -3.2, 0.12, 1.2], [3.4, -4.2, 0.1, 0.4]], '#e8d6de', 0.6);
  });
  g.save(); g.translate(2.66, -3.1); g.scale(1 / 80, 1 / 80); g.fillStyle = 'rgba(250,236,244,0.55)'; g.font = "700 20px 'Barlow Condensed', sans-serif"; g.textAlign = 'center'; g.fillText('P100', 0, 0); g.restore();
  // the hard hat: faded yellow, a ridge over the crown, the rim a rain gutter full of the
  // yard's dirt, the suspension's black band under it, scuffs and an old sticker
  const H = PAL.hat;
  B.line('M -2.6 -7.86 C -0.4 -8.36 1.8 -8.56 3.8 -8.56', 'rgba(20,21,23,0.75)', 0.16, 0.04);
  cel(g, SHELL, H, { sh: 1.4, hl: 0.55 });
  B.inside(SHELL, () => {
    B.dab(2.8, -12.2, 2.6, 1.0, 'rgba(255,246,210,0.45)');
    B.fill('M -6 -9 C -3 -9.8 1 -10.4 5.6 -10.2 L 5.6 -7 L -6 -7 Z', 'rgba(110,80,20,0.3)', 0.4);
    // the side rib below the crown
    B.line('M -3.8 -10.6 C -1.6 -12.0 1.4 -12.4 4.2 -11.6', 'rgba(255,240,190,0.5)', 0.18, 0.06);
    B.line('M -3.7 -10.4 C -1.5 -11.8 1.4 -12.2 4.2 -11.4', 'rgba(110,80,20,0.5)', 0.1, 0.05);
    // the rim: a gutter, its lip lit, the trough dark and dirty
    B.line('M -5.0 -7.55 C -1.4 -8.85 2.6 -9.05 4.9 -8.75', 'rgba(70,50,20,0.75)', 0.2, 0.05);
    B.line('M -5.0 -7.3 C -1.4 -8.6 2.6 -8.8 4.8 -8.5', 'rgba(255,236,170,0.45)', 0.08, 0.03);
    // the accessory slot over the ear
    B.fill('M -0.4 -9.4 L 0.5 -9.55 L 0.5 -9.15 L -0.4 -9.0 Z', '#2a2414', 0.02);
    // the peak's underside
    B.fill('M 5.4 -9.0 L 7.6 -8.9 L 7.6 -8.2 L 5.2 -8.4 Z', 'rgba(70,50,20,0.55)', 0.08);
    scuffs(g, [[-3.0, -10.4, 0.5, 0.6], [3.8, -11.0, 0.4, -0.3], [-0.6, -9.6, 0.3], [1.8, -12.2, 0.35, 0.2]], H.l, 0.7);
    for (const [x, y] of [[-2.2, -11.6], [1.4, -11.0], [3.6, -10.2], [-4.0, -9.0]]) B.line(`M ${x} ${y} l 0.7 0.25`, 'rgba(70,50,20,0.6)', 0.05, 0.01);
    // the sticker, the yard's own, half worn away
    g.save(); g.translate(-2.4, -9.6); g.rotate(-0.25);
    B.fill('M -0.9 -0.5 L 0.9 -0.5 L 0.6 0.5 L -0.9 0.5 Z', 'rgba(44,79,122,0.85)', 0.01);
    B.fill('M -0.6 -0.2 L 0.4 -0.2 L 0.4 0.1 L -0.6 0.1 Z', 'rgba(233,228,214,0.8)', 0.01);
    B.fill('M 0.3 -0.5 L 0.9 -0.5 L 0.7 0.1 Z', 'rgba(214,186,96,1)', 0.01);
    g.restore();
    grime(g, -11, -7.4, 'rgba(70,50,20,0.35)');
    texture(g, 'paint', 0.35, 0.5);
  });
  // the lamp's elastic band round the hat and the lamp, its lens
  B.line('M -4.9 -8.3 C -1.6 -9.5 2.0 -9.9 4.95 -10.5', '#1e1f22', 0.5, 0.01);
  for (let x = -4.4; x < 4.6; x += 0.5) B.line(`M ${x} ${-8.5 - (x + 4.9) * 0.2} l 0.25 -0.2`, 'rgba(200,192,176,0.55)', 0.05);
  const LAMP = 'M 3.2 -11.25 C 3.2 -11.45 3.4 -11.5 3.6 -11.5 L 4.9 -11.45 C 5.2 -11.4 5.25 -11.2 5.25 -11.0 L 5.25 -10.1 C 5.25 -9.9 5.1 -9.8 4.9 -9.8 L 3.5 -9.75 C 3.3 -9.75 3.2 -9.9 3.2 -10.1 Z';
  cel(g, LAMP, PAL.black, { sh: 0.3, hl: 0.3, lw: 0.16 });
  B.fill('M 5.0 -11.25 L 5.5 -11.3 L 5.55 -9.9 L 5.05 -9.85 Z', '#2c2d30', 0.01);
  B.fill('M 5.18 -11.1 L 5.48 -11.12 L 5.5 -10.05 L 5.2 -10.02 Z', '#f6e6c0', 0.01);
  B.dab(5.34, -10.8, 0.08, 0.2, '#ffffff', 0.9);
  B.line('M 3.4 -11.36 L 4.9 -11.32', 'rgba(170,176,184,0.5)', 0.05, 0.01);
}

export const BRICK = {
  id: 'brick', name: 'BULWARK', role: 'AĞIR', pal: PAL,
  pose: { nUpper: 0.32, nFore: 0.04, nHand: 0.0, fUpper: -0.32, fFore: -0.14, fHand: -0.1, nThigh: 0.24, nShin: 0.04, fThigh: -0.3, fShin: -0.04, head: -0.02 },
  parts: { backFar, torso, chest, head, upper, fore, hand, thigh, shin, foot },
};
