// AdMob ids for the native builds, one pair per platform.
//
// Committed with Google's public TEST ids, which serve test ads only and earn
// nothing. The mobile build replaces this file inside mobile/www (never here)
// with real ids when ADMOB_* are set in its environment — see
// mobile/scripts/admob-ids.mjs and docs/RELEASE.md. `testing` asks the SDK
// for test ads, and is only false once real ids are in place.
export const ADS_CONFIG = {
  android: {
    appId: 'ca-app-pub-3940256099942544~3347511713',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    testing: true,
  },
  ios: {
    appId: 'ca-app-pub-3940256099942544~1458002511',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
    testing: true,
  },
};
