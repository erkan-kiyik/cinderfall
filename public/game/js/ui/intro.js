// KOR — the opening, on every launch (docs/KOR_STORY_CINEMATIC.md §3).
//
// Five ray-traced plates with what moves drawn live on them (cine/opening.js):
// the cold furnace in the rain, the town from a roof under the searchlight,
// the poster with KOR on it under a failing tube, the alley with steam off
// the grate, and the coals breathing; KOR in their light, the line under it;
// a thin loading line at the foot of the frame. It plays while the sprites
// bake and then hands over to the lobby:
//
//   0.0    black, rain
//   0.8    the furnace · 4.4 the roof · 8.0 the poster · 11.2 the alley
//  14.4    the coals; 15.2 KOR; 16.2 Kül olmadı. Kor kaldı.
//  17.6    earliest hand-off (the coals keep breathing until the bake is done)
//
// A tap or key skips to the end (after a beat, so the launch tap does not);
// the hand-off fades into the lobby, which plays its own entrance. Same
// interface as before: run(), setProgress(), assetsDone(), onHandoff, and the
// harness hook window.__introManual / window.__intro.seek().
import { Opening } from '../cine/opening.js';
import { Post, ASPECT } from '../cine/post.js';
import { canvas } from '../cine/noise.js';
import { t } from './i18n.js';

const MIN_RUN = 17.6, FADE = 0.6, SKIP_AFTER = 0.45, TAG_AT = 16.2;
const TEXT = { loading: () => t('intro.loading'), ready: () => t('intro.ready'), skip: () => t('intro.skip'), tag: () => t('story.tagline') };
const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

export class Intro {
  // opts: { reduce, onHandoff }
  constructor(cv, opts = {}) {
    this.cv = cv; this.g = cv.getContext('2d');
    this.reduce = !!opts.reduce; this.onHandoff = opts.onHandoff || null;
    this.t = 0; this.fadeT = 0; this.done = false; this.ready = false; this.progress = 0; this.handed = false;
    this.min = this.reduce ? 2.2 : MIN_RUN;
    this.tagAt = this.reduce ? 0.8 : TAG_AT;
    this.post = new Post(); this.post.reduce = this.reduce;
    this.shot = null; this.buf = null;
    // a skip jumps to the coals (the last shot), already past the title
    this._skip = () => { if (this.t > SKIP_AFTER && !this.handed && this.t < this.min) { this.t = this.min; this.skipped = true; this.fit(true); } };
    addEventListener('pointerdown', this._skip, { passive: true });
    addEventListener('keydown', this._skip);
    if (window.__introManual) {
      this.manual = true;
      window.__intro = {
        seek: (s) => { this.manual = true; while (this.t < s - 1e-6) this.update(Math.min(1 / 30, s - this.t)); this.draw(); },
        release: () => { this.manual = false; },
      };
    }
  }
  setProgress(p) { this.progress = p; }
  assetsDone() { this.ready = true; }

  run() {
    return new Promise((resolve) => {
      let last = performance.now();
      const tick = (now) => {
        const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
        if (!this.manual) this.update(dt);
        try { this.draw(); } catch (e) { console.error(e); this.done = true; }
        if (this.done) {
          removeEventListener('pointerdown', this._skip); removeEventListener('keydown', this._skip);
          this.cv.remove(); resolve(); return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  // the canvas fills the window; the shot renders into a 2.39:1 buffer below it
  fit(resync = false) {
    if (resync && this.shot) { let x = Math.max(0, this.t - 1.5); while (x < this.t) { const d = Math.min(1 / 30, this.t - x); x += d; this.shot.update(d, x); } }
    const dpr = Math.min(devicePixelRatio || 1, 2), W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr);
    if (this.cv.width !== W || this.cv.height !== H) { this.cv.width = W; this.cv.height = H; }
    const R = this.post.frame(W, H), sw = Math.round(Math.min(1280, R.w * 0.8)), sh = Math.round(sw / ASPECT);
    if (!this.buf || this.buf.width !== sw) {
      this.buf = canvas(sw, sh);
      this.shot = new Opening(); this.shot.init(sw, sh, { reduce: this.reduce });
      // bring the shot on screen up to the present moment (its own clock starts at its cut)
      let x = Math.max(0, this.t - 1.5); while (x < this.t) { const d = Math.min(1 / 30, this.t - x); x += d; this.shot.update(d, x); }
    }
    return { W, H, R, dpr };
  }

  update(dt) {
    this.t += dt;
    if (this.shot) this.shot.update(dt, this.t);
    if (this.t >= this.min && this.ready && !this.manual) {
      if (!this.handed) { this.handed = true; this.onHandoff?.(); }
      this.fadeT += dt;
      if (this.fadeT >= FADE) this.done = true;
    }
  }

  draw() {
    const { W, H, R, dpr } = this.fit(), g = this.g, b = this.buf.getContext('2d'), t = this.t;
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over'; b.filter = 'none';
    b.fillStyle = '#000'; b.fillRect(0, 0, this.buf.width, this.buf.height);
    this.shot.draw(b, t);
    const p = { ...this.shot.post(t) };
    // up from black at the start, down to black at the hand-off
    p.fade = Math.max(1 - ss(0, 0.9, t), ss(0, FADE, this.fadeT));
    this.post.apply(g, W, H, this.buf, t, p);
    // the line under the title, and the loading line at the foot of the frame
    const k = (1 - ss(0, FADE * 0.7, this.fadeT));
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    const ta = ss(this.tagAt, this.tagAt + 0.9, t) * k;
    if (ta > 0) {
      g.font = `400 ${Math.round(12 * dpr)}px Barlow, system-ui, sans-serif`;
      if ('letterSpacing' in g) g.letterSpacing = `${(1.7 * dpr).toFixed(1)}px`;
      g.fillStyle = `rgba(236,226,210,${(0.9 * ta).toFixed(3)})`; g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 8 * dpr;
      g.fillText(TEXT.tag(), W / 2, R.y + R.h * 0.62); g.shadowBlur = 0;
      if ('letterSpacing' in g) g.letterSpacing = '0px';
    }
    const kl = ss(0.6, 1.2, t) * k;
    if (kl > 0) {
      const bw = Math.min(R.w * 0.22, 220 * dpr), bx = W / 2 - bw / 2, by = R.y + R.h - 26 * dpr;
      g.fillStyle = `rgba(236,226,210,${(0.12 * kl).toFixed(3)})`; g.fillRect(bx, by, bw, Math.max(1, dpr));
      g.fillStyle = `rgba(255,150,80,${(0.75 * kl).toFixed(3)})`; g.fillRect(bx, by, bw * (this.ready ? 1 : this.progress), Math.max(1, dpr));
      g.font = `500 ${Math.round(9 * dpr)}px Barlow, system-ui, sans-serif`;
      if ('letterSpacing' in g) g.letterSpacing = `${(1.4 * dpr).toFixed(1)}px`;
      g.fillStyle = `rgba(236,226,210,${(0.45 * kl).toFixed(3)})`;
      g.fillText(this.ready ? TEXT.ready() : `${TEXT.loading()} %${Math.round(this.progress * 100)}`, W / 2, by + 13 * dpr);
      if (t > 1.2) { g.textAlign = 'right'; g.fillStyle = `rgba(236,226,210,${(0.35 * kl).toFixed(3)})`; g.fillText(TEXT.skip(), W - 16 * dpr, H - 16 * dpr); }
    }
    g.restore();
  }
}
