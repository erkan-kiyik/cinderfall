// BRICK — heavy. A wall that walks. Signature shapes: the oversized layered
// pauldron with hazard stripes, rust plate over a dark undersuit, armoured
// gauntlets, and a buzz-cut head sunk into a high armoured gorget.
import { cel, fill, stroke, clip, blob, curve } from '../kit.js';
import { M, tone } from '../style.js';
import { UPPER, FORE, THIGH, SHIN, hand, boot, face, neck, HEAD } from './common.js';

const PAL = {
  skin: tone('#f2b994', '#d48e68', '#a6623f', '#5e3020'),
  plate: tone('#e47a58', '#b5452e', '#82301f', '#3e150c'),
  steel: M.gunmetal,
  suit: M.charcoal,
  hazard: tone('#ffe08a', '#ffc93c', '#c99512', '#5e430a'),
  hair: tone('#d8b27a', '#a98454', '#7a5c36', '#3e2c16'),
  glove: M.black,
  boot: M.gunmetal,
  sole: M.rubber,
};

// Hazard stripes clipped to a shape.
function stripes(g, d, x0, x1, y0, y1, w = 1.1) {
  clip(g, d, () => {
    fill(g, `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`, PAL.hazard.m);
    for (let x = x0 - (y1 - y0); x < x1; x += w * 2) fill(g, `M ${x} ${y1} L ${x + w} ${y1} L ${x + w + (y1 - y0)} ${y0} L ${x + (y1 - y0)} ${y0} Z`, '#1a1c20');
  });
}

const SUIT = blob([[-8.4, -18.6], [-5.0, -21.0], [0.6, -21.6], [4.4, -21.0], [6.8, -19.0], [7.6, -15.0], [7.2, -10.0], [6.4, -5.0], [6.4, -2.0], [-6.4, -1.8], [-7.2, -6.0], [-8.2, -12.0]]);
const CHEST = blob([[-6.4, -19.4], [0.6, -20.6], [6.2, -19.6], [8.2, -15.6], [7.8, -10.6], [5.8, -9.2], [-1.0, -9.0], [-6.6, -9.8], [-7.6, -14.0]]);
const PELVIS = blob([[-6.2, -4.4], [6.2, -4.5], [6.4, -1.0], [4.2, 1.6], [0.4, 2.2], [-4.0, 1.6], [-6.4, -1.0]]);

function backFar(g) {
  // far pauldron peeking over the far shoulder
  const FP = blob([[2.4, -22.4], [6.6, -23.4], [9.6, -21.0], [9.8, -17.4], [6.2, -17.0], [3.0, -18.6]]);
  cel(g, FP, PAL.plate, { sh: 0.9, hl: 0.4 });
}

function torso(g) {
  cel(g, PELVIS, PAL.suit, { sh: 1.0, hl: 0.4 });
  cel(g, SUIT, PAL.suit, { sh: 1.8, hl: 0.5 });
  // segmented abdominal plates
  for (let i = 0; i < 3; i++) {
    const y = -9.4 + i * 1.9;
    const d = `M ${-5.6 + i * 0.2} ${y} C -1 ${y - 0.5} 3 ${y - 0.5} ${6.6 - i * 0.1} ${y} L ${6.4 - i * 0.1} ${y + 1.7} C 3 ${y + 1.3} -1 ${y + 1.3} ${-5.4 + i * 0.2} ${y + 1.7} Z`;
    cel(g, d, PAL.steel, { sh: 0.5, hl: 0.3 });
  }
  // heavy belt with a plate buckle
  cel(g, 'M -6.6 -3.8 C -1 -4.2 2.5 -4.2 6.6 -3.9 L 6.6 -1.6 C 2.5 -1.9 -1 -1.9 -6.6 -1.5 Z', PAL.suit, { sh: 0.4, hl: 0.25 });
  cel(g, 'M 2.2 -4.4 L 5.2 -4.5 L 5.2 -1.2 L 2.2 -1.1 Z', PAL.plate, { sh: 0.4, hl: 0.3 });
  stripes(g, 'M 2.6 -3.9 L 4.8 -4.0 L 4.8 -1.7 L 2.6 -1.6 Z', 2.4, 5, -4.2, -1.4, 0.55);
  // big chest plate
  cel(g, CHEST, PAL.plate, { sh: 2.0, hl: 0.6 });
  clip(g, CHEST, () => {
    stroke(g, curve([[1.6, -20.4], [2.0, -15.0], [1.8, -9.4]]), PAL.plate.d, 0.34);
    stroke(g, curve([[2.0, -20.2], [2.4, -15.0], [2.2, -9.6]]), PAL.plate.l, 0.2, 0.8);
    fill(g, 'M -8 -11.4 C -2 -10.6 3 -10.6 9 -11.6 L 9 -8 L -8 -8 Z', PAL.plate.d);
    // rivets
    for (const [x, y] of [[-4.8, -17.8], [5.2, -18.0], [-5.2, -12.4], [6.2, -12.6]]) {
      fill(g, `M ${x - 0.35} ${y} a 0.35 0.35 0 1 0 0.7 0 a 0.35 0.35 0 1 0 -0.7 0 Z`, PAL.steel.m);
      fill(g, `M ${x - 0.15} ${y - 0.12} a 0.12 0.12 0 1 0 0.24 0 a 0.12 0.12 0 1 0 -0.24 0 Z`, PAL.steel.l);
    }
  });
  // stencilled unit mark
  fill(g, 'M 4.0 -16.6 L 6.6 -16.8 L 6.6 -14.4 L 4.0 -14.2 Z', PAL.plate.d);
  stroke(g, 'M 4.6 -14.8 L 5.3 -16.2 L 6.0 -14.8', PAL.hazard.m, 0.3);
}

function chest(g) {
  // high gorget up round the jaw
  const GOR = 'M -5.8 -19.6 C -5.4 -22.6 -2.4 -24.4 1.0 -24.2 C 4.0 -24.0 5.8 -22.6 6.2 -20.4 L 5.4 -19.0 C 3.2 -18.4 -1.8 -18.2 -5.8 -19.6 Z';
  cel(g, GOR, PAL.steel, { sh: 1.0, hl: 0.45 });
  clip(g, GOR, () => {
    stroke(g, curve([[-5.0, -21.0], [0.4, -22.2], [5.6, -21.0]]), PAL.steel.k, 0.3);
    stroke(g, curve([[-5.0, -20.6], [0.4, -21.8], [5.6, -20.6]]), PAL.steel.l, 0.2, 0.7);
  });
}

function upper(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.4, 1);
  cel(g, UPPER, t(PAL.suit), { sh: 1.4, hl: 0.45 });
  g.restore();
  if (!ctx.far) {
    // the big layered pauldron: three plates, the top one striped
    const P3 = blob([[-5.4, 2.6], [0, 1.6], [5.2, 2.8], [5.0, 7.4], [-4.8, 7.6]]);
    const P2 = blob([[-5.8, -0.6], [0, -1.8], [5.8, -0.4], [5.6, 4.6], [-5.4, 4.8]]);
    const P1 = blob([[-6.0, -3.8], [-2.0, -5.6], [3.0, -5.6], [6.4, -3.4], [6.2, 1.6], [-5.8, 1.8]]);
    cel(g, P3, PAL.plate, { sh: 0.8, hl: 0.35 });
    cel(g, P2, PAL.plate, { sh: 0.8, hl: 0.35 });
    cel(g, P1, PAL.plate, { sh: 1.0, hl: 0.5 });
    stripes(g, P1, -7, 7, -6, -2.6, 1.0);
    clip(g, P1, () => stroke(g, curve([[-6, -2.6], [0, -3.4], [6.4, -2.4]]), PAL.plate.k, 0.3));
  }
}

function fore(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.35, 1);
  cel(g, FORE, t(PAL.suit), { sh: 1.2, hl: 0.4 });
  g.restore();
  // armoured gauntlet from mid-forearm to the wrist
  const GA = blob([[-3.0, 3.0], [2.8, 2.6], [3.2, 6.8], [2.8, 10.6], [-2.6, 10.8], [-3.2, 6.8]]);
  cel(g, GA, t(PAL.plate), { sh: 0.9, hl: 0.45 });
  clip(g, GA, () => {
    fill(g, 'M -4 8.6 L 4 8.4 L 4 11 L -4 11 Z', t(PAL.steel).m);
    stroke(g, curve([[-2.8, 5.6], [0, 5.2], [3.0, 5.6]]), t(PAL.plate).d, 0.3);
  });
}

function handP(g, ctx) {
  g.save(); g.scale(1.2, 1.1);
  hand(g, ctx, PAL.glove, PAL.skin, false);
  g.restore();
  cel(g, 'M -1.7 0.4 L 1.8 0.3 L 1.9 1.6 L -1.6 1.7 Z', ctx.t(PAL.steel), { sh: 0.3, hl: 0.2 });
}

function thigh(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.22, 1);
  cel(g, THIGH, t(PAL.suit), { sh: 1.5, hl: 0.4 });
  g.restore();
  const TP = blob([[-3.4, 1.6], [3.6, 1.2], [4.0, 6.0], [3.4, 10.4], [-3.0, 10.8], [-3.8, 6.0]]);
  cel(g, TP, t(PAL.plate), { sh: 1.0, hl: 0.45 });
  clip(g, TP, () => stroke(g, curve([[-3.6, 6.2], [0, 5.6], [4.0, 6.0]]), t(PAL.plate).d, 0.3));
}

function shin(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.2, 1);
  cel(g, SHIN, t(PAL.suit), { sh: 1.3, hl: 0.35 });
  g.restore();
  // shin guard and a big knee cop
  const SG = blob([[-1.4, 2.6], [3.0, 2.4], [3.2, 9.0], [2.8, 14.6], [-2.6, 14.8], [-2.0, 8.0]]);
  cel(g, SG, t(PAL.steel), { sh: 0.8, hl: 0.4 });
  const KC = blob([[-1.6, -2.4], [2.6, -2.4], [3.8, 0.8], [3.0, 4.2], [0.0, 4.6], [-1.4, 1.4]]);
  cel(g, KC, t(PAL.plate), { sh: 0.6, hl: 0.4 });
  stripes(g, KC, -2, 4, 0.6, 1.8, 0.5);
}

function foot(g, ctx) {
  g.save(); g.scale(1.12, 1.1); g.translate(0, -0.2);
  boot(g, ctx, PAL.boot, PAL.sole);
  g.restore();
  // steel toe cap
  cel(g, 'M 3.4 0.6 C 5.0 0.7 6.8 1.3 7.1 2.0 L 3.6 2.1 Z', ctx.t(PAL.steel), { sh: 0.3, hl: 0.25 });
}

function head(g) {
  g.save(); g.translate(-0.4, 0); g.scale(1.45, 1); neck(g, PAL.skin); g.restore();
  // a slightly wider skull and jaw for the big man
  g.save(); g.scale(1.06, 1.02);
  face(g, { skin: PAL.skin, iris: '#5b7a3c', brow: '#6e5233', lip: '#a4604a', browY: 0.25 });
  // buzz cut: a stubble tint over the cranium
  clip(g, HEAD, () => {
    fill(g, 'M -6 -14 L 6 -14 L 6 -10.4 C 4.4 -10.8 2.6 -10.9 1.0 -10.4 C 0.0 -10.0 -0.6 -9.0 -1.0 -7.8 L -6 -7.8 Z', PAL.hair.m, 0.75);
    fill(g, 'M -6 -14 L 6 -14 L 6 -12.6 C 2 -12.8 -2 -12.2 -6 -11.0 Z', PAL.hair.l, 0.35);
  });
  // scar across the near brow and cheek
  stroke(g, 'M 0.6 -9.4 L 2.2 -6.2', PAL.skin.l, 0.34);
  stroke(g, 'M 0.6 -9.4 L 2.2 -6.2', PAL.skin.k, 0.14);
  // stubble shadow on the jaw
  clip(g, HEAD, () => fill(g, 'M -1.2 -6.4 C 0.2 -5.2 1.6 -4.8 2.8 -4.9 C 3.6 -5.0 4.2 -4.9 5.4 -4.8 L 5.4 -1 L -2 -1 Z', PAL.hair.d, 0.28));
  g.restore();
}

export const BRICK = {
  id: 'brick', name: 'BRICK', role: 'AĞIR', pal: PAL,
  pose: { nUpper: 0.32, nFore: 0.04, nHand: 0.0, fUpper: -0.32, fFore: -0.14, fHand: -0.1, nThigh: 0.24, nShin: 0.04, fThigh: -0.3, fShin: -0.04, head: -0.02 },
  parts: { backFar, torso, chest, head, upper, fore, hand: handP, thigh, shin, foot },
};
