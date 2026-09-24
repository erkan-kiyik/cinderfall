// Resolves the AdMob ids a native build is made with, for the three scripts
// that need them: sync-www.mjs (the ids the game's JS requests ads with),
// patch-android-manifest.mjs (the manifest's App ID) and patch-ios.mjs (Info.plist).
//
// Real ids come from the environment — repository secrets in CI, or a
// developer's shell:
//
//   ADMOB_ANDROID_APP_ID        ca-app-pub-<16 digits>~<10 digits>
//   ADMOB_ANDROID_REWARDED_ID   ca-app-pub-<16 digits>/<10 digits>
//   ADMOB_IOS_APP_ID
//   ADMOB_IOS_REWARDED_ID
//
// A platform with neither of its two set falls back to Google's public TEST
// ids, which serve test ads only and earn nothing — right for every debug
// build, and the reason a real store build must never carry them. Setting only
// one of the pair is an error rather than a silent fallback: a real app id with
// a test ad unit (or the reverse) is a build that looks configured and is not.
//
// CINDERFALL_STORE_BUILD=<platform> ('android' or 'ios') turns that
// platform's test ids into a hard failure. The release workflow sets it to
// 'android' whenever it is about to sign the bundle, so a store-ready .aab
// cannot be produced with test ads in it; set it to 'ios' for an App Store
// archive. It names one platform so an Android release is not blocked on iOS
// ids it does not use.

export const TEST_PUBLISHER = 'ca-app-pub-3940256099942544';

// https://developers.google.com/admob/android/test-ads
// https://developers.google.com/admob/ios/test-ads
const TEST_IDS = {
  android: { appId: `${TEST_PUBLISHER}~3347511713`, rewarded: `${TEST_PUBLISHER}/5224354917` },
  ios: { appId: `${TEST_PUBLISHER}~1458002511`, rewarded: `${TEST_PUBLISHER}/1712485313` },
};

const APP_ID = /^ca-app-pub-\d{16}~\d{10}$/;
const UNIT_ID = /^ca-app-pub-\d{16}\/\d{10}$/;

export function admobIds(platform, env = process.env) {
  const P = platform.toUpperCase();
  const appId = (env[`ADMOB_${P}_APP_ID`] || '').trim();
  const rewarded = (env[`ADMOB_${P}_REWARDED_ID`] || '').trim();
  let ids;
  if (!appId && !rewarded) {
    ids = { ...TEST_IDS[platform], test: true };
  } else {
    if (!appId || !rewarded) {
      throw new Error(`[admob] set both ADMOB_${P}_APP_ID and ADMOB_${P}_REWARDED_ID, or neither`);
    }
    if (!APP_ID.test(appId)) throw new Error(`[admob] ADMOB_${P}_APP_ID is not an AdMob app id (ca-app-pub-…~…)`);
    if (!UNIT_ID.test(rewarded)) throw new Error(`[admob] ADMOB_${P}_REWARDED_ID is not an AdMob ad unit id (ca-app-pub-…/…)`);
    ids = { appId, rewarded, test: appId.startsWith(TEST_PUBLISHER) || rewarded.startsWith(TEST_PUBLISHER) };
  }
  if (ids.test && env.CINDERFALL_STORE_BUILD === platform) {
    throw new Error(
      `[admob] refusing a store build with Google's TEST ${platform} ad ids. Set ADMOB_${P}_APP_ID and ` +
      `ADMOB_${P}_REWARDED_ID (repository secrets in CI) to your own AdMob ids — see docs/RELEASE.md.`,
    );
  }
  return ids;
}
