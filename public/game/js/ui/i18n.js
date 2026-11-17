// KOR — interface strings.
//
// t('key', { n: 3 }) looks the key up in the current language, falls back to
// English (Turkish for Turkish), then to the key itself (so a missing string
// is visible, never blank). {name} placeholders are filled from the second
// argument. The key check test (tools/game/i18n.test.mjs) fails the build on a
// missing key in any language.
//
// Ten languages (docs §10.38): Turkish and English, and the eight most spoken
// after them. A first start follows the phone's language (detectLang); the
// player can change it in Settings.
import tr from './lang/tr.js';
import en from './lang/en.js';
import zh from './lang/zh.js';
import hi from './lang/hi.js';
import es from './lang/es.js';
import fr from './lang/fr.js';
import ar from './lang/ar.js';
import bn from './lang/bn.js';
import pt from './lang/pt.js';
import ru from './lang/ru.js';

export const LANGS = { tr, en, zh, hi, es, fr, ar, bn, pt, ru };
export const LANG_NAMES = {
  tr: 'Türkçe', en: 'English', zh: '中文', hi: 'हिन्दी', es: 'Español',
  fr: 'Français', ar: 'العربية', bn: 'বাংলা', pt: 'Português', ru: 'Русский',
};
// the page's lang attribute (fonts and line breaking pick the right forms from it)
const TAG = { zh: 'zh-CN', pt: 'pt-BR' };
// numbers: the language's grouping, always with Western digits (the fonts carry those)
const NUM = { tr: 'tr-TR', en: 'en-US', zh: 'zh-CN', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR', ar: 'ar-u-nu-latn', bn: 'bn-u-nu-latn', pt: 'pt-BR', ru: 'ru-RU' };
let cur = 'tr';
const subs = new Set();

export function setLang(l) {
  cur = LANGS[l] ? l : 'en';
  document.documentElement.lang = TAG[cur] || cur;
  for (const fn of subs) fn(cur);
}
export const getLang = () => cur;
export const onLang = (fn) => { subs.add(fn); return () => subs.delete(fn); };

// the phone's language, if we have it; English otherwise
export function detectLang() {
  try {
    for (const tag of navigator.languages || [navigator.language]) {
      const b = String(tag || '').toLowerCase().split(/[-_]/)[0];
      if (LANGS[b]) return b;
    }
  } catch { /* no navigator */ }
  return 'en';
}

export function t(key, vars) {
  let s = LANGS[cur][key] ?? (cur === 'tr' ? undefined : en[key]) ?? tr[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}

// numbers with the language's grouping (12.450 / 12,450)
export function num(n) {
  try { return new Intl.NumberFormat(NUM[cur] || 'en-US').format(n); } catch { return String(n); }
}
// m:ss
export function clock(sec) {
  sec = Math.max(0, Math.floor(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}
