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
import { rnd } from '../paint.js';
import { texture } from '../tex.js';

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

// --- head: bike helmet, mirrored glasses, bandana (docs §10.15) ----------------------------
// Painted, not drawn: a young face, dark skin with the street's light on it, under a
// road helmet whose foam shows at the rim; wrap-round mirrored glasses with the sky
// in them; a bandana tied over the nose, tented on its tip, knotted behind the ear.
const HEAD = 'M -2.6 -3.6 C -3.4 -4.4 -3.8 -5.6 -3.75 -6.8 C -3.7 -8.4 -2.9 -9.7 -1.4 -10.3 C 0.0 -10.8 1.9 -10.7 3.0 -10.0 C 3.8 -9.5 4.15 -8.7 4.2 -8.0 C 4.24 -7.6 4.32 -7.36 4.42 -7.2 C 4.44 -7.0 4.32 -6.9 4.22 -6.82 C 4.42 -6.4 4.7 -5.8 4.92 -5.32 C 5.06 -5.0 5.04 -4.76 4.86 -4.66 C 4.7 -4.6 4.56 -4.58 4.44 -4.54 C 4.6 -4.2 4.66 -3.9 4.6 -3.6 C 4.6 -3.3 4.62 -3.0 4.5 -2.6 C 4.3 -2.0 3.8 -1.8 3.2 -1.8 C 2.3 -1.85 1.3 -2.2 0.5 -2.7 C 0.0 -3.0 -0.4 -3.3 -0.7 -3.6 C -1.1 -3.2 -1.6 -3.0 -2.2 -3.0 Z';
const NECK = 'M -2.0 1.4 C -2.05 0.2 -2.1 -1.2 -2.4 -2.6 C -2.5 -3.0 -2.6 -3.3 -2.7 -3.6 L 0.0 -3.7 C 0.7 -3.1 1.4 -2.6 1.9 -2.2 C 2.1 -1.2 2.15 0.2 2.1 1.3 Z';
// hair cut in a short fade under the helmet: round the ear, down the nape
const HAIR = 'M 1.7 -8.4 C 1.3 -8.0 1.0 -7.5 0.9 -7.0 C 0.85 -6.7 0.8 -6.5 0.74 -6.3 L 0.4 -6.6 C 0.1 -7.1 -0.5 -7.3 -1.0 -7.0 C -1.3 -6.6 -1.3 -5.9 -1.1 -5.3 C -1.0 -4.8 -1.0 -4.3 -1.3 -3.8 C -1.7 -3.4 -2.2 -3.2 -2.6 -3.4 C -3.4 -4.2 -3.8 -5.4 -3.75 -6.6 C -3.7 -7.5 -3.4 -8.2 -3.0 -8.6 L 1.7 -8.6 Z';
const SHELL = 'M -5.5 -6.9 C -5.9 -8.4 -5.0 -10.6 -2.6 -11.7 C -0.4 -12.5 2.4 -12.3 4.0 -11.1 C 4.9 -10.4 5.35 -9.5 5.2 -8.9 C 5.0 -8.5 4.6 -8.4 4.1 -8.45 C 2.6 -8.6 1.2 -8.5 0.0 -8.2 C -1.4 -7.9 -2.8 -7.5 -3.9 -7.1 C -4.5 -6.9 -5.0 -6.8 -5.5 -6.9 Z';
const FOAM = 'M 4.4 -8.45 C 2.6 -8.6 1.2 -8.5 0.0 -8.2 C -1.4 -7.9 -2.8 -7.5 -3.9 -7.1 C -4.5 -6.9 -5.0 -6.8 -5.5 -6.9 L -5.4 -6.55 C -4.9 -6.45 -4.4 -6.55 -3.8 -6.75 C -2.7 -7.15 -1.3 -7.55 0.05 -7.85 C 1.2 -8.1 2.6 -8.2 4.3 -8.14 Z';
const GLASS = 'M 1.5 -8.15 C 2.9 -8.5 4.5 -8.4 5.4 -7.8 C 5.5 -7.3 5.42 -6.8 5.2 -6.45 C 4.5 -5.9 3.0 -5.85 2.0 -6.15 C 1.6 -6.6 1.45 -7.4 1.5 -8.15 Z';
const BAND = 'M -2.2 -5.4 C -0.8 -5.6 0.6 -5.7 2.0 -5.95 C 3.0 -6.1 3.8 -6.3 4.4 -6.3 C 4.9 -5.95 5.3 -5.5 5.5 -5.12 C 5.46 -4.4 5.34 -3.6 5.12 -2.8 C 4.9 -1.9 4.4 -0.8 3.4 0.5 C 2.4 -0.2 1.6 -0.9 0.9 -1.6 C 0.2 -2.3 -0.6 -3.0 -1.4 -3.6 C -1.9 -4.0 -2.3 -4.4 -2.6 -4.8 Z';
function head(g) {
  const S = PAL.skin, H = PAL.helmet, B = brushOf(g), Sk = { base: '#62402c', lit: 'rgba(170,112,80,1)', dark: 'rgba(30,14,8,1)', red: 'rgba(160,60,40,1)' };
  // the neck in the jaw's shadow, the cord of it catching the street light
  B.fill(NECK, '#4a2a1c', 0.02);
  B.inside(NECK, () => {
    B.fill('M -3 -4 L 3 -4 L 3 -2.0 C 1.6 -2.0 0.2 -1.8 -3 -1.2 Z', 'rgba(16,8,4,0.55)', 0.35);
    B.line('M -0.3 -3.3 C 0.3 -2.0 0.9 -0.8 1.4 0.8', 'rgba(150,100,74,0.35)', 0.3, 0.22);
    B.line('M 1.98 -1.9 C 2.08 -1.0 2.1 0.0 2.08 1.0', 'rgba(176,124,96,0.4)', 0.12, 0.08);
    texture(g, 'skin', 0.35, 0.9);
  });
  // the head: the side of the face half lit, the back of the skull in shade, the front
  // planes (brow, cheekbone) in the light with the sheen dark skin has
  B.fill(HEAD, Sk.base, 0.03);
  B.inside(HEAD, () => {
    B.fill('M -5 -11 L 1.4 -11 C 1.0 -8.6 0.9 -6.0 1.3 -3.9 L 1.6 -1 L -5 -1 Z', 'rgba(20,10,6,0.55)', 0.5);
    B.fill('M 2.6 -9 C 3.6 -8.8 4.2 -8.0 4.4 -7.1 L 5.0 -5.2 L 3.0 -5.0 C 2.7 -6.2 2.5 -7.6 2.6 -9 Z', 'rgba(150,98,68,0.85)', 0.22);
    B.dab(1.2, -7.4, 0.5, 0.7, 'rgba(210,170,150,0.22)');
    B.dab(1.6, -6.0, 0.6, 0.22, 'rgba(236,196,176,0.3)');
    B.dab(3.4, -8.25, 0.8, 0.14, 'rgba(236,200,182,0.35)');
    B.line('M 1.4 -5.85 C 2.2 -5.9 2.9 -5.92 3.6 -5.9', 'rgba(236,196,176,0.45)', 0.14, 0.1);
    B.dab(1.9, -6.6, 0.5, 0.5, 'rgba(26,12,6,0.35)');
    texture(g, 'skin', 0.45, 0.9);
    B.line('M -3.6 -7.6 C -3.85 -6.4 -3.65 -5.0 -3.0 -3.9', 'rgba(130,150,180,0.35)', 0.16, 0.14);
  });
  // the hair: black, tight, close at the sides and faded to skin down the nape
  B.fill(HAIR, '#120c0a', 0.04);
  B.inside(HAIR, () => {
    B.fill('M -4 -4.4 C -3 -4.0 -2 -3.6 -0.8 -3.8 L -0.8 -2.8 L -4 -2.8 Z', 'rgba(74,44,30,0.6)', 0.3);
    const r = rnd(171);
    for (let i = 0; i < 520; i++) { const x = -3.8 + r() * 5.6, y = -8.6 + r() * 5.4; B.dab(x, y, 0.035 + r() * 0.03, 0.03 + r() * 0.025, r() < 0.7 ? 'rgba(4,2,2,0.7)' : 'rgba(120,108,104,0.35)'); }
    B.dab(0.6, -7.6, 0.6, 0.4, 'rgba(110,104,112,0.25)');
  });
  paintEar(g, -0.32, -6.05, 0.95, Sk);
  // the bandana's knot behind the ear and its two ends
  const KNOT = 'M -3.0 -5.4 C -2.5 -5.6 -2.0 -5.3 -1.9 -4.8 C -1.9 -4.3 -2.3 -4.0 -2.8 -4.1 C -3.2 -4.3 -3.3 -5.0 -3.0 -5.4 Z';
  for (const d of ['M -2.8 -4.6 C -3.4 -4.4 -3.9 -3.9 -4.0 -3.2 C -3.7 -3.0 -3.4 -3.1 -3.2 -3.3 C -3.1 -3.8 -2.8 -4.1 -2.5 -4.3 Z', 'M -2.5 -4.4 C -2.7 -3.8 -2.8 -3.2 -2.6 -2.6 C -2.3 -2.6 -2.1 -2.7 -2.0 -2.9 C -2.0 -3.5 -2.1 -4.0 -2.2 -4.4 Z']) {
    cel(g, d, PAL.bandana, { sh: 0.5, hl: 0.25, lw: 0.12 });
  }
  cel(g, KNOT, PAL.bandana, { sh: 0.6, hl: 0.35, lw: 0.14 });
  B.inside(KNOT, () => { B.line('M -2.9 -5.1 C -2.5 -4.8 -2.2 -4.5 -2.1 -4.2', 'rgba(6,8,16,0.6)', 0.1, 0.05); });
  // the glasses' arm back over the ear
  B.line('M 1.6 -7.92 C 0.6 -7.8 -0.2 -7.5 -0.9 -7.05', '#0b0c0e', 0.2, 0.01);
  B.line('M 1.6 -8.0 C 0.6 -7.88 -0.2 -7.58 -0.9 -7.13', 'rgba(130,140,150,0.4)', 0.05, 0.01);
  // the bandana: navy cotton printed with cream paisley and a dotted border, pulled tight
  // over the bridge of the nose, tented on its tip, falling in folds to a point
  const C = PAL.bandana;
  B.fill(BAND, C.m, 0.02);
  B.inside(BAND, () => {
    const r = rnd(29);
    // the print: teardrops and dots in rows, the border a band of dots near the hem
    for (let i = 0; i < 70; i++) {
      const x = -2.2 + r() * 7.8, y = -6.3 + r() * 6.8, a = r() * 6.3;
      if (r() < 0.5) { g.save(); g.translate(x, y); g.rotate(a); B.fill('M 0 -0.16 C 0.14 -0.16 0.2 0 0.1 0.12 C 0.02 0.2 -0.12 0.16 -0.1 0.02 C -0.08 -0.04 -0.04 -0.1 0 -0.16 Z', 'rgba(226,214,186,0.72)', 0.01); B.dab(0.02, 0, 0.04, 0.04, C.d); g.restore(); }
      else B.dab(x, y, 0.06, 0.06, 'rgba(226,214,186,0.7)');
    }
    for (let k = 0; k < 16; k++) { const u = k / 15, x = 5.3 - u * 1.9, y = -4.6 + u * 4.6; B.dab(x - 0.26, y, 0.05, 0.05, 'rgba(226,214,186,0.8)'); }
    B.line('M 5.12 -4.6 C 4.96 -3.2 4.6 -1.6 3.6 0.1', 'rgba(226,214,186,0.35)', 0.07, 0.02);
    // the light on the cloth over the nose and the cheek; the shade under the chin and back toward the knot
    B.dab(4.6, -5.7, 1.0, 0.45, 'rgba(120,136,190,0.35)');
    B.fill('M -3 -6 L 1.2 -6 C 1.0 -4.6 1.4 -3 2.4 -1.4 L -3 -1 Z', 'rgba(4,6,14,0.5)', 0.45);
    // the folds: from the tip of the nose down and back toward the knot, the sag under the chin
    for (const [d, w] of [['M 5.2 -5.0 C 3.8 -4.6 2.0 -4.4 -1.0 -4.8', 0.22], ['M 5.0 -4.2 C 3.8 -3.6 2.6 -3.0 0.6 -2.6', 0.2], ['M 4.9 -3.2 C 4.2 -2.4 3.6 -1.6 2.6 -0.9', 0.18], ['M 4.6 -1.8 C 4.0 -1.0 3.6 -0.4 3.2 0.2', 0.14]]) {
      B.line(d, 'rgba(4,6,14,0.6)', w, w * 0.8);
      g.save(); g.translate(0.03, -0.14); B.line(d, 'rgba(110,126,180,0.3)', w * 0.6, w * 0.6); g.restore();
    }
    B.line('M 2.0 -5.95 C 3.0 -6.1 3.8 -6.3 4.4 -6.3 C 4.9 -5.95 5.3 -5.5 5.5 -5.12', 'rgba(150,166,214,0.45)', 0.1, 0.05);
    texture(g, 'canvas', 0.35, 0.5);
  });
  // the glasses: a matt black top bar, the wrap of mirrored lens with the sky in it
  const gr = g.createLinearGradient(3.4, -8.5, 3.0, -5.9);
  gr.addColorStop(0, '#0c2238'); gr.addColorStop(0.32, '#2f7ab8'); gr.addColorStop(0.46, '#cfeeff'); gr.addColorStop(0.52, '#3e88c4'); gr.addColorStop(0.8, '#123a60'); gr.addColorStop(1, '#0a1c30');
  B.fill(GLASS, gr, 0.01);
  B.inside(GLASS, () => {
    B.dab(4.6, -6.6, 0.25, 0.08, 'rgba(255,190,120,0.7)');
    B.dab(3.6, -6.5, 0.18, 0.06, 'rgba(255,200,140,0.55)');
    B.fill('M 2.2 -8.4 L 2.9 -8.5 L 2.3 -5.9 L 1.7 -5.9 Z', 'rgba(255,255,255,0.22)', 0.05);
    B.line('M 1.62 -8.0 C 1.56 -7.4 1.62 -6.8 1.9 -6.28', 'rgba(4,10,20,0.6)', 0.12, 0.06);
    B.line('M 5.3 -7.7 C 5.38 -7.2 5.3 -6.8 5.12 -6.5', 'rgba(220,240,255,0.5)', 0.05, 0.02);
  });
  B.line('M 1.4 -8.18 C 2.9 -8.56 4.5 -8.46 5.46 -7.84', '#0b0c0e', 0.2, 0.01);
  B.line('M 1.5 -8.26 C 2.9 -8.62 4.5 -8.52 5.4 -7.92', 'rgba(150,160,170,0.35)', 0.05, 0.01);
  // the helmet: a matt black shell over white foam, its vents dark with the foam in them,
  // stickers half peeled, scuffed where it has been dropped
  B.fill(FOAM, '#b8b4aa', 0.01);
  B.inside(FOAM, () => { B.fill('M -6 -6 L 5 -8.6 L 5 -8.0 L -6 -6.2 Z', 'rgba(40,36,30,0.35)', 0.1); B.dab(3.2, -8.3, 1.0, 0.1, 'rgba(255,255,255,0.4)'); texture(g, 'concrete', 0.3, 0.3); });
  cel(g, SHELL, H, { sh: 1.1, hl: 0.5 });
  B.inside(SHELL, () => {
    for (const [x, y, a, L] of [[2.7, -11.25, -0.42, 1.0], [0.3, -11.85, -0.06, 1.1], [-2.2, -11.35, 0.36, 1.0], [-4.3, -9.7, 0.95, 0.75], [3.6, -9.6, -0.15, 0.55], [-3.4, -8.2, 0.3, 0.6]]) {
      g.save(); g.translate(x, y); g.rotate(a);
      const V = `M ${-L} -0.2 C ${-L} -0.34 ${L} -0.34 ${L} -0.2 L ${L} 0.2 C ${L} 0.34 ${-L} 0.34 ${-L} 0.2 Z`;
      B.fill(V, '#050506', 0.01);
      B.inside(V, () => B.fill(`M ${-L} 0.02 L ${L} 0.02 L ${L} 0.4 L ${-L} 0.4 Z`, 'rgba(170,166,158,0.5)', 0.04));
      B.line(`M ${-L * 0.9} 0.32 L ${L * 0.9} 0.32`, 'rgba(150,156,166,0.35)', 0.06, 0.02);
      g.restore();
    }
    B.line('M -4.4 -9.8 C -2.8 -11.6 0.4 -12.3 3.2 -11.6', 'rgba(170,180,196,0.4)', 0.22, 0.14);
    B.dab(3.0, -11.0, 1.4, 0.4, 'rgba(160,170,186,0.25)');
    // stickers: a sky-blue one, a round cream one, an orange one, edges lifting, the corners worn
    const sticker = (d, c, edge) => { B.fill(d, c, 0.01); B.inside(d, () => { B.line(d, edge, 0.08, 0.04); texture(g, 'paint', 0.3, 0.3); }); };
    g.save(); g.translate(-0.6, -9.0); g.rotate(-0.16); sticker('M -1.0 -0.32 L 1.0 -0.36 L 0.95 0.34 L -1.0 0.36 Z', '#6aa9d8', 'rgba(20,40,60,0.6)'); B.fill('M 0.68 -0.36 L 1.0 -0.36 L 0.98 -0.06 Z', '#d8e6ee', 0.01); g.restore();
    sticker('M 1.9 -9.65 a 0.42 0.42 0 1 0 0.84 0 a 0.42 0.42 0 1 0 -0.84 0 Z', '#d6c9a6', 'rgba(60,50,30,0.6)');
    B.dab(2.32, -9.65, 0.18, 0.18, 'rgba(40,40,40,0.5)');
    g.save(); g.translate(-3.7, -7.6); g.rotate(-0.35); sticker('M -0.62 -0.3 L 0.62 -0.3 L 0.6 0.3 L -0.62 0.32 Z', '#d0702c', 'rgba(60,20,4,0.6)'); g.restore();
    scuffs(g, [[-1.8, -10.6, 0.4, 0.4], [3.8, -10.4, 0.3, -0.5], [1.2, -11.4, 0.25], [-4.6, -8.4, 0.3, 0.9]], H.l, 0.55);
    grime(g, -9, -6.6, 'rgba(10,10,10,0.3)');
  });
  // the retention cradle round the back of the skull under the shell, its dial
  B.line('M -3.1 -7.3 C -3.6 -6.8 -3.9 -6.3 -4.0 -5.8', '#101113', 0.22, 0.02);
  B.dab(-4.05, -5.85, 0.3, 0.26, '#141518'); B.dab(-4.1, -5.95, 0.14, 0.1, 'rgba(160,166,174,0.4)');
  // the straps: front and back of the ear to the slider under it, the chin strap on
  // under the bandana
  const strap = (d) => { B.line(d, '#17181b', 0.17, 0.01); B.line(d, 'rgba(120,126,136,0.35)', 0.04, 0.01); };
  strap('M 1.5 -8.3 C 1.0 -7.4 0.6 -6.4 0.25 -5.5');
  strap('M -2.0 -7.6 C -1.6 -6.8 -0.6 -6.0 0.15 -5.45');
  B.fill('M -0.1 -5.7 L 0.5 -5.75 L 0.35 -5.2 L 0.0 -5.2 Z', '#0d0e10', 0.01);
  B.line('M 0.0 -5.68 L 0.42 -5.72', 'rgba(150,156,166,0.5)', 0.04);
}

export const KITE = {
  id: 'kite', name: 'SKYE', role: 'KEŞİF', pal: PAL,
  pose: { nUpper: 0.12, nFore: -0.18, nHand: -0.08, fUpper: -1.75, fFore: -2.05, fHand: -0.25, nThigh: 0.14, nShin: 0.0, fThigh: -0.16, fShin: -0.06, head: 0.1 },
  parts: { torso, chest, front, head, upper, fore, hand, thigh, shin, foot },
};
