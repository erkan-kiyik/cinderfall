# CINDERFALL LAB — rewrite (in progress)

The from-scratch LAB rebuild described in `docs/LAB_REWRITE_PLAN.md`.
Nothing here ships yet: the LAB app keeps packaging `public/game2` until
milestone M4, when `build-lab-android.yml` switches `GAME_DIR` to `lab`.

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
