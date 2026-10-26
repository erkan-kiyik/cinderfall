// KOR — the opening as video (docs/KOR_STORY_CINEMATIC.md §3, §10.17).
//
// The launch film is drawn ahead of time (assets/film/opening.mp4, the same
// shots as cine/opening.js) and the coals with KOR over them as a seamless
// loop (opening_loop.mp4) for as long as the sprites are still baking. The
// phone only decodes video while the bake has the processor to itself. The
// tagline, the loading line and the skip hint are DOM over the picture.
//
// Same interface as Intro (ui/intro.js): run(), setProgress(), assetsDone(),
// onHandoff. If the video does not start, the live Intro takes over.
import { Intro } from './intro.js';
import { filmSrc, filmGrain } from '../cine/film.js';
import { t } from './i18n.js';

const MIN_RUN = 17.6, FADE = 0.6, SKIP_AFTER = 0.45, TAG_AT = 16.2;
const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

export class IntroVideo {
  // opts: { reduce, onHandoff }
  constructor(opts = {}) {
    this.o = opts; this.reduce = !!opts.reduce; this.onHandoff = opts.onHandoff || null;
    this.ready = false; this.progress = 0; this.handed = false; this.done = false;
    this.min = this.reduce ? 2.2 : MIN_RUN; this.tagAt = this.reduce ? 0.8 : TAG_AT;
    this.loopT0 = -1; this.fadeT0 = -1;
  }
  setProgress(p) { this.progress = p; this.live?.setProgress(p); }
  assetsDone() { this.ready = true; this.live?.assetsDone(); }

  mount() {
    const el = this.el = document.createElement('div');
    el.id = 'intro'; el.className = 'intro-film';
    el.innerHTML = '<video class="a" muted playsinline preload="auto" disablepictureinpicture></video>'
      + '<video class="b" muted playsinline loop preload="auto" disablepictureinpicture></video>'
      + (this.reduce ? '' : '<div class="film-grain"></div>')
      + '<div class="tag"></div><div class="load"><i><b></b></i><span></span></div><div class="skip"></div>';
    document.body.appendChild(el);
    if (!this.reduce) filmGrain();
    this.a = el.querySelector('.a'); this.b = el.querySelector('.b');
    for (const v of [this.a, this.b]) { v.muted = true; v.playsInline = true; v.setAttribute('webkit-playsinline', ''); }
    this.a.src = filmSrc('opening'); this.b.src = filmSrc('opening_loop');
    this.tagEl = el.querySelector('.tag'); this.tagEl.textContent = t('story.tagline');
    this.loadEl = el.querySelector('.load'); this.fillEl = el.querySelector('.load b'); this.labEl = el.querySelector('.load span');
    this.skipEl = el.querySelector('.skip'); this.skipEl.textContent = t('intro.skip');
  }

  run() {
    this.mount();
    // a skip goes to the coals (the loop), already past the title
    this._skip = () => { if (this.t0 && (performance.now() - this.t0) / 1000 > SKIP_AFTER && !this.handed && this.loopT0 < 0) this.toLoop(); };
    addEventListener('pointerdown', this._skip, { passive: true });
    addEventListener('keydown', this._skip);
    return new Promise((resolve) => {
      this.resolve = resolve;
      const first = this.reduce ? this.b : this.a;
      const giveUp = () => { if (!this.started && !this.live) this.fallback(); };
      first.addEventListener('error', giveUp, { once: true });
      this._wait = setTimeout(giveUp, 4000);
      first.addEventListener('playing', () => { this.started = true; this.t0 = performance.now(); if (this.reduce) this.loopT0 = this.t0; clearTimeout(this._wait); }, { once: true });
      // reduced motion: only the coals, still (as the live intro does)
      if (this.reduce) { this.a.removeAttribute('src'); this.b.classList.add('on'); this.b.play().catch(giveUp); }
      else { this.a.classList.add('on'); this.a.play().catch(giveUp); this.b.load(); }
      this.a.addEventListener('ended', () => this.toLoop());
      const tick = () => {
        if (this.done || this.live) return;
        if (this.started) this.frame();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  // the film's clock: the first video's time, then the minimum plus however long the loop has run
  now() {
    if (this.loopT0 >= 0) return (this.reduce ? 0 : this.min) + (performance.now() - this.loopT0) / 1000;
    return this.a.currentTime;
  }

  toLoop() {
    if (this.loopT0 >= 0 || this.live) return;
    this.loopT0 = performance.now();
    this.b.currentTime = 0;
    this.b.play().catch(() => {});
    this.b.classList.add('on');
    setTimeout(() => { this.a.classList.remove('on'); this.a.pause(); }, 400);
  }

  frame() {
    const tt = this.now(), el = this.el;
    // hand off once the bake is done and the film has run its minimum (or was skipped)
    if (!this.handed && this.ready && (tt >= this.min || (this.loopT0 >= 0 && !this.reduce))) {
      this.handed = true; this.fadeT0 = performance.now();
      this.onHandoff?.();
      el.classList.add('out');
      setTimeout(() => this.end(), FADE * 1000 + 50);
    }
    const k = this.fadeT0 >= 0 ? 1 - ss(0, FADE * 0.7, (performance.now() - this.fadeT0) / 1000) : 1;
    const ta = (this.loopT0 >= 0 && !this.reduce ? 1 : ss(this.tagAt, this.tagAt + 0.9, tt)) * k;
    this.tagEl.style.opacity = ta.toFixed(3);
    const kl = ss(0.6, 1.2, tt) * k;
    this.loadEl.style.opacity = kl.toFixed(3);
    this.fillEl.style.width = `${(this.ready ? 100 : this.progress * 100).toFixed(1)}%`;
    const lab = this.ready ? t('intro.ready') : `${t('intro.loading')} %${Math.round(this.progress * 100)}`;
    if (lab !== this._lab) { this._lab = lab; this.labEl.textContent = lab; }
    this.skipEl.style.opacity = (tt > 1.2 && !this.handed ? kl : 0).toFixed(3);
  }

  // the video will not play here: the live intro (drawn on a canvas) instead
  fallback() {
    console.warn('intro: video unavailable, drawing live');
    clearTimeout(this._wait);
    this.cleanup();
    const cv = document.createElement('canvas'); cv.id = 'intro'; document.body.appendChild(cv);
    const live = this.live = new Intro(cv, { reduce: this.reduce, onHandoff: () => this.onHandoff?.() });
    live.setProgress(this.progress); if (this.ready) live.assetsDone();
    live.run().then(() => this.resolve?.());
  }

  cleanup() {
    removeEventListener('pointerdown', this._skip); removeEventListener('keydown', this._skip);
    for (const v of [this.a, this.b]) { v.pause(); v.removeAttribute('src'); v.load(); }
    this.el.remove();
  }

  end() {
    if (this.done) return;
    this.done = true;
    this.cleanup();
    this.resolve?.();
  }
}
