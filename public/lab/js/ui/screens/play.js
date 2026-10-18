// Play: pick a mode — the campaign, today's tasks, or the endless waves.
import { h, svg, press, popIn, ui, deny } from '../kit.js';
import { t } from '../i18n.js';
import { shead } from './common.js';

export const play = {
  mount(ctx) {
    const mode = (id, icon, open, onclick) => press(h(`button.mode.cut${open ? '' : '.locked'}`, {
      type: 'button', 'aria-disabled': open ? 'false' : 'true',
      onclick: (e) => { if (open) { ui('confirm'); onclick(); } else deny(e.currentTarget); },
    },
    h('div.art', { style: { background: open ? 'linear-gradient(160deg, rgba(226,105,47,0.24), rgba(226,105,47,0) 60%)' : 'none' } }),
    svg(icon, 'ic big-ic'),
    !open && h('span.lockbadge', svg('lock'), t('ui.soon')),
    h('div.eyebrow.accent', t(`mode.${id}.kicker`)),
    h('div.h1', t(`mode.${id}`)),
    h('p', t(`mode.${id}.desc`))), { scale: 0.97, sound: null, buzz: open ? 'soft' : null });
    const cards = [
      mode('campaign', 'map', true, () => ctx.router.go('campaign')),
      mode('daily', 'daily', true, () => ctx.router.go('daily')),
      mode('endless', 'infinite', true, () => ctx.router.go('prep', { mission: 'endless' })),
    ];
    const el = h('div', shead(ctx, t('play.title'), t('play.kicker')), h('div.modes-body', cards));
    return { el, show() { ctx.showcase.frame(0.5, 140); popIn(cards); } };
  },
};
