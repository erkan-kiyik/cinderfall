# CINDERFALL // Sector 9 — Store Listing

Copy-ready text and asset references for the Google Play and Apple App Store
listings. All fields respect each store's current length limits.

---

## App name / title
- **Google Play – Title** (max 30 chars): `CINDERFALL: Sector 9`
- **App Store – Name** (max 30 chars): `CINDERFALL: Sector 9`
- **App Store – Subtitle** (max 30 chars): `2D Tactical Stealth Shooter`

## Short description (Google Play, max 80 chars)
`Hand-painted 2D tactical shooter — cover, stealth takedowns, endless combat.`

## Promo text (App Store, max 170 chars — updatable without review)
`New: adaptive graphics (Low→Ultra), gamepad support, silent takedowns, and an endless procedurally-generated campaign. Drop in and hold the line.`

## Keywords (App Store, max 100 chars, comma-separated, no spaces)
`shooter,tactical,stealth,2d,action,gun,offline,military,arcade,survival,sniper,run,gunner,shoot`

## Google Play tags / category
- Category: **Games › Action**
- Content rating target: **Teen** (stylised, non-gory combat)
- Tags: Action, Shooter, Offline, Single player

---

## Full description (Google Play max 4000 chars / App Store max 4000 chars)

**CINDERFALL — one operator, one dark sector, no backup.**

Comms went dark over Sector 9 the moment the power plant did. An unmarked force
has dug into the foundries and isn't answering hails. You go in first — and you
go in alone.

CINDERFALL is a hand-painted 2D tactical shooter built for touch. Every frame —
every operator, weapon, muzzle flash and cinder drifting over the skyline — is
drawn procedurally, so it stays razor-sharp on any screen.

**■ TACTICAL COMBAT**
Read the threat meter. Use cover. Pick your shots. Enemies patrol, investigate
sounds, hunt your last known position, take cover and coordinate — pushing
sloppy players and rewarding patient ones.

**■ STRIKE FROM THE SHADOWS**
Slip behind an unaware hostile for a silent knife takedown. Stay unseen and the
rest of the squad is none the wiser — get spotted and the whole sector lights up.

**■ AN ENDLESS CAMPAIGN**
Clear a stage and the next is generated fresh — new layouts, new cover, new
firefights, every single run. Your level, loadout and progress carry over.

**■ BUILD YOUR OPERATOR**
Earn currency in combat and crack open supply crates for weapon finishes and
operator skins. Kit out your rifle, sidearm, blade and more in the loadout bay.

**■ BUILT FOR MOBILE**
- Responsive twin-stick touch controls with jump, reload, crouch, sprint,
  weapon-swap, silent-takedown and pause buttons.
- External game-controller support.
- Adaptive graphics with Low / Medium / High / Ultra presets and automatic
  tuning, for smooth play from budget phones to flagships.
- Safe-area aware UI for notches and rounded corners.
- Plays fully offline. No account, no ads, no tracking.

Hold the line. Take the sector back.

*CINDERFALL is a work of fiction. All characters, factions and locations are
fictional.*

---

## What's New (release notes — v1.0)
```
CINDERFALL launches out of Sector 9.
• Endless procedurally-generated tactical campaign
• Silent stealth takedowns + smarter enemy AI
• Crouch, cover and responsive twin-stick touch controls
• Gamepad support and Low→Ultra adaptive graphics
• Plays fully offline — no ads, no tracking
```

---

## Asset checklist (files in this repo)

| Asset | Store spec | File |
| --- | --- | --- |
| App icon (source) | 1024×1024, no alpha | `public/game/assets/icon-1024.png` (+ `icon.svg`) |
| Adaptive/maskable icon | 512×512 | `public/game/assets/icon-maskable-512.png` |
| Feature graphic (Play) | 1024×500 | `store/feature-graphic.png` |
| Splash / launch source | 2732×2732 | `public/game/assets/splash.svg` |
| Screenshots (landscape) | ≥1280×720 | `store/screenshots/01-04*.png` |

**Still required from the developer** (device-specific, see `docs/RELEASE.md`):
- Final store screenshots captured on target devices / required aspect ratios.
- App Store 1024×1024 marketing icon export (from `icon.svg`, no transparency).
- Age-rating questionnaire responses (IARC / App Store).
