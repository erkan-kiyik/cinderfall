# CINDERFALL // Sector 9 — Store Listing

Copy-ready text and asset references for the Google Play and Apple App Store
listings. All fields respect each store's current length limits.

---

## App name / title
- **Google Play – Title** (max 30 chars): `CINDERFALL: Sector 9`
- **App Store – Name** (max 30 chars): `CINDERFALL: Sector 9`
- **App Store – Subtitle** (max 30 chars): `2D Tactical Stealth Shooter`

## Short description (Google Play, max 80 chars)
`Stealth, cover and loot crates in a 2D tactical shooter set in a burning city.`

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

Copy-ready English and Turkish texts live in `store/play/` (`full-en.txt`, `full-tr.txt`, `short-en.txt`, `short-tr.txt`).

CINDERFALL: SECTOR 9 — one operator, one burning sector, no backup.

Comms went dark over Sector 9 the moment the power plant did. An unmarked force has dug into the foundries and isn't answering hails. You go in first, and you go in alone.

CINDERFALL is a stylized 2D tactical shooter built for touch. Every operator, weapon, muzzle flash and drifting cinder is drawn in code, so it stays sharp on any screen and runs light on cheap phones.

■ TACTICAL COMBAT
Read the threat meter, use cover and pick your shots. Enemies patrol, investigate noise, hunt your last known position and take cover, so sloppy play gets punished and patience pays off.

■ STRIKE FROM THE SHADOWS
Slip behind an unaware hostile for a silent knife takedown. Stay unseen and the rest of the squad is none the wiser. Get spotted and the whole sector lights up.

■ AN ENDLESS CAMPAIGN
Clear a stage and the next one is generated fresh: new layouts, new cover, new firefights every run. Your level and loadout carry over.

■ A BIG ARSENAL
Rifles, pistols, SMGs, snipers, a rocket launcher, a minigun, a flamethrower, a railgun, energy weapons and a blade. Each one handles differently, with its own recoil, reload and sound.

■ SUPPLY CRATES AND SKINS
Strip scrap from fallen hostiles and crack open supply crates for weapon skins and operator looks. Rarities run from common to legendary, and duplicates pay scrap back.

■ CROW, THE SCRAP TRADER
Prefer to choose? Visit CROW's stall. His stock changes every day, with marked-down pieces if you catch them in time. Everything is paid for in scrap you earn in play.

■ LIVELY, TACTILE MENUS
Springy buttons, sliding tabs, cards that tilt under your thumb and optional vibration on every press. Turn vibration off in Settings if you prefer.

■ BUILT FOR MOBILE
• Twin-stick touch controls with jump, reload, crouch, sprint, weapon swap, silent takedown and pause
• Game controller support
• Low / Medium / High / Ultra graphics with automatic tuning for smooth play on budget phones and flagships
• Safe-area aware UI for notches and rounded corners
• Plays fully offline, no account needed
• Optional rewarded ads you choose to watch, shown only with your consent where the law requires it
• Privacy notice and terms for your country shown on first launch, with consent choices you can change any time in Settings

Hold the line. Take the sector back.

CINDERFALL is a work of fiction. All characters, factions and locations are fictional.

---

## What's New (release notes — v1.0)
```
CINDERFALL launches out of Sector 9.
• Endless procedurally-generated tactical campaign
• Silent stealth takedowns + smarter enemy AI
• Crouch, cover and responsive twin-stick touch controls
• Gamepad support and Low→Ultra adaptive graphics
• Plays fully offline — no account, optional rewarded ads only with your consent
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
