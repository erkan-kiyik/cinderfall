// HAWK's stall: four goods a day and one special a week, the same for
// everyone on a given day (seeded by the date). Weapons, finishes for the
// weapons you own, and crates at a discount (they wait in stock).
import { h, svg, press, popIn, ui, deny, toast } from '../kit.js';
import { t, num } from '../i18n.js';
import { hubbar, refreshCur } from './common.js';
import { weaponPic, hawkPic, crateArt } from '../portraits.js';
import { WEAPONS } from '../../art/weapons/index.js';
import { CRATES } from '../data.js';
import { SKIN, traderStock, traderBuy, traderSold, owns, hasSkin } from '../../core/economy.js';

export const trader = {
  mount(ctx) {
    const left = h('div.card.cut.hawk-card',
      h('div.portrait', hawkPic(360), h('div.h1', 'HAWK')),
      h('div.eyebrow.accent', h('span.dot'), t('trader.k')),
      h('p.body.typed', { style: { margin: 0, fontSize: '12px' } }, t('trader.bio')),
      h('div.quote', t('trader.line')));
    const timer = h('div.h3.num', '—');
    const shelf = h('div.shelf');
    let tiles = [];
    function item(it, weekly) {
      const d = ctx.save.d;
      const sold = traderSold(d, it) || (it.kind === 'weapon' && owns(d, it.weapon)) || (it.kind === 'skin' && hasSkin(d, it.weapon, it.skin));
      const name = it.kind === 'weapon' ? WEAPONS[it.weapon].name : it.kind === 'skin' ? `${t(`skin.${it.skin}`)} · ${WEAPONS[it.weapon].name}` : t(`crate.${it.id}`);
      const pic = it.kind === 'crate'
        ? crateArt(CRATES.find((c) => c.id === it.id).color, weekly ? 56 : 44)
        : weaponPic(it.weapon, weekly ? 220 : 120, weekly ? 44 : 30, it.kind === 'skin' ? SKIN[it.skin].tint : null);
      const buy = press(h(`button.btn.${sold ? 'secondary' : 'primary'}.cut.sm`, {
        type: 'button', 'aria-disabled': sold ? 'true' : 'false',
        onclick: (e) => {
          if (sold) return deny(e.currentTarget);
          if (!traderBuy(ctx.save, it)) { toast(t('shop.short'), { kind: 'bad' }); return deny(e.currentTarget); }
          ui('reward'); toast(t('shop.bought', { w: name }), { kind: 'good' });
          refreshCur(); render();
        },
      }, sold ? [svg('check'), t('trader.sold')] : [svg('coin'), num(it.price)]), { sound: null, buzz: 'soft' });
      return h(`div.tile.ware.cut${sold ? '.sold' : ''}`, { style: { '--rar': `var(--r-${it.rar})`, ...(weekly ? { gridColumn: 'span 2' } : {}) } },
        h(`div.eyebrow${weekly ? '.accent' : ''}`, weekly ? t('trader.weekly') : t(`trader.kind.${it.kind}`)),
        h('div.pic', pic),
        h('b', name),
        buy);
    }
    function render() {
      const st = traderStock(ctx.save.d);
      tiles = [...st.daily.map((it) => item(it, false)), item(st.weekly, true)];
      shelf.replaceChildren(...tiles);
    }
    render();
    const tick = () => { const n = new Date(), e = new Date(n); e.setHours(24, 0, 0, 0); const s = Math.floor((e - n) / 1000); timer.textContent = `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; if (s <= 1) setTimeout(render, 1500); };
    tick(); const iv = setInterval(tick, 1000);
    const right = h('section', { style: { display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 } },
      h('div.wide-row', { style: { minHeight: '30px' } }, h('div.eyebrow', t('trader.goods')), h('div.tag', h('div.eyebrow', t('trader.refresh')), timer)),
      shelf);
    const el = h('div', hubbar(ctx, 'trader'), h('div.trader-body.veil', left, right));
    return { el, show() { ctx.showcase.frame(0.5, 170); popIn(tiles); }, dispose() { clearInterval(iv); } };
  },
};
