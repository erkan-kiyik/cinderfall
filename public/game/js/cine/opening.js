// KOR — the opening, on every launch (docs/KOR_STORY_CINEMATIC.md §3).
//
// Five ray-traced plates (plates.js; baked by tools/game/series/render.mjs
// --plates from the series' scenes) with what moves drawn live on them
// through the plate's own camera:
//
//   0.8   the furnace, cold, at night: rain; the one lamp over the sealed
//         door wavering; the lens creeping in
//   4.4   the town from a roof: the tower's searchlight sweeping the roofs,
//         its red lights blinking; rain; a slow pan right
//   8.0   the poster with KOR sprayed on it: the tube over it failing and
//         catching (the plate lit and the plate dark, between them)
//  11.2   the alley: steam off the grate in the sodium light, rain
//  14.4   the coals, close: breathing (the plate hot and the plate cooler),
//         sparks going up; KOR in their light
//
// Between shots a short dip through black. The last shot holds until the
// game hands off. Same interface as a shot: init, update, draw, post.
import { Cam } from './cam.js';
import { Plate, PLATES } from './plates.js';
import { Rain, Puffs, Sparks, beam, glow } from './fx.js';
import { rng, noise1, smooth, clamp, fogTexture, canvas } from './noise.js';

// shot times (s); the last one has no end
export const OPEN_CUTS = [0.8, 4.4, 8.0, 11.2, 14.4];
export const KOR_AT = 15.2;

// a plate shot: the plate (and a variant to blend toward), its camera, a move
class PlateShot {
  constructor(name, alt, W, H) {
    const P = PLATES[name], cam = this.cam = new Cam(W, H);
    cam.mm = P.mm; cam.pos = P.pos.slice(); cam.yaw = P.yaw; cam.pitch = P.pitch; cam.update(0);
    this.P = P; this.plate = new Plate(name); this.alt = alt ? new Plate(alt) : null;
    this.ready = Promise.all([this.plate.ready, this.alt?.ready]);
  }
  // k: how much of the variant shows (0: the plate, 1: the variant)
  drawPlate(g, k = 0) {
    if (!this.plate.ok) return false;
    if (this.alt && this.alt.ok && k > 0.004) {
      this.plate.draw(g, this.cam);
      this.alt.draw(g, this.cam, clamp(k));
    } else this.plate.draw(g, this.cam);
    return true;
  }
}

class Furnace extends PlateShot {
  constructor(W, H) {
    super('open_furnace', null, W, H);
    this.cam.hand = 0.3; this.cam.seed = 211;
    this.rain = new Rain({ n: [1200, 420, 30], box: [10, 8, 0.6, 40], speed: 8.6, wind: 0.5, seed: 213 });
    for (let i = 0; i < 40; i++) this.rain.update(1 / 30, this.cam, 0, false);
    this.lamp = [0, 11.62, -35.2];
  }
  update(dt, t) { const P = this.P, c = this.cam; c.mm = P.mm * (1 + smooth(0, 4, t) * 0.04); c.pitch = P.pitch + t * 0.0012; c.update(t); this.rain.update(dt, c, 0, false); }
  draw(g, t) {
    if (!this.drawPlate(g)) return;
    // the lamp over the door: an old sodium tube that won't settle
    const p = this.cam.project(...this.lamp), f = 0.75 + 0.25 * noise1(t * 7, 3) * noise1(t * 1.3, 4);
    if (p[2] > 0) glow(g, p[0], p[1], this.cam.W * 0.03, '#ffa860', 0.22 * f);
    this.rain.draw(g, this.cam, { col: '#c7ced6', light: 0.5 });
  }
  post() { return { grain: 0.08, halation: 0.4, lift: [6, 7, 8], cool: 0.05, vignette: 0.55, dirt: 0.25 }; }
}

class Roof extends PlateShot {
  constructor(W, H) {
    super('open_roof', null, W, H);
    this.cam.hand = 0.25; this.cam.seed = 221;
    this.rain = new Rain({ n: [1400, 460, 40], box: [10, 8, 0.6, 40], speed: 8.6, wind: 0.8, seed: 223 });
    for (let i = 0; i < 40; i++) this.rain.update(1 / 30, this.cam, 18, false);
    this.fog = fogTexture(512, 256, 29, 4);
    const tx = 90, tz = 1000;
    this.search = [tx - 9, 171, tz - 9];
    this.reds = [[tx - 14, 150.6, tz - 14], [tx + 14, 150.6, tz - 14], [tx - 10, 170.6, tz - 10], [tx + 10, 170.6, tz - 10], [tx, 205.8, tz]];
  }
  update(dt, t) { const P = this.P, c = this.cam; c.yaw = P.yaw + t * 0.004; c.update(t); this.rain.update(dt, c, 18, false); }
  draw(g, t) {
    if (!this.drawPlate(g)) return;
    // the searchlight: swinging slowly from the old town toward us and back
    const ph = -2.62 + Math.sin(t * 0.42 + 0.4) * 0.34, el = -0.3, d = [Math.sin(ph) * Math.cos(el), Math.sin(el), Math.cos(ph) * Math.cos(el)];
    // drawn small and brought up soft: in rain and mist a beam has no edge
    const W = this.cam.W, H = this.cam.H, q = 0.25;
    const bb = this.bb || (this.bb = canvas(W * q, H * q)), bg = bb.getContext('2d');
    bg.setTransform(1, 0, 0, 1, 0, 0); bg.clearRect(0, 0, bb.width, bb.height); bg.scale(q, q);
    beam(bg, this.cam, this.search, d, 0.05, 1100, 6500, 0.75, this.fog, t);
    g.save(); g.globalCompositeOperation = 'screen'; g.imageSmoothingQuality = 'high'; g.drawImage(bb, 0, 0, W, H); g.restore();
    const s = this.cam.project(...this.search); if (s[2] > 0) glow(g, s[0], s[1], this.cam.W * 0.012, '#eef4ff', 0.9);
    // the tower's red lights, all together, once a second
    const on = (t % 1.0) < 0.5 ? 1 : 0;
    for (const r of this.reds) { const p = this.cam.project(...r); if (p[2] > 0) glow(g, p[0], p[1], this.cam.W * 0.012, '#ff2a14', 0.55 * on); }
    this.rain.draw(g, this.cam, { col: '#c4ccd6', light: 0.55 });
  }
  post() { return { grain: 0.08, halation: 0.5, lift: [5, 6, 8], cool: 0.05, vignette: 0.6, dirt: 0.3 }; }
}

class Poster extends PlateShot {
  constructor(W, H) {
    super('open_poster', 'open_poster_off', W, H);
    this.cam.hand = 0.35; this.cam.seed = 231;
    this.rain = new Rain({ n: [900, 380, 30], box: [5, 5, 0.4, 12], speed: 8.6, wind: 0.3, seed: 233 });
    for (let i = 0; i < 40; i++) this.rain.update(1 / 30, this.cam, 0, true);
    this.r = rng(237); this.off = 0; this.next = 0.6;
  }
  update(dt, t) {
    const P = this.P, c = this.cam; c.mm = P.mm * (1 + smooth(0, 3.2, t) * 0.035); c.update(t);
    this.rain.update(dt, c, 0, true);
    // the tube: on, then a stutter now and then (a few fast drops), once out for a beat
    if (t > this.next) { this.off = this.r() < 0.25 ? 0.35 : 0.1; this.next = t + 0.35 + this.r() * 0.9; }
    this.off = Math.max(0, this.off - dt);
  }
  draw(g, t) {
    const dark = this.off > 0 ? (Math.sin(t * 90) > -0.2 ? 1 : 0.3) : 0;
    if (!this.drawPlate(g, dark)) return;
    this.rain.draw(g, this.cam, { col: '#c8d0d8', light: 0.6 - 0.3 * dark, puddle: true });
  }
  post() { return { grain: 0.08, halation: 0.5, lift: [5, 5, 7], vignette: 0.6, dirt: 0.3 }; }
}

class Alley extends PlateShot {
  constructor(W, H) {
    super('open_alley', null, W, H);
    this.cam.hand = 0.4; this.cam.seed = 241;
    this.steam = new Puffs({ rate: 10, life: 4, rise: 0.8, grow: 1.3, size: 0.4, col: '#b89878', a: 0.13, seed: 243, lumpy: true });
    for (let i = 0; i < 80; i++) this.steam.update(0.05, [[0, 0.05, 10.3]], 0.25);
    this.rain = new Rain({ n: [1200, 420, 36], box: [6, 8, 0.5, 30], speed: 8.6, wind: 0.3, seed: 245 });
    for (let i = 0; i < 40; i++) this.rain.update(1 / 30, this.cam, 0, true);
  }
  update(dt, t) {
    const P = this.P, c = this.cam; c.mm = P.mm * (1 + smooth(0, 3.2, t) * 0.04); c.update(t);
    this.steam.update(dt, [[0, 0.05, 10.3]], 0.25); this.rain.update(dt, c, 0, true);
  }
  draw(g, t) {
    if (!this.drawPlate(g)) return;
    g.save(); g.globalCompositeOperation = 'screen'; this.steam.draw(g, this.cam, 1); g.restore();
    this.rain.draw(g, this.cam, { col: '#e0c8a8', light: 0.65, puddle: true });
  }
  post() { return { grain: 0.08, halation: 0.6, lift: [6, 5, 5], vignette: 0.6, dirt: 0.3 }; }
}

class Coals extends PlateShot {
  constructor(W, H) {
    super('open_coals', 'open_coals_dim', W, H);
    this.cam.hand = 0.15; this.cam.seed = 251;
    this.sparks = new Sparks({ seed: 253, col: '#ffb15a', drag: 0.9, gravity: 0.25 });
    this.r = rng(257); this.acc = 0;
  }
  update(dt, t) {
    const P = this.P, c = this.cam; c.mm = P.mm * (1 + t * 0.004); c.update(t);
    // a spark now and then off the hottest part of the bed
    this.acc += dt * 2.2;
    while (this.acc > 1) { this.acc -= 1; this.sparks.burst((this.r() - 0.5) * 0.14, 0.03, 0.08 + this.r() * 0.08, 1 + (this.r() * 2 | 0), 0.08, 1.2); }
    this.sparks.update(dt);
  }
  draw(g, t) {
    // breathing: the bed between hot and cooler, slow and uneven
    const b = 0.5 + 0.5 * Math.sin(t * 0.9) * (0.7 + 0.3 * noise1(t * 0.6, 9));
    if (!this.drawPlate(g, 0.65 * b)) return;
    // the sparks, drawn fine: at this distance a spark is a hair of light, not a streak
    { const c = this.cam, a0 = [0, 0, 0, 0], a1 = [0, 0, 0, 0], w = Math.max(0.8, c.W * 0.0012);
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineWidth = w;
      for (const p of this.sparks.p) {
        c.project(p.x, p.y, p.z, a0); c.project(p.x - p.vx / 24, p.y - p.vy / 24, p.z - p.vz / 24, a1); if (a0[2] <= 0 || a1[2] <= 0) continue;
        const k = 1 - p.t / p.life; g.globalAlpha = k * (0.55 + 0.45 * Math.sin(p.t * 40 + p.k * 9));
        g.strokeStyle = p.k > 0.85 ? '#fff0c8' : '#ffa048'; g.beginPath(); g.moveTo(a1[0], a1[1]); g.lineTo(a0[0], a0[1]); g.stroke();
      }
      g.restore(); }
    const W = this.cam.W, H = this.cam.H, ta = smooth(KOR_AT - OPEN_CUTS[4], KOR_AT - OPEN_CUTS[4] + 1.4, t);
    if (ta > 0) {
      // a little dark under the type, so it reads off the coals
      const sh = g.createRadialGradient(W / 2, H * 0.44, H * 0.05, W / 2, H * 0.44, H * 0.5);
      sh.addColorStop(0, `rgba(0,0,0,${0.45 * ta})`); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(0, 0, W, H);
      const fs = Math.round(H * 0.17);
      g.save(); g.font = `800 ${fs}px 'Big Shoulders Stencil', Rajdhani, 'Arial Narrow', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      if ('letterSpacing' in g) g.letterSpacing = `${Math.round(fs * 0.38)}px`;
      g.shadowColor = `rgba(255,120,40,${0.5 * ta})`; g.shadowBlur = H * 0.04;
      g.fillStyle = `rgba(242,230,214,${ta})`; g.fillText('KOR', W / 2 + fs * 0.27, H * 0.42);
      g.restore();
    }
  }
  post() { return { grain: 0.09, halation: 0.6, lift: [4, 3, 2], warm: 0.03, vignette: 0.65, dirt: 0.25 }; }
}

export class Opening {
  // o: { reduce } — with reduced motion only the coals, still
  init(W, H, env = {}) {
    this.W = W; this.H = H; this.reduce = !!env.reduce;
    this.shots = this.reduce ? [new Coals(W, H)] : [new Furnace(W, H), new Roof(W, H), new Poster(W, H), new Alley(W, H), new Coals(W, H)];
    this.cuts = this.reduce ? [0] : OPEN_CUTS;
    this.ready = Promise.all(this.shots.map((s) => s.ready));
    this.t = 0;
  }
  // which shot is on at t, and how far into it
  at(t) { let i = 0; while (i + 1 < this.cuts.length && t >= this.cuts[i + 1]) i++; return [i, t - this.cuts[i]]; }
  update(dt, t) {
    this.t = t;
    const [i, lt] = this.at(t);
    this.shots[i].update(dt, lt);
  }
  draw(g, t) {
    g.fillStyle = '#000'; g.fillRect(0, 0, this.W, this.H);
    if (t < this.cuts[0]) return;
    const [i, lt] = this.at(t);
    this.shots[i].draw(g, lt);
    // the dip through black either side of a cut
    const next = this.cuts[i + 1], D = 0.32;
    let k = 1 - smooth(0, D, lt);                                          // up from black
    if (next !== undefined) k = Math.max(k, 1 - smooth(0, D, next - t));   // down to black
    if (k > 0) { g.fillStyle = `rgba(0,0,0,${clamp(k)})`; g.fillRect(0, 0, this.W, this.H); }
  }
  post(t) { const [i] = this.at(t); return this.shots[i].post(); }
}
