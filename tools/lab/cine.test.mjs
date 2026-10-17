// Cinematic rig checks (docs/KOR_STORY_CINEMATIC.md §7):
//  - feet do not slide in stance (≤ 1 mm in the world)
//  - bone lengths stay fixed through the walk (≤ 0.5 mm)
//  - the IK solver reaches reachable targets and keeps lengths
// Run: node tools/lab/cine.test.mjs
import { Human, BONES, ik2, KITS, GAITS } from '../../public/lab/js/cine/human.js';

let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) passes++; else { fails++; console.log('FAIL', msg); } };
const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// IK
{
  const a = [0, 1, 0], t = [0.3, 0.2, 0.1];
  const m = ik2(a, t, 0.45, 0.44, [1, 0, 0]);
  ok(Math.abs(d3(a, m) - 0.45) < 1e-6, 'ik upper length');
  ok(Math.abs(d3(m, t) - 0.44) < 1e-6, 'ik lower length reaches the target');
  ok(m[0] > 0.1, 'ik bends toward the pole');
}
for (const kit of Object.keys(KITS)) for (const gait of Object.keys(GAITS)) {
  const h = new Human({ kit, gait, x: 0, z: 0, yaw: 0.3, seed: 3 });
  const H = h.H, dt = 1 / 120;
  let slide = 0, lenErr = 0, stance = { R: null, L: null }, roll = { R: null, L: null }, toeSlide = 0, toeLift = 0, heelSlide = 0, strike = { R: null, L: null };
  const L = { thigh: BONES.thigh * H, shin: BONES.shin * H, upper: BONES.upper * H, fore: BONES.fore * H };
  for (let i = 0; i < 120 * 6; i++) {
    h.step(dt);
    const J = h.J, ph = h.phase;
    for (const [side, K] of [[1, 'R'], [-1, 'L']]) {
      const p = ((ph + (side > 0 ? 0 : 0.5)) % 1 + 1) % 1;
      // flat-foot stance only (heel strike and heel-off rotate the foot)
      if (p > 0.08 && p < 0.42) {
        if (stance[K]) slide = Math.max(slide, d3(stance[K], J['ankle' + K]));
        else stance[K] = J['ankle' + K].slice();
      } else stance[K] = null;
      // heel off: the foot rolls about the ball, the toe stays planted
      if (p > 0.45 && p < 0.61) {
        if (roll[K]) toeSlide = Math.max(toeSlide, Math.hypot(roll[K][0] - J['toe' + K][0], roll[K][2] - J['toe' + K][2]));
        else roll[K] = J['toe' + K].slice();
        toeLift = Math.max(toeLift, Math.abs(J['toe' + K][1] - roll[K][1]));
      } else roll[K] = null;
      // heel strike: the foot rolls down about the heel
      if (p > 0.0 && p < 0.07) {
        if (strike[K]) heelSlide = Math.max(heelSlide, d3(strike[K], J['heel' + K]));
        else strike[K] = J['heel' + K].slice();
      } else strike[K] = null;
      lenErr = Math.max(lenErr, Math.abs(d3(J['hip' + K], J['knee' + K]) - L.thigh), Math.abs(d3(J['knee' + K], J['ankle' + K]) - L.shin));
      lenErr = Math.max(lenErr, Math.abs(d3(J['sh' + K], J['elbow' + K]) - L.upper));
    }
  }
  ok(slide <= 0.001, `${kit}/${gait}: stance foot slides ${(slide * 1000).toFixed(2)} mm`);
  ok(lenErr <= 0.0005, `${kit}/${gait}: bone length error ${(lenErr * 1000).toFixed(3)} mm`);
  ok(toeSlide <= 0.004 && toeLift <= 0.004, `${kit}/${gait}: toe in heel-off slides ${(toeSlide * 1000).toFixed(2)} mm, lifts ${(toeLift * 1000).toFixed(2)} mm`);
  ok(heelSlide <= 0.004, `${kit}/${gait}: heel in heel strike slides ${(heelSlide * 1000).toFixed(2)} mm`);
}
console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
