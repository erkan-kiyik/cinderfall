# CINDERFALL — Mobile packaging (Capacitor)

This folder wraps the CINDERFALL web game as native **Android** and **iOS**
apps using [Capacitor](https://capacitorjs.com). It contains **no game code** —
the game lives in `../public/game` and is copied into `./www` at build time by
`scripts/sync-www.mjs`. That keeps the codebase modular: gameplay is edited in
one place and simply re-synced here.

Everything up to a signed, submittable build is scripted below. Only a developer
account, signing identity, and the store upload itself remain manual (Apple and
Google both require those to be done by the account holder).

## Prerequisites
- Node 18+
- **Android:** Android Studio (SDK + build tools), JDK 17
- **iOS:** macOS with Xcode 15+ and CocoaPods

## One-time setup
```bash
cd mobile
npm install                # installs Capacitor + copies the game into ./www
npm run add:android        # creates ./android, then patches it (see below)
npm run add:ios            # creates ./ios   (macOS only), then patches it
npm run assets             # generates all icon + splash densities from ./assets
```
`npm run assets` reads `assets/icon.png` (1024²) and `assets/splash.png` (2732²)
— both already provided here — and writes every Android/iOS icon and splash
density into the native projects. Re-run it whenever the source art changes.

## Rebuild after a game change
```bash
cd mobile
npm run sync               # re-copies ../public/game → ./www and syncs native
```

## Produce store binaries
**Android (.aab for Play, .apk for sideloading):**
```bash
npm run open:android       # opens Android Studio
# Studio → Build → Generate Signed Bundle / APK → Android App Bundle (.aab)
```
Or headless once a keystore + signing config are in place:
```bash
cd android && ./gradlew bundleRelease     # → android/app/build/outputs/bundle/release/*.aab
```

**iOS (.ipa for the App Store):**
```bash
npm run open:ios           # opens Xcode
# Xcode → set Team/signing → Product → Archive → Distribute App → App Store Connect
```

## App identity (already configured in `capacitor.config.json`)
- **App ID / bundle:** `com.cinderfall.sector9`  *(change to your own reverse-domain before shipping)*
- **App name:** `CINDERFALL`
- **Orientation:** landscape — locked by the patch scripts below, on both platforms
- **Background / splash colour:** `#07090c`

## Native patches
`cap add` generates the native projects from Capacitor's templates, which lack
things the game needs. `add:android` / `add:ios` apply them straight after, and
`npm run patch:android` / `patch:ios` re-apply them whenever a native project is
regenerated:
- `scripts/patch-android-theme.mjs` — dark, edge-to-edge window theme.
- `scripts/patch-android-manifest.mjs` — AdMob App ID + `sensorLandscape`.
- `scripts/patch-ios.mjs` — `GADApplicationIdentifier` + landscape-only
  orientations. The Google Mobile Ads SDK crashes at launch without the App ID.

Ad ids come from `ADMOB_*` environment variables and default to Google's test
ids; a store build refuses test ids. See `scripts/admob-ids.mjs` and
docs/RELEASE.md §3a.

## Notes
- The service worker and the store-only art (PWA screenshots, the 1024px icon
  source, the Markdown docs) are left out of the Capacitor bundle; the PWA
  manifest is kept because `index.html` links it (see `scripts/sync-www.mjs`).
- The full submission checklist — signing, store metadata, screenshots, ratings —
  is in [`../docs/RELEASE.md`](../docs/RELEASE.md).
