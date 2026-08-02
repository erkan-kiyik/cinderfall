// DOM HUD: crisp vector text at any DPI. Owns overlay visibility, bars,
// ammo readout, hitmarkers, damage vignette, the detection meter, XP/level,
// directional damage indicators, elimination toasts and the menu/pause/end
// screens.

import { drawSprite } from '../art/paint.js';
import { audio } from '../engine/audio.js';
import { playCurrencyGain, animateCount } from './currencyfx.js';
import { t, getLang, LANGS } from '../engine/i18n.js';

const $ = (id) => document.getElementById(id);

// Detection states map to dictionary keys rather than literals so the threat
// meter reads in the player's language like everything else.
const DET_KEY = {
  hidden: 'det.hidden', suspicious: 'det.suspicious', searching: 'det.searching',
  detected: 'det.detected', combat: 'det.combat',
};

export class Hud {
  constructor() {
    this.el = {
      hud: $('hud'), loading: $('loading'), menu: $('menu'),
      pause: $('pause'), end: $('end'), revive: $('revive'), reviveCount: $('revive-count'),
      loadFill: $('load-fill'), loadLabel: $('load-label'),
      hpFill: $('hp-fill'), stFill: $('st-fill'), armorFill: $('armor-fill'),
      armorRow: $('armor-row'),
      ammoMag: $('ammo-mag'), ammoRes: $('ammo-res'),
      weaponName: $('weapon-name'), reloadHint: $('reload-hint'),
      wpnMeter: $('wpn-meter'), wpnMeterFill: $('wpn-meter-fill'),
      slots: [$('slot-1'), $('slot-2'), $('slot-3'), $('slot-4')],
      slotIcons: [$('slot-1-icon'), $('slot-2-icon'), $('slot-3-icon'), $('slot-4-icon')],
      objCount: $('obj-count'), stageLabel: $('stage-label'),
      hitmark: $('hitmark'), damage: $('damage-flash'),
      stealthPrompt: $('stealth-prompt'),
      dmgLeft: $('dmg-left'), dmgRight: $('dmg-right'), dmgOmni: $('dmg-omni'),
      detBar: $('det-bar'), detFill: $('det-fill'), detLabel: $('det-label'),
      xpFill: $('xp-fill'), lvlLabel: $('lvl-label'), hudTokens: $('hud-tokens'), hudTokensVal: $('hud-tokens-val'),
      notify: $('notify'),
      endTitle: $('end-title'), endDetail: $('end-detail'),
      cineBars: $('cine-bars'), introKicker: $('intro-kicker'), introLine: $('intro-line'),
      introSkip: $('intro-skip'), sceneFade: $('scene-fade'),
      graphicsTier: $('graphics-tier'),
      bossBar: $('boss-bar'), bossName: $('boss-name'), bossHpFill: $('boss-hp-fill'),
      lore: $('lore'), loreAttempt: $('lore-attempt'), attemptBadge: $('attempt-badge'),
      daily: $('daily'), dailySub: $('daily-sub'), dailyTrack: $('daily-track'),
      dailyStreak: $('daily-streak'), dailyClaim: $('btn-daily-claim'),
      shareBtn: $('btn-share'),
      shareCard: $('sharecard'), shareCanvas: $('sharecard-canvas'),
    };
    this._loreTimers = [];
    this._lastAmmo = null;
    this._lastDetState = null;
  }

  bind(h) {
    $('btn-deploy').onclick = h.deploy;
    $('btn-resume').onclick = h.resume;
    $('btn-restart').onclick = h.restart;
    $('btn-quit').onclick = h.quit;
    $('btn-redeploy').onclick = h.restart;
    $('btn-menu').onclick = h.quit;
    if (h.graphics) $('btn-graphics').onclick = h.graphics;
    if (h.language) $('btn-language').onclick = h.language;
    this._onPickStage = h.pickStage || null;
    if (h.share) $('btn-share').onclick = h.share;
    if (h.shareSend) $('btn-sharecard-send').onclick = h.shareSend;
    if (h.shareClose) $('btn-sharecard-close').onclick = h.shareClose;
    if (h.claimDaily) $('btn-daily-claim').onclick = h.claimDaily;
    if (h.watchAdRevive) $('btn-revive-ad').onclick = h.watchAdRevive;
    if (h.skipRevive) $('btn-revive-skip').onclick = h.skipRevive;
  }

  setGraphicsTier(name) {
    if (this.el.graphicsTier) this.el.graphicsTier.textContent = name;
  }

  // Boss encounter health bar — hidden the rest of the time.
  showBoss(on, name) {
    this.el.bossBar.classList.toggle('hidden', !on);
    if (on && name) this.el.bossName.textContent = name;
  }

  setBossHp(frac) {
    this.el.bossHpFill.style.width = `${Math.max(0, Math.round(frac * 100))}%`;
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
  renderLevelSelect(unlocked, isCleared, bossInterval, showAhead = 4) {
    const grid = $('level-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const frontier = unlocked.length ? unlocked[unlocked.length - 1] : 1;
    const last = frontier + showAhead;
    for (let n = 1; n <= last; n++) {
      const playable = n <= frontier;
      const cleared = isCleared(n);
      const isBoss = bossInterval > 0 && n % bossInterval === 0;
      const cell = document.createElement('button');
      cell.className = 'level-cell';
      if (cleared) cell.classList.add('cleared');
      if (isBoss) cell.classList.add('boss');
      if (n === frontier && !cleared) cell.classList.add('next');
      cell.disabled = !playable;
      cell.textContent = String(n);
      const tag = document.createElement('span');
      tag.className = 'level-tag';
      tag.textContent = !playable ? t('level.locked')
        : isBoss ? t('level.boss')
        : cleared ? t('level.cleared') : '';
      cell.appendChild(tag);
      if (playable && this._onPickStage) {
        cell.onclick = () => this._onPickStage(n);
      }
      grid.appendChild(cell);
    }
  }

  setLanguage() {
    const el = $('language-label');
    if (!el) return;
    const entry = LANGS.find((l) => l.code === getLang());
    el.textContent = entry ? entry.label : getLang().toUpperCase();
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
        + (r.kind === 'diamonds' ? ' diamond' : '')
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
    this.el.hpFill.style.width = `${hpFrac * 100}%`;
    this.el.hpFill.classList.toggle('low', hpFrac < 0.35);
    this.el.stFill.style.width = `${player.stamina}%`;

    const hasArmor = player.maxArmor > 0;
    this.el.armorRow.classList.toggle('hidden', !hasArmor);
    if (hasArmor) this.el.armorFill.style.width = `${(player.armor / player.maxArmor) * 100}%`;

    const cur = player.cur;
    const isGun = cur.wpn.kind === 'gun';
    const magTxt = isGun ? String(cur.mag) : '—';
    const resTxt = isGun ? String(cur.reserve) : '';
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
    this.el.reloadHint.textContent = t(player.reload ? 'hud.reloading' : 'hud.reloadHint');

    const slotOf = { rifle: 0, pistol: 1, knife: 2, smg: 3 };
    this.el.slots.forEach((s, i) => { if (s) s.classList.toggle('active', i === slotOf[player.current]); });

    // persistent low-hp vignette
    if (player.hurtT <= 0) {
      this.el.damage.style.opacity = String((1 - hpFrac) * 0.45);
    }
  }

  setObjective(done, total) {
    this.el.objCount.textContent = `${done} / ${total}`;
  }

  setStage(n) {
    this.el.stageLabel.textContent = t('hud.stage', { n });
  }

  setSlot4Visible(visible) {
    if (this.el.slots[3]) this.el.slots[3].classList.toggle('hidden', !visible);
  }

  // Detection meter: 5-state colour ramp with a distinct pulse on every
  // state change so escalation/de-escalation is always noticed.
  setDetection(state, value) {
    this.el.detFill.style.width = `${Math.round(value * 100)}%`;
    if (state !== this._lastDetState) {
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
    this.el.lvlLabel.textContent = `LVL ${level}`;
    this.el.xpFill.style.width = `${Math.round(xpFrac * 100)}%`;
  }

  setTokens(n) {
    const valEl = this.el.hudTokensVal;
    if (!valEl) return;
    const prev = this._lastTokens;
    this._lastTokens = n;
    if (prev == null || n <= prev) { valEl.textContent = String(n); return; }   // init / spend: snap, no fanfare
    animateCount(valEl, prev, n);
    playCurrencyGain(this.el.hudTokens, 'para', audio);
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
    if (kind === 'kill') el.classList.add('kill');
    else if (kind === 'headshot') el.classList.add('headshot');
    el.classList.add('show');
  }

  damageFlash(hpFrac) {
    this.el.damage.style.opacity = String(0.55 + (1 - hpFrac) * 0.3);
    clearTimeout(this._dmgT);
    this._dmgT = setTimeout(() => {
      this.el.damage.style.opacity = String((1 - hpFrac) * 0.45);
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
