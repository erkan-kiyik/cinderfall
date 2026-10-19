// KOR LAB — campaign missions, end to end.
//
// Built on the M3 combat scene (guns, ballistics, effects, HUD): enemies are
// run by Brains (perception, cover, squad fire tokens), the level comes from
// the mission description, and a small script drives the objectives:
//   reach   get past a point
//   hack    stand at the terminal; the gate opens and its squad comes through
//   hold    stay in a zone for a time while squads come at it in waves
//   boss    bring the boss down; it calls squads in as its health drops
// plus checkpoints, ammo drops, the operator abilities and the debrief.
import * as M3 from '../test/m3scene.js';
import * as M2 from '../test/m2scene.js';
import { DENS } from '../test/m1scene.js';
import { hideoutBakeList } from '../art/env/hideout.js';
import { weathered } from '../art/kit.js';
import { buildMission1, gateLeaf } from '../art/env/mission1.js';
import { buildMission2 } from '../art/env/mission2.js';
import { concrete } from '../art/env/mission1.js';
import { buildMission3 } from '../art/env/mission3.js';
import { itemBakeList, charBakeList } from './bakechars.js';
import { Character } from './character.js';
import { Mover } from '../phys/mover.js';
import { EMPTY, SOLID, T as TILE } from '../phys/level.js';
import { Brain, Squad, DIFF } from './ai/brain.js';
import { findCovers } from './ai/cover.js';
import { rayTiles } from './ballistics.js';
import { MissionHud, fmt } from '../ui/missionhud.js';
import { t } from '../ui/i18n.js';
import { rgba } from '../gfx/batch.js';
import { col } from '../gfx/particles.js';
import { Abilities } from './abilities.js';
import { AbilityHud } from '../ui/abilityhud.js';
import { haptic } from '../ui/kit.js';

export const BAKE_VERSION = 'd4-20';
// Endless: the market from mission 2, walled off at both ends; squads come in
// waves, every fifth one with Gall.
function buildEndless() {
  const M = buildMission2(), X = (c) => c * TILE;
  for (const [c0, name] of [[106, 'me.wallL'], [242, 'me.wallR']]) {
    for (let c = c0; c <= c0 + 1; c++) for (let n = 1; n <= 12; n++) M.level.set(c, 25 - n, SOLID);
    M.front.push({ name, box: [X(c0) - 2, -98, X(c0 + 2) + 2, 1], paint: (g) => concrete(g, X(c0), X(c0 + 2), 96) });
  }
  return Object.assign(M, { id: 'endless', objectives: [{ type: 'endless' }], enemies: [], checkpoints: [], spawn: [X(170), 0], arena: [X(110), X(240)], extract: null, par: 0 });
}
const BUILD = { m1: buildMission1, m2: buildMission2, m3: buildMission3, endless: buildEndless };
export const MISSION_IDS = Object.keys(BUILD);

export function bakeList(quality) {
  const [, ch, fx] = DENS[quality];
  // the street, the operators and mission 1's pieces, then what the other missions add
  const E = M2.bakeList(quality, buildMission1());
  const names = new Set(E.map((e) => e.name));
  for (const id of MISSION_IDS.slice(1)) {
    const M = BUILD[id]();
    for (const p of [...M.props, ...M.front, ...M.deco]) {
      if (names.has(p.name)) continue;
      names.add(p.name);
      E.push({ name: p.name, box: p.box, scale: ch, paint: weathered(p), outline: 0.85 });
    }
    for (const p of M.floor || []) {
      if (names.has(p.name)) continue;
      names.add(p.name);
      E.push({ name: p.name, box: p.box, scale: DENS[quality][0], paint: p.paint });
    }
  }
  return [
    ...E,
    // the lobby's basement (docs §10.9)
    ...hideoutBakeList(DENS[quality][0]),
    ...charBakeList(['huc', 'gall'], ch),
    ...itemBakeList(ch, fx),
    // both gates are the same size
    { name: 'm.gateLeaf', box: [-1, -97, 17, 1], scale: ch, outline: 0.85, paint: (gg) => gateLeaf(gg, 16, 96) },
  ];
}

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class MissionScene extends M3.M3Scene {
  // opts: id (m1, m2, m3), diff, op + loadout (from preparation), brief (show
  // the briefing card), onExit(result) (back to the menus; without it the card reloads)
  constructor(eng, controls, { id = 'm1', diff = 'normal', op = null, loadout = null, brief = true, onExit = null } = {}) {
    // each run gets a fresh level (gates and walls change its tiles)
    const M = (BUILD[id] || BUILD.m1)();
    super(eng, controls, M);
    this.id = BUILD[id] ? id : 'm1';
    this.onExit = onExit; this.diff = diff;
    if (op) {
      this.opId = op; this.loadout = loadout;
      this.opIndex = Math.max(0, M2.OPERATORS.indexOf(op));
      this.player = new Character(op, eng.atlas, this.mover, loadout ? { weapon: loadout.primary, sidearm: loadout.sidearm } : {});
    }
    this.M = M; this.D = DIFF[diff] || DIFF.normal;
    this.enemyDmg = this.D.dmg;
    this.squad = new Squad(this.D.tokens);
    this.covers = findCovers(this.L);
    this.enemies = []; this.brains = []; this.spawns = []; this.ai = [];
    for (const d of M.enemies) if (!d.wave) this.spawnEnemy(d);
    const self = this;
    this.world = {
      level: this.L, squad: this.squad, covers: this.covers, t: 0,
      get player() { return self.player; },
      alert: (b, x, y) => { for (const o of self.brains) if (o !== b && Math.abs(o.ch.m.x - b.ch.m.x) < 340) o.alarm(x, y, 0.7); },
      // smoke from an ability cuts sight lines
      smoke: (x0, y0, x1, y1) => self.ab.smokeBlocks(x0, y0, x1, y1),
      // inside the camera view (with a small margin)
      onScreen: (x, y) => { const c = self.e.camera, hw = c.viewW / 2 - 6, hh = c.viewH / 2; return Math.abs(x - self.cam.x) < hw && Math.abs(y - self.cam.y) < hh + 20; },
    };
    this.mhud = new MissionHud(document.querySelector('#hud'));
    this.obj = 0; this.hack = 0; this.gateK = 0; this.gateOpen = false; this.waveIn = false;
    this.holdT = 0; this.waveIdx = 0; this.phase = 0; this.nades = []; this.nadeT = 4;
    this.endless = this.id === 'endless'; this.wave = 0; this.cleared = 0; this.breakT = 2.5;
    this.cp = -1; this.deaths = 0; this.clockT = 0; this.done = false; this.started = false;
    this.pickups = [];
    this.ab = new Abilities(this, this.opId || M2.OPERATORS[this.opIndex]);
    this.abHud = new AbilityHud(document.querySelector('#hud'), this.ab, this.ctl);
    this.hud.update(0, this.player);
    if (brief) this.briefing(); else this.begin(diff);
    // the app going to the background pauses the mission
    this._vis = () => { if (document.hidden) this.pause(); };
    document.addEventListener('visibilitychange', this._vis);
  }

  get title() { return this.endless ? t('mode.endless') : `${t('camp.mission', { n: this.id.slice(1) })} · ${t(`mission.${this.id}`)}`; }
  get par() { return this.M.par || 300; }

  pause() {
    if (!this.started || this.done || this.paused) return;
    this.paused = true;
    this.mhud.show(`<div class="kick">${this.title}</div><h1>${t('game.paused')}</h1>
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
    if (d.boss) { b.boss = true; this.boss = b; }
    this.enemies.push(ch); this.brains.push(b);
    return b;
  }
  // a squad arrives, already looking for the player
  spawnWave(w) {
    const m = this.mover;
    for (const d of this.M.enemies) if (d.wave === w) { const b = this.spawnEnemy(d); b.alarm(m.x, m.y, 1); }
  }

  // --- flow -------------------------------------------------------------------------------
  briefing() {
    this.paused = true;
    this.mhud.show(`
      <div class="kick">${t('camp.title')} · ${t('camp.mission', { n: this.id.slice(1) })}</div>
      <h1>${t(`mission.${this.id}`)}</h1>
      <p>${t(`mission.${this.id}.brief`)}</p>
      <ol>${this.M.objectives.map((o, i) => `<li>${this.objText(i)}</li>`).join('')}</ol>`,
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
    const stars = [true, this.clockT <= this.par, this.deaths === 0];
    this.mhud.show(`
      <div class="kick">${t('res.done')} · ${t(`diff.${this.diff === 'hard' ? 'hard' : 'normal'}`)}</div>
      <h1>${t(`mission.${this.id}`)}</h1>
      <div class="stars">${stars.map((on) => `<i class="${on ? 'on' : ''}">★</i>`).join('')}</div>
      <div class="why">${t('res.why', { t: fmt(this.par) })}</div>
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
    if (this.endless) {
      return { id: 'endless', endless: true, wave: this.cleared, done: false, diff: this.diff || 'normal', op: this.opId || M2.OPERATORS[this.opIndex], stars: [false, false, false],
        time: this.clockT, kills: s.kills, heads: s.heads, shots: s.shots, hits: s.hits, deaths: this.deaths, byWeapon: s.byWeapon };
    }
    return {
      id: this.id, done, diff: this.diff || 'normal', op: this.opId || M2.OPERATORS[this.opIndex],
      stars: done ? [true, this.clockT <= this.par, this.deaths === 0] : [false, false, false],
      time: this.clockT, kills: s.kills, heads: s.heads, shots: s.shots, hits: s.hits, deaths: this.deaths,
      byWeapon: s.byWeapon, par: this.par,
    };
  }

  // remove everything this scene put in the page
  dispose() {
    document.removeEventListener('visibilitychange', this._vis);
    const H = this.hud, MH = this.mhud;
    for (const n of [H.el, H.hurtEl, H.dirL, H.dirR, H.deadEl, MH.obj, MH.time, MH.arrow, MH.toastEl, MH.card, MH.bossEl]) n && n.remove();
    this.abHud.remove(); this.ab.dispose();
  }

  get objective() { return this.M.objectives[this.obj] || null; }
  objText(i) { return this.endless ? t('game.wave', { n: this.wave }) : t(`mission.${this.id}.o${i + 1}`); }

  advance() {
    this.obj++;
    this.sfx.play('kill', null, null, { vol: 0.5, rate: 0.8 });
    if (!this.objective) { this.debrief(); return; }
    this.holdT = 0; this.waveIdx = 0; this.phase = 0;
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
    const dmg = this.takenK(22 * (this.D.dmg / DIFF.normal.dmg));
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
    const x = ch.m.x, y = ch.m.y, far = ch.gun && ch.gun.s.suppressed ? 200 : 520;
    for (const b of this.brains) if (b.ch.alive && Math.abs(b.ch.m.x - x) < far && Math.abs(b.ch.m.y - y) < 200) b.alarm(x, y, 0.45);
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
    if (this.boss && dead === this.boss.ch) { this.e.camera.addShake(0.5); this.sfx.play('boom', dead.m.x, dead.m.y - 30, { vol: 1, rate: 0.8 }); this.mhud.toast(t('game.bossDown'), 2); }
    if (dead === this.player) this.onPlayerDown();
  }
  onPlayerDown() { this.deaths++; this.deadT = 0; }

  // --- abilities ------------------------------------------------------------------------------
  beforePlayerStep(dt, inp) {
    super.beforePlayerStep(dt, inp);
    if (this.started && !this.done) this.ab.input(this.ctl);
  }
  dealtK(who, zone) { return this.ab.dmgK(who, zone); }
  takenK(dmg) { return this.ab.taken(dmg); }
  fireK() { return this.ab.fireK; }
  onHit(by, who, dmg, dead) {
    if (by === this.player && who.team === 1) this.ab.gainUlt(dmg / 420 + (dead ? 0.1 : 0));
  }

  afterPlayerStep(dt) {
    const P = this.player;
    this.handle(P, dt);
    if (!P.alive) {
      this.deadT += dt;
      // endless: one life, the run ends
      if (this.endless) { if (this.deadT > 2.2 && !this.done) this.endRun(); }
      else if (this.deadT > 2.6) this.respawnPlayer();
    }
  }

  // --- endless --------------------------------------------------------------------------------
  endRun() {
    this.done = true; this.paused = true;
    this.mhud.toast(t('game.runOver', { n: this.cleared }), 1.8);
    if (this.onExit) setTimeout(() => this.onExit(this.result(false)), 1800);
  }
  // wave n: more of them, tougher kinds as it goes; every fifth, Gall
  spawnEndlessWave() {
    const n = ++this.wave, [a0, a1] = this.M.arena, X = (c) => c * TILE;
    // clear the bodies of earlier waves (keeps the frame cheap)
    for (let i = this.enemies.length - 1; i >= 0; i--) if (!this.enemies[i].alive) { this.enemies.splice(i, 1); this.brains.splice(i, 1); }
    this.enemyDmg = this.D.dmg * (1 + 0.05 * (n - 1)); this.squad.max = this.D.tokens + Math.floor(n / 4);
    const list = [], count = Math.min(3 + n, 11);
    for (let i = 0; i < count; i++) list.push(n >= 4 && i % 5 === 4 ? 'kal' : n >= 2 && i % 3 === 2 ? 'huc' : 'tet');
    if (n % 5 === 0) list.unshift('gall');
    list.forEach((id, i) => {
      const left = i % 2 === 1;
      const x = left ? a0 + 6 + (i % 3) * 10 : a1 - 6 - (i % 3) * 10;
      const b = this.spawnEnemy({ id, kind: id, x, y: 0, zone: [a0, a1], facing: left ? 1 : -1, boss: id === 'gall' });
      if (id === 'gall') { b.ch.hpMax = b.ch.hp = 500 + n * 120; }
      b.D = this.D; b.alarm(this.mover.x, this.mover.y, 1);
    });
    this.mhud.toast(n % 5 === 0 ? t('game.bossWave', { n }) : t('game.wave', { n }), 1.6);
    this.sfx.play('charge', null, null, { vol: 0.9, rate: 0.55 });
  }
  updateEndless(dt) {
    const left = this.brains.filter((b) => b.ch.alive).length;
    if (this.wave > 0 && left === 0 && this.breakT <= 0) {
      this.cleared = this.wave; this.breakT = 4;
      this.mhud.toast(t('game.waveClear', { n: this.wave }), 1.6); this.sfx.ui('reward', 0.7);
      const P = this.player; if (P.alive) { P.hp = Math.min(P.hpMax, P.hp + 35); for (const g of P.guns) g.reserve = Math.min(g.s.reserve * 2, g.reserve + g.s.mag); }
    }
    if (left === 0) { this.breakT -= dt; if (this.breakT <= 0) { this.spawnEndlessWave(); this.breakT = 0; } }
    this.mhud.objective(1, 1, this.wave ? t('game.left', { n: left }) : t('game.ready'), null, t('game.wave', { n: Math.max(1, this.wave) }));
    if (this.boss && this.boss.ch.alive) this.bossNades(dt, this.boss);
  }

  respawnPlayer() {
    const cp = this.M.checkpoints[this.cp];
    const x = cp ? cp.x : this.M.spawn[0];
    this.mover = new Mover(this.L, x, -2);
    const lo = this.loadout;
    this.player = new Character(this.opId || M2.OPERATORS[this.opIndex], this.e.atlas, this.mover, lo ? { weapon: lo.primary, sidearm: lo.sidearm } : {});
    this.player.hpMax = this.player.hp = 100;
    this.deadT = 0;
    this.ab.onRespawn();
    // the squads calm down a little (no spawn-camping)
    for (const b of this.brains) if (b.ch.alive) { b.state = 'guard'; b.aw = 0.4; b.seenT = 0; b.burst = 0; this.squad.release(b); }
    this.nades.length = 0;
    this.mhud.toast(t('game.checkpoint'), 1.2);
  }

  afterUpdate(dt) {
    super.afterUpdate(dt);
    this.ab.update(dt); this.abHud.update();
    const P = this.player, m = this.mover, MS = this.M;
    if (!this.done && this.started) this.clockT += dt;
    this.mhud.update(dt);
    // health comes back after a few quiet seconds
    if (P.alive && P.t - P.lastHit > 4 && P.hp < P.hpMax) P.hp = Math.min(P.hpMax, P.hp + 14 * dt);
    // checkpoints
    for (let i = this.cp + 1; i < MS.checkpoints.length; i++) {
      if (P.alive && m.x >= MS.checkpoints[i].x) { this.cp = i; this.mhud.toast(t('game.checkpoint'), 1.4); this.sfx.play('marker', null, null, { vol: 0.6, rate: 0.7 }); }
    }
    // objectives
    const o = this.objective;
    let prog = null;
    if (this.endless) this.updateEndless(dt);
    if (o && P.alive) {
      if (o.type === 'reach' && m.x >= o.x) this.advance();
      else if (o.type === 'hack') {
        const T = MS.terminal, near = m.x > T.x0 && m.x < T.x1 && m.grounded;
        if (near) {
          const before = this.hack;
          this.hack = Math.min(T.time, this.hack + dt);
          if (Math.floor(before) !== Math.floor(this.hack)) this.sfx.play('marker', T.x, -20, { rate: 1.3 });
          // hacking is loud: the guard comes for you
          if (before === 0) for (const b of this.brains) if (b.ch.alive && Math.abs(b.ch.m.x - T.x) < 360) b.alarm(m.x, m.y, 1);
          if (this.hack >= T.time) { this.openGate(); this.advance(); }
        }
      } else if (o.type === 'hold') {
        const inside = m.x >= o.x0 && m.x <= o.x1;
        if (inside) {
          const before = this.holdT;
          this.holdT = Math.min(o.time, this.holdT + dt);
          if (Math.floor(before / 5) !== Math.floor(this.holdT / 5)) this.sfx.play('marker', null, null, { vol: 0.5, rate: 1.1 });
        }
        while (this.waveIdx < o.waves.length && this.holdT >= o.waves[this.waveIdx][0]) {
          this.spawnWave(o.waves[this.waveIdx][1]); this.waveIdx++;
          this.mhud.toast(t('game.incoming'), 1.4); this.sfx.play('charge', null, null, { vol: 0.8, rate: 0.6 });
        }
        if (this.holdT >= o.time) this.advance();
      }
    }
    if (o && o.type === 'boss') {
      const B = this.boss;
      if (!B || !B.ch.alive) this.advance();
      else {
        const k = B.ch.hp / B.ch.hpMax;
        // as the fight turns, Gall calls squads in
        while (this.phase < o.phases.length && k < o.phases[this.phase][0]) {
          this.spawnWave(o.phases[this.phase][1]); this.phase++;
          this.mhud.toast(t('game.bossCall'), 1.8); this.sfx.play('charge', null, null, { vol: 0.9, rate: 0.5 });
        }
        this.bossNades(dt, B);
      }
    }
    this.updateNades(dt);
    if (o && o.type === 'hack') prog = this.hack / MS.terminal.time;
    else if (o && o.type === 'hold') prog = this.holdT / o.time;
    this.mhud.boss((this.endless || (o && o.type === 'boss')) && this.boss && this.boss.ch.alive ? t('boss.gall') : null, this.boss ? this.boss.ch.hp / this.boss.ch.hpMax : 0);
    // the gate rises, the squad behind it comes through
    if (this.gateOpen && this.gateK < 1) {
      this.gateK = Math.min(1, this.gateK + dt / 2.4);
      if (this.gateK > 0.75 && !this.gateClear) {
        this.gateClear = true;
        const G = MS.gate;
        for (let c = G.c0; c <= G.c1; c++) for (let n = G.n0; n <= G.n1; n++) this.L.set(c, 25 - n, EMPTY);
      }
      if (this.gateK > 0.5 && !this.waveIn) { this.waveIn = true; this.spawnWave(MS.gate.wave || 1); }
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
        this.mhud.toast(t('game.ammo'), 0.9);
        this.pickups.splice(i, 1);
      } else if (p.t > 40) this.pickups.splice(i, 1);
    }
    // objective HUD
    const ob = this.objective;
    if (ob && !this.endless) this.mhud.objective(this.obj + 1, MS.objectives.length, this.objText(this.obj), prog);
    this.mhud.clock(this.clockT);
    this.pointTo();
  }

  // the boss lobs a grenade at the player every few seconds while it can see them
  bossNades(dt, B) {
    const P = this.player;
    this.nadeT -= dt * (B.blindT > 0 ? 0 : 1);
    if (this.nadeT > 0 || !P.alive || !B.see || B.state !== 'combat') return;
    this.nadeT = rand(4.5, 6.5);
    const e = B.ch, sx = e.m.x + e.facing * 6, sy = e.m.y - 52, T = 0.95, G = 700;
    const tx = P.m.x + P.m.vx * 0.4, ty = P.m.y - 4;
    this.nades.push({ x: sx, y: sy, vx: (tx - sx) / T, vy: (ty - sy - 0.5 * G * T * T) / T, t: 0, life: T + 0.35, tx, ty });
    this.sfx.play('knife', sx, sy, { rate: 0.6 });
  }
  updateNades(dt) {
    const P = this.player;
    for (const n of this.nades) {
      n.t += dt;
      n.vy += 700 * dt;
      const nx = n.x + n.vx * dt, ny = n.y + n.vy * dt;
      if (this.L.solidBox(nx - 1.5, ny - 1.5, nx + 1.5, ny + 1.5)) { n.vx *= 0.25; n.vy = n.vy > 0 ? -n.vy * 0.25 : n.vy * 0.25; } else { n.x = nx; n.y = ny; }
      if (n.t >= n.life) {
        n.dead = true;
        this.ab.flashes = this.ab.flashes || []; this.ab.flashes.push({ x: n.x, y: n.y, t: 0.4, boom: true });
        for (let k = 0; k < 6; k++) this.fx.impact(n.x, n.y, (Math.random() - 0.5) * 2, -1, (Math.random() - 0.5) * 2, -1, 1);
        this.puff(n.x, n.y + 4, 14, 1);
        this.sfx.play('boom', n.x, n.y, { vol: 1 }); this.e.camera.addShake(0.35);
        if (P.alive) {
          const dx = P.m.x - n.x, dy = P.m.y - 30 - n.y, d = Math.hypot(dx, dy);
          if (d < 56 && rayTiles(this.L, n.x, n.y - 2, dx / (d || 1), dy / (d || 1), d, this._n) >= d - 3) {
            const dmg = this.takenK(46 * (1 - d / 90) * (this.D.dmg / DIFF.normal.dmg));
            if (dmg > 0) {
              P.damage(dmg, 'body', Math.sign(dx) || 1, -0.6, P.m.x, P.m.y - 30);
              this.hud.hit(dmg, -Math.sign(dx)); haptic('soft');
              if (!P.alive) { this.onDeath(P, Math.sign(dx) || 1, -0.6); this.onPlayerDown(); }
            }
          }
        }
      }
    }
    this.nades = this.nades.filter((n) => !n.dead);
  }

  openGate() {
    this.gateOpen = true;
    this.sfx.play('gunDrop', this.M.gate.x, -40, { rate: 0.5, vol: 1 });
    this.mhud.toast(t('game.gate'), 1.8);
    this.e.camera.addShake(0.25);
  }

  // where the current objective is in the world
  objectivePoint() {
    const o = this.objective, MS = this.M;
    if (!o) return null;
    if (o.type === 'hack') return [MS.terminal.x, -34];
    if (o.type === 'hold') return [(o.x0 + o.x1) / 2, -30];
    if (o.type === 'boss') return this.boss && this.boss.ch.alive ? [this.boss.ch.m.x, this.boss.ch.m.y - 40] : null;
    if (o.type === 'endless') return null;
    if (o === MS.objectives[MS.objectives.length - 1]) return [MS.extract.x, -34];
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
    const A = this.e.atlas, G = this.M.gate;
    B.begin(w);
    // the gate leaf slides up into the beam
    if (G) B.draw(A.get('m.gateLeaf'), G.x, -this.gateK * (G.h - 6), 1, 1, 0);
    B.end();
    this.ab.drawWorld(B, w);
    B.begin(w);
    const box = A.get('i.pickup.ammo'), dot = A.get('fx.dot');
    for (const p of this.pickups) B.draw(box, p.x, p.y + Math.sin(p.t * 3) * 0.4 - 0.4, 1, 1, 0);
    for (const n of this.nades) B.draw(dot, n.x, n.y, 2, 2, 0, rgba('#2a2f3a'));
    B.end();
  }

  addLights(R) {
    super.addLights(R);
    this.ab.lights(R);
    const MS = this.M, T = MS.terminal, t = this.t;
    if (T) {
      const tc = this.gateOpen ? [0.3, 1, 0.6] : this.hack > 0 ? [1, 0.75, 0.3] : [1, 0.25, 0.25];
      R.addLight(T.x, -19, 26, 0.9, tc);
    }
    MS.checkpoints.forEach((c, i) => R.addLight(c.x, -20, 16, 0.6, i <= this.cp ? [0.3, 1, 0.8] : [1, 0.3, 0.25]));
    const o = this.objective;
    if (o && o.type === 'hold') for (const x of [o.x0, o.x1]) R.addLight(x, -6, 40, 0.8, [0.25, 0.9, 0.9]);
    if (this.boss && this.boss.ch.alive) R.addLight(this.boss.ch.rx, this.boss.ch.ry - 40, 70, 0.6 + 0.2 * Math.sin(t * 4), [1, 0.2, 0.25]);
    for (const n of this.nades) R.addLight(n.x, n.y, 26, (n.t * 6) % 1 < 0.5 ? 1 : 0.3, [1, 0.25, 0.2]);
    if (o === MS.objectives[MS.objectives.length - 1] && MS.extract) {
      const f = 0.8 + Math.sin(t * 17) * 0.1 + Math.sin(t * 6.1) * 0.1;
      R.addLight(MS.extract.x, -28, 90, 1.5 * f, [1, 0.35, 0.25]);
      if (Math.random() < 0.3) this.fx.smoke.emit(this.fx.t, MS.extract.x + rand(-1, 1), -27, rand(-6, 6), rand(-30, -18), rand(1.2, 2), 2, 9, col('#d06a5a', 0.3), col('#d06a5a', 0), -10, 0.6, rand(0, 6), rand(-1, 1));
    }
  }

  drawGlow(B, w) {
    const A = this.e.atlas, glow = A.get('fx.glow'), white = A.get('fx.white'), t = this.t, MS = this.M, T = MS.terminal;
    B.begin(w); B.setBlend(1);
    if (T) {
      // terminal screen
      const sc = this.gateOpen ? '#4dffa0' : this.hack > 0 ? '#ffc060' : '#ff4a5a';
      B.draw(white, T.x, -19, 5, 4, 0, rgba(sc, 0.55 + Math.sin(t * 9) * 0.1));
      B.draw(glow, T.x, -19, 12, 9, 0, rgba(sc, 0.35));
      // hack ring around the terminal
      if (this.objective && this.objective.type === 'hack') this.ring(B, white, T.x, -36, 16, this.hack / T.time);
    }
    // the hold zone: brackets at both ends, a ring that fills over the stall
    const o = this.objective;
    if (o && o.type === 'hold') {
      const a = 0.6 + 0.25 * Math.sin(t * 5);
      for (const [x, s] of [[o.x0, 1], [o.x1, -1]]) {
        B.line(white, x, 0, x, -26, 0.8, rgba('#3ee8e0', a)); B.line(white, x, -26, x + s * 6, -26, 0.8, rgba('#3ee8e0', a)); B.line(white, x, 0, x + s * 6, 0, 0.8, rgba('#3ee8e0', a));
        B.draw(glow, x, -12, 6, 16, 0, rgba('#3ee8e0', 0.18));
      }
      B.draw(glow, (o.x0 + o.x1) / 2, 1, (o.x1 - o.x0) / 2, 3, 0, rgba('#3ee8e0', 0.12));
    }
    // checkpoint lamps
    MS.checkpoints.forEach((c, i) => B.draw(glow, c.x, -20, 5, 5, 0, rgba(i <= this.cp ? '#4dffc8' : '#ff4a4a', 0.75)));
    // the boss: a red aura that breathes; grenades blink, their landing spot is marked
    if (this.boss && this.boss.ch.alive) {
      const c = this.boss.ch, k = 0.14 + 0.06 * Math.sin(t * 4);
      B.draw(glow, c.rx, c.ry - 34, 22, 42, 0, rgba('#ff3347', k));
      B.draw(glow, c.rx + c.facing * 3.5, c.ry - 57, 9, 4, 0, rgba('#ff3347', 0.9));
    }
    for (const n of this.nades) {
      const on = (n.t * 8) % 1 < 0.5;
      B.draw(glow, n.x, n.y, on ? 4 : 2, on ? 4 : 2, 0, rgba('#ff3347', on ? 1 : 0.5));
      const k = Math.min(1, n.t / n.life);
      B.draw(glow, n.tx, n.ty + 3, 30 * k + 8, 3, 0, rgba('#ff3347', 0.2 + 0.25 * k));
    }
    // extraction flare
    if (o === MS.objectives[MS.objectives.length - 1] && MS.extract && !this.endless) {
      const f = 0.8 + Math.sin(t * 17) * 0.1;
      B.draw(glow, MS.extract.x, -28, 20 * f, 20 * f, 0, rgba('#ff5a40', 0.6));
      B.draw(white, MS.extract.x, -28, 1.2, 1.2, 0, rgba('#fff2dc', 1));
    }
    // objective marker: a diamond bobbing over the target
    const p = this.objectivePoint();
    if (p && !this.paused && !(o && o.type === 'boss')) {
      const y = p[1] - 46 + Math.sin(t * 3) * 2, s = 3.2;
      const c = rgba('#3ee8e0', 0.9);
      B.line(white, p[0], y - s, p[0] + s, y, 0.7, c); B.line(white, p[0] + s, y, p[0], y + s, 0.7, c);
      B.line(white, p[0], y + s, p[0] - s, y, 0.7, c); B.line(white, p[0] - s, y, p[0], y - s, 0.7, c);
    }
    B.end();
    this.ab.drawGlow(B, w);
    super.drawGlow(B, w);
  }
  // a progress ring of segments
  ring(B, white, x, y, r, k) {
    const n = 36;
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + (i / n) * Math.PI * 2, a1 = a0 + (Math.PI * 2) / n * 0.7;
      const on = i / n < k;
      B.line(white, x + Math.cos(a0) * r, y + Math.sin(a0) * r, x + Math.cos(a1) * r, y + Math.sin(a1) * r, 0.9, rgba(on ? '#3ee8e0' : '#ffffff', on ? 0.9 : 0.18));
    }
  }
}
