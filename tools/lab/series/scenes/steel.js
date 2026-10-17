// KOR — series: the steelworks. Blast furnace No. 3 with its four stoves,
// the stack, the dust catcher and the downcomer, the cast house at its foot,
// the charging gallery climbing to its top, a torpedo car on the rails in the
// yard; the town behind. state: 'hot' (the night it was put out, the night it
// is lit again), 'cold' (today: rust, rain, the door sealed).
import { K, V, ring, town, wall, obox, bar } from './common.js';

export function steelworks(cam, o = {}) {
  const relit = o.state === 'relit', hot = o.state === 'hot' || relit, P = [], add = (q) => P.push(q);
  // the furnace: hearth, bosh, a shaft narrowing up to the throat
  add({ cyl: [0, 0, 7.2, 0, 7], m: 'shell' });
  add({ cyl: [0, 0, 7.7, 7, 11], m: 'shell' });
  [[7.4, 11, 15], [7.0, 15, 19], [6.6, 19, 23], [6.2, 23, 27], [5.8, 27, 31]].forEach(([r, a, b]) => add({ cyl: [0, 0, r, a, b], m: 'shell' }));
  add({ box: [-9.5, 31, -9.5, 9.5, 32.2, 9.5], m: 'steel' });
  add({ box: [-5, 32.2, -5, 5, 40, 5], m: 'cladTop' });
  add({ box: [-3, 40, -3, 3, 44.5, 3], m: 'cladTop' });
  // four uptakes, the offtake, the downcomer to the dust catcher
  for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) add({ cap: [a * 3.4, 37, b * 3.4, a * 1.4, 53, b * 1.4, 0.95], m: 'pipe' });
  add({ cap: [0, 53.5, 0, 17, 55, 0, 1.5], m: 'pipe' });
  add({ cap: [17, 55, 0, 33, 22, 0, 1.45], m: 'pipe' });
  add({ cyl: [36, 0, 5.2, 9, 27], m: 'shell', o: { lime: 0.3 } });
  [[4.2, 6.5, 9], [3.0, 4.5, 6.5], [1.6, 3, 4.5]].forEach(([r, a, b]) => add({ cyl: [36, 0, r, a, b], m: 'shell' }));
  add({ sph: [36, 27, 0, 5.2], m: 'shell' });
  for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) add({ box: [36 + a * 3.8 - 0.4, 0, b * 3.8 - 0.4, 36 + a * 3.8 + 0.4, 9.5, b * 3.8 + 0.4], m: 'steel' });
  // the bustle pipe round the bosh and the tuyere stocks down to it
  P.push(...ring([0, 0], 10.2, 12.6, 0.85, 20, 'pipe'));
  for (let k = 0; k < 20; k++) { const a = (k / 20) * 2 * Math.PI; add({ cap: [10.2 * Math.cos(a), 12.3, 10.2 * Math.sin(a), 7.9 * Math.cos(a), 9.4, 7.9 * Math.sin(a), 0.22], m: 'pipe' }); }
  // the steel round it: columns, girders, platforms with rails, a stair
  for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) add({ box: [a * 12 - 0.55, 0, b * 12 - 0.55, a * 12 + 0.55, 47, b * 12 + 0.55], m: 'steel' });
  for (const y of [14, 22.5, 31]) {
    add({ box: [-12.5, y, -12.5, 12.5, y + 0.3, -7.2], m: 'grate' }); add({ box: [-12.5, y, 7.2, 12.5, y + 0.3, 12.5], m: 'grate' });
    add({ box: [-12.5, y, -7.2, -7.2, y + 0.3, 7.2], m: 'grate' }); add({ box: [7.2, y, -7.2, 12.5, y + 0.3, 7.2], m: 'grate' });
    for (const z of [-12.5, 12.5]) { add({ box: [-12.5, y + 1.05, z - 0.04, 12.5, y + 1.12, z + 0.04], m: 'rail' }); add({ box: [-12.5, y + 0.55, z - 0.03, 12.5, y + 0.6, z + 0.03], m: 'rail' }); }
    for (let x = -12; x <= 12; x += 2) add({ box: [x - 0.03, y + 0.3, -12.53, x + 0.03, y + 1.1, -12.47], m: 'rail' });
    add({ box: [-12.6, y - 0.9, -12.6, 12.6, y, -12.2], m: 'steel' });
  }
  for (const [y0, y1] of [[0, 14], [14, 22.5], [22.5, 31]]) add({ hull: bar([13.2, y0 + 0.2, -10], [13.2, y1, -3], 1.0, 0.25), m: 'grate' });
  const deck = [];
  for (const y of [14, 22.5, 31, 44]) for (const [a, b] of [[1, -1], [-1, -1], [1, 1]]) { const p = [a * 12.1, y + 2.6, b * 12.1 - 0.7]; deck.push(p); add({ sph: [...p, 0.14], m: hot ? 'sodium' : 'sodiumDim', lamp: true }); }
  // the cast house: a ribbed shed at the furnace's foot, its big door toward the yard
  const ch = { x0: -17, x1: 17, z0: -34, z1: -8.5, h: 17 };
  const doorHole = { x0: -5.5, x1: 5.5, y0: 0, y1: 10 };
  P.push(...wall(ch.x0, ch.x1, 0, ch.h, ch.z0, ch.z0 + 0.3, [doorHole], 'clad', { base: 0 }));
  add({ box: [ch.x0, 0, ch.z0 + 0.3, ch.x0 + 0.3, ch.h, ch.z1], m: 'clad' }); add({ box: [ch.x1 - 0.3, 0, ch.z0 + 0.3, ch.x1, ch.h, ch.z1], m: 'clad' });
  add({ hull: { planes: [[0, -1, 0, -ch.h], [-1, 0, 0, -(ch.x0 - 0.6)], [1, 0, 0, ch.x1 + 0.6], [0, 0, -1, -(ch.z0 - 0.8)], [0, 0, 1, ch.z1], [0, Math.cos(0.32), -Math.sin(0.32), Math.cos(0.32) * (ch.h + 6) - Math.sin(0.32) * ((ch.z0 + ch.z1) / 2)], [0, Math.cos(0.32), Math.sin(0.32), Math.cos(0.32) * (ch.h + 6) + Math.sin(0.32) * ((ch.z0 + ch.z1) / 2)]], aabb: [ch.x0 - 0.6, ch.h, ch.z0 - 0.8, ch.x1 + 0.6, ch.h + 6, ch.z1] }, m: 'roof' });
  // a monitor along the ridge (the smoke used to go out there), louvred
  add({ box: [-12, ch.h + 5.5, -23, 12, ch.h + 7.5, -19], m: 'clad', o: { col: [0.12, 0.13, 0.12] } });
  add({ box: [ch.x0 + 0.3, 0, ch.z1 - 0.3, ch.x1 - 0.3, 0.6, ch.z1], m: 'concrete' });
  if (hot) {
    // inside: the tap hole's fire, the iron in the runners
    add({ box: [-2.5, 0.2, -12, 2.5, 3.2, -11.5], m: 'tapGlow' });
    add({ box: [-0.6, 0.05, -30, 0.6, 0.25, -12], m: 'runner' });
    add({ box: [-6, 0.05, -24, 6, 0.25, -23], m: 'runner' });
    add({ box: [-14, -1, -33.5, 14, 0.02, -9], m: 'castFloor' });
  } else {
    add({ box: [-0.06, 12.0, -35.3, 0.06, 12.1, -34], m: 'steel' }); add({ box: [-0.22, 11.82, -35.42, 0.22, 12.0, -35.0], m: 'steel' }); add({ sph: [0, 11.66, -35.2, 0.14], m: 'sodium', lamp: true });
    // the door shut, chained, the notice pasted on it
    add({ box: [doorHole.x0, 0, ch.z0 + 0.05, doorHole.x1, doorHole.y1, ch.z0 + 0.25], m: 'door' });
    add({ box: [-1.0, 3.6, ch.z0 - 0.02, 0.4, 5.6, ch.z0 + 0.06], m: 'notice' });
    add({ box: [-0.3, 2.6, ch.z0 - 0.06, 0.3, 3.0, ch.z0 + 0.02], m: 'steel', o: { col: [0.05, 0.05, 0.05] } });
  }
  // the stoves: four tall cylinders with domes, the hot-blast main along them, the stack
  for (let k = 0; k < 4; k++) {
    const x = -27 - k * 11.5, z = 8;
    add({ cyl: [x, z, 4.4, 0, 33], m: 'shell', o: { plate: 2.5, plateW: 4, lime: 0.25, seed: 40 + k } });
    add({ sph: [x, 33, z, 4.4], m: 'shell', o: { seed: 50 + k } });
    add({ cap: [x, 30, z - 4.6, x, 30, z - 6.8, 0.75], m: 'pipe' });
    add({ box: [x - 5, 0, z - 5, x + 5, 1.2, z + 5], m: 'concrete' });
  }
  add({ cap: [-63, 30, 1.2, -14, 30, 1.2, 0.95], m: 'pipe' });
  add({ cap: [-14, 30, 1.2, -9.5, 13, 0.5, 0.95], m: 'pipe' });
  add({ cyl: [-46, 22, 2.6, 0, 82], m: 'stack' });
  add({ sph: [-46, 82.4, 22, 0.35], m: 'beacon', lamp: true });
  // the charging gallery climbing from the stockyard to the top
  add({ hull: bar([78, 3, -6], [5, 41, -2], 3.4, 3.0), m: 'clad', o: { col: [0.2, 0.21, 0.2], sheetH: 3 } });
  for (const k of [0.15, 0.35, 0.55, 0.75]) { const p = V.lerp([78, 3, -6], [5, 41, -2], k); add({ box: [p[0] - 0.5, 0, p[2] - 0.5, p[0] + 0.5, p[1] - 1.5, p[2] + 0.5], m: 'steel' }); }
  // tanks and sheds beyond, the town behind
  for (const [x, z, r, h] of [[62, 40, 9, 22], [86, 52, 11, 26], [-95, 60, 8, 18]]) { add({ cyl: [x, z, r, 0, h], m: 'shell', o: { lime: 0.1, plate: 1.6 } }); add({ sph: [x, h - r * 0.6, z, r * 1.02], m: 'shell' }); }
  add({ box: [40, 0, 70, 120, 18, 110], m: 'clad', o: { col: [0.16, 0.17, 0.17] } });
  add({ box: [-150, 0, 50, -70, 14, 90], m: 'clad', o: { col: [0.18, 0.16, 0.14] } });
  P.push(...town(7, { x0: -400, x1: 400, z0: 180, z1: 600, n: 90 }));
  // the yard: rails across it, a torpedo car on them, a few masts
  for (const z of [-58, -56.6, -47, -45.6]) add({ box: [-300, 0, z - 0.04, 300, 0.16, z + 0.04], m: 'railSteel' });
  add({ ell: { c: [24, 3.2, -46.3], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], r: [9.5, 2.3, 2.3] }, m: 'torpedo' });
  add({ box: [17, 0.3, -48, 31, 1.4, -44.6], m: 'steel' });
  add({ cyl: [24, -46.3, 1.2, 4.8, 5.8], m: 'torpedo' });
  const masts = o.masts || [[-70, -60], [55, -70], [95, -20]];
  for (const [x, z] of masts) { add({ cyl: [x, z, 0.35, 0, 30], m: 'steel' }); add({ box: [x - 1.6, 30, z - 0.5, x + 1.6, 30.8, z + 0.5], m: 'steel' }); add({ sph: [x, 29.8, z - 0.6, 0.4], m: hot ? 'sodium' : 'sodiumDim', lamp: true }); }

  const L = [];
  for (const [x, z] of masts) L.push({ p: [x, 29.6, z - 0.7], c: K(2000), I: hot ? 500 : 380, r: 0.4, vol: 0.6 });
  for (const p of deck) L.push({ p, c: K(2050), I: 26, r: 0.14, vol: 0.8 });
  L.push({ p: [-46, 82.4, 22], c: [1, 0.05, 0.02], I: 30, r: 0.35, shadow: false, vol: 1.2 });
  if (hot) {
    // the fire in the cast house: out of the door, up the furnace's side, into the steam
    L.push({ p: [0, 2.2, -14], c: K(1700), I: relit ? 700 : 2600, r: 1.2, vol: relit ? 0.5 : 1.2 });
    L.push({ p: [0, 1.2, -27], c: K(1600), I: relit ? 300 : 900, r: 1.0, vol: 1.0 });
    // morning: the low sun through the haze, from behind the stoves
    if (relit) L.push({ dir: V.norm([0.55, -0.12, -0.83]), c: K(3000), I: 1.2, ang: 0.01, shafts: true, vol: 0.5, far: 300 });
    // and the floodlights of the trucks, from the left, across the yard
    if (o.floods) for (const [x, z, a] of o.floods) L.push({ p: [x, 3.6, z], c: K(5600), I: 1.4e5, spot: { d: V.sub([0, 18, a], [x, 3.6, z]), c0: Math.cos(0.045), c1: Math.cos(0.02) }, r: 0.5, shafts: true, vol: 1.6 });
  } else {
    // a cold white floodlight on the furnace, and the yard lamps
    L.push({ p: [70, 6, -45], c: K(5200), I: 9e4, spot: { d: V.sub([0, 44, 0], [70, 6, -45]), c0: Math.cos(0.16), c1: Math.cos(0.1) }, r: 0.4, shafts: true, vol: 0.5 });
    // the one lamp still burning, over the sealed door
    L.push({ p: [0, 11.62, -35.2], c: K(2050), I: 40, r: 0.14, vol: 0.9 });
  }
  const sky = o.sky || (relit ? { zen: [0.06, 0.07, 0.09], hor: [0.42, 0.28, 0.18], cloud: 1, cloudCol: [0.16, 0.11, 0.09], scale: 0.3, seed: 63 } : hot ? { zen: [0.003, 0.003, 0.0035], hor: [0.03, 0.016, 0.009], cloud: 1, cloudCol: [0.04, 0.02, 0.01], scale: 0.25, seed: 61 } : { zen: [0.012, 0.016, 0.022], hor: [0.04, 0.042, 0.046], cloud: 1, cloudCol: [0.018, 0.019, 0.021], scale: 0.3, seed: 62 });
  return {
    W: cam.W, H: cam.H, cam, prims: P,
    ground: { y: 0, m: 'yard' },
    mats: {
      shell: { kind: 'rust', lime: hot ? 0.3 : 0.6, fresh: hot ? 0.4 : 0.9 },
      pipe: { kind: 'rust', plate: 3, plateW: 2, lime: 0.25 },
      steel: { kind: 'metal', col: [0.06, 0.055, 0.05], ro: 0.6, wet: hot ? 0.1 : 0.4 },
      grate: { kind: 'metal', col: [0.05, 0.045, 0.04], ro: 0.7, wet: 0.2 },
      rail: { kind: 'metal', col: [0.16, 0.12, 0.03], ro: 0.5 },
      clad: { kind: 'cladding', col: [0.1, 0.115, 0.11], rust: 0.5 },
      cladTop: { kind: 'cladding', col: [0.09, 0.09, 0.085], rust: 0.6 },
      roof: { kind: 'cladding', col: [0.08, 0.08, 0.075], rust: 0.4, wet: hot ? 0.2 : 0.6 },
      concrete: { kind: 'concrete', col: [0.3, 0.29, 0.27] },
      stack: { kind: 'brick', col: [0.22, 0.1, 0.07], soot: [55, 82] },
      beacon: { kind: 'emit', e: [2.5, 0.08, 0.03] },
      sodium: { kind: 'emit', e: K(2000, 0.6) }, sodiumDim: { kind: 'emit', e: K(2000, 0.5) },
      tapGlow: { kind: 'emit', e: K(1600, 3.5) },
      runner: { kind: 'emit', e: K(1500, 2.5) },
      castFloor: { kind: 'flat', col: [0.06, 0.05, 0.045], ro: 0.9 },
      door: { kind: 'cladding', col: [0.12, 0.14, 0.13], pitch: 0.35, rust: 0.6, sheetH: 2.5 },
      notice: { kind: 'image', tex: 'sealNotice', col: [0.5, 0.5, 0.5], soak: 0.12, dirt: 0.3, wet: 0.35 },
      railSteel: { kind: 'metal', col: [0.3, 0.28, 0.26], metal: 0.7, ro: 0.3, wet: 0.6 },
      torpedo: { kind: 'rust', plate: 1.5, plateW: 2.5, lime: 0.05, fresh: 0.5 },
      yard: { kind: 'asphalt', col: [0.07, 0.066, 0.06], puddle: hot ? 0.6 : 0.56, wet: hot ? 0.4 : 0.6 },
      flats: { kind: 'flats' },
    },
    lights: L, sky,
    amb: relit ? { sky: [0.05, 0.05, 0.06], gnd: [0.02, 0.016, 0.012] } : hot ? { sky: [0.006, 0.004, 0.003], gnd: [0.004, 0.0025, 0.0015] } : { sky: [0.02, 0.024, 0.03], gnd: [0.006, 0.006, 0.006] },
    fog: relit ? { s: 0.0022, g: 0.6, c: [0.12, 0.09, 0.075], sky: 900 } : hot ? { s: 0.0012, g: 0.6, c: [0.008, 0.005, 0.0035], sky: 900 } : { s: 0.0035, g: 0.5, c: [0.02, 0.022, 0.026], sky: 900 },
    ao: { n: 8, d: 3 }, refl: { streak: Math.round(cam.W * 0.008) },
    exposure: o.exposure ?? (relit ? 1.0 : hot ? 1.3 : 1.4),
  };
}
