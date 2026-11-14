// KOR — the performance test (docs §10.27). Every frame-rate figure until now
// came from emulated phones; this lets a real phone measure itself. It plays
// thirty seconds of mission 2 (the market raid: the street, the crowd of
// troopers, the hold against three squads) with the operator driven by the
// test (runs on, stops to fight the nearest trooper, cannot die) and the game
// at its own settings, then reports what the phone did. Nothing is saved to
// the career; the report is text to copy and send.
import { MissionScene } from './mission.js';
import { errors } from '../core/errlog.js';
import { t } from '../ui/i18n.js';

const WARM = 3, RUN = 30;

export class Bench {
  constructor(app, done) {
    this.app = app; this.done = done;
    this.t = 0; this.frames = []; this.upd = []; this.rnd = []; this.last = -1;
    this.minDyn = 1; this.minFx = 99; this.q0 = app.e.renderer.qName; this.qLow = this.q0;
  }

  start() {
    const A = this.app, d = A.save.d, op = d.roster.op, lo = d.roster.loadout[op];
    A.router.clear();
    document.body.classList.add('ui-hidden');
    this.scene = new MissionScene(A.e, A.controls, { id: 'm2', diff: 'normal', op, loadout: lo, brief: false, onExit: () => {} });
    A.inkFor?.(this.scene);
    A.scene = this.scene;
    A.e.camera.viewH = 192;
    A.music.play('mission'); A.music.setIntensity(0.6);
    // a label so it is clear the game is playing itself, with the seconds left
    this.tag = document.createElement('div'); this.tag.className = 'bench-tag';
    document.body.appendChild(this.tag); this.shown = -1;
  }

  // before each simulation step: drive the operator, keep them standing
  step(dt) {
    const S = this.scene, P = S.player, c = this.app.controls;
    this.t += dt;
    if (P) { P.hp = P.hpMax; P.alive = true; }
    let near = null, best = 520;
    for (const e of S.enemies || []) if (e.alive) { const dx = e.m.x - S.mover.x; if (Math.abs(dx) < best) { best = Math.abs(dx); near = e; } }
    if (near) {
      S.aimWorld = [near.m.x, near.m.y - 40];
      c.moveX = best > 260 ? Math.sign(near.m.x - S.mover.x) : 0;
      c.fire = true;
    } else { S.aimWorld = null; c.moveX = 1; c.fire = false; }
    c.sprint = false;
    const left = Math.ceil(WARM + RUN - this.t);
    if (left !== this.shown && this.tag) { this.shown = left; this.tag.textContent = `${t('bench.kicker')} · ${left}`; }
    if (this.t >= WARM + RUN) this.finish();
  }

  // after each drawn frame
  frame() {
    const now = performance.now(), L = this.app.e.loop, R = this.app.e.renderer;
    if (this.last >= 0 && this.t > WARM) {
      const k = (L.i - 1 + L.N) % L.N;
      this.frames.push(now - this.last); this.upd.push(L.updMs[k]); this.rnd.push(L.rndMs[k]);
      this.minDyn = Math.min(this.minDyn, R.dyn); this.minFx = Math.min(this.minFx, this.app.e.fxLevel ?? 99);
      if (R.qName !== this.qLow) this.qLow = R.qName;
    }
    this.last = now;
  }

  finish() {
    if (this.over) return; this.over = true;
    const A = this.app, c = A.controls;
    Object.assign(c, { moveX: 0, fire: false, sprint: false });
    this.scene.aimWorld = null;
    this.scene.dispose();
    this.tag?.remove(); this.tag = null;
    A.scene = A.showcase;
    document.body.classList.remove('ui-hidden');
    A.music.play('lobby');
    this.done(this.report());
  }

  report() {
    const A = this.app, R = A.e.renderer, L = A.e.loop, f = this.frames.slice().sort((a, b) => a - b), n = f.length || 1;
    const avg = this.frames.reduce((a, b) => a + b, 0) / n, pct = (p) => f[Math.min(n - 1, Math.floor(n * p))] || 0;
    const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
    const slow = this.frames.filter((x) => x > 20).length / n;
    const ua = navigator.userAgent, model = (ua.match(/Android [^;)]+; ([^;)]+)/) || [])[1] || '';
    const r = {
      build: A.version, when: new Date().toISOString().slice(0, 16).replace('T', ' '),
      device: model || ua.slice(0, 80), gpu: A.dyn?.gpu || '?', cores: navigator.hardwareConcurrency || '?', mem: navigator.deviceMemory || '?',
      screen: `${innerWidth}×${innerHeight} @${(devicePixelRatio || 1).toFixed(2)}`, hz: L.hz, cap: L.cap,
      quality: this.q0 === this.qLow ? this.q0 : `${this.q0} → ${this.qLow}`, res: `${R.rw}×${R.rh}`, minDyn: this.minDyn, minFx: this.minFx === 99 ? '-' : this.minFx,
      frames: this.frames.length, fps: 1000 / avg, low1: 1000 / pct(0.99), p95: pct(0.95), worst: f[n - 1] || 0, slow,
      upd: mean(this.upd), rnd: mean(this.rnd), errors: errors().length,
    };
    r.verdict = r.fps >= Math.min(57, (A.e.loop.cap || 60) - 3) && r.p95 <= 20 ? 'ok' : r.fps >= 45 ? 'close' : 'slow';
    return r;
  }
}

// the report as plain text, to copy and send (diagnostic data: plain English labels)
export function reportText(r) {
  return [
    `KOR performance test · ${r.when} · build ${r.build}`,
    `Device: ${r.device} · GPU: ${r.gpu} · ${r.cores} cores · ${r.mem} GB`,
    `Screen: ${r.screen} · ${r.hz} Hz · cap ${r.cap || 'none'}`,
    `Quality: ${r.quality} · render ${r.res} · lowest dynamic x${r.minDyn.toFixed(2)} · effects ${r.minFx}`,
    `FPS avg ${r.fps.toFixed(1)} · 1% low ${r.low1.toFixed(1)} · p95 ${r.p95.toFixed(1)} ms · worst ${r.worst.toFixed(0)} ms · over 20 ms ${(r.slow * 100).toFixed(1)}%`,
    `CPU: sim ${r.upd.toFixed(2)} ms · draw ${r.rnd.toFixed(2)} ms · ${r.frames} frames · errors logged ${r.errors}`,
  ].join('\n');
}
