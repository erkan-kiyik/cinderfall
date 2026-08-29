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
import { CATALOG, itemById } from './meta.js';
import { WEAPON_SKINS } from '../art/skins.js';
import { t, onLangChange } from '../engine/i18n.js';

const $ = (id) => document.getElementById(id);

// Rarity accents, matching the loadout cards' own RARITY table in meta.js.
// Kept local rather than imported so the profile card never has to reach into
// the loadout screen's internals — the same reasoning as the module note above.
const RARITY_TINT = {
  common: 'rgba(237,234,226,0.55)',
  rare: '#5aa9d6',
  epic: '#b26bff',
  legendary: '#e0a63a',
  mythic: '#ff5c46',
};

export class ProfileUI {
  // deps: { progression, weapons, previewItem, audio }
  constructor(deps) {
    this.p = deps.progression;
    this.weapons = deps.weapons || {};
    this.previewItem = deps.previewItem || null;
    this.previewOperator = deps.previewOperator || null;
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
    this.renderIdentity();
    this.renderScore(info);
    this.renderRank(info.rank, info.score);
    this.renderStats(info);
    this.renderWeapon(info.favoriteWeapon);
  }

  // Who the player is: equipped operator, their level and the distance to the
  // next one. The card carried none of this — it opened on a sector score
  // derived from three narrow counters, while the number the rest of the game
  // actually shows (stats screen, deploy strip, level-up toast) is the level.
  renderIdentity() {
    const equipped = this.p.equipped('operator');
    const item = equipped ? itemById(equipped) : null;
    const variant = (item && item.apply && item.apply.variant) || 'ranger';

    const nameEl = $('profile-op-name');
    if (nameEl) nameEl.textContent = item ? item.name : t('profile.opDefault');
    const tagEl = $('profile-op-tag');
    if (tagEl) {
      tagEl.textContent = (item && item.tag) || t('profile.opTagDefault');
      // Tint the tag with the operator's rarity so the card says at a glance
      // whether this is the starting kit or something out of a crate.
      const r = item && RARITY_TINT[item.rarity];
      tagEl.style.color = r || 'var(--ink-dim)';
    }

    const lvl = $('profile-lvl');
    if (lvl) lvl.textContent = String(this.p.data.level);
    const pct = Math.round(this.p.xpProgress() * 100);
    const pctEl = $('profile-xp-pct');
    if (pctEl) pctEl.textContent = `${pct}%`;
    const fill = $('profile-xp-fill');
    if (fill) fill.style.width = `${pct}%`;

    const cv = $('profile-portrait');
    if (cv && this.previewOperator) {
      // The canvas is sized from its laid-out box, which is only correct once
      // the overlay is visible — open() unhides before calling render().
      requestAnimationFrame(() => this.previewOperator(variant, cv));
    }
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
    const d = this.p.data;
    // Six counters, not three. The old set was highest sector / bosses /
    // deaths — the three least interesting numbers the game keeps, and two of
    // them read "—" and "0" for most of a playthrough. These lead with what a
    // player actually wants to show someone.
    const rows = [
      { key: 'profile.kills', value: (d.totalKills || 0).toLocaleString() },
      { key: 'profile.accuracy', value: `${this.p.accuracy()}%` },
      { key: 'profile.headshots', value: (d.totalHeadshots || 0).toLocaleString() },
      { key: 'profile.streak', value: String(d.longestKillStreak || 0) },
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
