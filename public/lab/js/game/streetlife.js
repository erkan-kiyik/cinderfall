// CINDERFALL LAB — street life: everything that moves over the painted street.
//
// Rain with splashes, steam from the manholes and drains, searchlights and
// blinking beacons on the skyline, drones and flying traffic in the haze,
// the Syndicate billboard's scan line, and the neon of the street smeared
// across the wet road. Nothing here is baked: it is a handful of tinted
// sprites a frame, thinned out on low quality and with reduced motion.
import { rgba } from '../gfx/batch.js';
import { col } from '../gfx/particles.js';

// per 600 units of ground (art/env/street.js)
const MANHOLES = [150, 470], DRAINS = [70, 330, 540];
// per 600 units of far / mid layer (their own frames)
const TOWER = [436, -160], CRANE = [151, -160], BILLBOARD = [364, -112];

const RAIN = { low: 80, med: 140, high: 210 };

export class StreetLife {
  constructor(scene) {
    this.s = scene;
    this.cap = RAIN.high;
    this.drops = new Float32Array(this.cap * 3); // x, y, speed
    this.seeded = false; this.splash = []; this.last = null; this.steamAt = 0;
  }
  get reduce() { return !!this.s.e.reduceMotion; }
  get count() {
    const n = RAIN[this.s.e.renderer.qName] || RAIN.high;
    return this.reduce ? Math.round(n * 0.35) : n;
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
    // splashes live a fifth of a second
    let k = 0;
    for (let i = 0; i < this.splash.length; i += 3) if (t - this.splash[i + 2] < 0.2) { this.splash[k++] = this.splash[i]; this.splash[k++] = this.splash[i + 1]; this.splash[k++] = this.splash[i + 2]; }
    this.splash.length = k;
    // steam from the manholes and drains in view
    if (t >= this.steamAt && !this.reduce) {
      this.steamAt = t + 0.09;
      const dust = this.s.dust;
      for (let base = Math.floor(L / 600) * 600; base < R; base += 600) {
        for (const mx of MANHOLES) { const x = base + mx; if (x > L && x < R && Math.random() < 0.8) dust.emit(t, x + (Math.random() - 0.5) * 8, 30, (Math.random() - 0.3) * 5, -12 - Math.random() * 6, 2.2 + Math.random() * 0.8, 3, 14, col('#aeb8d0', 0.17), col('#aeb8d0', 0), -2, 0.5, Math.random() * 6, 0.3); }
        for (const dx of DRAINS) { const x = base + dx + 5; if (x > L && x < R && Math.random() < 0.35) dust.emit(t, x + (Math.random() - 0.5) * 6, 7, (Math.random() - 0.3) * 4, -9 - Math.random() * 5, 1.6 + Math.random() * 0.6, 2, 9, col('#aeb8d0', 0.13), col('#aeb8d0', 0), -2, 0.5, Math.random() * 6, 0.3); }
      }
    }
  }

  // behind the street, in the far layer's frame: searchlights, beacons, flying traffic
  drawFar(B, view, A, t, kMax) {
    const beam = A.get('fx.beam'), glow = A.get('fx.glow');
    B.begin(view); B.setBlend(1);
    for (let k = -2; k < kMax; k++) {
      const ox = k * 600;
      // two searchlights from the Tower, sweeping out of step
      for (let j = 0; j < 2; j++) {
        const a = -Math.PI / 2 + Math.sin(t * (0.32 + j * 0.11) + k * 1.7 + j * 2.4) * 0.95, len = 200;
        const bx = ox + TOWER[0], by = TOWER[1];
        B.line(beam, bx, by, bx + Math.cos(a) * len, by + Math.sin(a) * len, 74, rgba('#d8e6ff', 0.2));
      }
      // beacons blinking on the Tower and the crane
      const on = (t + k * 0.37) % 1.6 < 0.18;
      B.draw(glow, ox + 436, -176, on ? 3 : 1.6, on ? 3 : 1.6, 0, rgba('#ff3347', on ? 0.9 : 0.35));
      const on2 = (t + 0.8 + k * 0.21) % 1.9 < 0.16;
      B.draw(glow, ox + CRANE[0], CRANE[1], on2 ? 2.4 : 1.2, on2 ? 2.4 : 1.2, 0, rgba('#ff3347', on2 ? 0.85 : 0.3));
      // flying traffic on two lanes: headlights one way, tail lights the other
      for (let i = 0; i < 4; i++) {
        const dir = i % 2 ? 1 : -1, lane = i % 2 ? -138 : -126, sp = 34 + i * 7;
        const x = ox + ((((dir * t * sp + i * 173) % 640) + 640) % 640) - 20;
        const c = dir > 0 ? '#fff1d6' : '#ff4a5a';
        B.draw(glow, x, lane + Math.sin(t * 0.9 + i) * 1.2, 1.4, 0.6, 0, rgba(c, 0.8));
        B.draw(glow, x - dir * 2.6, lane + Math.sin(t * 0.9 + i) * 1.2, 1.1, 0.5, 0, rgba(c, 0.45));
      }
    }
    B.setBlend(0); B.end();
  }

  // in the mid layer's frame: drones with blinking lights and scan cones, the billboard
  drawMid(B, view, A, t, kMax) {
    const glow = A.get('fx.glow'), dot = A.get('fx.dot'), beam = A.get('fx.beam');
    B.begin(view);
    for (let k = -2; k < kMax; k++) {
      const ox = k * 600;
      for (let j = 0; j < 3; j++) {
        const sp = 18 + j * 9, dir = j === 1 ? -1 : 1;
        const x = ox + ((((dir * t * sp + j * 211 + k * 97) % 700) + 700) % 700) - 50, y = -150 + j * 13 + Math.sin(t * 1.3 + j * 2) * 2.2;
        B.draw(dot, x, y, 3.8, 1.25, 0, rgba('#0a0d13', 0.95));
        B.draw(dot, x - 3.4, y - 1.1, 1.6, 0.45, 0, rgba('#0a0d13', 0.95)); B.draw(dot, x + 3.4, y - 1.1, 1.6, 0.45, 0, rgba('#0a0d13', 0.95));
      }
    }
    B.setBlend(1);
    for (let k = -2; k < kMax; k++) {
      const ox = k * 600;
      for (let j = 0; j < 3; j++) {
        const sp = 18 + j * 9, dir = j === 1 ? -1 : 1;
        const x = ox + ((((dir * t * sp + j * 211 + k * 97) % 700) + 700) % 700) - 50, y = -150 + j * 13 + Math.sin(t * 1.3 + j * 2) * 2.2;
        const on = (t * 1.4 + j * 0.33) % 1 < 0.16;
        B.draw(glow, x + 3.2 * dir, y, on ? 3.4 : 1.4, on ? 3.4 : 1.4, 0, rgba(j === 1 ? '#3ee8e0' : '#ff3347', on ? 1 : 0.55));
        if (j === 2) B.line(beam, x, y + 1, x + Math.sin(t * 0.8) * 12, y + 50, 26, rgba('#bfe8ff', 0.14));
      }
      // searchlights from the works' stacks, closer and slower
      const sa = -Math.PI / 2 + Math.sin(t * 0.27 + k * 2.3) * 1.0;
      B.line(beam, ox + 126, -134, ox + 126 + Math.cos(sa) * 170, -134 + Math.sin(sa) * 170, 60, rgba('#ffe6c8', 0.13));
      // the billboard: a scan line rolling down, the odd glitch
      const bx = ox + BILLBOARD[0];
      B.draw(glow, bx, -128 + ((t * 13 + k * 7) % 32), 46, 0.9, 0, rgba('#ffd6dc', 0.32));
      const glitch = (t + k * 1.3) % 7.3 > 7.05;
      B.draw(glow, bx, BILLBOARD[1], 54, 22, 0, rgba('#ff3347', glitch ? 0.3 : 0.08 + Math.sin(t * 2) * 0.03));
    }
    B.setBlend(0); B.end();
  }

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
    B.setBlend(0); B.end();
  }

  // emissive: the street's lights smeared down the wet road (call with additive blending on)
  reflect(B, glow, t, x, sx, c, a) {
    const sh = 0.8 + 0.2 * Math.sin(t * 3.1 + x * 0.07), w = Math.max(4, Math.min(sx, 36));
    B.draw(glow, x, 20, w * 0.8, 12, 0, rgba(c, Math.min(1, a * 1.1 * sh)));
    B.draw(glow, x, 13, w * 0.55, 4.5, 0, rgba(c, Math.min(1, a * 0.9 * sh)));
    B.draw(glow, x + Math.sin(t * 1.7 + x) * 0.6, 24, Math.max(1.2, w * 0.14), 16, 0, rgba(c, Math.min(1, a * 0.8 * sh)));
  }
}
