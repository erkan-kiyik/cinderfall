// Legal: the gate before first play and the same screen from Settings.
// The rules and every text come unchanged from the shipping game's legal
// module (copied into js/legal/): Terms must be accepted and the Privacy
// Notice acknowledged; under 18 a guardian confirmation too; advertising
// consent is a separate optional choice (opt-in, or the US opt-out), offered
// only where ads exist and the age allows; personalised ads adults only.
import { h, svg, press, ui, modal } from '../kit.js';
import { COUNTRIES, docLangsFor, guessCountry, profileOf } from '../../legal/jurisdictions.js';
import { buildDoc, renderDoc, textsFor, countryName, LANG_NAMES } from '../../legal/docs.js';
import { getConsent, needsAcceptance, saveConsent, adPolicy, ageOf, deleteAllData } from '../../legal/consent.js';
import { CONTROLLER } from '../../legal/controller.js';
import { getLang } from '../i18n.js';

function defaultLang(country, preferred) {
  const langs = docLangsFor(country);
  if (preferred && langs.includes(preferred)) return preferred;
  const g = getLang();
  if (langs.includes(g)) return g;
  return langs[0];
}

export const legal = {
  mount(ctx, params) {
    const manage = params.mode === 'manage';
    const s0 = getConsent();
    const country = (s0 && s0.country) || guessCountry() || '';
    const F = {
      country, lang: defaultLang(country, s0 && s0.lang), birthYear: (s0 && s0.birthYear) || '',
      terms: manage && !needsAcceptance(s0), privacy: manage && !needsAcceptance(s0),
      guardian: !!(s0 && s0.guardian), ads: !!(s0 && s0.ads), personal: !!(s0 && s0.personal), doNotSell: !!(s0 && s0.doNotSell),
    };
    let reader = params.doc || null;
    const el = h('div');
    const select = (label, options, value, onChange, placeholder) => {
      const sel = h('select', { 'aria-label': label });
      if (placeholder) { const o = h('option', { value: '', disabled: true }, placeholder); if (!value) o.selected = true; sel.appendChild(o); }
      for (const [v, txt] of options) { const o = h('option', { value: String(v) }, txt); if (String(v) === String(value)) o.selected = true; sel.appendChild(o); }
      sel.addEventListener('change', () => onChange(sel.value));
      return h('label.field', h('span.eyebrow', label), sel);
    };
    const check = (label, on, set, req, U) => {
      const box = h('input', { type: 'checkbox' }); box.checked = !!on;
      box.addEventListener('change', () => { set(box.checked); ui('tab'); render(); });
      return h('label.check.cut', box, h('span', label, req && h('span.req', U.required)));
    };

    function render() {
      const L = textsFor(F.lang), U = L.ui;
      el.dir = L.rtl ? 'rtl' : 'ltr';
      if (reader) {
        const doc = h('div.doc');
        renderDoc(doc, buildDoc(reader, F.lang, F.country || 'XX'));
        const back = press(h('button.btn.icon.secondary.cut', { type: 'button', 'aria-label': U.back, onclick: () => { ui('back'); reader = null; render(); } }, svg('back')), { sound: null });
        el.replaceChildren(h('header.shead', back, h('div.ttl', h('div.eyebrow.accent', CONTROLLER.game), h('h1.h2', U.manage))),
          h('div.sbody.veil', h('div.card.cut.scroll', { style: { flex: 1, minHeight: 0 } }, doc)));
        return;
      }
      const ready = !!F.country && !!F.birthYear, P = profileOf(F.country || 'XX'), age = ageOf(F.birthYear), minor = ready && age < 18;
      const countries = COUNTRIES.map((c) => [c, countryName(c, F.lang)]).sort((a, b) => a[1].localeCompare(b[1], F.lang));
      const now = new Date().getFullYear(), years = [];
      for (let y = now; y >= now - 100; y--) years.push([y, String(y)]);
      const left = h('section.card.cut.scroll', { style: { display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 } },
        h('p.body', { style: { margin: 0, fontSize: '12px' } }, U.intro),
        select(U.country, countries, F.country, (v) => { F.country = v; F.lang = defaultLang(v, F.lang); render(); }, U.select),
        h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } },
          select(U.docLang, docLangsFor(F.country).map((l) => [l, LANG_NAMES[l]]), F.lang, (v) => { F.lang = v; render(); }),
          select(U.birthYear, years, F.birthYear, (v) => { F.birthYear = Number(v); render(); }, U.select)),
        h('ul', { style: { margin: 0, paddingLeft: '18px', font: '400 11px/1.5 var(--f-body)', color: 'var(--n6)' } }, U.summary.map((x) => h('li', x))),
        h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
          press(h('button.btn.ghost.sm.cut', { type: 'button', disabled: !F.country, onclick: () => { reader = 'privacy'; render(); } }, U.readPrivacy)),
          press(h('button.btn.ghost.sm.cut', { type: 'button', disabled: !F.country, onclick: () => { reader = 'terms'; render(); } }, U.readTerms))));
      const checks = [
        check(U.acceptTerms, F.terms, (v) => { F.terms = v; }, true, U),
        check(U.ackPrivacy, F.privacy, (v) => { F.privacy = v; }, true, U),
      ];
      if (minor) checks.push(check(U.guardian, F.guardian, (v) => { F.guardian = v; }, true, U));
      const ads = [];
      if (ready) {
        ads.push(h('div.grp', U.adsSection));
        const pol = adPolicy({ ...F, ads: true, personal: true });
        if (!P.ads) ads.push(h('p.muted', { style: { margin: 0, fontSize: '11px' } }, U.adsUnavailable));
        else if (pol.reason === 'age') ads.push(h('p.muted', { style: { margin: 0, fontSize: '11px' } }, U.adsAge));
        else if (P.model === 'optout') ads.push(check(U.doNotSell, F.doNotSell, (v) => { F.doNotSell = v; }, false, U));
        else {
          ads.push(check(U.adsOptin, F.ads, (v) => { F.ads = v; if (!v) F.personal = false; }, false, U));
          ads.push(press(h('button.btn.ghost.sm.cut', { type: 'button', onclick: () => { reader = 'consent'; render(); } }, U.readConsent)));
          if (F.ads && age >= 18) ads.push(check(U.adsPersonal, F.personal, (v) => { F.personal = v; }, false, U));
        }
      }
      const ok = ready && F.terms && F.privacy && (!minor || F.guardian);
      const accept = press(h('button.btn.primary.cut', { type: 'button', disabled: !ok, onclick: () => {
        if (!ok) return;
        const adult = age >= 18;
        saveConsent({
          country: F.country, lang: F.lang, birthYear: F.birthYear, terms: true, privacy: true,
          guardian: minor ? !!F.guardian : false,
          ads: P.model === 'optin' ? !!F.ads : false,
          personal: P.model === 'optin' && adult ? !!F.personal : false,
          doNotSell: P.model === 'optout' ? !!F.doNotSell : false,
        });
        ui('confirm');
        const lobby = () => ctx.router.go('lobby', { entrance: true }, { root: true });
        if (manage) ctx.router.back(); else if (ctx.playStory && !ctx.save.d.story.prologue) ctx.playStory('prologue', { then: lobby }); else lobby();
      } }, U[manage ? 'save' : 'accept']), { sound: null });
      const actions = h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' } }, accept,
        manage && press(h('button.btn.danger.sm.cut', { type: 'button', onclick: () => modal({ title: U.deleteData, body: U.deleteConfirm,
          actions: [{ label: U.close, kind: 'ghost' }, { label: U.deleteData, kind: 'danger', fn: () => { deleteAllData(); location.reload(); } }] }) }, U.deleteData)));
      const right = h('section.scroll', { style: { display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0 } }, checks, ads, actions,
        h('p.muted', { style: { margin: '4px 0 0', font: '400 10px/1.45 var(--f-body)' } }, U.footer));
      const head = manage
        ? h('header.shead', press(h('button.btn.icon.secondary.cut', { type: 'button', 'aria-label': U.back, onclick: () => { ui('back'); ctx.router.back(); } }, svg('back')), { sound: null }), h('div.ttl', h('div.eyebrow.accent', CONTROLLER.game), h('h1.h2', U.manage)))
        : h('header.shead', h('div.ttl', h('div.eyebrow.accent', `${CONTROLLER.game} · ${U.manage}`), h('h1.h2', U.title)));
      el.replaceChildren(head, h('div.legal-body.veil', left, right));
    }
    render();
    return {
      el, show() { ctx.showcase.frame(0.5, 170); },
      // the gate cannot be backed out of
      back: () => (!manage && !reader ? true : reader ? (reader = null, render(), true) : false),
    };
  },
};
