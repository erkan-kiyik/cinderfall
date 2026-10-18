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
import { letters, lightbox, razor } from './city.js';
import { texture } from '../tex.js';

const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

export const COLS = 400, TOPY = -200, ROWS = 30, STREET = 25;
const CONC = mat(tone('#b7b7b0', '#8e8e87', '#676761', '#2f2f2b'), 'concrete', 0.7);
const STEEL = tone('#8a95a3', '#5d6878', '#3c4654', '#151a21');
const SYN = mat(tone('#a3acb9', '#78818e', '#565e6a', '#1e232a'), 'paint', 0.3);

// --- painters ------------------------------------------------------------------
// tall concrete barricade with a hazard band
export function concrete(g, x0, x1, h, o = {}) {
  const { kor = true, label = 'T-12' } = o;
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
    letters(g, label, x0 + 2.4, -h + 17, 2.2, 'rgba(240,242,244,0.7)', { kind: 'print', jit: 0 });
    // the cells were here: the ember sprayed low, where a patrol would not look
    if (kor) korMark(g, (x0 + x1) / 2, -12, Math.min(3, (x1 - x0) * 0.18), 0.8);
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
  // the two of them in there with the television on (its light is live), the
  // heater's flue on the roof breathing
  fill(g, rect(x0 + 24, -h + 23, x0 + 33, -h + 30), '#1a1c20'); fill(g, rect(x0 + 25, -h + 24, x0 + 32, -h + 28.6), '#b8d4ee');
  fill(g, rect(x0 + 27, -h + 30, x0 + 30, -h + 31), '#1a1c20');
  cel(g, rect(x1 - 12, -h - 14, x1 - 10, -h - 5), STEEL, { sh: 0.2, hl: 0.2, lw: 0.25 });
  for (let k = 0; k < 4; k++) fill(g, ell(x1 - 11 + k * k * 0.6, -h - 17 - k * 3.4, 1.2 + k * 0.8, 0.9 + k * 0.5), '#c9ccd2', 0.22 - k * 0.04);
}
export const BOOTH_TV = [28.5, -58 + 26.3];

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
// The city gate (docs §10.5): a steel portal round the opening (x0..x1,
// height h) with the white checkpoint sign across it, floodlights, a camera,
// a red LED line; T-walls topped with razor wire run off either side.
function tWall(g, x0, x1, h) {
  const B = poly([[x0 - 0.6, 0], [x0 - 0.6, -3], [x0 + 1.4, -6], [x0 + 1.4, -h + 2], [x0 + 3, -h], [x1 - 2, -h], [x1 - 1.4, -h + 1.2], [x1 - 1.4, -6], [x1 + 0.6, -3], [x1 + 0.6, 0]]);
  cel(g, B, CONC, { sh: 1.4, hl: 0.6, lw: 0.4 });
  clip(g, B, () => { fill(g, rect(x0 - 1, -6, x1 + 1, 0), CONC.d, 0.5); emblem(g, (x0 + x1) / 2, -h + 9, 2.6, 'rgba(240,242,244,0.8)'); fill(g, ell(x0 + 4.4, -h + 4, 1.2, 1.2), '#0f1116'); });
}
export function gateFrame(g, x0, x1, h, sign = ['KONTROL NOKTASI', 'DUR · KİMLİK HAZIRLAYIN']) {
  const S = mat(tone('#9aa3ad', '#6e7781', '#4d545d', '#1a1e23'), 'steel', 0.4);
  // the walls either side
  for (let k = 0; k < 5; k++) { tWall(g, x0 - 18 - k * 12, x0 - 6 - k * 12, 48); tWall(g, x1 + 6 + k * 12, x1 + 18 + k * 12, 48); }
  razor(g, x0 - 76, x0 - 6, -50.4); razor(g, x1 + 6, x1 + 76, -50.4);
  // the portal: two box columns, hazard paint at their feet
  for (const x of [x0 - 6, x1]) {
    const P = rect(x, -h - 14, x + 6, 0);
    cel(g, P, S, { sh: 1.2, hl: 0.5 });
    clip(g, P, () => { for (let y = -18; y < 0; y += 6) fill(g, poly([[x, y + 6], [x + 6, y], [x + 6, y + 3], [x + 3, y + 6]]), '#1a1c20'); fill(g, rect(x, -18, x + 6, 0), C.gold, 0.55); fill(g, rect(x + 4.6, -h - 14, x + 6, 0), '#000', 0.2); });
  }
  // the box girder and the sign hung on it
  const Bm = rect(x0 - 44, -h - 26, x1 + 44, -h - 14);
  cel(g, Bm, S, { sh: 0.8, hl: 0.4 });
  clip(g, Bm, () => { for (let x = x0 - 42; x < x1 + 44; x += 8) stroke(g, `M ${x} ${-h - 25} L ${x + 4} ${-h - 15} L ${x + 8} ${-h - 25}`, S.d, 0.5); });
  lightbox(g, x0 - 36, -h - 24.4, x1 + 36, -h - 15.4, sign[0]);
  fill(g, rect(x0 - 26, -h - 14, x1 + 26, -h - 9), '#a8232d');
  letters(g, sign[1], (x0 + x1) / 2, -h - 10.3, 3.3, '#f4ecec', { kind: 'print', align: 'center', jit: 0, track: 0.06 });
  for (const x of [x0 - 26, x1 + 26]) stroke(g, `M ${x} ${-h - 14} L ${x} ${-h - 9}`, '#1a1e23', 0.4);
  // red LED under it; floodlights and a camera on top
  fill(g, rect(x0 - 22, -h - 8.2, x1 + 22, -h - 7.2), '#ff2a35'); fill(g, rect(x0 - 22, -h - 7.9, x1 + 22, -h - 7.5), '#ffc9cc');
  for (const x of [(x0 + x1) / 2 - 30, (x0 + x1) / 2 + 30]) {
    fill(g, rect(x - 0.8, -h - 30, x + 0.8, -h - 26), '#2a2f36');
    fill(g, poly([[x - 4, -h - 30], [x + 4, -h - 30], [x + 3, -h - 27.4], [x - 3, -h - 27.4]]), '#3a3f47');
    fill(g, rect(x - 3, -h - 27.8, x + 3, -h - 27.2), '#f2f6ff');
  }
  const cx = (x0 + x1) / 2;
  fill(g, rect(cx - 0.6, -h - 32, cx + 0.6, -h - 26), '#2a2f36'); fill(g, poly([[cx - 4, -h - 34], [cx + 5, -h - 34.6], [cx + 5, -h - 30.6], [cx - 4, -h - 31]]), '#c9ced6'); fill(g, ell(cx - 3.4, -h - 32.4, 0.6, 0.6), '#14181d'); fill(g, ell(cx + 4, -h - 33.6, 0.4, 0.4), '#ff2a35');
}

// Docs §10.8: the gate itself, in Vanta's wall of containers: the steel posts
// round the opening (x0..x1, height h), containers stacked three high either
// side under razor wire, the lit sign across, one floodlight mast. No camera:
// "only eyes".
export function cityGate(g, x0, x1, h) {
  const S = mat(tone('#9aa3ad', '#6e7781', '#4d545d', '#1a1e23'), 'steel', 0.4);
  const BOX = mat(tone('#8a929e', '#5e6670', '#444a53', '#181b20'), 'paint', 0.5);
  for (const [a, b] of [[x0 - 76, x0 - 6], [x1 + 6, x1 + 76]]) {
    for (let j = 0; j < 3; j++) {
      const y1 = -j * 32, y0 = y1 - 32, B = rect(a, y0, b, y1);
      cel(g, B, BOX, { sh: 1.2, hl: 0.4, lw: 0.4 });
      clip(g, B, () => {
        for (let x = a + 2; x < b - 1; x += 2.6) { fill(g, rect(x, y0 + 1.6, x + 1, y1 - 1.6), BOX.d, 0.6); fill(g, rect(x + 1, y0 + 1.6, x + 1.4, y1 - 1.6), BOX.l, 0.3); }
        fill(g, rect(a, y0, b, y0 + 1.6), BOX.k, 0.6); fill(g, rect(a, y1 - 1.6, b, y1), BOX.k, 0.6);
        for (let i = 0; i < 3; i++) fill(g, rect(a + 8 + i * 21, y0 + 2, a + 8.8 + i * 21, y0 + 10 + i * 4), '#5a3018', 0.35);
      });
    }
    fill(g, rect(a, -40, b, -38), '#b3232e');
    letters(g, 'KONTROLLÜ BÖLGE', (a + b) / 2, -50, 4.2, '#e8ecf0', { kind: 'sten', align: 'center', jit: 0, a: 0.8 });
    emblem(g, (a + b) / 2, -78, 6, '#e8ecf0');
    razor(g, a, b, -98);
  }
  for (const x of [x0 - 6, x1]) {
    const P = rect(x, -h - 14, x + 6, 0);
    cel(g, P, S, { sh: 1.2, hl: 0.5 });
    clip(g, P, () => { for (let y = -18; y < 0; y += 6) fill(g, poly([[x, y + 6], [x + 6, y], [x + 6, y + 3], [x + 3, y + 6]]), '#1a1c20'); fill(g, rect(x, -18, x + 6, 0), C.gold, 0.55); fill(g, rect(x + 4.6, -h - 14, x + 6, 0), '#000', 0.2); });
  }
  const Bm = rect(x0 - 44, -h - 26, x1 + 44, -h - 14);
  cel(g, Bm, S, { sh: 0.8, hl: 0.4 });
  lightbox(g, x0 - 36, -h - 24.4, x1 + 36, -h - 15.4, 'KONTROL NOKTASI');
  fill(g, rect(x0 - 26, -h - 14, x1 + 26, -h - 9), '#a8232d');
  letters(g, 'DUR · KİMLİK HAZIRLAYIN', (x0 + x1) / 2, -h - 10.3, 3.3, '#f4ecec', { kind: 'print', align: 'center', jit: 0, track: 0.06 });
  // the floodlight mast on the near side, its head over the road
  const mx = x0 - 56;
  cel(g, rect(mx - 0.9, -h - 44, mx + 0.9, -98), S, { sh: 0.2, hl: 0.2, lw: 0.25 });
  cel(g, poly([[mx - 6, -h - 48], [mx + 6, -h - 48], [mx + 4.6, -h - 44], [mx - 4.6, -h - 44]]), S, { sh: 0.3, hl: 0.3, lw: 0.3 });
  fill(g, rect(mx - 4.4, -h - 44.4, mx + 4.4, -h - 43.6), '#f2f6ff');
  cel(g, rect(x1 + 60, -h - 30, x1 + 61.2, -98), POLE3, { sh: 0.2, hl: 0.2, lw: 0.25 });
  fill(g, poly([[x1 + 61.2, -h - 29], [x1 + 74, -h - 27.6], [x1 + 73, -h - 20], [x1 + 61.2, -h - 21]]), '#8e2330');
  emblem(g, x1 + 67, -h - 24.6, 2.2, '#f0dede');
}
export const GATE_LIGHT = (x0) => [x0 - 56, -96 - 44];
const POLE3 = tone('#c9ccd2', '#9aa0a8', '#6c727a', '#22262c');

// the red-and-white boom across the road by the hut, down; the post with its
// counterweight, the rest at the far end
export function boom(g, x, len = 44) {
  const S = mat(tone('#c9ccd2', '#9aa0a8', '#6c727a', '#22262c'), 'paint', 0.4);
  cel(g, rect(x - 3, -22, x + 3, 0), S, { sh: 0.6, hl: 0.3 });
  cel(g, rect(x - 4, -2, x + 4, 0), S, { sh: 0.3, hl: 0.2 });
  cel(g, rect(x + 2, -21, x + 9, -16), mat(tone('#6c727a', '#4c525a', '#363b42', '#14171a'), 'steel', 0.4), { sh: 0.3, hl: 0.2, lw: 0.3 });
  const A = rect(x - len, -20, x, -17.6);
  cel(g, A, tone('#f4f2ee', '#dcd8d0', '#b0aaa0', '#2a2826'), { sh: 0.3, hl: 0.3, lw: 0.3 });
  clip(g, A, () => { for (let k = x - len; k < x; k += 6) fill(g, poly([[k, -17.6], [k + 3, -17.6], [k + 5, -20], [k + 2, -20]]), '#b3232e'); });
  fill(g, ell(x - 2, -18.8, 0.7, 0.7), '#ff2a35');
  cel(g, poly([[x - len - 1, -17.6], [x - len + 1, -17.6], [x - len + 2.4, 0], [x - len - 2.4, 0]]), S, { sh: 0.2, hl: 0.2, lw: 0.25 });
  fill(g, rect(x - len - 2.4, -18.6, x - len + 2.4, -17.2), S.d);
}

// the rubber-tyred gantry crane in the container yard: yellow legs and
// tyres, the girder with the owner's name, the trolley and its cab; the deck
// you climb to is its sill walkway (drawn by catwalk)
export function rtg(g, x0, x1) {
  const Y = mat(tone('#e2c062', '#c09a38', '#8a6a1e', '#2e220a'), 'paint', 0.7);
  for (const lx of [x0 - 6, x1 + 2]) {
    cel(g, rect(lx, -140, lx + 4, -8), Y, { sh: 0.8, hl: 0.4 });
    for (let y = -132; y < -14; y += 14) stroke(g, `M ${lx + 4} ${y} L ${lx + (lx < x0 ? 10 : -6)} ${y + 12}`, Y.d, 0.8);
    cel(g, rect(lx - 4, -12, lx + 8, -6), Y, { sh: 0.4, hl: 0.3 });
    for (const wx of [lx - 1, lx + 5]) { cel(g, ell(wx, -3.4, 3.4, 3.4), mat(M.rubber, 'rubber', 0.5), { sh: 0.5, hl: 0.2 }); fill(g, ell(wx, -3.4, 1.4, 1.4), '#4a4e54'); }
  }
  const GB = rect(x0 - 12, -148, x1 + 12, -138);
  cel(g, GB, Y, { sh: 0.8, hl: 0.4 });
  clip(g, GB, () => { for (let x = x0 - 10; x < x1 + 12; x += 8) stroke(g, `M ${x} -147 L ${x + 4} -139 L ${x + 8} -147`, Y.d, 0.5); });
  letters(g, 'VNTU · LİMAN', (x0 + x1) / 2, -140.6, 5, '#2a2010', { kind: 'sten', align: 'center', jit: 0, a: 0.8 });
  const tx = x0 + (x1 - x0) * 0.62;
  cel(g, rect(tx - 10, -138, tx + 10, -130), Y, { sh: 0.4, hl: 0.3 });
  cel(g, rect(tx - 7, -130, tx + 5, -118), Y, { sh: 0.6, hl: 0.3 });
  fill(g, rect(tx - 6, -128, tx + 4, -122), '#1a2028'); fill(g, rect(tx - 6, -128, tx - 2, -122), '#ffc27a', 0.5);
  for (const sx of [tx - 4, tx + 4]) stroke(g, `M ${sx} -130 L ${sx} -112`, '#1a1c20', 0.3);
  cel(g, rect(tx - 12, -112, tx + 12, -109), Y, { sh: 0.3, hl: 0.2 });
}

// an industrial lamp on the port road: galvanised, an outreach arm, a sodium
// floodlight head (no loudspeaker out here); the head where the city lamp's is
export function portLamp(g, x, h = 82) {
  const G = mat(tone('#b8bec4', '#8c9298', '#666c72', '#22262a'), 'steel', 0.5);
  cel(g, poly([[x - 1.6, 0], [x - 1, -h - 2], [x + 1, -h - 2], [x + 1.6, 0]]), G, { sh: 0.8, hl: 0.3 });
  cel(g, rect(x - 3, -6, x + 3, 0), G, { sh: 0.4, hl: 0.3 });
  cel(g, poly([[x, -h - 1], [x + 14, -h - 1], [x + 14, -h + 0.6], [x, -h + 0.6]]), G, { sh: 0.3, hl: 0.2, lw: 0.3 });
  stroke(g, `M ${x} ${-h + 8} L ${x + 9} ${-h + 0.6}`, G.d, 0.5);
  cel(g, poly([[x + 8, -h - 1.6], [x + 22, -h - 1.6], [x + 21, -h + 2.8], [x + 9, -h + 2.8]]), G, { sh: 0.5, hl: 0.3 });
  fill(g, rect(x + 9.6, -h + 2.2, x + 20.4, -h + 3.2), '#ffc27a');
  fill(g, rect(x - 1.2, -40, x + 1.2, -38), '#e8c43a'); fill(g, rect(x - 1.2, -38, x + 1.2, -36), '#1a1810');
}

// the port's apron, laid over the street outside the gate: big concrete
// panels, a faded yellow lane line, tyre tracks (flat, under everything)
export const APRON_W = 96;
export function apron(g) {
  let sd = 11; const r = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
  fill(g, rect(-0.5, -0.5, APRON_W + 0.5, 42), '#3e4048');
  const rows = [0, 4, 10, 18, 28, 42];
  for (let i = 0; i < rows.length - 1; i++) {
    const y0 = rows[i], y1 = rows[i + 1], sw = 32;
    for (let x = (i % 2) * 16 - 16; x < APRON_W; x += sw) {
      fill(g, rect(x + 0.3, y0 + 0.25, x + sw - 0.3, y1 - 0.25), r() < 0.5 ? '#474952' : '#43454d');
      if (r() < 0.25) stroke(g, `M ${x + sw * 0.2} ${y0 + 0.4} l ${sw * 0.2} ${(y1 - y0) * 0.6}`, '#2a2c32', 0.3);
    }
  }
  fill(g, rect(-0.5, 13.4, APRON_W + 0.5, 14.8), '#a8903a', 0.5);
  for (const y of [22.4, 26.6]) { fill(g, rect(-0.5, y, APRON_W + 0.5, y + 1.4), '#2a2c32', 0.45); for (let x = 0; x < APRON_W; x += 2.2) fill(g, rect(x, y + 0.2, x + 0.8, y + 1.2), '#22242a', 0.5); }
  clip(g, rect(-0.5, -0.5, APRON_W + 0.5, 42), () => texture(g, 'concrete', 0.5, 1.6));
  fill(g, rect(-0.5, 0, APRON_W + 0.5, 0.6), '#7a7c86', 0.5);
  fill(g, rect(-0.5, 36, APRON_W + 0.5, 42), '#000', 0.2);
}

// The old council sign on the way in, HOŞ GELDİNİZ; the name of the city
// under it hidden by Vanta's sticker
export function welcomeSign(g, x) {
  const S = tone('#8a929a', '#646c74', '#474e55', '#181b1f');
  for (const px of [x - 14, x + 13]) cel(g, rect(px, -36, px + 1.4, 0), S, { sh: 0.3, hl: 0.2, lw: 0.3 });
  const B = rect(x - 20, -48, x + 20, -32);
  cel(g, B, mat(tone('#4f78a8', '#2f5a8c', '#1f4068', '#0c1a2c'), 'paint', 0.8), { sh: 0.6, hl: 0.3 });
  clip(g, B, () => {
    stroke(g, rect(x - 19, -47, x + 19, -33), '#d9dde2', 0.4, 0.8);
    letters(g, 'HOŞ GELDİNİZ', x, -42.4, 4.4, '#e6e9ec', { kind: 'print', align: 'center', jit: 0, track: 0.06 });
    fill(g, rect(x - 15, -40.6, x + 15, -35), '#e4e3df');
    fill(g, rect(x - 15, -40.6, x + 15, -39.4), '#a8232d');
    letters(g, 'KONTROLLÜ BÖLGE', x, -36.2, 2.8, '#1d2129', { kind: 'print', align: 'center', jit: 0 });
    for (let i = 0; i < 7; i++) fill(g, ell(x - 18 + i * 6.2, -47 + (i % 3) * 5, 0.8, 0.5), '#6a3a1e', 0.6);
  });
}

// Vanta's road sign: white, red border, three short lines
export function roadSign(g, x, lines) {
  const S = tone('#8a929a', '#646c74', '#474e55', '#181b1f');
  cel(g, rect(x - 0.7, -30, x + 0.7, 0), S, { sh: 0.3, hl: 0.2, lw: 0.3 });
  const B = rect(x - 10, -44, x + 10, -28);
  cel(g, B, tone('#ffffff', '#e8eaec', '#c9ccd0', '#2a2d32'), { sh: 0.4, hl: 0.2 });
  stroke(g, rect(x - 9, -43, x + 9, -29), '#b3232e', 1.1);
  lines.forEach((t, i) => letters(g, t, x, -38.8 + i * 4.2, 3.3, '#1d2129', { kind: 'print', align: 'center', jit: 0 }));
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
  P('m.welcome', [X(12) - 22, -50, X(12) + 22, 1], (g) => welcomeSign(g, X(12)), deco);
  block(22, 23, 1, 2); P('m.crateA', [X(22) - 2, -18, X(24) + 2, 1], (g) => crate(g, X(22), 16, 16));
  block(34, 42, 5, 6); P('m.duct', [X(34) - 16, -50, X(43) + 16, 1], (g) => duct(g, X(34), X(43), -48, -32));
  for (let c = 50; c <= 53; c++) for (let r = STREET; r < STREET + 4; r++) g[r][c] = '.';
  P('m.pit', [X(50) - 8, -11, X(54) + 8, 33], (g) => pit(g, X(50), X(54), 32));
  P('m.cone1', [X(46) - 6, -12, X(46) + 8, 1], (g) => cone(g, X(46)), deco);
  // B — checkpoint post -------------------------------------------------------------
  P('m.roadSign', [X(66) - 12, -46, X(66) + 12, 1], (g) => roadSign(g, X(66), ['KONTROL', 'NOKTASI', 'YAVAŞLA']), deco);
  bar('m.barB1', 72, 75, 4, '#3ee8e0');
  block(86, 89, 1, 2); P('m.barB', [X(86) - 4, -18, X(90) + 4, 1], (g) => barrier(g, X(86) + 1, 30), front);
  P('m.booth', [X(104) - 4, -84, X(104) + 48, 1], (g) => booth(g, X(104)), deco);
  glows.push([X(104) + BOOTH_TV[0], BOOTH_TV[1], 5, 4, '#b8d4ff', 0.5, 'tv']);
  lights.push([X(104) + BOOTH_TV[0], BOOTH_TV[1] + 4, 30, 0.45, [0.6, 0.75, 1], 'tv']);
  P('m.boom', [X(103) - 50, -24, X(103) + 12, 1], (g) => boom(g, X(103), 46), deco);
  block(100, 101, 1, 5); P('m.concB', [X(100) - 1, -42, X(102) + 1, 1], (g) => concrete(g, X(100), X(102), 40));
  bar('m.barB2', 116, 119, 4, '#ff3347');
  P('m.barrelB', [X(124) - 2, -16, X(124) + 14, 1], (g) => burnBarrel(g, X(124)), deco);
  // C — container yard -----------------------------------------------------------------
  block(140, 149, 1, 5); P('m.contA', [X(140) - 2, -42, X(150) + 2, 1], (g) => container(g, X(140), -40, X(150), 0, CONT.teal, { code: 'MSKU 704410 2', kor: true }));
  block(160, 180, 12, 12, '='); block(159, 159, 1, 12, 'H');
  P('m.rtg', [X(160) - 18, -150, X(181) + 16, 1], (g) => rtg(g, X(160), X(181)), deco);
  lights.push([X(160) + 120, -124, 30, 0.3, [1, 0.7, 0.4]]);
  P('m.deck', [X(160) - 2, -114, X(181) + 2, -78], (g) => catwalk(g, X(160), X(181), -96));
  P('m.ladder', [X(159) - 1, -112, X(160) + 1, 1], (g) => ladder(g, X(159), -96, 0));
  block(190, 191, 1, 2); P('m.crateC', [X(190) - 2, -18, X(192) + 2, 1], (g) => crate(g, X(190), 16, 16));
  block(205, 214, 1, 5); block(209, 214, 6, 10);
  P('m.contB', [X(205) - 2, -42, X(215) + 2, 1], (g) => container(g, X(205), -40, X(215), 0, CONT.navy, { code: 'VNTU 482116 1' }));
  P('m.contC', [X(209) - 2, -82, X(215) + 2, -39], (g) => container(g, X(209), -80, X(215), -40, CONT.rust, { code: 'TGHU 30129' }));
  P('m.dumpC', [X(220) - 4, -24, X(220) + 48, 1], (g) => dumpster(g, X(220)), deco);
  // D — gate court ----------------------------------------------------------------------
  block(246, 247, 1, 5); P('m.concD1', [X(246) - 1, -42, X(248) + 1, 1], (g) => concrete(g, X(246), X(248), 40));
  block(274, 275, 1, 5); P('m.concD2', [X(274) - 1, -42, X(276) + 1, 1], (g) => concrete(g, X(274), X(276), 40));
  bar('m.barD', 294, 297, 4, '#ff3fa4');
  P('m.term', [X(312) - 9, -28, X(312) + 18, 1], (g) => terminal(g, X(312)));
  block(322, 323, 1, 12);
  P('m.gateFrame', [X(322) - 78, -150, X(324) + 78, 1], (g) => cityGate(g, X(322), X(324), 96), deco);
  const [gx, gy] = GATE_LIGHT(X(322));
  lights.push([gx + 10, gy + 30, 120, 0.75, [0.9, 0.95, 1]], [X(323), -116, 60, 0.4, [0.9, 0.95, 1]]);
  glows.push([gx, gy + 0.2, 6, 2.4, '#f2f6ff', 0.7], [X(323), -113, 36, 5, '#e8f0ff', 0.3]);
  P('m.coneD', [X(286) - 6, -12, X(286) + 8, 1], (g) => cone(g, X(286)), deco);
  // E — extraction -----------------------------------------------------------------------
  block(350, 351, 1, 2); P('m.crateE', [X(350) - 2, -18, X(352) + 2, 1], (g) => crate(g, X(350), 16, 16));
  // the cells hold the extraction: their own barricade, no light
  block(362, 364, 1, 4); P('m.barE', [X(362) - 4, -4 * T - 8, X(365) + 8, 1], (g) => scrapBarricade(g, X(362), X(365), 4 * T), front);
  P('m.beacon', [X(387) - 5, -28, X(387) + 5, 1], (g) => beacon(g, X(387)), deco);
  // checkpoint posts
  const checkpoints = [{ x: X(60) }, { x: X(228) }, { x: X(316) }];
  checkpoints.forEach((c, i) => P(`m.cp${i}`, [c.x - 5, -24, c.x + 5, 1], (g) => cpPost(g, c.x), deco));
  // outside the gate the port's lamps, inside the city's
  const outside = [130, 520, 1000, 1600, 2100, 2450], inside = [2750, 3050];
  lamps.push(...outside, ...inside);
  deco.push({ name: 'm.portLamp', box: [-8, -88, 24, 1], paint: (g) => portLamp(g, 0), at: outside });
  deco.push({ name: 'c.lamp', box: [-8, -86, 24, 1], paint: (g) => lampPost(g, 0), at: inside });
  // the port's apron up to the gate; the city's street after it
  const floor = [{ name: 'm.apron', box: [-0.5, -0.5, APRON_W + 0.5, 42], paint: apron, at: Array.from({ length: Math.ceil(X(322) / APRON_W) }, (_, k) => k * APRON_W) }];

  const level = new Level(g.map((r) => r.join('')), TOPY);
  const E = (id, x, y, zone, o = {}) => ({ id, kind: id, x, y, zone, facing: -1, ...o });
  return {
    id: 'm1', level, props, front, deco, lamps, glows, lights, floor, width: COLS * T, par: 300,
    // docs §10.8: the port road outside (warehouses, the customs house,
    // containers), Vanta's container wall to the gate; inside, the city
    facade: [
      ['antrepo', -10], ['gumruk', 170], ['warehouse', 310], ['stack', 474], ['synBlock', 594], ['antrepo', 744], ['stack', 924],
      ['stack', 1044], ['antrepo', 1164], ['stack', 1344], ['warehouse', 1464], ['stack', 1628],
      ...[0, 1, 2, 3, 4].map((k) => ['wallC', 1748 + k * 160]),
      ['walkupB', 2620], ['crow', 2748], ['alley', 2908], ['teahouse', 2942], ['walkup', 3038], ['walkupB', 3188],
    ].map(([type, x]) => ({ type, x })),
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
