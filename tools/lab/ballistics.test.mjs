// Ballistics tests for the LAB. Run: node tools/lab/ballistics.test.mjs
import { Level, T } from '../../public/lab/js/phys/level.js';
import { rayTiles, rayCapsule, rayBox, falloff } from '../../public/lab/js/game/ballistics.js';

let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) passes++; else { fails++; console.log('FAIL', msg); } };
const near = (a, b, e = 0.01) => Math.abs(a - b) <= e;
// 20×8 tiles, street (y = 0) on top of row 6
const rows = [
  '....................',
  '....................',
  '....................',
  '..........==........',
  '.....#..............',
  '.....#.......#/.....',
  '####################',
  '####################',
];
const L = new Level(rows, -6 * T);
const o = {};
// 1. horizontal ray into the left face of the wall at col 5 (x 40..48), y −12
{ const d = rayTiles(L, 10, -12, 1, 0, 500, o); ok(near(d, 30) && o.nx === -1 && o.ny === 0, `wall face: ${d} n=(${o.nx},${o.ny})`); }
// 2. ray straight down onto the street
{ const d = rayTiles(L, 100, -40, 0, 1, 500, o); ok(near(d, 40) && o.ny === -1, `floor: ${d} n=(${o.nx},${o.ny})`); }
// 3. one-way decks do not stop bullets (row 3 = y −24..−16 at cols 10–11)
{ const d = rayTiles(L, 84, -40, 0, 1, 500, o); ok(near(d, 40), `through one-way: ${d}`); }
// 4. slope '/' at col 14 (x 112..120), row 5 (y −8..0): surface y = top + 8 − lx
{ const d = rayTiles(L, 116, -30, 0, 1, 500, o); ok(near(d, 26) && o.ny < 0 && o.nx < 0, `slope top: ${d} n=(${o.nx.toFixed(2)},${o.ny.toFixed(2)})`); }
// 5. '/' is solid under its diagonal, so its right side is a vertical face;
//    from the left at y −2 the ray meets the diagonal at lx = 2
{ const d = rayTiles(L, 150, -2, -1, 0, 500, o); ok(near(d, 30), `slope high side: ${d}`);
  const d2 = rayTiles(L, 112.5, -2, 1, 0, 500, o); ok(near(d2, 1.5) && o.nx < 0 && o.ny < 0, `slope diagonal from the left: ${d2}`); }
// 6. max range in the open sky
{ const d = rayTiles(L, 10, -40, 1, -0.2 / Math.hypot(1, 0.2), 120, o); ok(d === 120, `open: ${d}`); }
// 7. capsules: side, end cap, miss, inside
{ const c = { x0: 50, y0: -40, x1: 50, y1: -10, r: 5 };
  ok(near(rayCapsule(0, -20, 1, 0, 200, c), 45), 'capsule side');
  ok(near(rayCapsule(50, -80, 0, 1, 200, c), 35), 'capsule end cap');
  ok(rayCapsule(0, -50, 1, 0, 200, c) === -1, 'capsule miss above');
  ok(rayCapsule(0, -20, 1, 0, 40, c) === -1, 'capsule out of range');
  ok(rayCapsule(50, -20, 1, 0, 40, c) === 0, 'capsule from inside');
  const head = { x0: 20, y0: 0, x1: 20, y1: 0, r: 6 };
  ok(near(rayCapsule(0, 3, 1, 0, 100, head), 20 - Math.sqrt(27)), 'circle chord'); }
// 8. box
{ const b = { x0: 10, x1: 20, y0: -30, y1: 0 };
  ok(near(rayBox(0, -10, 1, 0, 100, b), 10), 'box front');
  ok(rayBox(0, -40, 1, 0, 100, b) === -1, 'box miss'); }
// 9. falloff
ok(falloff(30, 100, [200, 400, 0.5]) === 30 && near(falloff(30, 300, [200, 400, 0.5]), 22.5) && falloff(30, 900, [200, 400, 0.5]) === 15, 'falloff');
console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
