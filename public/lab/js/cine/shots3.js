// KOR — cinematics: the scenes before the missions (docs/KOR_STORY_CINEMATIC.md §4).
// One shot each, under a few lines of radio.
import { Cam } from './cam.js';
import { Rain, Puffs, softDot, tinted, glow, reflect } from './fx.js';
import { canvas, noise1, clamp, smooth, fogTexture } from './noise.js';
import { softEdges } from './city.js';
import { v3, lit, capsule3, box3, capsulePts, boxPts } from './solid.js';
import { Basement } from './shots2.js';
import { PLATES, Plate } from './plates.js';

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
// m1: the gate into the port at night, from behind a container, on a 50 mm,
// creeping in. The road, the barrier, the guard hut, the floodlight's cone in
// the rain, the stacks and the lamps down the road into the mist are a
// ray-traced plate (plates.js; tools/lab/plate/scenes.js). Live on it: the
// television's light jumping in the hut window (the two of them are in
// there), the heater's breath off the hut, the rain (bright where it falls
// through the cone), the edge of our container, out of focus.
export class Gate {
  init(W, H, env) {
    this.W = W; this.H = H; this.env = env;
    const P = PLATES.gate, cam = this.cam = new Cam(W, H);
    cam.mm = P.mm; cam.pos = P.pos.slice(); cam.yaw = P.yaw; cam.pitch = P.pitch; cam.hand = 0.45; cam.seed = 101; cam.update(0);
    this.plate = new Plate('gate'); this.ready = this.plate.ready;
    this.flood = [5.22, 7.3, 26.1]; this.axis = norm([-0.55, -1, -0.45]);
    this.vent = [5.97, 1.85, 24.6];
    this.breath = new Puffs({ rate: 7, life: 3.4, rise: 0.35, grow: 0.7, size: 0.12, col: '#c9ccd2', a: 0.09, seed: 115, lumpy: true });
    for (let i = 0; i < 70; i++) this.breath.update(0.05, [this.vent], 0.3);
    this.rain = new Rain({ n: [1100, 400, 40], box: [9, 8, 0.5, 40], speed: 8.6, wind: 0.6, seed: 113 });
  }
  update(dt, t) {
    const cam = this.cam; cam.mm = PLATES.gate.mm * (1 + smooth(0, 16, t) * 0.08); cam.update(t);
    this.breath.update(dt, [this.vent], 0.3);
    this.rain.update(dt, cam, 0, true);
  }
  // how far into the floodlight's cone a point is (0 outside)
  cone(x, y, z) {
    const F = this.flood, dx = x - F[0], dy = y - F[1], dz = z - F[2], d = Math.hypot(dx, dy, dz) || 1;
    const c = (dx * this.axis[0] + dy * this.axis[1] + dz * this.axis[2]) / d;
    return smooth(Math.cos(0.64), Math.cos(0.36), c) * clamp(60 / (d * d + 8));
  }
  draw(g, t) {
    const W = this.W, cam = this.cam;
    g.fillStyle = '#050505'; g.fillRect(0, 0, W, this.H);
    if (!this.plate.draw(g, cam)) return;
    // the television in the hut: its blue light jumping on the window
    { const q = [[3.3, 1.08], [4.35, 1.08], [4.35, 1.92], [3.3, 1.92]].map(([x, y]) => cam.project(x, y, 23.55));
      const tv = 0.55 + 0.45 * noise1(t * 9, 5) * noise1(t * 2.3, 6);
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.16 * tv;
      g.beginPath(); q.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); g.closePath();
      const gr = g.createLinearGradient(q[0][0], 0, q[1][0], 0); gr.addColorStop(0, '#5a80d0'); gr.addColorStop(1, '#1a2850'); g.fillStyle = gr; g.fill();
      g.restore(); }
    // the heater's breath off the side of the hut, lit by the floodlight
    g.save(); g.globalCompositeOperation = 'screen'; this.breath.draw(g, cam, 0.9); g.restore();
    this.rain.draw(g, cam, { col: '#c4cbd4', light: 0.5, puddle: true, tint: (x, y, z) => { const k = this.cone(x, y, z); return k > 0.02 ? ['#eef3fa', Math.min(1, k * 2.2)] : null; } });
    // the edge of the container we hide behind, out of focus, left of frame
    { const a = cam.project(-1.25, -1, 0.4), b = cam.project(-1.25, 4, 0.4);
      g.save(); g.filter = `blur(${(W * 0.012).toFixed(1)}px)`; g.fillStyle = '#090807'; g.fillRect(-W * 0.1, b[1], a[0] + W * 0.1, a[1] - b[1]);
      g.fillStyle = 'rgba(150,100,70,0.22)'; g.fillRect(a[0] - W * 0.012, b[1], W * 0.008, a[1] - b[1]); g.restore(); }
  }
  post() { return { grain: 0.085, halation: 0.5, lift: [4, 4, 5], warm: 0.02, vignette: 0.6, dirt: 0.5, flicker: 0.02 }; }
}

// ---------------------------------------------------------------------------------------------
// m2: the market at dawn, from a first-floor window across the street (where
// VESPER watches from), on a 35 mm, panning slowly right. The street — old
// houses, shutters half up, stalls under wet tarps, crates of fruit, cables
// slung across, the sodium lamp not yet off, mist down to the end where the
// sky is going pale — is a ray-traced plate. Live on it: the HAWK sign's
// tubes (W dead, K stuttering) and their red in the wet; a kettle steaming on
// a stall, someone's first tea; drizzle; drops off the lintel over our
// window; the window's edge, out of focus, at the left.
export class Market {
  init(W, H, env) {
    this.W = W; this.H = H; this.env = env;
    const P = PLATES.market, cam = this.cam = new Cam(W, H);
    cam.mm = P.mm; cam.pos = P.pos.slice(); cam.yaw = P.yaw - 0.03; cam.pitch = P.pitch; cam.hand = 0.22; cam.seed = 121; cam.update(0);
    this.plate = new Plate('market'); this.ready = this.plate.ready;
    this.kettle = [2.1, 1.05, 19.9];
    this.tea = new Puffs({ rate: 9, life: 3.0, rise: 0.45, grow: 0.5, size: 0.06, col: '#e8ecef', a: 0.12, seed: 151, lumpy: true });
    for (let i = 0; i < 60; i++) this.tea.update(0.05, [this.kettle], 0.15);
    this.rain = new Rain({ n: [500, 160, 0], box: [8, 7, 1.5, 30], speed: 6.5, wind: 0.25, seed: 123 });
    this.drops = [[0.18, 1.3, 0], [0.37, 0.9, 0.5], [0.61, 1.7, 0.2], [0.83, 1.1, 0.8]];
  }
  update(dt, t) {
    const cam = this.cam; cam.yaw = PLATES.market.yaw - 0.03 + smooth(0, 17, t) * 0.06; cam.update(t);
    this.tea.update(dt, [this.kettle], 0.15);
    this.rain.update(dt, cam, 0, true);
  }
  // the tubes: H and A on, W dead, K stuttering
  sign(t) { const s = Math.floor(t * 14), k = (Math.sin(s * 12.9898) * 43758.5453 % 1 + 1) % 1; return [1, 1, 0, k > 0.45 ? 1 : 0.05]; }
  draw(g, t) {
    const W = this.W, H = this.H, cam = this.cam;
    g.fillStyle = '#20242a'; g.fillRect(0, 0, W, H);
    if (!this.plate.draw(g, cam)) return;
    // the sign: glass tubes in letters on the black box, lit or dead; their red in the wet street
    const s = this.sign(t), c = cam.project(1.5, 4.27, 18.17), ppm = c[3];
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${Math.round(0.62 * ppm)}px Rajdhani, sans-serif`; g.lineJoin = 'round';
    ['H', 'A', 'W', 'K'].forEach((ch, i) => {
      const q = cam.project(0.45 + i * 0.68, 4.27, 18.17), on = s[i];
      g.lineWidth = Math.max(1, 0.035 * ppm);
      g.strokeStyle = on > 0.5 ? '#ffd2c0' : 'rgba(90,40,34,0.85)'; g.strokeText(ch, q[0], q[1]);
      if (on > 0.5) { glow(g, q[0], q[1], 0.75 * ppm, '#ff4a26', 0.45 * on); glow(g, q[0], q[1], 0.3 * ppm, '#ff8a60', 0.35 * on); reflect(g, cam, [0.45 + i * 0.68, 4.27, 18.17], 0, '#ff5530', 0.22 * on, 0.5, t); }
    });
    g.restore();
    // steam off the kettle under HAWK's tarp, drifting in the damp
    g.save(); g.globalCompositeOperation = 'screen'; this.tea.draw(g, cam, 1); g.restore();
    this.rain.draw(g, cam, { col: '#dfe5ec', light: 0.35 });
    // drops off the lintel over our window, close, out of focus: they gather and let go
    g.save(); g.filter = `blur(${(W * 0.004).toFixed(1)}px)`;
    for (const [x0, per, ph] of this.drops) {
      const k = ((t + ph) % per) / per, x = x0 * W;
      if (k < 0.7) { const r = W * (0.004 + 0.004 * k); g.fillStyle = 'rgba(205,215,225,0.5)'; g.beginPath(); g.ellipse(x, -r * 0.2, r * 0.8, r, 0, 0, TAU); g.fill(); }
      else { const y = ((k - 0.7) / 0.3) ** 2 * H * 1.3; g.strokeStyle = 'rgba(215,225,235,0.45)'; g.lineWidth = W * 0.004; g.beginPath(); g.moveTo(x, y - H * 0.08); g.lineTo(x, y); g.stroke(); }
    }
    g.restore();
    // the edge of our window, at the left: the frame, painted, out of focus
    g.save(); g.filter = `blur(${(W * 0.01).toFixed(1)}px)`;
    g.fillStyle = '#16181b'; g.fillRect(-W * 0.05, -H * 0.1, W * 0.085, H * 1.2);
    g.fillStyle = 'rgba(170,180,190,0.18)'; g.fillRect(W * 0.03, -H * 0.1, W * 0.006, H * 1.2);
    g.restore();
  }
  post() { return { grain: 0.07, halation: 0.3, lift: [8, 9, 11], warm: 0.0, cool: 0.05, vignette: 0.5, dirt: 0.4, flicker: 0.015 }; }
}

// ---------------------------------------------------------------------------------------------
// m3: the governor's building at night, from across the wet square, on a
// 24 mm, creeping in. The building, the steps, the square and its lamps are a
// ray-traced plate (plates.js; tools/lab/plate/scenes.js), one window lit
// over the door: his. On it, live: the banners stirring, mist drifting low
// over the square, the rain.
export class Governor {
  init(W, H, env) {
    this.W = W; this.H = H; this.env = env;
    const P = PLATES.governor, cam = this.cam = new Cam(W, H);
    cam.mm = P.mm; cam.pos = P.pos.slice(); cam.yaw = P.yaw; cam.pitch = P.pitch; cam.hand = 0.3; cam.seed = 131; cam.update(0);
    this.plate = new Plate('governor'); this.ready = this.plate.ready;
    this.rain = new Rain({ n: [1200, 420, 40], box: [10, 9, 0.5, 34], speed: 8.6, wind: 0.5, seed: 133 });
    this.mist = softEdges(fogTexture(256, 64, 134, 3));
  }
  update(dt, t) {
    const cam = this.cam;
    cam.mm = PLATES.governor.mm * (1 + smooth(0, 16, t) * 0.07); cam.update(t);
    this.rain.update(dt, cam, 0, true);
  }
  draw(g, t) {
    const W = this.W, H = this.H, cam = this.cam;
    g.fillStyle = '#060504'; g.fillRect(0, 0, W, H);
    // up from a soft focus while the plate lands (it is a local file: a frame or two)
    if (!this.plate.draw(g, cam)) return;
    this.banners(g, t);
    // the mist low over the square, drifting left
    { const hz = cam.project(0, 0, 60)[1], k = (t * 0.012) % 1;
      g.save(); g.globalAlpha = 0.07; g.globalCompositeOperation = 'screen';
      for (const o of [-1, 0]) g.drawImage(this.mist, (o + 1 - k) * W * 1.4 - W * 0.4, hz - H * 0.12, W * 1.4, H * 0.3);
      g.restore(); }
    this.rain.draw(g, cam, { col: '#c6ccd4', light: 0.55, puddle: true, tint: (x, y, z) => {
      for (const s of [-1, 1]) { const d2 = (x - s * 15.5) ** 2 + (y - 6.1) ** 2 + (z - 24.5) ** 2; if (d2 < 30) return ['#ffc890', clamp(12 / (d2 + 4))]; }
      return null; } });
  }
  // the banners stir: the plate's own pixels moved a hair, more toward the foot
  banners(g, t) {
    const P = PLATES.governor, cam = this.cam, img = this.plate.img;
    g.save(); this.plate.frame(g, cam);
    for (const s of [-1, 1]) {
      const a = this.plate.at(s * 5.2 - 1.0, 11.3, 33.86), b = this.plate.at(s * 5.2 + 1.0, 3.0, 33.86);
      const x0 = Math.floor(a[0]) - 2, x1 = Math.ceil(b[0]) + 2, y0 = Math.floor(a[1]), y1 = Math.ceil(b[1]);
      for (let y = y0; y < y1; y += 2) {
        const k = (y - y0) / (y1 - y0), dx = (Math.sin(t * 1.1 + y * 0.045 + s) * 0.55 + Math.sin(t * 2.3 + y * 0.11) * 0.25) * k * k;
        g.drawImage(img, x0, y, x1 - x0, 2, x0 + dx, y, x1 - x0, 2);
      }
    }
    g.restore();
    void P;
  }
  post() { return { grain: 0.08, halation: 0.5, lift: [3, 4, 5], warm: 0.02, vignette: 0.65, dirt: 0.45, flicker: 0.015 }; }
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
    // it came in an envelope: folded in three, the middle panel tipped away from the lamp,
    // each crease a dark line with the lit edge of the fold beside it
    g.fillStyle = 'rgba(40,30,20,0.07)'; g.fillRect(0, h / 3, w, h / 3);
    for (const fy of [h / 3, (2 * h) / 3]) {
      const y = Math.round(fy);
      g.fillStyle = 'rgba(30,22,14,0.22)'; g.fillRect(0, y - 1, w, 2);
      g.fillStyle = 'rgba(255,250,235,0.16)'; g.fillRect(0, y + 1, w, 2);
      const gr = g.createLinearGradient(0, y - 14, 0, y + 14); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.45, 'rgba(40,30,20,0.06)'); gr.addColorStop(0.55, 'rgba(255,250,235,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, y - 14, w, 28);
    }
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
