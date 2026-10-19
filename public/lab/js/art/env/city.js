// KOR LAB — the buildings: the street-side facades as separate
// pieces, laid out along a level so the street never repeats itself.
//
// docs §10.4: the furnace has been cold for four years and Vanta rations the
// power, so the street is lit the way such a street is lit: bare bulbs off a
// generator, a gas lamp behind a curtain, a fire in a ruin, the old sodium
// lamps; and Vanta's own light, white and red, clean and steady. The neon is
// from before and nearly all of it is dead. Signs are painted tin and wood,
// faded, bolted on a little crooked, lit at night by a lamp on an arm.
//
// Each building is painted in its own frame: x 0..w along the street, the
// pavement at y = 0, the roofline at y = -h, roof clutter above it. They sit
// in the background (no outline, saturation held low), so the play layer
// always reads first; the detail is in the shapes and the wear: brick,
// render, corrugated sheet and Vanta's clean cladding, each with its grain,
// soot from the roof down, rain streaks, dirt from the pavement up. Lights
// and glows each building throws are listed with it and placed by the scene.
import { fill, stroke, clip, rng, weatherOver } from '../kit.js';
import { C } from '../style.js';
import { texture } from '../tex.js';
import { emblem } from '../enemies/syndicate.js';
import { korMark } from './street.js';

const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

const P = {
  trim: '#2a2622', deep: '#1b1916', sill: '#5e5850', sillHi: '#776f64',
  brick: '#4f3630', brickHi: '#5f4137', brickLo: '#3b2925',
  render: '#4c4a45', renderHi: '#58554f', renderLo: '#3d3b37',
  sheet: '#3c4042', sheetHi: '#4d5254', sheetLo: '#2e3234', rust: '#6b4028', rustLo: '#4a2c1c',
  clad: '#5a6270', cladHi: '#6a7381', cladLo: '#48505c',
  metal: '#302e2b', metalHi: '#47433e',
  warm: '#f4b06a', warmLo: '#c4743f', cold: '#8fa2b0', coldLo: '#56687a',
  paper: '#d9d1bd', kraft: '#a88c62', cream: '#e4d4ac', chalk: '#dcd8cc', spray: '#e9e4d6',
};

// world units to device pixels at the current transform (blur radii are in pixels)
const ppu = (g) => { const m = g.getTransform(); return Math.hypot(m.a, m.b); };

// --- lettering -------------------------------------------------------------------
const FONT = {
  paint: (s) => `700 ${s}px 'Barlow Condensed'`,
  sten: (s) => `800 ${s}px 'Big Shoulders Stencil'`,
  type: (s) => `400 ${s}px 'Special Elite'`,
  print: (s) => `700 ${s}px Rajdhani`,
};

// Lettering set letter by letter: hand-painted ones sit a little off the
// line and lean (jit), a drop shadow in a second colour if asked. o: { kind,
// align, jit, seed, a, track (letter spacing in em), shadow: [colour, dx, dy] }
export function letters(g, text, x, y, size, c, o = {}) {
  const { kind = 'paint', align = 'left', jit = 0.05, seed = 1, a = 1, track = 0, shadow = null } = o;
  // set and measured at 64 px and scaled down: at a few px the browser rounds
  // the advances and small lettering falls apart
  const K = 64 / size;
  g.save(); g.font = FONT[kind](64); g.textBaseline = 'alphabetic'; g.textAlign = 'center';
  const chars = [...text], ws = chars.map((ch) => g.measureText(ch).width / K + track * size);
  const total = ws.reduce((s, v) => s + v, 0) - track * size;
  const x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const draw = (col, dx, dy, al) => {
    const r = rng(seed); let cx = x0;
    g.fillStyle = col; g.globalAlpha = al;
    chars.forEach((ch, i) => {
      const oy = (r() - 0.5) * jit * size, rot = (r() - 0.5) * jit * 0.7;
      g.save(); g.translate(cx + ws[i] / 2 + dx, y + oy + dy); g.rotate(rot); g.scale(1 / K, 1 / K); g.fillText(ch, 0, 0); g.restore();
      cx += ws[i];
    });
  };
  if (shadow) draw(shadow[0], shadow[1], shadow[2], a);
  draw(c, 0, 0, a);
  g.restore();
  return total;
}

// spray paint: soft-edged lettering, a couple of drips
function spray(g, text, x, y, size, c, o = {}) {
  const { rot = -0.05, a = 0.85, seed = 3, align = 'left' } = o;
  g.save(); g.translate(x, y); g.rotate(rot);
  g.shadowColor = c; g.shadowBlur = size * 0.14 * ppu(g);
  const w = letters(g, text, 0, 0, size, c, { align, jit: 0.12, seed, a });
  g.shadowBlur = 0;
  const r = rng(seed + 9), xs = align === 'center' ? -w / 2 : align === 'right' ? -w : 0;
  for (let k = 0; k < 3; k++) { const dx = xs + r() * w, l = size * (0.2 + r() * 0.5); fill(g, rect(dx, -size * 0.1, dx + size * 0.05, l), c, a * 0.7); }
  g.restore();
}

// --- small things on the walls ------------------------------------------------------
// an irregular patch (peeled render, rust, a burn): a jittered ellipse
function blob(x, y, w, h, r) {
  const pts = [];
  for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, s = 0.7 + r() * 0.45; pts.push([x + Math.cos(a) * w * 0.5 * s, y + Math.sin(a) * h * 0.5 * s]); }
  return poly(pts);
}

// a bare bulb hanging on its flex from (x, y - drop); halo: a soft glow baked
// round it (not on outlined props, where it would pick up the outline)
export function bulb(g, x, y, drop = 3, halo = true) {
  stroke(g, `M ${x} ${y - drop} L ${x} ${y - 0.9}`, '#0f0e0c', 0.22);
  fill(g, rect(x - 0.42, y - 1.2, x + 0.42, y - 0.4), '#3a3632');
  if (halo) { g.save(); g.globalCompositeOperation = 'lighter'; fill(g, ell(x, y + 0.3, 3.2, 3.2), '#ffb060', 0.08); g.restore(); }
  fill(g, ell(x, y + 0.3, 0.75, 0.9), '#ffe6b8');
  fill(g, ell(x, y + 0.25, 0.36, 0.45), '#fffaf0');
}

// a sign lamp on a swan-neck arm off the wall; the dish shade throws a cone
// of light down over the board below it
function swanLamp(g, x, y, dir = 1) {
  const hx = x + dir * 4, hy = y - 4.6;
  stroke(g, `M ${x} ${y} C ${x} ${y - 4} ${x + dir * 1.4} ${hy - 1.6} ${hx} ${hy - 0.8}`, P.deep, 0.5);
  fill(g, rect(x - 0.9, y - 0.4, x + 0.9, y + 1), P.deep);
  fill(g, poly([[hx - 2.6, hy + 0.9], [hx + 2.6, hy + 0.9], [hx + 1.2, hy - 1], [hx - 1.2, hy - 1]]), '#2f3b31');
  fill(g, poly([[hx - 2.6, hy + 0.9], [hx + 2.6, hy + 0.9], [hx + 2.2, hy + 0.4], [hx - 2.2, hy + 0.4]]), '#4c5a4e');
  fill(g, ell(hx, hy + 1, 2.2, 0.45), '#fff0d0');
  g.save(); g.globalCompositeOperation = 'lighter';
  fill(g, poly([[hx - 2.2, hy + 1], [hx + 2.2, hy + 1], [hx + 12, hy + 24], [hx - 12, hy + 24]]), '#ffcf8f', 0.06);
  fill(g, poly([[hx - 2, hy + 1], [hx + 2, hy + 1], [hx + 6, hy + 16], [hx - 6, hy + 16]]), '#ffcf8f', 0.05);
  g.restore();
}

// a painted board: tin (bolts, rust weeping from them) or wood (planks),
// paint lighter at the top and dirty at the foot
function board(g, x0, y0, x1, y1, c, o = {}) {
  const { wood = false, seed = 5, bolts = true } = o;
  const B = rect(x0, y0, x1, y1), r = rng(seed);
  fill(g, rect(x0 - 0.6, y0 - 0.6, x1 + 0.6, y1 + 0.6), '#14110e');
  fill(g, B, c);
  clip(g, B, () => {
    if (wood) {
      for (let y = y0 + 3.2; y < y1; y += 3.2) { fill(g, rect(x0, y - 0.3, x1, y + 0.1), '#000', 0.35); fill(g, rect(x0, y + 0.1, x1, y + 0.4), '#fff', 0.05); }
      texture(g, 'wood', 0.75, 2.4);
    } else texture(g, 'paint', 0.7, 2.6);
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, 'rgba(255,236,200,0.1)'); gr.addColorStop(0.6, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.3)');
    fill(g, B, gr);
  });
  if (bolts) for (const bx of [x0 + 1.4, x1 - 1.4]) for (const by of [y0 + 1.4, y1 - 1.4]) {
    fill(g, ell(bx, by, 0.4, 0.4), '#2a2520');
    if (!wood && r() < 0.7) fill(g, rect(bx - 0.2, by + 0.4, bx + 0.25, by + 2 + r() * 4), P.rust, 0.55);
  }
}

// wear over a painted board: chips where the paint has come off, a stain
function wear(g, x0, y0, x1, y1, under, seed = 7, n = 8) {
  const r = rng(seed);
  clip(g, rect(x0, y0, x1, y1), () => {
    for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), s = 0.4 + r() * 1.4; fill(g, blob(x, y, s * 2, s, r), under, 0.75); }
    texture(g, 'paint', 0.35, 2.6);
  });
}

// old neon: glass tubes bent into letters on a black box. lit: indices of
// letters that still catch (weak, warm), the rest dead grey glass
function oldNeon(g, chars, pos, size, lit = [], c = '#ff6a3d') {
  g.save(); g.font = FONT.print(size); g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.lineJoin = 'round';
  chars.forEach((ch, i) => {
    const [x, y] = pos[i];
    if (lit.includes(i)) {
      g.shadowColor = c; g.shadowBlur = size * 0.35 * ppu(g); g.strokeStyle = c; g.lineWidth = size * 0.1; g.strokeText(ch, x, y);
      g.shadowBlur = 0; g.strokeStyle = '#ffd6c4'; g.lineWidth = size * 0.035; g.strokeText(ch, x, y);
    } else {
      g.strokeStyle = '#41434a'; g.lineWidth = size * 0.09; g.strokeText(ch, x, y);
      g.strokeStyle = '#6a6d74'; g.lineWidth = size * 0.025; g.strokeText(ch, x - size * 0.02, y - size * 0.02);
    }
  });
  g.restore();
}

// Vanta's lightbox: a white face lit from inside, the ring-and-bar mark, the name
export function lightbox(g, x0, y0, x1, y1, text) {
  const h = y1 - y0;
  fill(g, rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1), '#2b2f36');
  const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#f5f8fb'); gr.addColorStop(1, '#d6dde6');
  fill(g, rect(x0, y0, x1, y1), gr);
  fill(g, rect(x0, y1 - h * 0.22, x1, y1), '#b3232e');
  emblem(g, x0 + h * 0.5, y0 + h * 0.4, h * 0.27, '#1d2129');
  letters(g, text, x0 + h * 1.0, y0 + h * 0.6, h * 0.42, '#1d2129', { kind: 'print', jit: 0, track: 0.08 });
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, rect(x0 - 3, y0 - 3, x1 + 3, y1 + 3), '#dfe9ff', 0.06); g.restore();
}

// Vanta's LED board: red dot-matrix lettering on black. lines: [text, y, size]
export function ledBoard(g, x0, y0, x1, y1, lines) {
  fill(g, rect(x0 - 0.9, y0 - 0.9, x1 + 0.9, y1 + 0.9), '#262a30');
  fill(g, rect(x0, y0, x1, y1), '#0a0a0b');
  clip(g, rect(x0, y0, x1, y1), () => {
    g.save(); g.shadowColor = '#ff2633'; g.shadowBlur = 0.6 * ppu(g);
    for (const [t, y, s] of lines) letters(g, t, (x0 + x1) / 2, y, s, '#ff3a44', { kind: 'print', align: 'center', jit: 0, track: 0.06 });
    g.restore();
    // the black between the diodes
    for (let x = x0; x < x1; x += 0.55) fill(g, rect(x, y0, x + 0.2, y1), '#0a0a0b');
    for (let y = y0; y < y1; y += 0.55) fill(g, rect(x0, y, x1, y + 0.2), '#0a0a0b');
  });
  fill(g, ell(x1 - 1, y0 + 1, 0.3, 0.3), '#5cff7a', 0.8);
}

// a pasted notice: Vanta's (white, red band, a stamp) or a paper (kind 'kayip':
// a missing person, a photo and lines of type); torn: bite off a corner
export function notice(g, x, y, w, h, kind, title, seed = 1, torn = false) {
  const r = rng(seed);
  const pts = [[x, y + r() * 0.5], [x + w, y], [x + w - r() * 0.5, y + h], [x + r() * 0.4, y + h - r() * 0.4]];
  if (torn) pts.splice(2, 1, [x + w - r() * 0.5, y + h * 0.45], [x + w * 0.55, y + h * 0.7], [x + w * 0.7, y + h]);
  const N = poly(pts);
  fill(g, N, kind === 'vanta' ? '#e6e5e1' : P.paper);
  clip(g, N, () => {
    if (kind === 'vanta') {
      fill(g, rect(x, y, x + w, y + h * 0.2), '#a8232d');
      emblem(g, x + w * 0.12, y + h * 0.1, h * 0.06, '#f1e9e9');
      letters(g, title, x + w / 2, y + h * 0.36, Math.min(h * 0.11, (w * 1.6) / title.length), '#1d2129', { kind: 'print', align: 'center', jit: 0 });
      for (let k = 0; k < 5; k++) fill(g, rect(x + w * 0.12, y + h * (0.46 + k * 0.08), x + w * (0.82 - (k === 4) * 0.3), y + h * (0.46 + k * 0.08) + h * 0.025), '#6c6f75', 0.8);
      g.save(); g.globalAlpha = 0.55; stroke(g, ell(x + w * 0.76, y + h * 0.84, w * 0.12, w * 0.12), '#a8232d', w * 0.03); g.restore();
    } else {
      letters(g, title, x + w / 2, y + h * 0.2, h * 0.14, '#2a1a14', { kind: 'type', align: 'center', jit: 0.02 });
      fill(g, rect(x + w * 0.24, y + h * 0.27, x + w * 0.76, y + h * 0.66), '#77736a');
      fill(g, ell(x + w * 0.5, y + h * 0.42, w * 0.11, h * 0.08), '#3e3b36');
      fill(g, `M ${x + w * 0.3} ${y + h * 0.66} C ${x + w * 0.32} ${y + h * 0.52} ${x + w * 0.68} ${y + h * 0.52} ${x + w * 0.7} ${y + h * 0.66} Z`, '#3e3b36');
      for (let k = 0; k < 3; k++) fill(g, rect(x + w * 0.15, y + h * (0.74 + k * 0.08), x + w * (0.85 - k * 0.12), y + h * (0.74 + k * 0.08) + h * 0.03), '#4a4640', 0.75);
    }
    fill(g, rect(x, y + h * 0.5, x + w, y + h * 0.53), '#000', 0.12);
    texture(g, 'canvas', 0.3, 2);
  });
  fill(g, ell(x + w / 2, y + 0.5, 0.25, 0.25), '#5a5650');
}

// a propaganda poster, pasted three to a wall: DÜZEN · GÜVENLİK · İTAAT
function vposter(g, x, y, w, h, seed = 1) {
  const r = rng(seed), N = poly([[x, y], [x + w, y + r() * 0.4], [x + w - r() * 0.4, y + h], [x + r() * 0.3, y + h]]);
  fill(g, N, '#8e2330');
  clip(g, N, () => {
    fill(g, rect(x, y + h * 0.68, x + w, y + h), '#1e2128');
    emblem(g, x + w / 2, y + h * 0.36, w * 0.24, '#f0dede');
    letters(g, 'İTAAT', x + w / 2, y + h * 0.88, w * 0.2, '#e9e4e4', { kind: 'print', align: 'center', jit: 0, track: 0.12 });
    texture(g, 'canvas', 0.35, 2);
    fill(g, rect(x, y + h * 0.3, x + w, y + h * 0.33), '#000', 0.15);
  });
}

// a hanging cable from (x0, y0) to (x1, y1) with a sag
function cable(g, x0, y0, x1, y1, sag = 6) {
  stroke(g, `M ${x0} ${y0} Q ${(x0 + x1) / 2} ${Math.max(y0, y1) + sag} ${x1} ${y1}`, '#100f0d', 0.45);
}

// a washing line with what is pegged on it
function laundry(g, x0, y0, x1, y1, seed, sag = 3) {
  const ym = Math.max(y0, y1) + sag, at = (t) => [x0 + (x1 - x0) * t, (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * ym + t * t * y1];
  stroke(g, `M ${x0} ${y0} Q ${(x0 + x1) / 2} ${ym} ${x1} ${y1}`, '#1a1815', 0.25);
  const r = rng(seed), cols = ['#6a5e50', '#4e5a66', '#7a3e30', '#b8ae96', '#5a5a44'];
  for (let t = 0.12; t < 0.9; t += 0.16 + r() * 0.1) {
    const [x, y] = at(t), c = cols[(r() * cols.length) | 0], k = r();
    if (k < 0.4) fill(g, poly([[x - 3, y], [x + 3, y], [x + 4.4, y + 1.6], [x + 2.6, y + 2.4], [x + 2.4, y + 7], [x - 2.4, y + 7], [x - 2.6, y + 2.4], [x - 4.4, y + 1.6]]), c);
    else if (k < 0.75) fill(g, rect(x - 2.2, y, x + 2.2, y + 5 + r() * 2), c);
    else { fill(g, rect(x - 0.8, y, x + 0.2, y + 3), c); fill(g, rect(x + 0.8, y, x + 1.8, y + 3), c); }
    fill(g, rect(x - 3, y, x + 3, y + 1.4), '#000', 0.15);
  }
}

// a stove's flue out through a window pane, up the wall to above the eaves,
// soot streaked up the bricks behind it, a little smoke at the top
function stovepipe(g, x, y, top, seed = 1) {
  fill(g, poly([[x - 1.4, y], [x + 1.4, y], [x + 3.6, top], [x - 3.6, top]]), '#0c0a08', 0.25);
  fill(g, ell(x, y, 1.6, 1.6), '#1d1b18'); fill(g, ell(x, y, 1, 1), '#0a0908');
  fill(g, rect(x - 0.9, top - 6, x + 0.9, y - 1.2), '#2b2925');
  fill(g, rect(x - 0.9, top - 6, x - 0.35, y - 1.2), '#46423c');
  for (let k = y - 7; k > top - 4; k -= 9) { fill(g, rect(x - 1.25, k, x + 1.25, k + 0.8), '#191714'); fill(g, rect(x - 2.6, k + 0.2, x - 1.25, k + 0.5), '#191714'); }
  fill(g, poly([[x - 2.2, top - 6.4], [x + 2.2, top - 6.4], [x + 1.2, top - 7.6], [x - 1.2, top - 7.6]]), '#2b2925');
  smoke(g, x, top - 8, seed);
}

// thin smoke off a stove: grey puffs drifting downwind, thinning out
function smoke(g, x, y, seed = 1, n = 6) {
  const r = rng(seed * 31 + 7);
  for (let k = 0; k < n; k++) fill(g, ell(x + k * k * 0.45 + r() * 1.5, y - k * 4, 1.4 + k * 1.1, 1.1 + k * 0.7), '#8d8780', 0.17 - k * 0.022);
}

function cornice(g, x0, x1, y, d = 3) {
  fill(g, rect(x0 - 1.5, y, x1 + 1.5, y + d), P.trim);
  fill(g, rect(x0 - 1.5, y, x1 + 1.5, y + 0.7), '#6a645a');
  fill(g, rect(x0, y + d, x1, y + d + 1.6), '#000', 0.28);
}

function pipe(g, x, y0, y1) {
  fill(g, rect(x - 0.9, y0, x + 0.9, y1), P.metal);
  fill(g, rect(x - 0.9, y0, x - 0.3, y1), P.metalHi);
  for (let y = y0 + 6; y < y1 - 2; y += 14) { fill(g, rect(x - 1.5, y, x + 1.5, y + 1.2), P.deep); fill(g, rect(x - 0.4, y + 1.2, x + 0.3, y + 4), P.rust, 0.5); }
  fill(g, poly([[x - 0.9, y1 - 3], [x + 0.9, y1 - 3], [x + 3, y1], [x - 0.9, y1]]), P.metal);
}

function waterTank(g, x, top) {
  for (const lx of [x + 2, x + 13]) fill(g, rect(lx, top - 10, lx + 1.2, top), P.deep);
  fill(g, poly([[x + 2, top - 10], [x + 14.2, top - 2], [x + 14.2, top - 0.8], [x + 2, top - 8.8]]), P.deep);
  const T = rect(x, top - 26, x + 16, top - 10);
  fill(g, T, '#4a3e36');
  clip(g, T, () => { for (let k = x + 2; k < x + 16; k += 2.2) fill(g, rect(k, top - 26, k + 0.3, top - 10), '#2e2620', 0.6); texture(g, 'wood', 0.6, 2); });
  fill(g, rect(x, top - 26, x + 3, top - 10), '#fff', 0.06);
  for (const y of [top - 22, top - 15]) fill(g, rect(x - 0.3, y, x + 16.3, y + 0.9), P.deep);
  fill(g, poly([[x - 1, top - 26], [x + 8, top - 31], [x + 17, top - 26]]), '#34302c');
}

function antenna(g, x, top, h = 18) {
  stroke(g, `M ${x} ${top} L ${x} ${top - h}`, P.deep, 0.7);
  for (let k = 1; k <= 3; k++) stroke(g, `M ${x - 4 + k} ${top - h + k * 4} L ${x + 4 - k} ${top - h + k * 4}`, P.deep, 0.5);
}

// a chimney stack with a cowl, smoke if someone below has the stove going
function chimney(g, x, top, smoking = true, seed = 1) {
  fill(g, rect(x, top - 12, x + 7, top), '#3e2c27');
  clip(g, rect(x, top - 12, x + 7, top), () => { for (let y = top - 10; y < top; y += 2.4) stroke(g, `M ${x} ${y} L ${x + 7} ${y}`, '#2a1e1a', 0.25); });
  fill(g, rect(x - 0.6, top - 13.4, x + 7.6, top - 12), '#2a2622');
  fill(g, rect(x + 2.4, top - 16, x + 4.6, top - 13.4), '#24211e');
  if (smoking) smoke(g, x + 3.5, top - 18, seed);
}

// the cells' mark and their word, sprayed over whatever Vanta put up
function korSpray(g, x, y, s = 1) {
  korMark(g, x, y, 3.4 * s, 0.8);
}

// a scribbled tag
function tag(g, x, y, c, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  stroke(g, 'M 0 0 C 2 -5 4 -5 4 -1 C 4 2 7 2 8 -3 M 9 -4 C 9 0 11 1 13 -2 C 14 -4 16 -4 16 -1', c, 0.9, 0.7);
  stroke(g, 'M -1 2.4 L 17 1.4', c, 0.5, 0.5);
  g.restore();
}

// --- walls ------------------------------------------------------------------------
// Every wall gets the same last pass: soot from the roof down, its edges
// darker where it meets the next building, rain run down it, dirt at its foot.
function weather(g, x0, x1, top, seed = 1, k = 1) {
  const W = rect(x0, top, x1, 0);
  const a = g.createLinearGradient(0, top, 0, top + 50);
  a.addColorStop(0, `rgba(8,6,4,${0.5 * k})`); a.addColorStop(1, 'rgba(8,6,4,0)');
  fill(g, W, a);
  const b = g.createLinearGradient(x0, 0, x1, 0);
  b.addColorStop(0, `rgba(0,0,0,${0.32 * k})`); b.addColorStop(0.07, 'rgba(0,0,0,0)'); b.addColorStop(0.93, 'rgba(0,0,0,0)'); b.addColorStop(1, `rgba(0,0,0,${0.32 * k})`);
  fill(g, W, b);
  const r = rng(seed * 7 + 3);
  clip(g, W, () => { for (let x = x0 + 2; x < x1 - 1; x += 2 + r() * 7) { const y = top + r() * 14, l = 12 + r() * 50; fill(g, rect(x, y, x + 0.4 + r() * 0.9, y + l), '#000', (0.05 + r() * 0.07) * k); } });
  grime(g, x0, x1, 7, seed);
}

function grime(g, x0, x1, h = 7, seed = 1) {
  fill(g, rect(x0, -h, x1, 0), '#000', 0.2);
  fill(g, rect(x0, -2.2, x1, 0), '#000', 0.25);
  const r = rng(seed);
  for (let x = x0 + 3; x < x1 - 2; x += 5 + r() * 9) fill(g, rect(x, -h - r() * 6, x + 0.8 + r() * 1.2, -h + 1), '#000', 0.14);
}

// bricks: courses, staggered joints, a few lighter and darker bricks, the grain
function brickWall(g, x0, x1, top, seed, c = P.brick) {
  const W = rect(x0, top, x1, 0);
  fill(g, W, c);
  clip(g, W, () => {
    const r = rng(seed);
    for (let i = 0; i < ((x1 - x0) * -top) / 40; i++) {
      const x = x0 + Math.floor(r() * ((x1 - x0) / 6)) * 6 + ((Math.floor(r() * 40) % 2) * 3), y = top + Math.floor(r() * (-top / 3)) * 3;
      fill(g, rect(x, y + 0.3, x + 5.6, y + 2.8), r() > 0.5 ? P.brickHi : P.brickLo, 0.55 + r() * 0.3);
    }
    for (let y = top + 3; y < 0; y += 3) {
      fill(g, rect(x0, y - 0.25, x1, y + 0.2), '#2a1d1a', 0.6);
      const off = Math.round((y - top) / 3) % 2 ? 3 : 0;
      for (let x = x0 + off; x < x1; x += 6) fill(g, rect(x, y - 3, x + 0.35, y), '#2a1d1a', 0.45);
    }
    texture(g, 'concrete', 0.55, 2.4);
  });
}

// cement render over brick: patches where it has come away and the brick shows
function renderWall(g, x0, x1, top, c, seed, peel = 4) {
  const W = rect(x0, top, x1, 0);
  fill(g, W, c);
  clip(g, W, () => {
    texture(g, 'concrete', 0.55, 3);
    const r = rng(seed);
    for (let i = 0; i < peel; i++) {
      const x = x0 + 8 + r() * (x1 - x0 - 24), y = top + 14 + r() * (-top - 34), w = 8 + r() * 16, h = 5 + r() * 9;
      const d = blob(x, y, w, h, r);
      fill(g, d, P.brick);
      clip(g, d, () => {
        for (let yy = y - h; yy < y + h; yy += 2.4) { stroke(g, `M ${x - w} ${yy} L ${x + w} ${yy}`, '#6a5a4e', 0.3, 0.55); const off = Math.round(yy / 2.4) % 2 ? 2.4 : 0; for (let xx = x - w + off; xx < x + w; xx += 4.8) stroke(g, `M ${xx} ${yy} L ${xx} ${yy + 2.4}`, '#6a5a4e', 0.25, 0.45); }
        fill(g, d, '#000', 0.12);
      });
      stroke(g, d, '#000', 0.5, 0.25);
      g.save(); g.translate(-0.35, -0.35); stroke(g, d, '#fff', 0.3, 0.08); g.restore();
    }
  });
}

// corrugated sheet: ribs, laps with their rivets, rust weeping from them
function sheetWall(g, x0, x1, top, seed) {
  const W = rect(x0, top, x1, 0);
  fill(g, W, P.sheet);
  clip(g, W, () => {
    for (let x = x0; x < x1; x += 3) { fill(g, rect(x, top, x + 1.1, 0), P.sheetLo, 0.85); fill(g, rect(x + 1.1, top, x + 1.6, 0), P.sheetHi, 0.7); }
    const r = rng(seed);
    for (let i = 0; i < 9; i++) { const x = x0 + r() * (x1 - x0), y = top + r() * -top, s = 6 + r() * 18; fill(g, blob(x, y, s, s * (0.5 + r() * 0.6), r), r() < 0.5 ? P.rust : P.rustLo, 0.35 + r() * 0.25); }
    for (let y = top + 30; y < -6; y += 30) {
      fill(g, rect(x0, y, x1, y + 0.7), P.deep, 0.75); fill(g, rect(x0, y + 0.7, x1, y + 1), P.sheetHi, 0.4);
      for (let x = x0 + 1.5; x < x1; x += 6) { fill(g, ell(x, y + 1.6, 0.3, 0.3), '#1a1c1d'); if (r() < 0.35) fill(g, rect(x - 0.2, y + 1.9, x + 0.25, y + 3 + r() * 9), P.rust, 0.6); }
    }
    texture(g, 'steel', 0.6, 2.4);
  });
}

// Vanta's cladding: big composite panels, bolted, new; the only clean wall in town
function cladWall(g, x0, x1, y0, y1) {
  const W = rect(x0, y0, x1, y1);
  fill(g, W, P.clad);
  clip(g, W, () => {
    const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(255,255,255,0.06)'); gr.addColorStop(1, 'rgba(0,0,0,0.12)');
    fill(g, W, gr);
    for (let x = x0 + 30; x < x1; x += 30) fill(g, rect(x - 0.3, y0, x + 0.3, y1), P.cladLo);
    for (let y = y0 + 26; y < y1; y += 26) fill(g, rect(x0, y - 0.3, x1, y + 0.3), P.cladLo);
    for (let x = x0; x <= x1; x += 30) for (let y = y0; y <= y1; y += 26) for (const [dx, dy] of [[1.4, 1.4], [-1.4, 1.4], [1.4, -1.4], [-1.4, -1.4]]) fill(g, ell(x + dx, y + dy, 0.28, 0.28), P.cladLo);
    texture(g, 'paint', 0.3, 3);
  });
}

// coiled razor wire along y from x0 to x1
export function razor(g, x0, x1, y) {
  for (let x = x0 + 1, i = 0; x < x1; x += 1.7, i++) stroke(g, ell(x, y + (i % 2) * 0.4, 1.9 + (i % 3) * 0.3, 2.3 + (i % 2) * 0.3), i % 2 ? '#8a8e94' : '#5e6268', 0.16, 0.85);
  stroke(g, `M ${x0} ${y + 1.6} L ${x1} ${y + 1.6}`, '#4a4e54', 0.25);
}

// cut stone: ashlar courses, each block its own shade, kept clean
function stoneWall(g, x0, x1, top, seed, c = '#5c574c') {
  const W = rect(x0, top, x1, 0);
  fill(g, W, c);
  clip(g, W, () => {
    const r = rng(seed);
    for (let y = top, i = 0; y < 0; y += 6, i++) for (let x = x0 - (i % 2) * 7; x < x1; x += 14) fill(g, rect(x + 0.2, y + 0.2, x + 13.8, y + 5.8), r() < 0.5 ? '#fff' : '#000', 0.03 + r() * 0.04);
    for (let y = top + 6, i = 1; y < 0; y += 6, i++) {
      fill(g, rect(x0, y - 0.2, x1, y + 0.2), '#2e2b25', 0.7);
      for (let x = x0 - (i % 2) * 7; x < x1; x += 14) fill(g, rect(x - 0.15, y, x + 0.15, y + 6), '#2e2b25', 0.55);
    }
    texture(g, 'concrete', 0.5, 3);
  });
}

// --- windows and doors -----------------------------------------------------------------
// a window with its frame, lintel and sill; kind: warm, curtain, gas, blind,
// cold, dark, taped, broken, boarded, ember
function win(g, x, y, w, h, kind, bars = true) {
  fill(g, rect(x - 1.2, y - 2.4, x + w + 1.2, y - 1), P.sill);
  fill(g, rect(x - 0.9, y - 0.9, x + w + 0.9, y + h + 0.9), P.trim);
  const W = rect(x, y, x + w, y + h);
  if (kind === 'warm' || kind === 'blind' || kind === 'curtain' || kind === 'gas') {
    const gas = kind === 'gas';
    const gr = g.createRadialGradient(x + w * 0.5, y + h * 0.65, 0, x + w * 0.5, y + h * 0.65, w * 0.9);
    gr.addColorStop(0, gas ? '#e8a35c' : '#ffd29a'); gr.addColorStop(1, gas ? '#6e3f22' : P.warmLo);
    fill(g, W, gr);
    if (kind === 'blind') for (let k = y + 1.2; k < y + h; k += 1.7) fill(g, rect(x, k, x + w, k + 0.6), '#9a5a36', 0.55);
    if (kind === 'curtain' || gas) {
      const cc = gas ? '#5a3424' : '#7a4630';
      fill(g, poly([[x, y], [x + w * 0.4, y], [x + w * 0.3, y + h * 0.5], [x + w * 0.36, y + h], [x, y + h]]), cc, 0.92);
      fill(g, poly([[x + w, y], [x + w * 0.62, y], [x + w * 0.72, y + h * 0.5], [x + w * 0.66, y + h], [x + w, y + h]]), cc, 0.92);
      for (const fx of [0.1, 0.22, 0.8, 0.9]) fill(g, rect(x + w * fx, y, x + w * fx + 0.4, y + h), '#000', 0.2);
    }
    g.save(); g.globalCompositeOperation = 'lighter'; fill(g, rect(x - 2.5, y - 2.5, x + w + 2.5, y + h + 2.5), '#ff9a5c', gas ? 0.04 : 0.07); g.restore();
  } else if (kind === 'cold') {
    fill(g, W, P.coldLo); fill(g, rect(x, y, x + w, y + h * 0.5), P.cold, 0.5);
    fill(g, rect(x + w * 0.2, y + h * 0.35, x + w * 0.42, y + h), '#26303a', 0.7);
  } else if (kind === 'broken') {
    fill(g, W, '#0e0d0c');
    clip(g, W, () => {
      fill(g, poly([[x, y], [x + w * 0.45, y], [x + w * 0.2, y + h * 0.35], [x, y + h * 0.5]]), '#2d2f33');
      fill(g, poly([[x + w, y + h], [x + w * 0.6, y + h], [x + w * 0.85, y + h * 0.6]]), '#2d2f33');
    });
  } else if (kind === 'boarded') {
    fill(g, W, '#121110');
    for (const [a, b] of [[0.15, 0.3], [0.55, 0.7]]) fill(g, poly([[x - 0.6, y + h * a], [x + w + 0.6, y + h * (a - 0.12)], [x + w + 0.6, y + h * (b - 0.12)], [x - 0.6, y + h * b]]), '#574535');
    clip(g, W, () => texture(g, 'wood', 0.6, 2));
  } else if (kind === 'ember') {
    fill(g, W, '#1c0b07');
    fill(g, rect(x, y + h * 0.45, x + w, y + h), '#7a2a12');
    fill(g, rect(x, y + h * 0.75, x + w, y + h), '#c4441a');
  } else {
    fill(g, W, '#17181b');
    fill(g, poly([[x, y], [x + w * 0.42, y], [x, y + h * 0.62]]), '#262830');
    if (kind === 'taped') for (const d of [`M ${x} ${y} L ${x + w} ${y + h}`, `M ${x + w} ${y} L ${x} ${y + h}`]) stroke(g, d, '#bdb197', 0.9, 0.7);
  }
  if (bars && kind !== 'broken' && kind !== 'boarded') {
    fill(g, rect(x + w / 2 - 0.35, y, x + w / 2 + 0.35, y + h), P.trim);
    fill(g, rect(x, y + h * 0.42 - 0.35, x + w, y + h * 0.42 + 0.35), P.trim);
  }
  if (kind !== 'boarded') recess(g, x, y, w, h, kind !== 'broken' && kind !== 'ember');
  fill(g, rect(x - 1.8, y + h + 0.9, x + w + 1.8, y + h + 2.2), P.sill);
  fill(g, rect(x - 1.8, y + h + 0.9, x + w + 1.8, y + h + 1.3), P.sillHi);
  washDown(g, x - 1.8, x + w + 1.8, y + h + 2.2);
}

// a window set back in its wall: the reveal's shadow along the top and the far
// side; on glass, the cold of the sky sliding across it
function recess(g, x, y, w, h, glass = true) {
  const W = rect(x, y, x + w, y + h);
  const tg = g.createLinearGradient(0, y, 0, y + Math.min(h * 0.3, 3.2));
  tg.addColorStop(0, 'rgba(0,0,0,0.6)'); tg.addColorStop(1, 'rgba(0,0,0,0)');
  fill(g, W, tg);
  const sg = g.createLinearGradient(x, 0, x + Math.min(w * 0.25, 1.8), 0);
  sg.addColorStop(0, 'rgba(0,0,0,0.45)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  fill(g, W, sg);
  if (glass) {
    const sk = g.createLinearGradient(x, y, x + w, y + h);
    sk.addColorStop(0.3, 'rgba(160,180,210,0)'); sk.addColorStop(0.45, 'rgba(160,180,210,0.1)'); sk.addColorStop(0.6, 'rgba(160,180,210,0)');
    fill(g, W, sk);
  }
}
// Heavy cloth hanging from its rod, wet, over what is already painted in B
// (x0..x1, y0..y1): soft folds down its length (a shadowed trough beside a lit
// ridge, swaying a little), the cloth gathered dark under the rod, its edges
// turning away, the rain soaked into its lower half.
export function drape(g, B, x0, x1, y0, y1, seed = 1) {
  const r = rng(seed), M0 = g.getTransform(), k = Math.hypot(M0.a, M0.b);
  clip(g, B, () => {
    g.save(); g.filter = `blur(${(0.8 * k).toFixed(2)}px)`;
    const n = Math.max(3, Math.round((x1 - x0) / 4.5));
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + 0.3 + r() * 0.4) * (x1 - x0) / n, w = 0.7 + r() * 0.8, sw = (r() - 0.5) * 1.4;
      g.globalAlpha = 0.36; g.fillStyle = '#000';
      g.beginPath(); g.moveTo(x - w, y0); g.lineTo(x + w, y0); g.lineTo(x + w + sw, y1 + 2); g.lineTo(x - w + sw, y1 + 2); g.fill();
      g.globalAlpha = 0.16; g.fillStyle = '#ffd8d8';
      g.beginPath(); g.moveTo(x + w + 0.3, y0); g.lineTo(x + w + 1.3, y0); g.lineTo(x + w + 1.3 + sw, y1 + 2); g.lineTo(x + w + 0.3 + sw, y1 + 2); g.fill();
    }
    g.restore();
    const gt = g.createLinearGradient(0, y0, 0, y0 + 4); gt.addColorStop(0, 'rgba(0,0,0,0.55)'); gt.addColorStop(1, 'rgba(0,0,0,0)');
    fill(g, rect(x0 - 2, y0, x1 + 2, y0 + 4), gt);
    const sk = g.createLinearGradient(x0, 0, x1, 0); sk.addColorStop(0, 'rgba(0,0,0,0.28)'); sk.addColorStop(0.2, 'rgba(0,0,0,0)'); sk.addColorStop(0.8, 'rgba(0,0,0,0)'); sk.addColorStop(1, 'rgba(0,0,0,0.32)');
    fill(g, rect(x0 - 2, y0, x1 + 2, y1 + 8), sk);
    const wt = g.createLinearGradient(0, y0, 0, y1); wt.addColorStop(0.5, 'rgba(0,0,0,0)'); wt.addColorStop(1, 'rgba(24,0,4,0.38)');
    fill(g, rect(x0 - 2, y0, x1 + 2, y1 + 8), wt);
  });
}

// under a sill or a ledge from x0 to x1 at y: its shadow on the wall, and the
// dirt the rain has washed down off its ends
function washDown(g, x0, x1, y) {
  const dg = g.createLinearGradient(0, y, 0, y + 1.8);
  dg.addColorStop(0, 'rgba(0,0,0,0.45)'); dg.addColorStop(1, 'rgba(0,0,0,0)');
  fill(g, rect(x0, y, x1, y + 1.8), dg);
  for (const sx of [x0 + 0.4, x1 - 1.3]) {
    const L = 6 + ((sx * 7.3) % 5), st = g.createLinearGradient(0, y, 0, y + L);
    st.addColorStop(0, 'rgba(14,12,10,0.32)'); st.addColorStop(1, 'rgba(14,12,10,0)');
    fill(g, `M ${sx} ${y} L ${sx + 0.9} ${y} L ${sx + 0.65} ${y + L} L ${sx + 0.25} ${y + L} Z`, st);
  }
}

// a flower box on a sill: geraniums someone still waters
function sillBox(g, x, y, w) {
  fill(g, rect(x, y - 2.2, x + w, y), '#4a3a2a');
  const r = rng(x | 0);
  for (let k = x + 1; k < x + w - 0.5; k += 1.4) { fill(g, ell(k, y - 2.8 - r() * 1.2, 1, 0.9), '#3e4a32'); if (r() < 0.4) fill(g, ell(k, y - 4 - r(), 0.5, 0.5), '#a8382c'); }
}

function door(g, x, w, h, light = true) {
  fill(g, rect(x - 1.4, -h - 1.4, x + w + 1.4, 0), P.trim);
  const D = rect(x, -h, x + w, 0);
  fill(g, D, '#2a241f');
  clip(g, D, () => texture(g, 'wood', 0.55, 2));
  fill(g, rect(x + 1, -h + 1, x + w - 1, -h * 0.55), '#1c1a17');
  fill(g, rect(x + w - 2.4, -h * 0.5, x + w - 1.4, -h * 0.5 + 1.4), '#8d8577');
  fill(g, rect(x - 2.2, -1.2, x + w + 2.2, 0), P.sill);
  if (light) {
    bulb(g, x + w / 2, -h - 2.6, 1.8);
    g.save(); g.globalCompositeOperation = 'lighter';
    fill(g, poly([[x + w / 2 - 1.2, -h - 2], [x + w / 2 + 1.2, -h - 2], [x + w + 4, -h + 12], [x - 4, -h + 12]]), '#ffcf8f', 0.07);
    g.restore();
  }
}

// a roller shutter from y0 down to y1, the slats, a padlocked bottom bar
function shutter(g, x0, x1, y0, y1) {
  const S = rect(x0, y0, x1, y1);
  fill(g, S, '#4a4a48');
  clip(g, S, () => {
    for (let y = y0 + 0.5; y < y1; y += 2.1) { fill(g, rect(x0, y, x1, y + 0.55), '#2e2e2d', 0.9); fill(g, rect(x0, y + 0.55, x1, y + 0.9), '#5e5d58', 0.6); }
    const r = rng(x0 | 0);
    for (let i = 0; i < 6; i++) fill(g, blob(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 6 + r() * 12, 3 + r() * 5, r), P.rust, 0.35);
    texture(g, 'steel', 0.5, 2.2);
  });
  fill(g, rect(x0, y1 - 1.4, x1, y1), '#2a2a29');
}

// --- signs that belong to one place ---------------------------------------------------
// HAWK's board: green-painted planks, a hawk and his name in cream with an
// oxblood shadow, ALIM · SATIM / TAKAS to the right when there is room
export function hawkSign(g, x0, y0, x1, y1, sub = true) {
  const h = y1 - y0, w = x1 - x0;
  board(g, x0, y0, x1, y1, '#2c3a2f', { wood: true, seed: 17 });
  const s = h / 20;
  g.save(); g.translate(x0 + 3 * s, y0 + 2 * s); g.scale(s, s);
  // a hawk seen from below: spread wings with their fingered tips, the fan of the tail
  const BIRD = 'M 8 1.6 C 8.8 1.6 9.2 2.4 9.1 3.4 L 10.6 4.2 C 12.6 3.8 14.6 4.4 16 5.6 L 14.8 6 L 15.4 6.8 L 14 6.8 L 14.4 7.6 L 12.8 7.4 C 11.6 7.6 10.6 8 9.8 8.8 L 10.8 12.6 L 8 13.6 L 5.2 12.6 L 6.2 8.8 C 5.4 8 4.4 7.6 3.2 7.4 L 1.6 7.6 L 2 6.8 L 0.6 6.8 L 1.2 6 L 0 5.6 C 1.4 4.4 3.4 3.8 5.4 4.2 L 6.9 3.4 C 6.8 2.4 7.2 1.6 8 1.6 Z';
  fill(g, BIRD, '#5a2420'); g.translate(-0.6, -0.6); fill(g, BIRD, P.cream);
  g.restore();
  const big = h * 0.78;
  const tw = letters(g, 'HAWK', x0 + 21 * s, y1 - h * 0.19, big, P.cream, { kind: 'paint', jit: 0.035, seed: 3, track: 0.04, shadow: ['#5a2420', 0.55 * s, 0.55 * s] });
  if (sub && w > 60 * s) {
    const sx = x0 + 21 * s + tw + 6 * s;
    letters(g, 'ALIM · SATIM', sx, y0 + h * 0.46, h * 0.3, P.cream, { kind: 'paint', jit: 0.04, seed: 5, track: 0.06, shadow: ['#5a2420', 0.35 * s, 0.35 * s] });
    letters(g, 'TAMİR · TAKAS', sx, y0 + h * 0.84, h * 0.3, '#c9b48a', { kind: 'paint', jit: 0.04, seed: 8, track: 0.06 });
  }
  wear(g, x0, y0, x1, y1, '#4a3a28', 21, 10);
}

// a chalkboard on the wall: wooden frame, chalk writing, the smudge of yesterday's
function chalkboard(g, x0, y0, x1, y1, lines) {
  fill(g, rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1), '#4a3624');
  const B = rect(x0, y0, x1, y1);
  fill(g, B, '#22282a');
  const r = rng(x0 | 0);
  clip(g, B, () => {
    for (let i = 0; i < 6; i++) fill(g, blob(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 6, 3, r), '#fff', 0.05);
    texture(g, 'concrete', 0.3, 1.2);
  });
  for (const [t, x, y, s, al] of lines) letters(g, t, x, y, s, P.chalk, { kind: 'paint', jit: 0.12, seed: (x * 7 + y) | 0, align: al || 'left', a: 0.9 });
}

// --- the buildings -------------------------------------------------------------------
// workers' housing: sooty brick, a fire escape, stovepipes out of the
// windows, washing; a closed barber below
function walkup(g) {
  const w = 150, h = 100;
  brickWall(g, 0, w, -h, 11);
  cornice(g, 0, w, -h - 3, 3);
  cornice(g, 0, w, -66, 2);
  const kinds = [['gas', 'taped', 'curtain', 'dark'], ['dark', 'curtain', 'dark', 'cold']];
  kinds.forEach((row, j) => row.forEach((k, i) => win(g, 12 + i * 34, j ? -54 : -90, 15, 18, k)));
  sillBox(g, 10, -69.8, 19);
  stovepipe(g, 121.5, -84, -h - 3, 2);
  // fire escape: platforms, rails, the drop ladder
  for (const y of [-64, -30]) {
    fill(g, rect(42, y, 96, y + 1.6), P.deep);
    for (let x = 43; x < 96; x += 3) fill(g, rect(x, y - 7, x + 0.6, y), P.deep);
    fill(g, rect(42, y - 7.4, 96, y - 6.6), P.deep);
    for (const bx of [46, 90]) stroke(g, `M ${bx} ${y + 1.6} L ${bx + 5} ${y + 7}`, P.deep, 0.8);
  }
  fill(g, poly([[88, -30], [94, -30], [78, -64], [72, -64]]), P.deep);
  for (let k = 0; k < 8; k++) { const t = k / 8; stroke(g, `M ${72 + t * 16} ${-64 + t * 34} L ${78 + t * 16} ${-64 + t * 34}`, '#2b2724', 0.4); }
  for (const x of [52, 56]) fill(g, rect(x, -30, x + 0.7, -14), P.deep);
  laundry(g, 43, -71.5, 95, -71.5, 4, 2);
  // the barber: shutter down, his painted sign, the striped pole (no motor now)
  fill(g, rect(6, -30, 42, 0), P.trim);
  shutter(g, 8, 40, -28, 0);
  board(g, 6, -37, 42, -30.4, '#2e3b4c', { seed: 9 });
  letters(g, 'BERBER', 24, -31.6, 5.6, P.cream, { align: 'center', seed: 4, track: 0.1 });
  wear(g, 6, -37, 42, -30.4, '#4a4440', 13, 6);
  fill(g, rect(44, -30, 49, -28.6), P.deep); fill(g, rect(44.6, -28.6, 48.4, -14), '#d9d2c2');
  clip(g, rect(44.6, -28.6, 48.4, -14), () => { for (let y = -32; y < -10; y += 3.2) fill(g, poly([[44.6, y], [48.4, y + 2.4], [48.4, y + 3.8], [44.6, y + 1.4]]), '#8e2b26'); fill(g, rect(44.6, -28.6, 46, -14), '#000', 0.2); });
  fill(g, rect(44, -14, 49, -12.8), P.deep);
  // the entrance and its stoop
  door(g, 112, 14, 24);
  fill(g, rect(108, -3, 130, 0), '#57534c'); fill(g, rect(110, -5, 128, -3), '#4a4640');
  notice(g, 62, -26, 9, 12, 'kayip', 'KAYIP', 3);
  vposter(g, 73, -27, 10, 14, 4); korSpray(g, 78, -20, 0.9);
  spray(g, 'KOR', 92, -8, 6, C.ember, { rot: -0.08, seed: 5 });
  pipe(g, 6, -h, -30);
  weather(g, 0, w, -h, 3);
  // roof
  waterTank(g, 20, -h - 3); chimney(g, 62, -h - 3, true, 4); antenna(g, 136, -h - 3, 16);
  cable(g, 0, -74, 40, -72, 5);
}

// rendered walk-up: balconies, shutters, render coming off; the corner bakkal
// below with one bulb and half-empty shelves
function walkupB(g) {
  const w = 128, h = 110;
  renderWall(g, 0, w, -h, '#4f4a40', 7, 5);
  for (let y = -h + 20; y < -30; y += 36) fill(g, rect(0, y, w, y + 1), '#000', 0.2);
  cornice(g, 0, w, -h - 3, 3);
  const kinds = [['dark', 'curtain', 'dark'], ['gas', 'dark', 'boarded']];
  kinds.forEach((row, j) => row.forEach((k, i) => {
    const x = 14 + i * 38, y = j ? -64 : -98;
    win(g, x, y, 14, 20, k);
    if (k === 'dark') { fill(g, rect(x - 5, y, x - 1.2, y + 20), '#34413a'); fill(g, rect(x + 15.2, y, x + 19, y + 20), '#34413a'); for (const sx of [x - 5, x + 15.2]) for (let yy = y + 1; yy < y + 20; yy += 1.6) fill(g, rect(sx, yy, sx + 3.8, yy + 0.5), '#1f2622', 0.7); }
    fill(g, rect(x - 4, y + 22, x + 18, y + 24), P.trim);
    for (let k2 = x - 3; k2 < x + 18; k2 += 2.4) fill(g, rect(k2, y + 15, k2 + 0.5, y + 22), P.deep);
    fill(g, rect(x - 4, y + 14.6, x + 18, y + 15.6), P.deep);
  }));
  laundry(g, 9, -82, 33, -82, 7, 2.4);
  stovepipe(g, 40, -52, -h - 3, 6);
  // the bakkal: one bulb inside, the shelves half bare, a note in the window
  fill(g, rect(8, -34, 90, 0), P.trim);
  const SW = rect(10, -30, 60, -6);
  const gr = g.createRadialGradient(35, -26, 0, 35, -20, 30); gr.addColorStop(0, '#f2c084'); gr.addColorStop(1, '#6a3c20');
  fill(g, SW, gr);
  clip(g, SW, () => {
    for (const y of [-22, -14]) fill(g, rect(10, y, 60, y + 0.8), '#3a2416');
    for (const [x, y, ww, hh, c] of [[13, -22, 3, 4, '#5a6a4a'], [17, -22, 3, 5, '#7a3a2a'], [44, -22, 4, 3, '#c9a95a'], [21, -14, 5, 4, '#7a5a3a'], [27, -14, 3, 3, '#4a5a6a']]) fill(g, rect(x, y - hh, x + ww, y), c);
    bulb(g, 35, -27, 3);
  });
  for (const x of [26, 43]) fill(g, rect(x, -30, x + 0.8, -6), P.trim);
  g.save(); g.translate(48, -12); g.rotate(-0.06); fill(g, rect(-6, -4, 6, 3), P.kraft); letters(g, 'EKMEK', 0, -0.6, 2.6, '#1e1a16', { align: 'center', seed: 2, jit: 0.1 }); letters(g, 'YOK', 0, 2.2, 2.6, '#1e1a16', { align: 'center', seed: 3, jit: 0.1 }); g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, rect(6, -34, 64, 0), '#ff9a5c', 0.05); g.restore();
  door(g, 68, 14, 26, false);
  board(g, 6, -43, 92, -34.6, '#7a2a24', { seed: 3 });
  letters(g, 'BAKKAL', 49, -36, 7.4, P.cream, { align: 'center', seed: 6, track: 0.14, shadow: ['#3a1210', 0.4, 0.4] });
  wear(g, 6, -43, 92, -34.6, '#3a3632', 9, 9);
  pipe(g, w - 5, -h, 0);
  notice(g, 98, -28, 9, 12, 'kayip', 'KAYIP', 8);
  tag(g, 98, -8, '#c9b991', 0.7);
  weather(g, 0, w, -h, 7);
  antenna(g, 18, -h - 3, 20); chimney(g, 96, -h - 3, false);
  fill(g, rect(60, -h - 9, 84, -h - 3), '#3c3a36'); fill(g, rect(62, -h - 13, 66, -h - 9), '#3c3a36');
}

// HAWK's shop (docs §10.4): the shutter half up on sacks, cans and crates;
// his hand-painted board lit by two swan-neck lamps; a patched awning with
// bare bulbs under it, their cable running down to the generator; the day's
// prices in chalk; his one warm window upstairs and his pigeons on the roof
function crow(g) {
  const w = 160, h = 112;
  renderWall(g, 0, w, -h, P.render, 41, 3);
  brickWall(g, 0, 30, -60, 43); brickWall(g, 136, w, -60, 47);
  cornice(g, 0, w, -h - 3, 3);
  [['taped', 18], ['dark', 54], ['curtain', 90], ['dark', 126]].forEach(([k, x]) => win(g, x, -104, 18, 15, k));
  sillBox(g, 89, -86.8, 20);
  // the shop front: shutter half up, the goods under it in the bulb's light
  fill(g, rect(30, -46, 136, 0), P.trim);
  const IN = rect(32, -20, 134, 0);
  const ig = g.createLinearGradient(0, -20, 0, 0); ig.addColorStop(0, '#2a1d14'); ig.addColorStop(1, '#6a4126');
  fill(g, IN, ig);
  clip(g, IN, () => {
    // flour sacks with the mill's stencil
    for (const [x, y] of [[36, -9], [44, -10], [40, -16]]) { fill(g, `M ${x} ${y + 9} C ${x - 0.6} ${y + 3} ${x} ${y} ${x + 4} ${y - 0.6} C ${x + 8} ${y} ${x + 8.6} ${y + 3} ${x + 8} ${y + 9} Z`, '#b9a888'); letters(g, 'UN', x + 4, y + 5.6, 2.8, '#5a3a24', { kind: 'sten', align: 'center', jit: 0 }); }
    // jerrycans, a crate, the radio, an ammo can
    for (const [x, c] of [[56, '#6e2a20'], [63, '#4a4a30']]) { fill(g, rect(x, -9, x + 6, 0), c); fill(g, rect(x + 1, -10.2, x + 3.4, -9), c); stroke(g, `M ${x + 0.6} -8 L ${x + 5.4} -1`, '#000', 0.4, 0.3); }
    fill(g, rect(74, -7, 92, 0), '#6a4e30'); for (let y = -5.4; y < 0; y += 1.8) fill(g, rect(74, y, 92, y + 0.3), '#3a2a18');
    fill(g, rect(77, -12, 87, -7), '#2a2622'); fill(g, ell(80, -9.5, 1.6, 1.6), '#5a5246'); fill(g, rect(83, -11, 86, -8), '#c98a3a', 0.8); stroke(g, 'M 86 -12 L 90 -18', '#111', 0.3);
    for (const x of [100, 112]) { fill(g, rect(x, -10, x + 10, 0), '#5a4a32'); fill(g, rect(x, -10, x + 10, -9), '#7a6444'); }
    fill(g, rect(122, -6, 131, 0), '#4a4a30'); letters(g, '7.62', 126.5, -2, 2, '#c9a548', { kind: 'sten', align: 'center', jit: 0 });
  });
  bulb(g, 83, -16.6, 2);
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, rect(32, -20, 134, 0), '#ff9a50', 0.12); g.restore();
  shutter(g, 32, 134, -44, -20);
  letters(g, 'NE VARSA ALINIR', 83, -27.4, 6.4, P.spray, { align: 'center', jit: 0.1, seed: 12, a: 0.75 });
  // the awning: faded canvas patched with other canvas, sagging, a rip
  const AW = 'M 26 -62 L 140 -62 L 146 -50 Q 86 -46.6 20 -50 Z';
  fill(g, AW, '#7a6240');
  clip(g, AW, () => {
    for (const [x0, x1, y0, y1, c] of [[44, 57, -61, -54, '#6c5836'], [91, 103, -60, -52.6, '#86704c'], [117, 128, -61.4, -55, '#644e32']]) {
      const d = poly([[x0, y0 + 0.4], [x1, y0], [x1 + 0.4, y1], [x0 - 0.3, y1 + 0.3]]);
      fill(g, d, c);
      g.save(); g.setLineDash([0.5, 0.45]); stroke(g, d, '#2a2016', 0.18, 0.8); g.restore();
    }
    for (let x = 24; x < 146; x += 7) fill(g, rect(x, -62, x + 2.4, -46), '#000', 0.08);
    const ag = g.createLinearGradient(0, -62, 0, -47); ag.addColorStop(0, 'rgba(255,230,190,0.12)'); ag.addColorStop(1, 'rgba(0,0,0,0.3)');
    fill(g, rect(18, -62, 148, -46), ag);
    texture(g, 'canvas', 0.7, 2.6);
  });
  stroke(g, 'M 20 -50 Q 86 -46.6 146 -50', '#3e2e1c', 0.6);
  for (const [x, ex] of [[21, 13], [145, 153]]) stroke(g, `M ${x} -50 L ${ex} -64`, P.deep, 0.45);
  // the bulbs under it on a flex from the generator
  stroke(g, 'M 6 -9 L 6 -44 Q 6 -47 12 -47.4 L 24 -48 Q 50 -45 76 -47.6 Q 104 -45 140 -48', '#0f0e0c', 0.3);
  for (const x of [38, 62, 104, 126]) bulb(g, x, -43.2, 3);
  // the board and its two lamps
  hawkSign(g, 22, -86, 138, -65);
  swanLamp(g, 45, -86, 1); swanLamp(g, 117, -86, -1);
  // the chalkboard: what he has today
  chalkboard(g, 139, -46, 156, -20, [['BUGÜN', 147.5, -41.6, 3.2, 'center'], ['UN', 140.6, -37.2, 2.5], ['40', 155, -37.2, 2.5, 'right'], ['YAĞ', 140.6, -33.6, 2.5], ['90', 155, -33.6, 2.5, 'right'], ['PİL', 140.6, -30, 2.5], ['15', 155, -30, 2.5, 'right'], ['İLAÇ', 140.6, -26.4, 2.5], ['SOR', 155, -26.4, 2.5, 'right'], ['MERMİ', 140.6, -22.8, 2.5], ['SOR', 155, -22.8, 2.5, 'right']]);
  // Vanta's notice, half torn off
  notice(g, 14, -42, 13, 16, 'vanta', 'KAYITSIZ TİCARET YASAKTIR', 6, true);
  // the generator and its cans on the pavement
  fill(g, rect(1, -10, 17, 0), P.deep);
  fill(g, rect(2, -9, 16, -2), '#6a3a26'); fill(g, rect(2, -9, 16, -7.6), '#8a5034');
  fill(g, rect(4, -6.4, 10, -2), '#2a2622'); fill(g, ell(13, -4.2, 1.6, 1.6), '#2a2622');
  stroke(g, 'M 1 -10 L 17 -10 M 1 -10 L 1 0 M 17 -10 L 17 0', '#1a1816', 0.7);
  fill(g, rect(16, -12, 17, -10), '#1a1816'); fill(g, poly([[16, -12], [17, -12], [19, -40], [13, -40]]), '#000', 0.12);
  fill(g, rect(18.4, -7, 23, 0), '#6e2a20'); fill(g, rect(19.4, -8, 21.2, -7), '#6e2a20');
  pipe(g, 157, -h, 0);
  tag(g, 140, -10, '#c9b991', 0.5);
  weather(g, 0, w, -h, 5);
  // roof: the pigeon loft, the tank, an aerial
  const L = -h - 3;
  for (const x of [24, 58]) fill(g, rect(x, L - 6, x + 1.2, L), P.deep);
  const LB = rect(22, L - 18, 62, L - 6);
  fill(g, LB, '#4e3e2c');
  clip(g, LB, () => { for (let x = 22; x < 62; x += 2.6) fill(g, rect(x, L - 18, x + 0.3, L - 6), '#2a2016', 0.7); texture(g, 'wood', 0.6, 2); });
  fill(g, rect(30, L - 16, 54, L - 9), '#16130f');
  clip(g, rect(30, L - 16, 54, L - 9), () => { for (let x = 30; x < 54; x += 1.2) stroke(g, `M ${x} ${L - 16} L ${x} ${L - 9}`, '#5a5650', 0.12, 0.8); for (let y = L - 16; y < L - 9; y += 1.2) stroke(g, `M 30 ${y} L 54 ${y}`, '#5a5650', 0.12, 0.8); });
  fill(g, poly([[20, L - 18], [42, L - 24], [64, L - 18]]), '#3a3a38');
  for (const [x, y] of [[33, L - 21.2], [38, L - 22.8], [49, L - 22.2]]) { fill(g, ell(x, y, 1.3, 0.9), '#5a5a5e'); fill(g, ell(x + 1, y - 0.8, 0.6, 0.6), '#5a5a5e'); fill(g, poly([[x - 1.2, y], [x - 2.6, y + 0.6], [x - 1, y + 0.5]]), '#4a4a4e'); }
  waterTank(g, 118, L); antenna(g, 150, L, 16);
}

// the steelworks' depot: corrugated sheet, the company's faded stencil, Vanta's
// seizure plate on the door, a chain and seal, Vanta's white floodlight
function warehouse(g) {
  const w = 164, h = 88;
  sheetWall(g, 0, w, -h, 9);
  for (let x = 0; x < w; x += 20) fill(g, poly([[x, -h], [x + 20, -h - 10], [x + 20, -h]]), P.sheetLo);
  fill(g, rect(-1, -h - 1.6, w + 1, -h + 0.4), P.trim);
  letters(g, 'ÇELİK İŞLETMELERİ', 8, -66.6, 8, P.cream, { kind: 'sten', jit: 0, track: 0.08, a: 0.32 });
  letters(g, 'DEPO', 140, -62, 7, P.cream, { kind: 'sten', align: 'center', jit: 0, track: 0.2, a: 0.4 });
  letters(g, '12', 140, -36, 24, P.cream, { kind: 'sten', align: 'center', jit: 0, a: 0.42 });
  // the loading door
  fill(g, rect(28, -60, 112, 0), P.trim);
  shutter(g, 30, 110, -57, 0);
  clip(g, rect(30, -62, 110, -57), () => { fill(g, rect(30, -62, 110, -57), '#a8873a'); for (let x = 20; x < 120; x += 6) fill(g, poly([[x, -57], [x + 3, -57], [x + 9, -62], [x + 6, -62]]), '#1a1916'); fill(g, rect(30, -62, 110, -57), '#000', 0.35); });
  // Vanta's plate: EL KONULMUŞTUR
  fill(g, rect(52, -52, 88, -42), '#e4e3df');
  fill(g, rect(52, -52, 88, -49.6), '#a8232d');
  emblem(g, 56, -45.4, 2.2, '#1d2129');
  letters(g, 'EL KONULMUŞTUR', 71, -44.2, 3.4, '#1d2129', { kind: 'print', align: 'center', jit: 0 });
  for (const [bx, by] of [[53.2, -50.8], [86.8, -50.8], [53.2, -43.2], [86.8, -43.2]]) fill(g, ell(bx, by, 0.3, 0.3), '#5a5a5a');
  // chain through the handles, a padlock with Vanta's seal tag
  for (const x of [62, 78]) fill(g, ell(x, -12, 0.9, 0.9), '#1a1916');
  for (let t = 0; t <= 1; t += 0.08) { const x = 62 + 16 * t, y = -12 + Math.sin(t * Math.PI) * 3; stroke(g, ell(x, y, 0.55, 0.35), '#8a8780', 0.22); }
  fill(g, rect(68.8, -9.4, 71.2, -6.6), '#8a7a4a'); stroke(g, 'M 69.4 -9.4 Q 70 -11 70.6 -9.4', '#8a8780', 0.3);
  fill(g, rect(71.6, -8.8, 74.6, -5.4), '#c9c6bd'); fill(g, rect(71.6, -8.8, 74.6, -8), '#a8232d');
  fill(g, rect(26, -4, 30, 0), '#a8873a', 0.7); fill(g, rect(110, -4, 114, 0), '#a8873a', 0.7);
  // a vent box, the floodlight Vanta bolted to the eaves
  fill(g, rect(144, -84, 160, -74), '#2e3234'); for (let k = 1; k < 5; k++) stroke(g, `M 145 ${-84 + k * 2} L 159 ${-84 + k * 2}`, '#4a4f52', 0.5);
  fill(g, rect(70, -86, 71, -80), P.deep);
  fill(g, poly([[65, -82], [76, -82], [74, -78], [67, -78]]), '#3a3f47');
  fill(g, rect(67, -78.4, 74, -77.6), '#f2f6ff');
  g.save(); g.globalCompositeOperation = 'lighter';
  fill(g, poly([[67, -77.6], [74, -77.6], [96, -6], [44, -6]]), '#dfe9ff', 0.05);
  g.restore();
  vposter(g, 8, -34, 12, 16, 9); korSpray(g, 14, -26, 1.1);
  spray(g, 'KOR', 116, -8, 7, C.ember, { rot: -0.06, seed: 9 });
  weather(g, 0, w, -h, 9);
}

// a Vanta post: an old building with new cladding bolted over it; the banner,
// a lightbox, the curfew board, a camera, razor wire, their posters in a row
function synBlock(g) {
  const w = 150, h = 104;
  fill(g, rect(0, -40, w, 0), '#46443f');
  clip(g, rect(0, -40, w, 0), () => texture(g, 'concrete', 0.55, 3));
  cladWall(g, 0, w, -h, -40);
  fill(g, rect(-0.6, -41, w + 0.6, -39.4), '#30353d'); fill(g, rect(-0.6, -41, w + 0.6, -40.6), '#7a8390');
  fill(g, rect(-1, -h - 3, w + 1, -h), '#30353d'); fill(g, rect(-1, -h - 3, w + 1, -h - 2.4), '#7a8390');
  // tinted slit windows in steel frames, bars
  // one of them lit: the duty room's tube light behind half-closed blinds
  for (const [x, y, lit] of [[12, -92], [104, -92, true], [104, -66], [12, -66]]) {
    fill(g, rect(x - 1, y - 1, x + 19, y + 19), '#2a2f36');
    if (lit) {
      const gr = g.createLinearGradient(0, y, 0, y + 18);
      gr.addColorStop(0, '#b9cbd8'); gr.addColorStop(1, '#46586a');
      fill(g, rect(x, y, x + 18, y + 18), gr);
      for (let k = y + 1; k < y + 11; k += 1.6) fill(g, rect(x, k, x + 18, k + 0.9), '#5a6876', 0.85);
      g.save(); g.globalCompositeOperation = 'lighter'; fill(g, rect(x - 3, y - 3, x + 21, y + 21), '#9fc4e0', 0.05); g.restore();
    } else {
      fill(g, rect(x, y, x + 18, y + 18), '#14181d');
      fill(g, poly([[x, y], [x + 7, y], [x, y + 9]]), '#232a33');
    }
    for (let k = x + 2; k < x + 18; k += 3) fill(g, rect(k, y, k + 0.7, y + 18), '#0d0f12');
    recess(g, x, y, 18, 18);
    washDown(g, x - 1, x + 19, y + 19);
  }
  // the banner
  const BN = poly([[46, -96], [82, -96], [82, -42], [64, -48], [46, -42]]);
  fill(g, BN, '#8e2330');
  clip(g, BN, () => texture(g, 'canvas', 0.55, 2.4));
  fill(g, rect(46, -96, 82, -92), '#5a1219');
  emblem(g, 64, -72, 8, '#f0d9d9');
  drape(g, BN, 46, 82, -92, -42, 825);
  // the red LED strip under the coping
  fill(g, rect(0, -h + 4, w, -h + 5.4), '#ff2a35');
  fill(g, rect(0, -h + 4.5, w, -h + 4.9), '#ffc9cc');
  // reinforced door, intercom, the lightbox over it, the curfew board beside it
  fill(g, rect(92, -32, 118, 0), '#2a2f36'); fill(g, rect(94, -30, 116, 0), '#3e4550');
  for (let x = 96; x < 116; x += 3) fill(g, rect(x, -30, x + 0.6, 0), '#2e343d');
  fill(g, rect(112, -16, 114, -14), '#9aa2ae');
  fill(g, rect(119, -19, 122, -13), '#2a2f36'); fill(g, ell(120.5, -17.4, 0.6, 0.6), '#14181d'); fill(g, rect(119.8, -15, 121.2, -14.2), '#5cff7a', 0.6);
  lightbox(g, 86, -46, 124, -36.4, 'KARAKOL 7');
  ledBoard(g, 124, -32, 148, -14, [['SOKAĞA ÇIKMA', -27, 3.1], ['YASAĞI', -22.6, 3.1], ['22:00–06:00', -17.2, 3.3]]);
  // camera on a bracket
  fill(g, rect(128, -54, 138, -52.6), '#2a2f36'); fill(g, poly([[128, -52.6], [140, -54], [140, -49], [128, -48.4]]), '#c9ced6');
  fill(g, poly([[128, -52.6], [140, -54], [140, -52.8], [128, -51.6]]), '#e8ecf0'); fill(g, ell(128.6, -50.6, 0.7, 0.7), '#14181d'); fill(g, ell(139, -50, 0.4, 0.4), '#ff2a35');
  // their posters, three alike in a row; one sprayed over
  for (const [i, x] of [[0, 12], [1, 25], [2, 38]]) vposter(g, x, -32, 11, 15, 20 + i);
  korSpray(g, 30.5, -24.5, 1.1);
  spray(g, 'KOR', 58, -8, 6.5, C.ember, { rot: -0.04, seed: 13 });
  weather(g, 0, w, -h, 13, 0.45);
  // razor wire, a comms mast with a dish
  for (let x = 1; x < w; x += 2.6) stroke(g, ell(x, -h - 5.6, 1.6, 2.2), '#7a7e84', 0.2, 0.9);
  fill(g, rect(16, -h - 26, 17, -h - 3), '#3a3f47'); for (let y = -h - 24; y < -h - 4; y += 4) stroke(g, `M 14 ${y} L 19 ${y + 3}`, '#3a3f47', 0.3);
  fill(g, ell(22, -h - 18, 3.4, 4), '#9aa2ae'); fill(g, ell(22.6, -h - 18, 2.6, 3.2), '#c9ced6'); stroke(g, `M 22 -${h + 18} L 26 -${h + 18}`, '#3a3f47', 0.4);
  fill(g, ell(16.5, -h - 26.6, 0.5, 0.5), '#ff2a35');
}

// the old hotel: cornice and balconies from better days, its neon dead but
// for two letters that still catch, one bulb over the door, ODA VAR
function hotel(g) {
  const w = 96, h = 134;
  renderWall(g, 0, w, -h, '#544a3e', 17, 4);
  cornice(g, 0, w, -h - 3, 3);
  for (let x = 1; x < w; x += 3) fill(g, rect(x, -h, x + 1.4, -h + 1.8), P.trim);
  for (let j = 0; j < 4; j++) {
    const y = -122 + j * 26;
    fill(g, rect(0, y + 22, w, y + 23), '#000', 0.2);
    [['curtain', 'dark'], ['dark', 'gas'], ['taped', 'curtain'], ['dark', 'dark']][j].forEach((k, i) => {
      const x = 12 + i * 34;
      win(g, x, y, 16, 15, k);
      if (j < 3) {
        fill(g, rect(x - 3, y + 17.5, x + 19, y + 19), P.trim);
        for (let k2 = x - 2; k2 < x + 19; k2 += 2.2) fill(g, rect(k2, y + 12.6, k2 + 0.45, y + 17.5), P.deep);
        fill(g, rect(x - 3, y + 12.2, x + 19, y + 13), P.deep);
      }
    });
  }
  laundry(g, 43, -82.6, 66, -82.6, 11, 1.6);
  // the satellite dish on the top balcony
  fill(g, ell(64, -113, 3, 3.6), '#8a8780'); fill(g, ell(64.5, -113, 2.3, 2.9), '#a8a59c'); stroke(g, 'M 64 -113 L 67.6 -112', P.deep, 0.35);
  // the vertical sign: old glass on a black box
  fill(g, rect(78, -118, 92, -50), '#1a1a1c'); fill(g, rect(78, -118, 92, -117), '#3a3a3e');
  fill(g, rect(76, -116, 78, -114), P.deep); fill(g, rect(76, -54, 78, -52), P.deep);
  oldNeon(g, ['O', 'T', 'E', 'L'], [[85, -104], [85, -89], [85, -74], [85, -59]], 13, [0, 2]);
  fill(g, rect(78, -118, 92, -50), '#000', 0.12);
  // the canopy with the name painted on its fascia, one bulb under it
  fill(g, poly([[28, -32], [64, -32], [66, -27], [26, -27]]), '#3a3632');
  board(g, 26, -27.6, 66, -23.6, '#5a2420', { bolts: false, seed: 4 });
  letters(g, 'OTEL', 46, -24.4, 3.6, P.cream, { align: 'center', track: 0.4, jit: 0.02 });
  for (const x of [28, 64]) stroke(g, `M ${x} -32 L ${x + (x < 46 ? -4 : 4)} -42`, P.deep, 0.5);
  door(g, 37, 18, 23, false);
  fill(g, rect(39, -21, 53, -13), '#4a3222'); bulb(g, 46, -21.4, 1.2);
  g.save(); g.translate(46, -15); g.rotate(0.04); fill(g, rect(-4.6, -2, 4.6, 2.2), P.kraft); letters(g, 'ODA VAR', 0, 1.1, 2.4, '#1e1a16', { align: 'center', jit: 0.1, seed: 7 }); g.restore();
  pipe(g, 4, -h, 0);
  notice(g, 66, -28, 9, 12, 'kayip', 'KAYIP', 14);
  weather(g, 0, w, -h, 17);
  antenna(g, 20, -h - 3, 24); chimney(g, 50, -h - 3, true, 9);
}

// a garage: painted tin OTO TAMİR, the bay lit by a fluorescent work light,
// a car on the lift, tyres stacked under LASTİK painted on the wall
function garage(g) {
  const w = 132, h = 76;
  const W = rect(0, -h, w, 0);
  fill(g, W, '#4b4741');
  clip(g, W, () => { for (let y = -h + 4; y < 0; y += 4) { fill(g, rect(0, y, w, y + 0.35), '#2e2b27', 0.6); const off = Math.round(y / 4) % 2 ? 4 : 0; for (let x = off; x < w; x += 8) fill(g, rect(x, y - 4, x + 0.3, y), '#2e2b27', 0.45); } texture(g, 'concrete', 0.6, 3); });
  cornice(g, 0, w, -h - 3, 3);
  board(g, 12, -72, 120, -57, '#cdbf9c', { seed: 19 });
  letters(g, 'OTO TAMİR', 66, -60.6, 12, '#8e2a22', { align: 'center', seed: 7, track: 0.06, shadow: ['#2a1a14', 0.45, 0.45] });
  wear(g, 12, -72, 120, -57, '#5a4a38', 23, 12);
  // the open bay under its fluorescent tube
  fill(g, rect(14, -50, 96, 0), P.trim);
  fill(g, rect(16, -48, 94, 0), '#34302c');
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, rect(16, -48, 94, 0), '#e8eeff', 0.12); g.restore();
  fill(g, rect(16, -48, 94, -42), '#24221f');
  fill(g, rect(30, -42.6, 80, -41.4), '#f4f8ff'); fill(g, rect(29, -43, 31, -41), '#4a4a4a'); fill(g, rect(79, -43, 81, -41), '#4a4a4a');
  for (const x of [22, 88]) { fill(g, rect(x, -40, x + 2.4, 0), '#26241f'); fill(g, rect(x - 1, -2, x + 3.4, 0), '#1c1a17'); }
  fill(g, rect(24, -19, 88, -17.6), '#26241f');
  const CAR = 'M 28 -19 L 28 -24 C 28 -26 30 -27 33 -27.4 L 40 -28 L 47 -34.6 C 48 -35.4 50 -35.8 54 -35.8 L 70 -35.8 C 74 -35.8 76 -35 78 -33 L 82 -27.6 C 84 -27 85 -26 85 -24 L 85 -19 Z';
  fill(g, CAR, '#1c1b1a');
  fill(g, 'M 49 -33.4 L 57 -33.4 L 57 -28.4 L 44 -28.4 Z', '#3e3a36'); fill(g, 'M 59 -33.4 L 71 -33.4 C 73 -33.4 74.4 -32.6 75.6 -31 L 78 -28.4 L 59 -28.4 Z', '#3e3a36');
  for (const wx of [37, 75]) { fill(g, ell(wx, -19.6, 3.8, 3.8), '#111'); fill(g, ell(wx, -19.6, 1.6, 1.6), '#3a3a38'); }
  // tyres and the painted word over them, an oil drum
  letters(g, 'LASTİK', 113, -40, 6, P.spray, { align: 'center', seed: 4, a: 0.55, track: 0.1 });
  stroke(g, 'M 104 -36 L 122 -36 M 119 -38 L 122 -36 L 119 -34', P.spray, 0.7, 0.5);
  for (let k = 0; k < 3; k++) { fill(g, ell(108, -3 - k * 5, 7, 2.6), '#1a1a1a'); fill(g, ell(108, -3 - k * 5, 3, 1.1), '#2a2a29'); }
  fill(g, ell(122, -3, 6, 2.4), '#1a1a1a');
  fill(g, rect(98, -24, 106, -14), '#6a3a26'); fill(g, rect(98, -21, 106, -20.2), '#3a1e14');
  pipe(g, 4, -h, 0);
  weather(g, 0, w, -h, 19);
  for (let x = 6; x < w; x += 18) fill(g, rect(x, -h - 6, x + 1, -h - 3), P.deep);
  stroke(g, `M 6 ${-h - 5.4} L ${w - 6} ${-h - 5.4}`, P.deep, 0.5);
}

// a burnt-out block: broken roofline, scorched window holes with a fire
// inside where someone keeps warm, rebar, rubble, and the furnace men's saying
function ruin(g) {
  const w = 120;
  const TOP = poly([[0, 0], [0, -92], [18, -96], [30, -88], [40, -100], [58, -84], [70, -90], [82, -70], [94, -78], [108, -60], [120, -64], [120, 0]]);
  fill(g, TOP, '#3a3230');
  clip(g, TOP, () => {
    brickWall(g, 0, w, -100, 23);
    fill(g, rect(0, -100, w, 0), '#000', 0.28);
    for (const [x, y] of [[12, -78], [44, -78], [76, -50], [12, -44], [44, -44]]) {
      fill(g, `M ${x - 3} ${y + 2} C ${x - 4} ${y - 8} ${x + 2} ${y - 20} ${x + 8} ${y - 24} C ${x + 14} ${y - 18} ${x + 20} ${y - 8} ${x + 18} ${y + 2} Z`, '#120d0c', 0.5);
      fill(g, `M ${x} ${y + 1} C ${x} ${y - 6} ${x + 4} ${y - 13} ${x + 7} ${y - 15} C ${x + 11} ${y - 12} ${x + 15} ${y - 6} ${x + 15} ${y + 1} Z`, '#0c0908', 0.45);
    }
  });
  for (const [x, y, k] of [[12, -78, 'ember'], [44, -78, 'broken'], [76, -50, 'ember'], [12, -44, 'broken'], [44, -44, 'ember']]) win(g, x, y, 14, 18, k, false);
  for (const [x, y, a] of [[30, -88, -0.4], [58, -84, 0.3], [82, -70, -0.2], [94, -78, 0.5]]) stroke(g, `M ${x} ${y} l ${Math.sin(a) * 8} ${-Math.cos(a) * 8}`, '#5a3a2e', 0.6);
  for (const [x, wd, hh] of [[60, 18, 8], [76, 12, 5], [92, 22, 10], [110, 12, 6]]) fill(g, poly([[x, 0], [x + wd * 0.2, -hh], [x + wd * 0.6, -hh * 0.7], [x + wd, 0]]), '#4a4240');
  for (const [x, y] of [[66, -3], [84, -2], [98, -5], [104, -1]]) fill(g, rect(x, y, x + 3, y + 1.4), '#5a4e4a');
  spray(g, 'OCAK SÖNER', 4, -16, 5.6, P.spray, { rot: -0.03, seed: 21, a: 0.7 });
  spray(g, 'KOR KALIR', 8, -9, 5.6, C.ember, { rot: -0.03, seed: 22, a: 0.85 });
  notice(g, 64, -30, 8, 11, 'kayip', 'KAYIP', 23);
  grime(g, 0, w, 9, 29);
}

// a dark alley: a side door under a caged bulb, cables and washing across,
// the chain-link fence, a cat on the bin
function alley(g) {
  const w = 34;
  fill(g, rect(0, -104, w, 0), '#191817');
  fill(g, rect(0, -104, w, -60), '#141312');
  fill(g, rect(w / 2 - 6, -20, w / 2 + 6, 0), '#201e1c');
  // the side door and its bulb in a wire cage
  fill(g, rect(6, -26, 17, 0), '#0f0e0d'); fill(g, rect(7, -25, 16, 0), '#2a2420');
  bulb(g, 11.5, -29, 1.2);
  stroke(g, ell(11.5, -28.8, 1.3, 1.5), '#3a3632', 0.2);
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, poly([[10, -28], [13, -28], [20, 0], [3, 0]]), '#ffcf8f', 0.06); g.restore();
  // fence
  fill(g, rect(2, -30, 3, 0), P.deep); fill(g, rect(w - 3, -30, w - 2, 0), P.deep);
  fill(g, rect(2, -30, w - 2, -29.2), P.deep);
  clip(g, rect(18, -29.2, w - 3, 0), () => {
    for (let k = -30; k < w + 30; k += 3) { stroke(g, `M ${k} -30 L ${k + 30} 0`, '#3e3c38', 0.25, 0.8); stroke(g, `M ${k} 0 L ${k + 30} -30`, '#3e3c38', 0.25, 0.8); }
  });
  for (const [y0, y1, s] of [[-80, -84, 8], [-92, -90, 6]]) cable(g, -2, y0, w + 2, y1, s);
  laundry(g, -2, -66, w + 2, -64, 31, 4);
  fill(g, rect(20, -12, 30, 0), '#2e2e28'); fill(g, rect(19.6, -13, 30.4, -11.6), '#3a3a32');
  fill(g, 'M 23 -13 C 22.6 -15 23 -17 24 -17.6 L 24.4 -19 L 25.2 -18 L 26 -18.2 L 26.4 -19 L 26.8 -17.6 C 27.6 -16.6 27.6 -14.6 27 -13 Z M 27 -13.4 C 29 -13.6 29.6 -15 29 -16.4', '#0c0b0a');
}

// the union hall, shut: the raised letters over the door painted over in
// Vanta grey and still legible in their shadows, the chained doors and the
// seal, candles on the step under the photos of the six who never came back
function union(g) {
  const w = 140, h = 108;
  const W = rect(0, -h, w, 0);
  fill(g, W, '#4f4c46');
  clip(g, W, () => {
    for (let y = -h + 9; y < 0; y += 9) { fill(g, rect(0, y - 0.3, w, y + 0.2), '#2e2c28', 0.7); const off = Math.round(y / 9) % 2 ? 9 : 0; for (let x = off; x < w; x += 18) fill(g, rect(x, y - 9, x + 0.3, y), '#2e2c28', 0.5); }
    texture(g, 'concrete', 0.6, 3.2);
  });
  for (const x of [0, 44, 90, 134]) { fill(g, rect(x, -h + 20, x + 6, -6), '#58544c'); fill(g, rect(x + 5, -h + 20, x + 6, -6), '#000', 0.25); clip(g, rect(x, -h + 20, x + 6, -6), () => texture(g, 'concrete', 0.6, 3)); }
  fill(g, rect(-1, -6, w + 1, 0), '#3f3c37');
  cornice(g, 0, w, -h - 3, 3);
  // the entablature: Vanta's grey over the union's name, the letters still there in relief
  fill(g, rect(0, -h, w, -h + 20), '#57534c');
  const PAINT = '#62646a';
  fill(g, rect(6, -105, 134, -91), PAINT);
  clip(g, rect(6, -105, 134, -91), () => { for (let y = -105; y < -91; y += 2.2) fill(g, rect(6, y, 134, y + 1), '#000', 0.05); texture(g, 'paint', 0.4, 2.4); });
  const name = 'OCAK İŞÇİLERİ SENDİKASI';
  letters(g, name, 70.4, -94.6, 7.6, '#000', { align: 'center', jit: 0, track: 0.08, a: 0.5 });
  letters(g, name, 69.7, -95.3, 7.6, '#fff', { align: 'center', jit: 0, track: 0.08, a: 0.16 });
  letters(g, name, 70, -95, 7.6, PAINT, { align: 'center', jit: 0, track: 0.08 });
  // the plaque: a flame in a gear, half chiselled off
  fill(g, ell(70, -78, 7, 7), '#4a3a28');
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; fill(g, ell(70 + Math.cos(a) * 7, -78 + Math.sin(a) * 7, 1.1, 1.1), '#4a3a28'); }
  fill(g, ell(70, -78, 5.4, 5.4), '#6a5436');
  fill(g, 'M 70 -82.6 C 72.4 -80 73 -77.6 71.6 -75.2 C 71 -76.4 70.6 -77 70 -77.4 C 69.4 -76.6 69.4 -75.8 68.6 -75.2 C 67.2 -77 68 -80 70 -82.6 Z', '#a8803e');
  fill(g, poly([[71, -85], [77, -81], [76, -74], [72.6, -76], [73.4, -80]]), '#2e2620', 0.85);
  // windows in the side bays
  for (const [x, y, k] of [[13, -82, 'boarded'], [13, -52, 'taped'], [104, -82, 'broken'], [104, -52, 'boarded']]) win(g, x, y, 22, 22, k, false);
  // the doors: wood, chained, the seal across them
  fill(g, rect(50, -6, 90, 0), '#46433d'); fill(g, rect(53, -9, 87, -6), '#4e4a44');
  fill(g, rect(55, -44, 85, -9), P.trim);
  const D = rect(57, -42, 83, -9);
  fill(g, D, '#3a2a1e');
  clip(g, D, () => { fill(g, rect(69.8, -42, 70.2, -9), '#140e0a'); for (const [x0, x1] of [[59, 68], [72, 81]]) for (const [y0, y1] of [[-40, -28], [-26, -12]]) { stroke(g, rect(x0, y0, x1, y1), '#1e150e', 0.5); } texture(g, 'wood', 0.6, 2); });
  for (const x of [66, 74]) fill(g, ell(x, -24, 0.8, 0.8), '#8a7a5a');
  for (let t = 0; t <= 1; t += 0.07) { const x = 66 + 8 * t, y = -24 + Math.sin(t * Math.PI) * 2.6; stroke(g, ell(x, y, 0.5, 0.32), '#8a8780', 0.2); }
  fill(g, rect(68.8, -21.6, 71.2, -18.6), '#8a7a4a');
  for (const [a, b] of [[[56, -38], [84, -16]], [[84, -38], [56, -16]]]) { stroke(g, `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`, '#e8e4dc', 1.2); stroke(g, `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`, '#a8232d', 1.2, 0.0); }
  for (let k = 0; k < 8; k++) { const t = k / 8 + 0.03, x = 56 + 28 * t; fill(g, rect(x, -38 + 22 * t - 0.6, x + 1.6, -38 + 22 * t + 0.6), '#a8232d', 0.9); fill(g, rect(84 - 28 * t - 1.6, -38 + 22 * t - 0.6, 84 - 28 * t, -38 + 22 * t + 0.6), '#a8232d', 0.9); }
  notice(g, 64, -38, 12, 9, 'vanta', 'MÜHÜRLENMİŞTİR', 31);
  // the six, and candles for them; carnations on the step
  for (let i = 0; i < 6; i++) { const x = 12 + (i % 3) * 9, y = -24 + Math.floor(i / 3) * 10; notice(g, x, y, 8, 9, 'kayip', 'KAYIP', 40 + i); }
  for (const [x, hh] of [[55, 2.6], [58, 3.6], [61.4, 2], [79, 3], [82.4, 2.4], [86, 3.4]]) {
    fill(g, rect(x - 0.6, -6 - hh, x + 0.6, -6), '#e6dcc6'); fill(g, rect(x - 0.6, -6 - hh, x + 0.6, -6 - hh + 0.5), '#fff', 0.5);
    fill(g, ell(x, -6 - hh - 0.9, 0.35, 0.8), '#ffcf6a');
    g.save(); g.globalCompositeOperation = 'lighter'; fill(g, ell(x, -6 - hh - 0.9, 2.6, 2.6), '#ff9a40', 0.12); g.restore();
  }
  for (const [x, y] of [[64, -6.6], [66.2, -6.2], [74.4, -6.6], [76, -6.4]]) { stroke(g, `M ${x} ${y} l ${(x - 70) * 0.2} 2.4`, '#3e4a32', 0.3); fill(g, ell(x, y, 0.8, 0.6), '#a8282a'); }
  spray(g, '6 KİŞİ', 104, -24, 6.6, P.spray, { rot: -0.05, seed: 33, a: 0.8 });
  spray(g, 'NEREDE?', 101, -15, 6.6, P.spray, { rot: -0.05, seed: 34, a: 0.8 });
  weather(g, 0, w, -h, 37);
}

// the tea house: a steamed window with one bulb behind it, the glasses on
// their shelf, the double kettle on the stove, the price in chalk
function teahouse(g) {
  const w = 96, h = 84;
  renderWall(g, 0, w, -h, '#4c4840', 53, 2);
  cornice(g, 0, w, -h - 3, 3);
  for (const [x, k] of [[16, 'gas'], [60, 'dark']]) win(g, x, -74, 16, 16, k);
  // the shop front in dark green timber
  fill(g, rect(4, -46, 92, 0), '#2a3a30');
  clip(g, rect(4, -46, 92, 0), () => texture(g, 'wood', 0.6, 2));
  board(g, 6, -45, 90, -35.6, '#5a2420', { seed: 29 });
  // a tulip glass painted by the name
  fill(g, 'M 11 -43.4 L 15.4 -43.4 C 15.6 -41.6 14.4 -40.6 14 -39.6 C 14.6 -38.8 15.2 -38.4 15.2 -37.8 L 11.2 -37.8 C 11.2 -38.4 11.8 -38.8 12.4 -39.6 C 12 -40.6 10.8 -41.6 11 -43.4 Z', P.cream);
  fill(g, rect(11.4, -42.4, 15, -41), '#a8402a');
  letters(g, 'ÇAY OCAĞI', 52, -37.2, 7.6, P.cream, { align: 'center', seed: 31, track: 0.1, shadow: ['#2a0e0c', 0.4, 0.4] });
  wear(g, 6, -45, 90, -35.6, '#3a3632', 41, 7);
  // the window
  const SW = rect(8, -31, 58, -7);
  const gr = g.createRadialGradient(34, -24, 0, 34, -20, 30); gr.addColorStop(0, '#f6c88c'); gr.addColorStop(1, '#7a4422');
  fill(g, SW, gr);
  clip(g, SW, () => {
    fill(g, rect(8, -21, 58, -20.2), '#3a2416');
    for (let x = 11; x < 40; x += 3.2) fill(g, `M ${x} -21 L ${x + 1.6} -21 L ${x + 1.4} -22.6 C ${x + 1.2} -23.2 ${x + 1.8} -23.8 ${x + 1.8} -24.6 L ${x - 0.2} -24.6 C ${x - 0.2} -23.8 ${x + 0.4} -23.2 ${x + 0.2} -22.6 Z`, '#5a2a18', 0.85);
    fill(g, rect(42, -14, 56, -7), '#2a2420');
    fill(g, 'M 45 -14 C 45 -17 46 -18 49 -18 C 52 -18 53 -17 53 -14 Z', '#3a3430'); fill(g, 'M 46.6 -18 C 46.6 -20 47.4 -21 49 -21 C 50.6 -21 51.4 -20 51.4 -18 Z', '#3a3430');
    bulb(g, 30, -28, 3);
    const st = g.createLinearGradient(0, -31, 0, -7); st.addColorStop(0, 'rgba(255,240,220,0.04)'); st.addColorStop(1, 'rgba(255,240,220,0.32)');
    fill(g, SW, st);
    for (const x of [16, 22, 40]) fill(g, rect(x, -16, x + 0.8, -7), '#000', 0.12);
  });
  for (const x of [24.4, 41.6]) fill(g, rect(x, -31, x + 0.8, -7), '#1e2a22');
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, rect(4, -34, 62, 0), '#ff9a5c', 0.05); g.restore();
  // the door, the chalk board, stools outside
  fill(g, rect(61, -31, 77, 0), '#1e2a22'); fill(g, rect(63, -29, 75, -16), '#c88a52'); fill(g, rect(63, -29, 75, -16), '#fff', 0.15);
  chalkboard(g, 79, -26, 90, -12, [['ÇAY', 84.5, -20, 3.4, 'center'], ['5', 84.5, -14.6, 4, 'center']]);
  for (const x of [14, 26, 38]) { fill(g, rect(x - 2.4, -5.2, x + 2.4, -4.4), '#5a4430'); fill(g, rect(x - 2, -4.4, x - 1.4, 0), '#3a2a1e'); fill(g, rect(x + 1.4, -4.4, x + 2, 0), '#3a2a1e'); }
  stovepipe(g, 86, -56, -h - 3, 12);
  weather(g, 0, w, -h, 53);
  antenna(g, 30, -h - 3, 14);
}

// --- the market (mission 2) ---------------------------------------------------------------
// Docs §10.6: the street market, the city's own economy against Vanta's
// rations. It lives on the pavement in front of the shops (nothing in the
// road): tarps on poles out from the wall, crates and sacks, prices in marker
// on cardboard, a hanging scale, bulbs off a generator.

// a crate of produce standing on y = base: slats, and what is left in it
export function produce(g, x, w, h, kind, seed = 1, base = 0) {
  const B = rect(x, base - h, x + w, base);
  fill(g, B, '#6a5034');
  clip(g, B, () => { for (let y = base - h + 2; y < base; y += 3) fill(g, rect(x, y, x + w, y + 0.6), '#2e2014', 0.8); texture(g, 'wood', 0.6, 2); });
  fill(g, rect(x, base - h, x + w, base - h + 0.8), '#8a6a44');
  fill(g, rect(x + w - 0.8, base - h, x + w, base), '#000', 0.25);
  const r = rng(seed);
  const C = { onion: ['#b07a3a', '#d4a464'], potato: ['#7e6040', '#a08460'], cabbage: ['#5e7e48', '#7e9e5e'], apple: ['#7e2a22', '#a8443a'], grain: ['#b8a070', '#d0b888'] }[kind];
  if (C) for (let i = 0; i < w / 1.5; i++) {
    const px = x + 1 + r() * (w - 2), py = base - h - 0.3 - r() * 1.4, k = kind === 'cabbage' ? 1.5 : kind === 'grain' ? 0.5 : 0.9;
    fill(g, ell(px, py, k, k * 0.85), r() < 0.5 ? C[0] : C[1]);
    fill(g, ell(px - k * 0.3, py - k * 0.3, k * 0.3, k * 0.25), '#fff', 0.14);
  }
}

// a price in marker on a torn bit of cardboard, stuck on a stick
export function price(g, x, y, lines, seed = 1, rot = -0.06) {
  g.save(); g.translate(x, y); g.rotate(rot);
  const w = Math.max(...lines.map((t) => t.length)) * 1.3 + 2.2, h = lines.length * 2.8 + 1;
  stroke(g, `M 0 0 L 0 ${3.4}`, '#4a3a28', 0.3);
  fill(g, poly([[-w / 2, -h], [w / 2, -h + 0.3], [w / 2 - 0.3, 0], [-w / 2 + 0.4, 0.2]]), '#b89a6a');
  fill(g, rect(-w / 2, -h, w / 2, -h + 0.6), '#fff', 0.1);
  lines.forEach((t, i) => letters(g, t, 0, -h + 2.7 + i * 2.8, 2.5, '#17130f', { align: 'center', jit: 0.14, seed: seed + i }));
  g.restore();
}

// a tarp on two poles out from the wall over the pavement, seen from the
// front: wall edge at yTop, front edge at yEdge sagging between the poles;
// faded stripes, a sewn-on patch, the guy ropes
function tarp(g, x0, x1, yTop, yEdge, c, stripe = null, seed = 1) {
  const r = rng(seed), mid = (x0 + x1) / 2;
  const T = `M ${x0} ${yTop} L ${x1} ${yTop} L ${x1 + 2} ${yEdge} Q ${mid} ${yEdge + 2.6} ${x0 - 2} ${yEdge} Z`;
  fill(g, T, c);
  clip(g, T, () => {
    if (stripe) for (let x = x0 - 4; x < x1 + 4; x += 6) fill(g, poly([[x, yTop], [x + 3, yTop], [x + 3 + (x - mid) * 0.05, yEdge + 4], [x + (x - mid) * 0.05, yEdge + 4]]), stripe, 0.6);
    const gr = g.createLinearGradient(0, yTop, 0, yEdge + 3); gr.addColorStop(0, 'rgba(0,0,0,0.32)'); gr.addColorStop(1, 'rgba(255,240,220,0.08)');
    fill(g, T, gr);
    const px = x0 + 4 + r() * Math.max(1, x1 - x0 - 16);
    const Pt = rect(px, yTop + 1.2, px + 8, yTop + (yEdge - yTop) * 0.7);
    fill(g, Pt, '#6c6450', 0.9);
    g.save(); g.setLineDash([0.5, 0.45]); stroke(g, Pt, '#2a2016', 0.15, 0.8); g.restore();
    texture(g, 'canvas', 0.6, 2.4);
  });
  stroke(g, `M ${x0 - 2} ${yEdge} Q ${mid} ${yEdge + 2.6} ${x1 + 2} ${yEdge}`, '#000', 0.4, 0.3);
  for (const x of [x0 - 1.4, x1 + 1.4]) { fill(g, rect(x - 0.45, yEdge - 0.4, x + 0.45, 0), '#3a3a38'); fill(g, rect(x - 0.45, yEdge - 0.4, x - 0.1, 0), '#5a5a56'); }
}

// a spring scale hanging off a tarp, its pan
function kantar(g, x, y) {
  stroke(g, `M ${x} ${y} L ${x} ${y + 2.4}`, '#2a2622', 0.25);
  fill(g, ell(x, y + 4, 1.8, 1.8), '#c9a548'); fill(g, ell(x, y + 4, 1.3, 1.3), '#e6dcc0');
  stroke(g, `M ${x} ${y + 4} L ${x + 0.8} ${y + 3.2}`, '#8e2a22', 0.2);
  stroke(g, `M ${x} ${y + 5.8} L ${x} ${y + 7} M ${x} ${y + 7} L ${x - 2.6} ${y + 9.4} M ${x} ${y + 7} L ${x + 2.6} ${y + 9.4}`, '#4a4440', 0.18);
  fill(g, `M ${x - 3} ${y + 9.4} L ${x + 3} ${y + 9.4} Q ${x} ${y + 11.6} ${x - 3} ${y + 9.4} Z`, '#8a8478');
}

// a shopfront: the frame, the shutter half up, the inside lit warm (or dark)
function shopfront(g, x0, x1, top, half, lit = true) {
  fill(g, rect(x0, top, x1, 0), P.trim);
  const IN = rect(x0 + 1.4, half, x1 - 1.4, 0);
  if (lit) { const gr = g.createLinearGradient(0, half, 0, 0); gr.addColorStop(0, '#3a2414'); gr.addColorStop(1, '#7a4a2a'); fill(g, IN, gr); }
  else fill(g, IN, '#16130f');
  shutter(g, x0 + 1.4, x1 - 1.4, top + 1.4, half);
}

// a trestle table on the pavement
function trestle(g, x0, x1, y) {
  fill(g, rect(x0, y, x1, y + 1.2), '#5a4430'); fill(g, rect(x0, y, x1, y + 0.4), '#7a5e40');
  for (const x of [x0 + 2, x1 - 3]) stroke(g, `M ${x} ${y + 1.2} L ${x - 1.4} 0 M ${x} ${y + 1.2} L ${x + 1.4} 0`, '#3a2a1c', 0.5);
}

// two shops with the market out in front of them: the greengrocer's crates
// under a striped tarp, the junk man's table under a plain one; a bedsheet
// off the balcony sprayed EKMEK HAKTIR
function pazar(g) {
  const w = 150, h = 104;
  renderWall(g, 0, w, -h, '#4e4a42', 83, 4);
  cornice(g, 0, w, -h - 3, 3);
  cornice(g, 0, w, -50, 2);
  [['curtain', 14], ['dark', 54], ['gas', 90], ['taped', 124]].forEach(([k, x]) => win(g, x, -96, 14, 17, k));
  [['dark', 14], ['curtain', 54], ['dark', 90], ['dark', 124]].forEach(([k, x]) => win(g, x, -72, 14, 15, k));
  laundry(g, 88, -78.6, 108, -78.6, 87, 1.6);
  // the sheet off the balcony
  const SH = poly([[31, -97], [48, -96.4], [47.4, -70], [44, -71.4], [40, -69.6], [36, -71], [31.6, -70.2]]);
  fill(g, SH, '#d8d2c2');
  clip(g, SH, () => { for (const x of [35, 41, 46]) fill(g, rect(x, -97, x + 0.8, -70), '#000', 0.08); texture(g, 'canvas', 0.5, 2); });
  spray(g, 'EKMEK', 39.6, -87, 4.4, '#8e2a22', { align: 'center', rot: -0.04, seed: 61, a: 0.9 });
  spray(g, 'HAKTIR', 39.6, -79.4, 4.4, '#8e2a22', { align: 'center', rot: -0.03, seed: 62, a: 0.9 });
  stroke(g, 'M 30 -97.4 L 49 -96.6', '#2a2622', 0.3);
  // the greengrocer
  shopfront(g, 4, 72, -46, -26);
  board(g, 6, -49, 70, -43.4, '#2c4a3a', { seed: 31 });
  letters(g, 'MANAV', 38, -44.6, 5, P.cream, { align: 'center', seed: 33, track: 0.2 });
  tarp(g, 4, 72, -42, -32, '#4e6a82', '#c6ccd0', 35);
  trestle(g, 3, 66, -9.6);
  produce(g, 5, 12, 6, 'onion', 41, -9.6); produce(g, 18, 12, 6, 'potato', 42, -9.6); produce(g, 31, 12, 6, 'cabbage', 43, -9.6); produce(g, 44, 12, 6, null, 44, -9.6);
  produce(g, 57, 9, 5, null, 45, 0); produce(g, 58, 8, 5, null, 46, -5);
  price(g, 10, -17.2, ['SOĞAN', '30'], 51); price(g, 24, -17.2, ['PATATES', '35'], 52, 0.04); price(g, 37, -17.2, ['LAHANA', '20'], 53); price(g, 50, -16.6, ['ELMA', 'YOK'], 54, 0.08);
  kantar(g, 62, -31.4);
  bulb(g, 30, -29.4, 2);
  // the junk man
  shopfront(g, 78, 146, -46, -28, false);
  board(g, 80, -49, 144, -43.4, '#4a3a2a', { seed: 37 });
  letters(g, 'ESKİCİ', 112, -44.6, 5, P.cream, { align: 'center', seed: 39, track: 0.2 });
  tarp(g, 78, 146, -42, -33, '#5a6448', null, 47);
  trestle(g, 80, 142, -9);
  // radios, a kettle, a pair of shoes, a car battery, batteries, a coil of wire, a lamp
  fill(g, rect(82, -15, 92, -9), '#3a3028'); fill(g, ell(85, -12, 1.8, 1.8), '#5a5246'); fill(g, rect(88, -14, 91, -11), '#c99a4a', 0.8);
  fill(g, rect(94, -13.4, 101, -9), '#4a4a4c'); fill(g, rect(95, -12.4, 100, -11.6), '#7a7a7c'); fill(g, rect(98.6, -14.4, 100, -13.4), '#8e2a22'); fill(g, rect(95.2, -14.4, 96.6, -13.4), '#2a2a2c');
  fill(g, `M 104 -9 L 104 -12.4 C 104 -14.6 110 -14.6 110 -12.4 L 110 -9 Z`, '#8a8a84'); stroke(g, 'M 105 -13.4 C 105 -16 109 -16 109 -13.4', '#3a3a38', 0.3); fill(g, rect(110, -12, 112.4, -11.2), '#8a8a84');
  for (const x of [114, 119]) fill(g, `M ${x} -9 L ${x} -11 C ${x} -12 ${x + 2} -12.2 ${x + 2.6} -11 L ${x + 4} -10 L ${x + 4} -9 Z`, '#3a2a1e');
  for (let k = 0; k < 4; k++) { fill(g, rect(124 + k * 1.6, -11.6, 125.2 + k * 1.6, -9), k % 2 ? '#c9a548' : '#2a2a2a'); fill(g, rect(124 + k * 1.6, -11.6, 125.2 + k * 1.6, -11), '#a8a8a8'); }
  for (let k = 0; k < 4; k++) stroke(g, ell(134, -10.6, 2.6 - k * 0.3, 1.4 - k * 0.15), '#7a4a2a', 0.25);
  fill(g, rect(138, -16, 139, -9), '#3a3632'); fill(g, poly([[136, -16], [141, -16], [140, -18.6], [137, -18.6]]), '#6a5a3a');
  price(g, 96, -17.6, ['PİL', 'VAR'], 55, 0.05); price(g, 129, -17.2, ['TAMİR'], 56, -0.08);
  bulb(g, 112, -30.4, 2);
  pipe(g, 75, -h, -50);
  notice(g, 66, -70, 7, 9, 'kayip', 'KAYIP', 89);
  weather(g, 0, w, -h, 83);
  antenna(g, 20, -h - 3, 18); chimney(g, 110, -h - 3, true, 13);
}

// the bakery with its racks bare and a queue rope in front; beside it the
// winter coats and blankets on a rail under a brown tarp
function pazarB(g) {
  const w = 140, h = 98;
  renderWall(g, 0, w, -h, '#524a40', 91, 3);
  cornice(g, 0, w, -h - 3, 3);
  cornice(g, 0, w, -50, 2);
  [['dark', 12], ['curtain', 46], ['dark', 80], ['gas', 112]].forEach(([k, x]) => win(g, x, -86, 15, 20, k));
  stovepipe(g, 104, -60, -h - 3, 21);
  // the bakery: racks with one loaf left, the note, the queue rope
  fill(g, rect(4, -46, 70, 0), P.trim);
  const SW = rect(6, -40, 44, -8);
  const gr = g.createRadialGradient(25, -30, 0, 25, -24, 26); gr.addColorStop(0, '#d8a874'); gr.addColorStop(1, '#5a3a22'); fill(g, SW, gr);
  clip(g, SW, () => {
    for (const y of [-32, -24, -16]) { fill(g, rect(6, y, 44, y + 0.8), '#3a2416'); for (let x = 9; x < 44; x += 7) fill(g, rect(x, y - 0.5, x + 4, y), '#4a3020', 0.7); }
    fill(g, ell(30, -25, 3, 1.3), '#b8783a'); fill(g, ell(29.4, -25.4, 2, 0.6), '#d8a060');
    bulb(g, 25, -37, 2);
  });
  for (const x of [18.6, 31.4]) fill(g, rect(x, -40, x + 0.8, -8), P.trim);
  g.save(); g.translate(15, -14); g.rotate(-0.05); fill(g, rect(-7, -3.4, 7, 3.6), P.paper); letters(g, 'KİŞİ BAŞI', 0, -0.6, 2.1, '#1e1a16', { align: 'center', jit: 0.08, seed: 71 }); letters(g, '1 EKMEK', 0, 2.4, 2.4, '#8e2a22', { align: 'center', jit: 0.08, seed: 72 }); g.restore();
  fill(g, rect(48, -36, 64, 0), '#2a241f'); fill(g, rect(49, -34, 63, -18), '#3a2c20');
  board(g, 6, -49, 68, -42.6, '#e2d6b6', { seed: 73 });
  letters(g, 'FIRIN', 37, -43.8, 5.6, '#7a2420', { align: 'center', seed: 75, track: 0.3 });
  for (const x of [6, 24, 42, 60]) { fill(g, rect(x - 0.5, -9, x + 0.5, 0), '#3a3a38'); fill(g, ell(x, -9.2, 0.8, 0.6), '#5a5a56'); fill(g, rect(x - 1.6, -0.8, x + 1.6, 0), '#2a2a28'); }
  for (let k = 0; k < 3; k++) { const a = 6 + k * 18; stroke(g, `M ${a} -8.6 Q ${a + 9} -5.6 ${a + 18} -8.6`, '#8e2a22', 0.45); }
  // coats and blankets
  shopfront(g, 74, 136, -46, -30, false);
  tarp(g, 74, 136, -42, -34, '#6a5234', null, 77);
  stroke(g, 'M 78 -30 L 132 -30', '#3a3632', 0.5);
  const COLS = ['#4a4e56', '#5a4636', '#3a4250', '#6a5e4a', '#4a3a3a', '#5e5a50'];
  for (let k = 0; k < 7; k++) {
    const x = 80 + k * 7.4, c = COLS[k % COLS.length], L = 14 + (k % 3) * 3;
    stroke(g, `M ${x + 3} -30 L ${x + 3} -28.6`, '#2a2622', 0.25);
    const D = k % 2 ? `M ${x} -28.6 L ${x + 6} -28.6 L ${x + 6.4} ${-28.6 + L} L ${x - 0.4} ${-28.6 + L} Z` : `M ${x + 1} -28.6 L ${x + 5} -28.6 L ${x + 6.6} -26.6 L ${x + 6} ${-28.6 + L} L ${x} ${-28.6 + L} L ${x - 0.6} -26.6 Z`;
    fill(g, D, c);
    clip(g, D, () => { if (k % 2) for (let y = -28; y < -28.6 + L; y += 2.4) fill(g, rect(x - 1, y, x + 7, y + 0.6), '#c9b991', 0.3); fill(g, rect(x + 4.6, -29, x + 7, -10), '#000', 0.2); texture(g, 'wool', 0.6, 2); });
  }
  for (let k = 0; k < 4; k++) fill(g, rect(114, -2.6 - k * 2.4, 130, -0.4 - k * 2.4), COLS[(k + 2) % COLS.length]);
  produce(g, 112, 20, 2.6, null, 79, 0);
  price(g, 92, -9.4, ['BATTANİYE'], 81, -0.04); price(g, 106, -8.8, ['PALTO'], 82, 0.06);
  bulb(g, 105, -32.2, 2);
  pipe(g, 72, -h, -50);
  tag(g, 50, -60, C.ember, 0.6);
  weather(g, 0, w, -h, 91);
  antenna(g, 30, -h - 3, 16);
}

// the old wholesale hall, shut: a long brick shed under an arched roof, its
// great door sealed, the name faded on the gable; at its door people sell
// pulses out of sacks and oil from tins
function hal(g) {
  const w = 200, top = -76;
  const OUT = `M 0 0 L 0 ${top} Q ${w / 2} -132 ${w} ${top} L ${w} 0 Z`;
  clip(g, OUT, () => brickWall(g, 0, w, -116, 101));
  stroke(g, `M -1 ${top} Q ${w / 2} -133 ${w + 1} ${top}`, '#2a2622', 2.2);
  stroke(g, `M -1 ${top - 1} Q ${w / 2} -134 ${w + 1} ${top - 1}`, '#6a645a', 0.6);
  // the name on its band of render
  const BAND = rect(30, -96, 170, -86);
  fill(g, BAND, '#5a5448'); clip(g, BAND, () => texture(g, 'concrete', 0.5, 3));
  letters(g, 'SEBZE · MEYVE HALİ', 100, -88.4, 7, P.cream, { align: 'center', jit: 0.02, track: 0.12, a: 0.55, kind: 'sten' });
  // the clerestory: small arched windows, most of the glass gone
  for (let x = 12; x < w - 10; x += 16) {
    if (x > 50 && x < 140) continue;
    // a ring of brick voussoirs round the arch, the opening set back into the wall
    stroke(g, `M ${x - 0.6} -66 A 4.6 4.6 0 0 1 ${x + 8.6} -66`, '#7a4a36', 1.2);
    for (let a = 0.15; a < 3.1; a += 0.42) stroke(g, `M ${x + 4 + Math.cos(Math.PI + a) * 4} ${-66 + Math.sin(Math.PI + a) * 4} L ${x + 4 + Math.cos(Math.PI + a) * 5.2} ${-66 + Math.sin(Math.PI + a) * 5.2}`, '#3a2218', 0.14);
    const AW = `M ${x} -58 L ${x} -66 A 4 4 0 0 1 ${x + 8} -66 L ${x + 8} -58 Z`;
    fill(g, AW, (x / 16) % 3 === 1 ? '#2a2d33' : '#121315');
    clip(g, AW, () => {
      // what is left of the glass: a shard or two holding the sky
      if ((x / 16) % 2 === 0) fill(g, `M ${x} -58 L ${x} -62.6 L ${x + 2.6} -58 Z`, '#3a4250', 0.9);
      fill(g, `M ${x + 8} -66 L ${x + 8} -61 L ${x + 5.6} -66.4 Z`, '#30363f', 0.8);
      const tg = g.createLinearGradient(0, -70, 0, -63); tg.addColorStop(0, 'rgba(0,0,0,0.6)'); tg.addColorStop(1, 'rgba(0,0,0,0)');
      fill(g, rect(x, -70, x + 8, -63), tg);
    });
    fill(g, rect(x - 1, -58, x + 9, -57), P.sill);
    washDown(g, x - 1, x + 9, -57);
  }
  // the great door: shutter down, sealed
  fill(g, `M 62 0 L 62 -42 A 38 38 0 0 1 138 -42 L 138 0 Z`, '#3a3632');
  const D = `M 66 0 L 66 -42 A 34 34 0 0 1 134 -42 L 134 0 Z`;
  clip(g, D, () => { shutter(g, 66, 134, -78, 0); fill(g, rect(66, -78, 134, -42), '#000', 0.25); });
  // Vanta's seal tape across it, red and white
  for (const d of ['M 66 -44 L 134 -6', 'M 134 -44 L 66 -6']) { stroke(g, d, '#e8e4dc', 1.4); g.save(); g.setLineDash([2.4, 2.4]); stroke(g, d, '#a8232d', 1.4); g.restore(); }
  notice(g, 93, -36, 14, 12, 'vanta', 'KAPATILMIŞTIR', 103);
  // pulses in sacks under a red-striped tarp
  tarp(g, 6, 56, -42, -33, '#8a4a3a', '#d8cdb8', 105);
  for (const [x, t, c] of [[8, 'MERCİMEK', '#a8402a'], [24, 'BULGUR', '#b8a070'], [40, 'NOHUT', '#c8b080']]) {
    const S = `M ${x} 0 C ${x - 0.6} -6 ${x} -10 ${x + 2} -11 L ${x + 12} -11 C ${x + 14} -10 ${x + 14.6} -6 ${x + 14} 0 Z`;
    fill(g, S, '#b8aa88'); clip(g, S, () => { texture(g, 'canvas', 0.7, 2); fill(g, rect(x + 13, -12, x + 15, 0), '#000', 0.2); });
    fill(g, ell(x + 7, -11, 5.4, 1.4), c); fill(g, ell(x + 6, -11.3, 3, 0.6), '#fff', 0.15);
    letters(g, t, x + 7, -4.6, 2, '#3a2a1c', { kind: 'sten', align: 'center', jit: 0, a: 0.8 });
  }
  price(g, 15, -17.6, ['MERCİMEK', '60'], 107); price(g, 31, -17.6, ['BULGUR', '40'], 108, 0.05); price(g, 47, -17.2, ['NOHUT', 'YOK'], 109, -0.08);
  bulb(g, 31, -30.4, 2);
  // oil in tins under a plain one
  tarp(g, 144, 194, -42, -33, '#4e6a82', null, 111);
  trestle(g, 146, 192, -9);
  for (let k = 0; k < 5; k++) { const x = 148 + k * 8.4; fill(g, rect(x, -17, x + 6.4, -9), '#9aa0a4'); fill(g, rect(x, -17, x + 6.4, -15.8), '#7a8084'); fill(g, rect(x + 0.8, -14.4, x + 5.6, -11), k % 2 ? '#c9a548' : '#2a5a3a'); letters(g, 'YAĞ', x + 3.2, -11.8, 1.8, '#f0e8d0', { kind: 'print', align: 'center', jit: 0 }); }
  for (let k = 0; k < 3; k++) { const x = 150 + k * 6; fill(g, rect(x, -4.4, x + 4, 0), '#9aa0a4'); }
  price(g, 170, -20, ['YAĞ', '90'], 112, 0.06);
  bulb(g, 169, -30.4, 2);
  vposter(g, 182, -64, 10, 14, 113); korSpray(g, 187, -57, 1);
  notice(g, 60, -40, 8, 10, 'kayip', 'KAYIP', 114);
  clip(g, OUT, () => weather(g, 0, w, -116, 101, 0.8));
  for (const x of [2, 197]) pipe(g, x, top, 0);
}

// --- the governor's office (mission 3) -----------------------------------------------
// Docs §10.5: the city's old governor's office, now the Secretariat. Cut
// stone and tall arched windows; the only building in town with its lights on
// (cold, behind blinds), the only one kept clean. Vanta's banners, LEDs,
// floodlights and cameras on it. A wing repeats along the plaza; the centre
// block has the carved name, the stopped clock and the door.
function archWin(g, x, y, w, h, lit = true, seed = 1) {
  const A = `M ${x} ${y + h} L ${x} ${y + w / 2} A ${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} L ${x + w} ${y + h} Z`;
  fill(g, `M ${x - 1.6} ${y + h + 1} L ${x - 1.6} ${y + w / 2} A ${w / 2 + 1.6} ${w / 2 + 1.6} 0 0 1 ${x + w + 1.6} ${y + w / 2} L ${x + w + 1.6} ${y + h + 1} Z`, '#6e685b');
  if (lit) {
    const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#dfe8f2'); gr.addColorStop(1, '#8c9cb0');
    fill(g, A, gr);
    const r = rng(seed), down = 0.25 + r() * 0.5;
    clip(g, A, () => { for (let k = y; k < y + h * down; k += 1.4) fill(g, rect(x, k, x + w, k + 0.7), '#6a7686', 0.8); });
    g.save(); g.globalCompositeOperation = 'lighter'; fill(g, rect(x - 3, y - 2, x + w + 3, y + h + 3), '#cfe0ff', 0.05); g.restore();
  } else fill(g, A, '#191b20');
  for (const fx of [x + w / 2]) fill(g, rect(fx - 0.35, y + 1, fx + 0.35, y + h), '#2a2824');
  for (let k = y + w / 2 + 4; k < y + h; k += 8) fill(g, rect(x, k - 0.35, x + w, k + 0.35), '#2a2824');
  // set back in the stone: the arch's soffit throws its shade down the glass
  // and along the far jamb; the sky across the dark panes
  clip(g, A, () => {
    const tg = g.createLinearGradient(0, y, 0, y + w * 0.7); tg.addColorStop(0, 'rgba(0,0,0,0.62)'); tg.addColorStop(1, 'rgba(0,0,0,0)');
    fill(g, rect(x, y, x + w, y + w * 0.7), tg);
    const sg = g.createLinearGradient(x, 0, x + 2.2, 0); sg.addColorStop(0, 'rgba(0,0,0,0.45)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    fill(g, rect(x, y, x + 2.2, y + h), sg);
    if (!lit) { const sk = g.createLinearGradient(x, y + h * 0.2, x + w, y + h); sk.addColorStop(0.3, 'rgba(160,180,210,0)'); sk.addColorStop(0.45, 'rgba(160,180,210,0.1)'); sk.addColorStop(0.6, 'rgba(160,180,210,0)'); fill(g, A, sk); }
  });
  fill(g, poly([[x + w / 2 - 2, y - 1.6], [x + w / 2 + 2, y - 1.6], [x + w / 2 + 1.4, y + 2.6], [x + w / 2 - 1.4, y + 2.6]]), '#7a7466');
  fill(g, rect(x - 2.4, y + h + 1, x + w + 2.4, y + h + 2.6), '#76705f');
  washDown(g, x - 2.4, x + w + 2.4, y + h + 2.6);
}

function valCommon(g, w, h, seed) {
  stoneWall(g, 0, w, -h, seed);
  // the rusticated ground floor: big blocks, deep joints
  fill(g, rect(0, -30, w, 0), '#544f45');
  clip(g, rect(0, -30, w, 0), () => {
    for (let y = -30, i = 0; y < 0; y += 7.5, i++) { fill(g, rect(0, y - 0.5, w, y + 0.4), '#1e1c18', 0.8); for (let x = -(i % 2) * 9; x < w; x += 18) fill(g, rect(x - 0.4, y, x + 0.4, y + 7.5), '#1e1c18', 0.7); }
    texture(g, 'concrete', 0.5, 3);
  });
  cornice(g, 0, w, -32, 2.4);
  cornice(g, 0, w, -h - 4, 4);
  for (let x = 1; x < w; x += 3.2) fill(g, rect(x, -h, x + 1.6, -h + 2), '#3a362f');
  // Vanta's red line under the cornice
  fill(g, rect(0, -h + 3, w, -h + 4.2), '#ff2a35'); fill(g, rect(0, -h + 3.4, w, -h + 3.8), '#ffc9cc');
}

function valWing(g) {
  const w = 160, h = 128;
  valCommon(g, w, h, 61);
  for (const [x, lit] of [[14, true], [71, false], [128, true]]) {
    archWin(g, x, -104, 18, 38, lit, x);
    win(g, x, -24, 18, 14, 'dark');
    for (let k = x + 2; k < x + 18; k += 3) fill(g, rect(k, -24, k + 0.6, -10), '#111316');
  }
  // the banner between the first bays, a floodlight, a camera
  const BN = poly([[40, -122], [62, -122], [62, -58], [51, -64], [40, -58]]);
  fill(g, BN, '#8e2330');
  clip(g, BN, () => texture(g, 'canvas', 0.5, 2.4));
  emblem(g, 51, -96, 6.4, '#f0dede');
  drape(g, BN, 40, 62, -122, -58, 1348);
  fill(g, rect(39, -123, 63, -120.6), '#2a2f36');
  fill(g, rect(107, -127, 109, -121), '#2a2f36'); fill(g, poly([[103, -121], [113, -121], [111, -117], [105, -117]]), '#3a3f47'); fill(g, rect(105, -117.4, 111, -116.6), '#f2f6ff');
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, poly([[105, -116.6], [111, -116.6], [126, -40], [90, -40]]), '#dfe9ff', 0.04); g.restore();
  fill(g, rect(150, -40, 156, -38.6), '#2a2f36'); fill(g, poly([[150, -38.6], [140, -40], [140, -35], [150, -34.4]]), '#c9ced6'); fill(g, ell(140.6, -37.4, 0.6, 0.6), '#14181d'); fill(g, ell(149, -36, 0.4, 0.4), '#ff2a35');
  weather(g, 0, w, -h, 61, 0.35);
}

function valilik(g) {
  const w = 220, h = 150;
  valCommon(g, w, h, 71);
  // the pilasters
  for (const x of [28, 70, 144, 186]) {
    fill(g, rect(x, -h + 22, x + 6, -32), '#67614f'); fill(g, rect(x + 5, -h + 22, x + 6, -32), '#000', 0.25);
    fill(g, rect(x - 1.2, -h + 20, x + 7.2, -h + 23), '#76705f'); fill(g, rect(x - 1.2, -35, x + 7.2, -32), '#76705f');
  }
  // the frieze and its carved name
  fill(g, rect(20, -h + 2, 200, -h + 18), '#625c4f');
  letters(g, 'VALİLİK', 110.5, -h + 14.5, 12, '#000', { align: 'center', jit: 0, track: 0.3, a: 0.45 });
  letters(g, 'VALİLİK', 109.7, -h + 13.7, 12, '#fff', { align: 'center', jit: 0, track: 0.3, a: 0.12 });
  letters(g, 'VALİLİK', 110, -h + 14, 12, '#625c4f', { align: 'center', jit: 0, track: 0.3 });
  // the attic, Vanta's lit sign bolted to it
  fill(g, rect(78, -h - 22, 142, -h - 4), '#5c574c'); cornice(g, 78, 142, -h - 25, 3);
  lightbox(g, 81, -h - 19, 139, -h - 8, 'SEKRETERLİK');
  // flags on the roof
  for (const x of [40, 180]) { fill(g, rect(x - 0.5, -h - 30, x + 0.5, -h - 4), '#8a7a4a'); fill(g, poly([[x + 0.5, -h - 29], [x + 13, -h - 28], [x + 12, -h - 20], [x + 0.5, -h - 21]]), '#8e2330'); emblem(g, x + 6.6, -h - 24.6, 2, '#f0dede'); }
  // windows in the bays
  for (const [x, lit] of [[42, true], [154, false]]) { archWin(g, x, -118, 22, 46, lit, x); win(g, x + 2, -24, 18, 14, 'dark'); }
  // the balcony over the door and Gall's office behind it: the one warm
  // window in the building, a desk lamp, the back of a tall chair
  const GW = `M 98 -82 L 98 -114 A 12 12 0 0 1 122 -114 L 122 -82 Z`;
  fill(g, `M 96.4 -81 L 96.4 -114 A 13.6 13.6 0 0 1 123.6 -114 L 123.6 -81 Z`, '#6e685b');
  const og = g.createRadialGradient(114, -92, 0, 112, -96, 22); og.addColorStop(0, '#ffd8a0'); og.addColorStop(1, '#6a3e22');
  fill(g, GW, og);
  clip(g, GW, () => {
    fill(g, rect(98, -90, 122, -82), '#2a1a10', 0.8);
    fill(g, `M 103 -82 L 103 -100 C 103 -103 109 -103 109 -100 L 109 -82 Z`, '#1a120c', 0.9);
    fill(g, rect(112, -91, 113, -86), '#2a1a10'); fill(g, poly([[109.6, -91], [115.4, -91], [114.2, -94], [110.8, -94]]), '#3a5a3a');
    fill(g, rect(98, -126, 99.4, -82), '#3a2216', 0.9); fill(g, rect(120.6, -126, 122, -82), '#3a2216', 0.9);
    fill(g, rect(109.6, -126, 110.4, -82), '#2a2420');
  });
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, rect(92, -128, 128, -76), '#ff9a5c', 0.06); g.restore();
  fill(g, rect(88, -81, 132, -77.6), '#76705f'); fill(g, rect(88, -81, 132, -80.4), '#8a8474');
  for (let x = 90; x < 131; x += 3.2) fill(g, ell(x + 0.8, -84.4, 0.9, 3.2), '#6e685b');
  fill(g, rect(88, -88.4, 132, -87), '#76705f');
  fill(g, poly([[88, -77.6], [132, -77.6], [128, -74.6], [92, -74.6]]), '#5c574c');
  for (const [x, d] of [[89, -1], [131, 1]]) { stroke(g, `M ${x} -84 L ${x + d * 12} -104`, '#8a7a4a', 0.5); fill(g, poly([[x + d * 12, -104], [x + d * 20, -100], [x + d * 16, -94], [x + d * 8.6, -98]]), '#8e2330'); }
  // the banners in the outer bays
  for (const x0 of [3, 195]) {
    const BN = poly([[x0, -h + 22], [x0 + 22, -h + 22], [x0 + 22, -52], [x0 + 11, -58], [x0, -52]]);
    fill(g, BN, '#8e2330');
    clip(g, BN, () => texture(g, 'canvas', 0.5, 2.4));
    emblem(g, x0 + 11, -96, 6.6, '#f0dede');
    drape(g, BN, x0, x0 + 22, -h + 22, -52, 1399 + x0);
  }
  // the door, the steps
  fill(g, `M 92 -6 L 92 -40 A 18 18 0 0 1 128 -40 L 128 -6 Z`, '#76705f');
  const D = `M 95 -6 L 95 -40 A 15 15 0 0 1 125 -40 L 125 -6 Z`;
  const dg = g.createLinearGradient(0, -55, 0, -6); dg.addColorStop(0, '#a8b8cc'); dg.addColorStop(1, '#e2eaf2');
  fill(g, D, dg);
  fill(g, rect(95, -38, 102, -6), '#3a2a1e'); fill(g, rect(118, -38, 125, -6), '#3a2a1e');
  clip(g, D, () => { for (let x = 95; x < 125; x += 2.4) fill(g, rect(x, -55, x + 0.5, -38), '#2a2f36'); });
  for (const [y, x0, x1] of [[-6, 82, 138], [-4, 76, 144], [-2, 70, 150]]) { fill(g, rect(x0, y, x1, y + 2), '#6e685b'); fill(g, rect(x0, y, x1, y + 0.5), '#8a8474'); }
  // the board by the door: what the Secretariat has decided
  fill(g, rect(132, -44, 152, -24), '#2a2f36');
  notice(g, 133, -43, 9, 9, 'vanta', 'MECLİS ASKIYA ALINMIŞTIR', 81);
  notice(g, 143, -43, 8.4, 9, 'vanta', 'SOKAĞA ÇIKMA YASAĞI', 82);
  notice(g, 133, -33.4, 18.4, 8.6, 'vanta', 'TOPLANMA YASAKTIR', 83);
  // floodlights on the frieze washing the front
  for (const x of [52, 168]) {
    fill(g, rect(x - 1, -h + 18, x + 1, -h + 22), '#2a2f36'); fill(g, poly([[x - 4, -h + 22], [x + 4, -h + 22], [x + 3, -h + 25], [x - 3, -h + 25]]), '#3a3f47'); fill(g, rect(x - 3, -h + 24.6, x + 3, -h + 25.4), '#f2f6ff');
    g.save(); g.globalCompositeOperation = 'lighter'; fill(g, poly([[x - 3, -h + 25.4], [x + 3, -h + 25.4], [x + 18, -30], [x - 18, -30]]), '#dfe9ff', 0.04); g.restore();
  }
  weather(g, 0, w, -h, 71, 0.3);
}

// the municipality on the square, shut since the council was suspended:
// stone gone grey with soot, dark windows, the doors chained under the
// notice, a Vanta banner over the old balcony; its clock tower, the clock
// stopped at ten
function belediye(g) {
  const w = 240, h = 116;
  stoneWall(g, 0, w, -h, 131, '#4e4a42');
  fill(g, rect(0, -30, w, 0), '#46423b');
  clip(g, rect(0, -30, w, 0), () => { for (let y = -30, i = 0; y < 0; y += 7.5, i++) { fill(g, rect(0, y - 0.5, w, y + 0.4), '#1e1c18', 0.8); for (let x = -(i % 2) * 9; x < w; x += 18) fill(g, rect(x - 0.4, y, x + 0.4, y + 7.5), '#1e1c18', 0.7); } texture(g, 'concrete', 0.5, 3); });
  cornice(g, 0, w, -32, 2.4);
  cornice(g, 0, w, -h - 4, 4);
  // the tower
  const TX = 100, TW = 40;
  stoneWall(g, TX, TX + TW, -196, 137, '#4e4a42');
  fill(g, rect(TX, -h - 4, TX + TW, -h), '#000', 0.2);
  cornice(g, TX, TX + TW, -178, 3);
  fill(g, poly([[TX - 3, -178], [TX + TW / 2, -204], [TX + TW + 3, -178]]), '#3a3632');
  fill(g, poly([[TX + TW / 2, -204], [TX + TW + 3, -178], [TX + TW / 2 + 2, -178]]), '#000', 0.2);
  stroke(g, `M ${TX + TW / 2} -204 L ${TX + TW / 2} -212`, '#2a2622', 0.6);
  fill(g, ell(TX + TW / 2, -158, 11, 11), '#6e685b'); fill(g, ell(TX + TW / 2, -158, 9.6, 9.6), '#cfc8b4');
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; fill(g, rect(TX + TW / 2 + Math.cos(a) * 8 - 0.35, -158 + Math.sin(a) * 8 - 0.35, TX + TW / 2 + Math.cos(a) * 8 + 0.35, -158 + Math.sin(a) * 8 + 0.35), '#2a2824'); }
  stroke(g, `M ${TX + TW / 2} -158 L ${TX + TW / 2 - 4} -160.4`, '#1a1816', 0.8); stroke(g, `M ${TX + TW / 2} -158 L ${TX + TW / 2} -165.6`, '#1a1816', 0.6);
  fill(g, ell(TX + TW / 2 + 5, -154, 4, 3), '#000', 0.12);
  for (const x of [TX + 8, TX + 26]) fill(g, `M ${x} -128 L ${x} -138 A 3 3 0 0 1 ${x + 6} -138 L ${x + 6} -128 Z`, '#141517');
  // the name, carved
  fill(g, rect(TX - 30, -h + 2, TX + TW + 30, -h + 16), '#55504a');
  letters(g, 'BELEDİYE', TX + TW / 2 + 0.4, -h + 13.4, 10, '#000', { align: 'center', jit: 0, track: 0.3, a: 0.45 });
  letters(g, 'BELEDİYE', TX + TW / 2 - 0.3, -h + 12.7, 10, '#fff', { align: 'center', jit: 0, track: 0.3, a: 0.1 });
  letters(g, 'BELEDİYE', TX + TW / 2, -h + 13, 10, '#55504a', { align: 'center', jit: 0, track: 0.3 });
  // the council hall windows, dark, one broken; the ground floor
  for (const [x, k] of [[14, false], [44, false], [168, false], [200, false]]) archWin(g, x, -98, 20, 40, k, x);
  for (const x of [14, 44, 168, 200]) win(g, x + 1, -24, 18, 14, 'dark');
  // the balcony with Vanta's banner draped over it
  fill(g, rect(TX - 6, -84, TX + TW + 6, -80.6), '#6a645a');
  for (let x = TX - 4; x < TX + TW + 5; x += 3.2) fill(g, ell(x + 0.8, -87.4, 0.9, 3.2), '#5e584f');
  fill(g, rect(TX - 6, -91.4, TX + TW + 6, -90), '#6a645a');
  const BN = poly([[TX - 4, -90], [TX + TW + 4, -90], [TX + TW + 2, -50], [TX + TW / 2, -44], [TX - 2, -50]]);
  fill(g, BN, '#8e2330');
  clip(g, BN, () => texture(g, 'canvas', 0.5, 2.4));
  emblem(g, TX + TW / 2, -68, 8, '#f0dede');
  drape(g, BN, TX - 4, TX + TW + 4, -90, -46, 1459);
  // the doors, chained, the notice
  fill(g, `M ${TX + 4} 0 L ${TX + 4} -30 A 16 16 0 0 1 ${TX + TW - 4} -30 L ${TX + TW - 4} 0 Z`, '#5c574c');
  const D = `M ${TX + 7} 0 L ${TX + 7} -30 A 13 13 0 0 1 ${TX + TW - 7} -30 L ${TX + TW - 7} 0 Z`;
  fill(g, D, '#2a1e16'); clip(g, D, () => { fill(g, rect(TX + TW / 2 - 0.3, -44, TX + TW / 2 + 0.3, 0), '#120c08'); texture(g, 'wood', 0.6, 2); });
  for (let t = 0; t <= 1; t += 0.08) { const x = TX + 14 + 12 * t, y = -14 + Math.sin(t * Math.PI) * 2.6; stroke(g, ell(x, y, 0.5, 0.32), '#8a8780', 0.2); }
  fill(g, rect(TX + 18.8, -11.6, TX + 21.2, -8.6), '#8a7a4a');
  notice(g, TX + 13, -30, 14, 12, 'vanta', 'MECLİS ASKIYA ALINMIŞTIR', 139);
  for (const [y, x0, x1] of [[-4, TX - 4, TX + TW + 4], [-2, TX - 8, TX + TW + 8]]) { fill(g, rect(x0, y, x1, y + 2), '#56514a'); fill(g, rect(x0, y, x1, y + 0.5), '#6e685b'); }
  korSpray(g, 70, -12, 1);
  weather(g, 0, w, -h, 131, 1);
}

// the governor's office seen across its railings from the square: the wing
// behind, stone piers and iron railings on a plinth in front
function valFence(g) {
  valWing(g);
  fill(g, rect(-3, -134, 163, 0.5), '#1a2030', 0.16);
  const w = 160;
  fill(g, rect(0, -12, w, 0), '#5c574c'); fill(g, rect(0, -12, w, -11), '#76705f');
  clip(g, rect(0, -12, w, 0), () => texture(g, 'concrete', 0.5, 3));
  for (let x = 2; x < w; x += 3.4) { fill(g, rect(x, -40, x + 0.6, -12), '#1a1c20'); fill(g, poly([[x - 0.5, -40], [x + 0.3, -42.6], [x + 1.1, -40]]), '#1a1c20'); }
  for (const y of [-36, -16]) fill(g, rect(0, y, w, y + 0.8), '#1a1c20');
  for (const x of [0, 76, 152]) {
    fill(g, rect(x, -46, x + 8, 0), '#5c574c'); fill(g, rect(x + 7, -46, x + 8, 0), '#000', 0.25);
    fill(g, rect(x - 1, -48, x + 9, -46), '#76705f');
    fill(g, ell(x + 4, -50.6, 2.6, 2.6), '#d8dee8'); g.save(); g.globalCompositeOperation = 'lighter'; fill(g, ell(x + 4, -50.6, 6, 6), '#cfe0ff', 0.08); g.restore();
  }
}

// --- the port side of the gate (mission 1) -------------------------------------------------
// Docs §10.8: outside the gate the road runs along the port: warehouses,
// the old customs house, containers stacked three high; at the gate Vanta's
// wall of containers shuts the city.

// a container seen from the side, flat: ribs, rails, corner castings, the
// door end, an owner code, rust
function boxSide(g, x0, y0, x1, y1, c, code = '', seed = 1, doorRight = true) {
  const B = rect(x0, y0, x1, y1), r = rng(seed), h = y1 - y0;
  fill(g, B, c);
  clip(g, B, () => {
    // a patch repainted in a shade that never quite matched
    if (r() < 0.6) { const px = x0 + 6 + r() * (x1 - x0 - 30); fill(g, rect(px, y0 + 1.6, px + 8 + r() * 10, y1 - 1.6), r() < 0.5 ? '#fff' : '#000', 0.07); }
    // the corrugation: each rib's flank in shade, its face, the other flank catching the sky
    for (let x = x0 + 2; x < x1 - 1; x += 2.4) {
      fill(g, rect(x - 0.3, y0 + 1.6, x + 0.2, y1 - 1.6), '#000', 0.12);
      fill(g, rect(x + 0.2, y0 + 1.6, x + 0.8, y1 - 1.6), '#000', 0.26);
      fill(g, rect(x + 0.8, y0 + 1.6, x + 1.3, y1 - 1.6), '#fff', 0.1);
    }
    fill(g, rect(x0, y0, x1, y0 + 1.6), '#000', 0.25); fill(g, rect(x0, y1 - 1.6, x1, y1), '#000', 0.3);
    const dx = doorRight ? x1 - 14 : x0;
    fill(g, rect(dx, y0 + 1.6, dx + 14, y1 - 1.6), c);
    fill(g, rect(dx + 6.8, y0 + 1.6, dx + 7.2, y1 - 1.6), '#000', 0.4);
    for (const lx of [dx + 2.6, dx + 4.8, dx + 9.2, dx + 11.4]) fill(g, rect(lx, y0 + 2, lx + 0.4, y1 - 2), '#000', 0.35);
    for (const [cx, cy] of [[x0, y0], [x1 - 2, y0], [x0, y1 - 2], [x1 - 2, y1 - 2]]) fill(g, rect(cx, cy, cx + 2, cy + 2), '#1a1a1a', 0.7);
    // rust: run down in streaks from the top rail and the corner castings, bloomed
    // along the bottom rail where the water stands; a couple of dents
    for (let i = 0; i < 6; i++) {
      const x = i < 2 ? (i ? x1 - 2.4 : x0 + 0.6) : x0 + 4 + r() * (x1 - x0 - 20), L = 3 + r() * h * 0.55, wd = 0.5 + r() * 0.6;
      const st = g.createLinearGradient(0, y0 + 1.6, 0, y0 + 1.6 + L);
      st.addColorStop(0, 'rgba(110,52,22,0.55)'); st.addColorStop(1, 'rgba(110,52,22,0)');
      fill(g, `M ${x} ${y0 + 1.6} L ${x + wd} ${y0 + 1.6} L ${x + wd * 0.6} ${y0 + 1.6 + L} L ${x + wd * 0.3} ${y0 + 1.6 + L} Z`, st);
    }
    for (let i = 0; i < 4; i++) fill(g, ell(x0 + 3 + r() * (x1 - x0 - 6), y1 - 1.8, 2 + r() * 4, 0.9 + r() * 0.8), '#6a3418', 0.4);
    for (let i = 0; i < 2; i++) { const dx2 = x0 + 6 + r() * (x1 - x0 - 26), dy2 = y0 + h * (0.35 + r() * 0.4); fill(g, ell(dx2, dy2, 2.4, 1.6), '#000', 0.16); fill(g, ell(dx2 - 0.4, dy2 - 1.1, 1.8, 0.5), '#fff', 0.08); }
    if (code) letters(g, code, doorRight ? x0 + 4 : x0 + 18, y0 + 5.6, 3, '#e8e4dc', { kind: 'print', jit: 0, a: 0.65 });
    texture(g, 'paint', 0.4, 2.4);
    // wet: the top rail and the upper ribs catch the sky, the bottom goes dark
    const wt = g.createLinearGradient(0, y0, 0, y1);
    wt.addColorStop(0, 'rgba(170,185,205,0.12)'); wt.addColorStop(0.35, 'rgba(170,185,205,0)'); wt.addColorStop(0.8, 'rgba(0,0,0,0)'); wt.addColorStop(1, 'rgba(0,0,0,0.25)');
    fill(g, B, wt);
  });
}

// a long, low bonded warehouse: numbered loading doors on a dock, the port
// authority's name faded on the band, Vanta's seizure plate on one door
function antrepo(g) {
  const w = 180, h = 78;
  fill(g, poly([[0, -h], [w / 2, -h - 12], [w, -h], [w, 0], [0, 0]]), '#4a4842');
  clip(g, poly([[0, -h], [w / 2, -h - 12], [w, -h], [w, 0], [0, 0]]), () => { for (let y = -h - 12; y < 0; y += 10) fill(g, rect(0, y, w, y + 0.4), '#2e2c28', 0.5); texture(g, 'concrete', 0.55, 3); });
  stroke(g, `M -1 ${-h} L ${w / 2} ${-h - 12} L ${w + 1} ${-h}`, '#2a2622', 1.6);
  fill(g, rect(6, -h + 4, w - 6, -h + 14), '#56534c');
  letters(g, 'LİMAN İŞLETMESİ', w / 2, -h + 12, 7, P.cream, { kind: 'sten', align: 'center', jit: 0, track: 0.14, a: 0.4 });
  // the dock and the doors
  fill(g, rect(0, -10, w, 0), '#3c3a36'); fill(g, rect(0, -10, w, -9), '#5e5a52');
  for (let x = 6; x < w; x += 14) fill(g, rect(x, -9, x + 1, 0), '#000', 0.3);
  for (const [k, x] of [[1, 10], [2, 66], [3, 122]]) {
    fill(g, rect(x - 1.4, -56, x + 49.4, -10), P.trim);
    shutter(g, x, x + 48, -54, -10);
    letters(g, String(k), x + 6, -46, 6, P.cream, { kind: 'sten', align: 'center', jit: 0, a: 0.5 });
    fill(g, rect(x + 20, -66.6, x + 28, -64.6), '#2a2622'); fill(g, rect(x + 21, -64.6, x + 27, -63.8), k === 2 ? '#2a2622' : '#ffc27a');
  }
  letters(g, 'ANTREPO 3', 146, -30, 5, P.cream, { kind: 'sten', align: 'center', jit: 0, a: 0.5 });
  fill(g, rect(72, -46, 108, -36), '#e4e3df'); fill(g, rect(72, -46, 108, -43.6), '#a8232d');
  emblem(g, 76, -39.4, 2.2, '#1d2129');
  letters(g, 'EL KONULMUŞTUR', 91, -38.2, 3.4, '#1d2129', { kind: 'print', align: 'center', jit: 0 });
  for (const x of [3, w - 3]) pipe(g, x, -h, -10);
  spray(g, 'KOR', 50, -16, 5, C.ember, { rot: -0.06, seed: 171 });
  weather(g, 0, w, -h, 171, 0.8);
}

// the old customs house: stone, a hipped roof, the name carved, shut
function gumruk(g) {
  const w = 140, h = 92;
  stoneWall(g, 0, w, -h, 181, '#524d44');
  // the hipped roof in slate: courses of tiles, a few slipped, wet and catching
  // the sky toward the ridge, the hips' lead flashing
  const ROOF = poly([[-3, -h], [20, -h - 22], [w - 20, -h - 22], [w + 3, -h]]);
  fill(g, ROOF, '#3a3632');
  clip(g, ROOF, () => {
    const r = rng(187);
    for (let y = -h - 22, i = 0; y < -h; y += 2.2, i++) {
      fill(g, rect(-4, y + 1.8, w + 4, y + 2.2), '#1e1c1a', 0.7);
      for (let x = -4 + (i % 2) * 2.4; x < w + 4; x += 4.8) {
        fill(g, rect(x, y, x + 0.25, y + 2.2), '#1e1c1a', 0.5);
        if (r() < 0.06) fill(g, rect(x + 0.3, y + 0.2, x + 4.5, y + 1.8), r() < 0.5 ? '#4e4a44' : '#26231f');
      }
    }
    const sh = g.createLinearGradient(0, -h - 22, 0, -h);
    sh.addColorStop(0, 'rgba(150,160,175,0.22)'); sh.addColorStop(0.5, 'rgba(150,160,175,0.05)'); sh.addColorStop(1, 'rgba(0,0,0,0.2)');
    fill(g, ROOF, sh);
  });
  fill(g, poly([[w / 2, -h - 22], [w - 20, -h - 22], [w + 3, -h], [w / 2 + 6, -h]]), '#000', 0.15);
  for (const d of [`M -3 ${-h} L 20 ${-h - 22}`, `M ${w + 3} ${-h} L ${w - 20} ${-h - 22}`, `M 20 ${-h - 22} L ${w - 20} ${-h - 22}`]) stroke(g, d, '#5e5a52', 0.6, 0.8);
  cornice(g, 0, w, -h - 3, 3);
  cornice(g, 0, w, -46, 2);
  fill(g, rect(30, -h + 2, 110, -h + 14), '#5c574c');
  letters(g, 'GÜMRÜK', 70.4, -h + 12.4, 9, '#000', { align: 'center', jit: 0, track: 0.3, a: 0.45 });
  letters(g, 'GÜMRÜK', 70, -h + 12, 9, '#5c574c', { align: 'center', jit: 0, track: 0.3 });
  for (const [x, k] of [[12, 'boarded'], [44, 'dark'], [82, 'dark'], [114, 'boarded']]) win(g, x, -76, 14, 22, k);
  for (const [x, k] of [[12, 'dark'], [114, 'broken']]) win(g, x, -36, 14, 20, k);
  fill(g, `M 56 0 L 56 -34 A 14 14 0 0 1 84 -34 L 84 0 Z`, '#6a645a');
  fill(g, `M 59 0 L 59 -34 A 11 11 0 0 1 81 -34 L 81 0 Z`, '#2a1e16');
  for (let t = 0; t <= 1; t += 0.1) { const x = 62 + 16 * t, y = -14 + Math.sin(t * Math.PI) * 2.4; stroke(g, ell(x, y, 0.5, 0.32), '#8a8780', 0.2); }
  notice(g, 63, -30, 14, 11, 'vanta', 'KAPATILMIŞTIR', 183);
  stroke(g, `M 70 ${-h - 22} L 70 ${-h - 40}`, '#6a6a66', 0.6);
  vposter(g, 96, -30, 10, 14, 185); korSpray(g, 101, -23, 1);
  weather(g, 0, w, -h, 181, 1);
}

// containers stacked three high in the yard behind the fence
const BOXC = ['#3f6a66', '#7a3e2e', '#3e5068', '#6a6a66', '#8a6a2e', '#4a5a3a'];
function stack(g) {
  const w = 120, rows = 3, H = 30;
  let k = 0;
  for (let j = 0; j < rows; j++) for (const [x0, x1] of j === 2 ? [[4, 62]] : [[0, 58], [60, 118]]) {
    boxSide(g, x0, -(j + 1) * H, x1, -j * H, BOXC[(k * 7 + j * 3) % BOXC.length], k % 2 ? 'VNTU 48' + (2113 + k) : 'MSKU 70' + (4410 + k), 191 + k, k % 2 === 0);
    k++;
  }
  fill(g, rect(-3, -92, w + 3, 0.5), '#1a2030', 0.12);
  weather(g, 0, w, -90, 191, 0.4);
}

// Vanta's wall of containers that shuts the city, painted over grey, the zone
// stencilled on, wire and a light on top
function wallC(g) {
  const w = 160, H = 32;
  for (let j = 0; j < 3; j++) for (const [x0, x1] of [[0, 78], [80, 158]]) boxSide(g, x0 + (j % 2) * 2, -(j + 1) * H, x1 + (j % 2) * 2, -j * H, '#5a616c', '', 201 + j * 2 + x0, x0 === 0);
  fill(g, rect(0, -36, w, -34), '#b3232e');
  letters(g, 'KONTROLLÜ BÖLGE', 40, -46, 5.4, '#e8ecf0', { kind: 'sten', align: 'center', jit: 0, track: 0.1, a: 0.8 });
  emblem(g, 120, -50, 7, '#e8ecf0');
  razor(g, 0, w, -98);
  fill(g, rect(79, -112, 81, -96), '#2a2f36'); fill(g, poly([[74, -114], [86, -114], [84, -110], [76, -110]]), '#3a3f47'); fill(g, rect(76, -110.4, 84, -109.6), '#f2f6ff');
  g.save(); g.globalCompositeOperation = 'lighter'; fill(g, poly([[76, -109.6], [84, -109.6], [104, -20], [56, -20]]), '#dfe9ff', 0.035); g.restore();
  vposter(g, 100, -28, 10, 14, 205);
  weather(g, 0, w, -96, 207, 0.4);
}

// --- old exports kept for the set pieces ----------------------------------------------
// a neon tube along a path: a coloured halo, then the pale hot core
export function tube(g, d, c, w = 0.9) {
  g.save(); g.shadowColor = c; g.shadowBlur = 9; stroke(g, d, c, w); g.restore();
  stroke(g, d, '#fff3fa', w * 0.36);
}
export function neonText(g, text, x, y, size, c, align = 'left') {
  g.save(); g.font = `700 ${size}px Rajdhani`; g.textBaseline = 'alphabetic'; g.textAlign = align;
  g.shadowColor = c; g.shadowBlur = 10; g.fillStyle = c; g.fillText(text, x, y);
  g.shadowBlur = 0; g.strokeStyle = '#fff3fa'; g.lineWidth = Math.max(0.16, size * 0.05); g.strokeText(text, x, y);
  g.restore();
}
// Vanta's red LED strip along a path: a row of diodes in a dark channel
export function ledStrip(g, d, w = 0.9) {
  stroke(g, d, '#1a1c20', w * 1.6);
  g.save(); g.shadowColor = '#ff2a35'; g.shadowBlur = 1.2 * ppu(g); stroke(g, d, '#ff2a35', w * 0.8); g.restore();
  stroke(g, d, '#ffd0d3', w * 0.25);
}

// --- catalogue and layout ----------------------------------------------------------------
// w: width, top: highest point (for the bake box); lights: [x, y, radius,
// intensity, [r,g,b], flicker?]; glows: emissive sprites [x, y, sx, sy,
// colour, alpha, flicker?]. Flicker: 'bulb' (a generator's bulbs, a slow
// wobble and now and then a dip), 'dying' (the last of the old neon), 'fire';
// none for Vanta's LEDs, which never flicker.
const WARM = [1, 0.72, 0.42], BULB = '#ffe2b0';
export const BUILDINGS = {
  walkup: { w: 150, top: -146, paint: walkup,
    lights: [[119, -26, 34, 0.5, WARM, 'bulb'], [20, -82, 24, 0.25, [1, 0.62, 0.34]]],
    glows: [[119, -27.4, 2.6, 2.6, BULB, 0.8, 'bulb']] },
  walkupB: { w: 128, top: -136, paint: walkupB,
    lights: [[35, -18, 44, 0.55, WARM, 'bulb']],
    glows: [[35, -26.7, 2.4, 2.4, BULB, 0.7, 'bulb']] },
  crow: { w: 160, top: -152, paint: crow,
    lights: [[82, -42, 74, 0.8, WARM, 'bulb'], [83, -8, 58, 0.5, [1, 0.6, 0.32]], [81, -76, 58, 0.55, [1, 0.82, 0.56], 'bulb'], [99, -96, 26, 0.3, [1, 0.68, 0.4]]],
    glows: [[38, -42.9, 2.4, 2.4, BULB, 0.85, 'bulb'], [62, -42.9, 2.4, 2.4, BULB, 0.85, 'bulb'], [104, -42.9, 2.4, 2.4, BULB, 0.85, 'bulb'], [126, -42.9, 2.4, 2.4, BULB, 0.85, 'bulb'],
      [49, -89.6, 3.4, 1.4, '#fff0d0', 0.7, 'bulb'], [113, -89.6, 3.4, 1.4, '#fff0d0', 0.7, 'bulb'], [80, -75, 46, 9, '#ffcf8f', 0.08, 'bulb'], [83, -16.4, 2.2, 2.2, BULB, 0.7]] },
  warehouse: { w: 164, top: -100, paint: warehouse,
    lights: [[70, -76, 54, 0.7, [0.9, 0.95, 1]]],
    glows: [[70.5, -78, 6, 2.4, '#f2f6ff', 0.55]] },
  synBlock: { w: 150, top: -136, paint: synBlock,
    lights: [[75, -98, 60, 0.4, [1, 0.2, 0.24]], [105, -41, 38, 0.55, [0.85, 0.92, 1]], [136, -23, 28, 0.5, [1, 0.16, 0.2]]],
    glows: [[75, -99.3, 76, 2.2, '#ff3347', 0.22], [105, -41.2, 21, 6, '#e8f0ff', 0.32], [136, -23, 13, 9, '#ff2a3a', 0.32], [139, -50, 1.4, 1.4, '#ff2a35', 0.8]] },
  hotel: { w: 96, top: -162, paint: hotel,
    lights: [[85, -88, 40, 0.45, [1, 0.38, 0.22], 'dying'], [46, -21, 30, 0.45, WARM, 'bulb']],
    glows: [[85, -108.6, 7, 7, '#ff6a3d', 0.28, 'dying'], [85, -78.6, 7, 7, '#ff6a3d', 0.28, 'dying'], [46, -21.1, 2.2, 2.2, BULB, 0.75, 'bulb']] },
  garage: { w: 132, top: -86, paint: garage,
    lights: [[55, -30, 64, 0.75, [0.92, 0.95, 1]]],
    glows: [[55, -42, 30, 1.6, '#eef4ff', 0.45]] },
  ruin: { w: 120, top: -104, paint: ruin,
    lights: [[50, -56, 66, 0.75, [1, 0.45, 0.2], 'fire']], glows: [[19, -69, 9, 6, '#ff7a35', 0.35, 'fire'], [83, -41, 9, 6, '#ff7a35', 0.35, 'fire'], [51, -35, 9, 6, '#ff7a35', 0.35, 'fire']] },
  alley: { w: 34, top: -106, paint: alley,
    lights: [[11.5, -26, 30, 0.45, WARM, 'bulb']], glows: [[11.5, -28.7, 2.2, 2.2, BULB, 0.7, 'bulb']] },
  union: { w: 140, top: -112, paint: union,
    lights: [[70, -10, 30, 0.4, [1, 0.6, 0.3], 'fire']],
    glows: [[58, -10.5, 5, 3, '#ffb060', 0.3, 'fire'], [82.4, -10, 5, 3, '#ffb060', 0.3, 'fire']] },
  pazar: { w: 150, top: -132, paint: pazar,
    lights: [[30, -27, 40, 0.6, WARM, 'bulb'], [112, -28, 36, 0.5, WARM, 'bulb'], [36, -12, 36, 0.35, [1, 0.6, 0.32]]],
    glows: [[30, -29.1, 2.4, 2.4, BULB, 0.8, 'bulb'], [112, -30.1, 2.4, 2.4, BULB, 0.8, 'bulb']] },
  pazarB: { w: 140, top: -126, paint: pazarB,
    lights: [[25, -30, 36, 0.45, WARM, 'bulb'], [105, -30, 36, 0.5, WARM, 'bulb']],
    glows: [[25, -36.7, 2.2, 2.2, BULB, 0.7, 'bulb'], [105, -31.9, 2.4, 2.4, BULB, 0.8, 'bulb']] },
  hal: { w: 200, top: -136, paint: hal,
    lights: [[31, -28, 38, 0.55, WARM, 'bulb'], [169, -28, 38, 0.55, WARM, 'bulb']],
    glows: [[31, -30.1, 2.4, 2.4, BULB, 0.8, 'bulb'], [169, -30.1, 2.4, 2.4, BULB, 0.8, 'bulb']] },
  antrepo: { w: 180, top: -94, paint: antrepo,
    lights: [[34, -60, 30, 0.4, [1, 0.66, 0.36]], [146, -60, 30, 0.4, [1, 0.66, 0.36]]],
    glows: [[34, -64.2, 4, 1.4, '#ffc27a', 0.6], [146, -64.2, 4, 1.4, '#ffc27a', 0.6]] },
  gumruk: { w: 140, top: -118, paint: gumruk, lights: [], glows: [] },
  stack: { w: 120, top: -94, paint: stack, lights: [], glows: [] },
  wallC: { w: 160, top: -118, paint: wallC,
    lights: [[80, -104, 70, 0.5, [0.9, 0.95, 1]]],
    glows: [[80, -110, 5, 2, '#f2f6ff', 0.6]] },
  belediye: { w: 240, top: -214, paint: belediye, lights: [], glows: [] },
  valFence: { w: 160, top: -134, paint: valFence,
    lights: [[23, -85, 30, 0.35, [0.82, 0.9, 1]], [137, -85, 30, 0.35, [0.82, 0.9, 1]], [80, -48, 40, 0.4, [0.85, 0.92, 1]]],
    glows: [[4, -50.6, 4, 4, '#e8f0ff', 0.5], [80, -50.6, 4, 4, '#e8f0ff', 0.5], [156, -50.6, 4, 4, '#e8f0ff', 0.5]] },
  valWing: { w: 160, top: -134, paint: valWing,
    lights: [[23, -85, 30, 0.35, [0.82, 0.9, 1]], [137, -85, 30, 0.35, [0.82, 0.9, 1]], [108, -110, 50, 0.45, [0.9, 0.95, 1]], [80, -123, 80, 0.3, [1, 0.2, 0.24]]],
    glows: [[80, -124.4, 80, 1.8, '#ff3347', 0.18], [108, -117, 5, 2, '#f2f6ff', 0.5], [149, -36, 1.2, 1.2, '#ff2a35', 0.8]] },
  valilik: { w: 220, top: -184, paint: valilik,
    lights: [[110, -163, 50, 0.55, [0.85, 0.92, 1]], [110, -24, 40, 0.5, [0.9, 0.95, 1]], [53, -95, 32, 0.35, [0.82, 0.9, 1]], [112, -96, 36, 0.5, [1, 0.7, 0.4]], [110, -145, 110, 0.3, [1, 0.2, 0.24]]],
    glows: [[110, -146.4, 110, 1.8, '#ff3347', 0.18], [110, -163.5, 30, 6, '#e8f0ff', 0.3], [52, -125, 5, 2, '#f2f6ff', 0.5], [168, -125, 5, 2, '#f2f6ff', 0.5], [112.5, -92.5, 4, 3, '#ffcf8f', 0.4]] },
  teahouse: { w: 96, top: -126, paint: teahouse,
    lights: [[32, -20, 44, 0.55, WARM, 'bulb']],
    glows: [[30, -27.7, 2.4, 2.4, BULB, 0.65, 'bulb']] },
};

// A street of buildings from x0 to x1: the opening ones as given, then a
// shuffled run in which no building comes back within three of its last
// use, an alley now and then; HAWK's shop only where it is asked for.
// Returns [{ type, x }].
export function facadeLayout(x0, x1, seed = 1, first = ['walkup', 'crow', 'alley', 'warehouse']) {
  const r = rng(seed), out = [];
  const pool = ['walkup', 'walkupB', 'warehouse', 'synBlock', 'hotel', 'garage', 'ruin', 'union', 'teahouse'];
  let x = x0, i = 0, sinceAlley = 0;
  const recent = [];
  while (x < x1) {
    let t = first[i];
    if (!t) {
      if (sinceAlley > 2 && r() < 0.35) t = 'alley';
      else { const ok = pool.filter((p) => !recent.includes(p)); t = ok[Math.floor(r() * ok.length)]; }
    }
    out.push({ type: t, x });
    x += BUILDINGS[t].w;
    sinceAlley = t === 'alley' ? 0 : sinceAlley + 1;
    if (t !== 'alley') { recent.push(t); if (recent.length > 3) recent.shift(); }
    i++;
  }
  return out;
}

// bake entries for every building type (background density, no outline)
// Weather over every painted facade (docs §11, kit.weatherOver): night falls
// from the top, since the street lamps never reach the upper floors; damp and
// soot in soft blotches; rain run down from sills and ledges; the splash zone
// darker at the foot. The same pass on every building, so the street reads as
// one place.
const nightWeather = (g, b, seed) => weatherOver(g, [0, b.top, b.w, 0], seed, { night: 0.55, foot: 0.35, stain: 0.7, rain: 3.8, speck: 0.12 });

export function buildingBakeList(scale) {
  return Object.entries(BUILDINGS).map(([t, b], i) => ({ name: `b.${t}`, box: [-3, b.top, b.w + 3, 0.5], scale, paint: (g) => { b.paint(g); nightWeather(g, b, 101 + i * 17); } }));
}

// the old single-strip facade (dev scenes): four buildings in a row
export function facadeStrip(g) {
  let x = -10;
  for (const t of ['walkup', 'crow', 'warehouse', 'synBlock']) { g.save(); g.translate(x, 0); BUILDINGS[t].paint(g); g.restore(); x += BUILDINGS[t].w; }
}
