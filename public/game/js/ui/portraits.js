// KOR — small painted pictures for the menus: operator badges (the painted
// faces are kept for the dev sheets: docs §10.39) and weapon side views,
// painted once and cached.
import { outlined, setRoot, canvas, rng, cel, fill, stroke, clip, metalOver } from '../art/kit.js';
import { tone, mat } from '../art/style.js';
import { drawFigure, solve } from '../art/figure.js';
import { OPS } from '../art/ops/index.js';
import { WEAPONS, PRIMER } from '../art/weapons/index.js';
import { paintHawk } from '../art/hawk.js';
import { paintCrate } from '../art/crate.js';

const cache = new Map();
// device pixels per CSS pixel of the zoomed menus, in quarter steps (so the
// cache does not fill with near-identical sizes)
const dpr = () => {
  const z = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--zoom')) || 1;
  return Math.min(4, Math.max(1, Math.round((devicePixelRatio || 1) * z * 4) / 4));
};

function copy(src, cssW, cssH) {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  c.getContext('2d').drawImage(src, 0, 0);
  c.style.width = cssW + 'px'; c.style.height = cssH + 'px';
  return c;
}

// The menus show no faces (docs §10.39): an operator is a police file
// photo of a silhouette — their own head and shoulders in black against a
// lineup wall with its height lines, one hard lamp from above, the case
// number on a board and a strip of their colour. The painted faces are
// still here (facePortrait) for the dev sheets.
const FILE = { vex: ['K-03', '#d9533a'], hale: ['K-04', '#e6c25c'], morrow: ['K-05', '#a3ad7f'], kite: ['K-06', '#7ec8ff'], brick: ['K-07', '#e2782f'] };
export function avatar(id, px = 44) {
  const key = `m:${id}:${px}:${dpr()}`;
  if (!cache.has(key)) cache.set(key, paintMugshot(id, Math.round(px * dpr())));
  return copy(cache.get(key), px, px);
}
function paintMugshot(id, size) {
  const [no, color] = FILE[id] || ['K-00', '#a39b8f'];
  const c = canvas(size, size), g = c.getContext('2d');
  // the lineup wall: pale where the lamp hits it, falling to dark at the edges
  const wall = g.createRadialGradient(size * 0.5, -size * 0.15, size * 0.05, size * 0.5, size * 0.25, size * 1.05);
  wall.addColorStop(0, '#d2cdc1'); wall.addColorStop(0.5, '#8e897f'); wall.addColorStop(1, '#2c2925');
  g.fillStyle = wall; g.fillRect(0, 0, size, size);
  // its height lines, every other one long, numbered when there is room
  const lw = Math.max(1, size * 0.007), labels = ['190', '180', '170', '160', '150'];
  g.font = `600 ${Math.max(7, Math.round(size * 0.075))}px Rajdhani, 'Barlow Condensed', sans-serif`; g.textAlign = 'right'; g.textBaseline = 'bottom';
  for (let i = 0; i <= 9; i++) {
    const y = size * (0.07 + i * 0.1), major = i % 2 === 0;
    g.fillStyle = `rgba(26,22,19,${major ? 0.42 : 0.26})`;
    g.fillRect(major ? 0 : size * 0.72, y, size, major ? lw * 1.5 : lw);
    if (major && size >= 96 && labels[i / 2]) { g.fillStyle = 'rgba(26,22,19,0.55)'; g.fillText(labels[i / 2], size * 0.97, y - lw); }
  }
  // the figure's shape: head and shoulders, from the operator's own rig
  const fig = canvas(size, size), fg = fig.getContext('2d');
  {
    const op = OPS[id], pose = op.pose, z = size / 18, J = solve(pose), [nx, ny] = J.neck;
    fg.translate(size * 0.5 - (nx + 1.2) * z, size * 0.6 - (ny - 4.2) * z); fg.scale(z, z);
    drawFigure(fg, op, pose);
  }
  const ink = (src, colr) => { const o = canvas(size, size), og = o.getContext('2d'); og.drawImage(src, 0, 0); og.globalCompositeOperation = 'source-in'; og.fillStyle = colr; og.fillRect(0, 0, size, size); return o; };
  const sil = ink(fig, '#0b0908');
  // its shadow thrown on the wall, soft, down and to the right
  g.save(); g.globalAlpha = 0.32; g.filter = `blur(${(size * 0.025).toFixed(1)}px)`; g.drawImage(sil, size * 0.06, size * 0.03); g.restore();
  // the lamp's cold rim along the top edges, then the shape itself
  const r = Math.max(1, size * 0.016), rim = ink(fig, 'rgba(232,238,244,0.6)');
  g.drawImage(rim, -r * 0.25, -r);
  g.drawImage(sil, 0, 0);
  // the board with the case number, the strip of colour under it
  if (size >= 60) {
    const bw = size * 0.46, bh = size * 0.15, bx = size * 0.5 - bw / 2, by = size * 0.8;
    g.fillStyle = '#121010'; g.fillRect(bx, by, bw, bh);
    g.fillStyle = color; g.fillRect(bx, by, bw, Math.max(1, bh * 0.14));
    g.fillStyle = '#ece6da'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `400 ${Math.round(bh * 0.62)}px 'Special Elite', 'Courier New', monospace`;
    g.fillText(no, size * 0.5, by + bh * 0.58);
  } else { g.fillStyle = color; g.fillRect(0, size * 0.9, size, size * 0.1); }
  // the lamp falls off at the corners; grain like an old print
  const vg = g.createRadialGradient(size * 0.5, size * 0.38, size * 0.25, size * 0.5, size * 0.5, size * 0.8);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = vg; g.fillRect(0, 0, size, size);
  const rr = rng(no.charCodeAt(2) * 131 + size);
  for (let i = 0; i < size * size * 0.03; i++) { g.fillStyle = rr() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.09)'; g.fillRect(rr() * size, rr() * size, 1, 1); }
  return c;
}
// head and shoulders of an operator, as painted for the menus before §10.39
export function facePortrait(id, px = 44) {
  const key = `a:${id}:${px}:${dpr()}`;
  if (!cache.has(key)) cache.set(key, paintAvatar(id, Math.round(px * dpr())));
  return copy(cache.get(key), px, px);
}

// Lit like the opening: the burning city behind, the fires low on the right,
// the operator dark against them with an ember rim on the edges that face
// the fire; nothing on them lights up by itself.
function paintAvatar(id, size) {
  // framed on the face (docs §10.25, §10.34): about 12 units of the figure across the
  // square, centred on the face as this operator's pose puts it
  const op = OPS[id], pose = op.pose, z = size / 12;
  const J = solve(pose), [nx, ny] = J.neck;
  const hx = nx + 1.5, hy = ny - 6.3;
  const m = Math.ceil(size * 0.12);
  const fx = size * 0.46 - hx * z, fy = size * 0.5 - hy * z;
  // only the head and shoulders are rasterised (painting the whole figure and cropping it
  // cost a phone seconds when the lobby first opened, docs §10.17)
  const fig = outlined(size + 2 * m, size + 2 * m, z, fx + m, fy + m, (g) => drawFigure(g, op, pose));
  const dx = -m, dy = -m;
  const c = canvas(size, size), g = c.getContext('2d');
  // sky, the fire glow, a few embers
  const sky = g.createLinearGradient(0, 0, 0, size);
  sky.addColorStop(0, '#08090d'); sky.addColorStop(0.55, '#1b0f12'); sky.addColorStop(1, '#3a1711');
  g.fillStyle = sky; g.fillRect(0, 0, size, size);
  const glow = g.createRadialGradient(size * 0.98, size * 1.02, 0, size * 0.98, size * 1.02, size);
  glow.addColorStop(0, 'rgba(255,120,48,0.6)'); glow.addColorStop(0.45, 'rgba(200,60,30,0.2)'); glow.addColorStop(1, 'rgba(120,30,20,0)');
  g.fillStyle = glow; g.fillRect(0, 0, size, size);
  // the skyline behind the shoulders, a few windows lit
  const rnd = rng([...id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
  for (let x = -size * 0.05; x < size;) {
    const bw = size * (0.1 + rnd() * 0.16), top = size * (0.5 + rnd() * 0.22);
    g.fillStyle = '#140d10'; g.fillRect(x, top, bw, size - top);
    for (let wy = top + size * 0.04; wy < size; wy += size * 0.06) for (let wx = x + size * 0.025; wx < x + bw - size * 0.03; wx += size * 0.05) {
      if (rnd() > 0.8) { g.fillStyle = `rgba(255,${150 + (rnd() * 60) | 0},90,${0.3 + rnd() * 0.35})`; g.fillRect(wx, wy, Math.max(1, size * 0.018), Math.max(1, size * 0.024)); }
    }
    x += bw + size * 0.012;
  }
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    g.fillStyle = `rgba(255,${150 + (rnd() * 70) | 0},70,${0.35 + rnd() * 0.45})`;
    g.beginPath(); g.arc(size * (0.55 + rnd() * 0.45), size * rnd(), Math.max(0.6, size * (0.008 + rnd() * 0.014)), 0, Math.PI * 2); g.fill();
  }
  g.restore();
  // the figure, darker on the side away from the fire
  const body = canvas(size, size), bg = body.getContext('2d');
  bg.drawImage(fig, dx, dy);
  bg.globalCompositeOperation = 'source-atop';
  const shade = bg.createLinearGradient(0, 0, size, size * 0.4);
  shade.addColorStop(0, 'rgba(8,9,13,0.42)'); shade.addColorStop(1, 'rgba(8,9,13,0.06)');
  bg.fillStyle = shade; bg.fillRect(0, 0, size, size);
  bg.fillStyle = 'rgba(255,110,50,0.06)'; bg.fillRect(0, 0, size, size);
  // the fire's light on the face, so the face is what the eye goes to
  const ex = fx + (nx + 3.4) * z + dx + m, ey = fy + (ny - 5.4) * z + dy + m;
  const key = bg.createRadialGradient(ex, ey, 0, ex, ey, size * 0.36);
  key.addColorStop(0, 'rgba(255,214,176,0.2)'); key.addColorStop(1, 'rgba(255,214,176,0)');
  bg.fillStyle = key; bg.fillRect(0, 0, size, size);
  g.drawImage(body, 0, 0);
  // the ember rim: the silhouette pushed toward the fire, minus the figure
  const r = Math.max(1, size * 0.028);
  const rim = canvas(size, size), rg = rim.getContext('2d');
  rg.drawImage(fig, dx + r, dy + r * 0.25);
  rg.globalCompositeOperation = 'source-in'; rg.fillStyle = 'rgba(232,128,72,0.6)'; rg.fillRect(0, 0, size, size);
  rg.globalCompositeOperation = 'destination-out'; rg.drawImage(fig, dx, dy);
  g.drawImage(rim, 0, 0);
  // vignette
  const vg = g.createRadialGradient(size * 0.55, size * 0.45, size * 0.3, size * 0.5, size * 0.5, size * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  g.fillStyle = vg; g.fillRect(0, 0, size, size);
  return c;
}

// A supply crate seized from Vorsa (docs §10.3): their blue-grey polymer, the
// ring-and-chevron mark stencilled on it, a band of the tier's colour, and the
// cells' ember sprayed over the mark. `color` is the tier's colour.
// a seized Vorsa crate (art/crate.js), the tier's colour on its band
const CRATE_LABEL = { '#a39b8f': 'VORSA · ERZAK', '#6aa6d6': 'VORSA · MÜHİMMAT', '#e6a93c': 'VORSA · KOMUTA' };
export function crateArt(color, px = 96) {
  const key = `c:${color}:${px}:${dpr()}`;
  if (!cache.has(key)) {
    const n = Math.round(px * dpr()), c = canvas(n, n);
    paintCrate(c.getContext('2d'), n, { band: color, label: CRATE_LABEL[color] });
    cache.set(key, c);
  }
  return copy(cache.get(key), px, px);
}

// HAWK at his stall, `px` CSS pixels square
// HAWK in the menus is no drawing: his sign over the market, the A that has
// not lit for years, ray-traced (tools/game/series shot 16) and shipped as a
// still (docs §10.39). `px`: a square crop of that size; none: it fills its box.
const STILL = new URL('../../assets/stills/hawk.webp', import.meta.url).href;
const STILL_SQ = new URL('../../assets/stills/hawk_sq.webp', import.meta.url).href;
export function hawkPic(px = 0) {
  const im = new Image(); im.src = px ? STILL_SQ : STILL; im.alt = ''; im.decoding = 'async'; im.draggable = false;
  im.className = 'still';
  if (px) Object.assign(im.style, { width: `${px}px`, height: `${px}px` });
  return im;
}
export function hawkFace(px = 64) {
  const key = `h:${px}:${dpr()}`;
  if (!cache.has(key)) { const n = Math.round(px * dpr()), c = canvas(n, n); paintHawk(c.getContext('2d'), n, 1); cache.set(key, c); }
  return copy(cache.get(key), px, px);
}

// a weapon in profile, scaled to `h` CSS pixels tall at most (and `w` wide)
// tint: a finish, its colour multiplied over the primer (as the game draws it)
export function weaponPic(id, w = 120, h = 40, tint = null) {
  const W0 = WEAPONS[id];
  if (!W0) return null;
  const key = `w:${id}:${w}:${h}:${dpr()}:${tint || ''}`;
  const [x0, y0, x1, y1] = W0.box;
  const s = Math.min(w / (x1 - x0 + 3), h / (y1 - y0 + 3)) * dpr();
  if (!cache.has(key)) {
    const cw = Math.round((x1 - x0 + 3) * s), ch = Math.round((y1 - y0 + 3) * s);
    const fin = tint && tint !== '#ffffff';
    let src = outlined(cw, ch, s, (-x0 + 1.5) * s, (-y0 + 1.5) * s, (g) => { setRoot(g); W0.paint(g, fin ? PRIMER : undefined); metalOver(g, W0.box, id.length * 7 + id.charCodeAt(0)); }, 0.55);
    if (fin) {
      const c = canvas(src.width, src.height), g = c.getContext('2d');
      g.drawImage(src, 0, 0);
      g.globalCompositeOperation = 'multiply'; g.fillStyle = tint; g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = 'destination-in'; g.drawImage(src, 0, 0);
      src = c;
    }
    cache.set(key, src);
  }
  const src = cache.get(key);
  return copy(src, src.width / dpr(), src.height / dpr());
}
