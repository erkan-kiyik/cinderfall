// KOR — the cells' basement, behind every menu (docs §10.9).
//
// The room from the prologue (shots 7 and 9): one enamel lamp swinging over
// the map table, the radio in its corner, the stove, the stairs up to the
// alley door, the pegboard and bench, Vanta's seized crates, the ember mark
// and the furnace men's saying on the wall. Painted flat at background
// density in three pieces (x 80..980, an atlas page is only so wide), the
// floor in three more; the lamp is its own sprite so the scene can swing it.
// The floor is at y = 0, the ceiling at y = -150.
import { fill, stroke, clip, rng, weatherOver } from '../kit.js';
import { texture } from '../tex.js';
import { emblem } from '../enemies/syndicate.js';
import { letters, notice } from './city.js';
import { korMark } from './street.js';

const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

export const ROOM = { x0: 80, x1: 980, ceil: -150, top: -212 };
export const LAMP = { x: 486, y: -150, len: 78 };
export const TABLE = { x0: 432, x1: 536, y: -26 };
export const STOVE = { x: 840 };
export const RADIO = [300, -76.5];
export const ASHTRAY = [470, -27.6];
const SKY = '#1a1d24';

// --- the walls, the ceiling and everything that stands against them ---------------------
function room(g) {
  const { x0, x1, ceil, top } = ROOM, r = rng(7);
  // the back wall: whitewash over brick gone grey and damp, bare concrete low
  fill(g, rect(x0, ceil, x1, 0), '#4a4740');
  clip(g, rect(x0, ceil, x1, -38), () => {
    for (let y = ceil + 3, i = 0; y < -38; y += 3, i++) { fill(g, rect(x0, y - 0.2, x1, y + 0.15), '#3a362f', 0.35); for (let x = x0 + (i % 2) * 3; x < x1; x += 6) fill(g, rect(x, y - 3, x + 0.25, y), '#3a362f', 0.25); }
    for (let i = 0; i < 26; i++) { const x = x0 + r() * (x1 - x0), y = ceil + 6 + r() * 90, w = 8 + r() * 26; fill(g, ell(x, y, w, w * (0.3 + r() * 0.4)), r() < 0.5 ? '#5c584e' : '#3e3b35', 0.35); }
    texture(g, 'concrete', 0.55, 3);
  });
  fill(g, rect(x0, -38, x1, 0), '#3c3b37');
  clip(g, rect(x0, -38, x1, 0), () => { for (let x = x0; x < x1; x += 40) fill(g, rect(x, -38, x + 0.4, 0), '#2a2925', 0.6); texture(g, 'concrete', 0.6, 3); });
  fill(g, rect(x0, -39, x1, -37.6), '#2e2c28');
  // damp: tide marks up from the floor, salts, a stain under the pipe
  for (let x = x0; x < x1; x += 14 + r() * 20) fill(g, ell(x, -40, 10 + r() * 14, 4 + r() * 5), '#2a2a24', 0.25);
  for (let i = 0; i < 40; i++) fill(g, ell(x0 + r() * (x1 - x0), -38 - r() * 16, 0.8 + r() * 1.6, 0.4), '#c9c4b4', 0.18);
  fill(g, poly([[612, ceil], [628, ceil], [624, -60], [616, -60]]), '#000', 0.12);
  // the ceiling: the slab, its beams, the pipes, a dead fitting
  fill(g, rect(x0, top, x1, ceil), '#2c2b28');
  clip(g, rect(x0, top, x1, ceil), () => texture(g, 'concrete', 0.6, 3));
  for (let x = 180; x < x1; x += 130) { fill(g, rect(x, top, x + 12, ceil + 8), '#35332f'); fill(g, rect(x + 10, top, x + 12, ceil + 8), '#000', 0.3); fill(g, rect(x, ceil + 6, x + 12, ceil + 8), '#000', 0.2); }
  fill(g, rect(x0, ceil + 10, x1, ceil + 13), '#4a4038'); fill(g, rect(x0, ceil + 10, x1, ceil + 10.8), '#6a5e50');
  for (let x = x0 + 30; x < x1; x += 70) fill(g, rect(x, ceil + 9.4, x + 2.4, ceil + 13.6), '#2a2622');
  stroke(g, `M ${x0} ${ceil + 17} L ${x1} ${ceil + 17}`, '#1e1e1c', 0.8);
  fill(g, rect(700, ceil + 5, 708, ceil + 8), '#3a3632'); fill(g, ell(704, ceil + 9.4, 1.6, 1.8), '#5a5650');

  // the stairs up to the alley door; light under the door
  fill(g, rect(x0, top, 156, ceil + 20), SKY);
  fill(g, rect(84, -194, 116, -152), '#2a241f'); fill(g, rect(86, -192, 114, -152), '#3a2c22');
  clip(g, rect(86, -192, 114, -152), () => texture(g, 'wood', 0.6, 2));
  fill(g, rect(84, -153, 116, -151.6), '#ffc27a', 0.9);
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, poly([[84, -151.6], [116, -151.6], [134, -120], [70, -120]]), '#ffb060', 0.06); g.restore();
  fill(g, rect(80, -152, 140, -148), '#4a4842');
  // the flight: cast concrete, each tread's nose worn round and pale where boots
  // land, its riser in shadow under it; the light from the door falling down it
  // and dying by the foot; the soffit dark under the whole flight
  fill(g, poly([[140, -148], [245.6, -0.6], [245.6, 0], [140, 0]]), '#23221f');
  for (let k = 0; k < 11; k++) {
    const sx = 140 + k * 9.6, sy = -148 + k * 13.4, lit = 1 - k / 12;
    const RS = rect(sx, sy, sx + 9.6, sy + 13.4 + 2);
    const rg = g.createLinearGradient(0, sy, 0, sy + 15.4); rg.addColorStop(0, '#2e2c28'); rg.addColorStop(0.15, '#4c4a44'); rg.addColorStop(1, '#3a3834');
    fill(g, RS, rg);
    clip(g, RS, () => texture(g, 'concrete', 0.5, 2));
    fill(g, rect(sx, sy, sx + 9.6, sy + 1.2), `rgba(${150 + lit * 60 | 0},${140 + lit * 40 | 0},${120 + lit * 10 | 0},${0.35 + lit * 0.35})`);
    fill(g, ell(sx + 4.8, sy + 0.5, 3, 0.45), '#d8c8a8', 0.12 + lit * 0.18);
    fill(g, rect(sx, sy + 1.2, sx + 9.6, sy + 2.6), '#000', 0.3);
    if (k % 3 === 1) fill(g, ell(sx + 2 + (k % 2) * 4, sy + 6, 1.4, 0.6), '#5a4a3a', 0.25);
  }
  const fall = g.createLinearGradient(140, -148, 240, 0); fall.addColorStop(0, 'rgba(255,190,110,0.08)'); fall.addColorStop(0.5, 'rgba(255,190,110,0)'); fall.addColorStop(1, 'rgba(0,0,0,0.25)');
  fill(g, poly([[140, -148], [245.6, -0.6], [245.6, 0], [140, 0]]), fall);
  // the handrail: a round steel tube on its posts, the light along its top
  const RAIL = 'M 145.4 -170.4 L 251.4 -24.4 L 252.6 -23.6 L 146.6 -169.6 Z';
  fill(g, RAIL, '#2a2c2e'); stroke(g, 'M 145.6 -170.6 L 251.6 -24.6', '#8a8e90', 0.3, 0.7);
  for (const [x, y] of [[150, -164], [196, -100], [242, -36]]) {
    fill(g, rect(x - 0.5, y, x + 0.5, y + 22), '#2a2c2e'); fill(g, rect(x - 0.5, y, x - 0.15, y + 22), '#6a6e70', 0.7);
    fill(g, rect(x - 1.4, y + 21.4, x + 1.4, y + 22.4), '#1a1c1e');
  }
  // the high window at the street, barred, the sodium coming through it
  fill(g, rect(296, -146, 344, -126), '#2a2a28');
  const W = rect(298, -144, 342, -128);
  const wg = g.createLinearGradient(0, -144, 0, -128); wg.addColorStop(0, '#6a5034'); wg.addColorStop(1, '#3a2c20'); fill(g, W, wg);
  clip(g, W, () => { for (let i = 0; i < 18; i++) { const x = 298 + r() * 44; fill(g, rect(x, -144, x + 0.3, -132 + r() * 6), '#c9a070', 0.4); } });
  for (let x = 302; x < 342; x += 6) fill(g, rect(x, -144, x + 1, -128), '#1a1816');
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, poly([[298, -128], [342, -128], [424, 0], [356, 0]]), '#ff9a40', 0.05); fill(g, poly([[306, -128], [334, -128], [404, 0], [372, 0]]), '#ff9a40', 0.035); g.restore();

  // the radio corner: shelf, set, headphones, the aerial lead to the window
  {
    const lg = (ax, ay, bx, by, st) => { const q = g.createLinearGradient(ax, ay, bx, by); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
    // the shelf, a plank on iron brackets, its front edge lit
    fill(g, rect(262, -70, 352, -67), lg(0, -70, 0, -67, [[0, '#8a6a48'], [0.3, '#4a3624'], [1, '#241a10']]));
    fill(g, rect(262, -67, 352, -66), '#000', 0.35);
    for (const x of [268, 344]) fill(g, poly([[x, -67], [x + 2, -67], [x + 2, -60], [x, -64]]), '#2a1e14');
    // the set: an army transceiver in its olive steel case, rounded corners, the
    // knobs knurled, a lit dial window, the switch guard
    const SET = 'M 278 -70 L 278 -83 C 278 -83.6 278.4 -84 279 -84 L 321 -84 C 321.6 -84 322 -83.6 322 -83 L 322 -70 Z';
    fill(g, SET, lg(0, -84, 0, -70, [[0, '#4e5446'], [0.15, '#3a4034'], [1, '#1e221a']]));
    fill(g, rect(278.6, -83.6, 321.4, -83), '#7a806a', 0.6);
    for (const [x, rr] of [[286, 3.2], [298, 2.2], [308, 2.2]]) {
      fill(g, ell(x + 0.4, -76.4, rr, rr), '#000', 0.4);
      fill(g, ell(x, -77, rr, rr), lg(x - rr, -77 - rr, x + rr, -77 + rr, [[0, '#8a8c86'], [0.5, '#3a3c38'], [1, '#1a1a18']]));
      fill(g, ell(x, -77, rr * 0.55, rr * 0.55), '#222420'); fill(g, ell(x - rr * 0.3, -77 - rr * 0.35, rr * 0.25, rr * 0.18), '#c8cac4', 0.6);
    }
    fill(g, rect(313, -81, 320, -74), '#0e0e0c');
    fill(g, rect(314, -80, 319, -76), lg(0, -80, 0, -76, [[0, '#b8f0c8'], [1, '#3a7a50']]), 0.7);
    for (let k = 0; k < 5; k++) fill(g, rect(314.6 + k * 0.9, -79.6, 314.8 + k * 0.9, -78.6), '#1a3a22', 0.8);
    g.save(); g.globalCompositeOperation = 'lighter'; fill(g, ell(316.5, -78, 8, 6), '#5cff8a', 0.04); g.restore();
  }
  fill(g, ell(RADIO[0], RADIO[1], 0.8, 0.8), '#86b070');
  stroke(g, 'M 322 -82 C 330 -100 334 -118 330 -128', '#151515', 0.4);
  // the headphones hung off the shelf by their band, leather cups catching the window
  stroke(g, 'M 331 -61 C 330 -66 333 -70 336 -70 C 339 -70 342 -66 341 -61', '#151515', 0.6);
  for (const x of [331, 341]) { fill(g, ell(x, -61, 2.4, 3.1), '#141414'); fill(g, ell(x - 0.6, -62, 1.2, 1.8), '#4a4844', 0.6); fill(g, ell(x, -61, 1.2, 1.8), '#0a0a0a', 0.7); }
  fill(g, rect(262, -76, 276, -70), '#8a7a5a'); fill(g, rect(262, -76, 276, -75), '#a8946a');
  // the stool
  fill(g, rect(282, -22, 302, -19), '#4a3624'); for (const x of [284, 298]) stroke(g, `M ${x} -19 L ${x - 2} 0 M ${x + 2} -19 L ${x + 4} 0`, '#2a1e14', 0.8);
  // the missing, pinned up; the empty nail and Halil Usta's photograph
  for (let i = 0; i < 6; i++) notice(g, 360 + (i % 3) * 13, -116 + Math.floor(i / 3) * 17, 11, 14, 'kayip', 'KAYIP', 300 + i);
  fill(g, rect(399, -84, 409, -72), '#d9cfb8'); fill(g, rect(400, -83, 408, -75), '#5a5248');
  fill(g, ell(404, -80.4, 1.6, 1.8), '#2a2622'); fill(g, `M 400.6 -75 C 401 -78 407 -78 407.4 -75 Z`, '#2a2622');
  fill(g, poly([[401.6, -82], [406.4, -82], [406, -83.2], [402, -83.2]]), '#2a2622');
  fill(g, ell(404, -88, 0.8, 0.8), '#8a8478'); stroke(g, 'M 404 -88 L 405.4 -86.6', '#3a3632', 0.4);
  // the map on the wall: sheets taped together, pins, string between the places
  const M = rect(420, -114, 544, -52);
  fill(g, M, '#cfc6ae');
  clip(g, M, () => {
    for (const x of [461, 502]) fill(g, rect(x, -114, x + 0.4, -52), '#000', 0.12);
    fill(g, rect(420, -84, 544, -83.6), '#000', 0.1);
    stroke(g, 'M 420 -70 C 450 -78 470 -66 500 -74 C 520 -80 530 -76 544 -82', '#7a8aa0', 1.6, 0.6);
    // the town as a survey sheet draws it: the blocks in faint hatched outline
    // along the streets that cross them, never solid
    for (let i = 0; i < 40; i++) { const x = 422 + r() * 120, y = -112 + r() * 58, w = 2 + r() * 6, h = 1 + r() * 4; stroke(g, rect(x, y, x + w, y + h), '#8a7e64', 0.14, 0.55); fill(g, rect(x, y, x + w, y + h), '#9a8e74', 0.12); }
    for (let i = 0; i < 12; i++) stroke(g, `M ${422 + r() * 120} ${-112 + r() * 58} l ${r() * 20 - 10} ${r() * 10 - 5}`, '#8a7e64', 0.25, 0.6);
    texture(g, 'canvas', 0.35, 2);
    // old paper: yellowed toward the edges, a coffee ring, damp from the wall
    // coming through at the foot, the creases where the sheets were folded,
    // the lamp's warm pool across it and the dark round its edges
    const yl = g.createRadialGradient(482, -84, 20, 482, -84, 80); yl.addColorStop(0, 'rgba(0,0,0,0)'); yl.addColorStop(1, 'rgba(120,90,40,0.28)'); fill(g, M, yl);
    stroke(g, ell(470, -74, 4.2, 4), '#8a6a3a', 0.5, 0.3); stroke(g, ell(470.4, -73.6, 4, 3.8), '#8a6a3a', 0.2, 0.25);
    const dp = g.createLinearGradient(0, -62, 0, -52); dp.addColorStop(0, 'rgba(70,60,40,0)'); dp.addColorStop(1, 'rgba(70,60,40,0.35)'); fill(g, rect(420, -62, 544, -52), dp);
    for (const x of [440.5, 481.5, 522.5]) { fill(g, rect(x - 0.3, -114, x, -52), '#000', 0.1); fill(g, rect(x, -114, x + 0.3, -52), '#fff', 0.12); }
    for (const y of [-98.5, -67.5]) { fill(g, rect(420, y - 0.3, 544, y), '#000', 0.08); fill(g, rect(420, y, 544, y + 0.3), '#fff', 0.1); }
  });
  // the sheets lift a little off the damp wall: a shadow along their lower edge
  fill(g, rect(421, -52, 545, -51), '#000', 0.25);
  for (const [x, y] of [[420, -114], [544, -114], [420, -52], [544, -52], [482, -114]]) fill(g, rect(x - 2.4, y - 1, x + 2.4, y + 1), '#d8ccaa', 0.9);
  const PLACES = [['KAPI', 432, -102], ['PAZAR', 462, -90], ['VALİLİK', 490, -104], ['DÖKÜMHANE', 448, -64], ['LİMAN', 508, -62], ['KULE', 532, -94]];
  stroke(g, `M 432 -102 L 462 -90 L 490 -104 L 532 -94 M 462 -90 L 448 -64 L 508 -62 L 532 -94`, '#a8232d', 0.35);
  for (const [t, x, y] of PLACES) { fill(g, ell(x, y, 1.2, 1.2), '#b3232e'); fill(g, ell(x - 0.3, y - 0.3, 0.4, 0.4), '#fff', 0.6); letters(g, t, x + 2, y - 2, 3, '#2a2016', { kind: 'type', jit: 0.05, seed: x }); }
  fill(g, ell(532, -94, 3, 3), '#a8232d', 0.25); stroke(g, ell(532, -94, 3.6, 3.6), '#a8232d', 0.4);

  // the pegboard and the bench: tools, the halligan, the hard hat, drone parts
  const PB = rect(570, -118, 690, -50);
  fill(g, PB, '#6a5a44');
  clip(g, PB, () => { for (let y = -116; y < -50; y += 4) for (let x = 572; x < 690; x += 4) fill(g, ell(x, y, 0.45, 0.45), '#2a221a', 0.8); texture(g, 'wood', 0.5, 2); });
  stroke(g, PB, '#2a221a', 0.6);
  // the tools on their hooks, each a solid thing: steel rounded by a highlight
  // down its length and dark on its underside, wood with its grain, rust where
  // hands never reach; each hangs a little off the board, so it throws a shadow
  const lin = (x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const STEEL = (x0, x1) => lin(x0, 0, x1, 0, [[0, '#4a4e54'], [0.35, '#c4c9ce'], [0.55, '#8a9096'], [1, '#2e3238']]);
  const drop = (d) => { g.save(); g.translate(1.2, 1.4); fill(g, d, '#000', 0.35); g.restore(); };
  for (const [hx, hy] of [[580, -112], [593, -114], [608, -114], [621, -116], [648, -107], [673, -95]]) { fill(g, ell(hx, hy, 0.7, 0.7), '#1a1612'); stroke(g, `M ${hx} ${hy} l 0 1.6`, '#9aa0a6', 0.35); }
  // a wrench
  const WR = 'M 579 -110 C 577.4 -111 577 -113 578 -114 L 579.2 -112.8 L 580.8 -112.8 L 582 -114 C 583 -113 582.6 -111 581 -110 L 581 -86 C 582 -85.4 582.4 -84 581.6 -83 L 578.4 -83 C 577.6 -84 578 -85.4 579 -86 Z';
  drop(WR); fill(g, WR, STEEL(578, 582));
  // a screwdriver: amber handle, the shaft
  const SD = 'M 591.6 -112.6 L 594.6 -112.4 L 595 -102 C 594.2 -101.4 592.4 -101.4 591.6 -102 Z';
  drop(SD); fill(g, SD, lin(591.6, 0, 595, 0, [[0, '#7a3a10'], [0.4, '#e08a3a'], [1, '#5a2808']]));
  fill(g, rect(592.8, -101.6, 593.6, -88), STEEL(592.8, 593.6));
  // the hammer: ash handle, a forged head
  const HH = rect(606.4, -110, 609.6, -88);
  drop(HH); fill(g, HH, lin(606.4, 0, 609.6, 0, [[0, '#5a3a20'], [0.4, '#a87848'], [1, '#3a2412']]));
  clip(g, HH, () => { for (let k = 0; k < 4; k++) stroke(g, `M ${607 + k * 0.7} -110 C ${607.4 + k * 0.7} -102 ${606.8 + k * 0.7} -96 ${607.2 + k * 0.7} -88`, '#3a2412', 0.12, 0.5); });
  const HD = 'M 602.6 -114.6 L 613.6 -114.2 C 614.4 -113.4 614.4 -110.8 613.6 -110 L 602.6 -110 C 601.8 -110.8 601.8 -113.8 602.6 -114.6 Z';
  drop(HD); fill(g, HD, lin(0, -114.6, 0, -110, [[0, '#c8ccd0'], [0.4, '#7a8086'], [1, '#2a2e32']]));
  // the halligan: forged bar, the adze and pick at the top, the fork below
  const HB = 'M 621 -114 L 623 -114 L 625.6 -80 L 623.6 -80 Z';
  drop(HB); fill(g, HB, STEEL(621, 625.6));
  const HT = 'M 617.4 -117 L 627 -117.2 C 627.8 -116 627.4 -114.6 626.6 -114 L 618 -113.6 C 617 -114.4 616.8 -116 617.4 -117 Z';
  drop(HT); fill(g, HT, lin(0, -117.2, 0, -113.6, [[0, '#d4d8dc'], [0.5, '#8a9096'], [1, '#32363a']]));
  const HF = 'M 623.4 -80.4 L 626 -80.4 L 629.6 -75.6 L 628.4 -75 L 625.6 -78 L 624.4 -74.6 L 623.2 -75 Z';
  drop(HF); fill(g, HF, STEEL(623, 630));
  fill(g, ell(624, -96, 1.2, 3), '#7a3a1a', 0.5);
  // a coil of hose, rubber, hung on its peg
  for (let k = 0; k < 4; k++) {
    const R = 6.2 - k * 0.5;
    stroke(g, ell(648 + k * 0.3, -99 + k * 0.25, R, R * 0.92), '#141414', 1.4);
    stroke(g, ell(648 + k * 0.3 - 0.3, -99 + k * 0.25 - 0.4, R, R * 0.92), '#5a5a58', 0.45, 0.6);
  }
  // the hard hat: a dome of yellow plastic, lit from the room, a lamp clip
  const HAT = 'M 664.4 -82 C 664.4 -88.4 668.2 -91 673 -91 C 677.8 -91 681.6 -88.4 681.6 -82 L 683.6 -81.2 C 683.6 -80.6 683 -80.2 682.2 -80.2 L 663.8 -80.2 C 663 -80.2 662.4 -80.6 662.4 -81.2 Z';
  drop(HAT);
  fill(g, HAT, lin(0, -91, 0, -80.2, [[0, '#f2d66a'], [0.45, '#d8b84a'], [1, '#7a6020']]));
  clip(g, HAT, () => {
    fill(g, ell(669.6, -87.6, 3.4, 1.6), '#fff8d8', 0.45);
    fill(g, rect(669.4, -86.6, 676.6, -84.2), '#f4f0d8', 0.85);
    stroke(g, 'M 666 -82 C 670 -82.8 676 -82.8 680 -82', '#5a4810', 0.25, 0.6);
    fill(g, ell(678, -85, 2.4, 1.6), '#5a4a20', 0.25);
  });
  // the bench: a thick top, worn pale at its edge, oil stains
  fill(g, rect(566, -34, 700, -30), '#5a4430'); fill(g, rect(566, -34, 700, -33.2), '#9a7a54');
  clip(g, rect(566, -34, 700, -30), () => { texture(g, 'wood', 0.6, 2); fill(g, ell(624, -32, 8, 1.4), '#1a120a', 0.35); fill(g, ell(662, -32.4, 5, 1), '#1a120a', 0.3); });
  for (const x of [570, 694]) { fill(g, rect(x, -30, x + 3, 0), '#3a2a1c'); fill(g, rect(x, -30, x + 0.8, 0), '#5a4430'); }
  fill(g, rect(566, -30, 700, -28.6), '#000', 0.35);
  // on it: the drone's motor on its stand, two props, a battery on charge
  const MB = 'M 579.6 -40 C 579.6 -41.4 580.4 -42 582 -42 L 590 -42 C 591.6 -42 592.4 -41.4 592.4 -40 L 592.4 -34 L 579.6 -34 Z';
  fill(g, MB, lin(579.6, 0, 592.4, 0, [[0, '#2a2c30'], [0.35, '#6a6e74'], [1, '#1e2024']]));
  fill(g, rect(583.6, -45.6, 588.4, -42), lin(583.6, 0, 588.4, 0, [[0, '#3a3c40'], [0.4, '#9aa0a6'], [1, '#2a2c30']]));
  fill(g, ell(586, -45.6, 2.4, 0.6), '#c8ccd0');
  for (const [x, a] of [[612, 0.3], [632, -0.4]]) {
    g.save(); g.translate(x, -36.6); g.rotate(a);
    fill(g, 'M -7.4 0 C -5 -1.2 -2 -1 0 -0.4 C 2 -1 5 -1.2 7.4 0 C 5 0.8 2 0.8 0 0.4 C -2 0.8 -5 0.8 -7.4 0 Z', lin(0, -1, 0, 1, [[0, '#4a4c52'], [0.5, '#1a1c20'], [1, '#2a2c30']]));
    fill(g, ell(0, 0, 1.2, 1.2), '#5a5c62'); fill(g, ell(-0.3, -0.3, 0.4, 0.4), '#c8ccd0', 0.8);
    g.restore();
  }
  const BT = 'M 644 -40 C 644 -40.6 644.4 -41 645 -41 L 659 -41 C 659.6 -41 660 -40.6 660 -40 L 660 -34 L 644 -34 Z';
  fill(g, BT, lin(0, -41, 0, -34, [[0, '#4a4c50'], [0.3, '#2e3034'], [1, '#1a1c1e']]));
  fill(g, rect(646, -39, 658, -36.4), '#4a5a4a', 0.6); fill(g, rect(646, -39, 650, -36.4), '#7aff9a', 0.5);
  stroke(g, 'M 660 -37 C 668 -37 670 -42 676 -40', '#151515', 0.45);
  // a red toolbox at the end, its paint chipped
  const TB = 'M 676 -39 C 676 -39.8 676.6 -40.2 677.4 -40.2 L 688.6 -40.2 C 689.4 -40.2 690 -39.8 690 -39 L 690 -34 L 676 -34 Z';
  fill(g, TB, lin(0, -40.2, 0, -34, [[0, '#c2523a'], [0.35, '#8a3a24'], [1, '#4a1c10']]));
  fill(g, rect(681, -41.6, 685, -40.2), '#2a2a2a');
  for (const [x, y] of [[678, -38], [687, -36.4], [683, -35]]) fill(g, ell(x, y, 0.6, 0.4), '#2a2a2a', 0.8);

  // the mark and the saying, painted by hand
  korMark(g, 760, -112, 15, 0.85);
  letters(g, 'OCAK SÖNER', 760, -82, 8, '#d8d0bc', { align: 'center', jit: 0.08, seed: 41, a: 0.85 });
  letters(g, 'KOR KALIR', 760, -70, 8, '#e2692f', { align: 'center', jit: 0.08, seed: 42, a: 0.9 });
  // Vanta's crates, taken: stacked, one prised open, straw spilling
  const CR = (x, y, w, h, open) => {
    // painted planks over a frame: the lid's edge catching the lamp, each plank
    // its own shade, the paint worn to the wood on the corners, rope handles,
    // the stencilled mark half rubbed off, dark under it where it sits
    const B = rect(x, y, x + w, y + h);
    const bg = g.createLinearGradient(0, y, 0, y + h); bg.addColorStop(0, '#565a48'); bg.addColorStop(1, '#3a3e30');
    fill(g, B, bg);
    clip(g, B, () => {
      for (let k = y + 1.4, i = 0; k < y + h; k += 3.2, i++) { fill(g, rect(x, k, x + w, k + 3), i % 2 ? '#fff' : '#000', 0.04); fill(g, rect(x, k + 3, x + w, k + 3.2), '#1e2218', 0.7); }
      for (const cx of [x, x + w - 2.4]) { fill(g, rect(cx, y, cx + 2.4, y + h), '#3e4234'); fill(g, rect(cx, y, cx + 0.6, y + h), '#6a6e5a', 0.6); }
      for (const [cx, cy] of [[x + 1.2, y + 1.6], [x + w - 1.2, y + 1.6], [x + 1.2, y + h - 1.4], [x + w - 1.2, y + h - 1.4]]) fill(g, ell(cx, cy, 1.4, 1), '#7a5a3a', 0.6);
      texture(g, 'wood', 0.5, 2);
    });
    fill(g, rect(x, y, x + w, y + 1.4), '#7a7e66'); fill(g, rect(x, y, x + w, y + 0.4), '#a8ac90', 0.7);
    for (const hx of [x + 3.4, x + w - 5.4]) stroke(g, `M ${hx} ${y + h * 0.42} C ${hx + 0.4} ${y + h * 0.42 + 1.6} ${hx + 1.6} ${y + h * 0.42 + 1.6} ${hx + 2} ${y + h * 0.42}`, '#8a7a5a', 0.45);
    fill(g, rect(x, y + h - 2, x + w, y + h), '#000', 0.3);
    g.save(); g.globalAlpha = 0.7; emblem(g, x + w / 2, y + h / 2, Math.min(w, h) * 0.18, '#d8dcd0'); g.restore();
    if (open) { fill(g, poly([[x - 2, y - 4], [x + w + 2, y - 7], [x + w + 2, y - 5], [x - 2, y - 2]]), '#5e624e'); for (let i = 0; i < 14; i++) stroke(g, `M ${x + 2 + r() * (w - 4)} ${y + 0.4} l ${r() * 6 - 3} ${-1 - r() * 3}`, '#c9b070', 0.3); }
  };
  CR(712, -24, 40, 24, false); CR(754, -24, 36, 24, true); CR(716, -46, 34, 22, false);
  // the stove, its pipe up and out through the wall, the kettle on it
  const sx = STOVE.x;
  // cast iron, black-leaded, its body barrel-round so the fire's light rolls off
  // its sides; the firebox door open a crack, the coals glowing through the grate;
  // the top plate rubbed shiny, the enamel kettle on it
  const BODY = `M ${sx - 13} -32 C ${sx - 14.6} -24 ${sx - 14.6} -12 ${sx - 13} -5 L ${sx + 13} -5 C ${sx + 14.6} -12 ${sx + 14.6} -24 ${sx + 13} -32 Z`;
  fill(g, BODY, lin(sx - 14, 0, sx + 14, 0, [[0, '#121010'], [0.3, '#3a3634'], [0.45, '#4e4a46'], [0.7, '#24201e'], [1, '#0e0c0c']]));
  clip(g, BODY, () => {
    for (const y of [-27, -10]) { fill(g, rect(sx - 15, y, sx + 15, y + 1.2), '#0e0c0c'); fill(g, rect(sx - 15, y + 1.2, sx + 15, y + 1.6), '#5a5652', 0.6); }
    fill(g, ell(sx, -16, 14, 10), '#ff7a2a', 0.1);
  });
  fill(g, rect(sx - 15, -34.4, sx + 15, -31.6), lin(0, -34.4, 0, -31.6, [[0, '#7a7672'], [0.4, '#3a3634'], [1, '#1a1614']]));
  fill(g, rect(sx - 8.4, -24.4, sx + 8.4, -11.6), '#0e0a08');
  fill(g, rect(sx - 7, -22, sx + 7, -13), lin(0, -22, 0, -13, [[0, '#5a1a08'], [0.5, '#c8501a'], [1, '#ffb050']]));
  for (let i = 0; i < 9; i++) fill(g, ell(sx - 5.6 + i * 1.4, -14 - (i % 3) * 1.2, 1.2, 0.8), i % 2 ? '#ffd08a' : '#ff8a3a', 0.8);
  for (let k = sx - 6; k < sx + 7; k += 2.4) fill(g, rect(k, -22, k + 0.6, -13), '#1a1614');
  fill(g, poly([[sx + 8.4, -24.4], [sx + 13, -25.6], [sx + 13, -10.4], [sx + 8.4, -11.6]]), lin(sx + 8.4, 0, sx + 13, 0, [[0, '#2a2624'], [1, '#4a4642']]));
  fill(g, ell(sx + 11.6, -18, 0.6, 0.9), '#8a8682');
  for (const x of [sx - 12, sx + 10]) fill(g, `M ${x} -5 L ${x + 2} -5 L ${x + 2.6} 0 L ${x - 0.6} 0 Z`, '#1a1614');
  const PIPE = rect(sx + 4, ceil + 14, sx + 9, -34);
  fill(g, PIPE, lin(sx + 4, 0, sx + 9, 0, [[0, '#1a1816'], [0.35, '#4e4a46'], [1, '#141210']]));
  for (let y = -46; y > ceil + 14; y -= 18) fill(g, rect(sx + 3.4, y, sx + 9.6, y + 1.2), '#1a1816');
  const KT = `M ${sx - 10.4} -34.2 C ${sx - 10.4} -40.4 ${sx - 1.6} -40.4 ${sx - 1.6} -34.2 Z`;
  fill(g, KT, lin(sx - 10.4, 0, sx - 1.6, 0, [[0, '#4a4e52'], [0.35, '#c8ccd0'], [1, '#3a3e42']]));
  fill(g, `M ${sx - 7.6} -40 C ${sx - 7.6} -42.4 ${sx - 4.4} -42.4 ${sx - 4.4} -40 Z`, '#2a2c2e');
  stroke(g, `M ${sx - 1.8} -36.6 C ${sx} -37.4 ${sx + 1.4} -38.6 ${sx + 2.4} -39.6`, '#8a8e92', 0.7);
  stroke(g, `M ${sx - 9} -38 C ${sx - 8} -43 ${sx - 3} -43 ${sx - 3} -38`, '#2a2c2e', 0.35);
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, ell(sx, -16, 26, 16), '#ff8a3a', 0.06); g.restore();
  // the cot and its wool blanket
  {
    const lg = (ax, ay, bx, by, st) => { const q = g.createLinearGradient(ax, ay, bx, by); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
    // an army cot: canvas on a wooden frame, X legs; the wool blanket thrown over
    // it and hanging off the near side in folds, its striped hem; a pillow dented
    fill(g, rect(872, -14, 966, -12), lg(0, -14, 0, -12, [[0, '#7a6448'], [1, '#3a2c1c']]));
    for (const x of [876, 960]) { stroke(g, `M ${x} -12 L ${x + 6} 0 M ${x + 6} -12 L ${x} 0`, '#3a2c1c', 0.9); }
    fill(g, rect(872, -12, 966, -11), '#000', 0.4);
    const BL = 'M 872 -16 C 884 -20.4 904 -21 924 -20 C 940 -19.4 954 -18.6 966 -17 L 966 -12 C 960 -8 954 -6 950 -7 C 944 -9 938 -6 932 -7.4 C 924 -9 916 -5.6 908 -7 C 898 -8.6 890 -6 882 -8 C 878 -9 874 -10.6 872 -12 Z';
    fill(g, BL, lg(0, -21, 0, -6, [[0, '#7a4a3c'], [0.35, '#5a3a30'], [1, '#2e1c16']]));
    clip(g, BL, () => {
      texture(g, 'wool', 0.6, 2);
      for (const [x, a] of [[884, 0.4], [906, 0.35], [930, 0.4], [948, 0.3]]) { fill(g, `M ${x - 1.4} -16 C ${x - 1} -12 ${x - 2} -9 ${x - 1} -6 L ${x + 1.6} -6 C ${x + 1} -9 ${x + 2} -12 ${x + 1.2} -16 Z`, '#1a100c', a); fill(g, `M ${x + 1.6} -16 C ${x + 2} -12 ${x + 1.2} -9 ${x + 2.2} -6 L ${x + 3} -6 C ${x + 2.2} -9 ${x + 3} -12 ${x + 2.4} -16 Z`, '#b8806a', 0.12); }
      for (const y of [-10.4, -9.2]) stroke(g, `M 872 ${y} C 890 ${y + 2} 920 ${y + 2.6} 966 ${y - 0.4}`, '#c8b080', 0.35, 0.5);
      fill(g, rect(872, -22, 966, -17), '#d8b090', 0.08);
    });
    const PL = 'M 940 -17.6 C 940 -21.6 944 -23 950 -23 C 956 -23 960 -21.6 960.4 -18 C 958 -16.6 944 -16.4 940 -17.6 Z';
    fill(g, PL, lg(0, -23, 0, -16.6, [[0, '#d8d0c0'], [0.6, '#b0a898'], [1, '#7a7468']]));
    fill(g, ell(951, -19.4, 4, 1.4), '#7a7468', 0.4);
  }
  // shadows where the floor meets the wall and in the corners
  const gr = g.createLinearGradient(0, -20, 0, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.35)');
  fill(g, rect(x0, -20, x1, 0), gr);
  const vg = g.createLinearGradient(x0, 0, x1, 0); vg.addColorStop(0, 'rgba(0,0,0,0.5)'); vg.addColorStop(0.08, 'rgba(0,0,0,0)'); vg.addColorStop(0.92, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  fill(g, rect(x0, top, x1, 0), vg);
}

// the table under the lamp, nearer than the wall: its top, the map on it,
// the radio, two mugs, a magazine and rounds, the ashtray; the two chairs
function table(g) {
  const { x0, x1, y } = TABLE;
  const lin = (ax, ay, bx, by, stops) => { const gr = g.createLinearGradient(ax, ay, bx, by); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  // the top: thick planks, the lamp's light along its near edge, rings and
  // scorch marks from years of mugs and cigarettes; legs and stretcher
  const TOP = rect(x0, y, x1, y + 3);
  fill(g, TOP, lin(0, y, 0, y + 3, [[0, '#8a6844'], [0.3, '#5a4028'], [1, '#2e2014']]));
  clip(g, TOP, () => texture(g, 'wood', 0.55, 2));
  fill(g, rect(x0, y + 3, x1, y + 4), '#000', 0.3);
  for (const x of [x0 + 3, x1 - 6]) { fill(g, rect(x, y + 3, x + 3, 0), lin(x, 0, x + 3, 0, [[0, '#4a3420'], [0.4, '#6a4c30'], [1, '#2a1c10']])); }
  fill(g, rect(x0 + 3, y + 8, x1 - 3, y + 10), lin(0, y + 8, 0, y + 10, [[0, '#5a4028'], [1, '#2a1c10']]));
  // the street map spread on it, its corners curling, the route in red
  fill(g, poly([[x0 + 14, y - 0.2], [x0 + 62, y - 1], [x0 + 64, y], [x0 + 12, y]]), lin(x0 + 12, 0, x0 + 64, 0, [[0, '#b8ae94'], [0.5, '#e8dec4'], [1, '#c8bea4']]));
  fill(g, poly([[x0 + 62, y - 1], [x0 + 64.6, y - 2.2], [x0 + 64, y]]), '#a89e84');
  stroke(g, `M ${x0 + 20} ${y - 0.5} L ${x0 + 40} ${y - 0.8} L ${x0 + 52} ${y - 0.4}`, '#a8232d', 0.3);
  // the field radio: a steel case, dials, its aerial
  const RD = `M ${x0 + 68} ${y} L ${x0 + 68} ${y - 7.4} C ${x0 + 68} ${y - 8} ${x0 + 68.4} ${y - 8.2} ${x0 + 69} ${y - 8.2} L ${x0 + 81} ${y - 8.2} C ${x0 + 81.6} ${y - 8.2} ${x0 + 82} ${y - 8} ${x0 + 82} ${y - 7.4} L ${x0 + 82} ${y} Z`;
  fill(g, RD, lin(x0 + 68, 0, x0 + 82, 0, [[0, '#2a2e2a'], [0.3, '#4a524a'], [1, '#1a1e1a']]));
  fill(g, ell(x0 + 72, y - 4, 2.1, 2.1), '#151815'); fill(g, ell(x0 + 72, y - 4, 1.6, 1.6), lin(0, y - 5.6, 0, y - 2.4, [[0, '#6a706a'], [1, '#2a2e2a']]));
  for (const dx of [77, 80]) { fill(g, ell(x0 + dx, y - 5, 0.9, 0.9), '#0e100e'); fill(g, ell(x0 + dx - 0.2, y - 5.2, 0.35, 0.35), '#9aa09a', 0.8); }
  fill(g, rect(x0 + 75.6, y - 2.6, x0 + 80.6, y - 1.4), '#c8d8a0', 0.55);
  stroke(g, `M ${x0 + 80} ${y - 8} L ${x0 + 84} ${y - 20}`, '#151515', 0.4); fill(g, ell(x0 + 84, y - 20, 0.4, 0.4), '#2a2a2a');
  // two enamel mugs, chipped, tea gone cold in them
  for (const x of [x0 + 4, x0 + 88]) {
    const MG = rect(x, y - 5, x + 4.4, y);
    fill(g, MG, lin(x, 0, x + 4.4, 0, [[0, '#9a968a'], [0.35, '#eeeadc'], [1, '#8a867a']]));
    stroke(g, `M ${x + 4.4} ${y - 4} C ${x + 6.4} ${y - 4} ${x + 6.4} ${y - 1.4} ${x + 4.4} ${y - 1.4}`, '#c8c4b8', 0.55);
    fill(g, ell(x + 2.2, y - 5, 2.2, 0.5), '#3a2416'); fill(g, rect(x, y - 5.2, x + 4.4, y - 4.8), '#1a2a3a', 0.6);
    fill(g, ell(x + 3.4, y - 1.6, 0.5, 0.4), '#1a1a1a', 0.8);
  }
  // a magazine stood on end, rounds loose beside it, brass catching the lamp
  fill(g, poly([[x0 + 92, y], [x0 + 96, y - 7], [x0 + 99, y - 6.4], [x0 + 95, y]]), lin(x0 + 92, 0, x0 + 99, 0, [[0, '#1a1c20'], [0.5, '#4a4c52'], [1, '#2a2c30']]));
  for (let k = 0; k < 4; k++) { const rx = x0 + 50 + k * 1.6; fill(g, rect(rx, y - 2.4, rx + 0.8, y), lin(rx, 0, rx + 0.8, 0, [[0, '#8a6a28'], [0.4, '#f0d070'], [1, '#6a4a18']])); fill(g, ell(rx + 0.4, y - 2.4, 0.4, 0.3), '#b87a3a'); }
  // the ashtray with its cigarette burning
  fill(g, ell(ASHTRAY[0], y - 0.8, 3, 0.9), lin(ASHTRAY[0] - 3, 0, ASHTRAY[0] + 3, 0, [[0, '#4a4e52'], [0.4, '#9a9ea2'], [1, '#3a3e42']])); fill(g, ell(ASHTRAY[0], y - 1, 2.2, 0.5), '#2a2a2a');
  stroke(g, `M ${ASHTRAY[0] - 1} ${y - 1.2} L ${ASHTRAY[0] + 3} ${y - 2.4}`, '#e8e2d4', 0.5); fill(g, ell(ASHTRAY[0] + 3.1, y - 2.45, 0.3, 0.3), '#ff8a3a');
  // the chairs pulled out: bentwood, the seat worn, the back rail and its spindles
  for (const [x, d] of [[x0 - 14, -1], [x1 + 4, 1]]) {
    const back = d < 0 ? x : x + 10, front = d < 0 ? x + 10 : x;
    const WD = (ax, bx) => lin(ax, 0, bx, 0, [[0, '#2a1c10'], [0.45, '#6a4c30'], [1, '#2a1c10']]);
    fill(g, rect(back - 0.6, -34, back + 0.8, 0), WD(back - 0.6, back + 0.8));
    fill(g, rect(front - 0.6, -13, front + 0.8, 0), WD(front - 0.6, front + 0.8));
    fill(g, rect(x - 0.6, -15.2, x + 10.6, -13), lin(0, -15.2, 0, -13, [[0, '#8a6844'], [0.4, '#5a4028'], [1, '#2a1c10']]));
    fill(g, rect(x, -6, x + 10, -5.2), '#2a1c10', 0.9);
    const bx = d < 0 ? -1 : 8;
    fill(g, rect(x + bx, -34, x + bx + 3, -31.6), lin(0, -34, 0, -31.6, [[0, '#7a5a3a'], [1, '#3a2818']]));
    for (const k of [0.8, 1.8]) fill(g, rect(x + bx + k, -31.6, x + bx + k + 0.4, -24), '#4a3624');
  }
}

// the floor: concrete, cracked and patched, a worn kilim under the table, a
// bucket under the drip, cables
function floor(g) {
  const { x0, x1 } = ROOM, r = rng(19);
  fill(g, rect(x0, -0.5, x1, 42), '#3a3934');
  clip(g, rect(x0, -0.5, x1, 42), () => {
    for (let x = x0; x < x1; x += 60) stroke(g, `M ${x} 0 L ${x - 14} 42`, '#2a2925', 0.4);
    for (const y of [10, 24]) stroke(g, `M ${x0} ${y} L ${x1} ${y}`, '#2a2925', 0.3);
    for (let i = 0; i < 20; i++) fill(g, ell(x0 + r() * (x1 - x0), 2 + r() * 36, 6 + r() * 20, 1 + r() * 3), r() < 0.5 ? '#2e2d29' : '#45443e', 0.4);
    texture(g, 'concrete', 0.55, 1.8);
  });
  // the kilim
  const K = poly([[404, 1.4], [566, 1.4], [584, 15], [388, 15]]);
  fill(g, K, '#7a2a24');
  clip(g, K, () => {
    fill(g, poly([[410, 3], [560, 3], [570, 13], [400, 13]]), '#8a5a2e');
    for (let x = 414; x < 560; x += 12) fill(g, poly([[x, 8], [x + 5, 4.4], [x + 10, 8], [x + 5, 11.6]]), '#2a3a4a');
    for (let x = 392; x < 584; x += 3) fill(g, rect(x, 1.4, x + 1.4, 2.4), '#c9b48a', 0.6);
    // the weave: fine weft lines, each motif stepped as a woven one is
    for (let y = 2; y < 15; y += 0.7) fill(g, rect(388, y, 584, y + 0.18), '#000', 0.12);
    for (let x = 414; x < 560; x += 12) for (const [dx, dy] of [[2.2, 6.2], [7.8, 6.2], [2.2, 9.8], [7.8, 9.8]]) fill(g, rect(x + dx - 0.6, dy - 0.5, x + dx + 0.6, dy + 0.5), '#2a3a4a', 0.8);
    texture(g, 'wool', 0.6, 1.6);
    // years of boots: the middle walked pale and flat, the colour gone grey where
    // the chairs scrape, dirt at the edges, the table's shadow
    const wr = g.createRadialGradient(486, 8, 4, 486, 8, 70); wr.addColorStop(0, 'rgba(196,176,150,0.28)'); wr.addColorStop(1, 'rgba(196,176,150,0)');
    fill(g, K, wr);
    for (const cx of [430, 540]) { const sc = g.createRadialGradient(cx, 9, 0, cx, 9, 16); sc.addColorStop(0, 'rgba(120,110,100,0.3)'); sc.addColorStop(1, 'rgba(120,110,100,0)'); fill(g, rect(cx - 18, 1, cx + 18, 15), sc); }
    for (let i = 0; i < 26; i++) fill(g, ell(390 + r() * 194, 1.6 + r() * 13, 1 + r() * 4, 0.3 + r() * 0.8), r() < 0.6 ? '#1e1814' : '#5a4a3a', 0.25);
    const ed = g.createLinearGradient(0, 1.4, 0, 15); ed.addColorStop(0, 'rgba(0,0,0,0.3)'); ed.addColorStop(0.2, 'rgba(0,0,0,0)'); ed.addColorStop(0.85, 'rgba(0,0,0,0)'); ed.addColorStop(1, 'rgba(0,0,0,0.3)');
    fill(g, K, ed);
  });
  // the fringe at the near edge, knotted, some of it worn away
  for (let x = 389; x < 583; x += 1.6) if (r() > 0.18) stroke(g, `M ${x} 15 l ${(r() - 0.5) * 0.8} ${1 + r() * 1.4}`, '#b8a27a', 0.22, 0.7);
  fill(g, rect(380, 14.4, 590, 15.6), '#000', 0.25);
  // the bucket under the drip, the cables across
  fill(g, poly([[612, 0], [626, 0], [624.6, -10], [613.4, -10]]), '#6a6e72'); fill(g, ell(619, -10, 5.6, 1.2), '#4a4e52'); fill(g, ell(619, -10, 4.8, 0.8), '#2a3038');
  stroke(g, 'M 300 0.8 C 340 6 380 4 420 2', '#151515', 0.5); stroke(g, 'M 700 0.6 C 740 5 790 3 830 1', '#151515', 0.5);
  for (let i = 0; i < 6; i++) { const x = 380 + r() * 220; g.save(); g.translate(x, 4 + r() * 8); g.scale(1, 0.4); g.rotate(r() * 3); fill(g, rect(-2, -2.6, 2, 2.6), '#d8d0bc', 0.7); g.restore(); }
  fill(g, rect(x0, 36, x1, 42), '#000', 0.25);
}

// the lamp, drawn from its pivot at the ceiling hanging straight down: the
// flex, the green enamel shade white inside, the bulb
function lamp(g) {
  const L = LAMP.len;
  // the twisted flex, the bakelite holder
  stroke(g, `M 0 0 L 0 ${L - 4}`, '#151515', 0.4);
  stroke(g, `M 0.1 0 L 0.1 ${L - 4}`, '#3a3632', 0.12, 0.6);
  fill(g, rect(-1, L - 5.4, 1, L - 2.8), '#2a2622'); fill(g, rect(-1, L - 5.4, -0.4, L - 2.8), '#4a4440', 0.8);
  // the enamel shade: a shallow bell, rolled at the rim; green outside, its curve
  // catching the room's light on one shoulder, chipped to black iron here and there
  const SH = `M -2.2 ${L - 3.4} C -3.2 ${L - 3.2} -4.4 ${L - 2} -5.6 ${L - 0.4} C -6.8 ${L + 1} -8 ${L + 2.4} -9.2 ${L + 3.2} L 9.2 ${L + 3.2} C 8 ${L + 2.4} 6.8 ${L + 1} 5.6 ${L - 0.4} C 4.4 ${L - 2} 3.2 ${L - 3.2} 2.2 ${L - 3.4} Z`;
  const gr = g.createLinearGradient(-9, 0, 9, 0);
  gr.addColorStop(0, '#1e3226'); gr.addColorStop(0.28, '#35553f'); gr.addColorStop(0.38, '#4f7759'); gr.addColorStop(0.55, '#2a4232'); gr.addColorStop(1, '#152219');
  fill(g, SH, gr);
  clip(g, SH, () => {
    stroke(g, `M -2.8 ${L - 2.8} C -4 ${L - 1.6} -5.4 ${L + 0.4} -6.6 ${L + 2.2}`, '#c8e8d4', 0.6, 0.3);
    const tp = g.createLinearGradient(0, L - 3.4, 0, L + 3.2); tp.addColorStop(0, 'rgba(0,0,0,0.35)'); tp.addColorStop(0.5, 'rgba(0,0,0,0)'); fill(g, SH, tp);
    fill(g, ell(6.2, L + 1.8, 0.6, 0.35), '#101410', 0.6);
  });
  // the rolled rim, the white enamel inside, the bulb
  fill(g, ell(0, L + 3.3, 9.4, 1.2), '#1a2a20');
  fill(g, ell(0, L + 3.5, 8.6, 0.8), '#f4eedc');
  fill(g, ell(0, L + 3.4, 2.4, 2.2), '#fff4dc');
  fill(g, ell(-0.6, L + 2.8, 0.8, 0.7), '#ffffff', 0.9);
}
export const LAMP_BULB = LAMP.len + 3.6;

// bake entries: the room and its floor in three pieces each, the table, the lamp
export function hideoutBakeList(scale) {
  const out = [];
  for (let i = 0; i < 3; i++) {
    const a = ROOM.x0 + i * 300, b = Math.min(ROOM.x1, a + 300);
    // a unit of overlap each side so the soft edges sit under the neighbour
    // a basement's years on its walls: damp running down from the street, stains,
    // the dark that gathers where wall meets floor (docs §10.9)
    out.push({ name: `h.room${i}`, box: [a - 1, ROOM.top, b + 1, 0.5], scale, paint: (g) => { room(g); weatherOver(g, [a - 1, ROOM.top, b + 1, 0.5], 61 + i, { night: 0.2, foot: 0.45, stain: 1.1, rain: 1.6, speck: 0.3, big: 0.9 }); } });
    out.push({ name: `h.floor${i}`, box: [a - 1, -0.5, b + 1, 42], scale, paint: (g) => { floor(g); weatherOver(g, [a - 1, -0.5, b + 1, 42], 71 + i, { foot: 0, stain: 0.9, rain: 0, speck: 0.35, big: 1.2 }); } });
  }
  out.push({ name: 'h.table', box: [TABLE.x0 - 16, -36, TABLE.x1 + 16, 0.5], scale, paint: (g) => { table(g); weatherOver(g, [TABLE.x0 - 16, -36, TABLE.x1 + 16, 0.5], 81, { foot: 0.35, stain: 1.2, rain: 0, speck: 0.4, big: 0.5 }); } });
  out.push({ name: 'h.lamp', box: [-10, -1, 10, LAMP.len + 6], scale: scale * 1.5, paint: lamp });
  return out;
}
