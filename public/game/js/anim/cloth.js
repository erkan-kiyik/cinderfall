// KOR — verlet cloth chains (scarf tails, straps).
// Points live in world space; the first point is pinned to an anchor that the
// owner moves every step. Gravity is light and a back-wind keeps tails
// streaming behind the character, with a little flutter; indoors (windK near 0)
// they hang and only swing with the body.

export class Chain {
  constructor(n, len) {
    this.n = n; this.seg = len / (n - 1);
    this.x = new Float32Array(n); this.y = new Float32Array(n);
    this.px = new Float32Array(n); this.py = new Float32Array(n);
    this.init = false;
  }

  reset(ax, ay, dirX) {
    for (let i = 0; i < this.n; i++) { this.x[i] = this.px[i] = ax - dirX * i * this.seg; this.y[i] = this.py[i] = ay + i * this.seg * 0.3; }
    this.init = true;
  }

  // anchor (ax, ay); back = −facing; t = time for flutter; vx = body velocity;
  // windK: how much of the street's wind reaches it (1 out of doors)
  step(dt, ax, ay, back, t, vx, seed = 0, gravity = 260, windK = 1) {
    if (!this.init) this.reset(ax, ay, -back);
    const n = this.n, X = this.x, Y = this.y, PX = this.px, PY = this.py;
    // accelerations in units/s²; strong air drag (0.94 per step) keeps it light
    const wind = back * (900 * windK + Math.max(0, -vx * back) * 1.5);
    const g = gravity;
    for (let i = 1; i < n; i++) {
      const k = i / (n - 1);
      const fl = (Math.sin(t * 8.3 - i * 1.1 + seed) * 300 * k + Math.sin(t * 3.7 + seed * 2) * 60) * (0.15 + 0.85 * windK);
      const vxp = (X[i] - PX[i]) * 0.94, vyp = (Y[i] - PY[i]) * 0.94;
      PX[i] = X[i]; PY[i] = Y[i];
      X[i] += vxp + wind * (0.4 + 0.6 * k) * dt * dt;
      Y[i] += vyp + (g + fl) * dt * dt;
    }
    X[0] = ax; Y[0] = ay; PX[0] = ax; PY[0] = ay;
    for (let it = 0; it < 4; it++) {
      for (let i = 1; i < n; i++) {
        const dx = X[i] - X[i - 1], dy = Y[i] - Y[i - 1];
        const d = Math.hypot(dx, dy) || 1e-4, diff = (d - this.seg) / d;
        if (i === 1) { X[i] -= dx * diff; Y[i] -= dy * diff; }
        else { X[i] -= dx * diff * 0.5; Y[i] -= dy * diff * 0.5; X[i - 1] += dx * diff * 0.5; Y[i - 1] += dy * diff * 0.5; }
      }
    }
  }
}
