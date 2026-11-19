// Operators: the roster as personnel files (docs §10.10): each one's age,
// old trade, where they were the night the furnace went out, what they
// carry, a line in their own words. Beside the file, always in sight, their
// three abilities, or the costumes (docs §10.41); under them the operator's
// mastery and the button that puts them in the squad.
import { h, svg, press, popIn, ui, toast, deny } from '../kit.js';
import { t, num } from '../i18n.js';
import { hubbar, refreshCur } from './common.js';
import { avatar } from '../portraits.js';
import { OPS, opName } from '../data.js';
import { COSTUMES, hasCostume, costumeOf, takeCostume, masteryOf } from '../../core/economy.js';

export const operators = {
  mount(ctx, params) {
    let sel = params.sel || ctx.save.d.roster.op, tab = params.tab || 'abil';
    const list = h('div.op-list');
    const mid = h('section.op-mid.scroll');
    const right = h('section.op-right');
    function render() {
      const o = OPS.find((x) => x.id === sel), d = ctx.save.d, st = d.stats.byOp[o.id];
      list.replaceChildren(...OPS.map((x) => press(h(`button.op-row.cut${x.id === sel ? '.on' : ''}`, {
        type: 'button', onclick: () => { if (x.id !== sel) { sel = x.id; ui('tab'); render(); } },
      }, avatar(x.id, 44), h('div', h('b', opName(x.id)), h('small', t(`role.${x.role}`))),
      d.roster.op === x.id && h('span', { style: { marginLeft: 'auto', color: 'var(--ember)', display: 'flex' } }, svg('check'))), { buzz: 'tick', sound: null })));
      ctx.showcase.setOperator(o.id, d.roster.loadout[o.id]);
      mid.replaceChildren(
        h('div.card.op-card',
          // the file's photo, clipped on, the trade stamped across its corner
          h('div.op-photo', avatar(o.id, 72)),
          h('div.stamp', t(`role.${o.role}`)),
          h('div.eyebrow', t('ops.file'), ' · ', `K-${String(OPS.indexOf(o) + 3).padStart(2, '0')}`),
          h('div.op-title', h('div.h2', opName(o.id))),
          // the typed facts, then the file's note, then a line in their own words
          h('dl.op-facts',
            h('dt', t('ops.age')), h('dd', String(o.age)),
            h('dt', t('ops.job')), h('dd', t(`op.${o.id}.job`)),
            h('dt', t('ops.keep')), h('dd', t(`op.${o.id}.keep`)),
            h('dt', t('ops.night')), h('dd', t(`op.${o.id}.night`))),
          h('p.body', t(`op.${o.id}.bio`)),
          h('q.op-quote', t(`op.${o.id}.quote`))));
      // the right-hand column: abilities or costumes, then mastery and the squad button
      const tabs = h('div.seg.op-tabs', [['abil', 'ops.abilities'], ['cost', 'ops.costumes']].map(([k, key]) => press(h(`button${tab === k ? '.on' : ''}`, {
        type: 'button', onclick: () => { if (tab !== k) { tab = k; ui('tab'); render(); } },
      }, t(key)), { buzz: 'tick', sound: null })));
      const worn = costumeOf(d, o.id), M = masteryOf(d, o.id);
      const pane = tab === 'abil'
        ? h('div.abil-list', o.abil.map(([k, icon], i) => h('div.abil.cut', h(`div.hex${i === 2 ? '.ult' : ''}`, svg(icon)), h('div', h('b', t(`ab.${o.id}.${k}`), i === 2 ? h('span.soon', t('ops.ult')) : null), h('p', t(`ab.${o.id}.${k}.d`))))))
        : h('div.costumes', COSTUMES.map((C) => {
          const mine = hasCostume(d, o.id, C.id), on = worn.id === C.id;
          const tag = on ? h('span.ctag.on', svg('check'), t('ops.worn'))
            : mine ? h('span.ctag', t('ops.wear'))
              : C.mastery ? h('span.ctag', svg('lock'), t('ops.needMastery', { n: C.mastery }))
                : h('span.ctag', svg('coin'), num(C.price));
          return press(h(`button.tile.cut.costume${on ? '.on' : ''}${mine ? '' : '.locked'}`, {
            type: 'button', style: { '--rar': `var(--r-${C.rar})`, '--dye': C.tint },
            onclick: (e) => {
              if (on) return;
              if (!mine && C.mastery) { toast(t('ops.needMasteryHint', { n: C.mastery }), { kind: 'warn' }); return deny(e.currentTarget); }
              if (!takeCostume(ctx.save, o.id, C.id)) { toast(t('shop.short'), { kind: 'bad' }); return deny(e.currentTarget); }
              ui(mine ? 'tab' : 'reward'); if (!mine) refreshCur();
              toast(t('ops.costumeOn', { c: t(`cost.${C.id}`), n: opName(o.id) }), { kind: 'good' });
              render();
            },
          }, h('i.dye'), h('div', h('div.eyebrow', t(`rar.${C.rar}`)), h('b.h3', t(`cost.${C.id}`))), tag), { buzz: 'tick', sound: null });
        }));
      const isOn = d.roster.op === o.id;
      right.replaceChildren(
        tabs,
        h('div.op-pane.scroll', pane),
        h('div.op-mastery',
          h('div.wide-row', h('div.eyebrow', t('ops.mastery'), ' ', h('b', String(M.lvl)), M.next ? ` · ${num(M.pts)}/${num(M.next)}` : ''),
            h('div.eyebrow', t('ops.missions'), ' ', h('b', String(st ? st.missions : 0)), ' · ', t('ops.kills'), ' ', h('b', String(st ? st.kills : 0)))),
          h('div.meter.ember', h('i', { style: { width: `${Math.round(M.k * 100)}%` } }))),
        press(h(`button.btn.${isOn ? 'secondary' : 'primary'}.cut`, { type: 'button', 'aria-disabled': isOn ? 'true' : 'false',
          onclick: () => { if (isOn) return; ui('confirm'); ctx.save.set((s) => { s.roster.op = o.id; }); toast(t('ops.selected', { n: opName(o.id) }), { kind: 'good' }); render(); } },
        svg(isOn ? 'check' : 'user'), t(isOn ? 'ops.inSquad' : 'ops.select')), { sound: null }));
    }
    render();
    const el = h('div', hubbar(ctx, 'operators'), h('div.ops-body.veil', list, mid, right));
    return { el, show() { ctx.showcase.frame(0.42, 120); popIn(list.children, { step: 30 }); } };
  },
};
