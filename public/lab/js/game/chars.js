// CINDERFALL LAB — runtime character registry.
// Which painters, weapon and extras each character uses in game.
import { OPS } from '../art/ops/index.js';
import { TETIKCI, KALKANLI, SYN_MAT, shield } from '../art/enemies/syndicate.js';
import { drone } from '../art/ops/kite.js';
import { scarfSeg, SCARF } from '../art/ops/vex.js';

export const CHARS = {
  vex: { op: OPS.vex, weapon: 'kestrel', skip: ['backFar'], cloth: SCARF, extras: { scarf: { paint: scarfSeg, box: [-1, -1, 5, 1] } } },
  hale: { op: OPS.hale, weapon: 'ramrod' },
  morrow: { op: OPS.morrow, weapon: 'wren9' },
  kite: { op: OPS.kite, weapon: 'marksman', skip: ['front'], extras: { drone } },
  brick: { op: OPS.brick, weapon: 'kestrel', heavy: true },
  tet: { op: TETIKCI, weapon: 'kestrel', mat: 'syn', enemy: true },
  kal: { op: KALKANLI, weapon: null, skip: ['front'], extras: { shield }, enemy: true, freeArms: KALKANLI.pose },
};
export const WEAPON_MATS = { syn: SYN_MAT };
