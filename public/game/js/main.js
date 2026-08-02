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
import { t, applyTranslations, cycleLang, getLang, LANGS } from './engine/i18n.js';
import { buildSoldier, makeShadowSprite } from './art/soldier.js';
import { buildWeapons } from './art/weapons.js';
import { World, GROUND_Y, MAP_W } from './game/world.js';
import { FX } from './game/fx.js';
import { Player } from './game/player.js';
import { Enemy, Boss, BOSS_STAGE_INTERVAL, BOSS_WEAPONS, getGlobalDetection } from './game/enemy.js';
import { Hud } from './game/hud.js';
import { Progression, UNLOCKS } from './game/progression.js';
import { DayCycle, formatHour } from './engine/daycycle.js';
import { applyLoadout } from './game/meta.js';
import { MetaUI } from './game/metaui.js';
import { StoreUI } from './game/storeui.js';
import { StatsUI } from './game/statsui.js';
import { TouchControls } from './engine/touch.js';
import { watchRewardedAd } from './engine/ads.js';
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

// Seconds the mission briefing stays up before fading itself out.
const LORE_HOLD = 3;

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
  applyTranslations();          // fill static markup before the first paint
  hud.show('loading');
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
  game.storeUI = new StoreUI({ progression: game.progression, previewItem, audio });
  game.storeUI.mount();
  document.querySelector('[data-tab="store"]').addEventListener('click', () => game.storeUI.refresh());
  game.statsUI = new StatsUI({ progression: game.progression, weapons: assets.weapons, audio });
  game.statsUI.mount();
  document.querySelector('[data-tab="stats"]').addEventListener('click', () => game.statsUI.refresh());
  game.touch = new TouchControls(input, { force: params.has('touch') });
  game.touch.mount();

  hud.setLoad(1, 'READY');
  await raf();
  if (DEMO) game.deploy();
  else {
    hud.show('menu'); game.state = 'menu';
    game.metaUI.refresh(); game.storeUI.refresh(); game.statsUI.refresh();
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
    this.reset();
    hud.bind({
      deploy: () => { audio.resume(); audio.ui(); this.deploy(); },
      // Level select: launching a specific sector is always a fresh mission
      // into that stage, so any half-finished run snapshot is discarded first.
      pickStage: (n) => {
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
      // cycles Low → Medium → High → Ultra; dpr/bloom/grain/particle cap all
      // take effect immediately, ASSET_SCALE only on the next full reload
      graphics: () => {
        audio.ui();
        quality.cycle();
        resize();
        hud.setGraphicsTier(quality.preset.name);
      },
      watchAdRevive: () => { audio.ui(); this.reviveViaAd(); },
      skipRevive: () => { audio.ui(); this.declineRevive(); },
      // Cycles TR ⇄ EN. The static markup is re-filled by i18n itself; the
      // screens that build their labels in JS repaint through onLangChange.
      language: () => { audio.ui(); cycleLang(); hud.setLanguage(); },
      share: () => { audio.ui(); this.openShareCard(); },
      shareSend: () => { audio.ui(); this.sendShareCard(); },
      shareClose: () => { audio.ui(); hud.showShareCard(false); },
      claimDaily: () => { audio.ui(); this.claimDailyReward(); },
    });
    hud.setGraphicsTier(quality.preset.name);
    hud.setLanguage();
    canvas.addEventListener('mousedown', () => audio.resume(), { once: true });
  }

  spawnEnemiesForStage() {
    const diff = clamp(this.stage - 1, 0, 8);
    this.isBossStage = this.stage > 0 && this.stage % BOSS_STAGE_INTERVAL === 0;
    if (this.isBossStage) {
      // one heavyweight encounter in place of the regular squad — spawned at
      // the map's middle spawn point (a reasonable, already-clear patrol lane)
      // so no map/world-generation code needs to know bosses exist
      const spawns = this.world.enemySpawns;
      const mid = spawns[Math.floor(spawns.length / 2)] || { x: MAP_W * 0.55, y: GROUND_Y, min: MAP_W * 0.4, max: MAP_W * 0.75 };
      // Bosses carry heavy weapons, never an infantry rifle — the weapon id
      // is chosen by tier in the Boss constructor (see BOSS_WEAPONS).
      const tier = Math.max(0, Math.floor(this.stage / BOSS_STAGE_INTERVAL) - 1);
      const bossWpn = assets.weapons[BOSS_WEAPONS[tier % BOSS_WEAPONS.length]] || assets.weapons.rifle;
      const boss = new Boss(assets.phantom, assets.shadow, bossWpn, this.world, this.fx, audio, mid.x, mid.min, mid.max, this.stage);
      boss.y = mid.y;
      this.enemies = [boss];
    } else {
      this.enemies = this.world.enemySpawns.map((s) => {
        const e = new Enemy(assets.phantom, assets.shadow, assets.weapons.rifle, this.world, this.fx, audio, s.x, s.min, s.max);
        e.y = s.y;
        e.difficulty = diff;
        e.maxHp = 100 + Math.min(60, diff * 5);
        e.hp = e.maxHp;
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
    const extra = res.newUnlocks.length ? ' — ' + res.newUnlocks.map((u) => u.label).join(', ') : '';
    hud.notify(t('notify.levelUp', { n: res.newLevel }) + extra);
    return true;
  }

  onPlayerHit(headshot, killed, enemy) {
    if (!killed) return;
    this.progression.recordKill(headshot);   // also awards tokens
    this.progression.addBpXp(headshot ? 20 : 12);   // battle-pass progress (currency system stays intact even though the shop UI is gone)
    hud.setTokens(this.progression.tokens);
    const res = this.progression.addXp(10 + (headshot ? 15 : 0));
    this.handleLevelUp(res);
    this.registerKill();
    if (enemy && enemy.isBoss) this.onBossDefeated(enemy);
  }

  // Silent takedown reward: counts as an elimination, with a small bonus for
  // the clean approach. No squad alert (handled by the enemy's silent flag).
  onStealthKill(enemy) {
    this.progression.recordKill(false);
    this.progression.addBpXp(16);
    hud.setTokens(this.progression.tokens);
    const res = this.progression.addXp(14);
    this.handleLevelUp(res);
    this.registerKill();
    if (enemy && enemy.isBoss) this.onBossDefeated(enemy);
  }

  // Bonus payout + a distinct toast on top of the regular kill reward —
  // boss stages otherwise play through the exact same reward path as any
  // other elimination.
  onBossDefeated(boss) {
    this.progression.recordBossKill();
    hud.setTokens(this.progression.tokens);
    hud.showBoss(false);
    hud.notify(t('notify.bossDown', { name: boss.name }));

    // Boss Redeemable roll — 1/1000, boss kills only. This is the sole way
    // these items enter a save; nothing in the crate or the Diamond store
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
    hud.renderLevelSelect(
      this.progression.unlockedStages(),
      (n) => this.progression.stageCleared(n),
      BOSS_STAGE_INTERVAL,
    );
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
    this.startTime = this.time;
    this.cam.follow(this.player.x, this.player.y - 60, 0, 0, true);
    hud.setObjective(0, this.enemies.length);
    hud.setStage(this.stage);
    hud.setProgress(this.progression.data.level, this.progression.xpProgress());
    hud.setTokens(this.progression.tokens);
    if (this.isBossStage) { hud.showBoss(true, this.enemies[0].name); hud.setBossHp(this.enemies[0].hp / this.enemies[0].maxHp); }
    else hud.showBoss(false);
    hud.setAttempt(this.progression.attempts(this.stage));
    hud.showLore(LORE_HOLD);   // mission briefing on entering a fresh deployment
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
    if (s === 'menu' && this.storeUI) this.storeUI.refresh();
    if (s === 'menu' && this.statsUI) this.statsUI.refresh();
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
    if (this.state === 'revive') { input.endFrame(); return; }

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
    } else {
      hud.setStealthPrompt(false);
      if (this.touch) this.touch.setTakedownAvailable(false);
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
        if (this.endDelay > 1.6) this.nextStage();
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
    hud.showRevive(false);
    watchRewardedAd(
      () => { this.progression.recordAdWatched(); this.doRevive(); },
      () => this.declineRevive()
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
    if (reward.kind === 'diamonds') this.progression.addDiamonds(reward.amount);
    else this.progression.addTokens(reward.amount);
    hud.markDailyClaimed();
    if (audio.levelUp) audio.levelUp();
    // Repaint the balances behind the overlay, then close it.
    if (this.metaUI) this.metaUI.refresh();
    if (this.storeUI) this.storeUI.refresh();
    setTimeout(() => hud.showDaily(false), 900);
  }

  // Paints and shows the score card for the run that just ended.
  // lastRunStats is set by finish().
  openShareCard() {
    const stats = this.lastRunStats || { stage: this.stage, attempts: 0, kills: 0 };
    stats.tokens = this.progression.tokens;
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
    this.world.drawBack(ctx, this.cam, vw);

    // Characters draw last in this layer and carry a contour, so they read as
    // the foreground subject against the (deliberately dimmed, desaturated)
    // environment behind them. Off-screen hostiles are skipped outright —
    // an endless stage can hold far more of them than are ever in frame, and
    // the contour is the priciest per-character work in the loop.
    const charOpts = this.characterDrawOpts();
    const halfVis = vw / (2 * this.cam.zoom) + 220;
    const onScreen = (e) => Math.abs(e.x - this.cam.x) < halfVis;
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

    this.compositeLighting();
    this.grade();
    if (this.state === 'play' && this.player.deadT <= 0) this.crosshair();
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
    const gsy = (vh / 2 + (GROUND_Y - this.cam.y) * this.cam.zoom) * dpr;
    const amb = lightG.createLinearGradient(0, 0, 0, Math.max(gsy, 1));
    amb.addColorStop(0, 'rgb(182,188,206)');
    amb.addColorStop(0.72, 'rgb(204,201,204)');
    amb.addColorStop(1, 'rgb(224,214,200)');
    lightG.fillStyle = amb;
    lightG.fillRect(0, 0, lightCv.width, lightCv.height);
    lightG.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    ctx.fillStyle = 'rgba(48,68,116,0.06)';
    ctx.fillRect(0, 0, vw, vh);
    // vignette — softer, larger falloff
    ctx.globalCompositeOperation = 'source-over';
    const v = ctx.createRadialGradient(vw / 2, vh * 0.46, Math.min(vw, vh) * 0.5, vw / 2, vh / 2, Math.max(vw, vh) * 0.78);
    v.addColorStop(0, 'rgba(5,6,10,0)');
    v.addColorStop(1, 'rgba(4,5,9,0.16)');
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

  // True when the aim point is inside a live hostile's hitbox — the same box
  // the weapons actually test against, so the reticle's target state can't
  // disagree with where a shot would land.
  aimOnTarget(wx, wy) {
    for (const e of this.enemies) {
      if (e.deadT > 0) continue;
      const hs = e.hitboxScale || 1;
      if (wx >= e.x - 13 * hs && wx <= e.x + 13 * hs &&
          wy >= e.y - 134 * hs && wy <= e.y) return true;
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

  if (game.state === 'play') {
    perfAvg = perfAvg * 0.94 + rawDt * 0.06;
    lowPerfT = perfAvg > 1 / 38 ? lowPerfT + rawDt : 0;
    if (lowPerfT > 4) {
      lowPerfT = -1e9;   // one check is enough; tryAutoLower() is one-shot anyway
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
