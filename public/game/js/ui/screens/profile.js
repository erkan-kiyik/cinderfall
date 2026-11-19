// Profile: summary, campaign career, collection (M7), achievements and
// statistics, all from the save.
import { h, svg, press, popIn, ui, modal, toast } from '../kit.js';
import { t, num, clock } from '../i18n.js';
import { shead, stars } from './common.js';
import { avatar } from '../portraits.js';
import { MISSIONS, OPS, opName, WEAPON_LIST } from '../data.js';
import { masteryOf, SKIN, COSTUMES, hasCostume } from '../../core/economy.js';
import { WEAPONS } from '../../art/weapons/index.js';
import { xpFor } from '../../core/save.js';

// achievements (docs §10.41), measured from the save: [id, (d) → [progress, goal]]
const camp = (d, id) => !!(d.campaign[id] && d.campaign[id].done);
const C = (d) => Object.values(d.campaign);
const ACH = [
  ['first', (d) => [camp(d, 'm1') ? 1 : 0, 1]],
  ['act1', (d) => [camp(d, 'm3') ? 1 : 0, 1]],
  ['act2', (d) => [camp(d, 'm7') ? 1 : 0, 1]],
  ['act3', (d) => [camp(d, 'm10') ? 1 : 0, 1]],
  ['stars', (d) => [Math.max(0, ...C(d).map((c) => c.stars.filter(Boolean).length)), 3]],
  ['allStars', (d) => [C(d).reduce((a, c) => a + c.stars.filter(Boolean).length, 0), 30]],
  ['par5', (d) => [C(d).filter((c) => c.stars[1]).length, 5]],
  ['nodeath', (d) => [C(d).some((c) => c.stars[2]) ? 1 : 0, 1]],
  ['hard', (d) => [C(d).some((c) => c.hard) ? 1 : 0, 1]],
  ['hardAll', (d) => [C(d).filter((c) => c.hard).length, 10]],
  ['bosses', (d) => [d.stats.bosses || 0, 3]],
  ['kills50', (d) => [d.stats.kills, 50]],
  ['kills500', (d) => [d.stats.kills, 500]],
  ['kills2000', (d) => [d.stats.kills, 2000]],
  ['heads25', (d) => [d.stats.heads, 25]],
  ['heads250', (d) => [d.stats.heads, 250]],
  ['shots', (d) => [d.stats.shots, 1000]],
  ['shots10k', (d) => [d.stats.shots, 10000]],
  ['squad', (d) => [Object.values(d.stats.byOp).filter((o) => o.missions > 0).length, 5]],
  ['mastery', (d) => [Math.max(0, ...OPS.map((o) => masteryOf(d, o.id).lvl)), 4]],
  ['endless10', (d) => [d.records.endless, 10]],
  ['endless25', (d) => [d.records.endless, 25]],
  ['crates10', (d) => [d.inv.opened || 0, 10]],
  ['crates50', (d) => [d.inv.opened || 0, 50]],
  ['arsenal', (d) => [d.arsenal.owned.length, WEAPON_LIST.length]],
  ['rareSkin', (d) => [Object.values(d.arsenal.skins).some((l) => l.some((k) => ['mythic', 'ultra'].includes(SKIN[k]?.rar))) ? 1 : 0, 1]],
  ['costume', (d) => [Object.values(d.roster.costumes || {}).some((l) => l.length) ? 1 : 0, 1]],
  ['level10', (d) => [d.profile.level, 10]],
  ['level25', (d) => [d.profile.level, 25]],
  ['login7', (d) => [d.login.n || 0, 7]],
  ['tasks10', (d) => [d.stats.tasks || 0, 10]],
  ['week', (d) => [d.stats.weeks || 0, 1]],
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
          h('div.card.paper.unioncard.wide-row', { style: { gap: '14px' } },
            h('div.photo', avatar(d.roster.op, 64)),
            h('div', h('div.eyebrow.accent', t('prof.card')), h('div.eyebrow', t('prof.callsign')), h('div.h1', { style: { fontSize: '30px' } }, p.name), h('div.eyebrow.accent', t('hub.level', { n: p.level }), ' · ', `${num(p.xp)} / ${num(xpFor(p.level))} XP`)),
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
        // what crates, HAWK and the crew's stock have brought: finishes per weapon, costumes per operator
        const skins = Object.entries(d.arsenal.skins).filter(([w, l]) => WEAPONS[w] && l.length);
        const costumes = OPS.map((o) => [o, COSTUMES.filter((c) => c.id !== 'std' && hasCostume(d, o.id, c.id))]).filter(([, l]) => l.length);
        if (!skins.length && !costumes.length) body.replaceChildren(h('div.empty.cut', { style: { height: '100%' } }, svg('crate'), h('b', t('prof.collEmpty')), h('span', t('prof.collHint'))));
        else body.replaceChildren(
          skins.length ? h('div.grp', t('ars.skins')) : null,
          ...skins.map(([w, l]) => h('div.row.cut', h('div.lbl', h('b', WEAPONS[w].name)), h('div.coll', l.map((k) => SKIN[k] && h(`span.skin.cut${SKIN[k].pat ? `.p${SKIN[k].pat}` : ''}`, { title: t(`skin.${k}`), style: { '--rar': `var(--r-${SKIN[k].rar})`, '--tint': SKIN[k].tint } }, h('i.sw')))))),
          costumes.length ? h('div.grp', t('ops.costumes')) : null,
          ...costumes.map(([o, l]) => h('div.row.cut', h('div.lbl', h('b', opName(o.id))), h('div.coll', l.map((c) => h('span.eyebrow', t(`cost.${c.id}`)))))));
      } else if (tab === 'achievements') {
        const got = ACH.filter(([, f]) => { const [c, m] = f(d); return c >= m; }).length;
        body.replaceChildren(h('div.grp', t('prof.achCount', { n: got, m: ACH.length })), h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' } }, ACH.map(([id, f]) => {
          const [c, m] = f(d), done = c >= m;
          return h(`div.row.cut`, { style: done ? { borderColor: 'var(--gold)' } : null },
            h('span', { style: { color: done ? 'var(--gold)' : 'var(--n5)', display: 'flex' } }, svg('trophy')),
            h('div.lbl', h('b', t(`ach.${id}`)), h('small', t(`ach.${id}.d`)), h('div.meter', { style: { marginTop: '5px' } }, h('i', { style: { width: `${Math.min(100, (c / m) * 100)}%`, background: done ? 'var(--gold)' : 'var(--n6)' } }))),
            h('div.val', `${Math.min(c, m)}/${m}`));
        })));
      } else {
        const wrows = Object.entries(S.byWeapon).filter(([w]) => WEAPONS[w]);
        body.replaceChildren(
          h('div.grp', t('prof.byWeapon')),
          wrows.length ? h('table.tbl', h('thead', h('tr', [t('prof.weapon'), t('prof.kills'), t('prof.acc'), t('prof.heads')].map((x) => h('th', x)))),
            h('tbody', wrows.map(([w, s]) => h('tr', h('td', WEAPONS[w].name), h('td.n', String(s.kills)), h('td.n', s.shots ? `%${Math.round((s.hits / s.shots) * 100)}` : '—'), h('td.n', String(s.heads))))))
            : h('div.empty.cut', svg('chart'), h('b', t('prof.noStats'))),
          h('div.grp', t('prof.byOp')),
          h('table.tbl', h('thead', h('tr', [t('prof.operator'), t('prof.missions'), t('prof.kills')].map((x) => h('th', x)))),
            h('tbody', OPS.map((o) => { const s = S.byOp[o.id] || { missions: 0, kills: 0 }; return h('tr', h('td', opName(o.id)), h('td.n', String(s.missions)), h('td.n', String(s.kills))); }))));
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
