# CINDERFALL — Release Guide

Everything needed to take CINDERFALL from this repository to a live listing on
**Google Play** and the **Apple App Store**. The game is production-ready and
technically prepared for packaging; what remains is developer-account setup,
code signing, and the store uploads — the steps only an account holder can do.

---

## 1. What's already done (in this repo)

| Area | Status |
| --- | --- |
| Playable game | ✅ Complete, procedural art (no external textures to go missing) |
| Origin-agnostic build | ✅ Relative paths — same files serve on web (`/game`) and in the app (root) |
| PWA (installable + offline) | ✅ `manifest.webmanifest` + `sw.js` + meta tags |
| App icon | ✅ PNGs in `public/game/assets/` (192 / 512 / maskable / 1024 / apple-touch / favicon); full-resolution original art in `store/icon-source.png` |
| Splash / launch screen | ✅ `public/game/assets/splash.svg`, `mobile/assets/splash.png` (2732²) |
| Feature graphic | ✅ `store/feature-graphic.png` (1024×500) |
| Store screenshots (landscape) | ✅ `store/screenshots/*.png` (placeholders from the live game) |
| Store copy (title/desc/keywords) | ✅ `store/listing.md` |
| Privacy Policy + Terms | ✅ `public/game/legal/privacy.html`, `terms.html` (linked in-game) |
| Mobile wrapper (Capacitor) | ✅ `mobile/` — config, scripts, docs |
| Adaptive graphics / performance | ✅ Low→Ultra presets, object pooling, culling, gamepad, safe-areas |

## 2. What the developer must still do

1. **Register developer accounts** — Google Play Console ($25 one-time) and
   Apple Developer Program ($99/yr).
2. **Choose a bundle id** — replace `com.cinderfall.sector9` in
   `mobile/capacitor.config.json` with your own reverse-domain id.
3. **Generate signing credentials** (see §5) and build the binaries.
4. **Capture final screenshots** on the exact device sizes each store requires
   (the ones in `store/screenshots/` are correct in content but should be
   re-shot at each store's mandated resolutions — see §6).
5. **Set up AdMob** (§3a) — without it a signed build is refused, because the
   game would ship Google's test ads.
6. **Fill the store questionnaires** — content/age rating (IARC + Apple),
   export-compliance (no non-standard encryption), and the data-safety form
   (Play) / App Privacy details (Apple). The game itself collects nothing, but
   the native apps include the **Google Mobile Ads SDK**, which does collect
   data (device identifiers such as the advertising ID, IP address, ad
   interaction and diagnostic data) — declare what Google's own disclosure
   guides say it collects, for the SDK version you ship:
   [Android](https://developers.google.com/admob/android/privacy/play-data-disclosure) ·
   [iOS](https://developers.google.com/admob/ios/privacy/data-disclosure).
   Answering *no data collected* is a false declaration while ads are in.
7. **Upload and submit** for review.

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

### Orientation and native config
Landscape is locked for you: `npm run add:android` / `add:ios` run
`scripts/patch-android-manifest.mjs` (`sensorLandscape` on the main activity)
and `scripts/patch-ios.mjs` (landscape-only orientations on iPhone and iPad).
The same scripts write the AdMob App ID into the manifest / Info.plist; the
Google Mobile Ads SDK crashes without it. Re-run `npm run patch:android` /
`patch:ios` if anything regenerates the native projects.

## 3a. AdMob (rewarded ads)

The game's only ads are **rewarded** videos the player chooses to watch (a free
crate, bonus scrap, a revive). Everything in the repository uses **Google's
public test ids**, which serve test ads and earn nothing — correct for every
development build, and never acceptable in a store build.

1. In your AdMob account, create one app per platform and one **Rewarded** ad
   unit in each.
2. Supply the ids to the build as environment variables — as **repository
   secrets** for CI, or in your shell for a local build:

   | Variable | Value |
   | --- | --- |
   | `ADMOB_ANDROID_APP_ID` | Android app id, `ca-app-pub-…~…` |
   | `ADMOB_ANDROID_REWARDED_ID` | Android rewarded unit, `ca-app-pub-…/…` |
   | `ADMOB_IOS_APP_ID` | iOS app id |
   | `ADMOB_IOS_REWARDED_ID` | iOS rewarded unit |

   `scripts/sync-www.mjs` writes them into the app bundle's
   `js/engine/ads-config.js` (the committed file keeps the test ids) and the
   patch scripts put the app ids into the native projects. A platform needs
   both of its ids or neither; one alone fails the build.
3. **The guard.** With `CINDERFALL_STORE_BUILD=android` (or `ios`) set, test
   ids are a hard failure. The release workflow sets it automatically whenever
   it is about to sign the bundle, so a signed `.aab` can never carry test
   ads. For a local store build: `CINDERFALL_STORE_BUILD=ios npm run add:ios`
   (or `… npm run sync`) with the four variables set.
4. **Consent.** Serving ads to users in the EEA/UK requires a Google-certified
   consent message (Google's EU User Consent Policy). Configure the GDPR
   message in AdMob → *Privacy & messaging* before launch and verify the app
   shows it; the game does not yet request consent itself.
5. Keep test ids on every debug build (`build-cinderfall-android.yml` never
   receives these secrets): tapping your own live ads during testing can get
   an AdMob account suspended.

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
  > ⚠️ **THIS KEYSTORE IS THE ONE FILE IN THE PROJECT THAT CANNOT BE
  > REGENERATED.** Lose it, or its password, and you cannot sign another
  > update for this listing. Enrol in **Play App Signing** on your first
  > upload: Google then holds the app signing key, and a lost *upload* key can
  > be reset through a Play Console support request — slow and manual, but
  > possible. Without Play App Signing a lost key means a new, unrelated app.
  > Back up the file **and** the password somewhere durable, such as a
  > password manager, **the moment `keytool` finishes** — before you build
  > anything with it. The same applies to a keystore Android Studio creates
  > for you under *Generate Signed Bundle*.

  Never commit it.
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

Once those exist, run the workflow from the **Actions** tab (`Build Android
release AAB` → *Run workflow*) or trigger it via the API. It publishes
the `.aab` as a draft-off, prerelease GitHub Release (`release-aab-N`) and as a
build artifact — it is never written back into the repository. The keystore
itself is decoded to a runner-local temp file for the build only and deleted
before the job ends; it is not logged or uploaded anywhere.

A signed run also requires the AdMob secrets (§3a): it refuses to sign a
bundle that would ship test ads. Without the signing secrets it still builds,
unsigned, with test ids.

**A CI secret is not a backup** — GitHub will not show it to you again. Keep
the keystore and its password in your own durable storage as well (see the
warning in §5 above).

## 6. Store asset specs (re-export at these sizes)

| Asset | Google Play | Apple App Store |
| --- | --- | --- |
| App icon | 512×512 PNG (32-bit) | 1024×1024 PNG, **no alpha** |
| Feature graphic | 1024×500 PNG/JPG | — |
| Screenshots | 2–8, min 320px, 16:9 landscape | per device class (e.g. 6.7" 2796×1290, 12.9" iPad) |
| Splash | via adaptive generation | via adaptive generation |

Sources to regenerate from: `store/icon-source.png` (icon, full-resolution
original), `public/game/assets/splash.svg` (splash), `store/feature-graphic.png`.

## 7. Pre-submission QA checklist

- [ ] Launches to the menu with no console errors (verified headless each release)
- [ ] DEPLOY → cinematic → gameplay → pause → resume/restart/quit all work
- [ ] Touch controls: move, aim/fire, jump, reload, swap, crouch, takedown, pause
- [ ] Gamepad: sticks, triggers, face buttons, Start
- [ ] Graphics presets Low→Ultra switch cleanly; auto-lower fires under load
- [ ] Progress saves and resumes across a reload (localStorage)
- [ ] Portrait rotate-hint appears on phones; landscape is clean
- [ ] Safe areas respected (notch / home indicator) on menu, HUD, touch, overlays
- [ ] Privacy Policy + Terms reachable from the menu footer
- [ ] Offline launch works after first load (service worker)
- [ ] Stable frame rate on a mid-range device at High

---

*CINDERFALL is a work of fiction. All characters, factions and locations are
fictional. The app collects no personal data — see the in-app Privacy Policy.*
