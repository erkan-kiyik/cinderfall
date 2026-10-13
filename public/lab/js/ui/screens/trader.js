// CROW's stall: four daily goods and one weekly special. CROW and the
// economy come with M7; the stall shows its shape and the refresh clock.
import { h, svg, popIn } from '../kit.js';
import { t } from '../i18n.js';
import { hubbar, soon } from './common.js';

export const trader = {
  mount(ctx) {
    const left = h('div.card.cut', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
      h('div.eyebrow.accent', h('span.dot'), t('trader.k')),
      h('div.h1', 'CROW'),
      h('p.body', { style: { margin: 0, fontSize: '12px' } }, t('trader.bio')),
      h('div.empty.cut', { style: { flex: 1 } }, svg('shop'), h('b', t('trader.closed')), h('span', t('trader.closedHint'))));
    const timer = h('div.h3.num', '—');
    const slots = [0, 1, 2, 3].map((i) => h('div.tile.cut.locked', { style: { '--rar': ['var(--r-rare)', 'var(--r-epic)', 'var(--r-common)', 'var(--r-legendary)'][i] } },
      h('span.lockbadge', svg('lock')), h('div.eyebrow', t('trader.daily')), h('div', { style: { flex: 1, display: 'grid', placeItems: 'center', color: 'var(--n5)' } }, svg('crate')), h('b.h3', '???')));
    const special = h('div.tile.cut.locked', { style: { gridColumn: 'span 2', '--rar': 'var(--r-mythic)' } },
      h('span.lockbadge', svg('lock')), h('div.eyebrow.accent', t('trader.weekly')), h('b.h2', '???'));
    const tick = () => { const n = new Date(), e = new Date(n); e.setHours(24, 0, 0, 0); const s = Math.floor((e - n) / 1000); timer.textContent = `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
    tick(); const iv = setInterval(tick, 1000);
    const right = h('section', { style: { display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 } },
      h('div.wide-row', { style: { minHeight: '30px' } }, h('div.eyebrow', t('trader.goods'), soon()), h('div.tag', h('div.eyebrow', t('trader.refresh')), timer)),
      h('div.shelf', slots, special));
    const el = h('div', hubbar(ctx, 'trader'), h('div.trader-body.veil', left, right));
    return { el, show() { ctx.showcase.frame(0.5, 170); popIn([...slots, special]); }, dispose() { clearInterval(iv); } };
  },
};
