// Stats screen: the lifetime-counters overview grid and the achievement
// browser (progress bars, lock state, claim). All numbers are read live off
// Progression — this module never stores anything itself besides the
// achievements' claimed flag (on Progression).

import { ACHIEVEMENTS, TIERS, achievementProgress, drawAchievementIcon } from './achievements.js';
import { playCurrencyGain, animateCount } from './currencyfx.js';

const $ = (id) => document.getElementById(id);

function formatDuration(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const STAT_FIELDS = [
  { key: 'playtime',   label: 'TOTAL PLAYTIME',          icon: 'clock',  value: (p) => formatDuration(p.data.totalPlaytimeMs) },
  { key: 'kills',      label: 'TOTAL KILLS',             icon: 'skull',  value: (p) => p.data.totalKills.toLocaleString() },
  { key: 'shots',      label: 'SHOTS FIRED',             icon: 'bullet', value: (p) => p.data.shotsTotal.toLocaleString() },
  { key: 'accuracy',   label: 'ACCURACY',                icon: 'target', value: (p) => `${p.accuracy()}%` },
  { key: 'headshots',  label: 'HEADSHOTS',               icon: 'target', value: (p) => p.data.totalHeadshots.toLocaleString() },
  { key: 'combo',      label: 'HIGHEST COMBO',           icon: 'bolt',   value: (p) => String(p.data.highestCombo) },
  { key: 'streak',     label: 'LONGEST KILL STREAK',     icon: 'fire',   value: (p) => String(p.data.longestKillStreak) },
  { key: 'scrap',      label: 'LIFETIME SCRAP SALVAGED', icon: 'scrap',  value: (p) => p.data.lifetimeScrapEarned.toLocaleString() },
  { key: 'ads',        label: 'ADS WATCHED',             icon: 'play',   value: (p) => p.data.totalAdsWatched.toLocaleString() },
  { key: 'missions',   label: 'MISSIONS COMPLETED',      icon: 'flag',   value: (p) => String(p.data.totalMissionsCompleted) },
  { key: 'crates',     label: 'CRATES OPENED',           icon: 'crate',  value: (p) => String(p.data.cratesOpened) },
  { key: 'weaponsUsed', label: 'WEAPONS USED',           icon: 'guns',   value: (p) => String(p.weaponsUsedCount()) },
  { key: 'mostUsed',   label: 'MOST USED WEAPON',        icon: 'star',   value: (p, weapons) => { const id = p.mostUsedWeapon(); return id ? (weapons[id]?.name || id) : '—'; } },
  { key: 'level',      label: 'OPERATOR LEVEL',          icon: 'star',   value: (p) => String(p.data.level) },
  { key: 'xp',         label: 'TOTAL XP',                icon: 'bolt',   value: (p) => Math.round(p.data.xp).toLocaleString() },
];

export class StatsUI {
  constructor(deps) {
    this.p = deps.progression;
    this.weapons = deps.weapons || {};
    this.audio = deps.audio || null;
    this.section = 'overview';
    this.busy = false;
  }

  mount() {
    document.querySelectorAll('.stats-subtab').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.section = btn.dataset.section;
        this.applySectionVisibility();
        if (this.audio) this.audio.ui();
      });
    });
    this.refresh();
  }

  refresh() {
    this.renderOverview();
    this.renderAchievements();
    this.applySectionVisibility();
  }

  applySectionVisibility() {
    document.querySelectorAll('.stats-subtab').forEach((b) => b.classList.toggle('active', b.dataset.section === this.section));
    $('stats-overview').classList.toggle('hidden', this.section !== 'overview');
    $('stats-achievements').classList.toggle('hidden', this.section !== 'achievements');
  }

  renderOverview() {
    const grid = $('stats-grid');
    grid.innerHTML = '';
    for (const field of STAT_FIELDS) {
      const card = document.createElement('div');
      card.className = 'stat-card';
      const cv = document.createElement('canvas');
      cv.className = 'stat-card-icon';
      card.appendChild(cv);
      const val = document.createElement('div');
      val.className = 'stat-card-value';
      val.textContent = field.value(this.p, this.weapons);
      card.appendChild(val);
      const lbl = document.createElement('div');
      lbl.className = 'stat-card-label';
      lbl.textContent = field.label;
      card.appendChild(lbl);
      grid.appendChild(card);
      requestAnimationFrame(() => {
        const g = cv.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = cv.clientWidth || 28, h = cv.clientHeight || 28;
        cv.width = w * dpr; cv.height = h * dpr;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawAchievementIcon(g, field.icon, w, h, '#ff5c46');
      });
    }
  }

  renderAchievements() {
    const host = $('achievements-list');
    host.innerHTML = '';
    for (const tierKey of ['easy', 'medium', 'hard']) {
      const tier = TIERS[tierKey];
      const group = ACHIEVEMENTS.filter((a) => a.tier === tierKey);
      const head = document.createElement('div');
      head.className = 'achievement-tier-head';
      head.style.color = tier.color;
      head.textContent = `${tier.label} (${group.filter((a) => this.p.achievementClaimed(a.id)).length}/${group.length})`;
      host.appendChild(head);

      const grid = document.createElement('div');
      grid.className = 'achievements-grid';
      for (const ach of group) {
        grid.appendChild(this.makeAchievementCard(ach, tier));
      }
      host.appendChild(grid);
    }
  }

  makeAchievementCard(ach, tier) {
    const prog = achievementProgress(ach, this.p);
    const card = document.createElement('div');
    card.className = 'achievement-card' + (prog.claimed ? ' claimed' : prog.unlocked ? ' unlocked' : ' locked');
    card.style.setProperty('--tier-color', tier.color);
    card.style.setProperty('--tier-glow', tier.glow);

    const iconWrap = document.createElement('div');
    iconWrap.className = 'achievement-icon-wrap';
    const cv = document.createElement('canvas');
    cv.className = 'achievement-icon';
    iconWrap.appendChild(cv);
    if (!prog.unlocked) {
      const lock = document.createElement('div');
      lock.className = 'achievement-lock';
      lock.textContent = '🔒';
      iconWrap.appendChild(lock);
    }
    card.appendChild(iconWrap);

    const name = document.createElement('div');
    name.className = 'achievement-name';
    name.textContent = ach.name;
    card.appendChild(name);

    const desc = document.createElement('div');
    desc.className = 'achievement-desc';
    desc.textContent = ach.desc;
    card.appendChild(desc);

    const track = document.createElement('div');
    track.className = 'achievement-progress-track';
    const fill = document.createElement('div');
    fill.className = 'achievement-progress-fill';
    fill.style.width = `${Math.round(prog.frac * 100)}%`;
    track.appendChild(fill);
    card.appendChild(track);

    const goalLabel = ach.stat === 'totalPlaytimeMs'
      ? `${Math.round(prog.value / 60000)}m / ${Math.round(ach.goal / 60000)}m`
      : `${Math.min(prog.value, ach.goal).toLocaleString()} / ${ach.goal.toLocaleString()}`;
    const progLabel = document.createElement('div');
    progLabel.className = 'achievement-progress-label';
    progLabel.textContent = goalLabel;
    card.appendChild(progLabel);

    if (prog.claimed) {
      const badge = document.createElement('div');
      badge.className = 'achievement-badge';
      badge.textContent = 'COMPLETED';
      card.appendChild(badge);
    } else if (prog.unlocked) {
      const btn = document.createElement('button');
      btn.className = 'btn primary achievement-claim-btn';
      btn.textContent = 'CLAIM +1 DIAMOND';
      btn.addEventListener('click', () => this.claimAchievement(ach.id));
      card.appendChild(btn);
    }

    requestAnimationFrame(() => {
      const g = cv.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth || 40, h = cv.clientHeight || 40;
      cv.width = w * dpr; cv.height = h * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawAchievementIcon(g, ach.icon, w, h, tier.color);
    });
    return card;
  }

  claimAchievement(id) {
    const before = this.p.scrap;
    if (!this.p.claimAchievement(id)) return;
    this.renderAchievements();
    this.renderOverview();
    const scrapCount = $('scrap-count');
    if (scrapCount) animateCount(scrapCount, before, this.p.scrap);
    playCurrencyGain(document.querySelector('.scrap-pill'), 'scrap', this.audio);
  }

}
