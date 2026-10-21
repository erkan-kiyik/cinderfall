// KOR — campaign mission 3, "Sekreter Gall": the Syndicate's seat in
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
// a cut-stone planter (16 high, 24 wide: solid), boxwood clipped square in it (docs
// §10.15): a plinth, the box in three blocks, a coping slab overhanging it; the stone
// stained where the rain runs off the coping, green in the joints, chipped at the
// corners, wet and dark at its foot; the hedge a mass of small leaves, lit on top
export function planter(g) {
  const Bk = new Brush(g, Math.hypot(g.getTransform().a, g.getTransform().b)), r = rnd(19);
  const BOX = poly([[0.6, -1.4], [0.6, -11.6], [23.4, -11.6], [23.4, -1.4]]);
  cel(g, poly([[-0.4, 0], [-0.4, -1.6], [24.4, -1.6], [24.4, 0]]), STONE, { sh: 0.5, hl: 0.4 });
  cel(g, BOX, STONE, { sh: 1.4, hl: 0.6 });
  Bk.inside(BOX, () => {
    // three blocks, each its own shade of the stone
    for (const [x0, x1, c] of [[0.6, 8.2, 'rgba(255,248,236,0.06)'], [8.2, 15.8, 'rgba(60,54,46,0.08)'], [15.8, 23.4, 'rgba(255,240,220,0.04)']]) Bk.fill(rect(x0, -11.6, x1, -1.4), c, 0.1);
    for (const x0 of [8.2, 15.8]) { Bk.line(`M ${x0} -11.6 L ${x0} -1.4`, 'rgba(40,36,30,0.7)', 0.28, 0.05); Bk.line(`M ${x0 + 0.24} -11.6 L ${x0 + 0.24} -1.4`, 'rgba(240,232,216,0.3)', 0.1, 0.04); Bk.line(`M ${x0} -6 L ${x0} -1.4`, 'rgba(70,90,50,0.4)', 0.4, 0.3); }
    // the coping's shadow, the rain run off it in streaks, the dark wet foot
    Bk.fill(rect(0, -11.6, 24, -10.4), 'rgba(30,26,22,0.5)', 0.3);
    for (let i = 0; i < 14; i++) { const x0 = 1 + r() * 22; Bk.line(`M ${x0} -10.6 C ${x0 + 0.1} -8 ${x0 - 0.1} -6 ${x0 + 0.05} ${-4 - r() * 3}`, 'rgba(40,36,30,0.22)', 0.3 + r() * 0.5, 0.25); }
    Bk.fill(rect(0, -4, 24, -1), 'rgba(24,22,18,0.4)', 0.8);
    for (let i = 0; i < 40; i++) Bk.dab(1 + r() * 22, -11 + r() * 9.4, 0.06 + r() * 0.16, 0.05 + r() * 0.1, r() < 0.5 ? 'rgba(40,36,30,0.35)' : 'rgba(250,244,230,0.25)');
    texture(g, 'concrete', 0.4, 0.6);
  });
  // the coping: a slab over the box, its top lit, its edge chamfered, a chip off one corner
  const COP = poly([[-0.8, -11.4], [-0.8, -12.6], [-0.2, -13.2], [24.2, -13.2], [24.8, -12.6], [24.8, -11.4]]);
  cel(g, COP, STONE, { sh: 0.6, hl: 0.6 });
  Bk.inside(COP, () => { Bk.line('M -0.2 -13.0 L 24.2 -13.0', 'rgba(255,250,240,0.5)', 0.24, 0.06); Bk.fill('M 21.6 -13.4 L 25 -13.4 L 25 -11.8 C 24 -12.0 22.6 -12.4 21.6 -13.4 Z', 'rgba(60,54,46,0.5)', 0.1); texture(g, 'concrete', 0.35, 0.6); });
  stroke(g, COP, STONE.k, 0.3, 0.7);
  // the hedge: clipped box, small dark leaves, the light on its flat top
  const H = mat(tone('#4e6a44', '#30482a', '#1f3219', '#0a1206'), 'wool', 0.2);
  const hedge = 'M 1.4 -13 L 1.2 -19.2 C 1.2 -20.4 2.2 -21.1 3.4 -21.1 L 20.6 -21.1 C 21.8 -21.1 22.8 -20.4 22.8 -19.2 L 22.6 -13 Z';
  cel(g, hedge, H, { sh: 1.2, hl: 0.5 });
  Bk.inside(hedge, () => {
    Bk.fill(rect(0, -15.6, 24, -12.8), 'rgba(8,14,6,0.55)', 0.6);
    const LV = ['#14220e', '#203418', '#2e4724', '#3f5c32', '#56764a', '#7c9a6a'];
    for (let i = 0; i < 1500; i++) {
      const x0 = 1 + r() * 22, y0 = -21.4 + r() * 8.4, top = (y0 + 21.4) / 8.4, k = Math.min(5, Math.max(0, Math.round((1 - top) * 4.2 + r() * 1.8 - 0.6)));
      g.save(); g.translate(x0, y0); g.rotate(r() * 3.2);
      fill(g, 'M -0.2 0 C -0.1 -0.1 0.1 -0.1 0.2 0 C 0.1 0.1 -0.1 0.1 -0.2 0 Z', LV[k], 0.95);
      g.restore();
    }
    Bk.line('M 1.6 -20.7 L 22.4 -20.7', 'rgba(200,220,180,0.3)', 0.5, 0.4);
  });
  // a few leaves blown onto the coping
  for (const [lx, c] of [[3.2, '#5a4422'], [17.6, '#7a5a2a'], [21.0, '#4e6a44']]) fill(g, ell(lx, -13.3, 0.5, 0.18), c);
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

// Vanta's water-cannon truck, parked on the square (docs §10.15). Front to the left: a
// dozer blade over the bumper, an armoured cab-forward cab with its glass behind
// hinged steel mesh, a light bar and spotlights and the small cannon on the cab roof;
// behind it the tank body in armour plate, bolted, the big cannon in its turret on
// top, lockers low down, the roof rail, the ladder at the back, the spray nozzles
// along the sill; the chassis, the fuel tank, mud flaps and three big wheels under
// it. A truck that has worked the streets: lime streaks where its own water ran
// down, rust from the bolts, the black blister of a petrol bomb, a paint bomb's
// splash half washed off, road dirt thrown up the sides.
export function truck(g, x) {
  const BODY = mat(tone('#9aa3b0', '#6e7783', '#4e5560', '#1a1e24'), 'paint', 0.16), Bk = new Brush(g, Math.hypot(g.getTransform().a, g.getTransform().b)), r = rnd(x | 0);
  const RUB = mat(M.rubber, 'rubber', 0.5), DARK = mat(tone('#4a4f57', '#30343a', '#202328', '#0b0c0e'), 'steel', 0.4);
  const GLASS = (d) => {
    Bk.fill(d, '#12171e', 0.01);
    Bk.inside(d, () => {
      const gl = g.createLinearGradient(0, -48, 0, -30);
      gl.addColorStop(0, 'rgba(150,170,196,0.32)'); gl.addColorStop(0.5, 'rgba(0,0,0,0)'); gl.addColorStop(0.85, 'rgba(255,200,140,0.16)');
      g.fillStyle = gl; g.fill(new Path2D(d));
      Bk.dab(30, -36, 4, 1.2, 'rgba(40,60,70,0.4)');
    });
  };
  const mesh = (d, x0, y0, x1, y1) => Bk.inside(d, () => {
    for (let k = x0; k < x1; k += 1.1) Bk.line(`M ${k} ${y0} L ${k} ${y1}`, 'rgba(40,46,54,0.95)', 0.24, 0.02);
    for (let k = y0; k < y1; k += 1.1) Bk.line(`M ${x0} ${k} L ${x1} ${k}`, 'rgba(40,46,54,0.9)', 0.2, 0.02);
    for (let k = x0; k < x1; k += 1.1) Bk.line(`M ${k + 0.12} ${y0} L ${k + 0.12} ${y1}`, 'rgba(170,180,192,0.3)', 0.06, 0.01);
  });
  const bolts = (pts, rr = 0.42) => { for (const [bx, by] of pts) { Bk.dab(bx, by, rr, rr, 'rgba(30,34,40,0.8)'); Bk.dab(bx - rr * 0.25, by - rr * 0.3, rr * 0.5, rr * 0.5, 'rgba(200,208,218,0.6)'); } };
  g.save(); g.translate(x, 0);

  // --- under it all: the shadow on the slabs, the chassis rails, the fuel tank, the axles
  Bk.dab(76, 0.4, 82, 3.4, 'rgba(0,0,0,0.55)');
  fill(g, rect(8, -16, 146, -11), '#14161a');
  for (const ax of [28, 106, 126]) Bk.fill(rect(ax - 3, -12, ax + 3, -8), '#1b1e22', 0.1);
  const TANK = 'M 50 -15.2 L 82 -15.2 C 84 -15.2 85 -13.6 85 -11.4 C 85 -9.2 84 -7.6 82 -7.6 L 50 -7.6 C 48 -7.6 47 -9.2 47 -11.4 C 47 -13.6 48 -15.2 50 -15.2 Z';
  cel(g, TANK, STEEL, { sh: 0.9, hl: 0.5, gloss: 0.4 });
  for (const sx of [56, 76]) { fill(g, rect(sx, -15.4, sx + 1.4, -7.4), '#1e2126'); Bk.line(`M ${sx + 0.3} -15.2 L ${sx + 0.3} -7.6`, 'rgba(190,198,208,0.4)', 0.2, 0.05); }
  Bk.inside(TANK, () => { Bk.fill(rect(46, -16, 86, -7), 'rgba(16,18,22,0.55)', 0.2); Bk.fill(rect(46, -10, 86, -7), 'rgba(40,30,20,0.6)', 0.6); Bk.line('M 49 -13.6 L 83 -13.6', 'rgba(220,228,236,0.3)', 0.4, 0.2); });
  cel(g, rect(88, -14.6, 96, -8.6), DARK, { sh: 0.4, hl: 0.3 });
  // steps under the cab door, hanging off it
  for (const sy of [-11.2, -5.6]) { cel(g, rect(21, sy, 35, sy + 1.4), DARK, { sh: 0.2, hl: 0.3, lw: 0.25 }); for (let k = 22; k < 35; k += 1.2) fill(g, rect(k, sy + 0.2, k + 0.5, sy + 0.8), '#0d0e10', 0.7); }
  stroke(g, 'M 21.4 -14 L 21.4 -4.2 M 34.6 -14 L 34.6 -4.2', '#25282d', 0.5);

  // --- the cab: armoured, cab-forward, the arch over the front wheel
  const CAB = 'M 6 -14 L 5 -27 L 8 -31 L 15 -47.5 C 15.6 -48.8 16.6 -49.5 18 -49.5 L 43 -49.5 L 43 -14 L 40.5 -14 C 40.5 -20 37.5 -22.6 33 -22.6 L 23 -22.6 C 18.5 -22.6 15.5 -20 15.5 -14 Z';
  cel(g, CAB, BODY, { sh: 1.4, hl: 0.5 });
  Bk.inside(CAB, () => {
    Bk.fill('M 0 -33 L 18 -49 L 50 -49 L 50 -46 L 18 -46 L 2 -31 Z', 'rgba(230,236,244,0.18)', 0.5);
    // the panel seams, the door and its hinges, the handle
    stroke(g, 'M 19.5 -47.6 L 19.5 -23.4 M 37.6 -47.6 L 37.6 -23.4 M 19.5 -47.6 L 37.6 -47.6', BODY.k, 0.35);
    stroke(g, 'M 19.9 -47.2 L 37.2 -47.2', BODY.l, 0.14, 0.6);
    for (const hy of [-42, -29]) cel(g, rect(18.6, hy, 20.4, hy + 2.6), DARK, { sh: 0.2, hl: 0.3, lw: 0.2 });
    cel(g, rect(33.4, -31.8, 36.4, -30.6), DARK, { sh: 0.2, hl: 0.3, lw: 0.18 });
    stroke(g, 'M 5.6 -27 L 43 -27', BODY.d, 0.26, 0.7);
    stroke(g, 'M 40.6 -49 L 40.6 -27', BODY.d, 0.26, 0.6);
    // the red stripe, the mark on the door, the cab's number
    fill(g, 'M 5 -24.6 L 43 -24.6 L 43 -22.8 L 5.2 -22.8 Z', '#b3232e');
    letters(g, '03', 39.0, -28.6, 2.4, '#e8ecf0', { kind: 'print', align: 'center', jit: 0 });
    bolts([[8.4, -18], [8.4, -24], [42, -18], [42, -44], [17.6, -45.6], [25, -48.4], [33, -48.4]], 0.32);
  });
  // the windscreen behind its mesh, the door window behind its own
  const WS = 'M 8.6 -31.2 L 14.8 -46.4 L 17.0 -46.4 L 11.0 -31.2 Z';
  GLASS(WS); mesh(WS, 8, -47, 17.4, -31);
  stroke(g, WS, '#262a30', 0.5);
  const WIN = rect(22.2, -45.4, 35.2, -34.2);
  GLASS(WIN);
  Bk.inside(WIN, () => { Bk.fill('M 23 -40 L 29 -41 L 30 -35 L 24 -34.6 Z', 'rgba(8,10,12,0.7)', 0.4); });
  cel(g, rect(21.4, -46.2, 36, -33.4), DARK, { sh: 0.2, hl: 0.25, line: false, ao: 0 });
  Bk.inside(rect(21.4, -46.2, 36, -33.4), () => { Bk.fill(rect(22.2, -45.4, 35.2, -34.2), 'rgba(0,0,0,1)', 0, 1, 'destination-out'); });
  GLASS(WIN); mesh(WIN, 22.2, -45.4, 35.2, -34.2);
  stroke(g, rect(21.4, -46.2, 36, -33.4), '#1c1f24', 0.3);
  // the bumper, the headlamps in their cages, the dozer blade bolted on in front
  cel(g, rect(3.6, -19, 9, -12.6), DARK, { sh: 0.4, hl: 0.3 });
  // the headlamp in its cage: a round lamp seen from the side, its rim, two bars over it
  cel(g, ell(5.6, -16.6, 1.3, 1.6), DARK, { sh: 0.3, hl: 0.4, lw: 0.18 });
  fill(g, ell(4.7, -16.6, 0.5, 1.3), '#c9d0d6'); fill(g, ell(4.6, -17.0, 0.2, 0.5), '#ffffff', 0.8);
  for (const cy of [-17.6, -15.6]) stroke(g, `M 3.6 ${cy} L 7.2 ${cy}`, '#202328', 0.24);
  const BLADE = 'M -6 -2.6 C -7.6 -8 -7.6 -16 -5.4 -23 L 4.6 -24.4 L 5.4 -21 C 2.6 -16 2.6 -9 4.4 -4.4 L 4.6 -2.4 Z';
  cel(g, BLADE, DARK, { sh: 1.2, hl: 0.5 });
  Bk.inside(BLADE, () => {
    for (const by of [-20, -14, -8]) { Bk.line(`M -7 ${by} L 5 ${by + 0.4}`, 'rgba(0,0,0,0.6)', 0.5, 0.1); Bk.line(`M -7 ${by - 0.5} L 5 ${by - 0.1}`, 'rgba(190,200,210,0.3)', 0.2, 0.05); }
    for (let k = -2; k < 7; k++) Bk.fill(`M -8 ${-24 + k * 3.4} L 6 ${-28 + k * 3.4} L 6 ${-26.3 + k * 3.4} L -8 ${-22.3 + k * 3.4} Z`, 'rgba(214,170,48,0.75)', 0.02);
    Bk.line('M -6.6 -4 C -7.4 -10 -7.2 -17 -5.6 -22.4', 'rgba(220,226,234,0.45)', 0.3, 0.1);
    for (let i = 0; i < 16; i++) Bk.dab(-6 + r() * 10, -24 + r() * 21, 0.2 + r() * 0.5, 0.1 + r() * 0.3, `rgba(${120 + r() * 40 | 0},${70 + r() * 20 | 0},40,${0.3 + r() * 0.3})`, 1, 'source-over', r() * 3);
    Bk.fill('M -8 -8 L 6 -8 L 6 -2 L -8 -2 Z', 'rgba(44,34,24,0.6)', 0.8);
  });
  for (const [bx, by] of [[3.2, -21], [3.0, -6]]) cel(g, rect(bx - 1, by - 1, bx + 2.6, by + 1), DARK, { sh: 0.2, hl: 0.3, lw: 0.2 });
  // the mirror on its arm off the cab's front corner
  stroke(g, 'M 8.6 -36 L 2.4 -38.6 L 2.4 -41', '#202328', 0.5);
  cel(g, rect(0.6, -47.4, 3.4, -38.6), DARK, { sh: 0.3, hl: 0.3, lw: 0.24 });
  fill(g, rect(1.0, -47, 2.2, -39), '#5d6874', 0.8);

  // --- the body: the armoured tank, the arch over the rear wheels
  const BOD = 'M 44.6 -14.6 L 44.6 -58.2 C 44.6 -59.8 45.6 -60.6 47.2 -60.6 L 145.6 -60.6 C 147.2 -60.6 148.2 -59.8 148.2 -58.2 L 148.2 -16 L 139 -16 C 139 -20.6 136 -22.8 131.6 -22.8 L 100.4 -22.8 C 96 -22.8 93 -20.6 93 -16 L 86 -16 L 86 -14.6 Z';
  fill(g, rect(43, -50, 44.8, -14), '#0c0d10');
  cel(g, BOD, BODY, { sh: 1.6, hl: 0.5 });
  Bk.inside(BOD, () => {
    // plates: their seams, the bolts along them, the lap of each over the next
    for (const sx of [68, 92, 118]) { Bk.line(`M ${sx} -60 L ${sx} -16`, 'rgba(20,24,30,0.8)', 0.36, 0.05); Bk.line(`M ${sx + 0.36} -60 L ${sx + 0.36} -16`, 'rgba(210,218,228,0.3)', 0.14, 0.04); }
    Bk.line('M 44 -37.6 L 149 -37.6', 'rgba(20,24,30,0.8)', 0.36, 0.05); Bk.line('M 44 -37.24 L 149 -37.24', 'rgba(210,218,228,0.3)', 0.14, 0.04);
    const bp = []; for (const sx of [68, 92, 118]) for (let by = -57; by < -18; by += 4.4) bp.push([sx - 1.2, by], [sx + 1.6, by]);
    for (let bx = 47; bx < 147; bx += 4.2) bp.push([bx, -38.8], [bx, -36.0], [bx, -58.8]);
    bolts(bp, 0.28);
    // the light over the top edge of the body, the street's cold light down its face
    Bk.fill('M 44 -61 L 149 -61 L 149 -56 L 44 -56 Z', 'rgba(230,236,244,0.22)', 0.6);
    // lockers low down: shutter doors, their handles and hinges
    for (const [lx0, lx1] of [[47, 66.6], [69.4, 90.6]]) {
      const L = rect(lx0, -35.4, lx1, -18.4);
      Bk.fill(L, 'rgba(14,16,20,0.28)', 0.05);
      for (let ly = -35; ly < -18.4; ly += 1.2) { Bk.line(`M ${lx0 + 0.3} ${ly} L ${lx1 - 0.3} ${ly}`, 'rgba(20,24,30,0.55)', 0.14, 0.03); Bk.line(`M ${lx0 + 0.3} ${ly + 0.3} L ${lx1 - 0.3} ${ly + 0.3}`, 'rgba(210,218,228,0.22)', 0.08, 0.02); }
      stroke(g, L, BODY.k, 0.3, 0.8);
      cel(g, rect((lx0 + lx1) / 2 - 1.6, -21.4, (lx0 + lx1) / 2 + 1.6, -20.2), DARK, { sh: 0.2, hl: 0.3, lw: 0.16 });
    }
    // the red stripe, VANTA, the mark, the number, the warning
    fill(g, 'M 44 -24.6 L 149 -24.6 L 149 -22.8 L 44 -22.8 Z', '#b3232e');
    Bk.inside(rect(44, -24.6, 149, -22.8), () => Bk.line('M 44 -24.4 L 149 -24.4', 'rgba(255,170,160,0.4)', 0.2, 0.05));
    emblem(g, 80, -48.4, 5.0, '#f0f2f4');
    letters(g, 'VANTA', 120, -45.0, 6.6, '#e8ecf0', { kind: 'print', align: 'center', jit: 0, track: 0.12 });
    letters(g, 'SU-03', 120, -40.2, 2.8, '#c9ced6', { kind: 'print', align: 'center', jit: 0, track: 0.1 });
    fill(g, rect(98, -35, 116, -31.4), '#d8b43a', 0.9);
    letters(g, 'YAKLAŞMAYIN', 107, -32.2, 2.1, '#1a1a1a', { kind: 'print', align: 'center', jit: 0 });
    for (let k = 0; k < 6; k++) fill(g, `M ${98 + k * 3} -31.4 l 1.5 0 l -1 1.0 l -1.5 0 Z`, '#1a1a1a', 0.85);
    // the ladder up the back, the rear lamps
    for (const lx of [142.6, 146.6]) stroke(g, `M ${lx} -58 L ${lx} -17`, '#262a30', 0.5);
    for (let ly = -56; ly < -18; ly += 3.2) { stroke(g, `M 142.6 ${ly} L 146.6 ${ly}`, '#262a30', 0.42); stroke(g, `M 142.6 ${ly - 0.2} L 146.6 ${ly - 0.2}`, 'rgba(200,208,218,0.4)', 0.12); }
    fill(g, rect(146.2, -30, 148.2, -26), '#5a1a1e'); fill(g, rect(146.4, -29.6, 148, -28.4), '#8a2a30', 0.8);
  });
  // amber marker lamps along the sill (dark), the spray nozzles under it, the mud flaps
  for (const mx of [56, 78, 108, 128]) { cel(g, rect(mx - 1, -18.2, mx + 1, -16.8), mat(tone('#e8a050', '#b8742c', '#7a4c18', '#3a2408'), 'paint', 0.2), { sh: 0.2, hl: 0.3, lw: 0.14 }); }
  for (const nx of [48, 54, 60, 66, 72, 78, 84, 142, 146]) { fill(g, rect(nx - 0.5, -16.2, nx + 0.5, -14.6), '#2a2e34'); fill(g, rect(nx - 0.25, -14.6, nx + 0.25, -14.0), '#6c747e'); }
  for (const [fx, fy] of [[41.2, -14], [139.4, -16]]) { cel(g, rect(fx, fy, fx + 1.6, -3.4), RUB, { sh: 0.3, hl: 0.15, lw: 0.2 }); }
  // the exhaust up behind the cab, its rain cap
  cel(g, rect(43.6, -57, 45, -48), STEEL, { sh: 0.4, hl: 0.4, lw: 0.2 });
  fill(g, 'M 43.2 -57.4 L 45.6 -58.2 L 45.6 -57 L 43.2 -56.6 Z', '#1d2024');
  Bk.dab(44.4, -57, 1.0, 1.4, 'rgba(10,10,12,0.5)');

  // --- on the roof: the rail and its posts, the light bar, the spotlights, the horn, the
  // small cannon on the cab, the big one in its turret, the aerials
  stroke(g, 'M 48 -63.4 L 140 -63.4', '#30353c', 0.5);
  for (let px = 50; px <= 140; px += 15) stroke(g, `M ${px} -63.4 L ${px} -60.6`, '#30353c', 0.4);
  stroke(g, 'M 48 -63.7 L 140 -63.7', 'rgba(210,218,228,0.4)', 0.14);
  cel(g, rect(19, -52.8, 39, -49.4), DARK, { sh: 0.3, hl: 0.3, lw: 0.24 });
  for (let k = 0; k < 6; k++) { const lx = 19.8 + k * 3.2; fill(g, rect(lx, -52.2, lx + 2.6, -50.2), k % 2 ? '#3a1216' : '#2a3036'); fill(g, rect(lx + 0.2, -52.1, lx + 1.2, -51.6), 'rgba(255,255,255,0.25)'); }
  for (const sx of [20.6, 37.4]) { stroke(g, `M ${sx} -52.8 L ${sx} -55.2`, '#202328', 0.4); cel(g, ell(sx, -56.4, 1.5, 1.3), DARK, { sh: 0.3, hl: 0.4, lw: 0.2 }); fill(g, ell(sx - 0.9, -56.4, 0.4, 1.0), '#dfe6ec', 0.85); }
  cel(g, 'M 100 -60.6 L 104 -60.6 L 108 -64.6 L 108 -60 L 100 -60 Z', DARK, { sh: 0.3, hl: 0.3, lw: 0.2 });
  // the cab cannon: a small dome, its nozzle forward
  cel(g, 'M 27 -49.5 C 27 -52.6 29 -54.2 31.4 -54.2 C 33.8 -54.2 35.8 -52.6 35.8 -49.5 Z', BODY, { sh: 0.6, hl: 0.5 });
  g.save(); g.translate(29, -52.6); g.rotate(-0.12);
  cel(g, rect(-11, -0.7, 0, 0.7), STEEL, { sh: 0.3, hl: 0.4, gloss: 0.4, lw: 0.2 });
  cel(g, rect(-12.4, -1.0, -10.6, 1.0), DARK, { sh: 0.2, hl: 0.3, lw: 0.18 });
  g.restore();
  // the main turret: a ring on the roof, an armoured housing with its camera, the long nozzle
  cel(g, rect(62, -63, 86, -60.4), DARK, { sh: 0.3, hl: 0.3, lw: 0.24 });
  const TUR = 'M 64 -63 L 64.6 -68.4 C 64.8 -69.6 65.8 -70.4 67 -70.4 L 81.4 -70.4 C 82.8 -70.4 83.8 -69.6 84 -68.4 L 84.6 -63 Z';
  cel(g, TUR, BODY, { sh: 0.9, hl: 0.55 });
  Bk.inside(TUR, () => { Bk.line('M 65 -69.6 L 83.6 -69.6', 'rgba(240,244,250,0.5)', 0.3, 0.1); bolts([[66.4, -64.4], [82.2, -64.4], [74, -64.4]], 0.26); fill(g, rect(70, -66.8, 78, -65.2), '#b3232e'); });
  cel(g, rect(79.6, -73.2, 83.2, -70.4), DARK, { sh: 0.2, hl: 0.3, lw: 0.18 });
  fill(g, ell(80.4, -71.8, 0.8, 0.8), '#0a0b0d'); fill(g, ell(80.2, -72.0, 0.3, 0.3), '#4c6a86');
  g.save(); g.translate(66, -67); g.rotate(-0.08);
  cel(g, rect(-26, -1.0, 0, 1.0), STEEL, { sh: 0.4, hl: 0.5, gloss: 0.5, lw: 0.22 });
  for (const sx of [-8, -16]) cel(g, rect(sx - 0.6, -1.3, sx + 0.6, 1.3), DARK, { sh: 0.2, hl: 0.3, lw: 0.16 });
  cel(g, 'M -28.4 -1.6 L -25.6 -1.2 L -25.6 1.2 L -28.4 1.6 Z', DARK, { sh: 0.2, hl: 0.3, lw: 0.18 });
  Bk.line('M -27 1.6 C -27.4 3 -27.2 5 -27.6 7', 'rgba(200,214,226,0.35)', 0.2, 0.15);
  g.restore();
  for (const [ax, ay, ah] of [[41, -49.5, 16], [137, -60.6, 12]]) { stroke(g, `M ${ax} ${ay} L ${ax - 1.4} ${ay - ah}`, '#1a1c20', 0.24); fill(g, ell(ax, ay - 0.4, 0.6, 0.4), '#1a1c20'); }

  // --- the wheels: big tyres, their tread blocks round the edge, steel wheels, the hubs
  for (const wx of [28, 106, 126]) {
    Bk.dab(wx, -9.5, 11, 9, 'rgba(0,0,0,0.6)');
    cel(g, ell(wx, -9.5, 9.5, 9.5), RUB, { sh: 0.8, hl: 0.3 });
    Bk.inside(ell(wx, -9.5, 9.5, 9.5), () => {
      for (let k = 0; k < 28; k++) { const a = (k / 28) * Math.PI * 2; Bk.line(`M ${wx + Math.cos(a) * 8.0} ${-9.5 + Math.sin(a) * 8.0} L ${wx + Math.cos(a) * 9.6} ${-9.5 + Math.sin(a) * 9.6}`, 'rgba(0,0,0,0.6)', 0.5, 0.05); }
      Bk.line(`M ${wx - 7} -15 A 9 9 0 0 1 ${wx + 5} -17.6`, 'rgba(160,170,180,0.25)', 0.6, 0.3);
      Bk.fill(rect(wx - 10, -4, wx + 10, 1), 'rgba(40,32,24,0.5)', 0.6);
    });
    cel(g, ell(wx, -9.5, 5.2, 5.2), DARK, { sh: 0.6, hl: 0.4 });
    fill(g, ell(wx, -9.5, 4.2, 4.2), '#22262b');
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; fill(g, ell(wx + Math.cos(a) * 2.9, -9.5 + Math.sin(a) * 2.9, 0.42, 0.42), '#7c848e'); }
    cel(g, ell(wx, -9.5, 1.9, 1.9), STEEL, { sh: 0.4, hl: 0.5, lw: 0.2 });
    Bk.dab(wx - 1.6, -11.6, 1.4, 0.8, 'rgba(255,255,255,0.18)');
  }
  // the dark under the arches, over the tyres
  Bk.inside(CAB, () => Bk.dab(28, -18, 10, 4, 'rgba(0,0,0,0.5)'));
  Bk.inside(BOD, () => Bk.dab(116, -20, 22, 4, 'rgba(0,0,0,0.5)'));

  // --- a truck that has worked the streets
  for (const d of [CAB, BOD]) Bk.inside(d, () => {
    // its own water run down the sides and dried white
    for (let i = 0; i < 26; i++) { const px = (d === CAB ? 8 : 46) + r() * (d === CAB ? 34 : 100); Bk.line(`M ${px} ${-58 + r() * 8} C ${px + 0.3} -44 ${px - 0.2} -32 ${px + 0.2} ${-20 - r() * 6}`, 'rgba(226,232,236,0.14)', 0.3 + r() * 0.6, 0.3); }
    // rust from the seams and bolts
    for (let i = 0; i < 10; i++) { const px = (d === CAB ? 8 : 46) + r() * (d === CAB ? 34 : 100), py = -56 + r() * 20; Bk.line(`M ${px} ${py} C ${px + 0.4} ${py + 4} ${px - 0.2} ${py + 8} ${px + 0.3} ${py + 10 + r() * 8}`, 'rgba(126,68,36,0.42)', 0.4 + r() * 0.5, 0.3); }
    // road dirt thrown up the sides, heaviest behind each wheel
    const gr2 = g.createLinearGradient(0, -34, 0, -14); gr2.addColorStop(0, 'rgba(44,36,26,0)'); gr2.addColorStop(1, 'rgba(44,36,26,0.62)');
    g.fillStyle = gr2; g.fillRect(-10, -34, 170, 22);
    for (const wx of [28, 106, 126]) { Bk.dab(wx + 12, -18, 9, 6, 'rgba(52,40,28,0.55)', 1, 'source-over', 0.4); for (let i = 0; i < 26; i++) Bk.dab(wx + 4 + r() * 16, -14 - r() * 12, 0.3 + r() * 0.7, 0.2 + r() * 0.5, `rgba(${60 + r() * 20 | 0},${46 + r() * 14 | 0},32,${0.3 + r() * 0.35})`); }
    // dents catching the light on one side, shadow on the other
    for (let i = 0; i < 5; i++) { const px = (d === CAB ? 10 : 50) + r() * (d === CAB ? 28 : 90), py = -50 + r() * 26; Bk.dab(px, py, 1.4, 0.9, 'rgba(10,12,16,0.25)'); Bk.dab(px - 0.6, py - 0.6, 1.0, 0.6, 'rgba(230,236,244,0.18)'); }
    // scratches
    for (let i = 0; i < 12; i++) { const px = (d === CAB ? 8 : 46) + r() * (d === CAB ? 34 : 100), py = -56 + r() * 34, a = (r() - 0.5) * 0.6, L = 1.6 + r() * 4; Bk.line(`M ${px} ${py} l ${Math.cos(a) * L} ${Math.sin(a) * L}`, 'rgba(220,226,234,0.35)', 0.1, 0.03); }
  });
  Bk.inside(BOD, () => {
    // the black blister where a petrol bomb burst on the plate, the paint bubbled round it
    Bk.dab(132, -47, 7, 5, 'rgba(14,12,10,0.7)'); Bk.dab(131, -50, 4, 6, 'rgba(14,12,10,0.5)', 1, 'source-over', -0.3);
    for (let i = 0; i < 18; i++) { const a = r() * Math.PI * 2, d = 4 + r() * 4; Bk.dab(132 + Math.cos(a) * d, -47 + Math.sin(a) * d * 0.7, 0.3 + r() * 0.5, 0.3 + r() * 0.4, 'rgba(120,110,96,0.45)'); }
    Bk.line('M 128 -54 C 130 -58 131 -60 133 -61', 'rgba(14,12,10,0.4)', 2.4, 1.4);
    // a paint bomb's splash, white, washed down but not off
    Bk.dab(58, -48, 3.6, 2.6, 'rgba(232,230,222,0.5)');
    for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, d = 2 + r() * 5; Bk.dab(58 + Math.cos(a) * d, -48 + Math.sin(a) * d, 0.3 + r() * 0.6, 0.3 + r() * 0.5, 'rgba(232,230,222,0.45)'); }
    for (let i = 0; i < 7; i++) { const px = 55 + r() * 7; Bk.line(`M ${px} -46 C ${px + 0.2} -42 ${px - 0.2} -38 ${px + 0.1} ${-34 - r() * 6}`, 'rgba(232,230,222,0.3)', 0.4, 0.2); }
    Bk.dab(96, -54, 50, 4, 'rgba(10,12,16,0.25)');
  });
  g.restore();
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
  P('m3.truck', [1222, -78, 1392, 2], (g) => truck(g, 1236), deco);
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
