// CINDERFALL LAB — mission HUD (DOM): objective line with hack progress,
// mission clock, an edge arrow toward an off-screen objective, toasts, and
// the briefing / debrief cards.
import { t } from './i18n.js';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export class MissionHud {
  constructor(root) {
    const el = (cls, html = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; root.appendChild(d); return d; };
    this.obj = el('mobj', '<div class="k"></div><div class="t"></div><div class="p"><i></i></div>');
    this.time = el('mtime');
    this.arrow = el('marrow', '<span></span>');
    this.toastEl = el('toast');
    this.card = el('mcard hide', '<div class="box"></div>');
    this.last = {}; this.toastT = 0;
  }
  set(k, v, fn) { if (this.last[k] !== v) { this.last[k] = v; fn(v); } }

  objective(i, n, text, hack = null) {
    this.set('obj', `${i}|${text}`, () => {
      this.obj.querySelector('.k').textContent = i > n ? t('game.allDone') : t('game.objCount', { i, n });
      this.obj.querySelector('.t').textContent = text;
      this.obj.classList.remove('flash'); void this.obj.offsetWidth; this.obj.classList.add('flash');
    });
    this.set('hack', hack === null ? -1 : Math.round(hack * 100), (v) => {
      this.obj.classList.toggle('hack', v >= 0);
      if (v >= 0) this.obj.querySelector('.p i').style.width = v + '%';
    });
  }
  clock(sec) { this.set('time', Math.floor(sec), () => { this.time.textContent = fmt(sec); }); }

  // screen position (CSS px) of the objective, or null to hide; dist in metres-ish
  pointer(x, y, w, h, dist) {
    if (x === null) { this.set('arrow', 'off', () => { this.arrow.style.display = 'none'; }); return; }
    const m = 34, inside = x > m && x < w - m && y > m + 40 && y < h - m - 60;
    if (inside) { this.set('arrow', 'off', () => { this.arrow.style.display = 'none'; }); return; }
    const cx = w / 2, cy = h / 2, dx = x - cx, dy = y - cy;
    const k = Math.min((w / 2 - m) / Math.max(1e-3, Math.abs(dx)), (h / 2 - m - 40) / Math.max(1e-3, Math.abs(dy)));
    const px = cx + dx * k, py = cy + dy * k, a = Math.atan2(dy, dx);
    const key = `${px | 0},${py | 0},${(a * 20) | 0},${dist}`;
    this.set('arrow', key, () => {
      // the triangle (::before) turns toward the objective, the label stays upright
      this.arrow.style.display = 'block';
      this.arrow.style.transform = `translate(${px}px, ${py}px)`;
      this.arrow.style.setProperty('--a', `${a}rad`);
      this.arrow.querySelector('span').textContent = `${dist} m`;
    });
  }

  toast(text, sec = 1.6) { this.toastEl.textContent = text; this.toastEl.classList.add('on'); this.toastT = sec; }
  update(dt) { if (this.toastT > 0) { this.toastT -= dt; if (this.toastT <= 0) this.toastEl.classList.remove('on'); } }

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
