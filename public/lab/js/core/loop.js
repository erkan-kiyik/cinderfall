// CINDERFALL LAB — main loop.
//
// Simulation runs at a fixed 120 Hz step; rendering happens once per display
// frame and interpolates between the last two simulation states (alpha). On a
// 60 Hz screen that is two steps a frame, on 120 Hz one, on 144 Hz mostly one
// with an occasional zero — motion stays exact at every refresh rate.
//
// The loop also measures itself: display refresh rate (median of rAF
// intervals), CPU time spent in update and render, and a frame-time history
// for the performance overlay.

export const STEP = 1 / 120;
const MAX_STEPS = 4;
const HZ_LADDER = [30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 240];

export class Loop {
  constructor({ update, render }) {
    this.update = update;
    this.render = render;
    this.acc = 0;
    this.last = -1;
    this.running = false;
    this.hz = 60;
    this.simTime = 0;
    // ring buffers for stats (no allocation per frame)
    this.N = 240;
    this.frameMs = new Float32Array(this.N);
    this.updMs = new Float32Array(this.N);
    this.rndMs = new Float32Array(this.N);
    this.i = 0;
    this.frames = 0;
    this._iv = new Float32Array(61);
    this._ivn = 0;
    this._sorted = new Float32Array(61);
    this._tick = (t) => this.tick(t);
    this._vis = () => { if (document.hidden) { this.last = -1; } };
    document.addEventListener('visibilitychange', this._vis);
  }

  start() { if (!this.running) { this.running = true; this.last = -1; requestAnimationFrame(this._tick); } }
  stop() { this.running = false; }

  tick(now) {
    if (!this.running) return;
    requestAnimationFrame(this._tick);
    if (this.last < 0) { this.last = now; return; }
    const raw = now - this.last;
    this.last = now;
    this.trackHz(raw);
    const dt = Math.min(raw / 1000, 0.1);
    this.acc += dt;
    const t0 = performance.now();
    let n = 0;
    while (this.acc >= STEP && n < MAX_STEPS) {
      this.update(STEP);
      this.simTime += STEP;
      this.acc -= STEP;
      n++;
    }
    if (n === MAX_STEPS && this.acc >= STEP) this.acc = 0; // too far behind: drop, don't spiral
    const t1 = performance.now();
    this.render(this.acc / STEP, dt);
    const t2 = performance.now();
    const k = this.i;
    this.frameMs[k] = raw; this.updMs[k] = t1 - t0; this.rndMs[k] = t2 - t1;
    this.i = (k + 1) % this.N;
    this.frames++;
  }

  // Refresh rate: median of the last 61 intervals, snapped to a common rate.
  trackHz(ms) {
    if (ms <= 0 || ms > 100) return;
    this._iv[this._ivn % 61] = ms; this._ivn++;
    if (this._ivn < 31 || this._ivn % 30) return;
    const n = Math.min(this._ivn, 61);
    const s = this._sorted; for (let j = 0; j < n; j++) s[j] = this._iv[j];
    const arr = s.subarray(0, n).sort();
    const hz = 1000 / arr[n >> 1];
    let best = 60, bd = 1e9;
    for (const h of HZ_LADDER) { const d = Math.abs(h - hz); if (d < bd) { bd = d; best = h; } }
    this.hz = best;
  }

  // Summary over the last `n` frames: avg / p95 frame time, fps, CPU costs.
  stats(n = 120) {
    n = Math.min(n, this.frames, this.N);
    if (!n) return null;
    const tmp = this._statBuf || (this._statBuf = new Float32Array(this.N));
    let sf = 0, su = 0, sr = 0;
    for (let j = 0; j < n; j++) {
      const k = (this.i - 1 - j + this.N) % this.N;
      tmp[j] = this.frameMs[k]; sf += this.frameMs[k]; su += this.updMs[k]; sr += this.rndMs[k];
    }
    const sorted = tmp.subarray(0, n).sort();
    return {
      fps: 1000 / (sf / n), avg: sf / n, p95: sorted[Math.floor(n * 0.95)], max: sorted[n - 1],
      upd: su / n, rnd: sr / n, hz: this.hz,
    };
  }
}
