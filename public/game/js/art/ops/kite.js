// SKYE — recon. Twenty-two; rode courier through the city until the city
// closed, and builds drones out of whatever is thrown away (docs/KOR_STORY_
// CINEMATIC.md §9.2). Built from scratch as a man (docs §10.37): the youngest
// and the loudest, light on his feet. Deep brown skin, short twists on top and
// the sides faded down to the skin, a thin moustache and a short beard on the
// chin, a notch shaved through one brow; big over-ear headphones round his
// neck, white with sky-blue cups. A stone-grey puffer vest, its quilted
// baffles grimed, over a sky-blue long-sleeved top with the sleeves shoved up
// to the elbow; a patched canvas messenger bag across the body with the old
// bike light still on it; fingerless bike gloves, a knotted cord on the wrist;
// black joggers with a pale stripe down the side and ribbed cuffs, white
// high-top trainers gone grey. And the drone, made from scrap.
// Built on the body standard in body.js.
import { M, tone, mat } from '../style.js';
import {
  cel, fill, stroke, clip, blob, curve, fold,
  UPPER, FORE, THIGH, SHIN, TORSO, PELVIS,
  glove, neck, korBand, stitch, rivet, buckle, grime, scuffs,
  clothFolds, brushOf,
} from './body.js';
import { texture } from '../tex.js';
import { SKINS, face, ell, inP, braid, beard, shortHair } from './realhead.js';
import { FACES } from './faces.js';

const PAL = {
  vest: mat(tone('#cbc8bd', '#a3a095', '#77756c', '#302f2b'), 'nylon', 0.5),
  top: mat(tone('#8dc4e6', '#5f9cc6', '#3e7098', '#152a3c'), 'knit', 0.5),
  jog: mat(tone('#4d4e52', '#35363a', '#232428', '#0b0b0c'), 'knit', 0.5),
  cream: mat(tone('#f2e8cf', '#d5c7a5', '#a89978', '#554c38'), 'canvas', 0.4),
  bag: mat(tone('#bfb18e', '#9a8d6a', '#71664b', '#352f21'), 'canvas', 0.8),
  sky: tone('#e6f7ff', '#7ec8ff', '#3b8fd6', '#13416b'),
  helmet: mat(tone('#494b4f', '#323437', '#222427', '#0c0d0e'), 'rubber', 0.6),
  plastic: mat(tone('#8a8d94', '#66696f', '#484b51', '#1d1f22'), 'nylon', 0.6),
  shoe: mat(tone('#ecebe6', '#c8c6c0', '#96948e', '#42413d'), 'leather', 0.5),
  phones: mat(tone('#f4f4f2', '#d2d4d6', '#9ca0a4', '#4a4e52'), 'paint', 0.3),
  patch: mat(tone('#605f53', '#47463a', '#302f27', '#13130f'), 'canvas', 0.7),
  tape: mat(tone('#cdd0d2', '#a2a6a9', '#76797c', '#35383a'), 'canvas', 0.4),
  glove: mat(tone('#3f4146', '#2c2e32', '#1d1e21', '#0a0b0c'), 'leather', 0.5),
  steel: mat(tone('#b9bdc0', '#8c9195', '#62666a', '#2a2d30'), 'steel', 0.6),
  skin: mat(M.skinC, 'skin', 0.45),
};

// --- torso --------------------------------------------------------------------------
// the puffer vest: quilted in horizontal baffles, each one puffed, stitched between
const VEST = blob([
  [-2.2, -23.4], [-5.6, -22.8], [-8.2, -21.2], [-8.9, -18.4], [-8.6, -14.6], [-7.9, -10.6], [-7.5, -6.8], [-7.2, -3.4], [-7.2, -0.6], [-7.0, 0.5],
  [6.0, 0.3], [6.3, -1.4], [6.4, -4.0], [6.5, -7.6], [6.6, -12.0], [7.2, -16.0], [6.9, -19.8], [4.6, -22.6], [1.2, -23.8],
]);
const BAFFLES = [-20.6, -17.8, -15.0, -12.2, -9.4, -6.6, -3.8, -1.0];
function torso(g) {
  const V = PAL.vest, B = brushOf(g);
  cel(g, PELVIS, PAL.jog, { sh: 1.1, hl: 0.4 });
  // the sky-blue top's hem showing under the vest
  const HEM = 'M -7.0 -0.4 C -2.0 0.1 2.0 0.1 6.0 -0.4 L 5.7 1.3 C 2.0 1.9 -2.0 1.8 -6.6 1.2 Z';
  cel(g, HEM, PAL.top, { sh: 0.5, hl: 0.3, lw: 0.2 });
  clip(g, HEM, () => { for (let x = -7; x < 6; x += 0.3) stroke(g, `M ${x} 0.4 L ${x + 0.05} 1.9`, PAL.top.d, 0.07, 0.5); });
  cel(g, TORSO, PAL.top, { sh: 1.0, hl: 0.3, line: false });
  cel(g, VEST, V, { sh: 2.0, hl: 0.6, gloss: 0.22 });
  clip(g, VEST, () => {
    // the baffles: a soft round of light on each, the stitched line between dark and pinched
    for (let i = 0; i < BAFFLES.length; i++) {
      const y = BAFFLES[i], b = 0.12 * Math.sin(i * 1.7);
      B.line(`M -10 ${y + b} C -4 ${y - 0.3 + b} 2 ${y - 0.3} 8 ${y + 0.1}`, V.k, 0.16, 0.05, 0.75);
      B.line(`M -10 ${y + 0.18 + b} C -4 ${y - 0.12 + b} 2 ${y - 0.12} 8 ${y + 0.28}`, V.d, 0.5, 0.25, 0.6);
      if (i) B.line(`M -9 ${(y + BAFFLES[i - 1]) / 2 - 0.2} C -4 ${(y + BAFFLES[i - 1]) / 2 - 0.5} 2 ${(y + BAFFLES[i - 1]) / 2 - 0.5} 8 ${(y + BAFFLES[i - 1]) / 2 - 0.1}`, V.l, 0.7, 0.4, 0.35);
    }
    // the side seam, the zip down the front with its sky-blue pull, the binding at the hem
    stitch(g, curve([[-5.6, -21.4], [-6.0, -14.0], [-5.8, -8.0], [-5.6, -2.4]]), V.d, 0.08, 0.6);
    stroke(g, 'M 4.9 -22.4 C 5.1 -15 4.9 -8 5.2 0.4', V.k, 0.26);
    for (let y = -21.8; y < 0.0; y += 0.45) stroke(g, `M 4.82 ${y + (y > -8 ? 0.01 * (y + 8) : 0)} l 0.32 0`, PAL.steel.d, 0.1, 0.8);
    fill(g, 'M -9 -0.6 C -2 -0.2 2 -0.2 7 -0.8 L 7 1 L -9 1 Z', V.d, 0.6);
    stroke(g, 'M -9 -0.6 C -2 -0.2 2 -0.2 7 -0.8', V.k, 0.14, 0.7);
    // a reflective strip across the back, from the courier years, half peeled
    fill(g, 'M -10 -16.6 L -5.2 -16.9 L -5.2 -15.7 L -10 -15.4 Z', PAL.tape.l);
    fill(g, 'M -10 -16.1 L -5.2 -16.4 L -5.2 -16.15 L -10 -15.85 Z', PAL.tape.d, 0.5);
    fill(g, 'M -6.2 -16.85 L -5.2 -16.9 L -5.0 -15.2 L -5.9 -15.5 Z', V.m);
    // a tear taped over, the chest pocket's zip
    cel(g, 'M -2.4 -13.4 L 0.4 -14.2 L 0.7 -13.2 L -2.1 -12.4 Z', PAL.tape, { sh: 0.2, hl: 0.2, lw: 0.18 });
    stroke(g, 'M 1.2 -19.2 L 3.9 -19.6', V.k, 0.2);
    stitch(g, 'M 1.25 -19.0 L 3.95 -19.4', PAL.steel.d, 0.07, 0.7);
    // the city's grime on it: low down, round the bag's strap, the shoulder
    grime(g, -6, 0.6, 'rgba(56,50,40,0.4)');
    B.dab(-6.0, -20.0, 2.0, 1.2, 'rgba(70,62,50,0.2)');
    texture(g, 'nylon', 0.3, 0.5);
  });
  cel(g, 'M 3.7 -19.85 L 4.25 -19.9 L 4.3 -18.9 L 3.75 -18.85 Z', PAL.sky, { sh: 0.1, hl: 0.2, lw: 0.1 });
  cel(g, 'M 5.05 -21.4 L 5.65 -21.45 L 5.7 -19.9 L 5.1 -19.85 Z', PAL.sky, { sh: 0.1, hl: 0.2, lw: 0.1 });
  // the messenger bag riding on the small of the back
  const BAG = 'M -11.4 -11.0 C -11.6 -11.8 -11.0 -12.4 -10.2 -12.4 L -4.8 -12.0 L -5.0 -3.6 L -10.4 -3.4 C -11.2 -3.4 -11.6 -4.0 -11.6 -4.8 Z';
  cel(g, BAG, PAL.bag, { sh: 1.1, hl: 0.45 });
  clip(g, BAG, () => {
    fill(g, 'M -12 -12.6 L -4.6 -12.2 L -4.7 -7.6 C -7.0 -7.0 -9.6 -7.0 -12 -7.4 Z', PAL.bag.d, 0.5);
    stroke(g, 'M -12 -7.4 C -9.6 -7.0 -7.0 -7.0 -4.7 -7.6', PAL.bag.k, 0.26);
    cel(g, 'M -10.6 -6.4 L -8.0 -6.6 L -7.9 -4.4 L -10.5 -4.2 Z', PAL.patch, { sh: 0.2, hl: 0.15, lw: 0.2 });
    for (let x = -10.4; x < -8; x += 0.5) stroke(g, `M ${x} -6.45 l 0.2 0`, PAL.cream.m, 0.1, 0.8);
    fill(g, 'M -6.6 -10.6 a 0.7 0.7 0 1 0 1.4 0 a 0.7 0.7 0 1 0 -1.4 0 Z', PAL.sky.d);
    fill(g, 'M -6.3 -10.75 a 0.3 0.3 0 1 0 0.6 0 a 0.3 0.3 0 1 0 -0.6 0 Z', PAL.sky.l, 0.8);
    stitch(g, 'M -11.4 -11.8 L -5.0 -11.5', PAL.bag.l, 0.08, 0.6);
    stitch(g, 'M -11.2 -7.0 C -9.6 -6.6 -7.0 -6.6 -4.9 -7.2', PAL.bag.l, 0.07, 0.6);
    grime(g, -9, -3, 'rgba(50,40,26,0.45)');
  });
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
  const B = brushOf(g), T = PAL.top, V = PAL.vest, H = PAL.phones;
  // the sky-blue top's crew neck round the base of the neck, ribbed, low
  const CREW = 'M -1.95 -22.55 C -1.95 -23.2 -1.65 -23.65 -1.0 -23.8 C 0.4 -23.95 1.8 -23.75 2.85 -23.15 C 3.05 -22.7 3.1 -22.3 2.95 -21.95 C 1.9 -22.3 0.4 -22.45 -1.95 -22.55 Z';
  cel(g, CREW, T, { sh: 0.5, hl: 0.35, lw: 0.16 });
  B.inside(CREW, () => { for (let x = -2.0; x < 3.2; x += 0.18) B.line(`M ${x} -24.1 L ${x + 0.12} -21.9`, 'rgba(20,50,80,0.35)', 0.05, 0.02); B.line('M -1.7 -23.45 C -0.4 -23.7 1.4 -23.55 2.75 -22.95', 'rgba(220,240,255,0.4)', 0.08, 0.04); });
  // the vest's low stand collar, open at the throat (docs §10.37: low, no lump)
  const COL = 'M -2.6 -22.4 C -2.6 -23.0 -2.2 -23.5 -1.5 -23.7 L -1.25 -23.05 C -1.7 -22.95 -2.0 -22.7 -2.05 -22.35 Z';
  cel(g, COL, V, { sh: 0.4, hl: 0.3, lw: 0.16 });
  // the bag's wide strap across the chest, its cam buckle, a phone clipped on it
  const STRAP = 'M -3.6 -22.0 L -1.8 -22.6 L 6.6 -8.6 L 5.0 -7.6 Z';
  cel(g, STRAP, PAL.bag, { sh: 0.3, hl: 0.2, lw: 0.26 });
  clip(g, STRAP, () => stroke(g, 'M -2.7 -22.3 L 5.8 -8.1', PAL.bag.d, 0.14, 0.8));
  cel(g, 'M 0.6 -17.0 L 2.6 -18.2 L 3.4 -16.9 L 1.4 -15.7 Z', PAL.helmet, { sh: 0.2, hl: 0.25, lw: 0.22 });
  cel(g, 'M 3.2 -14.6 L 4.6 -15.4 L 6.2 -12.8 L 4.8 -12.0 Z', PAL.helmet, { sh: 0.2, hl: 0.2, lw: 0.22 });
  fill(g, 'M 3.7 -14.4 L 4.5 -14.9 L 5.7 -12.9 L 4.9 -12.4 Z', '#18324a');
  // the headphones round his neck: the band behind it, the near cup lying on the
  // collarbone with its cushion up; white plastic, the cups' backs sky blue
  const BAND = 'M 0.8 -22.85 C 0.0 -23.35 -1.2 -23.5 -2.2 -23.15 C -2.75 -22.95 -2.95 -22.55 -2.85 -22.15';
  B.line(BAND, H.k, 0.5, 0.01); B.line(BAND, H.m, 0.36, 0.01); g.save(); g.translate(0.03, -0.1); B.line(BAND, H.l, 0.12, 0.02, 0.8); g.restore();
  B.line('M 0.8 -22.85 C 0.0 -23.35 -1.2 -23.5 -2.2 -23.15', 'rgba(30,34,40,0.6)', 0.1, 0.02);
  g.save(); g.translate(1.75, -22.55); g.rotate(-0.18);
  cel(g, ell(0, 0.08, 1.12, 0.66), PAL.helmet, { sh: 0.4, hl: 0.3 });
  cel(g, ell(0, 0.22, 1.05, 0.52), PAL.sky, { sh: 0.5, hl: 0.5, gloss: 0.35 });
  B.inside(ell(0, 0.22, 1.05, 0.52), () => { B.line(ell(0, 0.22, 0.8, 0.36), 'rgba(16,60,110,0.5)', 0.07, 0.03); B.dab(-0.3, 0.05, 0.4, 0.14, 'rgba(255,255,255,0.45)'); });
  cel(g, 'M -1.0 -0.15 C -0.6 -0.5 0.6 -0.5 1.0 -0.15 C 0.8 0.0 -0.8 0.0 -1.0 -0.15 Z', PAL.helmet, { sh: 0.2, hl: 0.25 });
  g.restore();
  cel(g, 'M 0.55 -22.95 L 1.15 -22.8 L 1.05 -22.3 L 0.45 -22.45 Z', H, { sh: 0.2, hl: 0.3, lw: 0.1 });
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
  cel(g, BODY, PAL.plastic, { sh: 0.7, hl: 0.35 });
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
  const t = ctx.t, T = t(PAL.top);
  cel(g, UPPER, T, { sh: 1.5, hl: 0.5 });
  clothFolds(g, UPPER, [[[-2.2, 4.6], [-0.6, 5.4], [1.8, 5.0]], [[-2.0, 6.8], [0.2, 7.3], [2.0, 6.9]], [[1.2, 2.2], [2.0, 4.0]]], T);
  clip(g, UPPER, () => { stroke(g, curve([[-2.5, 1.4], [-2.7, 6.0], [-2.2, 10.0]]), T.d, 0.2, 0.7); fill(g, ell(0.2, 0.8, 2.4, 1.6), T.l, 0.14); });
  if (!ctx.far) korBand(g, t(PAL.jog));
  // the sleeve shoved up and bunched above the elbow
  const BUNCH = blob([[-2.7, 8.8], [2.5, 8.6], [3.0, 10.2], [2.4, 12.4], [-2.3, 12.6], [-3.1, 10.8]]);
  cel(g, BUNCH, T, { sh: 0.7, hl: 0.4 });
  clip(g, BUNCH, () => { for (const y of [9.6, 10.6, 11.6]) stroke(g, `M -3 ${y} C -1 ${y + 0.4} 1 ${y + 0.3} 3 ${y - 0.1}`, T.d, 0.22, 0.85); });
}
function fore(g, ctx) {
  const t = ctx.t, T = t(PAL.top);
  // the bare forearm under the pushed-up sleeve's edge
  cel(g, FORE, t(PAL.skin), { sh: 1.2, hl: 0.45 });
  cel(g, blob([[-2.3, -1.2], [2.5, -1.4], [2.6, 1.9], [-2.3, 2.1]]), T, { sh: 0.4, hl: 0.3, lw: 0.24 });
  clip(g, blob([[-2.3, -1.2], [2.5, -1.4], [2.6, 1.9], [-2.3, 2.1]]), () => { for (let x = -2.2; x < 2.6; x += 0.3) stroke(g, `M ${x} 0.6 L ${x + 0.04} 2.1`, T.d, 0.07, 0.6); });
  clip(g, FORE, () => { stroke(g, curve([[1.6, 3.4], [1.4, 6.0], [1.0, 9.0]]), t(PAL.skin).d, 0.2, 0.6); stroke(g, curve([[-0.6, 3.0], [-0.4, 6.0], [-0.2, 8.6]]), t(PAL.skin).l, 0.14, 0.35); });
  if (!ctx.far) {
    // a knotted cord round the wrist
    stroke(g, 'M -1.8 8.6 C -0.6 9.0 0.8 9.0 1.8 8.6', '#8a2f2a', 0.36);
    fill(g, 'M 1.6 8.4 a 0.3 0.3 0 1 0 0.6 0 a 0.3 0.3 0 1 0 -0.6 0 Z', '#8a2f2a');
  }
}
function hand(g, ctx) { glove(g, ctx, PAL.glove, { fingerless: PAL.skin, cuff: PAL.glove, knuckle: PAL.sky }); }

// --- legs: black joggers, a pale stripe down the side, ribbed cuffs; white high-tops ------------
function thigh(g, ctx) {
  const t = ctx.t, J = t(PAL.jog);
  cel(g, THIGH, J, { sh: 1.5, hl: 0.5 });
  clothFolds(g, THIGH, [[[-3.0, 11.6], [-1.0, 12.4], [1.6, 12.0]], [[-2.8, 2.4], [-1.2, 3.0], [-0.2, 4.2]], [[1.6, 7.6], [2.4, 9.0]], [[-2.6, 13.6], [-0.6, 14.2], [1.8, 13.8]]], J);
  clip(g, THIGH, () => {
    // the stripe down the side seam, the knee gone baggy
    stroke(g, curve([[-0.9, -0.6], [-0.7, 6.0], [-0.5, 15.4]]), t(PAL.cream).d, 0.32, 0.85);
    stroke(g, curve([[-0.78, -0.6], [-0.58, 6.0], [-0.38, 15.4]]), t(PAL.cream).l, 0.1, 0.5);
    fill(g, ell(2.0, 13.6, 1.2, 1.6), J.l, 0.12);
    grime(g, 9, 16, 'rgba(60,54,44,0.25)');
  });
  // the cargo pocket, a spare drone battery held on it with a rubber band (docs §10.22)
  const POCKET = 'M -2.2 4.0 L 1.6 3.8 L 1.8 9.0 C 0.6 9.4 -1.0 9.4 -2.1 9.1 Z';
  cel(g, POCKET, J, { sh: 0.5, hl: 0.3, lw: 0.22, ao: 0.3 });
  stitch(g, 'M -2.0 8.8 C -0.8 9.1 0.6 9.1 1.6 8.7', J.l, 0.05, 0.5);
  if (!ctx.far) {
    cel(g, 'M -1.8 4.4 L 1.4 4.3 L 1.5 7.3 L -1.7 7.4 Z', PAL.helmet, { sh: 0.3, hl: 0.3, gloss: 0.2 });
    fill(g, 'M -1.6 4.75 L 1.3 4.66 L 1.32 6.0 L -1.58 6.08 Z', '#e8c23a');
    stroke(g, 'M -1.3 5.35 L 0.8 5.29', '#2a2620', 0.14, 0.8);
    stroke(g, 'M -2.0 6.5 L 1.6 6.4', '#7a2a22', 0.22);
    stroke(g, 'M 1.4 4.6 C 2.2 4.2 2.4 3.2 1.7 2.6', '#c8302a', 0.24);
    stroke(g, 'M 1.4 5.0 C 2.6 4.6 2.8 3.0 1.9 2.3', '#151515', 0.24);
  }
}
// the high-top's shaft round the ankle, padded, laced; the jogger's ribbed cuff over it
const TOPS = blob([[-2.6, 11.4], [2.35, 11.2], [2.5, 13.0], [2.6, 15.0], [-2.6, 15.1], [-2.85, 13.0]]);
const CUFF = 'M -2.55 10.2 C -0.8 10.55 1.0 10.5 2.35 10.15 L 2.4 12.0 C 1.0 12.35 -0.8 12.4 -2.6 12.05 Z';
function shin(g, ctx) {
  const t = ctx.t, J = t(PAL.jog), S = t(PAL.shoe);
  cel(g, TOPS, S, { sh: 0.8, hl: 0.4 });
  clip(g, TOPS, () => {
    fill(g, 'M 0.9 11.0 L 2.8 10.9 L 2.8 15.2 L 1.1 15.2 Z', S.d, 0.5);
    for (let y = 12.4; y < 14.8; y += 0.7) { stroke(g, `M 1.0 ${y} L 2.4 ${y + 0.4} M 2.4 ${y} L 1.0 ${y + 0.4}`, t(PAL.sky).d, 0.13); fill(g, ell(0.95, y + 0.2, 0.12, 0.1), PAL.steel.d); }
    stroke(g, curve([[-2.4, 14.6], [-1.0, 13.4], [0.8, 13.6]]), t(PAL.sky).m, 0.34, 0.9);
    stitch(g, 'M -2.4 12.2 L -2.3 14.8', S.d, 0.05, 0.5);
    scuffs(g, [[-1.6, 14.4, 0.4], [0.0, 12.6, 0.3]], 'rgba(120,110,96,0.6)', 0.4);
    grime(g, 13, 15.4, 'rgba(70,62,50,0.35)');
  });
  // the jogger leg, tapered, into its cuff
  clip(g, 'M -5 -2 L 5 -2 L 5 11.4 L -5 11.4 Z', () => {
    cel(g, SHIN, J, { sh: 1.3, hl: 0.5 });
    clothFolds(g, SHIN, [[[-2.2, 1.4], [0.0, 2.0], [2.2, 1.6]], [[-2.2, 8.6], [-0.6, 9.2], [1.6, 8.9]], [[-2.0, 9.6], [0.2, 10.1], [1.8, 9.8]]], J);
    clip(g, SHIN, () => { stroke(g, curve([[-0.5, -0.4], [-0.45, 5.0], [-0.35, 11.0]]), t(PAL.cream).d, 0.32, 0.85); stroke(g, curve([[-0.38, -0.4], [-0.33, 5.0], [-0.23, 11.0]]), t(PAL.cream).l, 0.1, 0.5); });
  });
  cel(g, CUFF, J, { sh: 0.4, hl: 0.3, lw: 0.2 });
  clip(g, CUFF, () => { for (let x = -2.6; x < 2.6; x += 0.26) stroke(g, `M ${x} 10.0 L ${x + 0.02} 12.4`, J.k, 0.07, 0.6); });
}
// the trainer: white leather, a sky-blue flash down the side, a thick foam sole gone grey
const SHOE = blob([[-2.5, -2.4], [1.5, -2.4], [2.6, -0.4], [4.8, 0.4], [6.7, 1.1], [7.0, 2.0], [-2.7, 2.0], [-2.9, 0.4]]);
function foot(g, ctx) {
  const t = ctx.t, S = t(PAL.shoe), K = t(PAL.sky);
  cel(g, SHOE, S, { sh: 0.8, hl: 0.4 });
  clip(g, SHOE, () => {
    // the tongue and laces up the instep, the toe box, the flash, the heel tab
    stroke(g, 'M 1.0 -1.9 C 1.8 -1.0 2.7 -0.3 3.8 0.25', S.k, 0.24);
    for (let i = 0; i < 4; i++) stroke(g, `M ${1.0 + i * 0.75} ${-1.45 + i * 0.5} l 0.7 -0.45`, K.d, 0.2);
    stroke(g, 'M 4.4 0.5 C 5.4 0.9 6.3 1.3 6.8 1.9', S.d, 0.12, 0.6);
    stroke(g, 'M -2.0 1.2 C -0.2 0.2 1.8 -0.1 4.4 1.0', K.m, 0.42);
    stroke(g, 'M -2.0 1.05 C -0.2 0.05 1.8 -0.25 4.4 0.85', K.l, 0.1, 0.6);
    fill(g, 'M -3.0 -2.5 L -2.2 -2.5 L -2.0 0.2 L -3.0 0.2 Z', K.d);
    scuffs(g, [[5.6, 1.2, 0.5, 0.2], [-1.6, 0.6, 0.35], [3.0, 0.6, 0.3]], 'rgba(120,110,96,0.7)', 0.45);
    grime(g, -1, 2.2, 'rgba(70,62,50,0.45)');
  });
  const SOLE = 'M -2.8 1.5 L 7.0 1.5 C 7.3 1.8 7.3 2.3 7.0 2.5 L -2.7 2.5 C -3.0 2.3 -3.0 1.8 -2.8 1.5 Z';
  cel(g, SOLE, t(PAL.cream), { sh: 0.3, hl: 0.2, lw: 0.24 });
  fill(g, 'M -2.7 2.25 L 7.1 2.25 L 7.0 2.55 L -2.7 2.55 Z', t(PAL.jog).m, 0.8);
}

// --- head (docs §10.37): his own face. Twenty-two: deep warm brown skin with the light
// catching it, a strong young jaw, a broad nose, full lips in a lopsided grin, big bright
// dark eyes, a thick brow with a notch shaved through it; a thin moustache and a short beard
// on the chin; short twists on top, the sides and back faded down to the skin.
// the top of the skull (PROFILE), where the twists grow from
const SKULL = [[[3.75, -9.05], [3.5, -9.6], [3.2, -9.85], [3.0, -9.9]], [[3.0, -9.9], [1.9, -10.6], [0.0, -10.7], [-1.5, -10.2]], [[-1.5, -10.2], [-3.0, -9.6], [-3.85, -8.2], [-3.9, -6.9]]];
const bez3 = (P, t) => { const u = 1 - t; return [0, 1].map((k) => u * u * u * P[0][k] + 3 * u * u * t * P[1][k] + 3 * u * t * t * P[2][k] + t * t * t * P[3][k]); };
// the twists' base: the hair over the top of the head, down to where the fade starts
const STOP = 'M 3.7 -9.1 C 3.6 -9.7 3.2 -10.2 2.6 -10.5 C 1.6 -11.0 0.0 -11.1 -1.6 -10.7 C -3.0 -10.2 -3.85 -9.2 -4.1 -8.0 C -3.4 -8.2 -2.6 -8.4 -1.6 -8.55 C -0.4 -8.75 1.0 -8.85 2.2 -8.9 C 2.8 -8.95 3.3 -9.0 3.7 -9.1 Z';
// the faded sides and back, round the ear to the nape; the edge lined up sharp at the temple
const SFADE = 'M 3.6 -9.05 C 2.4 -8.95 0.6 -8.85 -1.2 -8.65 C -2.4 -8.45 -3.4 -8.2 -4.1 -7.9 C -4.15 -6.5 -3.9 -5.2 -3.3 -4.3 C -3.0 -3.95 -2.8 -3.8 -2.6 -3.75 C -2.0 -3.95 -1.4 -4.3 -1.0 -4.75 C -0.95 -5.6 -0.9 -6.3 -0.7 -6.75 C -0.2 -6.95 0.4 -6.95 0.78 -6.85 C 0.76 -6.3 0.78 -5.8 0.86 -5.5 C 1.0 -5.55 1.18 -5.6 1.3 -5.66 C 1.32 -6.2 1.38 -6.7 1.52 -7.1 C 1.9 -7.65 2.4 -8.15 2.95 -8.55 C 3.2 -8.75 3.42 -8.92 3.6 -9.05 Z';
// a thin moustache, a short beard on the chin and under it
const SMOUST = 'M 4.84 -4.2 C 4.9 -4.08 4.86 -3.96 4.74 -3.88 C 4.46 -3.8 4.12 -3.82 3.9 -3.9 C 3.92 -4.02 4.02 -4.12 4.18 -4.18 C 4.4 -4.25 4.62 -4.26 4.84 -4.2 Z';
const SCHIN = 'M 4.36 -3.06 C 4.5 -3.02 4.6 -2.9 4.66 -2.72 C 4.74 -2.44 4.74 -2.16 4.62 -1.94 C 4.4 -1.74 4.0 -1.68 3.5 -1.72 C 3.1 -1.76 2.8 -1.86 2.6 -2.0 C 2.9 -2.2 3.3 -2.4 3.6 -2.66 C 3.9 -2.9 4.1 -3.04 4.36 -3.06 Z';
function head(g) {
  const S = SKINS.umber, B = brushOf(g);
  neck(g, PAL.skin, { glaze: true });
  const FS = face(g, { paint: FACES.skye, prof: 'm', s: S, soft: 0.3, age: 0.06, seed: 61, iris: '#24140c', white: '#b0a092', brow: ['#0e0806', 0.06, 1.15], lips: '120,58,48',
    shape: { fore: 0.1, brow: 0.2, nasion: -0.05, nose: 0.05, hump: -0.2, tip: 0.1, wing: 0.7, lips: 0.25, chin: 0.25, long: 0.05, jaw: 0.35, eye: 0.1 } });
  // the moustache and the chin's beard, short, dense, near black
  const BRD = { col: '16,10,8', lit: 'rgba(96,70,54,1)', dark: 'rgba(4,2,1,0.4)' };
  beard(g, FS.w(SMOUST), { ...BRD, seed: 62, n: 260, len: 0.07, edge: 0.05, a: 0.7, dir: 0.5 });
  beard(g, FS.w(SCHIN), { ...BRD, seed: 63, n: 520, len: 0.08, edge: 0.07, a: 0.75 });
  // the fade: dark where it meets the twists, down to the skin round the ear and the nape;
  // the line-up at the temple kept sharp
  shortHair(g, SFADE, { col: '18,11,8', lit: 'rgba(86,62,48,1)', seed: 64, n: 1400, a: Math.PI * 0.75, y0: -8.6, y1: -5.2, fade: [0.92, 0.04], len: 0.05 });
  B.line('M 3.6 -9.05 C 3.42 -8.92 3.2 -8.75 2.95 -8.55 C 2.4 -8.15 1.9 -7.65 1.52 -7.1', 'rgba(12,7,5,0.7)', 0.05, 0.01);
  // the twists: the dark of the hair between them, then each twist from its root, out from
  // the scalp and back a little, the ones further in first; lit along their tops
  B.fill(STOP, '#120a07', 0.04);
  B.inside(STOP, () => { B.dab(1.0, -10.2, 2.4, 0.7, 'rgba(70,50,38,0.4)'); texture(g, 'wool', 0.3, 0.5); });
  const TW = [], r = (() => { let s = 67; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  for (let row = 0; row < 3; row++) {
    const n = [12, 11, 10][row], depth = [0.8, 0.45, 0.08][row];
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5 + (r() - 0.5) * 0.5) / n, seg = Math.min(2, Math.floor(u * 3)), t = u * 3 - seg;
      const P = SKULL[seg], [x, y] = bez3(P, t), [x2, y2] = bez3(P, Math.min(1, t + 0.02)), [x1, y1] = bez3(P, Math.max(0, t - 0.02));
      let nx = y2 - y1, ny = -(x2 - x1); const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      if (ny > 0) { nx = -nx; ny = -ny; }
      if (seg === 2 && t > 0.75) continue;
      const bx = x - nx * depth, by = y - ny * depth, len = 0.55 + r() * 0.35 + (row === 0 ? -0.15 : 0);
      const ax = nx * 0.85 - 0.35, ay = ny * 0.85 - 0.05, aL = Math.hypot(ax, ay);
      const ex = bx + ax / aL * len, ey = by + ay / aL * len, bend = (r() - 0.5) * 0.25;
      TW.push([row, [[bx, by], [bx + ax / aL * len * 0.35 + bend, by + ay / aL * len * 0.35], [bx + ax / aL * len * 0.7 - bend, by + ay / aL * len * 0.7], [ex, ey]]]);
    }
  }
  for (const [row, P] of TW) {
    // its shadow on the hair under it, then the twist
    B.line(`M ${P[0].join(' ')} C ${P[1].join(' ')} ${P[2].join(' ')} ${P[3].join(' ')}`, 'rgba(0,0,0,0.5)', 0.5, 0.12);
    braid(g, P, { col: row === 2 ? '#1c110c' : '#160c09', lit: row === 2 ? 'rgba(176,134,104,0.85)' : 'rgba(130,96,74,0.7)', dark: 'rgba(4,2,1,0.8)', w: 0.44 });
  }
}

export const KITE = {
  id: 'kite', name: 'SKYE', role: 'KEŞİF', pal: PAL,
  pose: { nUpper: 0.12, nFore: -0.18, nHand: -0.08, fUpper: -1.75, fFore: -2.05, fHand: -0.25, nThigh: 0.14, nShin: 0.0, fThigh: -0.16, fShin: -0.06, head: 0.06 },
  parts: { torso, chest, front, head, upper, fore, hand, thigh, shin, foot },
};
