// KOR — the application: menus over a live backdrop, missions,
// the save, settings, the legal gate and the back button.
//
// One engine (renderer, atlas, loop) runs the whole time; `scene` is either
// the Showcase (menus) or a MissionScene. The menus are DOM screens in #ui,
// scaled as a whole with CSS zoom so they keep their composition on every
// screen size.
import { Router } from './ui/router.js';
import { configureKit, toast, modal, h, ui as uiSound, grain } from './ui/kit.js';
import { setLang, getLang, t } from './ui/i18n.js';
import * as SCREENS from './ui/screens/index.js';
import { hudLayout } from './ui/screens/hudedit.js';
import { Showcase } from './game/showcase.js';
import { MissionScene } from './game/mission.js';
import { Bench, reportText } from './game/bench.js';
import { bindKeyboard, bindTouch, pollPad, KEYS_DEFAULT } from './game/input.js';
import { applyMission } from './core/save.js';
import { syncTints, ensureDaily, ensureWeekly, costumeOf } from './core/economy.js';
import { refreshCur } from './ui/screens/common.js';
import { needsAcceptance } from './legal/consent.js';
import { Music } from './audio/music.js';
import { CinePlayer } from './cine/player.js';
import { FilmPlayer } from './cine/film.js';
import { PROLOGUE, STORY } from './cine/scenes.js';
import { companyFlag } from './art/env/flag.js';

const MARKS = { yellow: [1, 0.86, 0.12, 1], blue: [0.2, 0.62, 1, 1], magenta: [1, 0.25, 0.85, 1] };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
// copy diagnostic text (the WebView may refuse the clipboard API: fall back to a selection)
export function copyText(text) {
  const ok = () => toast(t('bench.copied')), fail = () => toast(t('bench.copyFail'), { kind: 'warn' });
  const legacy = () => {
    const ta = Object.assign(document.createElement('textarea'), { value: text, readOnly: true });
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta); ta.select();
    let r = false; try { r = document.execCommand('copy'); } catch { r = false; }
    ta.remove(); (r ? ok : fail)();
  };
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(ok, legacy); else legacy();
}

export class App {
  constructor(eng, { save, version, controls, perf, dyn, rest = null }) {
    this.e = eng; this.save = save; this.version = version; this.controls = controls; this.perf = perf; this.dyn = dyn;
    this.rest = rest; // after a first start, the street and the missions still painting (docs §10.28)
    grain();
    // the economy: the hub's coin counter, the finishes the guns are drawn with, today's tasks
    refreshCur.save = save; syncTints(save.d); ensureDaily(save); ensureWeekly(save);
    bindKeyboard(controls, eng.renderer.canvas);
    this.uiRoot = document.querySelector('#ui');
    this.showcase = new Showcase(eng);
    this.scene = this.showcase;
    this.ctx = {
      save, version, showcase: this.showcase, reduceMotion: false,
      startMission: (id, o) => this.startMission(id, o),
      playStory: (id, o) => this.playStory(id, o),
      hasStory: (id) => !!STORY[id],
      applySettings: () => this.applySettings(),
      runBench: () => this.runBench(),
      controls: this.controls,
      copyText,
    };
    this.router = this.ctx.router = new Router(this.uiRoot, this.ctx, SCREENS);
    this.router.onRootBack = () => this.rootBack();
    // the back button: one guard history entry, re-armed after every press
    history.pushState({ g: 1 }, '');
    addEventListener('popstate', () => this.onBack());
    addEventListener('resize', () => this.fit());
    addEventListener('keydown', (e) => {
      if (e.code !== 'Escape' || this.controls.capture) return;
      if (this.gameSettings) this.router.back();
      else if (this.scene !== this.showcase) { if (this.scene.paused) this.scene.resume?.(); else this.scene.pause?.(); } else if (!document.querySelector('.scrim')) this.router.back();
    });
    // the first touch starts the audio
    const unlock = () => eng.sfx.unlock();
    // music: the lobby track until a mission starts; quiet while the app is in the background
    this.music = new Music(eng.sfx);
    this.music.play('lobby');
    document.addEventListener('visibilitychange', () => { const c = eng.sfx.ctx; if (!c) return; if (document.hidden) c.suspend?.(); else c.resume?.(); });
    for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, unlock, { passive: true });
    this.applySettings(true);
    // the phone's font size (Android passes it in; docs §10.26)
    const fs = () => this.fontScale(window.__korFontScale);
    addEventListener('korfontscale', fs);
    if (window.__korFontScale) fs();
  }

  // The phone's font-size setting. The WebView's own text zoom is pinned at 100 %
  // (the HUD used to blow up over the screen), so the setting arrives here instead
  // and sets the interface scale, within what the menus can take, until the player
  // picks a scale in Settings; the in-game HUD's text follows it too (--hudk).
  fontScale(f) {
    if (!(f > 0)) return;
    document.documentElement.style.setProperty('--hudk', clamp(f, 1, 1.2).toFixed(3));
    const st = this.save.d.settings;
    if (st.uiScaleBy === 'player') return;
    // a scale chosen before this build is the player's own
    if (!st.uiScaleFromFont && Math.abs((st.uiScale || 1) - 1) > 1e-3) { this.save.set((d) => { d.settings.uiScaleBy = 'player'; }); return; }
    const v = clamp(Math.round(f * 20) / 20, 0.85, 1.15);
    if (v === st.uiScale && st.uiScaleFromFont) return;
    this.save.set((d) => { d.settings.uiScale = v; d.settings.uiScaleFromFont = true; });
    this.fit();
  }

  // UI zoom. The menus are laid out on a canvas of at least 720×360: never
  // shrunk below 1 by the screen, grown with it from ~800×390 up, times the
  // player's scale, but never so far that the canvas drops under that floor.
  // When the player scales down, the hit token grows so touch targets stay
  // 44 real pixels.
  fit() {
    const W = innerWidth, H = innerHeight, root = document.documentElement.style;
    let z = clamp(Math.min(H / 390, W / 800), 1, 2.6) * (this.save.d.settings.uiScale || 1);
    z = Math.max(0.8, Math.min(z, Math.max(1, W / 720), Math.max(1, H / 360)));
    root.setProperty('--zoom', z.toFixed(3));
    root.setProperty('--hit', `${Math.max(44, 44 / z).toFixed(1)}px`);
  }

  applySettings(first = false) {
    const st = this.save.d.settings, R = this.e.renderer;
    // Oto is what this device was found to hold (boot.js, the governor there)
    const q = st.quality === 'auto' ? this.dyn.autoQ : st.quality;
    if (q && q !== R.qName) R.setQuality(q);
    this.dyn.governs = st.quality === 'auto';
    R.bloomOn = st.bloom; R.lightsOn = st.lights;
    this.dyn.on = st.dynRes; if (!st.dynRes) { this.dyn.step = 0; R.setDyn(1); }
    if (this.e.loop) this.e.loop.cap = st.fpsCap ?? 60;
    if (this.perf && this.perf.visible !== st.fps) this.perf.toggle();
    this.e.sfx.setVolumes(st.vol);
    this.controls.keys = { ...KEYS_DEFAULT, ...(st.keys || {}) };
    this.controls.aimAssist = st.aimAssist; this.controls.aimSens = st.aimSens;
    configureKit({ haptics: st.haptics, reduce: st.reduceMotion, sfx: this.e.sfx });
    this.ctx.reduceMotion = st.reduceMotion;
    this.e.reduceMotion = st.reduceMotion;
    this.e.camera.shakeMul = st.shake;
    this.inkFor(this.scene);
    if (st.lang !== getLang()) { setLang(st.lang); if (!first) this.router.refresh(); }
    this.fit();
  }
  inkFor(scene) { if (scene && scene.cr) scene.cr.enemyInk = MARKS[this.save.d.settings.enemyMark] || null; }

  start({ entrance = false, story = true } = {}) {
    this.router.go(needsAcceptance() ? 'legal' : 'lobby', { entrance }, { root: true });
    if (this.save.recovered) toast(t('app.recovered'));
    // a player from before the story: the prologue once, on a tap (sound needs one)
    if (story && !needsAcceptance() && !this.save.d.story.prologue && !new URLSearchParams(location.search).has('nostory')) this.tapToStart();
  }
  tapToStart() {
    const el = document.createElement('div');
    el.className = 'cine-tap'; el.innerHTML = `<span>${t('story.tap')}</span>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('on'));
    el.addEventListener('pointerdown', () => { el.remove(); this.playStory('prologue'); }, { once: true });
  }

  // --- the films: the prologue and the scenes before missions -------------------------------
  // The film covers everything; the backdrop's loop and the music stop until it ends.
  playStory(id, { then } = {}) {
    const scene = id === 'prologue' ? PROLOGUE : STORY[id];
    // ?nostory (test harnesses): the films are taken as seen
    const seen = () => this.save.set((d) => { if (id === 'prologue') d.story.prologue = true; else d.story.seen[id] = true; });
    if (!scene || this.film || new URLSearchParams(location.search).has('nostory')) { if (scene && !this.film) seen(); then?.(); return; }
    this.e.sfx.unlock();
    this.music.play(null);
    const loop = this.e.loop; loop?.stop();
    const st = this.save.d.settings, quality = st.quality === 'low' ? 'low' : st.quality === 'med' ? 'med' : 'high';
    // the film as video (drawn ahead of time); ?livefilm draws it live as before
    const Player = new URLSearchParams(location.search).has('livefilm') ? CinePlayer : FilmPlayer;
    this.film = new Player(scene, {
      sfx: this.e.sfx, reduce: st.reduceMotion, quality,
      onEnd: () => {
        this.film = null;
        seen();
        loop?.start();
        this.music.play('lobby');
        then?.();
      },
    });
    this.film.play();
  }

  // --- back button ---------------------------------------------------------------------
  onBack() {
    if (this.exitArmed) return; // the second press leaves the app (nothing re-armed)
    history.pushState({ g: 1 }, '');
    if (this.gameSettings) { if (document.querySelector('.scrim')) document.querySelector('.scrim').click(); else this.router.back(); return; }
    if (this.scene !== this.showcase) { this.scene.pause?.(); return; }
    if (document.querySelector('.scrim')) { document.querySelector('.scrim').click(); return; }
    this.router.back();
  }
  rootBack() {
    if (this.gameSettings) { this.closeGameSettings(); return; }
    const top = this.router.top;
    if (top && top.id !== 'lobby' && top.id !== 'legal') { uiSound('back'); this.router.go('lobby', {}, { root: true }); return; }
    // press back again within two seconds to leave
    toast(t('app.exitHint'));
    this.exitArmed = true;
    history.back();
    setTimeout(() => { if (this.exitArmed) { this.exitArmed = false; history.pushState({ g: 1 }, ''); } }, 2000);
  }

  // --- the performance test (docs §10.27) ---------------------------------------------------
  // the street and the missions are painted behind the lobby on a first start:
  // a mission asked for before they are ready waits, with the progress shown
  whenPainted(then) {
    const R = this.rest;
    if (!R || R.done) return true;
    if (this.waiting) return false;
    const pct = h('span', '0%'), el = h('div.paint-wait.cut', h('b', t('app.painting')), pct);
    document.body.appendChild(el);
    const tick = setInterval(() => { pct.textContent = `${Math.round(R.p * 100)}%`; }, 150);
    this.waiting = true;
    R.promise.then(() => { clearInterval(tick); el.remove(); this.waiting = false; then(); });
    return false;
  }

  runBench() {
    if (this.bench || !this.whenPainted(() => this.runBench())) return;
    this.bench = new Bench(this, (r) => {
      this.bench = null;
      this.router.go('settings', { tab: 'graphics' }, { root: true });
      const text = reportText(r);
      modal({
        kicker: t('bench.kicker'), title: { ok: t('bench.ok'), close: t('bench.close'), slow: t('bench.slow') }[r.verdict],
        body: h('pre.bench-report', text),
        actions: [{ label: t('bench.copy'), kind: 'primary', fn: () => copyText(text) }, { label: t('ui.ok'), kind: 'ghost' }],
      });
    });
    this.bench.start();
  }

  // --- missions --------------------------------------------------------------------------
  startMission(id, { diff = 'normal' } = {}) {
    // the first time: the scene before the mission
    if (STORY[id] && !this.save.d.story.seen[id]) { this.playStory(id, { then: () => this.startMission(id, { diff }) }); return; }
    if (!this.whenPainted(() => this.startMission(id, { diff }))) return;
    const d = this.save.d, op = d.roster.op, lo = d.roster.loadout[op];
    this.router.clear();
    document.body.classList.add('ui-hidden');
    // the tips walk a first player through the controls, in the first mission they play (docs §10.41)
    const coach = !d.tutorial && id !== 'endless';
    this.bindMissionTouch(coach || !d.campaign.m1?.done);
    const scene = new MissionScene(this.e, this.controls, { id, diff, op, loadout: lo, costume: costumeOf(d, op).tint, hud: hudLayout(this.save), coach,
      brief: false, onExit: (r) => this.exitMission(r), onSettings: () => this.openGameSettings(),
      onCoachDone: () => this.save.set((s) => { s.tutorial = true; }) });
    this.inkFor(scene);
    this.scene = scene;
    this.e.camera.viewH = 192;
    this.music.setIntensity(0); this.music.play('mission');
  }
  // the touch controls for a mission (again after the settings changed them)
  bindMissionTouch(hints) {
    if (this.touch) { this.touch.remove(); this.touch = null; }
    const coarse = matchMedia('(pointer: coarse)').matches || new URLSearchParams(location.search).has('touch');
    const d = this.save.d;
    this.touch = coarse ? bindTouch(this.controls, document.querySelector('#hud'), { layout: hudLayout(this.save), fireRing: d.settings.fireRing, hints, onPause: () => this.scene.pause?.() }) : null;
  }

  // the settings from the pause card, over the paused mission; back returns to the card
  openGameSettings() {
    this.gameSettings = true;
    document.body.classList.remove('ui-hidden');
    document.body.classList.add('in-game');
    this.router.go('settings', { tab: 'controls', inGame: true }, { root: true });
  }
  closeGameSettings() {
    this.gameSettings = false;
    this.router.clear();
    document.body.classList.add('ui-hidden');
    document.body.classList.remove('in-game');
    const S = this.scene;
    if (S === this.showcase) return;
    // the layout and the fire ring may have changed
    this.bindMissionTouch(this.touch?.classList.contains('hints'));
    S.abHud?.layout(hudLayout(this.save));
    this.inkFor(S);
    if (S.paused && !S.done) S.pauseCard();
  }

  exitMission(r) {
    const scene = this.scene;
    if (scene === this.showcase) return;
    if (this.gameSettings) { this.gameSettings = false; document.body.classList.remove('in-game'); }
    scene.dispose();
    if (this.touch) { this.touch.remove(); this.touch = null; }
    Object.assign(this.controls, { moveX: 0, up: false, down: false, jump: false, sprint: false, crouch: false, fire: false, touchFire: false, aimHeld: false });
    this.scene = this.showcase;
    this.music.play('lobby');
    document.body.classList.remove('ui-hidden');
    const gain = applyMission(this.save, r.id, r);
    if (r.retry) { this.startMission(r.id, { diff: r.diff }); return; }
    if (r.abandoned && !r.endless) { this.router.go('campaign', { sel: r.id }, { root: true }); return; }
    // the end of the first act, the first time the governor's building falls
    if (r.id === 'm3' && gain.firstClear && !this.save.d.story.seen.act1) { this.playStory('act1', { then: () => this.router.go('result', { r, gain }, { root: true }) }); return; }
    // and of the second, the first time the furnace is lit again (docs §10.31)
    if (r.id === 'm7' && gain.firstClear && !this.save.d.story.seen.act2) { this.playStory('act2', { then: () => this.router.go('result', { r, gain }, { root: true }) }); return; }
    // and of the third, the first time the tower falls: its film (docs §10.44), then the closing card (§10.41)
    if (r.id === 'm10' && gain.firstClear && !this.save.d.story.seen.act3) { this.playStory('act3', { then: () => this.finale(() => this.router.go('result', { r, gain }, { root: true })) }); return; }
    this.router.go('result', { r, gain }, { root: true });
  }

  // The end of the campaign: Ocaksan's flag going back up (docs §10.43), five
  // lines on black, one after another, then on.
  finale(then) {
    this.save.set((d) => { d.story.seen.act3 = true; });
    const lines = [t('finale.l1'), t('finale.l2'), t('finale.flag'), t('finale.l3'), t('finale.l4')].map((x) => h('p', x));
    const go = h('button.btn.primary.cut', { type: 'button' }, t('finale.go'));
    const flag = h('canvas.flag', { width: 180, height: 300, 'aria-hidden': 'true' });
    try { const g = flag.getContext('2d'); g.scale(2, 2); companyFlag(g, 45, 34, 42, 96, { light: -1, tex: false, wall: false }); } catch (e) { console.warn('flag', e); }
    const el = h('div.finale', h('div.box', flag, h('div.eyebrow.accent', t('finale.kicker')), h('h1', t('finale.title')), ...lines, go));
    document.body.appendChild(el);
    const reduce = this.save.d.settings.reduceMotion;
    requestAnimationFrame(() => el.classList.add('on'));
    setTimeout(() => flag.classList.add('on'), reduce ? 0 : 300);
    [...lines, go].forEach((n, i) => setTimeout(() => n.classList.add('on'), reduce ? 0 : 900 + i * 1500));
    this.music.play(null);
    go.addEventListener('click', () => { uiSound('confirm'); el.classList.remove('on'); setTimeout(() => { el.remove(); this.music.play('lobby'); then(); }, 500); });
  }

  update(dt) {
    if (this.bench) this.bench.step(dt);
    // a gamepad: polled in missions; Start pauses and resumes, A takes the card's first button
    if (this.scene !== this.showcase) {
      this.pad = pollPad(this.controls, this.pad);
      if (this.controls.pausePressed) {
        this.controls.pausePressed = false;
        if (!this.gameSettings) { if (this.scene.paused) this.scene.resume?.(); else this.scene.pause?.(); }
      }
      if (this.pad.a && this.scene.paused && !this.gameSettings) { document.querySelector('.mcard:not(.hide) .box button')?.click(); this.controls.jumpPressed = false; }
    }
    this.scene.update(dt);
    // the fight drives the music: share of enemies in combat, eased
    if (this.scene !== this.showcase && this.scene.brains) {
      const b = this.scene.brains, hot = b.length ? b.filter((x) => x.ch.alive && x.state === 'combat').length / Math.min(4, b.length) : 0;
      this.heat = (this.heat || 0) + (Math.min(1, hot) - (this.heat || 0)) * Math.min(1, dt * 1.5);
      this.music.setIntensity(this.heat);
    }
  }
  render(alpha) {
    if (this.bench) { this.scene.render(alpha); this.bench.frame(); return; }
    // the menus are a backdrop: half rate is plenty, and saves battery
    if (this.scene === this.showcase && (this.frame = (this.frame || 0) + 1) % 2 && this.e.loop.hz > 70) return;
    this.scene.render(alpha);
  }
}
