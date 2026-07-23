// Patches the freshly-generated Android project so the app renders edge-to-edge
// on a dark background. Capacitor's default themes are Light / DayNight, which
// paint a WHITE window background — visible as white bands in the display-cutout
// letterbox on notched phones in light mode. This forces the dark AppCompat
// theme, pins our exact dark background, and opts the window into drawing under
// the cutout (shortEdges) so the game fills the whole screen.
//
// Run from the `mobile/` directory AFTER `npx cap add android`, BEFORE the build.
// The android/ folder is regenerated on every CI run, so this must run each time.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const resDir = resolve(here, '..', 'android', 'app', 'src', 'main', 'res');
const stylesPath = resolve(resDir, 'values', 'styles.xml');

if (!existsSync(stylesPath)) {
  console.error(`[patch-android-theme] styles.xml not found at ${stylesPath} — did "cap add android" run?`);
  process.exit(1);
}

let s = readFileSync(stylesPath, 'utf8');

// 1. Swap the light / day-night parents for the always-dark AppCompat theme.
s = s.replaceAll('Theme.AppCompat.Light.DarkActionBar', 'Theme.AppCompat.NoActionBar');
s = s.replaceAll('Theme.AppCompat.DayNight.NoActionBar', 'Theme.AppCompat.NoActionBar');

// 2. Pin the dark background + go edge-to-edge on the running (post-splash) theme.
const anchor = '<item name="android:background">@null</item>';
const inject =
  '<item name="android:background">@null</item>\n' +
  '        <item name="android:windowBackground">@color/cinderDark</item>\n' +
  '        <item name="android:navigationBarColor">@color/cinderDark</item>\n' +
  '        <item name="android:statusBarColor">@android:color/transparent</item>\n' +
  '        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>';

if (!s.includes(anchor)) {
  console.error('[patch-android-theme] expected anchor not found in styles.xml — Capacitor template changed?');
  process.exit(1);
}
if (!s.includes('android:windowLayoutInDisplayCutoutMode')) {
  s = s.replace(anchor, inject);
}

writeFileSync(stylesPath, s);

// 3. Define the dark colour in its own file so we never clobber generated colours.
writeFileSync(
  resolve(resDir, 'values', 'cinder_colors.xml'),
  '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="cinderDark">#FF07090C</color>\n</resources>\n'
);

console.log('[patch-android-theme] applied dark edge-to-edge theme');
