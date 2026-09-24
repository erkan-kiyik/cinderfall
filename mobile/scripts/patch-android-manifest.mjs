// Patches the freshly-generated Android project's AndroidManifest.xml:
//
//   1. The AdMob Application ID. The Google Mobile Ads SDK crashes on first ad
//      request if this meta-data tag is missing — Capacitor's template doesn't
//      add it, and the @capacitor-community/admob plugin doesn't inject it
//      either. The id comes from ADMOB_ANDROID_APP_ID (see admob-ids.mjs);
//      unset, it is Google's public TEST id, which only ever serves test ads.
//   2. Landscape on the main activity (sensorLandscape: either way up). The
//      HUD, touch layout and camera framing are all built for a phone held
//      sideways (docs/MASTER_SPEC.md §1.3); this used to be a manual step in
//      the runbook that no build ever performed.
//
// Run from the `mobile/` directory AFTER `npx cap add android`, BEFORE the
// build. The android/ folder is regenerated on every CI run, so this must run
// each time; it is idempotent, and rewrites values that are already present.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { admobIds } from './admob-ids.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(here, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (!existsSync(manifestPath)) {
  console.error(`[patch-android-manifest] AndroidManifest.xml not found at ${manifestPath} — did "cap add android" run?`);
  process.exit(1);
}

const { appId, test } = admobIds('android');
let m = readFileSync(manifestPath, 'utf8');

// 1. AdMob Application ID
const existing = /(<meta-data\s+android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"\s+android:value=")[^"]*(")/;
if (existing.test(m)) {
  m = m.replace(existing, `$1${appId}$2`);
} else {
  const app = m.match(/<application\b[^>]*>/);
  if (!app) {
    console.error('[patch-android-manifest] expected <application> tag not found — Capacitor template changed?');
    process.exit(1);
  }
  m = m.replace(app[0], `${app[0]}\n    <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="${appId}"/>`);
}

// 2. Landscape on the launcher activity
const activity = m.match(/<activity\b[^>]*android:name="[^"]*MainActivity"[^>]*>/);
if (!activity) {
  console.error('[patch-android-manifest] MainActivity <activity> tag not found — Capacitor template changed?');
  process.exit(1);
}
const locked = /android:screenOrientation="[^"]*"/.test(activity[0])
  ? activity[0].replace(/android:screenOrientation="[^"]*"/, 'android:screenOrientation="sensorLandscape"')
  : activity[0].replace('<activity', '<activity android:screenOrientation="sensorLandscape"');
m = m.replace(activity[0], locked);

writeFileSync(manifestPath, m);
console.log(`[patch-android-manifest] AdMob App ID set (${test ? 'Google TEST id — not for a store build' : 'real id'}); sensorLandscape`);
