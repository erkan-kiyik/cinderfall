// KOR — cinematics: materials for the plate tracer (trace.js). Each is
//   fn(m, x, y, z, nx, ny, nz, fw, S, i, B)
// m: its parameters; (x, y, z) the hit; n the face's normal; fw the size of a
// pixel there (metres), so fine detail fades instead of crawling; i the prim
// (−2: the ground) and B the prims' bounds, for things placed on a face.
// It writes S: albedo ar/ag/ab (linear), roughness ro, wetness wet (1 =
// standing water), emission er/eg/eb, metal, glass, ao, the bent normal
// nx/ny/nz (bend()) — the water film keeps the face's normal.
//
// Nothing here is a picture: stone is laid in courses with a joint, a bevel,
// a tone for each block and the weather down its face; steps wear at the
// nose; pavers sit a hair off level; water stands in the low places.

const h2 = (i, j, s) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s | 0, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const cl = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export function vn(x, y, s = 0) {
  const i = Math.floor(x), j = Math.floor(y); let fx = x - i, fy = y - j; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = h2(i, j, s), b = h2(i + 1, j, s), c = h2(i, j + 1, s), d = h2(i + 1, j + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
// fbm whose octaves finer than the pixel fade out (fw in the same units as x)
export function fbm(x, y, oct = 4, s = 0, fw = 0) {
  let v = 0, a = 0.5, f = 1, n = 0;
  for (let o = 0; o < oct; o++) {
    const k = fw > 0 ? 1 - ss(0.25, 0.6, fw * f) : 1;
    if (k <= 0) { v += 0.5 * a; n += a; } else { v += (vn(x * f, y * f, s + o * 13) * k + 0.5 * (1 - k)) * a; n += a; }
    a *= 0.5; f *= 2.03;
  }
  return v / n;
}

// face coordinates: U across, V up the face (or along z on a floor), and its tangents
const F = { U: 0, V: 0, tx: 0, ty: 0, tz: 0, bx: 0, by: 0, bz: 0 };
function face(x, y, z, nx, ny, nz) {
  if (Math.abs(ny) > 0.7) { F.U = x; F.V = z; F.tx = 1; F.ty = 0; F.tz = 0; F.bx = 0; F.by = 0; F.bz = 1; }
  else if (Math.abs(nx) > Math.abs(nz)) { F.U = z; F.V = y; F.tx = 0; F.ty = 0; F.tz = 1; F.bx = 0; F.by = 1; F.bz = 0; }
  else { F.U = x; F.V = y; F.tx = 1; F.ty = 0; F.tz = 0; F.bx = 0; F.by = 1; F.bz = 0; }
  return F;
}
// a cylinder's face: U round it, V up
function faceCyl(x, y, z, B, i) {
  const b = i * 6, cx = (B[b] + B[b + 3]) / 2, cz = (B[b + 2] + B[b + 5]) / 2, r = (B[b + 3] - B[b]) / 2;
  const a = Math.atan2(x - cx, z - cz);
  F.U = a * r; F.V = y; F.tx = Math.cos(a); F.ty = 0; F.tz = -Math.sin(a); F.bx = 0; F.by = 1; F.bz = 0;
  return F;
}
// tilt the normal by the slope of a height over the face
function bend(S, gu, gv) {
  let x = S.nx - gu * F.tx - gv * F.bx, y = S.ny - gu * F.ty - gv * F.by, z = S.nz - gu * F.tz - gv * F.bz;
  const l = Math.hypot(x, y, z); S.nx = x / l; S.ny = y / l; S.nz = z / l;
}
const set = (S, c, k = 1) => { S.ar = c[0] * k; S.ag = c[1] * k; S.ab = c[2] * k; };
const mul = (S, r, g = r, b = r) => { S.ar *= r; S.ag *= g; S.ab *= b; };

export const MAT_DEFAULTS = { kind: 'flat', col: [0.4, 0.4, 0.4], ro: 0.7, wet: 0 };

export const MATS = {
  flat(m, x, y, z, nx, ny, nz, fw, S) { set(S, m.col); S.ro = m.ro; S.wet = m.wet; },
  emit(m, x, y, z, nx, ny, nz, fw, S) { set(S, [0, 0, 0]); S.er = m.e[0]; S.eg = m.e[1]; S.eb = m.e[2]; S.ro = 0.3; },

  // cut stone in courses (ashlar): joints, bevels, a tone per block, rain
  // streaks, damp rising from the foot, soot
  stone(m, x, y, z, nx, ny, nz, fw, S, i, B) {
    const f = face(x, y, z, nx, ny, nz), s = m.seed;
    const bh = m.bh ?? 0.55, bl = m.bl ?? 1.15, jw = m.jw ?? 0.006, bev = m.bev ?? 0.02;
    const row = Math.floor(f.V / bh), su = f.U + (row & 1) * bl * 0.5 + h2(row, 3, s) * 0.21, col = Math.floor(su / bl);
    const fu = su - col * bl, fv = f.V - row * bh, eu = Math.min(fu, bl - fu), ev = Math.min(fv, bh - fv);
    const hb = h2(col, row, s), hc = h2(col, row, s + 1);
    // the joint, filtered by the pixel's size
    const jk = 1 - ss(jw - fw * 0.7, jw + fw * 0.7, Math.min(eu, ev));
    const tone = (0.8 + 0.34 * hb) * (0.82 + 0.36 * fbm(f.U * 0.13 + 7, f.V * 0.13, 3, s + 12));
    const grain = 0.86 + 0.28 * fbm(f.U * 2.2, f.V * 2.2, 5, s + 4, fw * 2.2) + 0.08 * (fbm(f.U * 31, f.V * 31, 2, s + 9, fw * 31) - 0.5);
    // the weather: streaks down from each course (more under ledges given in m.ledges), soot higher up
    const st = ss(0.5, 0.78, fbm(f.U * 1.6 + 31, f.V * 0.09, 4, s + 6, fw)) * (m.streak ?? 0.5);
    let led = 0; if (m.ledges) for (const ly of m.ledges) { const d = ly - y; if (d > 0 && d < 2.6) led = Math.max(led, (1 - d / 2.6) * ss(0.42, 0.62, fbm(f.U * 3.1, y * 0.4, 3, s + 7, fw))); }
    const damp = 1 - ss(0, m.damp ?? 0.9, y - (m.base ?? 0) - fbm(f.U * 1.3, 0.5, 3, s + 8) * 0.5);
    const c = m.col;
    set(S, [c[0] * (0.97 + 0.06 * hc), c[1], c[2] * (1.03 - 0.06 * hc)], tone * grain * (1 - 0.42 * st) * (1 - 0.5 * led) * (1 - 0.38 * damp));
    if (jk > 0) { const k = 1 - jk * 0.6; mul(S, k, k * 0.98, k * 0.95); }
    S.ro = 0.78 - 0.2 * damp;
    S.wet = cl((m.wet ?? 0.12) + 0.45 * damp + 0.25 * st + 0.3 * led);
    // bevels: the face falls away into the joint
    let gu = 0, gv = 0;
    if (eu < jw + bev) gu = (fu < bl / 2 ? -1 : 1) * 0.55 * (1 - cl((eu - jw) / bev));
    if (ev < jw + bev) gv = (fv < bh / 2 ? -1 : 1) * 0.55 * (1 - cl((ev - jw) / bev));
    // a little roughness of the dressed face
    const e = 0.02, r0 = fbm(f.U * 6, f.V * 6, 3, s + 2, fw * 6);
    gu += (fbm((f.U + e) * 6, f.V * 6, 3, s + 2, fw * 6) - r0) / e * 0.012; gv += (fbm(f.U * 6, (f.V + e) * 6, 3, s + 2, fw * 6) - r0) / e * 0.012;
    bend(S, -gu, -gv);
  },

  // stone round a column: fluted, the same weather
  column(m, x, y, z, nx, ny, nz, fw, S, i, B) {
    if (Math.abs(ny) > 0.7) return MATS.stone(m, x, y, z, nx, ny, nz, fw, S, i, B);
    const f = faceCyl(x, y, z, B, i), s = m.seed, n = m.flutes ?? 20, r = (B[i * 6 + 3] - B[i * 6]) / 2, w = (2 * Math.PI * r) / n;
    const p = ((f.U / w) % 1 + 1) % 1, fl = Math.cos(p * 2 * Math.PI);
    const drum = m.drum ?? 1.1, dv = y % drum, dj = Math.min(dv, drum - dv), jk = 1 - ss(0.004 - fw * 0.5, 0.004 + fw * 0.5, dj);
    const grain = 0.86 + 0.28 * fbm(f.U * 2.2, f.V * 2.2, 5, s + 4, fw * 2.2);
    const st = ss(0.5, 0.78, fbm(f.U * 1.6 + 31, f.V * 0.09, 4, s + 6, fw)) * (m.streak ?? 0.5);
    const damp = 1 - ss(0, m.damp ?? 0.9, y - (m.base ?? 0));
    set(S, m.col, (0.9 + 0.1 * fl) * grain * (1 - 0.4 * st) * (1 - 0.35 * damp) * (1 - jk * 0.45));
    S.ro = 0.75; S.wet = cl((m.wet ?? 0.12) + 0.4 * damp + 0.25 * st);
    // the fluting: a groove's slope across U (soft where the pixel is bigger than a flute)
    const k = 1 - ss(w * 0.25, w * 0.6, fw);
    bend(S, Math.sin(p * 2 * Math.PI) * 0.6 * k, 0);
  },

  // stone steps: pale, veined, worn round the nose of each tread, water on the treads
  steps(m, x, y, z, nx, ny, nz, fw, S, i, B) {
    const f = face(x, y, z, nx, ny, nz), s = m.seed + i, b = i * 6;
    const front = B[b + 2], top = B[b + 4];
    const vein = ss(0.06, 0.0, Math.abs(Math.sin(f.U * 0.9 + fbm(f.U * 0.7, f.V * 0.7 + y, 4, s, fw) * 7)) - fw);
    const slab = Math.floor((f.U + h2(i, 1, 3) * 2) / (m.slab ?? 1.6)), hb = h2(slab, i, s);
    const grain = 0.9 + 0.2 * fbm(f.U * 3, f.V * 3 + y * 3, 4, s + 2, fw * 3);
    const jk = 1 - ss(0.003, 0.006 + fw * 0.6, Math.min(((f.U + h2(i, 1, 3) * 2) % (m.slab ?? 1.6) + 1.6) % 1.6, 1.6 - ((f.U + h2(i, 1, 3) * 2) % (m.slab ?? 1.6) + 1.6) % 1.6));
    set(S, m.col, (0.86 + 0.18 * hb) * grain * (1 - 0.22 * vein) * (1 - 0.45 * jk));
    S.ro = 0.4;
    // the nose: the edge where the tread meets the riser is rounded and darker with wear
    const dn = Math.hypot(Math.max(0, z - front) * (ny > 0.7 ? 1 : 0), Math.max(0, top - y) * (ny > 0.7 ? 0 : 1));
    const nose = 1 - ss(0, 0.05, ny > 0.7 ? z - front : top - y);
    if (nose > 0) { if (ny > 0.7) bend(S, 0, 0.9 * nose); else bend(S, 0, -0.9 * nose); mul(S, 1 - 0.25 * nose); }
    if (ny > 0.7) {
      // worn hollows hold water; a slope toward the nose sheds it
      const hol = fbm(x * 0.5, z * 1.5 + i * 3.1, 4, s + 5) + 0.25 * ss(0.4, 0.05, z - front) - (m.puddle ?? 0.62);
      S.wet = cl(0.45 + ss(-0.05, 0.05, hol) * 0.55);
      // rain on the water
      const rp = 0.004 * S.wet, e = 0.01, r0 = vn(x * 30, z * 30, s + 7);
      S.wx = -(vn((x + e) * 30, z * 30, s + 7) - r0) / e * rp; S.wz = -(vn(x * 30, (z + e) * 30, s + 7) - r0) / e * rp; S.wy = 1;
      const l = Math.hypot(S.wx, 1, S.wz); S.wx /= l; S.wy /= l; S.wz /= l;
    } else S.wet = 0.25 + 0.2 * ss(0.4, 0, top - y);
    void dn;
  },

  // granite setts laid in a running bond along x; each a hair off level; water in the joints and the low places
  pavers(m, x, y, z, nx, ny, nz, fw, S) {
    const s = m.seed, a = m.a ?? 0.6, b = m.b ?? 0.3, jw = m.jw ?? 0.008;
    const row = Math.floor(z / b), sx = x + (row & 1) * a * 0.5 + h2(row, 9, s) * 0.13, col = Math.floor(sx / a);
    const fu = sx - col * a, fv = z - row * b, eu = Math.min(fu, a - fu), ev = Math.min(fv, b - fv), e0 = Math.min(eu, ev);
    const hb = h2(col, row, s), hc = h2(col, row, s + 3);
    const jk = 1 - ss(jw - fw * 0.6, jw + fw * 0.6, e0);
    const grain = 0.82 + 0.36 * fbm(x * 9, z * 9, 4, s + 1, fw * 9) + 0.1 * (vn(x * 60, z * 60, s + 2) - 0.5) * (1 - ss(0.005, 0.02, fw));
    const c = m.col;
    set(S, [c[0] * (0.95 + 0.1 * hc), c[1] * (0.97 + 0.06 * hb), c[2] * (1.04 - 0.08 * hc)], (0.7 + 0.5 * hb) * grain * (1 - 0.55 * jk));
    S.ro = 0.55;
    // standing water: low ground (broad noise), and always in the joints
    const low = fbm(x * 0.16 + 3, z * 0.22, 5, s + 4) + (m.slope ? -m.slope * Math.abs(x) : 0) - (m.puddle ?? 0.56);
    const pud = ss(-0.015, 0.02, low);
    S.wet = cl(Math.max((m.wet ?? 0.55) * (0.8 + 0.4 * hc), pud, jk * 0.9));
    // the stone's own tilt and a rounded edge
    let gu = (h2(col, row, s + 5) - 0.5) * 0.06, gv = (h2(col, row, s + 6) - 0.5) * 0.06;
    const bv = 0.025;
    if (eu < jw + bv) gu += (fu < a / 2 ? -1 : 1) * 0.5 * (1 - cl((eu - jw) / bv));
    if (ev < jw + bv) gv += (fv < b / 2 ? -1 : 1) * 0.5 * (1 - cl((ev - jw) / bv));
    face(x, y, z, nx, ny, nz); bend(S, -gu * (1 - pud), -gv * (1 - pud));
    // rain rings on the water: a fine ripple on the film's normal (gone where a pixel is wider than a ripple)
    const rp = 0.0035 * (0.3 + 0.7 * pud) * (1 - ss(0.006, 0.02, fw)), ee = 0.01, r0 = vn(x * 26, z * 26, s + 7);
    // and a slow swell, which a pixel always resolves
    const sw0 = fbm(x * 1.7, z * 1.7, 3, s + 8), swk = 0.018 * (0.4 + 0.6 * pud);
    let wx = -(vn((x + ee) * 26, z * 26, s + 7) - r0) / ee * rp + gu * 0.15 * (1 - pud) - (fbm((x + ee) * 1.7, z * 1.7, 3, s + 8) - sw0) / ee * swk;
    let wz = -(vn(x * 26, (z + ee) * 26, s + 7) - r0) / ee * rp + gv * 0.15 * (1 - pud) - (fbm(x * 1.7, (z + ee) * 1.7, 3, s + 8) - sw0) / ee * swk;
    const l = Math.hypot(wx, 1, wz); S.wx = wx / l; S.wy = 1 / l; S.wz = wz / l;
  },

  // asphalt: aggregate, tar-sealed cracks, patches, standing water
  asphalt(m, x, y, z, nx, ny, nz, fw, S) {
    const s = m.seed;
    const ag = 0.8 + 0.4 * fbm(x * 14, z * 14, 3, s, fw * 14) + 0.14 * (vn(x * 90, z * 90, s + 1) - 0.5) * (1 - ss(0.003, 0.012, fw));
    const pt = fbm(x * 0.09, z * 0.09, 3, s + 2), patch = ss(0.6, 0.62, pt);
    const cr = Math.abs(fbm(x * 0.35, z * 0.35, 4, s + 3) - 0.5), crack = 1 - ss(0.004, 0.01 + fw * 0.5, cr);
    set(S, m.col, ag * (1 - 0.25 * patch) * (1 - 0.6 * crack));
    let paint = 0;
    if (m.lane != null) { const d = Math.abs(x - m.lane); paint = (1 - ss(0.06, 0.06 + fw, d)) * ss(0.35, 0.55, fbm(x * 3, z * 0.8, 3, s + 9)) * (((z / 3) % 2 + 2) % 2 < 1.2 ? 1 : 0); }
    if (m.stop) { const st = m.stop; if (x > st.x0 && x < st.x1) paint = Math.max(paint, (1 - ss(st.w, st.w + fw, Math.abs(z - st.z))) * ss(0.3, 0.5, fbm(x * 2, z * 4, 3, s + 10))); }
    if (paint > 0) { S.ar += (0.55 - S.ar) * paint; S.ag += (0.52 - S.ag) * paint; S.ab += (0.42 - S.ab) * paint; }
    S.ro = 0.7;
    const low = fbm(x * 0.13 + 5, z * 0.17, 5, s + 4) - (m.puddle ?? 0.58);
    const pud = ss(-0.012, 0.015, low);
    S.wet = cl(Math.max(m.wet ?? 0.5, pud));
    face(x, y, z, nx, ny, nz);
    const e = 0.01, b0 = fbm(x * 14, z * 14, 3, s, fw * 14);
    bend(S, -(fbm((x + e) * 14, z * 14, 3, s, fw * 14) - b0) / e * 0.004 * (1 - pud), -(fbm(x * 14, (z + e) * 14, 3, s, fw * 14) - b0) / e * 0.004 * (1 - pud));
    const rp = 0.003 * (0.3 + 0.7 * pud), r0 = vn(x * 24, z * 24, s + 7);
    let wx = -(vn((x + e) * 24, z * 24, s + 7) - r0) / e * rp, wz = -(vn(x * 24, (z + e) * 24, s + 7) - r0) / e * rp;
    const l = Math.hypot(wx, 1, wz); S.wx = wx / l; S.wy = 1 / l; S.wz = wz / l;
  },

  // cast concrete: board lines, tie holes, stains
  concrete(m, x, y, z, nx, ny, nz, fw, S) {
    const f = face(x, y, z, nx, ny, nz), s = m.seed;
    const g = 0.85 + 0.3 * fbm(f.U * 3, f.V * 3, 5, s, fw * 3);
    const lift = m.lift ?? 1.2, lv = ((f.V % lift) + lift) % lift, line = 1 - ss(0.004, 0.006 + fw, Math.min(lv, lift - lv));
    const tu = ((f.U % 0.6) + 0.6) % 0.6 - 0.3, tv = ((f.V % 0.6) + 0.6) % 0.6 - 0.3, tie = 1 - ss(0.012, 0.014 + fw, Math.hypot(tu, tv));
    const st = ss(0.5, 0.8, fbm(f.U * 1.2, f.V * 0.12, 4, s + 3, fw)) * (m.streak ?? 0.6);
    const damp = 1 - ss(0, 0.7, y - (m.base ?? 0));
    set(S, m.col, g * (1 - 0.35 * line) * (1 - 0.6 * tie) * (1 - 0.4 * st) * (1 - 0.35 * damp));
    S.ro = 0.8; S.wet = cl((m.wet ?? 0.15) + 0.4 * damp + 0.2 * st);
  },

  // painted steel sheet: seams, rust, grime
  panel(m, x, y, z, nx, ny, nz, fw, S) {
    const f = face(x, y, z, nx, ny, nz), s = m.seed, pw = m.pw ?? 1.0;
    const pu = ((f.U % pw) + pw) % pw, seam = 1 - ss(0.006, 0.01 + fw, Math.min(pu, pw - pu));
    const rust = ss(0.62, 0.75, fbm(f.U * 2, f.V * 2, 5, s, fw * 2) + 0.25 * (1 - ss(0, 0.5, y - (m.base ?? 0))));
    const streak = ss(0.55, 0.75, fbm(f.U * 4, f.V * 0.2, 3, s + 2, fw)) * 0.5;
    set(S, m.col, (0.9 + 0.2 * fbm(f.U * 5, f.V * 5, 3, s + 1, fw * 5)) * (1 - 0.5 * seam) * (1 - 0.3 * streak));
    if (rust > 0) { S.ar += (0.16 - S.ar) * rust; S.ag += (0.07 - S.ag) * rust; S.ab += (0.035 - S.ab) * rust; }
    S.ro = 0.55 + 0.3 * rust; S.wet = m.wet ?? 0.25;
    bend(S, seam * (pu < pw / 2 ? 0.3 : -0.3), 0);
  },

  // ISO container: vertical corrugation on the sides, door bars at one end,
  // corner posts and rails in bare steel, the paint faded and rusting, a code
  corr(m, x, y, z, nx, ny, nz, fw, S, i, B) {
    const f = face(x, y, z, nx, ny, nz), s = m.seed, b = i * 6;
    const x0 = B[b], y0 = B[b + 1], z0 = B[b + 2], x1 = B[b + 3], y1 = B[b + 4], z1 = B[b + 5];
    const lx = x1 - x0, lz = z1 - z0, longX = lx > lz;
    const end = Math.abs(ny) < 0.7 && (longX ? Math.abs(nx) > 0.7 : Math.abs(nz) > 0.7);
    const u0 = Math.abs(nx) > Math.abs(nz) ? z0 : x0, u1 = Math.abs(nx) > Math.abs(nz) ? z1 : x1;
    const eu = Math.min(f.U - u0, u1 - f.U), ev = Math.min(y - y0, y1 - y);
    const c = m.col, fade = 0.85 + 0.25 * ss(y0, y1, y);
    set(S, c, fade * (0.9 + 0.2 * fbm(f.U * 3, f.V * 3, 4, s, fw * 3)));
    let gu = 0;
    if (Math.abs(ny) > 0.7) { S.ro = 0.6; S.wet = 0.4; }
    else if (!end || (m.doors && ((longX ? (nx > 0) : (nz > 0)) !== (m.doors < 0)))) {
      if (!end) {
        // trapezoid ribs: 0.28 m pitch, the faces sloping in and out
        const pitch = 0.278, p = (((f.U - u0) / pitch) % 1 + 1) % 1, kk = 1 - ss(pitch * 0.15, pitch * 0.4, fw);
        gu = (p < 0.12 ? 0.9 : p < 0.38 ? 0 : p < 0.62 ? -0.9 : 0) * kk;
        const sh = p < 0.12 ? 0.92 : p < 0.38 ? 1.02 : p < 0.62 ? 0.88 : 0.98; mul(S, 1 - (1 - sh) * kk);
      } else {
        // the doors: two leaves, four locking bars, hinges
        const w = u1 - u0, du = f.U - u0, bars = [0.18, 0.38, 0.62, 0.82];
        for (const bp of bars) { const d = Math.abs(du - bp * w); if (d < 0.025 + fw) { gu = (du < bp * w ? 0.8 : -0.8) * (1 - ss(0.015, 0.025 + fw, d)); mul(S, 0.75); } }
        if (Math.abs(du - w / 2) < 0.006 + fw) mul(S, 0.3);
      }
      S.ro = 0.55; S.wet = 0.3;
    }
    // corner posts and rails: bare, dark, rusted
    const frame = Math.max(1 - ss(0.1, 0.12 + fw, eu), 1 - ss(0.12, 0.14 + fw, ev));
    if (frame > 0) { const k = frame; S.ar += (0.07 - S.ar) * k; S.ag += (0.055 - S.ag) * k; S.ab += (0.045 - S.ab) * k; gu *= 1 - k; }
    // rust: blooms near the rails and bleeding down from the top rail
    const rb = fbm(f.U * 2.5, y * 2.5, 5, s + 3, fw * 2.5), near = Math.max(1 - ss(0, 0.5, y - y0), 1 - ss(0, 0.35, y1 - y) * 0.8);
    const bleed = ss(0.55, 0.75, fbm(f.U * 5, y * 0.25, 3, s + 4, fw)) * ss(0, 1.5, y1 - y) * (1 - ss(1.0, 2.4, y1 - y));
    const rust = cl(ss(0.55, 0.72, rb + near * 0.25) * (m.rust ?? 0.8) + bleed * 0.7 * (m.rust ?? 0.8));
    if (rust > 0) { S.ar += (0.13 - S.ar) * rust; S.ag += (0.055 - S.ag) * rust; S.ab += (0.03 - S.ab) * rust; S.ro = Math.max(S.ro, 0.8 * rust); }
    // the code: a line of white letters near the top right of each side
    if (!end && Math.abs(ny) < 0.7 && m.code !== false) {
      const cu = u1 - 0.35 - (f.U - u0) * 0 - f.U, cv = y1 - 0.42 - y;
      if (cu > 0 && cu < 1.6 && cv > 0 && cv < 0.12) {
        const ch = Math.floor(cu / 0.1), gx = Math.floor((cu % 0.1) / 0.016), gy = Math.floor(cv / 0.017);
        if (gx < 5 && h2(ch * 7 + gx, gy, s + 11) > 0.5 && ch !== 4 && ch !== 11) { const k = 1 - ss(0.002, 0.02, fw); S.ar += (0.6 - S.ar) * k; S.ag += (0.6 - S.ag) * k; S.ab += (0.58 - S.ab) * k; }
      }
    }
    if (gu) bend(S, gu, 0);
  },

  // cloth hanging: folds down its length, wet, the mark printed on it
  cloth(m, x, y, z, nx, ny, nz, fw, S, i, B) {
    const f = face(x, y, z, nx, ny, nz), s = m.seed, b = i * 6;
    const u0 = Math.abs(nx) > Math.abs(nz) ? B[b + 2] : B[b], u1 = Math.abs(nx) > Math.abs(nz) ? B[b + 5] : B[b + 3];
    const w = u1 - u0, lu = (f.U - u0) / w, top = B[b + 4], len = top - B[b + 1], lv = (top - y) / len;
    // folds: a few broad ones, the cloth pulled tight at the top where it hangs
    const ph = fbm(lu * 2, lv * 0.6, 2, s) * 4;
    const fold = Math.sin(lu * Math.PI * 2 * (m.folds ?? 3.2) + ph), amp = (0.25 + 0.75 * ss(0, 0.25, lv)) * 0.45;
    set(S, m.col, (0.75 + 0.25 * fold) * (0.9 + 0.2 * fbm(f.U * 20, f.V * 20, 2, s + 1, fw * 20)));
    // the hem and the edge, sewn darker
    const hem = Math.max(1 - ss(0.02, 0.03 + fw / w, Math.min(lu, 1 - lu)), 1 - ss(0.02, 0.03 + fw / len, 1 - lv));
    mul(S, 1 - 0.35 * hem);
    // the mark: a ring cut by a chevron, a third of the way down
    if (m.mark) {
      const cx = (lu - 0.5) * w, cy = (lv - 0.36) * len, r = w * 0.3, d = Math.hypot(cx, cy), ring = 1 - ss(w * 0.035, w * 0.035 + fw, Math.abs(d - r));
      const chev = 1 - ss(w * 0.03, w * 0.03 + fw, Math.abs(cy + r * 0.1 - (r * 0.55 - Math.abs(cx) * 0.9)) * 0.75) ; const inCh = Math.abs(cx) < r * 0.62 ? chev : 0;
      const mk = Math.max(ring, inCh);
      if (mk > 0) { const mc = m.mark; S.ar += (mc[0] - S.ar) * mk; S.ag += (mc[1] - S.ag) * mk; S.ab += (mc[2] - S.ab) * mk; }
    }
    S.ro = 0.92; S.wet = m.wet ?? 0.3;
    bend(S, Math.cos(lu * Math.PI * 2 * (m.folds ?? 3.2) + ph) * amp, 0);
  },

  // a dark window: glass that mirrors, a frame and glazing bars
  glass(m, x, y, z, nx, ny, nz, fw, S, i, B) {
    const f = face(x, y, z, nx, ny, nz), b = i * 6;
    const u0 = Math.abs(nx) > Math.abs(nz) ? B[b + 2] : B[b], u1 = Math.abs(nx) > Math.abs(nz) ? B[b + 5] : B[b + 3];
    const lu = (f.U - u0) / (u1 - u0), lv = (y - B[b + 1]) / (B[b + 4] - B[b + 1]);
    const w = u1 - u0, h = B[b + 4] - B[b + 1], [pu, pv] = m.panes || [2, 3], fr = m.frame ?? 0.05;
    const du = Math.min(lu * w, (1 - lu) * w), dv = Math.min(lv * h, (1 - lv) * h);
    const gu = ((lu * pu) % 1), gv = ((lv * pv) % 1), bar = Math.min(Math.min(gu, 1 - gu) * w / pu, Math.min(gv, 1 - gv) * h / pv);
    const isFrame = du < fr || dv < fr || bar < 0.02;
    if (isFrame) { set(S, m.fcol || [0.05, 0.045, 0.04]); S.ro = 0.6; S.wet = 0.2; return; }
    set(S, [0.006, 0.006, 0.007]); S.ro = 0.1; S.glass = 1;
    // old glass is never flat: a slow wave in the reflection
    const e = 0.02, w0 = vn(f.U * 3, f.V * 2, m.seed);
    S.wx = nx - (vn((f.U + e) * 3, f.V * 2, m.seed) - w0) / e * 0.012 * F.tx; S.wz = nz - (vn((f.U + e) * 3, f.V * 2, m.seed) - w0) / e * 0.012 * F.tz; S.wy = ny;
    const l = Math.hypot(S.wx, S.wy, S.wz); S.wx /= l; S.wy /= l; S.wz /= l;
  },

  // a lit window: a room behind the glass (the ceiling lamp, the walls, blinds half down)
  window(m, x, y, z, nx, ny, nz, fw, S, i, B) {
    const f = face(x, y, z, nx, ny, nz), b = i * 6;
    const u0 = Math.abs(nx) > Math.abs(nz) ? B[b + 2] : B[b], u1 = Math.abs(nx) > Math.abs(nz) ? B[b + 5] : B[b + 3];
    const lu = (f.U - u0) / (u1 - u0), lv = (y - B[b + 1]) / (B[b + 4] - B[b + 1]);
    const w = u1 - u0, h = B[b + 4] - B[b + 1], [pu, pv] = m.panes || [2, 3], fr = m.frame ?? 0.05;
    const du = Math.min(lu * w, (1 - lu) * w), dv = Math.min(lv * h, (1 - lv) * h);
    const gu = ((lu * pu) % 1), gv = ((lv * pv) % 1), bar = Math.min(Math.min(gu, 1 - gu) * w / pu, Math.min(gv, 1 - gv) * h / pv);
    if (du < fr || dv < fr || bar < 0.02) { set(S, [0.05, 0.04, 0.03]); S.ro = 0.6; S.wet = 0.2; return; }
    set(S, [0, 0, 0]); S.ro = 0.1; S.glass = 0.35;
    // the room: brighter toward the ceiling lamp, a wall darker to one side, the blinds' slats
    const lamp = Math.exp(-((lu - (m.lampU ?? 0.55)) ** 2) * 6 - ((lv - 0.95) ** 2) * 5);
    let k = (0.35 + 0.65 * lamp) * (0.75 + 0.25 * lu);
    const bl = m.blinds ?? 0.35;
    if (1 - lv < bl) { const sl = ((1 - lv) * h / 0.05) % 1; k *= sl < 0.6 ? 0.5 + 0.4 * sl : 0.25; }
    const e = m.e || [3, 1.7, 0.8];
    S.er = e[0] * k; S.eg = e[1] * k; S.eb = e[2] * k;
  },

  // a pair of bronze doors: raised panels, a rail across, the leaves' meeting line, verdigris low down
  door(m, x, y, z, nx, ny, nz, fw, S, i, B) {
    const f = face(x, y, z, nx, ny, nz), b = i * 6;
    const u0 = B[b], u1 = B[b + 3], w = u1 - u0, lu = (f.U - u0) / w, h = B[b + 4] - B[b + 1], lv = (y - B[b + 1]) / h;
    const leaf = lu < 0.5 ? lu * 2 : (lu - 0.5) * 2;
    set(S, m.col, 0.85 + 0.3 * fbm(f.U * 6, f.V * 6, 3, m.seed, fw * 6));
    S.metal = m.metal; S.ro = m.ro; S.wet = m.wet;
    // panels: two across each leaf, three up; a raised field inside a sunk border
    const pu = (leaf * 2) % 1, pv = (lv * 3) % 1, eu = Math.min(pu, 1 - pu) * w / 4, ev = Math.min(pv, 1 - pv) * h / 3;
    const e = Math.min(eu, ev), bord = 0.07, bev = 0.025;
    let gu = 0, gv = 0;
    if (e < bord) { mul(S, 0.7); if (e > bord - bev) { if (eu < ev) gu = (pu < 0.5 ? 1 : -1) * 0.7; else gv = (pv < 0.5 ? 1 : -1) * 0.7; } }
    if (Math.abs(lu - 0.5) * w < 0.012 + fw) mul(S, 0.25);
    // green where the rain runs off the step
    const vg = ss(0.25, 0, lv) * ss(0.45, 0.7, fbm(f.U * 3, y * 3, 3, m.seed + 2));
    if (vg > 0) { S.metal *= 1 - vg; S.ar += (0.05 - S.ar) * vg; S.ag += (0.09 - S.ag) * vg; S.ab += (0.07 - S.ab) * vg; S.ro = Math.max(S.ro, 0.8 * vg); }
    bend(S, gu, gv);
  },

  // a barrier pole: red and white bands along x, scuffed, the white gone grey
  stripes(m, x, y, z, nx, ny, nz, fw, S, i, B) {
    const b = i * 6, u = x - B[b], band = Math.floor(u / (m.band ?? 0.5)) & 1;
    const dirt = 0.75 + 0.25 * fbm(x * 6, y * 30 + z * 30, 3, m.seed, fw * 6);
    set(S, band ? [0.42, 0.4, 0.37] : [0.3, 0.025, 0.02], dirt);
    S.ro = 0.4; S.wet = 0.4;
  },

  // plaster over brick: a faded colour, patched, stained down from each sill,
  // dirt rising from the street, a band of grime under the cornice
  plaster(m, x, y, z, nx, ny, nz, fw, S, i, B) {
    const f = face(x, y, z, nx, ny, nz), s = m.seed;
    const c = m.col, big = fbm(f.U * 0.35, f.V * 0.35, 4, s, fw * 0.35), fine = fbm(f.U * 9, f.V * 9, 3, s + 1, fw * 9);
    set(S, c, (0.82 + 0.3 * big) * (0.93 + 0.14 * fine));
    // patches where it fell off and was redone in a different grey
    const pt = ss(0.64, 0.66, fbm(f.U * 0.6 + 9, f.V * 0.6, 4, s + 2, fw * 0.6));
    if (pt > 0) { S.ar += (0.3 - S.ar) * pt * 0.7; S.ag += (0.29 - S.ag) * pt * 0.7; S.ab += (0.28 - S.ab) * pt * 0.7; }
    const st = ss(0.52, 0.78, fbm(f.U * 2.2 + 31, f.V * 0.12, 4, s + 6, fw)) * (m.streak ?? 0.6);
    const damp = 1 - ss(0, 1.1, y - fbm(f.U * 1.3, 0.5, 3, s + 8) * 0.6);
    mul(S, (1 - 0.35 * st) * (1 - 0.45 * damp));
    S.ro = 0.85; S.wet = cl((m.wet ?? 0.1) + 0.4 * damp + 0.2 * st);
    const e = 0.02, r0 = fine; bend(S, -(fbm((f.U + e) * 9, f.V * 9, 3, s + 1, fw * 9) - r0) / e * 0.01, -(fbm(f.U * 9, (f.V + e) * 9, 3, s + 1, fw * 9) - r0) / e * 0.01);
  },

  // a roller shutter: galvanised slats across, a colour once, the bottom bar
  shutter(m, x, y, z, nx, ny, nz, fw, S, i, B) {
    const f = face(x, y, z, nx, ny, nz), b = i * 6, s = m.seed;
    const p = ((y / 0.075) % 1 + 1) % 1, k = 1 - ss(0.02, 0.06, fw);
    set(S, m.col, (0.85 + 0.25 * fbm(f.U * 3, y * 3, 3, s, fw * 3)) * (1 - 0.25 * k * (p < 0.15 ? 1 : 0)));
    const bot = y - B[b + 1] < 0.06;
    if (bot) set(S, [0.06, 0.06, 0.06]);
    const rust = ss(0.6, 0.75, fbm(f.U * 2, y * 2, 4, s + 3, fw * 2) + 0.25 * (1 - ss(0, 0.6, y - B[b + 1])));
    if (rust > 0) { S.ar += (0.13 - S.ar) * rust; S.ag += (0.06 - S.ag) * rust; S.ab += (0.03 - S.ab) * rust; }
    S.metal = 0.3 * (1 - rust); S.ro = 0.5 + 0.3 * rust; S.wet = 0.25;
    bend(S, 0, (p < 0.15 ? 0.6 : p > 0.85 ? -0.4 : 0) * k);
  },

  // a crate of wood slats; on top, whatever it holds (fruit: small round things, each lit as a ball)
  crate(m, x, y, z, nx, ny, nz, fw, S, i, B) {
    const f = face(x, y, z, nx, ny, nz), b = i * 6, s = m.seed + i;
    if (ny > 0.7 && m.fruit) {
      const r = 0.036, cs = 0.075, cu = Math.floor(x / cs), cv = Math.floor(z / cs);
      const ox = (cu + 0.5 + (h2(cu, cv, s) - 0.5) * 0.3) * cs, oz = (cv + 0.5 + (h2(cu, cv, s + 1) - 0.5) * 0.3) * cs;
      const dx = (x - ox) / r, dz = (z - oz) / r, d2 = dx * dx + dz * dz;
      if (d2 < 1) {
        const c = m.fruit, v = 0.8 + 0.4 * h2(cu, cv, s + 2);
        set(S, c, v); S.ro = 0.35; S.wet = 0.35;
        const w = Math.sqrt(1 - d2); S.nx = dx; S.ny = w; S.nz = dz; const l = Math.hypot(dx, w, dz); S.nx /= l; S.ny /= l; S.nz /= l;
        return;
      }
      set(S, [0.02, 0.018, 0.015]); S.ro = 0.9; S.ao = 0.3; return;
    }
    // slats: 0.09 m boards with gaps, end posts darker
    const sl = ((f.V - B[b + 1]) / 0.09) % 1, gap = sl > 0.82 ? 1 : 0;
    set(S, m.col, (0.75 + 0.35 * fbm(f.U * 12, f.V * 2, 3, s, fw * 12)) * (gap ? 0.25 : 1));
    S.ro = 0.85; S.wet = 0.3;
    if (!gap) bend(S, 0, sl < 0.1 ? 0.5 : sl > 0.72 ? -0.5 : 0);
  },

  // a plastic tarp: a colour (or stripes), shiny when wet, sagging between its
  // frame (its surface given by the stall: X0..X1, Z0..Z1, front and back
  // heights, the sag), creased, water standing in the low middle
  tarp(m, x, y, z, nx, ny, nz, fw, S, i, B) {
    const s = m.seed, u = (x - m.X0) / (m.X1 - m.X0), v = (z - m.Z0) / (m.Z1 - m.Z0), pi = Math.PI;
    const st = m.stripes ? (Math.floor((x - m.X0) / m.stripes) & 1) : 0;
    const crease = fbm(x * 5, z * 5, 3, s + 4, fw * 5);
    set(S, st ? m.col2 : m.col, (0.85 + 0.25 * fbm(x * 4, z * 4, 3, s, fw * 4)) * (0.92 + 0.16 * crease));
    S.ro = 0.35; S.wet = 0.5;
    // the smooth surface's slope, and creases on it
    const dhx = -m.sag * pi * Math.cos(pi * u) * Math.sin(pi * v) / (m.X1 - m.X0), dhz = (m.yB - m.yF) / (m.Z1 - m.Z0) - m.sag * pi * Math.sin(pi * u) * Math.cos(pi * v) / (m.Z1 - m.Z0);
    const e = 0.01, cx = (fbm((x + e) * 5, z * 5, 3, s + 4, fw * 5) - crease) / e * 0.05, cz = (fbm(x * 5, (z + e) * 5, 3, s + 4, fw * 5) - crease) / e * 0.05;
    const sg = ny >= 0 ? 1 : -1;
    let ax = -(dhx + cx) * sg, ay = sg, az = -(dhz + cz) * sg; const l = Math.hypot(ax, ay, az); S.nx = ax / l; S.ny = ay / l; S.nz = az / l;
    const pool = Math.sin(pi * u) * Math.sin(pi * v);
    // a little water lies in the lowest middle; its edge wanders
    const pw = ny > 0 ? ss(0.8, 0.97, pool + (fbm(x * 6, z * 6, 3, s + 9) - 0.5) * 0.25) : 0;
    if (pw > 0) { S.wet = 0.5 + 0.4 * pw; mul(S, 1 - 0.45 * pw); S.wx = S.nx * (1 - pw); S.wy = S.ny * (1 - pw) + pw; S.wz = S.nz * (1 - pw); const wl = Math.hypot(S.wx, S.wy, S.wz); S.wx /= wl; S.wy /= wl; S.wz /= wl; }
    // seen from under it, the daylight comes through, coloured
    if (ny < 0) { S.er = S.ar * (m.glow ?? 0.12); S.eg = S.ag * (m.glow ?? 0.12); S.eb = S.ab * (m.glow ?? 0.12); S.wet = 0.1; }
  },

  // painted or bare metal
  metal(m, x, y, z, nx, ny, nz, fw, S) {
    const f = face(x, y, z, nx, ny, nz);
    set(S, m.col, 0.85 + 0.3 * fbm(f.U * 8, f.V * 8, 3, m.seed, fw * 8));
    S.metal = m.metal ?? 0; S.ro = m.ro ?? 0.45; S.wet = m.wet ?? 0.3;
  },
};
