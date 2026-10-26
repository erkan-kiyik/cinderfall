// Settings: graphics, sound, controls (with the HUD editor), accessibility,
// language, privacy & legal (with the build info). Every change is saved and
// applied live.
import { h, svg, press, popIn, ui, modal, toast, haptic } from '../kit.js';
import { t, LANG_NAMES } from '../i18n.js';
import { shead } from './common.js';

export const settings = {
  mount(ctx, params) {
    let tab = params.tab || 'graphics';
    const S = ctx.save;
    const set = (fn) => { S.set(fn); ctx.applySettings(); };
    const nav = h('nav.set-tabs');
    const body = h('div.rows.scroll', { style: { minHeight: 0 } });
    const TABS = [['graphics', 'eye'], ['sound', 'sound'], ['controls', 'pad'], ['access', 'user'], ['lang', 'globe'], ['legal', 'shield']];

    const row = (label, hint, ...ctrl) => h('div.row.cut', h('div.lbl', h('b', label), hint && h('small', hint)), ...ctrl);
    const toggle = (label, hint, get, put) => {
      const sw = press(h('button.switch', { type: 'button', role: 'switch', 'aria-checked': String(!!get()), 'aria-label': label,
        onclick: () => { const v = !get(); set((s) => put(s, v)); sw.setAttribute('aria-checked', String(v)); ui('tab'); haptic('tick'); } }), { sound: null, buzz: null });
      return row(label, hint, sw);
    };
    const seg = (label, hint, opts, get, put) => {
      const box = h('div.seg');
      const draw = () => box.replaceChildren(...opts.map(([v, l]) => press(h(`button${get() === v ? '.on' : ''}`, { type: 'button', onclick: () => { set((s) => put(s, v)); ui('tab'); draw(); } }, l), { sound: null, buzz: 'tick' })));
      draw();
      return row(label, hint, box);
    };
    const range = (label, hint, min, max, step, get, put, fmt = (v) => `%${Math.round(v * 100)}`) => {
      const val = h('span.val.num', fmt(get()));
      const r = h('input.range', { type: 'range', min, max, step, value: get(), 'aria-label': label });
      const paint = () => r.style.setProperty('--p', `${((r.value - min) / (max - min)) * 100}%`);
      r.addEventListener('input', () => { const v = +r.value; val.textContent = fmt(v); paint(); set((s) => put(s, v)); });
      r.addEventListener('change', () => ui('tab'));
      paint();
      return row(label, hint, r, val);
    };
    const action = (label, hint, btn, fn, kind = 'secondary') => row(label, hint, press(h(`button.btn.sm.${kind}.cut`, { type: 'button', onclick: fn }, btn)));

    function render() {
      nav.replaceChildren(...TABS.map(([k, ic]) => press(h(`button${k === tab ? '.on' : ''}`, { type: 'button', onclick: () => { if (k !== tab) { tab = k; ui('tab'); render(); } } }, svg(ic), t(`set.${k}`)), { buzz: 'tick', sound: null })));
      const st = S.d.settings;
      let rows = [];
      if (tab === 'graphics') {
        rows = [
          seg(t('set.quality'), t('set.qualityHint'), [['auto', t('set.auto')], ['low', t('set.low')], ['med', t('set.med')], ['high', t('set.high')]], () => st.quality, (s, v) => { s.settings.quality = v; }),
          seg(t('set.fpsCap'), t('set.fpsCapHint'), [[30, '30'], [60, '60'], [0, t('set.fpsMax')]], () => st.fpsCap, (s, v) => { s.settings.fpsCap = v; }),
          toggle(t('set.dynres'), t('set.dynresHint'), () => st.dynRes, (s, v) => { s.settings.dynRes = v; }),
          toggle(t('set.bloom'), t('set.bloomHint'), () => st.bloom, (s, v) => { s.settings.bloom = v; }),
          toggle(t('set.lights'), t('set.lightsHint'), () => st.lights, (s, v) => { s.settings.lights = v; }),
          toggle(t('set.fps'), t('set.fpsHint'), () => st.fps, (s, v) => { s.settings.fps = v; }),
        ];
      } else if (tab === 'sound') {
        rows = [
          range(t('set.master'), null, 0, 1, 0.05, () => st.vol.master, (s, v) => { s.settings.vol.master = v; }),
          range(t('set.sfx'), null, 0, 1, 0.05, () => st.vol.sfx, (s, v) => { s.settings.vol.sfx = v; }),
          range(t('set.ui'), null, 0, 1, 0.05, () => st.vol.ui, (s, v) => { s.settings.vol.ui = v; }),
          range(t('set.music'), t('set.musicHint'), 0, 1, 0.05, () => st.vol.music, (s, v) => { s.settings.vol.music = v; }),
        ];
      } else if (tab === 'controls') {
        rows = [
          action(t('set.hud'), t('set.hudHint'), t('set.hudOpen'), () => ctx.router.go('hudedit')),
          range(t('set.fireRing'), t('set.fireRingHint'), 0.55, 0.95, 0.01, () => st.fireRing, (s, v) => { s.settings.fireRing = v; }),
          toggle(t('set.haptics'), t('set.hapticsHint'), () => st.haptics, (s, v) => { s.settings.haptics = v; }),
          row(t('set.keys'), t('set.keysHint')),
        ];
      } else if (tab === 'access') {
        rows = [
          range(t('set.uiScale'), t('set.uiScaleHint'), 0.85, 1.15, 0.05, () => st.uiScale, (s, v) => { s.settings.uiScale = v; }),
          seg(t('set.enemyMark'), t('set.enemyMarkHint'), [['off', t('set.off')], ['yellow', t('set.yellow')], ['blue', t('set.blue')], ['magenta', t('set.magenta')]], () => st.enemyMark, (s, v) => { s.settings.enemyMark = v; }),
          range(t('set.shake'), t('set.shakeHint'), 0, 1, 0.1, () => st.shake, (s, v) => { s.settings.shake = v; }),
          toggle(t('set.reduce'), t('set.reduceHint'), () => st.reduceMotion, (s, v) => { s.settings.reduceMotion = v; }),
          action(t('set.prologue'), t('set.prologueHint'), t('set.watch'), () => ctx.playStory?.('prologue')),
        ];
      } else if (tab === 'lang') {
        rows = [seg(t('set.language'), t('set.languageHint'), Object.entries(LANG_NAMES), () => st.lang, (s, v) => { s.settings.lang = v; })];
      } else {
        rows = [
          action(t('set.privacy'), t('set.privacyHint'), t('set.open'), () => ctx.router.go('legal', { mode: 'manage' })),
          action(t('set.readPrivacy'), null, t('set.read'), () => ctx.router.go('legal', { mode: 'manage', doc: 'privacy' })),
          action(t('set.readTerms'), null, t('set.read'), () => ctx.router.go('legal', { mode: 'manage', doc: 'terms' })),
          action(t('set.resetProgress'), t('set.resetHint'), t('set.reset'), () => modal({ kicker: t('set.legal'), title: t('set.resetProgress'), body: t('set.resetConfirm'),
            actions: [{ label: t('ui.cancel'), kind: 'ghost' }, { label: t('set.reset'), kind: 'danger', fn: (close) => { S.reset(); ctx.applySettings(); close(); toast(t('set.resetDone')); ctx.router.go('lobby', {}, { root: true }); } }] }), 'danger'),
          h('div.grp', t('set.about')),
          row('KOR', t('set.aboutHint')),
          row(t('set.build'), `${ctx.version}`),
          row(t('set.engine'), t('set.engineHint')),
        ];
      }
      body.replaceChildren(...rows);
      popIn(rows, { step: 25, from: 8 });
    }
    render();
    const el = h('div', shead(ctx, t('set.title'), null), h('div.set-body.veil', nav, body));
    return { el, show() { ctx.showcase.frame(0.5, 170); }, refresh: render };
  },
};
