// KOR — camera.
//
// World units, y down. `zoom` is how many world units fit in the view's
// height, so framing is the same on every screen and resolution; parallax
// layers get their own view matrix by scaling the camera position.

export class Camera {
  constructor() {
    this.x = 0; this.y = 0;          // view centre, world units
    this.viewH = 140;                // world units visible vertically
    this.aspect = 16 / 9;
    this.trauma = 0;                 // 0..1, decays; shake = trauma²
    this.shakeMul = 1;               // accessibility: 0 turns shake off
    this.shakeX = 0; this.shakeY = 0; this.shakeR = 0;
    this._t = 0;
    this.m = new Float32Array(9);
  }

  get viewW() { return this.viewH * this.aspect; }

  addShake(amount) { this.trauma = Math.min(1, this.trauma + amount * this.shakeMul); }

  // Called once per simulation step.
  update(dt) {
    this._t += dt;
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    const s = this.trauma * this.trauma, t = this._t;
    // smooth noise from summed sines (deterministic, no allocation)
    this.shakeX = s * 3.2 * (Math.sin(t * 47.3) * 0.6 + Math.sin(t * 91.7 + 1.3) * 0.4);
    this.shakeY = s * 2.4 * (Math.sin(t * 53.1 + 2.1) * 0.6 + Math.sin(t * 83.9 + 0.7) * 0.4);
    this.shakeR = s * 0.012 * Math.sin(t * 61.7 + 4.2);
  }

  // World → clip matrix (column-major mat3) for a layer with parallax factor p.
  matrix(p = 1, out = this.m) {
    const sx = 2 / this.viewW, sy = -2 / this.viewH;
    const cx = this.x * p + this.shakeX, cy = this.y * p + this.shakeY;
    const c = Math.cos(this.shakeR), s = Math.sin(this.shakeR);
    // scale · rotate(shakeR) · translate(-cx, -cy); rotation in world space so
    // the aspect ratio never skews it
    out[0] = sx * c; out[1] = sy * s; out[2] = 0;
    out[3] = -sx * s; out[4] = sy * c; out[5] = 0;
    out[6] = -(out[0] * cx + out[3] * cy); out[7] = -(out[1] * cx + out[4] * cy); out[8] = 1;
    return out;
  }

  // Screen (0..1) → world, for picking taps.
  toWorld(u, v) {
    return [this.x + (u - 0.5) * this.viewW, this.y + (v - 0.5) * this.viewH];
  }
}
