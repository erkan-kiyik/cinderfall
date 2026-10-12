# CINDERFALL LAB — rewrite (in progress)

The from-scratch LAB rebuild described in `docs/LAB_REWRITE_PLAN.md`.
Since M1 the LAB app (`build-lab-android.yml`, `GAME_DIR: lab`) packages this
folder; the shipping game in `public/game` is untouched.

## Status — M0 (style board)
- `js/art/style.js` — palette and style tokens (shared with `css/tokens.css`)
- `js/art/kit.js` — paint kit: automatic 3-tone cel shading against a world
  key light, smooth shapes, outer-outline baking
- `js/art/figure.js` — skeleton, pose solving, two-bone IK, held weapons;
  parts are painted per bone so the in-game rig reuses them
- `js/art/ops/` — VEX, HALE, MORROW, KITE, BRICK
- `js/art/enemies/syndicate.js` — Ash Syndicate rifleman and shield trooper
- `js/art/weapons/` — Wren-9, Kestrel AR, Ramrod-12, Marksman DMR
- `js/art/env/street.js` — Sector 9 street cut and props
- `css/` — design tokens, components, screen layouts (lobby, arsenal)
- `dev/` — review sheets (`sheet.html?what=op&op=vex`, `weapons`, `street`,
  `board-*`) and UI mocks (`mock.html?screen=lobby|arsenal`); dev only

## Status — M1 (engine core)
- `js/core/loop.js` — fixed 120 Hz simulation, interpolated rendering,
  refresh-rate detection, frame statistics
- `js/gfx/gl.js` — WebGL2 context, programs, render targets
- `js/gfx/atlas.js`, `js/gfx/baker.js` — skyline-packed atlas pages, art baked
  per quality tier (wide layers chunked seam-free), IndexedDB page cache
- `js/gfx/batch.js` — instanced sprite batcher (48 B/sprite, one draw call per
  page/blend run)
- `js/gfx/renderer.js` — scene → low-res light buffer (point + cone lights) →
  lit composite + emissive → two-level bloom → grade/vignette/dither;
  quality tiers and dynamic resolution steps
- `js/gfx/particles.js` — GPU particles (analytic motion, ring buffer births)
- `js/gfx/camera.js` — framing by view height, parallax, trauma shake
- `js/test/m1scene.js`, `js/boot.js`, `js/ui/perf.js` — engine test scene with
  stress mode, live performance overlay and quality/effect toggles
