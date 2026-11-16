// Each operator's own face (docs §10.34). face() in realhead.js lays the skin, the
// profile's shape and the standard features; these painters replace the eye, the brow,
// the nose, the mouth, and add what is one face's alone (scars, freckles, sun spots).
// They paint in the standard head frame (facing +x, the eye at x 3.1..4.05, y -6.1..-6.5);
// F.B follows the face's warped shape, F.B0 does not.
import { crease, ell, noseStd, mouthStd } from './realhead.js';
import { rnd } from '../paint.js';

const f3 = (v) => Math.round(v * 1000) / 1000;
const rgba = (c, a) => `rgba(${c},${f3(a)})`;
// a point along a cubic
const bez = (P, t) => { const u = 1 - t; return [0, 1].map((k) => u * u * u * P[0][k] + 3 * u * u * t * P[1][k] + 3 * u * t * t * P[2][k] + t * t * t * P[3][k]); };

// An eye in profile, built from what makes one eye unlike another:
//   open: how far the lids part (1 the standard); low: the lower lid (less: raised, a squint)
//   droop: the outer corner dropped (a tired eye); hood: skin folding over the lid (0..1)
//   lid: the upper lid lowered over the iris; iris: its size, col its colour
//   crease: the lid crease's height above the lashes (0: none); lashes {n, len, w}; low lashes
//   bag: the pouch under the eye; under: a dark circle; crow: lines at the corner, crowL their length
//   socket: how deep the eye sits; glint: the catchlight's size
export function eyeOf(p = {}) {
  const op = p.open ?? 1, lo = p.low ?? 1, dr = p.droop ?? 0, hood = p.hood ?? 0, ir = p.iris ?? 1, lid = p.lid ?? 0;
  const y0 = -6.12, yk = y0 + dr;
  const EYE = `M 3.14 ${f3(yk)} C 3.38 ${f3(yk - 0.28 * op)} 3.7 ${f3(y0 - 0.36 * op)} 3.98 ${f3(y0 - 0.15 * op)} C 4.04 ${f3(y0 - 0.05 * op)} 4.02 ${f3(y0 + 0.06 * lo)} 3.95 ${f3(y0 + 0.1 * lo)} C 3.66 ${f3(y0 + 0.22 * lo)} 3.38 ${f3(yk + 0.18 * lo)} 3.14 ${f3(yk)} Z`;
  const LP = [[3.12, yk], [3.38, yk - 0.3 * op], [3.72, y0 - 0.38 * op], [4.0, y0 - 0.16 * op]];
  const LASH = `M ${LP.map((q, i) => (i === 1 ? 'C ' : '') + f3(q[0]) + ' ' + f3(q[1])).join(' ')}`;
  const above = (h, k = 1) => `M ${f3(LP[0][0] + 0.04)} ${f3(LP[0][1] - h * 0.8)} C ${f3(LP[1][0])} ${f3(LP[1][1] - h)} ${f3(LP[2][0])} ${f3(LP[2][1] - h)} ${f3(LP[3][0] + 0.1 * k)} ${f3(LP[3][1] - h * 0.75)}`;
  const lower = (h) => `M 3.24 ${f3(yk + 0.1 * lo + h)} C 3.5 ${f3(y0 + 0.22 * lo + h)} 3.76 ${f3(y0 + 0.22 * lo + h)} 3.98 ${f3(y0 + 0.11 * lo + h)}`;
  return (F) => {
    const { B, g, s, o, age } = F, cr = (d, w, a) => crease(g, d, w, a, s);
    B.dab(3.6, -6.2, 0.64, 0.36 + hood * 0.06, rgba(s.dark, p.socket ?? 0.4));
    // the white, dim; the iris behind the cornea, lit from below, its ring dark; the pupil
    B.fill(EYE, p.white ?? o.white ?? '#b4a89c', 0.02);
    B.inside(EYE, () => {
      B.dab(3.3, yk, 0.3, 0.18, rgba(s.shade, 0.6));
      const ix = 3.79 + (p.ix ?? 0), iy = -6.17 + (p.iy ?? 0), rx = 0.16 * ir, ry = 0.21 * ir;
      B.fill(ell(ix, iy, rx, ry), p.col ?? o.iris ?? '#6a4a34', 0.012);
      B.dab(ix + 0.02, iy + ry * 0.45, rx * 0.65, ry * 0.38, p.irisLit ?? 'rgba(255,236,210,0.22)');
      B.line(ell(ix, iy, rx, ry), 'rgba(14,9,7,0.75)', 0.028 * ir, 0.01);
      B.dab(ix + rx * 0.45, iy, 0.055 * ir, 0.075 * ir, '#121113');
      // the upper lid's shadow over the eyeball, deeper under a heavy lid
      B.fill(`M 3.08 ${f3(y0 - 0.7)} L 4.1 ${f3(y0 - 0.7)} L 4.1 ${f3(y0 - 0.16 * op + 0.02 + lid)} C 3.8 ${f3(y0 - 0.14 * op + lid)} 3.5 ${f3(y0 - 0.12 * op + lid)} 3.08 ${f3(yk + 0.02 + lid * 0.5)} Z`, rgba(s.shade, 0.55 + lid * 1.5), 0.03);
    });
    const gl = p.glint ?? 1;
    B.dab(3.9, -6.25 + (1 - op) * 0.08 + lid * 0.6, 0.04 * gl, 0.03 * gl, '#fff2e4', 0.95);
    if (p.glint2) B.dab(3.72, -6.04, 0.022 * gl, 0.016 * gl, 'rgba(255,240,226,0.6)');
    // the lid above the lashes in half light, its crease; or the brow's skin hanging over it
    if (hood > 0) {
      const H = above(0.05 + 0.12 * (1 - hood));
      B.fill(`${H} L 4.16 -6.9 L 3.0 -6.9 Z`, rgba(s.half, 0.22 * hood), 0.06);
      B.fill(`${LASH} L ${f3(LP[3][0] + 0.08)} ${f3(LP[3][1] - 0.1)} L 3.1 ${f3(yk - 0.1)} Z`, rgba(s.dark, 0.25 * hood), 0.03);
      B.line(H, rgba(s.dark, 0.6 * hood), 0.07, 0.03);
      g.save(); g.translate(0.01, -0.07); B.line(H, rgba(s.lit, 0.32 * hood), 0.09, 0.05); g.restore();
    } else {
      B.line(above(0.07), rgba(s.half, 0.45), 0.08, 0.05);
      if ((p.crease ?? 0.24) > 0) cr(above(p.crease ?? 0.24), 0.04, p.creaseA ?? 0.5);
    }
    // the lashes: the line along the lid, then the lashes themselves, curling up
    B.line(LASH, 'rgba(24,12,8,0.95)', p.lashW ?? 0.075, 0.025);
    if (p.lashes) {
      const { n, len, w = 0.022 } = p.lashes;
      for (let i = 0; i < n; i++) {
        const t = 0.4 + 0.6 * (i + 0.5) / n, [x, y] = bez(LP, t), a = -1.45 + t * 1.05, L = len * (0.65 + 0.35 * Math.sin(Math.PI * t));
        const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
        B.line(`M ${f3(x)} ${f3(y)} Q ${f3(x + Math.cos(a + 0.35) * L * 0.6)} ${f3(y + Math.sin(a + 0.35) * L * 0.6)} ${f3(ex)} ${f3(ey - L * 0.15)}`, 'rgba(20,10,6,0.75)', w, 0.008);
      }
      for (let i = 0; i < (p.lowLash ?? 0); i++) { const x = 3.62 + i * 0.1; B.line(`M ${f3(x)} ${f3(y0 + 0.16 * lo)} l 0.05 0.07`, 'rgba(20,10,6,0.5)', w * 0.7, 0.005); }
    } else if (o.lash) B.line(`M ${f3(LP[3][0] - 0.1)} ${f3(LP[3][1] - 0.02)} L ${f3(LP[3][0] + 0.12)} ${f3(LP[3][1] - 0.1)}`, 'rgba(24,12,8,0.9)', 0.05, 0.01);
    // the lower lid: its rim lit, the crease under it; the pouch, the dark under the eye
    B.line(lower(0), rgba(s.lit, 0.4), 0.04, 0.02);
    if (p.under) B.dab(3.6, -5.8, 0.5, 0.16, `rgba(80,56,76,${p.under})`);
    cr(lower(0.13), 0.035, 0.2 + age * 0.25 + (p.bag ?? 0) * 0.15);
    if (p.bag) {
      B.dab(3.62, -5.72, 0.46, 0.13, rgba(s.half, 0.26 * p.bag));
      cr(lower(0.3), 0.045, 0.34 * p.bag);
      B.dab(3.62, -5.8, 0.34, 0.06, rgba(s.lit, 0.22 * p.bag));
    }
    // crow's feet fanning back from the corner
    const nc = p.crow ?? 3, cl = p.crowL ?? 0.45;
    for (let i = 0; i < nc; i++) {
      const a = Math.PI + (i / Math.max(1, nc - 1) - 0.5) * 0.9 + 0.05, L = cl * (0.75 + 0.25 * Math.sin(i * 2.3 + 1));
      const d = `M 3.06 ${f3(yk + (i - (nc - 1) / 2) * 0.04)} q ${f3(Math.cos(a) * L * 0.5)} ${f3(Math.sin(a) * L * 0.5 - 0.02)} ${f3(Math.cos(a) * L)} ${f3(Math.sin(a) * L)}`, ca = ((p.crowA ?? 0.06) + age * 0.2);
      B.line(d, rgba(s.dark, ca), 0.04, 0.035);
      g.save(); g.translate(0.015, 0.035); B.line(d, rgba(s.pale, ca * 0.5), 0.035, 0.03); g.restore();
    }
  };
}

// A brow from the tail (x0, behind) to the head (x1, over the nose): a mass, then hairs
// growing up at its head and back along its tail.
//   col, w its thickness, tail the tail's share of it, arch, peak (0..1 where the arch is
//   highest), n hairs, salt [colour, share] grey among them, stray long hairs, gap [u0, u1]
//   where a scar has taken the hair
export function browOf(p) {
  return (F) => {
    const { g, SH } = F, B = F.B0;
    const x0 = p.x0 ?? 3.0, x1 = (p.x1 ?? 4.38) + SH.sh.brow * 0.12, y0 = p.y0 ?? -6.78, y1 = p.y1 ?? -6.88;
    const ar = p.arch ?? 0.05, q = Math.log(0.5) / Math.log(p.peak ?? 0.5), tl = p.tail ?? 0.45;
    const c = (u) => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u - ar * Math.sin(Math.PI * Math.pow(u, q))];
    const t = (u) => p.w * (tl + (1 - tl) * Math.pow(u, p.taper ?? 0.6)) * (u > 0.9 ? 0.55 + 0.45 * (1 - u) / 0.1 : 1) * (u < 0.06 ? 0.5 + u / 0.12 : 1);
    const [g0, g1] = p.gap ?? [2, 2];
    const segs = p.gap ? [[0, g0], [g1, 1]] : [[0, 1]];
    for (const [a, b] of segs) {
      const top = [], bot = [];
      for (let i = 0; i <= 14; i++) { const u = a + (b - a) * i / 14, [x, y] = c(u), h = t(u); top.push(`${f3(x)} ${f3(y - h * 0.55)}`); bot.unshift(`${f3(x)} ${f3(y + h * 0.45)}`); }
      const d = `M ${top.join(' L ')} L ${bot.join(' L ')} Z`;
      B.fill(d, p.col, p.w * 0.6, (p.a ?? 0.8) * 0.35);
      B.fill(d, p.col, p.w * 0.25, p.a ?? 0.8);
    }
    const [sc, ss] = p.salt ?? [null, 0];
    B.hairs(p.n ?? 60, p.seed ?? 9, (i, r) => {
      const u = r();
      if (u > g0 && u < g1) return null;
      // the hairs lie along the brow, back towards the tail, rising only at its head
      const [x, y] = c(u), h = t(u), a = -2.98 + u * 0.8 + (r() - 0.5) * 0.25, L = h * (0.45 + r() * 0.4);
      return [x - Math.cos(a) * L * 0.5, y + (r() - 0.5) * h * 0.7, a, L, r() < ss ? sc : p.col, p.hw ?? 0.022, 0.55];
    });
    if (p.lit) B.hairs(Math.round((p.n ?? 60) * 0.2), (p.seed ?? 9) + 1, (i, r) => { const u = r(); if (u > g0 && u < g1) return null; const [x, y] = c(u), h = t(u); return [x, y - h * 0.35, -2.95 + u * 0.7, h * 0.8, p.lit, 0.018, 0.45]; });
    if (p.stray) B.hairs(p.stray, (p.seed ?? 9) + 2, (i, r) => { const u = 0.15 + r() * 0.8, [x, y] = c(u), h = t(u); return [x, y - h * 0.3, -2.5 + (r() - 0.5) * 1.0, 0.1 + r() * 0.1, r() < ss ? sc : p.col, 0.018, 0.55]; });
  };
}

// freckles, sun spots: dabs scattered round a centre, thinning out from it
function spots(B, seed, n, cx, cy, rx, ry, col, size, skip) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()), x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
    if (skip && skip(x, y)) continue;
    const k = size * (0.5 + r()), al = 0.25 + r() * 0.35 * (1 - d * 0.5);
    B.dab(x, y, k, k * (0.8 + r() * 0.3), col.replace('A', f3(al)), 1, 'source-over', r() * 3);
  }
}
// thin broken veins
function veins(B, seed, n, cx, cy, rx, ry, col) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const x = cx + (r() - 0.5) * 2 * rx, y = cy + (r() - 0.5) * 2 * ry;
    B.line(`M ${f3(x)} ${f3(y)} l ${f3((r() - 0.5) * 0.16)} ${f3((r() - 0.5) * 0.1)} l ${f3((r() - 0.5) * 0.12)} ${f3((r() - 0.5) * 0.1)}`, col, 0.012, 0.004);
  }
}
// a scar: the pink of its edge, the pale raised line, its lit side
function scar(B, d, w, s) {
  B.line(d, 'rgba(190,96,92,0.26)', w * 2.2, w * 0.8);
  B.line(d, rgba(s.pale, 0.6), w, w * 0.35);
  B.line(d, 'rgba(255,248,240,0.35)', w * 0.35, 0.01);
}

// FLINT: deep-set, hooded, narrowed eyes; a thick low straight brow cut by an old
// burn; the bump of a break on the bridge; a thin set mouth, its corners down;
// hollow cheeks over a hard jaw.
const flint = {
  eye: eyeOf({ open: 0.8, low: 0.72, hood: 0.85, lid: 0.1, iris: 0.92, col: '#3e2618', irisLit: 'rgba(230,170,110,0.3)', socket: 0.58, crow: 3, crowL: 0.4, crowA: 0.08, glint: 0.9 }),
  brow: browOf({ col: '#140c08', x0: 2.94, x1: 4.42, y0: -6.72, y1: -6.82, arch: 0.02, w: 0.27, tail: 0.62, n: 110, gap: [0.43, 0.51], a: 0.88, seed: 31 }),
  nose(F) {
    noseStd(F);
    const { B, s } = F;
    // the old break: a knot on the bridge lit hard, its shadow under it, a sharp ridge
    B.line('M 4.28 -6.3 C 4.4 -6.12 4.5 -5.98 4.56 -5.86', rgba(s.pale, 0.7), 0.04, 0.01);
    B.dab(4.56, -5.86, 0.12, 0.09, rgba(s.pale, 0.55));
    B.dab(4.52, -5.6, 0.12, 0.18, rgba(s.half, 0.32), 1, 'source-over', -0.5);
  },
  mouth(F) {
    const { B, s, o } = F, L = o.lips;
    B.fill('M 4.58 -3.6 C 4.4 -3.58 4.2 -3.54 4.06 -3.48 L 4.42 -3.5 Z', rgba(L, 0.4), 0.03);
    B.line('M 4.44 -3.5 C 4.3 -3.49 4.14 -3.46 4.0 -3.4 C 3.96 -3.38 3.93 -3.35 3.91 -3.29', rgba(s.dark, 0.95), 0.06, 0.02);
    B.fill('M 4.46 -3.46 C 4.49 -3.38 4.47 -3.3 4.4 -3.26 C 4.28 -3.32 4.14 -3.37 4.04 -3.4 Z', rgba(L, 0.32), 0.03);
    B.dab(4.38, -3.34, 0.08, 0.035, rgba(s.pale, 0.45));
    F.cr('M 4.36 -3.1 C 4.22 -3.04 4.1 -3.03 3.98 -3.07', 0.05, 0.42);
    F.cr('M 3.91 -3.29 C 3.86 -3.2 3.85 -3.1 3.87 -3.0', 0.04, 0.3);
  },
  marks(F) {
    const { B, B0, s, de } = F;
    // the hollow under the cheekbone, the bone lit above it, the jaw muscle
    B.dab(2.9, -4.45, 0.95, 0.38, rgba(s.shade, 0.24), 1, 'source-over', -0.3);
    B.dab(3.0, -5.3, 0.85, 0.16, rgba(s.lit, 0.2), 1, 'source-over', -0.2);
    B.dab(1.5, -3.5, 0.35, 0.9, rgba(s.shade, 0.18));
    // the burn through the brow, down onto the lid; a nick on the chin
    scar(B0, `M ${f3(3.58 + de)} -7.08 C ${f3(3.6 + de)} -6.94 ${f3(3.63 + de)} -6.8 ${f3(3.68 + de)} -6.62`, 0.045, s);
    scar(B, 'M 4.24 -2.42 L 4.38 -2.28', 0.035, s);
  },
};

// WARDEN: tired eyes, their outer corners drooping, pouched under, lined at the
// corner; a heavy straight brow going grey; a big nose, its tip broad, red, veined;
// a deep fold to the mouth; an old burn on the cheek.
const warden = {
  eye: eyeOf({ open: 0.9, low: 1.05, droop: 0.1, hood: 0.45, lid: 0.05, iris: 0.95, col: '#56707e', irisLit: 'rgba(200,226,240,0.3)', bag: 0.85, under: 0.12, crow: 4, crowL: 0.5, crowA: 0.08 }),
  brow: browOf({ col: '#30241c', salt: ['#a49e96', 0.35], x0: 2.92, x1: 4.4, y0: -6.7, y1: -6.88, arch: 0.03, w: 0.25, tail: 0.55, n: 120, stray: 6, seed: 41 }),
  nose(F) {
    noseStd(F);
    const { B, s } = F;
    B.dab(5.06, -4.62, 0.44, 0.36, rgba(s.red, 0.32));
    B.dab(5.16, -4.72, 0.15, 0.11, rgba(s.pale, 0.55));
    veins(B, 43, 7, 4.85, -4.66, 0.3, 0.14, 'rgba(160,44,48,0.4)');
    spots(B, 44, 26, 4.9, -4.6, 0.36, 0.2, 'rgba(110,50,40,A)', 0.014);
  },
  mouth(F) {
    mouthStd(F);
    const { B, s, o } = F;
    B.fill('M 4.5 -3.44 C 4.56 -3.32 4.52 -3.16 4.42 -3.1 C 4.28 -3.18 4.12 -3.3 4.02 -3.38 Z', rgba(o.lips, 0.3), 0.04);
    F.cr('M 4.4 -3.02 C 4.26 -2.96 4.12 -2.96 4.0 -3.0', 0.045, 0.32);
    B.dab(4.4, -3.24, 0.09, 0.04, rgba(s.pale, 0.4));
  },
  marks(F) {
    const { B, s } = F;
    // the fold from the nose to the mouth, cut deep; the cheek reddened, veined
    F.cr('M 4.34 -4.9 C 4.04 -4.5 3.88 -4.0 3.88 -3.5', 0.08, 0.42);
    g_lit(B, 'M 4.4 -4.86 C 4.12 -4.48 3.98 -4.0 3.98 -3.52', s);
    B.dab(3.0, -4.95, 0.75, 0.42, rgba(s.red, 0.2));
    veins(B, 46, 6, 3.1, -5.0, 0.4, 0.2, 'rgba(170,56,56,0.3)');
    // the old burn high on the cheek: the shine of grafted skin, its ragged pink edge
    const BURN = 'M 2.0 -5.36 C 2.36 -5.52 2.82 -5.44 2.96 -5.18 C 3.04 -4.92 2.8 -4.66 2.44 -4.68 C 2.16 -4.72 1.92 -4.88 1.9 -5.08 C 1.9 -5.22 1.94 -5.3 2.0 -5.36 Z';
    B.fill(BURN, 'rgba(176,104,96,0.24)', 0.1);
    B.inside(BURN, () => { spots(B, 47, 14, 2.44, -5.04, 0.5, 0.3, 'rgba(150,80,74,A)', 0.07); B.dab(2.5, -5.12, 0.3, 0.1, 'rgba(255,236,226,0.22)'); });
  },
};
// the lit lip of a fold, beside it
function g_lit(B, d, s) { B.line(d, rgba(s.lit, 0.3), 0.08, 0.06); }

// VESPER: open almond eyes, a clear lid crease, lashes; a thin arched auburn brow;
// a short nose turned up at the tip; full lips with a sharp bow; freckles.
const vesper = {
  eye: eyeOf({ open: 1.1, low: 1.0, iris: 1.06, col: '#5c7a52', irisLit: 'rgba(214,236,180,0.32)', crease: 0.27, creaseA: 0.5, lashes: { n: 6, len: 0.15, w: 0.017 }, lashW: 0.09, lowLash: 2, under: 0.1, crow: 0, glint: 1.1 }),
  brow: browOf({ col: '#6a3a24', lit: 'rgba(196,120,80,0.8)', x0: 2.98, x1: 4.3, y0: -6.74, y1: -6.86, arch: 0.13, peak: 0.36, w: 0.14, tail: 0.35, n: 60, a: 0.75, seed: 51 }),
  nose(F) {
    noseStd(F);
    const { B, s } = F;
    B.dab(5.08, -4.68, 0.1, 0.08, rgba(s.pale, 0.55));
    B.dab(4.9, -4.5, 0.26, 0.16, rgba(s.red, 0.14));
  },
  mouth(F) {
    const { B, s, o } = F, L = o.lips;
    B.fill('M 4.72 -3.7 C 4.6 -3.73 4.46 -3.7 4.3 -3.64 C 4.18 -3.6 4.08 -3.55 4.0 -3.5 L 4.5 -3.47 Z', rgba(L, 0.85), 0.025);
    B.line('M 4.72 -3.71 C 4.6 -3.75 4.46 -3.72 4.3 -3.66', rgba(s.pale, 0.55), 0.03, 0.015);
    B.line('M 4.46 -3.49 C 4.3 -3.48 4.14 -3.46 3.98 -3.42', rgba(s.dark, 0.88), 0.05, 0.02);
    B.fill('M 4.54 -3.46 C 4.62 -3.32 4.57 -3.13 4.44 -3.05 C 4.28 -3.13 4.12 -3.27 4.0 -3.38 Z', rgba(L, 0.72), 0.035);
    B.dab(4.44, -3.24, 0.1, 0.05, rgba(s.pale, 0.7));
    B.dab(4.0, -3.44, 0.04, 0.04, rgba(s.dark, 0.45));
    F.cr('M 4.42 -2.98 C 4.3 -2.93 4.18 -2.93 4.08 -2.97', 0.04, 0.22);
  },
  marks(F) {
    const { B, s } = F;
    B.dab(3.3, -4.9, 0.7, 0.4, rgba(s.red, 0.13));
    const eye = (x, y) => ((x - 3.58) / 0.62) ** 2 + ((y + 6.2) / 0.3) ** 2 < 1;
    spots(B, 52, 70, 4.0, -5.3, 1.1, 0.55, 'rgba(150,76,44,A)', 0.035, eye);
    spots(B, 53, 30, 4.6, -5.4, 0.35, 0.5, 'rgba(150,76,44,A)', 0.03);
  },
};

// SKYE: big bright eyes, a high crease, long lashes, a strong catchlight; a dark
// brow, full at its head, arched; a small round nose, broad at the wings, a stud;
// full lips in a half smile; the sheen on her cheek; a little scar on the chin.
const skye = {
  eye: eyeOf({ open: 1.2, low: 1.0, iris: 1.2, col: '#26150c', irisLit: 'rgba(170,110,60,0.35)', white: '#b2a296', crease: 0.32, creaseA: 0.45, lashes: { n: 8, len: 0.2, w: 0.021 }, lashW: 0.1, lowLash: 3, crow: 0, socket: 0.3, glint: 1.5, glint2: true }),
  brow: browOf({ col: '#100806', x0: 2.96, x1: 4.34, y0: -6.76, y1: -6.86, arch: 0.1, peak: 0.4, w: 0.2, tail: 0.3, taper: 0.4, n: 85, a: 0.85, seed: 61 }),
  nose(F) {
    noseStd(F);
    const { B, s } = F;
    B.dab(5.16, -4.64, 0.13, 0.1, rgba(s.pale, 0.6));
    B.dab(4.6, -4.4, 0.22, 0.14, rgba(s.dark, 0.25));
    // the stud on the wing: steel, a glint
    B.fill(ell(4.64, -4.66, 0.062, 0.062), '#2a2c30', 0.004);
    B.fill(ell(4.64, -4.665, 0.048, 0.048), '#c4c8cc', 0.004);
    B.dab(4.625, -4.685, 0.018, 0.016, '#ffffff');
  },
  mouth(F) {
    const { B, s, o } = F, L = o.lips;
    B.fill('M 4.74 -3.72 C 4.58 -3.75 4.4 -3.71 4.24 -3.63 C 4.12 -3.6 4.04 -3.58 3.98 -3.56 L 4.5 -3.47 Z', rgba(L, 0.88), 0.025);
    B.line('M 4.74 -3.73 C 4.58 -3.77 4.42 -3.73 4.26 -3.65', rgba(s.lit, 0.5), 0.03, 0.015);
    B.line('M 4.46 -3.49 C 4.3 -3.49 4.12 -3.5 3.98 -3.56 C 3.94 -3.58 3.91 -3.62 3.9 -3.66', rgba(s.dark, 0.95), 0.05, 0.02);
    B.fill('M 4.55 -3.46 C 4.63 -3.3 4.59 -3.1 4.45 -3.02 C 4.27 -3.1 4.1 -3.26 3.98 -3.4 Z', rgba(L, 0.8), 0.035);
    B.dab(4.45, -3.22, 0.12, 0.05, rgba(s.pale, 0.8));
    F.cr('M 3.86 -3.78 C 3.79 -3.64 3.79 -3.48 3.84 -3.34', 0.05, 0.32);
  },
  marks(F) {
    const { B, s } = F;
    // the light on deep skin: the cheekbone, the round of the cheek, the forehead
    B.dab(3.3, -5.25, 0.62, 0.2, rgba(s.lit, 0.36), 1, 'source-over', -0.3);
    B.dab(3.5, -4.6, 0.55, 0.36, rgba(s.red, 0.2));
    B.dab(3.4, -4.75, 0.25, 0.1, rgba(s.pale, 0.22));
    B.dab(3.7, -7.7, 0.5, 0.22, rgba(s.lit, 0.25));
    scar(B, 'M 4.12 -2.5 L 4.24 -2.32', 0.03, s);
  },
};

// BULWARK: small eyes deep under a heavy hood, pouched, lined; a bushy grey brow
// with hairs every way; a big hooked nose, its tip bulbous and veined, an old
// scar over the bridge; sun spots, a red weathered cheek, the forehead lined deep.
const bulwark = {
  eye: eyeOf({ open: 0.7, low: 0.85, droop: 0.06, hood: 1.0, lid: 0.1, iris: 0.85, col: '#86a8c0', irisLit: 'rgba(220,240,255,0.35)', socket: 0.6, bag: 1.0, crow: 5, crowL: 0.55, crowA: 0.1, glint: 0.85 }),
  brow: browOf({ col: '#7c766e', salt: ['#d2ccc4', 0.45], lit: 'rgba(236,232,224,0.5)', x0: 2.9, x1: 4.46, y0: -6.72, y1: -6.86, arch: 0.05, w: 0.32, tail: 0.62, n: 160, stray: 12, hw: 0.034, a: 0.85, seed: 71 }),
  nose(F) {
    noseStd(F);
    const { B, s } = F;
    B.dab(5.04, -4.62, 0.5, 0.4, rgba(s.red, 0.36));
    B.dab(5.14, -4.74, 0.16, 0.12, rgba(s.pale, 0.5));
    veins(B, 72, 10, 4.85, -4.7, 0.36, 0.18, 'rgba(160,36,44,0.45)');
    spots(B, 73, 34, 4.9, -4.6, 0.4, 0.22, 'rgba(110,46,36,A)', 0.015);
    scar(B, 'M 4.22 -5.86 C 4.34 -5.94 4.46 -6.02 4.62 -6.08', 0.045, s);
  },
  mouth(F) {
    const { B, s, o } = F;
    B.line('M 4.44 -3.5 C 4.3 -3.49 4.14 -3.46 3.98 -3.4', rgba(s.dark, 0.9), 0.055, 0.02);
    B.fill('M 4.48 -3.46 C 4.52 -3.36 4.5 -3.26 4.42 -3.2 C 4.3 -3.27 4.16 -3.34 4.06 -3.4 Z', rgba(o.lips, 0.34), 0.04);
  },
  marks(F) {
    const { B, s, de } = F;
    B.dab(3.0, -5.05, 0.85, 0.48, rgba(s.red, 0.26));
    veins(B, 74, 8, 3.1, -5.0, 0.45, 0.22, 'rgba(170,50,52,0.32)');
    spots(B, 75, 18, 2.4, -7.0, 0.9, 0.45, 'rgba(120,70,40,A)', 0.06);
    spots(B, 76, 10, 2.4, -5.0, 0.7, 0.4, 'rgba(120,70,40,A)', 0.05);
    for (const y of [-7.2, -7.46]) F.cr(`M ${f3(2.9 + de)} ${y} C 3.3 ${y - 0.1} 3.7 ${y - 0.08} 4.1 ${y + 0.04}`, 0.045, 0.45);
  },
};

export const FACES = { flint, warden, vesper, skye, bulwark };
