# KOR — Release Guide

Everything needed to take KOR from this repository to the stores. KOR took
Cinderfall's place under the same application id (`com.cinderfall.sector9`,
docs/KOR_YAPI.md): the next upload to the existing Play listing, signed with
the same upload key, is KOR (versionName 2.0.x). What remains is what only the
account holder can do: signing, the store uploads and the listing's forms.

---

## 1. What's already done (in this repo)

| Area | Status |
| --- | --- |
| Playable game | ✅ `public/game` — painted art baked on the device, no external textures |
| Origin-agnostic build | ✅ Relative paths — same files serve on web (`/game`) and in the app (root) |
| App icon | ✅ `mobile/assets/icon.png` (1024²), `store/icon-512.png` |
| Splash / launch screen | ✅ `mobile/assets/splash.png` (2732²) |
| Feature graphic | ✅ `store/feature-graphic.png` (1024×500) |
| Store screenshots (landscape) | ✅ `store/screenshots/*.png` (1920×1080, from the game) |
| Store copy (title/desc/keywords) | ✅ `store/listing.md`, `store/play/*.txt` |
| Privacy Policy + Terms | ✅ in the game (Settings) and as public pages (`scripts/build-legal-site.mjs`) |
| Mobile wrapper (Capacitor) | ✅ `mobile/` — config, scripts, docs |
| Quality / performance | ✅ quality tiers, a frame-time guard that thins effects, 120 Hz loop, safe areas |

## 2. What the developer must still do

1. **Keep the bundle id** `com.cinderfall.sector9` — it is the existing Play
   listing; a new id would be a new, unrelated app.
2. **Build and sign** the KOR bundle with the same upload key (see §5): run
   `release-android-aab.yml`, sign if the secrets are not set.
3. **Update the listing** — texts, icon, feature graphic and screenshots from
   `store/` (the screenshots are 1920×1080, 16:9).
4. **Fill the store questionnaires again for KOR** — content/age rating (IARC + Apple),
   data-safety form / App Privacy labels (see §2a — the game ships the Google
   Mobile Ads SDK, so the answer is NOT "no data collected"), and
   export-compliance (no non-standard encryption).
5. **Upload and submit** for review.

---

## 2a. Privacy, consent and store declarations

> **KOR:** the game itself shows no ads yet, but the consent flow and the
> Google Mobile Ads SDK are still in the app (kept for rewarded ads later).
> While the SDK ships, keep the declarations below; revisit them in Play
> Console if the SDK is removed or when ads are switched on.

The game shows a legal gate on first launch (`public/game/js/legal/`): country,
year of birth, Terms of Service (required), Privacy Notice / KVKK Aydınlatma
Metni (required acknowledgement), guardian confirmation for under-18s, and a
separate, optional consent for rewarded ads (US: "Do Not Sell or Share" opt-out
instead). The Google Mobile Ads SDK is never initialised without a valid basis,
and every request is non-personalised (`npa`) unless the player opted in.
Documents exist per regime (TR, EU/EEA, UK, CH, US, BR, CA, KR, JP, IN, AU, ZA,
MENA, RU, CN, other) in 9 languages. Controller identity lives in
`public/game/js/legal/controller.js`; bump `LEGAL_VERSION` there whenever a
text changes and every player is asked to accept again.

Store declarations that match what the app actually does:

- **Google Play → App content → Ads:** *Yes, contains ads.*
- **Google Play → Data safety:**
  - Data collected: *Device or other IDs* (advertising ID) and *Approximate
    location* (derived from IP by the ads SDK); *App interactions* (ad
    interactions). Collected by the Google Mobile Ads SDK, only when the player
    watches a rewarded ad.
  - Purposes: *Advertising or marketing*, *Fraud prevention, security, and
    compliance*, *Analytics* (ad measurement).
  - Shared: yes, with Google (ad delivery).
  - Processed ephemerally: no. Encrypted in transit: yes.
  - Users can request deletion: yes (Settings › Privacy & legal › Delete my
    data; advertising ID reset in device settings).
- **Google Play → Target audience:** 13+ (do not select under-13 age groups;
  the Families policy would then require a Families-certified ad setup).
- **Apple → App Privacy:** Identifiers (Device ID) and Coarse Location, used
  for Third-Party Advertising, linked to the user: no; used for tracking: no.
  On iOS every ad request is non-personalised (`ads.js`), so no App Tracking
  Transparency prompt is needed. If you later want personalised ads on iOS,
  add `NSUserTrackingUsageDescription` and request ATT first.
- **Privacy policy URL** for both stores: the GitHub Pages site (see the end
  of this guide); it renders the right regime and language from `?c=XX&l=xx`.
- **Real AdMob IDs** (when ads are switched on): replace Google's test App ID
  in `mobile/scripts/patch-android-admob.mjs`, add the ad code to the game, and
  configure the EU/UK consent message (IAB TCF) in the AdMob console.

These texts are carefully drafted against the laws named in them, but they are
not a substitute for review by a lawyer qualified in your jurisdiction.

---

## 3. Build the mobile apps

All wrapper commands live in `mobile/` and are documented in
[`../mobile/README.md`](../mobile/README.md). Short version:

```bash
cd mobile
npm install
npm run add:android && npm run add:ios     # ios on macOS only
npm run assets                              # icons + splashes into native projects
npm run open:android                        # → Android Studio → signed .aab
npm run open:ios                            # → Xcode → Archive → .ipa
```

### Lock orientation to landscape
After `cap add`, set landscape as the primary/only orientation:
- **Android** — `mobile/android/app/src/main/AndroidManifest.xml`, on the main
  `<activity>`: `android:screenOrientation="sensorLandscape"`.
- **iOS** — Xcode target → *General → Deployment Info → Device Orientation* →
  enable only *Landscape Left* / *Landscape Right*.

## 4. Alternative path — Play Store via TWA (no wrapper code)

Because the web build is a valid installable PWA, Android can also ship it as a
**Trusted Web Activity** with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap):
```bash
npx @bubblewrap/cli init --manifest https://<your-domain>/game/manifest.webmanifest
npx @bubblewrap/cli build          # → signed .aab
```
This requires the game to be hosted at a public HTTPS URL and a
`.well-known/assetlinks.json` for domain verification. Capacitor (§3) is the
recommended path since it also covers iOS.

## 5. Signing

- **Android** — create an upload keystore and enable Play App Signing:
  ```bash
  keytool -genkeypair -v -keystore cinderfall-upload.keystore -storetype PKCS12 \
    -alias cinderfall -keyalg RSA -keysize 2048 -validity 10000
  ```
  Keep the keystore + passwords **secret and backed up** (never commit them).
  PKCS12 keystores use one password for both the store and the key — keytool
  silently ignores a separate `-keypass` and reuses the store password, so
  don't record two different values expecting both to work.
- **iOS** — signing is handled in Xcode with your Apple Developer team;
  let Xcode manage the distribution certificate + provisioning profile.

### Building a signed `.aab` via GitHub Actions

`.github/workflows/release-android-aab.yml` builds a release-signed `.aab`
entirely in CI, so a signing key never needs to sit on a laptop or in this
repo. It needs three repository secrets (**Settings → Secrets and variables →
Actions → New repository secret**):

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | the keystore file, base64-encoded (`base64 -w0 cinderfall-upload.keystore`) |
| `ANDROID_KEYSTORE_PASS` | the store password |
| `ANDROID_KEY_PASS` | the key password (same as the store password for a PKCS12 keystore) |

Once those exist, run the workflow from the **Actions** tab (`Build signed
Android release AAB` → *Run workflow*) or trigger it via the API. It publishes
the `.aab` as a draft-off, prerelease GitHub Release (`release-aab-N`) and as a
build artifact — it is never written back into the repository. The keystore
itself is decoded to a runner-local temp file for the build only and deleted
before the job ends; it is not logged or uploaded anywhere.

**Losing this keystore means you can never publish another update to the same
Play Store listing** (a new keystore is a new, unrelated app to Google, unless
you've enrolled in Play App Signing's key-upgrade process — which itself
starts from your original upload key). Save a copy of the keystore and both
passwords somewhere durable — a password manager, not just this CI secret —
the moment you receive them.

## 6. Store asset specs (re-export at these sizes)

| Asset | Google Play | Apple App Store |
| --- | --- | --- |
| App icon | 512×512 PNG (32-bit) | 1024×1024 PNG, **no alpha** |
| Feature graphic | 1024×500 PNG/JPG | — |
| Screenshots | 2–8, min 320px, 16:9 landscape | per device class (e.g. 6.7" 2796×1290, 12.9" iPad) |
| Splash | via adaptive generation | via adaptive generation |

Sources: `mobile/assets/icon.png` (icon), `mobile/assets/splash.png`
(splash), `store/feature-graphic.png`.

## 7. Pre-submission QA checklist

- [ ] First launch: the legal gate, then the opening, then the lobby, no console errors
- [ ] Lobby → campaign → preparation → mission → result → lobby
- [ ] Story scenes before and after each mission play and can be skipped
- [ ] Touch controls: move, aim/fire, jump, crouch, reload, swap, abilities, pause
- [ ] Every operator in a mission (abilities, sidearm, cloth)
- [ ] Endless mode, daily tasks, crates, HAWK's trades, arsenal, profile
- [ ] Progress saves and resumes across a restart (localStorage)
- [ ] Safe areas respected (notch / home indicator) on menus, HUD and overlays
- [ ] Privacy Notice + Terms reachable from Settings
- [ ] Plays offline
- [ ] Stable frame rate on a mid-range device

---

*KOR is a work of fiction. All characters, companies and places are
fictional.*

## Privacy policy URL (Play Console)

Play requires a public https privacy-policy URL. `.github/workflows/pages.yml`
builds one from the in-game legal texts (`scripts/build-legal-site.mjs`) and
publishes it to GitHub Pages:

- one-time: repo **Settings -> Pages -> Source: GitHub Actions**, then run the
  *Deploy legal pages* workflow
- privacy policy URL: `https://<user>.github.io/<repo>/privacy/`
- terms: `https://<user>.github.io/<repo>/terms/`

The page already contains the full English text without scripts, and upgrades
itself to the visitor's country and language when scripts run. Editing
`public/game/js/legal/**` and pushing redeploys it.
