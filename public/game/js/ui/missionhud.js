// KOR — mission HUD (DOM): objective line with hack progress and, when the
// objective is off screen, which way it is and how far (in the line itself, so
// it never lands on a button: docs §10.41), the mission clock, toasts, and the
// briefing / debrief cards.
import { t } from './i18n.js';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export class MissionHud {
  constructor(root) {
    const el = (cls, html = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; root.appendChild(d); return d; };
    this.obj = el('mobj', '<div class="k"></div><div class="t"></div><div class="dir"><b></b><span></span></div><div class="p"><i></i></div>');
    this.dir = this.obj.querySelector('.dir');
    this.time = el('mtime');
    this.toastEl = el('toast');
    this.card = el('mcard hide', '<div class="box"></div>');
    this.last = {}; this.toastT = 0; this.objT = 0;
  }
  set(k, v, fn) { if (this.last[k] !== v) { this.last[k] = v; fn(v); } }

  // kick: replaces the "objective i/n" line (endless: the wave)
  objective(i, n, text, hack = null, kick = null) {
    this.set('obj', `${i}|${text}|${kick}`, () => {
      this.obj.querySelector('.k').textContent = kick || (i > n ? t('game.allDone') : t('game.objCount', { i, n }));
      this.obj.querySelector('.t').textContent = text;
      this.obj.classList.remove('flash', 'mini'); void this.obj.offsetWidth; this.obj.classList.add('flash');
      this.objT = 4; // full size for a few seconds, then it settles (docs §10.21)
    });
    this.set('hack', hack === null ? -1 : Math.round(hack * 100), (v) => {
      this.obj.classList.toggle('hack', v >= 0);
      if (v >= 0) this.obj.querySelector('.p i').style.width = v + '%';
    });
  }
  // the boss's name and health bar under the objective (null hides it)
  boss(name, k) {
    if (!this.bossEl && name) {
      this.bossEl = document.createElement('div'); this.bossEl.className = 'mboss';
      this.bossEl.innerHTML = '<b></b><div class="bar"><i></i><s></s></div>';
      this.obj.parentNode.appendChild(this.bossEl);
    }
    if (!this.bossEl) return;
    this.set('bossN', name, (v) => { this.bossEl.classList.toggle('on', !!v); if (v) this.bossEl.querySelector('b').textContent = v; });
    this.set('bossK', Math.round(k * 200), (v) => {
      const p = `${v / 2}%`, bar = this.bossEl.querySelector('.bar');
      bar.querySelector('i').style.width = p;
      // the trailing chunk catches up a moment later
      setTimeout(() => { bar.querySelector('s').style.width = p; }, 260);
    });
  }
  clock(sec) { this.set('time', Math.floor(sec), () => { this.time.textContent = fmt(sec); }); }

  // screen position (CSS px) of the objective, or null to hide; dist in metres-ish.
  // On screen the diamond over it is enough; off screen the line says which way.
  pointer(x, y, w, h, dist) {
    const m = 30, inside = x !== null && x > m && x < w - m && y > m + 30 && y < h - m;
    if (x === null || inside) { this.set('dir', 'off', () => { this.dir.classList.remove('on'); }); return; }
    const dx = x - w / 2, dy = y - h / 2;
    const way = Math.abs(dx) * (h / w) >= Math.abs(dy) ? (dx > 0 ? '▸' : '◂') : (dy > 0 ? '▾' : '▴');
    this.set('dir', `${way}${dist}`, () => {
      this.dir.classList.add('on');
      this.dir.classList.toggle('left', way === '◂');
      this.dir.querySelector('b').textContent = way;
      this.dir.querySelector('span').textContent = `${dist} m`;
    });
  }

  toast(text, sec = 1.6) { this.toastEl.textContent = text; this.toastEl.classList.add('on'); this.toastT = sec; }
  update(dt) {
    if (this.toastT > 0) { this.toastT -= dt; if (this.toastT <= 0) this.toastEl.classList.remove('on'); }
    if (this.objT > 0) { this.objT -= dt; if (this.objT <= 0) this.obj.classList.add('mini'); }
  }

  // full-screen card; buttons: [{ label, ghost, fn }]
  show(html, buttons) {
    const box = this.card.querySelector('.box');
    box.innerHTML = html;
    const row = document.createElement('div');
    for (const b of buttons) {
      const e = document.createElement('button'); e.textContent = b.label; if (b.ghost) e.className = 'ghost';
      e.addEventListener('pointerdown', (ev) => ev.stopPropagation());
      e.addEventListener('click', (ev) => { ev.stopPropagation(); b.fn(); });
      row.appendChild(e);
    }
    box.appendChild(row);
    this.card.classList.remove('hide');
  }
  hide() { this.card.classList.add('hide'); }
  get open() { return !this.card.classList.contains('hide'); }
}

export { fmt };
