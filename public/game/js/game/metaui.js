// Meta screens that live on the main menu: bottom-tab navigation, the loadout
// editor and the supply-crate reel. Reads/writes Progression; draws item art
// through a preview callback supplied by main.js (which owns the asset bag).

import {
  CATALOG, RARITY, CRATE_COST, DUPLICATE_REFUND, LOADOUT_SLOTS,
  rollCrate, itemsForSlot, itemById, weaponVariantIds, LOOT_POOL, describePerk,
} from './meta.js';
import { weaponStatRows, weaponForItem } from './weaponstats.js';
import { AD_CRATE_DAILY_LIMIT } from './progression.js';
import { watchRewardedAd, isRewardedAdReady } from '../engine/ads.js';
import { playCurrencyGain, animateCount } from './currencyfx.js';
import { t, onLangChange } from '../engine/i18n.js';
import { REDEEM, formatCode, normalize } from './referral.js';


// A horizontally scrolling item row is masked at its right edge so the card
// that runs off the fold fades instead of being sliced, but only while there
// is actually something out there — measured after layout, and again on every
// tab switch because a hidden panel measures zero.
function syncRowFades() {
  requestAnimationFrame(() => {
    document.querySelectorAll('.item-row, .store-cats').forEach((row) => {
      row.classList.toggle('fits', row.scrollWidth <= row.clientWidth + 1);
    });
  });
}

const $ = (id) => document.getElementById(id);

// Clipboard fallback for webviews without navigator.clipboard (or where the
// page is not a secure context). execCommand is deprecated, but it is the only
// thing that works there, and a copy button that silently does nothing is
// worse than a deprecated API.
function legacyCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (e) {
    return false;
  }
}

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
    // inspect sheet
    $('btn-inspect-close').addEventListener('click', () => this.closeInspect());
    $('inspect').addEventListener('click', (e) => {
      // tapping the dimmed backdrop dismisses; taps inside the card do not
      if (e.target === $('inspect')) this.closeInspect();
    });
    $('btn-inspect-equip').addEventListener('click', () => {
      const ctx = this._inspect;
      if (!ctx || ctx.locked) return;
      this.p.equip(ctx.slotKey, ctx.item ? ctx.item.id : null);
      if (this.audio) (this.audio.equip ? this.audio.equip() : this.audio.ui());
      this.closeInspect();
      this.renderLoadout();
    });
    this.mountInvite();
    // Labels built here (slot heads, rarity chips, ad button) aren't static
    // markup, so they need an explicit repaint when the language changes.
    onLangChange(() => this.refresh());
    this.refresh();
  }

  // ---- invite codes -------------------------------------------------------
  // The screen is deliberately dumb: every rule about what a code means lives
  // in referral.js and every payout in progression.js. This only turns a
  // result status into a sentence and repaints.
  mountInvite() {
    if (!$('invite-panel')) return;
    const st = this.p.inviteState();
    $('btn-invite-copy').addEventListener('click', () => this.copyCode(st.myCode, $('btn-invite-copy')));
    $('btn-thanks-copy').addEventListener('click', () => {
      const s2 = this.p.inviteState();
      if (s2.thanksCode) this.copyCode(s2.thanksCode, $('btn-thanks-copy'));
    });
    $('btn-invite-share').addEventListener('click', () => this.shareInvite());
    $('btn-thanks-share').addEventListener('click', () => {
      const s2 = this.p.inviteState();
      if (s2.thanksCode) this.shareText(formatCode(s2.thanksCode));
    });
    $('btn-invite-redeem').addEventListener('click', () => this.redeemInvite());
    $('btn-invite-claim').addEventListener('click', () => this.claimThanks());
    // Codes are typed from another phone's screen, so the field forgives what
    // a human actually types — lower case, spaces, dashes, and the letters the
    // alphabet drops — and shows back the canonical form as they go.
    for (const id of ['invite-input', 'invite-claim-input']) {
      const el = $(id);
      el.addEventListener('input', () => {
        const at = el.selectionStart === el.value.length;
        el.value = normalize(el.value).slice(0, 6);
        if (at) el.selectionStart = el.selectionEnd = el.value.length;
      });
      el.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (id === 'invite-input') this.redeemInvite(); else this.claimThanks();
      });
    }
  }

  renderInvite() {
    if (!$('invite-panel')) return;
    const st = this.p.inviteState();
    $('invite-code').textContent = formatCode(st.myCode);
    $('invite-friends').textContent = t('invite.friendsPaid', { n: st.friendsPaid, max: st.maxFriends });
    // Once a code has been redeemed there is nothing left to enter — the
    // entry card is replaced by the thank-you code the friend needs back.
    const done = !!st.redeemed;
    $('invite-enter').classList.toggle('hidden', done);
    $('invite-thanks').classList.toggle('hidden', !done);
    if (done && st.thanksCode) $('invite-thanks-code').textContent = formatCode(st.thanksCode);
  }

  // Result status -> message. Only OK is a success; everything else is a
  // normal thing for a player to do and gets its own sentence rather than a
  // generic failure.
  inviteMessage(el, res, okKey, reward) {
    const KEY = {
      [REDEEM.BAD_FORMAT]: 'invite.badFormat', [REDEEM.OWN_CODE]: 'invite.ownCode',
      [REDEEM.ALREADY]: 'invite.already', [REDEEM.NOT_MINE]: 'invite.notMine',
      [REDEEM.CAP]: 'invite.cap',
    };
    const ok = res.status === REDEEM.OK;
    el.textContent = ok ? t(okKey, { n: reward }) : t(KEY[res.status] || 'invite.badFormat');
    el.classList.toggle('warn', !ok);
    el.classList.toggle('good', ok);
  }

  redeemInvite() {
    const el = $('invite-enter-msg');
    const res = this.p.redeemInvite($('invite-input').value);
    this.inviteMessage(el, res, 'invite.okJoin', res.granted);
    if (res.status !== REDEEM.OK) return;
    $('invite-input').value = '';
    if (this.audio) this.audio.ui();
    this.renderScrap();
    this.renderInvite();
  }

  claimThanks() {
    const el = $('invite-claim-msg');
    const res = this.p.claimInviteThanks($('invite-claim-input').value);
    this.inviteMessage(el, res, 'invite.okThanks', res.granted);
    if (res.status !== REDEEM.OK) return;
    $('invite-claim-input').value = '';
    if (this.audio) this.audio.ui();
    this.renderScrap();
    this.renderInvite();
  }

  // Clipboard, with a visible confirmation on the button itself — a copy that
  // gives no feedback gets pressed three times.
  copyCode(code, btn) { return this.copyText(formatCode(code), btn); }

  async copyText(text, btn) {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch (e) {
      // Older webviews, or a page without clipboard permission. The classic
      // hidden-textarea route still works there.
      ok = legacyCopy(text);
    }
    if (this.audio) this.audio.ui();
    if (!ok) return;
    const label = btn.textContent;
    btn.textContent = t('invite.copied');
    clearTimeout(btn._copyT);
    btn._copyT = setTimeout(() => { btn.textContent = label; }, 1400);
  }

  // The native share sheet if the shell exposes one, otherwise the clipboard.
  // On Android this is what puts the code into WhatsApp in one tap, which is
  // the whole point of the feature.
  shareInvite() {
    const st = this.p.inviteState();
    this.shareText(t('invite.shareBody', { code: formatCode(st.myCode) }));
  }

  shareText(text) {
    if (navigator.share) {
      navigator.share({ text }).catch(() => { /* user dismissed the sheet */ });
      return;
    }
    // No share sheet (desktop browser, older webview): the clipboard is the
    // next best thing — the player still gets the message in one tap, they
    // just paste it themselves.
    this.copyText(text, $('btn-invite-share'));
  }

  // Re-read progression and repaint everything (call on menu show / after runs).
  refresh() {
    this.renderScrap();
    this.renderLoadout();
    this.renderCollection();
    this.renderAdButton();
    this.renderInvite();
  }

  // The PLAY tab's operator readout: rank, XP to the next level, what the
  // level is worth right now, and the three weapons going into the field.
  renderDeployStatus() {
    const host = $('deploy-status');
    if (!host) return;
    const d = this.p.data;
    const pct = Math.round(this.p.xpProgress() * 100);
    $('ds-level-n').textContent = String(d.level);
    $('ds-xp-pct').textContent = `${pct}%`;
    $('ds-xp-fill').style.width = `${pct}%`;

    const lb = this.p.levelBonuses();
    $('ds-buffs').innerHTML =
      `<span class="ds-buff"><i class="ds-buff-hp"></i>+${lb.maxHp} HP</span>` +
      `<span class="ds-buff"><i class="ds-buff-dmg"></i>+${Math.round(lb.damage * 100)}% DMG</span>`;

    const kit = $('ds-kit');
    kit.innerHTML = '';
    for (const slot of LOADOUT_SLOTS.slice(0, 3)) {
      // Nothing equipped still means a weapon goes into the field. Fall back to
      // the first weapon in the slot the player actually owns, so the strip
      // names the gun they will be holding instead of three cards reading
      // "STOCK" — but never advertise a locked one, which is what taking
      // list[0] blindly did for SPECIAL (it offered the Plasma Rifle).
      const chosen = itemById(this.p.equipped(slot.key));
      const item = chosen || itemsForSlot(slot.key).find((it) => this.itemOwned(it)) || null;
      const cell = document.createElement('div');
      cell.className = 'ds-slot' + (item ? '' : ' empty') + (chosen ? '' : ' stock');
      const cv = document.createElement('canvas');
      cv.className = 'ds-slot-art';
      cell.appendChild(cv);
      const lbl = document.createElement('div');
      lbl.className = 'ds-slot-name';
      lbl.textContent = item ? this.itemLabel(item) : t('item.stock');
      if (!chosen) lbl.title = t('item.stock');
      cell.appendChild(lbl);
      const kind = document.createElement('div');
      kind.className = 'ds-slot-kind';
      kind.textContent = t(slot.labelKey);
      cell.appendChild(kind);
      if (item) {
        const rarity = RARITY[item.rarity];
        if (rarity) {
          cell.style.setProperty('--rarity', rarity.color);
          cell.style.setProperty('--rarity-glow', rarity.glow);
        }
      }
      kit.appendChild(cell);
      requestAnimationFrame(() => this.previewItem(item, cv));
    }
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
    syncRowFades();
    if (this.audio) this.audio.ui();
  }

  renderScrap() {
    const el = $('scrap-count');
    if (!el) return;
    const n = this.p.scrap;
    const prev = this._lastScrapCount;
    this._lastScrapCount = n;
    if (prev == null || n <= prev) { el.textContent = String(n); return; }   // init / spend: snap
    animateCount(el, prev, n);
    playCurrencyGain(document.querySelector('.scrap-pill'), 'scrap', this.audio);
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
    syncRowFades();
    this.renderDeployStatus();   // the PLAY tab mirrors what is equipped here
  }

  makeCard(item, slotKey, equipped, locked = false) {
    const card = document.createElement('div');
    const rarity = item ? RARITY[item.rarity] : null;
    card.className = 'item-card' + (item ? '' : ' stock')
      + (equipped ? ' equipped' : '') + (locked ? ' locked' : '');
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

    // Inspect affordance. The card body still equips on tap — that one-tap
    // flow is the fast path and shouldn't get slower — so inspect gets its own
    // thumb-sized target instead of stealing the tap or needing a long-press
    // (long-press competes with scrolling on a touch device).
    if (item) {
      const info = document.createElement('button');
      info.className = 'item-info';
      info.type = 'button';
      info.textContent = 'i';
      info.setAttribute('aria-label', t('inspect.title'));
      info.addEventListener('click', (e) => {
        e.stopPropagation();          // don't equip on the way past
        this.openInspect(item, slotKey, locked);
      });
      card.appendChild(info);
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

  // ---- weapon inspect sheet ----------------------------------------
  // Renders the stat readout for a tapped item. Every label goes through
  // t(), and the metric keys live in weaponstats.js — nothing here spells a
  // stat name out, so a new metric or a new language needs no change to this
  // function.
  openInspect(item, slotKey, locked = false) {
    this._inspect = { item, slotKey, locked };
    const rarity = item ? RARITY[item.rarity] : null;

    const card = document.querySelector('.inspect-card');
    if (rarity) {
      card.style.setProperty('--rarity', rarity.color);
      card.style.setProperty('--rarity-glow', rarity.glow);
    }
    $('inspect-name').textContent = this.itemLabel(item);
    const rr = $('inspect-rarity');
    rr.textContent = rarity
      ? (locked ? t('item.locked') : t(rarity.labelKey))
      : '';

    const body = $('inspect-body');
    body.innerHTML = '';

    // --- ballistics ---
    const weapon = weaponForItem(item, this.weapons);
    const rows = weaponStatRows(weapon, this.weapons);
    if (rows.length) {
      body.appendChild(this.statGroupTitle(t('inspect.title')));
      for (const r of rows) body.appendChild(this.statRow(r));
    } else if (weapon) {
      // a real weapon with no ballistics — the knife
      const p = document.createElement('div');
      p.className = 'inspect-empty';
      p.textContent = t('inspect.noStats');
      body.appendChild(p);
    }

    // --- perks (operators, boss redeemables, some skins) ---
    const perks = describePerk(item && item.perk);
    if (perks.length) {
      body.appendChild(this.statGroupTitle(t('inspect.perks')));
      for (const p of perks) {
        const row = document.createElement('div');
        row.className = 'perk-row';
        const l = document.createElement('span');
        l.className = 'perk-label';
        // perk rows carry their own i18n key from PERK_DEFS
        l.textContent = t(p.key);
        const v = document.createElement('span');
        v.className = 'perk-value';
        v.textContent = p.value;
        row.appendChild(l); row.appendChild(v);
        body.appendChild(row);
      }
    }

    // --- actions ---
    const eqBtn = $('btn-inspect-equip');
    const isEquipped = item && this.p.equipped(slotKey) === item.id;
    eqBtn.textContent = locked ? t('item.locked')
      : isEquipped ? t('inspect.equipped') : t('inspect.equip');
    eqBtn.disabled = !!locked || !!isEquipped;

    $('inspect').classList.remove('hidden');
    // preview needs a laid-out canvas, and the bars animate from zero — both
    // have to wait a frame after the sheet becomes visible
    requestAnimationFrame(() => {
      this.previewItem(item, $('inspect-preview'));
      body.querySelectorAll('.stat-fill').forEach((el) => {
        el.style.width = `${(parseFloat(el.dataset.fill) * 100).toFixed(1)}%`;
      });
    });
    if (this.audio) this.audio.ui();
  }

  closeInspect() {
    $('inspect').classList.add('hidden');
    this._inspect = null;
  }

  statGroupTitle(text) {
    const h = document.createElement('div');
    h.className = 'stat-group-title';
    h.textContent = text;
    return h;
  }

  // label + value on one line, proportional bar underneath. `fill` is already
  // normalised so a long bar always means "better", whichever direction the
  // underlying metric runs (see weaponstats.js).
  statRow(r) {
    const row = document.createElement('div');
    row.className = 'stat-row';

    const top = document.createElement('div');
    top.className = 'stat-row-top';
    const l = document.createElement('span');
    l.className = 'stat-label';
    l.textContent = r.label;
    const v = document.createElement('span');
    v.className = 'stat-value';
    v.textContent = r.value;
    top.appendChild(l); top.appendChild(v);

    const track = document.createElement('div');
    track.className = 'stat-track';
    const fill = document.createElement('div');
    fill.className = 'stat-fill';
    fill.style.setProperty('--stat-color', r.color);
    fill.dataset.fill = String(r.fill);   // width applied next frame, so it animates
    track.appendChild(fill);

    row.appendChild(top); row.appendChild(track);
    return row;
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
      // Draw the art even when it is not owned yet — a collection screen where
      // eight of nine slots are a placeholder dash tells the player nothing
      // about what they are chasing. `.item-card.locked` desaturates it, so it
      // still reads as unearned; the shape is the point.
      requestAnimationFrame(() => this.previewItem(item, cv));
    }
    $('collection-count').textContent = `${owned} / ${CATALOG.length}`;
  }

  // ---- crate open: spend (scrap or a watched ad), roll, spin, reveal ----
  openCrate({ free = false } = {}) {
    if (this.busy) return;
    const msg = $('crate-msg');
    if (!free && this.p.scrap < CRATE_COST) {
      msg.textContent = t('crates.notEnough');
      msg.classList.add('warn');
      return;
    }
    msg.classList.remove('warn');
    msg.textContent = '';
    this.busy = true;
    if (!free) this.p.spendScrap(CRATE_COST);
    this.p.data.cratesOpened++;
    this.renderScrap();
    if (this.audio) this.audio.ui();

    const drop = rollCrate();
    const isDup = this.p.owns(drop.id);
    let refund = 0;
    if (isDup) { refund = Math.round(CRATE_COST * DUPLICATE_REFUND); this.p.addScrap(refund); }
    else if (drop.weaponId) { for (const vid of weaponVariantIds(drop.weaponId)) this.p.grant(vid); }
    else this.p.grant(drop.id);

    this.playCaseOpen(() => this.spinReel(drop, () => this.showReveal(drop, isDup, refund)));
  }

  // Free crate paid for by finishing a rewarded ad instead of scrap.
  openCrateWithAd() {
    if (this.busy) return;
    const msg = $('crate-msg');
    if (this.p.adCratesRemaining() <= 0) {
      msg.textContent = t('crates.adLimit');
      msg.classList.add('warn');
      return;
    }
    msg.classList.remove('warn');
    // Only claim to be loading when something is actually being fetched. With
    // the ad preloaded the overlay comes up in the same frame, and a LOADING
    // line that flashes for one frame reads as a glitch.
    msg.textContent = isRewardedAdReady() ? '' : t('crates.loadingAd');
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
    this.renderScrap();
    this.renderCollection();
    this.renderLoadout();
    this.renderLoadoutChips();
    if (this.audio) this.audio.ui();
  }
}
