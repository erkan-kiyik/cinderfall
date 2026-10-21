// KOR — M1 engine test scene.
//
// The M0 street, rebuilt for the GPU: parallax layers, the five operators and
// two Syndicate troopers as baked sprites, real lights (lamp cone, a bulb,
// windows, fire, muzzle flashes, explosions), GPU particles, bloom, camera
// shake, and a stress mode that throws thousands of extra sprites on screen.
import { STREET, crate, barrier, lampPost, dumpster, burnBarrel, cone } from '../art/env/street.js';
import { drawFigure, gunPoint } from '../art/figure.js';
import { OPS } from '../art/ops/index.js';
import { TETIKCI, KALKANLI } from '../art/enemies/syndicate.js';
import { WEAPONS } from '../art/weapons/index.js';
import { fill, defocus } from '../art/kit.js';
import { rgba } from '../gfx/batch.js';
import { ParticleSystem, col } from '../gfx/particles.js';

export const BAKE_VERSION = 'm1-57';

// Pixel density per quality: background layers, characters, effects.
const DENS = { low: [3, 3.6, 24], med: [4.5, 5.2, 32], high: [6, 7, 48] };

const aim = (k = 0.96) => ({ w: WEAPONS.kestrel, at: [10.6, -46.6], ang: -0.03, k });
const POSES = {
  vex: { ...OPS.vex.pose, lean: -0.05, head: -0.1, nThigh: 0.32, nShin: 0.12, fThigh: -0.3, fShin: -0.04, gun: aim() },
  tet: { ...TETIKCI.pose, lean: -0.04, head: -0.06, gun: { ...aim(), mat: TETIKCI.pose.gun.mat } },
};
const FIG_BOX = [-36, -82, 48, 5];

// --- FX sprites (white, tinted at draw time) ----------------------------------
function radial(g, stops) {
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  for (const [o, a] of stops) gr.addColorStop(o, `rgba(255,255,255,${a})`);
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill();
}
const FX = {
  dot: (g) => radial(g, [[0, 1], [0.45, 0.9], [1, 0]]),
  glow: (g) => radial(g, [[0, 0.9], [0.25, 0.45], [0.6, 0.12], [1, 0]]),
  smoke: (g) => {
    for (const [x, y, r, a] of [[0, 0.1, 0.62, 0.5], [-0.35, -0.1, 0.45, 0.45], [0.35, -0.15, 0.42, 0.45], [0.05, -0.38, 0.38, 0.4]]) {
      g.save(); g.translate(x, y); g.scale(r, r); radial(g, [[0, a], [0.7, a * 0.6], [1, 0]]); g.restore();
    }
  },
  flash: (g) => {
    g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(-0.2, -0.38); g.lineTo(1, 0); g.lineTo(-0.2, 0.38); g.lineTo(0.05, 0); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0.1, -0.95); g.lineTo(0.3, 0); g.lineTo(0.1, 0.95); g.lineTo(-0.1, 0); g.closePath(); g.fill();
    g.save(); g.scale(0.5, 0.5); radial(g, [[0, 1], [1, 0]]); g.restore();
  },
  tracer: (g) => {
    const gr = g.createLinearGradient(0, 0, 1, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = gr; g.fillRect(0, -0.5, 1, 1);
  },
  // a light cone from its source at x 0 to its wide end at x 1, fading out
  beam: (g) => {
    const gr = g.createLinearGradient(0, 0, 1, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, -0.05); g.lineTo(1, -0.5); g.lineTo(1, 0.5); g.lineTo(0, 0.05); g.closePath(); g.fill();
  },
  flame: (g) => {
    g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(-0.5, 0); g.quadraticCurveTo(-0.55, -0.55, -0.15, -0.8); g.quadraticCurveTo(-0.05, -0.5, 0.05, -1);
    g.quadraticCurveTo(0.35, -0.6, 0.25, -0.35); g.quadraticCurveTo(0.45, -0.5, 0.5, -0.7); g.quadraticCurveTo(0.6, -0.3, 0.5, 0); g.closePath(); g.fill();
  },
};

export function bakeList(quality) {
  const [bg, ch, fx] = DENS[quality];
  const E = [];
  const layer = (name, box, paint, scale, chunk = 300) => E.push({ name, box, scale, paint, chunk });
  layer('sky', [-10, -176, 610, -20], STREET.sky, Math.min(2, bg));
  layer('far', [-10, -182, 610, -58], defocus(STREET.farCity, 0.45), bg * 0.6);
  layer('mid', [-10, -168, 610, -38], defocus(STREET.midIndustry, 0.22), bg * 0.75);
  layer('fac', [-10, -118, 610, 0.5], STREET.facades, bg);
  layer('ground', [-10, -0.5, 610, 42], STREET.ground, bg);
  const fg = (g) => {
    g.fillStyle = '#0b0e13';
    g.beginPath(); g.moveTo(-10, 40); g.lineTo(-10, 22); g.lineTo(18, 18); g.lineTo(30, 24); g.lineTo(46, 21); g.lineTo(64, 30); g.lineTo(64, 40); g.fill();
    g.beginPath(); g.moveTo(96, 40); g.lineTo(104, 28); g.lineTo(150, 30); g.lineTo(156, 40); g.fill();
  };
  E.push({ name: 'fg', box: [-12, 16, 160, 41], scale: bg, paint: fg });
  // props, outlined like the play layer they belong to
  const prop = (name, box, paint) => E.push({ name, box, scale: ch, paint, outline: 0.85 });
  prop('lamp', [120, -86, 152, 1], (g) => lampPost(g, 128));
  prop('crates', [90, -18, 126, 1], (g) => { crate(g, 92); crate(g, 110, 14, 12); });
  prop('cone', [294, -12, 306, 1], (g) => cone(g, 300));
  prop('barrier', [394, -18, 432, 1], (g) => barrier(g, 396));
  prop('dumpster', [518, -24, 566, 1], (g) => dumpster(g, 522));
  prop('barrel', [572, -16, 586, 1], (g) => burnBarrel(g, 574));
  // characters
  const fig = (name, op, pose, flip = false) => E.push({ name, box: FIG_BOX, scale: ch, outline: 0.85, paint: (g) => drawFigure(g, op, pose, flip) });
  fig('vex', OPS.vex, POSES.vex);
  for (const id of ['hale', 'morrow', 'kite', 'brick']) fig(id, OPS[id], OPS[id].pose);
  fig('tet', TETIKCI, POSES.tet, true);
  fig('kal', KALKANLI, KALKANLI.pose, true);
  // stress sprites
  E.push({ name: 's.crate', box: [-3, -6, 3, 0], scale: ch, outline: 0.5, paint: (g) => crate(g, -2.6, 5.2, 5.2) });
  E.push({ name: 's.cone', box: [-3, -6, 3, 0], scale: ch, outline: 0.5, paint: (g) => { g.save(); g.scale(0.5, 0.5); cone(g, 0); g.restore(); } });
  E.push({ name: 's.coin', box: [-2, -2, 2, 2], scale: ch, outline: 0.35, paint: (g) => { fill(g, 'M 0 -1.6 L 1.4 -0.8 L 1.4 0.8 L 0 1.6 L -1.4 0.8 L -1.4 -0.8 Z', '#ffc93c'); fill(g, 'M -0.5 0 a 0.5 0.5 0 1 0 1 0 a 0.5 0.5 0 1 0 -1 0 Z', '#1a1c20'); } });
  // effects: 1×1-unit white shapes
  for (const [n, p] of Object.entries(FX)) {
    const box = n === 'tracer' || n === 'beam' ? [0, -0.5, 1, 0.5] : n === 'flame' ? [-0.6, -1.05, 0.6, 0.05] : [-1, -1, 1, 1];
    E.push({ name: 'fx.' + n, box, scale: fx * (n === 'tracer' ? 2 : 1), paint: p });
  }
  return E;
}

// ---------------------------------------------------------------------------
const AX = 300; // parallax anchor: layers line up as in the M0 board at x = 300
const PLX = { sky: 0, far: 0.15, mid: 0.35, fac: 1, ground: 1, fg: 1.25 };
const LAYER_Y = { sky: -176, far: -182, mid: -168, fac: -118, ground: -0.5 };
const ACTORS = [['brick', 40], ['morrow', 72], ['kite', 104], ['hale', 160], ['vex', 196], ['tet', 444], ['kal', 486]];
const WINDOWS = [[18, -77], [78, -77], [48, -47], [108, -47], [241, -97]];

export class M1Scene {
  constructor(eng) {
    this.e = eng;
    const { gl, atlas } = eng;
    const cap = eng.renderer.q.particles;
    const R = (n) => atlas.get(n);
    this.ps = {
      spark: new ParticleSystem(gl, atlas, R('fx.dot'), cap >> 1, { additive: true, streak: 0.035 }),
      ember: new ParticleSystem(gl, atlas, R('fx.dot'), cap >> 2, { additive: true }),
      smoke: new ParticleSystem(gl, atlas, R('fx.smoke'), cap >> 2, { additive: false }),
    };
    this.t = 0;
    this.camT = 0; this.manual = false; this.camX = 300; this.camPrev = 300;
    this.flashes = []; // [x, y, t0, dur, radius, intensity, r, g, b]
    this.tracers = []; // [x0, y0, x1, y1, t0, color]
    this.fireAt = 0.4; this.enemyFireAt = 1.3; this.boomAt = 5.5;
    this.recoil = 0;
    // stress pool
    this.N = 0; const MAX = 20000;
    this.sx = new Float32Array(MAX); this.sy = new Float32Array(MAX); this.vx = new Float32Array(MAX); this.vy = new Float32Array(MAX);
    this.px = new Float32Array(MAX); this.py = new Float32Array(MAX); this.kind = new Uint8Array(MAX); this.rot = new Float32Array(MAX); this.spin = new Float32Array(MAX);
    this.rng = 12345;
    this.mats = {}; for (const k of ['sky', 'far', 'mid', 'world', 'fg']) this.mats[k] = new Float32Array(9);
  }

  // View matrix for a parallax factor; layers line up with the M0 board at x = AX.
  viewFor(key, p) {
    const cam = this.e.camera, save = cam.x;
    cam.x = AX + (save - AX) * p;
    cam.matrix(1, this.mats[key]);
    cam.x = save;
    return this.mats[key];
  }

  rand() { this.rng = (this.rng * 1664525 + 1013904223) >>> 0; return this.rng / 4294967296; }

  setStress(n) {
    const cam = this.e.camera;
    for (let i = this.N; i < n; i++) {
      this.sx[i] = this.px[i] = this.camX + (this.rand() - 0.5) * cam.viewW;
      this.sy[i] = this.py[i] = -20 - this.rand() * 110;
      this.vx[i] = (this.rand() - 0.5) * 60; this.vy[i] = (this.rand() - 0.5) * 40;
      this.kind[i] = (this.rand() * 3) | 0; this.rot[i] = 0; this.spin[i] = (this.rand() - 0.5) * 6;
    }
    this.N = n;
  }

  // --- simulation (fixed 120 Hz) ----------------------------------------------
  update(dt) {
    this.t += dt;
    const t = this.t, cam = this.e.camera;
    cam.update(dt);
    // camera: slow pan along the street unless the player drags it
    this.camPrev = this.camX;
    if (!this.manual) { this.camT += dt; this.camX = 300 + Math.sin(this.camT * 0.16) * 136; }
    // VEX fires bursts at the barrier; the trooper answers
    if (t >= this.fireAt) {
      const m = gunPoint(POSES.vex.gun, WEAPONS.kestrel.muzzle), mx = 196 + m[0], my = m[1];
      this.muzzle(mx, my, 1, '#ff9a5c');
      const hx = 398 + this.rand() * 6, hy = -13 - this.rand() * 4;
      this.tracers.push([mx + 2, my, hx, hy, t, 0xff7ac2ff]);
      this.impact(hx, hy, '#ffd08a');
      this.recoil = 1;
      const burst = (t * 10 | 0) % 4;
      this.fireAt = t + (burst === 3 ? 0.9 : 0.09);
    }
    if (t >= this.enemyFireAt) {
      const m = gunPoint(POSES.tet.gun, WEAPONS.kestrel.muzzle), mx = 444 - m[0], my = m[1];
      this.muzzle(mx, my, -1, '#ff6070');
      this.tracers.push([mx - 2, my, 214 + this.rand() * 40, -30 - this.rand() * 26, t, 0xff6a5aff]);
      this.enemyFireAt = t + 0.75 + this.rand() * 0.8;
    }
    if (t >= this.boomAt) { this.explode(560 + this.rand() * 30, -6); this.boomAt = t + 7; }
    // fire: embers and smoke off the burn barrel
    if (this.rand() < dt * 30) this.ps.ember.emit(t, 576 + this.rand() * 6, -15, (this.rand() - 0.5) * 6, -12 - this.rand() * 14, 1.2 + this.rand(), 0.9, 0.3, col('#ffb35a'), col('#ff4a1a', 0), -6, 0.6);
    if (this.rand() < dt * 6) this.ps.smoke.emit(t, 579 + (this.rand() - 0.5) * 4, -22, (this.rand() - 0.5) * 3, -6 - this.rand() * 3, 3.2, 4, 14, col('#4a4650', 0.45), col('#2a2a34', 0), -0.6, 0.2, this.rand() * 6, (this.rand() - 0.5) * 0.6);
    this.recoil = Math.max(0, this.recoil - dt * 14);
    // stress sprites: gravity, floor bounce, walls at the view's edges
    const n = this.N, sx = this.sx, sy = this.sy, vx = this.vx, vy = this.vy, px = this.px, py = this.py;
    const L = this.camX - cam.viewW / 2, Rr = this.camX + cam.viewW / 2;
    for (let i = 0; i < n; i++) {
      px[i] = sx[i]; py[i] = sy[i];
      vy[i] += 120 * dt;
      sx[i] += vx[i] * dt; sy[i] += vy[i] * dt;
      if (sy[i] > 0) { sy[i] = 0; vy[i] = -Math.abs(vy[i]) * 0.82 - 20; }
      if (sx[i] < L) { sx[i] = L; vx[i] = Math.abs(vx[i]); } else if (sx[i] > Rr) { sx[i] = Rr; vx[i] = -Math.abs(vx[i]); }
      this.rot[i] += this.spin[i] * dt;
    }
    // expire transient effects
    while (this.tracers.length && t - this.tracers[0][4] > 0.06) this.tracers.shift();
    while (this.flashes.length && t - this.flashes[0][2] > this.flashes[0][3]) this.flashes.shift();
  }

  muzzle(x, y, dir, color) {
    const t = this.t;
    this.flashes.push([x, y, t, 0.05, 46, 2.2, 1, 0.78, 0.5, dir]);
    for (let i = 0; i < 3; i++) this.ps.smoke.emit(t, x + dir * 2, y, dir * (8 + this.rand() * 10), -3 - this.rand() * 4, 0.7, 1.2, 4.5, col('#9aa0aa', 0.28), col('#9aa0aa', 0), -2, 2.2, this.rand() * 6, 1);
    for (let i = 0; i < 2; i++) this.ps.spark.emit(t, x, y, dir * (60 + this.rand() * 60), (this.rand() - 0.5) * 40, 0.08, 0.5, 0.2, col(color), col(color, 0), 0, 4);
  }

  impact(x, y, color) {
    const t = this.t;
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + (this.rand() - 0.5) * 2.2;
      const s = 30 + this.rand() * 60;
      this.ps.spark.emit(t, x, y, Math.cos(a) * s, Math.sin(a) * s - 20, 0.2 + this.rand() * 0.2, 0.45, 0.15, col(color), col('#ff5a1a', 0), 140, 3);
    }
    this.ps.smoke.emit(t, x, y, -4, -4, 0.6, 1.0, 4.5, col('#b8b2aa', 0.35), col('#b8b2aa', 0), -3, 2.5, this.rand() * 6, 1);
  }

  explode(x, y) {
    const t = this.t;
    this.flashes.push([x, y, t, 0.5, 170, 2.4, 1, 0.62, 0.32, 0]);
    this.e.camera.addShake(0.75);
    for (let i = 0; i < 90; i++) {
      const a = -Math.PI * this.rand(), s = 40 + this.rand() * 160;
      this.ps.spark.emit(t, x, y - 4, Math.cos(a) * s, Math.sin(a) * s, 0.4 + this.rand() * 0.7, 0.8, 0.2, col('#ffe0a0'), col('#ff4a1a', 0), 160, 2.2);
    }
    for (let i = 0; i < 28; i++) {
      const a = -Math.PI * this.rand(), s = 10 + this.rand() * 40;
      this.ps.smoke.emit(t, x, y - 6, Math.cos(a) * s, Math.sin(a) * s - 10, 2.2 + this.rand() * 1.5, 6, 22, col('#3c3a42', 0.7), col('#26252c', 0), -4, 1.4, this.rand() * 6, (this.rand() - 0.5));
    }
    for (let i = 0; i < 40; i++) this.ps.ember.emit(t, x + (this.rand() - 0.5) * 16, y - 6, (this.rand() - 0.5) * 50, -30 - this.rand() * 60, 1 + this.rand() * 1.5, 1.2, 0.3, col('#ffb35a'), col('#ff4a1a', 0), 40, 0.8);
  }

  pan(dx) { this.manual = true; this.camX = Math.max(162, Math.min(438, this.camX + dx)); }

  // --- rendering --------------------------------------------------------------
  render(alpha) {
    const e = this.e, R = e.renderer, B = e.batch, A = e.atlas, cam = e.camera, t = this.t;
    cam.x = this.camPrev + (this.camX - this.camPrev) * alpha;
    cam.y = -58;
    // lights (world space)
    const flick = 0.85 + Math.sin(t * 23) * 0.06 + Math.sin(t * 7.3) * 0.06;
    R.addLight(143, -78, 100, 1.25, [1, 0.84, 0.6], Math.PI / 2, Math.cos(0.44), 0.18);
    R.addLight(143, -80, 22, 0.9, [1, 0.9, 0.7]);
    R.addLight(232, -72, 40, 0.5, [1, 0.72, 0.42]);
    R.addLight(221, -6, 64, 0.6, [1, 0.56, 0.32]);
    for (const [x, y] of WINDOWS) R.addLight(x, y, 26, 0.35, [1, 0.72, 0.42]);
    R.addLight(579, -20, 80, 1.3 * flick, [1, 0.55, 0.24]);
    for (const f of this.flashes) {
      const k = 1 - (t - f[2]) / f[3];
      R.addLight(f[0], f[1], f[4], f[5] * k * k, [f[6], f[7], f[8]]);
    }
    // scene: background → play layer
    R.beginScene();
    B.resetStats();
    const w = this.viewFor('world', 1);
    const layer = (name, view) => {
      B.begin(view);
      for (let i = 0; ; i++) { const r = A.get(`${name}#${i}`); if (!r) break; B.draw(r, -10 + i * 300, LAYER_Y[name]); }
      B.end();
    };
    const far = this.viewFor('far', PLX.far);
    layer('sky', this.viewFor('sky', PLX.sky)); layer('far', far); layer('mid', this.viewFor('mid', PLX.mid)); layer('fac', w); layer('ground', w);
    B.begin(w);
    for (const n of ['lamp', 'crates', 'cone', 'dumpster', 'barrel']) B.draw(A.get(n), 0, 0);
    const breath = Math.sin(t * 2.2) * 0.006;
    for (const [n, x] of ACTORS) B.draw(A.get(n), x - (n === 'vex' ? this.recoil * 0.7 : 0), 0, 1, 1 + breath);
    B.draw(A.get('barrier'), 0, 0);
    // stress sprites (interpolated)
    if (this.N) {
      const rs = [A.get('s.crate'), A.get('s.cone'), A.get('s.coin')];
      for (let i = 0; i < this.N; i++) B.draw(rs[this.kind[i]], this.px[i] + (this.sx[i] - this.px[i]) * alpha, this.py[i] + (this.sy[i] - this.py[i]) * alpha, 1, 1, this.kind[i] === 2 ? this.rot[i] : 0);
    }
    B.end();
    // smoke is lit like the scene
    this.ps.smoke.draw(w, t);
    R.lightPass(w);
    R.compose();
    // emissive: glows, flames, tracers, flashes, sparks, embers (unlit, feed bloom)
    B.begin(w); B.setBlend(1);
    const glow = A.get('fx.glow'), flame = A.get('fx.flame'), flash = A.get('fx.flash'), tr = A.get('fx.tracer');
    B.draw(glow, 143, -79, 9, 5, 0, rgba('#fff1d0', 0.6));
    B.draw(glow, 232, -74, 2.4, 2.4, 0, rgba('#ffe2b0', 0.7));
    for (const [x, y] of WINDOWS) B.draw(glow, x, y, 14, 12, 0, rgba('#ffb070', 0.14));
    for (let k = 0; k < 3; k++) {
      const ph = t * (9 + k * 3) + k * 2.1;
      B.draw(flame, 579 + (k - 1) * 2.4, -14, 3.6 + Math.sin(ph) * 0.6, 6 + Math.sin(ph * 1.3) * 1.6 - k * 0.8, Math.sin(ph * 0.7) * 0.15, rgba(k === 1 ? '#ffd56a' : '#ff8a3a', 0.9));
    }
    B.draw(glow, 579, -18, 22, 18, 0, rgba('#ff8a3a', 0.25 * flick));
    for (const tc of this.tracers) B.line(tr, tc[0], tc[1], tc[2], tc[3], 0.9, tc[5], 1 - (t - tc[4]) / 0.06);
    for (const f of this.flashes) {
      if (f[3] > 0.1) { const k = 1 - (t - f[2]) / f[3]; B.draw(glow, f[0], f[1], 60 * (1.2 - k), 60 * (1.2 - k), 0, rgba('#ffb060', 0.8 * k)); continue; }
      const k = 1 - (t - f[2]) / f[3];
      B.draw(flash, f[0], f[1], 7 * f[9], 4.5, 0, rgba('#ffd9a0', k));
      B.draw(glow, f[0], f[1], 8, 8, 0, rgba('#ffb060', 0.6 * k));
    }
    B.end();
    this.ps.spark.draw(w, t);
    this.ps.ember.draw(w, t);
    // foreground silhouettes over everything
    B.begin(this.viewFor('fg', PLX.fg)); B.draw(A.get('fg'), 0, 0); B.end();
    R.finish(t);
  }
}

export { FX, DENS };
