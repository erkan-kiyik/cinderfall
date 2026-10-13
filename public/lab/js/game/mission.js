// CINDERFALL LAB — M4: the first campaign mission, end to end.
//
// Built on the M3 combat scene (guns, ballistics, effects, HUD): enemies are
// now run by Brains (perception, cover, squad fire tokens), the level comes
// from the mission description, and a small script drives objectives,
// checkpoints, the gate terminal, the last wave and the debrief.
import * as M3 from '../test/m3scene.js';
import * as M2 from '../test/m2scene.js';
import { DENS } from '../test/m1scene.js';
import { buildMission1, gateLeaf } from '../art/env/mission1.js';
import { itemBakeList, charBakeList } from './bakechars.js';
import { Character } from './character.js';
import { Mover } from '../phys/mover.js';
import { EMPTY } from '../phys/level.js';
import { Brain, Squad, DIFF } from './ai/brain.js';
import { findCovers } from './ai/cover.js';
import { MissionHud, fmt } from '../ui/missionhud.js';
import { t } from '../ui/i18n.js';
import { rgba } from '../gfx/batch.js';
import { col } from '../gfx/particles.js';

export const BAKE_VERSION = 'c2-1';
const MISSION = buildMission1();

export function bakeList(quality) {
  const [, ch, fx] = DENS[quality];
  const g = MISSION.gate;
  return [
    ...M2.bakeList(quality, MISSION),
    ...charBakeList(['huc'], ch),
    ...itemBakeList(ch, fx),
    { name: 'm.gateLeaf', box: [-1, -g.h - 1, g.w + 1, 1], scale: ch, outline: 0.85, paint: (gg) => gateLeaf(gg, g.w, g.h) },
  ];
}

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const PAR = 300; // par time (s) for the time star

export class MissionScene extends M3.M3Scene {
  // opts: diff, op + loadout (from preparation), brief (show the briefing
  // card), onExit(result) (back to the menus; without it the card reloads)
  constructor(eng, controls, { diff = 'normal', op = null, loadout = null, brief = true, onExit = null } = {}) {
    super(eng, controls, MISSION);
    this.onExit = onExit; this.diff = diff;
    if (op) {
      this.opId = op; this.loadout = loadout;
      this.opIndex = Math.max(0, M2.OPERATORS.indexOf(op));
      this.player = new Character(op, eng.atlas, this.mover, loadout ? { weapon: loadout.primary, sidearm: loadout.sidearm } : {});
    }
    this.M = MISSION; this.D = DIFF[diff] || DIFF.normal;
    this.enemyDmg = this.D.dmg;
    this.squad = new Squad(this.D.tokens);
    this.covers = findCovers(this.L);
    this.enemies = []; this.brains = []; this.spawns = []; this.ai = [];
    for (const d of MISSION.enemies) if (!d.wave) this.spawnEnemy(d);
    const self = this;
    this.world = {
      level: this.L, squad: this.squad, covers: this.covers, t: 0,
      get player() { return self.player; },
      alert: (b, x, y) => { for (const o of self.brains) if (o !== b && Math.abs(o.ch.m.x - b.ch.m.x) < 340) o.alarm(x, y, 0.7); },
      // inside the camera view (with a small margin)
      onScreen: (x, y) => { const c = self.e.camera, hw = c.viewW / 2 - 6, hh = c.viewH / 2; return Math.abs(x - self.cam.x) < hw && Math.abs(y - self.cam.y) < hh + 20; },
    };
    this.mhud = new MissionHud(document.querySelector('#hud'));
    this.obj = 0; this.hack = 0; this.gateK = 0; this.gateOpen = false; this.waveIn = false;
    this.cp = -1; this.deaths = 0; this.clockT = 0; this.done = false; this.started = false;
    this.pickups = [];
    this.hud.update(0, this.player);
    if (brief) this.briefing(); else this.begin(diff);
    // the app going to the background pauses the mission
    this._vis = () => { if (document.hidden) this.pause(); };
    document.addEventListener('visibilitychange', this._vis);
  }

  pause() {
    if (!this.started || this.done || this.paused) return;
    this.paused = true;
    this.mhud.show(`<div class="kick">${t('camp.mission', { n: 1 })} · ${t('mission.m1')}</div><h1>${t('game.paused')}</h1>
      <p>${t('game.status', { o: this.objective ? this.objText(this.obj) : '—', t: fmt(this.clockT) })}</p>`,
    [{ label: t('game.resume'), fn: () => { this.mhud.hide(); this.paused = false; this.sfx.unlock(); } },
      ...(this.onExit
        ? [{ label: t('game.restart'), ghost: true, fn: () => this.onExit({ ...this.result(false), retry: true }) },
          { label: t('game.quit'), ghost: true, fn: () => this.onExit({ ...this.result(false), abandoned: true }) }]
        : [{ label: t('game.restart'), ghost: true, fn: () => location.reload() }])]);
  }

  spawnEnemy(d) {
    const m = new Mover(this.L, d.x, d.y); m.facing = d.facing || -1;
    const ch = new Character(d.id, this.e.atlas, m);
    const b = new Brain(ch, { kind: d.kind || d.id, zone: d.zone, patrol: d.patrol, diff: this.D });
    this.enemies.push(ch); this.brains.push(b);
    return b;
  }

  // --- flow -------------------------------------------------------------------------------
  briefing() {
    this.paused = true;
    this.mhud.show(`
      <div class="kick">${t('camp.title')} · ${t('camp.mission', { n: 1 })}</div>
      <h1>${t('mission.m1')}</h1>
      <p>${t('mission.m1.brief')}</p>
      <ol>${MISSION.objectives.map((o, i) => `<li>${this.objText(i)}</li>`).join('')}</ol>`,
    [{ label: t('game.start'), fn: () => this.begin('normal') }, { label: t('diff.hard'), ghost: true, fn: () => this.begin('hard') }]);
  }

  begin(diff) {
    this.D = DIFF[diff]; this.diff = diff;
    this.enemyDmg = this.D.dmg; this.squad.max = this.D.tokens;
    for (const b of this.brains) { b.D = this.D; b.err = this.D.errMax; }
    this.mhud.hide(); this.paused = false; this.started = true; this.sfx.unlock();
  }

  debrief() {
    this.done = true; this.paused = true;
    if (this.onExit) {
      // the menus show the result; a beat to let the moment land first
      this.mhud.toast(t('res.done'), 1.6);
      this.sfx.ui('levelup', 0.8);
      setTimeout(() => this.onExit(this.result(true)), 1700);
      return;
    }
    const s = this.stats, acc = s.shots ? Math.round((s.hits / s.shots) * 100) : 0;
    const stars = [true, this.clockT <= PAR, this.deaths === 0];
    this.mhud.show(`
      <div class="kick">${t('res.done')} · ${t(`diff.${this.diff === 'hard' ? 'hard' : 'normal'}`)}</div>
      <h1>${t('mission.m1')}</h1>
      <div class="stars">${stars.map((on) => `<i class="${on ? 'on' : ''}">★</i>`).join('')}</div>
      <div class="why">${t('res.why')}</div>
      <div class="stats">
        <div><b>${fmt(this.clockT)}</b><span>${t('res.time')}</span></div>
        <div><b>${s.kills}</b><span>${t('prof.kills')}</span></div>
        <div><b>%${acc}</b><span>${t('prof.acc')}</span></div>
        <div><b>${s.heads}</b><span>${t('prof.heads')}</span></div>
      </div>`,
    [{ label: t('game.again'), fn: () => location.reload() }]);
  }

  // what the menus record: { id, done, stars, time, kills, ... }
  result(done) {
    const s = this.stats;
    return {
      id: 'm1', done, diff: this.diff || 'normal', op: this.opId || M2.OPERATORS[this.opIndex],
      stars: done ? [true, this.clockT <= PAR, this.deaths === 0] : [false, false, false],
      time: this.clockT, kills: s.kills, heads: s.heads, shots: s.shots, hits: s.hits, deaths: this.deaths,
      byWeapon: s.byWeapon,
    };
  }

  // remove everything this scene put in the page
  dispose() {
    document.removeEventListener('visibilitychange', this._vis);
    const H = this.hud, MH = this.mhud;
    for (const n of [H.el, H.hurtEl, H.dirL, H.dirR, H.deadEl, MH.obj, MH.time, MH.arrow, MH.toastEl, MH.card]) n && n.remove();
  }

  get objective() { return MISSION.objectives[this.obj] || null; }
  objText(i) { return t(`mission.m1.o${i + 1}`); }

  advance() {
    this.obj++;
    this.sfx.play('kill', null, null, { vol: 0.5, rate: 0.8 });
    if (!this.objective) { this.debrief(); return; }
    this.mhud.toast(t('game.objUpdated'), 1.4);
  }

  // --- simulation -----------------------------------------------------------------------------
  update(dt) {
    if (this.paused) { this.mhud.update(dt); return; }
    super.update(dt);
  }

  updateEnemies(dt) {
    const w = this.world; w.t = this.t;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i], b = this.brains[i];
      const inp = b.think(dt, w);
      e.preStep();
      if (e.alive) e.m.step(dt, inp);
      e.postStep(dt, this.L);
      if (e.alive) this.handle(e, dt);
      if (b.bashReq) { b.bashReq = false; this.bash(e); }
    }
  }

  // the riot shield shoves the player back
  bash(e) {
    const P = this.player, f = e.facing;
    // the trooper lunges behind the shield either way
    e.m.vx = f * 230; e.anim.flinch(-1.3);
    if (!P.alive) return;
    const dx = (P.m.x - e.m.x) * f;
    if (dx < -4 || dx > 46 || Math.abs(P.m.y - e.m.y) > 30) return;
    const dmg = 22 * (this.D.dmg / DIFF.normal.dmg);
    P.damage(dmg, 'body', f, -0.3, P.m.x, P.m.y - 36);
    P.m.vx = f * 320; P.m.vy = -170; P.m.state = 'air'; P.m.grounded = false;
    this.hud.hit(dmg, -Math.sign(P.m.x - e.m.x));
    this.e.camera.addShake(0.3);
    this.sfx.play('shield', e.m.x, e.m.y - 30, { rate: 0.8 });
    this.fx.shield(e.m.x + f * 14, e.m.y - 34, f, -0.3);
    if (!P.alive) { this.onDeath(P, f, -0.3); this.onPlayerDown(); }
  }

  // a player shot: noise for everyone around, suppression for near misses
  onFire(ch) {
    if (ch !== this.player) return;
    const x = ch.m.x, y = ch.m.y;
    for (const b of this.brains) if (b.ch.alive && Math.abs(b.ch.m.x - x) < 520 && Math.abs(b.ch.m.y - y) < 200) b.alarm(x, y, 0.45);
  }
  onShot(ch, sx, sy, dx, dy, t, hit) {
    if (ch !== this.player) return;
    for (const b of this.brains) {
      const e = b.ch;
      if (!e.alive) continue;
      if (e === hit) { b.alarm(ch.m.x, ch.m.y, 1); b.suppress(0.5); continue; }
      // closest approach of the bullet to the chest
      const cx = e.m.x - sx, cy = e.m.y - 36 - sy, along = clamp(cx * dx + cy * dy, 0, t);
      const px = sx + dx * along - e.m.x, py = sy + dy * along - (e.m.y - 36);
      if (px * px + py * py < 30 * 30) { b.suppress(0.35); b.alarm(ch.m.x, ch.m.y, 0.6); }
    }
  }
  onKill(dead, by) {
    // the squad nearby hears it; sometimes an ammo box drops
    for (const b of this.brains) if (b.ch !== dead && b.ch.alive && Math.abs(b.ch.m.x - dead.m.x) < 300) b.alarm(by.m.x, by.m.y, 0.8);
    if (dead.team === 1 && Math.random() < 0.7) this.pickups.push({ x: dead.m.x, y: dead.m.y - 30, vy: -120, t: 0 });
    if (dead === this.player) this.onPlayerDown();
  }
  onPlayerDown() { this.deaths++; this.deadT = 0; }

  afterPlayerStep(dt) {
    const P = this.player;
    this.handle(P, dt);
    if (!P.alive) {
      this.deadT += dt;
      if (this.deadT > 2.6) this.respawnPlayer();
    }
  }

  respawnPlayer() {
    const cp = MISSION.checkpoints[this.cp];
    const x = cp ? cp.x : MISSION.spawn[0];
    this.mover = new Mover(this.L, x, -2);
    const lo = this.loadout;
    this.player = new Character(this.opId || M2.OPERATORS[this.opIndex], this.e.atlas, this.mover, lo ? { weapon: lo.primary, sidearm: lo.sidearm } : {});
    this.player.hpMax = this.player.hp = 100;
    this.deadT = 0;
    // the squads calm down a little (no spawn-camping)
    for (const b of this.brains) if (b.ch.alive) { b.state = 'guard'; b.aw = 0.4; b.seenT = 0; b.burst = 0; this.squad.release(b); }
    this.mhud.toast(t('game.checkpoint'), 1.2);
  }

  afterUpdate(dt) {
    super.afterUpdate(dt);
    const P = this.player, m = this.mover;
    if (!this.done && this.started) this.clockT += dt;
    this.mhud.update(dt);
    // health comes back after a few quiet seconds
    if (P.alive && P.t - P.lastHit > 4 && P.hp < P.hpMax) P.hp = Math.min(P.hpMax, P.hp + 14 * dt);
    // checkpoints
    for (let i = this.cp + 1; i < MISSION.checkpoints.length; i++) {
      if (P.alive && m.x >= MISSION.checkpoints[i].x) { this.cp = i; this.mhud.toast(t('game.checkpoint'), 1.4); this.sfx.play('marker', null, null, { vol: 0.6, rate: 0.7 }); }
    }
    // objectives
    const o = this.objective;
    if (o && P.alive) {
      if (o.type === 'reach' && m.x >= o.x) this.advance();
      else if (o.type === 'hack') {
        const T = MISSION.terminal, near = m.x > T.x0 && m.x < T.x1 && m.grounded;
        if (near) {
          const before = this.hack;
          this.hack = Math.min(T.time, this.hack + dt);
          if (Math.floor(before) !== Math.floor(this.hack)) this.sfx.play('marker', T.x, -20, { rate: 1.3 });
          // hacking is loud: the court comes for you
          if (before === 0) for (const b of this.brains) if (b.ch.alive && Math.abs(b.ch.m.x - T.x) < 360) b.alarm(m.x, m.y, 1);
          if (this.hack >= T.time) { this.openGate(); this.advance(); }
        }
      }
    }
    // the gate rises, the last squad comes through
    if (this.gateOpen && this.gateK < 1) {
      this.gateK = Math.min(1, this.gateK + dt / 2.4);
      if (this.gateK > 0.75 && !this.gateClear) {
        this.gateClear = true;
        const G = MISSION.gate;
        for (let c = G.c0; c <= G.c1; c++) for (let n = G.n0; n <= G.n1; n++) this.L.set(c, 25 - n, EMPTY);
      }
      if (this.gateK > 0.5 && !this.waveIn) {
        this.waveIn = true;
        for (const d of MISSION.enemies) if (d.wave) { const b = this.spawnEnemy(d); b.alarm(m.x, m.y, 1); }
      }
    }
    // ammo boxes: fall, then wait to be picked up
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.t += dt;
      const s = this.L.surface(p.x - 2, p.x + 2, p.x, p.y - 4, p.y + p.vy * dt + 2);
      if (s !== null && p.vy >= 0) { p.y = s; p.vy = 0; } else { p.vy = Math.min(600, p.vy + 1500 * dt); p.y += p.vy * dt; }
      if (P.alive && Math.abs(P.m.x - p.x) < 16 && Math.abs(P.m.y - p.y) < 30) {
        for (const g of P.guns) g.reserve = Math.min(g.s.reserve * 2, g.reserve + g.s.mag);
        this.sfx.play('magIn', p.x, p.y, { rate: 1.2 });
        this.mhud.toast('+ CEPHANE', 0.9);
        this.pickups.splice(i, 1);
      } else if (p.t > 40) this.pickups.splice(i, 1);
    }
    // objective HUD
    const ob = this.objective;
    if (ob) this.mhud.objective(this.obj + 1, MISSION.objectives.length, this.objText(this.obj), ob.type === 'hack' ? this.hack / MISSION.terminal.time : null);
    this.mhud.clock(this.clockT);
    this.pointTo();
  }

  openGate() {
    this.gateOpen = true;
    this.sfx.play('gunDrop', MISSION.gate.x, -40, { rate: 0.5, vol: 1 });
    this.mhud.toast(t('game.gate'), 1.8);
    this.e.camera.addShake(0.25);
  }

  // where the current objective is in the world
  objectivePoint() {
    const o = this.objective;
    if (!o) return null;
    if (o.type === 'hack') return [MISSION.terminal.x, -34];
    if (o === MISSION.objectives[MISSION.objectives.length - 1]) return [MISSION.extract.x, -34];
    return [o.x, -30];
  }

  pointTo() {
    const p = this.objectivePoint(), cam = this.e.camera, cv = this.e.renderer.canvas;
    if (!p || this.paused) { this.mhud.pointer(null); return; }
    const w = cv.clientWidth, h = cv.clientHeight;
    const sx = ((p[0] - this.cam.x) / cam.viewW + 0.5) * w, sy = ((p[1] - this.cam.y) / cam.viewH + 0.5) * h;
    this.mhud.pointer(sx, sy, w, h, Math.round(Math.abs(p[0] - this.mover.x) / 32));
  }

  // --- drawing --------------------------------------------------------------------------------
  drawWorldExtras(B, w, x0, x1) {
    super.drawWorldExtras(B, w, x0, x1);
    const A = this.e.atlas, G = MISSION.gate;
    B.begin(w);
    // the gate leaf slides up into the beam
    B.draw(A.get('m.gateLeaf'), G.x, -this.gateK * (G.h - 6), 1, 1, 0);
    const box = A.get('i.pickup.ammo');
    for (const p of this.pickups) B.draw(box, p.x, p.y + Math.sin(p.t * 3) * 0.4 - 0.4, 1, 1, 0);
    B.end();
  }

  addLights(R) {
    super.addLights(R);
    const T = MISSION.terminal, t = this.t;
    const tc = this.gateOpen ? [0.3, 1, 0.6] : this.hack > 0 ? [1, 0.75, 0.3] : [1, 0.25, 0.25];
    R.addLight(T.x, -19, 26, 0.9, tc);
    MISSION.checkpoints.forEach((c, i) => R.addLight(c.x, -20, 16, 0.6, i <= this.cp ? [0.3, 1, 0.8] : [1, 0.3, 0.25]));
    if (this.objective === MISSION.objectives[MISSION.objectives.length - 1]) {
      const f = 0.8 + Math.sin(t * 17) * 0.1 + Math.sin(t * 6.1) * 0.1;
      R.addLight(MISSION.extract.x, -28, 90, 1.5 * f, [1, 0.35, 0.25]);
      if (Math.random() < 0.3) this.fx.smoke.emit(this.fx.t, MISSION.extract.x + rand(-1, 1), -27, rand(-6, 6), rand(-30, -18), rand(1.2, 2), 2, 9, col('#d06a5a', 0.3), col('#d06a5a', 0), -10, 0.6, rand(0, 6), rand(-1, 1));
    }
  }

  drawGlow(B, w) {
    const A = this.e.atlas, glow = A.get('fx.glow'), white = A.get('fx.white'), t = this.t, T = MISSION.terminal;
    B.begin(w); B.setBlend(1);
    // terminal screen
    const sc = this.gateOpen ? '#4dffa0' : this.hack > 0 ? '#ffc060' : '#ff4a5a';
    B.draw(white, T.x, -19, 5, 4, 0, rgba(sc, 0.55 + Math.sin(t * 9) * 0.1));
    B.draw(glow, T.x, -19, 12, 9, 0, rgba(sc, 0.35));
    // hack ring around the terminal
    if (this.objective && this.objective.type === 'hack') {
      const k = this.hack / T.time, n = 36, r = 16;
      for (let i = 0; i < n; i++) {
        const a0 = -Math.PI / 2 + (i / n) * Math.PI * 2, a1 = a0 + (Math.PI * 2) / n * 0.7;
        const on = i / n < k;
        B.line(white, T.x + Math.cos(a0) * r, -36 + Math.sin(a0) * r, T.x + Math.cos(a1) * r, -36 + Math.sin(a1) * r, 0.9, rgba(on ? '#3ee8e0' : '#ffffff', on ? 0.9 : 0.18));
      }
    }
    // checkpoint lamps
    MISSION.checkpoints.forEach((c, i) => B.draw(glow, c.x, -20, 5, 5, 0, rgba(i <= this.cp ? '#4dffc8' : '#ff4a4a', 0.75)));
    // extraction flare
    if (this.objective === MISSION.objectives[MISSION.objectives.length - 1]) {
      const f = 0.8 + Math.sin(t * 17) * 0.1;
      B.draw(glow, MISSION.extract.x, -28, 20 * f, 20 * f, 0, rgba('#ff5a40', 0.6));
      B.draw(white, MISSION.extract.x, -28, 1.2, 1.2, 0, rgba('#fff2dc', 1));
    }
    // objective marker: a diamond bobbing over the target
    const p = this.objectivePoint();
    if (p && !this.paused) {
      const y = p[1] - 46 + Math.sin(t * 3) * 2, s = 3.2;
      const c = rgba('#3ee8e0', 0.9);
      B.line(white, p[0], y - s, p[0] + s, y, 0.7, c); B.line(white, p[0] + s, y, p[0], y + s, 0.7, c);
      B.line(white, p[0], y + s, p[0] - s, y, 0.7, c); B.line(white, p[0] - s, y, p[0], y - s, 0.7, c);
    }
    B.end();
    super.drawGlow(B, w);
  }
}
