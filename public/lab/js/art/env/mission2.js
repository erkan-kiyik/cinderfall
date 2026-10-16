// KOR LAB — campaign mission 2, "HAWK'ın Tezgâhı": the market street. Same
// rule as mission 1: every feature sits in tile columns and is painted in
// the same box, so what you see is what you collide with.
//
//   A  cordon       a Syndicate barricade across the street        → checkpoint 1
//   B  the market   stalls with awnings you can stand on; HAWK's stall in the
//                   middle: hold it while three squads come at it  → checkpoint 2
//   C  scaffolding  the street is walled off: up the ladders, over the wall
//   D  extraction   down on the far side, through the last post to the flare
import { cel, fill, stroke, clip } from '../kit.js';
import { M, tone, C } from '../style.js';
import { Level, T } from '../../phys/level.js';
import { crate, lampPost, burnBarrel, dumpster, cone } from './street.js';
import { catwalk, ladder, barricade, barricadeFx } from './course.js';
import { concrete, beacon, cpPost } from './mission1.js';
import { facadeLayout, tube, neonText } from './city.js';

const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
const rgb = (hex) => [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];

const COLS = 400, TOPY = -200, ROWS = 30, STREET = 25;
const WOOD = tone('#c99a6a', '#a3764c', '#7a5434', '#3a2414');
const POLE = tone('#8a95a3', '#5d6878', '#3c4654', '#151a21');
const AWN = {
  fruit: [tone('#ff8a7a', '#e04a3c', '#a8302a', '#4a1210'), '#f2dfbf'],
  tech: [tone('#6fd6f0', '#2f9ab8', '#1f6a82', '#0b2a36'), '#d9f6ff'],
  cloth: [tone('#c9a8ff', '#8a5cff', '#5f3cb8', '#24164a'), '#f0e6ff'],
  hawk: [tone('#ffe08a', '#ffc93c', '#c9951a', '#4a3208'), '#2a1a08'],
};
export const STALL_W = 48;

// --- painters (drawn from x = 0, placed with `at`) -----------------------------------------
// a market stall: a counter (16 high, x 8..40: solid), two poles and a striped
// awning at y = -72 you can stand on
export function stall(g, kind, w = STALL_W) {
  const [A, stripe] = AWN[kind];
  // poles
  for (const x of [2, w - 2]) cel(g, rect(x - 1, -72, x + 1, 0), POLE, { sh: 0.3, hl: 0.2, lw: 0.25 });
  // the back cloth (shade) and a shelf with goods behind the counter
  fill(g, rect(4, -66, w - 4, -16), '#0d1015', 0.55);
  cel(g, rect(6, -40, w - 6, -38), WOOD, { sh: 0.3, hl: 0.2, lw: 0.25 });
  goods(g, kind, 6, w - 6, -40, true);
  // the counter
  const B = rect(8, -16, w - 8, 0);
  cel(g, B, WOOD, { sh: 1.2, hl: 0.5 });
  clip(g, B, () => {
    for (let y = -12; y < 0; y += 4) stroke(g, `M 8 ${y} L ${w - 8} ${y}`, WOOD.k, 0.35, 0.7);
    fill(g, rect(8, -16, w - 8, -14.6), WOOD.l, 0.7);
    fill(g, rect(8, -3, w - 8, 0), WOOD.d);
  });
  stroke(g, B, WOOD.k, 0.4);
  goods(g, kind, 10, w - 10, -16, false);
  // the awning: a slab you can stand on, the striped valance hanging in front
  const top = rect(-1, -73, w + 1, -70);
  cel(g, top, A, { sh: 0.6, hl: 0.4 });
  const V = `M -1 -70 L ${w + 1} -70 L ${w + 1} -65 ` + Array.from({ length: 8 }, (_, i) => { const x1 = w + 1 - (i + 0.5) * ((w + 2) / 8), x2 = w + 1 - (i + 1) * ((w + 2) / 8); return `Q ${x1} -62 ${x2} -65`; }).join(' ') + ' Z';
  cel(g, V, A, { sh: 0.8, hl: 0.3 });
  clip(g, V, () => { for (let x = -1; x < w + 1; x += 6) fill(g, rect(x, -70, x + 3, -61), stripe, 0.8); });
  stroke(g, V, A.k, 0.4);
  // string lights along the valance (lit live)
  stroke(g, `M 0 -64.6 Q ${w / 2} -61.4 ${w} -64.6`, '#0b0d11', 0.3);
  for (let k = 0; k < 5; k++) { const x = 4 + k * ((w - 8) / 4); fill(g, ell(x, -63.6 + Math.sin((k / 4) * Math.PI) * 1.6, 0.8, 0.9), '#fff1c8'); }
}
// the bulbs' positions for the live glow (relative to the stall)
export const STALL_BULBS = [0, 1, 2, 3, 4].map((k) => [4 + k * ((STALL_W - 8) / 4), -63.6 + Math.sin((k / 4) * Math.PI) * 1.6]);

function goods(g, kind, x0, x1, y, shelf) {
  if (kind === 'fruit') {
    for (let x = x0 + 1; x < x1 - 8; x += 10) {
      cel(g, rect(x, y - 5, x + 8, y), WOOD, { sh: 0.3, hl: 0.2, lw: 0.25 });
      const c = [tone('#ffb24a', '#ff8a1a', '#c45c10', '#4a2008'), tone('#9aeb6a', '#5cbf3a', '#3a8a22', '#12300a'), tone('#ff7a8a', '#e0304a', '#a01a30', '#40080e')][Math.floor(x / 10) % 3];
      for (let k = 0; k < 4; k++) cel(g, ell(x + 1.6 + k * 1.6, y - 5.4 - (k % 2) * 0.8, 1.2, 1.1), c, { sh: 0.3, hl: 0.3, lw: 0.2 });
    }
  } else if (kind === 'tech') {
    for (let x = x0 + 1; x < x1 - 7; x += 9) {
      cel(g, rect(x, y - 7, x + 7, y), M.charcoal, { sh: 0.3, hl: 0.2, lw: 0.25 });
      fill(g, rect(x + 1, y - 6, x + 6, y - 2), shelf ? '#2a6a80' : '#3ee8e0', 0.85);
      fill(g, rect(x + 1, y - 6, x + 6, y - 5.2), '#fff', 0.35);
    }
    if (!shelf) for (let x = x0 + 2; x < x1 - 4; x += 6) stroke(g, `M ${x} ${y} C ${x + 1} ${y + 3} ${x + 3} ${y + 3} ${x + 4} ${y + 6}`, '#0b0d11', 0.35);
  } else if (kind === 'cloth') {
    for (let x = x0; x < x1 - 4; x += 6) {
      const c = [tone('#ffd7a8', '#f2a65a', '#b86a2a', '#40200a'), tone('#c9a8ff', '#8a5cff', '#5f3cb8', '#24164a'), tone('#a8e6ff', '#4aa8ff', '#2a6ab8', '#0a2040')][Math.floor(x / 6) % 3];
      if (shelf) cel(g, `M ${x} ${y - 26} L ${x + 5} ${y - 26} L ${x + 5.4} ${y - 4} Q ${x + 2.6} ${y - 2} ${x - 0.4} ${y - 4} Z`, c, { sh: 0.5, hl: 0.3, lw: 0.25 });
      else cel(g, rect(x, y - 3, x + 5, y), c, { sh: 0.3, hl: 0.2, lw: 0.2 });
    }
  } else {
    // HAWK: gun cases and ammo cans
    for (let x = x0 + 1; x < x1 - 10; x += 12) {
      cel(g, rect(x, y - 6, x + 10, y), M.charcoal, { sh: 0.4, hl: 0.2, lw: 0.25 });
      fill(g, rect(x + 1, y - 3.6, x + 9, y - 3), C.gold, 0.9);
      if (shelf) cel(g, `M ${x + 1} ${y - 10} L ${x + 9} ${y - 12} L ${x + 9.4} ${y - 10.6} L ${x + 1.4} ${y - 8.6} Z`, M.gunmetal, { sh: 0.2, hl: 0.2, lw: 0.2 });
    }
  }
}

// HAWK's stall: wider, gold awning, the neon sign on a board above it
export function hawkStall(g) {
  stall(g, 'hawk', 64);
  cel(g, rect(10, -96, 54, -78), M.black, { sh: 0.5, hl: 0.2 });
  for (const x of [16, 48]) stroke(g, `M ${x} -78 L ${x} -73`, POLE.k, 0.6);
  neonText(g, 'HAWK', 32, -82.4, 10.5, C.gold, 'center');
  tube(g, 'M 12 -94 L 52 -94', '#ff3fa4', 0.5);
}

// scaffolding: poles and braces down to the street under a catwalk at y
export function scaffold(g, x0, x1, y) {
  const S = tone('#a9b3c0', '#7c8796', '#56606e', '#232831');
  const n = Math.max(1, Math.round((x1 - x0) / 32));
  for (let i = 0; i <= n; i++) {
    const x = x0 + 1 + ((x1 - x0 - 2) * i) / n;
    cel(g, rect(x - 0.8, y, x + 0.8, 0), S, { sh: 0.3, hl: 0.2, lw: 0.25 });
    cel(g, rect(x - 2, -1.4, x + 2, 0), S, { sh: 0.2, hl: 0.1, lw: 0.2 });
    if (i < n) {
      const xb = x0 + 1 + ((x1 - x0 - 2) * (i + 1)) / n;
      for (let yy = y; yy < -24; yy += 36) stroke(g, `M ${x} ${yy + 4} L ${xb} ${Math.min(-2, yy + 34)}`, S.d, 0.6);
    }
  }
  // a safety net on the lower part, hazard tape at the top
  fill(g, rect(x0, y + 6, x1, Math.min(-2, y + 40)), '#3ee8e0', 0.05);
  catwalk(g, x0, x1, y);
}

// barbed wire on top of a wall
function wire(g, x0, x1, y) {
  for (let x = x0; x < x1; x += 3) stroke(g, ell(x + 1.5, y - 2, 2.2, 2.2), '#3c4654', 0.3);
  for (let x = x0; x < x1; x += 3) stroke(g, `M ${x} ${y - 2} l 0.8 -0.8 M ${x + 1.4} ${y - 4} l 0.6 0.8`, '#939dab', 0.25);
}

// --- the mission -------------------------------------------------------------------
export function buildMission2() {
  const g = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
  for (let r = STREET; r < ROWS; r++) for (let x = 0; x < COLS; x++) g[r][x] = '#';
  const at = (c, n, ch) => { const r = STREET - n; if (r >= 0 && r < ROWS && c >= 0 && c < COLS) g[r][c] = ch; };
  const block = (c0, c1, n0, n1, ch = '#') => { for (let c = c0; c <= c1; c++) for (let n = n0; n <= n1; n++) at(c, n, ch); };
  const X = (c) => c * T;
  block(0, 1, 1, 25); block(COLS - 2, COLS - 1, 1, 25);
  const props = [], front = [], deco = [], lamps = [], glows = [], lights = [];
  const P = (name, box, paint, list = props) => list.push({ name, box, paint });
  const bar = (name, c0, c1, n, neon) => {
    block(c0, c1 - 1, 1, n);
    P(name, [X(c0) - 4, -n * T - 6, X(c1) + 4, 1], (g) => barricade(g, X(c0), X(c1), n * T, neon), front);
    const f = barricadeFx(X(c0), X(c1), n * T, neon); glows.push(f.glow); lights.push(f.light);
  };
  // stalls: counter tiles c0+1..c0+4 (2 high), awning at 9 tiles over c0..c0+5
  const stalls = { fruit: [], tech: [], cloth: [] };
  const STALL_C = { fruit: '#ff9a5c', tech: '#3ee8e0', cloth: '#c9a8ff' };
  const addStall = (kind, c0) => {
    block(c0 + 1, c0 + 4, 1, 2); block(c0, c0 + 5, 9, 9, '=');
    stalls[kind].push(X(c0));
    for (const [bx, by] of STALL_BULBS) glows.push([X(c0) + bx, by, 2.2, 2.2, '#ffe6b0', 0.8, 'neon2']);
    lights.push([X(c0) + 24, -60, 44, 0.55, rgb(STALL_C[kind])]);
  };
  const crates = [];
  const addCrate = (c) => { block(c, c + 1, 1, 2); crates.push(X(c)); };

  // A — the cordon -----------------------------------------------------------------
  addCrate(24);
  P('m2.coneA', [X(40) - 6, -12, X(40) + 8, 1], (g) => cone(g, X(40)), deco);
  bar('m2.barA', 70, 73, 4, '#ff3347');
  P('m2.barrelA', [X(80) - 2, -16, X(80) + 14, 1], (g) => burnBarrel(g, X(80)), deco);
  addCrate(96);
  // B — the market ----------------------------------------------------------------------
  addStall('fruit', 120); addStall('tech', 134);
  addStall('cloth', 148);
  // HAWK's stall: counter over 8 tiles, awning over 8
  block(166, 171, 1, 2); block(165, 172, 9, 9, '=');
  P('m2.hawk', [X(165) - 2, -100, X(165) + 66, 1], (g) => { g.translate(X(165), 0); hawkStall(g); });
  glows.push([X(165) + 32, -86, 26, 8, C.gold, 0.45, 'neon'], [X(165) + 32, -94, 22, 1.6, '#ff3fa4', 0.6, 'buzz']);
  lights.push([X(165) + 32, -80, 80, 0.9, rgb(C.gold), 'neon']);
  for (let k = 0; k < 5; k++) glows.push([X(165) + 4 + k * 14, -63.6 + Math.sin((k / 4) * Math.PI) * 1.6, 2.2, 2.2, '#ffe6b0', 0.8, 'neon2']);
  addStall('fruit', 182); addStall('cloth', 196);
  addStall('tech', 210);
  addCrate(226);
  P('m2.dumpB', [X(229) - 4, -24, X(229) + 48, 1], (g) => dumpster(g, X(229)), deco);
  // C — scaffolding over the wall -------------------------------------------------------------
  block(240, 240, 1, 10, 'H'); block(241, 267, 10, 10, '=');
  P('m2.scafA', [X(241) - 2, -100, X(268) + 2, 1], (g) => scaffold(g, X(241), X(268), -80));
  P('m2.ladA', [X(240) - 1, -96, X(241) + 1, 1], (g) => ladder(g, X(240), -80, 0));
  block(267, 267, 11, 15, 'H'); block(268, 312, 15, 15, '=');
  // (in two pieces: an atlas page is only so wide)
  for (const [k, a, b] of [[1, 268, 290], [2, 290, 313]]) P(`m2.scafB${k}`, [X(a) - 2, -140, X(b) + 2, -78], (g) => clip(g, rect(X(a) - 4, -142, X(b) + 4, -80), () => scaffold(g, X(a), X(b), -120)));
  P('m2.ladB', [X(267) - 1, -136, X(268) + 1, -78], (g) => ladder(g, X(267), -120, -80));
  // poles of the upper scaffold that stand on the street behind the wall
  deco.push({ name: 'm2.pole', box: [-2, -82, 2, 1], paint: (g) => cel(g, rect(-0.8, -80, 0.8, 0), tone('#a9b3c0', '#7c8796', '#56606e', '#232831'), { sh: 0.3, hl: 0.2, lw: 0.25 }), at: [X(268) + 1, X(290), X(313) - 1], foot: [0, 2] });
  addCrate(250);
  // the wall across the street (12 tiles high), wire on top
  block(296, 297, 1, 12);
  P('m2.wall', [X(296) - 2, -106, X(298) + 2, 1], (g) => { concrete(g, X(296), X(298), 96); wire(g, X(296) - 1, X(298) + 1, -96); }, front);
  // D — the far side and the flare -----------------------------------------------------------
  bar('m2.barD', 336, 339, 4, '#3ee8e0');
  addCrate(352);
  P('m2.coneD', [X(366) - 6, -12, X(366) + 8, 1], (g) => cone(g, X(366)), deco);
  P('m2.beacon', [X(388) - 5, -28, X(388) + 5, 1], (g) => beacon(g, X(388)), deco);
  // shared pieces, painted once and drawn at each spot
  for (const kind of Object.keys(stalls)) props.push({ name: `m2.stall.${kind}`, box: [-3, -76, STALL_W + 3, 1], paint: (g) => stall(g, kind), at: stalls[kind], foot: [STALL_W / 2, 18] });
  props.push({ name: 'm2.crate', box: [-2, -18, 18, 1], paint: (g) => crate(g, 0, 16, 16), at: crates, foot: [8, 9] });
  // checkpoints
  const checkpoints = [{ x: X(104) }, { x: X(232) }, { x: X(320) }];
  checkpoints.forEach((c, i) => P(`m2.cp${i}`, [c.x - 5, -24, c.x + 5, 1], (g) => cpPost(g, c.x), deco));
  for (const x of [150, 560, 1880, 2220, 2600, 2980]) lamps.push(x);
  deco.push({ name: 'c.lamp', box: [-8, -86, 24, 1], paint: (g) => lampPost(g, 0), at: lamps });

  const level = new Level(g.map((r) => r.join('')), TOPY);
  const E = (id, x, y, zone, o = {}) => ({ id, kind: id, x, y, zone, facing: -1, ...o });
  const MZ = [X(112), X(236)]; // the market, where the squads that come for HAWK fight
  return {
    id: 'm2', level, props, front, deco, lamps, glows, lights, width: COLS * T,
    facade: facadeLayout(-10, COLS * T + 10, 23, ['walkupB', 'alley', 'garage', 'walkup', 'crow', 'hotel', 'alley', 'warehouse', 'ruin', 'synBlock']),
    fires: [X(80) + 5],
    spawn: [64, 0],
    par: 330,
    checkpoints,
    extract: { x: X(388) },
    objectives: [
      { type: 'reach', x: X(118) },
      // stay inside the zone; the timer runs only while you are in it
      { type: 'hold', x0: X(150), x1: X(200), time: 40, waves: [[1, 2], [14, 3], [27, 4]] },
      { type: 'reach', x: X(318) },
      { type: 'reach', x: X(384) },
    ],
    enemies: [
      // A
      E('tet', X(74) + 4, 0, [X(60), X(100)]),
      E('tet', X(90), 0, [X(76), X(110)], { patrol: [X(84), X(100)] }),
      // B, before HAWK's stall
      E('tet', X(137), -72, [X(134), X(140)]),
      E('huc', X(156), 0, [X(112), X(200)]),
      // B, the squads that come for the stall
      E('tet', X(232), 0, MZ, { wave: 2 }), E('huc', X(228), 0, MZ, { wave: 2 }),
      E('tet', X(114), 0, MZ, { wave: 3, facing: 1 }), E('huc', X(118), 0, MZ, { wave: 3, facing: 1 }), E('tet', X(214), -72, [X(210), X(216)], { wave: 3 }),
      E('kal', X(234), 0, MZ, { wave: 4 }), E('tet', X(230), 0, MZ, { wave: 4 }), E('huc', X(112), 0, MZ, { wave: 4, facing: 1 }),
      // C, on the scaffolding and behind the wall
      E('tet', X(262), -80, [X(244), X(266)]),
      E('tet', X(306), -120, [X(286), X(312)]),
      E('huc', X(286), 0, [X(270), X(295)]),
      // D
      E('tet', X(339) + 4, 0, [X(326), X(360)]),
      E('kal', X(356), 0, [X(326), X(380)]),
      E('tet', X(372), 0, [X(340), X(396)], { patrol: [X(364), X(380)] }),
      E('huc', X(392), 0, [X(330), X(396)]),
    ],
  };
}
