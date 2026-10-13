// KITE — recon. Light, quick, always listening. Signature shapes: the
// auburn bob under a white recon helmet with a sky visor and a big yellow
// headset, the white
// tech jacket with sky side panels and a chest tablet, and her scout drone.
// Built on the body standard in body.js; the face is always covered.
import { M, tone } from '../style.js';
import {
  cel, fill, stroke, clip, blob, curve, fold,
  UPPER, FORE, THIGH, SHIN, BOOT_SHAFT, TORSO, PELVIS,
  glove, boot, kneePad, belt,
} from './body.js';

const PAL = {
  skin: tone('#f6cdb0', '#e2a986', '#b97d5e', '#7c4634'),
  coat: tone('#ffffff', '#e8edf3', '#b9c5d3', '#5f6d80'),
  sky: tone('#8fd0ff', '#4aa8ff', '#2d77c4', '#123a66'),
  yellow: tone('#fff0a0', '#ffd23f', '#c99a10', '#5e4605'),
  pants: tone('#5f6b80', '#475266', '#323a4a', '#161a22'),
  hair: tone('#f09160', '#cc5f33', '#93401f', '#4a1c0c'),
  dark: tone('#4d5664', '#363d49', '#252a33', '#111419'),
  lens: M.lens,
  glove: tone('#4d5664', '#363d49', '#252a33', '#111419'),
  boot: M.white,
};

// --- torso -------------------------------------------------------------------------
const JACKET = blob([
  [-2.0, -23.4], [-5.0, -22.8], [-7.6, -21.4], [-8.4, -19.0], [-8.0, -15.4], [-6.6, -11.6], [-5.6, -8.2], [-6.0, -4.6], [-5.8, -2.2],
  [5.4, -2.6], [5.2, -5.6], [4.8, -8.6], [5.5, -12.4], [6.2, -16.2], [5.9, -19.8], [3.8, -22.5], [1.2, -23.7],
]);
function torso(g) {
  cel(g, PELVIS, PAL.pants, { sh: 1.1, hl: 0.4 });
  cel(g, TORSO, PAL.dark, { sh: 1, hl: 0.3, line: false });
  // hood bunched behind the neck
  const HOOD = blob([[-6.6, -23.2], [-3.2, -25.0], [0.2, -24.8], [0.0, -21.8], [-4.0, -21.0], [-7.0, -21.4]]);
  cel(g, HOOD, PAL.coat, { sh: 0.8, hl: 0.4 });
  clip(g, HOOD, () => stroke(g, curve([[-6.2, -22.6], [-3.2, -23.8], [-0.2, -23.4]]), PAL.coat.d, 0.3));
  cel(g, JACKET, PAL.coat, { sh: 1.9, hl: 0.55 });
  clip(g, JACKET, () => {
    // sky side panel from the armpit to the hem and the hem band
    fill(g, 'M -10 -17 C -7.4 -17 -5.8 -15 -5.4 -11 C -5.0 -7 -5.2 -4 -5.4 0 L -10 0 Z', PAL.sky.m);
    fill(g, 'M -10 -17 C -7.4 -17 -5.8 -15 -5.4 -11 L -5.8 -11 C -6.2 -15 -7.6 -16.6 -10 -16.6 Z', PAL.sky.d);
    fill(g, 'M -9 -4.2 C -3 -3.6 2 -3.6 8 -4.4 L 8 0 L -9 0 Z', PAL.sky.m);
    // yellow zip and pull, a seam under the chest
    stroke(g, curve([[2.8, -22.2], [3.1, -16.0], [2.9, -9.0], [2.7, -4.2]]), PAL.yellow.d, 0.36);
    fill(g, 'M 2.6 -21.6 L 3.5 -21.7 L 3.6 -19.8 L 2.7 -19.7 Z', PAL.yellow.m);
    fold(g, [[-3.6, -11.0], [-1.0, -10.2], [1.6, -10.4]], PAL.coat);
    stroke(g, 'M 4.4 -4.2 C 4.8 -2.8 4.6 -1.4 4.2 -0.6', PAL.yellow.m, 0.32);
  });
  // chest rig: one diagonal strap and a belly band carrying the drone tablet
  for (const d of ['M -5.0 -21.6 L -3.4 -22.0 L 5.6 -11.6 L 4.2 -10.8 Z', 'M -5.0 -11.8 L 5.8 -12.4 L 5.8 -10.8 L -5.0 -10.2 Z']) cel(g, d, PAL.dark, { sh: 0.3, hl: 0.2, lw: 0.28 });
  const TAB = 'M -0.6 -18.2 L 5.6 -18.6 L 5.8 -12.8 L -0.4 -12.4 Z';
  cel(g, TAB, PAL.dark, { sh: 0.5, hl: 0.3 });
  const SCR = 'M 0.1 -17.6 L 5.0 -17.9 L 5.15 -13.4 L 0.25 -13.1 Z';
  g.save(); g.shadowColor = PAL.lens.m; g.shadowBlur = 5; fill(g, SCR, PAL.lens.d); g.restore();
  clip(g, SCR, () => {
    stroke(g, 'M 0.6 -14.3 L 1.8 -15.7 L 2.9 -14.8 L 4.5 -16.6', PAL.lens.l, 0.32);
    fill(g, 'M 3.7 -14.4 a 0.42 0.42 0 1 0 0.84 0 a 0.42 0.42 0 1 0 -0.84 0 Z', PAL.yellow.m);
  });
}
function chest(g) { belt(g, { belt: PAL.dark, buckle: PAL.yellow }); }

function front(g, ctx) {
  // the scout drone over the raised far hand (board pose only; in game it is
  // its own sprite)
  const [hx, hy] = ctx.J.hip, [wx, wy] = ctx.J.fWr;
  g.save(); g.translate(wx - hx + 1.6, wy - hy - 9.2); g.rotate(-0.08); drone(g); g.restore();
}

// The scout drone, centred on its body.
export function drone(g) {
  const BODY = blob([[-3.2, -0.6], [-1.0, -1.6], [2.6, -1.4], [3.8, 0.0], [2.8, 1.4], [-1.6, 1.6], [-3.4, 0.8]]);
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
  g.save(); g.shadowColor = PAL.lens.m; g.shadowBlur = 5;
  fill(g, 'M 2.3 0.9 a 0.8 0.8 0 1 0 1.6 0 a 0.8 0.8 0 1 0 -1.6 0 Z', PAL.dark.k);
  fill(g, 'M 2.65 0.9 a 0.45 0.45 0 1 0 0.9 0 a 0.45 0.45 0 1 0 -0.9 0 Z', PAL.lens.m);
  g.restore();
  stroke(g, 'M -1.6 1.6 L -2.2 3.0 M 1.6 1.6 L 2.2 3.0 M -3.0 3.0 L 3.0 3.0', PAL.dark.m, 0.4);
}

// --- arms ----------------------------------------------------------------------------
function upper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL.coat), { sh: 1.5, hl: 0.45 });
  clip(g, UPPER, () => {
    fill(g, 'M -4 -4 L -1.4 -4 L -1.2 12 L -4 12 Z', t(PAL.sky).m);
    fold(g, [[-1.0, 7.0], [0.4, 8.0], [1.8, 8.2]], t(PAL.coat));
  });
}
function fore(g, ctx) {
  const t = ctx.t;
  cel(g, FORE, t(PAL.coat), { sh: 1.3, hl: 0.4 });
  const GUARD = blob([[-2.5, 3.2], [2.4, 3.0], [2.2, 9.6], [-2.2, 9.8]]);
  cel(g, GUARD, t(PAL.sky), { sh: 0.6, hl: 0.35 });
  clip(g, GUARD, () => stroke(g, curve([[-1.6, 3.8], [0.4, 3.6], [1.8, 4.2]]), t(PAL.sky).l, 0.28, 0.8));
  fill(g, 'M -2.5 5.8 L 2.5 5.6 L 2.5 6.7 L -2.5 6.9 Z', t(PAL.yellow).m);
}
function hand(g, ctx) { glove(g, ctx, PAL.glove, { fingerless: PAL.skin, cuff: PAL.sky }); }

// --- legs ----------------------------------------------------------------------------
function thigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(PAL.pants), { sh: 1.6, hl: 0.45 });
  clip(g, THIGH, () => {
    fill(g, 'M 2.0 -2 L 2.9 -2 L 2.4 16 L 1.5 16 Z', t(PAL.sky).m);
    fold(g, [[-2.0, 12.0], [0.0, 13.0], [1.8, 13.0]], t(PAL.pants));
  });
  if (!ctx.far) {
    cel(g, 'M -2.8 5.0 L 1.0 4.8 L 1.2 10.2 L -2.6 10.4 Z', PAL.pants, { sh: 0.5, hl: 0.3, lw: 0.28 });
    fill(g, 'M -1.6 4.6 L -0.3 4.6 L -0.3 6.4 L -1.6 6.4 Z', PAL.yellow.m);
  }
}
function shin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(PAL.pants), { sh: 1.4, hl: 0.4 });
  clip(g, SHIN, () => fill(g, 'M 1.4 -2 L 2.3 -2 L 1.9 16 L 1.0 16 Z', t(PAL.sky).m));
  cel(g, BOOT_SHAFT, t(PAL.boot), { sh: 0.7, hl: 0.35 });
  fill(g, 'M -2.6 10.8 L 2.5 10.6 L 2.5 11.5 L -2.6 11.7 Z', t(PAL.sky).m);
  kneePad(g, ctx, PAL.dark, PAL.sky);
}
function foot(g, ctx) { boot(g, ctx, PAL.boot, PAL.yellow, { toe: PAL.sky, lace: PAL.sky.d }); }

// --- head: light recon helmet, sky visor down, face guard, the yellow headset -----------
// No face shows; the auburn bob shows under the helmet at the nape.
function head(g) {
  const H = PAL.hair, D = PAL.dark;
  cel(g, 'M -2.5 1.6 L 2.7 1.4 L 2.6 -2.6 L 0.8 -3.6 L -2.4 -4.2 Z', D, { sh: 1.2, hl: 0 });
  // the bob falling below the helmet at the back
  const BOB = blob([[-4.6, -6.4], [-2.0, -6.6], [-1.2, -4.6], [-1.0, -2.4], [-2.6, -1.8], [-4.4, -2.6], [-4.9, -4.4]]);
  cel(g, BOB, H, { sh: 0.8, hl: 0.35, lw: 0.28 });
  clip(g, BOB, () => { for (const x of [-3.8, -2.8]) stroke(g, `M ${x} -5.6 C ${x + 0.3} -4.4 ${x + 0.3} -3.4 ${x + 0.1} -2.4`, H.d, 0.26); });
  // dark face guard over the mouth and chin
  const FG = 'M 0.6 -5.6 L 5.0 -5.4 C 5.3 -4.0 4.9 -2.6 3.8 -1.9 C 2.6 -1.3 1.2 -1.5 0.1 -2.2 C -0.3 -3.3 -0.1 -4.6 0.6 -5.6 Z';
  cel(g, FG, D, { sh: 0.8, hl: 0.35, lw: 0.28 });
  clip(g, FG, () => { for (const y of [-4.2, -3.4, -2.6]) stroke(g, `M 2.6 ${y} L 4.8 ${y - 0.1}`, D.k, 0.26); });
  // helmet shell: white with a sky stripe over the crown
  const SH = 'M -4.3 -6.2 C -4.6 -9.4 -2.4 -11.6 0.7 -11.7 C 3.6 -11.8 5.2 -10.0 5.3 -8.0 L 5.2 -7.2 L 0.4 -7.4 L -1.4 -6.4 L -3.8 -5.6 Z';
  cel(g, SH, PAL.coat, { sh: 1.3, hl: 0.5 });
  clip(g, SH, () => {
    fill(g, 'M -1.0 -12.2 L 0.6 -12.2 L -0.6 -6.0 L -2.2 -6.0 Z', PAL.sky.m);
    stroke(g, curve([[-3.2, -9.6], [-0.4, -11.2], [3.0, -11.0]]), '#ffffff', 0.3, 0.9);
    stroke(g, curve([[-3.8, -6.4], [-1.6, -7.0], [0.6, -7.4]]), PAL.coat.k, 0.26);
  });
  // the visor down over the eyes: reflective sky glass with a yellow HUD ring
  const VIS = 'M 0.3 -8.4 C 2.0 -8.9 4.0 -8.7 5.5 -7.8 L 5.5 -5.6 C 4.0 -5.1 2.0 -5.1 0.5 -5.6 C 0.1 -6.5 0.1 -7.5 0.3 -8.4 Z';
  fill(g, VIS, '#10233a');
  clip(g, VIS, () => {
    const gr = g.createLinearGradient(0.3, -8.6, 5.5, -5.2);
    gr.addColorStop(0, PAL.sky.l + 'cc'); gr.addColorStop(0.5, PAL.sky.d + '55'); gr.addColorStop(1, PAL.sky.m + '99');
    g.fillStyle = gr; g.fill(new Path2D(VIS));
    fill(g, 'M 1.0 -8.6 L 1.9 -8.7 L 1.0 -5.3 L 0.1 -5.3 Z', '#ffffff', 0.35);
    g.save(); g.shadowColor = PAL.yellow.m; g.shadowBlur = 4;
    stroke(g, 'M 3.2 -6.9 a 0.75 0.75 0 1 0 1.5 0 a 0.75 0.75 0 1 0 -1.5 0 Z', PAL.yellow.m, 0.24);
    g.restore();
  });
  stroke(g, VIS, D.k, 0.3);
  // headband and the big yellow ear cup, antenna stub and boom mic
  stroke(g, 'M -1.4 -7.2 C -2.0 -9.4 -1.4 -11.2 0.2 -11.9', D.k, 0.9);
  stroke(g, 'M -1.4 -7.2 C -2.0 -9.4 -1.4 -11.2 0.2 -11.9', D.m, 0.55);
  const CUP = 'M -3.0 -5.6 a 1.75 1.95 0 1 0 3.5 0 a 1.75 1.95 0 1 0 -3.5 0 Z';
  cel(g, CUP, PAL.yellow, { sh: 0.6, hl: 0.35, lw: 0.3 });
  fill(g, 'M -2.05 -5.6 a 0.8 0.95 0 1 0 1.6 0 a 0.8 0.95 0 1 0 -1.6 0 Z', D.m);
  g.save(); g.shadowColor = PAL.sky.m; g.shadowBlur = 4; fill(g, 'M -1.5 -5.6 a 0.28 0.28 0 1 0 0.56 0 a 0.28 0.28 0 1 0 -0.56 0 Z', PAL.sky.l); g.restore();
  stroke(g, 'M -2.4 -7.0 L -3.6 -9.4', D.k, 0.4);
  fill(g, 'M -4.0 -9.8 a 0.42 0.42 0 1 0 0.84 0 a 0.42 0.42 0 1 0 -0.84 0 Z', PAL.yellow.m);
}

export const KITE = {
  id: 'kite', name: 'KITE', role: 'KEŞİF', pal: PAL,
  pose: { nUpper: 0.12, nFore: -0.18, nHand: -0.08, fUpper: -1.75, fFore: -2.05, fHand: -0.25, nThigh: 0.14, nShin: 0.0, fThigh: -0.16, fShin: -0.06, head: 0.1 },
  parts: { torso, chest, front, head, upper, fore, hand, thigh, shin, foot },
};
