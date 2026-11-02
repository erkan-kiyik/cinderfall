// KOR — the operators' heads, painted from life (docs §10.24).
//
// Every head is built the way Gall's is: a real head in profile under the
// gear (skull, brow, nose, lips, chin, jaw, the ear set back), painted in
// planes first (the back of the skull and under the jaw in shade, the side
// in half light, the front in the street lamp), then the skin's colour in
// its zones, then pores and marks. The faces stay covered (§10.16), but the
// cloth over them is stretched over a real nose and chin, the goggles are
// the size real goggles are, and the skin that shows (an ear, a temple, a
// nape, a jaw) is painted as skin.
//
// Head frame: origin at the base of the neck, facing +x, y down; the crown
// at about y -10.7, the chin at about -1.7 (Gall's proportions).
import { Brush, rnd } from '../paint.js';
import { texture } from '../tex.js';

export const brushOf = (g) => { const T = g.getTransform(); return new Brush(g, Math.hypot(T.a, T.b)); };
export const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
// is (x, y) of this frame inside d, whatever transform the frame is under
export function inP(g, d, x, y) {
  const T = g.getTransform();
  return g.isPointInPath(new Path2D(d), T.a * x + T.c * y + T.e, T.b * x + T.d * y + T.f);
}

// A man's head in profile (Gall's): the skull, the brow, a straight nose, the
// lips, a hard chin, the jaw's angle under the ear.
export const PROFILE = 'M -2.8 -3.4 C -3.6 -4.2 -3.95 -5.4 -3.9 -6.6 C -3.85 -8.2 -3.0 -9.6 -1.5 -10.2 C 0.0 -10.7 1.9 -10.6 3.0 -9.9 C 3.8 -9.4 4.15 -8.6 4.2 -7.8 C 4.22 -7.3 4.3 -7.02 4.44 -6.84 C 4.46 -6.64 4.32 -6.52 4.22 -6.44 C 4.4 -6.12 4.56 -5.86 4.66 -5.66 C 4.86 -5.3 5.14 -4.98 5.32 -4.74 C 5.46 -4.52 5.4 -4.32 5.2 -4.28 C 4.98 -4.24 4.72 -4.24 4.5 -4.2 C 4.6 -4.02 4.66 -3.82 4.63 -3.63 C 4.55 -3.56 4.48 -3.53 4.44 -3.5 C 4.55 -3.42 4.58 -3.3 4.52 -3.18 C 4.38 -3.06 4.32 -2.96 4.36 -2.8 C 4.52 -2.58 4.62 -2.28 4.5 -2.02 C 4.3 -1.78 3.86 -1.68 3.3 -1.7 C 2.4 -1.78 1.4 -2.1 0.6 -2.6 C 0.1 -2.9 -0.3 -3.2 -0.6 -3.5 C -1.0 -3.1 -1.6 -2.9 -2.4 -2.9 C -2.6 -3.0 -2.7 -3.2 -2.8 -3.4 Z';
// a younger, finer head: a short nose turned up a little, full lips, a round chin
export const PROFILE_F = 'M -2.7 -3.5 C -3.5 -4.3 -3.85 -5.5 -3.8 -6.7 C -3.75 -8.3 -2.9 -9.6 -1.4 -10.2 C 0.1 -10.6 1.9 -10.5 2.95 -9.8 C 3.7 -9.3 4.05 -8.5 4.1 -7.7 C 4.12 -7.2 4.2 -6.96 4.3 -6.8 C 4.32 -6.62 4.22 -6.52 4.14 -6.44 C 4.3 -6.14 4.44 -5.9 4.56 -5.64 C 4.74 -5.3 4.96 -5.02 5.04 -4.8 C 5.1 -4.58 5.02 -4.42 4.82 -4.4 C 4.62 -4.38 4.46 -4.36 4.36 -4.3 C 4.46 -4.12 4.52 -3.9 4.5 -3.7 C 4.42 -3.6 4.36 -3.56 4.32 -3.52 C 4.44 -3.42 4.48 -3.28 4.42 -3.14 C 4.28 -3.02 4.2 -2.92 4.22 -2.76 C 4.34 -2.56 4.4 -2.3 4.28 -2.08 C 4.06 -1.86 3.66 -1.78 3.2 -1.8 C 2.3 -1.88 1.4 -2.2 0.6 -2.68 C 0.1 -2.96 -0.3 -3.26 -0.6 -3.56 C -1.0 -3.16 -1.6 -2.96 -2.3 -2.96 C -2.5 -3.06 -2.6 -3.26 -2.7 -3.5 Z';
// the ear, tilted back, at its place on PROFILE
export const EAR = 'M 0.05 -6.62 C 0.55 -6.58 0.72 -6.1 0.62 -5.55 C 0.56 -5.1 0.42 -4.72 0.3 -4.42 C 0.18 -4.22 -0.02 -4.18 -0.18 -4.28 C -0.42 -4.5 -0.62 -5.0 -0.78 -5.5 C -0.92 -5.95 -0.88 -6.36 -0.6 -6.56 C -0.42 -6.66 -0.2 -6.66 0.05 -6.62 Z';

// Skins: base, and the glazes laid over it (rgb triples).
export const SKINS = {
  // weathered light skin (Gall's)
  fair: { base: '#b48c76', shade: '64,38,30', half: '90,54,42', lit: '240,206,184', red: '196,90,74', yellow: '214,170,110', dark: '70,34,24', pale: '255,226,206', ear: '#9e7762' },
  // olive, outdoors (Flint)
  olive: { base: '#9a6e52', shade: '52,30,20', half: '78,46,32', lit: '226,180,148', red: '180,76,56', yellow: '196,150,96', dark: '60,30,20', pale: '246,212,186', ear: '#8a5e44' },
  // ruddy, wind-burnt (Bulwark)
  ruddy: { base: '#b07c64', shade: '66,34,26', half: '96,50,38', lit: '246,200,176', red: '204,82,64', yellow: '214,164,110', dark: '74,34,24', pale: '255,222,200', ear: '#a06650' },
  // deep brown (Skye)
  deep: { base: '#5e3a28', shade: '24,12,8', half: '40,22,14', lit: '170,118,86', red: '120,46,30', yellow: '150,100,60', dark: '22,10,6', pale: '200,150,116', ear: '#52321f' },
};

// The skin over a head shape d, in planes: shade behind and under the jaw, the
// side in half light, the front plane lit; the cheekbone, the jaw and the chin
// facing up; the colour in its zones; pores and mottling. o.stubble: the blue
// of a close shave (or a grey stubble, o.stubbleCol) over the jaw and lip.
export function skin(g, d, s, o = {}) {
  const B = brushOf(g), r = rnd(o.seed ?? 77);
  B.fill(d, s.base, 0.03);
  B.inside(d, () => {
    B.fill('M -5 -11 L 1.5 -11 C 1.0 -8.6 0.9 -6.0 1.3 -3.9 C 1.5 -3.0 1.7 -2.4 1.9 -1 L -5 -1 Z', `rgba(${s.shade},0.62)`, 0.55);
    B.fill('M -5 -11 L 2.4 -11 C 2.0 -8.6 1.9 -6.0 2.2 -3.9 C 2.4 -3.0 2.6 -2.4 2.8 -1 L -5 -1 Z', `rgba(${s.half},0.22)`, 0.5);
    B.fill('M 2.9 -9.2 C 3.7 -8.8 4.2 -8.0 4.4 -6.9 L 4.3 -6.4 L 5.2 -4.7 L 4.7 -3.6 L 4.7 -1.9 L 3.7 -1.8 C 3.4 -2.6 3.3 -3.5 3.2 -4.3 C 3.0 -5.3 2.7 -6.4 2.6 -7.6 C 2.6 -8.2 2.7 -8.8 2.9 -9.2 Z', `rgba(${s.lit},0.8)`, 0.24);
    B.fill('M 2.4 -5.75 C 2.9 -5.85 3.5 -5.85 4.0 -5.7 L 3.9 -5.36 C 3.4 -5.3 2.9 -5.34 2.4 -5.44 Z', `rgba(${s.lit},0.6)`, 0.12);
    B.line('M 0.4 -3.0 C 1.4 -2.5 2.6 -2.1 3.8 -2.0', `rgba(${s.lit},0.32)`, 0.16, 0.12);
    B.dab(4.35, -2.32, 0.32, 0.38, `rgba(${s.pale},0.45)`);
    B.fill('M 1.6 -5.0 C 2.3 -4.8 3.1 -4.7 3.8 -4.8 C 3.9 -4.4 3.8 -4.0 3.6 -3.8 C 2.9 -3.9 2.2 -4.1 1.5 -4.4 Z', `rgba(${s.dark},0.3)`, 0.22);
    B.dab(2.5, -7.0, 0.7, 0.5, `rgba(${s.dark},0.24)`);
    B.fill('M -0.8 -3.3 C 0.4 -2.7 1.8 -2.2 3.2 -2.05 C 3.8 -2.0 4.3 -2.1 4.6 -2.2 L 4.8 0 L -1 0 Z', `rgba(${s.shade},0.7)`, 0.12);
    B.dab(3.6, -8.4, 1.1, 0.7, `rgba(${s.yellow},0.2)`);
    B.dab(5.0, -4.7, 0.45, 0.4, `rgba(${s.red},0.24)`);
    B.dab(3.0, -5.0, 1.0, 0.6, `rgba(${s.red},0.16)`);
    if (o.stubble) B.fill('M 1.0 -4.6 C 2.0 -4.3 3.2 -4.0 4.1 -4.05 C 4.5 -3.9 4.6 -3.4 4.55 -2.6 C 4.5 -2.1 4.2 -1.8 3.6 -1.75 C 2.4 -1.9 1.2 -2.3 0.3 -2.9 Z', o.stubbleCol ?? 'rgba(84,96,110,0.22)', 0.25);
    const MOT = [s.red, s.yellow, s.dark, s.pale];
    for (let i = 0; i < 120; i++) { const x = 0.6 + r() * 4.4, y = -9.4 + r() * 7.4, rr = 0.06 + r() * 0.2; B.dab(x, y, rr, rr * (0.6 + r() * 0.5), `rgba(${MOT[(r() * MOT.length) | 0]},${0.04 + r() * 0.06})`, 1, 'source-over', r() * 3); }
    for (let i = 0; i < 220; i++) { const x = 0.8 + r() * 4.0, y = -9.2 + r() * 7.0; B.dab(x, y, 0.012 + r() * 0.02, 0.01 + r() * 0.016, r() < 0.6 ? `rgba(${s.dark},0.2)` : `rgba(${s.pale},0.14)`); }
    texture(g, 'skin', 0.4, 0.9);
    // the street's cold on the back of the skull and the nape
    B.line('M -3.7 -7.6 C -3.95 -6.4 -3.75 -5.0 -3.1 -3.9', 'rgba(140,160,186,0.3)', 0.16, 0.14);
  });
}

// The ear on PROFILE: helix rolled and lit along its top, the antihelix, the
// concha's hollow, the tragus, the lobe red where the light comes through.
export function ear(g, s, d = EAR) {
  const B = brushOf(g);
  B.fill(d, s.ear, 0.02);
  B.inside(d, () => {
    B.dab(0.1, -6.1, 0.6, 0.45, `rgba(${s.lit},0.4)`);
    B.dab(-0.5, -5.2, 0.4, 0.9, `rgba(${s.dark},0.35)`);
    B.line('M 0.42 -6.44 C 0.02 -6.58 -0.44 -6.5 -0.64 -6.18 C -0.76 -5.8 -0.66 -5.24 -0.46 -4.8', `rgba(${s.dark},0.45)`, 0.1, 0.06);
    B.line('M 0.4 -6.52 C 0.0 -6.64 -0.44 -6.56 -0.66 -6.24', `rgba(${s.pale},0.5)`, 0.06, 0.04);
    B.line('M 0.3 -6.16 C 0.0 -6.22 -0.3 -6.1 -0.38 -5.82 C -0.42 -5.5 -0.3 -5.2 -0.16 -5.0', `rgba(${s.lit},0.4)`, 0.07, 0.04);
    B.line('M 0.22 -6.04 C -0.04 -6.06 -0.24 -5.94 -0.28 -5.7', `rgba(${s.dark},0.4)`, 0.04, 0.03);
    B.fill('M 0.38 -5.62 C 0.5 -5.44 0.48 -5.1 0.34 -4.9 C 0.18 -4.88 0.06 -5.02 0.04 -5.28 C 0.04 -5.46 0.16 -5.6 0.38 -5.62 Z', `rgba(${s.dark},0.55)`, 0.05);
    B.dab(0.54, -5.16, 0.08, 0.14, `rgba(${s.lit},0.55)`);
    B.dab(0.02, -4.42, 0.2, 0.16, `rgba(${s.red},0.35)`);
    texture(g, 'skin', 0.25, 0.9);
  });
  // its shadow on the side of the head
  B.line('M 0.7 -6.2 C 0.8 -5.5 0.62 -4.8 0.36 -4.36', `rgba(${s.shade},0.3)`, 0.12, 0.1);
}

// Close-cropped hair over a region d: a dark mass, lit on top, and short
// strands combed back (angle a), salt mixed in for grey; `head` keeps the
// hairline's soft edge on the skin.
export function crop(g, d, o) {
  const B = brushOf(g), { col, lit, seed = 5, n = 900, a = Math.PI * 0.6, salt = 0 } = o;
  B.fill(d, col, 0.04);
  B.inside(d, () => { B.dab(1.0, -8.0, 2.4, 1.2, lit, 0.5); B.dab(-2.8, -5.4, 1.5, 2.2, 'rgba(0,0,0,0.4)'); texture(g, 'wool', 0.2, 0.4); });
  B.hairs(n, seed, (i, r) => {
    const x = -4.2 + r() * 7.4, y = -10.6 + r() * 8.6;
    if (!inP(g, d, x, y)) return null;
    const grey = r() < salt, l = r();
    const c = grey ? `rgba(${170 + l * 50 | 0},${166 + l * 50 | 0},${160 + l * 50 | 0},1)` : l < 0.3 ? lit : col;
    return [x, y, a + (r() - 0.5) * 0.5, 0.06 + r() * 0.12, c, 0.018, grey ? 0.4 : 0.45];
  });
}

// Knit over a shape: rows (or ribs) of loops, each a soft dark trough with
// the light on the loop above it, following `dir` (rows: horizontal-ish).
export function knit(g, d, t, o = {}) {
  const B = brushOf(g), step = o.step ?? 0.34, ribs = o.ribs ?? false, [x0, y0, x1, y1] = o.box ?? [-6, -13, 7, 2];
  B.inside(d, () => {
    if (ribs) {
      const lean = o.lean ?? 0;
      for (let x = x0; x < x1; x += step) { B.line(`M ${x} ${y0} L ${x + lean} ${y1}`, t.k, step * 0.36, step * 0.12, 0.55); B.line(`M ${x + step * 0.42} ${y0} L ${x + step * 0.42 + lean} ${y1}`, t.l, step * 0.22, step * 0.1, 0.35); }
    } else {
      const bend = o.bend ?? 0.6;
      for (let y = y0; y < y1; y += step) { B.line(`M ${x0} ${y + bend} Q ${(x0 + x1) / 2} ${y - bend} ${x1} ${y + bend}`, t.k, step * 0.3, step * 0.12, 0.5); B.line(`M ${x0} ${y + bend - step * 0.4} Q ${(x0 + x1) / 2} ${y - bend - step * 0.4} ${x1} ${y + bend - step * 0.4}`, t.l, step * 0.18, step * 0.1, 0.3); }
    }
    texture(g, 'knit', o.ta ?? 0.4, o.tk ?? 0.4);
  });
}

// A strap of width w along d: its body, a dark lower edge, a lit upper edge.
export function strap(g, d, w, c, k, l) {
  const B = brushOf(g);
  B.line(d, k, w + 0.08, 0.02);
  B.line(d, c, w, 0.02);
  g.save(); g.translate(0, -w * 0.3); B.line(d, l, w * 0.25, 0.03, 0.7); g.restore();
}

// Glass: a lens of shape d with the night in it: the sky dark at the top, a
// band of the street's light across it, the warm fire low, one hard glint.
export function glass(g, d, [x0, y0, x1, y1], o = {}) {
  const B = brushOf(g), tint = o.tint ?? ['#0f2a1d', '#2a5a44', '#c87838'];
  B.fill(d, tint[0], 0.01);
  B.inside(d, () => {
    const gr = g.createLinearGradient(x0, y0, x1 * 0.4 + x0 * 0.6, y1);
    gr.addColorStop(0, tint[1]); gr.addColorStop(0.5, tint[0]); gr.addColorStop(1, tint[2]);
    g.globalAlpha = o.a ?? 0.75; g.fillStyle = gr; g.fill(new Path2D(d)); g.globalAlpha = 1;
    const w = x1 - x0, h = y1 - y0;
    B.fill(`M ${x0 + w * 0.15} ${y0 - h} L ${x0 + w * 0.42} ${y0 - h} L ${x0 + w * 0.2} ${y1 + h} L ${x0 - w * 0.07} ${y1 + h} Z`, o.band ?? 'rgba(220,240,250,0.22)', w * 0.05);
    B.dab(x0 + w * 0.3, y0 + h * 0.25, w * 0.08, h * 0.08, 'rgba(255,255,255,0.9)');
    B.dab(x0 + w * 0.75, y1 - h * 0.2, w * 0.25, h * 0.1, o.fire ?? 'rgba(255,150,70,0.4)');
  });
}

// A skin crease: a dark line, the edge under it catching the light from above.
export function crease(g, d, w = 0.06, a = 0.5, s = SKINS.fair) {
  const B = brushOf(g);
  B.line(d, `rgba(${s.dark},${a})`, w, w * 0.6);
  g.save(); g.translate(0.02, 0.04); B.line(d, `rgba(${s.pale},${a * 0.45})`, w * 0.8, w * 0.6); g.restore();
}

// A face in profile, painted the way Gall's is (docs §10.25): the skin in planes and
// zones (skin()), then the nose (the bridge in the lamp, the side plane in half light,
// the tip round and lit, the wing and its groove, the nostril, the shadow it throws),
// the folds from the nose to the mouth, the lips, the eye deep under the brow (the white
// dim, the iris a sliver behind the cornea, the lid heavy over it, one glint), the
// brow, the ear; age in the folds and round the eye; stubble.
//   o.prof 'm' (PROFILE) | 'f' (PROFILE_F); o.s a skin of SKINS; o.age 0..1;
//   o.iris eye colour; o.brow [colour, lift, thickness]; o.lips rgb of the lips;
//   o.stubble { col, n } hairs over the jaw and lip; o.lash (a darker, thicker lid)
export function face(g, o) {
  const f = o.prof === 'f', P = f ? PROFILE_F : PROFILE, s = o.s, B = brushOf(g), age = o.age ?? 0.3;
  const cr = (d, w, a) => crease(g, d, w, a, s);
  skin(g, P, s, { seed: o.seed ?? 77, stubble: !!o.shave, stubbleCol: o.shave });
  // the nose, its features at their place on the profile
  const dn = f ? -0.27 : 0, dm = f ? -0.13 : 0, de = f ? -0.08 : 0;
  B.inside(P, () => {
    g.save(); g.translate(dn, f ? -0.05 : 0);
    B.fill('M 4.2 -6.3 C 4.5 -5.8 4.9 -5.2 5.2 -4.82 L 4.5 -4.56 C 4.3 -5.1 4.06 -5.6 3.9 -6.0 Z', `rgba(${s.half},0.35)`, 0.1);
    B.line('M 4.32 -6.32 C 4.48 -6.04 4.6 -5.82 4.68 -5.66 C 4.86 -5.34 5.1 -5.04 5.28 -4.8', `rgba(${s.pale},0.75)`, 0.1, 0.05);
    B.dab(4.62, -5.7, 0.1, 0.16, `rgba(${s.pale},0.5)`, 1, 'source-over', -0.5);
    B.dab(5.24, -4.58, 0.18, 0.15, `rgba(${s.pale},0.7)`);
    B.dab(5.1, -4.48, 0.32, 0.22, `rgba(${s.red},0.3)`);
    B.dab(4.62, -4.56, 0.3, 0.22, `rgba(${s.lit},0.45)`);
    B.line('M 4.42 -4.86 C 4.26 -4.7 4.26 -4.44 4.42 -4.34 C 4.56 -4.28 4.7 -4.28 4.82 -4.3', `rgba(${s.dark},0.65)`, 0.07, 0.04);
    B.line('M 4.84 -4.33 C 4.98 -4.35 5.1 -4.34 5.2 -4.31', `rgba(${s.shade},0.85)`, 0.06, 0.03);
    B.fill('M 4.36 -4.24 C 4.58 -4.2 4.7 -4.12 4.7 -4.0 C 4.54 -3.98 4.36 -4.04 4.24 -4.12 Z', `rgba(${s.dark},0.5)`, 0.06);
    g.restore();
    g.save(); g.translate(dm, 0);
    // the fold from the nose to the mouth, the line from the mouth's corner, deeper with age
    cr('M 4.3 -4.82 C 4.06 -4.5 3.96 -4.1 4.0 -3.66', 0.07, 0.25 + age * 0.4);
    if (age > 0.35) cr('M 3.98 -3.4 C 3.94 -3.1 3.92 -2.85 3.98 -2.6', 0.05, age * 0.4);
    cr('M 2.6 -2.55 C 3.0 -2.4 3.4 -2.36 3.7 -2.4', 0.05, 0.15 + age * 0.15);
    // the mouth: the upper lip in shade, the line where they meet, the lower lip lit
    const L = o.lips ?? s.red;
    B.fill(f ? 'M 4.66 -3.66 C 4.44 -3.66 4.2 -3.6 4.02 -3.5 L 4.5 -3.47 Z' : 'M 4.6 -3.63 C 4.4 -3.6 4.2 -3.56 4.04 -3.5 L 4.42 -3.5 Z', `rgba(${L},${f ? 0.75 : 0.55})`, 0.03);
    B.line('M 4.43 -3.5 C 4.3 -3.49 4.15 -3.47 4.0 -3.42', `rgba(${s.shade},0.92)`, 0.055, 0.02);
    B.fill(f ? 'M 4.5 -3.46 C 4.56 -3.32 4.52 -3.16 4.42 -3.08 C 4.28 -3.18 4.12 -3.3 4.02 -3.38 Z' : 'M 4.48 -3.46 C 4.52 -3.36 4.5 -3.24 4.42 -3.18 C 4.3 -3.26 4.16 -3.34 4.06 -3.4 Z', `rgba(${L},${f ? 0.6 : 0.42})`, 0.04);
    B.dab(4.4, -3.28, 0.1, 0.05, `rgba(${s.pale},0.6)`);
    g.restore();
    // age: lines across the forehead, the bag under the eye
    if (age > 0.4) for (const y of [-8.6, -8.15]) cr(`M ${3.0 + de} ${y} C 3.4 ${y - 0.08} 3.8 ${y - 0.06} 4.1 ${y + 0.04}`, 0.035, (age - 0.4) * 0.6);
  });
  // stubble: short dark points over the jaw, the lip and the throat
  if (o.stubble) B.hairs(o.stubble.n ?? 900, (o.seed ?? 77) + 3, (i, r) => {
    const x = 0.4 + r() * 4.4, y = -4.6 + r() * 3.2;
    if (!inP(g, P, x, y)) return null;
    if (y < -4.0 && x > 4.0 + dm && x < 4.5) return null;
    if (x > 4.0 && y > -3.66 && y < -3.1) return null;
    return [x, y, Math.PI * 0.6 + (r() - 0.5) * 0.8, 0.04 + r() * 0.05, o.stubble.col, 0.018, 0.5];
  });
  ear(g, s);
  // the eye, deep under the brow
  g.save(); g.translate(de, 0);
  const EYE = 'M 3.14 -6.12 C 3.38 -6.4 3.7 -6.48 3.98 -6.27 C 4.04 -6.17 4.02 -6.06 3.95 -6.02 C 3.66 -5.9 3.38 -5.94 3.14 -6.12 Z';
  B.dab(3.6, -6.2, 0.62, 0.36, `rgba(${s.dark},0.4)`);
  B.fill(EYE, o.white ?? '#b4a89c', 0.02);
  B.inside(EYE, () => {
    B.dab(3.3, -6.12, 0.3, 0.18, `rgba(${s.shade},0.6)`);
    B.fill('M 3.68 -6.38 C 3.86 -6.36 3.96 -6.22 3.94 -6.06 C 3.86 -5.98 3.74 -5.97 3.66 -6.03 C 3.58 -6.14 3.58 -6.3 3.68 -6.38 Z', o.iris ?? '#6a4a34', 0.01);
    B.line('M 3.68 -6.38 C 3.58 -6.3 3.58 -6.14 3.66 -6.03', 'rgba(20,14,12,0.8)', 0.03, 0.01);
    B.dab(3.84, -6.2, 0.055, 0.07, '#141315');
    B.fill('M 3.1 -6.56 L 4.05 -6.56 L 4.05 -6.28 C 3.8 -6.26 3.5 -6.24 3.1 -6.1 Z', `rgba(${s.shade},0.55)`, 0.03);
  });
  B.dab(3.9, -6.25, 0.04, 0.03, '#fff2e4', 0.95);
  B.line('M 3.12 -6.12 C 3.38 -6.42 3.72 -6.5 4.0 -6.28', 'rgba(24,12,8,0.95)', o.lash ? 0.11 : 0.075, 0.025);
  if (o.lash) B.line('M 3.9 -6.3 L 4.12 -6.38', 'rgba(24,12,8,0.9)', 0.05, 0.01);
  B.line('M 3.2 -6.28 C 3.46 -6.52 3.76 -6.56 4.06 -6.4', `rgba(${s.half},0.45)`, 0.07, 0.05);
  crease(g, 'M 3.18 -6.4 C 3.46 -6.66 3.8 -6.68 4.1 -6.52', 0.04, 0.5, s);
  B.line('M 3.26 -6.0 C 3.5 -5.9 3.74 -5.9 3.94 -6.0', `rgba(${s.lit},0.4)`, 0.04, 0.02);
  crease(g, 'M 3.24 -5.86 C 3.5 -5.72 3.78 -5.74 3.98 -5.86', 0.035, 0.2 + age * 0.25, s);
  for (const [dy, l] of [[-0.12, 0.42], [0.02, 0.5], [0.15, 0.38]]) crease(g, `M 3.08 ${-6.12 + dy * 0.4} l ${-l} ${dy * 0.6}`, 0.025, 0.08 + age * 0.35, s);
  const [bc, bl, bt] = o.brow ?? ['#3a2a20', 0.06, 1];
  g.save(); g.translate(0, -0.02); g.scale(1, bt);
  softBrowR(g, 3.0, -6.78 / bt, 4.38, -6.88 / bt, bl, bc, (o.seed ?? 7) + 9);
  g.restore();
  g.restore();
}

// a brow: a soft mass and short hairs along it, lighter where it thins out
function softBrowR(g, x0, y0, x1, y1, lift, col, seed) {
  const B = brushOf(g), w = x1 - x0;
  const mid = (u) => [x0 + u * w, y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * lift];
  const [mx, my] = mid(0.5);
  B.line(`M ${x0} ${y0} Q ${mx} ${my - lift} ${x1} ${y1}`, col, w * 0.14, w * 0.05, 0.75);
  B.hairs(Math.round(w * 34), seed, (i, r) => { const u = r(), [x, y] = mid(u); return [x, y + (r() - 0.5) * w * 0.08, -0.35 - r() * 0.4, w * (0.08 + r() * 0.08), col, w * 0.025, 0.6 * (1 - u * 0.4)]; });
}
