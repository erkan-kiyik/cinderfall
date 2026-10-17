// KOR — cinematics: the scenes before the missions (docs/KOR_STORY_CINEMATIC.md §4).
// One shot each, under a few lines of radio.
import { Cam, mirrorCam } from './cam.js';
import { Human } from './human.js';
import { Rain, Puffs, softDot, tinted, glow, reflect, beam } from './fx.js';
import { canvas, fbm2, noise1, rng, clamp, lerp, smooth, fogTexture } from './noise.js';
import { Ground, asphalt, concrete, bokeh } from './surf.js';
import { softEdges } from './city.js';
import { v3, lit, tone, capsule3, box3, capsulePts, boxPts, shadow } from './solid.js';
import { Basement } from './shots2.js';

const TAU = Math.PI * 2;
const { add, sub, mul, norm } = v3;
// a 3D quad through the camera
function quad(g, cam, pts, fill) {
  const q = pts.map((p) => cam.project(p[0], p[1], p[2]));
  if (q.some((v) => v[2] <= 0)) return null;
  g.beginPath(); q.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  return q;
}
const box = (g, cam, x0, y0, z0, x1, y1, z1, front, side, top) => {
  const eye = cam._p;
  if (eye[0] < x0 && side) quad(g, cam, [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]], side);
  if (eye[0] > x1 && side) quad(g, cam, [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], side);
  if (eye[1] > y1 && top) quad(g, cam, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], top);
  return quad(g, cam, [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], front);
};

// ---------------------------------------------------------------------------------------------
// m1: the gate at night. From behind a stack of containers, 50 mm, creeping
// in: a barrier across the road, the guard hut with its lit window and a
// television in it, a floodlight on a pole, container stacks beyond. One
// sentry leans by the hut, one walks the barrier. Rain on everything.
export class Gate {
  init(W, H, env) {
    this.W = W; this.H = H; this.env = env;
    const cam = this.cam = new Cam(W, H);
    cam.mm = 50; cam.pos = [-0.6, 1.5, -2]; cam.pitch = -0.015; cam.yaw = 0.06; cam.hand = 0.45; cam.seed = 101; cam.update(0);
    this.flood = [5.2, 7.5, 26];
    this.hut = { x0: 3.0, x1: 5.6, z0: 23.5, z1: 26.0, h: 2.6 };
    const A = asphalt(11, { lanes: 0.9 });
    this.ground = new Ground(cam, {
      mat: A.mat, height: A.height, scale: 0.55, zMax: 90, lazy: true,
      lights: [{ p: this.flood, K: 5200, I: 90 }, { p: [3.4, 1.4, 23.3], K: 2800, I: 2, layer: true }],
      mirror: [{ p: this.flood, r: 0.5, K: 5200, I: 2.6 }, { p: [3.6, 1.5, 23.45], r: 0.6, K: 2800, I: 1.2 }],
      sky: [0.006, 0.0065, 0.008], amb: [0.0015, 0.0015, 0.0016], haze: { d: 60, c: [0.0025, 0.0025, 0.003] },
    });
    this.sentry1 = new Human({ kit: 'vanta', x: 2.6, z: 23.0, yaw: -Math.PI / 2 - 0.4, pose: 'stand', seed: 111 });
    this.sentry2 = new Human({ kit: 'vanta', x: -3.8, z: 21.5, yaw: 0, gait: 'careful', seed: 112 });
    this.rain = new Rain({ n: [1000, 380, 40], box: [9, 7, 0.5, 40], speed: 8.6, wind: 0.6, seed: 113 });
    this.cloud = softEdges(fogTexture(256, 64, 114, 4));
  }
  prepare(ms) { this.ground.step(ms); }
  update(dt, t) {
    const cam = this.cam; cam.pos[2] = -2 + smooth(0, 16, t) * 1.2; cam.update(t);
    // the walking sentry turns at the ends of his beat
    const s = this.sentry2; if (s.x > 1.8 && Math.cos(s.yaw) > 0) s.yaw = Math.PI; else if (s.x < -4.5 && Math.cos(s.yaw) < 0) s.yaw = 0;
    s.step(dt); this.sentry1.step(dt);
    for (const st of s.takeSteps()) this.env.audio?.cue('step', { wet: 1, vol: 0.25, pan: clamp(s.x / 6, -1, 1) });
    this.rain.update(dt, cam, 0, true);
  }
  draw(g, t) {
    const W = this.W, H = this.H, cam = this.cam;
    // sky: low cloud lit from the town; the stacks of containers against it
    const hz = cam.project(0, cam.pos[1], 1e4)[1];
    const sk = g.createLinearGradient(0, 0, 0, hz); sk.addColorStop(0, '#07080a'); sk.addColorStop(1, '#1a1612'); g.fillStyle = sk; g.fillRect(0, 0, W, hz + 2);
    g.save(); g.globalAlpha = 0.12; g.drawImage(this.cloud, -W * 0.1, 0, W * 1.3, hz * 0.8); g.restore();
    g.fillStyle = '#100f10'; g.fillRect(0, hz, W, H - hz);
    // container stacks: corrugated steel, rust and faded paint, lit only where
    // the floodlight reaches them (it falls off fast)
    const CON = [[92, 48, 38], [44, 62, 72], [96, 84, 56], [58, 62, 60], [110, 66, 40]];
    let k = 0;
    const F = this.flood;
    for (const [x, z, n] of [[-14, 40, 3], [-8, 38, 2], [8, 36, 3], [13, 42, 4], [-2, 48, 2]]) for (let i = 0; i < n; i++) {
      const c = CON[(k++) % CON.length], y0 = i * 2.6, cx = x + 3, cy = y0 + 1.3;
      const d2 = (cx - F[0]) ** 2 + (cy - F[1]) ** 2 + (z - F[2]) ** 2, L = Math.min(1, 140 / (d2 + 40)) + 0.05;
      const col = (m) => `rgb(${c[0] * L * m | 0},${c[1] * L * m | 0},${c[2] * L * m | 0})`;
      const q = box(g, cam, x, y0, z, x + 6.1, y0 + 2.59, z + 2.44, col(0.8), col(0.45), col(0.3));
      if (q) {
        // the corrugation: a light and a dark line on each rib
        for (let j = 1; j < 24; j++) { const a = cam.project(x + j * 0.254, y0 + 0.05, z), b = cam.project(x + j * 0.254, y0 + 2.54, z); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.strokeStyle = `rgba(255,255,255,${(0.06 * L).toFixed(3)})`; g.beginPath(); g.moveTo(a[0] + 1, a[1]); g.lineTo(b[0] + 1, b[1]); g.stroke(); }
        // the floodlight's side of the stack brighter at the top, rust streaks down
        const gr = g.createLinearGradient(0, q[2][1], 0, q[0][1]); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.35)'); g.fillStyle = gr; g.beginPath(); q.forEach((v, ii) => (ii ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); g.closePath(); g.fill();
      }
    }
    // the floodlight's light hanging in the rain round it
    { const f = cam.project(...this.flood), gr = g.createRadialGradient(f[0], f[1], 0, f[0], f[1], W * 0.4); gr.addColorStop(0, 'rgba(200,210,225,0.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    // the road
    this.ground.draw(g, cam, [0.85 + 0.15 * noise1(t * 7, 3)]);
    // the hut: a prefab cabin, its window lit, a television flickering inside
    const Hh = this.hut;
    box(g, cam, Hh.x0, 0, Hh.z0, Hh.x1, Hh.h, Hh.z1, '#1c1f21', '#141619', '#101112');
    quad(g, cam, [[Hh.x0 - 0.15, Hh.h, Hh.z0 - 0.2], [Hh.x1 + 0.15, Hh.h, Hh.z0 - 0.2], [Hh.x1 + 0.15, Hh.h + 0.12, Hh.z0 - 0.2], [Hh.x0 - 0.15, Hh.h + 0.12, Hh.z0 - 0.2]], '#151618');
    const tv = 0.7 + 0.3 * noise1(t * 9, 5);
    const wq = quad(g, cam, [[3.25, 1.05, Hh.z0 - 0.01], [4.4, 1.05, Hh.z0 - 0.01], [4.4, 1.95, Hh.z0 - 0.01], [3.25, 1.95, Hh.z0 - 0.01]], '#d49a58');
    if (wq) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(90,120,180,${(0.3 * tv).toFixed(3)})`; g.fill(); g.restore(); g.fillStyle = 'rgba(30,20,14,0.5)'; g.fillRect(wq[0][0], wq[2][1], (wq[1][0] - wq[0][0]) * 0.35, wq[0][1] - wq[2][1]); }
    // the barrier: a striped pole on a post, across the road
    const pole = [[-4.6, 1.0, 22.6], [2.5, 1.0, 22.6]];
    quad(g, cam, [[2.4, 0, 22.5], [2.75, 0, 22.5], [2.75, 1.15, 22.5], [2.4, 1.15, 22.5]], '#3d3d3b');
    for (let i = 0; i < 14; i++) { const a = v3.lerp(pole[0], pole[1], i / 14), b = v3.lerp(pole[0], pole[1], (i + 1) / 14); quad(g, cam, [[a[0], 0.95, 22.6], [b[0], 0.95, 22.6], [b[0], 1.05, 22.6], [a[0], 1.05, 22.6]], i % 2 ? '#c8c2b8' : '#8a1d18'); }
    // the floodlight on its pole, a disc of glare
    { const p0 = cam.project(this.flood[0], 0, this.flood[2]), p1 = cam.project(...this.flood); g.strokeStyle = '#0d0e0f'; g.lineWidth = Math.max(1, 0.18 * p0[3]); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke();
      glow(g, p1[0], p1[1], p1[3] * 2.4, '#c8d4e0', 0.35); glow(g, p1[0], p1[1], p1[3] * 0.35, '#ffffff', 1); }
    // reflections of the lights in the wet road
    reflect(g, cam, this.flood, 0, '#c8d4e0', 0.4, 0.5, t);
    reflect(g, cam, [3.8, 1.5, Hh.z0], 0, '#d49a58', 0.35, 1.0, t);
    // the sentries, dark, rimmed by the floodlight; their visors
    const fq = cam.project(...this.flood);
    for (const s of [this.sentry2, this.sentry1]) {
      const q = cam.project(s.x, 1.2, s.z);
      s.draw(g, cam, [{ dir: [fq[0] - q[0], fq[1] - q[1]], col: 'rgba(210,220,235,0.7)', w: 0.8, soft: 0.5 }, { dir: [1, 0], col: 'rgba(230,160,90,0.4)', w: 0.6, soft: 0.5, at: [wq ? wq[0][0] : 0, wq ? wq[0][1] : 0], fall: W * 0.15 }], { body: '#0a0a0b', far: '#08080a', visor: 0.8 });
    }
    // the edge of the container we hide behind, out of focus, left of frame
    { const a = cam.project(-1.25, -1, 0.4), b = cam.project(-1.25, 4, 0.4); g.save(); g.filter = `blur(${(W * 0.012).toFixed(1)}px)`; g.fillStyle = '#0b0a0a'; g.fillRect(-W * 0.1, b[1], a[0] + W * 0.1, a[1] - b[1]); g.fillStyle = 'rgba(160,110,80,0.25)'; g.fillRect(a[0] - W * 0.01, b[1], W * 0.008, a[1] - b[1]); g.restore(); }
    this.rain.draw(g, cam, { col: '#c4cbd4', light: 0.6, tint: (x, y, z) => { const d2 = (x - this.flood[0]) ** 2 + (y - this.flood[1]) ** 2 + (z - this.flood[2]) ** 2; return d2 < 120 ? ['#e6eef8', clamp(30 / (d2 + 10))] : null; } });
  }
  post() { return { grain: 0.085, halation: 0.45, lift: [5, 5, 6], warm: 0.03, cool: 0.06, vignette: 0.6, dirt: 0.5, flicker: 0.02 }; }
}

// ---------------------------------------------------------------------------------------------
// m2: the market at dawn. A wet market street from low down: shutters half
// up, stalls under tarps, crates; over a stall up the street the HAWK sign,
// half its tubes dead and one stuttering; the sky going grey-blue, a sodium
// lamp not yet off, puddles holding the sky. A slow pan right.
export class Market {
  init(W, H, env) {
    this.W = W; this.H = H; this.env = env;
    const cam = this.cam = new Cam(W, H);
    cam.mm = 40; cam.pos = [0.2, 1.62, 0]; cam.pitch = 0.11; cam.yaw = -0.06; cam.hand = 0.3; cam.seed = 121; cam.update(0);
    const A = asphalt(12, { lanes: 1.2 });
    this.ground = new Ground(cam, {
      mat: A.mat, height: A.height, scale: 0.55, zMax: 70, lazy: true,
      lights: [{ p: [-3.2, 6, 14], K: 2000, I: 60 }],
      mirror: [{ p: [-3.2, 6, 14], r: 0.3, K: 2000, I: 2 }, { p: [1.5, 4.2, 18], r: 0.9, col: [0.95, 0.35, 0.2], I: 1.2 }],
      sky: [0.06, 0.07, 0.09], amb: [0.012, 0.013, 0.016], haze: { d: 55, c: [0.03, 0.034, 0.042] },
    });
    this.rain = new Rain({ n: [260, 90, 6], box: [8, 6, 0.5, 30], speed: 7, wind: 0.2, seed: 123 });
    this.r = rng(124);
  }
  prepare(ms) { this.ground.step(ms); }
  update(dt, t) { const cam = this.cam; cam.yaw = -0.08 + smooth(0, 17, t) * 0.06; cam.update(t); this.rain.update(dt, cam, 0, true); }
  // the sign's letters: H A W K, some tubes dead, one stuttering
  sign(t) { const s = Math.floor(t * 12), k = (Math.sin(s * 12.9898) * 43758.5453 % 1 + 1) % 1; return [1, k > 0.35 ? 1 : 0.1, 0, 1]; }
  // the street behind, drawn plainly and then thrown out of focus
  drawStreet(g, t) {
    const W = this.W, H = this.H, cam = this.cam, r = rng(125);
    // dawn: the sky over the roofs, grey-blue, a warm band low down
    const hz = cam.project(0, cam.pos[1], 1e4)[1];
    const sk = g.createLinearGradient(0, 0, 0, hz); sk.addColorStop(0, '#2b3442'); sk.addColorStop(0.7, '#56606c'); sk.addColorStop(1, '#8a7c70'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
    // buildings both sides: shop fronts, shutters, signs, balconies
    for (const side of [-1, 1]) for (let z = 3; z < 60; z += 4.5 + r() * 2) {
      const x = side * 4.2, h = 9 + r() * 7, d = 4.3;
      const f = `rgb(${46 + r() * 20 | 0},${44 + r() * 16 | 0},${44 + r() * 14 | 0})`;
      quad(g, cam, [[x, 0, z], [x, 0, z + d], [x, h, z + d], [x, h, z]], f);
      // the shutter on the ground floor, half up, the dark shop behind
      const up = 0.6 + r() * 1.2;
      quad(g, cam, [[x - side * 0.01, 0, z + 0.4], [x - side * 0.01, 0, z + d - 0.4], [x - side * 0.01, up, z + d - 0.4], [x - side * 0.01, up, z + 0.4]], '#0d0c0c');
      const q = quad(g, cam, [[x - side * 0.02, up, z + 0.4], [x - side * 0.02, up, z + d - 0.4], [x - side * 0.02, 2.8, z + d - 0.4], [x - side * 0.02, 2.8, z + 0.4]], '#6c6a66');
      if (q) { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; for (let y = up; y < 2.8; y += 0.08) { const a = cam.project(x, y, z + 0.4), b = cam.project(x, y, z + d - 0.4); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
      // windows above, a few lit warm, a balcony rail
      for (let fl = 1; fl < h / 3 - 0.5; fl++) for (let w = 0; w < 2; w++) {
        const lit = r() < 0.15, zz = z + 0.8 + w * 1.9, y = fl * 3 + 0.6;
        quad(g, cam, [[x - side * 0.01, y, zz], [x - side * 0.01, y, zz + 1.1], [x - side * 0.01, y + 1.4, zz + 1.1], [x - side * 0.01, y + 1.4, zz]], lit ? '#c48a52' : '#2a2e34');
      }
    }
    this.ground.draw(g, cam, []);
    // stalls in the street: frames under wet tarps, crates stacked
    for (const [x, z, w] of [[-2.2, 7, 2.4], [2.0, 11, 2.2], [-2.0, 16, 2.6], [1.6, 18.5, 2.2], [-2.4, 26, 2.6]]) {
      const top = 2.2;
      for (const [dx, dz] of [[0, 0], [w, 0], [0, 1.6], [w, 1.6]]) { const a = cam.project(x + dx, 0, z + dz), b = cam.project(x + dx, top, z + dz); g.strokeStyle = '#1a1a1a'; g.lineWidth = Math.max(1, 0.04 * a[3]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
      // the tarp, sagging with water, catching the sky
      const tq = quad(g, cam, [[x - 0.15, top, z - 0.15], [x + w + 0.15, top, z - 0.15], [x + w + 0.15, top - 0.6, z - 0.25], [x - 0.15, top - 0.6, z - 0.25]], '#3c4a5c');
      if (tq) { const gr = g.createLinearGradient(0, tq[0][1], 0, tq[2][1]); gr.addColorStop(0, 'rgba(160,175,190,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fill(); }
      // crates and a table cloth, wet
      for (let i = 0; i < 3; i++) box(g, cam, x + 0.2 + i * 0.7, 0, z + 0.1, x + 0.8 + i * 0.7, 0.45 + (i % 2) * 0.45, z + 0.6, '#4a3a2a', '#3a2c20', '#5a4834');
      quad(g, cam, [[x, 0.9, z + 0.6], [x + w, 0.9, z + 0.6], [x + w, 0.35, z + 0.62], [x, 0.35, z + 0.62]], '#7a2a24');
    }
    // the HAWK sign over the stall up the street: tubes on a black box
    { const s = this.sign(t), x0 = 0.3, y0 = 4.0, z0 = 18.2;
      box(g, cam, x0 - 0.2, y0 - 0.2, z0, x0 + 2.6, y0 + 0.75, z0 + 0.25, '#121212', '#0e0e0e', null);
      const L = ['H', 'A', 'W', 'K'];
      L.forEach((ch, i) => { const q = cam.project(x0 + 0.3 + i * 0.6, y0 + 0.28, z0 - 0.02); const on = s[i]; g.save(); g.font = `700 ${Math.round(0.55 * q[3])}px Rajdhani, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = on > 0.5 ? '#ffb090' : 'rgba(80,40,30,0.8)'; g.fillText(ch, q[0], q[1]); if (on > 0.5) { g.globalCompositeOperation = 'lighter'; glow(g, q[0], q[1], 0.6 * q[3], '#ff5a30', 0.35 * on); } g.restore(); });
      reflect(g, cam, [x0 + 1.2, y0 + 0.3, z0], 0, '#ff6a40', 0.3, 1.4, t);
    }
    // the sodium lamp, still on in the grey light
    { const p = cam.project(-3.2, 6, 14), b = cam.project(-3.9, 6.2, 14); g.strokeStyle = '#141414'; g.lineWidth = Math.max(1, 0.05 * p[3]); g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(p[0], p[1]); g.stroke(); glow(g, p[0], p[1], p[3] * 1.4, '#ffa050', 0.4); glow(g, p[0], p[1], p[3] * 0.12, '#fff0d0', 1); }
    reflect(g, cam, [-3.2, 6, 14], 0, '#ffa050', 0.3, 0.4, t);
    this.rain.draw(g, cam, { col: '#d0d6de', light: 0.35 });
  }
  draw(g, t) {
    const W = this.W, H = this.H, cam = this.cam;
    // focus is on the tarp's edge a metre away: the street is a blur of shapes and lights
    const b = this.back || (this.back = canvas(W, H)), bg = b.getContext('2d');
    bg.setTransform(1, 0, 0, 1, 0, 0); bg.globalCompositeOperation = 'source-over'; bg.globalAlpha = 1; bg.filter = 'none';
    this.drawStreet(bg, t);
    g.save(); g.filter = `blur(${(W * 0.009).toFixed(1)}px)`; g.drawImage(b, 0, 0); g.restore();
    // the lights out there as the lens sees them: discs
    const s = this.sign(t);
    ['H', 'A', 'W', 'K'].forEach((ch, i) => { if (s[i] < 0.5) return; const q = cam.project(0.6 + i * 0.6, 4.28, 18.18); bokeh(g, q[0], q[1], W * 0.018, '#ff6a40', 0.35); });
    { const q = cam.project(-3.2, 6, 14); bokeh(g, q[0], q[1], W * 0.03, '#ffa860', 0.6); }
    // the tarp over us: its front edge across the top of the frame, sagging between
    // the ties; water running to the low points and dripping off
    const tz = 1.1, edge = (x) => 1.86 - 0.07 * Math.cos((x + 0.1) * 2.2) - 0.025 * Math.sin(x * 7.1);
    const pts = []; for (let x = -1.6; x <= 1.6; x += 0.05) pts.push(cam.project(x, edge(x), tz));
    g.beginPath(); g.moveTo(pts[0][0], -10); pts.forEach((v) => g.lineTo(v[0], v[1])); g.lineTo(pts[pts.length - 1][0], -10); g.closePath();
    const tg = g.createLinearGradient(0, 0, 0, pts[20][1]); tg.addColorStop(0, '#1d2733'); tg.addColorStop(0.8, '#2f3c4c'); tg.addColorStop(1, '#4c5d70'); g.fillStyle = tg; g.fill();
    // the hem: a doubled strip, its eyelets, the sky's light along the wet edge
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.beginPath(); pts.forEach((v, i) => (i ? g.lineTo(v[0], v[1] - 6) : g.moveTo(v[0], v[1] - 6))); g.stroke();
    g.strokeStyle = 'rgba(190,205,220,0.55)'; g.lineWidth = 1.2; g.beginPath(); pts.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); g.stroke();
    for (let x = -1.4; x < 1.6; x += 0.45) { const q = cam.project(x, edge(x) + 0.04, tz); g.strokeStyle = 'rgba(160,160,150,0.7)'; g.lineWidth = 1.5; g.beginPath(); g.arc(q[0], q[1], 0.012 * q[3], 0, TAU); g.stroke(); }
    // drops gathering at the low points and letting go
    for (const [x0, per, ph] of [[-0.1, 0.9, 0], [0.62, 1.3, 0.4], [-0.82, 1.7, 0.9], [1.15, 1.1, 0.2]]) {
      const y0 = edge(x0), k = ((t + ph) % per) / per;
      const hang = cam.project(x0, y0 - 0.006 - Math.min(1, k * 1.6) * 0.008, tz), rr = (0.004 + Math.min(1, k * 1.6) * 0.004) * hang[3];
      if (k < 0.62) { g.fillStyle = 'rgba(200,215,230,0.55)'; g.beginPath(); g.ellipse(hang[0], hang[1], rr * 0.8, rr, 0, 0, TAU); g.fill(); glow(g, hang[0] - rr * 0.2, hang[1] - rr * 0.3, rr * 0.5, '#ffffff', 0.7); }
      else { const ft = (k - 0.62) * per, y = y0 - 4.9 * ft * ft, a = cam.project(x0, y, tz), e = cam.project(x0, y + 9.8 * ft / 48, tz); g.strokeStyle = 'rgba(210,225,240,0.6)'; g.lineWidth = Math.max(1, 0.005 * a[3]); g.beginPath(); g.moveTo(e[0], e[1]); g.lineTo(a[0], a[1]); g.stroke(); }
    }
    this.rain.draw(g, cam, { col: '#d0d6de', light: 0.3 });
  }
  post() { return { grain: 0.07, halation: 0.3, lift: [8, 9, 11], warm: 0.0, cool: 0.08, vignette: 0.5, dirt: 0.4, flicker: 0.015 }; }
}

// ---------------------------------------------------------------------------------------------
// m3: the governor's building. From the foot of its steps, 28 mm, tilting up
// slowly: six columns, the pediment, the Syndicate's banners hanging between
// the columns and moving in the wind, wet marble steps throwing the light
// back, a searchlight crossing; one window lit above the door. Two sentries
// at the top of the steps.
export class Governor {
  init(W, H, env) {
    this.W = W; this.H = H; this.env = env;
    const cam = this.cam = new Cam(W, H);
    cam.mm = 28; cam.pos = [0.3, 1.0, 0]; cam.pitch = 0.12; cam.hand = 0.4; cam.seed = 131; cam.update(0);
    this.Z = 16; // the facade
    this.banners = [-4.5, -1.5, 1.5, 4.5].map((x, i) => ({ x, ph: i * 1.3 }));
    this.sentries = [new Human({ kit: 'vanta', x: -2.6, y: 2.4, z: this.Z - 2.2, yaw: -Math.PI / 2, seed: 141 }), new Human({ kit: 'vanta', x: 3.0, y: 2.4, z: this.Z - 2.2, yaw: -Math.PI / 2 + 0.2, seed: 142 })];
    this.rain = new Rain({ n: [900, 380, 40], box: [9, 9, 0.5, 30], speed: 8.6, wind: 0.5, seed: 133 });
    this.cloud = softEdges(fogTexture(256, 64, 134, 4));
  }
  update(dt, t) { const cam = this.cam; cam.pitch = 0.12 + smooth(0, 16, t) * 0.1; cam.update(t); for (const s of this.sentries) s.step(dt); this.rain.update(dt, cam, 0, true); }
  draw(g, t) {
    const W = this.W, H = this.H, cam = this.cam, Z = this.Z;
    const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, '#08090c'); sk.addColorStop(1, '#1a1612'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = 0.14; g.drawImage(this.cloud, -W * 0.2, 0, W * 1.4, H * 0.5); g.restore();
    // the searchlight crossing the cloud
    { const th = 1.9 + Math.sin(t * 0.3) * 0.6; beam(g, cam, [12, 22, Z + 30], norm([Math.cos(th), 0.55, Math.sin(th) * 0.4 - 0.4]), 0.03, 300, 6500, 0.5, this.cloud, t); }
    // the steps: twelve treads up to the portico, each catching a line of light
    const top = 2.4, n = 12, z0 = Z - 2 - n * 0.35;
    for (let i = n - 1; i >= 0; i--) {
      const y0 = (i / n) * top, y1 = ((i + 1) / n) * top, zf = z0 + i * 0.35;
      quad(g, cam, [[-8, y0, zf], [8, y0, zf], [8, y1, zf], [-8, y1, zf]], '#141312');
      const q = quad(g, cam, [[-8, y1, zf], [8, y1, zf], [8, y1, zf + 0.35], [-8, y1, zf + 0.35]], '#1f1d1b');
      if (q) { g.fillStyle = 'rgba(255,200,140,0.06)'; g.fill(); g.strokeStyle = 'rgba(255,220,180,0.18)'; g.lineWidth = 1; g.beginPath(); g.moveTo(q[0][0], q[0][1]); g.lineTo(q[1][0], q[1][1]); g.stroke(); }
    }
    // the facade: the wall, the door, the lit window, the pediment
    { const q = quad(g, cam, [[-9, top, Z], [9, top, Z], [9, top + 11, Z], [-9, top + 11, Z]], '#1c1a18');
      // the floods at the foot of the wall throw their light up it
      if (q) { const gr = g.createLinearGradient(0, q[0][1], 0, q[2][1]); gr.addColorStop(0, 'rgba(255,170,100,0.16)'); gr.addColorStop(0.35, 'rgba(120,80,50,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fill(); } }
    quad(g, cam, [[-1.2, top, Z - 0.01], [1.2, top, Z - 0.01], [1.2, top + 4.2, Z - 0.01], [-1.2, top + 4.2, Z - 0.01]], '#121110');
    const wq = quad(g, cam, [[-0.9, top + 6, Z - 0.01], [0.9, top + 6, Z - 0.01], [0.9, top + 8.2, Z - 0.01], [-0.9, top + 8.2, Z - 0.01]], '#e0a060');
    if (wq) { const c0 = [(wq[0][0] + wq[1][0]) / 2, (wq[0][1] + wq[2][1]) / 2]; glow(g, c0[0], c0[1], (wq[1][0] - wq[0][0]) * 1.4, '#ff9a50', 0.25); }
    if (wq) { g.fillStyle = 'rgba(60,30,18,0.55)'; g.fillRect(wq[0][0], wq[2][1], (wq[1][0] - wq[0][0]) * 0.3, wq[0][1] - wq[2][1]); }
    for (const x of [-6, -3.6, 3.6, 6]) quad(g, cam, [[x - 0.6, top + 6, Z - 0.01], [x + 0.6, top + 6, Z - 0.01], [x + 0.6, top + 8.2, Z - 0.01], [x - 0.6, top + 8.2, Z - 0.01]], '#151719');
    quad(g, cam, [[-9.5, top + 11, Z - 2.5], [9.5, top + 11, Z - 2.5], [0, top + 14, Z - 2.5]], '#141210');
    quad(g, cam, [[-9.5, top + 10.3, Z - 2.5], [9.5, top + 10.3, Z - 2.5], [9.5, top + 11, Z - 2.5], [-9.5, top + 11, Z - 2.5]], '#2a2622');
    // the banners between the columns, moving with the wind (a few folds)
    for (const b of this.banners) {
      const zb = Z - 0.3, w = 1.3, h = 7.5, y1 = top + 10, sw = Math.sin(t * 0.9 + b.ph) * 0.15;
      const pts = []; for (let i = 0; i <= 12; i++) { const k = i / 12, off = Math.sin(k * 3 + t * 1.6 + b.ph) * 0.12 * k + sw * k; pts.push([b.x + off, y1 - k * h, zb - Math.abs(off) * 0.4]); }
      const L = pts.map((p) => cam.project(p[0] - w / 2, p[1], p[2])), R = pts.map((p) => cam.project(p[0] + w / 2, p[1], p[2]));
      g.beginPath(); L.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); [...R].reverse().forEach((v) => g.lineTo(v[0], v[1])); g.closePath();
      // folds across the width, lit from below: brighter at the foot
      const gr = g.createLinearGradient(L[0][0], 0, R[0][0], 0); gr.addColorStop(0, '#1a0606'); gr.addColorStop(0.2, '#4a0e0c'); gr.addColorStop(0.42, '#2a0807'); gr.addColorStop(0.6, '#561210'); gr.addColorStop(0.82, '#300908'); gr.addColorStop(1, '#160505'); g.fillStyle = gr; g.fill();
      const ug = g.createLinearGradient(0, L[L.length - 1][1], 0, L[0][1]); ug.addColorStop(0, 'rgba(255,150,90,0.3)'); ug.addColorStop(0.5, 'rgba(0,0,0,0)'); g.fillStyle = ug; g.fill();
      // the mark on it: a ring cut by a chevron
      const m = cam.project(b.x + sw * 0.4, y1 - h * 0.35, zb - 0.02); g.strokeStyle = 'rgba(220,210,190,0.7)'; g.lineWidth = Math.max(1, 0.06 * m[3]); g.beginPath(); g.arc(m[0], m[1], 0.35 * m[3], 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(m[0] - 0.25 * m[3], m[1] - 0.1 * m[3]); g.lineTo(m[0], m[1] + 0.2 * m[3]); g.lineTo(m[0] + 0.25 * m[3], m[1] - 0.1 * m[3]); g.stroke();
    }
    // the columns, lit from below by the lamps at the foot of the steps
    for (const x of [-7.5, -4.5 + 1.5, -1.5 - 1.5, 1.5 + 1.5, 4.5 - 1.5, 7.5]) {
      const cz = Z - 2.2, a = cam.project(x - 0.45, top, cz), b = cam.project(x + 0.45, top, cz), c = cam.project(x + 0.4, top + 10.3, cz), d = cam.project(x - 0.4, top + 10.3, cz);
      const gr = g.createLinearGradient(a[0], 0, b[0], 0); gr.addColorStop(0, '#0a0908'); gr.addColorStop(0.35, '#2e2822'); gr.addColorStop(0.7, '#1a1714'); gr.addColorStop(1, '#080706');
      g.fillStyle = gr; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fill();
      const ug = g.createLinearGradient(0, a[1], 0, d[1]); ug.addColorStop(0, 'rgba(255,180,110,0.38)'); ug.addColorStop(0.3, 'rgba(255,160,90,0.06)'); ug.addColorStop(1, 'rgba(0,0,0,0.6)'); g.fillStyle = ug; g.fill();
      // fluting: vertical shadows down the shaft
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; for (let f = 1; f < 6; f++) { const u = f / 6; g.beginPath(); g.moveTo(a[0] + (b[0] - a[0]) * u, a[1]); g.lineTo(d[0] + (c[0] - d[0]) * u, d[1]); g.stroke(); }
    }
    // the sentries at the top of the steps
    for (const s of this.sentries) s.draw(g, cam, [{ dir: [0, 1], col: 'rgba(255,190,120,0.5)', w: 0.8, soft: 0.5 }], { body: '#0b0b0c', far: '#09090a', visor: 0.8 });
    // the lamps at the foot of the steps, their light in the wet marble
    for (const x of [-6.5, 6.5]) { const p = cam.project(x, 3.2, z0 - 0.5), b = cam.project(x, 0, z0 - 0.5); g.strokeStyle = '#121110'; g.lineWidth = Math.max(1, 0.12 * b[3]); g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(p[0], p[1]); g.stroke(); glow(g, p[0], p[1], p[3] * 1.2, '#ffb070', 0.4); glow(g, p[0], p[1], p[3] * 0.15, '#fff2d8', 1); reflect(g, cam, [x, 3.2, z0 - 0.5], 0, '#ffb070', 0.3, 0.5, t); }
    this.rain.draw(g, cam, { col: '#c9c2b8', light: 0.55 });
  }
  post() { return { grain: 0.085, halation: 0.5, lift: [3, 3, 4], warm: 0.05, vignette: 0.7, dirt: 0.5, flicker: 0.02 }; }
}

// ---------------------------------------------------------------------------------------------
// end of act 1: under a desk lamp, a typed document with KÜL PLANI across its
// head, stamped; beside it a phone face up, buzzing, HAWK on its screen; it
// creeps across the wood with each buzz. Nobody answers it.
export class Plan extends Basement {
  init(W, H, env) {
    this.mapR = { cx: -0.08, cz: 0.02, w: 0.3, h: 0.42, rot: -0.07 };
    this.rings = [[0.36, 0.18, 0.045, 0.4]]; this.noNotes = true;
    this.bakeMM = 40;
    super.init(W, H, env);
    this.phone = [0.26, TYP + 0.005, -0.05];
  }
  setCam(cam) { cam.mm = 40; cam.pos = [0.05, 1.5, -0.7]; cam.pitch = -0.8; cam.yaw = -0.02; cam.hand = 0.15; }
  // a desk lamp low over the paper, still; its bulb flickers a hair
  lamp(t) { return { p: [-0.32, TYP + 0.48, 0.18], axis: norm([0.55, -1, -0.35]), I: 0.42 * (0.98 + 0.02 * noise1(t * 30, 3)), cos0: 0.5, cos1: 0.78 }; }
  paintMap(r) {
    const S = 1600, w = Math.round(this.mapR.w * S), h = Math.round(this.mapR.h * S), c = canvas(w, h), g = c.getContext('2d');
    g.fillStyle = '#d9d3c4'; g.fillRect(0, 0, w, h);
    // the letterhead: the Syndicate's ring and chevron, a reference number
    g.strokeStyle = '#2a2a2a'; g.lineWidth = 3; g.beginPath(); g.arc(w * 0.12, h * 0.07, 18, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(w * 0.12 - 12, h * 0.07 - 6); g.lineTo(w * 0.12, h * 0.07 + 10); g.lineTo(w * 0.12 + 12, h * 0.07 - 6); g.stroke();
    g.fillStyle = '#2a2a2a'; g.font = '500 14px "Courier New", monospace'; g.fillText('VANTA SENDİKASI — KAMU DÜZENİ DAİRESİ', w * 0.2, h * 0.065); g.fillText('Sayı: VS/KD-0417          Tarih: 03.11', w * 0.2, h * 0.09);
    g.font = '700 46px "Courier New", monospace'; g.fillText('KÜL PLANI', w * 0.1, h * 0.19);
    g.font = '500 15px "Courier New", monospace';
    const lines = ['Konu: 3 No\'lu Yüksek Fırın ve Liman Sahası', '', '1. Çelikhane tesisleri, ekli sözleşme ile', '   Sendika iştiraklerine devredilmiştir.', '2. Fırınların yeniden yakılması yasaktır.', '3. Liman rıhtımı 1 Aralık\'tan itibaren', '   kamuya kapatılacaktır.', '4. Eski işçilerin mahalledeki toplanma', '   yerleri tespit edilecek ve...', '', '   (devamı ekte)'];
    lines.forEach((l, i) => g.fillText(l, w * 0.1, h * 0.27 + i * 24));
    // a signature and a red stamp, a little crooked
    g.strokeStyle = 'rgba(20,30,80,0.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(w * 0.55, h * 0.86); g.bezierCurveTo(w * 0.6, h * 0.8, w * 0.66, h * 0.92, w * 0.72, h * 0.84); g.bezierCurveTo(w * 0.76, h * 0.8, w * 0.8, h * 0.88, w * 0.86, h * 0.85); g.stroke();
    g.save(); g.translate(w * 0.72, h * 0.72); g.rotate(-0.18); g.strokeStyle = 'rgba(170,30,26,0.75)'; g.lineWidth = 4; g.strokeRect(-90, -26, 180, 52); g.fillStyle = 'rgba(170,30,26,0.75)'; g.font = '700 30px "Courier New", monospace'; g.textAlign = 'center'; g.fillText('GİZLİDİR', 0, 10); g.restore();
    // paper: fibres, a coffee drip, the corner turned
    const img = g.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const k = 0.93 + Math.random() * 0.07; d[i] *= k; d[i + 1] *= k; d[i + 2] *= k * 0.98; }
    g.putImageData(img, 0, 0);
    g.strokeStyle = 'rgba(120,80,40,0.35)'; g.lineWidth = 3; g.beginPath(); g.arc(w * 0.85, h * 0.12, 30, 0.4, 5.4); g.stroke();
    return { c, data: g.getImageData(0, 0, w, h).data, w, h, S };
  }
  update(dt, t) { this.cam.update(t); }
  pose() { return {}; }
  // the phone: a slab, its screen lit with the caller; it buzzes in bursts
  buzz(t) { const p = t % 2.4; return p < 0.9 ? Math.sin(p * 120) * (1 - p / 0.9) : 0; }
  things() {
    const cam = this.cam, draw = [], near = [], shadows = [], t = this.tNow || 0;
    const creep = Math.floor(t / 2.4) * 0.006 + (t % 2.4 < 0.9 ? (t % 2.4) / 0.9 * 0.006 : 0.006);
    const P0 = add(this.phone, [-creep * 0.5, 0, creep]), j = this.buzz(t) * 0.0015;
    const c = add(P0, [j, 0, 0]), X = [0.038, 0, 0.004], Y = [0, 0.0045, 0], Z = [-0.004, 0, 0.078];
    shadows.push(boxPts(c, X, Y, Z));
    draw.push((g, L) => {
      box3(g, cam, c, X, Y, Z, L, [20, 20, 22], 0.05);
      // the screen: the caller's name, the green and red buttons
      const s = [add(c, [-0.034, 0.0046, -0.07]), add(c, [0.034, 0.0046, -0.07]), add(c, [0.034, 0.0046, 0.07]), add(c, [-0.034, 0.0046, 0.07])].map((p) => cam.project(...p));
      g.fillStyle = '#0d1a1e'; g.beginPath(); s.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); g.closePath(); g.fill();
      const mid = cam.project(...add(c, [0, 0.005, 0.03])), k = mid[3];
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(80,140,150,0.35)'; g.fill(); g.restore();
      g.fillStyle = '#e8f2f4'; g.font = `600 ${Math.max(6, 0.012 * k) | 0}px Inter, sans-serif`; g.textAlign = 'center'; g.fillText('HAWK', mid[0], mid[1]);
      g.font = `400 ${Math.max(5, 0.006 * k) | 0}px Inter, sans-serif`; g.fillStyle = 'rgba(220,235,238,0.7)'; g.fillText('arıyor…', mid[0], mid[1] + 0.012 * k);
      for (const [dx, col] of [[-0.018, '#3ec46a'], [0.018, '#e0473c']]) { const b = cam.project(...add(c, [dx, 0.005, -0.045])); g.fillStyle = col; g.beginPath(); g.arc(b[0], b[1], 0.006 * b[3], 0, TAU); g.fill(); }
      // its light on the table round it
      const q = cam.project(...c); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.18; g.drawImage(tinted(softDot(64), '#6fc8d0'), q[0] - 0.12 * q[3], q[1] - 0.08 * q[3], 0.24 * q[3], 0.16 * q[3]); g.restore();
    });
    // a pen across the paper, a glass with an inch of tea
    const pen = [[-0.02, TYP + 0.005, -0.2], [0.11, TYP + 0.005, -0.12]];
    shadows.push(capsulePts(pen[0], pen[1], 0.005, 0.004));
    draw.push((g, L) => capsule3(g, cam, pen[0], pen[1], 0.005, 0.004, L, [20, 20, 40], 0.05));
    return { draw, near, shadows };
  }
  draw(g, t) { this.tNow = t; super.draw(g, t); }
  post() { return { grain: 0.08, halation: 0.45, lift: [6, 5, 4], warm: 0.08, vignette: 0.7, dirt: 0.35, flicker: 0.015 }; }
}
const TYP = 0.78;
