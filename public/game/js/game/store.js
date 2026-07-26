// Premium store catalog: Diamond packages, rotating special-offer bundles,
// and the availability rules that drive their countdown timers. Diamonds
// spend/earn through Progression's existing gems fields (see diamonds
// getter there) — this module is pure data + scheduling helpers.

export const DIAMOND_ICON = '◆';

// ---- Buy Diamonds ----
// `bonusPercent` is a display badge only — `diamonds` is already the full
// amount granted (it's not added on top).
export const DIAMOND_PACKAGES = [
  { id: 'diamonds_starter',  name: 'STARTER PACK',  diamonds: 20,   bonusPercent: 0,  priceTL: 20,  badge: null },
  { id: 'diamonds_popular',  name: 'POPULAR PACK',  diamonds: 50,   bonusPercent: 10, priceTL: 45,  badge: 'POPULAR', popular: true },
  { id: 'diamonds_hunter',   name: 'HUNTER PACK',   diamonds: 120,  bonusPercent: 17, priceTL: 99,  badge: null },
  { id: 'diamonds_elite',    name: 'ELITE PACK',    diamonds: 300,  bonusPercent: 24, priceTL: 229, badge: null },
  { id: 'diamonds_ultimate', name: 'ULTIMATE PACK', diamonds: 700,  bonusPercent: 29, priceTL: 499, badge: 'BEST VALUE' },
  { id: 'diamonds_legend',   name: 'LEGEND PACK',   diamonds: 1500, bonusPercent: 40, priceTL: 899, badge: 'BEST VALUE' },
];

export const diamondPackageById = (id) => DIAMOND_PACKAGES.find((p) => p.id === id) || null;

// ---- Special Offers: rotating bundles ----
// availability:
//   'always'    — permanently listed
//   'daily'     — visible on a countdown to the next UTC-midnight reset
//   'weekend'   — visible Fri–Sun UTC only, counts down to Sunday's end
//   'newPlayer' — visible for `days` days after Progression.firstPlayed
export const BUNDLES = [
  {
    id: 'bundle_starter', name: 'STARTER BUNDLE', badge: null,
    contents: ['20 Diamonds', 'Exclusive Weapon Skin', '500 Coins'],
    priceTL: 39, originalTL: 69,
    grant: { gems: 20, coins: 500, item: 'rifle_cinder' },
    availability: 'always', oneTime: true,
  },
  {
    id: 'bundle_limited', name: 'LIMITED BUNDLE', badge: 'LIMITED',
    contents: ['50 Diamonds', 'Epic Character Skin', 'Knife Skin'],
    priceTL: 79, originalTL: 139,
    grant: { gems: 50, items: ['op_phantom', 'knife_ravage'] },
    availability: 'daily', oneTime: true,
  },
  {
    id: 'bundle_weekend', name: 'WEEKEND SALE', badge: 'SALE',
    contents: ['25% OFF the next Diamond package you buy this weekend'],
    priceTL: null, discountPercent: 25,
    availability: 'weekend', oneTime: false,
  },
  {
    id: 'bundle_newplayer', name: 'NEW PLAYER BUNDLE', badge: 'NEW',
    contents: ['30 Diamonds', '300 Coins', 'Rare Rifle Skin'],
    priceTL: 19, originalTL: 49,
    grant: { gems: 30, coins: 300, item: 'rifle_urban' },
    availability: 'newPlayer', days: 7, oneTime: true,
  },
];

export const bundleById = (id) => BUNDLES.find((b) => b.id === id) || null;

// Resolves whether a bundle should show right now, and (for timed ones) how
// long until it disappears — purely a function of wall-clock + Progression,
// no extra persisted schedule state needed.
export function bundleAvailability(bundle, progression) {
  const now = Date.now();
  // Already-bought one-time bundles stay listed (greyed "OWNED") rather than
  // vanishing — the UI reads `progression.boughtBundle()` itself to grey it.
  switch (bundle.availability) {
    case 'always':
      return { available: true, msRemaining: null };
    case 'daily': {
      const dayStart = Math.floor(now / 86400000) * 86400000;
      return { available: true, msRemaining: dayStart + 86400000 - now };
    }
    case 'weekend': {
      const d = new Date(now);
      const dow = d.getUTCDay();   // 0 Sun .. 6 Sat
      const isWeekend = dow === 0 || dow === 5 || dow === 6;
      if (!isWeekend) return { available: false, msRemaining: null };
      const daysToSunEnd = dow === 0 ? 0 : (7 - dow);
      const sunEndUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + daysToSunEnd + (dow === 0 ? 1 : 0));
      return { available: true, msRemaining: sunEndUTC - now };
    }
    case 'newPlayer': {
      const elapsed = now - (progression.data.firstPlayed || now);
      const windowMs = bundle.days * 86400000;
      return { available: elapsed < windowMs, msRemaining: windowMs - elapsed };
    }
    default:
      return { available: true, msRemaining: null };
  }
}

export function formatCountdown(ms) {
  if (ms == null) return '';
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${sec}s`;
}

// ---- Store category filter chips ----
export const STORE_CATEGORIES = [
  { key: 'featured', label: 'FEATURED' },
  { key: 'weapons', label: 'WEAPONS' },
  { key: 'skins', label: 'CHARACTER SKINS' },
  { key: 'knives', label: 'KNIFE SKINS' },
  { key: 'bundles', label: 'BUNDLES' },
  { key: 'offers', label: 'SPECIAL OFFERS' },
  { key: 'limited', label: 'LIMITED TIME' },
  { key: 'inventory', label: 'INVENTORY' },
];

// Maps a CATALOG item's `kind`/`slot` to the category chips it belongs to.
export function itemCategories(item) {
  const cats = new Set(['featured']);
  if (item.slot === 'operator') cats.add('skins');
  else if (item.slot === 'knifeFinish') cats.add('knives');
  else cats.add('weapons');
  if (item.rarity === 'ultraLimited') cats.add('limited');
  return cats;
}
