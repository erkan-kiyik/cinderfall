// CINDERFALL LAB — locomotion animator.
//
// Turns movement state into a Pose every frame. Lower body is procedural:
// a gait cycle advanced by distance travelled (feet never skate), stance and
// swing trajectories per foot, hip bob, lean, and ankle IK onto the ground
// under each foot. Upper body is an aim layer: the weapon sits in the shoulder
// pocket (rifles) or at arm's length (pistols), rotated by the aim angle, and
// both hands are solved onto its grips; torso and head turn toward the aim.
// Air, landing, crouch, slide, mantle and ladder are blended on top.
import { HOLD } from './rig.js';
import { SK } from '../art/figure.js';
import { WEAPONS } from '../art/weapons/index.js';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const ss = (t) => t * t * (3 - 2 * t);
const TAU = Math.PI * 2;
const approach = (v, target, rate, dt) => v + (target - v) * (1 - Math.exp(-rate * dt));

// Pocket on the near shoulder where a stock sits, in the torso frame.
const POCKET = [SK.nearSh[0] + 2.6, SK.nearSh[1] + 1.4];

export class Animator {
  constructor(spec) {
    this.spec = spec;
    this.weapon = spec.weapon ? WEAPONS[spec.weapon] : null;
    this.hold = spec.weapon ? HOLD[spec.weapon] : null;
    this.phase = 0; this.t = 0;
    this.run = 0; this.crouch = 0; this.air = 0; this.slide = 0; this.sprint = 0; this.ladder = 0; this.mantle = 0;
    this.land = 0; this.landV = 0;
    this.aim = 0; this.vyS = 0; this.back = 0;
    this.ladderPh = 0;
    this.turn = 0;
  }

  // Simulation step: smooth the blend weights and advance the gait.
  update(dt, m, aimLocal) {
    this.t += dt;
    const sv = m.vx * m.facing; // signed speed along facing
    const spd = Math.abs(sv);
    const C = this.cycle();
    if (m.grounded && m.state !== 'slide') this.phase = (this.phase + (sv * dt) / C + 4) % 1;
    const grounded = m.grounded && m.state !== 'mantle' && m.state !== 'ladder';
    this.run = approach(this.run, clamp((spd - 70) / 90, 0, 1), 10, dt);
    this.sprint = approach(this.sprint, spd > 200 && grounded && m.state !== 'slide' ? 1 : 0, 9, dt);
    this.crouch = approach(this.crouch, m.crouching && m.state !== 'slide' ? 1 : 0, 14, dt);
    this.air = approach(this.air, !m.grounded && m.state === 'air' ? 1 : 0, 16, dt);
    this.slide = approach(this.slide, m.state === 'slide' ? 1 : 0, 16, dt);
    this.ladder = approach(this.ladder, m.state === 'ladder' ? 1 : 0, 14, dt);
    this.mantle = m.state === 'mantle' ? Math.min(1, m.mantle.t / m.mantle.dur) : 0;
    this.vyS = approach(this.vyS, m.vy, 12, dt);
    this.back = approach(this.back, sv < -20 ? 1 : 0, 10, dt);
    this.aim = approach(this.aim, aimLocal, 22, dt);
    if (m.state === 'ladder') this.ladderPh = m.y / 16;
    // landing spring: compress on impact, settle critically damped-ish
    if (m.ev.land) this.landV += Math.min(m.ev.land / 700, 1.3) * 60;
    const k = 320, c = 16;
    this.landV += (-k * this.land - c * this.landV) * dt;
    this.land += this.landV * dt;
  }

  // Gait shape for the current run/sprint blend. F: foot lands this far ahead
  // of the hip, Bk: leaves this far behind; beta: stance share of the cycle;
  // kick/mid: swing heel-kick and knee-drive heights.
  gait() {
    const r = this.run, s = this.sprint, G = this._g || (this._g = {});
    G.F = lerp(lerp(14, 12, r), 13, s); G.Bk = lerp(lerp(14, 18, r), 22, s);
    G.beta = lerp(lerp(0.6, 0.38, r), 0.34, s);
    G.kick = lerp(lerp(4, 17, r), 22, s); G.mid = lerp(lerp(7, 13, r), 16, s);
    G.hip = lerp(lerp(30.6, 28.2, r), 27.4, s); G.bob = lerp(0.9, -1.6, r);
    return G;
  }
  // distance per full cycle: the stance must cover exactly F + Bk (no skating)
  cycle() { const G = this.gait(); return (G.F + G.Bk) / G.beta; }

  // Write the pose. `ground(xLocal)` → ground height (local y) under a foot, or null.
  pose(P, m, ground) {
    const r = this.run, cr = this.crouch, air = this.air, sl = this.slide, sp = this.sprint, ld = this.ladder;
    const ph = this.phase, t = this.t;
    const moving = Math.abs(m.vx) > 8 && m.grounded;
    const mv = clamp(Math.abs(m.vx) / 70, 0, 1); // 0 idle → 1 walking

    // --- gait feet (relative to the hip centre) ---------------------------------
    const G = this.gait(), beta = G.beta;
    const bz = (a0, a1, a2, a3, k) => { const u = 1 - k; return u * u * u * a0 + 3 * u * u * k * a1 + 3 * u * k * k * a2 + k * k * k * a3; };
    const foot = (u) => {
      if (u < beta) { // stance: planted, rolling from heel to toe
        const k = u / beta;
        return [lerp(G.F, -G.Bk, k) * mv, 0, lerp(-0.12, 0.45, k * k) * mv];
      }
      const k = (u - beta) / (1 - beta);
      const x = bz(-G.Bk, -G.Bk - G.kick * 0.25, G.F * 0.7, G.F, k) * mv;
      const y = bz(0, G.kick * 1.15, G.mid * 1.2, 0, k) * mv;
      return [x, y, bz(0.5, 0.3, -0.1, -0.15, k) * mv];
    };
    const nf = foot((ph + 0) % 1), ff = foot((ph + 0.5) % 1);
    // idle stance: near foot back, far foot forward (3/4 view)
    const standN = -3.2, standF = 4.0;
    let nx = standN * (1 - mv) + nf[0] - 1.0 * mv, fx = standF * (1 - mv) + ff[0] + 1.6 * mv;
    let nLift = nf[1], fLift = ff[1];
    let nPitch = nf[2], fPitch = ff[2];
    // hip height: bob up at mid-stance when walking, down when running
    const bobPh = Math.cos(2 * TAU * (ph - beta / 2));
    let hipH = lerp(30.6, G.hip, mv) + G.bob * bobPh * mv;
    hipH += Math.sin(t * 2.1) * 0.22 * (1 - mv); // breathing
    let hipX = r * 1.4 * mv;
    let lean = -lerp(0.03, 0.12, r) * mv - sp * 0.1 + this.back * 0.05;

    // --- crouch ---------------------------------------------------------------
    if (cr > 0) {
      hipH = lerp(hipH, 21.5 + 0.5 * bobPh * mv, cr);
      nx = lerp(nx, -6.5 * (1 - mv) + (nf[0] * 0.7 - 2) * mv, cr);
      fx = lerp(fx, 6.5 * (1 - mv) + (ff[0] * 0.7 + 3) * mv, cr);
      nLift *= 1 - cr * 0.4; fLift *= 1 - cr * 0.4;
      lean = lerp(lean, -0.14, cr);
    }
    // --- landing compression ----------------------------------------------------
    hipH -= Math.max(0, this.land);

    // ankle targets on the ground (slopes: per-foot ground height)
    const gy = (x) => { const g = ground ? ground(x) : null; return g === null ? 0 : clamp(g, -12, 12); };
    let nAy = gy(nx) - SK.ankleH - nLift, fAy = gy(fx) - SK.ankleH - fLift;
    const baseG = Math.min(gy(nx), gy(fx));
    let hipY = baseG - hipH;

    // --- air: tuck going up, reach down falling ------------------------------------
    if (air > 0) {
      const up = clamp(-this.vyS / 380, 0, 1), down = clamp(this.vyS / 500, 0, 1);
      const ahy = -31;
      const tnx = lerp(-3.5, -6, up), tny = ahy + lerp(26.5, 19, up) + down * 1.5;
      const tfx = lerp(5.5, 7.5, up), tfy = ahy + lerp(24, 15.5, up);
      hipY = lerp(hipY, ahy, air);
      nx = lerp(nx, tnx, air); nAy = lerp(nAy, tny, air);
      fx = lerp(fx, tfx, air); fAy = lerp(fAy, tfy, air);
      nPitch = lerp(nPitch, 0.35 * up, air); fPitch = lerp(fPitch, -0.25, air);
      lean = lerp(lean, -0.06 + down * 0.06, air);
    }
    // --- slide: front leg out along the floor, back leg folded under ----------------
    if (sl > 0) {
      // low enough to pass under 32 units of clearance
      hipY = lerp(hipY, -10, sl); hipX = lerp(hipX, -6, sl);
      nx = lerp(nx, -6, sl); nAy = lerp(nAy, -2.5, sl);
      fx = lerp(fx, 22, sl); fAy = lerp(fAy, -3.0, sl);
      nPitch = lerp(nPitch, 1.1, sl); fPitch = lerp(fPitch, -0.5, sl);
      lean = lerp(lean, 0.92, sl);
    }
    // --- mantle: knees up, body forward over the edge --------------------------------
    if (this.mantle > 0) {
      const k = this.mantle, w = Math.sin(Math.PI * Math.min(1, k * 1.15));
      hipY = lerp(hipY, -27, w); nx = lerp(nx, -2, w); nAy = lerp(nAy, -13, w); fx = lerp(fx, 7, w); fAy = lerp(fAy, -18, w);
      lean = lerp(lean, -0.45, w);
    }
    // --- ladder: alternate feet on the rungs ----------------------------------------
    if (ld > 0) {
      const lp = this.ladderPh, a = (lp % 1 + 1) % 1, b = (a + 0.5) % 1;
      const step = (u) => (u < 0.5 ? u * 2 : 2 - u * 2) * 7;
      hipY = lerp(hipY, -31, ld); hipX = lerp(hipX, -2.5, ld);
      nx = lerp(nx, 1.5, ld); nAy = lerp(nAy, -2.5 - step(a), ld);
      fx = lerp(fx, 3.0, ld); fAy = lerp(fAy, -2.5 - step(b), ld);
      lean = lerp(lean, 0.04, ld);
    }

    P.hipX = hipX; P.hipY = hipY; P.lean = lean;
    P.nAx = nx; P.nAy = nAy; P.fAx = fx; P.fAy = fAy; P.nFoot = nPitch; P.fFoot = fPitch;
    P.head = -lean * 0.7;

    // --- upper body / aim layer -----------------------------------------------------
    const aim = this.aim;
    if (this.weapon && ld < 0.5) {
      const H = this.hold;
      P.gun = this.weapon; P.gk = H.k;
      // aim leans the torso and lifts the chin a little
      const aimDown = lerp(aim, 0.62, sp); // sprint carry: muzzle down-forward
      P.lean += -aimDown * 0.12 * (1 - sl * 0.5);
      P.head += -aimDown * 0.45;
      const c = Math.cos(-P.lean), s = Math.sin(-P.lean);
      const bob = (moving ? Math.sin(2 * TAU * ph) * lerp(0.35, 0.9, r) : Math.sin(t * 2.1) * 0.25);
      P.ga = aimDown + Math.sin(t * 1.3) * 0.008 * (1 - mv);
      const ca = Math.cos(P.ga), sa = Math.sin(P.ga);
      if (H.style === 'rifle') {
        const px = P.hipX + POCKET[0] * c - POCKET[1] * s, py = P.hipY + POCKET[0] * s + POCKET[1] * c + bob * 0.4;
        const [sx0, sy0] = H.stock;
        P.gx = px - (sx0 * ca - sy0 * sa) * H.k; P.gy = py - (sx0 * sa + sy0 * ca) * H.k;
        P.supportFree = false;
      } else {
        // pistol: two-handed at arm's length from between the shoulders
        const mx = P.hipX + (-1.3) * c - (-18.6) * s, my = P.hipY + (-1.3) * s + (-18.6) * c;
        const reach = lerp(15.5, 10, sp);
        P.gx = mx + ca * reach; P.gy = my + sa * reach + 1.2 + bob * 0.3;
        P.supportFree = false;
      }
      P.wAx = -0.9; P.wAy = -1.4; P.wBx = H.wB[0]; P.wBy = H.wB[1];
      P.handN = 0.2; P.handF = H.handF ?? -1.2;
    } else {
      P.gun = null; P.reach = false;
      const fa = this.spec.freeArms;
      if (ld > 0.5) {
        // hands on the rungs in front of the body, alternating with the feet
        const lp = this.ladderPh, a = (lp % 1 + 1) % 1, b = (a + 0.5) % 1;
        const step = (u) => (u < 0.5 ? u * 2 : 2 - u * 2) * 7;
        P.reach = true;
        P.nHx = 5.5; P.nHy = P.hipY - 18 - step(b);
        P.fHx = 6.5; P.fHy = P.hipY - 26 - step(a);
        P.nHand = -2.4; P.fHand = -2.4;
      } else if (fa) {
        P.nUpper = fa.nUpper; P.nFore = fa.nFore; P.nHand = fa.nHand ?? 0;
        P.fUpper = fa.fUpper + Math.sin(ph * TAU) * 0.3 * mv; P.fFore = fa.fFore; P.fHand = fa.fHand ?? 0;
      } else {
        const sw = Math.sin(ph * TAU) * lerp(0.35, 0.8, r) * mv;
        P.nUpper = 0.1 + sw; P.nFore = -0.25 - r * 0.9 * mv; P.nHand = -0.1;
        P.fUpper = -0.05 - sw; P.fFore = -0.3 - r * 0.9 * mv; P.fHand = -0.1;
      }
    }
  }
}
