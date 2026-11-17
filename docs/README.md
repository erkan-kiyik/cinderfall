# KOR — documentation (English summary)

The design documents are written in Turkish; this page is the English way in.
Code comments are in English and point at design sections as `docs §10.20`
and the like: look the number up in the index,
[`KOR_STORY_CINEMATIC.md`](KOR_STORY_CINEMATIC.md), which says which file in
[`design/`](design/) holds it.

## The game in one paragraph

A 2D tactical shooter for phones. In a nameless port city built around a
steelworks, a private military company, **Vorsa**, took over "temporarily"
four years ago, the night the blast furnace was put out (*the Quench*: 37
detained, 6 never seen again). Five people who stayed call themselves **KOR**
(*embers*: "the furnace goes out, the embers stay"). The player is their
Operator, on the radio. Ten missions in three acts; act 1 ends with the fall
of Gall, Vorsa's Secretary in the city, and the "Ash Plan" found on his desk;
act 2 with the blast furnace lit again. Acts 1 and 2 (missions 1–7) are playable.

| Operator | Age | Who | Role |
| --- | --- | --- | --- |
| FLINT | 29 | Third-generation furnace man; his father vanished in the Quench | Assault |
| WARDEN | 41 | Last crew captain of the closed fire station | Defence |
| VESPER | 33 | Vorsa's former signal analyst, the voice on the radio | Control |
| SKYE | 22 | Former courier, builds drones from scrap | Recon |
| BULWARK | 47 | Harbour crane driver | Heavy |

HAWK (60s) is the smuggler who sells to everyone; GALL (50s) is the act 1
boss; VASQUEZ, Vorsa's commander in the tower, is the final one.

## How it looks and why

- **Painted in code.** Every character, weapon, building and prop is a
  painter function (`public/game/js/art/`) baked into a texture atlas on the
  device at first start; there are no image files for the world. Light is
  fixed in the world (street lamps, bulbs, fires, rain at night).
- **Real proportions.** Characters follow one body standard (64 units tall,
  head about 1/7); faces are painted the way Gall's is: planes first, then the
  colour of the skin in its zones, then details (`art/ops/realhead.js`).
- **No lettering on characters.** A character sprite is baked facing right
  and mirrored when it faces left, so any text on it would read backwards.
- **The rules against looking machine-made** are in §6 (cinematics) and
  repeated through §10: real units and numbers in the writing, no glowing
  sci-fi, materials over effects.

## How the code is built

| Part | Where | What |
| --- | --- | --- |
| Start-up | `js/boot.js`, `js/app.js` | Device and graphics-chip check, quality choice, painting the atlas, the 120 Hz loop, menus over a live backdrop |
| Menus | `js/ui/` | A small screen router and 14 screens, HUDs, Turkish and English strings |
| Rules | `js/game/`, `js/core/` | Missions, characters, abilities, ballistics, AI with cover; economy; the save (one JSON document in local storage) |
| Art and motion | `js/art/`, `js/anim/` | Painters; skeleton, animation, cloth, ragdolls |
| Rendering | `js/gfx/` | WebGL2 renderer, sprite batching, character shading, lights, quality tiers |
| Sound and films | `js/audio/`, `js/cine/`, `assets/film/` | Synthesised sound effects (in a worker), story films as video |
| Legal | `js/legal/` | Consent gate and texts for 16 regions in 9 languages |
| Phone app | `mobile/` | Capacitor 6 shell; scripts that patch the generated Android project |

## Documents

| File | What |
| --- | --- |
| [`KOR_STORY_CINEMATIC.md`](KOR_STORY_CINEMATIC.md) | Index of the design sections (§1–§10.x) and where each lives |
| [`design/1-hikaye.md`](design/1-hikaye.md) | Story bible (§1): world, timeline, characters, the ten missions, writing rules |
| [`design/2-sinematik.md`](design/2-sinematik.md) | Prologue, opening and mission films; the cinematic rig; acceptance rules; the still series (§2–§8) |
| [`design/3-karakterler.md`](design/3-karakterler.md) | Character design and every revision of characters, faces and heads (§9, §10.1, §10.10–11, §10.14–16, §10.21–25, §10.29, §10.34–37, §10.39) |
| [`design/4-dunya-ve-gorevler.md`](design/4-dunya-ve-gorevler.md) | Obstacles, interface, city, places, missions, the lobby, the realism pass, weapons, act 2, character separation, flat missions, cover, lobby, ten languages, IP review (§10.2–9, §10.12–13, §10.30–33, §10.38) |
| [`design/5-teknik-ve-performans.md`](design/5-teknik-ve-performans.md) | Phone performance, frame pacing, quality, ragdolls, measurements (§10.17–20, §10.26–28 and later technical sections) |
| [`KOR_YAPI.md`](KOR_YAPI.md) | How KOR replaced Cinderfall in this repository and on the store |
| [`RELEASE.md`](RELEASE.md) | Store release: signing (§5a: the lost upload key), store forms, assets |
| [`PERF_UI_PLAN.md`](PERF_UI_PLAN.md), [`LAB_REWRITE_PLAN.md`](LAB_REWRITE_PLAN.md), [`CROW_DESIGN.md`](CROW_DESIGN.md) | Earlier plans, kept for history |

## Conventions

- **A numbered section for every change of substance.** New work adds the
  next `§10.x` to the design file it belongs to and to the index; the code
  comment and the commit message name the section.
- **Measure before and after.** Performance changes state the numbers and how
  they were measured (emulated phone: software GPU, CPU slowed 4–6×, until
  real-device figures exist from the in-game benchmark).
- **Commits** say what changed for the player first, then the how.

## Old names

KOR took the place of *Sector 9: Cinderfall* on the same store listing, so the
application id stays `com.cinderfall.sector9` (a new id would be a new app)
and the repository keeps its name; workflow outputs, releases and the app are
named KOR. Cinderfall's last state is commit `821c36c`.
