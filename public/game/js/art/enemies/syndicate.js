// VANTA — the security firm that holds the city (docs/KOR_STORY_CINEMATIC.md
// §9.3, painted per §10.1). Everything the cells are not: one issue, clean,
// new, repeated. Blue-grey polymer armour over a navy uniform, a full-face
// helmet with one thin slit of smoked glass, the white ring-and-bar mark on
// the left shoulder. The shield man carries more plate and a smoked riot
// shield; the rusher a gas mask with two dark lenses and a red unit band; and Gall,
// the Secretary, is no soldier at all: a long belted coat, a peaked cap, an
// open, cold face.
import { cel, fill, stroke, clip, blob, curve } from '../kit.js';
import { Brush, rnd } from '../paint.js';
import { texture } from '../tex.js';
import { M, tone, mat } from '../style.js';
import { WEAPONS, MAT } from '../weapons/index.js';
import { UPPER, FORE, THIGH, SHIN, TORSO, PELVIS, glove, boot, fold, headShape, skinGlaze, softEye, softBrow, softHair, neck as skinNeck, stitch, rivet, buckle, grime, scuffs, clothFolds } from '../ops/body.js';

const PAL = {
  armor: mat(tone('#aab7c4', '#7b8b9b', '#546373', '#222c38'), 'paint', 0.1),
  suit: mat(tone('#414e66', '#2c364a', '#1d2434', '#0b0f17'), 'canvas', 0.45),
  webbing: mat(tone('#3a4558', '#283140', '#1a202b', '#0a0d12'), 'nylon', 0.6),
  black: mat(tone('#3e4147', '#282b30', '#191b1f', '#0a0b0d'), 'rubber', 0.45),
  glove: mat(tone('#3c3f45', '#26292e', '#181a1e', '#08090a'), 'leather', 0.45),
  boot: mat(tone('#3d3f43', '#27292c', '#18191c', '#08090a'), 'leather', 0.45),
  sole: mat(M.rubber, 'rubber', 0.5),
  steel: mat(tone('#c3c8cc', '#959ba1', '#686e74', '#2c3035'), 'steel', 0.5),
  visor: M.visor,
  white: tone('#ffffff', '#eef1f4', '#c2cad3', '#6e7987'),
};
const DUST = 'rgba(40,46,56,0.3)';

// Vanta's guns: new from the depot, blue-black polymer furniture (the pump gun
// too, no walnut), clean steel, no crew tape, a white stencilled number.
const SYN_POLY = mat(tone('#4a525e', '#2c323b', '#1d2128', '#0a0c0f'), 'rubber', 0.25);
export const SYN_MAT = { ...MAT, poly: SYN_POLY, wood: SYN_POLY, tan: SYN_POLY, olive: SYN_POLY, tape: null, serial: '#dfe3e6', accent: M.visor };

// Vanta's mark: a ring crossed by a bar that runs past it.
export function emblem(g, x, y, r, c) {
  g.save();
  g.strokeStyle = c; g.lineWidth = r * 0.26; g.beginPath(); g.arc(x, y, r * 0.78, 0, Math.PI * 2); g.stroke();
  g.fillStyle = c; g.fillRect(x - r * 1.18, y - r * 0.13, r * 2.36, r * 0.26);
  g.restore();
}

// --- the helmet: full face, one red slit (docs §10.15) ---------------------------------------------
// A cut-high ballistic shell in Vanta's grey with rails down its sides, a mount plate at
// the brow and the comms cup over the ear; bolted to it at the temples a face plate, grey
// round the slit of smoked glass, black polymer over the jaw with the breathing vents
// pressed into it. Issued, numbered, scuffed.
const SHELL = 'M -4.9 -4.6 C -5.6 -7.4 -5.0 -11.0 -2.2 -12.4 C 0.6 -13.5 3.8 -12.9 5.2 -10.8 C 5.7 -10.0 5.9 -9.2 5.9 -8.6 L 4.6 -8.7 C 3.0 -8.8 1.6 -8.6 0.6 -8.0 C -0.4 -7.4 -0.8 -6.6 -0.6 -5.6 C -0.4 -4.8 -0.8 -4.2 -1.6 -4.0 C -2.8 -3.8 -4.0 -4.0 -4.9 -4.6 Z';
const FACE = 'M 0.4 -8.1 C 2.0 -8.9 4.4 -9.0 5.95 -8.6 C 6.3 -7.6 6.36 -6.8 6.3 -6.2 L 0.3 -6.0 C 0.2 -6.8 0.24 -7.5 0.4 -8.1 Z';
const JAW = 'M 0.3 -6.5 C 2.4 -6.7 5.0 -6.6 6.3 -6.2 C 6.4 -5.0 6.2 -3.2 5.6 -2.4 C 5.0 -1.7 4.2 -1.4 3.4 -1.35 L 1.4 -1.3 C 0.6 -1.6 0.2 -2.4 0.2 -3.4 C 0.2 -4.4 0.2 -5.5 0.3 -6.5 Z';
const SLIT = 'M 1.6 -7.72 C 3.0 -7.98 4.8 -7.98 6.22 -7.62 L 6.26 -6.92 C 4.8 -7.18 3.0 -7.18 1.66 -6.96 Z';
const brush = (g) => { const M0 = g.getTransform(); return new Brush(g, Math.hypot(M0.a, M0.b)); };
// Issued plate that has seen the street: the lamp's hard sheen on the moulding,
// paint chipped off the edges to the grey composite, scratches, rain-dried dirt
// low down. Box [x0, y0, x1, y1] in the part's frame.
function worn(g, d, [x0, y0, x1, y1], seed, k = 1) {
  const B = brush(g), r = rnd(seed), w = x1 - x0, h = y1 - y0;
  B.inside(d, () => {
    B.dab(x0 + w * 0.62, y0 + h * 0.22, w * 0.22, h * 0.1, 'rgba(236,244,252,0.32)');
    B.dab(x0 + w * 0.5, y1 - h * 0.08, w * 0.6, h * 0.22, `rgba(34,30,26,${0.32 * k})`);
    for (let i = 0; i < 9 * k; i++) {
      const top = r() < 0.6, x = x0 + r() * w, y = top ? y0 + r() * h * 0.18 : y0 + r() * h;
      B.dab(x, y, 0.18 + r() * 0.3, 0.1 + r() * 0.16, top ? 'rgba(196,200,204,0.55)' : 'rgba(40,46,54,0.45)', 1, 'source-over', r() * 3);
    }
    for (let i = 0; i < 6 * k; i++) {
      const x = x0 + r() * w, y = y0 + h * (0.2 + r() * 0.7), a = (r() - 0.5) * 1.2, L = 0.6 + r() * 1.6;
      B.line(`M ${x} ${y} l ${Math.cos(a) * L} ${Math.sin(a) * L}`, 'rgba(226,232,238,0.4)', 0.07, 0.03);
    }
  });
}
function neck(g, t) {
  cel(g, 'M -2.0 1.3 L 2.4 1.1 L 2.3 -2.6 L 0.6 -3.8 L -2.1 -4.6 Z', t, { sh: 1.2, hl: 0.25 });
}
function helmet(g) {
  const A = PAL.armor, K = PAL.black;
  neck(g, PAL.suit);
  // the shell: Vanta's grey, round over the skull and closed over the face
  const SH = 'M -5.0 -4.0 C -5.7 -7.2 -5.2 -10.6 -2.6 -12.0 C 0.2 -13.2 3.6 -12.8 5.2 -10.8 C 6.0 -9.8 6.3 -8.6 6.3 -7.4 L 6.3 -4.0 C 6.2 -2.6 5.3 -1.6 3.9 -1.3 L 1.2 -1.1 C -0.8 -1.3 -2.6 -2.2 -3.8 -3.0 Z';
  cel(g, SH, A, { sh: 1.5, hl: 0.65 });
  clip(g, SH, () => {
    stroke(g, curve([[-4.0, -10.4], [-0.8, -12.6], [3.8, -12.0]]), '#ffffff', 0.22, 0.75);
    stroke(g, 'M -5 -6.4 C -2.6 -6.0 -0.6 -6.4 0.6 -6.9', A.d, 0.22, 0.8);
    emblem(g, -1.8, -9.0, 1.05, PAL.white.m);
    grime(g, -6, -1, DUST);
  });
  worn(g, SH, [-5.7, -13.2, 6.3, -1.1], 29, 0.5);
  // the face: black polymer from the brow to the chin, one slit of smoked glass, three vents
  const FACE = 'M 1.0 -8.6 C 2.8 -9.0 5.0 -8.9 6.3 -8.4 L 6.3 -4.0 C 6.2 -2.6 5.3 -1.6 3.9 -1.3 L 1.2 -1.1 C 0.6 -2.6 0.5 -4.6 0.6 -6.4 C 0.6 -7.2 0.8 -8.0 1.0 -8.6 Z';
  cel(g, FACE, K, { sh: 0.8, hl: 0.45, gloss: 0.4 });
  clip(g, FACE, () => {
    stroke(g, 'M 6.15 -6.4 C 6.3 -5.0 6.1 -3.4 5.5 -2.4', K.l, 0.16, 0.6);
    for (const y of [-5.0, -4.2, -3.4]) { stroke(g, `M 3.5 ${y} C 4.4 ${y - 0.12} 5.2 ${y - 0.08} 6.1 ${y + 0.16}`, '#050607', 0.3); stroke(g, `M 3.5 ${y + 0.22} C 4.4 ${y + 0.1} 5.2 ${y + 0.14} 6.1 ${y + 0.38}`, K.l, 0.1, 0.5); }
  });
  const SLIT = 'M 1.6 -7.75 C 3.2 -8.0 5.0 -8.0 6.32 -7.7 L 6.34 -6.85 C 5.0 -7.1 3.2 -7.1 1.66 -6.9 Z';
  const gs = g.createLinearGradient(1.6, 0, 6.3, 0); gs.addColorStop(0, '#120c0e'); gs.addColorStop(0.6, '#4a1418'); gs.addColorStop(1, '#2a0a0e');
  g.fillStyle = gs; g.fill(new Path2D(SLIT));
  stroke(g, 'M 1.7 -7.62 C 3.2 -7.88 5.0 -7.88 6.25 -7.6', '#e6eaf0', 0.08, 0.6);
  stroke(g, SLIT, PAL.steel.d, 0.12);
  // the comms cup over the ear and its stub antenna
  cel(g, 'M -1.5 -5.8 a 1.1 1.3 0 1 0 2.2 0 a 1.1 1.3 0 1 0 -2.2 0 Z', A, { sh: 0.5, hl: 0.4, lw: 0.2 });
  stroke(g, 'M -1.1 -5.8 a 0.7 0.85 0 1 0 1.4 0 a 0.7 0.85 0 1 0 -1.4 0 Z', A.d, 0.12, 0.8);
  rivet(g, -0.4, -5.8, 0.22, PAL.steel);
}

// --- torso: navy uniform, the plate carrier --------------------------------------------------
const PLATE = blob([[-5.2, -21.2], [1.2, -22.2], [5.8, -21.2], [7.4, -17.2], [7.0, -10.8], [5.6, -8.4], [-0.4, -8.0], [-5.8, -9.0], [-6.6, -14.4]]);
function carrier(g, A = PAL.armor) {
  // the shoulder strap and cummerbund, webbing, with quick-release buckles
  cel(g, blob([[-3.4, -20.2], [-1.6, -21.0], [0.2, -23.2], [-1.6, -23.6], [-3.4, -22.2], [-4.6, -20.4]]), PAL.webbing, { sh: 0.4, hl: 0.2 });
  cel(g, blob([[-7.2, -13.0], [-4.2, -13.4], [-3.6, -8.8], [-6.6, -8.2], [-7.6, -10.2]]), PAL.webbing, { sh: 0.5, hl: 0.25 });
  clip(g, blob([[-7.2, -13.0], [-4.2, -13.4], [-3.6, -8.8], [-6.6, -8.2], [-7.6, -10.2]]), () => { for (let y = -12.4; y < -8.6; y += 1.0) stroke(g, `M -8 ${y} L -3 ${y - 0.2}`, PAL.webbing.d, 0.22); });
  cel(g, PLATE, A, { sh: 2.0, hl: 0.6 });
  clip(g, PLATE, () => {
    // moulded panel lines, the rank strip, the gloss
    stroke(g, curve([[-4.8, -19.6], [1.2, -20.6], [6.0, -19.6]]), A.d, 0.24);
    stroke(g, curve([[-5.4, -11.2], [0.6, -10.4], [6.6, -11.0]]), A.d, 0.24);
    fill(g, 'M 2.6 -18.8 L 5.6 -18.9 L 5.6 -18.2 L 2.6 -18.1 Z', PAL.white.m, 0.9);
    fill(g, 'M 2.6 -17.8 L 4.4 -17.85 L 4.4 -17.4 L 2.6 -17.35 Z', PAL.white.m, 0.7);
    stroke(g, curve([[-4.2, -20.4], [1.0, -21.4], [5.6, -20.4]]), '#ffffff', 0.16, 0.7);
    for (const [x, y] of [[-4.6, -19.6], [5.8, -19.8], [-5.0, -10.2], [6.2, -10.4]]) rivet(g, x, y, 0.26, PAL.steel);
    grime(g, -14, -7.6, DUST);
  });
  worn(g, PLATE, [-6.6, -22.2, 7.4, -8.0], 31);
  // the magazine pouches, navy, their flaps
  for (let i = 0; i < 3; i++) {
    const x = -2.6 + i * 2.6;
    cel(g, `M ${x} -12.8 L ${x + 2.4} -12.9 L ${x + 2.45} -8.6 C ${x + 1.6} -8.3 ${x + 0.8} -8.3 ${x - 0.05} -8.6 Z`, PAL.webbing, { sh: 0.5, hl: 0.25, lw: 0.24 });
    cel(g, `M ${x - 0.15} -13.2 L ${x + 2.55} -13.3 L ${x + 2.5} -11.4 C ${x + 1.7} -11.0 ${x + 0.8} -11.0 ${x - 0.1} -11.3 Z`, PAL.webbing, { sh: 0.35, hl: 0.2, lw: 0.22 });
    stitch(g, `M ${x + 0.1} -11.7 C ${x + 0.8} -11.4 ${x + 1.7} -11.4 ${x + 2.4} -11.8`, PAL.webbing.l, 0.06, 0.6);
  }
}
function uniform(g, T = PAL.suit) {
  cel(g, PELVIS, T, { sh: 1.1, hl: 0.4 });
  cel(g, TORSO, T, { sh: 1.8, hl: 0.5 });
  clothFolds(g, TORSO, [[[-6.4, -16.0], [-4.8, -13.4], [-3.4, -10.6]], [[-5.6, -6.0], [-3.0, -5.4], [-0.4, -5.8]]], T);
  clip(g, TORSO, () => { fold(g, [[-6.8, -14.0], [-6.2, -10.6], [-5.4, -8.2]], T); stitch(g, curve([[-5.2, -20.6], [-5.8, -14.0], [-5.2, -6.0]]), T.l, 0.07, 0.5); });
}
function torso(g) { uniform(g); carrier(g); }
// the padded ballistic collar every trooper wears up round the neck
function collar(g) {
  const COL = 'M -5.0 -21.6 C -5.0 -23.2 -4.0 -24.4 -2.0 -24.8 C 0.4 -25.1 3.0 -24.9 4.8 -24.2 C 5.6 -23.8 5.8 -23.0 5.6 -22.0 L 5.2 -21.2 C 3.0 -20.8 -1.8 -20.6 -5.0 -21.6 Z';
  cel(g, COL, PAL.webbing, { sh: 0.6, hl: 0.3 });
  {
    const B = brush(g);
    B.inside(COL, () => {
      // quilted in panels, each one swelling a little between its seams
      for (const x of [-3.2, -1.2, 0.8, 2.8, 4.4]) { B.line(`M ${x} -25 C ${x + 0.1} -23.6 ${x + 0.1} -22.4 ${x} -20.8`, 'rgba(4,6,10,0.6)', 0.1, 0.06); B.dab(x + 1.0, -23.6, 0.7, 0.9, 'rgba(120,136,160,0.14)'); }
      B.line('M -4.4 -23.6 C -3.0 -24.5 -0.4 -24.94 2.0 -24.82 C 3.4 -24.7 4.4 -24.4 5.2 -23.9', '#1a202b', 0.34, 0.03);
      B.line('M -4.4 -23.76 C -3.0 -24.66 -0.4 -25.1 2.0 -24.98 C 3.4 -24.86 4.4 -24.56 5.2 -24.06', 'rgba(150,164,186,0.35)', 0.07, 0.03);
      B.fill('M -6 -22.4 C -2 -21.8 2 -21.8 6 -22.2 L 6 -20 L -6 -20 Z', 'rgba(4,6,10,0.4)', 0.25);
    });
    stitch(g, 'M -4.2 -23.3 C -2.8 -24.2 -0.4 -24.62 2.0 -24.5 C 3.4 -24.4 4.3 -24.1 5.1 -23.6', PAL.webbing.l, 0.05, 0.5);
    cel(g, 'M 4.0 -24.2 L 5.6 -23.7 L 5.5 -22.4 L 3.9 -22.7 Z', PAL.webbing, { sh: 0.3, hl: 0.25, lw: 0.12 });
  }
}
function chest(g) {
  // the collar of the uniform up round the helmet's neck, the belt, a holster
  collar(g);
  cel(g, 'M -6.0 -5.4 C -1.2 -5.75 2.6 -5.75 5.7 -5.5 L 5.75 -3.6 C 2.6 -3.85 -1.2 -3.85 -6.05 -3.5 Z', PAL.webbing, { sh: 0.4, hl: 0.2 });
  cel(g, 'M 2.6 -5.9 L 4.8 -5.95 L 4.8 -3.3 L 2.6 -3.25 Z', PAL.black, { sh: 0.3, hl: 0.25, lw: 0.22 });
  fill(g, 'M 3.1 -5.0 L 4.3 -5.02 L 4.3 -4.2 L 3.1 -4.18 Z', PAL.steel.m);
}

// --- limbs -------------------------------------------------------------------------------------
function shoulderPlate(g, ctx, A = PAL.armor, big = false) {
  const P = big ? blob([[-4.6, -3.0], [0.2, -4.4], [4.6, -2.8], [4.6, 3.2], [-4.4, 3.4]]) : blob([[-4.0, -2.6], [0.2, -3.8], [4.2, -2.4], [4.2, 2.0], [-4.0, 2.2]]);
  cel(g, P, ctx.t(A), { sh: 1.0, hl: 0.5 });
  clip(g, P, () => {
    stroke(g, curve([[-3.6, -1.6], [0.2, -2.8], [3.8, -1.4]]), '#ffffff', 0.14, 0.6);
    if (!ctx.far) emblem(g, 0.4, 0.0, 1.25, PAL.white.m);
    // a moulded plate: the lower lame riding under it, its edge in shadow
    const B = brush(g), y = big ? 1.6 : 1.0;
    B.fill(`M -5 ${y} L 5 ${y - 0.2} L 5 4 L -5 4 Z`, 'rgba(10,14,20,0.28)', 0.25);
    B.line(`M -5 ${y} L 5 ${y - 0.2}`, 'rgba(8,10,14,0.7)', 0.16, 0.05);
    B.line(`M -5 ${y - 0.22} L 5 ${y - 0.42}`, 'rgba(226,234,242,0.45)', 0.1, 0.04);
  });
  worn(g, P, big ? [-4.6, -4.4, 4.6, 3.4] : [-4.0, -3.8, 4.2, 2.2], big ? 37 : 33, ctx.far ? 0.6 : 1);
}
function upper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL.suit), { sh: 1.5, hl: 0.45 });
  clothFolds(g, UPPER, [[[-2.0, 6.2], [-0.4, 7.0], [1.8, 6.6]], [[-1.8, 10.4], [0.0, 11.0], [1.8, 10.6]]], t(PAL.suit));
  clip(g, UPPER, () => { fold(g, [[-1.8, 8.8], [-0.4, 9.7], [1.2, 9.9]], t(PAL.suit)); stitch(g, curve([[-2.2, 3.0], [-2.4, 7.0], [-2.0, 11.0]]), t(PAL.suit).l, 0.07, 0.5); });
  shoulderPlate(g, ctx);
}
function fore(g, ctx) {
  const t = ctx.t;
  cel(g, FORE, t(PAL.suit), { sh: 1.3, hl: 0.4 });
  clip(g, FORE, () => fold(g, [[-1.4, 2.6], [0.0, 3.4], [1.4, 3.2]], t(PAL.suit), 0.26));
  cel(g, blob([[-2.1, 8.0], [2.0, 7.8], [2.1, 10.2], [-2.1, 10.4]]), t(PAL.webbing), { sh: 0.3, hl: 0.2, lw: 0.22 });
}
function hand(g, ctx) { glove(g, ctx, PAL.glove, { knuckle: PAL.black }); }
function thigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(PAL.suit), { sh: 1.6, hl: 0.4 });
  clip(g, THIGH, () => {
    cel(g, 'M -2.2 4.0 L 2.0 3.8 L 2.1 9.6 C 0.8 10.0 -0.9 10.0 -2.1 9.7 Z', t(PAL.suit), { sh: 0.4, hl: 0.25, lw: 0.22, ao: 0.3 });
    stitch(g, 'M -2.0 5.4 L 1.9 5.2', t(PAL.suit).l, 0.07, 0.6);
    stitch(g, curve([[2.2, 0.6], [2.0, 7.0], [1.6, 15.0]]), t(PAL.suit).l, 0.07, 0.5);
    fold(g, [[-2.0, 12.4], [0.0, 13.2], [2.0, 13.0]], t(PAL.suit));
  });
  // the suit's cloth gathered behind the knee and pulled across the thigh
  clothFolds(g, THIGH, [[[-3.0, 11.0], [-1.0, 11.8], [1.6, 11.4]], [[-2.8, 2.6], [-1.2, 3.2], [-0.4, 4.4]]], t(PAL.suit));
}
function kneePlate(g, ctx, A = PAL.armor) {
  const KP = blob([[-0.8, -2.6], [2.4, -2.4], [3.4, 0.4], [3.0, 3.6], [0.8, 4.4], [-0.8, 2.4], [-1.0, -0.2]]);
  cel(g, KP, ctx.t(A), { sh: 0.7, hl: 0.4 });
  clip(g, KP, () => stroke(g, curve([[0.0, -1.4], [2.0, -1.0], [2.9, 0.8]]), '#ffffff', 0.14, 0.6));
  worn(g, KP, [-1.0, -2.6, 3.4, 4.4], 41, ctx.far ? 0.5 : 0.8);
  stroke(g, 'M -0.9 1.0 C -1.6 1.1 -2.2 1.3 -2.5 1.6', PAL.webbing.k, 0.5);
}
function shin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(PAL.suit), { sh: 1.4, hl: 0.35 });
  kneePlate(g, ctx);
  const SH = blob([[-2.75, 7.2], [2.5, 6.9], [2.6, 10.6], [2.65, 15.0], [-2.65, 15.1], [-2.9, 10.6]]);
  cel(g, SH, t(PAL.boot), { sh: 0.8, hl: 0.4 });
  clip(g, SH, () => { for (let y = 8.0; y < 14.4; y += 1.15) stroke(g, `M 0.8 ${y} L 2.2 ${y + 0.45} M 2.2 ${y} L 0.8 ${y + 0.45}`, t(PAL.black).l, 0.12); stitch(g, 'M -2.5 7.6 L -2.4 14.6', t(PAL.boot).l, 0.06, 0.5); });
}
function foot(g, ctx) { boot(g, ctx, PAL.boot, PAL.sole, { toe: PAL.boot }); }

const PARTS = { torso, chest, head: helmet, upper, fore, hand, thigh, shin, foot };

export const TETIKCI = {
  id: 'tetikci', name: 'TETİKÇİ', role: 'VANTA', pal: PAL,
  pose: {
    nThigh: 0.2, nShin: 0.06, fThigh: -0.26, fShin: -0.04, head: 0.02,
    gun: { w: WEAPONS.kestrel, at: [6.4, -41.4], ang: 0.4, k: 0.96, mat: SYN_MAT },
  },
  parts: PARTS,
};

// --- KALKANLI: more plate, arms included, and the riot shield ----------------------------------
function shieldFront(g, ctx) {
  const [hx, hy] = ctx.J.hip;
  g.save(); g.translate(-hx, -hy);
  shield(g);
  g.restore();
}
// Riot shield in root space (feet at the origin), as carried in the idle pose:
// smoked polycarbonate, the viewing window, VANTA and the mark in white.
export function shield(g) {
  const S = 'M 6.4 -57.6 Q 6.4 -58.6 7.4 -58.4 L 14.6 -56.8 Q 15.6 -56.6 15.6 -55.6 L 15.6 -16.6 Q 15.6 -15.6 14.6 -15.4 L 7.4 -13.8 Q 6.4 -13.6 6.4 -14.6 Z';
  const POLY = tone('#6d7a88', '#45505e', '#2c3540', '#0f141a');
  cel(g, S, POLY, { sh: 1.6, hl: 0.7, ao: 0.6 });
  clip(g, S, () => {
    // the window, clearer glass, the street in it
    fill(g, 'M 8.0 -54.8 L 14.2 -53.8 L 14.2 -48.0 L 8.0 -48.6 Z', 'rgba(150,175,200,0.35)');
    stroke(g, 'M 8.0 -54.8 L 14.2 -53.8 L 14.2 -48.0 L 8.0 -48.6 Z', POLY.k, 0.24);
    fill(g, 'M 8.6 -54.2 L 9.8 -54.0 L 8.9 -49.0 L 8.6 -49.0 Z', 'rgba(255,255,255,0.35)');
    // the long reflection down the face, scratches and scuffs from the street
    fill(g, 'M 7.4 -57.4 L 8.6 -57.2 L 8.6 -15.0 L 7.4 -14.4 Z', 'rgba(255,255,255,0.16)');
    for (const [x, y, l] of [[9.4, -40, 2.2], [12.6, -36, 1.6], [10.4, -22, 2.6], [13.8, -27, 1.2]]) stroke(g, `M ${x} ${y} l ${l} 0.6`, 'rgba(255,255,255,0.35)', 0.06);
    // the mark big in white (no lettering: the sprite is mirrored when it faces left),
    // a band of reflective tape low down
    emblem(g, 11.0, -40.2, 2.5, 'rgba(244,246,248,0.92)');
    fill(g, 'M 6.4 -25.6 L 15.6 -25.2 L 15.6 -23.4 L 6.4 -23.8 Z', 'rgba(236,240,244,0.85)');
    for (let k = 0; k < 6; k++) fill(g, `M ${6.8 + k * 1.6} -23.8 L ${7.6 + k * 1.6} -25.6 L ${8.2 + k * 1.6} -25.6 L ${7.4 + k * 1.6} -23.8 Z`, PAL.visor.m, 0.85);
    // the red band across, the rim
    fill(g, 'M 5 -32.6 L 17 -32.0 L 17 -31.0 L 5 -31.6 Z', PAL.visor.m, 0.85);
    for (const [x, y] of [[8.0, -45], [14.0, -44.4], [8.0, -20], [14.0, -19.4]]) rivet(g, x, y, 0.3, PAL.steel);
    // a shield that has been used: the polycarbonate crazed white where things
    // hit it (a bottle, a stone, the odd round), scuffed bare along its foot,
    // rain beading down its face
    const B = brush(g), r = rnd(733);
    for (const [cx, cy] of [[12.6, -44.6], [9.4, -30.8], [13.4, -21.4]]) {
      B.dab(cx, cy, 0.9, 0.9, 'rgba(226,232,238,0.32)');
      for (let k = 0; k < 6; k++) { const a = r() * Math.PI * 2, L = 0.6 + r() * 1.4; B.line(`M ${cx} ${cy} l ${Math.cos(a) * L} ${Math.sin(a) * L}`, 'rgba(232,238,244,0.5)', 0.06, 0.03); }
      B.dab(cx, cy, 0.25, 0.25, 'rgba(255,255,255,0.7)');
    }
    for (let k = 0; k < 14; k++) { const x = 6.8 + r() * 8.4, y = -19 + r() * 4.6; B.line(`M ${x} ${y} l ${0.6 + r() * 1.6} ${(r() - 0.5) * 0.6}`, 'rgba(200,206,212,0.35)', 0.07, 0.03); }
    for (let k = 0; k < 8; k++) { const x = 7 + r() * 8, y = -56 + r() * 36; B.line(`M ${x} ${y} l 0.1 ${1 + r() * 3}`, 'rgba(210,222,236,0.18)', 0.12, 0.08); B.dab(x + 0.1, y + 0.2, 0.18, 0.22, 'rgba(236,244,252,0.4)'); }
    stroke(g, S, PAL.black.m, 0.6);
  });
}
function heavyTorso(g) { g.save(); g.scale(1.12, 1); uniform(g); carrier(g); g.restore(); }
// A riot guard: a hard moulded plate, not a cushion. Its edges are bevelled (a
// lit lip on top, a shadow under), it is split into lames that ride over each
// other, a webbing strap holds it on, and the street has worn it (worn()).
function guard(g, ctx, d, [x0, y0, x1, y1], seed, lames = 2) {
  const A = ctx.t(PAL.armor), B = brush(g), h = y1 - y0;
  cel(g, d, A, { sh: 0.9, hl: 0.5, gloss: 0.3 });
  clip(g, d, () => {
    for (let i = 1; i < lames; i++) {
      const y = y0 + (h * i) / lames;
      B.fill(`M ${x0 - 1} ${y - 0.15} L ${x1 + 1} ${y - 0.35} L ${x1 + 1} ${y + 0.9} L ${x0 - 1} ${y + 1.1} Z`, 'rgba(10,14,20,0.3)', 0.25);
      B.line(`M ${x0 - 1} ${y} L ${x1 + 1} ${y - 0.2}`, 'rgba(8,10,14,0.7)', 0.16, 0.05);
      B.line(`M ${x0 - 1} ${y - 0.22} L ${x1 + 1} ${y - 0.42}`, 'rgba(226,234,242,0.45)', 0.1, 0.04);
    }
    B.line(`M ${x0} ${y0 + 0.35} L ${x1} ${y0 + 0.15}`, 'rgba(236,242,248,0.55)', 0.16, 0.05);
    B.line(`M ${x0} ${y1 - 0.3} L ${x1} ${y1 - 0.5}`, 'rgba(8,10,14,0.55)', 0.3, 0.12);
  });
  // the strap round the limb, its buckle on the outside
  const sy = y0 + h * 0.62;
  B.fill(`M ${x0 - 0.3} ${sy} L ${x1 + 0.3} ${sy - 0.2} L ${x1 + 0.3} ${sy + 0.75} L ${x0 - 0.3} ${sy + 0.95} Z`, ctx.far ? '#151a21' : '#1d232c', 0.04);
  B.fill(`M ${x1 - 1.4} ${sy - 0.25} L ${x1 - 0.4} ${sy - 0.3} L ${x1 - 0.4} ${sy + 0.95} L ${x1 - 1.4} ${sy + 1.0} Z`, '#6d7680', 0.03);
  B.line(`M ${x1 - 1.3} ${sy - 0.1} L ${x1 - 0.5} ${sy - 0.15}`, 'rgba(220,228,236,0.6)', 0.08, 0.02);
  worn(g, d, [x0, y0, x1, y1], seed, ctx.far ? 0.5 : 0.9);
}
function heavyUpper(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.12, 1); cel(g, UPPER, t(PAL.suit), { sh: 1.5, hl: 0.45 }); g.restore();
  clothFolds(g, UPPER, [[[-2.0, 6.2], [-0.4, 7.0], [1.8, 6.6]], [[-1.8, 10.4], [0.0, 11.0], [1.8, 10.6]]], t(PAL.suit));
  // the upper-arm guard under the bigger shoulder plate
  guard(g, ctx, 'M -2.9 3.0 C -1.0 2.6 1.0 2.6 2.8 2.8 C 3.0 5.0 2.9 7.4 2.6 9.2 C 0.8 9.6 -0.9 9.6 -2.6 9.4 C -2.9 7.4 -3.0 5.0 -2.9 3.0 Z', [-2.9, 2.6, 2.8, 9.6], 51, 2);
  shoulderPlate(g, ctx, PAL.armor, true);
}
function heavyFore(g, ctx) {
  fore(g, ctx);
  guard(g, ctx, 'M -2.5 1.4 C -0.8 1.0 0.8 1.0 2.4 1.2 C 2.5 3.4 2.5 5.6 2.3 7.6 C 0.7 7.9 -0.8 7.9 -2.2 7.8 C -2.5 5.6 -2.6 3.4 -2.5 1.4 Z', [-2.5, 1.0, 2.4, 7.9], 53, 2);
}
function heavyThigh(g, ctx) {
  thigh(g, ctx);
  guard(g, ctx, 'M -3.2 1.6 C -1.0 1.1 1.6 1.0 3.4 1.2 C 3.9 4.0 3.8 7.0 3.2 9.6 C 1.2 10.1 -0.8 10.2 -2.8 10.0 C -3.5 7.4 -3.6 4.4 -3.2 1.6 Z', [-3.6, 1.0, 3.8, 10.2], 55, 3);
}

export const KALKANLI = {
  id: 'kalkanli', name: 'KALKANLI', role: 'VANTA', pal: PAL,
  pose: { nUpper: -0.35, nFore: -1.45, nHand: -0.2, fUpper: -0.1, fFore: -0.4, fHand: -0.2, nThigh: 0.26, nShin: 0.06, fThigh: -0.3, fShin: -0.04, head: 0.04 },
  parts: { ...PARTS, torso: heavyTorso, upper: heavyUpper, fore: heavyFore, thigh: heavyThigh, front: shieldFront },
};

// --- HÜCUMCU: light kit, a gas mask, the red unit band ----------------------------------------
const RED = mat(tone('#e85a55', '#c4302c', '#8c1f1c', '#3e0a09'), 'canvas', 0.5);
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
function maskHead(g) {
  const A = PAL.armor, RUB = mat(tone('#3c4148', '#272b31', '#181b1f', '#07080a'), 'rubber', 0.45);
  neck(g, PAL.black);
  // the black hood under it all
  const HD = headShape({ jaw: 0.8 });
  cel(g, HD, mat(PAL.black, 'knit', 0.5), { sh: 1.0, hl: 0.3 });
  // the mask: moulded rubber from the brow to under the chin, the straps back over the hood
  for (const d of ['M 0.5 -8.4 C -1.2 -9.4 -2.8 -9.6 -4.2 -9.2', 'M 0.3 -6.2 C -1.4 -6.4 -2.8 -6.4 -4.0 -6.0', 'M 0.6 -2.6 C -0.8 -3.0 -2.2 -3.6 -3.4 -4.4']) stroke(g, d, '#0a0b0d', 0.4);
  const MASK = 'M 0.4 -9.1 C 2.4 -9.6 4.6 -9.2 5.4 -8.1 C 5.7 -7.3 5.7 -6.5 5.5 -5.8 C 6.2 -5.4 6.5 -4.6 6.4 -3.8 C 6.3 -2.8 5.7 -2.0 4.8 -1.6 C 3.8 -1.2 2.5 -1.2 1.5 -1.6 C 0.7 -2.2 0.3 -3.2 0.2 -4.4 C 0.0 -6.0 0.0 -7.8 0.4 -9.1 Z';
  cel(g, MASK, RUB, { sh: 0.9, hl: 0.5, gloss: 0.4 });
  clip(g, MASK, () => { stroke(g, curve([[1.0, -8.9], [3.0, -9.25], [5.1, -8.1]]), RUB.l, 0.18, 0.7); fill(g, 'M 0 -3.2 C 2 -2.6 4 -2.2 7 -2.8 L 7 -1 L 0 -1 Z', RUB.k, 0.45); });
  // the lenses: dark glass in heavy steel rings, the far one only an edge past the nose
  for (const [x, y, rx, ry] of [[5.15, -7.05, 0.34, 0.62], [2.7, -7.05, 0.92, 0.98]]) {
    cel(g, `M ${x - rx - 0.28} ${y} a ${rx + 0.28} ${ry + 0.28} 0 1 0 ${2 * rx + 0.56} 0 a ${rx + 0.28} ${ry + 0.28} 0 1 0 ${-2 * rx - 0.56} 0 Z`, PAL.steel, { sh: 0.4, hl: 0.5, lw: 0.14 });
    const L = `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
    fill(g, L, '#140c0e');
    clip(g, L, () => { fill(g, `M ${x - rx} ${y + ry * 0.1} L ${x + rx} ${y - ry * 0.3} L ${x + rx} ${y + ry} L ${x - rx} ${y + ry} Z`, '#3a1216', 0.7); fill(g, `M ${x - rx * 0.7} ${y - ry} L ${x - rx * 0.2} ${y - ry} L ${x - rx * 0.8} ${y + ry} L ${x - rx * 1.2} ${y + ry} Z`, '#e8eef4', 0.3); });
  }
  // the filter canister screwed on at the front: Vanta's grey, threaded, the intake holes
  g.save(); g.translate(4.6, -3.4); g.rotate(0.35);
  const CAN = 'M -0.6 -1.0 L 2.2 -1.0 C 2.5 -1.0 2.65 -0.8 2.65 -0.5 L 2.65 0.5 C 2.65 0.8 2.5 1.0 2.2 1.0 L -0.6 1.0 Z';
  cel(g, CAN, A, { sh: 0.6, hl: 0.5, gloss: 0.3 });
  clip(g, CAN, () => { for (let x = -0.5; x < 0.5; x += 0.16) stroke(g, `M ${x} -1.1 L ${x} 1.1`, A.k, 0.06, 0.7); fill(g, 'M 2.35 -1.1 L 2.7 -1.1 L 2.7 1.1 L 2.35 1.1 Z', A.k, 0.8); stroke(g, 'M -0.5 -0.8 L 2.4 -0.8', '#ffffff', 0.1, 0.5); });
  for (const y of [-0.5, 0, 0.5]) fill(g, `M 2.45 ${y - 0.08} l 0.16 0 l 0 0.16 l -0.16 0 Z`, '#050607');
  g.restore();
  // the low helmet over it all, the mark on its side
  const LID = 'M -4.8 -6.4 C -5.2 -10.0 -2.6 -12.6 0.6 -12.6 C 3.6 -12.6 5.3 -10.9 5.4 -8.9 L 4.6 -8.6 C 2.4 -9.0 -1.2 -8.7 -4.1 -6.0 Z';
  cel(g, LID, A, { sh: 1.3, hl: 0.6 });
  clip(g, LID, () => { stroke(g, curve([[-3.8, -10.4], [-0.6, -12.3], [3.6, -11.8]]), '#ffffff', 0.2, 0.75); emblem(g, -1.4, -9.6, 0.9, PAL.white.m); });
  worn(g, LID, [-5.2, -12.6, 5.4, -6.0], 43, 0.6);
}
function lightTorso(g) {
  uniform(g);
  const LPLATE = blob([[-4.8, -20.8], [1.2, -21.8], [5.4, -20.8], [6.8, -16.8], [6.4, -11.4], [-0.4, -10.8], [-5.4, -11.6], [-5.8, -15.8]]);
  cel(g, LPLATE, PAL.armor, { sh: 1.6, hl: 0.55 });
  clip(g, LPLATE, () => { stroke(g, curve([[-4.0, -20.0], [1.2, -21.0], [5.0, -20.0]]), '#ffffff', 0.14, 0.6); for (const [x, y] of [[-4.2, -19.6], [5.4, -19.8]]) rivet(g, x, y, 0.24, PAL.steel); });
  worn(g, LPLATE, [-5.8, -21.8, 6.8, -10.8], 35);
  // the shell bandolier from the far shoulder to the near hip
  const BAND = 'M -6.0 -21.2 L -4.0 -22.2 L 6.6 -7.2 L 5.0 -5.8 Z';
  cel(g, BAND, PAL.webbing, { sh: 0.5, hl: 0.25 });
  for (let k = 0; k < 7; k++) {
    const u = k / 6, x = -4.6 + u * 10.0, y = -20.6 + u * 13.6;
    fill(g, `M ${x - 0.55} ${y - 0.2} L ${x + 0.55} ${y - 0.95} L ${x + 1.05} ${y - 0.2} L ${x - 0.05} ${y + 0.55} Z`, MAT.shell.m);
    fill(g, `M ${x + 0.45} ${y - 0.85} L ${x + 0.75} ${y - 1.05} L ${x + 1.2} ${y - 0.35} L ${x + 0.95} ${y - 0.15} Z`, M.brass.m);
  }
}
function lightUpper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL.suit), { sh: 1.5, hl: 0.45 });
  clothFolds(g, UPPER, [[[-2.0, 6.2], [-0.4, 7.0], [1.8, 6.6]], [[-1.8, 10.4], [0.0, 11.0], [1.8, 10.6]]], t(PAL.suit));
  clip(g, UPPER, () => { fold(g, [[-1.8, 8.8], [-0.4, 9.7], [1.2, 9.9]], t(PAL.suit)); });
  // the red unit band
  clip(g, UPPER, () => { cel(g, 'M -4 4.4 L 4 4.2 L 4 6.8 L -4 7.0 Z', t(RED), { sh: 0.4, hl: 0.2, lw: 0.2 }); stitch(g, 'M -4 4.7 L 4 4.5', t(RED).l, 0.06, 0.6); stitch(g, 'M -4 6.5 L 4 6.3', t(RED).l, 0.06, 0.6); });
}
function lightChest(g) {
  collar(g);
  cel(g, 'M -6.0 -5.4 C -1.2 -5.75 2.6 -5.75 5.7 -5.5 L 5.75 -3.6 C 2.6 -3.85 -1.2 -3.85 -6.05 -3.5 Z', PAL.webbing, { sh: 0.4, hl: 0.2 });
}

export const HUCUMCU = {
  id: 'hucumcu', name: 'HÜCUMCU', role: 'VANTA', pal: PAL,
  pose: {
    nThigh: 0.24, nShin: 0.08, fThigh: -0.3, fShin: -0.05, head: 0.02,
    gun: { w: WEAPONS.ramrod, at: [6.0, -40.6], ang: 0.35, k: 0.96, mat: SYN_MAT },
  },
  parts: { ...PARTS, head: maskHead, torso: lightTorso, upper: lightUpper, chest: lightChest },
};

// --- GALL: the Secretary -----------------------------------------------------------------------
// A bureaucrat, not a soldier: a double-breasted navy-black greatcoat to below
// the knee, belted, two rows of silver buttons; a thin armour vest under it
// shows at the collar; the peaked cap with a red band and the silver mark;
// black leather gloves. Fifties, short grey hair, clean-shaven, thin lips,
// cold grey eyes.
const G = {
  coat: mat(tone('#363c4d', '#252a37', '#181c26', '#090b10'), 'wool', 0.6),
  vest: mat(tone('#59606d', '#3e444f', '#2a2f37', '#111317'), 'nylon', 0.5),
  red: mat(tone('#c4423f', '#951f22', '#651416', '#2b0708'), 'wool', 0.4),
  silver: mat(tone('#f1f3f5', '#c3c9cf', '#8f969d', '#474c52'), 'steel', 0.4),
  leather: mat(tone('#3c3a39', '#262423', '#181716', '#080707'), 'leather', 0.5),
  shirt: tone('#eceae4', '#cfccc4', '#a29f98', '#55534e'),
  skin: mat(tone('#efcfb7', '#d4ad94', '#a8826b', '#64483a'), 'skin', 0.45),
  hair: tone('#c9c6c0', '#a19d97', '#76726c', '#3d3b38'),
};
const GCOAT = blob([
  [-2.0, -23.6], [-5.2, -23.0], [-8.0, -21.6], [-8.8, -19.0], [-8.4, -15.4], [-7.2, -11.4], [-6.6, -7.6], [-6.8, -3.4], [-6.8, 1.6],
  [6.2, 1.4], [6.0, -3.4], [5.6, -8.4], [6.2, -12.6], [6.9, -16.4], [6.5, -19.8], [4.2, -22.6], [1.2, -23.8],
]);
function gallTorso(g) {
  cel(g, PELVIS, G.coat, { sh: 1.1, hl: 0.4 });
  cel(g, GCOAT, G.coat, { sh: 2.2, hl: 0.6 });
  clip(g, GCOAT, () => {
    // the double-breasted front: the lapel's edge, two rows of silver buttons
    stroke(g, 'M 6.6 -21.0 C 3.2 -18.6 2.6 -14.0 2.8 -2.0', G.coat.k, 0.3);
    stitch(g, 'M 6.2 -21.0 C 2.8 -18.6 2.2 -14.0 2.4 -2.0', G.coat.l, 0.06, 0.5);
    for (const y of [-15.6, -11.6, -7.6]) for (const x of [1.0, 4.4]) rivet(g, x, y, 0.36, G.silver);
    // the belt, its silver buckle; the coat's seams and a crisp fold
    cel(g, 'M -8 -6.2 C -2 -6.6 2 -6.6 8 -6.2 L 8 -4.6 C 2 -5.0 -2 -5.0 -8 -4.6 Z', G.leather, { sh: 0.3, hl: 0.2 });
    buckle(g, 3.0, -6.6, 1.6, 2.1, G.silver);
    stroke(g, curve([[-5.0, -20.6], [-5.4, -15.0], [-5.0, -9.0], [-5.2, -1.0]]), G.coat.d, 0.3);
    fold(g, [[-4.2, -10.0], [-2.0, -9.2], [0.4, -9.4]], G.coat, 0.24);
  });
  // heavy wool: drag folds from under the arm toward the belt, the cloth bunched
  // above the belt and flaring below it, a crease down the skirt
  clothFolds(g, GCOAT, [[[-7.0, -17.4], [-5.2, -14.6], [-3.6, -11.2]], [[-6.4, -12.6], [-4.4, -10.4], [-2.0, -8.0]], [[-6.4, -7.6], [-3.4, -7.2], [0.2, -7.4]], [[-5.6, -3.6], [-6.0, -0.6]], [[0.4, -3.8], [0.8, -0.6]], [[5.4, -14.6], [4.4, -11.6], [4.2, -8.4]]], G.coat);
  // the shoulder board on the near side, silver piping
  cel(g, 'M -5.6 -22.6 L -1.0 -23.4 L -0.6 -22.2 L -5.2 -21.4 Z', G.coat, { sh: 0.2, hl: 0.2, lw: 0.2 });
  stroke(g, 'M -5.6 -22.6 L -1.0 -23.4', G.silver.m, 0.14);
}
function gallChest(g) {
  const B = brush(g), C = G.coat;
  // the throat: a white shirt collar stiff round the neck, a black tie knotted tight
  const SH = 'M 0.2 -24.6 C 1.2 -24.9 2.4 -24.9 3.3 -24.6 C 3.5 -24.2 3.6 -23.8 3.5 -23.3 L 1.0 -22.8 C 0.5 -23.4 0.2 -24.0 0.2 -24.6 Z';
  B.fill(SH, G.shirt.m, 0.02);
  B.inside(SH, () => { B.dab(1.0, -23.6, 1.2, 0.6, 'rgba(60,58,54,0.5)'); B.line('M 0.4 -24.55 C 1.4 -24.84 2.4 -24.84 3.2 -24.55', 'rgba(255,255,255,0.75)', 0.07, 0.02); B.line('M 0.5 -24.3 C 1.4 -24.56 2.4 -24.56 3.3 -24.3', 'rgba(70,66,60,0.45)', 0.05, 0.03); });
  B.fill('M 3.0 -23.9 C 3.3 -23.96 3.56 -23.86 3.62 -23.64 L 3.6 -22.7 C 3.36 -22.6 3.12 -22.62 2.96 -22.72 Z', '#111217', 0.02);
  B.line('M 3.08 -23.82 C 3.3 -23.86 3.48 -23.78 3.54 -23.62', 'rgba(150,156,170,0.5)', 0.04, 0.02);
  // the greatcoat's collar turned down over the shoulders: the roll round the back of
  // the neck lit along its top, the shadow it throws on the shirt, the point at the front
  const COL = 'M -3.8 -22.2 C -3.9 -23.4 -3.4 -24.4 -2.4 -24.8 C -1.2 -25.1 0.2 -24.9 1.2 -24.3 C 2.0 -23.8 2.7 -23.1 3.2 -22.4 L 4.0 -21.0 C 3.4 -20.8 2.8 -20.9 2.3 -21.1 C 1.0 -21.5 -0.6 -21.7 -2.0 -21.8 C -2.8 -21.9 -3.4 -22.0 -3.8 -22.2 Z';
  B.inside(SH, () => B.line('M -1 -24.4 C 0.6 -24.2 1.8 -23.6 2.8 -22.6', 'rgba(20,18,16,0.5)', 0.4, 0.25));
  cel(g, COL, C, { sh: 0.9, hl: 0.4 });
  B.inside(COL, () => {
    B.line('M -2.6 -24.7 C -1.2 -25.02 0.2 -24.82 1.2 -24.22 C 2.0 -23.72 2.7 -23.02 3.2 -22.32', 'rgba(150,160,186,0.5)', 0.16, 0.08);
    B.fill('M -5 -23.2 C -2 -23.0 1 -22.6 4 -21.6 L 4 -20 L -5 -20 Z', 'rgba(6,8,12,0.4)', 0.3);
    B.dab(-3.0, -23.0, 1.0, 1.4, 'rgba(6,8,12,0.4)');
    texture(g, 'wool', 0.4, 0.6);
  });
  stitch(g, 'M -3.4 -22.4 C -1.4 -22.0 1.0 -21.6 3.4 -21.0', C.l, 0.05, 0.4);
  // the red tab on the collar's front, the silver mark on it
  const TAB = 'M 1.4 -23.7 C 1.9 -23.4 2.4 -22.9 2.8 -22.3 L 3.3 -21.4 C 2.7 -21.3 2.1 -21.4 1.6 -21.6 C 1.4 -22.3 1.3 -23.0 1.4 -23.7 Z';
  cel(g, TAB, G.red, { sh: 0.3, hl: 0.25, lw: 0.14 });
  B.inside(TAB, () => { B.dab(2.2, -23.0, 0.5, 0.4, 'rgba(255,170,150,0.3)'); texture(g, 'wool', 0.35, 0.5); });
  emblem(g, 2.25, -22.35, 0.4, G.silver.m);
  B.line('M 1.98 -22.6 L 2.36 -22.62', 'rgba(255,255,255,0.6)', 0.04);
  // the armour vest's edge just showing under the collar's point
  B.line('M 3.7 -20.8 C 4.0 -20.5 4.3 -20.3 4.6 -20.2', G.vest.m, 0.16, 0.03);
}
function gallUpper(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.06, 1); cel(g, UPPER, t(G.coat), { sh: 1.5, hl: 0.45 }); g.restore();
  clip(g, UPPER, () => { fold(g, [[-1.6, 8.6], [-0.2, 9.6], [1.4, 9.8]], t(G.coat)); stitch(g, curve([[-2.2, 1.0], [-2.4, 6.0], [-2.0, 11.0]]), t(G.coat).l, 0.06, 0.5); });
  if (!ctx.far) clip(g, UPPER, () => emblem(g, 0.2, 3.2, 1.0, G.silver.m));
  clothFolds(g, UPPER, [[[-2.0, 6.4], [-0.4, 7.2], [1.8, 6.8]], [[-1.8, 10.6], [0.0, 11.2], [1.8, 10.8]]], t(G.coat));
}
function gallFore(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.06, 1); cel(g, FORE, t(G.coat), { sh: 1.3, hl: 0.4 }); g.restore();
  // the turned-back cuff with its two silver buttons, the white shirt cuff
  cel(g, blob([[-2.5, 6.6], [2.4, 6.4], [2.3, 8.6], [-2.4, 8.8]]), t(G.coat), { sh: 0.4, hl: 0.3, lw: 0.22 });
  for (const x of [-1.0, 0.4]) rivet(g, x, 7.6, 0.18, G.silver);
  cel(g, blob([[-1.9, 8.6], [1.8, 8.4], [1.7, 9.8], [-1.8, 10.0]]), t(G.shirt), { sh: 0.2, hl: 0.15, lw: 0.18 });
}
function gallHand(g, ctx) { glove(g, ctx, G.leather); }
const GTAIL = blob([[-5.4, -1.4], [2.8, -1.6], [3.6, 4.0], [4.2, 11.0], [4.8, 18.6], [0.6, 19.2], [-4.4, 19.0], [-6.2, 18.2], [-5.9, 9.0], [-5.6, 2.0]]);
function gallThigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(G.coat), { sh: 1.6, hl: 0.4 });
  cel(g, GTAIL, t(G.coat), { sh: 1.7, hl: 0.5 });
  clip(g, GTAIL, () => {
    fill(g, 'M 3.6 0 C 3.9 6 4.3 12 4.9 19.4 L 3.6 19.4 C 3.2 12 2.9 6 2.6 0 Z', t(G.coat).k, 0.5);
    stitch(g, 'M -6.2 18.0 C -2.4 18.6 1.4 18.6 4.9 18.1', t(G.coat).l, 0.06, 0.5);
    fold(g, [[-3.0, 1.0], [-3.6, 8.0], [-4.2, 16.0]], t(G.coat), 0.3);
    fold(g, [[0.4, 2.0], [0.2, 9.0], [0.0, 16.0]], t(G.coat), 0.26);
    // a silver button low on the skirt, a pocket flap
    cel(g, 'M -1.8 3.4 L 2.2 3.2 L 2.2 4.6 L -1.8 4.8 Z', t(G.coat), { sh: 0.2, hl: 0.15, lw: 0.2 });
  });
}
function gallShin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(G.coat), { sh: 1.4, hl: 0.35 });
  // tall polished boots, the shine running down the shaft
  const SH = blob([[-2.75, 3.4], [2.5, 3.1], [2.6, 9.0], [2.65, 15.0], [-2.65, 15.1], [-2.9, 9.0]]);
  cel(g, SH, t(G.leather), { sh: 0.9, hl: 0.5 });
  clip(g, SH, () => { stroke(g, curve([[1.4, 4.0], [1.7, 9.0], [1.6, 14.4]]), '#ffffff', 0.18, 0.35); stroke(g, 'M -2.8 3.8 C -1 3.5 1 3.4 2.6 3.6', t(G.leather).l, 0.12, 0.6); });
}
function gallFoot(g, ctx) { boot(g, ctx, G.leather, PAL.sole, { toe: G.leather }); }
// Gall's head (docs §10.16): no face. The peaked cap low, small round dark glasses, a
// black wool mask pulled up over the nose and mouth and down into the coat's collar; the
// grey hair cut close at the temple, the ear. Drawn as FLINT's head is.
const GCROWN = 'M -4.0 -8.8 C -4.4 -9.2 -4.85 -9.75 -4.95 -10.2 C -5.02 -10.6 -4.7 -10.82 -4.1 -10.9 C -1.2 -11.32 2.4 -11.72 4.95 -11.86 C 5.65 -11.88 5.95 -11.62 5.82 -11.24 C 5.55 -10.36 5.0 -9.24 4.55 -8.42 C 1.8 -8.5 -1.5 -8.62 -4.0 -8.8 Z';
const GBAND = 'M -4.05 -7.82 C -1.5 -7.58 1.8 -7.42 4.48 -7.36 C 4.56 -7.72 4.58 -8.1 4.55 -8.44 C 1.8 -8.52 -1.5 -8.64 -4.0 -8.82 C -4.1 -8.5 -4.12 -8.15 -4.05 -7.82 Z';
const GPEAK = 'M 3.0 -7.62 C 4.3 -7.7 5.6 -7.5 6.55 -7.12 C 6.9 -6.98 7.05 -6.86 6.95 -6.78 C 6.2 -6.86 5.2 -6.98 4.2 -7.08 C 3.7 -7.14 3.3 -7.28 3.0 -7.62 Z';
const GMASK = 'M -2.6 -4.8 C -1.0 -5.4 1.2 -5.8 3.0 -5.9 C 4.4 -5.95 5.3 -5.5 5.5 -4.6 C 5.7 -3.4 5.3 -2.2 4.4 -1.6 C 3.4 -0.9 1.6 -0.7 0.0 -0.9 C -1.4 -1.1 -2.4 -1.8 -2.8 -2.8 Z';
const GLENS = 'M 2.9 -6.9 a 0.62 0.6 0 1 0 1.24 0 a 0.62 0.6 0 1 0 -1.24 0 Z';
function gallHead(g) {
  const S = G.skin;
  skinNeck(g, G.coat, { wide: 0.1 });
  const HD = headShape({ jaw: 0.85 });
  cel(g, HD, S, { sh: 1.2, hl: 0.35 });
  skinGlaze(g, HD, { k: 1.1 });
  clip(g, HD, () => {
    // grey hair cut close at the temple and the back, the ear flat to the head
    cel(g, 'M -4.3 -8.8 C -4.1 -7.0 -3.7 -5.6 -3.0 -4.6 L -2.1 -5.2 C -2.4 -6.4 -2.4 -7.6 -2.0 -8.8 Z', mat(G.hair, 'wool', 0.6), { sh: 0.3, hl: 0.4, line: false });
    fill(g, 'M 0.6 -8.6 C 0.5 -7.8 0.4 -7.0 0.5 -6.4 L 1.1 -6.5 C 1.1 -7.2 1.2 -8.0 1.4 -8.6 Z', G.hair.d, 0.8);
    cel(g, 'M -1.5 -7.4 C -0.7 -7.7 -0.2 -6.9 -0.3 -6.1 C -0.4 -5.4 -1.1 -5.2 -1.6 -5.7 Z', S, { sh: 0.5, hl: 0.3, line: false, ao: 0.6 });
    stroke(g, 'M -1.1 -7.0 C -0.6 -6.9 -0.6 -6.1 -1.0 -5.9', S.k, 0.12, 0.7);
  });
  // the mask: black wool up over the nose, close round the jaw, into the collar
  cel(g, GMASK, mat(tone('#3a3d44', '#24272d', '#16181c', '#08090b'), 'knit', 0.5), { sh: 0.9, hl: 0.4 });
  clip(g, GMASK, () => { stroke(g, curve([[1.6, -5.75], [3.6, -5.85], [5.4, -4.8]]), '#5a5e66', 0.18, 0.7); });
  clothFolds(g, GMASK, [[[-2.2, -4.4], [0.4, -4.8], [3.0, -4.9]], [[-1.8, -2.4], [0.6, -2.2], [3.2, -2.4], [4.6, -2.8]]], tone('#3a3d44', '#24272d', '#16181c', '#08090b'));
  // the glasses: small, round, black glass in a thin silver rim, the arm back over the ear
  stroke(g, 'M 2.9 -7.0 C 1.6 -7.0 0.2 -6.8 -0.6 -6.5', G.silver.d, 0.12);
  fill(g, GLENS, '#0d0e11');
  clip(g, GLENS, () => fill(g, 'M 3.1 -7.6 L 3.4 -7.6 L 3.2 -6.3 L 2.9 -6.3 Z', '#e8eef4', 0.35));
  stroke(g, GLENS, G.silver.m, 0.1);
  // the peaked cap: the crown in the coat's navy, the red band, the silver mark, the cord, the peak
  cel(g, GCROWN, G.coat, { sh: 1.0, hl: 0.5 });
  clip(g, GCROWN, () => { stroke(g, curve([[-3.6, -10.6], [0.6, -11.4], [5.2, -11.6]]), '#ffffff', 0.12, 0.35); fill(g, 'M -6 -10 L -1.5 -10 C -1.6 -9.6 -1.8 -9.2 -2.2 -8.6 L -6 -8.6 Z', G.coat.k, 0.45); });
  stroke(g, 'M -4.75 -10.8 C -1.2 -11.24 2.4 -11.64 4.95 -11.78 C 5.6 -11.8 5.86 -11.6 5.8 -11.3', G.red.m, 0.14);
  cel(g, GBAND, G.red, { sh: 0.3, hl: 0.25, lw: 0.14 });
  g.save(); g.translate(4.92, -9.62); g.scale(0.5, 1); emblem(g, 0, 0, 0.62, G.silver.m); g.restore();
  stroke(g, 'M 1.5 -7.74 C 2.4 -7.68 3.4 -7.64 4.52 -7.62', G.silver.d, 0.17);
  stroke(g, 'M 1.5 -7.8 C 2.4 -7.74 3.4 -7.7 4.52 -7.68', G.silver.l, 0.06, 0.8);
  rivet(g, 1.42, -7.74, 0.18, G.silver);
  cel(g, GPEAK, G.leather, { sh: 0.3, hl: 0.4, lw: 0.14 });
  stroke(g, 'M 3.3 -7.56 C 4.4 -7.62 5.6 -7.44 6.6 -7.06', '#ffffff', 0.08, 0.6);
}

export const GALL = {
  id: 'gall', name: 'GALL', role: 'VANTA', pal: G,
  pose: {
    nThigh: 0.2, nShin: 0.06, fThigh: -0.26, fShin: -0.04, head: 0.02,
    gun: { w: WEAPONS.kestrel, at: [6.4, -41.4], ang: 0.4, k: 0.96, mat: SYN_MAT },
  },
  parts: { ...PARTS, head: gallHead, torso: gallTorso, chest: gallChest, upper: gallUpper, fore: gallFore, hand: gallHand, thigh: gallThigh, shin: gallShin, foot: gallFoot },
};
