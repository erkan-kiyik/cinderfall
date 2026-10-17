// Plate tracer checks (tools/lab/plate/):
//  - a plate pixel's camera ray lands on the world point the shot's camera
//    (js/cine/cam.js) projects to that pixel, and Plate.at agrees with both
//  - boxes, cylinders, spheres, hulls and the ground are hit where they are,
//    with the right normals; shadow rays stop at the first thing
//  - lamps light, shadows darken, the film curve stays in range
//  - each shot's camera is the plate's, so the moving things land on it
// Run: node tools/lab/plate.test.mjs
import { compile, tracer, renderBand, film } from './plate/trace.js';
import * as SCENES from './plate/scenes.js';
import { Cam } from '../../public/lab/js/cine/cam.js';
import { PLATES, plateCam } from '../../public/lab/js/cine/plates.js';

let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) passes++; else { fails++; console.log('FAIL', msg); } };
const near = (a, b, e) => Math.abs(a - b) <= e;

// the camera: rays against Cam.project, for every plate's camera
for (const name of Object.keys(PLATES)) {
  const P = PLATES[name], pc = plateCam(name, 1), sc = compile({ W: pc.W, H: pc.H, cam: pc, prims: [] }), tr = tracer(sc);
  // the shot's camera at the plate's core width; the plate is that frame plus a margin
  const cam = new Cam(P.core, Math.round(P.core / 2.39)); cam.mm = P.mm; cam.pos = P.pos.slice(); cam.yaw = P.yaw; cam.pitch = P.pitch; cam.update(0);
  const ox = (P.W - cam.W) / 2, oy = (P.H - cam.H) / 2;
  let worst = 0, worstAt = 0;
  for (const [u, v] of [[0.1, 0.2], [0.5, 0.5], [0.9, 0.8], [0.3, 0.9], [0.75, 0.1]]) {
    const px = u * P.W, py = v * P.H, d = tr.ray(px, py), p = [pc.p[0] + d[0] * 20, pc.p[1] + d[1] * 20, pc.p[2] + d[2] * 20];
    const q = cam.project(...p), e = Math.hypot(q[0] + ox - px, q[1] + oy - py);
    worst = Math.max(worst, e);
    const a = atOf(P, p); worstAt = Math.max(worstAt, Math.hypot(a[0] - px, a[1] - py));
  }
  ok(worst < 1e-6, `${name}: plate rays land where the shot's camera projects them (${worst.toExponential(1)} px)`);
  ok(worstAt < 1e-6, `${name}: Plate.at agrees (${worstAt.toExponential(1)} px)`);
}
// Plate.at without the DOM: the same formula as js/cine/plates.js
function atOf(P, [x, y, z]) {
  const fp = (P.mm / 36) * P.core, cy = Math.cos(P.yaw), sy = Math.sin(P.yaw), cp = Math.cos(P.pitch), sp = Math.sin(P.pitch);
  const dx = x - P.pos[0], dy = y - P.pos[1], dz = z - P.pos[2];
  const x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy, y2 = dy * cp - z1 * sp, z2 = dy * sp + z1 * cp;
  return [P.W / 2 + (x1 / z2) * fp, P.H / 2 - (y2 / z2) * fp];
}

// intersections
{
  const sc = compile({ W: 8, H: 8, cam: { p: [0, 1, 0], yaw: 0, pitch: 0, f: 8, cx: 4, cy: 4 }, ground: { y: 0, m: { kind: 'flat' } }, prims: [
    { box: [-1, 0, 5, 1, 2, 6], m: { kind: 'flat' } },
    { cyl: [4, 5, 0.5, 0, 3], m: { kind: 'flat' } },
    { sph: [-4, 1, 5, 0.5], m: { kind: 'flat' } },
    { hull: { planes: [[1, 0, 0, 0.5], [-1, 0, 0, 0.5], [0, -1, 0, 0], [0, 1, 0, 1], [0, 0, 1, 10.5], [0, 0, -1, -9.5]], aabb: [-0.5, 0, 9.5, 0.5, 1, 10.5] }, m: { kind: 'flat' }, noShadow: true },
  ] });
  const tr = tracer(sc), T = tr.T;
  ok(tr.hit(0, 1, 0, 0, 0, 1, 1e4, false, true) && near(T.t, 5, 1e-9) && T.nz === -1, 'box: front face at z 5, facing us');
  ok(tr.hit(4, 1, 0, 0, 0, 1, 1e4, false, true) && near(T.t, 4.5, 1e-9) && near(T.nz, -1, 1e-9), 'cylinder: its side at z 4.5');
  ok(tr.hit(4, 5, 5, 0, -1, 0, 1e4, false, true) && near(T.t, 2, 1e-9) && T.ny === 1, 'cylinder: its top cap');
  ok(tr.hit(-4, 1, 0, 0, 0, 1, 1e4, false, true) && near(T.t, 4.5, 1e-9), 'sphere');
  ok(tr.hit(0, 0.5, 8, 0, 0, 1, 1e4, false, true) && near(T.t, 1.5, 1e-9) && near(T.nz, -1, 1e-9), 'hull: the near plane');
  ok(tr.hit(0, 1, 0, 0, -1, 0.0, 1e4, false, true) && T.i === -2 && near(T.t, 1, 1e-9), 'the ground');
  ok(!tr.hit(0, 0.5, 8, 0, 0, 1, 1e4, true, false), 'shadow rays pass a prim that casts none');
  ok(tr.hit(0, 1, 0, 0, 0, 1, 4.9, true, false) === false, 'a shadow ray stops short of the box');
  ok(tr.hit(0, 1, 0, 0, 0, 1, 5.1, true, false) === true, 'and is stopped by it');
}

// capsules and ellipsoids
{
  const s3 = Math.SQRT1_2;
  const sc = compile({ W: 8, H: 8, cam: { p: [0, 0, 0], yaw: 0, pitch: 0, f: 8, cx: 4, cy: 4 }, prims: [
    { cap: [-1, 0, 5, 1, 0, 5, 0.25], m: { kind: 'flat' } },
    { cap: [10, -1, 5, 10, 1, 5, 0.5], m: { kind: 'flat' } },
    { ell: { c: [0, 5, 5], axes: [[s3, s3, 0], [-s3, s3, 0], [0, 0, 1]], r: [2, 0.5, 0.3] }, m: { kind: 'flat' } },
  ] });
  const tr = tracer(sc), T = tr.T;
  ok(tr.hit(0, 0, 0, 0, 0, 1, 1e4, false, false) && near(T.t, 4.75, 1e-9) && near(T.nz, -1, 1e-9), 'capsule: its side');
  ok(tr.hit(-3, 0, 5, 1, 0, 0, 1e4, false, false) && near(T.t, 1.75, 1e-9) && near(T.nx, -1, 1e-9), 'capsule: the ball at its end');
  ok(tr.hit(10, 3, 5, 0, -1, 0, 1e4, false, false) && near(T.t, 1.5, 1e-9) && near(T.ny, 1, 1e-9), 'capsule: end on, along its axis');
  ok(tr.hit(0, 5, 0, 0, 0, 1, 1e4, false, false) && near(T.t, 4.7, 1e-9) && near(T.nz, -1, 1e-9), 'ellipsoid: through its thin axis');
  ok(tr.hit(-5 * s3 * 2, 5 - 5 * s3 * 2, 5, s3, s3, 0, 1e4, false, false) && near(T.t, 5 * 2 - 2, 1e-6), `ellipsoid: along its long axis (${T.t.toFixed(4)})`);
}

// the sun: a directional light, shadowed by a roof
{
  const spec = (roof) => ({ W: 8, H: 8, cam: { p: [0, 1, -3], yaw: 0, pitch: 0, f: 8, cx: 4, cy: 4 }, ground: { y: 0, m: { kind: 'flat', col: [0.5, 0.5, 0.5] } },
    prims: roof ? [{ box: [-5, 3, -5, 5, 3.2, 5], m: { kind: 'flat' } }] : [], lights: [{ dir: [0, -1, 0], c: [1, 1, 1], I: 3 }],
    sky: { zen: [0, 0, 0], hor: [0, 0, 0], cloud: 0 }, amb: { sky: [0, 0, 0], gnd: [0, 0, 0] }, fog: { s: 0 }, ao: { n: 0 }, aa: false, refl: { streak: 0 } });
  const L = (tr) => { const out = [0, 0, 0], rf = [0, 0, 0, 0], am = [0, 0, 0], n = Math.hypot(1, 3); tr.shade(0, 1, -3, 0, -1 / n, 3 / n, 0, 0, 0, out, rf, am); return out[0]; };
  const a = L(tracer(compile(spec(false)))), b = L(tracer(compile(spec(true))));
  ok(a >= 0.5 / Math.PI * 3 * 0.999 && a < 0.5 / Math.PI * 3 * 1.1, `sun on grey ground: ρ/π·E (${a.toFixed(4)})`);
  ok(b < 1e-6, 'and none under a roof');
}

// one bounce: a floor under a roof, lit only through the open sides by a bright sky
{
  const spec = { W: 24, H: 10, cam: { p: [0, 1, -1], yaw: 0, pitch: -0.3, f: 20, cx: 12, cy: 5 }, ground: { y: 0, m: { kind: 'flat', col: [0.5, 0.5, 0.5] } },
    prims: [{ box: [-3, 3, -3, 3, 3.2, 3], m: { kind: 'flat' } }], lights: [],
    sky: { zen: [1, 1, 1], hor: [1, 1, 1], cloud: 0 }, amb: { sky: [0, 0, 0], gnd: [0, 0, 0] }, fog: { s: 0 }, ao: { n: 0 }, aa: false, refl: { streak: 0 }, gi: { n: 64, step: 1, fill: 0 }, hdr: true };
  const r = renderBand(compile(spec), 0, 10);
  let m = 0; for (let i = 0; i < r.fl.length; i += 3) m = Math.max(m, r.fl[i]);
  ok(m > 0.05 && m < 0.5, `gathered sky light under a roof stays between none and open sky (${m.toFixed(3)})`);
}

// light and shadow: a lamp over the ground, a box between them
{
  const spec = (block) => ({ W: 32, H: 14, cam: { p: [0, 1.6, -4], yaw: 0, pitch: -0.25, f: 30, cx: 16, cy: 7 }, ground: { y: 0, m: { kind: 'flat', col: [0.5, 0.5, 0.5] } },
    prims: block ? [{ box: [-0.5, 1.5, -0.5, 0.5, 1.6, 0.5], m: { kind: 'flat' } }] : [], lights: [{ p: [0, 3, 0], c: [1, 1, 1], I: 10, r: 0.01 }],
    sky: { zen: [0, 0, 0], hor: [0, 0, 0], cloud: 0 }, amb: { sky: [0, 0, 0], gnd: [0, 0, 0] }, fog: { s: 0 }, ao: { n: 0 }, aa: false, refl: { streak: 0 }, exposure: 1 });
  const lit = tracer(compile(spec(false))), dark = tracer(compile(spec(true)));
  const n = Math.hypot(0, 1.6, 4);
  const L = (tr) => { const out = [0, 0, 0], rf = [0, 0, 0, 0], am = [0, 0, 0]; tr.shade(0, 1.6, -4, 0 / n, -1.6 / n, 4 / n, 0, 0, 0, out, rf, am); return out[0]; };
  const a = L(lit), b = L(dark);
  const lam = 0.5 / Math.PI * 10 / 9;
  ok(a >= lam * 0.999 && a <= lam * 1.08, `a lamp 3 m over grey ground: ρ/π·E and a little sheen (${a.toFixed(4)} vs ${lam.toFixed(4)})`);
  ok(b < a * 0.01, 'the box between them puts it in shadow');
  const px = renderBand(compile(spec(false)), 0, 14);
  let bad = 0; for (const v of px) if (!(v >= 0 && v <= 255)) bad++;
  ok(bad === 0 && px.length === 32 * 14 * 4, 'a band renders to bytes');
  const f = film(new Float32Array([0, 0, 0, 1e6, 1e6, 1e6]), 2, 1, 1);
  ok(f[0] <= 2 && f[4] >= 253, 'the film curve: black stays black, a blaze clips white');
}

// every plate has a scene, and its scene builds
for (const name of Object.keys(PLATES)) {
  ok(typeof SCENES[name] === 'function', `${name}: has a scene`);
  const spec = SCENES[name](plateCam(name, 1));
  ok(spec.prims.length > 20 && spec.lights.length > 0, `${name}: ${spec.prims.length} prims, ${spec.lights.length} lamps`);
  ok(spec.prims.every((q) => (q.box || q.cyl || q.sph || q.hull) && (typeof q.m === 'string' ? spec.mats[q.m] : q.m)), `${name}: every prim has a shape and a material`);
}

console.log(`plate: ${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
