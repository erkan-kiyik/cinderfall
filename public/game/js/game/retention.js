// Daily login rewards.
//
// Exists to give a player a reason to come back. Deliberately kept honest:
// the streak is real calendar days (not sessions), and nothing here nags.
// The share flow lives in game/sharecard.js.

const DAILY_KEY = 'cinderfall.daily.v1';

// Seven-day cycle, escalating. Day 7 is worth coming back for; days 1-2 are
// small enough that missing them costs little. `kind` maps to a Progression
// grant the caller performs — this module only decides *what* is owed.
export const DAILY_REWARDS = [
  { day: 1, kind: 'tokens',   amount: 60 },
  { day: 2, kind: 'tokens',   amount: 90 },
  { day: 3, kind: 'diamonds', amount: 2 },
  { day: 4, kind: 'tokens',   amount: 150 },
  { day: 5, kind: 'diamonds', amount: 4 },
  { day: 6, kind: 'tokens',   amount: 240 },
  { day: 7, kind: 'diamonds', amount: 10 },
];

// Local calendar day, not UTC and not a rolling 24h window: players think in
// days, and a UTC boundary means someone in UTC+3 loses their streak at 3am.
function dayStamp(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function daysBetween(aStamp, bStamp) {
  const [ay, am, ad] = aStamp.split('-').map(Number);
  const [by, bm, bd] = bStamp.split('-').map(Number);
  const a = Date.UTC(ay, am - 1, ad), b = Date.UTC(by, bm - 1, bd);
  return Math.round((b - a) / 86400000);
}

function load() {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* private browsing */ }
  return { lastClaim: null, streak: 0 };
}

function save(d) {
  try { localStorage.setItem(DAILY_KEY, JSON.stringify(d)); } catch (e) { /* ignore */ }
}

// What the player is owed right now.
//   available — a reward can be claimed today
//   day       — position in the 7-day cycle this claim would be
//   streak    — consecutive days already claimed
export function dailyStatus() {
  const d = load();
  const today = dayStamp();
  if (!d.lastClaim) return { available: true, day: 1, streak: 0 };
  const gap = daysBetween(d.lastClaim, today);
  if (gap <= 0) return { available: false, day: d.streak, streak: d.streak };
  // A missed day resets the cycle. One day's grace only — that's what makes
  // the streak mean anything.
  const streak = gap === 1 ? d.streak : 0;
  return { available: true, day: (streak % DAILY_REWARDS.length) + 1, streak };
}

// Claims today's reward and advances the streak. Returns the reward, or null
// if nothing was owed (double-claim guard).
export function claimDaily() {
  const st = dailyStatus();
  if (!st.available) return null;
  const reward = DAILY_REWARDS[st.day - 1];
  save({ lastClaim: dayStamp(), streak: st.streak + 1 });
  return reward;
}
