// KOR — cinematics: weather and light (docs/KOR_STORY_CINEMATIC.md §5.8–5.9).
//   Rain      drops live in a box around the camera, in three depth bands;
//             each is drawn as the streak it would leave in a 1/48 s exposure
//   Splashes  crowns on the ground plane, rings in puddles
//   Puffs     steam and smoke: soft sprites that rise, grow and thin
//   Sparks    embers and sparks: additive, with gravity and drag
//   beam()    a volumetric cone of light, broken up by a fog texture
//   glow()    a soft light source; reflect() its smear on a wet road
//   poly()    a 3D polygon through the camera, for the built world
import { rng, canvas, noise1, krgba } from './noise.js';

const TAU = Math.PI * 2;

// a soft round sprite (white, alpha falling off), cached by size
const dots = new Map();
export function softDot(px = 64) {
  if (dots.has(px)) return dots.get(px);
  const c = canvas(px, px), g = c.getContext('2d'), r = px / 2;
  const gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, px, px);
  dots.set(px, c);
  return c;
}
// a tinted copy of a sprite (cached)
const tints = new Map();
export function tinted(src, col) {
  const k = src.width + col;
  if (tints.has(k)) return tints.get(k);
  const c = canvas(src.width, src.height), g = c.getContext('2d');
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
  tints.set(k, c);
  return c;
}

export function glow(g, x, y, r, col, a = 1) {
  if (r < 0.3 || a <= 0) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, a);
  g.drawImage(tinted(softDot(64), col), x - r, y - r, r * 2, r * 2);
  g.restore();
}

// A 3D polygon: pts = [[x,y,z]...]; returns the projected path or null
export function poly(g, cam, pts, fill) {
  const q = [];
  for (const p of pts) { const s = cam.project(p[0], p[1], p[2]); if (s[2] <= 0) return null; q.push(s); }
  g.beginPath(); g.moveTo(q[0][0], q[0][1]);
  for (let i = 1; i < q.length; i++) g.lineTo(q[i][0], q[i][1]);
  g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  return q;
}

// --- rain ----------------------------------------------------------------------------------
export class Rain {
  // box: half width, height, near, far (metres, relative to the camera's x/z)
  constructor({ n = [900, 350, 40], box = [14, 9, 0.6, 40], speed = 8, wind = 1.2, seed = 5 } = {}) {
    this.r = rng(seed); this.box = box; this.speed = speed; this.wind = wind;
    this.drops = [];
    const [far, mid, near] = n, [hw, h, zn, zf] = box;
    const band = (count, z0, z1, kind) => {
      for (let i = 0; i < count; i++) this.drops.push({ x: (this.r() * 2 - 1) * hw * (z1 / zf + 0.3), y: this.r() * h, z: z0 + this.r() * (z1 - z0), v: speed * (0.85 + this.r() * 0.3), kind });
    };
    band(near, zn, 2.4, 2); band(mid, 2.4, 9, 1); band(far, 9, zf, 0);
    this.splash = []; this.t = 0;
  }
  update(dt, cam, ground = 0, splashes = true) {
    this.t += dt;
    const [hw, h] = this.box, cx = cam.pos[0], cz = cam.pos[2];
    for (const d of this.drops) {
      d.y -= d.v * dt; d.x += this.wind * dt;
      if (d.y < ground) {
        if (splashes && d.kind > 0 && this.splash.length < 160 && this.r() < 0.5) this.splash.push({ x: cx + d.x, z: cz + d.z, y: ground, t: 0 });
        d.y += h; d.x = (this.r() * 2 - 1) * hw * (d.z / this.box[3] + 0.3) - this.wind * 0.4;
      }
    }
    for (const s of this.splash) s.t += dt;
    this.splash = this.splash.filter((s) => s.t < 0.3);
  }
  // light: 0..1 how lit the rain is (it shows against light, not darkness)
  // tint(x, y, z) → [css colour, strength] or null: drops near a light take its colour
  draw(g, cam, { col = '#c9d4e0', light = 0.6, ground = 0, puddle = false, tint = null } = {}) {
    const cx = cam.pos[0], cy0 = cam.pos[1], cz = cam.pos[2], exp = 1 / 48;
    const a = [0, 0, 0, 0], b = [0, 0, 0, 0];
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.strokeStyle = col;
    for (const d of this.drops) {
      const wx = cx + d.x, wy = ground + d.y - 1.5 + cy0 * 0.2, wz = cz + d.z;
      cam.project(wx, wy, wz, a);
      if (a[2] <= 0 || a[0] < -20 || a[0] > cam.W + 20 || a[1] < -40 || a[1] > cam.H + 40) continue;
      cam.project(wx - this.wind * exp, wy + d.v * exp, wz, b);
      const w = d.kind === 2 ? Math.max(1.2, a[3] * 0.004) : Math.max(0.5, a[3] * 0.0016);
      let al = (d.kind === 2 ? 0.07 : d.kind === 1 ? 0.22 : 0.16) * light;
      if (tint) { const tc = tint(wx, wy, wz); if (tc) { g.strokeStyle = tc[0]; al = (d.kind === 2 ? 0.1 : 0.3) * tc[1]; } else g.strokeStyle = col; }
      if (al < 0.005) continue;
      g.globalAlpha = Math.min(1, al);
      g.lineWidth = w;
      g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(a[0], a[1]); g.stroke();
    }
    // splashes: a crown (or a ring on water)
    g.lineWidth = 0.8; g.strokeStyle = col;
    for (const s of this.splash) {
      const k = s.t / 0.3; cam.project(s.x, s.y, s.z, a); if (a[2] <= 0) continue;
      const r = a[3] * (puddle ? 0.05 : 0.025) * (0.3 + k), ry = r * (puddle ? 0.25 : 0.4);
      g.globalAlpha = 0.35 * (1 - k) * light;
      g.beginPath(); g.ellipse(a[0], a[1], Math.max(0.4, r), Math.max(0.3, ry), 0, puddle ? 0 : Math.PI, TAU); g.stroke();
    }
    g.restore();
  }
}

// --- puffs (steam / smoke) and sparks ------------------------------------------------------------
// a puff of smoke: lumpy, thinner at the edge, never a clean disc (cached)
const puffs = [];
export function smokeSprite(i = 0) {
  if (puffs[i]) return puffs[i];
  const S = 64, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = (x - S / 2) / (S / 2), v = (y - S / 2) / (S / 2), r = Math.hypot(u, v);
    const n = fbmLite(u * 2.2 + i * 5.3, v * 2.2 - i * 3.1, i);
    const a = Math.max(0, 1 - r * (1.05 - n * 0.55)) ** 1.6 * (0.45 + n * 0.9);
    const o = (y * S + x) * 4; d[o] = d[o + 1] = d[o + 2] = 255; d[o + 3] = Math.min(255, a * 255);
  }
  g.putImageData(img, 0, 0);
  return (puffs[i] = c);
}
function fbmLite(x, y, s) { let v = 0, a = 0.5, f = 1; for (let o = 0; o < 4; o++) { v += (noise1(x * f + o * 9.1 + s * 3, 40 + o) * noise1(y * f - o * 4.3, 50 + o) * 0.5 + 0.5) * a; a *= 0.5; f *= 2; } return v; }
export class Puffs {
  constructor({ rate = 8, life = 3, rise = 0.5, grow = 0.6, size = 0.3, col = '#b8c2cc', a = 0.12, seed = 9, lumpy = false } = {}) {
    Object.assign(this, { rate, life, rise, grow, size, col, a, lumpy });
    this.r = rng(seed); this.p = []; this.acc = 0;
  }
  // emitters: [[x,y,z], ...]
  update(dt, emitters, wind = 0.15) {
    this.acc += dt * this.rate;
    while (this.acc >= 1) {
      this.acc -= 1;
      const e = emitters[Math.floor(this.r() * emitters.length)];
      this.p.push({ x: e[0] + (this.r() - 0.5) * 0.2, y: e[1], z: e[2] + (this.r() - 0.5) * 0.2, t: 0, s: this.r() });
    }
    for (const q of this.p) { q.t += dt; q.y += this.rise * dt * (1 - q.t / this.life * 0.5); q.x += wind * dt; }
    this.p = this.p.filter((q) => q.t < this.life);
  }
  draw(g, cam, light = 1) {
    const s = [0, 0, 0, 0], spr = tinted(softDot(64), this.col);
    const lump = this.lumpy ? [0, 1, 2, 3].map((i) => tinted(smokeSprite(i), this.col)) : null;
    g.save();
    for (const q of this.p) {
      cam.project(q.x, q.y, q.z, s); if (s[2] <= 0) continue;
      const k = q.t / this.life, r = s[3] * (this.size + this.grow * k) * (0.7 + q.s * 0.6);
      g.globalAlpha = this.a * light * Math.sin(Math.PI * Math.min(1, k * 1.4)) ;
      if (lump) {
        // each puff turns slowly as it rises and spreads
        g.save(); g.translate(s[0], s[1]); g.rotate(q.s * 6.28 + q.t * (q.s - 0.5) * 0.8);
        g.drawImage(lump[(q.s * 4) | 0], -r, -r, r * 2, r * 2); g.restore();
      } else g.drawImage(spr, s[0] - r, s[1] - r, r * 2, r * 2);
    }
    g.restore();
  }
}

export class Sparks {
  constructor({ seed = 4, col = '#ffb15a', drag = 0.6, gravity = -1.2 } = {}) { this.r = rng(seed); this.p = []; this.col = col; this.drag = drag; this.gravity = gravity; }
  burst(x, y, z, n, speed = 1, up = 1) {
    for (let i = 0; i < n; i++) {
      const a = this.r() * TAU, s = speed * (0.3 + this.r());
      this.p.push({ x, y, z, vx: Math.cos(a) * s * 0.6, vy: up * (0.4 + this.r()) * speed, vz: Math.sin(a) * s * 0.3, t: 0, life: 0.6 + this.r() * 1.6, k: this.r() });
    }
  }
  update(dt) {
    for (const p of this.p) {
      p.t += dt; p.vy += this.gravity * dt; const d = Math.exp(-this.drag * dt);
      p.vx *= d; p.vy *= d; p.vz *= d;
      p.x += p.vx * dt + noise1(p.t * 3 + p.k * 10, 5) * dt * 0.05; p.y += p.vy * dt; p.z += p.vz * dt;
    }
    this.p = this.p.filter((p) => p.t < p.life);
  }
  draw(g, cam, a = 1) {
    const s = [0, 0, 0, 0], e = [0, 0, 0, 0];
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (const p of this.p) {
      cam.project(p.x, p.y, p.z, s); if (s[2] <= 0) continue;
      cam.project(p.x - p.vx / 30, p.y - p.vy / 30, p.z - p.vz / 30, e);
      const k = 1 - p.t / p.life, w = Math.max(0.6, s[3] * 0.004);
      g.globalAlpha = a * k * (0.6 + 0.4 * Math.sin(p.t * 30 + p.k * 9));
      g.strokeStyle = this.col; g.lineWidth = w;
      g.beginPath(); g.moveTo(e[0], e[1]); g.lineTo(s[0], s[1]); g.stroke();
      glow(g, s[0], s[1], w * 4, this.col, 0.25 * k * a);
    }
    g.restore();
  }
}

// --- light ---------------------------------------------------------------------------------------
// A volumetric cone from `o` toward `d` (unit), half-angle `ang`, length
// `L` (m). K: colour temperature; fog: texture that breaks the beam up.
// Three nested cones (wide and faint → narrow core) give it a soft edge;
// the light falls off along the beam and is screened, not added.
export function beam(g, cam, o, d, ang, L, K, a, fog = null, t = 0) {
  const p0 = cam.project(o[0], o[1], o[2], [0, 0, 0, 0]);
  const e = [o[0] + d[0] * L, o[1] + d[1] * L, o[2] + d[2] * L];
  const p1 = cam.project(e[0], e[1], e[2], [0, 0, 0, 0]);
  if (p0[2] <= 0 || p1[2] <= 0) return;
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  g.save();
  g.globalCompositeOperation = 'screen';
  for (const [k, al] of [[1.8, 0.25], [1.0, 0.45], [0.45, 0.6]]) {
    const r1 = Math.tan(ang * k) * L * p1[3], r0 = Math.max(0.6, Math.tan(ang * k) * 0.3 * p0[3]);
    g.beginPath();
    g.moveTo(p0[0] + nx * r0, p0[1] + ny * r0); g.lineTo(p1[0] + nx * r1, p1[1] + ny * r1);
    g.lineTo(p1[0] - nx * r1, p1[1] - ny * r1); g.lineTo(p0[0] - nx * r0, p0[1] - ny * r0); g.closePath();
    const gr = g.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
    gr.addColorStop(0, krgba(K, 0.5 * a * al)); gr.addColorStop(0.18, krgba(K, 0.24 * a * al)); gr.addColorStop(0.6, krgba(K, 0.06 * a * al)); gr.addColorStop(1, krgba(K, 0));
    g.fillStyle = gr; g.fill();
  }
  // rain and haze break the beam into drifting bands
  if (fog) {
    const r1 = Math.tan(ang * 1.8) * L * p1[3];
    g.beginPath();
    g.moveTo(p0[0], p0[1]); g.lineTo(p1[0] + nx * r1, p1[1] + ny * r1); g.lineTo(p1[0] - nx * r1, p1[1] - ny * r1); g.closePath(); g.clip();
    g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 0.5;
    const sw = Math.max(l, r1 * 2) * 1.4, ox = (t * 22) % sw;
    g.drawImage(fog, Math.min(p0[0], p1[0]) - ox, Math.min(p0[1], p1[1]) - r1, sw, r1 * 2.4);
    g.drawImage(fog, Math.min(p0[0], p1[0]) - ox + sw, Math.min(p0[1], p1[1]) - r1, sw, r1 * 2.4);
  }
  g.restore();
}

// a light's smear on a wet surface below it: its mirror image stretched
// toward the camera by the ripples. A soft vertical glow, broken across by
// fine moving ripple lines. p: light position; ground y; K colour (Kelvin or
// css); a strength; w width (m)
export function reflect(g, cam, p, groundY, K, a, w = 0.25, t = 0) {
  const m = cam.project(p[0], groundY - (p[1] - groundY), p[2], [0, 0, 0, 0]);
  const g0 = cam.project(p[0], groundY, p[2], [0, 0, 0, 0]);
  if (m[2] <= 0 || g0[2] <= 0) return;
  const top = g0[1], mid = Math.max(top + 1, m[1]), bot = mid + (mid - top) * 1.8;
  const width = Math.max(1.5, w * g0[3]), col = typeof K === 'string' ? K : krgba(K, 1);
  g.save(); g.globalCompositeOperation = 'lighter';
  g.globalAlpha = Math.min(1, a * 0.8);
  g.drawImage(tinted(softDot(64), col), g0[0] - width * 1.4, top, width * 2.8, bot - top);
  g.globalAlpha = Math.min(1, a);
  g.drawImage(tinted(softDot(64), col), g0[0] - width * 0.6, top + (mid - top) * 0.3, width * 1.2, (bot - top) * 0.7);
  // ripples: thin bright lines that drift; denser and finer far away
  g.fillStyle = col;
  const n = Math.min(120, Math.max(6, Math.round((bot - top) / 2)));
  for (let i = 0; i < n; i++) {
    const v = ((i + (t * 3.1 + p[0] * 13) % 1) / n), y = top + (bot - top) * v;
    const k = Math.sin(Math.PI * Math.min(1, v * 1.3)) * (0.4 + 0.6 * noise1(i * 1.7 + t * 2.3, 8));
    if (k < 0.05) continue;
    const L = width * (0.4 + 1.6 * Math.max(0, noise1(i * 0.6 - t * 1.4, 9) + 0.3)) * (1 + v);
    g.globalAlpha = Math.min(1, a * 0.5 * k);
    g.fillRect(g0[0] - L / 2 + noise1(i * 0.9 + t, 10) * width * 0.4, y, L, 1);
  }
  g.restore();
}

// where a figure stands: the ground darkened under and round its feet (the
// light that can't get in there), a soft ellipse in perspective
export function contact(g, cam, x, z, r = 0.45, a = 0.5, y = 0) {
  const c = cam.project(x, y, z), e = cam.project(x + r, y, z), f = cam.project(x, y, z + r);
  if (c[2] <= 0) return;
  const rx = Math.abs(e[0] - c[0]), ry = Math.max(0.6, Math.abs(f[1] - c[1]));
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = a;
  g.translate(c[0], c[1]); g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(40,40,40,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(-rx, -rx, rx * 2, rx * 2);
  g.restore();
}
