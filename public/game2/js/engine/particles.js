// Pooled particle system. Kinds cover sparks, smoke, dust, brass casings,
// blood, debris and ambient ash. Casings/debris/blood collide with the world
// via a solidAt(x, y) callback; impacts are reported through onImpact so the
// game can stamp decals / play sounds.
//
// True object-pool: `max` particle objects are allocated once at construction
// and reused for the life of the game — spawn() overwrites the fields of a
// recycled slot instead of allocating a new object, and a dead particle is
// removed with a swap against the last active slot (O(1), no splice/shift).
// This keeps particle-heavy combat (explosions, muzzle flashes, smoke) from
// generating per-frame garbage, which matters most on mobile GC pauses.

import { rand, randSpread, TAU, clamp } from './math.js';

export const K = {
  SPARK: 0, SMOKE: 1, DUST: 2, CASING: 3, BLOOD: 4,
  DEBRIS: 5, ASH: 6, EMBER: 7, MUZZLE_SMOKE: 8,
};

const ADDITIVE = new Set([K.SPARK, K.EMBER]);

// ---------------------------------------------------------------------------
// Baked soft discs
// ---------------------------------------------------------------------------
// Dust and smoke used to build a CanvasGradient per particle per frame — smoke
// two of them — which on a busy frame with the low tier's 900-particle pool is
// hundreds of shader objects allocated and thrown away sixty times a second.
// It is also the one thing in this file that generated per-frame garbage, in a
// system whose entire design is about not doing that.
//
// The ramps are fixed, so they are baked once into small canvases instead and
// blitted. `globalAlpha` still modulates each draw, so the result is identical;
// only the per-frame allocation is gone. Keyed by colour, with a hard cap so an
// unexpected caller passing many colours degrades to the old path rather than
// growing without bound.
const DISC_R = 32;
const DISC_CAP = 48;
const discCache = new Map();

function bakeDisc(key, stops) {
  let cv = discCache.get(key);
  if (cv) return cv;
  if (discCache.size >= DISC_CAP) return null;   // fall back to a live gradient
  cv = document.createElement('canvas');
  cv.width = DISC_R * 2; cv.height = DISC_R * 2;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(DISC_R, DISC_R, 0, DISC_R, DISC_R, DISC_R);
  for (const [at, col] of stops) grad.addColorStop(at, col);
  g.fillStyle = grad;
  g.fillRect(0, 0, DISC_R * 2, DISC_R * 2);
  discCache.set(key, cv);
  return cv;
}

// Draws a baked disc centred on (x, y) with radius r.
function blitDisc(g, cv, x, y, r) {
  g.drawImage(cv, x - r, y - r, r * 2, r * 2);
}

function blankParticle() {
  return {
    kind: 0, x: 0, y: 0, vx: 0, vy: 0, life: 1, age: 0, size: 3, grow: 0,
    grav: 0, drag: 0, rot: 0, vrot: 0, color: '#888', alpha: 1,
    bounce: 0, bounces: 0, seed: 0, _rgb: null,
    // Per-particle caches, all derived from `color` and therefore fixed for
    // the particle's life. They exist because the draw loop was rebuilding
    // them sixty times a second: a template string per baked-disc lookup, in
    // the one file whose whole design is about not allocating per frame.
    _add: false, _disc: null, _body: null, _core: null,
  };
}

export class Particles {
  constructor(max = 2600) {
    this.max = max;
    this.items = new Array(max);
    for (let i = 0; i < max; i++) this.items[i] = blankParticle();
    this.count = 0;          // items[0..count) are active; order is unordered
    this._next = 0;          // round-robin recycle cursor once the pool is full
    this.onImpact = null;    // (kind, x, y, vx, vy) => void
    this.solidAt = () => false;
    this.time = 0;
    this.wind = 0;           // smooth gusty crosswind, drives smoke drift
    // Visible world span, set once per frame by the renderer. Particles live
    // across the whole map — ambient ash and the smoke columns are seeded map
    // wide — and drawing the ones behind the camera costs exactly as much as
    // drawing the ones in front of it. Defaults are open, so a caller that
    // never sets a view keeps the old behaviour.
    this.viewL = -Infinity; this.viewR = Infinity;
    this.viewT = -Infinity; this.viewB = Infinity;
  }

  // Visible world rect for culling. The margin is the caller's to choose: a
  // grown smoke puff can be 40 units across and is still worth drawing when
  // its centre is just off screen.
  setView(l, r, t, b) {
    this.viewL = l; this.viewR = r;
    this.viewT = t === undefined ? -Infinity : t;
    this.viewB = b === undefined ? Infinity : b;
  }

  // Backwards-compat accessor for external code that iterates particles
  // directly (none currently does, but keep it cheap and correct just in case).
  get pool() { return this.items.slice(0, this.count); }

  // Drops every active particle instantly (level reset / stage transition).
  clear() { this.count = 0; }

  spawn(kind, o) {
    let p;
    if (this.count < this.max) {
      p = this.items[this.count++];
    } else {
      // pool exhausted: recycle round-robin rather than the oldest (avoids an
      // O(n) age scan) — at 2600+ concurrent particles this is imperceptible
      p = this.items[this._next];
      this._next = (this._next + 1) % this.max;
    }
    p.kind = kind;
    p.x = o.x; p.y = o.y;
    p.vx = o.vx || 0; p.vy = o.vy || 0;
    p.life = o.life || 1; p.age = 0;
    p.size = o.size || 3;
    p.grow = o.grow || 0;
    p.grav = o.grav !== undefined ? o.grav : 0;
    p.drag = o.drag || 0;
    p.rot = o.rot || rand(0, TAU);
    p.vrot = o.vrot || 0;
    p.color = o.color || '#888';
    p.alpha = o.alpha !== undefined ? o.alpha : 1;
    p.bounce = o.bounce || 0;
    p.bounces = 0;
    p.seed = Math.random() * TAU;
    p._rgb = null;
    p._add = ADDITIVE.has(kind);
    p._disc = null; p._body = null; p._core = null;
  }

  update(dt) {
    this.time += dt;
    // gusty wind: two out-of-phase sines so it never obviously loops
    this.wind = Math.sin(this.time * 0.24) * 12 + Math.sin(this.time * 0.083 + 1.3) * 20;
    const items = this.items;
    for (let i = this.count - 1; i >= 0; i--) {
      const p = items[i];
      p.age += dt;
      if (p.age >= p.life) { this._kill(i); continue; }

      p.vy += p.grav * dt;
      if (p.drag) { const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; }
      if (p.kind === K.ASH || p.kind === K.EMBER) {
        p.vx += Math.sin(p.age * 1.7 + p.seed) * 14 * dt;
      } else if (p.kind === K.SMOKE || p.kind === K.MUZZLE_SMOKE) {
        // turbulence (curl-ish drift) + wind push, scaled by remaining life so
        // rising columns wander and shear apart instead of marching uniformly
        const turb = p.turb || 22;
        p.vx += Math.sin(p.age * 1.9 + p.seed) * turb * dt + this.wind * (p.windMul || 1) * dt;
        p.vy += Math.cos(p.age * 1.5 + p.seed * 1.7) * turb * 0.45 * dt;
      }
      const nx = p.x + p.vx * dt;
      const ny = p.y + p.vy * dt;

      if (p.bounce && p.vy > 0 && this.solidAt(nx, ny)) {
        if (this.onImpact) this.onImpact(p.kind, p.x, p.y, p.vx, p.vy, p.bounces);
        if (p.kind === K.BLOOD) { this._kill(i); continue; }
        p.vy = -p.vy * p.bounce;
        p.vx *= 0.6;
        p.vrot *= 0.5;
        p.bounces++;
        if (Math.abs(p.vy) < 30) { p.vy = 0; p.grav = 0; p.vx = 0; p.vrot = 0; }
      } else {
        p.x = nx; p.y = ny;
      }
      p.rot += p.vrot * dt;
      p.size += p.grow * dt;
    }
  }

  // Swap-remove: move the last active slot into i's place and shrink count.
  // O(1), no allocation — the recycled object itself is left in place (its
  // fields get overwritten wholesale on the next spawn() into that slot).
  _kill(i) {
    this.count--;
    if (i !== this.count) {
      const items = this.items;
      const tmp = items[i]; items[i] = items[this.count]; items[this.count] = tmp;
    }
  }

  draw(g, additivePass) {
    const vl = this.viewL, vr = this.viewR, vt = this.viewT, vb = this.viewB;
    for (let idx = 0; idx < this.count; idx++) {
      const p = this.items[idx];
      if (p._add !== additivePass) continue;
      // Off-screen particles are skipped here and only here: they still
      // update, so a smoke column the camera pans back to is where it should
      // be rather than frozen where it was left.
      if (p.x < vl || p.x > vr || p.y < vt || p.y > vb) continue;
      const t = p.age / p.life;
      const fade = t > 0.65 ? 1 - (t - 0.65) / 0.35 : 1;
      const a = clamp(p.alpha * fade, 0, 1);
      if (a <= 0.01) continue;
      g.globalAlpha = a;

      switch (p.kind) {
        case K.SPARK: {
          const len = Math.min(14, Math.hypot(p.vx, p.vy) * 0.02 + 2);
          const ang = Math.atan2(p.vy, p.vx);
          g.strokeStyle = t < 0.4 ? '#ffe9b0' : '#ff9a4d';
          g.lineWidth = p.size * (1 - t * 0.6);
          g.beginPath();
          g.moveTo(p.x, p.y);
          g.lineTo(p.x - Math.cos(ang) * len, p.y - Math.sin(ang) * len);
          g.stroke();
          break;
        }
        case K.EMBER: {
          g.fillStyle = t < 0.5 ? '#ffb35c' : '#c2542e';
          g.beginPath();
          g.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, TAU);
          g.fill();
          break;
        }
        case K.DUST: {
          const r = Math.max(0.5, p.size);
          g.globalAlpha = a * 0.55;
          let disc = p._disc;
          if (disc === null) {
            disc = bakeDisc(`d:${p.color}`, [[0, p.color], [1, 'rgba(0,0,0,0)']]);
            p._disc = disc === null ? false : disc;   // false = baking refused, stop asking
          }
          if (disc) { blitDisc(g, disc, p.x, p.y, r); break; }
          const grad = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
          grad.addColorStop(0, p.color);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = grad;
          g.beginPath();
          g.arc(p.x, p.y, r, 0, TAU);
          g.fill();
          break;
        }
        case K.SMOKE: case K.MUZZLE_SMOKE: {
          // volumetric puff: parse rgb once, then two soft layers (a wide,
          // faint body + a denser core) with a soft fade-in so nothing pops
          if (!p._rgb) {
            const m = /(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(p.color);
            p._rgb = m ? [+m[1], +m[2], +m[3]] : [140, 140, 145];
          }
          const [cr, cg, cb] = p._rgb;
          const r = Math.max(0.5, p.size);
          const fin = t < 0.14 ? t / 0.14 : 1;                 // grow-in
          const fout = t > 0.5 ? 1 - (t - 0.5) / 0.5 : 1;      // gradual dissipation
          const base = clamp(p.alpha * fin * fout, 0, 1);
          if (base <= 0.01) break;
          const ox = Math.cos(p.seed) * r * 0.18, oy = Math.sin(p.seed) * r * 0.18;
          let body = p._body, core = p._core;
          if (body === null) {
            const rgb = `${cr},${cg},${cb}`;
            body = bakeDisc(`sb:${rgb}`, [
              [0, `rgba(${rgb},0.5)`], [0.55, `rgba(${rgb},0.22)`], [1, `rgba(${rgb},0)`],
            ]);
            core = bakeDisc(`sc:${rgb}`, [
              [0, `rgba(${rgb},0.75)`], [1, `rgba(${rgb},0)`],
            ]);
            p._body = body === null ? false : body;
            p._core = core === null ? false : core;
          }
          if (body && core) {
            g.globalAlpha = base * 0.6;
            blitDisc(g, body, p.x, p.y, r);
            g.globalAlpha = base * 0.7;
            blitDisc(g, core, p.x + ox, p.y + oy, r * 0.6);
            break;
          }
          // Fallback for the case bakeDisc refused (too many distinct colours):
          // the original live-gradient path, unchanged.
          const rgb = `${cr},${cg},${cb}`;
          let grad = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
          grad.addColorStop(0, `rgba(${rgb},0.5)`);
          grad.addColorStop(0.55, `rgba(${rgb},0.22)`);
          grad.addColorStop(1, `rgba(${rgb},0)`);
          g.fillStyle = grad;
          g.globalAlpha = base * 0.6;
          g.beginPath(); g.arc(p.x, p.y, r, 0, TAU); g.fill();
          // denser offset core for internal density variation
          grad = g.createRadialGradient(p.x + ox, p.y + oy, 0, p.x + ox, p.y + oy, r * 0.6);
          grad.addColorStop(0, `rgba(${rgb},0.75)`);
          grad.addColorStop(1, `rgba(${rgb},0)`);
          g.fillStyle = grad;
          g.globalAlpha = base * 0.7;
          g.beginPath(); g.arc(p.x + ox, p.y + oy, r * 0.6, 0, TAU); g.fill();
          break;
        }
        case K.CASING: {
          g.save();
          g.translate(p.x, p.y);
          g.rotate(p.rot);
          g.fillStyle = '#a8873c';
          g.fillRect(-p.size / 2, -p.size / 5, p.size, p.size / 2.5);
          g.fillStyle = '#e6c878';
          g.fillRect(-p.size / 2, -p.size / 5, p.size, p.size / 6);
          g.restore();
          break;
        }
        case K.BLOOD: {
          g.fillStyle = p.color;
          g.beginPath();
          g.arc(p.x, p.y, p.size * (1 - t * 0.3), 0, TAU);
          g.fill();
          break;
        }
        case K.DEBRIS: {
          g.save();
          g.translate(p.x, p.y);
          g.rotate(p.rot);
          g.fillStyle = p.color;
          g.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
          g.restore();
          break;
        }
        case K.ASH: {
          g.fillStyle = p.color;
          g.fillRect(p.x, p.y, p.size, p.size);
          break;
        }
      }
    }
    g.globalAlpha = 1;
  }
}

// ---- convenience spawners ----------------------------------------------

export function burstSparks(ps, x, y, ang, n, spread = 0.9, speed = 420) {
  for (let i = 0; i < n; i++) {
    const a = ang + randSpread(spread);
    const v = rand(0.3, 1) * speed;
    ps.spawn(K.SPARK, {
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      life: rand(0.18, 0.5), size: rand(1.2, 2.4),
      grav: 1050, drag: 2.5, bounce: 0.35,
    });
  }
}

export function puffSmoke(ps, x, y, n, color = 'rgba(140,140,145,0.85)', opts = {}) {
  for (let i = 0; i < n; i++) {
    ps.spawn(K.SMOKE, {
      x: x + randSpread(4), y: y + randSpread(4),
      vx: (opts.vx || 0) + randSpread(28), vy: (opts.vy || -26) + randSpread(16),
      life: rand(0.7, 1.6) * (opts.lifeMul || 1),
      size: rand(4, 9) * (opts.sizeMul || 1),
      grow: rand(14, 30) * (opts.growMul || 1),
      drag: 1.6, color, alpha: opts.alpha || 0.75,
      turb: opts.turb, windMul: opts.windMul,
    });
  }
}

// Slow-rising industrial smoke column (chimneys / stacks). Large soft puffs
// that grow, drift on the wind and dissipate over several seconds. `tint`
// selects the source colour: grey exhaust, black soot, white steam, etc.
const SMOKE_TINT = {
  exhaust: [92, 90, 96],   // dirty grey industrial exhaust
  soot:    [46, 44, 46],   // black smoke from burning debris
  steam:   [188, 190, 196],// pale water-vapour plume
  chem:    [120, 126, 108],// sickly chemical haze
  dust:    [120, 108, 92], // brown dust / dry vent
};

export function columnSmoke(ps, x, y, tint = 'exhaust', opts = {}) {
  const c = SMOKE_TINT[tint] || SMOKE_TINT.exhaust;
  const ji = 0.5 + Math.random() * 0.5;   // per-puff density variance
  ps.spawn(K.SMOKE, {
    x: x + randSpread(6), y: y + randSpread(4),
    vx: randSpread(10) + (opts.vx || 0),
    vy: -(rand(24, 44)) * (opts.rise || 1),
    life: rand(3.4, 6.2) * (opts.lifeMul || 1),
    size: rand(14, 26) * (opts.sizeMul || 1),
    grow: rand(26, 46),
    drag: 0.5,
    color: `rgba(${c[0]},${c[1]},${c[2]},1)`,
    alpha: (opts.alpha || 0.5) * ji,
    turb: opts.turb || 26,
    windMul: opts.windMul || 1.4,
  });
}

// Short sharp exhaust burst (vents, damaged machinery) — faster, lower, denser.
export function ventSmoke(ps, x, y, dir = 0, tint = 'exhaust', opts = {}) {
  const c = SMOKE_TINT[tint] || SMOKE_TINT.exhaust;
  ps.spawn(K.SMOKE, {
    x, y,
    vx: Math.cos(dir) * rand(20, 60) + randSpread(14),
    vy: Math.sin(dir) * rand(20, 60) - rand(8, 24),
    life: rand(1.2, 2.6) * (opts.lifeMul || 1),
    size: rand(6, 12) * (opts.sizeMul || 1),
    grow: rand(20, 38),
    drag: 1.1,
    color: `rgba(${c[0]},${c[1]},${c[2]},1)`,
    alpha: opts.alpha || 0.6,
    turb: 30, windMul: 1,
  });
}

export function kickDust(ps, x, y, dir, n = 5) {
  for (let i = 0; i < n; i++) {
    ps.spawn(K.DUST, {
      x: x + randSpread(7), y: y - rand(0, 4),
      vx: dir * rand(15, 75) + randSpread(22), vy: -rand(8, 42),
      life: rand(0.4, 0.9), size: rand(3, 6), grow: rand(10, 22),
      drag: 2.4, color: 'rgba(122,110,96,0.8)', alpha: 0.5,
    });
  }
}
