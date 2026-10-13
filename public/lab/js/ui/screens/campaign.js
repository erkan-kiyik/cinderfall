// Campaign: the Ash Line across three acts, ten missions. A mission's
// details, best result and difficulty on the right; preparation from there.
import { h, svg, press, popIn, ui, deny } from '../kit.js';
import { t, clock } from '../i18n.js';
import { shead, stars } from './common.js';
import { MISSIONS } from '../data.js';

export const campaign = {
  mount(ctx, params) {
    const d = ctx.save.d;
    let sel = params.sel || MISSIONS.find((m) => m.ready && !(d.campaign[m.id] && d.campaign[m.id].done))?.id || 'm1';
    const map = h('div.map');
    // route lines between the missions
    const NS = 'http://www.w3.org/2000/svg';
    const lines = document.createElementNS(NS, 'svg');
    lines.setAttribute('class', 'lines'); lines.setAttribute('viewBox', '0 0 100 100'); lines.setAttribute('preserveAspectRatio', 'none');
    for (let i = 0; i < MISSIONS.length - 1; i++) {
      const a = MISSIONS[i], b = MISSIONS[i + 1], l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', a.x * 100); l.setAttribute('y1', a.y * 100); l.setAttribute('x2', b.x * 100); l.setAttribute('y2', b.y * 100);
      const done = d.campaign[a.id] && d.campaign[a.id].done;
      l.setAttribute('stroke', done ? '#ff6b2c' : 'rgba(217,222,229,0.22)');
      l.setAttribute('stroke-width', '0.5'); l.setAttribute('stroke-dasharray', done ? '0' : '1.2 1.2');
      l.setAttribute('vector-effect', 'non-scaling-stroke');
      l.style.strokeWidth = '2px';
      lines.appendChild(l);
    }
    map.appendChild(lines);
    for (const [act, x] of [[1, 0.04], [2, 0.42], [3, 0.78]]) map.appendChild(h('div.act-label', { style: { left: `${x * 100}%`, top: '8%' } }, t('camp.act', { n: act }), ' · ', t(`camp.act${act}`)));
    const nodes = MISSIONS.map((m) => {
      const c = d.campaign[m.id];
      const state = !m.ready ? 'locked' : c && c.done ? 'done' : 'open';
      const n = press(h(`button.node.${state}`, {
        type: 'button', style: { left: `${m.x * 100}%`, top: `${m.y * 100}%` },
        'aria-label': t(`mission.${m.id}`),
        onclick: () => { sel = m.id; ui('tab'); render(); },
      },
      h('span.pin', m.ready ? (m.boss ? svg('skull') : m.id.slice(1)) : svg('lock')),
      h('span.nm', t(`mission.${m.id}`)),
      c ? stars(c.stars) : null), { buzz: 'tick', sound: null });
      n.dataset.id = m.id;
      map.appendChild(n);
      return n;
    });
    const side = h('aside.mdetail');
    let diff = d.settings.diff;
    function render() {
      for (const n of nodes) n.classList.toggle('on', n.dataset.id === sel);
      const m = MISSIONS.find((x) => x.id === sel), c = d.campaign[m.id];
      const seg = h('div.seg', ['normal', 'hard'].map((k) => press(h(`button${diff === k ? '.on' : ''}`, { type: 'button', onclick: () => { diff = k; ctx.save.set((s) => { s.settings.diff = k; }); render(); } }, t(`diff.${k}`)), { buzz: 'tick', sound: 'tab' })));
      const go = press(h('button.btn.primary.lg.cut', {
        type: 'button', 'aria-disabled': m.ready ? 'false' : 'true',
        onclick: (e) => { if (!m.ready) return deny(e.currentTarget); ui('confirm'); ctx.router.go('prep', { mission: m.id, diff }); },
      }, m.ready ? t('camp.prepare') : t('ui.soon'), svg('arrow')), { sound: null, buzz: m.ready ? 'soft' : null });
      side.replaceChildren(...[
        h('div.eyebrow.accent', t('camp.act', { n: m.act }), ' · ', t('camp.mission', { n: m.id.slice(1) })),
        h('div.h1', { style: { fontSize: '28px' } }, t(`mission.${m.id}`)),
        h('div.eyebrow', t(`mission.${m.id}.where`)),
        h('div.grow.scroll.fade',
          m.ready
            ? [h('p.body', { style: { margin: '6px 0', fontSize: '12.5px' } }, t(`mission.${m.id}.brief`)),
              h('ol.obj', [1, 2, 3, 4].map((i) => h('li', t(`mission.${m.id}.o${i}`))))]
            : h('div.empty.cut', { style: { marginTop: '8px' } }, svg('lock'), h('b', t('camp.locked')), h('span', t('camp.lockedHint')))),
        c && h('div.wide-row', stars(c.stars, 18), h('div.tag', h('div.eyebrow', t('camp.best')), h('div.h3', c.best !== null ? clock(c.best) : '—'))),
        m.ready && h('div.diff-row', h('div.eyebrow', t('camp.diff')), seg),
        go].filter(Boolean));
    }
    render();
    const el = h('div', shead(ctx, t('camp.title'), t('camp.kicker')), h('div.camp-body.veil', map, side));
    // the operator waits behind the mission panel
    return { el, show() { ctx.showcase.frame(0.86, 170); popIn(nodes, { step: 30 }); } };
  },
};
