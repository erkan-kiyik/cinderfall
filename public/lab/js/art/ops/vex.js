// VEX — assault. Fast, sharp, forward. Signature shapes: the swept black
// undercut with ember tips, the cropped ember bomber, and the long scarf
// tails that stream behind her even standing still.
import { cel, fill, stroke, clip, blob, curve } from '../kit.js';
import { M, tone } from '../style.js';
import { UPPER, FORE, THIGH, SHIN, BOOT_SHAFT, hand, boot, face, neck, HEAD } from './common.js';

const PAL = {
  skin: M.skinB,
  jacket: tone('#ff9a5c', '#ff6b2c', '#c4441a', '#6e2410'),
  panel: tone('#4a5361', '#353c48', '#232831', '#12151b'),
  pants: tone('#454d5a', '#323843', '#21262e', '#101318'),
  scarf: tone('#e0534a', '#b8322e', '#7e1f1f', '#3f0d0e'),
  hair: tone('#3b3c46', '#22232b', '#15161b', '#08080b'),
  tip: tone('#ffb070', '#ff7a35', '#c4441a', '#6e2410'),
  boot: M.black,
  sole: tone('#fff6e6', '#f2dfbf', '#c9b48f', '#6d5a3b'),
  glove: M.black,
  belt: M.rubber,
  brass: M.brass,
};

const JACKET = blob([[-6.8, -18.6], [-4.2, -20.6], [0.6, -21.3], [3.4, -20.6], [5.0, -19.0], [5.9, -15.4], [6.0, -12.4], [5.3, -9.0], [5.4, -6.4], [0.3, -5.7], [-5.4, -6.1], [-6.3, -10.5], [-7.0, -15.0]]);
const SHIRT = blob([[-4.8, -8.8], [4.6, -8.8], [5.0, -3.4], [-5.0, -3.2]]);
const PELVIS = blob([[-5.2, -4.2], [5.2, -4.3], [5.4, -1.2], [3.6, 1.2], [0.4, 1.8], [-3.4, 1.2], [-5.4, -1.0]]);
const BELT = 'M -5.6 -4.3 C -1 -4.6 2.5 -4.6 5.6 -4.4 L 5.6 -2.6 C 2.5 -2.8 -1 -2.8 -5.6 -2.5 Z';

// Scarf tails stream back from the neck (torso frame, behind the body).
const TAIL_A = blob([[-1.8, -21.4], [-6.5, -21.6], [-12.5, -19.2], [-18.0, -18.6], [-22.6, -15.6], [-20.2, -16.2], [-16.4, -15.8], [-11.4, -16.8], [-6.0, -18.2], [-2.6, -18.4]]);
const TAIL_B = blob([[-2.2, -19.8], [-7.0, -18.8], [-11.6, -15.6], [-15.4, -12.4], [-19.4, -11.0], [-16.4, -10.4], [-12.8, -11.8], [-8.6, -14.6], [-4.0, -16.6]]);

function backFar(g) {
  cel(g, TAIL_B, PAL.scarf, { sh: 0.9, hl: 0.3 });
  clip(g, TAIL_B, () => stroke(g, curve([[-4, -17.6], [-9, -15.6], [-13, -12.8], [-17.2, -11.2]]), PAL.scarf.d, 0.3));
  cel(g, TAIL_A, PAL.scarf, { sh: 0.9, hl: 0.35 });
  clip(g, TAIL_A, () => {
    stroke(g, curve([[-3, -20.0], [-8, -19.6], [-13, -17.9], [-18, -17.0], [-21.4, -15.8]]), PAL.scarf.d, 0.3);
    fill(g, 'M -24 -16.6 L -19.6 -18.4 L -18.8 -15.0 L -24 -14.6 Z', PAL.scarf.k, 0.25);
  });
}

function torso(g) {
  cel(g, PELVIS, PAL.pants, { sh: 1.0, hl: 0.4 });
  cel(g, SHIRT, PAL.panel, { sh: 0.9, hl: 0.3 });
  cel(g, BELT, PAL.belt, { sh: 0.4, hl: 0.2 });
  // belt loops and buckle
  for (const x of [-3.6, 0.2]) fill(g, `M ${x} -4.6 L ${x + 0.6} -4.6 L ${x + 0.6} -2.4 L ${x} -2.4 Z`, PAL.belt.k);
  cel(g, 'M 2.6 -4.7 L 4.6 -4.75 L 4.6 -2.3 L 2.6 -2.3 Z', PAL.brass, { sh: 0.3, hl: 0.25 });
  fill(g, 'M 3.15 -4.15 L 4.05 -4.15 L 4.05 -2.85 L 3.15 -2.85 Z', PAL.belt.m);
  // fly seam and a crease toward each hip
  stroke(g, 'M 3.4 -2.4 C 3.3 -0.6 3.0 1.0 2.2 2.4', PAL.pants.k, 0.26);
  stroke(g, 'M -3.4 -1.6 C -2.0 -0.4 -0.6 0.6 0.2 1.6', PAL.pants.d, 0.25);
  // cropped bomber
  cel(g, JACKET, PAL.jacket, { sh: 1.8, hl: 0.55 });
  clip(g, JACKET, () => {
    // charcoal yoke across the shoulders
    fill(g, 'M -8 -17.2 C -4 -18.0 0 -18.4 3.0 -18.2 C 4.6 -18.0 5.6 -17.6 7 -17.0 L 7 -23 L -8 -23 Z', PAL.panel.m);
    fill(g, 'M -8 -17.2 C -4 -18.0 0 -18.4 3.0 -18.2 C 4.6 -18.0 5.6 -17.6 7 -17.0 L 7 -16.4 C 5.6 -17.0 4.6 -17.4 3.0 -17.6 C 0 -17.8 -4 -17.4 -8 -16.6 Z', PAL.panel.d);
    // ribbed hem band
    fill(g, 'M -8 -7.6 C -2 -7.0 2 -7.0 7 -7.8 L 7 -4 L -8 -4 Z', PAL.panel.m);
    for (let x = -5.0; x < 5.2; x += 0.9) stroke(g, `M ${x} -7.0 L ${x + 0.05} -5.9`, PAL.panel.d, 0.2);
    // sleeve-side seam and the shadow under the chest
    stroke(g, curve([[-4.6, -17.4], [-5.0, -13], [-4.6, -9.6], [-4.4, -7.4]]), PAL.jacket.d, 0.3);
    // zip line down the front, a chest pocket with an ember-lo flap
    stroke(g, curve([[2.6, -19.6], [2.9, -15.0], [2.9, -11.0], [2.7, -7.4]]), PAL.jacket.k, 0.32);
    stroke(g, curve([[3.0, -19.4], [3.3, -15.0], [3.3, -11.0], [3.1, -7.6]]), PAL.jacket.l, 0.18, 0.8);
    // diagonal zip pocket on the near chest
    stroke(g, 'M -3.0 -15.0 L 0.6 -13.2', PAL.jacket.k, 0.34);
    stroke(g, 'M -2.9 -14.6 L 0.5 -12.9', PAL.jacket.l, 0.18, 0.8);
    fill(g, 'M 0.4 -13.5 L 1.1 -13.1 L 0.8 -12.2 L 0.2 -12.5 Z', M.gunmetal.m);
    // sleeve patch: a small ember-on-charcoal emblem on the far chest
    fill(g, 'M 4.0 -14.6 L 5.3 -14.8 L 5.4 -13.2 L 4.1 -13.0 Z', PAL.panel.m);
    fill(g, 'M 4.35 -13.4 L 4.75 -14.5 L 5.1 -13.4 Z', PAL.tip.m);
  });
}

function chest(g) {
  // scarf wrap around the neck, over the collar
  const WRAP = blob([[-3.6, -22.2], [0.4, -23.2], [4.0, -22.6], [4.6, -20.6], [3.4, -18.9], [0.2, -18.6], [-3.4, -19.2], [-4.2, -20.6]]);
  cel(g, WRAP, PAL.scarf, { sh: 0.8, hl: 0.4 });
  clip(g, WRAP, () => {
    stroke(g, curve([[-3.6, -20.4], [-0.4, -21.4], [2.6, -21.2], [4.4, -20.4]]), PAL.scarf.d, 0.3);
    stroke(g, curve([[-3.0, -19.4], [0.4, -20.0], [3.6, -19.6]]), PAL.scarf.d, 0.25);
  });
  // short knot end hanging on the chest
  const END = 'M 1.9 -19.9 L 3.9 -19.8 C 4.5 -18.0 4.9 -16.0 5.0 -13.9 L 4.3 -14.7 L 3.5 -13.7 C 3.0 -15.8 2.4 -17.8 1.9 -19.9 Z';
  cel(g, END, PAL.scarf, { sh: 0.6, hl: 0.3 });
  stroke(g, 'M 3.0 -19.2 C 3.5 -17.6 3.9 -16.2 4.1 -14.8', PAL.scarf.d, 0.24);
}

function upper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL.jacket), { sh: 1.4, hl: 0.45 });
  clip(g, UPPER, () => {
    fill(g, 'M -4 -3 L 4 -3 L 4 2.4 C 1.5 3.0 -1.5 3.0 -4 2.2 Z', t(PAL.panel).m);
    fill(g, 'M -4 2.2 C -1.5 3.0 1.5 3.0 4 2.4 L 4 3.0 C 1.5 3.6 -1.5 3.6 -4 2.8 Z', t(PAL.panel).d);
    stroke(g, curve([[-1.6, 5.4], [-0.6, 6.4], [0.8, 6.8]]), t(PAL.jacket).d, 0.28);
  });
}

function fore(g, ctx) {
  const t = ctx.t;
  cel(g, FORE, t(PAL.jacket), { sh: 1.2, hl: 0.4 });
  clip(g, FORE, () => {
    fill(g, 'M -3 7.8 L 3 7.8 L 3 13 L -3 13 Z', t(PAL.panel).m);
    for (let x = -1.2; x < 1.4; x += 0.6) stroke(g, `M ${x} 8.2 L ${x} 10.2`, t(PAL.panel).d, 0.18);
    stroke(g, curve([[-1.4, 2.6], [0.2, 3.4], [1.6, 3.2]]), t(PAL.jacket).d, 0.26);
  });
}

function handP(g, ctx) { hand(g, ctx, PAL.glove, PAL.skin, true); }

function thigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(PAL.pants), { sh: 1.5, hl: 0.4 });
  clip(g, THIGH, () => {
    stroke(g, curve([[-1.6, 9.8], [0.0, 10.8], [1.6, 11.2]]), t(PAL.pants).d, 0.26);
    stroke(g, curve([[1.8, 1.4], [1.6, 7], [1.3, 15]]), t(PAL.pants).k, 0.22, 0.6);
  });
  if (!ctx.far) {
    // drop-leg holster with a Wren-9 grip showing, strapped around the thigh
    for (const y of [3.6, 8.2]) {
      const strap = `M -3.6 ${y} C -1 ${y - 0.4} 1.6 ${y - 0.4} 3.5 ${y + 0.2} L 3.5 ${y + 1.1} C 1.6 ${y + 0.5} -1 ${y + 0.5} -3.6 ${y + 0.9} Z`;
      cel(g, strap, PAL.belt, { sh: 0.3, hl: 0.15 });
    }
    const HOL = blob([[-2.2, 1.6], [0.8, 1.4], [1.4, 4.0], [1.2, 10.6], [-0.4, 11.4], [-2.0, 10.2], [-2.6, 4.2]]);
    cel(g, HOL, M.charcoal, { sh: 0.6, hl: 0.3 });
    // pistol grip and the back of the slide above the holster mouth
    cel(g, 'M -2.4 -0.4 L 0.2 -0.9 L 1.0 2.6 L -1.6 3.1 Z', M.gunmetal, { sh: 0.45, hl: 0.3 });
    for (const y of [0.5, 1.3, 2.1]) stroke(g, `M ${-1.9 + y * 0.2} ${y} L ${0.4 + y * 0.2} ${y - 0.45}`, M.gunmetal.k, 0.18);
    cel(g, 'M -2.9 1.4 L 1.2 0.8 L 1.4 2.2 L -2.7 2.8 Z', M.black, { sh: 0.3, hl: 0.2 });
    fill(g, 'M -1.3 5.0 L 0.4 4.8 L 0.4 5.5 L -1.3 5.7 Z', PAL.tip.m);
  }
}

function shin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(PAL.pants), { sh: 1.3, hl: 0.35 });
  cel(g, BOOT_SHAFT, t(PAL.boot), { sh: 0.6, hl: 0.3 });
  stroke(g, 'M -2.2 10.4 C -0.6 10.0 1.0 10.0 2.1 10.3', t(PAL.boot).l, 0.22);
  // knee pad with an ember stripe
  const PAD = blob([[-1.0, -1.8], [2.0, -1.6], [3.0, 0.8], [2.6, 3.6], [0.4, 4.0], [-0.6, 1.4]]);
  cel(g, PAD, t(M.black), { sh: 0.5, hl: 0.3 });
  clip(g, PAD, () => fill(g, 'M -2 1.0 L 4 0.6 L 4 1.6 L -2 2.0 Z', t(PAL.tip).m));
}

function foot(g, ctx) { boot(g, ctx, PAL.boot, PAL.sole); }

function head(g) {
  neck(g, PAL.skin);
  face(g, { skin: PAL.skin, iris: '#c77a2a', brow: '#17161b', lip: '#9a5745', browY: 0.05 });
  // undercut: the shaved side reads as a cool stubble tint over the skin
  const SHAVE = 'M -4.3 -7.0 C -4.2 -9.8 -3.0 -11.6 -1.2 -12.0 L -0.4 -10.4 C -1.4 -9.6 -1.9 -8.4 -2.0 -7.0 C -2.6 -6.4 -3.6 -6.2 -4.3 -7.0 Z';
  clip(g, HEAD, () => fill(g, SHAVE, '#3a3036', 0.55));
  // the swept top, falling toward the far brow, ember at the ends
  const HAIR = 'M -3.3 -10.0 C -3.6 -12.0 -2.4 -13.7 -0.3 -14.3 L 1.5 -15.4 L 1.8 -14.4 C 2.8 -14.9 3.8 -15.1 4.9 -14.9 L 4.4 -14.0 C 5.7 -13.7 6.7 -13.0 7.3 -12.0 L 6.0 -11.9 C 6.5 -11.2 6.6 -10.3 6.3 -9.4 C 5.8 -10.2 5.2 -10.6 4.5 -10.7 C 4.4 -10.2 4.2 -9.8 3.9 -9.6 C 3.6 -10.3 3.0 -10.8 2.2 -11.0 C 1.0 -11.2 -0.6 -11.1 -1.6 -10.8 C -2.2 -10.6 -2.8 -10.3 -3.3 -10.0 Z';
  cel(g, HAIR, PAL.hair, { sh: 0.9, hl: 0.45 });
  clip(g, HAIR, () => {
    fill(g, 'M 4.4 -16 L 9 -16 L 9 -8 L 5.0 -8 C 5.2 -10.4 4.6 -12.6 4.4 -16 Z', PAL.tip.m);
    fill(g, 'M 5.6 -12.2 L 9 -12.2 L 9 -8 L 5.6 -8 Z', PAL.tip.d, 0.9);
    stroke(g, curve([[-2.4, -11.6], [0.2, -13.2], [3.2, -13.8], [6.2, -12.6]]), PAL.hair.l, 0.32);
    stroke(g, curve([[-1.6, -10.9], [1.0, -12.0], [3.6, -12.2], [5.6, -10.8]]), PAL.hair.k, 0.26);
    stroke(g, curve([[0.4, -13.8], [2.4, -14.2], [4.2, -13.8]]), PAL.hair.k, 0.22);
  });
  // ember stud
  fill(g, 'M -1.75 -5.35 a 0.32 0.32 0 1 0 0.64 0 a 0.32 0.32 0 1 0 -0.64 0 Z', PAL.tip.l);
}

// Runtime scarf: tails simulated as verlet chains and drawn with this segment
// (4×2 units along +x, centred on y = 0; stretched between chain points).
export function scarfSeg(g) {
  cel(g, 'M 0 -1 L 4 -1 A 1 1 0 0 1 4 1 L 0 1 A 1 1 0 0 1 0 -1 Z', PAL.scarf, { sh: 0.5, hl: 0.25, line: false });
}
export const SCARF = {
  // anchors in the torso frame (back of the neck); length, points, widths
  tails: [
    { ax: -2.2, ay: -21.2, len: 24, n: 8, w0: 3.4, w1: 1.6, g: 200 },
    { ax: -3.0, ay: -19.4, len: 17, n: 6, w0: 2.8, w1: 1.3, g: 520 },
  ],
};

export const VEX = {
  id: 'vex', name: 'VEX', role: 'SALDIRI', pal: PAL,
  pose: { nUpper: 0.62, nFore: -0.95, nHand: -0.5, fUpper: -0.06, fFore: -0.3, fHand: -0.15, nThigh: 0.16, nShin: 0.04, fThigh: -0.24, fShin: -0.08, head: -0.04 },
  parts: { backFar, torso, chest, head, upper, fore, hand: handP, thigh, shin, foot },
};
