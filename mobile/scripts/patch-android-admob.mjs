// Injects the AdMob Application ID into the freshly-generated Android
// project's manifest. The Google Mobile Ads SDK crashes on first ad
// request if this meta-data tag is missing — Capacitor's template doesn't
// add it, and the @capacitor-community/admob plugin doesn't inject it
// either, so this has to run on every CI build (the android/ folder is
// regenerated each run).
//
// The App ID below is Google's PUBLIC TEST App ID — safe to ship, but it
// only ever serves test ads. Swap it (and the ad unit ID in
// public/game/js/engine/ads.js) for the real IDs from your own AdMob
// account before a Play Store release.
//
// Run from the `mobile/` directory AFTER `npx cap add android`, BEFORE the build.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(here, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

// Google's official public test Application ID.
// https://developers.google.com/admob/android/test-ads
const TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

if (!existsSync(manifestPath)) {
  console.error(`[patch-android-admob] AndroidManifest.xml not found at ${manifestPath} — did "cap add android" run?`);
  process.exit(1);
}

let m = readFileSync(manifestPath, 'utf8');

if (m.includes('com.google.android.gms.ads.APPLICATION_ID')) {
  console.log('[patch-android-admob] AdMob Application ID already present — skipping');
} else {
  const anchor = /<application\b[^>]*>/;
  const match = m.match(anchor);
  if (!match) {
    console.error('[patch-android-admob] expected <application> tag not found in AndroidManifest.xml — Capacitor template changed?');
    process.exit(1);
  }
  const metaData = `\n    <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="${TEST_APP_ID}"/>`;
  m = m.replace(anchor, `${match[0]}${metaData}`);
  writeFileSync(manifestPath, m);
  console.log('[patch-android-admob] injected AdMob Application ID (Google TEST id — replace before release)');
}
