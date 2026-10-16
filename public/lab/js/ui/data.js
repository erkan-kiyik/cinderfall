// KOR LAB — catalogue data the menus show: operators and abilities,
// the weapon list (what exists now, what is coming), the campaign map and
// crate odds. Display text lives in the language files under these keys.
import { GUNS } from '../game/guns.js';

export const OPS = [
  { id: 'vex', name: 'FLINT', role: 'assault', color: '#ff6b2c', abil: [['dash', 'dash'], ['flash', 'flash'], ['overload', 'bolt']] },
  { id: 'hale', name: 'WARDEN', role: 'defense', color: '#3ee8e0', abil: [['wall', 'wall'], ['mine', 'mine'], ['turret', 'turret']] },
  { id: 'morrow', name: 'VESPER', role: 'control', color: '#a98bff', abil: [['smoke', 'smoke'], ['slow', 'slow'], ['blackout', 'blind']] },
  { id: 'kite', name: 'SKYE', role: 'recon', color: '#4aa8ff', abil: [['drone', 'drone'], ['heat', 'heat'], ['watch', 'radar']] },
  { id: 'brick', name: 'BULWARK', role: 'heavy', color: '#ffc93c', abil: [['charge', 'charge'], ['armor', 'armor'], ['unstop', 'shield']] },
];
// the code name shown for an operator (ids stay as they are in saves)
export const opName = (id) => (OPS.find((o) => o.id === id) || { name: id.toUpperCase() }).name;

// cls: weapon class key; ready: playable in this build
export const WEAPON_LIST = [
  { id: 'wren9', cls: 'pistol', ready: true, slot: 'side' },
  { id: 'mule', cls: 'pistol', name: 'MULE .50' },
  { id: 'hornet', cls: 'smg', name: 'HORNET' },
  { id: 'lynx', cls: 'smg', name: 'LYNX' },
  { id: 'kestrel', cls: 'rifle', ready: true, slot: 'primary' },
  { id: 'bastion', cls: 'rifle', name: 'BASTION BR' },
  { id: 'ramrod', cls: 'shotgun', ready: true, slot: 'primary' },
  { id: 'saw', cls: 'shotgun', name: 'SAW-20' },
  { id: 'marksman', cls: 'sniper', ready: true, slot: 'primary' },
  { id: 'longbow', cls: 'sniper', name: 'LONGBOW' },
  { id: 'anvil', cls: 'heavy', name: 'ANVIL LMG' },
  { id: 'thumper', cls: 'explosive', name: 'THUMPER GL' },
];
export const PRIMARIES = ['kestrel', 'ramrod', 'marksman', 'wren9'];

// 0..100 bars for the stat panel, from the gun data
export function gunBars(id) {
  const s = GUNS[id];
  if (!s) return null;
  const dps = (s.dmg * s.pellets * s.rpm) / 60;
  const spread = s.spread + s.moveSpread * 0.5;
  return {
    damage: Math.min(100, Math.round((s.dmg * s.pellets) / 1.2)),
    rate: Math.min(100, Math.round(s.rpm / 8)),
    range: Math.min(100, Math.round(s.falloff[1] / 17)),
    control: Math.max(5, Math.min(100, Math.round(100 - (s.climb.reduce((a, b) => a + b, 0) / s.climb.length) * 700 - spread * 400))),
    mobility: id === 'wren9' ? 92 : id === 'marksman' ? 58 : id === 'ramrod' ? 70 : 76,
    dps: Math.round(dps),
    mag: s.mag, rpm: s.rpm,
  };
}

// The campaign map: three acts, ten missions; act 1 (missions 1–3) is playable,
// each one opens when the one before it is done.
export const MISSIONS = [
  { id: 'm1', act: 1, x: 0.10, y: 0.62, ready: true },
  { id: 'm2', act: 1, x: 0.21, y: 0.36, ready: true },
  { id: 'm3', act: 1, x: 0.32, y: 0.66, boss: true, ready: true },
  { id: 'm4', act: 2, x: 0.44, y: 0.40 },
  { id: 'm5', act: 2, x: 0.53, y: 0.70 },
  { id: 'm6', act: 2, x: 0.62, y: 0.34 },
  { id: 'm7', act: 2, x: 0.71, y: 0.62, boss: true },
  { id: 'm8', act: 3, x: 0.80, y: 0.36 },
  { id: 'm9', act: 3, x: 0.88, y: 0.64 },
  { id: 'm10', act: 3, x: 0.95, y: 0.30, boss: true },
];

export const CRATES = [
  { id: 'std', color: '#9aa4b1', price: 300, odds: [['common', 62], ['rare', 28], ['epic', 8.5], ['legendary', 1.4], ['mythic', 0.1]] },
  { id: 'plus', color: '#4aa8ff', price: 750, odds: [['rare', 58], ['epic', 31], ['legendary', 9.5], ['mythic', 1.4], ['ultra', 0.1]] },
  { id: 'crow', color: '#ffc93c', price: 1600, odds: [['epic', 60], ['legendary', 32], ['mythic', 7.4], ['ultra', 0.6]] },
];
