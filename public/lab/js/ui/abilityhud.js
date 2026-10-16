// KOR LAB — ability buttons in a mission: two skills and the ultimate, in an
// arc over the right-hand touch cluster. A dark sweep shows the cooldown, the
// ultimate fills a ring as it charges and pulses when ready. On a keyboard
// the keys are E, G and X (the buttons also take clicks).
import { svg, haptic } from './kit.js';
import { t } from './i18n.js';
import { OPS } from './data.js';

const SLOTS = ['ab1', 'ab2', 'ult'];
const KEYS = ['E', 'G', 'X'];

export class AbilityHud {
  constructor(root, ab, ctl) {
    this.ab = ab; this.ctl = ctl;
    const op = OPS.find((o) => o.id === ab.op) || OPS[0];
    this.el = document.createElement('div');
    this.el.className = 'abhud';
    this.el.style.setProperty('--ab', ab.color);
    const coarse = matchMedia('(pointer: coarse)').matches || new URLSearchParams(location.search).has('touch');
    this.btns = SLOTS.map((slot, i) => {
      const b = document.createElement('button');
      b.className = `abtn ${slot}`;
      b.setAttribute('aria-label', t(`ab.${op.id}.${op.abil[i][0]}`));
      b.append(svg(op.abil[i][1]));
      const cd = document.createElement('i'); cd.className = 'cd';
      const n = document.createElement('b'); n.className = 'n';
      b.append(cd, n);
      if (!coarse) { const k = document.createElement('kbd'); k.textContent = KEYS[i]; b.append(k); }
      b.addEventListener('pointerdown', (e) => {
        e.stopPropagation(); e.preventDefault();
        this.ctl[slot === 'ult' ? 'ultPressed' : slot + 'Pressed'] = true;
        b.classList.add('on'); haptic('tap');
      });
      const up = () => b.classList.remove('on');
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
      this.el.append(b);
      return { b, cd, n, last: '' };
    });
    root.appendChild(this.el);
  }

  // cheap: only touches the DOM when what is shown changes
  update() {
    const st = this.ab.hud();
    st.forEach((s, i) => {
      const B = this.btns[i];
      const p = Math.round(Math.max(0, Math.min(1, s.p)) * 40) / 40;
      const key = `${p}|${s.ready}|${s.active}|${s.left || ''}`;
      if (key === B.last) return;
      if (s.ready && B.last && !B.last.includes('|true|')) B.b.animate([{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'cubic-bezier(.3,1.6,.5,1)' });
      B.last = key;
      B.cd.style.setProperty('--p', `${p * 360}deg`);
      B.b.classList.toggle('ready', s.ready);
      B.b.classList.toggle('active', !!s.active);
      B.n.textContent = i < 2 && !s.ready ? s.left : i === 2 && !s.ready && !s.active ? `${Math.floor(s.p * 100)}` : '';
    });
  }
  remove() { this.el.remove(); }
}
