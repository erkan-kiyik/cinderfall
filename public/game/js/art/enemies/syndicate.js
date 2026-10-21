// VANTA — the security firm that holds the city (docs/KOR_STORY_CINEMATIC.md
// §9.3, painted per §10.1). Everything the cells are not: one issue, clean,
// new, repeated. Blue-grey polymer armour over a navy uniform, a full-face
// helmet with one thin slit of smoked glass, the white ring-and-bar mark on
// the left shoulder. The shield man carries more plate and a smoked riot
// shield; the rusher a gas mask with two dark lenses and a red unit band; and Gall,
// the Secretary, is no soldier at all: a long belted coat, a peaked cap, an
// open, cold face.
import { cel, fill, stroke, clip, blob, curve } from '../kit.js';
import { Brush, rnd } from '../paint.js';
import { texture } from '../tex.js';
import { M, tone, mat } from '../style.js';
import { WEAPONS, MAT } from '../weapons/index.js';
import { UPPER, FORE, THIGH, SHIN, TORSO, PELVIS, glove, boot, fold, headShape, skinGlaze, softEye, softBrow, softHair, neck as skinNeck, stitch, rivet, buckle, grime, scuffs, clothFolds } from '../ops/body.js';

const PAL = {
  armor: mat(tone('#aab7c4', '#7b8b9b', '#546373', '#222c38'), 'paint', 0.1),
  suit: mat(tone('#414e66', '#2c364a', '#1d2434', '#0b0f17'), 'canvas', 0.45),
  webbing: mat(tone('#3a4558', '#283140', '#1a202b', '#0a0d12'), 'nylon', 0.6),
  black: mat(tone('#3e4147', '#282b30', '#191b1f', '#0a0b0d'), 'rubber', 0.45),
  glove: mat(tone('#3c3f45', '#26292e', '#181a1e', '#08090a'), 'leather', 0.45),
  boot: mat(tone('#3d3f43', '#27292c', '#18191c', '#08090a'), 'leather', 0.45),
  sole: mat(M.rubber, 'rubber', 0.5),
  steel: mat(tone('#c3c8cc', '#959ba1', '#686e74', '#2c3035'), 'steel', 0.5),
  visor: M.visor,
  white: tone('#ffffff', '#eef1f4', '#c2cad3', '#6e7987'),
};
const DUST = 'rgba(40,46,56,0.3)';

// Vanta's guns: new from the depot, blue-black polymer furniture (the pump gun
// too, no walnut), clean steel, no crew tape, a white stencilled number.
const SYN_POLY = mat(tone('#4a525e', '#2c323b', '#1d2128', '#0a0c0f'), 'rubber', 0.25);
export const SYN_MAT = { ...MAT, poly: SYN_POLY, wood: SYN_POLY, tan: SYN_POLY, olive: SYN_POLY, tape: null, serial: '#dfe3e6', accent: M.visor };

// Vanta's mark: a ring crossed by a bar that runs past it.
export function emblem(g, x, y, r, c) {
  g.save();
  g.strokeStyle = c; g.lineWidth = r * 0.26; g.beginPath(); g.arc(x, y, r * 0.78, 0, Math.PI * 2); g.stroke();
  g.fillStyle = c; g.fillRect(x - r * 1.18, y - r * 0.13, r * 2.36, r * 0.26);
  g.restore();
}

// --- the helmet: full face, one red slit (docs §10.15) ---------------------------------------------
// A cut-high ballistic shell in Vanta's grey with rails down its sides, a mount plate at
// the brow and the comms cup over the ear; bolted to it at the temples a face plate, grey
// round the slit of smoked glass, black polymer over the jaw with the breathing vents
// pressed into it. Issued, numbered, scuffed.
const SHELL = 'M -4.9 -4.6 C -5.6 -7.4 -5.0 -11.0 -2.2 -12.4 C 0.6 -13.5 3.8 -12.9 5.2 -10.8 C 5.7 -10.0 5.9 -9.2 5.9 -8.6 L 4.6 -8.7 C 3.0 -8.8 1.6 -8.6 0.6 -8.0 C -0.4 -7.4 -0.8 -6.6 -0.6 -5.6 C -0.4 -4.8 -0.8 -4.2 -1.6 -4.0 C -2.8 -3.8 -4.0 -4.0 -4.9 -4.6 Z';
const FACE = 'M 0.4 -8.1 C 2.0 -8.9 4.4 -9.0 5.95 -8.6 C 6.3 -7.6 6.36 -6.8 6.3 -6.2 L 0.3 -6.0 C 0.2 -6.8 0.24 -7.5 0.4 -8.1 Z';
const JAW = 'M 0.3 -6.5 C 2.4 -6.7 5.0 -6.6 6.3 -6.2 C 6.4 -5.0 6.2 -3.2 5.6 -2.4 C 5.0 -1.7 4.2 -1.4 3.4 -1.35 L 1.4 -1.3 C 0.6 -1.6 0.2 -2.4 0.2 -3.4 C 0.2 -4.4 0.2 -5.5 0.3 -6.5 Z';
const SLIT = 'M 1.6 -7.72 C 3.0 -7.98 4.8 -7.98 6.22 -7.62 L 6.26 -6.92 C 4.8 -7.18 3.0 -7.18 1.66 -6.96 Z';
const brush = (g) => { const M0 = g.getTransform(); return new Brush(g, Math.hypot(M0.a, M0.b)); };
// Issued plate that has seen the street: the lamp's hard sheen on the moulding,
// paint chipped off the edges to the grey composite, scratches, rain-dried dirt
// low down. Box [x0, y0, x1, y1] in the part's frame.
function worn(g, d, [x0, y0, x1, y1], seed, k = 1) {
  const B = brush(g), r = rnd(seed), w = x1 - x0, h = y1 - y0;
  B.inside(d, () => {
    B.dab(x0 + w * 0.62, y0 + h * 0.22, w * 0.22, h * 0.1, 'rgba(236,244,252,0.32)');
    B.dab(x0 + w * 0.5, y1 - h * 0.08, w * 0.6, h * 0.22, `rgba(34,30,26,${0.32 * k})`);
    for (let i = 0; i < 9 * k; i++) {
      const top = r() < 0.6, x = x0 + r() * w, y = top ? y0 + r() * h * 0.18 : y0 + r() * h;
      B.dab(x, y, 0.18 + r() * 0.3, 0.1 + r() * 0.16, top ? 'rgba(196,200,204,0.55)' : 'rgba(40,46,54,0.45)', 1, 'source-over', r() * 3);
    }
    for (let i = 0; i < 6 * k; i++) {
      const x = x0 + r() * w, y = y0 + h * (0.2 + r() * 0.7), a = (r() - 0.5) * 1.2, L = 0.6 + r() * 1.6;
      B.line(`M ${x} ${y} l ${Math.cos(a) * L} ${Math.sin(a) * L}`, 'rgba(226,232,238,0.4)', 0.07, 0.03);
    }
  });
}
function neck(g, t) {
  cel(g, 'M -2.0 1.3 L 2.4 1.1 L 2.3 -2.6 L 0.6 -3.8 L -2.1 -4.6 Z', t, { sh: 1.2, hl: 0.25 });
}
function helmet(g) {
  const A = PAL.armor, B = brush(g);
  // the balaclava's knit at the throat under the jaw plate
  neck(g, PAL.suit);
  B.inside('M -2.0 1.3 L 2.4 1.1 L 2.3 -2.6 L 0.6 -3.8 L -2.1 -4.6 Z', () => { for (let x = -2; x < 2.6; x += 0.22) B.line(`M ${x} -4.6 L ${x + 0.1} 1.4`, 'rgba(8,10,16,0.35)', 0.06, 0.03); B.fill('M -3 -5 L 3 -5 L 3 -2.4 L -3 -2.0 Z', 'rgba(6,8,12,0.5)', 0.3); });
  // the shell: cut high over the ear, the light rolling over its crown
  cel(g, SHELL, A, { sh: 1.4, hl: 0.6 });
  B.inside(SHELL, () => {
    B.line('M -3.8 -10.6 C -0.8 -12.9 3.0 -12.8 4.9 -10.6', 'rgba(255,255,255,0.55)', 0.22, 0.14);
    B.dab(2.4, -11.6, 2.0, 0.7, 'rgba(236,244,252,0.35)');
    B.fill('M -6 -6 C -4 -5.0 -2 -4.4 0 -4.6 L 0 -3 L -6 -3 Z', 'rgba(16,20,28,0.4)', 0.4);
    // the cut's edge, trimmed in rubber
    B.line('M 4.6 -8.7 C 3.0 -8.8 1.6 -8.6 0.6 -8.0 C -0.4 -7.4 -0.8 -6.6 -0.6 -5.6 C -0.4 -4.8 -0.8 -4.2 -1.6 -4.0 C -2.8 -3.8 -4.0 -4.0 -4.9 -4.6', '#1b1f26', 0.26, 0.02);
    // the velcro panel at the back and the number stencilled under it
    const VEL = 'M -3.9 -10.0 C -3.3 -10.9 -2.4 -11.5 -1.4 -11.8 L -1.1 -11.0 C -2.0 -10.7 -2.7 -10.2 -3.2 -9.5 Z';
    B.fill(VEL, '#56616f', 0.02);
    B.inside(VEL, () => { texture(g, 'knit', 0.5, 0.25); B.line('M -3.8 -10.0 C -3.2 -10.85 -2.3 -11.45 -1.4 -11.75', 'rgba(20,24,30,0.5)', 0.06, 0.02); });
    g.save(); g.fillStyle = 'rgba(240,244,248,0.62)'; g.translate(-4.5, -4.75); g.rotate(-0.06); g.scale(1 / 50, 1 / 50); g.font = "700 30px 'Barlow Condensed', sans-serif"; g.fillText('V-0417', 0, 0); g.restore();
    grime(g, -6, -3.8, DUST);
  });
  worn(g, SHELL, [-5.6, -13.4, 5.9, -4.0], 29, 0.6);
  // the rail along the side, its slots; the mount plate over the brow and its screws
  const RAIL = 'M -4.5 -6.2 C -3.0 -7.5 -1.0 -8.5 1.4 -8.95 C 2.6 -9.12 3.6 -9.14 4.5 -9.02 L 4.5 -9.5 C 3.6 -9.62 2.6 -9.6 1.3 -9.42 C -1.2 -8.96 -3.2 -7.96 -4.8 -6.6 Z';
  cel(g, RAIL, PAL.black, { sh: 0.3, hl: 0.3, lw: 0.1 });
  B.inside(RAIL, () => { for (let u = 0; u < 1; u += 0.09) { const x = -4.4 + u * 8.8, y = -6.6 - Math.sin(u * 1.9) * 2.6; B.fill(`M ${x} ${y - 0.12} l 0.28 -0.04 l 0 0.18 l -0.28 0.04 Z`, '#050607', 0.01); } B.line('M -4.6 -6.5 C -3.1 -7.8 -1.1 -8.8 1.35 -9.25 C 2.6 -9.4 3.6 -9.42 4.5 -9.3', 'rgba(170,180,192,0.3)', 0.05, 0.02); });
  const MOUNT = 'M 4.0 -11.4 L 5.3 -10.9 C 5.6 -10.4 5.7 -10.0 5.7 -9.6 L 4.3 -9.8 Z';
  cel(g, MOUNT, PAL.black, { sh: 0.3, hl: 0.35, lw: 0.1 });
  for (const [x, y] of [[4.5, -10.8], [5.2, -10.2], [4.6, -10.1]]) rivet(g, x, y, 0.12, PAL.steel);
  // the face plate: grey round the slit, its seam to the jaw; the slit of smoked glass in a
  // steel frame, the street's light across its top edge, red deep in it
  cel(g, FACE, A, { sh: 0.8, hl: 0.5 });
  B.inside(FACE, () => { B.line('M 0.6 -8.0 C 2.2 -8.75 4.4 -8.85 5.9 -8.45', 'rgba(255,255,255,0.45)', 0.1, 0.05); B.dab(4.6, -8.2, 1.4, 0.3, 'rgba(236,244,252,0.3)'); });
  worn(g, FACE, [0.2, -9.0, 6.4, -6.0], 31, 0.5);
  B.fill('M 1.5 -7.84 C 3.0 -8.1 4.8 -8.1 6.3 -7.72 L 6.34 -6.82 C 4.8 -7.06 3.0 -7.06 1.56 -6.86 Z', '#2a2f37', 0.01);
  B.fill(SLIT, '#14161b', 0.01);
  B.inside(SLIT, () => {
    B.dab(4.0, -7.36, 2.2, 0.3, 'rgba(96,30,36,0.7)');
    B.dab(5.2, -7.4, 0.5, 0.16, 'rgba(160,44,52,0.6)');
    B.line('M 1.7 -7.66 C 3.0 -7.92 4.8 -7.92 6.18 -7.58', 'rgba(220,226,236,0.6)', 0.06, 0.02);
    B.dab(3.0, -7.66, 0.36, 0.05, 'rgba(255,214,160,0.7)');
  });
  B.line('M 1.62 -6.94 C 3.0 -7.16 4.8 -7.16 6.24 -6.9', 'rgba(170,180,192,0.45)', 0.04, 0.01);
  // the jaw plate: black polymer, a sheen down its front, the vents pressed in it
  cel(g, JAW, PAL.black, { sh: 0.8, hl: 0.4, gloss: 0.35 });
  B.inside(JAW, () => {
    for (const [y, c] of [[-5.1, 0.02], [-4.4, 0.06], [-3.7, 0.1]]) { B.line(`M 3.4 ${y} C 4.2 ${y - 0.15 + c} 5.0 ${y - 0.1 + c} 5.9 ${y + 0.2}`, 'rgba(0,0,0,0.85)', 0.24, 0.06); B.line(`M 3.4 ${y + 0.2} C 4.2 ${y + 0.05 + c} 5.0 ${y + 0.1 + c} 5.9 ${y + 0.4}`, 'rgba(150,164,180,0.25)', 0.08, 0.04); }
    B.line('M 6.1 -6.0 C 6.25 -4.8 6.1 -3.4 5.5 -2.5', 'rgba(170,184,200,0.35)', 0.12, 0.08);
    B.line('M 0.4 -6.35 C 2.4 -6.55 5.0 -6.46 6.3 -6.08', 'rgba(0,0,0,0.6)', 0.08, 0.03);
    B.fill('M 0 -3 C 2 -2.4 4 -2.0 6.4 -2.6 L 6.4 -1 L 0 -1 Z', 'rgba(0,0,0,0.4)', 0.3);
  });
  // the hinge bolts at the temple, the comms cup over the ear and its stub antenna
  rivet(g, 0.85, -6.25, 0.2, PAL.steel);
  const CUP = 'M -0.9 -7.3 C 0.0 -7.6 0.9 -7.0 1.0 -6.0 C 1.1 -5.0 0.5 -4.3 -0.4 -4.4 C -1.1 -4.5 -1.4 -5.2 -1.4 -5.9 C -1.4 -6.6 -1.2 -7.1 -0.9 -7.3 Z';
  cel(g, CUP, PAL.black, { sh: 0.5, hl: 0.4, lw: 0.14 });
  B.inside(CUP, () => { B.line('M -0.6 -7.0 C 0.2 -7.2 0.7 -6.6 0.76 -6.0', 'rgba(170,180,192,0.4)', 0.08, 0.04); B.fill('M -0.9 -6.4 L 0.5 -6.5 L 0.5 -5.6 L -0.9 -5.5 Z', '#3a404a', 0.04); });
  rivet(g, -0.2, -5.95, 0.16, PAL.steel);
  B.line('M -1.0 -7.1 L -1.6 -9.4', '#15181d', 0.18, 0.01);
  B.dab(-1.62, -9.46, 0.1, 0.1, '#2a2f37');
}

// --- torso: navy uniform, the plate carrier --------------------------------------------------
const PLATE = blob([[-5.2, -21.2], [1.2, -22.2], [5.8, -21.2], [7.4, -17.2], [7.0, -10.8], [5.6, -8.4], [-0.4, -8.0], [-5.8, -9.0], [-6.6, -14.4]]);
function carrier(g, A = PAL.armor) {
  // the shoulder strap and cummerbund, webbing, with quick-release buckles
  cel(g, blob([[-3.4, -20.2], [-1.6, -21.0], [0.2, -23.2], [-1.6, -23.6], [-3.4, -22.2], [-4.6, -20.4]]), PAL.webbing, { sh: 0.4, hl: 0.2 });
  cel(g, blob([[-7.2, -13.0], [-4.2, -13.4], [-3.6, -8.8], [-6.6, -8.2], [-7.6, -10.2]]), PAL.webbing, { sh: 0.5, hl: 0.25 });
  clip(g, blob([[-7.2, -13.0], [-4.2, -13.4], [-3.6, -8.8], [-6.6, -8.2], [-7.6, -10.2]]), () => { for (let y = -12.4; y < -8.6; y += 1.0) stroke(g, `M -8 ${y} L -3 ${y - 0.2}`, PAL.webbing.d, 0.22); });
  cel(g, PLATE, A, { sh: 2.0, hl: 0.6 });
  clip(g, PLATE, () => {
    // moulded panel lines, the rank strip, the gloss
    stroke(g, curve([[-4.8, -19.6], [1.2, -20.6], [6.0, -19.6]]), A.d, 0.24);
    stroke(g, curve([[-5.4, -11.2], [0.6, -10.4], [6.6, -11.0]]), A.d, 0.24);
    fill(g, 'M 2.6 -18.8 L 5.6 -18.9 L 5.6 -18.2 L 2.6 -18.1 Z', PAL.white.m, 0.9);
    fill(g, 'M 2.6 -17.8 L 4.4 -17.85 L 4.4 -17.4 L 2.6 -17.35 Z', PAL.white.m, 0.7);
    stroke(g, curve([[-4.2, -20.4], [1.0, -21.4], [5.6, -20.4]]), '#ffffff', 0.16, 0.7);
    for (const [x, y] of [[-4.6, -19.6], [5.8, -19.8], [-5.0, -10.2], [6.2, -10.4]]) rivet(g, x, y, 0.26, PAL.steel);
    grime(g, -14, -7.6, DUST);
  });
  worn(g, PLATE, [-6.6, -22.2, 7.4, -8.0], 31);
  // the magazine pouches, navy, their flaps
  for (let i = 0; i < 3; i++) {
    const x = -2.6 + i * 2.6;
    cel(g, `M ${x} -12.8 L ${x + 2.4} -12.9 L ${x + 2.45} -8.6 C ${x + 1.6} -8.3 ${x + 0.8} -8.3 ${x - 0.05} -8.6 Z`, PAL.webbing, { sh: 0.5, hl: 0.25, lw: 0.24 });
    cel(g, `M ${x - 0.15} -13.2 L ${x + 2.55} -13.3 L ${x + 2.5} -11.4 C ${x + 1.7} -11.0 ${x + 0.8} -11.0 ${x - 0.1} -11.3 Z`, PAL.webbing, { sh: 0.35, hl: 0.2, lw: 0.22 });
    stitch(g, `M ${x + 0.1} -11.7 C ${x + 0.8} -11.4 ${x + 1.7} -11.4 ${x + 2.4} -11.8`, PAL.webbing.l, 0.06, 0.6);
  }
}
function uniform(g, T = PAL.suit) {
  cel(g, PELVIS, T, { sh: 1.1, hl: 0.4 });
  cel(g, TORSO, T, { sh: 1.8, hl: 0.5 });
  clothFolds(g, TORSO, [[[-6.4, -16.0], [-4.8, -13.4], [-3.4, -10.6]], [[-5.6, -6.0], [-3.0, -5.4], [-0.4, -5.8]]], T);
  clip(g, TORSO, () => { fold(g, [[-6.8, -14.0], [-6.2, -10.6], [-5.4, -8.2]], T); stitch(g, curve([[-5.2, -20.6], [-5.8, -14.0], [-5.2, -6.0]]), T.l, 0.07, 0.5); });
}
function torso(g) { uniform(g); carrier(g); }
// the padded ballistic collar every trooper wears up round the neck
function collar(g) {
  const COL = 'M -5.0 -21.6 C -5.0 -23.2 -4.0 -24.4 -2.0 -24.8 C 0.4 -25.1 3.0 -24.9 4.8 -24.2 C 5.6 -23.8 5.8 -23.0 5.6 -22.0 L 5.2 -21.2 C 3.0 -20.8 -1.8 -20.6 -5.0 -21.6 Z';
  cel(g, COL, PAL.webbing, { sh: 0.6, hl: 0.3 });
  {
    const B = brush(g);
    B.inside(COL, () => {
      // quilted in panels, each one swelling a little between its seams
      for (const x of [-3.2, -1.2, 0.8, 2.8, 4.4]) { B.line(`M ${x} -25 C ${x + 0.1} -23.6 ${x + 0.1} -22.4 ${x} -20.8`, 'rgba(4,6,10,0.6)', 0.1, 0.06); B.dab(x + 1.0, -23.6, 0.7, 0.9, 'rgba(120,136,160,0.14)'); }
      B.line('M -4.4 -23.6 C -3.0 -24.5 -0.4 -24.94 2.0 -24.82 C 3.4 -24.7 4.4 -24.4 5.2 -23.9', '#1a202b', 0.34, 0.03);
      B.line('M -4.4 -23.76 C -3.0 -24.66 -0.4 -25.1 2.0 -24.98 C 3.4 -24.86 4.4 -24.56 5.2 -24.06', 'rgba(150,164,186,0.35)', 0.07, 0.03);
      B.fill('M -6 -22.4 C -2 -21.8 2 -21.8 6 -22.2 L 6 -20 L -6 -20 Z', 'rgba(4,6,10,0.4)', 0.25);
    });
    stitch(g, 'M -4.2 -23.3 C -2.8 -24.2 -0.4 -24.62 2.0 -24.5 C 3.4 -24.4 4.3 -24.1 5.1 -23.6', PAL.webbing.l, 0.05, 0.5);
    cel(g, 'M 4.0 -24.2 L 5.6 -23.7 L 5.5 -22.4 L 3.9 -22.7 Z', PAL.webbing, { sh: 0.3, hl: 0.25, lw: 0.12 });
  }
}
function chest(g) {
  // the collar of the uniform up round the helmet's neck, the belt, a holster
  collar(g);
  cel(g, 'M -6.0 -5.4 C -1.2 -5.75 2.6 -5.75 5.7 -5.5 L 5.75 -3.6 C 2.6 -3.85 -1.2 -3.85 -6.05 -3.5 Z', PAL.webbing, { sh: 0.4, hl: 0.2 });
  cel(g, 'M 2.6 -5.9 L 4.8 -5.95 L 4.8 -3.3 L 2.6 -3.25 Z', PAL.black, { sh: 0.3, hl: 0.25, lw: 0.22 });
  fill(g, 'M 3.1 -5.0 L 4.3 -5.02 L 4.3 -4.2 L 3.1 -4.18 Z', PAL.steel.m);
}

// --- limbs -------------------------------------------------------------------------------------
function shoulderPlate(g, ctx, A = PAL.armor, big = false) {
  const P = big ? blob([[-4.6, -3.0], [0.2, -4.4], [4.6, -2.8], [4.6, 3.2], [-4.4, 3.4]]) : blob([[-4.0, -2.6], [0.2, -3.8], [4.2, -2.4], [4.2, 2.0], [-4.0, 2.2]]);
  cel(g, P, ctx.t(A), { sh: 1.0, hl: 0.5 });
  clip(g, P, () => {
    stroke(g, curve([[-3.6, -1.6], [0.2, -2.8], [3.8, -1.4]]), '#ffffff', 0.14, 0.6);
    if (!ctx.far) emblem(g, 0.4, 0.0, 1.25, PAL.white.m);
    // a moulded plate: the lower lame riding under it, its edge in shadow
    const B = brush(g), y = big ? 1.6 : 1.0;
    B.fill(`M -5 ${y} L 5 ${y - 0.2} L 5 4 L -5 4 Z`, 'rgba(10,14,20,0.28)', 0.25);
    B.line(`M -5 ${y} L 5 ${y - 0.2}`, 'rgba(8,10,14,0.7)', 0.16, 0.05);
    B.line(`M -5 ${y - 0.22} L 5 ${y - 0.42}`, 'rgba(226,234,242,0.45)', 0.1, 0.04);
  });
  worn(g, P, big ? [-4.6, -4.4, 4.6, 3.4] : [-4.0, -3.8, 4.2, 2.2], big ? 37 : 33, ctx.far ? 0.6 : 1);
}
function upper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL.suit), { sh: 1.5, hl: 0.45 });
  clothFolds(g, UPPER, [[[-2.0, 6.2], [-0.4, 7.0], [1.8, 6.6]], [[-1.8, 10.4], [0.0, 11.0], [1.8, 10.6]]], t(PAL.suit));
  clip(g, UPPER, () => { fold(g, [[-1.8, 8.8], [-0.4, 9.7], [1.2, 9.9]], t(PAL.suit)); stitch(g, curve([[-2.2, 3.0], [-2.4, 7.0], [-2.0, 11.0]]), t(PAL.suit).l, 0.07, 0.5); });
  shoulderPlate(g, ctx);
}
function fore(g, ctx) {
  const t = ctx.t;
  cel(g, FORE, t(PAL.suit), { sh: 1.3, hl: 0.4 });
  clip(g, FORE, () => fold(g, [[-1.4, 2.6], [0.0, 3.4], [1.4, 3.2]], t(PAL.suit), 0.26));
  cel(g, blob([[-2.1, 8.0], [2.0, 7.8], [2.1, 10.2], [-2.1, 10.4]]), t(PAL.webbing), { sh: 0.3, hl: 0.2, lw: 0.22 });
}
function hand(g, ctx) { glove(g, ctx, PAL.glove, { knuckle: PAL.black }); }
function thigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(PAL.suit), { sh: 1.6, hl: 0.4 });
  clip(g, THIGH, () => {
    cel(g, 'M -2.2 4.0 L 2.0 3.8 L 2.1 9.6 C 0.8 10.0 -0.9 10.0 -2.1 9.7 Z', t(PAL.suit), { sh: 0.4, hl: 0.25, lw: 0.22, ao: 0.3 });
    stitch(g, 'M -2.0 5.4 L 1.9 5.2', t(PAL.suit).l, 0.07, 0.6);
    stitch(g, curve([[2.2, 0.6], [2.0, 7.0], [1.6, 15.0]]), t(PAL.suit).l, 0.07, 0.5);
    fold(g, [[-2.0, 12.4], [0.0, 13.2], [2.0, 13.0]], t(PAL.suit));
  });
  // the suit's cloth gathered behind the knee and pulled across the thigh
  clothFolds(g, THIGH, [[[-3.0, 11.0], [-1.0, 11.8], [1.6, 11.4]], [[-2.8, 2.6], [-1.2, 3.2], [-0.4, 4.4]]], t(PAL.suit));
}
function kneePlate(g, ctx, A = PAL.armor) {
  const KP = blob([[-0.8, -2.6], [2.4, -2.4], [3.4, 0.4], [3.0, 3.6], [0.8, 4.4], [-0.8, 2.4], [-1.0, -0.2]]);
  cel(g, KP, ctx.t(A), { sh: 0.7, hl: 0.4 });
  clip(g, KP, () => stroke(g, curve([[0.0, -1.4], [2.0, -1.0], [2.9, 0.8]]), '#ffffff', 0.14, 0.6));
  worn(g, KP, [-1.0, -2.6, 3.4, 4.4], 41, ctx.far ? 0.5 : 0.8);
  stroke(g, 'M -0.9 1.0 C -1.6 1.1 -2.2 1.3 -2.5 1.6', PAL.webbing.k, 0.5);
}
function shin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(PAL.suit), { sh: 1.4, hl: 0.35 });
  kneePlate(g, ctx);
  const SH = blob([[-2.75, 7.2], [2.5, 6.9], [2.6, 10.6], [2.65, 15.0], [-2.65, 15.1], [-2.9, 10.6]]);
  cel(g, SH, t(PAL.boot), { sh: 0.8, hl: 0.4 });
  clip(g, SH, () => { for (let y = 8.0; y < 14.4; y += 1.15) stroke(g, `M 0.8 ${y} L 2.2 ${y + 0.45} M 2.2 ${y} L 0.8 ${y + 0.45}`, t(PAL.black).l, 0.12); stitch(g, 'M -2.5 7.6 L -2.4 14.6', t(PAL.boot).l, 0.06, 0.5); });
}
function foot(g, ctx) { boot(g, ctx, PAL.boot, PAL.sole, { toe: PAL.boot }); }

const PARTS = { torso, chest, head: helmet, upper, fore, hand, thigh, shin, foot };

export const TETIKCI = {
  id: 'tetikci', name: 'TETİKÇİ', role: 'VANTA', pal: PAL,
  pose: {
    nThigh: 0.2, nShin: 0.06, fThigh: -0.26, fShin: -0.04, head: 0.02,
    gun: { w: WEAPONS.kestrel, at: [6.4, -41.4], ang: 0.4, k: 0.96, mat: SYN_MAT },
  },
  parts: PARTS,
};

// --- KALKANLI: more plate, arms included, and the riot shield ----------------------------------
function shieldFront(g, ctx) {
  const [hx, hy] = ctx.J.hip;
  g.save(); g.translate(-hx, -hy);
  shield(g);
  g.restore();
}
// Riot shield in root space (feet at the origin), as carried in the idle pose:
// smoked polycarbonate, the viewing window, VANTA and the mark in white.
export function shield(g) {
  const S = 'M 6.4 -57.6 Q 6.4 -58.6 7.4 -58.4 L 14.6 -56.8 Q 15.6 -56.6 15.6 -55.6 L 15.6 -16.6 Q 15.6 -15.6 14.6 -15.4 L 7.4 -13.8 Q 6.4 -13.6 6.4 -14.6 Z';
  const POLY = tone('#6d7a88', '#45505e', '#2c3540', '#0f141a');
  cel(g, S, POLY, { sh: 1.6, hl: 0.7, ao: 0.6 });
  clip(g, S, () => {
    // the window, clearer glass, the street in it
    fill(g, 'M 8.0 -54.8 L 14.2 -53.8 L 14.2 -48.0 L 8.0 -48.6 Z', 'rgba(150,175,200,0.35)');
    stroke(g, 'M 8.0 -54.8 L 14.2 -53.8 L 14.2 -48.0 L 8.0 -48.6 Z', POLY.k, 0.24);
    fill(g, 'M 8.6 -54.2 L 9.8 -54.0 L 8.9 -49.0 L 8.6 -49.0 Z', 'rgba(255,255,255,0.35)');
    // the long reflection down the face, scratches and scuffs from the street
    fill(g, 'M 7.4 -57.4 L 8.6 -57.2 L 8.6 -15.0 L 7.4 -14.4 Z', 'rgba(255,255,255,0.16)');
    for (const [x, y, l] of [[9.4, -40, 2.2], [12.6, -36, 1.6], [10.4, -22, 2.6], [13.8, -27, 1.2]]) stroke(g, `M ${x} ${y} l ${l} 0.6`, 'rgba(255,255,255,0.35)', 0.06);
    // VANTA, stencilled white, the mark under it
    g.save(); g.translate(11.0, -40.6); g.rotate(Math.PI / 2); g.fillStyle = 'rgba(244,246,248,0.92)'; g.font = '800 2.6px sans-serif'; g.textAlign = 'center'; g.fillText('VANTA', 0, 0.9); g.restore();
    emblem(g, 11.0, -25.4, 2.0, '#f1f3f5');
    // the red band across, the rim
    fill(g, 'M 5 -32.6 L 17 -32.0 L 17 -31.0 L 5 -31.6 Z', PAL.visor.m, 0.85);
    for (const [x, y] of [[8.0, -45], [14.0, -44.4], [8.0, -20], [14.0, -19.4]]) rivet(g, x, y, 0.3, PAL.steel);
    // a shield that has been used: the polycarbonate crazed white where things
    // hit it (a bottle, a stone, the odd round), scuffed bare along its foot,
    // rain beading down its face
    const B = brush(g), r = rnd(733);
    for (const [cx, cy] of [[12.6, -44.6], [9.4, -30.8], [13.4, -21.4]]) {
      B.dab(cx, cy, 0.9, 0.9, 'rgba(226,232,238,0.32)');
      for (let k = 0; k < 6; k++) { const a = r() * Math.PI * 2, L = 0.6 + r() * 1.4; B.line(`M ${cx} ${cy} l ${Math.cos(a) * L} ${Math.sin(a) * L}`, 'rgba(232,238,244,0.5)', 0.06, 0.03); }
      B.dab(cx, cy, 0.25, 0.25, 'rgba(255,255,255,0.7)');
    }
    for (let k = 0; k < 14; k++) { const x = 6.8 + r() * 8.4, y = -19 + r() * 4.6; B.line(`M ${x} ${y} l ${0.6 + r() * 1.6} ${(r() - 0.5) * 0.6}`, 'rgba(200,206,212,0.35)', 0.07, 0.03); }
    for (let k = 0; k < 8; k++) { const x = 7 + r() * 8, y = -56 + r() * 36; B.line(`M ${x} ${y} l 0.1 ${1 + r() * 3}`, 'rgba(210,222,236,0.18)', 0.12, 0.08); B.dab(x + 0.1, y + 0.2, 0.18, 0.22, 'rgba(236,244,252,0.4)'); }
    stroke(g, S, PAL.black.m, 0.6);
  });
}
function heavyTorso(g) { g.save(); g.scale(1.12, 1); uniform(g); carrier(g); g.restore(); }
// A riot guard: a hard moulded plate, not a cushion. Its edges are bevelled (a
// lit lip on top, a shadow under), it is split into lames that ride over each
// other, a webbing strap holds it on, and the street has worn it (worn()).
function guard(g, ctx, d, [x0, y0, x1, y1], seed, lames = 2) {
  const A = ctx.t(PAL.armor), B = brush(g), h = y1 - y0;
  cel(g, d, A, { sh: 0.9, hl: 0.5, gloss: 0.3 });
  clip(g, d, () => {
    for (let i = 1; i < lames; i++) {
      const y = y0 + (h * i) / lames;
      B.fill(`M ${x0 - 1} ${y - 0.15} L ${x1 + 1} ${y - 0.35} L ${x1 + 1} ${y + 0.9} L ${x0 - 1} ${y + 1.1} Z`, 'rgba(10,14,20,0.3)', 0.25);
      B.line(`M ${x0 - 1} ${y} L ${x1 + 1} ${y - 0.2}`, 'rgba(8,10,14,0.7)', 0.16, 0.05);
      B.line(`M ${x0 - 1} ${y - 0.22} L ${x1 + 1} ${y - 0.42}`, 'rgba(226,234,242,0.45)', 0.1, 0.04);
    }
    B.line(`M ${x0} ${y0 + 0.35} L ${x1} ${y0 + 0.15}`, 'rgba(236,242,248,0.55)', 0.16, 0.05);
    B.line(`M ${x0} ${y1 - 0.3} L ${x1} ${y1 - 0.5}`, 'rgba(8,10,14,0.55)', 0.3, 0.12);
  });
  // the strap round the limb, its buckle on the outside
  const sy = y0 + h * 0.62;
  B.fill(`M ${x0 - 0.3} ${sy} L ${x1 + 0.3} ${sy - 0.2} L ${x1 + 0.3} ${sy + 0.75} L ${x0 - 0.3} ${sy + 0.95} Z`, ctx.far ? '#151a21' : '#1d232c', 0.04);
  B.fill(`M ${x1 - 1.4} ${sy - 0.25} L ${x1 - 0.4} ${sy - 0.3} L ${x1 - 0.4} ${sy + 0.95} L ${x1 - 1.4} ${sy + 1.0} Z`, '#6d7680', 0.03);
  B.line(`M ${x1 - 1.3} ${sy - 0.1} L ${x1 - 0.5} ${sy - 0.15}`, 'rgba(220,228,236,0.6)', 0.08, 0.02);
  worn(g, d, [x0, y0, x1, y1], seed, ctx.far ? 0.5 : 0.9);
}
function heavyUpper(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.12, 1); cel(g, UPPER, t(PAL.suit), { sh: 1.5, hl: 0.45 }); g.restore();
  clothFolds(g, UPPER, [[[-2.0, 6.2], [-0.4, 7.0], [1.8, 6.6]], [[-1.8, 10.4], [0.0, 11.0], [1.8, 10.6]]], t(PAL.suit));
  // the upper-arm guard under the bigger shoulder plate
  guard(g, ctx, 'M -2.9 3.0 C -1.0 2.6 1.0 2.6 2.8 2.8 C 3.0 5.0 2.9 7.4 2.6 9.2 C 0.8 9.6 -0.9 9.6 -2.6 9.4 C -2.9 7.4 -3.0 5.0 -2.9 3.0 Z', [-2.9, 2.6, 2.8, 9.6], 51, 2);
  shoulderPlate(g, ctx, PAL.armor, true);
}
function heavyFore(g, ctx) {
  fore(g, ctx);
  guard(g, ctx, 'M -2.5 1.4 C -0.8 1.0 0.8 1.0 2.4 1.2 C 2.5 3.4 2.5 5.6 2.3 7.6 C 0.7 7.9 -0.8 7.9 -2.2 7.8 C -2.5 5.6 -2.6 3.4 -2.5 1.4 Z', [-2.5, 1.0, 2.4, 7.9], 53, 2);
}
function heavyThigh(g, ctx) {
  thigh(g, ctx);
  guard(g, ctx, 'M -3.2 1.6 C -1.0 1.1 1.6 1.0 3.4 1.2 C 3.9 4.0 3.8 7.0 3.2 9.6 C 1.2 10.1 -0.8 10.2 -2.8 10.0 C -3.5 7.4 -3.6 4.4 -3.2 1.6 Z', [-3.6, 1.0, 3.8, 10.2], 55, 3);
}

export const KALKANLI = {
  id: 'kalkanli', name: 'KALKANLI', role: 'VANTA', pal: PAL,
  pose: { nUpper: -0.35, nFore: -1.45, nHand: -0.2, fUpper: -0.1, fFore: -0.4, fHand: -0.2, nThigh: 0.26, nShin: 0.06, fThigh: -0.3, fShin: -0.04, head: 0.04 },
  parts: { ...PARTS, torso: heavyTorso, upper: heavyUpper, fore: heavyFore, thigh: heavyThigh, front: shieldFront },
};

// --- HÜCUMCU: light kit, a gas mask, the red unit band ----------------------------------------
const RED = mat(tone('#e85a55', '#c4302c', '#8c1f1c', '#3e0a09'), 'canvas', 0.5);
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
function maskHead(g) {
  const A = PAL.armor, B = brush(g);
  neck(g, PAL.black);
  // the black balaclava under it all, the knit drawn tight over the skull
  const HD = headShape({ jaw: 0.8 });
  cel(g, HD, PAL.black, { sh: 1.0, hl: 0.3 });
  B.inside(HD, () => { texture(g, 'knit', 0.35, 0.4); B.fill('M -5 -6 L 0 -6 L 0 0 L -5 0 Z', 'rgba(0,0,0,0.35)', 0.4); });
  // the mask: moulded black rubber over the face from the brow to under the chin; the
  // seal's softer edge round it, the brow over the lenses, the cheek's swell, the nose cup
  // standing out in front with the speech disc on it
  const MASK = 'M 0.4 -9.2 C 2.4 -9.7 4.6 -9.3 5.4 -8.2 C 5.7 -7.4 5.7 -6.6 5.5 -5.9 C 6.3 -5.5 6.7 -4.6 6.6 -3.7 C 6.5 -2.8 5.9 -2.0 5.0 -1.6 C 4.0 -1.2 2.6 -1.2 1.6 -1.6 C 0.8 -2.2 0.3 -3.2 0.2 -4.4 C 0.0 -6.0 0.0 -7.8 0.4 -9.2 Z';
  const RUB = mat(tone('#4a4f57', '#2e3238', '#1d2025', '#08090b'), 'rubber', 0.4);
  cel(g, MASK, RUB, { sh: 0.9, hl: 0.45, gloss: 0.4 });
  B.inside(MASK, () => {
    B.line(MASK, 'rgba(70,76,86,0.7)', 0.3, 0.1);
    B.line('M 1.0 -9.0 C 2.6 -9.4 4.4 -9.1 5.2 -8.2', 'rgba(170,180,194,0.4)', 0.14, 0.08);
    B.fill('M 5.0 -6.0 C 5.8 -5.7 6.3 -5.0 6.4 -4.2 L 4.8 -4.0 Z', 'rgba(150,160,174,0.25)', 0.2);
    B.fill('M 0 -3.4 C 2 -2.6 4 -2.2 7 -2.8 L 7 -1 L 0 -1 Z', 'rgba(0,0,0,0.45)', 0.3);
    texture(g, 'rubber', 0.35, 0.5);
  });
  // the harness: straps from the mask's edge back over the hood, their steel buckles
  for (const [d, bx, by] of [['M 0.5 -8.6 C -1.2 -9.6 -2.8 -10.0 -4.2 -9.6', -0.9, -9.25], ['M 0.3 -6.4 C -1.4 -6.6 -2.8 -6.6 -4.0 -6.2', -1.1, -6.55], ['M 0.6 -2.6 C -0.8 -3.0 -2.2 -3.6 -3.4 -4.4', -0.6, -2.95]]) {
    B.line(d, '#0c0d0f', 0.32, 0.01);
    B.line(d, 'rgba(110,118,128,0.3)', 0.06, 0.01);
    B.fill(`M ${bx - 0.24} ${by - 0.2} L ${bx + 0.24} ${by - 0.2} L ${bx + 0.24} ${by + 0.2} L ${bx - 0.24} ${by + 0.2} Z`, '#7b838c', 0.01);
    B.fill(`M ${bx - 0.12} ${by - 0.1} L ${bx + 0.12} ${by - 0.1} L ${bx + 0.12} ${by + 0.1} L ${bx - 0.12} ${by + 0.1} Z`, '#0c0d0f', 0.01);
  }
  // the lenses: dark glass in steel rings crimped into the rubber; the street's light across
  // the near one, the far one only an edge past the nose
  const lens = (x, y, rx, ry) => {
    B.fill(ell(x, y, rx + 0.3, ry + 0.3), '#0c0d10', 0.04);
    B.fill(ell(x, y, rx + 0.12, ry + 0.12), '#4c535b', 0.02);
    B.line(`M ${x - rx * 0.9} ${y - ry * 0.5} A ${rx + 0.08} ${ry + 0.08} 0 0 1 ${x + rx * 0.6} ${y - ry * 0.9}`, 'rgba(200,208,218,0.4)', 0.04, 0.02);
    B.fill(ell(x, y, rx, ry), '#121417', 0.01);
    B.inside(ell(x, y, rx, ry), () => {
      B.dab(x + rx * 0.15, y + ry * 0.25, rx * 0.8, ry * 0.6, 'rgba(70,22,26,0.5)');
      // the street's light lies across the glass as a band, not a ring
      B.fill(`M ${x - rx} ${y - ry * 0.1} L ${x - rx * 0.2} ${y - ry} L ${x + rx * 0.1} ${y - ry} L ${x - rx * 0.7} ${y + ry * 0.1} Z`, 'rgba(190,204,220,0.22)', rx * 0.08);
      B.dab(x - rx * 0.35, y - ry * 0.5, rx * 0.12, ry * 0.08, 'rgba(240,246,252,0.8)');
      B.dab(x + rx * 0.45, y + ry * 0.45, rx * 0.2, ry * 0.06, 'rgba(255,190,130,0.45)');
    });
  };
  lens(5.25, -7.1, 0.34, 0.62);
  lens(2.75, -7.1, 0.95, 1.0);
  // the speech disc on the nose cup, the filter on the cheek: a steel canister in Vanta's
  // grey screwed into its port, threaded, the intake perforated, the paint worn to the steel
  const VM = ell(6.1, -3.7, 0.55, 0.75);
  cel(g, VM, mat(tone('#6c747e', '#4a5059', '#30353c', '#101215'), 'steel', 0.3), { sh: 0.4, hl: 0.35, lw: 0.1 });
  B.inside(VM, () => { for (let i = -0.5; i <= 0.5; i += 0.25) B.line(`M ${5.7} ${-3.7 + i} L ${6.6} ${-3.7 + i}`, 'rgba(0,0,0,0.6)', 0.06, 0.01); });
  g.save(); g.translate(3.0, -3.3); g.rotate(0.55);
  const CAN = 'M -0.6 -1.15 L 2.4 -1.15 C 2.7 -1.15 2.85 -0.9 2.85 -0.6 L 2.85 0.6 C 2.85 0.9 2.7 1.15 2.4 1.15 L -0.6 1.15 Z';
  B.fill('M -0.9 -0.8 L -0.4 -0.8 L -0.4 0.8 L -0.9 0.8 Z', '#16181b', 0.01);
  cel(g, CAN, A, { sh: 0.7, hl: 0.45, gloss: 0.3 });
  B.inside(CAN, () => {
    for (let x = -0.5; x < 0.4; x += 0.14) B.line(`M ${x} -1.2 L ${x} 1.2`, 'rgba(10,12,16,0.55)', 0.05, 0.01);
    B.line('M -0.5 -0.9 L 2.6 -0.9', 'rgba(255,255,255,0.45)', 0.12, 0.06);
    B.fill('M -1 0.3 L 3 0.3 L 3 1.3 L -1 1.3 Z', 'rgba(10,14,20,0.4)', 0.2);
    B.fill('M 2.55 -1.2 L 2.9 -1.2 L 2.9 1.2 L 2.55 1.2 Z', '#2a2f36', 0.02);
    for (let y = -0.8; y < 0.9; y += 0.32) B.dab(2.72, y, 0.05, 0.05, '#050607');
    scuffs(g, [[1.4, -0.7, 0.3], [0.8, 0.6, 0.2, 0.4]], '#d8dde2', 0.6);
  });
  g.save(); g.translate(1.2, 0.18); g.scale(1 / 70, 1 / 70); g.fillStyle = 'rgba(240,244,248,0.6)'; g.font = "700 30px 'Barlow Condensed', sans-serif"; g.textAlign = 'center'; g.fillText('V-F2', 0, 0); g.restore();
  g.restore();
  // the low helmet over it all: a riot shell in Vanta's grey, the mark on its side
  const LID = 'M -4.8 -6.4 C -5.2 -10.0 -2.6 -12.8 0.6 -12.8 C 3.6 -12.8 5.3 -11.0 5.4 -9.0 L 4.6 -8.7 C 2.4 -9.1 -1.2 -8.8 -4.1 -6.0 Z';
  cel(g, LID, A, { sh: 1.3, hl: 0.55 });
  B.inside(LID, () => {
    B.line('M -3.8 -10.4 C -1.6 -12.4 1.8 -12.6 4.4 -11.2', 'rgba(255,255,255,0.55)', 0.2, 0.12);
    B.line('M 5.4 -9.0 L 4.6 -8.7 C 2.4 -9.1 -1.2 -8.8 -4.1 -6.0', '#1b1f26', 0.24, 0.02);
    emblem(g, -1.4, -9.8, 0.9, PAL.white.m);
    grime(g, -9, -6, DUST);
  });
  worn(g, LID, [-5.2, -12.8, 5.4, -6.0], 43, 0.7);
}
function lightTorso(g) {
  uniform(g);
  const LPLATE = blob([[-4.8, -20.8], [1.2, -21.8], [5.4, -20.8], [6.8, -16.8], [6.4, -11.4], [-0.4, -10.8], [-5.4, -11.6], [-5.8, -15.8]]);
  cel(g, LPLATE, PAL.armor, { sh: 1.6, hl: 0.55 });
  clip(g, LPLATE, () => { stroke(g, curve([[-4.0, -20.0], [1.2, -21.0], [5.0, -20.0]]), '#ffffff', 0.14, 0.6); for (const [x, y] of [[-4.2, -19.6], [5.4, -19.8]]) rivet(g, x, y, 0.24, PAL.steel); });
  worn(g, LPLATE, [-5.8, -21.8, 6.8, -10.8], 35);
  // the shell bandolier from the far shoulder to the near hip
  const BAND = 'M -6.0 -21.2 L -4.0 -22.2 L 6.6 -7.2 L 5.0 -5.8 Z';
  cel(g, BAND, PAL.webbing, { sh: 0.5, hl: 0.25 });
  for (let k = 0; k < 7; k++) {
    const u = k / 6, x = -4.6 + u * 10.0, y = -20.6 + u * 13.6;
    fill(g, `M ${x - 0.55} ${y - 0.2} L ${x + 0.55} ${y - 0.95} L ${x + 1.05} ${y - 0.2} L ${x - 0.05} ${y + 0.55} Z`, MAT.shell.m);
    fill(g, `M ${x + 0.45} ${y - 0.85} L ${x + 0.75} ${y - 1.05} L ${x + 1.2} ${y - 0.35} L ${x + 0.95} ${y - 0.15} Z`, M.brass.m);
  }
}
function lightUpper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL.suit), { sh: 1.5, hl: 0.45 });
  clothFolds(g, UPPER, [[[-2.0, 6.2], [-0.4, 7.0], [1.8, 6.6]], [[-1.8, 10.4], [0.0, 11.0], [1.8, 10.6]]], t(PAL.suit));
  clip(g, UPPER, () => { fold(g, [[-1.8, 8.8], [-0.4, 9.7], [1.2, 9.9]], t(PAL.suit)); });
  // the red unit band
  clip(g, UPPER, () => { cel(g, 'M -4 4.4 L 4 4.2 L 4 6.8 L -4 7.0 Z', t(RED), { sh: 0.4, hl: 0.2, lw: 0.2 }); stitch(g, 'M -4 4.7 L 4 4.5', t(RED).l, 0.06, 0.6); stitch(g, 'M -4 6.5 L 4 6.3', t(RED).l, 0.06, 0.6); });
}
function lightChest(g) {
  collar(g);
  cel(g, 'M -6.0 -5.4 C -1.2 -5.75 2.6 -5.75 5.7 -5.5 L 5.75 -3.6 C 2.6 -3.85 -1.2 -3.85 -6.05 -3.5 Z', PAL.webbing, { sh: 0.4, hl: 0.2 });
}

export const HUCUMCU = {
  id: 'hucumcu', name: 'HÜCUMCU', role: 'VANTA', pal: PAL,
  pose: {
    nThigh: 0.24, nShin: 0.08, fThigh: -0.3, fShin: -0.05, head: 0.02,
    gun: { w: WEAPONS.ramrod, at: [6.0, -40.6], ang: 0.35, k: 0.96, mat: SYN_MAT },
  },
  parts: { ...PARTS, head: maskHead, torso: lightTorso, upper: lightUpper, chest: lightChest },
};

// --- GALL: the Secretary -----------------------------------------------------------------------
// A bureaucrat, not a soldier: a double-breasted navy-black greatcoat to below
// the knee, belted, two rows of silver buttons; a thin armour vest under it
// shows at the collar; the peaked cap with a red band and the silver mark;
// black leather gloves. Fifties, short grey hair, clean-shaven, thin lips,
// cold grey eyes.
const G = {
  coat: mat(tone('#363c4d', '#252a37', '#181c26', '#090b10'), 'wool', 0.6),
  vest: mat(tone('#59606d', '#3e444f', '#2a2f37', '#111317'), 'nylon', 0.5),
  red: mat(tone('#c4423f', '#951f22', '#651416', '#2b0708'), 'wool', 0.4),
  silver: mat(tone('#f1f3f5', '#c3c9cf', '#8f969d', '#474c52'), 'steel', 0.4),
  leather: mat(tone('#3c3a39', '#262423', '#181716', '#080707'), 'leather', 0.5),
  shirt: tone('#eceae4', '#cfccc4', '#a29f98', '#55534e'),
  skin: mat(tone('#efcfb7', '#d4ad94', '#a8826b', '#64483a'), 'skin', 0.45),
  hair: tone('#c9c6c0', '#a19d97', '#76726c', '#3d3b38'),
};
const GCOAT = blob([
  [-2.0, -23.6], [-5.2, -23.0], [-8.0, -21.6], [-8.8, -19.0], [-8.4, -15.4], [-7.2, -11.4], [-6.6, -7.6], [-6.8, -3.4], [-6.8, 1.6],
  [6.2, 1.4], [6.0, -3.4], [5.6, -8.4], [6.2, -12.6], [6.9, -16.4], [6.5, -19.8], [4.2, -22.6], [1.2, -23.8],
]);
function gallTorso(g) {
  cel(g, PELVIS, G.coat, { sh: 1.1, hl: 0.4 });
  cel(g, GCOAT, G.coat, { sh: 2.2, hl: 0.6 });
  clip(g, GCOAT, () => {
    // the double-breasted front: the lapel's edge, two rows of silver buttons
    stroke(g, 'M 6.6 -21.0 C 3.2 -18.6 2.6 -14.0 2.8 -2.0', G.coat.k, 0.3);
    stitch(g, 'M 6.2 -21.0 C 2.8 -18.6 2.2 -14.0 2.4 -2.0', G.coat.l, 0.06, 0.5);
    for (const y of [-15.6, -11.6, -7.6]) for (const x of [1.0, 4.4]) rivet(g, x, y, 0.36, G.silver);
    // the belt, its silver buckle; the coat's seams and a crisp fold
    cel(g, 'M -8 -6.2 C -2 -6.6 2 -6.6 8 -6.2 L 8 -4.6 C 2 -5.0 -2 -5.0 -8 -4.6 Z', G.leather, { sh: 0.3, hl: 0.2 });
    buckle(g, 3.0, -6.6, 1.6, 2.1, G.silver);
    stroke(g, curve([[-5.0, -20.6], [-5.4, -15.0], [-5.0, -9.0], [-5.2, -1.0]]), G.coat.d, 0.3);
    fold(g, [[-4.2, -10.0], [-2.0, -9.2], [0.4, -9.4]], G.coat, 0.24);
  });
  // heavy wool: drag folds from under the arm toward the belt, the cloth bunched
  // above the belt and flaring below it, a crease down the skirt
  clothFolds(g, GCOAT, [[[-7.0, -17.4], [-5.2, -14.6], [-3.6, -11.2]], [[-6.4, -12.6], [-4.4, -10.4], [-2.0, -8.0]], [[-6.4, -7.6], [-3.4, -7.2], [0.2, -7.4]], [[-5.6, -3.6], [-6.0, -0.6]], [[0.4, -3.8], [0.8, -0.6]], [[5.4, -14.6], [4.4, -11.6], [4.2, -8.4]]], G.coat);
  // the shoulder board on the near side, silver piping
  cel(g, 'M -5.6 -22.6 L -1.0 -23.4 L -0.6 -22.2 L -5.2 -21.4 Z', G.coat, { sh: 0.2, hl: 0.2, lw: 0.2 });
  stroke(g, 'M -5.6 -22.6 L -1.0 -23.4', G.silver.m, 0.14);
}
function gallChest(g) {
  const B = brush(g), C = G.coat;
  // the throat: a white shirt collar stiff round the neck, a black tie knotted tight
  const SH = 'M 0.2 -24.6 C 1.2 -24.9 2.4 -24.9 3.3 -24.6 C 3.5 -24.2 3.6 -23.8 3.5 -23.3 L 1.0 -22.8 C 0.5 -23.4 0.2 -24.0 0.2 -24.6 Z';
  B.fill(SH, G.shirt.m, 0.02);
  B.inside(SH, () => { B.dab(1.0, -23.6, 1.2, 0.6, 'rgba(60,58,54,0.5)'); B.line('M 0.4 -24.55 C 1.4 -24.84 2.4 -24.84 3.2 -24.55', 'rgba(255,255,255,0.75)', 0.07, 0.02); B.line('M 0.5 -24.3 C 1.4 -24.56 2.4 -24.56 3.3 -24.3', 'rgba(70,66,60,0.45)', 0.05, 0.03); });
  B.fill('M 3.0 -23.9 C 3.3 -23.96 3.56 -23.86 3.62 -23.64 L 3.6 -22.7 C 3.36 -22.6 3.12 -22.62 2.96 -22.72 Z', '#111217', 0.02);
  B.line('M 3.08 -23.82 C 3.3 -23.86 3.48 -23.78 3.54 -23.62', 'rgba(150,156,170,0.5)', 0.04, 0.02);
  // the greatcoat's collar turned down over the shoulders: the roll round the back of
  // the neck lit along its top, the shadow it throws on the shirt, the point at the front
  const COL = 'M -3.8 -22.2 C -3.9 -23.4 -3.4 -24.4 -2.4 -24.8 C -1.2 -25.1 0.2 -24.9 1.2 -24.3 C 2.0 -23.8 2.7 -23.1 3.2 -22.4 L 4.0 -21.0 C 3.4 -20.8 2.8 -20.9 2.3 -21.1 C 1.0 -21.5 -0.6 -21.7 -2.0 -21.8 C -2.8 -21.9 -3.4 -22.0 -3.8 -22.2 Z';
  B.inside(SH, () => B.line('M -1 -24.4 C 0.6 -24.2 1.8 -23.6 2.8 -22.6', 'rgba(20,18,16,0.5)', 0.4, 0.25));
  cel(g, COL, C, { sh: 0.9, hl: 0.4 });
  B.inside(COL, () => {
    B.line('M -2.6 -24.7 C -1.2 -25.02 0.2 -24.82 1.2 -24.22 C 2.0 -23.72 2.7 -23.02 3.2 -22.32', 'rgba(150,160,186,0.5)', 0.16, 0.08);
    B.fill('M -5 -23.2 C -2 -23.0 1 -22.6 4 -21.6 L 4 -20 L -5 -20 Z', 'rgba(6,8,12,0.4)', 0.3);
    B.dab(-3.0, -23.0, 1.0, 1.4, 'rgba(6,8,12,0.4)');
    texture(g, 'wool', 0.4, 0.6);
  });
  stitch(g, 'M -3.4 -22.4 C -1.4 -22.0 1.0 -21.6 3.4 -21.0', C.l, 0.05, 0.4);
  // the red tab on the collar's front, the silver mark on it
  const TAB = 'M 1.4 -23.7 C 1.9 -23.4 2.4 -22.9 2.8 -22.3 L 3.3 -21.4 C 2.7 -21.3 2.1 -21.4 1.6 -21.6 C 1.4 -22.3 1.3 -23.0 1.4 -23.7 Z';
  cel(g, TAB, G.red, { sh: 0.3, hl: 0.25, lw: 0.14 });
  B.inside(TAB, () => { B.dab(2.2, -23.0, 0.5, 0.4, 'rgba(255,170,150,0.3)'); texture(g, 'wool', 0.35, 0.5); });
  emblem(g, 2.25, -22.35, 0.4, G.silver.m);
  B.line('M 1.98 -22.6 L 2.36 -22.62', 'rgba(255,255,255,0.6)', 0.04);
  // the armour vest's edge just showing under the collar's point
  B.line('M 3.7 -20.8 C 4.0 -20.5 4.3 -20.3 4.6 -20.2', G.vest.m, 0.16, 0.03);
}
function gallUpper(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.06, 1); cel(g, UPPER, t(G.coat), { sh: 1.5, hl: 0.45 }); g.restore();
  clip(g, UPPER, () => { fold(g, [[-1.6, 8.6], [-0.2, 9.6], [1.4, 9.8]], t(G.coat)); stitch(g, curve([[-2.2, 1.0], [-2.4, 6.0], [-2.0, 11.0]]), t(G.coat).l, 0.06, 0.5); });
  if (!ctx.far) clip(g, UPPER, () => emblem(g, 0.2, 3.2, 1.0, G.silver.m));
  clothFolds(g, UPPER, [[[-2.0, 6.4], [-0.4, 7.2], [1.8, 6.8]], [[-1.8, 10.6], [0.0, 11.2], [1.8, 10.8]]], t(G.coat));
}
function gallFore(g, ctx) {
  const t = ctx.t;
  g.save(); g.scale(1.06, 1); cel(g, FORE, t(G.coat), { sh: 1.3, hl: 0.4 }); g.restore();
  // the turned-back cuff with its two silver buttons, the white shirt cuff
  cel(g, blob([[-2.5, 6.6], [2.4, 6.4], [2.3, 8.6], [-2.4, 8.8]]), t(G.coat), { sh: 0.4, hl: 0.3, lw: 0.22 });
  for (const x of [-1.0, 0.4]) rivet(g, x, 7.6, 0.18, G.silver);
  cel(g, blob([[-1.9, 8.6], [1.8, 8.4], [1.7, 9.8], [-1.8, 10.0]]), t(G.shirt), { sh: 0.2, hl: 0.15, lw: 0.18 });
}
function gallHand(g, ctx) { glove(g, ctx, G.leather); }
const GTAIL = blob([[-5.4, -1.4], [2.8, -1.6], [3.6, 4.0], [4.2, 11.0], [4.8, 18.6], [0.6, 19.2], [-4.4, 19.0], [-6.2, 18.2], [-5.9, 9.0], [-5.6, 2.0]]);
function gallThigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(G.coat), { sh: 1.6, hl: 0.4 });
  cel(g, GTAIL, t(G.coat), { sh: 1.7, hl: 0.5 });
  clip(g, GTAIL, () => {
    fill(g, 'M 3.6 0 C 3.9 6 4.3 12 4.9 19.4 L 3.6 19.4 C 3.2 12 2.9 6 2.6 0 Z', t(G.coat).k, 0.5);
    stitch(g, 'M -6.2 18.0 C -2.4 18.6 1.4 18.6 4.9 18.1', t(G.coat).l, 0.06, 0.5);
    fold(g, [[-3.0, 1.0], [-3.6, 8.0], [-4.2, 16.0]], t(G.coat), 0.3);
    fold(g, [[0.4, 2.0], [0.2, 9.0], [0.0, 16.0]], t(G.coat), 0.26);
    // a silver button low on the skirt, a pocket flap
    cel(g, 'M -1.8 3.4 L 2.2 3.2 L 2.2 4.6 L -1.8 4.8 Z', t(G.coat), { sh: 0.2, hl: 0.15, lw: 0.2 });
  });
}
function gallShin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(G.coat), { sh: 1.4, hl: 0.35 });
  // tall polished boots, the shine running down the shaft
  const SH = blob([[-2.75, 3.4], [2.5, 3.1], [2.6, 9.0], [2.65, 15.0], [-2.65, 15.1], [-2.9, 9.0]]);
  cel(g, SH, t(G.leather), { sh: 0.9, hl: 0.5 });
  clip(g, SH, () => { stroke(g, curve([[1.4, 4.0], [1.7, 9.0], [1.6, 14.4]]), '#ffffff', 0.18, 0.35); stroke(g, 'M -2.8 3.8 C -1 3.5 1 3.4 2.6 3.6', t(G.leather).l, 0.12, 0.6); });
}
function gallFoot(g, ctx) { boot(g, ctx, G.leather, PAL.sole, { toe: G.leather }); }
// Gall's head in profile, painted the way HAWK's is (docs §10.15): the planes
// first, then the colour of the skin in its zones, then the features. A long,
// narrow face; a straight nose with a slight bump, set close under a heavy brow;
// a thin mouth pulled straight; a hard chin; the ear flat to the head. The
// street light is above and in front: the cap's peak throws its shadow over
// the forehead and the eye, so his eye is a dark shape with one glint in it.
const GHEAD = 'M -2.8 -3.4 C -3.6 -4.2 -3.95 -5.4 -3.9 -6.6 C -3.85 -8.2 -3.0 -9.6 -1.5 -10.2 C 0.0 -10.7 1.9 -10.6 3.0 -9.9 C 3.8 -9.4 4.15 -8.6 4.2 -7.8 C 4.22 -7.3 4.3 -7.02 4.44 -6.84 C 4.46 -6.64 4.32 -6.52 4.22 -6.44 C 4.4 -6.12 4.56 -5.86 4.66 -5.66 C 4.86 -5.3 5.14 -4.98 5.32 -4.74 C 5.46 -4.52 5.4 -4.32 5.2 -4.28 C 4.98 -4.24 4.72 -4.24 4.5 -4.2 C 4.6 -4.02 4.66 -3.82 4.63 -3.63 C 4.55 -3.56 4.48 -3.53 4.44 -3.5 C 4.55 -3.42 4.58 -3.3 4.52 -3.18 C 4.38 -3.06 4.32 -2.96 4.36 -2.8 C 4.52 -2.58 4.62 -2.28 4.5 -2.02 C 4.3 -1.78 3.86 -1.68 3.3 -1.7 C 2.4 -1.78 1.4 -2.1 0.6 -2.6 C 0.1 -2.9 -0.3 -3.2 -0.6 -3.5 C -1.0 -3.1 -1.6 -2.9 -2.4 -2.9 C -2.6 -3.0 -2.7 -3.2 -2.8 -3.4 Z';
// the ear, tilted back, flat to the head: helix, lobe at the front of its foot
const GEAR = 'M 0.05 -6.62 C 0.55 -6.58 0.72 -6.1 0.62 -5.55 C 0.56 -5.1 0.42 -4.72 0.3 -4.42 C 0.18 -4.22 -0.02 -4.18 -0.18 -4.28 C -0.42 -4.5 -0.62 -5.0 -0.78 -5.5 C -0.92 -5.95 -0.88 -6.36 -0.6 -6.56 C -0.42 -6.66 -0.2 -6.66 0.05 -6.62 Z';
// short back and sides, grey, the temples gone white: under the band, round the ear, down the nape
const GHAIR = 'M 2.6 -7.9 C 2.0 -7.6 1.3 -7.2 1.05 -6.75 C 0.92 -6.45 0.86 -6.2 0.84 -5.9 L 0.62 -5.92 C 0.58 -6.3 0.42 -6.6 0.08 -6.7 C -0.4 -6.78 -0.8 -6.62 -0.98 -6.3 C -1.12 -5.9 -1.02 -5.3 -0.86 -4.8 C -0.78 -4.5 -0.74 -4.1 -0.9 -3.7 C -1.2 -3.2 -1.5 -2.9 -1.9 -2.6 C -2.3 -2.9 -2.6 -3.2 -2.8 -3.4 C -3.6 -4.2 -3.95 -5.4 -3.9 -6.6 C -3.88 -7.4 -3.7 -8.1 -3.4 -8.6 L 2.6 -8.6 Z';
// the cap: a high crown raised at the front, the red band, a black patent peak
const GCROWN = 'M -4.0 -8.8 C -4.4 -9.2 -4.85 -9.75 -4.95 -10.2 C -5.02 -10.6 -4.7 -10.82 -4.1 -10.9 C -1.2 -11.32 2.4 -11.72 4.95 -11.86 C 5.65 -11.88 5.95 -11.62 5.82 -11.24 C 5.55 -10.36 5.0 -9.24 4.55 -8.42 C 1.8 -8.5 -1.5 -8.62 -4.0 -8.8 Z';
const GBAND = 'M -4.05 -7.82 C -1.5 -7.58 1.8 -7.42 4.48 -7.36 C 4.56 -7.72 4.58 -8.1 4.55 -8.44 C 1.8 -8.52 -1.5 -8.64 -4.0 -8.82 C -4.1 -8.5 -4.12 -8.15 -4.05 -7.82 Z';
const GPEAK = 'M 3.0 -7.62 C 4.3 -7.7 5.6 -7.5 6.55 -7.12 C 6.9 -6.98 7.05 -6.86 6.95 -6.78 C 6.2 -6.86 5.2 -6.98 4.2 -7.08 C 3.7 -7.14 3.3 -7.28 3.0 -7.62 Z';
function gallHead(g) {
  const S = G.skin, B = brush(g);
  // is (x, y) of this frame inside the path, whatever transform the frame is under
  const inP = (d, x, y) => { const M0 = g.getTransform(); return g.isPointInPath(new Path2D(d), M0.a * x + M0.c * y + M0.e, M0.b * x + M0.d * y + M0.f); };
  // skin fold: a dark crease, the edge under it catching the light from above
  const crease = (d, w = 0.06, a = 0.5) => {
    B.line(d, `rgba(70,36,26,${a})`, w, w * 0.6);
    g.save(); g.translate(0.02, 0.04); B.line(d, `rgba(255,226,206,${a * 0.45})`, w * 0.8, w * 0.6); g.restore();
  };
  // the neck: a column leaning up into the skull, the jaw's shadow across its top, the
  // cord of the neck from behind the ear down to the collar, the Adam's apple
  const GNECK = 'M -2.2 1.4 C -2.25 0.2 -2.3 -1.2 -2.6 -2.6 C -2.7 -3.0 -2.8 -3.3 -2.9 -3.6 L 0.0 -3.7 C 0.8 -3.1 1.6 -2.6 2.1 -2.2 C 2.3 -1.2 2.35 0.2 2.3 1.3 Z';
  B.fill(GNECK, '#a17c67', 0.02);
  B.inside(GNECK, () => {
    B.fill('M -3 -4 L 0.6 -4 C 0.4 -2.6 0.4 -1.0 0.8 1.6 L -3 1.6 Z', 'rgba(52,30,24,0.55)', 0.4);
    B.fill('M -3 -4 L 3 -4 L 3 -2.0 C 1.6 -2.0 0.2 -1.8 -3 -1.2 Z', 'rgba(40,22,16,0.5)', 0.35);
    B.line('M -0.3 -3.3 C 0.3 -2.0 0.9 -0.8 1.4 0.8', 'rgba(224,180,156,0.35)', 0.32, 0.22);
    B.line('M -0.7 -3.0 C -0.2 -1.8 0.3 -0.6 0.7 0.8', 'rgba(60,32,24,0.35)', 0.16, 0.14);
    B.line('M 2.12 -1.9 C 2.24 -1.0 2.26 0.0 2.24 1.0', 'rgba(232,194,170,0.4)', 0.12, 0.08);
    B.dab(2.05, -1.05, 0.16, 0.3, 'rgba(236,198,176,0.45)');
    B.dab(1.9, -0.7, 0.18, 0.16, 'rgba(70,40,30,0.3)');
    texture(g, 'skin', 0.35, 0.9);
  });

  // --- the planes: the side of the face in half light, the back of the skull and
  // everything under the jaw in shade, the front of the face in the lamp
  B.fill(GHEAD, '#b48c76', 0.03);
  B.inside(GHEAD, () => {
    B.fill('M -5 -11 L 1.5 -11 C 1.0 -8.6 0.9 -6.0 1.3 -3.9 C 1.5 -3.0 1.7 -2.4 1.9 -1 L -5 -1 Z', 'rgba(64,38,30,0.62)', 0.55);
    B.fill('M -5 -11 L 2.4 -11 C 2.0 -8.6 1.9 -6.0 2.2 -3.9 C 2.4 -3.0 2.6 -2.4 2.8 -1 L -5 -1 Z', 'rgba(90,54,42,0.22)', 0.5);
    B.fill('M 2.9 -9.2 C 3.7 -8.8 4.2 -8.0 4.4 -6.9 L 4.3 -6.4 L 5.2 -4.7 L 4.7 -3.6 L 4.7 -1.9 L 3.7 -1.8 C 3.4 -2.6 3.3 -3.5 3.2 -4.3 C 3.0 -5.3 2.7 -6.4 2.6 -7.6 C 2.6 -8.2 2.7 -8.8 2.9 -9.2 Z', 'rgba(240,206,184,0.82)', 0.24);
    // the top of the cheekbone, the ridge of the jaw, the top of the chin: planes that face up
    B.fill('M 2.4 -5.75 C 2.9 -5.85 3.5 -5.85 4.0 -5.7 L 3.9 -5.36 C 3.4 -5.3 2.9 -5.34 2.4 -5.44 Z', 'rgba(252,222,200,0.6)', 0.12);
    B.line('M 0.4 -3.0 C 1.4 -2.5 2.6 -2.1 3.8 -2.0', 'rgba(250,218,196,0.32)', 0.16, 0.12);
    B.dab(4.35, -2.32, 0.32, 0.38, 'rgba(255,230,212,0.5)');
    // the hollow under the cheekbone, the temple's hollow
    B.fill('M 1.6 -5.0 C 2.3 -4.8 3.1 -4.7 3.8 -4.8 C 3.9 -4.4 3.8 -4.0 3.6 -3.8 C 2.9 -3.9 2.2 -4.1 1.5 -4.4 Z', 'rgba(96,58,44,0.38)', 0.22);
    B.dab(2.5, -7.0, 0.7, 0.5, 'rgba(96,58,44,0.3)');
    B.line('M 0.9 -5.6 C 1.6 -5.62 2.2 -5.66 2.8 -5.7', 'rgba(250,220,200,0.3)', 0.22, 0.18);
    B.fill('M 1.0 -5.3 C 1.6 -4.8 1.8 -3.8 1.6 -2.8 C 1.2 -2.7 0.8 -2.9 0.5 -3.2 C 0.6 -4.0 0.7 -4.8 1.0 -5.3 Z', 'rgba(90,52,40,0.28)', 0.3);
    B.dab(0.85, -5.0, 0.3, 0.55, 'rgba(80,46,36,0.35)');
    B.dab(2.2, -3.4, 0.9, 0.6, 'rgba(110,64,50,0.15)');
    // under the jaw, its own shadow; the jaw's edge crisp where the bone turns
    B.fill('M -0.8 -3.3 C 0.4 -2.7 1.8 -2.2 3.2 -2.05 C 3.8 -2.0 4.3 -2.1 4.6 -2.2 L 4.8 0 L -1 0 Z', 'rgba(48,26,20,0.72)', 0.12);
    // the nose: the bridge in the lamp, the side plane in half light, the tip round and
    // lit, the wing a pad with its groove round the back, the nostril, the shadow it throws
    B.fill('M 4.2 -6.3 C 4.5 -5.8 4.9 -5.2 5.2 -4.82 L 4.5 -4.56 C 4.3 -5.1 4.06 -5.6 3.9 -6.0 Z', 'rgba(150,100,80,0.3)', 0.1);
    B.line('M 4.32 -6.32 C 4.48 -6.04 4.6 -5.82 4.68 -5.66 C 4.86 -5.34 5.1 -5.04 5.28 -4.8', 'rgba(255,234,216,0.75)', 0.1, 0.05);
    B.dab(4.62, -5.7, 0.1, 0.16, 'rgba(255,240,226,0.5)', 1, 'source-over', -0.5);
    B.dab(5.24, -4.58, 0.18, 0.15, 'rgba(255,238,224,0.7)');
    B.dab(5.1, -4.48, 0.32, 0.22, 'rgba(200,110,90,0.3)');
    B.dab(4.62, -4.56, 0.3, 0.22, 'rgba(206,140,116,0.5)');
    B.line('M 4.42 -4.86 C 4.26 -4.7 4.26 -4.44 4.42 -4.34 C 4.56 -4.28 4.7 -4.28 4.82 -4.3', 'rgba(70,34,24,0.65)', 0.07, 0.04);
    B.line('M 4.84 -4.33 C 4.98 -4.35 5.1 -4.34 5.2 -4.31', 'rgba(40,16,10,0.8)', 0.06, 0.03);
    B.fill('M 4.36 -4.24 C 4.58 -4.2 4.7 -4.12 4.7 -4.0 C 4.54 -3.98 4.36 -4.04 4.24 -4.12 Z', 'rgba(60,30,22,0.5)', 0.06);
    // the fold from the nose to the mouth, and the line down from the mouth's corner:
    // a man who does not smile
    crease('M 4.3 -4.82 C 4.06 -4.5 3.96 -4.1 4.0 -3.66', 0.07, 0.62);
    crease('M 3.98 -3.4 C 3.94 -3.1 3.92 -2.85 3.98 -2.6', 0.05, 0.35);
    crease('M 2.6 -2.55 C 3.0 -2.4 3.4 -2.36 3.7 -2.4', 0.05, 0.25);
    // the mouth: thin lips pressed into a straight line, the corner turned a little down
    B.fill('M 4.6 -3.63 C 4.4 -3.6 4.2 -3.56 4.04 -3.5 L 4.42 -3.5 Z', 'rgba(150,84,72,0.6)', 0.03);
    B.line('M 4.43 -3.5 C 4.3 -3.49 4.15 -3.47 4.0 -3.42', 'rgba(64,26,20,0.92)', 0.055, 0.02);
    B.fill('M 4.48 -3.46 C 4.52 -3.36 4.5 -3.24 4.42 -3.18 C 4.3 -3.26 4.16 -3.34 4.06 -3.4 Z', 'rgba(176,104,90,0.45)', 0.04);
    B.dab(4.4, -3.3, 0.1, 0.05, 'rgba(255,224,206,0.6)');
    // the colour of the skin: yellow in the forehead, red in the nose, the cheek and the
    // ear, the blue-grey of a close shave over the jaw and the upper lip
    B.dab(3.6, -8.4, 1.1, 0.7, 'rgba(214,170,110,0.2)');
    B.dab(5.0, -4.7, 0.45, 0.4, 'rgba(196,84,70,0.22)');
    B.dab(3.0, -5.0, 1.0, 0.6, 'rgba(196,90,74,0.16)');
    B.fill('M 1.0 -4.6 C 2.0 -4.3 3.2 -4.0 4.1 -4.05 C 4.5 -3.9 4.6 -3.4 4.55 -2.6 C 4.5 -2.1 4.2 -1.8 3.6 -1.75 C 2.4 -1.9 1.2 -2.3 0.3 -2.9 Z', 'rgba(84,96,110,0.2)', 0.25);
    B.dab(4.45, -3.9, 0.22, 0.12, 'rgba(84,96,110,0.18)');
    // fifty years in the skin: mottling, pores, a few marks
    const rm = rnd(141), MOT = ['176,82,66', '196,160,110', '120,84,110', '84,48,36', '250,214,190'];
    for (let i = 0; i < 140; i++) { const x = 0.8 + rm() * 4.2, y = -8.6 + rm() * 6.6, rr = 0.06 + rm() * 0.2; B.dab(x, y, rr, rr * (0.6 + rm() * 0.5), `rgba(${MOT[(rm() * MOT.length) | 0]},${0.05 + rm() * 0.07})`, 1, 'source-over', rm() * 3); }
    for (let i = 0; i < 260; i++) { const x = 1.2 + rm() * 3.8, y = -8.4 + rm() * 6.2; B.dab(x, y, 0.012 + rm() * 0.02, 0.01 + rm() * 0.016, rm() < 0.6 ? 'rgba(70,34,24,0.22)' : 'rgba(255,226,206,0.16)'); }
    texture(g, 'skin', 0.4, 0.9);
    // the street's cold on the back of the skull and the nape
    B.line('M -3.7 -7.6 C -3.95 -6.4 -3.75 -5.0 -3.1 -3.9', 'rgba(140,160,186,0.35)', 0.16, 0.14);
  });

  // --- the ear: helix, the hollow inside it, the tragus in front; red where the light
  // comes through its top, its shadow on the side of the head
  B.inside(GHEAD, () => B.dab(-0.45, -5.3, 0.5, 1.0, 'rgba(40,20,14,0.4)'));
  B.fill(GEAR, '#9e7762', 0.02);
  B.inside(GEAR, () => {
    B.dab(0.1, -6.1, 0.6, 0.45, 'rgba(226,182,158,0.4)');
    B.dab(-0.5, -5.2, 0.4, 0.9, 'rgba(70,40,30,0.35)');
    // the helix rolled over at the back and top, lit along its top
    B.line('M 0.42 -6.44 C 0.02 -6.58 -0.44 -6.5 -0.64 -6.18 C -0.76 -5.8 -0.66 -5.24 -0.46 -4.8', 'rgba(70,38,28,0.45)', 0.1, 0.06);
    B.line('M 0.4 -6.52 C 0.0 -6.64 -0.44 -6.56 -0.66 -6.24', 'rgba(246,206,184,0.5)', 0.06, 0.04);
    // the antihelix, the fold inside it
    B.line('M 0.3 -6.16 C 0.0 -6.22 -0.3 -6.1 -0.38 -5.82 C -0.42 -5.5 -0.3 -5.2 -0.16 -5.0', 'rgba(236,196,172,0.4)', 0.07, 0.04);
    B.line('M 0.22 -6.04 C -0.04 -6.06 -0.24 -5.94 -0.28 -5.7', 'rgba(90,50,38,0.4)', 0.04, 0.03);
    // the concha's hollow, the tragus in front of it
    B.fill('M 0.38 -5.62 C 0.5 -5.44 0.48 -5.1 0.34 -4.9 C 0.18 -4.88 0.06 -5.02 0.04 -5.28 C 0.04 -5.46 0.16 -5.6 0.38 -5.62 Z', 'rgba(90,50,38,0.55)', 0.05);
    B.dab(0.54, -5.16, 0.08, 0.14, 'rgba(230,184,160,0.55)');
    B.dab(0.02, -4.42, 0.2, 0.16, 'rgba(190,104,88,0.3)');
    texture(g, 'skin', 0.25, 0.9);
  });

  // --- the hair: cut close, grey, white at the temples, darker behind; combed back
  // under the cap, the sideburn short and square
  B.fill(GHAIR, 'rgb(98,94,90)', 0.04);
  B.inside(GHAIR, () => {
    B.dab(1.5, -7.3, 1.2, 0.9, 'rgba(200,196,190,0.6)');
    B.dab(-0.3, -7.2, 1.0, 0.6, 'rgba(170,166,160,0.3)');
    B.fill('M -5 -9 L 3 -9 L 3 -7.5 C 1 -7.3 -2 -7.3 -5 -7.4 Z', 'rgba(20,18,16,0.4)', 0.2);
    B.dab(-2.9, -5.8, 1.3, 2.0, 'rgba(22,20,18,0.45)');
    // the scalp shows through where it is cut shortest, low on the nape
    B.dab(-1.6, -3.2, 0.9, 0.5, 'rgba(150,112,94,0.3)');
    texture(g, 'wool', 0.25, 0.4);
  });
  B.hairs(1500, 151, (i, rr) => {
    const x = -4 + rr() * 6.8, y = -8.6 + rr() * 6.2;
    if (!inP(GHAIR, x, y)) return null;
    const l = Math.min(1, Math.max(0, (x + 1.2) / 3.2)), salt = rr() < 0.55;
    const v = (salt ? 128 : 60) + l * 64 + (rr() - 0.5) * 24;
    return [x, y, x > 0.4 ? Math.PI * 0.64 + (rr() - 0.5) * 0.4 : Math.PI * 0.5 + 0.4 + (rr() - 0.5) * 0.5, 0.06 + rr() * 0.1, `rgba(${v + 2 | 0},${v | 0},${v - 4 | 0},1)`, 0.016, salt ? 0.25 + l * 0.3 : 0.35];
  });
  // the hairline softens into the skin, never a cut edge
  B.hairs(160, 157, (i, rr) => {
    const x = -3.4 + rr() * 6, y = -7.8 + rr() * 4.4;
    if (inP(GHAIR, x, y) || !inP(GHEAD, x, y) || inP(GEAR, x, y)) return null;
    let near = false; for (const [dx, dy] of [[0.15, 0], [-0.15, 0], [0, 0.15], [0, -0.15]]) near = near || inP(GHAIR, x + dx, y + dy);
    if (!near) return null;
    return [x, y, Math.PI * 0.55, 0.08 + rr() * 0.1, 'rgba(120,116,110,1)', 0.016, 0.4];
  });

  // --- the eye, deep under the brow: a wedge open to the front, the white dim, the
  // iris a pale grey sliver behind the cornea, the upper lid heavy over it; the
  // bag under it, the lines running back from its corner
  const EYE = 'M 3.14 -6.12 C 3.38 -6.4 3.7 -6.48 3.98 -6.27 C 4.04 -6.17 4.02 -6.06 3.95 -6.02 C 3.66 -5.9 3.38 -5.94 3.14 -6.12 Z';
  B.dab(3.6, -6.2, 0.62, 0.36, 'rgba(70,40,30,0.4)');
  B.fill(EYE, '#a4968a', 0.02);
  B.inside(EYE, () => {
    B.dab(3.3, -6.12, 0.3, 0.18, 'rgba(60,40,34,0.6)');
    B.fill('M 3.68 -6.38 C 3.86 -6.36 3.96 -6.22 3.94 -6.06 C 3.86 -5.98 3.74 -5.97 3.66 -6.03 C 3.58 -6.14 3.58 -6.3 3.68 -6.38 Z', '#7e8c96', 0.01);
    B.line('M 3.68 -6.38 C 3.58 -6.3 3.58 -6.14 3.66 -6.03', 'rgba(40,46,52,0.8)', 0.03, 0.01);
    B.dab(3.84, -6.2, 0.055, 0.07, '#141315');
    B.fill('M 3.1 -6.56 L 4.05 -6.56 L 4.05 -6.28 C 3.8 -6.26 3.5 -6.24 3.1 -6.1 Z', 'rgba(40,22,16,0.55)', 0.03);
  });
  B.dab(3.9, -6.25, 0.04, 0.03, '#fff2e4', 0.95);
  B.line('M 3.12 -6.12 C 3.38 -6.42 3.72 -6.5 4.0 -6.28', 'rgba(30,14,10,0.95)', 0.075, 0.025);
  B.line('M 3.2 -6.28 C 3.46 -6.52 3.76 -6.56 4.06 -6.4', 'rgba(120,74,58,0.45)', 0.07, 0.05);
  crease('M 3.18 -6.4 C 3.46 -6.66 3.8 -6.68 4.1 -6.52', 0.04, 0.5);
  B.line('M 3.26 -6.0 C 3.5 -5.9 3.74 -5.9 3.94 -6.0', 'rgba(240,196,170,0.4)', 0.04, 0.02);
  crease('M 3.24 -5.86 C 3.5 -5.72 3.78 -5.74 3.98 -5.86', 0.035, 0.32);
  for (const [dy, l] of [[-0.12, 0.42], [0.02, 0.5], [0.15, 0.38]]) crease(`M 3.08 ${-6.12 + dy * 0.4} l ${-l} ${dy * 0.6}`, 0.025, 0.3);
  // the brow: thin, straight, grey, low over the eye
  softBrow(g, 3.05, -6.76, 4.36, -6.86, 0.04, '#6f6a64', 7);

  // --- the cap's shadow: the peak's edge across the face. Under it the forehead and
  // the eye are still there, in the light thrown back up off the lit cheek
  const CAPSH = 'M -6 -12 L 8 -12 L 8 -6.18 C 6.4 -6.12 5.0 -6.08 4.46 -6.1 C 4.2 -6.0 3.9 -5.92 3.5 -5.94 C 3.0 -5.98 2.5 -6.3 2.0 -6.8 C 1.6 -7.2 1.2 -7.5 0.8 -7.62 L -6 -7.7 Z';
  B.inside(GHEAD, () => {
    B.fill(CAPSH, 'rgba(34,20,16,0.64)', 0.1);
    B.inside(CAPSH, () => { B.dab(3.8, -6.3, 0.9, 0.3, 'rgba(176,120,96,0.28)'); B.dab(4.3, -6.9, 0.3, 0.4, 'rgba(150,100,80,0.2)'); });
    B.line('M 4.48 -6.1 C 4.1 -5.98 3.7 -5.9 3.3 -5.96', 'rgba(255,226,206,0.35)', 0.06, 0.05);
  });
  B.inside(GHAIR, () => B.fill(CAPSH, 'rgba(20,18,16,0.5)', 0.1));
  B.inside(GEAR, () => B.fill(CAPSH, 'rgba(34,20,16,0.45)', 0.1));

  // --- the cap: a high crown in the coat's navy wool, stiffened at the front, red
  // piping round its top; the red band; the silver mark over the peak; the black
  // patent peak with the sky in it; the silver cord over the peak to its button
  const C = G.coat;
  B.fill(GCROWN, C.m, 0.02);
  B.inside(GCROWN, () => {
    B.dab(4.0, -10.9, 2.2, 0.9, 'rgba(120,132,160,0.3)');
    B.fill('M -6 -10 L -1.5 -10 C -1.6 -9.6 -1.8 -9.2 -2.2 -8.6 L -6 -8.6 Z', 'rgba(6,8,12,0.5)', 0.4);
    B.line('M 4.6 -11.5 C 4.35 -10.5 3.95 -9.5 3.6 -8.7', 'rgba(150,162,190,0.3)', 0.22, 0.18);
    B.line('M -4.6 -9.9 C -2.0 -9.6 1.4 -9.3 4.5 -9.0', 'rgba(4,6,10,0.4)', 0.16, 0.12);
    B.line('M -3.6 -10.4 C -1.4 -10.0 0.6 -9.8 2.2 -9.9', 'rgba(140,152,180,0.18)', 0.08, 0.06);
    texture(g, 'wool', 0.45, 0.6);
  });
  B.line('M -4.75 -10.8 C -1.2 -11.24 2.4 -11.64 4.95 -11.78 C 5.6 -11.8 5.86 -11.6 5.8 -11.3', G.red.m, 0.13, 0.02);
  B.line('M -4.4 -10.92 C -1.2 -11.34 2.4 -11.74 4.95 -11.88', 'rgba(255,190,170,0.4)', 0.04, 0.02);
  B.fill(GBAND, G.red.d, 0.02);
  B.inside(GBAND, () => {
    B.fill('M -5 -9 L 5 -9 L 5 -8.15 C 1.8 -8.2 -1.5 -8.32 -5 -8.5 Z', 'rgba(220,90,86,0.4)', 0.1);
    B.dab(3.4, -7.9, 1.2, 0.4, 'rgba(255,150,130,0.25)');
    B.dab(-3.2, -8.2, 1.4, 0.6, 'rgba(20,4,4,0.5)');
    texture(g, 'wool', 0.4, 0.5);
  });
  B.line('M -4.0 -8.82 C -1.5 -8.64 1.8 -8.52 4.55 -8.44', 'rgba(16,6,6,0.55)', 0.05, 0.02);
  // the mark over the peak, seen nearly edge on at the front of the crown
  g.save(); g.translate(4.92, -9.62); g.scale(0.5, 1); emblem(g, 0, 0, 0.62, G.silver.m); g.restore();
  B.line('M 4.74 -10.0 L 4.98 -10.02', 'rgba(255,255,255,0.7)', 0.04);
  // the cord and its button
  B.line('M 1.5 -7.74 C 2.4 -7.68 3.4 -7.64 4.52 -7.62', G.silver.k, 0.17, 0.01);
  B.line('M 1.5 -7.74 C 2.4 -7.68 3.4 -7.64 4.52 -7.62', G.silver.m, 0.12, 0.01);
  for (let x = 1.62; x < 4.5; x += 0.16) B.line(`M ${x} -7.62 l 0.09 -0.12`, G.silver.l, 0.04, 0, 0.9);
  B.dab(1.42, -7.74, 0.2, 0.2, G.silver.k); B.dab(1.42, -7.75, 0.16, 0.16, G.silver.d); B.dab(1.38, -7.8, 0.08, 0.08, '#ffffff', 0.9);
  // the peak: patent leather, the sky's grey along its top, black under
  B.fill(GPEAK, '#0b0c0f', 0.01);
  B.inside(GPEAK, () => {
    B.line('M 3.3 -7.56 C 4.4 -7.62 5.6 -7.44 6.6 -7.06', 'rgba(196,206,222,0.55)', 0.07, 0.03);
    B.dab(5.6, -7.32, 0.6, 0.08, 'rgba(240,244,250,0.7)');
    B.line('M 4.2 -7.1 C 5.2 -7.0 6.2 -6.88 6.95 -6.8', 'rgba(40,46,40,0.9)', 0.05, 0.02);
  });
}

export const GALL = {
  id: 'gall', name: 'GALL', role: 'VANTA', pal: G,
  pose: {
    nThigh: 0.2, nShin: 0.06, fThigh: -0.26, fShin: -0.04, head: 0.02,
    gun: { w: WEAPONS.kestrel, at: [6.4, -41.4], ang: 0.4, k: 0.96, mat: SYN_MAT },
  },
  parts: { ...PARTS, head: gallHead, torso: gallTorso, chest: gallChest, upper: gallUpper, fore: gallFore, hand: gallHand, thigh: gallThigh, shin: gallShin, foot: gallFoot },
};
