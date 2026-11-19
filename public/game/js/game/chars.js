// KOR — runtime character registry.
// Which painters, weapon and extras each character uses in game.
import { OPS } from '../art/ops/index.js';
import { TETIKCI, KALKANLI, HUCUMCU, GALL, VASQUEZ, SYN_MAT, shield } from '../art/enemies/syndicate.js';
import { drone } from '../art/ops/kite.js';
import { scarfSeg, SCARF } from '../art/ops/vex.js';
import { PRIMER } from '../art/weapons/index.js';

export const CHARS = {
  vex: { op: OPS.vex, weapon: 'kestrel', sidearm: 'wren9', skip: ['backFar'], cloth: SCARF, extras: { scarf: { paint: scarfSeg, box: [-1, -1, 5, 1] } } },
  hale: { op: OPS.hale, weapon: 'ramrod', sidearm: 'wren9' },
  morrow: { op: OPS.morrow, weapon: 'wren9' },
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
// The kinds added in docs §10.41 wear another kind's sprites (art) so the atlas grows by
// their guns only; a dye over the clothes (the costume tint) tells them apart at a glance,
// drop: sprites of that art they do not carry. armor: share of body damage that gets through.
Object.assign(CHARS, {
  // the marksman: the rifleman's kit, the long rifle, a laser on it (mission.js draws it)
  nis: { op: TETIKCI, art: 'tet', weapon: 'marksman', mat: 'syn', enemy: true, hp: 90, dye: '#c9c0b4' },
  // the grenadier: the rusher's gas mask, a short SMG, and grenades
  bom: { op: HUCUMCU, art: 'huc', weapon: 'lynx', mat: 'syn', enemy: true, hp: 100, dye: '#b9c49a' },
  // the heavy gunner: the shield man's plate without the shield, the machine gun
  agr: { op: KALKANLI, art: 'kal', drop: ['front', 'shield'], weapon: 'anvil', mat: 'syn', enemy: true, hp: 260, armor: 0.7, dye: '#9ea4b0' },
  // act 2's boss: Brandt, keeper of the drone works; the heavy plate, dyed rust, the machine gun
  brandt: { op: KALKANLI, art: 'kal', drop: ['front', 'shield'], weapon: 'anvil', mat: 'syn', enemy: true, heavy: true, hp: 2200, armor: 0.6, dye: '#d0886a' },
  // the last boss: Vasquez (art/enemies/syndicate.js), the battle rifle
  vasq: { op: VASQUEZ, weapon: 'bastion', mat: 'syn', enemy: true, heavy: true, hp: 2600, armor: 0.85, dye: '#9a96a6' },
});
// syn: Vorsa's issue; p: the primer the player's finishes are laid over
export const WEAPON_MATS = { syn: SYN_MAT, p: PRIMER };
