// Tasks: three a day and three a week, the same for everyone on that day and
// in that week; progress comes from missions and endless runs, the reward is
// claimed here (the week's third brings a crate too: docs §10.41). On the left
// the daily reward card (docs §10.40).
import { h, svg, press, popIn, ui, deny, haptic, toast } from '../kit.js';
import { t, num } from '../i18n.js';
import { shead, refreshCur } from './common.js';
import { TASKS, WEEKLY, ensureDaily, ensureWeekly, claimDaily, claimWeekly, loginCard } from '../../core/economy.js';
import { loginStrip, takeLogin } from '../login.js';

export const daily = {
  mount(ctx, params) {
    ensureDaily(ctx.save); ensureWeekly(ctx.save);
    let tab = params.tab || 'day';
    const list = h('div.tasks');
    const tabs = h('div.seg.task-tabs');
    let rows = [];
    function render() {
      const d = ctx.save.d, week = tab === 'week', src = week ? d.weekly.tasks : d.daily.tasks, T0 = week ? WEEKLY : TASKS;
      // a dot on a tab with something to claim
      const ready = (arr, T) => arr.some((k) => !k.claimed && k.n >= T[k.id].goal);
      tabs.replaceChildren(...[['day', 'daily.today', ready(d.daily.tasks, TASKS)], ['week', 'daily.week', ready(d.weekly.tasks, WEEKLY)]].map(([k, key, dot]) => press(h(`button${tab === k ? '.on' : ''}`, {
        type: 'button', onclick: () => { if (tab !== k) { tab = k; ui('tab'); render(); popIn(rows, { step: 40 }); } },
      }, t(key), dot ? h('i.ping') : null), { buzz: 'tick', sound: null })));
      rows = src.map((k, i) => {
        const T = T0[k.id], full = k.n >= T.goal;
        const btn = press(h(`button.btn.${full && !k.claimed ? 'primary' : 'secondary'}.cut`, {
          type: 'button', 'aria-disabled': full && !k.claimed ? 'false' : 'true',
          onclick: (e) => {
            if (week) {
              const got = claimWeekly(ctx.save, i);
              if (!got) return deny(e.currentTarget);
              if (got.crate) toast(t('login.stock', { c: t(`crate.${got.crate}`) }), { kind: 'reward', ms: 2400 });
            } else if (!claimDaily(ctx.save, i)) return deny(e.currentTarget);
            ui('reward'); haptic('success'); refreshCur(); render();
          },
        }, k.claimed ? [svg('check'), t('daily.claimed')] : [svg('coin'), num(T.reward)]), { sound: null, buzz: 'soft' });
        return h(`div.task.card.cut${k.claimed ? '.done' : ''}`,
          h('div.grow', h('b', t(`daily.${k.id}`, { n: T.goal })), h('div.meter.ember', h('i', { style: { width: `${Math.round((k.n / T.goal) * 100)}%` } })), h('span.eyebrow', `${num(k.n)} / ${num(T.goal)}`)),
          btn);
      });
      list.replaceChildren(...rows, h('p.rules', t(week ? 'daily.rulesWeek' : 'daily.rules', { c: t('crate.plus') })));
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
      h('div.daily-body.veil', card, h('div.daily-tasks', tabs, list)));
    return { el, show() { ctx.showcase.frame(0.3, 150); popIn([card, ...rows], { step: 60 }); } };
  },
};
