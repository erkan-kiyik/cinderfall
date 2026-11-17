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

// The menus show no faces (docs §10.39): an operator is a badge, the
// callsign's first letter stencilled on a dark plate with a stripe of their
// colour. The painted faces are still here (facePortrait) for the dev sheets.
const BADGE = { vex: ['F', '#d9533a'], hale: ['W', '#e6c25c'], morrow: ['V', '#a3ad7f'], kite: ['S', '#7ec8ff'], brick: ['B', '#e2782f'], hawk: ['H', '#e0a24a'] };
export function avatar(id, px = 44) {
  const key = `b:${id}:${px}:${dpr()}`;
  if (!cache.has(key)) cache.set(key, paintBadge(...(BADGE[id] || ['?', '#a39b8f']), Math.round(px * dpr())));
  return copy(cache.get(key), px, px);
}
// head and shoulders of an operator, as painted for the menus before §10.39
export function facePortrait(id, px = 44) {
  const key = `a:${id}:${px}:${dpr()}`;
  if (!cache.has(key)) cache.set(key, paintAvatar(id, Math.round(px * dpr())));
  return copy(cache.get(key), px, px);
}
function paintBadge(letter, color, size) {
  const c = canvas(size, size), g = c.getContext('2d');
  // a soot-dark plate, warmer toward the bottom, a little light from above
  const bg = g.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0, '#221b16'); bg.addColorStop(1, '#100c0a');
  g.fillStyle = bg; g.fillRect(0, 0, size, size);
  const lit = g.createRadialGradient(size * 0.5, -size * 0.2, 0, size * 0.5, -size * 0.2, size * 1.1);
  lit.addColorStop(0, 'rgba(255,214,170,0.14)'); lit.addColorStop(1, 'rgba(255,214,170,0)');
  g.fillStyle = lit; g.fillRect(0, 0, size, size);
  // the stripe of the operator's colour along the foot
  g.fillStyle = color; g.fillRect(0, size * 0.84, size, size * 0.16);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, size * 0.84, size, Math.max(1, size * 0.02));
  // the letter, stencilled
  g.fillStyle = '#efe6d6'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `800 ${Math.round(size * 0.62)}px 'Big Shoulders Stencil', 'Big Shoulders', sans-serif`;
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = size * 0.04; g.shadowOffsetY = size * 0.02;
  g.fillText(letter, size * 0.5, size * 0.44);
  g.shadowColor = 'transparent';
  // grain, so it sits with the paper and paint around it
  const r = rng(letter.charCodeAt(0) * 97 + size);
  for (let i = 0; i < size * size * 0.02; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.08)'; g.fillRect(r() * size, r() * size, 1, 1); }
  return c;
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
// HAWK's stall for the trader screen (no face, docs §10.39): seized crates
// stacked under a bare bulb, the market's dark behind
export function stallPic(px = 360) {
  const key = `s:${px}:${dpr()}`;
  if (!cache.has(key)) {
    // wide, like the card it sits in; the crates to the right, clear of the name
    const W = Math.round(px * dpr()), H = Math.round(W * 0.56), c = canvas(W, H), g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#120e0c'); bg.addColorStop(1, '#261b13');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const bx = W * 0.7, by = H * 0.14;
    const bulb = g.createRadialGradient(bx, by, 0, bx, by, W * 0.55);
    bulb.addColorStop(0, 'rgba(255,196,120,0.5)'); bulb.addColorStop(0.35, 'rgba(255,150,70,0.15)'); bulb.addColorStop(1, 'rgba(255,150,70,0)');
    g.fillStyle = bulb; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(30,24,20,0.9)'; g.lineWidth = Math.max(1, W * 0.004); g.beginPath(); g.moveTo(bx, 0); g.lineTo(bx, by - W * 0.02); g.stroke();
    g.fillStyle = '#ffe2b0'; g.beginPath(); g.ellipse(bx, by, W * 0.013, W * 0.018, 0, 0, Math.PI * 2); g.fill();
    // three seized crates: two on the floor, one on top
    const crate = (band, x, y, k) => { const m = Math.round(W * k), cc = canvas(m, m); paintCrate(cc.getContext('2d'), m, { band, label: CRATE_LABEL[band] }); g.drawImage(cc, x * W - m / 2, y * H - m / 2); };
    crate('#a39b8f', 0.56, 0.66, 0.36); crate('#6aa6d6', 0.84, 0.68, 0.34); crate('#e6a93c', 0.7, 0.4, 0.32);
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
