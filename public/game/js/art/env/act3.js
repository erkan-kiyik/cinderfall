// KOR — act 3, "Çöküş" (docs §10.41): missions 8 to 10, from the story bible
// (§1.5). Built like acts 1 and 2 (the same kit: art/env/act2.js): every
// feature sits in tile columns and is painted in the same box.
//
//   m8  Kule Baskını   the boulevard and the plaza under Vorsa's tower: the
//                      lobby gate, hold the forecourt while Vesper gets into
//                      the tower's network, out by the service entrance
//   m9  İhanet         the tower's loading dock, where HAWK's van was to take
//                      the five in: the van is empty and Vorsa is waiting;
//                      hold, then the service lift
//   m10 Vasquez        the roof: the broadcast mast (the city hears what the
//                      tower says), the door to the helipad, and Vasquez
import { cel, fill, stroke, clip, rng } from '../kit.js';
import { tone, mat } from '../style.js';
import { texture } from '../tex.js';
import { crate, lampPost, burnBarrel, dumpster, cone, korMark } from './street.js';
import { container, CONT } from './course.js';
import { terminal, gateFrame, roadSign, portLamp } from './mission1.js';
import { planter, flag, truck } from './mission3.js';
import { letters } from './city.js';
import { emblem } from '../enemies/syndicate.js';
import { kit, strip, X, E } from './act2.js';

const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

const GLASS = mat(tone('#4a5668', '#323c4c', '#222a36', '#0a0d12'), 'steel', 0.35);
const CLAD = mat(tone('#8e98a6', '#69737f', '#4b535d', '#1a1e23'), 'steel', 0.45);
const STEEL = mat(tone('#9aa2ae', '#6e7682', '#4c535d', '#1a1e23'), 'steel', 0.45);
const ROOF = mat(tone('#7d7a74', '#5e5b56', '#44423e', '#161514'), 'concrete', 0.7);

// --- m8: the tower ---------------------------------------------------------------
// The foot of Vorsa's tower, the building the city looks up at: a curtain wall of
// smoked glass in a cage of blue-grey cladding rising out of the frame, floors of
// lit and dark windows, a red line along the canopy over the lobby doors, and the
// ring-and-chevron as tall as three floors.
export function towerFoot(g, x, w = 180) {
  const T0 = -200, B = rect(x, T0, x + w, 0);
  cel(g, B, GLASS, { sh: 1.2, hl: 0.4 });
  const r = rng(x | 0);
  clip(g, B, () => {
    // floors and mullions; windows lit warm (late work) or cold (screens), most dark
    for (let y = -40; y > T0; y -= 14) {
      fill(g, rect(x, y - 1.2, x + w, y), CLAD.d);
      for (let cx = x + 4; cx < x + w - 6; cx += 10) {
        const v = r();
        if (v < 0.16) fill(g, rect(cx + 1, y - 12, cx + 9, y - 2), v < 0.06 ? '#e8c890' : '#9ab8d8', 0.55);
        else if (v < 0.24) fill(g, rect(cx + 1, y - 12, cx + 9, y - 2), '#3a4656', 0.6);
      }
    }
    for (let cx = x; cx <= x + w; cx += 10) fill(g, rect(cx - 0.5, T0, cx + 0.5, -40), CLAD.d, 0.8);
    // a sheen down the glass from the street lamps
    const sh = g.createLinearGradient(x, 0, x + w, 0); sh.addColorStop(0, 'rgba(200,215,235,0)'); sh.addColorStop(0.35, 'rgba(200,215,235,0.10)'); sh.addColorStop(0.5, 'rgba(200,215,235,0)');
    fill(g, B, sh);
    texture(g, 'steel', 0.3, 1.4);
  });
  // the cladding piers at both ends, full height
  for (const px of [x - 6, x + w - 2]) { cel(g, rect(px, T0, px + 8, 0), CLAD, { sh: 1.0, hl: 0.5 }); clip(g, rect(px, T0, px + 8, 0), () => texture(g, 'concrete', 0.4, 1)); }
  // the mark, three floors tall, white on the glass
  const ex = x + w * 0.5, ey = -128;
  fill(g, ell(ex, ey, 22, 22), 'rgba(10,12,16,0.55)');
  emblem(g, ex, ey, 20, 'rgba(236,240,244,0.92)');
  letters(g, 'VORSA', ex, ey + 34, 9, 'rgba(236,240,244,0.9)', { kind: 'sten', align: 'center', jit: 0 });
  // the canopy over the lobby, its red line, the doors under it
  const C = rect(x + 34, -46, x + w - 34, -40);
  cel(g, C, STEEL, { sh: 0.4, hl: 0.5 });
  fill(g, rect(x + 34, -40, x + w - 34, -39), '#d82a34');
  for (let dx = x + 46; dx < x + w - 46; dx += 22) {
    cel(g, rect(dx, -38, dx + 18, 0), GLASS, { sh: 0.3, hl: 0.3, lw: 0.3 });
    fill(g, rect(dx + 2, -36, dx + 16, -2), '#7a6a4a', 0.35);
    fill(g, rect(dx + 8.6, -22, dx + 9.4, -14), STEEL.l);
  }
  // the cells' answer, sprayed low on the pier
  korMark(g, x + 1, -16, 5, 0.75);
}

// Vorsa's poster on a hoarding: the soldier's helmet, the order of the day
export function hoarding(g, x, line = 'DÜZEN · GÜVENLİK · İTAAT') {
  const W = 64, B = rect(x, -58, x + W, -18);
  for (const px of [x + 6, x + W - 8]) cel(g, rect(px, -18, px + 2, 0), STEEL, { sh: 0.3, hl: 0.2, lw: 0.3 });
  cel(g, B, mat(tone('#2a3140', '#1e2430', '#151a22', '#06080b'), 'paint', 0.4), { sh: 0.5, hl: 0.3 });
  clip(g, B, () => {
    const gr = g.createLinearGradient(0, -58, 0, -18); gr.addColorStop(0, '#30405a'); gr.addColorStop(1, '#141a24');
    fill(g, B, gr);
    // the helmet in profile, one red slit
    fill(g, `M ${x + 10} -24 C ${x + 10} -44 ${x + 18} -52 ${x + 28} -52 C ${x + 36} -52 ${x + 40} -46 ${x + 40} -38 L ${x + 34} -36 L ${x + 34} -24 Z`, '#8a96a8');
    fill(g, rect(x + 28, -41, x + 40, -39), '#e0303a');
    emblem(g, x + 52, -44, 6, 'rgba(236,240,244,0.9)');
    letters(g, line, x + W / 2, -22, 3.6, 'rgba(236,240,244,0.85)', { kind: 'sten', align: 'center', jit: 0 });
    texture(g, 'paint', 0.4, 1.2);
    // torn at a corner, a strip of the cells' red paint across
    fill(g, poly([[x + W - 12, -58], [x + W, -58], [x + W, -46]]), '#0c0e12', 0.8);
    stroke(g, `M ${x + 4} -30 L ${x + 24} -34`, '#b3232e', 1.4, 0.75);
  });
}

// --- m9: the loading dock ---------------------------------------------------------
// HAWK's van, parked where he said it would be, its back doors open, empty
export function hawkVan(g, x) {
  const W = 72, BODY = mat(tone('#c8c2b4', '#a19a8a', '#787163', '#26231d'), 'paint', 0.5);
  const B = `M ${x} -6 L ${x} -38 L ${x + 52} -38 L ${x + 60} -26 L ${x + W} -22 L ${x + W} -6 Z`;
  cel(g, B, BODY, { sh: 1.2, hl: 0.5 });
  clip(g, B, () => { texture(g, 'steel', 0.4, 1.2); fill(g, rect(x, -16, x + W, -6), 'rgba(40,30,20,0.35)'); });
  // the cab window, the open back doors swung out, the dark inside
  fill(g, poly([[x + 53, -36], [x + 59, -27], [x + 53, -27]]), '#22303a');
  fill(g, rect(x + 2, -36, x + 14, -8), '#0c0d0e');
  cel(g, rect(x - 10, -36, x - 1, -8), BODY, { sh: 0.4, hl: 0.3, lw: 0.3 });
  // the old sign under the paint, a hawk's head, half covered
  letters(g, 'NAKLİYAT', x + 34, -24, 4, 'rgba(60,50,40,0.55)', { kind: 'sten', align: 'center', jit: 0.03 });
  for (const wx of [x + 14, x + 58]) { fill(g, ell(wx, -6, 6, 6), '#141414'); fill(g, ell(wx, -6, 2.4, 2.4), '#5a5a5a'); }
}

// a dock leveller and the roller door above it, half open, light under it
export function dockDoor(g, x) {
  const W = 56, F = rect(x - 4, -66, x + W + 4, 0);
  cel(g, F, CLAD, { sh: 0.8, hl: 0.4 });
  const D = rect(x, -62, x + W, -24);
  cel(g, D, STEEL, { sh: 0.4, hl: 0.3 });
  clip(g, D, () => { for (let y = -60; y < -24; y += 3) fill(g, rect(x, y, x + W, y + 0.6), STEEL.d); });
  const lit = g.createLinearGradient(0, -24, 0, 0); lit.addColorStop(0, '#f0d8a0'); lit.addColorStop(1, '#6a5a3a');
  fill(g, rect(x, -24, x + W, 0), lit, 0.85);
  fill(g, rect(x - 4, -2, x + W + 4, 0), '#e0c040', 0.8);
  for (let k = 0; k < 7; k++) fill(g, poly([[x + k * 8, -2], [x + k * 8 + 4, -2], [x + k * 8 + 6, 0], [x + k * 8 + 2, 0]]), '#1a1a1a');
  letters(g, 'RAMPA 3', x + W / 2, -64.4, 3.4, '#e8e2d6', { kind: 'sten', align: 'center', jit: 0 });
}

// --- m10: the roof --------------------------------------------------------------------
// a roof plant unit: louvred steel box, the fan's grille on top
export function hvac(g, x) {
  const W = 40, B = rect(x, -26, x + W, 0);
  cel(g, B, STEEL, { sh: 0.8, hl: 0.5 });
  clip(g, B, () => { for (let y = -22; y < -2; y += 2.6) fill(g, rect(x + 3, y, x + W - 3, y + 1), STEEL.d); texture(g, 'steel', 0.4, 1); });
  cel(g, ell(x + W / 2, -27, 12, 2.6), STEEL, { sh: 0.3, hl: 0.4, lw: 0.3 });
  for (let a = 0; a < 6; a++) stroke(g, `M ${x + W / 2} -27 L ${x + W / 2 + Math.cos(a) * 11} ${-27 + Math.sin(a) * 2.2}`, '#2a2f36', 0.5);
}

// the broadcast mast: a lattice tower up out of the frame, the dishes, the red
// lamps every few metres (lit in the game)
export function mast(g, x) {
  const L = (x0, y0, x1, y1, w = 0.8) => stroke(g, `M ${x0} ${y0} L ${x1} ${y1}`, '#3a4048', w);
  const H = -200, wb = 14, wt = 5;
  cel(g, rect(x - wb - 4, -6, x + wb + 4, 0), ROOF, { sh: 0.3, hl: 0.3 });
  for (const s of [-1, 1]) L(x + s * wb, -6, x + s * wt, H, 1.4);
  for (let y = -6, k = 0; y > H + 8; y -= 12, k++) {
    const f = (y + 6) / (H + 6), w0 = wb + (wt - wb) * f, f1 = (y - 6) / (H + 6), w1 = wb + (wt - wb) * f1;
    L(x - w0, y, x + w0, y, 0.6);
    L(x - w0, y, x + w1, y - 12, 0.5); L(x + w0, y, x - w1, y - 12, 0.5);
    if (k % 4 === 1) fill(g, ell(x + w0 + 1, y, 1.3, 1.3), '#6a1414');
  }
  // the dishes, aimed at the city
  for (const [y, s, r] of [[-70, 1, 9], [-112, -1, 7]]) {
    cel(g, `M ${x + s * 6} ${y - r} C ${x + s * (6 + r)} ${y - r} ${x + s * (6 + r)} ${y + r} ${x + s * 6} ${y + r} Z`, STEEL, { sh: 0.4, hl: 0.5, lw: 0.4 });
    stroke(g, `M ${x + s * 6} ${y} L ${x + s * (6 + r * 1.2)} ${y}`, '#2a2f36', 0.6);
  }
  letters(g, 'VORSA · YAYIN', x, -10, 3, '#e8e2d6', { kind: 'sten', align: 'center', jit: 0, a: 0.8 });
}

// the roof's parapet and its rail, low, the city's lights far below behind it
export function parapet(g, x0, x1) {
  cel(g, rect(x0, -10, x1, 0), ROOF, { sh: 0.5, hl: 0.4 });
  clip(g, rect(x0, -10, x1, 0), () => texture(g, 'concrete', 0.5, 1.2));
  for (let x = x0 + 4; x < x1; x += 12) stroke(g, `M ${x} -10 L ${x} -18`, '#4a5058', 0.7);
  stroke(g, `M ${x0} -18 L ${x1} -18`, '#5a6068', 0.9);
}

// the helipad's mark, painted on the roof deck
export function helipad(g, x) {
  fill(g, ell(x, -1.2, 40, 2.2), 'rgba(230,200,60,0.55)');
  fill(g, ell(x, -1.2, 34, 1.7), 'rgba(40,42,44,0.95)');
  letters(g, 'H', x, -0.2, 2.8, 'rgba(240,236,228,0.85)', { kind: 'sten', align: 'center', jit: 0 });
}

// --- the missions ---------------------------------------------------------------------
// mission 8 ---------------------------------------------------------------------------
//   A  the boulevard   Vorsa's hoardings, a checkpoint of barricades, a truck   → cp 1
//   B  the plaza       planters and flags, the marksmen on the far side        → cp 2
//   C  the lobby gate  hack it; the lobby's guard comes through
//   D  the forecourt   hold it while Vesper gets into the tower's network: three squads
//   E  out             along the tower's foot to the service entrance
export function buildMission8() {
  const K = kit('m8'), { block, P, bar, conc, scrap, addCrate, deco, props, lights, glows, lamps } = K;
  // A
  P('m8.sign', [X(14) - 12, -46, X(14) + 12, 1], (g) => roadSign(g, X(14), ['VORSA', 'KULESİ', '400 m']), deco);
  P('m8.poster1', [X(24) - 2, -60, X(24) + 66, 1], (g) => hoarding(g, X(24)), deco);
  addCrate(36);
  bar('m8.barA', 50, 53);
  P('m8.cone', [X(58) - 6, -12, X(58) + 8, 1], (g) => cone(g, X(58)), deco);
  P('m8.truck', [X(66) - 14, -78, X(66) + 156, 2], (g) => truck(g, X(66)), deco);
  addCrate(90);
  // B — the plaza
  const planters = [], flags = [];
  const addPlanter = (c) => { block(c, c + 2, 1, 2); planters.push(X(c)); };
  addPlanter(108); addPlanter(130); addPlanter(156); addPlanter(182);
  for (const c of [104, 126, 150, 176]) flags.push(X(c));
  P('m8.poster2', [X(140) - 2, -60, X(140) + 66, 1], (g) => hoarding(g, X(140), 'SOKAĞA ÇIKMA YASAĞI 22:00'), deco);
  conc('m8.concB', 166);
  // C — the lobby gate, the tower behind it
  conc('m8.concC', 200);
  P('m8.term', [X(214) - 9, -28, X(214) + 18, 1], (g) => terminal(g, X(214)));
  block(226, 227, 1, 12);
  P('m8.gate', [X(226) - 78, -150, X(228) + 78, 1], (g) => gateFrame(g, X(226), X(228), 96, ['VORSA KULESİ', 'YETKİSİZ GİRİŞ YASAK']), deco);
  P('m8.tower', [X(240) - 8, -201, X(240) + 190, 1], (g) => towerFoot(g, X(240), 180), deco);
  lights.push([X(240) + 90, -42, 70, 0.6, [1, 0.85, 0.65]]);
  // D — the forecourt: low walls and crates to fight from
  addCrate(250); bar('m8.barD', 266, 269); addCrate(286); conc('m8.concD', 300);
  // E
  scrap('m8.barE', 330);
  addCrate(352);
  P('m8.dump', [X(366) - 4, -24, X(366) + 48, 1], (g) => dumpster(g, X(366)), deco);
  for (const x of [120, 520, 900, 1500, 1800, 2700, 3000]) lamps.push(x);
  deco.push({ name: 'c.lamp', box: [-8, -86, 24, 1], paint: (g) => lampPost(g, 0), at: lamps });
  props.push({ name: 'm3.planter', box: [-2, -22, 26, 1], paint: planter, at: planters, foot: [12, 14] });
  deco.push({ name: 'm3.flag', box: [-4, -124, 24, 1], paint: (g) => flag(g), at: flags, foot: [0, 4] });
  const FZ = [X(230), X(320)];
  return K.finish({
    facade: strip(-10, ['synBlock', 'walkup', 'synBlock', 'hotel', 'synBlock', 'wallC', 'synBlock', 'valWing', 'valFence', 'synBlock', 'synBlock', 'wallC', 'synBlock', 'hotel', 'synBlock', 'synBlock', 'wallC', 'synBlock', 'walkupB', 'synBlock', 'synBlock', 'hotel', 'synBlock']),
    checkpoints: [{ x: X(96) }, { x: X(196) }, { x: X(306) }],
    gate: { c0: 226, c1: 227, n0: 1, n1: 12, x: X(226), w: 16, h: 96, wave: 1 },
    terminal: { x: X(214), x0: X(214) - 26, x1: X(214) + 26, time: 7 },
    extract: { x: X(388) },
    objectives: [
      { type: 'reach', x: X(160) },
      { type: 'hack' },
      { type: 'hold', x0: X(252), x1: X(290), time: 55, waves: [[2, 2], [18, 3], [36, 4]] },
      { type: 'reach', x: X(384) },
    ],
    enemies: [
      // A
      E('tet', X(53) + 4, 0, [X(40), X(70)]),
      E('huc', X(76), 0, [X(56), X(96)], { patrol: [X(70), X(84)] }),
      E('tet', X(94) + 4, 0, [X(80), X(104)]),
      // B — the plaza
      E('tet', X(112), 0, [X(100), X(140)]),
      E('kal', X(134), 0, [X(110), X(160)]),
      E('tet', X(160), 0, [X(140), X(186)]),
      E('tet', X(186), 0, [X(160), X(198)]),
      E('huc', X(176), 0, [X(150), X(198)], { patrol: [X(168), X(190)] }),
      // C
      E('tet', X(204) + 4, 0, [X(196), X(222)]),
      E('tet', X(218), 0, [X(204), X(224)]),
      // through the gate
      E('tet', X(240), 0, FZ, { wave: 1 }), E('huc', X(258), 0, FZ, { wave: 1 }), E('kal', X(272), 0, FZ, { wave: 1 }),
      // D — the squads that come for the forecourt
      E('tet', X(314), 0, FZ, { wave: 2 }), E('huc', X(316), 0, FZ, { wave: 2 }),
      E('kal', X(314), 0, FZ, { wave: 3 }), E('tet', X(234), 0, FZ, { wave: 3, facing: 1 }), E('tet', X(318), 0, FZ, { wave: 3 }),
      E('huc', X(232), 0, FZ, { wave: 4, facing: 1 }), E('kal', X(316), 0, FZ, { wave: 4 }), E('tet', X(312), 0, FZ, { wave: 4 }), E('tet', X(236), 0, FZ, { wave: 4, facing: 1 }),
      // E
      E('tet', X(333) + 4, 0, [X(322), X(360)]),
      E('huc', X(358), 0, [X(334), X(386)]),
      E('tet', X(380), 0, [X(360), X(396)]),
    ],
  });
}

// mission 9 ---------------------------------------------------------------------------
//   A  the back road   behind the tower, containers and the bins → cp 1
//   B  the dock        HAWK's van, empty, doors open: the ambush comes from both ends
//   C  the yard        through to the service lift; hack its door → cp 3
//   D  the lift hall   the guard there, then the lift (the flare)
export function buildMission9() {
  const K = kit('m9'), { block, P, bar, conc, scrap, addCrate, deco, lights, glows, lamps } = K;
  // A
  P('m9.contA', [X(20) - 2, -42, X(30) + 2, 1], (g) => container(g, X(20), -40, X(30), 0, CONT.navy, { code: 'VRSA 400112 7' }), deco);
  addCrate(34);
  P('m9.burn', [X(48) - 2, -16, X(48) + 14, 1], (g) => burnBarrel(g, X(48)), deco);
  bar('m9.barA', 60, 63);
  P('m9.dumpA', [X(74) - 4, -24, X(74) + 48, 1], (g) => dumpster(g, X(74)), deco);
  addCrate(96);
  // B — the dock: the van, the doors along the back
  for (const c of [112, 136, 160]) P(`m9.dock${c}`, [X(c) - 6, -68, X(c) + 62, 1], (g) => dockDoor(g, X(c)), deco);
  P('m9.van', [X(124) - 12, -40, X(124) + 74, 1], (g) => hawkVan(g, X(124)), deco);
  for (const c of [112, 136, 160]) lights.push([X(c) + 28, -10, 40, 0.5, [1, 0.85, 0.6]]);
  addCrate(118); addCrate(150);
  // C — the yard to the lift
  conc('m9.concC', 186);
  P('m9.contC', [X(204) - 2, -42, X(214) + 2, 1], (g) => container(g, X(204), -40, X(214), 0, CONT.rust, { code: 'VRSA 400131 2', kor: true }), deco);
  addCrate(222);
  P('m9.term', [X(250) - 9, -28, X(250) + 18, 1], (g) => terminal(g, X(250)));
  block(262, 263, 1, 12);
  P('m9.gate', [X(262) - 78, -150, X(264) + 78, 1], (g) => gateFrame(g, X(262), X(264), 96, ['SERVİS ASANSÖRÜ', 'YALNIZCA PERSONEL']), deco);
  // D — the lift hall
  addCrate(280); scrap('m9.barD', 300); addCrate(326); conc('m9.concD', 346);
  P('m9.dock2', [X(364) - 6, -68, X(364) + 62, 1], (g) => dockDoor(g, X(364)), deco);
  for (const x of [80, 640, 1200, 1700, 2100, 2500, 2900]) lamps.push(x);
  deco.push({ name: 'm6.lamp', box: [-8, -88, 24, 1], paint: (g) => portLamp(g, 0), at: lamps });
  glows.push([X(48) + 5, -13, 6, 4, '#ff8a3a', 0.4, 'fire']);
  const DZ = [X(100), X(180)], LZ = [X(266), X(398)];
  return K.finish({
    facade: strip(-10, ['warehouse', 'synBlock', 'stack', 'antrepo', 'synBlock', 'warehouse', 'synBlock', 'synBlock', 'wallC', 'stack', 'synBlock', 'warehouse', 'synBlock', 'antrepo', 'synBlock', 'stack', 'synBlock', 'warehouse', 'synBlock', 'wallC', 'synBlock', 'stack', 'synBlock']),
    fires: [X(48) + 5],
    checkpoints: [{ x: X(100) }, { x: X(176) }, { x: X(272) }],
    gate: { c0: 262, c1: 263, n0: 1, n1: 12, x: X(262), w: 16, h: 96, wave: 5 },
    terminal: { x: X(250), x0: X(250) - 26, x1: X(250) + 26, time: 7 },
    extract: { x: X(386) },
    objectives: [
      { type: 'reach', x: X(112) },
      { type: 'hold', x0: X(122), x1: X(164), time: 45, waves: [[1, 1], [12, 2], [24, 3], [34, 4]] },
      { type: 'hack' },
      { type: 'reach', x: X(382) },
    ],
    enemies: [
      // A
      E('tet', X(63) + 4, 0, [X(50), X(90)]),
      E('tet', X(86), 0, [X(66), X(100)], { patrol: [X(80), X(94)] }),
      // B — the ambush: from the dock's far end, then from behind
      E('tet', X(176), 0, DZ, { wave: 1 }), E('huc', X(172), 0, DZ, { wave: 1 }), E('tet', X(178), 0, DZ, { wave: 1 }),
      E('huc', X(102), 0, DZ, { wave: 2, facing: 1 }), E('tet', X(104), 0, DZ, { wave: 2, facing: 1 }),
      E('kal', X(176), 0, DZ, { wave: 3 }), E('tet', X(178), 0, DZ, { wave: 3 }), E('tet', X(102), 0, DZ, { wave: 3, facing: 1 }),
      E('huc', X(104), 0, DZ, { wave: 4, facing: 1 }), E('kal', X(174), 0, DZ, { wave: 4 }), E('tet', X(178), 0, DZ, { wave: 4 }),
      // C
      E('tet', X(190) + 4, 0, [X(180), X(220)]),
      E('huc', X(216), 0, [X(196), X(240)], { patrol: [X(206), X(230)] }),
      E('tet', X(228), 0, [X(214), X(246)]),
      E('tet', X(244), 0, [X(230), X(258)]),
      // through the lift door
      E('tet', X(276), 0, LZ, { wave: 5 }), E('kal', X(290), 0, LZ, { wave: 5 }), E('huc', X(296), 0, LZ, { wave: 5 }),
      // D
      E('tet', X(303) + 4, 0, [X(290), X(330)]),
      E('tet', X(332), 0, [X(316), X(350)]),
      E('huc', X(360), 0, [X(340), X(390)]),
      E('tet', X(378), 0, [X(352), X(396)]),
    ],
  });
}

// mission 10 --------------------------------------------------------------------------
//   A  the roof        the plant, the water, the parapet; the guard up here → cp 1
//   B  the mast        take the broadcast mast: the city hears the tower; the door to
//                      the helipad opens and its guard comes through → cp 2
//   C  the helipad     Vasquez, at last; two squads as his health drops
//   D  out             the flare on the pad's far side
export function buildMission10() {
  const K = kit('m10'), { block, P, bar, conc, addCrate, deco, lights, glows } = K;
  // the parapet along the roof's edge: one short length, laid end to end (a sprite
  // wider than an atlas page cannot be baked: docs §10.17)
  const par = [], run = (c0, c1) => { for (let x = X(c0); x < X(c1); x += 48) par.push(x); };
  run(4, 60); run(110, 176); run(222, 396);
  deco.push({ name: 'm10.par', box: [-1, -20, 49, 1], paint: (g) => parapet(g, 0, 48), at: par });
  // A — the roof
  P('m10.hvacA', [X(24) - 2, -32, X(24) + 42, 1], (g) => hvac(g, X(24)), deco);
  addCrate(40);
  conc('m10.concA', 56);
  P('m10.hvacB', [X(70) - 2, -32, X(70) + 42, 1], (g) => hvac(g, X(70)), deco);
  bar('m10.barA', 88, 91);
  addCrate(104);
  // B — the mast
  addCrate(132); conc('m10.concB', 152);
  P('m10.mast', [X(196) - 22, -201, X(196) + 22, 1], (g) => mast(g, X(196)), deco);
  for (const y of [-54, -102, -150, -198]) glows.push([X(196) + 6, y, 3, 3, '#ff3020', 0.8]);
  P('m10.term', [X(186) - 9, -28, X(186) + 18, 1], (g) => terminal(g, X(186)));
  block(214, 215, 1, 12);
  P('m10.gate', [X(214) - 78, -150, X(216) + 78, 1], (g) => gateFrame(g, X(214), X(216), 96, ['HELİPAD', 'VORSA KOMUTA']), deco);
  // C — the helipad, open; a little cover on its edges
  P('m10.pad', [X(300) - 42, -6, X(300) + 42, 1], (g) => helipad(g, X(300)), deco);
  addCrate(236); bar('m10.barC', 252, 255); conc('m10.concC', 270); addCrate(330); bar('m10.barC2', 346, 349);
  P('m10.hvacC', [X(362) - 2, -32, X(362) + 42, 1], (g) => hvac(g, X(362)), deco);
  lights.push([X(300), -60, 120, 0.4, [0.9, 0.95, 1]]);
  const PZ = [X(220), X(398)];
  return K.finish({
    // up here the city is below: no street front, the sky and the far lights
    facade: [],
    checkpoints: [{ x: X(100) }, { x: X(206) }, { x: X(330) }],
    gate: { c0: 214, c1: 215, n0: 1, n1: 12, x: X(214), w: 16, h: 96, wave: 1 },
    terminal: { x: X(186), x0: X(186) - 26, x1: X(186) + 26, time: 8 },
    extract: { x: X(390) },
    objectives: [
      { type: 'reach', x: X(120) },
      { type: 'hack' },
      { type: 'boss', boss: { id: 'vasq', x: X(330), zone: [X(222), X(396)] }, phases: [[0.7, 2], [0.4, 3]] },
      { type: 'reach', x: X(386) },
    ],
    enemies: [
      // A
      E('tet', X(59) + 4, 0, [X(44), X(86)]),
      E('huc', X(80), 0, [X(60), X(104)], { patrol: [X(72), X(96)] }),
      E('tet', X(108), 0, [X(92), X(126)]),
      // B
      E('tet', X(136), 0, [X(120), X(160)]),
      E('kal', X(160), 0, [X(140), X(184)]),
      E('tet', X(176), 0, [X(156), X(196)]),
      E('tet', X(206), 0, [X(190), X(212)]),
      // through the helipad door
      E('tet', X(232), 0, PZ, { wave: 1 }), E('huc', X(246), 0, PZ, { wave: 1 }), E('kal', X(262), 0, PZ, { wave: 1 }),
      // Vasquez's two squads
      E('tet', X(392), 0, PZ, { wave: 2 }), E('huc', X(390), 0, PZ, { wave: 2 }), E('tet', X(226), 0, PZ, { wave: 2, facing: 1 }),
      E('kal', X(392), 0, PZ, { wave: 3 }), E('tet', X(388), 0, PZ, { wave: 3 }), E('huc', X(228), 0, PZ, { wave: 3, facing: 1 }), E('tet', X(394), 0, PZ, { wave: 3 }),
    ],
  });
}
