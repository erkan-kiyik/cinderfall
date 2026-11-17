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
const FILE = { vex: ['K-03', '#d9533a'], hale: ['K-04', '#e6c25c'], morrow: ['K-05', '#a3ad7f'], kite: ['K-06', '#7ec8ff'], brick: ['K-07', '#e2782f'], hawk: ['M-01', '#e0a24a'] };
export function avatar(id, px = 44) {
  const key = `m:${id}:${px}:${dpr()}`;
  if (!cache.has(key)) cache.set(key, paintMugshot(id, Math.round(px * dpr())));
  return copy(cache.get(key), px, px);
}
// HAWK has no rig: his outline drawn by hand, facing right, in a 1 × 1 box —
// the flat cap, the beard, the coat's collar, the cigarette
function hawkShape(g, x, y, s) {
  const P = (u, v) => [x + u * s, y + v * s];
  g.beginPath(); g.moveTo(...P(0.1, 1.02));
  g.lineTo(...P(0.12, 0.86));
  g.bezierCurveTo(...P(0.14, 0.78), ...P(0.22, 0.74), ...P(0.3, 0.72));
  g.bezierCurveTo(...P(0.3, 0.66), ...P(0.27, 0.6), ...P(0.27, 0.54));
  g.bezierCurveTo(...P(0.26, 0.46), ...P(0.27, 0.4), ...P(0.29, 0.36));
  g.bezierCurveTo(...P(0.3, 0.27), ...P(0.42, 0.23), ...P(0.56, 0.25));
  g.bezierCurveTo(...P(0.66, 0.27), ...P(0.72, 0.31), ...P(0.74, 0.35));
  g.lineTo(...P(0.85, 0.385)); g.lineTo(...P(0.845, 0.405)); g.lineTo(...P(0.71, 0.405));
  g.bezierCurveTo(...P(0.71, 0.44), ...P(0.715, 0.47), ...P(0.73, 0.5));
  g.lineTo(...P(0.775, 0.556)); g.lineTo(...P(0.738, 0.575));
  g.bezierCurveTo(...P(0.745, 0.6), ...P(0.75, 0.625), ...P(0.735, 0.645));
  g.bezierCurveTo(...P(0.725, 0.69), ...P(0.685, 0.72), ...P(0.625, 0.735));
  g.bezierCurveTo(...P(0.6, 0.76), ...P(0.6, 0.79), ...P(0.64, 0.82));
  g.bezierCurveTo(...P(0.74, 0.85), ...P(0.86, 0.9), ...P(0.92, 1.02));
  g.closePath(); g.fill();
  // the cigarette
  g.save(); g.lineCap = 'round'; g.lineWidth = s * 0.016; g.strokeStyle = g.fillStyle;
  g.beginPath(); g.moveTo(...P(0.735, 0.622)); g.lineTo(...P(0.805, 0.636)); g.stroke(); g.restore();
}
function hawkSmoke(g, x, y, s) {
  const P = (u, v) => [x + u * s, y + v * s];
  g.save(); g.fillStyle = 'rgba(255,120,50,0.95)'; g.beginPath(); g.arc(...P(0.81, 0.637), s * 0.011, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(225,230,235,0.32)'; g.lineWidth = s * 0.012; g.lineCap = 'round';
  g.beginPath(); g.moveTo(...P(0.81, 0.625)); g.bezierCurveTo(...P(0.85, 0.56), ...P(0.78, 0.5), ...P(0.83, 0.43)); g.bezierCurveTo(...P(0.87, 0.37), ...P(0.82, 0.31), ...P(0.86, 0.25)); g.stroke();
  g.restore();
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
  if (id === 'hawk') { fg.fillStyle = '#000'; hawkShape(fg, size * 0.02, size * 0.1, size * 0.96); }
  else {
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
  if (id === 'hawk') hawkSmoke(g, size * 0.02, size * 0.1, size * 0.96);
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
// HAWK's stall for the trader screen (no face, docs §10.39): his outline
// behind seized crates stacked under a bare bulb, the market's dark behind
export function stallPic(px = 360) {
  const key = `s:${px}:${dpr()}`;
  if (!cache.has(key)) {
    // wide, like the card it sits in; HAWK under the bulb, his crates to the right
    const W = Math.round(px * dpr()), H = Math.round(W * 0.56), c = canvas(W, H), g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#120e0c'); bg.addColorStop(1, '#261b13');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const bx = W * 0.47, by = H * 0.12;
    const bulb = g.createRadialGradient(bx, by, 0, bx, by, W * 0.55);
    bulb.addColorStop(0, 'rgba(255,196,120,0.5)'); bulb.addColorStop(0.35, 'rgba(255,150,70,0.15)'); bulb.addColorStop(1, 'rgba(255,150,70,0)');
    g.fillStyle = bulb; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(30,24,20,0.9)'; g.lineWidth = Math.max(1, W * 0.004); g.beginPath(); g.moveTo(bx, 0); g.lineTo(bx, by - W * 0.02); g.stroke();
    g.fillStyle = '#ffe2b0'; g.beginPath(); g.ellipse(bx, by, W * 0.013, W * 0.018, 0, 0, Math.PI * 2); g.fill();
    // HAWK himself, an outline behind his goods, the bulb rimming his cap and shoulder
    { const hs = H * 0.94, hx = W * 0.08, hy = H * 0.1, o = canvas(W, H), og = o.getContext('2d');
      // the bulb's pool on the wall behind him, so his outline reads against it
      const pool = g.createRadialGradient(hx + hs * 0.55, hy + hs * 0.42, 0, hx + hs * 0.55, hy + hs * 0.42, hs * 0.62);
      pool.addColorStop(0, 'rgba(196,170,138,0.62)'); pool.addColorStop(0.6, 'rgba(150,120,90,0.25)'); pool.addColorStop(1, 'rgba(150,120,90,0)');
      g.fillStyle = pool; g.fillRect(0, 0, W, H);
      og.fillStyle = 'rgba(255,200,140,0.8)'; hawkShape(og, hx + W * 0.008, hy - W * 0.006, hs);
      og.fillStyle = '#0a0807'; hawkShape(og, hx, hy, hs); g.drawImage(o, 0, 0); hawkSmoke(g, hx, hy, hs); }
    // three seized crates: two on the floor, one on top
    const crate = (band, x, y, k) => { const m = Math.round(W * k), cc = canvas(m, m); paintCrate(cc.getContext('2d'), m, { band, label: CRATE_LABEL[band] }); g.drawImage(cc, x * W - m / 2, y * H - m / 2); };
    crate('#a39b8f', 0.67, 0.7, 0.3); crate('#6aa6d6', 0.89, 0.72, 0.28); crate('#e6a93c', 0.79, 0.47, 0.27);
    cache.set(key, c);
  }
  const c = cache.get(key);
  return copy(c, px, Math.round(px * c.height / c.width));
}
// HAWK in the menus: a badge like the operators' (docs §10.39); the painted
// face stays for the dev sheets (hawkFace)
export function hawkPic(px = 64) { return avatar('hawk', px); }
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
