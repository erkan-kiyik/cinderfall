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

const KEY = 'cinderfall.lang.v1';
const DICTS = { tr: TR, en: EN };
export const LANGS = [
  { code: 'tr', label: 'TÜRKÇE' },
  { code: 'en', label: 'ENGLISH' },
];

function detectDefault() {
  try {
    const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    if (nav.startsWith('tr')) return 'tr';
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

export function cycleLang() {
  const i = LANGS.findIndex((l) => l.code === current);
  setLang(LANGS[(i + 1) % LANGS.length].code);
  return current;
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
}
