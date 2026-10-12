// Movement tests for the LAB physics. Run: node tools/lab/phys.test.mjs
import { Level, T } from '../../public/lab/js/phys/level.js';
import { Mover, MOVE, HEIGHT } from '../../public/lab/js/phys/mover.js';

const DT = 1 / 120;
// Level builder: W×H tiles, street (y = 0) is the top of row H-2.
function build(W, H, ops) {
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  for (let x = 0; x < W; x++) { g[H - 2][x] = '#'; g[H - 1][x] = '#'; }
  const api = {
    // columns [c0, c1], `n` tiles tall standing on the street
    block: (c0, c1, n, ch = '#') => { for (let x = c0; x <= c1; x++) for (let k = 1; k <= n; k++) g[H - 2 - k][x] = ch; },
    // horizontal strip at height n tiles (its top is n*8 above the street)
    strip: (c0, c1, n, ch) => { for (let x = c0; x <= c1; x++) g[H - 2 - n][x] = ch; },
    col: (c, n0, n1, ch) => { for (let k = n0; k <= n1; k++) g[H - 2 - k][c] = ch; },
    set: (c, n, ch) => { g[H - 2 - n][c] = ch; },
  };
  ops(api);
  return new Level(g.map((r) => r.join('')), -(H - 2) * T);
}
const H0 = 30;
const L = build(90, H0, (b) => {
  b.block(15, 16, 1);            // one-tile step x 120..136, top -8
  b.block(27, 30, 4);            // crate stack x 216..248, top -32
  b.block(34, 39, 8);            // tall block x 272..320, top -64
  b.strip(10, 13, 5, '=');       // one-way x 80..112, top -40
  b.col(23, 1, 14, 'H');         // ladder x 184..192 from the street to row 14 (top -112)
  b.strip(19, 22, 14, '=');      // deck left of the ladder, top -112
  // ramp: slope up from col 50, plateau 55..60 at 5 tiles (top -40), slope down to col 65
  for (let k = 0; k < 5; k++) { b.set(50 + k, k + 1, '/'); for (let j = 0; j <= k; j++) if (j < k + 1 && 50 + k > 50) {} b.block(50 + k + 1, 50 + k + 1, k + 1); }
  b.block(55, 60, 5);
  for (let k = 0; k < 5; k++) { b.set(61 + k, 5 - k, '\\'); b.block(61 + k, 61 + k, 4 - k); }
});

let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) passes++; else { fails++; console.log('FAIL', msg); } };
const near = (a, b, e) => Math.abs(a - b) <= e;
function run(m, sec, f) { const n = Math.round(sec / DT); for (let i = 0; i < n; i++) m.step(DT, f(i * DT)); }
const I = (o = {}) => ({ moveX: 0, up: false, down: false, jump: false, jumpPressed: false, sprint: false, crouch: false, face: 0, ...o });
const settle = (m) => run(m, 0.3, () => I());

// 1. settle + run speed
{ const m = new Mover(L, 20, -20); settle(m); ok(m.grounded && near(m.y, 0, 0.01), `settle y=${m.y}`);
  run(m, 0.35, () => I({ moveX: 1, face: 1 })); ok(near(m.vx, MOVE.run, 0.5), `run speed ${m.vx}`); }
// 2. jump heights
{ const m = new Mover(L, 20, 0); settle(m);
  let minY = 0; run(m, 0.8, (t) => { minY = Math.min(minY, m.y); return I({ jump: true, jumpPressed: t === 0 }); });
  ok(near(-minY, MOVE.jumpV ** 2 / (2 * MOVE.gravity), 2.5), `full jump ${-minY.toFixed(1)}`); ok(m.grounded, 'lands');
  minY = 0; run(m, 0.8, (t) => { minY = Math.min(minY, m.y); return I({ jump: t < DT * 2, jumpPressed: t === 0 }); });
  ok(-minY > 10 && -minY < 22, `tap jump ${-minY.toFixed(1)}`); }
// 3. one-tile step walked up without a mantle
{ const m = new Mover(L, 100, 0); settle(m); let mantled = false;
  run(m, 0.18, () => { if (m.state === 'mantle') mantled = true; return I({ moveX: 1, face: 1 }); });
  ok(near(m.y, -8, 0.1) && !mantled, `step up y=${m.y.toFixed(1)} x=${m.x.toFixed(1)} mantle=${mantled}`); }
// 4. coyote: jump 60 ms after walking off the crate stack's left edge
{ const m = new Mover(L, 226, -32); settle(m); ok(near(m.y, -32, 0.01), `on crates ${m.y}`);
  let t0 = null, jumped = false;
  run(m, 0.5, (t) => { if (t0 === null && !m.grounded) t0 = t; if (m.ev.jump) jumped = true;
    const tt = t0 === null ? -1 : t - t0; return I({ moveX: -1, face: -1, jump: tt >= 0.06, jumpPressed: tt >= 0.06 && tt < 0.06 + DT }); });
  ok(jumped, 'coyote jump'); }
// 5. jump buffer
{ const m = new Mover(L, 380, -60); let jumped = false, pressed = false;
  run(m, 1.0, () => { const close = !m.grounded && m.vy > 0 && m.y > -10 && !pressed; if (close) pressed = true; if (m.ev.jump) jumped = true; return I({ jump: pressed, jumpPressed: close }); });
  ok(jumped, 'buffered jump'); }
// 6. mantle onto the crate stack (32)
{ const m = new Mover(L, 196, 0); settle(m); let mant = false;
  run(m, 0.55, () => { if (m.state === 'mantle') mant = true; return I({ moveX: 1, face: 1 }); });
  ok(mant && near(m.y, -32, 0.1) && m.x > 216, `mantle 32: x=${m.x.toFixed(1)} y=${m.y.toFixed(1)} ${m.state}`); }
// 7. a wall taller than a jump (64): jump into it and mantle the rest
{ const m = new Mover(L, 256, 0); settle(m);
  let mant = false, done = false;
  run(m, 1.0, (t) => { if (m.state === 'mantle') mant = true; if (mant && m.state === 'ground') done = true;
    return I({ moveX: done ? 0 : 1, face: 1, jump: t < 0.4, jumpPressed: near(t, 0.02, DT / 2) }); });
  ok(mant && near(m.y, -64, 0.1), `mantle tall: x=${m.x.toFixed(1)} y=${m.y.toFixed(1)} ${m.state}`); }
// 8. one-way: up through, land, drop down
{ const m = new Mover(L, 92, 0); settle(m);
  run(m, 1.0, (t) => I({ jump: t < 0.4, jumpPressed: t === 0 }));
  ok(near(m.y, -40, 0.1) && m.grounded, `one-way land y=${m.y.toFixed(1)}`);
  run(m, 0.6, (t) => I({ down: true, jump: t < 0.05, jumpPressed: t === 0 }));
  ok(near(m.y, 0, 0.1), `drop through y=${m.y.toFixed(1)}`); }
// 9. ladder up to the deck, walk off, come back down
{ const m = new Mover(L, 188, 0); settle(m);
  run(m, 1.8, () => I({ up: true }));
  ok(near(m.y, -112, 0.5) && m.grounded, `ladder top y=${m.y.toFixed(1)} ${m.state}`);
  run(m, 0.3, () => I({ moveX: -1, face: -1 }));
  ok(near(m.y, -112, 0.5) && m.grounded && m.x < 184, `on deck y=${m.y.toFixed(1)} x=${m.x.toFixed(1)}`);
  run(m, 0.3, () => I({ moveX: 1, face: 1 })); m.vx = 0; m.x = 188;
  run(m, 0.05, () => I());
  run(m, 1.8, () => I({ down: true }));
  ok(near(m.y, 0, 0.5) && m.grounded, `ladder down y=${m.y.toFixed(1)} ${m.state}`); }
// 10. ramp: up the slope onto the plateau and down the far side without leaving the ground
{ const m = new Mover(L, 380, 0); settle(m); let air = 0, top = 0;
  run(m, 1.8, () => { if (!m.grounded) air++; top = Math.min(top, m.y); return I({ moveX: 1, face: 1 }); });
  ok(near(top, -40, 0.5) && air < 4 && m.x > 530, `ramp: top=${top.toFixed(1)} air=${air} x=${m.x.toFixed(1)} y=${m.y.toFixed(1)}`); }
// 11. sprint, slide under a duct with 32 of clearance, crawl out, stand
{ const L2 = build(60, 12, (b) => { b.strip(30, 35, 5, '#'); }); // duct x 240..288, underside -32
  const m = new Mover(L2, 20, 0); settle(m);
  let slid = false, under = false, stood = false;
  run(m, 2.2, (t) => {
    if (m.state === 'slide') slid = true;
    if (m.x > 250 && m.x < 280) under = true;
    if (m.x > 300 && m.h === HEIGHT.stand) stood = true;
    return I({ moveX: 1, face: 1, sprint: true, crouch: m.x > 170 && m.x < 200 });
  });
  ok(slid && under && stood, `slide under duct: slid=${slid} under=${under} stood=${stood} x=${m.x.toFixed(1)} h=${m.h}`); }
// 12. ceiling bonk
{ const L3 = build(10, 12, (b) => { b.strip(0, 9, 8, '#'); }); // underside at -56? strip at 8 tiles: tile top -64, bottom -56
  const m = new Mover(L3, 40, 0); settle(m); let minY = 0;
  run(m, 0.5, (t) => { minY = Math.min(minY, m.y); return I({ jump: true, jumpPressed: t === 0 }); });
  ok(m.h === HEIGHT.crouch && near(-minY, 56 - HEIGHT.crouch, 0.6), `56-high gap: crouched, rise ${(-minY).toFixed(1)}`);
  const L4 = build(10, 14, (b) => { b.strip(0, 9, 10, '#'); }); // underside -72 → rise ≤ 14
  const m2 = new Mover(L4, 40, 0); settle(m2); minY = 0;
  run(m2, 0.5, (t) => { minY = Math.min(minY, m2.y); return I({ jump: true, jumpPressed: t === 0 }); });
  ok(-minY > 10 && -minY < 15, `ceiling bonk rise ${(-minY).toFixed(1)}`); }
console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
