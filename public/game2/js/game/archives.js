// Archives screen — the collection view for recovered intel logs.
//
// Deliberately its own module rather than another method on MetaUI. MetaUI
// owns the loadout, the crate reel and the inspect sheet, all of which read
// and write the same item catalog; the Archives share none of that state and
// folding them in would have meant touching a class that four already-shipped
// screens depend on.
//
// The only thing it borrows is the bottom-tab mechanism, which is pure class
// toggling on `.home-tab` / `.home-panel` — adding a button and a section to
// the markup is enough for navigation to work, so this file never has to
// reach into MetaUI.switchTab().

import {
  INTEL_LOGS, INTEL_TOTAL, intelById,
  intelTitleKey, intelBodyKey, intelSourceKey, intelTierKey, redactedTitle,
} from './intel.js';
import { t, onLangChange } from '../engine/i18n.js';

const $ = (id) => document.getElementById(id);

export class ArchivesUI {
  // deps: { progression, audio }
  constructor(deps) {
    this.p = deps.progression;
    this.audio = deps.audio || null;
  }

  mount() {
    const close = $('btn-intel-close');
    if (close) close.addEventListener('click', () => this.close());
    const reader = $('intel-reader');
    if (reader) {
      reader.addEventListener('click', (e) => {
        // tapping the dimmed backdrop dismisses; taps inside the card do not
        if (e.target === reader) this.close();
      });
    }
    // Repaint when the tab is opened. The list is small, but it changes
    // between runs (logs found mid-mission), so rendering on show rather than
    // once at mount is what keeps it honest without polling.
    document.querySelectorAll('.home-tab[data-tab="archives"]').forEach((btn) => {
      btn.addEventListener('click', () => this.render());
    });
    // Titles, bodies and the locked placeholder all resolve through t(), and
    // this list is built in JS, so a language switch needs an explicit repaint.
    onLangChange(() => {
      this.render();
      if (this._open) this.open(this._open);
    });
    this.render();
  }

  render() {
    const host = $('archives-list');
    if (!host) return;
    const found = this.p.intelFoundCount();

    const countEl = $('archives-count');
    if (countEl) countEl.textContent = t('archives.progress', { found, total: INTEL_TOTAL });
    const fill = $('archives-fill');
    if (fill) fill.style.width = `${(found / INTEL_TOTAL) * 100}%`;

    host.innerHTML = '';
    for (const log of INTEL_LOGS) {
      host.appendChild(this.p.hasIntel(log.id) ? this.foundRow(log) : this.lockedRow(log));
    }
  }

  // Serial code shown on both the list row and the reader — "S9-01" reads as
  // a filing reference, which is the point: these are documents, not pickups.
  code(log) { return `S9-${log.id.replace('log_', '')}`; }

  foundRow(log) {
    const row = document.createElement('button');
    row.className = 'archive-row';
    row.type = 'button';
    row.innerHTML =
      `<span class="archive-code">${this.code(log)}</span>` +
      `<span class="archive-main">` +
        `<span class="archive-title"></span>` +
      `</span>` +
      // Classification and the action sit at the row's right edge. Stacked
      // under the title they left two thirds of a wide row empty and gave the
      // eye nothing to track down the list.
      `<span class="archive-tier"></span>` +
      `<span class="archive-go">${t('archives.read')}</span>`;
    // textContent rather than interpolation — the lore is author-written prose
    // with apostrophes and line breaks, and it has no business being parsed
    // as markup.
    row.querySelector('.archive-title').textContent = t(intelTitleKey(log.id));
    row.querySelector('.archive-tier').textContent = t(intelTierKey(log.tier));
    row.addEventListener('click', () => this.open(log.id));
    return row;
  }

  lockedRow(log) {
    const row = document.createElement('div');
    row.className = 'archive-row locked';
    // Boss-only entries say so even while locked. A player who has found ten
    // of twelve should be able to tell that the last two are behind bosses
    // rather than assume the drop table is broken.
    const hint = log.bossOnly ? t('archives.bossOnly') : t('archives.lockedHint');
    row.innerHTML =
      `<span class="archive-code">${this.code(log)}</span>` +
      `<span class="archive-main">` +
        `<span class="archive-title redacted" aria-label="${t('archives.locked')}">${redactedTitle(log.id)}</span>` +
      `</span>` +
      `<span class="archive-tier">${hint}</span>` +
      // A padlock, not a cross. `✕` read as "dismiss this row" rather than
      // "not recovered yet", which is the opposite of what a locked entry
      // means. Drawn in CSS so it stays monochrome with the rest of the list
      // instead of dropping a colour emoji into it.
      `<span class="archive-lock" aria-hidden="true"></span>`;
    return row;
  }

  open(id) {
    const log = intelById(id);
    if (!log || !this.p.hasIntel(id)) return;
    this._open = id;
    $('intel-read-tier').textContent = t(intelTierKey(log.tier));
    $('intel-read-code').textContent = this.code(log);
    $('intel-read-title').textContent = t(intelTitleKey(id));
    $('intel-read-source').textContent = t(intelSourceKey(id));
    // Body text carries real paragraph breaks (the radio transcript is a list
    // of timestamped lines), so it renders into a <pre>-like block via
    // white-space: pre-line rather than being flattened into one run.
    $('intel-read-body').textContent = t(intelBodyKey(id));
    $('intel-reader').classList.remove('hidden');
    if (this.audio) this.audio.ui();
  }

  close() {
    this._open = null;
    $('intel-reader').classList.add('hidden');
    if (this.audio) this.audio.ui();
  }
}
