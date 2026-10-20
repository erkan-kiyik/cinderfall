// Operators: the roster as personnel files (docs §10.10): each one's age,
// old trade, where they were the night the furnace went out, what they
// carry, a line in their own words, their abilities and costumes.
import { h, svg, press, popIn, ui, toast } from '../kit.js';
import { t } from '../i18n.js';
import { hubbar, soon } from './common.js';
import { avatar } from '../portraits.js';
import { OPS, opName } from '../data.js';

export const operators = {
  mount(ctx, params) {
    let sel = params.sel || ctx.save.d.roster.op;
    const list = h('div.op-list');
    const mid = h('section.op-mid.scroll');
    const right = h('section', { style: { display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 } });
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
          h('q.op-quote', t(`op.${o.id}.quote`))),
        h('div.eyebrow', t('ops.abilities')),
        h('div.abil-list', o.abil.map(([k, icon], i) => h('div.abil.cut', h(`div.hex${i === 2 ? '.ult' : ''}`, svg(icon)), h('div', h('b', t(`ab.${o.id}.${k}`), i === 2 ? h('span.soon', t('ops.ult')) : null), h('p', t(`ab.${o.id}.${k}.d`)))))));
      const isOn = d.roster.op === o.id;
      right.replaceChildren(
        h('div.eyebrow', t('ops.costumes'), soon()),
        h('div.slotrow', { style: { gridTemplateColumns: 'repeat(2, 1fr)' } }, ['std', 'c1', 'c2', 'c3'].map((k, i) => h(`div.tile.cut.costume${i === 0 ? '.on' : '.locked'}`, { style: { '--rar': i === 0 ? 'var(--r-common)' : ['var(--r-rare)', 'var(--r-epic)', 'var(--r-legendary)'][i - 1] } },
          i > 0 && h('span.lockbadge', svg('lock')), h('div.eyebrow', t(i === 0 ? 'ops.factory' : `rar.${['rare', 'epic', 'legendary'][i - 1]}`)), h('b.h3', i === 0 ? t('ops.standard') : '???')))),
        h('div.eyebrow', t('ops.mastery')),
        h('div.meter.ember', h('i', { style: { width: '8%' } })),
        h('div.wide-row', { style: { minHeight: 0 } }, h('div.eyebrow', t('ops.missions'), ' ', h('b', { style: { color: 'var(--n8)' } }, String(st ? st.missions : 0))), h('div.tag.eyebrow', t('ops.kills'), ' ', h('b', { style: { color: 'var(--n8)' } }, String(st ? st.kills : 0)))),
        press(h(`button.btn.${isOn ? 'secondary' : 'primary'}.cut`, { type: 'button', style: { marginTop: 'auto' }, 'aria-disabled': isOn ? 'true' : 'false',
          onclick: () => { if (isOn) return; ui('confirm'); ctx.save.set((s) => { s.roster.op = o.id; }); toast(t('ops.selected', { n: opName(o.id) }), { kind: 'good' }); render(); } },
        svg(isOn ? 'check' : 'user'), t(isOn ? 'ops.inSquad' : 'ops.select')), { sound: null }));
    }
    render();
    const el = h('div', hubbar(ctx, 'operators'), h('div.ops-body.veil', list, mid, right));
    return { el, show() { ctx.showcase.frame(0.42, 120); popIn(list.children, { step: 30 }); } };
  },
};
