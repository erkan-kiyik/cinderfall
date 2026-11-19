// Settings: graphics, sound, controls (with the HUD editor), accessibility,
// language, privacy & legal (with the build info). Every change is saved and
// applied live.
import { h, svg, press, popIn, ui, modal, toast, haptic } from '../kit.js';
import { t, LANG_NAMES } from '../i18n.js';
import { shead } from './common.js';
import { errors, errorsText, clearErrors } from '../../core/errlog.js';
import { KEYS_DEFAULT, KEY_ACTIONS, keyName } from '../../game/input.js';

export const settings = {
  mount(ctx, params) {
    let tab = params.tab || 'graphics';
    const S = ctx.save;
    const set = (fn) => { S.set(fn); ctx.applySettings(); };
    const nav = h('nav.set-tabs');
    const body = h('div.rows.scroll', { style: { minHeight: 0 } });
    // from a paused mission: what can change mid-mission, nothing that leaves it (docs §10.41)
    const inGame = !!params.inGame;
    const TABS = [['graphics', 'eye'], ['sound', 'sound'], ['controls', 'pad'], ['access', 'user'], ['lang', 'globe'], ['legal', 'shield']].filter(([k]) => !inGame || k !== 'legal');

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
      nav.replaceChildren(...TABS.map(([k, ic]) => press(h(`button${k === tab ? '.on' : ''}`, { type: 'button', onclick: () => { if (k !== tab) { tab = params.tab = k; ui('tab'); render(); } } }, svg(ic), t(`set.${k}`)), { buzz: 'tick', sound: null })));
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
          !inGame && action(t('set.bench'), t('set.benchHint'), t('set.benchRun'), () => modal({ kicker: t('bench.kicker'), title: t('set.bench'), body: t('bench.confirm'),
            actions: [{ label: t('ui.cancel'), kind: 'ghost' }, { label: t('set.benchRun'), kind: 'primary', fn: (close) => { close(); ctx.runBench(); } }] })),
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
          seg(t('set.assist'), t('set.assistHint'), [['off', t('set.off')], ['low', t('set.assistLow')], ['high', t('set.assistHigh')]], () => st.aimAssist, (s, v) => { s.settings.aimAssist = v; }),
          range(t('set.sens'), t('set.sensHint'), 0.5, 2, 0.1, () => st.aimSens, (s, v) => { s.settings.aimSens = v; }, (v) => `×${v.toFixed(1)}`),
          toggle(t('set.haptics'), t('set.hapticsHint'), () => st.haptics, (s, v) => { s.settings.haptics = v; }),
          action(t('set.keys'), t('set.keysHint'), t('set.keysEdit'), keysModal),
          row(t('set.pad'), t('set.padHint')),
          action(t('set.coach'), t('set.coachHint'), t('set.coachAgain'), () => { S.set((s) => { s.tutorial = false; }); toast(t('set.coachDone')); }),
        ];
      } else if (tab === 'access') {
        rows = [
          range(t('set.uiScale'), t('set.uiScaleHint'), 0.85, 1.15, 0.05, () => st.uiScale, (s, v) => { s.settings.uiScale = v; s.settings.uiScaleBy = 'player'; }),
          seg(t('set.enemyMark'), t('set.enemyMarkHint'), [['off', t('set.off')], ['yellow', t('set.yellow')], ['blue', t('set.blue')], ['magenta', t('set.magenta')]], () => st.enemyMark, (s, v) => { s.settings.enemyMark = v; }),
          range(t('set.shake'), t('set.shakeHint'), 0, 1, 0.1, () => st.shake, (s, v) => { s.settings.shake = v; }),
          toggle(t('set.reduce'), t('set.reduceHint'), () => st.reduceMotion, (s, v) => { s.settings.reduceMotion = v; }),
          !inGame && action(t('set.prologue'), t('set.prologueHint'), t('set.watch'), () => ctx.playStory?.('prologue')),
        ];
      } else if (tab === 'lang') {
        // ten languages: a grid of their own names, each set in its own script (docs §10.38)
        const grid = h('div.lang-grid', ...Object.entries(LANG_NAMES).map(([v, l]) => press(h(`button.cut${st.lang === v ? '.on' : ''}`, { type: 'button', lang: v, dir: 'auto', 'aria-pressed': String(st.lang === v),
          onclick: () => { if (st.lang === v) return; set((s) => { s.settings.lang = v; }); ui('tab'); } }, l), { sound: null, buzz: 'tick' })));
        rows = [h('div.row.cut.lang-row', h('div.lbl', h('b', t('set.language')), h('small', t('set.languageHint'))), grid)];
      } else {
        rows = [
          action(t('set.privacy'), t('set.privacyHint'), t('set.open'), () => ctx.router.go('legal', { mode: 'manage' })),
          action(t('set.readPrivacy'), null, t('set.read'), () => ctx.router.go('legal', { mode: 'manage', doc: 'privacy' })),
          action(t('set.readTerms'), null, t('set.read'), () => ctx.router.go('legal', { mode: 'manage', doc: 'terms' })),
          action(t('set.resetProgress'), t('set.resetHint'), t('set.reset'), () => modal({ kicker: t('set.legal'), title: t('set.resetProgress'), body: t('set.resetConfirm'),
            actions: [{ label: t('ui.cancel'), kind: 'ghost' }, { label: t('set.reset'), kind: 'danger', fn: (close) => { S.reset(); ctx.applySettings(); close(); toast(t('set.resetDone')); ctx.router.go('lobby', {}, { root: true }); } }] }), 'danger'),
          action(t('set.errlog'), t('set.errlogHint', { n: errors().length }), t('set.errlogShow'), () => {
            const text = errorsText() || t('set.errlogNone');
            modal({ kicker: t('set.legal'), title: t('set.errlog'), body: h('pre.bench-report', text),
              actions: [{ label: t('bench.copy'), kind: 'primary', fn: () => ctx.copyText(text) },
                { label: t('set.errlogClear'), kind: 'ghost', fn: (close) => { clearErrors(); close(); render(); toast(t('set.errlogCleared')); } }] });
          }),
          h('div.grp', t('set.about')),
          row('KOR', t('set.aboutHint')),
          row(t('set.build'), `${ctx.version}`),
          row(t('set.engine'), t('set.engineHint')),
        ];
      }
      rows = rows.filter(Boolean);
      body.replaceChildren(...rows);
      popIn(rows, { step: 25, from: 8 });
    }
    // the keyboard's keys: tap an action, press the key; a key taken by another action swaps with it
    function keysModal() {
      const ctl = ctx.controls;
      const list = h('div.keys');
      const draw = () => {
        const K = { ...KEYS_DEFAULT, ...(S.d.settings.keys || {}) };
        list.replaceChildren(...KEY_ACTIONS.map((a) => {
          const b = press(h('button.btn.sm.secondary.cut.key', { type: 'button', onclick: () => {
            if (!ctl) return;
            b.textContent = t('set.keyPress'); b.classList.add('wait');
            ctl.capture = (code) => {
              if (code !== 'Escape') {
                set((s) => {
                  const k = { ...KEYS_DEFAULT, ...(s.settings.keys || {}) };
                  const other = KEY_ACTIONS.find((x) => x !== a && k[x] === code);
                  if (other) k[other] = k[a];
                  k[a] = code;
                  s.settings.keys = k;
                });
                ui('tab');
              }
              draw();
            };
          } }, keyName(K[a])), { sound: 'tap' });
          return h('div.keyrow', h('span', t(`key.${a}`)), b);
        }));
      };
      draw();
      modal({ kicker: t('set.controls'), title: t('set.keys'), body: list, cls: 'wide',
        actions: [{ label: t('set.keysReset'), kind: 'ghost', fn: () => { set((s) => { s.settings.keys = null; }); draw(); } }, { label: t('ui.ok'), kind: 'primary', fn: (close) => { if (ctl) ctl.capture = null; close(); } }] });
    }
    render();
    const el = h('div', shead(ctx, t('set.title'), inGame ? t('game.paused') : null), h('div.set-body.veil', nav, body));
    return { el, show() { ctx.showcase.frame(0.5, 170); }, refresh: render };
  },
};
