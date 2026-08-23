// The trader screen: CROW's stall.
//
// Two ways to spend scrap sit on this panel, in the order a player meets them:
//
//   1. TODAY'S STALL — a handful of pieces CROW has laid out, rerolled once a
//      day and marked down, with a countdown to the next restock. This is the
//      crate hook without the crate's uncertainty: you always see exactly what
//      you are buying and what it costs, but you do not know what will be
//      there tomorrow. See trader.js for why it is built that way.
//   2. The browse grid — the full sellable catalogue at list price, filtered
//      by category, so a player hunting one specific skin is never gated
//      behind the daily roll.
//
// A rewarded-ad loop pays scrap directly (no second currency to convert), and
// nothing on this screen touches real money — there is no purchase path in the
// game at all.

import { RARITY, RARITY_SCRAP_PRICE, TRADEABLE, weaponVariantIds } from './meta.js';
import {
  TRADER_CATEGORIES, itemCategories, rollStall, msUntilRestock,
  formatCountdown, traderLineKey, DEEP_CUT,
} from './trader.js';
import { watchRewardedAd } from '../engine/ads.js';
import { renderTraderScene } from '../art/trader.js';
import { renderScrapIcon } from '../art/currency.js';
import { playCurrencyGain, animateCount } from './currencyfx.js';
import { t, onLangChange } from '../engine/i18n.js';

const $ = (id) => document.getElementById(id);

// Everything CROW is allowed to sell — cosmetics, weapon finishes and guns,
// minus commons, the starter three and the boss redeemables. Assembled in
// meta.js (see TRADEABLE) rather than here, so the crate pool and the stall
// stay derived from one description of the catalogue.
function sellable() {
  return TRADEABLE.filter((i) => !isRetired(i));
}

function isRetired(item) {
  return item.retiredAfter != null && Date.now() > item.retiredAfter;
}

function priceOf(item) { return RARITY_SCRAP_PRICE[item.rarity]; }

export class TraderUI {
  constructor(deps) {
    this.p = deps.progression;
    this.previewItem = deps.previewItem;
    // Weapon "items" carry no name of their own — the display name lives on
    // the live weapon def, same as in the loadout UI.
    this.weapons = deps.weapons || {};
    this.audio = deps.audio || null;
    this.category = 'stall';
    this.busy = false;
    this._tick = null;
    this._stallDay = null;
  }

  // Display name for a card. Weapons resolve through the live defs; anything
  // else carries its own name.
  itemLabel(item) {
    if (item.weaponId && item.kind === 'Weapon' && this.weapons[item.weaponId]) {
      return this.weapons[item.weaponId].name;
    }
    return item.name || item.id;
  }

  mount() {
    this.renderCategories();
    $('btn-trade-ad').addEventListener('click', () => this.watchAdForScrap());
    this.refresh();
    // Ad cooldown and the restock clock both tick once a second. One timer
    // drives both so the panel never runs two intervals.
    this._tick = setInterval(() => {
      if (!this.visible()) return;
      this.renderAdOffer();
      this.renderRestockClock();
    }, 1000);
    onLangChange(() => this.refresh());
  }

  // The panel keeps a 1s timer alive for the countdown; skip the work whenever
  // the tab is not actually on screen. On a weak phone this is the difference
  // between a background timer that repaints DOM every second and one that
  // returns immediately.
  visible() {
    const panel = $('tab-trader');
    return !!panel && panel.classList.contains('active');
  }

  refresh() {
    this.renderScene();
    this.renderScrapBalance();
    this.renderTraderLine();
    this.renderAdOffer();
    this.renderStall();
    this.renderRestockClock();
    this.renderItemGrid();
    this.renderCategories();
  }

  // Repainted on every refresh rather than once at mount(): the panel starts
  // hidden (`display:none` until its tab is active), so a canvas sized off
  // `clientWidth` at mount time would bake in a width of 0. Painting again
  // each time the tab is actually shown also picks up an orientation change
  // for free — it's a cheap procedural canvas paint, not a network call.
  renderScene() {
    const cv = $('trader-scene');
    if (cv && cv.clientWidth) renderTraderScene(cv);
  }

  renderScrapBalance() {
    const el = $('scrap-count');
    if (!el) return;
    const n = this.p.scrap;
    const prev = this._lastScrapCount;
    this._lastScrapCount = n;
    if (prev == null || n <= prev) { el.textContent = String(n); return; }   // init / spend: snap
    animateCount(el, prev, n);
    playCurrencyGain(document.querySelector('.scrap-pill'), 'scrap', this.audio);
  }

  // CROW reacts to the player's actual state rather than cycling flavour at
  // random — see traderLineKey().
  renderTraderLine() {
    const el = $('trader-line');
    if (!el) return;
    const offers = this.stall();
    const cheapest = offers.length ? Math.min(...offers.map((o) => o.price)) : 0;
    el.textContent = t(traderLineKey({
      scrap: this.p.scrap,
      stallEmpty: offers.length === 0,
      cheapest,
    }));
  }

  // ---- category chips ----
  renderCategories() {
    const host = $('trader-cats');
    if (!host) return;
    host.innerHTML = '';
    for (const cat of TRADER_CATEGORIES) {
      const chip = document.createElement('button');
      chip.className = 'store-cat-chip' + (cat.key === this.category ? ' active' : '');
      chip.textContent = t(cat.labelKey);
      chip.addEventListener('click', () => {
        this.category = cat.key;
        this.applyCategoryVisibility();
        this.renderItemGrid();
        this.renderCategories();
        if (this.audio) this.audio.ui();
      });
      host.appendChild(chip);
    }
    this.applyCategoryVisibility();
  }

  applyCategoryVisibility() {
    const c = this.category;
    // The stall and the ad offer are CROW himself; they belong to the landing
    // view, not to a category filter.
    const atStall = c === 'stall';
    $('trader-section-stall').classList.toggle('hidden', !atStall);
    $('trader-section-ad').classList.toggle('hidden', !atStall);
    $('trader-section-items').classList.toggle('hidden', atStall);
    const headMap = {
      guns: 'head.guns', weapons: 'head.weapons', skins: 'head.skins',
      knives: 'head.knives', limited: 'head.limited', inventory: 'head.inventory',
    };
    const head = $('trader-items-head');
    if (head) head.textContent = t(headMap[c] || 'head.items');
  }

  // ---- today's stall ----
  // Cached per day so scrolling the panel does not re-roll on every repaint;
  // the roll itself is deterministic, so the cache is purely to save the work.
  stall() {
    const day = Math.floor(Date.now() / 86400000);
    const owned = this.p.data.inventory;
    if (this._stallDay !== day || this._stallOwnedCount !== Object.keys(owned).length) {
      this._stallDay = day;
      this._stallOwnedCount = Object.keys(owned).length;
      this._stall = rollStall(sellable(), priceOf, (id) => this.p.owns(id), day);
    }
    return this._stall;
  }

  renderRestockClock() {
    const el = $('trader-restock');
    if (!el) return;
    el.textContent = t('trader.restock', { time: formatCountdown(msUntilRestock()) });
  }

  renderStall() {
    const host = $('trader-stall-grid');
    if (!host) return;
    host.innerHTML = '';
    const offers = this.stall();
    if (!offers.length) {
      const empty = document.createElement('div');
      empty.className = 'trader-empty';
      empty.textContent = t('trader.stallEmpty');
      host.appendChild(empty);
      return;
    }
    for (const offer of offers) host.appendChild(this.offerCard(offer));
  }

  // One stall card: art, name, rarity, struck-through list price and the
  // marked-down price. The deep cut gets its own treatment so the eye finds it
  // without having to compare four numbers.
  offerCard(offer) {
    const { item, price, base, deep } = offer;
    const rarity = RARITY[item.rarity];
    const card = document.createElement('div');
    card.className = 'item-card trade-offer' + (deep ? ' deep' : '');
    card.style.setProperty('--rarity', rarity.color);
    card.style.setProperty('--rarity-glow', rarity.glow);

    if (deep) {
      const flag = document.createElement('div');
      flag.className = 'trade-flag';
      flag.textContent = t('trader.deal', { pct: Math.round(DEEP_CUT * 100) });
      card.appendChild(flag);
    }

    const cv = document.createElement('canvas');
    cv.className = 'item-preview';
    card.appendChild(cv);

    const name = document.createElement('div');
    name.className = 'item-name';
    name.textContent = this.itemLabel(item);
    card.appendChild(name);

    const r = document.createElement('div');
    r.className = 'item-rarity';
    r.style.color = rarity.color;
    r.textContent = t(rarity.labelKey);
    card.appendChild(r);

    const btn = document.createElement('button');
    btn.className = 'btn quiet trade-buy';
    btn.appendChild(this.priceLabel(price, base));
    btn.disabled = this.p.scrap < price;
    btn.addEventListener('click', (e) => { e.stopPropagation(); this.trade(item, price); });
    card.appendChild(btn);

    requestAnimationFrame(() => this.previewItem(item, cv));
    return card;
  }

  // Price as icon + number, with the list price struck through when the piece
  // is discounted. Built as nodes rather than innerHTML so an item name can
  // never inject markup.
  priceLabel(price, base = null) {
    const wrap = document.createElement('span');
    wrap.className = 'trade-price';
    if (base != null && base > price) {
      const was = document.createElement('s');
      was.className = 'trade-was';
      was.textContent = String(base);
      wrap.appendChild(was);
    }
    const ico = document.createElement('canvas');
    ico.className = 'cur-icon cur-scrap trade-ico';
    ico.width = 14; ico.height = 14;
    ico.style.width = '14px'; ico.style.height = '14px';
    wrap.appendChild(ico);
    const n = document.createElement('span');
    n.textContent = String(price);
    wrap.appendChild(n);
    requestAnimationFrame(() => renderScrapIcon(ico));
    return wrap;
  }

  // ---- scrap from ads ----
  renderAdOffer() {
    const prog = this.p.scrapAdProgress();
    const desc = $('trade-ad-desc');
    if (desc) desc.textContent = t('trader.adDesc', { n: prog.reward, max: prog.dailyCap });
    const fill = $('trade-ad-fill');
    if (fill) fill.style.width = `${Math.round((prog.grantedToday / prog.dailyCap) * 100)}%`;
    const status = $('trade-ad-status');
    const btn = $('btn-trade-ad');
    if (!status || !btn) return;
    if (prog.capped) {
      status.textContent = t('trader.adDailyLimit');
      status.className = 'ad-status warn';
      btn.disabled = true;
    } else if (prog.cooldownMs > 0) {
      status.textContent = t('trader.adNextIn', { n: Math.ceil(prog.cooldownMs / 1000) });
      status.className = 'ad-status';
      btn.disabled = true;
    } else {
      status.textContent = t('trader.adEarnedToday', { n: prog.grantedToday, max: prog.dailyCap });
      status.className = 'ad-status ok';
      btn.disabled = false;
    }
  }

  watchAdForScrap() {
    if (this.busy) return;
    const prog = this.p.scrapAdProgress();
    if (prog.capped || prog.cooldownMs > 0) return;
    this.busy = true;
    watchRewardedAd(
      () => {
        // Only the ad provider's real reward callback can credit a watch —
        // never a bare button click — so a skipped/failed ad grants nothing.
        const res = this.p.recordScrapAdWatch();
        this.busy = false;
        this.renderAdOffer();
        this.renderScrapBalance();
        if (res.granted) {
          const status = $('trade-ad-status');
          if (status) {
            status.textContent = t('trader.adPaid', { n: res.granted });
            status.className = 'ad-status ok';
          }
          this.renderStall();
          this.renderTraderLine();
          if (this.audio) this.audio.ui();
        }
      },
      () => { this.busy = false; }
    );
  }

  // ---- browse grid: the full catalogue at list price ----
  renderItemGrid() {
    const grid = $('trader-item-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const c = this.category;
    if (c === 'stall') return;   // stall has its own grid
    let items;
    if (c === 'inventory') {
      // Inventory shows what you own across the whole catalogue, not just the
      // sellable slice — a crate drop belongs on this list too.
      items = TRADEABLE.filter((i) => this.p.owns(i.id));
    } else {
      items = sellable().filter((i) => itemCategories(i).has(c));
    }
    for (const item of items) {
      const owned = this.p.owns(item.id);
      const rarity = RARITY[item.rarity];
      const price = priceOf(item);
      const card = document.createElement('div');
      card.className = 'item-card' + (owned ? ' equipped' : '');
      card.style.setProperty('--rarity', rarity.color);
      card.style.setProperty('--rarity-glow', rarity.glow);
      const cv = document.createElement('canvas');
      cv.className = 'item-preview';
      card.appendChild(cv);
      const name = document.createElement('div');
      name.className = 'item-name';
      name.textContent = this.itemLabel(item);
      card.appendChild(name);
      const r = document.createElement('div');
      r.className = 'item-rarity';
      r.style.color = rarity.color;
      r.textContent = t(rarity.labelKey);
      card.appendChild(r);
      if (item.retiredAfter) {
        const tag = document.createElement('div');
        tag.className = 'item-tag';
        const daysLeft = Math.max(0, Math.ceil((item.retiredAfter - Date.now()) / 86400000));
        tag.textContent = t('trader.retiresIn', { n: daysLeft });
        card.appendChild(tag);
      }
      if (!owned && price != null && c !== 'inventory') {
        const buyBtn = document.createElement('button');
        buyBtn.className = 'btn quiet trade-buy';
        buyBtn.appendChild(this.priceLabel(price));
        buyBtn.disabled = this.p.scrap < price;
        buyBtn.addEventListener('click', (e) => { e.stopPropagation(); this.trade(item, price); });
        card.appendChild(buyBtn);
      } else if (owned) {
        const tag = document.createElement('div');
        tag.className = 'item-tag';
        tag.textContent = t('item.owned');
        card.appendChild(tag);
      }
      requestAnimationFrame(() => this.previewItem(item, cv));
      grid.appendChild(card);
    }
  }

  // ---- the transaction ----
  // Price is passed in rather than re-derived, because a stall piece is not
  // worth its list price — but it is re-validated against the offer table so a
  // discounted price can only ever be paid for a piece actually on the stall.
  trade(item, price) {
    if (this.busy || this.p.owns(item.id)) return;
    const list = priceOf(item);
    if (price < list) {
      const offer = this.stall().find((o) => o.item.id === item.id && o.price === price);
      if (!offer) price = list;
    }
    if (!this.p.spendScrap(price)) {
      const status = $('trade-ad-status');
      if (status) { status.textContent = t('trader.notEnough'); status.className = 'ad-status warn'; }
      const line = $('trader-line');
      if (line) line.textContent = t('trader.line.short');
      return;
    }
    // A gun occupies more than one loadout slot; buying it has to free every
    // variant, or a plasma rifle bought for PRIMARY stays locked under SPECIAL.
    if (item.kind === 'Weapon' && item.weaponId) {
      for (const vid of weaponVariantIds(item.weaponId)) this.p.grant(vid);
    } else {
      this.p.grant(item.id);
    }
    if (this.audio) (this.audio.equip ? this.audio.equip() : this.audio.ui());
    // Owning it removes it from the stall, so both grids need a repaint.
    this.renderScrapBalance();
    this.renderStall();
    this.renderItemGrid();
    this.renderTraderLine();
  }
}
