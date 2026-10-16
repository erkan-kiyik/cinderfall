// Today's tasks: three a day, the same for everyone on that day; progress
// comes from missions and endless runs, the reward is claimed here.
import { h, svg, press, popIn, ui, deny, haptic } from '../kit.js';
import { t, num } from '../i18n.js';
import { shead, refreshCur } from './common.js';
import { TASKS, ensureDaily, claimDaily } from '../../core/economy.js';

export const daily = {
  mount(ctx) {
    ensureDaily(ctx.save);
    const list = h('div.tasks');
    let rows = [];
    function render() {
      const d = ctx.save.d;
      rows = d.daily.tasks.map((k, i) => {
        const T = TASKS[k.id], full = k.n >= T.goal;
        const btn = press(h(`button.btn.${full && !k.claimed ? 'primary' : 'secondary'}.cut`, {
          type: 'button', 'aria-disabled': full && !k.claimed ? 'false' : 'true',
          onclick: (e) => {
            const pay = claimDaily(ctx.save, i);
            if (!pay) return deny(e.currentTarget);
            ui('reward'); haptic('success'); refreshCur(); render();
          },
        }, k.claimed ? [svg('check'), t('daily.claimed')] : [svg('coin'), num(T.reward)]), { sound: null, buzz: 'soft' });
        return h(`div.task.card.cut${k.claimed ? '.done' : ''}`,
          h('div.grow', h('b', t(`daily.${k.id}`, { n: T.goal })), h('div.meter.ember', h('i', { style: { width: `${Math.round((k.n / T.goal) * 100)}%` } })), h('span.eyebrow', `${num(k.n)} / ${num(T.goal)}`)),
          btn);
      });
      list.replaceChildren(...rows);
    }
    render();
    const el = h('div', shead(ctx, t('mode.daily'), t('daily.kicker')), h('div.daily-body.veil', list, h('p.rules', t('daily.rules'))));
    return { el, show() { ctx.showcase.frame(0.3, 150); popIn(rows, { step: 60 }); } };
  },
};
