// The series' shots (tools/game/series/): each builds a scene the tracer takes, every prim has a
// shape and a material, every picture a material asks for is painted for that shot, the camera
// is somewhere sensible, the lines under them are written. Run: node tools/game/series.test.mjs
import { compile } from './plate/trace.js';
import { SHOTS } from './series/shots.js';

let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) passes++; else { fails++; console.log('FAIL', msg); } };
const camFor = (s, W, H) => ({ W, H, f: (s.cam.mm / 36) * W, cx: W / 2, cy: H / 2, p: s.cam.pos.slice(), yaw: s.cam.yaw || 0, pitch: s.cam.pitch || 0 });

ok(SHOTS.length === 30, `thirty shots (${SHOTS.length})`);
ok(new Set(SHOTS.map((s) => s.id)).size === SHOTS.length, 'ids are unique');
ok(SHOTS.every((s, i) => s.id === String(i + 1).padStart(2, '0')), 'ids run 01 to 30 in order');
for (const s of SHOTS) {
  const spec = s.scene(camFor(s, 96, 40), s);
  const matOf = (q) => (typeof q.m === 'string' ? spec.mats[q.m] : q.m);
  ok(spec.prims.length > 0 && spec.lights.length > 0, `${s.id}: ${spec.prims.length} prims, ${spec.lights.length} lamps`);
  ok(spec.prims.every((q) => (q.box || q.cyl || q.sph || q.cap || q.ell || q.hull) && matOf(q)), `${s.id}: every prim has a shape and a material`);
  const want = new Set(spec.prims.map((q) => ({ ...matOf(q), ...(q.o || {}) }).tex).filter(Boolean));
  ok([...want].every((t) => s.tex.includes(t)), `${s.id}: its pictures are painted (${[...want].join(', ') || 'none'})`);
  const tex = Object.fromEntries(s.tex.map((t) => [t, { w: 1, h: 1, data: new Float32Array(4) }]));
  let built = true; try { compile({ ...spec, textures: tex }); } catch (e) { built = false; console.log(e.message); }
  ok(built, `${s.id}: the tracer takes it`);
  ok(Number.isFinite(s.cam.yaw) && Number.isFinite(s.cam.pitch) && Math.abs(s.cam.pitch) < 1.2 && s.cam.mm >= 14 && s.cam.mm <= 100, `${s.id}: a sensible camera`);
  ok(s.name && s.cap && s.cap.length <= 72, `${s.id}: a name and a line under it`);
}

console.log(`series: ${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
