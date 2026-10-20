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
console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
