// Mission layout checks for KOR (docs §10.41). Run: node tools/game/missions.test.mjs
//
// For every campaign mission: enemies can stand on open ground (not inside a wall), every
// wave an objective calls exists, a boss objective has a boss, a hack has its gate
// and terminal, and every painted piece fits an atlas page at the highest bake
// density (a sprite too wide stops the bake: docs §10.17).
globalThis.DOMMatrix = class { constructor() { Object.assign(this, { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }); } multiply() { return this; } translate() { return this; } scale() { return this; } rotate() { return this; } inverse() { return this; } };
const base = new URL('../../public/game/js/', import.meta.url).href;
const { buildMission1 } = await import(base + 'art/env/mission1.js');
const { buildMission2 } = await import(base + 'art/env/mission2.js');
const { buildMission3 } = await import(base + 'art/env/mission3.js');
const A2 = await import(base + 'art/env/act2.js');
const A3 = await import(base + 'art/env/act3.js');
const { MISSIONS } = await import(base + 'ui/data.js');
const { CHARS } = await import(base + 'game/chars.js').catch(() => ({ CHARS: null }));

let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) passes++; else { fails++; console.log('FAIL', msg); } };
const BUILD = { m1: buildMission1, m2: buildMission2, m3: buildMission3, m4: A2.buildMission4, m5: A2.buildMission5, m6: A2.buildMission6, m7: A2.buildMission7, m8: A3.buildMission8, m9: A3.buildMission9, m10: A3.buildMission10 };
const PX = 7, PAGE = 2048; // the highest bake density, px a world unit; an atlas page

ok(MISSIONS.length === 10 && MISSIONS.every((m) => m.ready && BUILD[m.id]), 'ten missions, all playable, all built');
for (const [id, f] of Object.entries(BUILD)) {
  const M = f();
  // a spawn on a crate's edge is moved to open ground by the scene (openSpot): there must be some near
  const free = (e) => { for (let k = 0; k < 9; k++) { const x = e.x + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 6; if (!M.level.solidBox(x - 1, e.y - 30, x + 1, e.y - 2)) return true; } return false; };
  const stuck = M.enemies.filter((e) => !free(e));
  ok(!stuck.length, `${id}: enemies on open ground (${stuck.map((e) => `${e.id}@${e.x / 8}`).join(' ')})`);
  const waves = new Set(M.enemies.filter((e) => e.wave).map((e) => e.wave));
  for (const o of M.objectives) {
    for (const [, w] of o.waves || []) ok(waves.has(w), `${id}: hold wave ${w} exists`);
    for (const [, w] of o.phases || []) ok(waves.has(w), `${id}: boss phase wave ${w} exists`);
    if (o.type === 'boss') ok(!!o.boss || M.enemies.some((e) => e.boss), `${id}: the boss objective has a boss`);
    if (o.type === 'boss' && o.boss && CHARS) ok(!!CHARS[o.boss.id], `${id}: boss ${o.boss.id} is a character`);
    if (o.type === 'hack') ok(!!(M.gate && M.terminal), `${id}: the hack has a gate and a terminal`);
  }
  if (M.gate) ok(waves.has(M.gate.wave || 1), `${id}: the gate's squad exists`);
  ok(M.objectives.length === 4, `${id}: four objectives (the brief lists four)`);
  const last = M.objectives[M.objectives.length - 1];
  ok(last.type === 'boss' || (M.extract && last.type === 'reach'), `${id}: ends at a boss or the extraction`);
  for (const q of [...M.props, ...M.front, ...M.deco]) {
    if (!Array.isArray(q.box)) continue;
    const w = (q.box[2] - q.box[0]) * PX + 8, h = (q.box[3] - q.box[1]) * PX + 8;
    ok(w <= PAGE && h <= PAGE, `${id}: ${q.name} fits a page (${Math.round(w)}×${Math.round(h)})`);
  }
}
console.log(`missions: ${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
