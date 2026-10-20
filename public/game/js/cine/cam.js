// KOR — cinematics: a perspective camera with an operator's hand.
//
// World units are metres, y up. The camera sits at `pos`, turned by `yaw`
// (around y, 0 = looking down +z) and `pitch` (+ = looking up). A lens is
// given in millimetres on a 36 mm wide frame. The hand-held drift is three
// octaves of value noise (§5.7); `roll` tilts the image.
import { shake } from './noise.js';

export class Cam {
  constructor(W, H) {
    this.W = W; this.H = H;
    this.pos = [0, 1.6, 0]; this.yaw = 0; this.pitch = 0; this.roll = 0; this.mm = 35;
    this.hand = 0;      // hand-held amplitude (0..1 ≈ fraction of a degree / cm)
    this.seed = 7; this.t = 0;
    this._p = [0, 0, 0]; this._yaw = 0; this._pitch = 0; this._roll = 0;
    this.focus = 10;    // focus distance (m), for the depth of field helpers
  }
  get f() { return (this.mm / 36) * this.W; }

  // call once per frame after setting the move
  update(t) {
    this.t = t;
    const h = this.hand, s = this.seed;
    this._p[0] = this.pos[0] + shake(t, s) * 0.012 * h;
    this._p[1] = this.pos[1] + shake(t, s + 40) * 0.01 * h;
    this._p[2] = this.pos[2];
    this._yaw = this.yaw + shake(t, s + 80) * 0.0045 * h;
    this._pitch = this.pitch + shake(t, s + 120) * 0.0038 * h;
    this._roll = this.roll + shake(t, s + 160, [0.4, 1.3]) * 0.0035 * h;
    this.cy = Math.cos(this._yaw); this.sy = Math.sin(this._yaw);
    this.cp = Math.cos(this._pitch); this.sp = Math.sin(this._pitch);
    this.cr = Math.cos(this._roll); this.sr = Math.sin(this._roll);
  }

  // world → camera space [x right, y up, z forward]
  toCam(x, y, z, out) {
    const dx = x - this._p[0], dy = y - this._p[1], dz = z - this._p[2];
    const x1 = dx * this.cy - dz * this.sy, z1 = dx * this.sy + dz * this.cy;
    const y2 = dy * this.cp - z1 * this.sp, z2 = dy * this.sp + z1 * this.cp;
    out[0] = x1; out[1] = y2; out[2] = z2;
    return out;
  }
  // world → screen [sx, sy, depth, pixels per metre]; depth ≤ 0 = behind
  project(x, y, z, out = [0, 0, 0, 0]) {
    this.toCam(x, y, z, out);
    const Z = out[2];
    if (Z <= 0.02) { out[2] = -1; return out; }
    const k = this.f / Z;
    let sx = out[0] * k, sy = -out[1] * k;
    const rx = sx * this.cr - sy * this.sr, ry = sx * this.sr + sy * this.cr;
    out[0] = this.W / 2 + rx; out[1] = this.H / 2 + ry; out[2] = Z; out[3] = k;
    return out;
  }
  // circle of confusion (pixels of blur) for something at depth Z, for a lens
  // stopped at `fstop`: blur grows with distance from the focus plane
  coc(Z, fstop = 2.8) {
    const f = this.mm / 1000, s = this.focus, A = f / fstop;
    const c = (A * f * Math.abs(Z - s)) / (Z * Math.max(1e-3, s - f));
    return (c / 0.036) * this.W;
  }
}

// critically damped follow: the operator lags the action a little
export function follow(state, target, dt, time = 0.15) {
  const w = 2 / time, x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const d = state.v - target;
  const tmp = (state.vel + w * d) * dt;
  state.vel = (state.vel - w * tmp) * e;
  state.v = target + (d + tmp) * e;
  return state.v;
}

// the same camera seen in a mirror lying at height y0 (a puddle): everything
// is drawn flipped about the plane, for reflections
export function mirrorCam(cam, y0 = 0) {
  return {
    W: cam.W, H: cam.H, f: cam.f, pos: cam.pos, _p: cam._p, focus: cam.focus, mirror: true,
    project: (x, y, z, out = [0, 0, 0, 0]) => cam.project(x, 2 * y0 - y, z, out),
    toCam: (x, y, z, out) => cam.toCam(x, 2 * y0 - y, z, out),
    coc: (Z, s) => cam.coc(Z, s),
  };
}
