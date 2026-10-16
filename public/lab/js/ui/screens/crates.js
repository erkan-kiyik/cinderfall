// Crates: the three crate types with their odds in plain view, the pity
// rule and the price. Buy one and it opens on the spot; crates bought from
// HAWK wait in stock and open for free. The reveal: the crate shakes, bursts
// in its rarity's colour and shows the finish on the weapon it landed on.
import { h, svg, press, popIn, deny, ui, haptic, modal, toast, reduced } from '../kit.js';
import { t, num } from '../i18n.js';
import { hubbar, refreshCur } from './common.js';
import { CRATES } from '../data.js';
import { SKIN, buyCrate, crateFromStock } from '../../core/economy.js';
import { weaponPic } from '../portraits.js';
import { WEAPONS } from '../../art/weapons/index.js';

export function reveal(res, crate) {
  const sk = SKIN[res.skin], col = `var(--r-${res.rar})`;
  const box = h('div.crate-open', { style: { '--rar': col, '--c': crate.color } },
    h('div.cr-art', svg('crate')),
    h('div.cr-res', { hidden: true },
      h('div.eyebrow', { style: { color: col } }, t(`rar.${res.rar}`)),
      h('div.h2', t(`skin.${sk.id}`)),
      h('div.cr-gun', weaponPic(res.weapon, 260, 64, sk.tint)),
      h('div.eyebrow', WEAPONS[res.weapon].name),
      res.dup ? h('div.cr-dup', svg('coin'), t('crate.dup', { n: num(res.refund) })) : h('div.cr-new', t('crate.new'))));
  const close = modal({ kicker: t(`crate.${crate.id}`), body: box, actions: [{ label: t('ui.ok'), kind: 'primary' }] });
  const art = box.querySelector('.cr-art'), out = box.querySelector('.cr-res');
  const show = () => {
    art.hidden = true; out.hidden = false;
    ui(['legendary', 'mythic', 'ultra'].includes(res.rar) ? 'levelup' : 'reward'); haptic('success');
    if (!reduced() && out.animate) out.animate([{ opacity: 0, transform: 'scale(0.8)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.3,1.5,.5,1)' });
  };
  if (reduced() || !art.animate) show();
  else {
    haptic('tick');
    art.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg) scale(1.04)' }, { transform: 'rotate(6deg) scale(1.08)' }, { transform: 'rotate(-4deg) scale(1.12)' }, { transform: 'rotate(0) scale(1.3)', filter: 'brightness(3)' }], { duration: 900, easing: 'ease-in' }).onfinish = show;
  }
  return close;
}

export const crates = {
  mount(ctx) {
    const wrap = h('div.three.veil');
    function render() {
      const d = ctx.save.d;
      const cards = CRATES.map((c) => {
        const stock = d.inv.crates[c.id] || 0;
        const open = (e) => {
          const res = stock > 0 ? crateFromStock(ctx.save, c.id) : buyCrate(ctx.save, c.id);
          if (!res) { toast(t('shop.short'), { kind: 'bad' }); return deny(e.currentTarget); }
          ui('confirm'); refreshCur(); render();
          reveal(res, c);
        };
        return h('div.tile.crate.cut', { style: { '--c': c.color } },
          h('div.eyebrow.accent', t(`crate.${c.id}.k`)),
          h('div.h2', t(`crate.${c.id}`)),
          h('div.art', svg('crate'), stock > 0 && h('span.stock', `×${stock}`)),
          h('div.odds', c.odds.map(([r, p]) => [h('span', t(`rar.${r}`)), h('b', { style: { '--rar': `var(--r-${r})` } }, `%${p}`)])),
          press(h(`button.btn.${stock > 0 ? 'primary' : 'secondary'}.cut`, { type: 'button', onclick: open },
            stock > 0 ? [svg('crate'), t('crate.openFree')] : [svg('coin'), num(c.price), h('span', t('crate.open'))]), { sound: null, buzz: 'soft' }));
      });
      wrap.replaceChildren(...cards);
      return cards;
    }
    const cards = render();
    const el = h('div', hubbar(ctx, 'crates'), wrap, h('p.rules.veil', t('crate.rules')));
    return { el, show() { ctx.showcase.frame(0.5, 170); popIn(cards); } };
  },
};
