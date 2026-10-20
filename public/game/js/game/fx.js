// KOR — combat effects.
//
// Everything a shot leaves behind: muzzle flashes and their light, tracers,
// sparks and dust at impacts, hit puffs on characters, bullet holes on
// walls, knife swooshes, and loose debris (casings, magazines, dropped guns)
// that tumbles, bounces off the tiles and comes to rest.
//
// Draws in two places: `drawWorld` with the lit scene (decals, debris, dust)
// and `drawGlow` additive after composition (flashes, tracers, sparks).
import { ParticleSystem, col } from '../gfx/particles.js';
import { rgba } from '../gfx/batch.js';
import { SOLID } from '../phys/level.js';

const MAX_DEBRIS = 96, MAX_DECALS = 120;
const rand = (a, b) => a + Math.random() * (b - a);

export class Effects {
  constructor(eng, sfx = null) {
    const { gl, atlas } = eng;
    this.e = eng; this.A = atlas; this.sfx = sfx;
    this.sparks = new ParticleSystem(gl, atlas, atlas.get('fx.dot'), 768, { additive: true, streak: 0.022 });
    this.smoke = new ParticleSystem(gl, atlas, atlas.get('fx.smoke'), 384, { additive: false });
    this.bits = new ParticleSystem(gl, atlas, atlas.get('fx.dot'), 384, { additive: false, streak: 0.012 });
    this.R = { muzzle: atlas.get('fx.muzzle'), glow: atlas.get('fx.glow'), tracer: atlas.get('fx.tracer'), hole: atlas.get('fx.hole'), slash: atlas.get('fx.slash'), white: atlas.get('fx.white') };
    this.flashes = []; this.tracers = []; this.slashes = []; this.lights = [];
    this.decals = []; this.debris = [];
    this.t = 0;
  }

  // --- spawners ----------------------------------------------------------------------
  // muzzle flash at (x, y) pointing along angle a (world); size by weapon
  muzzle(x, y, a, size = 1, suppressed = false) {
    this.flashes.push({ x, y, a, s: size * rand(0.85, 1.15), life: suppressed ? 0.035 : 0.05, t: 0, sup: suppressed, spin: rand(-0.4, 0.4) });
    this.lights.push({ x, y, r: (suppressed ? 34 : 70) * size, i: suppressed ? 0.6 : 1.6, c: [1, 0.72, 0.4], life: 0.06, t: 0 });
    // a puff of gun smoke drifting off the muzzle
    const n = suppressed ? 1 : 2;
    for (let i = 0; i < n; i++) this.smoke.emit(this.t, x + Math.cos(a) * 2, y + Math.sin(a) * 2, Math.cos(a) * rand(14, 40) + rand(-6, 6), Math.sin(a) * rand(14, 40) - rand(4, 12), rand(0.5, 0.9), 1.4 * size, rand(5, 8) * size, col('#c8c2bc', 0.16), col('#c8c2bc', 0), -14, 2.4, rand(0, 6), rand(-1, 1));
  }

  tracer(x0, y0, x1, y1, w = 0.9, color = '#ffd9a0') {
    const L = Math.hypot(x1 - x0, y1 - y0);
    if (L < 6) return;
    this.tracers.push({ x0, y0, x1, y1, L, d: 0, w, c: rgba(color, 1), sp: 2600, seg: Math.min(70, L * 0.5) });
  }

  // bullet stops on a wall/floor: sparks along the normal, dust, a hole
  impact(x, y, nx, ny, dx, dy, strong = 1) {
    const rx = dx - 2 * (dx * nx + dy * ny) * nx, ry = dy - 2 * (dx * nx + dy * ny) * ny;
    const n = Math.round(4 + 4 * strong);
    for (let i = 0; i < n; i++) {
      const sp = rand(120, 420), jx = rx + nx * 0.6 + rand(-0.7, 0.7), jy = ry + ny * 0.6 + rand(-0.7, 0.7), L = Math.hypot(jx, jy) || 1;
      this.sparks.emit(this.t, x, y, (jx / L) * sp, (jy / L) * sp, rand(0.08, 0.22), 0.7, 0.25, col('#ffd28a', 1), col('#ff6b2c', 0), 900, 3, 0, 0);
    }
    for (let i = 0; i < 2; i++) this.smoke.emit(this.t, x + nx * 2, y + ny * 2, nx * rand(10, 30) + rand(-8, 8), ny * rand(10, 30) - rand(2, 8), rand(0.4, 0.8), 1.5, rand(5, 9), col('#9b938b', 0.35), col('#9b938b', 0), -6, 3, rand(0, 6), rand(-1, 1));
    // chips of concrete
    for (let i = 0; i < 3; i++) this.bits.emit(this.t, x, y, nx * rand(40, 120) + rand(-60, 60), ny * rand(40, 120) - rand(20, 80), rand(0.3, 0.6), 0.55, 0.4, col('#59524c', 1), col('#59524c', 0), 900, 1, 0, 0);
    this.lights.push({ x: x + nx * 3, y: y + ny * 3, r: 18, i: 0.7, c: [1, 0.7, 0.4], life: 0.06, t: 0 });
    this.decal(x - nx * 0.4, y - ny * 0.4);
  }

  decal(x, y) {
    if (this.decals.length >= MAX_DECALS) this.decals.shift();
    this.decals.push({ x, y, s: rand(0.75, 1.0), a: rand(0, 6.28) });
  }

  // bullet hits a character: a puff away from the shooter, darker bits
  flesh(x, y, dx, dy, head = false) {
    for (let i = 0; i < (head ? 10 : 6); i++) {
      const sp = rand(60, 220), jx = dx + rand(-0.6, 0.6), jy = dy + rand(-0.8, 0.3), L = Math.hypot(jx, jy) || 1;
      this.bits.emit(this.t, x, y, (jx / L) * sp, (jy / L) * sp, rand(0.25, 0.5), rand(0.6, 1.1), 0.3, col(i % 2 ? '#8a1c22' : '#5e1218', 1), col('#3a0b0e', 0), 700, 2, 0, 0);
    }
    this.smoke.emit(this.t, x, y, dx * 30, dy * 30 - 6, 0.35, 1.5, 6, col('#a03a3a', 0.25), col('#a03a3a', 0), 0, 4, rand(0, 6), 0);
    if (head) for (let i = 0; i < 6; i++) this.sparks.emit(this.t, x, y, rand(-120, 120), rand(-200, -40), rand(0.1, 0.25), 0.6, 0.2, col('#ffffff', 1), col('#ffd28a', 0), 700, 2, 0, 0);
  }

  // bullet stopped by a riot shield: bright sparks, no damage
  shield(x, y, dx, dy) {
    for (let i = 0; i < 9; i++) {
      const sp = rand(140, 380), jx = -dx + rand(-0.9, 0.9), jy = -Math.abs(dy) - rand(0.1, 0.9), L = Math.hypot(jx, jy) || 1;
      this.sparks.emit(this.t, x, y, (jx / L) * sp, (jy / L) * sp, rand(0.12, 0.3), 0.8, 0.25, col('#ffffff', 1), col('#9ad7ff', 0), 900, 2.5, 0, 0);
    }
    this.lights.push({ x: x - dx * 3, y, r: 26, i: 0.9, c: [0.75, 0.88, 1], life: 0.07, t: 0 });
  }

  slash(x, y, a, f) {
    this.slashes.push({ x, y, a, f, t: 0, life: 0.14 });
  }

  // loose objects: region (outlined sprite), centre position, velocity, spin;
  // flip −1 mirrors; c: the object's centre relative to the sprite anchor
  drop(r, x, y, vx, vy, a, va, { scale = 1, flip = 1, sound = null, rest = 9, bounce = 0.35, size = 2, c = null, tint = 0xffffffff } = {}) {
    if (!r) return;
    if (this.debris.length >= MAX_DEBRIS) this.debris.shift();
    this.debris.push({ r, x, y, vx, vy, a, va, s: scale, f: flip, sound, life: rest, t: 0, bounce, size, hits: 0, still: false, cx: c ? c[0] : 0, cy: c ? c[1] : 0, tint });
  }

  addLights(R) {
    for (const l of this.lights) { const k = 1 - l.t / l.life; R.addLight(l.x, l.y, l.r, l.i * k * k, l.c); }
  }

  // --- simulation ------------------------------------------------------------------------
  update(dt, level) {
    this.t += dt;
    const age = (list) => { for (let i = list.length - 1; i >= 0; i--) { const o = list[i]; o.t += dt; if (o.t >= o.life) list.splice(i, 1); } };
    age(this.flashes); age(this.lights); age(this.slashes);
    for (let i = this.tracers.length - 1; i >= 0; i--) { const tr = this.tracers[i]; tr.d += tr.sp * dt; if (tr.d - tr.seg > tr.L) this.tracers.splice(i, 1); }
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.t += dt;
      if (d.t > d.life) { this.debris.splice(i, 1); continue; }
      if (d.still) continue;
      d.vy += 1500 * dt; d.vx *= 1 - 0.4 * dt;
      const nx = d.x + d.vx * dt, ny = d.y + d.vy * dt;
      // floor: the highest surface under the object
      const s = level.surface(nx - 0.5, nx + 0.5, nx, d.y - 2, ny + d.size * 0.5);
      if (s !== null && d.vy > 0 && ny + d.size * 0.5 >= s) {
        d.y = s - d.size * 0.5;
        if (d.vy > 70) {
          if (d.sound && this.sfx && d.hits < 3) this.sfx.play(d.sound, d.x, d.y, { vol: Math.min(1, d.vy / 400), rate: rand(0.9, 1.15), cap: 6 });
          d.hits++;
          d.vy = -d.vy * d.bounce; d.vx *= 0.6; d.va = -d.va * 0.5 + rand(-4, 4);
        } else {
          d.vy = 0; d.vx *= 0.8; d.va *= 0.7;
          // settle flat (long axis horizontal)
          const flat = Math.round(d.a / Math.PI) * Math.PI;
          d.a += (flat - d.a) * Math.min(1, dt * 12);
          if (Math.abs(d.vx) < 3 && Math.abs(d.va) < 0.3) d.still = true;
        }
        d.x = nx;
      } else if (level.get(level.tx(nx), level.ty(ny)) === SOLID) {
        d.vx = -d.vx * 0.4; d.va *= -0.6;
      } else { d.x = nx; d.y = ny; }
      d.a += d.va * dt;
    }
  }

  // --- drawing ---------------------------------------------------------------------------
  drawWorld(B, view, x0, x1) {
    if (this.decals.length) {
      B.begin(view);
      for (const d of this.decals) if (d.x > x0 && d.x < x1) B.draw(this.R.hole, d.x, d.y, d.s, d.s, d.a, 0xffffffff, 1);
      B.end();
    }
    if (this.debris.length) {
      B.begin(view);
      for (const d of this.debris) {
        if (d.x < x0 || d.x > x1) continue;
        const fade = Math.min(1, (d.life - d.t) / 0.6);
        const c = Math.cos(d.a), s = Math.sin(d.a), ox = d.cx * d.s * d.f, oy = d.cy * d.s;
        B.draw(d.r, d.x - (ox * c - oy * s), d.y - (ox * s + oy * c), d.s * d.f, d.s, d.a, d.tint, fade);
      }
      B.end();
    }
  }

  drawSmoke(view) {
    this.smoke.draw(view, this.t);
    this.bits.draw(view, this.t);
  }

  drawGlow(B, view) {
    const R = this.R;
    B.begin(view); B.setBlend(1);
    for (const tr of this.tracers) {
      const u0 = Math.max(0, tr.d - tr.seg) / tr.L, u1 = Math.min(tr.L, tr.d) / tr.L;
      if (u1 <= u0) continue;
      const ax = tr.x0 + (tr.x1 - tr.x0) * u0, ay = tr.y0 + (tr.y1 - tr.y0) * u0, bx = tr.x0 + (tr.x1 - tr.x0) * u1, by = tr.y0 + (tr.y1 - tr.y0) * u1;
      B.line(R.tracer, ax, ay, bx, by, tr.w, tr.c, 0.9);
    }
    for (const f of this.flashes) {
      const k = 1 - f.t / f.life, s = f.s * (0.7 + 0.5 * k);
      B.draw(R.glow, f.x, f.y, 9 * s, 9 * s, 0, rgba('#ffb36b', 0.55 * k));
      if (!f.sup) {
        B.draw(R.muzzle, f.x, f.y, 9 * s, 5 * s, f.a + f.spin * 0.2, rgba('#fff1c8', k));
        // the hotter, shorter inner blast along the same axis (a soft blast is not a star to spin)
        B.draw(R.muzzle, f.x, f.y, 5.5 * s, 3.2 * s, f.a + f.spin * 0.1, rgba('#ffb15c', 0.8 * k));
      } else B.draw(R.muzzle, f.x, f.y, 4 * s, 2 * s, f.a, rgba('#ffd7a0', 0.6 * k));
    }
    for (const s of this.slashes) {
      const k = s.t / s.life, a = 1 - k;
      B.draw(R.slash, s.x, s.y, 13 * s.f, 13, s.a + k * 0.9 * s.f, rgba('#ffffff', 0.75 * a));
    }
    B.end();
    this.sparks.draw(view, this.t);
  }
}
