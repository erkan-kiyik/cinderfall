// VESPER — control. Thirty-three; she read Vanta's radio traffic for six years
// before she walked out with what she knew (docs/KOR_STORY_CINEMATIC.md
// §9.2). Tall and narrow: a navy wool overcoat to below the knee, collar up,
// open over the grey-blue Vanta jumper she still wears, the patch unpicked
// from its chest and only its unfaded ghost left; a canvas radio bag on her
// back with one whip antenna; a small terminal strapped to the left wrist.
// Dark hair in a knot, a gaiter over the nose, one bone-coloured earpiece
// with its boom, and on the right eye the old Vanta monocle, its light
// turned from red to cyan. Built on the body standard in body.js.
import { M, tone, mat } from '../style.js';
import {
  cel, fill, stroke, clip, blob, curve, fold,
  UPPER, FORE, THIGH, SHIN, TORSO, PELVIS,
  glove, boot, headShape, korBand, stitch, rivet, buckle, grime, scuffs, softEye, softBrow, skinGlaze, softHair,
} from './body.js';

const PAL = {
  coat: mat(tone('#414d68', '#2d374e', '#1e2536', '#0c0f17'), 'wool', 0.75),
  jumper: mat(tone('#8695a7', '#667386', '#4a5566', '#1f242c'), 'knit', 0.7),
  pants: mat(tone('#3e4148', '#2c2f35', '#1d1f24', '#0b0c0e'), 'canvas', 0.45),
  gaiter: mat(tone('#4f5156', '#393b3f', '#27292c', '#0f1012'), 'knit', 0.7),
  hair: tone('#4a3830', '#2c211c', '#1b1411', '#080605'),
  bone: mat(tone('#f2eadb', '#d3c7ad', '#a6997e', '#575040'), 'rubber', 0.3),
  cyan: tone('#d6fffa', '#4fd2c4', '#22958a', '#0b3f3a'),
  vanta: mat(tone('#9eaab8', '#6e7a89', '#4b5563', '#20252c'), 'paint', 0.5),
  glove: mat(tone('#504539', '#373029', '#251f1b', '#0e0b09'), 'leather', 0.7),
  boot: mat(tone('#443e3a', '#2d2a27', '#1c1a18', '#0a0909'), 'leather', 0.6),
  sole: mat(M.rubber, 'rubber', 0.6),
  bag: mat(tone('#5a5c50', '#40423a', '#2b2d26', '#11120e'), 'canvas', 0.75),
  strap: mat(tone('#48493f', '#33342d', '#22231e', '#0e0e0c'), 'nylon', 0.6),
  paper: mat(tone('#efe6cf', '#d8cba9', '#ab9d7c', '#5d553f'), 'paint', 0.3),
  skin: mat(M.skinD, 'skin', 0.4),
};

// --- back: the radio bag and its whip antenna -----------------------------------------------
function backFar(g) {
  // the whip, flexing back as she moves
  stroke(g, 'M -9.4 -21.6 C -9.8 -28.0 -11.6 -34.0 -15.4 -39.6', PAL.strap.k, 0.62);
  stroke(g, 'M -9.4 -21.6 C -9.8 -28.0 -11.6 -34.0 -15.4 -39.6', PAL.vanta.m, 0.26);
  fill(g, 'M -15.9 -39.9 a 0.5 0.5 0 1 0 1.0 0 a 0.5 0.5 0 1 0 -1.0 0 Z', PAL.strap.m);
  cel(g, 'M -10.2 -23.0 L -8.6 -23.1 L -8.5 -20.8 L -10.1 -20.7 Z', PAL.strap, { sh: 0.2, hl: 0.15, lw: 0.24 });
  // the bag: worn canvas, a flap, a side pocket
  const BAG = 'M -12.6 -20.6 C -12.6 -21.4 -12.0 -21.8 -11.2 -21.8 L -6.6 -21.6 L -6.4 -10.2 L -11.0 -10.0 C -11.8 -10.0 -12.4 -10.6 -12.4 -11.4 Z';
  cel(g, BAG, PAL.bag, { sh: 1.2, hl: 0.45 });
  clip(g, BAG, () => {
    fill(g, 'M -13 -22 L -6 -22 L -6 -16.8 C -8.4 -16.2 -10.6 -16.2 -13 -16.6 Z', PAL.bag.d, 0.55);
    stroke(g, 'M -13 -16.6 C -10.6 -16.2 -8.4 -16.2 -6 -16.8', PAL.bag.k, 0.28);
    for (let y = -20.8; y < -10.6; y += 0.9) stroke(g, `M -12.3 ${y} l 0.3 0`, PAL.bag.l, 0.12, 0.7);
    fill(g, 'M -10.2 -17.8 L -8.4 -17.85 L -8.4 -16.9 L -10.2 -16.85 Z', PAL.strap.m);
    stitch(g, 'M -12.2 -21.2 L -6.8 -21.0', PAL.bag.l, 0.08, 0.6);
    // the frequency card taped to the bag, pencilled
    g.save(); g.translate(-9.6, -13.4); g.rotate(-0.06);
    cel(g, 'M -1.6 -1.1 L 1.6 -1.1 L 1.6 1.1 L -1.6 1.1 Z', PAL.paper, { sh: 0.2, hl: 0.1, lw: 0.14, ao: 0.15 });
    for (let i = 0; i < 4; i++) stroke(g, `M -1.3 ${-0.6 + i * 0.42} l ${1.6 + (i % 2) * 0.6} 0`, '#5d5a54', 0.07, 0.8);
    fill(g, 'M -1.9 -1.3 L -0.9 -1.3 L -0.9 -0.8 L -1.9 -0.8 Z', '#cfc3a0', 0.85);
    g.restore();
    grime(g, -14, -9, 'rgba(30,30,24,0.4)');
  });
  // the coiled handset cable out of the bag's side
  stroke(g, 'M -6.6 -12.0 C -5.8 -11.6 -6.2 -10.8 -5.4 -10.4 C -4.6 -10.0 -5.0 -9.2 -4.2 -8.8', PAL.strap.k, 0.24);
  rivet(g, -9.5, -21.9, 0.3, PAL.vanta);
}

// --- torso ----------------------------------------------------------------------------------
// the overcoat, open from the collar down; the skirt goes on in thigh()
const COAT = blob([
  [-2.0, -23.6], [-5.0, -23.0], [-7.6, -21.6], [-8.4, -19.0], [-8.0, -15.4], [-6.8, -11.4], [-6.3, -7.6], [-6.6, -3.4], [-6.6, 1.4],
  [3.4, 1.2], [2.6, -3.0], [2.0, -8.0], [1.6, -13.0], [1.4, -18.0], [1.6, -21.6], [0.6, -23.6],
]);
// the lapel turned back over the open front
const LAPEL = 'M 1.6 -21.8 C 2.6 -20.4 3.0 -18.6 2.8 -16.8 L 1.5 -13.8 C 1.4 -16.6 1.3 -19.4 1.6 -21.8 Z';
function torso(g) {
  cel(g, PELVIS, PAL.pants, { sh: 1.1, hl: 0.4 });
  cel(g, TORSO, PAL.jumper, { sh: 1.4, hl: 0.45 });
  clip(g, TORSO, () => {
    // jumper ribbing at the hem and cuffs, cable stitch
    fill(g, 'M -7 -5.6 L 7 -5.6 L 7 -3.4 L -7 -3.4 Z', PAL.jumper.d, 0.35);
    stroke(g, curve([[3.0, -20.6], [3.6, -15.0], [3.4, -8.0]]), PAL.jumper.d, 0.22, 0.6);
    // where the Vanta patch was: the ring and its bar, unfaded, and the stitch holes round it
    g.save(); g.translate(4.4, -17.2);
    g.strokeStyle = PAL.jumper.d; g.globalAlpha = 0.9; g.lineWidth = 0.55;
    g.beginPath(); g.ellipse(0, 0, 1.25, 1.4, 0, 0, Math.PI * 2); g.stroke();
    g.fillStyle = PAL.jumper.d; g.fillRect(-1.6, -0.22, 3.2, 0.44);
    g.globalAlpha = 0.8; g.fillStyle = PAL.jumper.k;
    for (let a = 0; a < Math.PI * 2; a += 0.42) g.fillRect(Math.cos(a) * 1.95 - 0.06, Math.sin(a) * 2.1 - 0.06, 0.12, 0.12);
    g.globalAlpha = 1; g.restore();
  });
  cel(g, COAT, PAL.coat, { sh: 2.0, hl: 0.55 });
  clip(g, COAT, () => {
    stroke(g, curve([[-5.2, -20.6], [-5.6, -15.0], [-5.2, -9.0], [-5.4, -1.0]]), PAL.coat.d, 0.34);
    fold(g, [[-4.2, -8.4], [-2.0, -7.6], [0.4, -7.8]], PAL.coat);
    stitch(g, curve([[-4.8, -20.6], [-5.2, -15.0], [-4.8, -9.0], [-5.0, -1.0]]), PAL.coat.l, 0.07, 0.5);
    grime(g, -6, 1.6, 'rgba(26,26,30,0.4)');
    // the buttons on the open edge, horn
    for (const y of [-12.4, -8.4, -4.4]) { fill(g, `M 1.0 ${y} a 0.42 0.42 0 1 0 0.84 0 a 0.42 0.42 0 1 0 -0.84 0 Z`, PAL.bone.d); fill(g, `M 1.2 ${y - 0.05} a 0.12 0.12 0 1 0 0.24 0 a 0.12 0.12 0 1 0 -0.24 0 Z`, PAL.bone.k); }
  });
  cel(g, LAPEL, PAL.coat, { sh: 0.5, hl: 0.35, lw: 0.26 });
  clip(g, LAPEL, () => { stroke(g, 'M 1.9 -21.4 C 2.6 -20 2.8 -18.6 2.6 -17', PAL.coat.l, 0.2, 0.7); stitch(g, 'M 1.8 -21.2 C 2.4 -19.8 2.6 -18.4 2.4 -16.8', PAL.coat.l, 0.07, 0.6); });
  // the breast welt pocket, a notebook's spine and a pencil standing in it
  fill(g, 'M -3.4 -16.8 L -0.6 -17.0 L -0.6 -16.6 L -3.4 -16.4 Z', PAL.coat.k, 0.8);
  cel(g, 'M -2.9 -18.4 L -1.4 -18.5 L -1.4 -16.8 L -2.9 -16.7 Z', PAL.paper, { sh: 0.2, hl: 0.15, lw: 0.14 });
  stroke(g, 'M -1.0 -16.9 L -0.9 -19.0', '#c79a3a', 0.24); fill(g, 'M -1.05 -19.0 l 0.15 -0.4 l 0.15 0.4 Z', '#2a2420');
}

function chest(g) {
  // the collar turned up round the gaiter
  const COLLAR = blob([[-3.8, -22.4], [-4.0, -26.0], [-1.2, -27.0], [1.8, -26.8], [3.0, -25.6], [2.6, -22.4], [0.4, -21.8], [-2.0, -21.8]]);
  cel(g, COLLAR, PAL.coat, { sh: 0.8, hl: 0.4 });
  clip(g, COLLAR, () => { stroke(g, curve([[-3.8, -23.4], [-0.6, -24.2], [2.8, -23.6]]), PAL.coat.d, 0.3); stroke(g, curve([[-3.6, -25.6], [-0.6, -26.6], [2.6, -26.0]]), PAL.coat.l, 0.24, 0.8); });
  // the bag's strap across the chest, its buckle
  const STRAP = 'M -3.8 -22.2 L -2.2 -22.6 L 6.6 -9.0 L 5.2 -8.0 Z';
  cel(g, STRAP, PAL.strap, { sh: 0.3, hl: 0.2, lw: 0.26 });
  cel(g, 'M 1.4 -15.8 L 3.0 -16.8 L 3.6 -15.8 L 2.0 -14.8 Z', PAL.vanta, { sh: 0.2, hl: 0.25, lw: 0.22 });
}

// --- arms -----------------------------------------------------------------------------------
function upper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL.coat), { sh: 1.5, hl: 0.45 });
  clip(g, UPPER, () => { stroke(g, curve([[-2.6, -1.0], [-2.8, 4.0], [-2.4, 10.0]]), t(PAL.coat).d, 0.28); fold(g, [[-1.4, 8.8], [0.2, 9.8], [1.6, 9.8]], t(PAL.coat), 0.26); });
  if (!ctx.far) korBand(g, t(PAL.gaiter));
}
function fore(g, ctx) {
  const t = ctx.t;
  cel(g, FORE, t(PAL.coat), { sh: 1.3, hl: 0.4 });
  // the cuff turned back, the jumper's rib showing at the wrist
  cel(g, blob([[-2.5, 6.6], [2.4, 6.4], [2.3, 8.4], [-2.4, 8.6]]), t(PAL.coat), { sh: 0.4, hl: 0.3, lw: 0.26 });
  cel(g, blob([[-1.9, 8.4], [1.8, 8.2], [1.7, 10.0], [-1.8, 10.2]]), t(PAL.jumper), { sh: 0.3, hl: 0.2, lw: 0.24 });
  clip(g, FORE, () => fold(g, [[-1.4, 2.4], [0.0, 3.2], [1.4, 3.0]], t(PAL.coat), 0.26));
  if (ctx.far) return;
  // the wrist terminal: a rugged little screen on two straps, lit cyan
  for (const y of [5.0, 8.2]) cel(g, `M -2.6 ${y} L 2.6 ${y - 0.2} L 2.6 ${y + 0.9} L -2.6 ${y + 1.1} Z`, PAL.strap, { sh: 0.2, hl: 0.15, lw: 0.22 });
  cel(g, 'M 0.6 4.4 L 3.4 4.2 L 3.6 9.4 L 0.8 9.6 Z', PAL.vanta, { sh: 0.4, hl: 0.3, lw: 0.26 });
  for (const [x, y] of [[0.95, 4.7], [3.2, 4.55], [1.1, 9.2], [3.3, 9.05]]) rivet(g, x, y, 0.12, PAL.vanta);
  fill(g, 'M 1.3 5.0 L 3.0 4.9 L 3.1 8.6 L 1.4 8.7 Z', '#0b1f1d');
  g.save(); g.shadowColor = PAL.cyan.m; g.shadowBlur = 3;
  for (let y = 5.5; y < 8.4; y += 0.7) fill(g, `M 1.6 ${y} L ${2.2 + ((y * 7) % 3) * 0.25} ${y} L ${2.2 + ((y * 7) % 3) * 0.25} ${y + 0.28} L 1.6 ${y + 0.28} Z`, PAL.cyan.m, 0.85);
  g.restore();
}
function hand(g, ctx) { glove(g, ctx, PAL.glove); }

// --- legs: the coat's skirt rides on each thigh, past the knee ---------------------------------
const TAIL = blob([[-5.4, -1.4], [2.8, -1.6], [3.6, 4.0], [4.2, 11.0], [4.8, 18.4], [0.6, 19.0], [-4.4, 18.8], [-6.2, 18.0], [-5.9, 9.0], [-5.6, 2.0]]);
function thigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(PAL.pants), { sh: 1.6, hl: 0.45 });
  cel(g, TAIL, t(PAL.coat), { sh: 1.6, hl: 0.5 });
  clip(g, TAIL, () => {
    // the vent at the back, the front edge, the hem
    fill(g, 'M 3.6 0 C 3.9 6 4.3 12 4.9 19.2 L 3.6 19.2 C 3.2 12 2.9 6 2.6 0 Z', t(PAL.coat).k, 0.55);
    stroke(g, 'M -6.4 17.8 C -2.4 18.4 1.4 18.4 5.0 17.9', t(PAL.coat).d, 0.3);
    fold(g, [[-3.0, 1.0], [-3.6, 8.0], [-4.2, 16.0]], t(PAL.coat), 0.34);
    fold(g, [[0.4, 2.0], [0.2, 9.0], [0.0, 16.0]], t(PAL.coat), 0.3);
    stitch(g, 'M -6.2 17.4 C -2.4 18.0 1.4 18.0 4.9 17.5', t(PAL.coat).l, 0.07, 0.5);
    // a tear near the hem, sewn up badly in grey thread
    stroke(g, 'M -3.6 16.4 L -2.2 17.6', t(PAL.coat).k, 0.16);
    for (let i = 0; i < 4; i++) stroke(g, `M ${-3.6 + i * 0.36} ${16.2 + i * 0.32} l 0.4 0.3`, '#9a9890', 0.06, 0.8);
    grime(g, 12, 19.5, 'rgba(26,26,30,0.5)');
    fill(g, 'M -1.6 3.6 L 2.0 3.4 L 2.0 4.1 L -1.6 4.3 Z', t(PAL.coat).k, 0.7);   // pocket welt
  });
}
function shin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(PAL.pants), { sh: 1.4, hl: 0.4 });
  // long laced boots to below the knee
  const TALL = blob([[-2.75, 4.2], [2.5, 3.9], [2.6, 9.0], [2.65, 15.0], [-2.65, 15.1], [-2.9, 9.0]]);
  cel(g, TALL, t(PAL.boot), { sh: 0.8, hl: 0.35 });
  clip(g, TALL, () => {
    for (let y = 5.0; y < 14.4; y += 1.1) { stroke(g, `M 0.9 ${y} L 2.2 ${y + 0.4} M 2.2 ${y} L 0.9 ${y + 0.4}`, '#8c8578', 0.14); rivet(g, 0.8, y + 0.2, 0.11, PAL.vanta); }
    stitch(g, 'M -2.5 5.0 L -2.4 14.6', t(PAL.boot).l, 0.07, 0.6);
    scuffs(g, [[-1.2, 11.6, 0.45, 0.2]], t(PAL.boot).l, 0.4);
    grime(g, 10, 16, 'rgba(50,46,40,0.45)');
  });
  stroke(g, 'M -2.7 4.6 C -0.8 4.2 1.0 4.1 2.5 4.3', t(PAL.boot).l, 0.24);
}
function foot(g, ctx) { boot(g, ctx, PAL.boot, PAL.sole); }

// --- head: hair in a knot, the gaiter over the nose, earpiece, the monocle -------------------
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
const MONO = ell(5.5, -6.85, 0.42, 0.72);
function head(g) {
  const S = PAL.skin, Hr = PAL.hair;
  cel(g, 'M -1.6 1.2 L 2.0 1.0 L 1.9 -2.6 L 0.5 -3.6 L -1.7 -4.2 Z', PAL.gaiter, { sh: 1.1, hl: 0.25 });
  // the knot at the back, under the hair's line
  softHair(g, ell(-4.4, -8.6, 1.55, 1.45), Hr.m, 'rgba(150,110,80,0.7)', [-0.4, -1], 90, 11);
  const HD = headShape({ jaw: 0.2 });
  cel(g, HD, S, { sh: 0.9, hl: 0.35 });
  skinGlaze(g, HD);
  // hair pulled back hard from the brow to the knot
  const HAIR = 'M 3.4 -9.0 C 2.4 -10.0 0.6 -10.6 -1.2 -10.4 C -3.2 -10.1 -4.2 -8.6 -4.0 -6.6 C -3.9 -5.6 -3.4 -4.6 -2.8 -4.0 L -1.8 -4.4 C -1.4 -5.6 -1.0 -6.6 -0.2 -7.6 C 0.8 -8.4 2.2 -8.8 3.4 -9.0 Z';
  softHair(g, HAIR, Hr.m, 'rgba(150,110,80,0.75)', [-1, 0.22], 320, 12);
  // the near eye under a level brow; the far eye behind the monocle
  softBrow(g, 2.3, -7.95, 4.2, -7.85, 0.12, '#2a1d16', 41);
  softEye(g, 3.25, -6.95, 1.5, { iris: '#3a2c22' });
  // the monocle: Vanta grey housing standing off the far eye, the lens lit cyan
  cel(g, 'M 4.3 -7.7 L 5.5 -7.6 L 5.5 -6.1 L 4.3 -6.0 Z', PAL.vanta, { sh: 0.3, hl: 0.25, lw: 0.24 });
  stroke(g, 'M 4.3 -7.3 C 2.6 -7.9 0.4 -7.9 -1.0 -7.2', PAL.vanta.d, 0.2);
  fill(g, MONO, PAL.cyan.d);
  g.save(); g.shadowColor = PAL.cyan.m; g.shadowBlur = 4; fill(g, ell(5.55, -6.85, 0.26, 0.5), PAL.cyan.m); g.restore();
  fill(g, ell(5.6, -7.05, 0.08, 0.16), PAL.cyan.l);
  stroke(g, MONO, PAL.vanta.k, 0.18);
  // the gaiter, pulled up over the nose
  const GAITER = 'M -2.6 -4.2 C -1.4 -4.9 0.8 -5.6 2.8 -5.8 C 4.0 -5.9 5.0 -5.6 5.3 -4.8 C 5.5 -3.6 5.0 -2.4 4.0 -1.8 C 2.6 -1.0 0.4 -0.9 -1.2 -1.2 C -2.4 -1.6 -3.0 -2.6 -2.6 -4.2 Z';
  cel(g, GAITER, PAL.gaiter, { sh: 0.9, hl: 0.35 });
  clip(g, GAITER, () => { stroke(g, curve([[-2.2, -3.2], [0.8, -3.6], [4.8, -3.6]]), PAL.gaiter.d, 0.26); stroke(g, curve([[0.6, -5.4], [2.8, -5.5], [4.9, -5.0]]), PAL.gaiter.l, 0.22, 0.7); });
  // the earpiece over the ear and its boom to the mouth
  cel(g, ell(-0.7, -6.0, 1.05, 1.25), PAL.bone, { sh: 0.4, hl: 0.3, lw: 0.26 });
  fill(g, ell(-0.7, -6.0, 0.45, 0.55), PAL.bone.d);
  stroke(g, 'M -0.1 -5.1 C 0.8 -3.8 2.4 -3.2 3.8 -3.2', PAL.strap.k, 0.3);
  fill(g, ell(3.95, -3.2, 0.42, 0.34), PAL.strap.m);
}

export const MORROW = {
  id: 'morrow', name: 'VESPER', role: 'KONTROL', pal: PAL,
  pose: { nUpper: 0.06, nFore: -0.3, nHand: -0.05, fUpper: -0.1, fFore: -0.2, fHand: -0.1, nThigh: 0.12, nShin: 0.02, fThigh: -0.2, fShin: -0.06, head: 0.06 },
  parts: { backFar, torso, chest, head, upper, fore, hand, thigh, shin, foot },
};
