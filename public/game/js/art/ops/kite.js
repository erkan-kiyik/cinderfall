// SKYE — recon. Twenty-two; rode courier through the city until the city
// closed, and builds drones out of whatever is thrown away (docs/KOR_STORY_
// CINEMATIC.md §9.2). Small and light: a matte black bike helmet under
// stickers, mirrored sky-blue sport glasses, a patterned bandana over the
// mouth; a faded mustard windbreaker with a reflective strip across the back,
// sleeves shoved up over a dark sweatshirt; a patched canvas messenger bag
// worn across the body; fingerless bike gloves; black tights under short
// cargo shorts, black knee pads, worn running shoes. And the drone, made
// from scrap. Built on the body standard in body.js.
import { M, tone, mat } from '../style.js';
import {
  cel, fill, stroke, clip, blob, curve, fold,
  UPPER, FORE, THIGH, SHIN, TORSO, PELVIS,
  glove, kneePad, headShape, skinGlaze, skinDetail, neck, korBand, stitch, rivet, buckle, grime, scuffs,
  clothFolds, brushOf, paintEar,
} from './body.js';
import { texture } from '../tex.js';
import { rnd } from '../paint.js';
import { PROFILE_F, SKINS, face, crop, strap, glass, ell, inP } from './realhead.js';

const PAL = {
  wind: mat(tone('#d6b467', '#b19044', '#84692b', '#3d3011'), 'nylon', 0.55),
  sweat: mat(tone('#4e5055', '#37393e', '#26282c', '#0f1012'), 'wool', 0.6),
  tights: mat(tone('#3a3c41', '#28292d', '#1a1b1e', '#09090a'), 'knit', 0.35),
  shorts: mat(tone('#605f53', '#47463a', '#302f27', '#13130f'), 'canvas', 0.7),
  cream: mat(tone('#f2e8cf', '#d5c7a5', '#a89978', '#554c38'), 'canvas', 0.4),
  bag: mat(tone('#bfb18e', '#9a8d6a', '#71664b', '#352f21'), 'canvas', 0.8),
  sky: tone('#e6f7ff', '#7ec8ff', '#3b8fd6', '#13416b'),
  helmet: mat(tone('#494b4f', '#323437', '#222427', '#0c0d0e'), 'rubber', 0.6),
  pad: mat(tone('#43454a', '#2e3034', '#1e1f22', '#0a0b0c'), 'rubber', 0.6),
  shoe: mat(tone('#8a8d94', '#66696f', '#484b51', '#1d1f22'), 'nylon', 0.6),
  bandana: mat(tone('#465380', '#313c5d', '#212941', '#0c101a'), 'canvas', 0.45),
  tape: mat(tone('#cdd0d2', '#a2a6a9', '#76797c', '#35383a'), 'canvas', 0.4),
  glove: mat(tone('#3f4146', '#2c2e32', '#1d1e21', '#0a0b0c'), 'leather', 0.5),
  steel: mat(tone('#b9bdc0', '#8c9195', '#62666a', '#2a2d30'), 'steel', 0.6),
  skin: mat(M.skinC, 'skin', 0.45),
};

// --- torso --------------------------------------------------------------------------
// the windbreaker: loose, puffed by the wind, gathered at an elastic hem
const WIND = blob([
  [-2.2, -23.4], [-5.4, -22.8], [-8.3, -21.2], [-9.1, -18.4], [-8.8, -14.6], [-8.0, -10.6], [-7.6, -6.8], [-6.9, -3.6], [-6.4, -2.6],
  [5.6, -2.8], [6.4, -4.2], [6.6, -7.6], [6.8, -12.0], [7.4, -16.0], [7.0, -19.8], [4.6, -22.6], [1.2, -23.8],
]);
function torso(g) {
  cel(g, PELVIS, PAL.shorts, { sh: 1.1, hl: 0.4 });
  cel(g, TORSO, PAL.sweat, { sh: 1.0, hl: 0.3, line: false });
  // the hood rolled up at the back of the neck
  cel(g, blob([[-6.6, -21.6], [-4.4, -24.6], [-1.4, -25.2], [-0.6, -23.0], [-3.0, -21.6], [-5.4, -20.2]]), PAL.wind, { sh: 0.7, hl: 0.3 });
  cel(g, WIND, PAL.wind, { sh: 2.0, hl: 0.6 });
  clip(g, WIND, () => {
    // the strip across the back, the zip, the elastic hem gathering the cloth
    fill(g, 'M -10 -16.6 L -4.6 -16.9 L -4.6 -15.5 L -10 -15.2 Z', PAL.tape.l);
    fill(g, 'M -10 -16.05 L -4.6 -16.3 L -4.6 -16.0 L -10 -15.75 Z', PAL.tape.d, 0.5);
    stroke(g, 'M 5.0 -22.4 C 5.2 -15 5.0 -8 5.2 -3', PAL.wind.k, 0.3);
    for (let y = -21.6; y < -3.4; y += 0.5) stroke(g, `M 4.85 ${y} l 0.35 0`, PAL.tape.d, 0.12, 0.8);
    fill(g, 'M -7 -4.4 C -2 -3.8 2 -3.8 6.6 -4.6 L 6.6 -2 L -7 -2 Z', PAL.wind.d, 0.7);
    for (let x = -6.4; x < 6; x += 0.9) stroke(g, `M ${x} -4.2 l 0.3 1.4`, PAL.wind.k, 0.14, 0.7);
    // the cloth puffed out: big soft folds
    fold(g, [[-6.4, -14.6], [-4.8, -11.0], [-5.4, -6.0]], PAL.wind, 0.34);
    fold(g, [[-2.8, -9.6], [0.0, -8.6], [3.0, -9.2]], PAL.wind);
    fold(g, [[-1.8, -6.6], [0.6, -5.8], [3.6, -6.4]], PAL.wind, 0.26);
    // nylon crumples: many small creases, sharper than wool, a sheen on the shoulder
    clothFolds(g, WIND, [[[-7.6, -19.6], [-5.6, -18.2], [-3.4, -18.6]], [[-8.2, -12.6], [-6.6, -11.8], [-4.8, -12.4]], [[0.4, -21.6], [2.2, -20.4], [4.2, -20.8]], [[-4.6, -13.6], [-2.4, -12.8], [0.2, -13.4], [2.8, -12.6]], [[1.8, -11.2], [3.6, -10.4], [5.8, -10.8]], [[-6.2, -8.2], [-4.2, -7.4], [-2.6, -8.0]]], PAL.wind);
    // a tear, taped over
    cel(g, 'M -2.2 -18.6 L 0.6 -19.4 L 0.9 -18.4 L -1.9 -17.6 Z', PAL.tape, { sh: 0.2, hl: 0.2, lw: 0.2 });
    // the courier company's patch, cut off: its outline and loose threads
    stroke(g, 'M 1.0 -16.4 L 3.8 -16.6 L 3.8 -14.6 L 1.0 -14.4 Z', PAL.wind.d, 0.14, 0.8);
    stitch(g, 'M 1.2 -16.2 L 3.6 -16.4', PAL.wind.k, 0.08, 0.6);
    for (const [x, y] of [[1.0, -15.0], [3.8, -15.6]]) stroke(g, `M ${x} ${y} q 0.3 0.3 0.1 0.7`, '#f2e8cf', 0.06, 0.8);
    // the slash pocket, its zip
    stroke(g, 'M -1.8 -9.6 L 2.4 -7.4', PAL.wind.k, 0.24);
    stitch(g, 'M -1.7 -9.3 L 2.5 -7.1', PAL.tape.d, 0.08, 0.7);
    // the seam down the side, the front zip's pull
    stitch(g, curve([[-5.4, -20.4], [-5.8, -14.0], [-5.6, -8.0], [-5.2, -3.6]]), PAL.wind.d, 0.08, 0.6);
    cel(g, 'M 4.9 -19.4 L 5.5 -19.4 L 5.5 -17.9 L 4.9 -17.9 Z', PAL.steel, { sh: 0.1, hl: 0.15, lw: 0.12 });
    grime(g, -9, -2, 'rgba(40,32,20,0.35)');
  });
  // the messenger bag riding on the small of the back
  const BAG = 'M -11.4 -11.0 C -11.6 -11.8 -11.0 -12.4 -10.2 -12.4 L -4.8 -12.0 L -5.0 -3.6 L -10.4 -3.4 C -11.2 -3.4 -11.6 -4.0 -11.6 -4.8 Z';
  cel(g, BAG, PAL.bag, { sh: 1.1, hl: 0.45 });
  clip(g, BAG, () => {
    fill(g, 'M -12 -12.6 L -4.6 -12.2 L -4.7 -7.6 C -7.0 -7.0 -9.6 -7.0 -12 -7.4 Z', PAL.bag.d, 0.5);
    stroke(g, 'M -12 -7.4 C -9.6 -7.0 -7.0 -7.0 -4.7 -7.6', PAL.bag.k, 0.26);
    // the patches: a square of other canvas, a sky-blue reflector
    cel(g, 'M -10.6 -6.4 L -8.0 -6.6 L -7.9 -4.4 L -10.5 -4.2 Z', PAL.shorts, { sh: 0.2, hl: 0.15, lw: 0.2 });
    for (let x = -10.4; x < -8; x += 0.5) stroke(g, `M ${x} -6.45 l 0.2 0`, PAL.cream.m, 0.1, 0.8);
    fill(g, 'M -6.6 -10.6 a 0.7 0.7 0 1 0 1.4 0 a 0.7 0.7 0 1 0 -1.4 0 Z', PAL.sky.d);
    fill(g, 'M -6.3 -10.75 a 0.3 0.3 0 1 0 0.6 0 a 0.3 0.3 0 1 0 -0.6 0 Z', PAL.sky.l, 0.8);
    stitch(g, 'M -11.4 -11.8 L -5.0 -11.5', PAL.bag.l, 0.08, 0.6);
    stitch(g, 'M -11.2 -7.0 C -9.6 -6.6 -7.0 -6.6 -4.9 -7.2', PAL.bag.l, 0.07, 0.6);
    grime(g, -9, -3, 'rgba(50,40,26,0.45)');
  });
  // the flap's buckles, the keys on a carabiner
  buckle(g, -9.4, -8.2, 0.8, 1.0, PAL.steel); buckle(g, -6.6, -8.4, 0.8, 1.0, PAL.steel);
  stroke(g, 'M -4.6 -6.2 a 0.45 0.7 0 1 0 0.2 1.4', PAL.steel.m, 0.16);
  for (const [dx, a] of [[0, 0.3], [0.3, -0.2]]) { g.save(); g.translate(-4.4 + dx, -4.4); g.rotate(a); cel(g, 'M -0.15 0 L 0.15 0 L 0.15 1.2 L -0.15 1.2 Z', PAL.steel, { sh: 0.1, hl: 0.1, lw: 0.1 }); g.restore(); }
  courierKit(g);
}
// From the courier years (docs §10.22): the rear bike light still clipped to
// the bag's back edge, its red lens lit; a roll of gaffer tape hung on a
// strap under the bag (the drone is held together with it).
function courierKit(g) {
  const B = brushOf(g);
  cel(g, 'M -12.4 -10.6 L -11.2 -10.7 L -11.1 -7.6 L -12.3 -7.5 Z', PAL.helmet, { sh: 0.2, hl: 0.3, gloss: 0.3 });
  fill(g, 'M -12.25 -10.2 L -11.35 -10.25 L -11.3 -8.0 L -12.2 -7.95 Z', '#c02a24');
  for (let y = -9.9; y < -8.1; y += 0.42) stroke(g, `M -12.2 ${y} L -11.35 ${y - 0.02}`, '#ff8a6a', 0.08, 0.6);
  B.dab(-11.8, -9.1, 0.9, 1.4, 'rgba(255,60,40,0.3)');
  // the tape: a grey ring, its cardboard core, a loose end
  stroke(g, 'M -8.6 -3.6 L -8.6 -2.2', PAL.bag.d, 0.3);
  fill(g, 'M -10.0 -0.8 a 1.4 1.3 0 1 0 2.8 0 a 1.4 1.3 0 1 0 -2.8 0 Z', PAL.tape.d);
  fill(g, 'M -9.85 -0.85 a 1.25 1.15 0 1 0 2.5 0 a 1.25 1.15 0 1 0 -2.5 0 Z', PAL.tape.m);
  stroke(g, 'M -9.7 -1.5 a 1.1 1.0 0 0 1 1.9 -0.3', PAL.tape.l, 0.14, 0.8);
  fill(g, 'M -9.25 -0.85 a 0.65 0.6 0 1 0 1.3 0 a 0.65 0.6 0 1 0 -1.3 0 Z', '#a88a5a');
  fill(g, 'M -9.0 -0.85 a 0.4 0.36 0 1 0 0.8 0 a 0.4 0.36 0 1 0 -0.8 0 Z', '#1b1a18');
  fill(g, 'M -7.3 -0.6 L -6.7 0.6 L -7.3 0.9 L -7.6 -0.2 Z', PAL.tape.m);
}
function chest(g) {
  // the windbreaker's stand collar round the neck, unzipped at the throat over the dark
  // sweatshirt's neck; the zip's pull hanging
  const B = brushOf(g), W = PAL.wind;
  const CREW = 'M 1.0 -24.4 C 1.8 -24.6 2.8 -24.5 3.5 -24.1 L 3.7 -22.6 C 2.8 -22.4 1.8 -22.5 1.0 -22.8 Z';
  cel(g, CREW, PAL.sweat, { sh: 0.4, hl: 0.25, lw: 0.14 });
  B.inside(CREW, () => { for (let x = 1.2; x < 3.6; x += 0.18) B.line(`M ${x} -24.5 L ${x + 0.05} -22.6`, 'rgba(10,10,12,0.4)', 0.05, 0.02); });
  const COL = 'M -3.4 -22.2 C -3.5 -23.4 -3.2 -24.6 -2.4 -25.2 C -1.0 -25.6 0.6 -25.4 1.6 -24.9 C 2.1 -24.7 2.4 -24.5 2.6 -24.3 L 2.9 -22.4 C 1.8 -22.0 0.4 -21.9 -0.9 -21.9 C -1.9 -21.9 -2.8 -22.0 -3.4 -22.2 Z';
  cel(g, COL, W, { sh: 0.8, hl: 0.4 });
  B.inside(COL, () => {
    B.line('M -2.6 -25.1 C -1.0 -25.5 0.6 -25.32 1.6 -24.82 C 2.1 -24.62 2.4 -24.42 2.6 -24.22', 'rgba(255,236,190,0.4)', 0.14, 0.08);
    B.fill('M -5 -23.4 C -2 -23.2 1 -23.0 4 -22.6 L 4 -21 L -5 -21 Z', 'rgba(40,28,8,0.35)', 0.3);
    B.dab(-2.8, -23.4, 0.9, 1.4, 'rgba(40,28,8,0.4)');
  });
  stitch(g, 'M -2.8 -24.7 C -1.2 -25.1 0.6 -25.0 2.3 -24.3', W.l, 0.05, 0.5);
  // the zip's teeth down the open edge and its pull
  B.line('M 2.56 -24.2 L 2.84 -22.4', '#3a3226', 0.12, 0.01);
  for (let y = -24.1; y < -22.5; y += 0.16) B.line(`M ${2.5 + (y + 24.2) * 0.17} ${y} l 0.16 0`, 'rgba(200,190,160,0.5)', 0.04);
  B.fill('M 2.86 -22.9 L 3.12 -22.92 L 3.18 -22.1 L 2.94 -22.06 Z', '#2a2620', 0.01);
  // the bag's wide strap across the chest, its cam buckle
  const STRAP = 'M -3.6 -22.0 L -1.8 -22.6 L 6.6 -8.6 L 5.0 -7.6 Z';
  cel(g, STRAP, PAL.bag, { sh: 0.3, hl: 0.2, lw: 0.26 });
  clip(g, STRAP, () => stroke(g, 'M -2.7 -22.3 L 5.8 -8.1', PAL.bag.d, 0.14, 0.8));
  cel(g, 'M 0.6 -17.0 L 2.6 -18.2 L 3.4 -16.9 L 1.4 -15.7 Z', PAL.helmet, { sh: 0.2, hl: 0.25, lw: 0.22 });
  // a phone clipped on the strap
  cel(g, 'M 3.2 -14.6 L 4.6 -15.4 L 6.2 -12.8 L 4.8 -12.0 Z', PAL.helmet, { sh: 0.2, hl: 0.2, lw: 0.22 });
  fill(g, 'M 3.7 -14.4 L 4.5 -14.9 L 5.7 -12.9 L 4.9 -12.4 Z', '#18324a');
}

function front(g, ctx) {
  // the drone over the raised far hand (board pose only; in game it is its own sprite)
  const [hx, hy] = ctx.J.hip, [wx, wy] = ctx.J.fWr;
  g.save(); g.translate(wx - hx + 1.6, wy - hy - 9.2); g.rotate(-0.08); drone(g); g.restore();
}

// The drone, centred on its body: a cheap plastic box under gaffer tape, four
// arms of aluminium tube (two seen), props that do not match, an old phone's
// camera bolted under the nose, a whip of antenna wire.
export function drone(g) {
  const BODY = blob([[-3.4, -0.9], [-1.0, -1.6], [2.4, -1.5], [3.6, -0.4], [3.4, 1.2], [-1.4, 1.5], [-3.6, 0.8]]);
  // arms out to the motors
  for (const [x, c] of [[-5.0, PAL.sky], [5.2, PAL.cream]]) {
    stroke(g, `M ${x * 0.4} -0.4 L ${x} -1.5`, PAL.tape.k, 0.75);
    stroke(g, `M ${x * 0.4} -0.5 L ${x} -1.6`, PAL.tape.l, 0.3);
    cel(g, `M ${x - 0.6} -2.4 L ${x + 0.6} -2.4 L ${x + 0.6} -1.2 L ${x - 0.6} -1.2 Z`, PAL.helmet, { sh: 0.2, hl: 0.15 });
    // the blur of the prop, and the prop guard (one sky-blue, one bare cream)
    fill(g, `M ${x - 3.0} -2.8 a 3.0 0.55 0 1 0 6.0 0 a 3.0 0.55 0 1 0 -6.0 0 Z`, 'rgba(225,238,250,0.34)');
    stroke(g, `M ${x - 3.0} -2.8 a 3.0 0.55 0 1 0 6.0 0`, 'rgba(255,255,255,0.55)', 0.18);
    stroke(g, `M ${x - 3.2} -2.6 C ${x - 3.2} -1.6 ${x + 3.2} -1.6 ${x + 3.2} -2.6`, c.d, 0.32);
  }
  cel(g, BODY, PAL.shoe, { sh: 0.7, hl: 0.35 });
  clip(g, BODY, () => {
    // tape wrapped round it, a zip tie, a scrawled number
    fill(g, 'M -1.4 -2 L 0.4 -2 L 0.0 2 L -1.8 2 Z', PAL.tape.l, 0.9);
    stroke(g, 'M -1.4 -2 L -1.8 2', PAL.tape.d, 0.12);
    stroke(g, 'M 1.8 -2 L 1.6 2', '#111', 0.22);
    stroke(g, 'M -3.0 0.2 l 0.5 -0.6 l 0.2 0.8', PAL.cream.l, 0.14, 0.8);
  });
  // the phone camera under the nose: its lens, dark glass with the sky in it, and the status light
  cel(g, 'M 1.6 0.8 L 3.6 0.6 L 3.6 2.0 L 1.8 2.1 Z', PAL.helmet, { sh: 0.2, hl: 0.15, lw: 0.22 });
  fill(g, 'M 2.5 1.35 a 0.5 0.5 0 1 0 1.0 0 a 0.5 0.5 0 1 0 -1.0 0 Z', '#0b1420');
  fill(g, 'M 2.75 1.3 a 0.24 0.24 0 1 0 0.48 0 a 0.24 0.24 0 1 0 -0.48 0 Z', '#2c3c4c');
  fill(g, 'M 2.7 1.12 a 0.12 0.08 0 1 0 0.24 0 a 0.12 0.08 0 1 0 -0.24 0 Z', '#a8b8c8', 0.7);
  fill(g, 'M -2.9 -0.3 a 0.22 0.22 0 1 0 0.44 0 a 0.22 0.22 0 1 0 -0.44 0 Z', '#9a3a30');
  // the antenna wire and the legs it lands on (bent coat-hanger wire)
  stroke(g, 'M -2.6 -1.2 C -3.4 -2.8 -4.4 -3.4 -5.6 -3.6', PAL.tape.k, 0.18);
  stroke(g, 'M -1.8 1.4 L -2.4 3.0 L -3.2 3.0 M 1.4 1.6 L 2.0 3.0 L 2.8 3.0', PAL.tape.d, 0.32);
}

// --- arms ---------------------------------------------------------------------------
function upper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL.wind), { sh: 1.6, hl: 0.5 });
  clip(g, UPPER, () => { fold(g, [[-2.0, 2.0], [-0.4, 3.0], [1.6, 2.6]], t(PAL.wind), 0.28); fold(g, [[-1.8, 7.6], [0.0, 8.6], [1.8, 8.2]], t(PAL.wind), 0.3); });
  clothFolds(g, UPPER, [[[-2.2, 4.6], [-0.6, 5.4], [1.8, 5.0]], [[-2.0, 6.4], [0.2, 6.9], [2.0, 6.5]]], t(PAL.wind));
  if (!ctx.far) korBand(g, t(PAL.sweat));
  // the sleeve shoved up and bunched over the elbow
  const BUNCH = blob([[-2.8, 9.0], [2.6, 8.8], [3.1, 10.4], [2.5, 12.6], [-2.4, 12.8], [-3.2, 11.0]]);
  cel(g, BUNCH, t(PAL.wind), { sh: 0.7, hl: 0.35 });
  clip(g, BUNCH, () => { for (const y of [9.8, 11.0, 12.0]) stroke(g, `M -3 ${y} C -1 ${y + 0.4} 1 ${y + 0.3} 3 ${y - 0.1}`, t(PAL.wind).d, 0.24); });
}
function fore(g, ctx) {
  const t = ctx.t;
  // the sweatshirt cuff pushed up, then the bare forearm
  cel(g, FORE, t(PAL.skin), { sh: 1.2, hl: 0.4 });
  cel(g, blob([[-2.4, -1.2], [2.6, -1.4], [2.7, 2.2], [-2.4, 2.4]]), t(PAL.sweat), { sh: 0.4, hl: 0.25, lw: 0.26 });
  clip(g, FORE, () => stroke(g, curve([[1.6, 3.4], [1.4, 6.0], [1.0, 9.0]]), t(PAL.skin).d, 0.2, 0.6));
  if (!ctx.far) {
    // a knotted cord round the wrist
    stroke(g, 'M -1.8 8.6 C -0.6 9.0 0.8 9.0 1.8 8.6', '#8a2f2a', 0.36);
    fill(g, 'M 1.6 8.4 a 0.3 0.3 0 1 0 0.6 0 a 0.3 0.3 0 1 0 -0.6 0 Z', '#8a2f2a');
  }
}
function hand(g, ctx) { glove(g, ctx, PAL.glove, { fingerless: PAL.skin, cuff: PAL.glove, knuckle: PAL.sky }); }

// --- legs ---------------------------------------------------------------------------
function thigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(PAL.tights), { sh: 1.5, hl: 0.5 });
  // the shorts, to above the knee, a cargo pocket on the side
  const SH = blob([[-4.6, -1.8], [4.4, -2.0], [4.2, 4.0], [3.6, 9.2], [-3.4, 9.6], [-4.8, 4.0]]);
  cel(g, SH, t(PAL.shorts), { sh: 1.2, hl: 0.4 });
  clip(g, SH, () => {
    cel(g, 'M -2.4 2.6 L 1.4 2.4 L 1.6 7.6 C 0.4 8.0 -1.2 8.0 -2.2 7.7 Z', t(PAL.shorts), { sh: 0.4, hl: 0.25, lw: 0.26 });
    fill(g, 'M -2.6 2.2 L 1.6 2.0 L 1.6 3.6 L -2.5 3.8 Z', t(PAL.shorts).d, 0.8);
    stroke(g, 'M -4.8 8.4 C -1.6 8.8 1.6 8.6 3.8 8.2', t(PAL.shorts).k, 0.24);
    stitch(g, 'M -4.8 7.9 C -1.6 8.3 1.6 8.1 3.8 7.7', t(PAL.shorts).l, 0.07, 0.6);
    stitch(g, 'M -2.2 4.2 L 1.4 4.0', t(PAL.shorts).l, 0.07, 0.6);
    for (let x = -4.4; x < 3.6; x += 0.5) stroke(g, `M ${x} 9.0 l 0.05 0.5`, t(PAL.shorts).l, 0.06, 0.7);
    grime(g, 3, 10, 'rgba(40,36,26,0.35)');
    fold(g, [[2.4, 1.0], [2.8, 5.0], [2.6, 8.6]], t(PAL.shorts), 0.26);
  });
  if (!ctx.far) {
    // a spare drone battery held on the pocket with a rubber band, its yellow
    // label, the red and black leads tucked into the pocket (docs §10.22)
    cel(g, 'M -2.0 4.4 L 1.2 4.3 L 1.3 7.3 L -1.9 7.4 Z', PAL.helmet, { sh: 0.3, hl: 0.3, gloss: 0.2 });
    fill(g, 'M -1.8 4.75 L 1.1 4.66 L 1.12 6.0 L -1.78 6.08 Z', '#e8c23a');
    stroke(g, 'M -1.5 5.35 L 0.6 5.29', '#2a2620', 0.14, 0.8);
    stroke(g, 'M -2.2 6.5 L 1.4 6.4', '#7a2a22', 0.22);
    stroke(g, 'M 1.2 4.6 C 2.0 4.2 2.2 3.2 1.5 2.6', '#c8302a', 0.24);
    stroke(g, 'M 1.2 5.0 C 2.4 4.6 2.6 3.0 1.7 2.3', '#151515', 0.24);
  }
}
function shin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(PAL.tights), { sh: 1.3, hl: 0.5 });
  clip(g, SHIN, () => stroke(g, curve([[1.4, 4.0], [1.6, 9.0], [1.2, 13.0]]), t(PAL.tights).l, 0.22, 0.5));
  kneePad(g, ctx, PAL.pad, null);
  // the sock showing over the shoe
  cel(g, blob([[-2.2, 12.6], [2.1, 12.4], [2.2, 15.0], [-2.3, 15.1]]), t(PAL.cream), { sh: 0.3, hl: 0.2, lw: 0.24 });
}
// worn running shoes: grey mesh, a white foam sole gone grey, the laces
const SHOE = blob([[-2.4, -0.9], [1.4, -0.9], [2.8, 0.2], [5.0, 0.7], [6.8, 1.3], [7.0, 2.0], [-2.6, 2.0], [-2.8, 0.6]]);
function foot(g, ctx) {
  const t = ctx.t;
  cel(g, SHOE, t(PAL.shoe), { sh: 0.8, hl: 0.4 });
  clip(g, SHOE, () => {
    for (let i = 0; i < 4; i++) stroke(g, `M ${1.0 + i * 0.85} ${-0.5 + i * 0.3} l 0.7 -0.35`, t(PAL.cream).m, 0.24);
    stroke(g, 'M -1.6 1.4 C 0.4 0.4 2.6 0.2 4.6 1.2', t(PAL.sky).d, 0.36);
    fill(g, 'M -3 -0.4 C -2 -0.2 -1.0 0.2 -0.6 1.0 L -3 1.0 Z', t(PAL.shoe).d, 0.7);
    for (let x = -2; x < 6; x += 0.7) stroke(g, `M ${x} 0.0 l 0.25 0.25`, t(PAL.shoe).d, 0.1, 0.5);
    stitch(g, 'M -2.4 1.2 C 0 1.0 3 1.0 6.6 1.6', t(PAL.shoe).l, 0.06, 0.6);
    scuffs(g, [[5.6, 1.2, 0.5, 0.2], [-1.6, 0.6, 0.35]], '#cfcac0', 0.45);
    grime(g, -1, 2.2, 'rgba(60,50,40,0.4)');
  });
  const SOLE = 'M -2.8 1.6 L 7.0 1.6 C 7.3 1.9 7.3 2.3 7.0 2.5 L -2.7 2.5 C -3.0 2.3 -3.0 1.9 -2.8 1.6 Z';
  cel(g, SOLE, t(PAL.cream), { sh: 0.3, hl: 0.2, lw: 0.24 });
  fill(g, 'M -2.7 2.25 L 7.1 2.25 L 7.0 2.55 L -2.7 2.55 Z', t(PAL.tights).m, 0.8);
}

// --- head (docs §10.25): Skye's face, open. Twenty-two: deep brown skin, a fine short nose,
// full lips, dark eyes with long lashes, a short fade; the cotton cycling cap, the mirrored
// sport glasses pushed up on it, the bandana pulled down round the neck; one earbud in.
const SCAP = 'M -3.9 -7.3 C -4.3 -9.2 -3.3 -10.9 -1.3 -11.5 C 0.8 -12.0 3.0 -11.6 4.0 -10.4 C 4.4 -9.9 4.5 -9.3 4.42 -8.8 C 2.6 -9.0 0.8 -8.9 -0.8 -8.5 C -2.0 -8.2 -3.0 -7.8 -3.9 -7.3 Z';
const SPEAK = 'M 3.6 -8.9 C 4.2 -9.2 4.9 -9.8 5.3 -10.6 C 5.42 -10.9 5.3 -11.06 5.04 -10.98 C 4.5 -10.8 3.9 -10.5 3.3 -10.2 C 3.1 -9.8 3.2 -9.3 3.6 -8.9 Z';
const SFADE = 'M -3.85 -7.2 C -3.0 -7.7 -2.0 -8.1 -0.8 -8.4 C 0.4 -8.7 1.6 -8.8 2.8 -8.8 C 2.6 -8.2 2.0 -7.6 1.3 -7.2 C 0.9 -6.9 0.7 -6.6 0.62 -6.2 L -0.4 -6.8 C -1.4 -6.4 -2.4 -5.4 -2.7 -3.8 C -3.4 -4.4 -3.9 -5.6 -3.85 -7.2 Z';
const SCOLL = 'M 4.2 -2.0 C 3.3 -1.5 2.0 -1.6 0.8 -2.3 C -0.4 -2.9 -2.0 -3.3 -3.4 -3.1 C -4.2 -2.2 -4.4 -0.8 -4.0 0.6 C -2.4 1.6 0.6 1.8 3.0 1.4 C 4.3 1.1 4.8 0.4 4.8 -0.6 C 4.7 -1.2 4.5 -1.6 4.2 -2.0 Z';
function head(g) {
  const S = SKINS.deep, B = brushOf(g), Cr = PAL.cream, C = PAL.bandana;
  neck(g, PAL.skin, { glaze: true });
  face(g, { prof: 'f', s: S, age: 0.04, seed: 61, iris: '#2a1810', white: '#a49488', brow: ['#140c08', 0.08, 1.0], lips: '110,52,44', lash: true });
  crop(g, SFADE, { col: '#140e0b', lit: 'rgba(90,70,60,1)', seed: 63, n: 700, a: Math.PI * 0.62 });
  B.inside(SFADE, () => { const fg = g.createLinearGradient(0, -8, 0, -4); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, S.base); g.fillStyle = fg; g.globalAlpha = 0.6; g.fillRect(-5, -8, 7, 5); g.globalAlpha = 1; });
  // the earbud and its white cable, the steel stud
  B.line('M -0.1 -5.4 C -0.5 -4.4 -0.7 -3.0 -0.4 -0.4', '#d8dadc', 0.12, 0.01);
  cel(g, ell(0.18, -5.42, 0.26, 0.22), mat(tone('#ffffff', '#e4e6e8', '#b4b8bc', '#6a6e72'), 'paint', 0.2), { sh: 0.2, hl: 0.3, gloss: 0.4 });
  B.fill(ell(0.0, -4.44, 0.09, 0.09), PAL.steel.l, 0.005);
  // the bandana down round the neck: navy, the cream print, its knot behind
  cel(g, SCOLL, C, { sh: 1.0, hl: 0.45 });
  B.inside(SCOLL, () => { const r = rnd(65); for (let k = 0; k < 30; k++) { const x = -4 + r() * 9, y = -3.2 + r() * 4.6; if (!inP(g, SCOLL, x, y)) continue; B.fill(ell(x, y, 0.13, 0.1), Cr.m, 0.005, 0.85); } texture(g, 'canvas', 0.35, 0.7); });
  clothFolds(g, SCOLL, [[[4.2, -1.2], [2.4, -0.8], [0.4, -1.4], [-2.4, -2.2]], [[4.4, 0.3], [2.2, 0.7], [-0.4, 0.3], [-3.2, -0.6]]], C);
  cel(g, ell(-3.4, -1.4, 0.5, 0.46), C, { sh: 0.6, hl: 0.4 });
  for (const d of ['M -3.6 -1.0 C -4.2 -0.4 -4.4 0.4 -4.3 1.2 C -4.0 1.3 -3.7 1.2 -3.6 1.0 C -3.6 0.3 -3.4 -0.3 -3.2 -0.8 Z']) cel(g, d, C, { sh: 0.5, hl: 0.3 });
  // the cap: cream cotton fitted to the head, the stripe round it, the brim flipped up
  cel(g, SCAP, Cr, { sh: 1.2, hl: 0.5 });
  B.inside(SCAP, () => {
    for (const [y, c, w] of [[-9.6, PAL.sky.m, 0.34], [-9.18, '#d1a42f', 0.2]]) B.line(`M -4.4 ${y + 1.6} C -2.0 ${y - 0.3} 2.0 ${y - 0.7} 4.6 ${y + 0.3}`, c, w, 0.02);
    B.line('M -1.2 -11.6 C -1.3 -10.4 -1.1 -9.4 -0.8 -8.5', 'rgba(110,96,70,0.4)', 0.06, 0.03);
    B.dab(-3.0, -8.0, 1.2, 1.0, 'rgba(60,46,30,0.3)');
    texture(g, 'canvas', 0.35, 0.6);
  });
  B.line('M -3.9 -7.3 C -3.0 -7.8 -2.0 -8.2 -0.8 -8.5 C 0.8 -8.9 2.6 -9.0 4.42 -8.8', Cr.k, 0.12, 0.04, 0.7);
  cel(g, SPEAK, Cr, { sh: 0.4, hl: 0.4 });
  B.inside(SPEAK, () => { B.line('M 3.5 -9.4 C 4.1 -9.8 4.7 -10.3 5.1 -10.8', PAL.sky.m, 0.16, 0.02); B.dab(4.0, -9.4, 0.8, 0.4, 'rgba(60,46,30,0.3)'); });
  // the glasses pushed up on the cap: the arm round it, the frame, the sky-blue mirror
  g.save(); g.translate(0.1, -3.2); g.rotate(-0.08);
  strap(g, 'M 2.7 -6.8 C 1.6 -6.9 0.6 -6.8 -0.6 -6.5', 0.18, '#1d1f22', '#060708', 'rgba(140,150,160,0.5)');
  B.fill('M 2.7 -7.1 C 3.6 -7.32 4.6 -7.3 5.0 -7.06 C 5.08 -6.7 5.02 -6.3 4.86 -5.98 C 4.3 -5.8 3.5 -5.8 2.86 -5.98 C 2.66 -6.3 2.62 -6.72 2.7 -7.1 Z', '#16181b', 0.01);
  glass(g, 'M 2.8 -7.0 C 3.6 -7.2 4.5 -7.18 4.9 -6.98 C 4.96 -6.68 4.92 -6.36 4.78 -6.1 C 4.28 -5.92 3.54 -5.92 2.94 -6.08 C 2.76 -6.36 2.74 -6.7 2.8 -7.0 Z', [2.76, -7.2, 4.96, -5.92], { tint: ['#123a66', '#8fd0ff', '#e8c070'], band: 'rgba(240,250,255,0.55)', a: 0.95, fire: 'rgba(255,200,120,0.5)' });
  g.restore();
}

export const KITE = {
  id: 'kite', name: 'SKYE', role: 'KEŞİF', pal: PAL,
  pose: { nUpper: 0.12, nFore: -0.18, nHand: -0.08, fUpper: -1.75, fFore: -2.05, fHand: -0.25, nThigh: 0.14, nShin: 0.0, fThigh: -0.16, fShin: -0.06, head: 0.1 },
  parts: { torso, chest, front, head, upper, fore, hand, thigh, shin, foot },
};
