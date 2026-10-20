// HUD editor: drag the touch buttons where your thumbs want them, pick one
// and resize it, reset to the default layout. Positions are measured from the
// bottom-right corner in real screen pixels (the touch layer is not zoomed),
// so this editor draws in its own unzoomed overlay.
import { h, svg, press, ui, haptic, toast } from '../kit.js';
import { t } from '../i18n.js';

export const HUD_DEFAULT = {
  jump: { r: 20, b: 22, s: 74 },
  crouch: { r: 108, b: 14, s: 62 },
  reload: { r: 26, b: 108, s: 60 },
  knife: { r: 100, b: 90, s: 56 },
  swap: { r: 30, b: 182, s: 52 },
};
export const HUD_KEYS = { jump: 'hud.jump', crouch: 'hud.crouch', reload: 'hud.reload', knife: 'hud.knife', swap: 'hud.swap' };

export function hudLayout(save) {
  const L = save.d.hud.layout || {};
  const out = {};
  for (const k of Object.keys(HUD_DEFAULT)) out[k] = { ...HUD_DEFAULT[k], ...(L[k] || {}) };
  return out;
}

export const hudedit = {
  mount(ctx) {
    let lay = hudLayout(ctx.save), sel = 'jump';
    const overlay = h('div.hudedit', { style: { position: 'fixed', inset: 0, zIndex: 6 } });
    const size = h('input.range', { type: 'range', min: 44, max: 110, step: 1, value: lay[sel].s, 'aria-label': t('hud.size') });
    const selName = h('b.h3', t(HUD_KEYS[sel]));
    const persist = () => ctx.save.set((s) => { s.hud.layout = lay; });
    const btns = {};
    const place = (k) => {
      const b = btns[k], L = lay[k];
      Object.assign(b.style, { right: `${L.r}px`, bottom: `${L.b}px`, width: `${L.s}px`, height: `${L.s}px` });
      b.classList.toggle('on', k === sel);
    };
    const paintSize = () => size.style.setProperty('--p', `${((size.value - 44) / 66) * 100}%`);
    for (const k of Object.keys(lay)) {
      const b = h('div.ghostbtn', { role: 'button', 'aria-label': t(HUD_KEYS[k]) }, t(HUD_KEYS[k]));
      btns[k] = b;
      let drag = null;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault(); b.setPointerCapture(e.pointerId);
        sel = k; selName.textContent = t(HUD_KEYS[k]); size.value = lay[k].s; paintSize();
        for (const kk of Object.keys(btns)) place(kk);
        drag = { x: e.clientX, y: e.clientY, r: lay[k].r, b: lay[k].b };
        haptic('tick'); ui('tab');
      });
      b.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const L = lay[k], W = innerWidth, H = innerHeight;
        L.r = Math.round(Math.max(4, Math.min(W - L.s - 4, drag.r - (e.clientX - drag.x))));
        L.b = Math.round(Math.max(4, Math.min(H - L.s - bar.getBoundingClientRect().bottom - 6, drag.b - (e.clientY - drag.y))));
        place(k);
      });
      const end = () => { if (drag) { drag = null; persist(); } };
      b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end);
      overlay.appendChild(b);
      place(k);
    }
    size.addEventListener('input', () => { lay[sel].s = +size.value; paintSize(); place(sel); });
    size.addEventListener('change', persist);
    paintSize();
    const bar = h('div.hbar.cut',
      press(h('button.btn.icon.secondary.cut', { type: 'button', 'aria-label': t('ui.back'), onclick: () => { ui('back'); ctx.router.back(); } }, svg('back')), { sound: null }),
      h('div.ttl', h('div.eyebrow.accent', t('hud.title')), selName),
      h('label.sz', h('span.eyebrow', t('hud.size')), size),
      press(h('button.btn.sm.ghost.cut', { type: 'button', onclick: () => { lay = JSON.parse(JSON.stringify(HUD_DEFAULT)); for (const k of Object.keys(btns)) place(k); persist(); toast(t('hud.resetDone')); } }, svg('reset'), t('hud.reset'))));
    // the buttons are in real pixels (thumbs do not scale); the toolbar and labels follow the menu zoom
    overlay.append(h('div.zone', { style: { left: 0 } }, t('hud.moveZone')), h('div.zone', { style: { right: 0 } }, t('hud.aimZone')), h('div.htop', bar));
    const el = h('div');
    return {
      el,
      show() { ctx.showcase.frame(0.35, 192); document.body.appendChild(overlay); },
      hide() { overlay.remove(); },
      dispose() { overlay.remove(); },
    };
  },
};
