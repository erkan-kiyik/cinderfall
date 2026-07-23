// Math / random utilities shared across the engine.

export const TAU = Math.PI * 2;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const remap = (v, a0, a1, b0, b1) => b0 + (clamp((v - a0) / (a1 - a0), 0, 1)) * (b1 - b0);

// Framerate-independent exponential smoothing toward a target.
export const damp = (cur, target, rate, dt) => lerp(cur, target, 1 - Math.exp(-rate * dt));

export function angleLerp(a, b, t) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return a + d * t;
}

// Shortest signed angle from a to b, in (-PI, PI].
export function angleDiff(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

export const dist = (x0, y0, x1, y1) => Math.hypot(x1 - x0, y1 - y0);

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

// Deterministic RNG (mulberry32) so painted grunge is stable between runs.
export function makeRng(seed) {
  let s = seed >>> 0;
  const next = () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (a, b) => a + next() * (b - a);
  next.int = (a, b) => Math.floor(next.range(a, b + 1));
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.chance = (p) => next() < p;
  return next;
}

// Non-deterministic gameplay randomness.
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const randSpread = (s) => (Math.random() - 0.5) * 2 * s;
export const chance = (p) => Math.random() < p;

// Cheap smooth 1D value noise for camera shake / flicker.
export function makeNoise1D(seed = 1) {
  const rng = makeRng(seed);
  const grads = new Float32Array(256);
  for (let i = 0; i < 256; i++) grads[i] = rng.range(-1, 1);
  return (t) => {
    const i0 = Math.floor(t) & 255;
    const i1 = (i0 + 1) & 255;
    const f = t - Math.floor(t);
    const u = f * f * (3 - 2 * f);
    return lerp(grads[i0], grads[i1], u);
  };
}

// Two-bone IK: root, target, segment lengths, bend side (+1 / -1).
// Returns the middle-joint position. Clamps reach so limbs never pop.
export function ik2(rx, ry, tx, ty, lenA, lenB, bend) {
  let dx = tx - rx, dy = ty - ry;
  let d = Math.hypot(dx, dy);
  const maxD = (lenA + lenB) * 0.999;
  const minD = Math.abs(lenA - lenB) * 1.001 + 0.001;
  if (d > maxD) { dx *= maxD / d; dy *= maxD / d; d = maxD; }
  else if (d < minD) { const s = minD / (d || 1); dx *= s; dy *= s; d = minD; }
  const a = (lenA * lenA - lenB * lenB + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, lenA * lenA - a * a));
  const ux = dx / d, uy = dy / d;
  return {
    x: rx + ux * a - uy * h * bend,
    y: ry + uy * a + ux * h * bend,
  };
}
