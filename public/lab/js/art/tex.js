// KOR LAB — material textures for the painted look (docs §10.1).
//
// Each material is a small tiling grey image around mid grey, generated once
// and laid over a shape in 'overlay' so it lifts and sinks the paint without
// changing its colour: canvas weave, leather grain, wool nap, knit ribs,
// rubber, brushed steel, painted plate, skin. `texture(g, name, a)` covers the
// current clip; the texel is fixed in units so the grain keeps its size on
// every bone and at every bake scale.
import { canvas, rng } from './kit.js';

const N = 96;                 // tile size in texels
const UNIT = 0.11;            // texel size in figure units (per material below)
const SCALE = { wood: 0.12, concrete: 0.14, knit: 0.045, canvas: 0.055, leather: 0.09, wool: 0.08, rubber: 0.07, steel: 0.11, paint: 0.11, skin: 0.09, nylon: 0.06 };
const cache = new Map();

function grey(g, x, y, v, a = 1) { g.fillStyle = `rgba(${v},${v},${v},${a})`; g.fillRect(x, y, 1, 1); }

// value noise, tileable, for the softer materials
function vnoise(r, cells) {
  const v = Array.from({ length: cells * cells }, () => r());
  const at = (i, j) => v[((j % cells + cells) % cells) * cells + ((i % cells + cells) % cells)];
  return (x, y) => {
    const fx = (x / N) * cells, fy = (y / N) * cells, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, w = fy - j;
    const s = (t) => t * t * (3 - 2 * t), a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1);
    return a + (b - a) * s(u) + (c - a) * s(w) + (a - b - c + d) * s(u) * s(w);
  };
}

const MAKERS = {
  // plain weave: over-under squares and a little slub
  canvas(g, r) {
    const n = vnoise(r, 6);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const warp = ((x >> 1) + (y >> 1)) & 1, k = warp ? (x & 1 ? -14 : 10) : (y & 1 ? -14 : 10);
      grey(g, x, y, 128 + k + (n(x, y) - 0.5) * 30 + (r() - 0.5) * 16);
    }
  },
  // pebbled grain and a few creases
  leather(g, r) {
    const n = vnoise(r, 24), m = vnoise(r, 5);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) grey(g, x, y, 128 + (n(x, y) - 0.5) * 46 + (m(x, y) - 0.5) * 34 + (r() - 0.5) * 10);
    g.strokeStyle = 'rgba(70,70,70,0.5)'; g.lineWidth = 1;
    for (let i = 0; i < 7; i++) { const x = r() * N, y = r() * N; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + r() * 18 - 9, y + 6, x + r() * 26 - 13, y + 10 + r() * 10); g.stroke(); }
  },
  // felted wool: soft blotches and short fibres
  wool(g, r) {
    const n = vnoise(r, 12), m = vnoise(r, 4);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) grey(g, x, y, 128 + (n(x, y) - 0.5) * 30 + (m(x, y) - 0.5) * 26 + (r() - 0.5) * 22);
    for (let i = 0; i < 260; i++) { const x = r() * N, y = r() * N, a = r() * Math.PI; g.strokeStyle = r() < 0.5 ? 'rgba(190,190,190,0.35)' : 'rgba(60,60,60,0.3)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3); g.stroke(); }
  },
  // stocking stitch: columns of little Vs
  knit(g, r) {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const cx = x % 6, cy = (y + (cx < 3 ? cx : 5 - cx)) % 6;
      grey(g, x, y, 128 + (cy < 3 ? 22 : -22) + (cx === 0 || cx === 5 ? -26 : 0) + (r() - 0.5) * 14);
    }
  },
  // rubber: fine dull speckle
  rubber(g, r) {
    const n = vnoise(r, 16);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) grey(g, x, y, 128 + (n(x, y) - 0.5) * 18 + (r() - 0.5) * 14);
  },
  // steel: brushed along x, a few pits and scratches
  steel(g, r) {
    const rows = Array.from({ length: N }, () => (r() - 0.5) * 34);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) grey(g, x, y, 128 + rows[y] + (r() - 0.5) * 12);
    for (let i = 0; i < 30; i++) grey(g, (r() * N) | 0, (r() * N) | 0, 50, 0.8);
    g.strokeStyle = 'rgba(230,230,230,0.35)';
    for (let i = 0; i < 6; i++) { const x = r() * N, y = r() * N; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10 + r() * 20, y + (r() - 0.5) * 4); g.stroke(); }
  },
  // painted plate: orange peel, chips down to dark metal
  paint(g, r) {
    const n = vnoise(r, 20), m = vnoise(r, 6);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) grey(g, x, y, 128 + (n(x, y) - 0.5) * 16 + (m(x, y) - 0.5) * 30);
    for (let i = 0; i < 9; i++) { const x = r() * N, y = r() * N, s = 1 + r() * 3; g.fillStyle = 'rgba(40,40,40,0.55)'; g.beginPath(); g.ellipse(x, y, s * 1.4, s, r() * 3, 0, 7); g.fill(); g.fillStyle = 'rgba(220,220,220,0.35)'; g.fillRect(x - s, y - s - 1, s * 1.6, 1); }
  },
  // skin: very soft mottling and pores
  skin(g, r) {
    const n = vnoise(r, 8), m = vnoise(r, 30);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) grey(g, x, y, 128 + (n(x, y) - 0.5) * 18 + (m(x, y) - 0.5) * 10);
  },
  // sawn wood: long grain along x, a knot or two, dirt in the grain
  wood(g, r) {
    const rows = Array.from({ length: N }, () => (r() - 0.5) * 40), n = vnoise(r, 5);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) grey(g, x, y, 128 + rows[(y + Math.round(Math.sin(x * 0.07) * 3) + N) % N] * 0.8 + (n(x, y) - 0.5) * 24 + (r() - 0.5) * 8);
    for (let i = 0; i < 2; i++) { const x = r() * N, y = r() * N; g.strokeStyle = 'rgba(50,50,50,0.6)'; g.beginPath(); g.ellipse(x, y, 4, 1.6, 0, 0, 7); g.stroke(); g.beginPath(); g.ellipse(x, y, 7, 3, 0, 0, 7); g.stroke(); }
  },
  // concrete: aggregate speckle, pits, a stain
  concrete(g, r) {
    const n = vnoise(r, 7);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) grey(g, x, y, 128 + (n(x, y) - 0.5) * 26 + (r() - 0.5) * 30);
    for (let i = 0; i < 40; i++) grey(g, (r() * N) | 0, (r() * N) | 0, 60, 0.8);
  },
  // nylon ripstop: a fine grid
  nylon(g, r) {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) grey(g, x, y, 128 + ((x % 8 === 0 || y % 8 === 0) ? 16 : 0) + (r() - 0.5) * 10);
  },
};

function tile(name) {
  let c = cache.get(name);
  if (c) return c;
  c = canvas(N, N);
  const g = c.getContext('2d');
  MAKERS[name](g, rng(name.length * 977 + name.charCodeAt(0) * 13));
  cache.set(name, c);
  return c;
}

// Overlay `name` on whatever is clipped now. a: strength.
export function texture(g, name, a = 0.55) {
  if (!MAKERS[name]) return;
  const pat = g.createPattern(tile(name), 'repeat');
  pat.setTransform(new DOMMatrix().scale(SCALE[name] ?? UNIT));
  g.save();
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = a;
  g.fillStyle = pat; g.fillRect(-4000, -4000, 8000, 8000);
  g.restore();
}

export const TEXTURES = Object.keys(MAKERS);
