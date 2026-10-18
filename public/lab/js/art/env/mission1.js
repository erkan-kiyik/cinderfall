// KOR LAB — campaign mission 1, "SIZMA" (infiltration): the level,
// its props and the mission script data. Same rule as the M2 course: every
// feature is placed in tile columns and painted inside the same box, so what
// you see is what you collide with.
//
//   A  approach      crate, duct to slide under, a gap      → checkpoint 1
//   B  checkpoint    Syndicate post behind concrete and steel barricades
//   C  container yard ladder, fire-escape deck, stacked containers → checkpoint 2
//   D  gate court    shield trooper, riflemen, a rusher; hack the gate terminal
//   E  extraction    the gate opens, a last squad arrives, reach the flare
import { cel, fill, stroke, clip } from '../kit.js';
import { M, tone, mat, C } from '../style.js';
import { Level, T } from '../../phys/level.js';
import { crate, barrier, lampPost, burnBarrel, dumpster, cone, korMark } from './street.js';
import { CONT, container, catwalk, ladder, pit, duct, barricade, barricadeFx, scrapBarricade } from './course.js';
import { emblem } from '../enemies/syndicate.js';
import { facadeLayout } from './city.js';

const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

export const COLS = 400, TOPY = -200, ROWS = 30, STREET = 25;
const CONC = mat(tone('#b7b7b0', '#8e8e87', '#676761', '#2f2f2b'), 'concrete', 0.7);
const STEEL = tone('#8a95a3', '#5d6878', '#3c4654', '#151a21');
const SYN = tone('#9ab3cc', '#5e7d9c', '#3f5a76', '#1c2b3b');

// --- painters ------------------------------------------------------------------
// tall concrete barricade with a hazard band
export function concrete(g, x0, x1, h) {
  // a T-wall blast barrier: the slab on a wider foot, a lifting eye near the top
  const B = poly([[x0 - 0.6, 0], [x0 - 0.6, -3], [x0 + 1.4, -6], [x0 + 1.4, -h + 2], [x0 + 3, -h], [x1 - 2, -h], [x1 - 1.4, -h + 1.2], [x1 - 1.4, -6], [x1 + 0.6, -3], [x1 + 0.6, 0]]);
  cel(g, B, CONC, { sh: 1.6, hl: 0.7 });
  clip(g, B, () => {
    fill(g, rect(x0 - 1, -6, x1 + 1, 0), CONC.d, 0.55);
    stroke(g, `M ${x0 - 1} -6 L ${x1 + 1} -6`, CONC.k, 0.3, 0.8);
    stroke(g, `M ${(x0 + x1) / 2} ${-h + 4} L ${(x0 + x1) / 2} -6`, CONC.d, 0.4, 0.8);
    // Vanta's stencil: the mark and the wall's number, white
    emblem(g, (x0 + x1) / 2, -h + 10, Math.min(3.2, (x1 - x0) * 0.2), 'rgba(240,242,244,0.85)');
    fill(g, ell(x0 + 5, -h + 4.4, 1.5, 1.5), CONC.k);
    fill(g, ell(x0 + 5, -h + 4.0, 1.5, 1.1), '#0f1116');
    // chips, cracks, a stencil and a spray tag
    for (const [x, y, r] of [[x1 - 4, -h + 20, 1.0], [x0 + 3.6, -18, 0.8]]) fill(g, ell(x, y, r, r * 0.8), CONC.k, 0.55);
    stroke(g, `M ${x1 - 2} ${-h + 14} l -2 4 l 0.8 3 l -1.6 3`, CONC.k, 0.25, 0.8);
    g.font = '700 2.2px sans-serif'; g.fillStyle = 'rgba(240,242,244,0.7)'; g.fillText('T-12', x0 + 2.4, -h + 17);
    // the cells were here: the ember sprayed low, where a patrol would not look
    korMark(g, (x0 + x1) / 2, -12, Math.min(3, (x1 - x0) * 0.18), 0.8);
    stroke(g, `M ${x0 + 3} ${-h + 1.2} L ${x1 - 3} ${-h + 1.2}`, CONC.l, 0.5, 0.7);
  });
  stroke(g, B, CONC.k, 0.5);
  stroke(g, `M ${x1 - 3} ${-h} l 0.8 -2.4`, '#6a4a3a', 0.5);
}

// guard booth (background)
export function booth(g, x0, w = 44, h = 58) {
  const x1 = x0 + w;
  const B = rect(x0, -h, x1, 0);
  cel(g, B, SYN, { sh: 2.0, hl: 0.6 });
  clip(g, B, () => {
    // panel seams, the window with the guard's lamp on and half-down blinds
    for (const x of [x0 + w * 0.34, x0 + w * 0.68]) stroke(g, `M ${x} ${-h} L ${x} 0`, SYN.d, 0.35, 0.7);
    fill(g, rect(x0 + 4, -h + 11, x1 - 4, -h + 31), SYN.k);
    fill(g, rect(x0 + 5, -h + 12, x1 - 5, -h + 30), '#9fc3d8');
    fill(g, rect(x0 + 5, -h + 22, x1 - 5, -h + 30), '#6f98b2');
    for (let y = -h + 12.6; y < -h + 20; y += 1.5) fill(g, rect(x0 + 5, y, x1 - 5, y + 0.6), '#3f5a76', 0.75);
    fill(g, rect(x0 + 14, -h + 23, x0 + 20, -h + 30), '#1c2b3b', 0.8);
    fill(g, rect(x0 + 5, -h + 12, x0 + 9, -h + 30), '#fff', 0.15);
    fill(g, rect(x0, -h + 36, x1, -h + 39), M.visor.m);
    // the door on the right
    fill(g, rect(x1 - 13, -26, x1 - 3, 0), SYN.d); fill(g, rect(x1 - 12, -25, x1 - 4, -14), '#141c26');
    fill(g, rect(x1 - 5.4, -12, x1 - 4.4, -10.6), M.gunmetal.l);
    fill(g, rect(x0, -4, x1, 0), SYN.d);
    fill(g, rect(x0, -h, x1, -h + 3), '#000', 0.2);
  });
  // roof overhang with a warning light, an antenna, a vent box
  cel(g, rect(x0 - 3, -h - 5, x1 + 3, -h), STEEL, { sh: 0.6, hl: 0.4 });
  cel(g, rect(x0 + 6, -h - 8.4, x0 + 12, -h - 5), M.visor, { sh: 0.3, hl: 0.5, lw: 0.3 });
  stroke(g, `M ${x1 - 6} ${-h - 5} L ${x1 - 6} ${-h - 20}`, STEEL.k, 0.5);
  cel(g, rect(x0 - 5, -h + 42, x0, -h + 50), STEEL, { sh: 0.3, hl: 0.2, lw: 0.3 });
  stroke(g, B, SYN.k, 0.5);
  emblem(g, x0 + w * 0.36, -h + 47, 4, M.white.m);
}

// the gate leaf (moves up when it opens), drawn from its bottom-left corner
export function gateLeaf(g, w, h) {
  const B = rect(0, -h, w, 0);
  cel(g, B, STEEL, { sh: 1.4, hl: 0.5 });
  clip(g, B, () => {
    for (let y = -h + 6; y < 0; y += 8) { fill(g, rect(0, y, w, y + 1.4), STEEL.d); fill(g, rect(0, y + 1.4, w, y + 2), STEEL.l, 0.5); }
    fill(g, rect(0, -h * 0.5 - 6, w, -h * 0.5 + 6), M.visor.d);
    for (let x = -10; x < w + 6; x += 6) fill(g, poly([[x, -h * 0.5 + 6], [x + 3, -h * 0.5 + 6], [x + 9, -h * 0.5 - 6], [x + 6, -h * 0.5 - 6]]), '#1a1c20', 0.6);
  });
  stroke(g, B, STEEL.k, 0.6);
}
// posts and a beam around the gate opening (x0..x1, height h)
export function gateFrame(g, x0, x1, h) {
  for (const x of [x0 - 6, x1]) {
    const P = rect(x, -h - 10, x + 6, 0);
    cel(g, P, CONC, { sh: 1.2, hl: 0.5 });
    clip(g, P, () => { for (let y = -h; y < 0; y += 14) fill(g, rect(x, y, x + 6, y + 6), C.gold, 0.9); for (let y = -h; y < 0; y += 14) fill(g, poly([[x, y + 6], [x + 6, y], [x + 6, y + 3], [x + 3, y + 6]]), '#1a1c20'); });
    stroke(g, P, CONC.k, 0.5);
  }
  const Bm = rect(x0 - 8, -h - 14, x1 + 8, -h - 4);
  cel(g, Bm, SYN, { sh: 0.8, hl: 0.4 });
  stroke(g, Bm, SYN.k, 0.5);
  emblem(g, (x0 + x1) / 2, -h - 9, 3.4, M.white.m);
}

// hacking terminal: a console with a dark screen (the glow is drawn live)
export function terminal(g, x) {
  const B = poly([[x - 7, 0], [x - 7, -22], [x - 5, -26], [x + 7, -26], [x + 7, 0]]);
  cel(g, B, STEEL, { sh: 1.0, hl: 0.5 });
  clip(g, B, () => {
    // the bezel and dark screen (the glow is drawn live), a keypad, a warning label
    fill(g, rect(x - 5.6, -23.6, x + 5.6, -14.4), STEEL.k);
    fill(g, rect(x - 5, -23, x + 5, -15), '#071016');
    for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) fill(g, rect(x - 4.6 + k * 2.4, -12 + r * 2, x - 3.2 + k * 2.4, -10.8 + r * 2), (r + k) % 3 === 0 ? M.visor.m : STEEL.d);
    clip(g, rect(x - 6, -6, x + 2, -4), () => { fill(g, rect(x - 6, -6, x + 2, -4), C.gold); for (let k = x - 8; k < x + 4; k += 2.4) fill(g, poly([[k, -4], [k + 1.2, -4], [k + 3.2, -6], [k + 2, -6]]), '#1a1c20'); });
    fill(g, rect(x - 7, -3, x + 7, 0), STEEL.d);
    stroke(g, `M ${x - 7} -24 L ${x + 7} -24`, STEEL.l, 0.4, 0.7);
  });
  stroke(g, B, STEEL.k, 0.5);
  // a side handle, the conduit and the cable into the ground
  cel(g, rect(x + 7, -18, x + 8.4, -12), STEEL, { sh: 0.2, hl: 0.2, lw: 0.25 });
  cel(g, rect(x + 7, -8, x + 10, -5.6), STEEL, { sh: 0.2, hl: 0.2, lw: 0.25 });
  stroke(g, `M ${x + 10} -6.8 C ${x + 13} -6.8 ${x + 12} -1 ${x + 16} 0`, '#1a1c20', 1.2);
  for (const bx of [x - 5.6, x + 5.6]) fill(g, ell(bx, -1.2, 0.45, 0.45), STEEL.l);
}

// extraction beacon: a short pole (the flare light is drawn live)
export function beacon(g, x) {
  cel(g, rect(x - 0.8, -22, x + 0.8, 0), STEEL, { sh: 0.3, hl: 0.2 });
  cel(g, poly([[x - 3, -22], [x + 3, -22], [x + 2, -26], [x - 2, -26]]), STEEL, { sh: 0.4, hl: 0.3 });
  cel(g, rect(x - 4, -2, x + 4, 0), STEEL, { sh: 0.4, hl: 0.3 });
}
// checkpoint post: a squat post with a lamp head (colour drawn live)
export function cpPost(g, x) {
  cel(g, rect(x - 1.2, -18, x + 1.2, 0), STEEL, { sh: 0.3, hl: 0.2 });
  cel(g, rect(x - 3, -22, x + 3, -18), STEEL, { sh: 0.4, hl: 0.3 });
  cel(g, rect(x - 3.4, -2, x + 3.4, 0), STEEL, { sh: 0.4, hl: 0.3 });
}

// --- the mission -------------------------------------------------------------------
export function buildMission1() {
  const g = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
  for (let r = STREET; r < ROWS; r++) for (let x = 0; x < COLS; x++) g[r][x] = '#';
  const at = (c, n, ch) => { const r = STREET - n; if (r >= 0 && r < ROWS && c >= 0 && c < COLS) g[r][c] = ch; };
  const block = (c0, c1, n0, n1, ch = '#') => { for (let c = c0; c <= c1; c++) for (let n = n0; n <= n1; n++) at(c, n, ch); };
  const X = (c) => c * T;
  block(0, 1, 1, 25); block(COLS - 2, COLS - 1, 1, 25);
  const props = [], front = [], deco = [], lamps = [], glows = [], lights = [];
  // a steel barricade over tiles c0..c1 (height in tiles), with its neon tube
  const bar = (name, c0, c1, n, neon) => {
    block(c0, c1 - 1, 1, n);
    P(name, [X(c0) - 4, -n * T - 6, X(c1) + 4, 1], (g) => barricade(g, X(c0), X(c1), n * T, neon), front);
    const f = barricadeFx(X(c0), X(c1), n * T, neon); glows.push(f.glow); lights.push(f.light);
  };
  const P = (name, box, paint, list = props) => list.push({ name, box, paint });

  // A — approach -----------------------------------------------------------------
  block(22, 23, 1, 2); P('m.crateA', [X(22) - 2, -18, X(24) + 2, 1], (g) => crate(g, X(22), 16, 16));
  block(34, 42, 5, 6); P('m.duct', [X(34) - 2, -142, X(43) + 2, -30], (g) => duct(g, X(34), X(43), -48, -32));
  for (let c = 50; c <= 53; c++) for (let r = STREET; r < STREET + 4; r++) g[r][c] = '.';
  P('m.pit', [X(50) - 8, -3, X(54) + 8, 33], (g) => pit(g, X(50), X(54), 32));
  P('m.cone1', [X(46) - 6, -12, X(46) + 8, 1], (g) => cone(g, X(46)), deco);
  // B — checkpoint post -------------------------------------------------------------
  bar('m.barB1', 72, 75, 4, '#3ee8e0');
  block(86, 89, 1, 2); P('m.barB', [X(86) - 4, -18, X(90) + 4, 1], (g) => barrier(g, X(86) + 1, 30), front);
  P('m.booth', [X(104) - 4, -66, X(104) + 48, 1], (g) => booth(g, X(104)), deco);
  block(100, 101, 1, 5); P('m.concB', [X(100) - 1, -42, X(102) + 1, 1], (g) => concrete(g, X(100), X(102), 40));
  bar('m.barB2', 116, 119, 4, '#ff3347');
  P('m.barrelB', [X(124) - 2, -16, X(124) + 14, 1], (g) => burnBarrel(g, X(124)), deco);
  // C — container yard -----------------------------------------------------------------
  block(140, 149, 1, 5); P('m.contA', [X(140) - 2, -42, X(150) + 2, 1], (g) => container(g, X(140), -40, X(150), 0, CONT.teal));
  block(160, 180, 12, 12, '='); block(159, 159, 1, 12, 'H');
  P('m.deck', [X(160) - 2, -114, X(181) + 2, -78], (g) => catwalk(g, X(160), X(181), -96));
  P('m.ladder', [X(159) - 1, -112, X(160) + 1, 1], (g) => ladder(g, X(159), -96, 0));
  block(190, 191, 1, 2); P('m.crateC', [X(190) - 2, -18, X(192) + 2, 1], (g) => crate(g, X(190), 16, 16));
  block(205, 214, 1, 5); block(209, 214, 6, 10);
  P('m.contB', [X(205) - 2, -42, X(215) + 2, 1], (g) => container(g, X(205), -40, X(215), 0, CONT.navy));
  P('m.contC', [X(209) - 2, -82, X(215) + 2, -39], (g) => container(g, X(209), -80, X(215), -40, CONT.rust));
  P('m.dumpC', [X(220) - 4, -24, X(220) + 48, 1], (g) => dumpster(g, X(220)), deco);
  // D — gate court ----------------------------------------------------------------------
  block(246, 247, 1, 5); P('m.concD1', [X(246) - 1, -42, X(248) + 1, 1], (g) => concrete(g, X(246), X(248), 40));
  block(274, 275, 1, 5); P('m.concD2', [X(274) - 1, -42, X(276) + 1, 1], (g) => concrete(g, X(274), X(276), 40));
  bar('m.barD', 294, 297, 4, '#ff3fa4');
  P('m.term', [X(312) - 9, -28, X(312) + 18, 1], (g) => terminal(g, X(312)));
  block(322, 323, 1, 12);
  P('m.gateFrame', [X(322) - 16, -126, X(324) + 16, 1], (g) => gateFrame(g, X(322), X(324), 96), deco);
  P('m.coneD', [X(286) - 6, -12, X(286) + 8, 1], (g) => cone(g, X(286)), deco);
  // E — extraction -----------------------------------------------------------------------
  block(350, 351, 1, 2); P('m.crateE', [X(350) - 2, -18, X(352) + 2, 1], (g) => crate(g, X(350), 16, 16));
  // the cells hold the extraction: their own barricade, no light
  block(362, 364, 1, 4); P('m.barE', [X(362) - 4, -4 * T - 8, X(365) + 8, 1], (g) => scrapBarricade(g, X(362), X(365), 4 * T), front);
  P('m.beacon', [X(387) - 5, -28, X(387) + 5, 1], (g) => beacon(g, X(387)), deco);
  // checkpoint posts
  const checkpoints = [{ x: X(60) }, { x: X(228) }, { x: X(316) }];
  checkpoints.forEach((c, i) => P(`m.cp${i}`, [c.x - 5, -24, c.x + 5, 1], (g) => cpPost(g, c.x), deco));
  for (const x of [130, 520, 1000, 1260, 1600, 2100, 2450, 2750, 3050]) lamps.push(x);
  deco.push({ name: 'c.lamp', box: [-8, -86, 24, 1], paint: (g) => lampPost(g, 0), at: lamps });

  const level = new Level(g.map((r) => r.join('')), TOPY);
  const E = (id, x, y, zone, o = {}) => ({ id, kind: id, x, y, zone, facing: -1, ...o });
  return {
    id: 'm1', level, props, front, deco, lamps, glows, lights, width: COLS * T, par: 300,
    // HAWK's shop once, near the start; then the street, never twice the same in a row
    facade: facadeLayout(-10, COLS * T + 10, 9, ['walkup', 'crow', 'alley', 'warehouse', 'synBlock', 'walkupB', 'hotel', 'ruin', 'garage']),
    fires: [X(124) + 5],
    spawn: [64, 0],
    checkpoints,
    // the gate leaf is a live sprite; its tiles open when the terminal is done
    gate: { c0: 322, c1: 323, n0: 1, n1: 12, x: X(322), w: 16, h: 96 },
    terminal: { x: X(312), x0: X(312) - 26, x1: X(312) + 26, time: 5 },
    extract: { x: X(387) },
    objectives: [
      { type: 'reach', x: X(132), text: 'Kontrol noktasını geç' },
      { type: 'reach', x: X(228), text: 'Konteyner sahasından geç' },
      { type: 'hack', text: 'Kapı terminalini hackle' },
      { type: 'reach', x: X(384), text: 'Tahliye noktasına ulaş' },
    ],
    enemies: [
      // B
      E('tet', X(102) + 4, 0, [X(96), X(128)]),
      E('tet', X(119) + 4, 0, [X(96), X(128)]),
      E('tet', X(108), 0, [X(96), X(128)], { patrol: [X(105), X(114)] }),
      // C
      E('tet', X(176), -96, [X(161), X(180)]),
      E('huc', X(196), 0, [X(152), X(226)], { patrol: [X(186), X(200)] }),
      E('tet', X(207), -40, [X(205), X(208)]),
      // D
      E('kal', X(266), 0, [X(249), X(273)]),
      E('tet', X(276) + 4, 0, [X(268), X(306)]),
      E('tet', X(297) + 4, 0, [X(290), X(318)]),
      E('huc', X(306), 0, [X(250), X(320)], { patrol: [X(300), X(312)] }),
      // E — arrive when the gate opens
      E('tet', X(392), 0, [X(352), X(396)], { wave: 1 }),
      E('huc', X(395), 0, [X(326), X(396)], { wave: 1 }),
      E('tet', X(380), 0, [X(366), X(396)], { wave: 1 }),
    ],
  };
}
