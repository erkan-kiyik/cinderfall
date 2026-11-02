// FLINT — assault. Twenty-nine, third generation at the furnace; his father,
// the union's furnace chief, went missing the night it was put out (docs/
// KOR_STORY_CINEMATIC.md §9.2, painted per §10.1). He wears what a furnace
// man wears: a burnt-brown leather work jacket gone stiff with sparks, patched
// at the elbow, its collar up; long welding gauntlets; soot canvas trousers
// with a leather knee patch; oiled furnace boots with scuffed steel toes; a
// thick belt with a brass buckle, a rod pouch and a hammer in its loop. Over
// the chest a plate he cut from the furnace's own shell, the works' grey paint
// mostly gone, a weld bead along its edge, the 3 stencilled on it, hung on two
// leather straps. A black knit cap, round welding goggles in leather cups, and
// his father's red union scarf pulled up over his nose, the tails flying.
import { M, tone, mat } from '../style.js';
import {
  cel, fill, stroke, clip, blob, curve, fold,
  UPPER, FORE, THIGH, SHIN, TORSO, PELVIS,
  glove, boot, headShape, skinGlaze, skinDetail, neck, korBand, stitch, rivet, buckle, grime, scuffs,
  clothFolds, softBrow,
} from './body.js';
import { texture } from '../tex.js';
import { PROFILE, SKINS, face, crop, knit, strap, glass, ell, brushOf } from './realhead.js';

const PAL = {
  jacket: mat(tone('#8a5c3f', '#62402b', '#40291b', '#1d120b'), 'leather', 0.7),
  patch: mat(tone('#77553a', '#553c29', '#3a291c', '#1a110b'), 'leather', 0.7),
  shirt: mat(tone('#5f5c58', '#45433f', '#2f2d2b', '#151413'), 'wool', 0.5),
  pants: mat(tone('#5a5752', '#403e3a', '#2b2a27', '#131211'), 'canvas', 0.6),
  plate: mat(tone('#9a5a33', '#713c23', '#4c2717', '#21100a'), 'paint', 0.8),
  grey: mat(tone('#8b8a84', '#6c6b66', '#4e4d49', '#232220'), 'paint', 0.7),
  steel: mat(tone('#8a847d', '#5e5852', '#3d3934', '#171512'), 'steel', 0.6),
  scarf: mat(tone('#c2483d', '#93221e', '#601412', '#2a0706'), 'knit', 0.75),
  cap: mat(tone('#454240', '#2c2a28', '#1c1a19', '#0b0a09'), 'knit', 0.8),
  strap: mat(tone('#664834', '#473221', '#302116', '#140d08'), 'leather', 0.6),
  copper: mat(tone('#f0b383', '#bd7a43', '#814c22', '#3b200c'), 'steel', 0.4),
  glove: mat(tone('#b08860', '#8a6342', '#61442c', '#2c1c0f'), 'leather', 0.75),
  boot: mat(tone('#634a39', '#443126', '#2c2018', '#120c08'), 'leather', 0.6),
  toe: mat(tone('#a19d97', '#76726c', '#4f4c48', '#1f1d1b'), 'steel', 0.5),
  sole: mat(tone('#3d3834', '#29251f', '#1a1714', '#0b0908'), 'rubber', 0.6),
  skin: mat(M.skinB, 'skin', 0.4),
  brass: mat(M.brass, 'steel', 0.4),
  wood: mat(tone('#a07a52', '#7a5a39', '#553e27', '#271b10'), 'leather', 0.4),
  canvas: mat(tone('#7d7a5c', '#5c5a42', '#3f3d2c', '#1c1b13'), 'canvas', 0.7),
  olive: mat(tone('#6b6e52', '#4d503a', '#343627', '#16170f'), 'paint', 0.5),
};
const SOOT = 'rgba(28,22,18,0.55)';

// --- the scarf: red wool, a fringe on each end ------------------------------------------------
// Tails streaming back from the neck (torso frame, behind the body). In game they are simulated
// chains (SCARF, drawn with scarfSeg); this is the still pose for the menus.
const TAIL_A = blob([[-1.6, -23.4], [-6.4, -23.6], [-12.0, -21.8], [-17.0, -21.0], [-21.2, -18.6], [-18.8, -18.4], [-15.4, -18.4], [-10.8, -19.2], [-5.8, -20.4], [-2.4, -20.8]]);
const TAIL_B = blob([[-2.0, -21.8], [-6.4, -21.0], [-10.6, -18.2], [-14.2, -15.6], [-17.8, -14.6], [-15.2, -13.8], [-11.8, -14.8], [-8.0, -17.2], [-3.8, -18.9]]);
function fringe(g, x, y, ang, w, t) {
  g.save(); g.translate(x, y); g.rotate(ang);
  for (let i = 0; i < 7; i++) { const u = -w / 2 + (i + 0.5) * (w / 7); stroke(g, `M ${u} 0 q ${(i % 2 ? 0.25 : -0.2)} 0.7 ${(i % 2 ? 0.1 : -0.15)} ${1.3 + (i % 3) * 0.35}`, i % 2 ? t.m : t.d, 0.3); }
  g.restore();
}
// a darned hole: the scarf is old
function darn(g, x, y, t) { for (let i = 0; i < 4; i++) stroke(g, `M ${x - 0.5} ${y - 0.3 + i * 0.2} l 1.0 0.05`, t.l, 0.1, 0.7); stroke(g, `M ${x - 0.3} ${y - 0.4} l 0.1 0.9 M ${x + 0.2} ${y - 0.4} l 0.05 0.9`, t.d, 0.1, 0.7); }
function backFar(g) {
  cel(g, TAIL_B, PAL.scarf, { sh: 0.9, hl: 0.3 });
  clip(g, TAIL_B, () => stroke(g, curve([[-3, -20.6], [-8, -18.6], [-12.6, -15.8], [-16.6, -14.6]]), PAL.scarf.d, 0.26, 0.7));
  fringe(g, -17.4, -14.4, 1.25, 2.6, PAL.scarf);
  cel(g, TAIL_A, PAL.scarf, { sh: 0.9, hl: 0.35 });
  clip(g, TAIL_A, () => {
    stroke(g, curve([[-3, -22.0], [-8, -21.8], [-13, -20.4], [-18, -19.6]]), PAL.scarf.d, 0.3);
    stroke(g, curve([[-4, -22.9], [-9, -22.9], [-14, -21.5]]), PAL.scarf.l, 0.18, 0.6);
    // the two thin cream bands near the end, the union's old colours
    for (const x of [-17.6, -16.6]) fill(g, `M ${x} -22 L ${x + 0.45} -22 L ${x + 0.75} -17.6 L ${x + 0.3} -17.6 Z`, '#d9cdb4', 0.75);
  });
  darn(g, -11.2, -20.3, PAL.scarf);
  fringe(g, -20.8, -18.6, 1.0, 3.0, PAL.scarf);
}

// --- torso -------------------------------------------------------------------------------------
// the work jacket: boxy, to the hip, stiff leather
const JACKET = blob([
  [-2.0, -23.5], [-5.3, -23.0], [-8.1, -21.6], [-9.0, -19.0], [-8.6, -15.4], [-7.4, -11.4], [-6.8, -7.6], [-7.1, -3.6], [-7.2, -1.8],
  [6.2, -2.0], [6.0, -4.6], [5.7, -8.6], [6.3, -12.6], [7.0, -16.4], [6.6, -19.8], [4.2, -22.6], [1.2, -23.8],
]);
// the plate cut from the furnace's shell, bent a little round the chest
const PLATE = blob([[-3.4, -20.4], [1.0, -20.9], [5.6, -20.0], [6.9, -17.2], [6.7, -12.6], [6.1, -9.6], [1.4, -9.0], [-2.8, -9.4], [-3.9, -12.8], [-4.0, -17.4]]);
const POCKET = 'M -6.3 -9.4 L -3.4 -9.7 L -3.2 -4.6 C -4.2 -4.3 -5.3 -4.3 -6.2 -4.5 Z';
// The cells' kit (docs §10.21): an army-surplus canvas satchel slung behind the
// hip, its flap buckled, the ember chalked on it; and on the plate's strap the
// old walkie-talkie the crews talk on, its stubby rubber antenna up by the scarf.
const SATCHEL = blob([[-10.0, -9.4], [-6.0, -9.8], [-5.6, -4.0], [-6.2, -1.2], [-9.4, -1.0], [-10.4, -4.6]]);
function satchel(g) {
  const C = PAL.canvas;
  cel(g, SATCHEL, C, { sh: 0.9, hl: 0.4 });
  clip(g, SATCHEL, () => {
    // the flap over the top, its edge and its strap down to the buckle
    cel(g, 'M -10.6 -10.0 L -5.6 -10.4 L -5.7 -5.6 C -7.2 -5.0 -8.8 -5.0 -10.4 -5.4 Z', C, { sh: 0.4, hl: 0.35, ao: 0.5 });
    stitch(g, 'M -10.2 -5.9 C -8.8 -5.5 -7.2 -5.5 -5.9 -6.0', C.l, 0.08, 0.6);
    cel(g, 'M -8.4 -7.4 L -7.5 -7.45 L -7.5 -3.4 L -8.4 -3.35 Z', PAL.strap, { sh: 0.2, hl: 0.2 });
    // the ember, chalked on in a hurry
    stroke(g, 'M -9.4 -8.6 C -9.0 -9.3 -8.2 -9.3 -7.9 -8.7 C -8.1 -8.1 -8.9 -8.0 -9.4 -8.6 Z', 'rgba(232,140,80,0.75)', 0.16);
    grime(g, -6, 0, SOOT);
  });
  buckle(g, -8.55, -5.2, 1.2, 1.0, PAL.steel);
}
function radio(g) {
  // the clip on the strap, the antenna, the set: olive drab, chipped to the metal, a knob
  stroke(g, 'M -2.5 -20.6 L -2.75 -24.2', '#141210', 0.5);
  stroke(g, 'M -2.4 -20.6 L -2.62 -24.0', 'rgba(150,140,130,0.4)', 0.12);
  const R = 'M -3.6 -20.8 L -1.4 -21.0 L -1.2 -16.2 C -1.8 -15.9 -2.9 -15.9 -3.5 -16.1 Z';
  cel(g, R, PAL.olive, { sh: 0.5, hl: 0.4, gloss: 0.2 });
  clip(g, R, () => {
    for (let y = -19.6; y < -17.4; y += 0.4) stroke(g, `M -3.2 ${y} L -1.6 ${y - 0.05}`, PAL.olive.k, 0.12, 0.8);
    fill(g, 'M -3.2 -17.0 L -1.6 -17.05 L -1.6 -16.5 L -3.2 -16.45 Z', '#1b1a17');
    scuffs(g, [[-1.6, -20.4, 0.3], [-3.3, -16.6, 0.25]], '#a8a296', 0.7);
  });
  cel(g, 'M -1.9 -21.6 L -1.4 -21.62 L -1.4 -20.9 L -1.9 -20.88 Z', PAL.steel, { sh: 0.2, hl: 0.3 });
  fill(g, 'M -2.9 -18.7 a 0.18 0.18 0 1 0 0.36 0 a 0.18 0.18 0 1 0 -0.36 0 Z', '#e0623a');
}
function torso(g) {
  satchel(g);
  cel(g, PELVIS, PAL.pants, { sh: 1.1, hl: 0.4 });
  cel(g, TORSO, PAL.shirt, { sh: 1.0, hl: 0.3, line: false });
  cel(g, JACKET, PAL.jacket, { sh: 2.2, hl: 0.6 });
  // old leather: creased across the waist and under the arm, the creases worn pale on their ridges
  clothFolds(g, JACKET, [[[-7.4, -17.0], [-5.8, -14.4], [-4.4, -11.4]], [[-6.8, -8.0], [-4.2, -7.2], [-1.4, -7.6]], [[-6.4, -4.6], [-3.6, -4.0], [-0.6, -4.4]]], PAL.jacket);
  clip(g, JACKET, () => {
    // the shoulder yoke: a second layer of leather, stitched twice
    const YOKE = 'M -10 -18.2 C -6 -19.4 -2 -20.0 1.4 -20.0 C 3.6 -20.0 5.4 -19.6 8 -18.8 L 8 -26 L -10 -26 Z';
    cel(g, YOKE, PAL.patch, { sh: 0.6, hl: 0.3, ao: 0.2 });
    stitch(g, 'M -10 -17.7 C -6 -18.9 -2 -19.5 1.4 -19.5 C 3.6 -19.5 5.4 -19.1 8 -18.3', PAL.patch.l);
    stitch(g, 'M -10 -18.6 C -6 -19.8 -2 -20.4 1.4 -20.4 C 3.6 -20.4 5.4 -20.0 8 -19.2', PAL.patch.l, 0.11, 0.6);
    // the front edge, its snaps; the side seam, stitched
    stroke(g, 'M 5.4 -20 C 5.2 -14 5.0 -8 5.2 -2', PAL.jacket.k, 0.3);
    stitch(g, 'M 4.9 -20 C 4.7 -14 4.5 -8 4.7 -2', PAL.jacket.l, 0.11, 0.6);
    for (const y of [-16.6, -12.6, -8.6, -4.6]) rivet(g, 5.4, y, 0.34, PAL.copper);
    stroke(g, curve([[-5.2, -18.8], [-5.6, -14.4], [-5.4, -9.4], [-5.6, -3.0]]), PAL.jacket.d, 0.34);
    stitch(g, curve([[-4.8, -18.8], [-5.2, -14.4], [-5.0, -9.4], [-5.2, -3.0]]), PAL.jacket.l, 0.11, 0.55);
    // spark burns: pale pits with a dark ring, many small and a few big
    for (const [x, y, r] of [[-5.6, -13.8, 0.35], [-4.8, -9.2, 0.25], [2.6, -5.6, 0.3], [-6.2, -6.0, 0.22], [-2.2, -6.0, 0.18], [3.8, -3.6, 0.2], [-6.6, -16.2, 0.16]]) {
      fill(g, `M ${x - r * 1.5} ${y} a ${r * 1.5} ${r * 1.2} 0 1 0 ${3 * r} 0 a ${r * 1.5} ${r * 1.2} 0 1 0 ${-3 * r} 0 Z`, PAL.jacket.k, 0.35);
      fill(g, `M ${x - r} ${y} a ${r} ${r * 0.8} 0 1 0 ${2 * r} 0 a ${r} ${r * 0.8} 0 1 0 ${-2 * r} 0 Z`, PAL.jacket.l, 0.6);
    }
    // a hip pocket with its flap, and a creased fold under the chest
    cel(g, POCKET, PAL.jacket, { sh: 0.5, hl: 0.3, lw: 0.26, ao: 0.3 });
    cel(g, 'M -6.5 -9.8 L -3.2 -10.1 L -3.1 -8.0 C -4.2 -7.6 -5.4 -7.6 -6.4 -7.9 Z', PAL.patch, { sh: 0.4, hl: 0.25, lw: 0.24 });
    stitch(g, 'M -6.2 -8.4 C -5.2 -8.1 -4.2 -8.1 -3.3 -8.5', PAL.patch.l, 0.1, 0.7);
    rivet(g, -4.8, -8.4, 0.24, PAL.copper);
    fold(g, [[-3.6, -7.4], [-1.0, -6.6], [1.8, -6.8]], PAL.jacket);
    fold(g, [[-2.4, -4.6], [0.2, -4.0], [3.0, -4.4]], PAL.jacket, 0.24);
    // the hem band, stitched, soot gone into the leather low down
    stroke(g, 'M -7.4 -2.6 C -2 -2.2 2 -2.2 6.4 -2.6', PAL.jacket.k, 0.3);
    stitch(g, 'M -7.4 -3.1 C -2 -2.7 2 -2.7 6.4 -3.1', PAL.jacket.l, 0.1, 0.6);
    grime(g, -9, -1, SOOT);
  });
  // the plate's straps: over the near shoulder and round the waist, with buckles
  const SH = blob([[-3.4, -20.0], [-1.8, -20.6], [-0.6, -23.6], [-2.2, -23.9], [-3.8, -22.2], [-4.6, -20.4]]);
  cel(g, SH, PAL.strap, { sh: 0.4, hl: 0.2 });
  clip(g, SH, () => stitch(g, 'M -3.9 -20.5 L -2.6 -23.4', PAL.strap.l, 0.1, 0.7));
  cel(g, 'M -6.9 -12.2 L -3.6 -12.6 L -3.4 -10.6 L -6.8 -10.2 Z', PAL.strap, { sh: 0.3, hl: 0.2, lw: 0.26 });
  buckle(g, -6.2, -12.5, 1.1, 1.9, PAL.steel);
  // the plate
  cel(g, PLATE, PAL.plate, { sh: 1.4, hl: 0.45 });
  clip(g, PLATE, () => {
    // the furnace's grey paint, mostly gone; rust running down from the bolt holes
    cel(g, 'M -5 -21 L 8 -21 L 8 -17.6 C 6 -18.2 4.8 -17.5 3.4 -18.0 C 1.6 -18.6 0 -17.6 -1.6 -18.1 C -3 -18.4 -4 -17.4 -5 -17.6 Z', PAL.grey, { sh: 0.4, hl: 0.25, ao: 0.15, lw: 0.2 });
    cel(g, 'M 2.6 -12.6 C 3.6 -13.2 5.2 -13.0 6.0 -12.2 L 7 -9 L 2.2 -9 Z', PAL.grey, { sh: 0.3, hl: 0.2, ao: 0.15, lw: 0.2 });
    for (const [x, w, y1] of [[-2.0, 0.5, -11.6], [0.8, 0.7, -12.4], [3.6, 0.45, -13.4], [5.4, 0.6, -10.8], [-2.9, 0.35, -15.0]]) fill(g, `M ${x} -18.6 L ${x + w} -18.5 C ${x + w * 0.8} -15 ${x + w * 0.4} ${y1 + 1} ${x + w * 0.3} ${y1} L ${x + 0.05} ${y1 - 0.2} Z`, PAL.plate.d, 0.55);
    // heat bloom where it sat nearest the fire: blue-straw temper colours
    const hb = g.createRadialGradient(-2.4, -11.0, 0.2, -2.4, -11.0, 3.2);
    hb.addColorStop(0, 'rgba(70,90,140,0.35)'); hb.addColorStop(0.5, 'rgba(190,150,70,0.22)'); hb.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = hb; g.fillRect(-6, -15, 8, 8);
    // the stencilled 3, chipped, in the old works' white
    g.save(); g.translate(1.5, -14.4); g.scale(0.82, 0.82);
    g.globalAlpha = 0.66; g.strokeStyle = '#ddd6c4'; g.lineWidth = 0.75; g.lineCap = 'butt';
    g.beginPath(); g.arc(0, -1.35, 1.25, Math.PI * 1.05, Math.PI * 2.45); g.stroke();
    g.beginPath(); g.arc(0, 1.25, 1.4, Math.PI * 1.55, Math.PI * 2.95); g.stroke();
    g.globalAlpha = 1; g.restore();
    fill(g, 'M 0.5 -14.85 L 2.4 -14.9 L 2.4 -14.25 L 0.5 -14.2 Z', PAL.plate.m);
    for (const [x, y] of [[2.2, -16.4], [0.6, -13.0], [2.5, -13.4], [1.0, -15.9]]) fill(g, `M ${x} ${y} l 0.35 0.1 l -0.1 0.3 l -0.3 -0.05 Z`, PAL.plate.m);
    // the weld bead down the cut edge and the torch-cut kerf on the other
    for (let y = -19.4; y < -9.8; y += 0.42) fill(g, `M 6.0 ${y} a 0.36 0.26 0 1 0 0.72 0 a 0.36 0.26 0 1 0 -0.72 0 Z`, PAL.steel.m, 0.85);
    for (let y = -19.4; y < -9.8; y += 0.42) stroke(g, `M 6.05 ${y - 0.08} l 0.5 0`, PAL.steel.l, 0.08, 0.7);
    stroke(g, curve([[-3.7, -19.6], [-3.9, -16], [-3.8, -12], [-3.2, -9.6]]), PAL.plate.k, 0.3, 0.8);
    for (const [x, y] of [[-2.8, -19.4], [5.0, -19.2], [-2.6, -10.2], [5.0, -10.4]]) rivet(g, x, y, 0.36, PAL.steel);
    stroke(g, curve([[-3.2, -19.8], [1.2, -20.3], [5.6, -19.5]]), PAL.plate.l, 0.24, 0.6);
  });
  radio(g);
}

function chest(g) {
  // the jacket's collar turned up behind the scarf
  cel(g, blob([[-4.4, -22.0], [-4.2, -25.0], [-1.6, -25.6], [1.2, -25.4], [2.6, -24.4], [2.2, -22.2], [-1.2, -21.8]]), PAL.jacket, { sh: 0.7, hl: 0.35 });
  // the scarf: wound twice round the neck, the knot end hanging on the chest
  const WRAP = blob([[-3.6, -24.2], [0.4, -25.0], [4.2, -24.4], [4.9, -22.6], [3.6, -21.2], [0.2, -20.8], [-3.4, -21.2], [-4.4, -22.6]]);
  cel(g, WRAP, PAL.scarf, { sh: 0.9, hl: 0.35 });
  clip(g, WRAP, () => { stroke(g, curve([[-3.8, -22.4], [-0.4, -23.4], [3.0, -23.2], [4.6, -22.4]]), PAL.scarf.d, 0.3); stroke(g, curve([[-3.0, -24.0], [0.6, -24.5], [3.8, -24.0]]), PAL.scarf.l, 0.2, 0.6); });
  clothFolds(g, WRAP, [[[-3.8, -23.4], [-0.8, -24.1], [2.4, -24.0], [4.4, -23.3]], [[-3.6, -21.8], [-0.4, -21.6], [2.8, -21.8], [4.6, -22.0]], [[1.0, -23.0], [2.6, -22.7], [4.2, -22.8]]], PAL.scarf);
  const END = 'M 2.0 -22.0 L 4.0 -22.1 C 4.8 -20.2 5.2 -18.2 5.3 -16.0 L 2.9 -16.0 C 2.7 -18.0 2.4 -20.0 2.0 -22.0 Z';
  cel(g, END, PAL.scarf, { sh: 0.5, hl: 0.3, lw: 0.28 });
  clip(g, END, () => fill(g, 'M 2 -17.4 L 6 -17.4 L 6 -16.9 L 2 -16.9 Z', '#d9cdb4', 0.7));
  fringe(g, 4.1, -16.0, -0.05, 2.3, PAL.scarf);
  // the belt: thick leather, brass buckle, its holes worn long
  const BELT = 'M -6.0 -5.4 C -1.2 -5.75 2.6 -5.75 5.7 -5.5 L 5.75 -3.6 C 2.6 -3.85 -1.2 -3.85 -6.05 -3.5 Z';
  cel(g, BELT, PAL.strap, { sh: 0.45, hl: 0.22 });
  clip(g, BELT, () => { stitch(g, 'M -6 -5.15 C -1.2 -5.5 2.6 -5.5 5.7 -5.25', PAL.strap.l, 0.09, 0.6); stitch(g, 'M -6 -3.8 C -1.2 -4.1 2.6 -4.1 5.7 -3.85', PAL.strap.l, 0.09, 0.6); });
  for (const x of [-1.2, -0.4]) fill(g, `M ${x} -4.6 a 0.16 0.16 0 1 0 0.32 0 a 0.16 0.16 0 1 0 -0.32 0 Z`, PAL.strap.k);
  cel(g, 'M 2.6 -6.0 L 5.0 -6.05 L 5.0 -3.3 L 2.6 -3.25 Z', PAL.brass, { sh: 0.3, hl: 0.25, lw: 0.26 });
  fill(g, 'M 3.2 -5.4 L 4.4 -5.43 L 4.4 -3.9 L 3.2 -3.87 Z', PAL.strap.m);
  stroke(g, 'M 3.0 -4.65 L 4.7 -4.65', PAL.brass.d, 0.2);
  // the welding-rod pouch on the near hip, the rods' ends showing
  const RP = blob([[-6.8, -5.6], [-4.0, -5.7], [-3.8, -0.8], [-4.6, 0.0], [-6.4, -0.2], [-7.0, -2.4]]);
  for (let i = 0; i < 4; i++) stroke(g, `M ${-6.2 + i * 0.6} -5.4 L ${-6.4 + i * 0.6} -7.6`, PAL.steel.m, 0.22);
  cel(g, RP, PAL.patch, { sh: 0.6, hl: 0.3 });
  clip(g, RP, () => { stitch(g, 'M -6.6 -5.0 L -4.2 -5.1', PAL.patch.l, 0.1); grime(g, -4, 0.4, SOOT); });
  // a canvas magazine pouch on the belt, front
  const x = -0.6;
  cel(g, `M ${x} -7.2 L ${x + 2.2} -7.3 L ${x + 2.25} -3.9 C ${x + 1.5} -3.6 ${x + 0.7} -3.6 ${x} -3.9 Z`, PAL.pants, { sh: 0.4, hl: 0.2, lw: 0.26 });
  cel(g, `M ${x - 0.1} -7.5 L ${x + 2.3} -7.6 L ${x + 2.3} -6.0 C ${x + 1.5} -5.7 ${x + 0.7} -5.7 ${x - 0.1} -6.0 Z`, PAL.patch, { sh: 0.3, hl: 0.2, lw: 0.24 });
  rivet(g, x + 1.1, -6.2, 0.2, PAL.copper);
}

// --- arms ------------------------------------------------------------------------------------
function upper(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.1, 1); cel(g, UPPER, t(PAL.jacket), { sh: 1.6, hl: 0.5 }); g.restore();
  clothFolds(g, UPPER, [[[-2.0, 6.2], [-0.4, 7.0], [1.8, 6.6]], [[-1.8, 10.4], [0.0, 11.0], [1.8, 10.6]]], t(PAL.jacket));
  clip(g, UPPER, () => {
    cel(g, 'M -4 -4 L 4 -4 L 4 2.4 C 1.5 3.2 -1.5 3.2 -4 2.2 Z', t(PAL.patch), { sh: 0.4, hl: 0.25, ao: 0.2, line: false });
    stitch(g, 'M -4 1.8 C -1.5 2.8 1.5 2.8 4 2.0', t(PAL.patch).l, 0.1, 0.7);
    stroke(g, curve([[-2.4, 3.0], [-2.6, 7.0], [-2.2, 11.0]]), t(PAL.jacket).d, 0.26);
    fold(g, [[-1.8, 8.6], [-0.4, 9.6], [1.2, 9.9]], t(PAL.jacket));
    for (const [x, y] of [[1.2, 7.4], [-0.6, 10.4]]) fill(g, `M ${x - 0.2} ${y} a 0.2 0.16 0 1 0 0.4 0 a 0.2 0.16 0 1 0 -0.4 0 Z`, t(PAL.jacket).l, 0.6);
  });
  if (!ctx.far) korBand(g, t(mat(tone('#424040', '#2c2a28', '#1d1b1a', '#0c0b0a'), 'canvas', 0.6)));
}
function fore(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.1, 1); cel(g, FORE, t(PAL.jacket), { sh: 1.4, hl: 0.45 }); g.restore();
  // the elbow, patched with a scrap of other leather and stitched round
  const EP = blob([[-2.6, -1.2], [0.2, -1.6], [1.0, 0.6], [0.2, 2.6], [-2.2, 2.8], [-2.9, 0.6]]);
  cel(g, EP, t(PAL.patch), { sh: 0.4, hl: 0.25, lw: 0.24 });
  clip(g, EP, () => stitch(g, blob([[-2.3, -0.8], [-0.1, -1.1], [0.6, 0.6], [-0.1, 2.2], [-2.0, 2.4], [-2.5, 0.6]]), t(PAL.patch).l, 0.09, 0.8));
  clip(g, FORE, () => fold(g, [[-1.6, 3.0], [0.0, 3.8], [1.6, 3.6]], t(PAL.jacket), 0.28));
  // the welding gauntlet's flared cuff over the lower forearm
  const CUFF = blob([[-2.6, 5.2], [2.5, 5.0], [2.9, 8.0], [2.2, 10.8], [-2.1, 11.0], [-2.9, 8.2]]);
  cel(g, CUFF, t(PAL.glove), { sh: 0.8, hl: 0.4 });
  clip(g, CUFF, () => {
    stitch(g, 'M -2.6 6.0 C -0.8 5.7 1.0 5.6 2.6 5.8', t(PAL.glove).d, 0.12);
    stitch(g, 'M 1.6 5.6 L 1.9 10.8', t(PAL.glove).d, 0.12);
    for (const [x, y, r] of [[0.4, 7.6, 0.35], [-1.2, 9.0, 0.25], [1.0, 9.6, 0.2]]) fill(g, `M ${x - r} ${y} a ${r} ${r * 0.8} 0 1 0 ${2 * r} 0 a ${r} ${r * 0.8} 0 1 0 ${-2 * r} 0 Z`, t(PAL.glove).k, 0.45);
    grime(g, 7, 12, SOOT);
  });
}
function hand(g, ctx) { glove(g, ctx, PAL.glove, { cuff: PAL.glove }); }

// --- legs ------------------------------------------------------------------------------------
function thigh(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.06, 1); cel(g, THIGH, t(PAL.pants), { sh: 1.7, hl: 0.45 }); g.restore();
  // trousers bunched behind the knee, pulled across the thigh from the hip
  clothFolds(g, THIGH, [[[-3.0, 11.0], [-1.0, 11.8], [1.6, 11.4]], [[-2.8, 2.8], [-1.2, 3.4], [-0.2, 4.6]], [[1.4, 7.0], [2.4, 8.2]]], t(PAL.pants));
  clip(g, THIGH, () => {
    // the out-seam, triple stitched; a rule pocket
    stroke(g, curve([[2.6, 0.6], [2.4, 7.0], [2.0, 15.0]]), t(PAL.pants).k, 0.24, 0.7);
    stitch(g, curve([[2.2, 0.6], [2.0, 7.0], [1.6, 15.0]]), t(PAL.pants).l, 0.09, 0.6);
    cel(g, 'M -0.4 3.0 L 1.6 2.9 L 1.7 8.4 L -0.3 8.5 Z', t(PAL.pants), { sh: 0.3, hl: 0.2, lw: 0.24, ao: 0.25 });
    stitch(g, 'M -0.2 3.4 L 1.5 3.3', t(PAL.pants).l, 0.09, 0.7);
    fill(g, 'M 0.2 3.0 L 0.7 3.0 L 0.7 1.6 L 0.2 1.6 Z', '#c9c2b0');
    fold(g, [[-2.0, 11.4], [0.0, 12.4], [2.0, 12.4]], t(PAL.pants));
    fold(g, [[-2.4, 5.0], [-1.0, 5.8], [0.0, 5.6]], t(PAL.pants), 0.24);
    grime(g, 6, 16, SOOT);
  });
  if (!ctx.far) {
    // the hammer, head down, in its loop on the side
    cel(g, 'M -3.4 1.0 L -2.7 1.0 L -2.7 8.6 L -3.4 8.6 Z', PAL.wood, { sh: 0.2, hl: 0.2, lw: 0.2 });
    cel(g, 'M -4.4 8.4 L -1.6 8.4 L -1.7 9.8 L -4.3 9.8 Z', PAL.steel, { sh: 0.3, hl: 0.25, lw: 0.22 });
    cel(g, 'M -3.9 2.4 L -2.2 2.3 L -2.2 3.4 L -3.9 3.5 Z', PAL.strap, { sh: 0.2, hl: 0.15, lw: 0.2 });
  }
}
function shin(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.06, 1); cel(g, SHIN, t(PAL.pants), { sh: 1.4, hl: 0.4 }); g.restore();
  // the leather knee patch, sewn on with big stitches
  const KP = blob([[-1.8, -1.0], [2.2, -1.2], [2.6, 2.4], [0.4, 3.6], [-1.6, 2.6]]);
  cel(g, KP, t(PAL.patch), { sh: 0.5, hl: 0.3, lw: 0.26 });
  clip(g, KP, () => { stitch(g, blob([[-1.4, -0.7], [1.9, -0.9], [2.2, 2.2], [0.4, 3.2], [-1.3, 2.3]]), t(PAL.patch).l, 0.1, 0.8); scuffs(g, [[1.2, 0.6, 0.5, 0.4], [0.2, 1.8, 0.3]], t(PAL.patch).l, 0.5); });
  clip(g, SHIN, () => { fold(g, [[-1.6, 6.6], [0.2, 7.4], [2.0, 7.2]], t(PAL.pants), 0.26); grime(g, 3, 9, SOOT); });
  // furnace boots: high, laced to the top, the leather oiled dark
  const TALL = blob([[-2.75, 6.4], [2.5, 6.1], [2.6, 10.0], [2.65, 15.0], [-2.65, 15.1], [-2.9, 10.0]]);
  cel(g, TALL, t(PAL.boot), { sh: 0.9, hl: 0.4 });
  clip(g, TALL, () => {
    for (let y = 7.2; y < 14.4; y += 1.15) { stroke(g, `M 0.8 ${y} L 2.2 ${y + 0.45} M 2.2 ${y} L 0.8 ${y + 0.45}`, '#b7a684', 0.16); rivet(g, 0.7, y + 0.2, 0.13, PAL.brass); }
    stroke(g, 'M -2.7 6.9 C -0.8 6.5 1.0 6.4 2.5 6.6', t(PAL.boot).l, 0.2, 0.8);
    stitch(g, 'M -2.4 7.3 L -2.3 14.6', t(PAL.boot).l, 0.09, 0.6);
    scuffs(g, [[-1.0, 12.4, 0.5, 0.2], [1.4, 9.0, 0.35]], t(PAL.boot).l, 0.4);
    grime(g, 10, 16, 'rgba(60,50,40,0.5)');
  });
}
function foot(g, ctx) {
  boot(g, ctx, PAL.boot, PAL.sole, { toe: PAL.toe, lace: '#b7a684' });
  // the steel showing through the scuffed toe, the metatarsal guard over the laces
  clip(g, 'M 3.6 0.15 L 7.2 1.3 L 7.2 2.0 L 3.4 2.0 Z', () => scuffs(g, [[5.4, 1.0, 0.7, 0.3], [6.4, 1.5, 0.4]], '#d8d4cc', 0.7));
  cel(g, 'M 0.6 -1.6 C 1.8 -1.2 3.2 -0.4 4.2 0.6 L 3.4 1.2 C 2.4 0.4 1.4 -0.2 0.2 -0.5 Z', ctx.t(PAL.toe), { sh: 0.3, hl: 0.25, lw: 0.24 });
  rivet(g, 1.2, -0.9, 0.16, PAL.steel);
}

// --- head (docs §10.25): Flint's face, open. Twenty-nine, a furnace man's face: olive skin
// gone dark with soot in its creases, a straight nose, a hard jaw under three days of
// stubble, brown eyes deep under heavy brows (an old burn through the near one). The watch
// cap fitted to the skull, its cuff ribbed, the union's pin on it; the welding goggles pushed
// up onto the cap; his father's scarf pulled down round the neck to the jaw.
const FCAP = 'M -4.2 -5.0 C -4.6 -6.8 -4.4 -8.6 -3.4 -10.0 C -2.2 -11.3 -0.2 -11.6 1.6 -11.3 C 3.1 -11.0 4.1 -10.0 4.4 -8.7 C 4.5 -8.3 4.5 -7.95 4.42 -7.7 C 3.0 -7.62 1.8 -7.5 0.8 -7.1 C -0.2 -6.7 -0.9 -6.3 -1.5 -6.0 C -2.4 -5.6 -3.3 -5.2 -4.2 -5.0 Z';
const FCUFF = 'M -4.3 -5.0 C -3.3 -5.2 -2.4 -5.6 -1.5 -6.0 C -0.9 -6.3 -0.2 -6.7 0.8 -7.1 C 1.8 -7.5 3.0 -7.62 4.42 -7.7 C 4.5 -8.15 4.5 -8.6 4.4 -9.05 C 2.8 -9.1 1.4 -8.9 0.2 -8.4 C -1.0 -7.9 -2.0 -7.2 -3.0 -6.7 C -3.5 -6.5 -4.0 -6.4 -4.5 -6.4 Z';
const FCOLLAR = 'M 4.75 -1.95 C 3.6 -1.45 2.0 -1.65 0.6 -2.45 C -0.6 -3.05 -2.0 -3.45 -3.4 -3.25 C -4.2 -2.4 -4.4 -1.0 -4.0 0.4 C -2.4 1.4 0.6 1.7 3.2 1.3 C 4.6 1.0 5.25 0.2 5.25 -0.8 C 5.2 -1.3 5.0 -1.7 4.75 -1.95 Z';
const FWRAP = 'M -4.2 -1.0 C -2.6 -1.7 -0.4 -1.6 1.6 -1.0 C 3.0 -0.6 4.4 -0.2 5.4 0.4 C 5.6 1.2 5.2 2.0 4.4 2.4 C 2.6 2.9 0.2 2.9 -1.8 2.5 C -3.2 2.2 -4.2 1.5 -4.5 0.6 C -4.6 0.0 -4.5 -0.6 -4.2 -1.0 Z';
const FSIDEBURN = 'M 0.62 -7.0 C 0.9 -6.95 1.1 -6.8 1.15 -6.5 C 1.18 -6.1 1.12 -5.7 1.0 -5.35 C 0.84 -5.4 0.7 -5.6 0.66 -5.9 C 0.6 -6.3 0.58 -6.7 0.62 -7.0 Z';
const FNAPE = 'M -3.95 -5.6 C -3.4 -5.3 -2.6 -5.4 -1.8 -5.8 L -1.0 -6.2 C -1.1 -5.4 -1.5 -4.4 -2.2 -3.6 C -2.9 -3.7 -3.5 -4.4 -3.95 -5.6 Z';
function head(g) {
  const S = SKINS.olive, B = brushOf(g), C = PAL.cap, R = PAL.scarf, Cu = PAL.copper;
  neck(g, PAL.skin, { sh: 1.0, glaze: true });
  face(g, { prof: 'm', s: S, age: 0.22, seed: 31, iris: '#4a3020', brow: ['#1b120d', 0.1, 1.2], lips: '150,84,70', shave: 'rgba(36,28,24,0.32)', stubble: { col: '#1a120d', n: 1100 } });
  // soot in the creases and round where the goggles sat, a smear along the cheekbone
  B.inside(PROFILE, () => { B.dab(3.5, -6.2, 1.0, 0.55, 'rgba(26,20,16,0.28)'); B.dab(2.6, -5.3, 1.0, 0.25, 'rgba(26,20,16,0.3)', 1, 'source-over', -0.2); B.dab(4.0, -8.0, 0.8, 0.3, 'rgba(26,20,16,0.18)'); });
  // the old burn through the near brow
  B.line('M 3.5 -7.15 L 3.68 -6.62', `rgba(${S.pale},0.8)`, 0.07, 0.02);
  crop(g, FSIDEBURN, { col: '#2a1a12', lit: 'rgba(110,80,60,1)', seed: 33, n: 160, a: Math.PI * 0.5 });
  crop(g, FNAPE, { col: '#24170f', lit: 'rgba(100,72,52,1)', seed: 35, n: 260, a: Math.PI * 0.55 });
  // the scarf pulled down round the neck to the jaw, wound twice, knit, darned
  cel(g, FWRAP, R, { sh: 0.9, hl: 0.4 });
  knit(g, FWRAP, R, { step: 0.32, bend: -0.4, box: [-5, -1.8, 6, 3] });
  clothFolds(g, FWRAP, [[[-4.0, 0.2], [-1.0, -0.2], [2.0, 0.2], [5.0, 1.0]], [[-3.6, 1.8], [-0.6, 2.2], [2.6, 2.2], [4.4, 1.9]]], R);
  cel(g, FCOLLAR, R, { sh: 1.0, hl: 0.45 });
  knit(g, FCOLLAR, R, { step: 0.3, bend: -0.3, box: [-5, -3.6, 6, 2] });
  clothFolds(g, FCOLLAR, [[[4.6, -1.2], [2.6, -0.8], [0.4, -1.4], [-2.4, -2.2]], [[4.8, 0.2], [2.4, 0.6], [-0.4, 0.2], [-3.4, -0.8]]], R);
  B.line('M 4.75 -1.95 C 3.6 -1.45 2.0 -1.65 0.6 -2.45 C -0.6 -3.05 -2.0 -3.45 -3.4 -3.25', R.l, 0.1, 0.04, 0.6);
  B.fill(ell(2.4, -0.4, 0.36, 0.26), 'rgba(140,40,34,0.55)', 0.05);
  // the cap: knitted rows over the crown, the cuff ribbed and turned up, the union's pin
  cel(g, FCAP, C, { sh: 1.2, hl: 0.5 });
  knit(g, FCAP, C, { step: 0.36, bend: 0.5, box: [-5, -12, 5, -6] });
  B.inside(FCAP, () => { B.dab(1.6, -10.6, 2.2, 0.8, 'rgba(150,140,130,0.25)'); B.dab(-3.0, -7.0, 1.6, 2.0, 'rgba(0,0,0,0.35)'); });
  cel(g, FCUFF, C, { sh: 0.5, hl: 0.4, ao: 0.6 });
  knit(g, FCUFF, C, { ribs: true, step: 0.34, lean: -0.3, box: [-5, -9.4, 5, -4.8] });
  B.inside(FCUFF, () => { B.line('M -4.4 -6.4 C -3.0 -6.6 -1.0 -7.8 0.2 -8.4 C 1.4 -8.9 2.8 -9.1 4.4 -9.05', 'rgba(140,130,120,0.4)', 0.1, 0.06); scuffs(g, [[1.4, -8.4, 0.3], [-2.2, -6.4, 0.25]], '#6b5a50', 0.35); });
  B.fill(ell(0.6, -8.1, 0.36, 0.34), Cu.d, 0.01);
  B.fill(ell(0.6, -8.12, 0.28, 0.26), Cu.m, 0.01);
  B.fill('M 0.47 -8.08 C 0.51 -8.34 0.71 -8.38 0.77 -8.22 C 0.83 -8.06 0.73 -7.92 0.61 -7.92 C 0.51 -7.94 0.45 -8.0 0.47 -8.08 Z', '#e0622e', 0.005);
  // the goggles pushed up on the cap: the strap round it, the two cups tipped up on the brow
  strap(g, 'M 3.6 -9.3 C 2.0 -9.2 0.0 -8.6 -1.8 -7.9 C -2.9 -7.5 -3.8 -7.2 -4.5 -7.0', 0.4, '#3b2a20', '#120c08', 'rgba(170,130,100,0.6)');
  for (const [cx, cy, rx, ry, far] of [[4.72, -9.7, 0.3, 0.66, true], [3.5, -9.85, 0.72, 0.62, false]]) {
    B.fill(ell(cx, cy, rx + 0.18, ry + 0.16), '#3a2416', 0.03);
    glass(g, ell(cx, cy, rx, ry), [cx - rx, cy - ry, cx + rx, cy + ry], { tint: ['#0c2418', '#3a7258', '#d0803e'], a: far ? 0.6 : 0.85 });
    B.line(ell(cx, cy, rx, ry), Cu.k, 0.15, 0.01); B.line(ell(cx, cy, rx, ry), Cu.m, 0.09, 0.01);
    if (!far) B.line(`M ${cx - rx * 0.8} ${cy - ry * 0.5} A ${rx} ${ry} 0 0 1 ${cx + rx * 0.3} ${cy - ry * 0.95}`, Cu.l, 0.05, 0.01);
  }
  B.line('M 4.2 -9.8 C 4.3 -9.9 4.4 -9.9 4.46 -9.8', Cu.d, 0.14, 0.01);
}

// Runtime scarf: tails simulated as verlet chains and drawn with this segment
// (4×2 units along +x, centred on y = 0; stretched between chain points).
export function scarfSeg(g) {
  const SEG = 'M 0 -1 L 4 -1 A 1 1 0 0 1 4 1 L 0 1 A 1 1 0 0 1 0 -1 Z';
  cel(g, SEG, PAL.scarf, { sh: 0.5, hl: 0.25, line: false, ao: 0.2 });
}
export const SCARF = {
  // anchors in the torso frame (back of the neck); length, points, widths
  tails: [
    { ax: -2.0, ay: -23.2, len: 24, n: 8, w0: 3.2, w1: 2.6, g: 200 },
    { ax: -2.8, ay: -21.4, len: 17, n: 6, w0: 2.8, w1: 2.4, g: 520 },
  ],
};

export const VEX = {
  id: 'vex', name: 'FLINT', role: 'SALDIRI', pal: PAL,
  pose: { nUpper: 0.62, nFore: -0.95, nHand: -0.5, fUpper: -0.06, fFore: -0.3, fHand: -0.15, nThigh: 0.18, nShin: 0.04, fThigh: -0.26, fShin: -0.08, head: -0.04 },
  parts: { backFar, torso, chest, head, upper, fore, hand, thigh, shin, foot },
};
