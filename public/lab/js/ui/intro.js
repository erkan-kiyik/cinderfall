// CINDERFALL LAB — the opening.
//
// A short cinematic that plays while the art bakes (the wait is the show),
// then hands over to the lobby. It is painted with the same art as the game:
// the five operators stand on a rooftop over the burning Sector 9, backlit
// by the fires, and their visors light up one after another before the title
// strikes in.
//
//   0.00  black; a CRT line snaps open
//   0.30  the city fades up: fire glow, smoke, searchlight, rain, embers
//   0.90  visors light, one operator at a time
//   1.50  KOR rises letter by letter; the rule and SECTOR 9 follow
//   3.40  earliest hand-off (waits for the bake if it is still running)
//
// Any tap or key skips (after a beat, so the launch tap does not); the
// hand-off fades into the lobby, which plays its own entrance.
import { drawFigure, solve } from '../art/figure.js';
import { outlined } from '../art/kit.js';
import { OPS, visorLight } from '../art/ops/index.js';
import { drone } from '../art/ops/kite.js';
import { WEAPONS } from '../art/weapons/index.js';
import { t } from './i18n.js';

const BG = '#07090c';
const MIN_RUN = 3.4, FADE = 0.55, SKIP_AFTER = 0.45;
const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
// the strings (looked up per frame: the language can change before the intro ends)
const TEXT = { loading: () => t('intro.loading'), ready: () => t('intro.ready'), skip: () => t('intro.skip'), sector: () => t('intro.sector') };
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

// The squad on the roof, facing left toward the fires; `on`: when the visor lights.
const SQUAD = [
  { id: 'kite', x: 0.565, k: 0.95, gun: 'marksman', on: 1.38 },
  { id: 'hale', x: 0.65, k: 1.0, gun: 'ramrod', on: 1.16 },
  { id: 'morrow', x: 0.925, k: 0.97, gun: 'wren9', on: 1.6 },
  { id: 'brick', x: 0.84, k: 1.08, gun: 'kestrel', on: 1.27 },
  { id: 'vex', x: 0.745, k: 1.04, gun: 'kestrel', on: 0.95 },
];

function squadPose(m) {
  const op = OPS[m.id];
  const pistol = m.gun === 'wren9';
  const gun = { w: WEAPONS[m.gun], at: pistol ? [5.4, -37.0] : [7.0, -43.4], ang: pistol ? 1.0 : 0.5, k: 0.96, mat: op.pose.gun && op.pose.gun.mat };
  return { ...op.pose, head: 0.06, lean: 0.02, gun };
}

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
    if (this.t > 0.3 && this.embers.length < 70 && Math.random() < dt * 55) {
      this.embers.push({ x: 0.05 + Math.random() * 0.6, y: 1.05, vy: 0.05 + Math.random() * 0.1, vx: (Math.random() - 0.35) * 0.04, r: 0.6 + Math.random() * 1.8, life: 0, max: 2 + Math.random() * 2.2 });
    }
    for (const e of this.embers) { e.y -= e.vy * dt; e.x += e.vx * dt + Math.sin(this.t * 2 + e.r * 9) * 0.002; e.life += dt; }
    this.embers = this.embers.filter((e) => e.life < e.max && e.y > -0.1);
    if (this.t >= this.min && this.ready && !this.manual) {
      if (!this.handed) { this.handed = true; this.onHandoff?.(); }
      this.fadeT += dt;
      if (this.fadeT >= FADE) this.done = true;
    }
  }

  // Static layers, painted once per viewport: skylines, the roof, the squad.
  build(W, H, dpr) {
    const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr); const g = c.getContext('2d'); g.scale(dpr, dpr); return [c, g]; };
    const u = Math.min(W, H) / 100, horizon = H * 0.7, roofY = H * 0.885;
    let seed = 91;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    // far skyline, warm-lit windows, a Syndicate tower with a red beacon
    const [far, fg] = mk();
    for (let x = -u * 4; x < W + u * 4;) {
      const bw = u * (5 + rnd() * 9), bh = u * (10 + rnd() * 26), top = horizon - bh;
      fg.fillStyle = '#1a1216'; fg.fillRect(x, top, bw, H - top);
      if (rnd() > 0.6) fg.fillRect(x + bw * 0.4, top - u * 3, u * 0.35, u * 3);
      for (let wy = top + u * 2; wy < horizon - u; wy += u * 2.2) for (let wx = x + u; wx < x + bw - u; wx += u * 1.8) {
        if (rnd() > 0.86) { fg.fillStyle = `rgba(255,${150 + rnd() * 60 | 0},90,${0.25 + rnd() * 0.35})`; fg.fillRect(wx, wy, u * 0.7, u * 0.9); fg.fillStyle = '#1a1216'; }
      }
      x += bw + u * (0.4 + rnd() * 1.6);
    }
    const tx = W * 0.47, tw = u * 7, th = u * 46;
    fg.fillStyle = '#140e12'; fg.fillRect(tx, horizon - th, tw, th + H);
    fg.beginPath(); fg.moveTo(tx, horizon - th); fg.lineTo(tx + tw / 2, horizon - th - u * 6); fg.lineTo(tx + tw, horizon - th); fg.fill();
    fg.fillStyle = 'rgba(214,69,58,0.55)'; fg.fillRect(tx + u * 0.8, horizon - th + u * 4, tw - u * 1.6, u * 0.6);
    // near skyline
    const [near, ng] = mk();
    seed = 4447;
    for (let x = -u * 2; x < W + u * 2;) {
      const bw = u * (8 + rnd() * 14), bh = u * (4 + rnd() * 14), top = horizon + u * 4 - bh;
      ng.fillStyle = '#0a090b'; ng.beginPath(); ng.moveTo(x, H); ng.lineTo(x, top);
      if (rnd() > 0.55) { for (let i = 1; i <= 4; i++) ng.lineTo(x + bw * i / 4, top + (rnd() - 0.3) * u * 3); } else ng.lineTo(x + bw, top);
      ng.lineTo(x + bw, H); ng.closePath(); ng.fill();
      x += bw;
    }
    // the roof the squad stands on, with a parapet lit by the fires
    const roofX = W * 0.5;
    ng.fillStyle = '#050507'; ng.fillRect(roofX, roofY, W - roofX, H - roofY);
    ng.fillStyle = 'rgba(255,120,60,0.22)'; ng.fillRect(roofX, roofY, W - roofX, Math.max(1, u * 0.35));
    ng.fillStyle = '#060608'; ng.fillRect(W * 0.965, roofY - u * 16, u * 1.1, u * 16);
    ng.fillStyle = 'rgba(214,69,58,0.9)'; ng.fillRect(W * 0.962, roofY - u * 16.8, u * 1.7, u * 0.9);
    // the squad: backlit silhouettes with a fire rim on the edges facing the city
    const figs = [];
    const s0 = (H * 0.355) / 66;
    for (const m of SQUAD) {
      const s = s0 * m.k * dpr;
      const pose = squadPose(m);
      const op = { ...OPS[m.id], parts: { ...OPS[m.id].parts, front: undefined } };
      const fw = Math.round(84 * s), fh = Math.round(84 * s), ox = fw * 0.52, oy = fh - 6 * s;
      const fig = outlined(fw, fh, s, ox, oy, (g) => drawFigure(g, op, pose, true));
      const sil = document.createElement('canvas'); sil.width = fw; sil.height = fh;
      const sg = sil.getContext('2d');
      // fire rim: the silhouette pushed toward the fire, minus the figure
      sg.drawImage(fig, -u * 0.45 * dpr, -u * 0.12 * dpr);
      sg.globalCompositeOperation = 'source-in'; sg.fillStyle = 'rgba(255,128,64,0.95)'; sg.fillRect(0, 0, fw, fh);
      sg.globalCompositeOperation = 'destination-out'; sg.drawImage(fig, 0, 0);
      // the figure itself, darkened so only the big shapes read
      sg.globalCompositeOperation = 'destination-over';
      const dark = document.createElement('canvas'); dark.width = fw; dark.height = fh;
      const dg = dark.getContext('2d'); dg.drawImage(fig, 0, 0);
      dg.globalCompositeOperation = 'source-atop'; dg.fillStyle = 'rgba(8,9,13,0.78)'; dg.fillRect(0, 0, fw, fh);
      sg.drawImage(dark, 0, 0);
      // the visor light, painted once; each frame only sets how bright it is
      const vis = document.createElement('canvas'); vis.width = fw; vis.height = fh;
      const vg = vis.getContext('2d'); vg.translate(ox, oy); vg.scale(-s, s);
      visorLight(vg, m.id, pose, s);
      const J = solve(pose);
      figs.push({ m, sil, vis, w: fw / dpr, h: fh / dpr, ox: ox / dpr, oy: oy / dpr, headY: J.neck[1] * s0 * m.k });
    }
    // KITE's drone, painted once, hovers over her
    const ds = s0 * 0.95 * dpr, [dc] = [document.createElement('canvas')];
    dc.width = Math.round(14 * ds); dc.height = Math.round(8 * ds);
    const dcg = dc.getContext('2d'); dcg.translate(dc.width / 2, dc.height / 2); dcg.scale(-ds, ds); drone(dcg);
    dcg.setTransform(1, 0, 0, 1, 0, 0); dcg.globalCompositeOperation = 'source-atop'; dcg.fillStyle = 'rgba(8,9,13,0.7)'; dcg.fillRect(0, 0, dc.width, dc.height);
    this.S = { W, H, dpr, u, horizon, roofY, far, near, figs, drone: dc, droneW: dc.width / dpr, droneH: dc.height / dpr };
  }

  draw() {
    const g = this.g, dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.max(1, innerWidth), H = Math.max(1, innerHeight);
    if (this.cv.width !== Math.round(W * dpr) || this.cv.height !== Math.round(H * dpr)) { this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr); }
    if (!this.S || this.S.W !== W || this.S.H !== H || this.S.dpr !== dpr) this.build(W, H, dpr);
    const S = this.S, u = S.u, t = this.t;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const flick = 0.85 + 0.15 * Math.sin(t * 9.1) * Math.sin(t * 5.3 + 1);

    // sky and the fires on the left
    const sky = g.createLinearGradient(0, 0, 0, S.horizon);
    sky.addColorStop(0, '#07080c'); sky.addColorStop(0.55, '#1a0f12'); sky.addColorStop(1, '#4a1a12');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.save(); g.globalCompositeOperation = 'lighter';
    const fx = W * 0.26, fy = S.horizon;
    const glow = g.createRadialGradient(fx, fy, 0, fx, fy, Math.max(W, H) * 0.6);
    glow.addColorStop(0, `rgba(255,110,40,${0.45 * flick})`); glow.addColorStop(0.35, `rgba(200,60,30,${0.16 * flick})`); glow.addColorStop(1, 'rgba(120,30,20,0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    g.restore();
    // smoke plumes
    for (let i = 0; i < 7; i++) {
      const base = W * (0.1 + i * 0.07), ph = (t * 0.06 + i * 0.37) % 1, yy = S.horizon - ph * H * 0.55, rr = u * (10 + ph * 22);
      const sm = g.createRadialGradient(base + Math.sin(i + t * 0.4) * u * 4, yy, 0, base, yy, rr);
      sm.addColorStop(0, `rgba(40,22,22,${0.35 * (1 - ph)})`); sm.addColorStop(1, 'rgba(40,22,22,0)');
      g.fillStyle = sm; g.fillRect(base - rr, yy - rr, rr * 2, rr * 2);
    }
    // searchlight from the Syndicate tower
    g.save(); g.globalCompositeOperation = 'lighter';
    g.translate(W * 0.485, S.horizon - u * 46); g.rotate(-Math.PI / 2 + Math.sin(t * 0.7 + 0.6) * 0.55);
    const beam = g.createLinearGradient(0, 0, H, 0);
    beam.addColorStop(0, 'rgba(190,210,230,0.18)'); beam.addColorStop(1, 'rgba(190,210,230,0)');
    g.fillStyle = beam; g.beginPath(); g.moveTo(0, 0); g.lineTo(H * 1.1, -u * 9); g.lineTo(H * 1.1, u * 9); g.closePath(); g.fill();
    g.restore();

    // skylines with a slow push-in, flames on the far roofline
    const push = this.reduce ? 1 : 1.07 - 0.07 * ss(0, 3.6, t);
    const layer = (img, k) => { const z = 1 + (push - 1) * k; g.drawImage(img, W / 2 - (W * z) / 2, H - H * z, W * z, H * z); };
    layer(S.far, 0.6);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 10; i++) {
      const bx = W * (0.12 + i * 0.03), h = u * (3 + 3 * Math.abs(Math.sin(t * 6 + i * 1.7)));
      const fl = g.createLinearGradient(0, S.horizon - h * 3, 0, S.horizon);
      fl.addColorStop(0, 'rgba(255,170,80,0)'); fl.addColorStop(1, `rgba(255,120,50,${0.35 * flick})`);
      g.fillStyle = fl;
      const w = u * 1.8, sway = Math.sin(t * 4 + i) * u * 0.8;
      g.beginPath(); g.moveTo(bx - w, S.horizon); g.quadraticCurveTo(bx - w * 0.7, S.horizon - h * 1.4, bx + sway, S.horizon - h * 3);
      g.quadraticCurveTo(bx + w * 0.7, S.horizon - h * 1.4, bx + w, S.horizon); g.closePath(); g.fill();
    }
    g.restore();
    layer(S.near, 1);

    // the squad, rising a touch into place, then the visors light up
    const z = push, cx = W / 2;
    for (const f of S.figs) {
      const fxp = cx + (f.m.x * W - cx) * z, fyp = H - (H - S.roofY) * z + (1 - ss(0.2, 1.1, t)) * u * 2;
      // breathing: a slow rise of the whole figure from the boots, each on its own beat
      const br = this.reduce ? 1 : 1 + 0.008 * Math.sin(t * 1.8 + f.m.x * 13);
      g.drawImage(f.sil, fxp - f.ox * z, fyp - f.oy * z * br, f.w * z, f.h * z * br);
      // power-on flicker, then a steady glow with a slow breath
      const k = t < f.m.on ? 0 : t < f.m.on + 0.12 ? (Math.sin((t - f.m.on) * 90) > 0 ? 1 : 0.2) : 1;
      if (k > 0) {
        g.save(); g.globalCompositeOperation = 'lighter';
        g.globalAlpha = k * (0.82 + 0.18 * Math.sin(t * 2.3 + f.m.x * 9));
        g.drawImage(f.vis, fxp - f.ox * z, fyp - f.oy * z * br, f.w * z, f.h * z * br);
        g.restore();
      }
      if (f.m.id === 'kite') {
        const dy = Math.sin(t * 2.4) * u * 0.6, dxp = fxp - u * 2.0, dyp = fyp + f.headY * z * br - u * 9 + dy;
        g.drawImage(S.drone, dxp - S.droneW / 2, dyp - S.droneH / 2, S.droneW * z, S.droneH * z);
        if (t > 1.5) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(62,232,224,${0.6 + 0.4 * Math.sin(t * 8)})`; g.beginPath(); g.arc(dxp - S.droneW * 0.22 * z, dyp + S.droneH * 0.12 * z, u * 0.35, 0, Math.PI * 2); g.fill(); g.restore(); }
      }
    }

    // rain catching the firelight
    g.save(); g.strokeStyle = 'rgba(200,170,160,0.10)'; g.lineWidth = 1; g.beginPath();
    for (let i = 0; i < 100; i++) {
      const rx = (hash(i * 1.7) * W + t * 140 * (0.8 + hash(i) * 0.4)) % (W + 40) - 20;
      const ry = (hash(i * 3.1) * H + t * 900 * (0.8 + hash(i * 2) * 0.4)) % H;
      g.moveTo(rx, ry); g.lineTo(rx - u * 0.5, ry + u * 2.4);
    }
    g.stroke(); g.restore();
    // embers
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const em of this.embers) {
      const fade = Math.min(1, em.life / 0.4) * Math.max(0, 1 - em.life / em.max);
      g.fillStyle = `rgba(255,${140 + Math.floor(hash(em.r * 9) * 70)},70,${0.7 * fade})`;
      g.beginPath(); g.arc(em.x * W, em.y * H, em.r * u * 0.3, 0, Math.PI * 2); g.fill();
    }
    g.restore();

    // title over the fires: the three letters rise one after another, lit from below
    const tcx = W * 0.27, ty = H * 0.34;
    if (t > 1.5) {
      const word = 'KOR', size = Math.min(u * 22, W / 6.5);
      g.save(); g.font = `700 ${size}px Rajdhani, sans-serif`; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
      const sp = size * 0.14, total = g.measureText(word).width + sp * (word.length - 1);
      let lx = tcx - total / 2;
      for (let i = 0; i < word.length; i++) {
        const ch = word[i], k = ss(1.5 + i * 0.18, 1.9 + i * 0.18, t), wch = g.measureText(ch).width;
        if (k > 0) {
          const yy = ty + (1 - k) * size * 0.3;
          const grad = g.createLinearGradient(0, ty - size * 0.75, 0, ty);
          grad.addColorStop(0, `rgba(244,240,232,${k})`); grad.addColorStop(0.6, `rgba(236,226,214,${k})`); grad.addColorStop(1, `rgba(255,140,84,${k})`);
          g.fillStyle = grad; g.fillText(ch, lx, yy);
          if (k < 1) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,120,60,${0.6 * (1 - k)})`; g.fillText(ch, lx, yy); g.restore(); }
        }
        lx += wch + sp;
      }
      // the rule, then SECTOR 9 typed out and the LAB tag
      const label = TEXT.sector().split(' ').map((w) => [...w].join(' ')).join('   ');
      g.font = `700 ${size * 0.17}px Rajdhani, sans-serif`;
      const rw = Math.max(total, g.measureText(label).width) * 1.06, k2 = ss(2.15, 2.6, t);
      g.fillStyle = `rgba(214,69,58,${k2})`;
      g.fillRect(tcx - rw * 0.5 * k2, ty + size * 0.12, rw * k2, Math.max(1.5, size * 0.022));
      g.textAlign = 'center';
      g.fillText(label.slice(0, Math.ceil(label.length * ss(2.25, 2.7, t))), tcx, ty + size * 0.36);
      const k3 = ss(2.7, 3.0, t);
      if (k3 > 0) {
        g.font = `700 ${size * 0.12}px Rajdhani, sans-serif`;
        g.fillStyle = `rgba(255,107,44,${k3})`; g.fillText('L A B', tcx, ty + size * 0.55);
      }
      g.restore();
    }

    // the title lands: a warm flash over everything
    if (t > 2.28 && t < 2.9 && !this.reduce) {
      g.save(); g.globalCompositeOperation = 'lighter';
      g.fillStyle = `rgba(255,140,80,${0.14 * (1 - ss(2.28, 2.9, t))})`; g.fillRect(0, 0, W, H);
      g.restore();
    }

    // loading line and the skip hint
    const bw = Math.min(W * 0.32, u * 60), bx = tcx - bw / 2, by = H * 0.86;
    const kL = ss(0.6, 1.0, t) * (1 - ss(0, 0.25, this.fadeT));
    if (kL > 0) {
      g.save();
      g.fillStyle = `rgba(255,255,255,${0.1 * kL})`; g.fillRect(bx, by, bw, 2);
      g.fillStyle = `rgba(255,107,44,${0.9 * kL})`; g.fillRect(bx, by, bw * (this.ready ? 1 : this.progress), 2);
      g.font = `700 ${Math.max(10, u * 1.7)}px Rajdhani, sans-serif`; g.textAlign = 'center'; g.fillStyle = `rgba(147,157,171,${kL})`;
      g.fillText(this.ready ? TEXT.ready() : `${TEXT.loading()} %${Math.round(this.progress * 100)}`, tcx, by + u * 3.4);
      if (t > 1.2) { g.textAlign = 'right'; g.fillStyle = `rgba(147,157,171,${0.6 * kL})`; g.fillText(TEXT.skip(), W - u * 3, H - u * 3); }
      g.restore();
    }

    // grade, CRT open, fade up, fade out
    const vg = g.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H * 0.5, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.62)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    if (t < 0.7) {
      // fade up from black under the CRT open
      g.fillStyle = `rgba(7,9,12,${1 - ss(0.14, 0.7, t)})`; g.fillRect(0, 0, W, H);
    }
    if (t < 0.4) {
      // the CRT: a hot line snaps across the middle, then opens out to the frame
      const kx = ss(0, 0.13, t), ky = ss(0.13, 0.4, t);
      const hh = Math.max(2, H * ky), top = (H - hh) / 2, ww = W * kx, a = 1 - ky;
      g.fillStyle = BG; g.fillRect(0, 0, W, top + 0.5); g.fillRect(0, top + hh - 0.5, W, H - top - hh + 1);
      g.save(); g.globalCompositeOperation = 'lighter';
      const glow = g.createLinearGradient(0, H / 2 - u * 7, 0, H / 2 + u * 7);
      glow.addColorStop(0, 'rgba(255,150,90,0)'); glow.addColorStop(0.5, `rgba(255,150,90,${0.35 * a * kx})`); glow.addColorStop(1, 'rgba(255,150,90,0)');
      g.fillStyle = glow; g.fillRect(W / 2 - ww / 2, H / 2 - u * 7, ww, u * 14);
      g.fillStyle = `rgba(255,214,188,${0.95 * a})`;
      g.fillRect(W / 2 - ww / 2, top - 1, ww, 2); g.fillRect(W / 2 - ww / 2, top + hh - 1, ww, 2);
      g.restore();
    }
    if (this.fadeT > 0) {
      // fade out to the lobby below (the overlay itself goes transparent)
      const k = ss(0, FADE, this.fadeT);
      this.cv.style.opacity = String(1 - k);
      if (!this.reduce) this.cv.style.transform = `scale(${1 + 0.05 * k})`;
    }
  }
}
