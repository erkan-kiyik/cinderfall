// KOR — series: act 3's places, for its films (docs §10.44). No one is in them.
//   boardroom   the tower's forty-second floor, Ocaksan's boardroom once: the long table,
//               Vorsa's laptops on it, the pale wall where the brass mark was pried off,
//               the safe; through the window the town far down and, off to the left, the
//               furnace burning again
//   bay         the loading bay under the tower: three dock doors, the third half up and
//               lit; HAWK's truck in the lane with its back doors open and nothing in it.
//               lampsOff: the bay's lamps cut (the ambush)
//   roof        the top of the tower: the broadcast mast (a lattice, dishes, red lamps),
//               guy wires, the transmitter hut, the helipad, the flagpole. time: 'night'
//               (the storm), 'flash' (the same, lit by lightning), 'dawn' (the morning
//               after: the sun behind the mast, the deck wet)
//   worksGate   the works' main gate on that morning: brick piers, OCAKSAN A.Ş. over it,
//               the gates open, the hiring banner on the wall, the safety board on the pier,
//               the furnace steaming beyond (the steelworks scene, relit)
import { K, V, obox, prismX } from './common.js';
import { rng } from '../../../../public/game/js/cine/noise.js';
import { steelworks } from './steel.js';

const rotY = (a) => { const c = Math.cos(a), s = Math.sin(a); return [[c, 0, -s], [0, 1, 0], [s, 0, c]]; };
// blocks of flats far below (y0: the street), with their windows
function skyline(add, seed, y0, { x0, x1, z0, z1, n, hMin, hMax, avoid }) {
  const r = rng(seed);
  for (let k = 0; k < n; k++) {
    const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0), w = 14 + r() * 30, d = 10 + r() * 14, h = hMin + r() * r() * (hMax - hMin);
    if (avoid && avoid(x, z)) continue;
    add({ box: [x - w / 2, y0, z - d / 2, x + w / 2, y0 + h, z + d / 2], m: 'flats', o: { seed: k * 13 + seed } });
  }
}
const NIGHT = {
  sky: { zen: [0.003, 0.0038, 0.0055], hor: [0.034, 0.023, 0.016], cloud: 1, cloudCol: [0.042, 0.027, 0.018], scale: 0.22, seed: 87 },
  amb: { sky: [0.004, 0.005, 0.008], gnd: [0.003, 0.0026, 0.0022] },
};

// --- m8: the boardroom ------------------------------------------------------------------------
export function boardroom(cam, o = {}) {
  const P = [], add = (q) => P.push(q), L = [], G = -160, X = 6.5, Z0 = -3, Z1 = 14, H = 3.4;
  add({ box: [-X, -0.3, Z0, X, 0, Z1 + 0.2], m: 'floor' });
  add({ box: [-X, H, Z0, X, H + 0.3, Z1 + 0.3], m: 'ceil' });
  add({ box: [-X, 0, Z0 - 0.3, X, H, Z0], m: 'walnut' });
  add({ box: [-X - 0.3, 0, Z0, -X, H, Z1], m: 'walnut' });
  add({ box: [X, 0, Z0, X + 0.3, H, Z1], m: 'walnut' });
  add({ box: [-X, 0, Z0, -X + 0.02, 0.12, Z1], m: 'skirt' }); add({ box: [X - 0.02, 0, Z0, X, 0.12, Z1], m: 'skirt' });
  // the window wall: open between the mullions (the glass is drawn live: rain on it)
  add({ box: [-X, 0, Z1, X, 0.16, Z1 + 0.25], m: 'frame' }); add({ box: [-X, H - 0.2, Z1, X, H, Z1 + 0.25], m: 'frame' });
  for (let x = -X; x <= X + 0.01; x += X / 4) add({ box: [x - 0.05, 0, Z1, x + 0.05, H, Z1 + 0.22], m: 'frame' });
  add({ box: [-X - 2, G, Z1 + 0.25, X + 2, -0.3, Z1 + 0.6], m: 'frame' });
  // ceiling: a coffer of slots, two lit over the table
  for (const z of [1, 4.5, 8, 11.5]) for (const x of [-3.6, 0, 3.6]) add({ box: [x - 1.2, H - 0.02, z - 0.05, x + 1.2, H, z + 0.05], m: x === 0 && (z === 4.5 || z === 8) ? 'slot' : 'slotOff', lamp: true });
  // the table, its pedestals
  add({ box: [-1.25, 0.74, 1.4, 1.25, 0.8, 11.2], m: 'tableTop' });
  for (const z of [3, 6.3, 9.6]) add({ box: [-0.55, 0, z - 0.3, 0.55, 0.74, z + 0.3], m: 'tableBase' });
  // chairs: a seat, a back, a stem, a foot; turned a little each, as they were left
  const r = rng(o.seed ?? 41);
  const chair = (x, z, face, tall = 0) => {
    const ax = rotY(face), c = [x, 0.48, z], back = V.add(c, V.mul(ax[0], -0.27));
    add({ hull: obox(c, ax, [0.27, 0.05, 0.27]), m: 'leather' });
    add({ hull: obox([back[0], 0.88 + tall / 2, back[2]], ax, [0.05, 0.36 + tall / 2, 0.26]), m: 'leather' });
    add({ cyl: [x, z, 0.035, 0.08, 0.43], m: 'chrome' }); add({ cyl: [x, z, 0.3, 0.02, 0.07], m: 'tableBase' });
  };
  for (const z of [2.3, 3.9, 5.5, 7.1, 8.7, 10.3]) { chair(-1.8, z, (r() - 0.5) * 0.4); chair(1.8, z, Math.PI + (r() - 0.5) * 0.4); }
  chair(0, 12.0, -Math.PI / 2 + 0.35, 0.3);
  // what Vorsa keeps on it: laptops open (their screens toward the chairs), files, a steel case
  const laptop = (x, z, side, m) => {
    add({ box: [x - 0.17, 0.8, z - 0.12, x + 0.17, 0.815, z + 0.12], m: 'device' });
    const ax = [[0, 0, 1], V.norm([-side * 0.26, 1, 0]), V.norm([1, side * 0.26, 0])];
    add({ hull: obox([x - side * 0.1, 0.93, z], ax, [0.16, 0.12, 0.006]), m });
  };
  laptop(0.75, 3.1, 1, 'screen'); laptop(0.75, 7.2, 1, 'screenRed'); laptop(-0.75, 5.2, -1, 'screen'); laptop(-0.75, 9.1, -1, 'screen');
  for (const [x, z, n] of [[0.2, 4.6, 5], [-0.3, 8.0, 3]]) for (let k = 0; k < n; k++) add({ box: [x - 0.16, 0.8 + k * 0.012, z - 0.12 + k * 0.004, x + 0.16, 0.811 + k * 0.012, z + 0.12 + k * 0.004], m: k % 2 ? 'paper' : 'folder' });
  add({ box: [-0.25, 0.8, 10.6, 0.25, 0.92, 10.95], m: 'chrome' });
  // the left wall: where the mark was, its picture lamp still over it; Vorsa's mark beside it
  add({ box: [-X, 0.75, 5.0, -X + 0.025, 3.0, 7.25], m: 'ghost' });
  add({ box: [-X, 3.05, 5.7, -X + 0.18, 3.11, 6.55], m: 'brass' });
  add({ box: [-X, 1.25, 8.6, -X + 0.03, 2.55, 10.35], m: 'vmark', cut: true });
  // the right wall: the safe, the old photograph
  add({ box: [X - 0.06, 0.9, 1.2, X, 1.75, 1.95], m: 'safe' });
  add({ cap: [X - 0.08, 1.33, 1.57, X - 0.06, 1.33, 1.57, 0.065], m: 'brass' });
  add({ box: [X - 0.03, 1.35, 4.4, X, 2.35, 5.7], m: 'photo' });
  // outside, far down: the town; off to the left the works, the furnace burning again
  skyline(add, 23, G, { x0: -1400, x1: 1400, z0: 60, z1: 1900, n: 420, hMin: 10, hMax: 150, avoid: (x, z) => Math.hypot(x + 470, z - 1300) < 140 });
  const F = [-470, G, 1300];
  add({ cyl: [F[0], F[2], 8, G, G + 46], m: 'furnace' }); add({ cyl: [F[0] - 46, F[2] + 22, 2.6, G, G + 82], m: 'furnace' });
  for (let k = 0; k < 4; k++) add({ cyl: [F[0] - 27 - k * 11.5, F[2] + 8, 4.4, G, G + 33], m: 'furnace' });
  add({ sph: [F[0], G + 50, F[2], 4.5], m: 'flame', lamp: true });
  add({ box: [F[0] - 8, G, F[2] - 34, F[0] + 8, G + 9, F[2] - 30], m: 'flame', lamp: true });
  L.push({ p: [F[0], G + 30, F[2] - 30], c: K(1700), I: 6e4, r: 6, vol: 2.2 });
  L.push({ p: [F[0], G + 52, F[2]], c: K(1800), I: 2e4, r: 4, vol: 2.0 });
  // a far tower's red lamps
  for (const [x, y, z] of [[380, G + 140, 900], [-900, G + 120, 1500]]) { add({ sph: [x, y, z, 1.2], m: 'red', lamp: true }); L.push({ p: [x, y, z], c: [1, 0.05, 0.02], I: 300, r: 1, shadow: false, vol: 1.2 }); }
  // inside: the two slots over the table, the picture lamp on the bare wood, the screens
  for (const z of [4.5, 8]) L.push({ p: [0, H - 0.1, z], c: K(3000), I: o.slotI ?? 3.2, r: 0.6, vol: 0.05 });
  L.push({ p: [-X + 0.2, 3.0, 6.12], c: K(2800), I: 9, spot: { d: V.norm([-0.25, -1, 0]), c0: Math.cos(0.75), c1: Math.cos(0.45) }, r: 0.05, vol: 0.2 });
  for (const [x, z, c] of [[0.6, 3.1, K(8000)], [0.6, 7.2, [1, 0.12, 0.08]], [-0.6, 5.2, K(8000)], [-0.6, 9.1, K(8000)]]) L.push({ p: [x, 0.95, z], c, I: 0.25, r: 0.12, vol: 0.05 });
  return {
    W: cam.W, H: cam.H, cam, prims: P, ground: { y: G, m: 'street' }, lights: L, vs: 1,
    mats: {
      floor: { kind: 'tile', col: [0.03, 0.028, 0.026], tw: 1.2, th: 1.2, gloss: 0.85, grime: 0.05, joint: [0.04, 0.04, 0.04], broken: 0 },
      ceil: { kind: 'flat', col: [0.07, 0.065, 0.06], ro: 0.8 },
      walnut: { kind: 'wood', col: [0.13, 0.068, 0.036], pw: 0.3, varnish: 0.3, ro: 0.35 },
      skirt: { kind: 'flat', col: [0.02, 0.016, 0.012], ro: 0.4 },
      frame: { kind: 'metal', col: [0.03, 0.03, 0.032], ro: 0.4, metal: 0.6 },
      slot: { kind: 'emit', e: K(3000, 1.4) }, slotOff: { kind: 'flat', col: [0.03, 0.03, 0.03], ro: 0.5 },
      tableTop: { kind: 'wood', col: [0.06, 0.03, 0.016], pw: 0.6, varnish: 0.8, ro: 0.12, across: true },
      tableBase: { kind: 'metal', col: [0.03, 0.03, 0.03], ro: 0.35, metal: 0.8 },
      leather: { kind: 'fabric', col: [0.02, 0.018, 0.016], ro: 0.45, wet: 0 },
      chrome: { kind: 'metal', col: [0.5, 0.5, 0.52], ro: 0.15, metal: 1 },
      device: { kind: 'metal', col: [0.06, 0.06, 0.065], ro: 0.3, metal: 0.8 },
      screen: { kind: 'emit', e: K(8000, 0.32) }, screenRed: { kind: 'emit', e: [0.5, 0.05, 0.03] },
      paper: { kind: 'flat', col: [0.6, 0.58, 0.54], ro: 0.8 }, folder: { kind: 'flat', col: [0.08, 0.1, 0.13], ro: 0.6 },
      ghost: { kind: 'image', tex: 'ocaksanGhost', col: [0.13, 0.068, 0.036], ro: 0.35 },
      vmark: { kind: 'image', tex: 'vantaWall', col: [0.7, 0.7, 0.72], ro: 0.25 },
      brass: { kind: 'metal', col: [0.55, 0.4, 0.15], ro: 0.3, metal: 1 },
      safe: { kind: 'metal', col: [0.1, 0.1, 0.1], ro: 0.4, metal: 0.8 },
      photo: { kind: 'image', tex: 'oldWorks', col: [0.4, 0.35, 0.3], ro: 0.4 },
      flats: { kind: 'flats', lit: 0.16, e: 0.7 }, street: { kind: 'asphalt', col: [0.05, 0.05, 0.05], wet: 0.6 },
      furnace: { kind: 'flat', col: [0.02, 0.016, 0.014], ro: 0.8 }, flame: { kind: 'emit', e: K(1700, 6) },
      red: { kind: 'emit', e: [4, 0.12, 0.05] },
    },
    ...NIGHT,
    sky: { ...NIGHT.sky, hor: [0.05, 0.026, 0.014], cloudCol: [0.06, 0.035, 0.022] },
    fog: { s: 0.0012, g: 0.6, c: [0.008, 0.0062, 0.005], sky: 380 },
    ao: { n: 8, d: 1.2 }, gi: { n: 16, step: 2, fill: 0.5 }, refl: { streak: Math.round(cam.W * 0.004) },
    exposure: o.exposure ?? 1.7,
  };
}

// --- m9: the loading bay ----------------------------------------------------------------------
export function bay(cam, o = {}) {
  const P = [], add = (q) => P.push(q), L = [], off = !!o.lampsOff, X0 = -12, X1 = 9, ZB = -12, ZW = 24, H = 5.2;
  // the slab over it, the beams, the walls; the dock wall with its three doors
  add({ box: [X0, H, ZB, X1, H + 0.5, ZW + 7], m: 'conc' });
  for (let z = ZB + 2; z < ZW; z += 4) add({ box: [X0, H - 0.55, z - 0.2, X1, H, z + 0.2], m: 'conc' });
  add({ box: [X0 - 0.4, 0, ZB, X0, H, ZW], m: 'wallC' }); add({ box: [X1, 0, ZB, X1 + 0.4, H, ZW], m: 'wallC' });
  add({ box: [X0, 0, ZB - 0.4, X1, H, ZB], m: 'wallC' });
  const doors = [[-8, 1], [-2.5, 2], [3, 3]];
  const holes = doors.map(([x]) => ({ x0: x - 1.6, x1: x + 1.6, y0: 0, y1: 3.6 }));
  // the wall in strips round the doors (a box each), then the doors
  let xa = X0; for (const h of holes) { add({ box: [xa, 0, ZW, h.x0, H, ZW + 0.3], m: 'wallC' }); add({ box: [h.x0, h.y1, ZW, h.x1, H, ZW + 0.3], m: 'wallC' }); xa = h.x1; } add({ box: [xa, 0, ZW, X1, H, ZW + 0.3], m: 'wallC' });
  for (const [x, n] of doors) {
    const up = n === 3 ? 1.35 : 0;
    add({ box: [x - 1.6, up, ZW + 0.12, x + 1.6, 3.6, ZW + 0.2], m: 'shutter' });
    add({ box: [x - 1.6, 3.6, ZW - 0.05, x + 1.6, 4.05, ZW + 0.3], m: 'steelD' });
    add({ box: [x - 0.55, 4.15, ZW - 0.01, x + 0.55, 4.95, ZW], m: `bay${n}` });
    for (const s of [-1, 1]) { add({ box: [x + s * 1.75 - 0.15, 0.2, ZW - 0.25, x + s * 1.75 + 0.15, 1.3, ZW], m: 'rubber' }); add({ box: [x + s * 1.7 - 0.08, 0, ZW - 0.02, x + s * 1.7 + 0.08, 3.6, ZW], m: 'stripes' }); }
  }
  // behind the third door: a lit store room (its light out under the shutter onto the wet floor)
  add({ box: [1.2, 0, ZW + 6, 4.8, H, ZW + 6.3], m: 'wallC' }); add({ box: [1.0, 0, ZW + 0.3, 1.2, H, ZW + 6], m: 'wallC' }); add({ box: [4.8, 0, ZW + 0.3, 5.0, H, ZW + 6], m: 'wallC' });
  add({ box: [1.4, 0, ZW + 4.2, 2.6, 1.6, ZW + 5.4], m: 'crate' }); add({ box: [3.3, 0, ZW + 3.8, 4.4, 1.0, ZW + 4.9], m: 'crate' });
  // the columns, a dock number on the one by the truck; a stripe painted along the dock
  for (const z of [0, 10, 20]) for (const x of [-6, 6]) { add({ box: [x - 0.25, 0, z - 0.25, x + 0.25, H, z + 0.25], m: 'conc' }); add({ box: [x - 0.27, 0, z - 0.27, x + 0.27, 1.0, z + 0.27], m: 'stripes' }); }
  add({ box: [5.76, 1.6, 9.73, 6.24, 2.2, 9.749], m: 'bay3' });
  add({ box: [X0, 0, ZW - 1.3, X1, 0.004, ZW - 1.0], m: 'stripes' });
  for (let z = ZB; z < ZW - 2; z += 3.4) add({ box: [-4.1, 0, z, -3.95, 0.004, z + 1.8], m: 'paint' });
  // the truck: its box open at the back, empty; the doors swung wide; the cab toward the dock
  const T = 1.5, tz0 = 6, tz1 = 13.4, tl = T - 1.25, tr = T + 1.25;
  add({ box: [tl, 1.1, tz0, tr, 1.18, tz1], m: 'planks' });
  add({ box: [tl - 0.05, 1.12, tz0, tl, 3.56, tz1], m: 'skin' }); add({ box: [tl, 1.18, tz0, tl + 0.04, 3.5, tz1], m: 'cargo' });
  add({ box: [tr, 1.12, tz0, tr + 0.05, 3.56, tz1], m: 'skin' }); add({ box: [tr - 0.04, 1.18, tz0, tr, 3.5, tz1], m: 'cargo' });
  add({ box: [tl - 0.05, 3.5, tz0, tr + 0.05, 3.6, tz1], m: 'skin' });
  add({ box: [tl, 1.18, tz1 - 0.05, tr, 3.5, tz1], m: 'cargo' });
  for (let zz = tz0 + 0.5; zz < tz1 - 0.3; zz += 0.62) for (const x of [tl + 0.04, tr - 0.07]) add({ box: [x, 1.18, zz - 0.03, x + 0.03, 3.5, zz + 0.03], m: 'steelD' });
  for (const y of [1.9, 2.8]) for (const x of [tl + 0.04, tr - 0.06]) add({ box: [x, y, tz0 + 0.2, x + 0.02, y + 0.08, tz1 - 0.1], m: 'planks' });
  add({ box: [tl - 0.1, 1.0, tz0 - 0.08, tl + 0.06, 3.62, tz0 + 0.04], m: 'steelD' }); add({ box: [tr - 0.06, 1.0, tz0 - 0.08, tr + 0.1, 3.62, tz0 + 0.04], m: 'steelD' });
  add({ box: [tl - 0.1, 3.5, tz0 - 0.08, tr + 0.1, 3.64, tz0 + 0.04], m: 'steelD' }); add({ box: [tl - 0.1, 0.98, tz0 - 0.1, tr + 0.1, 1.12, tz0 + 0.04], m: 'steelD' });
  add({ hull: obox([tl - 0.72, 2.35, tz0 - 0.32], rotY(-0.55), [0.62, 1.2, 0.03]), m: 'skin' });
  add({ hull: obox([tr + 0.62, 2.35, tz0 - 0.05], rotY(0.08), [0.62, 1.2, 0.03]), m: 'skin' });
  // a strap left hanging, a torn tarp on the floor: nothing else
  add({ box: [tl + 0.05, 1.5, 9.4, tl + 0.07, 3.45, 9.46], m: 'strap' });
  add({ hull: obox([T + 0.3, 1.19, 11.2], rotY(0.4), [0.7, 0.01, 0.5]), m: 'tarp' });
  add({ box: [T - 0.25, 3.47, tz0 + 0.8, T + 0.25, 3.5, tz1 - 0.8], m: off ? 'strip' : 'strip' });
  // under it: the chassis, the bumper, the lamps, the wheels (twin at the back), the exhaust
  add({ box: [T - 0.9, 0.55, tz0 + 0.2, T + 0.9, 1.1, 16.1], m: 'chassis' });
  add({ box: [tl - 0.05, 0.48, tz0 - 0.25, tr + 0.05, 0.7, tz0 - 0.05], m: 'chassis' });
  for (const s of [-1, 1]) { const x = T + s * 1.05; add({ box: [x - 0.16, 0.74, tz0 - 0.27, x + 0.16, 0.94, tz0 - 0.24], m: 'tail', lamp: true }); add({ box: [x - s * 0.24 - 0.07, 0.74, tz0 - 0.27, x - s * 0.24 + 0.07, 0.94, tz0 - 0.24], m: 'amberOff' }); }
  add({ box: [T - 0.3, 0.52, tz0 - 0.28, T + 0.3, 0.68, tz0 - 0.26], m: 'plate' });
  for (const z of [7.9, 9.1, 14.7]) for (const s of [-1, 1]) { const x0 = T + s * 0.62, x1 = T + s * (z < 10 ? 1.22 : 1.05); add({ hull: prismX((x0 + x1) / 2, 0.48, z, 0.48, Math.abs(x1 - x0), 18), m: 'tyre' }); }
  add({ cap: [T - 0.7, 0.36, 8.6, T - 0.7, 0.36, tz0 - 0.1, 0.05], m: 'chrome' });
  add({ box: [tl + 0.05, 0.6, 13.5, tr - 0.05, 3.0, 16.3], m: 'cab' });
  add({ box: [tl + 0.03, 1.9, 14.6, tl + 0.06, 2.7, 15.9], m: 'cabGlass' });
  add({ box: [tl - 0.32, 2.0, 14.0, tl - 0.24, 2.6, 14.12], m: 'chassis' }); add({ box: [tl - 0.3, 2.25, 14.06, tl + 0.05, 2.29, 14.1], m: 'chassis' });
  // lamps: the bay's sodium heads (off: the ambush), the truck's box light, its tail lamps and
  // headlights on the dock wall, the store room through the third door
  for (const z of [-4, 4, 12, 20]) for (const x of [-7.5, -1.5, 4.5]) {
    add({ box: [x - 0.5, H - 0.62, z - 0.18, x + 0.5, H - 0.55, z + 0.18], m: off ? 'lampOff' : 'sodium', lamp: true });
    if (!off) L.push({ p: [x, H - 0.75, z], c: K(2000), I: 4.5, r: 0.35, vol: 0.5 });
  }
  L.push({ p: [T, 3.3, 9.6], c: K(5200), I: 2.4, r: 0.5, vol: 0.25 });
  for (const s of [-1, 1]) L.push({ p: [T + s * 1.05, 0.84, tz0 - 0.4], c: [1, 0.04, 0.02], I: 0.8, r: 0.15, vol: 0.5, shadow: false });
  for (const s of [-1, 1]) L.push({ p: [T + s * 0.85, 1.0, 16.45], c: K(4300), I: 260, spot: { d: V.norm([0, -0.05, 1]), c0: Math.cos(0.42), c1: Math.cos(0.25) }, r: 0.12, shafts: true, vol: 0.7 });
  L.push({ p: [3, 3.2, ZW + 3.2], c: K(5000), I: 22, r: 0.4, vol: 0.5 });
  return {
    W: cam.W, H: cam.H, cam, prims: P, ground: { y: 0, m: 'floor' }, lights: L, vs: 1,
    mats: {
      floor: { kind: 'asphalt', col: [0.09, 0.088, 0.083], puddle: 0.62, wet: 0.55, cracks: 0.6 },
      conc: { kind: 'concrete', col: [0.22, 0.215, 0.205], lift: 0.6, streak: 0.5, wet: 0.1 },
      wallC: { kind: 'concrete', col: [0.2, 0.198, 0.19], lift: 0.8, streak: 0.9, wet: 0.15, base: 0.4 },
      shutter: { kind: 'shutter', col: [0.25, 0.26, 0.26] }, steelD: { kind: 'metal', col: [0.08, 0.08, 0.08], ro: 0.5, metal: 0.6, wet: 0.2 },
      rubber: { kind: 'flat', col: [0.015, 0.015, 0.015], ro: 0.7 }, stripes: { kind: 'stripes', col: [0.5, 0.36, 0.03], band: 0.15 },
      paint: { kind: 'flat', col: [0.45, 0.43, 0.38], ro: 0.6, wet: 0.4 },
      bay1: { kind: 'image', tex: 'bay1', col: [0.2, 0.2, 0.2], ro: 0.7 }, bay2: { kind: 'image', tex: 'bay2', col: [0.2, 0.2, 0.2], ro: 0.7 }, bay3: { kind: 'image', tex: 'bay3', col: [0.2, 0.2, 0.2], ro: 0.7 },
      crate: { kind: 'crate', col: [0.32, 0.24, 0.15] },
      planks: { kind: 'wood', col: [0.16, 0.11, 0.07], pw: 0.18, varnish: 0.05, ro: 0.7 },
      skin: { kind: 'metal', col: [0.4, 0.41, 0.4], ro: 0.5, metal: 0.1, wet: 0.2 }, cargo: { kind: 'metal', col: [0.3, 0.3, 0.29], ro: 0.6, metal: 0.2, wet: 0 },
      strap: { kind: 'flat', col: [0.5, 0.25, 0.04], ro: 0.6 }, tarp: { kind: 'cloth', col: [0.08, 0.14, 0.2], folds: 4 },
      strip: { kind: 'emit', e: K(5200, 1.2) },
      chassis: { kind: 'metal', col: [0.03, 0.03, 0.03], ro: 0.6, metal: 0.5, wet: 0.2 },
      tail: { kind: 'emit', e: [2.2, 0.06, 0.03] }, amberOff: { kind: 'flat', col: [0.3, 0.15, 0.02], ro: 0.2 },
      plate: { kind: 'flat', col: [0.6, 0.6, 0.58], ro: 0.4 },
      tyre: { kind: 'flat', col: [0.015, 0.015, 0.015], ro: 0.8, wet: 0.2 }, hub: { kind: 'metal', col: [0.25, 0.25, 0.25], ro: 0.4, metal: 0.8 },
      chrome: { kind: 'metal', col: [0.4, 0.4, 0.42], ro: 0.2, metal: 1 },
      cab: { kind: 'panel', col: [0.12, 0.17, 0.16], pw: 2.4, base: 0, wet: 0.2 }, cabGlass: { kind: 'flat', col: [0.01, 0.012, 0.014], ro: 0.05 },
      sodium: { kind: 'emit', e: K(2000, 1.4) }, lampOff: { kind: 'flat', col: [0.05, 0.045, 0.04], ro: 0.4 },
    },
    sky: { zen: [0.002, 0.002, 0.003], hor: [0.01, 0.008, 0.006], cloud: 0 },
    amb: { sky: [0.001, 0.001, 0.0012], gnd: [0.001, 0.0009, 0.0008] },
    fog: { s: 0.016, g: 0.5, c: [0.004, 0.0035, 0.003], sky: 80 },
    ao: { n: 8, d: 1.2 }, gi: { n: 12, step: 2, fill: 0.5 }, refl: { streak: Math.round(cam.W * 0.01) },
    exposure: o.exposure ?? (off ? 1.9 : 1.6),
  };
}

// --- m10 and the end: the roof ----------------------------------------------------------------
export const MAST = { x: 0, z: 14, h: 26, r0: 1.6, r1: 0.65 };
export const FLAGPOLE = { x: 9, z: 1, h: 14 };
export function roof(cam, o = {}) {
  const P = [], add = (q) => P.push(q), L = [], G = -172, time = o.time || 'night', dawn = time === 'dawn', flash = time === 'flash';
  // the deck, the parapet and its coping; below, the tower's faces down to the street
  add({ box: [-22, -1.2, -20, 22, 0, 30], m: 'deck' });
  for (const [a, b] of [[[-22, -20], [22, -19.6]], [[-22, 29.6], [22, 30]], [[-22, -20], [-21.6, 30]], [[21.6, -20], [22, 30]]]) { add({ box: [a[0], 0, a[1], b[0], 1.15, b[1]], m: 'parapet' }); add({ box: [a[0] - 0.04, 1.15, a[1] - 0.04, b[0] + 0.04, 1.22, b[1] + 0.04], m: 'coping' }); }
  add({ box: [-22, G, -20, 22, -1.2, 30], m: 'face' });
  // the mast: a lattice of three legs narrowing up, rings and diagonals between them
  const M = MAST, lv = [];
  for (let y = 0; y <= M.h + 0.01; y += 2.5) { const rr = M.r0 + (M.r1 - M.r0) * (y / M.h); lv.push([0, 1, 2].map((k) => { const a = Math.PI / 2 + (k * 2 * Math.PI) / 3; return [M.x + rr * Math.cos(a), y + 0.6, M.z + rr * Math.sin(a)]; })); }
  for (let i = 0; i < lv.length; i++) for (let k = 0; k < 3; k++) {
    const p = lv[i][k], q = lv[i][(k + 1) % 3];
    add({ cap: [...p, ...q, 0.04], m: 'lattice' });
    if (i + 1 < lv.length) { const u = lv[i + 1][k], d = lv[i + 1][(k + 1) % 3]; add({ cap: [...p, ...u, 0.085], m: 'lattice' }); add({ cap: [...p, ...d, 0.032], m: 'lattice' }); }
  }
  add({ box: [M.x - 2.4, 0, M.z - 2.4, M.x + 2.4, 0.6, M.z + 2.4], m: 'plinth' });
  add({ cap: [M.x, M.h + 0.6, M.z, M.x, M.h + 4.4, M.z, 0.07], m: 'lattice' });
  // dishes and panel antennas
  for (const [y, dir, s] of [[14, [-0.35, -0.05, -1], 1.2], [18, [1, 0.05, -0.2], 0.95], [9, [-1, 0, 0.25], 0.85]]) {
    const d = V.norm(dir), rr = M.r0 + (M.r1 - M.r0) * (y / M.h), c = [M.x + d[0] * (rr + 0.6), y, M.z + d[2] * (rr + 0.6)];
    const u = V.norm([d[2], 0, -d[0]]), w = [u[1] * d[2] - u[2] * d[1], u[2] * d[0] - u[0] * d[2], u[0] * d[1] - u[1] * d[0]];
    add({ ell: { c, axes: [u, w, d], r: [s, s, 0.14] }, m: 'dish' });
    add({ cap: [M.x, y, M.z, c[0] - d[0] * 0.2, y, c[2] - d[2] * 0.2, 0.06], m: 'lattice' });
  }
  for (let k = 0; k < 3; k++) { const a = Math.PI / 2 + (k * 2 * Math.PI) / 3 + Math.PI / 3, rr = M.r1 + 0.35; add({ hull: obox([M.x + rr * Math.cos(a), 23, M.z + rr * Math.sin(a)], rotY(-a), [0.07, 1.3, 0.22]), m: 'panelAnt' }); }
  // the red lamps (blinked live over the plate, so dim here) and the guy wires
  const reds = [[M.x, M.h + 4.5, M.z, 0.24], ...[9, 18].flatMap((y) => [0, 1, 2].map((k) => { const a = Math.PI / 2 + (k * 2 * Math.PI) / 3, rr = M.r0 + (M.r1 - M.r0) * (y / M.h) + 0.12; return [M.x + rr * Math.cos(a), y + 0.6, M.z + rr * Math.sin(a), 0.13]; }))];
  for (const [x, y, z, s] of reds) { add({ sph: [x, y, z, s], m: 'red', lamp: true }); L.push({ p: [x, y, z], c: [1, 0.05, 0.02], I: s > 0.2 ? 6 : 2.5, r: s, shadow: false, vol: 1.0 }); }
  for (const [x, z] of [[-16, 26], [16, 26], [-3, -6]]) { const p = [x, 0.4, z], top = [M.x, 20, M.z]; add({ cap: [...p, ...top, 0.014], m: 'cable' }); add({ box: [x - 0.4, 0, z - 0.4, x + 0.4, 0.4, z + 0.4], m: 'plinth' }); }
  // the transmitter hut, its door, its lit window; the cable tray to the mast
  add({ box: [-15, 0, 9, -7.4, 3.2, 18], m: 'hut' }); add({ box: [-15.2, 3.2, 8.8, -7.2, 3.4, 18.2], m: 'coping' });
  add({ box: [-7.42, 0, 11.8, -7.36, 2.2, 12.9], m: 'hutDoor' });
  add({ box: [-7.42, 1.2, 14.6, -7.36, 2.2, 16.6], m: 'hutWin' });
  add({ box: [-7.4, 1.65, 13.8, M.x - 1.6, 1.8, 14.2], m: 'tray' });
  for (const x of [-6, -4, -2.2]) add({ box: [x - 0.05, 0, 13.95, x + 0.05, 1.65, 14.05], m: 'tray' });
  // plant: two units with fans; a dish on a stand
  for (const [x, z] of [[9, 20], [14.5, 20]]) { add({ box: [x - 2.4, 0, z - 1.6, x + 2.4, 1.9, z + 1.6], m: 'hvac' }); for (const s of [-1, 1]) add({ cyl: [x + s * 1.2, z, 0.9, 1.9, 1.95], m: 'grille' }); }
  add({ ell: { c: [-14, 2.0, -6], axes: [V.norm([1, 0, 0.3]), V.norm([-0.12, 0.6, 0.4]), V.norm([0.25, 0.8, -0.55])], r: [1.6, 1.6, 0.2] }, m: 'dish' });
  add({ cyl: [-14, -6, 0.08, 0, 1.7], m: 'lattice' });
  // the helipad
  add({ box: [4, 0, -12, 18, 0.012, 2], m: 'pad', cut: true });
  // the flagpole by the parapet: Vorsa took Ocaksan's flag down from it
  const F = FLAGPOLE;
  add({ cyl: [F.x, F.z, 0.11, 0, F.h], m: 'pole' }); add({ sph: [F.x, F.h + 0.22, F.z, 0.2], m: 'gold' });
  add({ box: [F.x - 0.6, 0, F.z - 0.6, F.x + 0.6, 0.35, F.z + 0.6], m: 'plinth' });
  add({ cap: [F.x + 0.12, 0.9, F.z, F.x + 0.12, F.h - 0.1, F.z, 0.008], m: 'cable' });
  // the town far down
  skyline(add, 29, G, { x0: -1500, x1: 1500, z0: -1500, z1: 1800, n: 520, hMin: 10, hMax: 120, avoid: (x, z) => Math.abs(x) < 60 && z > -60 && z < 80 });
  // light
  if (!dawn) {
    L.push({ p: [-6.9, 1.8, 15.6], c: K(4500), I: 1.6, r: 0.4, vol: 0.2 });
    L.push({ p: [7, 0.6, 3], c: K(5600), I: 3200, spot: { d: V.norm(V.sub([M.x, 24, M.z], [7, 0.6, 3])), c0: Math.cos(0.3), c1: Math.cos(0.18) }, r: 0.2, shafts: true, vol: 0.6 });
    add({ box: [6.7, 0, 2.7, 7.3, 0.55, 3.3], m: 'lattice' });
  }
  if (flash) L.push({ dir: V.norm([0.35, -0.8, -0.5]), c: K(9000), I: 2.2, ang: 0.04, vol: 0.3, far: 400 });
  if (dawn) L.push({ dir: V.norm([-0.25, -0.12, -0.96]), c: K(3200), I: 2.4, ang: 0.01, shafts: true, vol: 0.6, far: 300 });
  const sky = dawn ? { zen: [0.1, 0.13, 0.22], hor: [0.95, 0.56, 0.3], cloud: 1.4, cloudCol: [0.75, 0.42, 0.3], scale: 0.5, seed: 91 }
    : flash ? { zen: [0.05, 0.06, 0.1], hor: [0.1, 0.11, 0.15], cloud: 1, cloudCol: [0.35, 0.38, 0.5], scale: 0.22, seed: 87 } : { ...NIGHT.sky, zen: [0.006, 0.006, 0.008], hor: [0.04, 0.026, 0.018], cloudCol: [0.07, 0.045, 0.03] };
  return {
    W: cam.W, H: cam.H, cam, prims: P, ground: { y: G, m: 'street' }, lights: L, vs: 1, sky,
    mats: {
      deck: { kind: 'asphalt', col: [0.07, 0.07, 0.068], puddle: 0.62, wet: dawn ? 0.5 : 0.6, cracks: 0.3 },
      parapet: { kind: 'concrete', col: [0.25, 0.24, 0.23], lift: 0.55, streak: 0.8, wet: 0.45 },
      coping: { kind: 'metal', col: [0.16, 0.16, 0.16], ro: 0.35, wet: 0.7 },
      face: { kind: 'flats', col: [0.012, 0.014, 0.016], lit: 0.035, e: 1.0, fh: 4, wp: 2.6 },
      lattice: { kind: 'metal', col: [0.22, 0.2, 0.18], ro: 0.45, metal: 0.6, wet: 0.5 },
      plinth: { kind: 'concrete', col: [0.3, 0.29, 0.27], lift: 0.4, streak: 0.6, wet: 0.4 },
      dish: { kind: 'metal', col: [0.13, 0.13, 0.13], ro: 0.45, metal: 0.3, wet: 0.4 }, panelAnt: { kind: 'flat', col: [0.5, 0.5, 0.48], ro: 0.5, wet: 0.4 },
      red: { kind: 'emit', e: dawn ? [1.2, 0.04, 0.02] : [2, 0.07, 0.03] },
      cable: { kind: 'metal', col: [0.1, 0.1, 0.1], ro: 0.4 },
      hut: { kind: 'cladding', col: [0.32, 0.33, 0.32], rust: 0.3 }, hutDoor: { kind: 'panel', col: [0.18, 0.2, 0.2], pw: 1.1, base: 0.1 },
      hutWin: { kind: 'window', panes: [2, 1], frame: 0.05, e: dawn ? K(4500, 0.05) : K(4500, 0.5), blinds: 0.2, lampU: 0.4 },
      tray: { kind: 'metal', col: [0.3, 0.3, 0.29], ro: 0.4, metal: 0.7, wet: 0.5 },
      hvac: { kind: 'panel', col: [0.36, 0.37, 0.36], pw: 1.2, base: 0.1, wet: 0.4 }, grille: { kind: 'flat', col: [0.03, 0.03, 0.03], ro: 0.6 },
      pad: { kind: 'image', tex: 'helipad', col: [0.5, 0.5, 0.5], ro: 0.5, wet: 0.5 },
      pole: { kind: 'metal', col: [0.7, 0.7, 0.68], ro: 0.25, metal: 0.6, wet: 0.4 }, gold: { kind: 'metal', col: [0.75, 0.55, 0.2], ro: 0.2, metal: 1 },
      flats: { kind: 'flats', lit: dawn ? 0.03 : 0.16, e: 0.7 }, street: { kind: 'asphalt', col: [0.05, 0.05, 0.05], wet: 0.6 },
    },
    amb: dawn ? { sky: [0.06, 0.06, 0.07], gnd: [0.03, 0.024, 0.02] } : flash ? { sky: [0.05, 0.055, 0.07], gnd: [0.01, 0.01, 0.012] } : NIGHT.amb,
    fog: dawn ? { s: 0.0014, g: 0.6, c: [0.26, 0.17, 0.12], sky: 260 } : { s: 0.0035, g: 0.6, c: flash ? [0.03, 0.032, 0.04] : [0.007, 0.006, 0.005], sky: 220 },
    ao: { n: 8, d: 2 }, refl: { streak: Math.round(cam.W * 0.008) },
    exposure: o.exposure ?? (dawn ? 1.0 : flash ? 1.3 : 1.9),
  };
}

// --- the end: the works' gate, the morning after ------------------------------------------------
export function worksGate(cam, o = {}) {
  const s = steelworks(cam, { state: 'relit' }), add = (q) => s.prims.push(q);
  const z = -160, gx0 = -33.4, gx1 = -18.6;
  // the piers, their caps; the steel over the opening with the name on it
  for (const [a, b] of [[gx0, gx0 + 1.4], [gx1 - 1.4, gx1]]) { add({ box: [a, 0, z - 0.7, b, 6.2, z + 0.7], m: 'pier' }); add({ box: [a - 0.12, 6.2, z - 0.82, b + 0.12, 6.45, z + 0.82], m: 'capStone' }); }
  add({ box: [gx0 + 1.4, 6.05, z - 0.25, gx1 - 1.4, 7.55, z + 0.25], m: 'beam' });
  add({ box: [gx0 + 1.9, 6.2, z - 0.27, gx1 - 1.9, 7.4, z - 0.25], m: 'gateSign' });
  // the gates, swung in against the yard
  for (const [hx, s2] of [[gx0 + 1.4, 1], [gx1 - 1.4, -1]]) for (let k = 0; k < 26; k++) { const zz = z + 0.4 + k * 0.23; add({ box: [hx + s2 * 0.05 - 0.02, 0.15, zz - 0.02, hx + s2 * 0.05 + 0.02, 2.9, zz + 0.02], m: 'gateBar' }); }
  for (const [hx, s2] of [[gx0 + 1.4, 1], [gx1 - 1.4, -1]]) for (const y of [0.3, 1.5, 2.8]) add({ box: [hx + s2 * 0.05 - 0.04, y, z + 0.3, hx + s2 * 0.05 + 0.04, y + 0.08, z + 6.4], m: 'gateBar' });
  // the wall either side: brick, coped; the banner on it; the booth inside
  add({ box: [-120, 0, z - 0.3, gx0, 2.6, z + 0.3], m: 'brick' }); add({ box: [gx1, 0, z - 0.3, 60, 2.6, z + 0.3], m: 'brick' });
  add({ box: [-120, 2.6, z - 0.38, gx0, 2.75, z + 0.38], m: 'capStone' }); add({ box: [gx1, 2.6, z - 0.38, 60, 2.75, z + 0.38], m: 'capStone' });
  add({ box: [-42.9, 0.95, z - 0.34, -34.9, 2.43, z - 0.31], m: 'banner' });
  for (const x of [-42.9, -38.9, -34.9]) add({ cap: [x, 2.43, z - 0.33, x, 2.6, z - 0.3, 0.01], m: 'cord' });
  add({ box: [gx0 + 0.1, 2.2, z - 0.76, gx0 + 1.3, 3.0, z - 0.72], m: 'board' });
  add({ box: [-16.5, 0, z + 3, -13, 2.8, z + 6], m: 'booth' }); add({ box: [-16.7, 2.8, z + 2.8, -12.8, 3.0, z + 6.2], m: 'capStone' });
  add({ box: [-16.52, 1.1, z + 3.6, -16.48, 2.1, z + 5.4], m: 'boothWin' });
  // the road in through the gate, a lamp post either side (off: it is morning)
  for (const x of [gx0 + 2.2, gx1 - 2.2]) { add({ cyl: [x, z + 9, 0.09, 0, 6], m: 'beam' }); add({ box: [x - 0.25, 5.9, z + 8.75, x + 0.25, 6.05, z + 9.25], m: 'beam' }); }
  Object.assign(s.mats, {
    pier: { kind: 'brick', col: [0.24, 0.11, 0.07], soot: [0, 0] }, brick: { kind: 'brick', col: [0.22, 0.1, 0.065], soot: [0, 0] },
    capStone: { kind: 'concrete', col: [0.36, 0.35, 0.33], lift: 0.3, streak: 0.5, wet: 0.4 },
    beam: { kind: 'metal', col: [0.06, 0.055, 0.05], ro: 0.5, metal: 0.6, wet: 0.4 },
    gateSign: { kind: 'image', tex: 'gateSign', col: [0.2, 0.2, 0.2], ro: 0.45, wet: 0.2 },
    gateBar: { kind: 'metal', col: [0.05, 0.05, 0.05], ro: 0.5, metal: 0.5, wet: 0.4 },
    banner: { kind: 'image', tex: 'hiringBanner', col: [0.7, 0.66, 0.58], ro: 0.85, wet: 0.1 },
    cord: { kind: 'flat', col: [0.4, 0.38, 0.33], ro: 0.8 },
    board: { kind: 'image', tex: 'safetyBoard', col: [0.4, 0.4, 0.4], ro: 0.3, wet: 0.25 },
    booth: { kind: 'panel', col: [0.42, 0.42, 0.4], pw: 1.2, base: 0.1, wet: 0.3 },
    boothWin: { kind: 'window', panes: [3, 1], frame: 0.05, e: K(3200, 0.25), blinds: 0.3, lampU: 0.5 },
  });
  // morning: the sun lower and warmer than act 2's, from the left; the yard steaming
  s.lights = s.lights.filter((l) => !l.dir); s.lights.push({ dir: V.norm([0.6, -0.16, 0.78]), c: K(3100), I: 1.5, ang: 0.01, shafts: true, vol: 0.5, far: 300 });
  s.sky = { zen: [0.1, 0.13, 0.19], hor: [0.85, 0.52, 0.3], cloud: 1, cloudCol: [0.45, 0.3, 0.22], scale: 0.3, seed: 64 };
  s.amb = { sky: [0.06, 0.06, 0.07], gnd: [0.025, 0.02, 0.016] };
  s.mats.yard = { ...s.mats.yard, wet: 0.35, puddle: 0.52 };
  s.fog = { ...s.fog, sky: 320 };
  s.exposure = o.exposure ?? 1.0;
  return s;
}
