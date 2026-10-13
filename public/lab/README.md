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

## Status — M2 (character + movement)
- `js/anim/rig.js` — runtime skeleton (same bone frames as `figure.js`),
  two-bone IK for legs (ankle targets) and arms (weapon grips, rungs)
- `js/anim/charbake.js` — every body part baked in its own bone frame, near
  and far variants, bounds measured automatically
- `js/gfx/charrender.js` — characters drawn into slots of a sheet, then
  composited through a live outline shader (one clean outer outline)
- `js/anim/animator.js` — distance-driven gait (no foot skating), walk/run/
  sprint blends, crouch, air, landing spring, slide, mantle, ladder; aim layer
- `js/anim/cloth.js` — verlet cloth (VEX's scarf)
- `js/phys/level.js`, `js/phys/mover.js` — tile level (solid, one-way,
  ladders, slopes) and the movement physics (coyote time, jump buffer,
  variable jump, mantle, slide, ladders)
- `js/game/input.js` — keyboard + mouse and floating touch sticks
- `js/art/env/course.js`, `js/test/m2scene.js` — the movement course
  (`?scene=m2`); tests: `node tools/lab/phys.test.mjs`

## Status — M3 (weapon core) — `?scene=m3`
- `js/art/weapons/` — guns split into moving parts (magazine, slide, pump)
  with rig points (ejection port, magazine axis and grab point, charging
  handle, shell port); `items.js`: casings, shells, knife, holster, effect shapes
- `js/game/guns.js` — stats and the fire / reload state machine: semi, auto
  and pump modes, recoil patterns, spread (movement, air, crouch, bloom),
  tactical and empty reloads, shell-by-shell shotgun reload, slide lock
- `js/anim/animator.js` — recoil spring, reload choreography (support hand to
  the magazine, pouch, magwell, charging handle; shells into the port),
  weapon swap, knife swing, hit flinch
- `js/game/character.js` — loadout (primary + sidearm), stowed guns (back
  sling, thigh holster), hit capsules from the live skeleton, damage, death
- `js/anim/ragdoll.js` — verlet ragdoll; limbs drawn by IK onto the
  simulated ankles and wrists so joints always bend naturally
- `js/game/ballistics.js` — hitscan: DDA through the tiles (slopes exact,
  one-way decks let bullets through), ray vs capsules and shield boxes, falloff
- `js/game/fx.js` — muzzle flash + light, tracers, sparks, dust, bullet holes,
  hit puffs, knife swoosh, bouncing debris (casings, magazines, dropped guns)
- `js/audio/sfx.js` — every sound synthesised at start-up (no audio files),
  positional playback with a compressor
- `js/ui/combathud.js`, `js/test/m3scene.js` — health, ammo, reload bar,
  crosshair with spread and hit markers; troopers that shoot back
- controls: mouse fire / right-click knife, R reload, Q (or wheel) swap,
  F knife; touch: aim stick fires past its outer ring, DOLDUR / BIÇAK / SİLAH
- tests: `node tools/lab/guns.test.mjs`, `ballistics.test.mjs`, `ragdoll.test.mjs`

## Status — M4 (vertical slice) — `?scene=mission`
- `js/game/ai/brain.js` — enemy AI on the same Mover and guns as the player:
  guard / patrol, awareness from a sight cone with line of sight and from
  gunfire, search, combat; rifleman takes the cover facing you and peeks to
  fire bursts, the assault (HÜCUMCU, new) rushes and dodges your aim, the
  shield trooper pushes in and bashes; squad fire tokens, suppression from
  near misses, difficulty (reaction, aim error, damage)
- `js/game/ai/cover.js` — cover points found in the tiles (4–6 tile obstacles)
- `js/art/env/mission1.js` — campaign mission 1 "SIZMA": approach, checkpoint
  post, container yard, gate court, extraction; new props (concrete barricade,
  guard booth, gate, terminal, checkpoint posts, extraction beacon)
- `js/game/mission.js` — objectives (reach, hack the gate terminal, extract),
  checkpoints and respawn, the gate opening and the last wave, ammo drops,
  health regeneration, briefing / pause / debrief with stars
- `js/ui/missionhud.js` — objective line, hack progress, clock, edge arrow to
  the objective, toasts, cards; damage direction in `combathud.js`
- tests: `node tools/lab/ai.test.mjs` (+ the M2/M3 tests)

## Status — M5 (UI design system) — default
- `js/app.js` — the application: one engine for the whole session, the
  menus over a live backdrop (`js/game/showcase.js`, half rate), missions
  started from preparation and handed back to the result screen; the Android
  back button (one guard history entry: back pauses a mission, closes a
  dialog, pops a screen, goes home, and twice in two seconds leaves)
- `js/ui/router.js` — screen stack with spring slide transitions (180–260 ms)
- `js/ui/kit.js` — element builder, icon set, press feedback (scale, haptics
  through Capacitor or `navigator.vibrate`, interface sounds on their own
  bus), dialogs, toasts, count-ups; `css/app.css` — the design system and
  every screen
- scaling: the menus are laid out on a canvas of at least 720×360 and zoomed
  with the screen (CSS `zoom`), so the composition holds from a 740×360 phone
  to a 2400×1080 display; the player's interface scale (85–115 %) never takes
  touch targets under 44 px (the hit token grows instead)
- `js/ui/screens/` — legal gate, lobby, mode select, campaign map,
  preparation, operators, arsenal, crates, trader (CROW), profile (summary,
  career, collection, achievements, statistics), settings (graphics, sound,
  controls, accessibility, language, privacy & legal), HUD editor, result
- `js/core/save.js` — versioned save with a backup copy and migration;
  campaign stars and best times, per-operator and per-weapon statistics,
  experience, levels and PARÇA
- `js/ui/i18n.js`, `js/ui/lang/` — Turkish and English for every menu and
  in-game string
- `js/legal/` — the shipping game's consent rules and texts, unchanged
- accessibility: colour-blind enemy outline (yellow / blue / magenta), camera
  shake, reduced motion, interface scale
- tests: `node tools/lab/i18n.test.mjs` (every key in every language)
