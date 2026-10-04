// Builds the public legal site (privacy notice, terms) into ./site for GitHub
// Pages. Google Play wants a privacy-policy URL that is public, served over
// https and is an ordinary web page — not a PDF, not something that needs a
// login or a working script to show any text.
//
// The pages therefore ship with the full English document already in the
// HTML, written here from the same buildDoc() the game uses. When scripts do
// run, the page upgrades itself to the visitor's own country and language
// from the same modules (copied to site/js/legal), so there is one source of
// truth for the wording and no second copy to keep in sync.
//
// Run from the repo root:
//   node --experimental-default-type=module scripts/build-legal-site.mjs

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDoc } from '../public/game/js/legal/docs.js';
import { CONTROLLER } from '../public/game/js/legal/controller.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'site');
rmSync(out, { recursive: true, force: true });
mkdirSync(resolve(out, 'privacy'), { recursive: true });
mkdirSync(resolve(out, 'terms'), { recursive: true });
// only the document modules; gate.js / consent.js belong to the in-game flow
for (const f of ['docs.js', 'controller.js', 'jurisdictions.js', 'text']) {
  cpSync(resolve(root, 'public/game/js/legal', f), resolve(out, 'js/legal', f), { recursive: true });
}
writeFileSync(resolve(out, '.nojekyll'), '');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const LINK_RE = /(https?:\/\/[^\s)]+[^\s).,;:]|[\w.+-]+@[\w-]+\.[\w.-]+[\w])/g;

// same linkification as renderDoc(), as markup
function rich(text) {
  let html = '', last = 0;
  for (const m of text.matchAll(LINK_RE)) {
    html += esc(text.slice(last, m.index));
    const v = m[0];
    const href = v.includes('@') && !v.startsWith('http') ? `mailto:${v}` : v;
    html += `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(v)}</a>`;
    last = m.index + v.length;
  }
  return html + esc(text.slice(last));
}

function docHtml(doc) {
  let h = `<h2 class="lg-doc-title">${esc(doc.title)}</h2>\n<div class="lg-doc-updated">${esc(doc.updated)}</div>\n`;
  for (const s of doc.sections) {
    if (s.note) { h += `<p class="lg-doc-note">${esc(s.note)}</p>\n`; continue; }
    if (s.h) h += `<h3>${esc(s.h)}</h3>\n`;
    for (const p of s.p || []) h += `<p>${rich(p)}</p>\n`;
    if (s.ul && s.ul.length) h += `<ul>${s.ul.map((li) => `<li>${rich(li)}</li>`).join('')}</ul>\n`;
  }
  return h;
}

const CSS = `
  :root { color-scheme: dark; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0c0f; color: #edeae2; font-family: "Inter", "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
         line-height: 1.7; padding: max(24px, env(safe-area-inset-top)) 20px 64px; -webkit-font-smoothing: antialiased; }
  .wrap { max-width: 760px; margin: 0 auto; }
  .sub { color: #d6453a; font-size: 12px; letter-spacing: 0.28em; text-transform: uppercase; margin-bottom: 14px; }
  .pickers { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 28px; }
  .pickers[hidden] { display: none; }
  label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: rgba(237,234,226,0.55); }
  select { background: #212934; color: #edeae2; border: 1px solid rgba(233,226,210,0.16); border-radius: 4px; padding: 9px 10px; font-size: 14px; min-width: 200px; }
  .lg-doc-title { font-size: 28px; letter-spacing: 0.04em; color: #fff; margin-bottom: 4px; }
  .lg-doc-updated { color: rgba(237,234,226,0.42); font-size: 12px; margin-bottom: 28px; }
  h1 { font-size: 34px; letter-spacing: 0.06em; color: #fff; margin-bottom: 8px; }
  h3 { font-size: 17px; color: #e8c17d; margin: 28px 0 10px; }
  p, li { color: rgba(237,234,226,0.84); font-size: 15px; margin: 8px 0; }
  ul { padding-inline-start: 22px; }
  a { color: #e8c17d; word-break: break-all; }
  .lg-doc-note { font-size: 13px; color: #d6453a; font-style: italic; }
  .nav { margin-top: 40px; display: flex; gap: 24px; flex-wrap: wrap; }
  .nav a { text-decoration: none; font-size: 13px; letter-spacing: 0.12em; }
  footer { margin-top: 48px; font-size: 12px; color: rgba(237,234,226,0.42); }
`;

function page(kind, otherKind, doc) {
  const title = `CINDERFALL — ${doc.title}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(doc.title)} for CINDERFALL: Sector 9 by echosk studios.">
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
  <div class="sub">CINDERFALL // Sector 9</div>
  <div class="pickers" id="pickers" hidden>
    <label><span id="l-country">Country / region</span><select id="country"></select></label>
    <label><span id="l-lang">Language</span><select id="lang"></select></label>
  </div>
  <div id="doc">
${docHtml(doc)}
  </div>
  <div class="nav">
    <a href="../privacy/" id="to-privacy">PRIVACY</a>
    <a href="../terms/" id="to-terms">TERMS</a>
    <a href="../">&larr; CINDERFALL</a>
  </div>
</div>
<script type="module">
  // Progressive enhancement: the text above is complete without this. With
  // scripts on, show the version for the visitor's own country and language.
  import { buildDoc, renderDoc, countryName, LANG_NAMES, textsFor } from '../js/legal/docs.js';
  import { COUNTRIES, docLangsFor, guessCountry } from '../js/legal/jurisdictions.js';
  const KIND = '${kind}';
  const q = new URLSearchParams(location.search);
  let country = (q.get('c') || guessCountry() || 'XX').toUpperCase();
  const nav = (navigator.language || 'en').slice(0, 2);
  let lang = q.get('l') || (docLangsFor(country).includes(nav) ? nav : docLangsFor(country)[0]);
  const cSel = document.getElementById('country'), lSel = document.getElementById('lang');
  document.getElementById('pickers').hidden = false;
  function fill() {
    const U = textsFor(lang).ui;
    document.getElementById('l-country').textContent = U.country;
    document.getElementById('l-lang').textContent = U.docLang;
    cSel.textContent = '';
    COUNTRIES.map((c) => [c, countryName(c, lang)]).sort((a, b) => a[1].localeCompare(b[1], lang))
      .forEach(([c, n]) => cSel.add(new Option(n, c, false, c === country)));
    lSel.textContent = '';
    docLangsFor(country).forEach((l) => lSel.add(new Option(LANG_NAMES[l], l, false, l === lang)));
    const doc = buildDoc(KIND, lang, country);
    document.title = 'CINDERFALL — ' + doc.title;
    document.documentElement.lang = lang;
    renderDoc(document.getElementById('doc'), doc);
    document.getElementById('to-privacy').textContent = U.privacyTitle.toUpperCase();
    document.getElementById('to-terms').textContent = U.termsTitle.toUpperCase();
    for (const a of [document.getElementById('to-privacy'), document.getElementById('to-terms')]) {
      a.href = a.getAttribute('href').split('?')[0] + '?c=' + country + '&l=' + lang;
    }
    history.replaceState(null, '', '?c=' + country + '&l=' + lang);
  }
  cSel.addEventListener('change', () => { country = cSel.value; if (!docLangsFor(country).includes(lang)) lang = docLangsFor(country)[0]; fill(); });
  lSel.addEventListener('change', () => { lang = lSel.value; fill(); });
  fill();
</script>
</body>
</html>
`;
}

// Default (no-script, no-country) reading: English, the catch-all regime.
for (const kind of ['privacy', 'terms']) {
  const doc = buildDoc(kind, 'en', 'XX', { countryLabel: 'all countries and regions' });
  writeFileSync(resolve(out, kind, 'index.html'), page(kind, kind === 'privacy' ? 'terms' : 'privacy', doc));
}

writeFileSync(resolve(out, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CINDERFALL — Sector 9</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
  <div class="sub">echosk studios</div>
  <h1>CINDERFALL: Sector 9</h1>
  <p>A 2D tactical shooter for Android.</p>
  <div class="nav">
    <a href="privacy/">PRIVACY NOTICE</a>
    <a href="terms/">TERMS OF SERVICE</a>
  </div>
  <footer>Contact: <a href="mailto:${esc(CONTROLLER.email)}">${esc(CONTROLLER.email)}</a></footer>
</div>
</body>
</html>
`);
console.log('legal site written to', out);
