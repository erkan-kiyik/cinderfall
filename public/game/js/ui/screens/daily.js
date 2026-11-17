// Today's tasks: three a day, the same for everyone on that day; progress
// comes from missions and endless runs, the reward is claimed here.
import { h, svg, press, popIn, ui, deny, haptic } from '../kit.js';
import { t, num } from '../i18n.js';
import { shead, refreshCur } from './common.js';
import { TASKS, ensureDaily, claimDaily, loginCard } from '../../core/economy.js';
import { loginStrip, takeLogin } from '../login.js';

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
    // the daily reward card on the left, the work orders on the right (docs §10.40)
    const strip = loginStrip(ctx.save), foot = h('div.lfoot');
    const kick = h('div.eyebrow.accent');
    const card = h('div.lcard.paper', h('div.lhead', h('div', kick, h('h2.h3', t('login.title'))), foot), strip.el, h('p.lrules', t('login.rules', { c: t('crate.crow') })));
    function renderCard() {
      const st = loginCard(ctx.save.d);
      kick.textContent = t('login.kicker', { n: st.week });
      if (st.ready) {
        const btn = press(h('button.btn.primary.cut', { type: 'button', onclick: () => { if (takeLogin(ctx.save, strip, btn)) renderCard(); } },
          svg('gift'), t('login.claim')), { sound: null, buzz: 'soft' });
        foot.replaceChildren(btn);
      } else foot.replaceChildren(h('span.eyebrow', svg('clock'), t('login.tomorrow')));
    }
    renderCard();
    const el = h('div', shead(ctx, t('mode.daily'), t('daily.kicker')),
      h('div.daily-body.veil', card, h('div.daily-tasks', list, h('p.rules', t('daily.rules')))));
    return { el, show() { ctx.showcase.frame(0.3, 150); popIn([card, ...rows], { step: 60 }); } };
  },
};
