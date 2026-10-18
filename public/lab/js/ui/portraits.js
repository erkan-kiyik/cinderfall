// KOR LAB — small painted pictures for the menus: operator avatars
// (head and shoulders, lit like the opening) and weapon side views, painted
// once and cached.
import { outlined, setRoot, canvas, rng, cel, fill, stroke, clip } from '../art/kit.js';
import { tone, mat } from '../art/style.js';
import { drawFigure } from '../art/figure.js';
import { OPS, visorLight } from '../art/ops/index.js';
import { WEAPONS } from '../art/weapons/index.js';
import { paintHawk } from '../art/hawk.js';

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
// the fire, and the visor glowing in the operator's colour.
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
  rg.globalCompositeOperation = 'source-in'; rg.fillStyle = 'rgba(255,132,66,0.95)'; rg.fillRect(0, 0, size, size);
  rg.globalCompositeOperation = 'destination-out'; rg.drawImage(fig, dx, dy);
  g.drawImage(rim, 0, 0);
  // the visor light, fitted to the glass
  g.save(); g.translate(fx, fy); g.scale(z, z); visorLight(g, id, pose, z); g.restore();
  // vignette
  const vg = g.createRadialGradient(size * 0.55, size * 0.45, size * 0.3, size * 0.5, size * 0.5, size * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  g.fillStyle = vg; g.fillRect(0, 0, size, size);
  return c;
}

// A supply crate seized from Vanta (docs §10.3): their blue-grey polymer, the
// ring-and-bar mark stencilled on it, a band of the tier's colour, and the
// cells' ember sprayed over the mark. `color` is the tier's colour.
export function crateArt(color, px = 96) {
  const key = `c:${color}:${px}:${dpr()}`;
  if (!cache.has(key)) {
    const n = Math.round(px * dpr()), c = canvas(n, n), g = c.getContext('2d');
    const z = n / 40; g.scale(z, z); setRoot(g);
    const POLY = mat(tone('#a9bccd', '#7c93aa', '#566d84', '#1f2d3b'), 'paint', 0.3);
    // the shadow under it, the body, the lid
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(20, 35.4, 17, 2.2, 0, 0, Math.PI * 2); g.fill();
    const B = 'M 4 13 L 36 13 L 35 35 L 5 35 Z';
    cel(g, B, POLY, { sh: 2.0, hl: 0.6 });
    clip(g, B, () => {
      for (const x of [9, 20, 31]) { stroke(g, `M ${x} 14 L ${x} 34`, POLY.d, 0.9); stroke(g, `M ${x + 0.6} 14 L ${x + 0.6} 34`, POLY.l, 0.3, 0.6); }
      fill(g, 'M 3 24 L 37 24 L 37 27.4 L 3 27.4 Z', color, 0.92);
      fill(g, 'M 3 24 L 37 24 L 37 24.6 L 3 24.6 Z', '#ffffff', 0.25);
      g.save(); g.strokeStyle = 'rgba(244,246,248,0.85)'; g.lineWidth = 1.1; g.beginPath(); g.arc(20, 19, 3.6, 0, Math.PI * 2); g.stroke(); g.fillStyle = 'rgba(244,246,248,0.85)'; g.fillRect(14.6, 18.4, 10.8, 1.2); g.restore();
      // the ember sprayed over Vanta's mark, its drips
      g.save(); g.globalAlpha = 0.9; fill(g, 'M 17 18 L 19 15.4 L 22.6 15.8 L 24 18.6 L 22.2 21.6 L 18.4 21.4 Z', '#e2692f'); fill(g, 'M 19.4 18.6 a 1.2 1 0 1 0 2.4 0 a 1.2 1 0 1 0 -2.4 0 Z', '#ffc07a');
      for (const [x, l] of [[18.6, 3], [20.8, 5], [22.6, 2.2]]) stroke(g, `M ${x} 21 l 0 ${l}`, '#e2692f', 0.45); g.restore();
      g.save(); g.globalCompositeOperation = 'multiply'; const gr = g.createLinearGradient(0, 28, 0, 35); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(60,64,70,0.5)'); g.fillStyle = gr; g.fillRect(4, 28, 32, 8); g.restore();
    });
    const LID = 'M 2.6 9.6 L 37.4 9.6 L 37.4 13.6 L 2.6 13.6 Z';
    cel(g, LID, POLY, { sh: 0.8, hl: 0.5 });
    // the latches, steel, and the cut seal hanging off one
    for (const x of [8, 32]) { cel(g, `M ${x - 1.6} 12 L ${x + 1.6} 12 L ${x + 1.6} 16.4 L ${x - 1.6} 16.4 Z`, mat(tone('#c3c8cc', '#959ba1', '#686e74', '#2c3035'), 'steel', 0.5), { sh: 0.4, hl: 0.3, lw: 0.3 }); }
    stroke(g, 'M 32 16.4 q 0.6 2 -0.4 3.6', '#d64a3e', 0.45);
    for (const x of [4.6, 35.4]) fill(g, `M ${x - 1.6} 34 L ${x + 1.6} 34 L ${x + 1.6} 36 L ${x - 1.6} 36 Z`, '#1d2228');
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
    let src = outlined(cw, ch, s, (-x0 + 1.5) * s, (-y0 + 1.5) * s, (g) => { setRoot(g); W0.paint(g); }, 0.55);
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
