// Stats screen: the lifetime-counters overview and the achievement cabinet
// (progress, lock state, claim). All numbers are read live off Progression —
// this module never stores anything itself besides the achievements' claimed
// flag (on Progression).
//
// Layout, for a landscape phone first: the title and the two sub-tabs share
// one row; the overview leads with four headline tiles and then dense
// icon/label/value rows in three named groups; the cabinet leads with one
// slim summary bar (count, progress, medals, CLAIM ALL) and a filter strip,
// so the first screen of either tab is numbers rather than chrome. Every
// string resolves through t().

import { ACHIEVEMENTS, TIERS, achievementProgress, drawAchievementIcon } from './achievements.js';
import { playCurrencyGain, animateCount } from './currencyfx.js';
import { slidePill, popIn, sparks, coinsTo, haptic, sfx, spring, level } from '../ui/motion.js';
import { paintMedalCanvas } from '../art/medal.js';
import { renderScrapIcon } from '../art/currency.js';
import { ACHIEVEMENT_SCRAP, xpForLevel } from './progression.js';
import { t, onLangChange } from '../engine/i18n.js';

const $ = (id) => document.getElementById(id);

// t() returns the key itself when no dictionary has it; achievement names and
// descriptions keep their English in achievements.js, so fall back to that.
function tf(key, fallback) {
  const s = t(key);
  return s === key ? fallback : s;
}
export const achName = (a) => tf(`ach.${a.id}.n`, a.name);
export const achDesc = (a) => tf(`ach.${a.id}.d`, a.desc);

function formatDuration(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// Headline tiles: the four numbers a returning player checks first.
const HERO = [
  { key: 'kills', label: 'stats.f.kills', icon: 'skull', value: (p) => p.data.totalKills.toLocaleString() },
  { key: 'accuracy', label: 'stats.f.accuracy', icon: 'target', value: (p) => `${p.accuracy()}%` },
  { key: 'level', label: 'stats.f.level', icon: 'chevron', value: (p) => String(p.data.level), meter: true },
  { key: 'scrap', label: 'stats.f.scrap', icon: 'scrap', value: (p) => p.data.lifetimeScrapEarned.toLocaleString() },
];

// Everything else, grouped — how you fight, how far you have come, what you
// have banked. Each field owns a distinct icon.
const STAT_GROUPS = [
  { label: 'stats.g.combat', fields: [
    { key: 'headshots', label: 'stats.f.headshots', icon: 'crosshair', value: (p) => p.data.totalHeadshots.toLocaleString() },
    { key: 'shots', label: 'stats.f.shots', icon: 'bullet', value: (p) => p.data.shotsTotal.toLocaleString() },
    { key: 'combo', label: 'stats.f.combo', icon: 'bolt', value: (p) => String(p.data.highestCombo) },
    { key: 'streak', label: 'stats.f.streak', icon: 'fire', value: (p) => String(p.data.longestKillStreak) },
    { key: 'missions', label: 'stats.f.missions', icon: 'flag', value: (p) => String(p.data.totalMissionsCompleted) },
    { key: 'playtime', label: 'stats.f.playtime', icon: 'clock', value: (p) => formatDuration(p.data.totalPlaytimeMs) },
  ] },
  { label: 'stats.g.operator', fields: [
    { key: 'xp', label: 'stats.f.xp', icon: 'spark', value: (p) => Math.round(p.data.xp).toLocaleString() },
    // What the level is actually worth in the field. Without these two rows
    // the per-level stat gain is invisible.
    { key: 'lvlHp', label: 'stats.f.lvlHp', icon: 'shield', value: (p) => `+${p.levelBonuses().maxHp}` },
    { key: 'lvlDmg', label: 'stats.f.lvlDmg', icon: 'blade', value: (p) => `+${Math.round(p.levelBonuses().damage * 100)}%` },
  ] },
  { label: 'stats.g.armoury', fields: [
    { key: 'mostUsed', label: 'stats.f.mostUsed', icon: 'crown', value: (p, weapons) => { const id = p.mostUsedWeapon(); return id ? (weapons[id]?.name || id) : '—'; } },
    { key: 'weaponsUsed', label: 'stats.f.weaponsUsed', icon: 'guns', value: (p) => String(p.weaponsUsedCount()) },
    { key: 'crates', label: 'stats.f.crates', icon: 'crate', value: (p) => String(p.data.cratesOpened) },
    { key: 'ads', label: 'stats.f.ads', icon: 'play', value: (p) => p.data.totalAdsWatched.toLocaleString() },
  ] },
];

const TIER_ORDER = ['easy', 'medium', 'hard'];

// One icon canvas, sized from its laid-out box once it has one.
function paintIcon(cv, icon, color = '#ff5c46') {
  const w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawAchievementIcon(g, icon, w, h, color);
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

export class StatsUI {
  constructor(deps) {
    this.p = deps.progression;
    this.weapons = deps.weapons || {};
    this.audio = deps.audio || null;
    this.section = 'overview';
    this.filter = 'all';
  }

  mount() {
    document.querySelectorAll('.stats-subtab').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.section === btn.dataset.section) return;
        this.section = btn.dataset.section;
        this.applySectionVisibility();
        if (this.audio) this.audio.ui();
      });
    });
    document.querySelectorAll('#ach-filters .ux-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.filter === btn.dataset.filter) return;
        this.filter = btn.dataset.filter;
        this.renderAchievements(true);
        if (this.audio) this.audio.ui();
      });
    });
    onLangChange(() => this.refresh());
    this.refresh();
  }

  refresh() {
    this.renderOverview();
    this.renderAchievements();
    this.applySectionVisibility();
  }

  applySectionVisibility() {
    document.querySelectorAll('.stats-subtab').forEach((b) => {
      const on = b.dataset.section === this.section;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $('stats-overview').classList.toggle('hidden', this.section !== 'overview');
    $('stats-achievements').classList.toggle('hidden', this.section !== 'achievements');
    const tabs = document.querySelector('.st-tabs');
    if (tabs) slidePill(tabs, { kind: 'fill' });
    if (this.section === 'achievements') slidePill($('ach-filters'), { kind: 'fill' });
    // canvases inside a hidden section have no box yet: paint on show
    requestAnimationFrame(() => this.paintVisibleIcons());
    if (this._lastSection !== this.section) {
      const shown = this.section === 'overview'
        ? [...$('stats-hero').children, ...$('stats-grid').children]
        : [$('ach-summary'), ...$('achievements-list').children];
      popIn(shown, { step: 26, rise: 8 });
    }
    this._lastSection = this.section;
  }

  paintVisibleIcons() {
    document.querySelectorAll('#tab-stats canvas[data-icon]').forEach((cv) => {
      const key = `${cv.clientWidth}x${cv.clientHeight}`;
      if (!cv.clientWidth || cv._painted === key) return;
      paintIcon(cv, cv.dataset.icon);
      cv._painted = key;
    });
  }

  // ------------------------------------------------------------- overview

  renderOverview() {
    const p = this.p;
    const hero = $('stats-hero');
    hero.innerHTML = '';
    for (const f of HERO) {
      const tile = el('div', `st-tile st-tile-${f.key}`);
      const cv = el('canvas', 'st-tile-icon'); cv.dataset.icon = f.icon;
      const body = el('div', 'st-tile-body');
      body.append(el('div', 'st-tile-value', f.value(p, this.weapons)), el('div', 'st-tile-label', t(f.label)));
      tile.append(cv, body);
      if (f.meter) {
        const lv = p.data.level;
        const need = Math.max(0, xpForLevel(lv + 1) - Math.round(p.data.xp));
        const track = el('div', 'ux-track st-tile-track');
        const fill = el('div', 'ux-fill');
        track.appendChild(fill);
        tile.append(track, el('div', 'st-tile-sub', t('profile.xpLeft', { xp: need.toLocaleString(), lvl: String(lv + 1) })));
        requestAnimationFrame(() => { fill.style.width = `${Math.round(p.xpProgress() * 100)}%`; });
      }
      hero.appendChild(tile);
    }

    const host = $('stats-grid');
    host.innerHTML = '';
    for (const group of STAT_GROUPS) {
      const block = el('div', 'st-group');
      block.appendChild(el('div', 'st-group-head', t(group.label)));
      const rows = el('div', 'st-rows');
      for (const f of group.fields) {
        const row = el('div', 'st-row');
        const cv = el('canvas', 'st-row-icon'); cv.dataset.icon = f.icon;
        row.append(cv, el('div', 'st-row-label', t(f.label)), el('div', 'st-row-value', f.value(p, this.weapons)));
        rows.appendChild(row);
      }
      block.appendChild(rows);
      host.appendChild(block);
    }
    requestAnimationFrame(() => this.paintVisibleIcons());
  }

  // ----------------------------------------------------------- achievements

  stateOf(prog) {
    return prog.claimed ? 'claimed' : prog.unlocked ? 'ready' : prog.frac > 0 ? 'progress' : 'locked';
  }

  renderAchievements(animate = false) {
    const all = ACHIEVEMENTS.map((a) => [a, achievementProgress(a, this.p)]);
    const done = all.filter(([, p]) => p.claimed).length;
    const ready = all.filter(([, p]) => p.unlocked && !p.claimed);

    // tab badge: how many medals are waiting
    const badge = $('ach-tab-count');
    if (badge) {
      badge.textContent = String(ready.length);
      badge.classList.toggle('hidden', ready.length === 0);
    }

    // ---- summary bar
    const sum = $('ach-summary');
    sum.innerHTML = '';
    const count = el('div', 'ach-bar-count');
    count.innerHTML = `<b>${done}</b><span>/ ${all.length}</span>`;
    const mid = el('div', 'ach-bar-mid');
    const label = el('div', 'ach-bar-label', t('ach.completed'));
    if (ready.length) label.appendChild(el('span', 'ach-bar-ready', ` · ${t('ach.ready', { n: ready.length })}`));
    const track = el('div', 'ux-track ach-bar-track');
    const fill = el('div', 'ux-fill ach-bar-fill');
    track.appendChild(fill);
    mid.append(label, track);
    const medals = el('div', 'ach-bar-medals');
    for (const tierKey of TIER_ORDER) {
      const group = all.filter(([a]) => a.tier === tierKey);
      const got = group.filter(([, p]) => p.claimed).length;
      const m = el('div', 'ach-bar-medal');
      const cv = el('canvas');
      m.append(cv, el('span', null, `${got}/${group.length}`));
      m.title = t(`ach.tier.${tierKey}`);
      medals.appendChild(m);
      requestAnimationFrame(() => paintMedalCanvas(cv, tierKey, 'star', got ? 'claimed' : 'progress'));
    }
    sum.append(count, mid, medals);
    if (ready.length) {
      const btn = el('button', 'btn primary ach-claim-all', t('ach.claimAll'));
      btn.type = 'button';
      btn.addEventListener('click', () => this.claimAll(btn));
      sum.appendChild(btn);
    }
    requestAnimationFrame(() => { fill.style.width = `${Math.round((done / all.length) * 100)}%`; });

    // filter strip: counts in the labels would crowd a phone; the READY chip
    // just lights up when there is something in it
    const fbar = $('ach-filters');
    if (fbar) {
      fbar.querySelectorAll('.ux-tab').forEach((b) => {
        b.classList.toggle('active', b.dataset.filter === this.filter);
        b.classList.toggle('has-ready', b.dataset.filter === 'ready' && ready.length > 0);
      });
      if (this.section === 'achievements') slidePill(fbar, { kind: 'fill' });
    }

    // ---- list
    const host = $('achievements-list');
    host.innerHTML = '';
    const keep = ([, p]) => {
      const s = this.stateOf(p);
      if (this.filter === 'ready') return s === 'ready';
      if (this.filter === 'progress') return s === 'progress' || s === 'locked';
      if (this.filter === 'done') return s === 'claimed';
      return true;
    };
    // claimable first, then in progress by how close, then done
    const rank = ([, p]) => (p.unlocked && !p.claimed ? 0 : !p.unlocked ? 2 - p.frac : 3);
    let shown = 0;
    for (const tierKey of TIER_ORDER) {
      const tier = TIERS[tierKey];
      const group = all.filter(([a]) => a.tier === tierKey);
      const list = group.filter(keep);
      if (!list.length) continue;
      const head = el('div', 'achievement-tier-head');
      head.style.setProperty('--tier-color', tier.color);
      head.append(el('span', null, t(`ach.tier.${tierKey}`)), el('span', 'ach-tier-count', `${group.filter(([, p]) => p.claimed).length}/${group.length}`));
      host.appendChild(head);
      const grid = el('div', 'achievements-grid');
      for (const [ach, prog] of list.slice().sort((x, y) => rank(x) - rank(y))) {
        grid.appendChild(this.makeAchievementCard(ach, tier, prog));
        shown++;
      }
      host.appendChild(grid);
    }
    if (!shown) host.appendChild(el('div', 'ach-empty', t('ach.empty')));
    if (animate) popIn(host.children, { step: 24, rise: 8 });
  }

  makeAchievementCard(ach, tier, prog = achievementProgress(ach, this.p)) {
    const state = this.stateOf(prog);
    const card = el('div', `achievement-card ach-${state}`);
    card.dataset.id = ach.id;
    card.style.setProperty('--tier-color', tier.color);
    card.style.setProperty('--tier-glow', tier.glow);

    const medal = el('canvas', 'ach-medal');
    card.appendChild(medal);

    const body = el('div', 'ach-body');
    const top = el('div', 'ach-top');
    top.appendChild(el('div', 'achievement-name', achName(ach)));
    const reward = el('div', 'ach-reward');
    const ico = el('canvas', 'cur-icon cur-scrap'); ico.width = ico.height = 14;
    reward.append(ico, document.createTextNode(String(ACHIEVEMENT_SCRAP)));
    top.appendChild(reward);
    body.appendChild(top);
    body.appendChild(el('div', 'achievement-desc', achDesc(ach)));

    const row = el('div', 'ach-prog-row');
    const track = el('div', 'achievement-progress-track');
    const fill = el('div', 'achievement-progress-fill');
    track.appendChild(fill);
    const label = el('div', 'achievement-progress-label', ach.stat === 'totalPlaytimeMs'
      ? `${Math.round(Math.min(prog.value, ach.goal) / 60000)}m / ${Math.round(ach.goal / 60000)}m`
      : `${Math.min(prog.value, ach.goal).toLocaleString()} / ${ach.goal.toLocaleString()}`);
    row.append(track, label);
    body.appendChild(row);

    if (state === 'ready') {
      const btn = el('button', 'btn primary achievement-claim-btn', t('ach.claim', { n: ACHIEVEMENT_SCRAP }));
      btn.type = 'button';
      btn.addEventListener('click', () => this.claimAchievement(ach.id, card));
      row.appendChild(btn);
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
    this.afterClaim(before, pill);
  }

  // Every waiting medal at once: one burst from the summary bar, one count-up.
  claimAll(btn) {
    const before = this.p.scrap;
    const ready = ACHIEVEMENTS.filter((a) => { const pr = achievementProgress(a, this.p); return pr.unlocked && !pr.claimed; });
    let n = 0;
    for (const a of ready) if (this.p.claimAchievement(a.id)) n++;
    if (!n) return;
    const pill = document.querySelector('.scrap-pill');
    haptic('success');
    sfx('reveal', 3);
    if (btn) {
      sparks(btn, { count: 22, color: '#f0c050', spread: 120, size: 7 });
      coinsTo(btn, pill, { count: Math.min(12, 4 + n * 2) });
      btn.disabled = true;
    }
    document.querySelectorAll('#achievements-list .ach-ready').forEach((c) => {
      c.classList.remove('ach-ready'); c.classList.add('ach-claimed', 'ach-just');
      const b = c.querySelector('.achievement-claim-btn'); if (b) b.remove();
    });
    this.afterClaim(before, pill);
  }

  afterClaim(before, pill) {
    const scrapCount = $('scrap-count');
    setTimeout(() => {
      if (scrapCount) animateCount(scrapCount, before, this.p.scrap);
      playCurrencyGain(pill, 'scrap', this.audio);
    }, 520);
    setTimeout(() => { this.renderAchievements(); this.renderOverview(); }, 1100);
  }
}
