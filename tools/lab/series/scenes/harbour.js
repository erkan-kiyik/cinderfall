// KOR — series: the harbour, from the pier across the basin. Black water in
// front with the lamps lying in it; a container ship along the quay, its hull
// a long dark wall, boxes in their colours stacked on deck, the bridge house
// at the stern with a window lit; the ship-to-shore crane over it, its boom
// out across the deck, work lamps on it and a red light on top; the quay's
// sodium masts behind lighting the mist; the boxes stacked on the quay.
// time: 'night' (rain) or 'dawn' (a pale band, mist on the water; with
// ship: false, the berth stands empty).
import { K, V, bar, town } from './common.js';

export function harbour(cam, o = {}) {
  const dawn = o.time === 'dawn', P = [], add = (q) => P.push(q), L = [];
  const QY = 2.2; // the quay's top above the water
  // the quay: a long slab, its edge, timber fenders down it, rails and a yellow line on top
  add({ box: [-300, -6, -10, 300, QY, 400], m: 'quay' });
  add({ box: [-300, QY - 0.01, -10, 300, QY + 0.005, 400], m: 'quayTop' });
  for (let x = -120; x <= 160; x += 9) add({ box: [x - 0.25, -1.6, -10.4, x + 0.25, QY - 0.3, -10.02], m: 'fender' });
  for (const z of [-6, 22]) add({ box: [-300, QY, z - 0.04, 300, QY + 0.018, z + 0.04], m: 'rail' });
  // the pier we stand on, across the basin: its edge, a bollard, a line going down to the water
  const PZ = o.pierZ ?? -120;
  add({ box: [140, -6, PZ - 60, 280, QY, PZ], m: 'quay' });
  add({ box: [140, QY - 0.01, PZ - 60, 280, QY + 0.005, PZ], m: 'quayTop' });
  add({ box: [140, QY - 0.25, PZ - 0.1, 280, QY + 0.01, PZ + 0.15], m: 'edge' });
  add({ cyl: [193, PZ - 0.9, 0.28, QY, QY + 0.62], m: 'iron' }); add({ cyl: [193, PZ - 0.9, 0.38, QY + 0.62, QY + 0.74], m: 'iron' });
  add({ cap: [192.8, QY + 0.5, PZ - 0.7, 192, 0.15, PZ + 6, 0.03], m: 'rope' }); add({ cap: [192, 0.15, PZ + 6, 190, -0.4, PZ + 24, 0.03], m: 'rope' });
  // the ship: hull, a raked bow, the boot-top, boxes on deck, the bridge house at the stern
  const sx0 = -110, sx1 = 110, sz0 = -38, sz1 = -11.5, deck = 14, sm = (sz0 + sz1) / 2;
  if (o.ship !== false) {
    add({ box: [sx0, -9, sz0, sx1, deck, sz1], m: 'hull' });
    add({ box: [sx0 - 0.05, -9, sz0 - 0.03, sx1, 0.9, sz1 + 0.03], m: 'antifoul' });
    add({ hull: { planes: [[-1, 0, 0, -sx1], [0, -1, 0, 9], [0, 1, 0, deck + 1.5], [0.83, -0.2, 0.52, 0.83 * (sx1 + 12) + 0.52 * sm], [0.83, -0.2, -0.52, 0.83 * (sx1 + 12) - 0.52 * sm]], aabb: [sx1, -9, sz0, sx1 + 16, deck + 1.5, sz1] }, m: 'hull' });
    add({ box: [sx0, deck, sz0, sx1, deck + 1.1, sz0 + 0.12], m: 'bulwark' });
    const CC = [[0.22, 0.06, 0.035], [0.05, 0.1, 0.17], [0.19, 0.19, 0.18], [0.28, 0.18, 0.05], [0.06, 0.12, 0.08], [0.33, 0.32, 0.29], [0.42, 0.2, 0.05], [0.14, 0.15, 0.17]];
    let k = 0;
    for (let x = sx0 + 22; x < sx1 - 12; x += 12.9) {
      const tiers = 3 + ((k * 7) % 4);
      for (const z of [sz0 + 1.2, sz0 + 3.75, sz0 + 6.3, sz0 + 8.85, sz0 + 11.4, sz0 + 13.95, sz0 + 16.5, sz0 + 19.05, sz0 + 21.6]) {
        const nt = tiers - ((z * 3 + k) % 2 === 0 ? 1 : 0);
        for (let t = 0; t < nt; t++) { k++; add({ box: [x, deck + t * 2.59, z, x + 12.19, deck + t * 2.59 + 2.59, z + 2.44], m: 'box', o: { col: CC[(k * 5) % CC.length], seed: k, doors: (k & 1) ? 1 : -1, rust: 0.4 + (k % 3) * 0.2 } }); }
      }
    }
    add({ box: [sx0 + 2, deck, sz0 + 2, sx0 + 18, deck + 20, sz1 - 2], m: 'house' });
    add({ box: [sx0 + 1, deck + 20, sz0 - 1.5, sx0 + 19, deck + 21, sz1 + 1.5], m: 'house' });
    for (let y = deck + 2.4, i = 0; y < deck + 19; y += 2.8, i++) add({ box: [sx0 + 3, y, sz0 + 1.94, sx0 + 17, y + 1.2, sz0 + 2.0], m: i === 5 ? 'bridgeLit' : 'glass' });
    add({ cyl: [sx0 + 10, sm, 1.6, deck + 21, deck + 27], m: 'funnel' });
    add({ cyl: [sx0 + 14, sm, 0.12, deck + 21, deck + 30], m: 'iron' });
    add({ sph: [sx0 + 14, deck + 30.3, sm, 0.2], m: 'white', lamp: true });
    add({ sph: [sx0 + 18.6, deck + 20.5, sz0 - 1.4, 0.15], m: 'green', lamp: true });
    // lamps along the deck, low, every so often
    for (let x = sx0 + 26; x < sx1; x += 26) add({ sph: [x, deck + 1.3, sz0 + 0.3, 0.1], m: 'deckBulb', lamp: true });
    L.push({ p: [sx0 + 10, deck + 13, sz0 + 1.6], c: K(3000), I: 25, r: 0.6, vol: 0.4 });
    L.push({ p: [sx0 + 18.6, deck + 20.5, sz0 - 1.6], c: [0.1, 1, 0.3], I: 4, r: 0.15, shadow: false, vol: 0.8 });
    for (let x = sx0 + 26; x < sx1; x += 52) L.push({ p: [x, deck + 1.3, sz0 - 0.1], c: K(2700), I: 6, r: 0.1, vol: 0.5 });
  }
  // the crane: four legs braced, the portal, the boom out over the berth, a machinery house
  const cx = 18, cz0 = -6, cz1 = 22, top = QY + 40;
  for (const x of [cx - 9, cx + 9]) {
    for (const z of [cz0, cz1]) add({ box: [x - 0.7, QY, z - 0.7, x + 0.7, top, z + 0.7], m: 'crane' });
    add({ hull: bar([x, QY + 4, cz0], [x, top - 4, cz1], 0.5, 0.5, [1, 0, 0]), m: 'crane' });
    add({ box: [x - 0.6, QY + 12, cz0, x + 0.6, QY + 13, cz1], m: 'crane' });
  }
  add({ box: [cx - 10, top - 3, cz0 - 1, cx + 10, top, cz1 + 1], m: 'crane' });
  add({ box: [cx - 1.6, top, cz0 - 56, cx + 1.6, top + 3, cz1 + 26], m: 'crane' });
  add({ box: [cx - 5, top, cz1 - 2, cx + 5, top + 6, cz1 + 14], m: 'craneHouse' });
  add({ hull: bar([cx, top + 3, cz1 - 6], [cx, top + 20, cz1 - 1], 1.4, 1.4), m: 'crane' });
  add({ hull: bar([cx, top + 20, cz1 - 1], [cx, top + 3, cz0 - 52], 0.35, 0.35), m: 'crane' });
  add({ hull: bar([cx, top + 20, cz1 - 1], [cx, top + 3, cz1 + 24], 0.35, 0.35), m: 'crane' });
  add({ sph: [cx, top + 20.6, cz1 - 1, 0.45], m: 'red', lamp: true });
  add({ sph: [cx, top + 3.4, cz0 - 55.5, 0.3], m: 'red', lamp: true });
  add({ box: [cx - 2.2, top - 7, cz0 - 22, cx + 2.2, top - 3, cz0 - 18], m: 'cab' });
  add({ box: [cx - 1.4, top - 6.5, cz0 - 22.05, cx + 1.4, top - 4.5, cz0 - 22], m: 'cabLit' });
  // its work lamps under the boom, down onto the deck
  for (const z of [cz0 - 10, cz0 - 24, cz0 - 38, cz0 - 50]) { add({ box: [cx - 0.5, top - 0.4, z - 0.3, cx + 0.5, top, z + 0.3], m: 'work', lamp: true }); L.push({ p: [cx, top - 0.6, z], c: K(4600), I: dawn ? 0 : 6000, spot: { d: [0, -1, 0.05], c0: Math.cos(0.5), c1: Math.cos(0.3) }, r: 0.3, shafts: true, vol: 0.35 }); }
  L.push({ p: [cx, top + 21, cz1 - 2], c: [1, 0.05, 0.02], I: 40, r: 0.45, shadow: false, vol: 1 });
  L.push({ p: [cx, top + 3.4, cz0 - 56.2], c: [1, 0.05, 0.02], I: 15, r: 0.3, shadow: false, vol: 1 });
  // a second crane further along, parked, its boom up
  { const c2 = 150; for (const x of [c2 - 9, c2 + 9]) for (const z of [cz0, cz1]) add({ box: [x - 0.7, QY, z - 0.7, x + 0.7, top, z + 0.7], m: 'crane' });
    add({ box: [c2 - 10, top - 3, cz0 - 1, c2 + 10, top, cz1 + 1], m: 'crane' });
    add({ hull: bar([c2, top, cz0], [c2, top + 52, cz0 - 30], 3, 2.4), m: 'crane' });
    add({ sph: [c2, top + 53, cz0 - 30.5, 0.45], m: 'red', lamp: true }); L.push({ p: [c2, top + 53, cz0 - 31.5], c: [1, 0.05, 0.02], I: 40, r: 0.45, shadow: false, vol: 1 }); }
  // boxes stacked on the quay behind, the town behind that
  const CQ = [[0.2, 0.055, 0.035], [0.06, 0.1, 0.16], [0.22, 0.21, 0.19], [0.27, 0.17, 0.05], [0.07, 0.13, 0.09]];
  let k2 = 0;
  for (let x = -140; x < 200; x += 13) for (const z of [34, 36.6, 39.2, 41.8]) { const nt = 1 + ((k2 * 5 + (x | 0)) % 4 + 4) % 4; for (let t = 0; t < nt; t++) { k2++; add({ box: [x, QY + t * 2.59, z, x + 12.19, QY + t * 2.59 + 2.59, z + 2.44], m: 'box', o: { col: CQ[k2 % CQ.length], seed: 100 + k2 } }); } }
  P.push(...town(31, { x0: -600, x1: 600, z0: 160, z1: 800, n: 120 }).map((q) => ({ ...q, box: [q.box[0], QY, q.box[2], q.box[3], q.box[4] + QY, q.box[5]] })));
  // the quay's lamp masts
  const masts = [[-70, -3.5], [-20, -3.5], [56, -3.5], [100, -3.5], [-40, 28], [60, 28], [130, 28]];
  for (const [x, z] of masts) { add({ cyl: [x, z, 0.3, QY, QY + 26], m: 'iron' }); add({ box: [x - 1.4, QY + 26, z - 0.6, x + 1.4, QY + 26.6, z + 0.6], m: 'iron' }); add({ sph: [x, QY + 25.8, z - 0.7, 0.4], m: 'sodium', lamp: true }); L.push({ p: [x, QY + 25.6, z - 0.9], c: K(2050), I: dawn ? 60 : 700, r: 0.4, vol: dawn ? 0.1 : 0.5 }); }
  // the lamp on our pier, behind us to the left
  L.push({ p: [220, QY + 8, PZ - 10], c: K(2000), I: dawn ? 10 : 90, r: 0.3, vol: 0.3 });
  if (dawn) L.push({ dir: V.norm([-0.35, -0.08, -0.93]), c: K(3000), I: 0.7, ang: 0.01, shafts: true, vol: 0.4, far: 260 });
  return {
    W: cam.W, H: cam.H, cam, prims: P, vs: 1,
    ground: { y: 0, m: 'sea' },
    mats: {
      quay: { kind: 'concrete', col: [0.25, 0.24, 0.22], lift: 1.1, streak: 0.7, wet: 0.4, base: -1 },
      quayTop: { kind: 'asphalt', col: [0.15, 0.145, 0.14], puddle: 0.54, wet: dawn ? 0.45 : 0.6 },
      edge: { kind: 'stripes', band: 0.6 }, fender: { kind: 'wood', col: [0.1, 0.07, 0.045], pw: 0.12, across: true, varnish: 0 },
      rail: { kind: 'metal', col: [0.3, 0.3, 0.3], ro: 0.2, metal: 0.9, wet: 0.6 },
      iron: { kind: 'metal', col: [0.04, 0.04, 0.04], ro: 0.35, wet: 0.6 }, rope: { kind: 'fabric', col: [0.16, 0.14, 0.1], wet: 0.5 },
      hull: { kind: 'rust', col: [0.02, 0.022, 0.025], plate: 2.4, plateW: 8, fresh: 0.3, lime: 0.1, wet: 0.35 },
      antifoul: { kind: 'rust', col: [0.14, 0.03, 0.025], plate: 2.4, plateW: 8, fresh: 0.5, lime: 0.2, wet: 0.8 },
      bulwark: { kind: 'panel', col: [0.03, 0.033, 0.036], pw: 4 }, box: { kind: 'corr' },
      house: { kind: 'panel', col: [0.45, 0.45, 0.43], pw: 2.5, base: 0, wet: 0.3 }, funnel: { kind: 'panel', col: [0.25, 0.05, 0.03], pw: 3 },
      glass: { kind: 'glass', panes: [7, 1] }, bridgeLit: { kind: 'window', panes: [7, 1], e: K(3200, 0.8), blinds: 0.15 },
      crane: { kind: 'metal', col: [0.3, 0.2, 0.04], ro: 0.6, wet: 0.3 }, craneHouse: { kind: 'panel', col: [0.32, 0.22, 0.05], pw: 1.6 },
      cab: { kind: 'panel', col: [0.3, 0.3, 0.28], pw: 1.2 }, cabLit: { kind: 'window', panes: [3, 1], e: K(3600, 0.5), blinds: 0 },
      red: { kind: 'emit', e: [4, 0.12, 0.05] }, green: { kind: 'emit', e: [0.1, 3, 0.6] }, white: { kind: 'emit', e: K(5000, 3) },
      sodium: { kind: 'emit', e: K(2000, 2.5) }, work: { kind: 'emit', e: K(4600, dawn ? 0.1 : 6) }, deckBulb: { kind: 'emit', e: K(2700, 2) },
      sea: { kind: 'water', col: [0.006, 0.008, 0.009], chop: dawn ? 0.03 : 0.05, scale: 0.35 },
      flats: { kind: 'flats', lit: dawn ? 0.04 : 0.14 },
    },
    lights: L,
    sky: dawn ? { zen: [0.05, 0.065, 0.09], hor: [0.34, 0.24, 0.18], cloud: 1, cloudCol: [0.12, 0.09, 0.09], scale: 0.3, seed: 71 } : { zen: [0.003, 0.004, 0.006], hor: [0.03, 0.024, 0.02], cloud: 1, cloudCol: [0.035, 0.025, 0.018], scale: 0.3, seed: 72 },
    amb: dawn ? { sky: [0.05, 0.06, 0.08], gnd: [0.015, 0.014, 0.013] } : { sky: [0.005, 0.007, 0.012], gnd: [0.002, 0.002, 0.002] },
    fog: dawn ? { s: 0.0028, g: 0.65, c: [0.09, 0.075, 0.07], sky: 900 } : { s: 0.003, g: 0.6, c: [0.003, 0.0035, 0.0045], sky: 900 },
    ao: { n: 8, d: 2 }, refl: { streak: Math.round(cam.W * 0.012) },
    exposure: dawn ? 0.9 : 2.0,
  };
}
