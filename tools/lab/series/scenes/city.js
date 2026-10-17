// KOR — series: the town at night. From a roof: the parapet and its coping
// close, an aerial, a dish turned to the tower, the blocks of flats going
// off into the rain with their windows, a grid of sodium lamps in the
// streets, the dead chimneys of the works to the left, the Vanta tower to
// the right with its red lights and the searchlight sweeping the roofs.
// Or the tower from its foot: the plaza, the barriers, looking up the face
// into the fog.
import { K, V, town, bar } from './common.js';
import { rng } from '../../../../public/lab/js/cine/noise.js';

// the tower: a shaft of dark glass and concrete, set back twice, a crown, a mast
function tower(add, T, L, o = {}) {
  const [tx, tz] = T;
  add({ box: [tx - 18, 0, tz - 18, tx + 18, 40, tz + 18], m: 'towerBase' });
  add({ box: [tx - 14, 40, tz - 14, tx + 14, 150, tz + 14], m: 'towerFace' });
  // vertical fins down the faces
  for (let k = -13; k <= 13; k += 2.6) { add({ box: [tx + k - 0.15, 40, tz - 14.6, tx + k + 0.15, 150, tz - 14], m: 'fin' }); add({ box: [tx - 14.6, 40, tz + k - 0.15, tx - 14, 150, tz + k + 0.15], m: 'fin' }); add({ box: [tx + 14, 40, tz + k - 0.15, tx + 14.6, 150, tz + k + 0.15], m: 'fin' }); }
  add({ box: [tx - 10, 150, tz - 10, tx + 10, 168, tz + 10], m: 'towerFace' });
  add({ box: [tx - 10.6, 168, tz - 10.6, tx + 10.6, 170, tz + 10.6], m: 'iron' });
  add({ cyl: [tx, tz, 1.2, 170, 205], m: 'iron' });
  const reds = [[tx - 14, 150.6, tz - 14], [tx + 14, 150.6, tz - 14], [tx - 10, 170.6, tz - 10], [tx + 10, 170.6, tz - 10], [tx, 205.8, tz]];
  for (const p of reds) { add({ sph: [...p, 0.9], m: 'red', lamp: true }); L.push({ p: [p[0], p[1], p[2] - 1.2], c: [1, 0.05, 0.02], I: o.redI ?? 900, r: 0.9, shadow: false, vol: 1.4 }); }
  // the searchlight on the crown's corner
  const sd = V.norm(o.search || [-0.8, -0.13, -0.58]);
  add({ cyl: [tx - 9, tz - 9, 0.7, 170, 171.6], m: 'iron' });
  L.push({ p: [tx - 9 + sd[0] * 0.8, 171, tz - 9 + sd[2] * 0.8], c: K(6500), I: o.searchI ?? 4e7, spot: { d: sd, c0: Math.cos(o.beam ?? 0.03), c1: Math.cos((o.beam ?? 0.03) * 0.4) }, r: 0.6, shafts: true, vol: 1.6 });
}

const MATS = (o) => ({
  block: { kind: 'flats', lit: 0.12 }, tar: { kind: 'asphalt', col: [0.045, 0.045, 0.045], puddle: 0.5, wet: 0.65 },
  parapet: { kind: 'concrete', col: [0.24, 0.23, 0.22], lift: 0.55, streak: 0.8, wet: 0.45 },
  coping: { kind: 'metal', col: [0.16, 0.16, 0.16], ro: 0.35, wet: 0.7 },
  iron: { kind: 'metal', col: [0.05, 0.05, 0.05], ro: 0.4, wet: 0.5 }, tank: { kind: 'rust', plate: 0.8, plateW: 1.2, lime: 0.1, fresh: 0.5 },
  dish: { kind: 'metal', col: [0.38, 0.38, 0.36], ro: 0.5, wet: 0.4 },
  flats: { kind: 'flats', lit: o.lit ?? 0.15, e: 0.6 },
  towerFace: { kind: 'flats', col: [0.012, 0.014, 0.016], lit: 0.035, e: 1.0, fh: 4, wp: 2.6 },
  fin: { kind: 'metal', col: [0.12, 0.12, 0.13], ro: 0.3, metal: 0.7, wet: 0.4 },
  towerBase: { kind: 'concrete', col: [0.2, 0.2, 0.2], lift: 4, streak: 0.4 },
  red: { kind: 'emit', e: [4, 0.12, 0.05] }, stack: { kind: 'brick', soot: [60, 95] }, bulb: { kind: 'emit', e: K(2700, 1) },
  street: { kind: 'asphalt', col: [0.06, 0.06, 0.06], wet: 0.6 }, sodium: { kind: 'emit', e: K(2000, 1.2) },
  plaza: { kind: 'pavers', col: [0.17, 0.165, 0.16], a: 0.8, b: 0.4, jw: 0.01, puddle: 0.55, wet: 0.55 },
  barrier: { kind: 'concrete', col: [0.3, 0.29, 0.27], lift: 0.27, streak: 0.8, wet: 0.3 },
  steel: { kind: 'metal', col: [0.2, 0.2, 0.21], ro: 0.3, wet: 0.5, metal: 0.6 },
});

export function rooftop(cam, o = {}) {
  const P = [], add = (q) => P.push(q), RY = 24, L = [], r = rng(o.seed ?? 21);
  // our roof at the head of the avenue: the slab, the parapet along its edge with a steel coping
  add({ box: [-16, 0, -24, 16, RY, 8.3], m: 'block' });
  add({ box: [-16, RY, -24, 16, RY + 0.06, 8], m: 'tar' });
  add({ box: [-16, RY, 8, 16, RY + 1.05, 8.3], m: 'parapet' });
  add({ box: [-16.03, RY + 1.05, 7.96, 16.03, RY + 1.1, 8.34], m: 'coping' });
  // an aerial with its cross-pieces and a guy wire, a dish turned to the tower
  add({ cyl: [-5.2, 6.9, 0.035, RY, RY + 7.5], m: 'iron' });
  for (const [y, w] of [[4.2, 0.9], [5.1, 0.7], [6.0, 0.5], [6.8, 0.35]]) add({ hull: bar([-5.2 - w, RY + y, 6.9], [-5.2 + w, RY + y, 6.9], 0.025, 0.025), m: 'iron' });
  add({ hull: bar([-5.2, RY + 7.4, 6.9], [-11, RY + 0.05, 7.6], 0.01, 0.01), m: 'iron' });
  const dd = V.norm([0.12, 0.1, 1]);
  add({ ell: { c: [3.6, RY + 1.45, 7.1], axes: [V.norm([1, 0, -0.12]), V.norm([-0.01, 1, -0.1]), dd], r: [0.42, 0.42, 0.06] }, m: 'dish' });
  add({ box: [3.56, RY, 6.95, 3.64, RY + 1.3, 7.03], m: 'iron' });
  // the avenue: blocks of flats down both sides, side streets every so often; things on their roofs
  const tops = [];
  for (const side of [-1, 1]) {
    let z = 12 + r() * 4;
    while (z < 1100) {
      const len = 24 + r() * 36, dep = 14 + r() * 16, h = Math.min(46, 12 + r() * 22 + (z > 200 ? r() * 14 : 0)), x0 = side * (11 + r() * 1.5);
      add({ box: [side < 0 ? x0 - dep : x0, 0, z, side < 0 ? x0 : x0 + dep, h, z + len], m: 'flats', o: { seed: (z | 0) * 7 + side } });
      if (r() < 0.6) tops.push([x0 + side * (2 + r() * (dep - 4)), h, z + 2 + r() * (len - 4)]);
      z += len + (r() < 0.25 ? 14 + r() * 8 : 0.4);
    }
  }
  for (const [x, y, z] of tops) {
    if (r() < 0.5) { add({ box: [x - 1.6, y, z - 1.4, x + 1.6, y + 2.6, z + 1.4], m: 'parapet' }); }
    else { for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add({ box: [x + a * 1.1 - 0.06, y, z + b * 1.1 - 0.06, x + a * 1.1 + 0.06, y + 2.2, z + b * 1.1 + 0.06], m: 'iron' }); add({ cyl: [x, z, 1.5, y + 2.2, y + 4.6], m: 'tank' }); }
  }
  // the town beyond, to the sides
  P.push(...town(o.seed ?? 21, { x0: -900, x1: 900, z0: 60, z1: 1600, n: 360, hMin: 8, hMax: 40, avoid: (x, z) => Math.abs(x) < 60 || Math.hypot(x - 90, z - 1000) < 60 }));
  // the lamps down the avenue: real ones near, only the heads further on
  for (let z = 20, i = 0; z < 1000; z += 32, i++) for (const s of [-1, 1]) {
    const x = s * 9.2, zz = z + (s > 0 ? 16 : 0);
    add({ cyl: [x, zz, 0.09, 0, 8], m: 'iron' });
    add({ box: [Math.min(x, x - s * 1.4), 7.9, zz - 0.06, Math.max(x, x - s * 1.4), 8, zz + 0.06], m: 'iron' });
    add({ box: [x - s * 1.4 - 0.25, 7.78, zz - 0.12, x - s * 1.4 + 0.25, 7.9, zz + 0.12], m: 'sodium', lamp: true });
    if (i < 9) L.push({ p: [x - s * 1.4, 7.7, zz], c: K(2000), I: 40, r: 0.25, vol: 0.9 });
  }
  // the works: three dead chimneys and the furnace's bulk, off to the left
  for (const [x, z, h] of [[-300, 760, 105], [-272, 786, 95], [-240, 752, 112]]) add({ cyl: [x, z, 4.5, 0, h], m: 'stack' });
  add({ cyl: [-200, 820, 9, 0, 55], m: 'iron' });
  tower(add, o.tower || [90, 1000], L, { search: [-0.5, -0.3, -0.81], searchI: 1.6e7, beam: 0.045, ...o });
  return {
    W: cam.W, H: cam.H, cam, prims: P, ground: { y: 0, m: 'street' }, mats: MATS(o), lights: L, vs: 1,
    sky: { zen: [0.003, 0.0038, 0.0055], hor: [0.03, 0.022, 0.017], cloud: 1, cloudCol: [0.035, 0.024, 0.017], scale: 0.2, seed: 81 },
    amb: { sky: [0.004, 0.005, 0.008], gnd: [0.003, 0.0026, 0.0022] },
    fog: { s: o.fog ?? 0.0028, g: 0.6, c: [0.007, 0.006, 0.0052], sky: 1800 },
    ao: { n: 8, d: 2 }, refl: { streak: Math.round(cam.W * 0.01) },
    exposure: o.exposure ?? 1.8,
  };
}

// the tower from its foot: the plaza in front of it, barriers, the canopy over the doors
export function towerFoot(cam, o = {}) {
  const P = [], add = (q) => P.push(q), L = [], T = [0, 60];
  tower(add, T, L, { search: [0.5, -0.1, -0.86], searchI: 2e7, redI: 600 });
  // the canopy and the lit lobby glass under it
  add({ box: [-18, 6, 38, 18, 6.6, 42.05], m: 'steel' });
  add({ box: [-12, 0, 41.9, 12, 6, 42], m: 'lobby' });
  for (let x = -12; x <= 12; x += 3) add({ box: [x - 0.08, 0, 41.8, x + 0.08, 6, 41.95], m: 'steel' });
  // the plaza: barriers in a staggered line, bollards, a guard booth, floodlights
  for (const [x, z, yaw] of [[-9, -22, 0.02], [-5.5, -21.7, -0.03], [5.4, -21.9, 0.04], [9, -22.1, -0.02], [-1.6, -27, 0.3]]) add({ hull: jerseyQ(x, z, 3, yaw), m: 'barrier' });
  for (let x = -14; x <= 14; x += 2.5) add({ cyl: [x, 30, 0.14, 0, 0.9], m: 'steel' });
  add({ box: [11, 0, -18, 13.5, 2.6, -15], m: 'steel' });
  add({ box: [11.1, 1.1, -18.05, 13.3, 2.0, -18], m: 'lobby' });
  for (const x of [-16, 16]) { add({ cyl: [x, 4, 0.12, 0, 9], m: 'iron' }); add({ box: [x - 0.3, 8.8, 3.6, x + 0.3, 9.1, 4.4], m: 'iron' }); }
  L.push({ p: [0, 5.6, 40], c: K(4800), I: 60, r: 2, vol: 0.4 });
  // uplights on the podium's roof washing the fins
  for (const x of [-11, -3.9, 3.9, 11]) { add({ box: [x - 0.3, 40, 44.6, x + 0.3, 40.4, 45.2], m: 'iron' }); L.push({ p: [x, 40.5, 45.2], c: K(5000), I: 14000, spot: { d: [0, 1, -0.035], c0: Math.cos(0.16), c1: Math.cos(0.07) }, r: 0.15, shafts: true, vol: 0.5 }); }
  // two warm lamps at the podium's foot washing its face
  for (const x of [-12, 12]) L.push({ p: [x, 0.4, 41.2], c: K(3000), I: 2500, spot: { d: [0, 1, 0.12], c0: Math.cos(0.5), c1: Math.cos(0.25) }, r: 0.15, shafts: true, vol: 0.3 });
  L.push({ p: [12.2, 1.6, -18.3], c: K(4800), I: 1.5, r: 0.4, vol: 0.3 });
  for (const x of [-16, 16]) L.push({ p: [x, 8.7, 4], c: K(5600), I: 900, spot: { d: [-x * 0.03, -1, -0.5], c0: Math.cos(0.7), c1: Math.cos(0.4) }, r: 0.25, shafts: true, vol: 0.9 });
  return {
    W: cam.W, H: cam.H, cam, prims: P, ground: { y: 0, m: 'plaza' }, vs: 1,
    mats: { ...MATS(o), lobby: { kind: 'window', panes: [8, 2], frame: 0.06, e: K(4600, 0.16), blinds: 0, lampU: 0.5 }, iron: { kind: 'metal', col: [0.04, 0.04, 0.04], ro: 0.4, wet: 0.5 } }, lights: L,
    sky: { zen: [0.003, 0.0038, 0.0055], hor: [0.03, 0.022, 0.017], cloud: 1, cloudCol: [0.04, 0.026, 0.018], scale: 0.25, seed: 83 },
    amb: { sky: [0.004, 0.005, 0.008], gnd: [0.003, 0.0026, 0.0022] },
    fog: { s: 0.009, g: 0.6, c: [0.006, 0.005, 0.0045], sky: 200 },
    ao: { n: 8, d: 2 }, refl: { streak: Math.round(cam.W * 0.012) },
    exposure: 1.9,
  };
}
import { jersey as jerseyQ } from './common.js';
