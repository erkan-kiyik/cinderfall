// KOR LAB — the cells' basement, behind every menu (docs §10.9).
//
// The room from the prologue (shots 7 and 9): one enamel lamp swinging over
// the map table, the radio in its corner, the stove, the stairs up to the
// alley door, the pegboard and bench, Vanta's seized crates, the ember mark
// and the furnace men's saying on the wall. Painted flat at background
// density in three pieces (x 80..980, an atlas page is only so wide), the
// floor in three more; the lamp is its own sprite so the scene can swing it.
// The floor is at y = 0, the ceiling at y = -150.
import { fill, stroke, clip, rng } from '../kit.js';
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
  for (let k = 0; k < 11; k++) {
    const sx = 140 + k * 9.6, sy = -148 + k * 13.4;
    fill(g, rect(sx, sy, sx + 9.6, sy + 13.4 + 2), '#4c4a44'); fill(g, rect(sx, sy, sx + 9.6, sy + 1), '#625e56');
  }
  fill(g, poly([[140, -148], [245.6, -0.6], [245.6, 0], [140, 0]]), '#000', 0.25);
  stroke(g, 'M 146 -170 L 252 -24', '#5a5a56', 0.8); for (const [x, y] of [[150, -164], [196, -100], [242, -36]]) stroke(g, `M ${x} ${y} L ${x} ${y + 22}`, '#4a4a46', 0.6);
  // the high window at the street, barred, the sodium coming through it
  fill(g, rect(296, -146, 344, -126), '#2a2a28');
  const W = rect(298, -144, 342, -128);
  const wg = g.createLinearGradient(0, -144, 0, -128); wg.addColorStop(0, '#6a5034'); wg.addColorStop(1, '#3a2c20'); fill(g, W, wg);
  clip(g, W, () => { for (let i = 0; i < 18; i++) { const x = 298 + r() * 44; fill(g, rect(x, -144, x + 0.3, -132 + r() * 6), '#c9a070', 0.4); } });
  for (let x = 302; x < 342; x += 6) fill(g, rect(x, -144, x + 1, -128), '#1a1816');
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, poly([[298, -128], [342, -128], [424, 0], [356, 0]]), '#ff9a40', 0.05); fill(g, poly([[306, -128], [334, -128], [404, 0], [372, 0]]), '#ff9a40', 0.035); g.restore();

  // the radio corner: shelf, set, headphones, the aerial lead to the window
  fill(g, rect(262, -70, 352, -67), '#4a3624'); for (const x of [268, 344]) fill(g, poly([[x, -67], [x + 2, -67], [x + 2, -60], [x, -64]]), '#2a1e14');
  fill(g, rect(278, -84, 322, -70), '#2a2c2a'); fill(g, rect(278, -84, 322, -82), '#3a3c3a');
  for (const [x, rr] of [[286, 3.2], [298, 2.2], [308, 2.2]]) { fill(g, ell(x, -77, rr, rr), '#4a4c4a'); fill(g, ell(x, -77, rr * 0.4, rr * 0.4), '#1a1a1a'); }
  fill(g, rect(313, -81, 320, -74), '#1a1a18'); fill(g, rect(314, -80, 319, -76), '#7ac090', 0.5);
  fill(g, ell(RADIO[0], RADIO[1], 0.8, 0.8), '#5cff7a');
  stroke(g, 'M 322 -82 C 330 -100 334 -118 330 -128', '#151515', 0.4);
  stroke(g, 'M 332 -70 C 330 -62 336 -58 340 -62', '#151515', 0.5); fill(g, ell(331, -61, 2.2, 3), '#1e1e1e'); fill(g, ell(341, -61, 2.2, 3), '#1e1e1e');
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
    for (let i = 0; i < 40; i++) { const x = 422 + r() * 120, y = -112 + r() * 58; fill(g, rect(x, y, x + 2 + r() * 6, y + 1 + r() * 4), '#9a8e74', 0.4); }
    for (let i = 0; i < 12; i++) stroke(g, `M ${422 + r() * 120} ${-112 + r() * 58} l ${r() * 20 - 10} ${r() * 10 - 5}`, '#8a7e64', 0.25, 0.6);
    texture(g, 'canvas', 0.35, 2);
  });
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
  stroke(g, 'M 580 -110 L 580 -84 M 577 -110 L 583 -110', '#8a8e94', 1);
  stroke(g, 'M 592 -112 L 600 -84', '#8a8e94', 0.9); fill(g, poly([[589, -114], [596, -113], [594, -110]]), '#8a8e94');
  fill(g, rect(606, -112, 610, -90), '#5a3a24'); fill(g, rect(603, -114, 613, -110), '#8a8e94');
  stroke(g, 'M 620 -114 L 624 -80', '#9aa0a6', 1.6); fill(g, poly([[618, -116], [626, -116], [627, -112], [619, -112]]), '#9aa0a6'); stroke(g, 'M 624 -80 L 628 -76', '#9aa0a6', 1.2);
  for (let k = 0; k < 3; k++) stroke(g, ell(648, -100, 6 - k * 1.2, 6 - k * 1.2), '#8a7a5a', 0.6);
  fill(g, `M 666 -82 C 666 -90 680 -90 680 -82 L 682 -81 L 664 -81 Z`, '#d8b84a'); fill(g, rect(670, -86, 676, -84), '#f4f0d8', 0.9);
  stroke(g, 'M 673 -90 L 673 -94', '#2a221a', 0.4);
  fill(g, rect(566, -34, 700, -30), '#5a4430'); fill(g, rect(566, -34, 700, -33), '#7a5e40');
  for (const x of [570, 694]) fill(g, rect(x, -30, x + 3, 0), '#3a2a1c');
  fill(g, rect(580, -40, 592, -34), '#4a4c50'); fill(g, rect(584, -44, 588, -40), '#4a4c50');
  for (const [x, a] of [[612, 0.3], [632, -0.4]]) { stroke(g, `M ${x - 7 * Math.cos(a)} ${-37 - 7 * Math.sin(a)} L ${x + 7 * Math.cos(a)} ${-37 + 7 * Math.sin(a)}`, '#2a2c30', 0.8); fill(g, ell(x, -37, 1.2, 1.2), '#3a3c40'); }
  fill(g, rect(644, -40, 660, -34), '#3a3c40'); fill(g, rect(646, -39, 658, -36), '#5a6a5a', 0.6); stroke(g, 'M 660 -37 C 668 -37 670 -42 676 -40', '#151515', 0.4);
  fill(g, rect(676, -38, 690, -34), '#8a3a24');

  // the mark and the saying, painted by hand
  korMark(g, 760, -112, 15, 0.85);
  letters(g, 'OCAK SÖNER', 760, -82, 8, '#d8d0bc', { align: 'center', jit: 0.08, seed: 41, a: 0.85 });
  letters(g, 'KOR KALIR', 760, -70, 8, '#e2692f', { align: 'center', jit: 0.08, seed: 42, a: 0.9 });
  // Vanta's crates, taken: stacked, one prised open, straw spilling
  const CR = (x, y, w, h, open) => {
    fill(g, rect(x, y, x + w, y + h), '#4a4e3e'); fill(g, rect(x, y, x + w, y + 1.4), '#5e624e');
    for (let k = x + 3; k < x + w; k += 6) fill(g, rect(k, y + 1.4, k + 0.4, y + h), '#2e3226', 0.6);
    fill(g, rect(x, y + h - 2, x + w, y + h), '#000', 0.25);
    emblem(g, x + w / 2, y + h / 2, Math.min(w, h) * 0.18, '#d8dcd0');
    if (open) { fill(g, poly([[x - 2, y - 4], [x + w + 2, y - 7], [x + w + 2, y - 5], [x - 2, y - 2]]), '#5e624e'); for (let i = 0; i < 14; i++) stroke(g, `M ${x + 2 + r() * (w - 4)} ${y + 0.4} l ${r() * 6 - 3} ${-1 - r() * 3}`, '#c9b070', 0.3); }
  };
  CR(712, -24, 40, 24, false); CR(754, -24, 36, 24, true); CR(716, -46, 34, 22, false);
  // the stove, its pipe up and out through the wall, the kettle on it
  const sx = STOVE.x;
  fill(g, rect(sx - 14, -34, sx + 14, -4), '#2a2624'); fill(g, rect(sx - 14, -34, sx + 14, -32), '#3a3634');
  fill(g, rect(sx - 8, -24, sx + 8, -12), '#1a1614'); fill(g, rect(sx - 7, -22, sx + 7, -13), '#a8401a', 0.8); fill(g, rect(sx - 5, -18, sx + 5, -13), '#ff8a3a', 0.8);
  for (let k = sx - 6; k < sx + 7; k += 2.4) fill(g, rect(k, -22, k + 0.6, -13), '#1a1614');
  for (const x of [sx - 12, sx + 10]) fill(g, rect(x, -4, x + 2, 0), '#1a1614');
  fill(g, rect(sx + 4, ceil + 14, sx + 9, -34), '#2a2826'); fill(g, rect(sx + 4, ceil + 14, sx + 5, -34), '#3e3c38');
  for (let y = -46; y > ceil + 14; y -= 18) fill(g, rect(sx + 3.4, y, sx + 9.6, y + 1.2), '#1a1816');
  fill(g, `M ${sx - 10} -34 C ${sx - 10} -40 ${sx - 2} -40 ${sx - 2} -34 Z`, '#6a6e72'); fill(g, `M ${sx - 8} -40 C ${sx - 8} -44 ${sx - 4} -44 ${sx - 4} -40 Z`, '#7a7e82'); stroke(g, `M ${sx - 2} -37 L ${sx + 2} -39`, '#6a6e72', 0.6);
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, ell(sx, -16, 26, 16), '#ff8a3a', 0.06); g.restore();
  // the cot and its wool blanket
  fill(g, rect(872, -16, 966, -12), '#4a4a46'); for (const x of [874, 962]) fill(g, rect(x, -12, x + 2, 0), '#3a3a36');
  fill(g, `M 872 -16 C 890 -21 930 -20 966 -17 L 966 -12 L 872 -12 Z`, '#5a3a30');
  clip(g, `M 872 -16 C 890 -21 930 -20 966 -17 L 966 -12 L 872 -12 Z`, () => { for (let x = 872; x < 966; x += 6) fill(g, rect(x, -22, x + 2, -12), '#3a2620', 0.5); texture(g, 'wool', 0.6, 2); });
  fill(g, ell(950, -19, 10, 3.6), '#b8b0a0');
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
  fill(g, rect(x0, y, x1, y + 3), '#5a4028'); fill(g, rect(x0, y, x1, y + 0.8), '#7a5a3a');
  for (const x of [x0 + 3, x1 - 6]) fill(g, rect(x, y + 3, x + 3, 0), '#3a2818');
  fill(g, rect(x0 + 3, y + 8, x1 - 3, y + 10), '#3a2818');
  fill(g, poly([[x0 + 14, y - 0.2], [x0 + 62, y - 1], [x0 + 64, y], [x0 + 12, y]]), '#d8ceb4');
  stroke(g, `M ${x0 + 20} ${y - 0.5} L ${x0 + 40} ${y - 0.8} L ${x0 + 52} ${y - 0.4}`, '#a8232d', 0.3);
  fill(g, rect(x0 + 68, y - 8, x0 + 82, y), '#2a2c2a'); fill(g, ell(x0 + 72, y - 4, 2, 2), '#4a4c4a'); stroke(g, `M ${x0 + 80} ${y - 8} L ${x0 + 84} ${y - 20}`, '#151515', 0.4);
  for (const x of [x0 + 4, x0 + 88]) { fill(g, rect(x, y - 5, x + 4.4, y), '#d8d4c8'); stroke(g, `M ${x + 4.4} ${y - 4} C ${x + 6.4} ${y - 4} ${x + 6.4} ${y - 1.4} ${x + 4.4} ${y - 1.4}`, '#d8d4c8', 0.5); fill(g, rect(x, y - 5, x + 4.4, y - 4.4), '#3a2416'); }
  fill(g, poly([[x0 + 92, y], [x0 + 96, y - 7], [x0 + 99, y - 6.4], [x0 + 95, y]]), '#2a2c30');
  for (let k = 0; k < 4; k++) fill(g, rect(x0 + 50 + k * 1.6, y - 2.4, x0 + 50.8 + k * 1.6, y), '#c9a548');
  fill(g, ell(ASHTRAY[0], y - 0.8, 3, 0.9), '#6a6e72'); stroke(g, `M ${ASHTRAY[0] - 1} ${y - 1.2} L ${ASHTRAY[0] + 3} ${y - 2.4}`, '#e8e2d4', 0.5); fill(g, ell(ASHTRAY[0] + 3.1, y - 2.45, 0.3, 0.3), '#ff8a3a');
  // the chairs pulled out
  for (const [x, d] of [[x0 - 14, -1], [x1 + 4, 1]]) {
    fill(g, rect(x, -15, x + 10, -13), '#4a3624');
    stroke(g, `M ${x + (d < 0 ? 0 : 10)} -13 L ${x + (d < 0 ? 0 : 10)} -34 M ${x + (d < 0 ? 10 : 0)} -13 L ${x + (d < 0 ? 10 : 0)} 0 M ${x + (d < 0 ? 0 : 10)} -13 L ${x + (d < 0 ? 0 : 10)} 0`, '#3a2818', 1);
    fill(g, rect(x + (d < 0 ? -1 : 8), -34, x + (d < 0 ? 2 : 11), -24), '#4a3624');
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
    texture(g, 'wool', 0.6, 1.6);
  });
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
  stroke(g, `M 0 0 L 0 ${L - 4}`, '#151515', 0.4);
  fill(g, rect(-1, L - 5, 1, L - 3), '#3a3632');
  fill(g, poly([[-2.4, L - 3], [2.4, L - 3], [9, L + 3.4], [-9, L + 3.4]]), '#2f4a3a');
  fill(g, poly([[-2.4, L - 3], [0, L - 3], [-2, L + 3.4], [-9, L + 3.4]]), '#3e5e4a');
  fill(g, ell(0, L + 3.4, 9, 1.2), '#e8e2d0');
  fill(g, ell(0, L + 3.4, 2.4, 2.2), '#fff4dc');
}
export const LAMP_BULB = LAMP.len + 3.6;

// bake entries: the room and its floor in three pieces each, the table, the lamp
export function hideoutBakeList(scale) {
  const out = [];
  for (let i = 0; i < 3; i++) {
    const a = ROOM.x0 + i * 300, b = Math.min(ROOM.x1, a + 300);
    // a unit of overlap each side so the soft edges sit under the neighbour
    out.push({ name: `h.room${i}`, box: [a - 1, ROOM.top, b + 1, 0.5], scale, paint: room });
    out.push({ name: `h.floor${i}`, box: [a - 1, -0.5, b + 1, 42], scale, paint: floor });
  }
  out.push({ name: 'h.table', box: [TABLE.x0 - 16, -36, TABLE.x1 + 16, 0.5], scale, paint: table });
  out.push({ name: 'h.lamp', box: [-10, -1, 10, LAMP.len + 6], scale: scale * 1.5, paint: lamp });
  return out;
}
