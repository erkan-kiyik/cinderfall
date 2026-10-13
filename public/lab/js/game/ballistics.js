// CINDERFALL LAB — ballistics: rays through the tile level and against
// character hit shapes.
//
// Bullets are hitscan. A ray walks the tile grid cell by cell (DDA); solid
// tiles stop it at their face, slope tiles at their diagonal, one-way decks
// and ladders let it through. Characters are sets of capsules built from the
// live skeleton, so what you see is what you hit.
import { T, SOLID, SLOPE_R, SLOPE_L } from '../phys/level.js';

// Ray from (x0, y0) along unit (dx, dy) up to `max`. Returns the distance
// to the first blocking surface, with its normal in out.nx / out.ny, or max.
export function rayTiles(level, x0, y0, dx, dy, max, out) {
  let tx = level.tx(x0), ty = level.ty(y0);
  const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
  const ox = x0 - level.leftX, oy = y0 - level.topY;
  const tdx = dx !== 0 ? Math.abs(T / dx) : Infinity, tdy = dy !== 0 ? Math.abs(T / dy) : Infinity;
  let tmx = dx > 0 ? ((tx + 1) * T - ox) / dx : dx < 0 ? (tx * T - ox) / dx : Infinity;
  let tmy = dy > 0 ? ((ty + 1) * T - oy) / dy : dy < 0 ? (ty * T - oy) / dy : Infinity;
  let t = 0, nx = 0, ny = 0;
  for (let guard = 0; guard < 4096 && t <= max; guard++) {
    const k = ty >= 0 ? level.get(tx, ty) : 0; // open sky above row 0
    if (k === SOLID && (tx >= 0 && tx < level.w)) {
      out.nx = nx; out.ny = ny; return Math.max(0, t);
    }
    if (k === SLOPE_R || k === SLOPE_L) {
      // diagonal through the cell: SLOPE_R surface y = top + T − lx, SLOPE_L y = top + lx
      const left = level.left(tx), top = level.top(ty);
      const hit = slopeHit(x0, y0, dx, dy, left, top, k === SLOPE_R, t, Math.min(tmx, tmy));
      if (hit !== null) {
        const s = Math.SQRT1_2;
        out.nx = k === SLOPE_R ? -s : s; out.ny = -s; // '/' faces up-left
        // hitting the flat back side of a slope from inside the hill
        if (out.nx * dx + out.ny * dy > 0) { out.nx = nx; out.ny = ny; }
        return hit;
      }
    }
    if (tmx < tmy) { t = tmx; tmx += tdx; tx += sx; nx = -sx; ny = 0; }
    else { t = tmy; tmy += tdy; ty += sy; nx = 0; ny = -sy; }
  }
  out.nx = 0; out.ny = 0;
  return max;
}

// Ray against the solid half of a slope cell between ray params t0..t1.
function slopeHit(x0, y0, dx, dy, left, top, rising, t0, t1) {
  // inside test: below the diagonal
  const inside = (t) => {
    const x = x0 + dx * t - left, y = y0 + dy * t - top;
    return rising ? y >= T - x : y >= x;
  };
  if (inside(t0 + 1e-4)) return t0;
  // intersect with the line y = T − x (rising) or y = x
  // rising: (y0 + dy t − top) + (x0 + dx t − left) = T
  const den = rising ? dx + dy : dy - dx;
  if (Math.abs(den) < 1e-9) return null;
  const t = rising ? (T - (y0 - top) - (x0 - left)) / den : ((x0 - left) - (y0 - top)) / den;
  if (t < t0 - 1e-6 || t > t1 + 1e-6) return null;
  return Math.max(t, t0);
}

// Ray vs capsule (segment a–b, radius r): entry distance or -1.
export function rayCapsule(x0, y0, dx, dy, max, c) {
  // a capsule is two end circles plus the slab between them; the entry is
  // the nearest of the three
  const ux = c.x1 - c.x0, uy = c.y1 - c.y0, L2 = ux * ux + uy * uy;
  let best = -1;
  // test against the swept circle at both ends and the side slab
  const circle = (cx, cy) => {
    const fx = x0 - cx, fy = y0 - cy;
    const b = fx * dx + fy * dy, cc = fx * fx + fy * fy - c.r * c.r;
    if (cc <= 0) { best = 0; return; } // starts inside
    const disc = b * b - cc;
    if (disc < 0) return;
    const t = -b - Math.sqrt(disc);
    if (t >= 0 && t <= max && (best < 0 || t < best)) best = t;
  };
  circle(c.x0, c.y0);
  if (L2 > 1e-6) {
    circle(c.x1, c.y1);
    // slab: points within r of the infinite line, projected inside the segment
    const L = Math.sqrt(L2), ax = ux / L, ay = uy / L, nx = -ay, ny = ax;
    const d0 = (x0 - c.x0) * nx + (y0 - c.y0) * ny, dd = dx * nx + dy * ny;
    for (const side of [c.r, -c.r]) {
      if (Math.abs(dd) < 1e-9) continue;
      const t = (side - d0) / dd;
      if (t < 0 || t > max) continue;
      const px = x0 + dx * t - c.x0, py = y0 + dy * t - c.y0, along = px * ax + py * ay;
      if (along >= 0 && along <= L && (best < 0 || t < best)) best = t;
    }
    // starting inside the slab
    if (Math.abs(d0) <= c.r) {
      const along = (x0 - c.x0) * ax + (y0 - c.y0) * ay;
      if (along >= 0 && along <= L) best = 0;
    }
  }
  return best;
}

// Ray vs axis-aligned box: entry distance or -1.
export function rayBox(x0, y0, dx, dy, max, b) {
  let t0 = 0, t1 = max;
  for (const [o, d, lo, hi] of [[x0, dx, b.x0, b.x1], [y0, dy, b.y0, b.y1]]) {
    if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return -1; continue; }
    let a = (lo - o) / d, c = (hi - o) / d;
    if (a > c) { const s = a; a = c; c = s; }
    if (a > t0) t0 = a;
    if (c < t1) t1 = c;
    if (t0 > t1) return -1;
  }
  return t0;
}

// Damage after distance falloff: full until near, linear to `far`, then floor.
export function falloff(dmg, dist, [near, far, floor]) {
  if (dist <= near) return dmg;
  if (dist >= far) return dmg * floor;
  return dmg * (1 - (1 - floor) * (dist - near) / (far - near));
}
