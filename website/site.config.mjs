// The website's one configuration source.
//
// Every Google Play button, the QR code, the contact links, the trailer and
// the absolute URLs in the page metadata read from here — nothing is
// hard-coded in index.html. scripts/build-website.mjs resolves these values;
// any of them can also be overridden at build time with an environment
// variable of the same name (an empty variable means "not configured").
//
//   null  -> derive the value from the repository (described per key)
//   ''    -> not configured; the page shows an honest unavailable state
//            instead of a dead or made-up link

export const SITE = {
  // Google Play listing every install button, the badge and the QR code use.
  // null -> https://play.google.com/store/apps/details?id=<appId>, with appId
  // read from mobile/capacitor.config.json — the applicationId that
  // .github/workflows/release-android-aab.yml builds into the Play bundle.
  PLAY_STORE_URL: null,

  // Studio contact address (footer, studio section).
  // null -> CONTROLLER.email in public/game/js/legal/controller.js, the address
  // the published privacy notice and terms already give.
  CONTACT_EMAIL: null,

  // Trailer shown by WATCH THE TRAILER. A YouTube link (played through
  // youtube-nocookie.com, loaded only when the dialog opens) or a direct
  // .mp4/.webm file. '' -> the dialog says plainly that no trailer is out yet.
  TRAILER_URL: '',

  // Public origin + path of the deployed site, with a trailing slash, e.g.
  // https://example.github.io/cinderfall/. Needed for canonical, Open Graph,
  // robots.txt and sitemap.xml URLs, which must be absolute. The Pages
  // workflow passes the real one in (actions/configure-pages -> base_url).
  // '' -> those absolute-URL tags are left out rather than guessed.
  SITE_URL: '',

  // The privacy notice and terms that scripts/build-legal-site.mjs publishes
  // next to this page (site/privacy/, site/terms/). Relative on purpose: the
  // site is served from a sub-path on GitHub Pages.
  PRIVACY_URL: 'privacy/',
  TERMS_URL: 'terms/',

  // echosk studios logo, as a path under website/assets (e.g.
  // 'assets/brand/echosk-studios.svg'). '' -> a typographic wordmark, since no
  // logo file has been added to the repository yet.
  STUDIO_LOGO: '',
};
