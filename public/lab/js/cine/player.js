// KOR — cinematics: the player. One full-screen canvas, a scene buffer at
// 2.39:1, the film look on the way out, subtitles and captions in the DOM,
// a skip button after a second, the cue sheet for sound.
//
// A scene: { id, dur, shots: [{ at, dur, make() }], subs: [{ at, to, who, key }],
//            caps: [{ at, to, key, pos }], cues: [{ at, name, o }],
//            beds: [{ at, name, level, sec }] }
// A shot (from make()): { init(W, H, env), update(dt, t), draw(g, t), post(t) }
import { Post, ASPECT } from './post.js';
import { CineAudio } from './audio.js';
import { canvas } from './noise.js';
import { t as tr } from '../ui/i18n.js';

export class CinePlayer {
  // opts: { sfx, reduce, onEnd, skippable, quality }
  constructor(scene, opts = {}) {
    this.S = scene; this.o = opts;
    this.t = 0; this.done = false; this.paused = false;
    this.post = new Post(); this.post.reduce = !!opts.reduce;
    this.shots = scene.shots.map((s) => ({ ...s, inst: null }));
    this.cueI = 0; this.bedI = 0;
  }

  mount() {
    const el = this.el = document.createElement('div');
    el.className = 'cine';
    el.innerHTML = '<canvas></canvas><div class="cine-cap"></div><div class="cine-sub"><b></b><span></span></div><button class="cine-skip" type="button"></button>';
    document.body.appendChild(el);
    this.cv = el.querySelector('canvas'); this.out = this.cv.getContext('2d');
    this.subEl = el.querySelector('.cine-sub'); this.capEl = el.querySelector('.cine-cap');
    this.skipEl = el.querySelector('.cine-skip'); this.skipEl.textContent = tr('cine.skip');
    this.skipEl.addEventListener('click', (e) => { e.stopPropagation(); this.finish(true); });
    this.resize();
    this._rs = () => this.resize(); addEventListener('resize', this._rs);
    this._vis = () => { this.paused = document.hidden; if (this.audio) (document.hidden ? this.audio.c.suspend() : this.audio.c.resume()).catch(() => {}); };
    document.addEventListener('visibilitychange', this._vis);
    // sound: the game's audio context, through the master volume
    const sfx = this.o.sfx;
    if (sfx && sfx.ctx && sfx.master) { try { this.audio = new CineAudio(sfx.ctx, sfx.master); } catch (e) { console.warn(e); } }
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr);
    this.cv.width = W; this.cv.height = H;
    const R = this.post.frame(W, H);
    // the scene renders below the screen's size: softer, faster
    const q = this.o.quality === 'low' ? 0.55 : this.o.quality === 'med' ? 0.7 : 0.8;
    const sw = Math.round(Math.min(1280, R.w * q)), sh = Math.round(sw / ASPECT);
    if (!this.buf || this.buf.width !== sw) {
      this.buf = canvas(sw, sh); this.g = this.buf.getContext('2d');
      for (const s of this.shots) s.inst = null; // re-made at the new size
    }
    // subtitles sit in the lower bar or just above it
    this.el.style.setProperty('--barH', `${Math.max(0, (H - R.h) / 2 / dpr)}px`);
    this.el.style.setProperty('--picH', `${R.h / dpr}px`);
  }

  shotAt(t) {
    for (let i = this.shots.length - 1; i >= 0; i--) if (t >= this.shots[i].at) return this.shots[i];
    return this.shots[0];
  }
  ensure(s) {
    if (!s.inst) { s.inst = s.make(); s.inst.init(this.buf.width, this.buf.height, { audio: this.audio, reduce: this.o.reduce }); s.local = 0; }
    return s.inst;
  }

  play() {
    this.mount();
    return new Promise((resolve) => {
      this.resolve = resolve;
      let last = performance.now();
      const tick = (now) => {
        if (this.done) return;
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
        if (!this.paused && !this.manual) this.advance(dt);
        this.render();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  advance(dt) {
    const S = this.S, t0 = this.t;
    this.t += dt;
    // sound cues and beds that fall in this frame
    while (this.cueI < S.cues.length && S.cues[this.cueI].at <= this.t) { const c = S.cues[this.cueI++]; if (c.at >= t0 - 0.2) this.audio?.cue(c.name, c.o || {}); }
    while (this.bedI < S.beds.length && S.beds[this.bedI].at <= this.t) { const b = S.beds[this.bedI++]; this.audio?.level(b.name, b.level, b.sec ?? 0.6); if (b.tin !== undefined) this.audio?.tinRoof(b.tin, b.sec ?? 0.6); }
    const s = this.shotAt(this.t), inst = this.ensure(s);
    // shots before this one are dropped; the next one is made a beat early
    for (const o of this.shots) if (o !== s && o.inst && (o.at + o.dur < this.t - 0.5)) o.inst = null;
    const next = this.shots[this.shots.indexOf(s) + 1];
    if (next && next.at - this.t < 1.2) { const ni = this.ensure(next); ni.prepare?.(5); }
    const local = this.t - s.at;
    inst.update(Math.max(0, Math.min(dt, local)), local);
    s.local = local;
    if (this.t >= S.dur) this.finish(false);
  }

  render() {
    const s = this.shotAt(this.t), inst = this.ensure(s), local = this.t - s.at;
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
    g.fillStyle = '#000'; g.fillRect(0, 0, this.buf.width, this.buf.height);
    inst.draw(g, local);
    const p = { ...(inst.post ? inst.post(local) : {}) };
    // short fades to black where the cut list asks for them
    const fade = this.S.fades ? this.S.fades.reduce((a, f) => Math.max(a, this.t >= f.at && this.t <= f.at + f.dur ? 1 - Math.abs((this.t - f.at) / f.dur * 2 - 1) : 0), 0) : 0;
    p.fade = Math.max(p.fade || 0, fade);
    this.post.apply(this.out, this.cv.width, this.cv.height, this.buf, this.t, p);
    this.text();
    this.skipEl.classList.toggle('on', this.t > 1 && this.o.skippable !== false);
  }

  text() {
    const t = this.t, sub = this.S.subs.find((x) => t >= x.at && t <= x.to), cap = this.S.caps.find((x) => t >= x.at && t <= x.to);
    const key = sub ? sub.key : '';
    if (key !== this._sub) {
      this._sub = key;
      this.subEl.classList.toggle('on', !!sub);
      if (sub) { this.subEl.querySelector('b').textContent = sub.who || ''; this.subEl.querySelector('span').textContent = tr(sub.key); this.subEl.classList.toggle('radio', !!sub.radio); }
    }
    const ck = cap ? cap.key : '';
    if (ck !== this._cap) {
      this._cap = ck;
      this.capEl.classList.toggle('on', !!cap);
      if (cap) { this.capEl.textContent = tr(cap.key); this.capEl.dataset.pos = cap.pos || 'bl'; }
    }
  }

  finish(skipped) {
    if (this.done) return;
    this.done = true;
    this.audio?.stop(skipped ? 0.25 : 0.8);
    removeEventListener('resize', this._rs); document.removeEventListener('visibilitychange', this._vis);
    const el = this.el;
    el.classList.add('out');
    setTimeout(() => el.remove(), 420);
    this.o.onEnd?.(skipped);
    this.resolve?.(skipped);
  }

  // harness: jump to a time (shots are re-run from their start at 30 Hz)
  seek(t) {
    this.manual = true;
    const s = this.shotAt(t); s.inst = null; const inst = this.ensure(s);
    const local = t - s.at;
    let x = 0; while (x < local - 1e-6) { const d = Math.min(1 / 30, local - x); x += d; inst.update(d, x); }
    this.t = t; this.render();
  }
}
