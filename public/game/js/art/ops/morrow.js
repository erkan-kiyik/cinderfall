// VESPER — control. Thirty-three; six years a signal analyst in Vorsa's
// listening room, until the Söndürme records crossed his desk and he walked
// out with what he knew (docs/KOR_STORY_CINEMATIC.md §9.2). Now the voice on
// the radio. Built from scratch as a man (docs §10.37): lean, a long face with
// a short dark beard kept trimmed, dark hair short at the sides and combed back
// on top, thin rectangular steel glasses, a one-ear headset with its boom at
// the corner of the mouth. A belted waxed-cotton jacket in dark forest green,
// gone pale where the wax has worn off the creases, a brown corduroy collar
// lying flat, brass studs; under it the black roll neck he kept from the
// listening room. The old manpack radio on his back in khaki webbing, the
// handset clipped to the harness on his chest; the document case on the belt.
// Grey work trousers over black leather boots; black leather gloves with the
// fingers cut off for the dials; a plain steel watch. Nothing on him lights up.
// Built on the body standard in body.js.
import { tone, mat, M } from '../style.js';
import { Brush, rnd } from '../paint.js';
import {
  cel, fill, stroke, clip, blob, curve, fold,
  UPPER, FORE, THIGH, SHIN, TORSO, PELVIS,
  glove, boot, korBand, stitch, rivet, buckle, grime, scuffs,
  neck, clothFolds,
} from './body.js';
import { texture } from '../tex.js';
import { SKINS, face, knit, strap, flowHair, beard, shortHair } from './realhead.js';
import { FACES } from './faces.js';

const PAL = {
  wax: mat(tone('#646b54', '#4b5240', '#33382b', '#12150e'), 'canvas', 0.55),
  cord: mat(tone('#8c6c4a', '#6b4f35', '#4a3524', '#1c130b'), 'wool', 0.75),
  brass: mat(tone('#d8b878', '#a8864a', '#76592c', '#33240f'), 'steel', 0.5),
  roll: mat(tone('#4c4e53', '#34363a', '#232428', '#0c0c0e'), 'knit', 0.75),
  pants: mat(tone('#606164', '#46474a', '#2f3032', '#111213'), 'canvas', 0.5),
  web: mat(tone('#aaa07c', '#857c5d', '#5f5942', '#25231a'), 'nylon', 0.6),
  radio: mat(tone('#6b6c56', '#4f503f', '#37382c', '#151610'), 'paint', 0.6),
  black: mat(tone('#4a4c4f', '#313336', '#202124', '#0b0b0c'), 'rubber', 0.45),
  steel: mat(tone('#b4b6b2', '#868984', '#5c5e5a', '#272826'), 'steel', 0.5),
  glove: mat(tone('#4a4643', '#33302e', '#22201e', '#0c0b0a'), 'leather', 0.5),
  strap: mat(tone('#7a5a40', '#5a412d', '#3d2b1e', '#170f0a'), 'leather', 0.6),
  boot: mat(tone('#4c4846', '#343130', '#221f1e', '#0c0b0a'), 'leather', 0.6),
  sole: mat(M.rubber, 'rubber', 0.6),
  band: mat(tone('#4f5156', '#393b3f', '#27292c', '#0f1012'), 'knit', 0.7),
  paper: mat(tone('#efe6cf', '#d8cba9', '#ab9d7c', '#5d553f'), 'paint', 0.3),
  skin: mat(tone('#e0c0ac', '#c6a28c', '#9a7866', '#5c4236'), 'skin', 0.4),
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
// Waxed cotton: where the wax has worn off along the creases and the edges the cloth
// shows pale, in short broken streaks (a waxed jacket's look), and a dull sheen.
function waxWear(g, lines, t, seed = 5) {
  const B = brush(g), r = rnd(seed);
  for (const pts of lines) {
    const d = curve(pts);
    B.line(d, t.l, 0.16, 0.06, 0.45);
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      for (let k = 0; k < 3; k++) { const u = r(), x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; B.dab(x, y, 0.18 + r() * 0.2, 0.06, t.l, 0.5, 'source-over', Math.atan2(y1 - y0, x1 - x0)); }
    }
  }
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

// the waxed jacket, to the hip, belted, the front closed with studs under its flap
const JACKET = blob([
  [-2.2, -23.4], [-5.2, -22.9], [-7.9, -21.4], [-8.8, -18.8], [-8.5, -15.0], [-7.4, -11.4], [-6.8, -8.0], [-7.0, -4.4], [-7.3, -1.0], [-7.1, 1.2],
  [6.2, 1.0], [6.1, -2.0], [5.8, -5.4], [5.6, -9.0], [6.3, -12.8], [6.9, -16.4], [6.6, -19.8], [4.4, -22.6], [1.4, -23.8],
]);
const BELT = 'M -7.0 -8.1 C -1.6 -8.5 2.6 -8.5 5.8 -8.2 L 5.85 -6.6 C 2.6 -6.9 -1.6 -6.9 -7.05 -6.5 Z';
const CHEST_POCKET = 'M 0.9 -18.2 L 4.2 -18.4 L 4.3 -13.8 C 3.2 -13.5 2.0 -13.5 1.0 -13.7 Z';
const CHEST_FLAP = 'M 0.7 -18.9 L 4.45 -19.1 L 4.4 -17.0 C 3.2 -16.6 2.0 -16.6 0.8 -16.9 Z';
const HIP_POCKET = 'M -0.4 -5.2 L 4.8 -5.4 L 4.9 0.4 C 3.2 0.8 1.2 0.8 -0.3 0.5 Z';
const HIP_FLAP = 'M -0.6 -5.9 L 5.0 -6.1 L 5.0 -3.7 C 3.4 -3.3 1.2 -3.3 -0.5 -3.6 Z';
function torso(g) {
  const J = PAL.wax, Br = PAL.brass;
  radio(g);
  cel(g, PELVIS, PAL.pants, { sh: 1.1, hl: 0.4 });
  cel(g, TORSO, PAL.roll, { sh: 1.0, hl: 0.3, line: false });
  cel(g, JACKET, J, { sh: 2.0, hl: 0.55, gloss: 0.12 });
  clothFolds(g, JACKET, [[[-7.8, -18.2], [-6.0, -15.6], [-4.4, -12.6]], [[-6.4, -10.6], [-4.4, -9.6], [-2.2, -9.4]], [[1.2, -11.4], [2.8, -10.0], [4.6, -9.8]], [[-2.8, -12.2], [-1.0, -10.8], [0.4, -9.8]], [[-6.4, -4.6], [-4.4, -4.0], [-2.6, -4.4]], [[-6.2, -1.6], [-4.6, -1.0], [-3.0, -1.4]]], J);
  clip(g, JACKET, () => {
    // the wax worn off the creases and the edges, the sheen across the shoulders
    waxWear(g, [[[-7.4, -18.0], [-5.8, -15.4], [-4.6, -12.8]], [[-6.2, -10.4], [-4.2, -9.4]], [[1.4, -11.2], [3.0, -9.8]], [[-6.0, -4.4], [-4.2, -3.8]], [[5.6, -21.0], [6.4, -17.0], [6.1, -12.0]]], J, 31);
    fill(g, ell(-1.2, -21.4, 5.6, 1.6), J.l, 0.14);
    // the storm flap down the front: its edge, the stitching, the brass studs
    fill(g, 'M 4.7 -22.6 C 4.9 -15 4.8 -7 4.9 1.4 L 7.2 1.4 L 7.2 -22.6 Z', J.d, 0.35);
    stroke(g, 'M 4.7 -22.6 C 4.9 -15 4.8 -7 4.9 1.4', J.k, 0.26);
    stitch(g, 'M 5.1 -22.6 C 5.3 -15 5.2 -7 5.3 1.4', J.l, 0.06, 0.55);
    for (const y of [-20.4, -14.6, -10.4, -3.0]) rivet(g, 5.75, y, 0.26, Br);
    // the yoke across the back, the side seam
    stroke(g, curve([[-8.6, -19.6], [-6.4, -19.0], [-4.2, -19.4]]), J.d, 0.2, 0.8);
    stitch(g, curve([[-8.6, -19.3], [-6.4, -18.7], [-4.2, -19.1]]), J.l, 0.05, 0.45);
    stroke(g, curve([[-5.6, -21.4], [-6.0, -15.0], [-5.6, -9.0], [-5.9, 1.2]]), J.d, 0.28);
    stitch(g, curve([[-5.2, -21.4], [-5.6, -15.0], [-5.2, -9.0], [-5.5, 1.2]]), J.l, 0.05, 0.5);
    // the hip pocket: bellows, the flap and its stud, the wax worn on its edges
    cel(g, HIP_POCKET, J, { sh: 0.5, hl: 0.3, lw: 0.22, ao: 0.3, gloss: 0.08 });
    clip(g, HIP_POCKET, () => { stroke(g, 'M 2.2 -4.4 C 2.1 -2.6 2.2 -1.0 2.3 0.6', J.d, 0.16, 0.7); waxWear(g, [[[-0.2, -4.8], [-0.1, 0.4]], [[4.7, -5.0], [4.8, 0.2]]], J, 33); });
    stitch(g, 'M -0.2 0.2 C 1.2 0.5 3.2 0.5 4.7 0.1', J.l, 0.05, 0.55);
    cel(g, HIP_FLAP, J, { sh: 0.35, hl: 0.25, lw: 0.22 });
    stitch(g, 'M -0.4 -3.9 C 1.2 -3.6 3.4 -3.6 4.9 -4.0', J.l, 0.05, 0.55);
    rivet(g, 2.2, -4.0, 0.22, Br);
    grime(g, -4, 1.6, 'rgba(22,26,16,0.45)');
  });
  // the chest pocket: a notebook's spine and a pencil out of it, the flap, its stud
  cel(g, CHEST_POCKET, J, { sh: 0.45, hl: 0.25, lw: 0.22, ao: 0.3 });
  cel(g, 'M 3.0 -20.0 L 4.0 -20.05 L 4.0 -18.0 L 3.0 -17.95 Z', PAL.paper, { sh: 0.2, hl: 0.15, lw: 0.12 });
  stroke(g, 'M 1.5 -18.0 L 1.3 -20.8', '#a8823a', 0.22); fill(g, 'M 1.18 -20.8 l 0.14 -0.42 l 0.14 0.42 Z', '#2a2420');
  cel(g, CHEST_FLAP, J, { sh: 0.35, hl: 0.25, lw: 0.22 });
  clip(g, CHEST_FLAP, () => { stitch(g, 'M 0.85 -17.15 C 2.0 -16.85 3.2 -16.85 4.3 -17.25', J.l, 0.06, 0.55); waxWear(g, [[[0.8, -17.0], [2.6, -16.7], [4.4, -17.1]]], J, 35); });
  rivet(g, 2.6, -17.2, 0.22, Br);
  // the belt in the same waxed cloth through its loops, the brass buckle
  cel(g, BELT, J, { sh: 0.45, hl: 0.25, gloss: 0.1 });
  clip(g, BELT, () => { stitch(g, 'M -7 -7.85 C -1.6 -8.25 2.6 -8.25 5.8 -7.95', J.l, 0.05, 0.5); stitch(g, 'M -7 -6.85 C -1.6 -7.2 2.6 -7.2 5.8 -6.9', J.l, 0.05, 0.5); });
  for (const x of [-4.6, -0.8]) cel(g, `M ${x} -8.7 L ${x + 0.55} -8.72 L ${x + 0.55} -6.3 L ${x} -6.28 Z`, J, { sh: 0.2, hl: 0.15, lw: 0.14 });
  cel(g, 'M 3.3 -8.75 L 5.3 -8.8 L 5.35 -6.15 L 3.35 -6.1 Z', Br, { sh: 0.3, hl: 0.35, lw: 0.2, gloss: 0.3 });
  fill(g, 'M 3.75 -8.25 L 4.9 -8.3 L 4.9 -6.6 L 3.75 -6.55 Z', J.d);
  stroke(g, 'M 4.3 -8.2 L 4.3 -6.6', Br.m, 0.14);
  records(g);
}
// What he walked out with (docs §10.22): an old leather document case on the
// belt behind the hip, stuffed too full to close, the files' edges showing,
// a red security stamp on the top one (a mark, no lettering: the sprite is
// mirrored), its strap buckled over them.
function records(g) {
  const L = PAL.strap, B = brush(g);
  // the papers standing out of the top, a little fanned
  for (const [x, a, c] of [[-8.6, -0.12, '#e9e1cb'], [-7.6, 0.05, '#d9cfb3'], [-6.6, 0.14, '#efe8d6']]) {
    g.save(); g.translate(x, -7.4); g.rotate(a);
    cel(g, 'M -1.1 -1.6 L 1.1 -1.6 L 1.1 0.6 L -1.1 0.6 Z', tone(c, c, '#a89c7e', '#5d553f'), { sh: 0.15, hl: 0.1, ao: 0.3 });
    for (let i = 0; i < 3; i++) stroke(g, `M -0.8 ${-1.2 + i * 0.4} l ${1.2 + (i % 2) * 0.3} 0`, '#6b6458', 0.06, 0.7);
    g.restore();
  }
  B.fill('M -7.9 -8.6 L -6.9 -8.65 L -6.9 -7.7 L -7.9 -7.65 Z', 'rgba(170,30,30,0.85)', 0.02);
  B.fill('M -7.7 -8.4 L -7.1 -8.42 L -7.1 -7.9 L -7.7 -7.88 Z', '#e9e1cb', 0.01);
  // the case: worn brown leather, its edge stitched, scuffed pale on the corners
  const CASE = 'M -10.0 -7.4 L -5.4 -7.6 L -5.2 -1.2 C -6.6 -0.8 -8.6 -0.8 -9.8 -1.1 Z';
  cel(g, CASE, L, { sh: 0.8, hl: 0.4, gloss: 0.2 });
  clip(g, CASE, () => {
    stitch(g, 'M -9.7 -7.0 L -5.6 -7.2 L -5.45 -1.4', L.l, 0.06, 0.6);
    scuffs(g, [[-9.6, -7.2, 0.4], [-5.5, -1.4, 0.35], [-9.5, -1.4, 0.3]], L.l, 0.6);
    grime(g, -4, -0.8, 'rgba(26,22,16,0.4)');
  });
  // the strap over the top and its buckle
  cel(g, 'M -8.0 -8.4 L -7.2 -8.42 L -7.1 -3.6 L -7.9 -3.58 Z', L, { sh: 0.2, hl: 0.25 });
  buckle(g, -8.05, -4.4, 1.0, 0.9, PAL.steel);
}

function chest(g) {
  const J = PAL.wax, W = PAL.web, C = PAL.cord, B = brush(g);
  // the corduroy collar lying flat round the base of the neck, its point on the chest:
  // brown wales running across it, worn pale on the fold (docs §10.37: low, no lump)
  const CORD = 'M -2.5 -22.6 C -2.5 -23.2 -2.1 -23.65 -1.3 -23.8 C 0.2 -23.95 1.8 -23.65 2.9 -22.95 C 3.4 -22.55 3.75 -21.95 3.9 -21.25 C 3.95 -20.85 3.85 -20.55 3.6 -20.4 C 3.1 -20.95 2.5 -21.5 1.8 -21.85 C 0.6 -22.3 -0.9 -22.4 -2.5 -22.6 Z';
  cel(g, CORD, C, { sh: 0.6, hl: 0.35, lw: 0.2 });
  B.inside(CORD, () => {
    for (let k = 0; k < 9; k++) { const u = k / 8; B.line(`M ${-2.6 + u * 0.3} ${-23.0 + u * 0.1} C ${-0.6 + u * 0.3} ${-23.4 + u * 1.0} ${1.6 + u * 0.4} ${-23.2 + u * 1.2} ${3.9 - u * 0.4} ${-21.6 + u * 1.0}`, C.d, 0.06, 0.02, 0.55); }
    B.line('M -2.3 -23.25 C -0.6 -23.7 1.4 -23.55 2.8 -22.85 C 3.3 -22.5 3.6 -21.95 3.75 -21.3', C.l, 0.12, 0.05, 0.6);
    texture(g, 'wool', 0.35, 0.6);
  });
  // the pack's harness: a strap over each shoulder and one across the chest
  const NEAR = 'M -3.4 -23.0 L -1.6 -23.4 C -0.4 -21.0 0.4 -17.0 0.6 -10.4 L -1.0 -10.2 C -1.2 -16.6 -2.0 -20.6 -3.4 -23.0 Z';
  const FAR = 'M 3.0 -22.4 L 4.4 -22.6 C 5.2 -20.0 5.6 -16.0 5.6 -11.4 L 4.4 -11.2 C 4.4 -15.6 4.0 -19.6 3.0 -22.4 Z';
  for (const S of [FAR, NEAR]) {
    cel(g, S, W, { sh: 0.4, hl: 0.25, lw: 0.22 });
    clip(g, S, () => grime(g, -20, -9, 'rgba(30,28,20,0.3)'));
  }
  stitch(g, 'M -2.9 -22.8 C -1.4 -20.4 -0.5 -16.6 -0.3 -10.6', W.l, 0.05, 0.5);
  cel(g, 'M -0.4 -16.9 L 5.0 -16.5 L 5.0 -15.6 L -0.4 -16.0 Z', W, { sh: 0.2, hl: 0.15, lw: 0.18 });
  buckle(g, 2.0, -16.9, 0.7, 1.1, PAL.steel);
  // the handset clipped on the near strap, its cord coiling away under his arm
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
  const t = ctx.t, J = t(PAL.wax);
  cel(g, UPPER, J, { sh: 1.5, hl: 0.45, gloss: 0.1 });
  clothFolds(g, UPPER, [[[-2.2, 7.6], [-0.4, 8.4], [1.8, 7.9]], [[-1.9, 10.2], [0.2, 10.9], [1.9, 10.4]], [[1.2, 2.4], [2.2, 4.4]]], J);
  clip(g, UPPER, () => {
    // the shoulder seam, the seam down the back of the sleeve, the wax worn at the elbow
    stroke(g, 'M -2.6 1.0 C -1.0 1.6 1.0 1.6 2.6 0.9', J.d, 0.2, 0.7);
    stitch(g, 'M -2.6 1.3 C -1.0 1.9 1.0 1.9 2.6 1.2', J.l, 0.06, 0.5);
    stroke(g, curve([[-2.5, 1.4], [-2.7, 6.0], [-2.2, 11.0]]), J.d, 0.24);
    waxWear(g, [[[-1.9, 9.9], [0.2, 10.6], [1.8, 10.2]], [[-2.0, 7.4], [-0.4, 8.1]]], J, 37);
    fill(g, ell(0.2, 0.6, 2.4, 1.6), J.l, 0.14);
  });
  if (!ctx.far) korBand(g, t(PAL.band));
}
function fore(g, ctx) {
  const t = ctx.t, J = t(PAL.wax), K = t(PAL.roll);
  cel(g, FORE, J, { sh: 1.3, hl: 0.4, gloss: 0.08 });
  clothFolds(g, FORE, [[[-1.8, 1.6], [0.0, 2.4], [1.9, 2.0]], [[-1.6, 5.0], [0.2, 5.6], [1.7, 5.2]]], J);
  clip(g, FORE, () => waxWear(g, [[[-1.6, 1.8], [0.0, 2.5]], [[1.6, 4.0], [1.4, 6.6]]], J, 39));
  // the knitted storm cuff inside the sleeve, the sleeve's own cuff with its strap and stud
  cel(g, blob([[-1.65, 8.8], [1.55, 8.65], [1.5, 10.4], [-1.55, 10.5]]), K, { sh: 0.3, hl: 0.2, lw: 0.2 });
  clip(g, blob([[-1.65, 8.8], [1.55, 8.65], [1.5, 10.4], [-1.55, 10.5]]), () => { for (let x = -1.6; x < 1.6; x += 0.32) stroke(g, `M ${x} 8.6 L ${x + 0.05} 10.6`, K.d, 0.08, 0.5); });
  const CUFF = blob([[-2.0, 7.3], [1.9, 7.1], [1.75, 9.0], [-1.85, 9.2]]);
  cel(g, CUFF, J, { sh: 0.4, hl: 0.3, lw: 0.22 });
  cel(g, 'M -0.2 7.35 L 1.9 7.25 L 2.25 8.1 L 1.85 8.75 L -0.1 8.85 Z', J, { sh: 0.25, hl: 0.25, lw: 0.18 });
  rivet(g, 1.5, 8.05, 0.16, t(PAL.brass));
  stitch(g, 'M -1.8 8.75 L 1.6 8.55', J.l, 0.05, 0.55);
  if (ctx.far) return;
  // a plain steel watch on a worn leather strap, over the knitted cuff
  cel(g, 'M -1.6 9.25 L 1.55 9.15 L 1.55 9.95 L -1.6 10.05 Z', PAL.strap, { sh: 0.2, hl: 0.15, lw: 0.14 });
  cel(g, ell(0.0, 9.6, 0.7, 0.6), PAL.steel, { sh: 0.25, hl: 0.3, lw: 0.14 });
  fill(g, ell(0.0, 9.6, 0.5, 0.42), '#d6cfbc');
  stroke(g, 'M 0 9.6 L 0.05 9.28 M 0 9.6 L 0.3 9.66', '#2a2622', 0.06);
}
function hand(g, ctx) { glove(g, ctx, PAL.glove, { fingerless: PAL.skin }); }

// --- legs: grey work trousers falling straight over black leather boots ------------------------
function thigh(g, ctx) {
  const t = ctx.t, T = t(PAL.pants);
  cel(g, THIGH, T, { sh: 1.6, hl: 0.45 });
  clothFolds(g, THIGH, [[[-3.0, 12.0], [-1.0, 12.8], [1.6, 12.4]], [[-2.8, 2.4], [-1.2, 3.0], [-0.2, 4.2]], [[1.6, 7.6], [2.4, 9.0]]], T);
  clip(g, THIGH, () => {
    // the crease down the front, worn shiny at the knee, the seam down the side
    stroke(g, curve([[2.2, 2.0], [2.5, 8.0], [2.0, 14.6]]), T.l, 0.1, 0.5);
    fill(g, ell(2.2, 14.0, 1.0, 1.4), T.l, 0.1);
    stitch(g, curve([[-3.4, 1.0], [-3.2, 7.0], [-2.4, 14.0]]), T.d, 0.06, 0.55);
    // the slant of the front pocket, a pencil's stub in it
    stroke(g, 'M 1.0 -0.6 C 1.8 0.6 2.6 1.6 3.4 2.2', T.d, 0.18, 0.8);
    stitch(g, 'M 1.3 -0.8 C 2.1 0.4 2.9 1.4 3.6 1.9', T.l, 0.05, 0.55);
    grime(g, 10, 16, 'rgba(26,24,20,0.3)');
  });
}
const SHAFT = blob([[-2.7, 10.6], [2.4, 10.4], [2.5, 12.8], [2.55, 15.0], [-2.6, 15.1], [-2.85, 12.6]]);
const HEM = 'M -5 -2 L 5 -2 L 5 12.9 C 2.4 13.3 -0.6 13.4 -5 13.0 Z';
function shin(g, ctx) {
  const t = ctx.t, T = t(PAL.pants), B = t(PAL.boot);
  // the boot's shaft to above the ankle, laced, under the trouser leg
  cel(g, SHAFT, B, { sh: 0.8, hl: 0.35, gloss: 0.15 });
  clip(g, SHAFT, () => {
    fill(g, 'M 1.0 10.4 L 2.8 10.3 L 2.8 15.2 L 1.2 15.2 Z', B.d, 0.6);
    for (let y = 12.9; y < 14.6; y += 0.85) { stroke(g, `M 1.1 ${y} L 2.4 ${y + 0.45} M 2.4 ${y} L 1.1 ${y + 0.45}`, '#141210', 0.13); fill(g, ell(1.0, y + 0.22, 0.13, 0.11), PAL.steel.d); }
    scuffs(g, [[-1.0, 13.6, 0.4, 0.3], [-1.8, 14.4, 0.3]], B.l, 0.35);
    stitch(g, 'M -2.5 13.0 L -2.4 14.7', B.l, 0.05, 0.45);
  });
  // the trouser leg, falling straight to just over the boot, its hem
  clip(g, HEM, () => {
    cel(g, SHIN, T, { sh: 1.4, hl: 0.4 });
    clothFolds(g, SHIN, [[[-2.2, 1.4], [0.0, 2.0], [2.2, 1.6]], [[-2.3, 11.4], [-0.6, 11.9], [1.4, 11.6]]], T);
    clip(g, SHIN, () => { stroke(g, curve([[2.0, 0.6], [1.9, 6.0], [1.8, 12.6]]), T.l, 0.1, 0.45); grime(g, 9, 13.4, 'rgba(30,28,24,0.35)'); });
  });
  stroke(g, 'M -2.5 12.95 C -0.6 13.3 1.2 13.25 2.35 12.95', T.k, 0.2, 0.8);
}
function foot(g, ctx) { boot(g, ctx, PAL.boot, PAL.sole, { lace: '#141210' }); }

// --- head (docs §10.37): his own face. Thirty-three, nights at the set: pale, a long lean
// face, a high forehead, a long straight nose, thin lips under a short dark beard trimmed
// close and a moustache; grey-green eyes, tired, under straight dark brows; dark hair cut
// short at the sides and back, longer on top and combed back from a parting, a little grey
// at the temple. Thin rectangular steel glasses; a one-ear headset over the hair, its cup
// over the ear, its boom along the beard to the corner of the mouth. The roll neck snug
// round the throat under the beard.
// the hair on top, combed back from the parting, lifted a little at the front
const VTOP = 'M 3.5 -9.25 C 3.84 -9.6 3.92 -10.05 3.64 -10.42 C 3.1 -10.95 1.9 -11.12 0.4 -11.08 C -1.2 -11.0 -2.6 -10.5 -3.4 -9.65 C -3.9 -9.0 -4.1 -8.3 -4.15 -7.55 C -3.6 -7.7 -3.0 -7.95 -2.4 -8.0 C -1.6 -8.3 -0.8 -8.2 0.0 -8.5 C 0.8 -8.55 1.6 -8.75 2.4 -8.75 C 2.9 -8.9 3.25 -9.05 3.5 -9.25 Z';
// the sides and back, short, down to the nape and in front of the ear to the beard
const VSIDE = 'M 3.45 -9.1 C 2.4 -8.95 0.6 -8.75 -1.2 -8.45 C -2.4 -8.2 -3.4 -7.9 -4.15 -7.55 C -4.15 -6.4 -3.9 -5.2 -3.3 -4.3 C -3.0 -3.95 -2.8 -3.8 -2.6 -3.75 C -2.0 -3.95 -1.4 -4.3 -1.0 -4.75 C -0.95 -5.6 -0.9 -6.3 -0.7 -6.75 C -0.2 -6.95 0.4 -6.95 0.78 -6.85 C 0.76 -6.1 0.74 -5.4 0.8 -4.9 C 1.0 -4.95 1.3 -5.05 1.45 -5.15 C 1.42 -5.8 1.44 -6.5 1.56 -7.0 C 1.9 -7.55 2.36 -8.05 2.86 -8.45 C 3.1 -8.7 3.3 -8.9 3.45 -9.1 Z';
// the beard: from the sideburn down the cheek, round the mouth, over the chin and under the jaw
const VBEARD = 'M 0.8 -5.2 C 1.2 -5.3 1.5 -5.15 1.9 -4.95 C 2.5 -4.7 3.0 -4.75 3.4 -4.55 C 3.66 -4.32 3.8 -3.98 3.84 -3.6 C 3.98 -3.32 4.2 -3.2 4.46 -3.18 C 4.58 -2.92 4.66 -2.62 4.66 -2.32 C 4.62 -2.0 4.38 -1.76 3.94 -1.68 C 3.0 -1.56 1.9 -1.74 1.0 -2.14 C 0.4 -2.44 -0.1 -2.86 -0.34 -3.3 C 0.2 -3.6 0.6 -4.2 0.78 -4.6 Z';
const VMOUST = 'M 4.84 -4.22 C 4.92 -4.05 4.88 -3.86 4.72 -3.75 C 4.44 -3.67 4.08 -3.71 3.84 -3.8 C 3.86 -3.98 3.98 -4.12 4.16 -4.2 C 4.38 -4.28 4.62 -4.28 4.84 -4.22 Z';
// the roll neck round the throat (neck frame: it does not bend with the face)
const VROLL = 'M -2.0 -0.9 C -0.9 -1.35 0.9 -1.75 2.3 -1.85 C 2.55 -1.0 2.6 0.3 2.45 1.5 C 1.0 1.85 -0.9 1.85 -2.1 1.5 C -2.2 0.5 -2.15 -0.3 -2.0 -0.9 Z';
// the near lens of the glasses, seen from the side, in front of the eye
const VLENS = 'M 3.24 -6.66 C 3.6 -6.7 3.96 -6.7 4.24 -6.64 C 4.29 -6.38 4.27 -6.06 4.2 -5.84 C 3.92 -5.78 3.56 -5.8 3.3 -5.86 C 3.21 -6.1 3.2 -6.42 3.24 -6.66 Z';
function head(g) {
  const S = SKINS.pale, B = brush(g), K = PAL.black, Kn = PAL.roll;
  neck(g, PAL.skin, { glaze: true });
  const FS = face(g, { paint: FACES.vesper, prof: 'm', s: S, age: 0.32, seed: 51, iris: '#647a70', brow: ['#1c140f', 0.04, 1.1], lips: '166,96,88', shave: 'rgba(40,34,30,0.22)',
    shape: { fore: 0.3, brow: 0.25, nasion: 0.2, nose: 0.35, hump: 0.1, tip: -0.1, wing: -0.2, lips: -0.1, chin: 0.2, long: 0.25, jaw: 0.35, eye: 0.3 } });
  // the roll neck, black, ribbed, its top turned down
  cel(g, VROLL, Kn, { sh: 0.9, hl: 0.4 });
  knit(g, VROLL, Kn, { ribs: true, step: 0.2, lean: 0.06, box: [-2.4, -2.2, 2.8, 2.0] });
  B.inside(VROLL, () => { B.line('M -2.1 -0.2 C -0.8 -0.6 1.0 -0.95 2.5 -1.0', Kn.k, 0.12, 0.05, 0.75); B.line('M -2.1 -0.35 C -0.8 -0.75 1.0 -1.1 2.5 -1.15', Kn.l, 0.08, 0.05, 0.5); });
  // the beard and the moustache, near black, trimmed close: the skin under them at the edges
  const BRD = { col: '34,25,19', lit: 'rgba(118,92,72,1)', dark: 'rgba(8,6,4,0.4)' };
  beard(g, FS.w(VBEARD), { ...BRD, seed: 52, n: 1700, len: 0.12 });
  beard(g, FS.w(VMOUST), { ...BRD, seed: 53, n: 320, len: 0.09, edge: 0.06, a: 0.75, dir: 0.5 });
  // the hair: short at the sides and back, thinning to the skin at the nape and round the
  // ear, a little grey at the temple; the top longer, combed back from the parting
  shortHair(g, VSIDE, { col: '32,24,18', lit: 'rgba(112,90,72,1)', seed: 55, n: 1800, a: Math.PI * 0.82, y0: -8.6, y1: -4.0, fade: [0.9, 0.22], salt: 0.07 });
  B.inside(VSIDE, () => B.line('M 3.5 -9.15 C 2.4 -8.95 0.6 -8.7 -1.2 -8.4 C -2.4 -8.15 -3.4 -7.85 -4.2 -7.5', 'rgba(10,7,5,0.45)', 0.22, 0.12));
  flowHair(g, VTOP, { col: '#17100c', mid: 'rgba(66,48,36,1)', lit: 'rgba(150,122,98,1)', dark: 'rgba(6,4,3,0.5)', seed: 56, n: 170, w: 0.045, wave: 0.035, sheen: [0.1, 0.36],
    a: [[3.7, -10.4], [2.0, -11.2], [-1.0, -11.1], [-3.4, -9.7]], b: [[3.4, -9.2], [2.0, -8.8], [-0.6, -8.4], [-4.1, -7.5]] });
  B.inside(VTOP, () => B.line('M 3.55 -9.3 C 3.2 -9.05 2.6 -8.95 2.0 -8.92', 'rgba(8,5,4,0.6)', 0.08, 0.04));
  // the glasses: the arm back over the ear, the near lens in front of the eye, the bridge
  B.line('M 3.24 -6.55 C 2.4 -6.6 1.4 -6.62 0.5 -6.6', PAL.steel.d, 0.07, 0.01);
  B.line('M 3.24 -6.6 C 2.4 -6.65 1.4 -6.67 0.5 -6.65', PAL.steel.l, 0.025, 0.01, 0.6);
  B.fill(VLENS, 'rgba(196,212,224,0.12)', 0.01);
  B.inside(VLENS, () => { B.fill('M 3.5 -6.8 L 3.7 -6.8 L 3.42 -5.7 L 3.22 -5.7 Z', 'rgba(255,255,255,0.22)', 0.03); B.dab(4.05, -5.95, 0.18, 0.06, 'rgba(255,190,130,0.35)'); });
  B.line(VLENS, '#2c2d30', 0.06, 0.005); B.line(VLENS, PAL.steel.l, 0.022, 0.005, 0.6);
  B.line('M 4.24 -6.5 C 4.32 -6.52 4.4 -6.5 4.46 -6.44', '#2c2d30', 0.05, 0.005);
  // the headset: the band over the hair from the crown down to the cup over the ear
  strap(g, 'M -0.32 -6.2 C -0.46 -7.8 -0.42 -9.8 -0.2 -11.15', 0.2, K.m, K.k, K.l);
  cel(g, 'M -0.56 -6.75 L -0.02 -6.75 L -0.06 -6.2 L -0.52 -6.2 Z', K, { sh: 0.2, hl: 0.3 });
  const CUP = ell(-0.12, -5.45, 0.7, 0.86);
  cel(g, ell(-0.24, -5.45, 0.72, 0.9), mat(tone('#4a4c50', '#34363a', '#222326', '#0c0c0e'), 'leather', 0.4), { sh: 0.4, hl: 0.3 });
  cel(g, CUP, K, { sh: 0.5, hl: 0.45, gloss: 0.25 });
  B.inside(CUP, () => { B.line(ell(-0.12, -5.45, 0.54, 0.7), K.d, 0.08, 0.04); B.dab(-0.36, -5.85, 0.26, 0.36, 'rgba(160,166,176,0.25)'); });
  fill(g, ell(-0.12, -5.45, 0.12, 0.12), PAL.steel.d);
  // the boom along the beard, its capsule by the corner of the mouth
  B.line(FS.w('M 0.5 -5.0 C 1.5 -4.4 2.5 -3.9 3.35 -3.62'), K.k, 0.1, 0.01);
  B.line(FS.w('M 0.5 -5.06 C 1.5 -4.46 2.5 -3.96 3.35 -3.68'), K.l, 0.03, 0.01, 0.5);
  const [mx, my] = FS.W(3.55, -3.58);
  cel(g, ell(mx, my, 0.2, 0.16), K, { sh: 0.2, hl: 0.25 });
  for (const [dx, dy] of [[-0.06, -0.04], [0.05, -0.02], [-0.02, 0.05], [0.08, 0.05]]) B.dab(mx + dx, my + dy, 0.02, 0.02, 'rgba(120,126,136,0.6)');
}

export const MORROW = {
  id: 'morrow', name: 'VESPER', role: 'KONTROL', pal: PAL,
  pose: { nUpper: 0.06, nFore: -0.3, nHand: -0.05, fUpper: -0.1, fFore: -0.2, fHand: -0.1, nThigh: 0.12, nShin: 0.02, fThigh: -0.2, fShin: -0.06, head: 0.04 },
  parts: { torso, chest, head, upper, fore, hand, thigh, shin, foot },
};
