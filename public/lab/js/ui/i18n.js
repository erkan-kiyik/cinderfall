// CINDERFALL LAB — interface strings.
//
// t('key', { n: 3 }) looks the key up in the current language, falls back to
// Turkish, then to the key itself (so a missing string is visible, never
// blank). {name} placeholders are filled from the second argument. The key
// check test (tools/lab/i18n.test.mjs) fails the build on a missing key.
import tr from './lang/tr.js';
import en from './lang/en.js';

export const LANGS = { tr, en };
export const LANG_NAMES = { tr: 'Türkçe', en: 'English' };
let cur = 'tr';
const subs = new Set();

export function setLang(l) {
  cur = LANGS[l] ? l : 'tr';
  document.documentElement.lang = cur;
  for (const fn of subs) fn(cur);
}
export const getLang = () => cur;
export const onLang = (fn) => { subs.add(fn); return () => subs.delete(fn); };

export function t(key, vars) {
  let s = LANGS[cur][key] ?? tr[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}

// numbers with the language's grouping (12.450 / 12,450)
export function num(n) {
  try { return new Intl.NumberFormat(cur === 'tr' ? 'tr-TR' : 'en-US').format(n); } catch { return String(n); }
}
// m:ss
export function clock(sec) {
  sec = Math.max(0, Math.floor(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}
