// KOR — campaign missions, end to end.
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
import { buildMission4, buildMission5, buildMission6, buildMission7 } from '../art/env/act2.js';
import { buildMission8, buildMission9, buildMission10 } from '../art/env/act3.js';
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
import { Coach } from '../ui/coach.js';
import { haptic } from '../ui/kit.js';
import { parOf } from '../ui/data.js';

export const BAKE_VERSION = 'd4-69';
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
const BUILD = { m1: buildMission1, m2: buildMission2, m3: buildMission3, m4: buildMission4, m5: buildMission5, m6: buildMission6, m7: buildMission7, m8: buildMission8, m9: buildMission9, m10: buildMission10, endless: buildEndless };
export const MISSION_IDS = Object.keys(BUILD);

// What the lobby shows (docs §10.28): the basement, the operators with every
// weapon, the effects and small items. A first start paints these first and
// opens the lobby; the street, the buildings, the missions' pieces and Vorsa
// paint behind it.
const LOBBY = new RegExp(`^(h|w|fx|i|${M2.OPERATORS.join('|')})\\.`);
export const forLobby = (e) => LOBBY.test(e.name);

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
    ...charBakeList(['huc', 'gall', 'vasq', 'nis', 'bom', 'agr', 'brandt'], ch),
    ...itemBakeList(ch, fx),
    // both gates are the same size
    { name: 'm.gateLeaf', box: [-1, -97, 17, 1], scale: ch, outline: 0.85, paint: (gg) => gateLeaf(gg, 16, 96) },
  ];
}

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
// aim help for the sticks (docs §10.41): within `cone` radians of an enemy's chest the
// aim bends `k` of the way onto it
const ASSIST = { off: null, low: { cone: 0.1, k: 0.45 }, high: { cone: 0.18, k: 0.75 } };
// docs §10.41: how many of a mission's riflemen are, instead, a marksman, a grenadier or a
// heavy gunner (spread along the level, the heavy ones from the squads that come in waves).
// Mission 1 stays as it is: the first fight is the plain one.
const MIX = {
  m2: { nis: 1 }, m3: { nis: 1, bom: 1 }, m4: { nis: 1, bom: 1, agr: 1 }, m5: { nis: 2, bom: 1, agr: 1 },
  m6: { nis: 1, bom: 2, agr: 1 }, m7: { nis: 2, bom: 2, agr: 2 }, m8: { nis: 2, bom: 2, agr: 1 }, m9: { nis: 2, bom: 2, agr: 2 }, m10: { nis: 1, bom: 2, agr: 2 },
};
// the nearest x to x0 (within three tiles) where a body stands clear of solid tiles
export function openSpot(L, x0, y) {
  for (let k = 0; k < 9; k++) {
    const x = x0 + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 6;
    if (!L.solidBox(x - 1, y - 30, x + 1, y - 2)) return x;
  }
  return x0;
}
function mixIn(M, id) {
  const mix = MIX[id];
  if (!mix) return;
  const tets = M.enemies.filter((e) => e.id === 'tet' && !e.boss);
  const waves = tets.filter((e) => e.wave), still = tets.filter((e) => !e.wave);
  const take = (pool, n, k) => { for (let i = 0; i < n && pool.length; i++) { const e = pool.splice(Math.floor(((i + 0.5) / n) * pool.length) % pool.length, 1)[0]; e.id = e.kind = k; } };
  take(waves.length ? waves : still, mix.agr || 0, 'agr');
  take(still, mix.nis || 0, 'nis');
  take(still.length ? still : waves, mix.bom || 0, 'bom');
}
// the bosses: their names, how often they throw, what else they do
const BOSSES = { gall: { nade: [4.5, 6.5] }, brandt: { nade: [5, 7] }, vasq: { nade: [3.8, 5.2], flash: true, dash: true } };

export class MissionScene extends M3.M3Scene {
  // opts: id (m1 … m10, endless), diff, op + loadout + costume (from preparation), hud (the
  // touch layout, for the ability buttons), coach (the first-mission tips), brief (show the
  // briefing card), onExit(result) (back to the menus; without it the card reloads),
  // onSettings() (the pause card's settings)
  constructor(eng, controls, { id = 'm1', diff = 'normal', op = null, loadout = null, costume = null, hud = null, coach = false, brief = true, onExit = null, onSettings = null, onCoachDone = null } = {}) {
    // each run gets a fresh level (gates and walls change its tiles)
    const M = (BUILD[id] || BUILD.m1)();
    mixIn(M, id);
    super(eng, controls, M);
    this.id = BUILD[id] ? id : 'm1';
    this.onExit = onExit; this.onSettings = onSettings; this.diff = diff;
    if (op) {
      this.opId = op; this.loadout = loadout; this.costume = costume;
      this.opIndex = Math.max(0, M2.OPERATORS.indexOf(op));
      this.player = new Character(op, eng.atlas, this.mover, this.kit());
    }
    this.M = M; this.D = DIFF[diff] || DIFF.normal;
    // the gate's sign and girder over the opening are solid: a shut gate cannot be
    // climbed (a jump and a pull-up reach 74 units over the feet) (docs §10.31)
    if (M.gate) for (let c = M.gate.c0; c <= M.gate.c1; c++) for (let n = M.gate.n1 + 1; n <= M.gate.n1 + 4; n++) this.L.set(c, 25 - n, SOLID);
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
    this.holdT = 0; this.waveIdx = 0; this.phase = 0; this.nades = [];
    this.endless = this.id === 'endless'; this.wave = 0; this.cleared = 0; this.breakT = 2.5;
    this.cp = -1; this.deaths = 0; this.clockT = 0; this.done = false; this.started = false;
    this.pickups = [];
    this.ab = new Abilities(this, this.opId || M2.OPERATORS[this.opIndex]);
    this.abHud = new AbilityHud(document.querySelector('#hud'), this.ab, this.ctl, hud);
    this.hud.update(0, this.player);
    if (brief) this.briefing(); else this.begin(diff);
    if (coach) this.coach = new Coach(document.querySelector('#hud'), this, { touch: document.querySelector('#hud .touch'), onDone: onCoachDone });
    // the app going to the background pauses the mission
    this._vis = () => { if (document.hidden) this.pause(); };
    document.addEventListener('visibilitychange', this._vis);
  }

  // what the player's character is made with: the loadout from preparation, the costume
  kit() {
    const lo = this.loadout;
    return { ...(lo ? { weapon: lo.primary, sidearm: lo.sidearm } : {}), costume: this.costume };
  }

  get title() { return this.endless ? t('mode.endless') : `${t('camp.mission', { n: this.id.slice(1) })} · ${t(`mission.${this.id}`)}`; }
  get par() { return this.endless ? 0 : parOf(this.id); }

  pause() {
    if (!this.started || this.done || this.paused) return;
    this.paused = true;
    this.pauseCard();
  }
  resume() {
    if (!this.paused || this.done || !this.started) return;
    this.mhud.hide(); this.paused = false; this.sfx.unlock();
  }
  // the pause card: resume, the settings (sound, controls, the HUD layout: docs §10.41), restart, quit
  pauseCard() {
    this.mhud.show(`<div class="kick">${this.title}</div><h1>${t('game.paused')}</h1>
      <p>${t('game.status', { o: this.objective ? this.objText(this.obj) : '—', t: fmt(this.clockT) })}</p>`,
    [{ label: t('game.resume'), fn: () => this.resume() },
      ...(this.onSettings ? [{ label: t('game.settings'), ghost: true, fn: () => { this.mhud.hide(); this.onSettings(); } }] : []),
      ...(this.onExit
        ? [{ label: t('game.restart'), ghost: true, fn: () => this.onExit({ ...this.result(false), retry: true }) },
          { label: t('game.quit'), ghost: true, fn: () => this.onExit({ ...this.result(false), abandoned: true }) }]
        : [{ label: t('game.restart'), ghost: true, fn: () => location.reload() }])]);
  }

  spawnEnemy(d) {
    // a spawn point on the edge of a crate or a wall moves to the nearest open spot
    const x = openSpot(this.L, d.x, d.y);
    const m = new Mover(this.L, x, d.y); m.facing = d.facing || -1;
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
        time: this.clockT, kills: s.kills, heads: s.heads, shots: s.shots, hits: s.hits, deaths: this.deaths, byWeapon: s.byWeapon, bosses: this.bossKills || 0 };
    }
    return {
      id: this.id, done, diff: this.diff || 'normal', op: this.opId || M2.OPERATORS[this.opIndex],
      stars: done ? [true, this.clockT <= this.par, this.deaths === 0] : [false, false, false],
      time: this.clockT, kills: s.kills, heads: s.heads, shots: s.shots, hits: s.hits, deaths: this.deaths,
      byWeapon: s.byWeapon, par: this.par, bosses: this.bossKills || 0,
    };
  }

  // remove everything this scene put in the page
  dispose() {
    document.removeEventListener('visibilitychange', this._vis);
    const H = this.hud, MH = this.mhud;
    for (const n of [H.el, H.hurtEl, H.dirL, H.dirR, H.deadEl, MH.obj, MH.time, MH.toastEl, MH.card, MH.bossEl]) n && n.remove();
    this.abHud.remove(); this.ab.dispose(); this.coach?.remove();
  }

  get objective() { return this.M.objectives[this.obj] || null; }
  objText(i) { return this.endless ? t('game.wave', { n: this.wave }) : t(`mission.${this.id}.o${i + 1}`); }

  advance() {
    this.obj++;
    this.sfx.play('kill', null, null, { vol: 0.5, rate: 0.8 });
    if (!this.objective) { this.debrief(); return; }
    this.holdT = 0; this.waveIdx = 0; this.phase = 0;
    const o = this.objective;
    // a boss that walks in when its objective comes up (Brandt, Vasquez: docs §10.41)
    if (o.type === 'boss' && o.boss && !(this.boss && this.boss.ch.alive)) {
      const b = this.spawnEnemy({ ...o.boss, kind: o.boss.id, y: 0, facing: o.boss.facing || -1, boss: true });
      b.alarm(this.mover.x, this.mover.y, 1);
      this.mhud.toast(t('game.bossIn', { n: this.bossName(b) }), 2);
      this.sfx.play('charge', null, null, { vol: 0.9, rate: 0.45 }); this.e.camera.addShake(0.2);
      return;
    }
    this.mhud.toast(t('game.objUpdated'), 1.4);
  }
  bossName(b) { return t(`boss.${(b || this.boss || {}).kind || 'gall'}`); }

  // --- simulation -----------------------------------------------------------------------------
  update(dt) {
    if (this.paused) { this.mhud.update(dt); return; }
    this.stepDt = dt;
    super.update(dt);
    this.coach?.update(dt);
  }

  // The sticks (touch, a pad) aim by direction: the aim turns toward the stick at the
  // player's speed and, with aim help on, bends onto an enemy close to where it points.
  // The mouse aims at a point, untouched.
  aimPoint() {
    const c = this.ctl;
    if (this.aimWorld || c.aimMode === 'point') {
      const p = super.aimPoint();
      if (this.flashT > 0 && !this.aimWorld) { const k = Math.min(1, this.flashT) * 26; return [p[0] + Math.sin(this.t * 19) * k, p[1] + Math.cos(this.t * 23) * k]; }
      return p;
    }
    const m = this.mover, sx = m.x, sy = m.y - 48;
    let dx = c.aimDX, dy = c.aimDY;
    if (!c.aimHeld && Math.abs(c.moveX) > 0.2) { dx = Math.sign(c.moveX); dy = 0; }
    let a = Math.atan2(dy, dx);
    const help = c.aimHeld ? ASSIST[c.aimAssist || 'low'] : null;
    if (help) {
      let best = null, bd = help.cone;
      for (const b of this.brains) {
        const e = b.ch;
        if (!e.alive || this.offView(e.m.x, -8)) continue;
        const ex = e.m.x - sx, ey = e.m.y - 40 - sy;
        if (ex * ex + ey * ey > 420 * 420) continue;
        const da = Math.abs(wrapA(Math.atan2(ey, ex) - a));
        if (da < bd) { bd = da; best = Math.atan2(ey, ex); }
      }
      if (best !== null) a += wrapA(best - a) * help.k;
    }
    if (this.flashT > 0) a += Math.sin(this.t * 21) * 0.14 * Math.min(1, this.flashT);
    const sens = c.aimSens || 1;
    if (this.aimA === undefined || sens >= 2 || !c.aimHeld) this.aimA = a;
    else this.aimA += wrapA(a - this.aimA) * (1 - Math.exp(-(this.stepDt || 1 / 120) * 40 * sens));
    return [sx + Math.cos(this.aimA) * 200, sy + Math.sin(this.aimA) * 200];
  }

  updateEnemies(dt) {
    const w = this.world; w.t = this.t;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i], b = this.brains[i];
      const inp = b.think(dt, w);
      e.preStep();
      if (e.alive) e.m.step(dt, inp);
      e.far = this.offView(e.m.x, 160);
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
    if (dead.team === 1 && this.brains.some((b) => b.boss && b.ch === dead)) this.bossKills = (this.bossKills || 0) + 1;
    if (this.boss && dead === this.boss.ch) { this.e.camera.addShake(0.5); this.sfx.play('boom', dead.m.x, dead.m.y - 30, { vol: 1, rate: 0.8 }); this.mhud.toast(t('game.bossDown', { n: this.bossName() }), 2); }
    if (dead === this.player) this.onPlayerDown();
  }
  onPlayerDown() { this.deaths++; this.deadT = 0; }

  // --- abilities ------------------------------------------------------------------------------
  beforePlayerStep(dt, inp) {
    super.beforePlayerStep(dt, inp);
    if (this.started && !this.done) this.ab.input(this.ctl);
  }
  // plate on the heavy kinds takes a share off body hits; a dashing Vasquez is not there to hit
  dealtK(who, zone) {
    const A = who.spec.armor && zone !== 'head' ? who.spec.armor : 1;
    return this.ab.dmgK(who, zone) * A * (who.dashT > 0 ? 0.1 : 1);
  }
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
  // wave n: more of them, tougher kinds as it goes (the marksman from the third, the
  // grenadier from the fifth, the heavy gunner from the sixth); every fifth a boss, in
  // turn Gall, Brandt, Vasquez (docs §10.41)
  spawnEndlessWave() {
    const n = ++this.wave, [a0, a1] = this.M.arena;
    // clear the bodies of earlier waves (keeps the frame cheap)
    for (let i = this.enemies.length - 1; i >= 0; i--) if (!this.enemies[i].alive) { this.enemies.splice(i, 1); this.brains.splice(i, 1); }
    this.enemyDmg = this.D.dmg * (1 + 0.05 * (n - 1)); this.squad.max = this.D.tokens + Math.floor(n / 4);
    const list = [], count = Math.min(3 + n, 11);
    for (let i = 0; i < count; i++) {
      list.push(n >= 6 && i % 7 === 6 ? 'agr' : n >= 5 && i % 6 === 5 ? 'bom' : n >= 3 && i % 5 === 3 ? 'nis' : n >= 4 && i % 5 === 4 ? 'kal' : n >= 2 && i % 3 === 2 ? 'huc' : 'tet');
    }
    const boss = n % 5 === 0 ? ['gall', 'brandt', 'vasq'][(n / 5 - 1) % 3] : null;
    if (boss) list.unshift(boss);
    list.forEach((id, i) => {
      const left = i % 2 === 1;
      const x = left ? a0 + 6 + (i % 3) * 10 : a1 - 6 - (i % 3) * 10;
      const b = this.spawnEnemy({ id, kind: id, x, y: 0, zone: [a0, a1], facing: left ? 1 : -1, boss: id === boss });
      if (id === boss) { b.ch.hpMax = b.ch.hp = { gall: 500, brandt: 600, vasq: 700 }[id] + n * 120; }
      b.D = this.D; b.alarm(this.mover.x, this.mover.y, 1);
    });
    this.mhud.toast(boss ? t('game.bossWave', { n, b: t(`boss.${boss}`) }) : t('game.wave', { n }), 1.6);
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
    if (this.boss && this.boss.ch.alive) this.bossSkills(dt, this.boss);
  }

  respawnPlayer() {
    const cp = this.M.checkpoints[this.cp];
    const x = cp ? cp.x : this.M.spawn[0];
    this.mover = new Mover(this.L, x, -2);
    this.player = new Character(this.opId || M2.OPERATORS[this.opIndex], this.e.atlas, this.mover, this.kit());
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
          this.mhud.toast(t('game.bossCall', { n: this.bossName() }), 1.8); this.sfx.play('charge', null, null, { vol: 0.9, rate: 0.5 });
        }
        this.bossSkills(dt, B);
      }
    }
    this.updateNades(dt);
    this.relightStep(dt);
    if (o && o.type === 'hack') prog = this.hack / MS.terminal.time;
    else if (o && o.type === 'hold') prog = this.holdT / o.time;
    this.mhud.boss((this.endless || (o && o.type === 'boss')) && this.boss && this.boss.ch.alive ? this.bossName() : null, this.boss ? this.boss.ch.hp / this.boss.ch.hpMax : 0);
    // grenadiers lob theirs; the player blinded by a flash sees white for a moment
    for (const b of this.brains) if (b.kind === 'bom' && b.ch.alive) this.lob(dt, b, [5.5, 8], 'frag', 0.7);
    this.flashStep(dt);
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

  // What a boss does besides shooting (docs §10.41): every boss lobs grenades; Vasquez,
  // who has read the files on the five, also throws flashes, dashes out of the aim
  // and, under half his health, fires faster.
  bossSkills(dt, B) {
    const S = BOSSES[B.kind] || BOSSES.gall, e = B.ch, P = this.player;
    // Vasquez: a flash, then a frag, in turn
    if (this.lob(dt, B, S.nade, S.flash && B.flashNext ? 'flash' : 'frag')) B.flashNext = !!S.flash && !B.flashNext;
    if (S.dash) {
      e.dashT = Math.max(0, (e.dashT || 0) - dt);
      B.dashCd = (B.dashCd ?? 3) - dt;
      if (B.dashCd <= 0 && P.alive && B.see) {
        // the player's aim on him: he is gone sideways in a burst of sparks
        const sh = P.shoulder(this._a), a = Math.atan2(e.m.y - 36 - sh[1], e.m.x - sh[0]), pa = Math.atan2(P.aimY - sh[1], P.aimX - sh[0]);
        if (Math.abs(Math.atan2(Math.sin(a - pa), Math.cos(a - pa))) < 0.14) {
          const away = Math.sign(e.m.x - P.m.x) || 1, dir = Math.random() < 0.6 ? away : -away;
          e.m.vx = dir * 430; e.dashT = 0.35; B.dashCd = rand(4.5, 6.5);
          for (let k = 0; k < 8; k++) this.fx.impact(e.m.x, e.m.y - 4, -dir * Math.random(), -0.4, -dir, -0.2, 0.6);
          this.sfx.play('charge', e.m.x, e.m.y - 30, { vol: 0.7, rate: 1.4 });
        }
      }
      e.overdrive = e.hp < e.hpMax * 0.5;
    }
  }
  bossNades(dt, B) { this.lob(dt, B, (BOSSES[B.kind] || BOSSES.gall).nade); }
  // a grenade lobbed at the player from brain B every so often while it can see them;
  // kind 'frag' (k: its damage share) or 'flash' (blinds, no damage)
  lob(dt, B, [lo, hi], kind = 'frag', k = 1) {
    const P = this.player;
    B.nadeT = (B.nadeT ?? rand(lo, hi) * 0.6) - dt * (B.blindT > 0 ? 0 : 1);
    if (B.nadeT > 0 || !P.alive || !B.see || B.state !== 'combat') return false;
    B.nadeT = rand(lo, hi);
    const e = B.ch, sx = e.m.x + e.facing * 6, sy = e.m.y - 52, T = 0.95, G = 700;
    const tx = P.m.x + P.m.vx * 0.4, ty = P.m.y - 4;
    this.nades.push({ x: sx, y: sy, vx: (tx - sx) / T, vy: (ty - sy - 0.5 * G * T * T) / T, t: 0, life: T + 0.35, tx, ty, kind, k });
    this.sfx.play('knife', sx, sy, { rate: 0.6 });
    return true;
  }
  // a flash: the screen white, fading; aim is shaken while it lasts
  blind(sec) {
    this.flashT = Math.max(this.flashT || 0, sec);
    if (!this.flashEl) { this.flashEl = document.createElement('div'); this.flashEl.className = 'flashbang'; document.querySelector('#hud').appendChild(this.flashEl); }
    haptic('heavy');
  }
  flashStep(dt) {
    if (!this.flashEl) return;
    this.flashT = Math.max(0, (this.flashT || 0) - dt);
    const v = Math.min(1, this.flashT / 0.9);
    if (Math.abs(v - (this.flashV || 0)) > 0.02 || (v === 0 && this.flashV)) { this.flashV = v; this.flashEl.style.opacity = v.toFixed(2); }
  }
  updateNades(dt) {
    const P = this.player;
    for (const n of this.nades) {
      n.t += dt;
      n.vy += 700 * dt;
      const nx = n.x + n.vx * dt, ny = n.y + n.vy * dt;
      if (this.L.solidBox(nx - 1.5, ny - 1.5, nx + 1.5, ny + 1.5)) { n.vx *= 0.25; n.vy = n.vy > 0 ? -n.vy * 0.25 : n.vy * 0.25; } else { n.x = nx; n.y = ny; }
      if (n.t >= n.life && n.kind === 'flash') {
        // a flash: a white burst, the player blinded if they saw it (no damage)
        n.dead = true;
        this.ab.flashes = this.ab.flashes || []; this.ab.flashes.push({ x: n.x, y: n.y, t: 0.4 });
        this.sfx.play('boom', n.x, n.y, { vol: 0.7, rate: 1.6 }); this.e.camera.addShake(0.15);
        if (P.alive) {
          const dx = P.m.x - n.x, dy = P.m.y - 40 - n.y, d = Math.hypot(dx, dy);
          if (d < 170 && rayTiles(this.L, n.x, n.y - 2, dx / (d || 1), dy / (d || 1), d, this._n) >= d - 3) this.blind(1.8 * (1 - d / 220));
        }
      } else if (n.t >= n.life) {
        n.dead = true;
        this.ab.flashes = this.ab.flashes || []; this.ab.flashes.push({ x: n.x, y: n.y, t: 0.4, boom: true });
        for (let k = 0; k < 6; k++) this.fx.impact(n.x, n.y, (Math.random() - 0.5) * 2, -1, (Math.random() - 0.5) * 2, -1, 1);
        this.puff(n.x, n.y + 4, 14, 1);
        this.sfx.play('boom', n.x, n.y, { vol: 1 }); this.e.camera.addShake(0.35);
        if (P.alive) {
          const dx = P.m.x - n.x, dy = P.m.y - 30 - n.y, d = Math.hypot(dx, dy);
          if (d < 56 && rayTiles(this.L, n.x, n.y - 2, dx / (d || 1), dy / (d || 1), d, this._n) >= d - 3) {
            const dmg = this.takenK(46 * (n.k ?? 1) * (1 - d / 90) * (this.D.dmg / DIFF.normal.dmg));
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
    if (o === MS.objectives[MS.objectives.length - 1] && MS.extract) return [MS.extract.x, -34];
    return [o.x, -30];
  }

  pointTo() {
    const p = this.objectivePoint(), cam = this.e.camera;
    if (!p || this.paused) { this.mhud.pointer(null); return; }
    const w = this.e.renderer.cssW, h = this.e.renderer.cssH;
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

  // how far the furnace has come back (mission 7, docs §10.31): 0 cold, 1 burning;
  // it follows the hold at the cast house, then stays lit
  relightTarget() {
    const RL = this.M.relight;
    if (!RL) return 0;
    if (this.obj > RL.obj || this.done) return 1;
    return this.obj === RL.obj ? this.holdT / this.M.objectives[RL.obj].time : 0;
  }
  relightStep(dt) {
    const RL = this.M.relight;
    if (!RL) return;
    const was = this.rk || 0, k = this.rk = was + (this.relightTarget() - was) * Math.min(1, dt * 1.2);
    if (was < 0.5 && k >= 0.5) { this.mhud.toast(t('game.furnaceBlast'), 1.8); this.sfx.play('charge', RL.tap[0], RL.tap[1], { vol: 0.8, rate: 0.4 }); this.e.camera.addShake(0.12); }
    if (was < 0.97 && k >= 0.97) { this.mhud.toast(t('game.furnaceLit'), 2.2); this.sfx.play('boom', RL.tap[0], RL.tap[1], { vol: 0.6, rate: 0.5 }); this.e.camera.addShake(0.3); }
    if (k < 0.04) return;
    const [tx, ty] = RL.tap, ft = this.fx.t;
    // sparks spitting from the tap hole, more as it heats
    if (Math.random() < dt * 40 * k) this.fx.sparks.emit(ft, tx + rand(-2, 2), ty + rand(-1, 1), rand(10, 70), rand(-60, -10), rand(0.4, 1.0), rand(0.5, 1), 0.2, col('#ffd28a', 1), col('#ff6a2a', 0), 160, 0.6, 0, 0);
    // iron running down the trough once it has taken the blast
    if (k > 0.45 && Math.random() < dt * 30 * k) { const [[ax, ay], [bx, by]] = RL.trough, u = Math.random(); this.fx.sparks.emit(ft, ax + (bx - ax) * u, ay + (by - ay) * u - 1, rand(-6, 16), rand(-30, -8), rand(0.2, 0.5), rand(0.4, 0.8), 0.1, col('#ffe0a0', 1), col('#ff5a1a', 0), 120, 0.4, 0, 0); }
    // smoke and steam off the throat, then the top gas flaring
    const [px, py] = RL.top;
    if (Math.random() < dt * 6 * k) this.fx.smoke.emit(ft, px + rand(-10, 10), py + rand(0, 4), rand(4, 14), rand(-20, -8), rand(2.5, 4.5), rand(8, 12), rand(26, 40), col('#cbbcae', 0.22 * k), col('#cbbcae', 0), -6, 0.3, rand(0, 6), rand(-0.4, 0.4));
  }

  addLights(R) {
    super.addLights(R);
    this.ab.lights(R);
    const MS = this.M, T = MS.terminal, t = this.t;
    if (MS.relight && this.rk > 0.02) {
      const k = this.rk, fl = 0.9 + 0.1 * Math.sin(t * 13) * Math.sin(t * 5.3), RL = MS.relight;
      R.addLight(RL.tap[0], RL.tap[1] + 4, 30 + 110 * k, (0.3 + 1.5 * k) * fl, [1, 0.5, 0.2]);
      if (k > 0.45) R.addLight(RL.trough[1][0], RL.trough[1][1], 70 * k, 1.2 * (k - 0.4) * fl, [1, 0.55, 0.22]);
      R.addLight(RL.top[0], RL.top[1] + 10, 50 + 60 * k, 0.9 * k * fl, [1, 0.6, 0.3]);
    }
    if (T) {
      const tc = this.gateOpen ? [0.6, 0.9, 0.65] : this.hack > 0 ? [1, 0.78, 0.45] : [0.9, 0.45, 0.38];
      R.addLight(T.x, -19, 22, 0.6, tc);
    }
    // a checkpoint reached is a bulb switched on; the rest stay dark
    MS.checkpoints.forEach((c, i) => { if (i <= this.cp) R.addLight(c.x, -20, 18, 0.5, [1, 0.8, 0.55]); });
    const o = this.objective;
    for (const n of this.nades) R.addLight(n.x, n.y, 16, (n.t * 6) % 1 < 0.5 ? 0.5 : 0.15, [1, 0.6, 0.3]);
    if (o === MS.objectives[MS.objectives.length - 1] && MS.extract && o.type !== 'boss') {
      const f = 0.8 + Math.sin(t * 17) * 0.1 + Math.sin(t * 6.1) * 0.1;
      R.addLight(MS.extract.x, -28, 90, 1.5 * f, [1, 0.35, 0.25]);
      if (Math.random() < 0.3) this.fx.smoke.emit(this.fx.t, MS.extract.x + rand(-1, 1), -27, rand(-6, 6), rand(-30, -18), rand(1.2, 2), 2, 9, col('#d06a5a', 0.3), col('#d06a5a', 0), -10, 0.6, rand(0, 6), rand(-1, 1));
    }
  }

  drawGlow(B, w) {
    const A = this.e.atlas, glow = A.get('fx.glow'), white = A.get('fx.white'), t = this.t, MS = this.M, T = MS.terminal;
    B.begin(w); B.setBlend(1);
    if (T) {
      // terminal screen: an old monitor's dull phosphor, no halo round it
      const sc = this.gateOpen ? '#9fd8a8' : this.hack > 0 ? '#e8c088' : '#d08070';
      B.draw(white, T.x, -19, 5, 4, 0, rgba(sc, 0.4 + Math.sin(t * 9) * 0.05));
      B.draw(glow, T.x, -19, 7, 5, 0, rgba(sc, 0.12));
      // hack ring around the terminal
      if (this.objective && this.objective.type === 'hack') this.ring(B, white, T.x, -36, 16, this.hack / T.time);
    }
    // the furnace coming back: the tap hole, the iron in the trough, the throat
    if (MS.relight && this.rk > 0.02) {
      const k = this.rk, fl = 0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 4.1), RL = MS.relight, [tx, ty] = RL.tap;
      B.draw(glow, tx, ty, 8 + 14 * k, 5 + 8 * k, 0, rgba('#ff7a2a', (0.25 + 0.6 * k) * fl));
      B.draw(white, tx, ty, 3 + 2 * k, 1.6 + k, 0, rgba('#ffe2a8', 0.4 + 0.6 * k));
      if (k > 0.45) {
        const [[ax, ay], [bx, by]] = RL.trough, a = Math.min(1, (k - 0.45) * 2.2);
        B.line(white, ax, ay, bx, by, 1.4, rgba('#ffcf80', 0.9 * a));
        B.draw(glow, (ax + bx) / 2, (ay + by) / 2, 22, 10, Math.atan2(by - ay, bx - ax), rgba('#ff6a20', 0.35 * a * fl));
        B.draw(glow, bx, by + 2, 26, 6, 0, rgba('#ff7a2a', 0.45 * a * fl));
      }
      const [px, py] = RL.top;
      B.draw(glow, px, py + 4, 16 + 30 * k, 8 + 10 * k, 0, rgba('#ff9a50', 0.45 * k * fl));
      if (k > 0.9) B.draw(glow, px + 2, py - 6 - Math.sin(t * 7) * 2, 6, 12, 0, rgba('#ffd090', 0.6 * fl));
    }
    // the hold zone: chalk marks at both ends, as the cells mark a place on a wall
    const o = this.objective;
    if (o && o.type === 'hold') {
      const a = 0.42 + 0.08 * Math.sin(t * 3);
      for (const [x, s] of [[o.x0, 1], [o.x1, -1]]) {
        B.line(white, x, 0, x, -26, 0.6, rgba('#e6dcc6', a)); B.line(white, x, -26, x + s * 6, -26, 0.6, rgba('#e6dcc6', a)); B.line(white, x, 0, x + s * 6, 0, 0.6, rgba('#e6dcc6', a));
      }
    }
    // checkpoints reached: the bulb on
    MS.checkpoints.forEach((c, i) => { if (i <= this.cp) B.draw(glow, c.x, -20, 3, 3, 0, rgba('#ffe6b8', 0.6)); });
    // grenades: the fuse spitting at the tip, and a faint mark where it will land
    for (const n of this.nades) {
      const on = (n.t * 8) % 1 < 0.5;
      B.draw(glow, n.x, n.y, on ? 1.8 : 1.2, on ? 1.8 : 1.2, 0, rgba('#ffc890', on ? 0.8 : 0.4));
      const k = Math.min(1, n.t / n.life);
      B.draw(glow, n.tx, n.ty + 3, 24 * k + 8, 2.4, 0, rgba('#c24a3a', 0.1 + 0.18 * k));
    }
    // extraction flare
    if (o === MS.objectives[MS.objectives.length - 1] && MS.extract && !this.endless && o.type !== 'boss') {
      const f = 0.8 + Math.sin(t * 17) * 0.1;
      B.draw(glow, MS.extract.x, -28, 20 * f, 20 * f, 0, rgba('#ff5a40', 0.6));
      B.draw(white, MS.extract.x, -28, 1.2, 1.2, 0, rgba('#fff2dc', 1));
    }
    // the marksman's laser: faint while he watches, bright just before the shot (docs §10.41)
    for (const b of this.brains) {
      const e = b.ch;
      if (b.kind !== 'nis' || !e.alive || b.state !== 'combat' || !b.see || !e.gun || this.offView(e.m.x, 40)) continue;
      const mz = e.muzzle(this._b), dx = e.aimX - mz[0], dy = e.aimY - mz[1], d = Math.hypot(dx, dy) || 1;
      const L = rayTiles(this.L, mz[0], mz[1], dx / d, dy / d, 700, this._n), ex = mz[0] + (dx / d) * L, ey = mz[1] + (dy / d) * L;
      const hot = b.burst > 0 || b.pause < 0.7, a = hot ? 0.55 + 0.25 * Math.sin(t * 40) : 0.2;
      B.line(white, mz[0], mz[1], ex, ey, hot ? 0.5 : 0.3, rgba('#ff3a26', a));
      B.draw(glow, ex, ey, hot ? 5 : 3, hot ? 5 : 3, 0, rgba('#ff4a30', a));
    }
    // objective marker: a diamond bobbing over the target
    const p = this.objectivePoint();
    if (p && !this.paused && !(o && o.type === 'boss')) {
      const y = p[1] - 46 + Math.sin(t * 3) * 2, s = 3.2;
      const c = rgba('#efe6d2', 0.8);
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
      B.line(white, x + Math.cos(a0) * r, y + Math.sin(a0) * r, x + Math.cos(a1) * r, y + Math.sin(a1) * r, 0.9, rgba(on ? '#efe6d2' : '#ffffff', on ? 0.85 : 0.16));
    }
  }
}
