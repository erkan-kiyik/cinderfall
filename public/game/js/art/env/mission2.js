// KOR — campaign mission 2, "Pazar Baskını": the market street. Same
// rule as mission 1: every feature sits in tile columns and is painted in
// the same box, so what you see is what you collide with.
//
//   A  cordon       a Syndicate barricade across the street        → checkpoint 1
//   B  the market   along the pavement in front of the shops, tarps slung
//                   overhead; hold the middle of it while three squads come
//                   at it from both ends                          → checkpoint 2
//   C  scaffolding  the street is walled off: up the ladders, over the wall
//   D  extraction   down on the far side, through the last post to the flare
import { cel, fill, stroke, clip } from '../kit.js';
import { M, tone, mat, C } from '../style.js';
import { texture } from '../tex.js';
import { Level, T } from '../../phys/level.js';
import { crate, lampPost, burnBarrel, dumpster, cone } from './street.js';
import { catwalk, ladder, barricade } from './course.js';
import { concrete, beacon, cpPost } from './mission1.js';
import { facadeLayout, bulb, letters, lightbox, ledBoard, notice } from './city.js';

const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

const COLS = 400, TOPY = -200, ROWS = 30, STREET = 25;
const POLE = tone('#8a95a3', '#5d6878', '#3c4654', '#151a21');

// --- painters (drawn from x = 0, placed with `at`) -----------------------------------------
// a tarp slung across the street between the houses, high up, one piece of
// a row: the rope, the sagging canvas, two bulbs off the generator's line
export const TARP_W = 80;
export function crossTarp(g, k = 0) {
  const cols = [['#4e6a82', '#c6ccd0'], ['#7a6240', null], ['#8a4a3a', '#d8cdb8'], ['#5a6448', null]][k % 4];
  stroke(g, `M -2 -126 Q ${TARP_W / 2} -121 ${TARP_W + 2} -126`, '#141210', 0.4);
  // the canvas hangs off the rope at its two ties and sags between them; its
  // hem falls in loose scallops where the weight of the wet cloth gathers
  const hem = [[TARP_W - 6, -114], [TARP_W - 16, -111.4], [TARP_W - 27, -109.8], [TARP_W / 2, -108.6], [27, -109.6], [16, -111.2], [6, -114]];
  let H = '';
  for (let i = 1; i < hem.length; i++) { const [ax, ay] = hem[i - 1], [bx, by] = hem[i]; H += ` Q ${(ax + bx) / 2} ${(ay + by) / 2 + 1.6} ${bx} ${by}`; }
  const T = `M 4 -125 Q ${TARP_W / 2} -120.4 ${TARP_W - 4} -125 L ${TARP_W - 6} -114${H} Z`;
  fill(g, T, cols[0]);
  clip(g, T, () => {
    if (cols[1]) for (let x = 2; x < TARP_W; x += 7) fill(g, rect(x, -128, x + 3.4, -100), cols[1], 0.55);
    const gr = g.createLinearGradient(0, -126, 0, -108); gr.addColorStop(0, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(255,240,220,0.06)'); fill(g, T, gr);
    texture(g, 'canvas', 0.6, 2.4);
    // the drape: folds pulled from each tie toward the low middle, the cloth between
    // them bellied; the wet top catching the sky
    g.save(); g.lineCap = 'round';
    const M0 = g.getTransform(); g.filter = `blur(${(1.1 * Math.hypot(M0.a, M0.b)).toFixed(2)}px)`;
    for (const [x0, x1, a] of [[7, 16, 0.32], [9, 27, 0.26], [TARP_W - 7, TARP_W - 16, 0.32], [TARP_W - 9, TARP_W - 27, 0.26], [TARP_W / 2 - 4, TARP_W / 2 - 2, 0.16]]) {
      const mx = (x0 + x1) / 2 + (x1 > x0 ? -2 : 2);
      g.globalAlpha = a; g.strokeStyle = '#000'; g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(x0, -124); g.quadraticCurveTo(mx, -117, x1, -110); g.stroke();
      g.globalAlpha = a * 0.45; g.strokeStyle = '#fff'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(x0 + 1.8, -124); g.quadraticCurveTo(mx + 1.8, -117, x1 + 1.8, -110); g.stroke();
    }
    g.restore();
    const sk = g.createLinearGradient(0, -126, 0, -119); sk.addColorStop(0, 'rgba(170,186,206,0.18)'); sk.addColorStop(1, 'rgba(170,186,206,0)'); fill(g, rect(0, -127, TARP_W, -119), sk);
    // the two bulbs under it warm the cloth from below
    for (const bx of [18, 62]) { const w = g.createRadialGradient(bx, -106, 0, bx, -106, 13); w.addColorStop(0, 'rgba(255,196,128,0.38)'); w.addColorStop(1, 'rgba(255,196,128,0)'); fill(g, rect(bx - 14, -126, bx + 14, -100), w); }
    // one of them patched
    if (k % 4 === 2) { fill(g, rect(24, -121, 31, -116), '#6a6a52', 0.8); stroke(g, rect(24, -121, 31, -116), '#2a261e', 0.15, 0.6); }
  });
  stroke(g, `M 6 -114${H}`, '#000', 0.5, 0.35);
  for (const x of [4, TARP_W - 4]) stroke(g, `M ${x} -125 L ${x + (x < 40 ? 2 : -2)} -114`, '#3a3228', 0.25);
  stroke(g, `M -2 -119 Q ${TARP_W / 2} -104 ${TARP_W + 2} -119`, '#0f0e0c', 0.25);
  for (const x of [18, 62]) bulb(g, x, -107.4 + Math.abs(x - TARP_W / 2) * 0.12, 2.4, false);
}
export const TARP_BULBS = [18, 62].map((x) => [x, -107.4 + Math.abs(x - TARP_W / 2) * 0.12]);

// what a market leaves on the pavement: cabbage leaves, flattened cardboard,
// a crate slat, onion skins, a bit of string
export function litter(g, seed = 1) {
  const r = (() => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); })();
  fill(g, poly([[2, 0.6], [14, -0.2], [15, 1], [3, 1.2]]), '#8a7452'); fill(g, rect(4, 0, 12, 0.5), '#6a5a3e', 0.6);
  for (let i = 0; i < 5; i++) { const x = 16 + r() * 22, y = -0.4 + r() * 1.2; fill(g, ell(x, y, 1.6, 0.6), r() < 0.5 ? '#5e7a44' : '#7a9a5a'); }
  fill(g, poly([[26, -0.4], [36, -1.2], [36.4, -0.6], [26.4, 0.2]]), '#7a5a3a');
  for (let i = 0; i < 6; i++) fill(g, ell(4 + r() * 34, -0.2 + r() * 1, 0.5, 0.25), '#c49a5a');
  stroke(g, 'M 8 0.4 C 12 -1 14 1 19 0', '#a8946a', 0.15);
}

// Vanta's ration point at the cordon: a white cabin, the lit sign, a red LED
// board saying there is nothing today, the queue rails, the shutter down
export function rationPoint(g, x) {
  const S = mat(tone('#e2e6ea', '#c2c8ce', '#9aa2aa', '#2a2f36'), 'paint', 0.25);
  const B = rect(x, -46, x + 56, 0);
  cel(g, B, S, { sh: 1.2, hl: 0.4 });
  clip(g, B, () => { for (const xx of [x + 18.6, x + 37.3]) fill(g, rect(xx - 0.2, -46, xx + 0.2, 0), S.d); fill(g, rect(x, -4, x + 56, 0), S.d); fill(g, rect(x, -14, x + 56, -12.6), '#b3232e'); });
  cel(g, rect(x - 2, -49, x + 58, -46), mat(tone('#9aa2ae', '#6e7682', '#4c535d', '#1a1e23'), 'steel', 0.4), { sh: 0.3, hl: 0.2 });
  // the hatch with its shutter down
  fill(g, rect(x + 6, -36, x + 34, -18), '#2a2f36');
  clip(g, rect(x + 7, -35, x + 33, -19), () => { for (let y = -35; y < -19; y += 1.6) { fill(g, rect(x + 7, y, x + 33, y + 0.6), '#5a626c'); fill(g, rect(x + 7, y + 0.6, x + 33, y + 1), '#8a929c'); } });
  fill(g, rect(x + 5, -18, x + 35, -16.6), '#4c535d');
  lightbox(g, x + 4, -45, x + 52, -39, 'DAĞITIM NOKTASI');
  ledBoard(g, x + 38, -34, x + 53, -20, [['BUGÜN', -29.4, 2.7], ['DAĞITIM', -25.6, 2.7], ['YOK', -21.6, 2.9]]);
  notice(g, x + 39.4, -17.2, 7, 9, 'vanta', 'KARNE İLE', 121);
  // the queue rails: posts, a strap, nobody in the line
  for (const px of [x - 30, x - 16, x - 2]) { cel(g, rect(px - 0.6, -10, px + 0.6, 0), S, { sh: 0.2, hl: 0.2, lw: 0.2 }); fill(g, ell(px, -10.2, 1, 0.7), S.l); cel(g, rect(px - 2, -0.8, px + 2, 0), S, { sh: 0.2, hl: 0.1, lw: 0.2 }); }
  for (const px of [x - 30, x - 16]) { fill(g, rect(px, -9.4, px + 14, -8.4), '#b3232e'); }
}

// the building site under the scaffolding, stopped since the furnace went
// cold: the council's board, Vanta's stamp across it
export function siteBoard(g, x) {
  for (const px of [x + 2, x + 24]) cel(g, rect(px, -30, px + 1.4, 0), POLE, { sh: 0.3, hl: 0.2, lw: 0.25 });
  const B = rect(x, -46, x + 28, -28);
  cel(g, B, mat(tone('#f0ece2', '#d9d4c6', '#b0aa9a', '#2a2822'), 'paint', 0.7), { sh: 0.5, hl: 0.3 });
  clip(g, B, () => {
    fill(g, rect(x, -46, x + 28, -42), '#2f5a8c');
    letters(g, 'İNŞAAT ALANI', x + 14, -43.2, 2.6, '#f0ece2', { kind: 'print', align: 'center', jit: 0 });
    letters(g, 'GİRİLMEZ', x + 14, -37.6, 3.4, '#1d2129', { kind: 'print', align: 'center', jit: 0, track: 0.08 });
    for (let k = 0; k < 2; k++) fill(g, rect(x + 3, -34.4 + k * 2, x + 25 - k * 6, -33.8 + k * 2), '#6c6f75', 0.8);
    g.save(); g.translate(x + 15, -33); g.rotate(-0.18);
    stroke(g, rect(-11, -2.8, 11, 2.8), '#b3232e', 0.6, 0.85);
    letters(g, 'DURDURULDU', 0, 1.2, 3.4, '#b3232e', { kind: 'print', align: 'center', jit: 0.02, track: 0.06, a: 0.85 });
    g.restore();
  });
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
  fill(g, rect(x0, y + 6, x1, Math.min(-2, y + 40)), '#6a7a5a', 0.08);
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
  const bar = (name, c0, c1, n) => {
    block(c0, c1 - 1, 1, n);
    P(name, [X(c0) - 4, -n * T - 6, X(c1) + 4, 1], (g) => barricade(g, X(c0), X(c1), n * T), front);
  };
  const crates = [];
  const addCrate = (c) => { block(c, c + 1, 1, 2); crates.push(X(c)); };

  // A — the cordon -----------------------------------------------------------------
  addCrate(24);
  P('m2.coneA', [X(40) - 6, -12, X(40) + 8, 1], (g) => cone(g, X(40)), deco);
  // Vanta's ration point, nothing today
  P('m2.ration', [X(46) - 34, -52, X(46) + 60, 1], (g) => rationPoint(g, X(46) + 2), deco);
  lights.push([X(46) + 30, -40, 44, 0.35, [0.9, 0.93, 0.95]]);
  bar('m2.barA', 70, 73, 4);
  P('m2.barrelA', [X(80) - 2, -16, X(80) + 14, 1], (g) => burnBarrel(g, X(80)), deco);
  addCrate(96);
  // B — the market (docs §10.6): along the pavement in front of the shops,
  // tarps slung across overhead; in the road only two crates to fight from
  const tarps = [];
  for (let x = X(112); x < X(236); x += TARP_W + 6) {
    tarps.push(x);
    for (const [bx, by] of TARP_BULBS) glows.push([x + bx, by, 2.4, 2.4, '#ffe6b0', 0.8, 'bulb']);
    lights.push([x + TARP_W / 2, -104, 70, 0.4, [1, 0.72, 0.42], 'bulb']);
  }
  tarps.forEach((x, k) => P(`m2.tarp${k % 4}`, [x - 4, -130, x + TARP_W + 4, -100], (g) => { g.translate(x, 0); crossTarp(g, k); }, deco));
  const litterAt = [X(114), X(141), X(186), X(204), X(219)];
  deco.push({ name: 'm2.litter', box: [-2, -4, 42, 2], paint: (g) => litter(g, 3), at: litterAt });
  // the cover in the middle of the hold
  addCrate(166); addCrate(170);
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
  P('m2.site', [X(272) - 2, -48, X(272) + 30, 1], (g) => siteBoard(g, X(272)), deco);
  // the wall across the street (12 tiles high), wire on top
  block(296, 297, 1, 12);
  P('m2.wall', [X(296) - 2, -106, X(298) + 2, 1], (g) => { concrete(g, X(296), X(298), 96); wire(g, X(296) - 1, X(298) + 1, -96); }, front);
  // D — the far side and the flare -----------------------------------------------------------
  bar('m2.barD', 336, 339, 4);
  addCrate(352);
  P('m2.coneD', [X(366) - 6, -12, X(366) + 8, 1], (g) => cone(g, X(366)), deco);
  P('m2.beacon', [X(388) - 5, -28, X(388) + 5, 1], (g) => beacon(g, X(388)), deco);
  // shared pieces, painted once and drawn at each spot
  props.push({ name: 'm2.crate', box: [-2, -18, 18, 1], paint: (g) => crate(g, 0, 16, 16), at: crates, foot: [8, 9] });
  // checkpoints
  const checkpoints = [{ x: X(104) }, { x: X(232) }, { x: X(320) }];
  checkpoints.forEach((c, i) => P(`m2.cp${i}`, [c.x - 5, -24, c.x + 5, 1], (g) => cpPost(g, c.x), deco));
  for (const x of [150, 560, 1880, 2220, 2600, 2980]) lamps.push(x);
  deco.push({ name: 'c.lamp', box: [-8, -86, 24, 1], paint: (g) => lampPost(g, 0), at: lamps });

  const level = new Level(g.map((r) => r.join('')), TOPY);
  const E = (id, x, y, zone, o = {}) => ({ id, kind: id, x, y, zone, facing: -1, ...o });
  const MZ = [X(112), X(236)]; // the market, where the squads that come for it fight
  return {
    id: 'm2', level, props, front, deco, lamps, glows, lights, width: COLS * T,
    // the street in, Vanta's post at the cordon, then the market's shops and the shut hall
    facade: facadeLayout(-10, COLS * T + 10, 23, ['walkupB', 'teahouse', 'garage', 'walkup', 'crow', 'alley', 'synBlock', 'pazar', 'hal', 'pazarB', 'pazar', 'alley', 'pazarB', 'teahouse', 'pazar', 'union', 'warehouse', 'ruin', 'hotel']),
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
      // B, before the hold
      E('tet', X(137), 0, [X(124), X(150)]),
      E('huc', X(156), 0, [X(112), X(200)]),
      // B, the squads that come for the market
      E('tet', X(232), 0, MZ, { wave: 2 }), E('huc', X(228), 0, MZ, { wave: 2 }),
      E('tet', X(114), 0, MZ, { wave: 3, facing: 1 }), E('huc', X(118), 0, MZ, { wave: 3, facing: 1 }), E('tet', X(214), 0, [X(200), X(230)], { wave: 3 }),
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
