// KOR — series: rooms. The basement (the table under its lamp; the photograph
// and the scarf on the wall), HAWK's back room, the secretary's office and
// his desk, the records room. Each a box of walls lit by its own lamps, the
// light bounced once round the room (gi); things on tables built from the
// tracer's shapes, papers as pictures (textures.js).
import { K, V, wall, bar, obox } from './common.js';

// a truncated cone (a lamp shade, a bucket): centre, radii at the foot and top, heights, sides
export function frustum(cx, cz, r0, r1, y0, y1, n = 18) {
  const planes = [[0, -1, 0, -y0], [0, 1, 0, y1]], h = y1 - y0, k = 1 / Math.cos(Math.PI / n);
  for (let i = 0; i < n; i++) { const a = (2 * Math.PI * i) / n, c = Math.cos(a), s = Math.sin(a), l = Math.hypot(h, r0 - r1), nx = (c * h) / l, ny = (r0 - r1) / l, nz = (s * h) / l; planes.push([nx, ny, nz, nx * (cx + c * r0 * k) + ny * y0 + nz * (cz + s * r0 * k)]); }
  const R = Math.max(r0, r1) * k;
  return { planes, aabb: [cx - R, y0, cz - R, cx + R, y1, cz + R] };
}
// a mug: the body, the coffee a hair under the rim, a handle
function mug(add, x, y, z, ang = 0, col = [0.62, 0.6, 0.55]) {
  add({ cyl: [x, z, 0.041, y, y + 0.096], m: 'ceramic', o: { col } });
  add({ cyl: [x, z, 0.036, y + 0.096, y + 0.0965], m: 'coffee' });
  const c = Math.cos(ang), s = Math.sin(ang), hx = x + c * 0.05, hz = z + s * 0.05;
  add({ cap: [x + c * 0.04, y + 0.075, z + s * 0.04, hx, y + 0.07, hz, 0.007], m: 'ceramic', o: { col } });
  add({ cap: [hx, y + 0.07, hz, hx, y + 0.03, hz, 0.007], m: 'ceramic', o: { col } });
  add({ cap: [hx, y + 0.03, hz, x + c * 0.04, y + 0.025, z + s * 0.04, 0.007], m: 'ceramic', o: { col } });
}
// a hanging lamp: the flex, an enamel shade, the bulb under it; returns the light
function pendant(add, x, y, z, ceil, I = 3, k = 2700, shade = 'enamel') {
  add({ cap: [x, ceil, z, x, y + 0.16, z, 0.004], m: 'flex' });
  add({ hull: frustum(x, z, 0.21, 0.05, y, y + 0.15), m: shade });
  add({ cyl: [x, z, 0.03, y + 0.15, y + 0.19], m: 'flex' });
  add({ sph: [x, y - 0.02, z, 0.035], m: 'bulb', lamp: true });
  return { p: [x, y - 0.07, z], c: K(k), I, r: 0.035, vol: 0.4 };
}
// a room: floor, ceiling, four walls with holes ({ wall: 'n'|'s'|'e'|'w', a0, a1, y0, y1 }); x0..x1 × z0..z1, height h
function room(P, x0, x1, z0, z1, h, m, holes = [], th = 0.25) {
  const hz = (w) => holes.filter((q) => q.wall === w).map((q) => ({ x0: q.a0, x1: q.a1, y0: q.y0, y1: q.y1 }));
  P.push({ box: [x0 - th, -0.2, z0 - th, x1 + th, 0, z1 + th], m: m.floor });
  P.push({ box: [x0 - th, h, z0 - th, x1 + th, h + 0.2, z1 + th], m: m.ceil });
  P.push(...wall(x0, x1, 0, h, z1, z1 + th, hz('n'), m.wall));
  P.push(...wall(x0, x1, 0, h, z0 - th, z0, hz('s'), m.wall));
  // the side walls: built along z (wall() works in x), so swap the axes back
  for (const [w, xa, xb] of [['w', x0 - th, x0], ['e', x1, x1 + th]]) for (const q of wall(z0, z1, 0, h, xa, xb, hz(w), m.wall)) { const b = q.box; P.push({ ...q, box: [b[2], b[1], b[0], b[5], b[4], b[3]] }); }
}
const BASE = {
  ceramic: { kind: 'flat', col: [0.62, 0.6, 0.55], ro: 0.25 }, coffee: { kind: 'flat', col: [0.03, 0.015, 0.008], ro: 0.05 },
  flex: { kind: 'flat', col: [0.02, 0.02, 0.02], ro: 0.5 }, bulb: { kind: 'emit', e: K(2700, 6) },
  enamel: { kind: 'metal', col: [0.16, 0.22, 0.18], ro: 0.25 }, brass: { kind: 'metal', col: [0.55, 0.38, 0.12], ro: 0.3, metal: 1 },
  steel: { kind: 'metal', col: [0.35, 0.35, 0.35], ro: 0.35, metal: 0.8 }, black: { kind: 'flat', col: [0.02, 0.02, 0.02], ro: 0.4 },
  paper: { kind: 'flat', col: [0.62, 0.6, 0.55], ro: 0.9 }, ember: { kind: 'emit', e: [3, 0.6, 0.1] },
};
const SPEC = (cam, P, L, mats, o = {}) => ({
  W: cam.W, H: cam.H, cam, prims: P, mats: { ...BASE, ...mats }, lights: L,
  sky: o.sky || { zen: [0.002, 0.002, 0.003], hor: [0.004, 0.004, 0.005], cloud: 0 }, amb: o.amb || { sky: [0.002, 0.002, 0.0022], gnd: [0.0015, 0.0013, 0.0011] },
  fog: o.fog || { s: 0.02, g: 0.5, c: [0.002, 0.0018, 0.0015], sky: 30 }, ao: { n: 8, d: 0.6 }, gi: { n: 20, step: 2, fill: 0.5, ...(o.gi || {}) },
  refl: { streak: 2 }, exposure: o.exposure ?? 1.4,
});

// the basement: whitewashed brick, a concrete floor, a pipe across the ceiling; the table
// under its lamp with the map, the radio, two mugs, a magazine and rounds, the ashtray; on
// the far wall the photograph and the scarf on its nail
export function basement(cam, o = {}) {
  const P = [], add = (q) => P.push(q), L = [], H = 2.5;
  room(P, -3, 3, -2.2, 3.2, H, { floor: 'floor', ceil: 'ceilc', wall: 'brick' }, [{ wall: 'w', a0: 0.4, a1: 1.3, y0: 0, y1: 2.0 }]);
  add({ cap: [-3, H - 0.18, 1.2, 3, H - 0.18, 1.2, 0.05], m: 'pipe' });
  add({ cap: [-3, H - 0.32, 2.6, 3, H - 0.32, 2.6, 0.03], m: 'pipe' });
  // the door to the stair, shut
  add({ box: [-3.05, 0, 0.4, -2.98, 2.0, 1.3], m: 'door' });
  // the table, its legs, the map, things on it
  const TY = 0.78;
  add({ box: [-0.95, TY - 0.04, -0.6, 0.95, TY, 0.6], m: 'tabletop' });
  for (const [x, z] of [[-0.88, -0.53], [0.88, -0.53], [-0.88, 0.53], [0.88, 0.53]]) add({ box: [x - 0.03, 0, z - 0.03, x + 0.03, TY - 0.04, z + 0.03], m: 'tabletop' });
  add({ box: [-0.62, TY, -0.43, 0.62, TY + 0.0015, 0.42], m: 'map' });
  // the radio: a field set, its knobs, the antenna up, a green lamp
  add({ box: [0.42, TY, 0.12, 0.7, TY + 0.11, 0.3], m: 'radio' });
  add({ box: [0.44, TY + 0.11, 0.14, 0.68, TY + 0.115, 0.28], m: 'black' });
  for (const x of [0.48, 0.54, 0.62]) add({ cap: [x, TY + 0.06, 0.118, x, TY + 0.06, 0.1, 0.012], m: 'black' });
  add({ cap: [0.66, TY + 0.11, 0.28, 0.73, TY + 0.62, 0.36, 0.003], m: 'steel' });
  add({ sph: [0.68, TY + 0.085, 0.118, 0.004], m: 'led', lamp: true });
  L.push({ p: [0.68, TY + 0.085, 0.105], c: [0.2, 1, 0.3], I: 0.004, r: 0.004, shadow: false, vol: 0 });
  mug(add, -0.5, TY, -0.06, 0.4); mug(add, 0.26, TY, -0.36, 2.6, [0.24, 0.3, 0.36]);
  // a magazine lying flat, rounds spilled from it, a pencil on the map
  add({ hull: obox([0.08, TY + 0.016, 0.3], [V.norm([1, 0, 0.3]), [0, 1, 0], V.norm([-0.3, 0, 1])], [0.09, 0.015, 0.032]), m: 'mag' });
  for (const [x, z, a] of [[0.0, 0.2, 0.3], [-0.04, 0.24, 1.2], [0.2, 0.2, 2.2]]) add({ cap: [x, TY + 0.005, z, x + Math.cos(a) * 0.04, TY + 0.005, z + Math.sin(a) * 0.04, 0.005], m: 'brass' });
  add({ hull: bar([-0.1, TY + 0.005, -0.15], [0.07, TY + 0.005, -0.08], 0.008, 0.008), m: 'pencil' });
  // the ashtray, a cigarette burning in it
  add({ cyl: [-0.38, 0.32, 0.065, TY, TY + 0.022], m: 'glassAsh' });
  add({ cap: [-0.36, TY + 0.03, 0.31, -0.28, TY + 0.026, 0.27, 0.0045], m: 'paper' });
  add({ sph: [-0.28, TY + 0.026, 0.27, 0.005], m: 'ember', lamp: true });
  L.push({ p: [-0.28, TY + 0.03, 0.27], c: [1, 0.3, 0.05], I: 0.003, r: 0.004, shadow: false, vol: 0 });
  // chairs pushed back, a crate used as one
  for (const [x, z] of [[-0.4, -1.05], [0.5, 1.05]]) { add({ box: [x - 0.21, 0.44, z - 0.2, x + 0.21, 0.47, z + 0.2], m: 'chair' }); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add({ box: [x + a * 0.18 - 0.015, 0, z + b * 0.17 - 0.015, x + a * 0.18 + 0.015, 0.44, z + b * 0.17 + 0.015], m: 'chair' }); add({ box: [x - 0.21, 0.47, z + (z < 0 ? -0.2 : 0.17), x + 0.21, 0.9, z + (z < 0 ? -0.17 : 0.2)], m: 'chair' }); }
  add({ box: [1.2, 0, -0.4, 1.7, 0.4, 0.0], m: 'crate', o: { col: [0.3, 0.22, 0.13] } });
  // lockers along the east wall, a shelf with jars
  for (let k = 0; k < 3; k++) add({ box: [2.55, 0, 0.6 + k * 0.42, 3, 1.85, 1.0 + k * 0.42], m: 'locker', o: { seed: k } });
  add({ box: [-3, 1.5, 1.6, -2.7, 1.53, 2.9], m: 'tabletop' });
  for (let k = 0; k < 5; k++) add({ cyl: [-2.85, 1.7 + k * 0.25, 0.05, 1.53, 1.53 + 0.12 + (k % 2) * 0.05], m: 'jar' });
  // the far wall: the photograph pinned up, the nail and the scarf on it
  add({ box: [0.98, 1.36, 3.185, 1.24, 1.55, 3.2], m: 'photo' });
  add({ cap: [1.37, 1.53, 3.2, 1.37, 1.535, 3.15, 0.0035], m: 'steel' });
  scarf(add, [1.37, 1.53, 3.155]);
  add({ box: [0.6, 1.2, 3.19, 0.85, 1.55, 3.2], m: o.note ? 'note' : 'paper', o: o.note ? undefined : { col: [0.5, 0.48, 0.42] } });
  L.push(pendant(add, 0, 1.45, 0, H, o.lampI ?? 3.2, 3000));
  // a bare bulb on a bracket by the far wall, for the corner
  add({ sph: [2.3, 2.05, 2.95, 0.03], m: 'bulb', lamp: true });
  L.push({ p: [2.3, 2.0, 2.9], c: K(2600), I: o.wallI ?? 0.6, r: 0.03, vol: 0.2 });
  return SPEC(cam, P, L, {
    floor: { kind: 'concrete', col: [0.2, 0.19, 0.18], lift: 9, streak: 0, wet: 0.05 }, ceilc: { kind: 'concrete', col: [0.3, 0.29, 0.27], lift: 1.2 },
    brick: { kind: 'brick', col: [0.3, 0.16, 0.11], wet: 0.05, paint: 0.85, paintCol: [0.5, 0.48, 0.43] }, pipe: { kind: 'metal', col: [0.12, 0.1, 0.08], ro: 0.6 },
    door: { kind: 'panel', col: [0.18, 0.2, 0.18], pw: 0.9 }, tabletop: { kind: 'wood', col: [0.2, 0.12, 0.06], pw: 0.18, varnish: 0.1 },
    map: { kind: 'image', tex: 'cityMap', ro: 0.85 }, radio: { kind: 'panel', col: [0.12, 0.14, 0.1], pw: 2 },
    led: { kind: 'emit', e: [0.3, 3, 0.5] }, mag: { kind: 'metal', col: [0.05, 0.05, 0.05], ro: 0.4 }, pencil: { kind: 'flat', col: [0.5, 0.4, 0.05], ro: 0.5 },
    glassAsh: { kind: 'metal', col: [0.08, 0.08, 0.08], ro: 0.15 }, chair: { kind: 'wood', col: [0.16, 0.1, 0.05], pw: 0.1 }, crate: { kind: 'crate' },
    locker: { kind: 'panel', col: [0.2, 0.24, 0.24], pw: 0.42 }, jar: { kind: 'metal', col: [0.3, 0.26, 0.18], ro: 0.2 },
    photo: { kind: 'image', tex: 'photoWorks', ro: 0.6, k: 0.8 }, note: { kind: 'image', tex: 'note', ro: 0.85 }, knit: { kind: 'knit', col: [0.3, 0.022, 0.018] },
  }, { exposure: o.exposure ?? 1.5 });
}

// the scarf on its nail: folded over it, two lengths hanging (one longer), twisting a little,
// tassels at the ends
function scarf(add, nail) {
  const [nx, ny, nz] = nail, W = 0.17, T = 0.007;
  // where it goes over the nail: a soft roll
  add({ ell: { c: [nx, ny + 0.004, nz - 0.006], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], r: [W / 2 + 0.006, 0.016, 0.016] }, m: 'knit' });
  for (const [side, len, tw, dz, sd] of [[-1, 0.6, 0.35, 0.0, 1], [1, 0.76, -0.25, -0.013, 2]]) {
    let p = [nx + side * 0.01, ny - 0.004, nz - 0.008 + dz];
    const n = 16;
    for (let i = 0; i < n; i++) {
      const k = (i + 1) / n, a = tw * Math.sin(k * 2.2 + sd), sway = Math.sin(k * 3.4 + sd) * 0.018 * k, bulge = Math.sin(k * Math.PI) * 0.01;
      const q = [nx + side * (0.01 + k * 0.025) + sway, ny - 0.004 - len * k, nz - 0.008 + dz - bulge - k * 0.012];
      const mid = V.lerp(p, q, 0.5), dir = V.norm(V.sub(q, p)), ax = V.norm([Math.cos(a), 0, Math.sin(a)]);
      const ax2 = V.norm([dir[1] * ax[2] - dir[2] * ax[1], dir[2] * ax[0] - dir[0] * ax[2], dir[0] * ax[1] - dir[1] * ax[0]]);
      const ax1 = V.norm([ax2[1] * dir[2] - ax2[2] * dir[1], ax2[2] * dir[0] - ax2[0] * dir[2], ax2[0] * dir[1] - ax2[1] * dir[0]]);
      add({ ell: { c: mid, axes: [ax1, dir, ax2], r: [W / 2 * (1 - 0.08 * k), (len / n) * 1.6, T * (1 + 0.2 * Math.sin(k * 5 + sd))] }, m: 'knit' });
      p = q;
    }
    // the tassels: bunched yarn, a few strands each
    for (let t = 0; t < 7; t++) { const x = p[0] - W / 2 * 0.85 + (t + 0.5) * W * 0.85 / 7; add({ cap: [x, p[1] + 0.006, p[2], x + (t % 3 - 1) * 0.005, p[1] - 0.045 - (t % 2) * 0.012, p[2] - 0.004, 0.003], m: 'knit' }); }
  }
}

// HAWK's back room: shelves of goods down one wall, his desk under the window, the ledger
// open, an old phone, a lamp, a photograph turned face down, a cash box; dawn through the blinds
export function backroom(cam, o = {}) {
  const P = [], add = (q) => P.push(q), L = [], H = 2.7;
  room(P, -2.4, 2.4, 0, 4.2, H, { floor: 'boards', ceil: 'ceilc', wall: 'plaster' }, [{ wall: 'n', a0: 0.4, a1: 1.9, y0: 1.0, y1: 2.2 }]);
  // the window: frame, blinds half shut (slats as thin boxes), the street's light beyond
  for (let y = 1.62; y < 2.2; y += 0.05) add({ hull: obox([1.15, y, 4.16], [[1, 0, 0], V.norm([0, 0.45, -1]), V.norm([0, 1, 0.45])], [0.75, 0.002, 0.022]), m: 'slat' });
  // across the street: the houses opposite in the low sun, their windows
  P.push(...wall(-12, 14, -1, 5.6, 11, 11.4, [{ x0: -3, x1: -1.8, y0: 1, y1: 2.6 }, { x0: 1.2, x1: 2.4, y0: 1, y1: 2.6 }, { x0: 4.4, x1: 5.6, y0: 1, y1: 2.6 }, { x0: -3, x1: -1.8, y0: 3.6, y1: 5.0 }, { x0: 1.2, x1: 2.4, y0: 3.6, y1: 5.0 }, { x0: 4.4, x1: 5.6, y0: 3.6, y1: 5.0 }], 'opp'));
  for (const [a, b, y, h] of [[-3, -1.8, 1, 1.6], [1.2, 2.4, 1, 1.6], [4.4, 5.6, 1, 1.6], [-3, -1.8, 3.6, 1.4], [1.2, 2.4, 3.6, 1.4], [4.4, 5.6, 3.6, 1.4]]) add({ box: [a, y, 11.25, b, y + h, 11.3], m: 'oppGlass' });
  add({ box: [-12, -1, 4.6, 14, 0, 11], m: 'street' });
  add({ box: [0.4, 1.56, 4.12, 1.9, 1.62, 4.2], m: 'slat' });
  // shelves on the west wall, full
  for (const y of [0.05, 0.5, 0.95, 1.4, 1.85]) {
    add({ box: [-2.4, y, 0.4, -1.95, y + 0.03, 3.9], m: 'shelf' });
    let z = 0.45; let k = 0;
    while (z < 3.8) { const w = 0.18 + ((k * 7) % 5) * 0.06, hh = 0.14 + ((k * 3) % 4) * 0.06; if ((k * 5) % 7 < 4) add({ box: [-2.36, y + 0.03, z, -2.0, y + 0.03 + hh, z + w], m: k % 3 ? 'carton' : 'crate', o: { seed: k, col: [0.36 - (k % 3) * 0.05, 0.28, 0.17] } }); else for (let c = 0; c < 3; c++) add({ cyl: [-2.2, z + 0.06 + c * 0.08, 0.035, y + 0.03, y + 0.15], m: 'tin', o: { seed: k + c } }); z += w + 0.03; k++; }
  }
  for (const z of [0.4, 2.15, 3.9]) add({ box: [-2.4, 0, z - 0.02, -1.95, 2.2, z + 0.02], m: 'shelf' });
  // the desk under the window
  const DY = 0.76;
  add({ box: [0.2, DY - 0.04, 3.2, 2.2, DY, 4.0], m: 'desk' });
  add({ box: [0.25, 0, 3.25, 0.75, DY - 0.04, 3.95], m: 'desk' }); add({ box: [1.65, 0, 3.25, 2.15, DY - 0.04, 3.95], m: 'desk' });
  add({ box: [0.7, DY, 3.35, 1.3, DY + 0.012, 3.75], m: 'ledger' });
  add({ box: [0.7, DY - 0.002, 3.33, 1.3, DY + 0.004, 3.77], m: 'cover' });
  // the phone: dial phone, handset across it
  add({ box: [1.5, DY, 3.45, 1.72, DY + 0.07, 3.65], m: 'bakelite' });
  add({ cap: [1.49, DY + 0.095, 3.53, 1.73, DY + 0.095, 3.53, 0.022], m: 'bakelite' });
  add({ cyl: [1.61, 3.6, 0.045, DY + 0.07, DY + 0.075], m: 'steel' });
  // the lamp: a weighted base, an arm, a cone shade lit
  add({ cyl: [1.95, 3.75, 0.08, DY, DY + 0.025], m: 'bakelite' });
  add({ hull: bar([1.95, DY + 0.02, 3.75], [1.9, DY + 0.38, 3.7], 0.012, 0.012), m: 'steel' });
  add({ hull: bar([1.9, DY + 0.38, 3.7], [1.72, DY + 0.42, 3.58], 0.012, 0.012), m: 'steel' });
  add({ hull: frustum(1.7, 3.56, 0.1, 0.035, DY + 0.3, DY + 0.42), m: 'enamel' });
  add({ sph: [1.7, DY + 0.29, 3.56, 0.025], m: 'bulb', lamp: true });
  L.push({ p: [1.7, DY + 0.26, 3.56], c: K(2700), I: o.lampI ?? 1.2, spot: { d: [0, -1, 0], c0: Math.cos(1.1), c1: Math.cos(0.7) }, r: 0.025, vol: 0.2 });
  // the photo face down, the cash box, a cigarette packet, a glass
  add({ hull: obox([0.5, DY + 0.006, 3.62], [V.norm([1, 0, 0.2]), [0, 1, 0], V.norm([-0.2, 0, 1])], [0.1, 0.006, 0.075]), m: 'frameBack' });
  add({ box: [0.24, DY, 3.28, 0.5, DY + 0.09, 3.46], m: 'cashbox' });
  add({ cyl: [1.38, 3.32, 0.032, DY, DY + 0.09], m: 'tumbler' });
  // a chair pushed in, a coat-stand by the door with nothing on it
  add({ box: [1.0, 0.45, 2.75, 1.45, 0.48, 3.15], m: 'chair' }); add({ box: [1.0, 0.48, 2.72, 1.45, 0.92, 2.76], m: 'chair' });
  for (const [x, z] of [[1.03, 2.78], [1.42, 2.78], [1.03, 3.12], [1.42, 3.12]]) add({ box: [x - 0.015, 0, z - 0.015, x + 0.015, 0.45, z + 0.015], m: 'chair' });
  // dawn: the low sun through the blinds, the street's grey light
  L.push({ dir: V.norm([-0.25, -0.85, -1]), c: K(3600), I: o.sunI ?? 6, ang: 0.004, shafts: true, vol: 0.6, far: 6 });
  L.push({ p: [1.15, 1.6, 3.7], c: K(6500), I: 0.8, r: 0.6, vol: 0, shadow: false });
  return SPEC(cam, P, L, {
    boards: { kind: 'wood', col: [0.16, 0.1, 0.06], pw: 0.12, varnish: 0.12 }, ceilc: { kind: 'plaster', col: [0.4, 0.38, 0.34] },
    plaster: { kind: 'plaster', col: [0.36, 0.32, 0.25], streak: 0.2 }, slat: { kind: 'flat', col: [0.55, 0.52, 0.45], ro: 0.6 },
    opp: { kind: 'plaster', col: [0.42, 0.36, 0.28] }, oppGlass: { kind: 'glass', panes: [2, 2] }, street: { kind: 'pavers', col: [0.2, 0.19, 0.18], wet: 0.4 }, shelf: { kind: 'wood', col: [0.22, 0.15, 0.08], pw: 0.3 },
    carton: { kind: 'panel', col: [0.3, 0.22, 0.13], pw: 0.3 }, crate: { kind: 'crate' }, tin: { kind: 'metal', col: [0.4, 0.38, 0.32], ro: 0.3, metal: 0.6 },
    desk: { kind: 'wood', col: [0.18, 0.1, 0.05], pw: 0.2, varnish: 0.2 }, ledger: { kind: 'image', tex: 'ledger', ro: 0.85 }, cover: { kind: 'flat', col: [0.12, 0.04, 0.03], ro: 0.7 },
    bakelite: { kind: 'flat', col: [0.015, 0.014, 0.013], ro: 0.2 }, frameBack: { kind: 'wood', col: [0.25, 0.18, 0.1], pw: 0.05 },
    cashbox: { kind: 'metal', col: [0.08, 0.14, 0.1], ro: 0.4 }, tumbler: { kind: 'metal', col: [0.25, 0.22, 0.15], ro: 0.05 }, chair: { kind: 'wood', col: [0.16, 0.1, 0.05], pw: 0.1 },
  }, { exposure: o.exposure ?? 1.3, amb: { sky: [0.004, 0.0045, 0.005], gnd: [0.002, 0.0018, 0.0015] }, fog: { s: 0.07, g: 0.65, c: [0.003, 0.003, 0.003], sky: 30 }, sky: { zen: [0.06, 0.08, 0.12], hor: [0.3, 0.26, 0.22], cloud: 0 } });
}

// the secretary's office: tall, panelled; the window behind the desk onto the square in the
// rain, the floodlights' light coming in cold; the flag on its stand; the desk, the lamp, the
// phone ringing, the plan in its folder
export function office(cam, o = {}) {
  const P = [], add = (q) => P.push(q), L = [], H = 4.0;
  room(P, -4, 4, 0, 7, H, { floor: 'parquet', ceil: 'ceilc', wall: 'plaster' }, [{ wall: 'n', a0: -1.1, a1: 1.1, y0: 0.9, y1: 3.4 }]);
  for (const [a, b] of [[-4, 4]]) { add({ box: [a, 0, 6.98, b, 1.1, 7.0], m: 'panel' }); add({ box: [-3.98, 0, 0, -3.96, 1.1, 7], m: 'panel' }); add({ box: [3.96, 0, 0, 3.98, 1.1, 7], m: 'panel' }); }
  // the window: the reveal deep, glazing bars, the rain-dark glass, a curtain each side
  add({ box: [-1.1, 0.9, 7.12, 1.1, 3.4, 7.14], m: 'pane' });
  for (const x of [-0.37, 0.37]) add({ box: [x - 0.025, 0.9, 7.08, x + 0.025, 3.4, 7.12], m: 'frame' });
  for (const y of [1.75, 2.6]) add({ box: [-1.1, y - 0.025, 7.08, 1.1, y + 0.025, 7.12], m: 'frame' });
  for (const s of [-1, 1]) add({ box: [s * 1.25 - 0.22, 0.05, 6.82, s * 1.25 + 0.22, 3.7, 6.9], m: 'curtain' });
  // the flag on its stand, left of the window
  add({ cyl: [-2.2, 6.3, 0.02, 0, 2.6], m: 'brass' });
  add({ cyl: [-2.2, 6.3, 0.18, 0, 0.05], m: 'brass' });
  add({ box: [-2.18, 1.0, 6.28, -1.4, 2.5, 6.32], m: 'flag' });
  // the desk, the chair behind it
  const DY = 0.76;
  add({ box: [-1.1, DY - 0.05, 4.2, 1.1, DY, 5.1], m: 'desk' });
  add({ box: [-1.05, 0, 4.25, -0.45, DY - 0.05, 5.05], m: 'desk' }); add({ box: [0.45, 0, 4.25, 1.05, DY - 0.05, 5.05], m: 'desk' });
  add({ box: [-0.45, 0.1, 5.0, 0.45, DY - 0.05, 5.05], m: 'desk' });
  add({ box: [-0.65, DY - 0.002, 4.35, 0.15, DY + 0.001, 4.95], m: 'blotter' });
  add({ box: [-0.32, 0.48, 5.4, 0.32, 0.56, 5.95], m: 'leather' }); add({ box: [-0.32, 0.56, 5.88, 0.32, 1.35, 5.98], m: 'leather' });
  add({ cyl: [0, 5.65, 0.04, 0, 0.48], m: 'steel' });
  // the plan in its folder, the pen, the phone, the lamp
  add({ hull: obox([-0.25, DY + 0.004, 4.62], [V.norm([1, 0, -0.06]), [0, 1, 0], V.norm([0.06, 0, 1])], [0.235, 0.003, 0.32]), m: 'folder' });
  add({ hull: obox([-0.24, DY + 0.0075, 4.63], [V.norm([1, 0, -0.06]), [0, 1, 0], V.norm([0.06, 0, 1])], [0.2, 0.0005, 0.28]), m: 'plan' });
  add({ cap: [0.03, DY + 0.006, 4.45, 0.12, DY + 0.006, 4.6, 0.0055], m: 'black' });
  add({ box: [0.45, DY, 4.45, 0.68, DY + 0.06, 4.66], m: 'phone' });
  add({ cap: [0.44, DY + 0.08, 4.5, 0.69, DY + 0.08, 4.5, 0.02], m: 'phone' });
  add({ box: [0.5, DY + 0.06, 4.6, 0.63, DY + 0.0605, 4.645], m: 'lcd' });
  L.push({ p: [0.565, DY + 0.08, 4.62], c: [0.5, 0.8, 0.4], I: 0.002, r: 0.01, shadow: false, vol: 0 });
  add({ box: [0.2, DY, 4.32, 0.36, DY + 0.02, 4.45], m: 'brass' });
  add({ cyl: [0.28, 4.385, 0.012, DY + 0.02, DY + 0.36], m: 'brass' });
  add({ box: [0.1, DY + 0.36, 4.33, 0.46, DY + 0.43, 4.45], m: 'shade' });
  L.push({ p: [0.28, DY + 0.34, 4.42], c: K(2700), I: o.lampI ?? 1.6, spot: { d: [-0.3, -1, 0.2], c0: Math.cos(1.2), c1: Math.cos(0.8) }, r: 0.06, vol: 0.2 });
  // a cabinet, a portrait's frame on the wall (the picture gone, a paler square)
  add({ box: [2.6, 0, 6.2, 3.95, 2.1, 6.95], m: 'desk' });
  add({ box: [2.65, 2.1, 6.25, 3.9, 2.12, 6.9], m: 'desk' });
  add({ box: [-3.94, 1.6, 2.4, -3.9, 2.8, 3.4], m: 'paler' });
  // the square outside: floodlights, cold, through the rain, on the ceiling and floor
  L.push({ p: [1.2, 13, 16], c: K(5600), I: o.floodI ?? 12000, spot: { d: [-0.1, -1.05, -1], c0: Math.cos(0.4), c1: Math.cos(0.2) }, r: 0.3, shafts: true, vol: 0.7 });
  L.push({ p: [0, 2.2, 6.4], c: K(6000), I: 1.2, r: 1.2, vol: 0, shadow: false });
  // the chandelier off, a wall lamp by the door on
  add({ box: [-3.97, 1.9, 0.9, -3.9, 2.15, 1.1], m: 'brass' }); add({ sph: [-3.82, 2.1, 1.0, 0.06], m: 'bulb', lamp: true });
  L.push({ p: [-3.75, 2.1, 1.0], c: K(2600), I: o.wallI ?? 1.6, r: 0.06, vol: 0.1 });
  return SPEC(cam, P, L, {
    parquet: { kind: 'wood', col: [0.2, 0.11, 0.05], pw: 0.08, varnish: 0.35 }, ceilc: { kind: 'plaster', col: [0.45, 0.43, 0.4] },
    plaster: { kind: 'plaster', col: [0.34, 0.33, 0.3], streak: 0.05 }, panel: { kind: 'wood', col: [0.13, 0.07, 0.035], pw: 0.5, across: true, varnish: 0.3 },
    pane: { kind: 'glass', panes: [1, 1], frame: 0 }, frame: { kind: 'flat', col: [0.06, 0.05, 0.04], ro: 0.5 }, curtain: { kind: 'cloth', col: [0.14, 0.04, 0.035], folds: 7 },
    flag: { kind: 'cloth', col: [0.32, 0.03, 0.025], mark: [0.55, 0.47, 0.32], folds: 3 }, desk: { kind: 'wood', col: [0.14, 0.07, 0.03], pw: 0.3, varnish: 0.4 },
    blotter: { kind: 'flat', col: [0.06, 0.09, 0.07], ro: 0.8 }, leather: { kind: 'fabric', col: [0.06, 0.03, 0.02], ro: 0.45, wet: 0 },
    folder: { kind: 'flat', col: [0.32, 0.26, 0.14], ro: 0.8 }, plan: { kind: 'image', tex: 'kulPlani', ro: 0.85, turn: true },
    phone: { kind: 'flat', col: [0.02, 0.02, 0.022], ro: 0.25 }, lcd: { kind: 'image', tex: 'phoneLCD', emit: 1.2, ro: 0.3, turn: true },
    shade: { kind: 'metal', col: [0.03, 0.18, 0.08], ro: 0.15 }, paler: { kind: 'plaster', col: [0.42, 0.41, 0.37], streak: 0 },
  }, { exposure: o.exposure ?? 1.5, sky: { zen: [0.003, 0.004, 0.006], hor: [0.02, 0.022, 0.03], cloud: 0 } });
}

// the records room: steel shelving in rows, box files end to end, an aisle down the middle under a
// single bulb; a drawer pulled out, papers on the floor
export function records(cam, o = {}) {
  const P = [], add = (q) => P.push(q), L = [], H = 2.9;
  room(P, -3.2, 3.2, -0.5, 14, H, { floor: 'floor', ceil: 'ceilc', wall: 'wallc' });
  for (const side of [-1, 1]) for (const xa of [0.7, 2.2]) {
    const x0 = side * xa, x1 = side * (xa + 0.45);
    for (let z = 0.5; z < 13; z += 3.1) {
      for (const zz of [z, z + 3.0]) add({ box: [Math.min(x0, x1), 0, zz - 0.02, Math.max(x0, x1), 2.4, zz + 0.02], m: 'steel' });
      for (const y of [0.06, 0.5, 0.94, 1.38, 1.82, 2.26]) {
        add({ box: [Math.min(x0, x1), y, z, Math.max(x0, x1), y + 0.02, z + 3.0], m: 'steel' });
        if (y < 2.2 && ((z * 7 + y * 13 + xa) % 5) > 0.6) add({ box: [Math.min(x0, x1) + 0.04, y + 0.02, z + 0.04, Math.max(x0, x1) - 0.02, y + 0.34, z + 2.96], m: 'files', o: { tile: [3.1, 1], seed: z * 3 + y } });
      }
    }
  }
  // the drawer cabinet at the head of the aisle, one drawer out, papers spilled
  add({ box: [-0.45, 0, 13.2, 0.45, 1.3, 13.85], m: 'cabinet' });
  add({ box: [-0.4, 0.85, 12.75, 0.4, 1.12, 13.2], m: 'cabinet' });
  for (let k = 0; k < 9; k++) { const x = -0.3 + (k % 3) * 0.25 + Math.sin(k) * 0.1, z = 11.6 + Math.floor(k / 3) * 0.35 + Math.cos(k * 2) * 0.1, a = k * 0.7; add({ hull: obox([x, 0.002 + k * 0.0005, z], [V.norm([Math.cos(a), 0, Math.sin(a)]), [0, 1, 0], V.norm([-Math.sin(a), 0, Math.cos(a)])], [0.105, 0.0005, 0.148]), m: 'paper', o: { col: [0.55 - (k % 3) * 0.04, 0.53, 0.47] } }); }
  // the bulb over the aisle, and one further down
  L.push(pendant(add, 0, 2.3, 5.5, H, o.lampI ?? 4, 2800));
  L.push(pendant(add, 0, 2.3, 11.8, H, (o.lampI ?? 4) * 0.5, 2800));
  return SPEC(cam, P, L, {
    floor: { kind: 'concrete', col: [0.2, 0.19, 0.18], lift: 9, streak: 0, wet: 0 }, ceilc: { kind: 'concrete', col: [0.3, 0.29, 0.27], lift: 1.2 },
    wallc: { kind: 'plaster', col: [0.3, 0.32, 0.3], streak: 0.3 }, steel: { kind: 'metal', col: [0.22, 0.24, 0.24], ro: 0.5 },
    files: { kind: 'image', tex: 'fileSpines', ro: 0.75 }, cabinet: { kind: 'panel', col: [0.24, 0.27, 0.25], pw: 0.9 },
  }, { exposure: o.exposure ?? 1.5 });
}
