# KOR — Store Listing

Copy-ready text and asset references for the Google Play and Apple App Store
listings. KOR took Cinderfall's place under the same application id
(docs/KOR_YAPI.md), so these replace the Cinderfall listing. All fields
respect each store's current length limits.

---

## App name / title
- **Google Play – Title** (max 30 chars): `KOR`
- **App Store – Name** (max 30 chars): `KOR`
- **App Store – Subtitle** (max 30 chars): `2D Tactical Shooter`

## Short description (Google Play, max 80 chars)
- TR: `Vanta'nın tuttuğu şehirde beş kişilik bir hücre. Elle çizilmiş 2D nişancı.`
- EN: `Five people against the force that holds their city. A painted 2D shooter.`

## Promo text (App Store, max 170 chars — updatable without review)
`The city is Vanta's. The night is ours. Five operators, a rain-soaked city and the first act of the Kor line campaign.`

## Keywords (App Store, max 100 chars, comma-separated, no spaces)
`shooter,tactical,2d,action,offline,story,operators,cover,campaign,squad,resistance`

## Google Play tags / category
- Category: **Games › Action**
- Content rating target: **Teen** (armed combat, no gore)
- Tags: Action, Shooter, Offline, Single player

---

## Full description (Google Play max 4000 chars / App Store max 4000 chars)

Copy-ready texts live in `store/play/` (`full-tr.txt`, `full-en.txt`,
`short-tr.txt`, `short-en.txt`). The English text:

KOR — the city is Vanta's. The night is ours.

The foundry's furnace has been cold for four years. Power, bread and curfew now come from Vanta: a private firm that took over the city's "temporary" security and gets its contract extended every time it runs out. The Kor line is five people: a welder, a firefighter, a signals analyst who walked out of Vanta, a former courier and a dock worker. All they have is each other.

KOR is a 2D tactical shooter made for phones, painted by hand in look and feel.

■ FIVE OPERATORS, FIFTEEN ABILITIES
FLINT, WARDEN, VESPER, SKYE and BULWARK, each with three abilities from the life they had before.

■ A CITY THAT LIVES
The port gate, the morning market, the governor's square: rain, street lamps mirrored in wet asphalt, bare bulbs off a generator, fires in barrels.

■ TACTICAL COMBAT
Take cover and pick your moment. Vanta troopers patrol, investigate noise and change cover; the shield man pushes forward.

■ CAMPAIGN AND ENDLESS MODE
The first act of the Kor line campaign: three missions with story scenes. Endless mode with Secretary Gall every fifth wave. New tasks every day.

■ WEAPONS, CRATES, HAWK
Twelve weapons; weapon finishes in crates seized from Vanta; trade with HAWK, the oldest dealer in the market.

■ OFFLINE
Single player; no connection needed. Turkish and English.

KOR is a work of fiction. All characters, companies and places are fictional.

---

## What's New (release notes — 2.0)
```
Cinderfall is now KOR: a new game in the same app.
• A city held by Vanta, five operators of the Kor line
• The first act of the campaign: the port gate, the market, the governor's square
• Endless mode, daily tasks, crates, HAWK's trades
• Plays fully offline
Progress from Cinderfall does not carry over.
```

---

## Asset checklist (files in this repo)

| Asset | Store spec | File |
| --- | --- | --- |
| App icon (source) | 1024×1024, no alpha | `mobile/assets/icon.png` |
| Store icon (Play) | 512×512 | `store/icon-512.png` |
| Feature graphic (Play) | 1024×500 | `store/feature-graphic.png` |
| Splash / launch source | 2732×2732 | `mobile/assets/splash.png` |
| Screenshots (landscape, 16:9) | 1920×1080 | `store/screenshots/01-08*.png` |

**Still required from the account holder** (see `docs/RELEASE.md`):
- Upload the new texts, icon, feature graphic and screenshots in Play Console.
- Review the Ads and Data safety declarations (KOR shows no ads yet; the
  consent flow and the ads SDK stay in the app).
- Fill in the content rating questionnaire again for KOR.
- Upload the new AAB (versionName 2.0.x, same upload key).
