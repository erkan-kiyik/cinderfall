// KOR — cinematics as video (docs/KOR_STORY_CINEMATIC.md §10.17).
//
// The films are drawn ahead of time by the same shots that used to draw them
// live (tools/game/film/render.mjs → assets/film/<id>.mp4), so a phone only
// decodes a video: no per-pixel ground, no thousand rain strokes, no film
// look composited on the screen. What stays live is what depends on the
// player: the sound (the cue sheet, through the game's audio), the subtitles
// and captions in their language, the skip button.
//
// Same interface and options as CinePlayer (play() → Promise, onEnd). If the
// video cannot play (no file, no codec, playback refused) before its first
// frame, the live CinePlayer takes over from the start.
import { CinePlayer } from './player.js';
import { CineAudio } from './audio.js';
import { t as tr } from '../ui/i18n.js';

const ASPECT = 2.39;
export const filmSrc = (id) => new URL(`../../assets/film/${id}.mp4`, import.meta.url).href;

// The film grain: left out of the video (noise is what costs a video its
// bits) and laid over it as it plays, the same noise the live film look used
// (cine/post.js: roughly gaussian, overlay-blended, a new grain 24 times a
// second). One 256² tile in a CSS variable, jumped about by a CSS animation.
let grainUrl = null;
export function filmGrain() {
  if (grainUrl) return;
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data;
  let s = 11; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < S * S; i++) { const v = 128 + ((r() + r() + r()) - 1.5) * 120; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
  grainUrl = c.toDataURL('image/png');
  document.documentElement.style.setProperty('--filmgrain', `url(${grainUrl})`);
}

// the 2.39:1 picture inside the screen (bars where the screen is taller)
export function frameRect(W, H) {
  let w = W, h = W / ASPECT;
  if (h > H) { h = H; w = H * ASPECT; }
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}

export class FilmPlayer {
  // opts: { sfx, reduce, onEnd, skippable, quality }
  constructor(scene, opts = {}) {
    this.S = scene; this.o = opts;
    this.t = 0; this.done = false; this.started = false;
    this.cueI = 0; this.bedI = 0;
  }

  mount() {
    const el = this.el = document.createElement('div');
    el.className = 'cine film';
    el.innerHTML = '<video muted playsinline preload="auto" disablepictureinpicture></video><div class="film-grain"></div><div class="cine-cap"></div><div class="cine-sub"><b></b><span></span></div><button class="cine-skip" type="button"></button>';
    if (this.o.reduce) el.querySelector('.film-grain').remove(); else filmGrain();
    document.body.appendChild(el);
    const v = this.v = el.querySelector('video');
    v.muted = true; v.playsInline = true; v.setAttribute('webkit-playsinline', '');
    v.src = filmSrc(this.S.id);
    this.subEl = el.querySelector('.cine-sub'); this.capEl = el.querySelector('.cine-cap');
    this.skipEl = el.querySelector('.cine-skip'); this.skipEl.textContent = tr('cine.skip');
    this.skipEl.addEventListener('click', (e) => { e.stopPropagation(); this.finish(true); });
    this.resize();
    this._rs = () => this.resize(); addEventListener('resize', this._rs);
    this._vis = () => {
      if (this.done) return;
      if (document.hidden) { v.pause(); this.audio?.c.suspend().catch(() => {}); }
      else { v.play().catch(() => {}); this.audio?.c.resume().catch(() => {}); }
    };
    document.addEventListener('visibilitychange', this._vis);
    const sfx = this.o.sfx;
    if (sfx && sfx.ctx && sfx.master) { try { this.audio = new CineAudio(sfx.ctx, sfx.master); } catch (e) { console.warn(e); } }
  }

  // subtitles sit in the lower bar or just above it
  resize() {
    const W = innerWidth, H = innerHeight, R = frameRect(W, H);
    this.el.style.setProperty('--barH', `${Math.max(0, (H - R.h) / 2)}px`);
    this.el.style.setProperty('--picH', `${R.h}px`);
    this.el.style.setProperty('--picW', `${R.w}px`);
  }

  play() {
    this.mount();
    return new Promise((resolve) => {
      this.resolve = resolve;
      const v = this.v;
      // no picture within a few seconds, or an error before the first frame: play it live
      const giveUp = () => { if (!this.started && !this.done) this.fallback(); };
      v.addEventListener('error', giveUp, { once: true });
      this._wait = setTimeout(giveUp, 6000);
      v.addEventListener('playing', () => { this.started = true; clearTimeout(this._wait); }, { once: true });
      v.play().catch(giveUp);
      const tick = () => {
        if (this.done || this.handed) return;
        if (this.started) this.advance();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  advance() {
    const S = this.S, v = this.v, t0 = this.t;
    this.t = v.currentTime;
    // sound cues and beds that fall in this frame (a jump back never replays them)
    while (this.cueI < S.cues.length && S.cues[this.cueI].at <= this.t) { const c = S.cues[this.cueI++]; if (c.at >= t0 - 0.2) this.audio?.cue(c.name, c.o || {}); }
    while (this.bedI < S.beds.length && S.beds[this.bedI].at <= this.t) { const b = S.beds[this.bedI++]; this.audio?.level(b.name, b.level, b.sec ?? 0.6); if (b.tin !== undefined) this.audio?.tinRoof(b.tin, b.sec ?? 0.6); }
    this.text();
    this.skipEl.classList.toggle('on', this.t > 1 && this.o.skippable !== false);
    if (v.ended || this.t >= S.dur - 0.03) this.finish(false);
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

  // the video will not play here: the live player draws the film instead
  fallback() {
    if (this.handed) return;
    this.handed = true;
    console.warn('film: video unavailable, drawing live', this.S.id);
    clearTimeout(this._wait);
    this.audio?.stop(0);
    this.teardown(true);
    const live = new CinePlayer(this.S, this.o);
    live.play().then((skipped) => this.resolve?.(skipped));
  }

  teardown(now = false) {
    removeEventListener('resize', this._rs); document.removeEventListener('visibilitychange', this._vis);
    const el = this.el, v = this.v;
    v.pause();
    const drop = () => { v.removeAttribute('src'); v.load(); el.remove(); };
    if (now) drop(); else { el.classList.add('out'); setTimeout(drop, 420); }
  }

  finish(skipped) {
    if (this.done || this.handed) return;
    this.done = true;
    clearTimeout(this._wait);
    this.audio?.stop(skipped ? 0.25 : 0.8);
    this.teardown();
    this.o.onEnd?.(skipped);
    this.resolve?.(skipped);
  }
}
