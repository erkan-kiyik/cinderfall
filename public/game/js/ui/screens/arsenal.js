// Arsenal: every weapon with its stats from the gun data; the ones you do not
// own yet are bought here for PARÇA; finishes (from crates and HAWK) are
// picked per weapon; equip for the operator in the squad.
import { h, svg, press, popIn, ui, deny, toast } from '../kit.js';
import { t, num } from '../i18n.js';
import { hubbar, statBar, refreshCur } from './common.js';
import { SKINS, owns, hasSkin, skinOf, buyWeapon, equipSkin } from '../../core/economy.js';
import { weaponPic } from '../portraits.js';
import { WEAPON_LIST, gunBars, opName, dmgText } from '../data.js';
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
    // when the classes do not all fit, the strip fades at the edge with an arrow that scrolls it on
    const more = press(h('button.strip-more', { type: 'button', 'aria-label': t('ars.more'), onclick: () => { chips.scrollBy({ left: chips.clientWidth * 0.7, behavior: 'smooth' }); } }, svg('arrow')), { buzz: 'tick', sound: null });
    const wrap = h('div.strip-wrap', chips, more);
    const edge = () => { const over = chips.scrollWidth - chips.clientWidth; wrap.classList.toggle('more-r', over > 2 && chips.scrollLeft < over - 2); wrap.classList.toggle('more-l', chips.scrollLeft > 2); };
    chips.addEventListener('scroll', edge, { passive: true });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(edge).observe(chips);
    const left = h('section', { style: { display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 } }, wrap, grid);
    function renderList() {
      chips.replaceChildren(...CLASSES.map((c) => press(h(`button${filter === c ? '.on' : ''}`, { type: 'button', onclick: () => { filter = c; ui('tab'); renderList(); chips.children[CLASSES.indexOf(c)]?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' }); } }, t(c === 'all' ? 'ars.all' : `cls.${c}`)), { buzz: 'tick', sound: null })));
      const items = WEAPON_LIST.filter((w) => filter === 'all' || w.cls === filter);
      const d = ctx.save.d;
      grid.replaceChildren(...items.map((w) => {
        const have = owns(d, w.id), sk = skinOf(d, w.id);
        return press(h(`button.tile.cut${w.id === sel ? '.on' : ''}${have ? '' : '.locked'}`, {
          type: 'button', style: { '--rar': have ? `var(--r-${sk.rar})` : 'transparent' },
          onclick: () => { sel = w.id; ui('tab'); renderList(); renderDetail(); },
        },
        !have && h('span.lockbadge.price', svg('coin'), num(w.price || 0)),
        h('div.eyebrow', t(`cls.${w.cls}`)),
        weaponPic(w.id, 120, 28, have ? sk : null),
        h('b', WEAPONS[w.id].name)), { buzz: 'tick', sound: null });
      }));
    }
    function renderDetail() {
      const w = WEAPON_LIST.find((x) => x.id === sel), d = ctx.save.d, op = d.roster.op, lo = d.roster.loadout[op];
      const have = owns(d, w.id), sk = skinOf(d, w.id);
      const b = gunBars(w.id), g = GUNS[w.id];
      const equipped = lo.primary === w.id || lo.sidearm === w.id;
      const big = weaponPic(w.id, 330, 74, have ? sk : null);
      Object.assign(big.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'contain' });
      detail.replaceChildren(
        h('div.wide-row', { style: { minHeight: 0 } },
          h('div', { style: { minWidth: 0 } }, h('div.eyebrow', t(`cls.${w.cls}`), ' · ', t(`mode.fire.${g.mode}`)), h('div.h1', { style: { fontSize: '26px' } }, WEAPONS[w.id].name)),
          h('div.tag', h('div.eyebrow', t('ars.mag')), h('div.h3', `${g.mag}`))),
        h('div.gun', big),
        h('div.statgrid', statBar(t('stat.damage'), dmgText(w.id), b.damage), statBar(t('stat.rate'), t('stat.rpm', { n: g.rpm }), b.rate), statBar(t('stat.range'), b.range, b.range), statBar(t('stat.control'), b.control, b.control)),
        h('p.body', { style: { margin: 0, fontSize: '11.5px' } }, t(`wpn.${w.id}`)),
        h('div.custom',
          // finishes: the ones you have are buttons, the rest show their rarity, locked
          h('div', h('div.eyebrow', t('ars.skins'), ' · ', t(`skin.${sk.id}`)),
            h('div.skinrow.scroll', SKINS.map((s) => {
              const mine = have && hasSkin(d, w.id, s.id), on = mine && sk.id === s.id;
              return press(h(`button.skin.cut${on ? '.on' : ''}${mine ? '' : '.locked'}${s.pat ? `.p${s.pat}` : ''}`, {
                type: 'button', style: { '--rar': `var(--r-${s.rar})`, '--tint': s.tint }, title: `${t(`skin.${s.id}`)} · ${t(`rar.${s.rar}`)}`,
                onclick: (e) => { if (!mine) return deny(e.currentTarget); ui('tab'); equipSkin(ctx.save, w.id, s.id); renderList(); renderDetail(); ctx.showcase.setOperator(op, ctx.save.d.roster.loadout[op]); },
              }, on ? svg('check') : mine ? h('i.sw') : svg('lock')), { buzz: 'tick', sound: null });
            }))),
          ),
        !have ? press(h('button.btn.primary.cut', {
          type: 'button',
          onclick: (e) => {
            if (!buyWeapon(ctx.save, w.id)) { toast(t('shop.short'), { kind: 'bad' }); return deny(e.currentTarget); }
            ui('reward'); toast(t('shop.bought', { w: WEAPONS[w.id].name }), { kind: 'good' });
            refreshCur(); renderList(); renderDetail();
          },
        }, svg('coin'), t('shop.buyFor', { n: num(w.price || 0) })), { sound: null, buzz: 'soft' })
          : press(h(`button.btn.${equipped ? 'secondary' : 'primary'}.cut`, {
          type: 'button', 'aria-disabled': equipped ? 'true' : 'false',
          onclick: (e) => {
            if (equipped) return deny(e.currentTarget);
            ui('confirm');
            ctx.save.set((s) => { const L = s.roster.loadout[op]; if (w.slot === 'side') L.sidearm = w.id; else { L.primary = w.id; if (L.sidearm === w.id) L.sidearm = null; } });
            toast(t('ars.equipped', { w: WEAPONS[w.id].name, o: opName(op) }), { kind: 'good' });
            ctx.showcase.setOperator(op, ctx.save.d.roster.loadout[op]);
            renderDetail();
          },
        }, svg(equipped ? 'check' : 'gun'), t(equipped ? 'ars.inUse' : 'ars.equip', { o: opName(op) })), { sound: null }));
    }
    renderList(); renderDetail();
    const el = h('div', hubbar(ctx, 'arsenal'), h('div.ars-body.veil', left, detail));
    return { el, show() { ctx.showcase.frame(0.5, 160); popIn(grid.children, { step: 20 }); } };
  },
};
