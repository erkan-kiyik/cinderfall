// KOR — combat HUD (DOM): health (and plate), weapon and ammo, reload bar,
// hurt vignette, death banner. Writes to the DOM only when a value changes.
import { t } from './i18n.js';

export class CombatHud {
  constructor(root) {
    this.el = document.createElement('div');
    this.el.className = 'chud';
    this.el.innerHTML = `
      <div class="hp"><div class="v">100</div><div class="bar"><i></i></div><div class="plate"><i></i></div></div>
      <div class="wpn"><div class="n">—</div><div class="a">0<small>/ 0</small></div><div class="r"><i></i></div></div>`;
    this.hurtEl = document.createElement('div'); this.hurtEl.className = 'hurt';
    this.deadEl = document.createElement('div'); this.deadEl.className = 'dead'; this.deadEl.textContent = t('game.down');
    // damage direction: a red glow on the side the shot came from
    this.dirL = document.createElement('div'); this.dirL.className = 'hitdir l';
    this.dirR = document.createElement('div'); this.dirR.className = 'hitdir r';
    root.append(this.hurtEl, this.dirL, this.dirR, this.deadEl, this.el);
    this.side = { l: 0, r: 0 };
    const q = (s) => this.el.querySelector(s);
    this.$ = { hp: q('.hp'), hpV: q('.hp .v'), hpBar: q('.hp .bar i'), plate: q('.hp .plate i'), wpn: q('.wpn'), name: q('.wpn .n'), ammo: q('.wpn .a'), rl: q('.wpn .r i') };
    this.last = {}; this.hurt = 0;
  }

  set(k, v, fn) { if (this.last[k] !== v) { this.last[k] = v; fn(v); } }

  update(dt, ch) {
    const $ = this.$, g = ch.gun;
    const hp = Math.max(0, Math.ceil(ch.hp));
    this.set('hp', hp, (v) => { $.hpV.textContent = v; $.hpBar.style.transform = `scaleX(${v / ch.hpMax})`; $.hp.classList.toggle('low', v < 35); });
    // BULWARK's container plate, a second bar under the health while it lasts
    this.set('plate', Math.ceil(ch.armor || 0), (v) => { $.plate.style.transform = `scaleX(${v / (ch.armorMax || 60)})`; $.hp.classList.toggle('plated', v > 0); });
    if (g) {
      this.set('name', g.s.name, (v) => { $.name.textContent = v; });
      const res = g.reserve === Infinity ? '∞' : g.reserve;
      this.set('ammo', `${g.ammo}|${res}`, () => { $.ammo.innerHTML = `${g.ammo}<small>/ ${res}</small>`; $.wpn.classList.toggle('low', g.ammo <= Math.ceil(g.s.mag * 0.25)); });
      const p = Math.round(g.progress * 100);
      this.set('rl', p, (v) => { $.rl.style.width = v + '%'; });
    }
    this.hurt = Math.max(0, this.hurt - dt * 1.6);
    this.set('hurt', Math.round(this.hurt * 50), (v) => { this.hurtEl.style.opacity = (v / 50).toFixed(2); });
    this.set('dead', !ch.alive, (v) => this.deadEl.classList.toggle('on', v));
    for (const k of ['l', 'r']) {
      this.side[k] = Math.max(0, this.side[k] - dt * 1.4);
      this.set('dir' + k, Math.round(this.side[k] * 40), (v) => { (k === 'l' ? this.dirL : this.dirR).style.opacity = (v / 40).toFixed(2); });
    }
  }

  // side: −1 the shooter is to the left, +1 to the right (0: unknown)
  hit(amount, side = 0) {
    this.hurt = Math.min(1, this.hurt + 0.25 + amount / 60);
    if (side < 0) this.side.l = 1; else if (side > 0) this.side.r = 1;
  }
}
