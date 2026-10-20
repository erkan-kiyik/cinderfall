// Campaign: the Ash Line across three acts, ten missions. A mission's
// details, best result and difficulty on the right; preparation from there.
import { h, svg, press, popIn, ui, deny } from '../kit.js';
import { t, clock } from '../i18n.js';
import { shead, stars } from './common.js';
import { MISSIONS } from '../data.js';

// the missions that have a photograph of their place (the cinematics' plates)
const plate = (n) => new URL(`../../../assets/plates/${n}.webp`, import.meta.url).href;
const PHOTO = { m1: plate('gate'), m2: plate('market'), m3: plate('governor') };

export const campaign = {
  mount(ctx, params) {
    const d = ctx.save.d;
    let sel = params.sel || [...MISSIONS].reverse().find((m) => m.ready && (MISSIONS.indexOf(m) === 0 || (d.campaign[MISSIONS[MISSIONS.indexOf(m) - 1].id] || {}).done))?.id || 'm1';
    const map = h('div.map');
    // route lines between the missions
    const NS = 'http://www.w3.org/2000/svg';
    const lines = document.createElementNS(NS, 'svg');
    lines.setAttribute('class', 'lines'); lines.setAttribute('viewBox', '0 0 100 100'); lines.setAttribute('preserveAspectRatio', 'none');
    for (let i = 0; i < MISSIONS.length - 1; i++) {
      const a = MISSIONS[i], b = MISSIONS[i + 1], l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', a.x * 100); l.setAttribute('y1', a.y * 100); l.setAttribute('x2', b.x * 100); l.setAttribute('y2', b.y * 100);
      const done = d.campaign[a.id] && d.campaign[a.id].done;
      l.setAttribute('stroke', done ? '#b8352b' : 'rgba(58,44,30,0.5)');
      l.setAttribute('stroke-width', '0.5'); l.setAttribute('stroke-dasharray', done ? '0' : '1.2 1.2');
      l.setAttribute('vector-effect', 'non-scaling-stroke');
      l.style.strokeWidth = done ? '2.5px' : '1.5px';
      lines.appendChild(l);
    }
    map.appendChild(lines);
    for (const [act, x] of [[1, 0.04], [2, 0.42], [3, 0.78]]) map.appendChild(h('div.act-label', { style: { left: `${x * 100}%`, top: '8%' } }, t('camp.act', { n: act }), ' · ', t(`camp.act${act}`)));
    // a mission opens once the one before it is done
    const open = (m) => { const i = MISSIONS.indexOf(m); return m.ready && (i === 0 || !!(d.campaign[MISSIONS[i - 1].id] && d.campaign[MISSIONS[i - 1].id].done)); };
    const nodes = MISSIONS.map((m) => {
      const c = d.campaign[m.id];
      const state = !open(m) ? 'locked' : c && c.done ? 'done' : 'open';
      const n = press(h(`button.node.${state}`, {
        type: 'button', style: { left: `${m.x * 100}%`, top: `${m.y * 100}%` },
        'aria-label': t(`mission.${m.id}`),
        onclick: () => { sel = m.id; ui('tab'); render(); },
      },
      h('span.pin', open(m) ? (m.boss ? svg('skull') : m.id.slice(1)) : svg('lock')),
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
      const ok = open(m);
      const go = press(h('button.btn.primary.lg.cut', {
        type: 'button', 'aria-disabled': ok ? 'false' : 'true',
        onclick: (e) => { if (!ok) return deny(e.currentTarget); ui('confirm'); ctx.router.go('prep', { mission: m.id, diff }); },
      }, ok ? t('camp.prepare') : m.ready ? t('camp.locked') : t('ui.soon'), svg('arrow')), { sound: null, buzz: ok ? 'soft' : null });
      side.replaceChildren(...[
        h('div.stamp', t('camp.stamp')),
        h('div.eyebrow.accent', t('camp.act', { n: m.act }), ' · ', t('camp.mission', { n: m.id.slice(1) })),
        h('div.h1', { style: { fontSize: '28px' } }, t(`mission.${m.id}`)),
        h('div.eyebrow', t(`mission.${m.id}.where`)),
        // the place, photographed, taped to the brief
        PHOTO[m.id] && h('div.photo', { style: { backgroundImage: `url(${PHOTO[m.id]})` } }),
        h('div.grow.scroll.fade',
          m.ready
            ? [h('p.body', { style: { margin: '6px 0', fontSize: '12.5px' } }, t(`mission.${m.id}.brief`)),
              h('ol.obj', [1, 2, 3, 4].map((i) => h('li', t(`mission.${m.id}.o${i}`))))]
            : h('div.empty.cut', { style: { marginTop: '8px' } }, svg('lock'), h('b', t('camp.locked')), h('span', t('camp.lockedHint')))),
        m.ready && !ok && h('div.empty.cut', { style: { marginTop: '4px' } }, svg('lock'), h('span', t('camp.needPrev'))),
        c && h('div.wide-row', stars(c.stars, 18), h('div.tag', h('div.eyebrow', t('camp.best')), h('div.h3', c.best !== null ? clock(c.best) : '—'))),
        // the difficulty and, beside it, the mission's scene to watch again
        ok && h('div.diff-row', h('div.eyebrow', t('camp.diff')), seg,
          ctx.hasStory?.(m.id) && press(h('button.btn.ghost.sm.cut.scene-btn', { type: 'button', onclick: () => ctx.playStory(m.id) }, svg('play'), t('camp.scene')), { sound: 'tap' })),
        go].filter(Boolean));
    }
    render();
    const el = h('div', shead(ctx, t('camp.title'), t('camp.kicker')), h('div.camp-body.veil', map, side));
    // the operator waits behind the mission panel
    return { el, show() { ctx.showcase.frame(0.86, 170); popIn(nodes, { step: 30 }); } };
  },
};
