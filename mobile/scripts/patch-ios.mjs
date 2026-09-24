// Patches the freshly-generated iOS project's Info.plist:
//
//   1. GADApplicationIdentifier — the AdMob App ID. The Google Mobile Ads SDK
//      terminates the app at launch if this key is missing, and neither
//      Capacitor's template nor @capacitor-community/admob adds it. The game
//      initialises AdMob at boot, so without it the iOS build cannot start.
//   2. Landscape only, on iPhone and iPad. The HUD, touch layout and camera
//      framing are all built for a phone held sideways (docs/MASTER_SPEC.md
//      §1.3), and a portrait launch is a broken first screen, not an option.
//
// The App ID comes from ADMOB_IOS_APP_ID (see admob-ids.mjs); unset, it is
// Google's test id. Run from `mobile/` AFTER `npx cap add ios` — `npm run
// add:ios` does — and again after anything regenerates ios/.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { admobIds } from './admob-ids.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const plistPath = resolve(here, '..', 'ios', 'App', 'App', 'Info.plist');

if (!existsSync(plistPath)) {
  console.error(`[patch-ios] Info.plist not found at ${plistPath} — did "cap add ios" run?`);
  process.exit(1);
}

const { appId, test } = admobIds('ios');
let p = readFileSync(plistPath, 'utf8');

// Sets a top-level <key>…</key> to `valueXml`, replacing any existing value.
// Info.plist's top-level dict holds only key/value pairs, and every value this
// script writes is a <string> or an <array> of strings, so a value runs up to
// its own closing tag.
function setKey(src, key, valueXml) {
  const existing = new RegExp(`\\s*<key>${key}</key>\\s*(<string>[^<]*</string>|<array>[\\s\\S]*?</array>)`);
  const entry = `\n\t<key>${key}</key>\n\t${valueXml}`;
  if (existing.test(src)) return src.replace(existing, entry);
  const end = src.lastIndexOf('</dict>');
  if (end < 0) throw new Error('[patch-ios] no top-level </dict> in Info.plist — template changed?');
  return src.slice(0, end) + entry.slice(1) + '\n' + src.slice(end);
}

const landscape = '<array>\n\t\t<string>UIInterfaceOrientationLandscapeLeft</string>\n\t\t<string>UIInterfaceOrientationLandscapeRight</string>\n\t</array>';

p = setKey(p, 'GADApplicationIdentifier', `<string>${appId}</string>`);
p = setKey(p, 'UISupportedInterfaceOrientations', landscape);
p = setKey(p, 'UISupportedInterfaceOrientations~ipad', landscape);

writeFileSync(plistPath, p);
console.log(`[patch-ios] AdMob App ID set (${test ? "Google TEST id — not for the App Store" : 'real id'}); landscape only`);
