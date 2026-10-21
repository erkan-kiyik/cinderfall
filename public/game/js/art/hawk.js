// HAWK — the trader, head and shoulders for the trader screen (docs/KOR_STORY_
// CINEMATIC.md §9.4, §10.14). In his sixties: a flat tweed cap pulled low, a
// hooked nose (the name he trades under), deep-set tired eyes under a heavy
// brow, a close-cropped grey beard along the jaw, an old knitted scarf, a
// heavy wool coat with the collar up, a cigarette at the corner of his mouth.
// Painted like a photograph at night: the bare bulb over the stall above and
// in front of him lights the brow, the cheekbone, the bridge of the nose and
// the chin, the cap's peak throws its shadow over the forehead and into the
// eye; the counter lamp warms him a little from below, the ember lights the
// moustache, the street's cold light finds the back of his neck and his ear.
//
// Soft-brush painting (paint.js) in a 100 × 100 frame, face to the right in
// profile. The face is built the way a painter builds one: the planes first
// (forehead, brow, cheekbone, the hollow under it, nose, upper lip, chin, the
// side of the face turning away), then the colour of old skin in its zones
// (red in the nose, the cheek and the ear, yellow in the forehead), then the
// eye, the ear, the folds and the beard. No outlines: every edge is light
// against dark.
import { Brush, rnd } from './paint.js';
import { texture } from './tex.js';
import { P } from './kit.js';

// --- the forms (100-unit frame) -------------------------------------------------
// the profile from under the cap: forehead, brow ridge, the notch at the root of
// the nose, a bridge with a hump, the tip turned down, lips, chin, under the jaw,
// the throat with its Adam's apple; behind: the skull, the nape, the neck
const HEAD = 'M 31 33 C 29.4 40 29.6 48 32 55 C 34 60 35.4 66 36.6 77 L 37 84 L 65.8 84 C 65.6 80 65.8 78 66.5 76.6 C 66.1 75.2 65.6 73.6 66.2 72.2 C 69 71.2 73.6 70.4 77.4 69.4 C 79.4 68.6 80.8 67 81 65 C 81.2 63.4 80.6 62.2 79.8 61.6 C 80.4 60.8 81 60.2 81 59.4 C 80.8 58.8 80.6 58.4 80.4 58.2 C 80.9 57.6 81.2 56.8 81 55.6 C 80.9 54.9 81.1 54.4 81.8 54.1 C 82.8 54.2 84.2 54.3 84.8 53.5 C 85.4 52.5 85.5 51 85 49.9 C 84.2 48.8 83.2 47.8 82.8 46.9 C 82.7 45.9 82.6 45 82.2 44.3 C 81.6 43 80.4 41.8 79.3 40.9 C 78.6 40.4 78.1 40 78.2 39.4 C 78.6 38.6 79.4 37.8 79.4 36.6 C 79.2 34.2 78.2 31.6 77 29.4 L 40 26 Z';
// the ear, tilted back as ears are: the helix round the back and top, the lobe
// at the front of its foot
const EAR = 'M 50.8 38.4 C 53.8 38.2 55.1 41.4 54.7 44.8 C 54.4 47.4 53.4 49.2 52.8 51 C 52.4 53.4 51.2 55.1 49.5 54.9 C 47.6 54.7 46.9 52.4 47 50.2 C 46.6 47.6 46.2 44.4 46.6 41.8 C 47 39.7 48.7 38.5 50.8 38.4 Z';
// the beard is kept short and follows the jaw: from the sideburn in front of the
// ear down the lower cheek to the corner of the mouth, round the chin, back under
// the jaw to the throat; the upper cheek stays bare
const BEARD = 'M 53.4 44.2 C 54.6 44.4 55.4 45.4 56.6 46.8 C 60 49.6 66 52.6 72 54.8 C 74.6 55.8 76.6 56.8 77.8 58.2 C 78.6 59.4 79.6 60.4 80.2 61.4 C 81.5 63 81.9 65.6 80.9 67.9 C 79.6 69.9 77 70.9 73.6 71.7 C 70.4 72.4 67.8 73.4 66.2 73.8 C 63.6 73.2 60 70.4 56.4 66 C 53.4 62.2 51.8 58.6 51.6 55.6 C 51.6 52.6 52.4 47.6 53.4 44.2 Z';
const LIP = 'M 78.4 58.6 C 79.6 58.4 80.6 58.6 81.1 59.2 C 80.9 60.2 80 60.8 78.8 60.6 C 78.2 60.2 78 59.2 78.4 58.6 Z';
// the moustache, heavy, over the upper lip and a little past it
const STACHE = 'M 76.8 56.2 C 77.8 55 79.6 54.4 81.4 54.5 C 82.4 54.6 82.9 55.3 82.8 56.2 C 82.7 57.2 82.2 58.2 81.2 58.8 C 80 59.2 78.8 59.1 77.8 58.9 C 77 58.7 76.5 58.4 76.4 57.8 C 76.3 57.2 76.4 56.6 76.8 56.2 Z';
const CAP = 'M 24 34.4 C 21.6 26 28 15 42 12.2 C 54 10 66 11.4 73.6 16 C 77.2 18.4 80.2 21.4 82.8 24.2 C 85.2 26.4 87.6 27.8 88 29.2 C 87.6 30.5 85.2 30.8 82 30.4 C 78 29.8 74 29.4 70 29.6 C 58 30 44 31.8 33 34.8 C 29.6 35.6 26 35.8 24 34.4 Z';
const PEAK = 'M 66 29.7 C 72 28.4 78 26.6 82.8 24.2 C 85.2 26.4 87.6 27.8 88 29.2 C 87.6 30.5 85.2 30.8 82 30.4 C 78 29.8 72 29.6 66 29.7 Z';
const COAT = 'M -5 106 L -5 86 C 4 80 16 74 30 70.6 C 36 69.2 42 69 46 70 L 64 74 C 72 75 80 77 88 82 C 96 87 102 92 106 96 L 106 106 Z';
const COLLAR_BACK = 'M 27 73 C 28.4 65 34 59.6 40.6 60 C 44 60.4 45.4 63.6 45.6 68 L 46.4 79 L 29 81 Z';
const LAPEL = 'M 61 78 C 66 74.6 72 73.6 76.4 75.4 C 81 77.4 85 82.6 87 89 C 82 94 76 98 70 101 C 67 94 64 86 61 78 Z';
const SCARF = 'M 33.2 70.8 C 37 68.2 42 67.2 47 67.6 C 52 67.8 56 68.8 60 70 C 64 70.6 68 72.2 71.4 74.8 C 74.2 77 75.2 79.6 74.2 82 C 73 84.2 70.4 85.2 67.4 85.6 C 64.6 86.6 61.6 87.4 58.2 87 C 54.6 86.6 51.4 85.6 48 85.8 C 44.2 86 40.4 85 37.2 83 C 34.2 81 32.2 78.4 31.8 75.6 C 31.6 73.6 32.2 72 33.2 70.8 Z';
const SCARF_END = 'M 58 84 C 62 84.4 66 85.6 68.4 88 C 70 92 69.4 98 68 104 L 58.6 104 C 59.6 98 59.4 91 58 84 Z';

// Paint the portrait into g, size × size px. t: seconds (the ember breathes, the smoke drifts).
export function paintHawk(g, size, t = 0) {
  const M0 = g.getTransform(), k = (size / 100) * (Math.hypot(M0.a, M0.b) || 1), B = new Brush(g, k), r = rnd(11);
  g.save();
  g.scale(size / 100, size / 100);
  const glow = 0.65 + 0.35 * Math.sin(t * 1.7);
  // is (x, y) of this frame inside the path, whatever transform the frame is under
  const inP = (path, x, y) => { const M = g.getTransform(); return g.isPointInPath(path, M.a * x + M.c * y + M.e, M.b * x + M.d * y + M.f); };

  // --- the stall behind him: dark boards, shelves of tins out of focus, the lamp's warmth low right
  const bg = g.createLinearGradient(0, 0, 100, 100);
  bg.addColorStop(0, '#0b0907'); bg.addColorStop(0.6, '#171009'); bg.addColorStop(1, '#2b1a0e');
  g.fillStyle = bg; g.fillRect(0, 0, 100, 100);
  for (const y of [22, 48]) B.fill(`M 0 ${y} L 100 ${y - 1} L 100 ${y + 1.6} L 0 ${y + 2.6} Z`, '#2a1d12', 1.2, 0.8);
  for (let i = 0; i < 9; i++) { const x = 2 + i * 6.4 + r() * 2, y = 15 + (i % 3) * 0.6; B.fill(`M ${x} ${y} L ${x + 4} ${y} L ${x + 4} ${y + 7} L ${x} ${y + 7} Z`, i % 2 ? '#3a2a1a' : '#2c2218', 1.6, 0.7); B.dab(x + 2.6, y + 2, 1.2, 2.6, '#a0703c', 0.25); }
  for (let i = 0; i < 6; i++) { const x = 3 + i * 5.6, y = 40; B.fill(`M ${x} ${y} L ${x + 3.6} ${y} L ${x + 3.6} ${y + 8} L ${x} ${y + 8} Z`, '#2e2014', 1.8, 0.6); }
  B.dab(104, 96, 46, 40, 'rgba(255,160,80,0.55)');
  B.dab(96, 66, 10, 10, `rgba(255,120,50,${0.12 * glow})`);

  // --- the coat: heavy wool, the collar turned up behind the neck
  B.fill(COLLAR_BACK, '#24211d', 0.4);
  B.inside(COLLAR_BACK, () => { B.dab(36, 64, 9, 7, '#3c3730', 0.7); texture(g, 'wool', 0.5, 7); });
  B.fill(COAT, '#26231f', 0.3);
  B.inside(COAT, () => {
    texture(g, 'wool', 0.55, 7);
    B.dab(88, 96, 26, 16, 'rgba(176,120,72,0.55)');           // the lamp on the near shoulder
    B.dab(10, 92, 22, 14, 'rgba(70,80,92,0.25)');             // the cold of the street behind
    for (const d of ['M 14 88 C 20 92 24 98 26 106', 'M 40 82 C 44 90 46 98 47 106', 'M 82 86 C 86 92 88 98 88 106']) B.line(d, '#0c0b09', 2.2, 1.6, 0.6);
    for (const d of ['M 16 87 C 22 91 26 97 28 104', 'M 84 85 C 88 91 90 97 90 104']) B.line(d, '#5a4a38', 0.8, 0.8, 0.35);
  });

  // --- the head and neck. The bulb is above him and in front: the planes that face
  // it (the front of the face, the tops of the cheekbone, the nose, the lip, the
  // chin) take it full, the side of the face half, the back of the head and
  // everything under the jaw none. The cap's peak throws its shadow over the
  // forehead down onto the upper lid. Planes first, with crisp edges where a
  // plane turns and soft ones where it rounds; then the colour of old skin; then
  // the folds.
  // skin fold: a dark crease, the edge under it catching the bulb from above
  const fold = (d, w = 0.32, a = 0.55) => {
    B.line(d, `rgba(46,20,11,${a})`, w, w * 0.7);
    g.save(); g.translate(0.12, 0.26); B.line(d, `rgba(238,182,142,${a * 0.5})`, w * 0.8, w * 0.7); g.restore();
  };
  // the line of the cap's shadow on the face, front to back, and the region above it
  const CAPSHADOW = 'M 20 20 L 90 20 L 90 42.2 C 86 42.2 83.2 42.4 81.6 42.6 C 80.2 41.4 78.4 40.2 76.6 40.2 C 74.8 40 73.2 40.2 71.6 40.6 C 67.6 40.4 63 39.6 58.4 38.8 C 54.6 38.2 50 37.6 44 37.4 L 20 37.6 Z';
  B.fill(HEAD, '#7a523d', 0.25);
  B.inside(HEAD, () => {
    // the side plane turns away toward the back of the head, the nape in the dark
    B.fill('M 20 20 L 57 20 C 55.6 34 55 50 57.4 64 C 59 72 61 80 60 90 L 20 90 Z', 'rgba(34,18,11,0.82)', 3.2);
    // the front planes in the bulb: cheek and cheekbone, nose, lip, chin
    B.fill('M 66 40 C 72 41 78 42 82 44 C 84 47 86.4 50.6 85.6 53 L 82 55.4 L 81.6 60 L 81.8 66 L 77.6 69.8 C 76 64 74.4 58 72 53 C 69.8 48.4 67.4 44.4 66 40 Z', 'rgba(204,150,114,0.8)', 1.6);
    // the planes that face up catch it brightest: the top of the cheekbone, the
    // ridge of the cheek over the fold, the top of the lip, the jaw
    B.fill('M 66.4 43.4 C 70 44.2 74 44.8 78 44.6 L 77.4 46.6 C 73.6 47.4 69.6 46.8 66.6 45.6 Z', 'rgba(248,196,156,0.62)', 0.9);
    // the hollow under the cheekbone where the cheek has fallen in with age
    B.fill('M 62 47.6 C 66 49.4 70 50.4 74 50.4 C 74.6 52 74.2 53.6 73 54.4 C 69 53.6 65 52 61.6 50 Z', 'rgba(70,38,24,0.5)', 1.4);
    // under the jaw and down the neck, the jaw's own shadow
    B.fill('M 50 60 C 56 66 62 70 70 71 C 74 71 78 70.4 82 68.6 L 82 90 L 40 90 Z', 'rgba(24,11,6,0.7)', 1.6);
    // the cord of the neck and the Adam's apple, turned just enough to show
    B.line('M 52 61 C 55 67 58.6 75 61.4 84', 'rgba(150,96,68,0.35)', 1.4, 1.2);
    B.dab(66.2, 76.8, 1, 1.4, 'rgba(176,118,86,0.4)');
    for (const y of [77.4, 79.6, 81.8]) fold(`M 60.4 ${y} C 62.2 ${y + 0.6} 64 ${y + 0.4} 65.6 ${y - 0.2}`, 0.24, 0.3);
    // the nose: its lower bridge, hump and tip out in the bulb, the side plane in half
    // light, the underside dark and the shadow it throws down onto the lip and cheek
    B.fill('M 79.2 41.4 C 80.4 43 81 45 81.4 47.2 C 81.8 48.8 82.8 50 83.6 51.2 L 81 52.4 C 80.4 50.4 79.6 48.6 79 46.6 C 78.6 45 78.6 43 79.2 41.4 Z', 'rgba(110,60,40,0.4)', 0.8);
    B.line('M 80.4 42 C 81.2 42.8 82 43.8 82.3 44.8 C 82.5 45.8 82.6 46.6 82.9 47.3 C 83.7 48.3 84.6 49.2 85 50.2', 'rgba(255,214,178,0.72)', 0.7, 0.35);
    B.dab(82.2, 44.9, 0.6, 1.1, 'rgba(255,226,196,0.55)', 1, 'source-over', -0.4);
    B.line('M 84.5 50 C 85 50.8 85.1 51.8 84.8 52.8', 'rgba(255,222,190,0.65)', 0.6, 0.3);
    B.dab(83.4, 53.7, 1.9, 0.6, 'rgba(40,16,9,0.7)');
    B.fill('M 80.4 53.4 C 81.6 54.2 82.8 54.6 84 54.4 C 83 55.8 81.4 56.6 79.6 56.4 C 78.6 56 78 55.2 78 54.4 Z', 'rgba(44,18,10,0.55)', 0.5);
    B.fill('M 79.6 50.8 C 78.6 52 77.8 53.6 77.4 55.6 L 78.8 55.8 C 79.4 54.2 80.2 52.8 81 51.8 Z', 'rgba(52,24,14,0.5)', 0.6);
    // the wing of the nostril: a rounded pad, its groove round the back, the nostril
    // a dark curl under the tip
    B.dab(81.5, 51.9, 1.5, 1.1, 'rgba(206,138,104,0.55)');
    B.line('M 80.3 50.5 C 79.6 51.3 79.6 52.6 80.3 53.3 C 80.9 53.8 81.6 53.9 82.2 53.8', 'rgba(52,22,12,0.7)', 0.3, 0.18);
    B.line('M 80.5 50.3 C 81.4 49.9 82.5 50.3 83.1 51', 'rgba(255,208,170,0.5)', 0.26, 0.16);
    B.line('M 81.6 53.5 C 82.3 53.2 83.1 53.3 83.6 53.6', 'rgba(24,9,5,0.75)', 0.26, 0.12);
    // the fold from the nose down to the mouth, deep at his age
    fold('M 79.6 51.6 C 78.2 53 77.4 54.8 77 56.8', 0.4, 0.75);
    // colour of old skin: red in the nose and the cheek, a little blue where he shaves
    B.dab(83.6, 51, 2, 1.8, 'rgba(176,60,44,0.26)');
    B.dab(73, 48, 4, 2.2, 'rgba(176,66,50,0.22)');
    B.dab(64, 51, 6, 2.6, 'rgba(80,90,104,0.14)');
    // the cap's shadow: a hard edge across the face; inside it the forehead and the
    // eye are still there, in the warm light thrown back up off the lit cheek
    B.fill(CAPSHADOW, 'rgba(26,13,8,0.8)', 0.9);
    B.inside(CAPSHADOW, () => {
      B.dab(75, 39.8, 10, 2.2, 'rgba(150,90,62,0.34)');
      B.dab(77.4, 37.2, 2.6, 1, 'rgba(120,72,48,0.35)', 1, 'source-over', -0.1);
      B.dab(66, 38.6, 4.6, 2.4, 'rgba(12,6,3,0.4)');
      for (const y of [33.6, 35.2]) fold(`M 69 ${y + 0.4} C 72 ${y - 0.2} 75 ${y - 0.3} 78 ${y + 0.1}`, 0.22, 0.22);
    });
    // where the shadow's edge crosses the cheekbone it is crisp and the skin under it
    // takes the light hardest
    B.line('M 81.8 43.2 C 80.4 42 78.6 41 76.6 41 M 71 41.4 C 68 41.2 65 40.6 61.6 40', 'rgba(255,212,174,0.4)', 0.5, 0.4);
    // the bag under the eye at the edge of the shadow, the crow's feet running back
    fold('M 72.6 43.2 C 74 43.9 75.4 43.9 76.4 43.4', 0.2, 0.32);
    for (const [dy, l] of [[-0.4, 2.2], [0.5, 2.6], [1.4, 2]]) fold(`M 71.6 ${41.6 + dy * 0.2} l ${-l} ${dy * 0.7}`, 0.14, 0.26);
    // the lamp's warm edge along the front of the face, below the shadow
    B.line('M 82.4 46.6 C 83.6 48.2 85.2 49.6 85.2 51.6 M 81.2 55.4 C 81.4 56.4 81.2 57.4 80.8 58', 'rgba(255,196,140,0.45)', 0.4, 0.25);
    // the cold of the street on the back of the skull and the nape
    B.line('M 30.6 36 C 29.6 44 30.4 50 32.6 56 C 34.4 62 35.6 70 36.6 80', 'rgba(132,152,176,0.5)', 1.2, 1.1);
    // old skin is never one colour: red, yellow, violet and brown mottling
    const rm = rnd(91), MOT = ['176,62,48', '196,154,84', '104,64,96', '64,32,20', '240,192,152'];
    for (let i = 0; i < 320; i++) {
      const x = 54 + rm() * 32, y = 36 + rm() * 34, rr0 = 0.5 + rm() * 1.4;
      B.dab(x, y, rr0, rr0 * (0.6 + rm() * 0.5), `rgba(${MOT[(rm() * MOT.length) | 0]},${0.04 + rm() * 0.07})`, 1, 'source-over', rm() * 3);
    }
    // the skin up close: pores, fine blotches, age spots on the cheek
    const rp = rnd(83);
    for (let i = 0; i < 900; i++) {
      const x = 56 + rp() * 30, y = 38 + rp() * 22;
      B.dab(x, y, 0.08 + rp() * 0.12, 0.06 + rp() * 0.1, rp() < 0.6 ? 'rgba(70,32,20,0.18)' : 'rgba(255,216,184,0.14)');
    }
    for (const [x, y, w] of [[66.4, 45.2, 0.6], [63.2, 47.6, 0.7], [69.6, 47.4, 0.45]]) B.dab(x, y, w, w * 0.8, 'rgba(96,52,30,0.35)');
    texture(g, 'skin', 0.55, 6);
  });

  // --- the eye, in the shadow of the peak: a wedge open to the front, the white
  // dim, the iris a dark sliver behind the cornea, the upper lid heavy and hooded,
  // and one wet glint of the lamp
  const EYE = 'M 72.2 41.1 C 73.2 40.2 74.6 39.9 75.9 40.7 C 76.2 41 76.1 41.4 75.8 41.6 C 74.6 42.1 73.2 41.8 72.2 41.1 Z';
  B.fill(EYE, '#5e4c40', 0.12);
  B.inside(EYE, () => {
    B.dab(73, 41.1, 1.4, 0.8, 'rgba(30,18,12,0.75)');
    B.fill('M 74.9 40.3 C 75.5 40.5 75.7 41.1 75.4 41.7 C 75 41.8 74.7 41.7 74.6 41.5 C 74.4 41 74.5 40.6 74.9 40.3 Z', '#1c110b', 0.1);
    B.fill('M 71.8 39.8 L 76.6 39.8 L 76.6 40.9 C 75 40.7 73.4 40.8 71.8 41.4 Z', 'rgba(14,6,3,0.7)', 0.22);
  });
  B.dab(75.5, 41.35, 0.22, 0.15, '#ffe4c4', 0.85);
  B.line('M 72.1 41.1 C 73.2 40 74.6 39.7 76 40.5', 'rgba(16,7,4,0.95)', 0.42, 0.14);
  B.line('M 72.3 40.6 C 73.6 39.4 75 39.1 76.3 39.8', 'rgba(110,64,44,0.45)', 0.4, 0.3);
  B.line('M 71.8 40 C 73.2 38.8 75 38.6 76.6 39.2', 'rgba(16,7,4,0.6)', 0.3, 0.25);
  B.line('M 72.4 41.5 C 73.6 42.3 74.8 42.3 75.7 41.8', 'rgba(150,92,66,0.5)', 0.24, 0.14);

  // --- the ear: helix round the back and top, the antihelix inside it, the hollow of
  // the concha, the tragus in front, a heavy lobe; the bulb on its top, the street's
  // cold light on its back edge, its shadow on the side of the head
  B.inside(HEAD, () => B.dab(46.2, 47, 2.6, 6, 'rgba(18,8,4,0.5)'));
  B.fill(EAR, '#7c4f3e', 0.15);
  B.inside(EAR, () => {
    B.dab(51.6, 42, 3.4, 2.2, 'rgba(214,146,110,0.45)');
    B.fill('M 44 36 L 58 36 L 58 40.4 C 54 39.8 50 39.8 44 40.6 Z', 'rgba(22,10,6,0.6)', 0.9);
    B.dab(48.4, 47, 2, 6, 'rgba(36,16,10,0.55)');
    B.line('M 53.4 40 C 51.4 38.8 48.8 39.2 47.8 41.6 C 47 44 47.2 47.6 47.8 50.4 C 48.2 52.6 49.2 53.8 50.6 53.8', 'rgba(42,18,10,0.6)', 0.5, 0.3);
    B.line('M 53.2 39.2 C 51 38.4 48.4 38.8 47.4 41.4 C 46.7 44 46.9 47.6 47.4 50.4', 'rgba(232,160,122,0.5)', 0.45, 0.25);
    B.line('M 52.4 41.6 C 51.2 41.8 50.4 43 50.2 44.8 C 50.1 46.6 50.4 48.2 51 49.6', 'rgba(220,146,110,0.5)', 0.45, 0.25);
    B.line('M 53 42.4 C 52.2 43 51.4 44.4 51.2 46', 'rgba(40,16,8,0.5)', 0.3, 0.2);
    B.fill('M 51.6 45.4 C 52.6 44.8 53.8 45.4 53.9 46.8 C 54 48.4 53.2 49.8 52.2 50 C 51.4 49.4 51.2 47.6 51.6 45.4 Z', 'rgba(30,10,6,0.78)', 0.35);
    B.dab(54.1, 47.4, 0.6, 0.9, 'rgba(226,150,112,0.6)');
    B.dab(50.2, 53.2, 1.6, 1.3, 'rgba(176,72,56,0.4)');
    B.dab(50.4, 54.2, 1.2, 0.5, 'rgba(232,160,122,0.35)');
    B.line('M 49 39 C 47.6 39.8 46.8 42 46.7 45 C 46.6 48 47 51 47.6 53', 'rgba(140,160,184,0.45)', 0.35, 0.25);
    texture(g, 'skin', 0.3, 6);
  });

  // --- the hair under the cap: cropped short, grey, over the temple, round the ear,
  // thinning down the nape; the cap's brim throws its shadow over all of it
  const HAIR = 'M 30.6 35 C 38 33.8 47 33.4 56.6 34.6 C 58.6 35 59.2 36.6 58.4 38 C 57.2 39.4 55.6 40.6 54.6 42.6 L 53.4 44.2 C 52.6 41.6 51.6 39.4 50.4 38.6 C 48 38.6 46.4 39.8 46 42.4 C 45.6 45.6 46 49.4 46.8 52.4 C 47.2 54 47.6 55 47.8 55.6 C 45 57.6 41 58.6 37 58.4 C 33.8 56.4 31.8 52 31 47 C 30.4 42.6 30.2 38.4 30.6 35 Z';
  B.fill(HAIR, 'rgba(40,36,32,0.72)', 0.8);
  B.inside(HAIR, () => { B.dab(55.6, 37.4, 3.4, 2, 'rgba(150,140,128,0.35)'); B.dab(34, 48, 7, 11, 'rgba(10,8,6,0.55)'); B.dab(44, 55, 8, 3, 'rgba(14,10,8,0.4)'); });
  B.hairs(3600, 61, (i, rr) => {
    const x = 30 + rr() * 29, y = 33.4 + rr() * 25;
    if (!inP(P(HAIR), x, y)) return null;
    const l = Math.min(1, Math.max(0, (x - 42) / 16 - (y - 36) / 40)), salt = rr() < 0.5;
    const v = (salt ? 118 : 46) + l * 80 + (rr() - 0.5) * 24;
    return [x, y, Math.PI / 2 + 0.6 + (rr() - 0.5) * 0.5, 0.25 + rr() * 0.35, `rgba(${v + 4 | 0},${v | 0},${v - 6 | 0},1)`, 0.055, salt ? 0.25 + l * 0.35 : 0.45];
  });
  B.hairs(520, 67, (i, rr) => {
    const x = 31 + rr() * 18, y = 50 + rr() * 12;
    if (inP(P(HAIR), x, y) || !inP(P(HEAD), x, y) || inP(P(EAR), x, y)) return null;
    const v = rr() < 0.55 ? 150 : 60;
    return [x, y, Math.PI / 2 + 0.5 + (rr() - 0.5) * 0.5, 0.25 + rr() * 0.35, `rgba(${v + 4},${v},${v - 6},1)`, 0.055, 0.2 + rr() * 0.2];
  });
  B.fill('M 28 33.4 C 40 32.2 50 32.6 58.6 35.4 L 58 38.4 C 50 35.8 40 35.4 28.4 37.2 Z', 'rgba(8,6,4,0.5)', 1.1);

  // --- the beard, kept short and painted as a painter paints hair: first its own
  // dark, then the grey in mid strokes, then the light only where the bulb reaches
  // (the side of the jaw, the chin's front), all along the way it grows: down and
  // forward on the cheek, down off the chin, back under the jaw. Thick at the chin,
  // thin at its edges so the skin shows through, a stubble above it on the cheek.
  const beard = P(BEARD);
  const deep = (x, y) => { let n = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7]]) n += inP(beard, x + dx, y + dy) ? 1 : 0; return n / 8; };
  const jawY = (x) => 58 + (x - 52) * 0.343;
  const lightAt = (x, y) => (y > jawY(x) + 0.8 ? 0.1 : Math.min(1, 0.32 + Math.max(0, x - 60) / 24 + (y > jawY(x) - 2.4 ? 0.18 : 0)));
  const grow = (x, y) => (y > jawY(x) + 0.8 ? Math.PI / 2 + 0.55 : x < 56 ? Math.PI / 2 + 0.1 : x > 78 ? Math.PI / 2 - 0.05 : Math.PI / 2 - 0.38);
  const grey = (v, a = 1) => `rgba(${v + 6 | 0},${v + 2 | 0},${v - 6 | 0},${a})`;
  B.fill(BEARD, 'rgba(56,50,46,0.62)', 0.9);
  B.inside(BEARD, () => {
    B.fill('M 50 60 C 58 66 66 70 74 70.6 C 78 70.6 80 69.6 82 68 L 82 78 L 50 78 Z', 'rgba(14,10,8,0.6)', 1.8);
    B.dab(79.4, 64.6, 2.4, 2.8, 'rgba(176,166,152,0.35)');
  });
  const pass = (n, seed, w, pick) => B.hairs(n, seed, (i, rr) => {
    const x = 51 + rr() * 31, y = 44 + rr() * 31;
    if (!inP(beard, x, y)) return null;
    const dn = deep(x, y);
    if (rr() > 0.15 + dn * 0.85) return null;
    const c = pick(lightAt(x, y), rr);
    return c && [x, y, grow(x, y) + (rr() - 0.5) * 0.45, 0.45 + rr() * 0.55, c[0], w, c[1] * (0.35 + dn * 0.65)];
  });
  pass(2800, 21, 0.16, (l) => [grey(26 + l * 20), 0.4]);
  pass(2600, 22, 0.12, (l, rr) => [grey(70 + l * 80 + (rr() - 0.5) * 24), 0.38]);
  pass(1800, 23, 0.085, (l, rr) => (l < 0.45 ? null : [grey(Math.min(236, 150 + l * 80 + (rr() - 0.5) * 30)), 0.55 * l]));
  // loose hairs past the edge, so the beard ends in hair and not in a line
  B.hairs(600, 33, (i, rr) => {
    const x = 51 + rr() * 31, y = 44 + rr() * 31;
    if (inP(beard, x, y) || deep(x, y) === 0) return null;
    return [x, y, grow(x, y) + (rr() - 0.5) * 0.7, 0.3 + rr() * 0.4, grey(70 + lightAt(x, y) * 110), 0.06, 0.35];
  });
  // the shaved stubble on the cheek above the beard line, thinning upward
  B.inside(HEAD, () => B.hairs(900, 35, (i, rr) => {
    const x = 55 + rr() * 22, y = 45 + rr() * 11;
    if (inP(beard, x, y)) return null;
    const top = 46.8 + (x - 56.6) * 0.5;
    if (y < top - 3.2 || rr() > (y - (top - 3.2)) / 3.2) return null;
    return [x, y, Math.PI / 2 - 0.3, 0.15 + rr() * 0.2, grey(60 + rr() * 60), 0.06, 0.4];
  }));
  // the lower lip under the moustache, where the cigarette sits
  B.fill(LIP, '#7a3e30', 0.2);
  B.inside(LIP, () => { B.dab(80, 59.2, 1.4, 0.5, 'rgba(236,156,124,0.55)'); B.dab(78.8, 60.2, 1, 0.5, 'rgba(30,12,8,0.6)'); });
  fold('M 78.6 58.6 C 78.2 59 77.8 59.4 77.4 59.6', 0.26, 0.6);
  // the moustache: the same salt and pepper, heavy over the lip, yellowed only where
  // forty years of smoke have gone through it at the cigarette
  B.fill(STACHE, 'rgba(60,54,50,0.85)', 0.35);
  B.inside(STACHE, () => B.dab(77.8, 57, 1.8, 1.6, 'rgba(14,10,8,0.6)'));
  for (const [n, seed, w, base, span, al] of [[800, 44, 0.14, 30, 26, 0.5], [800, 45, 0.1, 80, 80, 0.42], [520, 46, 0.075, 140, 70, 0.5]]) B.hairs(n, seed, (i, rr) => {
    const x = 76.2 + rr() * 7, y = 54.2 + rr() * 5.2;
    if (!inP(P(STACHE), x, y)) return null;
    const l = Math.min(1, Math.max(0, (x - 77.6) / 5)) * (y < 56.8 ? 1 : 0.7);
    if (base > 150 && rr() > l) return null;
    const v = base + l * span + (rr() - 0.5) * 24, nic = y > 57.2 && x > 79.6 && rr() < 0.5;
    return [x, y, Math.PI * 0.5 + (x - 79.6) * 0.06 + (rr() - 0.5) * 0.3, 0.6 + rr() * 0.8, nic ? `rgba(${v + 24 | 0},${v + 6 | 0},${v - 44 | 0},1)` : grey(Math.min(240, v)), w, al];
  });
  B.dab(81.2, 58, 2.6, 1.6, `rgba(255,140,60,${0.35 * glow})`, 1, 'screen');

  // --- the brow: grey, thick and wiry, low over the eye, a few long hairs astray
  B.fill('M 70.6 38.8 C 72.6 37.4 75.6 37 78.6 37.6 L 78.4 38.6 C 75.6 38.2 72.8 38.6 70.8 39.6 Z', '#2e2a26', 0.5, 0.85);
  B.hairs(170, 55, (i, rr) => {
    const u = rr(), x = 70.6 + u * 8, y = 38.6 - Math.sin(u * Math.PI) * 1.1 + (rr() - 0.5) * 0.8;
    const v = 46 + u * 70 + (rr() - 0.5) * 30, wild = rr() < 0.08;
    return [x, y, -0.25 - rr() * 0.45 + (wild ? -0.4 : 0), (wild ? 1.6 : 0.6) + rr() * 0.6, `rgba(${v | 0},${v - 4 | 0},${v - 10 | 0},1)`, 0.08, 0.65];
  });

  // --- the scarf: old knitted wool, olive gone brown, two rust stripes, wound round
  // the neck over the lower edge of the beard
  B.fill(SCARF_END, '#3d3a26', 0.3);
  B.fill(SCARF, '#45422b', 0.3);
  for (const d of [SCARF, SCARF_END]) B.inside(d, () => {
    for (const y of [74, 80]) B.fill(`M 20 ${y} C 40 ${y - 3} 60 ${y - 1} 80 ${y + 3} L 80 ${y + 1.8} C 60 ${y + 1} 40 ${y - 1} 20 ${y + 1.6} Z`, '#6a3420', 0.7, 0.6);
    B.dab(70, 82, 14, 8, 'rgba(190,140,80,0.4)');
    B.dab(36, 76, 10, 8, 'rgba(10,8,6,0.6)');
    texture(g, 'knit', 0.3, 2.6);
    B.line('M 40 75 C 48 78 58 79 68 78', 'rgba(10,8,6,0.5)', 1.6, 1.2);
    // wound round the neck: dark in the crevice against the skin, the roll under it
    // turning toward the lamp, the loose folds where it is tucked into the coat
    B.line('M 34 71 C 44 68.4 56 69.2 67 72.4', 'rgba(8,6,4,0.6)', 1.4, 1);
    B.line('M 36 82.6 C 46 85 58 85.6 70 83.4', 'rgba(8,6,4,0.55)', 1.8, 1.4);
    B.line('M 46 81.4 C 54 82.6 62 82.4 70 80.6', 'rgba(210,160,100,0.28)', 1.2, 1);
    for (const x of [48, 58]) { B.line(`M ${x} 72 C ${x + 1.6} 75 ${x + 1.4} 79 ${x - 0.4} 82`, 'rgba(8,6,4,0.4)', 1.1, 0.9); B.line(`M ${x + 1.4} 72 C ${x + 3} 75 ${x + 2.8} 79 ${x + 1} 82`, 'rgba(200,150,96,0.2)', 0.7, 0.7); }
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
  g.save(); g.translate(81.0, 58.7); g.rotate(0.19);
  B.fill('M 0 -0.78 L 13.4 -0.78 L 13.4 0.78 L 0 0.78 Z', '#e6dfd0', 0.1);
  B.fill('M 0 -0.78 L 3.4 -0.78 L 3.4 0.78 L 0 0.78 Z', '#b98f58', 0.1);
  B.fill('M 0 0.2 L 13.4 0.2 L 13.4 0.78 L 0 0.78 Z', 'rgba(120,96,70,0.45)', 0.25);
  B.fill('M 12.6 -0.8 L 13.8 -0.8 L 13.8 0.8 L 12.6 0.8 Z', '#8a8680', 0.15);
  B.dab(13.9, 0, 1.0, 0.85, `rgb(255,${120 + 70 * glow},50)`, 1);
  B.dab(13.9, 0, 3.2, 2.6, `rgba(255,120,40,${0.45 * glow})`, 1, 'screen');
  g.restore();
  for (let i = 0; i < 5; i++) {
    const u = (t * 0.12 + i / 5) % 1, x0 = 94.8, y0 = 61.3;
    const x1 = x0 - 2 + Math.sin(u * 5 + i) * 3, y1 = y0 - 8 - u * 26, x2 = x1 + Math.sin(u * 7 + i * 2) * 4, y2 = y1 - 10;
    B.line(`M ${x0} ${y0 - 1} C ${x0 + 1} ${y0 - 6} ${x1 - 2} ${y1 + 4} ${x1} ${y1} S ${x2 + 2} ${y2 + 4} ${x2} ${y2}`, `rgba(190,182,172,${0.16 * (1 - u)})`, 0.8 + u * 3, 0.8 + u * 2.4);
  }

  // --- the whole: a cool edge of street light on his back, film grain, the stall's dark round the frame
  B.dab(26, 60, 10, 30, 'rgba(110,130,150,0.12)', 1, 'screen');
  B.grain(0, 0, 100, 100, 0.035);
  const v = g.createRadialGradient(56, 54, 30, 56, 54, 78);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)');
  g.fillStyle = v; g.fillRect(0, 0, 100, 100);
  g.restore();
}
