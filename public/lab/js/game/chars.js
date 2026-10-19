// KOR LAB — runtime character registry.
// Which painters, weapon and extras each character uses in game.
import { OPS } from '../art/ops/index.js';
import { TETIKCI, KALKANLI, HUCUMCU, GALL, SYN_MAT, shield } from '../art/enemies/syndicate.js';
import { drone } from '../art/ops/kite.js';
import { scarfSeg, SCARF } from '../art/ops/vex.js';
import { ponySeg, PONY } from '../art/ops/morrow.js';

export const CHARS = {
  vex: { op: OPS.vex, weapon: 'kestrel', sidearm: 'wren9', skip: ['backFar'], cloth: SCARF, extras: { scarf: { paint: scarfSeg, box: [-1, -1, 5, 1] } } },
  hale: { op: OPS.hale, weapon: 'ramrod', sidearm: 'wren9' },
  morrow: { op: OPS.morrow, weapon: 'wren9', skip: ['backFar'], cloth: PONY, extras: { scarf: { paint: ponySeg, box: [-1, -1, 5, 1] } } },
  kite: { op: OPS.kite, weapon: 'marksman', sidearm: 'wren9', skip: ['front'], extras: { drone } },
  brick: { op: OPS.brick, weapon: 'kestrel', sidearm: 'wren9', heavy: true, hp: 130 },
  tet: { op: TETIKCI, weapon: 'kestrel', mat: 'syn', enemy: true, hp: 100 },
  huc: { op: HUCUMCU, weapon: 'ramrod', mat: 'syn', enemy: true, hp: 90 },
  // the act 1 boss
  gall: { op: GALL, weapon: 'kestrel', mat: 'syn', enemy: true, heavy: true, hp: 1600 },
  // the riot shield stops bullets from the front (local space, root frame)
  kal: { op: KALKANLI, weapon: null, skip: ['front'], extras: { shield }, enemy: true, hp: 150, freeArms: KALKANLI.pose,
    shield: { x0: 6.4, x1: 15.6, y0: -58.4, y1: -13.6 } },
};
export const WEAPON_MATS = { syn: SYN_MAT };
