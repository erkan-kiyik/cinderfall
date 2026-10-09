// Builds the public website into ./site for GitHub Pages:
//
//   site/privacy/, site/terms/   from scripts/build-legal-site.mjs, run unchanged
//   site/index.html + assets     the official SECTOR 9: CINDERFALL website
//
// The legal build runs first — it owns ./site and clears it — and this script
// then writes the website on top, replacing only the placeholder index.html it
// leaves behind. Run from anywhere:
//
//   node --experimental-default-type=module scripts/build-website.mjs
//
// Configuration lives in website/site.config.mjs; every key can also be set
// through an environment variable of the same name (the Pages workflow passes
// SITE_URL that way).

import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SITE } from '../website/site.config.mjs';
import { qrSvg } from './lib/qr.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const web = resolve(root, 'website');
const out = resolve(root, 'site');
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad2 = (n) => String(n).padStart(2, '0');
const notes = [];   // unresolved configuration, printed at the end

// ------------------------------------------------------------- 1. legal pages
{
  const r = spawnSync(process.execPath, ['--experimental-default-type=module', resolve(root, 'scripts/build-legal-site.mjs')], { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

// --------------------------------------------------------------- 2. config
const fromRepo = (rel) => import(pathToFileURL(resolve(root, rel)).href);
const cfg = { ...SITE };
for (const k of Object.keys(cfg)) if (process.env[k] !== undefined) cfg[k] = process.env[k].trim();

if (cfg.PLAY_STORE_URL === null) {
  const { appId } = JSON.parse(read('mobile/capacitor.config.json'));
  cfg.PLAY_STORE_URL = appId ? `https://play.google.com/store/apps/details?id=${encodeURIComponent(appId)}` : '';
}
if (cfg.PLAY_STORE_URL && !/^https:\/\/play\.google\.com\//.test(cfg.PLAY_STORE_URL)) {
  notes.push(`PLAY_STORE_URL "${cfg.PLAY_STORE_URL}" is not a play.google.com https URL — treated as not configured`);
  cfg.PLAY_STORE_URL = '';
}
if (!cfg.PLAY_STORE_URL) notes.push('PLAY_STORE_URL is not configured: install buttons show an unavailable state and the QR code is omitted');

if (cfg.CONTACT_EMAIL === null) cfg.CONTACT_EMAIL = (await fromRepo('public/game/js/legal/controller.js')).CONTROLLER.email || '';
if (!cfg.CONTACT_EMAIL) notes.push('CONTACT_EMAIL is not configured');

if (cfg.SITE_URL) {
  if (!/^https:\/\//.test(cfg.SITE_URL)) { notes.push(`SITE_URL "${cfg.SITE_URL}" is not https — ignored`); cfg.SITE_URL = ''; }
  else if (!cfg.SITE_URL.endsWith('/')) cfg.SITE_URL += '/';
}
if (!cfg.SITE_URL) notes.push('SITE_URL is not set: canonical, og:url, sitemap.xml and absolute og:image URLs are left out');
if (!cfg.TRAILER_URL) notes.push('TRAILER_URL is not set: the trailer dialog shows a labelled placeholder');
if (!cfg.STUDIO_LOGO) notes.push('STUDIO_LOGO is not set: the studio is shown as a typographic wordmark');

// ------------------------------------------------------- 3. official badge
// Google's own "Get it on Google Play" artwork, fetched unmodified at build
// time so visitors never make a request to Google. If the build machine
// cannot reach it, the page points at Google's hosted copy instead.
const BADGE_URL = 'https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png';
let badgeSrc = BADGE_URL;
try {
  const res = await fetch(BADGE_URL, { signal: AbortSignal.timeout(15000) });
  const buf = Buffer.from(await res.arrayBuffer());
  const png = buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47;
  if (!res.ok || !png) throw new Error(`HTTP ${res.status}`);
  mkdirSync(resolve(out, 'assets/badge'), { recursive: true });
  writeFileSync(resolve(out, 'assets/badge/google-play-badge.png'), buf);
  badgeSrc = 'assets/badge/google-play-badge.png';
} catch (e) {
  notes.push(`could not download the official Google Play badge (${e.message}); the page loads it from play.google.com instead`);
}

// ------------------------------------------------------------- 4. weapons
const manifest = JSON.parse(read('website/assets/art/manifest.json'));
// Website navigation categories and plain-language class names. The game
// itself sorts by loadout slot (primary / sidearm / special); these exist to
// let a visitor filter the list.
const ROSTER = [
  ['rifle', 'ballistic', 'Assault rifle'], ['pistol', 'ballistic', 'Pistol'], ['smg', 'ballistic', 'SMG'],
  ['lmg', 'ballistic', 'Light machine gun'], ['sniper', 'ballistic', 'Sniper rifle'], ['battle', 'ballistic', 'Battle rifle'],
  ['plasma', 'energy', 'Plasma rifle'], ['pulse', 'energy', 'Pulse rifle'], ['eshotgun', 'energy', 'Energy shotgun'],
  ['emp', 'energy', 'EMP gun'], ['gravity', 'energy', 'Gravity gun'], ['lightning', 'energy', 'Lightning gun'],
  ['cryo', 'energy', 'Cryo gun'], ['raygun', 'energy', 'Ray gun'], ['quantum', 'energy', 'Energy pistol'],
  ['lasersmg', 'energy', 'Laser SMG'], ['particle', 'energy', 'Particle beam'], ['railgun', 'energy', 'Railgun'],
  ['ion', 'heavy', 'Ion cannon'], ['flame', 'heavy', 'Flamethrower'], ['minigun', 'heavy', 'Minigun'], ['rocket', 'heavy', 'Rocket launcher'],
  ['knife', 'melee', 'Combat knife'],
];
const CAT_LABEL = { ballistic: 'Ballistic', energy: 'Energy', heavy: 'Heavy', melee: 'Melee' };
const RARITY_LABEL = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary', mythic: 'Mythic', ultraLimited: 'Ultra limited' };
const SLOT_LABEL = { primary: 'Primary', secondary: 'Sidearm', special: 'Special' };
const TIER_COLOR = { common: 'var(--r-common)', rare: 'var(--r-rare)', epic: 'var(--r-epic)', legendary: 'var(--r-legendary)', mythic: 'var(--r-mythic)', ultraLimited: 'var(--ember)' };

for (const [id] of ROSTER) if (!manifest.weapons[id]) throw new Error(`weapon ${id} missing from website/assets/art/manifest.json — re-run website/tools/export-game-art.mjs`);
if (Object.keys(manifest.weapons).length !== ROSTER.length) notes.push('the game art manifest lists weapons the website roster does not show');

// Roster-wide ranges, exactly as game/weaponstats.js computes them: a full
// bar means the best weapon in the whole game on that metric.
const guns = Object.values(manifest.weapons).filter((w) => w.kind === 'gun');
const range = (f) => { const v = guns.map(f).filter(Number.isFinite); return [Math.min(...v), Math.max(...v)]; };
const R = { dmg: range((w) => w.dmg), rpm: range((w) => w.rpm), spread: range((w) => w.spread), recoil: range((w) => w.recoilKick) };
const norm = (v, [lo, hi], lowerIsBetter = false) => {
  let n = hi - lo > 1e-9 ? (v - lo) / (hi - lo) : 1;
  if (lowerIsBetter) n = 1 - n;
  return Math.max(0.04, Math.min(1, n));
};
const maxWorldW = Math.max(...Object.values(manifest.weapons).map((w) => w.worldW));

function fireProfile(w) {
  if (w.kind !== 'gun') return 'Silent takedowns · quick and heavy slash';
  const t = [];
  if (w.fireMode === 'beam') t.push('Continuous beam');
  else if (w.charge) t.push('Charge shot');
  else t.push(w.auto ? 'Full auto' : 'Semi-auto');
  if (w.pellets > 1) t.push(`${w.pellets} pellets`);
  if (w.explosive) t.push('Explosive');
  else if (w.blast) t.push('Blast radius');
  if (w.pierce) t.push('Piercing');
  if (w.magSize) t.push(`${w.magSize}-round mag`);
  return t.join(' · ');
}
function acquisition(id, w) {
  if (id === 'smg') return ['Unlocks at level 3', ''];
  if (w.acquire === 'starter') return ['Starting loadout', ''];
  if (w.acquire === 'boss') return ['Boss drop', ' wcard__acq--boss'];
  return ['Crates · Trader', ''];
}
const stat = (label, v, text, unit = '') =>
  `<div class="wcard__stat"><dt>${label}</dt><dd><span class="wcard__bar" aria-hidden="true"><i style="--v:${v.toFixed(3)}"></i></span><span class="wcard__val">${text}${unit ? ` <small>${unit}</small>` : ''}</span></dd></div>`;

const counts = { ballistic: 0, energy: 0, heavy: 0, melee: 0 };
const weaponCards = ROSTER.map(([id, cat, cls], i) => {
  const w = manifest.weapons[id];
  counts[cat]++;
  const rarityKey = w.acquire === 'boss' ? 'boss' : (w.rarity || 'common');
  const rarityText = w.rarity ? RARITY_LABEL[w.rarity] : 'Standard issue';
  const pct = Math.round(Math.min(92, Math.max(38, (w.worldW / maxWorldW) * 96)));
  const slots = w.slots.map((s) => SLOT_LABEL[s]).join(' · ') || 'Knife';
  const [acq, acqClass] = acquisition(id, w);
  const finishes = w.skins.map((t) => `<i style="--f:${TIER_COLOR[t] || 'var(--muted)'}"></i>`).join('');
  let stats;
  if (w.kind === 'gun') {
    const acc = norm(w.spread, R.spread, true), hand = norm(w.recoilKick, R.recoil, true);
    stats = `<dl class="wcard__stats">`
      + stat('Damage', norm(w.dmg, R.dmg), w.pellets > 1 ? `${w.dmg}×${w.pellets}` : String(w.dmg))
      + stat('Fire rate', norm(w.rpm, R.rpm), String(w.rpm), 'rpm')
      + stat('Accuracy', acc, String(Math.round(acc * 100)))
      + stat('Handling', hand, String(Math.round(hand * 100)))
      + `</dl>`;
  } else {
    stats = `<dl class="wcard__melee"><div><dt class="visually-hidden">Quick slash damage</dt><dd>Quick slash <b>${w.dmg}</b></dd></div><div><dt class="visually-hidden">Heavy slash damage</dt><dd>Heavy slash <b>${w.dmgHeavy}</b></dd></div><div><dt class="visually-hidden">Special</dt><dd>Silent takedown from behind</dd></div></dl>`;
  }
  return `      <li class="wcard-item" data-cat="${cat}">
        <article class="wcard panel" data-rarity="${rarityKey}" tabindex="${i === 0 ? 0 : -1}" aria-labelledby="w-${id}">
          <div class="wcard__head"><span aria-hidden="true">W-${pad2(i + 1)}</span><span class="wcard__cat">${CAT_LABEL[cat]}</span><span class="wcard__rar">${rarityText}</span></div>
          <div class="wcard__stage"><img class="wcard__img" src="assets/art/weapon-${id}.webp" width="${w.w}" height="${w.h}" style="--w:${pct}%" loading="lazy" decoding="async" alt="In-game render of the ${esc(cls.toLowerCase())}"><span class="wcard__scale" aria-hidden="true">TO SCALE</span></div>
          <div class="wcard__body">
            <h3 class="wcard__name" id="w-${id}">${esc(w.name.replace(/"([^"]+)"/, '“$1”'))}</h3>
            <p class="wcard__class">${esc(cls)} <span aria-hidden="true">//</span> ${esc(slots)}</p>
            <p class="wcard__tags">${esc(fireProfile(w))}</p>
            ${stats}
            <div class="wcard__foot"><span class="wcard__finishes"><span class="visually-hidden">Finishes:</span>${finishes}<span>${w.skins.length} finishes</span></span><span class="wcard__acq${acqClass}">${acq}</span></div>
          </div>
        </article>
      </li>`;
}).join('\n');

// ------------------------------------------------------------- 5. archives
// Real file metadata from the game (game/intel.js); titles and contents stay
// redacted — the bar lengths follow the real titles, nothing else does.
const { INTEL_LOGS } = await fromRepo('public/game/js/game/intel.js');
const { EN } = await fromRepo('public/game/js/engine/lang/en.js');
const archiveRows = INTEL_LOGS.map((log) => {
  const n = log.id.replace('log_', '');
  const tier = EN[`intel.tier.${log.tier}`] || log.tier;
  const len = Math.max(8, Math.min(26, (EN[`intel.${log.id}.title`] || '').length));
  const clearance = log.bossOnly ? '<b>Command level</b> · ' : '';
  return `        <li><button class="file" type="button" aria-pressed="false" data-file="LOG ${n}" data-tier="${esc(tier)}" data-boss="${log.bossOnly}" data-stage="${pad2(log.minStage)}">
          <span class="file__id">LOG ${n}</span>
          <span class="file__mid"><span class="redact" style="--len:${len}ch" aria-hidden="true"></span><span class="visually-hidden">Title redacted.</span><span class="file__meta">${clearance}${esc(tier)} · stage ${pad2(log.minStage)}+</span></span>
          <span class="file__lock"><svg class="icon" aria-hidden="true"><use href="#i-lock"/></svg>Locked</span>
        </button></li>`;
}).join('\n');

// ------------------------------------------------------------ 6. screenshots
const SCREENS = [
  ['shot-menu', 'Main menu: deploy, with loadout, crates, trader, stats and archives along the bottom.', 'In-game main menu with the CINDERFALL title, a DEPLOY button, the equipped primary, sidearm and special weapons, and the bottom tab bar.'],
  ['shot-firefight', 'A street firefight in the rain, HUD up.', 'Gameplay: the operator fires a rifle down a rainy street lined with crates, barrels and razor wire; health, stamina, scrap, objective and ammo are on the HUD.'],
  ['shot-loadout', 'Loadout: choose a primary, a sidearm and a special weapon.', 'Loadout screen listing primary weapons and sidearms as cards with their rarity colours.'],
  ['shot-trader', 'CROW’s stall: today’s stock, paid for in scrap.', 'The Trader screen: CROW behind his counter, with tabs for today’s stall, weapons and skins, and two epic items with scrap prices.'],
  ['shot-crate-reel', 'Opening a supply crate.', 'A supply crate opening: a reel of weapon and skin cards slides past a marker.'],
  ['shot-reveal', 'The reveal: a legendary energy weapon.', 'A crate reveal card showing a legendary energy weapon, with rays of gold light behind it.'],
];
const screenItems = SCREENS.map(([name, caption, alt], i) => `      <li class="shot">
        <button class="shot__btn" type="button" data-shot data-full="assets/img/${name}-1920.webp" data-alt="${esc(alt)}" data-caption="${esc(caption)}" aria-haspopup="dialog">
          <span class="shot__device"><span class="shot__screen"><img src="assets/img/${name}-640.webp" srcset="assets/img/${name}-640.webp 640w, assets/img/${name}-1280.webp 1280w" sizes="(min-width: 900px) 46vw, 86vw" width="1920" height="1080" loading="lazy" decoding="async" alt="${esc(alt)}"></span></span>
          <span class="shot__cap"><b>${pad2(i + 1)}</b>${esc(caption)}<span class="visually-hidden"> — open larger</span></span>
        </button>
      </li>`).join('\n');

// --------------------------------------------------------- 7. hero details
const stacks = JSON.parse(read('website/partials/skyline-stacks.json'));
const beacons = JSON.parse(read('website/partials/skyline-beacons.json'));
const smoke = stacks.map(([x, y], i) => `<span class="smoke" style="left:${x}%;top:${y}%;--k:${i}"><span></span><span></span></span>`).join('');
const beaconSpans = beacons.map(([x, y, c, d]) => `<span class="beacon ${c.split(' ').map((k) => `beacon--${k}`).join(' ')}" style="left:${x}%;top:${y}%;--d:${d}s"></span>`).join('');

const wordmark = (cls = '') => `<span class="studio-wordmark ${cls}"><span class="studio-wordmark__mark" aria-hidden="true"></span><span class="studio-wordmark__name">echosk</span><span class="studio-wordmark__unit">studios</span></span>`;
const studioMark = (cls) => (cfg.STUDIO_LOGO ? `<img class="studio-logo" src="${esc(cfg.STUDIO_LOGO)}" alt="echosk studios">` : wordmark(cls));

// --------------------------------------------------------------- 8. play links
const playConfigured = !!cfg.PLAY_STORE_URL;
const playAttrs = playConfigured
  ? `href="${esc(cfg.PLAY_STORE_URL)}" target="_blank" rel="noopener"`
  : `aria-disabled="true" data-unavailable`;
const playHint = playConfigured ? '(opens Google Play in a new tab)' : '(Google Play listing not available yet)';
const playStatus = playConfigured ? '' : 'Google Play listing coming soon';
const qrBlock = playConfigured
  ? `      <div class="qr">
        <div class="qr__code">${qrSvg(cfg.PLAY_STORE_URL, { ecl: 'Q', border: 4, title: 'QR code for SECTOR 9: CINDERFALL on Google Play' })}</div>
        <div class="qr__text"><b>Scan to install on your phone</b><a href="${esc(cfg.PLAY_STORE_URL)}" target="_blank" rel="noopener">${esc(cfg.PLAY_STORE_URL.replace(/^https:\/\//, ''))}<span class="visually-hidden"> (opens Google Play in a new tab)</span></a></div>
      </div>`
  : '';

// ------------------------------------------------------------ 9. metadata
const ogImage = cfg.SITE_URL ? `${cfg.SITE_URL}assets/img/og-feature-graphic.png` : 'assets/img/og-feature-graphic.png';
const headAbsolute = cfg.SITE_URL
  ? `<link rel="canonical" href="${esc(cfg.SITE_URL)}">\n<meta property="og:url" content="${esc(cfg.SITE_URL)}">`
  : '<!-- SITE_URL not set: canonical and og:url omitted -->';
const description = 'Enter SECTOR 9: CINDERFALL, a tactical 2D shooter for Android. Master stealth, survive escalating combat, unlock gear and take on boss encounters.';
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'SECTOR 9: CINDERFALL',
  alternateName: 'CINDERFALL: Sector 9',
  description,
  genre: ['Action', 'Shooter'],
  gamePlatform: 'Android',
  operatingSystem: 'Android',
  applicationCategory: 'Game',
  playMode: 'https://schema.org/SinglePlayer',
  inLanguage: ['en', 'tr', 'de', 'es', 'ru', 'ar', 'hi'],
  publisher: { '@type': 'Organization', name: 'echosk studios' },
  author: { '@type': 'Organization', name: 'echosk studios' },
  image: ogImage,
  ...(cfg.SITE_URL ? { url: cfg.SITE_URL } : {}),
  ...(playConfigured ? { installUrl: cfg.PLAY_STORE_URL, sameAs: [cfg.PLAY_STORE_URL], offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', url: cfg.PLAY_STORE_URL } } : {}),
};
const siteConfig = { trailerUrl: cfg.TRAILER_URL || '' };

// ----------------------------------------------------------- 10. assemble
let html = read('website/index.html');
html = html.replace(/\{\{include:([\w./-]+)\}\}/g, (_, p) => {
  const body = read(`website/${p}`).trim();
  // the bottom layers get an anchor box that reproduces the SVG's "slice"
  // scaling, so HTML beacons and smoke stay pinned to the drawing
  if (p.endsWith('skyline-far.svg')) return `<div class="sky-anchor" style="--arw:1600;--arh:420">${body}{{SMOKE_PLUMES}}</div>`;
  if (p.endsWith('skyline-mid.svg')) return `<div class="sky-anchor" style="--arw:1600;--arh:360">${body}${beaconSpans}</div>`;
  if (p.endsWith('skyline-near.svg')) return `<div class="sky-anchor" style="--arw:1600;--arh:200">${body}</div>`;
  return body;
});
const tokens = {
  HEAD_ABSOLUTE: headAbsolute,
  OG_IMAGE: esc(ogImage),
  JSON_LD: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
  SITE_CONFIG_JSON: JSON.stringify(siteConfig).replace(/</g, '\\u003c'),
  PLAY_ATTRS: playAttrs,
  PLAY_HINT: playHint,
  PLAY_STATUS: playStatus,
  BADGE_SRC: esc(badgeSrc),
  PRIVACY_URL: esc(cfg.PRIVACY_URL),
  TERMS_URL: esc(cfg.TERMS_URL),
  CONTACT_EMAIL: esc(cfg.CONTACT_EMAIL),
  SMOKE_PLUMES: smoke,
  WEAPON_CARDS: weaponCards,
  WEAPON_COUNT: String(ROSTER.length),
  N_BALLISTIC: String(counts.ballistic), N_ENERGY: String(counts.energy), N_HEAVY: String(counts.heavy), N_MELEE: String(counts.melee),
  ARCHIVE_ROWS: archiveRows,
  SCREEN_ITEMS: screenItems,
  QR_BLOCK: qrBlock,
  STUDIO_MARK_HEADER: studioMark(''),
  STUDIO_MARK_LARGE: studioMark('studio-wordmark--large'),
  STUDIO_MARK_FOOTER: studioMark(''),
};
html = html.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in tokens ? tokens[k] : m));
if (!playConfigured) html = html.replace('<html lang="en" class="no-js">', '<html lang="en" class="no-js play-unconfigured">');
const left = html.match(/\{\{[^}]+\}\}/g);
if (left) throw new Error(`unreplaced template tokens: ${[...new Set(left)].join(', ')}`);
if (!playConfigured && /href="https:\/\/play\.google/.test(html)) throw new Error('a Google Play link escaped the unavailable state');

// --------------------------------------------------------------- 11. write
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'index.html'), html);
for (const dir of ['css', 'js', 'assets']) cpSync(resolve(web, dir), resolve(out, dir), { recursive: true });
cpSync(resolve(root, 'store/feature-graphic.png'), resolve(out, 'assets/img/og-feature-graphic.png'));
if (cfg.STUDIO_LOGO && !existsSync(resolve(out, cfg.STUDIO_LOGO))) notes.push(`STUDIO_LOGO "${cfg.STUDIO_LOGO}" does not exist under website/`);

writeFileSync(resolve(out, 'manifest.webmanifest'), JSON.stringify({
  name: 'SECTOR 9: CINDERFALL',
  short_name: 'CINDERFALL',
  description,
  start_url: './',
  scope: './',
  display: 'browser',
  background_color: '#0B0E13',
  theme_color: '#0B0E13',
  icons: [
    { src: 'assets/img/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'assets/img/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2) + '\n');

writeFileSync(resolve(out, 'robots.txt'), `User-agent: *\nAllow: /\n${cfg.SITE_URL ? `\nSitemap: ${cfg.SITE_URL}sitemap.xml\n` : ''}`);
if (cfg.SITE_URL) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ['', cfg.PRIVACY_URL, cfg.TERMS_URL].map((p) => `  <url><loc>${esc(new URL(p, cfg.SITE_URL).href)}</loc><lastmod>${today}</lastmod></url>`);
  writeFileSync(resolve(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
}

console.log('website written to', out);
console.log(`  Google Play:  ${cfg.PLAY_STORE_URL || '(not configured)'}`);
console.log(`  contact:      ${cfg.CONTACT_EMAIL || '(not configured)'}`);
console.log(`  site URL:     ${cfg.SITE_URL || '(not set)'}`);
console.log(`  badge:        ${badgeSrc}`);
for (const n of notes) console.log(`  note: ${n}`);
