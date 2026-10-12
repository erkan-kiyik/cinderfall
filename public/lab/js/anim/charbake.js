// CINDERFALL LAB — bake a character's parts for the runtime rig.
//
// Every part painter of an operator or enemy is baked on its own, in its own
// bone frame, so the anchor of each sprite is its joint. Limbs come in a near
// and a far variant (the far side one tone darker, as on the M0 board). Part
// bounds are measured automatically by painting once at low resolution.
import { canvas, setRoot } from '../art/kit.js';

const darker = (t) => ({ l: t.m, m: t.d, d: t.k, k: t.k });
const NEAR = { far: false, t: (t) => t, J: null, rt: true };
const FAR = { far: true, t: darker, J: null, rt: true };

// Bounds of what `paint` draws around the origin, in units (padded), or null.
export function measure(paint, R = 48, s = 2) {
  const n = Math.ceil(R * 2 * s);
  const c = canvas(n, n), g = c.getContext('2d');
  g.translate(n / 2, n / 2); g.scale(s, s); setRoot(g);
  try { paint(g); } catch { return null; }
  const d = g.getImageData(0, 0, n, n).data;
  let x0 = n, y0 = n, x1 = -1, y1 = -1;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (d[(y * n + x) * 4 + 3] > 4) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  const u = (p) => (p - n / 2) / s, pad = 1.2;
  return [u(x0) - pad, u(y0) - pad, u(x1 + 1) + pad, u(y1 + 1) + pad];
}

const LIMBS = ['upper', 'fore', 'hand', 'thigh', 'shin', 'foot'];
const TORSO = ['backFar', 'torso', 'chest', 'front'];

// Bake entries for character `id` from its spec ({ op, skip, extras }).
export function charEntries(id, spec, scale) {
  const P = spec.op.parts, E = [];
  // bounds are measured lazily (only if the atlas really has to be painted)
  const add = (name, paint) => E.push({ name, box: () => measure(paint), scale, paint });
  for (const k of TORSO) if (P[k] && !(spec.skip || []).includes(k)) add(`${id}.${k}`, (g) => P[k](g, k === 'backFar' ? FAR : NEAR));
  if (P.head) add(`${id}.head`, (g) => P.head(g, NEAR));
  for (const k of LIMBS) if (P[k]) { add(`${id}.${k}.n`, (g) => P[k](g, NEAR)); add(`${id}.${k}.f`, (g) => P[k](g, FAR)); }
  // extras: a painter, or { paint, box } when the sprite needs exact bounds
  for (const [name, x] of Object.entries(spec.extras || {})) {
    if (typeof x === 'function') E.push({ name: `${id}.${name}`, box: () => measure(x, 66), scale, paint: x });
    else E.push({ name: `${id}.${name}`, box: x.box, scale, paint: x.paint });
  }
  return E;
}
