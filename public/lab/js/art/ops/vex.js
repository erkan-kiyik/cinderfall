// VEX — assault. Fast, sharp, forward. Signature shapes: the angular
// full-face helmet with a swept ember fin, the blood-red scarf whose tails
// stream behind her, the ember bomber under a slim charcoal chest rig.
// Built on the body standard in body.js.
import { M, tone } from '../style.js';
import {
  cel, fill, stroke, clip, blob, curve, fold,
  UPPER, FORE, THIGH, SHIN, BOOT_SHAFT, TORSO, PELVIS, ELBOW_PAD,
  glove, boot, kneePad, carrier, belt,
} from './body.js';

const PAL = {
  jacket: tone('#ff9d5e', '#ff6b2c', '#c84a1c', '#6e2410'),
  panel: tone('#535c6a', '#3a414d', '#272c35', '#12151b'),
  rig: tone('#4a525e', '#323843', '#222730', '#0e1014'),
  pants: tone('#6c7686', '#505a69', '#38404c', '#181b21'),
  scarf: tone('#d9473f', '#a8262a', '#6f1519', '#330809'),
  tip: tone('#ffb070', '#ff7a35', '#c4441a', '#6e2410'),
  shell: tone('#4f5765', '#333a45', '#22272f', '#0d0f13'),
  boot: tone('#3d424c', '#292d35', '#1b1e24', '#0b0c0f'),
  sole: tone('#fff6e6', '#efdcbc', '#c3ad88', '#6d5a3b'),
  glove: tone('#3a3f49', '#272b33', '#1a1d23', '#0b0c0f'),
  belt: M.rubber,
  brass: M.brass,
  skin: M.skinB,
};

// --- scarf -------------------------------------------------------------------
// Tails streaming back from the neck (torso frame, behind the body). In game
// they are simulated chains (SCARF); this is the still pose for the menus.
const TAIL_A = blob([[-1.6, -23.4], [-6.4, -23.4], [-12.2, -21.2], [-17.6, -20.4], [-22.0, -17.6], [-19.6, -18.2], [-16.0, -18.0], [-11.2, -18.8], [-6.0, -20.2], [-2.4, -20.6]]);
const TAIL_B = blob([[-2.0, -21.8], [-6.6, -20.9], [-11.0, -17.9], [-14.8, -14.9], [-18.6, -13.6], [-15.8, -13.0], [-12.2, -14.3], [-8.2, -17.0], [-3.8, -18.8]]);
function backFar(g) {
  cel(g, TAIL_B, PAL.scarf, { sh: 0.9, hl: 0.3 });
  clip(g, TAIL_B, () => stroke(g, curve([[-4, -19.8], [-8.6, -17.8], [-12.6, -15.0], [-16.6, -13.6]]), PAL.scarf.d, 0.32));
  cel(g, TAIL_A, PAL.scarf, { sh: 0.9, hl: 0.35 });
  clip(g, TAIL_A, () => {
    stroke(g, curve([[-3, -22.0], [-8, -21.6], [-13, -19.9], [-18, -19.0], [-21.0, -17.8]]), PAL.scarf.d, 0.32);
    fill(g, 'M -23 -18.6 L -19.4 -20.4 L -18.6 -17.0 L -23 -16.6 Z', PAL.scarf.k, 0.3);
  });
}

// --- torso -------------------------------------------------------------------
// the bomber: cropped at the belt, ribbed hem, high collar
const JACKET = blob([
  [-2.0, -23.5], [-5.2, -22.9], [-7.9, -21.6], [-8.8, -19.2], [-8.4, -15.6], [-7.0, -11.8], [-6.0, -8.4], [-6.2, -5.6],
  [5.6, -5.8], [5.3, -8.8], [6.0, -12.6], [6.8, -16.4], [6.4, -19.8], [4.1, -22.6], [1.2, -23.8],
]);
function torso(g) {
  cel(g, PELVIS, PAL.pants, { sh: 1.1, hl: 0.4 });
  clip(g, PELVIS, () => {
    stroke(g, 'M 3.6 -3.4 C 3.5 -1.4 3.1 0.4 2.2 1.9', PAL.pants.k, 0.3);
    fold(g, [[-3.8, -2.0], [-2.2, -0.6], [-0.4, 0.8]], PAL.pants, 0.28);
  });
  cel(g, TORSO, PAL.panel, { sh: 1.0, hl: 0.3, line: false });
  cel(g, JACKET, PAL.jacket, { sh: 2.0, hl: 0.6 });
  clip(g, JACKET, () => {
    // charcoal yoke over the shoulders and the back panel
    fill(g, 'M -10 -18.6 C -6 -19.6 -2 -20.2 1.4 -20.2 C 3.4 -20.2 5.0 -19.8 8 -19.0 L 8 -26 L -10 -26 Z', PAL.panel.m);
    fill(g, 'M -10 -18.6 C -6 -19.6 -2 -20.2 1.4 -20.2 C 3.4 -20.2 5.0 -19.8 8 -19.0 L 8 -18.3 C 5.0 -19.1 3.4 -19.5 1.4 -19.5 C -2 -19.5 -6 -18.9 -10 -17.9 Z', PAL.panel.d);
    fill(g, 'M -10 -18 C -9 -14 -8 -10 -7.4 -7 L -10 -7 Z', PAL.panel.m, 0.9);
    // ribbed hem band
    fill(g, 'M -9 -8.4 C -3 -7.8 2 -7.8 8 -8.6 L 8 -4 L -9 -4 Z', PAL.panel.m);
    for (let x = -5.6; x < 5.6; x += 0.85) stroke(g, `M ${x} -7.8 L ${x + 0.05} -6.2`, PAL.panel.d, 0.22);
    // side seam and the fold under the chest
    stroke(g, curve([[-5.0, -18.8], [-5.4, -14.4], [-5.0, -10.4], [-4.8, -8.2]]), PAL.jacket.d, 0.34);
    fold(g, [[-3.2, -11.6], [-0.6, -10.6], [2.0, -10.8]], PAL.jacket);
  });
  carrier(g, { mat: PAL.rig, accent: PAL.tip });
}

function chest(g) {
  // jacket collar standing up behind the scarf wrap
  const COLLAR = blob([[-2.8, -24.9], [1.0, -25.5], [4.0, -24.6], [4.0, -22.8], [0.4, -22.4], [-3.0, -22.8]]);
  cel(g, COLLAR, PAL.jacket, { sh: 0.6, hl: 0.35 });
  // the scarf wrap and its knot end on the chest
  const WRAP = blob([[-3.4, -23.9], [0.4, -24.6], [4.0, -24.1], [4.6, -22.6], [3.4, -21.4], [0.2, -21.1], [-3.2, -21.5], [-4.1, -22.6]]);
  cel(g, WRAP, PAL.scarf, { sh: 0.8, hl: 0.35 });
  clip(g, WRAP, () => stroke(g, curve([[-3.6, -22.4], [-0.4, -23.2], [2.8, -23.0], [4.4, -22.4]]), PAL.scarf.d, 0.3));
  const END = 'M 2.2 -22.2 L 4.0 -22.1 C 4.6 -20.4 4.9 -18.8 5.0 -17.0 L 4.3 -17.6 L 3.5 -16.7 C 3.1 -18.6 2.6 -20.4 2.2 -22.2 Z';
  cel(g, END, PAL.scarf, { sh: 0.5, hl: 0.3, lw: 0.28 });
  belt(g, { belt: PAL.belt, buckle: PAL.brass, pouch: PAL.rig });
}

// --- arms --------------------------------------------------------------------
function upper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL.jacket), { sh: 1.5, hl: 0.5 });
  clip(g, UPPER, () => {
    // charcoal shoulder cap continuing the yoke
    fill(g, 'M -4 -4 L 4 -4 L 4 2.6 C 1.5 3.4 -1.5 3.4 -4 2.4 Z', t(PAL.panel).m);
    fill(g, 'M -4 2.4 C -1.5 3.4 1.5 3.4 4 2.6 L 4 3.3 C 1.5 4.1 -1.5 4.1 -4 3.1 Z', t(PAL.panel).d);
    // ember piping and a fold at the elbow
    stroke(g, curve([[2.6, 3.4], [2.5, 7.0], [2.1, 11.0]]), t(PAL.tip).l, 0.3, 0.8);
    fold(g, [[-1.8, 8.6], [-0.4, 9.6], [1.2, 9.9]], t(PAL.jacket));
  });
}
function fore(g, ctx) {
  const t = ctx.t;
  cel(g, FORE, t(PAL.jacket), { sh: 1.3, hl: 0.45 });
  clip(g, FORE, () => {
    // rolled cuff in the panel colour
    fill(g, 'M -3 7.6 L 3 7.6 L 3 12 L -3 12 Z', t(PAL.panel).m);
    for (let x = -1.4; x < 1.6; x += 0.7) stroke(g, `M ${x} 8.1 L ${x} 10.0`, t(PAL.panel).d, 0.2);
    fold(g, [[-1.6, 3.2], [0.0, 4.0], [1.6, 3.8]], t(PAL.jacket), 0.28);
  });
  cel(g, ELBOW_PAD, t(PAL.rig), { sh: 0.5, hl: 0.3, lw: 0.28 });
}
function hand(g, ctx) { glove(g, ctx, PAL.glove, { knuckle: PAL.rig, cuff: PAL.panel, fingerless: PAL.skin }); }

// --- legs --------------------------------------------------------------------
function thigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(PAL.pants), { sh: 1.6, hl: 0.45 });
  clip(g, THIGH, () => {
    // cargo pocket on the outside of the thigh
    cel(g, 'M -2.2 4.8 L 2.6 4.6 L 2.8 10.6 C 1.0 11.2 -0.8 11.2 -2.4 10.6 Z', t(PAL.pants), { sh: 0.5, hl: 0.25, lw: 0.28 });
    stroke(g, 'M -2.3 6.0 L 2.7 5.8', t(PAL.pants).k, 0.26);
    stroke(g, curve([[2.6, 0.6], [2.4, 7.0], [2.0, 15.0]]), t(PAL.pants).k, 0.22, 0.6);
    fold(g, [[-2.0, 12.4], [0.0, 13.4], [2.0, 13.4]], t(PAL.pants));
  });
  if (!ctx.far) {
    // drop-leg holster with the Wren-9 grip showing, strapped round the thigh
    for (const y of [3.4, 8.6]) cel(g, `M -4.1 ${y} C -1.2 ${y - 0.4} 1.8 ${y - 0.4} 4.0 ${y + 0.2} L 4.0 ${y + 1.2} C 1.8 ${y + 0.6} -1.2 ${y + 0.6} -4.1 ${y + 1.0} Z`, PAL.belt, { sh: 0.3, hl: 0.15, lw: 0.26 });
    const HOL = blob([[-2.4, 1.4], [0.9, 1.2], [1.6, 4.0], [1.4, 11.0], [-0.4, 11.8], [-2.2, 10.6], [-2.8, 4.2]]);
    cel(g, HOL, PAL.rig, { sh: 0.7, hl: 0.3 });
    cel(g, 'M -2.6 -0.6 L 0.2 -1.1 L 1.1 2.6 L -1.7 3.1 Z', M.gunmetal, { sh: 0.45, hl: 0.3, lw: 0.26 });
    for (const y of [0.4, 1.2, 2.0]) stroke(g, `M ${-2.0 + y * 0.2} ${y} L ${0.4 + y * 0.2} ${y - 0.45}`, M.gunmetal.k, 0.2);
    cel(g, 'M -3.1 1.4 L 1.4 0.8 L 1.6 2.3 L -2.9 2.9 Z', PAL.rig, { sh: 0.3, hl: 0.2, lw: 0.26 });
    fill(g, 'M -1.4 5.2 L 0.5 5.0 L 0.5 5.8 L -1.4 6.0 Z', PAL.tip.m);
  }
}
function shin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(PAL.pants), { sh: 1.4, hl: 0.4 });
  clip(g, SHIN, () => fold(g, [[-1.6, 7.0], [0.2, 7.8], [2.0, 7.6]], t(PAL.pants), 0.26));
  cel(g, BOOT_SHAFT, t(PAL.boot), { sh: 0.7, hl: 0.35 });
  clip(g, BOOT_SHAFT, () => { stroke(g, 'M -2.6 10.6 C -0.8 10.2 1.0 10.2 2.5 10.5', t(PAL.boot).l, 0.26); stroke(g, 'M -2.6 12.6 C -0.8 12.2 1.0 12.2 2.6 12.5', t(PAL.boot).k, 0.3); });
  kneePad(g, ctx, PAL.rig, PAL.tip);
}
function foot(g, ctx) { boot(g, ctx, PAL.boot, PAL.sole, { toe: PAL.rig, lace: PAL.tip.m }); }

// --- head ----------------------------------------------------------------------
// Angular full-face assault helmet, head frame (origin at the neck base,
// facing +x). Smaller than the old round helmet: about 9 units tall.
function head(g) {
  const S = PAL.shell;
  // neck under the collar: a dark gaiter
  cel(g, 'M -1.6 1.2 L 2.0 1.0 L 1.9 -2.4 L 0.4 -3.2 L -1.7 -3.6 Z', PAL.panel, { sh: 1.0, hl: 0 });
  // shell with a flared neck guard at the back
  const SHELL = 'M -4.2 -5.6 C -4.6 -8.6 -2.7 -11.3 0.6 -11.4 C 3.6 -11.5 5.3 -9.6 5.4 -7.4 L 5.6 -5.8 L 5.0 -3.4 C 4.4 -2.2 3.4 -1.6 2.2 -1.4 L 0.4 -1.4 C -1.2 -1.6 -2.4 -2.2 -3.2 -2.9 L -4.9 -2.6 C -4.8 -3.6 -4.5 -4.6 -4.2 -5.6 Z';
  cel(g, SHELL, S, { sh: 1.3, hl: 0.5 });
  clip(g, SHELL, () => {
    // ember band along the side, panel seams, a top highlight
    fill(g, 'M -5 -7.0 C -2.6 -7.8 -0.4 -8.2 1.2 -8.3 L 1.2 -7.5 C -0.4 -7.4 -2.6 -7.0 -5 -6.2 Z', PAL.jacket.m);
    stroke(g, curve([[-3.2, -4.2], [-1.2, -3.6], [1.2, -3.3]]), S.k, 0.24);
    stroke(g, curve([[-2.8, -9.6], [-0.4, -10.8], [2.6, -10.8]]), S.l, 0.3, 0.8);
  });
  // jaw guard: a sharp chin plate with vents
  const JAW = 'M 1.6 -4.6 L 5.6 -5.0 L 5.0 -2.9 C 4.4 -1.9 3.4 -1.5 2.2 -1.4 L 1.2 -1.6 Z';
  cel(g, JAW, PAL.panel, { sh: 0.5, hl: 0.3, lw: 0.28 });
  for (const y of [-3.9, -3.2, -2.5]) stroke(g, `M 2.8 ${y} L 4.6 ${y - 0.15}`, PAL.panel.k, 0.24);
  // the visor: a narrow wraparound slit, smoked with an ember glow line
  const VIS = 'M 0.9 -8.4 C 2.8 -8.9 4.8 -8.6 5.7 -7.6 L 5.8 -5.6 C 4.6 -5.2 2.6 -5.0 1.0 -5.4 C 0.6 -6.3 0.6 -7.4 0.9 -8.4 Z';
  fill(g, VIS, '#121419');
  clip(g, VIS, () => {
    const gr = g.createLinearGradient(1, -8.6, 5.8, -5.2);
    gr.addColorStop(0, '#ff7a35aa'); gr.addColorStop(0.5, '#ff7a3522'); gr.addColorStop(1, '#ff7a3566');
    g.fillStyle = gr; g.fill(new Path2D(VIS));
    fill(g, 'M 1.4 -8.6 L 2.6 -8.6 L 1.4 -5.2 L 0.2 -5.2 Z', '#ffffff', 0.2);
    g.save(); g.shadowColor = PAL.tip.l; g.shadowBlur = 5; stroke(g, 'M 1.2 -6.5 C 2.8 -6.7 4.4 -6.6 5.8 -6.3', PAL.tip.l, 0.32); g.restore();
  });
  stroke(g, VIS, S.k, 0.3);
  // swept fin on top
  const FIN = 'M -3.6 -9.2 C -3.0 -11.4 -1.0 -12.9 2.0 -12.8 L 1.4 -11.6 C -0.6 -11.7 -2.2 -10.8 -2.9 -9.2 Z';
  cel(g, FIN, PAL.tip, { sh: 0.35, hl: 0.3, lw: 0.28 });
  fill(g, 'M -4.8 -8.6 L -3.6 -9.4 L -2.9 -8.6 L -3.9 -7.8 Z', PAL.tip.d);
  // vented side plate over the ear, swept back like the fin
  const EAR = 'M -3.6 -7.0 L -0.9 -7.2 C -0.5 -6.2 -0.5 -4.6 -0.9 -3.6 L -3.0 -3.4 C -3.6 -4.4 -3.8 -5.8 -3.6 -7.0 Z';
  cel(g, EAR, PAL.panel, { sh: 0.5, hl: 0.3, lw: 0.28 });
  for (const y of [-6.1, -5.3, -4.5]) stroke(g, `M -3.1 ${y} L -1.2 ${y - 0.1}`, PAL.panel.k, 0.26);
}

// Runtime scarf: tails simulated as verlet chains and drawn with this segment
// (4×2 units along +x, centred on y = 0; stretched between chain points).
export function scarfSeg(g) {
  cel(g, 'M 0 -1 L 4 -1 A 1 1 0 0 1 4 1 L 0 1 A 1 1 0 0 1 0 -1 Z', PAL.scarf, { sh: 0.5, hl: 0.25, line: false });
}
export const SCARF = {
  // anchors in the torso frame (back of the neck); length, points, widths
  tails: [
    { ax: -2.0, ay: -23.2, len: 24, n: 8, w0: 3.4, w1: 1.6, g: 200 },
    { ax: -2.8, ay: -21.4, len: 17, n: 6, w0: 2.8, w1: 1.3, g: 520 },
  ],
};

export const VEX = {
  id: 'vex', name: 'VEX', role: 'SALDIRI', pal: PAL,
  pose: { nUpper: 0.62, nFore: -0.95, nHand: -0.5, fUpper: -0.06, fFore: -0.3, fHand: -0.15, nThigh: 0.18, nShin: 0.04, fThigh: -0.26, fShin: -0.08, head: -0.04 },
  parts: { backFar, torso, chest, head, upper, fore, hand, thigh, shin, foot },
};
