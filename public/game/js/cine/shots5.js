// KOR — cinematics: act 3's scenes (docs §10.44). New places, ray traced as
// plates (tools/game/series/scenes/act3.js, cameras in plates.js); what moves
// is drawn live on them. No one is in them.
//
//   m8    Boardroom   the tower's forty-second floor, Ocaksan's boardroom once: rain
//                     on the window, a searchlight going across the room, Vorsa's
//                     screens; the furnace burning far off with its smoke
//   m9    Bay         the loading bay: HAWK's truck with its hazards going, its
//                     exhaust; then the lamps cut, and torches at the far door
//   m10   Roof        the tower's roof in the storm: the mast's red lamps, the rain,
//                     lightning (the plate going over to the one lit by it), Vorsa's
//                     flag cracking on the pole
//   act3  RoofDawn    the morning: Ocaksan's flag going up the same pole
//         WorksGate   the works' gate open, the hiring banner, the furnace steaming
//         WorksBoard  the safety board: the last plate flips, 0 to 1
import { Rain, Puffs, glow, beam } from './fx.js';
import { rng, noise1, smooth, clamp, canvas } from './noise.js';
import { PlateShot, Dust, drips } from './shots4.js';
import { ocaksanLogo } from '../art/env/flag.js';

const TAU = Math.PI * 2;
// the mast and the flagpole on the roof (tools/game/series/scenes/act3.js MAST, FLAGPOLE)
const MAST = { x: 0, z: 14, h: 26, r0: 1.6, r1: 0.65 }, POLE = { x: 9, z: 1, h: 14 };
const mastR = (y) => MAST.r0 + (MAST.r1 - MAST.r0) * (y / MAST.h);
const REDS = [[MAST.x, MAST.h + 4.5, MAST.z, 1], ...[9, 18].flatMap((y) => [0, 1, 2].map((k) => { const a = Math.PI / 2 + (k * TAU) / 3, rr = mastR(y) + 0.12; return [MAST.x + rr * Math.cos(a), y + 0.6, MAST.z + rr * Math.sin(a), 0]; }))];

// the red lamps on the mast: the top one blinking once a second, the rest a slow pulse
function mastLamps(g, cam, t, k = 1) {
  const s = [0, 0, 0, 0];
  for (const [x, y, z, top] of REDS) {
    const on = top ? ((t % 1) < 0.5 ? 1 : 0.08) : 0.35 + 0.65 * Math.max(0, Math.sin(t * 1.6));
    cam.project(x, y, z, s); if (s[2] <= 0) continue;
    glow(g, s[0], s[1], Math.max(3, s[3] * (top ? 1.6 : 0.8)), '#ff3a20', 0.75 * on * k);
    glow(g, s[0], s[1], Math.max(1.5, s[3] * 0.25), '#ffd6c8', 0.9 * on * k);
  }
}

// a flag: a picture on cloth flying from a pole. Drawn in strips along its length, each
// moved across the wind by a travelling wave that grows toward the fly, and shaded by its
// slope. hoist: the top of the edge on the pole [x, y, z]; dir: the way it flies (unit,
// level); size [length, drop] in metres
class Flag {
  constructor(img, { len = 2.4, drop = 1.6, amp = 0.22, wave = 2.2, speed = 7, sag = 0.12, n = 26, seed = 3 } = {}) {
    Object.assign(this, { img, len, drop, amp, wave, speed, sag, n }); this.ph = rng(seed)() * 10;
  }
  // the cloth's offset across the wind at u (0 at the pole, 1 at the fly) and its slope
  off(u, t) { const a = this.amp * (0.15 + u) * (1 + 0.25 * noise1(t * 0.7, 9)), p = u * this.wave * TAU - t * this.speed + this.ph; return [a * Math.sin(p), a * Math.cos(p) * this.wave * TAU]; }
  draw(g, cam, t, hoist, dir, { light = [1, -1], rim = 0, dark = 0.45 } = {}) {
    const W = this.img.width, H = this.img.height, n = this.n, across = [-dir[2], 0, dir[0]];
    const P = (u, v) => {
      const [o] = this.off(u, t), x = hoist[0] + dir[0] * u * this.len + across[0] * o, z = hoist[2] + dir[2] * u * this.len + across[2] * o;
      const y = hoist[1] - v * this.drop - this.sag * u * u * (0.6 + 0.4 * v);
      return cam.project(x, y, z, [0, 0, 0, 0]);
    };
    let A = P(0, 0), C = P(0, 1);
    for (let i = 0; i < n; i++) {
      const u1 = (i + 1) / n, B = P(u1, 0), D = P(u1, 1);
      if (A[2] > 0 && B[2] > 0 && C[2] > 0 && D[2] > 0) {
        const sx0 = (i / n) * W, sw = W / n + 0.6;
        g.save(); g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0] + (B[0] - A[0]) * 0.02, B[1]); g.lineTo(D[0] + (D[0] - C[0]) * 0.02, D[1]); g.lineTo(C[0], C[1]); g.closePath(); g.clip();
        g.setTransform((B[0] - A[0]) / sw, (B[1] - A[1]) / sw, (C[0] - A[0]) / H, (C[1] - A[1]) / H, A[0], A[1]);
        g.drawImage(this.img, sx0, 0, sw, H, 0, 0, sw, H);
        g.setTransform(1, 0, 0, 1, 0, 0);
        // the fold's light: dark where the cloth turns from the light, a rim where it catches it
        const [, sl] = this.off((i + 0.5) / n, t), k = clamp(sl * light[1] * 0.35, -1, 1);
        if (k < 0) { g.fillStyle = `rgba(0,0,0,${(-k * dark).toFixed(3)})`; g.fill(); }
        else if (k > 0 && rim > 0) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,170,100,${(k * rim).toFixed(3)})`; g.fill(); }
        g.restore();
      }
      A = B; C = D;
    }
  }
}
// Ocaksan's flag (art/env/flag.js, the same mark): charcoal, the ring and flame, the name,
// the founding year, an orange stripe along the bottom. The picture runs from the pole (its
// left edge) to the fly; flying away to the left of the screen it would read backwards, so
// `left` paints it the other way round: the mark still by the pole, the name readable
function ocaksanFlag(left = false) {
  const W = 600, H = 400, c = canvas(W, H), g = c.getContext('2d'), m = (x) => (left ? W - x : x);
  g.fillStyle = '#2b2623'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#e2692f'; g.fillRect(0, H * 0.82, W, H * 0.09);
  g.strokeStyle = 'rgba(230,220,196,0.55)'; g.lineWidth = 4; g.strokeRect(22, 22, W - 44, H * 0.82 - 36);
  ocaksanLogo(g, m(W * 0.24), H * 0.42, H * 0.2);
  g.fillStyle = '#e6dcc4'; g.textAlign = left ? 'right' : 'left'; g.textBaseline = 'middle';
  g.font = `800 ${Math.round(H * 0.2)}px 'Big Shoulders Stencil', Rajdhani, sans-serif`; g.fillText('OCAKSAN', m(W * 0.42), H * 0.38);
  g.font = `600 ${Math.round(H * 0.075)}px Rajdhani, sans-serif`; g.fillText('KURULUŞ 1891', m(W * 0.425), H * 0.56);
  if (!left) return c;
  // as it should look from here (the mark on the right, by the pole), turned round for the cloth
  const o = canvas(W, H), og = o.getContext('2d'); og.translate(W, 0); og.scale(-1, 1); og.drawImage(c, 0, 0); return o;
}
// Vorsa's: grey-blue, the red slit across it, their mark
function vorsaFlag() {
  const W = 600, H = 400, c = canvas(W, H), g = c.getContext('2d');
  g.fillStyle = '#28303a'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#b3241b'; g.fillRect(0, H * 0.46, W, H * 0.08);
  g.strokeStyle = '#b8bec4'; g.lineWidth = 14; g.beginPath(); g.arc(W * 0.3, H * 0.5, H * 0.24, 0, TAU); g.stroke();
  g.beginPath(); g.moveTo(W * 0.3 - H * 0.15, H * 0.44); g.lineTo(W * 0.3, H * 0.59); g.lineTo(W * 0.3 + H * 0.15, H * 0.44); g.stroke();
  return c;
}
// a few birds crossing high up, small and dark, flapping (screen space: they are far)
function birds(g, W, H, t, seed = 5, n = 6, col = 'rgba(30,22,20,0.8)') {
  const r = rng(seed); g.save(); g.strokeStyle = col; g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = ((r() * 0.5 - 0.1 + t * (0.035 + r() * 0.01)) % 1.2) * W, y = H * (0.12 + r() * 0.18) + Math.sin(t * 0.8 + i) * H * 0.01, s = W * (0.004 + r() * 0.003), f = Math.sin(t * (9 + r() * 3) + i * 2);
    g.lineWidth = Math.max(1, s * 0.35); g.beginPath(); g.moveTo(x - s, y - s * 0.5 * f); g.quadraticCurveTo(x - s * 0.4, y - s * 0.2, x, y); g.quadraticCurveTo(x + s * 0.4, y - s * 0.2, x + s, y - s * 0.5 * f); g.stroke();
  }
  g.restore();
}

// --- m8: the boardroom -----------------------------------------------------------------------
// rain on the window (beads, and runs that let go and slide), a searchlight going across the
// room from right to left, the screens; the furnace burning far off and its smoke
export class Boardroom extends PlateShot {
  constructor() { super('boardroom', { hand: 0.18, seed: 461, push: 0.05, dur: 16 }); }
  setup() {
    const r = rng(463);
    this.beads = Array.from({ length: 420 }, () => ({ x: -6.4 + r() * 12.8, y: 0.2 + r() * 3.0, s: 0.004 + r() * r() * 0.012, run: r() < 0.12 ? 0.15 + r() * 0.5 : 0, ph: r() * 20 }));
    this.smoke = new Puffs({ rate: 1.4, life: 26, rise: 7, grow: 80, size: 30, col: '#c8805a', a: 0.22, seed: 465, lumpy: true });
    for (let i = 0; i < 300; i++) this.smoke.update(0.1, [[-470, -114, 1300]], 3);
  }
  tick(dt) { this.smoke.update(dt, [[-470, -114, 1300]], 3); }
  draw(g, t) {
    if (!this.drawPlate(g)) return;
    const cam = this.cam, s = [0, 0, 0, 0];
    // the furnace far off: its glow breathing, its smoke going up lit from under
    const f = cam.project(-470, -110, 1300), br = 0.8 + 0.2 * noise1(t * 2.2, 4);
    if (f[2] > 0) { glow(g, f[0], f[1], this.W * 0.05, '#ff8a40', 0.35 * br); glow(g, f[0], f[1], this.W * 0.012, '#ffd0a0', 0.6 * br); }
    g.save(); g.globalCompositeOperation = 'screen'; this.smoke.draw(g, cam, 0.9); g.restore();
    // a far tower's red lamp
    const rl = cam.project(380, -20, 900); if (rl[2] > 0 && (t % 1.6) < 0.8) glow(g, rl[0], rl[1], 5, '#ff3020', 0.8);
    // the searchlight: a broad shaft through the glass, its patch going across the floor and
    // the ceiling, the room going pale and back
    const sw = smooth(4.5, 10.5, t), on = smooth(4.2, 5, t) * (1 - smooth(10, 11, t));
    if (on > 0.01) {
      const x = 7 - sw * 15;
      for (const [y, a] of [[0.01, 0.28], [3.39, 0.16]]) {
        const pts = [[x - 0.7, y, 13.9], [x + 0.7, y, 13.9], [x + 2.6, y, 2], [x + 1.2, y, 2]].map((p) => cam.project(...p, [0, 0, 0, 0]));
        if (pts.every((q) => q[2] > 0)) { const gr = g.createLinearGradient(pts[0][0], pts[0][1], pts[3][0], pts[3][1]); gr.addColorStop(0, `rgba(220,232,255,${(a * 0.7 * on).toFixed(3)})`); gr.addColorStop(1, 'rgba(220,232,255,0)'); g.save(); g.filter = `blur(${Math.round(this.W * 0.012)}px)`; g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.fill(); g.restore(); }
      }
      const w = cam.project(x, 1.7, 14); if (w[2] > 0) { glow(g, w[0], w[1], this.W * 0.09, '#dfe8ff', 0.18 * on); glow(g, w[0], w[1], this.W * 0.025, '#ffffff', 0.35 * on); }
    }
    // the screens: a cold flicker, the red one breathing
    for (const [x, z, c] of [[0.6, 3.1, '#b8d0ff'], [0.6, 7.2, '#ff3a28'], [-0.6, 5.2, '#b8d0ff'], [-0.6, 9.1, '#b8d0ff']]) {
      cam.project(x, 0.93, z, s); if (s[2] <= 0) continue;
      const k = c === '#ff3a28' ? 0.5 + 0.5 * Math.sin(t * 2.4) : 0.8 + 0.2 * noise1(t * 9 + z, 2);
      glow(g, s[0], s[1], s[3] * 0.35, c, 0.12 * k);
    }
    // the rain on the glass: beads catching the town's light, a few running
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const b of this.beads) {
      let y = b.y; if (b.run) { const cyc = (t * b.run + b.ph) % 4; y = b.y - Math.max(0, cyc - 1) * 0.9; if (y < 0.2) continue; }
      cam.project(b.x, y, 13.98, s); if (s[2] <= 0) continue;
      const rr = Math.max(0.5, b.s * s[3]), lit = 0.18 + 0.5 * on * Math.max(0, 1 - Math.abs(b.x - (7 - sw * 15)) / 2.5);
      g.fillStyle = `rgba(255,214,170,${(lit * 0.5).toFixed(3)})`; g.beginPath(); g.arc(s[0], s[1], rr, 0, TAU); g.fill();
      if (b.run && y < b.y) { const e = cam.project(b.x, Math.min(b.y, y + 0.5), 13.98); g.strokeStyle = `rgba(255,214,170,${(lit * 0.18).toFixed(3)})`; g.lineWidth = rr * 0.8; g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(e[0], e[1]); g.stroke(); }
    }
    g.restore();
  }
  post() { return { grain: 0.07, halation: 0.5, lift: [5, 4, 4], warm: 0.02, vignette: 0.6, dirt: 0.2, flicker: 0.01 }; }
}

// --- m9: the loading bay ------------------------------------------------------------------------
// the truck's hazards going and its exhaust, the beacon over the third door turning; at
// 11.8 s the lamps cut (the plate goes over to the one without them, with a stutter), and
// torches come round the far doors
export class Bay extends PlateShot {
  constructor() { super('bay', { alt: 'bay_dark', hand: 0.22, seed: 471, push: 0.05, dur: 16 }); }
  setup() {
    this.ex = new Puffs({ rate: 9, life: 2.6, rise: 0.35, grow: 0.9, size: 0.12, col: '#d8c0b0', a: 0.16, seed: 473, lumpy: true });
    for (let i = 0; i < 60; i++) this.ex.update(1 / 24, [[0.8, 0.36, 5.82]], 0.05);
    this.drops = [[-4.5, 4.6, 6, 2.1, 0], [2.4, 4.6, 3.5, 2.7, 0.8], [-8.2, 4.6, 14, 1.8, 1.3], [5.2, 4.6, 16.5, 2.4, 0.4]];
  }
  cut(t) { if (t < 11.8) return 0; if (t < 12.4) { const k = Math.floor((t - 11.8) * 20); return [1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1][k] ?? 1; } return 1; }
  tick(dt) { this.ex.update(dt, [[0.8, 0.36, 5.82]], 0.05); }
  draw(g, t) {
    const k = this.cut(t);
    if (!this.drawPlate(g, k)) return;
    const cam = this.cam, s = [0, 0, 0, 0], m = [0, 0, 0, 0];
    // the hazards: rear corners and the markers down the box side, with their wet reflections
    const on = (t % 0.72) < 0.36;
    if (on) for (const [x, y, z, big] of [[0.69, 0.84, 5.73, 1], [2.31, 0.84, 5.73, 1], [0.2, 1.25, 8, 0], [0.2, 1.25, 11, 0], [0.4, 1.2, 13.6, 0]]) {
      cam.project(x, y, z, s); if (s[2] <= 0) continue;
      glow(g, s[0], s[1], s[3] * (big ? 0.5 : 0.25), '#ffa018', 0.85); glow(g, s[0], s[1], s[3] * (big ? 1.6 : 0.8), '#ff8a10', 0.2 + 0.25 * k);
      cam.project(x, -y, z + 0.2, m); if (m[2] > 0) glow(g, m[0], m[1], m[3] * 0.9, '#ff9a20', 0.18);
    }
    g.save(); g.globalCompositeOperation = 'screen'; this.ex.draw(g, cam, 0.7 + 0.3 * (1 - k)); g.restore();
    // the beacon over the third door, turning
    const bp = cam.project(4.9, 4.45, 23.92), sw = Math.pow(Math.max(0, Math.cos(t * 4.2)), 6);
    if (bp[2] > 0) { glow(g, bp[0], bp[1], bp[3] * 0.18, '#ff2a18', 0.9); glow(g, bp[0], bp[1], bp[3] * (0.8 + 2.4 * sw), '#ff2010', 0.15 + 0.45 * sw); }
    drips(g, cam, t, this.drops, 0.0, `rgba(230,200,160,${(0.45 * (1 - k * 0.7)).toFixed(3)})`);
    // after the cut: torches round the first two doors, sweeping, toward us
    if (t > 12.6) {
      const a1 = smooth(12.6, 13.2, t), a2 = smooth(13.6, 14.2, t);
      beam(g, cam, [-7.6, 1.5, 23.3], norm([0.3 + 0.12 * Math.sin(t * 1.3), -0.1, -1]), 0.09, 22, 5600, 0.42 * a1);
      if (a2 > 0) beam(g, cam, [-2.2, 1.4, 23.3], norm([0.12 + 0.15 * Math.sin(t * 1.7 + 1), -0.08, -1]), 0.085, 20, 5800, 0.38 * a2);
      for (const [x, a] of [[-7.6, a1], [-2.2, a2]]) { const q = cam.project(x, 1.5, 23.3); if (q[2] > 0 && a > 0) { glow(g, q[0], q[1], q[3] * 0.3, '#ffffff', a); glow(g, q[0], q[1], q[3] * 1.4, '#cfe0ff', 0.25 * a); } }
    }
  }
  post(t) { const k = this.cut(t); return { grain: 0.08, halation: 0.5, lift: [5 - 2 * k, 4 - 2 * k, 3 - 1 * k], warm: 0.03 * (1 - k), vignette: 0.6, dirt: 0.25, flicker: 0.012 }; }
}
const norm = (v) => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

// --- m10: the roof in the storm ----------------------------------------------------------------
// lightning at 3.6, 9.8 and 13.9 s: the plate goes over to the one lit by it for a few
// frames (a stutter of strokes), the bolt itself in the sky the second time; the rain
// lit up with it; the red lamps; Vorsa's flag cracking on the pole
export class Roof extends PlateShot {
  constructor() { super('roof', { alt: 'roof_flash', hand: 0.4, seed: 481, push: 0.04, dur: 16 }); }
  setup() {
    this.rain = new Rain({ n: [1500, 520, 40], box: [11, 12, 0.6, 40], speed: 9.5, wind: 2.4, seed: 483 });
    for (let i = 0; i < 40; i++) this.rain.update(1 / 30, this.cam, 0, false);
    this.flag = new Flag(vorsaFlag(), { len: 2.4, drop: 1.5, amp: 0.3, wave: 2.6, speed: 13, sag: 0.05, seed: 485 });
    const r = rng(487), walk = (x, v0, v1, n, s) => { const p = [[x, v0]]; for (let i = 1; i <= n; i++) { x += (r() - 0.5) * s; p.push([x, v0 + (v1 - v0) * (i / n)]); } return p; };
    this.bolt = [walk(0, 0, 1, 46, 0.018)]; for (const i of [12, 22, 31]) { const [x, v] = this.bolt[0][i]; this.bolt.push(walk(x, v, v + 0.18 + r() * 0.15, 14, 0.022)); }
  }
  flash(t) {
    let k = 0;
    for (const t0 of [3.6, 9.8, 13.9]) for (const [d, a] of [[0, 1], [0.11, 0.7], [0.27, 0.9], [0.45, 0.35]]) { const u = t - t0 - d; if (u >= 0) k = Math.max(k, a * Math.exp(-u / 0.06)); }
    return clamp(k);
  }
  tick(dt) { this.rain.update(dt, this.cam, 0, false); }
  draw(g, t) {
    const k = this.flash(t);
    if (!this.drawPlate(g, k)) return;
    const cam = this.cam;
    // the bolt, far off to the left, with the second strike
    const u = t - 9.8;
    if (u >= 0 && u < 0.6 && k > 0.2) {
      const x0 = this.W * 0.18, y1 = this.H * 0.62;
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round'; g.lineCap = 'round';
      this.bolt.forEach((b, j) => { const pts = b.map(([dx, v]) => [x0 + dx * this.W, v * y1]), m = j ? 0.45 : 1;
        for (const [w, c, a, bl] of [[22, '#6f8cff', 0.1, 8], [7, '#b8c8ff', 0.3, 2], [1.8, '#ffffff', 0.95, 0]]) { g.filter = bl ? `blur(${bl}px)` : 'none'; g.strokeStyle = c; g.globalAlpha = a * k * m; g.lineWidth = w * (j ? 0.5 : 1); g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); } });
      g.restore();
    }
    mastLamps(g, cam, t, 1 - k * 0.6);
    // the flag on the pole: flying downwind, right, hard
    this.flag.draw(g, cam, t, [POLE.x + 0.12, POLE.h - 0.25, POLE.z], norm([1, 0, 0.25]), { light: [1, -1], dark: 0.55 });
    this.rain.draw(g, cam, { col: '#c4ccd8', light: 0.45 + 1.1 * k, wind: 2.4 });
    if (k > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(150,170,220,${(0.12 * k).toFixed(3)})`; g.fillRect(0, 0, this.W, this.H); g.restore(); }
  }
  post(t) { const k = this.flash(t); return { grain: 0.09, halation: 0.5 + 0.3 * k, lift: [5, 5, 7], cool: 0.05, vignette: 0.6, dirt: 0.35, flicker: 0.02 }; }
}

// --- act 3's end ----------------------------------------------------------------------------
// the roof at dawn: Ocaksan's flag going up the pole on its halyard, the sun behind the mast
export class RoofDawn extends PlateShot {
  constructor() { super('roof_dawn', { hand: 0.2, seed: 491, push: 0.05, dur: 7 }); }
  setup() { this.flag = new Flag(ocaksanFlag(true), { len: 2.4, drop: 1.6, amp: 0.2, wave: 1.9, speed: 5.5, sag: 0.1, seed: 493 }); }
  up(t) { return 6.1 + 7.8 * smooth(0.5, 5.2, t); }
  draw(g, t) {
    if (!this.drawPlate(g)) return;
    const cam = this.cam, W = this.W, H = this.H;
    // the low sun off to the right, through the haze
    glow(g, W * 1.02, H * 0.18, W * 0.55, '#ffb070', 0.22); glow(g, W * 0.98, H * 0.12, W * 0.12, '#fff0d0', 0.25);
    birds(g, W, H, t + 3, 7, 5);
    mastLamps(g, cam, t, 0.5);
    // the halyard, then the flag on it, flying left toward the mast
    const top = this.up(t), a = cam.project(POLE.x + 0.12, 0.9, POLE.z), b = cam.project(POLE.x + 0.12, POLE.h - 0.1, POLE.z);
    if (a[2] > 0 && b[2] > 0) { g.save(); g.strokeStyle = 'rgba(40,30,26,0.8)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.restore(); }
    this.flag.draw(g, cam, t, [POLE.x + 0.12, top, POLE.z], norm([-1, 0, 0.35]), { light: [-1, 1], rim: 0.35, dark: 0.4 });
  }
  post() { return { grain: 0.07, halation: 0.6, lift: [10, 8, 7], warm: 0.05, vignette: 0.5, dirt: 0.2 }; }
}
// the works' gate that morning: the furnace steaming beyond it, its top gas flaring
export class WorksGate extends PlateShot {
  constructor() { super('works_gate', { hand: 0.2, seed: 495, push: 0.05, dur: 6.5 }); }
  setup() {
    this.steam = new Puffs({ rate: 14, life: 8, rise: 6, grow: 12, size: 5, col: '#ffe6d6', a: 0.24, seed: 497, lumpy: true });
    this.gas = new Puffs({ rate: 6, life: 6, rise: 4, grow: 8, size: 4, col: '#ffd2b0', a: 0.16, seed: 499, lumpy: true });
    for (let i = 0; i < 200; i++) { this.steam.update(0.05, [[0, 46, 0], [1.4, 53, 1.4]], 0.9); this.gas.update(0.05, [[0, 24, -22]], 0.6); }
  }
  tick(dt) { this.steam.update(dt, [[0, 46, 0], [1.4, 53, 1.4]], 0.9); this.gas.update(dt, [[0, 24, -22]], 0.6); }
  draw(g, t) {
    if (!this.drawPlate(g)) return;
    const cam = this.cam, q = cam.project(1.4, 55.5, 1.4), f = 0.8 + 0.2 * noise1(t * 6, 8);
    g.save(); g.globalCompositeOperation = 'screen'; this.steam.draw(g, cam, 0.9); this.gas.draw(g, cam, 0.8); g.restore();
    if (q[2] > 0) { glow(g, q[0], q[1], q[3] * 6 * f, '#ffb070', 0.35); glow(g, q[0], q[1], q[3] * 2 * f, '#fff0c8', 0.5); }
    birds(g, this.W, this.H, t, 11, 4);
  }
  post() { return { grain: 0.07, halation: 0.5, lift: [10, 9, 8], warm: 0.04, vignette: 0.5, dirt: 0.2 }; }
}
// the safety board on the pier: the dust in the sun; the last flip plate goes over, 0 to 1
const CARD = { x0: -32.466, x1: -32.27, y0: 2.505, y1: 2.811, z: -160.765 };
function flipCard(d, scale) {
  const W = 104, H = 168, c = canvas(W, H), g = c.getContext('2d');
  g.fillStyle = '#111312'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, 0, W, H / 2);
  g.fillStyle = '#ffffff'; g.font = '800 150px "Arial Narrow", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(d, W / 2, H / 2 + 6);
  g.fillStyle = '#050605'; g.fillRect(0, H / 2 - 1, W, 3);
  if (scale) { const im = g.getImageData(0, 0, W, H), p = im.data; for (let i = 0; i < p.length; i += 4) for (let k = 0; k < 3; k++) p[i + k] = Math.min(255, p[i + k] * scale[k]); g.putImageData(im, 0, 0); }
  return c;
}
export class WorksBoard extends PlateShot {
  constructor() { super('works_board', { hand: 0.14, seed: 501, push: 0.09, dur: 6.5 }); }
  setup() {
    this.dust = new Dust([-35.5, 1.2, -164, -31, 4, -161], { n: 260, seed: 503, col: '255,226,190', lit: (p) => 0.4 + 0.6 * Math.max(0, Math.sin(p[0] * 2.1 + p[1] * 1.3)) });
    this.cards = null;
    // match the plate: the card's light there (with the 1 on it) against the card as painted
    this.ready = this.ready.then(() => {
      const P = this.plate, img = P.img, a = P.at(CARD.x0, CARD.y1, CARD.z), b = P.at(CARD.x1, CARD.y0, CARD.z);
      const w = Math.max(2, Math.round(b[0] - a[0])), h = Math.max(2, Math.round(b[1] - a[1])), c = canvas(w, h), cg = c.getContext('2d');
      cg.drawImage(img, a[0], a[1], b[0] - a[0], b[1] - a[1], 0, 0, w, h);
      const mean = (d) => { const s = [0, 0, 0]; for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) s[k] += d[i + k]; return s.map((v) => v / (d.length / 4)); };
      const pm = mean(cg.getImageData(0, 0, w, h).data), one = flipCard('1'), oc = canvas(w, h), og = oc.getContext('2d'); og.drawImage(one, 0, 0, w, h);
      const rm = mean(og.getImageData(0, 0, w, h).data), scale = pm.map((v, k) => v / Math.max(1, rm[k]));
      this.cards = { zero: flipCard('0', scale), one: flipCard('1', scale) };
    });
  }
  // draw part of a card (rows v0..v1 of it, 0 top) onto the board's plane, squeezed toward the
  // middle line by `fold` (1 = flat on the board, 0 = edge on)
  part(g, img, v0, v1, fold) {
    const cam = this.cam, ym = (CARD.y0 + CARD.y1) / 2, Y = (v) => CARD.y1 - v * (CARD.y1 - CARD.y0), yy = (v) => ym + (Y(v) - ym) * fold;
    const A = cam.project(CARD.x0, yy(v0), CARD.z), B = cam.project(CARD.x1, yy(v0), CARD.z), C = cam.project(CARD.x0, yy(v1), CARD.z);
    if (A[2] <= 0 || B[2] <= 0 || C[2] <= 0) return;
    const ih = img.height, sy = v0 * ih, sh = (v1 - v0) * ih;
    g.save(); g.setTransform((B[0] - A[0]) / img.width, (B[1] - A[1]) / img.width, (C[0] - A[0]) / sh, (C[1] - A[1]) / sh, A[0], A[1]);
    g.drawImage(img, 0, sy, img.width, sh, 0, 0, img.width, sh); g.restore();
  }
  draw(g, t) {
    if (!this.drawPlate(g)) return;
    this.dust.draw(g, this.cam, t);
    const C = this.cards; if (!C) return;
    // before 1.6 s the plate still reads 0; the top flap of the 0 falls (1.6–1.78), then the
    // 1's lower flap comes down over the 0's lower half (1.78–1.95)
    const t0 = 1.6, u = t - t0;
    if (u < 0) this.part(g, C.zero, 0, 1, 1);
    else if (u < 0.18) { this.part(g, C.zero, 0.5, 1, 1); this.part(g, C.zero, 0, 0.5, 1 - u / 0.18); }
    else if (u < 0.35) { this.part(g, C.zero, 0.5, 1, 1); this.part(g, C.one, 0.5, 1, (u - 0.18) / 0.17); }
  }
  post() { return { grain: 0.07, halation: 0.45, lift: [10, 9, 8], warm: 0.04, vignette: 0.55, dirt: 0.2 }; }
}
