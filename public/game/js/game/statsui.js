// Stats screen: the lifetime-counters overview grid and the achievement
// browser (progress bars, lock state, claim). All numbers are read live off
// Progression — this module never stores anything itself besides the
// achievements' claimed flag (on Progression).

import { ACHIEVEMENTS, TIERS, achievementProgress, drawAchievementIcon } from './achievements.js';
import { playCurrencyGain, animateCount } from './currencyfx.js';
import { slidePill, popIn, sparks, coinsTo, haptic, sfx, spring, level } from '../ui/motion.js';
import { paintMedalCanvas } from '../art/medal.js';
import { renderScrapIcon } from '../art/currency.js';
import { ACHIEVEMENT_SCRAP } from './progression.js';

const $ = (id) => document.getElementById(id);

function formatDuration(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// Grouped rather than one 17-card wall. A flat grid left an orphan card on
// its own final row and gave the eye no place to start; three named blocks —
// how you fight, how far you have come, what you have banked — each land on a
// clean row and let a player find the number they came for. Every field owns a
// distinct icon: `accuracy` and `headshots` both drew the same reticle before,
// as did combo/XP, level/most-used and weapons-used/damage-bonus.
const STAT_GROUPS = [
  { label: 'COMBAT RECORD', fields: [
    { key: 'kills',      label: 'TOTAL KILLS',             icon: 'skull',     value: (p) => p.data.totalKills.toLocaleString() },
    { key: 'headshots',  label: 'HEADSHOTS',               icon: 'crosshair', value: (p) => p.data.totalHeadshots.toLocaleString() },
    { key: 'accuracy',   label: 'ACCURACY',                icon: 'target',    value: (p) => `${p.accuracy()}%` },
    { key: 'shots',      label: 'SHOTS FIRED',             icon: 'bullet',    value: (p) => p.data.shotsTotal.toLocaleString() },
    { key: 'combo',      label: 'HIGHEST COMBO',           icon: 'bolt',      value: (p) => String(p.data.highestCombo) },
    { key: 'streak',     label: 'LONGEST KILL STREAK',     icon: 'fire',      value: (p) => String(p.data.longestKillStreak) },
    { key: 'missions',   label: 'MISSIONS COMPLETED',      icon: 'flag',      value: (p) => String(p.data.totalMissionsCompleted) },
    { key: 'playtime',   label: 'TOTAL PLAYTIME',          icon: 'clock',     value: (p) => formatDuration(p.data.totalPlaytimeMs) },
  ] },
  { label: 'OPERATOR', fields: [
    { key: 'level',      label: 'OPERATOR LEVEL',          icon: 'chevron',   value: (p) => String(p.data.level) },
    { key: 'xp',         label: 'TOTAL XP',                icon: 'spark',     value: (p) => Math.round(p.data.xp).toLocaleString() },
    // What the level is actually worth in the field. Without these two rows
    // the per-level stat gain is invisible — the player would be getting
    // steadily tougher with nothing on screen ever saying so.
    { key: 'lvlHp',      label: 'LEVEL BONUS — HEALTH',    icon: 'shield',    value: (p) => `+${p.levelBonuses().maxHp}` },
    { key: 'lvlDmg',     label: 'LEVEL BONUS — DAMAGE',    icon: 'blade',     value: (p) => `+${Math.round(p.levelBonuses().damage * 100)}%` },
  ] },
  { label: 'ARMOURY & SALVAGE', fields: [
    { key: 'mostUsed',   label: 'MOST USED WEAPON',        icon: 'crown',     value: (p, weapons) => { const id = p.mostUsedWeapon(); return id ? (weapons[id]?.name || id) : '—'; } },
    { key: 'weaponsUsed', label: 'WEAPONS USED',           icon: 'guns',      value: (p) => String(p.weaponsUsedCount()) },
    { key: 'crates',     label: 'CRATES OPENED',           icon: 'crate',     value: (p) => String(p.data.cratesOpened) },
    { key: 'scrap',      label: 'LIFETIME SCRAP SALVAGED', icon: 'scrap',     value: (p) => p.data.lifetimeScrapEarned.toLocaleString() },
    { key: 'ads',        label: 'ADS WATCHED',             icon: 'play',      value: (p) => p.data.totalAdsWatched.toLocaleString() },
  ] },
];

// The four numbers a returning player checks first get a wider, brighter card
// at the head of their group instead of hiding in a uniform wall.
const STAT_HERO = new Set(['kills', 'accuracy', 'level', 'scrap']);

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
    const first = document.querySelector('.stats-subtab');
    if (first) slidePill(first.parentElement, { kind: 'fill' });
    const shown = $(this.section === 'overview' ? 'stats-grid' : 'stats-achievements');
    if (shown && this._lastSection !== this.section) popIn(shown.children, { step: 30, rise: 10 });
    this._lastSection = this.section;
  }

  renderOverview() {
    const host = $('stats-grid');
    host.innerHTML = '';
    for (const group of STAT_GROUPS) {
      const head = document.createElement('div');
      head.className = 'stats-group-head';
      head.textContent = group.label;
      host.appendChild(head);

      const grid = document.createElement('div');
      grid.className = 'stats-group-grid';
      for (const field of group.fields) grid.appendChild(this.makeStatCard(field));
      host.appendChild(grid);
    }
  }

  makeStatCard(field) {
    const card = document.createElement('div');
    card.className = 'stat-card' + (STAT_HERO.has(field.key) ? ' hero' : '');
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
    requestAnimationFrame(() => {
      const g = cv.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth || 28, h = cv.clientHeight || 28;
      cv.width = w * dpr; cv.height = h * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawAchievementIcon(g, field.icon, w, h, '#ff5c46');
    });
    return card;
  }

  // Medal cabinet: a summary strip (overall progress + medals per metal),
  // then one section per metal. Cards are horizontal — medal, name and goal,
  // progress, reward — so a phone shows a readable column rather than a wall
  // of tiny squares.
  renderAchievements() {
    const host = $('achievements-list');
    host.innerHTML = '';
    const all = ACHIEVEMENTS.map((a) => [a, achievementProgress(a, this.p)]);
    const done = all.filter(([, p]) => p.claimed).length;
    const ready = all.filter(([, p]) => p.unlocked && !p.claimed).length;

    const sum = document.createElement('div');
    sum.className = 'ach-summary';
    const left = document.createElement('div');
    left.className = 'ach-sum-main';
    left.innerHTML = `<div class="ach-sum-count"><b>${done}</b> / ${all.length}</div><div class="ach-sum-label">COMPLETED${ready ? ` · <span class="ach-sum-ready">${ready} READY TO CLAIM</span>` : ''}</div>`;
    const bar = document.createElement('div');
    bar.className = 'ach-sum-track';
    const fill = document.createElement('div');
    fill.className = 'ach-sum-fill';
    bar.appendChild(fill);
    left.appendChild(bar);
    sum.appendChild(left);
    const medals = document.createElement('div');
    medals.className = 'ach-sum-medals';
    for (const tierKey of ['easy', 'medium', 'hard']) {
      const group = all.filter(([a]) => a.tier === tierKey);
      const got = group.filter(([, p]) => p.claimed).length;
      const m = document.createElement('div');
      m.className = 'ach-sum-medal';
      const cv = document.createElement('canvas');
      m.appendChild(cv);
      const n = document.createElement('span');
      n.textContent = `${got}/${group.length}`;
      m.appendChild(n);
      medals.appendChild(m);
      requestAnimationFrame(() => paintMedalCanvas(cv, tierKey, 'star', got ? 'claimed' : 'progress'));
    }
    sum.appendChild(medals);
    host.appendChild(sum);
    requestAnimationFrame(() => { fill.style.width = `${Math.round((done / all.length) * 100)}%`; });

    for (const tierKey of ['easy', 'medium', 'hard']) {
      const tier = TIERS[tierKey];
      const group = all.filter(([a]) => a.tier === tierKey);
      const head = document.createElement('div');
      head.className = 'achievement-tier-head';
      head.style.setProperty('--tier-color', tier.color);
      head.innerHTML = `<span>${tier.label}</span><span class="ach-tier-count">${group.filter(([, p]) => p.claimed).length}/${group.length}</span>`;
      host.appendChild(head);

      const grid = document.createElement('div');
      grid.className = 'achievements-grid';
      // claimable first, then in progress by how close, then done
      const rank = ([, p]) => (p.unlocked && !p.claimed ? 0 : !p.unlocked ? 1 - p.frac + 1 : 3);
      for (const [ach, prog] of group.slice().sort((x, y) => rank(x) - rank(y))) {
        grid.appendChild(this.makeAchievementCard(ach, tier, prog));
      }
      host.appendChild(grid);
    }
  }

  makeAchievementCard(ach, tier, prog = achievementProgress(ach, this.p)) {
    const state = prog.claimed ? 'claimed' : prog.unlocked ? 'ready' : prog.frac > 0 ? 'progress' : 'locked';
    const card = document.createElement('div');
    card.className = `achievement-card ach-${state}`;
    card.dataset.id = ach.id;
    card.style.setProperty('--tier-color', tier.color);
    card.style.setProperty('--tier-glow', tier.glow);

    const medal = document.createElement('canvas');
    medal.className = 'ach-medal';
    card.appendChild(medal);

    const body = document.createElement('div');
    body.className = 'ach-body';
    const top = document.createElement('div');
    top.className = 'ach-top';
    const name = document.createElement('div');
    name.className = 'achievement-name';
    name.textContent = ach.name;
    top.appendChild(name);
    const reward = document.createElement('div');
    reward.className = 'ach-reward';
    const ico = document.createElement('canvas');
    ico.className = 'cur-icon cur-scrap'; ico.width = ico.height = 14;
    reward.append(ico, document.createTextNode(String(ACHIEVEMENT_SCRAP)));
    top.appendChild(reward);
    body.appendChild(top);

    const desc = document.createElement('div');
    desc.className = 'achievement-desc';
    desc.textContent = ach.desc;
    body.appendChild(desc);

    const row = document.createElement('div');
    row.className = 'ach-prog-row';
    const track = document.createElement('div');
    track.className = 'achievement-progress-track';
    const fill = document.createElement('div');
    fill.className = 'achievement-progress-fill';
    track.appendChild(fill);
    const label = document.createElement('div');
    label.className = 'achievement-progress-label';
    label.textContent = ach.stat === 'totalPlaytimeMs'
      ? `${Math.round(Math.min(prog.value, ach.goal) / 60000)}m / ${Math.round(ach.goal / 60000)}m`
      : `${Math.min(prog.value, ach.goal).toLocaleString()} / ${ach.goal.toLocaleString()}`;
    row.append(track, label);
    body.appendChild(row);

    if (state === 'ready') {
      const btn = document.createElement('button');
      btn.className = 'btn primary achievement-claim-btn';
      btn.textContent = `CLAIM +${ACHIEVEMENT_SCRAP}`;
      btn.addEventListener('click', () => this.claimAchievement(ach.id, card));
      body.appendChild(btn);
    }
    card.appendChild(body);

    requestAnimationFrame(() => {
      paintMedalCanvas(medal, tier.key, ach.icon, state);
      renderScrapIcon(ico);
      fill.style.width = `${Math.round(prog.frac * 100)}%`;
    });
    return card;
  }

  // Claim beat: the medal is struck (spring + burst in the metal's colour),
  // scrap arcs from the card into the balance, then the list re-sorts.
  claimAchievement(id, card) {
    const before = this.p.scrap;
    if (!this.p.claimAchievement(id)) return;
    const medal = card && card.querySelector('.ach-medal');
    const pill = document.querySelector('.scrap-pill');
    haptic('success');
    sfx('reveal', 2);
    if (medal) {
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      paintMedalCanvas(medal, ach.tier, ach.icon, 'claimed');
      card.classList.remove('ach-ready'); card.classList.add('ach-claimed', 'ach-just');
      if (level() > 0 && medal.animate) {
        medal.animate([{ transform: 'scale(0.6) rotate(-14deg)' }, { transform: 'none' }], { duration: 700, easing: spring() });
      }
      sparks(medal, { count: 16, color: TIERS[ach.tier].color, spread: 90, size: 6 });
      coinsTo(card, pill, { count: 6 });
      const btn = card.querySelector('.achievement-claim-btn');
      if (btn) btn.remove();
    }
    const scrapCount = $('scrap-count');
    setTimeout(() => {
      if (scrapCount) animateCount(scrapCount, before, this.p.scrap);
      playCurrencyGain(pill, 'scrap', this.audio);
    }, 520);
    setTimeout(() => { this.renderAchievements(); this.renderOverview(); }, 1100);
  }

}
