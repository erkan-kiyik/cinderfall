// HAWK — the trader, head and shoulders for his stall (docs/KOR_STORY_
// CINEMATIC.md §9.4, painted per §10.1). In his sixties: a flat tweed cap, a
// short grey beard, tired eyes under heavy lids, a thick wool coat with the
// collar up, an old wool scarf, a cigarette in his lips; lit warm from below
// and the right by the lamp on his counter, the stall dark behind him.
import { cel, fill, stroke, clip, blob, curve, setRoot } from './kit.js';
import { tone, mat } from './style.js';
import { headShape, stitch, grime } from './ops/body.js';

const P = {
  skin: mat(tone('#e2ab84', '#bb8460', '#8a5a3e', '#4a2c1c'), 'skin', 0.55),
  beard: mat(tone('#d6d2ca', '#a8a39b', '#77736c', '#3a3835'), 'wool', 0.8),
  cap: mat(tone('#8a7a62', '#655844', '#463d2f', '#1f1a13'), 'wool', 0.9),
  coat: mat(tone('#5e5a50', '#433f37', '#2d2a25', '#12110e'), 'wool', 0.85),
  scarf: mat(tone('#7d7a52', '#5c5a3a', '#3f3e27', '#1a1a10'), 'knit', 0.7),
  shirt: mat(tone('#c9bfa7', '#a69c84', '#7a725f', '#3a362c'), 'canvas', 0.4),
};
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

// Paint the portrait into g, size × size px. t: seconds (the ember breathes, the smoke drifts).
export function paintHawk(g, size, t = 0) {
  g.save();
  // the stall behind him: dark boards, the lamp's warm pool on the right
  const bg = g.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#0e0b09'); bg.addColorStop(1, '#2a1a10');
  g.fillStyle = bg; g.fillRect(0, 0, size, size);
  for (let i = 0; i < 7; i++) { g.fillStyle = `rgba(0,0,0,${0.12 + (i % 2) * 0.08})`; g.fillRect(0, (i / 7) * size, size, size / 70); }
  const lamp = g.createRadialGradient(size * 1.05, size * 0.95, 0, size * 1.05, size * 0.95, size * 0.95);
  lamp.addColorStop(0, 'rgba(255,170,90,0.55)'); lamp.addColorStop(0.5, 'rgba(200,100,40,0.18)'); lamp.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = lamp; g.fillRect(0, 0, size, size);
  // the figure in head units: the head about a third of the frame, facing right
  const z = size / 19.5;
  g.translate(size * 0.42, size * 0.7); g.scale(z, z);
  setRoot(g);
  // the coat's shoulders and collar
  const COAT = blob([[-10, 12], [-9.6, 4.0], [-7.4, 0.4], [-3.4, -0.8], [2.6, -0.4], [6.6, 1.2], [9.2, 4.6], [10, 12]]);
  cel(g, COAT, P.coat, { sh: 2.6, hl: 0.7 });
  clip(g, COAT, () => {
    // herringbone, a lapel, a missing button's threads
    for (let x = -10; x < 10; x += 0.9) stroke(g, `M ${x} 0 l 0.45 12`, P.coat.d, 0.12, 0.35);
    stroke(g, curve([[3.4, 1.0], [2.6, 5.0], [3.6, 12.0]]), P.coat.k, 0.3);
    stitch(g, curve([[3.0, 1.2], [2.2, 5.0], [3.2, 12.0]]), P.coat.l, 0.08, 0.5);
    stroke(g, 'M 5.0 7.6 l 0.3 0.4 M 5.3 7.6 l -0.2 0.5', '#c9bfa7', 0.06, 0.8);
  });
  // the head (head frame: origin at the neck base)
  g.save(); g.translate(0.6, -0.9);
  cel(g, 'M -2.0 1.3 L 2.4 1.1 L 2.3 -2.6 L 0.6 -3.8 L -2.1 -4.6 Z', P.skin, { sh: 1.2, hl: 0.25 });
  const HD = headShape({ jaw: 1 });
  cel(g, HD, P.skin, { sh: 1.4, hl: 0.5 });
  clip(g, HD, () => {
    // weather: lines on the forehead, at the eye, down from the nose; a broken vein
    for (const y of [-9.2, -8.7]) stroke(g, `M 1.6 ${y} C 2.4 ${y - 0.2} 3.2 ${y - 0.2} 3.8 ${y + 0.05}`, P.skin.d, 0.08, 0.7);
    for (const a of [-0.3, 0, 0.3]) stroke(g, `M 1.7 ${-6.6 + a} l -0.7 ${a * 0.6}`, P.skin.d, 0.07, 0.8);
    stroke(g, 'M 4.4 -4.8 C 3.9 -4.0 3.7 -3.4 3.8 -2.8', P.skin.d, 0.1, 0.8);
    fill(g, ell(4.6, -4.8, 0.4, 0.25), '#c46a5a', 0.3);
    // the ear and its shadow
    cel(g, 'M -1.6 -7.4 C -0.7 -7.8 -0.1 -6.9 -0.2 -6.0 C -0.3 -5.2 -1.1 -4.9 -1.7 -5.5 Z', P.skin, { sh: 0.5, hl: 0.2, line: false, ao: 0.6 });
    stroke(g, 'M -1.2 -7.0 C -0.6 -6.9 -0.6 -6.0 -1.0 -5.8', P.skin.d, 0.12, 0.7);
  });
  // the beard: short and grey, along the jaw and up to the ear, the moustache yellowed by smoke
  const BEARD = 'M -0.6 -5.6 C 0.2 -4.4 1.6 -4.2 2.6 -4.6 C 3.4 -4.0 4.4 -3.8 5.0 -3.9 C 5.0 -3.0 4.8 -2.0 4.2 -1.4 C 3.2 -0.8 1.6 -0.9 0.4 -1.6 C -0.6 -2.4 -1.2 -3.6 -1.2 -4.8 Z';
  cel(g, BEARD, P.beard, { sh: 0.9, hl: 0.4, line: false, ao: 0.25 });
  clip(g, BEARD, () => { for (let k = 0; k < 70; k++) { const x = -1 + ((k * 37) % 62) / 10, y = -5.4 + ((k * 53) % 46) / 10; stroke(g, `M ${x} ${y} l 0.12 0.3`, k % 3 ? P.beard.d : P.beard.l, 0.06, 0.8); } });
  // the beard's edge: loose hairs instead of a line
  for (let k = 0; k < 28; k++) { const u = k / 27, x = -1.0 + u * 6.0, y = -4.8 + Math.sin(u * Math.PI) * 3.6; stroke(g, `M ${x} ${y} l ${0.1 - u * 0.2} 0.35`, P.beard.m, 0.07, 0.8); }
  cel(g, 'M 3.4 -4.0 C 4.0 -4.35 4.9 -4.25 5.3 -3.8 C 5.1 -3.45 4.4 -3.4 3.7 -3.5 Z', mat(tone('#d6cdb6', '#ada38b', '#7d755f', '#3a3628'), 'wool', 0.7), { sh: 0.3, hl: 0.2, line: false });
  // the tired eye: heavy upper lid, a bag under it, the iris dark brown; a bushy grey brow
  fill(g, 'M 2.9 -6.85 C 3.3 -7.15 3.9 -7.2 4.3 -6.95 C 4.0 -6.7 3.4 -6.65 2.9 -6.85 Z', '#ece6dc');
  fill(g, ell(3.85, -6.92, 0.2, 0.18), '#3a2a20');
  fill(g, 'M 2.85 -6.9 C 3.3 -7.35 3.9 -7.4 4.35 -7.0 L 4.3 -6.85 C 3.9 -7.15 3.3 -7.1 2.9 -6.8 Z', P.skin.d);
  stroke(g, 'M 3.0 -6.45 C 3.4 -6.25 3.9 -6.25 4.25 -6.45', P.skin.d, 0.1, 0.8);
  const BROW = 'M 2.4 -8.0 C 3.2 -8.35 4.1 -8.3 4.7 -7.85 L 4.6 -7.55 C 4.0 -7.9 3.2 -7.95 2.5 -7.65 Z';
  cel(g, BROW, P.beard, { sh: 0.2, hl: 0.15, lw: 0.12 });
  for (let i = 0; i < 6; i++) stroke(g, `M ${2.6 + i * 0.35} -7.8 l 0.2 -0.3`, P.beard.l, 0.05, 0.9);
  // the cigarette, the ember breathing, smoke curling up past the cap
  g.save(); g.translate(4.7, -3.0); g.rotate(0.18);
  fill(g, 'M 0 -0.18 L 2.2 -0.18 L 2.2 0.18 L 0 0.18 Z', '#efe9de');
  fill(g, 'M 0 -0.18 L 0.6 -0.18 L 0.6 0.18 L 0 0.18 Z', '#c99a5a');
  const glow = 0.6 + 0.4 * Math.sin(t * 1.7);
  g.shadowColor = `rgba(255,120,40,${glow})`; g.shadowBlur = 0.6 * z;
  fill(g, 'M 2.2 -0.18 L 2.5 -0.16 L 2.5 0.16 L 2.2 0.18 Z', `rgb(255,${110 + glow * 60},40)`);
  g.restore();
  for (let i = 0; i < 3; i++) {
    const u = (t * 0.25 + i / 3) % 1, x = 7.4 + Math.sin(u * 6 + i) * 0.6, y = -3.2 - u * 9;
    stroke(g, `M ${x} ${y} q 0.6 -0.8 0 -1.6 q -0.6 -0.8 0 -1.6`, `rgba(200,190,180,${0.25 * (1 - u)})`, 0.3 + u * 0.5);
  }
  // the flat cap, its peak pulled low
  const CAP = 'M -4.6 -7.4 C -4.8 -9.8 -2.8 -11.6 0.6 -11.8 C 3.8 -12.0 6.0 -10.8 6.6 -9.2 C 7.2 -8.6 7.0 -8.0 6.2 -7.9 L 3.2 -8.2 C 1.0 -8.4 -1.8 -8.0 -4.6 -7.4 Z';
  cel(g, CAP, P.cap, { sh: 1.4, hl: 0.5 });
  clip(g, CAP, () => {
    stroke(g, curve([[-3.6, -9.6], [0.4, -11.2], [4.6, -10.6], [6.4, -9.0]]), P.cap.d, 0.14, 0.7);
    stitch(g, 'M 2.8 -8.6 C 4.2 -8.8 5.6 -8.6 6.6 -8.2', P.cap.l, 0.06, 0.6);
    grime(g, -10, -7.4, 'rgba(30,20,10,0.35)');
  });
  g.restore();
  g.save(); g.translate(0, 1.5);
  const COLLAR = blob([[-6.8, 1.4], [-6.2, -2.4], [-3.4, -3.4], [0.6, -3.0], [3.2, -1.8], [3.4, 1.0], [-1.6, 1.8]]);
  cel(g, COLLAR, P.coat, { sh: 1.2, hl: 0.5 });
  // the scarf wound once, its end tucked in
  const SC = blob([[-4.8, -1.2], [-3.6, -3.4], [0.2, -3.8], [3.4, -2.8], [4.2, -0.8], [2.6, 0.8], [-1.4, 0.8], [-4.2, 0.4]]);
  cel(g, SC, P.scarf, { sh: 1.0, hl: 0.4 });
  clip(g, SC, () => { for (let x = -5; x < 5; x += 1.1) stroke(g, `M ${x} -4 l 0 5`, P.scarf.d, 0.16, 0.6); for (let y = -3.4; y < 1; y += 1.1) stroke(g, `M -5 ${y} l 10 0`, '#8f4a32', 0.1, 0.55); });
  g.restore();
  g.restore();
  // the lamp light catching his right side, a rim on the shoulder
  const rim = g.createLinearGradient(size * 0.55, 0, size, 0);
  rim.addColorStop(0, 'rgba(255,150,70,0)'); rim.addColorStop(1, 'rgba(255,150,70,0.18)');
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = rim; g.fillRect(0, 0, size, size); g.restore();
  // a vignette
  const v = g.createRadialGradient(size * 0.5, size * 0.5, size * 0.3, size * 0.5, size * 0.5, size * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = v; g.fillRect(0, 0, size, size);
}
