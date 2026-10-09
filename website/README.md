# SECTOR 9: CINDERFALL — official website

The public website for the game, published to GitHub Pages together with the
privacy notice and terms. Plain HTML, CSS and one small JavaScript module: no
framework, no runtime dependencies, no trackers, no cookies.

```
website/
├── index.html            page template (tokens like {{PLAY_ATTRS}} are filled by the build)
├── site.config.mjs       the one configuration source (Play URL, contact, trailer, site URL…)
├── css/main.css          all styles, mobile first
├── js/main.js            all behaviour, progressive enhancement only
├── partials/             generated skyline SVGs for the hero (+ beacon/smoke positions)
├── assets/
│   ├── art/              the game's own painted art, exported to WebP (+ manifest.json of real stats)
│   ├── img/              responsive WebP screenshots / gameplay captures, key-art crop, icons
│   └── fonts/            Latin subsets of the fonts the game ships (OFL)
└── tools/                dev-only generators for everything in assets/ and partials/
```

## Build and preview

```bash
node --experimental-default-type=module scripts/build-website.mjs
npx serve site            # or: python3 -m http.server -d site
```

`scripts/build-website.mjs` first runs `scripts/build-legal-site.mjs` exactly as
before (it owns `./site` and writes `site/privacy/` and `site/terms/`), then
writes the website on top of it: `site/index.html`, `css/`, `js/`, `assets/`,
`manifest.webmanifest`, `robots.txt` and — when the public URL is known —
`sitemap.xml`. The build fails if any template token is left unfilled.

The **Deploy website and legal pages** workflow (`.github/workflows/pages.yml`)
runs the same command on every push to `main` that touches the site, the legal
texts or their sources, and passes the real Pages URL in as `SITE_URL`.

## Configuration

Everything that points somewhere lives in `site.config.mjs`. Any key can be
overridden with an environment variable of the same name.

| Key | Current value | Where it comes from |
| --- | --- | --- |
| `PLAY_STORE_URL` | `https://play.google.com/store/apps/details?id=com.cinderfall.sector9` | derived from `appId` in `mobile/capacitor.config.json` — the applicationId the release workflow builds |
| `CONTACT_EMAIL` | the controller address in `public/game/js/legal/controller.js` | same address the legal pages publish |
| `TRAILER_URL` | not set | the trailer dialog says plainly that no trailer is out yet |
| `SITE_URL` | set by the Pages workflow | needed for canonical / Open Graph / sitemap URLs, which must be absolute |
| `PRIVACY_URL`, `TERMS_URL` | `privacy/`, `terms/` | the routes `scripts/build-legal-site.mjs` publishes |
| `STUDIO_LOGO` | not set | the studio shows as a typographic wordmark until a logo file is added |

If `PLAY_STORE_URL` is empty, every install button renders in a visible
"coming soon" state with no link, and the QR code is left out — nothing ever
points at `#` or a guessed address. `TRAILER_URL` accepts a YouTube link
(played through youtube-nocookie.com, and only loaded once the dialog opens) or
a direct `.mp4` / `.webm` file.

The Google Play badge is Google's own artwork: the build downloads the official
PNG and serves it from the site, so visitors never contact Google. If the build
machine cannot reach Google, the page references Google's hosted copy instead,
and the page falls back to a plain text link if the image cannot load at all.

## Where the art comes from

Nothing on the page is stock or generated imagery.

- **Weapons, finishes, crate, scrap, medals, CROW** — rendered by the game's own
  painters in `public/game/js/art/*` and exported by `tools/export-game-art.mjs`.
  `assets/art/manifest.json` snapshots the real data the armory shows: names,
  damage, fire rate, spread, recoil, magazine, rarity, how each weapon is
  obtained and its finishes. The armory cards are rendered from it at build time.
- **Store screenshots** — `store/screenshots/*.png`, converted to WebP widths.
- **Gameplay captures** in "How it plays" and the hero phone — frames from the
  current game build, captured in Chromium through the game's own `?demo`
  hook with the touch controls on (`?demo&touch`). Sources are kept in
  `tools/captures/`.
- **Key art** — the lower half of `store/feature-graphic.png` in the final
  call to action, and the whole graphic as the social-sharing image.
- **Hero city** — original silhouettes from `tools/gen-skyline.mjs`.
- **Fonts** — Orbitron (wordmark), Rajdhani (display) and Inter (body) from
  `public/game/assets/fonts`, subset to Latin. Technical labels use the system
  monospace font.

Regenerate after the game's art or the store images change:

```bash
node website/tools/export-game-art.mjs     # needs Playwright + Chromium
python3 website/tools/build-images.py      # needs Pillow (+ fontTools, brotli for fonts)
node website/tools/gen-skyline.mjs
```

## Behaviour

`js/main.js` enhances markup that is already complete without it:

- sticky header with an IntersectionObserver-driven scrolled state and active
  section; accessible mobile menu (Escape closes, focus returns to the toggle)
- trailer and screenshot viewers built on native `<dialog>` (focus contained,
  Escape and backdrop close, focus returned; arrow keys and swipe in the viewer)
- threat meter cycling the game's five threat states, announced politely
- armory filters and a scroll-snap carousel with one tab stop and arrow-key
  movement between cards
- supply-crate preview that picks a real crate-eligible VK-77 finish, uniformly
  (it models no drop odds) and says so — no in-game reward is granted
- archive rows that answer "access restricted" with each file's real metadata

All decorative motion (rain, embers, smoke, fog, beacons, parallax, the
floating phone) is compositor-only, pauses when the hero is off screen and is
switched off entirely under `prefers-reduced-motion: reduce`.
