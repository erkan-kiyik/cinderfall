// DOM HUD: crisp vector text at any DPI. Owns overlay visibility, bars,
// ammo readout, hitmarkers, damage vignette, the detection meter, XP/level,
// directional damage indicators, elimination toasts and the menu/pause/end
// screens.

import { drawSprite } from '../art/paint.js';

const $ = (id) => document.getElementById(id);

const DET_LABEL = {
  hidden: 'HIDDEN', suspicious: 'SUSPICIOUS', searching: 'SEARCHING',
  detected: 'DETECTED', combat: 'COMBAT',
};

export class Hud {
  constructor() {
    this.el = {
      hud: $('hud'), loading: $('loading'), menu: $('menu'),
      pause: $('pause'), end: $('end'),
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
      xpFill: $('xp-fill'), lvlLabel: $('lvl-label'), hudTokens: $('hud-tokens'),
      notify: $('notify'),
      endTitle: $('end-title'), endDetail: $('end-detail'),
      cineBars: $('cine-bars'), introKicker: $('intro-kicker'), introLine: $('intro-line'),
      introSkip: $('intro-skip'), sceneFade: $('scene-fade'),
      graphicsTier: $('graphics-tier'),
    };
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
  }

  setGraphicsTier(name) {
    if (this.el.graphicsTier) this.el.graphicsTier.textContent = name;
  }

  setLoad(p, label) {
    this.el.loadFill.style.width = `${Math.round(p * 100)}%`;
    if (label) this.el.loadLabel.textContent = label;
  }

  // 'loading' | 'menu' | 'play' | 'pause' | 'end'
  show(state) {
    this.el.loading.classList.toggle('hidden', state !== 'loading');
    this.el.menu.classList.toggle('hidden', state !== 'menu');
    this.el.pause.classList.toggle('hidden', state !== 'pause');
    this.el.end.classList.toggle('hidden', state !== 'end');
    this.el.hud.classList.toggle('hidden', !(state === 'play' || state === 'pause'));
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
    this.el.reloadHint.textContent = player.reload ? 'RELOADING' : 'PRESS R — RELOAD';

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
    this.el.stageLabel.textContent = `STAGE ${n}`;
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
      this.el.detLabel.textContent = DET_LABEL[state] || 'HIDDEN';
      // prefixed so the state name never collides with the generic .hidden
      // utility class (the "no threat" state is literally named 'hidden')
      this.el.detBar.className = `det-bar det-${state}`;
      this.el.detBar.classList.remove('pulse');
      void this.el.detBar.offsetWidth;
      this.el.detBar.classList.add('pulse');
    }
  }

  setProgress(level, xpFrac) {
    this.el.lvlLabel.textContent = `LVL ${level}`;
    this.el.xpFill.style.width = `${Math.round(xpFrac * 100)}%`;
  }

  setTokens(n) {
    if (this.el.hudTokens) this.el.hudTokens.textContent = `◈ ${n}`;
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
  end(stats) {
    this.el.endTitle.textContent = 'K.I.A.';
    this.el.endTitle.style.color = 'var(--red)';
    this.el.endDetail.innerHTML = stats;
  }
}
