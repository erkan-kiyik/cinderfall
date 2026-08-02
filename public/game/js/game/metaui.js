// Meta screens that live on the main menu: bottom-tab navigation, the loadout
// editor and the supply-crate reel. Reads/writes Progression; draws item art
// through a preview callback supplied by main.js (which owns the asset bag).

import {
  CATALOG, RARITY, CRATE_COST, DUPLICATE_REFUND, LOADOUT_SLOTS,
  rollCrate, itemsForSlot, itemById, weaponVariantIds, LOOT_POOL,
} from './meta.js';
import { AD_CRATE_DAILY_LIMIT } from './progression.js';
import { watchRewardedAd } from '../engine/ads.js';
import { playCurrencyGain, animateCount } from './currencyfx.js';
import { t, onLangChange } from '../engine/i18n.js';

const $ = (id) => document.getElementById(id);

export class MetaUI {
  // deps: { progression, previewItem(item, canvas), onDeploy, audio }
  constructor(deps) {
    this.p = deps.progression;
    this.previewItem = deps.previewItem;
    this.weapons = deps.weapons || {};
    this.onDeploy = deps.onDeploy;
    this.audio = deps.audio || null;
    this.busy = false;
  }

  // display name for a card's item (weapons resolve to their live def name)
  itemLabel(item) {
    if (!item) return t('item.stock');
    if (item.weaponId && this.weapons[item.weaponId]) return this.weapons[item.weaponId].name;
    return item.name;
  }
  itemOwned(item) { return !item || this.p.owns(item.id); }

  mount() {
    // bottom tabs
    document.querySelectorAll('.home-tab').forEach((btn) => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
    $('btn-open-crate').addEventListener('click', () => this.openCrate());
    $('btn-watch-ad').addEventListener('click', () => this.openCrateWithAd());
    $('reveal-done').addEventListener('click', () => this.closeReveal());
    $('crate-cost').textContent = String(CRATE_COST);
    // Labels built here (slot heads, rarity chips, ad button) aren't static
    // markup, so they need an explicit repaint when the language changes.
    onLangChange(() => this.refresh());
    this.refresh();
  }

  // Re-read progression and repaint everything (call on menu show / after runs).
  refresh() {
    this.renderTokens();
    this.renderLoadout();
    this.renderCollection();
    this.renderAdButton();
  }

  renderAdButton() {
    const btn = $('btn-watch-ad');
    if (!btn) return;
    const left = this.p.adCratesRemaining();
    btn.querySelector('.ad-remaining').textContent = left > 0
      ? t('crates.leftToday', { n: left, max: AD_CRATE_DAILY_LIMIT })
      : t('crates.comeBack');
    btn.disabled = left <= 0;
  }

  switchTab(name) {
    document.querySelectorAll('.home-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.home-panel').forEach((s) => s.classList.toggle('active', s.id === `tab-${name}`));
    if (this.audio) this.audio.ui();
  }

  renderTokens() {
    const el = $('token-count');
    const n = this.p.tokens;
    const prev = this._lastTokenCount;
    this._lastTokenCount = n;
    if (prev == null || n <= prev) { el.textContent = String(n); return; }   // init / spend: snap
    animateCount(el, prev, n);
    playCurrencyGain(document.querySelector('.token-pill'), 'para', this.audio);
  }

  renderLoadout() {
    const host = $('loadout-slots');
    host.innerHTML = '';
    for (const slot of LOADOUT_SLOTS) {
      const items = itemsForSlot(slot.key);
      const equippedId = this.p.equipped(slot.key);
      const box = document.createElement('div');
      box.className = 'loadout-slot';

      const head = document.createElement('div');
      head.className = 'loadout-slot-head';
      const eqItem = equippedId && itemById(equippedId);
      head.innerHTML = `<span class="loadout-slot-label">${t(slot.labelKey)}</span>` +
        `<span class="loadout-slot-equipped">${eqItem ? this.itemLabel(eqItem) : t('item.stock')}</span>`;
      box.appendChild(head);

      const row = document.createElement('div');
      row.className = 'item-row';
      // "STOCK" (unequip) card is always available
      row.appendChild(this.makeCard(null, slot.key, !equippedId));
      for (const item of items) {
        row.appendChild(this.makeCard(item, slot.key, equippedId === item.id, !this.itemOwned(item)));
      }
      box.appendChild(row);
      host.appendChild(box);
    }
  }

  makeCard(item, slotKey, equipped, locked = false) {
    const card = document.createElement('div');
    const rarity = item ? RARITY[item.rarity] : null;
    card.className = 'item-card' + (equipped ? ' equipped' : '') + (locked ? ' locked' : '');
    if (rarity) {
      card.style.setProperty('--rarity', rarity.color);
      card.style.setProperty('--rarity-glow', rarity.glow);
    }

    const cv = document.createElement('canvas');
    cv.className = 'item-preview';
    card.appendChild(cv);

    const name = document.createElement('div');
    name.className = 'item-name';
    name.textContent = this.itemLabel(item);
    card.appendChild(name);

    if (item) {
      const r = document.createElement('div');
      r.className = 'item-rarity';
      r.style.color = rarity.color;
      r.textContent = locked ? t('item.locked') : t(rarity.labelKey);
      card.appendChild(r);
      if (item.tag) {
        const tagEl = document.createElement('div');
        tagEl.className = 'item-tag';
        tagEl.textContent = item.tag;
        card.appendChild(tagEl);
      }
    }

    // draw preview after it's in the DOM (needs a layout size)
    requestAnimationFrame(() => this.previewItem(item, cv));

    if (!locked) {
      card.addEventListener('click', () => {
        this.p.equip(slotKey, item ? item.id : null);
        if (this.audio) this.audio.equip ? this.audio.equip() : this.audio.ui();
        this.renderLoadout();
      });
    }
    return card;
  }

  renderCollection() {
    const grid = $('collection-grid');
    grid.innerHTML = '';
    let owned = 0;
    for (const item of CATALOG) {
      const has = this.p.owns(item.id);
      if (has) owned++;
      const rarity = RARITY[item.rarity];
      const card = document.createElement('div');
      card.className = 'item-card' + (has ? '' : ' locked');
      card.style.setProperty('--rarity', rarity.color);
      card.style.setProperty('--rarity-glow', rarity.glow);
      const cv = document.createElement('canvas');
      cv.className = 'item-preview';
      card.appendChild(cv);
      const name = document.createElement('div');
      name.className = 'item-name';
      name.textContent = item.name;
      card.appendChild(name);
      const r = document.createElement('div');
      r.className = 'item-rarity';
      r.style.color = rarity.color;
      r.textContent = has ? t(rarity.labelKey) : t('item.locked');
      card.appendChild(r);
      grid.appendChild(card);
      requestAnimationFrame(() => this.previewItem(has ? item : null, cv));
    }
    $('collection-count').textContent = `${owned} / ${CATALOG.length}`;
  }

  // ---- crate open: spend (tokens or a watched ad), roll, spin, reveal ----
  openCrate({ free = false } = {}) {
    if (this.busy) return;
    const msg = $('crate-msg');
    if (!free && this.p.tokens < CRATE_COST) {
      msg.textContent = t('crates.notEnough');
      msg.classList.add('warn');
      return;
    }
    msg.classList.remove('warn');
    msg.textContent = '';
    this.busy = true;
    if (!free) this.p.spendTokens(CRATE_COST);
    this.p.data.cratesOpened++;
    this.renderTokens();
    if (this.audio) this.audio.ui();

    const drop = rollCrate();
    const isDup = this.p.owns(drop.id);
    let refund = 0;
    if (isDup) { refund = Math.round(CRATE_COST * DUPLICATE_REFUND); this.p.addTokens(refund); }
    else if (drop.weaponId) { for (const vid of weaponVariantIds(drop.weaponId)) this.p.grant(vid); }
    else this.p.grant(drop.id);

    this.playCaseOpen(() => this.spinReel(drop, () => this.showReveal(drop, isDup, refund)));
  }

  // Free crate paid for by finishing a rewarded ad instead of tokens.
  openCrateWithAd() {
    if (this.busy) return;
    const msg = $('crate-msg');
    if (this.p.adCratesRemaining() <= 0) {
      msg.textContent = t('crates.adLimit');
      msg.classList.add('warn');
      return;
    }
    msg.classList.remove('warn');
    msg.textContent = t('crates.loadingAd');
    this.busy = true;
    watchRewardedAd(
      () => {
        this.p.recordAdCrateWatch();
        this.renderAdButton();
        this.busy = false;
        msg.textContent = '';
        this.openCrate({ free: true });
      },
      () => {
        this.busy = false;
        msg.textContent = '';
      }
    );
  }

  // Plays a short "case cracks open" beat on the static crate display — lid
  // pops off, a light burst flashes, the box kicks — before cutting to the
  // full-screen reel. Purely presentational; timing matches the CSS beat.
  playCaseOpen(done) {
    const box = $('crate-box'), lid = $('crate-lid'), glow = $('crate-glow'), burst = $('crate-burst');
    for (const el of [box, lid, glow, burst]) if (el) el.classList.add('opening');
    if (this.audio && this.audio.equip) this.audio.equip();
    setTimeout(() => {
      for (const el of [box, lid, glow, burst]) if (el) el.classList.remove('opening');
      done();
    }, 620);
  }

  spinReel(winner, done) {
    const overlay = $('crate-reveal');
    const track = $('reel-track');
    const card = $('reveal-card');
    const doneBtn = $('reveal-done');
    overlay.classList.remove('hidden');
    card.classList.add('hidden');
    doneBtn.classList.add('hidden');
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
    track.innerHTML = '';

    const CELL = 130;            // 120 width + 10 gap
    const WIN_INDEX = 44;
    const total = 52;
    for (let i = 0; i < total; i++) {
      const item = i === WIN_INDEX ? winner : LOOT_POOL[Math.floor(Math.random() * LOOT_POOL.length)];
      const rarity = RARITY[item.rarity];
      const cell = document.createElement('div');
      cell.className = 'reel-cell';
      cell.style.borderBottomColor = rarity.color;
      const cv = document.createElement('canvas');
      cv.className = 'item-preview';
      cell.appendChild(cv);
      const nm = document.createElement('div');
      nm.className = 'rc-name';
      nm.textContent = item.name;
      cell.appendChild(nm);
      track.appendChild(cell);
      const it = item;
      requestAnimationFrame(() => this.previewItem(it, cv));
    }

    // land the winning cell under the centre marker (with slight jitter)
    const win = this.reelWindowW();
    const jitter = (Math.random() - 0.5) * 70;
    const targetX = -(WIN_INDEX * CELL + 60 - win / 2) + jitter;

    // force reflow, then transition
    void track.offsetWidth;
    track.style.transition = 'transform 4.4s cubic-bezier(0.12, 0.72, 0.16, 1)';
    track.style.transform = `translateX(${targetX}px)`;

    let finished = false;
    const finish = () => { if (finished) return; finished = true; done(); };
    track.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 4700);   // fallback if transitionend doesn't fire
  }

  reelWindowW() {
    const w = document.querySelector('.reel-window');
    return w ? w.clientWidth : Math.min(760, window.innerWidth * 0.94);
  }

  showReveal(item, isDup, refund) {
    const rarity = RARITY[item.rarity];
    const card = $('reveal-card');
    card.style.borderColor = rarity.color;
    card.style.boxShadow = `0 0 40px ${rarity.glow}`;
    $('reveal-rarity').textContent = t(rarity.labelKey);
    $('reveal-rarity').style.color = rarity.color;
    $('reveal-name').textContent = item.name;
    $('reveal-kind').textContent = item.kind + (item.tag ? ` · ${item.tag}` : '');
    const status = $('reveal-status');
    if (isDup) { status.textContent = t('reveal.duplicate', { n: refund }); status.style.color = 'var(--ink-dim)'; }
    else { status.textContent = t('reveal.new'); status.style.color = rarity.color; }
    card.classList.remove('hidden');
    $('reveal-done').classList.remove('hidden');
    if (this.audio) {
      const big = item.rarity === 'legendary' || item.rarity === 'epic';
      if (big && this.audio.levelUp) this.audio.levelUp();
      else if (this.audio.ui) this.audio.ui();
    }
  }

  closeReveal() {
    $('crate-reveal').classList.add('hidden');
    this.busy = false;
    this.renderTokens();
    this.renderCollection();
    this.renderLoadout();
    this.renderLoadoutChips();
    if (this.audio) this.audio.ui();
  }
}
