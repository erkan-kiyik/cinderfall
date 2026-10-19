// KOR LAB — M2 movement course: collision tiles and art from one
// description, so what you see is exactly what you stand on.
//
// 8-unit tiles, street level y = 0, 200 columns (1600 units). Every feature
// is placed in tile columns; its painter draws inside the same tile box.
import { cel, fill, stroke, clip, rng } from '../kit.js';
import { M, tone, mat, C } from '../style.js';
import { texture } from '../tex.js';
import { emblem } from '../enemies/syndicate.js';
import { Level, T } from '../../phys/level.js';
import { crate, barrier, lampPost, burnBarrel, dumpster, cone, korMark } from './street.js';
import { facadeLayout, letters } from './city.js';

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
// o: { code: the owner's code stencilled on, kor: the cells' mark sprayed low }
export function container(g, x0, y0, x1, y1, t, o = {}) {
  const { code = 'VNTU 482113 4', kor = false } = o;
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
    // rust run down from the rail and the castings in tapering streaks, bloomed along
    // the bottom rail where water stands; a dent or two; one panel repainted off-shade
    const r = rng((x0 * 13 + y0 * 7) | 0), H = y1 - y0;
    fill(g, rect(x0 + 14 + r() * 20, y0 + 2, x0 + 30 + r() * 24, y1 - 2), r() < 0.5 ? '#fff' : '#000', 0.06);
    for (let i = 0; i < 7; i++) {
      const x = i < 2 ? (i ? dx - 2 : x0 + 1) : x0 + 5 + r() * (dx - x0 - 12), L = 4 + r() * H * 0.55, wd = 0.6 + r() * 0.8;
      const st = g.createLinearGradient(0, y0 + 2, 0, y0 + 2 + L);
      st.addColorStop(0, 'rgba(112,54,24,0.55)'); st.addColorStop(1, 'rgba(112,54,24,0)');
      fill(g, `M ${x} ${y0 + 2} L ${x + wd} ${y0 + 2} L ${x + wd * 0.6} ${y0 + 2 + L} L ${x + wd * 0.3} ${y0 + 2 + L} Z`, st);
    }
    for (let i = 0; i < 5; i++) fill(g, ell(x0 + 4 + r() * (x1 - x0 - 8), y1 - 2.4, 2 + r() * 5, 1 + r()), '#6a3418', 0.38);
    for (let i = 0; i < 2; i++) { const ex = x0 + 8 + r() * (dx - x0 - 16), ey = y0 + H * (0.35 + r() * 0.4); fill(g, ell(ex, ey, 3, 2), '#000', 0.16); fill(g, ell(ex - 0.5, ey - 1.4, 2.2, 0.6), '#fff', 0.08); }
    const wt = g.createLinearGradient(0, y0, 0, y1);
    wt.addColorStop(0, 'rgba(170,185,205,0.12)'); wt.addColorStop(0.35, 'rgba(170,185,205,0)'); wt.addColorStop(0.8, 'rgba(0,0,0,0)'); wt.addColorStop(1, 'rgba(0,0,0,0.25)');
    fill(g, B, wt);
    letters(g, code, x0 + 5, y0 + 13, 3.6, 'rgba(244,241,234,0.75)', { kind: 'print', jit: 0 });
    letters(g, '45G1', x0 + 5, y0 + 17.4, 2.6, 'rgba(244,241,234,0.6)', { kind: 'print', jit: 0 });
    if (kor) korMark(g, x0 + 12, y1 - 7, 3, 0.8);
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

// a hole where the road has fallen in (docs §10.5): the asphalt broken at
// its lip, the earth in layers, an old drain pipe across it, water at the bottom
export function pit(g, x0, x1, depth) {
  const r = rng(x0 | 0);
  fill(g, rect(x0, 0, x1, depth), '#14110e');
  clip(g, rect(x0, 0, x1, depth), () => {
    for (const [y, c] of [[3, '#2a2420'], [9, '#221d19'], [17, '#1b1714'], [24, '#151210']]) fill(g, rect(x0, y, x1, y + 5 + r() * 2), c);
    for (let i = 0; i < 26; i++) fill(g, ell(x0 + r() * (x1 - x0), 2 + r() * (depth - 6), 0.4 + r() * 0.8, 0.3 + r() * 0.5), '#3a3229', 0.8);
    texture(g, 'concrete', 0.5, 1.6);
    const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(0.2, 'rgba(0,0,0,0)'); gr.addColorStop(0.8, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.6)'); fill(g, rect(x0, 0, x1, depth), gr);
    // the old drain, cracked open
    fill(g, rect(x0 - 2, 12, x1 + 2, 18), '#4a4a46'); fill(g, rect(x0 - 2, 12, x1 + 2, 13), '#6a6a64'); fill(g, rect(x0 - 2, 17, x1 + 2, 18), '#2a2a28');
    fill(g, poly([[x0 + (x1 - x0) * 0.45, 12], [x0 + (x1 - x0) * 0.6, 12], [x0 + (x1 - x0) * 0.56, 18], [x0 + (x1 - x0) * 0.48, 18]]), '#0d0c0b');
    fill(g, rect(x0, depth - 3, x1, depth), '#1d232c'); fill(g, rect(x0 + 4, depth - 3, x1 - 6, depth - 2.6), '#ffb060', 0.18);
  });
  fill(g, rect(x0, depth - 1, x1, depth), '#3c4654');
  // the broken lip of the road
  for (const [x, d] of [[x0, 1], [x1, -1]]) fill(g, poly([[x - d * 3, -0.2], [x + d * 1.4, -0.2], [x + d * 2.6, 1.4], [x + d * 1, 3.6], [x + d * 1.8, 5.2], [x, 6], [x - d * 3, 6]]), '#2a2e36');
  for (let i = 0; i < 6; i++) { const x = x0 + 2 + r() * (x1 - x0 - 4); fill(g, poly([[x, -0.2], [x + 1.6, -0.6], [x + 2.6, 0.4], [x + 1, 1.2]]), '#3a3f4a'); }
  // a strip of warning tape tied between two rods, one of them down
  stroke(g, `M ${x0 - 3} 0 L ${x0 - 3} -9 M ${x1 + 3} 0 L ${x1 + 6} -6`, '#5a5a56', 0.6);
  stroke(g, `M ${x0 - 3} -8.4 Q ${(x0 + x1) / 2} -4 ${x1 + 5.4} -5.6`, '#d9533a', 0.7);
  for (let t = 0.1; t < 1; t += 0.14) { const x = x0 - 3 + (x1 + 8.4 - x0) * t; fill(g, rect(x, -8.4 + 4.4 * Math.sin(t * Math.PI) + (2.8 * t) - 0.35, x + 1.6, -8.4 + 4.4 * Math.sin(t * Math.PI) + 2.8 * t + 0.35), '#ece6d8', 0.9); }
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

// the works' pipe bridge across the street (docs §10.5): a lagged steam main
// and a yellow gas line on lattice trestles, low enough that you slide under
// it; the trestles stand clear of the pipes' ends
export function duct(g, x0, x1, yTop, yBot) {
  const S = mat(tone('#a9b0b6', '#80878e', '#5b6167', '#20242a'), 'steel', 0.5);
  const Y = mat(tone('#d8b25a', '#b08a36', '#7c6022', '#2e220a'), 'paint', 0.7);
  const L = tone('#6a6e72', '#4a4e54', '#33363b', '#141619');
  // the trestles: lattice legs down to the street
  for (const tx of [x0 - 10, x1 + 4]) {
    for (const lx of [tx, tx + 6]) cel(g, rect(lx, yBot, lx + 1.2, 0), L, { sh: 0.3, hl: 0.2, lw: 0.3 });
    for (let y = yBot + 2; y < -4; y += 8) stroke(g, `M ${tx + 1} ${y} L ${tx + 6} ${y + 7} M ${tx + 6} ${y} L ${tx + 1} ${y + 7}`, L.d, 0.45);
    cel(g, rect(tx - 1.6, -1.6, tx + 8.8, 0), L, { sh: 0.3, hl: 0.2, lw: 0.3 });
    cel(g, rect(tx - 1, yBot - 0.4, tx + 8.2, yBot + 1.6), L, { sh: 0.3, hl: 0.2, lw: 0.3 });
  }
  // the steam main, lagged in aluminium sheet with banded seams and a dent
  const top = yTop + 0.5, mid = yTop + (yBot - yTop) * 0.62;
  const M = rect(x0 - 14, top, x1 + 14, mid);
  cel(g, M, S, { sh: 1.6, hl: 0.9 });
  clip(g, M, () => {
    for (let x = x0 - 12; x < x1 + 14; x += 7) { fill(g, rect(x, top, x + 0.5, mid), S.d, 0.8); fill(g, rect(x + 0.5, top, x + 0.9, mid), S.l, 0.6); }
    fill(g, ell(x0 + (x1 - x0) * 0.4, (top + mid) / 2, 3, 2), S.d, 0.5);
    fill(g, rect(x0 + 18, top, x0 + 26, mid), '#7a4a30', 0.3);
  });
  // the gas line under it, yellow, flow arrows and its stencil
  const G = rect(x0 - 14, mid + 0.6, x1 + 14, yBot - 0.4);
  cel(g, G, Y, { sh: 0.8, hl: 0.5 });
  clip(g, G, () => {
    const cy = (mid + yBot) / 2;
    for (const x of [x0 + 3, x0 + 14, x1 - 20, x1 - 9]) fill(g, poly([[x, cy - 1], [x + 4, cy - 1], [x + 4, cy - 1.8], [x + 6.4, cy], [x + 4, cy + 1.8], [x + 4, cy + 1], [x, cy + 1]]), '#2a2010', 0.75);
    letters(g, 'YÜKSEK FIRIN GAZI', (x0 + x1) / 2 + 8, cy + 1.2, 3.2, '#2a2010', { kind: 'sten', align: 'center', jit: 0, a: 0.75 });
    for (const [x, l] of [[x0 + 30, 2.6], [x1 - 6, 2]]) fill(g, rect(x, mid + 0.8, x + 0.6, mid + 0.8 + l), '#6a3a1e', 0.6);
  });
  // a pipe shoe on each trestle; the clearance plate hanging at the near end
  for (const tx of [x0 - 10, x1 + 4]) fill(g, rect(tx, mid - 0.4, tx + 7.2, mid + 0.6), L.k);
  const px = x0 - 13.4, py = yBot + 6;
  fill(g, rect(px, py, px + 14, py + 5.6), '#e8c43a'); stroke(g, rect(px, py, px + 14, py + 5.6), '#1a1810', 0.35);
  letters(g, 'DİKKAT', px + 7, py + 2.4, 2.2, '#1a1810', { kind: 'print', align: 'center', jit: 0 });
  letters(g, 'ALÇAK GEÇİT', px + 7, py + 4.9, 2.2, '#1a1810', { kind: 'print', align: 'center', jit: 0 });
}

// A Vanta checkpoint barricade (docs §10.2): steel-framed panels of
// blue-grey polymer, each with the white ring-and-bar mark, the number, a
// rubber kick strip and splayed feet, a steel capping rail along the top. No
// light of its own: it is lit by the street.
const VPOLY = mat(tone('#b3c4d3', '#8499ad', '#5c7186', '#243342'), 'paint', 0.25);
const VSTEEL = mat(tone('#6f7b88', '#4b5663', '#323b45', '#12171c'), 'steel', 0.5);
export function barricade(g, x0, x1, h) {
  const n = Math.max(1, Math.round((x1 - x0) / 12)), pw = (x1 - x0 + 4) / n;
  const B = poly([[x0 - 2, 0], [x0 - 2, -h + 1.2], [x0 - 1, -h], [x1 + 1, -h], [x1 + 2, -h + 1.2], [x1 + 2, 0]]);
  cel(g, B, VSTEEL, { sh: 1.2, hl: 0.5 });
  clip(g, B, () => {
    for (let i = 0; i < n; i++) {
      const px = x0 - 2 + i * pw, P = rect(px + 1.4, -h + 2.2, px + pw - 1.4, -3.4);
      cel(g, P, VPOLY, { sh: 1.4, hl: 0.6, lw: 0.24 });
      clip(g, P, () => {
        // the moulded ribs, the mark, the number, a boot scuff
        for (const y of [-h * 0.72, -h * 0.28]) { stroke(g, `M ${px} ${y} L ${px + pw} ${y}`, VPOLY.d, 0.4); stroke(g, `M ${px} ${y + 0.4} L ${px + pw} ${y + 0.4}`, VPOLY.l, 0.2, 0.7); }
        emblem(g, px + pw / 2, -h * 0.5, Math.min(3.0, pw * 0.22), 'rgba(244,246,248,0.92)');
        g.font = '700 1.7px sans-serif'; g.fillStyle = 'rgba(244,246,248,0.75)'; g.fillText(`V-${(212 + i * 7 + Math.round(x0)) % 900}`, px + 2.4, -h + 5.2);
        stroke(g, `M ${px + pw * 0.3} ${-h * 0.18} l 2.4 0.6`, VPOLY.k, 0.25, 0.5);
        g.save(); g.globalCompositeOperation = 'multiply'; const gr = g.createLinearGradient(0, -h * 0.3, 0, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(60,64,70,0.4)'); g.fillStyle = gr; g.fillRect(px, -h, pw, h); g.restore();
        // a hard life at a checkpoint: bullet strikes (a dent, its rim bright, the
        // paint gone round it), scratches, the rain's streaks down from the rib
        const r = rng((px * 17 + h * 5) | 0);
        const sl = g.createLinearGradient(0, -h, 0, -3.4); sl.addColorStop(0, 'rgba(255,255,255,0.08)'); sl.addColorStop(1, 'rgba(0,0,0,0.12)');
        g.fillStyle = sl; g.fillRect(px, -h, pw, h);
        for (let k = 0; k < 4; k++) { const sx = px + 1.6 + r() * (pw - 3.2), L = 3 + r() * h * 0.4, st = g.createLinearGradient(0, -h * 0.72, 0, -h * 0.72 + L); st.addColorStop(0, 'rgba(40,46,54,0.3)'); st.addColorStop(1, 'rgba(40,46,54,0)'); g.fillStyle = st; g.fillRect(sx, -h * 0.72, 0.3 + r() * 0.4, L); }
        for (let k = 0; k < 2 + (r() * 2 | 0); k++) {
          const bx = px + 2 + r() * (pw - 4), by = -h + 4 + r() * (h - 9);
          fill(g, ell(bx, by, 0.95, 0.95), 'rgba(120,128,138,0.5)');
          fill(g, ell(bx, by, 0.5, 0.5), '#2a2f36');
          fill(g, ell(bx - 0.18, by - 0.2, 0.62, 0.28), 'rgba(230,236,242,0.55)');
        }
        for (let k = 0; k < 3; k++) { const sx = px + 1 + r() * (pw - 4), sy = -h + 3 + r() * (h - 6); stroke(g, `M ${sx} ${sy} l ${1.4 + r() * 2.4} ${(r() - 0.5) * 1.2}`, 'rgba(230,236,242,0.35)', 0.12); }
      });
      for (const [bx, by] of [[px + 2.4, -h + 3.2], [px + pw - 2.4, -h + 3.2], [px + 2.4, -4.4], [px + pw - 2.4, -4.4]]) { fill(g, ell(bx, by, 0.42, 0.42), VSTEEL.d); fill(g, ell(bx - 0.1, by - 0.1, 0.2, 0.2), VSTEEL.l); }
    }
    cel(g, rect(x0 - 2, -3.4, x1 + 2, 0), mat(tone('#2a3644', '#1c2530', '#121820', '#06080b'), 'rubber', 0.5), { sh: 0.3, hl: 0.15, lw: 0.2 });
  });
  // splayed feet
  for (const fx of [x0 - 1, x1 + 1]) cel(g, poly([[fx - 3, 0], [fx - 1, -3], [fx + 1, -3], [fx + 3, 0]]), VSTEEL, { sh: 0.3, hl: 0.2, lw: 0.3 });
  // the capping rail: a steel channel, its top edge worn bright, rust in the bolt holes
  cel(g, rect(x0 - 0.6, -h - 1.6, x1 + 0.6, -h), VSTEEL, { sh: 0.3, hl: 0.4, lw: 0.2 });
  stroke(g, `M ${x0 - 0.4} ${-h - 1.45} L ${x1 + 0.4} ${-h - 1.45}`, VSTEEL.l, 0.2, 0.8);
  for (let x = x0 + 3; x < x1 - 1; x += 6) fill(g, ell(x, -h - 0.8, 0.28, 0.28), '#6b4a32', 0.8);
}

// The cells' barricade (docs §10.2): plates cut from the furnace's shell and
// welded into a wall, the old works' grey paint and rust on them, flour sacks
// filled with rubble piled at the foot, a pallet's slats, a chain, and the
// ember sprayed on it in orange. Built by hand; no light.
const FPLATE = mat(tone('#8a8580', '#66625d', '#47443f', '#1c1b19'), 'paint', 0.8);
const SACK = mat(tone('#d9cfb4', '#b7ab8c', '#8a7f63', '#433d2d'), 'canvas', 0.85);
const PWOOD = mat(tone('#a88559', '#82633f', '#5c4529', '#2a1f12'), 'wood', 0.8);
const RUSTC = tone('#b0663a', '#8a4a26', '#5e3118', '#2a1409');
export function scrapBarricade(g, x0, x1, h) {
  const w = x1 - x0, r = rng(Math.round(x0 * 7 + h));
  // the plates, each a little out of true, overlapping
  const plates = [];
  for (let x = x0 - 1.5; x < x1 - 1;) {
    let pw = 9 + r() * 6;
    if (x1 + 1.5 - x - pw < 5) pw = x1 + 1.5 - x;   // the last plate takes the rest
    const top = -h + (r() - 0.3) * 2.6;
    plates.push([x, pw, top, (r() - 0.5) * 0.05]); x += pw - 1.2;
  }
  for (const [x, pw, top, a] of plates) {
    g.save(); g.translate(x + pw / 2, 0); g.rotate(a); g.translate(-(x + pw / 2), 0);
    const P = poly([[x, 0], [x, top + 1.2], [x + pw * 0.3, top], [x + pw, top + 0.6], [x + pw, 0]]);
    cel(g, P, FPLATE, { sh: 1.4, hl: 0.5, lw: 0.3 });
    clip(g, P, () => {
      // rust coming through the grey in blooms and runs, the torch-cut top edge burnt dark
      for (let k = 0; k < 5; k++) { const rx = x + r() * pw, ry = top + 1 + r() * (h - 4), rr = 0.6 + r() * 1.4; fill(g, ell(rx, ry, rr, rr * 0.7), RUSTC.m, 0.7); fill(g, poly([[rx - 0.2, ry], [rx + 0.2, ry], [rx + 0.1, ry + 2 + r() * 3], [rx, ry + 2]]), RUSTC.d, 0.5); }
      stroke(g, `M ${x} ${top + 1.0} L ${x + pw * 0.3} ${top - 0.2} L ${x + pw} ${top + 0.4}`, '#1a1310', 0.6, 0.7);
    });
    g.restore();
  }
  // the weld beads where the plates meet
  for (const [x] of plates.slice(1)) for (let y = -h + 2; y < -1; y += 0.5) fill(g, ell(x + 0.4, y, 0.38, 0.24), '#9a948c', 0.85);
  // a pallet's slats nailed across, a chain hung over
  for (const y of [-h * 0.62, -h * 0.34]) { cel(g, rect(x0 + w * 0.08, y, x0 + w * 0.7, y + 2.0), PWOOD, { sh: 0.4, hl: 0.25, lw: 0.22 }); for (const nx of [x0 + w * 0.12, x0 + w * 0.66]) fill(g, ell(nx, y + 1.0, 0.25, 0.25), '#333'); }
  for (let k = 0; k < 9; k++) { const u = k / 8, cx = x0 + w * (0.55 + u * 0.4), cy = -h + 1 + Math.sin(u * Math.PI) * 5; stroke(g, ell(cx, cy, 0.7, 0.45), '#77726b', 0.3); }
  korMark(g, x0 + w * 0.78, -h * 0.55, Math.min(4, w * 0.12), 0.9);
  // sandbags at the foot: flour sacks, stamped, tied off
  const rows = Math.max(1, Math.round(h / 12));
  for (let j = 0; j < rows; j++) for (let x = x0 - 2 + (j % 2) * 3.4, k = 0; x < x1 - 1; x += 6.6, k++) {
    const y = -j * 4.2, S = poly([[x, y], [x - 0.4, y - 2.6], [x + 0.6, y - 4.4], [x + 6.2, y - 4.6], [x + 7.0, y - 2.4], [x + 6.6, y]]);
    cel(g, S, SACK, { sh: 1.0, hl: 0.5, lw: 0.24 });
    clip(g, S, () => {
      stroke(g, `M ${x + 0.8} ${y - 2.2} l 5.0 0`, SACK.d, 0.12, 0.6);
      if ((k + j) % 2 === 0) { g.font = '700 1.2px sans-serif'; g.fillStyle = 'rgba(80,40,30,0.55)'; g.fillText('UN · 50KG', x + 1.0, y - 1.4); }
      g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(70,60,45,0.35)'; g.fillRect(x - 1, y - 1.4, 9, 1.4); g.restore();
    });
    stroke(g, `M ${x + 6.4} ${y - 3.6} l 0.8 -0.6 M ${x + 6.4} ${y - 3.6} l 0.9 0.2`, '#6b5a40', 0.18);
  }
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
  P('c.pit', [632, -11, 696, 33], (g) => pit(g, 640, 688, 32));
  // ramp up, plateau, ramp down
  for (let k = 0; k < 5; k++) { at(92 + k, k + 1, '/'); block(92 + k, 92 + k, 1, k, '#'); }
  block(97, 111, 1, 5);
  for (let k = 0; k < 5; k++) { at(112 + k, 5 - k, '\\'); block(112 + k, 112 + k, 1, 4 - k, '#'); }
  P('c.ramp', [734, -42, 938, 1], (g) => ramp(g, 736, 776, 896, 936, 40));
  // overhead duct with 32 of clearance
  block(125, 134, 5, 6);
  P('c.duct', [984, -50, 1096, 1], (g) => duct(g, 1000, 1080, -48, -32));
  // sandbag wall (3 tiles)
  block(145, 147, 1, 3);
  P('c.bags', [1154, -32, 1190, 1], (g) => scrapBarricade(g, 1160, 1184, 24), front);
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
