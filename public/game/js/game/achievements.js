// Achievement catalog for the Stats screen. Each entry names a stat key
// (resolved against live Progression data) and a goal; progress/lock/claim
// state is always derived live, never stored separately, so it can never
// drift out of sync with the underlying stat. Only the claimed flag persists
// (Progression.achievements[id]), since "have I collected the reward" is the
// one thing that truly needs to survive independent of the stat's value.
//
// Names, descriptions and tier labels live in the dictionaries
// (ach.<id>.name / ach.<id>.desc / ach.tier.<key>), not here: an English
// literal in the catalog is a string no translation can ever reach.

import { t } from '../engine/i18n.js';

export const TIERS = {
  easy:   { key: 'easy',   color: '#8fae6a', glow: 'rgba(143,174,106,0.55)' },
  medium: { key: 'medium', color: '#4a90d9', glow: 'rgba(74,144,217,0.6)' },
  hard:   { key: 'hard',   color: '#e0446e', glow: 'rgba(224,68,110,0.7)' },
};

const HOUR_MS = 3600000;

export const tierLabel = (tier) => t(`ach.tier.${tier.key}`);
export const achievementName = (ach) => t(`ach.${ach.id}.name`);
// The goal is the {n} in the description; playtime goals read in hours.
export function achievementDesc(ach) {
  const n = ach.stat === 'totalPlaytimeMs' ? ach.goal / HOUR_MS : ach.goal;
  return t(`ach.${ach.id}.desc`, { n: n.toLocaleString() });
}

export const ACHIEVEMENTS = [
  // ---- EASY ----
  { id: 'first_blood',   tier: 'easy', icon: 'skull',   stat: 'totalKills', goal: 1 },
  { id: 'window_shopper', tier: 'easy', icon: 'crate',   stat: 'cratesOpened', goal: 1 },
  { id: 'trigger_happy', tier: 'easy', icon: 'bullet',  stat: 'shotsTotal', goal: 500 },
  { id: 'attention_span', tier: 'easy', icon: 'play',    stat: 'totalAdsWatched', goal: 10 },
  { id: 'getting_started', tier: 'easy', icon: 'star',    stat: 'level', goal: 5 },
  { id: 'first_streak',  tier: 'easy', icon: 'fire',    stat: 'longestKillStreak', goal: 3 },
  { id: 'boss_slayer',   tier: 'easy', icon: 'crown',   stat: 'bossesDefeated', goal: 1 },

  // ---- MEDIUM ----
  { id: 'centurion',     tier: 'medium', icon: 'skull',   stat: 'totalKills', goal: 100 },
  { id: 'sharpshooter',  tier: 'medium', icon: 'target',  stat: 'totalHeadshots', goal: 50 },
  { id: 'combo_breaker', tier: 'medium', icon: 'bolt',    stat: 'highestCombo', goal: 5 },
  { id: 'unstoppable',   tier: 'medium', icon: 'fire',  stat: 'longestKillStreak', goal: 10 },
  { id: 'deep_cover',    tier: 'medium', icon: 'flag',    stat: 'longestSurvivalStage', goal: 10 },
  { id: 'crate_collector', tier: 'medium', icon: 'crate',   stat: 'cratesOpened', goal: 25 },
  { id: 'big_spender',   tier: 'medium', icon: 'scrap',    stat: 'lifetimeScrapEarned', goal: 5000 },
  { id: 'arsenal',       tier: 'medium', icon: 'guns',    stat: 'weaponsUsedCount', goal: 5 },
  { id: 'ad_regular',    tier: 'medium', icon: 'play',    stat: 'totalAdsWatched', goal: 100 },
  { id: 'hour_one',      tier: 'medium', icon: 'clock',   stat: 'totalPlaytimeMs', goal: HOUR_MS },

  // ---- HARD ----
  { id: 'one_in_a_thousand', tier: 'hard', icon: 'skull',   stat: 'totalKills', goal: 1000 },
  { id: 'deadeye',       tier: 'hard', icon: 'target',  stat: 'totalHeadshots', goal: 300 },
  { id: 'chain_reaction', tier: 'hard', icon: 'bolt',    stat: 'highestCombo', goal: 10 },
  { id: 'ghost',         tier: 'hard', icon: 'fire', stat: 'longestKillStreak', goal: 25 },
  { id: 'sector_master', tier: 'hard', icon: 'flag',    stat: 'longestSurvivalStage', goal: 25 },
  // `id` is the persisted claim key, so it keeps its pre-scrap name — renaming
  // it would hand every existing player this achievement to claim a second time.
  { id: 'diamond_mogul', tier: 'hard', icon: 'scrap',   stat: 'lifetimeScrapEarned', goal: 50000 },
  { id: 'ad_veteran',    tier: 'hard', icon: 'play',    stat: 'totalAdsWatched', goal: 500 },
  { id: 'marathon',      tier: 'hard', icon: 'clock',   stat: 'totalPlaytimeMs', goal: 5 * HOUR_MS },
  { id: 'sector9_legend', tier: 'hard', icon: 'star',    stat: 'level', goal: 20 },
  { id: 'boss_hunter',   tier: 'hard', icon: 'crown',   stat: 'bossesDefeated', goal: 10 },
];

// Resolves an achievement's `stat` key against live Progression data —
// a couple of keys (weaponsUsedCount, level) are derived, everything else
// reads a raw lifetime counter directly.
export function statValue(key, p) {
  switch (key) {
    case 'weaponsUsedCount': return p.weaponsUsedCount();
    case 'level': return p.data.level;
    default: return p.data[key] || 0;
  }
}

export function achievementProgress(ach, p) {
  const value = statValue(ach.stat, p);
  const unlocked = value >= ach.goal;
  const claimed = p.achievementClaimed(ach.id);
  return { value, frac: Math.min(1, value / ach.goal), unlocked, claimed };
}

// Small procedural vector icons — kept simple (single-color path fills, no
// detail past what reads at ~40px) so the set stays cheap to draw and easy
// to extend, matching how every other icon in this game is canvas-painted
// rather than an image asset.
export function drawAchievementIcon(g, kind, w, h, color) {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.34;
  g.save();
  g.translate(cx, cy);
  g.fillStyle = color; g.strokeStyle = color; g.lineWidth = Math.max(1.4, r * 0.14);
  g.lineCap = 'round'; g.lineJoin = 'round';
  switch (kind) {
    case 'skull':
      g.beginPath(); g.arc(0, -r * 0.15, r * 0.75, Math.PI, 0); g.fill();
      g.fillRect(-r * 0.55, -r * 0.1, r * 1.1, r * 0.7);
      g.globalCompositeOperation = 'destination-out';
      g.beginPath(); g.arc(-r * 0.32, -r * 0.05, r * 0.18, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(r * 0.32, -r * 0.05, r * 0.18, 0, Math.PI * 2); g.fill();
      g.fillRect(-r * 0.1, r * 0.28, r * 0.2, r * 0.22);
      g.globalCompositeOperation = 'source-over';
      break;
    case 'crate':
      g.strokeRect(-r * 0.7, -r * 0.55, r * 1.4, r * 1.1);
      g.beginPath(); g.moveTo(-r * 0.7, 0); g.lineTo(r * 0.7, 0); g.stroke();
      g.beginPath(); g.moveTo(0, -r * 0.55); g.lineTo(0, r * 0.55); g.stroke();
      break;
    case 'bullet':
      g.beginPath();
      g.moveTo(-r * 0.3, -r * 0.85); g.lineTo(r * 0.3, -r * 0.85);
      g.lineTo(r * 0.3, r * 0.3); g.lineTo(0, r * 0.85); g.lineTo(-r * 0.3, r * 0.3);
      g.closePath(); g.fill();
      break;
    case 'play':
      g.beginPath(); g.moveTo(-r * 0.5, -r * 0.75); g.lineTo(r * 0.8, 0); g.lineTo(-r * 0.5, r * 0.75); g.closePath(); g.fill();
      break;
    case 'star': {
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const ang = (Math.PI / 5) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? r * 0.95 : r * 0.4;
        const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath(); g.fill();
      break;
    }
    case 'fire':
      g.beginPath();
      g.moveTo(0, r * 0.9);
      g.quadraticCurveTo(-r * 0.7, r * 0.3, -r * 0.35, -r * 0.2);
      g.quadraticCurveTo(-r * 0.15, -r * 0.5, -r * 0.05, -r * 0.9);
      g.quadraticCurveTo(r * 0.1, -r * 0.35, r * 0.3, -r * 0.25);
      g.quadraticCurveTo(r * 0.5, r * 0.05, r * 0.35, r * 0.3);
      g.quadraticCurveTo(r * 0.55, r * 0.15, r * 0.55, -r * 0.05);
      g.quadraticCurveTo(r * 0.8, r * 0.4, 0, r * 0.9);
      g.closePath(); g.fill();
      break;
    case 'target':
      g.lineWidth = r * 0.15;
      g.beginPath(); g.arc(0, 0, r * 0.85, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(0, 0, r * 0.45, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(0, 0, r * 0.1, 0, Math.PI * 2); g.fill();
      break;
    case 'bolt':
      g.beginPath();
      g.moveTo(r * 0.15, -r * 0.9); g.lineTo(-r * 0.5, r * 0.1); g.lineTo(-r * 0.05, r * 0.1);
      g.lineTo(-r * 0.15, r * 0.9); g.lineTo(r * 0.55, -r * 0.1); g.lineTo(r * 0.1, -r * 0.1);
      g.closePath(); g.fill();
      break;
    case 'flag':
      g.lineWidth = r * 0.18;
      g.beginPath(); g.moveTo(-r * 0.55, -r * 0.9); g.lineTo(-r * 0.55, r * 0.9); g.stroke();
      g.beginPath();
      g.moveTo(-r * 0.55, -r * 0.85); g.lineTo(r * 0.75, -r * 0.55); g.lineTo(-r * 0.05, -r * 0.25);
      g.lineTo(-r * 0.55, -r * 0.3); g.closePath(); g.fill();
      break;
    // Scrap: the same sheared plate + bolt silhouette as the currency icon in
    // art/currency.js, reduced to a flat shape so it still reads at 40px.
    case 'scrap':
      g.beginPath();
      g.moveTo(-r * 0.9, -r * 0.65); g.lineTo(r * 0.45, -r * 0.8);
      g.lineTo(r * 0.9, -r * 0.08); g.lineTo(r * 0.62, r * 0.72);
      g.lineTo(-r * 0.6, r * 0.78); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = Math.max(1, r * 0.12);
      g.beginPath(); g.arc(-r * 0.12, 0, r * 0.24, 0, Math.PI * 2); g.stroke();
      break;
    // Was a bare X, which read as "unavailable" rather than "armoury". Two
    // crossed rifle silhouettes — receiver, magazine and muzzle — say it.
    case 'guns': {
      const rifle = () => {
        g.beginPath();
        g.moveTo(-r * 0.85, -r * 0.10); g.lineTo(r * 0.72, -r * 0.10);
        g.lineTo(r * 0.72, r * 0.10);   g.lineTo(r * 0.20, r * 0.10);
        g.lineTo(r * 0.10, r * 0.44);   g.lineTo(-r * 0.12, r * 0.44);
        g.lineTo(-r * 0.06, r * 0.10);  g.lineTo(-r * 0.85, r * 0.10);
        g.closePath(); g.fill();
      };
      g.save(); g.rotate(-Math.PI / 5); rifle(); g.restore();
      g.save(); g.rotate(Math.PI / 5); g.scale(-1, 1); rifle(); g.restore();
      break;
    }
    // Precision: a reticle with the ring broken at the cardinals, so it does
    // not collide with the solid concentric rings of `target` (accuracy).
    case 'crosshair': {
      g.lineWidth = r * 0.14;
      for (let i = 0; i < 4; i++) {
        const a0 = -Math.PI / 2 + i * Math.PI / 2 + 0.32;
        g.beginPath(); g.arc(0, 0, r * 0.76, a0, a0 + Math.PI / 2 - 0.64); g.stroke();
      }
      g.beginPath(); g.moveTo(0, -r * 0.98); g.lineTo(0, -r * 0.5); g.stroke();
      g.beginPath(); g.moveTo(0, r * 0.5); g.lineTo(0, r * 0.98); g.stroke();
      g.beginPath(); g.moveTo(-r * 0.98, 0); g.lineTo(-r * 0.5, 0); g.stroke();
      g.beginPath(); g.moveTo(r * 0.5, 0); g.lineTo(r * 0.98, 0); g.stroke();
      g.beginPath(); g.arc(0, 0, r * 0.13, 0, Math.PI * 2); g.fill();
      break;
    }
    // Rank: stacked chevrons, the way a rating patch reads.
    case 'chevron': {
      g.lineWidth = r * 0.2; g.lineJoin = 'miter';
      for (let i = 0; i < 3; i++) {
        const y = r * 0.55 - i * r * 0.48;
        g.beginPath();
        g.moveTo(-r * 0.72, y); g.lineTo(0, y - r * 0.42); g.lineTo(r * 0.72, y);
        g.stroke();
      }
      break;
    }
    // Experience: a four-point spark, distinct from the lightning `bolt`.
    case 'spark':
      g.beginPath();
      g.moveTo(0, -r);
      g.quadraticCurveTo(r * 0.14, -r * 0.14, r, 0);
      g.quadraticCurveTo(r * 0.14, r * 0.14, 0, r);
      g.quadraticCurveTo(-r * 0.14, r * 0.14, -r, 0);
      g.quadraticCurveTo(-r * 0.14, -r * 0.14, 0, -r);
      g.closePath(); g.fill();
      break;
    // Damage output: a broadhead pointing up and to the right.
    case 'blade':
      g.beginPath();
      g.moveTo(r * 0.9, -r * 0.9); g.lineTo(r * 0.9, -r * 0.1); g.lineTo(r * 0.5, -r * 0.5);
      g.lineTo(-r * 0.42, r * 0.42); g.lineTo(-r * 0.9, r * 0.9); g.lineTo(-r * 0.42, r * 0.86);
      g.lineTo(r * 0.1, -r * 0.5); g.closePath(); g.fill();
      g.beginPath();
      g.moveTo(r * 0.9, -r * 0.9); g.lineTo(r * 0.1, -r * 0.9); g.lineTo(r * 0.5, -r * 0.5);
      g.closePath(); g.fill();
      break;
    case 'clock':
      g.lineWidth = r * 0.14;
      g.beginPath(); g.arc(0, 0, r * 0.85, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r * 0.5); g.stroke();
      g.beginPath(); g.moveTo(0, 0); g.lineTo(r * 0.4, r * 0.15); g.stroke();
      break;
    case 'crown':
      g.beginPath();
      g.moveTo(-r * 0.85, r * 0.5);
      g.lineTo(-r * 0.85, -r * 0.1); g.lineTo(-r * 0.45, r * 0.15);
      g.lineTo(0, -r * 0.75); g.lineTo(r * 0.45, r * 0.15);
      g.lineTo(r * 0.85, -r * 0.1); g.lineTo(r * 0.85, r * 0.5);
      g.closePath(); g.fill();
      break;
    // Vitality: a plate carrier's front panel, tapering to a point.
    case 'shield':
      g.beginPath();
      g.moveTo(0, -r * 0.85);
      g.lineTo(r * 0.72, -r * 0.5);
      g.lineTo(r * 0.72, r * 0.18);
      g.quadraticCurveTo(r * 0.6, r * 0.72, 0, r * 0.92);
      g.quadraticCurveTo(-r * 0.6, r * 0.72, -r * 0.72, r * 0.18);
      g.lineTo(-r * 0.72, -r * 0.5);
      g.closePath(); g.fill();
      break;
    default:
      g.beginPath(); g.arc(0, 0, r * 0.7, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}
