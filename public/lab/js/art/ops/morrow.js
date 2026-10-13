// MORROW — control. Still, unreadable, always half in smoke. Signature
// shapes: the deep hood, the respirator with lilac goggle lenses, and the long
// split trench coat with smoke canisters on the belt.
import { cel, fill, stroke, clip, blob, curve, limb } from '../kit.js';
import { M, tone } from '../style.js';
import { UPPER, THIGH, SHIN, BOOT_SHAFT, hand, boot, face, neck } from './common.js';
import { morrowMask } from './helmets.js';

const PAL = {
  skin: M.skinD,
  coat: tone('#6c5f80', '#4d4360', '#352d45', '#1a1524'),
  lining: tone('#dccdff', '#a98bff', '#7656d6', '#36246e'),
  pants: M.charcoal,
  mask: tone('#6f7884', '#4b535e', '#323840', '#16191d'),
  lens: tone('#f3ecff', '#c4a8ff', '#8a64e8', '#3a2370'),
  can: tone('#9aa3ae', '#6f7884', '#4b535e', '#22262b'),
  glove: M.black,
  boot: M.black,
  sole: M.rubber,
  belt: M.leather,
};

const COAT = blob([[-7.0, -18.6], [-4.2, -20.8], [0.6, -21.4], [3.6, -20.6], [5.2, -19.0], [6.0, -15.2], [5.9, -11.0], [5.3, -6.0], [5.6, -2.8], [4.8, 3.0], [3.9, 8.0], [3.3, 12.8], [-2.0, 13.6], [-7.4, 13.6], [-11.6, 12.0], [-9.0, 6.0], [-6.8, 0.0], [-6.3, -6.0], [-6.9, -12.0]]);
const HOOD = 'M 5.6 -11.0 C 5.4 -13.4 3.0 -14.8 0.0 -14.6 C -3.6 -14.4 -5.6 -11.6 -5.8 -8.0 C -6.0 -4.6 -5.6 -1.4 -4.6 1.6 L 1.4 1.6 C 0.4 -0.6 -0.2 -3.4 -0.2 -5.6 C -0.2 -7.8 0.8 -9.8 2.6 -10.8 C 3.6 -11.3 4.6 -11.3 5.6 -11.0 Z';

function canister(g, x, y, h = 3.2) {
  const B = `M ${x - 0.9} ${y} L ${x + 0.9} ${y} L ${x + 0.9} ${y + h} C ${x + 0.9} ${y + h + 0.4} ${x - 0.9} ${y + h + 0.4} ${x - 0.9} ${y + h} Z`;
  cel(g, B, PAL.can, { sh: 0.45, hl: 0.3 });
  cel(g, `M ${x - 0.95} ${y - 0.7} L ${x + 0.95} ${y - 0.7} L ${x + 0.95} ${y + 0.3} L ${x - 0.95} ${y + 0.3} Z`, PAL.lining, { sh: 0.25, hl: 0.2 });
  stroke(g, `M ${x - 0.9} ${y + h * 0.55} L ${x + 0.9} ${y + h * 0.55}`, PAL.can.k, 0.22);
}

function torso(g) {
  // canisters riding on the back of the belt, half hidden by the coat
  canister(g, -6.4, -4.4, 3.4);
  cel(g, COAT, PAL.coat, { sh: 1.9, hl: 0.55 });
  clip(g, COAT, () => {
    // lilac lining showing along the split and the turned-back hem
    fill(g, 'M 5.8 -3.2 C 5.0 2.0 4.2 7.0 3.6 13.4 L 2.4 13.4 C 3.0 7.0 3.8 2.0 4.6 -3.0 Z', PAL.lining.d);
    fill(g, 'M -10 11.4 C -6 12.2 -1 12.6 4 12.0 L 4 14 L -10 14 Z', PAL.lining.m);
    fill(g, 'M -10 11.4 C -6 12.2 -1 12.6 4 12.0 L 4 12.5 C -1 13.1 -6 12.7 -10 11.9 Z', PAL.lining.d);
    // long folds down the skirt
    for (const [x0, x1] of [[-4.0, -6.0], [-1.0, -2.0], [1.6, 1.4]]) stroke(g, curve([[x0, -1.0], [(x0 + x1) / 2 - 0.3, 5.0], [x1, 11.2]]), PAL.coat.d, 0.32);
    stroke(g, curve([[-6.4, 1.0], [-7.6, 6.0], [-8.6, 11.0]]), PAL.coat.l, 0.25, 0.7);
    // storm flap over the chest and the seam under it
    fill(g, 'M 0.4 -19.4 C 2.6 -19.6 4.6 -19.2 6.0 -18.2 L 6.2 -13.2 C 4.2 -13.8 2.2 -13.8 0.6 -13.4 Z', PAL.coat.d, 0.55);
    stroke(g, 'M 0.6 -13.4 C 2.2 -13.8 4.2 -13.8 6.2 -13.2', PAL.coat.k, 0.28);
    // double row of buttons on the front edge
    for (const y of [-11.4, -8.4, -5.6]) fill(g, `M ${4.2} ${y} a 0.35 0.35 0 1 0 0.7 0 a 0.35 0.35 0 1 0 -0.7 0 Z`, PAL.mask.d);
  });
  // wide belt with a square buckle and a second canister at the hip
  cel(g, 'M -6.8 -4.6 C -1 -5.0 2.5 -5.0 5.9 -4.7 L 5.9 -2.7 C 2.5 -3.0 -1 -3.0 -6.6 -2.6 Z', PAL.belt, { sh: 0.4, hl: 0.2 });
  cel(g, 'M 2.6 -5.0 L 4.6 -5.05 L 4.6 -2.4 L 2.6 -2.4 Z', PAL.mask, { sh: 0.3, hl: 0.25 });
  fill(g, 'M 3.1 -4.5 L 4.1 -4.5 L 4.1 -3.0 L 3.1 -3.0 Z', PAL.belt.m);
  canister(g, -3.2, -4.0, 3.0);
  // bandolier of small smoke charges across the chest
  const STRAP = 'M -5.0 -19.2 L -3.4 -19.8 L 6.0 -6.4 L 4.6 -5.4 Z';
  cel(g, STRAP, PAL.belt, { sh: 0.4, hl: 0.25 });
  for (const k of [0.3, 0.5, 0.7]) {
    const x = -4.2 + k * 9.6, y = -19.5 + k * 13.6;
    g.save(); g.translate(x, y); g.rotate(-0.62);
    canister(g, 0, -1.2, 2.0);
    g.restore();
  }
}

function chest(g) {
  // popped collar standing round the hood
  const COL = 'M -5.4 -19.4 C -4.2 -21.4 -1.2 -22.0 1.6 -21.8 C 3.6 -21.6 5.0 -20.8 5.6 -19.6 L 4.6 -18.6 C 3.6 -18.2 2.6 -17.4 2.0 -16.6 C 1.0 -17.4 -0.6 -17.9 -2.4 -18.1 C -3.6 -18.3 -4.6 -18.7 -5.4 -19.4 Z';
  cel(g, COL, PAL.coat, { sh: 1.0, hl: 0.45 });
  clip(g, COL, () => {
    fill(g, 'M -5.2 -19.8 C -3.6 -21.4 -0.6 -21.8 1.8 -21.4 C 3.4 -21.0 4.6 -20.4 5.4 -19.4 L 5.4 -18 L -5.4 -18 Z', PAL.coat.d, 0.6);
    stroke(g, 'M 2.0 -16.8 C 1.0 -17.6 -0.6 -18.1 -2.4 -18.3', PAL.coat.k, 0.25);
  });
}

function upper(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.08, 1);
  cel(g, UPPER, t(PAL.coat), { sh: 1.4, hl: 0.45 });
  clip(g, UPPER, () => {
    fill(g, 'M -4 -3 L 4 -3 L 4 1.6 C 1.5 2.2 -1.5 2.2 -4 1.4 Z', t(PAL.coat).d, 0.55);
    stroke(g, curve([[-1.6, 6.4], [-0.2, 7.4], [1.4, 7.6]]), t(PAL.coat).d, 0.28);
  });
  g.restore();
}

const SLEEVE = limb(10.4, [[0, 2.15], [0.5, 2.1], [0.85, 2.3], [1, 2.55]], [[0, 2.1], [0.5, 2.0], [0.85, 2.25], [1, 2.5]], 0.5, 0.25);
function fore(g, ctx) {
  const t = ctx.t;
  cel(g, SLEEVE, t(PAL.coat), { sh: 1.2, hl: 0.4 });
  clip(g, SLEEVE, () => {
    fill(g, 'M -3 9.0 L 3 9.0 L 3 13 L -3 13 Z', t(PAL.coat).d);
    fill(g, 'M -3 9.0 L 3 9.0 L 3 9.5 L -3 9.5 Z', t(PAL.lining).m);
    stroke(g, curve([[-1.6, 3.0], [0.0, 4.0], [1.6, 3.8]]), t(PAL.coat).d, 0.26);
  });
}

function handP(g, ctx) {
  if (!ctx.far && !ctx.rt) {
    // smoke canister held loosely, cap down (board pose; in game the hand holds the weapon)
    g.save(); g.translate(0.4, 2.6); g.rotate(0.1);
    canister(g, 0, 0, 4.2);
    g.restore();
  }
  hand(g, ctx, PAL.glove, PAL.skin, false);
}

function thigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(PAL.pants), { sh: 1.5, hl: 0.4 });
  clip(g, THIGH, () => stroke(g, curve([[-1.6, 10.4], [0.0, 11.2], [1.6, 11.6]]), t(PAL.pants).d, 0.26));
}

function shin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(PAL.pants), { sh: 1.3, hl: 0.35 });
  // tall laced boots up to below the knee
  const TALL = blob([[-2.45, 4.2], [2.25, 3.9], [2.3, 9.0], [2.35, 14.8], [-2.35, 14.9], [-2.6, 9.0]]);
  cel(g, TALL, t(PAL.boot), { sh: 0.8, hl: 0.35 });
  for (let y = 5.2; y < 14; y += 1.3) stroke(g, `M 0.6 ${y} L 2.0 ${y + 0.5} M 2.0 ${y} L 0.6 ${y + 0.5}`, t(PAL.boot).l, 0.18);
  stroke(g, 'M -2.4 4.6 C -0.6 4.2 1.0 4.1 2.2 4.3', t(PAL.boot).l, 0.25);
}

function foot(g, ctx) { boot(g, ctx, PAL.boot, PAL.sole); }

// the face is always covered (see helmets.js)
function head(g) { morrowMask(g, PAL, HOOD); }

export const MORROW = {
  id: 'morrow', name: 'MORROW', role: 'KONTROL', pal: PAL,
  pose: { nUpper: 0.06, nFore: -0.3, nHand: -0.05, fUpper: -0.1, fFore: -0.2, fHand: -0.1, nThigh: 0.12, nShin: 0.02, fThigh: -0.2, fShin: -0.06, head: 0.06 },
  parts: { torso, chest, head, upper, fore, hand: handP, thigh, shin, foot },
};
