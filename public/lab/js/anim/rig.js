// CINDERFALL LAB — runtime rig.
//
// Same skeleton and part frames as art/figure.js (so every M0 painter works
// unchanged), solved every frame without allocating. Everything is in the
// character's local "facing right" space: root (0, 0) is the ground point
// under the hips; y grows downward. Facing left is a mirror applied when the
// character is drawn.
//
// Inputs are a Pose: hip offset, torso lean, head tilt, ankle targets for both
// feet (legs solve by two-bone IK with the knee forward), and either arm
// angles or a held weapon (both arms IK onto its grips).
import { SK } from '../art/figure.js';

export { SK };

// angle (our convention: 0 = hanging straight down, + swings toward −x) of (dx, dy)
const angOf = (dx, dy) => Math.atan2(-dx, dy);

// Two-bone IK into out[0..1] (upper, lower angles). bend +1 puts the middle
// joint toward −x/down of the reach line (elbows), −1 the other way (knees).
export function ik2(sx, sy, tx, ty, L1, L2, bend, out) {
  let dx = tx - sx, dy = ty - sy;
  let d = Math.hypot(dx, dy);
  const max = L1 + L2 - 0.02, min = Math.abs(L1 - L2) + 0.02;
  if (d > max) { dx *= max / d; dy *= max / d; d = max; } else if (d < min) { const k = min / Math.max(d, 1e-4); dx *= k; dy *= k; d = min; }
  const base = angOf(dx, dy);
  const c = Math.min(1, Math.max(-1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
  const a1 = base + bend * Math.acos(c);
  const ex = sx - L1 * Math.sin(a1), ey = sy + L1 * Math.cos(a1);
  out[0] = a1; out[1] = angOf(sx + dx - ex, sy + dy - ey);
}

export class Pose {
  constructor() {
    this.hipX = 0; this.hipY = -31.3; this.lean = 0; this.head = 0;
    // ankle targets (local space) and foot pitch
    this.nAx = -2.6; this.nAy = -2.5; this.fAx = 3.6; this.fAy = -2.5; this.nFoot = 0; this.fFoot = 0;
    // free arms (used when no weapon is held)
    this.nUpper = 0.18; this.nFore = -0.12; this.nHand = -0.05;
    this.fUpper = -0.12; this.fFore = -0.32; this.fHand = -0.2;
    // held weapon: gripA position, angle, scale; hand targets in weapon space
    this.gun = null; this.gx = 0; this.gy = 0; this.ga = 0; this.gk = 1;
    this.wAx = -0.9; this.wAy = -1.4; this.wBx = 0; this.wBy = 0;
    this.handN = 0.2; this.handF = -1.2;
    this.supportFree = false; // pistols one-handed, ladders: far arm uses FK
    // free hands reaching for targets (ladder rungs, ledges) instead of FK
    this.reach = false; this.nHx = 0; this.nHy = 0; this.fHx = 0; this.fHy = 0;
  }
}

// Solved joints: positions and bone angles, reused every frame.
export class Joints {
  constructor() {
    const v = () => new Float32Array(2);
    this.hip = v(); this.neck = v();
    this.nHip = v(); this.nKnee = v(); this.nAnkle = v(); this.fHip = v(); this.fKnee = v(); this.fAnkle = v();
    this.nSh = v(); this.nElb = v(); this.nWr = v(); this.fSh = v(); this.fElb = v(); this.fWr = v();
    this.a = { torso: 0, head: 0, nThigh: 0, nShin: 0, fThigh: 0, fShin: 0, nUpper: 0, nFore: 0, nHand: 0, fUpper: 0, fFore: 0, fHand: 0, nFoot: 0, fFoot: 0 };
    this._t = new Float32Array(2);
  }
}

function torsoPt(J, pt, lean, out) {
  const c = Math.cos(-lean), s = Math.sin(-lean);
  out[0] = J.hip[0] + pt[0] * c - pt[1] * s;
  out[1] = J.hip[1] + pt[0] * s + pt[1] * c;
}
function endOf(p, L, a, out) { out[0] = p[0] - L * Math.sin(a); out[1] = p[1] + L * Math.cos(a); }

export function solvePose(P, J) {
  const A = J.a, t = J._t;
  J.hip[0] = P.hipX; J.hip[1] = P.hipY;
  A.torso = -P.lean; A.head = -P.lean - P.head;
  torsoPt(J, SK.nearHip, P.lean, J.nHip); torsoPt(J, SK.farHip, P.lean, J.fHip);
  torsoPt(J, SK.nearSh, P.lean, J.nSh); torsoPt(J, SK.farSh, P.lean, J.fSh);
  torsoPt(J, SK.neck, P.lean, J.neck);
  // legs: knees forward
  ik2(J.nHip[0], J.nHip[1], P.nAx, P.nAy, SK.thigh, SK.shin, -1, t); A.nThigh = t[0]; A.nShin = t[1];
  ik2(J.fHip[0], J.fHip[1], P.fAx, P.fAy, SK.thigh, SK.shin, -1, t); A.fThigh = t[0]; A.fShin = t[1];
  endOf(J.nHip, SK.thigh, A.nThigh, J.nKnee); endOf(J.nKnee, SK.shin, A.nShin, J.nAnkle);
  endOf(J.fHip, SK.thigh, A.fThigh, J.fKnee); endOf(J.fKnee, SK.shin, A.fShin, J.fAnkle);
  A.nFoot = P.nFoot; A.fFoot = P.fFoot;
  // arms
  if (P.gun) {
    const c = Math.cos(P.ga), s = Math.sin(P.ga), k = P.gk;
    const ax = P.gx + (P.wAx * c - P.wAy * s) * k, ay = P.gy + (P.wAx * s + P.wAy * c) * k;
    ik2(J.nSh[0], J.nSh[1], ax, ay, SK.upper, SK.fore, 1, t); A.nUpper = t[0]; A.nFore = t[1];
    A.nHand = P.ga + P.handN - A.nFore;
    if (!P.supportFree) {
      const bx = P.gx + (P.wBx * c - P.wBy * s) * k, by = P.gy + (P.wBx * s + P.wBy * c) * k;
      ik2(J.fSh[0], J.fSh[1], bx, by, SK.upper, SK.fore, 1, t); A.fUpper = t[0]; A.fFore = t[1];
      A.fHand = P.ga + P.handF - A.fFore;
    } else { A.fUpper = P.fUpper; A.fFore = P.fFore; A.fHand = P.fHand; }
  } else if (P.reach) {
    ik2(J.nSh[0], J.nSh[1], P.nHx, P.nHy, SK.upper, SK.fore, 1, t); A.nUpper = t[0]; A.nFore = t[1]; A.nHand = P.nHand;
    ik2(J.fSh[0], J.fSh[1], P.fHx, P.fHy, SK.upper, SK.fore, 1, t); A.fUpper = t[0]; A.fFore = t[1]; A.fHand = P.fHand;
  } else {
    A.nUpper = P.nUpper; A.nFore = P.nFore; A.nHand = P.nHand;
    A.fUpper = P.fUpper; A.fFore = P.fFore; A.fHand = P.fHand;
  }
  endOf(J.nSh, SK.upper, A.nUpper, J.nElb); endOf(J.nElb, SK.fore, A.nFore, J.nWr);
  endOf(J.fSh, SK.upper, A.fUpper, J.fElb); endOf(J.fElb, SK.fore, A.fFore, J.fWr);
}

// Weapon hold data, in weapon space (origin = gripA, +x muzzle).
//   stock: point that sits in the shoulder pocket (rifles)
//   wB: support hand target; style: 'rifle' | 'pistol'
export const HOLD = {
  kestrel: { stock: [-16.2, -1.4], wB: [10.6, 0.0], style: 'rifle', k: 0.96 },
  ramrod: { stock: [-17.8, -0.6], wB: [12.4, 1.4], style: 'rifle', k: 0.96, handF: -1.35 },
  marksman: { stock: [-20.0, -1.4], wB: [14.6, -0.4], style: 'rifle', k: 0.94 },
  wren9: { stock: null, wB: [0.2, 1.6], style: 'pistol', k: 1.15, handF: -0.2 },
};
