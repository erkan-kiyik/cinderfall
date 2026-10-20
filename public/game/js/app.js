// KOR — the application: menus over a live backdrop, missions,
// the save, settings, the legal gate and the back button.
//
// One engine (renderer, atlas, loop) runs the whole time; `scene` is either
// the Showcase (menus) or a MissionScene. The menus are DOM screens in #ui,
// scaled as a whole with CSS zoom so they keep their composition on every
// screen size.
import { Router } from './ui/router.js';
import { configureKit, toast, ui as uiSound, grain } from './ui/kit.js';
import { setLang, getLang, t } from './ui/i18n.js';
import * as SCREENS from './ui/screens/index.js';
import { hudLayout } from './ui/screens/hudedit.js';
import { Showcase } from './game/showcase.js';
import { MissionScene } from './game/mission.js';
import { bindKeyboard, bindTouch } from './game/input.js';
import { applyMission } from './core/save.js';
import { syncTints, ensureDaily } from './core/economy.js';
import { refreshCur } from './ui/screens/common.js';
import { needsAcceptance } from './legal/consent.js';
import { Music } from './audio/music.js';
import { CinePlayer } from './cine/player.js';
import { PROLOGUE, STORY } from './cine/scenes.js';

const MARKS = { yellow: [1, 0.86, 0.12, 1], blue: [0.2, 0.62, 1, 1], magenta: [1, 0.25, 0.85, 1] };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class App {
  constructor(eng, { save, version, controls, perf, dyn }) {
    this.e = eng; this.save = save; this.version = version; this.controls = controls; this.perf = perf; this.dyn = dyn;
    grain();
    // the economy: the hub's coin counter, the finishes the guns are drawn with, today's tasks
    refreshCur.save = save; syncTints(save.d); ensureDaily(save);
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
    };
    this.router = this.ctx.router = new Router(this.uiRoot, this.ctx, SCREENS);
    this.router.onRootBack = () => this.rootBack();
    // the back button: one guard history entry, re-armed after every press
    history.pushState({ g: 1 }, '');
    addEventListener('popstate', () => this.onBack());
    addEventListener('resize', () => this.fit());
    addEventListener('keydown', (e) => { if (e.code === 'Escape') { if (this.scene !== this.showcase) this.scene.pause?.(); else if (!document.querySelector('.scrim')) this.router.back(); } });
    // the first touch starts the audio
    const unlock = () => eng.sfx.unlock();
    // music: the lobby track until a mission starts; quiet while the app is in the background
    this.music = new Music(eng.sfx);
    this.music.play('lobby');
    document.addEventListener('visibilitychange', () => { const c = eng.sfx.ctx; if (!c) return; if (document.hidden) c.suspend?.(); else c.resume?.(); });
    for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, unlock, { passive: true });
    this.applySettings(true);
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
    if (st.quality !== 'auto' && st.quality !== R.qName) R.setQuality(st.quality);
    R.bloomOn = st.bloom; R.lightsOn = st.lights;
    this.dyn.on = st.dynRes; if (!st.dynRes) { this.dyn.step = 0; R.setDyn(1); }
    if (this.perf && this.perf.visible !== st.fps) this.perf.toggle();
    this.e.sfx.setVolumes(st.vol);
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
    this.film = new CinePlayer(scene, {
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
    if (this.scene !== this.showcase) { this.scene.pause?.(); return; }
    if (document.querySelector('.scrim')) { document.querySelector('.scrim').click(); return; }
    this.router.back();
  }
  rootBack() {
    const top = this.router.top;
    if (top && top.id !== 'lobby' && top.id !== 'legal') { uiSound('back'); this.router.go('lobby', {}, { root: true }); return; }
    // press back again within two seconds to leave
    toast(t('app.exitHint'));
    this.exitArmed = true;
    history.back();
    setTimeout(() => { if (this.exitArmed) { this.exitArmed = false; history.pushState({ g: 1 }, ''); } }, 2000);
  }

  // --- missions --------------------------------------------------------------------------
  startMission(id, { diff = 'normal' } = {}) {
    // the first time: the scene before the mission
    if (STORY[id] && !this.save.d.story.seen[id]) { this.playStory(id, { then: () => this.startMission(id, { diff }) }); return; }
    const d = this.save.d, op = d.roster.op, lo = d.roster.loadout[op];
    this.router.clear();
    document.body.classList.add('ui-hidden');
    const coarse = matchMedia('(pointer: coarse)').matches || new URLSearchParams(location.search).has('touch');
    this.touch = coarse ? bindTouch(this.controls, document.querySelector('#hud'), { layout: hudLayout(this.save), fireRing: d.settings.fireRing }) : null;
    const scene = new MissionScene(this.e, this.controls, { id, diff, op, loadout: lo, brief: false, onExit: (r) => this.exitMission(r) });
    this.inkFor(scene);
    this.scene = scene;
    this.e.camera.viewH = 192;
    this.music.setIntensity(0); this.music.play('mission');
  }

  exitMission(r) {
    const scene = this.scene;
    if (scene === this.showcase) return;
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
    this.router.go('result', { r, gain }, { root: true });
  }

  update(dt) {
    this.scene.update(dt);
    // the fight drives the music: share of enemies in combat, eased
    if (this.scene !== this.showcase && this.scene.brains) {
      const b = this.scene.brains, hot = b.length ? b.filter((x) => x.ch.alive && x.state === 'combat').length / Math.min(4, b.length) : 0;
      this.heat = (this.heat || 0) + (Math.min(1, hot) - (this.heat || 0)) * Math.min(1, dt * 1.5);
      this.music.setIntensity(this.heat);
    }
  }
  render(alpha) {
    // the menus are a backdrop: half rate is plenty, and saves battery
    if (this.scene === this.showcase && (this.frame = (this.frame || 0) + 1) % 2 && this.e.loop.hz > 70) return;
    this.scene.render(alpha);
  }
}
