// Profile: summary, campaign career, collection (M7), achievements and
// statistics, all from the save.
import { h, svg, press, popIn, ui, modal, toast } from '../kit.js';
import { t, num, clock } from '../i18n.js';
import { shead, stars } from './common.js';
import { avatar } from '../portraits.js';
import { MISSIONS, OPS } from '../data.js';
import { WEAPONS } from '../../art/weapons/index.js';
import { xpFor } from '../../core/save.js';

// a first set of achievements, measured from the save (40 arrive with M7)
const ACH = [
  ['first', (d) => [d.campaign.m1 && d.campaign.m1.done ? 1 : 0, 1]],
  ['stars', (d) => [Math.max(0, ...Object.values(d.campaign).map((c) => c.stars.filter(Boolean).length)), 3]],
  ['kills50', (d) => [d.stats.kills, 50]],
  ['heads25', (d) => [d.stats.heads, 25]],
  ['shots', (d) => [d.stats.shots, 1000]],
  ['nodeath', (d) => [Object.values(d.campaign).some((c) => c.stars[2]) ? 1 : 0, 1]],
  ['hard', (d) => [Object.values(d.campaign).some((c) => c.hard) ? 1 : 0, 1]],
  ['squad', (d) => [Object.values(d.stats.byOp).filter((o) => o.missions > 0).length, 5]],
];

export const profile = {
  mount(ctx) {
    let tab = 'summary';
    const tabs = h('div.seg');
    const body = h('div.scroll', { style: { flex: 1, minHeight: 0 } });
    const TABS = ['summary', 'career', 'collection', 'achievements', 'stats'];
    function render() {
      const d = ctx.save.d, S = d.stats, p = d.profile;
      tabs.replaceChildren(...TABS.map((k) => press(h(`button${k === tab ? '.on' : ''}`, { type: 'button', onclick: () => { tab = k; ui('tab'); render(); } }, t(`prof.${k}`)), { buzz: 'tick', sound: null })));
      const acc = S.shots ? Math.round((S.hits / S.shots) * 100) : 0;
      if (tab === 'summary') {
        const nameBtn = press(h('button.btn.ghost.sm.cut', { type: 'button', onclick: rename }, t('prof.rename')));
        body.replaceChildren(
          h('div.card.cut.wide-row', { style: { gap: '14px' } },
            h('div', { style: { width: '64px', height: '64px', background: 'var(--n2)' } }, avatar(d.roster.op, 64)),
            h('div', h('div.eyebrow', t('prof.callsign')), h('div.h1', { style: { fontSize: '30px' } }, p.name), h('div.eyebrow.accent', t('hub.level', { n: p.level }), ' · ', `${num(p.xp)} / ${num(xpFor(p.level))} XP`)),
            h('div.tag', nameBtn)),
          h('div.kv', { style: { marginTop: '10px' } }, [
            [S.missions, t('prof.missions')], [S.kills, t('prof.kills')], [`%${acc}`, t('prof.acc')], [S.heads, t('prof.heads')],
            [clock(S.time), t('prof.time')], [S.deaths, t('prof.deaths')], [num(p.parca), t('hub.parca')], [Object.values(d.campaign).reduce((a, c) => a + c.stars.filter(Boolean).length, 0), t('prof.stars')],
          ].map(([v, k]) => h('div.tile.cut', h('b', String(v)), h('span', k)))));
      } else if (tab === 'career') {
        body.replaceChildren(h('table.tbl', h('thead', h('tr', [t('prof.mission'), t('prof.state'), t('prof.starsCol'), t('prof.best'), t('prof.plays')].map((x) => h('th', x)))),
          h('tbody', MISSIONS.map((m) => { const c = d.campaign[m.id]; return h('tr',
            h('td', `${m.id.slice(1)}. ${t(`mission.${m.id}`)}`),
            h('td', !m.ready ? t('ui.soon') : c && c.done ? t('prof.cleared') : t('prof.open')),
            h('td', c ? stars(c.stars, 13) : '—'),
            h('td.n', c && c.best !== null ? clock(c.best) : '—'),
            h('td.n', c ? String(c.plays) : '0')); }))));
      } else if (tab === 'collection') {
        body.replaceChildren(h('div.empty.cut', { style: { height: '100%' } }, svg('crate'), h('b', t('prof.collEmpty')), h('span', t('prof.collHint'))));
      } else if (tab === 'achievements') {
        body.replaceChildren(h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' } }, ACH.map(([id, f]) => {
          const [c, m] = f(d), done = c >= m;
          return h(`div.row.cut`, { style: done ? { borderColor: 'var(--gold)' } : null },
            h('span', { style: { color: done ? 'var(--gold)' : 'var(--n5)', display: 'flex' } }, svg('trophy')),
            h('div.lbl', h('b', t(`ach.${id}`)), h('small', t(`ach.${id}.d`)), h('div.meter', { style: { marginTop: '5px' } }, h('i', { style: { width: `${Math.min(100, (c / m) * 100)}%`, background: done ? 'var(--gold)' : 'var(--n6)' } }))),
            h('div.val', `${Math.min(c, m)}/${m}`));
        })), h('p.muted', { style: { font: '600 11px/1.4 var(--f-body)', margin: '8px 2px' } }, t('prof.achMore')));
      } else {
        const wrows = Object.entries(S.byWeapon).filter(([w]) => WEAPONS[w]);
        body.replaceChildren(
          h('div.grp', t('prof.byWeapon')),
          wrows.length ? h('table.tbl', h('thead', h('tr', [t('prof.weapon'), t('prof.kills'), t('prof.acc'), t('prof.heads')].map((x) => h('th', x)))),
            h('tbody', wrows.map(([w, s]) => h('tr', h('td', WEAPONS[w].name), h('td.n', String(s.kills)), h('td.n', s.shots ? `%${Math.round((s.hits / s.shots) * 100)}` : '—'), h('td.n', String(s.heads))))))
            : h('div.empty.cut', svg('chart'), h('b', t('prof.noStats'))),
          h('div.grp', t('prof.byOp')),
          h('table.tbl', h('thead', h('tr', [t('prof.operator'), t('prof.missions'), t('prof.kills')].map((x) => h('th', x)))),
            h('tbody', OPS.map((o) => { const s = S.byOp[o.id] || { missions: 0, kills: 0 }; return h('tr', h('td', o.id.toUpperCase()), h('td.n', String(s.missions)), h('td.n', String(s.kills))); }))));
      }
      popIn(body.firstElementChild ? [body.firstElementChild] : [], { from: 8 });
    }
    function rename() {
      const inp = h('input', { type: 'text', maxlength: '14', value: ctx.save.d.profile.name, style: { width: '100%', minHeight: '44px', padding: '0 12px', background: 'var(--n2)', color: 'var(--n8)', border: '1px solid var(--line-hi)', font: '700 18px/1 var(--f-display)', letterSpacing: '0.08em', textTransform: 'uppercase' } });
      modal({ kicker: t('prof.callsign'), title: t('prof.rename'), body: inp, actions: [
        { label: t('ui.cancel'), kind: 'ghost' },
        { label: t('ui.save'), kind: 'primary', fn: (close) => {
          const v = inp.value.trim().toLocaleUpperCase('tr').replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 14);
          if (v.length < 3) { toast(t('prof.nameShort')); return; }
          ctx.save.set((s) => { s.profile.name = v; }); close(); render();
        } }] });
      setTimeout(() => inp.focus(), 50);
    }
    render();
    const el = h('div', shead(ctx, t('prof.title'), ctx.save.d.profile.name, tabs), h('div.prof-body.veil', body));
    return { el, show() { ctx.showcase.frame(0.5, 170); } };
  },
};
