// KOR LAB — M3: weapon core.
//
// The movement course from M2, now with guns: every operator carries a
// primary and a sidearm (fire, reload, swap, knife), bullets are hitscan
// against the tiles and the live skeletons, and Syndicate troopers hold
// positions along the course and shoot back in bursts. Deaths are verlet
// ragdolls; guns, magazines and casings fall and bounce as debris.
import * as M2 from './m2scene.js';
import { buildCourse } from '../art/env/course.js';
import { DENS } from './m1scene.js';
import { itemBakeList } from '../game/bakechars.js';
import { Character } from '../game/character.js';
import { Mover } from '../phys/mover.js';
import { WEAPONS } from '../art/weapons/index.js';
import { Effects } from '../game/fx.js';
import { rayTiles, rayCapsule, rayBox, falloff } from '../game/ballistics.js';
import { rgba } from '../gfx/batch.js';
import { col } from '../gfx/particles.js';
import { Sfx } from '../audio/sfx.js';
import { CombatHud } from '../ui/combathud.js';
import { haptic } from '../ui/kit.js';
import { TINTS } from '../core/economy.js';

export const BAKE_VERSION = 'm3-54';
export const OPERATORS = M2.OPERATORS;

// the M2 course with troopers along the way
const COURSE = buildCourse();
COURSE.enemies = [
  { id: 'tet', x: 548, y: -96 },   // on the deck
  { id: 'tet', x: 868, y: -40 },   // on the ramp plateau
  { id: 'tet', x: 1340, y: 0 },
  { id: 'kal', x: 1392, y: 0 },
  { id: 'tet', x: 1484, y: -40 },  // on container C
];

export function bakeList(quality) {
  const [, ch, fx] = DENS[quality];
  return [...M2.bakeList(quality, COURSE), ...itemBakeList(ch, fx)];
}

const RANGE = 1100;
const ENEMY_DMG = 0.35;   // troopers hit softer than the player (for now)
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class M3Scene extends M2.M2Scene {
  constructor(eng, controls, course = COURSE) {
    super(eng, controls, course);
    this.sfx = eng.sfx || new Sfx();
    this.fx = new Effects(eng, this.sfx);
    this.hud = new CombatHud(document.querySelector('#hud'));
    this.win = {};
    this.marker = { t: 9, kill: false };
    this.spawns = course.enemies.map((d) => ({ ...d }));
    this.ai = this.enemies.map(() => this.newBrain());
    this.player.hpMax = this.player.hp = 100;
    this.deadT = 0; this.enemyDmg = ENEMY_DMG;
    this.stats = { shots: 0, hits: 0, kills: 0, heads: 0, byWeapon: {} };
    this._a = new Float32Array(2); this._b = new Float32Array(2); this._d = new Float32Array(2); this._n = {};
    this.shapes = [];
    this.rounds = []; this.booms = []; // launcher rounds in flight, explosions
    // the first gesture starts the audio
    if (!eng.sfx) {
      const unlock = () => this.sfx.unlock();
      for (const ev of ['pointerdown', 'keydown', 'touchstart']) addEventListener(ev, unlock, { passive: true });
    }
  }

  newBrain() { return { seen: 0, aimX: 0, aimY: 0, burst: 0, pause: rand(0.8, 1.6), err: 0.13, respawn: 0 }; }

  switchOperator() {
    const id = super.switchOperator();
    this.player.hpMax = this.player.hp = 100;
    return id;
  }

  // --- input --------------------------------------------------------------------------
  beforePlayerStep(dt, inp) {
    const P = this.player, w = this.ctl.takeWeapon(this.win);
    if (!P.alive) { inp.moveX = 0; inp.jump = inp.jumpPressed = inp.sprint = inp.crouch = false; return; }
    if (w.trigger) inp.sprint = false; // no shooting at a full sprint
    // touch: holding the stick past the ring keeps semi-autos firing
    const semi = P.gun && P.gun.s.mode !== 'auto';
    P.weaponInput({ trigger: w.trigger, pressed: w.pressed || (w.auto && semi), reload: w.reload, swap: w.swap, melee: w.melee });
  }

  afterPlayerStep(dt) {
    const P = this.player;
    this.handle(P, dt);
    if (!P.alive) {
      this.deadT += dt;
      if (this.deadT > 2.4) this.respawnPlayer();
    }
  }

  respawnPlayer() {
    const [sx, sy] = this.C.spawn;
    this.mover = new Mover(this.L, sx, sy);
    this.player = new Character(OPERATORS[this.opIndex], this.e.atlas, this.mover);
    this.player.hpMax = this.player.hp = 100;
    this.deadT = 0;
  }

  // --- enemies: hold position, spot the player, shoot in bursts -------------------------------
  updateEnemies(dt) {
    const pm = this.mover, P = this.player;
    for (let i = 0; i < this.enemies.length; i++) {
      let e = this.enemies[i]; const b = this.ai[i];
      if (!e.alive) {
        b.respawn += dt;
        const sp = this.spawns[i], far = Math.abs(pm.x - sp.x) > 300;
        if (b.respawn > 6 && far && e.rag && e.rag.settled) {
          const m = new Mover(this.L, sp.x, sp.y); m.facing = -1;
          e = this.enemies[i] = new Character(sp.id, this.e.atlas, m); this.ai[i] = this.newBrain();
          continue;
        }
        e.preStep(); e.postStep(dt, this.L);
        continue;
      }
      const sh = e.shoulder(this._a), tx = pm.x, ty = pm.y - (pm.crouching ? 30 : 44);
      const dx = tx - sh[0], dy = ty - sh[1], dist = Math.hypot(dx, dy);
      let see = false;
      if (P.alive && dist < 400) {
        const d = rayTiles(this.L, sh[0], sh[1], dx / dist, dy / dist, dist, this._n);
        see = d >= dist - 2;
      }
      b.seen = see ? b.seen + dt : Math.max(0, b.seen - dt * 0.5);
      // aim follows the player with some lag and an error that shrinks while it watches
      const k = 1 - Math.exp(-dt * (see ? 6 : 1.5));
      b.aimX += ((see ? tx : e.m.x - e.m.facing * -200) - b.aimX) * k;
      b.aimY += ((see ? ty : e.m.y - 46) - b.aimY) * k;
      if (b.aimX === 0) { b.aimX = tx; b.aimY = ty; }
      b.err = see ? Math.max(0.04, b.err - dt * 0.025) : Math.min(0.13, b.err + dt * 0.05);
      if (see) e.m.facing = pm.x < e.m.x ? -1 : 1;
      e.setAim(b.aimX + Math.sin(this.t * 3.1 + i) * dist * b.err, b.aimY + Math.cos(this.t * 2.3 + i) * dist * b.err);
      // bursts of 3–5 after a reaction delay
      let trig = false;
      if (e.gun && see && b.seen > 0.7) {
        if (b.burst > 0) trig = true;
        else { b.pause -= dt; if (b.pause <= 0) { b.burst = 2 + ((Math.random() * 3) | 0); b.pause = rand(1.1, 1.9); } }
      }
      const before = e.gun ? e.gun.ammo : 0;
      e.weaponInput({ trigger: trig, pressed: trig });
      e.preStep(); e.m.step(dt, { moveX: 0, face: e.m.facing }); e.postStep(dt, this.L);
      if (e.gun && e.gun.ammo < before) b.burst--;
      this.handle(e, dt);
    }
  }

  // --- events from a character's guns ---------------------------------------------------------
  handle(ch, dt) {
    if (!ch.ev.length) return;
    const fx = this.fx, sfx = this.sfx, W = ch.W, mx = ch.m.x, my = ch.m.y - 40;
    for (const e of ch.ev) {
      switch (e.type) {
        case 'fire': if (ch === this.player && ch.gun) ch.gun.cd *= this.fireK(); this.shoot(ch, e); break;
        case 'eject': this.eject(ch); break;
        case 'magOut': {
          sfx.play('magOut', mx, my);
          this.dropMag(ch);
          break;
        }
        case 'magIn': sfx.play('magIn', mx, my); break;
        case 'charge': sfx.play('charge', mx, my); break;
        case 'pumpBack': sfx.play('pumpBack', mx, my); break;
        case 'pumpFwd': sfx.play('pumpFwd', mx, my); break;
        case 'shellIn': sfx.play('shellIn', mx, my); break;
        case 'dry': sfx.play('dry', mx, my); break;
        case 'swap': sfx.play('swap', mx, my); break;
        case 'draw': sfx.play('charge', mx, my, { vol: 0.5, rate: 1.2 }); break;
        case 'knife': {
          sfx.play('knife', mx, my);
          const f = ch.facing, sh = ch.shoulder(this._a);
          fx.slash(sh[0] + f * 14, sh[1] + 6, f > 0 ? -0.5 : Math.PI + 0.5, f);
          break;
        }
        case 'meleeHit': this.melee(ch); break;
      }
    }
    void W; void dt;
  }

  targets(ch) { return ch.team === 0 ? this.enemies : [this.player]; }
  // hooks for scenes built on this one
  onShot() {}
  onFire() {}
  onKill() {}
  onHit() {}
  dealtK() { return 1; }
  takenK(dmg) { return dmg; }
  fireK() { return 1; }

  shoot(ch, e) {
    const gun = ch.gun, s = gun.s, W = ch.W, L = this.L, n = this._n, fx = this.fx;
    const sh = ch.shoulder(this._a), mz = ch.muzzle(this._b), d = this._d;
    const isPlayer = ch === this.player;
    const ws = isPlayer ? (this.stats.byWeapon[gun.id] ||= { kills: 0, shots: 0, hits: 0, heads: 0 }) : null;
    if (isPlayer) { this.stats.shots++; ws.shots++; this.e.camera.addShake(s.shake); }
    let hitAny = false, killed = false, head = false;
    // a launcher: the round flies (see updateRounds)
    if (s.launcher) {
      const d0 = ch.shotDir(e.dirs[0], d), v = s.launcher.speed;
      this.rounds.push({ x: mz[0], y: mz[1], vx: d0[0] * v + ch.m.vx * 0.3, vy: d0[1] * v, t: 0, by: ch, L: s.launcher, gun: gun.id });
      fx.muzzle(mz[0], mz[1], ch.gunAngle(), 1.1, false);
      this.sfx.play(s.sound, mz[0], mz[1], { rate: rand(0.94, 1.06), cap: 4 });
      this.onFire(ch);
      return;
    }
    for (const off of e.dirs) {
      ch.shotDir(off, d);
      let t = rayTiles(L, sh[0], sh[1], d[0], d[1], RANGE, n), what = null, who = null, zone = null;
      const nx = n.nx, ny = n.ny;
      for (const c of this.targets(ch)) {
        if (!c.alive) continue;
        // cheap reject: target far off the ray
        const cx = c.m.x - sh[0], cy = c.m.y - 32 - sh[1], along = cx * d[0] + cy * d[1];
        if (along < -20 || along > t + 20 || Math.abs(cx * d[1] - cy * d[0]) > 46) continue;
        const sb = c.shieldBox();
        if (sb) { const ts = rayBox(sh[0], sh[1], d[0], d[1], t, sb); if (ts >= 0 && ts < t) { t = ts; what = 'shield'; who = c; } }
        for (const cap of c.hitShapes(this.shapes)) {
          const tc = rayCapsule(sh[0], sh[1], d[0], d[1], t, cap);
          // the head wins ties with the body it overlaps
          if (tc >= 0 && (tc < t || (tc <= t + 1.5 && cap.zone === 'head' && who === c))) { t = Math.min(t, tc); what = 'char'; who = c; zone = cap.zone; }
        }
      }
      const hx = sh[0] + d[0] * t, hy = sh[1] + d[1] * t;
      this.onShot(ch, sh[0], sh[1], d[0], d[1], t, what === 'char' ? who : null);
      // tracer from the muzzle (skip when the hit is behind it, point-blank)
      const ahead = (hx - mz[0]) * d[0] + (hy - mz[1]) * d[1];
      if (ahead > 4 && (e.dirs.length === 1 || Math.random() < 0.5)) fx.tracer(mz[0], mz[1], hx, hy, s.tracer, ch.team ? '#ff9a7a' : '#ffd9a0');
      if (what === 'char') {
        let dmg = falloff(s.dmg, t, s.falloff) * s.zone[zone] * (ch.team ? this.enemyDmg : 1);
        if (isPlayer) dmg *= this.dealtK(who, zone); else if (who === this.player) dmg = this.takenK(dmg);
        const dead = who.damage(dmg, zone, d[0], d[1], hx, hy);
        this.onHit(ch, who, dmg, dead);
        fx.flesh(hx, hy, d[0], d[1], zone === 'head');
        hitAny = true; head = head || zone === 'head';
        if (dead) { killed = true; this.onDeath(who, d[0], d[1]); this.onKill(who, ch, zone); }
        if (who === this.player && dmg > 0) { this.hud.hit(dmg, Math.sign(ch.m.x - who.m.x)); this.sfx.play('hurt', null, null, { vol: 0.6 }); this.e.camera.addShake(0.12); haptic('soft'); }
      } else if (what === 'shield') {
        fx.shield(hx, hy, d[0], d[1]);
        this.sfx.play('shield', hx, hy, { rate: rand(0.9, 1.1) });
      } else if (t < RANGE) {
        fx.impact(hx, hy, nx, ny, d[0], d[1], s.pellets > 1 ? 0.5 : 1);
        if (Math.random() < (s.pellets > 1 ? 0.15 : 0.6)) this.sfx.play(Math.random() < 0.3 ? 'ricochet' : 'impact', hx, hy, { rate: rand(0.85, 1.2), cap: 5 });
      }
    }
    fx.muzzle(mz[0], mz[1], ch.gunAngle(), s.pellets > 1 ? 1.35 : s.sound === 'pistol' ? 0.75 : 1, s.sound === 'dmr' || !!s.suppressed);
    this.sfx.play(s.sound, mz[0], mz[1], { rate: rand(0.94, 1.06) * (ch.team ? 0.96 : 1) * (s.pitch || 1), vol: s.vol, cap: 6 });
    if (isPlayer && hitAny) {
      this.stats.hits++; if (killed) this.stats.kills++; if (head) this.stats.heads++;
      ws.hits++; if (killed) ws.kills++; if (head) ws.heads++;
      haptic(killed ? 'soft' : 'tick');
      this.marker.t = 0; this.marker.kill = killed;
      this.sfx.play(killed ? 'kill' : head ? 'head' : 'marker', null, null, { vol: killed ? 0.8 : 0.6 });
    }
    this.onFire(ch);
    void W;
  }

  melee(ch) {
    const f = ch.facing, sh = ch.shoulder(this._a);
    for (const c of this.targets(ch)) {
      if (!c.alive) continue;
      const dx = (c.m.x - sh[0]) * f, dy = c.m.y - 34 - sh[1];
      if (dx < -4 || dx > 30 || Math.abs(dy) > 30) continue;
      const back = c.facing === ch.facing; // stabbed from behind
      if (c.spec.shield && !back) {
        // the riot shield takes it
        this.fx.shield(c.m.x - f * 10, c.m.y - 36, f, -0.2);
        this.sfx.play('shield', c.m.x, c.m.y - 36);
        break;
      }
      const dmg = back ? 150 : 55;
      const dead = c.damage(dmg, 'body', f, -0.2, c.m.x - f * 4, c.m.y - 36);
      this.onHit(ch, c, dmg, dead);
      this.fx.flesh(c.m.x - f * 4, c.m.y - 36, f, -0.2);
      this.sfx.play('knifeHit', c.m.x, c.m.y - 36);
      if (ch === this.player) {
        this.marker.t = 0; this.marker.kill = dead; this.sfx.play(dead ? 'kill' : 'marker', null, null, { vol: 0.7 });
        if (dead) { this.stats.kills++; const k = this.stats.byWeapon.knife ||= { kills: 0, shots: 0, hits: 0, heads: 0 }; k.kills++; }
      }
      if (dead) { this.onDeath(c, f, -0.3); this.onKill(c, ch, 'knife'); }
      break;
    }
  }

  onDeath(c, dx, dy) {
    // the gun leaves the hands and clatters down
    if (c.gun && c.P.gun) {
      const W = c.W, WR = c.WR[c.gun.id], P = c.P;
      const cx = (W.box[0] + W.box[2]) / 2, cy = (W.box[1] + W.box[3]) / 2;
      const p = c.gunPoint(cx, cy, this._b);
      // mirrored characters: mirror the sprite and negate its angle
      const a = c.facing > 0 ? P.ga : -P.ga;
      this.fx.drop(WR.bodyO, p[0], p[1], dx * 80 + rand(-30, 30), -120 + dy * 40, a, rand(-8, 8), { scale: P.gk, flip: c.facing, sound: 'gunDrop', rest: 14, size: 3, c: [cx, cy] });
    }
    if (c === this.player) { this.deadT = 0; this.sfx.play('hurt', null, null, { vol: 1 }); }
  }

  eject(ch) {
    if (!ch.W.casing) return;
    const W = ch.W, p = ch.gunPoint(W.eject[0], W.eject[1], this._b), f = ch.facing;
    const r = this.e.atlas.get(`i.casing.${W.casing}`);
    const ga = ch.P.ga;
    // up and back out of the port, plus the shooter's own motion
    const lvx = -Math.cos(ga) * rand(40, 80) + Math.sin(ga) * rand(60, 110), lvy = -Math.sin(ga) * rand(40, 80) - Math.cos(ga) * rand(90, 150);
    const snd = W.casing === 'shell' ? 'shellDrop' : Math.random() < 0.5 ? 'casing' : 'casing2';
    this.fx.drop(r, p[0], p[1], lvx * f + ch.m.vx * 0.8, lvy + Math.min(0, ch.m.vy) * 0.5, rand(0, 6.28), rand(-24, 24), { scale: 0.8, sound: snd, rest: 7, bounce: 0.45, size: 1 });
  }

  dropMag(ch) {
    const W = ch.W, WR = ch.WR[ch.gun.id], P = ch.P, V = ch.anim.vis;
    if (!WR.magO) return;
    const d = V.magOff || W.magPull * 0.5;
    const cx = W.magGrab[0], cy = W.magGrab[1] - 2;
    const p = ch.gunPoint(cx + W.magAxis[0] * d, cy + W.magAxis[1] * d, this._b);
    const a = ch.facing > 0 ? P.ga : -P.ga;
    this.fx.drop(WR.magO, p[0], p[1], ch.m.vx * 0.6 + rand(-10, 10) * ch.facing, 30, a, rand(-3, 3) * ch.facing, { scale: P.gk, flip: ch.facing, sound: 'magDrop', rest: 10, size: 3, c: [cx, cy] });
  }

  // launcher rounds: fly, bounce once off what they hit, go off after a moment
  updateRounds(dt) {
    const L = this.L;
    for (const r of this.rounds) {
      r.t += dt; r.vy += 600 * dt;
      const nx = r.x + r.vx * dt, ny = r.y + r.vy * dt;
      let boom = r.t > 1.6;
      if (L.solidBox(nx - 1.5, ny - 1.5, nx + 1.5, ny + 1.5)) {
        if (r.bounced || Math.hypot(r.vx, r.vy) < 120) boom = true;
        else { r.bounced = true; const hx = L.solidBox(nx - 1.5, r.y - 1.5, nx + 1.5, r.y + 1.5); if (hx) r.vx *= -0.45; else r.vy *= -0.4; r.vx *= 0.7; this.sfx.play('magDrop', r.x, r.y, { rate: 0.7, cap: 3 }); }
      } else { r.x = nx; r.y = ny; }
      // direct hits go off at once
      for (const c of this.targets(r.by)) if (c.alive && Math.abs(c.m.x - r.x) < 8 && r.y > c.m.y - 60 && r.y < c.m.y) boom = true;
      if (boom) { r.dead = true; this.explode(r); }
    }
    this.rounds = this.rounds.filter((r) => !r.dead);
    for (const b of this.booms) b.t -= dt;
    this.booms = this.booms.filter((b) => b.t > 0);
  }
  explode(r) {
    const { x, y } = r, R = r.L.r, by = r.by, isPlayer = by === this.player;
    let kills = 0, hit = false;
    for (const c of this.targets(by)) {
      if (!c.alive) continue;
      const dx = c.m.x - x, dy = c.m.y - 30 - y, d = Math.hypot(dx, dy);
      if (d > R || rayTiles(this.L, x, y, dx / (d || 1), dy / (d || 1), d, this._n) < d - 3) continue;
      let dmg = r.L.dmg * (1 - (d / R) * 0.65) * (by.team ? this.enemyDmg : 1);
      if (isPlayer) dmg *= this.dealtK(c, 'body'); else if (c === this.player) dmg = this.takenK(dmg);
      const dead = c.damage(dmg, 'body', Math.sign(dx) || 1, -0.7, c.m.x, c.m.y - 34);
      this.onHit(by, c, dmg, dead); hit = true;
      this.fx.flesh(c.m.x, c.m.y - 34, Math.sign(dx) || 1, -0.7);
      if (dead) { kills++; this.onDeath(c, Math.sign(dx) || 1, -0.8); this.onKill(c, by, 'body'); }
    }
    if (isPlayer) {
      const ws = this.stats.byWeapon[r.gun] ||= { kills: 0, shots: 0, hits: 0, heads: 0 };
      this.stats.shots++; ws.shots++;
      if (hit) { this.stats.hits++; ws.hits++; this.marker.t = 0; this.marker.kill = kills > 0; }
      this.stats.kills += kills; ws.kills += kills;
      if (kills) this.sfx.play('kill', null, null, { vol: 0.8 });
    }
    this.booms.push({ x, y, t: 0.45 });
    for (let k = 0; k < 7; k++) this.fx.impact(x, y, (Math.random() - 0.5) * 2, -1, (Math.random() - 0.5) * 2, -1, 1);
    this.puff(x, y + 4, 14, 1.2);
    // the blast as it looks: a ball of burning gas that rolls up and goes out, then a
    // column of dark smoke that climbs, spreads and hangs over the street
    const F = this.fx, rr = (a, b) => a + Math.random() * (b - a);
    for (let k = 0; k < 7; k++) F.smoke.emit(F.t, x + rr(-5, 5), y - rr(0, 6), rr(-24, 24), -rr(10, 40), rr(0.35, 0.6), 5, rr(12, 18), col('#ffb066', 0.7), col('#7a3a1e', 0), -20, 2, rr(0, 6), rr(-1, 1));
    for (let k = 0; k < 12; k++) F.smoke.emit(F.t, x + rr(-8, 8), y - rr(2, 12), rr(-12, 12), -rr(18, 46), rr(1.8, 3.2), 7, rr(20, 34), col('#2b2724', 0.6), col('#45403b', 0), -4, 0.9, rr(0, 6), rr(-0.5, 0.5));
    this.sfx.play('boom', x, y, { vol: 1 }); this.e.camera.addShake(0.35);
  }

  afterUpdate(dt) {
    this.updateRounds(dt);
    this.fx.update(dt, this.L);
    this.marker.t += dt;
    this.hud.update(dt, this.player);
    // the listener sits at the camera
    this.sfx.ear.x = this.cam.x; this.sfx.ear.y = this.cam.y;
  }

  // --- drawing hooks ----------------------------------------------------------------------------
  drawWorldExtras(B, w, x0, x1) {
    this.fx.drawWorld(B, w, x0, x1);
    if (!this.rounds.length) return;
    const dot = this.e.atlas.get('fx.dot');
    B.begin(w);
    for (const r of this.rounds) { B.draw(dot, r.x, r.y, 2.2, 1.6, Math.atan2(r.vy, r.vx), rgba('#1b1f27')); B.draw(dot, r.x, r.y, 1.4, 1.0, Math.atan2(r.vy, r.vx), rgba('#5d6878')); }
    B.end();
  }
  drawFrontExtras(B, w) { this.fx.drawSmoke(w); }
  addLights(R) {
    this.fx.addLights(R);
    for (const b of this.booms) R.addLight(b.x, b.y, 150, 2.6 * (b.t / 0.45), [1, 0.6, 0.3]);
  }

  drawGlow(B, w) {
    this.fx.drawGlow(B, w);
    // mythic and ultra finishes glow
    const P = this.player, sk = P.alive && P.gun ? TINTS[P.gun.id] : null;
    if (sk && sk.glow) {
      const sh = P.shoulder(this._a), mz = P.muzzle(this._b), glow = this.e.atlas.get('fx.glow'), k = 0.22 + 0.06 * Math.sin(this.t * 4);
      B.begin(w); B.setBlend(1);
      B.draw(glow, (sh[0] + mz[0]) / 2, (sh[1] + mz[1]) / 2, Math.hypot(mz[0] - sh[0], mz[1] - sh[1]) * 0.6, 4, Math.atan2(mz[1] - sh[1], mz[0] - sh[0]), rgba(sk.glow, k));
      B.setBlend(0); B.end();
    }
    if (this.rounds.length || this.booms.length) {
      const glow = this.e.atlas.get('fx.glow');
      B.begin(w); B.setBlend(1);
      for (const r of this.rounds) { B.draw(glow, r.x, r.y, 3, 3, 0, rgba('#ff6b2c', 0.9)); B.draw(glow, r.x - r.vx * 0.02, r.y - r.vy * 0.02, 5, 2, Math.atan2(r.vy, r.vx), rgba('#ffb070', 0.35)); }
      for (const b of this.booms) { const k = b.t / 0.45; B.draw(glow, b.x, b.y, 60 + (1 - k) * 30, 46 + (1 - k) * 20, 0, rgba('#ffb070', 0.9 * k)); }
      B.setBlend(0); B.end();
    }
    this.drawCrosshair(B, w);
  }

  // crosshair at the aim point: four ticks spaced by the current spread, and
  // a hit marker (X) that flashes on hits, red on kills
  drawCrosshair(B, w) {
    const P = this.player;
    if (!P.alive || !P.gun) return;
    const white = this.e.atlas.get('fx.white');
    const c = this.ctl, cam = this.e.camera;
    let ax, ay;
    if (c.aimMode === 'point') {
      const cv = this.e.renderer.canvas;
      [ax, ay] = cam.toWorld(c.aimSX / cv.clientWidth, c.aimSY / cv.clientHeight);
    } else {
      const sh = P.shoulder(this._a), d = P.shotDir(0, this._d);
      ax = sh[0] + d[0] * 90; ay = sh[1] + d[1] * 90;
    }
    const g = P.gun, s = g.s;
    const dist = Math.max(40, Math.hypot(ax - P.m.x, ay - P.m.y + 48));
    const cone = s.spread + s.moveSpread * clamp(Math.abs(P.m.vx) / 165, 0, 1) + s.airSpread * (P.m.grounded ? 0 : 1) + g.bloom + g.recoil * 0.25;
    const gap = clamp(2 + dist * cone, 2, 18), len = 2.6, th = 0.45;
    const col = rgba('#f4f1ea', 0.9);
    B.begin(w); B.setBlend(0);
    B.line(white, ax + gap, ay, ax + gap + len, ay, th, col); B.line(white, ax - gap, ay, ax - gap - len, ay, th, col);
    B.line(white, ax, ay + gap, ax, ay + gap + len, th, col); B.line(white, ax, ay - gap, ax, ay - gap - len, th, col);
    B.draw(white, ax, ay, 0.28, 0.28, 0, col);
    if (g.state === 'reload') {
      // reload progress as a short bar under the crosshair
      const p = g.progress;
      B.line(white, ax - 5, ay + gap + 5, ax + 5, ay + gap + 5, 0.6, rgba('#ffffff', 0.25));
      B.line(white, ax - 5, ay + gap + 5, ax - 5 + 10 * p, ay + gap + 5, 0.6, rgba('#ff6b2c', 0.95));
    }
    const m = this.marker;
    if (m.t < 0.22) {
      const k = 1 - m.t / 0.22, r0 = 2.6, r1 = 5.2 + (1 - k) * 1.5, mc = rgba(m.kill ? '#ff3347' : '#ffffff', k);
      for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) B.line(white, ax + sx * r0, ay + sy * r0, ax + sx * r1, ay + sy * r1, 0.6, mc);
    }
    B.end();
  }
}
