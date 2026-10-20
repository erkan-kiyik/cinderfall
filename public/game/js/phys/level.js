// KOR — tile level and collision queries.
//
// The level is a grid of 8-unit tiles described by ASCII rows (top → bottom):
//   .  empty        #  solid        =  one-way platform (stand on top only)
//   H  ladder       /  slope rising to the right     \  slope rising to the left
// World y grows downward; `topY` is the world y of row 0. Street level is
// y = 0 in every level.

export const T = 8;
export const EMPTY = 0, SOLID = 1, ONEWAY = 2, LADDER = 3, SLOPE_R = 4, SLOPE_L = 5;
const CODES = { '.': EMPTY, ' ': EMPTY, '#': SOLID, '=': ONEWAY, H: LADDER, '/': SLOPE_R, '\\': SLOPE_L };

export class Level {
  constructor(rows, topY, leftX = 0) {
    this.h = rows.length; this.w = Math.max(...rows.map((r) => r.length));
    this.topY = topY; this.leftX = leftX;
    this.t = new Uint8Array(this.w * this.h);
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) this.t[y * this.w + x] = CODES[r[x]] ?? EMPTY; });
  }
  tx(x) { return Math.floor((x - this.leftX) / T); }
  ty(y) { return Math.floor((y - this.topY) / T); }
  get(tx, ty) {
    if (tx < 0 || tx >= this.w) return SOLID;          // side walls
    if (ty < 0) return EMPTY;                           // open sky
    if (ty >= this.h) return SOLID;                     // bedrock
    return this.t[ty * this.w + tx];
  }
  // change a tile at runtime (gates, breakable cover)
  set(tx, ty, k) { if (tx >= 0 && tx < this.w && ty >= 0 && ty < this.h) this.t[ty * this.w + tx] = k; }
  left(tx) { return this.leftX + tx * T; }
  top(ty) { return this.topY + ty * T; }

  // Walking surface of a slope tile at world x, or null.
  slopeY(tx, ty, x) {
    const k = this.get(tx, ty), lx = x - this.left(tx);
    if (lx < 0 || lx > T) return null;
    if (k === SLOPE_R) return this.top(ty) + T - lx;
    if (k === SLOPE_L) return this.top(ty) + lx;
    return null;
  }

  // Is any solid tile overlapped by the box [x0,x1)×[y0,y1)?
  solidBox(x0, y0, x1, y1) {
    const a = this.tx(x0), b = this.tx(x1 - 1e-4), c = this.ty(y0), d = this.ty(y1 - 1e-4);
    for (let ty = c; ty <= d; ty++) for (let tx = a; tx <= b; tx++) if (this.get(tx, ty) === SOLID) return true;
    return false;
  }

  // Highest walkable surface y in [yFrom, yTo] under the span [x0, x1]
  // (feet centre xc for slopes). One-way tops count unless `drop` is set, and
  // only at or below `oneWayFrom` (where the feet were). Returns null if none.
  surface(x0, x1, xc, yFrom, yTo, drop = false, oneWayFrom = yFrom) {
    let best = null;
    const a = this.tx(x0), b = this.tx(x1 - 1e-4), c = this.ty(yFrom), d = this.ty(yTo);
    for (let ty = c; ty <= d; ty++) {
      const top = this.top(ty);
      for (let tx = a; tx <= b; tx++) {
        const k = this.get(tx, ty);
        let s = null;
        if (k === SOLID) {
          // a solid tile under a slope counts only where no slope sits on it
          const above = this.get(tx, ty - 1);
          if (above === SLOPE_R || above === SLOPE_L) continue;
          s = top;
        } else if ((k === ONEWAY || (k === LADDER && this.get(tx, ty - 1) !== LADDER)) && !drop) {
          // one-way tops, and the top rung of a ladder, carry you from above
          if (top < oneWayFrom - 0.01) continue;
          s = top;
        }
        else if (k === SLOPE_R || k === SLOPE_L) {
          const ctx = this.tx(xc);
          if (tx !== ctx) continue;
          s = this.slopeY(tx, ty, xc);
        }
        if (s !== null && s >= yFrom - 0.01 && s <= yTo + 0.01 && (best === null || s < best)) best = s;
      }
    }
    return best;
  }

  ladderAt(x, y0, y1) {
    const tx = this.tx(x);
    for (let ty = this.ty(y0); ty <= this.ty(y1 - 1e-4); ty++) if (this.get(tx, ty) === LADDER) return true;
    return false;
  }
  // x centre of the ladder column under x
  ladderX(x) { return this.left(this.tx(x)) + T / 2; }
  // top y of the ladder column containing (x, y)
  ladderTop(x, y) {
    const tx = this.tx(x); let ty = this.ty(y);
    while (this.get(tx, ty - 1) === LADDER) ty--;
    return this.top(ty);
  }
}
