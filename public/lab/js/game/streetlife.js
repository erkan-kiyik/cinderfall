// KOR LAB — street life: everything that moves over the painted street.
//
// Rain with splashes, boots in the water, steam from the manholes and drains,
// and the street's lamps, bulbs and fires mirrored in the wet road. Nothing
// in the sky moves or blinks: the city is rationed and dark. Nothing here is
// baked: it is a handful of tinted sprites a frame, thinned out on low
// quality and with reduced motion.
import { rgba } from '../gfx/batch.js';
import { col } from '../gfx/particles.js';

// per 600 units of ground (art/env/street.js)
const MANHOLES = [150, 470], DRAINS = [70, 330, 540];

const RAIN = { low: 80, med: 140, high: 210 };

export class StreetLife {
  constructor(scene) {
    this.s = scene;
    this.cap = RAIN.high;
    this.drops = new Float32Array(this.cap * 3); // x, y, speed
    this.seeded = false; this.splash = []; this.steps = []; this.last = null; this.steamAt = 0;
  }
  get reduce() { return !!this.s.e.reduceMotion; }
  // set by the frame-time guard in boot.js: 2 full, 1 lighter, 0 bare
  get level() { const l = this.s.e.fxLevel; return l === undefined ? 2 : l; }
  get count() {
    const n = RAIN[this.s.e.renderer.qName] || RAIN.high;
    const lvl = this.level;
    return Math.round(n * (this.reduce ? 0.35 : 1) * (lvl === 2 ? 1 : lvl === 1 ? 0.55 : 0.2));
  }

  // advance by the scene clock (works for scenes that do not call it from update)
  step(t, cam) {
    const dt = this.last === null ? 0 : Math.min(0.05, Math.max(0, t - this.last));
    this.last = t;
    const L = cam.x - cam.viewW / 2 - 40, R = cam.x + cam.viewW / 2 + 40, top = cam.y - cam.viewH / 2 - 30, W = R - L;
    const d = this.drops;
    if (!this.seeded) {
      for (let i = 0; i < this.cap; i++) { d[i * 3] = L + Math.random() * W; d[i * 3 + 1] = top + Math.random() * (40 - top); d[i * 3 + 2] = 290 + Math.random() * 110; }
      this.seeded = true;
    }
    const n = this.count;
    for (let i = 0; i < n; i++) {
      const o = i * 3;
      d[o + 1] += d[o + 2] * dt; d[o] += d[o + 2] * dt * 0.16;
      // each drop ends somewhere between the pavement and the near kerb of the road
      const floor = (i % 9) * 3.6;
      if (d[o + 1] > floor) {
        if (this.splash.length < 48 && i % 2 === 0) this.splash.push(d[o], floor, t);
        d[o] = L + Math.random() * W; d[o + 1] = top - Math.random() * 40;
      }
      if (d[o] > R) d[o] -= W; else if (d[o] < L) d[o] += W;
    }
    // a boot's splash lasts a third of a second
    let j = 0;
    for (let i = 0; i < this.steps.length; i += 3) if (t - this.steps[i + 2] < 0.32) { this.steps[j++] = this.steps[i]; this.steps[j++] = this.steps[i + 1]; this.steps[j++] = this.steps[i + 2]; }
    this.steps.length = j;
    // splashes live a fifth of a second
    let k = 0;
    for (let i = 0; i < this.splash.length; i += 3) if (t - this.splash[i + 2] < 0.2) { this.splash[k++] = this.splash[i]; this.splash[k++] = this.splash[i + 1]; this.splash[k++] = this.splash[i + 2]; }
    this.splash.length = k;
    // steam from the manholes and drains in view
    if (t >= this.steamAt && !this.reduce && this.level > 0) {
      this.steamAt = t + 0.09;
      const dust = this.s.dust;
      for (let base = Math.floor(L / 600) * 600; base < R; base += 600) {
        for (const mx of MANHOLES) { const x = base + mx; if (x > L && x < R && Math.random() < 0.8) dust.emit(t, x + (Math.random() - 0.5) * 8, 30, (Math.random() - 0.3) * 5, -12 - Math.random() * 6, 2.2 + Math.random() * 0.8, 3, 14, col('#aeb8d0', 0.17), col('#aeb8d0', 0), -2, 0.5, Math.random() * 6, 0.3); }
        for (const dx of DRAINS) { const x = base + dx + 5; if (x > L && x < R && Math.random() < 0.35) dust.emit(t, x + (Math.random() - 0.5) * 6, 7, (Math.random() - 0.3) * 4, -9 - Math.random() * 5, 1.6 + Math.random() * 0.6, 2, 9, col('#aeb8d0', 0.13), col('#aeb8d0', 0), -2, 0.5, Math.random() * 6, 0.3); }
      }
    }
  }

  // a boot coming down on the wet street at (x, y)
  kick(x, y) { if (this.level > 0 && this.steps.length < 36 && this.last !== null) this.steps.push(x, y, this.last); }

  // in the world, over the props and characters: the rain and its splashes
  drawRain(B, view, A) {
    const tr = A.get('fx.tracer'), dot = A.get('fx.dot');
    const d = this.drops, n = this.count;
    B.begin(view); B.setBlend(1);
    for (let i = 0; i < n; i++) {
      const o = i * 3, x = d[o], y = d[o + 1], s = d[o + 2] * 0.03;
      B.line(tr, x - s * 0.16, y - s, x, y, 0.36, rgba('#c4d6f2', 0.4));
    }
    const sp = this.splash, t = this.last;
    for (let i = 0; i < sp.length; i += 3) {
      const k = (t - sp[i + 2]) / 0.2;
      B.draw(dot, sp[i], sp[i + 1], 0.6 + k * 1.8, 0.25 + k * 0.4, 0, rgba('#d6e4ff', 0.45 * (1 - k)));
    }
    // boots in the water: a flat ring spreading and a spray of drops thrown up and out
    const st = this.steps;
    for (let i = 0; i < st.length; i += 3) {
      const a = t - st[i + 2], k = a / 0.32, x = st[i], y = st[i + 1];
      B.draw(dot, x, y + 0.3, 2 + k * 6, 0.6 + k * 0.8, 0, rgba('#c8d8f0', 0.75 * (1 - k)));
      B.draw(dot, x, y + 0.2, 1.2 + k * 2, 0.5, 0, rgba('#eef4ff', 0.6 * (1 - k) * (1 - k)));
      for (let q = 0; q < 8; q++) {
        const dir = (q - 3.5) / 3.5, vx = dir * (24 + (q * 37 % 13)), vy = 36 + (q * 53 % 19);
        const px = x + vx * a, py = y - (vy * a - 170 * a * a);
        if (py > y) continue;
        B.draw(dot, px, py, 0.5, 0.5, 0, rgba('#e2ecff', 0.85 * (1 - k)));
      }
    }
    B.setBlend(0); B.end();
  }

  // emissive: the street's lights smeared down the wet road (call with additive blending on)
  reflect(B, glow, t, x, sx, c, a) {
    if (this.level === 0) return;
    const sh = 0.8 + 0.2 * Math.sin(t * 3.1 + x * 0.07), w = Math.max(4, Math.min(sx, 36));
    B.draw(glow, x, 20, w * 0.8, 12, 0, rgba(c, Math.min(1, a * 1.1 * sh)));
    B.draw(glow, x, 13, w * 0.55, 4.5, 0, rgba(c, Math.min(1, a * 0.9 * sh)));
    B.draw(glow, x + Math.sin(t * 1.7 + x) * 0.6, 24, Math.max(1.2, w * 0.14), 16, 0, rgba(c, Math.min(1, a * 0.8 * sh)));
  }
}
