// CINDERFALL LAB — small painted pictures for the menus: operator avatars
// (head and shoulders) and weapon side views, painted once and cached.
import { outlined, setRoot } from '../art/kit.js';
import { drawFigure } from '../art/figure.js';
import { OPS } from '../art/ops/index.js';
import { WEAPONS } from '../art/weapons/index.js';

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
  if (!cache.has(key)) {
    const size = Math.round(px * dpr()), z = size / 13.5;
    const W = Math.round(80 * z), H = Math.round(82 * z);
    const fig = outlined(W, H, z, W * 0.42, H - 6 * z, (g) => drawFigure(g, OPS[id], OPS[id].pose));
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const g = c.getContext('2d');
    // body standard v2: the crown sits ~66 units above the feet, the head is
    // smaller, so frame a little tighter round the helmet and shoulders
    g.drawImage(fig, -(W * 0.42 - 6.4 * z), -(H - 6 * z - 67 * z));
    cache.set(key, c);
  }
  return copy(cache.get(key), px, px);
}

// a weapon in profile, scaled to `h` CSS pixels tall at most (and `w` wide)
export function weaponPic(id, w = 120, h = 40) {
  const W0 = WEAPONS[id];
  if (!W0) return null;
  const key = `w:${id}:${w}:${h}:${dpr()}`;
  const [x0, y0, x1, y1] = W0.box;
  const s = Math.min(w / (x1 - x0 + 3), h / (y1 - y0 + 3)) * dpr();
  if (!cache.has(key)) {
    const cw = Math.round((x1 - x0 + 3) * s), ch = Math.round((y1 - y0 + 3) * s);
    cache.set(key, outlined(cw, ch, s, (-x0 + 1.5) * s, (-y0 + 1.5) * s, (g) => { setRoot(g); W0.paint(g); }, 0.55));
  }
  const src = cache.get(key);
  return copy(src, src.width / dpr(), src.height / dpr());
}
