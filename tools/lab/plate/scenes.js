// KOR — cinematics: the built places, as scenes for the plate tracer
// (trace.js). Each takes the camera ({ W, H, f, cx, cy, p, yaw, pitch }) and
// returns the spec: prims, ground, lamps, sky, mist. Metres, y up; the camera
// looks down +z. The cameras themselves live with the shots
// (public/lab/js/cine/plates.js), so the two can't drift apart.
import { kelvin, rng } from '../../../public/lab/js/cine/noise.js';

const K = (k, s = 1) => kelvin(k).map((v) => (v / 255) ** 2.2 * s);

// a wall [x0..x1]×[y0..y1]×[z0..z1] with rectangular holes ({ x0, x1, y0, y1 })
// cut through it: the solid parts as boxes (the holes' reveals are their sides)
export function wall(x0, x1, y0, y1, z0, z1, holes, m, o) {
  const xs = [...new Set([x0, x1, ...holes.flatMap((h) => [h.x0, h.x1])])].sort((a, b) => a - b);
  const ys = [...new Set([y0, y1, ...holes.flatMap((h) => [h.y0, h.y1])])].sort((a, b) => a - b);
  const out = [];
  for (let j = 0; j < ys.length - 1; j++) {
    const ya = ys[j], yb = ys[j + 1], ym = (ya + yb) / 2;
    let run = null;
    for (let i = 0; i < xs.length - 1; i++) {
      const xa = xs[i], xb = xs[i + 1], xm = (xa + xb) / 2;
      const hole = holes.some((h) => xm > h.x0 && xm < h.x1 && ym > h.y0 && ym < h.y1);
      if (!hole) { if (run) run[1] = xb; else run = [xa, xb]; }
      if (hole || i === xs.length - 2) { if (run) { out.push({ box: [run[0], ya, z0, run[1], yb, z1], m, o }); run = null; } }
    }
  }
  return out;
}

// a concrete road barrier (the Jersey profile) along x, centred on (x, z), turned by yaw
export function jersey(x, z, len, yaw = 0) {
  const c = Math.cos(yaw), sn = Math.sin(yaw);
  // in the barrier's frame: u along it, w across; profile: 0.6 wide at the foot, 0.16 at the top, 0.81 high, a kink at 0.25
  const prof = [[0.3, 0], [0.24, 0.08], [0.15, 0.25], [0.08, 0.81]];
  const planes = [[0, -1, 0, 0], [0, 1, 0, 0.81]];
  const pl = (nu, nw, ny, d) => { const nx = nu * c - nw * sn, nz = nu * sn + nw * c; planes.push([nx, ny, nz, d + nx * x + nz * z]); };
  pl(1, 0, 0, len / 2); pl(-1, 0, 0, len / 2);
  for (const side of [1, -1]) for (let k = 0; k < prof.length - 1; k++) {
    const [w0, y0] = prof[k], [w1, y1] = prof[k + 1], tw = w1 - w0, ty = y1 - y0, l = Math.hypot(tw, ty);
    const nw = ty / l * side, ny = -tw / l;
    pl(0, nw, ny, nw * w0 * side + ny * y0);
  }
  const r = len / 2 + 0.4;
  return { planes, aabb: [x - r, 0, z - r, x + r, 0.81, z + r] };
}

// an n-sided prism along x (a wheel): centre, radius, width
export function prismX(cx, cy, cz, r, w, n = 12) {
  const planes = [[1, 0, 0, cx + w / 2], [-1, 0, 0, -(cx - w / 2)]];
  for (let k = 0; k < n; k++) { const a = (2 * Math.PI * k) / n, ny = Math.cos(a), nz = Math.sin(a); planes.push([0, ny, nz, ny * cy + nz * cz + r]); }
  const R = r / Math.cos(Math.PI / n);
  return { planes, aabb: [cx - w / 2, cy - R, cz - R, cx + w / 2, cy + R, cz + R] };
}

// m3: the governor's building at night, from across the wet square.
// A portico of six fluted columns on a flight of twelve steps; the Vanta's
// banners hanging in the bays; floodlights at the foot of each column
// throwing their light up the shafts and into the rain; one window lit,
// over the door; lamps on the cheek walls; iron bollards; dark wings with
// rows of windows to either side.
export function governor(cam) {
  const P = [];
  const add = (q) => { P.push(q); return q; };
  const rise = 0.16, tread = 0.38, n = 12, top = rise * n, z0 = 24;
  const zf = z0 + n * tread;               // the portico floor's front edge
  const zw = 34.4;                          // the back wall's face
  const X = 14.6;                           // the portico's half width
  // the steps, each a block running back under the next
  for (let k = 0; k < n; k++) add({ box: [-X, 0, z0 + k * tread, X, (k + 1) * rise, z0 + (k + 1) * tread], m: 'steps' });
  add({ box: [-X, 0, zf, X, top, zw + 1.5], m: 'steps' });
  // the cheek walls either side of the flight, a lamp on each
  for (const s of [-1, 1]) {
    const a = s < 0 ? -X - 1.8 : X, b = s < 0 ? -X : X + 1.8;
    add({ box: [a, 0, z0 - 0.4, b, 2.5, zf + 1], m: 'stone', o: { bh: 0.62, bl: 1.25, base: 0 } });
    add({ box: [a - 0.08, 2.5, z0 - 0.5, b + 0.08, 2.68, zf + 1.1], m: 'stone', o: { bh: 0.18, bl: 1.6 } });
    const lx = (a + b) / 2, lz = z0 + 0.5;
    add({ box: [lx - 0.3, 2.68, lz - 0.3, lx + 0.3, 3.05, lz + 0.3], m: 'iron' });
    add({ cyl: [lx, lz, 0.09, 3.05, 5.75], m: 'iron' });
    add({ box: [lx - 0.2, 5.72, lz - 0.2, lx + 0.2, 5.8, lz + 0.2], m: 'iron' });
    add({ sph: [lx, 6.08, lz, 0.29], m: 'globe', lamp: true });
  }
  // the columns: base, fluted shaft, capital; a floodlight at each foot
  const cols = [-13, -7.8, -2.6, 2.6, 7.8, 13], cz = 30.2;
  for (const x of cols) {
    add({ box: [x - 0.86, top, cz - 0.86, x + 0.86, top + 0.5, cz + 0.86], m: 'stone', o: { bh: 0.25, bl: 0.86, streak: 0.2 } });
    add({ cyl: [x, cz, 0.62, top + 0.5, 11.0], m: 'column' });
    add({ box: [x - 0.88, 11.0, cz - 0.88, x + 0.88, 11.5, cz + 0.88], m: 'stone', o: { bh: 0.25, bl: 0.88 } });
    add({ box: [x - 0.2, top, cz - 1.2, x + 0.2, top + 0.2, cz - 0.95], m: 'iron' });
  }
  // the entablature, its cornice, the attic over it
  add({ box: [-X, 11.5, 29.2, X, 13.2, zw + 1.5], m: 'stone', o: { bh: 0.85, bl: 1.7, ledges: [11.5] } });
  add({ box: [-X - 0.4, 13.2, 28.9, X + 0.4, 13.55, zw + 1.5], m: 'stone', o: { bh: 0.35, bl: 2.0 } });
  add({ box: [-X + 0.6, 13.55, 29.6, X - 0.6, 15.6, zw + 1.5], m: 'stone', o: { bh: 0.68, bl: 1.6, ledges: [13.2] } });
  // the back wall: the door, the lit window over it, windows in the outer bays
  const holes = [{ x0: -1.5, x1: 1.5, y0: top, y1: 7.2 }, { x0: -1.0, x1: 1.0, y0: 8.3, y1: 10.7 }];
  for (const s of [-1, 1]) { holes.push({ x0: s * 10.4 - 0.85, x1: s * 10.4 + 0.85, y0: 3.4, y1: 6.6 }, { x0: s * 10.4 - 0.85, x1: s * 10.4 + 0.85, y0: 8.3, y1: 10.7 }, { x0: s * 5.2 - 0.85, x1: s * 5.2 + 0.85, y0: 8.3, y1: 10.7 }); }
  P.push(...wall(-X, X, top, 11.5, zw, zw + 1, holes, 'stone', { ledges: [6.6, 10.7], base: top }));
  for (const h of holes) {
    const door = h.y0 === top, lit = h.x0 === -1.0;
    if (door) add({ box: [h.x0, h.y0, zw + 0.6, h.x1, h.y1, zw + 0.7], m: 'bronze' });
    else add({ box: [h.x0, h.y0, zw + 0.3, h.x1, h.y1, zw + 0.36], m: lit ? 'lit' : 'glass' });
    if (!door) add({ box: [h.x0 - 0.12, h.y0 - 0.14, zw - 0.14, h.x1 + 0.12, h.y0, zw + 0.3], m: 'stone', o: { bh: 0.14, bl: 2.2 } });
  }
  // the door's surround
  add({ box: [-1.95, top, zw - 0.2, -1.5, 7.65, zw], m: 'stone', o: { bh: 0.5, bl: 0.45 } });
  add({ box: [1.5, top, zw - 0.2, 1.95, 7.65, zw], m: 'stone', o: { bh: 0.5, bl: 0.45 } });
  add({ box: [-1.95, 7.2, zw - 0.2, 1.95, 7.65, zw], m: 'stone', o: { bh: 0.45, bl: 3.9 } });
  // a lantern either side of the door
  for (const s of [-1, 1]) { add({ box: [s * 2.25 - 0.12, 4.9, zw - 0.3, s * 2.25 + 0.12, 5.6, zw], m: 'iron' }); add({ sph: [s * 2.25, 5.25, zw - 0.32, 0.1], m: 'lantern', lamp: true }); }
  // the banners in the inner bays, on rods
  for (const s of [-1, 1]) {
    const x = s * 5.2;
    add({ box: [x - 0.95, 3.0, 33.86, x + 0.95, 11.3, 33.92], m: 'banner' });
    add({ box: [x - 1.08, 11.28, 33.84, x + 1.08, 11.36, 33.95], m: 'iron' });
  }
  // the wings: four storeys of dark windows, a rusticated base
  for (const s of [-1, 1]) {
    const a = s < 0 ? -40 : X, b = s < 0 ? -X : 40, wz = 31.5, hs = [];
    for (const xc of [17.2, 20.6, 24.0, 27.4, 30.8, 34.2, 37.6]) for (const [y0, y1] of [[4.6, 7.0], [8.6, 11.0], [12.4, 14.4]]) hs.push({ x0: s * xc - 0.7, x1: s * xc + 0.7, y0, y1 });
    P.push(...wall(a, b, 3.6, 16.6, wz, wz + 1, hs.map((h) => ({ ...h, x0: Math.min(h.x0, h.x1), x1: Math.max(h.x0, h.x1) })), 'stone', { ledges: [7.0, 11.0, 14.4], base: 0 }));
    add({ box: [a, 0, wz - 0.25, b, 3.6, wz + 1], m: 'rustic' });
    add({ box: [a, 3.6, wz - 0.4, b, 3.85, wz + 1], m: 'stone', o: { bh: 0.25, bl: 2.2 } });
    add({ box: [a, 16.6, wz - 0.5, b, 17.1, wz + 1], m: 'stone', o: { bh: 0.5, bl: 2.2 } });
    add({ box: [a, 17.1, wz - 0.1, b, 18.2, wz + 1], m: 'stone', o: { bh: 0.55, bl: 1.4 } });
    for (const h of hs) {
      const x0 = Math.min(h.x0, h.x1), x1 = Math.max(h.x0, h.x1);
      add({ box: [x0, h.y0, wz + 0.3, x1, h.y1, wz + 0.36], m: 'glass' });
      add({ box: [x0 - 0.1, h.y0 - 0.12, wz - 0.12, x1 + 0.1, h.y0, wz + 0.3], m: 'stone', o: { bh: 0.12, bl: 2 } });
    }
  }
  // concrete barriers dropped across the square in front of the steps, not quite in line
  for (const [x, z, yaw] of [[-11.5, 18.6, 0.03], [-8.3, 18.75, -0.02], [-5.1, 18.5, 0.05], [5.4, 18.7, -0.04], [8.6, 18.55, 0.02], [11.8, 18.9, 0.06]]) add({ hull: jersey(x, z, 3.0, yaw), m: 'barrier' });
  // iron bollards across the foot of the steps
  for (let x = -13.2; x <= 13.21; x += 2.4) if (Math.abs(x) > 1) { add({ cyl: [x, 21.8, 0.15, 0, 0.82], m: 'iron' }); add({ sph: [x, 0.82, 21.8, 0.15], m: 'iron' }); }

  // the lamps
  const L = [];
  for (const x of cols) L.push({ p: [x, top + 0.24, cz - 1.08], c: K(3600), I: 26, spot: { d: [0, 1, 0.1], c0: Math.cos(0.3), c1: Math.cos(0.16) }, r: 0.08, shafts: true, vol: 0.7 });
  for (const s of [-1, 1]) L.push({ p: [s * (X + 0.9), 6.08, z0 + 0.5], c: K(2100), I: 9, r: 0.29, vol: 1.2 });
  for (const s of [-1, 1]) L.push({ p: [s * 2.25, 5.25, zw - 0.32], c: K(1900), I: 0.9, r: 0.1, vol: 0.8 });
  // lamps on the square, out of the frame: behind us and off to the sides
  for (const s of [-1, 1]) { L.push({ p: [s * 8, 6.5, -5], c: K(2000), I: 30, r: 0.3, vol: 0.15 }); L.push({ p: [s * 21, 6.5, 13], c: K(2000), I: 22, r: 0.3, vol: 0.35 }); L.push({ p: [s * 12.5, 7, 9], c: K(4300), I: 38, r: 0.3, vol: 0.25 }); }
  // the banners lit from their feet
  for (const s of [-1, 1]) L.push({ p: [s * 5.2, top + 0.15, 33.1], c: K(3000), I: 9, spot: { d: [0, 1, 0.09], c0: Math.cos(0.34), c1: Math.cos(0.2) }, r: 0.06, shafts: true, vol: 0.6 });
  L.push({ p: [0, 9.4, zw - 0.25], c: K(2900), I: 2.2, spot: { d: [0, -0.35, -1], c0: Math.cos(1.35), c1: Math.cos(0.7) }, shadow: false, vol: 0.4, r: 0.4 });

  return {
    W: cam.W, H: cam.H, cam,
    prims: P,
    ground: { y: 0, m: 'pavers' },
    mats: {
      steps: { kind: 'steps', col: [0.36, 0.34, 0.31] },
      stone: { kind: 'stone', col: [0.3, 0.27, 0.235], streak: 0.6, wet: 0.14 },
      rustic: { kind: 'stone', col: [0.24, 0.22, 0.2], bh: 0.9, bl: 1.8, jw: 0.02, bev: 0.06, streak: 0.4, damp: 1.2 },
      column: { kind: 'column', col: [0.32, 0.29, 0.25], flutes: 20, base: top, streak: 0.45 },
      pavers: { kind: 'pavers', col: [0.16, 0.155, 0.15], puddle: 0.56, wet: 0.5 },
      iron: { kind: 'metal', col: [0.03, 0.03, 0.032], ro: 0.35, wet: 0.5 },
      bronze: { kind: 'door', col: [0.16, 0.1, 0.05], metal: 0.85, ro: 0.38, wet: 0.15 },
      glass: { kind: 'glass', panes: [2, 3] },
      lit: { kind: 'window', panes: [2, 3], e: K(2900, 0.75), blinds: 0.32, lampU: 0.4 },
      barrier: { kind: 'concrete', col: [0.3, 0.29, 0.27], lift: 0.27, streak: 0.8, wet: 0.3 },
      banner: { kind: 'cloth', col: [0.32, 0.03, 0.025], mark: [0.55, 0.47, 0.32], folds: 3.4, wet: 0.35 },
      globe: { kind: 'emit', e: K(2000, 0.5) },
      lantern: { kind: 'emit', e: K(1800, 0.55) },
    },
    lights: L,
    sky: { zen: [0.004, 0.0055, 0.009], hor: [0.03, 0.026, 0.024], cloud: 1, cloudCol: [0.03, 0.022, 0.017], scale: 0.35, seed: 31 },
    amb: { sky: [0.008, 0.0115, 0.019], gnd: [0.0035, 0.0032, 0.003] },
    fog: { s: 0.014, g: 0.5, c: [0.004, 0.0052, 0.0072], sky: 140, k: 1 },
    ao: { n: 8, d: 1.8, k: 0.85 },
    refl: { streak: Math.round(cam.W * 0.012) },
    exposure: 2.0,
  };
}

// m1: the gate into the port at night, from behind a container, on a 50 mm.
// A barrier pole across the road; the guard hut with its lit window; a
// floodlight on a pole pouring a cone of light down through the rain onto
// the wet road; stacks of containers in rows beyond; far off, the cranes
// against a sky lit from below, their red lights; yard lamps in the mist.
export function gate(cam) {
  const P = [];
  const add = (q) => { P.push(q); return q; };
  // the hut on its plinth: walls of painted steel, the window cut into the front
  add({ box: [2.8, 0, 23.3, 5.8, 0.15, 26.2], m: 'concrete', o: { lift: 0.15, streak: 0.3 } });
  add({ box: [3.0, 0.15, 23.58, 5.6, 2.6, 26.0], m: 'hut' });
  P.push(...wall(3.0, 5.6, 0.15, 2.6, 23.5, 23.58, [{ x0: 3.25, x1: 4.4, y0: 1.05, y1: 1.95 }], 'hut'));
  add({ box: [3.25, 1.05, 23.55, 4.4, 1.95, 23.57], m: 'hutwin' });
  add({ box: [3.2, 0.98, 23.32, 4.45, 1.05, 23.5], m: 'iron' });
  add({ box: [2.85, 2.6, 23.3, 5.75, 2.74, 26.2], m: 'iron' });
  add({ box: [5.6, 1.55, 24.2, 5.95, 2.1, 24.95], m: 'unit' });
  add({ box: [3.7, 2.28, 23.38, 4.0, 2.4, 23.5], m: 'iron' });
  add({ sph: [3.85, 2.24, 23.42, 0.06], m: 'bulb', lamp: true });
  // the barrier: post and motor, the pole, the rest at the far end
  add({ box: [2.38, 0, 22.42, 2.82, 1.15, 22.78], m: 'post' });
  add({ box: [-4.6, 0.95, 22.55, 2.38, 1.05, 22.65], m: 'pole' });
  add({ box: [-4.82, 0, 22.5, -4.68, 0.95, 22.7], m: 'post' });
  // kerbs along the road
  add({ box: [-5.6, 0, 10, -5.2, 0.14, 60], m: 'concrete', o: { lift: 0.14 } });
  add({ box: [2.6, 0, 12, 2.95, 0.14, 23.2], m: 'concrete', o: { lift: 0.14 } });
  // the floodlight
  add({ cyl: [5.25, 26.45, 0.11, 0, 7.7], m: 'iron' });
  add({ box: [4.95, 7.38, 25.95, 5.5, 7.72, 26.32], m: 'iron' });
  add({ box: [5.0, 7.36, 25.97, 5.45, 7.38, 26.3], m: 'lens', lamp: true });
  // containers: stacks of one to four, 20 and 40 footers, doors at one end
  const COL = [[0.22, 0.06, 0.035], [0.05, 0.1, 0.17], [0.19, 0.19, 0.18], [0.28, 0.18, 0.05], [0.06, 0.12, 0.08], [0.33, 0.32, 0.29], [0.16, 0.05, 0.04]];
  let k = 0;
  const stack = (x, z, n, len) => {
    for (let i = 0; i < n; i++) {
      const c = COL[(k * 5 + i * 3) % COL.length], dx = ((k * 37 + i * 11) % 7 - 3) * 0.05, dz = ((k * 13 + i * 7) % 5 - 2) * 0.04;
      add({ box: [x + dx, i * 2.591, z + dz, x + dx + len, i * 2.591 + 2.59, z + dz + 2.44], m: 'box', o: { col: c, doors: (k + i) % 2 ? 1 : -1, rust: 0.5 + ((k + i) % 3) * 0.25, seed: k * 17 + i } });
    }
    k++;
  };
  // (the road runs on between them, x −5.2 … 2.6, into the dark)
  for (const [x, z, n, len] of [[-18, 40, 3, 12.19], [-12.5, 34.5, 2, 6.06], [8, 36, 3, 12.19], [14.5, 42, 4, 6.06], [-20, 50, 2, 12.19], [-24, 56, 4, 12.19], [18, 56, 3, 12.19], [4.5, 62, 4, 12.19], [-19, 68, 3, 12.19], [-34, 44, 2, 12.19], [26, 46, 4, 12.19], [-20, 80, 4, 12.19], [5, 84, 3, 12.19], [-19, 96, 3, 12.19], [5, 108, 4, 12.19], [-19, 120, 2, 12.19]]) {
    stack(x, z, n, len); stack(x, z + 2.6, Math.max(1, n - 1), len);
  }
  // lamps down the road between the stacks, smaller and dimmer into the mist
  const road = [[-6.2, 50], [4.8, 64], [-6.2, 82], [4.8, 104], [-6.2, 130]];
  for (const [x, z] of road) { add({ cyl: [x, z, 0.1, 0, 8], m: 'iron' }); const d = x < 0 ? 1 : -1; add({ box: [Math.min(x, x + d * 1.2), 7.9, z - 0.08, Math.max(x, x + d * 1.2), 8.0, z + 0.08], m: 'iron' }); add({ box: [x + d * 1.2 - 0.25, 7.78, z - 0.12, x + d * 1.2 + 0.25, 7.9, z + 0.12], m: 'sodium', lamp: true }); }
  // yard lamps: tall masts with a crown of sodium lamps
  const masts = [[-24, 70], [10, 95], [30, 64], [-8, 120]];
  for (const [x, z] of masts) { add({ cyl: [x, z, 0.3, 0, 28], m: 'iron' }); add({ box: [x - 1.4, 28, z - 0.6, x + 1.4, 28.6, z + 0.6], m: 'iron' }); add({ sph: [x, 27.7, z - 0.7, 0.45], m: 'sodium', lamp: true }); }

  const L = [];
  L.push({ p: [5.22, 7.3, 26.1], c: K(5200), I: 260, spot: { d: [-0.55, -1, -0.45], c0: Math.cos(0.64), c1: Math.cos(0.36) }, r: 0.18, shafts: true, vol: 0.75 });
  // masts behind us, out of the frame, washing the faces of the stacks
  for (const [x, z] of [[-26, 6], [24, 2]]) L.push({ p: [x, 28, z], c: K(2050), I: 260, r: 0.5, vol: 0.12 });
  for (const [x, z] of road) L.push({ p: [x + (x < 0 ? 1.2 : -1.2), 7.7, z], c: K(2000), I: 14, r: 0.25, vol: 1.2 });
  L.push({ p: [3.85, 2.2, 23.35], c: K(2700), I: 1.6, r: 0.06, vol: 0.6 });
  L.push({ p: [3.8, 1.5, 23.4], c: K(3000), I: 0.9, spot: { d: [0, -0.2, -1], c0: Math.cos(1.4), c1: Math.cos(0.8) }, shadow: false, vol: 0.2, r: 0.4 });
  for (const [x, z] of masts) L.push({ p: [x, 27.6, z - 0.8], c: K(2000), I: 110, r: 0.45, vol: 0.5 });

  return {
    W: cam.W, H: cam.H, cam,
    prims: P,
    ground: { y: 0, m: 'road' },
    mats: {
      road: { kind: 'asphalt', col: [0.075, 0.073, 0.07], puddle: 0.55, wet: 0.55, lane: -1.3, stop: { z: 21.7, w: 0.18, x0: -5.2, x1: 2.5 } },
      concrete: { kind: 'concrete', col: [0.3, 0.29, 0.27], streak: 0.6 },
      hut: { kind: 'panel', col: [0.4, 0.4, 0.37], pw: 1.0, base: 0.15, wet: 0.3 },
      hutwin: { kind: 'window', panes: [2, 1], frame: 0.04, e: K(3200, 0.9), blinds: 0.0, lampU: 0.7 },
      unit: { kind: 'metal', col: [0.3, 0.3, 0.29], ro: 0.5 },
      iron: { kind: 'metal', col: [0.04, 0.04, 0.042], ro: 0.4, wet: 0.5 },
      post: { kind: 'metal', col: [0.28, 0.2, 0.03], ro: 0.5, wet: 0.4 },
      pole: { kind: 'stripes' },
      box: { kind: 'corr' },
      crane: { kind: 'metal', col: [0.1, 0.09, 0.08], ro: 0.6 },
      bulb: { kind: 'emit', e: K(2700, 0.8) },
      lens: { kind: 'emit', e: K(5200, 6) },
      red: { kind: 'emit', e: [6, 0.2, 0.08] },
      sodium: { kind: 'emit', e: K(2000, 0.6) },
    },
    lights: L,
    sky: { zen: [0.004, 0.0048, 0.007], hor: [0.04, 0.03, 0.022], cloud: 1, cloudCol: [0.035, 0.025, 0.018], scale: 0.3, seed: 41 },
    amb: { sky: [0.006, 0.008, 0.012], gnd: [0.003, 0.0028, 0.0026] },
    fog: { s: 0.012, g: 0.55, c: [0.004, 0.0048, 0.006], sky: 200, k: 1 },
    ao: { n: 8, d: 1.6, k: 0.85 },
    refl: { streak: Math.round(cam.W * 0.012) },
    exposure: 2.2,
  };
}

// a sloping slab (a tarp, an awning): four corners in order, a thickness
export function slab(c, th = 0.02) {
  const [a, b, , d] = c, u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const l = Math.hypot(...n); n = n.map((x) => x / l); if (n[1] < 0) n = n.map((x) => -x);
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  const planes = [[...n, dot(n, a) + th / 2], [...n.map((x) => -x), -dot(n, a) + th / 2]];
  for (let i = 0; i < 4; i++) {
    const p = c[i], q = c[(i + 1) % 4], e = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    let m = [e[1] * n[2] - e[2] * n[1], e[2] * n[0] - e[0] * n[2], e[0] * n[1] - e[1] * n[0]]; const ml = Math.hypot(...m); m = m.map((x) => x / ml);
    const mid = [(c[(i + 2) % 4][0] + c[(i + 3) % 4][0]) / 2, (c[(i + 2) % 4][1] + c[(i + 3) % 4][1]) / 2, (c[(i + 2) % 4][2] + c[(i + 3) % 4][2]) / 2];
    if (dot(m, mid) > dot(m, p)) m = m.map((x) => -x);
    planes.push([...m, dot(m, p)]);
  }
  const xs = c.map((p) => p[0]), ys = c.map((p) => p[1]), zs = c.map((p) => p[2]);
  return { planes, aabb: [Math.min(...xs) - th, Math.min(...ys) - th, Math.min(...zs) - th, Math.max(...xs) + th, Math.max(...ys) + th, Math.max(...zs) + th] };
}

// m2: the market at dawn. Down a narrow street of old four- and five-storey
// houses, plaster in faded colours, shops at the foot with their shutters
// half up, a few lit inside; concrete balconies, air-conditioners, cables
// slung across; stalls in the street under wet tarps, crates of fruit; the
// HAWK sign's box over a stall up the street; a sodium lamp on a bracket not
// yet off; at the end of the street the sky going pale, mist down the street;
// setts, wet, puddles holding the sky.
export function market(cam) {
  const P = [], r = rng(207);
  const add = (q) => { P.push(q); return q; };
  const PL = [[0.42, 0.33, 0.2], [0.3, 0.33, 0.27], [0.36, 0.34, 0.31], [0.4, 0.27, 0.22], [0.27, 0.3, 0.32], [0.38, 0.36, 0.28], [0.33, 0.25, 0.2]];
  const SH = [[0.2, 0.22, 0.2], [0.14, 0.2, 0.17], [0.16, 0.18, 0.24], [0.22, 0.2, 0.17], [0.24, 0.1, 0.07]];
  const lights = [];
  let n = 0;
  for (const side of [-1, 1]) {
    let z = side < 0 ? 1.5 : 3.0;
    while (z < 92) {
      const d = 5.2 + r() * 3.4, h = 10 + Math.floor(r() * 3) * 3 + r() * 1.5, fx = side * 4.2, c = PL[n % PL.length], o = { col: c, seed: n * 31 };
      const xa = side < 0 ? fx - 6 : fx, xb = side < 0 ? fx : fx + 6;
      // the shop: an opening, its shutter part way up, the room behind
      const s0 = z + 0.5, s1 = z + d - 0.5, up = 0.5 + r() * 1.6, lit = r() < 0.3;
      const holes = [{ x0: s0, x1: s1, y0: 0, y1: 2.9 }];
      // windows on each floor: two or three across
      const nw = d > 6.5 ? 3 : 2, wins = [];
      for (let fl = 1; fl * 3 + 2.4 < h - 0.8; fl++) for (let w = 0; w < nw; w++) { const wz = z + (w + 0.5) * d / nw; wins.push({ x0: wz - 0.6, x1: wz + 0.6, y0: fl * 3 + 0.6, y1: fl * 3 + 2.2 }); }
      // the wall faces the street (its face at x = fx): built in the z-y plane, so the holes are in z
      const hs = [...holes, ...wins];
      const zs = [...new Set([z, z + d, ...hs.flatMap((q) => [q.x0, q.x1])])].sort((a, b) => a - b), ys = [...new Set([0, h, ...hs.flatMap((q) => [q.y0, q.y1])])].sort((a, b) => a - b);
      for (let j = 0; j < ys.length - 1; j++) {
        let run = null;
        for (let i = 0; i < zs.length - 1; i++) {
          const zm = (zs[i] + zs[i + 1]) / 2, ym = (ys[j] + ys[j + 1]) / 2, hole = hs.some((q) => zm > q.x0 && zm < q.x1 && ym > q.y0 && ym < q.y1);
          if (!hole) { if (run) run[1] = zs[i + 1]; else run = [zs[i], zs[i + 1]]; }
          if ((hole || i === zs.length - 2) && run) { add({ box: [xa, ys[j], run[0], xb, ys[j + 1], run[1]], m: 'plaster', o }); run = null; }
        }
      }
      const fin = side < 0 ? fx - 0.35 : fx + 0.35, fin2 = side < 0 ? fx - 0.4 : fx + 0.4;
      // the shop: the shutter (from 2.9 down to `up`), the room's back wall, its floor, a light if lit
      add({ box: [Math.min(fx, fin), up, s0, Math.max(fx, fin) - (side < 0 ? 0.25 : 0), 2.9, s1].map((v, k) => (k === 0 ? Math.min(fx - side * 0.12, fx - side * 0.16) : k === 3 ? Math.max(fx - side * 0.12, fx - side * 0.16) : v)), m: 'shutter', o: { col: SH[n % SH.length], seed: n * 7 } });
      add({ box: [side < 0 ? fx - 5 : fx + 4.6, 0, s0, side < 0 ? fx - 4.6 : fx + 5, 2.9, s1], m: lit ? 'roomlit' : 'room' });
      if (lit) lights.push({ p: [fx + side * 2.2, 2.4, (s0 + s1) / 2], c: K(2900), I: 2.2, r: 0.3, vol: 0.2 });
      // windows: glass back in the reveal, a sill, sometimes a concrete balcony, sometimes an air-conditioner
      for (const q of wins) {
        add({ box: [side < 0 ? fx - 0.3 : fx + 0.24, q.y0, q.x0, side < 0 ? fx - 0.24 : fx + 0.3, q.y1, q.x1], m: 'glass', o: { panes: [2, 2], fcol: [0.3, 0.29, 0.27] } });
        add({ box: [side < 0 ? fx - 0.24 : fx - 0.1, q.y0 - 0.1, q.x0 - 0.08, side < 0 ? fx + 0.1 : fx + 0.24, q.y0, q.x1 + 0.08], m: 'plaster', o: { col: [0.34, 0.33, 0.31], seed: 5 } });
        if (r() < 0.22) {
          const by = q.y0 - 0.15, bz0 = q.x0 - 0.5, bz1 = q.x1 + 0.5, out = side < 0 ? fx + 1.0 : fx - 1.0;
          add({ box: [Math.min(fx, out), by - 0.18, bz0, Math.max(fx, out), by, bz1], m: 'plaster', o: { col: [0.33, 0.32, 0.3], seed: n + 9 } });
          add({ box: [Math.min(out, out - side * 0.12), by, bz0, Math.max(out, out - side * 0.12), by + 1.0, bz1], m: 'plaster', o: { col: c, seed: n + 11 } });
        } else if (r() < 0.25) {
          const ay = q.y0 + 0.1, az = q.x1 + 0.15;
          add({ box: [side < 0 ? fx : fx - 0.3, ay, az, side < 0 ? fx + 0.3 : fx, ay + 0.55, az + 0.8], m: 'unit', o: { seed: n * 3 } });
        }
      }
      // the cornice
      add({ box: [side < 0 ? fx - 6 : fx - 0.4, h, z, side < 0 ? fx + 0.4 : fx + 6, h + 0.3, z + d], m: 'plaster', o: { col: [0.3, 0.29, 0.27], seed: n + 3 } });
      z += d; n++;
    }
  }
  // cables slung across the street (a few straight runs, each a little lower in the middle)
  for (const [z, y] of [[9, 7.2], [16.5, 6.6], [27, 7.6], [38, 6.9], [52, 7.4]]) {
    add({ box: [-4.2, y, z - 0.012, -1.4, y + 0.022, z + 0.012], m: 'cable' });
    add({ box: [-1.4, y - 0.22, z - 0.012, 1.4, y - 0.2, z + 0.012], m: 'cable' });
    add({ box: [1.4, y, z - 0.012, 4.2, y + 0.022, z + 0.012], m: 'cable' });
  }
  // stalls: four poles, a sloping tarp, a table, crates of fruit
  const FR = [[0.5, 0.04, 0.02], [0.6, 0.22, 0.02], [0.55, 0.45, 0.04], [0.12, 0.28, 0.04], [0.35, 0.06, 0.1]];
  const TA = [[[0.04, 0.12, 0.3], [0.32, 0.3, 0.28]], [[0.05, 0.2, 0.1], null], [[0.35, 0.05, 0.03], [0.32, 0.3, 0.28]], [[0.08, 0.1, 0.16], null], [[0.3, 0.2, 0.05], null]];
  let k = 0;
  for (const [x, z, w, dd] of [[-3.3, 9, 2.2, 1.6], [1.4, 12, 2.4, 1.7], [-3.4, 16.5, 2.4, 1.6], [1.5, 19.6, 2.3, 1.6], [-3.3, 25, 2.5, 1.7], [1.6, 31, 2.2, 1.6], [-3.2, 38, 2.4, 1.6], [1.5, 46, 2.4, 1.6]]) {
    const top = 2.25, t = TA[k % TA.length];
    for (const [dx, dz] of [[0, 0], [w, 0], [0, dd], [w, dd]]) add({ box: [x + dx - 0.025, 0, z + dz - 0.025, x + dx + 0.025, top + (dz ? 0.25 : 0), z + dz + 0.025], m: 'iron' });
    // the tarp sags between the frame: a 4×4 of slabs on the sagging surface (the material bends
    // the light to the smooth one), water standing where it sags most
    { const X0 = x - 0.25, X1 = x + w + 0.25, Z0 = z - 0.45, Z1 = z + dd + 0.2, yF = top - 0.05, yB = top + 0.3, sag = 0.12 + 0.05 * (k % 3), n4 = 4;
      const hy = (u, v) => yF + (yB - yF) * v - sag * Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
      const o = { col: t[0], col2: t[1] || t[0], stripes: t[1] ? 0.35 : 0, seed: k * 5, X0, X1, Z0, Z1, yF, yB, sag };
      for (let i = 0; i < n4; i++) for (let j = 0; j < n4; j++) {
        const u0 = i / n4, u1 = (i + 1) / n4, v0 = j / n4, v1 = (j + 1) / n4, X = (u) => X0 + (X1 - X0) * u, Z = (v) => Z0 + (Z1 - Z0) * v;
        add({ hull: slab([[X(u0), hy(u0, v0), Z(v0)], [X(u1), hy(u1, v0), Z(v0)], [X(u1), hy(u1, v1), Z(v1)], [X(u0), hy(u0, v1), Z(v1)]], 0.015), m: 'tarp', o });
      } }
    add({ box: [x, 0.78, z + 0.1, x + w, 0.82, z + dd - 0.1], m: 'wood' });
    for (let i = 0; i < Math.floor(w / 0.55); i++) {
      const cx = x + 0.05 + i * 0.55, f = FR[(k * 3 + i) % FR.length], tilt = (i % 2) * 0.03;
      add({ box: [cx, 0.82, z + 0.15, cx + 0.5, 0.82 + 0.16 + tilt, z + 0.5], m: 'crate', o: { fruit: f, col: [0.36, 0.27, 0.17] } });
    }
    for (let i = 0; i < 2; i++) add({ box: [x + 0.2 + i * 0.6, 0, z + dd - 0.3 - i * 0.1, x + 0.7 + i * 0.6, 0.32 + i * 0.3, z + dd + 0.1 - i * 0.1], m: 'crate', o: { col: [0.3, 0.23, 0.15] } });
    k++;
  }
  // the HAWK sign's box over the stall up the street (its tubes are drawn live)
  add({ box: [0.1, 3.8, 18.2, 2.9, 4.75, 18.45], m: 'iron' });
  for (const x of [0.4, 2.6]) add({ box: [x - 0.02, 2.4, 18.3, x + 0.02, 3.8, 18.34], m: 'iron' });
  // the sodium lamp on its bracket
  add({ box: [-4.2, 6.15, 13.95, -3.25, 6.2, 14.05], m: 'iron' });
  add({ box: [-3.45, 5.95, 13.85, -3.0, 6.12, 14.15], m: 'iron' });
  add({ box: [-3.4, 5.92, 13.9, -3.05, 5.95, 14.1], m: 'sodium', lamp: true });

  lights.push({ p: [-3.22, 5.85, 14], c: K(2000), I: 16, r: 0.15, vol: 1.0 });
  // the two tubes of the sign that still light, red on the wet street
  lights.push({ p: [0.9, 4.25, 18.1], c: [1, 0.25, 0.12], I: 2.4, r: 0.6, shadow: false, vol: 0.5 });

  return {
    W: cam.W, H: cam.H, cam,
    prims: P,
    ground: { y: 0, m: 'setts' },
    mats: {
      setts: { kind: 'pavers', col: [0.2, 0.19, 0.18], a: 0.2, b: 0.13, jw: 0.012, puddle: 0.575, wet: 0.3 },
      plaster: { kind: 'plaster', col: [0.4, 0.36, 0.3] },
      glass: { kind: 'glass', panes: [2, 2] },
      room: { kind: 'flat', col: [0.03, 0.028, 0.025], ro: 0.9 },
      shutter: { kind: 'shutter', col: [0.2, 0.2, 0.19] },
      roomlit: { kind: 'emit', e: K(2900, 0.35) },
      unit: { kind: 'panel', col: [0.42, 0.42, 0.4], pw: 0.3, wet: 0.2 },
      cable: { kind: 'flat', col: [0.02, 0.02, 0.02], ro: 0.5 },
      iron: { kind: 'metal', col: [0.05, 0.05, 0.05], ro: 0.4, wet: 0.4 },
      wood: { kind: 'flat', col: [0.25, 0.18, 0.11], ro: 0.8, wet: 0.4 },
      tarp: { kind: 'tarp', col: [0.05, 0.1, 0.25] },
      crate: { kind: 'crate', col: [0.36, 0.27, 0.17] },
      sodium: { kind: 'emit', e: K(2000, 0.6) },
    },
    lights,
    sky: { zen: [0.11, 0.135, 0.18], hor: [0.42, 0.36, 0.31], cloud: 1, cloudCol: [0.12, 0.1, 0.1], scale: 0.4, seed: 51 },
    amb: { sky: [0.07, 0.085, 0.11], gnd: [0.025, 0.022, 0.02] },
    fog: { s: 0.012, g: 0.4, c: [0.1, 0.105, 0.12], sky: 300, k: 1 },
    ao: { n: 10, d: 3.5, k: 0.9 },
    refl: { streak: Math.round(cam.W * 0.008) },
    exposure: 1.25,
  };
}
