// Shared body painters for operators. Each takes the operator's materials so
// a costume is mostly a palette plus a few signature pieces.
import { cel, fill, stroke, clip, limb, blob, curve } from '../kit.js';

// --- arms -------------------------------------------------------------------
export const UPPER = limb(11.6, [[0, 2.5], [0.3, 2.45], [0.7, 2.05], [1, 1.95]], [[0, 2.45], [0.35, 2.35], [0.75, 1.95], [1, 1.85]]);
export const FORE = limb(10.4, [[0, 2.0], [0.35, 1.95], [0.8, 1.55], [1, 1.45]], [[0, 1.95], [0.3, 2.0], [0.8, 1.5], [1, 1.4]]);

// Gloved hand along +y from the wrist; the thumb sits on the front (+x).
export const PALM = blob([[-1.35, -0.4], [1.3, -0.45], [1.65, 1.5], [1.55, 3.0], [0.9, 4.25], [-0.5, 4.35], [-1.45, 3.1], [-1.6, 1.2]]);
export const THUMB = blob([[0.9, 0.7], [2.2, 1.2], [2.6, 2.6], [2.0, 3.25], [1.15, 2.4]]);

export function hand(g, ctx, glove, skin, fingerless = false) {
  const t = ctx.t;
  if (ctx.far) cel(g, THUMB, t(fingerless ? skin : glove), { sh: 0.5, hl: 0.2 });
  cel(g, PALM, t(glove), { sh: 0.7, hl: 0.3 });
  if (fingerless) clip(g, PALM, () => cel(g, 'M -3 2.7 L 3 2.5 L 3 6 L -3 6 Z', t(skin), { sh: 0.5, hl: 0.2, line: false }));
  for (const x of [-0.75, 0.05, 0.8]) stroke(g, `M ${x} 3.0 L ${x + 0.05} 4.1`, t(fingerless ? skin : glove).k, 0.22);
  if (!ctx.far) cel(g, THUMB, t(fingerless ? skin : glove), { sh: 0.5, hl: 0.2 });
}

// --- legs -------------------------------------------------------------------
export const THIGH = limb(15.2, [[0, 3.35], [0.35, 3.25], [0.75, 2.65], [1, 2.35]], [[0, 3.45], [0.3, 3.55], [0.75, 2.55], [1, 2.25]]);
export const SHIN = limb(14.4, [[0, 2.35], [0.3, 2.25], [0.7, 1.85], [1, 1.8]], [[0, 2.25], [0.25, 2.6], [0.6, 2.15], [1, 1.8]]);

// Boot shaft over the lower shin (shin frame) and the foot (ankle frame).
export const BOOT_SHAFT = blob([[-2.35, 9.2], [2.15, 9.0], [2.25, 12.6], [2.3, 14.8], [-2.3, 14.9], [-2.45, 12.4]]);
export const BOOT = blob([[-2.0, -1.5], [1.2, -1.4], [2.5, 0.1], [4.9, 0.9], [6.3, 1.7], [6.2, 2.5], [-2.3, 2.5], [-2.5, 0.4]]);
export const SOLE = 'M -2.45 1.85 L 6.25 1.85 C 6.45 2.05 6.4 2.4 6.2 2.5 L -2.35 2.5 C -2.55 2.3 -2.55 2.0 -2.45 1.85 Z';

export function boot(g, ctx, upper, sole) {
  const t = ctx.t;
  cel(g, BOOT, t(upper), { sh: 0.7, hl: 0.35 });
  cel(g, SOLE, t(sole), { sh: 0.25, hl: 0.15 });
  stroke(g, 'M 1.0 -0.9 C 1.8 -0.2 2.6 0.4 3.6 0.7', t(upper).k, 0.25);
  for (const x of [1.5, 2.3, 3.1]) stroke(g, `M ${x} ${-0.6 + (x - 1.5) * 0.45} l 0.6 -0.35`, t(upper).l, 0.22);
}

// --- head base ----------------------------------------------------------------
// Three-quarter head facing +x in the head frame (origin at the neck base).
export const HEAD = 'M 0.6 -12.4 C 3.0 -12.4 4.3 -11.0 4.3 -9.2 C 4.4 -8.5 4.5 -8.0 4.4 -7.6 C 4.3 -7.2 4.5 -6.8 4.9 -6.2 C 5.3 -5.7 5.0 -5.3 4.5 -5.3 C 4.6 -4.9 4.7 -4.5 4.5 -4.1 C 4.4 -3.4 4.2 -2.9 3.6 -2.6 C 2.4 -2.1 1.0 -2.6 -0.6 -3.8 C -2.0 -4.8 -3.6 -5.6 -4.0 -7.6 C -4.3 -10.4 -2.4 -12.4 0.6 -12.4 Z';
export const NECK = blob([[-1.7, 1.2], [2.1, 1.0], [2.0, -2.6], [0.6, -3.6], [-1.8, -4.4]]);
export const EAR = blob([[-2.05, -7.9], [-0.95, -8.05], [-0.6, -6.6], [-0.95, -5.0], [-1.9, -5.05], [-2.35, -6.5]]);

export function neck(g, skin) {
  cel(g, NECK, skin, { sh: 1.2, hl: 0 });
  clip(g, NECK, () => fill(g, blob([[-2.5, -4.6], [2.6, -3.0], [2.2, -1.6], [-2.5, -2.2]]), skin.d, 0.9));
}

// Face features. o: { skin, iris, brow, lip, browY, eyeH (0..1 openness), jaw }
export function face(g, o) {
  const s = o.skin;
  cel(g, HEAD, s, { sh: 1.0, hl: 0.4 });
  clip(g, HEAD, () => {
    // the side plane of the head, away from the light
    fill(g, 'M -6 -14 L -0.2 -14 C 0.4 -11.6 0.2 -9.6 -0.2 -8.2 C 0.3 -6.6 1.0 -4.6 2.2 -2.0 L -6 -2 Z', s.d, 0.55);
    // brow ridge and eye socket shadow
    fill(g, blob([[0.2, -8.3], [2.6, -8.7], [4.3, -8.0], [3.6, -7.0], [1.4, -6.9], [0.1, -7.4]]), s.d, 0.45);
    // cheekbone light
    fill(g, blob([[2.2, -6.4], [3.8, -6.2], [3.6, -5.2], [2.4, -5.4]]), s.l, 0.3);
    // under-nose and under-lip shadow
    fill(g, 'M 3.7 -5.2 C 4.2 -5.0 4.6 -5.1 4.8 -5.4 L 4.6 -5.0 C 4.2 -4.8 3.9 -4.8 3.7 -5.2 Z', s.k, 0.55);
    fill(g, 'M 3.2 -3.95 C 3.8 -3.7 4.3 -3.7 4.6 -3.95 L 4.5 -3.55 C 4.0 -3.4 3.5 -3.5 3.2 -3.95 Z', s.d, 0.7);
  });
  // ear
  cel(g, EAR, s, { sh: 0.5, hl: 0.2 });
  stroke(g, 'M -1.25 -7.3 C -0.95 -6.8 -1.0 -6.0 -1.45 -5.6', s.k, 0.22);
  // eyes (near one wider; far one foreshortened next to the nose bridge)
  const eh = o.eyeH ?? 1;
  const eye = (cx, cy, w, h, irisX) => {
    const d = `M ${cx - w} ${cy} C ${cx - w * 0.4} ${cy - h * 1.15 * eh} ${cx + w * 0.5} ${cy - h * 1.1 * eh} ${cx + w} ${cy - 0.05} C ${cx + w * 0.4} ${cy + h * 0.7 * eh} ${cx - w * 0.4} ${cy + h * 0.75 * eh} ${cx - w} ${cy} Z`;
    fill(g, d, '#f4efe8');
    clip(g, d, () => {
      fill(g, `M ${irisX - 0.48} ${cy - 0.05} a 0.48 0.48 0 1 0 0.96 0 a 0.48 0.48 0 1 0 -0.96 0 Z`, o.iris);
      fill(g, `M ${irisX - 0.24} ${cy - 0.05} a 0.24 0.24 0 1 0 0.48 0 a 0.24 0.24 0 1 0 -0.48 0 Z`, '#0b0c10');
      fill(g, `M ${cx - w - 1} ${cy - 2} L ${cx + w + 1} ${cy - 2} L ${cx + w + 1} ${cy - h * 0.55} C ${cx} ${cy - h * 0.9} ${cx} ${cy - h * 0.9} ${cx - w - 1} ${cy - h * 0.4} Z`, 'rgba(60,30,25,0.35)');
    });
    fill(g, `M ${irisX + 0.08} ${cy - 0.32} a 0.13 0.13 0 1 0 0.26 0 a 0.13 0.13 0 1 0 -0.26 0 Z`, '#ffffff');
    stroke(g, `M ${cx - w - 0.1} ${cy + 0.05} C ${cx - w * 0.4} ${cy - h * 1.2 * eh} ${cx + w * 0.5} ${cy - h * 1.15 * eh} ${cx + w + 0.12} ${cy - 0.12}`, '#16100e', 0.42);
  };
  eye(1.75, -7.35, 0.95, 0.72, 2.0);
  eye(3.85, -7.25, 0.5, 0.62, 3.95);
  // brows
  const by = o.browY ?? 0;
  fill(g, `M 0.5 ${-8.35 + by} C 1.2 ${-8.95 + by} 2.2 ${-9.05 + by} 2.85 ${-8.75 + by} L 2.75 ${-8.35 + by} C 2.1 ${-8.6 + by} 1.2 ${-8.5 + by} 0.6 ${-8.0 + by} Z`, o.brow);
  fill(g, `M 3.35 ${-8.65 + by} C 3.8 ${-8.85 + by} 4.2 ${-8.75 + by} 4.4 ${-8.5 + by} L 4.35 ${-8.25 + by} C 4.1 ${-8.45 + by} 3.75 ${-8.45 + by} 3.4 ${-8.3 + by} Z`, o.brow);
  // nose: nostril and bridge light
  stroke(g, 'M 4.25 -5.55 C 4.45 -5.35 4.75 -5.35 4.9 -5.55', s.k, 0.24);
  stroke(g, 'M 4.55 -7.3 C 4.65 -6.8 4.85 -6.4 5.05 -6.0', s.l, 0.28, 0.9);
  // mouth
  fill(g, 'M 3.0 -4.55 C 3.6 -4.4 4.1 -4.4 4.55 -4.5 C 4.2 -4.2 3.5 -4.15 3.0 -4.55 Z', o.lip);
  stroke(g, 'M 2.95 -4.55 C 3.6 -4.65 4.1 -4.62 4.6 -4.52', s.k, 0.28);
  // jaw line hint toward the neck
  stroke(g, 'M 0.4 -2.9 C 1.6 -2.4 2.8 -2.3 3.6 -2.65', s.d, 0.25, 0.8);
}

export { curve };
