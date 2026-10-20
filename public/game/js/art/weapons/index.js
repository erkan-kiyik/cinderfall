// KOR — weapon painters (docs §10.13).
//
// Weapon space: origin at the trigger hand (gripA), +x toward the muzzle,
// +y down, same units as characters (64 = a person). We see the gun's right
// side, the side its ejection port is on. Each weapon also names the points
// the rig needs: gripB (support hand), muzzle, eject, mag, stock.
//
// Real materials, no glow: phosphated steel, anodised aluminium, black
// polymer, walnut; captured guns in tan or olive furniture. The crew's mark
// is a strip of faded cloth tape, not a colour. A material set passed in as
// `m` restyles a gun: Vanta's issue is new, blue-black and stencilled.
import { cel, fill, stroke, clip } from '../kit.js';
import { M, tone, mat } from '../style.js';

const rr = (x0, y0, x1, y1, r) => `M ${x0 + r} ${y0} L ${x1 - r} ${y0} Q ${x1} ${y0} ${x1} ${y0 + r} L ${x1} ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} L ${x0 + r} ${y1} Q ${x0} ${y1} ${x0} ${y1 - r} L ${x0} ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} Z`;
// the same, wound the other way: added to a path it cuts a hole
const rrR = (x0, y0, x1, y1, r) => `M ${x0 + r} ${y0} Q ${x0} ${y0} ${x0} ${y0 + r} L ${x0} ${y1 - r} Q ${x0} ${y1} ${x0 + r} ${y1} L ${x1 - r} ${y1} Q ${x1} ${y1} ${x1} ${y1 - r} L ${x1} ${y0 + r} Q ${x1} ${y0} ${x1 - r} ${y0} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const dot = (x, y, r) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
const dotR = (x, y, r) => `M ${x - r} ${y} a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 ${-2 * r} 0 Z`;

export const MAT = {
  // anodised aluminium receivers: a warm dark grey that wears bright at the edges
  metal: mat(tone('#77797e', '#47494e', '#2d2e32', '#111214'), 'steel', 0.3),
  // phosphated / blued steel: barrels, bolts, sights, small parts
  steel: mat(tone('#686a6f', '#3a3c41', '#25262a', '#0b0b0d'), 'steel', 0.34),
  // the same steel where it is a gun's frame or slide (a finish coats these)
  frame: mat(tone('#686a6f', '#3a3c41', '#25262a', '#0b0b0d'), 'steel', 0.34),
  // bead-blasted stainless (the heavy pistol)
  stainless: mat(tone('#959694', '#626462', '#434544', '#1b1c1c'), 'steel', 0.4),
  // polymer furniture, near black and a little warm
  poly: mat(tone('#524f4b', '#32302d', '#211f1d', '#0c0b0a'), 'rubber', 0.3),
  dark: tone('#404145', '#28292c', '#191a1c', '#09090a'),
  wood: mat(tone('#a06e46', '#70462a', '#4a2c18', '#21120a'), 'wood', 0.8),
  tan: mat(tone('#b5a27f', '#8a785a', '#625440', '#2c251a'), 'rubber', 0.3),
  olive: mat(tone('#7c7e5f', '#585a40', '#3d3f2b', '#1a1b12'), 'rubber', 0.3),
  // the crew's mark: cloth tape gone the colour of rust, and paracord
  tape: mat(tone('#a46c56', '#7a4b39', '#533125', '#25140d'), 'canvas', 0.65),
  cord: tone('#8d806c', '#685b49', '#473d30', '#1f1a14'),
  glass: M.lens,
  shell: tone('#c25a4e', '#93332a', '#64201a', '#2e0d0a'),
  brass: M.brass,
  // white stencil on a Vanta gun (null: none)
  serial: null,
};
// older callers (items) still ask for an accent
MAT.accent = MAT.tape;

// The primer a finish is laid over (docs §10.13): every coated part (frames,
// slides, receivers, furniture, even a walnut stock) in a pale neutral grey
// that the finish's colour multiplies; barrels, bolts, pins, sights and glass
// keep their own steel. A finished gun carries no crew tape.
const PR = mat(tone('#ebe9e5', '#bdbbb6', '#8a8883', '#3c3b39'), 'paint', 0.22);
const PRF = mat(tone('#dcdad6', '#abaaa5', '#7b7975', '#353432'), 'rubber', 0.3);
export const PRIMER = {
  ...MAT, metal: PR, frame: PR, stainless: PR, poly: PRF, tan: PRF, olive: PRF,
  wood: mat(tone('#e0d9cf', '#b0a99e', '#7f786e', '#38342f'), 'wood', 0.55), tape: null,
};

// Shared parts ---------------------------------------------------------------
function pin(g, t, x, y, r = 0.24) {
  fill(g, dot(x, y, r + 0.07), t.k, 0.6);
  fill(g, dot(x, y, r), t.d);
  fill(g, dot(x - r * 0.25, y - r * 0.3, r * 0.5), t.l, 0.7);
}
function screw(g, t, x, y, r = 0.28, a = 0.7) {
  pin(g, t, x, y, r);
  const c = Math.cos(a) * r * 0.8, s = Math.sin(a) * r * 0.8;
  stroke(g, `M ${x - c} ${y - s} L ${x + c} ${y + s}`, t.k, 0.1);
}
// a cut into a surface lit from above: its top wall in shadow, the floor's
// lower lip catching the light
function recess(g, d, t, depth = 0.2, a = 0.92) {
  fill(g, d, t.d);
  clip(g, d, () => { g.save(); g.translate(0, -depth); fill(g, d, t.k, a); g.restore(); });
}
// a shallow moulded panel in a stock: a little darker, its top edge in shade,
// its lower edge catching the light
function panel(g, d, t) {
  fill(g, d, t.d, 0.45);
  clip(g, d, () => { g.save(); g.translate(0, -0.22); fill(g, d, t.k, 0.35); g.restore(); g.save(); g.translate(0, 0.3); fill(g, d, t.m, 0.25); g.restore(); });
}
// lettering cut or printed on a part: drawn from a full-size face scaled down,
// so it keeps its spacing at a fraction of a unit
function letter(g, txt, x, y, size, c, a = 0.7, w = 600) {
  g.save(); g.translate(x, y); g.scale(size / 20, size / 20);
  g.font = `${w} 20px Rajdhani`; g.fillStyle = c; g.globalAlpha = a; g.fillText(txt, 0, 0);
  g.restore();
}
// a lit edge (top of a flat) and a dark one (its underside)
const lit = (g, x0, x1, y, t, w = 0.12, a = 0.6) => stroke(g, `M ${x0} ${y} L ${x1} ${y}`, t.l, w, a);
const shade = (g, x0, x1, y, t, w = 0.14, a = 0.7) => stroke(g, `M ${x0} ${y} L ${x1} ${y}`, t.k, w, a);
// slanted grip grooves on a slide or a knob
function serrate(g, t, x0, x1, y0, y1, step = 0.42, lean = 0.18) {
  for (let x = x0; x < x1; x += step) {
    stroke(g, `M ${x + lean} ${y0} L ${x} ${y1}`, t.k, step * 0.42, 0.85);
    stroke(g, `M ${x + lean + step * 0.32} ${y0} L ${x + step * 0.32} ${y1}`, t.l, step * 0.14, 0.45);
  }
}
// picatinny rail sitting on y (its base), teeth upward
function rail(g, t, x0, x1, y) {
  cel(g, rr(x0, y - 0.42, x1, y + 0.02, 0.06), t, { sh: 0.15, hl: 0.1, ao: 0.35 });
  for (let x = x0 + 0.18; x < x1 - 0.36; x += 0.74) cel(g, rr(x, y - 0.82, x + 0.44, y - 0.34, 0.05), t, { sh: 0.12, hl: 0.12, ao: 0.3 });
}
// M-LOK style slots along a handguard
function slots(g, t, x0, x1, y0, y1, step, w) {
  for (let x = x0; x + w <= x1 + 0.01; x += step) recess(g, rr(x, y0, x + w, y1, Math.min(0.35, (y1 - y0) / 2)), t, 0.16);
}
// a pistol grip hanging from (x, y), raked back by ang: finger swells on the
// front, a palm swell behind, a flared base, a stippled panel
function grip(g, t, x, y, L, w, ang, o = {}) {
  g.save(); g.translate(x, y); g.rotate(ang);
  const f = w / 2, b = -w / 2, sw = o.swell ?? 0.3;
  const d = o.plain
    ? `M ${b + 0.1} 0 L ${f} 0 C ${f + 0.12} ${L * 0.4} ${f + 0.18} ${L * 0.8} ${f + 0.28} ${L - 0.25} Q ${f + 0.3} ${L} ${f - 0.1} ${L} L ${b + 0.2} ${L} Q ${b - 0.2} ${L} ${b - 0.15} ${L - 0.35} C ${b - 0.05} ${L * 0.6} ${b - 0.12} ${L * 0.3} ${b - 0.02} ${0.2} Z`
    : `M ${b + 0.1} 0 L ${f} 0 C ${f + 0.05} ${L * 0.14} ${f + sw + 0.1} ${L * 0.24} ${f + sw} ${L * 0.36} C ${f + sw * 0.4} ${L * 0.45} ${f + sw + 0.1} ${L * 0.54} ${f + sw} ${L * 0.65} C ${f + sw * 0.4} ${L * 0.75} ${f + 0.2} ${L * 0.86} ${f + 0.32} ${L - 0.22} Q ${f + 0.36} ${L} ${f - 0.05} ${L} L ${b + 0.2} ${L} Q ${b - 0.25} ${L} ${b - 0.2} ${L - 0.4} C ${b - 0.02} ${L * 0.62} ${b - 0.2} ${L * 0.3} ${b - 0.04} ${0.2} Z`;
  cel(g, d, t, { sh: 0.55, hl: 0.25, ao: 0.6 });
  // stipple panel
  const P = rr(b + 0.38, L * 0.12, f - 0.22, L * 0.86, 0.4);
  clip(g, P, () => {
    for (let yy = L * 0.12; yy < L * 0.88; yy += 0.34) for (let xx = b + 0.38 + ((yy * 3) % 0.34); xx < f; xx += 0.34) {
      fill(g, dot(xx, yy, 0.07), t.k, 0.5); fill(g, dot(xx - 0.05, yy - 0.06, 0.04), t.l, 0.35);
    }
  });
  stroke(g, P, t.k, 0.08, 0.35);
  g.restore();
}
// trigger blade hanging from (x, y): concave face forward, tip curling forward
function trigger(g, t, x, y, L = 1.5) {
  const d = `M ${x - 0.2} ${y} L ${x + 0.2} ${y} Q ${x + 0.02} ${y + L * 0.55} ${x + 0.42} ${y + L} L ${x + 0.22} ${y + L + 0.14} Q ${x - 0.48} ${y + L * 0.6} ${x - 0.2} ${y} Z`;
  cel(g, d, t, { sh: 0.15, hl: 0.12, ao: 0.35 });
}
// trigger guard: a loop from the receiver at y0, x0 (rear) to x1 (front)
function guard(g, t, x0, x1, y0, depth, o = {}) {
  const th = o.th ?? 0.42, r = o.sq ? 0.35 : Math.min(1.1, depth * 0.55), y1 = y0 + depth;
  const out = o.sq
    ? `M ${x0} ${y0} L ${x1} ${y0} L ${x1 + 0.15} ${y1 - r} Q ${x1 + 0.15} ${y1} ${x1 - r} ${y1} L ${x0 + 0.6} ${y1} Q ${x0} ${y1} ${x0} ${y1 - 0.6} Z`
    : `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} L ${x0 + 0.5} ${y1} Q ${x0} ${y1} ${x0} ${y1 - 0.5} Z`;
  const hole = rrR(x0 + th, y0 - 0.2, x1 - th + (o.sq ? 0.15 : 0), y1 - th, Math.max(0.15, r - th * 0.5));
  cel(g, out + ' ' + hole, t, { sh: 0.2, hl: 0.15, ao: 0.4 });
}
// a band of the crew's cloth tape round a tube or a handguard
function wrap(g, m, x0, x1, y0, y1) {
  if (!m.tape) return;
  const t = m.tape, H = y1 - y0, d = `M ${x0} ${y0 - 0.12} L ${x1} ${y0 - 0.1} L ${x1 + 0.05} ${y1 + 0.12} L ${x0 - 0.04} ${y1 + 0.1} Z`;
  cel(g, d, t, { sh: 0.45, hl: 0.22, ao: 0.5 });
  clip(g, d, () => {
    for (let x = x0 - H; x < x1 + 0.4; x += 0.62) stroke(g, `M ${x} ${y1 + 0.2} L ${x + H * 0.45} ${y0 - 0.2}`, t.k, 0.1, 0.55);
    fill(g, rr(x0 + (x1 - x0) * 0.3, y0 + H * 0.2, x0 + (x1 - x0) * 0.62, y0 + H * 0.5, 0.2), t.d, 0.35);
  });
  // the loose end
  fill(g, poly([[x1 - 0.05, y1 - H * 0.35], [x1 + 0.4, y1 + 0.05], [x1 + 0.12, y1 + 0.3], [x1 - 0.1, y1 + 0.12]]), t.d, 0.95);
}
// Vanta's white stencil, when the material set carries one
function stencil(g, m, x, y, txt, size = 0.62) {
  if (m.serial) letter(g, txt, x, y, size, m.serial, 0.62, 700);
}
// a sling loop (QD swivel) hanging at (x, y)
function swivel(g, t, x, y, r = 0.55) {
  fill(g, rr(x - 0.25, y - 0.15, x + 0.25, y + 0.25, 0.08), t.d);
  stroke(g, dot(x, y + r + 0.15, r), t.k, 0.26, 0.9);
  stroke(g, dot(x, y + r + 0.15, r), t.m, 0.13, 0.9);
}
// round barrel / tube, lit along its top
function tube(g, t, x0, x1, y0, y1, o = {}) {
  const d = rr(x0, y0, x1, y1, Math.min(o.r ?? 0.2, (y1 - y0) / 2));
  cel(g, d, t, { sh: o.sh ?? 0.25, hl: 0.15, ao: 0.4, gloss: o.gloss ?? 0.25 });
  clip(g, d, () => {
    const k = y1 - y0;
    fill(g, rr(x0, y0 + k * 0.12, x1, y0 + k * 0.3, 0.05), t.l, 0.35);
    fill(g, rr(x0, y0 + k * 0.7, x1, y1, 0.05), t.k, 0.35);
  });
}
// a scope: tube on two rings, eyepiece bell behind, objective bell in front
function scope(g, m, o) {
  const { x0, x1, y, r, eye, obj, rings, ringY } = o, t = m.dark;
  for (const rx of rings) {
    cel(g, rr(rx, y + r - 0.1, rx + 1.3, ringY, 0.15), t, { sh: 0.2, hl: 0.15, ao: 0.4 });
    screw(g, m.steel, rx + 0.65, y + r + 0.55, 0.2, 0.3);
  }
  tube(g, t, x0, x1, y - r, y + r, { r: r, gloss: 0.3 });
  const E = `M ${x0 + 0.2} ${y - r} L ${x0 - 1.0} ${y - eye} L ${x0 - eye * 1.4} ${y - eye} Q ${x0 - eye * 1.4 - 0.4} ${y - eye} ${x0 - eye * 1.4 - 0.4} ${y - eye + 0.4} L ${x0 - eye * 1.4 - 0.4} ${y + eye - 0.4} Q ${x0 - eye * 1.4 - 0.4} ${y + eye} ${x0 - eye * 1.4} ${y + eye} L ${x0 - 1.0} ${y + eye} L ${x0 + 0.2} ${y + r} Z`;
  cel(g, E, t, { sh: 0.35, hl: 0.22, ao: 0.45, gloss: 0.2 });
  clip(g, E, () => { for (let x = x0 - eye * 1.4; x < x0 - 1.4; x += 0.3) stroke(g, `M ${x} ${y - eye} L ${x} ${y + eye}`, t.k, 0.1, 0.6); });
  const O = `M ${x1 - 0.2} ${y - r} L ${x1 + 1.2} ${y - obj} L ${x1 + obj * 1.6} ${y - obj} Q ${x1 + obj * 1.6 + 0.4} ${y - obj} ${x1 + obj * 1.6 + 0.4} ${y - obj + 0.4} L ${x1 + obj * 1.6 + 0.4} ${y + obj - 0.4} Q ${x1 + obj * 1.6 + 0.4} ${y + obj} ${x1 + obj * 1.6} ${y + obj} L ${x1 + 1.2} ${y + obj} L ${x1 - 0.2} ${y + r} Z`;
  cel(g, O, t, { sh: 0.35, hl: 0.22, ao: 0.45, gloss: 0.2 });
  const fx = x1 + obj * 1.6 + 0.4;
  fill(g, rr(fx - 0.25, y - obj + 0.3, fx + 0.12, y + obj - 0.3, 0.12), m.glass.m);
  fill(g, rr(fx - 0.2, y - obj + 0.5, fx + 0.02, y - obj * 0.1, 0.08), m.glass.l, 0.75);
  // turrets: elevation on top, windage cap facing us, both knurled
  const tx = (x0 + x1) / 2 - 0.2;
  cel(g, rr(tx - 0.75, y - r - 1.25, tx + 0.75, y - r + 0.1, 0.15), t, { sh: 0.2, hl: 0.18, ao: 0.4 });
  for (let x = tx - 0.6; x < tx + 0.7; x += 0.22) stroke(g, `M ${x} ${y - r - 1.1} L ${x} ${y - r - 0.15}`, t.k, 0.07, 0.7);
  cel(g, dot(tx, y + 0.1, r * 0.82), t, { sh: 0.25, hl: 0.2, ao: 0.5, gloss: 0.3 });
  stroke(g, dot(tx, y + 0.1, r * 0.55), t.k, 0.09, 0.6);
  lit(g, x0, x1, y - r + 0.22, t, 0.12, 0.5);
}

// SERÇE-9 — compact striker pistol ------------------------------------------
function wren(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) wrenMag(g, m);
  if (on('body')) {
    // barrel crown just proud of the slide
    cel(g, rr(5.9, -4.75, 6.42, -3.7, 0.12), m.steel, { sh: 0.15, hl: 0.1 });
    fill(g, dot(6.3, -4.22, 0.22), m.steel.k);
    grip(g, m.poly, -1.1, -2.0, 5.65, 2.6, 0.22);
    // frame: dust cover with an accessory rail, beavertail over the hand
    const FRAME = 'M -2.9 -3.5 L 5.8 -3.5 L 5.85 -2.2 Q 5.8 -2.0 5.5 -2.0 L 3.4 -2.0 L -0.1 -1.86 L -2.3 -1.7 Q -3.0 -1.8 -3.4 -2.25 L -3.3 -2.6 Z';
    cel(g, FRAME, m.poly, { sh: 0.4, hl: 0.22, ao: 0.5 });
    clip(g, FRAME, () => {
      for (const x of [3.7, 4.55]) recess(g, rr(x, -2.6, x + 0.6, -2.18, 0.08), m.poly, 0.1);
      lit(g, -2.6, 5.7, -3.38, m.poly, 0.1, 0.4);
    });
    guard(g, m.poly, -0.2, 3.35, -2.0, 2.05, { sq: true, th: 0.4 });
    trigger(g, m.dark, 1.05, -1.95, 1.35);
    stroke(g, 'M 1.0 -1.7 L 1.18 -0.9', m.dark.l, 0.08, 0.6);
    // takedown tab, frame pins, magazine release
    fill(g, rr(0.15, -3.42, 1.0, -3.12, 0.08), m.steel.d);
    pin(g, m.steel, -1.85, -2.62, 0.18); pin(g, m.steel, 0.55, -2.72, 0.18);
    cel(g, rr(-0.38, -1.95, 0.2, -1.42, 0.12), m.poly, { sh: 0.2, hl: 0.15 });
    stencil(g, m, 2.2, -2.3, 'V-114', 0.5);
  }
  if (on('slide')) {
    const SLIDE = 'M -3.3 -5.3 L 5.25 -5.3 Q 5.9 -5.3 6.15 -4.85 L 6.2 -3.4 L -3.45 -3.4 Q -3.55 -3.4 -3.55 -3.55 L -3.5 -5.1 Q -3.48 -5.3 -3.3 -5.3 Z', F = m.frame;
    cel(g, SLIDE, F, { sh: 0.45, hl: 0.3, ao: 0.5, gloss: 0.25 });
    clip(g, SLIDE, () => {
      serrate(g, F, -3.15, -1.2, -5.25, -3.55, 0.36, 0.14);
      // ejection port with the barrel hood in it
      recess(g, rr(1.25, -5.4, 4.05, -4.35, 0.12), F, 0.16);
      cel(g, rr(1.4, -5.25, 3.85, -4.55, 0.1), m.steel, { sh: 0.12, hl: 0.15, ao: 0.4, gloss: 0.35 });
      lit(g, -3.3, 5.5, -5.16, F, 0.12, 0.6);
      shade(g, -3.4, 6.1, -3.48, F, 0.12, 0.6);
      // roll mark
      letter(g, '9×19', 4.25, -3.72, 0.46, F.k);
    });
    // sights: rear block with its notch, front post
    cel(g, poly([[-3.05, -5.28], [-2.95, -5.92], [-1.95, -5.92], [-1.8, -5.28]]), m.dark, { sh: 0.15, hl: 0.15, ao: 0.4 });
    cel(g, poly([[4.85, -5.28], [4.95, -5.85], [5.45, -5.85], [5.5, -5.28]]), m.dark, { sh: 0.15, hl: 0.15, ao: 0.4 });
  }
}
// the magazine rides inside the grip; seated, only its base plate shows
function wrenMag(g, m = MAT) {
  g.save(); g.translate(-1.1, -2.0); g.rotate(0.22);
  const B = rr(-0.95, 0.6, 0.95, 5.95, 0.18);
  cel(g, B, m.steel, { sh: 0.35, hl: 0.2, gloss: 0.2 });
  clip(g, B, () => { for (const y of [2.2, 3.2, 4.2]) fill(g, dot(0.35, y, 0.17), m.steel.k, 0.85); });
  fill(g, rr(-0.65, 0.3, 0.55, 0.8, 0.15), m.brass.m);
  fill(g, rr(-0.6, 0.32, 0.1, 0.5, 0.1), m.brass.l, 0.7);
  cel(g, 'M -1.45 5.55 L 1.2 5.55 Q 1.45 5.6 1.42 5.9 L 1.32 6.4 Q 1.3 6.55 1.1 6.55 L -1.3 6.55 Q -1.5 6.55 -1.52 6.35 Z', m.poly, { sh: 0.3, hl: 0.2, ao: 0.5 });
  g.restore();
}

// KERKENEZ AR — select-fire carbine --------------------------------------------
function kestrel(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) kestrelMag(g, m);
  if (!on('body')) return;
  // buffer tube and castle nut
  tube(g, m.metal, -11.2, -5.7, -3.55, -1.95, { r: 0.5, gloss: 0.2 });
  cel(g, rr(-6.3, -3.75, -5.6, -1.75, 0.12), m.steel, { sh: 0.2, hl: 0.15 });
  for (const y of [-3.3, -2.75, -2.2]) fill(g, rr(-6.3, y, -5.95, y + 0.28, 0.05), m.steel.k);
  // collapsible stock: a wedge riding the tube, rubber butt pad, sling loop
  const STOCK = 'M -15.9 -4.75 L -11.3 -4.3 Q -10.6 -4.2 -10.5 -3.6 L -10.4 -2.05 Q -10.4 -1.6 -10.8 -1.4 L -12.3 -0.5 L -15.3 1.65 Q -15.9 2.0 -16.15 1.4 L -16.15 -4.3 Q -16.15 -4.75 -15.9 -4.75 Z';
  cel(g, STOCK, m.poly, { sh: 0.6, hl: 0.3, ao: 0.6 });
  clip(g, STOCK, () => {
    panel(g, 'M -14.9 -3.7 L -11.6 -3.45 L -11.6 -2.3 L -14.9 -1.0 Z', m.poly);
    lit(g, -15.8, -10.8, -4.55, m.poly, 0.1, 0.45);
  });
  cel(g, rr(-16.75, -4.95, -15.95, 1.95, 0.25), m.dark, { sh: 0.25, hl: 0.15, ao: 0.5 });
  clip(g, rr(-16.75, -4.95, -15.95, 1.95, 0.25), () => { for (let y = -4.6; y < 1.8; y += 0.5) stroke(g, `M -16.8 ${y} L -15.9 ${y}`, m.dark.k, 0.12, 0.6); });
  cel(g, poly([[-11.6, -1.25], [-10.3, -1.25], [-10.1, -0.85], [-11.4, -0.75]]), m.poly, { sh: 0.2, hl: 0.15 });
  swivel(g, m.steel, -14.6, 1.05, 0.45);
  stencil(g, m, -14.9, -0.2, 'VANTA', 0.7);
  // lower receiver: grip, trigger guard, flared magazine well, pins
  grip(g, m.poly, -1.4, 0.2, 6.2, 2.4, 0.36);
  const LOWER = 'M -5.8 -1.8 L 6.5 -1.8 L 6.5 -1.05 L 6.2 0.75 L 6.5 1.12 L 2.85 1.12 L 2.95 0.4 L 2.7 -0.2 L -0.5 -0.2 Q -0.9 -0.2 -1.2 0.25 L -2.2 0.15 L -4.7 -0.25 Q -5.6 -0.45 -5.8 -1.0 Z';
  cel(g, LOWER, m.metal, { sh: 0.4, hl: 0.22, ao: 0.5, gloss: 0.15 });
  clip(g, LOWER, () => {
    shade(g, 2.9, 6.4, 0.75, m.metal, 0.12, 0.5);
    lit(g, -5.6, 6.4, -1.68, m.metal, 0.1, 0.5);
    // magazine release in its fence
    recess(g, dot(2.25, -0.95, 0.5), m.metal, 0.12);
    cel(g, dot(2.25, -0.95, 0.36), m.steel, { sh: 0.15, hl: 0.15, gloss: 0.3 });
  });
  for (const [x, y] of [[5.65, -1.35], [-4.85, -1.25], [0.55, -0.95], [-0.75, -0.95]]) pin(g, m.steel, x, y, 0.2);
  // selector, worn bright at its tip
  cel(g, 'M -2.6 -1.45 L -1.5 -1.45 Q -1.25 -1.2 -1.5 -0.95 L -2.6 -0.95 Q -2.85 -1.2 -2.6 -1.45 Z', m.steel, { sh: 0.15, hl: 0.15, gloss: 0.3 });
  guard(g, m.metal, -0.45, 2.75, -0.2, 2.2);
  trigger(g, m.steel, 0.95, -0.2, 1.4);
  // upper receiver: forward assist, brass deflector, dust cover, charging handle
  const UPPER = 'M -5.8 -4.4 L 6.5 -4.4 L 6.5 -1.8 L -5.8 -1.8 Z';
  cel(g, UPPER, m.metal, { sh: 0.45, hl: 0.28, ao: 0.5, gloss: 0.18 });
  clip(g, UPPER, () => {
    cel(g, rr(0.55, -3.75, 3.85, -2.35, 0.15), m.metal, { sh: 0.2, hl: 0.15, ao: 0.6 });
    stroke(g, 'M 0.7 -3.05 L 3.7 -3.05', m.metal.k, 0.14, 0.7);
    stroke(g, 'M 0.7 -2.92 L 3.7 -2.92', m.metal.l, 0.08, 0.5);
    lit(g, -5.6, 6.4, -4.26, m.metal, 0.12, 0.55);
    shade(g, -5.8, 6.5, -1.88, m.metal, 0.14, 0.5);
  });
  cel(g, poly([[-1.0, -4.3], [0.45, -4.3], [0.45, -2.9], [-0.3, -3.35]]), m.metal, { sh: 0.25, hl: 0.2, ao: 0.5 });
  cel(g, rr(-3.6, -3.75, -1.1, -2.65, 0.5), m.metal, { sh: 0.25, hl: 0.18, ao: 0.5 });
  cel(g, dot(-3.6, -3.2, 0.62), m.steel, { sh: 0.2, hl: 0.2, gloss: 0.3 });
  for (let a = 0; a < 6; a++) stroke(g, `M ${-3.6 + Math.cos(a) * 0.3} ${-3.2 + Math.sin(a) * 0.3} L ${-3.6 + Math.cos(a) * 0.58} ${-3.2 + Math.sin(a) * 0.58}`, m.steel.k, 0.08, 0.7);
  cel(g, poly([[-6.85, -4.45], [-5.7, -4.45], [-5.7, -3.75], [-6.55, -3.75], [-6.85, -4.0]]), m.metal, { sh: 0.2, hl: 0.15 });
  rail(g, m.metal, -5.6, 6.3, -4.4);
  // folded flip-up rear sight
  cel(g, rr(-5.3, -5.55, -4.0, -4.8, 0.2), m.dark, { sh: 0.2, hl: 0.15, ao: 0.4 });
  // free-float handguard: faceted tube, slots, a band of the crew's tape
  const HG = 'M 6.5 -4.6 L 17.4 -4.6 Q 17.9 -4.6 17.9 -4.1 L 17.9 -1.1 Q 17.9 -0.6 17.4 -0.6 L 6.5 -0.6 Z';
  cel(g, HG, m.metal, { sh: 0.5, hl: 0.28, ao: 0.5, gloss: 0.15 });
  clip(g, HG, () => {
    fill(g, rr(6.5, -4.6, 17.9, -3.75, 0.05), m.metal.l, 0.18);
    fill(g, rr(6.5, -1.45, 17.9, -0.6, 0.05), m.metal.k, 0.35);
    slots(g, m.metal, 8.0, 16.6, -3.05, -2.25, 2.2, 1.55);
    shade(g, 6.5, 17.9, -3.72, m.metal, 0.08, 0.4);
    lit(g, 6.5, 17.9, -1.48, m.metal, 0.08, 0.35);
  });
  cel(g, rr(6.45, -4.75, 6.95, -0.45, 0.12), m.steel, { sh: 0.15, hl: 0.12 });
  rail(g, m.metal, 6.9, 17.6, -4.6);
  wrap(g, m, 14.2, 15.9, -4.62, -0.58);
  // barrel and an A2 birdcage
  tube(g, m.steel, 17.9, 21.8, -3.0, -2.0, { r: 0.3 });
  const CAGE = rr(21.6, -3.28, 24.4, -1.72, 0.25);
  cel(g, CAGE, m.steel, { sh: 0.25, hl: 0.2, ao: 0.5, gloss: 0.25 });
  clip(g, CAGE, () => { for (const x of [22.15, 22.85, 23.55]) fill(g, rr(x, -3.3, x + 0.38, -2.5, 0.12), m.steel.k); });
  fill(g, rr(24.15, -3.0, 24.42, -2.0, 0.1), m.steel.k, 0.8);
  // folded front sight
  cel(g, poly([[15.9, -5.2], [17.3, -5.2], [17.3, -4.75], [15.7, -4.75]]), m.dark, { sh: 0.15, hl: 0.15, ao: 0.4 });
  // compact red dot on a riser
  cel(g, poly([[-1.2, -4.95], [2.5, -4.95], [2.3, -5.7], [-1.0, -5.7]]), m.dark, { sh: 0.2, hl: 0.15, ao: 0.45 });
  screw(g, m.steel, -0.4, -5.3, 0.2); screw(g, m.steel, 1.7, -5.3, 0.2);
  const DOT = 'M -0.9 -7.25 Q -0.9 -7.65 -0.5 -7.65 L 1.9 -7.65 Q 2.3 -7.65 2.35 -7.25 L 2.4 -5.75 L -0.95 -5.75 Z';
  cel(g, DOT, m.dark, { sh: 0.35, hl: 0.25, ao: 0.5, gloss: 0.3 });
  cel(g, rr(0.35, -8.15, 1.15, -7.6, 0.12), m.dark, { sh: 0.15, hl: 0.15 });
  cel(g, dot(0.75, -6.6, 0.5), m.dark, { sh: 0.2, hl: 0.2, gloss: 0.35 });
  stroke(g, dot(0.75, -6.6, 0.32), m.dark.k, 0.08, 0.6);
  fill(g, rr(2.28, -7.45, 2.5, -5.9, 0.08), m.glass.m);
  fill(g, rr(2.3, -7.35, 2.42, -6.6, 0.05), m.glass.l, 0.7);
}
function kestrelMag(g, m = MAT) {
  const MAG = 'M 3.15 -0.6 L 5.75 -0.6 L 5.75 0.4 C 6.05 3.0 6.85 5.4 7.85 7.55 L 5.25 8.55 C 4.25 6.3 3.4 3.6 3.15 0.4 Z';
  cel(g, MAG, m.metal, { sh: 0.5, hl: 0.25, ao: 0.5, gloss: 0.15 });
  clip(g, MAG, () => {
    // the pressed ribs that run down an aluminium magazine
    stroke(g, 'M 3.85 1.0 C 4.1 3.4 4.75 5.4 5.6 7.4', m.metal.k, 0.32, 0.55);
    stroke(g, 'M 3.95 0.95 C 4.2 3.35 4.85 5.35 5.7 7.35', m.metal.l, 0.1, 0.45);
    stroke(g, 'M 5.05 0.9 C 5.3 3.2 5.95 5.1 6.75 7.0', m.metal.k, 0.32, 0.55);
    stroke(g, 'M 5.15 0.85 C 5.4 3.15 6.05 5.05 6.85 6.95', m.metal.l, 0.1, 0.45);
  });
  // base plate
  cel(g, 'M 5.0 8.35 L 7.95 7.25 Q 8.3 7.2 8.38 7.55 L 8.55 8.0 Q 8.6 8.3 8.3 8.42 L 5.55 9.45 Q 5.25 9.55 5.15 9.25 Z', m.dark, { sh: 0.25, hl: 0.2, ao: 0.5 });
}

// HARBİ-12 — pump-action shotgun on walnut -------------------------------------
function ramrod(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('body')) ramrodBody(g, m);
  if (on('pump')) ramrodPump(g, m);
}
function ramrodBody(g, m) {
  // barrel with a vented rib and a bead, the magazine tube under it
  tube(g, m.steel, 4.9, 27.4, -4.1, -2.75, { r: 0.3, gloss: 0.3 });
  cel(g, rr(5.6, -4.55, 27.0, -4.12, 0.08), m.steel, { sh: 0.1, hl: 0.12, ao: 0.3 });
  for (let x = 6.4; x < 26.6; x += 1.2) fill(g, rr(x, -4.12, x + 0.7, -4.05, 0.02), m.steel.k, 0.9);
  fill(g, dot(26.75, -4.72, 0.2), m.brass.m); fill(g, dot(26.7, -4.78, 0.09), m.brass.l);
  fill(g, rr(27.18, -3.95, 27.42, -2.9, 0.1), m.steel.k, 0.85);
  tube(g, m.steel, 4.9, 24.4, -2.6, -0.95, { r: 0.6, gloss: 0.2 });
  cel(g, rr(22.1, -2.95, 23.0, -0.8, 0.2), m.steel, { sh: 0.2, hl: 0.15, ao: 0.5 });
  cel(g, rr(22.1, -4.25, 23.0, -2.6, 0.2), m.steel, { sh: 0.2, hl: 0.15, ao: 0.5 });
  const CAP = rr(23.9, -2.8, 25.5, -0.75, 0.35);
  cel(g, CAP, m.steel, { sh: 0.25, hl: 0.2, ao: 0.5, gloss: 0.3 });
  clip(g, CAP, () => { for (let x = 24.05; x < 25.4; x += 0.22) stroke(g, `M ${x} -2.8 L ${x} -0.75`, m.steel.k, 0.08, 0.6); });
  swivel(g, m.steel, 24.7, -0.75, 0.45);
  // walnut stock: comb, heel, toe, a semi-pistol grip with a cap, checkering
  const STOCK = 'M -5.2 -3.85 L -17.3 -3.05 Q -17.7 -3.0 -17.75 -2.6 L -17.75 3.35 Q -17.7 3.6 -17.3 3.55 L -10.0 1.35 C -7.0 0.5 -4.6 1.2 -3.4 3.2 L -2.6 4.75 Q -2.4 5.1 -2.0 5.05 L 0.2 4.65 Q 0.55 4.55 0.45 4.2 L -0.35 0.75 L -0.3 0.4 L -5.2 0.4 Z';
  cel(g, STOCK, m.wood, { sh: 0.75, hl: 0.35, ao: 0.6, gloss: 0.12 });
  clip(g, STOCK, () => {
    // checkering on the grip
    const C = 'M -3.6 0.9 L -0.9 0.75 L -0.3 3.6 L -2.3 4.0 Z';
    clip(g, C, () => {
      for (let i = -6; i < 8; i += 0.32) { stroke(g, `M ${-4 + i} 0.4 L ${-1 + i} 4.6`, m.wood.k, 0.07, 0.55); stroke(g, `M ${-1 + i} 0.4 L ${-4 + i} 4.6`, m.wood.k, 0.07, 0.55); }
    });
    stroke(g, C, m.wood.d, 0.08, 0.6);
    lit(g, -16.8, -5.6, -3.3, m.wood, 0.14, 0.4);
  });
  // grip cap, recoil pad with its white spacer
  fill(g, 'M -2.55 4.6 L 0.35 4.1 L 0.47 4.25 Q 0.55 4.55 0.2 4.65 L -2.0 5.05 Q -2.4 5.1 -2.6 4.75 Z', m.dark.d);
  cel(g, rr(-18.6, -3.15, -17.75, 3.65, 0.3), m.dark, { sh: 0.25, hl: 0.15, ao: 0.5 });
  fill(g, rr(-17.85, -3.1, -17.7, 3.6, 0.04), '#d9d4c8', 0.85);
  swivel(g, m.steel, -15.2, 2.35, 0.45);
  // a cuff of shells on the stock
  for (let i = 0; i < 5; i++) {
    const x = -14.2 + i * 1.04;
    cel(g, rr(x, -3.35, x + 0.82, -0.85, 0.2), m.shell, { sh: 0.3, hl: 0.22, ao: 0.4 });
    cel(g, rr(x - 0.04, -0.95, x + 0.86, -0.15, 0.08), m.brass, { sh: 0.2, hl: 0.2, gloss: 0.4 });
    stroke(g, `M ${x + 0.22} -3.2 L ${x + 0.22} -1.1`, m.shell.l, 0.08, 0.5);
  }
  cel(g, rr(-14.6, -2.35, -9.0, -1.25, 0.2), m.dark, { sh: 0.3, hl: 0.15, ao: 0.5, tex: 'nylon' });
  // receiver: ejection port with the bolt in it, trigger plate, pins
  const REC = 'M -5.4 -4.3 L 5.0 -4.3 L 5.0 0.4 L -3.8 0.4 Q -5.0 0.3 -5.55 -0.9 L -5.55 -3.9 Q -5.5 -4.3 -5.4 -4.3 Z';
  cel(g, REC, m.frame, { sh: 0.5, hl: 0.3, ao: 0.5, gloss: 0.3 });
  clip(g, REC, () => {
    recess(g, rr(0.0, -3.55, 3.7, -1.6, 0.25), m.frame, 0.2);
    cel(g, rr(0.2, -3.25, 3.4, -2.05, 0.15), m.steel, { sh: 0.12, hl: 0.15, gloss: 0.45 });
    lit(g, -5.2, 4.9, -4.15, m.frame, 0.12, 0.55);
    letter(g, '12 GA · 2¾"', -4.7, -0.35, 0.55, m.frame.k);
  });
  pin(g, m.steel, -3.7, -0.75, 0.2); pin(g, m.steel, 3.9, -0.75, 0.2);
  cel(g, rr(-4.6, 0.25, 3.2, 0.95, 0.25), m.metal, { sh: 0.2, hl: 0.12 });
  recess(g, rr(0.6, 0.35, 3.6, 0.7, 0.15), m.steel, 0.1);
  guard(g, m.metal, -0.4, 2.9, 0.7, 1.95);
  trigger(g, m.steel, 0.95, 0.7, 1.3);
  cel(g, dot(2.55, 0.95, 0.22), m.steel, { sh: 0.1, hl: 0.1 });
  stencil(g, m, -8.6, 0.25, 'V-205', 0.6);
}
function ramrodPump(g, m) {
  // a ribbed walnut forend riding the magazine tube
  const PUMP = 'M 9.0 -3.05 L 18.3 -3.05 Q 18.95 -3.05 18.95 -2.4 L 18.95 0.25 Q 18.95 0.9 18.3 0.9 L 9.0 0.9 Q 8.35 0.9 8.35 0.25 L 8.35 -2.4 Q 8.35 -3.05 9.0 -3.05 Z';
  cel(g, PUMP, m.wood, { sh: 0.6, hl: 0.3, ao: 0.55, gloss: 0.1 });
  clip(g, PUMP, () => {
    for (let x = 9.6; x < 18.2; x += 0.86) { stroke(g, `M ${x} -3.1 L ${x} 0.95`, m.wood.k, 0.22, 0.75); stroke(g, `M ${x + 0.18} -3.1 L ${x + 0.18} 0.95`, m.wood.l, 0.08, 0.4); }
    fill(g, rr(8.35, 0.2, 18.95, 0.95, 0.1), m.wood.k, 0.3);
  });
}

// ATMACA DMR — semi-auto marksman rifle, captured, in tan --------------------
function marksman(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) marksmanMag(g, m);
  if (!on('body')) return;
  const F = m.tan;
  tube(g, m.metal, -9.4, -7.0, -3.5, -2.0, { r: 0.5 });
  // precision stock: adjustable cheek riser, tall butt, knobs
  const STOCK = 'M -9.0 -4.25 L -14.2 -4.25 L -14.2 -4.6 L -19.6 -4.6 Q -20.4 -4.6 -20.4 -3.9 L -20.4 2.25 Q -20.4 2.75 -19.9 2.7 L -14.2 0.35 L -9.2 0.1 Q -8.7 0.0 -8.7 -0.5 L -8.7 -3.9 Q -8.7 -4.25 -9.0 -4.25 Z';
  cel(g, STOCK, F, { sh: 0.6, hl: 0.3, ao: 0.6 });
  clip(g, STOCK, () => {
    panel(g, rr(-18.0, -2.6, -13.4, -1.25, 0.55), F);
    panel(g, rr(-12.6, -2.6, -10.0, -1.25, 0.5), F);
    lit(g, -19.8, -9.0, -4.45, F, 0.1, 0.45);
  });
  const CHEEK = rr(-19.4, -6.0, -14.4, -4.55, 0.4);
  cel(g, CHEEK, F, { sh: 0.4, hl: 0.25, ao: 0.6 });
  for (const x of [-18.6, -15.2]) cel(g, rr(x - 0.35, -4.6, x + 0.35, -4.1, 0.08), m.steel, { sh: 0.1, hl: 0.12 });
  cel(g, dot(-12.0, -0.9, 0.55), m.dark, { sh: 0.2, hl: 0.2, gloss: 0.3 });
  cel(g, rr(-21.0, -6.0, -20.3, 2.8, 0.25), m.dark, { sh: 0.25, hl: 0.15, ao: 0.5 });
  swivel(g, m.steel, -17.5, 1.45, 0.45);
  // lower: grip, guard, magazine well
  grip(g, F, -1.4, 0.0, 6.0, 2.4, 0.32);
  const LOWER = 'M -7.4 -1.4 L 8.4 -1.4 L 8.4 -0.75 L 7.9 1.05 L 8.2 1.4 L 3.75 1.4 L 3.85 0.6 L 3.5 -0.4 L -0.5 -0.4 Q -0.9 -0.4 -1.2 0.05 L -2.2 -0.05 L -6.4 -0.4 Q -7.3 -0.6 -7.4 -1.0 Z';
  cel(g, LOWER, m.metal, { sh: 0.4, hl: 0.22, ao: 0.5, gloss: 0.15 });
  clip(g, LOWER, () => { recess(g, dot(3.05, -0.75, 0.48), m.metal, 0.12); cel(g, dot(3.05, -0.75, 0.34), m.steel, { sh: 0.15, hl: 0.15, gloss: 0.3 }); });
  for (const [x, y] of [[7.55, -0.95], [-6.4, -0.95], [0.6, -0.95], [-0.8, -0.95]]) pin(g, m.steel, x, y, 0.2);
  guard(g, m.metal, -0.45, 3.55, -0.4, 2.2);
  trigger(g, m.steel, 1.05, -0.4, 1.4);
  // upper: taller than the carbine's, the same furniture of an AR
  const UPPER = rr(-7.4, -4.6, 8.4, -1.4, 0.08);
  cel(g, UPPER, m.metal, { sh: 0.45, hl: 0.28, ao: 0.5, gloss: 0.18 });
  clip(g, UPPER, () => {
    cel(g, rr(1.0, -3.85, 4.5, -2.15, 0.15), m.metal, { sh: 0.2, hl: 0.15, ao: 0.6 });
    stroke(g, 'M 1.15 -3.0 L 4.35 -3.0', m.metal.k, 0.14, 0.7);
    lit(g, -7.2, 8.3, -4.45, m.metal, 0.12, 0.55);
  });
  cel(g, poly([[-0.6, -4.5], [0.9, -4.5], [0.9, -3.0], [0.1, -3.45]]), m.metal, { sh: 0.25, hl: 0.2, ao: 0.5 });
  cel(g, rr(-4.4, -3.95, -1.6, -2.75, 0.55), m.metal, { sh: 0.25, hl: 0.18, ao: 0.5 });
  cel(g, dot(-4.4, -3.35, 0.66), m.steel, { sh: 0.2, hl: 0.2, gloss: 0.3 });
  cel(g, poly([[-8.4, -4.65], [-7.25, -4.65], [-7.25, -3.95], [-8.1, -3.95], [-8.4, -4.2]]), m.metal, { sh: 0.2, hl: 0.15 });
  rail(g, m.metal, -7.2, 8.2, -4.6);
  // long free-float handguard in tan, slots, a top rail, a folded bipod
  const HG = 'M 8.4 -4.8 L 21.9 -4.8 Q 22.4 -4.8 22.4 -4.3 L 22.4 -1.3 Q 22.4 -0.8 21.9 -0.8 L 8.4 -0.8 Z';
  cel(g, HG, F, { sh: 0.5, hl: 0.28, ao: 0.5 });
  clip(g, HG, () => {
    fill(g, rr(8.4, -4.8, 22.4, -3.95, 0.05), F.l, 0.2);
    fill(g, rr(8.4, -1.6, 22.4, -0.8, 0.05), F.k, 0.3);
    slots(g, F, 9.6, 21.4, -3.25, -2.4, 2.0, 1.4);
  });
  cel(g, rr(8.35, -4.95, 8.85, -0.65, 0.12), m.steel, { sh: 0.15, hl: 0.12 });
  rail(g, m.metal, 8.8, 22.2, -4.8);
  cel(g, rr(19.4, -0.95, 21.7, 0.15, 0.3), m.dark, { sh: 0.25, hl: 0.18, ao: 0.5 });
  for (const y of [0.0, 0.45]) tube(g, m.dark, 13.6, 20.2, y - 0.2, y + 0.2, { r: 0.18, gloss: 0.15 });
  cel(g, dot(20.6, -0.4, 0.38), m.steel, { sh: 0.1, hl: 0.15, gloss: 0.3 });
  // barrel and a long suppressor on a mount
  tube(g, m.steel, 22.4, 27.0, -3.3, -2.3, { r: 0.3 });
  cel(g, rr(26.5, -4.05, 27.9, -1.55, 0.25), m.steel, { sh: 0.2, hl: 0.15, ao: 0.5 });
  const SUP = rr(27.7, -3.95, 33.4, -1.65, 0.5);
  cel(g, SUP, m.dark, { sh: 0.4, hl: 0.25, ao: 0.5, gloss: 0.25 });
  clip(g, SUP, () => {
    for (let x = 27.9; x < 29.2; x += 0.2) stroke(g, `M ${x} -4 L ${x} -1.6`, m.dark.k, 0.07, 0.6);
    fill(g, rr(27.7, -3.6, 33.4, -3.2, 0.05), m.dark.l, 0.35);
    stroke(g, 'M 32.6 -3.95 L 32.6 -1.65', m.dark.k, 0.1, 0.6);
  });
  // a variable scope
  scope(g, m, { x0: -1.4, x1: 8.0, y: -6.95, r: 0.72, eye: 1.25, obj: 1.65, rings: [-0.2, 5.6], ringY: -4.6 });
  stencil(g, m, -18.2, -0.6, 'VANTA', 0.7);
}
function marksmanMag(g, m = MAT) {
  const MAG = 'M 3.85 -0.8 L 7.25 -0.8 L 7.3 0.4 L 7.75 5.55 L 4.45 5.85 L 3.9 0.4 Z';
  cel(g, MAG, m.dark, { sh: 0.5, hl: 0.25, ao: 0.5 });
  clip(g, MAG, () => {
    for (const x of [4.9, 6.2]) { stroke(g, `M ${x} 0.6 L ${x + 0.3} 5.2`, m.dark.k, 0.3, 0.6); stroke(g, `M ${x + 0.1} 0.6 L ${x + 0.4} 5.2`, m.dark.l, 0.08, 0.45); }
  });
  cel(g, 'M 4.3 5.55 L 7.85 5.25 Q 8.15 5.25 8.15 5.55 L 8.2 6.05 Q 8.2 6.3 7.95 6.33 L 4.6 6.6 Q 4.35 6.62 4.32 6.35 Z', m.dark, { sh: 0.25, hl: 0.18, ao: 0.5 });
}

// KATIR .50 — heavy gas-operated pistol, stainless ----------------------------
function mule(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  const S = m.stainless || m.steel;
  if (on('mag')) {
    g.save(); g.translate(-1.2, -2.0); g.rotate(0.2);
    cel(g, rr(-1.1, 0.6, 1.1, 6.6, 0.2), S, { sh: 0.35, hl: 0.2, gloss: 0.2 });
    fill(g, rr(-0.8, 0.3, 0.7, 0.95, 0.15), m.brass.m);
    fill(g, rr(-0.75, 0.32, 0.15, 0.55, 0.1), m.brass.l, 0.7);
    cel(g, rr(-1.65, 6.25, 1.45, 7.3, 0.3), m.poly, { sh: 0.3, hl: 0.2, ao: 0.5 });
    g.restore();
  }
  if (on('body')) {
    // hammer spur behind the slide
    cel(g, 'M -3.9 -5.0 L -4.55 -5.75 Q -4.95 -6.25 -4.5 -6.45 Q -4.1 -6.55 -3.85 -6.15 L -3.5 -5.3 Z', m.steel, { sh: 0.2, hl: 0.15, ao: 0.45, gloss: 0.3 });
    clip(g, 'M -3.9 -5.0 L -4.55 -5.75 Q -4.95 -6.25 -4.5 -6.45 Q -4.1 -6.55 -3.85 -6.15 L -3.5 -5.3 Z', () => { for (let i = 0; i < 4; i++) stroke(g, `M ${-4.85 + i * 0.18} ${-6.45 + i * 0.12} L ${-4.45 + i * 0.18} ${-6.05 + i * 0.12}`, m.steel.k, 0.06, 0.7); });
    grip(g, m.poly, -1.2, -2.0, 6.6, 3.0, 0.2, { swell: 0.4 });
    // the fixed barrel: a flat top with a rail, a dark lower facet, the muzzle
    const BAR = 'M 0.0 -6.25 L 8.55 -6.25 Q 8.75 -6.25 8.75 -6.05 L 8.75 -4.0 L 8.3 -3.5 L 0.0 -3.5 Z';
    cel(g, BAR, S, { sh: 0.4, hl: 0.3, ao: 0.5, gloss: 0.35 });
    clip(g, BAR, () => {
      fill(g, 'M 0 -4.75 L 8.8 -4.6 L 8.8 -3.4 L 0 -3.4 Z', S.d, 0.75);
      stroke(g, 'M 0 -4.75 L 8.8 -4.6', S.l, 0.1, 0.6);
      lit(g, 0, 8.6, -6.1, S, 0.12, 0.6);
    });
    fill(g, dot(8.62, -4.55, 0.42), m.steel.k);
    cel(g, rr(3.4, -6.7, 8.5, -6.2, 0.06), S, { sh: 0.1, hl: 0.12, ao: 0.4 });
    for (let x = 3.8; x < 8.2; x += 0.6) fill(g, rr(x, -6.7, x + 0.22, -6.4, 0.03), S.k, 0.6);
    cel(g, poly([[7.7, -6.7], [7.85, -7.25], [8.35, -7.25], [8.4, -6.7]]), m.dark, { sh: 0.12, hl: 0.12 });
    // frame: dust cover under the barrel, a hooked guard
    const FRAME = 'M -3.6 -3.55 L 7.1 -3.55 Q 7.5 -3.5 7.3 -3.0 L 6.6 -2.0 L 3.8 -1.75 L -0.2 -1.65 L -2.6 -1.5 Q -3.3 -1.5 -3.7 -2.1 Z';
    cel(g, FRAME, S, { sh: 0.4, hl: 0.25, ao: 0.5, gloss: 0.25 });
    clip(g, FRAME, () => lit(g, -3.4, 7.0, -3.42, S, 0.1, 0.5));
    const GD = 'M 0.1 -1.75 L 3.95 -1.75 L 4.0 0.0 L 4.45 0.55 L 3.75 0.55 Q 3.6 0.45 3.4 0.45 L 0.6 0.45 Q 0.1 0.45 0.1 -0.05 Z ' + rrR(0.5, -1.9, 3.55, 0.05, 0.3);
    cel(g, GD, S, { sh: 0.2, hl: 0.15, ao: 0.4, gloss: 0.2 });
    trigger(g, m.steel, 1.4, -1.7, 1.4);
    pin(g, m.steel, -2.4, -2.5, 0.2); pin(g, m.steel, 5.6, -2.7, 0.2);
    cel(g, rr(-0.75, -1.75, -0.15, -1.2, 0.12), m.steel, { sh: 0.15, hl: 0.15 });
  }
  if (on('slide')) {
    const SL = 'M -3.8 -6.4 L 3.7 -6.4 L 3.9 -6.0 L 3.9 -3.5 L -3.95 -3.5 Q -4.1 -3.5 -4.1 -3.7 L -4.05 -6.1 Q -4.0 -6.4 -3.8 -6.4 Z';
    cel(g, SL, S, { sh: 0.5, hl: 0.32, ao: 0.5, gloss: 0.35 });
    clip(g, SL, () => {
      serrate(g, S, -3.75, -1.0, -6.3, -3.65, 0.42, 0.12);
      recess(g, rr(0.9, -6.5, 3.55, -5.0, 0.15), S, 0.18);
      cel(g, rr(1.05, -6.35, 3.4, -5.2, 0.1), m.steel, { sh: 0.1, hl: 0.15, gloss: 0.4 });
      lit(g, -3.8, 3.8, -6.25, S, 0.12, 0.6);
      shade(g, -4.0, 3.9, -3.58, S, 0.12, 0.6);
      letter(g, '.50 AE', 0.9, -3.92, 0.6, S.k, 0.6, 700);
    });
    // safety / decocker lever, rear sight
    cel(g, 'M -3.4 -5.0 L -1.6 -5.1 Q -1.3 -4.85 -1.6 -4.6 L -3.4 -4.5 Z', m.steel, { sh: 0.12, hl: 0.15, gloss: 0.3 });
    cel(g, poly([[-3.7, -6.38], [-3.6, -7.05], [-2.5, -7.05], [-2.35, -6.38]]), m.dark, { sh: 0.12, hl: 0.12 });
  }
}

// ARI — stamped-steel SMG, the magazine through the grip ---------------------
function hornet(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) {
    g.save(); g.translate(-0.9, -0.6); g.rotate(0.1);
    const MG = rr(-0.85, 0.3, 0.85, 9.6, 0.15);
    cel(g, MG, m.steel, { sh: 0.4, hl: 0.22, gloss: 0.2 });
    clip(g, MG, () => { stroke(g, 'M 0.1 6.4 L 0.1 9.2', m.steel.k, 0.3, 0.6); stroke(g, 'M 0.2 6.4 L 0.2 9.2', m.steel.l, 0.08, 0.5); });
    cel(g, rr(-1.15, 9.35, 1.15, 10.1, 0.2), m.steel, { sh: 0.2, hl: 0.15, ao: 0.5 });
    g.restore();
  }
  if (!on('body')) return;
  // folding stock, open: two struts from a hinge to the butt plate
  stroke(g, 'M -5.4 -3.6 L -10.3 -3.4', m.steel.k, 0.62); stroke(g, 'M -5.4 -3.6 L -10.3 -3.4', m.steel.m, 0.36);
  stroke(g, 'M -5.4 -1.6 L -10.3 -0.6', m.steel.k, 0.62); stroke(g, 'M -5.4 -1.6 L -10.3 -0.6', m.steel.m, 0.36);
  stroke(g, 'M -5.6 -3.65 L -10.3 -3.45', m.steel.l, 0.08, 0.5);
  cel(g, 'M -10.0 -4.3 L -10.75 -4.3 Q -11.15 -4.3 -11.15 -3.8 L -11.15 0.2 Q -11.15 0.6 -10.75 0.55 L -10.0 0.4 Z', m.poly, { sh: 0.3, hl: 0.18, ao: 0.5 });
  cel(g, dot(-5.5, -2.6, 0.9), m.steel, { sh: 0.25, hl: 0.2, gloss: 0.3 });
  pin(g, m.steel, -5.5, -2.6, 0.32);
  // grip with the grip safety behind it; trigger housing under the receiver
  grip(g, m.poly, -0.9, -0.6, 6.4, 2.7, 0.1, { plain: true });
  cel(g, 'M -2.25 -0.3 L -2.6 0.4 L -2.75 2.6 L -2.3 2.8 L -2.05 0.4 Z', m.steel, { sh: 0.15, hl: 0.12 });
  cel(g, 'M -2.8 -1.0 L 4.4 -1.0 L 4.4 0.0 L 0.1 0.0 L -2.4 0.0 Q -2.8 0.0 -2.8 -0.4 Z', m.poly, { sh: 0.3, hl: 0.15, ao: 0.5 });
  guard(g, m.steel, 0.15, 3.0, -0.05, 1.9, { th: 0.32 });
  trigger(g, m.steel, 1.35, -0.05, 1.3);
  // receiver: a long pressed box with two ribs, the port, the knob on top
  const REC = 'M -5.0 -4.5 L 8.1 -4.5 Q 8.4 -4.5 8.4 -4.2 L 8.4 -1.1 Q 8.4 -0.85 8.1 -0.85 L -5.0 -0.85 Q -5.35 -0.85 -5.35 -1.2 L -5.35 -4.15 Q -5.35 -4.5 -5.0 -4.5 Z';
  cel(g, REC, m.frame, { sh: 0.45, hl: 0.28, ao: 0.5, gloss: 0.2 });
  clip(g, REC, () => {
    for (const y of [-3.3, -2.0]) {
      fill(g, rr(-4.6, y - 0.32, 7.6, y + 0.32, 0.3), m.frame.l, 0.22);
      stroke(g, `M -4.5 ${y + 0.32} L 7.5 ${y + 0.32}`, m.frame.k, 0.12, 0.55);
    }
    recess(g, rr(0.0, -3.95, 2.7, -2.55, 0.2), m.frame, 0.16);
    cel(g, rr(0.15, -3.75, 2.55, -2.8, 0.12), m.frame, { sh: 0.1, hl: 0.15, gloss: 0.4 });
    lit(g, -5.1, 8.2, -4.38, m.frame, 0.12, 0.55);
    for (const x of [-4.6, 7.6]) pin(g, m.frame, x, -1.5, 0.18);
  });
  cel(g, rr(5.2, -5.05, 6.6, -4.45, 0.22), m.steel, { sh: 0.15, hl: 0.15 });
  for (let x = 5.35; x < 6.5; x += 0.24) stroke(g, `M ${x} -5.0 L ${x} -4.5`, m.steel.k, 0.08, 0.6);
  // sight ears front and back
  for (const x of [-4.7, 6.9]) {
    cel(g, poly([[x, -4.45], [x + 0.25, -5.75], [x + 0.65, -5.75], [x + 0.9, -4.45]]), m.steel, { sh: 0.15, hl: 0.12, ao: 0.4 });
    fill(g, rr(x + 0.3, -5.55, x + 0.6, -4.7, 0.08), m.steel.k, 0.8);
  }
  // handguard under the front; barrel nut and stub
  const HG = rr(3.8, -1.25, 7.9, 0.45, 0.35);
  cel(g, HG, m.poly, { sh: 0.35, hl: 0.2, ao: 0.5 });
  clip(g, HG, () => { for (let x = 4.3; x < 7.6; x += 0.55) stroke(g, `M ${x} -1.2 L ${x} 0.45`, m.poly.k, 0.14, 0.55); });
  wrap(g, m, 4.6, 6.0, -1.25, 0.45);
  const NUT = rr(8.35, -3.55, 9.25, -1.65, 0.2);
  cel(g, NUT, m.steel, { sh: 0.2, hl: 0.15, ao: 0.5 });
  clip(g, NUT, () => { for (let y = -3.4; y < -1.7; y += 0.25) stroke(g, `M 8.3 ${y} L 9.3 ${y}`, m.steel.k, 0.07, 0.6); });
  tube(g, m.steel, 9.2, 12.85, -3.05, -2.25, { r: 0.25 });
  fill(g, rr(12.6, -3.0, 12.85, -2.3, 0.08), m.steel.k, 0.8);
  stencil(g, m, -3.8, -1.25, 'V-31', 0.55);
}

// VAŞAK — integrally suppressed SMG ------------------------------------------
function lynx(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) {
    const MAG = 'M 2.55 -0.7 L 4.5 -0.7 L 4.5 0.3 C 4.85 2.7 5.6 5.0 6.6 7.0 L 4.75 7.75 C 3.75 5.6 2.9 3.2 2.55 0.4 Z';
    cel(g, MAG, m.steel, { sh: 0.5, hl: 0.25, ao: 0.5, gloss: 0.2 });
    clip(g, MAG, () => {
      stroke(g, 'M 3.25 1.0 C 3.55 3.2 4.2 5.1 5.0 6.8', m.steel.k, 0.26, 0.55);
      stroke(g, 'M 3.35 0.95 C 3.65 3.15 4.3 5.05 5.1 6.75', m.steel.l, 0.08, 0.45);
    });
    cel(g, 'M 4.55 7.55 L 6.7 6.75 Q 7.0 6.7 7.05 7.0 L 7.15 7.35 Q 7.15 7.6 6.9 7.7 L 4.95 8.5 Q 4.7 8.55 4.65 8.3 Z', m.dark, { sh: 0.2, hl: 0.15, ao: 0.5 });
  }
  if (!on('body')) return;
  // retractable stock: two rails and a curved butt pad
  for (const y of [-3.55, -1.85]) { stroke(g, `M -5.2 ${y} L -12.8 ${y}`, m.steel.k, 0.62); stroke(g, `M -5.2 ${y} L -12.8 ${y}`, m.steel.m, 0.34); stroke(g, `M -5.2 ${y - 0.1} L -12.8 ${y - 0.1}`, m.steel.l, 0.07, 0.5); }
  cel(g, 'M -12.4 -4.4 Q -13.3 -4.6 -13.7 -3.8 L -13.75 0.2 Q -13.6 1.1 -12.6 1.05 L -12.35 -0.6 L -12.35 -3.0 Z', m.poly, { sh: 0.35, hl: 0.2, ao: 0.5 });
  cel(g, rr(-5.9, -4.3, -5.0, -1.1, 0.25), m.steel, { sh: 0.2, hl: 0.15, ao: 0.5 });
  // trigger housing in polymer, its grip with finger grooves, two push pins
  grip(g, m.poly, -1.4, 0.0, 6.0, 2.4, 0.32);
  const TH = 'M -3.6 -1.25 L 2.2 -1.25 L 2.2 -0.3 L -0.5 -0.3 Q -0.9 -0.3 -1.2 0.1 L -2.4 0.05 Q -3.4 -0.1 -3.6 -0.7 Z';
  cel(g, TH, m.poly, { sh: 0.35, hl: 0.2, ao: 0.5 });
  pin(g, m.steel, -3.0, -0.85, 0.2); pin(g, m.steel, 1.7, -0.85, 0.2);
  guard(g, m.poly, -0.55, 2.1, -0.3, 1.9);
  trigger(g, m.steel, 0.75, -0.3, 1.3);
  cel(g, 'M -2.5 -1.2 L -1.6 -1.2 Q -1.4 -0.95 -1.6 -0.7 L -2.5 -0.7 Z', m.steel, { sh: 0.12, hl: 0.15, gloss: 0.3 });
  // magazine well
  cel(g, poly([[2.2, -1.3], [4.65, -1.3], [4.65, -0.15], [4.5, 0.35], [2.4, 0.35], [2.2, -0.15]]), m.frame, { sh: 0.3, hl: 0.18, ao: 0.5 });
  // receiver: pressed sheet with a long flute, port, end cap
  const REC = 'M -5.1 -4.45 L 5.0 -4.45 L 5.0 -1.25 L -5.1 -1.25 Z';
  cel(g, REC, m.frame, { sh: 0.45, hl: 0.28, ao: 0.5, gloss: 0.2 });
  clip(g, REC, () => {
    fill(g, rr(-4.6, -2.75, 4.6, -2.05, 0.3), m.frame.k, 0.45);
    stroke(g, 'M -4.5 -2.08 L 4.5 -2.08', m.frame.l, 0.08, 0.5);
    recess(g, rr(0.0, -4.1, 2.7, -2.95, 0.18), m.frame, 0.16);
    lit(g, -5.0, 4.9, -4.32, m.frame, 0.12, 0.55);
  });
  // cocking tube above the front, its handle angled up
  tube(g, m.steel, 4.6, 9.4, -4.85, -3.75, { r: 0.4 });
  cel(g, 'M 7.6 -4.85 L 8.3 -5.75 Q 8.5 -6.0 8.75 -5.8 L 8.55 -4.85 Z', m.steel, { sh: 0.15, hl: 0.15 });
  // drum rear sight, hooded front sight
  cel(g, rr(-4.4, -4.95, -3.0, -4.4, 0.1), m.steel, { sh: 0.15, hl: 0.12 });
  cel(g, dot(-3.7, -5.55, 0.72), m.dark, { sh: 0.25, hl: 0.2, gloss: 0.3 });
  stroke(g, dot(-3.7, -5.55, 0.42), m.dark.k, 0.1, 0.6);
  const HOOD = `M 8.85 -6.4 L 9.85 -6.4 L 9.9 -4.8 L 8.8 -4.8 Z ${dotR(9.35, -5.75, 0.36)}`;
  cel(g, HOOD, m.steel, { sh: 0.2, hl: 0.15, ao: 0.4 });
  // slim handguard, then the fat can
  const HG = rr(4.9, -3.6, 9.4, -0.55, 0.45);
  const SUP = rr(9.0, -4.35, 17.4, -0.85, 1.1);
  cel(g, SUP, m.dark, { sh: 0.5, hl: 0.28, ao: 0.5, gloss: 0.25 });
  clip(g, SUP, () => {
    fill(g, rr(9.0, -3.85, 17.4, -3.25, 0.05), m.dark.l, 0.3);
    fill(g, rr(9.0, -1.7, 17.4, -0.85, 0.05), m.dark.k, 0.45);
    for (const x of [11.0, 15.6]) stroke(g, `M ${x} -4.4 L ${x} -0.8`, m.dark.k, 0.1, 0.6);
    fill(g, dot(17.1, -2.6, 0.38), m.dark.k, 0.9);
  });
  cel(g, HG, m.poly, { sh: 0.4, hl: 0.22, ao: 0.5 });
  clip(g, HG, () => { for (let x = 5.6; x < 9.0; x += 0.7) recess(g, rr(x, -2.8, x + 0.38, -1.2, 0.18), m.poly, 0.1); });
  stencil(g, m, -3.8, -1.45, 'V-07', 0.55);
}

// BURÇ BR — burst-fire battle rifle: pressed steel, olive furniture ----------
function bastion(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  const F = m.olive;
  if (on('mag')) {
    const MAG = 'M 2.9 -0.6 L 5.6 -0.6 L 5.65 0.4 L 6.25 7.35 L 3.6 7.6 L 2.95 0.4 Z';
    cel(g, MAG, m.steel, { sh: 0.5, hl: 0.25, ao: 0.5, gloss: 0.15 });
    clip(g, MAG, () => {
      for (const y of [1.6, 3.2, 4.8, 6.3]) { stroke(g, `M 2.8 ${y} L 6.4 ${y - 0.12}`, m.steel.k, 0.28, 0.5); stroke(g, `M 2.8 ${y - 0.16} L 6.4 ${y - 0.28}`, m.steel.l, 0.08, 0.45); }
    });
    cel(g, 'M 3.4 7.45 L 6.4 7.2 Q 6.65 7.2 6.68 7.45 L 6.72 7.85 Q 6.72 8.08 6.48 8.1 L 3.55 8.35 Q 3.32 8.36 3.3 8.12 Z', m.steel, { sh: 0.2, hl: 0.15, ao: 0.5 });
  }
  if (!on('body')) return;
  // fixed stock
  const STOCK = 'M -6.3 -4.45 L -17.5 -4.75 Q -17.85 -4.75 -17.85 -4.35 L -17.85 2.15 Q -17.85 2.55 -17.45 2.45 L -12.0 0.55 L -6.3 -0.55 Z';
  cel(g, STOCK, F, { sh: 0.65, hl: 0.3, ao: 0.6 });
  clip(g, STOCK, () => { panel(g, 'M -16.2 -3.6 L -8.0 -3.35 L -8.0 -1.6 L -16.2 -0.6 Z', F); lit(g, -17.5, -6.5, -4.55, F, 0.1, 0.45); });
  cel(g, rr(-18.55, -4.95, -17.75, 2.65, 0.25), m.dark, { sh: 0.25, hl: 0.15, ao: 0.5 });
  swivel(g, m.steel, -15.4, 1.75, 0.45);
  // trigger pack with the grip, push pins, selector
  grip(g, F, -1.6, 0.4, 6.4, 2.6, 0.34);
  const PACK = 'M -4.6 -1.6 L 2.45 -1.6 L 2.45 -0.2 L -0.6 -0.2 Q -1.0 -0.2 -1.3 0.4 L -2.6 0.35 Q -4.2 0.1 -4.6 -0.6 Z';
  cel(g, PACK, F, { sh: 0.35, hl: 0.2, ao: 0.5 });
  pin(g, m.steel, -3.9, -1.0, 0.22); pin(g, m.steel, 1.85, -1.0, 0.22);
  cel(g, 'M -3.1 -1.5 L -2.0 -1.5 Q -1.75 -1.2 -2.0 -0.95 L -3.1 -0.95 Z', m.steel, { sh: 0.12, hl: 0.15, gloss: 0.3 });
  guard(g, F, -0.7, 2.45, -0.2, 2.1);
  trigger(g, m.steel, 0.8, -0.2, 1.35);
  cel(g, poly([[2.45, -1.7], [5.85, -1.7], [5.85, -0.2], [5.65, 0.45], [2.95, 0.45], [2.45, -0.2]]), m.frame, { sh: 0.3, hl: 0.18, ao: 0.5 });
  cel(g, 'M 2.55 0.35 L 2.95 0.35 L 2.85 1.15 L 2.45 1.1 Z', m.steel, { sh: 0.1, hl: 0.1 });
  // receiver: pressed sheet, flutes, a slot of a port, the end cap
  const REC = 'M -6.3 -4.8 L 7.4 -4.8 L 7.4 -1.6 L -6.3 -1.6 Z';
  cel(g, REC, m.frame, { sh: 0.45, hl: 0.28, ao: 0.5, gloss: 0.2 });
  clip(g, REC, () => {
    fill(g, rr(-5.8, -4.35, 7.0, -3.95, 0.2), m.frame.k, 0.45);
    stroke(g, 'M -5.7 -3.98 L 6.9 -3.98', m.frame.l, 0.08, 0.5);
    recess(g, rr(0.6, -3.6, 3.9, -2.75, 0.2), m.frame, 0.15);
    lit(g, -6.2, 7.3, -4.66, m.frame, 0.12, 0.55);
    for (const x of [-5.6, 6.7]) pin(g, m.steel, x, -2.2, 0.17);
  });
  // cocking tube over the handguard, its handle, hooded front sight
  tube(g, m.steel, 7.2, 15.4, -4.85, -3.45, { r: 0.55 });
  cel(g, 'M 9.3 -4.85 L 9.8 -5.85 Q 10.0 -6.1 10.25 -5.9 L 10.15 -4.85 Z', m.steel, { sh: 0.15, hl: 0.15 });
  const HOOD = `M 14.5 -6.6 L 15.65 -6.6 L 15.75 -4.75 L 14.45 -4.75 Z ${dotR(15.1, -5.85, 0.4)}`;
  cel(g, HOOD, m.steel, { sh: 0.2, hl: 0.15, ao: 0.4 });
  // drum rear sight
  cel(g, rr(-4.8, -5.3, -2.7, -4.75, 0.1), m.steel, { sh: 0.15, hl: 0.12 });
  cel(g, dot(-3.75, -6.0, 0.82), m.dark, { sh: 0.25, hl: 0.2, gloss: 0.3 });
  stroke(g, dot(-3.75, -6.0, 0.5), m.dark.k, 0.1, 0.6);
  // wide handguard with vent holes
  const HG = 'M 7.4 -3.45 L 14.6 -3.45 Q 15.1 -3.45 15.1 -2.95 L 15.1 -0.6 Q 15.1 -0.15 14.6 -0.15 L 7.9 -0.15 Q 7.4 -0.15 7.4 -0.6 Z';
  cel(g, HG, F, { sh: 0.45, hl: 0.25, ao: 0.5 });
  clip(g, HG, () => { for (let x = 8.4; x < 14.4; x += 1.05) for (const y of [-2.35, -1.15]) recess(g, dot(x + (y > -2 ? 0.5 : 0), y, 0.3), F, 0.1); });
  wrap(g, m, 12.0, 13.4, -3.45, -0.15);
  // long barrel, slotted flash hider
  tube(g, m.steel, 15.1, 24.7, -3.15, -2.1, { r: 0.3 });
  const FH = rr(24.4, -3.55, 27.6, -1.65, 0.3);
  cel(g, FH, m.steel, { sh: 0.25, hl: 0.2, ao: 0.5, gloss: 0.25 });
  clip(g, FH, () => { for (const y of [-3.15, -2.45]) fill(g, rr(25.1, y - 0.18, 27.3, y + 0.18, 0.15), m.steel.k); });
  stencil(g, m, -15.2, -0.9, 'VANTA', 0.7);
}

// TESTERE-20 — magazine-fed automatic shotgun on a rifle's action ------------
function saw(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) {
    // feed tower and the drum
    cel(g, rr(2.7, -0.7, 6.2, 1.9, 0.25), m.poly, { sh: 0.35, hl: 0.2, ao: 0.5 });
    const DR = dot(4.45, 5.0, 3.85);
    cel(g, DR, m.poly, { sh: 0.6, hl: 0.3, ao: 0.6 });
    clip(g, DR, () => {
      stroke(g, dot(4.45, 5.0, 3.1), m.poly.k, 0.22, 0.55);
      stroke(g, dot(4.4, 4.93, 3.1), m.poly.l, 0.08, 0.35);
      for (let a = 0; a < 6.28; a += 0.785) stroke(g, `M ${4.45 + Math.cos(a) * 1.4} ${5.0 + Math.sin(a) * 1.4} L ${4.45 + Math.cos(a) * 2.8} ${5.0 + Math.sin(a) * 2.8}`, m.poly.k, 0.16, 0.45);
    });
    cel(g, dot(4.45, 5.0, 1.05), m.steel, { sh: 0.25, hl: 0.2, gloss: 0.3 });
    cel(g, rr(4.05, 4.1, 4.85, 5.9, 0.15), m.steel, { sh: 0.15, hl: 0.12 });
  }
  if (!on('body')) return;
  // fixed stock with a steel butt plate
  const STOCK = 'M -5.6 -4.15 L -16.1 -3.45 Q -16.45 -3.42 -16.45 -3.05 L -16.45 2.75 Q -16.45 3.1 -16.1 3.05 L -11.0 1.25 L -5.4 0.4 Z';
  cel(g, STOCK, m.poly, { sh: 0.7, hl: 0.32, ao: 0.6 });
  clip(g, STOCK, () => { panel(g, 'M -15.0 -2.6 L -8.0 -2.95 L -8.0 -1.1 L -15.0 0.4 Z', m.poly); lit(g, -16.0, -5.8, -3.75, m.poly, 0.1, 0.4); });
  cel(g, rr(-17.1, -3.6, -16.35, 3.25, 0.2), m.steel, { sh: 0.25, hl: 0.15, ao: 0.5 });
  swivel(g, m.steel, -14.2, 2.4, 0.45);
  grip(g, m.poly, -1.6, 0.5, 6.2, 2.4, 0.42, { plain: true });
  // receiver: pressed sheet, trunnion rivets, the long safety lever
  const REC = 'M -5.8 -4.1 L 7.4 -4.1 L 7.4 0.5 L -5.0 0.5 Q -5.8 0.5 -5.8 -0.3 Z';
  cel(g, REC, m.frame, { sh: 0.5, hl: 0.3, ao: 0.5, gloss: 0.2 });
  clip(g, REC, () => {
    recess(g, rr(0.0, -4.15, 4.9, -3.0, 0.15), m.frame, 0.18);
    cel(g, rr(0.2, -4.0, 4.7, -3.15, 0.1), m.steel, { sh: 0.1, hl: 0.15, gloss: 0.45 });
    shade(g, -5.8, 7.4, 0.42, m.frame, 0.12, 0.5);
    for (const [x, y] of [[5.5, -1.6], [6.3, -1.6], [5.5, -0.7], [6.3, -0.7], [-5.1, -1.3], [-4.4, -1.3]]) pin(g, m.steel, x, y, 0.17);
  });
  // charging handle at the front of the port
  cel(g, rr(4.0, -3.95, 5.15, -3.15, 0.3), m.steel, { sh: 0.15, hl: 0.15, gloss: 0.35 });
  cel(g, 'M -5.3 -3.25 L -4.6 -3.25 L 3.2 -3.0 Q 3.65 -2.95 3.6 -2.55 L 3.5 -2.2 L -4.6 -2.55 Q -5.3 -2.6 -5.3 -2.9 Z', m.steel, { sh: 0.2, hl: 0.18, ao: 0.45, gloss: 0.3 });
  pin(g, m.steel, -4.75, -2.85, 0.24);
  // ribbed dust cover on top
  const DC = 'M -5.6 -5.05 Q -5.6 -5.35 -5.2 -5.35 L 5.9 -5.35 L 6.2 -4.1 L -5.6 -4.1 Z';
  cel(g, DC, m.frame, { sh: 0.3, hl: 0.3, ao: 0.5, gloss: 0.3 });
  clip(g, DC, () => { for (const x of [-3.0, 0.5, 3.6]) { stroke(g, `M ${x} -5.4 L ${x} -4.1`, m.frame.k, 0.24, 0.55); stroke(g, `M ${x + 0.16} -5.4 L ${x + 0.16} -4.1`, m.frame.l, 0.08, 0.4); } });
  cel(g, dot(-5.65, -4.75, 0.35), m.steel, { sh: 0.12, hl: 0.12 });
  // rear sight block with its leaf
  cel(g, poly([[5.9, -4.1], [6.0, -5.55], [7.5, -5.55], [7.6, -4.1]]), m.frame, { sh: 0.25, hl: 0.2, ao: 0.45 });
  cel(g, poly([[6.2, -5.55], [7.6, -5.85], [7.6, -5.55]]), m.dark, { sh: 0.1, hl: 0.1 });
  guard(g, m.steel, -1.1, 2.4, 0.5, 1.95, { th: 0.32 });
  trigger(g, m.steel, 0.65, 0.5, 1.35);
  cel(g, 'M 2.5 0.45 L 3.0 0.45 L 3.25 1.4 L 2.85 1.5 Z', m.steel, { sh: 0.1, hl: 0.1 });
  // gas tube and its cover, lower handguard, gas block, front sight block
  const GT = rr(7.4, -5.25, 18.6, -3.95, 0.55);
  cel(g, GT, m.poly, { sh: 0.4, hl: 0.25, ao: 0.5 });
  const LH = 'M 7.4 -3.85 L 16.4 -3.85 Q 16.8 -3.85 16.8 -3.4 L 16.8 -0.1 Q 16.8 0.45 16.2 0.45 L 7.4 0.45 Z';
  cel(g, LH, m.poly, { sh: 0.5, hl: 0.25, ao: 0.5 });
  clip(g, LH, () => { for (let x = 8.4; x < 16; x += 1.2) recess(g, rr(x, -2.6, x + 0.55, -0.8, 0.25), m.poly, 0.12); });
  wrap(g, m, 13.6, 15.2, -3.85, 0.45);
  tube(g, m.steel, 16.6, 24.2, -3.45, -1.75, { r: 0.5 });
  cel(g, rr(18.4, -5.3, 20.0, -1.6, 0.3), m.steel, { sh: 0.3, hl: 0.2, ao: 0.5 });
  cel(g, poly([[21.9, -1.6], [21.9, -3.6], [22.3, -5.75], [23.1, -5.75], [23.5, -3.6], [23.5, -1.6]]), m.steel, { sh: 0.3, hl: 0.2, ao: 0.5 });
  fill(g, rr(22.45, -5.6, 22.95, -4.4, 0.1), m.steel.k, 0.85);
  // ported choke
  const MZ = rr(23.9, -3.75, 26.05, -1.45, 0.35);
  cel(g, MZ, m.steel, { sh: 0.25, hl: 0.2, ao: 0.5, gloss: 0.25 });
  clip(g, MZ, () => { for (const x of [24.35, 25.05]) fill(g, rr(x, -3.8, x + 0.42, -2.9, 0.15), m.steel.k); });
  stencil(g, m, -14.4, -0.6, 'V-12', 0.7);
}

// KARTAL — bolt-action hunting rifle, walnut ---------------------------------
function longbow(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) {
    const MAG = rr(2.6, -0.4, 5.6, 1.75, 0.2);
    cel(g, MAG, m.steel, { sh: 0.3, hl: 0.2, ao: 0.5, gloss: 0.25 });
    clip(g, MAG, () => lit(g, 2.7, 5.5, 1.5, m.steel, 0.1, 0.4));
  }
  if (!on('body')) return;
  const W = m.wood;
  // long barrel tapering to a radial brake
  cel(g, 'M 9.4 -3.55 L 33.8 -3.3 L 33.8 -2.3 L 9.4 -2.05 Z', m.steel, { sh: 0.25, hl: 0.15, ao: 0.4, gloss: 0.3 });
  stroke(g, 'M 9.6 -3.3 L 33.6 -3.1', m.steel.l, 0.12, 0.45);
  const BR = rr(33.5, -3.75, 37.6, -1.85, 0.35);
  cel(g, BR, m.steel, { sh: 0.25, hl: 0.2, ao: 0.5, gloss: 0.25 });
  clip(g, BR, () => { for (const x of [34.1, 35.0, 35.9, 36.8]) fill(g, dot(x, -2.8, 0.28), m.steel.k); });
  // walnut stock: Monte Carlo comb, grip with a cap, long forend
  const STOCK = 'M 9.6 -3.0 L -5.4 -3.3 C -7.0 -3.4 -8.4 -4.6 -9.6 -4.75 L -17.4 -4.75 C -18.6 -4.75 -20.0 -4.4 -21.0 -4.15 L -21.0 2.75 Q -20.5 2.95 -20.0 2.75 L -14.0 1.2 L -8.8 1.15 C -6.4 1.15 -4.4 2.2 -3.3 4.1 L -2.5 5.0 Q -2.25 5.3 -1.85 5.2 L 0.25 4.7 Q 0.6 4.6 0.45 4.2 L -0.25 1.05 L 6.4 1.05 L 17.4 -0.35 Q 18.0 -0.5 18.0 -1.2 L 18.0 -2.3 Q 17.95 -2.95 17.3 -2.95 Z';
  cel(g, STOCK, W, { sh: 0.75, hl: 0.35, ao: 0.6, gloss: 0.14 });
  clip(g, STOCK, () => {
    const G = 'M -3.7 1.35 L -0.85 1.1 L -0.3 3.7 L -2.3 4.15 Z', FE = 'M 8.0 -2.0 L 14.8 -2.15 L 14.8 0.0 L 8.0 0.6 Z';
    for (const C of [G, FE]) {
      clip(g, C, () => { for (let i = -24; i < 24; i += 0.32) { stroke(g, `M ${i} -3 L ${i + 6} 6`, W.k, 0.07, 0.55); stroke(g, `M ${i + 6} -3 L ${i} 6`, W.k, 0.07, 0.55); } });
      stroke(g, C, W.d, 0.08, 0.6);
    }
    stroke(g, 'M -9.4 -4.5 L -17.4 -4.5', W.l, 0.16, 0.4);
    stroke(g, 'M 6.6 -2.7 L 17.4 -2.65', W.l, 0.12, 0.35);
  });
  fill(g, 'M -2.45 4.85 L 0.35 4.15 L 0.47 4.3 Q 0.55 4.6 0.2 4.7 L -1.85 5.2 Q -2.25 5.3 -2.5 5.0 Z', m.dark.d);
  cel(g, rr(-21.85, -4.3, -20.95, 2.95, 0.3), m.dark, { sh: 0.25, hl: 0.15, ao: 0.5 });
  fill(g, rr(-21.05, -4.25, -20.9, 2.9, 0.04), '#d9d4c8', 0.85);
  swivel(g, m.steel, -17.2, 1.95, 0.45); swivel(g, m.steel, 14.6, -0.25, 0.45);
  // bottom metal: guard and the flush magazine release
  guard(g, m.steel, -0.6, 2.4, 1.0, 1.75);
  trigger(g, m.steel, 0.8, 1.0, 1.15);
  cel(g, rr(2.35, 0.75, 6.2, 1.3, 0.2), m.steel, { sh: 0.15, hl: 0.12 });
  // receiver: a round action, an open port with the bright bolt, the shroud
  const REC = rr(-6.1, -4.85, 6.4, -2.55, 0.9);
  cel(g, REC, m.frame, { sh: 0.4, hl: 0.3, ao: 0.5, gloss: 0.35 });
  clip(g, REC, () => {
    recess(g, rr(-1.4, -4.7, 3.2, -3.5, 0.3), m.frame, 0.16);
    tube(g, m.stainless || m.steel, -1.3, 3.1, -4.55, -3.65, { r: 0.4, gloss: 0.5 });
    lit(g, -5.5, 5.8, -4.55, m.frame, 0.12, 0.5);
  });
  cel(g, 'M -6.0 -4.65 L -7.2 -4.45 Q -7.6 -4.0 -7.2 -3.1 L -6.0 -2.85 Z', m.frame, { sh: 0.25, hl: 0.2, ao: 0.5, gloss: 0.3 });
  // the bolt handle, swept down, with a knurled knob
  stroke(g, 'M -3.4 -3.6 Q -3.6 -2.2 -4.4 -1.0', m.steel.k, 0.85, 0.9);
  stroke(g, 'M -3.4 -3.6 Q -3.6 -2.2 -4.4 -1.0', m.steel.m, 0.55);
  stroke(g, 'M -3.3 -3.5 Q -3.5 -2.2 -4.25 -1.05', m.steel.l, 0.12, 0.5);
  cel(g, dot(-4.55, -0.65, 0.85), m.steel, { sh: 0.3, hl: 0.25, ao: 0.5, gloss: 0.35 });
  clip(g, dot(-4.55, -0.65, 0.85), () => { for (let x = -5.4; x < -3.7; x += 0.22) stroke(g, `M ${x} -1.5 L ${x + 0.3} 0.2`, m.steel.k, 0.06, 0.55); });
  // a long scope on high rings
  scope(g, m, { x0: -4.6, x1: 9.0, y: -7.7, r: 0.8, eye: 1.35, obj: 2.05, rings: [-2.8, 4.0], ringY: -4.7 });
}

// ÖRS LMG — belt-fed light machine gun ---------------------------------------
function anvil(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) {
    // a soft 100-round pouch in olive nylon, the belt climbing out of it
    const P = 'M -1.0 0.6 Q -1.0 0.0 -0.4 0.0 L 6.2 0.0 Q 6.8 0.0 6.8 0.6 L 6.9 6.7 Q 6.9 7.5 6.1 7.5 L -0.3 7.5 Q -1.1 7.5 -1.1 6.7 Z';
    cel(g, P, { ...m.olive, tex: 'nylon', ta: 0.55 }, { sh: 0.7, hl: 0.3, ao: 0.6 });
    clip(g, P, () => {
      fill(g, rr(-1.2, 0.0, 7.0, 2.0, 0.3), m.olive.d, 0.55);
      stroke(g, 'M -1.0 2.0 Q 2.9 2.4 6.8 2.0', m.olive.k, 0.18, 0.6);
      for (const y of [3.4, 4.6, 5.8]) stroke(g, `M -1.1 ${y} L 6.9 ${y}`, m.olive.k, 0.14, 0.45);
      for (const x of [0.9, 2.9, 4.9]) stroke(g, `M ${x} 2.2 L ${x} 7.4`, m.olive.k, 0.12, 0.4);
    });
    cel(g, rr(2.2, 1.1, 3.6, 1.7, 0.12), m.dark, { sh: 0.1, hl: 0.12 });
    for (let i = 0; i < 4; i++) {
      const x = 4.6 + i * 0.42, y = 0.2 - i * 0.12;
      cel(g, rr(x, y - 1.2, x + 0.36, y, 0.08), m.brass, { sh: 0.2, hl: 0.25, gloss: 0.4 });
      fill(g, rr(x - 0.05, y - 0.55, x + 0.42, y - 0.35, 0.04), m.steel.k, 0.9);
    }
  }
  if (!on('body')) return;
  const STOCK = 'M -6.9 -4.3 L -17.9 -4.65 Q -18.25 -4.65 -18.25 -4.25 L -18.25 2.45 Q -18.25 2.85 -17.85 2.7 L -12.4 0.5 L -6.9 -0.3 Z';
  cel(g, STOCK, m.poly, { sh: 0.7, hl: 0.32, ao: 0.6 });
  clip(g, STOCK, () => { panel(g, 'M -16.6 -3.6 L -9.0 -3.4 L -9.0 -1.4 L -16.6 0.3 Z', m.poly); lit(g, -17.8, -7.0, -4.45, m.poly, 0.1, 0.4); });
  cel(g, rr(-19.0, -4.85, -18.15, 2.95, 0.25), m.dark, { sh: 0.25, hl: 0.15, ao: 0.5 });
  swivel(g, m.steel, -16.0, 1.9, 0.45);
  grip(g, m.poly, -2.6, 0.6, 6.4, 2.6, 0.34);
  cel(g, 'M -4.6 -0.2 L 1.8 -0.2 L 1.8 0.6 L -1.6 0.6 Q -2.0 0.6 -2.3 1.1 L -3.6 1.0 Q -4.5 0.8 -4.6 0.3 Z', m.poly, { sh: 0.3, hl: 0.15, ao: 0.5 });
  guard(g, m.steel, -1.85, 1.35, 0.6, 1.85, { th: 0.34 });
  trigger(g, m.steel, -0.35, 0.6, 1.3);
  // receiver, the feed cover on top with its sight, the link port, the handle
  const REC = 'M -7.0 -4.7 L 8.4 -4.7 L 8.4 0.2 L -7.0 0.2 Z';
  cel(g, REC, m.frame, { sh: 0.5, hl: 0.3, ao: 0.5, gloss: 0.2 });
  clip(g, REC, () => {
    fill(g, rr(-6.6, -3.25, 8.0, -2.85, 0.15), m.frame.k, 0.45);
    stroke(g, 'M -6.5 -2.88 L 7.9 -2.88', m.frame.l, 0.08, 0.5);
    recess(g, rr(2.2, -4.45, 5.0, -3.55, 0.2), m.frame, 0.15);
    shade(g, -7.0, 8.4, 0.12, m.frame, 0.12, 0.5);
    for (const [x, y] of [[-6.3, -1.0], [-5.5, -1.0], [7.7, -1.0], [7.7, -2.0]]) pin(g, m.steel, x, y, 0.17);
  });
  const COV = 'M -2.8 -4.7 L -2.4 -6.0 L 8.0 -6.0 Q 8.5 -6.0 8.5 -5.5 L 8.5 -4.7 Z';
  cel(g, COV, m.frame, { sh: 0.3, hl: 0.3, ao: 0.5, gloss: 0.25 });
  clip(g, COV, () => { for (let x = 0.0; x < 8; x += 1.6) stroke(g, `M ${x} -6.05 L ${x} -4.7`, m.frame.k, 0.12, 0.45); });
  cel(g, dot(-2.4, -5.0, 0.36), m.steel, { sh: 0.12, hl: 0.12 });
  cel(g, poly([[-1.9, -6.0], [-1.75, -6.85], [-0.55, -6.85], [-0.4, -6.0]]), m.dark, { sh: 0.12, hl: 0.12 });
  cel(g, rr(5.6, -2.75, 7.4, -1.7, 0.4), m.steel, { sh: 0.15, hl: 0.15, gloss: 0.35 });
  // handguard, heat shield, carry handle, gas cylinder, folded bipod
  const HG = 'M 8.4 -3.5 L 13.6 -3.5 Q 14.0 -3.5 14.0 -3.0 L 14.0 0.0 Q 14.0 0.4 13.6 0.4 L 8.4 0.4 Z';
  cel(g, HG, m.poly, { sh: 0.45, hl: 0.22, ao: 0.5 });
  clip(g, HG, () => { for (let x = 9.0; x < 13.6; x += 0.6) stroke(g, `M ${x} -3.5 L ${x} 0.4`, m.poly.k, 0.16, 0.5); });
  tube(g, m.steel, 8.4, 27.8, -3.65, -2.35, { r: 0.35 });
  const HS = rr(8.4, -4.75, 14.4, -3.5, 0.3);
  cel(g, HS, m.dark, { sh: 0.3, hl: 0.25, ao: 0.5 });
  clip(g, HS, () => { for (let x = 9.0; x < 14; x += 0.75) recess(g, dot(x, -4.1, 0.22), m.dark, 0.06); });
  tube(g, m.steel, 14.0, 22.4, -2.25, -0.9, { r: 0.5 });
  cel(g, rr(21.9, -2.45, 23.0, -0.7, 0.2), m.steel, { sh: 0.2, hl: 0.15, ao: 0.5 });
  for (const y of [-0.6, -0.15]) tube(g, m.dark, 14.2, 21.4, y - 0.2, y + 0.2, { r: 0.18, gloss: 0.15 });
  cel(g, rr(20.8, -0.85, 22.0, 0.15, 0.25), m.dark, { sh: 0.2, hl: 0.15 });
  stroke(g, 'M 11.4 -4.75 L 11.9 -7.4 L 15.2 -7.4 L 15.7 -4.75', m.dark.k, 0.95);
  stroke(g, 'M 11.4 -4.75 L 11.9 -7.4 L 15.2 -7.4 L 15.7 -4.75', m.dark.m, 0.6);
  stroke(g, 'M 11.95 -7.48 L 15.15 -7.48', m.dark.l, 0.12, 0.5);
  cel(g, rr(25.5, -5.5, 26.4, -3.6, 0.15), m.steel, { sh: 0.15, hl: 0.12, ao: 0.4 });
  const FH = rr(27.4, -3.95, 29.6, -2.05, 0.3);
  cel(g, FH, m.steel, { sh: 0.25, hl: 0.2, ao: 0.5, gloss: 0.25 });
  clip(g, FH, () => { for (const x of [27.9, 28.6]) fill(g, rr(x, -4.0, x + 0.35, -3.1, 0.12), m.steel.k); });
  wrap(g, m, 18.0, 19.4, -3.7, -2.3);
}

// TOKMAK GL — revolving grenade launcher -------------------------------------
function thumper(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (!on('body')) return;
  const F = m.olive;
  // stock on a tube
  tube(g, m.metal, -9.8, -5.5, -3.1, -1.8, { r: 0.55 });
  const STOCK = 'M -14.75 -4.2 L -10.1 -3.85 Q -9.5 -3.8 -9.45 -3.2 L -9.4 -1.6 Q -9.4 -1.2 -9.8 -1.05 L -14.1 1.5 Q -14.75 1.8 -14.95 1.2 L -14.95 -3.9 Q -14.95 -4.2 -14.75 -4.2 Z';
  cel(g, STOCK, F, { sh: 0.6, hl: 0.3, ao: 0.6 });
  clip(g, STOCK, () => panel(g, 'M -14.1 -3.3 L -10.4 -3.05 L -10.4 -2.0 L -14.1 -0.4 Z', F));
  cel(g, rr(-15.6, -4.4, -14.85, 1.8, 0.25), m.dark, { sh: 0.25, hl: 0.15, ao: 0.5 });
  // rear frame with the grip and trigger; its back rises to carry the rail
  grip(g, F, -1.6, 0.4, 6.0, 2.6, 0.32);
  const FR = 'M -5.6 -4.2 L -1.4 -4.2 Q -0.6 -5.7 0.6 -5.7 L 2.9 -5.7 L 2.9 0.4 L -0.5 0.4 Q -0.9 0.4 -1.2 0.9 L -2.6 0.8 Q -4.6 0.5 -5.6 -0.6 Z';
  cel(g, FR, m.metal, { sh: 0.45, hl: 0.25, ao: 0.5, gloss: 0.15 });
  clip(g, FR, () => {
    lit(g, -5.4, -1.6, -4.05, m.metal, 0.12, 0.5); lit(g, 0.4, 2.8, -5.55, m.metal, 0.12, 0.5);
    recess(g, rr(-4.6, -3.2, -1.4, -1.3, 0.3), m.metal, 0.15, 0.4);
    pin(g, m.steel, -4.4, -0.2, 0.22); pin(g, m.steel, 1.9, -1.0, 0.22);
  });
  guard(g, m.metal, -1.0, 2.3, 0.4, 1.85);
  trigger(g, m.steel, 0.55, 0.4, 1.3);
  // top strap with a rail, bottom strap and its hinge, front plate
  cel(g, rr(0.4, -6.7, 13.1, -5.55, 0.2), m.metal, { sh: 0.25, hl: 0.2, ao: 0.5 });
  rail(g, m.metal, 0.6, 12.8, -6.7);
  cel(g, rr(2.4, 1.3, 13.1, 2.05, 0.25), m.metal, { sh: 0.2, hl: 0.15, ao: 0.5 });
  cel(g, dot(12.6, 1.7, 0.55), m.steel, { sh: 0.15, hl: 0.15, gloss: 0.3 });
  // the cylinder: a drum lit along its upper curve, two flutes between its
  // chambers, the cam track cut round its back, chamfered ends
  const CY = rr(2.9, -5.6, 11.7, 1.35, 0.45);
  cel(g, CY, m.frame, { sh: 0.4, hl: 0.25, ao: 0.6, gloss: 0.2 });
  clip(g, CY, () => {
    const gr = g.createLinearGradient(0, -5.6, 0, 1.35);
    gr.addColorStop(0, 'rgba(0,0,0,0.35)'); gr.addColorStop(0.18, 'rgba(255,248,236,0.16)'); gr.addColorStop(0.32, 'rgba(255,248,236,0.05)');
    gr.addColorStop(0.7, 'rgba(0,0,0,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = gr; g.fillRect(2.9, -5.6, 8.8, 6.95);
    for (const y of [-3.05, -0.55]) {
      const FL = rr(5.6, y - 0.5, 11.2, y + 0.5, 0.5);
      fill(g, FL, m.frame.k, 0.55);
      clip(g, FL, () => { fill(g, rr(5.6, y - 0.5, 11.2, y - 0.05, 0.4), m.frame.k, 0.6); stroke(g, `M 5.9 ${y + 0.38} L 10.9 ${y + 0.38}`, m.frame.l, 0.12, 0.45); });
    }
    for (let i = 0; i < 3; i++) {
      const x = 3.5 + i * 0.75;
      stroke(g, `M ${x} -5.6 C ${x + 0.5} -3.4 ${x + 0.9} -1.6 ${x + 1.4} 1.4`, m.frame.k, 0.26, 0.7);
      stroke(g, `M ${x + 0.16} -5.6 C ${x + 0.66} -3.4 ${x + 1.06} -1.6 ${x + 1.56} 1.4`, m.frame.l, 0.07, 0.4);
    }
    for (const x of [3.05, 11.55]) stroke(g, `M ${x} -5.6 L ${x} 1.4`, m.frame.l, 0.16, 0.35);
  });
  cel(g, rr(12.4, -6.7, 13.4, 2.05, 0.3), m.metal, { sh: 0.25, hl: 0.15, ao: 0.5 });
  // the wide barrel and its crown
  const BAR = rr(13.2, -5.25, 19.6, -0.35, 0.5);
  cel(g, BAR, m.frame, { sh: 0.45, hl: 0.3, ao: 0.5, gloss: 0.25 });
  clip(g, BAR, () => {
    fill(g, rr(13.2, -4.85, 19.6, -4.1, 0.1), m.frame.l, 0.3);
    fill(g, rr(13.2, -1.3, 19.6, -0.35, 0.1), m.frame.k, 0.45);
    stroke(g, 'M 15.4 -5.3 L 15.4 -0.3', m.frame.k, 0.12, 0.6);
  });
  fill(g, rr(19.25, -4.9, 19.65, -0.7, 0.15), m.frame.k, 0.9);
  wrap(g, m, 16.6, 18.2, -5.25, -0.35);
  // the front grip
  g.save(); g.translate(14.3, -0.4); g.rotate(-0.06);
  const FG = 'M -1.05 0 L 1.05 0 C 1.2 1.4 1.0 2.9 1.25 4.2 Q 1.3 5.2 0.4 5.25 L -0.7 5.25 Q -1.3 5.2 -1.25 4.6 C -1.15 3.0 -1.15 1.4 -1.05 0 Z';
  cel(g, FG, F, { sh: 0.45, hl: 0.25, ao: 0.5 });
  clip(g, FG, () => { for (let y = 1.2; y < 4.8; y += 0.6) stroke(g, `M -1.3 ${y} L 1.3 ${y}`, F.k, 0.12, 0.45); });
  g.restore();
  // a holographic sight on the rail
  const HB = 'M 1.2 -6.95 L 6.4 -6.95 L 6.4 -8.1 Q 6.4 -9.4 5.4 -9.4 L 2.1 -9.4 Q 1.2 -9.4 1.2 -8.6 Z';
  cel(g, HB, m.dark, { sh: 0.3, hl: 0.25, ao: 0.5, gloss: 0.2 });
  clip(g, HB, () => { fill(g, rr(2.2, -9.1, 5.6, -7.5, 0.25), m.glass.d); fill(g, rr(2.4, -8.95, 4.0, -8.3, 0.15), m.glass.l, 0.55); });
  for (const x of [1.9, 5.7]) screw(g, m.steel, x, -7.35, 0.2);
  stencil(g, m, -14.3, -0.9, 'V-40', 0.7);
}

// Rig points (weapon space):
//   eject   ejection port; magAxis: unit pull-out direction; magGrab: where a
//   hand holds the mag; magPull: distance until it clears the gun; slide /
//   pump: travel; charge: charging handle or slide grab; port: shell port.
export const WEAPONS = {
  wren9: { id: 'wren9', name: 'SERÇE-9', cls: 'TABANCA', paint: wren, box: [-4, -7, 7, 5], gripB: [1.0, 0.6], muzzle: [6.4, -4.2],
    parts: ['mag', 'body', 'slide'], eject: [2.6, -4.9], casing: 'pistol', magAxis: [-0.218, 0.976], magGrab: [-2.3, 4.0], magPull: 7, slide: 2.4, charge: [-2.0, -4.4] },
  kestrel: { id: 'kestrel', name: 'KERKENEZ AR', cls: 'TÜFEK', paint: kestrel, box: [-17, -9, 25, 10], gripB: [12.0, -0.6], muzzle: [24.4, -2.5],
    parts: ['mag', 'body'], eject: [2.2, -3.0], casing: 'rifle', magAxis: [0.27, 0.963], magGrab: [6.3, 5.2], magPull: 9.5, charge: [-6.3, -4.1] },
  ramrod: { id: 'ramrod', name: 'HARBİ-12', cls: 'POMPALI', paint: ramrod, box: [-19, -7, 28, 7], gripB: [13.6, 0.8], muzzle: [27.4, -3.4],
    parts: ['body', 'pump'], eject: [1.9, -2.6], casing: 'shell', pump: 4.2, port: [2.1, 0.6] },
  marksman: { id: 'marksman', name: 'ATMACA DMR', cls: 'KESKİN NİŞANCI', paint: marksman, box: [-22, -10, 34, 7], gripB: [16.0, -1.0], muzzle: [33.4, -2.8],
    parts: ['mag', 'body'], eject: [2.75, -3.0], casing: 'rifle', magAxis: [0.08, 0.997], magGrab: [5.9, 4.4], magPull: 8, charge: [-7.8, -4.3] },
  mule: { id: 'mule', name: 'KATIR .50', cls: 'TABANCA', paint: mule, box: [-6, -8, 10, 7], gripB: [1.2, 0.8], muzzle: [8.75, -4.55],
    parts: ['mag', 'body', 'slide'], eject: [2.2, -5.8], casing: 'pistol', magAxis: [-0.2, 0.98], magGrab: [-2.5, 4.6], magPull: 8, slide: 2.8, charge: [-2.6, -5.0] },
  hornet: { id: 'hornet', name: 'ARI', cls: 'SMG', paint: hornet, box: [-12, -7, 14, 11], gripB: [7.4, 0.2], muzzle: [12.85, -2.65],
    parts: ['mag', 'body'], eject: [1.35, -3.35], casing: 'pistol', magAxis: [-0.1, 0.995], magGrab: [-1.75, 7.9], magPull: 10, charge: [5.9, -4.75] },
  lynx: { id: 'lynx', name: 'VAŞAK', cls: 'SMG', paint: lynx, box: [-14, -8, 18, 9], gripB: [8.0, -0.6], muzzle: [17.4, -2.6],
    parts: ['mag', 'body'], eject: [1.35, -3.5], casing: 'pistol', magAxis: [0.25, 0.97], magGrab: [4.4, 4.6], magPull: 8.5, charge: [8.4, -5.3] },
  bastion: { id: 'bastion', name: 'BURÇ BR', cls: 'TÜFEK', paint: bastion, box: [-19, -9, 28, 9], gripB: [13.8, -0.6], muzzle: [27.6, -2.6],
    parts: ['mag', 'body'], eject: [2.25, -3.2], casing: 'rifle', magAxis: [0.09, 0.996], magGrab: [4.9, 5.4], magPull: 8.5, charge: [9.9, -5.4] },
  saw: { id: 'saw', name: 'TESTERE-20', cls: 'POMPALI', paint: saw, box: [-18, -7, 27, 9], gripB: [14.0, -0.6], muzzle: [26.0, -2.6],
    parts: ['mag', 'body'], eject: [2.4, -3.55], casing: 'shell', magAxis: [0, 1], magGrab: [4.45, 5.0], magPull: 9, charge: [4.6, -3.55] },
  longbow: { id: 'longbow', name: 'KARTAL', cls: 'KESKİN NİŞANCI', paint: longbow, box: [-22, -11, 38, 7], gripB: [17.0, -0.8], muzzle: [37.6, -2.8],
    parts: ['mag', 'body'], eject: [0.9, -4.1], casing: 'rifle', magAxis: [0, 1], magGrab: [4.1, 1.0], magPull: 6, charge: [-4.55, -0.65] },
  anvil: { id: 'anvil', name: 'ÖRS LMG', cls: 'AĞIR', paint: anvil, box: [-19, -9, 30, 9], gripB: [15.0, -0.6], muzzle: [29.6, -3.0],
    parts: ['mag', 'body'], eject: [3.6, -4.0], casing: 'rifle', magAxis: [0, 1], magGrab: [2.9, 6.0], magPull: 10, charge: [6.5, -2.2] },
  thumper: { id: 'thumper', name: 'TOKMAK GL', cls: 'PATLAYICI', paint: thumper, box: [-16, -10, 20, 7], gripB: [14.0, 2.2], muzzle: [19.6, -2.8],
    parts: ['body'], eject: [7.2, -2.2], casing: 'shell', port: [7.2, 1.2] },
};
