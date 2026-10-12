// CINDERFALL LAB — paint kit.
//
// Small set of drawing primitives every painter uses:
//   P(d)        cached Path2D from an SVG path string (Path2D passes through)
//   cel()       automatic three-tone cel shading of any shape against the
//               world key light, whatever rotation the current bone has
//   blob()      smooth closed outline through points (Catmull-Rom)
//   limb()      tapered limb outline along +y from two width profiles
//   outlined()  bake a drawing and wrap it in the dark outer outline
import { LIGHT, INK, OUTLINE } from './style.js';

const cache = new Map();
export function P(d) {
  if (typeof d !== 'string') return d;
  let p = cache.get(d);
  if (!p) { p = new Path2D(d); cache.set(d, p); }
  return p;
}

export function fill(g, d, c, a = 1) {
  g.globalAlpha = a; g.fillStyle = c; g.fill(P(d)); g.globalAlpha = 1;
}

export function stroke(g, d, c, w, a = 1) {
  g.globalAlpha = a; g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
  g.stroke(P(d)); g.globalAlpha = 1;
}

export function clip(g, d, fn) {
  g.save(); g.clip(P(d)); fn(); g.restore();
}

// --- world-space light in the current local frame -------------------------
let ROOT = new DOMMatrix();
// Painters call this once with the figure's root transform in place, so the
// light stays fixed in the world while bones rotate (and mirror) under it.
export function setRoot(g) { ROOT = g.getTransform(); }

function localVec(g, wx, wy) {
  const dx = ROOT.a * wx + ROOT.c * wy, dy = ROOT.b * wx + ROOT.d * wy;
  const inv = g.getTransform().inverse();
  return [inv.a * dx + inv.c * dy, inv.b * dx + inv.d * dy];
}

const BIG = 1e4;
// Three-tone cel shading. The shape is filled with its shade tone, the mid
// tone is laid over it shifted toward the light (leaving a shade band on the
// side away from it), and a light band is cut along the lit edge.
//   o.sh  shade band width (world units), o.hl light band width (0 = none)
export function cel(g, d, t, o = {}) {
  const p = P(d);
  const sh = o.sh ?? 1.0, hl = o.hl ?? 0.45;
  g.save();
  g.clip(p);
  g.fillStyle = t.d; g.fillRect(-BIG, -BIG, 2 * BIG, 2 * BIG);
  const [sx, sy] = localVec(g, LIGHT.x * sh, LIGHT.y * sh);
  g.translate(sx, sy); g.fillStyle = t.m; g.fill(p); g.translate(-sx, -sy);
  if (hl > 0) {
    const [hx, hy] = localVec(g, -LIGHT.x * hl, -LIGHT.y * hl);
    const q = new Path2D(); q.rect(-BIG, -BIG, 2 * BIG, 2 * BIG);
    q.addPath(p, new DOMMatrix().translate(hx, hy));
    g.fillStyle = t.l; g.fill(q, 'evenodd');
  }
  g.restore();
  if (o.line !== false) stroke(g, p, t.k, o.lw ?? 0.32);
}

// Flat fill with only an inner line (small trims, straps, panels).
export function flat(g, d, c, k, lw = 0.28) {
  fill(g, d, c);
  if (k) stroke(g, d, k, lw);
}

// --- smooth shapes ---------------------------------------------------------
const f2 = (v) => (Math.round(v * 100) / 100).toString();

// Closed Catmull-Rom spline through points [[x,y],...] → SVG path string.
export function blob(pts, tension = 1) {
  const n = pts.length;
  let s = `M ${f2(pts[0][0])} ${f2(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const k = tension / 6;
    s += ` C ${f2(p1[0] + (p2[0] - p0[0]) * k)} ${f2(p1[1] + (p2[1] - p0[1]) * k)}`
      + ` ${f2(p2[0] - (p3[0] - p1[0]) * k)} ${f2(p2[1] - (p3[1] - p1[1]) * k)}`
      + ` ${f2(p2[0])} ${f2(p2[1])}`;
  }
  return s + ' Z';
}

// Open spline (for strokes: folds, seams).
export function curve(pts, tension = 1) {
  const n = pts.length;
  let s = `M ${f2(pts[0][0])} ${f2(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const k = tension / 6;
    s += ` C ${f2(p1[0] + (p2[0] - p0[0]) * k)} ${f2(p1[1] + (p2[1] - p0[1]) * k)}`
      + ` ${f2(p2[0] - (p3[0] - p1[0]) * k)} ${f2(p2[1] - (p3[1] - p1[1]) * k)}`
      + ` ${f2(p2[0])} ${f2(p2[1])}`;
  }
  return s;
}

// Limb along +y from 0 to L. front/back: [[t, halfWidth], ...] for the +x
// and -x edges, t in 0..1. Ends are rounded by a cap point beyond each end.
export function limb(L, front, back, capA = 0.55, capB = 0.55) {
  const pts = [];
  const f0 = front[0][1], b0 = back[0][1];
  pts.push([(f0 - b0) / 2, -capA * (f0 + b0) / 2]);
  for (const [t, w] of front) pts.push([w, t * L]);
  const f1 = front[front.length - 1][1], b1 = back[back.length - 1][1];
  pts.push([(f1 - b1) / 2, L + capB * (f1 + b1) / 2]);
  for (let i = back.length - 1; i >= 0; i--) pts.push([-back[i][1], back[i][0] * L]);
  return blob(pts);
}

// --- baking ----------------------------------------------------------------
export function canvas(w, h) {
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
  return c;
}

// Draw `paint(g)` into a w×h canvas at `scale` px per unit with the origin at
// (ox, oy) px, then wrap the result in the outer outline (radius in units).
export function outlined(w, h, scale, ox, oy, paint, r = OUTLINE, ink = INK) {
  const art = canvas(w, h), ag = art.getContext('2d');
  ag.translate(ox, oy); ag.scale(scale, scale);
  paint(ag);
  const sil = canvas(w, h), sg = sil.getContext('2d');
  sg.drawImage(art, 0, 0);
  sg.globalCompositeOperation = 'source-in';
  sg.fillStyle = ink; sg.fillRect(0, 0, w, h);
  const out = canvas(w, h), og = out.getContext('2d');
  const rp = r * scale, steps = 24;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    og.drawImage(sil, Math.cos(a) * rp, Math.sin(a) * rp);
  }
  og.drawImage(sil, 0, 0);
  og.drawImage(art, 0, 0);
  return out;
}

// Silhouette of a baked canvas in one colour (for the readability check).
export function silhouette(src, color = '#000') {
  const c = canvas(src.width, src.height), g = c.getContext('2d');
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return c;
}

export const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
