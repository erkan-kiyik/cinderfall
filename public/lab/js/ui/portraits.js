// KOR LAB — small painted pictures for the menus: operator avatars
// (head and shoulders, lit like the opening) and weapon side views, painted
// once and cached.
import { outlined, setRoot, canvas, rng, cel, fill, stroke, clip, metalOver } from '../art/kit.js';
import { tone, mat } from '../art/style.js';
import { drawFigure } from '../art/figure.js';
import { OPS } from '../art/ops/index.js';
import { WEAPONS } from '../art/weapons/index.js';
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

// head and shoulders of an operator, `px` CSS pixels square
export function avatar(id, px = 44) {
  const key = `a:${id}:${px}:${dpr()}`;
  if (!cache.has(key)) cache.set(key, paintAvatar(id, Math.round(px * dpr())));
  return copy(cache.get(key), px, px);
}

// Lit like the opening: the burning city behind, the fires low on the right,
// the operator dark against them with an ember rim on the edges that face
// the fire; nothing on them lights up by itself.
function paintAvatar(id, size) {
  const op = OPS[id], pose = op.pose, z = size / 17.5;
  // the figure's feet origin in the portrait: x 0 left of centre, the crown
  // (about -66) a little under the top edge, head and shoulders in frame
  const fx = 8.2 * z, fy = 68.0 * z;
  const W = Math.round(80 * z), H = Math.round(82 * z), ox = W * 0.42, oy = H - 6 * z;
  const fig = outlined(W, H, z, ox, oy, (g) => drawFigure(g, op, pose));
  const dx = fx - ox, dy = fy - oy;
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
  shade.addColorStop(0, 'rgba(8,9,13,0.74)'); shade.addColorStop(1, 'rgba(8,9,13,0.42)');
  bg.fillStyle = shade; bg.fillRect(0, 0, size, size);
  bg.fillStyle = 'rgba(255,110,50,0.07)'; bg.fillRect(0, 0, size, size);
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

// A supply crate seized from Vanta (docs §10.3): their blue-grey polymer, the
// ring-and-bar mark stencilled on it, a band of the tier's colour, and the
// cells' ember sprayed over the mark. `color` is the tier's colour.
// a seized Vanta crate (art/crate.js), the tier's colour on its band
const CRATE_LABEL = { '#a39b8f': 'VANTA · ERZAK', '#6aa6d6': 'VANTA · MÜHİMMAT', '#e6a93c': 'VANTA · KOMUTA' };
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
export function hawkPic(px = 64) {
  const key = `h:${px}:${dpr()}`;
  if (!cache.has(key)) { const n = Math.round(px * dpr()), c = canvas(n, n); paintHawk(c.getContext('2d'), n, 1); cache.set(key, c); }
  return copy(cache.get(key), px, px);
}

// a weapon in profile, scaled to `h` CSS pixels tall at most (and `w` wide)
// tint: a finish's colour multiplied over the paint (as the game draws it)
export function weaponPic(id, w = 120, h = 40, tint = null) {
  const W0 = WEAPONS[id];
  if (!W0) return null;
  const key = `w:${id}:${w}:${h}:${dpr()}:${tint || ''}`;
  const [x0, y0, x1, y1] = W0.box;
  const s = Math.min(w / (x1 - x0 + 3), h / (y1 - y0 + 3)) * dpr();
  if (!cache.has(key)) {
    const cw = Math.round((x1 - x0 + 3) * s), ch = Math.round((y1 - y0 + 3) * s);
    let src = outlined(cw, ch, s, (-x0 + 1.5) * s, (-y0 + 1.5) * s, (g) => { setRoot(g); W0.paint(g); metalOver(g, W0.box, id.length * 7 + id.charCodeAt(0)); }, 0.55);
    if (tint && tint !== '#ffffff') {
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
