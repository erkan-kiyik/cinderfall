// A hostile's hit box, and where on it the head begins — defined once.
//
// Every shot path (player hitscan and beams, energy projectiles), the hit
// reaction's head/torso/leg split, the touch reticle's target test and the
// debug overlay read these. They used to be literals in each of those places,
// and had drifted: projectiles tested a 28-wide box against everyone else's
// 26, and the head reaction began at 0.80 x 134 = 107.2 above the feet while
// headshot damage began at 108, so a round landing between the two got the
// head's reaction and the body's damage. Spec §6.4: one definition of "this
// is the head".
//
// All three are in unscaled world units; bosses scale them by hitboxScale.
export const HIT_BOX_W = 26;
export const HIT_BOX_H = 134;
export const HEAD_LINE = 108;   // height above the feet where the head starts

export function hitBox(e) {
  const s = e.hitboxScale || 1;
  return { x: e.x - (HIT_BOX_W / 2) * s, y: e.y - HIT_BOX_H * s, w: HIT_BOX_W * s, h: HIT_BOX_H * s };
}

// True when a round at world height `hy` struck the head.
export function isHeadHit(e, hy) {
  return hy <= e.y - HEAD_LINE * (e.hitboxScale || 1);
}
