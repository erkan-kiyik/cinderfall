// DOM HUD: crisp vector text at any DPI. Owns overlay visibility, bars,
// ammo readout, hitmarkers, damage vignette, the detection meter, XP/level,
// directional damage indicators, elimination toasts and the menu/pause/end
// screens.

import { drawSprite } from '../art/paint.js';
import { audio } from '../engine/audio.js';
import { playCurrencyGain, animateCount } from './currencyfx.js';
import { t, getLang, LANGS } from '../engine/i18n.js';
import { quality, QUALITY_ORDER, PRESETS as QUALITY_PRESETS } from '../engine/quality.js';
import { brightness, LEVELS as BRIGHTNESS_LEVELS } from '../engine/brightness.js';
import { settings, SHAKE_LEVELS } from '../engine/settings.js';
import { haptic, slidePill, kick, flash, shake, sparks, bindTouchButtons, level, EASE_OUT } from '../ui/motion.js';

const $ = (id) => document.getElementById(id);

// Detection states map to dictionary keys rather than literals so the threat
// meter reads in the player's language like everything else.
// Graphics tier display names. Translated like every other label in the
// panel: the preset's own `name` is authored English, and leaving one row in
// Latin inside an otherwise fully localised screen is just an oversight the
// player has to read around. Falls back to the preset name if a dictionary
// is ever missing the key.
const gfxLabel = (tier) =>
  t(`set.gfx.${tier}`, null) !== `set.gfx.${tier}`
    ? t(`set.gfx.${tier}`)
    : (QUALITY_PRESETS[tier] && QUALITY_PRESETS[tier].name) || tier.toUpperCase();

const DET_KEY = {
  hidden: 'det.hidden', suspicious: 'det.suspicious', searching: 'det.searching',
  detected: 'det.detected', combat: 'det.combat',
};

const DET_ORDER = ['hidden', 'suspicious', 'searching', 'detected', 'combat'];

export class Hud {
  constructor() {
    this.el = {
      hud: $('hud'), loading: $('loading'), menu: $('menu'),
      pause: $('pause'), end: $('end'), revive: $('revive'), reviveCount: $('revive-count'),
      loadFill: $('load-fill'), loadLabel: $('load-label'),
      hpFill: $('hp-fill'), stFill: $('st-fill'), armorFill: $('armor-fill'),
      armorRow: $('armor-row'), reloadBar: $('reload-bar'), reloadBarFill: $('reload-bar-fill'),
      tcReload: $('tc-reload'), hudTr: document.querySelector('.hud-tr'),
      ammoMag: $('ammo-mag'), ammoRes: $('ammo-res'),
      weaponName: $('weapon-name'), reloadHint: $('reload-hint'),
      wpnMeter: $('wpn-meter'), wpnMeterFill: $('wpn-meter-fill'),
      slots: [$('slot-1'), $('slot-2'), $('slot-3'), $('slot-4')],
      slotIcons: [$('slot-1-icon'), $('slot-2-icon'), $('slot-3-icon'), $('slot-4-icon')],
      objCount: $('obj-count'), stageLabel: $('stage-label'),
      hitmark: $('hitmark'), damage: $('damage-flash'), vignette: $('vignette'),
      stealthPrompt: $('stealth-prompt'),
      dmgLeft: $('dmg-left'), dmgRight: $('dmg-right'), dmgOmni: $('dmg-omni'),
      detBar: $('det-bar'), detFill: $('det-fill'), detLabel: $('det-label'),
      xpFill: $('xp-fill'), lvlLabel: $('lvl-label'), hudScrap: $('hud-scrap'), hudScrapVal: $('hud-scrap-val'),
      notify: $('notify'),
      intelToast: $('intel-toast'), intelToastTitle: $('intel-toast-title'),
      endTitle: $('end-title'), endDetail: $('end-detail'),
      cineBars: $('cine-bars'), introKicker: $('intro-kicker'), introLine: $('intro-line'),
      introSkip: $('intro-skip'), sceneFade: $('scene-fade'),
      bossBar: $('boss-bar'), bossName: $('boss-name'), bossHpFill: $('boss-hp-fill'),
      lore: $('lore'), loreAttempt: $('lore-attempt'), attemptBadge: $('attempt-badge'),
      daily: $('daily'), dailySub: $('daily-sub'), dailyTrack: $('daily-track'),
      dailyStreak: $('daily-streak'), dailyClaim: $('btn-daily-claim'),
      shareBtn: $('btn-share'),
      shareCard: $('sharecard'), shareCanvas: $('sharecard-canvas'),
      langpick: $('langpick'), langpickList: $('langpick-list'),
      settings: $('settings'),
    };
    this._initGhosts();
    this._loreTimers = [];
    this._lastAmmo = null;
    this._lastDetState = null;
    this._hp = null; this._armor = null; this._mag = null; this._cur = null; this._buzzAt = 0;
    bindTouchButtons();
  }

  // Every binding goes through `on`, which tolerates a missing element.
  //
  // It used to assign onclick directly, so removing a button from the markup
  // threw at boot and took the whole menu down with it — which is exactly
  // what happened when the pause menu's three cycling controls were replaced
  // by one settings button and this kept binding #btn-language. A handler
  // with nothing to attach to is a dead handler, not a fatal error, and the
  // rest of the interface should still come up.
  bind(h) {
    const on = (id, fn) => { if (!fn) return; const el = $(id); if (el) el.onclick = fn; };
    on('btn-deploy', h.deploy);
    on('btn-resume', h.resume);
    on('btn-restart', h.restart);
    on('btn-quit', h.quit);
    on('btn-redeploy', h.restart);
    on('btn-menu', h.quit);
    on('btn-langpick-close', h.langClose);
    on('btn-settings', h.settings);
    on('btn-settings-close', h.settingsClose);
    this._onPickStage = h.pickStage || null;
    on('btn-share', h.share);
    on('btn-sharecard-send', h.shareSend);
    on('btn-sharecard-close', h.shareClose);
    on('btn-daily-claim', h.claimDaily);
    on('btn-revive-ad', h.watchAdRevive);
    on('btn-revive-skip', h.skipRevive);
    on('btn-revive-menu', h.reviveMenu);
  }

  // The graphics tier used to have its own label in the pause menu. It lives
  // in the settings panel now, so this repaints that instead — and matters
  // because the runtime can lower the tier on its own under load, which the
  // control has to reflect if the panel happens to be open.
  setGraphicsTier() {
    if (this._settingsBuilt) this.renderSettings();
  }

  // Health bars keep a pale "ghost" behind the fill. A hit drops the fill at
  // once and the ghost holds, then drains down to it, which is what lets the
  // eye measure how big the hit was. Created here rather than in the markup so
  // the bars stay a single element each for anything that styles them.
  _initGhosts() {
    for (const [key, cls] of [['hpFill', 'hp'], ['bossHpFill', 'boss']]) {
      const fill = this.el[key];
      if (!fill || !fill.parentElement) continue;
      const ghost = document.createElement('i');
      ghost.className = `bar-ghost ${cls}`;
      ghost.style.transform = 'scaleX(1)';
      ghost._f = 1;             // where the ghost is heading / resting
      ghost._anim = null;
      fill.parentElement.insertBefore(ghost, fill);
      this.el[`${key}Ghost`] = ghost;
    }
  }

  // Writes a bar's fill and moves its ghost. The ghost is a scaled element
  // animated with WAAPI (no layout per frame, and the hold-then-drain delay
  // lives in the animation, so a burst of small changes can't keep resetting
  // it the way a CSS transition would).
  //   - a drop starts a drain from wherever the ghost currently is;
  //   - a heal that reaches the ghost carries it up with the fill;
  //   - slow regen under a draining ghost leaves it alone.
  _setBar(key, frac, prev) {
    const fill = this.el[key], ghost = this.el[`${key}Ghost`];
    fill.style.width = `${Math.round(frac * 1000) / 10}%`;
    if (!ghost) return;
    const park = (f) => {
      if (ghost._anim) { ghost._anim.cancel(); ghost._anim = null; }
      ghost._f = f; ghost.style.transform = `scaleX(${f})`;
    };
    if (level() === 0 || !ghost.animate) { park(frac); return; }
    const shown = ghost._anim ? new DOMMatrix(getComputedStyle(ghost).transform).a : ghost._f;
    if (frac >= shown) { park(frac); return; }
    if (prev != null && frac > prev) return;
    if (ghost._anim) ghost._anim.cancel();
    ghost.style.transform = `scaleX(${shown})`;
    const anim = ghost.animate(
      [{ transform: `scaleX(${shown})` }, { transform: `scaleX(${frac})` }],
      { duration: 650, delay: 420, easing: EASE_OUT, fill: 'forwards' });
    ghost._anim = anim; ghost._f = frac;
    anim.onfinish = () => {
      if (ghost._anim !== anim) return;
      ghost._anim = null; ghost.style.transform = `scaleX(${frac})`; anim.cancel();
    };
  }

  // Boss encounter health bar — hidden the rest of the time.
  showBoss(on, name) {
    const bar = this.el.bossBar;
    const wasHidden = bar.classList.contains('hidden');
    bar.classList.toggle('hidden', !on);
    if (on && name) this.el.bossName.textContent = name;
    if (on && wasHidden) {
      // the bar drops in with a spring and the phone gives one heavy thump
      bar.classList.remove('enter'); void bar.offsetWidth; bar.classList.add('enter');
      haptic('heavy');
      this._boss = null;
    }
  }

  setBossHp(frac) {
    frac = Math.max(0, Math.min(1, frac));
    const prev = this._boss;
    if (frac === prev) return;
    this._setBar('bossHpFill', frac, prev);
    if (prev != null && frac < prev - 0.002) {
      flash(this.el.bossHpFill, { from: 'brightness(2.6)', ms: 240 });
      kick(this.el.bossName, { scale: 1.08, ms: 220, gap: 120 });
      if (frac === 0) haptic('success');
    }
    this._boss = frac;
  }

  setLoad(p, label) {
    this.el.loadFill.style.width = `${Math.round(p * 100)}%`;
    if (label) this.el.loadLabel.textContent = label;
  }

  // 'loading' | 'menu' | 'play' | 'pause' | 'revive' | 'end'
  show(state) {
    this.el.loading.classList.toggle('hidden', state !== 'loading');
    this.el.menu.classList.toggle('hidden', state !== 'menu');
    this.el.pause.classList.toggle('hidden', state !== 'pause');
    this.el.end.classList.toggle('hidden', state !== 'end');
    // 'revive' keeps the live #hud visible (dimmed) behind its overlay,
    // same as 'pause' — only 'menu'/'loading'/'end' hide it outright.
    this.el.hud.classList.toggle('hidden', !(state === 'play' || state === 'pause' || state === 'revive'));
    // While a sheet is up the readout is live but not actionable, so it steps
    // back rather than competing with the menu for attention — the ammo count
    // and threat bar were reading as loud as the RESUME button.
    this.el.hud.classList.toggle('behind', state === 'pause' || state === 'revive');
  }

  // Revive prompt overlays on top of the live #hud (unlike menu/pause/end,
  // it doesn't route through show() — the vitals/ammo readout stay visible
  // behind it while the world is frozen).
  showRevive(on) {
    this.el.revive.classList.toggle('hidden', !on);
  }

  // Reflects the active language onto the pause-menu toggle.
  // Level select: one cell per unlocked sector. Cleared stages stay playable
  // so a player can farm a boss or re-run a layout; the frontier stage (the
  // one they have not beaten yet) is highlighted. Everything past it is
  // rendered locked rather than hidden, so the run ahead stays legible.
  // Boss arenas only.
  //
  // Intermediate stages are one-and-done — they are beaten on the way through
  // and never offered again, so the campaign always moves forward instead of
  // letting a player farm an easy early stage. Boss arenas are the farm: they
  // hold the 1/1000 redeemable table, so going back to one has a point.
  //
  // `stages` is the list of boss stage numbers to show (see
  // Progression.bossStages); the last entry is the frontier the player is
  // still working toward and is shown locked until it has been cleared once.
  // Cleared boss arenas only — nothing else is ever drawn here.
  //
  // No locked placeholders: an arena the player has not beaten yet simply does
  // not exist in this menu. A grid of greyed-out boxes advertises content the
  // player cannot touch and makes the screen read as mostly-unavailable, which
  // is the opposite of what a replay menu is for. The section hides itself
  // entirely until the first boss goes down, so a new player never sees an
  // empty shell.
  //
  // `stages` is the list of *cleared* boss stage numbers (see
  // Progression.clearedBossStages).
  renderLevelSelect(stages) {
    const grid = $('level-grid');
    const section = $('level-select');
    if (!grid) return;
    grid.innerHTML = '';

    const list = stages || [];
    // the whole block disappears rather than showing an empty heading
    if (section) section.classList.toggle('hidden', list.length === 0);
    if (!list.length) return;

    for (const n of list) {
      const cell = document.createElement('button');
      cell.className = 'level-cell boss cleared';
      cell.textContent = String(n);
      const tag = document.createElement('span');
      tag.className = 'level-tag';
      tag.textContent = t('level.boss');
      cell.appendChild(tag);
      if (this._onPickStage) cell.onclick = () => this._onPickStage(n);
      grid.appendChild(cell);
    }
  }

  setLanguage() {
    const entry = LANGS.find((l) => l.code === getLang());
    const el = $('language-label');
    if (el) el.textContent = entry ? entry.label : getLang().toUpperCase();
    // The header pill has room for a code, not a name. It only has to say
    // which language is on; the picker itself spells all seven out.
    const pill = $('lang-pill-label');
    if (pill) pill.textContent = getLang().toUpperCase();
  }

  // Builds the picker list once and re-marks the active row. Each label is
  // written in its own script, so it also carries its own lang/dir: an Arabic
  // label inside an English document still has to render right-to-left, and
  // Devanagari needs the right font stack picked for it.
  buildLangPicker(onPick) {
    const list = this.el.langpickList;
    if (!list) return;
    list.innerHTML = '';
    const active = getLang();
    for (const l of LANGS) {
      const b = document.createElement('button');
      b.className = 'btn lang-opt' + (l.code === active ? ' active' : '');
      b.textContent = l.label;
      b.setAttribute('lang', l.code);
      b.setAttribute('dir', l.rtl ? 'rtl' : 'ltr');
      b.onclick = () => onPick(l.code);
      list.appendChild(b);
    }
  }

  showLangPicker(on) {
    if (this.el.langpick) this.el.langpick.classList.toggle('hidden', !on);
  }

  // ---- settings -----------------------------------------------------------
  // Built once, then refreshed on open. Every row is a radiogroup of visible
  // options rather than a cycling button, so the control answers "what are my
  // choices" and "which one am I on" at a glance instead of on the fourth tap.
  //
  // The HUD stays a pure view: it reads quality/brightness/settings to render
  // and calls back out through `on` to change anything. Nothing here decides
  // what a tier means.
  buildSettings(on) {
    if (!this.el.settings || this._settingsBuilt) { this.renderSettings(); return; }
    this._settingsOn = on;

    const seg = (host, opts, get, set) => {
      host.innerHTML = '';
      for (const o of opts) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'seg-opt';
        b.dataset.val = String(o.val);
        b.setAttribute('role', 'radio');
        b.onclick = () => { set(o.val); this.renderSettings(); on.changed && on.changed(); };
        host.appendChild(b);
      }
      host._get = get;
      host._opts = opts;
    };

    seg($('set-graphics'),
      QUALITY_ORDER.map((tier) => ({ val: tier, labelKey: null, text: () => gfxLabel(tier) })),
      () => quality.data.tier,
      (tier) => { quality.set(tier); on.graphics && on.graphics(); });

    seg($('set-brightness'),
      BRIGHTNESS_LEVELS.map((l, i) => ({ val: i, text: () => t(l.label) })),
      () => brightness.index,
      (i) => { brightness.set(i); });

    seg($('set-shake'),
      SHAKE_LEVELS.map((l, i) => ({ val: i, text: () => t(l.label) })),
      () => settings.shakeIndex,
      (i) => { settings.setShake(i); });

    seg($('set-haptics'),
      [{ val: 1, text: () => t('set.on') }, { val: 0, text: () => t('set.shake.off') }],
      () => (settings.haptics ? 1 : 0),
      (v) => { settings.setHaptics(!!v); if (v) haptic('soft'); });

    const vol = $('set-volume');
    // `input` rather than `change`: the gain follows the thumb, so the player
    // hears the level they are setting while they are setting it.
    vol.addEventListener('input', () => {
      settings.setVolume(vol.value / 100);
      this.renderSettingsVolume();
    });
    $('set-language').onclick = () => { on.language && on.language(); };

    this._settingsBuilt = true;
    this.renderSettings();
  }

  renderSettingsVolume() {
    const vol = $('set-volume'); const out = $('set-volume-val');
    if (!vol || !out) return;
    const pct = Math.round(settings.volume * 100);
    if (document.activeElement !== vol) vol.value = String(pct);
    out.textContent = settings.muted ? t('set.muted') : `${pct}%`;
    vol.classList.toggle('muted', settings.muted);
  }

  renderSettings() {
    if (!this.el.settings) return;
    for (const id of ['set-graphics', 'set-brightness', 'set-shake', 'set-haptics']) {
      const host = $(id);
      if (!host || !host._opts) continue;
      const cur = String(host._get());
      for (let i = 0; i < host._opts.length; i++) {
        const b = host.children[i];
        if (!b) continue;
        b.textContent = host._opts[i].text();
        const on = b.dataset.val === cur;
        b.classList.toggle('active', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      }
      slidePill(host, { kind: 'fill', active: '.seg-opt.active' });
    }
    this.renderSettingsVolume();
    const entry = LANGS.find((l) => l.code === getLang());
    const ll = $('set-language-label');
    if (ll) {
      ll.textContent = entry ? entry.label : getLang().toUpperCase();
      // The label is written in its own script, so it carries its own
      // direction — an Arabic label inside an English panel still reads RTL.
      ll.setAttribute('lang', getLang());
      ll.setAttribute('dir', entry && entry.rtl ? 'rtl' : 'ltr');
    }
  }

  showSettings(on) {
    if (!this.el.settings) return;
    if (on) this.renderSettings();
    this.el.settings.classList.toggle('hidden', !on);
  }

  // The brightness labels resolve through t(), so a language switch has to
  // repaint the settings panel if it is open.
  setBrightness() {
    if (this._settingsBuilt) this.renderSettings();
  }

  // ---- daily reward ----
  // `rewards` is the seven-day cycle, `day` the one being claimed now.
  showDaily(on, { rewards = [], day = 1, streak = 0 } = {}) {
    const el = this.el.daily;
    if (!el) return;
    el.classList.toggle('hidden', !on);
    if (!on) return;
    this.el.dailySub.textContent = t('daily.sub', { n: day });
    this.el.dailyStreak.textContent = t('daily.streak', { n: streak });
    const track = this.el.dailyTrack;
    track.innerHTML = '';
    for (const r of rewards) {
      const cell = document.createElement('div');
      cell.className = 'daily-cell'
        + (r.day < day ? ' done' : '')
        + (r.day === day ? ' today' : '');
      cell.innerHTML = `<div class="daily-cell-day">${r.day}</div>` +
        `<div class="daily-cell-amt">${r.amount}</div>`;
      track.appendChild(cell);
    }
    this.el.dailyClaim.disabled = false;
    this.el.dailyClaim.textContent = t('daily.claim');
  }

  markDailyClaimed() {
    if (!this.el.dailyClaim) return;
    this.el.dailyClaim.disabled = true;
    this.el.dailyClaim.textContent = t('daily.claimed');
  }

  // Score-card overlay. The canvas is painted by the caller (sharecard.js)
  // before this is shown, so the card is already on screen when it fades in.
  showShareCard(on) {
    if (this.el.shareCard) this.el.shareCard.classList.toggle('hidden', !on);
  }

  shareCanvasEl() { return this.el.shareCanvas; }

  // Share button feedback: 'shared' | 'copied' | 'failed'
  setShareResult(kind) {
    const b = $('btn-sharecard-send');
    if (!b) return;
    const label = { shared: 'share.share', saved: 'share.saved',
                    copied: 'share.copied', failed: 'share.failed' }[kind] || 'share.share';
    b.textContent = t(label);
    clearTimeout(this._shareT);
    this._shareT = setTimeout(() => { b.textContent = t('share.share'); }, 1800);
  }

  setReviveCountdown(n) {
    this.el.reviveCount.textContent = n > 0 ? `${n}s` : '';
  }

  // The prompt while a rewarded ad is being fetched. Tearing the overlay down
  // first left the player looking at a dead screen for however long the fetch
  // took, with nothing saying an ad was on its way; this keeps the prompt up,
  // says so, and locks both buttons so the request cannot be fired twice.
  setReviveLoading() {
    this.el.reviveCount.textContent = t('ad.loading');
    const ad = $('btn-revive-ad'), skip = $('btn-revive-skip');
    if (ad) ad.disabled = true;
    if (skip) skip.disabled = true;
  }

  clearReviveLoading() {
    const ad = $('btn-revive-ad'), skip = $('btn-revive-skip');
    if (ad) ad.disabled = false;
    if (skip) skip.disabled = false;
    this.el.reviveCount.textContent = '';
  }

  // Draws a small preview of a weapon's painted body sprite into a slot's
  // icon canvas — reuses the real high-res art, no separate icon assets.
  // Uses fixed dimensions (matching .slot-icon's CSS size) rather than
  // clientWidth/Height: this runs while #hud is still display:none during
  // boot, where layout sizes read as zero.
  setWeaponIcons(arsenal) {
    const W = 22, H = 14;
    const specs = [
      ['slot-1-icon', arsenal.rifle?.wpn], ['slot-2-icon', arsenal.pistol?.wpn],
      ['slot-3-icon', arsenal.knife?.wpn], ['slot-4-icon', arsenal.smg?.wpn],
    ];
    for (const [id, wpn] of specs) {
      const cv = $(id);
      if (!cv || !wpn) continue;
      const g = cv.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      const spr = wpn.body;
      const scale = (W * 0.82) / spr.w;
      g.save();
      g.translate(W / 2 + 2, H / 2);
      drawSprite(g, spr, 0, 0, 0, scale, scale);
      g.restore();
    }
  }

  update(player) {
    const hpFrac = Math.max(0, player.hp / player.maxHp);
    // Vitals answer a change: a hit flashes the bar white and shakes the
    // panel, a heal pulses it. Compared against the previous frame, so the
    // work is two number checks per frame.
    if (this._hp != null) {
      if (hpFrac < this._hp - 0.004) {
        flash(this.el.hpFill, { from: 'brightness(3)' });
        shake(this.el.hpFill.parentElement.parentElement, 3, 260);
      } else if (hpFrac > this._hp + 0.004) {
        flash(this.el.hpFill, { from: 'brightness(1.9) saturate(1.6)', ms: 420 });
        kick(this.el.hpFill.parentElement, { scale: 1.05, ms: 380 });
      }
    }
    const hpW = Math.round(hpFrac * 1000) / 10;
    if (hpW !== this._hpW) { this._hpW = hpW; this._setBar('hpFill', hpFrac, this._hp); }
    this._hp = hpFrac;
    const low = hpFrac < 0.35;
    if (low !== this._hpLow) { this._hpLow = low; this.el.hpFill.classList.toggle('low', low); }
    // Under a quarter health the screen edge beats like a pulse (opacity only).
    const crit = hpFrac > 0 && hpFrac < 0.25;
    if (crit !== this._crit) { this._crit = crit; this.el.vignette.classList.toggle('crit', crit); }
    const stW = Math.round(player.stamina);
    if (stW !== this._stW) { this._stW = stW; this.el.stFill.style.width = `${stW}%`; }
    // Out of breath: the bar turns amber and stays that way until there is a
    // real sprint's worth back, so it doesn't flicker at the empty mark.
    const spent = this._spent ? stW < 35 : stW < 6;
    if (spent !== this._spent) {
      this._spent = spent;
      this.el.stFill.classList.toggle('spent', spent);
      if (spent) flash(this.el.stFill, { from: 'brightness(2.2)', ms: 320 });
    }

    const hasArmor = player.maxArmor > 0;
    this.el.armorRow.classList.toggle('hidden', !hasArmor);
    if (hasArmor) {
      const af = player.armor / player.maxArmor;
      if (this._armor != null && af < this._armor - 0.004) flash(this.el.armorFill, { from: 'brightness(2.6)' });
      else if (this._armor != null && af > this._armor + 0.004) flash(this.el.armorFill, { from: 'brightness(1.8)', ms: 380 });
      this._armor = af;
      const aw = Math.round(af * 1000) / 10;
      if (aw !== this._armorW) { this._armorW = aw; this.el.armorFill.style.width = `${aw}%`; }
    }

    const cur = player.cur;
    const isGun = cur.wpn.kind === 'gun';
    const magTxt = isGun ? String(cur.mag) : '—';
    const resTxt = isGun ? String(cur.reserve) : '';
    // swap: the weapon panel slides the new name in and the slot pill pops
    if (this._cur != null && this._cur !== player.current) {
      kick(this.el.hudTr, { scale: 1.04, ms: 320 });
      kick(this.el.weaponName, { scale: 1, x: 14, ms: 360 });
      const slotOf0 = { rifle: 0, pistol: 1, knife: 2, smg: 3 };
      kick(this.el.slots[slotOf0[player.current]], { scale: 1.28, ms: 380 });
      this._mag = null;
    }
    this._cur = player.current;
    if (isGun) {
      // a shot nudges the counter; a reload landing pops it
      if (this._mag != null && cur.mag < this._mag) kick(this.el.ammoMag, { scale: 1.12, ms: 150, gap: 70 });
      else if (this._mag != null && cur.mag > this._mag) kick(this.el.ammoMag, { scale: 1.32, ms: 420 });
      this._mag = cur.mag;
      const size = cur.wpn.magSize || 1;
      const low = cur.mag > 0 && cur.mag <= Math.max(2, size * 0.25);
      const empty = cur.mag === 0;
      if (low !== this._ammoLow || empty !== this._ammoEmpty) {
        this.el.ammoMag.classList.toggle('low', low);
        this.el.ammoMag.classList.toggle('empty', empty);
        if (empty && !this._ammoEmpty) shake(this.el.ammoMag.parentElement, 3, 260);
        this._ammoLow = low; this._ammoEmpty = empty;
      }
    } else if (this._mag != null) {
      this._mag = null;
      this.el.ammoMag.classList.remove('low', 'empty');
      this._ammoLow = this._ammoEmpty = false;
    }
    if (this._lastAmmo !== magTxt + resTxt + cur.wpn.name) {
      this._lastAmmo = magTxt + resTxt + cur.wpn.name;
      this.el.ammoMag.textContent = magTxt;
      this.el.ammoRes.textContent = resTxt;
      this.el.weaponName.textContent = cur.wpn.name;
    }
    this.el.reloadHint.classList.toggle(
      'hidden',
      !(player.reload || (isGun && cur.mag === 0 && cur.reserve > 0))
    );
    // textContent replaces the text node even when the string is the same,
    // which re-lays-out the panel; this ran every frame. Write on change only.
    const rh = player.reload ? 'hud.reloading' : 'hud.reloadHint';
    if (rh !== this._rhKey) { this._rhKey = rh; this.el.reloadHint.textContent = t(rh); }
    // reload progress: a thin bar under the counter and a ring on the button
    const rl = player.reload;
    if (this.el.reloadBar) {
      if (rl) {
        if (!this._reloading) { this._reloading = true; this.el.reloadBar.classList.remove('hidden'); this.el.tcReload && this.el.tcReload.classList.add('busy'); }
        this.el.reloadBarFill.style.transform = `scaleX(${Math.min(1, rl.t / rl.T).toFixed(3)})`;
      } else if (this._reloading) {
        // swapping weapons mid-reload cancels it; only a reload that ran to
        // the end gets the "done" pop
        const finished = this._rlFrac >= 0.9;
        this._reloading = false;
        this.el.reloadBar.classList.add('hidden');
        const btn = this.el.tcReload;
        if (btn) {
          btn.classList.remove('busy');
          if (finished) {
            btn.classList.add('done');
            setTimeout(() => btn.classList.remove('done'), 460);
            haptic('tick');
          }
        }
      }
      this._rlFrac = rl ? rl.t / rl.T : 0;
    }

    const slotOf = { rifle: 0, pistol: 1, knife: 2, smg: 3 };
    this.el.slots.forEach((s, i) => { if (s) s.classList.toggle('active', i === slotOf[player.current]); });

    // persistent low-hp vignette
    if (player.hurtT <= 0) {
      const op = ((1 - hpFrac) * 0.45).toFixed(3);
      if (op !== this._dmgOp) { this._dmgOp = op; this.el.damage.style.opacity = op; }
    }
  }

  setObjective(done, total) {
    const txt = `${done} / ${total}`;
    if (txt === this._objTxt) return;
    if (this._objTxt != null) kick(this.el.objCount, { scale: 1.3, ms: 380 });
    this._objTxt = txt;
    this.el.objCount.textContent = txt;
    // a cleared objective turns the counter green and gets its own buzz
    const cleared = total > 0 && done >= total;
    if (cleared !== this._objDone) {
      this._objDone = cleared;
      this.el.objCount.classList.toggle('done', cleared);
      if (cleared) { kick(this.el.objCount, { scale: 1.55, ms: 560 }); haptic('success'); }
    }
  }

  setStage(n) {
    this.el.stageLabel.textContent = t('hud.stage', { n });
    if (this._stage != null && n !== this._stage) kick(this.el.stageLabel, { scale: 1.3, ms: 520 });
    this._stage = n;
  }

  setSlot4Visible(visible) {
    if (this.el.slots[3]) this.el.slots[3].classList.toggle('hidden', !visible);
  }

  // Detection meter: 5-state colour ramp with a distinct pulse on every
  // state change so escalation/de-escalation is always noticed.
  setDetection(state, value) {
    const dv = Math.round(value * 100);
    if (dv !== this._detV) { this._detV = dv; this.el.detFill.style.width = `${dv}%`; }
    if (state !== this._lastDetState) {
      // Escalation is felt as well as seen: noticed gets a double buzz and the
      // bar shudders, full combat a heavy thump. De-escalation stays quiet.
      const prevRank = DET_ORDER.indexOf(this._lastDetState);
      const rank = DET_ORDER.indexOf(state);
      if (prevRank >= 0 && rank > prevRank && rank >= 3) {
        shake(this.el.detBar, 4, 280);
        haptic(rank >= 4 ? 'heavy' : 'warn');
      }
      this._lastDetState = state;
      this.el.detLabel.textContent = t(DET_KEY[state] || 'det.hidden');
      // The threat bar only appears once an enemy is actually aware of the
      // player; in the safe 'hidden' state it fades out (via .det-visible /
      // the CSS opacity transition) so it never clutters stealth play.
      // 'det-' prefix keeps the state name off the generic .hidden utility.
      const visible = state !== 'hidden';
      this.el.detBar.className = `det-bar glass det-${state}${visible ? ' det-visible' : ''}`;
      if (visible) {
        this.el.detBar.classList.remove('pulse');
        void this.el.detBar.offsetWidth;
        this.el.detBar.classList.add('pulse');
      }
    }
  }

  // Mission briefing: visible for `hold` seconds, then fades itself out.
  // Re-showing while one is already up restarts it cleanly rather than
  // stacking timers (stage transitions can arrive faster than the hold).
  // Attempt counter. `n` is which try this is at the current stage; the
  // badge stays up for the whole run and the briefing line only appears
  // once the player has actually failed here at least once (showing
  // "ATTEMPT #1" on a first visit would just be noise).
  setAttempt(n) {
    const badge = this.el.attemptBadge;
    if (badge) {
      badge.textContent = t('hud.attempt', { n });
      badge.classList.toggle('hidden', n <= 1);
    }
    const line = this.el.loreAttempt;
    if (line) {
      line.textContent = t('hud.attempt', { n });
      line.classList.toggle('hidden', n <= 1);
    }
  }

  showLore(hold = 3) {
    const el = this.el.lore;
    if (!el) return;
    for (const t of this._loreTimers) clearTimeout(t);
    this._loreTimers.length = 0;
    el.classList.remove('hidden', 'out');
    void el.offsetWidth;                      // restart the entry animation
    this._loreTimers.push(setTimeout(() => el.classList.add('out'), hold * 1000));
    this._loreTimers.push(setTimeout(() => el.classList.add('hidden'), hold * 1000 + 620));
  }

  hideLore() {
    for (const t of this._loreTimers) clearTimeout(t);
    this._loreTimers.length = 0;
    if (this.el.lore) this.el.lore.classList.add('hidden');
  }

  setProgress(level, xpFrac) {
    const leveled = this._lvl != null && level !== this._lvl;
    if (this._lvl != null && level > this._lvl) {
      kick(this.el.lvlLabel, { scale: 1.6, ms: 700 });
      sparks(this.el.lvlLabel, { count: 10, color: '#e5bd57', spread: 60, size: 5 });
      haptic('success');
    }
    if (level !== this._lvl) this.el.lvlLabel.textContent = `LVL ${level}`;
    this._lvl = level;
    const xp = Math.round(xpFrac * 100);
    if (xp !== this._xp) {
      // A glint on every gain. A level-up wraps the bar back round, so that
      // one snaps instead of sliding backwards across the whole track.
      if (this._xp != null && xp > this._xp && !leveled) flash(this.el.xpFill, { from: 'brightness(2.2)', ms: 360 });
      this.el.xpFill.style.transition = leveled ? 'none' : '';
      this._xp = xp; this.el.xpFill.style.width = `${xp}%`;
    }
  }

  setScrap(n) {
    const valEl = this.el.hudScrapVal;
    if (!valEl) return;
    const prev = this._lastScrap;
    this._lastScrap = n;
    if (prev == null || n <= prev) { valEl.textContent = String(n); return; }   // init / spend: snap, no fanfare
    animateCount(valEl, prev, n);
    playCurrencyGain(this.el.hudScrap, null, audio);
  }

  // Energy weapons: shows heat (yellow→red, flashes when overheated) or, for
  // charge weapons, the current charge (cyan). Hidden for conventional guns.
  setWeaponMeter(heat, overheated, charge) {
    const el = this.el.wpnMeter, fill = this.el.wpnMeterFill;
    if (!el) return;
    const show = heat > 0.001 || charge > 0.001 || overheated;
    el.classList.toggle('hidden', !show);
    if (!show) return;
    if (charge > 0.001) {
      fill.style.width = `${Math.round(charge * 100)}%`;
      fill.className = 'wpn-meter-fill charge';
    } else {
      fill.style.width = `${Math.round(heat * 100)}%`;
      fill.className = 'wpn-meter-fill heat' + (overheated ? ' over' : '');
    }
  }

  setAimScreen(x, y) { this._aimX = x; this._aimY = y; }

  // Shows/hides the silent-takedown prompt, anchored above the operator.
  setStealthPrompt(on, sx, sy) {
    const el = this.el.stealthPrompt;
    if (!el) return;
    if (on) {
      el.style.left = `${sx}px`;
      el.style.top = `${sy}px`;
      if (!this._spOn) { this._spOn = true; el.classList.add('show'); }
    } else if (this._spOn) {
      this._spOn = false; el.classList.remove('show');
    }
  }

  // kind: 'hit' | 'headshot' | 'kill'
  hitmark(kind = 'hit') {
    const el = this.el.hitmark;
    el.classList.remove('show', 'headshot', 'kill');
    void el.offsetWidth;           // restart CSS animation
    if (this._aimX !== undefined) {
      el.style.left = `${this._aimX}px`;
      el.style.top = `${this._aimY}px`;
    }
    if (kind === 'kill') { el.classList.add('kill'); haptic('soft'); }
    else if (kind === 'headshot') { el.classList.add('headshot'); haptic('tick'); }
    el.classList.add('show');
  }

  damageFlash(hpFrac) {
    // one buzz per burst of hits, not one per bullet
    const now = performance.now();
    if (now - this._buzzAt > 260) { this._buzzAt = now; haptic('warn'); }
    this.el.damage.style.opacity = String(0.55 + (1 - hpFrac) * 0.3);
    this._dmgOp = null;   // the per-frame writer must not skip its next value
    clearTimeout(this._dmgT);
    this._dmgT = setTimeout(() => {
      this.el.damage.style.opacity = String((1 - hpFrac) * 0.45);
      this._dmgOp = null;
    }, 140);
  }

  // dx: world-space offset from player to the damage source (screen-left/
  // right map directly in this side view). omni: non-directional hazard.
  damageDirection(dx, omni) {
    const el = omni ? this.el.dmgOmni : (dx < 0 ? this.el.dmgLeft : this.el.dmgRight);
    if (!el) return;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  notify(text) {
    const el = this.el.notify;
    el.textContent = text;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  // Intel recovered off a body. Runs on its own element so it can coexist
  // with a level-up or boss banner landing on the same kill — the two used to
  // share #notify, and whichever fired second silently replaced the first.
  //
  // `kicker` lets the caller swap the headline for the "archive complete, paid
  // out instead" case without needing a second element.
  showIntel(title, kicker = null) {
    const el = this.el.intelToast;
    if (!el) return;
    if (kicker) {
      const k = el.querySelector('.intel-toast-kicker');
      if (k) k.textContent = kicker;
    }
    this.el.intelToastTitle.textContent = title || '';
    el.classList.remove('show');
    void el.offsetWidth;      // restart the animation on a repeat find
    el.classList.add('show');
  }

  // ---- deploy cinematic: letterbox bars, briefing text, dip-to-black cuts

  showCine(on) {
    this.el.cineBars.classList.toggle('active', on);
  }

  // Pass undefined for either argument to leave that line as-is (so a later
  // beat can update only the briefing line while the kicker stays put).
  setIntroText(kicker, line) {
    if (kicker !== undefined) {
      this.el.introKicker.textContent = kicker;
      this.el.introKicker.classList.toggle('show', kicker.length > 0);
    }
    if (line !== undefined) {
      this.el.introLine.textContent = line;
      this.el.introLine.classList.toggle('show', line.length > 0);
    }
  }

  hideIntroText() {
    this.el.introKicker.classList.remove('show');
    this.el.introLine.classList.remove('show');
  }

  showSkipHint(on) {
    this.el.introSkip.classList.toggle('show', on);
  }

  // Dips the screen to black, runs `onBlack` at the peak (to swap state,
  // snap the camera, etc. without a visible pop), then fades back in.
  sceneFade(onBlack) {
    const el = this.el.sceneFade;
    el.style.transition = 'opacity 0.22s ease-in';
    el.style.opacity = '1';
    setTimeout(() => {
      onBlack();
      el.style.transition = 'opacity 0.4s ease-out';
      requestAnimationFrame(() => { el.style.opacity = '0'; });
    }, 220);
  }

  // The campaign is endless — the only way a run ends is the operator going
  // down, so this is always the K.I.A. screen with a run summary.
  // `attemptLine` is the headline number on a failed run (Geometry Dash
  // style); it renders above the stat block so it reads first.
  end(stats, attemptLine = '') {
    this.el.endTitle.textContent = t('end.kia');
    this.el.endTitle.style.color = 'var(--red)';
    const head = attemptLine ? `<div class="end-attempt">${attemptLine}</div>` : '';
    this.el.endDetail.innerHTML = head + stats;
  }
}
