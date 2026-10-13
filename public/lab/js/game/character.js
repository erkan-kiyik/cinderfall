// CINDERFALL LAB — a rigged, animated, armed character.
//
// Glue between a Mover (physics), the Animator (pose from movement + aim),
// the rig solver, the guns it carries and the part sprites. Drawing happens
// in the character's local facing-right space into a CharRenderer slot; the
// renderer mirrors it when the character faces left.
//
// Each simulation step: weapon input → guns → animation → pose → skeleton.
// Gun events (shots, magazines, shells, melee) are collected in `ev` for the
// scene, which owns bullets, effects, sounds and debris.
import { Pose, Joints, solvePose } from '../anim/rig.js';
import { Animator } from '../anim/animator.js';
import { Chain } from '../anim/cloth.js';
import { Ragdoll } from '../anim/ragdoll.js';
import { SK } from '../art/figure.js';
import { WEAPONS } from '../art/weapons/index.js';
import { CHARS } from './chars.js';
import { Gun } from './guns.js';

const LIMBS = ['upper', 'fore', 'hand', 'thigh', 'shin', 'foot'];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const SWAP = 0.36; // lower + raise

export class Character {
  constructor(id, atlas, mover, opts = {}) {
    this.id = id; this.spec = CHARS[id]; this.m = mover;
    this.P = new Pose(); this.J = new Joints(); this.anim = new Animator(this.spec);
    const g = (n) => atlas.get(`${id}.${n}`) || null;
    this.R = { backFar: g('backFar'), torso: g('torso'), chest: g('chest'), front: g('front'), head: g('head') };
    for (const k of LIMBS) { this.R[k + 'N'] = g(`${k}.n`); this.R[k + 'F'] = g(`${k}.f`); }
    this.R.scarf = g('scarf'); this.R.drone = g('drone'); this.R.shield = g('shield');
    this.R.knife = atlas.get('i.knife'); this.R.holster = atlas.get('i.holster'); this.R.shell = atlas.get('i.casing.shell');
    // guns and their sprites
    const mat = this.spec.mat ? '.' + this.spec.mat : '';
    // loadout: the operator's defaults unless the player picked others
    const prim = opts.weapon !== undefined ? opts.weapon : this.spec.weapon;
    const side = opts.sidearm !== undefined ? opts.sidearm : this.spec.sidearm;
    this.loadout = [prim, side !== prim ? side : null].filter(Boolean);
    if (prim !== this.spec.weapon) this.anim.setWeapon(prim);
    this.guns = this.loadout.map((w) => new Gun(w, { infinite: !!this.spec.enemy || !!opts.infinite }));
    this.WR = {};
    for (const w of this.loadout) {
      const k = `w.${w}${mat}`;
      this.WR[w] = { body: atlas.get(k), bodyO: atlas.get(k + '.o'), mag: atlas.get(k + '/mag') || null, magO: atlas.get(k + '/mag.o') || null, slide: atlas.get(k + '/slide') || null, pump: atlas.get(k + '/pump') || null };
    }
    this.slot = 0; this.gun = this.guns[0] || null; this.anim.gun = this.gun;
    this.swapT = -1; this.swapTo = 0;
    this.win = { trigger: false, pressed: false, reload: false, swap: false, melee: false };
    this.ev = [];
    this.meleeHit = false;
    // health
    this.hpMax = this.spec.hp || 100; this.hp = this.hpMax; this.alive = true; this.team = this.spec.enemy ? 1 : 0;
    this.rag = null; this.deadT = 0; this.lastHit = 0;
    this.facing = 1; this.rx = mover.x; this.ry = mover.y; this.px = mover.x; this.py = mover.y;
    this.aimX = mover.x + 100; this.aimY = mover.y - 50; this.aimLocal = 0;
    this.flash = 0; this.flashCol = [1, 1, 1];
    this.chains = (this.spec.cloth?.tails || []).map((t) => ({ t, c: new Chain(t.n, t.len) }));
    this.drone = { x: mover.x - 14, y: mover.y - 72, vx: 0, vy: 0 };
    this.t = 0;
    this._v = new Float32Array(2); this._w = new Float32Array(2);
    // a solved rest pose from the start, so anything anchored to the skeleton
    // (cloth, drone) is valid before the first frame is drawn
    this.anim.pose(this.P, mover, null); solvePose(this.P, this.J);
  }

  get weaponId() { return this.gun ? this.gun.id : null; }
  get W() { return this.gun ? WEAPONS[this.gun.id] : null; }

  // world point under the aim; the character turns to face it
  setAim(x, y) { this.aimX = x; this.aimY = y; }
  // weapon input for the next step (edges are latched until consumed)
  weaponInput(o) {
    const w = this.win;
    w.trigger = !!o.trigger;
    if (o.pressed) w.pressed = true;
    if (o.reload) w.reload = true;
    if (o.swap) w.swap = true;
    if (o.melee) w.melee = true;
  }

  preStep() { this.px = this.m.x; this.py = this.m.y; if (this.rag) { this.px = this.rx; this.py = this.ry; } }

  // can the gun be used right now (not climbing, mantling, or dead)
  get armed() { const s = this.m.state; return this.alive && s !== 'ladder' && s !== 'mantle'; }

  stepWeapons(dt) {
    const w = this.win, A = this.anim, m = this.m;
    this.ev.length = 0;
    if (!this.gun) { w.pressed = w.reload = w.swap = w.melee = false; return; }
    // swap / knife presses wait a moment if the other one is still playing
    this.swapBuf = w.swap ? 0.45 : Math.max(0, (this.swapBuf || 0) - dt);
    this.meleeBuf = w.melee ? 0.45 : Math.max(0, (this.meleeBuf || 0) - dt);
    // weapon swap: lower, switch at the midpoint, raise
    if (this.swapBuf > 0 && this.swapT < 0 && A.meleeT < 0 && this.guns.length > 1 && this.armed) {
      this.gun.cancel(); this.swapT = 0; this.swapTo = (this.slot + 1) % this.guns.length; this.swapBuf = 0;
      this.ev.push({ type: 'swap' });
    }
    if (this.swapT >= 0) {
      const t0 = this.swapT; this.swapT += dt;
      if (t0 < SWAP / 2 && this.swapT >= SWAP / 2) {
        this.slot = this.swapTo; this.gun = this.guns[this.slot];
        A.setWeapon(this.gun.id); A.gun = this.gun;
        this.ev.push({ type: 'draw', id: this.gun.id });
      }
      const u = this.swapT / SWAP;
      A.swapK = u < 0.5 ? Math.sin(u * Math.PI) : Math.sin(u * Math.PI);
      if (this.swapT >= SWAP) { this.swapT = -1; A.swapK = 0; }
    }
    // knife
    if (this.meleeBuf > 0 && A.meleeT < 0 && this.swapT < 0 && this.armed) {
      if (this.gun.state === 'reload') this.gun.cancel();
      A.startMelee(); this.meleeHit = false; this.meleeBuf = 0;
      this.ev.push({ type: 'knife' });
    }
    if (A.meleeT >= 0 && !this.meleeHit && A.meleeT > A.meleeDur * 0.36) { this.meleeHit = true; this.ev.push({ type: 'meleeHit' }); }
    // the gun itself
    const busy = this.swapT >= 0 || A.meleeT >= 0 || !this.armed;
    const air = m.grounded ? 0 : 1, moving = clamp(Math.abs(m.vx) / 165, 0, 1);
    const sprinting = A.sprint > 0.5;
    const gin = this._gin || (this._gin = {});
    gin.trigger = w.trigger && !busy && !sprinting; gin.pressed = w.pressed && !busy && !sprinting; gin.reload = w.reload && !busy;
    gin.moving = moving; gin.air = air; gin.crouch = m.crouching ? 1 : 0;
    const ev = busy ? (this.gun.state === 'reload' && this.armed ? this.gun.update(dt, { ...gin, trigger: false, pressed: false }) : []) : this.gun.update(dt, gin);
    // a reload keeps going during a melee? no: melee cancelled it above
    for (const e of ev) {
      this.ev.push(e);
      if (e.type === 'fire') { const k = this.gun.s.kick; A.kick(k[0], k[1]); }
    }
    w.pressed = w.reload = w.swap = w.melee = false;
  }

  // after the mover's step: guns, aim, animation, pose and skeleton at sim rate
  postStep(dt, level = null) {
    const m = this.m;
    this.t += dt;
    if (this.rag) { this.stepDead(dt, level); return; }
    // aim angle in local space from the shoulders
    const sx = m.x - m.facing * 1.5, sy = m.y - (m.crouching ? 38 : 50);
    let dx = (this.aimX - sx) * m.facing; const dy = this.aimY - sy;
    if (dx < 4) dx = 4;
    this.aimLocal = clamp(Math.atan2(dy, dx), -1.25, 1.15);
    this.stepWeapons(dt);
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
    this.stepCloth(dt, m.x, m.y, m.vx);
    // the drone trails behind the head on a soft spring
    if (this.R.drone) {
      const d = this.drone, tx = m.x - 15 * m.facing, ty = m.y - 74 + Math.sin(this.t * 2.4) * 2;
      d.vx += ((tx - d.x) * 30 - d.vx * 8) * dt; d.vy += ((ty - d.y) * 30 - d.vy * 8) * dt;
      d.x += d.vx * dt; d.y += d.vy * dt;
    }
    this.flash = Math.max(0, this.flash - dt * 9);
  }

  stepCloth(dt, x, y, vx) {
    if (!this.chains.length) return;
    const J = this.J, c = Math.cos(J.a.torso), s = Math.sin(J.a.torso), f = this.facing;
    for (let i = 0; i < this.chains.length; i++) {
      const { t, c: ch } = this.chains[i];
      const lx = J.hip[0] + t.ax * c - t.ay * s, ly = J.hip[1] + t.ax * s + t.ay * c;
      ch.step(dt, x + lx * f, y + ly, -f, this.t, vx, i * 1.7, t.g);
    }
  }

  // --- world-space queries (sim time) -------------------------------------------
  // local → world for this character
  toWorld(lx, ly, out) { out[0] = this.m.x + lx * this.facing; out[1] = this.m.y + ly; return out; }
  // weapon-space point of the gun in hand → world
  gunPoint(x, y, out) {
    const P = this.P, c = Math.cos(P.ga), s = Math.sin(P.ga), k = P.gk;
    return this.toWorld(P.gx + (x * c - y * s) * k, P.gy + (x * s + y * c) * k, out);
  }
  muzzle(out) { const W = this.W; return this.gunPoint(W.muzzle[0], W.muzzle[1], out); }
  // where a shot really starts (between the shoulders: no shooting through walls)
  shoulder(out) { out[0] = this.m.x - this.facing * 1.5; out[1] = this.m.y - (this.m.crouching ? 40 : 52); return out; }
  // world direction of a shot with a local angle offset
  shotDir(off, out) { const a = this.aimLocal + off; out[0] = Math.cos(a) * this.facing; out[1] = Math.sin(a); return out; }
  // world angle of the gun (for effects), and of the gun's +x axis
  gunAngle() { const a = this.P.ga; return this.facing > 0 ? a : Math.PI - a; }

  // Hit shapes in world space: capsules { x0, y0, x1, y1, r, zone }.
  hitShapes(out = []) {
    out.length = 0;
    if (!this.alive) return out;
    const J = this.J, f = this.facing, X = this.m.x, Y = this.m.y;
    const W = (p) => [X + p[0] * f, Y + p[1]];
    const cap = (a, b, r, zone) => { const p = W(a), q = W(b); out.push({ x0: p[0], y0: p[1], x1: q[0], y1: q[1], r, zone }); };
    const ha = J.a.head, head = [J.neck[0] + Math.sin(ha) * 5.6 + Math.cos(ha) * 1.0, J.neck[1] - Math.cos(ha) * 5.6 + Math.sin(ha) * 1.0];
    cap(head, head, 5.4, 'head');
    const c = Math.cos(J.a.torso), s = Math.sin(J.a.torso);
    const tp = (x, y) => [J.hip[0] + x * c - y * s, J.hip[1] + x * s + y * c];
    cap(tp(0.4, -3), tp(0.6, -19.4), 7.8, 'body');
    cap(J.nHip, J.nKnee, 3.8, 'limb'); cap(J.nKnee, J.nAnkle, 3.0, 'limb');
    cap(J.fHip, J.fKnee, 3.8, 'limb'); cap(J.fKnee, J.fAnkle, 3.0, 'limb');
    cap(J.nSh, J.nElb, 2.8, 'limb'); cap(J.nElb, J.nWr, 2.5, 'limb');
    return out;
  }
  // the riot shield as a world box, or null
  shieldBox() {
    const S = this.spec.shield;
    if (!S || !this.alive) return null;
    const J = this.J, f = this.facing, ox = this.m.x + J.hip[0] * f, oy = this.m.y + J.hip[1] + 31.3;
    const a = ox + S.x0 * f, b = ox + S.x1 * f;
    return { x0: Math.min(a, b), x1: Math.max(a, b), y0: oy + S.y0, y1: oy + S.y1 };
  }

  // damage: returns true if this hit killed
  damage(amount, zone, dx, dy, px, py) {
    if (!this.alive) return false;
    this.hp -= amount; this.lastHit = this.t;
    this.flash = 1; this.flashCol = zone === 'head' ? [1, 0.95, 0.85] : [1, 0.82, 0.78];
    this.anim.flinch(Math.min(1.4, amount / 30));
    if (this.hp > 0) return false;
    this.die(dx, dy, px, py, amount);
    return true;
  }

  die(dx, dy, px, py, force = 40) {
    this.alive = false; this.hp = 0;
    const m = this.m;
    this.rag = new Ragdoll(this.J, this.facing, m.x, m.y, m.vx * 0.8, Math.min(m.vy, 0) * 0.5);
    const k = 90 + Math.min(force, 120) * 2.2;
    this.rag.push(px, py, dx * k, dy * k - 60);
    if (this.gun) this.gun.cancel();
    this.deadT = 0;
    this.droppedGun = !!this.gun;
  }

  stepDead(dt, level) {
    this.deadT += dt;
    // substeps keep the stiff chains stable
    this.rag.step(dt, level);
    const r = this.rag.root(this._v);
    this.rx = r[0]; this.ry = r[1];
    this.rag.pose(this.J, this.rx, this.ry);
    this.P.gun = null;
    this.stepCloth(dt, this.rx, this.ry, 0);
    this.flash = Math.max(0, this.flash - dt * 5);
  }

  // Render time: only the root is interpolated; the pose is from the last step.
  prepare(alpha) {
    if (this.rag) { const r = this.rag.root(this._v); this.rx = r[0]; this.ry = r[1]; this.rag.pose(this.J, this.rx, this.ry); return; }
    const m = this.m;
    this.rx = this.px + (m.x - this.px) * alpha; this.ry = this.py + (m.y - this.py) * alpha;
  }

  // palm of the far (support) hand, local
  farPalm(out) {
    const J = this.J, a = J.a.fFore + J.a.fHand;
    out[0] = J.fWr[0] - Math.sin(a) * 2.2; out[1] = J.fWr[1] + Math.cos(a) * 2.2;
    return a;
  }

  // draw a gun (body + moving parts) at weapon transform (x, y, k, a)
  drawGun(B, id, x, y, k, a, parts = true) {
    const WR = this.WR[id], W = WEAPONS[id], V = this.anim.vis, live = parts && id === this.weaponId;
    const c = Math.cos(a), s = Math.sin(a);
    const at = (r, ox, oy) => { if (r) B.draw(r, x + (ox * c - oy * s) * k, y + (ox * s + oy * c) * k, k, k, a); };
    if (WR.mag && (!live || V.mag === 'in')) { const d = live ? V.magOff : 0; at(WR.mag, W.magAxis[0] * d, W.magAxis[1] * d); }
    at(WR.body, 0, 0);
    if (WR.slide) at(WR.slide, live ? -V.slide * W.slide : 0, 0);
    if (WR.pump) at(WR.pump, live ? -V.pump * W.pump : 0, 0);
  }

  drawParts(B) {
    const R = this.R, J = this.J, A = J.a, P = this.P, f = this.facing, V = this.anim.vis;
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
    // stowed guns: long guns slung across the back, pistols on the thigh
    const cur = P.gun ? this.weaponId : null;
    let holstered = null;
    if (this.alive) for (const id of this.loadout) {
      if (id === cur) continue;
      if (WEAPONS[id].cls === 'TABANCA') { holstered = id; continue; }
      const c = Math.cos(A.torso), s = Math.sin(A.torso);
      this.drawGun(B, id, J.hip[0] + -4 * c + 12 * s, J.hip[1] + -4 * s - 12 * c, 0.9, A.torso - 1.25, false);
    }
    d(R.backFar, J.hip, A.torso);
    d(R.upperF, J.fSh, A.fUpper); d(R.foreF, J.fElb, A.fFore); d(R.handF, J.fWr, A.fFore + A.fHand);
    // things in the support hand: knife, a fresh magazine, a shotgun shell
    if (V.knife || V.mag === 'hand' || V.shell) {
      const pal = this._w, ha = this.farPalm(pal);
      if (V.knife && R.knife) B.draw(R.knife, pal[0], pal[1], 1, 1, ha + Math.PI / 2 - 0.25);
      if (V.mag === 'hand' && P.gun) {
        const W = this.W, WR = this.WR[this.weaponId], k = P.gk, a = P.ga + 0.25, c = Math.cos(a), s = Math.sin(a);
        const gx = W.magGrab[0], gy = W.magGrab[1];
        if (WR.mag) B.draw(WR.mag, pal[0] - (gx * c - gy * s) * k, pal[1] - (gx * s + gy * c) * k, k, k, a);
      }
      if (V.shell && R.shell) B.draw(R.shell, pal[0], pal[1], 0.75, 0.75, ha + Math.PI / 2);
    }
    d(R.thighF, J.fHip, A.fThigh); d(R.shinF, J.fKnee, A.fShin); d(R.footF, J.fAnkle, A.fFoot);
    d(R.thighN, J.nHip, A.nThigh); d(R.shinN, J.nKnee, A.nShin); d(R.footN, J.nAnkle, A.nFoot);
    if (holstered) {
      // grip up at the hip, muzzle down along the thigh
      const a = A.nThigh + Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
      const x = J.nHip[0] + 3.2 * c - 1.6 * s - 1.0, y = J.nHip[1] + 3.2 * s + 1.6 * c;
      this.drawGun(B, holstered, x, y, 0.95, a, false);
      if (R.holster) B.draw(R.holster, x, y, 0.95, 0.95, a);
    }
    d(R.torso, J.hip, A.torso);
    d(R.head, J.neck, A.head);
    d(R.chest, J.hip, A.torso);
    if (P.gun && cur) this.drawGun(B, cur, P.gx, P.gy, P.gk, P.ga);
    d(R.upperN, J.nSh, A.nUpper); d(R.foreN, J.nElb, A.nFore); d(R.handN, J.nWr, A.nFore + A.nHand);
    d(R.front, J.hip, A.torso);
    if (R.shield && this.alive) B.draw(R.shield, J.hip[0], J.hip[1] + 31.3, 1, 1, 0); // follows the hips
    if (R.drone && this.alive) B.draw(R.drone, (this.drone.x - this.rx) * f, this.drone.y - this.ry, 1, 1, Math.sin(this.t * 3) * 0.06);
  }
}

export { SK };
