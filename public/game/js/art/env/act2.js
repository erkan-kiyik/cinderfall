// KOR — act 2, "Derinlik" (docs §10.30): missions 4 to 7, from the story
// bible (§1.5). Built like missions 1–3: every feature sits in tile columns
// and is painted in the same box, so what you see is what you collide with.
//
//   m4  Dökümhane      the foundry yard; the records of the disappeared are in
//                      its archive: open the gate, hold while Vesper copies them
//   m5  Metro          the old elevated line: along the dead platform, open the
//                      line's gate at the tunnel and go in under the city
//   m6  Dron Fabrikası the north depots: the container yard, the factory gate,
//                      hold while the drone line is burnt out
//   m7  Ocak           the blast furnace: past the hot stoves, the furnace
//                      control, hold the cast house while the furnace is lit
//                      again, four years after the Quench
import { cel, fill, stroke, clip, rng } from '../kit.js';
import { M, tone, mat } from '../style.js';
import { texture } from '../tex.js';
import { Level, T } from '../../phys/level.js';
import { crate, lampPost, burnBarrel, dumpster, cone, korMark } from './street.js';
import { catwalk, ladder, barricade, scrapBarricade, container, CONT } from './course.js';
import { concrete, beacon, cpPost, terminal, gateFrame, rtg, portLamp, roadSign } from './mission1.js';
import { scaffold } from './mission2.js';
import { BUILDINGS, letters } from './city.js';

const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

const COLS = 400, TOPY = -200, ROWS = 30, STREET = 25;
const IRON = mat(tone('#7a6e66', '#544a44', '#3a322e', '#140f0d'), 'steel', 0.6);
const STEEL = mat(tone('#9aa2ae', '#6e7682', '#4c535d', '#1a1e23'), 'steel', 0.45);
const BRICK = mat(tone('#9a5a44', '#7a4232', '#562c22', '#1e0f0b'), 'paint', 0.5);
const CONC = mat(tone('#a8a49c', '#86827a', '#625e58', '#22201d'), 'concrete', 0.7);
const SOOT = 'rgba(16,12,10,';

// rust run down from an edge in tapering streaks
function rust(g, x0, x1, y, h, seed, a = 0.5) {
  const r = rng(seed);
  for (let i = 0; i < (x1 - x0) / 5; i++) {
    const x = x0 + r() * (x1 - x0), L = h * (0.3 + r() * 0.7), w = 0.5 + r() * 0.9;
    const st = g.createLinearGradient(0, y, 0, y + L);
    st.addColorStop(0, `rgba(112,54,24,${a})`); st.addColorStop(1, 'rgba(112,54,24,0)');
    fill(g, poly([[x, y], [x + w, y], [x + w * 0.6, y + L], [x + w * 0.3, y + L]]), st);
  }
}
// rivets along a line
const rivets = (g, x0, x1, y, step, c) => { for (let x = x0; x <= x1; x += step) fill(g, ell(x, y, 0.45, 0.45), c); };

// --- m4: the foundry ------------------------------------------------------------
// a casting ladle on its cradle: the banded steel shell, the refractory lip
// crusted with slag, the trunnion pins, rust run down from the rim; cold since
// the Quench, its number stencilled on
export function ladle(g, x, n = 3) {
  for (const lx of [x + 1, x + 41]) cel(g, poly([[lx, 0], [lx + 6, 0], [lx + 5, -30], [lx + 1, -30]]), IRON, { sh: 0.6, hl: 0.3 });
  cel(g, rect(x - 1, -32, x + 49, -28), IRON, { sh: 0.4, hl: 0.3 });
  const B = `M ${x + 3} -62 L ${x + 45} -62 C ${x + 44} -50 ${x + 42} -40 ${x + 38} -32 C ${x + 30} -29 ${x + 18} -29 ${x + 10} -32 C ${x + 6} -40 ${x + 4} -50 ${x + 3} -62 Z`;
  cel(g, B, IRON, { sh: 1.6, hl: 0.5 });
  clip(g, B, () => {
    for (const y of [-56, -44, -36]) { fill(g, rect(x, y, x + 48, y + 2.2), IRON.d); fill(g, rect(x, y, x + 48, y + 0.5), IRON.l, 0.5); rivets(g, x + 5, x + 44, y + 1.1, 3, IRON.k); }
    rust(g, x + 3, x + 45, -62, 30, n * 17, 0.55);
    texture(g, 'steel', 0.5, 1.4);
    fill(g, rect(x + 30, -62, x + 46, -28), `${SOOT}0.35)`);
    letters(g, `POTA ${n}`, x + 22, -46.6, 4.4, 'rgba(232,226,214,0.7)', { kind: 'sten', align: 'center', jit: 0.02 });
  });
  stroke(g, B, IRON.k, 0.5);
  // the lip: refractory brick, a slag crust running over it
  const L = rect(x + 1, -65, x + 47, -61);
  cel(g, L, BRICK, { sh: 0.4, hl: 0.3 });
  const r = rng(n * 31);
  for (let i = 0; i < 9; i++) { const sx = x + 3 + r() * 42, sl = 2 + r() * 6; fill(g, `M ${sx} -61.4 Q ${sx + 1.2} ${-61 + sl} ${sx + 2.4} -61.4 Z`, '#5a5650', 0.85); fill(g, ell(sx + 1.2, -61 + sl * 0.7, 0.7, 0.5), '#8a8680', 0.6); }
  for (const px of [x + 1, x + 47]) { cel(g, ell(px, -48, 3, 3), STEEL, { sh: 0.4, hl: 0.4 }); fill(g, ell(px, -48, 1.2, 1.2), STEEL.k); }
  // the hook's bail, up into the dark
  stroke(g, `M ${x + 1} -48 C ${x + 2} -76 ${x + 46} -76 ${x + 47} -48`, '#2a2622', 1.6);
  stroke(g, `M ${x + 1} -48 C ${x + 2} -75.4 ${x + 46} -75.4 ${x + 47} -48`, 'rgba(160,150,140,0.35)', 0.4);
}

// ingot moulds stacked on a pallet: rough cast-iron boxes, rust at the rims
export function moulds(g, x) {
  cel(g, rect(x - 1, -3, x + 33, 0), mat(tone('#8a6a48', '#6a5034', '#4a3824', '#1a120a'), 'wood', 0.7), { sh: 0.3, hl: 0.2 });
  for (let k = 0; k < 3; k++) {
    const y = -3 - (k + 1) * 6, dx = k % 2 ? 2 : 0, B = rect(x + dx, y, x + 30 + dx, y + 6);
    cel(g, B, IRON, { sh: 0.6, hl: 0.3 });
    clip(g, B, () => { fill(g, rect(x + dx + 3, y + 1.4, x + 27 + dx, y + 4.4), IRON.k, 0.5); rust(g, x + dx, x + 30 + dx, y, 6, k * 7 + x, 0.45); texture(g, 'steel', 0.45, 1); });
    stroke(g, B, IRON.k, 0.35);
  }
}

// a slag heap: dark glassy lumps, grey dust over them, a rusty barrow
export function slag(g, x) {
  const r = rng(x | 0), H = `M ${x} 0 C ${x + 6} -10 ${x + 16} -16 ${x + 26} -15 C ${x + 36} -14 ${x + 44} -8 ${x + 52} 0 Z`;
  cel(g, H, mat(tone('#5a5650', '#3e3b37', '#2a2825', '#0e0d0c'), 'concrete', 0.8), { sh: 1.2, hl: 0.3 });
  clip(g, H, () => {
    for (let i = 0; i < 26; i++) { const lx = x + 4 + r() * 44, ly = -r() * 14, s = 1 + r() * 2.4; fill(g, ell(lx, ly, s, s * 0.7), r() < 0.5 ? '#1e1c1a' : '#4a4640', 0.8); fill(g, ell(lx - s * 0.3, ly - s * 0.3, s * 0.35, s * 0.2), 'rgba(200,210,220,0.35)'); }
    texture(g, 'concrete', 0.5, 1.4);
  });
  // a barrow of it, left where it stopped
  cel(g, poly([[x + 50, -10], [x + 64, -10], [x + 61, -4], [x + 52, -4]]), mat(tone('#8a5a3a', '#6a4028', '#4a2a1a', '#160a06'), 'steel', 0.6), { sh: 0.4, hl: 0.2, lw: 0.3 });
  cel(g, ell(x + 56, -2.4, 2.4, 2.4), mat(M.rubber, 'rubber', 0.5), { sh: 0.3, hl: 0.2, lw: 0.3 });
  stroke(g, `M ${x + 62} -9 L ${x + 70} -6`, '#3a2a1e', 0.7);
}

// --- m5: the old line -------------------------------------------------------------
// the elevated line's viaduct over the street, in two parts so the atlas
// holds little of it: one concrete pier (drawn at every pier's place), and the
// deck at y with its parapet and rails
export const PIER_STEP = 64;
export function pier(g, y) {
  const P0 = poly([[-6, 0], [6, 0], [5, y + 10], [-5, y + 10]]);
  cel(g, P0, CONC, { sh: 1.0, hl: 0.4 });
  clip(g, P0, () => { rust(g, -6, 6, y + 10, -y * 0.6, 3, 0.25); texture(g, 'concrete', 0.6, 1.2); fill(g, rect(-6, -14, 6, 0), `${SOOT}0.25)`); });
  cel(g, poly([[-9, y + 4], [9, y + 4], [6, y + 12], [-6, y + 12]]), CONC, { sh: 0.5, hl: 0.3 });
}
export function viaduct(g, x0, x1, y) {
  const D = rect(x0, y, x1, y + 6);
  cel(g, D, CONC, { sh: 0.8, hl: 0.5 });
  clip(g, D, () => { fill(g, rect(x0, y + 4.6, x1, y + 6), `${SOOT}0.4)`); rust(g, x0, x1, y + 6, 4, 9, 0.3); texture(g, 'concrete', 0.5, 1); });
  // the platform's edge: a faded yellow line, the rails behind it on their sleepers
  fill(g, rect(x0, y - 0.6, x1, y + 0.2), '#b89a3a', 0.55);
  for (let x = x0 + 2; x < x1; x += 5) fill(g, rect(x, y - 2.2, x + 3, y - 1.2), '#3a2a1e', 0.7);
  for (const ry of [y - 2.8, y - 3.6]) fill(g, rect(x0, ry, x1, ry + 0.5), '#6a6460');
  // the parapet behind, low, its coping chipped
  cel(g, rect(x0, y - 12, x1, y - 9), CONC, { sh: 0.3, hl: 0.3 });
}

// an old metro car left on the line since the power was cut: the body's
// faded stripe, the doors, the dark windows (one lit by a torch inside), the
// bogies; somebody has sprayed the cells' mark on it
export function metroCar(g, x, y) {
  const W = 132, B = `M ${x} ${y - 4} L ${x} ${y - 32} C ${x} ${y - 37} ${x + 4} ${y - 39} ${x + 10} ${y - 39} L ${x + W - 10} ${y - 39} C ${x + W - 4} ${y - 39} ${x + W} ${y - 37} ${x + W} ${y - 32} L ${x + W} ${y - 4} Z`;
  const BODY = mat(tone('#c8ccd0', '#9aa0a6', '#6e747a', '#22262a'), 'paint', 0.5);
  for (const bx of [x + 18, x + W - 30]) { cel(g, rect(bx, y - 6, bx + 14, y - 1), STEEL, { sh: 0.3, hl: 0.2 }); for (const wx of [bx + 3, bx + 11]) { cel(g, ell(wx, y - 2.6, 2.6, 2.6), STEEL, { sh: 0.4, hl: 0.2 }); fill(g, ell(wx, y - 2.6, 1, 1), STEEL.k); } }
  cel(g, B, BODY, { sh: 1.4, hl: 0.6 });
  clip(g, B, () => {
    fill(g, rect(x, y - 13, x + W, y - 9), '#b3232e', 0.75); fill(g, rect(x, y - 9, x + W, y - 8.2), '#e8e2d6', 0.6);
    for (let k = 0; k < 4; k++) {
      const dx = x + 8 + k * 32;
      fill(g, rect(dx, y - 33, dx + 7, y - 4), BODY.d); fill(g, rect(dx + 0.6, y - 32, dx + 6.4, y - 20), '#141a20');
      for (const wx of [dx + 10, dx + 19]) { fill(g, rect(wx, y - 32, wx + 8, y - 20), '#121820'); fill(g, rect(wx, y - 32, wx + 8, y - 30.6), 'rgba(170,190,210,0.25)'); }
    }
    // a torch lit behind one window: the cells use the car as a post
    const lw = x + 8 + 32 + 10, lg = g.createRadialGradient(lw + 4, y - 25, 0, lw + 4, y - 25, 9);
    lg.addColorStop(0, 'rgba(255,214,150,0.75)'); lg.addColorStop(1, 'rgba(255,214,150,0)'); fill(g, rect(lw, y - 32, lw + 8, y - 20), lg);
    rust(g, x, x + W, y - 20, 14, 5, 0.35);
    fill(g, rect(x, y - 39, x + W, y - 34), 'rgba(170,186,206,0.18)');
    texture(g, 'steel', 0.45, 1.2);
    fill(g, rect(x, y - 8, x + W, y - 4), `${SOOT}0.4)`);
  });
  stroke(g, B, BODY.k, 0.5);
  korMark(g, x + W - 18, y - 14.6, 3.4, 0.85);
  letters(g, '3', x + W - 6, y - 30, 5, '#e8e2d6', { kind: 'print', align: 'center', jit: 0, a: 0.8 });
}

// the station's sign on the platform: the lightbox, its post, the line's number
export function stationSign(g, x, y) {
  cel(g, rect(x - 0.8, y - 34, x + 0.8, y), STEEL, { sh: 0.3, hl: 0.2, lw: 0.3 });
  const S = rect(x - 16, y - 44, x + 16, y - 35);
  cel(g, S, tone('#f0ece2', '#d9d4c6', '#b0aa9a', '#2a2822'), { sh: 0.4, hl: 0.3, lw: 0.3 });
  clip(g, S, () => { fill(g, rect(x - 16, y - 44, x + 16, y - 42.4), '#b3232e'); fill(g, rect(x - 16, y - 36.2, x + 16, y - 35), '#2a2822', 0.4); rust(g, x - 16, x + 16, y - 42.4, 5, 3, 0.3); });
  letters(g, 'METRO', x, y - 37.2, 4.6, '#1d2129', { kind: 'print', align: 'center', jit: 0, track: 0.12 });
  const B = rect(x - 10, y - 33, x + 10, y - 27);
  cel(g, B, tone('#2f5a8c', '#244a74', '#1a3656', '#0a1420'), { sh: 0.3, hl: 0.2, lw: 0.3 });
  letters(g, '3. PERON', x, y - 28.6, 3.2, '#f0ece2', { kind: 'print', align: 'center', jit: 0 });
}

// the tunnel's mouth under the line: the portal's ring of concrete, the dark
// going in, the old signal on its bracket
export function tunnelMouth(g, x0, x1) {
  const R = `M ${x0 - 14} 0 L ${x0 - 14} -84 C ${x0 - 14} -112 ${x1 + 14} -112 ${x1 + 14} -84 L ${x1 + 14} 0 L ${x1 + 2} 0 L ${x1 + 2} -82 C ${x1 + 2} -100 ${x0 - 2} -100 ${x0 - 2} -82 L ${x0 - 2} 0 Z`;
  const inner = `M ${x0 - 2} 0 L ${x0 - 2} -82 C ${x0 - 2} -100 ${x1 + 2} -100 ${x1 + 2} -82 L ${x1 + 2} 0 Z`;
  const dark = g.createLinearGradient(x0, 0, x1, 0); dark.addColorStop(0, '#0c0d10'); dark.addColorStop(1, '#040506');
  fill(g, inner, dark);
  cel(g, R, CONC, { sh: 1.4, hl: 0.5 });
  clip(g, R, () => { rust(g, x0 - 14, x1 + 14, -100, 60, 7, 0.3); texture(g, 'concrete', 0.6, 1.2); for (let a = 0.15; a < 3.0; a += 0.32) { const cx = (x0 + x1) / 2, rx = (x1 - x0) / 2 + 8; stroke(g, `M ${cx - Math.cos(a) * rx} ${-82 - Math.sin(a) * 22} L ${cx - Math.cos(a) * (rx + 12)} ${-84 - Math.sin(a) * 28}`, CONC.d, 0.35, 0.7); } });
  // the signal: red, dead
  cel(g, rect(x1 + 16, -70, x1 + 22, -56), STEEL, { sh: 0.3, hl: 0.2 });
  for (const sy of [-67, -61]) { fill(g, ell(x1 + 19, sy, 1.8, 1.8), '#141618'); fill(g, ell(x1 + 19, sy, 1.1, 1.1), sy < -64 ? '#5a1414' : '#143a1c'); }
  stroke(g, `M ${x1 + 14} -64 L ${x1 + 16} -64`, STEEL.d, 0.8);
}

// --- m6: the drone factory -------------------------------------------------------
// Vanta's drones on a steel rack, three shelves of quadcopters with their
// arms folded, a charge light at each; a stencilled rack number
export function droneRack(g, x) {
  const W = 46, S = mat(tone('#5a6270', '#424a56', '#2e343e', '#0e1116'), 'steel', 0.5);
  for (const px of [x, x + W - 2]) cel(g, rect(px, -62, px + 2, 0), S, { sh: 0.3, hl: 0.2, lw: 0.3 });
  for (const y of [-60, -40, -20]) {
    cel(g, rect(x - 1, y, x + W + 1, y + 2), S, { sh: 0.3, hl: 0.2, lw: 0.3 });
    for (let k = 0; k < 3; k++) {
      const cx = x + 8 + k * 15, cy = y - 4;
      const D = mat(tone('#3a4048', '#2a2f36', '#1e2228', '#08090b'), 'paint', 0.3);
      cel(g, poly([[cx - 5, cy + 3], [cx + 5, cy + 3], [cx + 4, cy - 1], [cx - 4, cy - 1]]), D, { sh: 0.4, hl: 0.4, lw: 0.25 });
      for (const ax of [-1, 1]) { stroke(g, `M ${cx + ax * 4} ${cy} L ${cx + ax * 6.4} ${cy - 1.6}`, D.l, 0.5); fill(g, rect(cx + ax * 6.4 - 1.4, cy - 2.2, cx + ax * 6.4 + 1.4, cy - 1.6), '#5a6270'); }
      fill(g, rect(cx - 1.4, cy + 1, cx + 1.4, cy + 2.4), '#0a0c0e'); fill(g, ell(cx, cy + 1.7, 0.6, 0.6), '#b3232e');
      fill(g, ell(cx + 3, cy + 0.4, 0.35, 0.35), k === 1 && y === -40 ? '#3aff6a' : '#ff3a3a', 0.9);
    }
  }
  letters(g, `R-${(x / 8) | 0}`, x + W / 2, -63.4, 2.8, '#d8d4c8', { kind: 'sten', align: 'center', jit: 0, a: 0.7 });
}

// a conveyor of drone shells: the belt on its frame, the rollers, the shells
// riding it; waist-high, to fight from behind
export function conveyor(g, x0, x1) {
  const S = mat(tone('#c8a83a', '#a08428', '#78621a', '#2a2008'), 'paint', 0.6);
  for (let x = x0 + 3; x < x1; x += 22) cel(g, rect(x, -12, x + 2.4, 0), S, { sh: 0.3, hl: 0.2, lw: 0.3 });
  cel(g, rect(x0, -16, x1, -12), S, { sh: 0.4, hl: 0.3 });
  fill(g, rect(x0 + 1, -18, x1 - 1, -16), '#1a1c1e');
  for (let x = x0 + 2; x < x1 - 1; x += 3) fill(g, rect(x, -17.6, x + 1.2, -16.6), '#2e3236');
  for (let x = x0 + 6; x < x1 - 8; x += 17) {
    const D = mat(tone('#4a5058', '#363b42', '#262a30', '#0b0c0e'), 'paint', 0.3);
    cel(g, poly([[x, -18], [x + 10, -18], [x + 9, -22], [x + 1, -22]]), D, { sh: 0.4, hl: 0.4, lw: 0.25 });
    fill(g, ell(x + 5, -20.4, 0.5, 0.5), '#b3232e');
  }
  clip(g, rect(x0, -16, x1, -12), () => { for (let x = x0; x < x1; x += 6) fill(g, poly([[x, -12], [x + 3, -12], [x + 5, -16], [x + 2, -16]]), '#1a1810', 0.8); });
}

// --- m7: the furnace --------------------------------------------------------------
// a hot-blast stove: the tall riveted cylinder with its dome, the bands, the
// valve platform, the pipe off to the furnace at hot-blast height
export function hotStove(g, x, h = 168) {
  const W = 34, S = mat(tone('#8a7a6e', '#62564c', '#443a32', '#161210'), 'steel', 0.6);
  const B = `M ${x} 0 L ${x} ${-h + 14} C ${x} ${-h - 4} ${x + W} ${-h - 4} ${x + W} ${-h + 14} L ${x + W} 0 Z`;
  cel(g, B, S, { sh: 1.8, hl: 0.6 });
  clip(g, B, () => {
    for (let y = -16; y > -h + 10; y -= 22) { fill(g, rect(x, y, x + W, y + 1.6), S.d); rivets(g, x + 2, x + W - 2, y + 0.8, 2.6, S.k); }
    rust(g, x, x + W, -h + 4, h * 0.6, x | 0, 0.4);
    fill(g, rect(x + W * 0.62, -h - 10, x + W, 0), `${SOOT}0.35)`);
    fill(g, rect(x, -h - 10, x + W * 0.2, 0), 'rgba(200,190,170,0.08)');
    texture(g, 'steel', 0.5, 1.6);
  });
  stroke(g, B, S.k, 0.5);
  // the hot-blast main: out at mid height toward the furnace
  cel(g, rect(x + W, -h * 0.55 - 5, x + W + 18, -h * 0.55 + 5), S, { sh: 0.5, hl: 0.3 });
  for (const fx of [x + W + 2, x + W + 16]) fill(g, rect(fx, -h * 0.55 - 6, fx + 1.4, -h * 0.55 + 6), S.d);
  // the valve platform with its rail
  catwalk(g, x - 6, x + W + 6, -40);
}

// the blast furnace (docs §10.30), four years cold: the shell in its riveted
// courses and cooling staves, the bustle pipe round its waist, the uptakes and
// the downcomer over the top, the cast house roof at its foot, the tap hole
// (lit live when it burns again); the union's banner still hanging from the rail
export function blastFurnace(g, x) {
  const S = mat(tone('#8a7a6e', '#5e5248', '#40362e', '#14100d'), 'steel', 0.6);
  const cx = x + 70;
  // the shell: bosh, stack, throat
  const SH = `M ${cx - 40} -40 L ${cx - 46} -88 L ${cx - 34} -160 L ${cx - 20} -186 L ${cx + 20} -186 L ${cx + 34} -160 L ${cx + 46} -88 L ${cx + 40} -40 Z`;
  cel(g, SH, S, { sh: 2.0, hl: 0.7 });
  clip(g, SH, () => {
    for (let y = -48; y > -186; y -= 12) { fill(g, rect(cx - 50, y, cx + 50, y + 1.4), S.d); rivets(g, cx - 46, cx + 46, y + 0.7, 3.2, S.k); }
    for (let k = -3; k <= 3; k++) fill(g, rect(cx + k * 12 - 0.4, -186, cx + k * 12 + 0.4, -40), S.k, 0.35);
    rust(g, cx - 46, cx + 46, -186, 140, 41, 0.45);
    fill(g, rect(cx + 14, -190, cx + 50, -40), `${SOOT}0.4)`);
    fill(g, rect(cx - 50, -190, cx - 30, -40), 'rgba(210,190,160,0.1)');
    texture(g, 'steel', 0.55, 2);
  });
  stroke(g, SH, S.k, 0.6);
  // the bustle pipe round the waist and the tuyere stocks down from it
  cel(g, rect(cx - 56, -98, cx + 56, -88), S, { sh: 0.8, hl: 0.4 });
  for (let k = -4; k <= 4; k++) { const tx = cx + k * 10; stroke(g, `M ${tx} -88 L ${tx + k * 0.6} -72`, S.d, 1.6); stroke(g, `M ${tx - 0.5} -88 L ${tx + k * 0.6 - 0.5} -72`, S.l, 0.4, 0.5); }
  // uptakes and the downcomer, over the top and down behind
  for (const ux of [cx - 14, cx + 14]) cel(g, rect(ux - 3, -200, ux + 3, -184), S, { sh: 0.5, hl: 0.3 });
  cel(g, `M ${cx - 17} -200 L ${cx + 17} -200 L ${cx + 17} -194 L ${cx - 17} -194 Z`, S, { sh: 0.4, hl: 0.3 });
  stroke(g, `M ${cx + 17} -197 C ${cx + 60} -197 ${x + 150} -170 ${x + 150} -110 L ${x + 150} -40`, S.k, 7);
  stroke(g, `M ${cx + 17} -197 C ${cx + 60} -197 ${x + 150} -170 ${x + 150} -110 L ${x + 150} -40`, S.m, 5.4);
  stroke(g, `M ${cx + 17} -199 C ${cx + 58} -199 ${x + 148} -172 ${x + 148} -110`, S.l, 0.8, 0.5);
  // the cast house at its foot: inside, the brick back wall black with four
  // years of soot, the runners in the floor, the mud gun parked on its arm;
  // then the steel columns and the corrugated roof
  const IN = rect(x - 6, -40, x + 146, 0);
  const ig = g.createLinearGradient(0, -40, 0, 0); ig.addColorStop(0, '#120e0c'); ig.addColorStop(0.7, '#1e1814'); ig.addColorStop(1, '#2a221c');
  fill(g, IN, ig);
  clip(g, IN, () => {
    for (let y = -38; y < -6; y += 3) for (let k = x - 6 + ((y / 3) & 1) * 3; k < x + 146; k += 6) fill(g, rect(k, y, k + 5.4, y + 2.6), '#2a1e18', 0.55);
    fill(g, rect(x - 6, -6, x + 146, 0), '#3a2e26');
    for (const [a0, a1] of [[cx - 40, cx - 6], [cx + 6, cx + 60]]) { fill(g, rect(a0, -2.6, a1, -1.2), '#120c08'); fill(g, rect(a0, -1.2, a1, -0.8), '#5a4a3e', 0.6); }
    cel(g, poly([[cx - 52, -30], [cx - 30, -24], [cx - 30, -20], [cx - 52, -26]]), IRON, { sh: 0.3, hl: 0.2, lw: 0.3 });
    fill(g, rect(cx - 56, -32, cx - 50, 0), IRON.d);
    texture(g, 'concrete', 0.5, 1.4);
  });
  const CH = rect(x - 6, -48, x + 146, -40);
  cel(g, CH, mat(tone('#6a7078', '#4e545c', '#383d44', '#121418'), 'steel', 0.5), { sh: 0.6, hl: 0.4 });
  clip(g, CH, () => { for (let k = x - 6; k < x + 146; k += 3) fill(g, rect(k, -48, k + 1.2, -40), '#2a2e34', 0.6); });
  for (const px of [x - 2, x + 46, x + 94, x + 142]) cel(g, rect(px, -40, px + 3, 0), STEEL, { sh: 0.3, hl: 0.2 });
  // the tap hole and its trough, dark (the fire is drawn live)
  fill(g, ell(cx, -44, 6, 3.2), '#0c0806');
  cel(g, poly([[cx - 4, -36], [cx + 4, -36], [cx + 30, -6], [cx + 22, -6]]), BRICK, { sh: 0.5, hl: 0.3 });
  // the union's banner on the rail, faded, where it was hung the night of the Quench
  const BN = poly([[cx - 30, -126], [cx + 30, -126], [cx + 28, -110], [cx - 28, -110]]);
  cel(g, BN, mat(tone('#a8382c', '#88281e', '#601a14', '#200806'), 'canvas', 0.8), { sh: 0.5, hl: 0.3 });
  clip(g, BN, () => { letters(g, 'OCAK SÖNER', cx, -119.4, 4.4, '#e8dcc4', { kind: 'sten', align: 'center', jit: 0.03, a: 0.85 }); letters(g, 'KOR KALIR', cx, -112.6, 4.4, '#e8dcc4', { kind: 'sten', align: 'center', jit: 0.03, a: 0.85 }); texture(g, 'canvas', 0.5, 1.4); });
  stroke(g, `M ${cx - 32} -127 L ${cx + 32} -127`, '#2a2622', 0.6);
}

// --- shared --------------------------------------------------------------------------
// a facade from a list of building types, end to end from x0
function strip(x0, types) { let x = x0; return types.map((type) => { const f = { type, x }; x += BUILDINGS[type].w; return f; }); }

function grid() {
  const g = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
  for (let r = STREET; r < ROWS; r++) for (let x = 0; x < COLS; x++) g[r][x] = '#';
  const at = (c, n, ch) => { const r = STREET - n; if (r >= 0 && r < ROWS && c >= 0 && c < COLS) g[r][c] = ch; };
  const block = (c0, c1, n0, n1, ch = '#') => { for (let c = c0; c <= c1; c++) for (let n = n0; n <= n1; n++) at(c, n, ch); };
  block(0, 1, 1, 25); block(COLS - 2, COLS - 1, 1, 25);
  return { g, block };
}
const X = (c) => c * T;
const E = (id, x, y, zone, o = {}) => ({ id, kind: id, x, y, zone, facing: -1, ...o });

// the pieces every mission has: lists, the crate and the barricade helpers,
// checkpoints, the beacon, the lamps
function kit(id) {
  const { g, block } = grid();
  const props = [], front = [], deco = [], lamps = [], glows = [], lights = [], crates = [];
  const P = (name, box, paint, list = props) => list.push({ name, box, paint });
  const bar = (name, c0, c1, n) => { block(c0, c1 - 1, 1, n); P(name, [X(c0) - 4, -n * T - 6, X(c1) + 4, 1], (gg) => barricade(gg, X(c0), X(c1), n * T), front); };
  const addCrate = (c) => { block(c, c + 1, 1, 2); crates.push(X(c)); };
  const finish = (o) => {
    props.push({ name: `${id}.crate`, box: [-2, -18, 18, 1], paint: (gg) => crate(gg, 0, 16, 16), at: crates, foot: [8, 9] });
    o.checkpoints.forEach((c, i) => P(`${id}.cp${i}`, [c.x - 5, -24, c.x + 5, 1], (gg) => cpPost(gg, c.x), deco));
    P(`${id}.beacon`, [o.extract.x - 5, -28, o.extract.x + 5, 1], (gg) => beacon(gg, o.extract.x), deco);
    return { id, level: new Level(g.map((r) => r.join('')), TOPY), props, front, deco, lamps, glows, lights, width: COLS * T, spawn: [64, 0], ...o };
  };
  return { g, block, props, front, deco, lamps, glows, lights, P, bar, addCrate, finish };
}

// --- mission 4 ------------------------------------------------------------------------
//   A  the slag yard   ladles and moulds, a squad among them        → checkpoint 1
//   B  the archive     the foundry's records office behind a gate: hack it,
//                      its guard comes out                         → checkpoint 2
//   C  the copy        hold the archive while Vesper copies the records of
//                      the disappeared: three squads come for it
//   D  extraction      out over the scrap barricade to the flare
export function buildMission4() {
  const K = kit('m4'), { block, P, bar, addCrate, deco, lights, glows, lamps } = K;
  // A
  P('m4.sign', [X(14) - 12, -46, X(14) + 12, 1], (g) => roadSign(g, X(14), ['ÇELİKHANE', 'DÖKÜMHANE', '→']), deco);
  addCrate(28);
  P('m4.slagA', [X(40) - 2, -20, X(40) + 74, 1], (g) => slag(g, X(40)), deco);
  P('m4.burn', [X(62) - 2, -16, X(62) + 14, 1], (g) => burnBarrel(g, X(62)), deco);
  block(74, 79, 1, 4); P('m4.ladleA', [X(74) - 8, -80, X(74) + 56, 1], (g) => ladle(g, X(74) - 4, 3));
  bar('m4.barA', 96, 99, 4);
  block(110, 113, 1, 3); P('m4.mouldA', [X(110) - 4, -26, X(110) + 40, 1], (g) => moulds(g, X(110)));
  block(126, 131, 1, 4); P('m4.ladleB', [X(126) - 8, -80, X(126) + 56, 1], (g) => ladle(g, X(126) - 4, 7));
  // the overhead crane's runway: up the ladder, along it, over the yard
  block(138, 138, 1, 11, 'H'); block(139, 168, 11, 11, '=');
  P('m4.scaf', [X(139) - 2, -104, X(169) + 2, 1], (g) => scaffold(g, X(139), X(169), -88));
  P('m4.lad', [X(138) - 1, -100, X(139) + 1, 1], (g) => ladder(g, X(138), -88, 0));
  addCrate(156);
  P('m4.slagB', [X(172) - 2, -20, X(172) + 74, 1], (g) => slag(g, X(172)), deco);
  // B — the archive gate
  block(196, 197, 1, 5); P('m4.concB', [X(196) - 1, -42, X(198) + 1, 1], (g) => concrete(g, X(196), X(198), 40));
  P('m4.term', [X(212) - 9, -28, X(212) + 18, 1], (g) => terminal(g, X(212)));
  block(224, 225, 1, 12);
  P('m4.gate', [X(224) - 78, -150, X(226) + 78, 1], (g) => gateFrame(g, X(224), X(226), 96, ['DÖKÜMHANE · ARŞİV', 'YETKİSİZ GİRİLMEZ']), deco);
  lights.push([X(225), -110, 90, 0.5, [0.9, 0.95, 1]]);
  // C — the archive yard: what cover there is, the moulds, a ladle on its side
  block(240, 243, 1, 3); P('m4.mouldC', [X(240) - 4, -26, X(240) + 40, 1], (g) => moulds(g, X(240)));
  addCrate(258); addCrate(276);
  block(290, 295, 1, 4); P('m4.ladleC', [X(290) - 8, -80, X(290) + 56, 1], (g) => ladle(g, X(290) - 4, 11));
  P('m4.burnC', [X(268) - 2, -16, X(268) + 14, 1], (g) => burnBarrel(g, X(268)), deco);
  // D
  block(330, 332, 1, 4); P('m4.barD', [X(330) - 4, -4 * T - 8, X(333) + 8, 1], (g) => scrapBarricade(g, X(330), X(333), 4 * T), K.front);
  addCrate(352);
  P('m4.coneD', [X(366) - 6, -12, X(366) + 8, 1], (g) => cone(g, X(366)), deco);
  for (const x of [120, 700, 1240, 1640, 2240, 2700, 3060]) lamps.push(x);
  deco.push({ name: 'm4.lamp', box: [-8, -88, 24, 1], paint: (g) => portLamp(g, 0), at: lamps });
  glows.push([X(62) + 5, -13, 6, 4, '#ff8a3a', 0.4, 'fire']);
  const AZ = [X(228), X(300)];
  return K.finish({
    par: 330,
    // the steelworks' own buildings: sheds, the union hall, the burnt-out ones; no port containers here
    facade: strip(-10, ['antrepo', 'warehouse', 'ruin', 'union', 'garage', 'antrepo', 'warehouse', 'ruin', 'gumruk', 'antrepo', 'warehouse', 'garage', 'ruin', 'antrepo', 'union', 'warehouse', 'antrepo', 'ruin', 'warehouse', 'garage', 'antrepo', 'garage']),
    fires: [X(62) + 5, X(268) + 5],
    checkpoints: [{ x: X(104) }, { x: X(204) }, { x: X(312) }],
    gate: { c0: 224, c1: 225, n0: 1, n1: 12, x: X(224), w: 16, h: 96, wave: 1 },
    terminal: { x: X(212), x0: X(212) - 26, x1: X(212) + 26, time: 6 },
    extract: { x: X(388) },
    objectives: [
      { type: 'reach', x: X(176) },
      { type: 'hack' },
      { type: 'hold', x0: X(244), x1: X(286), time: 45, waves: [[2, 2], [16, 3], [30, 4]] },
      { type: 'reach', x: X(384) },
    ],
    enemies: [
      // A
      E('tet', X(66), 0, [X(46), X(92)]),
      E('tet', X(99) + 4, 0, [X(88), X(120)]),
      E('huc', X(118), 0, [X(100), X(136)], { patrol: [X(112), X(124)] }),
      E('tet', X(160), -88, [X(140), X(168)]),
      E('kal', X(184), 0, [X(170), X(194)]),
      // B
      E('tet', X(200), 0, [X(190), X(222)]),
      E('tet', X(216), 0, [X(198), X(222)], { patrol: [X(206), X(220)] }),
      // through the gate when it opens
      E('tet', X(236), 0, AZ, { wave: 1 }), E('huc', X(250), 0, AZ, { wave: 1 }),
      // C — the squads that come for the archive
      E('tet', X(306), 0, AZ, { wave: 2 }), E('huc', X(310), 0, AZ, { wave: 2 }),
      E('kal', X(312), 0, AZ, { wave: 3 }), E('tet', X(308), 0, AZ, { wave: 3 }), E('tet', X(230), 0, AZ, { wave: 3, facing: 1 }),
      E('huc', X(314), 0, AZ, { wave: 4 }), E('tet', X(304), 0, AZ, { wave: 4 }), E('tet', X(310), 0, AZ, { wave: 4 }),
      // D
      E('tet', X(334) + 4, 0, [X(320), X(360)]),
      E('huc', X(360), 0, [X(330), X(380)], { patrol: [X(352), X(372)] }),
      E('tet', X(380), 0, [X(352), X(396)]),
    ],
  });
}

// --- mission 5 ------------------------------------------------------------------------
//   A  under the line  the street below the viaduct, a post at the stairs
//   B  platform 3      up the stairs onto the dead line (a wall closes the
//                      street under it): the old car, the platform held
//                      by a squad, the sign                      → checkpoint 2
//   C  the line's gate down at the tunnel mouth: hack the signal box, the
//                      gate goes up, the tunnel's guard comes out
//   D  the tunnel      in under the city to the cells' flare
export function buildMission5() {
  const K = kit('m5'), { block, P, bar, addCrate, deco, lights, glows, lamps } = K;
  const DY = -12 * T; // the line's deck
  // A
  addCrate(22);
  P('m5.cone', [X(34) - 6, -12, X(34) + 8, 1], (g) => cone(g, X(34)), deco);
  bar('m5.barA', 52, 55, 4);
  P('m5.dump', [X(66) - 4, -24, X(66) + 48, 1], (g) => dumpster(g, X(66)), deco);
  addCrate(84);
  // B — the viaduct from 96 to 260, up by the stairs at 96
  block(96, 96, 1, 12, 'H'); block(97, 259, 12, 12, '=');
  P('m5.lad', [X(96) - 1, DY - 16, X(97) + 1, 1], (g) => ladder(g, X(96), DY, 0));
  // the piers, one sprite at each place; the deck in pieces (an atlas page is only so wide)
  deco.push({ name: 'm5.pier', box: [-10, DY + 2, 10, 1], paint: (g) => pier(g, DY), at: Array.from({ length: Math.floor((X(260) - X(97) - 32) / PIER_STEP) + 1 }, (_, k) => X(97) + 24 + k * PIER_STEP), foot: [0, 8] });
  for (let k = 0, a = 97; a < 260; k++, a += 28) { const b = Math.min(260, a + 28); P(`m5.via${k}`, [X(a) - 2, DY - 14, X(b) + 2, DY + 8], (g) => clip(g, rect(X(a) - 2, DY - 16, X(b) + 2, DY + 8), () => viaduct(g, X(97), X(260), DY)), deco); }
  P('m5.car', [X(118) - 2, DY - 42, X(118) + 136, DY + 1], (g) => metroCar(g, X(118), DY), deco);
  lights.push([X(118) + 54, DY - 25, 26, 0.45, [1, 0.78, 0.5]]);
  P('m5.signA', [X(178) - 18, DY - 46, X(178) + 18, DY + 1], (g) => stationSign(g, X(178), DY), deco);
  lights.push([X(178), DY - 40, 40, 0.5, [0.95, 0.97, 1]]);
  // cover on the platform: crates stacked by the cells, a barricade of benches
  block(196, 197, 13, 14); P('m5.crateP', [X(196) - 2, DY - 18, X(198) + 2, DY + 1], (g) => { g.translate(0, DY); crate(g, X(196), 16, 16); });
  block(230, 232, 13, 15); P('m5.barP', [X(230) - 4, DY - 3 * T - 8, X(233) + 8, DY + 1], (g) => { g.translate(0, DY); scrapBarricade(g, X(230), X(233), 3 * T); }, K.front);
  // and down the far stairs at 260
  block(260, 260, 1, 12, 'H');
  P('m5.lad2', [X(260) - 1, DY - 16, X(261) + 1, 1], (g) => ladder(g, X(260), DY, 0));
  // under the viaduct, in the street: a burning barrel the cells keep going, then
  // Vanta's wall across the street up to the deck: the way on is the platform
  P('m5.burn', [X(150) - 2, -16, X(150) + 14, 1], (g) => burnBarrel(g, X(150)), deco);
  block(204, 205, 1, 11);
  P('m5.wall', [X(204) - 2, DY + 2, X(206) + 2, 1], (g) => concrete(g, X(204), X(206), -DY - 8), K.front);
  // C — the tunnel mouth and its gate
  block(274, 275, 1, 5); P('m5.concC', [X(274) - 1, -42, X(276) + 1, 1], (g) => concrete(g, X(274), X(276), 40));
  P('m5.term', [X(290) - 9, -28, X(290) + 18, 1], (g) => terminal(g, X(290)));
  block(302, 303, 1, 12);
  P('m5.gate', [X(302) - 78, -150, X(304) + 78, 1], (g) => gateFrame(g, X(302), X(304), 96, ['ESKİ HAT · 3', 'TÜNEL · GİRİLMEZ']), deco);
  // D — the cut down to the tunnel: the cells' barricade, then the mouth with the flare inside
  addCrate(320);
  block(334, 336, 1, 4); P('m5.barD', [X(334) - 4, -4 * T - 8, X(337) + 8, 1], (g) => scrapBarricade(g, X(334), X(337), 4 * T), K.front);
  P('m5.tunnel', [X(354) - 20, -118, X(382) + 34, 1], (g) => tunnelMouth(g, X(354), X(382)), deco);
  for (const x of [140, 560, 1000, 1600, 2160]) lamps.push(x);
  deco.push({ name: 'c.lamp', box: [-8, -86, 24, 1], paint: (g) => lampPost(g, 0), at: lamps });
  glows.push([X(150) + 5, -13, 6, 4, '#ff8a3a', 0.4, 'fire']);
  lights.push([X(372), -30, 50, 0.4, [1, 0.6, 0.3], 'fire']);
  const PZ = [X(98), X(258)], TZ = [X(306), X(396)];
  return K.finish({
    par: 300,
    facade: strip(-10, ['walkup', 'synBlock', 'alley', 'garage', 'walkupB', 'hotel', 'synBlock', 'ruin', 'alley', 'walkup', 'warehouse', 'garage', 'synBlock', 'walkupB', 'ruin', 'warehouse', 'stack', 'antrepo', 'stack', 'warehouse', 'antrepo', 'stack', 'warehouse', 'antrepo']),
    fires: [X(150) + 5],
    checkpoints: [{ x: X(90) }, { x: X(200) }, { x: X(268) }],
    gate: { c0: 302, c1: 303, n0: 1, n1: 12, x: X(302), w: 16, h: 96, wave: 1 },
    terminal: { x: X(290), x0: X(290) - 26, x1: X(290) + 26, time: 6 },
    extract: { x: X(372) },
    objectives: [
      { type: 'reach', x: X(100) },
      { type: 'reach', x: X(262) },
      { type: 'hack' },
      { type: 'reach', x: X(368) },
    ],
    enemies: [
      // A
      E('tet', X(55) + 4, 0, [X(44), X(80)]),
      E('tet', X(78), 0, [X(60), X(94)], { patrol: [X(70), X(88)] }),
      E('huc', X(110), 0, [X(98), X(160)]),
      // B — on the platform
      E('tet', X(150), DY, PZ),
      E('tet', X(186), DY, PZ, { patrol: [X(176), X(194)] }),
      E('kal', X(212), DY, PZ),
      E('tet', X(236), DY, PZ),
      E('huc', X(248), DY, PZ),
      // under the line while you are up there
      E('tet', X(196), 0, [X(160), X(203)]),
      // C
      E('tet', X(278) + 4, 0, [X(264), X(298)]),
      E('huc', X(294), 0, [X(270), X(300)]),
      // D — the tunnel's guard, when the gate goes up
      E('tet', X(316), 0, TZ, { wave: 1 }), E('kal', X(330), 0, TZ, { wave: 1 }), E('huc', X(344), 0, TZ, { wave: 1 }),
      E('tet', X(337) + 4, 0, TZ),
      E('tet', X(350), 0, TZ, { patrol: [X(342), X(358)] }),
      E('huc', X(376), 0, TZ),
    ],
  });
}

// --- mission 6 ------------------------------------------------------------------------
//   A  the depot road  past Vanta's post into the north depots
//   B  the yard        containers and the gantry crane, its deck → checkpoint 2
//   C  the factory     hack the factory gate; its guard comes out
//   D  the line        hold the drone line while Skye's charges burn it out:
//                      three squads, the shield men with them
//   E  extraction      out the back through the scrap
export function buildMission6() {
  const K = kit('m6'), { block, P, bar, addCrate, deco, lights, glows, lamps } = K;
  // A
  P('m6.sign', [X(16) - 12, -46, X(16) + 12, 1], (g) => roadSign(g, X(16), ['KUZEY', 'DEPOLARI', 'VANTA']), deco);
  addCrate(30);
  bar('m6.barA', 46, 49, 4);
  P('m6.burn', [X(58) - 2, -16, X(58) + 14, 1], (g) => burnBarrel(g, X(58)), deco);
  // B — the yard
  block(72, 81, 1, 5); P('m6.contA', [X(72) - 2, -42, X(82) + 2, 1], (g) => container(g, X(72), -40, X(82), 0, CONT.navy, { code: 'VNTU 520448 3' }));
  block(100, 120, 12, 12, '='); block(99, 99, 1, 12, 'H');
  P('m6.rtg', [X(100) - 18, -150, X(121) + 16, 1], (g) => rtg(g, X(100), X(121)), deco);
  P('m6.deck', [X(100) - 2, -114, X(121) + 2, -78], (g) => catwalk(g, X(100), X(121), -96));
  P('m6.lad', [X(99) - 1, -112, X(100) + 1, 1], (g) => ladder(g, X(99), -96, 0));
  addCrate(110);
  block(132, 141, 1, 5); block(136, 141, 6, 10);
  P('m6.contB', [X(132) - 2, -42, X(142) + 2, 1], (g) => container(g, X(132), -40, X(142), 0, CONT.teal, { code: 'VNTU 520451 0' }));
  P('m6.contC', [X(136) - 2, -82, X(142) + 2, -39], (g) => container(g, X(136), -80, X(142), -40, CONT.rust, { code: 'TGHU 41907', kor: true }));
  P('m6.dump', [X(152) - 4, -24, X(152) + 48, 1], (g) => dumpster(g, X(152)), deco);
  P('m6.rackA', [X(166) - 2, -68, X(166) + 50, 1], (g) => droneRack(g, X(166)), deco);
  addCrate(178);
  // C — the factory gate
  block(192, 193, 1, 5); P('m6.concC', [X(192) - 1, -42, X(194) + 1, 1], (g) => concrete(g, X(192), X(194), 40));
  P('m6.term', [X(206) - 9, -28, X(206) + 18, 1], (g) => terminal(g, X(206)));
  block(218, 219, 1, 12);
  P('m6.gate', [X(218) - 78, -150, X(220) + 78, 1], (g) => gateFrame(g, X(218), X(220), 96, ['VANTA · ÜRETİM', 'DRON HATTI']), deco);
  lights.push([X(219), -110, 90, 0.55, [0.85, 0.92, 1]]);
  // D — the line: conveyors to fight from, racks along the back
  block(236, 247, 1, 2); P('m6.convA', [X(236) - 2, -24, X(248) + 2, 1], (g) => conveyor(g, X(236), X(248)));
  block(270, 281, 1, 2); P('m6.convB', [X(270) - 2, -24, X(282) + 2, 1], (g) => conveyor(g, X(270), X(282)));
  deco.push({ name: 'm6.rack', box: [-2, -68, 50, 1], paint: (g) => droneRack(g, 0), at: [X(226), X(254), X(288)] });
  for (const x of [X(240), X(276)]) lights.push([x, -60, 50, 0.45, [0.85, 0.92, 1]]);
  // E
  block(318, 320, 1, 4); P('m6.barE', [X(318) - 4, -4 * T - 8, X(321) + 8, 1], (g) => scrapBarricade(g, X(318), X(321), 4 * T), K.front);
  addCrate(342);
  block(356, 365, 1, 5); P('m6.contE', [X(356) - 2, -42, X(366) + 2, 1], (g) => container(g, X(356), -40, X(366), 0, CONT.rust, { code: 'VNTU 520460 9' }));
  for (const x of [130, 520, 980, 1300, 2600, 2980]) lamps.push(x);
  deco.push({ name: 'm6.lamp', box: [-8, -88, 24, 1], paint: (g) => portLamp(g, 0), at: lamps });
  glows.push([X(58) + 5, -13, 6, 4, '#ff8a3a', 0.4, 'fire']);
  lights.push([X(100) + 120, -124, 30, 0.3, [1, 0.7, 0.4]]);
  const LZ = [X(222), X(300)];
  return K.finish({
    par: 360,
    facade: strip(-10, ['gumruk', 'antrepo', 'stack', 'warehouse', 'wallC', 'wallC', 'antrepo', 'stack', 'warehouse', 'synBlock', 'warehouse', 'stack', 'antrepo', 'warehouse', 'stack', 'wallC', 'antrepo', 'stack', 'warehouse', 'stack', 'antrepo', 'warehouse']),
    fires: [X(58) + 5],
    checkpoints: [{ x: X(92) }, { x: X(186) }, { x: X(306) }],
    gate: { c0: 218, c1: 219, n0: 1, n1: 12, x: X(218), w: 16, h: 96, wave: 1 },
    terminal: { x: X(206), x0: X(206) - 26, x1: X(206) + 26, time: 6 },
    extract: { x: X(388) },
    objectives: [
      { type: 'reach', x: X(160) },
      { type: 'hack' },
      { type: 'hold', x0: X(244), x1: X(276), time: 50, waves: [[2, 2], [17, 3], [33, 4]] },
      { type: 'reach', x: X(384) },
    ],
    enemies: [
      // A
      E('tet', X(49) + 4, 0, [X(38), X(70)]),
      E('tet', X(64), 0, [X(52), X(86)], { patrol: [X(60), X(70)] }),
      // B
      E('tet', X(116), -96, [X(101), X(120)]),
      E('huc', X(126), 0, [X(84), X(150)], { patrol: [X(118), X(130)] }),
      E('tet', X(138), -80, [X(136), X(141)]),
      E('kal', X(170), 0, [X(150), X(188)]),
      // C
      E('tet', X(196) + 4, 0, [X(186), X(214)]),
      E('tet', X(210), 0, [X(196), X(216)]),
      // through the gate
      E('tet', X(232), 0, LZ, { wave: 1 }), E('huc', X(250), 0, LZ, { wave: 1 }), E('tet', X(262), 0, LZ, { wave: 1 }),
      // D — the squads that come for the line
      E('kal', X(296), 0, LZ, { wave: 2 }), E('tet', X(292), 0, LZ, { wave: 2 }),
      E('huc', X(298), 0, LZ, { wave: 3 }), E('tet', X(226), 0, LZ, { wave: 3, facing: 1 }), E('tet', X(294), 0, LZ, { wave: 3 }),
      E('kal', X(298), 0, LZ, { wave: 4 }), E('huc', X(224), 0, LZ, { wave: 4, facing: 1 }), E('tet', X(290), 0, LZ, { wave: 4 }),
      // E
      E('tet', X(321) + 4, 0, [X(310), X(350)]),
      E('huc', X(350), 0, [X(320), X(380)]),
      E('tet', X(366), -40, [X(356), X(365)]),
      E('tet', X(386), 0, [X(366), X(396)]),
    ],
  });
}

// --- mission 7 ------------------------------------------------------------------------
//   A  the works road  in through the works' own gate, the union hall
//   B  the stoves      the four hot-blast stoves, their valve platforms; a
//                      squad up on them                         → checkpoint 2
//   C  the control     hack the furnace control; the cast house opens
//   D  the cast house  hold it while the furnace takes the blast and lights:
//                      ninety seconds, four squads, the shield men
//   E  extraction      out past the furnace's foot to the flare
export function buildMission7() {
  const K = kit('m7'), { block, P, bar, addCrate, deco, lights, glows, lamps } = K;
  // A
  P('m7.sign', [X(14) - 12, -46, X(14) + 12, 1], (g) => roadSign(g, X(14), ['ÇELİKHANE', 'YÜKSEK FIRIN', 'GİRİŞ']), deco);
  addCrate(26);
  bar('m7.barA', 42, 45, 4);
  P('m7.burnA', [X(56) - 2, -16, X(56) + 14, 1], (g) => burnBarrel(g, X(56)), deco);
  addCrate(70);
  // B — the stoves, each with its valve platform at 40 units
  // (one stove sprite, drawn at each stove's place)
  const STOVES = [84, 104, 124, 144];
  deco.push({ name: 'm7.stove', box: [-8, -186, 64, 1], paint: (g) => { hotStove(g, 0, 168); ladder(g, 48, -40, 0); }, at: STOVES.map(X), foot: [17, 22] });
  for (const c of STOVES) { block(c - 1, c + 5, 5, 5, '='); block(c + 6, c + 6, 1, 5, 'H'); }
  addCrate(96); addCrate(136);
  block(158, 163, 1, 3); P('m7.mould', [X(158) - 4, -26, X(158) + 40, 1], (g) => moulds(g, X(158)));
  // C — the furnace control and the cast house gate
  block(178, 179, 1, 5); P('m7.concC', [X(178) - 1, -42, X(180) + 1, 1], (g) => concrete(g, X(178), X(180), 40));
  P('m7.term', [X(192) - 9, -28, X(192) + 18, 1], (g) => terminal(g, X(192)));
  block(204, 205, 1, 12);
  P('m7.gate', [X(204) - 78, -150, X(206) + 78, 1], (g) => gateFrame(g, X(204), X(206), 96, ['YÜKSEK FIRIN · DÖKÜM', 'SICAK ALAN']), deco);
  // D — the furnace over the cast house; ladles to fight from
  P('m7.furnace', [X(224) - 8, -204, X(224) + 160, 1], (g) => blastFurnace(g, X(224)), deco);
  const tap = X(224) + 70;
  glows.push([tap, -44, 7, 3.6, '#ff7a2a', 0.85, 'fire'], [tap + 18, -14, 18, 4, '#ff8a3a', 0.45, 'fire']);
  lights.push([tap, -40, 110, 0.9, [1, 0.5, 0.2], 'fire'], [tap + 20, -10, 60, 0.6, [1, 0.55, 0.25], 'fire']);
  block(216, 221, 1, 4); P('m7.ladleD', [X(216) - 8, -80, X(216) + 56, 1], (g) => ladle(g, X(216) - 4, 1));
  addCrate(258); addCrate(272);
  block(286, 291, 1, 4); P('m7.ladleE', [X(286) - 8, -80, X(286) + 56, 1], (g) => ladle(g, X(286) - 4, 2));
  // E
  P('m7.slag', [X(316) - 2, -20, X(316) + 74, 1], (g) => slag(g, X(316)), deco);
  block(340, 342, 1, 4); P('m7.barE', [X(340) - 4, -4 * T - 8, X(343) + 8, 1], (g) => scrapBarricade(g, X(340), X(343), 4 * T), K.front);
  addCrate(362);
  for (const x of [110, 560, 1360, 2700, 3060]) lamps.push(x);
  deco.push({ name: 'm7.lamp', box: [-8, -88, 24, 1], paint: (g) => portLamp(g, 0), at: lamps });
  glows.push([X(56) + 5, -13, 6, 4, '#ff8a3a', 0.4, 'fire']);
  const HZ = [X(208), X(310)];
  return K.finish({
    par: 380,
    facade: strip(-10, ['union', 'antrepo', 'warehouse', 'ruin', 'garage', 'antrepo', 'warehouse', 'wallC', 'antrepo', 'ruin', 'warehouse', 'antrepo', 'garage', 'warehouse', 'ruin', 'antrepo', 'warehouse', 'antrepo', 'ruin', 'warehouse', 'antrepo']),
    fires: [X(56) + 5, tap + 4],
    checkpoints: [{ x: X(78) }, { x: X(170) }, { x: X(306) }],
    gate: { c0: 204, c1: 205, n0: 1, n1: 12, x: X(204), w: 16, h: 96, wave: 1 },
    terminal: { x: X(192), x0: X(192) - 26, x1: X(192) + 26, time: 7 },
    extract: { x: X(388) },
    objectives: [
      { type: 'reach', x: X(160) },
      { type: 'hack' },
      { type: 'hold', x0: X(240), x1: X(280), time: 90, waves: [[2, 2], [22, 3], [44, 4], [66, 5]] },
      { type: 'reach', x: X(384) },
    ],
    enemies: [
      // A
      E('tet', X(45) + 4, 0, [X(34), X(66)]),
      E('huc', X(64), 0, [X(48), X(80)], { patrol: [X(58), X(70)] }),
      // B — on the stoves' platforms and between them
      E('tet', X(88), -40, [X(83), X(89)]),
      E('tet', X(128), -40, [X(123), X(129)]),
      E('kal', X(116), 0, [X(98), X(140)]),
      E('tet', X(148), -40, [X(143), X(149)]),
      E('huc', X(152), 0, [X(130), X(170)]),
      // C
      E('tet', X(182) + 4, 0, [X(172), X(200)]),
      E('tet', X(196), 0, [X(184), X(202)], { patrol: [X(188), X(200)] }),
      // the cast house's guard, when the gate goes up
      E('tet', X(226), 0, HZ, { wave: 1 }), E('kal', X(244), 0, HZ, { wave: 1 }), E('huc', X(262), 0, HZ, { wave: 1 }),
      // D — Vanta comes for the furnace
      E('tet', X(306), 0, HZ, { wave: 2 }), E('huc', X(302), 0, HZ, { wave: 2 }),
      E('kal', X(306), 0, HZ, { wave: 3 }), E('tet', X(300), 0, HZ, { wave: 3 }), E('tet', X(210), 0, HZ, { wave: 3, facing: 1 }),
      E('huc', X(304), 0, HZ, { wave: 4 }), E('tet', X(298), 0, HZ, { wave: 4 }), E('huc', X(212), 0, HZ, { wave: 4, facing: 1 }),
      E('kal', X(306), 0, HZ, { wave: 5 }), E('kal', X(210), 0, HZ, { wave: 5, facing: 1 }), E('tet', X(300), 0, HZ, { wave: 5 }),
      // E
      E('tet', X(343) + 4, 0, [X(330), X(370)]),
      E('huc', X(372), 0, [X(344), X(396)]),
      E('tet', X(390), 0, [X(364), X(396)]),
    ],
  });
}
