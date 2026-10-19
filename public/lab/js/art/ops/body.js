// KOR LAB — the operator body standard (v2).
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
import { Brush, rnd } from '../paint.js';

// Heads drawn for the old 64-unit figure are painted at this scale: with the
// higher neck they land at ~1/7.
export const HEAD_K = 0.8;
export function scaledHead(g, fn) { g.save(); g.scale(HEAD_K, HEAD_K); fn(); g.restore(); }

// --- limb forms -------------------------------------------------------------
// v3 (docs §10.1): real proportions, the limbs slimmer than the heroic v2.
// upper arm: round deltoid cap, biceps on the front, triceps behind
export const UPPER = limb(11.6, [[0, 2.7], [0.18, 2.68], [0.45, 2.42], [0.75, 2.05], [1, 1.88]], [[0, 2.75], [0.25, 2.65], [0.55, 2.38], [0.85, 1.95], [1, 1.85]], 0.6, 0.5);
// forearm: thick below the elbow, tapering to the wrist
export const FORE = limb(10.4, [[0, 1.98], [0.22, 2.16], [0.55, 1.88], [1, 1.48]], [[0, 1.94], [0.2, 2.2], [0.5, 1.92], [1, 1.44]], 0.5, 0.4);
// thigh: full at the hip, quad on the front, narrowing to the knee
export const THIGH = limb(15.2, [[0, 3.6], [0.3, 3.52], [0.65, 2.98], [1, 2.42]], [[0, 3.72], [0.25, 3.66], [0.7, 2.76], [1, 2.38]], 0.45, 0.5);
// shin: the calf swells behind, the shin bone stays straight in front
export const SHIN = limb(14.4, [[0, 2.38], [0.3, 2.22], [0.7, 1.94], [1, 1.84]], [[0, 2.32], [0.22, 2.82], [0.5, 2.58], [0.8, 1.98], [1, 1.84]], 0.5, 0.4);

// --- gloves -----------------------------------------------------------------
// A bigger, squarer hand along +y from the wrist; thumb on the front (+x).
const PALM = blob([[-1.75, -0.6], [1.7, -0.6], [2.15, 1.7], [2.05, 3.7], [1.25, 5.3], [-0.55, 5.45], [-1.85, 4.0], [-2.05, 1.5]]);
const THUMB = blob([[1.1, 0.9], [2.85, 1.4], [3.35, 3.2], [2.6, 4.05], [1.45, 3.0]]);
const KNUCKLE = blob([[-1.6, 2.55], [1.85, 2.4], [1.9, 3.75], [-1.55, 3.95]]);
const CUFF = blob([[-2.0, -1.4], [1.95, -1.4], [2.1, 0.9], [-2.15, 0.9]]);

// o: { cuff: tone, knuckle: tone, fingerless: skin tone }
export function glove(g, ctx, mat, o = {}) {
  const t = ctx.t;
  // a real hand: about three quarters of the face's height (docs §11)
  g.save(); g.scale(0.76, 0.8);
  if (ctx.far) cel(g, THUMB, t(mat), { sh: 0.6, hl: 0.25 });
  cel(g, PALM, t(mat), { sh: 0.9, hl: 0.35 });
  clip(g, PALM, () => {
    // four fingers curled round the grip, each its own rounded form with the dark
    // between them; the knuckles' ridge catching the light across the back
    for (let i = 0; i < 4; i++) {
      const x = -2.05 + i * 1.03, y0 = 2.55 + (i === 0 ? 0.15 : 0), y1 = 5.6 - Math.abs(i - 1.5) * 0.18;
      const F = `M ${x + 0.52} ${y0} C ${x + 1.1} ${y0} ${x + 1.12} ${y0 + 0.6} ${x + 1.12} ${y0 + 1} L ${x + 1.08} ${y1 - 0.5} C ${x + 1.06} ${y1 + 0.05} ${x - 0.02} ${y1 + 0.05} ${x - 0.04} ${y1 - 0.5} L ${x - 0.08} ${y0 + 1} C ${x - 0.08} ${y0 + 0.6} ${x - 0.06} ${y0} ${x + 0.52} ${y0} Z`;
      cel(g, F, t(mat), { sh: 0.35, hl: 0.28, ao: 0.75, bounce: 0.15 });
      if (o.fingerless) clip(g, `M -3 3.9 L 3 3.7 L 3 7 L -3 7 Z`, () => cel(g, F, t(o.fingerless), { sh: 0.35, hl: 0.25, ao: 0.6 }));
    }
    stroke(g, 'M -1.9 2.7 C -0.6 2.45 0.8 2.4 2.0 2.55', t(mat).l, 0.22, 0.45);
    stroke(g, 'M -1.9 2.95 C -0.6 2.7 0.8 2.65 2.0 2.8', t(mat).k, 0.14, 0.35);
  });
  if (o.knuckle) cel(g, KNUCKLE, t(o.knuckle), { sh: 0.35, hl: 0.2, lw: 0.26 });
  if (!ctx.far) cel(g, THUMB, t(mat), { sh: 0.6, hl: 0.25 });
  if (o.cuff) cel(g, CUFF, t(o.cuff), { sh: 0.4, hl: 0.25, lw: 0.28 });
  g.restore();
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
  g.save(); g.translate(0.3, 0.4); g.scale(0.84, 0.84);
  cel(g, KNEE_PAD, t(mat), { sh: 0.7, hl: 0.4 });
  clip(g, KNEE_PAD, () => {
    stroke(g, curve([[0.0, -1.2], [2.0, -0.9], [2.9, 0.8]]), t(mat).l, 0.3, 0.8);
    if (stripe) fill(g, 'M -2 1.0 L 4 0.7 L 4 1.75 L -2 2.05 Z', t(stripe).m);
  });
  // strap around the back of the knee
  stroke(g, 'M -0.7 1.0 C -1.6 1.1 -2.2 1.3 -2.5 1.6', t(mat).k, 0.55);
  g.restore();
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

// The cells' mark: a band of dark cloth round the left upper arm with an ember
// sewn on it, the same place and size on everyone (upper-arm frame). `band`
// is the cloth tone, already darkened for the far side if need be.
const BAND = 'M -3.4 3.3 C -1.2 3.75 1.2 3.7 3.4 3.2 L 3.3 5.7 C 1.2 6.2 -1.2 6.2 -3.3 5.8 Z';
const EMBER = blob([[0.15, 4.45], [0.75, 3.8], [1.55, 3.9], [2.05, 4.55], [1.75, 5.3], [0.9, 5.55], [0.3, 5.2]], 0.8);
export function korBand(g, band) {
  clip(g, UPPER, () => {
    cel(g, BAND, band, { sh: 0.5, hl: 0.2, lw: 0.26 });
    stroke(g, 'M -3.4 3.75 C -1.2 4.2 1.2 4.15 3.4 3.65', band.l, 0.12, 0.6);
    stroke(g, 'M -3.3 5.35 C -1.2 5.75 1.2 5.75 3.3 5.25', band.l, 0.12, 0.6);
  });
  fill(g, EMBER, '#a8331a');
  fill(g, 'M 0.55 4.6 C 0.8 4.05 1.4 4.0 1.75 4.5 C 1.7 5.0 1.2 5.25 0.8 5.15 Z', '#ff7a2e');
  fill(g, 'M 0.95 4.55 C 1.1 4.35 1.35 4.35 1.45 4.6 C 1.35 4.8 1.1 4.85 0.95 4.55 Z', '#ffd08a');
}

// --- details (docs §10.1) -----------------------------------------------------
// A line of stitches along a path.
export function stitch(g, d, c, w = 0.13, a = 0.85) {
  g.save(); g.setLineDash([0.34, 0.26]); stroke(g, d, c, w, a); g.restore();
}
// A rivet or a screw head with its glint.
export function rivet(g, x, y, r, t) {
  fill(g, `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`, t.d);
  fill(g, `M ${x - r * 0.75} ${y - r * 0.1} a ${r * 0.75} ${r * 0.75} 0 1 0 ${1.5 * r} 0 a ${r * 0.75} ${r * 0.75} 0 1 0 ${-1.5 * r} 0 Z`, t.m);
  fill(g, `M ${x - r * 0.35} ${y - r * 0.35} a ${r * 0.28} ${r * 0.28} 0 1 0 ${0.56 * r} 0 a ${r * 0.28} ${r * 0.28} 0 1 0 ${-0.56 * r} 0 Z`, t.l, 0.9);
}
// A roller buckle (a metal frame with its pin) at x, y, w × h.
export function buckle(g, x, y, w, h, t) {
  const d = `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
  stroke(g, d, t.k, 0.5); stroke(g, d, t.m, 0.3); stroke(g, `M ${x + 0.12} ${y + 0.1} L ${x + w - 0.12} ${y + 0.1}`, t.l, 0.12, 0.9);
  stroke(g, `M ${x + w * 0.5} ${y} L ${x + w * 0.5} ${y + h}`, t.d, 0.18);
}
// Grime toward the bottom of what is clipped: a dark glaze from y0 (clean) to y1 (dirty).
export function grime(g, y0, y1, c = 'rgba(40,30,20,0.55)') {
  const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, c);
  // only over what is already painted: on bare canvas a multiply would print the rectangle itself
  g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = gr; g.fillRect(-60, y0, 120, y1 - y0 + 40); g.restore();
}
// Scuffs: small pale worn marks at the given points.
export function scuffs(g, pts, c, a = 0.5) {
  for (const [x, y, r = 0.3, ang = 0] of pts) { g.save(); g.translate(x, y); g.rotate(ang); fill(g, `M ${-r} 0 a ${r} ${r * 0.45} 0 1 0 ${2 * r} 0 a ${r} ${r * 0.45} 0 1 0 ${-2 * r} 0 Z`, c, a); g.restore(); }
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

// --- faces, painted (docs §11) --------------------------------------------------
// An eye painted with a soft brush instead of drawn: the socket's shadow, the
// white dimmed (it is never white), the iris and its catchlight, the upper
// lid's shadow across it, the lid line, the crease above, the lower lid
// catching a little light. (x, y) the eye's centre, w its width, head frame.
export function softEye(g, x, y, w = 1.6, o = {}) {
  const M = g.getTransform(), B = new Brush(g, Math.hypot(M.a, M.b)), h = w * 0.36;
  B.dab(x - w * 0.05, y - h * 0.4, w * 0.95, w * 0.62, o.socket ?? 'rgba(70,36,22,0.42)');
  const E = `M ${x - w / 2} ${y} C ${x - w * 0.2} ${y - h} ${x + w * 0.25} ${y - h} ${x + w / 2} ${y - h * 0.2} C ${x + w * 0.2} ${y + h * 0.62} ${x - w * 0.2} ${y + h * 0.62} ${x - w / 2} ${y} Z`;
  B.fill(E, o.white ?? '#c9beb1', w * 0.03);
  B.inside(E, () => {
    B.dab(x + w * 0.12, y - h * 0.12, w * 0.25, w * 0.25, o.iris ?? '#3a2a1f');
    B.dab(x + w * 0.12, y - h * 0.12, w * 0.11, w * 0.11, '#0b0807');
    B.fill(`M ${x - w} ${y - h * 2} L ${x + w} ${y - h * 2} L ${x + w} ${y - h * 0.3} L ${x - w} ${y - h * 0.2} Z`, 'rgba(30,16,10,0.5)', w * 0.08);
  });
  B.dab(x + w * 0.21, y - h * 0.3, w * 0.07, w * 0.055, '#fff2dc', 0.85);
  B.line(`M ${x - w / 2} ${y} C ${x - w * 0.2} ${y - h * 1.05} ${x + w * 0.25} ${y - h * 1.05} ${x + w / 2} ${y - h * 0.25}`, o.lid ?? 'rgba(22,11,8,0.9)', w * 0.1, w * 0.03);
  B.line(`M ${x - w * 0.42} ${y - h * 1.55} C ${x - w * 0.1} ${y - h * 2.1} ${x + w * 0.3} ${y - h * 2} ${x + w * 0.5} ${y - h * 1.3}`, 'rgba(70,36,22,0.35)', w * 0.06, w * 0.05);
  B.line(`M ${x - w * 0.38} ${y + h * 0.32} C ${x - w * 0.1} ${y + h * 0.75} ${x + w * 0.25} ${y + h * 0.7} ${x + w * 0.45} ${y + h * 0.1}`, 'rgba(255,222,192,0.28)', w * 0.05, w * 0.04);
}
// A brow: a soft mass and short hairs along it, lighter where it thins out.
export function softBrow(g, x0, y0, x1, y1, lift, col, seed = 3) {
  const M = g.getTransform(), B = new Brush(g, Math.hypot(M.a, M.b)), w = x1 - x0;
  const mid = (u) => [x0 + u * w, y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * lift];
  const [mx, my] = mid(0.5);
  B.line(`M ${x0} ${y0} Q ${mx} ${my - lift} ${x1} ${y1}`, col, w * 0.14, w * 0.05, 0.75);
  B.hairs(Math.round(w * 30), seed, (i, r) => {
    const u = r(), [x, y] = mid(u);
    return [x, y + (r() - 0.5) * w * 0.08, -0.35 - r() * 0.4, w * (0.08 + r() * 0.08), col, w * 0.025, 0.55 * (1 - u * 0.4)];
  });
}

// The neck: a column leaning up into the skull, not a cut polygon; the jaw's
// shade across its top, the key light down its front. `glaze` for bare skin.
export function neck(g, t, { wide = 0, sh = 0.8, glaze = false } = {}) {
  const l = -1.7 - wide, r = 2.0 + wide * 0.4;
  const d = `M ${l} 1.2 C ${l - 0.2} -0.6 ${l - 0.2} -2.6 ${l - 0.1} ${-4.3 - wide * 0.3} C -0.6 -4.1 0.5 -3.8 ${1.4 + wide * 0.5} -3.1 C ${r + 0.1} -2.2 ${r + 0.1} -0.4 ${r} 1.0 C 0.8 1.3 -0.5 1.3 ${l} 1.2 Z`;
  cel(g, d, t, { sh, hl: 0.25 });
  if (!glaze) return;
  const M = g.getTransform(), B = new Brush(g, Math.hypot(M.a, M.b));
  B.inside(d, () => {
    B.dab(0.6, -3.6, 2.8, 1.3, 'rgba(30,14,8,0.4)');
    B.dab(1.5, -0.8, 0.9, 1.9, 'rgba(255,224,196,0.16)');
    B.dab(-1.7, -1.2, 1.2, 2.8, 'rgba(20,10,6,0.25)');
    B.dab(0.4, -1.4, 0.5, 1.6, 'rgba(120,60,40,0.12)');
  });
}

// Skin glazed like a painting over the head shape (head frame, facing +x):
// the back of the skull away from the key light, the forehead and cheekbone
// toward it, the warmth of blood in the cheek, the temple's hollow.
export function skinGlaze(g, d, o = {}) {
  const M = g.getTransform(), B = new Brush(g, Math.hypot(M.a, M.b)), k = o.k ?? 1;
  B.inside(d, () => {
    B.dab(-3.2, -6.4, 3.8, 4.6, `rgba(50,26,16,${0.42 * k})`);
    B.dab(3.4, -8.7, 2.6, 1.5, `rgba(255,230,204,${0.26 * k})`);
    B.dab(3.2, -5.6, 1.7, 1.0, `rgba(255,226,198,${0.28 * k})`);
    B.dab(2.5, -4.9, 1.5, 1.1, `rgba(196,86,66,${0.13 * k})`);
    B.dab(1.5, -7.2, 1.0, 1.3, `rgba(70,36,22,${0.2 * k})`);
    B.dab(1.0, -2.6, 3.0, 1.2, `rgba(40,20,12,${0.3 * k})`);
  });
}
// Cloth folds (wool wound round a neck, a jacket's creases) over its shape d: each fold a soft
// trough of shade with the ridge above it catching the light; `folds` are point
// lists running along the wrap, `c` the cloth's tone.
export function clothFolds(g, d, folds, c) {
  const M = g.getTransform(), B = new Brush(g, Math.hypot(M.a, M.b));
  const path = (pts, dy = 0) => 'M ' + pts.map(([x, y], i) => (i ? 'L ' : '') + x + ' ' + (y + dy)).join(' ');
  B.inside(d, () => {
    for (const f of folds) {
      B.line(path(f), c.k, 0.46, 0.32, 0.68);
      B.line(path(f, -0.36), c.l, 0.26, 0.24, 0.38);
    }
  });
}

// Skin up close (head frame, facing +x): pores and fine blotches, the warm
// red where the light turns into shadow (light through skin), and the sheen
// of skin in the rain on the forehead, the cheekbone and the nose. `dark`
// for deep skin: the sheen reads stronger, the blotches weaker.
export function skinDetail(g, d, { seed = 9, dark = false } = {}) {
  const M = g.getTransform(), B = new Brush(g, Math.hypot(M.a, M.b)), r = rnd(seed);
  B.inside(d, () => {
    for (let i = 0; i < 220; i++) {
      const x = -1.5 + r() * 6.2, y = -10 + r() * 7.5;
      B.dab(x, y, 0.05 + r() * 0.07, 0.04 + r() * 0.06, r() < 0.6 ? `rgba(70,30,18,${dark ? 0.1 : 0.14})` : `rgba(255,226,200,${dark ? 0.06 : 0.1})`);
    }
    B.dab(-0.8, -6.6, 1.0, 3.2, 'rgba(190,60,40,0.16)');
    const sh = dark ? 0.32 : 0.2;
    B.dab(3.0, -9.0, 1.4, 0.5, `rgba(255,244,230,${sh})`, 1, 'source-over', -0.2);
    B.dab(3.3, -5.4, 0.9, 0.4, `rgba(255,240,224,${sh})`, 1, 'source-over', -0.4);
    B.dab(4.6, -5.6, 0.35, 0.3, `rgba(255,246,236,${sh * 1.3})`);
  });
}
// Hair as a soft mass combed in one direction: the shape filled and lit, then
// strands along (dx, dy), lighter on top where the key light catches.
export function softHair(g, d, col, light, dir = [-1, 0.25], n = 260, seed = 5) {
  const M = g.getTransform(), k = Math.hypot(M.a, M.b), B = new Brush(g, k), p = new Path2D(d);
  B.fill(d, col, 0.05);
  B.inside(d, () => { B.dab(1.5, -10, 4, 2.2, light, 0.45); B.dab(-3, -5.5, 3, 3, 'rgba(0,0,0,0.35)'); B.dab(-4.6, -9.2, 1.2, 0.9, light, 0.3); });
  const a = Math.atan2(dir[1], dir[0]), bb = [-7, -13, 6, -1];
  const inv = g.getTransform();
  // the strands stay inside the mass: hair has an edge, it does not spray
  B.inside(d, () => B.hairs(n, seed, (i, r) => {
    const x = bb[0] + r() * (bb[2] - bb[0]), y = bb[1] + r() * (bb[3] - bb[1]);
    const px = inv.a * x + inv.c * y + inv.e, py = inv.b * x + inv.d * y + inv.f;
    if (!g.isPointInPath(p, px, py)) return null;
    const lit = r() < 0.35 && y < -8.6;
    return [x, y, a + (r() - 0.5) * 0.3, 0.8 + r() * 1.4, lit ? light : r() < 0.5 ? col : 'rgba(0,0,0,0.55)', 0.06, lit ? 0.5 : 0.4];
  }));
}
