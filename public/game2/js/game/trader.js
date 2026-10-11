// CROW — the scrap trader, and the data behind their stall.
//
// ---------------------------------------------------------------------------
// Why a trader instead of a store
// ---------------------------------------------------------------------------
// Cinderfall has one currency now: SCRAP, stripped off whatever the operator
// puts down. Scrap is not money — you cannot buy it, and nothing in the game
// costs real currency — so a "store" was the wrong fiction for spending it.
// What the sector actually has is a fence: someone who sits on the safe side
// of the line, takes salvage off operators, and hands back gear.
//
// That fence is CROW. Every transaction in the game goes through them: the
// rotating stall below, and the supply crates on the crates tab.
//
// ---------------------------------------------------------------------------
// The stall: crate mentality without the crate
// ---------------------------------------------------------------------------
// A flat catalogue priced by rarity is a spreadsheet — you look at it once,
// work out what you want, and never look again. A crate is the opposite: you
// come back because you do not know what is inside.
//
// The stall keeps the crate's pull without its randomness costing the player
// anything. CROW lays out a handful of pieces each day, drawn deterministically
// from the day index, some of them marked down hard. The roll is the same for
// a given day, so nothing can be re-rolled by relaunching the app, and every
// price is visible before you commit: you always know exactly what your scrap
// buys. What you do not know is what will be on the table tomorrow — and that
// is the part worth coming back for.
//
// Anything not on today's table is still buyable at full price from the
// browse-by-category grid underneath, so a player hunting one specific skin is
// never gated behind the roll.

// ---- restock cadence ----
// One roll per UTC day, same as the daily-mission cadence in progression.js so
// a player's whole "come back tomorrow" surface refreshes at one moment
// instead of drip-feeding all day.
export const DAY_MS = 86400000;
export function dayIndex(now = Date.now()) { return Math.floor(now / DAY_MS); }
export function msUntilRestock(now = Date.now()) { return DAY_MS - (now % DAY_MS); }

// How many pieces CROW puts on the table. Small enough to read at a glance on
// a phone, big enough that the roll feels like it has variety.
export const STALL_SIZE = 4;

// Markdowns. Exactly one piece a day is a deep cut — that is the hook — and
// the rest are mild, so the table reads as "a deal and some stock" rather than
// as a permanent sale that devalues the full-price grid.
export const DEEP_CUT = 0.45;    // 45% off
export const STALL_CUT = 0.15;   // 15% off

export function discountedPrice(base, cut) {
  return Math.max(1, Math.round((base * (1 - cut)) / 5) * 5);
}

export function formatCountdown(ms) {
  if (ms == null) return '';
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${sec}s`;
}

// Deterministic PRNG (Lehmer, same generator progression.js rolls missions
// with) so the stall is a pure function of the day: no stored state to sync,
// no way to re-roll by clearing a save.
function seeded(seed) {
  let s = (seed % 2147483646) + 1;
  return () => (s = (s * 48271) % 2147483647) / 2147483647;
}

// Rolls today's table from `pool` (already filtered to what is sellable).
// Returns [{ item, price, base, cut, deep }], most-discounted first.
//
// `priceOf` maps an item to its full scrap price. Items the player already
// owns are dropped *after* the roll rather than before it, so owning a piece
// never reshuffles the rest of the table — two players on the same day see the
// same stock in the same order, minus whatever they have already bought.
export function rollStall(pool, priceOf, ownsFn = () => false, day = dayIndex()) {
  if (!pool.length) return [];
  const rnd = seeded(day * 7919 + 13);
  const bag = [...pool];
  const picked = [];
  for (let i = 0; i < STALL_SIZE && bag.length; i++) {
    picked.push(bag.splice(Math.floor(rnd() * bag.length), 1)[0]);
  }
  return picked
    .map((item, i) => {
      const base = priceOf(item);
      const cut = i === 0 ? DEEP_CUT : STALL_CUT;
      return { item, base, cut, deep: i === 0, price: discountedPrice(base, cut), owned: ownsFn(item.id) };
    })
    .filter((offer) => !offer.owned);
}

// ---- CROW's line ----
// Picked from the player's state rather than at random, so the trader reacts
// to what you actually did: turning up broke, turning up loaded, or turning up
// having cleaned out the table. Keys resolve through i18n at render time.
export function traderLineKey({ scrap = 0, stallEmpty = false, cheapest = 0 }) {
  if (stallEmpty) return 'trader.line.cleaned';
  if (scrap <= 0) return 'trader.line.broke';
  if (cheapest && scrap < cheapest) return 'trader.line.short';
  if (scrap >= 3000) return 'trader.line.rich';
  return 'trader.line.default';
}

// ---- stall category filter chips ----
// `labelKey` resolves through i18n at render time; `label` is the English
// fallback.
export const TRADER_CATEGORIES = [
  { key: 'stall', label: "TODAY'S STALL", labelKey: 'cat.stall' },
  { key: 'guns', label: 'WEAPONS', labelKey: 'cat.guns' },
  { key: 'weapons', label: 'WEAPON SKINS', labelKey: 'cat.weapons' },
  { key: 'skins', label: 'CHARACTER SKINS', labelKey: 'cat.skins' },
  { key: 'knives', label: 'KNIFE SKINS', labelKey: 'cat.knives' },
  { key: 'limited', label: 'LIMITED TIME', labelKey: 'cat.limited' },
  { key: 'inventory', label: 'INVENTORY', labelKey: 'cat.inventory' },
];

// Which chips an item belongs under. Matched on `kind`/`slot` as meta.js
// actually shapes them: guns are `kind: 'Weapon'`, finishes live in
// `skin_<weaponId>` slots (so the blade's is `skin_knife`, not a `knifeFinish`
// slot that no longer exists), and operators sit in `operator`.
export function itemCategories(item) {
  const cats = new Set(['stall']);
  if (item.kind === 'Weapon') cats.add('guns');
  else if (item.slot === 'operator') cats.add('skins');
  else if (item.slot === 'skin_knife') cats.add('knives');
  else cats.add('weapons');
  // "Limited" is the two shelf-only tiers — neither can ever come out of a
  // crate, so the trader is the only place they exist.
  if (item.rarity === 'ultraLimited' || item.rarity === 'mythic') cats.add('limited');
  return cats;
}
