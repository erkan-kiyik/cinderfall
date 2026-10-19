// VANTA — the security firm that holds the city (docs/KOR_STORY_CINEMATIC.md
// §9.3, painted per §10.1). Everything the cells are not: one issue, clean,
// new, repeated. Blue-grey polymer armour over a navy uniform, a full-face
// helmet with one thin red visor slit, the white ring-and-bar mark on the
// left shoulder. The shield man carries more plate and a smoked riot shield;
// the rusher a gas mask with two red lenses and a red unit band; and Gall,
// the Secretary, is no soldier at all: a long belted coat, a peaked cap, an
// open, cold face.
import { cel, fill, stroke, clip, blob, curve } from '../kit.js';
import { Brush, rnd } from '../paint.js';
import { M, tone, mat } from '../style.js';
import { WEAPONS, MAT } from '../weapons/index.js';
import { UPPER, FORE, THIGH, SHIN, TORSO, PELVIS, glove, boot, fold, headShape, skinGlaze, softEye, softBrow, softHair, neck as skinNeck, stitch, rivet, buckle, grime, scuffs } from '../ops/body.js';

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

// The Vanta rifles: same frame, cold finish, red accent.
export const SYN_MAT = { ...MAT, poly: tone('#4a5566', '#323b48', '#222831', '#0e1116'), accent: M.visor };

// Vanta's mark: a ring crossed by a bar that runs past it.
export function emblem(g, x, y, r, c) {
  g.save();
  g.strokeStyle = c; g.lineWidth = r * 0.26; g.beginPath(); g.arc(x, y, r * 0.78, 0, Math.PI * 2); g.stroke();
  g.fillStyle = c; g.fillRect(x - r * 1.18, y - r * 0.13, r * 2.36, r * 0.26);
  g.restore();
}

// --- the helmet: full face, one red slit ------------------------------------------------------
const SHELL = 'M -4.8 -3.6 C -5.6 -7.0 -5.0 -11.0 -2.0 -12.4 C 0.8 -13.4 3.8 -12.8 5.2 -10.6 C 5.9 -9.4 6.0 -8.0 5.9 -6.6 L 5.9 -3.8 C 5.8 -2.6 5.0 -1.7 3.8 -1.4 L 1.0 -1.2 C -0.8 -1.4 -2.4 -2.2 -3.4 -3.0 Z';
const SLIT = 'M 1.2 -7.85 L 6.0 -8.0 L 6.05 -7.15 L 1.2 -7.1 Z';
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
  const A = PAL.armor;
  neck(g, PAL.suit);
  cel(g, SHELL, A, { sh: 1.5, hl: 0.6 });
  clip(g, SHELL, () => {
    // the moulded chin guard over the respirator, following the jaw; its vents are
    // grooves pressed into it, soft-edged, not ruled lines
    const JAW = 'M 0.2 -6.9 C 2.6 -7.3 5.2 -7.1 6.3 -6.5 C 6.5 -4.8 6.1 -2.6 4.7 -1.6 C 3.3 -1.0 1.5 -1.1 0.4 -1.6 C -0.2 -3.2 -0.2 -5.2 0.2 -6.9 Z';
    cel(g, JAW, PAL.black, { sh: 0.7, hl: 0.4, gloss: 0.35 });
    const Bj = brush(g);
    Bj.inside(JAW, () => {
      for (const [y, c] of [[-5.3, 0.02], [-4.5, 0.06], [-3.7, 0.1]]) { Bj.line(`M 2.8 ${y} C 3.8 ${y - 0.15 + c} 4.8 ${y - 0.1 + c} 5.7 ${y + 0.2}`, 'rgba(0,0,0,0.85)', 0.28, 0.08); Bj.line(`M 2.8 ${y + 0.22} C 3.8 ${y + 0.07 + c} 4.8 ${y + 0.12 + c} 5.7 ${y + 0.42}`, 'rgba(150,164,180,0.25)', 0.1, 0.05); }
      Bj.dab(4.2, -6.4, 2.4, 0.6, 'rgba(160,176,196,0.25)');
    });
    Bj.line('M -4.8 -6.6 C -2.4 -6.4 -0.6 -6.7 0.3 -6.85', 'rgba(10,12,16,0.6)', 0.18, 0.08);
    // the crown ridge, the rail, the gloss
    cel(g, 'M -3.4 -12.0 C -1.0 -13.4 2.6 -13.2 4.2 -11.6 L 3.8 -10.8 C 2.2 -12.0 -0.6 -12.2 -3.0 -11.2 Z', A, { sh: 0.3, hl: 0.3, lw: 0.18, ao: 0.2 });
    cel(g, 'M -4.4 -9.2 L -1.2 -9.6 L -1.2 -9.0 L -4.4 -8.6 Z', A, { sh: 0.2, hl: 0.15, lw: 0.16, ao: 0.3 });
    for (let x = -4.0; x < -1.4; x += 0.6) fill(g, `M ${x} -9.3 l 0.25 0 l 0 0.5 l -0.25 0 Z`, A.d, 0.7);
    stroke(g, curve([[-3.8, -10.6], [-0.6, -12.6], [3.6, -12.2]]), '#ffffff', 0.18, 0.75);
    // the serial stencilled on the back, the same on every one
    g.save(); g.fillStyle = 'rgba(240,244,248,0.6)'; g.translate(-4.4, -5.2); g.scale(1 / 40, 1 / 40); g.font = "700 30px 'Barlow Condensed', sans-serif"; g.fillText('V-0417', 0, 0); g.restore();
    grime(g, -6, -1, DUST);
  });
  worn(g, SHELL, [-5.6, -13.4, 0.6, -1.2], 29, 0.8);
  // the slit, lit red: a recess that follows the shell's curve, the light inside it
  const B = brush(g);
  B.fill('M 0.9 -8.35 C 2.8 -8.7 4.9 -8.6 6.15 -8.2 L 6.2 -6.9 C 4.9 -7.2 2.8 -7.25 0.95 -7.0 Z', 'rgba(8,9,12,0.95)', 0.06);
  g.save(); g.shadowColor = PAL.visor.m; g.shadowBlur = 7;
  B.fill('M 1.2 -8.1 C 2.9 -8.4 4.9 -8.35 6.0 -8.0 L 6.05 -7.2 C 4.9 -7.45 2.9 -7.5 1.25 -7.3 Z', PAL.visor.m, 0.05);
  g.restore();
  B.line('M 1.5 -7.85 C 3.0 -8.1 4.8 -8.05 5.8 -7.75', PAL.visor.l, 0.18, 0.06);
  // the comms module over the ear, its stub antenna
  cel(g, 'M -2.4 -7.4 C -1.2 -7.6 -0.6 -7.0 -0.6 -6.2 C -0.6 -5.4 -1.2 -4.9 -2.4 -5.0 Z', A, { sh: 0.4, hl: 0.25, lw: 0.2 });
  rivet(g, -1.5, -6.2, 0.26, PAL.steel);
  stroke(g, 'M -2.0 -7.4 L -2.8 -10.6', PAL.black.m, 0.24);
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
  clip(g, TORSO, () => { fold(g, [[-6.8, -14.0], [-6.2, -10.6], [-5.4, -8.2]], T); stitch(g, curve([[-5.2, -20.6], [-5.8, -14.0], [-5.2, -6.0]]), T.l, 0.07, 0.5); });
}
function torso(g) { uniform(g); carrier(g); }
function chest(g) {
  // the collar of the uniform up round the helmet's neck, the belt, a holster
  const COL = 'M -5.4 -21.6 C -5.0 -24.2 -2.2 -25.2 1.0 -25.0 C 3.8 -24.8 5.4 -23.8 5.8 -21.8 L 5.2 -21.0 C 3.0 -20.6 -1.8 -20.4 -5.4 -21.6 Z';
  cel(g, COL, PAL.suit, { sh: 0.8, hl: 0.4 });
  clip(g, COL, () => stitch(g, curve([[-4.8, -22.4], [0.6, -23.5], [5.4, -22.2]]), PAL.suit.l, 0.07, 0.6));
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
    // VANTA, stencilled white, the mark under it
    g.save(); g.translate(11.0, -40.6); g.rotate(Math.PI / 2); g.fillStyle = 'rgba(244,246,248,0.92)'; g.font = '800 2.6px sans-serif'; g.textAlign = 'center'; g.fillText('VANTA', 0, 0.9); g.restore();
    emblem(g, 11.0, -25.4, 2.0, '#f1f3f5');
    // the red band across, the rim
    fill(g, 'M 5 -32.6 L 17 -32.0 L 17 -31.0 L 5 -31.6 Z', PAL.visor.m, 0.85);
    for (const [x, y] of [[8.0, -45], [14.0, -44.4], [8.0, -20], [14.0, -19.4]]) rivet(g, x, y, 0.3, PAL.steel);
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
  const A = PAL.armor;
  neck(g, PAL.black);
  // the low-cut helmet over the mask's head harness
  const HD = headShape({ jaw: 0.8 });
  cel(g, HD, PAL.black, { sh: 1.0, hl: 0.3 });
  const LID = 'M -4.6 -6.4 C -5.0 -10.0 -2.6 -12.6 0.6 -12.6 C 3.6 -12.6 5.2 -10.8 5.2 -8.8 L 4.6 -8.6 C 2.4 -9.0 -1.2 -8.6 -4.0 -6.0 Z';
  cel(g, LID, A, { sh: 1.3, hl: 0.55 });
  clip(g, LID, () => { stroke(g, curve([[-3.6, -10.4], [-0.4, -12.2], [3.4, -11.8]]), '#ffffff', 0.16, 0.7); emblem(g, -1.4, -9.6, 0.9, PAL.white.m); });
  worn(g, LID, [-5.0, -12.6, 5.2, -6.0], 43, 0.8);
  // the mask: moulded rubber over the face, its seams and the cheek's swell; two
  // small lenses of dark glass set deep in thick rims, the red light inside them;
  // the filter canister screwed on at the front, threaded, its paint worn off
  const MASK = 'M 0.6 -9.0 C 2.8 -9.4 5.0 -8.8 5.4 -7.4 L 5.6 -5.4 C 6.4 -4.8 6.4 -3.6 5.8 -3.0 L 3.2 -1.8 C 1.6 -1.8 0.6 -2.8 0.3 -4.4 Z';
  const RUB = tone('#3a3f47', '#262a30', '#16191d', '#07080a');
  cel(g, MASK, RUB, { sh: 0.9, hl: 0.45, gloss: 0.3 });
  const B = brush(g);
  B.inside(MASK, () => {
    B.dab(3.0, -4.4, 1.6, 1.2, 'rgba(150,160,172,0.16)');
    B.line('M 1.2 -8.2 C 2.6 -8.5 4.2 -8.3 5.1 -7.6', 'rgba(170,180,192,0.25)', 0.12, 0.06);
    B.line('M 0.6 -5.6 C 1.8 -5.2 3.4 -5.0 4.6 -5.2', 'rgba(0,0,0,0.5)', 0.18, 0.08);
  });
  B.line('M 0.4 -7.6 C -1.2 -7.8 -2.6 -7.4 -3.6 -6.6', 'rgba(8,9,11,0.9)', 0.36, 0.08);
  B.line('M 0.4 -4.0 C -1.2 -3.6 -2.6 -3.8 -3.4 -4.4', 'rgba(8,9,11,0.9)', 0.36, 0.08);
  for (const [x, y, rx] of [[2.35, -6.95, 0.72], [4.55, -7.05, 0.42]]) {
    // the rim, thick rubber round a steel ring
    B.fill(ell(x, y, rx + 0.36, rx * 0.95 + 0.34), '#101214', 0.05);
    B.fill(ell(x, y, rx + 0.14, rx * 0.95 + 0.12), '#5d646c', 0.03);
    // the glass: dark, the red glow deep in it, the street's light across its face
    B.fill(ell(x, y, rx, rx * 0.92), '#1c0608', 0.02);
    g.save(); g.shadowColor = 'rgba(255,40,52,0.9)'; g.shadowBlur = 5;
    B.dab(x + rx * 0.1, y + rx * 0.12, rx * 0.62, rx * 0.56, 'rgba(255,58,66,0.95)');
    g.restore();
    B.dab(x + rx * 0.05, y + rx * 0.1, rx * 0.28, rx * 0.25, 'rgba(255,170,160,0.8)');
    B.line(`M ${x - rx * 0.6} ${y - rx * 0.2} C ${x - rx * 0.3} ${y - rx * 0.7} ${x + rx * 0.2} ${y - rx * 0.8} ${x + rx * 0.5} ${y - rx * 0.6}`, 'rgba(200,214,230,0.55)', rx * 0.16, 0.03);
  }
  const F = 'M 4.2 -4.6 C 5.6 -5.0 7.2 -4.6 7.4 -3.4 C 7.4 -2.2 5.8 -1.6 4.4 -2.0 Z';
  cel(g, F, mat(tone('#7c8792', '#56606b', '#3a424b', '#15191d'), 'steel', 0.3), { sh: 0.5, hl: 0.35, gloss: 0.4 });
  B.inside(F, () => {
    for (const x of [5.1, 5.55, 6.0, 6.45, 6.9]) { B.line(`M ${x} -4.8 C ${x + 0.12} -3.8 ${x + 0.12} -2.8 ${x} -1.8`, 'rgba(10,12,14,0.65)', 0.13, 0.03); B.line(`M ${x + 0.14} -4.8 C ${x + 0.26} -3.8 ${x + 0.26} -2.8 ${x + 0.14} -1.8`, 'rgba(210,220,230,0.3)', 0.06, 0.02); }
    B.dab(6.2, -2.4, 1.2, 0.5, 'rgba(30,26,22,0.45)');
    B.dab(5.6, -4.3, 0.9, 0.3, 'rgba(230,236,242,0.35)');
  });
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
  clip(g, UPPER, () => { fold(g, [[-1.8, 8.8], [-0.4, 9.7], [1.2, 9.9]], t(PAL.suit)); });
  // the red unit band
  clip(g, UPPER, () => { cel(g, 'M -4 4.4 L 4 4.2 L 4 6.8 L -4 7.0 Z', t(RED), { sh: 0.4, hl: 0.2, lw: 0.2 }); stitch(g, 'M -4 4.7 L 4 4.5', t(RED).l, 0.06, 0.6); stitch(g, 'M -4 6.5 L 4 6.3', t(RED).l, 0.06, 0.6); });
}
function lightChest(g) {
  const COL = 'M -5.4 -21.6 C -5.0 -23.6 -2.2 -24.4 1.0 -24.2 C 3.8 -24.0 5.4 -23.2 5.8 -21.6 L 5.2 -21.0 C 3.0 -20.6 -1.8 -20.4 -5.4 -21.6 Z';
  cel(g, COL, PAL.suit, { sh: 0.8, hl: 0.4 });
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
  // the shoulder board on the near side, silver piping
  cel(g, 'M -5.6 -22.6 L -1.0 -23.4 L -0.6 -22.2 L -5.2 -21.4 Z', G.coat, { sh: 0.2, hl: 0.2, lw: 0.2 });
  stroke(g, 'M -5.6 -22.6 L -1.0 -23.4', G.silver.m, 0.14);
}
function gallChest(g) {
  // the high collar, the armour vest's edge showing at the throat, a white shirt's line
  cel(g, blob([[-3.8, -22.2], [-3.6, -25.2], [-0.6, -26.0], [2.8, -25.6], [4.4, -24.4], [4.0, -22.0], [0.4, -21.6]]), G.coat, { sh: 0.7, hl: 0.35 });
  cel(g, 'M 2.2 -24.8 L 4.4 -24.4 L 4.2 -22.4 L 2.4 -22.6 Z', G.vest, { sh: 0.2, hl: 0.15, lw: 0.18 });
  stroke(g, 'M 3.8 -25.2 L 4.2 -24.4', G.shirt.m, 0.24);
  // the red collar tabs and the silver mark on them
  cel(g, 'M 0.6 -24.6 L 2.4 -24.8 L 2.3 -23.2 L 0.7 -23.0 Z', G.red, { sh: 0.2, hl: 0.15, lw: 0.16 });
  emblem(g, 1.5, -23.9, 0.5, G.silver.m);
}
function gallUpper(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.06, 1); cel(g, UPPER, t(G.coat), { sh: 1.5, hl: 0.45 }); g.restore();
  clip(g, UPPER, () => { fold(g, [[-1.6, 8.6], [-0.2, 9.6], [1.4, 9.8]], t(G.coat)); stitch(g, curve([[-2.2, 1.0], [-2.4, 6.0], [-2.0, 11.0]]), t(G.coat).l, 0.06, 0.5); });
  if (!ctx.far) clip(g, UPPER, () => emblem(g, 0.2, 3.2, 1.0, G.silver.m));
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
function gallHead(g) {
  const S = G.skin, B = brush(g);
  skinNeck(g, S, { wide: 0.1, glaze: true });
  const HD = headShape({ jaw: 0.85 });
  cel(g, HD, S, { sh: 1.1, hl: 0.4 });
  skinGlaze(g, HD, { k: 1.1 });
  clip(g, HD, () => {
    // fifty years in the skin: pores and fine blotches, a little grey of a close shave
    const r = rnd(47);
    for (let i = 0; i < 160; i++) B.dab(-1 + r() * 6, -9 + r() * 6.5, 0.05 + r() * 0.06, 0.04 + r() * 0.05, r() < 0.6 ? 'rgba(90,50,40,0.11)' : 'rgba(255,230,210,0.09)');
    B.dab(2.4, -3.6, 2.0, 0.9, 'rgba(90,96,104,0.14)');
    // short grey hair at the temple and the back, cut close: a soft mass combed back
    softHair(g, 'M -4.2 -9.4 C -4.4 -7.6 -4.0 -6.0 -3.0 -4.8 L -1.8 -5.2 C -2.2 -6.4 -2.0 -7.6 -1.4 -8.6 C -0.4 -9.2 0.8 -9.4 1.6 -9.4 L 1.6 -11 L -4.2 -11 Z', '#76716b', 'rgba(214,208,198,0.6)', [-0.5, 0.8], 300, 29);
    // the ear; the hollow of the cheek; the fold from the nose to the mouth, soft
    cel(g, 'M -1.5 -7.4 C -0.7 -7.7 -0.2 -6.9 -0.3 -6.1 C -0.4 -5.4 -1.1 -5.2 -1.6 -5.7 Z', S, { sh: 0.5, hl: 0.2, line: false, ao: 0.6 });
    B.line('M -1.1 -7.0 C -0.6 -6.9 -0.6 -6.1 -1.0 -5.9', 'rgba(110,60,46,0.6)', 0.12, 0.05);
    B.dab(2.0, -4.4, 1.4, 0.8, 'rgba(110,62,48,0.35)');
    B.line('M 4.4 -4.8 C 4.0 -4.2 3.8 -3.6 3.9 -3.0', 'rgba(110,60,46,0.4)', 0.14, 0.09);
    B.line('M 4.5 -4.7 C 4.15 -4.1 3.95 -3.6 4.05 -3.05', 'rgba(255,226,206,0.25)', 0.08, 0.05);
  });
  // the eye: narrow, pale grey iris, the lid heavy over it; a straight grey brow
  softEye(g, 3.5, -6.95, 1.45, { iris: '#7d8a93', white: '#bdb4a9' });
  softBrow(g, 2.5, -7.75, 4.4, -7.72, 0.08, '#77716b', 7);
  // thin lips, pressed: the seam, the lower lip catching a little light
  B.line('M 3.9 -3.05 C 4.2 -3.0 4.4 -3.0 4.55 -3.1', 'rgba(96,52,44,0.85)', 0.12, 0.04);
  B.dab(4.2, -2.85, 0.32, 0.1, 'rgba(236,180,160,0.4)');
  // the peaked cap: a high crown, the red band, the black peak, the silver mark
  const CROWN = 'M -4.4 -8.8 C -4.8 -10.4 -3.6 -11.8 -0.8 -12.4 C 2.4 -13.0 5.4 -12.4 6.2 -11.2 C 6.4 -10.6 6.0 -10.0 5.2 -9.6 L -4.0 -8.4 Z';
  cel(g, CROWN, G.coat, { sh: 1.0, hl: 0.5 });
  clip(g, CROWN, () => stroke(g, curve([[-3.6, -11.0], [0.6, -12.4], [5.4, -11.6]]), G.silver.m, 0.12, 0.6));
  const BAND = 'M -4.2 -8.4 L 5.0 -9.7 L 5.0 -8.5 L -4.0 -7.2 Z';
  cel(g, BAND, G.red, { sh: 0.3, hl: 0.2, lw: 0.2 });
  cel(g, 'M 3.4 -8.6 C 4.8 -8.8 6.2 -8.4 6.8 -7.8 C 6.6 -7.4 5.4 -7.4 4.2 -7.6 L 3.0 -7.6 Z', G.leather, { sh: 0.3, hl: 0.4, lw: 0.2 });
  stroke(g, 'M 3.6 -8.4 C 4.8 -8.6 6.0 -8.3 6.6 -7.8', '#ffffff', 0.1, 0.6);
  emblem(g, 3.6, -10.4, 0.7, G.silver.m);
  stroke(g, 'M -2.6 -8.0 L 4.0 -9.0', G.silver.m, 0.14, 0.9);
}

export const GALL = {
  id: 'gall', name: 'GALL', role: 'VANTA', pal: G,
  pose: {
    nThigh: 0.2, nShin: 0.06, fThigh: -0.26, fShin: -0.04, head: 0.02,
    gun: { w: WEAPONS.kestrel, at: [6.4, -41.4], ang: 0.4, k: 0.96, mat: SYN_MAT },
  },
  parts: { ...PARTS, head: gallHead, torso: gallTorso, chest: gallChest, upper: gallUpper, fore: gallFore, hand: gallHand, thigh: gallThigh, shin: gallShin, foot: gallFoot },
};
