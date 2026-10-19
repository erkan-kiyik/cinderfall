// VESPER — control. Thirty-three; six years a signal analyst in Vanta's
// listening room, until the Söndürme records crossed her desk and she walked
// out with what she knew (docs/KOR_STORY_CINEMATIC.md §9.2). Now the voice on
// the radio, and dressed like someone who works the set all night and has to
// carry it: a faded olive field jacket to the hip over the grey-blue roll neck
// she kept from the listening room; an old manpack radio on her back in its
// webbing, the handset clipped to the harness on her chest; a web belt;
// charcoal work trousers, brown laced boots worn pale. A bare face,
// tired under the eyes; dark hair pulled back in a low tail; one cup of a
// headset on the near ear and its boom at the corner of the mouth; wool
// gloves with the fingers cut off for the dials. Nothing on her lights up.
// Built on the body standard in body.js.
import { tone, mat, M } from '../style.js';
import { Brush } from '../paint.js';
import {
  cel, fill, stroke, clip, blob, curve, fold,
  UPPER, FORE, THIGH, SHIN, TORSO, PELVIS,
  glove, boot, korBand, stitch, rivet, buckle, grime, scuffs,
  softEye, softBrow, skinGlaze, skinDetail, softHair, neck, clothFolds,
} from './body.js';

const PAL = {
  jacket: mat(tone('#7a7a5c', '#5c5d45', '#404130', '#181912'), 'canvas', 0.7),
  patch: mat(tone('#6c6e52', '#50523d', '#37392b', '#151610'), 'canvas', 0.7),
  jumper: mat(tone('#7f8a97', '#606a77', '#454d58', '#1c2025'), 'knit', 0.75),
  pants: mat(tone('#4b4c4d', '#363738', '#252627', '#0d0d0e'), 'canvas', 0.5),
  web: mat(tone('#67674d', '#4d4d39', '#353527', '#14140e'), 'nylon', 0.65),
  radio: mat(tone('#6b6c56', '#4f503f', '#37382c', '#151610'), 'paint', 0.6),
  black: mat(tone('#4a4c4f', '#313336', '#202124', '#0b0b0c'), 'rubber', 0.45),
  steel: mat(tone('#b4b6b2', '#868984', '#5c5e5a', '#272826'), 'steel', 0.5),
  hair: tone('#56402f', '#36281e', '#221913', '#0a0706'),
  wool: mat(tone('#5e5a54', '#46433e', '#302e2a', '#121110'), 'knit', 0.8),
  strap: mat(tone('#7a5a40', '#5a412d', '#3d2b1e', '#170f0a'), 'leather', 0.6),
  boot: mat(tone('#73583f', '#523d2b', '#36281c', '#150f0a'), 'leather', 0.65),
  sole: mat(M.rubber, 'rubber', 0.6),
  band: mat(tone('#4f5156', '#393b3f', '#27292c', '#0f1012'), 'knit', 0.7),
  paper: mat(tone('#efe6cf', '#d8cba9', '#ab9d7c', '#5d553f'), 'paint', 0.3),
  skin: mat(tone('#e9cab0', '#cfaa8d', '#a27f66', '#664a3b'), 'skin', 0.4),
};
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
const brush = (g) => { const T = g.getTransform(); return new Brush(g, Math.hypot(T.a, T.b)); };

// A coiled cord along a quadratic curve: n turns of radius r, lit on top.
function coil(g, [x0, y0], [x1, y1], [x2, y2], n, r, t) {
  for (let i = 0; i <= n; i++) {
    const u = i / n, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
    const x = a * x0 + b * x1 + c * x2, y = a * y0 + b * y1 + c * y2;
    const tx = 2 * (1 - u) * (x1 - x0) + 2 * u * (x2 - x1), ty = 2 * (1 - u) * (y1 - y0) + 2 * u * (y2 - y1);
    g.save(); g.translate(x, y); g.rotate(Math.atan2(ty, tx));
    stroke(g, `M 0 ${-r} C ${r * 0.9} ${-r} ${r * 0.9} ${r} 0 ${r}`, t.k, 0.17);
    stroke(g, `M 0.05 ${-r * 0.8} C ${r * 0.6} ${-r * 0.8} ${r * 0.7} ${-r * 0.1} ${r * 0.5} ${r * 0.2}`, t.l, 0.06, 0.55);
    g.restore();
  }
}

// A tapered band along a cubic (x0 y0 … x3 y3), w0 wide at the start and w1 at the end:
// painted as a shape, so a thin thing (the antenna) keeps its body when it is small.
function band([x0, y0, x1, y1, x2, y2, x3, y3], w0, w1, n = 14) {
  const L = [], Rr = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, v = 1 - u;
    const x = v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3, y = v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3;
    const dx = 3 * v * v * (x1 - x0) + 6 * v * u * (x2 - x1) + 3 * u * u * (x3 - x2), dy = 3 * v * v * (y1 - y0) + 6 * v * u * (y2 - y1) + 3 * u * u * (y3 - y2);
    const k = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * u) / 2, nx = -dy / k * w, ny = dx / k * w;
    L.push(`${(x + nx).toFixed(3)} ${(y + ny).toFixed(3)}`); Rr.push(`${(x - nx).toFixed(3)} ${(y - ny).toFixed(3)}`);
  }
  return 'M ' + L.join(' L ') + ' L ' + Rr.reverse().join(' L ') + ' Z';
}

// --- back: the tail of her hair (the menus' still pose; in game it is a chain) --------------
const TAIL = 'M -3.1 -30.0 C -4.3 -30.1 -5.1 -29.0 -5.3 -27.6 C -5.6 -25.8 -6.1 -23.8 -6.9 -21.6 C -6.1 -21.9 -5.4 -23.0 -4.9 -24.3 C -4.3 -25.7 -3.6 -27.1 -2.9 -28.2 Z';
function backFar(g) {
  const H = PAL.hair, B = brush(g);
  B.fill(TAIL, H.m, 0.05);
  B.inside(TAIL, () => {
    B.dab(-4.0, -28.6, 1.2, 1.6, 'rgba(150,112,84,0.45)');
    B.dab(-5.6, -24.6, 1.4, 3.2, 'rgba(0,0,0,0.4)');
    // strands combed down the tail, lighter where the light comes over the head
    B.hairs(170, 23, (i, r) => {
      const u = r(), x = -3.7 - 2.8 * Math.pow(u, 1.3) + (r() - 0.5) * 1.0, y = -29.4 + 7.4 * u;
      const a = Math.atan2(7.4, -3.6 * Math.pow(u + 0.05, 0.3));
      return [x, y, a + (r() - 0.5) * 0.25, 1.0 + r() * 1.6, r() < 0.3 ? 'rgba(160,122,92,0.8)' : r() < 0.6 ? H.d : H.k, 0.06, 0.5];
    });
  });
  // a few hairs loose at the end
  for (const [dx, dy] of [[-0.5, 0.9], [0.2, 1.1], [-0.9, 0.6]]) B.line(`M -6.4 -22.4 q ${dx * 0.4} ${dy * 0.6} ${dx} ${dy}`, H.d, 0.05, 0, 0.6);
}

// --- torso ----------------------------------------------------------------------------------
// the manpack: a steel case in old olive paint, worn to the metal on the
// corners, in a webbing carrier; the battery box under it, the tape antenna
// bent back with its weight, the frequency card taped on the side
const SET = 'M -13.7 -20.6 C -13.7 -21.3 -13.2 -21.8 -12.5 -21.8 L -7.9 -21.8 L -7.6 -11.0 L -12.7 -10.8 C -13.3 -10.8 -13.7 -11.3 -13.7 -11.9 Z';
function radio(g) {
  const R = PAL.radio;
  const ANT = band([-12.2, -22.6, -12.4, -26.6, -13.9, -30.0, -16.9, -32.3], 0.42, 0.3);
  fill(g, ANT, R.d);
  clip(g, ANT, () => stroke(g, 'M -12.02 -22.8 C -12.22 -26.6 -13.66 -29.88 -16.6 -32.1', R.l, 0.14, 0.7));
  fill(g, ell(-17.0, -32.4, 0.24, 0.22), PAL.black.m);
  cel(g, 'M -13.0 -23.3 L -11.4 -23.3 L -11.3 -21.7 L -13.0 -21.7 Z', PAL.black, { sh: 0.2, hl: 0.15, lw: 0.2 });
  // the knobs on the top panel, knurled
  for (const [x, h] of [[-10.6, 0.95], [-8.9, 0.7]]) {
    cel(g, `M ${x - 0.55} -21.7 L ${x + 0.55} -21.7 L ${x + 0.5} ${-21.7 - h} L ${x - 0.5} ${-21.7 - h} Z`, PAL.black, { sh: 0.2, hl: 0.2, lw: 0.18 });
    for (let k = -0.3; k <= 0.31; k += 0.2) stroke(g, `M ${x + k} -21.8 l 0 ${-h + 0.15}`, PAL.black.l, 0.05, 0.55);
  }
  cel(g, SET, R, { sh: 1.3, hl: 0.45 });
  clip(g, SET, () => {
    // the seam to the battery box and its two clamps
    stroke(g, 'M -13.9 -14.4 L -7.6 -14.6', R.k, 0.24);
    stroke(g, 'M -13.9 -14.1 L -7.6 -14.3', R.l, 0.1, 0.45);
    for (const x of [-12.5, -9.7]) cel(g, `M ${x} -15.2 L ${x + 1.1} -15.25 L ${x + 1.1} -13.5 L ${x} -13.45 Z`, PAL.steel, { sh: 0.2, hl: 0.2, lw: 0.16 });
    // the paint worn through to the steel on the corners and edges, scratched
    scuffs(g, [[-13.4, -21.2, 0.5, 0.6], [-8.2, -21.4, 0.4], [-13.4, -11.4, 0.5, -0.4], [-10.6, -18.6, 0.3, 0.2], [-8.0, -16.0, 0.35, 1.2]], PAL.steel.m, 0.45);
    for (let i = 0; i < 6; i++) stroke(g, `M ${-13 + i * 0.9} ${-19.6 + (i % 3) * 1.3} l ${0.5 + (i % 2) * 0.3} ${0.12 - (i % 2) * 0.2}`, R.l, 0.06, 0.55);
    // the stencilled number, flaking
    for (let i = 0; i < 5; i++) fill(g, `M ${-12.7 + i * 0.6} -17.5 l 0.36 0 l 0 0.7 l -0.36 0 Z`, '#cfc8b0', 0.42 - (i % 2) * 0.14);
    // the frequency card, pencilled, its tape gone yellow
    g.save(); g.translate(-10.4, -12.5); g.rotate(-0.05);
    cel(g, 'M -1.7 -1.0 L 1.7 -1.0 L 1.7 1.0 L -1.7 1.0 Z', PAL.paper, { sh: 0.2, hl: 0.1, lw: 0.14, ao: 0.15 });
    for (let i = 0; i < 4; i++) stroke(g, `M -1.4 ${-0.55 + i * 0.4} l ${1.6 + (i % 2) * 0.7} 0`, '#5d5a54', 0.07, 0.8);
    fill(g, 'M -2.0 -1.2 L -0.9 -1.2 L -0.9 -0.7 L -2.0 -0.7 Z', '#cfc3a0', 0.85);
    g.restore();
    grime(g, -16, -10, 'rgba(30,30,22,0.45)');
  });
  // the webbing carrier round it: two straps and a buckle
  for (const y of [-19.6, -12.0]) {
    cel(g, `M -13.95 ${y} L -7.45 ${y - 0.15} L -7.45 ${y + 1.0} L -13.95 ${y + 1.15} Z`, PAL.web, { sh: 0.3, hl: 0.2, lw: 0.2 });
    stitch(g, `M -13.7 ${y + 0.22} L -7.6 ${y + 0.08}`, PAL.web.l, 0.06, 0.55);
  }
  buckle(g, -11.7, -19.75, 0.8, 1.3, PAL.steel);
}

// the field jacket, to the hip, the front closed under its storm flap
const JACKET = blob([
  [-2.2, -23.4], [-5.2, -22.9], [-7.9, -21.4], [-8.9, -18.8], [-8.6, -15.0], [-7.4, -11.2], [-6.6, -7.8], [-6.9, -4.4], [-7.2, -1.0], [-7.0, 1.4],
  [6.1, 1.2], [6.0, -2.0], [5.6, -5.4], [5.5, -9.0], [6.3, -12.8], [7.0, -16.4], [6.7, -19.8], [4.4, -22.6], [1.4, -23.8],
]);
const BELT = 'M -7.0 -7.0 C -1.6 -7.4 2.6 -7.4 5.8 -7.1 L 5.85 -5.3 C 2.6 -5.6 -1.6 -5.6 -7.05 -5.2 Z';
const CHEST_POCKET = 'M 0.9 -17.8 L 4.3 -18.0 L 4.4 -13.4 C 3.2 -13.1 2.0 -13.1 1.0 -13.3 Z';
const CHEST_FLAP = 'M 0.7 -18.5 L 4.5 -18.7 L 4.45 -16.6 C 3.2 -16.2 2.0 -16.2 0.8 -16.5 Z';
const HIP_FLAP = 'M -0.2 -4.6 L 5.0 -4.8 L 5.0 -2.6 C 3.4 -2.2 1.4 -2.2 -0.1 -2.5 Z';
function torso(g) {
  const J = PAL.jacket;
  radio(g);
  cel(g, PELVIS, PAL.pants, { sh: 1.1, hl: 0.4 });
  cel(g, TORSO, PAL.jumper, { sh: 1.0, hl: 0.3, line: false });
  cel(g, JACKET, J, { sh: 2.0, hl: 0.55 });
  // cotton sateen: creases under the arm, the cloth blousing over the belt
  clothFolds(g, JACKET, [[[-7.8, -18.2], [-6.0, -15.6], [-4.4, -12.6]], [[-6.6, -9.8], [-4.6, -8.6], [-2.4, -8.4]], [[1.0, -10.8], [2.6, -9.4], [4.6, -9.0]], [[-2.6, -11.6], [-0.8, -10.0], [0.6, -8.8]], [[-6.4, -2.6], [-4.6, -2.0], [-2.8, -2.4]]], J);
  clip(g, JACKET, () => {
    // the storm flap down the front, its snaps
    fill(g, 'M 4.7 -22.6 C 4.9 -15 4.8 -7 4.9 1.6 L 7.2 1.6 L 7.2 -22.6 Z', J.d, 0.45);
    stroke(g, 'M 4.7 -22.6 C 4.9 -15 4.8 -7 4.9 1.6', J.k, 0.28);
    stitch(g, 'M 5.1 -22.6 C 5.3 -15 5.2 -7 5.3 1.6', J.l, 0.06, 0.55);
    for (const y of [-19.8, -11.6, -2.0]) rivet(g, 5.8, y, 0.24, PAL.steel);
    // the yoke across the back, the side seam, the patch over a tear
    stroke(g, curve([[-8.8, -19.4], [-6.6, -18.6], [-4.4, -19.0]]), J.d, 0.2, 0.8);
    stroke(g, curve([[-5.6, -21.4], [-6.0, -15.0], [-5.6, -9.0], [-5.9, 1.4]]), J.d, 0.3);
    stitch(g, curve([[-5.2, -21.4], [-5.6, -15.0], [-5.2, -9.0], [-5.5, 1.4]]), J.l, 0.06, 0.5);
    cel(g, 'M -4.4 -11.6 L -2.2 -11.8 L -2.1 -9.6 L -4.3 -9.5 Z', PAL.patch, { sh: 0.2, hl: 0.15, lw: 0.16 });
    stitch(g, 'M -4.3 -11.5 L -2.2 -11.7 L -2.15 -9.7 L -4.25 -9.6 Z', J.l, 0.05, 0.6);
    // faded pale where the light and the years have had it: the shoulders, the edges
    fill(g, ell(-1.4, -21.6, 5.4, 2.0), J.l, 0.16);
    fill(g, ell(6.2, -15.0, 1.0, 6.0), J.l, 0.12);
    // the pocket below the belt, its flap and snap
    cel(g, 'M 0.0 -4.4 L 4.9 -4.6 L 5.0 0.8 C 3.4 1.1 1.4 1.1 0.1 0.9 Z', J, { sh: 0.4, hl: 0.25, lw: 0.22, ao: 0.3 });
    cel(g, HIP_FLAP, J, { sh: 0.35, hl: 0.25, lw: 0.22 });
    stitch(g, 'M 0.0 -2.8 C 1.4 -2.5 3.4 -2.5 4.9 -2.9', J.l, 0.06, 0.55);
    rivet(g, 2.4, -2.9, 0.22, PAL.steel);
    grime(g, -4, 1.8, 'rgba(26,26,20,0.45)');
  });
  // the chest pocket: flap, snap, a notebook's spine and a pencil
  cel(g, CHEST_POCKET, J, { sh: 0.45, hl: 0.25, lw: 0.22, ao: 0.3 });
  cel(g, 'M 3.0 -19.6 L 4.0 -19.65 L 4.0 -17.6 L 3.0 -17.55 Z', PAL.paper, { sh: 0.2, hl: 0.15, lw: 0.12 });
  stroke(g, 'M 1.5 -17.6 L 1.3 -20.4', '#a8823a', 0.22); fill(g, 'M 1.18 -20.4 l 0.14 -0.42 l 0.14 0.42 Z', '#2a2420');
  cel(g, CHEST_FLAP, J, { sh: 0.35, hl: 0.25, lw: 0.22 });
  clip(g, CHEST_FLAP, () => stitch(g, 'M 0.85 -16.75 C 2.0 -16.45 3.2 -16.45 4.35 -16.85', J.l, 0.06, 0.55));
  rivet(g, 2.6, -16.8, 0.22, PAL.steel);
  // the web belt over the jacket, cinching it, and its buckle
  cel(g, BELT, PAL.web, { sh: 0.45, hl: 0.22 });
  clip(g, BELT, () => { stitch(g, 'M -7 -6.75 C -1.6 -7.15 2.6 -7.15 5.8 -6.85', PAL.web.l, 0.05, 0.5); for (const x of [-4.6, -0.6]) fill(g, `M ${x} -7.4 L ${x + 0.3} -7.4 L ${x + 0.3} -5.3 L ${x} -5.3 Z`, PAL.web.k, 0.7); });
  cel(g, 'M 3.4 -7.5 L 5.4 -7.55 L 5.45 -5.0 L 3.45 -4.95 Z', PAL.steel, { sh: 0.3, hl: 0.3, lw: 0.2 });
  fill(g, 'M 3.85 -7.0 L 5.0 -7.05 L 5.0 -5.45 L 3.85 -5.4 Z', PAL.web.d);
}

function chest(g) {
  const J = PAL.jacket, W = PAL.web;
  // the jacket's collar standing up behind the neck
  const BACK = blob([[-5.2, -21.4], [-5.5, -24.4], [-4.0, -25.6], [-2.4, -25.4], [-2.2, -22.0]]);
  cel(g, BACK, J, { sh: 0.8, hl: 0.35 });
  stitch(g, 'M -5.0 -24.0 C -4.2 -25.0 -3.2 -25.2 -2.5 -25.0', J.l, 0.06, 0.55);
  // the roll neck folded over on itself round her throat
  const ROLL = blob([[-3.2, -21.8], [-3.4, -24.8], [-2.2, -25.9], [-0.2, -25.9], [1.8, -25.1], [3.2, -24.1], [3.5, -22.0], [0.2, -21.4]]);
  cel(g, ROLL, PAL.jumper, { sh: 0.9, hl: 0.4 });
  clip(g, ROLL, () => {
    for (let x = -3.2; x < 3.6; x += 0.42) stroke(g, `M ${x} -26.2 L ${x + 0.25} -21.6`, PAL.jumper.d, 0.1, 0.5);
    stroke(g, curve([[-3.4, -23.6], [-0.4, -24.4], [3.4, -23.2]]), PAL.jumper.k, 0.22, 0.55);
    stroke(g, curve([[-3.2, -24.0], [-0.4, -24.8], [3.2, -23.6]]), PAL.jumper.l, 0.14, 0.45);
  });
  // the collar's point lying open on the front
  const POINT = blob([[2.6, -22.6], [3.8, -24.0], [5.2, -23.2], [5.8, -21.0], [4.6, -19.8], [3.2, -21.0]]);
  cel(g, POINT, J, { sh: 0.6, hl: 0.35, lw: 0.24 });
  stitch(g, 'M 3.6 -23.4 C 4.6 -22.8 5.2 -21.8 5.4 -20.8', J.l, 0.06, 0.55);
  // the pack's harness: a strap over each shoulder and one across the chest
  const NEAR = 'M -3.4 -23.0 L -1.6 -23.4 C -0.4 -21.0 0.4 -17.0 0.6 -10.0 L -1.0 -9.8 C -1.2 -16.6 -2.0 -20.6 -3.4 -23.0 Z';
  const FAR = 'M 3.0 -22.6 L 4.4 -22.8 C 5.2 -20.0 5.6 -16.0 5.6 -11.0 L 4.4 -10.8 C 4.4 -15.6 4.0 -19.6 3.0 -22.6 Z';
  for (const S of [FAR, NEAR]) {
    cel(g, S, W, { sh: 0.4, hl: 0.25, lw: 0.22 });
    clip(g, S, () => grime(g, -20, -9, 'rgba(30,28,20,0.3)'));
  }
  stitch(g, 'M -2.9 -22.8 C -1.4 -20.4 -0.5 -16.6 -0.3 -10.2', W.l, 0.05, 0.5);
  cel(g, 'M -0.4 -16.9 L 5.0 -16.5 L 5.0 -15.6 L -0.4 -16.0 Z', W, { sh: 0.2, hl: 0.15, lw: 0.18 });
  buckle(g, 2.0, -16.9, 0.7, 1.1, PAL.steel);
  // the handset clipped on the near strap, its cord coiling away under her arm
  coil(g, [0.35, -11.4], [0.2, -8.8], [-4.2, -9.6], 11, 0.4, PAL.black);
  g.save(); g.translate(0.15, -14.0); g.rotate(-0.06);
  const H = 'M -0.6 -2.3 C -0.6 -2.95 0.9 -2.95 0.9 -2.3 L 0.75 -1.6 L 0.62 1.4 L 0.95 1.9 C 1.0 2.55 -0.6 2.65 -0.7 2.0 L -0.5 1.4 L -0.55 -1.6 Z';
  cel(g, H, PAL.black, { sh: 0.6, hl: 0.35 });
  clip(g, H, () => {
    fill(g, ell(0.15, -2.3, 0.5, 0.3), PAL.black.k, 0.8);
    for (let i = 0; i < 3; i++) fill(g, ell(0.0 + i * 0.25, 2.05, 0.06, 0.06), PAL.black.k);
    stroke(g, 'M 0.55 -1.5 L 0.45 1.3', PAL.black.l, 0.08, 0.45);
  });
  cel(g, 'M -0.85 -0.7 L -0.55 -0.7 L -0.55 0.6 L -0.85 0.6 Z', PAL.black, { sh: 0.2, hl: 0.2, lw: 0.12 });
  cel(g, 'M 0.1 -1.3 L 0.55 -1.3 L 0.55 -0.1 L 0.1 -0.1 Z', PAL.steel, { sh: 0.15, hl: 0.2, lw: 0.1 });
  g.restore();
}

// --- arms -----------------------------------------------------------------------------------
function upper(g, ctx) {
  const t = ctx.t, J = t(PAL.jacket);
  cel(g, UPPER, J, { sh: 1.5, hl: 0.45 });
  clothFolds(g, UPPER, [[[-2.2, 7.6], [-0.4, 8.4], [1.8, 7.9]], [[-1.9, 10.2], [0.2, 10.9], [1.9, 10.4]], [[1.2, 2.4], [2.2, 4.4]]], J);
  clip(g, UPPER, () => {
    // the shoulder seam, the seam down the back of the sleeve, the cloth faded on top
    stroke(g, 'M -2.6 1.0 C -1.0 1.6 1.0 1.6 2.6 0.9', J.d, 0.2, 0.7);
    stitch(g, 'M -2.6 1.3 C -1.0 1.9 1.0 1.9 2.6 1.2', J.l, 0.06, 0.5);
    stroke(g, curve([[-2.5, 1.4], [-2.7, 6.0], [-2.2, 11.0]]), J.d, 0.24);
    fill(g, ell(0.2, 0.6, 2.4, 1.6), J.l, 0.16);
  });
  if (!ctx.far) korBand(g, t(PAL.band));
}
function fore(g, ctx) {
  const t = ctx.t, J = t(PAL.jacket), K = t(PAL.jumper);
  cel(g, FORE, J, { sh: 1.3, hl: 0.4 });
  clothFolds(g, FORE, [[[-1.8, 1.6], [0.0, 2.4], [1.9, 2.0]], [[-1.6, 5.0], [0.2, 5.6], [1.7, 5.2]]], J);
  // the cuff closed with its tab, the roll neck's knitted cuff out from under it
  cel(g, blob([[-1.65, 8.8], [1.55, 8.65], [1.5, 10.4], [-1.55, 10.5]]), K, { sh: 0.3, hl: 0.2, lw: 0.2 });
  clip(g, blob([[-1.65, 8.8], [1.55, 8.65], [1.5, 10.4], [-1.55, 10.5]]), () => { for (let x = -1.6; x < 1.6; x += 0.32) stroke(g, `M ${x} 8.6 L ${x + 0.05} 10.6`, K.d, 0.08, 0.5); });
  const CUFF = blob([[-2.0, 7.3], [1.9, 7.1], [1.75, 9.0], [-1.85, 9.2]]);
  cel(g, CUFF, J, { sh: 0.4, hl: 0.3, lw: 0.22 });
  cel(g, 'M -0.2 7.35 L 1.9 7.25 L 2.25 8.1 L 1.85 8.75 L -0.1 8.85 Z', J, { sh: 0.25, hl: 0.25, lw: 0.18 });
  stitch(g, 'M -1.8 8.75 L 1.6 8.55', J.l, 0.05, 0.55);
  if (ctx.far) return;
  // a plain steel watch on a worn leather strap, over the cuff of the jumper
  cel(g, 'M -1.6 9.25 L 1.55 9.15 L 1.55 9.95 L -1.6 10.05 Z', PAL.strap, { sh: 0.2, hl: 0.15, lw: 0.14 });
  cel(g, ell(0.0, 9.6, 0.7, 0.6), PAL.steel, { sh: 0.25, hl: 0.3, lw: 0.14 });
  fill(g, ell(0.0, 9.6, 0.5, 0.42), '#d6cfbc');
  stroke(g, 'M 0 9.6 L 0.05 9.28 M 0 9.6 L 0.3 9.66', '#2a2622', 0.06);
}
function hand(g, ctx) { glove(g, ctx, PAL.wool, { fingerless: PAL.skin }); }

// --- legs: charcoal work trousers, mid-calf boots ----------------------------------------------
function thigh(g, ctx) {
  const t = ctx.t, T = t(PAL.pants);
  cel(g, THIGH, T, { sh: 1.6, hl: 0.45 });
  clothFolds(g, THIGH, [[[-3.0, 12.0], [-1.0, 12.8], [1.6, 12.4]], [[-2.8, 2.4], [-1.2, 3.0], [-0.2, 4.2]], [[1.6, 7.6], [2.4, 9.0]]], T);
  clip(g, THIGH, () => {
    // worn shiny at the knee, the seam down the side
    fill(g, ell(2.2, 14.0, 1.0, 1.4), T.l, 0.1);
    stitch(g, curve([[-3.4, 1.0], [-3.2, 7.0], [-2.4, 14.0]]), T.d, 0.06, 0.55);
  });
  // the cargo pocket on the outside of the thigh: bellows, flap, button
  const POCKET = 'M -2.6 5.0 L 1.4 4.8 L 1.7 10.8 C 0.4 11.2 -1.2 11.2 -2.5 10.9 Z';
  cel(g, POCKET, T, { sh: 0.6, hl: 0.3, lw: 0.22, ao: 0.3 });
  clip(g, POCKET, () => { stroke(g, 'M -0.4 6.2 C -0.5 8.0 -0.4 9.6 -0.3 10.8', T.d, 0.16, 0.7); stitch(g, 'M -2.3 10.6 C -1.0 10.9 0.4 10.9 1.5 10.5', T.l, 0.05, 0.55); grime(g, 8, 12, 'rgba(26,24,20,0.4)'); });
  const FLAP = 'M -2.8 4.5 L 1.6 4.3 L 1.7 6.5 C 0.4 6.9 -1.2 6.9 -2.7 6.6 Z';
  cel(g, FLAP, T, { sh: 0.4, hl: 0.25, lw: 0.2 });
  stitch(g, 'M -2.6 6.3 C -1.2 6.6 0.4 6.6 1.5 6.2', T.l, 0.05, 0.55);
  fill(g, ell(-0.5, 6.25, 0.26, 0.22), T.k);
}
const SHAFT = blob([[-2.95, 6.6], [2.55, 6.3], [2.6, 10.0], [2.65, 15.0], [-2.65, 15.1], [-2.85, 10.4]]);
const BLOUSE = 'M -3.0 5.0 C -1.0 5.6 1.0 5.5 2.7 4.8 L 2.75 6.8 C 1.6 7.4 0.0 7.3 -0.8 7.0 C -1.8 7.4 -2.6 7.3 -3.05 6.9 Z';
function shin(g, ctx) {
  const t = ctx.t, T = t(PAL.pants), B = t(PAL.boot);
  cel(g, SHIN, T, { sh: 1.4, hl: 0.4 });
  clothFolds(g, SHIN, [[[-2.2, 1.4], [0.0, 2.0], [2.2, 1.6]]], T);
  cel(g, SHAFT, B, { sh: 0.8, hl: 0.35 });
  clip(g, SHAFT, () => {
    // the tongue, the laces crossing up the front over their hooks
    fill(g, 'M 1.0 6.4 L 2.8 6.3 L 2.8 15.2 L 1.2 15.2 Z', B.d, 0.6);
    for (let y = 7.0; y < 14.4; y += 1.05) { stroke(g, `M 1.1 ${y} L 2.4 ${y + 0.5} M 2.4 ${y} L 1.1 ${y + 0.5}`, '#2a2016', 0.14); fill(g, ell(1.0, y + 0.25, 0.14, 0.12), PAL.steel.d); }
    // worn pale on the shaft, the stitching, the street's mud low down
    scuffs(g, [[-1.0, 9.4, 0.5, 0.3], [0.2, 12.0, 0.35], [-1.8, 13.4, 0.3]], B.l, 0.35);
    stitch(g, 'M -2.6 7.2 L -2.5 14.6', B.l, 0.05, 0.5);
    grime(g, 11, 16, 'rgba(60,48,34,0.5)');
  });
  // the leather creased at the ankle, the trousers bloused over the top
  clothFolds(g, SHAFT, [[[-2.6, 12.4], [-1.2, 12.9], [0.6, 12.6]], [[-2.4, 13.8], [-0.8, 14.2], [0.8, 14.0]]], B);
  stroke(g, 'M -2.9 6.9 C -1.0 6.5 0.9 6.4 2.55 6.6', B.l, 0.2, 0.65);
  cel(g, BLOUSE, T, { sh: 0.5, hl: 0.25, lw: 0.2 });
  clothFolds(g, BLOUSE, [[[-2.4, 6.4], [-1.4, 6.9]], [[0.2, 6.2], [1.4, 6.6]]], T);
}
function foot(g, ctx) { boot(g, ctx, PAL.boot, PAL.sole, { lace: '#2a2016' }); }

// --- head: a bare face, the hair pulled back, the headset ------------------------------------
const HAIR = 'M 3.75 -8.75 C 3.2 -8.95 2.4 -8.9 1.7 -8.45 C 1.15 -8.05 0.85 -7.3 0.7 -6.5 L -1.6 -5.2 L -1.9 -4.4 C -2.3 -4.0 -2.6 -3.9 -2.9 -3.85 C -3.7 -4.4 -4.2 -5.4 -4.3 -6.8 C -4.3 -8.6 -3.3 -10.0 -1.4 -10.6 C 0.4 -11.0 2.2 -10.6 3.2 -9.6 C 3.5 -9.3 3.7 -9.0 3.75 -8.75 Z';
const UPPER_LIP = 'M 3.55 -3.68 C 3.8 -3.85 4.1 -3.98 4.4 -3.94 L 4.47 -3.88 C 4.46 -3.78 4.44 -3.72 4.42 -3.68 C 4.1 -3.64 3.8 -3.64 3.55 -3.68 Z';
const LOWER_LIP = 'M 3.6 -3.64 C 3.9 -3.62 4.15 -3.62 4.38 -3.66 C 4.36 -3.45 4.28 -3.3 4.2 -3.25 C 3.95 -3.24 3.75 -3.38 3.6 -3.64 Z';
const CUP = ell(-0.65, -6.1, 1.12, 1.38);
// her head: the standard's profile with a smaller chin and the jaw rising
// from it to the throat, not the square jaw under a mask
const HEAD = blob([
  [-3.7, -6.2], [-3.2, -8.8], [-1.0, -10.2], [1.8, -10.1], [3.6, -8.8], [4.05, -7.2],
  [3.85, -6.5], [4.1, -6.05], [4.9, -4.98], [4.35, -4.58],
  [4.42, -3.95], [4.22, -3.35], [4.12, -2.62], [3.55, -2.08],
  [2.4, -2.2], [0.9, -2.75], [-0.6, -3.35], [-2.0, -3.7], [-3.1, -4.6],
]);
// the face painted over the skin: tired under the eyes, the nose and the mouth
function face(g, HD) {
  const B = brush(g);
  B.inside(HD, () => {
    B.dab(3.05, -6.2, 0.8, 0.3, 'rgba(110,70,76,0.18)');
    B.dab(2.6, -5.45, 1.1, 0.55, 'rgba(255,228,204,0.2)', 1, 'source-over', -0.3);
    // the nose: the bridge's edge in the light, the tip, the wing, the shade under it
    B.line('M 4.0 -6.5 C 4.3 -6.0 4.6 -5.5 4.8 -5.1', 'rgba(255,236,216,0.45)', 0.16, 0.08);
    B.dab(4.7, -5.0, 0.22, 0.18, 'rgba(255,240,226,0.5)');
    B.dab(4.05, -4.85, 0.32, 0.22, 'rgba(110,56,40,0.4)');
    B.dab(4.3, -4.55, 0.4, 0.14, 'rgba(70,32,22,0.45)');
    B.line('M 3.85 -4.7 C 3.6 -4.3 3.45 -4.0 3.4 -3.7', 'rgba(110,60,44,0.2)', 0.07, 0.05);
    // the lips: the upper in its own shade, the lower catching the light, the line between
    B.fill(UPPER_LIP, 'rgba(146,82,72,0.75)', 0.05);
    B.fill(LOWER_LIP, 'rgba(172,102,90,0.7)', 0.05);
    B.dab(4.1, -3.42, 0.22, 0.08, 'rgba(255,214,200,0.4)');
    B.line('M 3.5 -3.66 C 3.8 -3.6 4.1 -3.62 4.42 -3.68', 'rgba(60,24,20,0.8)', 0.08, 0.02);
    B.dab(3.5, -3.6, 0.12, 0.1, 'rgba(60,26,20,0.5)');
    B.dab(4.0, -3.0, 0.4, 0.14, 'rgba(90,46,32,0.3)');
    B.dab(4.1, -2.5, 0.35, 0.25, 'rgba(255,226,204,0.2)');
    // warm blood under the skin of the lower cheek and the chin, so the shade there is never grey
    B.dab(2.9, -3.4, 1.5, 1.0, 'rgba(226,150,120,0.2)');
    B.dab(3.7, -2.6, 0.7, 0.45, 'rgba(232,168,136,0.18)');
    B.dab(3.9, -4.15, 0.6, 0.35, 'rgba(232,164,134,0.2)');
  });
}
function head(g) {
  const S = PAL.skin, Hr = PAL.hair, K = PAL.black;
  neck(g, S, { glaze: true, wide: -0.3 });
  // the headset's lead down behind the jaw into the collar
  stroke(g, 'M -1.2 -4.6 C -1.6 -3.0 -1.8 -1.4 -1.6 0.8', K.k, 0.26);
  const HD = HEAD;
  cel(g, HD, S, { sh: 0.9, hl: 0.35 });
  skinGlaze(g, HD); skinDetail(g, HD, { seed: 19 });
  face(g, HD);
  softBrow(g, 2.2, -7.95, 4.15, -7.9, 0.16, '#2b1e17', 41);
  softEye(g, 3.25, -6.95, 1.5, { iris: '#4a3b2c' });
  // the hair pulled back hard to the tail, a few strands come loose at the temple
  softHair(g, HAIR, Hr.m, 'rgba(150,112,84,0.7)', [-1, 0.32], 340, 12);
  const B = brush(g);
  for (const [x, y, dx, dy] of [[2.5, -8.85, -0.25, 1.3], [2.2, -8.75, -0.35, 1.0], [1.9, -8.6, -0.2, 1.15]]) B.line(`M ${x} ${y} q ${dx * 0.2 + 0.2} ${dy * 0.5} ${dx} ${dy}`, Hr.m, 0.04, 0.01, 0.5);
  for (const [x, y] of [[-0.6, -10.8], [1.4, -10.8], [-2.4, -10.2]]) B.line(`M ${x} ${y} q -0.5 -0.35 -1.0 -0.15`, Hr.m, 0.04, 0, 0.6);
  // the elastic at the nape
  fill(g, 'M -4.35 -6.05 C -4.0 -6.3 -3.7 -6.2 -3.65 -5.9 L -3.55 -5.35 C -3.6 -5.05 -3.95 -5.0 -4.2 -5.2 Z', '#1a120e', 0.9);
  // the headset: the band over the crown, the cup on the near ear, the boom to the mouth
  const BAND = 'M -1.0 -7.3 C -1.15 -9.0 -0.8 -10.4 0.25 -11.05 L 0.55 -10.75 C -0.35 -10.1 -0.6 -8.9 -0.5 -7.3 Z';
  cel(g, BAND, K, { sh: 0.3, hl: 0.3, lw: 0.12 });
  cel(g, 'M -1.05 -7.95 L -0.45 -7.95 L -0.45 -7.3 L -1.05 -7.3 Z', PAL.steel, { sh: 0.15, hl: 0.2, lw: 0.08 });
  cel(g, CUP, K, { sh: 0.5, hl: 0.35, lw: 0.22 });
  clip(g, CUP, () => {
    stroke(g, ell(-0.65, -6.1, 0.8, 1.02), K.d, 0.14, 0.8);
    fill(g, ell(-0.95, -6.5, 0.4, 0.5), K.l, 0.22);
    scuffs(g, [[-1.2, -5.2, 0.28, 0.4]], K.l, 0.35);
  });
  rivet(g, -0.65, -6.1, 0.16, PAL.steel);
  const BOOM = 'M 0.3 -5.3 C 1.5 -4.1 2.6 -3.4 3.6 -3.1';
  stroke(g, BOOM, K.k, 0.18);
  stroke(g, 'M 0.4 -5.4 C 1.5 -4.25 2.6 -3.55 3.5 -3.25', K.l, 0.05, 0.5);
  cel(g, ell(3.8, -3.05, 0.34, 0.26), K, { sh: 0.2, hl: 0.2, lw: 0.1 });
  for (let i = 0; i < 4; i++) fill(g, ell(3.66 + (i % 2) * 0.24, -3.13 + (i >> 1) * 0.16, 0.04, 0.04), K.k, 0.8);
}

// The tail of her hair as a chain in game (chars.js): one segment, strands along it.
export function ponySeg(g) {
  const SEG = 'M 0 -1 L 4 -1 A 1 1 0 0 1 4 1 L 0 1 A 1 1 0 0 1 0 -1 Z', H = PAL.hair;
  cel(g, SEG, H, { sh: 0.5, hl: 0.3, line: false, ao: 0.2 });
  clip(g, SEG, () => { for (let i = 0; i < 9; i++) { const y = -0.85 + i * 0.21; stroke(g, `M -1 ${y} C 1 ${y + 0.1} 3 ${y - 0.1} 5 ${y}`, i % 3 ? H.k : 'rgba(160,122,92,0.8)', 0.07, i % 3 ? 0.5 : 0.4); } });
}
export const PONY = {
  // anchored at the nape (torso frame); short, heavy, it hangs and swings
  tails: [{ ax: -3.6, ay: -29.2, len: 7.6, n: 5, w0: 1.5, w1: 0.8, g: 1500 }],
};

export const MORROW = {
  id: 'morrow', name: 'VESPER', role: 'KONTROL', pal: PAL,
  pose: { nUpper: 0.06, nFore: -0.3, nHand: -0.05, fUpper: -0.1, fFore: -0.2, fHand: -0.1, nThigh: 0.12, nShin: 0.02, fThigh: -0.2, fShin: -0.06, head: 0.06 },
  parts: { backFar, torso, chest, head, upper, fore, hand, thigh, shin, foot },
};
