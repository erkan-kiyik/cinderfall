// VANTA SYNDICATE — the mercenary army holding the city. Cool steel-blue
// armour, faceless helmets with a red visor slit: readable as "enemy" from
// across the street, the opposite of the operators' warm palette.
import { cel, fill, stroke, clip, blob, curve } from '../kit.js';
import { M, tone } from '../style.js';
import { WEAPONS, MAT } from '../weapons/index.js';
import { NECK } from '../ops/common.js';
import { UPPER, FORE, THIGH, SHIN, BOOT_SHAFT, TORSO, PELVIS, ELBOW_PAD, glove, boot, kneePad, scaledHead, fold } from '../ops/body.js';

const PAL = {
  armor: tone('#9ab3cc', '#5e7d9c', '#3f5a76', '#1c2b3b'),
  suit: tone('#4b586a', '#323d4c', '#212935', '#0c1015'),
  visor: M.visor,
  glove: M.black,
  boot: M.black,
  sole: M.rubber,
  white: M.white,
};

// The Syndicate's rifles: same frame, cold finish, red accent.
export const SYN_MAT = { ...MAT, poly: tone('#4a5566', '#323b48', '#222831', '#0e1116'), accent: M.visor };

// Syndicate mark: an inverted triangle (a falling ember) crossed by a bar.
export function emblem(g, x, y, r, c) {
  stroke(g, `M ${x - r} ${y - r * 0.7} L ${x + r} ${y - r * 0.7} L ${x} ${y + r} Z`, c, r * 0.24);
  stroke(g, `M ${x - r * 0.45} ${y - r * 0.05} L ${x + r * 0.45} ${y - r * 0.05}`, c, r * 0.22);
}

function helmet(g) { scaledHead(g, () => helmet0(g)); }
function helmet0(g) {
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

const VEST = TORSO;
const PLATE = blob([[-5.2, -21.2], [1.2, -22.2], [5.8, -21.2], [7.4, -17.2], [7.0, -10.8], [5.6, -8.4], [-0.4, -8.0], [-5.8, -9.0], [-6.6, -14.4]]);

function torso(g) {
  cel(g, PELVIS, PAL.suit, { sh: 1.1, hl: 0.4 });
  cel(g, VEST, PAL.suit, { sh: 1.7, hl: 0.45 });
  clip(g, VEST, () => fold(g, [[-6.8, -14.0], [-6.2, -10.6], [-5.4, -8.2]], PAL.suit));
  cel(g, PLATE, PAL.armor, { sh: 1.8, hl: 0.55 });
  clip(g, PLATE, () => {
    stroke(g, curve([[-5.0, -14.8], [0.8, -15.4], [7.2, -14.8]]), PAL.armor.d, 0.32);
    stroke(g, curve([[-4.2, -20.8], [1.2, -21.4], [5.6, -20.6]]), PAL.armor.l, 0.3, 0.8);
    fill(g, 'M 2.8 -19.8 L 6.0 -20.0 L 6.1 -17.2 L 2.9 -17.0 Z', PAL.suit.m);
    emblem(g, 4.45, -18.45, 1.0, PAL.white.m);
  });
  // ammo pouches and belt
  for (const x of [-3.6, -1.0, 1.6]) {
    cel(g, `M ${x} -8.4 L ${x + 2.3} -8.5 L ${x + 2.4} -4.8 L ${x + 0.1} -4.7 Z`, PAL.suit, { sh: 0.4, hl: 0.25, lw: 0.28 });
    fill(g, `M ${x - 0.05} -8.6 L ${x + 2.35} -8.7 L ${x + 2.4} -7.5 L ${x} -7.4 Z`, PAL.armor.d);
  }
  cel(g, 'M -6.0 -5.0 C -1.2 -5.35 2.6 -5.35 5.8 -5.1 L 5.85 -3.2 C 2.6 -3.45 -1.2 -3.45 -6.05 -3.1 Z', PAL.suit, { sh: 0.35, hl: 0.2, lw: 0.28 });
  cel(g, 'M 2.7 -5.5 L 4.9 -5.55 L 4.9 -2.9 L 2.7 -2.85 Z', PAL.armor, { sh: 0.3, hl: 0.2, lw: 0.26 });
}

function upper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL.suit), { sh: 1.5, hl: 0.45 });
  clip(g, UPPER, () => fold(g, [[-1.8, 8.6], [-0.4, 9.6], [1.2, 9.8]], t(PAL.suit)));
  const PAD = blob([[-3.6, -2.6], [0.2, -3.6], [3.8, -2.4], [3.8, 3.2], [-3.6, 3.4]]);
  cel(g, PAD, t(PAL.armor), { sh: 0.9, hl: 0.4 });
  clip(g, PAD, () => fill(g, 'M -4 1.8 L 4 1.6 L 4 2.3 L -4 2.5 Z', t(PAL.visor).m));
}
function fore(g, ctx) {
  const t = ctx.t;
  cel(g, FORE, t(PAL.suit), { sh: 1.3, hl: 0.4 });
  cel(g, blob([[-2.4, 3.6], [2.3, 3.4], [2.1, 9.4], [-2.1, 9.6]]), t(PAL.armor), { sh: 0.6, hl: 0.35, lw: 0.28 });
  cel(g, ELBOW_PAD, t(PAL.armor), { sh: 0.5, hl: 0.3, lw: 0.28 });
}
function handP(g, ctx) { glove(g, ctx, PAL.glove, { knuckle: PAL.armor }); }
function thigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(PAL.suit), { sh: 1.6, hl: 0.45 });
  clip(g, THIGH, () => fold(g, [[-2.0, 12.4], [0.0, 13.4], [2.0, 13.4]], t(PAL.suit)));
  const HP = blob([[-3.4, 0.4], [3.2, 0.2], [3.4, 5.8], [-3.2, 6.2]]);
  cel(g, HP, t(PAL.armor), { sh: 0.7, hl: 0.35, lw: 0.28 });
}
function shin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(PAL.suit), { sh: 1.4, hl: 0.4 });
  cel(g, BOOT_SHAFT, t(PAL.boot), { sh: 0.7, hl: 0.35 });
  kneePad(g, ctx, PAL.armor, PAL.visor);
}
function foot(g, ctx) { boot(g, ctx, PAL.boot, PAL.sole, { toe: PAL.suit }); }

function chest(g) {
  const COL = 'M -5.4 -21.6 C -5.0 -24.2 -2.2 -25.2 1.0 -25.0 C 3.8 -24.8 5.4 -23.8 5.8 -21.8 L 5.2 -21.0 C 3.0 -20.6 -1.8 -20.4 -5.4 -21.6 Z';
  cel(g, COL, PAL.suit, { sh: 0.8, hl: 0.4 });
  clip(g, COL, () => stroke(g, curve([[-4.8, -22.6], [0.6, -23.7], [5.4, -22.4]]), PAL.armor.d, 0.32));
}

const PARTS = { torso, chest, head: helmet, upper, fore, hand: handP, thigh, shin, foot };

export const TETIKCI = {
  id: 'tetikci', name: 'TETİKÇİ', role: 'VANTA SYNDICATE', pal: PAL,
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
  id: 'kalkanli', name: 'KALKANLI', role: 'VANTA SYNDICATE', pal: PAL,
  pose: { nUpper: -0.35, nFore: -1.45, nHand: -0.2, fUpper: -0.1, fFore: -0.4, fHand: -0.2, nThigh: 0.26, nShin: 0.06, fThigh: -0.3, fShin: -0.04, head: 0.04 },
  parts: { ...PARTS, torso: heavyTorso, upper: heavyUpper, front: shieldFront },
};

// HÜCUMCU — the assault trooper: lighter kit, a hood and a respirator with
// two red lenses instead of the helmet, a shell bandolier across the chest and
// a red arm band, so the rusher reads differently at a glance.
const PAL_H = {
  ...PAL,
  armor: tone('#7b8798', '#56627a', '#3a4458', '#171d29'),
  hood: tone('#3c4352', '#2a2f3a', '#1c2028', '#0b0d11'),
  band: tone('#ff6b6b', '#e03a3a', '#a32424', '#4a0f0f'),
};

function hoodHead(g) { scaledHead(g, () => hoodHead0(g)); }
function hoodHead0(g) {
  cel(g, NECK, PAL_H.suit, { sh: 1.0, hl: 0 });
  // hood: a soft cowl falling to the shoulders at the back
  const HOOD = 'M -5.6 -2.0 C -6.4 -6.4 -5.4 -12.2 -0.6 -13.6 C 3.4 -14.4 5.6 -12.0 5.6 -9.0 L 5.2 -5.6 C 4.4 -4.0 2.4 -3.4 0.6 -3.0 L -1.8 0.6 Z';
  cel(g, HOOD, PAL_H.hood, { sh: 1.4, hl: 0.5 });
  clip(g, HOOD, () => {
    stroke(g, curve([[-4.6, -9.8], [-1.6, -12.6], [2.6, -12.8]]), PAL_H.hood.l, 0.3);
    stroke(g, curve([[-5.0, -3.4], [-3.0, -6.6], [-2.2, -10.4]]), PAL_H.hood.k, 0.3);
  });
  // face opening with a respirator: dark mask, two filters, red lenses
  const MASK = 'M 0.6 -10.4 C 3.0 -10.8 5.2 -10.0 5.4 -8.4 L 5.6 -5.6 C 6.6 -5.2 6.8 -3.8 6.0 -3.2 L 3.0 -2.4 C 1.4 -2.6 0.6 -3.6 0.4 -5.0 Z';
  cel(g, MASK, PAL_H.suit, { sh: 0.8, hl: 0.35 });
  cel(g, 'M 4.4 -5.2 C 5.8 -5.6 7.2 -5.0 7.2 -3.8 C 7.2 -2.6 5.8 -2.0 4.6 -2.4 Z', PAL_H.armor, { sh: 0.4, hl: 0.3 });
  stroke(g, 'M 5.4 -4.8 L 5.6 -2.6 M 6.3 -4.8 L 6.4 -2.8', PAL_H.armor.k, 0.22);
  g.save(); g.shadowColor = PAL.visor.m; g.shadowBlur = 6;
  for (const [x, y] of [[2.6, -7.9], [4.7, -8.0]]) fill(g, `M ${x - 0.85} ${y} a 0.85 0.75 0 1 0 1.7 0 a 0.85 0.75 0 1 0 -1.7 0 Z`, PAL.visor.m);
  g.restore();
  for (const [x, y] of [[2.4, -8.15], [4.5, -8.25]]) fill(g, `M ${x - 0.3} ${y} a 0.3 0.25 0 1 0 0.6 0 a 0.3 0.25 0 1 0 -0.6 0 Z`, PAL.visor.l);
}

function lightTorso(g) {
  cel(g, PELVIS, PAL_H.suit, { sh: 1.1, hl: 0.4 });
  cel(g, VEST, PAL_H.suit, { sh: 1.7, hl: 0.45 });
  const LPLATE = blob([[-4.8, -20.8], [1.2, -21.8], [5.4, -20.8], [6.8, -16.8], [6.4, -11.4], [-0.4, -10.8], [-5.4, -11.6], [-5.8, -15.8]]);
  cel(g, LPLATE, PAL_H.armor, { sh: 1.6, hl: 0.5 });
  clip(g, LPLATE, () => emblem(g, 3.6, -17.0, 0.95, PAL.white.m));
  // shell bandolier from the far shoulder to the near hip
  const BAND = 'M -6.0 -21.2 L -4.0 -22.2 L 6.6 -7.2 L 5.0 -5.8 Z';
  cel(g, BAND, PAL_H.hood, { sh: 0.5, hl: 0.25 });
  for (let k = 0; k < 7; k++) {
    const t = k / 6, x = -4.6 + t * 10.0, y = -20.6 + t * 13.6;
    fill(g, `M ${x - 0.55} ${y - 0.2} L ${x + 0.55} ${y - 0.95} L ${x + 1.05} ${y - 0.2} L ${x - 0.05} ${y + 0.55} Z`, MAT.shell.m);
    fill(g, `M ${x + 0.45} ${y - 0.85} L ${x + 0.75} ${y - 1.05} L ${x + 1.2} ${y - 0.35} L ${x + 0.95} ${y - 0.15} Z`, M.brass.m);
  }
  cel(g, 'M -6.0 -5.0 C -1.2 -5.35 2.6 -5.35 5.8 -5.1 L 5.85 -3.2 C 2.6 -3.45 -1.2 -3.45 -6.05 -3.1 Z', PAL_H.suit, { sh: 0.35, hl: 0.2, lw: 0.28 });
}
function lightUpper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL_H.suit), { sh: 1.5, hl: 0.45 });
  clip(g, UPPER, () => { fill(g, 'M -4 4.6 L 4 4.4 L 4 6.8 L -4 7.0 Z', t(PAL_H.band).m); fold(g, [[-1.8, 8.8], [-0.4, 9.7], [1.2, 9.9]], t(PAL_H.suit)); });
}
function lightChest(g) {
  const COL = 'M -5.4 -21.6 C -5.0 -23.6 -2.2 -24.4 1.0 -24.2 C 3.8 -24.0 5.4 -23.2 5.8 -21.6 L 5.2 -21.0 C 3.0 -20.6 -1.8 -20.4 -5.4 -21.6 Z';
  cel(g, COL, PAL_H.hood, { sh: 0.8, hl: 0.4 });
}

export const HUCUMCU = {
  id: 'hucumcu', name: 'HÜCUMCU', role: 'VANTA SYNDICATE', pal: PAL_H,
  pose: {
    nThigh: 0.24, nShin: 0.08, fThigh: -0.3, fShin: -0.05, head: 0.02,
    gun: { w: WEAPONS.ramrod, at: [6.0, -40.6], ang: 0.35, k: 0.96, mat: SYN_MAT },
  },
  parts: { ...PARTS, head: hoodHead, torso: lightTorso, upper: lightUpper, chest: lightChest },
};

// GALL — the Syndicate's secretary, the act 1 boss: a heavy officer in a
// long crimson coat over black plate, gold on the shoulders and a crested
// helmet with a wide red visor. Bigger plates, same rig.
const PAL_G = {
  ...PAL,
  armor: tone('#6a7080', '#474d5c', '#2f3440', '#101318'),
  suit: tone('#3a2c32', '#2a1d23', '#1c1217', '#0a0507'),
  coat: tone('#d4545e', '#a8333e', '#76202a', '#2e0a10'),
  gold: M.brass,
};

function gallHead(g) { scaledHead(g, () => gallHead0(g)); }
function gallHead0(g) {
  cel(g, NECK, PAL_G.suit, { sh: 1.0, hl: 0 });
  const H = 'M -5.0 -7.0 C -5.4 -11.4 -3.0 -14.2 0.6 -14.2 C 4.2 -14.2 5.8 -11.9 5.8 -9.0 L 5.8 -5.2 C 5.8 -3.5 4.8 -2.2 3.4 -1.8 L 0.4 -1.8 C -2.0 -2.2 -4.0 -4.0 -5.0 -7.0 Z';
  // the crest: a gold fin from brow to nape
  cel(g, 'M -4.6 -10.4 C -4.2 -15.6 0.4 -17.4 4.2 -15.0 L 3.2 -13.4 C 0.6 -14.8 -2.4 -13.8 -3.2 -10.0 Z', PAL_G.gold, { sh: 0.4, hl: 0.3, lw: 0.26 });
  cel(g, H, PAL_G.armor, { sh: 1.2, hl: 0.5 });
  clip(g, H, () => {
    fill(g, 'M 0.2 -6.4 L 7 -6.4 L 7 0 L 0.2 0 Z', PAL_G.suit.m);
    for (const y of [-4.6, -3.6, -2.6]) stroke(g, `M 2.4 ${y} L 5.8 ${y}`, PAL_G.gold.d, 0.24);
    stroke(g, curve([[-3.8, -11.4], [-0.6, -13.4], [3.8, -13.0]]), PAL_G.armor.l, 0.32);
  });
  g.save(); g.shadowColor = PAL.visor.m; g.shadowBlur = 8;
  fill(g, 'M 0.4 -9.2 L 5.9 -9.4 L 6.0 -6.8 L 0.4 -6.6 Z', PAL.visor.m);
  g.restore();
  fill(g, 'M 0.9 -8.9 L 5.7 -9.1 L 5.75 -8.4 L 0.9 -8.2 Z', PAL.visor.l);
  cel(g, 'M -2.8 -9.0 L -0.6 -9.0 L -0.6 -5.0 L -2.8 -5.0 Z', PAL_G.gold, { sh: 0.3, hl: 0.2, lw: 0.24 });
}
function gallTorso(g) {
  g.save(); g.scale(1.14, 1);
  cel(g, PELVIS, PAL_G.coat, { sh: 1.1, hl: 0.4 });
  cel(g, VEST, PAL_G.coat, { sh: 1.8, hl: 0.5 });
  clip(g, VEST, () => fold(g, [[-6.8, -14.0], [-6.2, -10.6], [-5.4, -8.2]], PAL_G.coat));
  cel(g, PLATE, PAL_G.armor, { sh: 1.8, hl: 0.55 });
  clip(g, PLATE, () => {
    stroke(g, curve([[-5.0, -14.8], [0.8, -15.4], [7.2, -14.8]]), PAL_G.armor.d, 0.32);
    fill(g, 'M 2.6 -20.0 L 6.2 -20.2 L 6.3 -16.8 L 2.7 -16.6 Z', PAL_G.suit.m);
    emblem(g, 4.45, -18.4, 1.1, PAL_G.gold.m);
  });
  // the sash across, gold buttons down the coat front, the belt with a gold buckle
  cel(g, 'M -5.6 -21.0 L -3.8 -21.8 L 6.8 -9.4 L 5.2 -8.4 Z', PAL.visor, { sh: 0.4, hl: 0.25, lw: 0.26 });
  for (const y of [-12.6, -10.4]) fill(g, `M 6.2 ${y} a 0.5 0.5 0 1 0 1 0 a 0.5 0.5 0 1 0 -1 0 Z`, PAL_G.gold.m);
  cel(g, 'M -6.0 -5.0 C -1.2 -5.35 2.6 -5.35 5.8 -5.1 L 5.85 -3.2 C 2.6 -3.45 -1.2 -3.45 -6.05 -3.1 Z', PAL_G.suit, { sh: 0.35, hl: 0.2, lw: 0.28 });
  cel(g, 'M 1.6 -5.6 L 4.2 -5.65 L 4.2 -2.8 L 1.6 -2.75 Z', PAL_G.gold, { sh: 0.3, hl: 0.2, lw: 0.26 });
  g.restore();
}
function gallChest(g) {
  const COL = 'M -5.6 -21.4 C -5.4 -25.0 -2.2 -26.0 1.0 -25.8 C 4.0 -25.6 5.8 -24.4 6.0 -21.6 L 5.2 -20.8 C 3.0 -20.4 -1.8 -20.2 -5.6 -21.4 Z';
  cel(g, COL, PAL_G.coat, { sh: 0.8, hl: 0.4 });
  clip(g, COL, () => stroke(g, curve([[-5.0, -22.8], [0.6, -24.0], [5.6, -22.6]]), PAL_G.gold.m, 0.4));
}
function gallUpper(g, ctx) {
  const t = ctx.t;
  cel(g, UPPER, t(PAL_G.coat), { sh: 1.5, hl: 0.45 });
  clip(g, UPPER, () => fold(g, [[-1.8, 8.6], [-0.4, 9.6], [1.2, 9.8]], t(PAL_G.coat)));
  // a gold epaulette with fringe over a black pauldron
  const PAD = blob([[-4.2, -2.8], [0.2, -4.0], [4.4, -2.6], [4.4, 2.6], [-4.2, 2.8]]);
  cel(g, PAD, t(PAL_G.armor), { sh: 0.9, hl: 0.45 });
  cel(g, blob([[-3.6, -3.0], [0.2, -3.8], [3.8, -2.8], [3.6, -0.8], [-3.4, -0.6]]), t(PAL_G.gold), { sh: 0.4, hl: 0.3, lw: 0.26 });
  for (let x = -3; x <= 3; x += 1.2) stroke(g, `M ${x} -0.8 L ${x} 1.0`, t(PAL_G.gold).d, 0.3);
}
function gallFore(g, ctx) {
  const t = ctx.t;
  cel(g, FORE, t(PAL_G.coat), { sh: 1.3, hl: 0.4 });
  cel(g, blob([[-2.5, 6.6], [2.4, 6.4], [2.3, 9.6], [-2.3, 9.8]]), t(PAL_G.suit), { sh: 0.4, hl: 0.25, lw: 0.26 });
  fill(g, 'M -2.4 6.6 L 2.4 6.4 L 2.4 7.1 L -2.4 7.3 Z', t(PAL_G.gold).m);
  cel(g, ELBOW_PAD, t(PAL_G.armor), { sh: 0.5, hl: 0.3, lw: 0.28 });
}
function gallThigh(g, ctx) {
  const t = ctx.t;
  cel(g, THIGH, t(PAL_G.suit), { sh: 1.6, hl: 0.45 });
  // the coat's skirt falls over the thigh
  const SK = blob([[-3.8, -0.6], [3.6, -0.8], [4.4, 11.6], [-3.4, 12.6]]);
  cel(g, SK, t(PAL_G.coat), { sh: 1.0, hl: 0.4, lw: 0.3 });
  clip(g, SK, () => { fill(g, 'M -4 11.0 L 5 10.2 L 5 13 L -4 13 Z', t(PAL_G.gold).m); fold(g, [[0.4, 2], [0.8, 7], [0.6, 11]], t(PAL_G.coat)); });
}
function gallShin(g, ctx) {
  const t = ctx.t;
  cel(g, SHIN, t(PAL_G.suit), { sh: 1.4, hl: 0.4 });
  cel(g, BOOT_SHAFT, t(PAL.boot), { sh: 0.7, hl: 0.35 });
  kneePad(g, ctx, PAL_G.armor, PAL_G.gold);
}

export const GALL = {
  id: 'gall', name: 'GALL', role: 'VANTA SYNDICATE', pal: PAL_G,
  pose: {
    nThigh: 0.2, nShin: 0.06, fThigh: -0.26, fShin: -0.04, head: 0.02,
    gun: { w: WEAPONS.kestrel, at: [6.4, -41.4], ang: 0.4, k: 0.96, mat: SYN_MAT },
  },
  parts: { ...PARTS, head: gallHead, torso: gallTorso, chest: gallChest, upper: gallUpper, fore: gallFore, thigh: gallThigh, shin: gallShin },
};
