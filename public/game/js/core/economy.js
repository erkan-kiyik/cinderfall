// KOR — the economy: weapons you own, weapon finishes (skins), crates,
// HAWK's stall and the daily tasks. Everything here is rules over the save;
// the screens call these and show the result.
//
// A finish is a tint multiplied over the factory paint, in the menus (the
// weapon pictures) and in the game (the sprites), so it costs nothing to
// bake. Crates roll a rarity from the odds on the crate, then a finish of
// that rarity for one of your weapons; one you already have pays PARÇA back.
import { WEAPON_LIST, CRATES } from '../ui/data.js';

export const SKINS = [
  { id: 'factory', rar: 'common', tint: '#ffffff' },
  { id: 'sand', rar: 'common', tint: '#f2dcae' },
  { id: 'olive', rar: 'common', tint: '#bccb94' },
  { id: 'arctic', rar: 'rare', tint: '#d4ecff' },
  { id: 'cobalt', rar: 'rare', tint: '#86a8ff' },
  { id: 'crimson', rar: 'epic', tint: '#ff8c8c' },
  { id: 'violet', rar: 'epic', tint: '#c8a2ff' },
  { id: 'gold', rar: 'legendary', tint: '#ffd36a' },
  { id: 'ember', rar: 'mythic', tint: '#ff9a5c' },
  { id: 'kor', rar: 'ultra', tint: '#d2b08a' },
];
export const SKIN = Object.fromEntries(SKINS.map((s) => [s.id, s]));
export const RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic', 'ultra'];
export const REFUND = { common: 40, rare: 90, epic: 200, legendary: 500, mythic: 1200, ultra: 3000 };
export const SKIN_PRICE = { common: 200, rare: 600, epic: 1200, legendary: 2400, mythic: 4200, ultra: 8000 };
export const STARTER = ['wren9', 'kestrel', 'ramrod', 'marksman'];
const PITY = 30; // at least epic once in this many crates

export const weaponInfo = (id) => WEAPON_LIST.find((w) => w.id === id);
export const owns = (d, id) => d.arsenal.owned.includes(id);
export const hasSkin = (d, w, sk) => sk === 'factory' || (d.arsenal.skins[w] || []).includes(sk);
export const skinOf = (d, w) => SKIN[d.arsenal.skin[w]] || SKIN.factory;

// The tints the player's guns are drawn with (read by the characters).
export const TINTS = {};
export function syncTints(d) {
  for (const k of Object.keys(TINTS)) delete TINTS[k];
  for (const [w, sk] of Object.entries(d.arsenal.skin || {})) if (SKIN[sk] && sk !== 'factory') TINTS[w] = SKIN[sk];
}

// Pay `cost` PARÇA and apply fn(d); false when it cannot be afforded.
export function spend(save, cost, fn) {
  if (save.d.profile.parca < cost) return false;
  save.set((d) => { d.profile.parca -= cost; fn(d); });
  return true;
}
export function buyWeapon(save, id) {
  const w = weaponInfo(id);
  if (!w || owns(save.d, id)) return false;
  return spend(save, w.price || 0, (d) => { d.arsenal.owned.push(id); });
}
export function giveSkin(d, w, sk) {
  const list = d.arsenal.skins[w] || (d.arsenal.skins[w] = []);
  if (!list.includes(sk)) list.push(sk);
}
export function equipSkin(save, w, sk) {
  if (!hasSkin(save.d, w, sk)) return false;
  save.set((d) => { d.arsenal.skin[w] = sk; });
  syncTints(save.d);
  return true;
}

// --- crates ----------------------------------------------------------------------
function rollRarity(odds, rng) {
  const total = odds.reduce((a, [, p]) => a + p, 0);
  let x = rng() * total;
  for (const [r, p] of odds) { x -= p; if (x <= 0) return r; }
  return odds[odds.length - 1][0];
}
// Open one crate (already paid for): returns { rar, skin, weapon, dup, refund }.
export function openCrate(save, crateId, rng = Math.random) {
  const C = CRATES.find((c) => c.id === crateId);
  let out = null;
  save.set((d) => {
    let rar = rollRarity(C.odds, rng);
    d.inv.pity = (d.inv.pity || 0) + 1;
    if (RARITIES.indexOf(rar) < 2 && d.inv.pity >= PITY) rar = 'epic';
    if (RARITIES.indexOf(rar) >= 2) d.inv.pity = 0;
    const pool = SKINS.filter((s) => s.rar === rar && s.id !== 'factory');
    const skin = pool[Math.floor(rng() * pool.length)] || SKIN.sand;
    const weapons = d.arsenal.owned;
    const weapon = weapons[Math.floor(rng() * weapons.length)];
    const dup = hasSkin(d, weapon, skin.id);
    const refund = dup ? REFUND[skin.rar] : 0;
    if (dup) d.profile.parca += refund; else giveSkin(d, weapon, skin.id);
    d.inv.opened = (d.inv.opened || 0) + 1;
    out = { rar: skin.rar, skin: skin.id, weapon, dup, refund };
  });
  return out;
}
// Buy and open in one go, or open one from the inventory.
export function crateFromStock(save, crateId) {
  if (!(save.d.inv.crates[crateId] > 0)) return null;
  save.set((d) => { d.inv.crates[crateId]--; });
  return openCrate(save, crateId);
}
export function buyCrate(save, crateId) {
  const C = CRATES.find((c) => c.id === crateId);
  if (!spend(save, C.price, () => {})) return null;
  return openCrate(save, crateId);
}

// --- days, HAWK's stall, the daily tasks --------------------------------------------------------
const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (t = new Date()) => `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
export const weekKey = (t = new Date()) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayKey(d); };
function seeded(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909), (h >>> 0) / 4294967296)); }
const pick = (r, list) => list[Math.floor(r() * list.length)];

// Today's goods: { daily: [item ×4], weekly: item }, item = { key, kind, id, weapon, skin, rar, price }
export function traderStock(d, now = new Date()) {
  const day = dayKey(now), r = seeded('hawk' + day), rw = seeded('hawk-week' + weekKey(now));
  // the day's picks never depend on what you own (buying must not reshuffle the stall)
  const extra = WEAPON_LIST.filter((w) => !STARTER.includes(w.id));
  const skinItem = (rng, rars, k) => {
    const sk = pick(rng, SKINS.filter((s) => rars.includes(s.rar))), w = pick(rng, STARTER);
    return { key: `${k}:${w}:${sk.id}`, kind: 'skin', weapon: w, skin: sk.id, rar: sk.rar, price: SKIN_PRICE[sk.rar] };
  };
  const daily = [];
  { const w = pick(r, extra); daily.push({ key: `w:${w.id}`, kind: 'weapon', weapon: w.id, rar: 'rare', price: Math.round(w.price * 0.85) }); }
  daily.push(skinItem(r, ['epic'], 's1'));
  daily.push({ key: 'c:std', kind: 'crate', id: 'std', rar: 'common', price: Math.round(CRATES[0].price * 0.8) });
  daily.push(r() < 0.5 ? skinItem(r, ['rare', 'epic'], 's3') : { key: 'c:plus', kind: 'crate', id: 'plus', rar: 'rare', price: Math.round(CRATES[1].price * 0.85) });
  const weekly = skinItem(rw, ['legendary', 'mythic'], 'wk');
  return { day, daily, weekly };
}
export function traderBuy(save, item) {
  const d = save.d;
  if (d.trader.day !== dayKey()) save.set((s) => { s.trader.day = dayKey(); s.trader.sold = []; });
  if (save.d.trader.sold.includes(item.key)) return false;
  if (item.kind === 'weapon' && owns(d, item.weapon)) return false;
  if (item.kind === 'skin' && hasSkin(d, item.weapon, item.skin)) return false;
  return spend(save, item.price, (s) => {
    s.trader.sold.push(item.key);
    if (item.kind === 'weapon') s.arsenal.owned.push(item.weapon);
    else if (item.kind === 'skin') giveSkin(s, item.weapon, item.skin);
    else s.inv.crates[item.id] = (s.inv.crates[item.id] || 0) + 1;
  });
}
export const traderSold = (d, item) => d.trader.day === dayKey() && d.trader.sold.includes(item.key);

// three tasks a day; progress comes from mission results
export const TASKS = {
  kills: { goal: 25, reward: 180 },
  heads: { goal: 8, reward: 200 },
  mission: { goal: 1, reward: 220 },
  stars: { goal: 3, reward: 240 },
  endless: { goal: 5, reward: 260 },
  shots: { goal: 300, reward: 150 },
};
export function ensureDaily(save) {
  const day = dayKey();
  if (save.d.daily.day === day && save.d.daily.tasks.length) return;
  const r = seeded('daily' + day), ids = Object.keys(TASKS), tasks = [];
  while (tasks.length < 3) { const id = pick(r, ids); if (!tasks.some((x) => x.id === id)) tasks.push({ id, n: 0, claimed: false }); }
  save.set((d) => { d.daily = { day, tasks }; });
}
// fold a mission / endless result into today's tasks
export function progressDaily(d, r) {
  if (d.daily.day !== dayKey()) return;
  for (const k of d.daily.tasks) {
    const add = k.id === 'kills' ? r.kills : k.id === 'heads' ? r.heads : k.id === 'shots' ? r.shots
      : k.id === 'mission' ? (r.done && !r.endless ? 1 : 0) : k.id === 'stars' ? (r.done ? r.stars.filter(Boolean).length : 0)
        : k.id === 'endless' ? (r.endless ? r.wave : 0) : 0;
    k.n = Math.min(TASKS[k.id].goal, k.n + (add || 0));
  }
}
export function claimDaily(save, i) {
  const k = save.d.daily.tasks[i];
  if (!k || k.claimed || k.n < TASKS[k.id].goal) return 0;
  const pay = TASKS[k.id].reward;
  save.set((d) => { d.daily.tasks[i].claimed = true; d.profile.parca += pay; });
  return pay;
}
export const dailyDone = (d) => (d.daily.day === dayKey() ? d.daily.tasks.filter((k) => k.n >= TASKS[k.id].goal).length : 0);
