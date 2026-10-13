// Preparation: operator, primary, sidearm and difficulty for a mission.
// The operator stands on the left with the chosen loadout (showcase).
import { h, svg, press, popIn, ui } from '../kit.js';
import { t } from '../i18n.js';
import { shead, statBar } from './common.js';
import { avatar, weaponPic } from '../portraits.js';
import { OPS, PRIMARIES, gunBars, opName } from '../data.js';
import { WEAPONS } from '../../art/weapons/index.js';

export const prep = {
  mount(ctx, params) {
    const S = ctx.save;
    let diff = params.diff || S.d.settings.diff;
    const side = h('section.prep-side');
    const stage = h('section.prep-stage');
    function render() {
      const d = S.d, id = d.roster.op, lo = d.roster.loadout[id];
      ctx.showcase.setOperator(id, lo);
      const opRow = h('div.op-picks', OPS.map((o) => press(h(`button.op-pick.cut${o.id === id ? '.on' : ''}`, {
        type: 'button', 'aria-label': o.id,
        onclick: () => { if (o.id !== id) { ui('tab'); S.set((s) => { s.roster.op = o.id; }); render(); } },
      }, avatar(o.id, 46)), { buzz: 'tick', sound: null })));
      const wtile = (w, slot) => {
        const on = slot === 'primary' ? lo.primary === w : lo.sidearm === w;
        const mini = slot !== 'primary';
        return press(h(`button.tile.wtile.cut${on ? '.on' : ''}${mini ? '.mini' : ''}`, {
          type: 'button',
          onclick: () => {
            ui('tab');
            S.set((s) => {
              const L = s.roster.loadout[id];
              if (slot === 'primary') { L.primary = w; if (L.sidearm === w) L.sidearm = null; }
              else L.sidearm = L.sidearm === w ? null : w;
            });
            render();
          },
          'aria-label': `${t(`cls.${w === 'wren9' ? 'pistol' : w === 'ramrod' ? 'shotgun' : w === 'marksman' ? 'sniper' : 'rifle'}`)} · ${WEAPONS[w].name}`,
        }, weaponPic(w, mini ? 64 : 110, mini ? 22 : 26), h('b', WEAPONS[w].name)), { buzz: 'tick', sound: null });
      };
      const b = gunBars(lo.primary);
      const sideOK = lo.primary !== 'wren9';
      stage.replaceChildren(opRow, h('div.op-tag', h('div.name', opName(id)), h('div.role', t(`role.${OPS.find((o) => o.id === id).role}`))));
      side.replaceChildren(
        h('div.eyebrow', t('prep.primary')),
        h('div.slotrow', PRIMARIES.map((w) => wtile(w, 'primary'))),
        h('div.statgrid', statBar(t('stat.damage'), b.damage, b.damage), statBar(t('stat.rate'), t('stat.rpm', { n: b.rpm }), b.rate), statBar(t('stat.range'), b.range, b.range), statBar(t('stat.control'), b.control, b.control)),
        h('div.prep-pair',
          h('div', h('div.eyebrow', t('prep.sidearm')), sideOK ? wtile('wren9', 'side') : h('div.muted.note', t('prep.noSidearm'))),
          h('div', h('div.eyebrow', t('camp.diff')), h('div.seg', ['normal', 'hard'].map((k) => press(h(`button${diff === k ? '.on' : ''}`, { type: 'button', onclick: () => { diff = k; S.set((s) => { s.settings.diff = k; }); render(); } }, t(`diff.${k}`)), { buzz: 'tick', sound: 'tab' }))))),
        press(h('button.btn.primary.lg.cut.go', { type: 'button', onclick: () => { ui('confirm'); ctx.startMission(params.mission || 'm1', { diff }); } }, svg('play'), t('prep.start')), { sound: null, buzz: 'heavy' }));
    }
    render();
    const el = h('div', shead(ctx, t('prep.title'), t(`mission.${params.mission || 'm1'}`)), h('div.prep-body', stage, side));
    return { el, show() { ctx.showcase.frame(0.22, 128); popIn(side.children, { step: 25 }); } };
  },
};
