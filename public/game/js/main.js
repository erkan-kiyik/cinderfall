// CINDERFALL — bootstrap & orchestration.
// Owns the canvas stack (scene, light map, glow map), the fixed-timestep
// loop, game states (menu / play / pause / end), the lighting + bloom +
// grading composite, ambient particles and the attract-mode camera.

import { Input } from './engine/input.js';
import { Camera } from './engine/camera.js';
import { Particles, K, burstSparks, puffSmoke, columnSmoke, ventSmoke } from './engine/particles.js';
import { audio } from './engine/audio.js';
import { clamp, damp, lerp, rand, randSpread, makeNoise1D } from './engine/math.js';
import { makeCanvas, drawSprite, setAssetScale } from './art/paint.js';
import { quality } from './engine/quality.js';
import { buildSoldier, makeShadowSprite } from './art/soldier.js';
import { buildWeapons } from './art/weapons.js';
import { World, GROUND_Y, MAP_W } from './game/world.js';
import { FX } from './game/fx.js';
import { Player } from './game/player.js';
import { Enemy, getGlobalDetection } from './game/enemy.js';
import { Hud } from './game/hud.js';
import { Progression, UNLOCKS } from './game/progression.js';
import { applyLoadout, ALL_WEAPON_IDS } from './game/meta.js';
import { MetaUI } from './game/metaui.js';
import { TouchControls } from './engine/touch.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = new Hud();
const params = new URLSearchParams(location.search);
const DEMO = params.has('demo');

let vw = 0, vh = 0, dpr = 1;
let lightCv, lightG, glowCv, glowG, grainCv;
let game = null;   // declared early so resize() can safely reference it

// Responsive camera zoom: 1.25 at ~720p, eased down on short/narrow phone
// viewports so more of the scene stays framed and characters aren't oversized.
// A ?zoom= query param still overrides for testing.
function baseZoom() {
  const q = params.get('zoom');
  if (q) return parseFloat(q);
  return 1.25 * clamp(Math.min(vh / 720, vw / 1000), 0.72, 1.06);
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, quality.preset.dprCap);
  vw = window.innerWidth; vh = window.innerHeight;
  canvas.width = vw * dpr; canvas.height = vh * dpr;
  const l = makeCanvas(vw * dpr, vh * dpr); lightCv = l.cv; lightG = l.g;
  const g = makeCanvas(vw * dpr, vh * dpr); glowCv = g.cv; glowG = g.g;
  // keep the framing right across orientation / resize (not mid-cinematic)
  if (game && game.cam && game.state !== 'intro') game.cam.zoom = baseZoom();
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);
resize();

// pre-rendered film grain
{
  const n = makeCanvas(256, 256);
  const img = n.g.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + Math.random() * 22 | 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  n.g.putImageData(img, 0, 0);
  grainCv = n.cv;
}

const flickerNoise = makeNoise1D(7);

// scripted input for headless screenshots (?demo)
class DemoDriver {
  constructor() { this.t = 0; this.mouse = { x: 0, y: 0, down: false, clicked: false, rdown: false }; this._jump = false; }
  tick(dt) {
    this.t += dt;
    this.mouse.x = vw * 0.72; this.mouse.y = vh * 0.47;
    const t = this.t;
    this.mouse.down = (t > 1.2 && t < 2.0) || (t > 3.1 && t < 3.9);
    this._jump = t > 2.55 && t < 2.62 && !this._jumped;
    if (this._jump) this._jumped = true;
  }
  get moveX() { const t = this.t; return (t > 0.15 && t < 1.1) || (t > 2.05 && t < 2.75) ? 1 : 0; }
  get jump() { return this._jump; }
  get sprint() { return this.t > 2.05 && this.t < 2.75; }
  hit() { return false; }
  down() { return false; }
  endFrame() { this.mouse.clicked = false; }
}

const input = new Input(canvas);
const demoDriver = DEMO ? new DemoDriver() : null;

// scripted input for the deploy cinematic: walks the operator in from
// off-screen, aiming forward, never firing. Driven by Game.updateIntro().
class CutsceneDriver {
  constructor() {
    this.walk = false;
    this.mouse = { x: 0, y: 0, down: false, clicked: false, rdown: false };
  }
  tick() { this.mouse.x = vw * 0.68; this.mouse.y = vh * 0.5; }
  get moveX() { return this.walk ? 1 : 0; }
  get jump() { return false; }
  get sprint() { return false; }
  hit() { return false; }
  down() { return false; }
  endFrame() {}
}

// ------------------------------------------------------------------ boot

const assets = {};
const raf = () => new Promise((r) => requestAnimationFrame(r));

// Draws a catalog item's art into a menu canvas (weapon finish body, or the
// operator head for skins). `item === null` renders the neutral STOCK marker.
function previewItem(item, cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = cv.clientWidth || 96, H = cv.clientHeight || 48;
  cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  if (!item) {
    g.strokeStyle = 'rgba(150,150,160,0.4)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(W / 2 - 9, H / 2); g.lineTo(W / 2 + 9, H / 2); g.stroke();
    return;
  }
  let spr = null;
  if (item.apply.type === 'finish') {
    const base = assets.weapons[item.apply.weapon];
    spr = (base.finishes && base.finishes[item.apply.finish]) || base.body;
  } else if (item.apply.type === 'weaponBody') {
    const def = assets.weapons[item.apply.weapon];
    spr = def && def.body;
  } else if (item.apply.type === 'operator') {
    const parts = assets[item.apply.variant];
    spr = parts && parts.head;
  }
  if (!spr) return;
  const scale = Math.min((W * 0.84) / spr.w, (H * 0.84) / spr.h);
  g.save();
  g.translate(W / 2, H / 2);
  drawSprite(g, spr, 0, 0, 0, scale, scale);
  g.restore();
}

async function boot() {
  hud.show('loading');
  // bake sprites at the resolution the chosen quality tier calls for — set
  // once, before the first paint call, since assets are only built here
  setAssetScale(quality.preset.assetScale);
  hud.setLoad(0.05, 'PAINTING OPERATORS…');
  await raf();
  assets.ranger = buildSoldier('ranger');
  assets.phantom = buildSoldier('phantom');
  assets.nomad = buildSoldier('nomad');
  assets.shadow = makeShadowSprite();
  hud.setLoad(0.3, 'MACHINING WEAPONS…');
  await raf();
  assets.weapons = buildWeapons();
  hud.setLoad(0.5, 'BUILDING SECTOR 9…');
  await raf();
  assets.world = new World();
  hud.setLoad(0.9, 'CALIBRATING OPTICS…');
  await raf();
  game = new Game();
  if (DEMO) window.__game = game;  // scripted-screenshot / test hook only

  // every weapon is freely selectable in the loadout (not crate loot)
  for (const id of ALL_WEAPON_IDS) if (!game.progression.owns(id)) game.progression.grant(id);

  // meta screens (loadout / crates) + on-screen controls
  game.metaUI = new MetaUI({
    progression: game.progression,
    previewItem,
    weapons: assets.weapons,
    audio,
  });
  game.metaUI.mount();
  game.touch = new TouchControls(input, { force: params.has('touch') });
  game.touch.mount();

  hud.setLoad(1, 'READY');
  await raf();
  if (DEMO) game.deploy();
  else { hud.show('menu'); game.state = 'menu'; game.metaUI.refresh(); }
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ game

class Game {
  constructor() {
    this.world = assets.world;
    this.cam = new Camera();
    this.cam.zoom = baseZoom();
    this.particles = new Particles(quality.preset.particleMax);
    this.fx = new FX(this.particles, audio, this.cam, this.world);
    this.fx.bindGame(this);   // lets energy projectiles resolve damage
    this.progression = new Progression();
    this.state = 'menu';
    this.time = 0;
    this.menuPanT = 0;
    this.emitT = { fire: 0, sparks: rand(1, 3), ash: 0 };
    this.endDelay = 0;
    this.chainQueue = [];
    this.stage = 1;
    this.pendingResume = null;   // run snapshot to restore on the next reset()
    this._autosaveT = 0;
    this._prevDetState = 'hidden';
    // the full walk-in cinematic only plays once per session (and never in
    // ?demo=1, which scripts input assuming control right after deploy)
    this.introShown = DEMO;
    this.introBeats = new Set();
    this.introEnding = false;
    this.reset();
    hud.bind({
      deploy: () => { audio.resume(); audio.ui(); this.deploy(); },
      resume: () => { audio.ui(); this.setState('play'); },
      // restart is an explicit fresh mission — discard the resume snapshot
      restart: () => { audio.ui(); this.progression.clearRun(); this.pendingResume = null; this.reset(); this.setState('play'); },
      quit: () => { audio.ui(); this.pendingResume = null; this.reset(); this.setState('menu'); },
      // cycles Low → Medium → High → Ultra; dpr/bloom/grain/particle cap all
      // take effect immediately, ASSET_SCALE only on the next full reload
      graphics: () => {
        audio.ui();
        quality.cycle();
        resize();
        hud.setGraphicsTier(quality.preset.name);
      },
    });
    hud.setGraphicsTier(quality.preset.name);
    canvas.addEventListener('mousedown', () => audio.resume(), { once: true });
  }

  spawnEnemiesForStage() {
    const diff = clamp(this.stage - 1, 0, 8);
    this.enemies = this.world.enemySpawns.map((s) => {
      const e = new Enemy(assets.phantom, assets.shadow, assets.weapons.rifle, this.world, this.fx, audio, s.x, s.min, s.max);
      e.y = s.y;
      e.difficulty = diff;
      e.maxHp = 100 + Math.min(60, diff * 5);
      e.hp = e.maxHp;
      return e;
    });
  }

  // Re-applies every unlock the player has already earned (across sessions)
  // to a freshly-constructed Player instance.
  applyAllUnlocks() {
    for (const u of UNLOCKS) if (this.progression.isUnlocked(u.id)) this.applyUnlock(u);
    hud.setSlot4Visible(this.player.smgUnlocked);
  }

  applyUnlock(u) {
    if (u.id === 'smg') this.player.smgUnlocked = true;
    else if (u.id === 'armor25') this.player.maxArmor = Math.max(this.player.maxArmor, 25);
    else if (u.id === 'armor50') this.player.maxArmor = Math.max(this.player.maxArmor, 50);
    else if (u.id === 'rifleFinishUrban') this.player.applyFinish('rifle', 'urban');
    else if (u.id === 'rifleFinishCinder') this.player.applyFinish('rifle', 'cinder');
    else if (u.id === 'pistolFinishDesert') this.player.applyFinish('pistol', 'desert');
    else if (u.id === 'knifeRavage') this.player.applyFinish('knife', 'ravage');
    else if (u.id === 'phantomSkin') this.player.parts = assets.phantom;
  }

  // Awards XP, applies any newly-earned unlocks and shows a toast. Returns
  // true if it displayed a level-up toast (so callers can avoid clobbering
  // it with a lower-priority message on the same frame).
  handleLevelUp(res) {
    if (!res.leveledUp) return false;
    audio.levelUp();
    for (const u of res.newUnlocks) this.applyUnlock(u);
    hud.setSlot4Visible(this.player.smgUnlocked);
    const extra = res.newUnlocks.length ? ' — ' + res.newUnlocks.map((u) => u.label).join(', ') : '';
    hud.notify(`LEVEL UP — ${res.newLevel}${extra}`);
    return true;
  }

  onPlayerHit(headshot, killed) {
    if (!killed) return;
    this.progression.recordKill(headshot);   // also awards tokens
    this.progression.addBpXp(headshot ? 20 : 12);   // battle-pass progress (currency system stays intact even though the shop UI is gone)
    hud.setTokens(this.progression.tokens);
    const res = this.progression.addXp(10 + (headshot ? 15 : 0));
    this.handleLevelUp(res);
  }

  // Silent takedown reward: counts as an elimination, with a small bonus for
  // the clean approach. No squad alert (handled by the enemy's silent flag).
  onStealthKill(enemy) {
    this.progression.recordKill(false);
    this.progression.addBpXp(16);
    hud.setTokens(this.progression.tokens);
    const res = this.progression.addXp(14);
    this.handleLevelUp(res);
  }

  // Persist the live mission state so a reload continues from here.
  snapshotRun() {
    const p = this.player;
    if (!p) return;
    this.progression.saveRun({
      stage: this.stage,
      hp: Math.round(p.hp), armor: Math.round(p.armor),
      kills: p.kills, headshots: p.headshots,
      elapsed: Math.round(this.time - this.startTime),
    });
  }

  reset() {
    // resume a saved run if one was queued (deploy → CONTINUE), else fresh
    const resume = this.pendingResume; this.pendingResume = null;
    this.stage = resume ? resume.stage : 1;
    this.world.regenerate(this.stage);
    this.player = new Player(assets.ranger, assets.shadow, assets.weapons, this.world, this.fx, this.cam, audio, hud);
    this.player.x = 260; this.player.y = GROUND_Y;
    this.applyAllUnlocks();
    applyLoadout(this.player, this.progression, assets);   // equipped crate cosmetics win
    if (resume) {
      this.player.hp = clamp(resume.hp || this.player.maxHp, 1, this.player.maxHp);
      this.player.armor = clamp(resume.armor || 0, 0, this.player.maxArmor);
      this.player.kills = resume.kills || 0;
      this.player.headshots = resume.headshots || 0;
    }
    hud.setWeaponIcons(this.player.arsenal);
    this.spawnEnemiesForStage();
    this.particles.clear();
    this.fx.tracers.length = 0; this.fx.lights.length = 0; this.fx.slashes.length = 0;
    this.chainQueue.length = 0;
    this.endDelay = 0;
    this.startTime = this.time;
    this.cam.follow(this.player.x, this.player.y - 60, 0, 0, true);
    hud.setObjective(0, this.enemies.length);
    hud.setStage(this.stage);
    hud.setProgress(this.progression.data.level, this.progression.xpProgress());
    hud.setTokens(this.progression.tokens);
  }

  // Called when every hostile in the current stage is down: the campaign is
  // endless, so this rolls a fresh procedurally-generated stage rather than
  // ending the run. Player health/ammo/XP/unlocks carry over.
  nextStage() {
    this.stage++;
    this.world.regenerate(this.stage);
    this.spawnEnemiesForStage();
    this.player.x = 260; this.player.y = GROUND_Y; this.player.vx = 0; this.player.vy = 0;
    this.player.onGround = false;
    this.particles.clear();
    this.fx.tracers.length = 0; this.fx.lights.length = 0; this.fx.slashes.length = 0;
    this.chainQueue.length = 0;
    this.endDelay = 0;
    this.cam.follow(this.player.x, this.player.y - 60, 0, 0, true);
    hud.setObjective(0, this.enemies.length);
    hud.setStage(this.stage);
    const res = this.progression.addXp(50 + this.stage * 5);
    const leveled = this.handleLevelUp(res);
    if (!leveled) hud.notify(`STAGE ${this.stage} — HOSTILES INBOUND`);
    this.snapshotRun();   // checkpoint the new stage so a reload resumes here
  }

  deploy() {
    // if a run is in progress, DEPLOY continues it (reset() consumes this)
    this.pendingResume = this.progression.loadRun();
    hud.sceneFade(() => {
      this.reset();
      if (!this.introShown) {
        this.introShown = true;
        this.startIntro();
      } else {
        this.setState('play');
        audio.resume();
        audio.startAmbience();
      }
    });
  }

  // ------------------------------------------------------ deploy cinematic

  startIntro() {
    const p = this.player;
    p.x = 260 - 560; p.y = GROUND_Y;
    p.vx = 0; p.vy = 0; p.onGround = false; p.facing = 1;
    this.cutscene = new CutsceneDriver();
    this.introT = 0;
    this.introBeats.clear();
    this.introEnding = false;
    this.cam.zoom = 0.95;
    this.cam.follow(p.x + 140, p.y - 60, 0, 0, true);
    hud.showCine(true);
    hud.showSkipHint(true);
    this.setState('intro');
  }

  // Runs a short scripted walk-in: the operator advances from off-screen
  // to the play spawn mark while a three-beat mission briefing fades in,
  // camera dollies wide-to-tight. Any key or click fast-forwards straight
  // to the hand-off. Only the timeline lives here — movement, animation
  // and rendering all go through the real Player/Camera update paths.
  updateIntro(dt) {
    // once the hand-off has started (skip or natural end) the scene freezes
    // and waits for the sceneFade callback to flip state — never re-enter
    // the timeline below, or a late skip could race the scheduled finish.
    // The caller (update()) always runs input.endFrame() after this returns.
    if (this.introEnding) return;

    this.introT += dt;
    const t = this.introT;
    const cs = this.cutscene;

    if (input.pressed.size > 0 || input.mouse.clicked) {
      this.introEnding = true;
      this.finishIntro();
      return;
    }

    cs.walk = t > 0.15 && t < 3.0;
    cs.tick();

    const beat = (id, at, fn) => {
      if (t > at && !this.introBeats.has(id)) { this.introBeats.add(id); fn(); }
    };
    beat('b1', 0.25, () => hud.setIntroText(
      'SECTOR 9 — CINDER WORKS DISTRICT',
      'Comms went dark three days ago, the moment the powerplant did.'
    ));
    beat('b2', 2.0, () => hud.setIntroText(
      'SGT. "VANDAL" — 3RD RECON',
      'An unmarked force has dug into the foundries and isn’t answering hails.'
    ));
    beat('b3', 3.8, () => hud.setIntroText(
      undefined,
      'One operator, in first. No backup — no extraction until the sector’s dark for good.'
    ));
    beat('b4', 5.6, () => hud.hideIntroText());

    if (t > 6.2) {
      this.introEnding = true;
      this.finishIntro();
      return;
    }

    this.player.update(dt, { input: cs, enemies: [], game: this, vw, vh });
    this.cam.zoom = damp(this.cam.zoom, t < 3.0 ? 0.95 : baseZoom(), 1.6, dt);
    this.cam.follow(this.player.x, this.player.y - 60, 0, dt);
    this.cam.update(dt, false, Math.abs(this.player.vx) > 40);
  }

  finishIntro() {
    hud.hideIntroText();
    hud.showSkipHint(false);
    hud.sceneFade(() => {
      hud.showCine(false);
      const p = this.player;
      p.x = 260; p.vx = 0; p.vy = 0; p.facing = 1;
      this.cam.zoom = baseZoom();
      this.cam.follow(p.x, p.y - 60, 0, 0, true);
      this.setState('play');
      audio.resume();
      audio.startAmbience();
    });
  }

  setState(s) {
    this.state = s;
    hud.show(s);
    if (s === 'play') this.snapshotRun();   // checkpoint as soon as play begins
    if (s === 'menu' && this.metaUI) this.metaUI.refresh();
    if (this.touch) this.touch.setVisible(s === 'play');
  }

  damageBarrel(b, dmg) {
    if (!b.alive) return;
    b.hp -= dmg;
    if (b.hp <= 0) this.explodeBarrel(b);
  }

  explodeBarrel(b) {
    if (!b.alive) return;
    b.alive = false;
    this.fx.explosion(b.x, b.y);
    const hurtRadius = 160;
    const blast = (ent, isPlayer) => {
      const d = Math.hypot(ent.x - b.x, (ent.y - 60) - (b.y - 10));
      if (d < hurtRadius) {
        const dmg = Math.round(lerp(95, 15, d / hurtRadius));
        const dir = Math.sign(ent.x - b.x) || 1;
        if (isPlayer) ent.hurt(dmg, dir, b.x); else ent.damage(dmg, dir, this.player);
        ent.vx += dir * lerp(420, 90, d / hurtRadius);
        ent.vy -= lerp(260, 40, d / hurtRadius);
        ent.onGround = false;
      }
    };
    blast(this.player, true);
    for (const e of this.enemies) if (e.deadT <= 0) blast(e, false);
    // chain nearby barrels with a short fuse
    for (const other of this.world.barrels) {
      if (other.alive && Math.abs(other.x - b.x) < 190) {
        this.chainQueue.push({ b: other, t: rand(0.12, 0.3) });
      }
    }
  }

  // ------------------------------------------------------------ update

  update(dt) {
    this.time += dt;
    const inp = DEMO ? demoDriver : input;
    if (DEMO) demoDriver.tick(dt);

    if (inp.hit && input.hit('Escape')) {
      if (this.state === 'play') this.setState('pause');
      else if (this.state === 'pause') this.setState('play');
    }
    if (this.state === 'pause') { input.endFrame(); return; }

    this.world.update(dt);
    this.fx.update(dt);
    this.particles.update(dt);
    this.ambient(dt);

    for (let i = this.chainQueue.length - 1; i >= 0; i--) {
      const c = this.chainQueue[i];
      if ((c.t -= dt) <= 0) { this.chainQueue.splice(i, 1); this.explodeBarrel(c.b); }
    }

    if (this.state === 'menu') {
      // attract mode: slow dolly across the block
      this.menuPanT += dt;
      const px = 900 + Math.sin(this.menuPanT * 0.06) * 620;
      this.cam.follow(px, GROUND_Y - 80, 0, dt);
      this.cam.update(dt, false, false);
      for (const e of this.enemies) e.update(dt, null, this);
      input.endFrame();
      return;
    }

    if (this.state === 'intro') {
      this.updateIntro(dt);
      input.endFrame();
      return;
    }

    // play / end
    const p = this.player;
    hud.setAimScreen(inp.mouse.x, inp.mouse.y);
    if (this.state === 'play') {
      p.update(dt, { input: inp, enemies: this.enemies, game: this, vw, vh });
    } else {
      p.update(dt, { input: NULL_INPUT, enemies: this.enemies, game: this, vw, vh });
    }
    for (const e of this.enemies) e.update(dt, p, this);

    const kills = this.enemies.filter((e) => e.deadT > 0).length;
    hud.setObjective(kills, this.enemies.length);

    const det = getGlobalDetection(this.enemies);
    hud.setDetection(det.state, det.value);
    if (det.state !== this._prevDetState) { this._prevDetState = det.state; audio.detectionBeep(det.state); }
    hud.setProgress(this.progression.data.level, this.progression.xpProgress());

    this.cam.follow(p.x, p.y - 60, Math.cos(p.aimWorld), dt);
    this.cam.update(dt, p.sprinting, Math.abs(p.vx) > 60);

    // stealth-kill prompt: shown above the operator whenever a takedown is
    // available, and mirrored to the on-screen takedown button on touch
    if (this.state === 'play' && p.deadT <= 0) {
      const target = p.stealthTarget;
      if (target) {
        const sx = vw / 2 + (p.x - this.cam.x) * this.cam.zoom;
        const sy = vh / 2 + (p.y - 150 - this.cam.y) * this.cam.zoom;
        hud.setStealthPrompt(true, sx, sy);
      } else hud.setStealthPrompt(false);
      if (this.touch) this.touch.setTakedownAvailable(!!target);
    } else {
      hud.setStealthPrompt(false);
      if (this.touch) this.touch.setTakedownAvailable(false);
    }

    if (this.state === 'play') {
      if (p.deadT > 0) {
        this.endDelay += dt;
        if (this.endDelay > 2.4) this.finish();
      } else if (this.enemies.length > 0 && kills === this.enemies.length) {
        this.endDelay += dt;
        if (this.endDelay > 1.6) this.nextStage();
      }
      // lightweight periodic checkpoint — "save & continue" per spec: state
      // is captured frequently so a reload/close always resumes in place
      this._autosaveT += dt;
      if (this._autosaveT > 4) { this._autosaveT = 0; this.snapshotRun(); }
    }
    input.endFrame();
  }

  finish() {
    const p = this.player;
    const acc = p.shots ? Math.round((p.hits / p.shots) * 100) : 0;
    const t = Math.round(this.time - this.startTime);
    this.progression.recordShots(p.shots, p.hits);
    this.progression.recordRun(this.stage, t);
    this.progression.clearRun();   // the run is over — nothing to resume
    hud.end([
      `STAGE REACHED — ${this.stage}`,
      `HOSTILES ELIMINATED — ${p.kills} &nbsp;(${p.headshots} HEADSHOTS)`,
      `ACCURACY — ${acc}%`,
      `MISSION TIME — ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`,
      `OPERATOR LEVEL — ${this.progression.data.level}`,
    ].join('<br>'));
    this.setState('end');
  }

  ambient(dt) {
    const E = this.emitT;
    // ambient emitters (ash, fire embers, sparks, chimney/vent smoke) are all
    // pure atmosphere — scale their spawn rate by quality so weaker tiers
    // spend less time per frame minting particles for a cinder scattered
    // across a wide screen. The countdown timers just tick slower.
    const mul = quality.preset.ambientMul;
    // drifting ash
    E.ash -= dt * mul;
    if (E.ash <= 0) {
      E.ash = 0.14;
      this.particles.spawn(K.ASH, {
        x: this.cam.x + randSpread(vw * 0.7), y: this.cam.y - vh * 0.55,
        vx: randSpread(9) - 5, vy: rand(9, 22),
        life: rand(7, 13), size: rand(0.8, 1.7),
        color: `rgba(196,190,182,${rand(0.25, 0.5)})`,
      });
    }
    // industrial emitters — only tick sources within a screen of the camera
    const near = vw * 0.9 + 260;
    for (const em of this.world.emitters) {
      const onScreen = Math.abs(em.x - this.cam.x) < near;
      if (em.kind === 'fire') {
        E.fire -= dt * mul;
        if (E.fire <= 0) {
          E.fire = 0.07;
          this.particles.spawn(K.EMBER, {
            x: em.x + randSpread(5), y: em.y,
            vx: randSpread(14), vy: -rand(40, 90),
            life: rand(0.4, 1.1), size: rand(1.4, 2.8), drag: 1.5,
          });
          if (Math.random() < 0.4) ventSmoke(this.particles, em.x, em.y - 10, -Math.PI / 2, 'soot', { sizeMul: 0.85 });
        }
      } else if (em.kind === 'sparks') {
        E.sparks -= dt * mul;
        if (E.sparks <= 0) {
          E.sparks = rand(1.4, 3.6);
          burstSparks(this.particles, em.x, em.y, Math.PI / 2, 7, 0.7, 210);
          this.fx.addLight(em.x, em.y, 90, [180, 210, 255], 0.8, 0.12);
        }
      } else if (em.kind === 'chimney') {
        if (!onScreen) continue;
        em.t -= dt * mul;
        if (em.t <= 0) { em.t = em.rate; columnSmoke(this.particles, em.x, em.y, em.tint); }
      } else if (em.kind === 'vent') {
        if (!onScreen) continue;
        em.t -= dt * mul;
        if (em.t <= 0) { em.t = em.rate; ventSmoke(this.particles, em.x, em.y, em.dir, em.tint); }
      }
    }
  }

  // ------------------------------------------------------------ render

  render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // background parallax stack (screen space)
    this.world.drawBackground(ctx, this.cam, vw, vh, this.time);

    // world layer
    ctx.save();
    this.cam.applyTransform(ctx, vw, vh);
    this.world.drawBack(ctx, this.cam, vw);
    for (const e of this.enemies) if (e.deadT > 0) e.draw(ctx);
    for (const e of this.enemies) if (e.deadT <= 0) e.draw(ctx);
    if (this.state !== 'menu') this.player.draw(ctx);
    this.particles.draw(ctx, false);
    this.fx.draw(ctx);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    this.particles.draw(ctx, true);
    ctx.restore();
    ctx.restore();

    // foreground silhouettes
    this.world.drawForeground(ctx, this.cam, vw, vh);

    this.compositeLighting();
    this.grade();
    if (this.state === 'play' && this.player.deadT <= 0) this.crosshair();
  }

  gatherLights() {
    const out = [];
    for (const l of this.world.getLights()) out.push(l);
    for (const l of this.fx.getLights()) out.push(l);
    return out;
  }

  compositeLighting() {
    const lights = this.gatherLights();
    // light map: ambient dusk level + additive lights, multiplied over scene.
    // Warmer and brighter toward street level — reads as the low sun's fill.
    lightG.setTransform(1, 0, 0, 1, 0, 0);
    lightG.globalCompositeOperation = 'source-over';
    const gsy = (vh / 2 + (GROUND_Y - this.cam.y) * this.cam.zoom) * dpr;
    const amb = lightG.createLinearGradient(0, 0, 0, Math.max(gsy, 1));
    amb.addColorStop(0, 'rgb(138,144,164)');
    amb.addColorStop(0.72, 'rgb(158,155,158)');
    amb.addColorStop(1, 'rgb(182,170,156)');
    lightG.fillStyle = amb;
    lightG.fillRect(0, 0, lightCv.width, lightCv.height);
    lightG.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cam.applyTransform(lightG, vw, vh);
    lightG.globalCompositeOperation = 'lighter';

    // glow map only feeds the bloom pass below — skip filling it entirely
    // when the quality tier has bloom off, rather than painting into it and
    // then discarding the result
    const bloomOn = quality.preset.bloom;
    if (bloomOn) {
      glowG.setTransform(1, 0, 0, 1, 0, 0);
      glowG.globalCompositeOperation = 'source-over';
      glowG.clearRect(0, 0, glowCv.width, glowCv.height);
      glowG.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.cam.applyTransform(glowG, vw, vh);
      glowG.globalCompositeOperation = 'lighter';
    }

    const t = this.time * 24;
    for (const l of lights) {
      let a = l.a;
      if (l.flicker) a *= 1 + flickerNoise(t + l.seed * 13) * l.flicker * 0.5;
      if (a <= 0.01) continue;
      // cheap view cull
      if (Math.abs(l.x - this.cam.x) > vw * 0.75 + l.r) continue;
      const [r, g2, b] = l.c;
      const grad = lightG.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      grad.addColorStop(0, `rgba(${r},${g2},${b},${a})`);
      grad.addColorStop(1, `rgba(${r},${g2},${b},0)`);
      lightG.fillStyle = grad;
      lightG.beginPath(); lightG.arc(l.x, l.y, l.r, 0, Math.PI * 2); lightG.fill();
      if (!bloomOn) continue;
      const grad2 = glowG.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.7);
      grad2.addColorStop(0, `rgba(${r},${g2},${b},${a * 0.55})`);
      grad2.addColorStop(1, `rgba(${r},${g2},${b},0)`);
      glowG.fillStyle = grad2;
      glowG.beginPath(); glowG.arc(l.x, l.y, l.r * 0.7, 0, Math.PI * 2); glowG.fill();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(lightCv, 0, 0, canvas.width, canvas.height);
    // bloom — restrained: a tighter blur at lower gain reads as a soft light
    // wrap rather than a hazy wash (reduced bloom / less visual noise).
    // A canvas-wide blur filter is one of the pricier steps here, so weaker
    // quality tiers skip it outright rather than merely shrinking it.
    if (quality.preset.bloom) {
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.42;
      ctx.filter = `blur(${quality.preset.bloomBlur}px)`;
      ctx.drawImage(glowCv, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // Cinematic colour grade: gentle warm-highlight / cool-shadow split with a
  // balanced exposure, distant atmospheric haze and a soft vignette. Tuned
  // down from the old pass to avoid oversaturation and heavy grain.
  grade() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gy = vh / 2 + (GROUND_Y - this.cam.y) * this.cam.zoom;

    // atmospheric haze band across the mid-distance (distant fog)
    ctx.globalCompositeOperation = 'source-over';
    const haze = ctx.createLinearGradient(0, gy - vh * 0.5, 0, gy);
    haze.addColorStop(0, 'rgba(150,158,172,0)');
    haze.addColorStop(1, 'rgba(150,158,172,0.05)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, vw, gy);

    // warm highlight push (softened — less saturation)
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255,180,112,0.055)';
    ctx.fillRect(0, 0, vw, vh);
    // cool shadow tint
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(48,68,116,0.10)';
    ctx.fillRect(0, 0, vw, vh);
    // vignette — softer, larger falloff
    ctx.globalCompositeOperation = 'source-over';
    const v = ctx.createRadialGradient(vw / 2, vh * 0.46, Math.min(vw, vh) * 0.5, vw / 2, vh / 2, Math.max(vw, vh) * 0.78);
    v.addColorStop(0, 'rgba(5,6,10,0)');
    v.addColorStop(1, 'rgba(4,5,9,0.3)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, vw, vh);
    // film grain — subtle; skipped on weaker quality tiers (a canvas-wide
    // tiled overlay draw isn't free, and it's the least-missed effect)
    if (!quality.preset.grain) { ctx.globalCompositeOperation = 'source-over'; return; }
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.03;
    const ox = (Math.random() * 256) | 0, oy = (Math.random() * 256) | 0;
    for (let x = -ox; x < vw; x += 256) {
      for (let y = -oy; y < vh; y += 256) ctx.drawImage(grainCv, x, y);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  crosshair() {
    const inp = DEMO ? demoDriver : input;
    const mx = inp.mouse.x, my = inp.mouse.y;
    const p = this.player;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = 'rgba(235,232,222,0.9)';
    ctx.fillStyle = 'rgba(235,232,222,0.9)';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 2;
    if (p.cur.wpn.kind === 'gun') {
      const gap = 7 + p.visSpread * 300 + p.cur.ws.recoil * 2;
      const len = 7;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        ctx.beginPath();
        ctx.moveTo(mx + dx * gap, my + dy * gap);
        ctx.lineTo(mx + dx * (gap + len), my + dy * (gap + len));
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(mx, my, 1.2, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(mx, my, 3.4, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }
}

const NULL_INPUT = {
  mouse: { x: 0, y: 0, down: false, clicked: false, rdown: false },
  moveX: 0, jump: false, sprint: false,
  hit: () => false, down: () => false, endFrame: () => {},
};

// ------------------------------------------------------------------ loop

let last = performance.now();
let acc = 0;
const STEP = 1 / 60;

// Battery/thermal: a backgrounded tab still gets (throttled) rAF callbacks in
// most browsers, and the ambience audio graph keeps processing unheard —
// both are wasted work. Suspend audio and skip update/render entirely while
// hidden; `last` is refreshed every hidden frame so returning to the tab
// doesn't dump a multi-second dt catch-up burst into a single step.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) audio.suspend();
  else { audio.resume(); last = performance.now(); acc = 0; }
});

// Lightweight runtime perf monitor: an exponentially-smoothed real frame
// time, sampled only during active play (menu/pause frames aren't
// representative). Sustained sub-~38fps for a few seconds steps the quality
// preset down once (see quality.js — it never auto-raises or re-triggers).
let perfAvg = 1 / 60;
let lowPerfT = 0;

function frame(now) {
  if (document.hidden) { last = now; requestAnimationFrame(frame); return; }
  input.pollGamepad();
  const rawDt = (now - last) / 1000;
  const dt = Math.min(rawDt, 0.06);
  last = now;
  acc += dt;
  let steps = 0;
  while (acc >= STEP && steps < 4) {
    game.update(STEP);
    acc -= STEP;
    steps++;
  }
  game.render();

  if (game.state === 'play') {
    perfAvg = perfAvg * 0.94 + rawDt * 0.06;
    lowPerfT = perfAvg > 1 / 38 ? lowPerfT + rawDt : 0;
    if (lowPerfT > 4) {
      lowPerfT = -1e9;   // one check is enough; tryAutoLower() is one-shot anyway
      const lowered = quality.tryAutoLower();
      if (lowered) { hud.notify(`GRAPHICS — AUTO-LOWERED TO ${quality.preset.name}`); resize(); }
    }
  }

  requestAnimationFrame(frame);
}

boot();

// Register the service worker for offline play + faster repeat loads. Guarded
// to secure http(s) contexts (never file://, and harmless if unsupported) and
// deferred to idle so it never competes with first-load asset painting.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is best-effort */ });
  });
}
