// KOR LAB — the opening.
//
// Plays while the art bakes, then hands over to the lobby. Pure light on
// black, nothing from the game's own art:
//
//   0.00  one ember in the dark, breathing
//   0.45  it splits into a neon horizon that runs out to both edges
//   0.70  a perspective grid rolls toward you under it, rain falls
//   1.05  five visor lights ignite along the horizon, one colour each
//   1.60  K, O, R are drawn in neon tube, one stroke at a time, and flicker on
//   2.70  a pulse leaves the title, the tagline appears
//   3.30  earliest hand-off (waits for the bake if it is still running)
//
// A tap or key skips (after a beat, so the launch tap does not); the hand-off
// fades into the lobby, which plays its own entrance.
import { t } from './i18n.js';

const MIN_RUN = 3.3, FADE = 0.55, SKIP_AFTER = 0.45;
const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const TEXT = { loading: () => t('intro.loading'), ready: () => t('intro.ready'), skip: () => t('intro.skip') };
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

// the five lights, left to right: [x across the horizon 0..1, colour, ignition time]
const VISORS = [
  [0.17, [255, 122, 53], 1.05], [0.335, [62, 232, 224], 1.18], [0.5, [196, 168, 255], 1.31],
  [0.665, [143, 208, 255], 1.44], [0.83, [255, 201, 60], 1.57],
];

// neon tube letters on a 0..1 box: polylines, drawn in order
const arc = (cx, cy, rx, ry, a0, a1, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * (i / n); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
const LETTERS = {
  K: { w: 0.7, strokes: [[[0, 0], [0, 1]], [[0.7, 0], [0.02, 0.56]], [[0.22, 0.4], [0.72, 1]]] },
  O: { w: 0.86, strokes: [arc(0.43, 0.5, 0.43, 0.5, -Math.PI / 2, Math.PI * 1.5, 28)] },
  R: { w: 0.72, strokes: [[[0, 1], [0, 0], [0.4, 0], ...arc(0.4, 0.26, 0.3, 0.26, -Math.PI / 2, Math.PI / 2, 10), [0, 0.52]], [[0.3, 0.52], [0.72, 1]]] },
};
const lengthOf = (p) => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; };

export class Intro {
  // opts: { reduce, onHandoff }
  constructor(canvas, opts = {}) {
    this.cv = canvas; this.g = canvas.getContext('2d');
    this.reduce = !!opts.reduce; this.onHandoff = opts.onHandoff || null;
    this.t = 0; this.fadeT = 0; this.done = false; this.ready = false; this.progress = 0; this.handed = false;
    this.min = this.reduce ? 1.4 : MIN_RUN;
    this.embers = [];
    this._skip = () => { if (this.t > SKIP_AFTER && !this.handed) this.t = Math.max(this.t, this.min); };
    addEventListener('pointerdown', this._skip, { passive: true });
    addEventListener('keydown', this._skip);
    // harness hook: hold the clock and step it by hand
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

  update(dt) {
    this.t += dt;
    if (this.t > 0.7 && this.embers.length < 60 && Math.random() < dt * 40) {
      this.embers.push({ x: Math.random(), y: 0.52, vy: 0.04 + Math.random() * 0.1, vx: (Math.random() - 0.5) * 0.05, r: 0.5 + Math.random() * 1.5, life: 0, max: 1.6 + Math.random() * 2 });
    }
    for (const e of this.embers) { e.y -= e.vy * dt; e.x += e.vx * dt; e.life += dt; }
    this.embers = this.embers.filter((e) => e.life < e.max);
    if (this.t >= this.min && this.ready && !this.manual) {
      if (!this.handed) { this.handed = true; this.onHandoff?.(); }
      this.fadeT += dt;
      if (this.fadeT >= FADE) this.done = true;
    }
  }

  // a neon polyline, drawn up to `prog` (0..1) of its length: coloured halo,
  // then the pale hot core
  tube(g, pts, prog, c, w, glow) {
    if (prog <= 0) return;
    const total = lengthOf(pts) * prog;
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    let run = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (run + d >= total) { const k = d ? (total - run) / d : 0; g.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k); break; }
      g.lineTo(pts[i][0], pts[i][1]); run += d;
    }
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (glow) { g.shadowColor = c; g.shadowBlur = glow; }
    g.strokeStyle = c; g.lineWidth = w; g.stroke();
    g.shadowBlur = 0; g.strokeStyle = '#fff4fa'; g.lineWidth = w * 0.38; g.stroke();
  }

  draw() {
    const g = this.g, dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.max(1, innerWidth), H = Math.max(1, innerHeight), t = this.t;
    if (this.cv.width !== Math.round(W * dpr) || this.cv.height !== Math.round(H * dpr)) { this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const u = Math.min(W, H) / 100, hy = H * 0.52; // the horizon
    g.fillStyle = '#05060a'; g.fillRect(0, 0, W, H);

    // the ember: a point that breathes, then splits into the horizon line
    const born = ss(0, 0.35, t), run = ss(0.45, 1.05, t);
    const breath = 0.85 + 0.15 * Math.sin(t * 7);
    g.save(); g.globalCompositeOperation = 'lighter';
    const er = u * (3 + 5 * breath) * (1 - run * 0.6);
    const eg = g.createRadialGradient(W / 2, hy, 0, W / 2, hy, er * 4);
    eg.addColorStop(0, `rgba(255,150,80,${0.9 * born})`); eg.addColorStop(0.3, `rgba(255,80,40,${0.35 * born})`); eg.addColorStop(1, 'rgba(255,60,30,0)');
    g.fillStyle = eg; g.fillRect(W / 2 - er * 4, hy - er * 4, er * 8, er * 8);
    g.restore();

    // the floor: a perspective grid rolling toward you, brightest at the horizon
    const gridK = ss(0.7, 1.6, t);
    if (gridK > 0) {
      g.save(); g.beginPath(); g.rect(0, hy, W, H - hy); g.clip();
      g.strokeStyle = `rgba(255,63,164,${0.5 * gridK})`; g.lineWidth = 1; g.beginPath();
      for (let i = -14; i <= 14; i++) { g.moveTo(W / 2 + i * u * 1.2, hy); g.lineTo(W / 2 + i * u * 14, H); }
      const roll = (t * 0.5) % 1;
      for (let i = 0; i < 12; i++) { const k = (i + roll) / 12, y = hy + (H - hy) * k * k; g.moveTo(0, y); g.lineTo(W, y); }
      g.stroke();
      const fade = g.createLinearGradient(0, hy, 0, H);
      fade.addColorStop(0, 'rgba(5,6,10,0)'); fade.addColorStop(1, 'rgba(5,6,10,0.75)');
      g.fillStyle = fade; g.fillRect(0, hy, W, H - hy);
      g.restore();
    }

    // the horizon: a neon line out to both edges, with a haze above it
    if (run > 0) {
      const hw = (W / 2) * run;
      g.save(); g.globalCompositeOperation = 'lighter';
      const haze = g.createLinearGradient(0, hy - u * 14, 0, hy);
      haze.addColorStop(0, 'rgba(255,63,164,0)'); haze.addColorStop(1, `rgba(255,63,164,${0.2 * run})`);
      g.fillStyle = haze; g.fillRect(W / 2 - hw, hy - u * 14, hw * 2, u * 14);
      g.restore();
      g.save(); g.shadowColor = '#ff3fa4'; g.shadowBlur = u * 2.4; g.strokeStyle = '#ff3fa4'; g.lineWidth = Math.max(2, u * 0.4);
      g.beginPath(); g.moveTo(W / 2 - hw, hy); g.lineTo(W / 2 + hw, hy); g.stroke();
      g.shadowBlur = 0; g.strokeStyle = '#fff4fa'; g.lineWidth = Math.max(1, u * 0.15); g.stroke(); g.restore();
    }

    // five visor lights on the horizon, each ignites with a flicker
    for (const [fx, [r, gg, b], on] of VISORS) {
      const k = t < on ? 0 : t < on + 0.14 ? (Math.sin((t - on) * 90) > 0 ? 1 : 0.15) : 1;
      if (!k) continue;
      const lit = k * (0.85 + 0.15 * Math.sin(t * 2.4 + fx * 9)), x = W * fx, w = u * 6.4, h = u * 1.35, vy = hy - u * 3.4;
      g.save(); g.globalCompositeOperation = 'lighter';
      const hg = g.createRadialGradient(x, vy, 0, x, vy, u * 11);
      hg.addColorStop(0, `rgba(${r},${gg},${b},${0.5 * lit})`); hg.addColorStop(1, `rgba(${r},${gg},${b},0)`);
      g.fillStyle = hg; g.fillRect(x - u * 11, vy - u * 11, u * 22, u * 22);
      g.shadowColor = `rgb(${r},${gg},${b})`; g.shadowBlur = u * 2;
      g.fillStyle = `rgba(${Math.min(255, r + 70)},${Math.min(255, gg + 70)},${Math.min(255, b + 70)},${lit})`;
      g.beginPath(); g.moveTo(x - w / 2, vy - h / 2); g.lineTo(x + w / 2, vy - h / 2 - u * 0.2); g.lineTo(x + w / 2, vy + h / 2); g.lineTo(x - w / 2, vy + h / 2 + u * 0.2); g.closePath(); g.fill();
      g.restore();
      // its light on the floor
      g.save(); g.globalCompositeOperation = 'lighter';
      g.translate(x, hy + u * 5); g.scale(1, 0.32);
      const fg = g.createRadialGradient(0, 0, 0, 0, 0, u * 13);
      fg.addColorStop(0, `rgba(${r},${gg},${b},${0.3 * lit})`); fg.addColorStop(1, `rgba(${r},${gg},${b},0)`);
      g.fillStyle = fg; g.fillRect(-u * 13, -u * 13, u * 26, u * 26);
      g.restore();
    }

    // the title: three neon letters drawn stroke by stroke, then flickering on
    const size = Math.min(u * 26, W / 4.6), gap = size * 0.2;
    const names = ['K', 'O', 'R'], tw = names.reduce((s, n) => s + LETTERS[n].w * size, 0) + gap * 2;
    const tx0 = (W - tw) / 2, ty = hy - size - u * 8, flick = t > 2.3 ? 0.9 + 0.1 * Math.sin(t * 21) * Math.sin(t * 7.3) : 1;
    const pulse = ss(2.7, 3.4, t);
    for (const mirror of [false, true]) {
      g.save();
      if (mirror) { g.translate(0, hy * 1.42); g.scale(1, -0.42); g.globalAlpha = 0.26 * flick; }
      let x = tx0, n = 0;
      for (const nm of names) {
        const L = LETTERS[nm];
        let st = 1.6 + n * 0.28;
        for (const stroke of L.strokes) {
          const prog = ss(st, st + 0.26, t);
          const pts = stroke.map(([px, py]) => [x + px * size, ty + py * size]);
          const col = nm === 'O' ? '#3ee8e0' : nm === 'K' ? '#ff6b2c' : '#ff3fa4';
          this.tube(g, pts, prog, col, Math.max(3, u * 1.5), mirror ? 0 : u * 3 * flick);
          st += 0.18;
        }
        x += L.w * size + gap; n++;
      }
      g.restore();
    }
    // the pulse leaving the title
    if (pulse > 0 && pulse < 1 && !this.reduce) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,120,200,${0.45 * (1 - pulse)})`; g.lineWidth = 2;
      g.beginPath(); g.ellipse(W / 2, ty + size / 2, tw * (0.6 + pulse * 0.9), size * (0.7 + pulse * 1.1), 0, 0, Math.PI * 2); g.stroke(); g.restore();
    }
    // the tagline under the horizon
    const tg = ss(2.6, 3.1, t);
    if (tg > 0) {
      g.save(); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = `700 ${Math.max(11, u * 2.6)}px Rajdhani, sans-serif`;
      g.shadowColor = '#ff3fa4'; g.shadowBlur = u * 1.4; g.fillStyle = `rgba(255,214,236,${tg})`;
      g.fillText('L A B', W / 2, hy + u * 21);
      g.restore();
    }

    // rain, a few embers rising off the horizon
    g.save(); g.strokeStyle = 'rgba(190,200,240,0.14)'; g.lineWidth = 1; g.beginPath();
    for (let i = 0; i < 80; i++) {
      const rx = (hash(i * 1.7) * W + t * 60) % (W + 40) - 20, ry = (hash(i * 3.1) * H + t * 820 * (0.8 + hash(i * 2) * 0.4)) % H;
      g.moveTo(rx, ry); g.lineTo(rx - u * 0.3, ry + u * 2.2);
    }
    g.stroke(); g.restore();
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const em of this.embers) {
      const f = Math.min(1, em.life / 0.3) * Math.max(0, 1 - em.life / em.max);
      g.fillStyle = `rgba(255,${130 + Math.floor(hash(em.r * 9) * 80)},90,${0.8 * f})`;
      g.beginPath(); g.arc(em.x * W, em.y * H, em.r * u * 0.28, 0, Math.PI * 2); g.fill();
    }
    g.restore();

    // loading line and the skip hint
    const kL = ss(0.9, 1.3, t) * (1 - ss(0, 0.25, this.fadeT));
    if (kL > 0) {
      const bw = Math.min(W * 0.34, u * 64), bx = (W - bw) / 2, by = H * 0.9;
      g.save();
      g.fillStyle = `rgba(255,255,255,${0.1 * kL})`; g.fillRect(bx, by, bw, 2);
      g.shadowColor = '#ff3fa4'; g.shadowBlur = 6; g.fillStyle = `rgba(255,63,164,${0.95 * kL})`; g.fillRect(bx, by, bw * (this.ready ? 1 : this.progress), 2);
      g.shadowBlur = 0; g.font = `700 ${Math.max(10, u * 1.7)}px Rajdhani, sans-serif`; g.textAlign = 'center'; g.fillStyle = `rgba(147,157,171,${kL})`;
      g.fillText(this.ready ? TEXT.ready() : `${TEXT.loading()} %${Math.round(this.progress * 100)}`, W / 2, by + u * 3.4);
      if (t > 1.2) { g.textAlign = 'right'; g.fillStyle = `rgba(147,157,171,${0.6 * kL})`; g.fillText(TEXT.skip(), W - u * 3, H - u * 3); }
      g.restore();
    }

    // vignette and the fade out
    const vg = g.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    if (this.fadeT > 0) {
      const k = ss(0, FADE, this.fadeT);
      this.cv.style.opacity = String(1 - k);
      if (!this.reduce) this.cv.style.transform = `scale(${1 + 0.05 * k})`;
    }
  }
}
