// KOR LAB — the buildings: the street-side facades as separate
// pieces, laid out along a level so the street never repeats itself.
//
// Each building is painted in its own frame: x 0..w along the street, the
// pavement at y = 0, the roofline at y = -h, roof clutter above it. They sit
// in the background (flat colour, no outline, saturation held low), so the
// play layer always reads first; the detail is in the shapes: cornices,
// sills and lintels, drainpipes, AC units, water tanks, posters, cables,
// grime at the foot of every wall. Lights and glows each building throws
// are listed with it and placed by the scene.
import { fill, stroke, clip, rng } from '../kit.js';
import { C } from '../style.js';
import { emblem } from '../enemies/syndicate.js';

const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

const P = {
  trim: '#262b37', deep: '#1c2129', soot: '#15171d', sill: '#555a68', sillHi: '#6a7080',
  brick: '#4a3a40', brickHi: '#554550', brickLo: '#3a2e35',
  plaster: '#3c4a4d', plasterHi: '#475659', plasterLo: '#303c3f',
  conc: '#4a4c58', concHi: '#555866', concLo: '#3c3e49',
  panel: '#39445a', panelHi: '#435069', panelLo: '#2e374a',
  metal: '#2e3646', metalHi: '#3c4558',
  warm: '#ffbe78', warmLo: '#e48a52', cold: '#7fb3c8', coldLo: '#4f7f96',
};

// --- shared pieces --------------------------------------------------------------
// a window with its frame, lintel and sill; kind: warm, blind, cold, dark,
// broken, boarded, ember
function win(g, x, y, w, h, kind, bars = true) {
  fill(g, rect(x - 1.2, y - 2.4, x + w + 1.2, y - 1), P.sill);
  fill(g, rect(x - 0.9, y - 0.9, x + w + 0.9, y + h + 0.9), P.trim);
  const W = rect(x, y, x + w, y + h);
  if (kind === 'warm' || kind === 'blind') {
    fill(g, W, P.warm);
    fill(g, rect(x, y + h * 0.55, x + w, y + h), P.warmLo);
    if (kind === 'blind') for (let k = y + 1.2; k < y + h; k += 1.7) fill(g, rect(x, k, x + w, k + 0.6), '#b0663e', 0.55);
    else fill(g, rect(x + w * 0.64, y, x + w, y + h), '#a55a38', 0.5);
    g.save(); g.globalCompositeOperation = 'lighter'; fill(g, rect(x - 2.5, y - 2.5, x + w + 2.5, y + h + 2.5), '#ff9a5c', 0.07); g.restore();
  } else if (kind === 'cold') {
    fill(g, W, P.cold); fill(g, rect(x, y + h * 0.6, x + w, y + h), P.coldLo);
    fill(g, rect(x + w * 0.2, y + h * 0.35, x + w * 0.42, y + h), '#26323f', 0.7);
  } else if (kind === 'broken') {
    fill(g, W, '#0e1015');
    clip(g, W, () => {
      fill(g, poly([[x, y], [x + w * 0.45, y], [x + w * 0.2, y + h * 0.35], [x, y + h * 0.5]]), '#2b3342');
      fill(g, poly([[x + w, y + h], [x + w * 0.6, y + h], [x + w * 0.85, y + h * 0.6]]), '#2b3342');
    });
  } else if (kind === 'boarded') {
    fill(g, W, '#121419');
    for (const [a, b] of [[0.15, 0.3], [0.55, 0.7]]) fill(g, poly([[x - 0.6, y + h * a], [x + w + 0.6, y + h * (a - 0.12)], [x + w + 0.6, y + h * (b - 0.12)], [x - 0.6, y + h * b]]), '#574535');
  } else if (kind === 'ember') {
    fill(g, W, '#1c0b07');
    fill(g, rect(x, y + h * 0.45, x + w, y + h), '#7a2a12');
    fill(g, rect(x, y + h * 0.75, x + w, y + h), '#c4441a');
  } else {
    fill(g, W, '#181d27');
    fill(g, poly([[x, y], [x + w * 0.42, y], [x, y + h * 0.62]]), '#283041');
  }
  if (bars && kind !== 'broken' && kind !== 'boarded') {
    fill(g, rect(x + w / 2 - 0.35, y, x + w / 2 + 0.35, y + h), P.trim);
    fill(g, rect(x, y + h * 0.42 - 0.35, x + w, y + h * 0.42 + 0.35), P.trim);
  }
  fill(g, rect(x - 1.8, y + h + 0.9, x + w + 1.8, y + h + 2.2), P.sill);
  fill(g, rect(x - 1.8, y + h + 0.9, x + w + 1.8, y + h + 1.3), P.sillHi);
}

// a ledge along the roof or a floor line: a lit top edge, a shadow under it
function cornice(g, x0, x1, y, d = 3) {
  fill(g, rect(x0 - 1.5, y, x1 + 1.5, y + d), P.trim);
  fill(g, rect(x0 - 1.5, y, x1 + 1.5, y + 0.7), '#5c6476');
  fill(g, rect(x0, y + d, x1, y + d + 1.6), '#000', 0.25);
}

// soot and wet grime at the foot of a wall, a darker plinth
function grime(g, x0, x1, h = 7, seed = 1) {
  fill(g, rect(x0, -h, x1, 0), '#000', 0.2);
  fill(g, rect(x0, -2.2, x1, 0), '#000', 0.25);
  const r = rng(seed);
  for (let x = x0 + 3; x < x1 - 2; x += 5 + r() * 9) fill(g, rect(x, -h - r() * 6, x + 0.8 + r() * 1.2, -h + 1), '#000', 0.14);
}

function pipe(g, x, y0, y1) {
  fill(g, rect(x - 0.9, y0, x + 0.9, y1), P.metal);
  fill(g, rect(x - 0.9, y0, x - 0.3, y1), P.metalHi);
  for (let y = y0 + 6; y < y1 - 2; y += 14) fill(g, rect(x - 1.5, y, x + 1.5, y + 1.2), P.deep);
  fill(g, poly([[x - 0.9, y1 - 3], [x + 0.9, y1 - 3], [x + 3, y1], [x - 0.9, y1]]), P.metal);
}

function acUnit(g, x, y) {
  fill(g, rect(x, y, x + 10, y + 7), '#5b6170');
  fill(g, rect(x, y, x + 10, y + 1), '#6f7686');
  for (let k = x + 1.4; k < x + 6; k += 1.2) fill(g, rect(k, y + 1.8, k + 0.5, y + 6), '#3c414d');
  fill(g, ell(x + 7.8, y + 3.8, 1.7, 1.7), '#3c414d');
  fill(g, rect(x + 1, y + 7, x + 2, y + 8.6), P.deep); fill(g, rect(x + 8, y + 7, x + 9, y + 8.6), P.deep);
  // a drip stain under it
  fill(g, rect(x + 4.6, y + 8.6, x + 5.4, y + 20), '#000', 0.18);
}

function waterTank(g, x, top) {
  // legs, the barrel with hoops, a conical lid
  for (const lx of [x + 2, x + 13]) fill(g, rect(lx, top - 10, lx + 1.2, top), P.deep);
  fill(g, poly([[x + 2, top - 10], [x + 14.2, top - 2], [x + 14.2, top - 0.8], [x + 2, top - 8.8]]), P.deep);
  fill(g, rect(x, top - 26, x + 16, top - 10), '#4e4146');
  fill(g, rect(x, top - 26, x + 3, top - 10), '#5b4c51');
  for (const y of [top - 22, top - 15]) fill(g, rect(x - 0.3, y, x + 16.3, y + 0.9), P.deep);
  fill(g, poly([[x - 1, top - 26], [x + 8, top - 31], [x + 17, top - 26]]), '#3a3035');
}

function antenna(g, x, top, h = 18) {
  stroke(g, `M ${x} ${top} L ${x} ${top - h}`, P.deep, 0.7);
  for (let k = 1; k <= 3; k++) stroke(g, `M ${x - 4 + k} ${top - h + k * 4} L ${x + 4 - k} ${top - h + k * 4}`, P.deep, 0.5);
}

// a torn poster; c: its colour, mark: Syndicate emblem or a stripe
function poster(g, x, y, w, h, c, mark = false) {
  fill(g, poly([[x, y], [x + w, y + 0.4], [x + w - 0.6, y + h * 0.7], [x + w * 0.7, y + h], [x + 0.4, y + h]]), c);
  fill(g, rect(x + 1, y + h * 0.62, x + w - 1.2, y + h * 0.66), '#000', 0.25);
  if (mark) emblem(g, x + w / 2, y + h * 0.36, Math.min(w, h) * 0.22, '#e8d9d9');
  else fill(g, rect(x + 1.2, y + 1.4, x + w - 1.6, y + h * 0.4), '#fff', 0.18);
}

// a spray tag
function tag(g, x, y, c, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  stroke(g, 'M 0 0 C 2 -5 4 -5 4 -1 C 4 2 7 2 8 -3 M 9 -4 C 9 0 11 1 13 -2 C 14 -4 16 -4 16 -1', c, 0.9, 0.75);
  stroke(g, 'M -1 2.4 L 17 1.4', c, 0.5, 0.55);
  g.restore();
}

function door(g, x, w, h, light = true) {
  fill(g, rect(x - 1.4, -h - 1.4, x + w + 1.4, 0), P.trim);
  fill(g, rect(x, -h, x + w, 0), '#20262f');
  fill(g, rect(x + 1, -h + 1, x + w - 1, -h * 0.55), '#2a3140');
  fill(g, rect(x + w - 2.4, -h * 0.5, x + w - 1.4, -h * 0.5 + 1.4), '#8d94a3');
  fill(g, rect(x - 2.2, -1.2, x + w + 2.2, 0), P.sill);
  if (light) {
    fill(g, rect(x + w / 2 - 1.6, -h - 4.6, x + w / 2 + 1.6, -h - 2.4), '#ffe2b0');
    g.save(); g.globalCompositeOperation = 'lighter';
    fill(g, poly([[x + w / 2 - 1.6, -h - 2.4], [x + w / 2 + 1.6, -h - 2.4], [x + w + 3, -h + 10], [x - 3, -h + 10]]), '#ffcf8f', 0.08);
    g.restore();
  }
}

// a hanging cable from (x0, y0) to (x1, y1) with a sag
function cable(g, x0, y0, x1, y1, sag = 6) {
  stroke(g, `M ${x0} ${y0} Q ${(x0 + x1) / 2} ${Math.max(y0, y1) + sag} ${x1} ${y1}`, '#11141a', 0.45);
}

function brickWall(g, x0, x1, top, seed) {
  fill(g, rect(x0, top, x1, 0), P.brick);
  const r = rng(seed);
  for (let y = top + 3; y < -2; y += 3) {
    stroke(g, `M ${x0} ${y} L ${x1} ${y}`, P.brickLo, 0.3, 0.55);
    const off = ((y - top) / 3) % 2 ? 3 : 0;
    for (let x = x0 + off; x < x1; x += 6) stroke(g, `M ${x} ${y} L ${x} ${y + 3}`, P.brickLo, 0.25, 0.4);
  }
  // a few lighter and darker bricks
  for (let i = 0; i < 26; i++) {
    const x = x0 + r() * (x1 - x0 - 6), y = top + 3 + Math.floor(r() * ((-top - 6) / 3)) * 3;
    fill(g, rect(x, y + 0.3, x + 5.6, y + 2.8), r() > 0.5 ? P.brickHi : P.brickLo, 0.7);
  }
}

// a neon tube along a path: a coloured halo, then the pale hot core
function tube(g, d, c, w = 0.9) {
  g.save(); g.shadowColor = c; g.shadowBlur = 9; stroke(g, d, c, w); g.restore();
  stroke(g, d, '#fff3fa', w * 0.36);
}
function neonText(g, text, x, y, size, c, align = 'left') {
  g.save(); g.font = `700 ${size}px Rajdhani`; g.textBaseline = 'alphabetic'; g.textAlign = align;
  g.shadowColor = c; g.shadowBlur = 10; g.fillStyle = c; g.fillText(text, x, y);
  g.shadowBlur = 0; g.strokeStyle = '#fff3fa'; g.lineWidth = Math.max(0.16, size * 0.05); g.strokeText(text, x, y);
  g.restore();
}

// --- the buildings -------------------------------------------------------------------
// brick walk-up with a fire escape, a water tank and a stoop
function walkup(g) {
  const w = 150, h = 100;
  brickWall(g, 0, w, -h, 11);
  cornice(g, 0, w, -h - 3, 3);
  cornice(g, 0, w, -66, 2);
  const kinds = [['warm', 'dark', 'blind', 'dark'], ['dark', 'warm', 'dark', 'cold']];
  kinds.forEach((row, j) => row.forEach((k, i) => win(g, 12 + i * 34, j ? -54 : -90, 15, 18, k)));
  // fire escape: platforms, rails, the drop ladder
  for (const y of [-64, -30]) {
    fill(g, rect(42, y, 96, y + 1.6), P.deep);
    for (let x = 43; x < 96; x += 3) fill(g, rect(x, y - 7, x + 0.6, y), P.deep);
    fill(g, rect(42, y - 7.4, 96, y - 6.6), P.deep);
    for (const bx of [46, 90]) stroke(g, `M ${bx} ${y + 1.6} L ${bx + 5} ${y + 7}`, P.deep, 0.8);
  }
  fill(g, poly([[88, -30], [94, -30], [78, -64], [72, -64]]), P.deep);
  for (let k = 0; k < 8; k++) { const t = k / 8; stroke(g, `M ${72 + t * 16} ${-64 + t * 34} L ${78 + t * 16} ${-64 + t * 34}`, '#2b313d', 0.4); }
  for (const x of [52, 56]) fill(g, rect(x, -30, x + 0.7, -14), P.deep);
  for (let y = -27; y > -30; y -= 3) fill(g, rect(52, -18, 56.7, -17.4), P.deep);
  // the entrance and its stoop
  door(g, 112, 14, 24);
  // a basement bar's blade sign: a cocktail glass over the letters
  fill(g, rect(99, -52, 108, -24), '#16121a'); fill(g, rect(98, -50, 99, -26), P.deep);
  tube(g, 'M 100.6 -50 L 106.4 -50 L 103.5 -46.4 Z M 103.5 -46.4 L 103.5 -44 M 101.6 -44 L 105.4 -44', '#ff3fa4', 0.5);
  ['B', 'A', 'R'].forEach((ch, i) => neonText(g, ch, 103.5, -37.6 + i * 5, 4.6, '#ff3fa4', 'center'));
  fill(g, rect(108, -3, 130, 0), P.concHi); fill(g, rect(110, -5, 128, -3), P.conc);
  acUnit(g, 18, -46); acUnit(g, 120, -84);
  pipe(g, 6, -h, 0);
  poster(g, 22, -26, 10, 13, '#7d2b2b', true); poster(g, 33, -24, 9, 11, '#c9b991');
  tag(g, 64, -10, C.ember, 0.9);
  grime(g, 0, w, 7, 3);
  // roof
  waterTank(g, 20, -h - 3); antenna(g, 120, -h - 3, 16);
  cable(g, 0, -72, 40, -70, 5);
}

// painted plaster walk-up: balconies, shutters, a corner shop with a lit window
function walkupB(g) {
  const w = 128, h = 110;
  fill(g, rect(0, -h, w, 0), P.plaster);
  fill(g, rect(0, -h, 4, 0), P.plasterHi);
  for (let y = -h + 20; y < -30; y += 36) fill(g, rect(0, y, w, y + 1), P.plasterLo);
  cornice(g, 0, w, -h - 3, 3);
  const kinds = [['dark', 'warm', 'dark'], ['cold', 'dark', 'boarded']];
  kinds.forEach((row, j) => row.forEach((k, i) => {
    const x = 14 + i * 38, y = j ? -64 : -98;
    win(g, x, y, 14, 20, k);
    // shutters on the dark ones
    if (k === 'dark') { fill(g, rect(x - 5, y, x - 1.2, y + 20), '#2e4448'); fill(g, rect(x + 15.2, y, x + 19, y + 20), '#2e4448'); }
    // a balcony with a railing
    fill(g, rect(x - 4, y + 22, x + 18, y + 24), P.trim);
    for (let k2 = x - 3; k2 < x + 18; k2 += 2.4) fill(g, rect(k2, y + 15, k2 + 0.5, y + 22), P.deep);
    fill(g, rect(x - 4, y + 14.6, x + 18, y + 15.6), P.deep);
  }));
  // the corner shop
  fill(g, rect(8, -34, 90, 0), P.trim);
  fill(g, rect(10, -30, 60, -6), P.warm); fill(g, rect(10, -16, 60, -6), P.warmLo);
  for (const x of [26, 43]) fill(g, rect(x, -30, x + 0.8, -6), P.trim);
  for (const [x, y, c] of [[14, -14, '#3d6b5a'], [20, -15, '#8a3a2a'], [32, -13, '#c9a95a'], [48, -15, '#3d5a7a']]) fill(g, rect(x, y, x + 4, -6), c);
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, rect(6, -34, 64, 0), '#ff9a5c', 0.07); g.restore();
  door(g, 68, 14, 26, false);
  fill(g, rect(6, -40, 92, -34), '#0f2420');
  neonText(g, 'BAKKAL · 24', 22, -35.4, 5, '#4dff9a');
  pipe(g, w - 5, -h, 0);
  acUnit(g, 96, -82);
  poster(g, 96, -28, 10, 14, '#7d2b2b', true);
  tag(g, 98, -8, '#3ee8e0', 0.7);
  grime(g, 0, w, 6, 7);
  antenna(g, 18, -h - 3, 20); antenna(g, 104, -h - 3, 12);
  fill(g, rect(60, -h - 9, 84, -h - 3), '#3a4448'); fill(g, rect(62, -h - 13, 66, -h - 9), '#3a4448');
}

// HAWK's shop: awning, half-open roller door, neon sign, flat above
function crow(g) {
  const w = 160, h = 112;
  fill(g, rect(0, -h, w, 0), P.conc);
  fill(g, rect(0, -h, w, -h + 30), P.concHi, 0.5);
  for (let x = 40; x < w; x += 40) fill(g, rect(x, -h, x + 0.8, -50), P.concLo);
  cornice(g, 0, w, -h - 3, 3);
  [['dark', 18], ['dark', 54], ['warm', 90], ['blind', 126]].forEach(([k, x]) => win(g, x, -104 + 2, 18, 15, k));
  // the shop front
  fill(g, rect(22, -44, 136, 0), P.trim);
  fill(g, rect(24, -42, 134, 0), '#1f1a20');
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, rect(24, -16, 134, 0), '#ff8a4c', 0.28); g.restore();
  for (let y = -42; y < -16; y += 2.2) stroke(g, `M 24 ${y} L 134 ${y}`, '#5c6070', 0.6);
  fill(g, rect(24, -17.4, 134, -16), '#2a2d36');
  // goods glimpsed under the door: crates and a lamp
  for (const [x, ww, hh] of [[34, 10, 8], [46, 8, 12], [104, 12, 9]]) fill(g, rect(x, -hh, x + ww, 0), '#3a2a24');
  // awning
  const AW = poly([[18, -60], [140, -60], [146, -48], [12, -48]]);
  fill(g, AW, '#e8dccb');
  clip(g, AW, () => { for (let x = 8; x < 150; x += 8) fill(g, poly([[x, -60], [x + 4, -60], [x + 4 + (x - 79) * 0.05, -48], [x + (x - 79) * 0.05, -48]]), '#b5452e'); fill(g, rect(8, -54, 150, -48), '#000', 0.18); });
  fill(g, rect(12, -48.5, 146, -46.5), '#7a2a22');
  for (let x = 12; x < 146; x += 8) fill(g, rect(x, -46.5, x + 4, -45.2), '#b5452e');
  for (const x of [16, 142]) stroke(g, `M ${x} -60 L ${x - 4} -70`, P.deep, 0.6);
  // the neon sign on its frame
  fill(g, rect(40, -86, 120, -84.8), P.deep);
  for (const x of [46, 114]) fill(g, rect(x, -84.8, x + 0.8, -64), P.deep);
  const neon = '#ff6b52';
  const BIRD = 'M 44 -74 C 46 -79 51 -81 55 -79 L 61 -80.4 L 56.6 -77.2 C 56.4 -73.6 53 -71.4 48.6 -72 L 44.4 -68.6 L 45.6 -72.8 Z';
  g.save(); g.shadowColor = neon; g.shadowBlur = 12;
  g.font = '700 22px Rajdhani'; g.fillStyle = neon; g.fillText('HAWK', 64, -66);
  stroke(g, BIRD, neon, 1.1);
  g.restore();
  stroke(g, BIRD, '#ffd8cc', 0.45);
  g.font = '700 22px Rajdhani'; g.fillStyle = '#ffd8cc'; g.fillText('HAWK', 64, -66);
  pipe(g, 6, -h, 0); pipe(g, 152, -h, 0);
  acUnit(g, 8, -36);
  tag(g, 140, -12, '#c9b991', 0.6);
  grime(g, 0, w, 6, 5);
  waterTank(g, 118, -h - 3);
  fill(g, rect(30, -h - 8, 70, -h - 3), '#3a3d48');
  for (let x = 32; x < 70; x += 3) fill(g, rect(x, -h - 7.4, x + 1.4, -h - 3.6), '#2a2d36');
}

// clad warehouse: loading door, pipes, a floodlight, a stencilled number
function warehouse(g) {
  const w = 164, h = 88;
  fill(g, rect(0, -h, w, 0), P.panel);
  for (let x = 4; x < w; x += 6) { fill(g, rect(x, -h, x + 1.6, 0), P.panelLo, 0.8); fill(g, rect(x + 1.6, -h, x + 2.2, 0), P.panelHi, 0.6); }
  // a sawtooth roof edge and gutter
  for (let x = 0; x < w; x += 20) fill(g, poly([[x, -h], [x + 20, -h - 10], [x + 20, -h]]), P.panelLo);
  fill(g, rect(-1, -h - 1.6, w + 1, -h + 0.4), P.trim);
  // the loading door
  fill(g, rect(28, -60, 112, 0), P.trim);
  fill(g, rect(30, -56, 110, 0), '#2a3242');
  for (let y = -54; y < 0; y += 3) { stroke(g, `M 30 ${y} L 110 ${y}`, '#3a4458', 0.5); stroke(g, `M 30 ${y + 0.6} L 110 ${y + 0.6}`, '#222838', 0.4); }
  clip(g, rect(30, -62, 110, -56), () => { fill(g, rect(30, -62, 110, -56), C.gold); for (let x = 20; x < 120; x += 6) fill(g, poly([[x, -56], [x + 3, -56], [x + 9, -62], [x + 6, -62]]), '#1a1c20'); });
  fill(g, rect(26, -4, 30, 0), C.gold, 0.8); fill(g, rect(110, -4, 114, 0), C.gold, 0.8);
  g.font = '700 26px Rajdhani'; g.fillStyle = 'rgba(232,226,214,0.25)'; g.fillText('12', 132, -50);
  g.save(); g.font = '700 26px Rajdhani'; g.shadowColor = '#3ee8e0'; g.shadowBlur = 10; g.strokeStyle = '#3ee8e0'; g.lineWidth = 0.8; g.strokeText('12', 132, -50);
  g.shadowBlur = 0; g.strokeStyle = '#eafffd'; g.lineWidth = 0.28; g.strokeText('12', 132, -50); g.restore();
  tube(g, 'M 28 -64 L 112 -64', '#3ee8e0', 0.7);
  // pipes and a vent box
  fill(g, rect(120, -84, 124, 0), '#2a3242'); fill(g, rect(132, -84, 135, -20), '#2a3242');
  fill(g, rect(114, -70, 152, -66), '#2a3242');
  for (const [x, y] of [[140, -82], [10, -80]]) { fill(g, rect(x, y, x + 16, y + 10), '#2e3748'); for (let k = 1; k < 5; k++) stroke(g, `M ${x + 1} ${y + k * 2} L ${x + 15} ${y + k * 2}`, '#46516a', 0.5); }
  // floodlight on a bracket
  fill(g, rect(70, -76, 71, -68), P.deep);
  fill(g, poly([[66, -80], [76, -80], [74, -76], [68, -76]]), '#3c4558');
  fill(g, rect(67, -76.4, 75, -75.6), '#f2f4ff');
  g.save(); g.globalCompositeOperation = 'lighter';
  fill(g, poly([[67, -75.6], [75, -75.6], [92, -10], [50, -10]]), '#d8e6ff', 0.05);
  g.restore();
  poster(g, 8, -30, 12, 16, '#7d2b2b', true);
  tag(g, 116, -10, C.ember, 1.0);
  grime(g, 0, w, 8, 9);
}

// the Syndicate block: concrete, barred windows, a banner, a camera, a red strip
function synBlock(g) {
  const w = 150, h = 104;
  fill(g, rect(0, -h, w, 0), '#3e3f4b');
  for (let y = -h + 26; y < 0; y += 26) fill(g, rect(0, y, w, y + 0.8), '#353642');
  for (let x = 30; x < w; x += 30) fill(g, rect(x, -h, x + 0.8, 0), '#353642');
  cornice(g, 0, w, -h - 4, 4);
  for (const [x, y] of [[12, -92], [104, -92], [104, -58], [12, -58]]) {
    win(g, x, y, 18, 20, 'dark');
    for (let k = x + 2; k < x + 18; k += 3) fill(g, rect(k, y, k + 0.7, y + 20), '#11141a');
  }
  // banner
  const BN = poly([[46, -96], [82, -96], [82, -42], [64, -48], [46, -42]]);
  fill(g, BN, '#8e2330');
  fill(g, rect(46, -96, 82, -92), '#5a1219');
  fill(g, rect(46, -92, 49, -46), '#000', 0.15);
  emblem(g, 64, -72, 8, '#f0d9d9');
  // the red light strip and a camera on a bracket
  fill(g, rect(0, -h + 6, w, -h + 7.6), C.danger, 0.85);
  fill(g, rect(130, -40, 140, -38), P.deep); fill(g, poly([[134, -38], [146, -40], [146, -35], [134, -34]]), '#5a6070'); fill(g, ell(145, -37.4, 0.7, 0.7), C.danger);
  // reinforced door and propaganda
  fill(g, rect(92, -30, 118, 0), P.trim); fill(g, rect(94, -28, 116, 0), '#2a2f3a');
  for (let y = -26; y < 0; y += 5) fill(g, rect(94, y, 116, y + 0.8), '#1c2028');
  fill(g, rect(94, -36, 116, -30.6), '#1a0a0e');
  neonText(g, 'İTAAT', 105, -31.6, 4.2, '#ff3347', 'center');
  tube(g, 'M 128.5 -86 L 143.5 -86 L 136 -72 Z M 131.8 -82 L 140.2 -82', '#ff3347', 0.75);
  poster(g, 18, -30, 11, 15, '#8e2330', true); poster(g, 31, -28, 10, 13, '#8e2330', true); poster(g, 58, -26, 9, 12, '#c9b991');
  tag(g, 20, -6, '#3ee8e0', 0.8);
  grime(g, 0, w, 7, 13);
  antenna(g, 136, -h - 4, 22);
  fill(g, rect(10, -h - 10, 34, -h - 4), '#35363f');
}

// a narrow tall hotel with a vertical neon sign and balconies
function hotel(g) {
  const w = 96, h = 134;
  fill(g, rect(0, -h, w, 0), '#3f3b4e');
  fill(g, rect(0, -h, 3, 0), '#4a4659');
  cornice(g, 0, w, -h - 3, 3);
  for (let j = 0; j < 4; j++) {
    const y = -122 + j * 26;
    fill(g, rect(0, y + 22, w, y + 23), '#36324a');
    [['warm', 'dark'], ['dark', 'blind'], ['cold', 'warm'], ['dark', 'dark']][j].forEach((k, i) => {
      const x = 12 + i * 34;
      win(g, x, y, 16, 15, k);
      if (j < 3) {
        fill(g, rect(x - 3, y + 17.5, x + 19, y + 19), P.trim);
        for (let k2 = x - 2; k2 < x + 19; k2 += 2.2) fill(g, rect(k2, y + 12.6, k2 + 0.45, y + 17.5), P.deep);
        fill(g, rect(x - 3, y + 12.2, x + 19, y + 13), P.deep);
      }
    });
  }
  // the vertical neon sign
  fill(g, rect(78, -118, 92, -50), '#1d1f2a'); fill(g, rect(76, -116, 78, -114), P.deep); fill(g, rect(76, -54, 78, -52), P.deep);
  const neon = '#56e6ff';
  g.save(); g.shadowColor = neon; g.shadowBlur = 10;
  g.font = '700 13px Rajdhani'; g.fillStyle = neon;
  ['O', 'T', 'E', 'L'].forEach((ch, i) => g.fillText(ch, 80.6, -104 + i * 15));
  g.restore();
  g.font = '700 13px Rajdhani'; g.fillStyle = '#d8faff';
  ['O', 'T', 'E', 'L'].forEach((ch, i) => g.fillText(ch, 80.6, -104 + i * 15));
  // entrance with a canopy
  door(g, 36, 18, 26, false);
  fill(g, poly([[30, -30], [60, -30], [62, -26], [28, -26]]), '#5a2a3a');
  fill(g, rect(28, -26, 62, -25), '#2a1218');
  tube(g, 'M 28.6 -25.6 L 61.4 -25.6', '#ff3fa4', 0.7);
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, rect(34, -25, 56, 0), '#ffcf8f', 0.08); g.restore();
  pipe(g, 4, -h, 0);
  acUnit(g, 10, -18);
  poster(g, 66, -28, 9, 12, '#c9b991');
  grime(g, 0, w, 6, 17);
  antenna(g, 20, -h - 3, 24);
  fill(g, rect(40, -h - 8, 70, -h - 3), '#35324a');
}

// auto repair: a wide bay with the work light on, tyres, a hand-painted sign
function garage(g) {
  const w = 132, h = 76;
  fill(g, rect(0, -h, w, 0), '#4a4646');
  for (let y = -h + 8; y < 0; y += 8) fill(g, rect(0, y, w, y + 0.6), '#403c3c');
  cornice(g, 0, w, -h - 3, 3);
  // sign board
  fill(g, rect(12, -70, 120, -56), '#142233'); fill(g, rect(12, -70, 120, -68), '#1e3248');
  neonText(g, 'OTO SERVİS', 66, -59, 10, '#5aa8ff', 'center');
  fill(g, rect(14, -56, 118, -55), '#000', 0.3);
  // the open bay, lit inside: a car on the lift in silhouette
  fill(g, rect(14, -50, 96, 0), P.trim);
  fill(g, rect(16, -48, 94, 0), '#3a3230');
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, rect(16, -48, 94, 0), '#ffd9a0', 0.16); g.restore();
  fill(g, rect(16, -48, 94, -40), '#2a2a2e');
  for (let y = -47; y < -40; y += 1.6) fill(g, rect(16, y, 94, y + 0.5), '#3c3c42');
  // the lift: two posts and arms, a hatchback raised on it
  for (const x of [22, 88]) { fill(g, rect(x, -40, x + 2.4, 0), '#26262a'); fill(g, rect(x - 1, -2, x + 3.4, 0), '#1c1c20'); }
  fill(g, rect(24, -19, 88, -17.6), '#26262a');
  const CAR = 'M 28 -19 L 28 -24 C 28 -26 30 -27 33 -27.4 L 40 -28 L 47 -34.6 C 48 -35.4 50 -35.8 54 -35.8 L 70 -35.8 C 74 -35.8 76 -35 78 -33 L 82 -27.6 C 84 -27 85 -26 85 -24 L 85 -19 Z';
  fill(g, CAR, '#1c1c22');
  fill(g, 'M 49 -33.4 L 57 -33.4 L 57 -28.4 L 44 -28.4 Z', '#4a4038'); fill(g, 'M 59 -33.4 L 71 -33.4 C 73 -33.4 74.4 -32.6 75.6 -31 L 78 -28.4 L 59 -28.4 Z', '#4a4038');
  for (const wx of [37, 75]) { fill(g, ell(wx, -19.6, 3.8, 3.8), '#111114'); fill(g, ell(wx, -19.6, 1.6, 1.6), '#3a3a40'); }
  // tyres stacked by the door
  for (let k = 0; k < 3; k++) { fill(g, ell(108, -3 - k * 5, 7, 2.6), '#1a1a1e'); fill(g, ell(108, -3 - k * 5, 3, 1.1), '#2a2a2e'); }
  fill(g, ell(122, -3, 6, 2.4), '#1a1a1e');
  // an oil drum and a hanging lamp
  fill(g, rect(98, -24, 106, -14), '#7a3a2a'); fill(g, rect(98, -21, 106, -20.2), '#4a2218');
  pipe(g, 4, -h, 0);
  tag(g, 100, -40, C.ember, 0.7);
  grime(g, 0, w, 7, 19);
  for (let x = 6; x < w; x += 18) fill(g, rect(x, -h - 6, x + 1, -h - 3), P.deep);
  stroke(g, `M 6 ${-h - 5.4} L ${w - 6} ${-h - 5.4}`, P.deep, 0.5);
}

// a burnt-out block: broken roofline, scorched window holes glowing inside,
// exposed rebar, rubble at its foot
function ruin(g) {
  const w = 120;
  const TOP = poly([[0, 0], [0, -92], [18, -96], [30, -88], [40, -100], [58, -84], [70, -90], [82, -70], [94, -78], [108, -60], [120, -64], [120, 0]]);
  fill(g, TOP, '#3a3436');
  clip(g, TOP, () => {
    brickWall(g, 0, w, -100, 23);
    fill(g, rect(0, -100, w, 0), '#000', 0.25);
    // scorch above each hole
    for (const [x, y] of [[12, -78], [44, -78], [76, -50], [12, -44], [44, -44]]) {
      fill(g, `M ${x - 3} ${y + 2} C ${x - 4} ${y - 8} ${x + 2} ${y - 20} ${x + 8} ${y - 24} C ${x + 14} ${y - 18} ${x + 20} ${y - 8} ${x + 18} ${y + 2} Z`, '#120d0e', 0.45);
      fill(g, `M ${x} ${y + 1} C ${x} ${y - 6} ${x + 4} ${y - 13} ${x + 7} ${y - 15} C ${x + 11} ${y - 12} ${x + 15} ${y - 6} ${x + 15} ${y + 1} Z`, '#0c0909', 0.4);
    }
  });
  for (const [x, y, k] of [[12, -78, 'ember'], [44, -78, 'broken'], [76, -50, 'ember'], [12, -44, 'broken'], [44, -44, 'ember']]) win(g, x, y, 14, 18, k, false);
  // rebar sticking out of the broken top
  for (const [x, y, a] of [[30, -88, -0.4], [58, -84, 0.3], [82, -70, -0.2], [94, -78, 0.5]]) stroke(g, `M ${x} ${y} l ${Math.sin(a) * 8} ${-Math.cos(a) * 8}`, '#5a3a2e', 0.6);
  // rubble
  for (const [x, wd, hh] of [[60, 18, 8], [76, 12, 5], [92, 22, 10], [110, 12, 6]]) fill(g, poly([[x, 0], [x + wd * 0.2, -hh], [x + wd * 0.6, -hh * 0.7], [x + wd, 0]]), '#4a4244');
  for (const [x, y] of [[66, -3], [84, -2], [98, -5], [104, -1]]) fill(g, rect(x, y, x + 3, y + 1.4), '#5a4e50');
  fill(g, rect(0, -100, w, 0), '#000', 0);
  tag(g, 8, -14, '#c9b991', 0.8);
  grime(g, 0, w, 9, 29);
}

// a dark alley between buildings: a chain-link fence, cables, a far light
function alley(g) {
  const w = 34;
  fill(g, rect(0, -104, w, 0), '#191c24');
  fill(g, rect(0, -104, w, -60), '#14161d');
  // far end lit
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, ell(w / 2, -6, 12, 7), '#ffcf8f', 0.08); g.restore();
  fill(g, rect(w / 2 - 6, -20, w / 2 + 6, 0), '#20242e');
  // fence
  fill(g, rect(2, -30, 3, 0), P.deep); fill(g, rect(w - 3, -30, w - 2, 0), P.deep);
  fill(g, rect(2, -30, w - 2, -29.2), P.deep);
  clip(g, rect(3, -29.2, w - 3, 0), () => {
    for (let k = -30; k < w + 30; k += 3) { stroke(g, `M ${k} -30 L ${k + 30} 0`, '#3a4150', 0.25, 0.8); stroke(g, `M ${k} 0 L ${k + 30} -30`, '#3a4150', 0.25, 0.8); }
  });
  for (const [y0, y1, s] of [[-80, -84, 8], [-70, -66, 10], [-92, -90, 6]]) cable(g, -2, y0, w + 2, y1, s);
  fill(g, rect(6, -64, 28, -55), '#16121a');
  neonText(g, 'BAR', 13.4, -57.2, 5.6, '#ff3fa4', 'center');
  tube(g, 'M 20.6 -59.6 L 26 -59.6 M 23.6 -62 L 26 -59.6 L 23.6 -57.2', '#ff3fa4', 0.55);
  fill(g, rect(6, -12, 14, 0), '#2e3a2e'); fill(g, rect(6, -13, 15, -11.6), '#3a473a');
}

// --- catalogue and layout ----------------------------------------------------------------
// w: width, top: highest point (for the bake box); lights: [x, y, radius,
// intensity, [r,g,b], flicker?]; glows: emissive sprites [x, y, sx, sy, colour, alpha, flicker?]
export const BUILDINGS = {
  walkup: { w: 150, top: -132, paint: walkup,
    lights: [[119, -26, 30, 0.5, [1, 0.85, 0.6]], [103.5, -38, 42, 0.75, [1, 0.25, 0.65], 'buzz']],
    glows: [[103.5, -38, 5.5, 13, '#ff3fa4', 0.4, 'buzz']] },
  walkupB: { w: 128, top: -126, paint: walkupB,
    lights: [[35, -18, 46, 0.6, [1, 0.7, 0.45]], [49, -40, 40, 0.6, [0.3, 1, 0.6]]],
    glows: [[49, -37, 25, 3.8, '#4dff9a', 0.3]] },
  crow: { w: 160, top: -142, paint: crow,
    lights: [[90, -72, 70, 0.95, [1, 0.4, 0.3], 'neon'], [79, -6, 60, 0.55, [1, 0.56, 0.32]]],
    glows: [[90, -74, 34, 14, '#ff6b52', 0.22, 'neon']] },
  warehouse: { w: 164, top: -100, paint: warehouse,
    lights: [[71, -74, 46, 0.7, [0.85, 0.9, 1]], [146, -60, 46, 0.6, [0.25, 0.9, 0.9], 'neon2'], [70, -64, 40, 0.5, [0.25, 0.9, 0.9]]],
    glows: [[71, -76, 6, 3, '#f2f4ff', 0.5], [146, -59, 14, 10, '#3ee8e0', 0.24, 'neon2'], [70, -64, 42, 2.2, '#3ee8e0', 0.3]] },
  synBlock: { w: 150, top: -134, paint: synBlock,
    lights: [[64, -100, 54, 0.45, [1, 0.22, 0.26]], [136, -79, 40, 0.6, [1, 0.2, 0.25], 'buzz'], [105, -33, 30, 0.5, [1, 0.2, 0.25]]],
    glows: [[75, -97.2, 76, 2.4, '#ff3347', 0.18], [136, -79, 10, 9, '#ff3347', 0.34, 'buzz'], [105, -33, 10, 2.6, '#ff3347', 0.35]] },
  hotel: { w: 96, top: -162, paint: hotel,
    lights: [[85, -84, 56, 0.8, [0.35, 0.9, 1], 'neon2'], [45, -24, 36, 0.6, [1, 0.25, 0.65]]],
    glows: [[85, -84, 12, 38, '#56e6ff', 0.16, 'neon2'], [45, -25.6, 18, 2.2, '#ff3fa4', 0.4]] },
  garage: { w: 132, top: -86, paint: garage,
    lights: [[55, -26, 64, 0.8, [1, 0.82, 0.58]], [66, -62, 56, 0.7, [0.35, 0.65, 1], 'neon2']],
    glows: [[66, -62, 40, 5, '#5aa8ff', 0.22, 'neon2']] },
  ruin: { w: 120, top: -104, paint: ruin,
    lights: [[50, -56, 66, 0.75, [1, 0.45, 0.2], 'fire']], glows: [[19, -69, 9, 6, '#ff7a35', 0.35, 'fire'], [83, -41, 9, 6, '#ff7a35', 0.35, 'fire'], [51, -35, 9, 6, '#ff7a35', 0.35, 'fire']] },
  alley: { w: 34, top: -106, paint: alley,
    lights: [[17, -60, 34, 0.6, [1, 0.25, 0.65], 'buzz']], glows: [[17, -60, 11, 4.4, '#ff3fa4', 0.4, 'buzz']] },
};

// A street of buildings from x0 to x1: the opening ones as given, then a
// shuffled run in which no building comes back within three of its last
// use, an alley now and then; HAWK's shop only where it is asked for.
// Returns [{ type, x }].
export function facadeLayout(x0, x1, seed = 1, first = ['walkup', 'crow', 'alley', 'warehouse']) {
  const r = rng(seed), out = [];
  const pool = ['walkup', 'walkupB', 'warehouse', 'synBlock', 'hotel', 'garage', 'ruin'];
  let x = x0, i = 0, sinceAlley = 0;
  const recent = [];
  while (x < x1) {
    let t = first[i];
    if (!t) {
      if (sinceAlley > 2 && r() < 0.35) t = 'alley';
      else { const ok = pool.filter((p) => !recent.includes(p)); t = ok[Math.floor(r() * ok.length)]; }
    }
    out.push({ type: t, x });
    x += BUILDINGS[t].w;
    sinceAlley = t === 'alley' ? 0 : sinceAlley + 1;
    if (t !== 'alley') { recent.push(t); if (recent.length > 3) recent.shift(); }
    i++;
  }
  return out;
}

// bake entries for every building type (background density, no outline)
export function buildingBakeList(scale) {
  return Object.entries(BUILDINGS).map(([t, b]) => ({ name: `b.${t}`, box: [-3, b.top, b.w + 3, 0.5], scale, paint: b.paint }));
}

// the old single-strip facade (dev scenes): four buildings in a row
export function facadeStrip(g) {
  let x = -10;
  for (const t of ['walkup', 'crow', 'warehouse', 'synBlock']) { g.save(); g.translate(x, 0); BUILDINGS[t].paint(g); g.restore(); x += BUILDINGS[t].w; }
}
