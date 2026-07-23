// Player progression: persistent XP/level, lifetime stats and unlocks.
// Stored in localStorage so it survives reloads; falls back to an in-memory
// object if storage is unavailable (private browsing, sandboxed iframe).

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

function defaultProgress() {
  return {
    level: 1, xp: 0,
    totalKills: 0, totalHeadshots: 0, shotsTotal: 0, hitsTotal: 0,
    longestSurvivalStage: 0, longestSurvivalTime: 0, gamesPlayed: 0,
    unlocked: {},
    // meta-economy: soft currency earned in combat, spent on crates
    tokens: 0,          // "Coins" — earned in combat
    gems: 25,           // premium currency
    energy: 20, energyMax: 20,   // play resource
    inventory: {},   // itemId -> true once owned (crate drops)
    loadout: {},     // slotKey -> itemId currently equipped
    cratesOpened: 0,
    // live-service meta
    missions: null, missionDay: 0,     // regenerated daily
    weekly: null, missionWeek: 0,
    bpXp: 0, bpClaimed: {},            // battle pass
    lastLogin: 0, loginStreak: 0,
  };
}

// Tokens awarded per kill (headshots pay a premium).
export const TOKENS_PER_KILL = 8;
export const TOKENS_PER_HEADSHOT = 14;

// Battle-pass: XP per tier and the reward table.
export const BP_XP_PER_TIER = 1000;
export const BP_TIERS = [
  { tier: 1, reward: { coins: 150 }, label: '150 COINS' },
  { tier: 2, reward: { gems: 10 }, label: '10 GEMS', premium: true },
  { tier: 3, reward: { item: 'rifle_urban' }, label: 'VK-77 URBAN' },
  { tier: 4, reward: { coins: 250 }, label: '250 COINS' },
  { tier: 5, reward: { energy: 10 }, label: '+10 ENERGY' },
  { tier: 6, reward: { item: 'op_nomad' }, label: 'NOMAD SKIN', premium: true },
  { tier: 7, reward: { coins: 400 }, label: '400 COINS' },
  { tier: 8, reward: { gems: 25 }, label: '25 GEMS', premium: true },
  { tier: 9, reward: { item: 'pistol_gold' }, label: 'C-9 GILDED' },
  { tier: 10, reward: { item: 'rifle_arc' }, label: 'ARC-9 PULSE', premium: true },
];

// Mission templates — combat goals sampled daily / weekly.
const DAILY_TEMPLATES = [
  { id: 'kills', desc: 'Eliminate {n} hostiles', goals: [15, 25, 40], reward: { coins: 120 } },
  { id: 'heads', desc: 'Land {n} headshots', goals: [5, 10, 15], reward: { coins: 150 } },
  { id: 'stage', desc: 'Reach stage {n}', goals: [3, 5], reward: { gems: 5 } },
  { id: 'play', desc: 'Complete {n} deployments', goals: [2, 3, 5], reward: { coins: 100 } },
];
const WEEKLY_TEMPLATES = [
  { id: 'wkills', desc: 'Eliminate {n} hostiles this week', goals: [150, 250], reward: { gems: 20 } },
  { id: 'wheads', desc: 'Land {n} headshots this week', goals: [50, 80], reward: { coins: 600 } },
  { id: 'wcrates', desc: 'Open {n} supply crates', goals: [5, 10], reward: { gems: 15 } },
];

export class Progression {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...defaultProgress(), ...JSON.parse(raw) };
    } catch (e) { /* storage unavailable — play this session only */ }
    return defaultProgress();
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
    this.data.tokens += headshot ? TOKENS_PER_HEADSHOT : TOKENS_PER_KILL;
    this.save();
    return this.data.tokens;
  }

  // ---- token economy ----
  get tokens() { return this.data.tokens; }

  addTokens(n) { this.data.tokens += n; this.save(); return this.data.tokens; }

  // Attempts to spend `n`; returns true and deducts on success, false if broke.
  spendTokens(n) {
    if (this.data.tokens < n) return false;
    this.data.tokens -= n;
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

  recordShots(shots, hits) {
    this.data.shotsTotal += shots;
    this.data.hitsTotal += hits;
  }

  recordRun(stage, survivalTime) {
    const d = this.data;
    d.gamesPlayed++;
    if (stage > d.longestSurvivalStage) d.longestSurvivalStage = stage;
    if (survivalTime > d.longestSurvivalTime) d.longestSurvivalTime = survivalTime;
    this.save();
  }

  accuracy() {
    const d = this.data;
    return d.shotsTotal ? Math.round((d.hitsTotal / d.shotsTotal) * 100) : 0;
  }

  // ---- currencies (Coins = tokens, Gems = premium, Energy = play resource) ----
  get coins() { return this.data.tokens; }
  get gems() { return this.data.gems; }
  get energy() { return this.data.energy; }
  get energyMax() { return this.data.energyMax; }

  addGems(n) { this.data.gems += n; this.save(); return this.data.gems; }
  spendGems(n) { if (this.data.gems < n) return false; this.data.gems -= n; this.save(); return true; }
  useEnergy(n = 1) { if (this.data.energy < n) return false; this.data.energy -= n; this.save(); return true; }
  refillEnergy() { this.data.energy = this.data.energyMax; this.save(); }

  // Applies a reward object { coins, gems, energy, item } from missions / BP.
  grantReward(r) {
    if (!r) return;
    if (r.coins) this.data.tokens += r.coins;
    if (r.gems) this.data.gems += r.gems;
    if (r.energy) this.data.energy = Math.min(this.data.energyMax, this.data.energy + r.energy);
    if (r.item) this.data.inventory[r.item] = true;
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
    this.grantReward(m.reward);
    return m;
  }
}

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
