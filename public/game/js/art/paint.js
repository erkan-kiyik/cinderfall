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
export function scratches(g, x, y, w, h, rng, { n = 10, color = 'rgba(220,225,235,0.20)' } = {}) {
  g.strokeStyle = color;
  for (let i = 0; i < n; i++) {
    const sx = x + rng() * w, sy = y + rng() * h;
    const a = rng.range(-0.5, 0.5);
    const len = rng.range(1.5, 7);
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
