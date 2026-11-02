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
import { texture } from '../tex.js';
import { rnd } from '../paint.js';
import { PROFILE, SKINS, skin, crop, strap, glass, ell, inP, brushOf as brushR } from './realhead.js';

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
  thermos(g);
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
  craneKit(g);
}
// The harbour (docs §10.22): a big adjustable wrench through a loop on the belt
// behind the hip, its jaw up, bright where the hand wears it; and a steel
// rigging shackle hung on the belt at the front, its pin screwed in.
function craneKit(g) {
  const S = PAL.steel;
  // the wrench's handle down the back of the thigh, its head and jaw at the belt
  const H = 'M -8.3 -0.6 L -7.0 -0.7 L -7.1 10.2 C -7.2 10.8 -8.2 10.8 -8.3 10.2 Z';
  cel(g, H, S, { sh: 0.3, hl: 0.35, gloss: 0.35 });
  clip(g, H, () => { stroke(g, 'M -7.4 0 L -7.5 10', S.l, 0.14, 0.9); fill(g, 'M -8.4 3 L -6.9 3 L -6.9 8.5 L -8.4 8.5 Z', '#3a2a20', 0.25); fill(g, 'M -8.0 9.6 a 0.3 0.3 0 1 0 0.6 0 a 0.3 0.3 0 1 0 -0.6 0 Z', S.k); });
  const HEAD = 'M -9.6 -3.8 L -6.0 -4.0 L -5.8 -2.6 L -7.0 -2.4 L -7.0 -0.6 L -8.3 -0.5 L -8.4 -2.4 L -9.5 -2.6 Z';
  cel(g, HEAD, S, { sh: 0.4, hl: 0.4, gloss: 0.35 });
  fill(g, 'M -8.6 -4.6 L -6.9 -4.7 L -6.9 -3.9 L -8.6 -3.8 Z', S.d);
  stroke(g, 'M -8.6 -3.1 L -7.0 -3.2', S.k, 0.2);
  for (let x = -8.4; x < -7.0; x += 0.3) stroke(g, `M ${x} -3.0 l 0 0.4`, S.d, 0.08);
  cel(g, 'M -8.8 -1.6 L -6.5 -1.7 L -6.4 0.4 L -8.7 0.5 Z', PAL.black, { sh: 0.2, hl: 0.2 });
  // the shackle: a forged steel bow, its pin through the eyes, on the belt
  stroke(g, 'M 4.6 0.0 C 3.4 1.2 3.4 3.6 5.0 3.8 C 6.6 3.6 6.6 1.2 5.4 0.0', S.k, 0.62);
  stroke(g, 'M 4.6 0.0 C 3.4 1.2 3.4 3.6 5.0 3.8 C 6.6 3.6 6.6 1.2 5.4 0.0', S.m, 0.4);
  stroke(g, 'M 4.3 0.9 C 4.0 2.0 4.2 3.0 4.9 3.3', S.l, 0.14, 0.9);
  cel(g, 'M 4.1 -0.5 L 6.0 -0.6 L 6.0 0.1 L 4.1 0.2 Z', S, { sh: 0.2, hl: 0.3, gloss: 0.3 });
  fill(g, 'M 3.8 -0.6 a 0.4 0.4 0 1 0 0.8 0 a 0.4 0.4 0 1 0 -0.8 0 Z', PAL.strap.m);
}
// a dented steel thermos clipped on the back of the belt, the cup screwed on as its lid
function thermos(g) {
  const T = mat(tone('#7fa38e', '#5a7d69', '#3e5949', '#18241d'), 'paint', 0.5);
  const C = 'M -12.0 -9.8 L -9.0 -10.0 L -8.9 -0.8 C -9.4 -0.4 -11.6 -0.4 -12.0 -0.8 Z';
  cel(g, C, T, { sh: 0.8, hl: 0.4, gloss: 0.3 });
  clip(g, C, () => { scuffs(g, [[-11.4, -6.0, 0.5], [-9.6, -2.2, 0.4, 0.4], [-10.8, -8.6, 0.3]], PAL.steel.l, 0.7); stroke(g, 'M -11.0 -9.6 L -11.2 -1.0', T.l, 0.18, 0.6); grime(g, -6, 0, OIL); });
  cel(g, 'M -12.2 -11.6 L -8.8 -11.8 L -8.8 -9.8 L -12.2 -9.6 Z', PAL.steel, { sh: 0.3, hl: 0.35, gloss: 0.3 });
  for (let x = -12; x < -9; x += 0.4) stroke(g, `M ${x} -11.5 l 0 1.6`, PAL.steel.d, 0.08, 0.7);
  cel(g, 'M -12.3 -6.2 L -8.7 -6.3 L -8.7 -5.2 L -12.3 -5.1 Z', PAL.black, { sh: 0.2, hl: 0.2 });
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

// --- head (docs §10.24): a crane driver's head, forty-seven: grey stubble on a wind-burnt
// jaw, the grey crop at the nape; a half-face respirator sized to the face (grey elastomer,
// the valve, two magenta pancake filters, the straps); smoked wraparound safety glasses;
// orange ear defenders on the hat's slots; the faded yellow full-brim hard hat with its ridge,
// the lamp on its band, stickers, the orange neck flap behind.
const BMASK = 'M 3.0 -5.9 C 3.7 -6.2 4.4 -6.1 4.7 -5.8 C 5.0 -5.4 5.36 -5.0 5.6 -4.7 C 5.76 -4.4 5.7 -4.1 5.56 -3.9 C 5.6 -3.4 5.5 -2.8 5.2 -2.3 C 4.8 -1.7 4.0 -1.4 3.2 -1.5 C 2.4 -1.7 1.8 -2.2 1.6 -2.9 C 1.5 -3.8 1.8 -4.8 2.3 -5.4 C 2.5 -5.6 2.7 -5.8 3.0 -5.9 Z';
const BHAT = 'M -6.6 -7.4 C -6.8 -7.9 -6.2 -8.2 -5.1 -8.3 C -5.1 -10.8 -3.0 -12.6 0.2 -12.7 C 3.2 -12.8 5.2 -11.2 5.3 -8.8 C 6.4 -8.7 7.3 -8.4 7.6 -8.0 C 7.7 -7.7 7.4 -7.5 6.9 -7.6 C 5.3 -7.8 3.2 -8.0 0.2 -7.9 C -2.6 -7.8 -4.8 -7.5 -6.2 -7.1 C -6.5 -7.05 -6.7 -7.2 -6.6 -7.4 Z';
const BCUP = ell(-0.1, -5.6, 1.0, 1.25);
const BGLASS = 'M 2.75 -7.0 C 3.6 -7.25 4.6 -7.22 5.05 -6.98 C 5.12 -6.62 5.06 -6.26 4.9 -5.96 C 4.3 -5.78 3.5 -5.78 2.9 -5.96 C 2.7 -6.28 2.68 -6.66 2.75 -7.0 Z';
function head(g) {
  const S = SKINS.ruddy, B = brushOf(g), Mk = PAL.mask, F = PAL.filter, Ht = PAL.hat;
  neck(g, PAL.skin, { glaze: true, wide: 0.3 });
  skin(g, PROFILE, S, { seed: 71, stubble: true, stubbleCol: 'rgba(150,146,140,0.4)' });
  // grey stubble along the jaw and down the throat, the grey crop at the nape
  B.hairs(700, 73, (i, r) => { const x = -0.8 + r() * 5.4, y = -4.4 + r() * 4.6; if (!inP(g, PROFILE, x, y) && !(x < 2.2 && y > -2.8)) return null; return [x, y, Math.PI * 0.55 + (r() - 0.5) * 0.6, 0.05 + r() * 0.06, r() < 0.5 ? '#d8d4cc' : '#7a746c', 0.02, 0.55]; });
  crop(g, 'M -3.95 -6.6 C -3.4 -6.9 -2.4 -7.2 -1.2 -7.3 L -0.9 -6.4 C -1.4 -5.4 -2.0 -4.4 -2.6 -3.6 C -3.3 -4.0 -3.8 -5.0 -3.95 -6.6 Z', { col: '#6e6a64', lit: 'rgba(210,206,200,1)', seed: 75, n: 420, salt: 0.5 });
  // the respirator's straps: the bottom one round the back of the neck, the top one up under the hat
  strap(g, 'M 2.0 -2.6 C 0.6 -2.4 -1.0 -2.8 -2.8 -3.6', 0.26, '#2a2c30', '#0a0b0c', 'rgba(140,146,152,0.5)');
  strap(g, 'M 2.4 -5.3 C 1.4 -6.0 0.6 -6.9 0.0 -7.8', 0.26, '#2a2c30', '#0a0b0c', 'rgba(140,146,152,0.5)');
  // the ear defenders: the cup over the ear, its arm up into the hat's slot
  strap(g, 'M -0.1 -6.8 C -0.2 -7.4 -0.1 -7.9 0.2 -8.3', 0.32, PAL.black.m, PAL.black.k, PAL.black.l);
  const OR = mat(tone('#ff9a52', '#e06a2a', '#a8461a', '#4e1e08'), 'paint', 0.3);
  cel(g, BCUP, OR, { sh: 0.6, hl: 0.5, gloss: 0.35 });
  B.inside(BCUP, () => { B.line(ell(-0.1, -5.6, 0.78, 1.02), OR.d, 0.1, 0.04); B.dab(-0.3, -6.2, 0.4, 0.5, 'rgba(255,220,180,0.3)'); });
  cel(g, ell(-0.1, -5.6, 0.36, 0.44), PAL.black, { sh: 0.2, hl: 0.25 });
  // the mask: grey elastomer, its seal, the valve's cover, the near filter on the cheek and
  // the edge of the far one past the nose
  cel(g, ell(5.4, -3.4, 0.36, 0.86), F, { sh: 0.3, hl: 0.3 });
  cel(g, BMASK, Mk, { sh: 0.9, hl: 0.5, gloss: 0.3 });
  B.inside(BMASK, () => { B.line(BMASK, 'rgba(110,116,124,0.6)', 0.24, 0.08); B.line('M 4.7 -5.7 C 5.0 -5.3 5.36 -4.96 5.56 -4.72', 'rgba(200,206,214,0.5)', 0.12, 0.05); texture(g, 'rubber', 0.4, 0.5); });
  cel(g, 'M 4.8 -3.9 C 5.3 -4.0 5.66 -3.7 5.7 -3.2 C 5.72 -2.7 5.4 -2.4 4.9 -2.4 C 4.5 -2.5 4.36 -2.9 4.4 -3.3 C 4.44 -3.6 4.58 -3.84 4.8 -3.9 Z', PAL.black, { sh: 0.3, hl: 0.35, gloss: 0.3 });
  for (let y = -3.5; y < -2.6; y += 0.22) B.line(`M 4.6 ${y} L 5.5 ${y}`, 'rgba(0,0,0,0.6)', 0.06, 0.01);
  const NF = ell(2.9, -3.5, 1.0, 1.0);
  cel(g, NF, F, { sh: 0.6, hl: 0.5, gloss: 0.3 });
  B.inside(NF, () => { B.line(ell(2.9, -3.5, 0.74, 0.74), F.d, 0.14, 0.04); for (let a = 0; a < 6.28; a += 0.5) B.line(`M ${2.9 + Math.cos(a) * 0.2} ${-3.5 + Math.sin(a) * 0.2} L ${2.9 + Math.cos(a) * 0.6} ${-3.5 + Math.sin(a) * 0.6}`, F.k, 0.05, 0.01, 0.6); B.dab(2.6, -3.9, 0.4, 0.3, 'rgba(255,200,230,0.4)'); });
  B.fill(ell(2.9, -3.5, 0.16, 0.16), F.k, 0.01);
  // the glasses: smoked wraparound, the lamps of the yard in them, the arm back over the cup
  strap(g, 'M 2.75 -6.7 C 1.8 -6.8 0.9 -6.8 0.2 -6.6', 0.16, '#1b1c1e', '#060606', 'rgba(140,140,140,0.4)');
  B.fill(BGLASS, '#121314', 0.01);
  glass(g, 'M 2.84 -6.9 C 3.6 -7.12 4.5 -7.1 4.96 -6.9 C 5.0 -6.6 4.96 -6.3 4.82 -6.06 C 4.26 -5.9 3.54 -5.9 2.98 -6.04 C 2.8 -6.32 2.78 -6.62 2.84 -6.9 Z', [2.8, -7.12, 5.0, -5.9], { tint: ['#141618', '#4a5662', '#c8a060'], a: 0.85, band: 'rgba(200,220,240,0.3)' });
  // the neck flap, behind the hat's brim
  const O = mat(tone('#f08a4a', '#c8632e', '#8a3f1a', '#3e1a08'), 'canvas', 0.7);
  const FLAP = 'M -6.0 -7.4 C -4.8 -7.7 -3.4 -7.7 -2.2 -7.5 L -1.8 -4.0 C -2.8 -3.2 -4.8 -3.1 -6.2 -3.6 Z';
  cel(g, FLAP, O, { sh: 0.8, hl: 0.35 });
  clip(g, FLAP, () => { fold(g, [[-5.4, -7.0], [-5.0, -5.6], [-5.2, -4.0]], O, 0.2); fold(g, [[-3.4, -7.2], [-3.0, -5.6], [-3.2, -4.0]], O, 0.18); grime(g, -6, -3.0, OIL); });
  // the hard hat: faded yellow, the ridge over the crown, the brim all round, scuffed and dirty
  cel(g, BHAT, Ht, { sh: 1.5, hl: 0.7 });
  B.inside(BHAT, () => {
    B.line('M -4.6 -9.6 C -3.2 -12.2 2.4 -12.8 4.8 -10.0', 'rgba(150,120,50,0.5)', 0.4, 0.12);
    g.save(); g.translate(0.05, -0.2); B.line('M -4.6 -9.6 C -3.2 -12.2 2.4 -12.8 4.8 -10.0', 'rgba(255,246,200,0.6)', 0.16, 0.06); g.restore();
    B.line('M -6.4 -7.3 C -4.8 -7.8 -2.6 -8.0 0.2 -8.05 C 3.2 -8.1 5.4 -7.9 7.4 -7.7', 'rgba(110,86,30,0.6)', 0.16, 0.04);
    B.line('M -6.5 -7.6 C -4.8 -8.1 -2.6 -8.3 0.2 -8.35 C 3.2 -8.4 5.4 -8.2 7.5 -8.0', 'rgba(255,246,200,0.5)', 0.08, 0.03);
    B.dab(-5.0, -8.0, 1.4, 0.6, 'rgba(60,50,20,0.4)');
    const r = rnd(77);
    for (let i = 0; i < 9; i++) B.line(`M ${-3 + r() * 7} ${-11.6 + r() * 3} l ${0.4 + r() * 0.8} ${(r() - 0.5) * 0.3}`, 'rgba(250,240,200,0.5)', 0.05, 0.02);
    for (const [x, y] of [[4.2, -8.1], [1.2, -8.2], [-2.6, -7.9], [6.2, -7.85]]) { B.dab(x, y, 0.14, 0.1, 'rgba(60,50,20,0.5)'); B.dab(x - 0.04, y - 0.04, 0.05, 0.04, '#fffbe8'); }
    texture(g, 'paint', 0.35, 0.6);
  });
  // the lamp's band and the lamp on the front, a carpenter's pencil pushed under the band
  B.line('M -5.0 -8.6 C -2.0 -9.1 2.0 -9.3 5.3 -9.0', '#26282b', 0.4, 0.02);
  cel(g, 'M 3.6 -10.1 L 5.0 -10.2 L 5.1 -8.9 L 3.7 -8.8 Z', PAL.black, { sh: 0.3, hl: 0.35, gloss: 0.3 });
  B.fill('M 5.0 -10.1 L 5.3 -10.1 L 5.32 -9.0 L 5.04 -8.98 Z', '#fff6d8', 0.01);
  g.save(); g.translate(0.6, -9.25); g.rotate(-0.06);
  cel(g, 'M -1.5 -0.18 L 1.3 -0.18 L 1.3 0.18 L -1.5 0.18 Z', mat(tone('#e05a40', '#b83a26', '#7e2416', '#360d06'), 'paint', 0.4), { sh: 0.1, hl: 0.2 });
  B.fill('M 1.3 -0.18 L 1.8 0 L 1.3 0.18 Z', '#d8b890', 0.005);
  g.restore();
  // stickers: a green cross, a blue square, a torn yellow-black stripe (no lettering)
  B.fill('M -2.4 -11.0 L -1.4 -11.2 L -1.3 -10.3 L -2.3 -10.1 Z', '#f4f1e8', 0.01, 0.9);
  B.fill('M -2.0 -11.05 L -1.7 -11.1 L -1.65 -10.2 L -1.95 -10.15 Z', '#2f8a4a', 0.005);
  B.fill('M -2.3 -10.75 L -1.4 -10.9 L -1.38 -10.6 L -2.28 -10.45 Z', '#2f8a4a', 0.005);
  B.fill('M 1.6 -11.9 L 2.6 -11.86 L 2.54 -11.06 L 1.54 -11.1 Z', '#3a6ea8', 0.01, 0.9);
  for (let k = 0; k < 3; k++) B.fill(`M ${-4.4 + k * 0.5} -9.4 L ${-4.1 + k * 0.5} -9.45 L ${-4.3 + k * 0.5} -8.95 L ${-4.6 + k * 0.5} -8.9 Z`, k % 2 ? '#1a1814' : '#e8c23a', 0.005, 0.85);
}

export const BRICK = {
  id: 'brick', name: 'BULWARK', role: 'AĞIR', pal: PAL,
  pose: { nUpper: 0.32, nFore: 0.04, nHand: 0.0, fUpper: -0.32, fFore: -0.14, fHand: -0.1, nThigh: 0.24, nShin: 0.04, fThigh: -0.3, fShin: -0.04, head: -0.02 },
  parts: { backFar, torso, chest, head, upper, fore, hand, thigh, shin, foot },
};
