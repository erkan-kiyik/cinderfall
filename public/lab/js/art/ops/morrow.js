// MORROW — control. Still, unreadable, always half in smoke. Signature
// shapes: the deep pointed hood over a gas mask with angled lilac lenses,
// the long split trench coat whose tails swing with his legs, and the
// bandolier of smoke charges. Built on the body standard in body.js.
import { M, tone } from '../style.js';
import {
  cel, fill, stroke, clip, blob, curve, fold,
  UPPER, FORE, THIGH, SHIN, TORSO, PELVIS,
  glove, boot, belt,
} from './body.js';

const PAL = {
  coat: tone('#76698c', '#55496a', '#3a314b', '#1b1626'),
  lining: tone('#dccdff', '#a98bff', '#7656d6', '#36246e'),
  pants: tone('#4f5766', '#3a414e', '#282d37', '#12151a'),
  mask: tone('#7a8390', '#555e6a', '#3a4049', '#181b20'),
  lens: tone('#f3ecff', '#c4a8ff', '#8a64e8', '#3a2370'),
  can: tone('#a3acb7', '#78818d', '#525a65', '#23272c'),
  glove: tone('#3a3f49', '#272b33', '#1a1d23', '#0b0c0f'),
  boot: tone('#3d424c', '#292d35', '#1b1e24', '#0b0c0f'),
  sole: M.rubber,
  belt: tone('#7a5038', '#5e3b28', '#43291b', '#21130b'),
};

function canister(g, x, y, h = 3.2) {
  const B = `M ${x - 0.95} ${y} L ${x + 0.95} ${y} L ${x + 0.95} ${y + h} C ${x + 0.95} ${y + h + 0.4} ${x - 0.95} ${y + h + 0.4} ${x - 0.95} ${y + h} Z`;
  cel(g, B, PAL.can, { sh: 0.45, hl: 0.3, lw: 0.26 });
  cel(g, `M ${x - 1.0} ${y - 0.7} L ${x + 1.0} ${y - 0.7} L ${x + 1.0} ${y + 0.3} L ${x - 1.0} ${y + 0.3} Z`, PAL.lining, { sh: 0.25, hl: 0.2, lw: 0.24 });
  stroke(g, `M ${x - 0.95} ${y + h * 0.55} L ${x + 0.95} ${y + h * 0.55}`, PAL.can.k, 0.22);
}

// --- coat body (torso frame, to the hips) ------------------------------------------------
const COAT = blob([
  [-2.0, -23.4], [-5.2, -22.8], [-8.0, -21.4], [-8.9, -19.0], [-8.4, -15.4], [-7.0, -11.4], [-6.4, -7.6], [-6.8, -3.4], [-6.6, 1.6],
  [5.8, 1.4], [5.6, -3.4], [5.2, -8.4], [5.9, -12.6], [6.7, -16.4], [6.3, -19.8], [4.1, -22.6], [1.2, -23.8],
]);
function torso(g) {
  cel(g, PELVIS, PAL.pants, { sh: 1.1, hl: 0.4 });
  canister(g, -6.8, -5.2, 3.4); // on the back of the belt, half under the coat
  cel(g, TORSO, PAL.pants, { sh: 1, hl: 0.3, line: false });
  cel(g, COAT, PAL.coat, { sh: 2.0, hl: 0.55 });
  clip(g, COAT, () => {
    // storm flap over the chest, the double row of buttons, lining at the front edge
    fill(g, 'M 0.2 -21.6 C 2.6 -21.8 4.8 -21.4 6.4 -20.2 L 6.6 -14.8 C 4.4 -15.4 2.2 -15.4 0.4 -15.0 Z', PAL.coat.d, 0.55);
    stroke(g, 'M 0.4 -15.0 C 2.2 -15.4 4.4 -15.4 6.6 -14.8', PAL.coat.k, 0.3);
    for (const y of [-12.8, -9.6, -6.6, -3.6]) fill(g, `M 4.0 ${y} a 0.38 0.38 0 1 0 0.76 0 a 0.38 0.38 0 1 0 -0.76 0 Z`, PAL.mask.d);
    fill(g, 'M 5.6 -3.6 C 5.5 -1.6 5.5 0 5.6 2 L 4.6 2 C 4.6 0 4.6 -1.6 4.7 -3.6 Z', PAL.lining.d);
    fold(g, [[-5.0, -16.0], [-5.6, -11.6], [-5.2, -7.6]], PAL.coat);
    fold(g, [[-2.4, -6.6], [0.0, -6.0], [2.4, -6.2]], PAL.coat);
  });
  // bandolier of small smoke charges across the chest
  const STRAP = 'M -5.4 -21.4 L -3.8 -22.0 L 6.4 -7.2 L 5.0 -6.2 Z';
  cel(g, STRAP, PAL.belt, { sh: 0.4, hl: 0.25, lw: 0.28 });
  for (const k of [0.3, 0.5, 0.7]) {
    const x = -4.6 + k * 10.4, y = -21.7 + k * 15.0;
    g.save(); g.translate(x, y); g.rotate(-0.6); canister(g, 0, -1.3, 2.1); g.restore();
  }
}
function chest(g) {
  // popped collar standing round the hood
  const COL = 'M -5.8 -21.6 C -4.6 -23.8 -1.4 -24.4 1.6 -24.2 C 3.8 -24.0 5.4 -23.0 6.0 -21.8 L 4.8 -20.8 C 3.8 -20.4 2.8 -19.6 2.2 -18.8 C 1.2 -19.6 -0.6 -20.1 -2.6 -20.3 C -3.8 -20.5 -5.0 -20.9 -5.8 -21.6 Z';
  cel(g, COL, PAL.coat, { sh: 1.0, hl: 0.45 });
  clip(g, COL, () => fill(g, 'M -5.6 -22.0 C -3.8 -23.8 -0.6 -24.2 1.8 -23.8 C 3.6 -23.4 5.0 -22.8 5.8 -21.6 L 5.8 -20 L -5.8 -20 Z', PAL.coat.d, 0.6));
  belt(g, { belt: PAL.belt, buckle: PAL.mask });
  canister(g, -3.6, -4.8, 3.0);
}

// --- arms ---------------------------------------------------------------------------------
function upper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL.coat), { sh: 1.5, hl: 0.45 });
  clip(g, UPPER, () => {
    fill(g, 'M -4 -4 L 4 -4 L 4 1.8 C 1.5 2.5 -1.5 2.5 -4 1.6 Z', t(PAL.coat).d, 0.55);
    fold(g, [[-1.8, 8.4], [-0.4, 9.4], [1.2, 9.6]], t(PAL.coat));
  });
}
// the coat sleeve flares a little at the cuff
function fore(g, ctx) {
  const t = ctx.t;
  cel(g, FORE, t(PAL.coat), { sh: 1.3, hl: 0.4 });
  clip(g, FORE, () => {
    fill(g, 'M -3 8.6 L 3 8.6 L 3 13 L -3 13 Z', t(PAL.coat).d);
    fill(g, 'M -3 8.6 L 3 8.6 L 3 9.2 L -3 9.2 Z', t(PAL.lining).m);
    fold(g, [[-1.6, 3.2], [0.0, 4.2], [1.6, 4.0]], t(PAL.coat), 0.28);
  });
}
function hand(g, ctx) {
  if (!ctx.far && !ctx.rt) {
    // smoke canister held loosely (menu pose; in game the hand holds the weapon)
    g.save(); g.translate(0.5, 3.2); g.rotate(0.1); canister(g, 0, 0, 4.4); g.restore();
  }
  glove(g, ctx, PAL.glove, { cuff: PAL.coat });
}

// --- legs, with the coat tails riding on the thighs ------------------------------------------
const TAIL = blob([[-5.4, -1.4], [2.6, -1.6], [3.4, 4.0], [3.9, 10.0], [4.4, 16.2], [0.4, 16.8], [-4.6, 16.6], [-6.2, 15.8], [-5.9, 8.0], [-5.6, 2.0]]);
function thigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(PAL.pants), { sh: 1.6, hl: 0.45 });
  cel(g, TAIL, t(PAL.coat), { sh: 1.6, hl: 0.5 });
  clip(g, TAIL, () => {
    // lilac lining showing along the split and the turned-back hem
    fill(g, 'M 3.5 0 C 3.8 5 4.1 10 4.5 17 L 3.3 17 C 3.0 10 2.7 5 2.4 0 Z', t(PAL.lining).d);
    fill(g, 'M -7 14.6 C -3 15.2 1 15.2 5 14.8 L 5 17.5 L -7 17.5 Z', t(PAL.lining).m);
    fill(g, 'M -7 14.6 C -3 15.2 1 15.2 5 14.8 L 5 15.3 C 1 15.7 -3 15.7 -7 15.1 Z', t(PAL.lining).d);
    fold(g, [[-3.0, 1.0], [-3.6, 7.0], [-4.2, 13.6]], t(PAL.coat), 0.34);
    fold(g, [[0.4, 2.0], [0.2, 8.0], [0.0, 13.6]], t(PAL.coat), 0.3);
  });
}
function shin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(PAL.pants), { sh: 1.4, hl: 0.4 });
  // tall laced boots up to below the knee
  const TALL = blob([[-2.75, 4.2], [2.5, 3.9], [2.6, 9.0], [2.65, 15.0], [-2.65, 15.1], [-2.9, 9.0]]);
  cel(g, TALL, t(PAL.boot), { sh: 0.8, hl: 0.35 });
  for (let y = 5.2; y < 14; y += 1.3) stroke(g, `M 0.7 ${y} L 2.2 ${y + 0.5} M 2.2 ${y} L 0.7 ${y + 0.5}`, t(PAL.boot).l, 0.2);
  stroke(g, 'M -2.7 4.6 C -0.8 4.2 1.0 4.1 2.5 4.3', t(PAL.boot).l, 0.26);
}
function foot(g, ctx) { boot(g, ctx, PAL.boot, PAL.sole); }

// --- head: deep hood over a gas mask --------------------------------------------------------
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
function head(g) {
  const K = PAL.mask;
  cel(g, 'M -1.6 1.2 L 2.0 1.0 L 1.9 -2.4 L 0.4 -3.2 L -1.7 -3.6 Z', PAL.coat, { sh: 1.0, hl: 0 });
  // mask face plate
  const FACE = 'M -0.6 -8.4 C 1.4 -9.0 3.6 -8.8 4.6 -7.6 L 5.0 -5.2 C 5.5 -4.2 5.4 -2.8 4.6 -2.2 C 3.6 -1.4 1.8 -1.2 0.6 -1.6 C -0.3 -2.2 -0.8 -3.4 -0.9 -4.8 C -0.9 -6.2 -0.8 -7.4 -0.6 -8.4 Z';
  cel(g, FACE, K, { sh: 1.1, hl: 0.45 });
  clip(g, FACE, () => {
    stroke(g, curve([[0.0, -3.0], [1.8, -2.2], [3.8, -2.4]]), K.k, 0.24);
    stroke(g, curve([[-0.3, -8.0], [2.0, -8.5], [4.2, -7.7]]), K.l, 0.26, 0.8);
  });
  // angled almond lenses with a lilac glow
  const lens = (d, rim) => {
    cel(g, rim, K, { sh: 0.35, hl: 0.25, lw: 0.26 });
    g.save(); g.shadowColor = PAL.lens.m; g.shadowBlur = 8; fill(g, d, PAL.lens.m); g.restore();
    clip(g, d, () => { fill(g, 'M -2 -5.6 L 6 -6.6 L 6 -3 L -2 -3 Z', PAL.lens.d); fill(g, 'M 0.4 -7.4 L 1.4 -7.5 L 0.8 -6.3 L -0.2 -6.2 Z', PAL.lens.l); });
  };
  lens('M 0.2 -6.2 C 0.8 -7.3 2.2 -7.6 3.0 -7.1 C 3.0 -6.2 2.4 -5.4 1.4 -5.3 C 0.7 -5.3 0.3 -5.6 0.2 -6.2 Z',
    'M -0.3 -6.2 C 0.4 -7.8 2.4 -8.2 3.5 -7.3 C 3.5 -6.0 2.8 -4.9 1.4 -4.8 C 0.4 -4.8 -0.2 -5.3 -0.3 -6.2 Z');
  lens('M 3.6 -7.0 C 4.1 -7.4 4.6 -7.3 4.8 -7.0 C 4.8 -6.3 4.5 -5.6 4.0 -5.5 C 3.7 -5.8 3.5 -6.4 3.6 -7.0 Z',
    'M 3.3 -7.1 C 3.9 -7.8 4.8 -7.7 5.1 -7.1 C 5.2 -6.1 4.8 -5.2 4.0 -5.0 C 3.4 -5.4 3.1 -6.3 3.3 -7.1 Z');
  // front filter with ridges and a side canister
  const F = 'M 3.2 -4.0 L 5.4 -4.4 C 6.2 -4.2 6.3 -2.4 5.5 -2.1 L 3.4 -2.2 Z';
  cel(g, F, PAL.can, { sh: 0.5, hl: 0.35, lw: 0.28 });
  for (const x of [4.2, 4.9]) stroke(g, `M ${x} -4.1 L ${x} -2.2`, PAL.can.k, 0.24);
  stroke(g, 'M 5.6 -4.3 C 6.1 -3.6 6.1 -2.8 5.6 -2.2', PAL.lining.m, 0.4);
  cel(g, ell(0.0, -3.0, 0.85, 1.0), PAL.can, { sh: 0.4, hl: 0.3, lw: 0.26 });
  // the hood: deep, with a point at the brow
  const HOOD = 'M 5.0 -8.6 C 4.6 -10.4 2.4 -11.8 -0.4 -11.6 C -3.4 -11.4 -5.0 -9.2 -5.2 -6.2 C -5.3 -3.4 -4.9 -0.8 -4.0 1.6 L 1.0 1.6 C 0.2 -0.4 -0.3 -2.6 -0.2 -4.4 C -0.1 -6.2 0.6 -7.6 2.0 -8.4 C 2.9 -8.8 4.0 -8.9 5.0 -8.6 Z';
  cel(g, HOOD, PAL.coat, { sh: 1.2, hl: 0.5 });
  clip(g, HOOD, () => {
    fill(g, 'M 5.4 -8.8 C 4.2 -9.2 3.0 -9.0 2.1 -8.4 C 0.6 -7.4 -0.2 -5.8 -0.2 -4.0 C -0.2 -2.0 0.3 -0.2 1.2 1.8 L 2.4 1.8 C 1.2 -0.2 0.9 -2.0 0.9 -4.0 C 0.9 -5.6 1.6 -7.0 2.8 -7.8 C 3.6 -8.2 4.6 -8.4 5.4 -8.2 Z', PAL.coat.k, 0.75);
    stroke(g, curve([[-4.4, -8.4], [-1.8, -10.8], [2.4, -11.0]]), PAL.coat.l, 0.3, 0.8);
    fold(g, [[-3.0, -6.6], [-3.6, -3.4], [-3.4, 0.0]], PAL.coat);
  });
}

export const MORROW = {
  id: 'morrow', name: 'VESPER', role: 'KONTROL', pal: PAL,
  pose: { nUpper: 0.06, nFore: -0.3, nHand: -0.05, fUpper: -0.1, fFore: -0.2, fHand: -0.1, nThigh: 0.12, nShin: 0.02, fThigh: -0.2, fShin: -0.06, head: 0.06 },
  parts: { torso, chest, head, upper, fore, hand, thigh, shin, foot },
};
