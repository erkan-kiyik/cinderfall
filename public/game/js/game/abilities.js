// KOR — operator abilities: two skills on cooldowns and an ultimate that
// charges from damage dealt and kills. Each comes from the operator's old
// trade (docs §10.10) and shows as a real thing, not a glow:
//
//   FLINT   (vex)     dash, Kor Atılımı: a burst forward, untouchable, sparks behind
//                     flash, Ateşleme Fişeği: a furnace flare that blinds whoever sees it
//                     overload (ult), Ocak Başı: 8 s faster fire and +30 % speed, embers
//   WARDEN  (hale)    wall, Yangın Kapısı: a steel fire door (real cover: solid tiles) for 10 s
//                     mine, Tüp Tuzağı: a pressure cylinder on a trigger, blows and slows
//                     turret (ult), Yangın Monitörü: a water monitor on a tripod for 20 s
//   VESPER  (morrow)  smoke, Duman Kutusu: Vanta's own canister, a cloud nobody sees through
//                     slow, Parazit: a jammer that drags troops to 60 % speed
//                     blackout (ult), Karartma: every trooper's visor dark for 4 s
//   SKYE    (kite)    drone, Hurda Dron: the scrap drone goes up, marks enemies for 8 s
//                     heat, Termal Kamera: 5 s of seeing every enemy through walls
//                     watch (ult), Çatı Gözcüsü: 10 s everyone marked, headshots +25 %
//   BULWARK (brick)   charge, Omuz Darbesi: a plated shoulder that knocks enemies down
//                     armor, Konteyner Sacı: 60 points of plate on top of health
//                     unstoppable (ult), Son Söz: 6 s taking 70 % less damage
//
// Effects on enemies go through the AI brains (blindT, slowK) and the world
// (smoke blocks sight lines); effects on the player through the scene's
// damage and fire-rate hooks.
import { rgba } from '../gfx/batch.js';
import { col } from '../gfx/particles.js';
import { rayTiles } from './ballistics.js';
import { SOLID, EMPTY } from '../phys/level.js';
import { t } from '../ui/i18n.js';
import { haptic } from '../ui/kit.js';

export const ABILITIES = {
  vex: [{ k: 'dash', cd: 6 }, { k: 'flash', cd: 12 }, { k: 'overload', ult: 1, dur: 8 }],
  hale: [{ k: 'wall', cd: 14 }, { k: 'mine', cd: 10 }, { k: 'turret', ult: 1, dur: 20 }],
  morrow: [{ k: 'smoke', cd: 12 }, { k: 'slow', cd: 14 }, { k: 'blackout', ult: 1, dur: 4 }],
  kite: [{ k: 'drone', cd: 16 }, { k: 'heat', cd: 15 }, { k: 'watch', ult: 1, dur: 10 }],
  brick: [{ k: 'charge', cd: 9 }, { k: 'armor', cd: 18 }, { k: 'unstop', ult: 1, dur: 6 }],
};
// each operator's signature colour (docs §9.2)
const COLOR = { vex: '#d9533a', hale: '#e6c25c', morrow: '#a3ad7f', kite: '#7ec8ff', brick: '#e2782f' };
const rand = (a, b) => a + Math.random() * (b - a);

export class Abilities {
  constructor(scene, op) {
    this.s = scene; this.op = ABILITIES[op] ? op : 'vex'; this.list = ABILITIES[this.op];
    this.color = COLOR[this.op];
    this.cd = [0, 0]; this.ult = 0;
    this.t = 0;
    this.on = {};                 // timed states: name → seconds left
    this.armor = 0;
    this.objs = [];               // walls, mines, turrets, smoke, fields, grenades, drone
    this.marks = new Map();       // enemy character → seconds marked
    this._n = {};
  }

  // --- what the scene asks --------------------------------------------------------------
  get speedK() { return this.on.overload ? 1.3 : 1; }
  get fireK() { return this.on.overload ? 0.7 : this.on.unstop ? 0.8 : 1; }
  // damage the player deals
  dmgK(who, zone) { let k = 1; if (this.on.watch && zone === 'head') k *= 1.25; if (this.marks.has(who)) k *= 1.1; return k; }
  // damage the player takes, after armour
  taken(dmg) {
    if (this.on.dash > 0) return 0;
    if (this.on.charge > 0) dmg *= 0.2;
    if (this.on.unstop) dmg *= 0.3;
    if (this.armor > 0) {
      const a = Math.min(this.armor, dmg); this.armor -= a; dmg -= a;
      // the plate rings: sparks off the chest
      const P = this.s.player, f = P.m.facing;
      for (let i = 0; i < 5; i++) this.s.fx.sparks.emit(this.s.fx.t, P.m.x + f * 4, P.m.y - 44, f * rand(40, 160), rand(-160, -20), rand(0.08, 0.2), 0.7, 0.25, col('#ffe2b0', 1), col('#e2782f', 0), 900, 2.5, 0, 0);
    }
    return dmg;
  }
  gainUlt(k) { if (!this.on[this.list[2].k]) this.ult = Math.min(1, this.ult + k); }
  // world hook for the AI: does smoke cut the line between two points?
  smokeBlocks(x0, y0, x1, y1) {
    for (const o of this.objs) {
      if (o.type !== 'smoke') continue;
      const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
      const k = Math.max(0, Math.min(1, ((o.x - x0) * dx + (o.y - y0) * dy) / L2));
      const px = x0 + dx * k - o.x, py = y0 + dy * k - o.y;
      if (px * px + py * py < o.r * o.r * o.grow * o.grow) return true;
    }
    return false;
  }

  // --- input ------------------------------------------------------------------------------
  input(ctl) {
    if (ctl.ab1Pressed) this.use(0);
    if (ctl.ab2Pressed) this.use(1);
    if (ctl.ultPressed) this.use(2);
    ctl.ab1Pressed = ctl.ab2Pressed = ctl.ultPressed = false;
  }
  ready(i) { return i < 2 ? this.cd[i] <= 0 : this.ult >= 1; }

  use(i) {
    const s = this.s, P = s.player;
    if (!P.alive || !this.ready(i)) { s.sfx.ui('deny', 0.5); return false; }
    const A = this.list[i], ok = (A.k === 'armor' ? this.armorUp : this[A.k]).call(this, P);
    if (ok === false) { s.sfx.ui('deny', 0.5); return false; }
    if (i < 2) this.cd[i] = A.cd; else { this.ult = 0; this.on[A.k] = A.dur; }
    s.mhud?.toast?.(t(`ab.${this.op}.${A.k}`), 0.9);
    haptic('soft');
    return true;
  }

  // --- the abilities -------------------------------------------------------------------------
  // dash and charge go where the stick points, else where the operator faces
  dir(P) { const mx = this.s.ctl.moveX; return Math.abs(mx) > 0.2 ? Math.sign(mx) : P.m.facing; }
  dash(P) {
    this.on.dash = 0.22; this.rushDir = this.dir(P); P.m.vx = this.rushDir * 560; if (!P.m.grounded) P.m.vy = Math.min(P.m.vy, -40);
    this.s.sfx.play('whoosh', P.m.x, P.m.y - 40, { vol: 1 });
    this.puff(P.m.x, P.m.y, 8);
  }
  flash(P) {
    const sh = P.shoulder([0, 0]), dx = P.aimX - sh[0], dy = P.aimY - sh[1], d = Math.hypot(dx, dy) || 1;
    const v = Math.max(170, Math.min(380, d * 1.5));
    this.objs.push({ type: 'grenade', x: sh[0], y: sh[1], vx: (dx / d) * v + P.m.vx * 0.5, vy: (dy / d) * v - 120, t: 5 });
    this.s.sfx.play('knife', sh[0], sh[1], { rate: 0.7 });
  }
  overload() { this.s.sfx.play('hiss', null, null, { rate: 0.6, vol: 1 }); }

  wall(P) {
    const L = this.s.L, f = P.m.facing, x = P.m.x + f * 26;
    if (!P.m.grounded) return false;
    // never build it into somebody
    for (const e of this.s.enemies) if (e.alive && Math.abs(e.m.x - x) < 14 && Math.abs(e.m.y - P.m.y) < 40) return false;
    const tx = L.tx(x), base = L.ty(P.m.y - 1), tiles = [];
    for (let k = 0; k < 6; k++) { const ty = base - k; if (L.get(tx, ty) === EMPTY) { L.set(tx, ty, SOLID); tiles.push([tx, ty]); } else if (k === 0) return false; else break; }
    if (!tiles.length) return false;
    this.objs.push({ type: 'wall', x: L.left(tx), y: L.top(base) + 8, w: 8, h: tiles.length * 8, tiles, t: 10 });
    this.s.sfx.play('shield', x, P.m.y - 30, { rate: 0.6, vol: 0.9 });
    this.puff(x, P.m.y, 10);
  }
  mine(P) {
    const x = P.m.x + P.m.facing * 10;
    this.objs.push({ type: 'mine', x, y: this.floor(x, P.m.y), t: 40, arm: 0.6 });
    this.s.sfx.play('magIn', P.m.x, P.m.y, { rate: 0.8 });
  }
  turret(P) {
    let x = P.m.x - P.m.facing * 14;
    if (Math.abs(this.floor(x, P.m.y) - P.m.y) > 2) x = P.m.x; // no floor behind: at the feet
    this.objs.push({ type: 'turret', x, y: this.floor(x, P.m.y), t: 20, shotT: 0, face: P.m.facing, aim: 0 });
    this.s.sfx.play('magIn', P.m.x, P.m.y, { rate: 0.6 });
  }

  smoke(P) {
    const [x, y] = this.groundAt(P.aimX, P.aimY);
    this.objs.push({ type: 'smoke', x, y: y - 30, r: 62, t: 9, grow: 0, emitT: 0 });
    this.s.sfx.play('hiss', x, y);
  }
  slow(P) {
    const [x, y] = this.groundAt(P.aimX, P.aimY);
    this.objs.push({ type: 'field', x, y, r: 74, t: 7 });
    this.s.sfx.play('marker', x, y, { rate: 0.6, vol: 0.7 });
  }
  blackout() { for (const b of this.s.brains) if (b.ch.alive) { b.blindT = 4; b.aw = Math.min(b.aw, 0.5); } this.flashT = 0.5; this.s.sfx.play('marker', null, null, { rate: 0.35, vol: 1 }); }

  drone(P) { this.objs.push({ type: 'drone', x: P.m.x, y: P.m.y - 40, t: 8 }); this.s.sfx.play('whoosh', P.m.x, P.m.y - 60, { rate: 1.8, vol: 0.5 }); }
  heat() { this.on.heat = 5; this.s.sfx.play('marker', null, null, { rate: 0.7, vol: 0.8 }); }
  watch() { this.s.sfx.play('marker', null, null, { rate: 0.5, vol: 1 }); }

  charge(P) { this.on.charge = 0.45; this.rushDir = this.dir(P); this.hitDone = new Set(); this.s.sfx.play('whoosh', P.m.x, P.m.y, { rate: 0.7, vol: 1 }); this.puff(P.m.x, P.m.y, 10); }
  armorUp() { this.armor = 60; this.s.sfx.play('shield', null, null, { rate: 0.8, vol: 0.9 }); }
  unstop() { this.s.sfx.play('shield', null, null, { rate: 0.5, vol: 1 }); }

  // --- simulation ------------------------------------------------------------------------------
  update(dt) {
    const s = this.s, P = s.player, L = s.L;
    this.t += dt;
    for (let i = 0; i < 2; i++) this.cd[i] = Math.max(0, this.cd[i] - dt);
    this.ult = Math.min(1, this.ult + dt * 0.004);
    for (const k of Object.keys(this.on)) { this.on[k] -= dt; if (this.on[k] <= 0) delete this.on[k]; }
    this.flashT = Math.max(0, (this.flashT || 0) - dt);
    if (P.alive) s.mover.speedK = this.speedK * ((P.gun && P.gun.s.moveK) || 1);
    P.armor = this.armor; P.armorMax = 60;
    // what shows an ability is on: sparks off the rush, embers off the scarf, dust under the boots
    const F = s.fx, px = P.m.x, py = P.m.y;
    if (P.alive && (this.on.dash > 0 || this.on.charge > 0)) for (let i = 0; i < 3; i++) {
      if (this.on.dash > 0) F.sparks.emit(F.t, px - this.rushDir * rand(2, 8), py - rand(10, 50), -this.rushDir * rand(30, 120), rand(-60, 20), rand(0.15, 0.35), 0.8, 0.3, col('#ffcf8a', 1), col('#d9533a', 0), 200, 2, 0, 0);
      else this.puff(px - this.rushDir * 6, py, 1);
    }
    if (P.alive && this.on.overload && Math.random() < dt * 26) F.sparks.emit(F.t, px + rand(-7, 7), py - rand(30, 58), rand(-14, 14) - P.m.facing * 10, rand(-50, -20), rand(0.6, 1.2), 0.9, 0.5, col('#ffb070', 1), col('#d9533a', 0), -30, 1, 0, 0);
    if (P.alive && this.on.unstop && (this.stepT = (this.stepT || 0) - dt) <= 0) { this.stepT = Math.abs(P.m.vx) > 20 ? 0.22 : 0.6; this.puff(px, py, Math.abs(P.m.vx) > 20 ? 3 : 1); }
    // the charge: keep the rush going, knock down whoever is in the way
    if (this.on.dash > 0 && P.alive) P.m.vx = this.rushDir * 560;
    if (this.on.charge > 0 && P.alive) {
      P.m.vx = this.rushDir * 470;
      for (const e of s.enemies) {
        if (!e.alive || this.hitDone.has(e)) continue;
        const f = this.rushDir, dx = (e.m.x - P.m.x) * f;
        if (dx > -6 && dx < 26 && Math.abs(e.m.y - P.m.y) < 30) {
          this.hitDone.add(e); e.m.vx = f * 340; e.m.vy = -150; e.m.grounded = false; e.m.state = 'air';
          this.hurt(e, 40, f, -0.4);
          const b = this.brainOf(e); if (b) b.blindT = Math.max(b.blindT || 0, 1.2);
          s.e.camera.addShake(0.25); s.sfx.play('shield', e.m.x, e.m.y - 30, { rate: 0.7 });
        }
      }
    }
    // marks fade
    for (const [e, tm] of this.marks) { if (!e.alive || tm <= dt) this.marks.delete(e); else this.marks.set(e, tm - dt); }
    if (this.on.watch) for (const e of s.enemies) if (e.alive) this.marks.set(e, Math.max(this.marks.get(e) || 0, 0.3));
    // objects
    for (const o of this.objs) {
      o.t -= dt;
      if (o.type === 'grenade') {
        o.vy += 700 * dt;
        const nx = o.x + o.vx * dt, ny = o.y + o.vy * dt;
        if (L.solidBox(nx - 1.5, ny - 1.5, nx + 1.5, ny + 1.5)) { o.vx *= -0.3; o.vy *= -0.3; } else { o.x = nx; o.y = ny; }
        if ((o.age = (o.age || 0) + dt) > 0.75) { this.pop(o); o.t = 0; }
      } else if (o.type === 'mine') {
        o.arm -= dt;
        if (o.arm <= 0) for (const e of s.enemies) if (e.alive && Math.abs(e.m.x - o.x) < 24 && Math.abs(e.m.y - o.y) < 28) { this.blast(o.x, o.y - 6, 64, 75, true); o.t = 0; break; }
      } else if (o.type === 'turret') {
        o.shotT -= dt;
        if (o.shotT <= 0) {
          const hx = o.x, hy = o.y - 14;
          let best = null, bd = 330;
          for (const e of s.enemies) {
            if (!e.alive) continue;
            const dx = e.m.x - hx, dy = e.m.y - 34 - hy, d = Math.hypot(dx, dy);
            if (d < bd && rayTiles(L, hx, hy, dx / d, dy / d, d, this._n) >= d - 2) { best = e; bd = d; }
          }
          if (best) {
            o.face = best.m.x < hx ? -1 : 1; o.shotT = 0.12;
            const tx = best.m.x + (Math.random() - 0.5) * 6, ty = best.m.y - 34 + (Math.random() - 0.5) * 10;
            o.aim = Math.atan2(ty - hy, (tx - hx) * o.face);
            // a jet of water off the nozzle, mist where it lands
            const nx = hx + o.face * 13 * Math.cos(o.aim), ny = hy + 13 * Math.sin(o.aim);
            s.fx.tracer(nx, ny, tx, ty, 1.5, '#dff1fa');
            for (let i = 0; i < 3; i++) s.fx.smoke.emit(s.fx.t, tx, ty, -o.face * rand(10, 50), rand(-40, 10), rand(0.3, 0.6), 1, rand(3, 6), col('#e8f3f8', 0.4), col('#e8f3f8', 0), 60, 2, rand(0, 6), 0);
            for (let i = 0; i < 2; i++) s.fx.bits.emit(s.fx.t, tx, ty, -o.face * rand(20, 90), rand(-120, -20), rand(0.25, 0.5), 0.5, 0.3, col('#cfe6f2', 0.9), col('#cfe6f2', 0), 700, 1, 0, 0);
            if ((o.sndT = (o.sndT || 0) - 0.12) <= 0) { o.sndT = 0.5; s.sfx.play('hiss', hx, hy, { rate: 1.5, vol: 0.5, cap: 2 }); }
            if (best.spec.shield && best.shieldBox()) best.m.vx += o.face * 14;
            else { this.hurt(best, 9, o.face, 0); if (best.alive) best.m.vx += o.face * 40; }
          } else o.shotT = 0.25;
        }
      } else if (o.type === 'smoke') {
        o.grow = Math.min(1, o.grow + dt * 1.6);
        o.emitT -= dt;
        if (o.emitT <= 0 && o.t > 1) {
          o.emitT = 0.05;
          const a = Math.random() * Math.PI * 2, r = Math.random() * o.r * o.grow * 0.8;
          s.dust.emit(s.t, o.x + Math.cos(a) * r, o.y + Math.sin(a) * r * 0.7, (Math.random() - 0.5) * 8, -4 - Math.random() * 6, 2.4, 14, 30, col('#aaa69e', 0.55), col('#aaa69e', 0), -1, 0.3, Math.random() * 6, 0.2);
        }
      } else if (o.type === 'field') {
        for (const b of s.brains) if (b.ch.alive && Math.hypot(b.ch.m.x - o.x, (b.ch.m.y - o.y) * 1.6) < o.r) b.slowT = 0.2;
      } else if (o.type === 'drone') {
        o.x += ((P.m.x + 6) - o.x) * Math.min(1, dt * 4); o.y += ((P.m.y - 92 + Math.sin(this.t * 3) * 2) - o.y) * Math.min(1, dt * 4);
        for (const e of s.enemies) if (e.alive && Math.abs(e.m.x - o.x) < 300 && Math.abs(e.m.y - P.m.y) < 140) this.marks.set(e, 8);
      } else if (o.type === 'wall' && o.t <= 0) {
        for (const [tx, ty] of o.tiles) if (L.get(tx, ty) === SOLID) L.set(tx, ty, EMPTY);
      }
    }
    if (this.on.heat) for (const e of s.enemies) if (e.alive && Math.abs(e.m.x - P.m.x) < 540) this.marks.set(e, Math.max(this.marks.get(e) || 0, 0.3));
    this.objs = this.objs.filter((o) => o.t > 0);
    if (this.flashes) this.flashes = this.flashes.filter((f) => (f.t -= dt) > 0);
  }

  // a flashbang pops: blinds everyone who can see it
  pop(o) {
    const s = this.s;
    for (const b of s.brains) {
      const e = b.ch; if (!e.alive) continue;
      const ex = e.m.x, ey = e.m.y - 54, dx = o.x - ex, dy = o.y - ey, d = Math.hypot(dx, dy);
      if (d < 150 && rayTiles(s.L, ex, ey, dx / d, dy / d, d, this._n) >= d - 2) { b.blindT = Math.max(b.blindT || 0, 3 * (1 - d / 220)); b.aw = 1; b.enter?.('combat'); }
    }
    this.flashes = (this.flashes || []); this.flashes.push({ x: o.x, y: o.y, t: 0.35 });
    s.sfx.play('bang', o.x, o.y, { vol: 1 });
    s.e.camera.addShake(0.15);
  }
  // an explosion: damage falling off with distance, line of sight from the blast
  blast(x, y, r, dmg, slow) {
    const s = this.s;
    for (const b of s.brains) {
      const e = b.ch; if (!e.alive) continue;
      const dx = e.m.x - x, dy = e.m.y - 30 - y, d = Math.hypot(dx, dy);
      if (d > r || rayTiles(s.L, x, y, dx / (d || 1), dy / (d || 1), d, this._n) < d - 3) continue;
      if (slow) b.slowT = 3;
      this.hurt(e, dmg * (1 - (d / r) * 0.6), Math.sign(dx) || 1, -0.6);
    }
    this.flashes = (this.flashes || []); this.flashes.push({ x, y, t: 0.4, boom: true });
    for (let k = 0; k < 6; k++) s.fx.impact(x, y, (Math.random() - 0.5) * 2, -1, (Math.random() - 0.5) * 2, -1, 1);
    this.puff(x, y + 6, 14);
    s.sfx.play('boom', x, y, { vol: 1 }); s.e.camera.addShake(0.35);
  }
  // damage an enemy on the player's behalf
  hurt(e, dmg, dx, dy) {
    const s = this.s;
    const dead = e.damage(dmg, 'body', dx, dy, e.m.x, e.m.y - 36);
    s.fx.flesh(e.m.x, e.m.y - 36, dx, dy);
    const b = this.brainOf(e); if (b) b.alarm(s.player.m.x, s.player.m.y, 1);
    this.gainUlt(dmg / 500);
    if (dead) {
      s.stats.kills++; s.marker.t = 0; s.marker.kill = true;
      s.onDeath(e, dx, dy); s.onKill(e, s.player, 'body');
      s.sfx.play('kill', null, null, { vol: 0.8 });
    }
  }
  brainOf(e) { return this.s.brains.find((b) => b.ch === e); }
  groundAt(x, y) {
    const L = this.s.L, P = this.s.player;
    const dx = x - P.m.x, cx = P.m.x + Math.max(-260, Math.min(260, dx));
    const sy = L.surface(cx - 2, cx + 2, cx, Math.min(y, P.m.y) - 60, P.m.y + 120);
    return [cx, sy === null ? P.m.y : sy];
  }
  // the floor under x, from about y down
  floor(x, y) { const sy = this.s.L.surface(x - 3, x + 3, x, y - 12, y + 240); return sy === null ? y : sy; }
  puff(x, y, n) { this.s.puff?.(x, y, n, 1); }
  onRespawn() { this.on = {}; this.armor = 0; }
  dispose() { for (const o of this.objs) if (o.type === 'wall') for (const [tx, ty] of o.tiles) this.s.L.set(tx, ty, EMPTY); this.objs = []; }

  // --- drawing ---------------------------------------------------------------------------------
  // in the world (lit): the things themselves, drawn small and plain
  drawWorld(B, w) {
    const A = this.s.e.atlas, white = A.get('fx.white'), dot = A.get('fx.dot'), t = this.t;
    const ink = rgba('#141210');
    B.begin(w);
    for (const o of this.objs) {
      const fade = Math.min(1, o.t * 2), a = (c, k = 1) => rgba(c, k * fade);
      if (o.type === 'wall') {
        // the fire door: red-painted steel on a splayed foot, hinge pins, a hazard band at the base
        const cx = o.x + o.w / 2, top = o.y - o.h;
        B.draw(white, cx, o.y - 1, 9, 1.2, 0, a('#1c1a18'));
        B.draw(white, cx, o.y - o.h / 2, o.w / 2 + 0.8, o.h / 2, 0, a('#1c1412'));
        B.draw(white, cx, o.y - o.h / 2, o.w / 2, o.h / 2 - 0.6, 0, a('#8e2c22'));
        B.draw(white, cx - o.w / 2 + 1.4, o.y - o.h / 2, 1, o.h / 2 - 0.8, 0, a('#b4463a'));
        B.draw(white, cx + o.w / 2 - 1, o.y - o.h / 2, 0.7, o.h / 2 - 0.8, 0, a('#5e1c16'));
        for (let k = 6; k < o.h - 4; k += 12) B.draw(white, cx, top + k, o.w / 2 - 1.2, 0.35, 0, a('#6a2018'));
        for (let k = 0; k < 4; k++) B.draw(white, cx - o.w / 2 + 1 + k * 2, o.y - 3, 0.6, 2.2, 0.6, a(k % 2 ? '#1c1a18' : '#e6c25c'));
        for (const hy of [top + 6, o.y - 10]) B.draw(dot, cx - o.w / 2 + 0.6, hy, 0.8, 1.4, 0, a('#9a948a'));
        B.draw(white, cx + o.w / 2 - 2, o.y - o.h * 0.45, 0.5, 2.4, 0, a('#cfc8bc'));
      } else if (o.type === 'turret') {
        // the fire monitor: a tripod, the brass nozzle turned to its mark, the hose snaking off
        const f = o.face, hx = o.x, hy = o.y - 14, ca = Math.cos(o.aim || 0), sa = Math.sin(o.aim || 0);
        for (let k = 0; k < 6; k++) { const x0 = hx - f * (6 + k * 7), x1 = hx - f * (13 + k * 7); B.line(white, x0, o.y - 0.9 - (k % 2) * 0.6, x1, o.y - 0.9 - ((k + 1) % 2) * 0.6, 2.2, a('#7a1e18')); }
        for (const lx of [-8, 8]) { B.line(white, o.x + lx, o.y, o.x, hy + 2, 1.8, ink); B.line(white, o.x + lx, o.y, o.x, hy + 2, 1, a('#4a4846')); }
        B.line(white, o.x, o.y - 1, o.x, hy + 2, 1.6, a('#3a3836'));
        B.draw(dot, hx, hy + 1, 3.4, 3, 0, ink); B.draw(dot, hx, hy + 1, 2.8, 2.4, 0, a('#7a1e18'));
        B.line(white, hx, hy, hx + f * 13 * ca, hy + 13 * sa, 3.2, ink);
        B.line(white, hx, hy, hx + f * 13 * ca, hy + 13 * sa, 2.2, a('#b08a3e'));
        B.line(white, hx + f * 2 * ca, hy + 2 * sa - 0.5, hx + f * 12 * ca, hy + 12 * sa - 0.5, 0.6, a('#e8cc84'));
      } else if (o.type === 'mine') {
        // the cylinder on its side, brass valve and the trigger box
        B.draw(white, o.x, o.y - 2.4, 6.6, 2.6, 0, ink);
        B.draw(white, o.x, o.y - 2.4, 6, 2.1, 0, a('#8e2c22'));
        B.draw(white, o.x, o.y - 3.6, 5.6, 0.5, 0, a('#c45244'));
        B.draw(dot, o.x - 6.2, o.y - 2.4, 1.2, 2.2, 0, a('#5e1c16'));
        B.draw(white, o.x + 7, o.y - 2.4, 1.2, 0.9, 0, a('#b08a3e'));
        B.draw(white, o.x - 1, o.y - 5.2, 2, 1, 0, a('#2a2826'));
        B.line(white, o.x + 1, o.y - 5, o.x + 8, o.y - 0.5, 0.25, a('#cfc8bc', 0.6));
      } else if (o.type === 'grenade') {
        // the flare: a paper stick, its cap
        B.draw(white, o.x, o.y, 0.9, 2.6, (o.age || 0) * 14, a('#b8462e'));
        B.draw(white, o.x, o.y, 0.5, 2.3, (o.age || 0) * 14, a('#d9744a'));
      } else if (o.type === 'smoke') {
        // the canister on the ground, grey with Vanta's band
        const gy = o.y + 30;
        B.draw(white, o.x, gy - 3, 2.2, 3.2, 0, ink);
        B.draw(white, o.x, gy - 3, 1.8, 2.9, 0, a('#5e6266'));
        B.draw(white, o.x, gy - 3.4, 1.8, 0.5, 0, a('#c9ccd0'));
      } else if (o.type === 'field') {
        // the jammer: a small box with its whip aerial
        B.draw(white, o.x, o.y - 2, 3.2, 2.2, 0, ink);
        B.draw(white, o.x, o.y - 2, 2.8, 1.8, 0, a('#3a3e44'));
        B.line(white, o.x + 1.8, o.y - 3.8, o.x + 3 + Math.sin(t * 9) * 0.4, o.y - 14, 0.35, a('#1c1e22'));
      } else if (o.type === 'drone') {
        // SKYE's drone: a taped body, two arms, the rotors a blur
        const x = o.x, y = o.y, tilt = Math.sin(t * 2.2) * 0.08;
        B.line(white, x - 8, y - 0.4, x + 8, y + 0.4, 1, ink);
        B.draw(white, x, y, 4.2, 2, tilt, ink); B.draw(white, x, y, 3.7, 1.6, tilt, a('#4a4e54'));
        B.draw(white, x - 0.6, y, 1, 1.6, tilt, a('#c9c2b0'));
        for (const sx of [-8, 8]) { B.draw(white, x + sx, y - 1.2, 0.5, 1, 0, ink); B.draw(dot, x + sx, y - 2.2, 6, 0.7, 0, a('#2a2c30', 0.35 + 0.2 * Math.sin(t * 40 + sx))); }
        B.line(white, x - 2, y + 1.6, x - 3.4, y + 3.6, 0.4, ink); B.line(white, x + 2, y + 1.6, x + 3.4, y + 3.6, 0.4, ink);
      }
    }
    B.end();
  }
  // emissive, over everything: small real lights only (LEDs, the flare, the
  // flashbang), the marks, the drone's lens; no auras
  drawGlow(B, w) {
    const s = this.s, A = s.e.atlas, glow = A.get('fx.glow'), white = A.get('fx.white'), t = this.t;
    B.begin(w); B.setBlend(1);
    for (const o of this.objs) {
      const fade = Math.min(1, o.t * 2);
      if (o.type === 'mine') {
        const blink = o.arm > 0 ? 0.3 : (t * 3) % 1 < 0.2 ? 1 : 0.35;
        B.draw(glow, o.x - 1, o.y - 5.6, 1.6, 1.6, 0, rgba('#ff3a2a', blink));
      } else if (o.type === 'grenade') {
        // the fuse burning white at the tip
        B.draw(glow, o.x, o.y, 3.4, 3.4, 0, rgba('#fff4dc', 0.9));
        B.draw(glow, o.x, o.y, 9, 9, 0, rgba('#ff8a3a', 0.25));
      } else if (o.type === 'field') {
        // the jammer's little amber lamp, and the air over it trembling: faint pale arcs going out
        B.draw(glow, o.x, o.y - 3, 0.7, 0.7, 0, rgba('#ffb45c', (t * 5) % 1 < 0.5 ? 0.7 : 0.25));
        for (let r = (t * 40) % 24; r < o.r; r += 24) {
          const k = (1 - r / o.r) * 0.16 * fade;
          for (let j = 0; j < 10; j++) { const a0 = -Math.PI * (0.15 + j * 0.07), a1 = a0 - 0.05; B.line(white, o.x + Math.cos(a0) * r, o.y - 3 + Math.sin(a0) * r * 0.5, o.x + Math.cos(a1) * r, o.y - 3 + Math.sin(a1) * r * 0.5, 0.3, rgba('#dcd8cc', k)); B.line(white, o.x - Math.cos(a0) * r, o.y - 3 + Math.sin(a0) * r * 0.5, o.x - Math.cos(a1) * r, o.y - 3 + Math.sin(a1) * r * 0.5, 0.3, rgba('#dcd8cc', k)); }
        }
      } else if (o.type === 'drone') {
        // the phone's little status light under the nose, nothing more
        B.draw(glow, o.x - 3.6, o.y - 0.4, 0.6, 0.6, 0, rgba('#ff6a4a', (t * 4) % 1 < 0.3 ? 0.6 : 0.15));
      }
    }
    for (const f of this.flashes || []) { const k = f.t / 0.4; B.draw(glow, f.x, f.y, f.boom ? 70 : 120, f.boom ? 50 : 90, 0, rgba(f.boom ? '#ffb070' : '#fffaf0', 0.9 * k)); }
    // marked enemies: a chevron over the head, seen through walls
    for (const [e] of this.marks) {
      const x = e.rx ?? e.m.x, y = (e.ry ?? e.m.y) - 76, pulse = 0.75 + 0.25 * Math.sin(t * 8);
      B.line(white, x - 4, y - 3, x, y + 1.5, 0.9, rgba('#ff3347', pulse)); B.line(white, x + 4, y - 3, x, y + 1.5, 0.9, rgba('#ff3347', pulse));
      B.draw(glow, x, y, 6, 6, 0, rgba('#ff3347', 0.3 * pulse));
      if (this.on.heat || this.on.watch) B.draw(glow, x, y + 40, 12, 26, 0, rgba('#ff5a3a', 0.14));
    }
    // the blackout: the street's lamps dip as the grid is pulled, a grey shudder across the view
    if (this.flashT > 0) {
      const k = this.flashT * 2, c = s.cam;
      for (let i = 0; i < 4; i++) { const y = c.y - 120 + ((i * 61 + t * 700) % 240); B.line(white, c.x - 400, y, c.x + 400, y, 0.4, rgba('#c8c6c0', 0.08 * k)); }
    }
    B.setBlend(0); B.end();
  }
  lights(R) {
    for (const o of this.objs) {
      if (o.type === 'field') R.addLight(o.x, o.y - 4, 8, 0.2, [1, 0.7, 0.36]);
      else if (o.type === 'grenade') R.addLight(o.x, o.y, 36, 0.9, [1, 0.7, 0.45]);
    }
    for (const f of this.flashes || []) R.addLight(f.x, f.y, f.boom ? 140 : 200, 2.4 * (f.t / 0.4), f.boom ? [1, 0.6, 0.3] : [1, 1, 0.95]);
    if (this.on.overload) { const P = this.s.player; R.addLight(P.m.x, P.m.y - 40, 40, 0.35, [1, 0.5, 0.25]); }
  }
  // HUD state for each slot: { p: 0..1 ready share, ready, active }
  hud() {
    return this.list.map((A, i) => i < 2
      ? { k: A.k, p: 1 - this.cd[i] / A.cd, ready: this.cd[i] <= 0, left: Math.ceil(this.cd[i]) }
      : { k: A.k, p: this.ult, ready: this.ult >= 1, active: !!this.on[A.k] });
  }
}
