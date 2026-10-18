// KOR LAB — weapon painters (factory finish).
//
// Weapon space: origin at the trigger hand (gripA), +x toward the muzzle,
// +y down, same units as characters (64 = a person). Each weapon also names
// the points the rig needs: gripB (support hand), muzzle, eject, mag, stock.
// Skins later recolour the material slots (body, metal, polymer, accent).
import { cel, fill, stroke, clip } from '../kit.js';
import { M, tone } from '../style.js';

const rr = (x0, y0, x1, y1, r) => `M ${x0 + r} ${y0} L ${x1 - r} ${y0} Q ${x1} ${y0} ${x1} ${y0 + r} L ${x1} ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} L ${x0 + r} ${y1} Q ${x0} ${y1} ${x0} ${y1 - r} L ${x0} ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const dot = (x, y, r) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;

export const MAT = {
  metal: tone('#9aa5b3', '#6c7786', '#4a5361', '#1f242b'),
  poly: M.charcoal,
  dark: M.black,
  accent: tone('#ff9a5c', '#ff6b2c', '#c4441a', '#6e2410'),
  glass: M.lens,
  shell: tone('#ff7a6e', '#d63a2e', '#962018', '#4a0d08'),
  brass: M.brass,
};

// Shared bits ---------------------------------------------------------------
function grip(g, m, x0, y0, len = 6.4, w = 2.3, ang = 0.32) {
  g.save(); g.translate(x0, y0); g.rotate(ang);
  const d = `M ${-w / 2} 0 L ${w / 2} 0 L ${w / 2 + 0.2} ${len - 0.8} Q ${w / 2 + 0.2} ${len} ${w / 2 - 0.6} ${len} L ${-w / 2 + 0.4} ${len} Q ${-w / 2 - 0.2} ${len} ${-w / 2 - 0.2} ${len - 0.8} Z`;
  cel(g, d, m, { sh: 0.6, hl: 0.3 });
  clip(g, d, () => { for (let y = 1.4; y < len - 0.6; y += 0.9) stroke(g, `M ${-w / 2} ${y} L ${w / 2 + 0.2} ${y}`, m.d, 0.22); });
  g.restore();
}
function guard(g, m, x0, x1, y0, depth = 1.9) {
  const d = `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y0 + 0.5} Q ${x1} ${y0 + depth} ${x1 - 1.2} ${y0 + depth} L ${x0 + 0.4} ${y0 + depth} L ${x0 + 0.4} ${y0 + depth - 0.5} L ${x1 - 1.2} ${y0 + depth - 0.5} Q ${x1 - 0.5} ${y0 + depth - 0.5} ${x1 - 0.5} ${y0 + 0.5} L ${x0} ${y0 + 0.5} Z`;
  cel(g, d, m, { sh: 0.25, hl: 0.15 });
  fill(g, `M ${x0 + 1.1} ${y0 + 0.4} Q ${x0 + 1.8} ${y0 + 1.0} ${x0 + 1.5} ${y0 + 1.5} L ${x0 + 1.1} ${y0 + 1.5} Q ${x0 + 1.3} ${y0 + 1.0} ${x0 + 0.8} ${y0 + 0.5} Z`, MAT.accent.m);
}
function rail(g, x0, x1, y) {
  cel(g, rr(x0, y - 0.7, x1, y, 0.1), MAT.metal, { sh: 0.2, hl: 0.15 });
  for (let x = x0 + 0.4; x < x1 - 0.3; x += 0.8) fill(g, `M ${x} ${y - 0.7} L ${x + 0.35} ${y - 0.7} L ${x + 0.35} ${y - 0.35} L ${x} ${y - 0.35} Z`, MAT.metal.d);
}
function redDot(g, x) {
  const H = poly([[x, -4.8], [x, -6.4], [x + 0.6, -7.4], [x + 3.6, -7.4], [x + 4.2, -6.4], [x + 4.2, -4.8]]);
  cel(g, H, MAT.dark, { sh: 0.4, hl: 0.3 });
  fill(g, rr(x + 0.9, -7.0, x + 3.3, -5.4, 0.4), MAT.glass.d);
  fill(g, rr(x + 1.1, -6.8, x + 2.0, -6.0, 0.3), MAT.glass.l, 0.8);
  fill(g, dot(x + 2.6, -6.2, 0.2), '#ff4a5a');
}

// SERÇE-9 — compact striker pistol -------------------------------------------
function wren(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) wrenMag(g, m);
  if (on('body')) {
    grip(g, m.poly, -1.1, -2.0, 5.8, 2.6, 0.22);
    const FRAME = poly([[-2.8, -3.3], [5.6, -3.3], [5.6, -2.2], [3.4, -2.0], [-2.4, -1.8]]);
    cel(g, FRAME, m.poly, { sh: 0.4, hl: 0.25 });
    guard(g, m.poly, 0.2, 3.2, -2.1, 2.0);
    fill(g, rr(6.0, -4.6, 6.45, -3.6, 0.1), m.dark.k); // barrel crown
    stroke(g, 'M -0.4 -2.6 L 4.4 -2.6', m.poly.d, 0.2);
  }
  if (on('slide')) {
    const SLIDE = poly([[-3.4, -5.4], [5.8, -5.4], [6.2, -4.9], [6.2, -3.3], [-3.4, -3.3]]);
    cel(g, SLIDE, m.metal, { sh: 0.5, hl: 0.35 });
    clip(g, SLIDE, () => {
      for (let x = -2.9; x < -0.6; x += 0.55) stroke(g, `M ${x} -5.3 L ${x - 0.2} -3.5`, m.metal.d, 0.24);
      fill(g, rr(1.4, -4.9, 4.2, -4.2, 0.2), m.metal.d);
      stroke(g, 'M -3.2 -5.0 L 5.8 -5.0', m.metal.l, 0.18, 0.8);
    });
    fill(g, rr(5.0, -6.0, 5.6, -5.4, 0.1), m.dark.m);
    fill(g, dot(5.3, -5.75, 0.18), m.accent.l);
    fill(g, rr(-3.0, -5.95, -2.2, -5.4, 0.1), m.dark.m);
  }
}
// the pistol magazine rides inside the grip; only its base plate shows
function wrenMag(g, m = MAT) {
  g.save(); g.translate(-1.1, -2.0); g.rotate(0.22);
  cel(g, rr(-0.95, 0.6, 0.95, 5.9, 0.2), m.metal, { sh: 0.4, hl: 0.25 });
  fill(g, rr(-0.7, 0.3, 0.6, 0.8, 0.15), m.brass.m);
  cel(g, rr(-1.45, 5.6, 1.25, 6.45, 0.3), m.dark, { sh: 0.3, hl: 0.2 });
  g.restore();
}

// KERKENEZ AR — select-fire carbine --------------------------------------------
function kestrel(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) kestrelMag(g, m);
  if (!on('body')) return;
  // stock and buffer tube
  cel(g, rr(-11.0, -3.6, -5.6, -2.0, 0.3), m.metal, { sh: 0.3, hl: 0.2 });
  const STOCK = poly([[-15.8, -4.6], [-9.2, -4.6], [-8.4, -3.8], [-8.4, -1.8], [-11.6, 0.2], [-15.2, 1.8], [-16.2, 1.8], [-16.2, -4.2]]);
  cel(g, STOCK, m.poly, { sh: 0.7, hl: 0.35 });
  clip(g, STOCK, () => {
    fill(g, poly([[-14.6, -3.4], [-10.0, -3.4], [-10.0, -2.4], [-14.6, -2.4]]), m.poly.d);
    fill(g, rr(-17, -5, -15.4, 2.2, 0.2), m.dark.m);
  });
  // lower receiver, grip
  grip(g, m.poly, -1.4, 0.4, 6.4, 2.4, 0.34);
  const LOWER = poly([[-5.8, -1.8], [4.2, -1.8], [4.2, 0.0], [3.6, 0.8], [0.6, 0.8], [-0.4, 0.4], [-5.2, 0.2]]);
  cel(g, LOWER, m.metal, { sh: 0.45, hl: 0.25 });
  guard(g, m.metal, -0.6, 2.4, 0.4, 1.8);
  // upper receiver with ejection port and charging handle
  const UPPER = poly([[-5.8, -4.4], [6.2, -4.4], [6.2, -1.8], [-5.8, -1.8]]);
  cel(g, UPPER, m.metal, { sh: 0.5, hl: 0.3 });
  clip(g, UPPER, () => {
    fill(g, rr(0.2, -3.6, 3.6, -2.3, 0.2), m.metal.d);
    fill(g, rr(0.5, -3.3, 2.4, -2.6, 0.15), m.dark.k);
    stroke(g, 'M -5.6 -4.0 L 6.0 -4.0', m.metal.l, 0.18, 0.8);
  });
  fill(g, rr(-6.6, -4.6, -5.2, -3.8, 0.2), m.metal.d);
  // handguard with slots and an ember band
  const HG = 'M 6.2 -4.6 L 17.6 -4.6 Q 18.2 -4.6 18.2 -4.0 L 18.2 -1.2 Q 18.2 -0.6 17.6 -0.6 L 6.2 -0.6 Z';
  cel(g, HG, m.poly, { sh: 0.6, hl: 0.3 });
  clip(g, HG, () => {
    for (let x = 8.0; x < 17; x += 2.0) fill(g, rr(x, -2.9, x + 1.2, -2.1, 0.35), m.poly.k);
    fill(g, 'M 6.2 -4.8 L 7.4 -4.8 L 7.4 -0.4 L 6.2 -0.4 Z', m.accent.m);
  });
  rail(g, -5.6, 18.0, -4.4);
  // barrel, front sight, muzzle brake
  cel(g, rr(18.2, -3.0, 22.0, -2.0, 0.2), m.metal, { sh: 0.2, hl: 0.15 });
  const BRAKE = rr(21.6, -3.4, 24.4, -1.6, 0.3);
  cel(g, BRAKE, m.dark, { sh: 0.3, hl: 0.2 });
  clip(g, BRAKE, () => { for (const x of [22.4, 23.3]) fill(g, rr(x, -3.0, x + 0.5, -2.0, 0.15), m.dark.k); });
  cel(g, poly([[15.4, -5.1], [16.8, -5.1], [16.6, -6.6], [15.8, -6.6]]), m.dark, { sh: 0.2, hl: 0.15 });
  redDot(g, -0.4);
}

function kestrelMag(g, m = MAT) {
  const MAG = 'M 1.0 -0.6 L 3.4 -0.6 L 3.4 0.4 C 3.8 3.0 4.6 5.6 5.8 8.0 L 3.2 8.8 C 2.0 6.4 1.2 3.6 1.0 0.4 Z';
  cel(g, MAG, m.poly, { sh: 0.6, hl: 0.3 });
  clip(g, MAG, () => { for (const y of [2.6, 4.8]) stroke(g, `M 0.5 ${y} L 6 ${y + 0.6}`, m.poly.d, 0.25); fill(g, 'M 2.8 8.4 L 6.2 7.4 L 6.6 9.4 L 3.2 9.6 Z', m.dark.m); });
}

// HARBİ-12 — pump-action shotgun -------------------------------------------
function ramrod(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('body')) ramrodBody(g, m);
  if (on('pump')) ramrodPump(g, m);
}
function ramrodBody(g, m) {
  // barrel and tube magazine
  cel(g, rr(4.8, -4.1, 27.4, -2.7, 0.3), m.metal, { sh: 0.3, hl: 0.2 });
  cel(g, rr(4.8, -2.6, 24.6, -0.9, 0.5), m.metal, { sh: 0.4, hl: 0.25 });
  cel(g, rr(24.0, -2.8, 25.4, -0.7, 0.4), m.dark, { sh: 0.2, hl: 0.15 });
  fill(g, dot(26.6, -4.35, 0.28), m.accent.l);
  // stock with integrated grip
  const STOCK = 'M -5.2 -3.8 L -17.4 -2.8 L -18.2 -2.6 L -18.2 3.8 L -17.0 3.8 L -9.6 1.2 C -6.4 0.4 -4.4 1.4 -3.2 3.6 L -2.2 6.2 L 0.6 5.6 L -0.2 0.6 L -5.2 0.4 Z';
  cel(g, STOCK, m.poly, { sh: 0.8, hl: 0.4 });
  clip(g, STOCK, () => {
    fill(g, 'M -19 -4 L -17.2 -4 L -17.2 5 L -19 5 Z', m.dark.m);
    for (let y = 1.8; y < 5.8; y += 0.9) stroke(g, `M ${-3.2 + (y - 1.8) * 0.35} ${y} L ${0.4 + (y - 1.8) * 0.1} ${y - 0.3}`, m.poly.d, 0.22);
    stroke(g, 'M -16 -2.2 L -6 -3.0', m.poly.l, 0.2, 0.8);
  });
  guard(g, m.metal, -0.4, 2.8, 0.4, 2.0);
  // receiver with a side saddle of four shells
  const REC = poly([[-5.4, -4.3], [5.0, -4.3], [5.0, 0.4], [-5.4, 0.4]]);
  cel(g, REC, m.metal, { sh: 0.6, hl: 0.35 });
  clip(g, REC, () => {
    fill(g, rr(0.2, -2.5, 2.8, -1.3, 0.25), m.dark.k);
    stroke(g, 'M -5.2 -3.9 L 4.8 -3.9', m.metal.l, 0.2, 0.8);
  });
  const SAD = rr(-4.6, -4.0, -0.8, -0.8, 0.2);
  cel(g, SAD, m.poly, { sh: 0.3, hl: 0.2 });
  for (let i = 0; i < 4; i++) {
    const x = -4.3 + i * 0.9;
    fill(g, rr(x, -3.7, x + 0.75, -2.0, 0.15), m.shell.m);
    fill(g, rr(x, -2.0, x + 0.75, -1.1, 0.1), m.brass.m);
    fill(g, rr(x + 0.1, -3.6, x + 0.3, -2.1, 0.08), m.shell.l, 0.8);
  }
  // ghost-ring rear sight
  stroke(g, 'M 3.0 -4.3 L 3.0 -5.6 M 4.6 -4.3 L 4.6 -5.6', m.dark.m, 0.4);
  stroke(g, dot(3.8, -5.6, 0.7), m.dark.m, 0.35);
  // loading port under the receiver
  fill(g, rr(0.6, 0.0, 3.6, 0.6, 0.2), m.dark.k);
}
function ramrodPump(g, m) {
  // pump with ember grip ridges
  const PUMP = 'M 9.0 -3.0 L 18.4 -3.0 Q 19.0 -3.0 19.0 -2.4 L 19.0 0.2 Q 19.0 0.8 18.4 0.8 L 9.0 0.8 Q 8.4 0.8 8.4 0.2 L 8.4 -2.4 Q 8.4 -3.0 9.0 -3.0 Z';
  cel(g, PUMP, m.poly, { sh: 0.6, hl: 0.3 });
  clip(g, PUMP, () => {
    for (let x = 10.0; x < 18; x += 1.1) fill(g, rr(x, -1.8, x + 0.55, 0.9, 0.2), m.accent.m);
    fill(g, 'M 8 0.0 L 20 0.0 L 20 1 L 8 1 Z', m.poly.d);
  });
}

// ATMACA DMR — semi-auto designated marksman rifle --------------------------
function marksman(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) marksmanMag(g, m);
  if (!on('body')) return;
  // precision stock with a raised comb
  const STOCK = 'M -7.2 -4.2 L -14.0 -4.2 L -14.6 -6.0 L -18.6 -6.0 L -19.6 -4.8 L -20.4 -4.6 L -20.4 2.6 L -19.0 2.6 L -13.4 0.4 L -9.2 0.4 L -7.2 -0.4 Z';
  cel(g, STOCK, m.poly, { sh: 0.8, hl: 0.4 });
  clip(g, STOCK, () => {
    fill(g, 'M -21 -6 L -19.4 -6 L -19.4 3 L -21 3 Z', m.dark.m);
    fill(g, rr(-17.8, -2.6, -13.2, -1.2, 0.5), m.poly.k);
    stroke(g, 'M -18.6 -5.6 L -14.6 -5.6', m.poly.l, 0.2);
  });
  // grip
  grip(g, m.poly, -1.4, 0.0, 6.0, 2.4, 0.3);
  guard(g, m.metal, -0.6, 2.4, 0.0, 1.8);
  // receiver
  const REC = poly([[-7.4, -4.6], [8.4, -4.6], [8.4, -1.2], [5.2, -0.4], [-7.4, -0.4]]);
  cel(g, REC, m.metal, { sh: 0.55, hl: 0.3 });
  clip(g, REC, () => {
    fill(g, rr(0.6, -3.6, 4.6, -2.2, 0.25), m.dark.k);
    stroke(g, 'M -7.2 -4.2 L 8.2 -4.2', m.metal.l, 0.18, 0.8);
    stroke(g, 'M -7.4 -1.6 L 8.4 -1.6', m.metal.d, 0.2);
  });
  // long vented handguard, barrel, suppressor
  const HG = 'M 8.4 -4.6 L 21.6 -4.6 Q 22.2 -4.6 22.2 -4.0 L 22.2 -1.6 Q 22.2 -1.0 21.6 -1.0 L 8.4 -1.0 Z';
  cel(g, HG, m.poly, { sh: 0.6, hl: 0.3 });
  clip(g, HG, () => { for (let x = 9.6; x < 21; x += 1.6) fill(g, poly([[x, -3.6], [x + 0.9, -3.6], [x + 0.5, -2.0], [x - 0.4, -2.0]]), m.poly.k); });
  cel(g, rr(22.2, -3.3, 28.2, -2.3, 0.25), m.metal, { sh: 0.2, hl: 0.15 });
  const SUP = rr(27.6, -3.9, 33.4, -1.7, 0.6);
  cel(g, SUP, m.dark, { sh: 0.4, hl: 0.3 });
  clip(g, SUP, () => { fill(g, 'M 27.6 -4 L 28.6 -4 L 28.6 -1.6 L 27.6 -1.6 Z', m.accent.m); stroke(g, 'M 29.4 -3.5 L 33 -3.5', m.dark.l, 0.18); });
  // folded bipod under the handguard
  cel(g, rr(14.0, -1.0, 21.0, -0.2, 0.3), m.metal, { sh: 0.2, hl: 0.15 });
  fill(g, rr(20.4, -1.2, 21.4, 0.2, 0.2), m.dark.m);
  rail(g, -6.6, 12.0, -4.6);
  // scope: rings, tube, bells, turrets, lens
  for (const x of [0.2, 6.4]) cel(g, rr(x, -6.0, x + 1.4, -4.6, 0.2), m.dark, { sh: 0.2, hl: 0.15 });
  const TUBE = rr(-1.4, -7.8, 8.2, -6.0, 0.6);
  cel(g, TUBE, m.dark, { sh: 0.45, hl: 0.3 });
  const OBJ = 'M 7.6 -7.8 L 9.0 -8.8 L 11.6 -8.8 Q 12.0 -8.8 12.0 -8.4 L 12.0 -5.4 Q 12.0 -5.0 11.6 -5.0 L 9.0 -5.0 L 7.6 -6.0 Z';
  cel(g, OBJ, m.dark, { sh: 0.45, hl: 0.3 });
  const OCU = 'M -1.0 -7.8 L -2.2 -8.6 L -4.2 -8.6 Q -4.6 -8.6 -4.6 -8.2 L -4.6 -5.6 Q -4.6 -5.2 -4.2 -5.2 L -2.2 -5.2 L -1.0 -6.0 Z';
  cel(g, OCU, m.dark, { sh: 0.45, hl: 0.3 });
  fill(g, rr(2.6, -9.4, 4.2, -7.8, 0.25), m.dark.m);
  fill(g, rr(2.8, -9.6, 4.0, -9.2, 0.15), m.accent.m);
  fill(g, rr(11.6, -8.6, 12.2, -5.2, 0.2), m.glass.m);
  fill(g, rr(11.65, -8.4, 11.95, -7.2, 0.1), m.glass.l);
  stroke(g, 'M -1.0 -7.4 L 7.6 -7.4', m.dark.l, 0.2, 0.8);
}

function marksmanMag(g, m = MAT) {
  const MAG = rr(0.6, -1.2, 4.0, 5.8, 0.3);
  cel(g, MAG, m.poly, { sh: 0.5, hl: 0.3 });
  clip(g, MAG, () => { fill(g, 'M 0 5.0 L 5 5.0 L 5 6 L 0 6 Z', m.dark.m); stroke(g, 'M 0.8 1.6 L 3.8 1.6', m.poly.d, 0.25); });
}

// KATIR .50 — heavy self-loading pistol ---------------------------------------
function mule(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) {
    g.save(); g.translate(-1.2, -2.0); g.rotate(0.2);
    cel(g, rr(-1.1, 0.6, 1.1, 6.6, 0.2), m.metal, { sh: 0.4, hl: 0.25 });
    fill(g, rr(-0.8, 0.3, 0.7, 0.9, 0.15), m.brass.m);
    cel(g, rr(-1.6, 6.3, 1.4, 7.3, 0.3), m.dark, { sh: 0.3, hl: 0.2 });
    g.restore();
  }
  if (on('body')) {
    grip(g, m.poly, -1.2, -2.0, 6.6, 3.0, 0.2);
    const FRAME = poly([[-3.4, -3.4], [7.6, -3.4], [7.6, -2.0], [3.6, -1.8], [-2.8, -1.6]]);
    cel(g, FRAME, m.poly, { sh: 0.4, hl: 0.25 });
    guard(g, m.poly, 0.2, 3.6, -1.9, 2.2);
    fill(g, rr(8.0, -5.2, 8.7, -3.7, 0.15), m.dark.k);
    fill(g, rr(-3.6, -2.2, -2.2, -1.2, 0.2), m.accent.m);
  }
  if (on('slide')) {
    const SLIDE = poly([[-4.0, -6.2], [7.4, -6.2], [8.4, -5.6], [8.4, -3.4], [-4.0, -3.4]]);
    cel(g, SLIDE, m.metal, { sh: 0.55, hl: 0.35 });
    clip(g, SLIDE, () => {
      for (let x = -3.4; x < -0.8; x += 0.6) stroke(g, `M ${x} -6.1 L ${x - 0.2} -3.6`, m.metal.d, 0.26);
      fill(g, poly([[1.0, -5.6], [6.8, -5.6], [7.6, -4.6], [1.0, -4.4]]), m.metal.d);
      stroke(g, 'M -3.8 -5.8 L 8.0 -5.8', m.metal.l, 0.2, 0.8);
    });
    fill(g, rr(6.8, -6.9, 7.6, -6.2, 0.1), m.dark.m);
    fill(g, dot(7.2, -6.6, 0.2), m.accent.l);
    fill(g, rr(-3.6, -6.9, -2.6, -6.2, 0.1), m.dark.m);
  }
}

// ARI — compact high-rate SMG ------------------------------------------------
function hornet(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) {
    const MAG = rr(0.8, -0.8, 3.0, 9.4, 0.3);
    cel(g, MAG, m.poly, { sh: 0.5, hl: 0.3 });
    clip(g, MAG, () => { for (const y of [2.4, 4.6, 6.8]) stroke(g, `M 0.6 ${y} L 3.2 ${y}`, m.poly.d, 0.24); fill(g, 'M 0.5 8.6 L 3.3 8.6 L 3.3 9.6 L 0.5 9.6 Z', m.dark.m); });
  }
  if (!on('body')) return;
  // folded wire stock
  stroke(g, 'M -4.6 -3.6 L -10.4 -3.6 L -10.4 -0.6 L -5.0 -0.6', m.metal.d, 0.9);
  stroke(g, 'M -4.6 -3.6 L -10.4 -3.6 L -10.4 -0.6 L -5.0 -0.6', m.metal.m, 0.45);
  cel(g, rr(-11.0, -4.2, -9.8, 0.0, 0.3), m.dark, { sh: 0.2, hl: 0.1 });
  grip(g, m.poly, -1.6, 0.0, 6.0, 2.4, 0.3);
  const REC = poly([[-5.2, -4.6], [7.6, -4.6], [7.6, -0.8], [-0.2, -0.4], [-5.2, -0.6]]);
  cel(g, REC, m.metal, { sh: 0.5, hl: 0.3 });
  clip(g, REC, () => {
    fill(g, rr(-1.2, -3.6, 1.6, -2.4, 0.2), m.dark.k);
    stroke(g, 'M -5.0 -4.2 L 7.4 -4.2', m.metal.l, 0.18, 0.8);
    fill(g, 'M 5.8 -4.8 L 6.8 -4.8 L 6.8 -0.6 L 5.8 -0.6 Z', m.accent.m);
  });
  guard(g, m.metal, -1.0, 1.8, -0.4, 1.8);
  // stubby barrel shroud and a short vertical grip
  const SH = rr(7.6, -4.0, 11.4, -1.4, 0.4);
  cel(g, SH, m.poly, { sh: 0.4, hl: 0.25 });
  clip(g, SH, () => { for (let x = 8.2; x < 11; x += 1.0) fill(g, rr(x, -3.1, x + 0.5, -2.3, 0.2), m.poly.k); });
  cel(g, rr(11.4, -3.2, 12.8, -2.2, 0.2), m.dark, { sh: 0.2, hl: 0.1 });
  g.save(); g.translate(8.6, -1.4); g.rotate(-0.05); cel(g, rr(-0.9, 0, 0.9, 3.8, 0.4), m.poly, { sh: 0.3, hl: 0.2 }); g.restore();
  rail(g, -4.6, 7.2, -4.6);
  cel(g, poly([[-3.6, -4.6], [-3.6, -5.8], [-2.4, -5.8], [-2.0, -4.6]]), m.dark, { sh: 0.2, hl: 0.15 });
  cel(g, poly([[6.0, -4.6], [6.2, -5.8], [7.0, -5.8], [7.2, -4.6]]), m.dark, { sh: 0.2, hl: 0.15 });
}

// VAŞAK — integrally suppressed SMG -------------------------------------------------
function lynx(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) {
    const MAG = 'M 0.8 -0.6 L 3.0 -0.6 L 3.0 0.4 C 3.3 2.8 3.9 5.2 4.8 7.4 L 2.6 8.0 C 1.7 5.8 1.0 3.2 0.8 0.4 Z';
    cel(g, MAG, m.poly, { sh: 0.5, hl: 0.3 });
    clip(g, MAG, () => { for (const y of [2.6, 4.8]) stroke(g, `M 0.4 ${y} L 5 ${y + 0.5}`, m.poly.d, 0.24); });
  }
  if (!on('body')) return;
  // collapsible stock
  cel(g, rr(-9.0, -3.4, -4.8, -2.2, 0.3), m.metal, { sh: 0.3, hl: 0.2 });
  const STOCK = poly([[-13.0, -4.2], [-8.6, -4.2], [-8.6, -1.4], [-11.4, 0.6], [-13.0, 1.2]]);
  cel(g, STOCK, m.poly, { sh: 0.6, hl: 0.3 });
  fill(g, rr(-13.6, -4.4, -12.6, 1.4, 0.2), m.dark.m);
  grip(g, m.poly, -1.4, 0.0, 6.0, 2.4, 0.32);
  const REC = poly([[-5.0, -4.4], [6.6, -4.4], [6.6, -0.6], [-5.0, -0.4]]);
  cel(g, REC, m.metal, { sh: 0.5, hl: 0.3 });
  clip(g, REC, () => { fill(g, rr(0.0, -3.4, 2.8, -2.4, 0.2), m.dark.k); stroke(g, 'M -4.8 -4.0 L 6.4 -4.0', m.metal.l, 0.18, 0.8); });
  guard(g, m.metal, -0.8, 2.0, -0.4, 1.8);
  // the long suppressor with a cooling sleeve
  const SUP = rr(6.4, -4.2, 17.4, -1.0, 0.8);
  cel(g, SUP, m.dark, { sh: 0.5, hl: 0.3 });
  clip(g, SUP, () => {
    for (let x = 7.6; x < 16; x += 1.4) stroke(g, `M ${x} -4.2 L ${x} -1.0`, m.dark.l, 0.18, 0.6);
    fill(g, 'M 6.4 -4.4 L 7.4 -4.4 L 7.4 -0.8 L 6.4 -0.8 Z', m.accent.m);
  });
  rail(g, -4.4, 6.0, -4.4);
  redDot(g, -2.0);
}

// BURÇ BR — burst-fire battle rifle ----------------------------------------------
function bastion(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) {
    const MAG = 'M 1.2 -0.6 L 4.0 -0.6 L 4.0 0.4 C 4.3 2.6 4.8 4.8 5.6 6.6 L 2.8 7.4 C 2.0 5.4 1.4 3.0 1.2 0.4 Z';
    cel(g, MAG, m.metal, { sh: 0.6, hl: 0.3 });
    clip(g, MAG, () => { for (const y of [1.8, 3.6, 5.4]) stroke(g, `M 0.8 ${y} L 6 ${y + 0.5}`, m.metal.d, 0.26); });
  }
  if (!on('body')) return;
  const STOCK = poly([[-17.6, -4.8], [-6.4, -4.4], [-6.0, -0.6], [-12.4, 0.6], [-17.0, 2.4], [-18.0, 2.4], [-18.0, -4.6]]);
  cel(g, STOCK, m.poly, { sh: 0.8, hl: 0.4 });
  clip(g, STOCK, () => { fill(g, 'M -18.6 -5 L -17 -5 L -17 3 L -18.6 3 Z', m.dark.m); fill(g, rr(-15.6, -3.4, -9.4, -2.2, 0.4), m.poly.k); });
  grip(g, m.poly, -1.6, 0.4, 6.4, 2.6, 0.34);
  const LOWER = poly([[-6.2, -1.8], [5.2, -1.8], [5.2, 0.2], [4.4, 1.0], [0.6, 1.0], [-6.2, 0.4]]);
  cel(g, LOWER, m.metal, { sh: 0.45, hl: 0.25 });
  guard(g, m.metal, -0.8, 2.4, 0.6, 1.8);
  const UPPER = poly([[-6.2, -4.8], [7.2, -4.8], [7.2, -1.8], [-6.2, -1.8]]);
  cel(g, UPPER, m.metal, { sh: 0.55, hl: 0.3 });
  clip(g, UPPER, () => { fill(g, rr(0.4, -4.0, 4.0, -2.6, 0.2), m.dark.k); stroke(g, 'M -6.0 -4.4 L 7.0 -4.4', m.metal.l, 0.18, 0.8); });
  // heavy handguard, long barrel with a flash hider
  const HG = 'M 7.2 -5.0 L 19.6 -5.0 Q 20.2 -5.0 20.2 -4.4 L 20.2 -0.8 Q 20.2 -0.2 19.6 -0.2 L 7.2 -0.2 Z';
  cel(g, HG, m.poly, { sh: 0.6, hl: 0.3 });
  clip(g, HG, () => { for (let x = 8.6; x < 19; x += 2.2) fill(g, poly([[x, -3.6], [x + 1.4, -3.6], [x + 1.0, -1.6], [x - 0.4, -1.6]]), m.poly.k); fill(g, 'M 7.2 -5.2 L 8.4 -5.2 L 8.4 0 L 7.2 0 Z', m.accent.m); });
  cel(g, rr(20.2, -3.2, 25.4, -2.0, 0.2), m.metal, { sh: 0.2, hl: 0.15 });
  const FH = rr(25.0, -3.6, 27.6, -1.6, 0.3);
  cel(g, FH, m.dark, { sh: 0.3, hl: 0.2 });
  clip(g, FH, () => { for (const x of [25.6, 26.5]) fill(g, rr(x, -3.4, x + 0.4, -1.8, 0.1), m.dark.k); });
  rail(g, -6.0, 19.6, -4.8);
  // a 1-4x scope
  for (const x of [-1.2, 4.4]) cel(g, rr(x, -6.2, x + 1.2, -4.8, 0.2), m.dark, { sh: 0.2, hl: 0.15 });
  cel(g, rr(-3.0, -7.8, 7.0, -6.2, 0.6), m.dark, { sh: 0.4, hl: 0.3 });
  fill(g, rr(6.6, -7.6, 7.2, -6.4, 0.2), m.glass.m);
}

// TESTERE-20 — magazine-fed automatic shotgun -----------------------------------------
function saw(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) {
    // a stubby drum
    cel(g, dot(3.4, 4.2, 3.6), m.poly, { sh: 0.6, hl: 0.3 });
    cel(g, rr(1.4, -0.8, 5.0, 1.6, 0.3), m.poly, { sh: 0.3, hl: 0.2 });
    fill(g, dot(3.4, 4.2, 1.2), m.dark.m);
    stroke(g, dot(3.4, 4.2, 2.6), m.poly.d, 0.25);
  }
  if (!on('body')) return;
  const STOCK = poly([[-16.4, -4.6], [-5.8, -4.2], [-5.4, 0.4], [-11.0, 1.4], [-15.8, 3.0], [-16.8, 3.0], [-16.8, -4.4]]);
  cel(g, STOCK, m.poly, { sh: 0.8, hl: 0.4 });
  fill(g, rr(-17.4, -4.8, -16.2, 3.2, 0.2), m.dark.m);
  grip(g, m.poly, -1.6, 0.6, 6.4, 2.6, 0.34);
  const REC = poly([[-5.8, -5.0], [7.4, -5.0], [7.4, 0.6], [-5.8, 0.6]]);
  cel(g, REC, m.metal, { sh: 0.6, hl: 0.35 });
  clip(g, REC, () => { fill(g, rr(0.6, -3.8, 4.4, -2.2, 0.25), m.dark.k); stroke(g, 'M -5.6 -4.6 L 7.2 -4.6', m.metal.l, 0.2, 0.8); stroke(g, 'M -5.8 -1.0 L 7.4 -1.0', m.metal.d, 0.24); });
  guard(g, m.metal, -1.0, 2.4, 0.6, 2.0);
  // fat barrel under a vented heat shield
  cel(g, rr(7.4, -3.8, 24.6, -1.6, 0.5), m.metal, { sh: 0.35, hl: 0.25 });
  const HS = rr(7.4, -5.0, 20.6, -3.4, 0.4);
  cel(g, HS, m.poly, { sh: 0.4, hl: 0.25 });
  clip(g, HS, () => { for (let x = 8.6; x < 20; x += 1.6) fill(g, rr(x, -4.6, x + 0.8, -3.8, 0.2), m.poly.k); });
  const MZ = rr(23.8, -4.2, 26.0, -1.2, 0.4);
  cel(g, MZ, m.dark, { sh: 0.3, hl: 0.2 });
  fill(g, rr(7.4, -1.6, 9.0, 0.4, 0.2), m.accent.m);
  cel(g, poly([[22.2, -5.0], [23.4, -5.0], [23.2, -6.2], [22.4, -6.2]]), m.dark, { sh: 0.2, hl: 0.15 });
}

// KARTAL — bolt-action rifle with a long scope ---------------------------------------
function longbow(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) {
    const MAG = rr(1.0, -1.0, 4.4, 4.6, 0.3);
    cel(g, MAG, m.metal, { sh: 0.5, hl: 0.3 });
    fill(g, rr(0.8, 3.8, 4.6, 4.8, 0.2), m.dark.m);
  }
  if (!on('body')) return;
  // a one-piece thumbhole stock
  const STOCK = 'M 9.6 -3.4 L -6.0 -3.6 L -14.6 -5.4 L -20.0 -5.8 L -21.6 -4.6 L -21.6 2.6 L -20.0 2.8 L -14.4 1.0 L -8.4 1.0 C -6.0 1.0 -4.4 2.2 -3.4 4.4 L -2.0 6.6 L 0.8 6.0 L 0.2 1.0 L 9.6 0.6 Z';
  cel(g, STOCK, m.poly, { sh: 0.8, hl: 0.4 });
  clip(g, STOCK, () => {
    fill(g, 'M -22 -6 L -20.4 -6 L -20.4 3 L -22 3 Z', m.dark.m);
    fill(g, rr(-9.6, -1.6, -4.6, 0.0, 0.6), m.poly.k);
    stroke(g, 'M -19.6 -5.0 L -14.8 -4.8 L -6.0 -3.0', m.poly.l, 0.2, 0.8);
  });
  guard(g, m.metal, -0.8, 2.2, 1.0, 1.8);
  // receiver and the bolt handle
  const REC = rr(-6.0, -4.8, 6.2, -2.4, 0.4);
  cel(g, REC, m.metal, { sh: 0.5, hl: 0.3 });
  stroke(g, 'M -3.4 -3.6 L -4.4 -0.6', m.metal.d, 0.8);
  cel(g, dot(-4.5, -0.4, 0.9), m.dark, { sh: 0.2, hl: 0.2 });
  // the long fluted barrel and a brake
  cel(g, rr(9.6, -3.4, 33.6, -2.2, 0.3), m.metal, { sh: 0.25, hl: 0.15 });
  for (let x = 11; x < 32; x += 2.4) stroke(g, `M ${x} -2.8 L ${x + 1.6} -2.8`, m.metal.d, 0.2);
  const BR = rr(33.4, -3.9, 37.6, -1.7, 0.4);
  cel(g, BR, m.dark, { sh: 0.3, hl: 0.2 });
  clip(g, BR, () => { for (const x of [34.2, 35.4, 36.6]) fill(g, rr(x, -3.6, x + 0.5, -2.0, 0.15), m.dark.k); });
  fill(g, rr(9.4, -3.6, 10.4, 0.8, 0.2), m.accent.m);
  // big scope
  for (const x of [-3.2, 3.6]) cel(g, rr(x, -6.6, x + 1.4, -4.8, 0.2), m.dark, { sh: 0.2, hl: 0.15 });
  cel(g, rr(-5.2, -8.6, 9.4, -6.6, 0.7), m.dark, { sh: 0.45, hl: 0.3 });
  cel(g, 'M 8.8 -8.6 L 10.4 -9.8 L 13.6 -9.8 Q 14.0 -9.8 14.0 -9.4 L 14.0 -5.8 Q 14.0 -5.4 13.6 -5.4 L 10.4 -5.4 L 8.8 -6.6 Z', m.dark, { sh: 0.45, hl: 0.3 });
  cel(g, 'M -4.8 -8.6 L -6.0 -9.4 L -8.0 -9.4 Q -8.4 -9.4 -8.4 -9.0 L -8.4 -6.2 Q -8.4 -5.8 -8.0 -5.8 L -6.0 -5.8 L -4.8 -6.6 Z', m.dark, { sh: 0.45, hl: 0.3 });
  fill(g, rr(1.2, -10.2, 2.8, -8.6, 0.25), m.dark.m);
  fill(g, rr(13.6, -9.6, 14.2, -5.6, 0.2), m.glass.m);
  fill(g, rr(13.65, -9.4, 13.95, -8.0, 0.1), m.glass.l);
}

// ÖRS LMG — belt-fed light machine gun --------------------------------------------------
function anvil(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (on('mag')) {
    // the ammo box under the receiver with the belt going up
    const BOX = rr(-1.0, 0.0, 6.6, 7.8, 0.4);
    cel(g, BOX, m.poly, { sh: 0.7, hl: 0.35 });
    clip(g, BOX, () => { fill(g, rr(-1.2, 2.6, 6.8, 3.4, 0.2), m.poly.d); fill(g, rr(0.4, 4.6, 5.2, 6.4, 0.3), m.accent.m, 0.85); });
    for (let i = 0; i < 4; i++) fill(g, rr(5.0 + i * 0.2, -0.6 - i * 0.9, 6.4 + i * 0.2, 0.0 - i * 0.9, 0.15), m.brass.m);
  }
  if (!on('body')) return;
  const STOCK = poly([[-17.8, -5.0], [-7.0, -4.4], [-7.0, -0.4], [-12.4, 0.4], [-17.2, 2.6], [-18.4, 2.6], [-18.4, -4.8]]);
  cel(g, STOCK, m.poly, { sh: 0.8, hl: 0.4 });
  fill(g, rr(-19.0, -5.2, -17.8, 2.8, 0.2), m.dark.m);
  grip(g, m.poly, -2.6, 0.6, 6.4, 2.6, 0.34);
  const REC = poly([[-7.0, -5.6], [8.4, -5.6], [8.4, 0.6], [-7.0, 0.6]]);
  cel(g, REC, m.metal, { sh: 0.6, hl: 0.35 });
  clip(g, REC, () => {
    fill(g, rr(-7.0, -6.0, 8.4, -4.4, 0.2), m.metal.d);
    for (let x = -5.6; x < 7; x += 1.4) stroke(g, `M ${x} -6.0 L ${x} -4.6`, m.metal.k, 0.2);
    stroke(g, 'M -7 -1.2 L 8.4 -1.2', m.metal.d, 0.24);
  });
  guard(g, m.metal, -2.0, 1.2, 0.6, 1.8);
  // carry handle
  stroke(g, 'M 0.4 -5.6 L 1.2 -8.2 L 6.2 -8.2 L 7.0 -5.6', m.dark.k, 1.2);
  stroke(g, 'M 0.4 -5.6 L 1.2 -8.2 L 6.2 -8.2 L 7.0 -5.6', m.dark.m, 0.6);
  // heavy barrel with a perforated jacket, bipod folded
  const J = rr(8.4, -4.6, 22.4, -1.4, 0.5);
  cel(g, J, m.dark, { sh: 0.45, hl: 0.3 });
  clip(g, J, () => { for (let x = 9.4; x < 22; x += 1.6) fill(g, dot(x + 0.4, -3.0, 0.45), m.dark.k); fill(g, 'M 8.4 -4.8 L 9.6 -4.8 L 9.6 -1.2 L 8.4 -1.2 Z', m.accent.m); });
  cel(g, rr(22.4, -3.6, 28.0, -2.4, 0.25), m.metal, { sh: 0.2, hl: 0.15 });
  cel(g, rr(27.4, -4.0, 29.6, -2.0, 0.3), m.dark, { sh: 0.3, hl: 0.2 });
  cel(g, rr(14.0, -1.4, 22.0, -0.6, 0.3), m.metal, { sh: 0.2, hl: 0.15 });
  cel(g, poly([[25.6, -3.6], [26.6, -3.6], [26.4, -5.6], [25.8, -5.6]]), m.dark, { sh: 0.2, hl: 0.15 });
}

// TOKMAK GL — four-shot revolving grenade launcher ----------------------------------------
function thumper(g, m = MAT, part = null) {
  const on = (k) => !part || part === k;
  if (!on('body')) return;
  const STOCK = poly([[-14.6, -4.0], [-5.6, -3.8], [-5.6, 0.0], [-10.8, 0.6], [-14.0, 2.6], [-15.0, 2.6], [-15.0, -3.8]]);
  cel(g, STOCK, m.poly, { sh: 0.8, hl: 0.4 });
  fill(g, rr(-15.6, -4.2, -14.4, 2.8, 0.2), m.dark.m);
  grip(g, m.poly, -1.6, 0.4, 6.0, 2.6, 0.32);
  guard(g, m.metal, -1.0, 2.2, 0.4, 1.8);
  cel(g, rr(-5.8, -4.2, 3.0, 0.6, 0.4), m.metal, { sh: 0.5, hl: 0.3 });
  // the cylinder: four fat chambers
  const CY = rr(3.0, -6.0, 11.4, 1.6, 1.2);
  cel(g, CY, m.dark, { sh: 0.7, hl: 0.4 });
  clip(g, CY, () => { for (const y of [-4.2, -1.6, 0.8]) fill(g, rr(3.4, y - 0.9, 11.0, y + 0.3, 0.5), m.dark.k, 0.8); fill(g, rr(3.0, -6.2, 4.2, 1.8, 0.2), m.accent.m); });
  // the wide barrel and a leaf sight
  const BAR = rr(11.4, -5.2, 19.6, -0.4, 0.8);
  cel(g, BAR, m.poly, { sh: 0.5, hl: 0.3 });
  clip(g, BAR, () => { for (let x = 12.6; x < 19; x += 1.8) stroke(g, `M ${x} -5.2 L ${x} -0.4`, m.poly.d, 0.3); });
  fill(g, rr(19.2, -4.8, 19.8, -0.8, 0.2), m.dark.k);
  stroke(g, 'M 7.0 -6.0 L 6.4 -8.4 L 9.0 -8.4 L 8.4 -6.0', m.dark.m, 0.5);
  cel(g, rr(12.0, -0.4, 16.0, 3.4, 0.6), m.poly, { sh: 0.3, hl: 0.2 });
}

// Rig points (weapon space):
//   eject   ejection port; magAxis: unit pull-out direction; magGrab: where a
//   hand holds the mag; magPull: distance until it clears the gun; slide /
//   pump: travel; charge: charging handle or slide grab; port: shell port.
export const WEAPONS = {
  wren9: { id: 'wren9', name: 'SERÇE-9', cls: 'TABANCA', paint: wren, box: [-4, -7, 7, 5], gripB: [1.0, 0.6], muzzle: [6.4, -4.1],
    parts: ['mag', 'body', 'slide'], eject: [2.8, -4.6], casing: 'pistol', magAxis: [-0.218, 0.976], magGrab: [-2.3, 4.0], magPull: 7, slide: 2.4, charge: [-2.0, -4.4] },
  kestrel: { id: 'kestrel', name: 'KERKENEZ AR', cls: 'TÜFEK', paint: kestrel, box: [-17, -9, 25, 10], gripB: [12.0, -0.6], muzzle: [24.4, -2.5],
    parts: ['mag', 'body'], eject: [2.0, -3.0], casing: 'rifle', magAxis: [0.27, 0.963], magGrab: [4.0, 5.2], magPull: 9.5, charge: [-6.0, -4.3] },
  ramrod: { id: 'ramrod', name: 'HARBİ-12', cls: 'POMPALI', paint: ramrod, box: [-19, -7, 28, 7], gripB: [13.6, 0.8], muzzle: [27.4, -3.4],
    parts: ['body', 'pump'], eject: [1.5, -1.9], casing: 'shell', pump: 4.2, port: [2.1, 0.6] },
  marksman: { id: 'marksman', name: 'ATMACA DMR', cls: 'KESKİN NİŞANCI', paint: marksman, box: [-21, -10, 34, 7], gripB: [16.0, -1.0], muzzle: [33.4, -2.8],
    parts: ['mag', 'body'], eject: [2.6, -2.9], casing: 'rifle', magAxis: [0, 1], magGrab: [2.3, 4.0], magPull: 8, charge: [-5.4, -3.0] },
  mule: { id: 'mule', name: 'KATIR .50', cls: 'TABANCA', paint: mule, box: [-5, -8, 10, 7], gripB: [1.2, 0.8], muzzle: [8.7, -4.5],
    parts: ['mag', 'body', 'slide'], eject: [3.4, -5.4], casing: 'pistol', magAxis: [-0.2, 0.98], magGrab: [-2.5, 4.6], magPull: 8, slide: 2.8, charge: [-2.6, -5.0] },
  hornet: { id: 'hornet', name: 'ARI', cls: 'SMG', paint: hornet, box: [-12, -7, 14, 11], gripB: [8.6, 1.8], muzzle: [12.8, -2.7],
    parts: ['mag', 'body'], eject: [0.2, -3.6], casing: 'pistol', magAxis: [0, 1], magGrab: [1.9, 5.0], magPull: 10, charge: [-3.6, -4.4] },
  lynx: { id: 'lynx', name: 'VAŞAK', cls: 'SMG', paint: lynx, box: [-14, -8, 18, 9], gripB: [5.0, 0.2], muzzle: [17.4, -2.6],
    parts: ['mag', 'body'], eject: [1.4, -3.4], casing: 'pistol', magAxis: [0.25, 0.97], magGrab: [2.6, 4.4], magPull: 8.5, charge: [-4.2, -4.2] },
  bastion: { id: 'bastion', name: 'BURÇ BR', cls: 'TÜFEK', paint: bastion, box: [-19, -9, 28, 9], gripB: [13.0, -0.4], muzzle: [27.6, -2.6],
    parts: ['mag', 'body'], eject: [2.2, -3.4], casing: 'rifle', magAxis: [0.3, 0.95], magGrab: [4.0, 4.6], magPull: 8.5, charge: [-5.8, -4.6] },
  saw: { id: 'saw', name: 'TESTERE-20', cls: 'POMPALI', paint: saw, box: [-18, -7, 27, 9], gripB: [14.0, -0.6], muzzle: [26.0, -2.7],
    parts: ['mag', 'body'], eject: [2.6, -3.4], casing: 'shell', magAxis: [0, 1], magGrab: [3.4, 5.0], magPull: 9, charge: [-5.0, -4.6] },
  longbow: { id: 'longbow', name: 'KARTAL', cls: 'KESKİN NİŞANCI', paint: longbow, box: [-22, -11, 38, 7], gripB: [17.0, -0.8], muzzle: [37.6, -2.8],
    parts: ['mag', 'body'], eject: [2.0, -4.6], casing: 'rifle', magAxis: [0, 1], magGrab: [2.7, 3.6], magPull: 7, charge: [-4.5, -0.6] },
  anvil: { id: 'anvil', name: 'ÖRS LMG', cls: 'AĞIR', paint: anvil, box: [-19, -9, 30, 9], gripB: [15.0, -0.6], muzzle: [29.6, -3.0],
    parts: ['mag', 'body'], eject: [2.8, -1.0], casing: 'rifle', magAxis: [0, 1], magGrab: [2.8, 6.0], magPull: 10, charge: [-5.6, -4.8] },
  thumper: { id: 'thumper', name: 'TOKMAK GL', cls: 'PATLAYICI', paint: thumper, box: [-16, -9, 20, 7], gripB: [14.0, 2.2], muzzle: [19.6, -2.8],
    parts: ['body'], eject: [7.2, -2.2], casing: 'shell', port: [7.2, 1.2] },
};
