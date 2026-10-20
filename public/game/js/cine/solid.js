// KOR — cinematics: small solids lit by one lamp (§5.8): capsules, boxes,
// and cylinders, each shaded by the cosine to the lamp and falling off
// with distance; and the same shapes thrown as shadows onto a plane.
import { clamp } from './noise.js';

const TAU = Math.PI * 2;
export const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k],
};
const { add, sub, mul, dot, cross, norm } = v3;

// the light at a point with normal n: lamp { p, I, axis?, cos0, cos1 } + ambient
export function lit(lamp, p, n, amb = 0.04) {
  const l = sub(lamp.p, p), d2 = dot(l, l), d = Math.sqrt(d2), ndl = Math.max(0, dot(n, l) / d);
  let cone = 1;
  if (lamp.axis) { const ca = -dot(l, lamp.axis) / d; cone = clamp((ca - lamp.cos0) / (lamp.cos1 - lamp.cos0)); cone *= cone; }
  return amb + lamp.I * ndl * cone / (d2 + 0.1);
}
// a colour [r,g,b] 0..255 under a light level (warm lamp: kw)
// (a soft shoulder so a hot spot does not clip flat)
export function tone(col, v, kw = [1, 0.72, 0.45]) { const e = (c, k) => 255 * (1 - Math.exp(-(c / 255) * v * k * 2.4)); return `rgb(${e(col[0], kw[0]) | 0},${e(col[1], kw[1]) | 0},${e(col[2], kw[2]) | 0})`; }

// a tapered cylinder with round ends, shaded across its width
export function capsule3(g, cam, a, b, ra, rb, lamp, col, amb = 0.04, opts = {}) {
  const A = cam.project(a[0], a[1], a[2]), B = cam.project(b[0], b[1], b[2]);
  if (A[2] <= 0 || B[2] <= 0) return;
  const d = norm(sub(b, a)), mid = v3.lerp(a, b, 0.5), view = norm(sub(mid, cam._p || cam.pos));
  let s = cross(d, view); if (Math.hypot(...s) < 1e-4) s = [1, 0, 0]; s = norm(s);
  const fwd = norm(cross(s, d)); // toward the camera side of the surface, roughly −view
  const towardCam = dot(fwd, view) > 0 ? mul(fwd, -1) : fwd;
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const r0 = ra * A[3], r1 = rb * B[3];
  // which screen side is +s
  const sp = cam.project(...add(mid, mul(s, 0.01))), mp = cam.project(...mid), sgn = Math.sign((sp[0] - mp[0]) * nx + (sp[1] - mp[1]) * ny) || 1;
  const gr = g.createLinearGradient(mp[0] - nx * (r0 + r1) / 2, mp[1] - ny * (r0 + r1) / 2, mp[0] + nx * (r0 + r1) / 2, mp[1] + ny * (r0 + r1) / 2);
  for (let i = 0; i <= 6; i++) {
    const th = -Math.PI / 2 + (i / 6) * Math.PI, n = norm(add(mul(towardCam, Math.cos(th)), mul(s, Math.sin(th) * -sgn)));
    gr.addColorStop(i / 6, tone(col, lit(lamp, add(mid, mul(n, (ra + rb) / 2)), n, amb)));
  }
  g.fillStyle = gr; g.beginPath();
  g.moveTo(A[0] + nx * r0, A[1] + ny * r0); g.lineTo(B[0] + nx * r1, B[1] + ny * r1); g.lineTo(B[0] - nx * r1, B[1] - ny * r1); g.lineTo(A[0] - nx * r0, A[1] - ny * r0);
  g.closePath(); g.fill();
  g.beginPath(); g.arc(A[0], A[1], Math.max(0.3, r0), 0, TAU); g.fill();
  g.beginPath(); g.arc(B[0], B[1], Math.max(0.3, r1), 0, TAU); g.fill();
  // cloth: creases across the sleeve, darker on the shadow side
  if (opts.folds) {
    const n = opts.folds, rs = opts.seed || 1;
    for (let i = 0; i < n; i++) {
      const k = ((Math.sin(rs * 12.9898 + i * 78.233) * 43758.5453) % 1 + 1) % 1, c = [A[0] + dx * (0.15 + k * 0.7), A[1] + dy * (0.15 + k * 0.7)], r = (r0 + (r1 - r0) * k);
      const bend = (k - 0.5) * 0.6;
      g.strokeStyle = `rgba(0,0,0,${(0.18 + k * 0.12).toFixed(2)})`; g.lineWidth = Math.max(0.6, r * 0.12);
      g.beginPath(); g.moveTo(c[0] - nx * r * 0.9, c[1] - ny * r * 0.9); g.quadraticCurveTo(c[0] + dx / L * r * bend, c[1] + dy / L * r * bend, c[0] + nx * r * 0.85, c[1] + ny * r * 0.85); g.stroke();
    }
  }
}
// a box: centre c, half-axes X Y Z (vectors); each face we can see, shaded flat
export function box3(g, cam, c, X, Y, Z, lamp, col, amb = 0.04, faceCols = null) {
  const P = (p) => cam.project(p[0], p[1], p[2]);
  const eye = cam._p || cam.pos;
  for (const [n0, u, v, k] of [[X, Y, Z, 0], [mul(X, -1), Y, Z, 1], [Y, X, Z, 2], [mul(Y, -1), X, Z, 3], [Z, X, Y, 4], [mul(Z, -1), X, Y, 5]]) {
    const fc = add(c, n0), n = norm(n0);
    if (dot(n, sub(eye, fc)) <= 0) continue;
    const q = [add(add(fc, u), v), add(sub(fc, u), v), sub(sub(fc, u), v), sub(add(fc, u), v)].map(P);
    if (q.some((p) => p[2] <= 0)) continue;
    g.fillStyle = tone(faceCols ? faceCols[k] || col : col, lit(lamp, fc, n, amb));
    g.beginPath(); q.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
  }
}
// an upright cylinder (mugs): side shaded across, the top as an ellipse
export function cyl3(g, cam, base, r, h, lamp, col, top = null, amb = 0.04) {
  capsule3(g, cam, base, add(base, [0, h, 0]), r, r, lamp, col, amb);
  const T = cam.project(base[0], base[1] + h, base[2]), B = cam.project(base[0], base[1], base[2]);
  const ry = Math.abs(cam.project(base[0], base[1] + h, base[2] + r)[1] - T[1]);
  g.fillStyle = tone(top || col, lit(lamp, add(base, [0, h, 0]), [0, 1, 0], amb));
  g.beginPath(); g.ellipse(T[0], T[1], r * T[3], Math.max(0.5, ry), 0, 0, TAU); g.fill();
  return { T, B, ry };
}

// points that stand for a shape, for its shadow
export function capsulePts(a, b, ra, rb) {
  const d = norm(sub(b, a)), u = norm(Math.abs(d[1]) < 0.9 ? cross(d, [0, 1, 0]) : cross(d, [1, 0, 0])), w = cross(d, u), o = [];
  for (let i = 0; i < 8; i++) { const t = (i / 8) * TAU; for (const [c, r] of [[a, ra], [b, rb]]) o.push(add(c, add(mul(u, Math.cos(t) * r), mul(w, Math.sin(t) * r)))); }
  o.push(add(a, mul(d, -ra)), add(b, mul(d, rb)));
  return o;
}
export function boxPts(c, X, Y, Z) { const o = []; for (const a of [-1, 1]) for (const b of [-1, 1]) for (const e of [-1, 1]) o.push(add(c, add(mul(X, a), add(mul(Y, b), mul(Z, e))))); return o; }
// throw a point cloud from the lamp onto the plane y = y0, fill its outline
export function shadow(g, cam, lampP, pts, y0, col = '#000') {
  const q = [];
  for (const p of pts) {
    const dy = p[1] - lampP[1]; if (dy > -1e-3) continue;
    const k = (y0 - lampP[1]) / dy; if (k < 1) continue;
    const s = [lampP[0] + (p[0] - lampP[0]) * k, y0, lampP[2] + (p[2] - lampP[2]) * k], sp = cam.project(s[0], s[1], s[2]);
    if (sp[2] > 0) q.push([sp[0], sp[1]]);
  }
  if (q.length < 3) return;
  q.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of q) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = q.length - 1; i >= 0; i--) { const p = q[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  const h = lo.slice(0, -1).concat(up.slice(0, -1));
  g.fillStyle = col; g.beginPath(); h.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
}
