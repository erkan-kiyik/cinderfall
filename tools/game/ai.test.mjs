// Enemy AI tests for KOR. Run: node tools/game/ai.test.mjs
import { Level, T } from '../../public/game/js/phys/level.js';
import { Mover } from '../../public/game/js/phys/mover.js';
import { Gun } from '../../public/game/js/game/guns.js';
import { Brain, Squad, DIFF } from '../../public/game/js/game/ai/brain.js';
import { findCovers } from '../../public/game/js/game/ai/cover.js';

let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) passes++; else { fails++; console.log('FAIL', msg); } };
const DT = 1 / 120;
// 80 tiles wide, street on row 18; a 5-tile block at cols 40–41, a 1-tile curb at 20
function level(extra = () => {}) {
  const g = Array.from({ length: 20 }, () => Array(80).fill('.'));
  for (let r = 18; r < 20; r++) for (let c = 0; c < 80; c++) g[r][c] = '#';
  for (let r = 13; r < 18; r++) for (const c of [40, 41]) g[r][c] = '#';
  extra(g);
  return new Level(g.map((r) => r.join('')), -18 * T);
}
// a minimal character: what the brain touches
function body(L, x, facing = -1, gun = 'kestrel') {
  const m = new Mover(L, x, 0); m.facing = facing;
  for (let i = 0; i < 30; i++) m.step(DT, { moveX: 0, face: facing });
  return {
    m, alive: true, gun: gun ? new Gun(gun, { infinite: true }) : null, aimX: 0, aimY: 0, inputs: [],
    setAim(x, y) { this.aimX = x; this.aimY = y; },
    weaponInput(o) { this.inputs.push(o); },
    shoulder(out) { out[0] = this.m.x; out[1] = this.m.y - 50; return out; },
  };
}
function world(L, player, squad = new Squad(2)) {
  return { level: L, player, squad, covers: findCovers(L), t: 0, alert() {} };
}
function run(b, w, sec) {
  const n = Math.round(sec / DT);
  for (let i = 0; i < n; i++) { w.t += DT; const inp = b.think(DT, w); b.ch.m.step(DT, inp); }
}

// 1. covers: both faces of the block, flush against it
{ const L = level(), cv = findCovers(L);
  const left = cv.find((c) => c.side === 1), right = cv.find((c) => c.side === -1);
  ok(cv.length === 2 && left && right, `two cover points at the block (${cv.length})`);
  ok(Math.abs(left.x - (40 * T - 8.5)) < 0.01 && Math.abs(right.x - (42 * T + 8.5)) < 0.01, `flush cover x ${left && left.x}, ${right && right.x}`); }
// 2. sight: sees a player in front, not one behind; walls block
{ const L = level();
  const e = body(L, 300, -1), b = new Brain(e, { kind: 'tet', zone: [200, 400] });
  ok(b.sees(L, body(L, 150, 1)), 'sees a player in front');
  ok(!b.sees(L, body(L, 450, 1)), 'does not see a player behind (guard)');
  const e2 = body(L, 380, -1), b2 = new Brain(e2, { kind: 'tet', zone: [340, 420] });
  ok(!b2.sees(L, { m: { x: 40 * T - 8.5, y: 0, crouching: true } }), 'a crouched player flush behind the block is hidden');
  ok(b2.sees(L, { m: { x: 40 * T - 8.5, y: 0, crouching: false } }), 'the same player standing is seen'); }
// 3. awareness builds up, then combat
{ const L = level();
  const p = body(L, 200, 1), e = body(L, 520, -1), b = new Brain(e, { kind: 'tet', zone: [430, 600] });
  const w = world(L, p);
  run(b, w, 0.2); const early = b.state;
  run(b, w, 2.5);
  ok(early === 'guard' && b.state === 'combat', `alerts after a while (${early} → ${b.state})`); }
// 4. rifleman takes the cover that faces the player, without climbing the block
{ const L = level();
  const p = body(L, 120, 1), e = body(L, 380, -1), b = new Brain(e, { kind: 'tet', zone: [300, 460] });
  const w = world(L, p); b.alarm(120, 0, 1);
  let climbed = false;
  for (let i = 0; i < 4 * 120; i++) { w.t += DT; const inp = b.think(DT, w); e.m.step(DT, inp); if (e.m.y < -4 || e.m.state === 'mantle') climbed = true; }
  ok(b.cover && b.cover.side === -1, `picked the right-hand cover (side ${b.cover && b.cover.side})`);
  ok(Math.abs(e.m.x - (42 * T + 8.5)) < 4 && !climbed, `reached it at ${e.m.x.toFixed(1)}, climbed: ${climbed}`); }
// 5. a guard on the other side does not walk over the block to get to cover
{ const L = level();
  const p = body(L, 600, -1), e = body(L, 300, 1), b = new Brain(e, { kind: 'tet', zone: [200, 420] });
  const w = world(L, p); b.alarm(600, 0, 1);
  let climbed = false;
  for (let i = 0; i < 4 * 120; i++) { w.t += DT; const inp = b.think(DT, w); e.m.step(DT, inp); if (e.m.y < -4) climbed = true; }
  ok(!climbed && e.m.x < 40 * T, `stays on its side (x ${e.m.x.toFixed(0)})`); }
// 6. fire tokens: at most two shooters at once
{ const L = level(); const p = body(L, 100, 1), sq = new Squad(2), w = world(L, p, sq);
  const bs = [500, 540, 580, 620].map((x) => { const e = body(L, x, -1); const b = new Brain(e, { kind: 'tet', zone: [440, 700], diff: DIFF.hard }); b.alarm(100, 0, 1); return b; });
  let most = 0;
  for (let i = 0; i < 6 * 120; i++) { w.t += DT; for (const b of bs) { const inp = b.think(DT, w); b.ch.m.step(DT, inp); } most = Math.max(most, sq.hold.size); }
  ok(most > 0 && most <= 2, `shooters at once ≤ 2 (max ${most})`); }
// 7. the shield trooper closes in and asks for a bash
{ const L = level(); const p = body(L, 100, 1), e = body(L, 260, -1, null), b = new Brain(e, { kind: 'kal', zone: [60, 300] });
  const w = world(L, p); b.alarm(100, 0, 1);
  let bashed = false;
  for (let i = 0; i < 6 * 120; i++) { w.t += DT; const inp = b.think(DT, w); e.m.step(DT, inp); if (b.bashReq) { bashed = true; b.bashReq = false; } }
  ok(bashed && Math.abs(e.m.x - 100) < 50, `shield trooper reached and bashed (x ${e.m.x.toFixed(0)})`); }
// 8. the rusher climbs over the block to reach the player
{ const L = level(); const p = body(L, 200, 1), e = body(L, 420, -1, 'ramrod'), b = new Brain(e, { kind: 'huc', zone: [100, 500] });
  const w = world(L, p); b.alarm(200, 0, 1);
  run(b, w, 4);
  ok(e.m.x < 320, `rusher got past the block (x ${e.m.x.toFixed(0)})`); }
console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
