// KOR — cinematics: act 2's scenes (docs §10.31). One shot each, under a few
// lines of radio, the way act 1's are (shots3.js): the place is a ray-traced
// plate from the series' scenes (tools/game/series/scenes, cameras in
// plates.js); what moves is drawn live on it. No one is in them.
//
//   m4    the foundry's casting hall: the roof broken, dust turning in the
//         shafts of light, water coming through the gaps
//   m5    the metro's platform under the tiled vault: the low tube that will
//         not settle, water dripping off the vault onto the track
//   m6    the drone works: the frames on the line, each eye blinking its
//         red; one finished drone crossing under the light panels
//   m7    the furnace from the yard, cold, in the rain (the opening's plate)
//   act2  the same, and the furnace lighting: the plate going over to the
//         relit one, steam out of the top, sparks, the light on the wet yard
import { Cam } from './cam.js';
import { Rain, Puffs, Sparks, glow } from './fx.js';
import { rng, noise1, smooth, clamp } from './noise.js';
import { Plate, PLATES } from './plates.js';

const TAU = Math.PI * 2;

// a plate shot: the plate (and a variant to go over to), its camera, a slow push
class PlateShot {
  constructor(name, { alt = null, hand = 0.3, seed = 401, push = 0.06, dur = 16 } = {}) { this.name = name; this.o = { alt, hand, seed, push, dur }; }
  init(W, H, env) {
    this.W = W; this.H = H; this.env = env;
    const P = this.P = PLATES[this.name], cam = this.cam = new Cam(W, H);
    cam.mm = P.mm; cam.pos = P.pos.slice(); cam.yaw = P.yaw; cam.pitch = P.pitch; cam.hand = this.o.hand; cam.seed = this.o.seed; cam.update(0);
    this.plate = new Plate(this.name); this.alt = this.o.alt ? new Plate(this.o.alt) : null;
    this.ready = Promise.all([this.plate.ready, this.alt?.ready]);
    this.setup?.();
  }
  move(t) { const c = this.cam; c.mm = this.P.mm * (1 + smooth(0, this.o.dur, t) * this.o.push); c.update(t); }
  update(dt, t) { this.move(t); this.tick?.(dt, t); }
  // k: how much of the variant shows
  drawPlate(g, k = 0) {
    g.fillStyle = '#050505'; g.fillRect(0, 0, this.W, this.H);
    if (!this.plate.ok) return false;
    this.plate.draw(g, this.cam);
    if (this.alt && this.alt.ok && k > 0.004) this.alt.draw(g, this.cam, clamp(k));
    return true;
  }
}

// fine dust in a box of air, drifting; brighter where lit(p) says
class Dust {
  constructor(box, { n = 420, seed = 11, col = '235,236,238', size = 1.2, lit = () => 0.5 } = {}) {
    const r = rng(seed); this.box = box; this.col = col; this.size = size; this.lit = lit;
    this.p = Array.from({ length: n }, () => ({ x: box[0] + r() * (box[3] - box[0]), y: box[1] + r() * (box[4] - box[1]), z: box[2] + r() * (box[5] - box[2]), ph: r() * 10, a: 0.3 + r() * 0.7 }));
  }
  draw(g, cam, t) {
    const b = this.box, s = [0, 0, 0, 0];
    g.save(); g.globalCompositeOperation = 'screen';
    for (const q of this.p) {
      // a slow fall and a sway, wrapped in the box
      const y = b[1] + ((q.y - b[1] - t * 0.08 + 1000 * (b[4] - b[1])) % (b[4] - b[1])), x = q.x + Math.sin(t * 0.4 + q.ph) * 0.25, z = q.z + Math.cos(t * 0.3 + q.ph) * 0.2;
      const k = this.lit([x, y, z]); if (k <= 0.02) continue;
      cam.project(x, y, z, s); if (s[2] <= 0) continue;
      const r = Math.max(0.6, this.size * s[3] * 0.004), a = Math.min(1, 0.55 * k * q.a * (0.7 + 0.3 * Math.sin(t * 2 + q.ph)));
      g.fillStyle = `rgba(${this.col},${a.toFixed(3)})`; g.beginPath(); g.arc(s[0], s[1], r, 0, TAU); g.fill();
    }
    g.restore();
  }
}

// drops falling from points overhead, each on its own beat, a splash where they land
function drips(g, cam, t, pts, ground, col = 'rgba(210,222,235,0.6)') {
  const a = [0, 0, 0, 0], b = [0, 0, 0, 0];
  g.save(); g.lineCap = 'round';
  for (const [x, y, z, per, ph] of pts) {
    const k = ((t + ph) % per) / per, fall = y - ground, T = Math.sqrt(2 * fall / 9.8), tt = k * per;
    if (tt < T) {
      const yy = y - 4.9 * tt * tt; cam.project(x, yy, z, a); cam.project(x, yy + 0.12, z, b); if (a[2] <= 0) continue;
      g.strokeStyle = col; g.lineWidth = Math.max(0.6, a[3] * 0.006); g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(a[0], a[1]); g.stroke();
    } else if (tt < T + 0.25) {
      const u = (tt - T) / 0.25; cam.project(x, ground, z, a); if (a[2] <= 0) continue;
      g.strokeStyle = `rgba(210,222,235,${(0.5 * (1 - u)).toFixed(3)})`; g.lineWidth = Math.max(0.5, a[3] * 0.003);
      g.beginPath(); g.ellipse(a[0], a[1], a[3] * 0.06 * (0.3 + u), a[3] * 0.015 * (0.3 + u), 0, 0, TAU); g.stroke();
    }
  }
  g.restore();
}

// m4: the casting hall of the foundry, from the floor by the door we came in
// by (24 mm): the roof's gaps letting the grey day down in shafts, dust
// turning in them, rain coming through onto the ladles; the far door open
export class Foundry extends PlateShot {
  constructor() { super('foundry', { hand: 0.25, seed: 411, push: 0.07, dur: 16 }); }
  setup() {
    // the shafts lean the way the light does ([-0.2, -0.8, -0.55]): lit air is near one of the roof's gaps' lines
    const shaft = (p) => { const u = (22 - p[1]) / 0.8, x = p[0] + 0.2 * u, z = p[2] + 0.55 * u; return Math.max(0, 1 - Math.abs(Math.sin(x * 0.52 + z * 0.17)) * 1.6); };
    this.dust = new Dust([-12, 0.5, 6, 12, 16, 46], { n: 700, seed: 413, lit: (p) => 0.18 + 0.82 * shaft(p) });
    this.rain = new Rain({ n: [260, 90, 0], box: [9, 16, 4, 40], speed: 7.5, wind: 0.1, seed: 415 });
    for (let i = 0; i < 40; i++) this.rain.update(1 / 30, this.cam, 0, false);
    this.drops = [[-7.4, 3.2, 22, 1.9, 0], [-6.2, 3.2, 22.8, 2.6, 0.7], [7.6, 3.4, 48, 2.2, 1.3], [-9.2, 3.0, 30.4, 3.1, 0.4]];
  }
  tick(dt) { this.rain.update(dt, this.cam, 0, true); }
  draw(g, t) {
    if (!this.drawPlate(g)) return;
    this.rain.draw(g, this.cam, { col: '#c9d0d8', light: 0.25 });
    this.dust.draw(g, this.cam, t);
    drips(g, this.cam, t, this.drops, 3.0);
  }
  post() { return { grain: 0.08, halation: 0.45, lift: [6, 6, 7], cool: 0.02, vignette: 0.55, dirt: 0.25, flicker: 0.01 }; }
}

// m5: platform 3 of the old line under the tiled vault (24 mm): the tubes
// along the vault, a few dead, one low and stuttering; water off the vault
// onto the track; the tunnel mouth black at the end
export class Metro extends PlateShot {
  constructor() { super('metro', { hand: 0.2, seed: 421, push: 0.05, dur: 16 }); }
  setup() {
    this.tube = [1.7, 6.37, 24.15];
    this.dust = new Dust([-4, 1.2, 4, 5.5, 6, 40], { n: 260, seed: 423, col: '232,236,240', lit: (p) => Math.max(0, 1 - Math.abs(p[0] - 1.7) / 3.5) * 0.7 });
    this.drops = [[-2.4, 6.2, 14, 1.7, 0], [-3.1, 5.6, 21, 2.3, 0.6], [-1.8, 6.3, 33, 1.9, 1.1], [4.8, 5.4, 18, 2.8, 0.3], [-2.9, 6.0, 46, 2.1, 1.7]];
  }
  // the low tube: on, a stutter, out for a beat, back
  stutter(t) { const s = Math.floor(t * 12), k = (Math.sin(s * 12.9898) * 43758.5453 % 1 + 1) % 1; return t % 3.3 < 0.25 ? 0.05 : k > 0.3 ? 1 : 0.2; }
  draw(g, t) {
    if (!this.drawPlate(g)) return;
    const q = this.cam.project(...this.tube), on = this.stutter(t);
    if (q[2] > 0) {
      // the plate has it dim: lift it when it catches, darken round it when it drops
      if (on > 0.5) { glow(g, q[0], q[1], q[3] * 0.9, '#e8f0ff', 0.35); glow(g, q[0], q[1], q[3] * 2.6, '#c8d8f0', 0.08); }
      else { g.save(); g.globalCompositeOperation = 'multiply'; glow(g, q[0], q[1], q[3] * 3, '#40444c', 0.35); g.restore(); }
    }
    this.dust.draw(g, this.cam, t);
    drips(g, this.cam, t, this.drops, 0.05);
  }
  post() { return { grain: 0.08, halation: 0.45, lift: [5, 6, 6], vignette: 0.6, dirt: 0.25, flicker: 0.03 }; }
}

// m6: the drone works at night shift (28 mm): the two lines of frames, each
// eye blinking red in turn down the line; a finished one lifting off a rack
// and crossing under the panels toward us, its lights on
export class Drones extends PlateShot {
  constructor() { super('drones', { hand: 0.2, seed: 431, push: 0.06, dur: 16 }); }
  setup() {
    this.eyes = [];
    for (const lx of [-3, 3.5]) for (let z = 1.5; z < 64; z += 2.4) this.eyes.push([lx, 0.96, z - 0.17]);
  }
  draw(g, t) {
    if (!this.drawPlate(g)) return;
    const s = [0, 0, 0, 0];
    // the eyes: a slow wave down each line, each a short double blink
    for (let i = 0; i < this.eyes.length; i++) {
      const e = this.eyes[i], ph = (t * 0.9 - e[2] * 0.06 + (e[0] > 0 ? 0.37 : 0)) % 1, on = ph < 0.06 || (ph > 0.12 && ph < 0.17);
      if (!on) continue;
      this.cam.project(...e, s); if (s[2] <= 0) continue;
      glow(g, s[0], s[1], Math.max(2, s[3] * 0.12), '#ff3020', 0.55); glow(g, s[0], s[1], Math.max(1, s[3] * 0.04), '#ffd0c0', 0.8);
    }
    // the finished drone (0.8 m across): up off the rack at the right, then down the hall
    // toward us and over our heads
    const k = smooth(2.5, 12, t), x = 10.5 - 9.5 * smooth(2.5, 8, t), y = 2.4 + 2.2 * smooth(2.5, 5.5, t) + Math.sin(t * 5) * 0.04, z = 30 - 27 * k;
    this.cam.project(x, y, z, s);
    if (s[2] > 0 && t > 2.2) {
      const w = s[3] * 0.8, h = s[3] * 0.12;
      g.save(); g.fillStyle = '#0c0d0f';
      g.fillRect(s[0] - w * 0.25, s[1] - h * 0.5, w * 0.5, h);
      for (const sx of [-1, 1]) { g.fillRect(s[0] + sx * w * 0.25 - (sx > 0 ? 0 : w * 0.25), s[1] - h * 0.3, w * 0.25, h * 0.3); g.globalAlpha = 0.35; g.beginPath(); g.ellipse(s[0] + sx * w * 0.5, s[1] - h * 0.5, w * 0.16, h * 0.18, 0, 0, TAU); g.fill(); g.globalAlpha = 1; }
      g.restore();
      const blink = (t * 1.6) % 1 < 0.12;
      glow(g, s[0] - w * 0.5, s[1] - h * 0.3, Math.max(3, s[3] * 0.09), '#ff2a20', 0.95);
      glow(g, s[0] + w * 0.5, s[1] - h * 0.3, Math.max(3, s[3] * 0.09), '#30ff70', 0.85);
      if (blink) { glow(g, s[0], s[1] + h * 0.4, Math.max(4, s[3] * 0.25), '#ffffff', 0.9); glow(g, s[0], s[1] + h * 0.4, Math.max(8, s[3] * 0.8), '#c8d8ff', 0.2); }
    }
  }
  post() { return { grain: 0.07, halation: 0.45, lift: [5, 6, 8], cool: 0.05, vignette: 0.55, dirt: 0.2, flicker: 0.01 }; }
}

// m7: the furnace from the yard, cold, in the rain (50 mm): the opening's
// plate; the sodium tube over the cast house door that won't settle
export class FurnaceCold extends PlateShot {
  constructor() { super('open_furnace', { hand: 0.3, seed: 441, push: 0.05, dur: 16 }); }
  setup() {
    this.rain = new Rain({ n: [1200, 420, 30], box: [10, 8, 0.6, 40], speed: 8.6, wind: 0.5, seed: 443 });
    for (let i = 0; i < 40; i++) this.rain.update(1 / 30, this.cam, 0, false);
    this.lamp = [0, 11.62, -35.2];
  }
  tick(dt) { this.rain.update(dt, this.cam, 0, false); }
  draw(g, t) {
    if (!this.drawPlate(g)) return;
    const p = this.cam.project(...this.lamp), f = 0.75 + 0.25 * noise1(t * 7, 3) * noise1(t * 1.3, 4);
    if (p[2] > 0) glow(g, p[0], p[1], this.W * 0.03, '#ffa860', 0.22 * f);
    this.rain.draw(g, this.cam, { col: '#c7ced6', light: 0.5 });
  }
  post() { return { grain: 0.08, halation: 0.4, lift: [6, 7, 8], cool: 0.05, vignette: 0.55, dirt: 0.25 }; }
}

// act 2's end: the same camera; the furnace takes the blast. The cold plate
// goes over to the relit one, the top breathes steam, sparks off the cast
// house, the rain thins; the yard goes warm
export class Relit extends PlateShot {
  constructor() { super('open_furnace', { alt: 'open_furnace_relit', hand: 0.3, seed: 451, push: 0.07, dur: 18 }); }
  setup() {
    this.rain = new Rain({ n: [900, 300, 20], box: [10, 8, 0.6, 40], speed: 8.6, wind: 0.5, seed: 453 });
    for (let i = 0; i < 40; i++) this.rain.update(1 / 30, this.cam, 0, false);
    this.steam = new Puffs({ rate: 0, life: 8, rise: 6, grow: 12, size: 5, col: '#ffe6d6', a: 0.26, seed: 455, lumpy: true });
    this.gas = new Puffs({ rate: 0, life: 6, rise: 4, grow: 8, size: 4, col: '#ffd2b0', a: 0.18, seed: 457, lumpy: true });
    this.sparks = new Sparks({ seed: 459, col: '#ffb15a', drag: 0.4, gravity: -3 });
    this.lamp = [0, 11.62, -35.2];
  }
  heat(t) { return smooth(2.5, 9.5, t); }
  tick(dt, t) {
    const k = this.heat(t);
    this.rain.update(dt, this.cam, 0, false);
    this.steam.rate = 14 * k; this.steam.update(dt, [[0, 46, 0], [1.4, 53, 1.4]], 0.9);
    this.gas.rate = 6 * k; this.gas.update(dt, [[0, 24, -22]], 0.6);
    if (k > 0.3 && Math.random() < dt * 18 * k) this.sparks.burst((Math.random() - 0.5) * 6, 6 + Math.random() * 2, -9, 3, 4, 1.4);
    this.sparks.update(dt);
  }
  draw(g, t) {
    const k = this.heat(t);
    if (!this.drawPlate(g, k)) return;
    const p = this.cam.project(...this.lamp), f = 0.75 + 0.25 * noise1(t * 7, 3) * noise1(t * 1.3, 4);
    if (p[2] > 0) glow(g, p[0], p[1], this.W * 0.03, '#ffa860', 0.22 * f * (1 - k * 0.6));
    // the top gas catching as it comes round: a flare over the throat, once it has the blast
    if (k > 0.6) { const q = this.cam.project(1.4, 55.5, 1.4), f2 = 0.8 + 0.2 * noise1(t * 6, 8); if (q[2] > 0) { glow(g, q[0], q[1], q[3] * 7 * f2, '#ffb070', 0.5 * (k - 0.6) / 0.4); glow(g, q[0], q[1], q[3] * 2.4 * f2, '#fff0c8', 0.7 * (k - 0.6) / 0.4); } }
    // the cast house: the iron running, its light out of the door onto the wet yard
    { const q = this.cam.project(0, 4, -34), b2 = 0.85 + 0.15 * noise1(t * 4, 9); if (q[2] > 0 && k > 0.05) { glow(g, q[0], q[1], q[3] * 14 * b2, '#ff8a30', 0.35 * k); glow(g, q[0], q[1] + q[3] * 4, q[3] * 22 * b2, '#ff7a20', 0.18 * k); } }
    g.save(); g.globalCompositeOperation = 'screen'; this.steam.draw(g, this.cam, 0.9); this.gas.draw(g, this.cam, 0.8); g.restore();
    this.sparks.draw(g, this.cam, 1);
    this.rain.draw(g, this.cam, { col: '#d8c8b8', light: 0.5 * (1 - k * 0.5) });
  }
  post() { return { grain: 0.08, halation: 0.6, lift: [10, 8, 7], warm: 0.04, vignette: 0.5, dirt: 0.3 }; }
}
