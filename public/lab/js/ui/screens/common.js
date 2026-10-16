// Shared pieces of the menu screens: the hub bar (profile, sections,
// currency, settings) and the sub-screen head (back, title, actions).
import { h, svg, press, ui } from '../kit.js';
import { t, num } from '../i18n.js';
import { avatar } from '../portraits.js';
import { xpFor } from '../../core/save.js';

export const SECTIONS = [
  ['lobby', 'nav.lobby', 'play'],
  ['operators', 'nav.operators', 'ops'],
  ['arsenal', 'nav.arsenal', 'gun'],
  ['crates', 'nav.crates', 'crate'],
  ['trader', 'nav.trader', 'shop'],
];

export function hubbar(ctx, active) {
  const d = ctx.save.d, p = d.profile;
  const me = press(h('button.me.cut', { type: 'button', 'aria-label': t('nav.profile'), onclick: () => ctx.router.go('profile') },
    h('span.av.cut', avatar(d.roster.op, 30)),
    h('div', h('div.nm', p.name, h('span.lv', t('hub.level', { n: p.level }))), h('div.xp', h('i', { style: { width: `${Math.round((p.xp / xpFor(p.level)) * 100)}%` } })))));
  const nav = h('nav.nav', SECTIONS.map(([id, key, icon]) => press(h(`button.tab${id === active ? '.on' : ''}`, {
    type: 'button', 'aria-label': t(key),
    onclick: () => { if (id !== active) { ui('tab'); ctx.router.go(id, {}, { root: true }); } },
  }, svg(icon), h('span.lbl', t(key))), { scale: 0.96, sound: null, buzz: 'tick' })));
  const cur = h('div.cur.cut', { title: t('hub.parca') }, svg('coin'), h('span.num', num(p.parca)));
  const gear = press(h('button.btn.icon.secondary.cut', { type: 'button', 'aria-label': t('nav.settings'), onclick: () => ctx.router.go('settings') }, svg('gear')));
  const bar = h('header.hubbar', me, nav, cur, gear);
  // where the labels do not fit, the other sections show their icon only
  const fitNav = () => {
    bar.classList.remove('compact', 'tight');
    if (nav.scrollWidth > nav.clientWidth + 1) bar.classList.add('compact');
    if (nav.scrollWidth > nav.clientWidth + 1) bar.classList.add('tight');
  };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fitNav).observe(bar);
  return bar;
}

export function shead(ctx, title, kicker, ...right) {
  const back = press(h('button.btn.icon.secondary.cut', { type: 'button', 'aria-label': t('ui.back'), onclick: () => { ui('back'); ctx.router.back(); } }, svg('back')), { sound: null });
  return h('header.shead', back, h('div.ttl', kicker && h('div.eyebrow.accent', kicker), h('h1.h2', title)), h('div.right', right));
}

// a small labelled stat bar
export function statBar(label, value, pct, cls = '') {
  return h('div.stat', h('div.eyebrow', h('span', label), h('b', value)), h(`div.meter${cls}`, h('i', { style: { width: `${Math.max(2, Math.min(100, pct))}%` } })));
}

export function stars(arr, size) {
  return h('span.stars', arr.map((on) => { const s = svg('star'); if (on) s.classList.add('on'); if (size) s.style.width = s.style.height = size + 'px'; return s; }));
}

export const soon = () => h('span.soon', t('ui.soon'));

// the PARÇA counter in the hub bar, after a purchase or a reward
export function refreshCur() {
  const el = document.querySelector('.hubbar .cur .num');
  const ctxSave = refreshCur.save;
  if (el && ctxSave) { el.textContent = num(ctxSave.d.profile.parca); el.animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(.3,1.6,.5,1)' }); }
}
