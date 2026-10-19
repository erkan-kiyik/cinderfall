// HAWK — the trader, head and shoulders for his stall (docs/KOR_STORY_
// CINEMATIC.md §9.4, §11). In his sixties: a flat tweed cap pulled low, a
// short grey beard, tired eyes deep under the brow, a heavy wool coat with the
// collar up, an old knitted scarf, a cigarette at the corner of his mouth.
// Painted like a photograph at night: the counter lamp below and to the right
// throws warm light up under the nose, the brow and the cap's peak; the ember
// lights the moustache; the rest of him goes into the dark of the stall.
//
// Soft-brush painting (paint.js) in a 100 × 100 frame, face to the right in a
// three-quarter profile. No outlines: every edge is light against dark.
import { Brush, rnd } from './paint.js';
import { texture } from './tex.js';
import { P } from './kit.js';

// --- the forms (100-unit frame) -------------------------------------------------
const HEAD = 'M 33 33 C 30 38 29.6 47 32.6 55 C 34.6 60 35.6 66 36.6 77 L 64 81 C 63.2 77 63.8 73.4 66 70.4 C 71 69.2 76 68 79 66 C 81 63 81.2 60.2 80.6 58.2 C 80.2 57.2 79.6 56.2 79.6 55.4 C 81.6 55.2 84.6 54.2 85.7 52.4 C 86.1 51.1 85.2 49.6 83.7 48.6 C 81.9 46 80 42 78.2 39.6 C 77.5 38.7 77.9 37.4 78.5 36.2 C 78.3 33 76.7 30 74 27.4 L 40 26 Z';
const EAR = 'M 49 40 C 53 39.4 54.6 43 53.8 47 C 53.2 51 51.2 54.2 48.7 53.5 C 46.6 52.9 46.1 49 46.5 45 C 46.9 42 47.6 40.3 49 40 Z';
// the beard follows the jaw: from the sideburn down the cheek to the corner of the mouth,
// round the chin and back under the jaw to the throat; the cheek above it stays bare
const BEARD = 'M 53.6 44.5 C 52.6 47 52 49.6 52.2 52 C 51.6 54.4 51.6 56.4 52 58 C 52.8 61.6 54 64 55.6 66 C 57.6 69 60 71.2 62 72.6 C 64.6 74.2 67.2 75 70 75.2 C 72.8 75.4 75.4 75 77.6 73.6 C 79.6 72.4 81 71 81.6 69.4 C 82.6 67.6 83 66.2 82.8 64.6 C 82.8 63.2 82.4 62 81.8 61.2 C 80.6 60.6 79.2 60.4 78 60.2 C 77.2 59.8 76.6 59.2 76 58.6 C 74.6 57.2 73.4 56.2 72 55.4 C 70 54.4 68 53.8 66 53.2 C 64 52.6 62 51.6 60 50.2 C 58.4 49 57 47.8 56 46.4 C 55.2 45.4 54.4 44.8 53.6 44.5 Z';
const LIP = 'M 78.4 59.8 C 79.6 59.5 81 59.6 81.9 60.2 C 81.2 61.1 79.8 61.3 78.6 60.8 Z';
const STACHE = 'M 74.6 56.6 C 76.2 55 79.2 54.5 81.8 54.9 C 83.3 55.2 84 56.3 83.5 57.5 C 82.9 58.8 81.8 59.6 80.6 59.8 C 79.2 59.9 77.6 59.7 76.2 59.9 C 75.2 59.3 74.6 58 74.6 56.6 Z';
const CAP = 'M 24 34.4 C 21.6 26 28 15 42 12.2 C 54 10 66 11.4 73.6 16 C 77.2 18.4 80.2 21.4 82.8 24.2 C 85.2 26.4 87.6 27.8 88 29.2 C 87.6 30.5 85.2 30.8 82 30.4 C 78 29.8 74 29.4 70 29.6 C 58 30 44 31.8 33 34.8 C 29.6 35.6 26 35.8 24 34.4 Z';
const PEAK = 'M 66 29.7 C 72 28.4 78 26.6 82.8 24.2 C 85.2 26.4 87.6 27.8 88 29.2 C 87.6 30.5 85.2 30.8 82 30.4 C 78 29.8 72 29.6 66 29.7 Z';
const COAT = 'M -5 106 L -5 86 C 4 80 16 74 30 70.6 C 36 69.2 42 69 46 70 L 64 74 C 72 75 80 77 88 82 C 96 87 102 92 106 96 L 106 106 Z';
const COLLAR_BACK = 'M 27 73 C 28.4 65 34 59.6 40.6 60 C 44 60.4 45.4 63.6 45.6 68 L 46.4 79 L 29 81 Z';
const LAPEL = 'M 61 78 C 66 74.6 72 73.6 76.4 75.4 C 81 77.4 85 82.6 87 89 C 82 94 76 98 70 101 C 67 94 64 86 61 78 Z';
const SCARF = 'M 33.2 70.8 C 37 68.2 42 67.2 47 67.6 C 52 67.8 56 68.8 60 70 C 64 70.6 68 72.2 71.4 74.8 C 74.2 77 75.2 79.6 74.2 82 C 73 84.2 70.4 85.2 67.4 85.6 C 64.6 86.6 61.6 87.4 58.2 87 C 54.6 86.6 51.4 85.6 48 85.8 C 44.2 86 40.4 85 37.2 83 C 34.2 81 32.2 78.4 31.8 75.6 C 31.6 73.6 32.2 72 33.2 70.8 Z';
const SCARF_END = 'M 58 84 C 62 84.4 66 85.6 68.4 88 C 70 92 69.4 98 68 104 L 58.6 104 C 59.6 98 59.4 91 58 84 Z';

// the coat carried on down to the counter, for HAWK standing at his stall
const COAT_BODY = 'M 4 346 C 1 300 -2 250 1 205 C 2 170 -4 130 -2 104 C -1 94 6 86 14 80 C 20 76 26 72 30 70.6 C 36 69.2 42 69 46 70 L 64 74 C 72 75 80 77 88 82 C 96 87 103 94 106 104 C 109 130 104 170 104 205 C 105 250 108 300 110 346 Z';

// Paint the portrait into g, size × size px. t: seconds (the ember breathes, the smoke drifts).
// o.figure: only the man, no stall behind him, no grain or vignette, the coat
// carried down to frame y 346 (the counter) — for the market scene.
export function paintHawk(g, size, t = 0, o = {}) {
  const M0 = g.getTransform(), k = (size / 100) * (Math.hypot(M0.a, M0.b) || 1), B = new Brush(g, k), r = rnd(11);
  g.save();
  g.scale(size / 100, size / 100);
  const glow = 0.65 + 0.35 * Math.sin(t * 1.7), fig = !!o.figure;
  // is (x, y) of this frame inside the path, whatever transform the frame is under
  const inP = (path, x, y) => { const M = g.getTransform(); return g.isPointInPath(path, M.a * x + M.c * y + M.e, M.b * x + M.d * y + M.f); };

  // --- the stall behind him: dark boards, shelves of tins out of focus, the lamp's warmth low right
  if (!fig) {
  const bg = g.createLinearGradient(0, 0, 100, 100);
  bg.addColorStop(0, '#0b0907'); bg.addColorStop(0.6, '#171009'); bg.addColorStop(1, '#2b1a0e');
  g.fillStyle = bg; g.fillRect(0, 0, 100, 100);
  for (const y of [22, 48]) B.fill(`M 0 ${y} L 100 ${y - 1} L 100 ${y + 1.6} L 0 ${y + 2.6} Z`, '#2a1d12', 1.2, 0.8);
  for (let i = 0; i < 9; i++) { const x = 2 + i * 6.4 + r() * 2, y = 15 + (i % 3) * 0.6; B.fill(`M ${x} ${y} L ${x + 4} ${y} L ${x + 4} ${y + 7} L ${x} ${y + 7} Z`, i % 2 ? '#3a2a1a' : '#2c2218', 1.6, 0.7); B.dab(x + 2.6, y + 2, 1.2, 2.6, '#a0703c', 0.25); }
  for (let i = 0; i < 6; i++) { const x = 3 + i * 5.6, y = 40; B.fill(`M ${x} ${y} L ${x + 3.6} ${y} L ${x + 3.6} ${y + 8} L ${x} ${y + 8} Z`, '#2e2014', 1.8, 0.6); }
  B.dab(104, 96, 46, 40, 'rgba(255,160,80,0.55)');
  B.dab(96, 66, 10, 10, `rgba(255,120,50,${0.12 * glow})`);
  }

  // --- the coat: heavy wool, the collar turned up behind the neck
  B.fill(COLLAR_BACK, '#24211d', 0.4);
  B.inside(COLLAR_BACK, () => { B.dab(36, 64, 9, 7, '#3c3730', 0.7); texture(g, 'wool', 0.5, 7); });
  const COATP = fig ? COAT_BODY : COAT;
  B.fill(COATP, '#26231f', 0.3);
  B.inside(COATP, () => {
    texture(g, 'wool', 0.55, 7);
    B.dab(88, 96, 26, 16, 'rgba(176,120,72,0.55)');           // the lamp on the near shoulder
    B.dab(10, 92, 22, 14, 'rgba(70,80,92,0.25)');             // the cold of the street behind
    for (const d of ['M 14 88 C 20 92 24 98 26 106', 'M 40 82 C 44 90 46 98 47 106', 'M 82 86 C 86 92 88 98 88 106']) B.line(d, '#0c0b09', 2.2, 1.6, 0.6);
    for (const d of ['M 16 87 C 22 91 26 97 28 104', 'M 84 85 C 88 91 90 97 90 104']) B.line(d, '#5a4a38', 0.8, 0.8, 0.35);
    if (fig) {
      // the body under the coat, turned as a body is: the far side in the dark, the
      // lamp side warm; the bulb strung over the stall on the shoulders; the street's
      // cold light along his back; the lamp on the counter warming the skirt from below
      const turn = g.createLinearGradient(-4, 0, 112, 0);
      turn.addColorStop(0, 'rgba(0,0,0,0.5)'); turn.addColorStop(0.4, 'rgba(0,0,0,0.12)');
      turn.addColorStop(0.75, 'rgba(150,104,66,0.1)'); turn.addColorStop(1, 'rgba(190,124,70,0.3)');
      g.fillStyle = turn; g.fillRect(-10, 60, 130, 300);
      B.dab(54, 86, 44, 12, 'rgba(176,156,126,0.24)');
      B.dab(104, 330, 30, 90, 'rgba(190,124,70,0.5)');
      B.line('M -1 104 C -4 150 -1 200 1 240 C 0 280 1 310 3 346', 'rgba(104,124,146,0.45)', 2, 1.8);
      // the front edge of the coat under the arms, two buttons, the belt drawn in
      // at the waist and the wool bunching over it, a flap pocket on the hip
      B.line('M 76 200 C 76 250 76 300 77 346', '#0a0908', 2.4, 1.2, 0.85);
      B.line('M 79 200 C 79 250 79 300 80 346', 'rgba(200,140,90,0.3)', 1, 1);
      B.dab(72, 262, 2.2, 2.2, '#1a1612'); B.dab(71.4, 261.4, 0.8, 0.8, 'rgba(220,170,120,0.5)');
      B.line('M 2 216 C 30 226 66 224 106 214', '#0b0a08', 3.4, 1.4, 0.9);
      B.line('M 2 221 C 30 231 66 229 106 219', 'rgba(170,120,76,0.32)', 1.2, 1.2);
      for (const x of [20, 42, 64, 92]) B.line(`M ${x} 202 C ${x + 2} 208 ${x + 1} 214 ${x - 1} 220`, 'rgba(8,6,4,0.45)', 1.4, 1.2);
      B.line('M 82 268 C 90 266 98 265 105 266', 'rgba(6,5,4,0.75)', 2.2, 1.2);
      B.line('M 82 265 C 90 263 98 262 105 263', 'rgba(210,140,84,0.4)', 0.9, 0.8);
      for (const [d, a] of [['M 20 236 C 26 270 24 310 20 346', 0.5], ['M 50 232 C 54 270 56 310 54 346', 0.4], ['M 96 236 C 100 270 102 310 104 346', 0.35]]) B.line(d, `rgba(6,5,4,${a})`, 3, 3);
      for (const d of ['M 24 238 C 30 270 28 310 24 346', 'M 100 236 C 104 270 106 310 108 346']) B.line(d, 'rgba(160,112,72,0.22)', 1.4, 1.6);
      // the arms' shadow on the chest above them and on the belly under them
      B.dab(60, 206, 46, 8, 'rgba(0,0,0,0.5)');
      B.dab(66, 140, 36, 10, 'rgba(0,0,0,0.3)');
    }
  });
  if (fig) {
    // his arms folded across his chest — a man waiting at his own counter. The near
    // arm (his right) down the side, its forearm across over the other; the far
    // hand out on the near arm. Wool sleeves, the bulb on top of every form, the lamp
    // on the counter under them, the cold of the street on the near arm's back edge.
    const sleeve = (d, fn) => { B.fill(d, '#2b2723', 0.35); B.inside(d, () => { texture(g, 'wool', 0.5, 7); fn(); }); };
    const NEAR_UP = 'M -1 104 C -3 128 -2 160 2 184 C 5 196 12 200 20 198 C 28 188 32 156 34 122 C 35 110 34 100 30 94 C 22 88 8 90 -1 104 Z';
    sleeve(NEAR_UP, () => {
      B.dab(20, 92, 16, 10, 'rgba(170,150,120,0.35)');
      B.line('M -2 106 C -4 140 -2 170 2 186', 'rgba(110,130,152,0.5)', 1.8, 1.4);
      B.dab(30, 150, 6, 40, 'rgba(0,0,0,0.45)');
      for (const y of [168, 178]) B.line(`M 2 ${y} C 10 ${y + 4} 20 ${y + 3} 30 ${y - 2}`, 'rgba(6,5,4,0.45)', 1.2, 1);
    });
    const FAR_FORE = 'M 108 158 C 86 154 60 148 34 144 L 32 168 C 58 170 84 176 108 180 Z';
    sleeve(FAR_FORE, () => {
      B.dab(70, 146, 40, 5, 'rgba(176,156,126,0.3)');
      B.dab(70, 172, 40, 6, 'rgba(0,0,0,0.5)');
    });
    // the far hand on the near arm: old skin, mostly in shadow, the bulb on its knuckles
    const HAND = 'M 38 146 C 32 139 22 137 15 141 C 9 146 9 158 13 164 C 19 170 30 170 38 168 Z';
    B.fill(HAND, '#80553e', 0.5);
    B.inside(HAND, () => {
      B.dab(26, 142, 12, 5, 'rgba(236,182,140,0.55)');
      B.dab(22, 166, 14, 6, 'rgba(30,14,8,0.55)');
      for (let i = 0; i < 3; i++) B.line(`M ${31 - i * 6} 145 C ${27 - i * 6} 151 ${21 - i * 5} 158 ${16 - i * 2} 163`, 'rgba(60,28,16,0.3)', 0.7, 0.8);
      for (let i = 0; i < 4; i++) B.dab(31 - i * 5.4, 144 + i * 0.6, 1.6, 1.1, 'rgba(255,214,176,0.4)');
      B.dab(36, 150, 3, 6, 'rgba(236,182,140,0.35)');
      texture(g, 'skin', 0.35, 6);
    });
    B.fill('M 40 144 C 37 150 37 162 39 168 L 34 168 C 33 160 33 150 35 144 Z', '#211e1a', 0.4);
    const NEAR_FORE = 'M 2 184 C 3 198 14 208 30 206 C 54 202 80 192 104 184 L 102 160 C 78 166 52 172 28 176 C 16 178 6 178 2 184 Z';
    sleeve(NEAR_FORE, () => {
      B.dab(60, 166, 50, 6, 'rgba(176,156,126,0.32)');
      B.dab(84, 196, 34, 10, 'rgba(196,128,74,0.42)');
      B.dab(12, 196, 12, 8, 'rgba(0,0,0,0.4)');
      for (const x of [16, 24]) B.line(`M ${x} 178 C ${x + 2} 186 ${x + 1} 196 ${x - 2} 204`, 'rgba(6,5,4,0.5)', 1.2, 1);
      B.line('M 30 205 C 54 201 80 191 104 183', 'rgba(220,150,96,0.35)', 1.2, 1.2);
    });
    const FAR_UP = 'M 88 96 C 98 93 106 99 108 112 C 112 136 114 160 114 182 C 113 193 106 198 99 194 C 95 172 92 140 88 112 Z';
    sleeve(FAR_UP, () => {
      B.dab(100, 100, 10, 8, 'rgba(170,150,120,0.3)');
      B.dab(112, 176, 6, 24, 'rgba(206,136,80,0.45)');
      B.dab(92, 150, 6, 40, 'rgba(0,0,0,0.4)');
    });
  }

  // --- the head and neck: one skin, then the light and the dark laid over it as glazes
  B.fill(HEAD, '#8d5a40', 0.25);
  B.inside(HEAD, () => {
    // the lamp from below right: warm up the front of the face, the jaw and the throat
    B.dab(90, 70, 40, 34, 'rgba(232,160,112,0.75)');
    B.dab(78, 48, 12, 14, 'rgba(226,150,104,0.6)');
    // the dark side: the back of the head, behind the ear, the nape
    B.dab(30, 48, 20, 30, 'rgba(40,22,14,0.85)');
    B.dab(40, 66, 12, 12, 'rgba(36,20,12,0.6)');
    // the cap's shadow across the forehead and temple
    B.fill('M 28 32 C 46 29 60 27.6 77 28 L 79 34.4 C 64 33.6 48 35.6 31 40.6 Z', 'rgba(26,14,8,0.85)', 2.2);
    // a little lamp light bounced up under the peak onto the brow
    B.dab(75.5, 33, 3.4, 1.4, 'rgba(240,170,120,0.45)');
    // the eye socket, deep; the brow ridge catching the light under it
    B.dab(71.5, 40.6, 5.6, 3.8, 'rgba(46,24,14,0.85)');
    B.dab(76, 37, 3.4, 1.1, 'rgba(236,178,136,0.55)', 1, 'source-over', -0.2);
    // the cheekbone in the light, the hollow under it
    B.dab(69, 47.6, 6.4, 3.4, 'rgba(234,168,124,0.6)', 1, 'source-over', -0.25);
    B.dab(63, 51, 6, 3, 'rgba(60,32,20,0.5)');
    // the nose: the bridge's edge, the tip, the wing of the nostril, the warm underside
    B.line('M 78.4 40 C 80.2 43.6 82.6 47.6 84.4 50.8', 'rgba(244,192,150,0.75)', 1.1, 0.7);
    B.dab(84.3, 51.4, 1.8, 1.5, 'rgba(255,214,176,0.7)');
    B.dab(77.6, 46, 1.8, 3.4, 'rgba(70,36,22,0.55)', 1, 'source-over', 0.5);
    B.dab(80.6, 53.4, 1.9, 1.1, 'rgba(60,26,16,0.8)');
    B.dab(83, 54.6, 2.6, 0.9, 'rgba(255,170,110,0.55)');
    // age: lines across the forehead, the crow's feet, blotches on the temple, the red in the nose
    for (const [y, a] of [[30.6, 0.5], [32.2, 0.45]]) { B.line(`M 66 ${y + 0.8} C 70 ${y} 74 ${y - 0.2} 77 ${y + 0.2}`, `rgba(40,20,12,${a})`, 0.35, 0.2); B.line(`M 66 ${y + 1.4} C 70 ${y + 0.6} 74 ${y + 0.4} 77 ${y + 0.8}`, 'rgba(230,160,120,0.25)', 0.3, 0.2); }
    for (const a of [-0.35, 0, 0.4]) B.line(`M 69.6 ${41.6 + a} l -2.6 ${a * 1.8 - 0.2}`, 'rgba(50,24,14,0.5)', 0.22, 0.12);
    for (let i = 0; i < 7; i++) B.dab(58 + r() * 8, 36 + r() * 8, 0.6 + r() * 0.7, 0.5 + r() * 0.5, 'rgba(90,48,30,0.18)');
    B.dab(83, 50, 3, 2.4, 'rgba(180,70,52,0.22)');
    // the neck: the cords under the jaw, the folds of old skin at the throat
    for (const d of ['M 58 70 C 60 73 61 77 61.5 81', 'M 52 66 C 54 70 55 75 55 80']) B.line(d, 'rgba(40,20,12,0.45)', 0.9, 0.6);
    B.line('M 59 70.6 C 60.8 73.4 61.8 77 62.2 81', 'rgba(220,150,110,0.35)', 0.5, 0.4);
    texture(g, 'skin', 0.35, 6);
  });
  // the ear, half in the dark
  B.fill(EAR, '#6e4230', 0.15);
  B.inside(EAR, () => {
    B.dab(52.8, 46, 3, 6, 'rgba(196,118,86,0.55)');
    B.line('M 49.6 42 C 52.2 42 52.8 45.4 52 48.6 C 51.4 50.6 50 51.4 49.2 50.6', 'rgba(34,16,10,0.75)', 0.6, 0.35);
    B.dab(50.2, 46.4, 1.4, 2.4, 'rgba(40,18,10,0.6)');
    B.dab(48, 44, 2.4, 6, 'rgba(30,16,10,0.5)');
  });

  // the back of the neck, turned away from the lamp into the dark of the collar;
  // the creases of the nape; the jaw's shadow across the throat
  B.inside(HEAD, () => {
    B.dab(36.5, 68, 7, 15, 'rgba(18,9,5,0.6)');
    B.dab(46, 77, 11, 5, 'rgba(18,9,5,0.42)');
    B.dab(57, 72.5, 7, 3.2, 'rgba(34,15,8,0.4)');
    for (const y of [60.5, 63.8]) B.line(`M 34.2 ${y} C 38 ${y + 1.4} 42 ${y + 1.4} 46 ${y}`, 'rgba(40,18,10,0.22)', 0.5, 0.6);
    for (const y of [61.3, 64.6]) B.line(`M 35 ${y} C 38.6 ${y + 1.2} 42 ${y + 1.2} 45.4 ${y}`, 'rgba(200,130,96,0.14)', 0.35, 0.3);
  });

  // --- the hair under the cap: cropped short and grey at the temple, over the ear and down the nape
  const HAIR = 'M 30.4 34.6 C 36 33.6 44 33 50.4 33.6 C 54 34 56.6 35.4 57.4 38 C 56 39.4 54.6 39.6 53.4 39.2 C 51.6 38.6 49.6 38.8 48.2 39.8 C 46.6 41.4 46 44 46.2 47 C 46.4 50 47.4 52.4 48.4 54 C 46 56 42 57 37.6 57.6 C 34.6 56.6 32.2 53 31 48 C 30.2 43 30 38 30.4 34.6 Z';
  B.fill(HAIR, '#47423c', 0.6, 0.88);
  B.inside(HAIR, () => { B.dab(54, 37, 5, 3, 'rgba(160,150,138,0.5)'); B.dab(34, 48, 7, 11, 'rgba(14,10,8,0.6)'); B.dab(44, 55, 8, 3, 'rgba(20,14,10,0.45)'); B.dab(40, 50, 9, 6, 'rgba(120,84,64,0.22)'); });
  // cropped short, salt and pepper, combed down and back; the hairs at the edge cross it
  B.hairs(2600, 61, (i, rr) => {
    const x = 30 + rr() * 28, y = 33.4 + rr() * 24.4;
    if (!inP(P(HAIR), x, y)) return null;
    const lit = Math.min(1, Math.max(0, (x - 38) / 18 - (y - 36) / 36)), salt = rr() < 0.45;
    const v = (salt ? 150 : 52) + lit * 70 + (rr() - 0.5) * 30;
    return [x, y, Math.PI / 2 + 0.55 + (rr() - 0.5) * 0.5, 0.35 + rr() * 0.55, `rgba(${v + 4 | 0},${v | 0},${v - 6 | 0},1)`, 0.07, salt ? 0.35 + lit * 0.3 : 0.5];
  });
  // the cropped hair does not stop at a line: short hairs thin out down the nape and
  // round the ear; the cap's brim throws its shadow in a band over all of it
  B.hairs(520, 67, (i, rr) => {
    const x = 31 + rr() * 18, y = 48 + rr() * 13;
    if (inP(P(HAIR), x, y) || !inP(P(HEAD), x, y) || inP(P(EAR), x, y)) return null;
    const v = rr() < 0.5 ? 150 : 60;
    return [x, y, Math.PI / 2 + 0.5 + (rr() - 0.5) * 0.5, 0.3 + rr() * 0.4, `rgba(${v + 4},${v},${v - 6},1)`, 0.06, 0.25 + rr() * 0.2];
  });
  B.fill('M 28 33.4 C 40 32.2 50 32.6 58.6 35.4 L 58 38.4 C 50 35.8 40 35.4 28.4 37.2 Z', 'rgba(8,6,4,0.55)', 1.1);

  // the skin up close: pores and fine blotches on the cheek and temple, the grey shadow
  // of shaved stubble along the cheek above the beard
  B.inside(HEAD, () => {
    const rp = rnd(83);
    for (let i = 0; i < 700; i++) {
      const x = 52 + rp() * 32, y = 30 + rp() * 22;
      B.dab(x, y, 0.1 + rp() * 0.14, 0.08 + rp() * 0.1, rp() < 0.6 ? 'rgba(70,34,22,0.15)' : 'rgba(255,214,180,0.11)');
    }
    B.dab(64, 49.5, 9, 3.2, 'rgba(70,78,88,0.16)', 1, 'source-over', 0.32);
  });
  // stubble on the cheek where the beard thins out toward the cheekbone
  B.hairs(700, 71, (i, rr) => {
    const x = 50 + rr() * 26, y = 45 + rr() * 9;
    if (!inP(P(HEAD), x, y)) return null;
    const fade = Math.min(1, Math.max(0, (y - 45) / 8)), v = 90 + rr() * 90;
    return [x, y, Math.PI / 2 + (rr() - 0.5) * 0.6, 0.25 + rr() * 0.35, `rgba(${v | 0},${v - 4 | 0},${v - 10 | 0},1)`, 0.07, 0.15 + fade * 0.35];
  });

  // --- the scarf: old knitted wool, olive gone brown, two rust stripes
  B.fill(SCARF_END, '#3d3a26', 0.3);
  B.fill(SCARF, '#45422b', 0.3);
  for (const d of [SCARF, SCARF_END]) B.inside(d, () => {
    for (const y of [74, 80]) B.fill(`M 20 ${y} C 40 ${y - 3} 60 ${y - 1} 80 ${y + 3} L 80 ${y + 1.8} C 60 ${y + 1} 40 ${y - 1} 20 ${y + 1.6} Z`, '#6a3420', 0.7, 0.6);
    B.dab(70, 82, 14, 8, 'rgba(190,140,80,0.4)');
    B.dab(36, 76, 10, 8, 'rgba(10,8,6,0.6)');
    texture(g, 'knit', 0.2, 2.6);
    B.line('M 40 75 C 48 78 58 79 68 78', 'rgba(10,8,6,0.5)', 1.6, 1.2);
    // wound round the neck: dark in the crevice against the skin, the roll under it
    // turning toward the lamp, the loose folds where it is tucked into the coat
    B.line('M 34 71 C 44 68.4 56 69.2 67 72.4', 'rgba(8,6,4,0.6)', 1.4, 1);
    B.line('M 36 82.6 C 46 85 58 85.6 70 83.4', 'rgba(8,6,4,0.55)', 1.8, 1.4);
    B.line('M 46 81.4 C 54 82.6 62 82.4 70 80.6', 'rgba(210,160,100,0.28)', 1.2, 1);
    for (const x of [48, 58]) { B.line(`M ${x} 72 C ${x + 1.6} 75 ${x + 1.4} 79 ${x - 0.4} 82`, 'rgba(8,6,4,0.4)', 1.1, 0.9); B.line(`M ${x + 1.4} 72 C ${x + 3} 75 ${x + 2.8} 79 ${x + 1} 82`, 'rgba(200,150,96,0.2)', 0.7, 0.7); }
  });

  // --- the beard: salt and pepper, combed by years. First the mass, lit like any form
  // (dark under the ear and the jaw, pale where the lamp below reaches the chin), then
  // hair by hair along the way it grows: down and forward on the cheek, down off the chin.
  // Its top edge on the cheek is never cut: the hairs thin out toward it.
  const beard = P(BEARD);
  B.fill(BEARD, '#4f4a44', 0.6);
  B.inside(BEARD, () => {
    B.dab(50, 56, 9, 12, 'rgba(18,14,12,0.7)');
    B.dab(62, 71, 10, 5, 'rgba(22,18,14,0.55)');
    B.dab(80, 68, 9, 8, 'rgba(206,192,172,0.6)');
    B.dab(73, 63, 8, 6, 'rgba(160,150,136,0.45)');
    B.dab(64, 54, 8, 3, 'rgba(126,84,62,0.4)');
  });
  const lit = (x, y) => Math.min(1, Math.max(0, (x - 56) / 26 + (y - 60) / 30));
  const grow = (x, y) => Math.PI / 2 - 0.35 + (x - 52) * 0.008 + (y - 55) * 0.01;
  const top = (x) => (x < 76 ? 44.5 + (x - 53.6) * 0.63 : 60);
  const grey = (v, a) => `rgba(${v + 6 | 0},${v + 2 | 0},${v - 5 | 0},${a})`;
  B.hairs(2400, 21, (i, rr) => {
    const x = 51 + rr() * 33, y = 44 + rr() * 32;
    if (!inP(beard, x, y) || rr() > Math.min(1, Math.max(0.12, (y - top(x)) / 3.2))) return null;
    const l = lit(x, y), v = 38 + l * 120 + (rr() - 0.5) * 40;
    return [x, y, grow(x, y) + (rr() - 0.5) * 0.35, 1.0 + rr() * 1.3, grey(Math.min(220, v), 1), 0.1 + rr() * 0.06, 0.35 + rr() * 0.25];
  });
  // the grey in it: silver hairs, more of them where the lamp catches
  B.hairs(1100, 23, (i, rr) => {
    const x = 51 + rr() * 33, y = 44 + rr() * 32;
    if (!inP(beard, x, y)) return null;
    const l = lit(x, y);
    if (rr() > 0.25 + l * 0.75 || rr() > Math.min(1, Math.max(0.1, (y - top(x)) / 3))) return null;
    const v = 118 + l * 120 + (rr() - 0.5) * 30;
    return [x, y, grow(x, y) + (rr() - 0.5) * 0.3, 0.8 + rr() * 1.1, grey(Math.min(246, v), 1), 0.08, 0.18 + l * 0.4];
  });
  // loose hairs past the lower edge, so the beard ends in hair and not in a line
  const EDGE = [[52.4, 58], [55.6, 66], [62, 72.6], [70, 75.2], [77.6, 73.6], [81.6, 69.4], [82.8, 64.6]];
  B.hairs(220, 33, (i, rr) => {
    const u = rr() * (EDGE.length - 1), k = u | 0, f = u - k, [x0, y0] = EDGE[k], [x1, y1] = EDGE[k + 1];
    const x = x0 + (x1 - x0) * f + (rr() - 0.5) * 0.8, y = y0 + (y1 - y0) * f - rr() * 1.4;
    return [x, y, grow(x, y) + (rr() - 0.5) * 0.7, 0.6 + rr() * 1.0, grey(60 + lit(x, y) * 160, 1), 0.08, 0.45];
  });
  // the lower lip under the moustache, where the cigarette sits
  B.fill(LIP, '#6e3528', 0.2);
  B.inside(LIP, () => { B.dab(80.6, 60.2, 1.4, 0.5, 'rgba(236,150,120,0.6)'); B.dab(78.8, 60.6, 0.9, 0.6, 'rgba(30,12,8,0.6)'); });
  // the moustache: the same salt and pepper as the beard, heavy over the lip, yellowed
  // only where forty years of smoke have passed through it at the cigarette
  B.fill(STACHE, '#4d4741', 0.35);
  B.inside(STACHE, () => { B.dab(82, 58.4, 3, 1.8, 'rgba(196,182,156,0.45)'); B.dab(76, 56.4, 2.6, 2, 'rgba(20,16,12,0.6)'); });
  B.hairs(460, 44, (i, rr) => {
    const x = 74.4 + rr() * 9.6, y = 54.4 + rr() * 5.6;
    if (!inP(P(STACHE), x, y)) return null;
    const l = Math.min(1, Math.max(0, (x - 75) / 8)), v = 56 + l * 140 + (rr() - 0.5) * 40;
    const nic = y > 58.2 && x > 79 && rr() < 0.45;
    return [x, y, Math.PI * 0.4 + (rr() - 0.5) * 0.35, 0.7 + rr() * 0.9, nic ? `rgba(${v + 18 | 0},${v + 4 | 0},${v - 40 | 0},1)` : grey(Math.min(236, v), 1), 0.09, 0.5];
  });
  B.dab(81, 58.6, 3, 1.8, `rgba(255,140,60,${0.35 * glow})`, 1, 'screen');

  // --- the eye: small and wet in the dark of the socket, the lid heavy over it
  const EYE = 'M 70.8 41.4 C 72 40.7 73.6 40.5 74.8 41 C 73.8 41.8 72 42 70.8 41.4 Z';
  B.fill(EYE, '#6e5e52', 0.12);
  B.inside(EYE, () => {
    B.dab(73.3, 41.15, 0.95, 0.95, '#22150e');
    B.dab(73.3, 41.15, 0.42, 0.42, '#0a0605');
    B.dab(71.4, 41.2, 1.4, 0.8, 'rgba(40,26,20,0.6)');
    B.fill('M 70 40 L 76 40 L 76 41.1 L 70 41.3 Z', 'rgba(20,10,6,0.55)', 0.25);   // the lid's shadow on the eye
  });
  B.dab(73.8, 41.5, 0.26, 0.18, '#ffd9ae', 0.8);
  B.line('M 70.2 41.2 C 71.6 39.9 73.6 39.7 75.2 40.7', 'rgba(26,12,8,0.9)', 0.6, 0.22);
  B.line('M 70 39.9 C 71.8 38.4 74 38.4 75.8 39.6', 'rgba(220,150,110,0.35)', 0.45, 0.35);
  B.line('M 70.6 42.5 C 72 43.5 74 43.3 75.2 42.3', 'rgba(40,20,12,0.5)', 0.35, 0.4);
  B.line('M 70.8 43.3 C 72.2 44.1 74 44 75 43.2', 'rgba(236,170,128,0.4)', 0.35, 0.4);
  // the brow: grey, thick, wiry, sitting low
  B.fill('M 67.6 37.4 C 70 36 74 35.8 77.4 36.8 L 77 37.8 C 74 37.2 70.4 37.6 67.8 38.6 Z', '#4e4943', 0.6, 0.85);
  B.hairs(110, 55, (i, rr) => {
    const u = rr(), x = 67.8 + u * 9.4, y = 37.6 - Math.sin(u * Math.PI) * 1.2 + (rr() - 0.5) * 0.8;
    const v = 70 + u * 110 + (rr() - 0.5) * 50;
    return [x, y, -0.3 - rr() * 0.4, 0.6 + rr() * 0.7, `rgba(${v | 0},${v - 4 | 0},${v - 10 | 0},1)`, 0.09, 0.6];
  });

  // --- the cap: herringbone tweed, the peak low over the eyes
  B.fill(CAP, '#463d31', 0.25);
  B.inside(CAP, () => {
    // the herringbone, so fine it reads as a texture, not a pattern: soft, uneven,
    // lost in the shadow under the crown
    g.save(); g.strokeStyle = '#1e1912'; g.lineWidth = 0.3;
    const M0 = g.getTransform(); g.filter = `blur(${(0.25 * Math.hypot(M0.a, M0.b)).toFixed(2)}px)`;
    for (let x = 18; x < 92; x += 1.6) for (let y = 8; y < 36; y += 2.4) {
      g.globalAlpha = 0.06 + r() * 0.1;
      g.beginPath(); const s = ((x / 1.6) | 0) % 2 ? 1 : -1; g.moveTo(x + (r() - 0.5) * 0.4, y); g.lineTo(x + 0.8, y + s * 1.1); g.stroke();
    }
    g.restore();
    texture(g, 'wool', 0.6, 7);
    B.dab(46, 14, 22, 8, 'rgba(120,110,96,0.45)');               // the night sky on the crown
    B.dab(24, 28, 6, 8, 'rgba(110,126,140,0.3)');                // a cold rim behind
    B.line('M 30 25 C 44 19 62 18 80 25', 'rgba(16,12,8,0.6)', 0.6, 0.5);  // the panel seam
    B.line('M 30 24.4 C 44 18.4 62 17.4 80 24.4', 'rgba(140,124,100,0.3)', 0.35, 0.3);
  });
  B.inside(PEAK, () => {
    B.fill(PEAK, '#2c251c', 0.8);
    B.line('M 66 30 C 72 30.2 80 30.6 87.6 29.6', `rgba(220,140,80,${0.5 + 0.15 * glow})`, 0.9, 0.5); // the lamp under its edge
  });
  B.line('M 33 34.8 C 44 31.8 58 30 70 29.6', 'rgba(10,6,4,0.7)', 1.0, 0.6);

  // --- the coat's lapel over the scarf, wet-looking wool catching the lamp
  B.fill(LAPEL, '#2a2621', 0.3);
  B.inside(LAPEL, () => { texture(g, 'wool', 0.55, 7); B.dab(82, 90, 10, 12, 'rgba(190,130,80,0.5)'); B.line('M 63 79 C 67 87 69 94 70.6 101', 'rgba(8,6,4,0.7)', 1.4, 0.8); });

  // --- the cigarette at the corner of the mouth, the ember breathing, smoke lifting off it
  g.save(); g.translate(81.2, 59.6); g.rotate(0.19);
  B.fill('M 0 -0.78 L 13.4 -0.78 L 13.4 0.78 L 0 0.78 Z', '#e6dfd0', 0.1);
  B.fill('M 0 -0.78 L 3.4 -0.78 L 3.4 0.78 L 0 0.78 Z', '#b98f58', 0.1);
  B.fill('M 0 0.2 L 13.4 0.2 L 13.4 0.78 L 0 0.78 Z', 'rgba(120,96,70,0.45)', 0.25);
  B.fill('M 12.6 -0.8 L 13.8 -0.8 L 13.8 0.8 L 12.6 0.8 Z', '#8a8680', 0.15);
  B.dab(13.9, 0, 1.0, 0.85, `rgb(255,${120 + 70 * glow},50)`, 1);
  B.dab(13.9, 0, 3.2, 2.6, `rgba(255,120,40,${0.45 * glow})`, 1, 'screen');
  g.restore();
  for (let i = 0; i < (fig ? 0 : 5); i++) {
    const u = (t * 0.12 + i / 5) % 1, x0 = 95, y0 = 62;
    const x1 = x0 - 2 + Math.sin(u * 5 + i) * 3, y1 = y0 - 8 - u * 26, x2 = x1 + Math.sin(u * 7 + i * 2) * 4, y2 = y1 - 10;
    B.line(`M ${x0} ${y0 - 1} C ${x0 + 1} ${y0 - 6} ${x1 - 2} ${y1 + 4} ${x1} ${y1} S ${x2 + 2} ${y2 + 4} ${x2} ${y2}`, `rgba(190,182,172,${0.16 * (1 - u)})`, 0.8 + u * 3, 0.8 + u * 2.4);
  }

  // --- the whole: a cool edge of street light on his back, film grain, the stall's dark round the frame
  if (!fig) {
    B.dab(26, 60, 10, 30, 'rgba(110,130,150,0.12)', 1, 'screen');
    B.grain(0, 0, 100, 100, 0.07);
    const v = g.createRadialGradient(56, 54, 30, 56, 54, 78);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)');
    g.fillStyle = v; g.fillRect(0, 0, 100, 100);
  }
  g.restore();
}

// HAWK standing behind his counter in the market (mission 2), world units:
// cap at y -62, the coat down behind the counter at -16; x0 his left edge.
export const HAWK_STAND = { x: 24.3, y: -63.54, s: 0.14 };
export function paintHawkStanding(g) {
  g.save(); g.translate(HAWK_STAND.x, HAWK_STAND.y); g.scale(HAWK_STAND.s, HAWK_STAND.s);
  paintHawk(g, 100, 1, { figure: true });
  g.restore();
}
// where his cigarette's ember is, in the stall's frame
export const HAWK_EMBER = [HAWK_STAND.x + 95 * HAWK_STAND.s, HAWK_STAND.y + 62.3 * HAWK_STAND.s];
