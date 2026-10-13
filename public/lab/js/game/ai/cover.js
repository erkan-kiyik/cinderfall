// CINDERFALL LAB — cover points, found in the tile level.
//
// A cover point is a standing spot on a floor right next to a solid obstacle
// 4–6 tiles tall (32–48 units): crouched behind it a body (40 tall) is hidden
// from the other side, standing up puts the head and gun over the top. The
// obstacle side (+1 right, −1 left) is the direction the cover protects from.
import { T, SOLID, ONEWAY } from '../../phys/level.js';

export function findCovers(level, { min = 4, max = 6 } = {}) {
  const out = [];
  const solid = (c, r) => level.get(c, r) === SOLID;
  for (let r = 1; r < level.h; r++) {
    for (let c = 1; c < level.w - 1; c++) {
      const floor = level.get(c, r);
      if (floor !== SOLID && floor !== ONEWAY) continue;
      // standing room above the floor tile (7 tiles)
      let room = true;
      for (let k = 1; k <= 7; k++) if (r - k >= 0 && solid(c, r - k)) { room = false; break; }
      if (!room) continue;
      for (const side of [1, -1]) {
        const oc = c + side;
        // obstacle: solid tiles stacked on the same floor level
        let h = 0;
        while (h < 9 && r - 1 - h >= 0 && solid(oc, r - 1 - h)) h++;
        if (h < min || h > max) continue;
        // stand flush against it without touching (half a body width off the face)
        const x = side > 0 ? level.left(oc) - 8.5 : level.left(c) + 8.5;
        out.push({ x, y: level.top(r), side, h: h * T, used: null });
      }
    }
  }
  return out;
}
