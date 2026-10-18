// KOR LAB — soft-brush painting for portraits and close-ups (docs §11).
//
// The figure kit (kit.js) shades shapes; this paints like a brush: every
// mark has a soft edge (a blur in device pixels), light and shadow are laid
// as glazes over a base, hair is thousands of short strokes. Coordinates are
// whatever the caller has set up; `k` is the device pixels per unit, so a
// blur of 1 is one unit wide on screen whatever the size.
import { P } from './kit.js';

export const rnd = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export class Brush {
  constructor(g, k) { this.g = g; this.k = k; }
  // a filled shape with its edge softened over `blur` units
  fill(d, color, blur = 0, alpha = 1, op = 'source-over') {
    const g = this.g;
    g.save();
    g.globalAlpha = alpha; g.globalCompositeOperation = op; g.fillStyle = color;
    if (blur > 0) g.filter = `blur(${(blur * this.k).toFixed(2)}px)`;
    g.fill(P(d));
    g.restore();
  }
  // a stroke along a path, soft
  line(d, color, w, blur = 0, alpha = 1, op = 'source-over', cap = 'round') {
    const g = this.g;
    g.save();
    g.globalAlpha = alpha; g.globalCompositeOperation = op; g.strokeStyle = color; g.lineWidth = w; g.lineCap = cap; g.lineJoin = 'round';
    if (blur > 0) g.filter = `blur(${(blur * this.k).toFixed(2)}px)`;
    g.stroke(P(d));
    g.restore();
  }
  // a soft round dab of light or shadow
  dab(x, y, rx, ry, color, alpha = 1, op = 'source-over', rot = 0) {
    const g = this.g;
    g.save();
    g.translate(x, y); g.rotate(rot); g.scale(rx, ry);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = alpha; g.globalCompositeOperation = op; g.fillStyle = gr;
    g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  // everything drawn by fn stays inside d
  inside(d, fn) { const g = this.g; g.save(); g.clip(P(d)); fn(); g.restore(); }
  // short hairs: n strokes, place(i, r) → [x, y, angle, length, colour, width, alpha]
  hairs(n, seed, place) {
    const g = this.g, r = rnd(seed);
    g.save(); g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const h = place(i, r);
      if (!h) continue;
      const [x, y, a, L, c, w, al] = h;
      g.globalAlpha = al; g.strokeStyle = c; g.lineWidth = w;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a) * L * 0.5 + Math.sin(a) * L * 0.12, y + Math.sin(a) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L);
      g.stroke();
    }
    g.restore();
  }
  // film grain over the area (x, y, w, h), in units
  grain(x, y, w, h, alpha = 0.06, seed = 7) {
    const g = this.g, r = rnd(seed), n = Math.round(w * h * 0.6);
    g.save();
    for (let i = 0; i < n; i++) {
      const v = r() < 0.5 ? 0 : 255;
      g.fillStyle = `rgba(${v},${v},${v},${alpha * r()})`;
      g.fillRect(x + r() * w, y + r() * h, 0.35, 0.35);
    }
    g.restore();
  }
}
