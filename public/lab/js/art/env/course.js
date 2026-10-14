// CINDERFALL LAB — M2 movement course: collision tiles and art from one
// description, so what you see is exactly what you stand on.
//
// 8-unit tiles, street level y = 0, 200 columns (1600 units). Every feature
// is placed in tile columns; its painter draws inside the same tile box.
import { cel, fill, stroke, clip, rng } from '../kit.js';
import { M, tone, C } from '../style.js';
import { Level, T } from '../../phys/level.js';
import { crate, barrier, lampPost, burnBarrel, dumpster, cone } from './street.js';
import { facadeLayout } from './city.js';

const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

export const COLS = 200, TOPY = -200, ROWS = 30; // row 25 is the street

// --- painters -----------------------------------------------------------------
export const CONT = {
  teal: tone('#5fa7a0', '#3f807a', '#2b5c58', '#13302e'),
  rust: tone('#c8664a', '#a04a33', '#723323', '#36150d'),
  navy: tone('#5d7896', '#425a76', '#2d4057', '#131d2a'),
};
export function container(g, x0, y0, x1, y1, t) {
  const B = rect(x0, y0, x1, y1);
  cel(g, B, t, { sh: 2.2, hl: 0.8 });
  clip(g, B, () => {
    // corrugation, top and bottom rails, a door pair with lock bars at one end
    for (let x = x0 + 3; x < x1 - 1; x += 3.2) { fill(g, rect(x, y0 + 2, x + 1.1, y1 - 2), t.d, 0.55); fill(g, rect(x + 1.1, y0 + 2, x + 1.6, y1 - 2), t.l, 0.35); }
    fill(g, rect(x0, y0, x1, y0 + 2), t.d); fill(g, rect(x0, y1 - 2, x1, y1), t.d);
    fill(g, rect(x0, y0, x1, y0 + 0.6), t.l, 0.6);
    const dx = x1 - 22;
    fill(g, rect(dx, y0 + 2, x1 - 2, y1 - 2), t.m);
    stroke(g, `M ${dx + 10} ${y0 + 2} L ${dx + 10} ${y1 - 2}`, t.k, 0.4);
    for (const lx of [dx + 4, dx + 7, dx + 13, dx + 16]) stroke(g, `M ${lx} ${y0 + 3} L ${lx} ${y1 - 3}`, t.k, 0.5);
    for (const lx of [dx + 7, dx + 13]) fill(g, rect(lx - 1, (y0 + y1) / 2 - 1.5, lx + 1, (y0 + y1) / 2 + 1.5), M.gunmetal.m);
    for (const hy of [y0 + 6, y1 - 7]) for (const hx of [dx + 0.6, x1 - 3]) fill(g, rect(hx, hy, hx + 1.6, hy + 2.2), t.k, 0.8);
    // corner castings, a data plate, rust streaks and a stencil code
    for (const [cx, cy] of [[x0, y0], [x1 - 3, y0], [x0, y1 - 3], [x1 - 3, y1 - 3]]) { fill(g, rect(cx, cy, cx + 3, cy + 3), t.k); fill(g, rect(cx + 0.9, cy + 0.9, cx + 2.1, cy + 2.1), '#0b0d10'); }
    fill(g, rect(dx - 9, y0 + 5, dx - 3, y0 + 9), '#c9ccd2', 0.8);
    for (const [x, h] of [[x0 + 9, 9], [x0 + 21, 14], [x0 + 33, 7]]) fill(g, rect(x, y0 + 2, x + 1.4, y0 + 2 + h), '#6a3a28', 0.35);
    g.font = '700 5px Rajdhani'; g.fillStyle = 'rgba(244,241,234,0.75)'; g.fillText('CF·9', x0 + 5, y1 - 5);
  });
  stroke(g, B, t.k, 0.5);
}

export function catwalk(g, x0, x1, y) {
  const S = tone('#8a95a3', '#5d6878', '#3c4654', '#151a21');
  // brackets back to the wall
  for (let x = x0 + 8; x < x1; x += 32) stroke(g, `M ${x} ${y + 2} L ${x + 10} ${y + 16}`, S.d, 1.2);
  const D = rect(x0, y, x1, y + 3);
  cel(g, D, S, { sh: 0.6, hl: 0.4 });
  clip(g, D, () => { for (let x = x0 + 1; x < x1; x += 2) stroke(g, `M ${x} ${y + 0.6} L ${x + 1} ${y + 2.6}`, S.k, 0.35); });
  // railing
  for (let x = x0 + 1; x <= x1 - 1; x += 16) cel(g, rect(x - 0.6, y - 15, x + 0.6, y), S, { sh: 0.3, hl: 0.2 });
  cel(g, rect(x0, y - 16, x1, y - 14.6), S, { sh: 0.3, hl: 0.2 });
  cel(g, rect(x0, y - 8.6, x1, y - 7.6), S, { sh: 0.2, hl: 0.15 });
}

export function ladder(g, x0, yTop, yBot) {
  const S = tone('#9aa5b3', '#6c7786', '#4a5361', '#1f242b');
  for (const x of [x0 + 0.8, x0 + 6.4]) cel(g, rect(x, yTop - 14, x + 1.2, yBot), S, { sh: 0.3, hl: 0.2 });
  for (let y = yBot - 4; y > yTop - 12; y -= 6) cel(g, rect(x0 + 1.4, y - 0.6, x0 + 6.8, y + 0.4), S, { sh: 0.2, hl: 0.15 });
}

export function pit(g, x0, x1, depth) {
  fill(g, rect(x0, 0, x1, depth), '#0d1015');
  fill(g, rect(x0, 0, x0 + 2, depth), '#2a303c'); fill(g, rect(x1 - 2, 0, x1, depth), '#1b2029');
  fill(g, rect(x0, depth - 1, x1, depth), '#3c4654');
  clip(g, rect(x0 - 4, -1.6, x1 + 4, 0.4), () => {
    fill(g, rect(x0 - 4, -1.6, x1 + 4, 0.4), C.gold);
    for (let x = x0 - 8; x < x1 + 6; x += 4) fill(g, poly([[x, 0.4], [x + 2, 0.4], [x + 4, -1.6], [x + 2, -1.6]]), '#1a1c20');
  });
}

const CONC = tone('#b9bcc6', '#8d919d', '#666a76', '#2f323a');
export function ramp(g, x0, x1, x2, x3, h) {
  const R = poly([[x0, 0], [x1, -h], [x2, -h], [x3, 0]]);
  cel(g, R, CONC, { sh: 2.5, hl: 0.9 });
  clip(g, R, () => {
    for (let x = x1 + 16; x < x2; x += 24) stroke(g, `M ${x} ${-h} L ${x} 0`, CONC.d, 0.5);
    fill(g, rect(x0, -h, x3, -h + 2), CONC.l, 0.6);
    stroke(g, `M ${x0} 0 L ${x1} ${-h}`, C.gold, 1.2); stroke(g, `M ${x2} ${-h} L ${x3} 0`, C.gold, 1.2);
  });
  stroke(g, R, CONC.k, 0.5);
}

export function duct(g, x0, x1, yTop, yBot) {
  const S = tone('#a9b3c0', '#7c8796', '#56606e', '#232831');
  for (let x = x0 + 10; x < x1; x += 40) { stroke(g, `M ${x} ${yTop} L ${x} ${yTop - 90}`, S.k, 1.2); stroke(g, `M ${x} ${yTop} L ${x} ${yTop - 90}`, S.d, 0.6); }
  const D = rect(x0, yTop, x1, yBot);
  cel(g, D, S, { sh: 2.0, hl: 0.8 });
  clip(g, D, () => {
    for (let x = x0 + 14; x < x1; x += 20) { fill(g, rect(x, yTop, x + 2, yBot), S.d); fill(g, rect(x + 2, yTop, x + 2.6, yBot), S.l, 0.6); }
    fill(g, rect(x0, yBot - 3, x1, yBot), S.d, 0.7);
  });
  stroke(g, D, S.k, 0.5);
  // hazard: low clearance
  clip(g, rect(x0, yBot - 2.4, x0 + 16, yBot), () => { fill(g, rect(x0, yBot - 2.4, x0 + 16, yBot), C.gold); for (let x = x0 - 4; x < x0 + 18; x += 4) fill(g, poly([[x, yBot], [x + 2, yBot], [x + 4.4, yBot - 2.4], [x + 2.4, yBot - 2.4]]), '#1a1c20'); });
}

// A steel riot barricade: framed panels with mesh windows, a hazard band, a
// kick plate and splayed feet, a neon tube along the top (its glow and the
// light it throws are drawn live: see barricadeFx).
export function barricade(g, x0, x1, h, neon = '#ff3fa4') {
  const S = tone('#808a99', '#566172', '#3a4352', '#141920');
  const B = poly([[x0 - 2, 0], [x0 - 2, -h + 1.6], [x0 - 0.4, -h], [x1 + 0.4, -h], [x1 + 2, -h + 1.6], [x1 + 2, 0]]);
  cel(g, B, S, { sh: 1.4, hl: 0.6 });
  const n = Math.max(1, Math.round((x1 - x0) / 12)), pw = (x1 - x0 + 4) / n;
  clip(g, B, () => {
    for (let i = 0; i < n; i++) {
      const px = x0 - 2 + i * pw, wy0 = -h + 4, wy1 = -h + h * 0.48;
      // the mesh window
      const Wn = rect(px + 2.2, wy0, px + pw - 2.2, wy1);
      fill(g, Wn, '#10151c');
      clip(g, Wn, () => {
        for (let k = px - 20; k < px + pw + 20; k += 2) { stroke(g, `M ${k} ${wy0} L ${k + 14} ${wy1}`, S.d, 0.22, 0.9); stroke(g, `M ${k} ${wy1} L ${k + 14} ${wy0}`, S.d, 0.22, 0.9); }
        fill(g, rect(px + 2.2, wy0, px + pw - 2.2, wy0 + 1.2), '#000', 0.4);
      });
      // hazard band and the kick plate with its bolts
      clip(g, rect(px + 1.4, -h * 0.4, px + pw - 1.4, -h * 0.4 + 3), () => {
        fill(g, rect(px, -h * 0.4, px + pw, -h * 0.4 + 3), C.gold);
        for (let k = px - 6; k < px + pw + 4; k += 4) fill(g, poly([[k, -h * 0.4 + 3], [k + 2, -h * 0.4 + 3], [k + 5, -h * 0.4], [k + 3, -h * 0.4]]), '#1a1c20');
      });
      fill(g, rect(px + 1.4, -h * 0.3, px + pw - 1.4, -2.6), S.d);
      fill(g, rect(px + 1.4, -h * 0.3, px + pw - 1.4, -h * 0.3 + 0.6), S.l, 0.6);
      for (const bx of [px + 3, px + pw - 3]) fill(g, ell(bx, -h * 0.3 + 2, 0.45, 0.45), S.l);
      // the post between panels
      if (i) { fill(g, rect(px - 0.8, -h, px + 0.8, 0), S.k); fill(g, rect(px - 0.8, -h, px - 0.2, 0), S.m); }
      // scuffs
      stroke(g, `M ${px + pw * 0.3} ${-h * 0.2} l 2.4 0.6`, S.k, 0.3, 0.6);
    }
    fill(g, rect(x0 - 2, -2.6, x1 + 2, 0), S.k, 0.6);
  });
  stroke(g, B, S.k, 0.45);
  // splayed feet
  for (const fx of [x0 - 1, x1 + 1]) cel(g, poly([[fx - 3, 0], [fx - 1, -3], [fx + 1, -3], [fx + 3, 0]]), S, { sh: 0.3, hl: 0.2, lw: 0.3 });
  // the neon tube in its clips
  for (let x = x0 + 2; x <= x1 - 2; x += Math.max(6, (x1 - x0 - 4) / 3)) fill(g, rect(x - 0.6, -h - 1.8, x + 0.6, -h), S.k);
  g.save(); g.shadowColor = neon; g.shadowBlur = 8;
  stroke(g, `M ${x0} ${-h - 1.3} L ${x1} ${-h - 1.3}`, neon, 1.2);
  g.restore();
  stroke(g, `M ${x0 + 0.4} ${-h - 1.3} L ${x1 - 0.4} ${-h - 1.3}`, '#fff2fa', 0.42);
}

const rgb = (hex) => [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];
// the live glow sprite and the light of a barricade's neon tube
export function barricadeFx(x0, x1, h, neon) {
  const cx = (x0 + x1) / 2;
  return {
    glow: [cx, -h - 1.3, (x1 - x0) / 2 + 4, 2.6, neon, 0.55, 'buzz'],
    light: [cx, -h - 3, 46, 0.75, rgb(neon), 'buzz'],
  };
}

// --- the course ------------------------------------------------------------------
export function buildCourse() {
  const g = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
  const street = 25;
  for (let r = street; r < ROWS; r++) for (let x = 0; x < COLS; x++) g[r][x] = '#';
  const at = (c, n, ch) => { const r = street - n; if (r >= 0 && r < ROWS && c >= 0 && c < COLS) g[r][c] = ch; };
  const block = (c0, c1, n0, n1, ch = '#') => { for (let c = c0; c <= c1; c++) for (let n = n0; n <= n1; n++) at(c, n, ch); };
  // walls at both ends
  block(0, 1, 1, 25); block(COLS - 2, COLS - 1, 1, 25);
  const props = [], front = [], lamps = [], deco = [], glows = [], lights = [];
  const P = (name, box, paint, list = props) => list.push({ name, box, paint });
  // crate (2 tiles)
  block(29, 30, 1, 2); P('c.crate', [230, -18, 250, 1], (g) => crate(g, 232, 16, 16));
  // stacked containers
  block(40, 47, 1, 5); block(43, 47, 6, 10);
  P('c.contA', [318, -42, 386, 1], (g) => container(g, 320, -40, 384, 0, CONT.teal));
  P('c.contB', [342, -82, 386, -39], (g) => container(g, 344, -80, 384, -40, CONT.rust));
  // fire-escape deck (one-way) with a ladder up to it
  block(56, 71, 12, 12, '='); block(72, 72, 1, 12, 'H');
  P('c.deck', [446, -114, 578, -78], (g) => catwalk(g, 448, 576, -96));
  P('c.ladder', [575, -112, 585, 1], (g) => ladder(g, 576, -96, 0));
  // pit, 4 tiles deep
  for (let c = 80; c <= 85; c++) for (let r = street; r < street + 4; r++) g[r][c] = '.';
  P('c.pit', [632, -3, 696, 33], (g) => pit(g, 640, 688, 32));
  // ramp up, plateau, ramp down
  for (let k = 0; k < 5; k++) { at(92 + k, k + 1, '/'); block(92 + k, 92 + k, 1, k, '#'); }
  block(97, 111, 1, 5);
  for (let k = 0; k < 5; k++) { at(112 + k, 5 - k, '\\'); block(112 + k, 112 + k, 1, 4 - k, '#'); }
  P('c.ramp', [734, -42, 938, 1], (g) => ramp(g, 736, 776, 896, 936, 40));
  // overhead duct with 32 of clearance
  block(125, 134, 5, 6);
  P('c.duct', [998, -142, 1082, -30], (g) => duct(g, 1000, 1080, -48, -32));
  // sandbag wall (3 tiles)
  block(145, 147, 1, 3);
  P('c.bags', [1154, -32, 1190, 1], (g) => barricade(g, 1160, 1184, 24, '#ff3fa4'), front);
  const bfx = barricadeFx(1160, 1184, 24, '#ff3fa4'); glows.push(bfx.glow); lights.push(bfx.light);
  // enemy zone: barrier cover, a container to stand on
  block(160, 163, 1, 2);
  P('c.barrier', [1276, -18, 1316, 1], (g) => barrier(g, 1279), front);
  block(180, 189, 1, 5);
  P('c.contC', [1438, -42, 1522, 1], (g) => container(g, 1440, -40, 1520, 0, CONT.navy));
  // decoration (no collision)
  for (const x of [128, 700, 1230]) lamps.push(x);
  // lamp posts share one sprite (painted at x = 0, drawn at each position)
  deco.push({ name: 'c.lamp', box: [-8, -86, 24, 1], paint: (g) => lampPost(g, 0), at: lamps });
  P('c.barrel', [1100, -16, 1114, 1], (g) => burnBarrel(g, 1102), deco);
  P('c.dump', [1532, -24, 1580, 1], (g) => dumpster(g, 1536), deco);
  P('c.cone', [1186, -12, 1200, 1], (g) => cone(g, 1194), deco);
  const level = new Level(g.map((r) => r.join('')), TOPY);
  return {
    level, props, front, deco, lamps, glows, lights,
    facade: facadeLayout(-10, COLS * T + 10, 5, ['walkupB', 'crow', 'alley', 'warehouse', 'synBlock', 'ruin']),
    fires: [1107],
    spawn: [100, 0],
    enemies: [{ id: 'tet', x: 1340, y: 0 }, { id: 'kal', x: 1392, y: 0 }, { id: 'tet', x: 1484, y: -40 }],
    width: COLS * T,
  };
}
