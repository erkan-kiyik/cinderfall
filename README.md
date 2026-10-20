# KOR

**A 2D tactical shooter for phones.** The city is held by Vanta, a private
security firm whose "temporary" contract never ends; the Kor line is five
people working against it from a basement under the market. Painted, not
drawn: every character, building and prop is painted in code, lit at night
by street lamps, bulbs and fires.

KOR took the place of *Sector 9: Cinderfall* in this repository and on the
stores (same application id). The structure of that change is in
[`docs/KOR_YAPI.md`](docs/KOR_YAPI.md); Cinderfall's last state is commit
`821c36c`.

## Layout

| Path | What it is |
| --- | --- |
| `public/game/` | The game: a self-contained web build (`index.html`, `css/`, `js/`, `assets/`). `dev/` holds review pages that are not shipped |
| `mobile/` | Capacitor shell that packages `public/game` as the Android / iOS app (`KOR`, `com.cinderfall.sector9`) |
| `tools/game/` | Tests (`*.test.mjs`), the plate ray tracer (`plate/`), the still series (`series/`) |
| `docs/` | `KOR_STORY_CINEMATIC.md` (story, world, art direction), `KOR_YAPI.md` (structure), `RELEASE.md` (release guide), `LAB_REWRITE_PLAN.md` (history of the rewrite) |
| `store/` | Store texts, icon, feature graphic, screenshots |
| `scripts/` | `build-legal-site.mjs`: the privacy notice and terms as public pages |
| `.github/workflows/` | `build-android.yml` (debug APK on every change, released as `kor-build-N`), `release-android-aab.yml` (store bundle), `pages.yml` (legal pages) |

## Run it

```bash
# serve public/ with any static server, then open /game/index.html
npx http-server public -p 8080   # http://localhost:8080/game/index.html
```

Useful query flags: `?nointro` (skip the opening), `?nostory`, `?q=high|med|low`.

## Test

```bash
for f in tools/game/*.test.mjs; do node $f; done
```

## Build

- Debug APK: push to `main` (changes under `public/game/` or `mobile/`); the
  APK is attached to the `kor-build-N` release.
- Store bundle: run `release-android-aab.yml`; see `docs/RELEASE.md` for
  signing (the upload key never enters the repository).

## License

See [`LICENSE`](LICENSE). Fonts under `public/game/assets/fonts/` carry their
own licences (OFL / Apache 2.0, listed in `ATTRIBUTION.txt`).
