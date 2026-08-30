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
import { device, applyDeviceProfile } from './engine/device.js';
import { Intro } from './engine/intro.js';
import { brightness, LEVELS as BRIGHTNESS_LEVELS } from './engine/brightness.js';
import { Interlude } from './engine/interlude.js';
import { t, applyTranslations, setLang, getLang, onLangChange } from './engine/i18n.js';
import { buildSoldier, makeShadowSprite } from './art/soldier.js';
import { buildWeapons } from './art/weapons.js';
import { World, GROUND_Y, MAP_W } from './game/world.js';
import { FX } from './game/fx.js';
import { Player } from './game/player.js';
import { Enemy, Boss, BOSS_STAGE_INTERVAL, BOSS_WEAPONS, getGlobalDetection } from './game/enemy.js';
import { aiSkill, enemyHp, dmgMul, isBossStage, bossTier } from './game/difficulty.js';
import { Hud } from './game/hud.js';
import { Progression, UNLOCKS } from './game/progression.js';
import { DayCycle, formatHour } from './engine/daycycle.js';
import { applyLoadout } from './game/meta.js';
import { MetaUI } from './game/metaui.js';
import { TraderUI } from './game/traderui.js';
import { StatsUI } from './game/statsui.js';
import { ArchivesUI } from './game/archives.js';
import { Barks } from './game/barks.js';
import { Tutorial } from './game/tutorial.js';
import { ProfileUI } from './game/profile.js';
import { drawSoldier as rigDrawSoldier, newWeaponState } from './game/rig.js';
import { intelTitleKey } from './game/intel.js';
import { TouchControls } from './engine/touch.js';
import { watchRewardedAd, initAds, isRewardedAdReady } from './engine/ads.js';
import { debug } from './engine/debug.js';
import { mountCurrencyIcons } from './art/currency.js';
import { dailyStatus, claimDaily, DAILY_REWARDS } from './game/retention.js';
import { paintShareCard, shareCard } from './game/sharecard.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = new Hud();
mountCurrencyIcons(document);   // paint the static header-pill / HUD currency icons
const params = new URLSearchParams(location.search);
const DEMO = params.has('demo');
// Stats page: a kill within this many seconds of the last one extends the
// combo; longer than this and the next kill starts a fresh combo of 1.
const COMBO_WINDOW = 4.0;

// Ground-accent colour: the single hairline under a character's feet that
// replaced the old stamped contour (see rig.js). Warm accent rather than a
// dark tint — it reads as a deliberate marker, not a leftover shadow.
const CHAR_ACCENT_COLOR = 'rgba(255,120,96,0.55)';

// Reticle bloom gains. Measured against the live weapon state: visSpread runs
// ~0.025 at rest and peaks ~0.115 while spraying on the move, and the recoil
// spring peaks ~1.45. These two land the reticle around 11px at rest and ~36px
// at worst — wide enough to tell the player to stop spraying, tight enough to
// still aim with. A literal projection of the cone would read past 50px.
const CROSSHAIR_SPREAD_GAIN = 190;
const CROSSHAIR_RECOIL_GAIN = 6;

// Screen point -> world point, for reticle target testing.
const cam2world = (cam, sx, sy) => cam.screenToWorld(sx, sy, vw, vh);
// How far down the aim ray the touch reticle looks for a target (world px).
const AIM_RAY_RANGE = 1100;

// Seconds the mission briefing stays up before fading itself out.
const LORE_HOLD = 3;

let vw = 0, vh = 0, dpr = 1;
let lightCv, lightG, glowCv, glowG, grainCv;
// Device pixels per CSS pixel in the light/glow maps. Lower than `dpr` on the
// weaker tiers; see resize().
let lightDpr = 1;
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
  // `dpr` here is device pixels per CSS pixel in the SCENE canvas, which is
  // the display's ratio capped by the tier and then scaled down by the tier's
  // renderScale. The element stays CSS-sized to the viewport, so a sub-1
  // renderScale simply means the browser upsamples the scene — which is by
  // far the cheapest frame time available on a rasterisation-bound canvas.
  // Everything downstream keeps working unchanged because every transform is
  // expressed in terms of this one number and every layout number in CSS px.
  dpr = Math.min(window.devicePixelRatio || 1, quality.preset.dprCap) * quality.preset.renderScale;
  vw = window.innerWidth; vh = window.innerHeight;
  canvas.width = vw * dpr; canvas.height = vh * dpr;
  // The light and glow maps get their own, usually lower, resolution — see
  // `lightScale` in quality.js. They are stretched back to full size by the
  // composite, and being low-frequency they lose nothing visible for it.
  lightDpr = dpr * quality.preset.lightScale;
  const l = makeCanvas(vw * lightDpr, vh * lightDpr); lightCv = l.cv; lightG = l.g;
  const g = makeCanvas(vw * lightDpr, vh * lightDpr); glowCv = g.cv; glowG = g.g;
  // refresh --ui-scale so the DOM overlay tracks the new viewport
  applyDeviceProfile();
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
  // A weapon is not one sprite. The rig draws it as an assembly — magazine
  // behind the receiver, then the body, then the cycling bolt, then (on the
  // pistols) the slide, which is a separate sprite precisely because it has
  // to move under blowback. This preview drew only the body, so every card
  // showed a partial gun, and on the C-9 that meant the ENTIRE TOP HALF was
  // missing: the frame and grip rendered, the slide did not, and the muzzle
  // device — mounted at the slide's muzzle point — hung in mid-air with a gap
  // where the gun should have been. Rifles and SMGs lost their magazines the
  // same way, just less visibly.
  //
  // `parts` is [sprite, offsetX, offsetY] in weapon-local units, in the same
  // order and from the same fields as rig.drawGun(), so a card and the gun in
  // the operator's hands can never disagree about what the weapon looks like.
  const parts = [];
  if (item.apply.type === 'finish' || item.apply.type === 'weaponBody') {
    const def = assets.weapons[item.apply.weapon];
    if (!def) return;
    const body = item.apply.type === 'finish'
      ? ((def.finishes && def.finishes[item.apply.finish]) || def.body)
      : def.body;
    if (!body) return;
    // A skin repaints the magazine and the slide too, so prefer the finish's
    // own parts and fall back to the default weapon's.
    const mag = body.mag || def.mag;
    if (mag && def.magPos) parts.push([mag, def.magPos.x, def.magPos.y]);
    parts.push([body, 0, 0]);
    if (def.bolt && def.boltPos) parts.push([def.bolt, def.boltPos.x, def.boltPos.y]);
    const slide = body.slide || def.slide;
    if (slide) parts.push([slide, 0, 0]);
  } else if (item.apply.type === 'operator') {
    const op = assets[item.apply.variant];
    if (!op || !op.head) return;
    parts.push([op.head, 0, 0]);
  }
  if (!parts.length) return;

  // Frame the union of every part's box rather than the body's alone —
  // otherwise a magazine hanging below the receiver, or a slide standing
  // above it, is scaled off the edge of the card.
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [sp, px, py] of parts) {
    const l = px - sp.ax * sp.s, t = py - sp.ay * sp.s;
    x0 = Math.min(x0, l); y0 = Math.min(y0, t);
    x1 = Math.max(x1, l + sp.w); y1 = Math.max(y1, t + sp.h);
  }
  const bw = x1 - x0, bh = y1 - y0;
  if (!(bw > 0 && bh > 0)) return;
  const scale = Math.min((W * 0.84) / bw, (H * 0.84) / bh);
  // Centre that union box, not any one sprite's anchor. drawSprite() places
  // art relative to its rig attachment point (a head hangs below its neck
  // joint, a gun sits behind its grip), so translating straight to the middle
  // of the canvas pushes the art off-centre and clips tall previews — it was
  // visibly cropping the operator cards through the helmet.
  g.save();
  g.translate(W / 2 - (x0 + x1) / 2 * scale, H / 2 - (y0 + y1) / 2 * scale);
  for (const [sp, px, py] of parts) {
    drawSprite(g, sp, px * scale, py * scale, 0, scale, scale);
  }
  g.restore();
}

// Draws a full operator into a canvas, using the same rig the game plays
// with. The profile card is an operator file, so it should show the operator
// the player equipped rather than describe them in text.
function previewOperator(variant, cv) {
  const parts = assets[variant] || assets.ranger;
  if (!parts || !cv) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = cv.clientWidth || 96, H = cv.clientHeight || 128;
  cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  // Idle stance, weapon lowered — a portrait, not a firing pose.
  const ent = {
    x: 0, y: 0, facing: 1, aimLocal: 0.12, gaitPhase: 0, speedNorm: 0,
    onGround: true, airTime: 0, vy: 0, crouchSpring: 0, breathT: 0,
    lean: 0, hurtT: 0, deadT: 0,
  };
  // The rig is about 131 units tall from the sole to the crown; fit it with a
  // margin so head gear (an antenna, an NVG arm) is not cropped.
  const k = Math.min(W / 74, H / 142);
  g.save();
  g.translate(W * 0.52, H - 6 * k);
  g.scale(k, k);
  rigDrawSoldier(g, parts, assets.shadow, ent,
    { wpn: assets.weapons.rifle, ws: newWeaponState() });
  g.restore();
}

async function boot() {
  applyTranslations();          // fill static markup before the first paint
  hud.show('loading');
  // The animated boot sequence runs *while* assets paint, so the wait is the
  // show rather than a static card. It holds for its own minimum runtime and
  // then waits on assetsDone(), whichever is later — see engine/intro.js.
  const intro = new Intro(document.getElementById('intro-canvas'));
  const introDone = intro.run();
  // bake sprites at the resolution the chosen quality tier calls for — set
  // once, before the first paint call, since assets are only built here
  setAssetScale(quality.preset.assetScale);
  hud.setLoad(0.05, 'PAINTING OPERATORS…');
  await raf();
  assets.ranger = buildSoldier('ranger');
  assets.phantom = buildSoldier('phantom');
  assets.nomad = buildSoldier('nomad');
  assets.viper = buildSoldier('viper');
  assets.arctic = buildSoldier('arctic');
  assets.ember = buildSoldier('ember');
  assets.midnight = buildSoldier('midnight');
  assets.rust = buildSoldier('rust');
  assets.vanguard = buildSoldier('vanguard');
  assets.sable = buildSoldier('sable');
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

  // meta screens (loadout / crates) + on-screen controls
  game.metaUI = new MetaUI({
    progression: game.progression,
    previewItem,
    weapons: assets.weapons,
    audio,
  });
  game.metaUI.mount();
  game.traderUI = new TraderUI({
    progression: game.progression,
    previewItem,
    weapons: assets.weapons,
    audio,
  });
  game.traderUI.mount();
  document.querySelector('[data-tab="trader"]').addEventListener('click', () => game.traderUI.refresh());
  game.statsUI = new StatsUI({ progression: game.progression, weapons: assets.weapons, audio });
  game.statsUI.mount();
  document.querySelector('[data-tab="stats"]').addEventListener('click', () => game.statsUI.refresh());
  game.archivesUI = new ArchivesUI({ progression: game.progression, audio });
  game.archivesUI.mount();
  game.profileUI = new ProfileUI({
    progression: game.progression, weapons: assets.weapons,
    previewItem, previewOperator, audio,
  });
  game.profileUI.mount();
  game.touch = new TouchControls(input, { force: params.has('touch') });
  // Warm the ad SDK and pull the first rewarded ad down now, while the player
  // is still on the menu. Both used to happen on the WATCH AD tap itself, in
  // series, which is why the button sat there doing nothing for seconds.
  initAds();
  game.touch.mount();

  hud.setLoad(1, 'READY');
  // hand the intro its cue, then wait for it to finish its fade
  intro.assetsDone();
  await introDone;
  if (DEMO) game.deploy();
  else {
    hud.show('menu'); game.state = 'menu';
    game.metaUI.refresh(); game.traderUI.refresh(); game.statsUI.refresh();
    game.archivesUI.render();
    game.refreshLevelSelect();   // boot sets state directly, bypassing setState()
    game.offerDailyReward();   // lands on the menu, never mid-run
  }
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
    // TimeShift clock — advances on death and on stage clear, never on frame time.
    this.day = new DayCycle();
    this.state = 'menu';
    this.time = 0;
    this.menuPanT = 0;
    this.emitT = { fire: 0, sparks: rand(1, 3), ash: 0 };
    this.endDelay = 0;
    this.chainQueue = [];
    this.stage = 1;
    this.pendingResume = null;   // run snapshot to restore on the next reset()
    this.pendingStage = null;    // explicit stage picked from the level select
    this._autosaveT = 0;
    this._prevDetState = 'hidden';
    // the full walk-in cinematic only plays once per session (and never in
    // ?demo=1, which scripts input assuming control right after deploy)
    this.introShown = DEMO;
    this.introBeats = new Set();
    this.introEnding = false;
    this.reviveOffered = false;   // one watch-ad continue per deploy
    this._reviveTimer = null;
    // ---- stats page: all in-memory, flushed to Progression in batches
    // (never per-shot/per-frame) so tracking never touches localStorage at
    // a frequency that could cost a frame ----
    this._weaponShotsThisRun = {};
    this._playtimeAccumMs = 0;
    this.currentKillStreak = 0;
    this.comboCount = 0; this.comboTimer = 0;
    this.isBossStage = false;
    // Between-stage cinematic (engine/interlude.js). Built once and replayed;
    // `interludeT` freezes update() while it runs so the world does not tick
    // under a screen the player cannot see or act on.
    this.interlude = null;
    this.interludeRunning = false;
    // MOTH's in-mission radio barks (game/barks.js). Heavily rate-limited
    // there; this class only reports events to it.
    this.barks = new Barks(document.getElementById('bark'), audio);
    // First-run coaching (game/tutorial.js). Shares the bark strip so a lesson
    // and a quip can never overlap. The touch layer is handed over as a getter
    // rather than a value: boot() assigns game.touch *after* this constructor
    // runs, so capturing it here would pin it to undefined and coach every
    // phone player with keyboard controls they do not have.
    this.tutorial = new Tutorial({
      progression: this.progression,
      barks: this.barks,
      getTouch: () => this.touch,
    });
    this.reset();
    hud.bind({
      deploy: () => { audio.resume(); audio.ui(); this.deploy(); },
      // Level select: launching a specific sector is always a fresh mission
      // into that stage, so any half-finished run snapshot is discarded first.
      pickStage: (n) => {
        // Belt-and-braces: the UI only renders replayable arenas, but the
        // handler refuses anything else so a stale DOM node can't launch an
        // intermediate stage out of order.
        if (!this.progression.canReplay(n)) return;
        audio.resume(); audio.ui();
        this.progression.clearRun();
        this.pendingResume = null;
        this.pendingStage = n;
        this.deploy();
      },
      resume: () => { audio.ui(); this.setState('play'); },
      // restart is an explicit fresh mission — discard the resume snapshot
      restart: () => { audio.ui(); this.progression.clearRun(); this.pendingResume = null; this.reset(); this.setState('play'); },
      quit: () => { audio.ui(); this.pendingResume = null; this.reset(); this.setState('menu'); },
      // cycles Low → Medium → High → Ultra; render scale, dpr, light-map
      // resolution, bloom, grain and the particle cap all take effect
      // immediately, ASSET_SCALE only on the next full reload
      graphics: () => {
        audio.ui();
        quality.cycle();
        resize();
        hud.setGraphicsTier(quality.preset.name);
      },
      watchAdRevive: () => { audio.ui(); this.reviveViaAd(); },
      skipRevive: () => { audio.ui(); this.declineRevive(); },
      // Opens the language list. The static markup is re-filled by i18n
      // itself; the screens that build their labels in JS repaint through
      // onLangChange. The list is rebuilt on every open so the active row is
      // always right, and closed on pick so the change is visible at once.
      language: () => this.openLangPicker(),
      langClose: () => { audio.ui(); hud.showLangPicker(false); },
      // Cycles the screen brightness lift. Takes effect on the very next
      // frame — grade() reads the module directly, so there is nothing to
      // rebuild and the player can judge the change while the menu is open.
      brightness: () => { audio.ui(); hud.setBrightness(brightness.cycle()); },
      share: () => { audio.ui(); this.openShareCard(); },
      shareSend: () => { audio.ui(); this.sendShareCard(); },
      shareClose: () => { audio.ui(); hud.showShareCard(false); },
      claimDaily: () => { audio.ui(); this.claimDailyReward(); },
    });
    hud.setGraphicsTier(quality.preset.name);
    hud.setLanguage();
    // The same picker is reachable from the main menu's header pill, so a
    // player who cannot read the interface does not have to deploy and pause
    // to change it.
    document.getElementById('btn-lang-pill')?.addEventListener('click', () => this.openLangPicker());
    hud.setBrightness(brightness.level);
    // The brightness label resolves through t(), so a language switch has to
    // repaint it — applyTranslations only refills static data-i18n nodes.
    onLangChange(() => {
      hud.setBrightness(brightness.level);
      // The stage label is written once, when the stage starts — changing
      // language from the pause menu mid-mission would otherwise leave it in
      // the old one until the next stage. (The objective count is rewritten
      // every frame by the update loop, so it needs nothing here.)
      if (this.stage) hud.setStage(this.stage);
    });
    canvas.addEventListener('mousedown', () => audio.resume(), { once: true });
  }

  // Opens the language list. Rebuilt on every open so the active row is
  // always the current language, and closed on pick so the change is visible
  // immediately behind it rather than under a still-open dialog.
  openLangPicker() {
    audio.ui();
    hud.buildLangPicker((code) => {
      audio.ui();
      setLang(code);
      hud.setLanguage();
      hud.showLangPicker(false);
    });
    hud.showLangPicker(true);
  }

  spawnEnemiesForStage() {
    // Every scaling number comes from game/difficulty.js. The clamps that used
    // to live here (`clamp(stage - 1, 0, 8)`, `Math.min(60, diff * 5)`) meant
    // difficulty stopped growing at stage 9 — stage 40 played exactly like
    // stage 10, which is what made the endless campaign feel finite.
    const skill = aiSkill(this.stage);
    this.isBossStage = isBossStage(this.stage);
    if (this.isBossStage) {
      // one heavyweight encounter in place of the regular squad — spawned at
      // the map's middle spawn point (a reasonable, already-clear patrol lane)
      // so no map/world-generation code needs to know bosses exist
      const spawns = this.world.enemySpawns;
      const mid = spawns[Math.floor(spawns.length / 2)] || { x: MAP_W * 0.55, y: GROUND_Y, min: MAP_W * 0.4, max: MAP_W * 0.75 };
      // Bosses carry heavy weapons, never an infantry rifle — the weapon id
      // is chosen by tier in the Boss constructor (see BOSS_WEAPONS).
      const tier = bossTier(this.stage);
      const bossWpn = assets.weapons[BOSS_WEAPONS[tier % BOSS_WEAPONS.length]] || assets.weapons.rifle;
      const boss = new Boss(assets.phantom, assets.shadow, bossWpn, this.world, this.fx, audio, mid.x, mid.min, mid.max, this.stage);
      boss.y = mid.y;
      this.enemies = [boss];
    } else {
      this.enemies = this.world.enemySpawns.map((s) => {
        const e = new Enemy(assets.phantom, assets.shadow, assets.weapons.rifle, this.world, this.fx, audio, s.x, s.min, s.max);
        e.y = s.y;
        e.difficulty = skill;
        e.maxHp = enemyHp(this.stage);
        e.hp = e.maxHp;
        e.dmgMul = dmgMul(this.stage);
        return e;
      });
    }
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
    // The level's stat reward lands immediately, mid-run: max HP goes up and
    // the operator is healed by the gain, so a level earned in a firefight is
    // felt right then rather than only from the next deployment.
    //
    // Applied as a *difference* against what applyLoadout already baked in at
    // deployment (player.levelBonusApplied), not as a flat per-level step —
    // otherwise the whole accumulated block would be paid out again here, and
    // the bonus would keep growing past LEVEL_BONUS_CAP.
    const p = this.player;
    let buff = '';
    if (p) {
      const lb = this.progression.levelBonuses();
      const prev = p.levelBonusApplied || { maxHp: 0, damage: 0 };
      const dHp = lb.maxHp - prev.maxHp;
      const dDmg = lb.damage - prev.damage;
      if (dHp > 0) { p.maxHp += dHp; p.hp = Math.min(p.maxHp, p.hp + dHp); }
      if (dDmg > 0) p.dmgMul = (p.dmgMul || 1) + dDmg;
      p.levelBonusApplied = lb;
      if (dHp > 0 || dDmg > 0) {
        buff = ` (+${dHp} HP, +${Math.round(dDmg * 100)}% DMG)`;
      }
    }
    const extra = res.newUnlocks.length ? ' — ' + res.newUnlocks.map((u) => u.label).join(', ') : '';
    hud.notify(t('notify.levelUp', { n: res.newLevel }) + buff + extra);
    return true;
  }

  onPlayerHit(headshot, killed, enemy) {
    if (!killed) return;
    this.progression.recordKill(headshot);   // also awards scrap
    this.progression.addBpXp(headshot ? 20 : 12);   // battle-pass progress (currency system stays intact even though the shop UI is gone)
    hud.setScrap(this.progression.scrap);
    const res = this.progression.addXp(10 + (headshot ? 15 : 0));
    this.handleLevelUp(res);
    this.registerKill();
    this.noteKillBark(headshot ? 'headshot' : null);
    this.rollIntel(enemy);
    if (enemy && enemy.isBoss) this.onBossDefeated(enemy);
  }

  // Silent takedown reward: counts as an elimination, with a small bonus for
  // the clean approach. No squad alert (handled by the enemy's silent flag).
  onStealthKill(enemy) {
    this.progression.recordKill(false);
    this.progression.addBpXp(16);
    hud.setScrap(this.progression.scrap);
    const res = this.progression.addXp(14);
    this.handleLevelUp(res);
    this.registerKill();
    this.noteKillBark('stealth');
    this.rollIntel(enemy);
    if (enemy && enemy.isBoss) this.onBossDefeated(enemy);
  }

  // Intel log drop. Rolled on every elimination, silent-takedown included —
  // a body is a body, and gating lore behind loud kills would have punished
  // exactly the stealth play the takedown mechanic exists to encourage.
  //
  // Called before onBossDefeated so a boss's intel toast lands ahead of the
  // boss-down banner rather than on top of it.
  rollIntel(enemy) {
    const isBoss = !!(enemy && enemy.isBoss);
    const res = this.progression.rollIntel(isBoss, this.stage, this.player ? this.player.luckMul : 1);
    if (!res) return;
    if (res.kind === 'log') {
      hud.showIntel(t(intelTitleKey(res.log.id)), t('intel.found'));
    } else {
      // Archive already complete — the roll still paid, so say what it paid.
      hud.setScrap(this.progression.scrap);
      hud.showIntel('', t('intel.scrap', { n: res.amount }));
    }
    audio.ui();
  }

  // Bonus payout + a distinct toast on top of the regular kill reward —
  // boss stages otherwise play through the exact same reward path as any
  // other elimination.
  onBossDefeated(boss) {
    this.progression.recordBossKill();
    hud.setScrap(this.progression.scrap);
    hud.showBoss(false);
    hud.notify(t('notify.bossDown', { name: boss.name }));

    // Boss Redeemable roll — 1/1000, boss kills only. This is the sole way
    // these items enter a save; nothing in the crate or on CROW's stall
    // can produce one. Loot Luck from the equipped perk block scales it.
    const drop = this.progression.rollBossReward(this.player ? this.player.luckMul : 1);
    if (drop) {
      hud.notify(t('notify.bossDrop', { name: drop.name }));
      audio.ui();
      // A drop this rare deserves its own beat rather than a queued toast.
      if (hud.showBossDrop) hud.showBossDrop(drop);
    }
  }

  // Stats page: kill streak (kills since the operator last went down) and
  // combo (kills landed within COMBO_WINDOW of each other) — both just
  // record new personal bests; the live counters reset via resetKillStreak
  // (on death) and the comboTimer countdown in update() (on a lull).
  registerKill() {
    this.currentKillStreak++;
    this.progression.recordKillStreak(this.currentKillStreak);
    this.comboCount = this.comboTimer > 0 ? this.comboCount + 1 : 1;
    this.comboTimer = COMBO_WINDOW;
    this.progression.recordCombo(this.comboCount);
  }

  resetKillStreak() { this.currentKillStreak = 0; }

  // One place where every elimination decides whether MOTH says anything.
  // The streak thresholds are checked first and win over the per-kill flavour
  // line, so a headshot that also lands the sixth kill reports the streak —
  // Barks itself would drop the second call on its global cooldown anyway,
  // and this makes which one survives deliberate rather than incidental.
  noteKillBark(flavour) {
    this.barks.noteKill();
    if (this.currentKillStreak === 1) { this.barks.fire('firstBlood'); return; }
    if (this.currentKillStreak === 6) { this.barks.fire('streak6'); return; }
    if (this.currentKillStreak === 3) { this.barks.fire('streak3'); return; }
    if (flavour) this.barks.fire(flavour);
  }

  // Called by Player.fire() every trigger pull — in-memory only, flushed to
  // Progression in one batch at run end (see finish()).
  recordWeaponShot(weaponId) {
    this._weaponShotsThisRun[weaponId] = (this._weaponShotsThisRun[weaponId] || 0) + 1;
  }

  // The run state the world's look is derived from — the clock hour and how
  // many times this stage has beaten the player back. Weather and the sky
  // wash both come off this (see World.setTime / engine/daycycle.js), so a
  // stage that has killed you six times looks materially worse than a fresh one.
  runCtx() {
    return { hour: this.day.hour, attempts: this.progression.attempts(this.stage) };
  }

  // Repaints the level-select grid from current progress. Called whenever the
  // menu is shown, so clearing a stage makes it immediately replayable.
  refreshLevelSelect() {
    // Boss arenas only — see Progression.bossStages / Hud.renderLevelSelect.
    hud.renderLevelSelect(this.progression.clearedBossStages());
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
    // Stage selection, in priority order:
    //   1. an explicit level-select pick
    //   2. a mid-run snapshot being resumed
    //   3. the checkpoint — the stage after the last one cleared
    // (3) is what stops a death sending the operator back to stage 1.
    const picked = this.pendingStage; this.pendingStage = null;
    this.stage = picked || (resume ? resume.stage : this.progression.resumeStage);
    this.world.regenerate(this.stage, this.runCtx());
    this.player = new Player(assets.ranger, assets.shadow, assets.weapons, this.world, this.fx, this.cam, audio, hud);
    this.player.x = 260; this.player.y = GROUND_Y;
    this.player.onDeath = () => this.resetKillStreak();
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
    this.reviveOffered = false;
    if (this._reviveTimer) { clearInterval(this._reviveTimer); this._reviveTimer = null; }
    hud.showRevive(false);
    this._weaponShotsThisRun = {};
    this.currentKillStreak = 0; this.comboCount = 0; this.comboTimer = 0;
    this.barks.reset();
    this.startTime = this.time;
    this.cam.follow(this.player.x, this.player.y - 60, 0, 0, true);
    hud.setObjective(0, this.enemies.length);
    hud.setStage(this.stage);
    hud.setProgress(this.progression.data.level, this.progression.xpProgress());
    hud.setScrap(this.progression.scrap);
    if (this.isBossStage) { hud.showBoss(true, this.enemies[0].name); hud.setBossHp(this.enemies[0].hp / this.enemies[0].maxHp); }
    else hud.showBoss(false);
    hud.setAttempt(this.progression.attempts(this.stage));
    hud.showLore(LORE_HOLD);   // mission briefing on entering a fresh deployment
  }

  // Stage cleared → MOTH's interlude → the next stage. The cinematic is
  // cosmetic, so every failure path here still lands on nextStage(): a
  // missing overlay, a construction throw or a rejected promise all fall
  // through to the plain transition rather than stranding the run.
  playInterludeThenNextStage() {
    if (this.interludeRunning) return;      // one beat per clear, not one per frame
    this.interludeRunning = true;
    const overlay = document.getElementById('interlude');
    const canvas = document.getElementById('interlude-canvas');
    const finish = () => {
      if (overlay) overlay.classList.add('hidden');
      this.interludeRunning = false;
      this.nextStage();
    };
    if (!overlay || !canvas) { finish(); return; }
    try {
      if (!this.interlude) this.interlude = new Interlude(canvas);
      // The stage being *entered*, and whether that one is a boss stage —
      // this.stage is still the cleared stage until nextStage() increments.
      const entering = this.stage + 1;
      overlay.classList.remove('hidden');
      this.interlude.run(entering, isBossStage(entering)).then(finish, finish);
    } catch (e) {
      finish();
    }
  }

  // Called when every hostile in the current stage is down: the campaign is
  // endless, so this rolls a fresh procedurally-generated stage rather than
  // ending the run. Player health/ammo/XP/unlocks carry over.
  nextStage() {
    // Cleared the stage we were on, so its attempt tally resets — the counter
    // only ever measures the wall the player is currently stuck behind.
    this.progression.clearAttempts(this.stage);
    // Bank the clear so a later death restarts here rather than at stage 1.
    this.progression.recordStageCleared(this.stage);
    // Taking ground costs time — the sky walks forward with the campaign.
    this.day.onStageCleared();
    this.stage++;
    this.world.regenerate(this.stage, this.runCtx());
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
    hud.setAttempt(this.progression.attempts(this.stage));
    const res = this.progression.addXp(50 + this.stage * 5);
    const leveled = this.handleLevelUp(res);
    if (this.isBossStage) {
      const boss = this.enemies[0];
      hud.showBoss(true, boss.name);
      hud.setBossHp(1);
      this.barks.fire('bossSpot');
      if (!leveled) hud.notify(t('notify.bossIncoming', { name: boss.name }));
    } else {
      hud.showBoss(false);
      if (!leveled) hud.notify(`STAGE ${this.stage} — HOSTILES INBOUND`);
    }
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
    if (s === 'menu' && this.traderUI) this.traderUI.refresh();
    if (s === 'menu' && this.statsUI) this.statsUI.refresh();
    // Logs are found mid-run, so the Archives are stale the moment a mission
    // ends — repaint on the way back to the menu, not just on tab click.
    if (s === 'menu' && this.archivesUI) this.archivesUI.render();
    if (s === 'menu') this.refreshLevelSelect();
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
    // The drum was cover a second ago; it is scrap now. Dropping the collider
    // here rather than testing `alive` inside rectHit keeps the collision scan
    // a plain loop over a dense array.
    this.world.removeCollider(b.col);
    b.col = null;
    this.fx.explosion(b.x, b.y);
    this.barks.fire('barrel');
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
    // Sampled unconditionally, so switching the overlay on shows a populated
    // frame-time history rather than a second of empty graph.
    debug.sample(dt);
    const inp = DEMO ? demoDriver : input;
    if (DEMO) demoDriver.tick(dt);

    if (inp.hit && input.hit('Escape')) {
      if (this.state === 'play') this.setState('pause');
      else if (this.state === 'pause') this.setState('play');
    }
    // Developer overlay. Read off the real Input rather than `inp`, so it
    // still works while the attract-mode demo driver is holding the controls,
    // and read before the pause gate below so it can be toggled from a paused
    // frame — which is exactly when you want to read a number off it.
    if (input.hit('F3')) debug.toggle();
    if (this.state === 'pause') { input.endFrame(); return; }
    if (this.state === 'revive') { input.endFrame(); return; }
    // MOTH's ambient barks (low health, recovery, a long lull). Ticked above
    // the interlude gate on purpose: a bark left on screen when the stage was
    // cleared has to keep draining its hold, or it is still sitting there —
    // frozen mid-animation — when the cinematic hands off to the next stage.
    // `playing` gates only the *triggers*, so nothing new fires meanwhile.
    this.barks.update(dt, {
      playing: this.state === 'play' && !this.interludeRunning && this.player.deadT <= 0,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
    });

    // First-run coaching (game/tutorial.js). The vault probe is a collider
    // scan, so it only runs while that one lesson is still unseen — once the
    // player has been taught it, this costs nothing.
    {
      const p = this.player;
      const teaching = this.state === 'play' && !this.interludeRunning && p.deadT <= 0;
      const cur = p.cur;
      this.tutorial.update(dt, teaching ? {
        playing: true,
        detState: this._prevDetState,
        stealthTarget: !!p.stealthTarget,
        vaultCandidate: !this.tutorial.seen('vault') && p.onGround
          ? !!p.findVaultTarget(p.facing) : false,
        magEmpty: !!(cur && cur.wpn && cur.wpn.kind === 'gun' && cur.mag === 0),
        swapUnlocked: p.smgUnlocked,
      } : null);
    }

    // The between-stage cinematic covers the playfield, so nothing should be
    // simulating under it — and the taps that skip it must not also fire the
    // weapon on the stage it hands off to.
    if (this.interludeRunning) { input.endFrame(); return; }

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
    // Touch drives Input once per frame rather than once per pointer event —
    // see engine/touch.js. The aim stick works outward from the operator's own
    // screen position, so it is handed that first: push the stick at 2
    // o'clock, the shot goes to 2 o'clock. Shake is deliberately excluded, or
    // an explosion would drag the crosshair around with the camera.
    if (this.touch && this.touch.visible) {
      // AIM_ORIGIN_Y mirrors player.js's `oy = this.y - 95` — the chest, which
      // is the point aimWorld is measured from. Anchoring anywhere else would
      // make the stick angle and the shot angle differ by a few degrees at
      // close range, which is exactly where it would be noticed.
      this.touch.setAimAnchor(
        (p.x - this.cam.x) * this.cam.zoom + vw / 2,
        (p.y - 95 - this.cam.y) * this.cam.zoom + vh / 2,
      );
      this.touch.update(dt);
    }
    hud.setAimScreen(inp.mouse.x, inp.mouse.y);
    if (this.state === 'play') {
      p.update(dt, { input: inp, enemies: this.enemies, game: this, vw, vh });
    } else {
      p.update(dt, { input: NULL_INPUT, enemies: this.enemies, game: this, vw, vh });
    }
    for (const e of this.enemies) e.update(dt, p, this);

    const kills = this.enemies.filter((e) => e.deadT > 0).length;
    hud.setObjective(kills, this.enemies.length);
    if (this.isBossStage) {
      const boss = this.enemies[0];
      if (boss.deadT > 0) hud.showBoss(false);
      else hud.setBossHp(boss.hp / boss.maxHp);
    }

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
      if (this.touch) this.touch.setSliding(p.sliding);
    } else {
      hud.setStealthPrompt(false);
      if (this.touch) this.touch.setTakedownAvailable(false);
      if (this.touch) this.touch.setSliding(p.sliding);
    }

    if (this.state === 'play') {
      if (p.deadT > 0) {
        this.endDelay += dt;
        // one chance to watch an ad and get back up before the run ends —
        // offerRevive() moves to the 'revive' state, which freezes update()
        // (see the early-return above), so this only ever fires once.
        if (!this.reviveOffered && this.endDelay > 1.2) {
          this.reviveOffered = true;
          this.offerRevive();
        }
      } else if (this.enemies.length > 0 && kills === this.enemies.length) {
        this.endDelay += dt;
        if (this.endDelay > 1.6) this.playInterludeThenNextStage();
      }
      // lightweight periodic checkpoint — "save & continue" per spec: state
      // is captured frequently so a reload/close always resumes in place
      this._autosaveT += dt;
      this._playtimeAccumMs += dt * 1000;
      if (this.comboTimer > 0) this.comboTimer -= dt;
      if (this._autosaveT > 4) {
        this._autosaveT = 0;
        this.snapshotRun();
        this.progression.addPlaytime(this._playtimeAccumMs);
        this._playtimeAccumMs = 0;
      }
    }
    input.endFrame();
  }

  // ---- revive: one watch-an-ad continue per deploy, offered right after
  // going down. Accepting keeps the stage/kills/loadout exactly as they
  // were — only HP resets — so the run's streak of stages isn't broken.
  offerRevive() {
    this.setState('revive');
    hud.showRevive(true);
    let secs = 6;
    hud.setReviveCountdown(secs);
    this._reviveTimer = setInterval(() => {
      secs--;
      hud.setReviveCountdown(secs);
      if (secs <= 0) { clearInterval(this._reviveTimer); this._reviveTimer = null; this.declineRevive(); }
    }, 1000);
  }

  reviveViaAd() {
    if (this._reviveTimer) { clearInterval(this._reviveTimer); this._reviveTimer = null; }
    // Only tear the prompt down once there is something to replace it with.
    // With the ad preloaded that is immediate and nothing changes on screen;
    // when it is not — a cold start, or a fetch that found no fill — the
    // player now waits in front of LOADING AD rather than a blank screen.
    // Both callbacks below hide the prompt themselves.
    if (isRewardedAdReady()) hud.showRevive(false);
    else hud.setReviveLoading();
    watchRewardedAd(
      () => { hud.clearReviveLoading(); this.progression.recordAdWatched(); this.doRevive(); },
      () => { hud.clearReviveLoading(); this.declineRevive(); }
    );
  }

  doRevive() {
    const p = this.player;
    p.deadT = 0; p.hp = Math.round(p.maxHp * 0.6);
    p.hurtT = 0; p.stunT = 0;
    this.endDelay = 0;
    hud.showRevive(false);
    this.setState('play');
    this.snapshotRun();
    hud.notify('BACK IN THE FIGHT');
  }

  declineRevive() {
    if (this._reviveTimer) { clearInterval(this._reviveTimer); this._reviveTimer = null; }
    hud.showRevive(false);
    this.finish();
  }

  finish() {
    const p = this.player;
    const acc = p.shots ? Math.round((p.hits / p.shots) * 100) : 0;
    // `elapsed`, not `t` — `t` is the translation function in this module.
    const elapsed = Math.round(this.time - this.startTime);
    this.progression.recordShots(p.shots, p.hits);
    this.progression.recordRun(this.stage, elapsed);
    this.progression.recordWeaponShots(this._weaponShotsThisRun);
    this._weaponShotsThisRun = {};
    this.progression.addPlaytime(this._playtimeAccumMs);
    this._playtimeAccumMs = 0;
    // The operator went down on this stage: bank the failure so the next
    // deployment opens on attempt N+1, and headline that number on the death
    // screen the way a Geometry Dash run does.
    const nextAttempt = this.progression.recordAttempt(this.stage);
    // TimeShift: every ATTEMPT tick pushes the sector's clock an hour on, so
    // the sky is a running record of how long this wall has held the player.
    this.day.onAttempt();
    this.lastRunStats = { stage: this.stage, attempts: nextAttempt - 1, kills: p.kills };
    this.progression.clearRun();   // the run is over — nothing to resume
    hud.end([
      `STAGE REACHED — ${this.stage}`,
      `HOSTILES ELIMINATED — ${p.kills} &nbsp;(${p.headshots} HEADSHOTS)`,
      `ACCURACY — ${acc}%`,
      `MISSION TIME — ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`,
      `OPERATOR LEVEL — ${this.progression.data.level}`,
    ].join('<br>'), t('hud.attempt', { n: nextAttempt - 1 }));
    this.setState('end');
  }

  // ---- retention ----

  // Offers today's login reward. Called when the menu becomes visible, so
  // it lands on the screen the player is already looking at rather than
  // interrupting a run.
  offerDailyReward() {
    // Never on a brand-new install. A first-time player should reach the
    // DEPLOY button and be shooting within seconds, not read a streak chart
    // for a streak they haven't started — the reward is there to pull people
    // *back*, so it waits until they've actually played once.
    if (!this.progression.data.totalKills && !this.progression.totalAttempts) return;
    const st = dailyStatus();
    if (!st.available) return;
    hud.showDaily(true, { rewards: DAILY_REWARDS, day: st.day, streak: st.streak });
  }

  claimDailyReward() {
    const reward = claimDaily();
    if (!reward) { hud.showDaily(false); return; }
    this.progression.addScrap(reward.amount);
    hud.markDailyClaimed();
    if (audio.levelUp) audio.levelUp();
    // Repaint the balances behind the overlay, then close it.
    if (this.metaUI) this.metaUI.refresh();
    if (this.traderUI) this.traderUI.refresh();
    setTimeout(() => hud.showDaily(false), 900);
  }

  // Paints and shows the score card for the run that just ended.
  // lastRunStats is set by finish().
  openShareCard() {
    const stats = this.lastRunStats || { stage: this.stage, attempts: 0, kills: 0 };
    stats.scrap = this.progression.scrap;
    const cv = hud.shareCanvasEl();
    if (!cv) return;
    paintShareCard(cv, stats);
    hud.showShareCard(true);
  }

  async sendShareCard() {
    const stats = this.lastRunStats || { stage: this.stage, attempts: 0, kills: 0 };
    const kind = await shareCard(hud.shareCanvasEl(), stats);
    hud.setShareResult(kind);
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
      } else if (em.kind === 'smolder') {
        // Civil-war dressing: a barrel that has already burned out. No flame
        // left, just a slow soot column and the odd ember lifting off the rim
        // — the aftermath of a fight rather than one in progress.
        if (!onScreen) continue;
        em.t -= dt * mul;
        if (em.t <= 0) {
          em.t = em.rate;
          ventSmoke(this.particles, em.x, em.y - 6, -Math.PI / 2, 'soot', { sizeMul: 1.25 });
          if (Math.random() < 0.28) {
            this.particles.spawn(K.EMBER, {
              x: em.x + randSpread(6), y: em.y,
              vx: randSpread(10), vy: -rand(20, 52),
              life: rand(0.6, 1.5), size: rand(1.1, 2.1), drag: 1.7,
            });
          }
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
    // Hard reset of every piece of global canvas state at the top of the
    // frame. The pass below composites with 'multiply', 'screen' and 'lighter'
    // and applies `filter`; if any of those ever escaped (an early return, an
    // exception mid-pass, a WebView that restores state differently), the next
    // frame would composite the whole scene through it — which shows up as
    // dark rectangles around sprites. Resetting unconditionally makes that
    // class of bug impossible rather than relying on every path unwinding.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // background parallax stack (screen space)
    this.world.drawBackground(ctx, this.cam, vw, vh, this.time);

    // world layer
    ctx.save();
    this.cam.applyTransform(ctx, vw, vh);
    this.world.drawBack(ctx, this.cam, vw, vh);

    // Characters draw last in this layer and carry a contour, so they read as
    // the foreground subject against the (deliberately dimmed, desaturated)
    // environment behind them. Off-screen hostiles are skipped outright —
    // an endless stage can hold far more of them than are ever in frame, and
    // the contour is the priciest per-character work in the loop.
    const charOpts = this.characterDrawOpts();
    const halfVis = vw / (2 * this.cam.zoom) + 220;
    const onScreen = (e) => Math.abs(e.x - this.cam.x) < halfVis;
    // Same treatment for particles, which are seeded across the whole map
    // (ambient ash, the chimney columns) and were all being drawn regardless.
    // A grown smoke puff is ~40 units across, so the margin is generous;
    // culling still happens at draw time only, never at update time.
    const halfPx = vw / (2 * this.cam.zoom) + 90;
    const halfPy = vh / (2 * this.cam.zoom) + 90;
    this.particles.setView(
      this.cam.x - halfPx, this.cam.x + halfPx,
      this.cam.y - halfPy, this.cam.y + halfPy,
    );
    for (const e of this.enemies) if (e.deadT > 0 && onScreen(e)) e.draw(ctx);
    for (const e of this.enemies) if (e.deadT <= 0 && onScreen(e)) e.draw(ctx);
    if (this.state !== 'menu') this.player.draw(ctx, charOpts);
    this.particles.draw(ctx, false);
    this.fx.draw(ctx);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    this.particles.draw(ctx, true);
    ctx.restore();
    ctx.restore();

    // World-space debug geometry goes inside the camera transform, before the
    // lighting composite: it describes the scene, so it should be graded with
    // the scene rather than floating over it as a separate UI layer.
    if (debug.on) {
      ctx.save();
      this.cam.applyTransform(ctx, vw, vh);
      this.vw = vw;
      debug.drawWorld(ctx, this);
      ctx.restore();
    }

    this.compositeLighting();
    this.grade();
    if (this.state === 'play' && this.player.deadT <= 0) this.crosshair();
    // The readout goes last, after the grade, so the numbers stay legible
    // whatever the day cycle is doing behind them.
    debug.drawHud(ctx, this, dpr);
  }

  // Per-frame character draw options (ground-accent colour/width), rebuilt
  // cheaply each frame so a graphics-tier change takes effect immediately.
  // Returns null on tiers with the accent disabled.
  characterDrawOpts() {
    const px = quality.preset.accentPx;
    if (!px) return null;
    if (!this._charOpts || this._charOpts.accent.px !== px) {
      this._charOpts = { accent: { color: CHAR_ACCENT_COLOR, px } };
    }
    return this._charOpts;
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
    const gsy = (vh / 2 + (GROUND_Y - this.cam.y) * this.cam.zoom) * lightDpr;
    const amb = lightG.createLinearGradient(0, 0, 0, Math.max(gsy, 1));
    amb.addColorStop(0, 'rgb(182,188,206)');
    amb.addColorStop(0.72, 'rgb(204,201,204)');
    amb.addColorStop(1, 'rgb(224,214,200)');
    lightG.fillStyle = amb;
    lightG.fillRect(0, 0, lightCv.width, lightCv.height);
    lightG.setTransform(lightDpr, 0, 0, lightDpr, 0, 0);
    this.cam.applyTransform(lightG, vw, vh);
    lightG.globalCompositeOperation = 'lighter';

    // glow map only feeds the bloom pass below — skip filling it entirely
    // when bloom won't run, rather than painting into it and then discarding
    // the result (the device probe can veto bloom as well as the tier)
    const bloomOn = quality.preset.bloom && device.canvasFilter;
    if (bloomOn) {
      glowG.setTransform(1, 0, 0, 1, 0, 0);
      glowG.globalCompositeOperation = 'source-over';
      glowG.clearRect(0, 0, glowCv.width, glowCv.height);
      glowG.setTransform(lightDpr, 0, 0, lightDpr, 0, 0);
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
    // Gated on the live capability probe, not just the quality tier: where
    // ctx.filter is unimplemented (older Android WebViews) the blur is a
    // silent no-op, and this pass would screen the glow map over the scene
    // completely unblurred — a bright haze that appears only in the APK.
    // Better to ship no bloom there than a broken one.
    if (quality.preset.bloom && device.canvasFilter) {
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

    if (quality.preset.richGrade) this.gradeRich(gy);
    else this.gradeCheap(gy);

    // film grain — subtle; skipped on weaker quality tiers (a canvas-wide
    // tiled overlay draw isn't free, and it's the least-missed effect).
    // Note this tier check used to `return` outright; it no longer can,
    // because the brightness lift below has to run on every tier — the
    // cheapest devices are exactly the ones with the dimmest screens.
    if (quality.preset.grain) {
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.03;
      const ox = (Math.random() * 256) | 0, oy = (Math.random() * 256) | 0;
      for (let x = -ox; x < vw; x += 256) {
        for (let y = -oy; y < vh; y += 256) ctx.drawImage(grainCv, x, y);
      }
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'source-over';
    // Player brightness lift, last of all — see engine/brightness.js. It has
    // to sit after the vignette and grain, or those passes would darken the
    // very pixels it just raised.
    brightness.apply(ctx, vw, vh);
    ctx.globalCompositeOperation = 'source-over';
  }

  // Full grade: haze band, warm highlight push, cool shadow tint, vignette.
  // Four full-screen passes, two of them on `overlay` and `soft-light`.
  gradeRich(gy) {
    ctx.globalCompositeOperation = 'source-over';
    const haze = ctx.createLinearGradient(0, gy - vh * 0.5, 0, gy);
    haze.addColorStop(0, 'rgba(150,158,172,0)');
    haze.addColorStop(1, 'rgba(150,158,172,0.05)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, vw, gy);

    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255,180,112,0.055)';
    ctx.fillRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(48,68,116,0.06)';
    ctx.fillRect(0, 0, vw, vh);

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = this.vignette();
    ctx.fillRect(0, 0, vw, vh);
  }

  // Cheap grade, for the tier where a dropped frame costs more than tonal
  // separation does.
  //
  // The rich pass is four full-screen passes, and on a weak GPU each one is a
  // separate read-modify-write of the whole framebuffer — `overlay` and
  // `soft-light` especially, since neither is a fixed-function blend. All four
  // are `source-over`-compatible once the two tonal passes are folded into a
  // single flat tint, and everything left is a function of the screen rather
  // than of the scene. So they are baked once into a small texture and blitted
  // in one stretched draw: four framebuffer passes become one, and the pixels
  // that produce them are computed at a fraction of the resolution — which
  // costs nothing here, because every layer in the bake is a smooth gradient.
  //
  // The bake only depends on the viewport and on where the ground sits on
  // screen, so it is rebuilt when the viewport changes or the horizon moves
  // more than a few pixels — a handful of times a second while the camera
  // travels, never per frame.
  gradeCheap(gy) {
    const q = Math.round(gy / 12);
    if (!this._gradeCv || this._gradeVw !== vw || this._gradeVh !== vh || this._gradeQ !== q) {
      this._gradeQ = q; this._gradeVw = vw; this._gradeVh = vh;
      // Aspect-correct and deliberately small: 1/4 scale, floored so a tiny
      // window still gets enough rows for the gradients to be smooth.
      const bw = Math.max(64, Math.round(vw / 4));
      const bh = Math.max(64, Math.round(vh / 4));
      if (!this._gradeCv || this._gradeCv.width !== bw || this._gradeCv.height !== bh) {
        const m = makeCanvas(bw, bh);
        this._gradeCv = m.cv; this._gradeG = m.g;
      }
      const g = this._gradeG;
      const k = bh / vh;             // bake pixels per CSS pixel
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, bw, bh);
      // haze band
      const gyk = gy * k;
      const haze = g.createLinearGradient(0, gyk - bh * 0.5, 0, gyk);
      haze.addColorStop(0, 'rgba(150,158,172,0)');
      haze.addColorStop(1, 'rgba(150,158,172,0.05)');
      g.fillStyle = haze;
      g.fillRect(0, 0, bw, Math.max(0, gyk));
      // net tint standing in for the warm-highlight and cool-shadow passes
      g.fillStyle = 'rgba(150,142,150,0.045)';
      g.fillRect(0, 0, bw, bh);
      // vignette
      const v = g.createRadialGradient(bw / 2, bh * 0.46, Math.min(bw, bh) * 0.5, bw / 2, bh / 2, Math.max(bw, bh) * 0.78);
      v.addColorStop(0, 'rgba(5,6,10,0)');
      v.addColorStop(1, 'rgba(4,5,9,0.16)');
      g.fillStyle = v;
      g.fillRect(0, 0, bw, bh);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this._gradeCv, 0, 0, vw, vh);
  }

  // Vignette gradient, rebuilt only when the viewport changes.
  vignette() {
    if (!this._vig || this._vigVw !== vw || this._vigVh !== vh) {
      this._vigVw = vw; this._vigVh = vh;
      const v = ctx.createRadialGradient(vw / 2, vh * 0.46, Math.min(vw, vh) * 0.5, vw / 2, vh / 2, Math.max(vw, vh) * 0.78);
      v.addColorStop(0, 'rgba(5,6,10,0)');
      v.addColorStop(1, 'rgba(4,5,9,0.16)');
      this._vig = v;
    }
    return this._vig;
  }

  // Is the crosshair on a live hostile? Drives the reticle's green/red state.
  //
  // With a mouse the crosshair is a POSITION, so the honest test is "is this
  // point inside a hitbox". With the touch sticks it is a DIRECTION — the
  // reticle sits a fixed distance out from the operator's chest and only its
  // angle carries meaning — so the same test would leave the reticle green
  // while the player is pouring rounds into someone twenty metres away. When
  // touch is driving, the test becomes "does the aim ray pass through anyone",
  // which is the question the reticle is actually answering on a phone.
  aimOnTarget(wx, wy) {
    const directional = !!(this.touch && this.touch.visible);
    if (directional && this.player) return this.aimRayOnTarget(wx, wy);
    for (const e of this.enemies) {
      if (e.deadT > 0) continue;
      const hs = e.hitboxScale || 1;
      if (wx >= e.x - 13 * hs && wx <= e.x + 13 * hs &&
          wy >= e.y - 134 * hs && wy <= e.y) return true;
    }
    return false;
  }

  // Perpendicular distance from each hostile's centre of mass to the aim ray,
  // measured from the same chest origin player.js fires from. AIM_RAY_RANGE
  // keeps it to targets that are plausibly shootable rather than lighting up
  // for someone on the far side of the block.
  aimRayOnTarget(wx, wy) {
    const p = this.player;
    const ox = p.x, oy = p.y - 95;
    const dx = wx - ox, dy = wy - oy;
    const len = Math.hypot(dx, dy);
    if (len < 1) return false;
    const ux = dx / len, uy = dy / len;
    for (const e of this.enemies) {
      if (e.deadT > 0) continue;
      const hs = e.hitboxScale || 1;
      const ex = e.x - ox, ey = (e.y - 67 * hs) - oy;
      const along = ex * ux + ey * uy;
      if (along <= 0 || along > AIM_RAY_RANGE) continue;    // behind, or too far
      const perp = Math.abs(ex * uy - ey * ux);
      if (perp <= 30 * hs) return true;
    }
    return false;
  }

  crosshair() {
    const inp = DEMO ? demoDriver : input;
    const mx = inp.mouse.x, my = inp.mouse.y;
    const p = this.player;
    const w = cam2world(this.cam, mx, my);
    const hot = this.aimOnTarget(w.x, w.y);
    // Neon green idle / neon red on target. Each stroke goes down twice — a
    // dark backing pass then the lit colour — so the reticle stays readable
    // over a muzzle flash or a lit window, not just over the dimmed scene.
    const neon = hot ? '#ff3b46' : '#4dffa0';
    const glow = hot ? 'rgba(255,59,70,0.85)' : 'rgba(77,255,160,0.8)';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';

    if (p.cur.wpn.kind === 'gun') {
      // Bloom: the reticle opens with the weapon's live cone (movement, hip
      // fire, airborne) and kicks out on each shot via the recoil spring,
      // then settles as the spring decays — so accuracy is readable at a
      // glance instead of only felt through where rounds land.
      const gap = 6 + p.visSpread * CROSSHAIR_SPREAD_GAIN + p.cur.ws.recoil * CROSSHAIR_RECOIL_GAIN;
      const len = hot ? 9 : 7;
      const ticks = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      // backing pass
      ctx.strokeStyle = 'rgba(3,5,8,0.85)'; ctx.lineWidth = 3.6; ctx.shadowBlur = 0;
      for (const [dx, dy] of ticks) {
        ctx.beginPath();
        ctx.moveTo(mx + dx * gap, my + dy * gap);
        ctx.lineTo(mx + dx * (gap + len), my + dy * (gap + len));
        ctx.stroke();
      }
      // lit pass
      ctx.strokeStyle = neon; ctx.lineWidth = 1.7;
      ctx.shadowColor = glow; ctx.shadowBlur = 7;
      for (const [dx, dy] of ticks) {
        ctx.beginPath();
        ctx.moveTo(mx + dx * gap, my + dy * gap);
        ctx.lineTo(mx + dx * (gap + len), my + dy * (gap + len));
        ctx.stroke();
      }
      // centre dot
      ctx.fillStyle = 'rgba(3,5,8,0.85)'; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(mx, my, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = neon; ctx.shadowColor = glow; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(mx, my, 1.3, 0, Math.PI * 2); ctx.fill();
      // target brackets confirm a hostile is under the reticle
      if (hot) {
        const r = gap + len + 3;
        ctx.strokeStyle = neon; ctx.lineWidth = 1.9; ctx.shadowBlur = 7;
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          ctx.beginPath();
          ctx.moveTo(mx + sx * r, my + sy * (r - 4));
          ctx.lineTo(mx + sx * r, my + sy * r);
          ctx.lineTo(mx + sx * (r - 4), my + sy * r);
          ctx.stroke();
        }
      }
    } else {
      // melee: a simple ring, same two-pass treatment
      ctx.strokeStyle = 'rgba(3,5,8,0.85)'; ctx.lineWidth = 3.4; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(mx, my, 3.8, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = neon; ctx.lineWidth = 1.6;
      ctx.shadowColor = glow; ctx.shadowBlur = 7;
      ctx.beginPath(); ctx.arc(mx, my, 3.8, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.lineCap = 'butt';
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

  if (game.state === 'play' && !quality.autoLowerExhausted) {
    perfAvg = perfAvg * 0.94 + rawDt * 0.06;
    lowPerfT = perfAvg > 1 / 38 ? lowPerfT + rawDt : 0;
    if (lowPerfT > 4) {
      // Give the new preset a fair run before judging it again, rather than
      // stepping down twice off the same bad stretch. The step-down budget in
      // quality.js is what actually bounds this.
      lowPerfT = -8;
      perfAvg = 1 / 60;
      const lowered = quality.tryAutoLower();
      if (lowered) { hud.notify(t('notify.graphicsLowered', { tier: quality.preset.name })); resize(); }
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
