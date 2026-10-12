// CINDERFALL LAB — a rigged, animated character.
//
// Glue between a Mover (physics), the Animator (pose from movement + aim),
// the rig solver and the part sprites. Drawing happens in the character's
// local facing-right space into a CharRenderer slot; the renderer mirrors it
// when the character faces left.
import { Pose, Joints, solvePose } from '../anim/rig.js';
import { Animator } from '../anim/animator.js';
import { Chain } from '../anim/cloth.js';
import { SK } from '../art/figure.js';
import { CHARS } from './chars.js';

const LIMBS = ['upper', 'fore', 'hand', 'thigh', 'shin', 'foot'];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class Character {
  constructor(id, atlas, mover) {
    this.id = id; this.spec = CHARS[id]; this.m = mover;
    this.P = new Pose(); this.J = new Joints(); this.anim = new Animator(this.spec);
    const g = (n) => atlas.get(`${id}.${n}`) || null;
    this.R = { backFar: g('backFar'), torso: g('torso'), chest: g('chest'), front: g('front'), head: g('head') };
    for (const k of LIMBS) { this.R[k + 'N'] = g(`${k}.n`); this.R[k + 'F'] = g(`${k}.f`); }
    const w = this.spec.weapon;
    this.R.weapon = w ? atlas.get(this.spec.mat ? `w.${w}.${this.spec.mat}` : `w.${w}`) : null;
    this.R.scarf = g('scarf'); this.R.drone = g('drone'); this.R.shield = g('shield');
    this.facing = 1; this.rx = mover.x; this.ry = mover.y; this.px = mover.x; this.py = mover.y;
    this.aimX = mover.x + 100; this.aimY = mover.y - 50; this.aimLocal = 0;
    this.flash = 0;
    this.chains = (this.spec.cloth?.tails || []).map((t) => ({ t, c: new Chain(t.n, t.len) }));
    this.drone = { x: mover.x - 14, y: mover.y - 72, vx: 0, vy: 0 };
    this.t = 0;
    // a solved rest pose from the start, so anything anchored to the skeleton
    // (cloth, drone) is valid before the first frame is drawn
    this.anim.pose(this.P, mover, null); solvePose(this.P, this.J);
  }

  // world point under the aim; the character turns to face it
  setAim(x, y) { this.aimX = x; this.aimY = y; }

  preStep() { this.px = this.m.x; this.py = this.m.y; }

  // after the mover's step: aim, animation, pose and skeleton at sim rate
  postStep(dt, level = null) {
    const m = this.m;
    this.t += dt;
    // aim angle in local space from the shoulders
    const sx = m.x - m.facing * 1.5, sy = m.y - (m.crouching ? 38 : 50);
    let dx = (this.aimX - sx) * m.facing; const dy = this.aimY - sy;
    if (dx < 4) dx = 4;
    this.aimLocal = clamp(Math.atan2(dy, dx), -1.25, 1.15);
    this.anim.update(dt, m, this.aimLocal);
    this.facing = m.facing;
    const f0 = this.facing, mx = m.x, my = m.y;
    const ground = level && m.grounded ? (lx) => {
      const x = mx + lx * f0;
      const s = level.surface(x - 1, x + 1, x, my - 10, my + 10);
      return s === null ? null : s - my;
    } : null;
    this.anim.pose(this.P, m, ground);
    solvePose(this.P, this.J);
    // cloth: anchors at the back of the neck, in world space
    if (this.chains.length) {
      const J = this.J, c = Math.cos(J.a.torso), s = Math.sin(J.a.torso), f = this.facing;
      for (let i = 0; i < this.chains.length; i++) {
        const { t, c: ch } = this.chains[i];
        const lx = J.hip[0] + t.ax * c - t.ay * s, ly = J.hip[1] + t.ax * s + t.ay * c;
        ch.step(dt, m.x + lx * f, m.y + ly, -f, this.t, m.vx, i * 1.7, t.g);
      }
    }
    // the drone trails behind the head on a soft spring
    if (this.R.drone) {
      const d = this.drone, tx = m.x - 15 * m.facing, ty = m.y - 74 + Math.sin(this.t * 2.4) * 2;
      d.vx += ((tx - d.x) * 30 - d.vx * 8) * dt; d.vy += ((ty - d.y) * 30 - d.vy * 8) * dt;
      d.x += d.vx * dt; d.y += d.vy * dt;
    }
    this.flash = Math.max(0, this.flash - dt * 6);
  }

  // Render time: only the root is interpolated; the pose is from the last step.
  prepare(alpha) {
    const m = this.m;
    this.rx = this.px + (m.x - this.px) * alpha; this.ry = this.py + (m.y - this.py) * alpha;
  }

  drawParts(B) {
    const R = this.R, J = this.J, A = J.a, P = this.P, f = this.facing;
    const d = (r, p, a) => { if (r) B.draw(r, p[0], p[1], 1, 1, a); };
    // scarf tails behind everything (world points → local)
    if (R.scarf) {
      for (const { t, c } of this.chains) {
        for (let i = 0; i < c.n - 1; i++) {
          const k = i / (c.n - 2);
          const w = t.w0 + (t.w1 - t.w0) * k;
          const x0 = (c.x[i] - this.rx) * f, y0 = c.y[i] - this.ry, x1 = (c.x[i + 1] - this.rx) * f, y1 = c.y[i + 1] - this.ry;
          // stretch the segment a little past each point so joints overlap
          const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ex = (dx / L) * w * 0.45, ey = (dy / L) * w * 0.45;
          B.line(R.scarf, x0 - ex, y0 - ey, x1 + ex, y1 + ey, w);
        }
      }
    }
    // weapon slung across the back while climbing
    if (R.weapon && !P.gun) B.draw(R.weapon, J.hip[0] - 4, J.hip[1] - 12, 0.9, 0.9, -1.25);
    d(R.backFar, J.hip, A.torso);
    d(R.upperF, J.fSh, A.fUpper); d(R.foreF, J.fElb, A.fFore); d(R.handF, J.fWr, A.fFore + A.fHand);
    d(R.thighF, J.fHip, A.fThigh); d(R.shinF, J.fKnee, A.fShin); d(R.footF, J.fAnkle, A.fFoot);
    d(R.thighN, J.nHip, A.nThigh); d(R.shinN, J.nKnee, A.nShin); d(R.footN, J.nAnkle, A.nFoot);
    d(R.torso, J.hip, A.torso);
    d(R.head, J.neck, A.head);
    d(R.chest, J.hip, A.torso);
    if (P.gun && R.weapon) B.draw(R.weapon, P.gx, P.gy, P.gk, P.gk, P.ga);
    d(R.upperN, J.nSh, A.nUpper); d(R.foreN, J.nElb, A.nFore); d(R.handN, J.nWr, A.nFore + A.nHand);
    d(R.front, J.hip, A.torso);
    if (R.shield) B.draw(R.shield, J.hip[0], J.hip[1] + 31.3, 1, 1, 0); // follows the hips
    if (R.drone) B.draw(R.drone, (this.drone.x - this.rx) * f, this.drone.y - this.ry, 1, 1, Math.sin(this.t * 3) * 0.06);
  }
}

export { SK };
