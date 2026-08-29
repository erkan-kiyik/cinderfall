// Painting toolkit. Every asset in the game is painted at load time into
// high-resolution offscreen canvases (ASSET_SCALE× the world size, so a
// soldier's atlas region is equivalent to a 2K+ source asset) using layered
// gradients, painted ambient occlusion, grunge, scratches and rim light.
// Deterministic RNG keeps wear patterns stable between runs.

// Mutable so boot() can lower it under a weaker quality preset (smaller
// baked sprite canvases: faster boot, less memory) without touching every
// call site — sprites are painted once at boot, so this only needs to be
// set before the first makeSprite() call.
export let ASSET_SCALE = 3;
export function setAssetScale(v) { ASSET_SCALE = v; }

export function makeCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(w));
  cv.height = Math.max(1, Math.ceil(h));
  const g = cv.getContext('2d');
  return { cv, g };
}

// Creates a sprite painted in *world units*. painter(g, w, h) draws with
// (0,0) at the top-left of the sprite box; (ax, ay) is the world-space anchor.
export function makeSprite(w, h, ax, ay, painter) {
  const { cv, g } = makeCanvas(w * ASSET_SCALE, h * ASSET_SCALE);
  g.scale(ASSET_SCALE, ASSET_SCALE);
  painter(g, w, h);
  return { cv, ax: ax * ASSET_SCALE, ay: ay * ASSET_SCALE, s: 1 / ASSET_SCALE, w, h };
}

export function drawSprite(g, spr, x, y, rot = 0, sx = 1, sy = 1) {
  g.save();
  g.translate(x, y);
  if (rot) g.rotate(rot);
  g.scale(sx * spr.s, sy * spr.s);
  g.drawImage(spr.cv, -spr.ax, -spr.ay);
  g.restore();
}

// Draws only the [wx0, wx1] slice of a very wide sprite, in world units.
//
// The street strip is one sprite 7900 world units across, which at ASSET_SCALE
// is a backing canvas 15-27k pixels wide. Handing that whole canvas to
// drawImage every frame is the single most expensive call in the render loop:
// the rasteriser clips it, but the source is still bound and sampled, and on
// mobile GPUs a texture that wide falls off the fast path entirely. Only about
// 1200 world units are ever on screen, so the nine-argument form cuts the work
// by more than an order of magnitude and draws exactly the same pixels.
//
// Returns without drawing if the requested slice misses the sprite.
// ---------------------------------------------------------------- wide strips
//
// Mobile GPUs cap texture width. 4096 is the common floor, 2048 still exists
// in the field, and Chromium does not scale a canvas down to fit: a source
// canvas wider than the limit drops every draw *from* it onto the software
// rasteriser. The street was one 19,750 x 225 canvas (17 MB) and the decal
// surface 7,400 x 380 (10.7 MB), so the two biggest things on screen were
// being composited in software on every frame — measured at ~9.4 ms of a
// 13 ms frame, and scaling linearly with CPU throttle rather than with GPU
// load, which is the signature of exactly that fallback.
//
// A wide strip is stored as a row of chunks that every GPU can hold. Only the
// chunks that intersect the view are drawn, so the per-frame cost is two or
// three small blits instead of one software-rastered monster.
export const MAX_TEXTURE_W = 2048;

export function makeWideSprite(w, h, ax, ay, painter) {
  const S = ASSET_SCALE;
  const fullW = Math.ceil(w * S);
  const chunkW = MAX_TEXTURE_W;
  const n = Math.max(1, Math.ceil(fullW / chunkW));
  const chunks = [];
  for (let i = 0; i < n; i++) {
    const sx0 = i * chunkW;
    const cw = Math.min(chunkW, fullW - sx0);
    const { cv, g } = makeCanvas(cw, Math.ceil(h * S));
    g.scale(S, S);
    // The painter draws the whole strip in its own coordinates; the translate
    // is what makes each chunk keep only its own window of it. Seams line up
    // because every chunk is the same drawing, cropped differently.
    g.translate(-sx0 / S, 0);
    painter(g, w, h);
    chunks.push({ cv, sx0, w: cw });
  }
  return {
    cv: chunks[0].cv, chunks,
    ax: ax * S, ay: ay * S, s: 1 / S, w, h,
  };
}

// A wide surface that is WRITTEN to at runtime (the decal layer), split the
// same way and for the same reason as makeWideSprite. Stamps are routed to the
// chunks they actually touch, so a blood splat still costs one draw.
export class ChunkedSurface {
  constructor(w, h, chunkW = MAX_TEXTURE_W) {
    this.w = w; this.h = h; this.chunkW = chunkW;
    this.chunks = [];
    for (let x0 = 0; x0 < w; x0 += chunkW) {
      const cw = Math.min(chunkW, w - x0);
      const { cv, g } = makeCanvas(cw, h);
      this.chunks.push({ cv, x0, w: cw, g });
    }
  }

  // `fn(g)` draws in surface coordinates; each chunk's context is translated
  // so the same call lands in the right place in every chunk it crosses.
  // `x0`/`x1` bound the stamp — without them every chunk is visited, which is
  // correct but pays for chunks the stamp never touches.
  stamp(fn, x0 = -Infinity, x1 = Infinity) {
    for (const c of this.chunks) {
      if (x1 < c.x0 || x0 > c.x0 + c.w) continue;
      const g = c.g;
      g.save();
      g.translate(-c.x0, 0);
      fn(g);
      g.restore();
    }
  }

  clear() {
    for (const c of this.chunks) c.g.clearRect(0, 0, c.w, this.h);
  }

  // Blit the [wx0, wx1) column to (destX, destY) in the caller's space.
  drawSlice(g, destX, destY, wx0, wx1) {
    const a = Math.max(0, Math.floor(wx0));
    const b = Math.min(this.w, Math.ceil(wx1));
    if (b <= a) return;
    for (const c of this.chunks) {
      const cs = Math.max(a, c.x0);
      const ce = Math.min(b, c.x0 + c.w);
      if (ce <= cs) continue;
      g.drawImage(c.cv, cs - c.x0, 0, ce - cs, this.h, destX + cs, destY, ce - cs, this.h);
    }
  }
}

export function drawSpriteSlice(g, spr, x, y, wx0, wx1) {
  const scale = spr.s;                       // world units per source pixel
  const left = x - spr.ax * scale;           // world x of the sprite's left edge
  const srcH = spr.cv.height;

  if (spr.chunks) {
    // Virtual source coordinates across the whole strip, then per chunk.
    const vx0 = Math.max(0, Math.floor((wx0 - left) / scale));
    const vx1 = Math.ceil((wx1 - left) / scale);
    if (vx1 <= 0) return;
    for (const c of spr.chunks) {
      const cs = Math.max(vx0, c.sx0);
      const ce = Math.min(vx1, c.sx0 + c.w);
      if (ce <= cs) continue;
      g.drawImage(
        c.cv, cs - c.sx0, 0, ce - cs, srcH,
        left + cs * scale, y - spr.ay * scale, (ce - cs) * scale, srcH * scale,
      );
    }
    return;
  }

  const srcW = spr.cv.width;
  let sx = (wx0 - left) / scale;
  let ex = (wx1 - left) / scale;
  if (ex <= 0 || sx >= srcW) return;
  sx = Math.max(0, Math.floor(sx));
  ex = Math.min(srcW, Math.ceil(ex));
  const sw = ex - sx;
  if (sw <= 0) return;
  g.drawImage(
    spr.cv, sx, 0, sw, srcH,
    left + sx * scale, y - spr.ay * scale, sw * scale, srcH * scale,
  );
}

// ---- color utilities ----------------------------------------------------

export function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbHex(r, g, b) {
  const c = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
// f > 0 lightens toward white, f < 0 darkens toward black.
export function shade(hex, f) {
  const [r, g, b] = hexRgb(hex);
  if (f >= 0) return rgbHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
  return rgbHex(r * (1 + f), g * (1 + f), b * (1 + f));
}
export function mix(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  return rgbHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
export function withA(hex, a) {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// ---- palette: unified color script for the whole game -------------------
// Dusk-industrial: warm amber key light, cool blue-grey shadow, desaturated.

export const COL = {
  // materials
  gunmetal: '#3a3d42',
  gunmetalDark: '#26282c',
  polymer: '#2e3033',
  steel: '#5c6167',
  brass: '#b08d42',
  rust: '#7a4a30',
  oliveDark: '#3d4232',
  olive: '#565c44',
  oliveLight: '#6e735a',
  khaki: '#8a805e',
  webbing: '#4a4a3c',
  boot: '#2c261f',
  glove: '#33302a',
  skin: '#b98a68',
  skinShade: '#8a5f45',
  // environment
  concrete: '#6d6a63',
  concreteDark: '#4a4842',
  asphalt: '#3b3a38',
  brick: '#6b4a3a',
  metalPanel: '#4e5258',
  containerRed: '#7d3f33',
  containerBlue: '#3d5161',
  containerGreen: '#4c5a48',
  woodCrate: '#7a6647',
  // light script
  keyWarm: '#ffc98a',
  skyTop: '#232c3c',
  skyMid: '#54617a',
  horizon: '#c8845a',
  haze: '#8a8fa0',
};

// ---- gradient / path helpers -------------------------------------------

export function lingrad(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (const [t, c] of stops) gr.addColorStop(t, c);
  return gr;
}
export function radgrad(g, x, y, r, stops) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  for (const [t, c] of stops) gr.addColorStop(t, c);
  return gr;
}
export function rr(g, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rad, y);
  g.arcTo(x + w, y, x + w, y + h, rad);
  g.arcTo(x + w, y + h, x, y + h, rad);
  g.arcTo(x, y + h, x, y, rad);
  g.arcTo(x, y, x + w, y, rad);
  g.closePath();
}

// ---- painted wear & lighting -------------------------------------------

// Speckled dirt/wear. Caller clips first if containment is needed.
export function grunge(g, x, y, w, h, rng, { n = 120, dark = 0.14, light = 0.05, size = 1.6 } = {}) {
  for (let i = 0; i < n; i++) {
    const px = x + rng() * w, py = y + rng() * h;
    const s = rng.range(0.3, size);
    g.fillStyle = rng.chance(0.72)
      ? `rgba(10,8,6,${rng.range(0.03, dark)})`
      : `rgba(255,240,220,${rng.range(0.02, light)})`;
    g.fillRect(px, py, s, s * rng.range(0.5, 1.5));
  }
}

// Vertical weather streaks (rust drips, water stains).
export function streaks(g, x, y, w, h, rng, { n = 8, color = 'rgba(40,26,16,0.16)', wMax = 2.4 } = {}) {
  for (let i = 0; i < n; i++) {
    const sx = x + rng() * w;
    const len = rng.range(h * 0.2, h * 0.85);
    const sw = rng.range(0.6, wMax);
    const gr = g.createLinearGradient(0, y, 0, y + len);
    gr.addColorStop(0, color);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(sx, y, sw, len);
  }
}

// Fine bright scratches for worn metal edges.
// `len` caps how long a mark can get. On a big flat panel the default 7-unit
// strokes stop reading as wear and start reading as cracks in the metal, so a
// caller with large uninterrupted surfaces can ask for shorter marks.
export function scratches(g, x, y, w, h, rng, { n = 10, len: maxLen = 7, color = 'rgba(220,225,235,0.20)' } = {}) {
  g.strokeStyle = color;
  for (let i = 0; i < n; i++) {
    const sx = x + rng() * w, sy = y + rng() * h;
    const a = rng.range(-0.5, 0.5);
    const len = rng.range(Math.min(1.5, maxLen * 0.4), maxLen);
    g.lineWidth = rng.range(0.25, 0.7);
    g.beginPath();
    g.moveTo(sx, sy);
    g.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len);
    g.stroke();
  }
}

// Soft painted ambient-occlusion blob.
export function ao(g, x, y, rx, ry, alpha = 0.3) {
  g.save();
  g.translate(x, y);
  g.scale(1, ry / rx);
  g.fillStyle = radgrad(g, 0, 0, rx, [[0, `rgba(5,4,3,${alpha})`], [1, 'rgba(5,4,3,0)']]);
  g.beginPath();
  g.arc(0, 0, rx, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

export function rivet(g, x, y, r = 1.2) {
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath(); g.arc(x + r * 0.25, y + r * 0.3, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(190,196,205,0.5)';
  g.beginPath(); g.arc(x - r * 0.2, y - r * 0.25, r * 0.7, 0, Math.PI * 2); g.fill();
}

// Cloth fold: a curved shadow stroke with a highlight above it.
export function fold(g, x0, y0, x1, y1, bow, w = 1.4, dark = 0.22, light = 0.1) {
  const mx = (x0 + x1) / 2 - (y1 - y0) * bow;
  const my = (y0 + y1) / 2 + (x1 - x0) * bow;
  g.lineCap = 'round';
  g.strokeStyle = `rgba(8,7,5,${dark})`;
  g.lineWidth = w;
  g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx, my, x1, y1); g.stroke();
  g.strokeStyle = `rgba(255,240,214,${light})`;
  g.lineWidth = w * 0.55;
  g.beginPath(); g.moveTo(x0, y0 - w * 0.7); g.quadraticCurveTo(mx, my - w * 0.7, x1, y1 - w * 0.7); g.stroke();
  g.lineCap = 'butt';
}

// Top rim light + bottom core shadow inside a clipped shape the caller set up.
export function rim(g, x, y, w, h, { top = 0.18, bottom = 0.3, warm = true } = {}) {
  g.fillStyle = lingrad(g, 0, y, 0, y + h, [
    [0, `rgba(${warm ? '255,214,160' : '210,225,245'},${top})`],
    [0.25, 'rgba(0,0,0,0)'],
    [0.7, 'rgba(0,0,0,0)'],
    [1, `rgba(8,9,12,${bottom})`],
  ]);
  g.fillRect(x, y, w, h);
}
