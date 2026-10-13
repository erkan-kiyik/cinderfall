// After a mission: the result, stars, the numbers, and what it earned
// (experience and PARÇA counted up, level-ups), then on.
import { h, svg, press, popIn, ui, countUp, haptic } from '../kit.js';
import { t, num, clock } from '../i18n.js';
import { stars } from './common.js';
import { xpFor } from '../../core/save.js';

export const result = {
  mount(ctx, params) {
    const r = params.r, g = params.gain, d = ctx.save.d;
    const acc = r.shots ? Math.round((r.hits / r.shots) * 100) : 0;
    const xpNum = h('b.num', '0'), coinNum = h('b.num', '0');
    const lvl = h('div.eyebrow.accent', t('hub.level', { n: d.profile.level }));
    const xpBar = h('div.meter.ember', h('i', { style: { width: `${Math.round((d.profile.xp / xpFor(d.profile.level)) * 100)}%` } }));
    const tiles = [
      [clock(r.time), t('res.time')], [r.kills, t('prof.kills')], [`%${acc}`, t('prof.acc')], [r.heads, t('prof.heads')], [r.deaths, t('prof.deaths')],
    ].map(([v, k]) => h('div.tile.cut', h('b', String(v)), h('span.eyebrow', k)));
    const cont = press(h('button.btn.primary.cut', { type: 'button', onclick: () => { ui('confirm'); ctx.router.go('campaign', { sel: r.id }, { root: false, replace: true }); } }, t('res.continue'), svg('arrow')), { sound: null });
    const again = press(h('button.btn.ghost.cut', { type: 'button', onclick: () => { ui('confirm'); ctx.startMission(r.id, { diff: r.diff }); } }, svg('reset'), t('res.again')), { sound: null });
    const box = h('div.card.cut.result',
      h('div.wide-row', { style: { minHeight: 0 } },
        h('div', h('div.eyebrow.accent', r.done ? t('res.done') : t('res.left'), ' · ', t(`diff.${r.diff}`)), h('div.h1', t(`mission.${r.id}`))),
        h('div.tag', stars(r.stars, 26), h('div.eyebrow', { style: { marginTop: '4px' } }, t('res.why')))),
      h('div.res-tiles', tiles),
      h('div.reward',
        h('div.tile.cut', h('span.eyebrow', t('res.xp')), xpNum, lvl, xpBar),
        h('div.tile.cut', h('span.eyebrow', t('hub.parca')), h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, svg('coin'), coinNum), g.newStars ? h('span.eyebrow', t('res.newStars', { n: g.newStars })) : null)),
      h('div', { style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' } }, again, cont));
    const el = h('div', h('div.sbody.veil', { style: { alignItems: 'center' } }, box));
    return {
      el,
      show() {
        ctx.showcase.frame(0.5, 170);
        popIn([box], { from: 18 });
        popIn(tiles, { delay: 160, step: 50 });
        setTimeout(() => { countUp(xpNum, 0, g.xp, { fmt: (v) => `+${num(Math.round(v))}` }); countUp(coinNum, 0, g.parca, { fmt: (v) => `+${num(Math.round(v))}` }); ui('reward'); haptic('success'); }, 380);
        if (g.levelUps) setTimeout(() => { ui('levelup'); haptic('heavy'); lvl.textContent = `${t('hub.level', { n: d.profile.level })} · ${t('res.levelUp')}`; }, 1300);
      },
      back: () => { ctx.router.go('campaign', { sel: r.id }, { replace: true }); return true; },
    };
  },
};
