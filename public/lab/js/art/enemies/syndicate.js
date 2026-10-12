// ASH SYNDICATE — the mercenary army holding Sector 9. Cool steel-blue
// armour, faceless helmets with a red visor slit: readable as "enemy" from
// across the street, the opposite of the operators' warm palette.
import { cel, fill, stroke, clip, blob, curve } from '../kit.js';
import { M, tone } from '../style.js';
import { WEAPONS, MAT } from '../weapons/index.js';
import { UPPER, FORE, THIGH, SHIN, BOOT_SHAFT, hand, boot, NECK } from '../ops/common.js';

const PAL = {
  armor: tone('#9ab3cc', '#5e7d9c', '#3f5a76', '#1c2b3b'),
  suit: tone('#434f60', '#2c3644', '#1d242e', '#0c1015'),
  visor: M.visor,
  glove: M.black,
  boot: M.black,
  sole: M.rubber,
  white: M.white,
};

// The Syndicate's rifles: same frame, cold finish, red accent.
export const SYN_MAT = { ...MAT, poly: tone('#4a5566', '#323b48', '#222831', '#0e1116'), accent: M.visor };

// Syndicate mark: an inverted triangle (a falling cinder) crossed by a bar.
export function emblem(g, x, y, r, c) {
  stroke(g, `M ${x - r} ${y - r * 0.7} L ${x + r} ${y - r * 0.7} L ${x} ${y + r} Z`, c, r * 0.24);
  stroke(g, `M ${x - r * 0.45} ${y - r * 0.05} L ${x + r * 0.45} ${y - r * 0.05}`, c, r * 0.22);
}

function helmet(g) {
  cel(g, NECK, PAL.suit, { sh: 1.0, hl: 0 });
  const H = 'M -4.7 -7.0 C -5.1 -11.0 -2.9 -13.8 0.6 -13.8 C 3.9 -13.8 5.5 -11.7 5.5 -9.0 L 5.5 -5.4 C 5.5 -3.7 4.6 -2.4 3.2 -2.0 L 0.4 -2.0 C -1.8 -2.4 -3.7 -4.0 -4.7 -7.0 Z';
  cel(g, H, PAL.armor, { sh: 1.2, hl: 0.5 });
  clip(g, H, () => {
    // dark faceplate below the visor, a ridge over the crown
    fill(g, 'M 0.2 -6.6 L 7 -6.6 L 7 0 L 0.2 0 Z', PAL.suit.m);
    fill(g, 'M 0.2 -6.6 L 7 -6.6 L 7 -6.0 L 0.2 -6.0 Z', PAL.suit.k);
    for (const y of [-4.6, -3.6]) stroke(g, `M 2.6 ${y} L 5.6 ${y}`, PAL.suit.k, 0.26);
    stroke(g, curve([[-3.8, -11.0], [-0.6, -13.0], [3.6, -12.6]]), PAL.armor.l, 0.32);
    stroke(g, curve([[-4.4, -8.6], [-1.4, -9.6], [0.6, -9.0], [0.6, -6.6]]), PAL.armor.k, 0.26);
  });
  // glowing red visor slit wrapping the front
  g.save(); g.shadowColor = PAL.visor.m; g.shadowBlur = 7;
  fill(g, 'M 0.8 -8.6 L 5.6 -8.8 L 5.7 -7.0 L 0.8 -6.9 Z', PAL.visor.m);
  g.restore();
  fill(g, 'M 1.2 -8.3 L 5.4 -8.5 L 5.45 -7.9 L 1.2 -7.8 Z', PAL.visor.l);
  // ear module with an antenna stub
  cel(g, 'M -2.6 -8.6 L -0.6 -8.6 L -0.6 -5.2 L -2.6 -5.2 Z', PAL.suit, { sh: 0.3, hl: 0.2 });
  stroke(g, 'M -2.2 -8.6 L -3.4 -12.6', PAL.suit.m, 0.35);
}

const VEST = blob([[-6.8, -18.6], [-4.0, -20.6], [0.6, -21.2], [3.6, -20.6], [5.4, -19.0], [6.4, -15.0], [6.2, -10.6], [5.6, -6.0], [5.6, -3.0], [-5.4, -2.8], [-6.2, -8.0], [-7.0, -13.6]]);
const PELVIS = blob([[-5.4, -4.4], [5.4, -4.5], [5.6, -1.2], [3.6, 1.4], [0.4, 2.0], [-3.6, 1.4], [-5.6, -1.0]]);

function torso(g) {
  cel(g, PELVIS, PAL.suit, { sh: 1.0, hl: 0.4 });
  cel(g, VEST, PAL.suit, { sh: 1.6, hl: 0.45 });
  const PLATE = blob([[-4.8, -19.0], [1.2, -20.0], [5.4, -19.0], [6.8, -15.4], [6.4, -9.6], [5.2, -7.6], [-0.4, -7.2], [-5.4, -8.2], [-6.0, -13.0]]);
  cel(g, PLATE, PAL.armor, { sh: 1.7, hl: 0.55 });
  clip(g, PLATE, () => {
    stroke(g, curve([[-4.6, -13.4], [0.8, -14.0], [6.6, -13.4]]), PAL.armor.d, 0.3);
    fill(g, 'M 2.6 -18.0 L 5.6 -18.2 L 5.7 -15.6 L 2.7 -15.4 Z', PAL.suit.m);
    emblem(g, 4.15, -16.75, 0.95, PAL.white.m);
  });
  // ammo pouches and belt
  for (const x of [-3.4, -1.0, 1.4]) {
    const P = `M ${x} -7.6 L ${x + 2.1} -7.7 L ${x + 2.2} -4.4 L ${x + 0.1} -4.3 Z`;
    cel(g, P, PAL.suit, { sh: 0.4, hl: 0.25 });
    fill(g, `M ${x - 0.05} -7.8 L ${x + 2.15} -7.9 L ${x + 2.2} -6.8 L ${x} -6.7 Z`, PAL.armor.d);
  }
  cel(g, 'M -5.8 -4.4 C -1 -4.7 2.5 -4.7 5.8 -4.5 L 5.8 -2.8 C 2.5 -3.0 -1 -3.0 -5.8 -2.7 Z', PAL.suit, { sh: 0.35, hl: 0.2 });
}

function upper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL.suit), { sh: 1.4, hl: 0.45 });
  const PAD = blob([[-3.2, -2.0], [0.2, -3.0], [3.4, -1.8], [3.4, 3.0], [-3.2, 3.2]]);
  cel(g, PAD, t(PAL.armor), { sh: 0.8, hl: 0.4 });
  clip(g, PAD, () => fill(g, 'M -4 1.6 L 4 1.4 L 4 2.0 L -4 2.2 Z', t(PAL.visor).m));
}
function fore(g, ctx) {
  const t = ctx.t;
  cel(g, FORE, t(PAL.suit), { sh: 1.2, hl: 0.4 });
  cel(g, blob([[-2.1, 3.6], [2.0, 3.4], [1.9, 9.2], [-1.9, 9.4]]), t(PAL.armor), { sh: 0.6, hl: 0.35 });
}
function handP(g, ctx) { hand(g, ctx, PAL.glove, PAL.glove, false); }
function thigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(PAL.suit), { sh: 1.5, hl: 0.4 });
  clip(g, THIGH, () => stroke(g, curve([[-1.6, 10.4], [0.0, 11.2], [1.6, 11.6]]), t(PAL.suit).d, 0.26));
  const HP = blob([[-3.0, 0.6], [2.8, 0.4], [3.0, 5.4], [-2.8, 5.8]]);
  cel(g, HP, t(PAL.armor), { sh: 0.6, hl: 0.35 });
}
function shin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(PAL.suit), { sh: 1.3, hl: 0.35 });
  cel(g, BOOT_SHAFT, t(PAL.boot), { sh: 0.6, hl: 0.3 });
  const PAD = blob([[-1.0, -2.0], [2.2, -1.8], [3.2, 0.8], [2.8, 3.8], [0.4, 4.2], [-0.6, 1.4]]);
  cel(g, PAD, t(PAL.armor), { sh: 0.6, hl: 0.35 });
  clip(g, PAD, () => fill(g, 'M -2 1.2 L 4 0.8 L 4 1.5 L -2 1.9 Z', t(PAL.visor).m));
}
function foot(g, ctx) { boot(g, ctx, PAL.boot, PAL.sole); }

function chest(g) {
  const COL = 'M -5.0 -19.6 C -4.6 -22.0 -2.0 -23.0 1.0 -22.8 C 3.6 -22.6 5.0 -21.6 5.4 -19.8 L 4.8 -19.0 C 2.8 -18.6 -1.8 -18.4 -5.0 -19.6 Z';
  cel(g, COL, PAL.suit, { sh: 0.8, hl: 0.4 });
  clip(g, COL, () => stroke(g, curve([[-4.4, -20.6], [0.6, -21.6], [5.0, -20.4]]), PAL.armor.d, 0.3));
}

const PARTS = { torso, chest, head: helmet, upper, fore, hand: handP, thigh, shin, foot };

export const TETIKCI = {
  id: 'tetikci', name: 'TETİKÇİ', role: 'ASH SYNDICATE', pal: PAL,
  pose: {
    nThigh: 0.2, nShin: 0.06, fThigh: -0.26, fShin: -0.04, head: 0.02,
    gun: { w: WEAPONS.kestrel, at: [6.4, -41.4], ang: 0.4, k: 0.96, mat: SYN_MAT },
  },
  parts: PARTS,
};

// Shield trooper: heavier plates and a full-height riot shield.
function shieldFront(g, ctx) {
  const [hx, hy] = ctx.J.hip;
  g.save(); g.translate(-hx, -hy);
  shield(g);
  g.restore();
}

// Riot shield in root space (feet at the origin), as carried in the idle pose.
export function shield(g) {
  const S = 'M 6.4 -57.6 Q 6.4 -58.6 7.4 -58.4 L 14.6 -56.8 Q 15.6 -56.6 15.6 -55.6 L 15.6 -16.6 Q 15.6 -15.6 14.6 -15.4 L 7.4 -13.8 Q 6.4 -13.6 6.4 -14.6 Z';
  cel(g, S, PAL.armor, { sh: 1.6, hl: 0.6 });
  clip(g, S, () => {
    // viewport, red band, rim and stencil
    fill(g, 'M 8.2 -54.6 L 14.0 -53.6 L 14.0 -48.4 L 8.2 -48.8 Z', '#141c26');
    fill(g, 'M 8.6 -54.0 L 10.4 -53.7 L 9.2 -49.2 L 8.6 -49.2 Z', 'rgba(170,200,230,0.35)');
    fill(g, 'M 5 -32.6 L 17 -32.0 L 17 -29.6 L 5 -30.2 Z', PAL.visor.m);
    stroke(g, 'M 7.2 -57.0 L 7.2 -15.0', PAL.armor.l, 0.35);
    for (const [x, y] of [[8.0, -44], [14.0, -43.4], [8.0, -20], [14.0, -19.4]]) fill(g, `M ${x - 0.3} ${y} a 0.3 0.3 0 1 0 0.6 0 a 0.3 0.3 0 1 0 -0.6 0 Z`, PAL.armor.d);
    emblem(g, 11.0, -25.0, 2.0, PAL.white.m);
  });
}

function heavyTorso(g, ctx) {
  g.save(); g.scale(1.12, 1); torso(g, ctx); g.restore();
}
function heavyUpper(g, ctx) {
  upper(g, ctx);
  if (!ctx.far) {
    const P2 = blob([[-4.0, -2.6], [0.2, -3.8], [4.2, -2.4], [4.2, 2.0], [-4.0, 2.2]]);
    cel(g, P2, ctx.t(PAL.armor), { sh: 0.9, hl: 0.45 });
  }
}

export const KALKANLI = {
  id: 'kalkanli', name: 'KALKANLI', role: 'ASH SYNDICATE', pal: PAL,
  pose: { nUpper: -0.35, nFore: -1.45, nHand: -0.2, fUpper: -0.1, fFore: -0.4, fHand: -0.2, nThigh: 0.26, nShin: 0.06, fThigh: -0.3, fShin: -0.04, head: 0.04 },
  parts: { ...PARTS, torso: heavyTorso, upper: heavyUpper, front: shieldFront },
};
