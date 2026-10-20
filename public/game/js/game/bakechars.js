// Bake entries for runtime characters and their weapons.
import { charEntries, measure } from '../anim/charbake.js';
import { metalOver } from '../art/kit.js';
import { WEAPONS } from '../art/weapons/index.js';
import { ITEMS, FX_SHAPES } from '../art/weapons/items.js';
import { CHARS, WEAPON_MATS } from './chars.js';

// Weapon sprites per material: w.<id>[.<mat>] is the body; moving parts are
// w.<key>/<part>; '.o' variants carry a baked outline for loose debris
// (dropped magazines and guns), which is drawn outside the character slots.
export function weaponEntries(key, scale) {
  const [id, mat] = key.split('.');
  const w = WEAPONS[id], m = mat ? WEAPON_MATS[mat] : undefined;
  const E = [], seed = id.length * 7 + id.charCodeAt(0);
  // every part painted on its own, then the machined finish over it (docs §10.12)
  const fin = (part) => (g) => { w.paint(g, m, part); metalOver(g, w.box, seed); };
  E.push({ name: `w.${key}`, box: w.box, scale, paint: fin('body') });
  E.push({ name: `w.${key}.o`, box: [w.box[0] - 1, w.box[1] - 1, w.box[2] + 1, w.box[3] + 1], scale, outline: 0.85, paint: fin(undefined) });
  for (const part of w.parts) {
    if (part === 'body') continue;
    const paint = fin(part);
    E.push({ name: `w.${key}/${part}`, box: () => measure(paint, 40, 3), scale, paint });
    if (part === 'mag') E.push({ name: `w.${key}/mag.o`, box: () => { const b = measure(paint, 40, 3); return b && [b[0] - 1, b[1] - 1, b[2] + 1, b[3] + 1]; }, scale, outline: 0.85, paint });
  }
  return E;
}

// extra: weapon keys to bake besides the characters' own (the player's choices)
export function charBakeList(ids, scale, extra = []) {
  const E = [], weapons = new Set(extra);
  for (const id of ids) {
    const s = CHARS[id];
    E.push(...charEntries(id, s, scale));
    for (const w of [s.weapon, s.sidearm]) if (w) weapons.add(s.mat ? `${w}.${s.mat}` : w);
  }
  for (const key of weapons) E.push(...weaponEntries(key, scale));
  return E;
}

// Casings, knife, holster (outlined where they live outside a character slot)
// and white effect shapes.
export function itemBakeList(scale, fxScale) {
  const E = [];
  for (const [n, it] of Object.entries(ITEMS)) {
    const loose = n.startsWith('casing') || n.startsWith('pickup');
    E.push({ name: `i.${n}`, box: it.box, scale: loose ? scale * 1.5 : scale, paint: it.paint, outline: n.startsWith('pickup') ? 0.7 : loose ? 0.3 : 0 });
  }
  for (const [n, it] of Object.entries(FX_SHAPES)) E.push({ name: `fx.${n}`, box: it.box, scale: n === 'white' ? 2 : fxScale, paint: it.paint });
  return E;
}
