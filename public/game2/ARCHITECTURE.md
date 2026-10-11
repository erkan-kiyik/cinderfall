# CINDERFALL — Architecture

## Overview

```
┌────────────────────────────  index.html  ────────────────────────────┐
│  <canvas #game>                       DOM HUD / overlays (menus)     │
└──────────┬───────────────────────────────────────────┬──────────────┘
           │                                           │
        main.js  ── game states (menu/play/pause/end)  hud.js
           │       fixed-timestep loop (60 Hz)
           │       render pipeline (below)
           │
   ┌───────┴─────────┬───────────────┬─────────────────┐
 engine/           art/            game/             assets in RAM
 math, input,      paint  ──────►  rig, world,      (offscreen canvases
 camera,           soldier,        player, enemy,    painted once at
 particles,        weapons,        fx                load; ASSET_SCALE×
 audio             environment,                      world resolution)
                   background
```

### Render pipeline (per frame)

1. **Background composite** (screen space): painted sky → drifting cloud
   strip → far skyline (0.12× parallax) → warm haze band → mid factory line
   (0.3×) → cool street fog. Each strip tiles horizontally.
2. **World layer** (camera transform): building facades → power cables →
   ground strip → under-street fill → props → explosive barrels → decal
   canvas (blood pools, bullet holes, scorch — persistent) → corpses →
   live enemies → player → particles → tracers/slash trails → additive
   particles.
3. **Foreground silhouettes** (1.3× parallax, soft, low alpha).
4. **Lighting composite**: light map = vertical ambient dusk gradient
   (cooler sky, warmer street) + additive radial lights (lamps, windows,
   bay interiors, burn barrel with flicker noise, muzzle flashes,
   explosions), multiplied over the frame. A separate emissive-only map is
   blurred (18 px) and screened back on top for bloom.
5. **Grade**: warm overlay push, cool soft-light in shadows, radial
   vignette, animated film grain (overlay, 5%).
6. **Cockpit**: canvas crosshair (spread-reactive), DOM HUD update.

### Simulation

- Fixed 60 Hz update with an accumulator (max 4 catch-up steps); rendering
  every animation frame. `dt` is clamped so tab switches never explode
  physics.
- AABB colliders; entities resolve horizontal then vertical movement with a
  ground probe for walking off ledges. Hitscan weapons use slab-method
  segment-vs-AABB raycasts against world, explosive barrels and character
  hitboxes (head zone = 1.9× damage).

### Character rig (`rig.js`)

- Skeleton constants in `soldier.js` (`BONES`); parts painted separately
  with anchor points at joints.
- `computePose()` produces hip/neck/shoulder + per-leg hip/knee/ankle from:
  gait phase (advanced by horizontal speed), speed norm, airborne blend,
  landing crouch spring, breathing timer, lean. Knees/elbows solve with a
  closed-form two-bone IK (`math.ik2`) with reach clamping.
- Weapons declare `gripA` (trigger hand), `gripB` (support hand), `muzzle`,
  `eject`, `magPos`, `boltPos`, `shoulder` in weapon space. The weapon is
  anchored to the shoulder, rotated by aim + animation state; both hands IK
  to the transformed grips, so hands can neither float nor clip.
- Draw order interleaves body parts and weapon so the far hand wraps under
  the weapon and the near arm reads on top.
- Death is a scripted collapse (eased rotation around the feet, limp arms)
  that leaves a persistent corpse and blood decal.

### Weapon animation states (`player.js`)

One state machine per gun, all envelope-blended: idle sway/breath, walk/run
bob, sprint carry (lowered, blended via damped `sprintBlend`), jump raise /
fall drop, landing dip, fire (spring recoil + rotational kick, flash sprite,
bolt/slide cycle, shell ejection, accumulating spread), tactical + empty
reload (mag out → hand follows mag → drop → new mag with overshoot → seat →
bolt rack, with staged foley), inspect (keyframed tilts), equip/unequip.
The knife has rest/equip/sprint/inspect plus quick and heavy slashes
(windup → strike with trail + lunge → recover) and hit reactions on targets.

### Enemy AI (`enemy.js`)

`patrol` (waypoints, pauses) → `alert` (face threat, shoulder-up delay) →
`combat` (hold range, aim with error that settles while engaged, 3–5 round
bursts with gaps, magazine tracking with animated reloads, flinch on hit,
loses you without line of sight). Being shot or hearing nearby fire alerts.

### Level ("Sector 9 — Cinder Works", `world.js`)

4600 px street: seven painted facades (metal/brick, lit + broken windows
with interior shelving silhouettes, an open storage bay with a hanging work
lamp, roller doors, pipes, vents), loading docks (walkable), container
stacks (climbable), sandbag/crate cover, lamp posts, power poles with
catenary wires, dumpster, tires, rubble, signs, a burn barrel (fire light +
embers), a sparking shorted cable, and three explosive red barrels that
chain-detonate, damage and shove entities, scorch the ground and shake the
camera.

## Implementation plan (as executed)

1. **Shell + engine core** — HTML/CSS HUD, math/IK/RNG, input, cinematic
   camera, pooled particles, procedural WebAudio.
2. **Paint pipeline** — sprite factory + palette + brushes (grunge, streaks,
   scratches, AO, rim, folds), then soldier part atlases (2 variants).
3. **Weapons** — original rifle/pistol/knife painted in parts with
   attachment metadata + gameplay stats + muzzle-flash sprites.
4. **Environment & background** — prop painters, facade generator, ground
   strip, sky/cloud/far/mid parallax paintings.
5. **Rig** — pose solver, arm IK onto grips, layered draw, weapon drawing
   with mag/bolt/flash animation.
6. **World** — level assembly, physics, raycasts, decals, lights, parallax
   composite, foreground.
7. **Gameplay** — player controller + weapon state machines, enemy AI,
   FX director, HUD, game states, lighting/bloom/grade, ambient particles.
8. **Verification loop** — headless-Chromium screenshot reviews against the
   art brief (`?demo` scripted input, `?zoom` close-ups); fixed the void
   below the street, foreground silhouettes, cable weight, lighting levels,
   a torso-flip rig bug, limb proportions, hitmarker anchoring.

## Extension points

- **New weapon**: add a painter + def in `weapons.js` (grips/muzzle/eject/
  mag points + stats) and a slot in `player.js` — the rig, HUD and FX pick
  it up automatically.
- **New map**: `world.js` is data-driven — colliders, prop placements,
  facade defs, light list, emitters, spawn table.
- **New enemy archetype**: palette variant via `buildSoldier`, behavior
  tweaks via the FSM constants.
- **Post FX**: the grade lives in one function (`Game.grade`) — per-level
  color scripts are a small palette + gradient swap.
