// Ragdoll stability tests for KOR. Run: node tools/game/ragdoll.test.mjs
globalThis.DOMMatrix ??= class {}; // art modules touch it at import time
const { Pose, Joints, solvePose } = await import('../../public/game/js/anim/rig.js');
const { Ragdoll } = await import('../../public/game/js/anim/ragdoll.js');
const { Level, T } = await import('../../public/game/js/phys/level.js');

let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) passes++; else { fails++; console.log('FAIL', msg); } };
const rows = []; for (let i = 0; i < 20; i++) rows.push('.'.repeat(60)); rows.push('#'.repeat(60)); rows.push('#'.repeat(60));
const L = new Level(rows, -20 * T);
const P = new Pose(), J = new Joints(); solvePose(P, J);
const cases = [['still', 1, 0, null], ['shot from the right', 1, 0, [-1, 140]], ['mirrored, shot from the left', -1, 0, [1, 140]], ['running', 1, 200, [-1, 100]], ['headshot', 1, 0, [-1, 200]]];
for (const [name, f, vx, push] of cases) {
  const r = new Ragdoll(J, f, 200, 0, vx, 0);
  if (push) r.push(200, -50, push[0] * push[1], -74);
  let minY = 0;
  for (let i = 0; i < 600; i++) { r.step(1 / 120, L); for (let k = 0; k < 11; k++) minY = Math.min(minY, r.y[k]); }
  if (vx) ok(r.x[0] - 200 > 20, `${name}: keeps its momentum (dx ${(r.x[0] - 200).toFixed(0)})`);
  const lying = Math.max(...r.y) - Math.min(...r.y) < 20;
  ok(r.settled, `${name}: settles`);
  ok(minY > -80, `${name}: never flies up (min y ${minY.toFixed(0)})`);
  ok(lying && Math.max(...r.y) <= 0.01, `${name}: lies on the ground, nothing below it`);
  if (push && !vx) ok(Math.sign(r.x[0] - 200) === push[0] || Math.abs(r.x[0] - 200) < 8, `${name}: falls away from the shot (dx ${(r.x[0] - 200).toFixed(0)})`);
  // drawn joints keep bone lengths
  const J2 = new Joints(); r.pose(J2, r.x[0], r.y[0] + 31);
  const len = Math.hypot(J2.nKnee[0] - J2.nHip[0], J2.nKnee[1] - J2.nHip[1]);
  ok(Math.abs(len - 15.2) < 0.05, `${name}: thigh length kept (${len.toFixed(2)})`);
}
// docs/KOR_STORY_CINEMATIC.md §10.19: bodies caught on a deck above them or
// on a wall, left standing or on their heads
const level = (edit) => { const r = rows.map((x) => x.split('')); edit(r); return new Level(r.map((x) => x.join('')), -20 * T); };
const run = (L2, x, f, push) => {
  const r = new Ragdoll(J, f, x, 0, 0, 0);
  if (push) r.push(x, -50, push[0] * push[1], -74);
  let minY = 0;
  for (let i = 0; i < 720; i++) { r.step(1 / 120, L2); for (let k = 0; k < 11; k++) minY = Math.min(minY, r.y[k]); }
  return { r, minY, spread: Math.max(...r.y) - Math.min(...r.y) };
};
{
  // a one-way deck at chest height (its head reaches through it, as on a scaffold)
  const L2 = level((r) => { for (let tx = 20; tx < 32; tx++) r[14][tx] = '='; });
  for (const [name, push] of [['still', null], ['shot from the left', [1, 140]], ['shot from the right', [-1, 140]]]) {
    const { r, spread } = run(L2, 200, 1, push);
    ok(Math.min(...r.y) > -20 && spread < 20, `under a deck, ${name}: falls to the street, not hung from the deck (top ${Math.min(...r.y).toFixed(0)})`);
  }
}
{
  // a wall right in front of it; shot into it, and shot away from it
  const L2 = level((r) => { for (let ty = 8; ty < 20; ty++) { r[ty][27] = '#'; r[ty][28] = '#'; } });
  for (const [name, f, push] of [['shot into a wall', 1, [1, 140]], ['standing against a wall', 1, null], ['facing a wall, shot from it', 1, [-1, 140]]]) {
    const { r, minY, spread } = run(L2, 210, f, push);
    ok(minY > -80, `${name}: no limb climbs the wall (min y ${minY.toFixed(0)})`);
    ok(spread < 20 && Math.max(...r.y) <= 0.01, `${name}: ends lying on the street, not standing or on its head (spread ${spread.toFixed(0)})`);
  }
}
console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
