// KOR LAB — campaign mission 3, "Sekreter Gall": the Syndicate's seat in
// the city and the act 1 boss.
//
//   A  the plaza     planters and T-walls under the banners          → checkpoint 1
//   B  the gate      hack the security gate; the guard behind it comes out
//   C  the hall      an open court with low cover; Gall waits on the dais and
//                    calls squads in as the fight turns
//   D  extraction    the flare past the dais
import { cel, fill, stroke, clip } from '../kit.js';
import { M, tone, C } from '../style.js';
import { Level, T } from '../../phys/level.js';
import { crate, lampPost, cone } from './street.js';
import { barricade, barricadeFx } from './course.js';
import { concrete, terminal, gateFrame, beacon, cpPost } from './mission1.js';
import { emblem } from '../enemies/syndicate.js';
import { facadeLayout, tube } from './city.js';

const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
const rgb = (hex) => [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];

const COLS = 400, TOPY = -200, ROWS = 30, STREET = 25;
const STONE = tone('#c9c6c0', '#9d9a94', '#75726d', '#34322f');
const POLE = tone('#ffe39a', '#e8b65a', '#a9792f', '#5e3f14');
const RED = tone('#ff6b6b', '#d22e3a', '#8e1622', '#3a060c');

// --- painters (from x = 0) -----------------------------------------------------------------------
// a stone planter (16 high, 24 wide: solid), a clipped hedge in it
export function planter(g) {
  const B = poly([[0, 0], [0, -12], [-1, -13], [25, -13], [24, -12], [24, 0]]);
  cel(g, B, STONE, { sh: 1.4, hl: 0.6 });
  clip(g, B, () => { fill(g, rect(-1, -13, 25, -11.6), STONE.l, 0.7); stroke(g, 'M 0 -4 L 24 -4', STONE.d, 0.4); for (const x of [8, 16]) stroke(g, `M ${x} -11.6 L ${x} 0`, STONE.d, 0.3, 0.7); });
  stroke(g, B, STONE.k, 0.4);
  const H = tone('#6fbf7a', '#3f8a52', '#2a6038', '#0e2414');
  const hedge = 'M 1 -13 C 0 -17 3 -19.6 6 -18.6 C 8 -21 12 -21 14 -19 C 17 -21 22 -20 23 -17 C 25 -15.6 24.6 -13.6 23 -13 Z';
  cel(g, hedge, H, { sh: 1.2, hl: 0.5 });
  clip(g, hedge, () => { for (const [x, y] of [[5, -16], [11, -18], [17, -17], [20, -15]]) fill(g, ell(x, y, 1.6, 1.1), H.l, 0.7); });
}

// a flagpole with a Syndicate banner (background)
export function flag(g, h = 120) {
  cel(g, rect(-1, -h, 1, 0), POLE, { sh: 0.3, hl: 0.2, lw: 0.25 });
  cel(g, ell(0, -h - 1.4, 1.8, 1.8), POLE, { sh: 0.3, hl: 0.3, lw: 0.25 });
  cel(g, rect(-3, -2, 3, 0), M.charcoal, { sh: 0.3, hl: 0.2, lw: 0.25 });
  const B = `M 1 ${-h + 4} L 22 ${-h + 4} L 22 ${-h + 46} L 11.5 ${-h + 40} L 1 ${-h + 46} Z`;
  cel(g, B, RED, { sh: 1.6, hl: 0.5 });
  clip(g, B, () => { fill(g, rect(1, -h + 4, 22, -h + 7), '#0d0f13', 0.7); for (const x of [6, 12, 17]) stroke(g, `M ${x} ${-h + 7} L ${x + 0.6} ${-h + 44}`, RED.d, 0.5, 0.6); });
  emblem(g, 11.5, -h + 22, 6, '#f4f1ea');
}

// the dais: a stepped stone platform (16 high, x0..x1: solid), the big banner
// behind it on a black frame, two braziers (their fire is lit live)
export function dais(g, x0, x1) {
  const w = x1 - x0, cx = (x0 + x1) / 2;
  // the backdrop
  cel(g, rect(cx - 50, -150, cx + 50, -16), M.black, { sh: 1, hl: 0.3 });
  const BN = `M ${cx - 34} -144 L ${cx + 34} -144 L ${cx + 34} -40 L ${cx} -26 L ${cx - 34} -40 Z`;
  cel(g, BN, RED, { sh: 2.2, hl: 0.6 });
  clip(g, BN, () => { for (let x = cx - 30; x < cx + 34; x += 8) stroke(g, `M ${x} -140 L ${x + 1} -40`, RED.d, 0.6, 0.6); fill(g, rect(cx - 34, -144, cx + 34, -138), '#0d0f13', 0.8); });
  emblem(g, cx, -96, 20, '#f4f1ea');
  tube(g, `M ${cx - 48} -148 L ${cx + 48} -148`, '#ff3347', 0.7);
  // the steps
  const S1 = rect(x0, -8, x1, 0), S2 = rect(x0 + 6, -16, x1 - 6, -8);
  cel(g, S1, STONE, { sh: 1.2, hl: 0.5 }); cel(g, S2, STONE, { sh: 1.2, hl: 0.5 });
  for (const S of [S1, S2]) clip(g, S, () => { for (let x = x0 + 12; x < x1; x += 16) stroke(g, `M ${x} -16 L ${x} 0`, STONE.d, 0.3, 0.6); });
  fill(g, rect(x0 + 6, -16, x1 - 6, -15), C.gold, 0.8);
  // braziers at the ends of the top step
  for (const bx of [x0 + 10, x1 - 10]) {
    cel(g, poly([[bx - 4, -26], [bx + 4, -26], [bx + 2, -20], [bx + 1, -16], [bx - 1, -16], [bx - 2, -20]]), POLE, { sh: 0.4, hl: 0.3, lw: 0.3 });
    fill(g, rect(bx - 3.6, -27, bx + 3.6, -26), '#1a0a04');
  }
  void w;
}
export const DAIS_FIRES = (x0, x1) => [x0 + 10, x1 - 10];

// a portico bay in the background: one column and the beam over the next
// 40 units (drawn side by side along the hall)
export const BAY = 64;
const DARK = tone('#8a8c94', '#64666e', '#4a4c54', '#1c1d22');
export function column(g, h = 104) {
  const STONE = DARK;
  cel(g, rect(-0.5, -h - 10, BAY + 0.5, -h), STONE, { sh: 1.2, hl: 0.5, line: false });
  stroke(g, `M -0.5 ${-h - 10} L ${BAY + 0.5} ${-h - 10} M -0.5 ${-h} L ${BAY + 0.5} ${-h}`, STONE.k, 0.32);
  fill(g, rect(-0.5, -h - 7, BAY + 0.5, -h - 6), STONE.d, 0.6);
  {
    const x = 0;
    const Cl = rect(x - 6, -h, x + 6, 0);
    cel(g, Cl, STONE, { sh: 2.6, hl: 0.8 });
    clip(g, Cl, () => { for (const fx of [-3, 0, 3]) stroke(g, `M ${x + fx} ${-h + 4} L ${x + fx} -4`, STONE.d, 0.4, 0.6); });
    cel(g, rect(x - 8, -h, x + 8, -h + 4), STONE, { sh: 0.5, hl: 0.3 });
    cel(g, rect(x - 8, -4, x + 8, 0), STONE, { sh: 0.5, hl: 0.3 });
  }
}
const bays = (x0, x1) => { const out = []; for (let x = x0; x <= x1; x += BAY) out.push(x); return out; };

// --- the mission -------------------------------------------------------------------
export function buildMission3() {
  const g = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
  for (let r = STREET; r < ROWS; r++) for (let x = 0; x < COLS; x++) g[r][x] = '#';
  const at = (c, n, ch) => { const r = STREET - n; if (r >= 0 && r < ROWS && c >= 0 && c < COLS) g[r][c] = ch; };
  const block = (c0, c1, n0, n1, ch = '#') => { for (let c = c0; c <= c1; c++) for (let n = n0; n <= n1; n++) at(c, n, ch); };
  const X = (c) => c * T;
  block(0, 1, 1, 25); block(COLS - 2, COLS - 1, 1, 25);
  const props = [], front = [], deco = [], lamps = [], glows = [], lights = [], fires = [];
  const P = (name, box, paint, list = props) => list.push({ name, box, paint });
  const bar = (name, c0, c1, n, neon) => {
    block(c0, c1 - 1, 1, n);
    P(name, [X(c0) - 4, -n * T - 6, X(c1) + 4, 1], (g) => barricade(g, X(c0), X(c1), n * T, neon), front);
    const f = barricadeFx(X(c0), X(c1), n * T, neon); glows.push(f.glow); lights.push(f.light);
  };
  const planters = [], flags = [];
  const addPlanter = (c) => { block(c, c + 2, 1, 2); planters.push(X(c)); };
  const conc = (name, c) => { block(c, c + 1, 1, 5); P(name, [X(c) - 1, -42, X(c + 2) + 1, 1], (g) => concrete(g, X(c), X(c + 2), 40)); };

  // A — the plaza ----------------------------------------------------------------------
  for (const c of [30, 70, 110, 150]) flags.push(X(c));
  const cols = [...bays(X(40), X(150)), ...bays(X(226), X(346))];
  P('m3.coneA', [X(20) - 6, -12, X(20) + 8, 1], (g) => cone(g, X(20)), deco);
  addPlanter(44); conc('m3.concA', 76); addPlanter(96);
  bar('m3.barA', 124, 127, 4, '#ff3347');
  addPlanter(150);
  block(166, 167, 1, 2); P('m3.crateA', [X(166) - 2, -18, X(168) + 2, 1], (g) => crate(g, X(166), 16, 16));
  // B — the security gate ------------------------------------------------------------------
  conc('m3.concB', 184);
  P('m3.term', [X(204) - 9, -28, X(204) + 18, 1], (g) => terminal(g, X(204)));
  block(214, 215, 1, 12);
  P('m3.gateFrame', [X(214) - 16, -126, X(216) + 16, 1], (g) => gateFrame(g, X(214), X(216), 96), deco);
  // C — the hall --------------------------------------------------------------------------------
  addPlanter(240); conc('m3.concC1', 266); addPlanter(292); conc('m3.concC2', 318); addPlanter(340);
  // the dais (2 tiles) and Gall's backdrop
  block(358, 381, 1, 1); block(359, 380, 2, 2);
  P('m3.dais', [X(358) - 2, -152, X(382) + 2, 1], (g) => dais(g, X(358), X(382)), deco);
  for (const fx of DAIS_FIRES(X(358), X(382))) fires.push([fx, -12]);
  glows.push([X(370), -148, 50, 2.4, '#ff3347', 0.6, 'buzz']);
  lights.push([X(370), -120, 120, 0.9, rgb('#ff3347'), 'buzz']);
  // D — extraction ------------------------------------------------------------------------------
  P('m3.beacon', [X(390) - 5, -28, X(390) + 5, 1], (g) => beacon(g, X(390)), deco);
  // shared pieces
  props.push({ name: 'm3.planter', box: [-2, -22, 26, 1], paint: planter, at: planters, foot: [12, 14] });
  deco.unshift({ name: 'm3.col', box: [-9, -116, BAY + 1, 1], paint: (g) => column(g), at: cols, foot: [0, 8] });
  deco.push({ name: 'm3.flag', box: [-4, -124, 24, 1], paint: (g) => flag(g), at: flags, foot: [0, 4] });
  // checkpoints
  const checkpoints = [{ x: X(118) }, { x: X(196) }, { x: X(222) }];
  checkpoints.forEach((c, i) => P(`m3.cp${i}`, [c.x - 5, -24, c.x + 5, 1], (g) => cpPost(g, c.x), deco));
  for (const x of [200, 640, 1040, 1420, 1720]) lamps.push(x);
  deco.push({ name: 'c.lamp', box: [-8, -86, 24, 1], paint: (g) => lampPost(g, 0), at: lamps });

  const level = new Level(g.map((r) => r.join('')), TOPY);
  const E = (id, x, y, zone, o = {}) => ({ id, kind: id, x, y, zone, facing: -1, ...o });
  const HALL = [X(224), X(396)];
  return {
    id: 'm3', level, props, front, deco, lamps, glows, lights, width: COLS * T,
    facade: facadeLayout(-10, COLS * T + 10, 31, ['synBlock', 'hotel', 'walkupB', 'synBlock', 'alley', 'warehouse', 'synBlock', 'hotel', 'synBlock', 'walkup']),
    fires,
    spawn: [64, 0],
    par: 360,
    checkpoints,
    gate: { c0: 214, c1: 215, n0: 1, n1: 12, x: X(214), w: 16, h: 96, wave: 1 },
    terminal: { x: X(204), x0: X(204) - 26, x1: X(204) + 26, time: 6 },
    extract: { x: X(390) },
    objectives: [
      { type: 'reach', x: X(176) },
      { type: 'hack' },
      { type: 'boss', phases: [[0.66, 2], [0.33, 3]] },
      { type: 'reach', x: X(386) },
    ],
    enemies: [
      // A
      E('tet', X(98), 0, [X(80), X(120)]),
      E('tet', X(127) + 4, 0, [X(112), X(150)]),
      E('huc', X(140), 0, [X(100), X(170)], { patrol: [X(132), X(148)] }),
      E('tet', X(152), 0, [X(140), X(180)]),
      // B
      E('kal', X(194), 0, [X(178), X(212)]),
      E('tet', X(186) + 4, 0, [X(178), X(212)]),
      E('tet', X(208), 0, [X(196), X(212)]),
      // C — the guard behind the gate comes out when it opens
      E('tet', X(228), 0, [X(218), X(262)], { wave: 1 }),
      E('huc', X(232), 0, [X(218), X(300)], { wave: 1 }),
      E('tet', X(296), 0, [X(270), X(316)]),
      // Gall on the dais
      E('gall', X(374), -16, [X(330), X(392)], { boss: true }),
      // squads Gall calls in
      E('tet', X(392), 0, HALL, { wave: 2 }), E('huc', X(390), 0, HALL, { wave: 2 }),
      E('kal', X(226), 0, HALL, { wave: 3, facing: 1 }), E('tet', X(230), 0, HALL, { wave: 3, facing: 1 }), E('tet', X(392), 0, HALL, { wave: 3 }),
    ],
  };
}
