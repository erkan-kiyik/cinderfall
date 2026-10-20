// KOR — character skeleton and figure assembly.
//
// Units: a character is 64 tall, feet on y = 0, y grows downward. Characters
// face +x in a three-quarter view: the near arm and leg (closer to the camera)
// sit toward -x and are drawn in front, the far ones toward +x and behind.
//
// Every part is painted in its bone's own frame:
//   limbs   origin at the proximal joint, bone along +y, +x = the bone's front
//   torso   origin at the hip centre, up is -y
//   head    origin at the base of the neck, up is -y
//   foot    origin at the ankle, level with the ground, toes toward +x
// so the same painters drive the in-game rig later.
import { setRoot, softMarks, canvas, volume, ppu } from './kit.js';

export const SK = {
  thigh: 15.2, shin: 14.4, upper: 11.6, fore: 10.4,
  ankleH: 2.5,
  nearHip: [-2.4, -0.6], farHip: [2.3, -0.9],
  // body standard v2 (ops/body.js): a longer torso, shoulders set wider and
  // higher, the neck higher so the smaller head sits at about 1/7
  nearSh: [-6.6, -21.0], farSh: [4.2, -21.4],
  neck: [0.6, -23.4],
};

const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
// End of a bone of length L hanging from (x, y) and rotated by a (0 = straight down).
const end = (x, y, L, a) => { const [dx, dy] = rot(0, L, a); return [x + dx, y + dy]; };

// Pose angles in radians, measured from straight down; positive swings the
// limb toward -x (backward). Torso lean and head tilt: positive = back.
export const IDLE = {
  lean: 0, head: 0,
  nThigh: 0.10, nShin: -0.02, fThigh: -0.16, fShin: -0.10,
  nUpper: 0.18, nFore: -0.12, nHand: -0.05,
  fUpper: -0.12, fFore: -0.32, fHand: -0.2,
};

// Angle (our convention) of the direction (dx, dy).
const angOf = (dx, dy) => Math.atan2(-dx, dy);

// Two-bone IK: upper/fore angles that put the wrist on target. bend = +1
// bends the elbow toward -x/down of the reach line, -1 the other way.
export function ik(sh, target, L1, L2, bend = 1) {
  let dx = target[0] - sh[0], dy = target[1] - sh[1];
  let d = Math.hypot(dx, dy);
  const max = L1 + L2 - 0.05;
  if (d > max) { dx *= max / d; dy *= max / d; d = max; }
  const base = angOf(dx, dy);
  const c = Math.min(1, Math.max(-1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
  const up = base + bend * Math.acos(c);
  const e = end(sh[0], sh[1], L1, up);
  return [up, angOf(sh[0] + dx - e[0], sh[1] + dy - e[1])];
}

// World transform of a held weapon: gripA at `at`, rotated by `ang`, scaled.
export function gunPoint(gun, [x, y]) {
  const c = Math.cos(gun.ang), sn = Math.sin(gun.ang), k = gun.k ?? 1;
  return [gun.at[0] + (x * c - y * sn) * k, gun.at[1] + (x * sn + y * c) * k];
}

export function solve(pose) {
  const p = { ...IDLE, ...pose };
  const tor = (pt) => { const [x, y] = rot(pt[0], pt[1], -p.lean); return [x, y]; };
  const nh = tor(SK.nearHip), fh = tor(SK.farHip);
  const nk = end(nh[0], nh[1], SK.thigh, p.nThigh), na = end(nk[0], nk[1], SK.shin, p.nShin);
  const fk = end(fh[0], fh[1], SK.thigh, p.fThigh), fa = end(fk[0], fk[1], SK.shin, p.fShin);
  const hipY = -SK.ankleH - Math.max(na[1], fa[1]);
  const off = ([x, y]) => [x + (p.hipX || 0), y + hipY];
  const ns = off(tor(SK.nearSh)), fs = off(tor(SK.farSh));
  if (p.gun) {
    // hands onto the weapon: trigger hand (near) to gripA, support (far) to gripB
    const g = p.gun, A = gunPoint(g, g.wA ?? [-0.9, -1.4]), B = gunPoint(g, g.wB ?? [g.w.gripB[0] - 1.4, g.w.gripB[1] + 0.6]);
    [p.nUpper, p.nFore] = ik(ns, A, SK.upper, SK.fore, g.bendN ?? 1);
    [p.fUpper, p.fFore] = ik(fs, B, SK.upper, SK.fore, g.bendF ?? 1);
    p.nHand = g.ang + (g.handN ?? 0.2) - p.nFore;
    p.fHand = (g.ang + (g.handF ?? -1.2)) - p.fFore;
  }
  const ne = end(ns[0], ns[1], SK.upper, p.nUpper), nw = end(ne[0], ne[1], SK.fore, p.nFore);
  const fe = end(fs[0], fs[1], SK.upper, p.fUpper), fw = end(fe[0], fe[1], SK.fore, p.fFore);
  return {
    p, hip: off([0, 0]), neck: off(tor(SK.neck)),
    nHip: off(nh), nKnee: off(nk), nAnkle: off(na), fHip: off(fh), fKnee: off(fk), fAnkle: off(fa),
    nSh: ns, nElb: ne, nWr: nw, fSh: fs, fElb: fe, fWr: fw,
  };
}

// Darker variant of a tone for the far side of the body.
const darker = (t) => ({ l: t.m, m: t.d, d: t.k, k: t.k });

function at(g, [x, y], a, fn) {
  g.save(); g.translate(x, y); g.rotate(a); fn(); g.restore();
}
// paint one part on its own canvas, round it (kit.volume), then lay it on the figure
function part(g, paint, ctx) {
  const c = g.canvas, M = g.getTransform();
  const pc = canvas(c.width, c.height), pg = pc.getContext('2d');
  pg.setTransform(M); paint(pg, ctx);
  volume(pc, 1.8 * ppu(g));
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(pc, 0, 0); g.restore();
}

// Draw an operator spec in its pose. `op.parts` holds painters; any missing
// part is skipped. Painters receive (g, ctx) where ctx.t(tone) darkens tones
// on the far side and ctx.far tells which side is being drawn.
export function drawFigure(g, op, pose = op.pose, flip = false) {
  // painted, never inked: soft marks on for the figure (docs §11)
  const was = softMarks(true);
  try { paintFigure(g, op, pose, flip); } finally { softMarks(was); }
}

function paintFigure(g, op, pose, flip) {
  // the light is fixed in the world, so take the root before any mirroring
  setRoot(g);
  if (flip) g.scale(-1, 1);
  const J = solve(pose), p = J.p, P = op.parts;
  const near = { far: false, t: (t) => t, J };
  const far = { far: true, t: darker, J };
  const torso = (fn, ctx = near) => fn && at(g, J.hip, -p.lean, () => part(g, fn, ctx));
  const arm = (side, ctx) => {
    const s = side === 'n';
    const sh = s ? J.nSh : J.fSh, el = s ? J.nElb : J.fElb, wr = s ? J.nWr : J.fWr;
    const u = s ? p.nUpper : p.fUpper, f = s ? p.nFore : p.fFore, h = s ? p.nHand : p.fHand;
    if (P.upper) at(g, sh, u, () => part(g, P.upper, ctx));
    if (P.fore) at(g, el, f, () => part(g, P.fore, ctx));
    if (P.hand) at(g, wr, f + h, () => part(g, P.hand, ctx));
  };
  const leg = (side, ctx) => {
    const s = side === 'n';
    const hp = s ? J.nHip : J.fHip, kn = s ? J.nKnee : J.fKnee, an = s ? J.nAnkle : J.fAnkle;
    const th = s ? p.nThigh : p.fThigh, sn = s ? p.nShin : p.fShin;
    if (P.thigh) at(g, hp, th, () => part(g, P.thigh, ctx));
    if (P.shin) at(g, kn, sn, () => part(g, P.shin, ctx));
    if (P.foot) at(g, an, 0, () => part(g, P.foot, ctx));
  };
  torso(P.backFar, far);
  arm('f', far);
  leg('f', far);
  leg('n', near);
  torso(P.torso);
  if (P.head) at(g, J.neck, -p.lean - p.head, () => part(g, P.head, near));
  torso(P.chest);
  if (p.gun) {
    // weapon between the far (support) arm and the near (trigger) arm
    const g0 = p.gun;
    g.save(); g.translate(g0.at[0], g0.at[1]); g.rotate(g0.ang); g.scale(g0.k ?? 1, g0.k ?? 1);
    // the weapon is machined: its edges stay crisp
    const w0 = softMarks(false); g0.w.paint(g, g0.mat); softMarks(w0); g.restore();
  }
  arm('n', near);
  torso(P.front);
}
