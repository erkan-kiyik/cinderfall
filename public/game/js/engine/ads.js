// Rewarded-ad bridge for the free "watch an ad, open a crate" path.
// Inside the Capacitor app shell this drives a real AdMob rewarded video.
//
// ---------------------------------------------------------------------------
// Why a failed ad no longer pays out
// ---------------------------------------------------------------------------
// The simulated-ad overlay below exists so the reward loop stays testable in a
// plain browser, where there is no native SDK. It used to be the fallback for
// *every* failure of the native path — including "the device is offline" —
// which meant that inside the shipped app, with no network, tapping WATCH AD
// showed a placeholder literally reading "ADVERTISEMENT" and then granted the
// reward in full. Two problems at once: a dev artefact visible to players, and
// an economy where airplane mode is an unlimited source of scrap and
// revives.
//
// So the simulation is now a developer opt-in and nothing else: it runs only
// outside the native app AND only when the page was opened with `?simads`.
// Every other way of not having an ad — a plain browser, the app with the
// AdMob plugin missing, an initialize() that threw, no fill, no network —
// resolves the honest way: no ad, no reward, and a message saying so, which
// is also how a real rewarded ad behaves when there is no fill.
//
// The game ships as plain ES modules with no bundler, so the native plugin
// is never `import`-ed here — Capacitor auto-exposes every registered
// native plugin on the global `window.Capacitor.Plugins` bridge at runtime,
// which is what makes @capacitor-community/admob reachable without a build
// step. The mobile/ package.json dependency exists purely so `cap sync`
// finds and registers the plugin's native (Android/iOS) side.
//
// The ad unit ids, and whether to ask the SDK for test ads, come from
// ads-config.js. The committed copy holds Google's public TEST ids; the
// mobile build rewrites it inside the app bundle when real ids are supplied
// (mobile/scripts/sync-www.mjs), and the matching App ID goes into the
// native project (patch-android-manifest.mjs / patch-ios.mjs). Nothing here
// needs editing to go live — see docs/RELEASE.md §3a.
import { t } from './i18n.js';
import { ADS_CONFIG } from './ads-config.js';

function adConfig() {
  return window.Capacitor?.getPlatform?.() === 'ios' ? ADS_CONFIG.ios : ADS_CONFIG.android;
}

// Event name strings from @capacitor-community/admob's RewardAdPluginEvents
// enum (reward/reward-ad-plugin-events.enum.ts) — hardcoded rather than
// imported since this module never bundles the plugin's JS.
const EVT_REWARDED = 'onRewardedVideoAdReward';
const EVT_DISMISSED = 'onRewardedVideoAdDismissed';
const EVT_FAILED_TO_SHOW = 'onRewardedVideoAdFailedToShow';

let admobReady = null;   // AdMob plugin object once initialized | false (unavailable)
let initPromise = null;  // in-flight initialize(), so concurrent callers share one

async function getAdmob() {
  if (admobReady !== null) return admobReady;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const AdMob = window.Capacitor?.isNativePlatform?.() && window.Capacitor.Plugins?.AdMob;
      if (!AdMob) { admobReady = false; return admobReady; }
      await AdMob.initialize({ initializeForTesting: adConfig().testing });
      admobReady = AdMob;
    } catch (e) {
      admobReady = false;
    }
    return admobReady;
  })();
  return initPromise;
}

// ---------------------------------------------------------------------------
// Preloading — why the ad used to take so long to appear
// ---------------------------------------------------------------------------
// prepareRewardVideoAd() is a network round trip to Google's ad servers, and
// it used to sit on the tap path: the player pressed WATCH AD and only THEN
// did the game start fetching an ad. Worse, getAdmob() was on that same path,
// so the first ad of a session also waited on AdMob.initialize() first — two
// SDK/network operations in series, with no feedback on screen, in front of a
// button that just looked frozen.
//
// So the fetch moves off the tap entirely. initAds() warms the SDK at startup
// and loads the first ad; every ad queues the next one the moment it closes
// (or fails), so by the time a player reaches the next WATCH AD the ad is
// already in memory and showRewardVideoAd() can run on its own.
//
// `loaded` is the state that matters: it is only true once prepare has
// actually resolved, so the UI can tell "ready now" from "still fetching"
// rather than guessing.
let loaded = false;
let loading = null;     // in-flight prepare(), shared by concurrent callers
let lastPrepareFail = 0;
// After a failed fetch (no fill, no network) wait this long before trying
// again, so a screen that polls readiness cannot spin the SDK in a tight loop.
const PREPARE_RETRY_MS = 20000;


// Fetches one rewarded ad into memory. Safe to call at any time: it no-ops if
// an ad is already loaded or a fetch is already running. `force` skips the
// retry back-off — only the tap path uses it, since a player pressing WATCH AD
// is worth one live attempt even straight after a background miss.
export function preloadRewardedAd({ force = false } = {}) {
  if (loaded || loading) return loading || Promise.resolve(loaded);
  if (!force && lastPrepareFail && Date.now() - lastPrepareFail < PREPARE_RETRY_MS) {
    return Promise.resolve(false);
  }
  loading = (async () => {
    const AdMob = await getAdmob();
    if (!AdMob) { loading = null; return false; }
    try {
      const cfg = adConfig();
      await AdMob.prepareRewardVideoAd({ adId: cfg.rewarded, isTesting: cfg.testing });
      loaded = true;
      lastPrepareFail = 0;
    } catch (e) {
      // No fill or no network. Not fatal and not surfaced here — a tap while
      // unloaded still makes one live attempt (see watchRewardedAd), and a
      // failed watch schedules a background retry. The timestamp just stops
      // a tight retry loop.
      loaded = false;
      lastPrepareFail = Date.now();
    }
    loading = null;
    return loaded;
  })();
  return loading;
}

// One background retry after a failed watch, timed to land just after the
// back-off window, so a transient no-fill heals itself before the next tap
// instead of the next tap paying for the round trip. Deliberately a single
// shot rather than a loop — offline, a loop would poll the SDK forever.
let retryTimer = null;
function retryPreloadLater() {
  if (retryTimer || loaded || loading) return;
  const wait = lastPrepareFail ? Math.max(0, PREPARE_RETRY_MS - (Date.now() - lastPrepareFail)) : 0;
  // Forced: the single pending timer is the rate limit here, and a later
  // failed tap moving lastPrepareFail on must not silently cancel the retry.
  retryTimer = setTimeout(() => { retryTimer = null; preloadRewardedAd({ force: true }); }, wait + 50);
}

// True when a tap would open an ad immediately rather than fetching one.
export function isRewardedAdReady() { return loaded; }

// Called once at startup. Warms the SDK and pulls the first ad down long
// before the player can reach a WATCH AD button.
export function initAds() {
  getAdmob().then((AdMob) => { if (AdMob) preloadRewardedAd(); });
}

// The simulated ad is a developer tool, so it needs a developer to ask for
// it: `?simads` on the URL, and never inside the native shell, where a
// missing plugin is a real "no ad" and must read as one.
function simulationAllowed() {
  try {
    if (window.Capacitor?.isNativePlatform?.()) return false;
    return new URLSearchParams(window.location.search).has('simads');
  } catch (e) {
    return false;
  }
}

// Plugin listener handles are removed best-effort: remove() returns a promise
// on Capacitor 6, and a failure to detach must never become a failure to
// settle the watch.
function dropHandle(h) {
  try {
    const r = h && h.remove();
    if (r && typeof r.catch === 'function') r.catch(() => {});
  } catch (e) { /* already gone */ }
}

// Shows a rewarded ad and calls exactly one of the callbacks, exactly once:
//   onReward() — the viewer earned the reward (watched to completion)
//   onClose()  — the ad was dismissed early, failed to load, or the user
//                cancelled — no reward
export async function watchRewardedAd(onReward, onClose) {
  const AdMob = await getAdmob();
  if (!AdMob) {
    if (simulationAllowed()) simulateAd(onReward, onClose);
    else adUnavailable(onClose);
    return;
  }

  // Every exit below funnels through `settle`, and the first one wins. The
  // plugin's listeners are global to the plugin, not scoped to one show, so
  // a watch that failed without detaching them used to leave its onReward
  // armed: the NEXT successful ad's dismiss then paid out both — a crate plus
  // a stale scrap bundle, or a revive fired from the menu.
  let settled = false;
  let rewarded = false;
  const handles = [];
  const cleanup = () => { for (const h of handles.splice(0)) dropHandle(h); };
  const settle = (fn) => {
    cleanup();
    if (settled) return;
    settled = true;
    fn();
  };
  const fail = () => settle(() => {
    // The ad (if one was loaded) is spent or never arrived. Queue a
    // replacement off the tap path; the back-off inside preload keeps this
    // from hammering the SDK when the cause is "no network".
    preloadRewardedAd();
    retryPreloadLater();
    adUnavailable(onClose);
  });
  const listen = async (evt, fn) => {
    const h = await AdMob.addListener(evt, fn);
    // A listener that finishes registering after the watch already settled
    // must not outlive it.
    if (settled) dropHandle(h); else handles.push(h);
  };

  try {
    await listen(EVT_REWARDED, () => { rewarded = true; });
    await listen(EVT_DISMISSED, () => settle(() => {
      // The ad has closed, rewarded or not — this is the one moment that is
      // true on both platforms. showRewardVideoAd() only resolves on a reward
      // (Android and iOS alike), so queuing the next ad after that promise
      // left an early-dismissed ad with nothing preloaded behind it.
      preloadRewardedAd();
      if (rewarded) onReward(); else onClose?.();
    }));
    await listen(EVT_FAILED_TO_SHOW, fail);
    // The ad is normally already in memory (see preloadRewardedAd). If not —
    // first tap of a cold start, or a fetch that found no fill — make one
    // live attempt, sharing any fetch already in flight. Still nothing means
    // no fill: that is a failure, not something to show() into.
    if (!loaded && !(await preloadRewardedAd({ force: true }))) throw new Error('no fill');
    loaded = false;               // this ad is being spent
    // Not awaited: on both platforms this resolves only on a reward, and
    // never settles at all on an early dismiss or a failure to show — the
    // listeners above are what settle the watch. A rejection (nothing
    // loaded, plugin error) is still a failure.
    Promise.resolve(AdMob.showRewardVideoAd()).catch(fail);
  } catch (e) {
    // Native path failed: no fill, no network, or a plugin error. That is a
    // genuine "no ad available", so it resolves as one — the player keeps
    // their attempt and is told why, and nothing is granted.
    fail();
  }
}

// Honest "couldn't show an ad" notice. Deliberately not a reward path: it
// calls onClose, the same callback a dismissed-early ad uses.
function adUnavailable(onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'ad-sim-overlay';
  overlay.innerHTML = `
    <div class="ad-sim-box">
      <div class="ad-sim-label">${escapeHtml(t('ad.unavailableTitle'))}</div>
      <div class="ad-sim-sub">${escapeHtml(t('ad.unavailableBody'))}</div>
      <button class="ad-sim-skip" id="ad-unavailable-ok">${escapeHtml(t('ad.unavailableOk'))}</button>
    </div>`;
  document.body.appendChild(overlay);
  let settled = false;
  const close = () => {
    if (settled) return;
    settled = true;
    overlay.remove();
    onClose?.();
  };
  overlay.querySelector('#ad-unavailable-ok')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

// The strings come from the dictionaries, so they are data rather than markup
// — escaped before going anywhere near innerHTML.
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Dev-only stand-in (`?simads`, browser only — see simulationAllowed): a
// short full-screen countdown in place of a real rewarded ad. Skipping
// forfeits the reward, same as bailing out of a real rewarded-video ad.
function simulateAd(onReward, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'ad-sim-overlay';
  overlay.innerHTML = `
    <div class="ad-sim-box">
      <div class="ad-sim-label">ADVERTISEMENT</div>
      <div class="ad-sim-count" id="ad-sim-count">5</div>
      <div class="ad-sim-sub">Reward unlocks when the ad finishes</div>
      <button class="ad-sim-skip" id="ad-sim-skip">✕ SKIP (NO REWARD)</button>
    </div>`;
  document.body.appendChild(overlay);

  let n = 5;
  let settled = false;
  const countEl = overlay.querySelector('#ad-sim-count');
  const finish = (rewarded) => {
    if (settled) return;
    settled = true;
    clearInterval(timer);
    overlay.remove();
    if (rewarded) onReward(); else onClose?.();
  };
  const timer = setInterval(() => {
    n--;
    if (countEl) countEl.textContent = String(Math.max(n, 0));
    if (n <= 0) finish(true);
  }, 1000);
  overlay.querySelector('#ad-sim-skip').addEventListener('click', () => finish(false));
}
