# SECTOR 9: CINDERFALL — Master Build Specification

*A complete technical + design brief for rebuilding this game (or one of equal sophistication) from zero. Written from the actual shipped codebase, not from aspiration — every number below is real.*

---

## 0. What this document is

The project's own `README.md` is the *vision* brief that started this game: aspirational, bullet-point, "every asset must look professionally created." That brief was necessary but not sufficient — it says *what* to want, not *how* fifty interlocking systems actually deliver it.

This document is the layer underneath it: the concrete architecture, formulas, data shapes and build order that turned that vision into a real, playable, shippable game. Section 18 turns all of it into a single paste-ready prompt for briefing an AI coding agent or a new engineer from scratch.

Treat this as a spec to implement against, not prose to admire. Every subsystem below is described at the level of "what file, what function, what numbers" — because that is the only level of detail that actually reproduces the result.

---

## 1. Premise and non-negotiable constraints

**Sector 9: Cinderfall** is a 2D side-scrolling tactical shooter. An operator fights through an endless, escalating campaign across a burning district, stage by stage, with real movement physics, a hand-solved weapon rig, AI that actually hunts, and a full free-to-play meta loop — built to ship on Android and iOS through a thin native wrapper.

Four decisions, made once at the start, shape everything downstream. Get these wrong and no amount of polish later fixes it.

### 1.1 Zero image assets — everything is code

There is not one PNG, JPG, SVG or sprite sheet in the game's visual pipeline. (The repository does carry binary files the game never draws: platform icons, the PWA install screenshots, the original icon art in `store/`, and the woff2 UI fonts.) Every character, weapon, prop, building facade, particle and UI icon is painted at runtime by JavaScript functions drawing onto offscreen `<canvas>` elements once at load, then blitted as bitmaps thereafter. This is not a style choice made for its own sake — it is a structural decision with real consequences that must be understood before writing a line of paint code:

- **Nothing can go missing.** There is no broken-image icon, no 404 texture, no asset pipeline to keep in sync across three platforms. A "premium 2048×2048 source asset" pipeline (what the original brief literally asked for) means an artist, an export step, a naming convention, and a hundred ways for one file to drift from its variants. A painter function cannot drift from itself.
- **Every variant is free.** A weapon with 7 finishes, a crate with a random dent pattern, a barrel with individual rust streaks — these are parameters to a function, not additional files. Seeded RNG (`makeRng(seed)`) makes every instance simultaneously unique and reproducible.
- **Resolution is a runtime dial, not a fixed export.** `ASSET_SCALE` (2 / 2.5 / 3 / 3.5 across the four quality tiers) multiplies the *painting* resolution, not the code. Low-end phones paint smaller and cheaper; nothing needs a "@2x" folder.
- **The cost moves from artist-hours to paint-code-hours.** This is the trade being made, explicitly. A painter function for one weapon (`weapons.js`) runs 40–90 lines describing gradients, rivets, wear patterns and finish variants procedurally. Budget accordingly: this is illustration work done in a general-purpose language, and it is genuinely harder to get looking "handcrafted" than tracing a reference photo — which is exactly why it is worth doing well.

### 1.2 No backend, ever

Every byte of state lives in `localStorage` on the device. There is no server, no account system, no database, and nothing here should silently assume one exists later. This has two large downstream effects design must account for from day one:

- **Any feature that "obviously" needs a server — referrals, leaderboards, cross-device sync — has to be redesigned around what two isolated clients can prove to each other, or dropped.** (See §8.4 for a worked example: an offline two-sided referral system built entirely from checksummed codes, with an explicit written admission of what it cannot prevent.)
- **Real-money purchases were built, then deliberately removed** once the no-backend, no-account constraint was taken seriously — a purchase with no server to validate the receipt against, and no account to attach entitlements to, is not a purchase a serious project should ship. The monetization surface that remains is a rewarded-ad economy plus a virtual "scrap" currency, both of which work entirely offline.

### 1.3 Landscape mobile is the primary target; desktop is a side effect

The touch layer, the HUD layout, the safe-area handling and the performance tiers are all designed mobile-first. Desktop mouse/keyboard input is supported by the same code paths (see §7), not a separate build.

### 1.4 Measure before you change anything

This is a process constraint, not a code constraint, but it is the single biggest determinant of whether the systems below actually feel good or merely look plausible in a diff. Every non-trivial tuning pass in this project's history was preceded by an instrumented measurement — not intuition. See §11 for the concrete methodology; it is not optional polish, it is how correctness was established for things like recoil spring damping, hit-region reactions, and frame budget.

---

## 2. Technology stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Vanilla ES modules, zero build step | The web build is served as-is; the mobile build copies the same files verbatim into a Capacitor `www/`. One codebase, no transpiler, no bundler surface to debug. |
| Rendering | 2D Canvas (`CanvasRenderingContext2D`) | No WebGL. All art is 2D-painted; a raster canvas is sufficient and universally supported, including in old WebViews. |
| Audio | Web Audio API, procedurally synthesized | Every gunshot, footstep, UI tick and ambience layer is built from oscillators/noise buffers at runtime (`engine/audio.js`) — same "no missing asset" logic as the visuals, applied to sound. |
| Persistence | `localStorage`, versioned keys (`cinderfall.progress.v1`, `cinderfall.run.v1`, …) | No backend (§1.2). Version-suffix every key so a future format change can migrate or discard cleanly. |
| Mobile packaging | Capacitor 6, wrapping `public/game` verbatim into `mobile/www` | `mobile/` adds zero game code — only the native shell, plugin registration (AdMob, splash screen, status bar) and build scripts. |
| CI | GitHub Actions: debug APK on every push to `main` that touches the game, the mobile shell or the workflow; a separate, opt-in workflow for a signed release `.aab` | Keep the fast feedback loop (debug build, every push) cheap and separate from the deliberately rare, secret-touching release path. |
| I18n | Flat key→string dictionaries per language, loaded eagerly | No i18n framework; `t(key, vars)` with English fallback so a partially-translated language degrades to readable text instead of blank UI. |

No frameworks (React, Vue, etc.) anywhere in the game layer. The DOM HUD is hand-written and hand-updated for the same reason the renderer is hand-written: at 60fps, on a mid-range phone, a virtual-DOM diff is a cost with no corresponding benefit here.

---

## 3. Repository layout

```
public/game/
  index.html            — single entry point; DOM HUD markup + <canvas>
  css/style.css          — ~2000 lines; design tokens + every screen's styles
  manifest.webmanifest, sw.js — installable PWA + offline cache
  legal/                — privacy.html, terms.html (linked from the menu footer)
  js/
    main.js              — ~1600 lines. Game class: states, fixed-step loop,
                            render pipeline orchestration, all UI wiring.
    engine/               — platform-agnostic primitives, zero game knowledge
      math.js             — clamp/lerp/damp/ik2/RNG/noise
      camera.js           — spring-follow + trauma-based screen shake
      particles.js        — pooled particle system, kind-tagged (spark/ember/smoke/…)
      audio.js            — synthesized SFX + music bus
      input.js             — keyboard/mouse, unified with touch
      touch.js              — virtual sticks + buttons, analog
      quality.js            — 4-tier performance presets + auto-downgrade
      daycycle.js           — time-of-day grade + weather state
      device.js, interlude.js, intro.js, i18n.js — platform glue, cinematics, localization
    art/                  — pure painters: (params) → canvas. No game logic.
      paint.js             — sprite factory + shared brushes (grunge/streaks/rim/AO/…)
      soldier.js            — character part atlas (skeleton constants + painters)
      weapons.js            — ~1900 lines. Every gun/blade, painted, per finish.
      skins.js              — operator + weapon skin variants
      environment.js         — props: crates, barrels, sandbags, signage, facades
      background.js          — sky/cloud/skyline/haze parallax layers
      trader.js, currency.js — NPC portrait, currency icon
    game/                  — simulation + meta systems (the actual gameplay)
      player.js  (~1350L)   — movement, weapon state machines, combat
      enemy.js    (~610L)   — perception, FSM, combat AI
      rig.js      (~590L)   — procedural pose solver + IK, shared by player & enemy
      world.js    (~965L)   — level data, physics/raycasts, decals, lights
      fx.js       (~600L)   — impact recipes, tracers, explosions, screen effects
      hud.js      (~520L)   — DOM HUD: bars, ammo, menus, all overlay screens
      progression.js         — XP/level, unlocks, persistent stats
      meta.js, trader.js, loot.js — item catalog, rarity, crate rolls, trader shelf
      metaui.js, traderui.js, statsui.js, profile.js — screen controllers
      difficulty.js          — endless-mode scaling curves
      barks.js, tutorial.js, achievements.js, archives.js, sharecard.js, retention.js
mobile/                  — Capacitor shell only; no game code
docs/RELEASE.md          — store submission + signing runbook
store/listing.md         — store copy
```

**~19,500 lines of JavaScript, zero binary art assets.** That ratio is the whole point of §1.1.

The `engine/` vs `art/` vs `game/` boundary is load-bearing, not decorative:
- `engine/*` never imports from `art/` or `game/` — it knows nothing about soldiers or weapons.
- `art/*` are pure functions: given parameters (and a seed), return a painted sprite object `{ cv, ax, ay, s, w, h }`. They never touch game state.
- `game/*` is the only layer allowed to know about both — it calls painters once at load, then drives the resulting sprites every frame.

This makes each layer independently testable and lets a change in one (e.g., a new weapon finish) never risk breaking another (e.g., enemy pathing).

---

## 4. Rendering pipeline

Executed once per animation frame, after a possibly-multiple fixed-step physics update (§5):

1. **Background composite** (screen space, outside the camera transform): the sky (baked once per resize at device resolution and copied 1:1) → an overcast wash in rain → drifting cloud strip (0.05× camera) → the apartment block, the one building layer (0.42×) → a cool drifting haze bank that sits *between* the buildings and the street (0.55×, plus its own slow crawl) → cool street-level fog → the weather pass → an atmospheric fog body → the time-of-day wash and night scrim, folded into one fill. Each strip tiles horizontally and scrolls at its own fraction of camera velocity — the parallax ratios *are* the depth cue.
2. **World layer** (inside the camera transform): ground strip → under-street fill and floor falloff → contact shadows → props → hazards (explosive barrels) → lamp light shafts (additive) → pickups → the persistent decal surface (blood pools, bullet holes, scorch marks — painted once, never redrawn) → corpses → live enemies → player → particles → tracers/slash trails → additive-blended particles on top.
3. **Foreground silhouette layer**: a near plane that scrolls *faster* than the player layer (1.24×), anchored strictly below the ground line so it can never occlude a character or a hitbox. This is the one direction of parallax easiest to forget — without something in front of the subject, the eye has no differential-motion cue in that direction at all. It is the one layer LOW drops.
4. **Lighting composite**: build a light map (vertical ambient gradient + every additive point light — lamps, muzzle flashes, fires, explosions) on an offscreen canvas, multiply it over the frame; separately blur an emissive-only pass and screen it back on top for bloom (HIGH/ULTRA tiers only — it is the single most expensive full-canvas filter pass and is cut first on weaker tiers).
5. **Color grade**: haze band + warm highlight push + cool shadow lift + vignette, as four full-screen passes on MEDIUM and up; on LOW, where the expensive `overlay`/`soft-light` blend modes are the actual cost, the two tonal passes fold into one flat tint and all four are baked into a small texture blitted in one draw. Animated film grain on HIGH/ULTRA.
6. **Player-adjustable brightness lift**: a final additive pass, entirely separate from the art-directed grade, because a scene graded for a dim room in a demo reel is frequently unplayable on a phone outdoors — this is a legibility control, not a taste slider, and it has to be last so it lifts everything underneath it rather than being crushed back down by the grade.
7. **Cockpit**: canvas-drawn crosshair (widens with spread), then the DOM HUD updates its own layer on top of the canvas entirely.

Rule worth stating explicitly: **anything that never changes once computed gets baked once, not recomputed per frame.** The sky bitmap (per viewport and pixel ratio), the fog and atmosphere gradients (per whole-pixel horizon — the camera eases, so keying on the raw float rebuilds every frame it moves), the light-map's ambient gradient, the grade's haze, each lamp shaft's gradient, the LOW-tier grade texture — cached against the value they depend on, rebuilt only when that value actually changes. This is what keeps a full lighting + bloom + grade pipeline affordable on a mid-tier phone; profiling this loop, not guessing at it, is how each of those caches earned its place.

---

## 5. Simulation loop and physics

- **Fixed 60 Hz update**, driven by an accumulator with a hard cap on catch-up steps (so a backgrounded tab does not "explode" physics by simulating minutes of missed time on refocus) — decoupled from the render call, which runs on every `requestAnimationFrame`.
- **AABB collision.** Entities resolve horizontal movement, then vertical, against a flat collider list, with a ground probe that lets an entity walk off a ledge rather than snapping to it.
- **Hitscan weapons** raycast (slab method, segment vs AABB) against three things in one pass: world colliders (tagged with a `mat` — metal/wood/concrete/sand — that selects the impact particle recipe and sound), explosive barrels (their collider reports as the barrel), and character hitboxes (26×134, with the head starting 108 above the feet — one definition in `game/hitbox.js`; ×1.9 hitscan, ×1.7 beam). A segment that starts inside a box hits it at t=0, and every round is traced from the shoulder, so a barrel pressed into or through cover hits the cover.
- **Movement is asymmetric, not one blended constant.** Pressing into a direction, releasing to a stop, and reversing hard at speed are three different physical events and get three different acceleration numbers:

  ```js
  const RUN = 300, SPRINT = 450, JUMP = -900;
  const ACCEL = 3000;       // pressing into a direction
  const DECEL = 4400;       // releasing to a stop
  const TURN_ACCEL = 5600;  // reversing hard at speed
  const AIR_ACCEL = 1500;   // steering in the air
  const STAND_H = 126, CROUCH_H = 63, SLIDE_H = 48;   // collider heights
  const COYOTE_T = 0.10;   // s a jump still registers after walking off a ledge
  const JUMP_BUFFER_T = 0.12; // s a too-early jump press is remembered for
  const HARD_LAND_SPEED = 1150; // impact speed that starts costing composure
  ```
  Gravity is shaped too: 1.7× while falling, 0.75× in a ±70 px/s band around the apex, capped at 1500 px/s down; and a 27px step-up lets a walker climb a kerb without a jump.
  Coyote time and jump buffering exist because a jump button that only works on the exact frame `onGround` is true is, empirically, the single most common "the controls feel bad" complaint a platformer gets — both windows are pure forgiveness, neither grants a capability the player did not already have, and both are consumed on use so neither can produce a double-jump by accident.
- **Squash-and-stretch is a real spring**, not a keyframed pop: one signed scalar (positive = squash, negative = stretch) integrated as a damped harmonic oscillator and applied as a non-uniform scale around the feet, driven by vertical velocity in the air and by landing impact on the ground. Apply the same model to *every* character that can fall or land — giving it only to the player and leaving enemies rigid is the single fastest way to make hostiles read as robotic (see §6.2).

---

## 6. Character rig — procedural skeletal animation

No animation clips, no skeletal mesh importer, no spritesheet. `game/rig.js` computes a full pose every frame from a small set of continuous inputs (speed, ground/air, breathing phase, gait phase, lean, weapon bulk) and solves it onto painted limb parts with inverse kinematics.

### 6.1 Pose solve

- **Gait phase** advances proportionally to horizontal speed (not wall-clock time — a stopped character has a stopped gait). Vertical bob comes from `|sin(gaitPhase)|` (one rise per step); lateral hip sway, a pelvic list and the shoulder counter-rotation from `sin(gaitPhase)`, which runs once per full stride and so has opposite sign over each leg's swing — with a small asymmetry (`WEIGHT_BIAS`, `PELVIC_LIST`, `STEP_BIAS`) so the two legs are never perfectly mirrored — perfect symmetry is what makes a walk cycle read as "a rig," not "a person."
- **Posture is forward-leaning by design.** `STANCE_PITCH` (~0.085 rad at rest) plus `RUN_PITCH` (up to +0.20 rad at a sprint) keep the chest over the feet under threat; the neck cancels ~62% of that pitch (`HEAD_COUNTER`) so the eyes stay level on the target even while the torso commits forward. The Player adds a speed lean (up to 0.15) and a sprint lean (up to 0.14) on top, which the head does not counter — about 0.575 rad of torso pitch at a full sprint. A held crouch drops the hips ~27px, so the drawn crouch sits inside the 63px crouch box. A character that stands bolt upright at a dead sprint reads as amateur before anything else about it is even assessed.
- **Shoulders counter-rotate against the hips** once per full stride — a torso twist faked as a horizontal offset in a 2D side view, essentially free to compute, and one of the highest-value "this is alive" cues available.
- **Weapon-weight stance.** Read a continuous "bulk" value directly off the equipped weapon's own geometry (how far the muzzle sits from the grip — no per-weapon authoring required) and let it modulate stance width, shoulder counter-rotation, and idle-sway damping. Anchor the model at the *most-used* weapon (e.g., the primary rifle) as the neutral point, so that weapon's stance is provably unchanged by the system's existence and every other weapon departs from it additively — verify this with a metrics harness (§11), not by eye.
- **Landing and jump squash** feed into the same spring as §5, read here as a body-wide scale.

### 6.2 Inverse kinematics

- Each weapon declares its grip points **in weapon-local space**: `gripA` (trigger hand), `gripB` (support hand), plus `muzzle`, `eject`, `magPos`, `boltPos`, `shoulder`. The weapon sprite is anchored to the shoulder joint, rotated by aim angle + whatever animation state is active; both hands solve onto the *transformed* grip points with closed-form two-bone IK (`ik2`, with reach clamping so an out-of-range target does not snap the limb straight).
- Consequence: hands can **never float off the weapon or clip through it** — they are constructed to land exactly on the declared points, every frame, for every weapon, automatically. Adding a new weapon means declaring six 2D points and two stat numbers; the rig, the HUD and the FX system pick it up with zero additional wiring.
- Draw order interleaves body layers and weapon layers (far upper arm under the gun; far forearm, support hand and near arm over it) so the silhouette reads correctly from either facing direction.
- Hands leave the grips only on purpose: the relaxed and sprint carries, the reload (the support hand goes to the magazine), the vault, and when a grip is out of reach.

### 6.3 Give enemies the exact same body, not a cheaper one

Every one of the above — gait phase, footing noise, squash spring, weapon bulk, posture, IK — must be computed for hostiles too, using the *same* rig code the player uses. A hostile that only receives a subset (say, gait but not footing noise, or posture but not squash) will visibly move on rails compared to the player standing next to it, and that contrast is far more noticeable than any single missing system in isolation. If the rig exposes a field for "how much this entity is wobbling underfoot," every entity that walks needs to populate it, with its own seed, so a squad crossing the same street does not march in lockstep.

### 6.4 Hit reactions carry direction and region

A hit should not do the same thing to a body regardless of where it landed or which side it came from. Split the hitbox into head/torso/leg regions (reusing whatever height boundary already drives a headshot damage multiplier — do not maintain two separate definitions of "this is the head"), and give each region its own reaction: a head hit snaps the body back-and-up and suppresses hardest; a torso hit folds forward over the impact; a leg hit buckles the stance without disturbing the upper body and barely interrupts return fire. Sign every term by which side the round came from relative to the target's facing, so a shot from behind pitches the target forward and a shot from the front rocks it back — one formula, no special-casing either direction.

---

## 7. Input — one abstraction, three physical sources

Keyboard+mouse, touch, and gamepad all resolve to the same logical control surface (`engine/input.js` unifies keyboard/mouse; `engine/touch.js` layers virtual analog sticks + buttons on top for touch devices; gamepad axes/buttons map into the same surface). Gameplay code (`player.js`) reads one input object and never branches on device type.

- **Touch sticks are analog and float**, not a fixed-position D-pad: the stick anchors where the thumb first touches, drag from there defines direction *and* magnitude (not just direction), so partial-magnitude input (a walk, not a run) is possible on touch exactly as it is with a keyboard's shift-modifier or a gamepad's analog stick. A digital-only touch stick is a common shortcut that makes a mobile game feel worse than its own keyboard build for no necessary reason.
- **Aim on touch is a direction, not a position.** A twin-stick: the right-hand stick sets the aim direction outward from the operator's own chest on screen (push at 2 o'clock, the shot goes to 2 o'clock) and fires past 0.24 deflection after a 0.09s settle; a released stick keeps its last aim. A gamepad's right stick uses the same anchor. Finger precision is coarse, so the aim model is designed around that rather than porting a mouse-aim assumption unmodified.
- **Each device writes only its own state.** Touch, keyboard/mouse and gamepad each hold their own keys, axes and trigger; releasing one never cancels another, so a touchscreen laptop or a phone with a controller works with every input at once.
- Control scheme is stable across the whole project: A/D (and ←/→) move; Space, W or ↑ jump; Shift sprint; C/Ctrl crouch; E takedown; F inspect; R reload; 1–4 weapon slots; Esc pause; F3 debug overlay. Gamepad: left stick (analog) move, right stick aim, RT fire, RB heavy strike, A jump, X reload, B takedown, Y next weapon, LB sprint, LT crouch, d-pad up inspect, Start pause. Never repurpose an already-meaningful key for an unrelated feature (the debug overlay belongs on a key nothing else uses — F3, by convention), and swallow browser shortcuts a game key can form (Ctrl + a game key) during play.

---

## 8. Weapon and combat system

### 8.1 Data-driven weapon definitions

One object per weapon (`art/weapons.js`), containing *both* the geometry the rig needs and the stats gameplay needs — one source of truth, never split across two files that can drift:

```js
rifle: {
  id: 'rifle', name: 'VK-77 "VANDAL"', slot: 1, kind: 'gun',
  body: rifleBody, finishes: rifleFinishes, finish: 'default',
  mag: paintRifleMag('ranger'), bolt: paintBolt(), flashes,
  // attachment points, weapon-local space, origin = trigger-hand grip
  gripA: { x: 0, y: 0.6 }, gripB: { x: 17.5, y: -4.6 },
  muzzle: { x: 40, y: -5.2 }, eject: { x: 9.5, y: -5.4 },
  magPos: { x: 6.8, y: 0.2 }, boltPos: { x: 6.6, y: -6.6 },
  shoulder: { x: -13, y: -4 },
  // stats
  auto: true, rpm: 690, dmg: 26, spread: 0.02, pellets: 1,
  recoilKick: 1.5, recoilRot: 0.022, camKick: 0.85, camTrauma: 0.042,
  recoilPattern: PATTERN_RIFLE, sprayPattern: SPRAY_RIFLE,
  magSize: 30, reserve: 120, reloadT: 2.1, reloadEmptyT: 2.75,
  shotSound: 'rifle', casingSize: 4.6, aimHeight: -4.8,
},
```

A shotgun sets `pellets > 1`; an energy weapon adds `recoilFeel: 'energy'` and heat/charge fields; every weapon still funnels through the exact same firing, reload and rig code. New weapon = new data object + a painter function. No new gameplay code.

### 8.2 Recoil as a damped spring, tuned by measurement

Recoil is **two coupled springs** — rearward kick (translation) and muzzle climb (rotation) — integrated per frame as a damped harmonic oscillator:

```js
v += -k * x * dt
v *= exp(-c * dt)
x += v * dt * m
```
…where `ω = sqrt(k·m)` and `ζ = c/(2ω)`. The failure mode to actively avoid: an under-damped spring (`ζ` well under ~0.6) rings — it overshoots, swings back past zero, and the *next* shot lands on a spring still oscillating from the previous one, which at automatic-weapon fire rates compounds into a visible, un-aimable bounce that reads as "not like a real gun." This is not a subjective judgment call: instrument the muzzle position across a sustained burst, measure peak-to-peak swing and settle time, and tune `k`/`c`/`m` until the *first* excursion (the kick the player is meant to feel) is preserved but the ringing after it is gone. A properly damped setup: one clean kick, ~130ms settle, negligible counter-swing — the shipped rifle springs sit at ζ ≈ 0.65 (climb) / 0.63 (kick), with under 1% counter-swing. Weapon bulk may add damping above the rifle but never removes it below: a light sidearm must not ring more than the rifle does.

Layer weapon **feel profiles** (`standard` / `light` / `heavy` / `energy` / `beam`) as multipliers on top of the shared spring — a shotgun's `heavy` profile multiplies kick ~1.4× and camera shake ~1.7×; a beam weapon's climb multiplier is *zero* (nothing to buck against) but it hums with a continuous lateral shudder instead.

### 8.3 Spray control as a skill, not a random cone

Holding the trigger walks the muzzle up a **fixed, learnable per-weapon path** (not purely random spread) — the player can watch the pattern happen and counter it by dragging the aim down, exactly like the real-weapon technique this is modeling. A random cone still widens on top for texture, but it should never carry the entire feel of "sustained fire is hard to control" on its own — a pattern with no random component is a QTE; a cone with no pattern is unlearnable. Recovery after releasing the trigger should be generous: a pattern nobody can reset by releasing for a beat is a pattern nobody learns. It must also never fire *between* shots of sustained fire — wait at least one full shot interval, or a float tie on the frame clock wipes the climb mid-burst — and past the end of the table only its alternating tail repeats, so the climb never restarts from zero.

### 8.4 The state machine, per equipped weapon, fully envelope-blended

Idle sway + breathing → walk/run bob → sprint carry (a distinct "port arms" pose, blended in at 7/s and out at 15/s; any fire intent cancels the sprint itself, so the first round leaves within a couple of frames — coming off a sprint to shoot must never wait on an animation, and a touch or gamepad player at full tilt is always sprinting) → jump raise / fall drop → landing dip → fire (recoil springs, muzzle flash sprite + light, bolt/slide cycle, shell ejection, accumulating spread) → tactical/empty reload (staged: mag releases → hand follows the falling mag → new mag seats with a slight overshoot-and-settle → bolt racks, each stage with its own sound) → inspect (a keyframed flourish, gated so it cannot interrupt combat readiness) → equip/unequip. A melee weapon gets the same shape: rest/equip/sprint/inspect plus quick and heavy strikes (windup → strike-with-motion-trail-and-a-slight-forward-lunge → recovery), with real hit reactions on whatever it connects with.

### 8.5 Offline two-sided referral codes — a worked "no backend" example

A referral feature normally needs a server for four things: proving a code belongs to a real other player, stopping self-redemption, stopping one device farming many codes, and paying the *inviter* once their friend actually plays. Only the first three are solvable offline, and only approximately. Build it from two checksummed codes instead of one:

1. Every install derives a stable **invite code** from a hash of its own random install ID (Crockford-style alphabet — no `I/L/O/U` — so a code read off one phone and typed into another never gets lost to 1/I or 0/O confusion, and a checksum character catches every single-typo and adjacent-transposition error). The check is computed in GF(32) — each character a 5-bit field element, weighted by distinct non-unit powers of the generator — because no weighted sum mod 32 can catch both error types. A friend enters it and is paid a joining bonus immediately.
2. Redeeming *mints* a **thank-you code**, layout `[2-char redeemer tag][3 chars binding the tag to the inviter's code][1 checksum]` — the tag travels *inside* the code specifically so the inviter, who has no other channel back to the friend's device, can still verify it and record the tag so the same friend cannot be paid twice.

State this in the code's own comments, honestly: this stops typos and casual guessing, not a determined player reading the client-side algorithm — there is no offline fix for that. The actual defense is economic, not cryptographic: small, capped rewards (e.g., a hard ceiling on how many friends one install can ever be paid for). If a real backend arrives later, verification moves server-side and the caps can relax — the two-code shape does not need to change.

---

## 9. Enemy AI

A layered finite-state machine, driven by a continuous awareness value rather than a binary "sees you / doesn't":

```
patrol → suspicious → search → alert → combat → retreat
```

- **Perception** combines a facing-dependent vision cone with peripheral vision and hearing (a nearby gunshot or a sprinting footstep both raise awareness even outside line of sight). Awareness ramps up faster than it decays, and decays only in `patrol`/`suspicious` — once genuinely alerted, backing off to full ignorance should take real time and a real loss of contact, not one broken line-of-sight frame.
- **`suspicious`** is the buffer state that keeps a flicker of vision (a half-second peek around a corner) from immediately escalating to full alert — awareness has to sustain, not merely spike: suspicious → alert needs awareness to fill, and sight fills it no faster than 0.65s of continuous exposure (slower still under the stealth perk). A shot fired in view, or being hit, escalates at once.
- **Sight follows the body.** Hostiles look for the operator at three quarters of his current height, so a crouch behind a crate breaks line of sight; point-blank sensing (any direction) shrinks with a crouch to inside takedown reach.
- **`search`** fires when line of sight is lost mid-engagement: hunt the last known position for a grace period (shorter at higher difficulty) before falling back to patrol, rather than instantly forgetting the player existed.
- **`combat`**: aim with settling error (wide at first contact, tightening the longer the target stays engaged, and tighter still at higher difficulty; a quick re-acquire keeps the settled aim), fire in 3–5 round bursts with gaps at every stage (difficulty shortens the gaps, never lengthens the bursts) rather than one continuous stream, aimed at the operator's real current box (crouch and slide genuinely shrink it), track a real magazine with animated reloads, flinch on being hit (rate-limited — a hostile that flinches on *every* connecting round of an automatic weapon never gets to fire back once, which is not difficulty, it is deleting the firefight), retreat when badly hurt.
- **Locomotion uses the same asymmetric accel/decel/turn model as the player** (§5), scaled down and with per-entity mass variance — hostiles should be able to be *out*-accelerated by the player (that gap is what makes flanking feel earned), but should never move by a single unconditional `damp()` toward a target speed, which never actually arrives at zero and reads as sliding rather than walking.
- **Squad awareness**: a hostile going down in view (the same vision cone as `perceive`, not bare line of sight) or earshot of allies raises their awareness directly — a body is one of the strongest "investigate here" signals available and should behave like one.

---

## 10. World / level system

Fully data-driven — a level is a list, not a hand-placed scene graph requiring an editor:

- **Colliders**: `{x, y, w, h, mat}` rectangles; `mat` (metal/wood/concrete/sand) is looked up by the impact-effect system to pick sparks-vs-splinters-vs-dust and an appropriate sound, so a wrong material tag is a visible, testable bug rather than a silent one.
- **Props**: painter reference + placement, some solid (collide) and some purely decorative. Struck props should register the hit as a small, spring-driven visual nudge of the *drawing only* — never the collider — capped small enough that cover never visibly detaches from the hitbox the player is standing behind; scale the nudge inversely with the prop's own footprint so a shipping container barely reacts to a rifle round and a wooden crate visibly jumps, without hand-authoring a mass value per prop.
- **Procedural variation, not one asset per prop type reused everywhere.** A crate painter that only varies surface grunge while every instance shares an identical outline will, at gameplay viewing distance, read as one stamped-out asset repeated down the street — the eye reads *silhouette* first, texture a distant second. Vary structural parameters (plank count, a knocked-off corner cut with `destination-out` compositing so it genuinely removes area rather than painting over it, which side a batten is missing) so the profile itself differs, not just its surface. Verify this quantitatively: paint a dozen instances, hash the alpha-channel silhouette of each, and confirm they are not all identical — eyeballing a screenshot will not catch a bug where the "variation" only ever touches pixels a soft rim-light and contact-shadow pass were about to wash out anyway.
- **Lights**: a flat list of point lights (position, radius, color, intensity, optional flicker), consumed by the lighting composite (§4).
- **Hazards**: chain-reacting explosive barrels — damage + shove nearby entities, scorch the ground into the persistent decal layer, shake the camera. Each barrel is placed at the nearest spot clear of other colliders with an open side, re-settled after the level is built: a barrel that ends up inside or wedged behind other cover is scenery, and positions written before the props were scaled up had put most of them there. Verify reachability by raycasting at each barrel from standing shooter positions.
- **Endless difficulty scaling** (`difficulty.js`): health and damage read off smooth, unbounded curves keyed to stage number, not a handful of hardcoded per-stage tables that quietly stop scaling once someone stops adding new rows — an endless mode needs a formula, not a lookup table with a ceiling nobody remembered to raise. The deliberate ceilings are named: enemy count caps at 34 (a frame-time budget; it binds around stage 178), AI skill saturates at 22, and bosses come on a fixed every-5th-stage cadence.

---

## 11. Engineering discipline: measure, don't guess

This is the part of the project's history most worth carrying into a rebuild, independent of any single system above. The recurring pattern behind every credible tuning claim in this codebase:

1. **State the concrete, numeric failure** before touching code — not "recoil feels bad" but "the climb spring's counter-swing overshoots 57% past zero and takes 300ms to settle, measured on the actual discrete integrator the game runs." A vague complaint produces a vague, unverifiable fix.
2. **Build a small, disposable, headless test harness** for the thing in question — a Node script driving a real headless-browser instance of the actual game (not a mock), reading real internal state (`window.__game`), and printing numbers. Screenshot comparisons for visual claims (does this obstacle's silhouette actually differ from the last one — hash the alpha channel and compare, don't eyeball a screenshot); direct method-timing for performance claims (`Game.update`/`Game.render` wrapped and timed directly — `requestAnimationFrame` deltas are quantized to the display's frame interval and say nothing useful at 60fps); live-state probes for physics/AI claims (call the real acceleration function with real inputs and read the real output).
3. **Change one thing**, re-measure with the same harness, and report the *before* and *after* numbers together — not "should be smoother now."
4. **Regression-test the parts that must stay unchanged**, not just the part you changed. If a system is anchored at a neutral point specifically so the most-used case is provably untouched (§6.1's weapon-bulk model, anchored at the primary rifle), that claim needs its own assertion, run every time, or it silently stops being true the next time someone touches the code.
5. **Distrust your own tooling as readily as the code under test.** Several genuine bugs in this project's history were caught by *harness* bugs first — a threshold set too low that drowned a real signal in noise from an unrelated soft shadow pass; a polygon that didn't contain the vertex it was meant to cut; a `CPUThrottling` measurement that quantized every run to an identical number and looked like a pass. The fix in each case was to notice the measurement was suspiciously uninformative and re-derive it, not to accept a clean-looking result at face value.

Concretely, for a rebuild: budget real time for small `.mjs` scripts under a scratch directory that boot the actual game in headless Chromium, drive it (`?demo=1` query-flag conventions for a scripted attract-mode bot are useful here — build one early), and assert on real numbers. This is not test-driven development in the unit-test sense; it is closer to instrumented, adversarial code review performed by the same person who wrote the change, before anyone else has to.

---

## 12. Meta-progression, economy and monetization

- **Single currency ("scrap")**, earned from combat and daily play, never purchasable with real money. A prior real-money purchase path existed and was **removed outright** once the no-backend/no-account constraint (§1.2) was taken seriously — there is no server to validate a receipt against and no account to attach an entitlement to, so a "purchase" would be an unenforceable, unrecoverable promise. Do not build one without first designing where entitlements actually live.
- **Crates**: a rarity-weighted roll table (`common` 58% / `rare` 27% / `epic` 11% / `legendary` 4%, plus trader-only `mythic`/`ultraLimited` tiers never rolled from a crate) opened with scrap or a rewarded-ad watch. A duplicate roll refunds a fraction of the crate cost rather than granting nothing — a "dupe" should never feel like a wasted roll.
- **The Trader**: a direct-purchase shelf, priced *relative to the crate cost* — rare 1.5×, epic 3×, legendary 5× one pull, and no stall discount ever below one crate — so a known item always costs more than a single roll. It is deliberately far cheaper than the *expected* spend to pull one specific item from crates (hundreds of pulls): the shelf is how a player gets the thing they actually want.
- **Progression**: XP thresholds on a smooth quadratic-plus-power curve (`120·n·(n+1)/2 + n^2.1·8`, not a linear or hardcoded per-level table), unlocking specific named rewards at specific levels (a weapon, an armor tier, a cosmetic finish) — concrete, anticipatable milestones read better than a generic "level up, get some scrap."
- **Rewarded ads**: preload the next ad immediately after showing the current one (and at boot, before the player can possibly reach a watch-ad button) — the single highest-impact fix available for "ads feel slow," since the actual ad-server round trip should never sit on the tap path if it can instead happen invisibly in advance. Never let a *failed* ad silently pay out (a legitimate temptation in a web-preview build with no real ad SDK to test against) — a failed/offline ad should resolve exactly like a real no-fill: no reward, and an honest message, never a simulated success. The simulated ad exists only behind an explicit developer flag (`?simads`, never in the native app). Every watch settles exactly once and detaches all its listeners, or a failed watch's reward fires on the next good one. Test ad ids live in one config the mobile build replaces from secrets, and a signed store build refuses to ship with test ids.
- **Retention surface, not a single "come back" nag**: a daily-reward streak, a recurring narrative voice delivering between-stage story beats (scaling tone with how deep the run has gone — "early," "mid," "late," "deep" tiers plus a boss set, not one repeating line) and rate-limited in-mission barks keyed to events, first-encounter contextual tutorial prompts (fire once, the first time the specific mechanic is relevant, never a blocking tutorial level), a shareable end-of-run result card, and achievements. Layer several small, honest hooks rather than one aggressive one.

---

## 13. UI/UX design system

### 13.1 Tokens (the actual values shipped)

```css
--amber: #d6453a; --amber-bright: #ff5c46;      /* one warm accent, used sparingly */
--ink: #edeae2;                                  /* primary text */
--bg-0: #0a0c0f; --surface-1..3: #13181f / #191f28 / #212934;  /* layered dark surfaces */
--line: rgba(233,226,210,0.10);                  /* hairline separators */
--sh-1/2/3: soft, directional, low-opacity black shadows — never colored glow as a default finish
--s1..s16: 4/8/12/16/20/24/32/40/48/64px          /* one 8px spacing scale, no ad-hoc values */
--r1/2/3: tight radii (2–7px)                     /* a tactical shooter reads harder-edged than a consumer app */
--font-display: "Orbitron", …                     /* headlines only */
--font: "Rajdhani", …                              /* everything else */
```

### 13.2 The trap to actively avoid: gradient-and-glow-on-everything

A near-black military palette with one warm accent is a genuinely strong direction. The way to *ruin* it, reliably, is to apply the same two-stop `linear-gradient(160deg, surface-2, surface-1)` wash to every card and panel, add a `inset 0 1px 0 rgba(255,255,255,…)` "lit top edge" highlight to every button (a light source that does not exist anywhere else in the scene), and put a colored glow on every hover state whether or not anything needs drawing attention to it. Each of those, once, is a legitimate choice. Applied to *every* surface in the interface at once, the combination is exactly what reads as generated rather than art-directed — it is a specific, nameable failure mode, not a vague aesthetic complaint, and it is worth explicitly designing against from the first component built:

- **One surface color per elevation level**, not a gradient standing in for a shadow. Reserve an actual gradient for places doing real work — a translucent scrim behind a HUD panel sitting over moving art, a progress-bar fill, hazard-stripe texture — never as the default finish on a static panel.
- **No fake light-source highlights** on flat UI chrome.
- **The accent color means exactly one thing: "this is the primary action."** Not "this is currently selected" *and* "this is the primary action" *and* "hover here" all competing for the same red on one screen — a selected-but-inert state (a chosen tab in a segmented control, an equipped-but-not-yet-confirmed item) should read as filled-and-neutral, not filled-in-the-action-color, or the one color meant to say "press me" stops meaning anything distinct the moment three other things on the same screen are also red.
- **Glow is a signal, not a finish** — reserve it for things that need it precisely because they're rare (a critical health bar, a boss encounter), never as decoration on a routine hover.

### 13.3 Layout discipline

- A shared content-column width, so a panel's heading never sits flush against one edge while the cards beneath it float centered in a much wider viewport — pick one column width and center every screen's content on it.
- Every tap target ≥ 44px in *both* dimensions, checked with an automated pass (`getBoundingClientRect()` on every interactive element, headless, across both a landscape-phone and a desktop viewport) rather than assumed — a 200×32px "cycling" settings button is invisible to the eye in a screenshot review and immediately obvious to a script that measures it.
- A cycling control (tap to advance through N states) is acceptable at N=2, actively bad at N≥3: the player cannot see what the other options are, cannot tell how many taps away the one they want is, and — worst case — cannot even read the label of the option they're currently cycling past if labels are long. Past two states, show every option at once (a segmented control, a picker with all choices visible) instead.
- Every settings/options screen needs to fit a 390px-tall landscape phone viewport with its "confirm/close" affordance always on screen — verify by measuring the panel's actual bounding box against the viewport, not by assuming a design comp scales down cleanly.

---

## 14. Performance tiers

Four presets (`engine/quality.js`), auto-selected by device signal at first boot (and saved, so the default cannot flip between launches) and always player-overridable, with the runtime allowed a small, strictly-monotonic, bounded budget of automatic step-downs (two, ever) if sustained frame time is poor even on a pinned choice. What keeps one bad minute from stranding a device is the monitor, not the budget: each frame's sample is capped at 0.1s, so a single hitch (a GC pause, an ad overlay returning) cannot count as sustained load; a step needs 4s of play averaging under ~38fps; and a new tier gets 8s of play before it is judged. A tier change resizes the particle pool at once.

| Tier | dpr cap | asset scale | max particles | bloom | grain | render scale |
|---|---|---|---|---|---|---|
| LOW | 1 | 2 | 900 | off | off | 0.7 |
| MEDIUM | 1.5 | 2.5 | 1600 | off | off | 0.85 |
| HIGH | 2 | 3 | 2600 | on | on | 1 |
| ULTRA | 3 | 3.5 | 3600 | on | on | 1 |

The single most expensive full-canvas step is a `filter: blur()` bloom pass — measured, at a representative CPU throttle, turning it on at MEDIUM ran at roughly a quarter of LOW's frame rate almost entirely from that one filter. **Gate the single most expensive pass at the tier boundary, not the second-most-expensive one** — profile to find which pass that actually is rather than assuming.

LOW also drops the foreground near plane and takes the baked single-draw grade (§4). `ASSET_SCALE` sets the resolution sprites are painted at; the large parallax paintings are fixed-size canvases.

`renderScale` (rendering the scene canvas below the device's already-capped pixel ratio, then letting the browser upscale the result to the CSS size) is the single bluntest and most effective lever on a rasterization-bound canvas game — cutting to 0.7 removes more than half the pixels for the cost of some softness in the 3D-equivalent scene only; the DOM HUD stays independently pin-sharp because it is never part of that canvas.

---

## 15. Localization

Flat per-language dictionaries (`engine/lang/{code}.js`), one object of `'key': 'string'` pairs, loaded eagerly and looked up through a single `t(key, vars)` helper that interpolates `{placeholders}` and falls back to English (then to the raw key) so a partially-translated or newly-added language can never blank out a screen.

Non-negotiables once you go past a single LTR language:
- **RTL affects reading direction, not physical control layout.** If touch controls place the movement stick under the left thumb and the aim stick under the right by physical position (not reading order), an RTL language must **not** mirror those two elements — pin them to `direction: ltr` explicitly while the rest of the document mirrors. Getting this wrong hands an RTL-language player *swapped controls*, which is not a translation nuance, it is a different, broken game for that audience specifically.
- **Anything genuinely Latin-alphabet-and-numerals in every language** (a shareable code, a numeric input field) stays `dir="ltr"` even inside an RTL document, or it gets copied out reversed.
- **Wide letter-spacing is a Latin-caps convention.** Applied to a joined script (Arabic) or a script that stacks diacritics/matras onto a base consonant (Devanagari), tracking does not read as "stylized" — it breaks letter joining or matra placement, which is a spelling error, not an aesthetic one. Reset tracking to normal specifically for those scripts.
- **A cycling or single-toggle language control stops working past ~3 languages** — see §13.3's general rule; a language switcher is the specific case where this bites hardest, because the player often cannot read the very label they'd need to know how many taps away their language is.
- Verify with an automated sweep: boot the game in every supported language, walk every screen, and assert zero console errors and zero visibly-overflowing elements — do this before ever asking a human to eyeball seven languages' worth of screenshots.

---

## 16. Mobile packaging and release pipeline

- **`mobile/`** is a thin Capacitor 6 shell that adds *no* game code — it copies `public/game` verbatim into `www/` at build time and wraps it. AdMob, splash screen and status bar are the only native plugins.
- **Two separate CI workflows, deliberately not one:**
  1. A **debug-signed APK**, built and attached to a GitHub Release automatically on every push to the main branch — fast feedback, install-and-test-on-a-device turnaround, no secrets involved.
  2. A **release `.aab`**, built only on manual trigger, signed with an upload keystore supplied through repository secrets (never committed) — kept separate specifically because it touches signing material and has no reason to run on every commit. Make the signing step *conditional*, not a hard failure, when the secrets are absent: Gradle can still produce a valid *unsigned* bundle with nothing configured, which can be signed after the fact with `jarsigner` by anyone holding the keystore — don't force every contributor through a secrets-setup step just to get a build artifact out of CI.
- **Never let AdMob test IDs or a debug keystore reach a real store listing** — call this out explicitly in the release runbook, because it is exactly the kind of thing that is invisible in a working build and only surfaces as "why are we not earning ad revenue" weeks after shipping. Make it a build failure, not only a warning: real ids come from secrets, and the release workflow refuses to sign a bundle that still carries test ids.
- **Native config belongs in scripts, not runbook steps.** `cap add` regenerates the native projects from templates, so everything the game needs there — the AdMob App ID (the Mobile Ads SDK crashes without it), landscape lock, the dark window theme — is applied by patch scripts that run after every `cap add`, locally and in CI.
- **Disclose what ships.** The store listing, privacy policy and data-safety answers have to match the SDKs actually in the binary; an ads SDK collects data even when the game itself collects none.
- **The signing keystore is the one irreplaceable artifact in this entire pipeline.** Losing it means the app can never receive another update under the same store listing (short of the platform's own key-recovery process, where one exists). State this in writing, loudly, next to wherever the keystore is generated — this is not a place for a gentle reminder.

---

## 17. Build order (the actual sequence that worked)

1. **Engine core**: math/RNG/noise, input unification (keyboard+mouse+touch+gamepad → one surface), camera, pooled particles, procedural audio. Nothing game-specific yet.
2. **Paint pipeline**: the sprite factory and a shared brush library (grunge, streaks, scratches, ambient occlusion, rim light) *before* painting a single character — every subsequent painter reuses these primitives, so getting them right once pays for the whole project.
3. **Character rig**: skeleton constants, part painters, the IK pose solver — built and verified against a static test pose before any weapon exists to hold.
4. **One weapon, fully**: geometry (grip points), painter, stats, the full animation state machine (§8.4), recoil model (§8.2). Get one weapon feeling completely right before adding a second — every subsequent weapon is data plus a painter against an already-correct system, not a new system.
5. **Environment and world**: prop painters, facade generator, ground strip, the parallax background stack, level data assembly, collision + raycasting.
6. **Enemy AI**: perception → FSM → combat, riding the same rig and movement model the player uses from day one (§6.3) rather than retrofitting parity later.
7. **HUD and menus**: bars, ammo readout, pause/settings, the meta screens (loadout, crates, trader, stats).
8. **Meta economy**: progression curve, crate rolls, trader pricing, unlocks.
9. **Lighting, bloom, color grade**, then the four performance tiers *against* that finished pipeline — profile first, then decide what each tier cuts, in cost order.
10. **Verification pass throughout, not at the end**: the headless-Chromium screenshot-and-metrics harnesses (§11) should exist from step 3 onward, growing alongside the systems they check, not bolted on afterward as a QA phase.
11. **Localization, monetization, retention systems, mobile packaging, release pipeline** — layered on last, deliberately, because each of them constrains something upstream (RTL constrains touch-control layout; the no-backend constraint shapes the referral design; the release pipeline's signing story shapes the CI structure) and is far cheaper to get right once, on a stable base, than to retrofit into a moving one.

---

## 18. The paste-ready master prompt

*Everything above, compressed into a single brief. Hand this to an AI coding agent (or a new engineer) as the opening instruction for the project, then work through §17's build order.*

> Build a 2D side-scrolling tactical shooter, shipping to Android and iOS through a thin Capacitor wrapper around a self-contained web build. Vanilla ES modules, no build step, no framework, Canvas2D rendering, Web Audio for sound.
>
> **Hard constraints, non-negotiable:**
> 1. Zero binary image assets anywhere in the visual pipeline. Every character, weapon, prop, background layer and UI icon is painted at runtime onto offscreen canvases by parameterized JavaScript functions, using seeded RNG for per-instance variation (rust patterns, crate damage, finish variants). No sprite sheets, no imported textures.
> 2. No backend, no account system, ever. All state in `localStorage`, versioned keys. Any feature that would normally assume a server (referrals, leaderboards) must be redesigned around what two offline clients can prove to each other, with the tradeoffs stated honestly in code comments, or dropped. No real-money purchases without first designing where the entitlement actually lives without a server to validate it against.
> 3. Landscape mobile is the primary target. Touch controls are analog floating virtual sticks, not fixed digital D-pads. Keyboard/mouse and gamepad resolve to the exact same input abstraction as touch — gameplay code never branches on device type.
> 4. Every non-trivial tuning decision is backed by an instrumented, headless-browser measurement (real internal state, real timing, real pixel diffs) — not by eye, not by intuition. Build small disposable Node+Playwright test scripts alongside every system as it's built, not after.
>
> **Architecture**: strict three-layer separation. `engine/` (math, input, camera, particles, audio, quality tiers) knows nothing about the game. `art/` is pure painter functions — `(params, seed) → sprite` — that never touch game state. `game/` is the only layer that imports both, calling painters once at load and driving the results every frame.
>
> **Character rig**: no animation clips. Compute pose every frame from continuous inputs (gait phase advancing with horizontal speed, breathing timer, landing/jump squash as a damped spring, forward-leaning posture that increases with sprint speed, shoulder counter-rotation against the hips per stride). Solve both arms with two-bone IK onto weapon-declared grip points so hands never float or clip, for any weapon, automatically. Give enemies the *exact same rig code* the player uses — same squash spring, same per-entity seeded footing noise, same weapon-weight stance model — or they will visibly move on rails next to the player.
>
> **Movement**: asymmetric acceleration (separate values for pressing a direction, releasing to a stop, and reversing hard at speed — never one blended constant). Coyote time and input buffering around jumps. A real damped-spring squash/stretch on every entity that can fall or land.
>
> **Weapons**: one data object per weapon holding both rig geometry (grip/muzzle/eject/mag points) and gameplay stats (rpm, damage, spread, recoil coefficients, magazine size). Recoil is two coupled damped-harmonic-oscillator springs (kick + climb); tune damping by measuring peak-to-peak muzzle excursion across a sustained burst on the real discrete integrator until the first kick survives but ringing after it does not — a critically-damped setup settles in roughly one tenth of a second with negligible counter-swing. Sustained-fire spread follows a fixed, learnable per-weapon path the player can counter by dragging aim against it, not a purely random cone. Full envelope-blended animation state machine per equipped weapon: idle sway → locomotion bob → sprint carry → jump/fall/land → fire → staged multi-part reload → inspect → equip/unequip.
>
> **Enemy AI**: layered FSM — patrol → suspicious → search → alert → combat → retreat — driven by a continuous awareness value (vision cone + peripheral + hearing) that ramps faster than it decays and only decays pre-alert. Combat state: settling aim error, burst fire with gaps, tracked magazine with animated reloads, rate-limited flinch (never allow permanent hit-stun-lock), retreat when badly hurt. Locomotion uses the identical asymmetric-acceleration model the player uses, scaled down with per-entity mass variance, deliberately slower to accelerate than the player so flanking feels earned.
>
> **World**: fully data-driven level — collider list (tagged by material for impact-effect selection), prop placements with per-instance procedural silhouette variation (not just surface-texture variation — verify variation quantitatively by hashing painted alpha-channel silhouettes, not by eyeballing screenshots), a light list, hazards, a foreground parallax layer scrolling faster than the play surface and anchored strictly below the ground line so it can never occlude gameplay.
>
> **Rendering pipeline order**: background parallax (screen space) → world layer (camera space: environment → decals → corpses → live entities → player → particles → tracers) → foreground parallax → lighting composite (ambient gradient + additive point lights, multiplied; separate blurred emissive pass screened back for bloom) → color grade (warm/cool split-tone + vignette + film grain) → player-adjustable brightness lift, applied last so it lifts everything under it → DOM HUD on top.
>
> **UI**: a near-black layered-surface palette with exactly one warm accent color, and that color means exactly one thing — "this is the primary action" — never doubled up as a "currently selected" indicator on the same screen. No default-finish gradients standing in for shadows; no fake `inset` light-source highlights on flat chrome; glow reserved for things that are actually rare (critical states), never routine hover decoration. Every tap target ≥44px, verified with an automated `getBoundingClientRect()` pass across phone and desktop viewports, not assumed. Any control offering 3+ discrete options must show all of them at once (segmented control / picker), never a blind cycling button.
>
> **Meta loop**: single non-purchasable virtual currency; rarity-weighted crates (with a partial refund on duplicates, never nothing); a direct-purchase shelf priced relative to crate cost so certainty costs a premium over gambling; a smooth (not hardcoded-per-level) XP curve unlocking specific named rewards; rewarded ads preloaded ahead of the tap that would show them, never simulating a reward on a failed/offline ad.
>
> **Performance**: four quality tiers gated primarily on whichever single rendering pass profiling reveals as most expensive (commonly a full-canvas bloom blur), plus a render-resolution scale as the bluntest lever; runtime auto-downgrade under sustained poor frame time, bounded and strictly monotonic so a bad minute can't permanently strand a device on the floor.
>
> **Localization**: flat per-language key→string dictionaries with English fallback; RTL mirrors reading direction but never the two touch-control sticks (they're physical thumb positions, pin them `ltr`); shareable codes and other Latin/numeral content stays `ltr` inside an RTL document; drop tracking/letter-spacing specifically for joined or diacritic-stacking scripts; provide a picker, not a cycling toggle, once past ~3 languages.
>
> **Ship it** through a thin native wrapper that adds zero game code, with two separate CI paths — a frequent, secret-free debug build for fast iteration, and a rare, explicitly-triggered signed release build — and document, loudly, that the release signing key is the one artifact in the entire project that cannot be regenerated if lost.
>
> Build in this order: engine core → paint/brush library → character rig (verified against a static pose) → one complete weapon end-to-end → environment/world/collision → enemy AI (parity with the player's rig and movement from day one) → HUD/menus → meta economy → lighting/bloom/grade → performance tiers profiled against the finished pipeline → localization/monetization/retention/packaging/release layered on last. Build the headless verification harnesses alongside every system, from the character rig onward — not as a final QA pass.

---

*Grounded against the live `public/game` source tree (~24,500 lines of JS across `engine/`, `art/` and `game/`, plus ~3,700 lines of language dictionaries), and re-audited section by section against it: every number, constant and data shape quoted above is copied from the shipped code, and where the two disagreed, either the code was fixed to meet the rule or the text was corrected to what the code does.*
