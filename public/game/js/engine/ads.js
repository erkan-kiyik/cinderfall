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
// So the simulation is now gated on *not* being the native app. In the app a
// rewarded ad that cannot be shown resolves the honest way — no ad, no reward,
// and a message saying so — which is also how a real rewarded ad behaves when
// there is no fill.
//
// The game ships as plain ES modules with no bundler, so the native plugin
// is never `import`-ed here — Capacitor auto-exposes every registered
// native plugin on the global `window.Capacitor.Plugins` bridge at runtime,
// which is what makes @capacitor-community/admob reachable without a build
// step. The mobile/ package.json dependency exists purely so `cap sync`
// finds and registers the plugin's native (Android/iOS) side.
//
// The AdMob App ID (patched into AndroidManifest.xml by
// mobile/scripts/patch-android-admob.mjs) and the ad unit ID below are
// Google's PUBLIC TEST ids — safe to ship, but they only ever serve test
// ads. Swap both for the real ids from your own AdMob account before a
// Play Store release.
import { t } from './i18n.js';

const REWARDED_UNIT_ANDROID = 'ca-app-pub-3940256099942544/5224354917';
const REWARDED_UNIT_IOS = 'ca-app-pub-3940256099942544/1712485313';

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
      await AdMob.initialize({ initializeForTesting: true });
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
// and loads the first ad; every show queues the next one immediately after, so
// by the time a player reaches the next WATCH AD the ad is already in memory
// and showRewardVideoAd() can run on its own.
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

function adUnitId() {
  const platform = window.Capacitor?.getPlatform?.();
  return platform === 'ios' ? REWARDED_UNIT_IOS : REWARDED_UNIT_ANDROID;
}

// Fetches one rewarded ad into memory. Safe to call at any time: it no-ops if
// an ad is already loaded or a fetch is already running.
export function preloadRewardedAd() {
  if (loaded || loading) return loading || Promise.resolve(loaded);
  if (lastPrepareFail && Date.now() - lastPrepareFail < PREPARE_RETRY_MS) {
    return Promise.resolve(false);
  }
  loading = (async () => {
    const AdMob = await getAdmob();
    if (!AdMob) { loading = null; return false; }
    try {
      await AdMob.prepareRewardVideoAd({ adId: adUnitId(), isTesting: true });
      loaded = true;
      lastPrepareFail = 0;
    } catch (e) {
      // No fill or no network. Not fatal and not surfaced — the next call
      // tries again, and a tap while unloaded still falls through to a live
      // prepare below. The timestamp just stops a tight retry loop.
      loaded = false;
      lastPrepareFail = Date.now();
    }
    loading = null;
    return loaded;
  })();
  return loading;
}

// True when a tap would open an ad immediately rather than fetching one.
export function isRewardedAdReady() { return loaded; }

// Called once at startup. Warms the SDK and pulls the first ad down long
// before the player can reach a WATCH AD button.
export function initAds() {
  getAdmob().then((AdMob) => { if (AdMob) preloadRewardedAd(); });
}

// Shows a rewarded ad and calls exactly one of the callbacks:
//   onReward() — the viewer earned the reward (watched to completion)
//   onClose()  — the ad was dismissed early, failed to load, or the user
//                cancelled — no reward
export async function watchRewardedAd(onReward, onClose) {
  const AdMob = await getAdmob();
  if (AdMob) {
    try {
      let rewarded = false;
      let rewardHandle, dismissHandle, failHandle;
      const cleanup = () => { rewardHandle.remove(); dismissHandle.remove(); failHandle.remove(); };
      rewardHandle = await AdMob.addListener(EVT_REWARDED, () => { rewarded = true; });
      dismissHandle = await AdMob.addListener(EVT_DISMISSED, () => {
        cleanup();
        if (rewarded) onReward(); else onClose?.();
      });
      failHandle = await AdMob.addListener(EVT_FAILED_TO_SHOW, () => {
        cleanup();
        // The ad was consumed without playing, so fetch a replacement rather
        // than leaving the next tap to pay for the round trip again.
        loaded = false;
        preloadRewardedAd();
        onClose?.();
      });
      // The ad is normally already in memory (see preloadRewardedAd). Only
      // fetch here if the preload has not landed yet — first tap of a cold
      // start, or a previous fetch that found no fill.
      if (!loaded) {
        if (loading) await loading;
        else await AdMob.prepareRewardVideoAd({ adId: adUnitId(), isTesting: true });
      }
      loaded = false;               // this ad is being spent
      await AdMob.showRewardVideoAd();
      // Queue the next one straight away so the following tap is instant too.
      preloadRewardedAd();
      return;
    } catch (e) {
      // Native path failed: no fill, no network, or a plugin error. Inside the
      // app that is a genuine "no ad available", so it resolves as one — the
      // player keeps their attempt and is told why, and nothing is granted.
      adUnavailable(onClose);
      return;
    }
  }
  // Not the native app: a browser with no ad SDK at all. Keep the simulated
  // ad so the reward path stays exercisable in development.
  simulateAd(onReward, onClose);
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

// Web / dev fallback: a short full-screen countdown standing in for a real
// rewarded ad. Dismissing early (tap the backdrop) forfeits the reward,
// same as bailing out of a real rewarded-video ad.
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
