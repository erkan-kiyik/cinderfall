// CINDERFALL LAB — the operator body standard (v2).
//
// Heroic stylised proportions on the shared skeleton (figure.js SK): head
// about a seventh of the height, shoulders about twice the head's width, a
// V from the chest to the waist, limbs with mass (deltoid, forearm, thigh,
// calf), big gloves and boots. Clothing is built in layers over these forms
// so every operator reads as kitted out, and each one only brings materials
// and signature pieces.
//
// All shapes are in the bone frames of figure.js: limbs along +y from the
// proximal joint with +x the bone's front; torso up -y from the hip centre;
// head up -y from the neck base; foot at the ankle with the ground at +2.5.
import { cel, fill, stroke, clip, blob, limb, curve } from '../kit.js';

// The head is painted at this scale of the old 64-unit head (helmets in
// helmets.js were drawn for it): with the higher neck it lands at ~1/7.
export const HEAD_K = 0.8;
export function scaledHead(g, fn) { g.save(); g.scale(HEAD_K, HEAD_K); fn(); g.restore(); }

// --- limb forms -------------------------------------------------------------
// upper arm: round deltoid cap, biceps on the front, triceps behind
export const UPPER = limb(11.6, [[0, 3.05], [0.18, 3.05], [0.45, 2.75], [0.75, 2.3], [1, 2.1]], [[0, 3.1], [0.25, 3.0], [0.55, 2.7], [0.85, 2.2], [1, 2.05]], 0.6, 0.5);
// forearm: thick below the elbow, tapering to the wrist
export const FORE = limb(10.4, [[0, 2.2], [0.22, 2.45], [0.55, 2.15], [1, 1.7]], [[0, 2.15], [0.2, 2.5], [0.5, 2.2], [1, 1.65]], 0.5, 0.4);
// thigh: full at the hip, quad on the front, narrowing to the knee
export const THIGH = limb(15.2, [[0, 3.9], [0.3, 3.85], [0.65, 3.25], [1, 2.65]], [[0, 4.05], [0.25, 4.0], [0.7, 3.0], [1, 2.6]], 0.45, 0.5);
// shin: the calf swells behind, the shin bone stays straight in front
export const SHIN = limb(14.4, [[0, 2.6], [0.3, 2.45], [0.7, 2.15], [1, 2.05]], [[0, 2.55], [0.22, 3.1], [0.5, 2.85], [0.8, 2.2], [1, 2.05]], 0.5, 0.4);

// --- gloves -----------------------------------------------------------------
// A bigger, squarer hand along +y from the wrist; thumb on the front (+x).
const PALM = blob([[-1.75, -0.6], [1.7, -0.6], [2.15, 1.7], [2.05, 3.7], [1.25, 5.3], [-0.55, 5.45], [-1.85, 4.0], [-2.05, 1.5]]);
const THUMB = blob([[1.1, 0.9], [2.85, 1.4], [3.35, 3.2], [2.6, 4.05], [1.45, 3.0]]);
const KNUCKLE = blob([[-1.6, 2.55], [1.85, 2.4], [1.9, 3.75], [-1.55, 3.95]]);
const CUFF = blob([[-2.0, -1.4], [1.95, -1.4], [2.1, 0.9], [-2.15, 0.9]]);

// o: { cuff: tone, knuckle: tone, fingerless: skin tone }
export function glove(g, ctx, mat, o = {}) {
  const t = ctx.t;
  if (ctx.far) cel(g, THUMB, t(mat), { sh: 0.6, hl: 0.25 });
  cel(g, PALM, t(mat), { sh: 0.9, hl: 0.35 });
  clip(g, PALM, () => {
    if (o.fingerless) cel(g, 'M -3 3.9 L 3 3.7 L 3 7 L -3 7 Z', t(o.fingerless), { sh: 0.6, hl: 0.25, line: false });
    for (const x of [-0.95, 0.15, 1.15]) stroke(g, `M ${x} 4.0 L ${x + 0.06} 5.3`, t(mat).k, 0.26);
  });
  if (o.knuckle) cel(g, KNUCKLE, t(o.knuckle), { sh: 0.35, hl: 0.2, lw: 0.26 });
  if (!ctx.far) cel(g, THUMB, t(mat), { sh: 0.6, hl: 0.25 });
  if (o.cuff) cel(g, CUFF, t(o.cuff), { sh: 0.4, hl: 0.25, lw: 0.28 });
}

// --- boots ------------------------------------------------------------------
// Chunky tactical boot: ankle collar, toe cap, thick lugged sole.
const BOOT = blob([[-2.5, -2.4], [1.55, -2.35], [2.55, -0.6], [4.6, 0.25], [6.7, 1.0], [7.25, 2.0], [7.0, 2.5], [-2.85, 2.5], [-3.0, 0.2]]);
const TOE = blob([[3.6, 0.15], [5.6, 0.55], [7.1, 1.3], [7.15, 2.0], [3.4, 2.0], [3.2, 1.0]]);
const SOLE = 'M -2.95 1.55 L 7.15 1.55 C 7.45 1.8 7.4 2.35 7.1 2.55 L -2.85 2.55 C -3.1 2.3 -3.1 1.8 -2.95 1.55 Z';
const COLLAR = blob([[-2.65, -2.85], [1.75, -2.8], [1.85, -1.75], [-2.75, -1.7]]);

// o: { toe: tone, lace: colour, collar: tone }
export function boot(g, ctx, upper, sole, o = {}) {
  const t = ctx.t;
  cel(g, BOOT, t(upper), { sh: 0.9, hl: 0.4 });
  clip(g, BOOT, () => {
    // tongue and lace run up the instep
    stroke(g, 'M 1.0 -1.8 C 1.7 -0.9 2.6 -0.2 3.7 0.35', t(upper).k, 0.3);
    for (let i = 0; i < 4; i++) stroke(g, `M ${1.0 + i * 0.75} ${-1.35 + i * 0.5} l 0.75 -0.5`, o.lace || t(upper).l, 0.28);
    // heel counter
    fill(g, 'M -3.2 -0.4 C -2.2 -0.2 -1.0 0.2 -0.4 1.6 L -3.2 1.6 Z', t(upper).d, 0.85);
  });
  cel(g, TOE, t(o.toe || upper), { sh: 0.45, hl: 0.3, lw: 0.26 });
  cel(g, SOLE, t(sole), { sh: 0.3, hl: 0.18 });
  clip(g, SOLE, () => { for (let x = -2.2; x < 7; x += 1.25) fill(g, `M ${x} 2.15 L ${x + 0.6} 2.15 L ${x + 0.6} 2.6 L ${x} 2.6 Z`, t(sole).k, 0.55); });
  if (o.collar) cel(g, COLLAR, t(o.collar), { sh: 0.3, hl: 0.2, lw: 0.26 });
}
// Boot shaft over the bottom of the shin (shin frame).
export const BOOT_SHAFT = blob([[-2.6, 9.6], [2.45, 9.4], [2.55, 12.6], [2.6, 15.0], [-2.65, 15.1], [-2.8, 12.4]]);

// --- knee and elbow pads (they ride on the lower bone so they follow the joint)
export const KNEE_PAD = blob([[-0.6, -2.6], [2.2, -2.4], [3.45, 0.3], [3.15, 3.5], [0.9, 4.4], [-0.6, 2.4], [-0.9, -0.2]]);
export const ELBOW_PAD = blob([[-2.9, -1.4], [-0.6, -1.9], [0.6, -0.4], [0.3, 2.0], [-1.9, 2.6], [-3.0, 1.0]]);

export function kneePad(g, ctx, mat, stripe) {
  const t = ctx.t;
  cel(g, KNEE_PAD, t(mat), { sh: 0.7, hl: 0.4 });
  clip(g, KNEE_PAD, () => {
    stroke(g, curve([[0.0, -1.2], [2.0, -0.9], [2.9, 0.8]]), t(mat).l, 0.3, 0.8);
    if (stripe) fill(g, 'M -2 1.0 L 4 0.7 L 4 1.75 L -2 2.05 Z', t(stripe).m);
  });
  // strap around the back of the knee
  stroke(g, 'M -0.7 1.0 C -1.6 1.1 -2.2 1.3 -2.5 1.6', t(mat).k, 0.55);
}

// --- torso ------------------------------------------------------------------
// The torso under the clothes: trapezius, deltoid line, chest, V to the waist.
export const TORSO = blob([
  [-2.0, -23.3], [-5.0, -22.7], [-7.6, -21.5], [-8.5, -19.3], [-8.1, -15.8], [-6.7, -12.0], [-5.6, -8.8], [-5.8, -5.2],
  [-5.6, -3.6], [5.3, -3.8], [5.1, -6.2], [4.9, -9.0], [5.7, -12.6], [6.5, -16.4], [6.1, -19.8], [3.9, -22.4], [1.2, -23.6],
]);
// Pelvis and seat under the belt.
export const PELVIS = blob([[-5.9, -5.0], [5.5, -5.1], [5.7, -1.2], [3.8, 1.4], [0.4, 2.2], [-3.6, 1.6], [-5.9, -0.8]]);
// Belt band.
export const BELT = 'M -6.0 -5.4 C -1.2 -5.75 2.6 -5.75 5.7 -5.5 L 5.75 -3.6 C 2.6 -3.85 -1.2 -3.85 -6.05 -3.5 Z';

// A plate carrier / chest rig over the torso. o: { mat, strap, pouch, flap, accent }
export const CARRIER = blob([[-2.2, -20.4], [1.2, -20.6], [4.6, -19.8], [6.9, -16.8], [6.6, -12.6], [5.8, -9.2], [-1.0, -8.6], [-3.6, -9.6], [-4.2, -14.2], [-3.6, -18.4]]);
export function carrier(g, o) {
  const m = o.mat;
  // shoulder strap over the near trapezius and the cummerbund wrap behind
  const STRAP = blob([[-3.4, -20.2], [-1.6, -21.0], [0.2, -23.2], [-1.6, -23.6], [-3.4, -22.2], [-4.6, -20.4]]);
  cel(g, STRAP, o.strap || m, { sh: 0.4, hl: 0.2 });
  const CUMMER = blob([[-6.4, -12.6], [-3.8, -13.0], [-3.0, -8.8], [-5.8, -8.2], [-6.9, -9.8]]);
  cel(g, CUMMER, m, { sh: 0.6, hl: 0.25 });
  cel(g, CARRIER, m, { sh: 1.2, hl: 0.45 });
  clip(g, CARRIER, () => {
    // plate edge and MOLLE rows
    stroke(g, curve([[-2.8, -19.6], [1.6, -19.8], [5.2, -18.6]]), m.l, 0.3, 0.8);
    for (let y = -17.4; y < -13; y += 1.3) stroke(g, `M -2.6 ${y} L 6.4 ${y + 0.3}`, m.d, 0.32);
    if (o.accent) fill(g, 'M 0.4 -18.4 L 3.6 -18.2 L 3.5 -17.2 L 0.3 -17.4 Z', o.accent.m);
  });
  // three magazine pouches on the lower front
  const P = o.pouch || m, F = o.flap || m;
  for (let i = 0; i < 3; i++) {
    const x = -2.4 + i * 2.7;
    const pouch = `M ${x} -13.0 L ${x + 2.45} -13.1 L ${x + 2.5} -8.9 C ${x + 1.6} -8.6 ${x + 0.8} -8.6 ${x - 0.05} -8.9 Z`;
    cel(g, pouch, P, { sh: 0.5, hl: 0.25, lw: 0.28 });
    const flap = `M ${x - 0.15} -13.4 L ${x + 2.6} -13.5 L ${x + 2.55} -11.6 C ${x + 1.7} -11.2 ${x + 0.8} -11.2 ${x - 0.1} -11.5 Z`;
    cel(g, flap, F, { sh: 0.35, hl: 0.2, lw: 0.26 });
    fill(g, `M ${x + 0.85} -11.9 L ${x + 1.65} -11.95 L ${x + 1.65} -11.35 L ${x + 0.85} -11.3 Z`, (o.accent || F).m);
  }
}

// Belt with a buckle and a pouch on the near hip. o: { belt, buckle, pouch }
export function belt(g, o) {
  cel(g, BELT, o.belt, { sh: 0.45, hl: 0.22 });
  for (const x of [-3.9, 0.0]) fill(g, `M ${x} -5.7 L ${x + 0.7} -5.75 L ${x + 0.7} -3.4 L ${x} -3.35 Z`, o.belt.k);
  cel(g, 'M 2.7 -5.95 L 5.0 -6.0 L 5.0 -3.35 L 2.7 -3.3 Z', o.buckle, { sh: 0.3, hl: 0.25, lw: 0.26 });
  fill(g, 'M 3.3 -5.35 L 4.4 -5.38 L 4.4 -3.95 L 3.3 -3.92 Z', o.belt.m);
  if (o.pouch) {
    const POUCH = blob([[-6.6, -5.4], [-3.8, -5.5], [-3.6, -1.2], [-4.4, -0.4], [-6.2, -0.6], [-6.8, -2.6]]);
    cel(g, POUCH, o.pouch, { sh: 0.6, hl: 0.3 });
    stroke(g, 'M -6.5 -3.6 C -5.6 -3.3 -4.6 -3.3 -3.7 -3.7', o.pouch.k, 0.3);
  }
}

// Fabric fold strokes inside a shape (light and dark pair).
export function fold(g, pts, t, w = 0.3) {
  stroke(g, curve(pts), t.d, w);
  stroke(g, curve(pts.map(([x, y]) => [x + 0.35, y - 0.2])), t.l, w * 0.6, 0.55);
}

export { cel, fill, stroke, clip, blob, curve };

// The head volume under a balaclava or hood (head frame: origin at the neck
// base, facing +x; chin at about y -1.6, crown at about -10.2).
// jaw: 0 (narrow) ... 1 (square)
export function headShape({ jaw = 1 } = {}) {
  const cx = 3.25 + jaw * 0.25, cy = -1.75 + jaw * 0.05;
  return blob([
    [-3.7, -6.2], [-3.2, -8.8], [-1.0, -10.2], [1.8, -10.1], [3.6, -8.8], [4.05, -7.2],
    [3.85, -6.5], [4.1, -6.05], [4.95, -4.95], [4.35, -4.55],
    [4.45, -3.95], [4.25, -3.3], [4.2 + jaw * 0.15, -2.5], [cx, cy],
    [1.6 + jaw * 0.2, -1.8 + jaw * 0.05], [-0.1 - jaw * 0.3, -2.7], [-1.9, -3.4], [-3.1, -4.4],
  ]);
}
