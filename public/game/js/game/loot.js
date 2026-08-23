// Boss Redeemables — the 1/1000 drop table.
//
// These never appear in a crate, never appear on the Trader's shelf, and cannot
// be bought at any price. The only way one enters a save is by killing a boss
// and winning a roll at BOSS_DROP_RATE. That scarcity is the entire point: a
// player carrying one has demonstrably ground bosses, and everyone who sees
// the silhouette knows it.
//
// They are also deliberately overpowered. A reward this rare that turned out
// to be sidegrade cosmetics would be a worse outcome than not dropping at all.

// One in a thousand, per boss kill.
export const BOSS_DROP_RATE = 1 / 1000;

// A pity floor so the chase is not pure cruelty: after this many boss kills
// without a redeemable, the next kill is guaranteed.
//
// The floor has to sit far out or it stops being a safety net and starts
// being the actual drop rate. At a 1200 floor the truncation is severe —
// P(natural gap > 1200) is ~30%, which drags the mean gap down to ~700 and
// makes the true rate 1/699, not the 1/1000 on the tin. At 5000 only ~0.7% of
// runs ever reach the floor, so the effective rate stays within a fraction of
// a percent of 1/1000 and the number quoted to players is honest.
export const BOSS_PITY_KILLS = 5000;

// `power` rows are what the stat panel prints, and what applyLoadout feeds
// into the player. Every one of these is a straight upgrade over the best
// craftable equivalent.
export const BOSS_DROPS = [
  {
    id: 'boss_annihilator',
    name: 'ANNIHILATOR — WARLORD\'S MINIGUN',
    slot: 'wpn_primary',
    rarity: 'ultraLimited',
    kind: 'Boss Redeemable',
    tag: 'BOSS',
    bossOnly: true,
    weaponId: 'minigun',
    perk: { damage: 0.35, recoil: 0.5 },
    apply: { type: 'weaponBody', weapon: 'minigun' },
    lore: 'Stripped from Warlord Kestrel. Spins up and does not stop.',
  },
  {
    id: 'boss_siegebreaker',
    name: 'SIEGEBREAKER — FOREMAN\'S LAUNCHER',
    slot: 'wpn_primary',
    rarity: 'ultraLimited',
    kind: 'Boss Redeemable',
    tag: 'BOSS',
    bossOnly: true,
    weaponId: 'rocket',
    perk: { damage: 0.45 },
    apply: { type: 'weaponBody', weapon: 'rocket' },
    lore: 'The Foreman used it to bring down his own factory. It still works.',
  },
  {
    id: 'boss_warden_plate',
    name: 'WARDEN PRIME — OPERATOR',
    slot: 'operator',
    rarity: 'ultraLimited',
    kind: 'Boss Redeemable',
    tag: 'BOSS',
    bossOnly: true,
    // The strongest perk block in the game, by a wide margin.
    perk: { maxHp: 40, maxArmor: 60, moveSpeed: 0.12, recoil: 0.3 },
    apply: { type: 'operator', variant: 'arctic' },
    lore: 'Warden Vesk\'s plate, refitted. Nothing in the sector hits harder.',
  },
  {
    id: 'boss_kingmaker',
    name: 'KINGMAKER — BLACKOUT BLADE',
    slot: 'knifeFinish',
    rarity: 'ultraLimited',
    kind: 'Boss Redeemable',
    tag: 'BOSS',
    bossOnly: true,
    perk: { damage: 0.25, moveSpeed: 0.15 },
    apply: { type: 'finish', weapon: 'knife', finish: 'eventide' },
    lore: 'Taken off Blackout Prime. The edge never cools.',
  },
];

const BY_ID = Object.fromEntries(BOSS_DROPS.map((d) => [d.id, d]));
export const bossDropById = (id) => BY_ID[id] || null;
export const isBossDrop = (id) => !!BY_ID[id];

// Rolls the table for one boss kill.
//
// `state` is the persisted counter block { since } — boss kills since the last
// redeemable — and is mutated in place by the caller's progression save. Items
// the player already owns are excluded before rolling, so a completed
// collection stops consuming rolls and the pity counter stops climbing.
//
// `luck` is the equipped perk block's Loot Luck multiplier. It scales the win
// chance only. Deliberately *not* the item pick: an earlier version fed a
// luck-divided rng into both, which silently biased selection toward the front
// of the pool whenever luck was above 1.
//
// Returns the won item, or null.
export function rollBossDrop(owned, state, rng = Math.random, luck = 1) {
  const pool = BOSS_DROPS.filter((d) => !owned(d.id));
  if (!pool.length) return null;                 // collection complete

  const since = state.since || 0;
  const chance = Math.min(1, BOSS_DROP_RATE * (luck > 0 ? luck : 1));
  const won = rng() < chance || since + 1 >= BOSS_PITY_KILLS;
  if (!won) {
    state.since = since + 1;
    return null;
  }
  state.since = 0;
  // Clamped: an rng that can return exactly 1 would otherwise index past the
  // end of the pool and hand back undefined, which reads as "no drop" and
  // silently eats a win.
  const i = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  return pool[i];
}
