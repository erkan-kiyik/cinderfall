// KOR — cinematics: surfaces lit per pixel, baked once per shot
// (docs/KOR_STORY_CINEMATIC.md §5.9).
//   Ground   a wet ground plane: mud, asphalt or concrete with standing water.
//            Each pixel is a ray onto the plane; the bump of the surface, the
//            puddles, Fresnel at grazing angles and every light are worked
//            out once, into a base layer and one layer per light that moves
//            or flickers (the shot sets their strength each frame).
//   bokeh()  an out-of-focus point of light: the aperture's disc, hard edged
//            with a brighter rim, not a soft blob
import { canvas, fbm2, noise2, kelvin, clamp } from './noise.js';

const TAU = Math.PI * 2;

// mat(x, z) → { alb: [r,g,b] 0..1, wet: 0..1 (1 = standing water), bump: m }
// height(x, z) → metres (the bump; only its slope is used)
// lights: [{ p: [x,y,z], K, I, layer: true|false }]; I = intensity at 1 m
// mirror: [{ p: [x,y,z], r: m, K, I }]: bright things seen in the water
export class Ground {
  // lazy: bake a few rows at a time through step(ms); draw() finishes the rest
  constructor(cam, o = {}) {
    this.o = o; this.cam = cam; this.W = cam.W; this.H = cam.H;
    // the camera as it is now is the one the layers are baked for
    this.snap = { yaw: cam._yaw, pitch: cam._pitch, p: cam._p.slice(), f: cam.f };
    this.ref = [cam.pos[0] + Math.sin(cam.yaw) * 10, cam.pos[1] + Math.sin(cam.pitch) * 10, cam.pos[2] + Math.cos(cam.yaw) * 10];
    const r0 = cam.project(...this.ref); this.r0 = [r0[0], r0[1]];
    this.gen = this.bake(); this.ready = false;
    if (!o.lazy) this.finish();
  }
  step(ms = 6) { if (this.ready) return; const t0 = performance.now(); while (performance.now() - t0 < ms) if (this.gen.next().done) { this.ready = true; return; } }
  finish() { while (!this.ready) if (this.gen.next().done) this.ready = true; }
  *bake() {
    const cam = this.cam;
    const { y = 0, mat, height, lights = [], mirror = [], sky = [0.02, 0.022, 0.026], amb = [0.012, 0.011, 0.01], scale = 0.6, zMax = 400, haze = null, fade = 0.5 } = this.o;
    const W = cam.W, H = cam.H, sw = Math.max(8, Math.round(W * scale)), sh = Math.max(8, Math.round(H * scale));
    this.y = y;
    const n = lights.filter((l) => l.layer).length;
    const base = new Float32Array(sw * sh * 3), lay = Array.from({ length: n }, () => new Float32Array(sw * sh * 3));
    const S = this.snap, cy = Math.cos(S.yaw), sy = Math.sin(S.yaw), cp = Math.cos(S.pitch), sp = Math.sin(S.pitch);
    const C = S.p, f = S.f;
    const Lk = lights.map((l) => (l.col || kelvin(l.K).map((v) => v / 255)).map((v) => v * l.I));
    const Mk = mirror.map((m) => (m.col || kelvin(m.K).map((v) => v / 255)).map((v) => v * m.I));
    const hit = new Uint8Array(sw * sh);
    const e = 0.02;
    let top = sh;
    for (let py = 0; py < sh; py++) {
      if (py % 8 === 7) yield;
      const Y = (py + 0.5) / scale;
      for (let px = 0; px < sw; px++) {
        const X = (px + 0.5) / scale;
        // the ray in camera space, then in the world
        const x1 = (X - W / 2) / f, y2 = -(Y - H / 2) / f, z2 = 1;
        const dy = y2 * cp + z2 * sp, z1 = -y2 * sp + z2 * cp;
        const dx = x1 * cy + z1 * sy, dz = -x1 * sy + z1 * cy;
        if (dy >= -1e-4) continue;
        const tt = (y - C[1]) / dy, wx = C[0] + dx * tt, wz = C[2] + dz * tt;
        if (tt > zMax) continue;
        if (py < top) top = py;
        // the far edge of the baked ground melts into whatever is behind it
        hit[py * sw + px] = 255 * clamp((zMax - tt) / (zMax * fade));
        const dl = Math.hypot(dx, dy, dz), vx = -dx / dl, vy = -dy / dl, vz = -dz / dl; // toward the eye
        const m = mat(wx, wz), wet = m.wet;
        // the bump: flattened where the water stands
        const k = (1 - wet * 0.92) * (m.bump ?? 1);
        let nx = 0, ny = 1, nz = 0;
        if (k > 0.001 && height) {
          const h0 = height(wx, wz), hx = height(wx + e, wz), hz = height(wx, wz + e);
          nx = -(hx - h0) / e * k; nz = -(hz - h0) / e * k; const l = Math.hypot(nx, 1, nz); nx /= l; ny = 1 / l; nz /= l;
        }
        const ndv = Math.max(0.001, nx * vx + ny * vy + nz * vz);
        // Schlick: water reflects little looking down, nearly all at a graze
        const F = 0.02 + 0.98 * Math.pow(1 - ndv, 5);
        const gloss = 0.1 + wet * 0.9;                 // damp ground still shines a little
        const a = m.alb, i3 = (py * sw + px) * 3;
        // the sky (and the haze) in the wet parts, ambient on the rest
        let R = amb[0] * a[0] * 6 + sky[0] * F * gloss, G = amb[1] * a[1] * 6 + sky[1] * F * gloss, B = amb[2] * a[2] * 6 + sky[2] * F * gloss;
        // the reflected ray, for the mirror sources
        const rd = 2 * (dx / dl * nx + dy / dl * ny + dz / dl * nz);
        const rx = dx / dl - rd * nx, ry = dy / dl - rd * ny, rz = dz / dl - rd * nz;
        for (let j = 0; j < mirror.length; j++) {
          const s = mirror[j], qx = s.p[0] - wx, qy = s.p[1] - y, qz = s.p[2] - wz, ql = Math.hypot(qx, qy, qz);
          const c = (qx * rx + qy * ry + qz * rz) / ql, ang = Math.acos(clamp(c, -1, 1)), rad = s.r / ql;
          // a disc with a soft edge (the ripples smear it)
          const w = clamp(1 - (ang - rad) / (rad * 0.6 + 0.004 * (1 - wet) + 0.0015), 0, 1);
          if (w > 0) { const q = w * F * gloss * (0.4 + wet * 0.6); R += Mk[j][0] * q; G += Mk[j][1] * q; B += Mk[j][2] * q; }
        }
        let li = 0;
        for (let j = 0; j < lights.length; j++) {
          const L = lights[j], lx = L.p[0] - wx, ly = L.p[1] - y, lz = L.p[2] - wz, d2 = lx * lx + ly * ly + lz * lz, d = Math.sqrt(d2);
          const ux = lx / d, uy = ly / d, uz = lz / d;
          const ndl = Math.max(0, nx * ux + ny * uy + nz * uz);
          const att = 1 / (d2 + 0.05);
          // diffuse on the dry part, a tight highlight on the wet
          let hx = ux + vx, hy = uy + vy, hz = uz + vz; const hl = Math.hypot(hx, hy, hz); hx /= hl; hy /= hl; hz /= hl;
          const ndh = Math.max(0, nx * hx + ny * hy + nz * hz);
          const sh2 = 40 + wet * 1100;
          const spec = Math.pow(ndh, sh2) * (sh2 + 8) / 25 * F * gloss;
          const diff = ndl * (1 - wet * 0.6);
          const cR = Lk[j][0] * att * (a[0] * diff + spec), cG = Lk[j][1] * att * (a[1] * diff + spec), cB = Lk[j][2] * att * (a[2] * diff + spec);
          if (L.layer) { const o = lay[li]; o[i3] += cR; o[i3 + 1] += cG; o[i3 + 2] += cB; }
          else { R += cR; G += cG; B += cB; }
          if (L.layer) li++;
        }
        // distance haze
        if (haze) { const hk = 1 - Math.exp(-tt / haze.d); R = R * (1 - hk) + haze.c[0] * hk; G = G * (1 - hk) + haze.c[1] * hk; B = B * (1 - hk) + haze.c[2] * hk; }
        base[i3] = R; base[i3 + 1] = G; base[i3 + 2] = B;
      }
    }
    this.top = top / scale;
    const toCanvas = (buf) => {
      const c = canvas(sw, sh), g = c.getContext('2d'), img = g.createImageData(sw, sh), d = img.data;
      for (let i = 0, j = 0; i < sw * sh; i++, j += 3) {
        const o = i * 4;
        // a filmic shoulder, then display gamma
        d[o] = 255 * Math.pow(1 - Math.exp(-buf[j] * 1.6), 1 / 2.2);
        d[o + 1] = 255 * Math.pow(1 - Math.exp(-buf[j + 1] * 1.6), 1 / 2.2);
        d[o + 2] = 255 * Math.pow(1 - Math.exp(-buf[j + 2] * 1.6), 1 / 2.2);
        d[o + 3] = hit[i];
      }
      g.putImageData(img, 0, 0);
      return c;
    };
    this.base = toCanvas(base);
    this.layers = lay.map((b) => toCanvas(b));
  }
  // where the baked image sits now that the camera has moved in the hand
  offset(cam) { const r = cam.project(...this.ref); return [r[0] - this.r0[0], r[1] - this.r0[1]]; }
  // draw: the base, then each light's layer at strength k[i] (added)
  draw(g, cam, k = []) {
    this.finish();
    const [ox, oy] = this.offset(cam), W = this.W, H = this.H;
    g.save();
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(this.base, ox, oy, W, H);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.layers.length; i++) { if ((k[i] ?? 1) <= 0) continue; g.globalAlpha = Math.min(1, k[i] ?? 1); g.drawImage(this.layers[i], ox, oy, W, H); }
    g.restore();
  }
}

// --- materials ---------------------------------------------------------------------------------
// mud: tyre ruts and boot prints, water in the low parts
export function mud(seed = 3) {
  const height = (x, z) => {
    const ruts = Math.sin((x * 0.9 + fbm2(x * 0.3, z * 0.05, 2, seed) * 1.6) * 3.2) * 0.02;
    return fbm2(x * 2.2, z * 2.2, 4, seed + 1) * 0.05 + fbm2(x * 9, z * 9, 2, seed + 5) * 0.01 + ruts;
  };
  const mat = (x, z) => {
    const h = height(x, z), w = clamp((0.02 - h) / 0.012 + (fbm2(x * 0.7, z * 0.7, 2, seed + 9) - 0.5) * 2.2, 0, 1);
    const tone = 0.07 + fbm2(x * 1.3, z * 1.3, 3, seed + 3) * 0.06;
    return { alb: [tone * 1.05, tone * 0.86, tone * 0.68], wet: w * w, bump: 1 };
  };
  return { mat, height };
}
// asphalt: fine aggregate, patches, a crown toward the kerbs, water in the low lanes
export function asphalt(seed = 5, { lanes = 0.5, patch = 0.4 } = {}) {
  const height = (x, z) => fbm2(x * 14, z * 14, 2, seed) * 0.0025 + fbm2(x * 0.8, z * 0.8, 3, seed + 2) * 0.03;
  const mat = (x, z) => {
    const p = fbm2(x * 0.35, z * 0.35, 3, seed + 4), lo = fbm2(x * 0.6, z * 0.6, 3, seed + 2);
    const tone = 0.05 + noise2(x * 30, z * 30, seed + 7) * 0.02 + (p > 0.6 ? patch * 0.03 : 0);
    const wet = clamp((0.42 - lo) * 6 * lanes + 0.15, 0, 1);
    return { alb: [tone, tone, tone * 1.04], wet: wet * wet, bump: 1 };
  };
  return { mat, height };
}
// concrete slab: joints every `joint` m, stains
export function concrete(seed = 7, { joint = 3 } = {}) {
  const height = (x, z) => fbm2(x * 6, z * 6, 3, seed) * 0.006 + fbm2(x * 0.5, z * 0.5, 2, seed + 1) * 0.02;
  const mat = (x, z) => {
    const jx = Math.abs(((x / joint) % 1 + 1) % 1 - 0.5), jz = Math.abs(((z / joint) % 1 + 1) % 1 - 0.5);
    const jt = (jx > 0.497 || jz > 0.497) ? 0.4 : 1;
    const st = fbm2(x * 0.4, z * 0.4, 4, seed + 3);
    const tone = (0.09 + st * 0.05) * jt;
    const wet = clamp((0.45 - fbm2(x * 0.5, z * 0.5, 2, seed + 1)) * 5, 0, 1);
    return { alb: [tone, tone * 0.98, tone * 0.95], wet: wet * wet * 0.9, bump: 1 };
  };
  return { mat, height };
}

// --- bokeh ---------------------------------------------------------------------------------------
// the aperture: a disc, slightly brighter at the rim, two faint onion rings
// from the lens' asphere, a hint of the blades (9, rounded)
const discs = new Map();
function disc(col) {
  if (discs.has(col)) return discs.get(col);
  const S = 96, c = canvas(S, S), g = c.getContext('2d'), r = S / 2 - 1.5;
  g.translate(S / 2, S / 2);
  g.beginPath();
  for (let i = 0; i <= 90; i++) { const a = (i / 90) * TAU, rr = r * (1 - 0.012 * Math.cos(a * 9)); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  g.closePath();
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
  gr.addColorStop(0, 'rgba(255,255,255,0.62)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.66)'); gr.addColorStop(0.86, 'rgba(255,255,255,0.8)'); gr.addColorStop(0.97, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0.5)');
  g.fillStyle = gr; g.fill();
  g.globalCompositeOperation = 'destination-out'; g.lineWidth = 1.2;
  for (const k of [0.38, 0.66]) { g.strokeStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.arc(0, 0, r * k, 0, TAU); g.stroke(); }
  g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(-S, -S, S * 2, S * 2);
  discs.set(col, c);
  return c;
}
// cat's eye toward the frame edges (the barrel vignettes the disc)
export function bokeh(g, x, y, r, col, a = 1) {
  if (a <= 0.003 || r < 0.5) return;
  const W = g.canvas.width, H = g.canvas.height;
  const ex = (x - W / 2) / (W / 2), ey = (y - H / 2) / (W / 2), e = Math.hypot(ex, ey);
  const im = disc(col);
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = clamp(a);
  if (e > 0.45) {
    // the cut-off disc: clip with a second circle pushed outward
    const k = (e - 0.45) * 0.9, cx = x + (ex / e) * r * k * 1.6, cy = y + (ey / e) * r * k * 1.6;
    g.beginPath(); g.arc(cx, cy, r * (1.05 - k * 0.15), 0, TAU); g.clip();
  }
  g.drawImage(im, x - r, y - r, r * 2, r * 2);
  g.restore();
}
