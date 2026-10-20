// KOR — verlet ragdoll for deaths.
//
// Starts from the solved skeleton at the moment of death, simulates a handful
// of points in world space (pelvis, neck, head, knees, ankles, elbows, wrists)
// under gravity against the tile level, and writes the result back into the
// same Joints the part sprites are drawn from: bone angles come from the
// points, positions are rebuilt by forward kinematics with the real bone
// lengths, so the sprites never stretch or come apart.
//
// The torso is a rigid stick (pelvis → neck); hips and shoulders hang off it.
// Knees and elbows are drawn with two-bone IK onto the simulated ankles and
// wrists, so they always bend the natural way; the head only nods.
import { SK } from '../art/figure.js';
import { ik2 } from './rig.js';

const PELVIS = 0, NECK = 1, HEAD = 2, NK = 3, NA = 4, FK = 5, FA = 6, NE = 7, NW = 8, FE = 9, FW = 10;
const N = 11;
const RADIUS = [5, 4.5, 5.5, 2.4, 2.2, 2.4, 2.2, 2.0, 1.8, 2.0, 1.8];
const GRAV = 1500, ITER = 6;
const REST_TORSO = Math.atan2(SK.neck[1], SK.neck[0]);

export class Ragdoll {
  // J: solved joints (local), f: facing, x/y: root (world), vx/vy: body velocity
  constructor(J, f, x, y, vx, vy) {
    this.f = f;
    this.x = new Float32Array(N); this.y = new Float32Array(N);
    this.ox = new Float32Array(N); this.oy = new Float32Array(N);
    const put = (i, p) => { this.x[i] = x + p[0] * f; this.y[i] = y + p[1]; };
    put(PELVIS, J.hip); put(NECK, J.neck);
    const ha = J.a.head; // head points up the neck by the head angle
    put(HEAD, [J.neck[0] + Math.sin(ha) * 9.6, J.neck[1] - Math.cos(ha) * 9.6]);
    put(NK, J.nKnee); put(NA, J.nAnkle); put(FK, J.fKnee); put(FA, J.fAnkle);
    put(NE, J.nElb); put(NW, J.nWr); put(FE, J.fElb); put(FW, J.fWr);
    const dt = 1 / 120;
    for (let i = 0; i < N; i++) { this.ox[i] = this.x[i] - vx * dt; this.oy[i] = this.y[i] - vy * dt; }
    this.len = {
      torso: Math.hypot(SK.neck[0], SK.neck[1]), head: 9.6,
      ph: Math.hypot(this.x[HEAD] - this.x[PELVIS], this.y[HEAD] - this.y[PELVIS]),
    };
    this.t = 0; this.rest = 0;
    this.d = new Float32Array(2);
  }

  // add velocity (units/s) at the point nearest to (px, py), and some to the body
  push(px, py, vx, vy) {
    let best = 0, bd = 1e9;
    for (let i = 0; i < N; i++) { const d = Math.hypot(this.x[i] - px, this.y[i] - py); if (d < bd) { bd = d; best = i; } }
    const dt = 1 / 120;
    for (let i = 0; i < N; i++) {
      const k = i === best ? 1 : i === PELVIS || i === NECK ? 0.45 : 0.25;
      this.ox[i] -= vx * k * dt; this.oy[i] -= vy * k * dt;
    }
  }

  // torso-derived joint (hip or shoulder) in world space
  tp(pt, out) {
    const ax = this.x[NECK] - this.x[PELVIS], ay = this.y[NECK] - this.y[PELVIS];
    const a = Math.atan2(ay, ax * this.f) - REST_TORSO; // local torso angle
    const c = Math.cos(a), s = Math.sin(a);
    out[0] = this.x[PELVIS] + (pt[0] * c - pt[1] * s) * this.f;
    out[1] = this.y[PELVIS] + pt[0] * s + pt[1] * c;
    return out;
  }

  // keep b at distance L from a; wa / wb: how much each end moves
  stick(a, b, L, wa, wb) {
    const dx = this.x[b] - this.x[a], dy = this.y[b] - this.y[a];
    const d = Math.hypot(dx, dy) || 1e-4, k = (d - L) / d;
    this.x[a] += dx * k * wa; this.y[a] += dy * k * wa;
    this.x[b] -= dx * k * wb; this.y[b] -= dy * k * wb;
  }
  // child point b hangs off a derived joint p (on the torso)
  hang(p, b, L, torsoEnd) {
    const dx = this.x[b] - p[0], dy = this.y[b] - p[1];
    const d = Math.hypot(dx, dy) || 1e-4, k = (d - L) / d;
    this.x[b] -= dx * k * 0.8; this.y[b] -= dy * k * 0.8;
    this.x[torsoEnd] += dx * k * 0.2; this.y[torsoEnd] += dy * k * 0.2;
  }
  // distance kept within [lo, hi]
  range(a, b, lo, hi) {
    const dx = this.x[b] - this.x[a], dy = this.y[b] - this.y[a], d = Math.hypot(dx, dy) || 1e-4;
    const L = d < lo ? lo : d > hi ? hi : d;
    if (L === d) return;
    const k = (d - L) / d * 0.5;
    this.x[a] += dx * k; this.y[a] += dy * k; this.x[b] -= dx * k; this.y[b] -= dy * k;
  }

  step(dt, level) {
    this.t += dt;
    const X = this.x, Y = this.y;
    let moved = 0;
    for (let i = 0; i < N; i++) {
      const vx = (X[i] - this.ox[i]) * 0.996, vy = (Y[i] - this.oy[i]) * 0.996;
      this.ox[i] = X[i]; this.oy[i] = Y[i];
      X[i] += vx; Y[i] += vy + GRAV * dt * dt;
      moved += Math.abs(vx) + Math.abs(vy);
    }
    const nh = this._nh || (this._nh = [0, 0]), fh = this._fh || (this._fh = [0, 0]);
    const ns = this._ns || (this._ns = [0, 0]), fs = this._fs || (this._fs = [0, 0]);
    for (let it = 0; it < ITER; it++) {
      this.stick(PELVIS, NECK, this.len.torso, 0.5, 0.5);
      this.stick(NECK, HEAD, this.len.head, 0.3, 0.7);
      this.tp(SK.nearHip, nh); this.tp(SK.farHip, fh); this.tp(SK.nearSh, ns); this.tp(SK.farSh, fs);
      this.hang(nh, NK, SK.thigh, PELVIS); this.hang(fh, FK, SK.thigh, PELVIS);
      this.stick(NK, NA, SK.shin, 0.5, 0.5); this.stick(FK, FA, SK.shin, 0.5, 0.5);
      this.hang(ns, NE, SK.upper, NECK); this.hang(fs, FE, SK.upper, NECK);
      this.stick(NE, NW, SK.fore, 0.5, 0.5); this.stick(FE, FW, SK.fore, 0.5, 0.5);
      // the head nods only a little: pelvis–head distance stays near its rest
      this.range(PELVIS, HEAD, this.len.ph - 4, this.len.ph + 0.5);
      this.collide(level);
    }
    this.collide(level, true);
    // speed limit: constraint fights never fling the body
    const VMAX = 900 * dt;
    for (let i = 0; i < N; i++) {
      const vx = X[i] - this.ox[i], vy = Y[i] - this.oy[i], v = Math.hypot(vx, vy);
      if (v > VMAX) { this.ox[i] = X[i] - (vx * VMAX) / v; this.oy[i] = Y[i] - (vy * VMAX) / v; }
    }
    this.rest = moved < 0.4 ? this.rest + dt : 0;
  }

  // Push points out of the floor. Moving a point changes its implied verlet
  // velocity, so the previous position is reset with it: a point that hits
  // the ground keeps at most a small bounce and never gets launched upward.
  collide(level, last = false) {
    if (!level) return;
    const X = this.x, Y = this.y;
    for (let i = 0; i < N; i++) {
      const r = RADIUS[i], x = X[i], y = Y[i];
      const s = level.surface(x - 0.5, x + 0.5, x, y - 24, y + r);
      if (s !== null && y > s - r - (last ? 0.3 : 0)) {
        if (y > s - r) {
          const vy = y - this.oy[i];
          Y[i] = s - r;
          this.oy[i] = Y[i] + Math.max(0, vy) * 0.12;
        }
        if (last) this.ox[i] = X[i] - (X[i] - this.ox[i]) * 0.82; // ground friction
      }
      if (level.solidBox(X[i] - 0.5, Y[i] - 0.5, X[i] + 0.5, Y[i] + 0.5)) { X[i] = this.ox[i]; }
    }
  }

  get settled() { return this.rest > 0.6; }

  // world root the character is drawn around
  root(out) { out[0] = this.x[PELVIS]; out[1] = this.y[PELVIS] + 31; return out; }
  // left, right and lowest point of the body (world), for its shadow on the ground
  extent(out) {
    let x0 = 1e9, x1 = -1e9, yb = -1e9;
    for (let i = 0; i < this.x.length; i++) { const x = this.x[i], y = this.y[i]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y > yb) yb = y; }
    out[0] = x0; out[1] = x1; out[2] = yb; return out;
  }

  // Write local-space joints (relative to the root (rx, ry)) for drawing.
  pose(J, rx, ry) {
    const f = this.f, X = this.x, Y = this.y, A = J.a;
    const L = (i, out) => { out[0] = (X[i] - rx) * f; out[1] = Y[i] - ry; return out; };
    const p = L(PELVIS, J.hip), q = [0, 0]; L(NECK, q);
    A.torso = Math.atan2(q[1] - p[1], q[0] - p[0]) - REST_TORSO;
    const c = Math.cos(A.torso), s = Math.sin(A.torso);
    const tp = (pt, out) => { out[0] = p[0] + pt[0] * c - pt[1] * s; out[1] = p[1] + pt[0] * s + pt[1] * c; };
    tp(SK.nearHip, J.nHip); tp(SK.farHip, J.fHip); tp(SK.nearSh, J.nSh); tp(SK.farSh, J.fSh); tp(SK.neck, J.neck);
    const h = [0, 0]; L(HEAD, h);
    A.head = Math.atan2(h[1] - J.neck[1], h[0] - J.neck[0]) + Math.PI / 2;
    // limbs: two-bone IK from the hip / shoulder to the simulated ankle /
    // wrist, so knees and elbows always bend the natural way on screen
    const t = [0, 0], q2 = this._q2 || (this._q2 = new Float32Array(2));
    const limb = (j0, i2, L1, L2, bend, j1, j2, k1, k2) => {
      L(i2, t);
      ik2(j0[0], j0[1], t[0], t[1], L1, L2, bend, q2); A[k1] = q2[0]; A[k2] = q2[1];
      j1[0] = j0[0] - L1 * Math.sin(A[k1]); j1[1] = j0[1] + L1 * Math.cos(A[k1]);
      j2[0] = j1[0] - L2 * Math.sin(A[k2]); j2[1] = j1[1] + L2 * Math.cos(A[k2]);
    };
    limb(J.nHip, NA, SK.thigh, SK.shin, -1, J.nKnee, J.nAnkle, 'nThigh', 'nShin');
    limb(J.fHip, FA, SK.thigh, SK.shin, -1, J.fKnee, J.fAnkle, 'fThigh', 'fShin');
    limb(J.nSh, NW, SK.upper, SK.fore, 1, J.nElb, J.nWr, 'nUpper', 'nFore');
    limb(J.fSh, FW, SK.upper, SK.fore, 1, J.fElb, J.fWr, 'fUpper', 'fFore');
    A.nFoot = A.nShin * 0.8; A.fFoot = A.fShin * 0.8;
    A.nHand = 0.2; A.fHand = 0.2;
  }
}
