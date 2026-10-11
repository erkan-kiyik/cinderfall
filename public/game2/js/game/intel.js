// Intel Logs — collectible lore.
//
// Sector 9 has no cutscenes and no dialogue. The story of how a city block
// became a warzone is told entirely through paper: evacuation orders, radio
// transcripts, a civilian's diary, the last note a sergeant ever wrote. The
// player recovers them off bodies, one fragment at a time, and reads them in
// the Archives.
//
// ---------------------------------------------------------------------------
// Why the prose isn't in this file
// ---------------------------------------------------------------------------
// This table is the *structure* of the collection — ids, who wrote each entry,
// when it can drop, whether it is boss-only. The prose itself lives in the TR
// and EN dictionaries under `intel.<id>.title` / `.body`, resolved through
// t(). The game ships in two languages and lore is the most language-sensitive
// content in it; hard-coding Turkish here would have made the English build
// silently untranslated, which is exactly the failure the i18n layer exists to
// prevent.

// Drop rates. A regular hostile is the common source; a boss is rare enough
// (one every five stages) that the same 6% would make bosses a non-source, so
// they carry a much higher rate and gate the four entries that actually
// resolve the story.
export const INTEL_DROP_CHANCE = 0.06;
export const BOSS_INTEL_DROP_CHANCE = 0.30;

// Paid out when a roll wins but there is nothing left to find, so a completed
// archive doesn't turn every future win into a silent no-op.
export const INTEL_DUPLICATE_SCRAP = 120;

// `minStage` staggers the narrative: the evacuation order can be found in the
// first block, the entries that explain *why* cannot. It is a floor, not a
// schedule — within the eligible set the pick is uniform, so two players
// rarely read the same fragments in the same order.
//
// `tier` drives nothing mechanical; it is the classification stamp printed on
// the reader, and it exists because a redacted file that looks like every
// other redacted file is not worth chasing.
export const INTEL_LOGS = [
  { id: 'log_01', minStage: 1,  bossOnly: false, tier: 'field' },
  { id: 'log_02', minStage: 1,  bossOnly: false, tier: 'signal' },
  { id: 'log_03', minStage: 2,  bossOnly: false, tier: 'field' },
  { id: 'log_04', minStage: 3,  bossOnly: false, tier: 'civilian' },
  { id: 'log_05', minStage: 4,  bossOnly: false, tier: 'signal' },
  { id: 'log_06', minStage: 6,  bossOnly: false, tier: 'field' },
  { id: 'log_07', minStage: 8,  bossOnly: false, tier: 'civilian' },
  { id: 'log_08', minStage: 11, bossOnly: false, tier: 'field' },
  // ---- boss-only: the four entries that name the operation ----
  { id: 'log_09', minStage: 5,  bossOnly: true,  tier: 'command' },
  { id: 'log_10', minStage: 10, bossOnly: true,  tier: 'command' },
  { id: 'log_11', minStage: 15, bossOnly: true,  tier: 'command' },
  { id: 'log_12', minStage: 20, bossOnly: true,  tier: 'blackfile' },
];

export const INTEL_TOTAL = INTEL_LOGS.length;

export function intelById(id) {
  return INTEL_LOGS.find((l) => l.id === id) || null;
}

// i18n key helpers — one place that knows the naming scheme, so a rename
// can't drift between the toast, the list and the reader.
export const intelTitleKey = (id) => `intel.${id}.title`;
export const intelBodyKey = (id) => `intel.${id}.body`;
export const intelSourceKey = (id) => `intel.${id}.source`;
export const intelTierKey = (tier) => `intel.tier.${tier}`;

// Rolls one kill's intel drop.
//
// `owned(id)` reports what the player already has, so a duplicate can never be
// rolled in the first place — the pool is filtered before the pick rather than
// re-rolled after it, which is what keeps the last few entries from taking
// exponentially longer to find as the archive fills up.
//
// `luck` (the equipped perk block's Loot Luck) scales only the win check.
// Feeding a luck-biased rng into the *pool index* as well — the bug this
// codebase already shipped once in loot.js — would skew selection toward the
// front of the list and make the later logs rarer than intended.
//
// Returns { kind: 'log', log } | { kind: 'scrap', amount } | null.
export function rollIntelDrop(isBoss, stage, owned, rng = Math.random, luck = 1) {
  const base = isBoss ? BOSS_INTEL_DROP_CHANCE : INTEL_DROP_CHANCE;
  if (rng() >= Math.min(0.95, base * Math.max(0, luck))) return null;

  const pool = INTEL_LOGS.filter((l) => (
    !owned(l.id) && stage >= l.minStage && (!l.bossOnly || isBoss)
  ));
  // Won the roll with nothing eligible left — pay out instead of dropping the
  // reward on the floor. This covers both "archive complete" and "the only
  // entries left are boss-only and this was a regular kill".
  if (!pool.length) return { kind: 'scrap', amount: INTEL_DUPLICATE_SCRAP };

  // Clamped: an rng that returns exactly 1 would otherwise index past the end
  // and turn a win into an undefined.
  const i = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  return { kind: 'log', log: pool[i] };
}

// Deterministic redaction blocks for an entry the player hasn't found.
//
// Seeded off the id so a locked row looks the same every time the Archives
// are opened. Re-randomising per render made the list visibly crawl, which
// read as a rendering bug rather than as censorship.
export function redactedTitle(id, len = 18) {
  let s = 0;
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) >>> 0;
  const glyphs = '█▓▒░█▓█';
  let out = '';
  for (let i = 0; i < len; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    // Unsigned shifts, not `>>`. `s` is a full uint32, so a signed shift goes
    // negative for any seed past 2^31 — that indexed the glyph string out of
    // bounds and printed the literal text "undefined" into the redaction bar.
    // spaces at pseudo-random intervals so it scans as words, not a bar
    out += (i > 2 && i < len - 3 && (s >>> 8) % 7 === 0) ? ' ' : glyphs[(s >>> 5) % glyphs.length];
  }
  return out;
}
