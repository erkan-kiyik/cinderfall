// Difficulty curves for the endless campaign.
//
// Every scaling decision lives here so the campaign's shape is one file you
// can read, rather than a scatter of `Math.min(..., 8)` clamps across the
// spawn code. Those clamps were the real "level cap": difficulty plateaued at
// stage 9 and every stage after that played identically, so stage 40 was no
// harder than stage 10.
//
// Three axes, deliberately different in character:
//
//   aiSkill    SATURATES. Reaction time, aim error and burst discipline all
//              floor out in enemy.js (Math.max(0.1, 0.32 - skill*0.018) and
//              friends), so pushing this past the point where every formula
//              has bottomed out changes nothing. Letting it grow forever would
//              be a lie — the AI cannot get sharper than instant.
//
//   hp / dmg   UNBOUNDED. These are what actually make stage 300 harder than
//              stage 30, and they have no natural ceiling.
//
//   count      BOUNDED, for frame rate rather than for balance. Thirty-odd
//              live AI agents plus their projectiles is the practical budget
//              on a mid-range phone. Difficulty past that point keeps arriving
//              through hp/dmg, so the curve never actually flattens.

// Boss every Nth stage. Single source of truth — enemy.js re-exports its own
// constant for the encounter code, and both must agree.
export const BOSS_INTERVAL = 5;

export const isBossStage = (stage) => stage > 0 && stage % BOSS_INTERVAL === 0;

// Which boss tier a stage belongs to: stage 5 -> 0, stage 10 -> 1, ...
export const bossTier = (stage) => Math.max(0, Math.floor(stage / BOSS_INTERVAL) - 1);

// ---- AI sharpness ----------------------------------------------------
// Grows quickly at first, then flattens. By ~stage 25 every AI formula that
// reads it has hit its floor, so the curve is shaped to arrive there and stop
// rather than to climb pointlessly.
const AI_SKILL_CEIL = 22;
export function aiSkill(stage) {
  const s = Math.max(1, stage) - 1;
  // asymptotic approach to the ceiling
  return AI_SKILL_CEIL * (1 - Math.exp(-s / 9));
}

// ---- health ----------------------------------------------------------
// Linear backbone with a gentle super-linear term, so early stages step up
// readably and late stages keep compounding without going exponential.
//   s=10 -> x2.5   s=25 -> x5.3   s=50 -> x10.6   s=100 -> x23   s=999 -> x403
export function hpMul(stage) {
  const s = Math.max(1, stage) - 1;
  return 1 + 0.15 * s + 0.004 * Math.pow(s, 1.6);
}

// ---- damage ----------------------------------------------------------
// Deliberately shallower than health: an endless run should end because the
// player runs out of room to kill things, not because a stage-40 rifleman
// deletes them in one burst.
//   s=10 -> x1.6   s=25 -> x2.6   s=50 -> x4.3   s=100 -> x8.0
export function dmgMul(stage) {
  const s = Math.max(1, stage) - 1;
  return 1 + 0.06 * s + 0.002 * Math.pow(s, 1.5);
}

// ---- squad size ------------------------------------------------------
// Square-root growth so the field fills out without turning into a wall, then
// a hard ceiling that exists purely as a performance budget (see the note at
// the top of this file).
export const ENEMY_COUNT_CEIL = 34;
export function enemyCount(stage) {
  const n = 6 + Math.floor(Math.sqrt(Math.max(1, stage)) * 2.1);
  return Math.min(ENEMY_COUNT_CEIL, n);
}

// ---- loot ------------------------------------------------------------
// Scales with squad size so a bigger fight still pays for itself.
export function lootCount(stage) {
  return 4 + Math.floor(Math.sqrt(Math.max(1, stage)) * 1.1);
}

// ---- base enemy stats -------------------------------------------------
const BASE_HP = 100;

export function enemyHp(stage) {
  return Math.round(BASE_HP * hpMul(stage));
}

// ---- boss stats -------------------------------------------------------
// A boss is a fixed multiple of what the squad is worth at the same stage.
//
// It is tempting to add a per-tier bonus on top of hpMul, but tier is itself
// derived from stage, so that double-scales: at stage 500 a `1 + tier * 0.08`
// term made the boss ~9x its own curve and ~35x a regular enemy — 595k HP
// against a player whose damage had grown nowhere near that. Keeping it a
// flat multiple means a boss always reads as the same kind of wall, whether
// it is stage 5 or stage 5000.
const BOSS_HP_FACTOR = 4.2;      // matches the original 420 vs 100 base ratio
export function bossHp(stage) {
  return Math.round(BASE_HP * hpMul(stage) * BOSS_HP_FACTOR);
}

export function bossDmgMul(stage) {
  return 1.6 * dmgMul(stage);
}

// Bosses read the same saturating AI curve, offset so an early boss already
// fights like a late-campaign regular.
export function bossSkill(stage) {
  return Math.min(AI_SKILL_CEIL, aiSkill(stage) + 6);
}

// A compact summary for the HUD / debug overlay.
export function describeStage(stage) {
  return {
    stage,
    boss: isBossStage(stage),
    tier: bossTier(stage),
    hp: isBossStage(stage) ? bossHp(stage) : enemyHp(stage),
    dmgMul: +(isBossStage(stage) ? bossDmgMul(stage) : dmgMul(stage)).toFixed(2),
    skill: +aiSkill(stage).toFixed(1),
    count: isBossStage(stage) ? 1 : enemyCount(stage),
  };
}
