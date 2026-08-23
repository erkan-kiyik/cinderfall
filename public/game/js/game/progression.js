// Player progression: persistent XP/level, lifetime stats and unlocks.
// Stored in localStorage so it survives reloads; falls back to an in-memory
// object if storage is unavailable (private browsing, sandboxed iframe).

import { STARTER_WEAPON_IDS, weaponVariantIds } from './meta.js';
import { rollBossDrop } from './loot.js';
import { isBossStage } from './difficulty.js';
import { rollIntelDrop } from './intel.js';

const KEY = 'cinderfall.progress.v1';
// Separate key for the in-progress run snapshot (stage + operator vitals), so
// a reload / tab-close resumes exactly where the operator left off instead of
// restarting. Cleared on K.I.A. or an explicit fresh deployment.
const RUN_KEY = 'cinderfall.run.v1';

// Level thresholds: cumulative XP needed to reach level n (2..).
function xpForLevel(n) {
  return Math.round(120 * n * (n + 1) / 2 + Math.pow(n, 2.1) * 8);
}

// Unlock table: tier fires the first time player level reaches `level`.
export const UNLOCKS = [
  { level: 2, id: 'armor25', label: 'ARMOR PLATE — 25 CAP', kind: 'equipment' },
  { level: 3, id: 'smg', label: 'P-12 "WASP" SMG', kind: 'weapon' },
  { level: 4, id: 'rifleFinishUrban', label: 'VK-77 FINISH — URBAN', kind: 'finish' },
  { level: 5, id: 'phantomSkin', label: 'PHANTOM OPERATOR SKIN', kind: 'cosmetic' },
  { level: 6, id: 'knifeRavage', label: 'TALON-7 — RAVAGE BLADE', kind: 'finish' },
  { level: 7, id: 'armor50', label: 'ARMOR PLATE — 50 CAP', kind: 'equipment' },
  { level: 8, id: 'pistolFinishDesert', label: 'C-9 FINISH — DESERT', kind: 'finish' },
  { level: 10, id: 'rifleFinishCinder', label: 'VK-77 FINISH — CINDER', kind: 'finish' },
];

// Only the starter loadout is owned on a fresh save — every other weapon
// and cosmetic is crate loot, unlocked with scrap or a rewarded ad.
function starterInventory() {
  const inv = {};
  for (const id of STARTER_WEAPON_IDS) for (const vid of weaponVariantIds(id)) inv[vid] = true;
  return inv;
}

function defaultProgress() {
  return {
    level: 1, xp: 0,
    totalKills: 0, totalHeadshots: 0, shotsTotal: 0, hitsTotal: 0,
    longestSurvivalStage: 0, longestSurvivalTime: 0, gamesPlayed: 0,
    unlocked: {},
    // ---- meta-economy ----
    // One currency: SCRAP, salvaged off everything the operator downs and
    // spent at the Trader. The game used to run two (Coins for crates, a
    // premium currency for the store) which only made sense while real-money
    // purchases existed; with those gone a second currency was a second
    // number to explain and no decision to make.
    scrap: 0,
    energy: 20, energyMax: 20,   // play resource
    inventory: starterInventory(),   // itemId -> true once owned (crate drops)
    loadout: {},     // slotKey -> itemId currently equipped
    cratesOpened: 0,
    bossesDefeated: 0,
    adCrateDay: 0, adCratesToday: 0,   // rewarded-ad free crates, capped per day
    // live-service meta
    missions: null, missionDay: 0,     // regenerated daily
    weekly: null, missionWeek: 0,
    bpXp: 0, bpClaimed: {},            // battle pass
    lastLogin: 0, loginStreak: 0,
    firstPlayed: Date.now(),
    // rewarded-ad scrap payout (see SCRAP_AD_* below)
    scrapAdDay: 0, scrapAdWatched: 0, scrapAdGrantedToday: 0, lastScrapAdAt: 0,
    // ---- stats page: lifetime counters (never decrease, unlike balances) ----
    totalPlaytimeMs: 0,
    lifetimeScrapEarned: 0,
    totalAdsWatched: 0,           // unified across every ad type (crate/revive/scrap)
    totalMissionsCompleted: 0,
    highestCombo: 0, longestKillStreak: 0,
    weaponShots: {},               // weaponId -> lifetime shots fired
    // ---- achievements ----
    achievements: {},              // achId -> { claimed: true }
    // ---- intel logs (collectible lore) ----
    intel: {},                     // logId -> ts found
    // ---- first-run coaching (game/tutorial.js) ----
    // tipId -> true once shown. Persisted so a lesson survives a death: a
    // player who dies on stage 1 is not re-taught the same thing on attempt 2.
    tips: {},
    // ---- player card (offline profile) ----
    // Four headline numbers the Profile screen reads. Each one is written in
    // the same method as its legacy twin below, so the pair can never drift;
    // existing saves get them backfilled once by _seedProfile().
    maxLevelReached: 0,            // highest stage reached (mirrors longestSurvivalStage)
    totalDeaths: 0,                // lifetime K.I.A. count (mirrors totalAttempts)
    bossKills: 0,                  // bosses downed (mirrors bossesDefeated)
    favoriteWeapon: null,          // { weaponId, skinId } snapshot, refreshed at run end
  };
}

// ---- Sector Score: the one number the player card leads with ----
// Deliberately simple and fully offline — reaching further and downing bosses
// pays, dying costs a little. Deaths can never drag it negative, so a rough
// patch dents the score without erasing the campaign behind it.
export const SCORE_PER_LEVEL = 100;
export const SCORE_PER_BOSS = 500;
export const SCORE_PER_DEATH = 10;

export function sectorScore({ maxLevelReached = 0, bossKills = 0, totalDeaths = 0 }) {
  const raw = maxLevelReached * SCORE_PER_LEVEL
    + bossKills * SCORE_PER_BOSS
    - totalDeaths * SCORE_PER_DEATH;
  return Math.max(0, raw);
}

// ---- Rank titles ----
// There is no server and no leaderboard, so rank is the whole progression
// story: a band the player climbs on their own numbers. Ordered high -> low
// and resolved by the first `min` the score clears, which keeps the boundary
// rule in one place (a score of exactly 1000 is a Veteran, not a Rookie).
export const RANKS = [
  { id: 'commander', min: 6000, key: 'rank.commander', color: '#ffcc4d', glow: 'rgba(255,204,77,0.55)' },
  { id: 'elite',     min: 3000, key: 'rank.elite',     color: '#c07bff', glow: 'rgba(192,123,255,0.45)' },
  { id: 'veteran',   min: 1000, key: 'rank.veteran',   color: '#4fc3e8', glow: 'rgba(79,195,232,0.40)' },
  { id: 'rookie',    min: 0,    key: 'rank.rookie',    color: '#8fae6a', glow: 'rgba(143,174,106,0.32)' },
];

export function rankFor(score) {
  return RANKS.find((r) => score >= r.min) || RANKS[RANKS.length - 1];
}

// Scrap salvaged per kill (headshots pay a premium — a clean kill leaves
// more of the gear intact).
export const SCRAP_PER_KILL = 8;
export const SCRAP_PER_HEADSHOT = 14;

// Bonus salvage on top of the regular kill payout for downing a boss.
export const BOSS_KILL_SCRAP_BONUS = 350;

// Free crates earned by watching a rewarded ad, capped per calendar day.
export const AD_CRATE_DAILY_LIMIT = 5;

// Scrap paid out for claiming an achievement.
export const ACHIEVEMENT_SCRAP = 200;

// Free scrap: every rewarded ad watched pays a salvage bundle, capped per
// calendar day. A short cooldown between watches, plus only ever crediting a
// watch through the ad provider's actual reward callback (never a bare button
// click), is the exploit guard — there's no backend here to validate
// server-side.
export const SCRAP_AD_REWARD = 150;
export const SCRAP_AD_DAILY_CAP = 5;      // paid watches per day
export const SCRAP_AD_COOLDOWN_MS = 12000;

// What one legacy Diamond is worth in scrap. Old saves and any reward row
// still authored with `gems` convert at this rate — a Diamond bought a rare
// cosmetic at 15, and a crate costs 300 scrap, so 30 keeps the old value
// roughly intact rather than quietly deleting someone's balance.
export const SCRAP_PER_LEGACY_GEM = 30;


// Battle-pass: XP per tier and the reward table.
export const BP_XP_PER_TIER = 1000;
export const BP_TIERS = [
  { tier: 1, reward: { scrap: 150 }, label: '150 SCRAP' },
  { tier: 2, reward: { scrap: 300 }, label: '300 SCRAP', premium: true },
  { tier: 3, reward: { item: 'rifle_urban' }, label: 'VK-77 URBAN' },
  { tier: 4, reward: { scrap: 250 }, label: '250 SCRAP' },
  { tier: 5, reward: { energy: 10 }, label: '+10 ENERGY' },
  { tier: 6, reward: { item: 'op_nomad' }, label: 'NOMAD SKIN', premium: true },
  { tier: 7, reward: { scrap: 400 }, label: '400 PARA' },
  { tier: 8, reward: { scrap: 750 }, label: '750 SCRAP', premium: true },
  { tier: 9, reward: { item: 'pistol_gold' }, label: 'C-9 GILDED' },
  { tier: 10, reward: { item: 'rifle_arc' }, label: 'ARC-9 PULSE', premium: true },
];

// Mission templates — combat goals sampled daily / weekly.
const DAILY_TEMPLATES = [
  { id: 'kills', desc: 'Eliminate {n} hostiles', goals: [15, 25, 40], reward: { scrap: 120 } },
  { id: 'heads', desc: 'Land {n} headshots', goals: [5, 10, 15], reward: { scrap: 150 } },
  { id: 'stage', desc: 'Reach stage {n}', goals: [3, 5], reward: { scrap: 150 } },
  { id: 'play', desc: 'Complete {n} deployments', goals: [2, 3, 5], reward: { scrap: 100 } },
];
const WEEKLY_TEMPLATES = [
  { id: 'wkills', desc: 'Eliminate {n} hostiles this week', goals: [150, 250], reward: { scrap: 600 } },
  { id: 'wheads', desc: 'Land {n} headshots this week', goals: [50, 80], reward: { scrap: 600 } },
  { id: 'wcrates', desc: 'Open {n} supply crates', goals: [5, 10], reward: { scrap: 450 } },
];

export class Progression {
  constructor() {
    this.data = this.load();
    this._migrateCurrency();
    this._seedProfile();
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...defaultProgress(), ...JSON.parse(raw) };
    } catch (e) { /* storage unavailable — play this session only */ }
    return defaultProgress();
  }

  // Folds a two-currency save into the single scrap balance. Coins carried
  // over 1:1 and Diamonds at SCRAP_PER_LEGACY_GEM, so a returning player keeps
  // the buying power they had rather than logging in to a wiped wallet. The
  // old fields are deleted afterwards, which is also what makes this run once:
  // with nothing left to fold, a second call is a no-op.
  _migrateCurrency() {
    const d = this.data;
    const legacy = (d.tokens || 0) + (d.gems || 0) * SCRAP_PER_LEGACY_GEM;
    if (legacy > 0) {
      d.scrap = (d.scrap || 0) + legacy;
      // Lifetime counters feed the stats page, so carry them across too rather
      // than resetting a returning player's totals to zero.
      d.lifetimeScrapEarned = Math.max(
        d.lifetimeScrapEarned || 0,
        (d.lifetimeCoinsEarned || 0) + (d.lifetimeDiamondsEarned || 0) * SCRAP_PER_LEGACY_GEM,
      );
    }
    if ('tokens' in d || 'gems' in d) {
      delete d.tokens; delete d.gems;
      delete d.lifetimeCoinsEarned; delete d.lifetimeDiamondsEarned;
      // Old ad-cycle bookkeeping no longer has a meaning — the reward is a
      // flat scrap bundle per watch now, not a 10-watch cycle toward a gem.
      delete d.diamondAdDay; delete d.diamondAdWatched;
      delete d.diamondAdGrantedToday; delete d.lastDiamondAdAt;
      this.save();
    }
  }

  // Backfills the player-card counters on a save written before they existed.
  // They mirror counters the game has been keeping all along, so a returning
  // player opens the Profile on their real campaign rather than on zeros.
  // Max() rather than assignment: on an already-migrated save the live values
  // are the authority and this becomes a no-op.
  _seedProfile() {
    const d = this.data;
    d.maxLevelReached = Math.max(d.maxLevelReached || 0, d.longestSurvivalStage || 0, d.checkpoint || 0);
    d.totalDeaths = Math.max(d.totalDeaths || 0, d.totalAttempts || 0);
    d.bossKills = Math.max(d.bossKills || 0, d.bossesDefeated || 0);
    if (!d.favoriteWeapon) d.favoriteWeapon = this._computeFavoriteWeapon();
  }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ }
  }

  // ---- resumable run snapshot ----
  // Persists the live mission state (current stage + operator vitals + run
  // tallies) so a refresh continues from here. Kept tiny + robust.
  saveRun(state) {
    try { localStorage.setItem(RUN_KEY, JSON.stringify({ ...state, ts: Date.now() })); } catch (e) { /* ignore */ }
  }

  loadRun() {
    try {
      const raw = localStorage.getItem(RUN_KEY);
      if (!raw) return null;
      const r = JSON.parse(raw);
      if (!r || !r.stage || r.stage < 1) return null;
      return r;
    } catch (e) { return null; }
  }

  clearRun() {
    try { localStorage.removeItem(RUN_KEY); } catch (e) { /* ignore */ }
  }

  hasRun() { return !!this.loadRun(); }

  // ---- attempt counter (Geometry Dash style) ----
  // Per-stage failure tally, shown at stage start and on the death screen.
  // It counts how many times the player has died trying to clear this exact
  // stage, and resets the moment they clear it — so the number always reads
  // as "how long this wall has held me up", not a lifetime death count.

  attempts(stage) {
    const a = this.data.attempts || {};
    return a[stage] || 1;          // the run in progress is attempt #1
  }

  // Called on death. Returns the number the *next* run will be labelled.
  recordAttempt(stage) {
    if (!this.data.attempts) this.data.attempts = {};
    const next = (this.data.attempts[stage] || 1) + 1;
    this.data.attempts[stage] = next;
    // Best-effort lifetime tally for the stats screen / share card.
    this.data.totalAttempts = (this.data.totalAttempts || 0) + 1;
    this.data.totalDeaths = this.data.totalAttempts;   // player card twin
    this.save();
    return next;
  }

  // Cleared it — the counter has done its job, so it goes back to 1.
  clearAttempts(stage) {
    if (this.data.attempts && this.data.attempts[stage]) {
      delete this.data.attempts[stage];
      this.save();
    }
  }

  get totalAttempts() { return this.data.totalAttempts || 0; }

  // ---- checkpoints ----
  // Dying used to drop the operator all the way back to stage 1, which on a
  // long campaign threw away every stage they had already beaten. A cleared
  // stage is banked here instead, and a fresh deployment starts from the last
  // one banked — so a death costs you the stage you were on, not the run.

  // Highest stage the player has actually finished. 0 = nothing cleared yet.
  get checkpoint() { return this.data.checkpoint || 0; }

  // The stage a fresh deployment should open on: the one after the last
  // cleared stage, floored at 1.
  get resumeStage() { return Math.max(1, this.checkpoint + 1); }

  // Called when a stage is cleared. Only ever moves forward.
  recordStageCleared(stage) {
    if (stage > (this.data.checkpoint || 0)) {
      this.data.checkpoint = stage;
      this.save();
    }
    // Every cleared stage is also replayable from the level select.
    if (!this.data.stagesCleared) this.data.stagesCleared = {};
    this.data.stagesCleared[stage] = true;
    this.save();
    return this.data.checkpoint;
  }

  stageCleared(stage) { return !!(this.data.stagesCleared || {})[stage]; }

  // Boss arenas the player has actually beaten, ascending.
  //
  // This is the entire content of the level select. Intermediate stages are
  // one-and-done — beaten on the way through and never offered again, so the
  // campaign always moves forward instead of letting players grind an easy
  // early stage. Boss arenas hold the 1/1000 redeemable table (game/loot.js),
  // so replaying one is the only reason to go back.
  //
  // Unbeaten arenas are deliberately absent rather than listed as locked: the
  // menu shows what you own, not what you don't.
  clearedBossStages() {
    const cleared = this.data.stagesCleared || {};
    return Object.keys(cleared)
      .map(Number)
      .filter((n) => Number.isFinite(n) && isBossStage(n) && cleared[n])
      .sort((a, b) => a - b);
  }

  // True when a boss arena may be launched directly from the menu.
  canReplay(stage) {
    return isBossStage(stage) && this.stageCleared(stage);
  }

  isUnlocked(id) { return !!this.data.unlocked[id]; }

  // Returns { leveledUp, newLevel, newUnlocks[] } for the caller to react to
  // (toasts, applying the unlock, sfx).
  addXp(amount) {
    const d = this.data;
    d.xp += amount;
    let leveledUp = false;
    const newUnlocks = [];
    while (d.xp >= xpForLevel(d.level + 1)) {
      d.level++;
      leveledUp = true;
      for (const u of UNLOCKS) {
        if (u.level === d.level && !d.unlocked[u.id]) {
          d.unlocked[u.id] = true;
          newUnlocks.push(u);
        }
      }
    }
    this.save();
    return { leveledUp, newLevel: d.level, newUnlocks };
  }

  xpProgress() {
    const d = this.data;
    const cur = xpForLevel(d.level);
    const next = xpForLevel(d.level + 1);
    return clamp01((d.xp - cur) / Math.max(1, next - cur));
  }

  recordKill(headshot) {
    this.data.totalKills++;
    if (headshot) this.data.totalHeadshots++;
    return this.addScrap(headshot ? SCRAP_PER_HEADSHOT : SCRAP_PER_KILL);
  }

  // Boss kills already count as a regular recordKill (called first) — this
  // layers the bonus reward + lifetime tally on top.
  recordBossKill() {
    this.data.bossesDefeated++;
    this.data.bossKills = this.data.bossesDefeated;   // player card twin
    this.addScrap(BOSS_KILL_SCRAP_BONUS);
    this.save();
  }

  // Rolls the Boss Redeemable table for one boss kill. `luck` is the equipped
  // perk block's Loot Luck multiplier — it scales the roll, never the pity
  // counter, so luck helps you win sooner but can't manufacture a guarantee.
  // Grants and persists the item on a win. Returns the item, or null.
  rollBossReward(luck = 1) {
    if (!this.data.bossDropState) this.data.bossDropState = { since: 0 };
    const state = this.data.bossDropState;
    const won = rollBossDrop((id) => this.owns(id), state, Math.random, luck);
    if (won) this.grant(won.id);
    this.save();
    return won;
  }

  // Boss kills banked since the last redeemable — surfaced on the stats page
  // so the chase is legible rather than invisible.
  get bossDropDrought() { return (this.data.bossDropState || {}).since || 0; }

  // ---- scrap economy ----
  get scrap() { return this.data.scrap; }

  // Every scrap gain routes through here so lifetimeScrapEarned (stats page)
  // always matches, regardless of source (kills, duplicate-crate refunds,
  // missions, battle pass, rewarded ads).
  addScrap(n) { this.data.scrap += n; this.data.lifetimeScrapEarned += n; this.save(); return this.data.scrap; }

  // Attempts to spend `n`; returns true and deducts on success, false if broke.
  spendScrap(n) {
    if (this.data.scrap < n) return false;
    this.data.scrap -= n;
    this.save();
    return true;
  }

  // ---- inventory / loadout ----
  owns(id) { return !!this.data.inventory[id]; }

  grant(id) { this.data.inventory[id] = true; this.save(); }

  // Equip an owned item into a loadout slot. Returns false if not owned.
  equip(slotKey, id) {
    if (id && !this.owns(id)) return false;
    if (id === null) delete this.data.loadout[slotKey];
    else this.data.loadout[slotKey] = id;
    this.save();
    return true;
  }

  equipped(slotKey) { return this.data.loadout[slotKey] || null; }

  // ---- rewarded-ad free crates ----
  _rolloverAdCrateDay() {
    const day = Math.floor(Date.now() / 86400000);
    if (this.data.adCrateDay !== day) { this.data.adCrateDay = day; this.data.adCratesToday = 0; }
  }

  adCratesRemaining() {
    this._rolloverAdCrateDay();
    return Math.max(0, AD_CRATE_DAILY_LIMIT - this.data.adCratesToday);
  }

  recordAdCrateWatch() {
    this._rolloverAdCrateDay();
    this.data.adCratesToday++;
    this.data.totalAdsWatched++;
    this.save();
  }

  recordShots(shots, hits) {
    this.data.shotsTotal += shots;
    this.data.hitsTotal += hits;
  }

  recordRun(stage, survivalTime) {
    const d = this.data;
    d.gamesPlayed++;
    if (stage > d.longestSurvivalStage) d.longestSurvivalStage = stage;
    if (survivalTime > d.longestSurvivalTime) d.longestSurvivalTime = survivalTime;
    d.maxLevelReached = d.longestSurvivalStage;   // player card twin
    this.save();
  }

  accuracy() {
    const d = this.data;
    return d.shotsTotal ? Math.round((d.hitsTotal / d.shotsTotal) * 100) : 0;
  }

  get energy() { return this.data.energy; }
  get energyMax() { return this.data.energyMax; }
  useEnergy(n = 1) { if (this.data.energy < n) return false; this.data.energy -= n; this.save(); return true; }
  refillEnergy() { this.data.energy = this.data.energyMax; this.save(); }

  // ---- scrap from ads: one salvage bundle per watch, capped per day ----
  _rolloverScrapAdDay() {
    const day = Math.floor(Date.now() / 86400000);
    if (this.data.scrapAdDay !== day) {
      this.data.scrapAdDay = day;
      this.data.scrapAdWatched = 0;
      this.data.scrapAdGrantedToday = 0;
    }
  }

  scrapAdProgress() {
    this._rolloverScrapAdDay();
    const cooldownLeft = Math.max(0, SCRAP_AD_COOLDOWN_MS - (Date.now() - this.data.lastScrapAdAt));
    return {
      reward: SCRAP_AD_REWARD,
      grantedToday: this.data.scrapAdGrantedToday, dailyCap: SCRAP_AD_DAILY_CAP,
      capped: this.data.scrapAdGrantedToday >= SCRAP_AD_DAILY_CAP,
      cooldownMs: cooldownLeft,
    };
  }

  // Call only from the ad provider's actual reward callback. Returns
  // { ...progress, granted } so the caller can react/toast.
  recordScrapAdWatch() {
    this._rolloverScrapAdDay();
    const now = Date.now();
    if (now - this.data.lastScrapAdAt < SCRAP_AD_COOLDOWN_MS) return { rejected: 'cooldown' };
    if (this.data.scrapAdGrantedToday >= SCRAP_AD_DAILY_CAP) return { rejected: 'cap' };
    this.data.lastScrapAdAt = now;
    this.data.scrapAdWatched++;
    this.data.totalAdsWatched++;
    this.data.scrapAdGrantedToday++;
    this.addScrap(SCRAP_AD_REWARD);
    this.save();
    return { ...this.scrapAdProgress(), granted: SCRAP_AD_REWARD };
  }

  // Applies a reward object { scrap, energy, item, items } from missions and
  // the battle pass. `items` (array) covers rewards granting more than one
  // cosmetic; `item` (single id) covers everything else.
  //
  // `coins` and `gems` are still read for backwards compatibility with reward
  // rows authored under the old two-currency model — both now pay out as
  // scrap, at the rate SCRAP_PER_LEGACY_GEM for the premium one, so no
  // existing table silently stops rewarding anything.
  grantReward(r) {
    if (!r) return;
    const scrap = (r.scrap || 0) + (r.coins || 0) + (r.gems || 0) * SCRAP_PER_LEGACY_GEM;
    if (scrap) this.addScrap(scrap);
    if (r.energy) this.data.energy = Math.min(this.data.energyMax, this.data.energy + r.energy);
    if (r.item) this.data.inventory[r.item] = true;
    if (r.items) for (const id of r.items) this.data.inventory[id] = true;
    this.save();
  }

  // ---- battle pass ----
  get bpTier() { return Math.min(BP_TIERS.length, Math.floor(this.data.bpXp / BP_XP_PER_TIER)); }
  bpTierProgress() { return (this.data.bpXp % BP_XP_PER_TIER) / BP_XP_PER_TIER; }
  addBpXp(n) { this.data.bpXp += n; this.save(); }
  bpClaimable(tier) { return this.bpTier >= tier && !this.data.bpClaimed[tier]; }
  claimBpTier(tier) {
    const row = BP_TIERS.find((t) => t.tier === tier);
    if (!row || !this.bpClaimable(tier)) return null;
    this.data.bpClaimed[tier] = true;
    this.grantReward(row.reward);
    return row;
  }

  // ---- daily / weekly missions ----
  // Regenerates the mission set when the calendar day / week rolls over. Each
  // mission stores a baseline stat snapshot so progress = current - baseline.
  ensureMissions() {
    const day = Math.floor(Date.now() / 86400000);
    const week = Math.floor(day / 7);
    if (this.data.missionDay !== day || !this.data.missions) {
      this.data.missionDay = day;
      this.data.missions = this._roll(DAILY_TEMPLATES, day, 3);
    }
    if (this.data.missionWeek !== week || !this.data.weekly) {
      this.data.missionWeek = week;
      this.data.weekly = this._roll(WEEKLY_TEMPLATES, week * 100 + 7, WEEKLY_TEMPLATES.length);
    }
    // daily login streak + energy refill
    if (this.data.lastLogin !== day) {
      this.data.loginStreak = this.data.lastLogin === day - 1 ? this.data.loginStreak + 1 : 1;
      this.data.lastLogin = day;
      this.data.energy = this.data.energyMax;
    }
    this.save();
  }

  _roll(templates, seed, count) {
    let s = seed * 2654435761 % 2147483647;
    const rnd = () => (s = s * 48271 % 2147483647) / 2147483647;
    const pool = [...templates];
    const out = [];
    for (let i = 0; i < count && pool.length; i++) {
      const t = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
      const goal = t.goals[Math.floor(rnd() * t.goals.length)];
      out.push({
        id: t.id, desc: t.desc.replace('{n}', goal), goal, reward: t.reward,
        base: this._statFor(t.id), claimed: false,
      });
    }
    return out;
  }

  _statFor(id) {
    const d = this.data;
    switch (id) {
      case 'kills': case 'wkills': return d.totalKills;
      case 'heads': case 'wheads': return d.totalHeadshots;
      case 'play': return d.gamesPlayed;
      case 'wcrates': return d.cratesOpened;
      case 'stage': return 0;   // measured against longestSurvivalStage at read
      default: return 0;
    }
  }

  missionProgress(m) {
    if (m.id === 'stage') return Math.min(m.goal, this.data.longestSurvivalStage);
    return Math.min(m.goal, Math.max(0, this._statFor(m.id) - m.base));
  }

  claimMission(list, index) {
    const m = (this.data[list] || [])[index];
    if (!m || m.claimed || this.missionProgress(m) < m.goal) return null;
    m.claimed = true;
    this.data.totalMissionsCompleted++;
    this.grantReward(m.reward);
    return m;
  }

  // ---- stats page ----
  // Playtime accumulates in-memory on the caller (Game) during play and is
  // flushed here periodically — never per-frame, to keep this a cheap,
  // infrequent localStorage write like every other stat here.
  addPlaytime(ms) { if (ms > 0) { this.data.totalPlaytimeMs += ms; this.save(); } }

  // Every rewarded-ad watch (crate/revive/scrap — any type) feeds this one
  // lifetime counter, which the Stats screen reads.
  recordAdWatched() { this.data.totalAdsWatched++; this.save(); }

  // ---- first-run coaching ----
  tipSeen(id) { return !!(this.data.tips && this.data.tips[id]); }
  markTipSeen(id) {
    if (!this.data.tips) this.data.tips = {};
    if (this.data.tips[id]) return;
    this.data.tips[id] = true;
    this.save();
  }

  // Weapon shot counts accumulate per-run in memory (Game) and flush once at
  // run end via this, exactly like the existing recordShots(shots, hits) —
  // never per-shot, which would hit localStorage tens of times a second on
  // full-auto weapons.
  recordWeaponShots(shotsByWeapon) {
    for (const [id, n] of Object.entries(shotsByWeapon)) {
      this.data.weaponShots[id] = (this.data.weaponShots[id] || 0) + n;
    }
    // Recomputed here rather than read live by the Profile so the card shows
    // the skin that was equipped while the weapon earned its place, not
    // whatever happens to be equipped when the card is opened.
    this.data.favoriteWeapon = this._computeFavoriteWeapon();
    this.save();
  }

  // Most-fired weapon plus the skin equipped on it, or null before a shot has
  // ever been fired. Shape: { weaponId, skinId } — skinId is null on stock.
  _computeFavoriteWeapon() {
    const weaponId = this.mostUsedWeapon();
    if (!weaponId) return null;
    return { weaponId, skinId: this.equipped(`skin_${weaponId}`) || null };
  }
  mostUsedWeapon() {
    const entries = Object.entries(this.data.weaponShots);
    if (!entries.length) return null;
    return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  }
  weaponsUsedCount() { return Object.keys(this.data.weaponShots).length; }

  // Combo (kills in quick succession) and kill streak (kills since the last
  // time the operator went down) — both just record new highs; the live
  // counters themselves live on Game (per-run/per-life state).
  recordCombo(n) { if (n > this.data.highestCombo) { this.data.highestCombo = n; this.save(); } }
  recordKillStreak(n) { if (n > this.data.longestKillStreak) { this.data.longestKillStreak = n; this.save(); } }

  // ---- achievements ----
  achievementClaimed(id) { return !!this.data.achievements[id]; }
  claimAchievement(id) {
    if (this.data.achievements[id]) return false;
    this.data.achievements[id] = { claimed: true, ts: Date.now() };
    this.addScrap(ACHIEVEMENT_SCRAP);
    return true;
  }

  // ---- intel logs ----
  // Collectible lore recovered off bodies. Stored as logId -> timestamp rather
  // than logId -> true so the Archives can sort by discovery order later
  // without a save migration.
  hasIntel(id) { return !!(this.data.intel || {})[id]; }

  grantIntel(id) {
    if (!this.data.intel) this.data.intel = {};
    if (this.data.intel[id]) return false;
    this.data.intel[id] = Date.now();
    this.save();
    return true;
  }

  intelFoundCount() { return Object.keys(this.data.intel || {}).length; }

  // Rolls one kill's intel drop and banks the result. `luck` is the equipped
  // perk block's Loot Luck, matching how rollBossReward treats it.
  // Returns the same shape as rollIntelDrop, or null on a miss.
  rollIntel(isBoss, stage, luck = 1) {
    const res = rollIntelDrop(isBoss, stage, (id) => this.hasIntel(id), Math.random, luck);
    if (!res) return null;
    if (res.kind === 'log') this.grantIntel(res.log.id);
    else if (res.kind === 'scrap') this.addScrap(res.amount);
    return res;
  }

  // ---- player card (offline profile) ----
  // The Profile screen's whole data contract. Everything here is local: no
  // request is made, no id is sent anywhere, and the numbers come from the
  // same counters the rest of the game has always kept.
  get maxLevelReached() { return this.data.maxLevelReached || 0; }
  get totalDeaths() { return this.data.totalDeaths || 0; }
  get bossKills() { return this.data.bossKills || 0; }
  get favoriteWeapon() { return this.data.favoriteWeapon || null; }

  sectorScore() {
    return sectorScore({
      maxLevelReached: this.maxLevelReached,
      bossKills: this.bossKills,
      totalDeaths: this.totalDeaths,
    });
  }

  rank() { return rankFor(this.sectorScore()); }

  // One call for the whole card, so the UI never has to know which counter
  // backs which number.
  profile() {
    const score = this.sectorScore();
    return {
      maxLevelReached: this.maxLevelReached,
      totalDeaths: this.totalDeaths,
      bossKills: this.bossKills,
      favoriteWeapon: this.favoriteWeapon,
      score,
      rank: rankFor(score),
    };
  }

}

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
