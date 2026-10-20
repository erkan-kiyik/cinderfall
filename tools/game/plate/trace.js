// KOR — cinematics: the plate tracer. The still parts of a shot (buildings,
// steps, the wet ground, lamps) are ray traced into a "plate", from where the
// camera stands, ahead of time (bake.mjs → public/game/assets/plates/); the
// shot draws the plate every frame (shifted for the operator's hand, scaled
// for a slow zoom: js/cine/plate.js) with the moving things on top.
//
// Per pixel:
//   hit       boxes, upright cylinders, spheres, capsules, ellipsoids, convex
//             hulls (oriented boxes, prisms, slabs), a ground plane
//   material  mats.js: albedo, roughness, wetness, emission, a bent normal
//   lamps     point and spot lamps and the sun or moon, with shadow rays
//             (soft for big lamps); GGX highlights
//   ambient   sky above, bounce below, with ambient occlusion — or (gi) one
//             bounce of light gathered over the hemisphere: the sky through a
//             window, a lit wall lighting the floor; worked out on a grid and
//             brought up along normals and depth
//   wet       a water film reflects the scene (one ray, its hit lit with
//             shadows); the reflection is smeared up and down the screen the
//             way a wet street streaks a light, less where water stands
//   mist      the air between the eye and the hit scatters the lamps' light:
//             point lamps in closed form at every pixel; spot lamps by
//             equi-angular samples with shadow rays (shafts) on a coarse grid,
//             brought up to full size along depth edges
//   film      linear light → exposure → ACES → sRGB, dithered so the dark
//             gradients don't band; edges traced again at five samples
//
// Pure (no DOM): bake.mjs runs it in node worker threads, a band each.
import { MATS, MAT_DEFAULTS, ALPHA } from './mats.js';

const EPS = 1e-3, PI = Math.PI;
const BOX = 0, CYL = 1, SPH = 2, HULL = 3, CAP = 4, ELL = 5;
const smoothstep = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// spec → a scene ready to trace (see plate.js for the fields)
export function compile(spec) {
  const prims = spec.prims || [], N = prims.length;
  const K = new Uint8Array(N), B = new Float64Array(N * 6), P = new Float64Array(N * 12), NS = new Uint8Array(N), NE = new Uint8Array(N);
  const HP = new Array(N).fill(null), M = new Array(N), HOLE = new Uint8Array(N);
  const mats = spec.mats || {}, TEX = spec.textures || {};
  const matOf = (m, o) => {
    const base = typeof m === 'string' ? mats[m] : m;
    const r = { ...MAT_DEFAULTS, ...(base || {}), ...(o || {}) };
    r.fn = MATS[r.kind] || MATS.flat;
    if (r.tex) { r.T = TEX[r.tex]; if (!r.T) throw new Error('no texture ' + r.tex); }
    return r;
  };
  for (let i = 0; i < N; i++) {
    const q = prims[i], b = i * 6;
    if (q.box) { K[i] = BOX; for (let k = 0; k < 6; k++) B[b + k] = q.box[k]; }
    else if (q.cyl) { const [x, z, r, y0, y1] = q.cyl; K[i] = CYL; B.set([x - r, y0, z - r, x + r, y1, z + r], b); P.set([x, z, r, y0, y1], i * 12); }
    else if (q.sph) { const [x, y, z, r] = q.sph; K[i] = SPH; B.set([x - r, y - r, z - r, x + r, y + r, z + r], b); P.set([x, y, z, r], i * 12); }
    else if (q.cap) { const [ax, ay, az, bx, by, bz, r] = q.cap; K[i] = CAP; B.set([Math.min(ax, bx) - r, Math.min(ay, by) - r, Math.min(az, bz) - r, Math.max(ax, bx) + r, Math.max(ay, by) + r, Math.max(az, bz) + r], b); P.set([ax, ay, az, bx, by, bz, r], i * 12); }
    else if (q.ell) {
      // an ellipsoid: centre, three unit axes, three radii (kept as axis/radius, so a point maps to the unit ball)
      const { c, axes, r } = q.ell; K[i] = ELL;
      const ext = [0, 1, 2].map((k) => Math.abs(axes[0][k]) * r[0] + Math.abs(axes[1][k]) * r[1] + Math.abs(axes[2][k]) * r[2]);
      B.set([c[0] - ext[0], c[1] - ext[1], c[2] - ext[2], c[0] + ext[0], c[1] + ext[1], c[2] + ext[2]], b);
      P.set([c[0], c[1], c[2], ...axes[0].map((v) => v / r[0]), ...axes[1].map((v) => v / r[1]), ...axes[2].map((v) => v / r[2])], i * 12);
    }
    else if (q.hull) { K[i] = HULL; B.set(q.hull.aabb, b); HP[i] = Float64Array.from(q.hull.planes.flat()); }
    NS[i] = q.noShadow || q.lamp ? 1 : 0;
    HOLE[i] = q.cut ? 1 : 0; // a picture with holes in it (a torn poster): rays pass where it is clear
    NE[i] = q.lamp ? 1 : 0; // a lamp's bulb: its glint on wet things comes from the lamp itself
    M[i] = matOf(q.m, q.o);
    M[i].seed = M[i].seed ?? i * 7 + 3;
  }
  const G = spec.ground ? { y: spec.ground.y || 0, m: matOf(spec.ground.m, spec.ground.o) } : null;
  if (G) G.m.seed = G.m.seed ?? 991;
  const lights = (spec.lights || []).map((L) => {
    const c = (L.c || [1, 1, 1]).map((v) => v * (L.I ?? 1));
    const p = L.p || [0, 0, 0];
    const o = { x: p[0], y: p[1], z: p[2], cr: c[0], cg: c[1], cb: c[2], r: L.r ?? 0.05, shadow: L.shadow !== false, vol: L.vol ?? 1, shafts: !!L.shafts };
    // the sun or the moon: a direction the light travels in, no falloff; `ang` its angular radius, `far` how far its shafts are sampled
    if (L.dir) { const l = Math.hypot(...L.dir); o.dir = true; o.dx = L.dir[0] / l; o.dy = L.dir[1] / l; o.dz = L.dir[2] / l; o.ang = L.ang ?? 0.01; o.far = L.far ?? 120; o.r = 0; }
    o.r2 = o.r * o.r;
    if (L.spot) { const d = L.spot.d, l = Math.hypot(d[0], d[1], d[2]); o.spot = true; o.sx = d[0] / l; o.sy = d[1] / l; o.sz = d[2] / l; o.c0 = L.spot.c0; o.c1 = L.spot.c1; }
    return o;
  });
  return {
    spec, N, K, B, P, NS, NE, HOLE, HP, M, G, lights,
    pts: lights.filter((l) => !l.shafts && !l.dir), shafts: lights.filter((l) => l.shafts),
    W: spec.W, H: spec.H, cam: spec.cam,
    sky: { zen: [0.004, 0.0045, 0.006], hor: [0.02, 0.016, 0.012], cloud: 0, cloudCol: [0.03, 0.022, 0.016], seed: 5, scale: 0.6, ...(spec.sky || {}) },
    amb: { sky: [0.004, 0.0045, 0.0055], gnd: [0.002, 0.0018, 0.0015], ...(spec.amb || {}) },
    ao: { n: 8, d: 1.6, k: 0.9, ...(spec.ao || {}) },
    fog: { s: 0.02, g: 0.35, c: [0.006, 0.0055, 0.005], sky: 140, k: 1, ...(spec.fog || {}) },
    refl: { streak: 18, ...(spec.refl || {}) },
    exposure: spec.exposure ?? 1, vs: spec.vs ?? 4, vn: spec.vn ?? 10, aa: spec.aa !== false,
    aoStep: spec.aoStep ?? 2, shadowN: spec.shadowN ?? 1, hdr: !!spec.hdr,
    gi: spec.gi ? { n: 16, step: 2, fill: 0.5, clamp: 1.5, ...spec.gi } : null,
  };
}

// The tracer for one compiled scene. Hits land in t/i/nx/ny/nz.
export function tracer(sc) {
  const { N, K, B, P, NS, NE, HOLE, HP, M, G, lights } = sc;
  const gy = G ? G.y : 0;
  const T = { t: 0, i: -1, nx: 0, ny: 0, nz: 0 };

  // a bounding volume tree over the prims: surface-area splits, a leaf when splitting doesn't pay
  const IDX = new Int32Array(N), nodes = [];
  for (let i = 0; i < N; i++) IDX[i] = i;
  const area = (b) => { const x = b[3] - b[0], y = b[4] - b[1], z = b[5] - b[2]; return x * y + y * z + z * x; };
  const grow = (b, q) => { for (let a = 0; a < 3; a++) { if (B[q + a] < b[a]) b[a] = B[q + a]; if (B[q + a + 3] > b[a + 3]) b[a + 3] = B[q + a + 3]; } };
  (function build(s, e) {
    const b = [1e30, 1e30, 1e30, -1e30, -1e30, -1e30];
    for (let j = s; j < e; j++) grow(b, IDX[j] * 6);
    const node = { b, l: -1, r: -1, s, c: e - s, a: 0 }, ni = nodes.length; nodes.push(node);
    const n = e - s;
    if (n <= 2) return ni;
    let bestC = n * 1.0, bestAx = -1, bestK = 0, bestOrder = null;
    const ab = area(b) || 1;
    for (let ax = 0; ax < 3; ax++) {
      const ord = Array.from(IDX.subarray(s, e)).sort((p, q) => (B[p * 6 + ax] + B[p * 6 + ax + 3]) - (B[q * 6 + ax] + B[q * 6 + ax + 3]));
      const left = new Float64Array(n), bb = [1e30, 1e30, 1e30, -1e30, -1e30, -1e30];
      for (let k = 0; k < n; k++) { grow(bb, ord[k] * 6); left[k] = area(bb); }
      const rb = [1e30, 1e30, 1e30, -1e30, -1e30, -1e30];
      for (let k = n - 1; k > 0; k--) {
        grow(rb, ord[k] * 6);
        const c = 0.5 + (left[k - 1] * k + area(rb) * (n - k)) / ab;
        if (c < bestC) { bestC = c; bestAx = ax; bestK = k; bestOrder = ord; }
      }
    }
    if (bestAx < 0) return ni;
    IDX.set(bestOrder, s);
    node.c = 0; node.a = bestAx; node.l = build(s, s + bestK); node.r = build(s + bestK, e);
    return ni;
  })(0, N);
  const NB = new Float64Array(nodes.length * 6), NL = new Int32Array(nodes.length), NR = new Int32Array(nodes.length), NSt = new Int32Array(nodes.length), NC = new Int32Array(nodes.length), NA = new Uint8Array(nodes.length);
  nodes.forEach((n, i) => { NB.set(n.b, i * 6); NL[i] = n.l; NR[i] = n.r; NSt[i] = n.s; NC[i] = n.c; NA[i] = n.a; });
  const stack = new Int32Array(128);

  // first hit along o + d·t, t in (EPS, tmax); any: stop at the first (shadow rays); gnd: the ground counts
  let best = 0, bi = -1, bnx = 0, bny = 0, bnz = 0;
  function prim(i, ox, oy, oz, dx, dy, dz, ix, iy, iz, any) {
    const b = i * 6;
    let t0 = (B[b] - ox) * ix, t1 = (B[b + 3] - ox) * ix, ax = 0;
    if (t0 > t1) { const s = t0; t0 = t1; t1 = s; }
    let u0 = (B[b + 1] - oy) * iy, u1 = (B[b + 4] - oy) * iy;
    if (u0 > u1) { const s = u0; u0 = u1; u1 = s; }
    let w0 = (B[b + 2] - oz) * iz, w1 = (B[b + 5] - oz) * iz;
    if (w0 > w1) { const s = w0; w0 = w1; w1 = s; }
    let tn = t0; if (u0 > tn) { tn = u0; ax = 1; } if (w0 > tn) { tn = w0; ax = 2; }
    let tf = t1; if (u1 < tf) tf = u1; if (w1 < tf) tf = w1;
    if (tn > tf || tf < EPS || tn >= best) return false;
    const k = K[i];
    if (k === BOX) {
      if (tn < EPS) return false; // from inside: not a hit
      const nx = ax === 0 ? (dx > 0 ? -1 : 1) : 0, ny = ax === 1 ? (dy > 0 ? -1 : 1) : 0, nz = ax === 2 ? (dz > 0 ? -1 : 1) : 0;
      if (HOLE[i] && !ALPHA[M[i].kind](M[i], ox + dx * tn, oy + dy * tn, oz + dz * tn, nx, ny, nz, B, i)) return false;
      best = tn; bi = i; bnx = nx; bny = ny; bnz = nz;
      return any;
    }
    const p = i * 12;
    if (k === CYL) {
      const cx = P[p], cz = P[p + 1], r = P[p + 2], y0 = P[p + 3], y1 = P[p + 4];
      const ex = ox - cx, ez = oz - cz;
      let t = best, nx = 0, ny = 0, nz = 0;
      const a = dx * dx + dz * dz;
      if (a > 1e-12) {
        const bb = ex * dx + ez * dz, c = ex * ex + ez * ez - r * r, disc = bb * bb - a * c;
        if (disc >= 0) {
          const tt = (-bb - Math.sqrt(disc)) / a;
          if (tt > EPS && tt < t) { const y = oy + dy * tt; if (y >= y0 && y <= y1) { t = tt; nx = (ex + dx * tt) / r; nz = (ez + dz * tt) / r; ny = 0; } }
        }
      }
      if (dy !== 0 && ((dy < 0 && oy > y1) || (dy > 0 && oy < y0))) {
        const tt = ((dy < 0 ? y1 : y0) - oy) / dy;
        if (tt > EPS && tt < t) { const px = ex + dx * tt, pz = ez + dz * tt; if (px * px + pz * pz <= r * r) { t = tt; nx = 0; nz = 0; ny = dy < 0 ? 1 : -1; } }
      }
      if (t < best) { best = t; bi = i; bnx = nx; bny = ny; bnz = nz; return any; }
      return false;
    }
    if (k === SPH) {
      const ex = ox - P[p], ey = oy - P[p + 1], ez = oz - P[p + 2], r = P[p + 3];
      const a = dx * dx + dy * dy + dz * dz, bb = ex * dx + ey * dy + ez * dz, c = ex * ex + ey * ey + ez * ez - r * r, disc = bb * bb - a * c;
      if (disc < 0) return false;
      const tt = (-bb - Math.sqrt(disc)) / a;
      if (tt > EPS && tt < best) { best = tt; bi = i; bnx = (ex + dx * tt) / r; bny = (ey + dy * tt) / r; bnz = (ez + dz * tt) / r; return any; }
      return false;
    }
    if (k === CAP) {
      // a capsule (Quilez): the swept cylinder, else the ball at the end the ray comes in by
      const ax = P[p], ay = P[p + 1], az = P[p + 2], bax = P[p + 3] - ax, bay = P[p + 4] - ay, baz = P[p + 5] - az, r = P[p + 6];
      const oax = ox - ax, oay = oy - ay, oaz = oz - az;
      const baba = bax * bax + bay * bay + baz * baz, bard = bax * dx + bay * dy + baz * dz, baoa = bax * oax + bay * oay + baz * oaz;
      const rdoa = dx * oax + dy * oay + dz * oaz, oaoa = oax * oax + oay * oay + oaz * oaz;
      const a = baba - bard * bard;
      let t = -1;
      const ball = (cx, cy, cz) => { const q = dx * cx + dy * cy + dz * cz, c = cx * cx + cy * cy + cz * cz - r * r, h = q * q - c; return h > 0 ? -q - Math.sqrt(h) : -1; };
      if (a > 1e-12) {
        const q = baba * rdoa - baoa * bard, c = baba * oaoa - baoa * baoa - r * r * baba, h = q * q - a * c;
        if (h < 0) return false;
        t = (-q - Math.sqrt(h)) / a;
        const y = baoa + t * bard;
        if (!(y > 0 && y < baba)) t = y <= 0 ? ball(oax, oay, oaz) : ball(ox - P[p + 3], oy - P[p + 4], oz - P[p + 5]);
      } else { const t0 = ball(oax, oay, oaz), t1 = ball(ox - P[p + 3], oy - P[p + 4], oz - P[p + 5]); t = t0 > EPS && (t1 <= EPS || t0 < t1) ? t0 : t1; }
      if (t > EPS && t < best) {
        const px = oax + dx * t, py = oay + dy * t, pz = oaz + dz * t, hh = Math.min(1, Math.max(0, (px * bax + py * bay + pz * baz) / baba));
        best = t; bi = i; bnx = (px - bax * hh) / r; bny = (py - bay * hh) / r; bnz = (pz - baz * hh) / r; return any;
      }
      return false;
    }
    if (k === ELL) {
      // an ellipsoid: into the space where it is the unit ball, and back for the normal
      const ex = ox - P[p], ey = oy - P[p + 1], ez = oz - P[p + 2];
      const ou = ex * P[p + 3] + ey * P[p + 4] + ez * P[p + 5], ov = ex * P[p + 6] + ey * P[p + 7] + ez * P[p + 8], ow = ex * P[p + 9] + ey * P[p + 10] + ez * P[p + 11];
      const du = dx * P[p + 3] + dy * P[p + 4] + dz * P[p + 5], dv = dx * P[p + 6] + dy * P[p + 7] + dz * P[p + 8], dw = dx * P[p + 9] + dy * P[p + 10] + dz * P[p + 11];
      const a = du * du + dv * dv + dw * dw, q = ou * du + ov * dv + ow * dw, c = ou * ou + ov * ov + ow * ow - 1, h = q * q - a * c;
      if (h < 0) return false;
      const t = (-q - Math.sqrt(h)) / a;
      if (t > EPS && t < best) {
        const lu = ou + du * t, lv = ov + dv * t, lw = ow + dw * t;
        let nx = lu * P[p + 3] + lv * P[p + 6] + lw * P[p + 9], ny = lu * P[p + 4] + lv * P[p + 7] + lw * P[p + 10], nz = lu * P[p + 5] + lv * P[p + 8] + lw * P[p + 11];
        const l = Math.hypot(nx, ny, nz) || 1; best = t; bi = i; bnx = nx / l; bny = ny / l; bnz = nz / l; return any;
      }
      return false;
    }
    const pl = HP[i];
    let a0 = -1e30, a1 = 1e30, px = 0, py = 0, pz = 0;
    for (let j = 0; j < pl.length; j += 4) {
      const den = pl[j] * dx + pl[j + 1] * dy + pl[j + 2] * dz, dist = pl[j + 3] - (pl[j] * ox + pl[j + 1] * oy + pl[j + 2] * oz);
      if (Math.abs(den) < 1e-12) { if (dist < 0) return false; continue; }
      const tt = dist / den;
      if (den < 0) { if (tt > a0) { a0 = tt; px = pl[j]; py = pl[j + 1]; pz = pl[j + 2]; } } else if (tt < a1) a1 = tt;
      if (a0 > a1) return false;
    }
    if (a0 > EPS && a0 < best) { best = a0; bi = i; bnx = px; bny = py; bnz = pz; return any; }
    return false;
  }
  function hit(ox, oy, oz, dx, dy, dz, tmax, any, gnd, mask = any ? NS : null) {
    const ix = dx !== 0 ? 1 / dx : 1e30, iy = dy !== 0 ? 1 / dy : 1e30, iz = dz !== 0 ? 1 / dz : 1e30;
    best = tmax; bi = -1;
    if (gnd && G && dy < 0) {
      const t = (gy - oy) / dy;
      if (t > EPS && t < best) { if (any) { T.i = -2; return true; } best = t; bi = -2; bnx = 0; bny = 1; bnz = 0; }
    }
    if (N) {
      // slabs picked by the ray's signs, so no swapping; the nearer child first
      const nx0 = dx < 0 ? 3 : 0, nx1 = 3 - nx0, ny0 = dy < 0 ? 4 : 1, ny1 = 5 - ny0, nz0 = dz < 0 ? 5 : 2, nz1 = 7 - nz0;
      let sp = 0; stack[sp++] = 0;
      while (sp) {
        const ni = stack[--sp], b = ni * 6;
        let tn = (NB[b + nx0] - ox) * ix, tf = (NB[b + nx1] - ox) * ix;
        const u0 = (NB[b + ny0] - oy) * iy, u1 = (NB[b + ny1] - oy) * iy;
        if (u0 > tn) tn = u0; if (u1 < tf) tf = u1;
        if (tn > tf) continue;
        const w0 = (NB[b + nz0] - oz) * iz, w1 = (NB[b + nz1] - oz) * iz;
        if (w0 > tn) tn = w0; if (w1 < tf) tf = w1;
        if (tn > tf || tf < EPS || tn >= best) continue;
        const c = NC[ni];
        if (c > 0) {
          for (let j = NSt[ni], e = NSt[ni] + c; j < e; j++) {
            const i = IDX[j];
            if (mask && mask[i]) continue;
            if (prim(i, ox, oy, oz, dx, dy, dz, ix, iy, iz, any)) { T.i = i; return true; }
          }
        } else if (NA[ni] === 0 ? dx < 0 : NA[ni] === 1 ? dy < 0 : dz < 0) { stack[sp++] = NL[ni]; stack[sp++] = NR[ni]; }
        else { stack[sp++] = NR[ni]; stack[sp++] = NL[ni]; }
      }
    }
    if (bi === -1) return false;
    if (any) { T.i = bi; return true; }
    T.t = best; T.i = bi; T.nx = bnx; T.ny = bny; T.nz = bnz;
    return true;
  }

  // the sky (and anything below the horizon with no ground under it)
  const SK = sc.sky;
  function sky(dx, dy, dz, out) {
    const k = smoothstep(-0.05, 0.55, dy);
    let r = SK.hor[0] + (SK.zen[0] - SK.hor[0]) * k, g = SK.hor[1] + (SK.zen[1] - SK.hor[1]) * k, b = SK.hor[2] + (SK.zen[2] - SK.hor[2]) * k;
    if (SK.cloud > 0 && dy > 0.015) {
      // a cloud deck lit from below by the town: brighter low down, broken up high
      const u = dx / dy * SK.scale, v = dz / dy * SK.scale;
      let n = 0, a = 0.5, f = 1;
      for (let o = 0; o < 5; o++) { n += vnoise(u * f + o * 17.1, v * f, SK.seed + o) * a; a *= 0.5; f *= 2.07; }
      const c = smoothstep(0.38, 0.78, n) * SK.cloud * (1 - smoothstep(0.1, 0.9, dy) * 0.6);
      r += SK.cloudCol[0] * c; g += SK.cloudCol[1] * c; b += SK.cloudCol[2] * c;
    }
    out[0] = r; out[1] = g; out[2] = b;
  }

  // the material at a hit → S
  const S = { ar: 0, ag: 0, ab: 0, ro: 0, wet: 0, er: 0, eg: 0, eb: 0, nx: 0, ny: 0, nz: 0, wx: 0, wy: 0, wz: 0, metal: 0, glass: 0, ao: 1 };
  function material(i, x, y, z, nx, ny, nz, fw) {
    const m = i === -2 ? G.m : M[i];
    S.ar = S.ag = S.ab = 0.5; S.ro = 0.7; S.wet = 0; S.er = S.eg = S.eb = 0; S.metal = 0; S.glass = 0; S.ao = 1;
    S.nx = S.wx = nx; S.ny = S.wy = ny; S.nz = S.wz = nz;
    m.fn(m, x, y, z, nx, ny, nz, fw, S, i, B, K);
    return m;
  }

  // lamps on a surface point: adds into out
  const CUT = 4e-4 / Math.max(0.1, sc.exposure), SN = sc.shadowN;
  let PXH = 0;
  for (const L of lights) L.cm = Math.max(L.cr, L.cg, L.cb);
  function direct(px, py, pz, vx, vy, vz, cut, out) {
    const nx = S.nx, ny = S.ny, nz = S.nz, wet = S.wet;
    const dm = (1 - S.metal) * (1 - 0.45 * wet);
    const ar = S.ar * dm, ag = S.ag * dm, ab = S.ab * dm;
    const f0r = S.metal ? S.ar : 0.04, f0g = S.metal ? S.ag : 0.04, f0b = S.metal ? S.ab : 0.04;
    const ro = Math.max(0.04, S.ro * (1 - 0.5 * wet)), a2 = ro * ro * ro * ro, kk = ro * ro * 0.5;
    const ndv = Math.max(1e-3, nx * vx + ny * vy + nz * vz);
    const film = Math.max(wet, S.glass), rw = S.glass > wet ? 0.05 : 0.035 + 0.42 * Math.pow(1 - wet, 1.5);
    const ox = px + S.wx * 2e-3, oy = py + S.wy * 2e-3, oz = pz + S.wz * 2e-3;
    let r = 0, g = 0, b = 0;
    for (let j = 0; j < lights.length; j++) {
      const L = lights[j];
      let lx, ly, lz, d, att;
      if (L.dir) { lx = -L.dx; ly = -L.dy; lz = -L.dz; d = 1e4; att = 1; }
      else { lx = L.x - px; ly = L.y - py; lz = L.z - pz; const d2 = lx * lx + ly * ly + lz * lz; d = Math.sqrt(d2); lx /= d; ly /= d; lz /= d; att = 1 / (d2 + L.r2); }
      const ndl = nx * lx + ny * ly + nz * lz;
      if (ndl <= 0 || (S.wx * lx + S.wy * ly + S.wz * lz) <= -0.05) continue;
      if (L.spot) { att *= smoothstep(L.c0, L.c1, -(lx * L.sx + ly * L.sy + lz * L.sz)); if (att <= 0) continue; }
      // a lamp too weak here to matter is added without its shadow ray; a big
      // lamp casts soft shadows (rays to points over its ball, a few per pixel)
      if (L.shadow && (L.cm * att * ndl > cut)) {
        const n = L.r > 0.06 || L.dir ? SN : 1; let vis = 0;
        for (let q = 0; q < n; q++) {
          if (L.dir) {
            // a sun's disc: rays a little off its centre
            let qx = lx, qy = ly, qz = lz;
            if (n > 1) { qx += (hash(PXH, q * 31 + j * 7) - 0.5) * 2 * L.ang; qy += (hash(PXH + 5, q * 17 + j) - 0.5) * 2 * L.ang; qz += (hash(PXH + 17, q * 13 + j * 5) - 0.5) * 2 * L.ang; const ql = Math.hypot(qx, qy, qz); qx /= ql; qy /= ql; qz /= ql; }
            if (!hit(ox, oy, oz, qx, qy, qz, 1e4, true, false)) vis++;
            continue;
          }
          let sx = L.x, sy = L.y, sz = L.z;
          if (n > 1 || L.r > 0.06) { const u = hash(PXH, q * 31 + j * 7) * 2 - 1, a = hash(PXH + 17, q * 13 + j * 5) * 2 * PI, w = Math.sqrt(1 - u * u) * L.r * 0.9; sx += w * Math.cos(a); sy += u * L.r * 0.9; sz += w * Math.sin(a); }
          let qx = sx - px, qy = sy - py, qz = sz - pz; const ql = Math.sqrt(qx * qx + qy * qy + qz * qz); qx /= ql; qy /= ql; qz /= ql;
          if (!hit(ox, oy, oz, qx, qy, qz, ql - L.r, true, false)) vis++;
        }
        if (!vis) continue;
        att *= vis / n;
      }
      // GGX
      let hx = lx + vx, hy = ly + vy, hz = lz + vz; const hl = Math.hypot(hx, hy, hz) || 1; hx /= hl; hy /= hl; hz /= hl;
      const ndh = Math.max(0, nx * hx + ny * hy + nz * hz), ldh = Math.max(0, lx * hx + ly * hy + lz * hz);
      const dd = ndh * ndh * (a2 - 1) + 1, D = a2 / (PI * dd * dd);
      const V = 1 / ((ndl * (1 - kk) + kk) * (ndv * (1 - kk) + kk));
      const fr = Math.pow(1 - ldh, 5), sp = D * V * 0.25 * ndl;
      const kd = ndl / PI;
      r += L.cr * att * (ar * kd + sp * (f0r + (1 - f0r) * fr));
      g += L.cg * att * (ag * kd + sp * (f0g + (1 - f0g) * fr));
      b += L.cb * att * (ab * kd + sp * (f0b + (1 - f0b) * fr));
      // the water film's glint: rough where the ground is only damp, a near mirror where water
      // stands; a big lamp widens it (Karis), so a puddle shows the lamp's ball, a wet street a streak
      if (film > 0.02) {
        const wl = S.wx * lx + S.wy * ly + S.wz * lz; if (wl <= 0) continue;
        let qx = lx + vx, qy = ly + vy, qz = lz + vz; const ql = Math.hypot(qx, qy, qz) || 1; qx /= ql; qy /= ql; qz /= ql;
        const wh = Math.max(0, S.wx * qx + S.wy * qy + S.wz * qz), lh = Math.max(0, lx * qx + ly * qy + lz * qz), wv = Math.max(1e-3, S.wx * vx + S.wy * vy + S.wz * vz);
        const a0 = rw * rw, aw = Math.min(1, a0 + (L.dir ? L.ang : L.r / (2 * d))), a2w = aw * aw, en = (a0 / aw) * (a0 / aw);
        const dw = wh * wh * (a2w - 1) + 1, Dw = a2w / (PI * dw * dw) * en, kw = aw * 0.5;
        const Vw = 1 / ((wl * (1 - kw) + kw) * (wv * (1 - kw) + kw));
        const sw = Dw * Vw * 0.25 * wl * (0.02 + 0.98 * Math.pow(1 - lh, 5)) * film;
        r += L.cr * att * sw; g += L.cg * att * sw; b += L.cb * att * sw;
      }
    }
    out[0] = r; out[1] = g; out[2] = b;
  }

  // ambient occlusion: cosine-weighted short rays round the normal
  const AO = sc.ao;
  function occlusion(px, py, pz, h1, h2) {
    const n = AO.n; if (!n) return 1;
    const nx = S.wx, ny = S.wy, nz = S.wz;
    let tx, ty, tz;
    if (Math.abs(ny) < 0.9) { tx = nz; ty = 0; tz = -nx; } else { tx = 1; ty = 0; tz = 0; }
    const tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
    const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;
    const ox = px + nx * 2e-3, oy = py + ny * 2e-3, oz = pz + nz * 2e-3;
    let occ = 0;
    for (let k = 0; k < n; k++) {
      const u1 = (k + h1) / n, u2 = (k * 0.618034 + h2) % 1;
      const rr = Math.sqrt(u1), th = 2 * PI * u2, a = rr * Math.cos(th), c = rr * Math.sin(th), w = Math.sqrt(1 - u1);
      const dx = tx * a + bx * c + nx * w, dy = ty * a + by * c + ny * w, dz = tz * a + bz * c + nz * w;
      if (hit(ox, oy, oz, dx, dy, dz, AO.d, true, true)) occ++;
    }
    return 1 - AO.k * occ / n;
  }

  // lamp light scattered by the mist along a ray, point lamps, closed form
  const FG = sc.fog;
  function mistPts(ox, oy, oz, dx, dy, dz, t, out) {
    const s = FG.s * FG.k; let r = 0, g = 0, b = 0;
    if (s <= 0) { out[0] = out[1] = out[2] = 0; return; }
    const pl = sc.pts;
    for (let j = 0; j < pl.length; j++) {
      const L = pl[j];
      const lx = L.x - ox, ly = L.y - oy, lz = L.z - oz, dl = lx * dx + ly * dy + lz * dz;
      const h = Math.sqrt(Math.max(1e-4, lx * lx + ly * ly + lz * lz - dl * dl) + L.r2);
      const a = (Math.atan((t - dl) / h) - Math.atan(-dl / h)) / h;
      const k = s * L.vol * a / (4 * PI) * Math.exp(-FG.s * (Math.max(0, Math.min(t, dl)) + h));
      r += L.cr * k; g += L.cg * k; b += L.cb * k;
    }
    out[0] = r; out[1] = g; out[2] = b;
  }
  // where a ray (from the lamp's apex at c = o − apex, direction d) is inside a spot lamp's
  // cone (the forward nappe; cos of the outer half-angle c0): [t0, t1] or null
  const SPAN = [0, 0];
  function coneSpan(cx, cy, cz, dx, dy, dz, L) {
    const c2 = L.c0 * L.c0, dv = dx * L.sx + dy * L.sy + dz * L.sz, cv = cx * L.sx + cy * L.sy + cz * L.sz;
    const a = dv * dv - c2, b = 2 * (dv * cv - c2 * (dx * cx + dy * cy + dz * cz)), cc = cv * cv - c2 * (cx * cx + cy * cy + cz * cz);
    const disc = b * b - 4 * a * cc;
    if (Math.abs(a) < 1e-9) { // the ray runs parallel to the cone's side: one crossing
      const tc = -cc / b; if (!isFinite(tc)) return null;
      if (dv > 0) { SPAN[0] = tc; SPAN[1] = 1e9; } else { SPAN[0] = -1e9; SPAN[1] = tc; }
    } else if (disc < 0) {
      if (a < 0) return null;
      if (dv > 0) { SPAN[0] = -cv / dv; SPAN[1] = 1e9; } else { SPAN[0] = -1e9; SPAN[1] = -cv / dv; }
    } else {
      const q = Math.sqrt(disc), t1 = (-b - q) / (2 * a), t2 = (-b + q) / (2 * a), lo = Math.min(t1, t2), hi = Math.max(t1, t2);
      if (a > 0) { if (dv > 0) { SPAN[0] = hi; SPAN[1] = 1e9; } else { SPAN[0] = -1e9; SPAN[1] = lo; } }
      else { const m = (lo + hi) / 2; if (cv + dv * m < 0) return null; SPAN[0] = lo; SPAN[1] = hi; }
    }
    return SPAN;
  }
  // spot lamps through the mist, with their shadows: equi-angular samples
  const HG = (c) => { const g = FG.g, d = 1 + g * g - 2 * g * c; return (1 - g * g) / (4 * PI * d * Math.sqrt(d)); };
  function mistShafts(ox, oy, oz, dx, dy, dz, t, ns, jit, out) {
    let r = 0, g = 0, b = 0;
    const sl = sc.shafts, s = FG.s * FG.k;
    for (let j = 0; j < sl.length; j++) {
      const L = sl[j];
      if (L.dir) {
        // the sun through gaps: even steps along the ray, each in light or in shadow
        const tm = Math.min(t, L.far), ph = HG(-(L.dx * dx + L.dy * dy + L.dz * dz));
        let acc = 0;
        for (let k = 0; k < ns; k++) {
          const sx = tm * (k + ((jit + k * 0.618034) % 1)) / ns, px = ox + dx * sx, py = oy + dy * sx, pz = oz + dz * sx;
          if (L.shadow && hit(px, py, pz, -L.dx, -L.dy, -L.dz, 1e4, true, false)) continue;
          acc += Math.exp(-FG.s * sx);
        }
        const k = s * L.vol * ph * acc * tm / ns;
        r += L.cr * k; g += L.cg * k; b += L.cb * k;
        continue;
      }
      const lx = L.x - ox, ly = L.y - oy, lz = L.z - oz, dl = lx * dx + ly * dy + lz * dz;
      const D = Math.sqrt(Math.max(4e-4, lx * lx + ly * ly + lz * lz - dl * dl));
      // a spot lamp lights only the part of the ray inside its cone: sample there (a thin beam
      // far off is otherwise mostly missed, and comes out as a spray of dots)
      let s0 = 0, s1 = t;
      if (L.spot) { const iv = coneSpan(-lx, -ly, -lz, dx, dy, dz, L); if (!iv) continue; s0 = Math.max(0, iv[0]); s1 = Math.min(t, iv[1]); if (s1 <= s0) continue; }
      const ta = Math.atan2(s0 - dl, D), tb = Math.atan2(s1 - dl, D);
      let acc = 0;
      for (let k = 0; k < ns; k++) {
        const th = ta + (tb - ta) * ((k + ((jit + k * 0.618034) % 1)) / ns), sx = dl + D * Math.tan(th);
        const px = ox + dx * sx, py = oy + dy * sx, pz = oz + dz * sx;
        let qx = L.x - px, qy = L.y - py, qz = L.z - pz; const q = Math.sqrt(qx * qx + qy * qy + qz * qz); qx /= q; qy /= q; qz /= q;
        let sp = 1;
        if (L.spot) { sp = smoothstep(L.c0, L.c1, -(qx * L.sx + qy * L.sy + qz * L.sz)); if (sp <= 0) continue; }
        if (L.shadow && hit(px, py, pz, qx, qy, qz, q - L.r * 1.5, true, false)) continue;
        acc += sp * HG(qx * dx + qy * dy + qz * dz) * Math.exp(-FG.s * (sx + q));
      }
      const k = s * L.vol * acc * (tb - ta) / D / ns;
      r += L.cr * k; g += L.cg * k; b += L.cb * k;
    }
    out[0] = r; out[1] = g; out[2] = b;
  }

  // a ray's colour, once it is known what it hits (level 1: a reflected ray)
  const C1 = [0, 0, 0], C2 = [0, 0, 0];
  // level 0 (a camera ray): ambient goes to amb (the caller applies the occlusion, worked
  // out on a coarser grid: DEP.wantAO asks for it here), reflections to ref
  function shade(ox, oy, oz, dx, dy, dz, level, px_, py_, out, ref, amb) {
    const f = sc.cam.f;
    if (!hit(ox, oy, oz, dx, dy, dz, 1e4, false, true, level > 0 ? NE : null)) {
      sky(dx, dy, dz, out);
      const Tm = Math.exp(-FG.s * FG.sky);
      out[0] = out[0] * Tm + FG.c[0] * (1 - Tm); out[1] = out[1] * Tm + FG.c[1] * (1 - Tm); out[2] = out[2] * Tm + FG.c[2] * (1 - Tm);
      if (level > 0) { mistPts(ox, oy, oz, dx, dy, dz, FG.sky, C1); out[0] += C1[0]; out[1] += C1[1]; out[2] += C1[2]; }
      if (ref) { ref[0] = ref[1] = ref[2] = 0; ref[3] = -1; }
      if (amb) amb[0] = amb[1] = amb[2] = 0;
      if (level === 0) { DEP.t = FG.sky; DEP.ao = 1; }
      return -1;
    }
    const t = T.t, i = T.i, gnx = T.nx, gny = T.ny, gnz = T.nz;
    const x = ox + dx * t, y = oy + dy * t, z = oz + dz * t;
    const vx = -dx, vy = -dy, vz = -dz;
    const ndv0 = Math.max(0.05, gnx * vx + gny * vy + gnz * vz);
    if (level === 0) PXH = (px_ * 7919 + py_ * 104729) | 0;
    material(i, x, y, z, gnx, gny, gnz, (t / f) / Math.sqrt(ndv0));
    // keep the bent normal facing the eye
    if (S.nx * vx + S.ny * vy + S.nz * vz < 0.02) { S.nx = gnx; S.ny = gny; S.nz = gnz; }
    direct(x, y, z, vx, vy, vz, level === 0 ? CUT : CUT * 40, out);
    if (level === 0) { DEP.nx = gnx; DEP.ny = gny; DEP.nz = gnz; DEP.ao = DEP.wantAO ? occlusion(x, y, z, hash(px_, py_ * 7 + 1), hash(px_ * 3 + 5, py_)) : 1; }
    const ny = S.ny, dm = (1 - S.metal) * (1 - 0.45 * S.wet);
    const AM = sc.amb, hs = 0.5 + 0.5 * ny, hg = 0.5 - 0.5 * ny, ao = S.ao * (GI && level === 0 ? 0 : 1);
    const a0 = (AM.sky[0] * hs + AM.gnd[0] * hg) * S.ar * dm * ao, a1 = (AM.sky[1] * hs + AM.gnd[1] * hg) * S.ag * dm * ao, a2 = (AM.sky[2] * hs + AM.gnd[2] * hg) * S.ab * dm * ao;
    if (amb) { amb[0] = a0; amb[1] = a1; amb[2] = a2; } else { out[0] += a0; out[1] += a1; out[2] += a2; }
    out[0] += S.er; out[1] += S.eg; out[2] += S.eb;
    // the water film (and glass): a mirror, weighted by Fresnel
    let wr = 0, wg = 0, wb = 0, wk = 0, rough = -1;
    const film = Math.max(S.wet, S.glass);
    if (film > 0.02) {
      const nx = S.wx, nyw = S.wy, nz = S.wz;
      const ndv = Math.max(1e-3, nx * vx + nyw * vy + nz * vz);
      const F = 0.02 + 0.98 * Math.pow(1 - ndv, 5);
      wk = F * film; rough = 1 - S.wet * (1 - S.glass);
      if (level === 0 && wk > 0.004) {
        const dn = 2 * (dx * nx + dy * nyw + dz * nz);
        let rx = dx - dn * nx, ry = dy - dn * nyw, rz = dz - dn * nz;
        // a damp surface is a rough mirror: the ray wanders (a cone as wide as the water is thin)
        const gl = (1 - S.wet) * (1 - S.glass); if (gl > 0.05) {
          const sp = gl * gl * 0.35, a1 = hash(px_ * 3 + 1, py_ * 5 + 2) * 2 * PI, a2 = Math.sqrt(hash(px_ * 7 + 3, py_ * 11 + 5)) * sp;
          let tx = ry * 0 - rz * 1, tz = rx * 1 - ry * 0; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl; // across, level
          const bx = ry * tz, by = rz * tx - rx * tz, bz = -ry * tx;
          rx += (tx * Math.cos(a1) + bx * Math.sin(a1)) * a2; ry += by * Math.sin(a1) * a2; rz += (tz * Math.cos(a1) + bz * Math.sin(a1)) * a2;
        }
        if (rx * gnx + ry * gny + rz * gnz < 0.01) { const k = 0.01 - (rx * gnx + ry * gny + rz * gnz); rx += gnx * k; ry += gny * k; rz += gnz * k; }
        const rl = Math.hypot(rx, ry, rz); rx /= rl; ry /= rl; rz /= rl;
        const sv = { ...S };
        shade(x + gnx * 2e-3, y + gny * 2e-3, z + gnz * 2e-3, rx, ry, rz, 1, px_, py_, C2, null, null);
        Object.assign(S, sv);
        wr = C2[0] * wk; wg = C2[1] * wk; wb = C2[2] * wk;
      } else if (level > 0) {
        // a reflection in a reflection: the sky will do
        sky(dx, Math.abs(dy), dz, C2); wr = C2[0] * wk; wg = C2[1] * wk; wb = C2[2] * wk;
      }
    }
    if (ref) { ref[0] = wr; ref[1] = wg; ref[2] = wb; ref[3] = rough; } else { out[0] += wr; out[1] += wg; out[2] += wb; }
    // the light from everything else (one bounce): its colour here is the albedo times what is gathered
    const Tm = Math.exp(-FG.s * t);
    if (GI && level === 0) {
      DEP.ar = S.ar * dm * S.ao * Tm; DEP.ag = S.ag * dm * S.ao * Tm; DEP.ab = S.ab * dm * S.ao * Tm;
      if (DEP.wantGI) { const sv = { ...S }; gather(x, y, z, gnx, gny, gnz, px_, py_); Object.assign(S, sv); }
    }
    // the mist on the way
    out[0] = out[0] * Tm + FG.c[0] * (1 - Tm); out[1] = out[1] * Tm + FG.c[1] * (1 - Tm); out[2] = out[2] * Tm + FG.c[2] * (1 - Tm);
    if (ref) { ref[0] *= Tm; ref[1] *= Tm; ref[2] *= Tm; }
    if (amb) { amb[0] *= Tm; amb[1] *= Tm; amb[2] *= Tm; }
    if (level > 0) { mistPts(ox, oy, oz, dx, dy, dz, t, C1); out[0] += C1[0]; out[1] += C1[1]; out[2] += C1[2]; }
    else DEP.t = t;
    return i;
  }
  const DEP = { t: 0, ao: 1, wantAO: false, nx: 0, ny: 0, nz: 0, wantGI: false, ar: 0, ag: 0, ab: 0, gr: 0, gg: 0, gb: 0 };

  // one bounce: cosine-weighted rays over the hemisphere; each hit lit by the lamps (shadows only
  // where they matter) plus a little fill for the bounces after; a ray that gets out sees the sky
  const GI = sc.gi, GC = [0, 0, 0];
  function gather(px, py, pz, nx, ny, nz, h1x, h1y) {
    const n = GI.n, f = sc.cam.f;
    let tx, ty, tz;
    if (Math.abs(ny) < 0.9) { tx = nz; ty = 0; tz = -nx; } else { tx = 1; ty = 0; tz = 0; }
    const tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
    const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;
    const ox = px + nx * 3e-3, oy = py + ny * 3e-3, oz = pz + nz * 3e-3, h1 = hash(h1x * 13 + 7, h1y * 3 + 1), h2 = hash(h1x * 5 + 3, h1y * 11 + 2);
    let r = 0, g = 0, b = 0;
    for (let k = 0; k < n; k++) {
      const u1 = (k + h1) / n, u2 = (k * 0.618034 + h2) % 1;
      const rr = Math.sqrt(u1), th = 2 * PI * u2, a = rr * Math.cos(th), c = rr * Math.sin(th), w = Math.sqrt(1 - u1);
      const dx = tx * a + bx * c + nx * w, dy = ty * a + by * c + ny * w, dz = tz * a + bz * c + nz * w;
      if (!hit(ox, oy, oz, dx, dy, dz, 1e4, false, true, NE)) { sky(dx, dy, dz, GC); r += GC[0]; g += GC[1]; b += GC[2]; continue; }
      const t = T.t, i = T.i, hx = ox + dx * t, hy = oy + dy * t, hz = oz + dz * t, gx = T.nx, gy2 = T.ny, gz = T.nz;
      material(i, hx, hy, hz, gx, gy2, gz, t / f);
      if (S.nx * -dx + S.ny * -dy + S.nz * -dz < 0.02) { S.nx = gx; S.ny = gy2; S.nz = gz; }
      S.wet = 0; S.glass = 0;
      direct(hx, hy, hz, -dx, -dy, -dz, CUT * 20, GC);
      const dm = 1 - S.metal, AM = sc.amb, fl = GI.fill;
      const Tr = Math.exp(-FG.s * t);
      // one ray landing right under a lamp would otherwise speckle the bounce: clamp it
      let sr = (GC[0] + S.er + AM.sky[0] * S.ar * dm * fl) * Tr, sg = (GC[1] + S.eg + AM.sky[1] * S.ag * dm * fl) * Tr, sb = (GC[2] + S.eb + AM.sky[2] * S.ab * dm * fl) * Tr;
      const mx = Math.max(sr, sg, sb); if (mx > GI.clamp) { const k = GI.clamp / mx; sr *= k; sg *= k; sb *= k; }
      r += sr; g += sg; b += sb;
    }
    DEP.gr = r / n; DEP.gg = g / n; DEP.gb = b / n;
  }

  // the camera ray through plate pixel (px, py)
  const cam = sc.cam, cy_ = Math.cos(cam.yaw), sy_ = Math.sin(cam.yaw), cp_ = Math.cos(cam.pitch), sp_ = Math.sin(cam.pitch);
  const R = [0, 0, 0];
  function ray(px, py) {
    const xc = (px - cam.cx) / cam.f, yc = -(py - cam.cy) / cam.f, zc = 1;
    const dy = yc * cp_ + zc * sp_, z1 = -yc * sp_ + zc * cp_;
    const dx = xc * cy_ + z1 * sy_, dz = -xc * sy_ + z1 * cy_;
    const l = Math.hypot(dx, dy, dz); R[0] = dx / l; R[1] = dy / l; R[2] = dz / l;
    return R;
  }
  return { hit, T, DEP, sky, ray, shade, mistPts, mistShafts, material, S };
}

// ACES (Narkowicz fit) then sRGB
const aces = (x) => { const v = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14); return v < 0 ? 0 : v > 1 ? 1 : v; };
const srgb = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);

// Render rows [y0, y1) of the plate. Returns RGBA bytes for those rows.
// opts: { yield?: () => void } — called between rows (for slicing on the main thread)
export function* renderRows(sc, y0, y1) {
  const tr = tracer(sc), W = sc.W, H = sc.H, cam = sc.cam;
  const streak = sc.refl.streak, vs = sc.vs;
  const m = (sc.hdr ? 0 : streak) + vs + 4 + (sc.gi ? sc.gi.step : 0);
  const ya = Math.max(0, y0 - m), yb = Math.min(H, y1 + m), rows = yb - ya;
  const n = W * rows;
  const col = new Float32Array(n * 3), ref = new Float32Array(n * 3), amb = new Float32Array(n * 3), rr = new Float32Array(n), dep = new Float32Array(n), id = new Int32Array(n);
  const nrm = new Float32Array(n * 3), aog = new Float32Array(n);
  const GI = sc.gi, gs = GI ? GI.step : 1, alb = GI ? new Float32Array(n * 3) : null, gig = GI ? new Float32Array(n * 3) : null;
  const out = [0, 0, 0], rf = [0, 0, 0, 0], am = [0, 0, 0], mp = [0, 0, 0];
  // 1. one sample per pixel; the occlusion on every other pixel of every other row
  for (let y = ya; y < yb; y++) {
    for (let x = 0; x < W; x++) {
      const d = tr.ray(x + 0.5, y + 0.5), k = (y - ya) * W + x;
      tr.DEP.wantAO = !GI && (sc.aoStep === 1 || ((x & 1) === 0 && (y & 1) === 0));
      tr.DEP.wantGI = !!GI && x % gs === 0 && y % gs === 0;
      const i = tr.shade(cam.p[0], cam.p[1], cam.p[2], d[0], d[1], d[2], 0, x, y, out, rf, am);
      const t = tr.DEP.t;
      tr.mistPts(cam.p[0], cam.p[1], cam.p[2], d[0], d[1], d[2], t, mp);
      col[k * 3] = out[0] + mp[0]; col[k * 3 + 1] = out[1] + mp[1]; col[k * 3 + 2] = out[2] + mp[2];
      ref[k * 3] = rf[0]; ref[k * 3 + 1] = rf[1]; ref[k * 3 + 2] = rf[2]; rr[k] = rf[3];
      amb[k * 3] = am[0]; amb[k * 3 + 1] = am[1]; amb[k * 3 + 2] = am[2];
      nrm[k * 3] = tr.DEP.nx; nrm[k * 3 + 1] = tr.DEP.ny; nrm[k * 3 + 2] = tr.DEP.nz; aog[k] = tr.DEP.ao;
      if (GI) { alb[k * 3] = i === -1 ? 0 : tr.DEP.ar; alb[k * 3 + 1] = i === -1 ? 0 : tr.DEP.ag; alb[k * 3 + 2] = i === -1 ? 0 : tr.DEP.ab; if (tr.DEP.wantGI) { gig[k * 3] = tr.DEP.gr; gig[k * 3 + 1] = tr.DEP.gg; gig[k * 3 + 2] = tr.DEP.gb; } }
      dep[k] = t; id[k] = i;
    }
    yield;
  }
  tr.DEP.wantAO = false; tr.DEP.wantGI = false;
  // 2. edges again, at five samples (where the thing hit changes, or the light jumps)
  if (sc.aa) {
    const lum = (k) => col[k * 3] * 0.3 + col[k * 3 + 1] * 0.59 + col[k * 3 + 2] * 0.11 + (ref[k * 3] + ref[k * 3 + 1] + ref[k * 3 + 2] + amb[k * 3] + amb[k * 3 + 1] + amb[k * 3 + 2]) * 0.33;
    const edge = new Uint8Array(n);
    for (let y = 0; y < rows; y++) for (let x = 0; x < W; x++) {
      const k = y * W + x, l0 = lum(k);
      for (const [ex, ey] of [[1, 0], [0, 1]]) {
        if (x + ex >= W || y + ey >= rows) continue;
        const k2 = k + ey * W + ex, l1 = lum(k2);
        if (id[k] !== id[k2] || Math.abs(l0 - l1) > 0.3 * (l0 + l1 + 0.004)) { edge[k] = 1; edge[k2] = 1; }
      }
    }
    const OFF = [[0.125, 0.375], [0.625, 0.125], [0.875, 0.625], [0.375, 0.875]];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < W; x++) {
        const k = y * W + x; if (!edge[k]) continue;
        let r = col[k * 3], g = col[k * 3 + 1], b = col[k * 3 + 2], fr = ref[k * 3], fg = ref[k * 3 + 1], fb = ref[k * 3 + 2], ro = rr[k];
        let ar = amb[k * 3], ag = amb[k * 3 + 1], ab = amb[k * 3 + 2];
        let lr = GI ? alb[k * 3] : 0, lg = GI ? alb[k * 3 + 1] : 0, lb = GI ? alb[k * 3 + 2] : 0;
        for (const [ox, oy] of OFF) {
          const d = tr.ray(x + ox, y + ya + oy);
          const si = tr.shade(cam.p[0], cam.p[1], cam.p[2], d[0], d[1], d[2], 0, x * 5 + 1, y * 3 + 2, out, rf, am);
          if (GI && si !== -1) { lr += tr.DEP.ar; lg += tr.DEP.ag; lb += tr.DEP.ab; }
          const t = tr.DEP.t;
          tr.mistPts(cam.p[0], cam.p[1], cam.p[2], d[0], d[1], d[2], t, mp);
          r += out[0] + mp[0]; g += out[1] + mp[1]; b += out[2] + mp[2]; fr += rf[0]; fg += rf[1]; fb += rf[2]; ro = Math.max(ro, rf[3]);
          ar += am[0]; ag += am[1]; ab += am[2];
        }
        col[k * 3] = r / 5; col[k * 3 + 1] = g / 5; col[k * 3 + 2] = b / 5; ref[k * 3] = fr / 5; ref[k * 3 + 1] = fg / 5; ref[k * 3 + 2] = fb / 5; rr[k] = ro;
        amb[k * 3] = ar / 5; amb[k * 3 + 1] = ag / 5; amb[k * 3 + 2] = ab / 5;
        if (GI) { alb[k * 3] = lr / 5; alb[k * 3 + 1] = lg / 5; alb[k * 3 + 2] = lb / 5; }
      }
      if (y % 8 === 7) yield;
    }
  }
  // the occlusion, up from its grid: the four nearest samples that face the same way at the same depth
  const ao = new Float32Array(n);
  for (let y = 0; y < rows; y++) {
    const Y = y + ya, gy0 = Y & ~1;
    if (sc.aoStep === 1) { for (let x = 0; x < W; x++) ao[y * W + x] = aog[y * W + x]; continue; }
    for (let x = 0; x < W; x++) {
      const k = y * W + x, gx0 = x & ~1, fx = (x - gx0) / 2, fy = (Y - gy0) / 2, t0 = dep[k];
      let s = 0, sw = 0;
      for (let j = 0; j < 4; j++) {
        const gx = gx0 + (j & 1) * 2, gy = gy0 + (j >> 1) * 2 - ya;
        if (gx >= W || gy < 0 || gy >= rows) continue;
        const g = gy * W + gx, nd = nrm[k * 3] * nrm[g * 3] + nrm[k * 3 + 1] * nrm[g * 3 + 1] + nrm[k * 3 + 2] * nrm[g * 3 + 2];
        const dz = (dep[g] - t0) / (0.03 * t0 + 0.02);
        const w = ((j & 1) ? fx : 1 - fx) * ((j >> 1) ? fy : 1 - fy) * (nd > 0.8 ? 1 : 0.01) * Math.exp(-dz * dz) + 1e-6;
        s += aog[g] * w; sw += w;
      }
      ao[k] = sw > 0 ? s / sw : 1;
    }
  }
  for (let k = 0; k < n; k++) { const a = ao[k]; col[k * 3] += amb[k * 3] * a; col[k * 3 + 1] += amb[k * 3 + 1] * a; col[k * 3 + 2] += amb[k * 3 + 2] * a; }
  // the bounce light, up from its grid the same way, times each pixel's own albedo
  if (GI) {
    for (let y = 0; y < rows; y++) {
      const Y = y + ya, gy0 = Y - (Y % gs);
      for (let x = 0; x < W; x++) {
        const k = y * W + x, gx0 = x - (x % gs), fx = (x - gx0) / gs, fy = (Y - gy0) / gs, t0 = dep[k];
        let sr = 0, sg = 0, sb = 0, sw = 0;
        for (let j = 0; j < 4; j++) {
          const gx = gx0 + (j & 1) * gs, gy = gy0 + (j >> 1) * gs - ya;
          if (gx >= W || gy < 0 || gy >= rows) continue;
          const g = gy * W + gx, nd = nrm[k * 3] * nrm[g * 3] + nrm[k * 3 + 1] * nrm[g * 3 + 1] + nrm[k * 3 + 2] * nrm[g * 3 + 2];
          const dz = (dep[g] - t0) / (0.03 * t0 + 0.02);
          const w = ((j & 1) ? fx : 1 - fx) * ((j >> 1) ? fy : 1 - fy) * (nd > 0.8 ? 1 : 0.01) * Math.exp(-dz * dz) + 1e-6;
          sr += gig[g * 3] * w; sg += gig[g * 3 + 1] * w; sb += gig[g * 3 + 2] * w; sw += w;
        }
        if (sw > 0) { col[k * 3] += alb[k * 3] * sr / sw; col[k * 3 + 1] += alb[k * 3 + 1] * sg / sw; col[k * 3 + 2] += alb[k * 3 + 2] * sb / sw; }
      }
    }
  }
  // 3. the reflections smeared up and down (for a whole image that is done after the bands meet)
  if (streak > 0 && !sc.hdr) { smear(ref, rr, W, rows, streak); yield; }
  // 4. the spot lamps' shafts in the mist, on a coarse grid
  let vol = null, gw = 0, gy0 = 0, gh = 0;
  if (sc.shafts.length) {
    gw = Math.ceil(W / vs) + 1; gy0 = Math.floor(ya / vs); gh = Math.ceil(yb / vs) + 1 - gy0;
    vol = new Float32Array(gw * gh * 4);
    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        const sx = Math.min(W - 0.5, gx * vs + 0.5), sy = Math.min(H - 0.5, (gy + gy0) * vs + 0.5);
        const d = tr.ray(sx, sy);
        const t = tr.hit(cam.p[0], cam.p[1], cam.p[2], d[0], d[1], d[2], 1e4, false, true) ? tr.T.t : sc.fog.sky;
        tr.mistShafts(cam.p[0], cam.p[1], cam.p[2], d[0], d[1], d[2], t, sc.vn, hash(gx, gy + gy0), mp);
        const g = (gy * gw + gx) * 4; vol[g] = mp[0]; vol[g + 1] = mp[1]; vol[g + 2] = mp[2]; vol[g + 3] = t;
      }
      yield;
    }
  }
  // 5. together, through the film curve
  const ex = sc.exposure, outRows = y1 - y0, px = sc.hdr ? new Float32Array(W * outRows * 3) : new Uint8ClampedArray(W * outRows * 4);
  for (let y = y0; y < y1; y++) {
    for (let x = 0; x < W; x++) {
      const k = (y - ya) * W + x;
      const rk = sc.hdr ? 0 : 1;
      let r = col[k * 3] + ref[k * 3] * rk, g = col[k * 3 + 1] + ref[k * 3 + 1] * rk, b = col[k * 3 + 2] + ref[k * 3 + 2] * rk;
      if (vol) {
        // bilinear on the grid, leaning on the samples at the same depth
        const fx = (x + 0.5 - 0.5) / vs, fy = (y + 0.5 - 0.5) / vs - gy0, ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy;
        const t0 = dep[k];
        let sr = 0, sg = 0, sb = 0, sw = 0;
        for (let j = 0; j < 4; j++) {
          const gx = Math.min(gw - 1, ix + (j & 1)), gyy = Math.min(gh - 1, Math.max(0, iy + (j >> 1)));
          const g = (gyy * gw + gx) * 4, wb = ((j & 1) ? ax : 1 - ax) * ((j >> 1) ? ay : 1 - ay);
          const dz = (vol[g + 3] - t0) / (0.08 * t0 + 0.05), w = wb * Math.exp(-dz * dz) + 1e-5 * wb;
          sr += vol[g] * w; sg += vol[g + 1] * w; sb += vol[g + 2] * w; sw += w;
        }
        if (sw > 0) { r += sr / sw; g += sg / sw; b += sb / sw; }
      }
      if (sc.hdr) { const o = ((y - y0) * W + x) * 3; px[o] = r; px[o + 1] = g; px[o + 2] = b; continue; }
      const o = ((y - y0) * W + x) * 4, dn = (hash(x + 11, y * 3 + 7) + hash(x * 5 + 2, y + 13) - 1) / 255;
      px[o] = (srgb(aces(r * ex)) + dn) * 255; px[o + 1] = (srgb(aces(g * ex)) + dn) * 255; px[o + 2] = (srgb(aces(b * ex)) + dn) * 255; px[o + 3] = 255;
    }
  }
  if (sc.hdr) return { fl: px, ref: ref.slice((y0 - ya) * W * 3, (y1 - ya) * W * 3), rr: rr.slice((y0 - ya) * W, (y1 - ya) * W), dep: dep.slice((y0 - ya) * W, (y1 - ya) * W) };
  return px;
}

// the reflections smeared up and down the screen, the way a wet street
// streaks a light: two box passes over each column, as long as the water is
// rough (rr: 0 standing water … 1 damp; < 0 no film), never leaving the film
export function smear(ref, rr, W, rows, streak) {
  const n = W * rows, tmp = new Float32Array(n * 3), S = new Float64Array((rows + 1) * 4);
  for (let pass = 0; pass < 2; pass++) {
    const src = pass ? tmp : ref, dst = pass ? ref : tmp;
    for (let x = 0; x < W; x++) {
      S[0] = S[1] = S[2] = S[3] = 0;
      for (let y = 0; y < rows; y++) {
        const k = y * W + x, w = rr[k] >= 0 ? 1 : 0;
        S[(y + 1) * 4] = S[y * 4] + src[k * 3]; S[(y + 1) * 4 + 1] = S[y * 4 + 1] + src[k * 3 + 1]; S[(y + 1) * 4 + 2] = S[y * 4 + 2] + src[k * 3 + 2]; S[(y + 1) * 4 + 3] = S[y * 4 + 3] + w;
      }
      for (let y = 0; y < rows; y++) {
        const k = y * W + x, L = Math.round(streak * (0.12 + 0.88 * rr[k]) * 0.5);
        if (rr[k] < 0) { dst[k * 3] = dst[k * 3 + 1] = dst[k * 3 + 2] = 0; continue; }
        if (L < 1) { dst[k * 3] = src[k * 3]; dst[k * 3 + 1] = src[k * 3 + 1]; dst[k * 3 + 2] = src[k * 3 + 2]; continue; }
        const a = Math.max(0, y - L), b = Math.min(rows, y + L + 1), wn = S[b * 4 + 3] - S[a * 4 + 3];
        if (wn <= 0) { dst[k * 3] = dst[k * 3 + 1] = dst[k * 3 + 2] = 0; continue; }
        dst[k * 3] = (S[b * 4] - S[a * 4]) / wn; dst[k * 3 + 1] = (S[b * 4 + 1] - S[a * 4 + 1]) / wn; dst[k * 3 + 2] = (S[b * 4 + 2] - S[a * 4 + 2]) / wn;
      }
    }
  }
}

// linear light (W×H×3) → RGBA bytes through the film curve, dithered
export function film(fl, W, H, ex) {
  const px = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, dn = (hash(x + 11, y * 3 + 7) + hash(x * 5 + 2, y + 13) - 1) / 255;
    px[i * 4] = (srgb(aces(fl[i * 3] * ex)) + dn) * 255; px[i * 4 + 1] = (srgb(aces(fl[i * 3 + 1] * ex)) + dn) * 255; px[i * 4 + 2] = (srgb(aces(fl[i * 3 + 2] * ex)) + dn) * 255; px[i * 4 + 3] = 255;
  }
  return px;
}

// the whole thing at once (tests, workers)
export function renderBand(sc, y0, y1) { const g = renderRows(sc, y0, y1); let r; do r = g.next(); while (!r.done); return r.value; }

// value noise for the sky (mats.js has the rest)
function vnoise(x, y, s) {
  const i = Math.floor(x), j = Math.floor(y); let fx = x - i, fy = y - j; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = hash(i + s * 131, j), b = hash(i + 1 + s * 131, j), c = hash(i + s * 131, j + 1), d = hash(i + 1 + s * 131, j + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
