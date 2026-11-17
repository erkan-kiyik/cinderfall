// The daily reward (docs §10.40): a roll-call card of seven boxes, a red
// stamp on every box taken. The lobby offers it once a day; the tasks
// screen keeps it for later. The rules are in core/economy.js (LOGIN).
import { h, svg, press, ui, haptic, toast, modal, reduced, deny } from './kit.js';
import { t, num } from './i18n.js';
import { refreshCur } from './screens/common.js';
import { LOGIN, loginCard, claimLogin, loginReady } from '../core/economy.js';
import { crateArt } from './portraits.js';
import { CRATES } from './data.js';

const COLOR = Object.fromEntries(CRATES.map((c) => [c.id, c.color]));

function box(r, i, st) {
  const state = i < st.stamped ? 'taken' : i === st.today && st.ready ? 'today' : 'later';
  const last = i === LOGIN.length - 1;
  return h(`div.lbox.${state}${last ? '.d7' : ''}`,
    h('div.d', t('login.day', { n: i + 1 })),
    h('div.art', r.crate ? crateArt(COLOR[r.crate], last ? 50 : 38) : svg('coin')),
    r.crate ? h('div.nm', t(`crate.${r.crate}`)) : null,
    r.parca ? h('b', r.crate ? '+' : '', num(r.parca)) : null,
    h('i.stamp', { 'aria-hidden': 'true' }, t('daily.claimed')));
}

// the seven boxes; render() again after a box is taken
export function loginStrip(save) {
  const el = h('div.lrow');
  const render = () => { const st = loginCard(save.d); el.replaceChildren(...LOGIN.map((r, i) => box(r, i, st))); return st; };
  render();
  return { el, render };
}

// take today's box: the stamp comes down on it, the PARÇA counter ticks over,
// a crate says where it went. Returns what was given, or null.
export function takeLogin(save, strip, btn) {
  const got = claimLogin(save);
  if (!got) { if (btn) deny(btn); return null; }
  strip.render();
  ui('reward'); haptic('success'); refreshCur();
  const b = strip.el.children[got.i], stamp = b && b.querySelector('.stamp');
  if (stamp && !reduced() && stamp.animate) {
    stamp.animate([{ opacity: 0, transform: 'translate(-50%, -50%) rotate(-14deg) scale(2.4)' }, { opacity: 0.9, transform: 'translate(-50%, -50%) rotate(-14deg) scale(1)' }], { duration: 240, easing: 'cubic-bezier(.5,0,.9,.5)' });
    b.animate([{ transform: 'none' }, { transform: 'translateY(2px) scale(0.97)' }, { transform: 'none' }], { duration: 180, delay: 220 });
  }
  if (got.crate) toast(t('login.stock', { c: t(`crate.${got.crate}`) }), { kind: 'reward', ms: 2400 });
  return got;
}

// the lobby's offer: once per run of the game, and only while today's box waits
let offered = false;
export function offerLogin(save, { onTaken } = {}) {
  if (offered || !loginReady(save.d)) return false;
  offered = true;
  const strip = loginStrip(save), st = loginCard(save.d);
  let taken = false;
  const btn = press(h('button.btn.primary.cut', { type: 'button', onclick: () => {
    if (taken) return close();
    if (!takeLogin(save, strip, btn)) return;
    taken = true; onTaken?.();
    btn.replaceChildren(svg('check'), t('ui.ok'));
  } }, svg('gift'), t('login.claim')), { sound: null, buzz: 'soft' });
  const close = modal({
    cls: 'wide', kicker: t('login.kicker', { n: st.week }), title: t('login.title'),
    body: h('div.lcard', strip.el, h('p.lrules', t('login.rules', { c: t('crate.crow') })), h('div.m-actions', btn)),
  });
  return true;
}
