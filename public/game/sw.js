// CINDERFALL service worker — offline play + fast repeat loads.
//
// Scope is the folder this file is served from (/game/). Strategy:
//   • navigations (the HTML document): network-first, fall back to cache —
//     so a fresh deploy is always picked up when online, but the game still
//     launches with no connection.
//   • same-origin GET assets (js/css/icons): cache-first with a background
//     refresh — instant loads, self-healing when files change.
// Bump CACHE on any shipped change to retire the previous cache on activate.

const CACHE = 'cinderfall-v4';

// The full game shell — every module is a static ES import, so precaching
// them means the whole game is available offline from the very first visit,
// rather than only once the fetch handler below has happened to see each file.
//
// This list is exhaustive on purpose, and it drifts when edited by hand: it has
// gone stale twice (half the modules the first time; the five added languages,
// settings, debug and referral the second). Regenerate the fonts and js/
// entries from inside public/game with
//
//   find assets/fonts js \( -name '*.woff2' -o -name '*.js' \) | sort | sed "s|^|  './|; s|$|',|"
//
// and paste the result over those entries below.
const SHELL = [
  './',
  './index.html',
  './css/style.css',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
  './assets/favicon-32.png',
  './assets/icon-maskable-512.png',
  './legal/privacy.html',
  './legal/terms.html',
  './assets/fonts/inter-400.woff2',
  './assets/fonts/inter-600.woff2',
  './assets/fonts/inter-700.woff2',
  './assets/fonts/orbitron-700.woff2',
  './assets/fonts/orbitron-800.woff2',
  './assets/fonts/rajdhani-500.woff2',
  './assets/fonts/rajdhani-600.woff2',
  './assets/fonts/rajdhani-700.woff2',
  './js/art/background.js',
  './js/art/currency.js',
  './js/art/environment.js',
  './js/art/paint.js',
  './js/art/skins.js',
  './js/art/soldier.js',
  './js/art/trader.js',
  './js/art/weapons.js',
  './js/engine/ads-config.js',
  './js/engine/ads.js',
  './js/engine/audio.js',
  './js/engine/brightness.js',
  './js/engine/camera.js',
  './js/engine/daycycle.js',
  './js/engine/debug.js',
  './js/engine/device.js',
  './js/engine/i18n.js',
  './js/engine/input.js',
  './js/engine/interlude.js',
  './js/engine/intro.js',
  './js/engine/lang/ar.js',
  './js/engine/lang/de.js',
  './js/engine/lang/en.js',
  './js/engine/lang/es.js',
  './js/engine/lang/hi.js',
  './js/engine/lang/ru.js',
  './js/engine/lang/tr.js',
  './js/engine/math.js',
  './js/engine/particles.js',
  './js/engine/quality.js',
  './js/engine/settings.js',
  './js/engine/touch.js',
  './js/game/achievements.js',
  './js/game/archives.js',
  './js/game/barks.js',
  './js/game/currencyfx.js',
  './js/game/difficulty.js',
  './js/game/enemy.js',
  './js/game/fx.js',
  './js/game/hud.js',
  './js/game/intel.js',
  './js/game/loot.js',
  './js/game/meta.js',
  './js/game/metaui.js',
  './js/game/player.js',
  './js/game/profile.js',
  './js/game/progression.js',
  './js/game/referral.js',
  './js/game/retention.js',
  './js/game/rig.js',
  './js/game/sharecard.js',
  './js/game/statsui.js',
  './js/game/trader.js',
  './js/game/traderui.js',
  './js/game/tutorial.js',
  './js/game/weaponstats.js',
  './js/game/world.js',
  './js/main.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // individual failures (e.g. a not-yet-generated screenshot) must not
      // abort the whole install, so add allSettled-style per-item
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // never touch cross-origin

  // HTML document → network-first (fresh when online, cached when offline)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { cachePut(req, res.clone()); return res; })
        .catch(() => caches.match(req).then((m) => m || caches.match('./index.html')))
    );
    return;
  }

  // assets → cache-first, with a quiet background refresh
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => { cachePut(req, res.clone()); return res; }).catch(() => cached);
      return cached || network;
    })
  );
});

function cachePut(req, res) {
  if (!res || res.status !== 200 || res.type === 'opaque') return;
  caches.open(CACHE).then((c) => c.put(req, res)).catch(() => {});
}
