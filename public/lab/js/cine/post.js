// KOR — cinematics: the film look, applied when the scene buffer goes to the
// screen (docs/KOR_STORY_CINEMATIC.md §5.10), in this order:
//   halation → grade (lifted, slightly cool blacks; warm highlights) →
//   vignette → grain (24 Hz) → gate weave and exposure flicker → lens dirt →
//   2.39:1 bars → fade
import { grainFrames, grimeTexture, canvas, shake, clamp } from './noise.js';

export const ASPECT = 2.39;

export class Post {
  constructor() {
    this.grain = grainFrames(8, 256, 11);
    this.dirt = grimeTexture(512, 256, 21);
    this.small = canvas(8, 8);
    this.grainPat = null;
    this.reduce = false;
  }

  // fit the 2.39:1 picture inside the output (bars where the screen is taller)
  frame(W, H) {
    let w = W, h = W / ASPECT;
    if (h > H) { h = H; w = H * ASPECT; }
    return { x: (W - w) / 2, y: (H - h) / 2, w, h };
  }

  // src: the scene buffer; out: the screen context (W×H device px)
  // p: { grain, lift: [r,g,b], warm, halation, vignette, dirt, fade, flicker, weave }
  apply(out, W, H, src, t, p = {}) {
    const R = this.frame(W, H), red = this.reduce;
    out.save();
    out.setTransform(1, 0, 0, 1, 0, 0);
    out.globalCompositeOperation = 'source-over';
    out.fillStyle = '#000'; out.fillRect(0, 0, W, H);
    // gate weave: the frame shifts a fraction of a pixel 24 times a second
    const ft = Math.floor(t * 24) / 24;
    const wx = red ? 0 : shake(ft, 501, [3.1, 7.7]) * (p.weave ?? 0.35) * (R.w / 1280) * 2;
    const wy = red ? 0 : shake(ft, 502, [2.3, 6.1]) * (p.weave ?? 0.35) * (R.w / 1280) * 2;
    out.beginPath(); out.rect(R.x, R.y, R.w, R.h); out.clip();
    out.imageSmoothingEnabled = true; out.imageSmoothingQuality = 'high';
    // exposure flicker
    const fl = red ? 1 : 1 + shake(ft, 503, [5.3, 11.9]) * (p.flicker ?? 0.015);
    out.filter = fl !== 1 ? `brightness(${fl.toFixed(3)})` : 'none';
    out.drawImage(src, R.x + wx, R.y + wy, R.w, R.h);
    out.filter = 'none';
    // halation: the bright parts, blurred, warm, added
    const hal = p.halation ?? 0.28;
    if (hal > 0) {
      const sw = Math.max(8, Math.round(src.width / 4)), sh = Math.max(8, Math.round(src.height / 4));
      const s = this.small; if (s.width !== sw || s.height !== sh) { s.width = sw; s.height = sh; }
      const g = s.getContext('2d');
      g.globalCompositeOperation = 'source-over';
      g.filter = 'brightness(0.55) contrast(3.2) blur(3px)';
      g.drawImage(src, 0, 0, sw, sh);
      g.filter = 'none';
      g.globalCompositeOperation = 'multiply'; g.fillStyle = '#ffb48a'; g.fillRect(0, 0, sw, sh);
      out.globalCompositeOperation = 'lighter'; out.globalAlpha = hal;
      out.drawImage(s, R.x, R.y, R.w, R.h);
      out.globalAlpha = 1;
    }
    // grade: lift the blacks a little (cool), warm the highlights
    const lift = p.lift || [10, 14, 17];
    out.globalCompositeOperation = 'lighter'; out.fillStyle = `rgb(${lift[0]},${lift[1]},${lift[2]})`; out.fillRect(R.x, R.y, R.w, R.h);
    if (p.warm) { out.globalCompositeOperation = 'soft-light'; out.globalAlpha = p.warm; out.fillStyle = '#ff9a4a'; out.fillRect(R.x, R.y, R.w, R.h); out.globalAlpha = 1; }
    if (p.cool) { out.globalCompositeOperation = 'soft-light'; out.globalAlpha = p.cool; out.fillStyle = '#2e6a80'; out.fillRect(R.x, R.y, R.w, R.h); out.globalAlpha = 1; }
    // vignette
    const v = p.vignette ?? 0.42;
    out.globalCompositeOperation = 'multiply';
    const cx = R.x + R.w / 2, cy = R.y + R.h / 2, rr = Math.hypot(R.w, R.h) / 2;
    const vg = out.createRadialGradient(cx, cy, rr * 0.35, cx, cy, rr);
    vg.addColorStop(0, '#ffffff'); vg.addColorStop(1, `rgb(${Math.round(255 * (1 - v))},${Math.round(255 * (1 - v))},${Math.round(255 * (1 - v))})`);
    out.fillStyle = vg; out.fillRect(R.x, R.y, R.w, R.h);
    // lens dirt, lit by the frame's brightness (cheap: constant, low)
    if (!red && (p.dirt ?? 0.5) > 0) {
      out.globalCompositeOperation = 'screen'; out.globalAlpha = (p.dirt ?? 0.5) * 0.5;
      out.drawImage(this.dirt, R.x, R.y, R.w, R.h); out.globalAlpha = 1;
    }
    // grain, 24 frames a second
    const gr = red ? 0 : p.grain ?? 0.07;
    if (gr > 0) {
      const frame = this.grain[Math.floor(t * 24) % this.grain.length];
      const pat = out.createPattern(frame, 'repeat');
      const scale = Math.max(1, R.w / 1100);
      pat.setTransform(new DOMMatrix().translate(R.x + (Math.floor(t * 24) * 37) % 256, R.y).scale(scale, scale));
      out.globalCompositeOperation = 'overlay'; out.globalAlpha = clamp(gr * 2.2, 0, 1);
      out.fillStyle = pat; out.fillRect(R.x, R.y, R.w, R.h); out.globalAlpha = 1;
    }
    // fade to black
    if (p.fade) { out.globalCompositeOperation = 'source-over'; out.fillStyle = `rgba(0,0,0,${clamp(p.fade)})`; out.fillRect(R.x, R.y, R.w, R.h); }
    out.restore();
    return R;
  }
}
