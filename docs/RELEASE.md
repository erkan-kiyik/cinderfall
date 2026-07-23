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
| App icon | ✅ `public/game/assets/icon.svg` + PNGs (192 / 512 / maskable / 1024 / apple-touch / favicon) |
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
5. **Fill the store questionnaires** — content/age rating (IARC + Apple),
   data-safety form (answer: *no data collected/shared* — see the Privacy
   Policy), and export-compliance (no non-standard encryption).
6. **Upload and submit** for review.

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
  keytool -genkey -v -keystore cinderfall-upload.keystore \
    -alias cinderfall -keyalg RSA -keysize 2048 -validity 10000
  ```
  Keep the keystore + passwords **secret and backed up** (never commit them).
- **iOS** — signing is handled in Xcode with your Apple Developer team;
  let Xcode manage the distribution certificate + provisioning profile.

## 6. Store asset specs (re-export at these sizes)

| Asset | Google Play | Apple App Store |
| --- | --- | --- |
| App icon | 512×512 PNG (32-bit) | 1024×1024 PNG, **no alpha** |
| Feature graphic | 1024×500 PNG/JPG | — |
| Screenshots | 2–8, min 320px, 16:9 landscape | per device class (e.g. 6.7" 2796×1290, 12.9" iPad) |
| Splash | via adaptive generation | via adaptive generation |

Sources to regenerate from: `public/game/assets/icon.svg` (icon),
`public/game/assets/splash.svg` (splash), `store/feature-graphic.png`.

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
