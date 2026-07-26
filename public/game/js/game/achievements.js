// Achievement catalog for the Stats screen. Each entry names a stat key
// (resolved against live Progression data) and a goal; progress/lock/claim
// state is always derived live, never stored separately, so it can never
// drift out of sync with the underlying stat. Only the claimed flag persists
// (Progression.achievements[id]), since "have I collected the reward" is the
// one thing that truly needs to survive independent of the stat's value.

export const TIERS = {
  easy:   { key: 'easy',   label: 'EASY',   color: '#8fae6a', glow: 'rgba(143,174,106,0.55)' },
  medium: { key: 'medium', label: 'MEDIUM', color: '#4a90d9', glow: 'rgba(74,144,217,0.6)' },
  hard:   { key: 'hard',   label: 'HARD',   color: '#e0446e', glow: 'rgba(224,68,110,0.7)' },
};

export const ACHIEVEMENTS = [
  // ---- EASY ----
  { id: 'first_blood',   tier: 'easy', name: 'FIRST BLOOD',      desc: 'Eliminate your first hostile.',            icon: 'skull',   stat: 'totalKills', goal: 1 },
  { id: 'window_shopper', tier: 'easy', name: 'WINDOW SHOPPER',  desc: 'Open your first supply crate.',            icon: 'crate',   stat: 'cratesOpened', goal: 1 },
  { id: 'trigger_happy', tier: 'easy', name: 'TRIGGER HAPPY',    desc: 'Fire 500 rounds.',                         icon: 'bullet',  stat: 'shotsTotal', goal: 500 },
  { id: 'attention_span', tier: 'easy', name: 'ATTENTION SPAN',  desc: 'Watch 10 rewarded ads.',                   icon: 'play',    stat: 'totalAdsWatched', goal: 10 },
  { id: 'getting_started', tier: 'easy', name: 'GETTING STARTED', desc: 'Reach operator level 5.',                 icon: 'star',    stat: 'level', goal: 5 },
  { id: 'first_streak',  tier: 'easy', name: 'ON A ROLL',        desc: 'Land a 3-kill streak without going down.', icon: 'fire',    stat: 'longestKillStreak', goal: 3 },

  // ---- MEDIUM ----
  { id: 'centurion',     tier: 'medium', name: 'CENTURION',       desc: 'Eliminate 100 hostiles.',                  icon: 'skull',   stat: 'totalKills', goal: 100 },
  { id: 'sharpshooter',  tier: 'medium', name: 'SHARPSHOOTER',    desc: 'Land 50 headshots.',                       icon: 'target',  stat: 'totalHeadshots', goal: 50 },
  { id: 'combo_breaker', tier: 'medium', name: 'COMBO BREAKER',   desc: 'Reach a 5-kill combo.',                    icon: 'bolt',    stat: 'highestCombo', goal: 5 },
  { id: 'unstoppable',   tier: 'medium', name: 'UNSTOPPABLE',     desc: 'Reach a 10-kill streak without going down.', icon: 'fire',  stat: 'longestKillStreak', goal: 10 },
  { id: 'deep_cover',    tier: 'medium', name: 'DEEP COVER',      desc: 'Reach stage 10 in a single run.',          icon: 'flag',    stat: 'longestSurvivalStage', goal: 10 },
  { id: 'crate_collector', tier: 'medium', name: 'CRATE COLLECTOR', desc: 'Open 25 supply crates.',                 icon: 'crate',   stat: 'cratesOpened', goal: 25 },
  { id: 'big_spender',   tier: 'medium', name: 'COMING UP COINS', desc: 'Earn 5,000 lifetime Coins.',               icon: 'coin',    stat: 'lifetimeCoinsEarned', goal: 5000 },
  { id: 'gem_hunter',    tier: 'medium', name: 'GEM HUNTER',      desc: 'Earn 50 lifetime Diamonds.',               icon: 'diamond', stat: 'lifetimeDiamondsEarned', goal: 50 },
  { id: 'arsenal',       tier: 'medium', name: 'ARSENAL',         desc: 'Fire 5 different weapons.',                icon: 'guns',    stat: 'weaponsUsedCount', goal: 5 },
  { id: 'ad_regular',    tier: 'medium', name: 'AD REGULAR',      desc: 'Watch 100 rewarded ads.',                  icon: 'play',    stat: 'totalAdsWatched', goal: 100 },
  { id: 'hour_one',      tier: 'medium', name: 'HOUR ONE',        desc: 'Play for 1 hour total.',                   icon: 'clock',   stat: 'totalPlaytimeMs', goal: 3600000 },

  // ---- HARD ----
  { id: 'one_in_a_thousand', tier: 'hard', name: 'ONE IN A THOUSAND', desc: 'Eliminate 1,000 hostiles.',           icon: 'skull',   stat: 'totalKills', goal: 1000 },
  { id: 'deadeye',       tier: 'hard', name: 'DEADEYE',           desc: 'Land 300 headshots.',                     icon: 'target',  stat: 'totalHeadshots', goal: 300 },
  { id: 'chain_reaction', tier: 'hard', name: 'CHAIN REACTION',   desc: 'Reach a 10-kill combo.',                  icon: 'bolt',    stat: 'highestCombo', goal: 10 },
  { id: 'ghost',         tier: 'hard', name: 'GHOST',             desc: 'Reach a 25-kill streak without going down.', icon: 'fire', stat: 'longestKillStreak', goal: 25 },
  { id: 'sector_master', tier: 'hard', name: 'SECTOR MASTER',     desc: 'Reach stage 25 in a single run.',         icon: 'flag',    stat: 'longestSurvivalStage', goal: 25 },
  { id: 'diamond_mogul', tier: 'hard', name: 'DIAMOND MOGUL',     desc: 'Earn 500 lifetime Diamonds.',             icon: 'diamond', stat: 'lifetimeDiamondsEarned', goal: 500 },
  { id: 'ad_veteran',    tier: 'hard', name: 'AD VETERAN',        desc: 'Watch 500 rewarded ads.',                 icon: 'play',    stat: 'totalAdsWatched', goal: 500 },
  { id: 'marathon',      tier: 'hard', name: 'MARATHON OPERATOR', desc: 'Play for 5 hours total.',                 icon: 'clock',   stat: 'totalPlaytimeMs', goal: 5 * 3600000 },
  { id: 'sector9_legend', tier: 'hard', name: 'SECTOR 9 LEGEND',  desc: 'Reach operator level 20.',                icon: 'star',    stat: 'level', goal: 20 },
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
    case 'coin':
      g.lineWidth = r * 0.14;
      g.beginPath(); g.arc(0, 0, r * 0.85, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.font = `700 ${r}px var(--font, sans-serif)`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('$', 0, r * 0.06);
      break;
    case 'diamond':
      g.beginPath();
      g.moveTo(0, -r); g.lineTo(r * 0.8, -r * 0.28); g.lineTo(r * 0.5, r * 0.85);
      g.lineTo(-r * 0.5, r * 0.85); g.lineTo(-r * 0.8, -r * 0.28); g.closePath(); g.fill();
      break;
    case 'guns':
      g.lineWidth = r * 0.2;
      g.beginPath(); g.moveTo(-r * 0.7, -r * 0.7); g.lineTo(r * 0.7, r * 0.7); g.stroke();
      g.beginPath(); g.moveTo(-r * 0.7, r * 0.7); g.lineTo(r * 0.7, -r * 0.7); g.stroke();
      break;
    case 'clock':
      g.lineWidth = r * 0.14;
      g.beginPath(); g.arc(0, 0, r * 0.85, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r * 0.5); g.stroke();
      g.beginPath(); g.moveTo(0, 0); g.lineTo(r * 0.4, r * 0.15); g.stroke();
      break;
    default:
      g.beginPath(); g.arc(0, 0, r * 0.7, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}
