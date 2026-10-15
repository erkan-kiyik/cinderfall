// KOR LAB — the opening.
//
// A short shot of the game's own street, painted with the game's own art,
// that plays while the sprites bake and then hands over to the lobby:
//
//   0.00  night, rain; the camera is already drifting along the street
//   0.25  the neon signs stutter on one by one, the wet road picks them up
//   0.95  the five operators drop onto the pavement, one after another:
//         dust on landing, the visor lights up, neon on their edges
//   1.95  the big KOR sign hung over the street buzzes into life
//   3.40  earliest hand-off (waits for the bake if it is still running)
//
// A tap or key skips (after a beat, so the launch tap does not); the hand-off
// fades into the lobby, which plays its own entrance.
import { drawFigure } from '../art/figure.js';
import { outlined } from '../art/kit.js';
import { OPS, visorLight } from '../art/ops/index.js';
import { WEAPONS } from '../art/weapons/index.js';
import { BUILDINGS } from '../art/env/city.js';
import { STREET } from '../art/env/street.js';
import { t } from './i18n.js';

const MIN_RUN = 3.4, FADE = 0.55, SKIP_AFTER = 0.45;
const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const TEXT = { loading: () => t('intro.loading'), ready: () => t('intro.ready'), skip: () => t('intro.skip') };
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

// the street, left to right (world units, pavement at y 0)
const STREET_ROW = ['walkupB', 'hotel', 'crow', 'alley', 'synBlock', 'walkup', 'garage'];
const X0 = -60;
// where the camera drifts (centre x) and how much of the street is in view (units tall)
const CAM_FROM = 300, CAM_TO = 360, VIEW_H = 172, VIEW_TOP = -134;
// the squad: world x, which way they face, when they land
const SQUAD = [
  // back to back: the left pair covers the left, the right pair the right
  { id: 'vex', dx: 0, flip: false, at: 0.95, gun: 'kestrel' },
  { id: 'hale', dx: -36, flip: true, at: 1.15, gun: 'ramrod' },
  { id: 'kite', dx: 38, flip: false, at: 1.3, gun: 'marksman' },
  { id: 'morrow', dx: -70, flip: true, at: 1.45, gun: 'wren9' },
  { id: 'brick', dx: 74, flip: false, at: 1.6, gun: 'kestrel' },
];
const SIGN_ON = 1.95;

function squadPose(m) {
  const op = OPS[m.id], pistol = m.gun === 'wren9';
  const gun = { w: WEAPONS[m.gun], at: pistol ? [5.4, -37.0] : [7.0, -43.4], ang: pistol ? 1.0 : 0.5, k: 0.96, mat: op.pose.gun && op.pose.gun.mat };
  return { ...op.pose, head: 0.04, lean: 0.02, gun };
}
const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

export class Intro {
  // opts: { reduce, onHandoff }
  constructor(canvas, opts = {}) {
    this.cv = canvas; this.g = canvas.getContext('2d');
    this.reduce = !!opts.reduce; this.onHandoff = opts.onHandoff || null;
    this.t = 0; this.fadeT = 0; this.done = false; this.ready = false; this.progress = 0; this.handed = false;
    this.min = this.reduce ? 1.6 : MIN_RUN;
    this.dust = []; this.sparks = [];
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
    const before = this.t;
    this.t += dt;
    // landings: a puff of dust under each operator
    for (const m of SQUAD) if (before < m.at && this.t >= m.at) {
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI, sp = 20 + Math.random() * 40;
        this.dust.push({ x: CAM_TO + m.dx + (Math.random() - 0.5) * 10, y: -1, vx: Math.cos(a) * sp * (Math.random() < 0.5 ? -1 : 1), vy: -Math.sin(a) * sp * 0.35, r: 2 + Math.random() * 3, life: 0, max: 0.6 + Math.random() * 0.4 });
      }
    }
    // the sign catching: sparks off its corners
    if (before < SIGN_ON + 0.05 && this.t >= SIGN_ON + 0.05) {
      for (let i = 0; i < 26; i++) this.sparks.push({ x: CAM_TO + (Math.random() < 0.5 ? -46 : 46), y: -108 + Math.random() * 14, vx: (Math.random() - 0.5) * 60, vy: -20 - Math.random() * 40, life: 0, max: 0.5 + Math.random() * 0.6 });
    }
    for (const d of this.dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= 1 - dt * 3; d.r += dt * 9; d.life += dt; }
    for (const s of this.sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 160 * dt; s.life += dt; }
    this.dust = this.dust.filter((d) => d.life < d.max);
    this.sparks = this.sparks.filter((s) => s.life < s.max && s.y < 2);
    if (this.t >= this.min && this.ready && !this.manual) {
      if (!this.handed) { this.handed = true; this.onHandoff?.(); }
      this.fadeT += dt;
      if (this.fadeT >= FADE) this.done = true;
    }
  }

  // The painted layers, once per viewport: the far city, the street of
  // buildings, the ground, the squad with their neon rim, the KOR sign.
  build(W, H, dpr) {
    const s = H / VIEW_H, k = s * dpr; // css px and device px per unit
    const paint = (x0, y0, x1, y1, fn) => {
      const c = canvasOf((x1 - x0) * k, (y1 - y0) * k), g = c.getContext('2d');
      g.scale(k, k); g.translate(-x0, -y0); fn(g);
      return { c, x0, y0, w: x1 - x0, h: y1 - y0 };
    };
    const back = paint(-10, -176, 610, -20, (g) => { STREET.sky(g); STREET.farCity(g); STREET.midIndustry(g); });
    let x = X0;
    const row = STREET_ROW.map((type) => { const b = { type, x }; x += BUILDINGS[type].w; return b; });
    const street = paint(X0 - 4, -165, x + 4, 0.6, (g) => {
      for (const b of row) { g.save(); g.translate(b.x, 0); BUILDINGS[b.type].paint(g); g.restore(); }
    });
    const ground = paint(-10, -0.5, 610, 42, (g) => STREET.ground(g));
    // the squad, each in the game's own art with a neon edge on both sides
    const figs = SQUAD.map((m) => {
      const pose = squadPose(m), fw = Math.round(90 * k), fh = Math.round(84 * k), ox = fw / 2, oy = fh - 6 * k;
      const fig = outlined(fw, fh, k, ox, oy, (g) => drawFigure(g, OPS[m.id], pose, m.flip));
      const out = canvasOf(fw, fh), og = out.getContext('2d');
      for (const [dx, col] of [[-0.55, 'rgba(255,63,164,0.95)'], [0.55, 'rgba(62,232,224,0.95)']]) {
        const rim = canvasOf(fw, fh), rg = rim.getContext('2d');
        rg.drawImage(fig, dx * k, -0.2 * k);
        rg.globalCompositeOperation = 'source-in'; rg.fillStyle = col; rg.fillRect(0, 0, fw, fh);
        rg.globalCompositeOperation = 'destination-out'; rg.drawImage(fig, 0, 0);
        og.drawImage(rim, 0, 0);
      }
      og.drawImage(fig, 0, 0);
      // a little night on the figure, so the neon edges carry it
      og.globalCompositeOperation = 'source-atop'; og.fillStyle = 'rgba(10,12,24,0.28)'; og.fillRect(0, 0, fw, fh);
      og.globalCompositeOperation = 'source-over';
      const vis = canvasOf(fw, fh), vg = vis.getContext('2d');
      vg.translate(ox, oy); vg.scale(m.flip ? -k : k, k); visorLight(vg, m.id, pose, k);
      return { m, c: out, vis, w: fw / k, h: fh / k, ox: ox / k, oy: oy / k };
    });
    // the KOR sign: a dark board on two cables, the letters dark and lit
    const SW = 104, SH = 34;
    const board = paint(-SW / 2 - 2, -SH / 2 - 2, SW / 2 + 2, SH / 2 + 2, (g) => {
      g.fillStyle = '#12101a'; g.fillRect(-SW / 2, -SH / 2, SW, SH);
      g.strokeStyle = '#2e3646'; g.lineWidth = 1.2; g.strokeRect(-SW / 2 + 0.6, -SH / 2 + 0.6, SW - 1.2, SH - 1.2);
      g.fillStyle = '#3c4558'; for (const [bx, by] of [[-SW / 2 + 3, -SH / 2 + 3], [SW / 2 - 3, -SH / 2 + 3], [-SW / 2 + 3, SH / 2 - 3], [SW / 2 - 3, SH / 2 - 3]]) { g.beginPath(); g.arc(bx, by, 0.9, 0, Math.PI * 2); g.fill(); }
      g.font = '700 30px Rajdhani, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.strokeStyle = '#3a2a24'; g.lineWidth = 1.4; g.strokeText('K O R', 0, 1);
    });
    const lit = paint(-SW / 2 - 14, -SH / 2 - 14, SW / 2 + 14, SH / 2 + 14, (g) => {
      g.font = '700 30px Rajdhani, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = '#ff6b2c'; g.shadowBlur = 14 * dpr; g.strokeStyle = '#ff6b2c'; g.lineWidth = 1.8; g.strokeText('K O R', 0, 1);
      g.shadowBlur = 0; g.strokeStyle = '#fff1e6'; g.lineWidth = 0.6; g.strokeText('K O R', 0, 1);
      g.font = '700 6px Rajdhani, sans-serif'; g.shadowColor = '#3ee8e0'; g.shadowBlur = 8 * dpr; g.fillStyle = '#3ee8e0'; g.fillText('L  A  B', 0, SH / 2 - 4.6);
    });
    this.S = { W, H, dpr, s, back, street, ground, row, figs, board, lit };
  }

  draw() {
    const g = this.g, dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.max(1, innerWidth), H = Math.max(1, innerHeight), t = this.t;
    if (this.cv.width !== Math.round(W * dpr) || this.cv.height !== Math.round(H * dpr)) { this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr); }
    if (!this.S || this.S.W !== W || this.S.H !== H || this.S.dpr !== dpr) this.build(W, H, dpr);
    const S = this.S, s = S.s;
    // camera: a slow drift along the street, eased out; a jolt on each landing
    const camX = CAM_FROM + (CAM_TO - CAM_FROM) * (this.reduce ? 1 : ss(0, 3.2, t));
    let shake = 0;
    for (const m of SQUAD) { const d = t - m.at; if (d > 0 && d < 0.18) shake += (1 - d / 0.18) * 1.2; }
    const sx = (wx) => (wx - camX) * s + W / 2, sy = (wy) => (wy - VIEW_TOP) * s + Math.sin(t * 90) * shake;
    const blit = (L, wx, wy, par = 1) => g.drawImage(L.c, (wx + L.x0 - camX) * s * par + W / 2 + (par - 1) * 0, sy(wy + L.y0), L.w * s, L.h * s);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#0b0e15'; g.fillRect(0, 0, W, H);

    // the far city, slower than the street; two copies cover any width
    for (const k of [-1, 0, 1]) g.drawImage(S.back.c, (S.back.x0 + k * 620 - camX * 0.35) * s + W / 2 - 140 * s, sy(S.back.y0), S.back.w * s, S.back.h * s);
    // the street and the ground
    blit(S.street, 0, 0);
    for (const k of [-1, 0, 1]) blit(S.ground, k * 620, 0);

    // the night lifts as the signs come on
    const neonUp = ss(0.2, 1.3, t);
    g.fillStyle = `rgba(4,5,10,${0.55 * (1 - neonUp)})`; g.fillRect(0, 0, W, H);

    // the neon of every building, each stuttering on at its own moment, and on the wet road
    g.save(); g.globalCompositeOperation = 'lighter';
    let n = 0;
    for (const b of S.row) {
      for (const [gx, gy, gsx, gsy, c] of BUILDINGS[b.type].glows || []) {
        const on = 0.25 + hash(n++ * 3.7) * 0.9, d = t - on;
        const k = d < 0 ? 0 : d < 0.16 ? (Math.sin(d * 80) > 0 ? 1 : 0.1) : 0.9 + 0.1 * Math.sin(t * 9 + n);
        if (!k) continue;
        const x = sx(b.x + gx), y = sy(gy), rx = Math.max(6, gsx * s * 1.4), ry = Math.max(6, gsy * s * 1.4);
        this.glow(g, x, y, rx, ry, c, 0.45 * k);
        // the reflection, smeared down the road
        this.glow(g, x, sy(18), Math.max(5, Math.min(gsx, 30) * s * 0.7), 12 * s, c, 0.35 * k);
      }
    }
    g.restore();

    // the squad drops in
    for (const f of S.figs) {
      const d = t - f.m.at;
      if (d < -0.36) continue;
      const fall = d < 0 ? (d / 0.36) ** 2 * 150 : 0;             // from 150 units up, accelerating
      const squash = d >= 0 && d < 0.16 ? 1 - Math.sin((d / 0.16) * Math.PI) * 0.06 : 1;
      const wx = CAM_TO + f.m.dx, wy = -fall;
      const x = sx(wx) - f.ox * s, h = f.h * s * squash, y = sy(wy) - f.oy * s * squash;
      // contact shadow when down
      if (d >= 0) { g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.ellipse(sx(wx), sy(0.4), 11 * s, 2.2 * s, 0, 0, Math.PI * 2); g.fill(); }
      g.drawImage(f.c, x, y, f.w * s, h);
      if (d >= 0) {
        const k = d < 0.12 ? (Math.sin(d * 90) > 0 ? 1 : 0.2) : 0.85 + 0.15 * Math.sin(t * 2.4 + f.m.dx);
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k; g.drawImage(f.vis, x, y, f.w * s, h); g.restore();
      }
    }
    // dust
    for (const p of this.dust) {
      const a = 0.35 * (1 - p.life / p.max);
      g.fillStyle = `rgba(150,150,170,${a})`; g.beginPath(); g.arc(sx(p.x), sy(p.y), p.r * s * 0.5, 0, Math.PI * 2); g.fill();
    }

    // the KOR sign over the street on its cables
    const signX = CAM_TO, signY = -100;
    g.strokeStyle = '#1a1e28'; g.lineWidth = Math.max(1, s * 0.5);
    g.beginPath(); g.moveTo(sx(signX - 40), sy(-140)); g.lineTo(sx(signX - 40), sy(signY - 17)); g.moveTo(sx(signX + 40), sy(-140)); g.lineTo(sx(signX + 40), sy(signY - 17)); g.stroke();
    blit(S.board, signX, signY);
    const sd = t - SIGN_ON;
    if (sd > 0) {
      const buzz = sd < 0.4 ? (Math.sin(sd * 70) * Math.sin(sd * 23) > -0.1 ? 1 : 0.15) : 0.92 + 0.08 * Math.sin(t * 31) * Math.sin(t * 7);
      g.save(); g.globalAlpha = buzz; blit(S.lit, signX, signY); g.restore();
      g.save(); g.globalCompositeOperation = 'lighter';
      this.glow(g, sx(signX), sy(signY), 70 * s, 24 * s, '#ff6b2c', 0.28 * buzz);
      this.glow(g, sx(signX), sy(18), 46 * s, 14 * s, '#ff6b2c', 0.4 * buzz); // on the road
      this.glow(g, sx(signX), sy(-30), 90 * s, 40 * s, '#ff6b2c', 0.08 * buzz); // spill on the squad
      g.restore();
    }
    // sparks
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const p of this.sparks) { g.fillStyle = `rgba(255,${180 + Math.floor(hash(p.x) * 60)},120,${1 - p.life / p.max})`; g.fillRect(sx(p.x), sy(p.y), Math.max(1.2, s * 0.5), Math.max(1.2, s * 0.5)); }
    g.restore();

    // rain over everything
    g.save(); g.strokeStyle = 'rgba(196,214,242,0.22)'; g.lineWidth = 1; g.beginPath();
    for (let i = 0; i < 140; i++) {
      const rx = (hash(i * 1.7) * (W + 60) + t * 90) % (W + 60) - 30, ry = (hash(i * 3.1) * H + t * 760 * (0.8 + hash(i * 2) * 0.4)) % H;
      g.moveTo(rx, ry); g.lineTo(rx - s * 0.9, ry + s * 6);
    }
    g.stroke(); g.restore();

    // loading line and the skip hint
    const kL = ss(0.7, 1.1, t) * (1 - ss(0, 0.25, this.fadeT));
    if (kL > 0) {
      const bw = Math.min(W * 0.3, 260), bx = (W - bw) / 2, by = H - 34;
      g.save();
      g.fillStyle = `rgba(255,255,255,${0.12 * kL})`; g.fillRect(bx, by, bw, 2);
      g.fillStyle = `rgba(255,107,44,${0.95 * kL})`; g.fillRect(bx, by, bw * (this.ready ? 1 : this.progress), 2);
      g.font = '700 12px Rajdhani, sans-serif'; g.textAlign = 'center'; g.fillStyle = `rgba(200,206,216,${kL})`;
      g.fillText(this.ready ? TEXT.ready() : `${TEXT.loading()} %${Math.round(this.progress * 100)}`, W / 2, by + 16);
      if (t > 1.2) { g.textAlign = 'right'; g.fillStyle = `rgba(200,206,216,${0.6 * kL})`; g.fillText(TEXT.skip(), W - 14, H - 14); }
      g.restore();
    }

    // grade: vignette, fade up from black, fade out to the lobby
    const vg = g.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    if (t < 0.5) { g.fillStyle = `rgba(0,0,0,${1 - ss(0, 0.5, t)})`; g.fillRect(0, 0, W, H); }
    if (this.fadeT > 0) {
      const k = ss(0, FADE, this.fadeT);
      this.cv.style.opacity = String(1 - k);
      if (!this.reduce) this.cv.style.transform = `scale(${1 + 0.05 * k})`;
    }
  }

  // a soft coloured light (call with additive blending on)
  glow(g, x, y, rx, ry, c, a) {
    if (a <= 0) return;
    const n = parseInt(c.slice(1), 16), r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
    g.save(); g.translate(x, y); g.scale(rx / ry, 1);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, ry);
    gr.addColorStop(0, `rgba(${r},${gg},${b},${Math.min(1, a)})`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = gr; g.fillRect(-ry, -ry, ry * 2, ry * 2);
    g.restore();
  }
}
