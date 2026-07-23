# CINDERFALL — Sector 9

A premium 2D side-view tactical shooter for the browser. Zero dependencies,
zero binary assets: every sprite, background painting, effect and sound is
generated at load time by a procedural art pipeline, then driven by a
skeletal-animation rig, dynamic lighting and a cinematic camera.

![Genre](https://img.shields.io/badge/genre-tactical%20shooter-6b6350)
![Stack](https://img.shields.io/badge/stack-vanilla%20ES%20modules%20%2B%20Canvas%202D-3d4a63)

## Running

The game is a fully static app. It lives in `public/game/` so the repo's
existing Next.js + Vercel deployment serves it automatically at
**`/game/index.html`** — every Vercel preview of a PR is a playable build.

It is also completely standalone — serve the directory with any static file
server and open it in a modern browser (Chromium/Firefox/Safari):

```bash
cd public/game
python3 -m http.server 8901
# → http://localhost:8901
```

No build step, no npm install, no network requests at runtime.

Debug helpers: `?demo=1` runs a scripted input driver (used for automated
screenshot tests), `?zoom=2.5` overrides the camera zoom for close-up art
review.

## Controls

| Input | Action |
| --- | --- |
| A / D | Move |
| Space / W | Jump |
| Shift | Sprint |
| Mouse | Aim / fire (hold for full-auto) |
| R | Reload (tactical or empty — different animations) |
| 1 / 2 / 3 / 4 | VK-77 rifle / C-9 sidearm / TALON-7 knife / P-12 SMG (unlocked at level 3) |
| Left / right mouse | Knife: quick / heavy slash |
| F | Inspect weapon |
| Esc | Pause |

## Endless campaign & progression

There is no final level. Clearing every hostile in a stage rolls a fresh,
procedurally generated stage (building line, cover, prop dressing, enemy
spawns, loot, weather) with slightly sharper, more coordinated AI — the
operator's health, ammo, XP and unlocks carry over. Only going down ends the
run. Kills, headshots, accuracy, longest survival and games played are
tracked and persisted (`localStorage`) across sessions; leveling up unlocks
weapon finishes, the P-12 "WASP" SMG, a TALON-7 blade variant, an armor
cosmetic/cosmetic operator skin and armor plate capacity.

## Project structure

```
public/game/
├── index.html               app shell + DOM HUD (crisp vector text)
├── css/style.css            military UI styling, overlays, hitmarker
└── js/
    ├── main.js              boot, game states, fixed-timestep loop,
    │                        lighting/bloom/grading composite, ambient FX,
    │                        stage progression, detection meter, XP wiring
    ├── engine/              reusable, game-agnostic systems
    │   ├── math.js          lerp/damp/easing, seeded RNG, noise, 2-bone IK
    │   ├── input.js         keyboard + mouse state with per-frame edges
    │   ├── camera.js        spring follow, trauma shake, recoil, landing
    │   ├── particles.js     pooled particles: sparks, smoke, brass, blood…
    │   └── audio.js         procedural WebAudio SFX (no samples)
    ├── art/                 the procedural paint pipeline
    │   ├── paint.js         hi-res sprite factory, palette, gradients,
    │   │                    grunge/scratches/AO/rim-light brushes
    │   ├── soldier.js       soldier part atlases (2 uniform variants)
    │   ├── weapons.js       original weapon designs + stats + flashes +
    │   │                    unlockable finishes + P-12 "WASP" SMG
    │   ├── environment.js   props, facades, dock, ground strip
    │   └── background.js    sky, clouds, far skyline, mid factory line
    └── game/                gameplay
        ├── rig.js           skeletal poser: gait, breathing, arm IK onto
        │                    weapon grips, weapon/mag/bolt/flash drawing
        ├── world.js         stage-1 hand-authored level + procedural stage
        │                    generator, AABB physics, raycasts, decals,
        │                    cover points, pickups, weather, light list
        ├── player.js        movement + weapon state machine, armor, melee
        │                    cooldowns, hazards, pickups, directional damage
        ├── enemy.js         vision-cone/hearing awareness FSM (patrol →
        │                    suspicious → search → alert → combat/retreat),
        │                    cover-seeking, squad alerts, melee shove
        ├── progression.js   XP/levels, lifetime stats, unlock table
        ├── fx.js            tracers, timed lights, slashes, explosions
        └── hud.js           DOM HUD: bars, detection meter, XP, toasts
```

## How the art direction is enforced in code

- **One palette, one light script.** `paint.js` exports the palette every
  painter uses: warm amber key light from above, cool blue-grey shadow,
  desaturated materials. The final frame passes through the same grade
  (warm overlay + cool soft-light + vignette + film grain), so every asset
  shares the same color language.
- **High-resolution sources.** Sprites are painted at `ASSET_SCALE`× their
  world size into offscreen canvases and only ever downsampled at draw time
  — nothing is upscaled, nothing is pixel art.
- **Painted-in lighting.** Every painter lays down gradient key light, core
  shadow, ambient occlusion at contact points and joints, rim light on top
  edges, cloth folds, grunge, rust streaks and scratches. Deterministic
  seeded RNG makes wear unique per instance but stable between runs.
- **Hands never float or clip.** Weapons declare grip points; the rig solves
  both arms with two-bone IK onto those points every frame, so hands land on
  the grips by construction. The support hand follows the magazine during
  reloads.
- **No robotic motion.** All animation is procedural and blended: sinusoid
  gait with foot planting, breathing idle, lean into acceleration, spring
  recoil, landing crouch recovery, eased keyframe envelopes for reload /
  inspect / equip, damped camera follow with trauma-based shake.
- **Layered atmosphere.** Seven independent layers (sky → clouds → far
  skyline → haze → mid factories → gameplay → foreground silhouettes), each
  with its own parallax rate, plus fog bands between depths.
- **Modern lighting on a 2D canvas.** A light map (ambient dusk gradient +
  additive radial lights) is multiplied over the scene; a second emissive map
  is blurred and screened back for bloom. Muzzle flashes, explosions, lamp
  flicker and window glow are all dynamic lights.
- **Real occlusion, not just proximity.** Enemy vision is a facing-aligned
  cone plus a shorter wide-angle peripheral cone, both gated by the same
  `hasLineOfSight` raycast the weapons use — a shooter behind a container is
  genuinely hidden, not just far away. Cover points are generated from the
  level's own collider list, so cover always matches what's actually solid.
- **Every stage still hand-painted, just assembled differently.** The
  procedural stage generator (`world.js`) composes stages 2+ from the exact
  same painters as stage 1 (`environment.js`, `background.js`) — only their
  placement, counts and palette variants are randomized per a seeded RNG, so
  the "no generic/placeholder art" standard holds at any stage number.

## Security & best practices

- **No dependencies, no supply chain.** The game imports nothing external at
  runtime or build time; there is no `node_modules`, no CDN, no fonts or
  images fetched. This eliminates third-party script risk entirely and makes
  the app compatible with a strict CSP, e.g.
  `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'none'`.
- **No dynamic code or HTML injection.** No `eval`, no `Function`, no
  `innerHTML` with user data (the only `innerHTML` writes a fixed,
  code-generated stats string). All user input is keyboard/mouse state.
- **Safe URL parameter handling.** Query params (`demo`, `zoom`) are parsed
  with `URLSearchParams` and coerced to numbers/booleans — never reflected
  into markup.
- **Autoplay compliance.** The AudioContext is created and resumed only on a
  user gesture, per browser policy.
- **Deterministic where it matters.** Seeded RNG for art (reproducible
  visuals, testable rendering), `Math.random` only for gameplay feel.
- **Performance discipline.** All static art is pre-rendered once at load;
  per-frame work is `drawImage` compositing, pooled particles with caps,
  view-culled lights, and a fixed 60 Hz simulation step with a clamped
  accumulator (no spiral-of-death, tab-switch safe).
- **Minimal, non-sensitive persistence.** Progression (`progression.js`)
  writes only gameplay counters — level, XP, kill/accuracy stats, unlock
  flags — to a single namespaced `localStorage` key. No PII, no cookies, no
  network calls; storage failures (private browsing, disabled storage) are
  caught and degrade to an in-memory, session-only fallback.
- **Static hosting.** The folder deploys with the repo's Next.js app (files
  under `public/` are served verbatim) and works on any static host (GitHub
  Pages, Netlify, an S3 bucket). There is no server-side surface to attack.
