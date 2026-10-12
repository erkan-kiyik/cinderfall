// HALE — defence. Broad, planted, calm. Signature shapes: the shield
// generator on his back with its antenna, the sand plate carrier with a teal
// emitter bar, and a short full beard.
import { cel, fill, stroke, clip, blob, curve } from '../kit.js';
import { M, tone } from '../style.js';
import { UPPER, FORE, THIGH, SHIN, BOOT_SHAFT, hand, boot, face, neck, HEAD } from './common.js';

const PAL = {
  skin: M.skinC,
  shirt: tone('#7f8c5c', '#647048', '#4a5434', '#272c1a'),
  plate: tone('#e6d6ae', '#c9b48a', '#9b8762', '#55492f'),
  pouch: tone('#a8956c', '#8a7853', '#66573a', '#352c1c'),
  teal: tone('#c4fdff', '#3ee8e0', '#1a9fa0', '#0b4a4a'),
  boot: tone('#8a6a4c', '#6b4f36', '#4c3624', '#261a10'),
  sole: M.rubber,
  hair: tone('#34302e', '#1f1c1b', '#141211', '#070606'),
  beard: tone('#564c45', '#3a332e', '#27221f', '#0f0d0c'),
  pack: M.gunmetal,
  glove: M.black,
  belt: tone('#6b4f36', '#523b28', '#3a2a1c', '#1d140c'),
};

const SHIRT = blob([[-7.4, -18.4], [-4.6, -20.8], [0.6, -21.4], [3.8, -20.8], [5.8, -19.0], [6.8, -15.0], [6.5, -11.0], [5.8, -6.0], [5.6, -3.0], [-5.6, -2.8], [-6.4, -8], [-7.6, -13.6]]);
const PELVIS = blob([[-5.6, -4.4], [5.6, -4.5], [5.8, -1.2], [3.8, 1.4], [0.4, 2.0], [-3.6, 1.4], [-5.8, -1.0]]);
const PLATE = blob([[-5.0, -18.6], [1.0, -19.6], [5.4, -18.8], [7.2, -15.2], [7.0, -8.2], [6.0, -5.4], [-0.6, -4.8], [-5.8, -5.8], [-6.4, -11.2]]);
const PACK = 'M -13.4 -21.6 C -13.4 -22.6 -12.8 -23.2 -11.8 -23.2 L -5.6 -23.0 L -5.2 -6.4 L -11.6 -6.0 C -12.6 -6.0 -13.2 -6.6 -13.2 -7.6 Z';

function backFar(g) {
  // antenna first so the pack covers its foot
  stroke(g, 'M -11.0 -22.8 L -12.2 -33.0', PAL.pack.k, 0.7);
  stroke(g, 'M -11.0 -22.8 L -12.2 -33.0', PAL.pack.l, 0.3);
  fill(g, 'M -12.65 -33.4 a 0.75 0.75 0 1 0 1.5 0 a 0.75 0.75 0 1 0 -1.5 0 Z', PAL.teal.m);
  cel(g, PACK, PAL.pack, { sh: 1.4, hl: 0.5 });
  clip(g, PACK, () => {
    // sand side panel, vent slots glowing teal, a grab handle
    fill(g, 'M -14 -16.8 L -4 -16.4 L -4 -12.6 L -14 -13.0 Z', PAL.plate.m);
    fill(g, 'M -14 -13.0 L -4 -12.6 L -4 -12.0 L -14 -12.4 Z', PAL.plate.d);
    for (let i = 0; i < 4; i++) fill(g, `M -12.2 ${-21.2 + i * 1.1} L -7.4 ${-21.0 + i * 1.1} L -7.4 ${-20.5 + i * 1.1} L -12.2 ${-20.7 + i * 1.1} Z`, PAL.teal.m, 0.9);
    stroke(g, 'M -12.6 -9.6 L -6.0 -9.2', PAL.pack.k, 0.3);
    stroke(g, 'M -12.4 -8.2 L -6.2 -7.8', PAL.pack.l, 0.22);
  });
  // folded hex shield plates clipped to the pack's back face
  const HEX = 'M -15.6 -19.6 L -13.6 -21.0 L -13.0 -14.0 L -13.4 -8.4 L -15.4 -9.6 Z';
  cel(g, HEX, PAL.plate, { sh: 0.6, hl: 0.3 });
  stroke(g, 'M -14.6 -19.4 L -14.3 -9.8', PAL.teal.d, 0.3);
}

function torso(g) {
  cel(g, PELVIS, PAL.shirt, { sh: 1.0, hl: 0.4 });
  cel(g, 'M -5.9 -4.8 C -1 -5.1 2.5 -5.1 5.9 -4.9 L 5.9 -3.0 C 2.5 -3.2 -1 -3.2 -5.9 -2.9 Z', PAL.belt, { sh: 0.4, hl: 0.2 });
  cel(g, 'M 2.9 -5.1 L 4.6 -5.15 L 4.6 -2.8 L 2.9 -2.8 Z', M.gunmetal, { sh: 0.3, hl: 0.2 });
  stroke(g, 'M 3.6 -2.8 C 3.5 -1.0 3.2 0.6 2.4 1.8', PAL.shirt.k, 0.26);
  cel(g, SHIRT, PAL.shirt, { sh: 1.6, hl: 0.5 });
  // carrier shoulder straps
  for (const [x0, x1] of [[-5.2, -2.8], [2.0, 4.2]]) {
    const d = `M ${x0} -21.0 L ${x1} -21.4 L ${x1 + 0.4} -17.6 L ${x0 + 0.2} -17.2 Z`;
    cel(g, d, PAL.pouch, { sh: 0.4, hl: 0.25 });
  }
  cel(g, PLATE, PAL.plate, { sh: 1.6, hl: 0.55 });
  clip(g, PLATE, () => {
    // side cummerbund in shadow toward the back
    fill(g, 'M -8 -14 C -6 -12 -5.2 -9 -5.2 -4 L -8 -4 Z', PAL.pouch.d);
    // teal emitter bar with a soft glow
    g.save(); g.shadowColor = PAL.teal.m; g.shadowBlur = 6;
    fill(g, 'M -1.2 -16.0 L 5.6 -16.4 L 5.6 -15.2 L -1.2 -14.9 Z', PAL.teal.m);
    g.restore();
    fill(g, 'M -0.8 -15.85 L 5.2 -16.2 L 5.2 -15.75 L -0.8 -15.45 Z', PAL.teal.l);
    // panel seams
    stroke(g, curve([[-4.2, -12.6], [0.6, -12.9], [6.4, -12.6]]), PAL.plate.d, 0.28);
    stroke(g, curve([[-4.4, -18.0], [-4.8, -14], [-4.6, -12.8]]), PAL.plate.d, 0.25);
  });
  // three magazine pouches across the bottom of the plate
  for (const x of [-3.0, -0.6, 1.8, 4.2]) {
    const P = `M ${x} -11.0 L ${x + 2.1} -11.1 L ${x + 2.2} -6.6 L ${x + 0.1} -6.4 Z`;
    cel(g, P, PAL.pouch, { sh: 0.5, hl: 0.3 });
    fill(g, `M ${x - 0.05} -11.2 L ${x + 2.15} -11.3 L ${x + 2.2} -9.8 L ${x} -9.7 Z`, PAL.pouch.d);
    stroke(g, `M ${x + 0.9} -9.9 L ${x + 1.3} -9.9`, PAL.pouch.l, 0.3);
  }
}

function upper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL.shirt), { sh: 1.4, hl: 0.45 });
  // big shoulder plate on the near side only
  if (!ctx.far) {
    const PAD = blob([[-3.4, -2.2], [0.0, -3.2], [3.4, -2.0], [3.6, 2.4], [2.6, 5.0], [-2.6, 5.0], [-3.8, 2.0]]);
    cel(g, PAD, PAL.plate, { sh: 0.9, hl: 0.45 });
    clip(g, PAD, () => {
      stroke(g, curve([[-3.2, 2.6], [0, 3.2], [3.4, 2.4]]), PAL.plate.d, 0.3);
      fill(g, 'M -1.4 -0.4 L 1.6 -0.6 L 1.6 0.6 L -1.4 0.8 Z', PAL.teal.m);
    });
  }
  clip(g, UPPER, () => stroke(g, curve([[-1.8, 8.6], [-0.4, 9.4], [1.2, 9.6]]), t(PAL.shirt).d, 0.28));
}

function fore(g, ctx) {
  const t = ctx.t;
  cel(g, FORE, t(PAL.shirt), { sh: 1.2, hl: 0.4 });
  // rolled cuff and an elbow pad
  clip(g, FORE, () => fill(g, 'M -3 6.8 L 3 6.4 L 3 8.4 L -3 8.8 Z', t(PAL.shirt).d));
  cel(g, blob([[-2.0, -1.6], [2.2, -1.4], [2.4, 1.2], [0, 2.0], [-2.2, 1.2]]), t(PAL.pouch), { sh: 0.5, hl: 0.3 });
  clip(g, FORE, () => cel(g, 'M -3 8.6 L 3 8.2 L 3 12 L -3 12 Z', t(PAL.skin), { sh: 0.6, hl: 0.2, line: false }));
}

function handP(g, ctx) { hand(g, ctx, PAL.glove, PAL.skin, false); }

function thigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(PAL.shirt), { sh: 1.5, hl: 0.4 });
  clip(g, THIGH, () => {
    stroke(g, curve([[-1.6, 10.4], [0.0, 11.2], [1.6, 11.6]]), t(PAL.shirt).d, 0.26);
  });
  // cargo pocket
  const POCKET = blob([[-2.6, 5.0], [1.2, 4.8], [1.4, 9.6], [-2.4, 9.9]]);
  cel(g, POCKET, t(PAL.shirt), { sh: 0.5, hl: 0.3 });
  fill(g, 'M -2.7 4.8 L 1.3 4.6 L 1.35 6.2 L -2.6 6.4 Z', t(PAL.shirt).d);
}

function shin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(PAL.shirt), { sh: 1.3, hl: 0.35 });
  cel(g, BOOT_SHAFT, t(PAL.boot), { sh: 0.6, hl: 0.3 });
  for (const y of [10.4, 11.8, 13.2]) stroke(g, `M -0.6 ${y} L 2.0 ${y - 0.3}`, t(PAL.boot).k, 0.25);
  const PAD = blob([[-1.0, -2.0], [2.2, -1.8], [3.2, 0.8], [2.8, 3.8], [0.4, 4.2], [-0.6, 1.4]]);
  cel(g, PAD, t(PAL.plate), { sh: 0.6, hl: 0.35 });
}

function foot(g, ctx) { boot(g, ctx, PAL.boot, PAL.sole); }

function head(g) {
  g.save(); g.translate(-0.35, 0); g.scale(1.3, 1); neck(g, PAL.skin); g.restore();
  face(g, { skin: PAL.skin, iris: '#3b2416', brow: '#120f0e', lip: '#5a3226', browY: 0.1 });
  // short fade: tight cap of hair a little proud of the skull
  const HAIR = 'M -4.15 -8.0 C -4.45 -10.6 -2.5 -12.65 0.6 -12.65 C 3.1 -12.65 4.45 -11.2 4.4 -10.0 C 3.9 -10.3 3.3 -10.35 2.6 -10.2 C 1.6 -10.0 0.9 -9.6 0.5 -9.0 C 0.2 -8.5 0.0 -8.0 -0.3 -7.6 L -1.0 -7.8 C -2.0 -8.3 -3.2 -8.3 -4.15 -8.0 Z';
  cel(g, HAIR, PAL.hair, { sh: 0.6, hl: 0.35, line: false });
  clip(g, HAIR, () => {
    stroke(g, curve([[-3.0, -11.4], [-0.6, -12.4], [2.4, -12.3], [3.8, -11.3]]), PAL.hair.l, 0.3);
    for (const [x, y] of [[-2.6, -10.2], [-1.2, -11.0], [0.4, -11.4], [2.0, -11.4], [-2.8, -9.0], [-1.6, -9.6]]) stroke(g, `M ${x} ${y} l 0.5 -0.3`, PAL.hair.l, 0.16, 0.7);
  });
  // short boxed beard along the jaw and chin, and a moustache
  const BEARD = 'M -0.9 -7.4 C -0.5 -6.2 0.4 -5.0 1.6 -4.3 C 2.4 -3.9 3.2 -3.85 4.0 -3.9 C 4.4 -3.9 4.7 -3.95 4.85 -4.0 C 4.9 -3.3 4.7 -2.5 4.1 -2.0 C 3.2 -1.4 1.6 -1.5 0.2 -2.4 C -1.0 -3.2 -1.8 -4.4 -2.0 -5.6 C -1.6 -6.2 -1.2 -6.8 -0.9 -7.4 Z';
  cel(g, BEARD, PAL.beard, { sh: 0.6, hl: 0.3 });
  clip(g, BEARD, () => {
    stroke(g, curve([[0.0, -5.4], [1.4, -3.6], [3.2, -2.6]]), PAL.beard.l, 0.24);
    stroke(g, curve([[-1.0, -5.6], [0.0, -3.8], [1.4, -2.6]]), PAL.beard.k, 0.2);
  });
  const MOUST = 'M 2.85 -4.7 C 3.3 -5.15 4.1 -5.25 4.75 -5.0 C 4.85 -4.75 4.75 -4.6 4.55 -4.55 C 4.0 -4.75 3.4 -4.7 2.85 -4.7 Z';
  cel(g, MOUST, PAL.beard, { sh: 0.25, hl: 0.15 });
  // earpiece with a boom mic and a teal status light
  cel(g, 'M -2.4 -8.0 L -0.6 -8.2 L -0.5 -5.6 L -2.3 -5.4 Z', M.black, { sh: 0.3, hl: 0.2 });
  fill(g, 'M -1.85 -7.4 a 0.32 0.32 0 1 0 0.64 0 a 0.32 0.32 0 1 0 -0.64 0 Z', PAL.teal.m);
}

export const HALE = {
  id: 'hale', name: 'HALE', role: 'SAVUNMA', pal: PAL,
  pose: { nUpper: 0.2, nFore: -2.25, nHand: -0.3, fUpper: -0.08, fFore: -0.16, fHand: -0.1, nThigh: 0.2, nShin: 0.05, fThigh: -0.2, fShin: -0.05, head: 0.02 },
  parts: { backFar, torso, head, upper, fore, hand: handP, thigh, shin, foot },
};
