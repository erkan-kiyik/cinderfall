// Legal gate: the screen a player must pass before the game starts, and the
// same screen reopened from Settings to review documents, change consent or
// delete their data.
//
// Rules it enforces:
//  - the Terms must be accepted and the Privacy Notice acknowledged to play;
//  - under 18, a parent/guardian confirmation is also required;
//  - advertising consent is a separate, optional, unticked choice, never a
//    condition of playing (KVKK açık rıza / GDPR Art. 7(4));
//  - personalised ads are a further separate choice, offered to adults only;
//  - in the US the model is notice + "Do Not Sell or Share" opt-out;
//  - where ads are unavailable (region or age) no ad choice is offered at all.
import { CONTROLLER } from './controller.js';
import { COUNTRIES, docLangsFor, guessCountry, profileOf } from './jurisdictions.js';
import { buildDoc, renderDoc, textsFor, countryName, LANG_NAMES } from './docs.js';
import {
  getConsent, needsAcceptance, saveConsent, adPolicy, ageOf, deleteAllData,
} from './consent.js';
import { getLang } from '../engine/i18n.js';

let root = null;
let form = null;
let mode = 'gate';           // 'gate' | 'manage'
let resolveGate = null;
let reader = null;           // { kind } while a document is open

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function defaultLang(country, preferred) {
  const langs = docLangsFor(country);
  if (preferred && langs.includes(preferred)) return preferred;
  const g = getLang();
  if (langs.includes(g)) return g;
  return langs[0];
}

function initialForm() {
  const s = getConsent();
  const country = (s && s.country) || guessCountry() || '';
  return {
    country,
    lang: defaultLang(country, s && s.lang),
    birthYear: (s && s.birthYear) || '',
    // a new document version must be accepted again, so these start unticked
    terms: mode === 'manage' && !needsAcceptance(s),
    privacy: mode === 'manage' && !needsAcceptance(s),
    guardian: !!(s && s.guardian),
    ads: !!(s && s.ads),
    personal: !!(s && s.personal),
    doNotSell: !!(s && s.doNotSell),
  };
}

function ensureRoot() {
  if (root) return root;
  root = el('div', 'lg-overlay hidden');
  root.id = 'legal-gate';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  document.body.appendChild(root);
  return root;
}

function checkbox(label, checked, onChange, required, U) {
  const row = el('label', 'lg-check' + (required ? ' req' : ''));
  const box = el('input');
  box.type = 'checkbox';
  box.checked = !!checked;
  box.addEventListener('change', () => onChange(box.checked));
  const txt = el('span', 'lg-check-text', label);
  if (required) {
    const tag = el('span', 'lg-req', U.required);
    txt.appendChild(document.createTextNode(' '));
    txt.appendChild(tag);
  }
  row.append(box, txt);
  return row;
}

function selectRow(label, options, value, onChange, placeholder) {
  const wrap = el('label', 'lg-field');
  wrap.appendChild(el('span', 'lg-field-label', label));
  const sel = el('select', 'lg-select');
  if (placeholder) {
    const o = el('option', null, placeholder);
    o.value = ''; o.disabled = true; o.selected = !value;
    sel.appendChild(o);
  }
  for (const [v, t] of options) {
    const o = el('option', null, t);
    o.value = String(v);
    if (String(v) === String(value)) o.selected = true;
    sel.appendChild(o);
  }
  sel.addEventListener('change', () => onChange(sel.value));
  wrap.appendChild(sel);
  return wrap;
}

function render() {
  const r = ensureRoot();
  const L = textsFor(form.lang);
  const U = L.ui;
  r.textContent = '';
  r.dir = L.rtl ? 'rtl' : 'ltr';
  r.lang = form.lang;

  const panel = el('div', 'lg-panel');
  r.appendChild(panel);

  if (reader) {
    const bar = el('div', 'lg-reader-bar');
    const back = el('button', 'btn lg-back', `‹ ${U.back}`);
    back.type = 'button';
    back.addEventListener('click', () => { reader = null; render(); });
    bar.appendChild(back);
    panel.appendChild(bar);
    const doc = el('div', 'lg-doc');
    renderDoc(doc, buildDoc(reader.kind, form.lang, form.country || 'XX'));
    panel.appendChild(doc);
    panel.scrollTop = 0;
    return;
  }

  panel.appendChild(el('div', 'lg-kicker', `${CONTROLLER.game} // ${U.manage}`));
  panel.appendChild(el('h2', 'lg-title', mode === 'manage' ? U.manage : U.title));
  panel.appendChild(el('p', 'lg-intro', U.intro));

  // country + document language + year of birth
  const fields = el('div', 'lg-fields');
  const countries = COUNTRIES
    .map((c) => [c, countryName(c, form.lang)])
    .sort((a, b) => a[1].localeCompare(b[1], form.lang));
  fields.appendChild(selectRow(U.country, countries, form.country, (v) => {
    form.country = v;
    form.lang = defaultLang(v, form.lang);
    render();
  }, U.select));
  const langs = docLangsFor(form.country).map((l) => [l, LANG_NAMES[l]]);
  fields.appendChild(selectRow(U.docLang, langs, form.lang, (v) => { form.lang = v; render(); }));
  const now = new Date().getFullYear();
  const years = [];
  for (let y = now; y >= now - 100; y--) years.push([y, String(y)]);
  fields.appendChild(selectRow(U.birthYear, years, form.birthYear, (v) => {
    form.birthYear = Number(v);
    render();
  }, U.select));
  panel.appendChild(fields);

  const ul = el('ul', 'lg-summary');
  for (const s of U.summary) ul.appendChild(el('li', null, s));
  panel.appendChild(ul);

  const ready = !!form.country && !!form.birthYear;
  const P = profileOf(form.country || 'XX');
  const age = ageOf(form.birthYear);

  // document links
  const links = el('div', 'lg-links');
  const link = (label, kind) => {
    const b = el('button', 'btn lg-link', label);
    b.type = 'button';
    b.disabled = !form.country;
    b.addEventListener('click', () => { reader = { kind }; render(); });
    return b;
  };
  links.append(link(U.readPrivacy, 'privacy'), link(U.readTerms, 'terms'));
  panel.appendChild(links);

  // required confirmations
  const req = el('div', 'lg-checks');
  req.appendChild(checkbox(U.acceptTerms, form.terms, (v) => { form.terms = v; render(); }, true, U));
  req.appendChild(checkbox(U.ackPrivacy, form.privacy, (v) => { form.privacy = v; render(); }, true, U));
  const minor = ready && age < 18;
  if (minor) req.appendChild(checkbox(U.guardian, form.guardian, (v) => { form.guardian = v; render(); }, true, U));
  panel.appendChild(req);

  // advertising — optional and separate
  if (ready) {
    const box = el('div', 'lg-ads');
    box.appendChild(el('div', 'lg-ads-head', U.adsSection));
    const pol = adPolicy({ ...form, ads: true, personal: true });
    if (!P.ads) {
      box.appendChild(el('p', 'lg-ads-note', U.adsUnavailable));
    } else if (pol.reason === 'age') {
      box.appendChild(el('p', 'lg-ads-note', U.adsAge));
    } else if (P.model === 'optout') {
      box.appendChild(checkbox(U.doNotSell, form.doNotSell, (v) => { form.doNotSell = v; render(); }, false, U));
    } else {
      box.appendChild(checkbox(U.adsOptin, form.ads, (v) => {
        form.ads = v;
        if (!v) form.personal = false;
        render();
      }, false, U));
      const cl = el('button', 'btn lg-link small', U.readConsent);
      cl.type = 'button';
      cl.addEventListener('click', () => { reader = { kind: 'consent' }; render(); });
      box.appendChild(cl);
      if (form.ads && age >= 18) {
        box.appendChild(checkbox(U.adsPersonal, form.personal, (v) => { form.personal = v; render(); }, false, U));
      }
    }
    panel.appendChild(box);
  }

  const ok = ready && form.terms && form.privacy && (!minor || form.guardian);
  const accept = el('button', 'btn primary lg-accept', mode === 'manage' ? U.save : U.accept);
  accept.type = 'button';
  accept.disabled = !ok;
  accept.addEventListener('click', () => {
    if (!ok) return;
    const adult = age >= 18;
    saveConsent({
      country: form.country,
      lang: form.lang,
      birthYear: form.birthYear,
      terms: true,
      privacy: true,
      guardian: minor ? !!form.guardian : false,
      ads: P.model === 'optin' ? !!form.ads : false,
      personal: P.model === 'optin' && adult ? !!form.personal : false,
      doNotSell: P.model === 'optout' ? !!form.doNotSell : false,
    });
    close();
  });
  panel.appendChild(accept);

  if (mode === 'manage') {
    const row = el('div', 'lg-manage-row');
    const cancel = el('button', 'btn lg-link', U.close);
    cancel.type = 'button';
    cancel.addEventListener('click', close);
    const del = el('button', 'btn lg-danger', U.deleteData);
    del.type = 'button';
    del.addEventListener('click', () => {
      if (!window.confirm(U.deleteConfirm)) return;
      deleteAllData();
      location.reload();
    });
    row.append(cancel, del);
    panel.appendChild(row);
  }

  panel.appendChild(el('p', 'lg-footer', U.footer));
}

function open(m) {
  mode = m;
  reader = null;
  form = initialForm();
  ensureRoot().classList.remove('hidden');
  render();
}

function close() {
  if (!root) return;
  root.classList.add('hidden');
  root.textContent = '';
  reader = null;
  if (resolveGate) { const r = resolveGate; resolveGate = null; r(); }
}

// Resolves once the current documents are accepted. Immediate if they already are.
export function ensureAccepted() {
  if (!needsAcceptance()) return Promise.resolve();
  return new Promise((resolve) => {
    resolveGate = resolve;
    open('gate');
  });
}

// Settings entry point: review documents, change choices, delete data.
export function openPrivacySettings() { open('manage'); }

// Opens one document straight away (footer links).
export function openDocument(kind) {
  open(needsAcceptance() ? 'gate' : 'manage');
  reader = { kind };
  render();
}

// Label for the Settings row, in the game's current language.
export function privacyLabels() {
  const U = textsFor(getLang()).ui;
  return { title: U.manage, hint: U.manageHint, adsOff: U.adsOff };
}
