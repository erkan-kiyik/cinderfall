// KOR LAB — paint kit.
//
// Small set of drawing primitives every painter uses:
//   P(d)        cached Path2D from an SVG path string (Path2D passes through)
//   cel()       automatic three-tone cel shading of any shape against the
//               world key light, whatever rotation the current bone has
//   blob()      smooth closed outline through points (Catmull-Rom)
//   limb()      tapered limb outline along +y from two width profiles
//   outlined()  bake a drawing and wrap it in the dark outer outline
import { LIGHT, INK, OUTLINE, LINE } from './style.js';
import { texture } from './tex.js';

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
const FAR = 4096;   // device px: where soft fills are drawn so only their blurred shadow lands

// Pixels per unit of the current transform (blur radii are in device px).
function ppu(g) { const m = g.getTransform(); return Math.hypot(m.a, m.b) || 1; }

// Fill `p` shifted by (dx, dy) local units with its edge softened by `blur`
// device px. inv: fill everything but the shape instead (an inner shadow of its
// outline). Works in device space so the path stays canvas-sized.
function soft(g, p, dx, dy, color, blur, inv = false) {
  const M = g.getTransform(), W = g.canvas.width, H = g.canvas.height, pad = blur * 2 + 4;
  const q = new Path2D();
  if (inv) q.rect(-pad, -pad, W + 2 * pad, H + 2 * pad);
  q.addPath(p, M.translate(dx, dy));
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = color;
  if (blur < 0.7) g.fill(q, 'evenodd');
  else {
    g.shadowColor = color; g.shadowBlur = blur; g.shadowOffsetX = -FAR; g.shadowOffsetY = 0;
    g.translate(FAR, 0); g.fill(q, 'evenodd');
  }
  g.restore();
}

// Painted shading (docs §10.1): the shape in its mid tone, then three inner
// shadows of its own outline: a broad soft form shadow coming in from the
// side away from the light (shade tone), a tight occlusion all round the edge
// (line tone), and the light band along the lit edge (light tone); then the
// material's texture if the tone has one.
//   o.sh  form shadow reach (world units), o.hl light band width (0 = none)
//   o.ao  edge occlusion strength (0 = none), o.tex override the texture
export function cel(g, d, t, o = {}) {
  const p = P(d);
  const sh = o.sh ?? 1.0, hl = o.hl ?? 0.45, k = ppu(g);
  g.save();
  g.clip(p);
  g.fillStyle = t.m; g.fillRect(-BIG, -BIG, 2 * BIG, 2 * BIG);
  if (sh > 0) {
    const [sx, sy] = localVec(g, LIGHT.x * sh * 1.3, LIGHT.y * sh * 1.3);
    soft(g, p, sx, sy, t.d, Math.min(26, (0.6 + sh * 1.6) * k), true);
  }
  const ao = o.ao ?? 0.45;
  if (ao > 0) { g.globalAlpha = ao; soft(g, p, 0, 0, t.k, Math.min(12, 0.9 * k), true); g.globalAlpha = 1; }
  if (hl > 0) {
    const [hx, hy] = localVec(g, -LIGHT.x * hl, -LIGHT.y * hl);
    soft(g, p, hx, hy, t.l, Math.min(10, hl * 0.9 * k), true);
  }
  const tx = o.tex ?? t.tex;
  if (tx) texture(g, tx, t.ta ?? 0.55);
  g.restore();
  if (o.line !== false) stroke(g, p, t.k, (o.lw ?? 0.32) * LINE, 0.9);
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
