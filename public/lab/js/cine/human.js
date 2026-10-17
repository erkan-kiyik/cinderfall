// KOR — cinematics: a human rig in 3D (metres, y up) and its silhouette.
//
// Proportions, joint limits, the gait and the idle motion follow
// docs/KOR_STORY_CINEMATIC.md §5.2–5.6:
//   - bones are fractions of the height H; legs and arms are two-bone IK
//     chains (knee hint forward, elbow hint down and out)
//   - walking: stance 62 % / swing 38 %; in stance the foot is fixed in the
//     world (the body moves at exactly stride × cadence), in swing it travels
//     an arc and lands heel first; the pelvis bobs twice a cycle, lowest at
//     heel strike, sways and turns; the chest counter-turns; the head holds
//     its gaze
//   - standing: breathing, a weight shift every 6–9 s, small head drift
//   - drawing: one mask per figure (far limbs first, a touch darker), then a
//     rim of light on the side facing the key light, and tiny emissive dots
//
// A figure carries a kit (helmet, hood, cap, plate carrier, pack, rifle,
// scarf…) described by `KITS`, so FLINT, WARDEN, VESPER, SKYE, BULWARK and the
// Vanta troopers read apart in silhouette alone.
import { noise1, rng, canvas } from './noise.js';

const TAU = Math.PI * 2;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// bone lengths as a fraction of H (§5.2)
export const BONES = {
  ankle: 0.045, shin: 0.246, thigh: 0.245, spineLo: 0.10, spineHi: 0.18, neck: 0.05, head: 0.13,
  shoulderW: 0.205, hipW: 0.19, upper: 0.172, fore: 0.157, hand: 0.10, foot: 0.15,
};

// Two-bone IK: root a, target t, lengths l1 l2, pole hint p (a direction).
// Returns the middle joint; the end is clamped to reach.
export function ik2(a, t, l1, l2, pole) {
  let d = sub(t, a), dist = len(d);
  const reach = l1 + l2 - 1e-4;
  if (dist > reach) { d = mul(d, reach / dist); dist = reach; }
  if (dist < Math.abs(l1 - l2) + 1e-4) dist = Math.abs(l1 - l2) + 1e-4;
  const dir = norm(d);
  // pole component orthogonal to the reach direction
  let pp = sub(pole, mul(dir, dot(pole, dir)));
  if (len(pp) < 1e-6) pp = Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  pp = norm(pp);
  const cosA = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  return add(a, add(mul(dir, l1 * cosA), mul(pp, l1 * sinA)));
}

// The kits (§1.4): heights, bulk, and what each one wears and carries.
export const KITS = {
  flint: { H: 1.79, bulk: 1.0, head: 'helmet', vest: true, pack: 0, scarf: true, gun: 'rifle', visor: '#ff7a3a' },
  warden: { H: 1.80, bulk: 1.08, head: 'helmetVisor', vest: true, pack: 1, tool: true, gun: 'shotgun', visor: '#7fe6e0' },
  vesper: { H: 1.68, bulk: 0.9, head: 'hood', vest: false, pack: 0, antenna: true, gun: 'pistol', visor: '#b9a0ff' },
  skye: { H: 1.70, bulk: 0.88, head: 'cap', vest: false, pack: 1, drone: true, gun: 'long', visor: '#8fd0ff' },
  bulwark: { H: 1.92, bulk: 1.3, head: 'helmetHeavy', vest: true, heavy: true, pack: 1, gun: 'lmg', visor: '#ffc04a' },
  vanta: { H: 1.82, bulk: 1.06, head: 'vanta', vest: true, pack: 0, gun: 'rifle', visor: '#ff2d3a', knees: true },
  worker: { H: 1.74, bulk: 1.0, head: 'bare', vest: false, pack: 0, gun: null, coat: true },
};

// gait presets (§5.3): stride (m per cycle), cadence (steps/min), lean (rad)
export const GAITS = {
  careful: { stride: 1.20, cadence: 96, lean: 0.14 },
  normal: { stride: 1.40, cadence: 110, lean: 0.07 },
  heavy: { stride: 1.12, cadence: 88, lean: 0.10 },
};

export class Human {
  // opts: { kit, x, z, yaw, gait, phase, seed, pose }
  constructor(opts = {}) {
    this.kitName = opts.kit || 'vanta';
    this.kit = KITS[this.kitName];
    this.H = opts.H || this.kit.H;
    this.x = opts.x || 0; this.z = opts.z || 0; this.y = opts.y || 0;
    this.yaw = opts.yaw || 0;           // facing direction (0 = +x)
    this.gait = opts.gait ? { ...GAITS[opts.gait] || opts.gait } : null;
    this.phase = opts.phase || 0;
    this.seed = opts.seed || 1;
    this.pose = opts.pose || 'stand';   // stand | lean | arms | mug | headset | reach | carry
    this.t = 0; this.walking = !!this.gait;
    this.steps = [];                     // heel strikes since the last read: [{side, x, z}]
    this.J = {};
    this.reach = null;                  // world target for the right hand (pose 'reach')
    this.lookYaw = 0;                   // head turn
    this.scarf = this.kit.scarf ? Array.from({ length: 9 }, () => ({ p: [0, 0, 0], o: [0, 0, 0] })) : null;
    this.scarfInit = false;
    this.r = rng(this.seed);
    this.solve(0);
  }
  get speed() { return this.gait ? this.gait.stride * this.gait.cadence / 120 : 0; }
  get fwd() { return [Math.cos(this.yaw), 0, Math.sin(this.yaw)]; }
  get right() { return [-Math.sin(this.yaw), 0, Math.cos(this.yaw)]; }

  // advance by dt: moves the root at the gait speed, then solves the joints
  step(dt) {
    this.t += dt;
    if (this.walking && this.gait) {
      const before = this.phase;
      this.phase += dt * this.gait.cadence / 120;
      const f = this.fwd;
      this.x += f[0] * this.speed * dt; this.z += f[2] * this.speed * dt;
      // heel strikes: right at phase 0, left at 0.5
      for (const [side, at] of [[1, 0], [-1, 0.5]]) {
        const a = before - at, b = this.phase - at;
        if (Math.floor(a) !== Math.floor(b)) this.steps.push({ side, x: this.x, z: this.z });
      }
    }
    this.solve(dt);
  }
  takeSteps() { const s = this.steps; this.steps = []; return s; }

  // local (forward, up, right) → world
  W(f, u, r) {
    const F = this.fwd, R = this.right;
    return [this.x + F[0] * f + R[0] * r, this.y + u, this.z + F[2] * f + R[2] * r];
  }

  solve(dt) {
    const H = this.H, B = BONES, k = this.kit, t = this.t, J = this.J, g = this.gait;
    const n = (fr, s) => noise1(t * fr, this.seed * 13 + s);
    const ankleH = B.ankle * H, legL = (B.thigh + B.shin) * H, fl = B.foot * H;
    let pelvisY = ankleH + legL * 0.985, sway = 0, turn = 0, lean = 0.02, bob = 0;
    const feet = {};
    if (this.walking && g) {
      const ph = this.phase;
      const S = g.stride;
      bob = -Math.cos(ph * TAU * 2) * 0.025;            // lowest at heel strike
      sway = Math.sin(ph * TAU) * 0.02;
      turn = Math.sin(ph * TAU) * 0.07;                  // ±4°
      lean = g.lean;
      for (const side of [1, -1]) {
        const p = ((ph + (side > 0 ? 0 : 0.5)) % 1 + 1) % 1;
        let fx, fy, pitch;
        if (p < 0.62) {
          const u = p / 0.62;
          fx = S * 0.28 - S * 0.62 * u;
          // heel strike: the foot rolls down about the heel (toe up → flat);
          // heel off: it rolls up about the ball (heel up, toe planted)
          if (u < 0.12) { pitch = 0.18 * (1 - u / 0.12); [fx, fy] = rollHeel(fx, pitch, fl, ankleH); }
          else if (u > 0.7) { const q = (u - 0.7) / 0.3; pitch = -0.5 * q * q * (3 - 2 * q); [fx, fy] = rollToe(fx, pitch, fl, ankleH); }
          else { pitch = 0; fy = 0; }
        } else {
          // swing: from toe-off to the next heel strike, an arc that clears the ground
          const u = (p - 0.62) / 0.38, e = u * u * (3 - 2 * u);
          const [x0, y0] = rollToe(-S * 0.34, -0.5, fl, ankleH), [x1, y1] = rollHeel(S * 0.28, 0.18, fl, ankleH);
          fx = x0 + (x1 - x0) * e;
          fy = y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * 0.09;
          const e1 = Math.min(1, u * 2), e2 = Math.max(0, u * 2 - 1);
          pitch = -0.5 * (1 - e1 * e1 * (3 - 2 * e1)) + 0.18 * e2 * e2 * (3 - 2 * e2);
        }
        feet[side] = { f: fx, u: fy, pitch };
      }
      // the pelvis rides as high as both legs allow (the compass gait gives the
      // bob: lowest in double support), plus a little of the nominal bob
      let top = pelvisY + bob * 0.3;
      const hipHalf0 = B.hipW * H * 0.5;
      for (const side of [1, -1]) {
        const ft = feet[side], dx = ft.f - Math.sin(turn) * side * hipHalf0;
        const L = legL * 0.995;
        top = Math.min(top, ankleH + ft.u + Math.sqrt(Math.max(0, L * L - dx * dx - 0.0025)));
      }
      pelvisY = top;
    } else {
      // standing: breathing, a weight shift every 6–9 s, a little sway
      const shift = Math.sin(t * TAU / (6 + (this.seed % 3))) ;
      sway = shift * 0.02 + n(0.3, 1) * 0.006;
      for (const side of [1, -1]) feet[side] = { f: side * 0.02 + (this.pose === 'lean' ? 0.05 : 0), u: 0, pitch: 0 };
      pelvisY -= Math.max(0, shift * side0(this.seed)) * 0.01;
      lean = this.pose === 'lean' ? 0.42 : this.pose === 'carry' ? 0.06 : 0.03;
    }
    const hipHalf = B.hipW * H * 0.5 * (0.9 + 0.1 * k.bulk);
    const pelvis = this.W(0, pelvisY, sway);
    J.pelvis = pelvis;
    // spine: lean forward, turn against the hips
    const breathe = Math.sin(t * TAU * 0.22) * 0.006;
    const up = [0, 1, 0], F = this.fwd, R = this.right;
    const leanDir = norm(add(mul(up, Math.cos(lean)), mul(F, Math.sin(lean))));
    J.waist = add(pelvis, mul(leanDir, B.spineLo * H));
    J.chest = add(J.waist, mul(leanDir, B.spineHi * H + breathe));
    const shW = B.shoulderW * H * 0.5 * k.bulk;
    const chestTurn = -turn * 0.75;
    const Rc = norm(add(mul(R, Math.cos(chestTurn)), mul(F, Math.sin(chestTurn))));
    const Rp = norm(add(mul(R, Math.cos(turn)), mul(F, Math.sin(turn))));
    J.shR = add(add(J.chest, mul(Rc, shW)), [0, -0.03 + breathe * 0.5, 0]);
    J.shL = add(add(J.chest, mul(Rc, -shW)), [0, -0.03 + breathe * 0.5, 0]);
    J.hipR = add(pelvis, mul(Rp, hipHalf)); J.hipL = add(pelvis, mul(Rp, -hipHalf));
    J.neck = add(J.chest, mul(leanDir, B.neck * H * 0.6));
    // the head holds its gaze: it counters most of the lean and the bob
    const headUp = norm(add(up, mul(F, Math.sin(lean) * 0.35 + n(0.25, 3) * 0.03)));
    J.head = add(J.neck, mul(headUp, B.head * H * 0.55));
    J.headYaw = this.lookYaw + n(0.2, 5) * 0.04;
    // legs: ankle targets, then IK with the knee forward
    for (const [side, key] of [[1, 'R'], [-1, 'L']]) {
      const ft = feet[side], hip = J['hip' + key];
      const ankle = this.W(ft.f, ankleH + ft.u, side * (hipHalf * 0.85 + (this.walking ? 0 : 0.05)) + (this.walking ? 0 : sway * 0.5));
      J['knee' + key] = ik2(hip, ankle, B.thigh * H, B.shin * H, add(F, [0, 0.1, 0]));
      // the ankle the chain actually reached
      const kn = J['knee' + key], d = norm(sub(ankle, kn));
      J['ankle' + key] = add(kn, mul(d, B.shin * H));
      // the foot turned by its pitch (+ = toe up) about the ankle
      const cp = Math.cos(ft.pitch), sp = Math.sin(ft.pitch);
      const Fp = [F[0] * cp, sp, F[2] * cp], Up = [-F[0] * sp, cp, -F[2] * sp];
      J['heel' + key] = add(J['ankle' + key], add(mul(Fp, -fl * 0.25), mul(Up, -ankleH * 0.8)));
      J['toe' + key] = add(J['heel' + key], mul(Fp, fl));
    }
    // arms
    this.arms(F, R, up, t, feet);
    this.cloth(dt);
  }

  arms(F, R, up, t, feet) {
    const J = this.J, H = this.H, B = BONES, k = this.kit;
    const l1 = B.upper * H, l2 = B.fore * H;
    const gun = k.gun;
    const holdsLong = gun === 'rifle' || gun === 'shotgun' || gun === 'lmg' || gun === 'long';
    const swing = this.walking ? Math.sin(this.phase * TAU) : 0;
    if (holdsLong && this.pose !== 'reach' && this.pose !== 'lean' && this.pose !== 'arms' && this.pose !== 'mug') {
      // low carry: grip by the right hip, muzzle down and forward
      const bobGun = this.walking ? Math.sin(this.phase * TAU * 2) * 0.015 : Math.sin(t * TAU * 0.22) * 0.004;
      const grip = add(add(J.waist, mul(F, 0.16)), add(mul(R, 0.11), [0, 0.05 + bobGun, 0]));
      const ang = -0.44; // 25° down
      const gd = norm(add(mul(F, Math.cos(ang)), [0, Math.sin(ang), 0]));
      const gside = norm(add(gd, mul(R, -0.35)));
      const fore = add(grip, mul(gside, gun === 'lmg' ? 0.36 : 0.30));
      J.gun = { grip, dir: gside, fore };
      J.handR = grip; J.handL = fore;
      J.elbowR = ik2(J.shR, grip, l1, l2, add(add(mul(up, -1), mul(R, 0.25)), mul(F, -0.3)));
      J.elbowL = ik2(J.shL, fore, l1, l2, add(add(mul(up, -1), mul(R, -0.2)), mul(F, -0.1)));
    } else {
      J.gun = null;
      for (const [side, key] of [[1, 'R'], [-1, 'L']]) {
        const sh = J['sh' + key];
        let hand;
        if (this.pose === 'arms') {
          hand = add(add(J.chest, mul(F, 0.16)), add(mul(R, -side * 0.08), [0, -0.12, 0]));
        } else if (this.pose === 'lean') {
          hand = add(add(J.chest, mul(F, 0.42)), add(mul(R, side * 0.2), [0, -0.5, 0]));
        } else if (this.pose === 'mug' && side > 0) {
          const lift = Math.max(0, Math.min(1, (t - 4.1) / 0.5)) * Math.max(0, Math.min(1, (6.0 - t) / 0.5));
          hand = add(add(J.chest, mul(F, 0.2)), add(mul(R, 0.1), [0, -0.3 + lift * 0.42, 0]));
        } else if (this.pose === 'headset' && side < 0) {
          hand = add(J.head, add(mul(R, -0.1), [0, 0.0, 0]));
        } else if (this.pose === 'reach' && side > 0 && this.reach) {
          hand = this.reach;
        } else {
          // hanging, swinging against the leg on the same side
          const a = -side * swing * 0.28;
          const dn = norm(add(mul(up, -Math.cos(a)), mul(F, Math.sin(a))));
          hand = add(sh, add(mul(dn, (l1 + l2) * 0.92), mul(R, side * 0.04)));
          hand = add(hand, mul(F, 0.04));
        }
        J['hand' + key] = hand;
        J['elbow' + key] = ik2(sh, hand, l1, l2, add(mul(up, -0.4), add(mul(F, -1), mul(R, side * 0.4))));
      }
    }
  }

  // the scarf: verlet chain from the back of the neck (§5.6)
  cloth(dt) {
    const c = this.scarf; if (!c) return;
    const J = this.J, F = this.fwd, anchor = add(J.neck, add(mul(F, -0.07), [0, -0.02, 0]));
    if (!this.scarfInit) { c.forEach((p, i) => { p.p = add(anchor, [0, -i * 0.026, 0]); p.o = p.p.slice(); }); this.scarfInit = true; }
    const h = Math.min(dt, 1 / 30) || 1 / 60;
    const wind = [(noise1(this.t * 0.7, 91) * 0.8 + 0.4), 0, noise1(this.t * 0.5, 92) * 0.6];
    for (let i = 1; i < c.length; i++) {
      const p = c[i], v = sub(p.p, p.o);
      p.o = p.p;
      p.p = add(add(p.p, mul(v, 0.985)), mul(add([0, -9.8, 0], wind), h * h));
    }
    c[0].p = anchor; c[0].o = anchor;
    for (let it = 0; it < 3; it++) for (let i = 1; i < c.length; i++) {
      const a = c[i - 1].p, b = c[i].p, d = sub(b, a), l = len(d) || 1e-6, diff = (l - 0.026) / l;
      c[i].p = sub(b, mul(d, diff));
    }
  }

  // --- drawing ----------------------------------------------------------------------------
  // light: { dir: [x, y] screen direction toward the light, or 'back' for
  // a light behind the figure; col: rim colour; w: rim width px; glow }
  draw(g, cam, light = {}, opts = {}) {
    const J = this.J, k = this.kit, H = this.H;
    const P = (p) => cam.project(p[0], p[1], p[2], [0, 0, 0, 0]);
    const pr = {}; let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9, zs = 0, n = 0;
    for (const key of Object.keys(J)) {
      const v = J[key]; if (!Array.isArray(v)) continue;
      const q = P(v); if (q[2] <= 0) return;
      pr[key] = q; zs += q[2]; n++;
      minx = Math.min(minx, q[0]); maxx = Math.max(maxx, q[0]); miny = Math.min(miny, q[1]); maxy = Math.max(maxy, q[1]);
    }
    const Z = zs / n, ppm = cam.f / Z, pad = ppm * 0.6 + 6;
    // the figure's box, kept to the screen (a figure can be far bigger than it)
    const bx = Math.max(-8, Math.floor(minx - pad)), by = Math.max(-8, Math.floor(miny - pad));
    const bw = Math.min(cam.W + 8, Math.ceil(maxx + pad)) - bx, bh = Math.min(cam.H + 8, Math.ceil(maxy + pad)) - by;
    if (bw <= 0 || bh <= 0 || bx > cam.W || by > cam.H) return;
    const c = getBuf(0, bw, bh), m = c.getContext('2d');
    m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1; m.filter = 'none';
    m.setTransform(1, 0, 0, 1, -bx, -by);
    m.clearRect(bx, by, bw, bh);
    const base = opts.body || '#0b0d11', far = opts.far || '#07080b';
    // which side is nearer the camera
    const nearR = cam.toCam(J.shR[0], J.shR[1], J.shR[2], [0, 0, 0])[2] < cam.toCam(J.shL[0], J.shL[1], J.shL[2], [0, 0, 0])[2];
    const [nearK, farK] = nearR ? ['R', 'L'] : ['L', 'R'];
    const W = (m3) => m3 * ppm; // metres → px at this depth
    const bulk = k.bulk;
    // far limbs (opts.detailLegs: trousers and boots drawn as in drawLegs)
    const dl = opts.simpleLegs ? false : true;
    this.limbs(m, pr, farK, W, far, bulk, !dl);
    if (dl) this.leg(m, P, farK, far);
    // the frames of the hips and the chest, from the joints
    const F = this.fwd, Us = norm(sub(J.neck, J.pelvis));
    const Rp = norm(sub(J.hipR, J.hipL)), Rc = norm(sub(J.shR, J.shL));
    const Fp = norm(cross(Us, Rp)), Fc = norm(cross(Us, Rc));
    const fr = { Us, Rp, Rc, Fp, Fc };
    // what is carried on the back goes behind the body
    this.backGear(m, P, base, fr);
    this.torso(m, P, base, fr);
    this.frontGear(m, P, base, fr);
    // neck, head and headgear
    capsule(m, pr.chest, pr.neck, W(0.06), W(0.055), base);
    this.headgear2(m, P, base, fr);
    // the gun
    if (J.gun) this.gun2(m, P, base);
    // the scarf
    if (this.scarf) {
      m.strokeStyle = opts.scarf || '#2a0d0c'; m.lineCap = 'round'; m.lineJoin = 'round';
      for (let i = 1; i < this.scarf.length; i++) {
        const a = P(this.scarf[i - 1].p), b = P(this.scarf[i].p);
        m.lineWidth = W(0.07 * (1 - i / 14)); m.beginPath(); m.moveTo(a[0], a[1]); m.lineTo(b[0], b[1]); m.stroke();
      }
      const a = P(add(J.neck, mul(F, 0.03))); m.fillStyle = opts.scarf || '#2a0d0c'; ellipse(m, a[0], a[1], W(0.085), W(0.05));
    }
    // near limbs
    if (dl) this.leg(m, P, nearK, base);
    this.limbs(m, pr, nearK, W, base, bulk, !dl);
    // a light close by fills the side of the figure nearest it: { at: [sx, sy], r, col }
    m.setTransform(1, 0, 0, 1, 0, 0);
    if (opts.fill) {
      const F2 = opts.fill, gr = m.createRadialGradient(F2.at[0] - bx, F2.at[1] - by, 0, F2.at[0] - bx, F2.at[1] - by, F2.r);
      gr.addColorStop(0, F2.col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      m.globalCompositeOperation = 'source-atop'; m.fillStyle = gr; m.fillRect(0, 0, bw, bh); m.globalCompositeOperation = 'source-over';
    }
    // rim light from the mask
    for (const L of Array.isArray(light) ? light : [light]) if (L && L.col) rim(c, bw, bh, L, Math.max(1, (L.w || 1.4) * (ppm / 160)), bx, by);
    // tiny emissive dots (visor, LEDs)
    g.drawImage(c, 0, 0, bw, bh, bx, by, bw, bh);
    if (opts.emissive !== false && k.visor) {
      const hd = pr.head, s = W(1);
      const fz = cam.toCam(...add(J.head, mul(F, 0.1)), [0, 0, 0])[2] < cam.toCam(...J.head, [0, 0, 0])[2];
      if (fz || opts.showVisor) {
        g.save(); g.globalCompositeOperation = 'lighter';
        const vx = P(add(J.head, add(mul(F, 0.1), [0, 0.01, 0])));
        const r0 = Math.max(0.8, s * 0.035);
        const gr = g.createRadialGradient(vx[0], vx[1], 0, vx[0], vx[1], r0 * 5);
        gr.addColorStop(0, hexA(k.visor, 0.9 * (opts.visor ?? 1))); gr.addColorStop(0.25, hexA(k.visor, 0.25 * (opts.visor ?? 1))); gr.addColorStop(1, hexA(k.visor, 0));
        g.fillStyle = gr; g.fillRect(vx[0] - r0 * 5, vx[1] - r0 * 5, r0 * 10, r0 * 10);
        g.restore();
      }
      void hd;
    }
    this.lastBox = [bx, by, bw, bh, Z];
  }

  // Close-up of the legs and boots, for a lens at shin height: trousers with
  // the calf, the knee pad and the cloth bloused over the boot collar; the
  // boot in side profile (toe cap, instep, padded collar, heel counter) on a
  // lugged sole. Lit the same way as draw(): one mask, then the rims.
  // opts.mirror: draw the reflection in a wet ground at y = this.y instead
  drawLegs(g, cam, light = [], opts = {}) {
    const J = this.J, gy = this.y, mir = !!opts.mirror;
    const P = mir ? (p) => cam.project(p[0], 2 * gy - p[1], p[2], [0, 0, 0, 0]) : (p) => cam.project(p[0], p[1], p[2], [0, 0, 0, 0]);
    let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9, zs = 0, n = 0;
    for (const K of ['R', 'L']) for (const key of ['hip', 'knee', 'ankle', 'heel', 'toe']) {
      const q = P(J[key + K]); if (q[2] <= 0) return;
      if (mir && key === 'hip') continue;
      zs += q[2]; n++; minx = Math.min(minx, q[0]); maxx = Math.max(maxx, q[0]); miny = Math.min(miny, q[1]); maxy = Math.max(maxy, q[1]);
    }
    const Z = zs / n, ppm = cam.f / Z, pad = ppm * 0.16 + 6;
    let bx = Math.floor(minx - pad), by = Math.floor(miny - pad), ex = Math.ceil(maxx + pad), ey = Math.ceil(maxy + pad);
    bx = Math.max(bx, -4); by = Math.max(by, -4); ex = Math.min(ex, cam.W + 4); ey = Math.min(ey, cam.H + 4);
    const bw = ex - bx, bh = ey - by; if (bw <= 0 || bh <= 0) return;
    const c = getBuf(0, bw, bh), m = c.getContext('2d');
    m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1; m.filter = 'none';
    m.clearRect(0, 0, bw, bh);
    m.setTransform(1, 0, 0, 1, -bx, -by);
    const nearR = cam.toCam(...J.kneeR, [0, 0, 0])[2] < cam.toCam(...J.kneeL, [0, 0, 0])[2];
    const [nearK, farK] = nearR ? ['R', 'L'] : ['L', 'R'];
    this.leg(m, P, farK, opts.far || '#060607');
    this.leg(m, P, nearK, opts.body || '#09090b');
    m.setTransform(1, 0, 0, 1, 0, 0);
    if (mir) {
      // the reflection fades with the distance from the surface and is broken by the ripples
      const gq = P([this.x, gy, this.z]), fall = ppm * 0.45;
      const gr = m.createLinearGradient(0, gq[1] - by, 0, gq[1] - by + fall);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      m.globalCompositeOperation = 'destination-in'; m.fillStyle = gr; m.fillRect(0, 0, bw, bh);
      m.globalCompositeOperation = 'source-over';
      g.save(); g.globalAlpha = opts.alpha ?? 0.5; g.drawImage(c, 0, 0, bw, bh, bx, by, bw, bh); g.restore();
      return;
    }
    for (const L of Array.isArray(light) ? light : [light]) if (L && L.col) rim(c, bw, bh, L, Math.max(0.8, (L.w || 1.4) * (ppm / 160)), bx, by);
    g.drawImage(c, 0, 0, bw, bh, bx, by, bw, bh);
    this.lastBox = [bx, by, bw, bh, Z];
  }

  leg(m, P, K, col) {
    const J = this.J, H = this.H, R = this.right;
    const hip = J['hip' + K], knee = J['knee' + K], ank = J['ankle' + K], heel = J['heel' + K], toe = J['toe' + K];
    const s = (BONES.foot * H) / 0.27;
    const Fp = norm(sub(toe, heel)), Up = norm(cross(R, Fp));
    // boot, side profile: (u along the foot from the back of the heel, v up from the tread), m
    // sole (the heel block a step thicker, the toe sprung up), then the upper
    const prof = [[-0.006, 0.0], [0.084, 0.0], [0.092, 0.012], [0.15, 0.014], [0.172, 0.004], [0.27, 0.004], [0.302, 0.012], [0.322, 0.026], [0.326, 0.046], [0.316, 0.066], [0.292, 0.08], [0.25, 0.088], [0.205, 0.1], [0.168, 0.122], [0.142, 0.155], [0.128, 0.2], [0.124, 0.248], [0.116, 0.268], [0.084, 0.272], [0.034, 0.27], [0.016, 0.255], [0.02, 0.2], [0.016, 0.14], [0.004, 0.09], [-0.008, 0.055], [-0.01, 0.022]];
    // the boot as a solid: its side profile on both sides of the foot, and
    // the faces between them (so it has width seen from in front)
    const bw0 = 0.047 * s, side = (u, v, w) => P(add(add(add(heel, mul(Fp, (u - 0.02) * s)), mul(Up, v * s - 0.016)), mul(R, w * (u > 0.2 ? 1 : 0.82))));
    const A = prof.map(([u, v]) => side(u, v, -bw0)), Bq = prof.map(([u, v]) => side(u, v, bw0));
    m.fillStyle = col;
    for (const q of [A, Bq]) { m.beginPath(); q.forEach((v, k2) => (k2 ? m.lineTo(v[0], v[1]) : m.moveTo(v[0], v[1]))); m.closePath(); m.fill(); }
    for (let k2 = 0; k2 < prof.length; k2++) { const n2 = (k2 + 1) % prof.length; m.beginPath(); m.moveTo(A[k2][0], A[k2][1]); m.lineTo(A[n2][0], A[n2][1]); m.lineTo(Bq[n2][0], Bq[n2][1]); m.lineTo(Bq[k2][0], Bq[k2][1]); m.closePath(); m.fill(); }
    // the tread: blocks of uneven width, deeper under the heel
    const at = (u, v) => side(u, v, 0);
    const lug = this.lugs || (this.lugs = (() => { const r = rng(this.seed * 7 + 3), o = []; for (let u = 0.004; u < 0.29;) { const w = 0.012 + r() * 0.016; if (u < 0.08 || u > 0.17) o.push([u, w, (u < 0.09 ? 0.003 : 0.002) * (0.6 + r() * 0.6)]); u += w + 0.007 + r() * 0.01; } return o; })());
    for (const [u, w, d] of lug) {
      const v0 = 0.004;
      const a = at(u, v0), b = at(u + w, v0), c2 = at(u + w - 0.001, -d), e = at(u + 0.001, -d);
      m.beginPath(); m.moveTo(a[0], a[1]); m.lineTo(b[0], b[1]); m.lineTo(c2[0], c2[1]); m.lineTo(e[0], e[1]); m.closePath(); m.fill();
    }
    // trousers: cross-sections up the shin and the thigh (width across the
    // leg, depth front to back); the outline joins their extremes
    const sd = norm(sub(knee, ank)), nf = norm(cross(sd, R));
    const base = add(add(ank, mul(sd, 0.15 * s)), mul(this.fwd, -0.012));
    const shinL = len(sub(knee, base)), td = norm(sub(hip, knee)), nt = norm(cross(td, R)), thL = len(sub(hip, knee));
    const secs = [];
    for (const [t, rf, rb, w] of [[0, 0.06, 0.066, 0.06], [0.06, 0.077, 0.083, 0.068], [0.14, 0.071, 0.08, 0.064], [0.24, 0.063, 0.077, 0.058], [0.42, 0.06, 0.082, 0.06], [0.62, 0.061, 0.08, 0.06], [0.85, 0.066, 0.072, 0.064], [1, 0.074, 0.07, 0.068]]) {
      const fold = t < 0.3 ? Math.sin(t * 70 + this.seed) * 0.005 * (1 - t / 0.3) : 0;
      secs.push([add(base, mul(sd, t * shinL)), nf, rf + fold, rb + fold * 0.6, w + fold * 0.5]);
    }
    for (const [t, rf, rb, w] of [[0.18, 0.078, 0.074, 0.074], [0.5, 0.09, 0.088, 0.086], [0.85, 0.098, 0.098, 0.094], [1.1, 0.1, 0.1, 0.09]]) secs.push([add(knee, mul(td, t * thL)), nt, rf, rb, w]);
    const p0 = P(base), p1 = P(hip);
    let sx = p1[0] - p0[0], sy = p1[1] - p0[1]; const sl = Math.hypot(sx, sy) || 1; sx /= sl; sy /= sl;
    const nx = -sy, ny = sx, Lq = [], Rq = [];
    for (const [c0, nn, rf, rb, w] of secs) {
      let lo = 1e9, hi = -1e9, ql = null, qh = null;
      for (let k2 = 0; k2 < 16; k2++) {
        const th = (k2 / 16) * TAU, cs = Math.cos(th), sn = Math.sin(th);
        const q = P(add(c0, add(mul(nn, cs > 0 ? cs * rf : cs * rb), mul(R, sn * w)))), d = q[0] * nx + q[1] * ny;
        if (d < lo) { lo = d; ql = q; } if (d > hi) { hi = d; qh = q; }
      }
      Lq.push(ql); Rq.push(qh);
    }
    smoothPoly(m, Lq.concat(Rq.reverse()), col);
    // knee pad
    if (this.kit.knees) {
      const kp = P(add(knee, mul(nf, 0.055))), ppm = kp[3], k0 = P(knee), a0 = P(ank);
      m.beginPath(); m.ellipse(kp[0], kp[1], 0.075 * ppm, 0.05 * ppm, Math.atan2(a0[1] - k0[1], a0[0] - k0[0]), 0, TAU); m.fill();
    }
  }

  // the torso's outline: cross-sections from the hips to the neck, each an
  // ellipse in the body's frame; the outline joins their extremes as seen
  torso(m, P, col, fr) {
    const J = this.J, k = this.kit, b = k.bulk, sc = this.H / 1.8, v = k.vest ? 1 : 0;
    const shW = BONES.shoulderW * this.H * 0.5 * b;
    const lv = [
      [add(J.pelvis, mul(fr.Us, -0.12)), 'p', 0.1, 0.085, 0],
      [add(J.pelvis, mul(fr.Us, -0.07)), 'p', 0.16, 0.1, 0],
      [add(J.pelvis, mul(fr.Us, 0.02)), 'p', 0.168, 0.112, 0],
      [J.waist, 'm', 0.148, 0.105 + v * 0.028, v * 0.01],
      [lerp3(J.waist, J.chest, 0.45), 'c', 0.158, 0.115 + v * 0.032, 0.012 + v * 0.01],
      [lerp3(J.waist, J.chest, 0.8), 'c', 0.172, 0.12 + v * 0.03, 0.02],
      [add(J.chest, mul(fr.Us, -0.03)), 'c', shW / sc + 0.012, 0.105 + v * 0.02, 0],
      [add(J.chest, mul(fr.Us, 0.015)), 'c', shW / sc * 0.86, 0.095, 0],
      [add(J.chest, mul(fr.Us, 0.045)), 'c', shW / sc * 0.55, 0.08, 0],
      [J.neck, 'c', 0.062, 0.062, 0],
    ];
    const p0 = P(J.pelvis), p1 = P(J.neck);
    let sx = p1[0] - p0[0], sy = p1[1] - p0[1]; const sl = Math.hypot(sx, sy) || 1; sx /= sl; sy /= sl;
    const nx = -sy, ny = sx, Lp = [], Rp2 = [];
    for (const [c, f, a0, b0, fo] of lv) {
      const R = f === 'p' ? fr.Rp : f === 'c' ? fr.Rc : norm(add(fr.Rp, fr.Rc)), Fv = f === 'p' ? fr.Fp : f === 'c' ? fr.Fc : norm(add(fr.Fp, fr.Fc));
      const a = a0 * sc * b, bb = b0 * sc * b;
      let lo = 1e9, hi = -1e9, ql = null, qh = null;
      for (let i = 0; i < 20; i++) {
        const th = (i / 20) * TAU, sn = Math.sin(th);
        const w = add(c, add(mul(R, Math.cos(th) * a), mul(Fv, sn * bb + (sn > 0 ? fo * sc : 0))));
        const q = P(w), d = q[0] * nx + q[1] * ny;
        if (d < lo) { lo = d; ql = q; } if (d > hi) { hi = d; qh = q; }
      }
      Lp.push(ql); Rp2.push(qh);
    }
    smoothPoly(m, Lp.concat(Rp2.reverse()), col);
  }
  backGear(m, P, col, fr) {
    const J = this.J, k = this.kit, b = k.bulk, mid = lerp3(J.waist, J.chest, 0.55);
    if (k.pack) solid(m, P, add(mid, mul(fr.Fc, -(0.12 + 0.1) * b)), fr.Rc, fr.Fc, fr.Us, 0.15 * b, 0.09 * b, 0.21 * b, col, true);
    if (k.drone) solid(m, P, add(add(mid, mul(fr.Fc, -0.27 * b)), mul(fr.Us, 0.18)), fr.Rc, fr.Fc, fr.Us, 0.2, 0.05, 0.03, col, true);
    if (k.tool) { const a = P(add(J.waist, add(mul(fr.Fc, -0.22), mul(fr.Rc, 0.12)))), e = P(add(J.chest, add(mul(fr.Fc, -0.24), add(mul(fr.Rc, -0.1), mul(fr.Us, 0.34))))); capsule(m, a, e, 0.025 * a[3], 0.03 * a[3], col); }
    if (k.coat) { const a = P(add(J.pelvis, [0, -0.3, 0])), e = P(J.chest); capsule(m, a, e, 0.19 * a[3], 0.17 * e[3], col); }
  }
  frontGear(m, P, col, fr) {
    const J = this.J, k = this.kit, b = k.bulk;
    if (!k.vest) return;
    // magazine pouches across the front of the plate carrier, a radio on the strap
    const base = add(lerp3(J.waist, J.chest, 0.3), mul(fr.Fc, (0.15 + 0.028) * b));
    for (const o of [-0.085, 0, 0.085]) solid(m, P, add(base, mul(fr.Rc, o * b)), fr.Rc, fr.Fc, fr.Us, 0.036, 0.026, 0.07, col);
    solid(m, P, add(add(J.chest, mul(fr.Fc, 0.1 * b)), add(mul(fr.Rc, -0.12 * b), mul(fr.Us, -0.04))), fr.Rc, fr.Fc, fr.Us, 0.028, 0.022, 0.06, col, true);
    // a pouch on the hip belt, rounded (not a box)
    solid(m, P, add(add(J.pelvis, mul(fr.Rp, 0.16 * b)), add(mul(fr.Us, 0.04), mul(fr.Fp, -0.02))), fr.Rp, fr.Fp, fr.Us, 0.035, 0.055, 0.06, col);
  }
  // heads and what is on them, each solid seen whole from wherever we are
  headgear2(m, P, col, fr) {
    const J = this.J, k = this.kit, yaw = this.yaw + (J.headYaw || 0);
    const Fh0 = [Math.cos(yaw), 0, Math.sin(yaw)], Uh = norm(sub(J.head, J.neck)), Rh = norm(cross(Fh0, Uh)), Fh = norm(cross(Uh, Rh));
    const h = J.head, S = (c, a, b, hh, cut, box) => solid(m, P, c, Rh, Fh, Uh, a, b, hh, col, box, cut);
    S(h, 0.077, 0.1, 0.118);
    S(add(h, mul(Uh, -0.09)), 0.05, 0.07, 0.05);                       // jaw
    switch (k.head) {
      case 'helmet': S(add(h, mul(Uh, 0.035)), 0.108, 0.13, 0.11, -0.2); S(add(add(h, mul(Uh, 0.1)), mul(Fh, 0.11)), 0.025, 0.02, 0.025, null, true); break;
      case 'helmetVisor': S(add(h, mul(Uh, 0.035)), 0.11, 0.132, 0.11, -0.2); S(add(add(h, mul(Fh, 0.1)), mul(Uh, -0.025)), 0.085, 0.022, 0.075); break;
      case 'helmetHeavy': S(add(h, mul(Uh, 0.04)), 0.125, 0.145, 0.12, -0.25); S(add(add(h, mul(Fh, 0.1)), mul(Uh, -0.075)), 0.08, 0.04, 0.045, null, true); break;
      case 'vanta': S(add(h, mul(Uh, 0.015)), 0.112, 0.135, 0.138); S(add(add(h, mul(Fh, 0.085)), mul(Uh, -0.03)), 0.08, 0.05, 0.085); break;
      case 'hood': { // the hood, and its drape over the shoulders, as one shape
        const pts = [];
        sampleSolid(pts, add(add(h, mul(Uh, 0.01)), mul(Fh, -0.02)), Rh, Fh, Uh, 0.12, 0.14, 0.145);
        for (const sd of [-1, 1]) pts.push(add(add(J.neck, mul(fr.Rc, sd * 0.13)), mul(fr.Us, -0.04)), add(add(J.neck, mul(fr.Rc, sd * 0.1)), mul(fr.Fc, -0.09)));
        hullFill(m, pts.map((p) => P(p)), col); break;
      }
      case 'cap': S(add(h, mul(Uh, 0.06)), 0.098, 0.115, 0.075, -0.1); S(add(add(h, mul(Uh, 0.055)), mul(Fh, 0.15)), 0.075, 0.06, 0.008, null, true); S(add(h, mul(Rh, 0.085)), 0.02, 0.04, 0.045); break;
      default: break;
    }
    if (k.antenna) { const a = P(add(h, add(mul(Uh, 0.06), mul(Rh, -0.08)))), b = P(add(h, add(mul(Uh, 0.32), add(mul(Fh, -0.06), mul(Rh, -0.11))))); m.strokeStyle = col; m.lineWidth = Math.max(0.6, 0.008 * a[3]); m.beginPath(); m.moveTo(a[0], a[1]); m.lineTo(b[0], b[1]); m.stroke(); }
  }
  // the long gun as boxes along its axis: stock, receiver, handguard, barrel,
  // sight, magazine and grip
  gun2(m, P, col) {
    const G = this.J.gun, k = this.kit, d = G.dir, sd = norm(cross(d, [0, 1, 0])), ug = norm(cross(sd, d));
    const at = (s, u = 0, w = 0) => add(G.grip, add(mul(d, s), add(mul(ug, u), mul(sd, w))));
    const box = (s0, s1, u0, u1, w, u0b = u0, u1b = u1) => hullFill(m, [at(s0, u0, -w), at(s1, u0b, -w), at(s1, u1b, -w), at(s0, u1, -w), at(s0, u0, w), at(s1, u0b, w), at(s1, u1b, w), at(s0, u1, w)].map((p) => P(p)), col);
    const L = k.gun === 'lmg' ? 1.3 : k.gun === 'long' ? 1.35 : k.gun === 'shotgun' ? 1.1 : 1;
    box(-0.31, -0.06, -0.075, 0.035, 0.02, -0.035, 0.045);              // stock, deeper at the butt
    box(-0.06, 0.2, -0.035, 0.05, 0.026);                                // receiver
    box(0.2, 0.2 + 0.24 * L, -0.025, 0.04, 0.024);                       // handguard
    box(0.2 + 0.24 * L, 0.33 + 0.26 * L, -0.002, 0.018, 0.009);          // barrel
    box(0.01, 0.12 + (k.gun === 'long' ? 0.12 : 0), 0.05, 0.09, 0.02);   // sight
    hullFill(m, [at(0.08, -0.03, -0.017), at(0.15, -0.03, -0.017), at(0.19, -0.2, -0.017), at(0.12, -0.21, -0.017), at(0.08, -0.03, 0.017), at(0.15, -0.03, 0.017), at(0.19, -0.2, 0.017), at(0.12, -0.21, 0.017)].map((p) => P(p)), col); // magazine
    hullFill(m, [at(-0.03, -0.03, -0.015), at(0.02, -0.03, -0.015), at(-0.02, -0.13, -0.015), at(-0.07, -0.12, -0.015), at(-0.03, -0.03, 0.015), at(0.02, -0.03, 0.015), at(-0.02, -0.13, 0.015), at(-0.07, -0.12, 0.015)].map((p) => P(p)), col); // grip
    if (k.gun === 'lmg') box(0.06, 0.2, -0.16, -0.03, 0.06);
  }

  limbs(m, pr, K, W, col, bulk, legs = true) {
    const t = bulk;
    if (legs) {
      capsule(m, pr['hip' + K], pr['knee' + K], W(0.085 * t), W(0.065 * t), col);
      capsule(m, pr['knee' + K], pr['ankle' + K], W(0.06 * t), W(0.045 * t), col);
      // boot: heel → toe, a little taller at the heel
      capsule(m, pr['heel' + K], pr['toe' + K], W(0.05), W(0.04), col);
      capsule(m, pr['ankle' + K], pr['heel' + K], W(0.05), W(0.05), col);
    }
    // upper arm (the deltoid rounds its top), forearm, a gloved hand
    capsule(m, pr['sh' + K], pr['elbow' + K], W(0.058 * t), W(0.044 * t), col);
    capsule(m, pr['elbow' + K], pr['hand' + K], W(0.046 * t), W(0.034 * t), col);
    { const e = pr['elbow' + K], h = pr['hand' + K], a = Math.atan2(h[1] - e[1], h[0] - e[0]); m.fillStyle = col; ellipse(m, h[0] + Math.cos(a) * W(0.03), h[1] + Math.sin(a) * W(0.03), W(0.055), W(0.04), a); }
    if (legs && this.kit.knees) { const kn = pr['knee' + K]; ellipse(m, kn[0], kn[1], W(0.07), W(0.07)); }
  }
}
function side0(seed) { return seed % 2 ? 1 : -1; }
// the ankle (forward, up from its rest height) for a foot pitched about its
// heel (heel strike) or its ball (heel off), so the contact point stays put
function rollHeel(fx, p, fl, aH) { return [fx + 0.25 * fl * (Math.cos(p) - 1) - 0.8 * aH * Math.sin(p), 0.25 * fl * Math.sin(p) + 0.8 * aH * (Math.cos(p) - 1)]; }
function rollToe(fx, p, fl, aH) { return [fx + 0.75 * fl * (1 - Math.cos(p)) - 0.8 * aH * Math.sin(p), -0.75 * fl * Math.sin(p) + 0.8 * aH * (Math.cos(p) - 1)]; }

// --- drawing helpers ------------------------------------------------------------------------------
const bufs = [];
function getBuf(i, w, h) {
  w = Math.min(w, 4096); h = Math.min(h, 4096);
  let c = bufs[i];
  if (!c) c = bufs[i] = canvas(w, h);
  if (c.width < w || c.height < h) { c.width = Math.max(c.width, w); c.height = Math.max(c.height, h); }
  return c;
}
// convex hull (monotone chain) of projected points, filled
export function hullFill(g, q, col) {
  const pts = q.filter((v) => v[2] > 0).map((v) => [v[0], v[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  const h = lo.slice(0, -1).concat(up.slice(0, -1));
  g.fillStyle = col; g.beginPath(); g.moveTo(h[0][0], h[0][1]); for (let i = 1; i < h.length; i++) g.lineTo(h[i][0], h[i][1]); g.closePath(); g.fill();
}
// points on an ellipsoid (axes A, B, C; half sizes a, b, c), above `cut` (−1..1 of the height)
export function sampleSolid(out, c, A, B, C, a, b, h, cut = null, box = false) {
  if (box) { for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [cut ?? -1, 1]) out.push(add(c, add(mul(A, x * a), add(mul(B, y * b), mul(C, z * h))))); return out; }
  for (let i = 0; i <= 6; i++) {
    const s = -1 + (i / 6) * 2; if (cut !== null && s < cut) continue;
    const la = Math.asin(s), cl = Math.cos(la);
    for (let j = 0; j < 10; j++) { const lo = (j / 10) * TAU; out.push(add(c, add(mul(A, a * cl * Math.cos(lo)), add(mul(B, b * cl * Math.sin(lo)), mul(C, h * s))))); }
  }
  if (cut !== null) { const s = cut, cl = Math.sqrt(1 - s * s); for (let j = 0; j < 10; j++) { const lo = (j / 10) * TAU; out.push(add(c, add(mul(A, a * cl * Math.cos(lo)), add(mul(B, b * cl * Math.sin(lo)), mul(C, h * s))))); } }
  return out;
}
export function solid(g, P, c, A, B, C, a, b, h, col, box = false, cut = null) { hullFill(g, sampleSolid([], c, A, B, C, a, b, h, cut, box).map((p) => P(p)), col); }
// a closed outline through points, its corners rounded
function smoothPoly(g, q, col) {
  g.fillStyle = col; g.beginPath();
  const n = q.length; g.moveTo((q[n - 1][0] + q[0][0]) / 2, (q[n - 1][1] + q[0][1]) / 2);
  for (let i = 0; i < n; i++) { const a = q[i], b = q[(i + 1) % n]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
  g.closePath(); g.fill();
}
export function ellipse(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(0.3, rx), Math.max(0.3, ry), rot, 0, TAU); g.fill(); }
// a tapered capsule between two projected points (radii in px)
export function capsule(g, a, b, ra, rb, col) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
  g.fillStyle = col;
  if (l < 0.5) { ellipse(g, a[0], a[1], Math.max(ra, rb), Math.max(ra, rb)); return; }
  const nx = -dy / l, ny = dx / l, ang = Math.atan2(dy, dx);
  g.beginPath();
  g.moveTo(a[0] + nx * ra, a[1] + ny * ra);
  g.lineTo(b[0] + nx * rb, b[1] + ny * rb);
  g.arc(b[0], b[1], Math.max(0.3, rb), ang - Math.PI / 2, ang + Math.PI / 2);
  g.lineTo(a[0] - nx * ra, a[1] - ny * ra);
  g.arc(a[0], a[1], Math.max(0.3, ra), ang + Math.PI / 2, ang + Math.PI * 1.5);
  g.closePath(); g.fill();
}
export const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };

// rim light: the part of the mask that faces the light, coloured, laid over it
function rim(c, w, h, light, px, ox = 0, oy = 0) {
  const r = getBuf(1, w, h), rg = r.getContext('2d');
  rg.setTransform(1, 0, 0, 1, 0, 0); rg.globalCompositeOperation = 'source-over'; rg.clearRect(0, 0, w, h);
  rg.drawImage(c, 0, 0, w, h, 0, 0, w, h);
  rg.globalCompositeOperation = 'source-in'; rg.fillStyle = light.col; rg.fillRect(0, 0, w, h);
  rg.globalCompositeOperation = 'destination-out';
  if (light.dir === 'back') {
    // the light is behind and above: the rim is the mask less its erosion
    // (the intersection of shifted copies), thicker along the top
    const e = getBuf(3, w, h), eg = e.getContext('2d');
    eg.setTransform(1, 0, 0, 1, 0, 0); eg.globalCompositeOperation = 'source-over'; eg.clearRect(0, 0, w, h);
    eg.drawImage(c, 0, 0, w, h, 0, 0, w, h);
    eg.globalCompositeOperation = 'destination-in';
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; eg.drawImage(c, 0, 0, w, h, Math.cos(a) * px * 0.7, Math.sin(a) * px * 0.7 + px * 0.6, w, h); }
    eg.globalCompositeOperation = 'source-over';
    rg.drawImage(e, 0, 0, w, h, 0, 0, w, h);
  } else {
    const [lx, ly] = light.dir || [1, -1], l = Math.hypot(lx, ly) || 1;
    rg.drawImage(c, 0, 0, w, h, -lx / l * px, -ly / l * px, w, h);
  }
  // a light close by: the rim is bright on the edges nearest it and dies away
  if (light.at) {
    const [sx, sy] = light.at, R = light.fall || 200;
    const gr = rg.createRadialGradient(sx - ox, sy - oy, 0, sx - ox, sy - oy, R);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.35, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    rg.globalCompositeOperation = 'destination-in'; rg.fillStyle = gr; rg.fillRect(0, 0, w, h);
  }
  let src = r;
  if (light.soft) {
    const t = getBuf(2, w, h), tg = t.getContext('2d');
    tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, w, h);
    tg.filter = `blur(${light.soft}px)`; tg.drawImage(r, 0, 0, w, h, 0, 0, w, h); tg.filter = 'none';
    src = t;
  }
  const g = c.getContext('2d');
  g.save(); g.globalCompositeOperation = 'source-atop';
  g.globalAlpha = light.a ?? 1;
  g.drawImage(src, 0, 0, w, h, 0, 0, w, h);
  if (light.glow) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = light.glow; g.filter = `blur(${Math.max(1, px)}px)`; g.drawImage(src, 0, 0, w, h, 0, 0, w, h); g.filter = 'none'; }
  g.restore();
}
