// Player card — the offline profile screen.
//
// Everything on this card is computed on-device from counters Progression
// already keeps. There is no account, no upload and no leaderboard: the rank
// band is the progression story, and it is derived from the player's own
// numbers every time the card is opened.
//
// Like ArchivesUI, this is its own module rather than another method on
// MetaUI — it shares no state with the loadout/crate screens, and the only
// thing it borrows is the overlay pattern (a `.hidden` toggle on a dimmed
// backdrop), so it never has to reach into another screen's internals.

import { RANKS } from './progression.js';
import { WEAPON_SKINS } from '../art/skins.js';
import { t, onLangChange } from '../engine/i18n.js';

const $ = (id) => document.getElementById(id);

export class ProfileUI {
  // deps: { progression, weapons, previewItem, audio }
  constructor(deps) {
    this.p = deps.progression;
    this.weapons = deps.weapons || {};
    this.previewItem = deps.previewItem || null;
    this.audio = deps.audio || null;
  }

  mount() {
    const open = $('btn-profile');
    if (open) open.addEventListener('click', () => this.open());
    const close = $('btn-profile-close');
    if (close) close.addEventListener('click', () => this.close());
    const card = $('profile-overlay');
    if (card) {
      card.addEventListener('click', (e) => {
        // tapping the dimmed backdrop dismisses; taps inside the card do not
        if (e.target === card) this.close();
      });
    }
    // Rank titles and every stat label resolve through t(), and this card is
    // built in JS, so a language switch needs an explicit repaint.
    onLangChange(() => { if (this._open) this.render(); });
  }

  open() {
    this._open = true;
    // Unhide before rendering: the weapon sprite is sized from the canvas's
    // laid-out width, which is 0 while the overlay is still display:none.
    const ov = $('profile-overlay');
    if (ov) ov.classList.remove('hidden');
    this.render();
    if (this.audio) this.audio.ui();
  }

  close() {
    this._open = false;
    const ov = $('profile-overlay');
    if (ov) ov.classList.add('hidden');
    if (this.audio) this.audio.ui();
  }

  render() {
    const info = this.p.profile();
    this.renderScore(info);
    this.renderRank(info.rank, info.score);
    this.renderStats(info);
    this.renderWeapon(info.favoriteWeapon);
  }

  renderScore(info) {
    const el = $('profile-score');
    if (el) el.textContent = info.score.toLocaleString();
    const label = $('profile-score-label');
    if (label) label.textContent = t('profile.score');
  }

  renderRank(rank, score) {
    const el = $('profile-rank');
    if (!el) return;
    el.textContent = t(rank.key);
    // Rank colour drives the title, its glow and the card's accent edge, so a
    // Commander's card reads as gold at a glance without a second asset.
    el.style.setProperty('--rank-color', rank.color);
    el.style.setProperty('--rank-glow', rank.glow);
    const card = $('profile-card');
    if (card) {
      card.style.setProperty('--rank-color', rank.color);
      card.style.setProperty('--rank-glow', rank.glow);
      card.dataset.rank = rank.id;
    }
    this.renderRankProgress(rank, score);
  }

  // Distance to the next band, as a bar plus "N PUAN KALDI". The top rank has
  // nothing above it, so it gets a held-at-max bar and a status line instead
  // of a countdown to a number that does not exist.
  renderRankProgress(rank, score) {
    const fill = $('profile-rank-fill');
    const note = $('profile-rank-next');
    if (!fill || !note) return;
    const idx = RANKS.findIndex((r) => r.id === rank.id);
    const next = idx > 0 ? RANKS[idx - 1] : null;   // RANKS is ordered high -> low
    if (!next) {
      fill.style.width = '100%';
      note.textContent = t('profile.rankMax');
      return;
    }
    const span = Math.max(1, next.min - rank.min);
    fill.style.width = `${Math.round(Math.min(1, (score - rank.min) / span) * 100)}%`;
    note.textContent = t('profile.rankNext', {
      points: (next.min - score).toLocaleString(),
      rank: t(next.key),
    });
  }

  renderStats(info) {
    const host = $('profile-stats');
    if (!host) return;
    const rows = [
      { key: 'profile.maxLevel', value: info.maxLevelReached ? String(info.maxLevelReached) : '—' },
      { key: 'profile.bossKills', value: String(info.bossKills) },
      { key: 'profile.deaths', value: info.totalDeaths.toLocaleString() },
    ];
    host.innerHTML = '';
    for (const row of rows) {
      const cell = document.createElement('div');
      cell.className = 'profile-stat';
      const val = document.createElement('div');
      val.className = 'profile-stat-value';
      val.textContent = row.value;
      const lbl = document.createElement('div');
      lbl.className = 'profile-stat-label';
      lbl.textContent = t(row.key);
      cell.appendChild(val);
      cell.appendChild(lbl);
      host.appendChild(cell);
    }
  }

  // The favourite weapon is shown with the actual painted sprite, reusing the
  // same previewItem() the loadout and store cards draw with — a name alone
  // would make this the one card in the game that talks about a gun without
  // showing it.
  renderWeapon(fav) {
    const nameEl = $('profile-weapon-name');
    const skinEl = $('profile-weapon-skin');
    const cv = $('profile-weapon-art');
    if (!nameEl || !cv) return;

    // Nothing logged yet: collapse the art plate rather than reserving 64px of
    // empty box above the placeholder line. `empty` also drops the panel to a
    // single quiet row so the card doesn't end on a hole.
    const panel = cv.parentElement;
    if (!fav) {
      if (panel) panel.classList.add('empty');
      nameEl.textContent = t('profile.noWeapon');
      if (skinEl) skinEl.textContent = '';
      return;
    }
    if (panel) panel.classList.remove('empty');

    const def = this.weapons[fav.weaponId];
    nameEl.textContent = (def && def.name) || fav.weaponId.toUpperCase();
    if (skinEl) {
      skinEl.textContent = fav.skinId
        ? this.skinName(fav.weaponId, fav.skinId)
        : t('profile.stockFinish');
    }
    if (this.previewItem) {
      // Same item shape previewItem() takes from the catalog: a finish apply
      // block resolves to the skinned sprite, and falls back to the stock
      // body when nothing is equipped.
      const item = {
        apply: fav.skinId
          ? { type: 'finish', weapon: fav.weaponId, finish: this.finishId(fav.weaponId, fav.skinId) }
          : { type: 'weaponBody', weapon: fav.weaponId },
      };
      requestAnimationFrame(() => this.previewItem(item, cv));
    }
  }

  // Equipped skin ids are catalog ids (`rifle_urban`); previewItem wants the
  // finish key alone (`urban`).
  finishId(weaponId, skinId) {
    return skinId.startsWith(`${weaponId}_`) ? skinId.slice(weaponId.length + 1) : skinId;
  }

  skinName(weaponId, skinId) {
    const finish = this.finishId(weaponId, skinId);
    const skin = (WEAPON_SKINS[weaponId] || {})[finish];
    return (skin && skin.name) || finish.replace(/[_-]/g, ' ').toUpperCase();
  }
}
