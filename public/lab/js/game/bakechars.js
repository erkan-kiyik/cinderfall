// Bake entries for runtime characters and their weapons.
import { charEntries } from '../anim/charbake.js';
import { WEAPONS } from '../art/weapons/index.js';
import { CHARS, WEAPON_MATS } from './chars.js';

export function charBakeList(ids, scale) {
  const E = [], weapons = new Set();
  for (const id of ids) {
    const s = CHARS[id];
    E.push(...charEntries(id, s, scale));
    if (s.weapon) weapons.add(s.mat ? `${s.weapon}.${s.mat}` : s.weapon);
  }
  for (const key of weapons) {
    const [id, mat] = key.split('.');
    const w = WEAPONS[id], m = mat ? WEAPON_MATS[mat] : undefined;
    E.push({ name: `w.${key}`, box: w.box, scale, paint: (g) => w.paint(g, m) });
  }
  return E;
}
