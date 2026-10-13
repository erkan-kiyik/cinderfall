// HALE — defence. Broad, planted, calm; the veteran who holds the line.
// Signature shapes: the shield generator on his back with its antenna, the
// heavy sand plate carrier with a teal emitter bar, the big shoulder plate,
// and the high-cut helmet with the teal goggles
// down over a balaclava and a ballistic half mask. Built on the body standard
// in body.js; no face shows.
import { M, tone } from '../style.js';
import {
  cel, fill, stroke, clip, blob, curve, fold,
  UPPER, FORE, THIGH, SHIN, BOOT_SHAFT, TORSO, PELVIS, ELBOW_PAD,
  glove, boot, kneePad, belt, headShape,
} from './body.js';

const PAL = {
  skin: tone('#a87452', '#8a5a3c', '#6a4129', '#3a2214'),
  shirt: tone('#8d9a66', '#6f7b4d', '#535d37', '#2b311c'),
  pants: tone('#6e7656', '#565d40', '#3f452e', '#20241a'),
  plate: tone('#eadbb3', '#cdb98f', '#a08b64', '#55492f'),
  pouch: tone('#b29f74', '#927f57', '#6c5c3c', '#382f1e'),
  teal: tone('#c4fdff', '#3ee8e0', '#1a9fa0', '#0b4a4a'),
  helmet: tone('#d8c79c', '#b9a577', '#8d7a52', '#4a3f28'),
  boot: tone('#94724f', '#735537', '#523b25', '#2a1d10'),
  sole: M.rubber,
  beard: tone('#5b4e45', '#3d342e', '#2a2420', '#110e0c'),
  pack: tone('#66707e', '#48515e', '#323943', '#16191e'),
  glove: tone('#3a3f49', '#272b33', '#1a1d23', '#0b0c0f'),
  belt: tone('#6e5238', '#553e2a', '#3c2b1d', '#1e150d'),
};

// --- back: the shield generator ---------------------------------------------------
const PACK = 'M -15.0 -24.0 C -15.0 -25.0 -14.4 -25.6 -13.4 -25.6 L -7.0 -25.2 L -6.6 -7.8 L -13.2 -7.4 C -14.2 -7.4 -14.8 -8.0 -14.8 -9.0 Z';
function backFar(g) {
  stroke(g, 'M -12.4 -25.2 L -13.8 -36.0', PAL.pack.k, 0.75);
  stroke(g, 'M -12.4 -25.2 L -13.8 -36.0', PAL.pack.l, 0.32);
  g.save(); g.shadowColor = PAL.teal.m; g.shadowBlur = 5;
  fill(g, 'M -14.6 -36.4 a 0.8 0.8 0 1 0 1.6 0 a 0.8 0.8 0 1 0 -1.6 0 Z', PAL.teal.m); g.restore();
  cel(g, PACK, PAL.pack, { sh: 1.5, hl: 0.5 });
  clip(g, PACK, () => {
    fill(g, 'M -16 -18.4 L -5 -18.0 L -5 -14.0 L -16 -14.4 Z', PAL.plate.m);
    fill(g, 'M -16 -14.4 L -5 -14.0 L -5 -13.3 L -16 -13.7 Z', PAL.plate.d);
    for (let i = 0; i < 4; i++) fill(g, `M -13.6 ${-23.4 + i * 1.15} L -8.6 ${-23.2 + i * 1.15} L -8.6 ${-22.65 + i * 1.15} L -13.6 ${-22.85 + i * 1.15} Z`, PAL.teal.m, 0.9);
    stroke(g, 'M -14.0 -10.8 L -7.2 -10.4', PAL.pack.k, 0.32);
    stroke(g, 'M -13.8 -9.4 L -7.4 -9.0', PAL.pack.l, 0.22);
  });
  const HEX = 'M -17.2 -21.6 L -15.0 -23.2 L -14.4 -15.4 L -14.8 -9.2 L -17.0 -10.6 Z';
  cel(g, HEX, PAL.plate, { sh: 0.6, hl: 0.3 });
  stroke(g, 'M -16.1 -21.4 L -15.8 -10.8', PAL.teal.d, 0.32);
}

// --- torso: shirt, heavy plate carrier ---------------------------------------------
const PLATE = blob([[-4.4, -21.0], [1.2, -21.8], [5.6, -20.8], [7.6, -16.8], [7.4, -9.4], [6.4, -6.2], [-0.6, -5.6], [-5.6, -6.8], [-6.4, -12.6], [-5.8, -18.4]]);
function torso(g) {
  cel(g, PELVIS, PAL.pants, { sh: 1.1, hl: 0.4 });
  clip(g, PELVIS, () => { stroke(g, 'M 3.6 -3.4 C 3.5 -1.4 3.1 0.4 2.2 1.9', PAL.pants.k, 0.3); fold(g, [[-3.8, -2.0], [-2.2, -0.6], [-0.4, 0.8]], PAL.pants, 0.28); });
  cel(g, TORSO, PAL.shirt, { sh: 1.8, hl: 0.5 });
  clip(g, TORSO, () => fold(g, [[-6.8, -14.0], [-6.2, -10.6], [-5.4, -8.2]], PAL.shirt));
  // shoulder straps over the trapezius
  for (const [x0, x1] of [[-5.6, -3.0], [2.2, 4.6]]) cel(g, `M ${x0} -23.2 L ${x1} -23.6 L ${x1 + 0.4} -19.6 L ${x0 + 0.2} -19.2 Z`, PAL.pouch, { sh: 0.4, hl: 0.25, lw: 0.28 });
  cel(g, PLATE, PAL.plate, { sh: 1.7, hl: 0.55 });
  clip(g, PLATE, () => {
    fill(g, 'M -9 -15 C -7 -12.6 -6 -9.6 -5.8 -5 L -9 -5 Z', PAL.pouch.d);
    g.save(); g.shadowColor = PAL.teal.m; g.shadowBlur = 6;
    fill(g, 'M -1.4 -18.2 L 6.0 -18.6 L 6.0 -17.3 L -1.4 -17.0 Z', PAL.teal.m); g.restore();
    fill(g, 'M -1.0 -18.05 L 5.6 -18.4 L 5.6 -17.95 L -1.0 -17.6 Z', PAL.teal.l);
    stroke(g, curve([[-4.6, -14.6], [0.6, -14.9], [7.0, -14.6]]), PAL.plate.d, 0.3);
    stroke(g, curve([[-4.8, -20.2], [-5.2, -16.0], [-5.0, -14.8]]), PAL.plate.d, 0.28);
    stroke(g, curve([[-3.6, -20.6], [1.2, -21.2], [5.0, -20.4]]), PAL.plate.l, 0.3, 0.8);
  });
  for (const x of [-3.4, -0.8, 1.8, 4.4]) {
    cel(g, `M ${x} -12.8 L ${x + 2.3} -12.9 L ${x + 2.4} -7.6 C ${x + 1.6} -7.3 ${x + 0.8} -7.3 ${x + 0.1} -7.5 Z`, PAL.pouch, { sh: 0.5, hl: 0.3, lw: 0.28 });
    cel(g, `M ${x - 0.1} -13.2 L ${x + 2.45} -13.3 L ${x + 2.45} -11.3 C ${x + 1.6} -11.0 ${x + 0.8} -11.0 ${x - 0.05} -11.2 Z`, PAL.pouch, { sh: 0.3, hl: 0.2, lw: 0.26 });
    stroke(g, `M ${x + 0.9} -11.65 L ${x + 1.4} -11.65`, PAL.pouch.l, 0.32);
  }
}
function chest(g) { belt(g, { belt: PAL.belt, buckle: M.gunmetal, pouch: PAL.pouch }); }

// --- arms --------------------------------------------------------------------------
function upper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL.shirt), { sh: 1.5, hl: 0.45 });
  clip(g, UPPER, () => fold(g, [[-1.8, 8.8], [-0.4, 9.7], [1.3, 9.9]], t(PAL.shirt)));
  // the big shoulder plate (near side only; the far one hides behind the pack)
  if (!ctx.far) {
    const PAD = blob([[-3.9, -2.8], [0.0, -3.9], [3.9, -2.6], [4.1, 2.6], [3.0, 5.6], [-3.0, 5.6], [-4.3, 2.2]]);
    cel(g, PAD, PAL.plate, { sh: 1.0, hl: 0.45 });
    clip(g, PAD, () => {
      stroke(g, curve([[-3.7, 2.8], [0, 3.5], [3.8, 2.6]]), PAL.plate.d, 0.32);
      stroke(g, curve([[-2.8, -2.4], [0.2, -3.2], [3.0, -2.2]]), PAL.plate.l, 0.3, 0.8);
      fill(g, 'M -1.5 -0.6 L 1.7 -0.8 L 1.7 0.5 L -1.5 0.7 Z', PAL.teal.m);
    });
  }
}
function fore(g, ctx) {
  const t = ctx.t;
  cel(g, FORE, t(PAL.shirt), { sh: 1.3, hl: 0.4 });
  // sleeve rolled to mid forearm, skin below
  clip(g, FORE, () => {
    cel(g, 'M -3 8.4 L 3 8.0 L 3 12 L -3 12 Z', t(PAL.skin), { sh: 0.7, hl: 0.25, line: false });
    cel(g, 'M -3 6.6 L 3 6.2 L 3 8.4 L -3 8.8 Z', t(PAL.shirt), { sh: 0.4, hl: 0.2, lw: 0.26 });
  });
  cel(g, ELBOW_PAD, t(PAL.pouch), { sh: 0.5, hl: 0.3, lw: 0.28 });
}
function hand(g, ctx) { glove(g, ctx, PAL.glove, { knuckle: PAL.pouch }); }

// --- legs ----------------------------------------------------------------------------
function thigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(PAL.pants), { sh: 1.6, hl: 0.45 });
  clip(g, THIGH, () => {
    cel(g, 'M -2.6 4.6 L 2.4 4.4 L 2.6 10.4 C 0.8 11.0 -1.0 11.0 -2.8 10.4 Z', t(PAL.pants), { sh: 0.5, hl: 0.25, lw: 0.28 });
    fill(g, 'M -2.7 4.4 L 2.5 4.2 L 2.55 6.0 L -2.65 6.2 Z', t(PAL.pants).d);
    fold(g, [[-2.0, 12.4], [0.0, 13.4], [2.0, 13.4]], t(PAL.pants));
  });
}
function shin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(PAL.pants), { sh: 1.4, hl: 0.4 });
  clip(g, SHIN, () => fold(g, [[-1.6, 7.0], [0.2, 7.8], [2.0, 7.6]], t(PAL.pants), 0.26));
  cel(g, BOOT_SHAFT, t(PAL.boot), { sh: 0.7, hl: 0.35 });
  for (const y of [10.6, 12.0, 13.4]) stroke(g, `M -0.4 ${y} L 2.2 ${y - 0.3}`, t(PAL.boot).k, 0.28);
  kneePad(g, ctx, PAL.plate, null);
}
function foot(g, ctx) { boot(g, ctx, PAL.boot, PAL.sole, { lace: PAL.boot.k }); }

// --- head: balaclava, ballistic half mask, goggles down, high-cut helmet ---------------
const CLOTH = tone('#5f6650', '#454b3a', '#30352a', '#151712');
function head(g) {
  cel(g, 'M -2.5 1.6 L 2.7 1.4 L 2.6 -2.6 L 0.8 -3.6 L -2.4 -4.2 Z', CLOTH, { sh: 1.2, hl: 0 });
  const BAL = headShape({ jaw: 1 });
  cel(g, BAL, CLOTH, { sh: 1.0, hl: 0.35 });
  clip(g, BAL, () => { for (const [x, y] of [[-2.6, -5.2], [-1.6, -3.8], [-2.8, -7.2]]) stroke(g, `M ${x} ${y} l 0.9 0.2`, CLOTH.d, 0.22); });
  // ballistic half mask over the nose, mouth and chin
  const MASK = 'M 1.6 -5.2 C 3.0 -5.6 4.6 -5.4 5.3 -4.6 L 5.0 -2.8 C 4.6 -1.9 3.6 -1.4 2.4 -1.4 L 1.2 -1.7 C 0.8 -2.8 0.9 -4.2 1.6 -5.2 Z';
  cel(g, MASK, PAL.plate, { sh: 0.8, hl: 0.4, lw: 0.28 });
  clip(g, MASK, () => {
    for (const y of [-4.0, -3.2, -2.4]) stroke(g, `M 3.0 ${y} L 5.0 ${y - 0.1}`, PAL.plate.k, 0.26);
    stroke(g, curve([[1.6, -5.0], [3.2, -5.3], [5.0, -4.7]]), PAL.plate.l, 0.26, 0.8);
  });
  // goggles down over the eyes, teal lenses lit from inside
  const GOG = 'M 0.6 -7.6 C 1.8 -8.1 3.8 -8.1 5.1 -7.4 L 5.0 -5.6 C 3.8 -5.2 1.8 -5.3 0.7 -5.7 Z';
  cel(g, GOG, M.black, { sh: 0.4, hl: 0.2, lw: 0.3 });
  const L1 = 'M 1.2 -7.4 L 2.9 -7.6 L 2.9 -5.75 L 1.25 -5.9 Z', L2 = 'M 3.2 -7.6 L 4.7 -7.35 L 4.6 -5.6 L 3.2 -5.7 Z';
  g.save(); g.shadowColor = PAL.teal.m; g.shadowBlur = 6; fill(g, L1, PAL.teal.d); fill(g, L2, PAL.teal.d); g.restore();
  clip(g, L1, () => { fill(g, 'M 0 -6.4 L 6 -7.2 L 6 -5 L 0 -5 Z', PAL.teal.k, 0.5); fill(g, 'M 1.5 -7.4 L 2.0 -7.45 L 1.6 -6.2 L 1.2 -6.2 Z', PAL.teal.l, 0.8); });
  clip(g, L2, () => fill(g, 'M 0 -6.4 L 6 -7.2 L 6 -5 L 0 -5 Z', PAL.teal.k, 0.5));
  stroke(g, 'M -3.6 -6.8 C -2.0 -7.2 -0.4 -7.3 0.7 -7.0', M.black.m, 0.5);
  const H = PAL.helmet;
  const SHELL = 'M -4.3 -6.0 C -4.8 -9.6 -2.6 -11.9 0.6 -12.0 C 3.6 -12.1 5.3 -10.4 5.3 -8.2 L 4.9 -7.3 C 3.2 -7.9 1.2 -7.9 -0.4 -7.3 L -1.5 -6.2 L -4.0 -5.4 Z';
  cel(g, SHELL, H, { sh: 1.3, hl: 0.5 });
  clip(g, SHELL, () => {
    // side rail along the rim, a velcro patch, the top highlight
    fill(g, 'M -5 -6.6 C -2.6 -8.0 0.6 -8.6 5.4 -8.4 L 5.4 -7.6 C 0.6 -7.8 -2.6 -7.3 -5 -5.8 Z', H.d);
    for (let x = -3.4; x < 4.2; x += 0.9) stroke(g, `M ${x} ${-7.4 - (x + 3.4) * 0.12} l 0.45 0`, H.k, 0.26);
    fill(g, 'M -2.6 -10.4 L 0.2 -10.8 L 0.3 -9.4 L -2.5 -9.0 Z', H.d);
    stroke(g, curve([[-3.0, -10.4], [-0.4, -11.4], [2.8, -11.4]]), H.l, 0.32, 0.8);
  });
  // NVG mount on the front of the helmet
  cel(g, 'M 3.4 -10.9 L 5.0 -10.7 L 5.0 -9.2 L 3.4 -9.3 Z', M.gunmetal, { sh: 0.3, hl: 0.2, lw: 0.26 });
  // headset cup over the ear and the boom mic to the mouth
  cel(g, 'M -2.2 -5.0 a 1.35 1.5 0 1 0 2.7 0 a 1.35 1.5 0 1 0 -2.7 0 Z', PAL.pack, { sh: 0.5, hl: 0.3, lw: 0.28 });
  stroke(g, 'M 0.3 -4.4 C 0.9 -3.6 1.4 -3.3 1.8 -3.4', PAL.pack.k, 0.34);
}

export const HALE = {
  id: 'hale', name: 'WARDEN', role: 'SAVUNMA', pal: PAL,
  pose: { nUpper: 0.2, nFore: -2.25, nHand: -0.3, fUpper: -0.08, fFore: -0.16, fHand: -0.1, nThigh: 0.22, nShin: 0.05, fThigh: -0.22, fShin: -0.05, head: 0.02 },
  parts: { backFar, torso, chest, head, upper, fore, hand, thigh, shin, foot },
};
