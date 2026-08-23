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

async function getAdmob() {
  if (admobReady !== null) return admobReady;
  try {
    const AdMob = window.Capacitor?.isNativePlatform?.() && window.Capacitor.Plugins?.AdMob;
    if (!AdMob) { admobReady = false; return admobReady; }
    await AdMob.initialize({ initializeForTesting: true });
    admobReady = AdMob;
  } catch (e) {
    admobReady = false;
  }
  return admobReady;
}

// Shows a rewarded ad and calls exactly one of the callbacks:
//   onReward() — the viewer earned the reward (watched to completion)
//   onClose()  — the ad was dismissed early, failed to load, or the user
//                cancelled — no reward
export async function watchRewardedAd(onReward, onClose) {
  const AdMob = await getAdmob();
  if (AdMob) {
    try {
      const platform = window.Capacitor.getPlatform();
      const adId = platform === 'ios' ? REWARDED_UNIT_IOS : REWARDED_UNIT_ANDROID;
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
        onClose?.();
      });
      await AdMob.prepareRewardVideoAd({ adId, isTesting: true });
      await AdMob.showRewardVideoAd();
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
