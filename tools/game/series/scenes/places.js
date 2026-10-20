// KOR — series: the other places. The fence on the night of the Quenching
// (a flare in the mud, the trucks' lights through the wire); the cast house
// inside, tapping and cold; a wall of posters; the alley behind the
// basement; the foundry hall; the metro; the drone works; the tower's lobby;
// the embers of the title.
import { K, V, wall, bar, obox, prismX, slab } from './common.js';
import { frustum } from './rooms.js';
import { rng } from '../../../../public/game/js/cine/noise.js';

const RAIN_NIGHT = { sky: { zen: [0.003, 0.0035, 0.005], hor: [0.025, 0.02, 0.016], cloud: 1, cloudCol: [0.03, 0.02, 0.015], scale: 0.3, seed: 91 }, amb: { sky: [0.004, 0.005, 0.008], gnd: [0.002, 0.002, 0.002] } };
const spec = (cam, P, L, mats, o) => ({ W: cam.W, H: cam.H, cam, prims: P, mats, lights: L, ao: { n: 8, d: 1.5 }, refl: { streak: Math.round(cam.W * 0.01) }, ...o });

// the fence: chain-link on posts, barbed wire on top; beyond it the mud of the yard, a flare
// dropped in it burning red, the armoured trucks with their lights on us through the rain
export function fence(cam, o = {}) {
  const P = [], add = (q) => P.push(q), L = [];
  add({ box: [-30, 0.04, 3.995, 30, 2.2, 4.005], m: 'mesh', cut: true });
  for (let x = -30; x <= 30; x += 3) { add({ cyl: [x, 4.05, 0.032, 0, 2.5], m: 'post' }); add({ hull: bar([x, 2.48, 4.05], [x, 2.78, 3.75], 0.03, 0.03), m: 'post' }); }
  add({ hull: bar([-30, 2.18, 4.04], [30, 2.18, 4.04], 0.03, 0.03), m: 'post' });
  for (const [y, z] of [[2.55, 3.95], [2.65, 3.85], [2.75, 3.76]]) add({ cap: [-30, y, z, 30, y - 0.02, z, 0.0035], m: 'wire' });
  // the flare in the mud, and the ruts
  add({ cap: [0.55, 0.035, 7.4, 0.82, 0.045, 7.55, 0.018], m: 'flareBody' });
  add({ sph: [0.84, 0.05, 7.56, 0.024], m: 'flare', lamp: true });
  L.push({ p: [0.86, 0.12, 7.56], c: [1, 0.12, 0.05], I: o.flareI ?? 1.6, r: 0.03, vol: 1.0 });
  // the trucks: an armoured body, a cab, wheels, a light bar; the lights on us
  const trucks = [[-9, 34, 0.25], [6, 42, -0.2], [-1, 58, 0.1]];
  for (const [x, z, yaw] of trucks) {
    const c = Math.cos(yaw), s = Math.sin(yaw), ax = [c, 0, -s], az = [s, 0, c];
    add({ hull: obox([x, 1.9, z + 1.2], [ax, [0, 1, 0], az], [1.25, 1.2, 2.6]), m: 'truck' });
    add({ hull: obox([x - s * 2.1, 1.6, z - c * 2.1 + 1.2], [ax, [0, 1, 0], az], [1.2, 0.9, 0.9]), m: 'truck' });
    for (const [dx, dz] of [[-1.2, -1.6], [1.2, -1.6], [-1.2, 1.8], [1.2, 1.8]]) { const wx = x + dx * c + dz * s, wz = z + 1.2 - dx * s + dz * c; add({ hull: { ...prismX(0, 0.55, 0, 0.55, 0.35), planes: prismX(wx, 0.55, wz, 0.55, 0.35).planes, aabb: prismX(wx, 0.55, wz, 0.55, 0.35).aabb }, m: 'tyre' }); }
    const lx = x - s * 3.05, lz = z - c * 3.05 + 1.2;
    // the light bar on the cab roof, swung to sweep the yard rather than at us
    const sw = x < -5 ? [0.85, -0.1, -0.5] : x > 3 ? [-0.9, -0.12, -0.42] : [0.35, -0.08, -0.93];
    for (const k of [-0.6, 0.6]) { const px = lx + k * c, pz = lz - k * s; add({ sph: [px, 2.75, pz, 0.12], m: 'lens', lamp: true }); L.push({ p: [px + sw[0] * 0.2, 2.75, pz + sw[2] * 0.2], c: K(5600), I: o.truckI ?? 5000, spot: { d: sw, c0: Math.cos(0.08), c1: Math.cos(0.035) }, r: 0.12, shafts: true, vol: 0.6 }); }
  }
  // the works far off, glowing; a dark line of sheds
  add({ box: [-200, 0, 260, 200, 18, 280], m: 'shed' });
  add({ cyl: [40, 300, 9, 0, 70], m: 'shed' });
  L.push({ p: [40, 30, 290], c: K(1700), I: 5000, r: 6, vol: 0.35, shadow: false });
  return spec(cam, P, L, {
    mesh: { kind: 'image', tex: 'chainlink', tile: [250, 9.2], ro: 0.35, wet: 0.5 },
    post: { kind: 'metal', col: [0.3, 0.3, 0.3], ro: 0.35, metal: 0.8, wet: 0.5 }, wire: { kind: 'metal', col: [0.25, 0.25, 0.25], ro: 0.3, metal: 0.8 },
    flareBody: { kind: 'flat', col: [0.35, 0.03, 0.02], ro: 0.5 }, flare: { kind: 'emit', e: [4, 0.25, 0.1] },
    truck: { kind: 'panel', col: [0.06, 0.07, 0.08], pw: 1.2, wet: 0.6 }, tyre: { kind: 'flat', col: [0.015, 0.015, 0.015], ro: 0.8 },
    lens: { kind: 'emit', e: K(5600, 30) }, shed: { kind: 'flat', col: [0.02, 0.018, 0.016], ro: 0.9 },
    mud: { kind: 'asphalt', col: [0.075, 0.06, 0.045], puddle: 0.6, wet: 0.22, seed: 4, cracks: 0 },
  }, {
    ground: { y: 0, m: 'mud' }, vs: 1, ...RAIN_NIGHT, refl: { streak: Math.round(cam.W * 0.004) },
    sky: { zen: [0.003, 0.003, 0.0035], hor: [0.035, 0.018, 0.01], cloud: 1, cloudCol: [0.045, 0.022, 0.012], scale: 0.25, seed: 61 },
    fog: { s: 0.012, g: 0.6, c: [0.003, 0.0025, 0.002], sky: 300 }, exposure: o.exposure ?? 1.5,
  });
}

// the cast house inside. Walls of sheet on a steel frame, a roof on trusses with a monitor along
// it; the hearth wall at the far end with the tap hole; the main runner down the floor in its
// refractory walls, branching to the ladle pits; the cast floor of sand; the overhead crane.
// state 'hot': the iron running, white-orange, lighting everything from below, the fume going
// up; 'cold': the runners full of grey iron gone solid, the light of day through holes in the roof
export function castHouse(cam, o = {}) {
  const hot = o.state === 'hot', P = [], add = (q) => P.push(q), L = [], r = rng(5);
  const X = 16, Z0 = -12, Z1 = 32, H = 17;
  // floor, walls, the roof (holes in it when cold), the trusses
  add({ box: [-X - 1, -0.3, Z0 - 1, X + 1, 0, Z1 + 1], m: 'sand' });
  P.push(...wall(-X, X, 0, H, Z0 - 0.3, Z0, [{ x0: -3, x1: 3, y0: 0, y1: 7 }], 'clad'));
  for (const [xa, xb] of [[-X - 0.3, -X], [X, X + 0.3]]) add({ box: [xa, 0, Z0, xb, H, Z1], m: 'clad' });
  const holes = hot ? [] : [[-6, 4, -2, 9], [3, 14, 8, 18], [-4, 4, 24, 28]];
  for (let z = Z0; z < Z1; z += 4) for (let x = -X; x < X; x += 4) { if (holes.some(([a, b, c, d]) => x >= a && x < b && z >= c && z < d)) continue; for (const s of [-1, 1]) { if ((x + 2) * s < 0) continue; const y0 = H - 0.25 * Math.abs(x), y1 = H - 0.25 * Math.abs(x + 4); add({ hull: slab([[x, y0 + 0.1, z], [x + 4, y1 + 0.1, z], [x + 4, y1 + 0.1, z + 4], [x, y0 + 0.1, z + 4]], 0.06), m: 'roof' }); } }
  for (let z = Z0 + 2; z < Z1; z += 6) {
    add({ hull: bar([-X, H - 4, z], [X, H - 4, z], 0.25, 0.4), m: 'steel' });
    add({ hull: bar([-X, H - 4, z], [0, H, z], 0.25, 0.3), m: 'steel' }); add({ hull: bar([X, H - 4, z], [0, H, z], 0.25, 0.3), m: 'steel' });
    for (const k of [-0.66, -0.33, 0.33, 0.66]) add({ hull: bar([k * X, H - 4, z], [k * X * 0.5, H - 4 + 4 * (1 - Math.abs(k) * 0.75), z], 0.12, 0.12), m: 'steel' });
    for (const s of [-1, 1]) add({ box: [s * X - 0.35, 0, z - 0.35, s * X + 0.35, H - 4, z + 0.35], m: 'steel' });
  }
  // the crane rails and the crane, parked over the runner
  for (const s of [-1, 1]) add({ box: [s * (X - 0.8) - 0.4, 11, Z0, s * (X - 0.8) + 0.4, 11.8, Z1], m: 'steel' });
  add({ box: [-X + 0.5, 11.8, 14, X - 0.5, 13.2, 16], m: 'craneY' });
  add({ box: [-2, 10.8, 13.6, 2, 11.8, 16.4], m: 'craneY' });
  add({ cap: [0, 10.8, 15, 0, 6.5, 15, 0.025], m: 'steel' }); add({ hull: bar([-0.5, 6.4, 15], [0.5, 6.4, 15], 0.2, 0.25), m: 'steel' });
  // the hearth wall and the tap hole, the clay gun and drill swung aside
  add({ box: [-X, 0, Z1 - 1.5, X, H, Z1], m: 'clad' });
  // the furnace's hearth comes through the wall: a drum of riveted plate, the bustle main round it,
  // the tuyere stocks going in, cooling pipes down its face
  add({ cyl: [0, Z1 + 3.5, 7.2, 0, H - 2], m: 'hearth' });
  add({ cyl: [0, Z1 + 3.5, 7.6, 0, 0.6], m: 'refractory' });
  for (let k = 0; k < 24; k++) { const a = Math.PI * (0.15 + 0.7 * k / 23) + Math.PI; const c = Math.cos(a), sn = Math.sin(a); add({ cap: [c * 8.6, 9.5, Z1 + 3.5 + sn * 8.6, c * 7.25, 6.2, Z1 + 3.5 + sn * 7.25, 0.12], m: 'gun' }); }
  for (let k = 0; k < 24; k++) { const a0 = Math.PI * (1 + k / 24), a1 = Math.PI * (1 + (k + 1) / 24); add({ cap: [Math.cos(a0) * 8.7, 9.6, Z1 + 3.5 + Math.sin(a0) * 8.7, Math.cos(a1) * 8.7, 9.6, Z1 + 3.5 + Math.sin(a1) * 8.7, 0.55], m: 'gun' }); }
  for (const a of [-0.5, -0.3, 0.3, 0.5]) { const x = Math.sin(a) * 7.35, z = Z1 + 3.5 - Math.cos(a) * 7.35; add({ cap: [x, 0.8, z, x, 13.5, z, 0.08], m: 'steel' }); }
  add({ box: [-1.4, 0, Z1 - 4.4, 1.4, 2.4, Z1 - 3.2], m: 'refractory' });
  add({ sph: [0, 1.25, Z1 - 4.42, 0.22], m: hot ? 'tap' : 'tapCold', lamp: hot });
  add({ hull: bar([3.5, 1.8, Z1 - 5.3], [1.2, 1.5, Z1 - 4.8], 0.4, 0.4), m: 'gun' }); add({ cyl: [4, Z1 - 5.6, 0.4, 0, 2], m: 'gun' });
  add({ hull: bar([-3.8, 1.9, Z1 - 5.8], [-1.6, 1.7, Z1 - 5.2], 0.25, 0.25), m: 'gun' });
  // the runners: the main one down the middle, the iron in it; branches to the ladle pits
  const runs = [[[0, Z1 - 4.4], [0, 8]], [[0, 8], [-6, 0]], [[0, 8], [6, 0]], [[0, 18], [-8, 12]]];
  for (const [[ax, az], [bx, bz]] of runs) {
    const d = V.norm([bx - ax, 0, bz - az]), n = [-d[2], 0, d[0]];
    for (const s of [-1, 1]) add({ hull: obox([(ax + bx) / 2 + n[0] * s * 0.42, 0.25, (az + bz) / 2 + n[2] * s * 0.42], [d, [0, 1, 0], n], [Math.hypot(bx - ax, bz - az) / 2 + 0.4, 0.25, 0.18]), m: 'refractory' });
    add({ hull: obox([(ax + bx) / 2, 0.42, (az + bz) / 2], [d, [0, 1, 0], n], [Math.hypot(bx - ax, bz - az) / 2 + 0.25, 0.04, 0.26]), m: hot ? 'iron' : 'ironCold', lamp: hot });
    if (hot) for (let k = 0.15; k < 1; k += 0.3) L.push({ p: [ax + (bx - ax) * k, 0.7, az + (bz - az) * k], c: K(1650), I: o.runI ?? 10, r: 0.3, vol: 0.35 });
  }
  // the ladle pits: a dark opening in the floor at the end of each branch, a ladle's rim in it
  for (const [x, z] of [[-6.6, -0.6], [6.6, -0.6], [-8.6, 11.4]]) { add({ box: [x - 1.6, -0.25, z - 1.6, x + 1.6, 0.01, z + 1.6], m: 'pit' }); add({ cyl: [x, z, 1.4, -0.2, 0.05], m: hot ? 'ladleHot' : 'rim' }); }
  // things left: a coat on a hook on the column, gloves on the runner wall, a tapping bar on the floor
  add({ box: [X - 0.36, 2.3, 9.7, X - 0.3, 2.36, 9.95], m: 'steel' });
  add({ box: [X - 0.75, 1.0, 9.6, X - 0.36, 2.35, 10.15], m: 'coat' });
  add({ box: [0.55, 0.5, 13.3, 0.75, 0.53, 13.45], m: 'glove' }); add({ box: [0.52, 0.5, 13.55, 0.72, 0.535, 13.7], m: 'glove' });
  add({ cap: [2.4, 0.04, 6, 4.8, 0.04, 9.2, 0.025], m: 'steel' });
  // lamps on the columns: high-bay fittings, all dead when cold but one
  for (const z of [Z0 + 8, Z0 + 20, Z0 + 32]) for (const s of [-1, 1]) { add({ hull: frustum(s * (X - 2), z, 0.35, 0.12, 9.2, 9.6), m: 'steel' }); if (hot || (z === Z0 + 20 && s > 0)) { add({ sph: [s * (X - 2), 9.15, z, 0.12], m: 'hb', lamp: true }); L.push({ p: [s * (X - 2), 9.0, z], c: K(hot ? 4200 : 3600), I: hot ? 4 : 12, r: 0.12, vol: 0.3 }); } }
  if (hot) { L.push({ p: [0, 1.3, Z1 - 4.8], c: K(1800), I: o.tapI ?? 60, r: 0.25, vol: 0.8 }); }
  else {
    L.push({ dir: V.norm(o.sun || [-0.15, -0.75, -0.65]), c: K(5800), I: o.sunI ?? 4, ang: 0.01, shafts: true, vol: o.shaftVol ?? 0.6, far: 40 });
    L.push({ p: [0, 3.5, Z0 + 1], c: K(6500), I: 25, r: 3, vol: 0, shadow: false });
  }
  return spec(cam, P, L, {
    sand: { kind: 'asphalt', col: hot ? [0.16, 0.12, 0.09] : [0.14, 0.12, 0.1], puddle: 0.9, wet: 0, seed: 8, cracks: 0 },
    clad: { kind: 'cladding', col: [0.1, 0.1, 0.095], rust: 0.8, wet: 0 }, roof: { kind: 'cladding', col: [0.08, 0.08, 0.075], rust: 0.6, wet: 0 },
    steel: { kind: 'metal', col: [0.06, 0.055, 0.05], ro: 0.6, wet: 0 }, craneY: { kind: 'panel', col: [0.3, 0.2, 0.03], pw: 3, wet: 0 },
    hearth: { kind: 'rust', lime: 0.5, fresh: 0.7, wet: 0 }, refractory: { kind: 'brick', col: [0.25, 0.16, 0.1], wet: 0, soot: [0.2, 0.8] },
    tap: { kind: 'emit', e: [14, 5, 1] }, tapCold: { kind: 'flat', col: [0.05, 0.045, 0.04], ro: 0.9 }, gun: { kind: 'rust', fresh: 0.4, lime: 0.1, wet: 0 },
    iron: { kind: 'emit', e: [8, 2.6, 0.5] }, ironCold: { kind: 'rust', col: [0.08, 0.075, 0.07], fresh: 0.2, lime: 0.05, plate: 0.6, plateW: 0.9, wet: 0 },
    pit: { kind: 'flat', col: [0.01, 0.01, 0.01], ro: 0.9 }, ladleHot: { kind: 'emit', e: [6, 2, 0.4] }, rim: { kind: 'rust', fresh: 0.6, wet: 0 },
    coat: { kind: 'fabric', col: [0.45, 0.43, 0.38], ro: 0.35, wet: 0 }, glove: { kind: 'fabric', col: [0.3, 0.24, 0.16], wet: 0 }, hb: { kind: 'emit', e: K(4000, 4) },
  }, {
    ground: null, vs: 1,
    sky: hot ? { zen: [0.002, 0.002, 0.002], hor: [0.004, 0.003, 0.002], cloud: 0 } : { zen: [0.3, 0.33, 0.38], hor: [0.5, 0.5, 0.52], cloud: 1, cloudCol: [0.4, 0.4, 0.42], scale: 0.4, seed: 3 },
    amb: hot ? { sky: [0.004, 0.002, 0.001], gnd: [0.01, 0.004, 0.001] } : { sky: [0.012, 0.013, 0.014], gnd: [0.006, 0.0055, 0.005] },
    fog: hot ? { s: 0.014, g: 0.55, c: [0.004, 0.002, 0.001], sky: 60 } : { s: 0.006, g: 0.7, c: [0.006, 0.006, 0.0062], sky: 60 },
    gi: hot ? null : { n: 20, step: 2, fill: 0.8 }, exposure: o.exposure ?? (hot ? 1.0 : 2.2),
  });
}

// a wall in the old town at night: plaster gone grey; the syndicate's poster pasted over an older
// notice, torn, KOR sprayed across it; a tube light over it flickering; a shutter, a drainpipe; a
// sodium lamp off to the left; the pavement wet, a puddle in front holding all of it
export function posterWall(cam, o = {}) {
  const P = [], add = (q) => P.push(q), L = [];
  add({ box: [-12, 0, 0, 12, 9, 0.6], m: 'plaster' });
  add({ box: [-12, 0, -0.02, 12, 0.35, 0.0], m: 'plinth' });
  add({ box: [-0.95, 1.05, -0.012, -0.05, 2.33, -0.006], m: 'poster', cut: true });
  add({ box: [-0.45, 0.9, -0.006, 0.35, 2.03, 0.0], m: 'notice' });
  for (const [x, y, w, h] of [[0.5, 1.6, 0.18, 0.3], [0.62, 1.1, 0.12, 0.2], [-1.4, 1.3, 0.2, 0.35]]) add({ box: [x, y, -0.004, x + w, y + h, 0], m: 'scrap' });
  add({ box: [1.6, 0, -0.08, 4.8, 3.0, 0.0], m: 'shutter' });
  add({ box: [1.5, 3.0, -0.25, 4.9, 3.5, 0.0], m: 'shutterBox' });
  add({ cyl: [-2.4, -0.07, 0.055, 0, 9], m: 'pipe' });
  // the tube light in its batten over the posters, flickering
  add({ box: [-1.2, 2.82, -0.16, 0.2, 2.9, 0.0], m: 'batten' });
  add({ cap: [-1.12, 2.8, -0.1, 0.12, 2.8, -0.1, 0.014], m: 'tube', lamp: true });
  if (!o.tubeOff) L.push({ p: [-0.5, 2.72, -0.16], c: K(5200), I: o.tubeI ?? 2.6, r: 0.3, vol: 0.4 });
  // the sodium lamp on a bracket, left
  add({ box: [-6.4, 4.6, -1.0, -6.3, 4.66, 0.0], m: 'pipe' }); add({ box: [-6.55, 4.48, -1.2, -6.15, 4.6, -0.8], m: 'pipe' });
  add({ box: [-6.5, 4.45, -1.15, -6.2, 4.48, -0.85], m: 'sodium', lamp: true });
  L.push({ p: [-6.35, 4.35, -1.0], c: K(2000), I: 28, r: 0.15, vol: 0.9 });
  // the kerb and the road
  add({ box: [-12, 0, -2.6, 12, 0.13, -2.4], m: 'kerb' });
  add({ box: [-12, -0.2, -12, 12, -0.02, -2.6], m: 'road' });
  return spec(cam, P, L, {
    plaster: { kind: 'plaster', col: [0.3, 0.29, 0.27], streak: 0.8, wet: 0.2 }, plinth: { kind: 'concrete', col: [0.2, 0.19, 0.18], lift: 0.35 },
    poster: { kind: 'image', tex: 'posterVanta', soak: 0.08, dirt: 0.2, wet: 0.15, ro: 0.7 }, notice: { kind: 'image', tex: 'sealNotice', soak: 0.1, dirt: 0.4, wet: 0.3 },
    scrap: { kind: 'flat', col: [0.4, 0.38, 0.33], ro: 0.8, wet: 0.3 }, shutter: { kind: 'shutter', col: [0.18, 0.2, 0.19] }, shutterBox: { kind: 'panel', col: [0.18, 0.19, 0.18], pw: 3.4 },
    pipe: { kind: 'metal', col: [0.08, 0.08, 0.08], ro: 0.4, wet: 0.6 }, batten: { kind: 'metal', col: [0.5, 0.5, 0.48], ro: 0.4 }, tube: o.tubeOff ? { kind: 'flat', col: [0.5, 0.52, 0.55], ro: 0.2 } : { kind: 'emit', e: K(5200, 3) },
    sodium: { kind: 'emit', e: K(2000, 2) }, kerb: { kind: 'concrete', col: [0.3, 0.29, 0.27], lift: 0.13 },
    road: { kind: 'asphalt', col: [0.06, 0.06, 0.06], puddle: 0.55, wet: 0.6 },
    pave: { kind: 'pavers', col: [0.2, 0.19, 0.18], a: 0.3, b: 0.3, jw: 0.008, puddle: 0.47, wet: 0.55, seed: 3 },
  }, { ground: { y: 0, m: 'pave' }, ...RAIN_NIGHT, fog: { s: 0.03, g: 0.55, c: [0.003, 0.003, 0.0035], sky: 60 }, exposure: o.exposure ?? 1.7 });
}

// the alley behind the basement: walls close either side, windows, cables, an air-conditioner
// dripping; the steel door open, the stair's light on the wet setts; a grate with steam; bins;
// at the end a sodium lamp, the light coming at us through the rain
export function alley(cam, o = {}) {
  const P = [], add = (q) => P.push(q), L = [], r = rng(13);
  for (const s of [-1, 1]) {
    const x0 = s * 1.7, wins = [];
    for (let z = 2; z < 40; z += 3.4) for (let fl = 1; fl < 4; fl++) if (r() < 0.7) wins.push({ x0: z, x1: z + 1.1, y0: fl * 3 + 0.7, y1: fl * 3 + 2.1 });
    const door = s < 0 ? [{ x0: 6, x1: 7, y0: 0, y1: 2.1 }] : [];
    for (const q of wall(0, 44, 0, 13, s < 0 ? -2.3 : 1.7, s < 0 ? -1.7 : 2.3, [...wins, ...door], s < 0 ? 'brick' : 'plaster')) { const b = q.box; P.push({ ...q, box: [b[2], b[1], b[0], b[5], b[4], b[3]] }); }
    for (const q of wins) { const lit = r() < 0.15; add({ box: [s < 0 ? -1.85 : 1.8, q.y0, q.x0, s < 0 ? -1.8 : 1.85, q.y1, q.x1], m: lit ? 'winLit' : 'glass' }); }
    for (let k = 0; k < 4; k++) { const z = 3 + k * 9 + r() * 3, y = 3.5 + Math.floor(r() * 3) * 3; add({ box: [s < 0 ? -1.7 : 1.25, y, z, s < 0 ? -1.25 : 1.7, y + 0.55, z + 0.8], m: 'unit' }); }
  }
  // the door: its leaf swung open against the wall, the stair behind lit
  add({ hull: obox([-1.25, 1.05, 6.08], [[0, 0, 1], [0, 1, 0], [1, 0, 0]], [0.04, 1.05, 0.5]), m: 'door' });
  add({ box: [-2.3, 0, 6, -2.25, 2.1, 7], m: 'stair' });
  L.push({ p: [-2.0, 1.9, 6.5], c: K(2700), I: o.doorI ?? 14, r: 0.08, vol: 0.4 });
  // steps up to it, a grate, bins, cables overhead
  add({ box: [-1.7, 0, 5.9, -1.35, 0.16, 7.1], m: 'step' });
  add({ box: [-0.4, 0, 10, 0.4, 0.012, 10.6], m: 'grate' });
  add({ box: [0.7, 0, 13, 1.65, 1.2, 14.6], m: 'bin' }); add({ hull: slab([[0.68, 1.2, 12.98], [1.68, 1.2, 12.98], [1.68, 1.42, 14.62], [0.68, 1.42, 14.62]], 0.03), m: 'bin' });
  add({ box: [-1.65, 0, 17, -1.1, 0.6, 17.6], m: 'crate', o: { col: [0.3, 0.22, 0.13] } });
  for (const [z, y] of [[4, 6.4], [9, 7.6], [15, 6.9], [22, 8.2]]) add({ cap: [-1.7, y, z, 1.7, y - 0.3, z + 0.5, 0.012], m: 'cable' });
  // the lamp at the end on its bracket
  add({ box: [1.7 - 1.1, 5.2, 30, 1.7, 5.26, 30.1], m: 'iron' }); add({ box: [0.4, 5.05, 29.85, 0.8, 5.2, 30.25], m: 'iron' }); add({ box: [0.45, 5.02, 29.9, 0.75, 5.05, 30.2], m: 'sodium', lamp: true });
  L.push({ p: [0.6, 4.9, 30.05], c: K(2000), I: o.lampI ?? 40, r: 0.15, vol: 1.2 });
  // the street beyond the alley's mouth, a cold light
  L.push({ p: [0, 4, 46], c: K(5000), I: 40, r: 1, vol: 0.6 });
  return spec(cam, P, L, {
    brick: { kind: 'brick', col: [0.22, 0.12, 0.08], wet: 0.4 }, plaster: { kind: 'plaster', col: [0.3, 0.28, 0.25], streak: 0.8, wet: 0.3 },
    glass: { kind: 'glass', panes: [2, 2] }, winLit: { kind: 'window', panes: [2, 2], e: K(3000, 0.5), blinds: 0.4 }, unit: { kind: 'panel', col: [0.4, 0.4, 0.38], pw: 0.3, wet: 0.4 },
    door: { kind: 'panel', col: [0.12, 0.14, 0.13], pw: 1.1, wet: 0.3 }, stair: { kind: 'emit', e: K(2700, 0.3) }, step: { kind: 'concrete', col: [0.25, 0.24, 0.22], lift: 0.16, wet: 0.5 },
    grate: { kind: 'metal', col: [0.05, 0.05, 0.05], ro: 0.4, wet: 0.7 }, bin: { kind: 'panel', col: [0.06, 0.12, 0.08], pw: 0.8, wet: 0.5 }, crate: { kind: 'crate' },
    cable: { kind: 'flat', col: [0.02, 0.02, 0.02], ro: 0.5 }, iron: { kind: 'metal', col: [0.05, 0.05, 0.05], ro: 0.4, wet: 0.5 }, sodium: { kind: 'emit', e: K(2000, 2.2) },
    setts: { kind: 'pavers', col: [0.17, 0.16, 0.15], a: 0.2, b: 0.13, jw: 0.012, puddle: 0.53, wet: 0.55 },
  }, { ground: { y: 0, m: 'setts' }, ...RAIN_NIGHT, fog: { s: 0.02, g: 0.6, c: [0.003, 0.003, 0.0032], sky: 80 }, exposure: o.exposure ?? 1.8 });
}

// the foundry hall: a nave of steel columns, the crane overhead, ladles and moulds on the floor,
// scrap; the roof's lights gone, daylight falling through the gaps in shafts
export function foundry(cam, o = {}) {
  const P = [], add = (q) => P.push(q), L = [], r = rng(31);
  const X = 18, Z1 = 90, H = 22;
  add({ box: [-X - 1, -0.3, -2, X + 1, 0, Z1 + 2], m: 'floor' });
  for (const s of [-1, 1]) add({ box: [s < 0 ? -X - 0.3 : X, 0, -2, s < 0 ? -X : X + 0.3, H, Z1], m: 'clad' });
  add({ box: [-X, 0, Z1, X, H, Z1 + 0.3], m: 'clad' });
  // the high windows down each side, grimed
  for (let z = 4; z < Z1 - 4; z += 8) for (const s of [-1, 1]) add({ box: [s < 0 ? -X + 0.01 : X - 0.05, 13, z, s < 0 ? -X + 0.05 : X - 0.01, 17, z + 5], m: 'grimeGlass' });
  // the roof with gaps, the trusses, the columns
  for (let z = -2; z < Z1; z += 4) for (let x = -X; x < X; x += 6) { if (r() < 0.12) continue; add({ box: [x, H, z, x + 6, H + 0.1, z + 4], m: 'roof' }); }
  for (let z = 0; z < Z1; z += 8) {
    for (const s of [-1, 1]) { add({ box: [s * (X - 1.5) - 0.3, 0, z - 0.3, s * (X - 1.5) + 0.3, H, z + 0.3], m: 'steel' }); add({ box: [s * (X - 1.5) - 0.5, 0, z - 0.5, s * (X - 1.5) + 0.5, 0.4, z + 0.5], m: 'concrete' }); }
    add({ hull: bar([-X, H - 2.5, z], [X, H - 2.5, z], 0.3, 0.5), m: 'steel' });
    for (let k = -3; k <= 3; k++) add({ hull: bar([k * X / 3.5, H - 2.5, z], [(k + (k < 0 ? 1 : -1) * 0.5) * X / 3.5, H, z], 0.15, 0.15), m: 'steel' });
  }
  for (const s of [-1, 1]) add({ box: [s * (X - 1.5) - 0.4, 14, 0, s * (X - 1.5) + 0.4, 14.9, Z1], m: 'steel' });
  add({ box: [-X + 1, 14.9, 38, X - 1, 16.4, 41], m: 'craneY' }); add({ box: [3, 13.9, 38.4, 7, 14.9, 40.6], m: 'craneY' });
  add({ cap: [5, 13.9, 39.5, 5, 7, 39.5, 0.03], m: 'steel' }); add({ hull: bar([4.2, 6.9, 39.5], [5.8, 6.9, 39.5], 0.3, 0.3), m: 'steel' });
  // ladles, moulds, scrap
  for (const [x, z, R] of [[-7, 22, 2.2], [-9, 30, 1.8], [8, 48, 2.4]]) { add({ hull: frustum(x, z, R * 0.82, R, 0.3, 3.2), m: 'ladle' }); add({ cyl: [x, z, R + 0.12, 3.0, 3.3], m: 'ladle' }); add({ box: [x - R - 0.5, 1.4, z - 0.2, x - R, 1.8, z + 0.2], m: 'ladle' }); add({ box: [x + R, 1.4, z - 0.2, x + R + 0.5, 1.8, z + 0.2], m: 'ladle' }); for (const dx of [-R * 0.7, R * 0.7]) add({ box: [x + dx - 0.2, 0, z - R * 0.6, x + dx + 0.2, 0.3, z + R * 0.6], m: 'steel' }); }
  for (let k = 0; k < 14; k++) { const x = 3 + r() * 10, z = 10 + k * 4.5 + r() * 2, w = 1 + r() * 2, d = 1 + r() * 2.5, h = 0.5 + r() * 1.2; add({ box: [x, 0, z, x + w, h, z + d], m: k % 3 ? 'mould' : 'concrete' }); }
  for (let k = 0; k < 60; k++) { const x = -14 + r() * 5, z = 52 + r() * 14, a = r() * 3, l = 0.5 + r() * 2.5; add({ hull: bar([x, 0.1 + r() * 0.8, z], [x + Math.cos(a) * l, 0.1 + r() * 0.8, z + Math.sin(a) * l], 0.06 + r() * 0.1, 0.05 + r() * 0.15), m: 'scrap' }); }
  // a path of light down the floor from the open door at the far end
  add({ box: [-3, 0, Z1 - 0.1, 3, 8, Z1 + 0.4], m: 'doorGlow' });
  L.push({ dir: V.norm([-0.2, -0.8, -0.55]), c: K(5600), I: o.sunI ?? 4, ang: 0.01, shafts: true, vol: 1.3, far: 60 });
  L.push({ p: [0, 4, Z1 + 3], c: K(6500), I: 900, r: 3, vol: 0.4, shadow: true });
  return spec(cam, P, L, {
    floor: { kind: 'concrete', col: [0.16, 0.15, 0.14], lift: 30, streak: 0, wet: 0.05 }, clad: { kind: 'cladding', col: [0.1, 0.1, 0.095], rust: 0.8, wet: 0 },
    grimeGlass: { kind: 'emit', e: [0.25, 0.27, 0.28] }, roof: { kind: 'cladding', col: [0.07, 0.07, 0.065], rust: 0.6, wet: 0 },
    steel: { kind: 'metal', col: [0.07, 0.065, 0.06], ro: 0.6, wet: 0 }, concrete: { kind: 'concrete', col: [0.22, 0.21, 0.2], lift: 0.4 },
    craneY: { kind: 'panel', col: [0.3, 0.2, 0.03], pw: 3, wet: 0 }, ladle: { kind: 'rust', fresh: 0.7, lime: 0.1, plate: 1, plateW: 1.5, wet: 0 },
    mould: { kind: 'rust', col: [0.06, 0.05, 0.045], fresh: 0.3, lime: 0, wet: 0 }, scrap: { kind: 'rust', fresh: 0.8, lime: 0, wet: 0 }, doorGlow: { kind: 'emit', e: K(6500, 1.2) },
  }, {
    ground: null, vs: 1, sky: { zen: [0.35, 0.38, 0.42], hor: [0.5, 0.5, 0.52], cloud: 1, cloudCol: [0.42, 0.42, 0.44], scale: 0.4, seed: 4 },
    amb: { sky: [0.01, 0.011, 0.012], gnd: [0.005, 0.0048, 0.0045] }, fog: { s: 0.02, g: 0.7, c: [0.008, 0.008, 0.0085], sky: 80 },
    gi: { n: 20, step: 2, fill: 0.8 }, exposure: o.exposure ?? 1.9,
  });
}

// the metro: a platform under a vault of white tile, the track in its pit, tube lights along the
// vault (some dead), the line's sign and the syndicate's poster on the far wall, a bench; the
// tunnel mouth dark at the end
export function metro(cam, o = {}) {
  const P = [], add = (q) => P.push(q), L = [];
  const Z1 = 70, PY = 1.0;
  add({ box: [0, 0, -2, 6, PY, Z1], m: 'platform' });
  add({ box: [0, PY - 0.005, -2, 0.5, PY + 0.003, Z1], m: 'edge' });
  add({ box: [-4.6, -0.3, -2, 0, 0, Z1 + 10], m: 'ballast' });
  for (const x of [-3.0, -1.56]) add({ box: [x - 0.035, 0, -2, x + 0.035, 0.16, Z1 + 10], m: 'rail' });
  for (let z = -2; z < Z1 + 10; z += 0.65) add({ box: [-3.6, 0, z, -1.0, 0.06, z + 0.24], m: 'sleeper' });
  // the walls and vault: polygon segments of tile
  add({ box: [-4.9, 0, -2, -4.6, 3.2, Z1], m: 'tile' }); add({ box: [6, PY, -2, 6.3, 4.2, Z1], m: 'tile' });
  const cx = 0.7, cy = 3.2, R = 5.6, n = 10;
  for (let k = 0; k < n; k++) { const a0 = Math.PI * k / n, a1 = Math.PI * (k + 1) / n; const p0 = [cx - R * Math.cos(a0), cy + R * Math.sin(a0) * 0.62], p1 = [cx - R * Math.cos(a1), cy + R * Math.sin(a1) * 0.62]; add({ hull: slab([[p0[0], p0[1], -2], [p1[0], p1[1], -2], [p1[0], p1[1], Z1], [p0[0], p0[1], Z1]], 0.2), m: 'tile' }); }
  // the end wall with the tunnel mouth
  P.push(...wall(-4.9, 6.3, 0, 7, Z1, Z1 + 0.5, [{ x0: -4.3, x1: -0.3, y0: 0, y1: 4.2 }], 'tile'));
  add({ box: [-4.3, 0, Z1 + 0.5, -0.3, 4.2, Z1 + 0.6], m: 'black' });
  // signs and posters on the far wall, benches on the platform
  for (const z of [8, 30, 52]) add({ box: [-4.6, 2.2, z, -4.58, 2.75, z + 2.8], m: 'sign' });
  for (const z of [16, 40]) add({ box: [-4.6, 1.0, z, -4.57, 2.4, z + 0.98], m: 'poster', cut: true });
  for (const z of [12, 34, 56]) { add({ box: [4.6, PY + 0.42, z, 5.1, PY + 0.47, z + 1.8], m: 'bench' }); for (const dz of [0.1, 1.6]) add({ box: [4.65, PY, z + dz, 5.05, PY + 0.42, z + dz + 0.1], m: 'steel' }); }
  // tube fittings along the vault: a few dead, one flickering low
  for (let z = 1, k = 0; z < Z1; z += 4.5, k++) {
    const on = !(k % 4 === 2 || k === 7), dim = k === 5;
    add({ box: [1.6, 6.4, z, 1.8, 6.5, z + 1.3], m: 'steel' });
    add({ cap: [1.7, 6.37, z + 0.05, 1.7, 6.37, z + 1.25, 0.018], m: on ? (dim ? 'tubeDim' : 'tube') : 'tubeOff', lamp: on });
    if (on) L.push({ p: [1.7, 6.3, z + 0.65], c: K(5400), I: dim ? 2 : (o.tubeI ?? 9), r: 0.5, vol: 0.2 });
  }
  return spec(cam, P, L, {
    platform: { kind: 'tile', col: [0.25, 0.24, 0.22], tw: 0.3, th: 0.3, gloss: 0.3, grime: 0.6, joint: [0.1, 0.1, 0.1] }, edge: { kind: 'flat', col: [0.45, 0.36, 0.05], ro: 0.6 },
    ballast: { kind: 'asphalt', col: [0.08, 0.075, 0.07], puddle: 0.7, wet: 0.2 }, rail: { kind: 'metal', col: [0.35, 0.34, 0.33], ro: 0.2, metal: 0.9 },
    sleeper: { kind: 'concrete', col: [0.2, 0.19, 0.18], lift: 0.3 }, tile: { kind: 'tile', col: [0.55, 0.54, 0.5], band: [1.8, 2.0], bandCol: [0.1, 0.25, 0.4], grime: 2.0, broken: 0.006 },
    black: { kind: 'flat', col: [0.0, 0.0, 0.0], ro: 1 }, sign: { kind: 'image', tex: 'metroSign', ro: 0.3 }, poster: { kind: 'image', tex: 'posterVanta', soak: 0.05, dirt: 0.3 },
    bench: { kind: 'wood', col: [0.16, 0.09, 0.05], pw: 0.1 }, steel: { kind: 'metal', col: [0.3, 0.3, 0.3], ro: 0.4 },
    tube: { kind: 'emit', e: K(5400, 4) }, tubeDim: { kind: 'emit', e: K(5400, 0.6) }, tubeOff: { kind: 'flat', col: [0.4, 0.4, 0.4], ro: 0.3 },
  }, { ground: null, vs: 1, sky: { zen: [0, 0, 0], hor: [0, 0, 0], cloud: 0 }, amb: { sky: [0.002, 0.002, 0.002], gnd: [0.001, 0.001, 0.001] }, fog: { s: 0.015, g: 0.5, c: [0.002, 0.002, 0.002], sky: 60 }, gi: { n: 16, step: 2, fill: 0.5 }, exposure: o.exposure ?? 1.4 });
}

// the drone works: a long line of frames on a conveyor, arms at the stations, rows of light
// panels overhead, the floor glossy; the syndicate's mark on the end wall
export function droneWorks(cam, o = {}) {
  const P = [], add = (q) => P.push(q), L = [], r = rng(41);
  const X = 14, Z1 = 70, H = 9;
  add({ box: [-X - 1, -0.3, -4, X + 1, 0, Z1 + 1], m: 'epoxy' });
  for (const s of [-1, 1]) add({ box: [s < 0 ? -X - 0.3 : X, 0, -4, s < 0 ? -X : X + 0.3, H, Z1], m: 'wallP' });
  add({ box: [-X, 0, Z1, X, H, Z1 + 0.3], m: 'wallP' });
  add({ box: [-X - 1, H, -4, X + 1, H + 0.3, Z1 + 1], m: 'ceil' });
  add({ box: [-3.6, 2.4, Z1 - 0.06, 0.2, 5.25, Z1 - 0.04], m: 'mark', cut: true });
  // the light panels in rows
  for (let z = 0; z < Z1; z += 5) for (const x of [-8, -2.5, 3, 8.5]) { add({ box: [x - 0.3, H - 0.08, z, x + 0.3, H - 0.02, z + 2.4], m: 'panel', lamp: true }); }
  for (let z = 2, k = 0; z < Z1; z += 10, k++) for (const x of [-5, 5.5]) L.push({ p: [x, H - 0.5, z], c: K(6500), I: o.panelI ?? 60, r: 1.2, vol: 0.3 });
  // the line: two conveyors, frames on them, arms at stations
  for (const lx of [-3, 3.5]) {
    add({ box: [lx - 0.6, 0, 0, lx + 0.6, 0.85, Z1 - 4], m: 'conv' }); add({ box: [lx - 0.62, 0.85, 0, lx + 0.62, 0.9, Z1 - 4], m: 'belt' });
    for (let z = 1.5; z < Z1 - 6; z += 2.4) {
      const y = 0.9, c = [lx, y + 0.12, z];
      add({ box: [c[0] - 0.12, y + 0.04, c[2] - 0.18, c[0] + 0.12, y + 0.16, c[2] + 0.18], m: 'body' });
      for (const [a, b] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const tip = [c[0] + a * 0.38, y + 0.14, c[2] + b * 0.38]; add({ hull: bar([c[0], y + 0.12, c[2]], tip, 0.035, 0.025), m: 'arm' }); if (r() < 0.8) add({ cyl: [tip[0], tip[2], 0.2, tip[1] + 0.02, tip[1] + 0.03], m: 'rotor' }); add({ cyl: [tip[0], tip[2], 0.03, tip[1] - 0.02, tip[1] + 0.03], m: 'motor' }); }
      add({ sph: [c[0], y + 0.06, c[2] - 0.17, 0.035], m: 'eye' });
    }
    for (let z = 6; z < Z1 - 6; z += 12) for (const s of [-1, 1]) {
      const bx = lx + s * 1.4; add({ cyl: [bx, z, 0.25, 0, 0.5], m: 'robot' });
      const j1 = [bx, 1.4, z], j2 = [bx - s * 0.6, 1.9, z + 0.3], j3 = [lx + s * 0.15, 1.25, z + 0.35];
      add({ cap: [bx, 0.5, z, ...j1, 0.13], m: 'robot' }); add({ cap: [...j1, ...j2, 0.1], m: 'robot' }); add({ cap: [...j2, ...j3, 0.07], m: 'robot' });
    }
  }
  // racks of finished ones along the right wall, stripes on the floor
  for (let z = 4; z < Z1 - 8; z += 6) { add({ box: [X - 1.2, 0, z, X - 0.2, 3.2, z + 4], m: 'rack' }); }
  for (const x of [-5, 1.5, 6]) add({ box: [x - 0.06, 0, 0, x + 0.06, 0.003, Z1], m: 'stripe' });
  return spec(cam, P, L, {
    epoxy: { kind: 'tile', col: [0.16, 0.17, 0.17], tw: 2.4, th: 2.4, gloss: 0.6, grime: 0.2, joint: [0.08, 0.08, 0.08], broken: 0 },
    wallP: { kind: 'metal', col: [0.3, 0.31, 0.32], ro: 0.6, wet: 0 }, ceil: { kind: 'panel', col: [0.15, 0.15, 0.16], pw: 2, wet: 0 },
    mark: { kind: 'image', tex: 'vantaWall', col: [0.6, 0.6, 0.62], ro: 0.35 }, panel: { kind: 'emit', e: K(6500, 2.2) },
    conv: { kind: 'metal', col: [0.2, 0.21, 0.22], ro: 0.5, wet: 0 }, belt: { kind: 'flat', col: [0.03, 0.03, 0.03], ro: 0.6 },
    body: { kind: 'flat', col: [0.12, 0.13, 0.14], ro: 0.35 }, arm: { kind: 'flat', col: [0.05, 0.05, 0.055], ro: 0.4 }, rotor: { kind: 'flat', col: [0.03, 0.03, 0.03], ro: 0.3 },
    motor: { kind: 'metal', col: [0.4, 0.4, 0.4], ro: 0.3, metal: 0.8 }, eye: { kind: 'emit', e: [2, 0.05, 0.03] }, robot: { kind: 'metal', col: [0.38, 0.27, 0.04], ro: 0.4, wet: 0 },
    rack: { kind: 'metal', col: [0.1, 0.11, 0.12], ro: 0.5, wet: 0 }, stripe: { kind: 'flat', col: [0.45, 0.36, 0.05], ro: 0.6 },
  }, { ground: null, vs: 1, sky: { zen: [0, 0, 0], hor: [0, 0, 0], cloud: 0 }, amb: { sky: [0.003, 0.0032, 0.0036], gnd: [0.002, 0.002, 0.002] }, fog: { s: 0.02, g: 0.5, c: [0.004, 0.0045, 0.005], sky: 60 }, gi: { n: 16, step: 2, fill: 0.5 }, exposure: o.exposure ?? 1.2 });
}

// the tower's lobby at night: a black stone floor like water, columns, the security gates, the
// reception desk with its strip of light; on the back wall the mark in steel under a spot
export function lobby(cam, o = {}) {
  const P = [], add = (q) => P.push(q), L = [];
  const X = 14, Z1 = 26, H = 11;
  add({ box: [-X - 1, -0.3, -6, X + 1, 0, Z1 + 1], m: 'stone' });
  add({ box: [-X, 0, Z1, X, H, Z1 + 0.3], m: 'wallS' });
  for (const s of [-1, 1]) add({ box: [s < 0 ? -X - 0.3 : X, 0, -6, s < 0 ? -X : X + 0.3, H, Z1], m: s < 0 ? 'wallS' : 'glassWall' });
  add({ box: [-X - 1, H, -6, X + 1, H + 0.4, Z1 + 1], m: 'ceil' });
  for (let x = -X + 2; x < X; x += 4) for (let z = -2; z < Z1; z += 6) add({ box: [x - 1.5, H - 0.02, z, x + 1.5, H, z + 0.08], m: 'slot', lamp: true });
  for (const z of [4, 12, 20]) for (const x of [-8, 8]) add({ cyl: [x, z, 0.6, 0, H], m: 'column' });
  add({ box: [-4, 0, Z1 - 0.06, 4, H, Z1 - 0.03], m: 'wallDark' });
  add({ box: [-3.0, 3.3, Z1 - 0.1, 3.0, 7.8, Z1 - 0.08], m: 'mark', cut: true });
  // the desk: a long block, the strip of red light under its lip
  add({ box: [-3.5, 0, 15, 3.5, 1.1, 16.2], m: 'deskS' }); add({ box: [-3.6, 1.1, 14.9, 3.6, 1.16, 16.3], m: 'deskTop' });
  add({ box: [-3.45, 0.08, 14.97, 3.45, 0.12, 15.0], m: 'redStrip', lamp: true });
  // the gates: posts with glass flaps
  for (let k = -3; k <= 3; k++) { const x = k * 1.3; add({ box: [x - 0.12, 0, 8, x + 0.12, 1.05, 9.6], m: 'gatePost' }); if (k < 3) add({ box: [x + 0.12, 0.3, 8.75, x + 0.55, 1.0, 8.77], m: 'flap' }); }
  for (let k = -3; k <= 3; k++) add({ box: [k * 1.3 - 0.08, 1.02, 8.1, k * 1.3 + 0.08, 1.05, 8.3], m: 'redStrip', lamp: true });
  L.push({ p: [0, 9.5, Z1 - 4], c: K(4300), I: o.spotI ?? 260, spot: { d: [0, -0.35, 1], c0: Math.cos(0.4), c1: Math.cos(0.25) }, r: 0.1, shafts: true, vol: 0.4 });
  L.push({ p: [0, 0.3, 14.6], c: [1, 0.06, 0.03], I: 3, r: 1.5, vol: 0.2 });
  for (const z of [0, 8, 16, 22]) L.push({ p: [0, H - 0.3, z], c: K(3800), I: o.ceilI ?? 14, r: 1, vol: 0.05 });
  // the plaza outside through the glass, wet, a floodlight
  L.push({ p: [24, 8, 10], c: K(5600), I: 1500, r: 0.3, vol: 0.3 });
  return spec(cam, P, L, {
    stone: { kind: 'tile', col: [0.025, 0.025, 0.027], tw: 1.2, th: 1.2, gloss: 0.9, grime: 0.05, joint: [0.04, 0.04, 0.04], broken: 0 },
    wallS: { kind: 'stone', col: [0.2, 0.2, 0.2], bh: 1.2, bl: 2.4, jw: 0.003, bev: 0.002, streak: 0, wet: 0, damp: 0.01 }, wallDark: { kind: 'flat', col: [0.02, 0.02, 0.022], ro: 0.3 },
    glassWall: { kind: 'glass', panes: [10, 3], frame: 0.06, fcol: [0.1, 0.1, 0.1] }, ceil: { kind: 'flat', col: [0.06, 0.06, 0.06], ro: 0.6 }, slot: { kind: 'emit', e: K(3800, 2) },
    column: { kind: 'metal', col: [0.06, 0.06, 0.065], ro: 0.2, metal: 0.7 }, mark: { kind: 'image', tex: 'vantaWall', col: [0.7, 0.7, 0.72], ro: 0.25 },
    deskS: { kind: 'stone', col: [0.12, 0.12, 0.12], bh: 1.1, bl: 1.75, jw: 0.002, streak: 0, wet: 0, damp: 0.01 }, deskTop: { kind: 'metal', col: [0.3, 0.3, 0.3], ro: 0.2, metal: 0.8 },
    redStrip: { kind: 'emit', e: [6, 0.2, 0.1] }, gatePost: { kind: 'metal', col: [0.4, 0.4, 0.42], ro: 0.15, metal: 0.9 }, flap: { kind: 'glass', panes: [1, 1], frame: 0 },
  }, { ground: null, vs: 1, sky: { zen: [0.003, 0.0035, 0.005], hor: [0.02, 0.018, 0.016], cloud: 0 }, amb: { sky: [0.002, 0.002, 0.0022], gnd: [0.001, 0.001, 0.001] }, fog: { s: 0.012, g: 0.5, c: [0.002, 0.002, 0.002], sky: 60 }, gi: { n: 16, step: 2, fill: 0.5 }, exposure: o.exposure ?? 1.5 });
}

// a lump of charcoal: a convex chunk with flat broken faces (planes round an ellipsoid at
// random depths), centre c, size s, axes stretch a
function chunk(r, c, s, a) {
  const planes = [];
  for (let i = 0; i < 18; i++) {
    // directions spread over the sphere (a jittered spiral), so every chunk is closed but none is a box
    const u = (i + 0.2 + r() * 0.6) / 18, ph = i * 2.39996 + r() * 0.8, yy = 1 - 2 * u, rr = Math.sqrt(1 - yy * yy);
    let n = [rr * Math.cos(ph), yy, rr * Math.sin(ph)];
    const l = Math.hypot(...n); n = n.map((v) => v / l);
    const sup = s * Math.hypot(n[0] * a[0], n[1] * a[1], n[2] * a[2]) * (0.72 + r() * 0.28);
    planes.push([...n, n[0] * c[0] + n[1] * c[1] + n[2] * c[2] + sup]);
  }
  const e = [s * a[0], s * a[1], s * a[2]];
  return { planes, aabb: [c[0] - e[0], c[1] - e[1], c[2] - e[2], c[0] + e[0], c[1] + e[1], c[2] + e[2]] };
}

// the embers: a bed of charcoal on its ash, close, the cracks still burning; the title is set over them
export function embers(cam, o = {}) {
  const P = [], add = (q) => P.push(q), L = [], r = rng(77);
  for (let k = 0; k < 520; k++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.24, x = Math.cos(a) * d, z = 0.1 + Math.sin(a) * d * 0.9, s = 0.005 + r() * r() * 0.016;
    const y = Math.max(0, 0.03 * (1 - d / 0.24)) + s * 0.35 + r() * 0.004;
    add({ hull: chunk(r, [x, y, z], s, [1.1 + r() * 0.6, 0.55 + r() * 0.3, 0.9 + r() * 0.5]), m: 'coal', o: { heat: Math.max(0.02, (r() < 0.55 ? 0.08 : 0.3) + r() * 0.75 * Math.max(0, 1 - d / 0.16)) * (o.heatK ?? 1), seed: k } });
  }
  for (let k = 0; k < 9; k++) { const a = k * 0.8, d = 0.015 + (k % 3) * 0.03; L.push({ p: [Math.cos(a) * d, 0.022, 0.1 + Math.sin(a) * d * 0.9], c: K(1400), I: (o.coalI ?? 0.003) * (o.heatK ?? 1), r: 0.01, vol: 0.25 }); }
  return spec(cam, P, L, {
    coal: { kind: 'ember', heat: 0.7, scale: 3 }, ash: { kind: 'ember', heat: 0.04, scale: 2 },
  }, { ground: { y: 0, m: 'ash' }, vs: 1, sky: { zen: [0, 0, 0], hor: [0, 0, 0], cloud: 0 }, amb: { sky: [0.0004, 0.0004, 0.0004], gnd: [0.0004, 0.0002, 0.0001] }, fog: { s: 0.25, g: 0.5, c: [0.0012, 0.0006, 0.0003], sky: 2 }, ao: { n: 8, d: 0.02 }, gi: { n: 24, step: 2, fill: 0.3, clamp: 3 }, exposure: o.exposure ?? 1.5 });
}
