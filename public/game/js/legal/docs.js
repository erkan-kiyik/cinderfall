// Assembles a legal document for a country + language: the language's core
// text, the regime's own section in that language where we have it, or the
// English version of that section (flagged as such) where we do not.
import { CONTROLLER, LEGAL_VERSION } from './controller.js';
import { profileOf } from './jurisdictions.js';
import en from './text/en.js';
import tr from './text/tr.js';
import de from './text/de.js';
import es from './text/es.js';
import fr from './text/fr.js';
import pt from './text/pt.js';
import ru from './text/ru.js';
import ar from './text/ar.js';
import hi from './text/hi.js';

export const TEXTS = { en, tr, de, es, fr, pt, ru, ar, hi };
export const LANG_NAMES = {
  en: 'English', tr: 'Türkçe', de: 'Deutsch', es: 'Español', fr: 'Français',
  pt: 'Português', ru: 'Русский', ar: 'العربية', hi: 'हिन्दी',
};

export function textsFor(lang) { return TEXTS[lang] || en; }

export function countryName(code, lang) {
  if (!code) return '';
  try {
    const dn = new Intl.DisplayNames([lang, 'en'], { type: 'region' });
    return dn.of(code) || code;
  } catch (e) { return code; }
}

function formatDate(iso, lang) {
  try {
    return new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric' })
      .format(new Date(`${iso}T12:00:00Z`));
  } catch (e) { return iso; }
}

// Regime section in this language, else the English one with a note.
function pick(L, table, id, ctx, fallbackId) {
  if (L[table] && L[table][id]) return L[table][id](ctx);
  if (en[table] && en[table][id]) {
    const secs = en[table][id](ctx);
    return secs.length ? [{ note: L.ui.langNote }, ...secs] : [];
  }
  if (fallbackId && L[table] && L[table][fallbackId]) return L[table][fallbackId](ctx);
  if (fallbackId && en[table][fallbackId]) return en[table][fallbackId](ctx);
  return [];
}

// kind: 'privacy' | 'terms' | 'consent'
export function buildDoc(kind, lang, country) {
  const L = textsFor(lang);
  const P = profileOf(country);
  const ctx = {
    C: CONTROLLER,
    P,
    date: formatDate(LEGAL_VERSION, lang),
    countryName: countryName(country, lang) || '—',
    rights: (c) => pick(L, 'rights', P.id, c, 'other'),
    termsLocal: (c) => pick(L, 'termsLocal', P.id, c, 'other'),
  };
  const titleKey = { privacy: 'privacyTitle', terms: 'termsTitle', consent: 'consentTitle' }[kind];
  const title = (P.id === 'tr' && L.ui[`${titleKey}TR`]) || L.ui[titleKey];
  return {
    title,
    updated: `${L.ui.updated}: ${ctx.date}`,
    sections: L[kind](ctx),
    rtl: !!L.rtl,
    lang,
  };
}

// Renders a built doc into `host` with DOM nodes only (no innerHTML), turning
// URLs and e-mail addresses into links.
const LINK_RE = /(https?:\/\/[^\s)]+[^\s).,;:]|[\w.+-]+@[\w-]+\.[\w.-]+[\w])/g;
function richText(el, text) {
  let last = 0;
  for (const m of text.matchAll(LINK_RE)) {
    if (m.index > last) el.appendChild(document.createTextNode(text.slice(last, m.index)));
    const a = document.createElement('a');
    const v = m[0];
    a.href = v.includes('@') && !v.startsWith('http') ? `mailto:${v}` : v;
    a.textContent = v;
    a.target = '_blank'; a.rel = 'noopener';
    el.appendChild(a);
    last = m.index + v.length;
  }
  if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)));
}

export function renderDoc(host, doc) {
  host.textContent = '';
  host.dir = doc.rtl ? 'rtl' : 'ltr';
  host.lang = doc.lang;
  const h = document.createElement('h2'); h.className = 'lg-doc-title'; h.textContent = doc.title;
  const u = document.createElement('div'); u.className = 'lg-doc-updated'; u.textContent = doc.updated;
  host.append(h, u);
  for (const s of doc.sections) {
    if (s.note) {
      const n = document.createElement('p'); n.className = 'lg-doc-note'; n.textContent = s.note;
      host.appendChild(n);
      continue;
    }
    if (s.h) { const e = document.createElement('h3'); e.textContent = s.h; host.appendChild(e); }
    for (const p of s.p || []) { const e = document.createElement('p'); richText(e, p); host.appendChild(e); }
    if (s.ul && s.ul.length) {
      const ul = document.createElement('ul');
      for (const li of s.ul) { const e = document.createElement('li'); richText(e, li); ul.appendChild(e); }
      host.appendChild(ul);
    }
  }
}
