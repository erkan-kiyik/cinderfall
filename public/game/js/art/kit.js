// KOR — paint kit.
//
// Small set of drawing primitives every painter uses:
//   P(d)        cached Path2D from an SVG path string (Path2D passes through)
//   cel()       painted shading of any shape against the world key light,
//               whatever rotation the current bone has: no drawn lines, the
//               form turns by soft light and shadow alone (docs §11)
//   blob()      smooth closed outline through points (Catmull-Rom)
//   limb()      tapered limb outline along +y from two width profiles
//   outlined()  bake a drawing with a soft contact shade round it (no ink line)
import { LIGHT, INK, OUTLINE, LINE } from './style.js';
import { texture } from './tex.js';

const cache = new Map();
export function P(d) {
  if (typeof d !== 'string') return d;
  let p = cache.get(d);
  if (!p) { p = new Path2D(d); cache.set(d, p); }
  return p;
}

// Figures are painted, never inked (docs §11): while soft marks are on (the
// character bakes and figure drawings turn them on), every stroke is a brush
// mark whose edge melts over part of its width, and the small dark fills
// (vents, straps, seams, hair) lose their cut edge the same way.
let SOFT = false;
export function softMarks(on) { const was = SOFT; SOFT = on; return was; }
const LUM = new Map();
function dark(c) {
  if (typeof c !== 'string') return false;
  let v = LUM.get(c);
  if (v === undefined) {
    let r = 1, gg = 1, b = 1;
    const h = c.match(/^#([0-9a-f]{6})$/i), m = c.match(/^rgba?\(([^)]+)\)/i);
    if (h) { const n = parseInt(h[1], 16); r = (n >> 16) / 255; gg = ((n >> 8) & 255) / 255; b = (n & 255) / 255; }
    else if (c.match(/^#([0-9a-f]{3})$/i)) { const n = c.slice(1); r = parseInt(n[0], 16) / 15; gg = parseInt(n[1], 16) / 15; b = parseInt(n[2], 16) / 15; }
    else if (m) { const q = m[1].split(',').map(Number); r = q[0] / 255; gg = q[1] / 255; b = q[2] / 255; }
    v = 0.3 * r + 0.55 * gg + 0.15 * b;
    LUM.set(c, v);
  }
  return v < 0.16;
}

export function fill(g, d, c, a = 1) {
  g.globalAlpha = a; g.fillStyle = c;
  const b = SOFT && dark(c) ? 0.07 * ppu(g) : 0, f0 = b > 0.5 ? g.filter : null;
  if (f0 !== null) g.filter = `blur(${b.toFixed(2)}px)`;
  g.fill(P(d)); g.globalAlpha = 1;
  if (f0 !== null) g.filter = f0;
}

export function stroke(g, d, c, w, a = 1) {
  g.globalAlpha = a; g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
  let f0 = null;
  if (SOFT) {
    // dark marks spread wider and lighter, as paint does, so none reads as a drawn line
    const dk = dark(c), b = w * (dk ? 0.38 : 0.22) * ppu(g);
    if (b > 0.5) { f0 = g.filter; g.filter = `blur(${b.toFixed(2)}px)`; }
    if (dk) g.globalAlpha = a * 0.85;
  }
  g.stroke(P(d)); g.globalAlpha = 1;
  if (f0 !== null) g.filter = f0;
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
export function ppu(g) { const m = g.getTransform(); return Math.hypot(m.a, m.b) || 1; }

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

// Painted shading (docs §10.1, §11): the shape in its mid tone, then inner
// shadows of its own outline: a broad soft form shadow coming in from the
// side away from the light (shade tone), a tight occlusion all round the edge
// (line tone), the light band along the lit edge (light tone) and a faint
// bounce light along the shadow edge, so forms read round; then the
// material's texture if the tone has one. No line is drawn round the shape
// unless asked for (o.line: true); parts separate by occlusion and light.
//   o.sh  form shadow reach (world units), o.hl light band width (0 = none)
//   o.ao  edge occlusion strength (0 = none), o.tex override the texture
//   o.gloss  a tight specular glint on the lit edge (leather, rubber, steel)
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
  // bounce: a little of the mid tone thrown back into the shadow side
  if (sh > 0 && o.bounce !== 0) {
    const [bx, by] = localVec(g, -LIGHT.x * 0.5, -LIGHT.y * 0.5);
    g.globalAlpha = o.bounce ?? 0.22; soft(g, p, -bx, -by, t.m, Math.min(10, 0.9 * k), true); g.globalAlpha = 1;
  }
  const ao = o.ao ?? 0.55;
  if (ao > 0) { g.globalAlpha = ao; soft(g, p, 0, 0, t.k, Math.min(12, 0.9 * k), true); g.globalAlpha = 1; }
  if (hl > 0) {
    const [hx, hy] = localVec(g, -LIGHT.x * hl, -LIGHT.y * hl);
    soft(g, p, hx, hy, t.l, Math.min(10, hl * 0.9 * k), true);
  }
  if (o.gloss) {
    const [gx, gy] = localVec(g, -LIGHT.x * 0.35, -LIGHT.y * 0.35);
    g.globalAlpha = o.gloss; soft(g, p, gx * 0.6, gy * 0.6, '#fffaf0', Math.min(4, 0.35 * k), true);
    g.globalAlpha = 1;
    // and take most of it back off the inside so only the rim glints
    g.globalAlpha = o.gloss * 0.9; soft(g, p, gx * 0.25, gy * 0.25, t.l, Math.min(5, 0.5 * k), true); g.globalAlpha = 1;
  }
  const tx = o.tex ?? t.tex;
  if (tx) texture(g, tx, t.ta ?? 0.55);
  g.restore();
  if (o.line === true) stroke(g, p, t.k, (o.lw ?? 0.32) * LINE, 0.6);
}

// Flat fill with its edge softly darkened toward `k` (small trims, straps,
// panels): no line, an occlusion that reads as thickness.
export function flat(g, d, c, k, lw = 0.28) {
  fill(g, d, c);
  if (!k) return;
  const p = P(d), kk = ppu(g);
  g.save(); g.clip(p); g.globalAlpha = 0.7; soft(g, p, 0, 0, k, Math.min(8, Math.max(1, lw * 2.4 * kk)), true); g.restore();
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
// Every canvas the art is painted on is rasterised on the CPU: the soft
// shading lays hundreds of blurred shadows and filters per figure, and GPU
// canvases drop or misplace some of them once a canvas holds that many
// (a far hand gone, slivers of an inner shadow left floating). The bake is
// done once and cached, so the CPU path costs little and paints the same
// picture on every device.
export function canvas(w, h) {
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
  c.getContext('2d', { willReadFrequently: true });
  return c;
}

// Draw `paint(g)` into a w×h canvas at `scale` px per unit with the origin at
// (ox, oy) px, then lay a soft contact shade round it: the silhouette blurred
// over `r` units at low strength, darker toward the ground. It separates the
// thing from what is behind it the way occlusion does in a photograph; it is
// not an ink line.
export function outlined(w, h, scale, ox, oy, paint, r = OUTLINE, ink = INK) {
  const art = canvas(w, h), ag = art.getContext('2d');
  ag.translate(ox, oy); ag.scale(scale, scale);
  paint(ag);
  const sil = canvas(w, h), sg = sil.getContext('2d');
  sg.drawImage(art, 0, 0);
  sg.globalCompositeOperation = 'source-in';
  sg.fillStyle = ink; sg.fillRect(0, 0, w, h);
  const out = canvas(w, h), og = out.getContext('2d');
  const rp = Math.max(1, r * scale);
  og.filter = `blur(${(rp * 0.7).toFixed(1)}px)`;
  og.globalAlpha = 0.32; og.drawImage(sil, 0, rp * 0.25);
  og.filter = 'none'; og.globalAlpha = 1;
  og.drawImage(art, 0, 0);
  return out;
}

// Weather laid over what is already painted inside box [x0, y0, x1, y1]
// (source-atop: only on painted pixels), from a small overlay drawn once and
// stretched, so it costs one draw (docs §11). o.night darkens the top (tall
// things the street lamps never reach), o.sky lights the top edge a little
// (small things under the night sky), o.foot the contact dark at the ground,
// o.stain blotches per 100 square units, o.rain streaks per 10 units, o.speck
// fine grain.
export function weatherOver(g, box, seed, o = {}) {
  const [x0, y0, x1, y1] = box, W = x1 - x0, H = y1 - y0, r = rng(seed);
  const d = o.res ?? (W * H > 4000 ? 1.3 : 4);
  const c = canvas(Math.max(2, Math.ceil(W * d)), Math.max(2, Math.ceil(H * d))), q = c.getContext('2d');
  q.scale(d, d); q.translate(-x0, -y0);
  const gr = q.createLinearGradient(0, y0, 0, y1);
  const night = o.night ?? 0, sky = o.sky ?? 0, foot = o.foot ?? 0.3;
  gr.addColorStop(0, sky ? `rgba(170,184,204,${sky})` : `rgba(5,7,11,${night})`);
  gr.addColorStop(0.5, `rgba(5,7,11,${night * 0.4})`);
  gr.addColorStop(0.86, 'rgba(5,7,11,0)');
  gr.addColorStop(1, `rgba(12,9,6,${foot})`);
  q.fillStyle = gr; q.fillRect(x0, y0, W, H);
  const n = Math.round((W * H) / 100 * (o.stain ?? 0.7));
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * W, y = y0 + r() * H, rx = (1 + r() * 5) * (o.big ?? 1), ry = (0.8 + r() * 4) * (o.big ?? 1), light = r() < 0.25;
    q.save(); q.translate(x, y); q.scale(rx, ry);
    const gg = q.createRadialGradient(0, 0, 0, 0, 0, 1);
    gg.addColorStop(0, light ? `rgba(200,190,170,${0.03 + r() * 0.05})` : `rgba(22,17,12,${0.05 + r() * 0.09})`); gg.addColorStop(1, 'rgba(0,0,0,0)');
    q.fillStyle = gg; q.beginPath(); q.arc(0, 0, 1, 0, Math.PI * 2); q.fill(); q.restore();
  }
  q.lineCap = 'round';
  for (let i = 0; i < (W / 10) * (o.rain ?? 3); i++) {
    const x = x0 + r() * W, ya = y0 + r() * H * 0.85, L = Math.min(y1 - ya, 3 + r() * H * 0.25);
    q.strokeStyle = `rgba(14,11,9,${0.06 + r() * 0.12})`; q.lineWidth = 0.15 + r() * 0.6;
    q.beginPath(); q.moveTo(x, ya); q.bezierCurveTo(x + (r() - 0.5) * 0.6, ya + L * 0.4, x + (r() - 0.5) * 0.6, ya + L * 0.7, x + (r() - 0.5) * 0.4, ya + L); q.stroke();
  }
  for (let i = 0; i < W * H * (o.speck ?? 0.4); i++) {
    q.fillStyle = r() < 0.5 ? `rgba(0,0,0,${0.08 + r() * 0.1})` : `rgba(255,248,236,${0.04 + r() * 0.06})`;
    q.fillRect(x0 + r() * W, y0 + r() * H, 0.18, 0.18);
  }
  g.save();
  g.globalCompositeOperation = 'source-atop'; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(c, x0, y0, W, H);
  g.restore();
}

// A painter whose result is defocused by `u` units afterwards: the background
// layers, out of the focus the camera keeps on the street (docs §10.12). Capped
// at 1.5 px so the overlapping margins of chunked layers hide every seam.
export function defocus(paint, u) {
  return (g) => {
    paint(g);
    const c = g.canvas, px = Math.min(1.5, u * ppu(g));
    if (px < 0.3) return;
    const tmp = canvas(c.width, c.height); tmp.getContext('2d').drawImage(c, 0, 0);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    g.filter = `blur(${px.toFixed(2)}px)`; g.drawImage(tmp, 0, 0);
    g.restore();
  };
}

// Round a part painted alone on canvas c (transparent round it), the way a
// form turns from the light: its edges fall into shade, more on the side away
// from the light (down and away). `px`: how deep the turn goes, in device
// pixels. Only the part's own pixels change (source-atop), so its silhouette
// stays where it was.
export function volume(c, px) {
  if (px < 0.8) return;
  const w = c.width, h = c.height, g = c.getContext('2d');
  // the part's alpha blurred at half size (it is only ever a soft edge), nudged
  // toward the light, cut out of a dark sheet: what is left is the turned edge
  const bw = Math.max(1, Math.ceil(w / 2)), bh = Math.max(1, Math.ceil(h / 2));
  const b = canvas(bw, bh), gb = b.getContext('2d');
  gb.filter = `blur(${(px / 2).toFixed(2)}px)`; gb.drawImage(c, 0, 0, bw, bh);
  const m = canvas(w, h), gm = m.getContext('2d');
  gm.fillStyle = 'rgb(6,7,10)'; gm.fillRect(0, 0, w, h);
  gm.globalCompositeOperation = 'destination-out'; gm.drawImage(b, -px * 0.35, -px * 0.55, w, h);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.5;
  g.drawImage(m, 0, 0); g.restore();
}

// A machined finish laid over a weapon already painted in box [x0, y0, x1, y1]
// (source-atop: only on its own pixels): the light from above rolling off the
// receiver toward the grip, a specular streak along the top flats, brushed
// grain along the length, the edges and controls worn bright by hands, dust.
// Only for a weapon on a canvas of its own.
export function metalOver(g, [x0, y0, x1, y1], seed = 3) {
  const W = x1 - x0, H = y1 - y0, r = rng(seed);
  g.save();
  g.globalCompositeOperation = 'source-atop';
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, 'rgba(246,240,230,0.13)'); gr.addColorStop(0.3, 'rgba(246,240,230,0.03)');
  gr.addColorStop(0.55, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(4,6,10,0.3)');
  g.fillStyle = gr; g.fillRect(x0, y0, W, H);
  // the streak: a narrow band of the lamp along the upper flats
  const ys = y0 + H * 0.34, sb = g.createLinearGradient(0, ys - H * 0.05, 0, ys + H * 0.05);
  sb.addColorStop(0, 'rgba(255,250,240,0)'); sb.addColorStop(0.5, 'rgba(255,250,240,0.14)'); sb.addColorStop(1, 'rgba(255,250,240,0)');
  g.fillStyle = sb; g.fillRect(x0, ys - H * 0.05, W, H * 0.1);
  // brushed grain along the length
  for (let i = 0; i < W * 1.6; i++) {
    const y = y0 + r() * H, xa = x0 + r() * W, L = 1 + r() * W * 0.25;
    g.fillStyle = r() < 0.5 ? `rgba(255,255,255,${0.025 + r() * 0.04})` : `rgba(0,0,0,${0.03 + r() * 0.05})`;
    g.fillRect(xa, y, L, 0.06);
  }
  // wear and dust
  for (let i = 0; i < W * H * 0.05; i++) {
    const x = x0 + r() * W, y = y0 + r() * H;
    g.fillStyle = r() < 0.4 ? `rgba(226,220,208,${0.1 + r() * 0.16})` : `rgba(150,138,118,${0.08 + r() * 0.1})`;
    g.fillRect(x, y, 0.12 + r() * 0.25, 0.08 + r() * 0.15);
  }
  g.restore();
}

// A prop's painter with the weather laid over it: a little night sky on its
// top, the contact dark at its foot, stains, a few runs, grain.
export function weathered(p) {
  let seed = 7; for (const ch of p.name) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  const b = p.box;
  // and rounded like the figures (volume): every prop is baked on a canvas of its
  // own, so its edges can turn into shade
  return (g) => {
    p.paint(g); if (Array.isArray(b)) weatherOver(g, b, seed, { sky: 0.07, foot: 0.4, stain: 1.4, rain: 2.2, speck: 0.5, big: 0.6 });
    const k = ppu(g); volume(g.canvas, Math.min(3 * k, Math.max(1, 1.2 * k)));
  };
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
