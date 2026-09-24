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
  { day: 1, kind: 'scrap', amount: 60 },
  { day: 2, kind: 'scrap', amount: 90 },
  { day: 3, kind: 'scrap', amount: 140 },
  { day: 4, kind: 'scrap', amount: 200 },
  { day: 5, kind: 'scrap', amount: 280 },
  { day: 6, kind: 'scrap', amount: 380 },
  { day: 7, kind: 'scrap', amount: 600 },
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

// What dayStamp() writes. Anything else in lastClaim is corruption.
const STAMP_RE = /^\d{4}-\d{1,2}-\d{1,2}$/;

// The save is checked for shape, not trusted: this runs at boot, before the
// first frame, so a stored `null` or a numeric lastClaim used to throw here
// and leave the game frozen on every launch. Anything malformed reads as a
// fresh record — at worst that offers a day-1 reward, never a dead menu.
function load() {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    const d = raw ? JSON.parse(raw) : null;
    if (d && typeof d === 'object' && typeof d.lastClaim === 'string' && STAMP_RE.test(d.lastClaim)) {
      const streak = Number.isFinite(d.streak) && d.streak > 0 ? Math.floor(d.streak) : 0;
      return { lastClaim: d.lastClaim, streak };
    }
  } catch (e) { /* private browsing, or unparseable */ }
  return { lastClaim: null, streak: 0 };
}

function save(d) {
  try { localStorage.setItem(DAILY_KEY, JSON.stringify(d)); } catch (e) { /* ignore */ }
}

// What the player is owed right now.
//   available — a reward can be claimed today
//   day       — position in the 7-day cycle this claim would be
//   streak    — consecutive days already claimed
//
// This trusts the device clock, and offline there is nothing better to trust:
// stepping the clock forward a day at a time does farm the cycle, and no
// amount of local bookkeeping can tell that apart from a player who really
// did come back tomorrow. What it must not do is punish the other direction.
export function dailyStatus() {
  const d = load();
  const today = dayStamp();
  if (!d.lastClaim) return { available: true, day: 1, streak: 0 };
  const gap = daysBetween(d.lastClaim, today);
  if (gap < 0) {
    // The last claim is dated in the future: the clock was rolled back, or a
    // clock that ran ahead got corrected. Waiting for real time to catch up
    // with the furthest date ever faked locked claims out for as long as the
    // clock had been wrong. Re-anchor to today instead, with no payout — a
    // rollback costs at most today's claim, the streak survives, and
    // tomorrow is claimable as normal.
    save({ lastClaim: today, streak: d.streak });
    return { available: false, day: d.streak, streak: d.streak };
  }
  if (gap === 0) return { available: false, day: d.streak, streak: d.streak };
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
