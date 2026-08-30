// Localization manager.
//
// Every user-facing string in the game resolves through `t(key)`. Static
// markup carries `data-i18n` (text content), `data-i18n-html` (innerHTML, for
// the few strings with inline <span> counters) or `data-i18n-attr` and is
// filled in by applyTranslations(); strings built at runtime call t() directly.
//
// The chosen language is persisted, and falls back to the device language on
// first launch — a Turkish handset should open in Turkish without the player
// hunting for a setting.

import { TR } from './lang/tr.js';
import { EN } from './lang/en.js';
import { ES } from './lang/es.js';
import { DE } from './lang/de.js';
import { RU } from './lang/ru.js';
import { AR } from './lang/ar.js';
import { HI } from './lang/hi.js';

const KEY = 'cinderfall.lang.v1';
const DICTS = { tr: TR, en: EN, es: ES, de: DE, ru: RU, ar: AR, hi: HI };
// Labels are in each language's own script — a player looking for their
// language scans for the word they recognise, not for its English name.
export const LANGS = [
  { code: 'en', label: 'ENGLISH' },
  { code: 'tr', label: 'TÜRKÇE' },
  { code: 'es', label: 'ESPAÑOL' },
  { code: 'de', label: 'DEUTSCH' },
  { code: 'ru', label: 'РУССКИЙ' },
  { code: 'ar', label: 'العربية', rtl: true },
  { code: 'hi', label: 'हिन्दी' },
];

const RTL = new Set(LANGS.filter((l) => l.rtl).map((l) => l.code));
export function isRtl(code = current) { return RTL.has(code); }

function detectDefault() {
  try {
    const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    // Match the base subtag, so es-MX, de-AT, ar-EG and pt-BR all land
    // somewhere sensible rather than only exact matches working.
    const base = nav.split('-')[0];
    if (DICTS[base]) return base;
  } catch (e) { /* non-browser context */ }
  return 'en';
}

function load() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && DICTS[saved]) return saved;
  } catch (e) { /* private browsing */ }
  return detectDefault();
}

let current = load();
const listeners = new Set();

export function getLang() { return current; }

export function setLang(code) {
  if (!DICTS[code] || code === current) return;
  current = code;
  try { localStorage.setItem(KEY, code); } catch (e) { /* ignore */ }
  applyTranslations();
  for (const fn of listeners) fn(code);
}

// Register a callback for language changes — used by the screens that build
// their DOM in JS (store, loadout, stats) so they can repaint their labels.
export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Look up `key`, falling back to English and then to the key itself, so a
// missing translation degrades to readable text instead of blanking the UI.
// `vars` interpolates {name} placeholders.
export function t(key, vars = null) {
  let s = DICTS[current][key];
  if (s === undefined) s = EN[key];
  if (s === undefined) return key;
  if (vars) {
    for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(vars[k]);
  }
  return s;
}

// Fills every translatable node under `root`. Safe to call repeatedly.
export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  // For strings that wrap a live counter in markup, the dictionary entry
  // carries the tags and the counter element is re-queried by id afterwards.
  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
  // "data-i18n-attr" is a comma list of attr:key pairs, e.g. "title:menu.play"
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.getAttribute('data-i18n-attr').split(',')) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    }
  });
  document.documentElement.setAttribute('lang', current);
  // ---- writing direction ----
  // Arabic is right-to-left, so the menu has to mirror. The gameplay layers
  // must NOT: #hud and #touch position the move stick on the left and the aim
  // stick on the right in CSS, and mirroring those would hand an Arabic player
  // swapped controls. That is not a language preference, it is a different
  // game. They are pinned back to ltr in the stylesheet; this only flips the
  // document, and the two CSS rules keep the thumbs where they belong.
  document.documentElement.setAttribute('dir', isRtl(current) ? 'rtl' : 'ltr');
}
