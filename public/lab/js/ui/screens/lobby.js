// Lobby: the live operator on the left (the showcase draws it), the play
// panel on the right.
import { h, svg, press, popIn, ui, spring, reduced } from '../kit.js';
import { t } from '../i18n.js';
import { hubbar, stars } from './common.js';
import { dailyDone, traderStock, traderSold } from '../../core/economy.js';
import { avatar } from '../portraits.js';
import { OPS, MISSIONS, opName } from '../data.js';
import { WEAPONS } from '../../art/weapons/index.js';

export const lobby = {
  mount(ctx, params = {}) {
    const d = ctx.save.d;
    const next = MISSIONS.find((m) => m.ready && !(d.campaign[m.id] && d.campaign[m.id].done)) || MISSIONS[0];
    const tag = h('div.op-tag');
    const picks = h('div.op-picks');
    const renderOp = () => {
      const id = ctx.save.d.roster.op, lo = ctx.save.d.roster.loadout[id], op = OPS.find((o) => o.id === id);
      tag.replaceChildren(
        h('div.eyebrow', t('lobby.operator')),
        h('div.name', opName(id)),
        h('div.role', t(`role.${op.role}`)),
        h('div.loadout', h('span', '▸ ', WEAPONS[lo.primary].name), lo.sidearm && h('span', '▸ ', WEAPONS[lo.sidearm].name)));
      for (const b of picks.children) b.classList.toggle('on', b.dataset.id === id);
      ctx.showcase.setOperator(id, lo);
    };
    for (const o of OPS) {
      picks.appendChild(press(h('button.op-pick.cut', { type: 'button', 'aria-label': o.name, dataset: { id: o.id }, onclick: () => {
        if (ctx.save.d.roster.op === o.id) return;
        ui('tab');
        ctx.save.set((s) => { s.roster.op = o.id; });
        renderOp();
        hub.replaceWith(hub = hubbar(ctx, 'lobby'));
      } }, avatar(o.id, 46)), { buzz: 'tick' }));
    }
    const best = d.campaign[next.id];
    const play = press(h('button.play-cta.cut', { type: 'button', onclick: () => { ui('confirm'); ctx.router.go('play'); } },
      h('div.eyebrow', t('lobby.campaign', { act: next.act })),
      h('b', t('lobby.play')),
      h('span', t('lobby.next', { n: next.id.slice(1), name: t(`mission.${next.id}`) }), best ? ' · ' : '', best ? stars(best.stars, 12) : null),
      svg('arrow')), { scale: 0.97, sound: null, buzz: 'soft' });
    const done = dailyDone(d), rec = d.records.endless;
    const tiles = h('div.side-grid',
      press(h('button.tile.cut', { type: 'button', onclick: () => { ui('confirm'); ctx.router.go('daily'); } },
        h('div.eyebrow', t('mode.daily')), h('div.big', String(done), h('small', ' / 3')), h('div.meter.cyan', h('i', { style: { width: `${Math.round((done / 3) * 100)}%` } }))), { sound: null, buzz: 'soft' }),
      press(h('button.tile.cut', { type: 'button', onclick: () => { ui('confirm'); ctx.router.go('prep', { mission: 'endless' }); } },
        h('div.eyebrow', t('mode.endless')), h('div.big', rec ? String(rec) : '—', h('small', ' ', t('lobby.record'))), h('div.eyebrow', { style: { color: 'var(--n5)' } }, t('lobby.boss5'))), { sound: null, buzz: 'soft' }));
    const st = traderStock(d), left = [...st.daily, st.weekly].filter((it) => !traderSold(d, it)).length;
    const crow = press(h('button.tile.cut.wide-row', { type: 'button', onclick: () => ctx.router.go('trader', {}, { root: true }) },
      h('div', h('div.eyebrow', h('span.dot'), t('lobby.crow')), h('div.h3', { style: { marginTop: '6px' } }, t('lobby.crowSub'))),
      h('div.tag', h('div.eyebrow.accent', t('lobby.crowOpen', { n: left })))));
    let hub = hubbar(ctx, 'lobby');
    const el = h('div',
      hub,
      h('div.lobby-body',
        h('section.lobby-stage', tag, picks),
        h('section.lobby-side.veil-r', play, tiles, crow)));
    return {
      el,
      show() {
        ctx.showcase.frame(0.27, 112);
        // after the opening: the camera pushes in, the operator drops onto the street and the panels slide in
        const first = params.entrance && !reduced();
        if (first) ctx.showcase.entrance();
        renderOp();
        if (first) {
          params.entrance = false;
          const ease = spring();
          hub.animate([{ opacity: 0, transform: 'translateY(-110%)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 380, easing: ease, fill: 'backwards' });
          tag.animate([{ opacity: 0, transform: 'translateX(-28px)', clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, transform: 'none', clipPath: 'inset(0 0 0 0)' }], { duration: 560, delay: 620, easing: ease, fill: 'backwards' });
          popIn(picks.children, { delay: 760, step: 55, from: 18 });
          for (const [i, n] of [play, tiles, crow].entries()) n.animate([{ opacity: 0, transform: 'translateX(48px)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: 460 + i * 80, easing: ease, fill: 'backwards' });
        } else popIn([play, tiles, crow], { delay: 40 });
      },
    };
  },
};
