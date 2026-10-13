// KITE — recon. Light, quick, always listening. Signature shapes: the
// auburn bob under a big yellow headset with a flip-down monocle, the white
// anorak with a chest tablet, and her scout drone hovering over her raised
// hand.
import { cel, fill, stroke, clip, blob, curve } from '../kit.js';
import { M, tone } from '../style.js';
import { UPPER, FORE, THIGH, SHIN, BOOT_SHAFT, hand, boot, face, neck } from './common.js';
import { kiteHelmet } from './helmets.js';

const PAL = {
  skin: M.skinA,
  coat: tone('#ffffff', '#e8edf3', '#b9c5d3', '#5f6d80'),
  sky: tone('#8fd0ff', '#4aa8ff', '#2d77c4', '#123a66'),
  yellow: tone('#fff0a0', '#ffd23f', '#c99a10', '#5e4605'),
  pants: tone('#5d6878', '#46505e', '#2f3743', '#151a21'),
  hair: tone('#ee8a58', '#c95e34', '#923e20', '#4a1c0c'),
  dark: M.charcoal,
  lens: M.lens,
  glove: M.charcoal,
  boot: M.white,
};

const COAT = blob([[-6.6, -18.4], [-4.0, -20.6], [0.6, -21.2], [3.4, -20.6], [5.0, -19.0], [5.8, -15.4], [5.8, -12.0], [5.2, -8.0], [5.4, -2.6], [4.6, -0.8], [0.2, -0.2], [-5.0, -0.6], [-6.0, -4.0], [-6.2, -10.5], [-6.8, -15.0]]);
const PELVIS = blob([[-5.0, -2.6], [5.0, -2.8], [5.2, -0.6], [3.4, 1.4], [0.4, 2.0], [-3.2, 1.4], [-5.2, -0.6]]);

function torso(g, ctx) {
  cel(g, PELVIS, PAL.pants, { sh: 1.0, hl: 0.4 });
  // folded hood bunched behind the neck
  const HOODB = blob([[-5.8, -21.0], [-2.6, -22.6], [0.6, -22.4], [0.4, -19.6], [-3.6, -18.8], [-6.2, -19.2]]);
  cel(g, HOODB, PAL.coat, { sh: 0.8, hl: 0.4 });
  clip(g, HOODB, () => stroke(g, curve([[-5.4, -20.4], [-2.8, -21.4], [0.2, -21.0]]), PAL.coat.d, 0.3));
  cel(g, COAT, PAL.coat, { sh: 1.8, hl: 0.5 });
  clip(g, COAT, () => {
    // sky side panel running from the armpit to the hem, and the hem band
    fill(g, 'M -8 -16 C -6 -16 -4.8 -14 -4.6 -10 C -4.4 -6 -4.6 -3 -4.8 0 L -8 0 Z', PAL.sky.m);
    fill(g, 'M -8 -16 C -6 -16 -4.8 -14 -4.6 -10 L -4.9 -10 C -5.1 -14 -6.2 -15.6 -8 -15.6 Z', PAL.sky.d);
    fill(g, 'M -8 -2.4 C -3 -1.8 2 -1.8 7 -2.6 L 7 1 L -8 1 Z', PAL.sky.m);
    // yellow zip line and pull
    stroke(g, curve([[2.6, -20.0], [2.9, -15.0], [2.8, -9.0], [2.6, -2.2]]), PAL.yellow.d, 0.34);
    fill(g, 'M 2.5 -19.4 L 3.3 -19.5 L 3.4 -17.8 L 2.6 -17.7 Z', PAL.yellow.m);
    // hip pocket seam and a drawcord at the hem
    stroke(g, 'M -2.6 -7.0 C -1.4 -6.0 0.0 -5.6 1.4 -5.6', PAL.coat.d, 0.3);
    stroke(g, 'M 4.2 -2.4 C 4.6 -1.0 4.4 0.4 4.0 1.2', PAL.yellow.m, 0.3);
  });
  // chest rig with the drone tablet
  for (const d of ['M -4.8 -19.4 L -3.4 -19.8 L 5.2 -10.4 L 4.0 -9.6 Z', 'M -4.6 -10.6 L 5.4 -11.2 L 5.4 -9.8 L -4.6 -9.2 Z']) cel(g, d, PAL.dark, { sh: 0.3, hl: 0.2 });
  const TAB = 'M -0.4 -16.4 L 5.2 -16.8 L 5.4 -11.6 L -0.2 -11.2 Z';
  cel(g, TAB, PAL.dark, { sh: 0.5, hl: 0.3 });
  g.save(); g.shadowColor = PAL.lens.m; g.shadowBlur = 5;
  fill(g, 'M 0.3 -15.8 L 4.6 -16.1 L 4.75 -12.2 L 0.45 -11.9 Z', PAL.lens.d);
  g.restore();
  clip(g, 'M 0.3 -15.8 L 4.6 -16.1 L 4.75 -12.2 L 0.45 -11.9 Z', () => {
    stroke(g, 'M 0.8 -13.0 L 1.8 -14.2 L 2.8 -13.4 L 4.2 -15.0', PAL.lens.l, 0.3);
    fill(g, 'M 3.4 -13.1 a 0.4 0.4 0 1 0 0.8 0 a 0.4 0.4 0 1 0 -0.8 0 Z', PAL.yellow.m);
  });
}

function front(g, ctx) {
  // scout drone hovering above the raised far hand (board pose only; in
  // game the drone is its own sprite, see DRONE)
  const [hx, hy] = ctx.J.hip, [wx, wy] = ctx.J.fWr;
  g.save(); g.translate(wx - hx + 1.6, wy - hy - 8.6); g.rotate(-0.08);
  drone(g);
  g.restore();
}

// The scout drone, centred on its body.
export function drone(g) {
  const BODY = blob([[-3.2, -0.6], [-1.0, -1.6], [2.6, -1.4], [3.8, 0.0], [2.8, 1.4], [-1.6, 1.6], [-3.4, 0.8]]);
  // rotor arms and blurred discs
  for (const x of [-4.6, 4.8]) {
    stroke(g, `M ${x * 0.5} -0.6 L ${x} -1.6`, PAL.dark.m, 0.6);
    cel(g, `M ${x - 0.5} -2.2 L ${x + 0.5} -2.2 L ${x + 0.5} -1.2 L ${x - 0.5} -1.2 Z`, PAL.dark, { sh: 0.2, hl: 0.1 });
    fill(g, `M ${x - 3.0} -2.5 a 3.0 0.55 0 1 0 6.0 0 a 3.0 0.55 0 1 0 -6.0 0 Z`, 'rgba(220,235,250,0.38)');
    stroke(g, `M ${x - 3.0} -2.5 a 3.0 0.55 0 1 0 6.0 0`, 'rgba(255,255,255,0.6)', 0.2);
  }
  cel(g, BODY, PAL.coat, { sh: 0.7, hl: 0.35 });
  clip(g, BODY, () => {
    fill(g, 'M -4 0.2 L 5 -0.2 L 5 2 L -4 2 Z', PAL.yellow.m);
    fill(g, 'M -4 1.0 L 5 0.6 L 5 2 L -4 2 Z', PAL.yellow.d);
  });
  // camera eye and landing skids
  g.save(); g.shadowColor = PAL.lens.m; g.shadowBlur = 5;
  fill(g, 'M 2.3 0.9 a 0.8 0.8 0 1 0 1.6 0 a 0.8 0.8 0 1 0 -1.6 0 Z', PAL.dark.k);
  fill(g, 'M 2.65 0.9 a 0.45 0.45 0 1 0 0.9 0 a 0.45 0.45 0 1 0 -0.9 0 Z', PAL.lens.m);
  g.restore();
  stroke(g, 'M -1.6 1.6 L -2.2 3.0 M 1.6 1.6 L 2.2 3.0 M -3.0 3.0 L 3.0 3.0', PAL.dark.m, 0.4);
}

function upper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL.coat), { sh: 1.4, hl: 0.45 });
  clip(g, UPPER, () => {
    fill(g, 'M -4 -3 L -1.4 -3 L -1.2 12 L -4 12 Z', t(PAL.sky).m);
    stroke(g, curve([[-1.0, 6.4], [0.2, 7.4], [1.6, 7.6]]), t(PAL.coat).d, 0.28);
  });
}

function fore(g, ctx) {
  const t = ctx.t;
  cel(g, FORE, t(PAL.coat), { sh: 1.2, hl: 0.4 });
  // sky forearm guard with a yellow strap
  const GUARD = blob([[-2.2, 3.4], [2.1, 3.2], [2.0, 9.4], [-2.0, 9.6]]);
  cel(g, GUARD, t(PAL.sky), { sh: 0.6, hl: 0.35 });
  fill(g, 'M -2.2 5.6 L 2.2 5.4 L 2.2 6.4 L -2.2 6.6 Z', t(PAL.yellow).m);
}

function handP(g, ctx) { hand(g, ctx, PAL.glove, PAL.skin, true); }

function thigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(PAL.pants), { sh: 1.5, hl: 0.4 });
  clip(g, THIGH, () => {
    fill(g, 'M 1.6 -2 L 2.4 -2 L 2.0 16 L 1.2 16 Z', t(PAL.sky).m);
    stroke(g, curve([[-1.6, 10.4], [0.0, 11.2], [1.4, 11.6]]), t(PAL.pants).d, 0.26);
  });
  if (!ctx.far) {
    const P = blob([[-2.6, 5.4], [0.8, 5.2], [1.0, 9.8], [-2.4, 10.0]]);
    cel(g, P, PAL.pants, { sh: 0.5, hl: 0.3 });
    fill(g, 'M -1.4 5.0 L -0.2 5.0 L -0.2 6.6 L -1.4 6.6 Z', PAL.yellow.m);
  }
}

function shin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(PAL.pants), { sh: 1.3, hl: 0.35 });
  clip(g, SHIN, () => fill(g, 'M 1.2 -2 L 2.0 -2 L 1.6 16 L 0.8 16 Z', t(PAL.sky).m));
  cel(g, BOOT_SHAFT, t(PAL.boot), { sh: 0.6, hl: 0.3 });
  fill(g, 'M -2.3 10.6 L 2.2 10.4 L 2.2 11.2 L -2.3 11.4 Z', t(PAL.sky).m);
}

function foot(g, ctx) { boot(g, ctx, PAL.boot, PAL.yellow); }

// the face is always covered (see helmets.js)
function head(g) { kiteHelmet(g, PAL); }

export const KITE = {
  id: 'kite', name: 'KITE', role: 'KEŞİF', pal: PAL,
  pose: { nUpper: 0.12, nFore: -0.18, nHand: -0.08, fUpper: -1.75, fFore: -2.05, fHand: -0.25, nThigh: 0.14, nShin: 0.0, fThigh: -0.16, fShin: -0.06, head: 0.1 },
  parts: { torso, front, head, upper, fore, hand: handP, thigh, shin, foot },
};
