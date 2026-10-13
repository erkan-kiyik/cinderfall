// Arsenal: every weapon (the four in service now, eight on the way), stats
// from the gun data, skins (M7) and attachments (M6); equip for the
// operator in the squad.
import { h, svg, press, popIn, ui, deny, toast } from '../kit.js';
import { t } from '../i18n.js';
import { hubbar, statBar, soon } from './common.js';
import { weaponPic } from '../portraits.js';
import { WEAPON_LIST, gunBars } from '../data.js';
import { WEAPONS } from '../../art/weapons/index.js';
import { GUNS } from '../../game/guns.js';

const CLASSES = ['all', 'pistol', 'smg', 'rifle', 'shotgun', 'sniper', 'heavy', 'explosive'];

export const arsenal = {
  mount(ctx, params) {
    let sel = params.sel || ctx.save.d.roster.loadout[ctx.save.d.roster.op].primary, filter = 'all';
    // class filter: one swipeable strip (the mouse wheel scrolls it sideways)
    const chips = h('div.seg.strip', { onwheel: (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { chips.scrollLeft += e.deltaY; e.preventDefault(); } } });
    const grid = h('div.wgrid-ui.scroll');
    const detail = h('section.wdetail.card.cut');
    const left = h('section', { style: { display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 } }, chips, grid);
    function renderList() {
      chips.replaceChildren(...CLASSES.map((c) => press(h(`button${filter === c ? '.on' : ''}`, { type: 'button', onclick: () => { filter = c; ui('tab'); renderList(); } }, t(c === 'all' ? 'ars.all' : `cls.${c}`)), { buzz: 'tick', sound: null })));
      const items = WEAPON_LIST.filter((w) => filter === 'all' || w.cls === filter);
      grid.replaceChildren(...items.map((w) => press(h(`button.tile.cut${w.id === sel ? '.on' : ''}${w.ready ? '' : '.locked'}`, {
        type: 'button', style: { '--rar': w.ready ? 'var(--r-common)' : 'transparent' },
        onclick: () => { sel = w.id; ui('tab'); renderList(); renderDetail(); },
      },
      !w.ready && h('span.lockbadge', svg('lock')),
      h('div.eyebrow', t(`cls.${w.cls}`)),
      w.ready ? weaponPic(w.id, 120, 28) : h('div', { style: { height: '28px', display: 'grid', placeItems: 'center', color: 'var(--n5)' } }, svg('gun')),
      h('b', w.ready ? WEAPONS[w.id].name : w.name)), { buzz: 'tick', sound: null })));
    }
    function renderDetail() {
      const w = WEAPON_LIST.find((x) => x.id === sel), d = ctx.save.d, op = d.roster.op, lo = d.roster.loadout[op];
      if (!w.ready) {
        detail.replaceChildren(
          h('div', h('div.eyebrow', t(`cls.${w.cls}`)), h('div.h1', { style: { fontSize: '28px' } }, w.name)),
          h('p.body', { style: { margin: 0 } }, t(`wpn.${w.id}`)),
          h('div.empty.cut', { style: { flex: 1 } }, svg('lock'), h('b', t('ars.lockedTitle')), h('span', t('ars.lockedHint'))));
        return;
      }
      const b = gunBars(w.id), g = GUNS[w.id];
      const equipped = lo.primary === w.id || lo.sidearm === w.id;
      const big = weaponPic(w.id, 330, 74);
      Object.assign(big.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'contain' });
      detail.replaceChildren(
        h('div.wide-row', { style: { minHeight: 0 } },
          h('div', { style: { minWidth: 0 } }, h('div.eyebrow', t(`cls.${w.cls}`), ' · ', t(`mode.fire.${g.mode}`)), h('div.h1', { style: { fontSize: '26px' } }, WEAPONS[w.id].name)),
          h('div.tag', h('div.eyebrow', t('ars.mag')), h('div.h3', `${g.mag}`))),
        h('div.gun', big),
        h('div.statgrid', statBar(t('stat.damage'), g.pellets > 1 ? `${g.dmg}×${g.pellets}` : g.dmg, b.damage), statBar(t('stat.rate'), t('stat.rpm', { n: g.rpm }), b.rate), statBar(t('stat.range'), b.range, b.range), statBar(t('stat.control'), b.control, b.control)),
        h('div.custom',
          h('div', h('div.eyebrow', t('ars.skins'), soon()),
            h('div.skinrow', h('div.skin.on.cut', { style: { '--rar': 'var(--r-common)' }, title: t('ops.factory') }, svg('check')),
              ['rare', 'epic', 'legendary'].map((r) => h('div.skin.cut', { style: { '--rar': `var(--r-${r})` }, title: t(`rar.${r}`) }, svg('lock'))))),
          h('div', h('div.eyebrow', t('ars.attach'), soon()),
            h('div.skinrow', ['sight', 'barrel', 'mag', 'under'].map((k) => h('div.skin.att.cut', { title: t(`att.${k}`) }, h('span', t(`att.${k}`))))))),
        press(h(`button.btn.${equipped ? 'secondary' : 'primary'}.cut`, {
          type: 'button', 'aria-disabled': equipped ? 'true' : 'false',
          onclick: (e) => {
            if (equipped) return deny(e.currentTarget);
            ui('confirm');
            ctx.save.set((s) => { const L = s.roster.loadout[op]; if (w.slot === 'side') L.sidearm = w.id; else { L.primary = w.id; if (L.sidearm === w.id) L.sidearm = null; } });
            toast(t('ars.equipped', { w: WEAPONS[w.id].name, o: op.toUpperCase() }), { kind: 'good' });
            ctx.showcase.setOperator(op, ctx.save.d.roster.loadout[op]);
            renderDetail();
          },
        }, svg(equipped ? 'check' : 'gun'), t(equipped ? 'ars.inUse' : 'ars.equip', { o: op.toUpperCase() })), { sound: null }));
    }
    renderList(); renderDetail();
    const el = h('div', hubbar(ctx, 'arsenal'), h('div.ars-body.veil', left, detail));
    return { el, show() { ctx.showcase.frame(0.5, 160); popIn(grid.children, { step: 20 }); } };
  },
};
