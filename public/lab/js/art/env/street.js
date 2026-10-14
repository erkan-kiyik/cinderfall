// KOR LAB — the street, style-board cut.
//
// Units are world units (a person is 64 tall); the street surface is y = 0
// and the scene spans x 0..600. Background layers are flat colour with no
// outline and saturation held low; anything you can stand behind, shoot or
// use is a prop with the dark outline, so the play layer always reads first.
import { cel, fill, stroke, clip, rng, setRoot } from '../kit.js';
import { M, tone, C } from '../style.js';
import { emblem } from '../enemies/syndicate.js';
import { facadeStrip } from './city.js';

const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

const SKY = ['#151b27', '#1a2130', '#202839', '#283043', '#33384d', '#433f54', '#57475a'];
const FAR = '#262e3e', FAR_WIN = '#6c6372';
const MID = '#2e3748', MID_HI = '#38425a';

function sky(g) {
  // stepped dusk bands, warmer toward the horizon where the city burns
  const top = -172, h = 150 / SKY.length;
  SKY.forEach((c, i) => fill(g, rect(-10, top + i * h, 610, top + (i + 1) * h + 0.5), c));
  fill(g, rect(-10, -64, 610, -22), '#6a4250', 0.35);
  fill(g, rect(-10, -48, 610, -22), '#8a4a40', 0.25);
  // a few stars where the smoke is thin
  const r = rng(5);
  for (let i = 0; i < 40; i++) { const x = r() * 610, y = -170 + r() * 46, k = 0.3 + r() * 0.4; fill(g, rect(x, y, x + k, y + k), '#c9cfe0', 0.35 + r() * 0.4); }
}

function farCity(g) {
  // the fires on the horizon: flat glow bands behind the skyline, smoke columns
  fill(g, rect(-10, -96, 610, -58), '#5a3040', 0.35);
  fill(g, rect(-10, -80, 610, -58), '#8a3a2a', 0.3);
  for (const [x, w] of [[60, 70], [250, 50], [470, 90]]) {
    fill(g, ell(x, -62, w, 14), '#c4552a', 0.18);
    fill(g, ell(x, -62, w * 0.5, 8), '#ff7a35', 0.16);
  }
  for (const [x, w, h] of [[50, 20, 110], [262, 14, 80], [480, 26, 120]]) {
    for (let k = 0; k < 6; k++) fill(g, ell(x + k * k * 1.2, -70 - k * (h / 6), w * (0.6 + k * 0.15), 7 + k * 1.5), '#2a2a36', 0.5 - k * 0.05);
  }
  const r = rng(91);
  let x = -6;
  while (x < 610) {
    const w = 14 + r() * 26, h = 20 + r() * 44, top = -84 - h;
    fill(g, rect(x, top, x + w, -60), FAR);
    // roof clutter: an antenna, a water tank, a stepped crown
    const k = r();
    if (k < 0.3) { fill(g, rect(x + w * 0.5, top - 8, x + w * 0.5 + 0.8, top), FAR); fill(g, rect(x + w * 0.5 - 2, top - 5, x + w * 0.5 + 2.8, top - 4.4), FAR); }
    else if (k < 0.5) { fill(g, rect(x + 3, top - 6, x + 9, top - 1.2), FAR); fill(g, rect(x + 3.6, top - 1.2, x + 4.4, top), FAR); fill(g, rect(x + 7.6, top - 1.2, x + 8.4, top), FAR); }
    else if (k < 0.65) fill(g, rect(x + 3, top - 5, x + w - 3, top), FAR);
    for (let wy = top + 4; wy < -64; wy += 5) for (let wx = x + 2; wx < x + w - 3; wx += 4) {
      const q = r();
      if (q > 0.84) fill(g, rect(wx, wy, wx + 1.4, wy + 2), FAR_WIN, 0.7);
      else if (q > 0.81) fill(g, rect(wx, wy, wx + 1.4, wy + 2), '#ff8a4a', 0.65);
    }
    x += w + r() * 3;
  }
  // a construction crane over the skyline
  fill(g, rect(150, -150, 152, -60), FAR); fill(g, rect(126, -150, 212, -148), FAR);
  for (let k = 128; k < 210; k += 6) stroke(g, `M ${k} -148 L ${k + 3} -150`, FAR, 0.5);
  stroke(g, 'M 151 -158 L 128 -150 M 151 -158 L 210 -150', FAR, 0.5);
  fill(g, rect(150.4, -160, 151.6, -150), FAR); fill(g, rect(190, -148, 190.6, -126), '#1d2330'); fill(g, rect(187, -126, 193.6, -123), FAR);
  g.save(); g.shadowColor = C.danger; g.shadowBlur = 6; fill(g, ell(151, -160, 0.9, 0.9), C.danger); g.restore();
  // the Tower: the campaign's final objective on the horizon
  fill(g, poly([[420, -60], [424, -154], [436, -162], [448, -154], [452, -60]]), '#222a39');
  fill(g, rect(434.5, -176, 437.5, -160), '#222a39');
  g.save(); g.shadowColor = C.danger; g.shadowBlur = 10; fill(g, ell(436, -176, 1.6, 1.6), C.danger); g.restore();
  for (let y = -150; y < -66; y += 7) fill(g, rect(428, y, 444, y + 1.2), '#3a3550', 0.8);
}

function midIndustry(g) {
  // sawtooth-roof works, stacks with flat smoke, and a Syndicate billboard
  const Y = -42;
  fill(g, poly([[-10, Y], [-10, Y - 52], [20, Y - 66], [20, Y - 52], [50, Y - 66], [50, Y - 52], [80, Y - 66], [80, Y - 52], [110, Y - 66], [110, Y]]), MID);
  fill(g, rect(120, Y - 92, 132, Y), MID); fill(g, rect(118, Y - 94, 134, Y - 90), MID_HI);
  fill(g, rect(146, Y - 78, 156, Y), MID); fill(g, rect(144, Y - 80, 158, Y - 76), MID_HI);
  for (const [x, y, sc] of [[128, Y - 100, 1], [134, Y - 110, 1.3], [142, Y - 121, 1.6], [154, Y - 86, 0.9], [160, Y - 94, 1.2]]) fill(g, ell(x, y, 7 * sc, 4.4 * sc), '#4a4f63', 0.75);
  fill(g, rect(110, Y - 40, 300, Y), MID);
  fill(g, poly([[300, Y], [300, Y - 50], [360, Y - 50], [380, Y - 38], [380, Y]]), MID);
  fill(g, rect(500, Y - 56, 610, Y), MID);
  for (let x = 504; x < 606; x += 8) fill(g, rect(x, Y - 52, x + 4, Y - 48), '#5b4f5e', 0.6);
  // billboard on stilts
  const B = Y - 52;
  fill(g, rect(334, B, 336, Y), '#1c2230'); fill(g, rect(390, B, 392, Y), '#1c2230');
  fill(g, rect(318, B - 36, 410, B), '#252c3b');
  fill(g, rect(320, B - 34, 408, B - 2), '#3c2730');
  fill(g, rect(320, B - 10, 408, B - 6), C.danger, 0.8);
  emblem(g, 340, B - 22, 8, '#e8d9d9');
  g.font = '700 10px Rajdhani'; g.fillStyle = '#e8d9d9'; g.textBaseline = 'alphabetic';
  g.fillText('VANTA SYNDICATE', 354, B - 20);
  g.font = '600 6px Rajdhani'; g.fillStyle = '#c9a9ae'; g.fillText('DÜZEN · GÜVENLİK · İTAAT', 354, B - 12);
  // haze between the layers
  fill(g, rect(-10, -64, 610, -40), '#5a5168', 0.16);
  fill(g, rect(-10, -52, 610, -40), '#5a5168', 0.14);
}

// --- ground -----------------------------------------------------------------
function ground(g) {
  const r = rng(77);
  // the pavement: slabs, joints, a few cracked and stained ones
  fill(g, rect(-10, 0, 610, 4.2), '#56607a');
  fill(g, rect(-10, 0, 610, 0.8), '#7a849c');
  for (let x = -4; x < 610; x += 12) stroke(g, `M ${x} 0.8 L ${x - 0.8} 4.2`, '#46506a', 0.35);
  for (let i = 0; i < 14; i++) {
    const x = r() * 600, k = r();
    if (k < 0.5) stroke(g, `M ${x} 1 l 1.4 1.2 l -0.6 1.6`, '#3e4760', 0.25);
    else fill(g, ell(x, 2.4, 2 + r() * 3, 0.8), '#3e4760', 0.5);
  }
  // the kerb: a lit edge, its face, the gutter
  fill(g, rect(-10, 4.2, 610, 5.1), '#8c94a8');
  fill(g, rect(-10, 5.1, 610, 7.2), '#394052');
  for (let x = 0; x < 610; x += 24) stroke(g, `M ${x} 4.2 L ${x} 7.2`, '#2c3242', 0.3);
  fill(g, rect(-10, 7.2, 610, 8.8), '#1b2029');
  // storm drains in the kerb
  for (const x of [70, 330, 540]) { fill(g, rect(x, 5.4, x + 10, 8.8), '#0f1217'); for (let k = x + 1; k < x + 10; k += 1.6) fill(g, rect(k, 5.4, k + 0.6, 8.8), '#2c3242'); }
  // the road
  fill(g, rect(-10, 8.8, 610, 42), '#222833');
  for (let i = 0; i < 7; i++) { const x = r() * 590, w = 24 + r() * 50, y = 10 + r() * 22; fill(g, rect(x, y, x + w, y + 4 + r() * 6), r() > 0.5 ? '#262c38' : '#1f242e'); }
  for (let i = 0; i < 9; i++) {
    const x = r() * 600, y = 11 + r() * 26;
    stroke(g, `M ${x} ${y} l ${2 + r() * 3} ${r() * 1.6 - 0.8} l ${2 + r() * 3} ${r() * 1.6 - 0.8} l ${1 + r() * 2} ${r() * 1.6 - 0.8}`, '#171b23', 0.3);
  }
  // worn lane dashes
  for (let x = 0; x < 610; x += 40) { fill(g, rect(x, 22.6, x + 20, 24.2), '#5b6377'); fill(g, rect(x + 4 + r() * 10, 22.6, x + 7 + r() * 10, 24.2), '#222833', 0.7); }
  // manholes, oil stains, puddles catching the street lights
  for (const x of [150, 470]) { fill(g, ell(x, 31, 7, 1.8), '#14171d'); fill(g, ell(x, 30.8, 6.2, 1.4), '#2c323e'); for (let k = -4; k <= 4; k += 2) stroke(g, `M ${x + k} 29.8 L ${x + k} 31.8`, '#1b1f27', 0.3); }
  for (const [x, y, w] of [[220, 14, 9], [410, 33, 12], [590, 17, 7]]) fill(g, ell(x, y, w, 1.4), '#15191f', 0.7);
  for (const [x, y, w, c] of [[100, 12.6, 14, '#ffcf8f'], [300, 16, 10, '#ff6b52'], [520, 13, 16, '#ffcf8f']]) {
    fill(g, ell(x, y, w, 1.6), '#181c24');
    fill(g, ell(x - w * 0.2, y - 0.2, w * 0.5, 0.5), c, 0.22);
    fill(g, ell(x + w * 0.3, y + 0.3, w * 0.25, 0.3), '#8a96b0', 0.18);
  }
  fill(g, rect(-10, 36, 610, 42), '#000', 0.2);
}

// --- props (outlined play layer) ---------------------------------------------
const WOOD = tone('#c9935c', '#a5713f', '#7a4f29', '#3e2612');
const CONC = tone('#b9bcc6', '#8d919d', '#666a76', '#2f323a');

export function crate(g, x, w = 18, h = 16) {
  const B = rect(x, -h, x + w, 0), f = 2.2;
  cel(g, B, WOOD, { sh: 1.4, hl: 0.6 });
  clip(g, B, () => {
    // the planks behind the frame, with grain
    for (let y = -h + 3.6; y < -0.5; y += 3.6) { stroke(g, `M ${x} ${y} L ${x + w} ${y}`, WOOD.k, 0.4, 0.7); stroke(g, `M ${x} ${y + 0.5} L ${x + w} ${y + 0.5}`, WOOD.l, 0.3, 0.5); }
    for (const [gx, gy] of [[0.3, -0.7], [0.62, -0.45], [0.45, -0.22]]) stroke(g, `M ${x + w * gx} ${h * gy} l 3.4 0.3`, WOOD.d, 0.25, 0.8);
    // the frame boards round the edge
    fill(g, rect(x, -h, x + w, -h + f), WOOD.m); fill(g, rect(x, -h, x + w, -h + 0.6), WOOD.l);
    fill(g, rect(x, -f, x + w, 0), WOOD.d);
    fill(g, rect(x, -h, x + f, 0), WOOD.m); fill(g, rect(x + w - f, -h, x + w, 0), WOOD.d);
    // the diagonal brace
    fill(g, poly([[x + f, -f - 1.6], [x + f + 1.6, -f], [x + w - f, -h + f + 1.6], [x + w - f - 1.6, -h + f]]), WOOD.m);
    stroke(g, `M ${x + f + 0.8} ${-f - 0.8} L ${x + w - f - 0.8} ${-h + f + 0.8}`, WOOD.l, 0.35, 0.6);
    // stencil
    g.font = '700 3.4px Rajdhani'; g.fillStyle = 'rgba(40,24,12,0.7)'; g.fillText('KOR', x + w * 0.56, -f - 1.2);
  });
  // steel corners with a rivet each
  for (const [cx, cy, sx, sy] of [[x, -h, 1, 1], [x + w, -h, -1, 1], [x, 0, 1, -1], [x + w, 0, -1, -1]]) {
    const L = poly([[cx, cy], [cx + 3.4 * sx, cy], [cx + 3.4 * sx, cy + 1.1 * sy], [cx + 1.1 * sx, cy + 1.1 * sy], [cx + 1.1 * sx, cy + 3.4 * sy], [cx, cy + 3.4 * sy]]);
    cel(g, L, M.gunmetal, { sh: 0.3, hl: 0.2, lw: 0.25 });
    fill(g, ell(cx + 0.7 * sx, cy + 0.7 * sy, 0.3, 0.3), M.gunmetal.l);
  }
  stroke(g, B, WOOD.k, 0.4);
}

export function barrier(g, x, w = 34) {
  const B = poly([[x, 0], [x + 4, -6], [x + 6, -16], [x + w - 6, -16], [x + w - 4, -6], [x + w, 0]]);
  cel(g, B, CONC, { sh: 1.6, hl: 0.7 });
  clip(g, B, () => {
    // the sloped foot in shade, the top face lit
    fill(g, rect(x, -6, x + w, 0), CONC.d, 0.55);
    fill(g, rect(x, -16, x + w, -14.8), CONC.l, 0.7);
    fill(g, rect(x, -12, x + w, -8.4), C.gold);
    for (let k = x - 6; k < x + w; k += 5) fill(g, poly([[k, -8.4], [k + 2.5, -8.4], [k + 6.1, -12], [k + 3.6, -12]]), '#1a1c20');
    // a chipped corner, cracks, scuffs, an amber reflector
    fill(g, poly([[x + w - 6, -16], [x + w - 9.5, -16], [x + w - 6.4, -13.2]]), CONC.k, 0.8);
    stroke(g, `M ${x + 9} -16 l 1.2 3 l -0.8 2.4`, CONC.k, 0.25, 0.8);
    stroke(g, `M ${x + w * 0.66} -6 l 1.4 2.6 l 1.8 0.8`, CONC.k, 0.25, 0.7);
    for (const sx of [x + 7, x + 15, x + 22]) fill(g, rect(sx, -4.4, sx + 3, -3.8), CONC.k, 0.35);
    fill(g, rect(x + w / 2 - 1.4, -6, x + w / 2 + 1.4, -4.4), '#ffb030');
    g.font = '700 2.8px Rajdhani'; g.fillStyle = 'rgba(47,50,58,0.7)'; g.fillText('B-114', x + 8, -13.4);
  });
  stroke(g, B, CONC.k, 0.4);
  // rebar lifting loops on top
  for (const lx of [x + 10, x + w - 10]) stroke(g, `M ${lx - 1.6} -16 C ${lx - 1.6} -18.2 ${lx + 1.6} -18.2 ${lx + 1.6} -16`, '#6a4a3a', 0.55);
}

export function lampPost(g, x, h = 82) {
  const P = tone('#5d6878', '#3c4654', '#2a323d', '#12151b');
  cel(g, rect(x - 1.2, -h, x + 1.2, 0), P, { sh: 0.8, hl: 0.3 });
  // joints, an access hatch, a sticker, the base flange with bolts
  for (const y of [-h + 20, -h + 44]) cel(g, rect(x - 1.6, y, x + 1.6, y + 1.6), P, { sh: 0.3, hl: 0.2, lw: 0.25 });
  fill(g, rect(x - 0.8, -18, x + 0.8, -12), P.d);
  fill(g, rect(x - 1, -30, x + 1, -27), '#c9b991', 0.8);
  cel(g, poly([[x - 3.2, 0], [x - 2.4, -4], [x + 2.4, -4], [x + 3.2, 0]]), P, { sh: 0.6, hl: 0.3 });
  for (const bx of [x - 2.2, x + 2.2]) fill(g, ell(bx, -0.9, 0.4, 0.4), P.l);
  // the arm and the lamp head
  cel(g, poly([[x, -h], [x + 14, -h - 2], [x + 14, -h + 0.6], [x, -h + 2.2]]), P, { sh: 0.5, hl: 0.2 });
  stroke(g, `M ${x} ${-h + 6} Q ${x + 4} ${-h + 1} ${x + 9} ${-h - 0.6}`, P.d, 0.5);
  cel(g, poly([[x + 10, -h - 1.4], [x + 20, -h - 1.4], [x + 22, -h + 2.4], [x + 8, -h + 2.4]]), P, { sh: 0.5, hl: 0.3 });
  fill(g, rect(x + 12, -h - 2.6, x + 18, -h - 1.4), P.d);
  fill(g, rect(x + 9.6, -h + 2.2, x + 20.4, -h + 3.2), '#fff1d0');
}

function lampLight(g, x, h = 82) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const cx = x + 15;
  fill(g, poly([[cx - 5, -h + 3], [cx + 5, -h + 3], [cx + 26, 0], [cx - 26, 0]]), '#ffcf8f', 0.10);
  fill(g, poly([[cx - 4, -h + 3], [cx + 4, -h + 3], [cx + 16, 0], [cx - 16, 0]]), '#ffcf8f', 0.08);
  fill(g, ell(cx, 1.5, 26, 3), '#ffcf8f', 0.16);
  fill(g, ell(cx, -h + 3, 6, 3), '#fff1d0', 0.35);
  g.restore();
}

export function dumpster(g, x) {
  const D = tone('#5f8a6a', '#466e52', '#30503b', '#14241a');
  const B = poly([[x, -20], [x + 40, -20], [x + 38, -2], [x + 2, -2]]);
  cel(g, B, D, { sh: 1.6, hl: 0.6 });
  clip(g, B, () => {
    for (let k = x + 6; k < x + 38; k += 8) { stroke(g, `M ${k} -18 L ${k} -4`, D.d, 0.8); stroke(g, `M ${k + 0.8} -18 L ${k + 0.8} -4`, D.l, 0.3, 0.5); }
    fill(g, rect(x + 26, -16, x + 36, -11), '#d9dee5');
    g.font = '700 2.4px Rajdhani'; g.fillStyle = '#30503b'; g.fillText('ATIK', x + 27, -12.6);
    fill(g, ell(x + 14, -9, 3, 2), D.d, 0.6);
    fill(g, rect(x, -7, x + 40, -2), '#000', 0.15);
  });
  // the lid, a little open, its hinge and the side handles
  cel(g, poly([[x - 1, -21.6], [x + 41, -24.2], [x + 41, -22.2], [x - 1, -19.6]]), D, { sh: 0.4, hl: 0.25 });
  fill(g, rect(x - 1.6, -21.4, x + 1, -19.4), D.k);
  for (const hx of [x + 1.2, x + 36.6]) cel(g, rect(hx, -16, hx + 2.2, -14.4), M.gunmetal, { sh: 0.2, hl: 0.2, lw: 0.25 });
  for (const wx of [x + 6, x + 34]) cel(g, ell(wx, -1.6, 1.8, 1.8), M.rubber, { sh: 0.4, hl: 0.2 });
}

export function burnBarrel(g, x) {
  const T = tone('#9a6450', '#6b3f30', '#4a2a20', '#22130d');
  const B = poly([[x + 0.4, -14], [x + 9.6, -14], [x + 10, -12.6], [x + 10, -1], [x + 9.4, 0], [x + 0.6, 0], [x, -1], [x, -12.6]]);
  cel(g, B, T, { sh: 1.2, hl: 0.5 });
  clip(g, B, () => {
    // ribs, rust, a dent, and the air holes punched near the bottom, glowing
    for (const y of [-10, -4.6]) { fill(g, rect(x, y, x + 10, y + 1), T.d); fill(g, rect(x, y, x + 10, y + 0.35), T.l, 0.6); }
    fill(g, poly([[x + 1, -9], [x + 4, -8.4], [x + 3, -6], [x + 1.2, -6.4]]), '#8a4a28', 0.6);
    fill(g, ell(x + 7.4, -7.2, 1.6, 1.2), T.d, 0.6);
    for (const hx of [x + 2.2, x + 5, x + 7.8]) { fill(g, ell(hx, -2.4, 0.7, 0.55), '#ff8a3a'); fill(g, ell(hx, -2.2, 0.35, 0.3), '#ffd56a'); }
  });
  // the lip at the top
  cel(g, rect(x - 0.4, -14.6, x + 10.4, -13.4), T, { sh: 0.3, hl: 0.3, lw: 0.3 });
  fill(g, rect(x + 0.6, -14.4, x + 9.4, -13.8), '#2a1008');
}

// Flames and glow sit in the light pass so they never pick up the outline.
function fireLight(g, x) {
  g.save(); g.globalCompositeOperation = 'lighter';
  fill(g, ell(x + 5, -14, 22, 16), '#ff8a3a', 0.09);
  fill(g, ell(x + 5, -14, 10, 8), '#ff8a3a', 0.12);
  g.restore();
  g.save(); g.shadowColor = '#ff8a3a'; g.shadowBlur = 10;
  fill(g, poly([[x + 1, -14], [x + 2.4, -20], [x + 3.6, -16.4], [x + 5, -23], [x + 6.4, -16.6], [x + 7.8, -20.4], [x + 9, -14]]), '#ff8a3a');
  fill(g, poly([[x + 2.6, -14], [x + 3.8, -17.2], [x + 5, -19.6], [x + 6.2, -17], [x + 7.4, -14]]), '#ffd56a');
  g.restore();
}

export function cone(g, x) {
  const T = tone('#ffb070', '#ff7a35', '#c4441a', '#5e2410');
  cel(g, poly([[x - 4, 0], [x - 1, -10], [x + 1, -10], [x + 4, 0]]), T, { sh: 0.8, hl: 0.4 });
  fill(g, poly([[x - 2.6, -4.6], [x + 2.6, -4.6], [x + 2.1, -6.4], [x - 2.1, -6.4]]), '#f4f1ea');
  cel(g, rect(x - 5, -1, x + 5, 0), M.black, { sh: 0.3, hl: 0.1 });
}

export const STREET = { sky, farCity, midIndustry, facades: facadeStrip, ground, lampLight, fireLight };
