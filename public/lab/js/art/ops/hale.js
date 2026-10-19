// WARDEN — defence. Forty-one; the last crew captain of the fire station that
// was closed (docs/KOR_STORY_CINEMATIC.md §9.2, painted per §10.1). He still
// wears the turnout gear: a charcoal coat to mid-thigh with yellow-silver-
// yellow reflective tape round the chest, the sleeves and the hem, closed with
// hooks and dees under a storm flap; the radio in its chest pocket, the lapel
// mic on its coiled cord, a right-angle torch clipped on; the same cloth on the
// legs with black reinforcement at the knees; black rubber fire boots;
// yellow-brown leather gloves over knit wristlets. The white captain's helmet,
// sooted, its black band, the gold face shield down over a grey flash hood.
// The halligan bar hangs on his back. Built on the body standard in body.js.
import { M, tone, mat } from '../style.js';
import {
  cel, fill, stroke, clip, blob, curve, fold,
  UPPER, FORE, THIGH, SHIN, TORSO, PELVIS,
  glove, boot, headShape, neck, korBand, stitch, rivet, grime, scuffs,
  clothFolds,
} from './body.js';

const PAL = {
  coat: mat(tone('#5f615e', '#464845', '#30322f', '#141515'), 'canvas', 0.7),
  reinf: mat(tone('#3d3c3a', '#292826', '#1b1a19', '#0b0b0a'), 'leather', 0.5),
  sand: mat(tone('#cdb88e', '#a8936b', '#7d6b4c', '#3d3424'), 'canvas', 0.5),
  tapeY: tone('#ece079', '#cdb94a', '#98872e', '#4a4114'),
  tapeS: tone('#f1f3f3', '#c6cbce', '#90969b', '#4b4f53'),
  helmet: mat(tone('#f4f1e9', '#d9d4c8', '#a7a194', '#5a554c'), 'paint', 0.45),
  hood: mat(tone('#86847f', '#66645f', '#484642', '#211f1d'), 'knit', 0.6),
  glove: mat(tone('#d2aa69', '#ab8142', '#7b5a2c', '#3b2a12'), 'leather', 0.75),
  boot: mat(tone('#424244', '#2a2a2c', '#1b1b1d', '#0a0a0b'), 'rubber', 0.5),
  sole: mat(M.rubber, 'rubber', 0.6),
  radio: mat(tone('#4c4f54', '#313438', '#212326', '#0c0d0e'), 'rubber', 0.5),
  steel: mat(tone('#b4b8ba', '#8a8f93', '#5f6468', '#282b2e'), 'steel', 0.6),
  band: mat(tone('#403f3d', '#2a2928', '#1c1b1a', '#0b0b0a'), 'canvas', 0.5),
  torch: mat(tone('#f0c84a', '#d1a52a', '#9b7718', '#4c3a0a'), 'paint', 0.5),
  red: mat(tone('#a8463b', '#7d2a22', '#561a15', '#250a08'), 'paint', 0.6),
  skin: mat(M.skinA, 'skin', 0.4),
};
const SOOT = 'rgba(26,22,18,0.6)';

// Reflective tape: yellow, silver, yellow, laid along the curve `y(x)` over [x0, x1].
function tape(g, x0, x1, y, w, t = (c) => c) {
  const ks = [0, 0.25, 0.5, 0.75, 1];
  const band = (a, b) => `M ${ks.map((k) => { const x = x0 + (x1 - x0) * k; return `${x} ${y(x) + a}`; }).join(' L ')} L ${ks.slice().reverse().map((k) => { const x = x0 + (x1 - x0) * k; return `${x} ${y(x) + b}`; }).join(' L ')} Z`;
  fill(g, band(0, w), t(PAL.tapeY).m);
  fill(g, band(w * 0.28, w * 0.72), t(PAL.tapeS).m);
  fill(g, band(w * 0.3, w * 0.42), t(PAL.tapeS).l, 0.8);
  fill(g, band(w * 0.86, w), t(PAL.tapeY).d, 0.8);
  stitch(g, `M ${x0} ${y(x0) + 0.08} L ${x1} ${y(x1) + 0.08}`, t(PAL.tapeY).d, 0.06, 0.6);
  stitch(g, `M ${x0} ${y(x0) + w - 0.08} L ${x1} ${y(x1) + w - 0.08}`, t(PAL.tapeY).d, 0.06, 0.6);
  // the tape gone grey with soot in patches, and a few burnt spots
  for (let x = x0 + 0.8; x < x1 - 0.4; x += 2.3) fill(g, `M ${x} ${y(x) - 0.05} l 0.9 0.02 l -0.1 ${w + 0.1} l -0.9 -0.02 Z`, t(PAL.coat).d, 0.24);
  for (let x = x0 + 1.9; x < x1 - 0.4; x += 4.1) fill(g, `M ${x} ${y(x) + w * 0.5} a 0.22 0.18 0 1 0 0.44 0 a 0.22 0.18 0 1 0 -0.44 0 Z`, t(PAL.coat).k, 0.4);
}

// --- back: the halligan bar on its hook --------------------------------------------
function backFar(g) {
  const S = PAL.steel;
  // carried fork down, the adze and the pick standing over the shoulder
  g.save(); g.translate(-6.4, -16.4); g.rotate(-0.36 + Math.PI);
  cel(g, 'M -0.55 -15.5 L 0.55 -15.5 L 0.55 14.0 L -0.55 14.0 Z', S, { sh: 0.3, hl: 0.25, lw: 0.26 });
  stroke(g, 'M 0.15 -15 L 0.15 13.5', S.l, 0.18, 0.8);
  // the fork (claw), its bevel
  cel(g, 'M -0.7 -15.2 C -1.2 -16.6 -1.4 -18.0 -1.0 -19.4 L -0.4 -19.2 C -0.6 -18.0 -0.3 -16.9 0.1 -16.2 C 0.5 -16.9 0.8 -18.0 0.6 -19.2 L 1.2 -19.4 C 1.6 -18.0 1.3 -16.6 0.7 -15.2 Z', S, { sh: 0.3, hl: 0.25, lw: 0.26 });
  // the adze and the pick, forged, their edges bright where they were ground
  cel(g, 'M -0.7 13.6 L 0.7 13.6 L 0.8 15.0 L 3.4 16.4 L 3.0 17.2 L 0.6 16.2 L -0.6 16.2 L -2.8 17.6 L -3.2 16.9 L -0.8 15.0 Z', S, { sh: 0.4, hl: 0.3, lw: 0.26 });
  stroke(g, 'M 0.9 15.2 L 3.2 16.5', S.l, 0.14, 0.9); stroke(g, 'M -0.9 15.2 L -2.9 17.0', S.l, 0.14, 0.9);
  // the red grip paint, worn through, and a wrap of cloth tape
  cel(g, 'M -0.55 4.0 L 0.55 4.0 L 0.55 9.6 L -0.55 9.6 Z', PAL.red, { sh: 0.2, hl: 0.2, lw: 0.2 });
  for (let y = 4.4; y < 9.4; y += 0.7) stroke(g, `M -0.55 ${y} L 0.55 ${y + 0.3}`, '#4d1a15', 0.16);
  scuffs(g, [[0.1, 5.0, 0.3], [-0.1, 8.2, 0.25]], S.m, 0.8);
  g.restore();
  // the hook it hangs from, riveted to the coat's back
  cel(g, 'M -9.2 -17.8 L -6.8 -18.0 L -6.6 -15.6 L -9.0 -15.4 Z', PAL.radio, { sh: 0.2, hl: 0.15, lw: 0.24 });
  rivet(g, -8.5, -17.2, 0.2, PAL.steel); rivet(g, -7.3, -16.1, 0.2, PAL.steel);
}

// --- torso -------------------------------------------------------------------------
// the turnout coat: boxy, stiff, to the top of the thighs (the skirt goes on in thigh())
const COAT = blob([
  [-2.2, -24.0], [-5.6, -23.5], [-8.7, -21.9], [-9.5, -18.8], [-9.0, -14.8], [-7.9, -10.6], [-7.5, -6.6], [-7.7, -2.4], [-7.7, 0.6],
  [6.6, 0.5], [6.4, -3.2], [6.1, -7.6], [6.6, -12.2], [7.3, -16.2], [6.9, -20.0], [4.6, -22.7], [1.4, -24.1],
]);
const POCKET = 'M 1.4 -20.4 L 5.4 -20.6 L 5.5 -15.4 C 4.2 -15.0 2.8 -15.0 1.5 -15.3 Z';
function torso(g) {
  cel(g, PELVIS, PAL.coat, { sh: 1.1, hl: 0.4 });
  cel(g, TORSO, PAL.hood, { sh: 1.0, hl: 0.3, line: false });
  cel(g, COAT, PAL.coat, { sh: 2.3, hl: 0.6 });
  clothFolds(g, COAT, [[[-8.0, -17.0], [-6.2, -14.4], [-4.6, -11.2]], [[-7.0, -11.6], [-5.0, -9.4], [-2.6, -7.4]], [[-6.8, -4.0], [-4.0, -3.4], [-1.0, -3.8]], [[4.0, -15.0], [3.4, -11.6], [3.6, -8.2]]], PAL.coat);
  clip(g, COAT, () => {
    // the drag-rescue strap's loop showing under the collar at the back
    cel(g, 'M -6.4 -22.6 L -4.4 -23.0 L -4.0 -19.4 L -6.0 -19.0 Z', PAL.band, { sh: 0.3, hl: 0.2, lw: 0.22 });
    // the storm flap down the front, its hook-and-dee closures
    fill(g, 'M 4.2 -22.6 C 4.4 -15 4.3 -7 4.4 0.8 L 6.8 0.8 L 6.8 -22.6 Z', PAL.coat.d, 0.5);
    stroke(g, 'M 4.2 -22.6 C 4.4 -15 4.3 -7 4.4 0.8', PAL.coat.k, 0.32);
    stitch(g, 'M 4.6 -22.6 C 4.8 -15 4.7 -7 4.8 0.8', PAL.coat.l, 0.08, 0.6);
    for (const y of [-11.0, -6.6, -2.2]) { stroke(g, `M 3.6 ${y} a 0.5 0.4 0 1 0 1.0 0`, PAL.steel.d, 0.22); stroke(g, `M 4.4 ${y} l 0.9 0`, PAL.steel.m, 0.26); }
    // the chest band, all the way round
    tape(g, -10, 8, (x) => -13.6 + x * 0.03, 1.5);
    // the hand-warmer pocket, a carabiner on its D-ring
    cel(g, 'M -1.6 -8.4 L 3.4 -8.6 L 3.6 -2.8 C 2.0 -2.4 0.2 -2.4 -1.4 -2.7 Z', PAL.coat, { sh: 0.5, hl: 0.3, lw: 0.26, ao: 0.3 });
    cel(g, 'M -1.8 -8.8 L 3.6 -9.0 L 3.6 -6.8 C 2.0 -6.4 0.0 -6.4 -1.7 -6.7 Z', PAL.coat, { sh: 0.4, hl: 0.25, lw: 0.24 });
    stitch(g, 'M -1.6 -7.2 C 0 -6.9 2 -6.9 3.4 -7.2', PAL.coat.l, 0.08, 0.6);
    stroke(g, 'M -2.4 -8.0 a 0.55 0.75 0 1 0 0.2 1.5', PAL.steel.m, 0.2);
    // seams, folds at the waist, soot gone into the cloth low down
    stroke(g, curve([[-5.6, -21.4], [-6.0, -15.0], [-5.6, -9.0], [-5.8, -1.0]]), PAL.coat.d, 0.34);
    stitch(g, curve([[-5.2, -21.4], [-5.6, -15.0], [-5.2, -9.0], [-5.4, -1.0]]), PAL.coat.l, 0.08, 0.55);
    fold(g, [[-3.6, -10.8], [-0.8, -10.0], [2.0, -10.2]], PAL.coat);
    grime(g, -8, 1.5, SOOT);
  });
  // the radio pocket on the chest with the radio in it
  cel(g, 'M 2.1 -22.6 L 4.5 -22.6 L 4.5 -19.6 L 2.1 -19.6 Z', PAL.radio, { sh: 0.3, hl: 0.2, lw: 0.26 });
  stroke(g, 'M 2.7 -22.6 L 2.5 -25.6', PAL.radio.k, 0.42);
  fill(g, 'M 2.15 -25.9 a 0.36 0.36 0 1 0 0.72 0 a 0.36 0.36 0 1 0 -0.72 0 Z', PAL.radio.m);
  fill(g, 'M 3.7 -22.25 a 0.24 0.24 0 1 0 0.48 0 a 0.24 0.24 0 1 0 -0.48 0 Z', '#ff5a3a');
  cel(g, 'M 3.3 -22.9 L 4.1 -22.9 L 4.1 -22.5 L 3.3 -22.5 Z', PAL.radio, { sh: 0.1, hl: 0.1, lw: 0.14 });
  cel(g, POCKET, PAL.coat, { sh: 0.6, hl: 0.3, lw: 0.28 });
  clip(g, POCKET, () => { stroke(g, 'M 1.4 -19.6 L 5.5 -19.8', PAL.coat.k, 0.26); stitch(g, 'M 1.6 -19.3 L 5.3 -19.5', PAL.coat.l, 0.07, 0.6); grime(g, -19, -15, SOOT); });
  // the right-angle torch clipped to the pocket, its lens lit
  cel(g, 'M -0.4 -18.6 L 1.6 -18.6 L 1.6 -14.2 L -0.4 -14.2 Z', PAL.torch, { sh: 0.4, hl: 0.25, lw: 0.24 });
  cel(g, 'M 1.6 -18.2 L 2.6 -18.0 L 2.6 -16.2 L 1.6 -16.0 Z', PAL.radio, { sh: 0.2, hl: 0.15, lw: 0.22 });
  fill(g, 'M 2.45 -17.9 L 2.85 -17.8 L 2.85 -16.4 L 2.45 -16.3 Z', '#fff2cf');
  rivet(g, 0.6, -15.0, 0.22, PAL.steel);
}

function chest(g) {
  // the coat's collar turned up round the hood, the sand lining showing, its throat tab
  const COLLAR = blob([[-3.8, -22.6], [-3.6, -25.8], [-0.8, -26.6], [2.6, -26.4], [4.4, -25.4], [4.6, -22.6], [2.4, -21.8], [-1.2, -21.9]]);
  cel(g, COLLAR, PAL.coat, { sh: 0.8, hl: 0.4 });
  clip(g, COLLAR, () => {
    stroke(g, curve([[-3.6, -23.4], [0.4, -24.0], [4.5, -23.4]]), PAL.coat.d, 0.3);
    cel(g, 'M -4 -25.2 C 0 -26.0 2.6 -25.9 5 -25.0 L 5 -27 L -4 -27 Z', PAL.sand, { sh: 0.2, hl: 0.2, line: false, ao: 0.2 });
  });
  cel(g, 'M 1.6 -25.2 L 5.0 -25.4 L 5.1 -23.6 L 1.7 -23.4 Z', PAL.coat, { sh: 0.3, hl: 0.2, lw: 0.26 });
  stitch(g, 'M 1.8 -24.9 L 4.9 -25.1', PAL.coat.l, 0.07, 0.6);
  // the lapel mic clipped to the collar, its coiled cord to the radio
  cel(g, 'M 4.4 -24.0 L 5.6 -24.1 L 5.7 -22.4 L 4.5 -22.3 Z', PAL.radio, { sh: 0.2, hl: 0.2, lw: 0.24 });
  for (let i = 0; i < 4; i++) fill(g, `M ${5.0 - i * 0.05} ${-24.0 + i * 0.35} l 0.5 0 l 0 0.15 l -0.5 0 Z`, PAL.radio.d);
  stroke(g, 'M 4.9 -22.3 C 4.6 -21.4 4.0 -21.6 3.8 -20.8 C 3.6 -20.0 4.2 -20.0 3.9 -19.4', PAL.radio.k, 0.22);
}

// --- arms -------------------------------------------------------------------------
function upper(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.14, 1); cel(g, UPPER, t(PAL.coat), { sh: 1.7, hl: 0.5 }); g.restore();
  clothFolds(g, UPPER, [[[-2.0, 6.0], [-0.4, 6.8], [1.8, 6.4]], [[-1.8, 10.4], [0.0, 11.0], [1.8, 10.6]]], t(PAL.coat));
  clip(g, UPPER, () => {
    stroke(g, curve([[-2.6, -1.0], [-2.8, 4.0], [-2.4, 10.0]]), t(PAL.coat).d, 0.3);
    stitch(g, curve([[-2.2, -1.0], [-2.4, 4.0], [-2.0, 10.0]]), t(PAL.coat).l, 0.08, 0.55);
    tape(g, -4, 4, (x) => 7.8 - x * 0.04, 1.4, t);
    fold(g, [[-1.6, 10.2], [0.0, 10.9], [1.6, 10.8]], t(PAL.coat), 0.26);
  });
  if (!ctx.far) korBand(g, t(PAL.band));
}
function fore(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.12, 1); cel(g, FORE, t(PAL.coat), { sh: 1.5, hl: 0.45 }); g.restore();
  // the black reinforcement over the elbow
  const EP = blob([[-2.6, -1.0], [0.6, -1.4], [1.2, 1.0], [0.2, 3.0], [-2.4, 3.0], [-2.9, 0.8]]);
  cel(g, EP, t(PAL.reinf), { sh: 0.4, hl: 0.25, lw: 0.24 });
  clip(g, EP, () => stitch(g, blob([[-2.3, -0.6], [0.4, -1.0], [0.9, 1.0], [0.0, 2.6], [-2.1, 2.6], [-2.5, 0.8]]), t(PAL.reinf).l, 0.08, 0.7));
  clip(g, FORE, () => { tape(g, -4, 4, (x) => 4.6 - x * 0.03, 1.35, t); grime(g, 6, 11, SOOT); });
  // the knit wristlet showing under the cuff, then the glove's gauntlet
  cel(g, blob([[-1.9, 8.2], [1.8, 8.0], [1.9, 9.6], [-1.9, 9.8]]), t(PAL.hood), { sh: 0.3, hl: 0.2, lw: 0.24 });
  const GAUNT = blob([[-2.7, 8.6], [2.6, 8.4], [2.9, 10.6], [2.2, 11.4], [-2.2, 11.6], [-3.0, 10.8]]);
  cel(g, GAUNT, t(PAL.glove), { sh: 0.6, hl: 0.35 });
  clip(g, GAUNT, () => { stitch(g, 'M -2.8 9.3 C -0.8 9.0 1.0 8.9 2.8 9.1', t(PAL.glove).d, 0.1); fill(g, 'M -3 10.0 L 3 9.8 L 3 10.5 L -3 10.7 Z', t(PAL.tapeS).m, 0.85); grime(g, 9, 12, SOOT); });
}
function hand(g, ctx) {
  glove(g, ctx, PAL.glove, { knuckle: PAL.glove });
  // the glove's leather gone black over the knuckles
  clip(g, 'M -2 2.2 L 2.2 2.0 L 2.2 4.4 L -2 4.6 Z', () => grime(g, 1.5, 4.5, SOOT));
}

// --- legs: the coat's skirt rides on each thigh so it swings with the legs ---------------------
const SKIRT = blob([[-5.6, -1.6], [3.4, -1.8], [4.1, 3.2], [4.4, 9.4], [0.4, 10.0], [-4.8, 9.8], [-6.2, 9.2], [-6.0, 3.6]]);
function thigh(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.1, 1); cel(g, THIGH, t(PAL.coat), { sh: 1.7, hl: 0.45 }); g.restore();
  // trousers bunched behind the knee, pulled across the thigh from the hip
  clothFolds(g, THIGH, [[[-3.0, 11.0], [-1.0, 11.8], [1.6, 11.4]], [[-2.8, 2.8], [-1.2, 3.4], [-0.2, 4.6]], [[1.4, 7.0], [2.4, 8.2]]], t(PAL.coat));
  clip(g, THIGH, () => {
    stroke(g, curve([[2.4, 9.0], [2.2, 12.0], [1.9, 15.0]]), t(PAL.coat).k, 0.24, 0.7);
    // the bellows cargo pocket on the trouser below the coat
    cel(g, 'M -2.4 10.2 L 1.8 10.0 L 1.9 14.4 C 0.6 14.8 -1.0 14.8 -2.3 14.5 Z', t(PAL.coat), { sh: 0.4, hl: 0.25, lw: 0.24, ao: 0.3 });
    tape(g, -3, 3, () => 12.6, 0.8, t);
    fold(g, [[-2.0, 15.0], [0.0, 15.6], [2.0, 15.4]], t(PAL.coat));
    grime(g, 9, 17, SOOT);
  });
  cel(g, SKIRT, t(PAL.coat), { sh: 1.5, hl: 0.5 });
  clip(g, SKIRT, () => {
    tape(g, -7, 5, (x) => 6.9 - x * 0.04, 1.5, t);
    // the hand pocket and its flap, the coat's bound hem
    cel(g, 'M -1.4 0.8 L 2.6 0.6 L 2.8 5.8 L -1.2 6.0 Z', t(PAL.coat), { sh: 0.4, hl: 0.25, lw: 0.26 });
    cel(g, 'M -1.6 0.4 L 2.8 0.2 L 2.8 2.2 L -1.5 2.4 Z', t(PAL.coat), { sh: 0.3, hl: 0.2, lw: 0.26 });
    stitch(g, 'M -1.4 2.0 L 2.6 1.8', t(PAL.coat).l, 0.07, 0.6);
    cel(g, 'M -6.4 8.8 C -2 9.4 1.6 9.4 4.6 9.0 L 4.6 10.4 L -6.4 10.4 Z', t(PAL.reinf), { sh: 0.2, hl: 0.15, line: false, ao: 0.2 });
    fold(g, [[-3.6, 0.0], [-4.0, 4.0], [-4.4, 8.4]], t(PAL.coat), 0.3);
    grime(g, 3, 10.4, SOOT);
  });
}
function shin(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.1, 1); cel(g, SHIN, t(PAL.coat), { sh: 1.4, hl: 0.4 }); g.restore();
  // the knee reinforcement and its tape
  const KR = blob([[-1.6, -2.6], [2.6, -2.8], [3.0, 2.2], [0.6, 3.2], [-1.6, 2.4]]);
  cel(g, KR, t(PAL.reinf), { sh: 0.5, hl: 0.3, lw: 0.24 });
  clip(g, KR, () => { stitch(g, blob([[-1.2, -2.2], [2.2, -2.4], [2.6, 1.9], [0.6, 2.8], [-1.2, 2.1]]), t(PAL.reinf).l, 0.08, 0.7); scuffs(g, [[1.4, -0.4, 0.6, 0.3]], t(PAL.reinf).l, 0.5); });
  clip(g, SHIN, () => tape(g, -4, 4, () => 0.4, 1.0, t));
  // the rubber fire boot, nearly to the knee, its pull loops and the shin guard
  const TALL = blob([[-2.8, 3.6], [2.7, 3.3], [2.7, 9.0], [2.7, 15.0], [-2.7, 15.1], [-3.0, 9.0]]);
  cel(g, TALL, t(PAL.boot), { sh: 1.0, hl: 0.5 });
  clip(g, TALL, () => {
    fill(g, 'M -3 3.4 L 3 3.1 L 3 4.4 L -3 4.7 Z', t(PAL.boot).k, 0.6);
    cel(g, 'M 0.6 4.8 C 1.8 4.6 2.6 4.8 2.8 5.4 L 2.8 12.0 C 2.0 12.4 1.2 12.4 0.6 12.0 Z', t(PAL.boot), { sh: 0.3, hl: 0.3, lw: 0.2, ao: 0.2 });
    stroke(g, curve([[1.6, 4.6], [1.9, 9.0], [1.8, 14.0]]), t(PAL.boot).l, 0.24, 0.6);
    stroke(g, 'M -2.8 12.4 C -1 12.2 1 12.1 2.8 12.2', t(PAL.boot).k, 0.24);
    scuffs(g, [[-1.2, 8.0, 0.5, 0.3], [0.4, 13.6, 0.4]], '#7a7a7a', 0.35);
    grime(g, 9, 16, 'rgba(70,60,50,0.4)');
  });
  for (const x of [-2.4, 1.6]) stroke(g, `M ${x} 3.9 c 0.1 -1.1 0.7 -1.1 0.8 0`, t(PAL.boot).m, 0.32);
}
function foot(g, ctx) { boot(g, ctx, PAL.boot, PAL.sole, { toe: PAL.boot }); }

// --- head: the grey hood, the captain's helmet, the gold shield ------------------------------
const SHELL = 'M -4.7 -3.4 C -5.5 -6.0 -5.3 -9.6 -3.1 -11.5 C -1.0 -13.0 2.5 -13.0 4.5 -11.3 C 5.7 -10.3 6.1 -9.3 6.0 -8.5 C 4.5 -8.9 2.7 -9.0 1.2 -8.7 C 0.6 -7.1 0.4 -5.5 0.6 -4.1 C -0.7 -3.5 -2.7 -3.1 -4.7 -3.4 Z';
const SHIELD = 'M 1.4 -8.95 C 3.4 -9.25 5.4 -8.95 6.15 -7.95 C 6.65 -6.45 6.55 -4.25 5.95 -2.95 C 5.25 -1.85 3.65 -1.45 2.25 -1.85 C 1.65 -3.45 1.35 -6.05 1.4 -8.95 Z';
function head(g) {
  const H = PAL.helmet, F = PAL.hood;
  // the flash hood over the neck and head; the face under it, mostly behind the shield
  neck(g, F, { wide: 0.35, sh: 1.0 });
  const HD = headShape({ jaw: 1 });
  cel(g, HD, F, { sh: 1.0, hl: 0.3 });
  clip(g, HD, () => { cel(g, 'M 1.2 -8.2 C 3 -8.4 4.6 -8.0 5.4 -7.0 L 5.4 -1.4 L 1.2 -1.4 Z', PAL.skin, { sh: 0.6, hl: 0.2, line: false }); });
  stroke(g, 'M 1.3 -8.6 C 0.9 -6.4 0.9 -3.8 1.6 -1.6', F.k, 0.3);
  // the chin strap from under the shell to the jaw
  stroke(g, 'M 0.4 -4.4 C 0.9 -3.4 1.6 -2.4 2.4 -1.8', PAL.band.k, 0.32);
  // the shell
  cel(g, SHELL, H, { sh: 1.6, hl: 0.6 });
  clip(g, SHELL, () => {
    // the black captain's band round the shell, its reflective edge
    fill(g, 'M -6 -6.6 C -3.6 -9.0 0.4 -10.2 6.4 -9.9 L 6.4 -9.0 C 0.6 -9.3 -3.4 -8.2 -6 -5.6 Z', PAL.band.m);
    stroke(g, 'M -6 -6.1 C -3.6 -8.5 0.5 -9.7 6.4 -9.45', PAL.tapeS.d, 0.12, 0.8);
    // soot: heaviest low and at the back, streaks from the crown
    const sg = g.createLinearGradient(-5, -5, 3, -12); sg.addColorStop(0, 'rgba(30,26,22,0.6)'); sg.addColorStop(0.5, 'rgba(30,26,22,0.14)'); sg.addColorStop(1, 'rgba(30,26,22,0)');
    g.fillStyle = sg; g.fill(new Path2D(SHELL));
    for (const [x, w] of [[-2.6, 0.5], [-0.6, 0.35], [1.8, 0.45]]) fill(g, `M ${x} -12.6 L ${x + w} -12.6 L ${x + w * 0.6} -9.8 L ${x + 0.1} -9.9 Z`, 'rgba(40,34,28,0.24)');
    // the gloss: a long highlight along the crown, a scuff, the station number decal
    stroke(g, curve([[-3.6, -11.0], [-0.6, -12.7], [3.4, -12.2], [5.4, -10.2]]), H.l, 0.45, 0.9);
    stroke(g, curve([[-2.8, -10.8], [0.0, -12.0], [3.0, -11.6]]), '#ffffff', 0.18, 0.7);
    stroke(g, 'M -1.4 -7.4 l 1.4 -0.5', H.k, 0.16, 0.6);
    g.save(); g.translate(-2.6, -7.6); g.rotate(-0.35); fill(g, 'M -0.9 -0.5 L 0.9 -0.5 L 0.9 0.5 L -0.9 0.5 Z', PAL.red.m, 0.9); fill(g, 'M -0.5 -0.25 L -0.2 -0.25 L -0.2 0.25 L -0.5 0.25 Z M 0.1 -0.25 L 0.5 -0.25 L 0.5 0.25 L 0.1 0.25 Z', '#efe6d2', 0.9); g.restore();
  });
  // the gold face shield, down
  const gr = g.createLinearGradient(2, -9.2, 4.6, -1.6);
  gr.addColorStop(0, '#4a3410'); gr.addColorStop(0.3, '#b98a2c'); gr.addColorStop(0.42, '#f4d27a'); gr.addColorStop(0.55, '#a77922'); gr.addColorStop(1, '#3e2a0c');
  g.fillStyle = gr; g.fill(new Path2D(SHIELD));
  clip(g, SHIELD, () => {
    // what it reflects: a hot window low on the glass, the street darker above
    fill(g, 'M 3.2 -3.6 C 4.0 -3.8 4.8 -3.6 5.6 -3.2 L 5.4 -2.6 C 4.6 -2.9 3.8 -3.0 3.2 -2.9 Z', '#ffcf86', 0.45);
    stroke(g, curve([[1.8, -7.6], [3.6, -8.1], [5.6, -7.6]]), '#fff1c4', 0.22, 0.5);
    stroke(g, 'M 1.6 -8.5 C 1.5 -6 1.8 -3.6 2.4 -2.0', '#2a1c06', 0.4, 0.7);
    // fine scratches in the gold film
    for (const [x, y] of [[3.0, -6.0], [4.2, -5.0], [2.6, -4.2]]) stroke(g, `M ${x} ${y} l 0.9 -0.25`, '#fff0c0', 0.05, 0.6);
  });
  stroke(g, SHIELD, '#2a1d08', 0.3);
  // the shield's pivot on the side of the shell, and the helmet torch on its rail
  cel(g, 'M 0.5 -8.5 a 0.7 0.7 0 1 0 1.4 0 a 0.7 0.7 0 1 0 -1.4 0 Z', PAL.radio, { sh: 0.2, hl: 0.2, lw: 0.24 });
  rivet(g, 1.2, -8.5, 0.28, PAL.steel);
  cel(g, 'M -2.6 -9.2 L 1.2 -10.0 L 1.4 -8.9 L -2.4 -8.2 Z', PAL.radio, { sh: 0.3, hl: 0.2, lw: 0.24 });
  fill(g, 'M 1.05 -9.95 L 1.45 -10.0 L 1.6 -8.95 L 1.2 -8.9 Z', '#fff4d8');
}

export const HALE = {
  id: 'hale', name: 'WARDEN', role: 'SAVUNMA', pal: PAL,
  pose: { nUpper: 0.2, nFore: -2.25, nHand: -0.3, fUpper: -0.08, fFore: -0.16, fHand: -0.1, nThigh: 0.22, nShin: 0.05, fThigh: -0.22, fShin: -0.05, head: 0.02 },
  parts: { backFar, torso, chest, head, upper, fore, hand, thigh, shin, foot },
};
