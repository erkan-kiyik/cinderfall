// Gun kit: the drawing toolkit the LAB arsenal is painted with.
//
// The old arsenal assembled most weapons from a shared parts bin (one
// receiver, a choice of stock / barrel / magazine blocks), which is why so
// many guns read as stacks of rectangles. Here every weapon is drawn as its
// own object, and this module supplies the things every painter needs so
// none of them re-invents them:
//
//   shapes     Path2D builders that carry their own bounding box — an SVG
//              path, a polygon with rounded corners, a rounded rect, a tube.
//   materials  anodised aluminium, blued/parkerised steel, polymer, rubber,
//              wood with grain, glass, brass, copper, ceramic, emissive.
//              Each knows how light falls on it (a box is lit on top, a
//              tube has a specular band), so parts read as solid objects.
//   zones      every part is tagged as receiver metal, furniture, bare steel
//              or fixed (glass, rubber, light). A second, flat pass renders
//              those tags into masks, which is how a skin knows that camo
//              goes on the stock and the receiver but not on the bore, the
//              optic glass or the rubber butt pad.
//   baking     painters draw on a generous canvas in weapon units (origin =
//              trigger-hand grip, +x toward the muzzle); the bake crops to
//              what was actually painted, so nothing is ever sheared off at
//              a canvas edge and the anchor is always exact.

import { makeCanvas, shade, mix, withA, hexRgb, ASSET_SCALE } from './paint.js';

// ------------------------------------------------------------------ shapes

// Bounding box of an SVG path string's coordinates (control points included,
// which only ever makes the box a little generous — all it is used for is
// sizing a gradient).
function svgBox(d) {
  const tok = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  let cmd = 'M', x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, i = 0;
  const pt = (x, y) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); };
  let lastX = 0, lastY = 0;
  while (i < tok.length) {
    if (/[a-zA-Z]/.test(tok[i])) { cmd = tok[i++]; if (cmd === 'Z' || cmd === 'z') continue; }
    const n = () => parseFloat(tok[i++]);
    if (cmd === 'H') { lastX = n(); pt(lastX, lastY); }
    else if (cmd === 'V') { lastY = n(); pt(lastX, lastY); }
    else if (cmd === 'A') { n(); n(); n(); n(); n(); lastX = n(); lastY = n(); pt(lastX, lastY); }
    else { lastX = n(); lastY = n(); pt(lastX, lastY); }
  }
  return [x0, y0, x1, y1];
}

// An absolute-coordinate SVG path (M L Q C H V A Z).
export function svg(d) { return { p: new Path2D(d), b: svgBox(d) }; }

// Polygon with rounded corners. `pts` is [[x, y], …] or [[x, y, r], …] for a
// per-corner radius; the radius is clamped to half the shorter adjacent edge
// so a tight corner can never loop back on itself.
export function rpoly(pts, r = 0.5) {
  const p = new Path2D();
  const n = pts.length;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const at = (i) => pts[(i + n) % n];
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(at(n - 1), at(0));
  p.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const a = at(i - 1), v = at(i), b = at(i + 1);
    const la = Math.hypot(v[0] - a[0], v[1] - a[1]);
    const lb = Math.hypot(b[0] - v[0], b[1] - v[1]);
    const rr = Math.min(v[2] != null ? v[2] : r, la / 2, lb / 2);
    if (rr <= 0.001) p.lineTo(v[0], v[1]);
    else p.arcTo(v[0], v[1], b[0], b[1], rr);
  }
  p.closePath();
  return { p, b: [x0, y0, x1, y1] };
}

export function rrect(x, y, w, h, r = 0.4) {
  const p = new Path2D();
  const rr = Math.min(r, w / 2, h / 2);
  p.moveTo(x + rr, y);
  p.arcTo(x + w, y, x + w, y + h, rr);
  p.arcTo(x + w, y + h, x, y + h, rr);
  p.arcTo(x, y + h, x, y, rr);
  p.arcTo(x, y, x + w, y, rr);
  p.closePath();
  return { p, b: [x, y, x + w, y + h] };
}

export function ell(cx, cy, rx, ry = rx) {
  const p = new Path2D();
  p.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  return { p, b: [cx - rx, cy - ry, cx + rx, cy + ry] };
}

// Horizontal tube from x0 to x1 on centreline yc, radius rad. Ends are 'flat'
// (a lathe-cut face, softened a touch) or 'round'.
export function tube(x0, x1, yc, rad, capL = 'flat', capR = 'flat') {
  const p = new Path2D();
  const k = Math.min(rad * 0.35, 0.4);
  if (capL === 'round') { p.moveTo(x0 + rad, yc - rad); }
  else { p.moveTo(x0 + k, yc - rad); }
  if (capR === 'round') {
    p.lineTo(x1 - rad, yc - rad);
    p.arc(x1 - rad, yc, rad, -Math.PI / 2, Math.PI / 2);
  } else {
    p.lineTo(x1 - k, yc - rad); p.quadraticCurveTo(x1, yc - rad, x1, yc - rad + k);
    p.lineTo(x1, yc + rad - k); p.quadraticCurveTo(x1, yc + rad, x1 - k, yc + rad);
  }
  if (capL === 'round') {
    p.lineTo(x0 + rad, yc + rad);
    p.arc(x0 + rad, yc, rad, Math.PI / 2, Math.PI * 1.5);
  } else {
    p.lineTo(x0 + k, yc + rad); p.quadraticCurveTo(x0, yc + rad, x0, yc + rad - k);
    p.lineTo(x0, yc - rad + k); p.quadraticCurveTo(x0, yc - rad, x0 + k, yc - rad);
  }
  p.closePath();
  return { p, b: [x0, yc - rad, x1, yc + rad] };
}

// ---------------------------------------------------------------- materials

// How light falls across a part, as value offsets down its height.
// `box`  — flat-sided machined part: lit top edge, face, shadowed belly.
// `cyl`  — anything round seen side-on: specular band high, dark underside.
// `soft` — moulded polymer / rubber: low contrast, no hard highlight.
const LIGHT = {
  box:  [[0, 0.20], [0.10, 0.07], [0.45, 0.0], [0.80, -0.16], [1, -0.34]],
  cyl:  [[0, -0.12], [0.16, 0.30], [0.30, 0.10], [0.62, -0.12], [0.86, -0.32], [1, -0.44]],
  soft: [[0, 0.11], [0.35, 0.02], [0.75, -0.10], [1, -0.26]],
};

function ramp(g, b, base, light) {
  const gr = g.createLinearGradient(0, b[1], 0, b[3]);
  for (const [t, v] of light) gr.addColorStop(t, shade(base, v));
  return gr;
}

// Which light model a material uses unless the part asks for another.
const MAT_LIGHT = {
  alu: 'box', steel: 'cyl', poly: 'soft', rubber: 'soft', wood: 'box',
  brass: 'cyl', copper: 'cyl', ceramic: 'soft', paint: 'box',
};

// ------------------------------------------------------------------- zones

// Zone a part belongs to, for the skin masks:
//   metal  receiver / frame / slide / handguard — takes coatings and camo
//   furn   stock, grip, fore-end furniture — takes coatings, camo, wood
//   steel  barrel, bolt, pins, muzzle — bare metal; only metal treatments
//   fixed  glass, rubber, light, brass — never recoloured
export const ZONES = ['metal', 'furn', 'steel', 'emit'];

// --------------------------------------------------------------------- kit

// Default materials, held above the floor the night street needs: a gun much
// darker than this stops reading as an object and reads as a hole.
const DEFAULT_LOOK = {
  alu: '#3a3d42', steel: '#35383d', poly: '#303235', rubber: '#232426',
  wood: '#6a4529', brass: '#b8913e', copper: '#a5582d', ceramic: '#d9d2c3',
  glass: '#1b2733', core: [90, 210, 255], paint: '#3c4237',
};

class Kit {
  constructor(g, look, zones) {
    this.g = g;
    this.L = { ...DEFAULT_LOOK, ...look };
    this.zones = zones;           // null on the colour pass
    this.flat = !!zones;
    // Rig values the painter measured while drawing (e.g. where the muzzle
    // ends up once a device is fitted), handed back on the sprite.
    this.out = {};
    // Painted extent, in weapon units. The bake crops to this instead of
    // reading the canvas back from the GPU, which on a phone is the single
    // most expensive thing a bake could do.
    this.ext = [1e9, 1e9, -1e9, -1e9];
  }

  grow(b, pad = 0) {
    const e = this.ext;
    if (b[0] - pad < e[0]) e[0] = b[0] - pad;
    if (b[1] - pad < e[1]) e[1] = b[1] - pad;
    if (b[2] + pad > e[2]) e[2] = b[2] + pad;
    if (b[3] + pad > e[3]) e[3] = b[3] + pad;
  }

  color(mat, override) {
    return override || this.L[mat] || '#808080';
  }

  // A solid part. `zone` tags it for the skin masks, `mat` picks the fill.
  // opts: color, light ('box'|'cyl'|'soft'), bevel (default on), line
  // (outline, default on), tex ('stipple'|'grain'|'knurl'), alpha.
  part(zone, mat, s, opts = {}) {
    this.grow(s.b, 0.3);
    if (this.flat) { this._zone(zone, s.p); return; }
    const g = this.g;
    g.save();
    if (mat === 'glass') this._glass(s);
    else if (mat === 'emit') this._emit(s, opts);
    else {
      const base = this.color(mat, opts.color);
      g.fillStyle = ramp(g, s.b, base, LIGHT[opts.light || MAT_LIGHT[mat] || 'box']);
      g.fill(s.p);
      if (mat === 'wood' || opts.tex === 'grain') this._grain(s, base);
      if (opts.tex === 'stipple') this._stipple(s, base);
      if (opts.tex === 'knurl') this._knurl(s);
    }
    if (opts.bevel !== false && mat !== 'emit') this._bevel(s, opts.bevel === 'soft' ? 0.5 : 1);
    if (opts.line !== false && mat !== 'emit') {
      g.strokeStyle = 'rgba(5,6,8,0.55)';
      g.lineWidth = 0.22; g.lineJoin = 'round';
      g.stroke(s.p);
    }
    g.restore();
  }

  // Bevel: a lit lip along the upper edges and a dark one along the lower,
  // both inside the part. It is what makes a flat fill read as a machined
  // object with thickness rather than a cut-out.
  _bevel(s, k) {
    const g = this.g;
    g.save();
    g.clip(s.p);
    g.lineWidth = 0.55;
    g.translate(0, 0.42);
    g.strokeStyle = `rgba(235,240,248,${0.16 * k})`;
    g.stroke(s.p);
    g.translate(0, -0.84);
    g.strokeStyle = `rgba(0,0,0,${0.32 * k})`;
    g.stroke(s.p);
    g.restore();
  }

  _grain(s, base) {
    const g = this.g;
    const [x0, y0, x1, y1] = s.b;
    g.save();
    g.clip(s.p);
    const h = y1 - y0;
    for (let i = 0; i < 9; i++) {
      const y = y0 + h * ((i + 0.5) / 9) + Math.sin(i * 2.3) * 0.3;
      g.strokeStyle = i % 2 ? withA(shade(base, -0.35), 0.28) : withA(shade(base, 0.25), 0.16);
      g.lineWidth = 0.18 + (i % 3) * 0.06;
      g.beginPath();
      g.moveTo(x0, y);
      const segs = 6;
      for (let j = 1; j <= segs; j++) {
        const x = x0 + (x1 - x0) * (j / segs);
        g.quadraticCurveTo(x - (x1 - x0) / segs / 2, y + Math.sin(i + j * 1.7) * 0.35, x, y + Math.sin(i * 0.7 + j) * 0.2);
      }
      g.stroke();
    }
    g.restore();
  }

  _stipple(s, base) {
    const g = this.g;
    const [x0, y0, x1, y1] = s.b;
    g.save();
    g.clip(s.p);
    let seed = Math.floor((x0 * 13 + y0 * 7) * 100) | 0;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const n = Math.round((x1 - x0) * (y1 - y0) * 2.2);
    for (let i = 0; i < n; i++) {
      g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.20)';
      g.fillRect(x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0), 0.32, 0.32);
    }
    g.restore();
  }

  _knurl(s) {
    const g = this.g;
    const [x0, y0, x1, y1] = s.b;
    g.save();
    g.clip(s.p);
    g.strokeStyle = 'rgba(0,0,0,0.30)'; g.lineWidth = 0.16;
    for (let x = x0 - (y1 - y0); x < x1; x += 0.55) {
      g.beginPath(); g.moveTo(x, y1); g.lineTo(x + (y1 - y0), y0); g.stroke();
    }
    g.restore();
  }

  _glass(s) {
    const g = this.g;
    const [x0, y0, x1, y1] = s.b;
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, shade(this.L.glass, 0.35));
    gr.addColorStop(0.35, this.L.glass);
    gr.addColorStop(0.55, shade(this.L.glass, -0.3));
    gr.addColorStop(1, shade(this.L.glass, 0.1));
    g.fillStyle = gr;
    g.fill(s.p);
    g.save();
    g.clip(s.p);
    g.fillStyle = 'rgba(200,230,255,0.22)';
    g.beginPath();
    g.moveTo(x0, y0 + (y1 - y0) * 0.55); g.lineTo(x0 + (x1 - x0) * 0.45, y0);
    g.lineTo(x0 + (x1 - x0) * 0.62, y0); g.lineTo(x0, y0 + (y1 - y0) * 0.9);
    g.fill();
    g.restore();
  }

  // Emissive: the core colour, hotter toward the middle, plus a soft additive
  // spill. Only the spill is translucent; the part itself is opaque, so a
  // light channel is never a hole in the weapon.
  _emit(s, opts) {
    const g = this.g;
    const [r, gg, b] = opts.core || this.L.core;
    const [x0, y0, x1, y1] = s.b;
    const hot = `rgb(${Math.min(255, r + 120)},${Math.min(255, gg + 120)},${Math.min(255, b + 120)})`;
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, `rgb(${r},${gg},${b})`);
    gr.addColorStop(0.5, hot);
    gr.addColorStop(1, `rgb(${Math.round(r * 0.75)},${Math.round(gg * 0.75)},${Math.round(b * 0.75)})`);
    g.fillStyle = gr;
    g.fill(s.p);
    if (opts.spill !== 0) {
      // Spill: the shape's own light, blurred and added. Sized by the shape,
      // so a long thin channel glows along its length instead of throwing a
      // disc of light the width of the whole strip.
      const k = opts.spill || 1;
      const blur = Math.min(x1 - x0, y1 - y0) * 0.9 + 0.9;
      this.grow([x0 - blur * 1.6, y0 - blur * 1.6, x1 + blur * 1.6, y1 + blur * 1.6]);
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.filter = `blur(${(blur * ASSET_SCALE * 0.6).toFixed(1)}px)`;
      g.fillStyle = `rgba(${r},${gg},${b},${0.55 * k})`;
      g.fill(s.p);
      g.restore();
    }
  }

  _zone(zone, p) {
    for (const z of ZONES) {
      const c = this.zones[z];
      c.save();
      if (z === zone) { c.globalCompositeOperation = 'source-over'; c.fillStyle = '#fff'; }
      else { c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; }
      c.fill(p);
      c.restore();
    }
    // 'fixed' parts only erase: they belong to no recolourable zone.
  }

  // Free-form detail (seams, screws, port shadows). Colour pass only — a
  // detail never changes what zone the pixels under it belong to.
  detail(fn) { if (!this.flat) { this.g.save(); fn(this.g); this.g.restore(); } }

  // Dark seam / panel line.
  seam(d, w = 0.2, a = 0.55) {
    if (this.flat) return;
    const g = this.g;
    g.save(); g.strokeStyle = `rgba(4,5,7,${a})`; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
    g.stroke(typeof d === 'string' ? new Path2D(d) : d.p || d); g.restore();
  }
  // Thin highlight line (an edge catching light).
  hi(d, w = 0.2, a = 0.22) {
    if (this.flat) return;
    const g = this.g;
    g.save(); g.strokeStyle = `rgba(236,240,246,${a})`; g.lineWidth = w; g.lineCap = 'round';
    g.stroke(typeof d === 'string' ? new Path2D(d) : d.p || d); g.restore();
  }
  // Recessed slot: dark well with a lit lower lip.
  slot(x, y, w, h, r = h / 2) {
    if (this.flat) return;
    const g = this.g;
    const s = rrect(x, y, w, h, r);
    g.save();
    g.fillStyle = 'rgba(3,4,6,0.78)'; g.fill(s.p);
    g.clip(s.p);
    g.strokeStyle = 'rgba(220,226,234,0.18)'; g.lineWidth = 0.3;
    g.translate(0, -0.3); g.stroke(s.p);
    g.restore();
  }
  screw(x, y, r = 0.42) {
    if (this.flat) return;
    const g = this.g;
    g.save();
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.arc(x, y + 0.08, r, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(180,186,194,0.45)'; g.beginPath(); g.arc(x, y - 0.04, r * 0.72, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 0.12;
    g.beginPath(); g.moveTo(x - r * 0.5, y); g.lineTo(x + r * 0.5, y); g.stroke();
    g.restore();
  }

  // Picatinny rail along [x0, x1] with its top at yTop. A real part (metal
  // zone) with recoil slots cut across it.
  rail(x0, x1, yTop, h = 1.15, opts = {}) {
    const s = rrect(x0, yTop, x1 - x0, h + 0.6, 0.18);
    this.part('metal', 'alu', s, { color: opts.color, bevel: 'soft' });
    if (this.flat) return;
    const g = this.g;
    g.save();
    g.clip(s.p);
    g.fillStyle = 'rgba(0,0,0,0.55)';
    for (let x = x0 + 0.45; x < x1 - 0.5; x += 1.55) g.fillRect(x, yTop, 0.72, h * 0.72);
    g.fillStyle = 'rgba(230,236,244,0.20)';
    g.fillRect(x0, yTop, x1 - x0, 0.22);
    g.restore();
  }

  // Emissive line with an additive halo — for energy channels. On the zone
  // pass it erases, so no coating is ever painted over a light.
  glow(d, w = 0.6, opts = {}) {
    const p = typeof d === 'string' ? new Path2D(d) : d.p || d;
    if (typeof d === 'string') this.grow(svgBox(d), w * 1.8);
    else if (d.b) this.grow(d.b, w * 1.8);
    if (this.flat) {
      for (const z of ZONES) {
        const c = this.zones[z];
        c.save();
        c.lineCap = 'round'; c.lineWidth = w;
        if (z === 'emit') { c.strokeStyle = '#fff'; c.stroke(p); }
        else { c.globalCompositeOperation = 'destination-out'; c.strokeStyle = '#000'; c.stroke(p); }
        c.restore();
      }
      return;
    }
    const g = this.g;
    const [r, gg, b] = opts.core || this.L.core;
    g.save();
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = `rgba(${r},${gg},${b},0.22)`; g.lineWidth = w * 3.2; g.stroke(p);
    g.strokeStyle = `rgba(${r},${gg},${b},0.35)`; g.lineWidth = w * 1.8; g.stroke(p);
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = `rgb(${r},${gg},${b})`; g.lineWidth = w; g.stroke(p);
    g.strokeStyle = `rgb(${Math.min(255, r + 140)},${Math.min(255, gg + 140)},${Math.min(255, b + 140)})`;
    g.lineWidth = w * 0.42; g.stroke(p);
    g.restore();
  }

  // Shared light over the finished silhouette: sky above, bounce below. Kept
  // on painted pixels only.
  formLight(b) {
    if (this.flat) return;
    const g = this.g;
    g.save();
    g.globalCompositeOperation = 'source-atop';
    const gr = g.createLinearGradient(0, b[1], 0, b[3]);
    gr.addColorStop(0, 'rgba(214,228,246,0.10)');
    gr.addColorStop(0.35, 'rgba(214,228,246,0.0)');
    gr.addColorStop(0.75, 'rgba(0,0,0,0.0)');
    gr.addColorStop(1, 'rgba(0,0,0,0.22)');
    g.fillStyle = gr;
    g.fillRect(b[0], b[1], b[2] - b[0], b[3] - b[1]);
    g.restore();
  }
}

// --------------------------------------------------------------------- bake

// Working canvas, in weapon units: wide enough for the longest weapon with
// every accessory on it. The bake crops to the painted pixels afterwards.
const BOX = { x0: -64, y0: -34, x1: 84, y1: 34 };

// Paints `paint(k, look)` and returns a sprite in the game's sprite format
// ({ cv, ax, ay, s, w, h }), cropped to what was painted. With `zones`, the
// sprite also carries one mask canvas per zone (same size and anchor), for
// the skin compositor; drop them once the skin is built.
//
// `neutral` re-paints every material in mid grey: the result is the part's
// lighting and detail alone, which the compositor lays over a camo pattern
// so the pattern keeps the gun's form instead of lying flat on top of it.
export function bake(paint, look = {}, { zones = false, neutral = false, bounds = null, check = false } = {}) {
  const S = ASSET_SCALE;
  const W = (BOX.x1 - BOX.x0) * S, H = (BOX.y1 - BOX.y0) * S;
  let L = look;
  if (neutral) {
    L = { ...look };
    for (const m of ['alu', 'steel', 'poly', 'rubber', 'wood', 'paint', 'ceramic', 'brass', 'copper']) L[m] = '#808080';
    L.glass = '#808080';
  }

  // Measure first: a throwaway pass on a 1x1 context only records the extent
  // (cheap — no pixels are filled at real size), then the real pass paints
  // straight into a canvas exactly that big.
  let R = bounds;
  if (!R) {
    const probe = new Kit(makeCanvas(1, 1).g, L, null);
    paint(probe, probe.L);
    const e = probe.ext;
    if (!(e[2] > e[0])) e.splice(0, 4, -1, -1, 1, 1);
    const m = 1 / S;                                 // one device pixel of air
    R = [Math.floor((e[0] - m - BOX.x0) * S), Math.floor((e[1] - m - BOX.y0) * S),
         Math.ceil((e[2] + m - BOX.x0) * S), Math.ceil((e[3] + m - BOX.y0) * S)];
  }
  const cw = R[2] - R[0], ch = R[3] - R[1];
  const setup = (g) => { g.setTransform(S, 0, 0, S, -BOX.x0 * S - R[0], -BOX.y0 * S - R[1]); };

  const { cv, g } = makeCanvas(cw, ch);
  setup(g);
  const k = new Kit(g, L, null);
  paint(k, k.L);

  const sprite = {
    cv,
    ax: -BOX.x0 * S - R[0], ay: -BOX.y0 * S - R[1],
    s: 1 / S, w: cw / S, h: ch / S,
    rect: R,
    out: k.out,
  };

  // Debug aid for the workbench: paint once more on the full working canvas
  // and count opaque pixels the tracked crop would have cut off.
  if (check) {
    const full = makeCanvas(W, H);
    full.g.setTransform(S, 0, 0, S, -BOX.x0 * S, -BOX.y0 * S);
    const kk = new Kit(full.g, L, null); paint(kk, kk.L);
    const d = full.g.getImageData(0, 0, W, H).data;
    let lost = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (d[(y * W + x) * 4 + 3] > 24 && (x < R[0] || x >= R[2] || y < R[1] || y >= R[3])) lost++;
    }
    sprite.cropLoss = lost;
  }

  if (zones) {
    const zc = {};
    for (const z of ZONES) { const c = makeCanvas(cw, ch); setup(c.g); zc[z] = c; }
    const zk = new Kit(makeCanvas(1, 1).g, look, Object.fromEntries(ZONES.map((z) => [z, zc[z].g])));
    paint(zk, zk.L);
    sprite.zones = {};
    for (const z of ZONES) sprite.zones[z] = zc[z].cv;
  }
  return sprite;
}

export { shade, mix, withA, hexRgb };
