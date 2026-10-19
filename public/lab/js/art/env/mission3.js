// KOR LAB — campaign mission 3, "Sekreter Gall": the Syndicate's seat in
// the city and the act 1 boss.
//
//   A  the plaza     planters and T-walls under the banners          → checkpoint 1
//   B  the gate      hack the security gate; the guard behind it comes out
//   C  the hall      an open court with low cover; Gall waits on the dais and
//                    calls squads in as the fight turns
//   D  extraction    the flare past the dais
import { Brush, rnd } from '../paint.js';
import { cel, fill, stroke, clip } from '../kit.js';
import { M, tone, mat, C } from '../style.js';
import { Level, T } from '../../phys/level.js';
import { crate, lampPost, cone } from './street.js';
import { barricade } from './course.js';
import { concrete, terminal, gateFrame, beacon, cpPost } from './mission1.js';
import { emblem } from '../enemies/syndicate.js';
import { ledStrip, letters, notice, drape } from './city.js';
import { texture } from '../tex.js';

const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
const rgb = (hex) => [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];

const COLS = 400, TOPY = -200, ROWS = 30, STREET = 25;
const STONE = mat(tone('#c4bdae', '#9a9283', '#736c5f', '#2e2b26'), 'concrete', 0.6);
const POLE = tone('#ffe39a', '#e8b65a', '#a9792f', '#5e3f14');
const RED = tone('#ff6b6b', '#d22e3a', '#8e1622', '#3a060c');
const STEEL = mat(tone('#b9c0c8', '#8c949e', '#646b74', '#22262b'), 'steel', 0.4);
const VAN = mat(tone('#9aa3b0', '#6e7783', '#4e5560', '#1a1e24'), 'paint', 0.4);

// --- painters (from x = 0 unless given) ---------------------------------------------------------
// a cut-stone planter (16 high, 24 wide: solid), boxwood clipped square in it
export function planter(g) {
  const B = poly([[0, 0], [0, -12], [-1, -13], [25, -13], [24, -12], [24, 0]]);
  cel(g, B, STONE, { sh: 1.4, hl: 0.6 });
  clip(g, B, () => { fill(g, rect(-1, -13, 25, -11.6), STONE.l, 0.7); stroke(g, 'M 0 -4 L 24 -4', STONE.d, 0.4); for (const x of [8, 16]) stroke(g, `M ${x} -11.6 L ${x} 0`, STONE.d, 0.3, 0.7); });
  stroke(g, B, STONE.k, 0.4);
  const H = mat(tone('#7a9468', '#4e6a44', '#36502f', '#121c0e'), 'wool', 0.6);
  const hedge = 'M 1.4 -13 L 1.4 -19.4 C 1.4 -20.4 2.4 -21 3.4 -21 L 20.6 -21 C 21.6 -21 22.6 -20.4 22.6 -19.4 L 22.6 -13 Z';
  cel(g, hedge, H, { sh: 1.2, hl: 0.5 });
  clip(g, hedge, () => { for (let i = 0; i < 18; i++) fill(g, ell(2.5 + (i * 7.3) % 19, -19.6 + ((i * 3.1) % 6), 1, 0.8), H.l, 0.5); });
}

// a flagpole with a Syndicate flag (background)
export function flag(g, h = 120) {
  cel(g, rect(-1, -h, 1, 0), POLE, { sh: 0.3, hl: 0.2, lw: 0.25 });
  cel(g, ell(0, -h - 1.4, 1.8, 1.8), POLE, { sh: 0.3, hl: 0.3, lw: 0.25 });
  cel(g, rect(-3, -2, 3, 0), M.charcoal, { sh: 0.3, hl: 0.2, lw: 0.25 });
  const B = `M 1 ${-h + 4} L 22 ${-h + 4} L 22 ${-h + 46} L 11.5 ${-h + 40} L 1 ${-h + 46} Z`;
  cel(g, B, RED, { sh: 1.6, hl: 0.5 });
  clip(g, B, () => fill(g, rect(1, -h + 4, 22, -h + 7), '#0d0f13', 0.7));
  emblem(g, 11.5, -h + 22, 6, '#f4f1ea');
  drape(g, B, 1, 22, -h + 7, -h + 43, h);
}

// the square's dry pool: a stone basin, the tiered bowl on its pedestal,
// leaves where the water was
export function fountain(g, x) {
  const B = poly([[x, 0], [x, -8], [x + 2, -10], [x + 62, -10], [x + 64, -8], [x + 64, 0]]);
  cel(g, B, STONE, { sh: 1.2, hl: 0.5 });
  clip(g, B, () => { fill(g, rect(x, -10, x + 64, -8.6), STONE.l, 0.7); for (let k = x + 10; k < x + 64; k += 12) stroke(g, `M ${k} -8.6 L ${k} 0`, STONE.d, 0.3, 0.7); fill(g, rect(x, -3, x + 64, 0), '#000', 0.2); });
  cel(g, rect(x + 28, -24, x + 36, -10), STONE, { sh: 0.8, hl: 0.4 });
  cel(g, `M ${x + 18} -26 L ${x + 46} -26 C ${x + 44} -22 ${x + 38} -21 ${x + 32} -21 C ${x + 26} -21 ${x + 20} -22 ${x + 18} -26 Z`, STONE, { sh: 0.8, hl: 0.5 });
  cel(g, rect(x + 30.4, -34, x + 33.6, -26), STONE, { sh: 0.4, hl: 0.3 });
  cel(g, ell(x + 32, -34.6, 3.4, 1.6), STONE, { sh: 0.3, hl: 0.3 });
  fill(g, rect(x + 31.4, -38, x + 32.6, -35.6), '#5a4a3a');
  for (const [lx, c] of [[x + 6, '#7a5a2a'], [x + 14, '#8a6a32'], [x + 44, '#6a4a22'], [x + 54, '#8a6a32'], [x + 22, '#5a4422']]) fill(g, ell(lx, -10.4, 1.6, 0.6), c);
  stroke(g, `M ${x + 33.6} -24 C ${x + 34} -20 ${x + 33} -16 ${x + 34} -12`, '#3a3a2a', 0.3, 0.6);
}

// Vanta's crowd barrier on the square, the families' photographs of the
// missing tied to it, carnations in the bars, candles on the slabs; the
// order beside it
export function vigil(g, x) {
  for (let k = 0; k < 3; k++) {
    const x0 = x + k * 23, B = rect(x0, -13, x0 + 22, -2);
    stroke(g, B, STEEL.k, 1.1); stroke(g, B, STEEL.m, 0.6);
    for (let bx = x0 + 2; bx < x0 + 21; bx += 2) stroke(g, `M ${bx} -13 L ${bx} -2`, STEEL.d, 0.35);
    for (const fx of [x0 + 2, x0 + 20]) stroke(g, `M ${fx} -2 L ${fx - 2.4} 0 M ${fx} -2 L ${fx + 2.4} 0`, STEEL.k, 0.5);
  }
  for (const [px, py, sd] of [[x + 3, -12.4, 1], [x + 12, -12.8, 2], [x + 27, -12.2, 3], [x + 37, -12.6, 4], [x + 50, -12.4, 5], [x + 59, -12.8, 6]]) {
    notice(g, px, py, 7, 8, 'kayip', 'KAYIP', 150 + sd);
    stroke(g, `M ${px + 1} ${py} L ${px + 1} ${py - 0.6} M ${px + 6} ${py} L ${px + 6} ${py - 0.6}`, '#d8d0c0', 0.2);
  }
  for (const fx of [x + 10, x + 21, x + 33, x + 46, x + 57]) { stroke(g, `M ${fx} -2.6 L ${fx + 0.8} -8`, '#3e5a32', 0.3); fill(g, ell(fx + 0.9, -8.6, 1, 0.8), '#b0282a'); }
  for (const [cx, hh] of [[x + 4, 2.4], [x + 8, 3.2], [x + 24, 2], [x + 30, 2.8], [x + 44, 3.4], [x + 52, 2.2], [x + 62, 2.8]]) {
    fill(g, rect(cx - 0.6, -hh, cx + 0.6, 0), '#e6dcc6'); fill(g, ell(cx, -hh - 0.9, 0.35, 0.8), '#ffcf6a');
  }
  cel(g, rect(x + 70, -26, x + 71.2, 0), STEEL, { sh: 0.2, hl: 0.2, lw: 0.25 });
  notice(g, x + 66, -34, 10, 10, 'vanta', 'TOPLANMA YASAKTIR', 159);
}

// a plane tree on the square, bare for the winter: the mottled bark that
// peels in plates (grey, olive, cream), limbs that fork and fork again and
// thin out into a haze of twigs, last year's seed balls still hanging on
// their threads; the rain darkening the wood; an iron grate round its foot
export function tree(g, x, seed = 1) {
  const k = Math.hypot(g.getTransform().a, g.getTransform().b), Bk = new Brush(g, k), r = rnd(31 + seed * 7);
  const TOP = -44, segs = [], tips = [];
  // a limb from (x0, y0) heading a, length L, width w; it wanders, keeps reaching
  // up, and forks at its end until the wood is twig-thin
  const grow = (x0, y0, a, L, w, depth) => {
    let px = x0, py = y0, aa = a; const n = depth < 2 ? 4 : 3;
    for (let i = 0; i < n; i++) {
      aa += (r() - 0.5) * 0.32 + (-Math.PI / 2 - aa) * 0.06;
      const nx = px + Math.cos(aa) * L / n, ny = py + Math.sin(aa) * L / n;
      segs.push([px, py, nx, ny, w * (1 - 0.32 * i / n), depth]); px = nx; py = ny;
      // a side shoot partway along the bigger limbs
      if (depth < 3 && i === 1 && r() < 0.6) grow(px, py, aa + (r() < 0.5 ? -1 : 1) * (0.7 + r() * 0.3), L * 0.4, w * 0.4, depth + 2);
    }
    const we = w * 0.66;
    if (depth >= 4 || we < 0.3) { tips.push([px, py, aa]); return; }
    const kids = 2 + (r() < 0.35 ? 1 : 0);
    for (let c = 0; c < kids; c++) {
      const sp = c / (kids - 1) - 0.5;
      grow(px, py, aa + sp * (1.0 - depth * 0.12) + (r() - 0.5) * 0.25, L * (0.64 + r() * 0.14), we * (0.78 - 0.16 * Math.abs(sp)), depth + 1);
    }
  };
  for (const [a, L, w] of [[-Math.PI / 2 - 0.74, 28, 3.6], [-Math.PI / 2 + 0.06, 30, 4.0], [-Math.PI / 2 + 0.76, 28, 3.4]]) grow(x + (a + Math.PI / 2) * 2.2, TOP + 1.5, a, L, w, 1);
  // keep the crown inside its frame (x ± 33, up to y -116)
  let x0 = x, x1 = x, y0 = 0;
  for (const s of segs) { x0 = Math.min(x0, s[0], s[2]); x1 = Math.max(x1, s[0], s[2]); y0 = Math.min(y0, s[1], s[3]); }
  for (const t of tips) { x0 = Math.min(x0, t[0] - 5); x1 = Math.max(x1, t[0] + 5); y0 = Math.min(y0, t[1] - 6); }
  const sx = Math.min(1, 33 / Math.max(x - x0, x1 - x)), sy = Math.min(1, (116 + TOP) / (TOP - y0));
  const fit = (px, py) => (py < TOP ? [x + (px - x) * sx, TOP + (py - TOP) * sy] : [px, py]);
  const seg = (s, w, col, dx = 0, dy = 0) => { const [ax, ay] = fit(s[0], s[1]), [bx, by] = fit(s[2], s[3]); g.lineWidth = w; g.strokeStyle = col; g.beginPath(); g.moveTo(ax + dx, ay + dy); g.lineTo(bx + dx, by + dy); g.stroke(); };
  g.save(); g.lineCap = 'round';
  // the wood: dark and wet, the sky's cold on its upper side, the underside in shadow
  for (const s of segs) seg(s, s[4], '#3e3c31');
  for (const s of segs) if (s[4] > 0.5) seg(s, s[4] * 0.42, 'rgba(150,148,128,0.36)', -s[4] * 0.2, -s[4] * 0.16);
  for (const s of segs) if (s[4] > 1.4) for (let j = 0; j < 2; j++) { const u = r(), [ax, ay] = fit(s[0], s[1]), [bx, by] = fit(s[2], s[3]); Bk.dab(ax + (bx - ax) * u, ay + (by - ay) * u, s[4] * 0.3, s[4] * 0.22, ['#a6a286', '#7c7a5c', '#8e8c7a'][j + (u > 0.5 ? 1 : 0)], 0.4, 'source-over', Math.atan2(by - ay, bx - ax)); }
  for (const s of segs) if (s[4] > 0.8) seg(s, s[4] * 0.3, 'rgba(8,8,6,0.45)', s[4] * 0.26, s[4] * 0.1);
  // the twigs: hairlines fanning off every tip, upward, a haze against the windows
  for (const [tx, ty, ta] of tips) {
    const [px, py] = fit(tx, ty);
    for (let j = 0; j < 4; j++) {
      const a = ta + (j - 1.5) * 0.4 + (r() - 0.5) * 0.3, L = 2.4 + r() * 4;
      const mx = px + Math.cos(a) * L * 0.5, my = py + Math.sin(a) * L * 0.5 - 0.4;
      g.lineWidth = 0.14 + r() * 0.08; g.strokeStyle = 'rgba(44,42,34,0.85)';
      g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(mx, my, px + Math.cos(a) * L, py + Math.sin(a) * L - 0.8); g.stroke();
    }
    // a seed ball on its thread, now and then
    if (r() < 0.16) { g.lineWidth = 0.08; g.strokeStyle = 'rgba(40,36,28,0.8)'; g.beginPath(); g.moveTo(px, py); g.lineTo(px + 0.3, py + 2.6); g.stroke(); fill(g, ell(px + 0.3, py + 3.2, 0.7, 0.7), '#2e2a20'); fill(g, ell(px + 0.1, py + 3, 0.25, 0.25), 'rgba(150,140,110,0.5)'); }
  }
  g.restore();
  // the trunk: a little flare at the root, a lean, the plates of bark
  const T = `M ${x - 5.8} 0 C ${x - 4.2} -1 ${x - 3.8} -3 ${x - 3.8} -6 C ${x - 3.4} -20 ${x - 3.4} -34 ${x - 3.2} ${TOP + 1} C ${x - 1.4} ${TOP - 2.6} ${x + 1.4} ${TOP - 2.6} ${x + 3.4} ${TOP + 1} C ${x + 3.6} -34 ${x + 3.6} -20 ${x + 4} -6 C ${x + 4} -3 ${x + 4.6} -1 ${x + 6.2} 0 Z`;
  fill(g, T, '#57554a');
  clip(g, T, () => {
    // the plates: big soft irregular patches where the old bark has fallen away
    for (let i = 0; i < 20; i++) {
      const py = -3 - r() * (-TOP - 4), px = x + (r() - 0.5) * 6, c = ['#a8a488', '#7e7e5e', '#929080', '#66644f', '#b4ae92'][i % 5];
      const rx = 1.2 + r() * 1.4, ry = 2 + r() * 2.6, a = (r() - 0.5) * 0.6;
      Bk.fill(`M ${px - rx} ${py} C ${px - rx} ${py - ry * 0.8} ${px - rx * 0.2} ${py - ry} ${px + rx * 0.3} ${py - ry * 0.9} C ${px + rx} ${py - ry * 0.6} ${px + rx * 0.9} ${py + ry * 0.4} ${px + rx * 0.4} ${py + ry * 0.9} C ${px - rx * 0.2} ${py + ry} ${px - rx} ${py + ry * 0.6 + a} ${px - rx} ${py} Z`, c, 0.35, 0.4 + r() * 0.2);
    }
    const sh = g.createLinearGradient(x - 4, 0, x + 4, 0);
    sh.addColorStop(0, 'rgba(150,160,170,0.18)'); sh.addColorStop(0.45, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(6,6,5,0.62)');
    g.fillStyle = sh; g.fillRect(x - 7, TOP - 4, 14, -TOP + 5);
    // rain running down it, and the wet dark at its foot
    for (let i = 0; i < 7; i++) { const px = x - 2.6 + i * 0.9 + r() * 0.4; Bk.line(`M ${px} ${TOP + 2 + r() * 10} C ${px + 0.3} -30 ${px - 0.2} -16 ${px + 0.2} -1`, 'rgba(20,20,16,0.3)', 0.4 + r() * 0.5, 0.4); }
    const ft = g.createLinearGradient(0, -14, 0, 0); ft.addColorStop(0, 'rgba(0,0,0,0)'); ft.addColorStop(1, 'rgba(12,12,10,0.6)');
    g.fillStyle = ft; g.fillRect(x - 7, -14, 14, 14);
  });
  // where the limbs leave the trunk: the swollen collar of old cuts
  for (const [dx, dy] of [[-1.6, TOP + 1], [1.8, TOP + 0.4]]) Bk.dab(x + dx, dy, 1.8, 1.4, 'rgba(160,156,132,0.4)');
  fill(g, rect(x - 9, -0.8, x + 9, 0.4), '#1a1c20');
  for (let k2 = x - 8; k2 < x + 9; k2 += 2) fill(g, rect(k2, -0.8, k2 + 0.8, 0.4), '#3a3e44');
}

// Vanta's water-cannon truck, parked on the square: armoured cab, the tank
// body, the turret on the roof, grilles over the glass
export function truck(g, x) {
  const BODY = VAN;
  const H = `M ${x} -10 L ${x} -30 L ${x + 4} -36 L ${x + 22} -38 L ${x + 26} -44 L ${x + 96} -44 L ${x + 100} -40 L ${x + 100} -10 Z`;
  cel(g, H, BODY, { sh: 1.6, hl: 0.5 });
  clip(g, H, () => {
    fill(g, poly([[x + 4, -34], [x + 20, -36], [x + 20, -27], [x + 2, -27]]), '#1a2028');
    for (let k = x + 4; k < x + 20; k += 2) stroke(g, `M ${k} -36 L ${k} -27`, BODY.d, 0.3);
    stroke(g, `M ${x + 24} -38 L ${x + 24} -10 M ${x + 60} -44 L ${x + 60} -10`, BODY.k, 0.4);
    fill(g, rect(x, -16, x + 100, -14), '#b3232e');
    emblem(g, x + 42, -27, 4, '#f0f2f4');
    letters(g, 'VANTA', x + 76, -24, 5, '#e8ecf0', { kind: 'print', align: 'center', jit: 0, track: 0.1 });
    letters(g, 'SU-03', x + 76, -18.4, 2.6, '#c9ced6', { kind: 'print', align: 'center', jit: 0 });
    fill(g, rect(x, -13, x + 100, -10), '#000', 0.25);
  });
  // a working truck: the glass with the plaza's lamps in it, wheel arches dark over
  // the tyres, road spray thrown up behind each wheel, rust run down from the seams
  // and the bolts, the roof dulled by the rain
  {
    const Bk = new Brush(g, Math.hypot(g.getTransform().a, g.getTransform().b)), r = rnd(x | 0);
    Bk.inside(H, () => {
      const gl = g.createLinearGradient(x + 4, -36, x + 20, -27);
      gl.addColorStop(0, 'rgba(150,170,196,0.32)'); gl.addColorStop(0.45, 'rgba(0,0,0,0)'); gl.addColorStop(0.8, 'rgba(255,200,140,0.18)');
      g.fillStyle = gl; g.fill(new Path2D(poly([[x + 4, -34], [x + 20, -36], [x + 20, -27], [x + 2, -27]])));
      for (const wx of [x + 16, x + 72, x + 88]) {
        Bk.dab(wx, -9, 8, 5, 'rgba(6,6,8,0.75)');
        Bk.dab(wx - 9, -14, 10, 7, 'rgba(52,40,28,0.7)', 1, 'source-over', -0.4);
        for (let i = 0; i < 26; i++) Bk.dab(wx - 4 - r() * 14, -10 - r() * 10, 0.3 + r() * 0.7, 0.2 + r() * 0.5, `rgba(${60 + r() * 20 | 0},${46 + r() * 14 | 0},32,${0.3 + r() * 0.35})`);
      }
      for (const sx of [x + 24, x + 60, x + 42, x + 90]) Bk.line(`M ${sx + 0.6} ${-40 + r() * 6} C ${sx + 1} -30 ${sx + 0.4} -24 ${sx + 1.2} ${-16 - r() * 2}`, 'rgba(120,66,36,0.5)', 1.0 + r() * 0.7, 0.6);
      Bk.dab(x + 60, -44, 40, 3, 'rgba(10,12,16,0.35)');
      // road grime up the lower body, heaviest at the sill
      const gr2 = g.createLinearGradient(0, -24, 0, -10); gr2.addColorStop(0, 'rgba(44,36,26,0)'); gr2.addColorStop(1, 'rgba(44,36,26,0.6)');
      g.fillStyle = gr2; g.fillRect(x - 2, -24, 104, 14);
      Bk.dab(x + 50, -40, 30, 2, 'rgba(190,200,214,0.12)');
      for (let i = 0; i < 18; i++) { const bx = x + 2 + r() * 96; Bk.dab(bx, -30 + r() * 18, 0.25, 0.25, 'rgba(30,26,22,0.6)'); }
    });
  }
  cel(g, rect(x + 62, -50, x + 80, -44), BODY, { sh: 0.6, hl: 0.3 });
  cel(g, poly([[x + 64, -48], [x + 52, -51], [x + 52, -49], [x + 64, -46.6]]), STEEL, { sh: 0.3, hl: 0.3, lw: 0.3 });
  for (const lx of [x + 8, x + 28]) { fill(g, rect(lx, -39.4, lx + 4, -38), '#5e1d22'); fill(g, rect(lx, -39.4, lx + 4, -39), '#8a3a3e', 0.6); }
  fill(g, rect(x + 86, -45.6, x + 90, -44), '#e8f0ff');
  for (const wx of [x + 16, x + 72, x + 88]) { cel(g, ell(wx, -6, 6, 6), mat(M.rubber, 'rubber', 0.5), { sh: 0.6, hl: 0.3 }); fill(g, ell(wx, -6, 2.6, 2.6), '#4a4e54'); }
  cel(g, rect(x - 2, -12, x + 4, -9), STEEL, { sh: 0.2, hl: 0.2, lw: 0.25 });
}

// the courtyard arcade, one bay of it: a square stone pier and the round
// arch to the next one, the cornice over (drawn side by side along the court)
export const BAY = 64;
const ARC = mat(tone('#aaa290', '#7e7768', '#5c564b', '#22201c'), 'concrete', 0.6);
export function column(g, h = 104, arch = true) {
  const S = ARC, r = BAY / 2 - 4, imp = -h + r + 8;
  if (arch) {
    // the arch over to the next pier: voussoirs, a keystone, the spandrel
    const SP = `M -6 ${-h - 4} L ${BAY + 6} ${-h - 4} L ${BAY + 6} ${imp} L ${BAY - 6} ${imp} A ${r} ${r} 0 0 0 6 ${imp} L -6 ${imp} Z`;
    cel(g, SP, S, { sh: 1.4, hl: 0.5, line: false });
    clip(g, SP, () => {
      for (let k = 0; k <= 10; k++) { const a = Math.PI + (k / 10) * Math.PI, cx = BAY / 2; stroke(g, `M ${cx + Math.cos(a) * r} ${imp + Math.sin(a) * r} L ${cx + Math.cos(a) * (r + 6)} ${imp + Math.sin(a) * (r + 6)}`, S.d, 0.35, 0.8); }
      fill(g, poly([[BAY / 2 - 2.4, imp - r - 7], [BAY / 2 + 2.4, imp - r - 7], [BAY / 2 + 1.6, imp - r + 0.6], [BAY / 2 - 1.6, imp - r + 0.6]]), S.l, 0.8);
    });
    stroke(g, `M ${BAY - 6} ${imp} A ${r} ${r} 0 0 0 6 ${imp}`, S.k, 0.32);
    cel(g, rect(-8, -h - 12, BAY + 8, -h - 4), S, { sh: 0.6, hl: 0.4, line: false });
    stroke(g, `M -8 ${-h - 12} L ${BAY + 8} ${-h - 12} M -8 ${-h - 4} L ${BAY + 8} ${-h - 4}`, S.k, 0.32);
  }
  // the pier, its impost and base
  const Pr = rect(-6, imp, 6, 0);
  cel(g, Pr, S, { sh: 2.4, hl: 0.8 });
  clip(g, Pr, () => { for (let y = imp + 8; y < 0; y += 8) stroke(g, `M -6 ${y} L 6 ${y}`, S.d, 0.3, 0.7); });
  cel(g, rect(-8, imp - 2, 8, imp + 2), S, { sh: 0.5, hl: 0.3 });
  cel(g, rect(-8, -5, 8, 0), S, { sh: 0.5, hl: 0.3 });
  // a lamp hung in the arch
  if (!arch) return;
  stroke(g, `M ${BAY / 2} ${imp - r} L ${BAY / 2} ${imp - r + 10}`, '#1a1c20', 0.3);
  fill(g, poly([[BAY / 2 - 2, imp - r + 10], [BAY / 2 + 2, imp - r + 10], [BAY / 2 + 1.4, imp - r + 14], [BAY / 2 - 1.4, imp - r + 14]]), '#2a2e34');
  fill(g, rect(BAY / 2 - 1.2, imp - r + 13.6, BAY / 2 + 1.2, imp - r + 14.4), '#e8f0ff');
}
export const ARCH_LAMP = (h = 104) => { const r = BAY / 2 - 4, imp = -h + r + 8; return [BAY / 2, imp - r + 14]; };

// the contract ceremony set up at the main steps (docs §10.7): the stepped
// platform (16 high, x0..x1: solid), a press wall behind it with the mark
// row on row and the night's business on its band, the lectern and its
// microphones, a speaker and a floodlight at each end
export function dais(g, x0, x1) {
  const cx = (x0 + x1) / 2;
  // the press wall
  const PW = rect(x0 + 10, -72, x1 - 10, -16);
  cel(g, PW, mat(tone('#f2f2ee', '#d8d8d2', '#b2b2aa', '#2a2a28'), 'canvas', 0.3), { sh: 0.6, hl: 0.3 });
  clip(g, PW, () => {
    for (let y = -58, i = 0; y < -18; y += 10, i++) for (let x = x0 + 16 + (i % 2) * 9; x < x1 - 12; x += 18) emblem(g, x, y, 2.4, '#b3232e');
    fill(g, rect(x0 + 10, -72, x1 - 10, -64), '#8e1622');
    letters(g, 'GEÇİCİ GÜVENLİK SÖZLEŞMESİ · 8. UZATMA', cx, -66.6, 4.2, '#f4ecec', { kind: 'print', align: 'center', jit: 0, track: 0.05 });
    fill(g, rect(x0 + 10, -20, x1 - 10, -16), '#000', 0.2);
  });
  for (const x of [x0 + 10, x1 - 12]) cel(g, rect(x, -74, x + 2, -16), STEEL, { sh: 0.2, hl: 0.2, lw: 0.25 });
  ledStrip(g, `M ${x0 + 10} -73.4 L ${x1 - 10} -73.4`, 0.5);
  // the steps
  const S1 = rect(x0, -8, x1, 0), S2 = rect(x0 + 6, -16, x1 - 6, -8);
  cel(g, S1, STONE, { sh: 1.2, hl: 0.5 }); cel(g, S2, STONE, { sh: 1.2, hl: 0.5 });
  for (const S of [S1, S2]) clip(g, S, () => { for (let x = x0 + 12; x < x1; x += 16) stroke(g, `M ${x} -16 L ${x} 0`, STONE.d, 0.3, 0.6); });
  fill(g, rect(x0 + 6, -16, x1 - 6, -15), '#8e1622', 0.9);
  // the lectern, its mark, the microphones
  const L = poly([[cx - 7, -16], [cx - 6, -36], [cx + 6, -36], [cx + 7, -16]]);
  cel(g, L, mat(tone('#4a3a2e', '#33281f', '#241c15', '#0c0907'), 'wood', 0.6), { sh: 0.8, hl: 0.4 });
  emblem(g, cx, -27, 3.4, '#d8c890');
  cel(g, poly([[cx - 7.4, -36], [cx + 7.4, -36], [cx + 6.4, -38.4], [cx - 6.4, -38.4]]), mat(tone('#4a3a2e', '#33281f', '#241c15', '#0c0907'), 'wood', 0.6), { sh: 0.3, hl: 0.3 });
  for (const [mx, d] of [[cx - 2, -1], [cx + 2, 1]]) { stroke(g, `M ${mx} -38.4 Q ${mx + d * 1} -42 ${mx + d * 2.4} -44`, '#1a1c20', 0.35); fill(g, ell(mx + d * 2.6, -44.6, 0.8, 1.1), '#2a2e34'); }
  // a speaker and a floodlight at each end
  for (const [x, d] of [[x0 + 4, 1], [x1 - 4, -1]]) {
    stroke(g, `M ${x} -8 L ${x} -46 M ${x} -8 L ${x - 3} 0 M ${x} -8 L ${x + 3} 0`, '#2a2e34', 0.6);
    cel(g, rect(x - 3, -40, x + 3, -28), mat(M.charcoal, 'rubber', 0.5), { sh: 0.4, hl: 0.3 });
    for (const sy of [-37, -32]) fill(g, ell(x, sy, 1.8, 1.8), '#141618');
    cel(g, poly([[x - 3.4, -50], [x + 3.4, -50], [x + 2.4, -46], [x - 2.4, -46]]), STEEL, { sh: 0.3, hl: 0.3, lw: 0.3 });
    fill(g, rect(x - 2.4 + d * 0.4, -46.4, x + 2.4 + d * 0.4, -45.6), '#f2f6ff');
  }
}
export const DAIS_LAMPS = (x0, x1) => [[x0 + 4, -46], [x1 - 4, -46]];

const bays = (x0, x1) => { const out = []; for (let x = x0; x <= x1; x += BAY) out.push(x); return out; };

// the floor: big slabs on the square, cut-stone setts in the court; one
// tile of each, drawn side by side (flat, under everything)
export const PAVE_W = 96;
function slabs(g, court) {
  const r = (() => { let s = court ? 7 : 3; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); })();
  fill(g, rect(-0.5, -0.5, PAVE_W + 0.5, 42), court ? '#4a463e' : '#44464e');
  const rows = court ? [0, 2, 4.4, 7.2, 10.6, 14.6, 19.2, 24.6, 30.8, 37.6, 42] : [0, 3, 7, 12, 18, 25, 33, 42];
  for (let i = 0; i < rows.length - 1; i++) {
    const y0 = rows[i], y1 = rows[i + 1], sw = (court ? 6 : 24) * (0.7 + (y1 - y0) / 14), off = (i % 2) * sw / 2;
    for (let x = -off; x < PAVE_W; x += sw) {
      const c = court ? (r() < 0.5 ? '#5a554b' : '#524d44') : (r() < 0.5 ? '#54565e' : '#4c4e56');
      fill(g, rect(x + 0.25, y0 + 0.2, x + sw - 0.25, y1 - 0.2), c);
      fill(g, rect(x + 0.25, y0 + 0.2, x + sw - 0.25, y0 + 0.2 + (y1 - y0) * 0.15), '#fff', 0.04);
      if (!court && r() < 0.12) stroke(g, `M ${x + sw * 0.3} ${y0 + 0.3} l ${sw * 0.15} ${(y1 - y0) * 0.5} l ${sw * 0.2} ${(y1 - y0) * 0.4}`, '#2a2c32', 0.3);
    }
  }
  if (court) { fill(g, rect(-0.5, 22.6, PAVE_W + 0.5, 24.6), '#6e685b'); fill(g, rect(-0.5, 22.6, PAVE_W + 0.5, 23.1), '#8a8474'); }
  clip(g, rect(-0.5, -0.5, PAVE_W + 0.5, 42), () => texture(g, 'concrete', 0.45, 1.6));
  fill(g, rect(-0.5, 0, PAVE_W + 0.5, 0.6), '#7a7c86', 0.5);
  fill(g, rect(-0.5, 36, PAVE_W + 0.5, 42), '#000', 0.2);
}
export const plazaSlabs = (g) => slabs(g, false);
export const courtSlabs = (g) => slabs(g, true);

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
  const bar = (name, c0, c1, n) => {
    block(c0, c1 - 1, 1, n);
    P(name, [X(c0) - 4, -n * T - 6, X(c1) + 4, 1], (g) => barricade(g, X(c0), X(c1), n * T), front);
  };
  const planters = [], flags = [];
  const addPlanter = (c) => { block(c, c + 2, 1, 2); planters.push(X(c)); };
  const conc = (name, c, o) => { block(c, c + 1, 1, 5); P(name, [X(c) - 1, -42, X(c + 2) + 1, 1], (g) => concrete(g, X(c), X(c + 2), 40, o)); };
  const floor = [];

  // A — the square (docs §10.7): slabs, the dry pool, the plane trees, the
  // families' vigil on Vanta's barrier, a water-cannon truck parked ---------------------
  for (const c of [30, 70, 110, 150]) flags.push(X(c));
  P('m3.coneA', [X(20) - 6, -12, X(20) + 8, 1], (g) => cone(g, X(20)), deco);
  addPlanter(44); conc('m3.concA', 76); addPlanter(96);
  bar('m3.barA', 124, 127, 4);
  addPlanter(150);
  block(166, 167, 1, 2); P('m3.crateA', [X(166) - 2, -18, X(168) + 2, 1], (g) => crate(g, X(166), 16, 16));
  P('m3.fountain', [398, -40, 466, 1], (g) => fountain(g, 400), deco);
  P('m3.vigil', [656, -46, 740, 1], (g) => vigil(g, 660), deco);
  for (const [cx, hh] of [[664, 2.4], [668, 3.2], [684, 2], [690, 2.8], [704, 3.4], [712, 2.2], [722, 2.8]]) glows.push([cx, -hh - 0.9, 1.6, 1.8, '#ffb060', 0.6, 'fire']);
  lights.push([694, -6, 30, 0.35, [1, 0.6, 0.3], 'fire']);
  deco.push({ name: 'm3.tree', box: [-34, -118, 36, 1], paint: (g) => tree(g, 0, 1), at: [300, 930, 1120], foot: [0, 6] });
  P('m3.truck', [1234, -54, 1338, 1], (g) => truck(g, 1236), deco);
  // B — the security gate in the compound wall ------------------------------------------------
  conc('m3.concB', 184);
  P('m3.term', [X(204) - 9, -28, X(204) + 18, 1], (g) => terminal(g, X(204)));
  block(214, 215, 1, 12);
  P('m3.gateFrame', [X(214) - 76, -150, X(216) + 76, 1], (g) => gateFrame(g, X(214), X(216), 96, ['SEKRETERLİK', 'YETKİSİZ GİRİŞ YASAKTIR']), deco);
  lights.push([X(215), -118, 110, 0.6, [0.9, 0.95, 1]]);
  glows.push([X(215) - 30, -125, 4, 2, '#f2f6ff', 0.6], [X(215) + 30, -125, 4, 2, '#f2f6ff', 0.6]);
  // C — the courtyard under the arcade; Vanta's walls here carry no mark of the cells ----------
  const cols = bays(X(226), X(346));
  for (const x of cols.slice(0, -1)) { const [lx, ly] = ARCH_LAMP(); glows.push([x + lx, ly + 0.6, 4, 2, '#e8f0ff', 0.45]); lights.push([x + lx, ly + 4, 40, 0.35, [0.88, 0.94, 1]]); }
  addPlanter(240); conc('m3.concC1', 266, { kor: false, label: 'S-03' }); addPlanter(292); conc('m3.concC2', 318, { kor: false, label: 'S-04' }); addPlanter(340);
  // the ceremony at the main steps
  block(358, 381, 1, 1); block(359, 380, 2, 2);
  P('m3.dais', [X(358) - 2, -78, X(382) + 2, 1], (g) => dais(g, X(358), X(382)), deco);
  for (const [lx, ly] of DAIS_LAMPS(X(358), X(382))) { glows.push([lx, ly, 5, 2.4, '#f2f6ff', 0.7]); lights.push([lx, ly + 6, 90, 0.7, [0.9, 0.95, 1]]); }
  // D — extraction ------------------------------------------------------------------------------
  P('m3.beacon', [X(390) - 5, -28, X(390) + 5, 1], (g) => beacon(g, X(390)), deco);
  // shared pieces
  props.push({ name: 'm3.planter', box: [-2, -22, 26, 1], paint: planter, at: planters, foot: [12, 14] });
  deco.unshift({ name: 'm3.col', box: [-9, -122, BAY + 9, 1], paint: (g) => column(g), at: cols.slice(0, -1), foot: [0, 8] }, { name: 'm3.pier', box: [-9, -122, 9, 1], paint: (g) => column(g, 104, false), at: cols.slice(-1), foot: [0, 8] });
  deco.push({ name: 'm3.flag', box: [-4, -124, 24, 1], paint: (g) => flag(g), at: flags, foot: [0, 4] });
  // the floor: slabs on the square up to the gate, the court's setts after it
  const sq = [], ct = [];
  for (let x = X(2); x < X(214); x += PAVE_W) sq.push(x);
  for (let x = X(216); x < X(COLS); x += PAVE_W) ct.push(x);
  floor.push({ name: 'm3.slabs', box: [-0.5, -0.5, PAVE_W + 0.5, 42], paint: plazaSlabs, at: sq }, { name: 'm3.setts', box: [-0.5, -0.5, PAVE_W + 0.5, 42], paint: courtSlabs, at: ct });
  // checkpoints
  const checkpoints = [{ x: X(118) }, { x: X(196) }, { x: X(222) }];
  checkpoints.forEach((c, i) => P(`m3.cp${i}`, [c.x - 5, -24, c.x + 5, 1], (g) => cpPost(g, c.x), deco));
  for (const x of [200, 640, 1040, 1420]) lamps.push(x);
  deco.push({ name: 'c.lamp', box: [-8, -86, 24, 1], paint: (g) => lampPost(g, 0), at: lamps });

  const level = new Level(g.map((r) => r.join('')), TOPY);
  const E = (id, x, y, zone, o = {}) => ({ id, kind: id, x, y, zone, facing: -1, ...o });
  const HALL = [X(224), X(396)];
  return {
    id: 'm3', level, props, front, deco, lamps, glows, lights, width: COLS * T,
    // the street up to the plaza, then the governor's office: its wings either side of the centre block
    floor,
    // the square: Vanta's post, the shut municipality and the houses round it,
    // then the governor's office behind its railings; inside, its wings and
    // the centre block, placed so its door stands behind the ceremony
    facade: [
      ['synBlock', -10], ['walkup', 140], ['belediye', 290], ['hotel', 530], ['teahouse', 626], ['alley', 722],
      ...[0, 1, 2, 3, 4].map((k) => ['valFence', 770 + k * 160]),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((k) => ['valWing', 1570 + k * 160]),
      ['valilik', X(370) - 110], ['valWing', X(370) + 110],
    ].map(([type, x]) => ({ type, x })),
    fires: [],
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
