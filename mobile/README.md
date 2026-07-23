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
npm run add:android        # creates ./android
npm run add:ios            # creates ./ios   (macOS only)
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
- **Orientation:** landscape (set per-platform after `cap add`; see docs/RELEASE.md)
- **Background / splash colour:** `#07090c`

## Notes
- The web build already ships a PWA manifest + service worker; those are for the
  browser/TWA path and are intentionally skipped inside the Capacitor bundle
  (see `scripts/sync-www.mjs`).
- The full submission checklist — signing, store metadata, screenshots, ratings —
  is in [`../docs/RELEASE.md`](../docs/RELEASE.md).
