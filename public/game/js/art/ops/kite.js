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

// --- head (docs §10.16): no face. A courier's cycling cap, cream with the sky-blue
// and mustard stripe, its little brim flipped up; big mirrored ski goggles with the sky
// in them, strapped round the cap; the bandana up over the nose, knotted behind. FLINT's
// way: a cap, round goggles for eyes, the cloth over the rest.
const CAP = 'M -4.3 -6.9 C -4.8 -9.6 -3.0 -11.5 0.0 -11.7 C 3.0 -11.8 4.7 -10.4 4.8 -8.6 C 2.6 -8.8 0.0 -8.4 -2.2 -7.8 C -3.0 -7.6 -3.7 -7.3 -4.3 -6.9 Z';
const PEAK = 'M 3.6 -8.7 C 4.6 -9.1 5.6 -9.9 6.2 -11.0 C 6.4 -11.4 6.2 -11.7 5.8 -11.6 C 5.0 -11.3 4.0 -10.8 3.0 -10.4 C 2.8 -9.9 3.0 -9.2 3.6 -8.7 Z';
const GOG = 'M 0.7 -8.5 C 2.5 -9.15 4.8 -8.95 5.75 -7.95 C 6.05 -7.0 5.95 -5.95 5.45 -5.35 C 4.4 -4.85 2.3 -4.95 1.05 -5.45 C 0.5 -6.4 0.4 -7.6 0.7 -8.5 Z';
const LENS = 'M 1.25 -8.1 C 2.8 -8.65 4.65 -8.5 5.3 -7.7 C 5.55 -6.95 5.5 -6.1 5.1 -5.7 C 4.2 -5.3 2.5 -5.35 1.5 -5.75 C 1.05 -6.5 1.0 -7.4 1.25 -8.1 Z';
const BAND = 'M -2.8 -4.6 C -1.2 -5.3 1.2 -5.6 3.0 -5.6 C 4.4 -5.6 5.3 -5.2 5.45 -4.3 C 5.55 -3.2 4.95 -2.1 3.95 -1.4 L 2.3 0.7 L 0.8 -1.0 C -0.7 -1.4 -2.1 -2.0 -2.8 -3.0 Z';
function head(g) {
  const S = PAL.skin, C = PAL.bandana, Cr = PAL.cream, K = PAL.helmet;
  neck(g, S, { glaze: true });
  const HD = headShape({ jaw: 0.5 });
  cel(g, HD, S, { sh: 1.0, hl: 0.35 });
  skinGlaze(g, HD);
  clip(g, HD, () => {
    // short dark hair under the cap at the nape and over the ear, the ear
    cel(g, 'M -4.1 -7.6 C -4.3 -6.0 -3.7 -4.6 -2.6 -3.9 L -1.6 -4.9 C -2.2 -5.8 -2.4 -6.8 -2.1 -7.8 Z', mat(tone('#3a2c26', '#1e1714', '#120d0b', '#050404'), 'wool', 0.6), { sh: 0.3, hl: 0.3, line: false });
    cel(g, 'M -1.6 -7.0 C -0.6 -7.3 -0.1 -6.4 -0.3 -5.5 C -0.5 -4.8 -1.3 -4.7 -1.8 -5.2 Z', S, { sh: 0.5, hl: 0.3, line: false, ao: 0.6 });
    stroke(g, 'M -1.2 -6.6 C -0.7 -6.5 -0.7 -5.8 -1.1 -5.6', S.k, 0.14, 0.7);
  });
  // the bandana's knot behind the ear and its two ends
  for (const d of ['M -2.9 -4.4 C -3.6 -4.1 -4.1 -3.5 -4.2 -2.7 C -3.9 -2.5 -3.5 -2.6 -3.3 -2.8 C -3.2 -3.4 -2.9 -3.8 -2.5 -4.1 Z', 'M -2.5 -4.2 C -2.7 -3.5 -2.8 -2.8 -2.6 -2.2 C -2.3 -2.2 -2.1 -2.3 -2.0 -2.5 C -2.0 -3.2 -2.1 -3.8 -2.2 -4.2 Z']) cel(g, d, C, { sh: 0.5, hl: 0.3, lw: 0.14 });
  cel(g, 'M -3.1 -5.3 C -2.5 -5.5 -1.9 -5.1 -1.8 -4.6 C -1.8 -4.1 -2.3 -3.8 -2.8 -3.9 C -3.3 -4.1 -3.4 -4.9 -3.1 -5.3 Z', C, { sh: 0.6, hl: 0.4, lw: 0.16 });
  // the bandana over the nose and mouth: navy cotton, the cream print, tight over the nose
  cel(g, BAND, C, { sh: 1.0, hl: 0.4 });
  clip(g, BAND, () => {
    for (let k = 0; k < 22; k++) {
      const x = -2.4 + ((k * 29) % 80) / 10, y = -5.3 + ((k * 17) % 56) / 10;
      fill(g, k % 3 ? `M ${x} ${y} a 0.15 0.15 0 1 0 0.3 0 a 0.15 0.15 0 1 0 -0.3 0 Z` : `M ${x} ${y} c 0.3 -0.3 0.6 0 0.4 0.3 c -0.2 0.2 -0.4 0.1 -0.4 -0.3 Z`, Cr.m, 0.7);
    }
    stroke(g, curve([[1.6, -5.5], [3.6, -5.5], [5.3, -4.6]]), C.l, 0.24, 0.8);
  });
  clothFolds(g, BAND, [[[-2.2, -4.4], [0.4, -4.6], [3.2, -4.7]], [[-1.8, -2.6], [0.4, -2.6], [2.6, -2.4], [4.4, -2.8]], [[1.0, -1.6], [2.0, -0.8]], [[3.6, -3.4], [4.8, -2.8]]], C);
  // the cap: cream cotton, the stripe round it, the little brim flipped up
  cel(g, CAP, Cr, { sh: 1.2, hl: 0.5 });
  clip(g, CAP, () => {
    for (const [y0, c] of [[-10.6, PAL.sky.m], [-10.0, PAL.wind.m], [-9.4, PAL.sky.m]]) fill(g, `M -6 ${y0 + 1.2} C -2 ${y0 - 0.4} 2 ${y0 - 1.0} 6 ${y0 - 0.6} L 6 ${y0 - 0.1} C 2 ${y0 - 0.5} -2 ${y0 + 0.1} -6 ${y0 + 1.7} Z`, c, 0.95);
    stroke(g, 'M -4.0 -9.8 C -2.2 -11.4 1.0 -11.8 3.8 -10.4', Cr.l, 0.26, 0.8);
    stitch(g, 'M -4.1 -7.3 C -1.6 -8.3 1.6 -8.8 4.6 -8.75', Cr.d, 0.06, 0.7);
  });
  cel(g, PEAK, Cr, { sh: 0.3, hl: 0.35, lw: 0.16 });
  clip(g, PEAK, () => { fill(g, 'M 3.4 -8.6 C 4.6 -9.2 5.6 -10.0 6.3 -11.0 L 6.6 -10.4 C 5.8 -9.4 4.8 -8.8 3.8 -8.4 Z', PAL.sky.m, 0.95); stroke(g, 'M 3.2 -10.2 C 4.2 -10.6 5.2 -11.1 5.9 -11.5', Cr.l, 0.12, 0.8); });
  // the goggles' strap round the cap, a white band printed on it
  stroke(g, 'M 0.8 -7.4 C -1.2 -7.8 -3.0 -8.0 -4.5 -7.8', K.k, 0.62);
  for (let x = -4.0; x < 0.4; x += 0.7) fill(g, `M ${x} ${-7.75 + (x + 4.5) * 0.06} l 0.36 0 l 0 0.14 l -0.36 0 Z`, '#e6eef4', 0.75);
  // the goggles: a black frame on its foam, the big mirrored lens, the sky in it
  cel(g, GOG, K, { sh: 0.5, hl: 0.35, lw: 0.24 });
  const gr = g.createLinearGradient(3.2, -8.6, 3.3, -5.3);
  gr.addColorStop(0, '#0c2238'); gr.addColorStop(0.36, '#2f7ab8'); gr.addColorStop(0.5, '#dcf3ff'); gr.addColorStop(0.58, '#4a94cc'); gr.addColorStop(1, '#0d2a46');
  g.fillStyle = gr; g.fill(new Path2D(LENS));
  clip(g, LENS, () => { fill(g, 'M 1.9 -8.6 L 2.7 -8.7 L 2.0 -5.3 L 1.2 -5.3 Z', '#ffffff', 0.4); fill(g, 'M 3.6 -6.3 L 5.3 -6.5 L 5.3 -6.1 L 3.6 -5.95 Z', '#ffc890', 0.5); });
  stroke(g, LENS, '#081420', 0.12, 0.8);
}

export const KITE = {
  id: 'kite', name: 'SKYE', role: 'KEŞİF', pal: PAL,
  pose: { nUpper: 0.12, nFore: -0.18, nHand: -0.08, fUpper: -1.75, fFore: -2.05, fHand: -0.25, nThigh: 0.14, nShin: 0.0, fThigh: -0.16, fShin: -0.06, head: 0.1 },
  parts: { torso, chest, front, head, upper, fore, hand, thigh, shin, foot },
};
