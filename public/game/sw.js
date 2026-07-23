// CINDERFALL service worker — offline play + fast repeat loads.
//
// Scope is the folder this file is served from (/game/). Strategy:
//   • navigations (the HTML document): network-first, fall back to cache —
//     so a fresh deploy is always picked up when online, but the game still
//     launches with no connection.
//   • same-origin GET assets (js/css/icons): cache-first with a background
//     refresh — instant loads, self-healing when files change.
// Bump CACHE on any shipped change to retire the previous cache on activate.

const CACHE = 'cinderfall-v1';

// The full game shell — every module is a static ES import, so precaching
// them means the whole game is available offline after the first visit.
const SHELL = [
  './',
  './index.html',
  './css/style.css',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
  './assets/favicon-32.png',
  './js/main.js',
  './js/engine/input.js',
  './js/engine/camera.js',
  './js/engine/particles.js',
  './js/engine/audio.js',
  './js/engine/math.js',
  './js/engine/touch.js',
  './js/engine/quality.js',
  './js/art/paint.js',
  './js/art/soldier.js',
  './js/art/weapons.js',
  './js/art/environment.js',
  './js/art/background.js',
  './js/game/world.js',
  './js/game/fx.js',
  './js/game/player.js',
  './js/game/enemy.js',
  './js/game/hud.js',
  './js/game/rig.js',
  './js/game/meta.js',
  './js/game/metaui.js',
  './js/game/progression.js',
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
