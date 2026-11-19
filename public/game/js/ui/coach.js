// KOR — the first mission's tips (docs §10.41). One short line at a time
// under the objective, each one gone the moment the player has done it: walk,
// aim and fire, jump, reload, an ability, then where the objective is. The
// button a tip talks about pulses. On touch the resting sticks carry their
// labels until the tips are through. "Skip" ends them for good; Settings ›
// Controls brings them back.
import { t } from './i18n.js';
import { keyName } from '../game/input.js';
import { OPS } from './data.js';

export class Coach {
  // scene: the MissionScene; touch: the touch layer (or null); onDone(): the tips are through
  constructor(root, scene, { touch = null, onDone = null } = {}) {
    this.S = scene; this.touch = touch; this.onDone = onDone;
    const K = scene.ctl.keys || {}, k = (a) => keyName(K[a]);
    const op = OPS.find((o) => o.id === scene.opId) || OPS[0];
    const abName = t(`ab.${op.id}.${op.abil[0][0]}`);
    const T = !!touch;
    // each: text, done(scene) → bool, the element to pulse, seconds before it moves on by itself
    this.steps = [
      { text: T ? t('coach.move') : t('coach.moveKeys', { l: k('left'), r: k('right'), s: k('sprint') }), done: (S) => Math.abs(S.mover.x - this.x0) > 70 },
      { text: T ? t('coach.aim') : t('coach.aimMouse'), done: (S) => S.stats.shots - this.shots0 >= 3 },
      { text: t('coach.jump', { b: T ? t('hud.jump') : k('jump') }), done: (S) => this.jumped, hl: '.tbtn.jump', skip: 16 },
      { text: t('coach.reload', { b: T ? t('hud.reload') : k('reload') }), done: (S) => S.player.gun && S.player.gun.state === 'reload', hl: '.tbtn.reload', skip: 14 },
      { text: t('coach.ability', { b: T ? abName : `${abName} (${k('ab1')})` }), done: (S) => S.ab.cd.some((c) => c > 0), hl: '.abtn.ab1', skip: 16 },
      { text: t('coach.objective'), done: () => false, skip: 5 },
    ];
    this.i = -1; this.t = 0; this.okT = 0; this.jumped = false;
    this.x0 = scene.mover.x; this.shots0 = scene.stats.shots;
    this.el = document.createElement('div');
    this.el.className = 'coach';
    this.el.innerHTML = '<div class="k"></div><div class="x"></div><button type="button"></button>';
    const skip = this.el.querySelector('button');
    skip.textContent = t('coach.skip');
    skip.addEventListener('pointerdown', (e) => e.stopPropagation());
    skip.addEventListener('click', (e) => { e.stopPropagation(); this.finish(); });
    root.appendChild(this.el);
    this.next();
  }

  next() {
    this.pulse(false);
    this.i++; this.t = 0; this.okT = 0;
    if (this.i >= this.steps.length) { this.finish(); return; }
    const s = this.steps[this.i];
    this.el.querySelector('.k').textContent = t('coach.kicker', { i: this.i + 1, n: this.steps.length });
    this.el.querySelector('.x').textContent = s.text;
    this.el.classList.remove('ok'); this.el.classList.add('on');
    this.pulse(true);
  }
  pulse(on) {
    const s = this.steps[this.i], sel = s && s.hl;
    if (sel) document.querySelector(sel)?.classList.toggle('pulse', on);
  }

  update(dt) {
    if (this.over) return;
    const S = this.S;
    if (S.mover.ev && S.mover.ev.jump) this.jumped = true;
    // under the boss's health bar when it is up
    if ((this.lowT = (this.lowT || 0) - dt) <= 0) { this.lowT = 0.5; this.el.classList.toggle('low', !!document.querySelector('.mboss.on')); }
    if (!S.started || S.paused || !S.player.alive) return;
    this.t += dt;
    const s = this.steps[this.i];
    if (this.okT > 0) { this.okT -= dt; if (this.okT <= 0) this.next(); return; }
    if (s.done(S) || (s.skip && this.t > s.skip)) { this.el.classList.add('ok'); this.okT = 0.7; S.sfx.ui('tap', 0.5); }
  }

  finish() {
    if (this.over) return;
    this.over = true;
    this.pulse(false);
    this.el.classList.remove('on');
    setTimeout(() => this.el.remove(), 400);
    this.touch?.hints?.(false);
    this.onDone?.();
  }
  remove() { this.over = true; this.pulse(false); this.el.remove(); }
}
