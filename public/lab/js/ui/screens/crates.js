// Crates: the three crate types with their odds in plain view, the pity
// rule, and the price; opening arrives with the skins (M7).
import { h, svg, press, popIn, deny } from '../kit.js';
import { t, num } from '../i18n.js';
import { hubbar } from './common.js';
import { CRATES } from '../data.js';

export const crates = {
  mount(ctx) {
    const cards = CRATES.map((c) => h('div.tile.crate.cut', { style: { '--c': c.color } },
      h('div.eyebrow.accent', t(`crate.${c.id}.k`)),
      h('div.h2', t(`crate.${c.id}`)),
      h('div.art', svg('crate')),
      h('div.odds', c.odds.map(([r, p]) => [h('span', t(`rar.${r}`)), h('b', { style: { '--rar': `var(--r-${r})` } }, `%${p}`)])),
      press(h('button.btn.secondary.cut', { type: 'button', 'aria-disabled': 'true', onclick: (e) => deny(e.currentTarget) }, svg('coin'), num(c.price), h('span.soon', t('ui.soon'))), { sound: null, buzz: null })));
    const el = h('div', hubbar(ctx, 'crates'),
      h('div.three.veil', cards),
      h('p.rules.veil', t('crate.rules')));
    return { el, show() { ctx.showcase.frame(0.5, 170); popIn(cards); } };
  },
};
