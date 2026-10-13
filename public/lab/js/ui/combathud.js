// CINDERFALL LAB — combat HUD (DOM): health, weapon and ammo, reload bar,
// hurt vignette, death banner. Writes to the DOM only when a value changes.

export class CombatHud {
  constructor(root) {
    this.el = document.createElement('div');
    this.el.className = 'chud';
    this.el.innerHTML = `
      <div class="hp"><div class="v">100</div><div class="bar"><i></i></div></div>
      <div class="wpn"><div class="n">—</div><div class="a">0<small>/ 0</small></div><div class="r"><i></i></div></div>`;
    this.hurtEl = document.createElement('div'); this.hurtEl.className = 'hurt';
    this.deadEl = document.createElement('div'); this.deadEl.className = 'dead'; this.deadEl.textContent = 'ETKİSİZ HALE GETİRİLDİN';
    root.append(this.hurtEl, this.deadEl, this.el);
    const q = (s) => this.el.querySelector(s);
    this.$ = { hp: q('.hp'), hpV: q('.hp .v'), hpBar: q('.hp .bar i'), wpn: q('.wpn'), name: q('.wpn .n'), ammo: q('.wpn .a'), rl: q('.wpn .r i') };
    this.last = {}; this.hurt = 0;
  }

  set(k, v, fn) { if (this.last[k] !== v) { this.last[k] = v; fn(v); } }

  update(dt, ch) {
    const $ = this.$, g = ch.gun;
    const hp = Math.max(0, Math.ceil(ch.hp));
    this.set('hp', hp, (v) => { $.hpV.textContent = v; $.hpBar.style.transform = `scaleX(${v / ch.hpMax})`; $.hp.classList.toggle('low', v < 35); });
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
  }

  hit(amount) { this.hurt = Math.min(1, this.hurt + 0.25 + amount / 60); }
}
