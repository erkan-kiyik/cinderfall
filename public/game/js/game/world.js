// World: level layout, AABB physics, hitscan raycasts, persistent decals
// (blood, scorch, bullet holes), the parallax background composite and the
// dynamic light list. Stage 1 is the original hand-authored "Sector 9 —
// Cinder Works" layout, unchanged. Stage 2+ are generated procedurally
// (buildings, road cover, spawns, loot, props) from a per-stage seed so the
// campaign is endless and no two stages play identically.

import * as env from '../art/environment.js';
import { buildBackground } from '../art/background.js';
import { makeCanvas, drawSprite, lingrad, radgrad, rr } from '../art/paint.js';
import { clamp, rand, randSpread, makeRng } from '../engine/math.js';

export const GROUND_Y = 640;
// Map width. Stages were clearing in well under a minute at 4600; the wider
// field gives a run room to breathe (more cover to work, more ground to lose)
// without changing any of the layout maths, which is all expressed relative
// to MAP_W.
export const MAP_W = 7400;
const GRAV = 2400;

// Uniform darkening laid over the parallax stack — see drawBackground().
export const BG_SCRIM = 'rgba(6,8,13,0.34)';

// Stage 1 is the hand-authored, art-directed encounter layout.
export const STAGE1_SPAWNS = [
  { x: 1080, min: 980, max: 1225, y: GROUND_Y - 40 },
  { x: 1650, min: 1440, max: 1690, y: GROUND_Y },
  { x: 2320, min: 2200, max: 2520, y: GROUND_Y },
  { x: 2950, min: 2760, max: 3050, y: GROUND_Y },
  { x: 3500, min: 3380, max: 3690, y: GROUND_Y },
  { x: 4080, min: 3960, max: 4140, y: GROUND_Y - 40 },
  // --- back half, added when MAP_W was widened: the authored stage used to
  // end around 4400 and would otherwise leave a long empty walk-out ---
  { x: 4750, min: 4600, max: 4900, y: GROUND_Y },
  { x: 5320, min: 5180, max: 5480, y: GROUND_Y },
  { x: 5950, min: 5800, max: 6120, y: GROUND_Y - 40 },
  { x: 6560, min: 6400, max: 6720, y: GROUND_Y },
  { x: 7050, min: 6920, max: 7180, y: GROUND_Y },
];

export class World {
  constructor(stage = 1) {
    this.bg = buildBackground();
    this.ground = env.groundStrip(MAP_W + 500, 90);
    this.emitters = [];    // ambient particle sources
    this.time = 0;

    // decal surface covering the playfield (persists across a stage, wiped
    // by Game.reset()/regenerate on a fresh mission)
    this.decalTop = GROUND_Y - 300;
    const d = makeCanvas(MAP_W, 380);
    this.decalCv = d.cv; this.decalG = d.g;
    this.foreground = paintForeground();   // stage-independent atmospheric dressing

    this.regenerate(stage);
  }

  baseColliders() {
    return [
      { x: -500, y: GROUND_Y, w: MAP_W + 1000, h: 400 },   // ground
      { x: -60, y: GROUND_Y - 800, w: 60, h: 800 },        // map bounds
      { x: MAP_W, y: GROUND_Y - 800, w: 60, h: 800 },
    ];
  }

  // ---------------- level (re)generation ----------------

  regenerate(stage) {
    this.stage = stage;
    this.props = [];
    this.lights = [];
    this.barrels = [];
    this.wires = [];
    this.emitters.length = 0;
    this.pickups = [];
    this.coverSpots = [];
    this.enemySpawns = [];
    this.colliders = this.baseColliders();
    this.weather = pickWeather(stage);

    if (stage <= 1) this.buildLevel();
    else this.buildProceduralLevel(stage);

    this.deriveCoverSpots();
    if (this.decalG) this.decalG.clearRect(0, 0, this.decalCv.width, this.decalCv.height);
  }

  // Cover points: two flanking spots per low obstacle (crates, barrels,
  // sandbags, containers…) so enemies have real positions to retreat behind
  // that break line-of-sight to the player. Ground/bound colliders are
  // excluded by size.
  deriveCoverSpots() {
    for (const c of this.colliders) {
      if (c.h > 90 || c.w > 340) continue;
      this.coverSpots.push({ x: c.x - 18, y: GROUND_Y });
      this.coverSpots.push({ x: c.x + c.w + 18, y: GROUND_Y });
    }
  }

  // ---------------- stage 1: hand-authored "Sector 9" ----------------

  buildLevel() {
    const GY = GROUND_Y;
    const P = (spr, x, y = GY) => this.props.push({ spr, x, y });
    const L = (x, y, r, c, a, flicker = 0) => this.lights.push({ x, y, r, c, a, flicker, seed: rand(0, 100) });

    this.colliders.push(
      { x: 950, y: GROUND_Y - 40, w: 300, h: 40 },         // loading dock
      { x: 898, y: GROUND_Y - 20, w: 26, h: 20 },          // crate step
      { x: 1750, y: GROUND_Y - 38, w: 96, h: 38 },         // container
      { x: 1798, y: GROUND_Y - 76, w: 96, h: 38 },         // stacked container
      { x: 1702, y: GROUND_Y - 20, w: 26, h: 20 },
      { x: 2560, y: GROUND_Y - 20, w: 26, h: 20 },
      { x: 2596, y: GROUND_Y - 42, w: 26, h: 42 },
      { x: 3080, y: GROUND_Y - 38, w: 96, h: 38 },
      { x: 2250, y: GROUND_Y - 13, w: 42, h: 13 },         // sandbags (vault)
      { x: 3560, y: GROUND_Y - 13, w: 42, h: 13 },
      { x: 3900, y: GROUND_Y - 40, w: 260, h: 40 },        // second dock
      { x: 3848, y: GROUND_Y - 20, w: 26, h: 20 },
    );

    // Building facades used to stand here, a few metres behind the player.
    // They walled every fight into a corridor and were the busiest thing on
    // screen behind the characters; the near neon-city parallax band (see
    // art/background.js paintNear) carries that depth now, so the street is
    // left open. A sparse line of warm lamps keeps the ambient light the
    // facades' baked emissives used to provide.
    for (let lx = 260; lx < MAP_W; lx += 620) {
      L(lx, GY - 60, 130, [255, 196, 120], 0.34, 0.05);
    }

    // -- street furniture & cover --
    P(env.sign('sector'), 700);
    P(env.sign('danger'), 2152);
    for (const lx of [560, 1470, 2440, 3420, 4240]) {
      P(env.lamp(), lx);
      L(lx + 14, GY - 84, 230, [255, 202, 128], 0.62, lx === 2440 ? 0.5 : 0.04);
    }
    const poles = [880, 1880, 2880, 3880];
    for (const px of poles) P(env.powerPole(), px);
    for (let i = 0; i < poles.length - 1; i++) {
      const a = poles[i], b = poles[i + 1];
      for (const dy of [0, 4, 12]) {
        this.wires.push({ x0: a - 12, y0: GY - 100 + dy, x1: b - 12, y1: GY - 100 + dy, sag: 16 + dy });
      }
    }
    this.wires.push({ x0: 880 - 12, y0: GY - 100, x1: 620 + 60, y1: GY - 175, sag: 8 });
    this.wires.push({ x0: 3880 - 12, y0: GY - 100, x1: 4240 + 14, y1: GY - 86, sag: 10 });

    P(env.dock(300, 40), 1100);            // matches collider at 950..1250
    P(env.crate(26, 20), 911);
    P(env.dock(260, 40), 4030);
    P(env.crate(26, 20), 3861);

    // authored opener keeps its precisely-fitted container stack (96×38)
    P(env.container('containerRed', 'HLC-407', 96, 38), 1798);
    P(env.container('containerBlue', 'MSU-2213', 96, 38), 1846, GY - 38);
    P(env.container('containerGreen', 'KDR-118', 96, 38), 3128);
    P(env.crate(26, 20), 1715);
    P(env.crate(26, 20), 2573);
    P(env.crate(26, 22), 2609, GY);        // stack base
    P(env.crate(26, 20), 2609, GY - 22);
    P(env.sandbags(), 2271);
    P(env.sandbags(), 3581);

    P(env.dumpster(), 1590);
    P(env.tires(), 2330);
    P(env.rubble(), 2060);
    P(env.rubble(), 3300);
    P(env.barrel('rust'), 1310);
    P(env.barrel('blue'), 2700);
    P(env.barrel('rust'), 2712, GY - 1);
    P(env.barrel('blue'), 3730);
    for (const fx of [1720, 1930, 2070]) P(env.fence(70), fx + 35);
    P(env.fence(70), 4390); P(env.fence(70), 4460);
    P(env.crate(22, 16), 1140, GY - 40);   // crates up on the dock
    P(env.barrel('rust'), 1210, GY - 40);

    // explosive barrels (entities — shootable)
    for (const bx of [1685, 2620, 3260]) {
      this.barrels.push({ x: bx, y: GY, hp: 30, alive: true, spr: env.barrel('red') });
    }

    // burn barrel: painted barrel + fire emitter + strong flicker light
    P(env.barrel('rust'), 2390);
    this.emitters.push({ kind: 'fire', x: 2390, y: GY - 21 });
    L(2390, GY - 30, 150, [255, 150, 60], 0.85, 0.8);
    // shorted cable sparking above the road
    this.emitters.push({ kind: 'sparks', x: 3506, y: GY - 132 });
    // industrial smoke sources: rooftop stacks rising over the sector + a
    // couple of ground vents. Hand-placed for the authored opening stage.
    this.emitters.push({ kind: 'chimney', x: 760, y: GY - 260, tint: 'exhaust', rate: 0.3, t: 0 });
    this.emitters.push({ kind: 'chimney', x: 2980, y: GY - 300, tint: 'soot', rate: 0.34, t: 0.15 });
    this.emitters.push({ kind: 'chimney', x: 4180, y: GY - 230, tint: 'steam', rate: 0.26, t: 0.3 });
    this.emitters.push({ kind: 'vent', x: 1640, y: GY - 34, tint: 'exhaust', dir: 0, rate: 0.7, t: 0.2 });
    this.emitters.push({ kind: 'vent', x: 3120, y: GY - 30, tint: 'dust', dir: Math.PI, rate: 0.85, t: 0.5 });

    // ---- back half (x > 4500) ----
    // Added when MAP_W was widened. Same vocabulary as the front half —
    // containers to break sightlines, a dock to fight up onto, barrels to
    // shoot — so the extended run still reads as one authored space.
    this.colliders.push(
      { x: 4820, y: GY - 38, w: 96, h: 38 },               // container
      { x: 4772, y: GY - 20, w: 26, h: 20 },
      { x: 5400, y: GY - 13, w: 42, h: 13 },               // sandbags (vault)
      { x: 5880, y: GY - 40, w: 280, h: 40 },              // third dock
      { x: 5828, y: GY - 20, w: 26, h: 20 },
      { x: 6480, y: GY - 38, w: 96, h: 38 },
      { x: 6528, y: GY - 76, w: 96, h: 38 },               // stacked
      { x: 6432, y: GY - 20, w: 26, h: 20 },
      { x: 6980, y: GY - 13, w: 42, h: 13 },
    );
    P(env.container('containerBlue', 'VTX-889', 96, 38), 4868);
    P(env.crate(26, 20), 4785);
    P(env.sandbags(), 5421);
    P(env.dock(280, 40), 6020);
    P(env.crate(26, 20), 5841);
    P(env.container('containerRed', 'QLR-052', 96, 38), 6528);
    P(env.container('containerGreen', 'ZBN-771', 96, 38), 6576, GY - 38);
    P(env.crate(26, 20), 6445);
    P(env.sandbags(), 7001);
    P(env.dumpster(), 5150);
    P(env.tires(), 6250);
    P(env.rubble(), 4600);
    P(env.rubble(), 6800);
    P(env.barrel('blue'), 5620);
    P(env.barrel('rust'), 6120, GY - 40);
    for (const lx of [5080, 6000, 6900]) {
      P(env.lamp(), lx);
      L(lx + 14, GY - 84, 230, [255, 202, 128], 0.62, lx === 6000 ? 0.45 : 0.04);
    }
    for (const bx of [5320, 6340]) {
      this.barrels.push({ x: bx, y: GY, hp: 30, alive: true, spr: env.barrel('red') });
    }
    this.emitters.push({ kind: 'chimney', x: 5500, y: GY - 275, tint: 'soot', rate: 0.3, t: 0.45 });
    this.emitters.push({ kind: 'chimney', x: 6700, y: GY - 245, tint: 'steam', rate: 0.28, t: 0.6 });
    this.emitters.push({ kind: 'vent', x: 5900, y: GY - 32, tint: 'dust', dir: 0, rate: 0.8, t: 0.35 });

    // loot: a couple of resupply crates tucked near cover
    this.pickups.push({ x: 1145, y: GY - 40, kind: 'ammo', alive: true, bob: rand(0, 6) });
    this.pickups.push({ x: 2280, y: GY, kind: 'health', alive: true, bob: rand(0, 6) });
    this.pickups.push({ x: 3590, y: GY, kind: 'armor', alive: true, bob: rand(0, 6) });
    this.pickups.push({ x: 4900, y: GY, kind: 'ammo', alive: true, bob: rand(0, 6) });
    this.pickups.push({ x: 5950, y: GY - 40, kind: 'health', alive: true, bob: rand(0, 6) });
    this.pickups.push({ x: 6600, y: GY, kind: 'ammo', alive: true, bob: rand(0, 6) });

    this.enemySpawns = STAGE1_SPAWNS;
  }

  // ---------------- stage 2+: procedural generator ----------------

  // Every stage gets its own seeded RNG so layout, cover, spawns, loot and
  // props are unique but reproducible for that stage number.
  buildProceduralLevel(stage) {
    const GY = GROUND_Y;
    const rng = makeRng(stage * 92821 + 17);
    const P = (spr, x, y = GY) => this.props.push({ spr, x, y });
    const L = (x, y, r, c, a, flicker = 0) => this.lights.push({ x, y, r, c, a, flicker, seed: rng.range(0, 100) });

    // Procedural stages used to raise the same near-wall facade line stage 1
    // had. That layer is gone (the near neon-city parallax band carries the
    // depth now — see art/background.js), so all that's seeded here is the
    // warm ambient lamp spacing those facades used to contribute.
    const mapW = MAP_W;
    for (let lx = rng.range(180, 340); lx < mapW; lx += rng.range(520, 760)) {
      L(lx, GY - 60, rng.range(110, 150), [255, 196, 120], rng.range(0.28, 0.4), rng.range(0, 0.07));
    }

    // -- randomized road cover: crates / containers / barrels / sandbags --
    const coverKinds = ['crate', 'container', 'sandbags', 'barrel', 'dumpster', 'tires', 'rubble', 'dock'];
    let x = 260;
    const clusters = [];
    while (x < mapW - 300) {
      const kind = coverKinds[rng.int(0, coverKinds.length - 1)];
      const gap = rng.range(240, 420);
      if (kind === 'crate') {
        // enlarged cover — comfortable to tuck behind (matches new art size)
        P(env.crate(), x);
        this.colliders.push({ x: x - 15, y: GY - 25, w: 30, h: 25 });
      } else if (kind === 'container') {
        const variant = rng.pick(['containerRed', 'containerBlue', 'containerGreen']);
        P(env.container(variant, `${rng.pick(['HLC', 'MSU', 'KDR', 'TRX'])}-${rng.int(100, 999)}`), x);
        this.colliders.push({ x: x - 54, y: GY - 44, w: 108, h: 44 });
      } else if (kind === 'sandbags') {
        P(env.sandbags(1.2), x);
        this.colliders.push({ x: x - 24, y: GY - 16, w: 48, h: 16 });
      } else if (kind === 'barrel') {
        P(env.barrel(rng.pick(['rust', 'blue'])), x);
      } else if (kind === 'dumpster') {
        P(env.dumpster(), x);
      } else if (kind === 'tires') {
        P(env.tires(), x);
      } else if (kind === 'rubble') {
        P(env.rubble(), x);
      } else if (kind === 'dock') {
        const w = rng.range(180, 300);
        P(env.dock(w, 40), x);
        this.colliders.push({ x: x - w / 2, y: GY - 40, w, h: 40 });
      }
      clusters.push(x);
      x += gap;
    }

    // -- explosive barrels scattered along the block --
    const barrelCount = rng.int(2, 4);
    for (let i = 0; i < barrelCount; i++) {
      const bx = clusters[rng.int(0, clusters.length - 1)] + rng.range(-60, 60);
      this.barrels.push({ x: bx, y: GY, hp: 30, alive: true, spr: env.barrel('red') });
    }

    // -- lamps + power line --
    const poles = [];
    for (let lx = 300; lx < mapW - 200; lx += rng.range(760, 980)) {
      if (rng.chance(0.6)) { P(env.lamp(), lx); L(lx + 14, GY - 84, 220, [255, 202, 128], 0.6, rng.chance(0.25) ? 0.4 : 0.04); }
      if (rng.chance(0.7)) { P(env.powerPole(), lx + rng.range(-80, 80)); poles.push(lx + rng.range(-80, 80)); }
    }
    for (let i = 0; i < poles.length - 1; i++) {
      this.wires.push({ x0: poles[i] - 12, y0: GY - 100, x1: poles[i + 1] - 12, y1: GY - 100, sag: rng.range(12, 22) });
    }

    // -- fencing near the skyline gap, signage --
    for (let i = 0; i < rng.int(2, 4); i++) P(env.fence(70), cx * rng.range(0.3, 0.9) + i * 40);
    P(env.sign(rng.pick(['sector', 'danger'])), rng.range(400, mapW - 400));

    // -- one hazard emitter (burning barrel or sparking line) per stage --
    if (rng.chance(0.7)) {
      const hx = clusters[rng.int(0, clusters.length - 1)];
      P(env.barrel('rust'), hx);
      this.emitters.push({ kind: 'fire', x: hx, y: GY - 21 });
      L(hx, GY - 30, 150, [255, 150, 60], 0.85, 0.8);
    }
    if (rng.chance(0.5)) {
      this.emitters.push({ kind: 'sparks', x: rng.range(400, mapW - 400), y: GY - rng.range(110, 160) });
    }
    // -- industrial smoke sources: rooftop stacks (steady columns) + a couple
    //    of ground vents / damaged machinery. Tints vary by source so plumes
    //    read differently across the sector. Placed high so columns rise over
    //    the rooftops without colliding with the play space.
    const stackTints = ['exhaust', 'exhaust', 'soot', 'steam', 'chem'];
    const stackCount = rng.int(2, 4);
    for (let i = 0; i < stackCount; i++) {
      this.emitters.push({
        kind: 'chimney',
        x: rng.range(200, mapW - 200),
        y: GY - rng.range(150, 300),
        tint: rng.pick(stackTints),
        rate: rand(0.22, 0.4), t: rand(0, 0.4),
      });
    }
    for (let i = 0; i < rng.int(1, 3); i++) {
      this.emitters.push({
        kind: 'vent',
        x: rng.range(300, mapW - 300),
        y: GY - rng.range(20, 70),
        tint: rng.pick(['exhaust', 'dust', 'steam']),
        dir: rng.pick([0, Math.PI]),
        rate: rand(0.5, 1.0), t: rand(0, 0.6),
      });
    }

    // -- loot: scattered resupply crates, more on higher stages --
    const lootCount = 4 + Math.min(4, Math.floor(stage / 3));
    for (let i = 0; i < lootCount; i++) {
      const kind = rng.pick(['ammo', 'ammo', 'health', 'armor']);
      const lx = clusters.length ? clusters[rng.int(0, clusters.length - 1)] + rng.range(-40, 40) : rng.range(300, mapW - 300);
      this.pickups.push({ x: lx, y: GY, kind, alive: true, bob: rng.range(0, 6) });
    }

    // -- enemy spawns: count + spacing scale with stage difficulty. The cap
    //    rose with MAP_W so the longer field stays populated rather than
    //    turning into a walk between fights. --
    const enemyCount = Math.min(6 + Math.floor(stage / 2), 16);
    const spacing = (mapW - 700) / enemyCount;
    for (let i = 0; i < enemyCount; i++) {
      const sx = 500 + spacing * i + rng.range(-60, 60);
      const onDock = rng.chance(0.25);
      this.enemySpawns.push({
        x: sx, min: sx - rng.range(140, 220), max: sx + rng.range(140, 220),
        y: onDock ? GY - 40 : GY,
      });
    }
  }

  // ---------------- physics ----------------

  rectHit(x, y, w, h) {
    for (const c of this.colliders) {
      if (x < c.x + c.w && x + w > c.x && y < c.y + c.h && y + h > c.y) return c;
    }
    return null;
  }

  solidAt(x, y) {
    for (const c of this.colliders) {
      if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return true;
    }
    return false;
  }

  // ent: x,y feet-center, halfW, h, vx, vy, onGround
  moveEntity(ent, dt) {
    ent.vy = Math.min(ent.vy + GRAV * dt, 1500);
    let landed = 0;

    let nx = ent.x + ent.vx * dt;
    let c = this.rectHit(nx - ent.halfW, ent.y - ent.h, ent.halfW * 2, ent.h - 1);
    if (c) {
      // step-up: if the obstacle is a low ledge (crate, sandbags, dock lip)
      // and there's headroom above it, walk up onto it instead of hard-stopping
      // — smoother traversal. Tall cover (containers, walls) still blocks.
      const STEP = 27;
      const topGap = ent.y - c.y;
      const clearAbove = !this.rectHit(nx - ent.halfW, c.y - ent.h, ent.halfW * 2, ent.h - 2);
      if (ent.onGround && topGap > 0.5 && topGap <= STEP && clearAbove) {
        ent.y = c.y;
      } else {
        nx = ent.vx > 0 ? c.x - ent.halfW : c.x + c.w + ent.halfW;
        ent.vx = 0;
      }
    }
    ent.x = nx;

    let ny = ent.y + ent.vy * dt;
    c = this.rectHit(ent.x - ent.halfW, ny - ent.h, ent.halfW * 2, ent.h);
    const wasAir = !ent.onGround;
    ent.onGround = false;
    if (c) {
      if (ent.vy > 0 && ent.y <= c.y + 1) {   // landing on top
        if (wasAir) landed = ent.vy;
        ny = c.y;
        ent.vy = 0;
        ent.onGround = true;
      } else if (ent.vy < 0) {                 // ceiling
        ny = c.y + c.h + ent.h;
        ent.vy = 0;
      } else {                                 // stuck inside side — push up
        ny = c.y;
        ent.vy = 0;
        ent.onGround = true;
      }
    }
    ent.y = ny;
    // Ground probe (walking off edges, and any fall that stops just short of
    // penetrating the surface). This path also has to report impact speed:
    // whether a landing resolves here or in the sweep above depends on where
    // the fall happens to land within a step, so leaving it silent made land
    // dust, the camera bounce and the landing crouch spring fire only some of
    // the time for identical drops.
    if (!ent.onGround && ent.vy >= 0) {
      if (this.rectHit(ent.x - ent.halfW, ent.y - 2, ent.halfW * 2, 4)) {
        if (wasAir) landed = ent.vy;
        ent.onGround = true; ent.vy = 0;
      }
    }
    return landed;
  }

  // segment raycast vs colliders + explosive barrels
  raycast(x0, y0, x1, y1) {
    let best = null, bestT = 1;
    const dx = x1 - x0, dy = y1 - y0;
    const testRect = (rx, ry, rw, rh, tag, ref) => {
      let tmin = 0, tmax = 1, nx = 0, ny = 0;
      for (let axis = 0; axis < 2; axis++) {
        const o = axis ? y0 : x0, d = axis ? dy : dx;
        const lo = axis ? ry : rx, hi = axis ? ry + rh : rx + rw;
        if (Math.abs(d) < 1e-6) { if (o < lo || o > hi) return; continue; }
        let t1 = (lo - o) / d, t2 = (hi - o) / d;
        let n = -Math.sign(d);
        if (t1 > t2) { const tt = t1; t1 = t2; t2 = tt; }
        if (t1 > tmin) { tmin = t1; nx = axis ? 0 : n; ny = axis ? n : 0; }
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) return;
      }
      if (tmin > 0 && tmin < bestT) {
        bestT = tmin;
        best = { x: x0 + dx * tmin, y: y0 + dy * tmin, nx, ny, tag, ref, t: tmin };
      }
    };
    for (const c of this.colliders) testRect(c.x, c.y, c.w, c.h, 'world', c);
    for (const b of this.barrels) {
      if (b.alive) testRect(b.x - 8, b.y - 21, 16, 21, 'barrel', b);
    }
    return best;
  }

  hasLineOfSight(x0, y0, x1, y1) {
    const hit = this.raycast(x0, y0, x1, y1);
    return !hit || hit.tag === 'barrel';
  }

  // ---------------- pickups ----------------

  collectPickup(x, y, radius = 40) {
    for (const p of this.pickups) {
      if (!p.alive) continue;
      if (Math.hypot(p.x - x, (p.y - 20) - y) < radius) { p.alive = false; return p; }
    }
    return null;
  }

  // ---------------- decals ----------------

  stamp(fn) {
    const g = this.decalG;
    g.save();
    g.translate(0, -this.decalTop);
    fn(g);
    g.restore();
  }

  bloodDecal(x, y, size = 8) {
    this.stamp((g) => {
      for (let i = 0; i < 5; i++) {
        g.fillStyle = `rgba(${86 + rand(0, 30)},${14 + rand(0, 8)},${12},${rand(0.25, 0.5)})`;
        g.beginPath();
        g.ellipse(x + randSpread(size), y + randSpread(size * 0.4), rand(1.5, size * 0.55), rand(1, size * 0.3), rand(0, 3), 0, Math.PI * 2);
        g.fill();
      }
    });
  }

  bulletHole(x, y) {
    this.stamp((g) => {
      g.fillStyle = 'rgba(14,13,12,0.75)';
      g.beginPath(); g.arc(x, y, rand(1.2, 1.9), 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(210,205,190,0.2)';
      g.lineWidth = 0.7;
      g.beginPath(); g.arc(x, y, rand(2.2, 2.9), 0, Math.PI * 2); g.stroke();
    });
  }

  scorch(x, y, r = 30) {
    this.stamp((g) => {
      const gr = g.createRadialGradient(x, y, 2, x, y, r);
      gr.addColorStop(0, 'rgba(12,10,9,0.8)');
      gr.addColorStop(0.6, 'rgba(16,13,11,0.45)');
      gr.addColorStop(1, 'rgba(16,13,11,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    });
  }

  // ---------------- rendering ----------------

  // Screen-space parallax composite (call with identity transform).
  drawBackground(g, cam, vw, vh, time) {
    const z = cam.zoom;
    const groundY = vh / 2 + (GROUND_Y - cam.y) * z;
    g.drawImage(this.bg.sky, 0, 0, vw, vh);
    if (this.weather === 'overcast' || this.weather === 'rain') {
      g.fillStyle = 'rgba(60,64,72,0.22)';
      g.fillRect(0, 0, vw, vh * 0.7);
    }

    const tile = (img, ox, y, s) => {
      const w = img.width * s, h = img.height * s;
      let x = ((ox % w) + w) % w - w;
      for (; x < vw; x += w) g.drawImage(img, x, y, w, h);
    };

    const cs = Math.max(vw / 2048, 0.72);
    tile(this.bg.clouds, -(cam.x * 0.05 + time * 3.5), groundY - 700 * cs, cs * 1.15);

    const fs = Math.max(vw / 2048, 0.72) * 1.02;
    tile(this.bg.far, -cam.x * 0.12, groundY - this.bg.far.height * fs + 30 * fs, fs);

    // warm haze between far and mid
    g.fillStyle = lingrad(g, 0, groundY - 320, 0, groundY, [
      [0, 'rgba(205,150,105,0)'], [1, 'rgba(205,150,105,0.18)'],
    ]);
    g.fillRect(0, groundY - 320, vw, 320);

    const ms = Math.max(vw / 2048, 0.72) * 1.06;
    tile(this.bg.mid, -cam.x * 0.3, groundY - (this.bg.mid.height - 8) * ms, ms);

    // Near neon-city band. Scrolls fastest of the parallax layers (0.55 vs
    // mid's 0.3), which is what sells the depth gap between it and the
    // factory line behind. It replaced the world-space facades that used to
    // stand a few metres behind the player — see art/background.js.
    const ns = Math.max(vw / 2048, 0.72) * 1.04;
    tile(this.bg.near, -cam.x * 0.55, groundY - (this.bg.near.height - 6) * ns, ns);

    // cool fog settling at street level
    g.fillStyle = lingrad(g, 0, groundY - 150, 0, groundY + 30, [
      [0, 'rgba(150,155,175,0)'], [0.8, 'rgba(150,150,168,0.13)'], [1, 'rgba(150,150,168,0.05)'],
    ]);
    g.fillRect(0, groundY - 150, vw, 190);

    if (this.weather === 'rain') {
      g.strokeStyle = 'rgba(180,195,215,0.22)';
      g.lineWidth = 1;
      const seed = (cam.x * 0.3) % 4000;
      for (let i = 0; i < 90; i++) {
        const rx = ((i * 137 + seed * 0.4) % (vw + 200)) - 100;
        const ry = ((i * 71 + time * 900) % (vh + 100)) - 50;
        g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 6, ry + 22); g.stroke();
      }
    }

    // Atmospheric fog over the parallax stack: a cool blue-grey body that
    // thickens toward the horizon, where the far skyline sits. This is the
    // layer that actually separates the distant factory line from the
    // foreground building the player fights on — distance reads as colour
    // temperature, not just as dimness.
    g.fillStyle = lingrad(g, 0, groundY - vh, 0, groundY + 40, [
      [0, 'rgba(96,116,150,0.05)'],
      [0.55, 'rgba(112,132,164,0.17)'],
      [0.88, 'rgba(126,144,172,0.30)'],
      [1, 'rgba(120,136,164,0.20)'],
    ]);
    g.fillRect(0, 0, vw, groundY + 40);

    // Final uniform push. The layers are already graded down at bake time
    // (see DEPTH_GRADE); this guarantees nothing back here competes with the
    // characters. It lands before the world layer draws, so the street, props
    // and everyone standing on them are unaffected — only what is truly behind.
    g.fillStyle = BG_SCRIM;
    g.fillRect(0, 0, vw, vh);
  }

  // World-space layers behind entities (call inside camera transform).
  // cam/vw, when given, cull props/barrels/pickups outside the visible
  // x-range — endless procedural stages can carry far more of these than are
  // ever on screen at once, so this cuts real draw-call count without
  // touching physics/AI (those keep updating regardless of culling).
  drawBack(g, cam, vw) {
    const halfVis = cam && vw ? vw / (2 * cam.zoom) + 400 : Infinity;
    const camX = cam ? cam.x : 0;
    const visible = (x) => Math.abs(x - camX) < halfVis;

    // power cables — the only world-space structure left behind the action
    // now that the facade wall is gone, and they read as depth without
    // blocking anything
    g.strokeStyle = 'rgba(10,12,16,0.5)';
    g.lineWidth = 1.1;
    for (const w of this.wires) {
      g.beginPath();
      g.moveTo(w.x0, w.y0);
      g.quadraticCurveTo((w.x0 + w.x1) / 2, Math.max(w.y0, w.y1) + w.sag, w.x1, w.y1);
      g.stroke();
    }

    drawSprite(g, this.ground, -250, GROUND_Y);
    // solid earth below the painted street — never let the sky bleed through
    const under = lingrad(g, 0, GROUND_Y + 82, 0, GROUND_Y + 700, [
      [0, '#2b2a27'], [0.25, '#1b1a18'], [1, '#0c0c0d'],
    ]);
    g.fillStyle = under;
    g.fillRect(-1600, GROUND_Y + 84, MAP_W + 3200, 1400);

    // Foreground floor falloff: the road darkens as it comes toward camera, so
    // the strip the characters stand on frames them from below instead of
    // being the brightest band on screen. Props, barrels, pickups and decals
    // all draw after this and keep their full value.
    g.fillStyle = lingrad(g, 0, GROUND_Y - 4, 0, GROUND_Y + 96, [
      [0, 'rgba(5,7,11,0)'],
      [0.45, 'rgba(5,7,11,0.16)'],
      [1, 'rgba(4,6,10,0.42)'],
    ]);
    // (halfVis is Infinity when culling is disabled, so the falloff band gets
    // its own bounded span rather than reusing it)
    const bandHalf = Number.isFinite(halfVis) ? halfVis + 400 : MAP_W;
    g.fillRect(camX - bandHalf, GROUND_Y - 4, bandHalf * 2, 100);
    for (const p of this.props) { if (visible(p.x)) drawSprite(g, p.spr, p.x, p.y); }
    for (const b of this.barrels) if (b.alive && visible(b.x)) drawSprite(g, b.spr, b.x, b.y);
    this.drawPickups(g, visible);
    // decals over ground/props, under characters
    g.drawImage(this.decalCv, 0, this.decalTop);
  }

  drawPickups(g, visible = () => true) {
    for (const p of this.pickups) {
      if (!p.alive || !visible(p.x)) continue;
      const bob = Math.sin(this.time * 2.4 + p.bob) * 3;
      const y = p.y - 22 + bob;
      g.save();
      g.translate(p.x, y);
      const col = p.kind === 'health' ? '#c9564a' : p.kind === 'armor' ? '#7d95a8' : '#c9a94a';
      g.fillStyle = 'rgba(10,12,14,0.55)';
      rr(g, -9, -9, 18, 18, 3); g.fill();
      g.strokeStyle = col; g.lineWidth = 1.2;
      rr(g, -9, -9, 18, 18, 3); g.stroke();
      g.fillStyle = col;
      if (p.kind === 'health') {
        g.fillRect(-1.2, -5, 2.4, 10);
        g.fillRect(-5, -1.2, 10, 2.4);
      } else if (p.kind === 'armor') {
        g.beginPath();
        g.moveTo(0, -6); g.lineTo(5.5, -3); g.lineTo(5.5, 3); g.lineTo(0, 6.5); g.lineTo(-5.5, 3); g.lineTo(-5.5, -3);
        g.closePath(); g.fill();
      } else {
        g.fillRect(-5, -4, 10, 8);
        g.fillStyle = 'rgba(10,12,14,0.6)';
        g.fillRect(-3, -4, 1.4, 8); g.fillRect(1.6, -4, 1.4, 8);
      }
      g.restore();
    }
  }

  // Foreground silhouettes, parallax > 1 (call with identity transform).
  drawForeground(g, cam, vw, vh) {
    const z = cam.zoom;
    const groundY = vh / 2 + (GROUND_Y - cam.y) * z;
    const s = Math.max(vw / 1400, 0.8) * 1.1;
    const w = this.foreground.width * s, h = this.foreground.height * s;
    let x = ((-cam.x * 1.3 % w) + w) % w - w;
    g.globalAlpha = 0.7;
    for (; x < vw; x += w) g.drawImage(this.foreground, x, groundY + 96 - h, w, h);
    g.globalAlpha = 1;
  }

  getLights() {
    return this.lights;
  }

  update(dt) {
    this.time += dt;
  }
}

function pickWeather(stage) {
  if (stage <= 1) return 'clear';
  const rng = makeRng(stage * 733 + 5);
  const r = rng();
  if (r < 0.62) return 'clear';
  if (r < 0.86) return 'overcast';
  return 'rain';
}

// Near-camera out-of-focus silhouettes: two thin slack cables high in the
// frame and a low band of curb clutter hugging the bottom edge. Deliberately
// sparse and soft so it adds depth without reading as objects.
function paintForeground() {
  const W = 1400, H = 300;
  const { cv, g } = makeCanvas(W, H);
  const rng = makeRng(3131);
  const ink = (a) => `rgba(7,9,14,${a})`;

  g.strokeStyle = ink(0.5); g.lineWidth = 2.6;
  g.beginPath();
  g.moveTo(-10, 26);
  g.quadraticCurveTo(W * 0.3, 88, W * 0.62, 52);
  g.quadraticCurveTo(W * 0.85, 28, W + 10, 58);
  g.stroke();
  g.strokeStyle = ink(0.4); g.lineWidth = 1.8;
  g.beginPath();
  g.moveTo(-10, 38); g.quadraticCurveTo(W * 0.4, 108, W + 10, 74);
  g.stroke();

  // low curb clutter band along the very bottom
  for (let i = 0; i < 26; i++) {
    const tx = rng() * W, ts = rng.range(5, 15);
    g.fillStyle = ink(rng.range(0.4, 0.7));
    g.fillRect(tx, H - ts * 0.7, ts * rng.range(0.9, 2.2), ts);
  }
  // a couple of squat bollards
  for (const bx of [230, 890]) {
    g.fillStyle = ink(0.7);
    rr(g, bx, H - 34, 13, 34, 4); g.fill();
  }
  return cv;
}
