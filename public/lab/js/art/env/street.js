// CINDERFALL LAB — Sector 9 street, style-board cut.
//
// Units are world units (a person is 64 tall); the street surface is y = 0
// and the scene spans x 0..600. Background layers are flat colour with no
// outline and saturation held low; anything you can stand behind, shoot or
// use is a prop with the dark outline, so the play layer always reads first.
import { cel, fill, stroke, clip, rng, setRoot } from '../kit.js';
import { M, tone, C } from '../style.js';
import { emblem } from '../enemies/syndicate.js';

const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

const SKY = ['#151b27', '#1a2130', '#202839', '#283043', '#33384d', '#433f54', '#57475a'];
const FAR = '#262e3e', FAR_WIN = '#6c6372';
const MID = '#2e3748', MID_HI = '#38425a';

function sky(g) {
  // stepped dusk bands instead of a soft gradient
  const top = -172, h = 150 / SKY.length;
  SKY.forEach((c, i) => fill(g, rect(-10, top + i * h, 610, top + (i + 1) * h + 0.5), c));
  // a low ember sun bleeding through the haze
  fill(g, ell(470, -96, 46, 46), '#6a4a55', 0.5);
  fill(g, ell(470, -96, 30, 30), '#8a5257', 0.5);
}

function farCity(g) {
  const r = rng(91);
  let x = -6;
  while (x < 610) {
    const w = 14 + r() * 26, h = 20 + r() * 44;
    fill(g, rect(x, -84 - h, x + w, -60), FAR);
    for (let wy = -80 - h + 4; wy < -80; wy += 5) for (let wx = x + 2; wx < x + w - 3; wx += 4) if (r() > 0.82) fill(g, rect(wx, wy, wx + 1.4, wy + 2), FAR_WIN, 0.7);
    x += w + r() * 3;
  }
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
  g.fillText('ASH SYNDICATE', 354, B - 20);
  g.font = '600 6px Rajdhani'; g.fillStyle = '#c9a9ae'; g.fillText('DÜZEN · GÜVENLİK · İTAAT', 354, B - 12);
  // haze between the layers
  fill(g, rect(-10, -64, 610, -40), '#5a5168', 0.16);
  fill(g, rect(-10, -52, 610, -40), '#5a5168', 0.14);
}

// --- street facades (flat, unlit except for their own windows and signs) ----
const FAC = { brick: '#433a45', brickHi: '#4d4350', panel: '#39445a', panelHi: '#435069', conc: '#4a4c58', concHi: '#555866', trim: '#262b37' };

function windowLit(g, x, y, w, h, on) {
  fill(g, rect(x - 0.8, y - 0.8, x + w + 0.8, y + h + 0.8), FAC.trim);
  fill(g, rect(x, y, x + w, y + h), on ? '#ffbe78' : '#1a1f2a');
  if (on) {
    fill(g, rect(x, y + h * 0.55, x + w, y + h), '#e48a52');
    fill(g, rect(x + w * 0.15, y + h * 0.2, x + w * 0.35, y + h), '#2a2230', 0.6);
    g.save(); g.globalCompositeOperation = 'lighter'; fill(g, rect(x - 2, y - 2, x + w + 2, y + h + 2), '#ff9a5c', 0.08); g.restore();
  } else {
    fill(g, poly([[x, y], [x + w * 0.4, y], [x, y + h * 0.6]]), '#2b3342');
  }
  fill(g, rect(x - 1.2, y + h + 0.8, x + w + 1.2, y + h + 2), FAC.trim);
}

function facades(g) {
  // A: brick walk-up with a fire escape
  fill(g, rect(-10, -96, 142, 0), FAC.brick);
  for (let y = -92; y < -4; y += 4) stroke(g, `M -10 ${y} L 142 ${y}`, FAC.brickHi, 0.35, 0.35);
  fill(g, rect(-10, -100, 142, -96), FAC.trim);
  for (const [x, y, on] of [[10, -86, 1], [40, -86, 0], [70, -86, 1], [100, -86, 0], [40, -56, 1], [70, -56, 0], [100, -56, 1]]) windowLit(g, x, y, 16, 18, on);
  for (const y of [-64, -34]) { fill(g, rect(30, y, 92, y + 1.6), '#1c2129'); for (let x = 31; x < 92; x += 3) fill(g, rect(x, y - 7, x + 0.6, y), '#1c2129'); }
  fill(g, poly([[86, -34], [92, -34], [76, -64], [70, -64]]), '#1c2129');
  fill(g, rect(10, -36, 30, 0), '#1c2230'); fill(g, rect(12, -34, 28, 0), '#2a3140');
  // B: CROW's shop — awning, half-open roller door, neon sign
  fill(g, rect(142, -110, 300, 0), FAC.conc);
  fill(g, rect(142, -114, 300, -110), FAC.trim);
  for (const x of [160, 196, 232, 268]) windowLit(g, x, -104, 18, 14, x === 232);
  fill(g, rect(166, -42, 276, 0), '#1f1a20');
  g.save(); g.globalCompositeOperation = 'lighter';
  fill(g, rect(166, -16, 276, 0), '#ff8a4c', 0.28);
  g.restore();
  for (let y = -42; y < -16; y += 2.2) stroke(g, `M 166 ${y} L 276 ${y}`, '#5c6070', 0.6);
  fill(g, rect(166, -17.4, 276, -16), '#2a2d36');
  const AW = poly([[160, -58], [282, -58], [288, -46], [154, -46]]);
  fill(g, AW, '#e8dccb');
  clip(g, AW, () => { for (let x = 150; x < 292; x += 8) fill(g, poly([[x, -58], [x + 4, -58], [x + 4 + (x - 221) * 0.05, -46], [x + (x - 221) * 0.05, -46]]), '#b5452e'); fill(g, rect(150, -52, 292, -46), '#000', 0.18); });
  fill(g, rect(154, -46.5, 288, -44.5), '#7a2a22');
  for (let x = 154; x < 288; x += 8) fill(g, rect(x, -44.5, x + 4, -43.2), '#b5452e');
  // neon CROW sign with a bird mark
  const neon = '#ff6b52';
  const BIRD = 'M 186 -72 C 188 -77 193 -79 197 -77 L 203 -78.4 L 198.6 -75.2 C 198.4 -71.6 195 -69.4 190.6 -70 L 186.4 -66.6 L 187.6 -70.8 Z';
  g.save(); g.shadowColor = neon; g.shadowBlur = 12;
  g.font = '700 22px Rajdhani'; g.fillStyle = neon; g.fillText('CROW', 206, -64);
  stroke(g, BIRD, neon, 1.1);
  g.restore();
  stroke(g, BIRD, '#ffd8cc', 0.45);
  g.font = '700 22px Rajdhani'; g.fillStyle = '#ffd8cc'; g.fillText('CROW', 206, -64);
  // C: clad warehouse with a loading door and pipes
  fill(g, rect(300, -88, 462, 0), FAC.panel);
  for (let x = 304; x < 462; x += 6) stroke(g, `M ${x} -88 L ${x} 0`, FAC.panelHi, 0.5, 0.5);
  fill(g, rect(300, -92, 462, -88), FAC.trim);
  fill(g, rect(330, -56, 410, 0), '#2a3242');
  for (let y = -54; y < 0; y += 3) stroke(g, `M 330 ${y} L 410 ${y}`, '#3a4458', 0.5);
  clip(g, rect(330, -62, 410, -56), () => { fill(g, rect(330, -62, 410, -56), C.gold); for (let x = 320; x < 420; x += 6) fill(g, poly([[x, -56], [x + 3, -56], [x + 9, -62], [x + 6, -62]]), '#1a1c20'); });
  fill(g, rect(420, -84, 424, 0), '#2a3242'); fill(g, rect(432, -84, 435, -20), '#2a3242');
  fill(g, rect(414, -70, 452, -66), '#2a3242');
  for (const [x, y] of [[440, -82], [312, -80]]) { fill(g, rect(x, y, x + 16, y + 10), '#2e3748'); for (let k = 1; k < 5; k++) stroke(g, `M ${x + 1} ${y + k * 2} L ${x + 15} ${y + k * 2}`, '#46516a', 0.5); }
  // D: concrete block with a Syndicate banner and dark windows
  fill(g, rect(462, -102, 610, 0), '#3e3f4b');
  fill(g, rect(462, -106, 610, -102), FAC.trim);
  for (const [x, y] of [[476, -90], [566, -90], [566, -56]]) windowLit(g, x, y, 18, 20, false);
  const BN = poly([[508, -94], [544, -94], [544, -40], [526, -46], [508, -40]]);
  fill(g, BN, '#8e2330');
  fill(g, rect(508, -94, 544, -90), '#5a1219');
  emblem(g, 526, -70, 8, '#f0d9d9');
}

// --- ground -----------------------------------------------------------------
function ground(g) {
  fill(g, rect(-10, 0, 610, 4), '#59627a');
  fill(g, rect(-10, 0, 610, 0.8), '#7a849c');
  fill(g, rect(-10, 4, 610, 6), '#2a303c');
  fill(g, rect(-10, 6, 610, 40), '#222833');
  for (let x = 0; x < 610; x += 40) fill(g, rect(x, 20, x + 20, 21.6), '#3d4556');
  for (let x = 6; x < 610; x += 12) stroke(g, `M ${x} 0.8 L ${x - 1} 4`, '#4b546a', 0.4);
}

// --- props (outlined play layer) ---------------------------------------------
const WOOD = tone('#c9935c', '#a5713f', '#7a4f29', '#3e2612');
const CONC = tone('#b9bcc6', '#8d919d', '#666a76', '#2f323a');

export function crate(g, x, w = 18, h = 16) {
  const B = rect(x, -h, x + w, 0);
  cel(g, B, WOOD, { sh: 1.4, hl: 0.6 });
  clip(g, B, () => {
    for (let y = -h + 4; y < 0; y += 4) stroke(g, `M ${x} ${y} L ${x + w} ${y}`, WOOD.d, 0.4);
    stroke(g, `M ${x + 1.5} ${-1.5} L ${x + w - 1.5} ${-h + 1.5}`, WOOD.d, 1.6);
    stroke(g, `M ${x + 1.5} ${-1.5} L ${x + w - 1.5} ${-h + 1.5}`, WOOD.m, 1.0);
    fill(g, rect(x, -h, x + w, -h + 1.6), WOOD.d);
  });
  stroke(g, B, WOOD.k, 0.4);
}

export function barrier(g, x, w = 34) {
  const B = poly([[x, 0], [x + 4, -6], [x + 6, -16], [x + w - 6, -16], [x + w - 4, -6], [x + w, 0]]);
  cel(g, B, CONC, { sh: 1.6, hl: 0.7 });
  clip(g, B, () => {
    fill(g, rect(x, -12, x + w, -8.4), C.gold);
    for (let k = x - 6; k < x + w; k += 5) fill(g, poly([[k, -8.4], [k + 2.5, -8.4], [k + 6.1, -12], [k + 3.6, -12]]), '#1a1c20');
    fill(g, ell(x + w * 0.62, -14.2, 2.2, 0.8), '#555a66', 0.8);
  });
  stroke(g, B, CONC.k, 0.4);
}

export function lampPost(g, x, h = 82) {
  const P = tone('#5d6878', '#3c4654', '#2a323d', '#12151b');
  cel(g, rect(x - 1.2, -h, x + 1.2, 0), P, { sh: 0.8, hl: 0.3 });
  cel(g, rect(x - 2.4, -6, x + 2.4, 0), P, { sh: 0.6, hl: 0.3 });
  cel(g, poly([[x, -h], [x + 14, -h - 2], [x + 14, -h + 0.6], [x, -h + 2.2]]), P, { sh: 0.5, hl: 0.2 });
  cel(g, poly([[x + 10, -h - 1.4], [x + 20, -h - 1.4], [x + 22, -h + 2.4], [x + 8, -h + 2.4]]), P, { sh: 0.5, hl: 0.3 });
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
  clip(g, B, () => { for (let k = x + 6; k < x + 38; k += 8) stroke(g, `M ${k} -18 L ${k} -4`, D.d, 0.8); fill(g, rect(x + 26, -16, x + 36, -11), '#d9dee5'); });
  cel(g, poly([[x - 1, -21.6], [x + 41, -21.6], [x + 41, -19.6], [x - 1, -19.6]]), D, { sh: 0.4, hl: 0.2 });
  for (const wx of [x + 6, x + 34]) cel(g, ell(wx, -1.6, 1.8, 1.8), M.rubber, { sh: 0.4, hl: 0.2 });
}

export function burnBarrel(g, x) {
  const B = rect(x, -14, x + 10, 0);
  cel(g, B, tone('#8a5a4a', '#6b3f30', '#4a2a20', '#22130d'), { sh: 1.0, hl: 0.4 });
  clip(g, B, () => { stroke(g, `M ${x} -10 L ${x + 10} -10 M ${x} -4 L ${x + 10} -4`, '#2a1810', 0.6); });
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

export const STREET = { sky, farCity, midIndustry, facades, ground, lampLight, fireLight };
