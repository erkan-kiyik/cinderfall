# KOR LAB — rewrite (in progress)

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
- `js/art/enemies/syndicate.js` — Vanta Syndicate rifleman and shield trooper
- `js/art/weapons/` — Wren-9, Kestrel AR, Ramrod-12, Marksman DMR
- `js/art/env/street.js` — street cut and props
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
  preparation, operators, arsenal, crates, trader (HAWK), profile (summary,
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
- `js/ui/intro.js` — the opening, played over the bake: a CRT open, the
  burning skyline (fire glow, smoke, searchlight, rain, embers), the five
  operators on a rooftop painted with the game's own art and backlit by the
  fires, visors lighting one by one, the title rising letter by letter, the
  bake progress; at least 3.4 s, a tap skips, shorter with reduced motion;
  `?nointro` turns it off (dev scenes never show it). The hand-off starts the
  app, and the lobby plays its entrance (the camera settles, the operator
  drops onto the street, the panels slide in)

## Names
- the game is **KOR** in the LAB (app name "KOR LAB"); the operators show as
  FLINT (vex), WARDEN (hale), VESPER (morrow), SKYE (kite) and BULWARK
  (brick) through `opName()` in `js/ui/data.js` — the ids stay, so saves
  keep working; the player names themselves in the profile (default
  OPERATÖR; the old default KÜLKUZGUN is migrated)
- `js/ui/portraits.js` — menu portraits lit like the opening: the burning
  skyline behind, the operator dark against it with an ember rim on the
  fire side and the visor glowing in the operator's colour
  (`dev/sheet.html?what=avatars`)

## The street
- `js/art/env/city.js` — nine buildings (brick and plaster walk-ups, HAWK's
  shop, warehouse, Syndicate block, hotel with a vertical neon sign, auto
  repair, a burnt-out ruin, an alley), each baked once and laid out along the
  level by `facadeLayout()`: no building returns within three of its last
  use, HAWK's shop appears once; each building lists the lights and glows it
  throws, so neon, door lights and ember-lit windows follow the layout
- the ground: pavement slabs, kerb and gutter, storm drains, worn lane
  dashes, manholes, patches, cracks, puddles catching the lights; the far
  skyline burns at the horizon (glow bands, smoke columns, a crane)
- obstacles redrawn: framed crate with steel corners, jersey barrier with
  lifting loops, T-wall, irregular sandbags, oil drum with glowing air holes,
  dumpster with its lid, guard booth with a lit window and a beacon, terminal
  with a keypad, lamp post with its flange, containers with corner castings
- contact shadows under every obstacle and every character on its feet; the
  burn barrel's fire sits on the barrel (`course.fires`)
- neon: every building carries signs and tubes (BAR, BAKKAL, the hotel's
  OTEL, OTO SERVİS, the Syndicate's red emblem and İTAAT, the warehouse's 09,
  an alley arrow); steel riot barricades with a neon tube along the top
  replace the sandbags as cover (same tiles); each light flickers by kind
  (neon, buzz, fire) and is smeared down the wet road
- `js/game/streetlife.js` — the moving layer: rain with splashes, steam
  from manholes and drains, searchlights sweeping from the Tower and the
  works, blinking beacons, drones, flying traffic, the billboard's scan
  line; thinned out on low quality and with reduced motion
- `dev/sheet.html?what=env` — every building and obstacle on one page
- quality: Auto is High on every device (2.5× pixel ratio cap); dynamic
  resolution never drops below 80 %

## Characters — body standard v2
- `js/art/ops/body.js` — shared anatomy: heroic proportions (head about 1/7 of
  the height, wide high shoulders, V torso, limbs with mass), big gloves,
  chunky boots, knee and elbow pads, plate carrier, belt; every operator and
  the Syndicate enemies are built on it
- no faces: every operator wears a helmet, visor or mask (VEX's narrow ember
  visor, HALE's goggles and ballistic mask, MORROW's hood and lenses, KITE's
  visor and face guard, BRICK's slit helmet)
- the skeleton (`SK` in `js/art/figure.js`) moved the shoulders and neck up;
  hitboxes (`js/game/character.js`) and the ragdoll head follow it
- the crouch is a half kneel (back knee down, heel up, front shin upright)
- `dev/sheet.html?what=poses&op=vex&w=kestrel` — one character in idle, aim,
  run, crouch and aim-up, real size, silhouette, grey and a head close-up

## Status — content pass
- `js/game/abilities.js`, `js/ui/abilityhud.js` — two skills and an ultimate
  per operator in missions (E, G, X on a keyboard; buttons over the touch
  cluster); enemies react through the AI (blinded, slowed, smoke cuts sight)
- `js/art/env/mission2.js`, `mission3.js` — mission 2 (HAWK's stall: market,
  hold objective, scaffolding over a wall) and mission 3 (Secretary Gall: the
  plaza, a security gate, the act 1 boss with phases, grenades and a health
  bar); `game/mission.js` builds each run from its description (reach / hack /
  hold / boss) and runs the endless mode (the market walled off, waves, Gall
  every fifth wave, one life)
- `js/art/weapons/index.js`, `js/game/guns.js` — all twelve weapons: burst and
  bolt modes, a suppressed SMG, a slow-carrying LMG, a bouncing grenade
  launcher (rounds flown by `test/m3scene.js`)
- `js/core/economy.js` — owned weapons, weapon finishes (a tint over the
  factory paint, in the menus and in the game), crates with pity, HAWK's daily
  and weekly goods (seeded by the date), three daily tasks
- `js/audio/music.js` — synthesised lobby and mission music

Operator ids (`vex`, `hale`, `morrow`, `kite`, `brick`) stay as they are: they
key the save, the art and the strings; players only ever see the code names
(FLINT, WARDEN, VESPER, SKYE, BULWARK) from `ui/data.js`.
