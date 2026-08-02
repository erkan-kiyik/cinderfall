// Meta-economy: item catalog, rarity tiers, crate rolls and loadout apply.
// Crate drops reuse the game's existing weapon-finish and operator-skin art
// (baked in weapons.js / soldier.js) plus a couple of new energy finishes,
// so the reward loop ships without a pile of one-off assets. All ownership
// and equip state lives in Progression (localStorage-backed).

// `labelKey` resolves through i18n at render time; `label` is kept as the
// English fallback for any caller that hasn't been localized yet.
export const RARITY = {
  common:    { key: 'common',    label: 'COMMON',    labelKey: 'rarity.common',    color: '#8b93a2', glow: 'rgba(139,147,162,0.6)', weight: 58 },
  rare:      { key: 'rare',      label: 'RARE',      labelKey: 'rarity.rare',      color: '#4a90d9', glow: 'rgba(74,144,217,0.7)',  weight: 27 },
  epic:      { key: 'epic',      label: 'EPIC',      labelKey: 'rarity.epic',      color: '#a55cd6', glow: 'rgba(165,92,214,0.7)', weight: 11 },
  legendary: { key: 'legendary', label: 'LEGENDARY', labelKey: 'rarity.legendary', color: '#e0a13a', glow: 'rgba(224,161,58,0.85)', weight: 4 },
  // Diamond-store-only tiers — never rolled from a crate (rollCrate only
  // walks common/rare/epic/legendary), so `weight` here is just documentation.
  mythic:       { key: 'mythic',       label: 'MYTHIC',        labelKey: 'rarity.mythic',       color: '#e0446e', glow: 'rgba(224,68,110,0.85)', weight: 0 },
  ultraLimited: { key: 'ultraLimited', label: 'ULTRA LIMITED', labelKey: 'rarity.ultraLimited', color: '#4ee0d6', glow: 'rgba(78,224,214,0.9)',  weight: 0 },
};

// Diamond price by rarity for the direct-purchase store (crate-only
// "common" tier has no store price — it's never worth spending Diamonds on).
export const RARITY_DIAMOND_PRICE = {
  rare: 15, epic: 30, legendary: 50, mythic: 80, ultraLimited: 120,
};

// Crate cost in tokens.
export const CRATE_COST = 120;
// Duplicate drops refund this fraction of the crate cost.
export const DUPLICATE_REFUND = 0.4;

// Every unlockable cosmetic. `apply` tells applyLoadout how to mutate the
// player when the item is equipped. slot = which loadout key it occupies
// (one equipped item per slot).
export const CATALOG = [
  // -- rifle finishes --
  { id: 'rifle_urban',  name: 'VK-77 · URBAN',    slot: 'rifleFinish', rarity: 'common', kind: 'Rifle Skin',
    apply: { type: 'finish', weapon: 'rifle', finish: 'urban' } },
  { id: 'rifle_cinder', name: 'VK-77 · CINDER',   slot: 'rifleFinish', rarity: 'rare', kind: 'Rifle Skin',
    apply: { type: 'finish', weapon: 'rifle', finish: 'cinder' } },
  { id: 'rifle_arc',    name: 'ARC-9 · PULSE',    slot: 'rifleFinish', rarity: 'legendary', kind: 'Ray Rifle', tag: 'ENERGY',
    apply: { type: 'finish', weapon: 'rifle', finish: 'arc' } },

  // -- pistol finishes --
  { id: 'pistol_desert', name: 'C-9 · DESERT',    slot: 'pistolFinish', rarity: 'common', kind: 'Pistol Skin',
    apply: { type: 'finish', weapon: 'pistol', finish: 'desert' } },
  { id: 'pistol_onyx',   name: 'C-9 · ONYX',      slot: 'pistolFinish', rarity: 'rare', kind: 'Pistol Skin',
    apply: { type: 'finish', weapon: 'pistol', finish: 'onyx' } },
  { id: 'pistol_gold',   name: 'C-9 · GILDED',    slot: 'pistolFinish', rarity: 'epic', kind: 'Pistol Skin',
    apply: { type: 'finish', weapon: 'pistol', finish: 'gold' } },

  // -- smg finishes --
  { id: 'smg_viper',  name: 'P-12 · VIPER',       slot: 'smgFinish', rarity: 'rare', kind: 'SMG Skin',
    apply: { type: 'finish', weapon: 'smg', finish: 'viper' } },
  { id: 'smg_arc',    name: 'P-12 · TESLA',       slot: 'smgFinish', rarity: 'epic', kind: 'SMG Skin', tag: 'ENERGY',
    apply: { type: 'finish', weapon: 'smg', finish: 'arc' } },

  // -- knife finishes (energy "sword" blade) --
  { id: 'knife_ravage', name: 'TALON-7 · RAVAGE', slot: 'knifeFinish', rarity: 'rare', kind: 'Blade',
    apply: { type: 'finish', weapon: 'knife', finish: 'ravage' } },
  { id: 'knife_voidedge', name: 'VOID EDGE',      slot: 'knifeFinish', rarity: 'epic', kind: 'Energy Blade', tag: 'ENERGY',
    apply: { type: 'finish', weapon: 'knife', finish: 'voidedge' } },
  { id: 'knife_volt',   name: 'VOLT EDGE',        slot: 'knifeFinish', rarity: 'legendary', kind: 'Energy Blade', tag: 'ENERGY',
    apply: { type: 'finish', weapon: 'knife', finish: 'volt' } },

  // -- operator skins --
  { id: 'op_phantom', name: 'PHANTOM OPERATOR',   slot: 'operator', rarity: 'epic', kind: 'Operator',
    apply: { type: 'operator', variant: 'phantom' } },
  { id: 'op_nomad',   name: 'NOMAD OPERATOR',     slot: 'operator', rarity: 'rare', kind: 'Operator',
    apply: { type: 'operator', variant: 'nomad' } },
  { id: 'op_viper',   name: 'VIPER OPERATOR',     slot: 'operator', rarity: 'epic', kind: 'Operator', tag: 'STEALTH',
    apply: { type: 'operator', variant: 'viper' } },
  { id: 'op_arctic',  name: 'ARCTIC OPERATOR',    slot: 'operator', rarity: 'legendary', kind: 'Operator', tag: 'RECON',
    apply: { type: 'operator', variant: 'arctic' } },

  // -- Diamond-store exclusives: never drop from a crate (storeOnly), sold
  // directly for Diamonds at their rarity's RARITY_DIAMOND_PRICE. --
  { id: 'rifle_inferno', name: 'VK-77 · INFERNO', slot: 'rifleFinish', rarity: 'mythic', kind: 'Rifle Skin', tag: 'MYTHIC',
    storeOnly: true, apply: { type: 'finish', weapon: 'rifle', finish: 'inferno' } },
  { id: 'knife_bloodmoon', name: 'BLOODMOON', slot: 'knifeFinish', rarity: 'mythic', kind: 'Energy Blade', tag: 'MYTHIC',
    storeOnly: true, apply: { type: 'finish', weapon: 'knife', finish: 'bloodmoon' } },
  { id: 'knife_eventide', name: 'EVENTIDE — SECTOR 9 LAUNCH BLADE', slot: 'knifeFinish', rarity: 'ultraLimited', kind: 'Energy Blade', tag: 'EVENT',
    storeOnly: true, retiredAfter: Date.UTC(2026, 7, 9), apply: { type: 'finish', weapon: 'knife', finish: 'eventide' } },
];

// ---- weapon loadout: pick which weapon fills each arsenal slot. Only the
// starter three (below) are owned from the start — every other weapon is
// crate loot, same as cosmetics. `arsenal` names the slot in Player.arsenal
// the choice writes into. Rarity/tag are cosmetic.
export const WEAPON_SLOTS = [
  {
    key: 'wpn_primary', label: 'PRIMARY', arsenal: 'rifle',
    ids: ['rifle', 'battle', 'lmg', 'sniper', 'plasma', 'pulse', 'particle',
      'lightning', 'cryo', 'flame', 'eshotgun', 'lasersmg', 'railgun', 'ion', 'emp', 'gravity'],
  },
  {
    key: 'wpn_secondary', label: 'SIDEARM', arsenal: 'pistol',
    ids: ['pistol', 'raygun', 'quantum'],
  },
  {
    key: 'wpn_special', label: 'SPECIAL', arsenal: 'smg',
    ids: ['smg', 'lasersmg', 'plasma', 'pulse', 'ion', 'railgun', 'flame',
      'cryo', 'emp', 'gravity', 'particle', 'lightning', 'eshotgun'],
  },
];

// rarity/tag lookup so weapon cards get coloured frames like cosmetics.
const WEAPON_META = {
  rifle: ['common'], pistol: ['common'], smg: ['common'], battle: ['common'], lmg: ['rare'],
  sniper: ['rare'], raygun: ['legendary', 'ENERGY'], plasma: ['epic', 'ENERGY'],
  pulse: ['rare', 'ENERGY'], particle: ['epic', 'ENERGY'], lightning: ['epic', 'ENERGY'],
  cryo: ['rare', 'ENERGY'], flame: ['rare', 'ENERGY'], eshotgun: ['rare', 'ENERGY'],
  lasersmg: ['epic', 'ENERGY'], railgun: ['legendary', 'ENERGY'], ion: ['legendary', 'ENERGY'],
  emp: ['epic', 'ENERGY'], quantum: ['epic', 'ENERGY'], gravity: ['epic', 'ENERGY'],
};

// Every weapon id that can be selected.
export const ALL_WEAPON_IDS = [...new Set(WEAPON_SLOTS.flatMap((s) => s.ids))];

// Owned from the very start — everything else unlocks from crates (tokens
// or a rewarded ad). These match Player's built-in default arsenal, so a
// fresh save is always playable even with nothing else unlocked yet.
export const STARTER_WEAPON_IDS = ['rifle', 'pistol', 'smg'];

// Synthetic loadout "items" for the weapon pickers (name resolved from the
// live weapon defs at render time). A weapon can appear in more than one
// slot's id list (most energy weapons fill both PRIMARY and SPECIAL); each
// slot gets its own pickable entry, but ownership is granted for every
// variant together (see weaponVariantIds) so unlocking a gun frees it up
// everywhere it's eligible, not just the slot the crate happened to roll.
const WEAPON_ITEMS = ALL_WEAPON_IDS.flatMap((id) =>
  WEAPON_SLOTS.filter((s) => s.ids.includes(id)).map((s) => ({
    id: `${s.key}:${id}`, weaponId: id, slot: s.key, kind: 'Weapon',
    rarity: (WEAPON_META[id] || ['common'])[0], tag: (WEAPON_META[id] || [])[1],
    apply: { type: 'weaponBody', weapon: id },
  }))
);

// All per-slot item ids sharing a given weapon id (e.g. 'plasma' →
// ['wpn_primary:plasma', 'wpn_special:plasma']) — granted together on unlock.
export const weaponVariantIds = (weaponId) =>
  WEAPON_ITEMS.filter((i) => i.weaponId === weaponId).map((i) => i.id);

// One representative crate-loot entry per non-starter weapon id (dedupes
// weapons that occupy multiple slots so they don't get an inflated drop
// weight), combined with the cosmetic catalog for crate rolls.
const LOOT_WEAPON_ITEMS = ALL_WEAPON_IDS
  .filter((id) => !STARTER_WEAPON_IDS.includes(id))
  .map((id) => WEAPON_ITEMS.find((i) => i.weaponId === id));
// storeOnly cosmetics (Diamond-store exclusives) never enter crate loot.
export const LOOT_POOL = [...CATALOG.filter((i) => !i.storeOnly), ...LOOT_WEAPON_ITEMS];

const BY_ID = Object.fromEntries([...CATALOG, ...WEAPON_ITEMS].map((i) => [i.id, i]));
export const itemById = (id) => BY_ID[id] || null;
export const itemsForSlot = (slot) =>
  [...CATALOG, ...WEAPON_ITEMS].filter((i) => i.slot === slot);

// Ordered list of loadout slots for the loadout UI (weapons first).
export const LOADOUT_SLOTS = [
  { key: 'wpn_primary',  label: 'PRIMARY',     labelKey: 'slot.primary' },
  { key: 'wpn_secondary',label: 'SIDEARM',     labelKey: 'slot.sidearm' },
  { key: 'wpn_special',  label: 'SPECIAL',     labelKey: 'slot.special' },
  { key: 'operator',    label: 'OPERATOR',     labelKey: 'slot.operator' },
  { key: 'rifleFinish', label: 'RIFLE SKIN',   labelKey: 'slot.rifleSkin' },
  { key: 'pistolFinish',label: 'PISTOL SKIN',  labelKey: 'slot.pistolSkin' },
  { key: 'smgFinish',   label: 'SMG SKIN',     labelKey: 'slot.smgSkin' },
  { key: 'knifeFinish', label: 'BLADE',        labelKey: 'slot.blade' },
];

// Weighted rarity pick, then a uniform item of that rarity, drawn from the
// combined cosmetics + weapons loot pool. Falls back to a lower rarity if a
// tier happens to be empty. Returns a catalog/weapon item.
export function rollCrate(rng = Math.random) {
  const order = ['legendary', 'epic', 'rare', 'common'];
  const total = Object.values(RARITY).reduce((s, r) => s + r.weight, 0);
  let pick = rng() * total;
  let chosen = 'common';
  for (const key of ['common', 'rare', 'epic', 'legendary']) {
    pick -= RARITY[key].weight;
    if (pick <= 0) { chosen = key; break; }
  }
  // resolve to a concrete item; step down rarities if empty
  for (let i = order.indexOf(chosen); i < order.length; i++) {
    const pool = LOOT_POOL.filter((it) => it.rarity === order[i]);
    if (pool.length) return pool[Math.floor(rng() * pool.length)];
  }
  return LOOT_POOL[0];
}

// Applies the player's saved loadout to a freshly-built Player. `assets` is
// the boot asset bag (needs operator atlases + .weapons defs).
export function applyLoadout(player, progression, assets) {
  // operator skin
  const opId = progression.equipped('operator');
  if (opId) {
    const item = itemById(opId);
    const parts = item && assets[item.apply.variant];
    if (parts) player.parts = parts;
  }
  // weapon finishes (applied before weapon overrides so a chosen weapon wins)
  for (const slot of ['rifleFinish', 'pistolFinish', 'smgFinish', 'knifeFinish']) {
    const id = progression.equipped(slot);
    if (!id) continue;
    const item = itemById(id);
    if (item && item.apply.type === 'finish') {
      player.applyFinish(item.apply.weapon, item.apply.finish);
    }
  }
  // weapon selection → fill arsenal slots
  let specialAssigned = false;
  for (const slot of WEAPON_SLOTS) {
    const id = progression.equipped(slot.key);
    if (!id) continue;
    const item = itemById(id);
    const def = item && assets.weapons[item.apply.weapon];
    if (!def) continue;
    const a = player.arsenal[slot.arsenal];
    if (!a) continue;
    a.wpn = def;
    if (def.magSize !== undefined) { a.mag = def.magSize; a.reserve = def.reserve; }
    if (slot.key === 'wpn_special') specialAssigned = true;
  }
  if (specialAssigned) player.smgUnlocked = true;
}
