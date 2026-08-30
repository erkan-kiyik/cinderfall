// Hostile soldier AI: layered awareness (vision cone + peripheral vision +
// hearing) drives patrol → suspicious → search → alert → combat → retreat
// states. In combat, enemies strafe, seek cover, shove the player at point
// blank range, retreat when badly hurt, and call nearby allies in to help —
// all scaled by a per-enemy `difficulty` set from the current stage number.
// Burst fire with settling accuracy, animated reloads, flinch reactions, and
// a scripted collapse on death that leaves the body in the scene.

import { clamp, lerp, damp, rand, randSpread, easeInOutQuad, angleDiff, makeNoise1D } from '../engine/math.js';
import { bossHp, bossDmgMul, bossSkill, BOSS_INTERVAL } from './difficulty.js';
import {
  newWeaponState, computePose, weaponAnchor, weaponPoint, toWorld, drawSoldier,
  weaponBulkOf,
} from './rig.js';
import { segVsBox } from './player.js';

const WALK = 95, CHASE = 210;

// ---- locomotion --------------------------------------------------------
// Hostiles used to move by a single damp() toward a target speed: one rate
// for starting, one rate for stopping, one rate for turning around, all the
// same number. The Player has had three separate accelerations since the
// movement pass (ACCEL / DECEL / TURN_ACCEL in player.js) precisely because
// those three cases do not want the same answer — and a hostile that starts,
// stops and reverses on one exponential curve is the definition of moving on
// rails. It is also *symmetric*, which nothing with mass is: an exponential
// approach never actually arrives, so a hostile asked to stop kept creeping.
//
// So they get the same model, scaled down. The numbers sit below the
// player's on purpose: the operator should out-accelerate the people shooting
// at him, and the gap is what makes flanking feel like it worked.
const ENEMY_MOVE = {
  accel: 1500,     // px/s², pressing into a direction
  decel: 2300,     // planting the feet
  turn: 3100,      // reversing at pace
  turnEps: 20,     // below this a direction change is a step, not a reversal
};

// Per-enemy mass. Drives how briskly the accelerations above are actually
// spent, so two hostiles crossing the same ground do not do it in lockstep.
// A boss is deliberately heavy: slow to start, slow to stop, and the weight
// is readable before it reaches you.
const MASS_SPREAD = 0.16;        // ±, ordinary hostiles
const BOSS_MASS = 1.7;

// ---- squash & stretch --------------------------------------------------
// The same one-value spring the Player runs (see JUMP_SQUASH there): positive
// squashes, negative stretches, and the rig scales around the feet. Hostiles
// drop off cover and get shoved constantly and used to absorb all of it
// rigidly, which is most of what read as "robot".
const E_SQUASH_K = 240;
const E_SQUASH_DAMP = 12.5;
const E_SQUASH_LIMIT = 0.18;
const E_LAND_SPEED = 420;        // impact speed that starts registering as a landing
const E_LAND_MAX = 0.13;         // hardest landing compression

// Footing irregularity. The rig reads `ent.gaitNoise` and zeroes it for
// anything that does not track it — which was every hostile in the game, so
// they all walked the same tidy two-pose cycle in perfect sync with each
// other. Each hostile now carries its own seeded noise, so a squad crossing
// the same street no longer marches.
const GAIT_NOISE_SEED = 5501;
let gaitSeedCounter = 0;

// ---- hit reactions -----------------------------------------------------
// A round used to do exactly one thing to a hostile's body regardless of
// where it landed or which side it came from: `rot += flinchT * 0.8`, a
// weapon-space nudge with no direction in it at all. Two hits, one through
// the head and one through the shin, moved the body identically.
//
// The hitbox is already divided — the headshot multiplier reads off the same
// height — so the reaction reads off it too. Each region answers the way that
// part of a body answers, and every term is scaled by where the round came
// from, so being shot in the back pitches a hostile forward and being shot in
// the chest rocks him back.
//
//   rock    torso pitch away from the shooter, in radians
//   squash  compression impulse: positive folds, negative snaps upright
//   shove   how much of the impact translates into ground speed
//   flinch  multiplier on the existing suppression timer
const HIT_REGIONS = [
  // Head: the whole body snaps back and up off a head hit — a stretch, not a
  // compression — and the suppression is the strongest of the three.
  { min: 0.80, name: 'head',  rock: 0.30, squash: -7, shove: 1.25, flinch: 1.35 },
  // Torso: folds over the round. The reference reaction; everything else is
  // measured against it.
  { min: 0.45, name: 'torso', rock: 0.19, squash: 5,  shove: 1.0,  flinch: 1.0 },
  // Legs: barely moves the upper body, buckles the stance, and carries the
  // least suppression — a man shot in the leg can still shoot back.
  { min: 0.00, name: 'legs',  rock: 0.07, squash: 10, shove: 0.6,  flinch: 0.7 },
];
const HIT_BOX_H = 134;           // must match the hitbox in Player.fireShot
function hitRegionAt(ent, hy) {
  if (hy === undefined || hy === null) return HIT_REGIONS[1];   // unknown → torso
  const h = HIT_BOX_H * (ent.hitboxScale || 1);
  const up = clamp((ent.y - hy) / h, 0, 1);                     // 0 feet, 1 crown
  for (const r of HIT_REGIONS) if (up >= r.min) return r;
  return HIT_REGIONS[HIT_REGIONS.length - 1];
}

// Radians of muzzle climb a hostile's burst gains per round fired, reset
// between bursts.
//
// This number exists because of a bug it replaces. Hostiles used to fire
// along their *drawn* weapon angle, which carries the recoil animation, so
// every burst walked itself off the player. Measured over live combat that
// landed about 48-56% of their rounds — a difficulty the game was balanced
// around without anyone choosing it. Taking the animation out of the
// ballistics (see fireShot) took them straight to 100%, which is not a
// difficulty setting, it is a death sentence.
//
// So the walk-off is modelled properly instead: the first round of a burst
// is dead on the player's chest and each one after climbs, which is both what
// a real burst does and what makes breaking line of sight for a beat worth
// doing. Higher difficulty tiers hold it down better, bottoming out at half.
//
// 0.135 was picked by measurement, not feel: it puts live hit rate back at
// ~54%, i.e. where the bug had it, so the balance the rest of the game is
// tuned against is preserved. Isolated per range it reads 60% / 33% / 25% at
// 200 / 350 / 500px — point blank is genuinely dangerous and distance is
// genuinely safer, which the flat old number never expressed.
const BURST_CLIMB = 0.135;

// Seconds after a flinch before another bullet can cause one. See
// Enemy.damage — this is what keeps sustained fire suppressive rather than
// paralysing.
const FLINCH_REFRACTORY = 0.85;

export class Enemy {
  constructor(parts, shadow, rifle, world, fx, audio, x, patrolMin, patrolMax) {
    this.parts = parts; this.shadow = shadow;
    this.wpn = rifle; this.ws = newWeaponState();
    this.world = world; this.fx = fx; this.audio = audio;

    this.x = x; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.halfW = 10; this.h = 126;
    this.onGround = false; this.airTime = 0;
    this.facing = rand() > 0.5 ? 1 : -1;
    this.aimLocal = 0; this.aimErr = 0.1;
    this.gaitPhase = rand(0, 6); this.speedNorm = 0;
    this.breathT = rand(0, 9); this.lean = 0;
    this.crouchSpring = 0; this.crouchVel = 0;
    this.hurtT = 0; this.deadT = 0;
    // Own noise function, own seed: two hostiles never stumble on the same
    // stride. Read by the rig as ent.gaitNoise.
    this._gaitNoise = makeNoise1D(GAIT_NOISE_SEED + (gaitSeedCounter += 733));
    this.gaitNoise = 0;
    // Mass, and the mobility it buys. Kept as a multiplier rather than baked
    // into the accelerations so a Boss can raise it in one place.
    this.mass = 1 + randSpread(MASS_SPREAD);
    this.squash = 0; this.squashVel = 0;
    this.squashX = 1; this.squashY = 1;
    this.stumbleLean = 0;
    this._wasAir = false;
    // How much weapon is in the hands, read off the weapon's own geometry.
    // Hostiles used to leave this undefined, which parked every one of them at
    // the rifle's neutral stance whatever they were actually carrying.
    this.weaponBulk = weaponBulkOf(rifle);

    this.hp = 100; this.maxHp = 100;
    this.difficulty = 0;          // set by Game from the current stage
    this.dmgMul = 1;              // damage multiplier (Boss overrides)
    this.hitboxScale = 1;         // player hit-detection box scale (Boss overrides)
    this.state = 'patrol';
    this.patrolMin = patrolMin; this.patrolMax = patrolMax;
    this.waitT = rand(0, 2);
    this.alertT = 0;
    this.flinchT = 0;
    this.flinchCd = 0;   // refractory timer, see damage()
    this.mag = 30;
    this.reload = null;
    this.burstLeft = 0;
    // Muzzle climb accumulated across the current burst, in radians. Hostiles
    // walk their fire off target the same way the player does — see
    // BURST_CLIMB and Enemy.fireShot.
    this.burstClimb = 0;
    this.burstGap = rand(0.6, 1.4);
    this.shotCd = 0;
    this.engagedT = 0;

    // awareness
    this.awareness = 0;           // 0..1, backs the HUD detection meter
    this.suspiciousT = 0;
    this.searchT = 0;
    this.lastKnownX = null; this.lastKnownY = null;
    this.hasAlerted = false;

    // combat behaviour
    this.strafeDir = rand() > 0.5 ? 1 : -1;
    this.strafeT = rand(0.7, 1.8);
    this.coverTarget = null;
    this.coverCooldown = rand(0, 1.5);
    this.retreatT = 0;
    this.meleeT = rand(0.4, 1.2);
  }

  // `hy` is the world y the round actually landed at. Optional, because not
  // every damage source has one (an explosion has no entry point) — those
  // fall through to a torso reaction, which is what they used to get.
  damage(dmg, dirX, player, melee = false, hy = null) {
    if (this.deadT > 0) return;
    this.hp -= dmg;
    this.hurtT = 0.35;
    const region = melee ? HIT_REGIONS[1] : hitRegionAt(this, hy);
    // Which way the body is rocked. dirX is the direction the round was
    // travelling, so dirX * facing is +1 when it came from behind and -1 when
    // it came from the front — pitching him forward or rocking him back
    // exactly as the geometry demands, with no special case for either.
    const fromBehind = dirX * this.facing;
    this.stumbleLean = clamp(
      this.stumbleLean + fromBehind * region.rock * clamp(dmg / 22, 0.45, 1.6),
      -0.42, 0.42);
    this.addSquash(region.squash * clamp(dmg / 22, 0.4, 1.5));
    // Flinch is rate-limited, because a hostile that flinches on every single
    // round is not suppressed, it is disabled. The fire gate below requires
    // `flinchT <= 0`, and a rifle lands a round every ~0.09s — so once the
    // player's shots actually started connecting (see the ballistics fix in
    // fireShot), a single operator could hold a hostile in an unbroken 0.3s
    // flinch forever and it would never fire back once. That is not a
    // difficulty setting either; it just deletes the firefight.
    //
    // A hit inside the refractory window still hurts, still staggers the
    // sprite via hurtT, and still knocks the hostile back. It just cannot
    // restart the flinch, which leaves a real window to shoot back in.
    // Melee is exempt: a knife is a deliberate close-range commitment and
    // stunning with it is the point.
    if (melee || this.flinchCd <= 0) {
      this.flinchT = (melee ? 0.55 : 0.3) * region.flinch;
      this.flinchCd = melee ? 0.3 : FLINCH_REFRACTORY;
    }
    // Knockback is divided by mass like every other force on this body, so a
    // heavy hostile is shifted less by the same round.
    this.vx += dirX * (melee ? 210 : 60) * region.shove / this.mass;
    this.audio.hitFlesh();
    // getting shot reveals the shooter immediately, wherever it came from
    if (this.state === 'patrol' || this.state === 'suspicious') {
      this.state = 'alert'; this.alertT = 0; this.awareness = 1;
      this.facing = -dirX || this.facing;
      if (player) { this.lastKnownX = player.x; this.lastKnownY = player.y; }
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.deadT = 0.001;
      this.fx.blood(this.x, this.y - 80, dirX);
      this.world.bloodDecal(this.x + dirX * 8, 0 + this.yGround(), 14);
      // dropped rifle
      this.fx.magDrop(this.x + dirX * 4, this.y - 60, -dirX);
      if (player) player.kills++;
    }
  }

  yGround() { return this.y; }

  // ---------------------------------------------------------- awareness

  // Vision cone (narrow, long) + peripheral vision (wide, short) + point
  // blank + line-of-sight, plus hearing for gunfire and nearby sprinting.
  perceive(player) {
    if (!player || player.deadT > 0) return { visible: false, heard: false, dist: 99999 };
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const eyeX = this.x, eyeY = this.y - 112;
    const toPlayer = Math.atan2((player.y - 95) - eyeY, dx);
    const facingAng = this.facing === 1 ? 0 : Math.PI;
    const off = Math.abs(angleDiff(facingAng, toPlayer));

    // a crouched operator presents a lower profile — spotted later and closer
    const crouch = player.crouchHold || 0;
    const visionRange = (640 + this.difficulty * 20) * (1 - crouch * 0.32);
    const visionHalf = 0.5;
    const periRange = 260 * (1 - crouch * 0.42);
    const periHalf = 2.4;
    const closeRange = 130 - crouch * 30;

    let visible = false;
    if (dist < closeRange || (dist < visionRange && off < visionHalf) || (dist < periRange && off < periHalf)) {
      visible = this.world.hasLineOfSight(eyeX, eyeY, player.x, player.y - 95);
    }
    const heardShot = player.time - player.lastShotT < 1.4 && dist < 560 + this.difficulty * 40;
    const heardMove = player.sprinting && dist < 280;
    return { visible, heard: heardShot || heardMove, dist };
  }

  // Tell nearby idle allies where to look — simulates radio chatter / shouts.
  alertAllies(game) {
    if (!game || !game.enemies) return;
    const radius = 260 + this.difficulty * 30;
    for (const o of game.enemies) {
      if (o === this || o.deadT > 0) continue;
      if (Math.abs(o.x - this.x) < radius && (o.state === 'patrol' || o.state === 'suspicious')) {
        o.awareness = Math.max(o.awareness, 0.5);
        o.state = 'search';
        o.searchT = 0;
        o.lastKnownX = this.lastKnownX;
        o.lastKnownY = this.lastKnownY;
        o.facing = Math.sign(this.x - o.x) || o.facing;
      }
    }
  }

  // Silent knife takedown from behind: drops instantly, no muzzle noise, and
  // flags the death as silent so only squadmates with a line of sight react.
  stealthKill(player) {
    if (this.deadT > 0) return;
    this.hp = 0;
    this.deadT = 0.001;
    this.silentKill = true;
    this.flinchT = 0.25;
    this.vx += this.facing * 40;
    this.fx.blood(this.x, this.y - 84, -this.facing);
    this.world.bloodDecal(this.x, 0 + this.yGround(), 16);
    this.fx.magDrop(this.x + this.facing * 4, this.y - 60, -this.facing);
    if (player) player.kills++;
  }

  // On death, pull nearby idle/searching squadmates toward the body. A loud
  // death carries to a radius; a silent takedown is only noticed by allies
  // who can actually see the corpse — the core of the stealth loop.
  broadcastDeath(game) {
    if (!game || !game.enemies) return;
    const radius = this.silentKill ? 0 : 300 + this.difficulty * 30;
    for (const o of game.enemies) {
      if (o === this || o.deadT > 0) continue;
      if (o.state === 'combat' || o.state === 'alert' || o.state === 'retreat') continue;
      const dist = Math.abs(o.x - this.x);
      const sees = dist < 640 && this.world.hasLineOfSight(o.x, o.y - 112, this.x, this.y - 60);
      if (sees || dist < radius) {
        o.awareness = Math.max(o.awareness, 0.55);
        o.state = 'search'; o.searchT = 0;
        o.lastKnownX = this.x; o.lastKnownY = this.y;
        o.facing = Math.sign(this.x - o.x) || o.facing;
      }
    }
  }

  meleeShove(player) {
    const dmg = (9 + this.difficulty * 1.4) * this.dmgMul;
    player.hurt(dmg, this.facing, this.x);
    player.vx += this.facing * 260;
    this.vx -= this.facing * 90;
    this.audio.hitFlesh();
    this.fx.addLight(this.x + this.facing * 14, this.y - 90, 60, [255, 130, 90], 0.5, 0.08);
    this.fx.slash(this.x, this.y - 92, -0.6, 0.6, 40, this.facing);
    this.meleeT = Math.max(0.7, 1.7 - this.difficulty * 0.08);
  }

  // Nearest cover point that (a) isn't the one we're already using and
  // (b) actually breaks line of sight to the player once we're standing
  // there — real occlusion, not just "near a box".
  pickCoverSpot(player) {
    let best = null, bestD = Infinity;
    for (const c of this.world.coverSpots) {
      const d = Math.abs(c.x - this.x);
      if (d < 12 || d > 620) continue;
      const blocked = !this.world.hasLineOfSight(c.x, this.y - 112, player.x, player.y - 95);
      if (!blocked) continue;
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  }

  // Accelerate toward a target ground speed under real, asymmetric
  // acceleration: starting, easing off, planting and reversing each get their
  // own rate (see ENEMY_MOVE). `urgency` carries the intent the old damp rates
  // encoded — a hostile breaking for cover plants harder than one ambling a
  // patrol route — and mass scales all of it, so a heavy hostile is heavy in
  // every direction rather than only in its top speed.
  //
  // Unlike the exponential approach this replaces, this one arrives: the step
  // is clamped to the remaining difference, so "stop" means stopped rather
  // than asymptotically-nearly-stopped.
  driveTo(target, dt, urgency = 1) {
    const v = this.vx;
    const dv = target - v;
    if (dv === 0) return;
    let a;
    if (Math.abs(target) < 1) a = ENEMY_MOVE.decel;                     // halting
    else if (v * target < 0 && Math.abs(v) > ENEMY_MOVE.turnEps) a = ENEMY_MOVE.turn;  // reversing
    else if (Math.abs(target) < Math.abs(v)) a = ENEMY_MOVE.decel;      // easing off
    else a = ENEMY_MOVE.accel;                                           // pressing on
    const step = (a * urgency / this.mass) * dt;
    this.vx = Math.abs(dv) <= step ? target : v + Math.sign(dv) * step;
  }

  // Squash impulse. Positive compresses, negative stretches; the spring in
  // update() does the rest. Shared by landings and shoves, so both read as the
  // same body answering two different forces.
  addSquash(k) { this.squashVel += k; }

  update(dt, player, game) {
    if (this.deadT > 0) {
      // the moment we go down, alert squadmates who can see (or, for a loud
      // death, hear) it — a body is a strong "investigate here" signal
      if (!this._deathSeen) { this._deathSeen = true; this.broadcastDeath(game); }
      this.deadT += dt;
      // A body sliding to a halt is friction, not locomotion — driveTo would
      // plant it back on its feet.
      this.vx = damp(this.vx, 0, 8, dt);
      this.world.moveEntity(this, dt);
      this.hurtT = Math.max(0, this.hurtT - dt);
      return;
    }

    this.breathT += dt;
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.flinchT = Math.max(0, this.flinchT - dt);
    this.flinchCd = Math.max(0, this.flinchCd - dt);
    this.shotCd -= dt;
    this.meleeT -= dt;
    this.coverCooldown -= dt;

    // weapon recoil springs
    const ws = this.ws;
    ws.recoilVel += -ws.recoil * 240 * dt;
    ws.recoilVel *= Math.exp(-14 * dt);
    ws.recoil = Math.max(0, ws.recoil + ws.recoilVel * dt * 44);
    ws.recoilRotVel += -ws.recoilRot * 260 * dt;
    ws.recoilRotVel *= Math.exp(-13 * dt);
    ws.recoilRot += ws.recoilRotVel * dt * 40;
    ws.flashT = Math.max(0, ws.flashT - dt * 14);
    ws.boltBack = Math.max(0, ws.boltBack - dt * 9);

    let rot = Math.sin(this.breathT * 1.6) * 0.016;
    let offY = Math.sin(this.breathT * 1.6 + 1) * 0.4 + Math.abs(Math.sin(this.gaitPhase)) * 1.4 * this.speedNorm;

    const per = this.perceive(player);
    this.updateAwareness(dt, per, player);

    // ---------- state machine
    if (this.state === 'patrol') {
      this.aimLocal = damp(this.aimLocal, 0.28, 4, dt);   // muzzle low
      rot += 0.35;
      this.lookT = (this.lookT || 0) - dt;
      if (this.waitT > 0) {
        this.waitT -= dt;
        this.driveTo(0, dt, 1.67);
        // glance around while halted — natural area scan, not a dead stare
        if (this.lookT <= 0) { this.lookT = rand(0.7, 1.5); if (rand() < 0.55) this.facing *= -1; }
      } else {
        this.driveTo(this.facing * WALK, dt);
        // occasionally reverse early or pause mid-route so patrols vary
        if (this.lookT <= 0) {
          this.lookT = rand(2.6, 5.2);
          if (rand() < 0.3) { this.facing *= -1; this.waitT = rand(0.5, 1.4); }
          else if (rand() < 0.3) { this.waitT = rand(0.6, 1.6); }
        }
        if (this.x > this.patrolMax) { this.facing = -1; this.waitT = rand(0.8, 2.2); }
        if (this.x < this.patrolMin) { this.facing = 1; this.waitT = rand(0.8, 2.2); }
      }
      if (per.visible || per.heard) { this.state = 'suspicious'; this.suspiciousT = 0; }
    } else if (this.state === 'suspicious') {
      this.suspiciousT += dt;
      this.driveTo(0, dt, 1.33);
      if (player && player.deadT <= 0) this.facing = Math.sign(player.x - this.x) || this.facing;
      rot += 0.15;
      const thresh = Math.max(0.2, 0.55 - this.difficulty * 0.04);
      if (per.visible && this.suspiciousT > thresh) {
        this.state = 'alert'; this.alertT = 0;
        this.lastKnownX = player.x; this.lastKnownY = player.y;
      } else if (per.heard && !per.visible && this.suspiciousT > thresh * 1.5) {
        this.state = 'search'; this.searchT = 0;
        this.lastKnownX = player.x; this.lastKnownY = player.y;
      } else if (!per.visible && !per.heard && this.suspiciousT > 2.2) {
        this.state = 'patrol'; this.waitT = rand(0.4, 1);
      }
    } else if (this.state === 'search') {
      this.searchT += dt;
      const tx = this.lastKnownX ?? this.x;
      const dx = tx - this.x;
      if (Math.abs(dx) > 24) {
        this.facing = Math.sign(dx) || this.facing;
        this.driveTo(this.facing * WALK * 1.35, dt);
      } else {
        this.driveTo(0, dt, 1.33);
        this.facing = Math.sin(this.searchT * 1.4) > 0 ? 1 : -1;   // scan left/right
      }
      rot += 0.2;
      if (per.visible) {
        this.state = 'alert'; this.alertT = 0;
        this.lastKnownX = player.x; this.lastKnownY = player.y;
      } else if (per.heard) {
        this.searchT = Math.min(this.searchT, 1);
        this.lastKnownX = player.x; this.lastKnownY = player.y;
      }
      const giveUp = Math.max(3, 6.5 - this.difficulty * 0.3);
      if (this.searchT > giveUp) { this.state = 'patrol'; this.waitT = rand(0.5, 1.5); this.awareness = 0.1; }
    } else if (this.state === 'alert') {
      // snap toward the threat, brief shoulder-up delay before opening fire
      this.alertT += dt;
      this.driveTo(0, dt, 1.67);
      if (player && player.deadT <= 0) this.facing = Math.sign(player.x - this.x) || this.facing;
      this.aimLocal = damp(this.aimLocal, 0, 8, dt);
      const reactT = Math.max(0.1, 0.32 - this.difficulty * 0.018);
      if (this.alertT > reactT) {
        this.state = 'combat'; this.aimErr = 0.12; this.engagedT = 0;
        if (!this.hasAlerted) { this.hasAlerted = true; this.alertAllies(game); }
      }
    } else if (this.state === 'retreat') {
      this.retreatT += dt;
      if (!player || player.deadT > 0) { this.state = 'patrol'; this.waitT = 1; }
      else {
        const dx = player.x - this.x;
        const dist = Math.abs(dx);
        this.facing = Math.sign(dx) || this.facing;
        const away = -Math.sign(dx) || -this.facing;
        this.driveTo(away * CHASE * 1.05, dt, 0.83);
        this.aimErr = damp(this.aimErr, 0.05, 0.5, dt);
        const ty = (player.y - 92) - (this.y - 97);
        this.aimLocal = damp(this.aimLocal, clamp(Math.atan2(ty, Math.abs(dx)), -1, 1), 7, dt);
        if (this.reload) {
          this.updateReload(dt, ws);
        } else if (this.mag <= 0) {
          this.reload = { t: 0, T: 2.5, s0: false, s1: false, s2: false, dropped: false };
        } else {
          this.burstGap -= dt;
          if (this.burstGap <= 0 && dist < 620 && per.visible) {
            this.burstLeft = 1 + ((rand() * 2) | 0);
            this.burstClimb = 0;
            this.burstGap = rand(1.1, 2.1);
          }
          if (this.burstLeft > 0 && this.shotCd <= 0) this.fireShot(player);
        }
        if (this.retreatT > 2.2 && this.hp > this.maxHp * 0.5) { this.state = 'combat'; this.engagedT = 0; }
        else if (this.retreatT > 4.5) { this.state = 'combat'; this.engagedT = 0; }
      }
    } else if (this.state === 'combat') {
      if (!player || player.deadT > 0) {
        this.state = 'patrol'; this.waitT = 1;
        this.coverTarget = null;
      } else {
        this.engagedT += dt;
        const dx = player.x - this.x;
        const dist = Math.abs(dx);
        this.facing = Math.sign(dx) || this.facing;

        // retreat trigger when badly hurt (probabilistic so squads don't all flee at once)
        // — a boss stands its ground no matter how hurt
        if (!this.isBoss && this.hp < this.maxHp * 0.28 && rand() < dt * 0.7) {
          this.state = 'retreat'; this.retreatT = 0; this.coverTarget = null;
        } else {
          // point-blank shove
          if (dist < 46 && this.meleeT <= 0 && per.visible) this.meleeShove(player);

          // cover-seeking: more likely with difficulty, mainly while reloading
          const coverChance = 0.15 + this.difficulty * 0.06;
          if (!this.coverTarget && this.coverCooldown <= 0 && this.world.coverSpots.length &&
              (this.reload || rand() < coverChance * dt)) {
            const spot = this.pickCoverSpot(player);
            if (spot) { this.coverTarget = spot; }
            this.coverCooldown = rand(3, 6);
          }

          if (this.coverTarget) {
            const cdx = this.coverTarget.x - this.x;
            if (Math.abs(cdx) < 16) {
              this.coverTarget = null;   // arrived — hold here a moment
              this.driveTo(0, dt, 1.33);
            } else {
              this.driveTo(Math.sign(cdx) * CHASE, dt, 0.83);
            }
          } else {
            // hold useful range, strafing laterally instead of freezing
            this.strafeT -= dt;
            if (this.strafeT <= 0) { this.strafeDir *= -1; this.strafeT = rand(0.6, 1.6); }
            let move = this.strafeDir * 0.5;
            if (dist > 470) move = this.facing;
            else if (dist < 130) move = -this.facing;
            this.driveTo(move * CHASE, dt, 0.83);
          }

          // aim at the player's chest with settling error (tighter at higher difficulty)
          const aimErrTarget = Math.max(0.009, 0.03 - this.difficulty * 0.0022);
          this.aimErr = damp(this.aimErr, aimErrTarget, 0.5, dt);
          const ty = (player.y - 92) - (this.y - 97);
          const targetAim = Math.atan2(ty, Math.abs(dx));
          this.aimLocal = damp(this.aimLocal, clamp(targetAim, -1, 1), 9, dt);
          this.lastKnownX = player.x; this.lastKnownY = player.y;

          // lost sight → go hunt at last position for a while
          const loseSightGrace = Math.max(0.9, 1.6 - this.difficulty * 0.1);
          if (!per.visible && this.engagedT > loseSightGrace) {
            this.state = 'search'; this.searchT = 0; this.coverTarget = null;
          }

          // ---------- fire control
          if (this.reload) {
            this.updateReload(dt, ws);
          } else if (this.mag <= 0) {
            this.reload = { t: 0, T: 2.5, s0: false, s1: false, s2: false, dropped: false };
          } else if (this.flinchT <= 0 && this.engagedT > 0.18) {
            if (this.burstLeft > 0) {
              if (this.shotCd <= 0) this.fireShot(player);
            } else {
              this.burstGap -= dt;
              if (this.burstGap <= 0 && dist < 620 && per.visible) {
                this.burstLeft = 3 + (rand() * 3 | 0) + Math.floor(this.difficulty * 0.4);
                this.burstClimb = 0;
                this.burstGap = Math.max(0.3, rand(0.75, 1.5) - this.difficulty * 0.04);
              }
            }
          }
        }
      }
    }

    if (this.reload) { this.updateReload(dt, ws); rot += 0.3; }
    if (this.flinchT > 0) { rot += this.flinchT * 0.8; offY += this.flinchT * 3; }

    // physics + gait
    const landed = this.world.moveEntity(this, dt);
    if (landed > 300) { this.crouchVel += landed / 1000; this.fx.landDust(this.x, this.y, false); }
    // Landing compression, on the same spring the shove impulses use. Scaled
    // by mass, so a heavy hostile hits the ground harder than a light one off
    // the same ledge.
    if (landed > E_LAND_SPEED) {
      this.addSquash(clamp((landed - E_LAND_SPEED) / 2600, 0.02, E_LAND_MAX) * this.mass * 26);
    }
    this.airTime = this.onGround ? 0 : this.airTime + dt;
    const sp = Math.abs(this.vx);
    this.gaitPhase += sp * dt / 23;
    this.speedNorm = sp / 450;
    // Footing wobble, sampled off the stride rather than the clock so it is
    // repeatable frame to frame and never lands on the same step twice.
    this.gaitNoise = this._gaitNoise(this.gaitPhase * 0.37) * this.speedNorm;
    this.lean = damp(this.lean, (this.vx / 450) * 0.14 * this.facing, 6, dt);
    this.crouchVel += -this.crouchSpring * 120 * dt;
    this.crouchVel *= Math.exp(-10 * dt);
    this.crouchSpring = Math.max(0, this.crouchSpring + this.crouchVel * dt * 34);

    // Squash & stretch. One signed value: positive squashes (wide and short),
    // negative stretches. Airborne it is driven straight off vertical speed so
    // a falling hostile elongates; on the ground the spring runs free and
    // settles whatever the last impulse left behind.
    if (!this.onGround) {
      this.squash = damp(this.squash, clamp(-Math.abs(this.vy) / 5200, -0.09, 0), 9, dt);
      this.squashVel *= Math.exp(-6 * dt);
    } else {
      this.squashVel += -this.squash * E_SQUASH_K * dt;
      this.squashVel *= Math.exp(-E_SQUASH_DAMP * dt);
      this.squash = clamp(this.squash + this.squashVel * dt, -E_SQUASH_LIMIT, E_SQUASH_LIMIT);
    }
    this.squashX = 1 + this.squash;
    this.squashY = 1 - this.squash;
    // The stumble transient unwinds on its own — the rig adds it on top of the
    // damped lean precisely so it cannot feed back into the damping and linger.
    this.stumbleLean = damp(this.stumbleLean, 0, 5.5, dt);

    ws.offX = 0; ws.offY = offY; ws.rot = rot;
  }

  // Continuous 0..1 awareness value backs the HUD detection meter and gives
  // states smooth, non-instant transitions instead of binary detection.
  updateAwareness(dt, per, player) {
    if (per.visible) {
      const rate = (per.dist < 200 ? 2.3 : 1.4) + this.difficulty * 0.15;
      this.awareness = Math.min(1, this.awareness + rate * dt);
    } else if (per.heard) {
      this.awareness = Math.min(1, this.awareness + 2.2 * dt);
    } else if (this.state === 'patrol' || this.state === 'suspicious') {
      this.awareness = Math.max(0, this.awareness - (0.3 + this.difficulty * 0.02) * dt);
    } else if (this.state === 'combat' || this.state === 'alert') {
      this.awareness = 1;
    } else {
      this.awareness = Math.max(0, this.awareness - 0.18 * dt);
    }
  }

  updateReload(dt, ws) {
    const r = this.reload;
    if (!r) return;
    r.t += dt;
    const k = clamp(r.t / r.T, 0, 1);
    if (k < 0.3) {
      const e = easeInOutQuad(k / 0.3);
      ws.magOffY = e * 15; ws.magRot = e * 0.45; ws.magHand = k > 0.08;
      if (!r.s0 && k > 0.1) { r.s0 = true; this.audio.reload(0); }
    } else if (k < 0.45) {
      if (!r.dropped) { r.dropped = true; ws.magVisible = false; this.fx.magDrop(this.x + this.facing * 8, this.y - 62, this.facing); }
    } else if (k < 0.66) {
      const e = 1 - easeInOutQuad((k - 0.45) / 0.21);
      ws.magVisible = true; ws.magOffY = e * 15; ws.magRot = e * -0.3; ws.magHand = true;
      if (!r.s1 && k > 0.6) { r.s1 = true; this.audio.reload(1); this.mag = 30; }
    } else {
      ws.magOffY = 0; ws.magRot = 0; ws.magHand = false;
      const bk = clamp((k - 0.7) / 0.3, 0, 1);
      ws.boltBack = Math.sin(bk * Math.PI);
      if (!r.s2 && k > 0.78) { r.s2 = true; this.audio.reload(2); }
    }
    if (k >= 1) this.reload = null;
  }

  fireShot(player) {
    const ws = this.ws;
    this.mag--;
    this.burstLeft--;
    this.shotCd = 60 / 640;

    const pose = computePose(this);
    const wa = weaponAnchor(pose, this.wpn, ws, this.aimLocal);
    const mzl = toWorld(this, weaponPoint(wa, this.wpn.muzzle));
    const ejl = toWorld(this, weaponPoint(wa, this.wpn.eject));
    // Same split the player has (see Player.fire): the drawn weapon carries
    // the recoil spring, the bullet does not. Firing along the animated
    // transform meant a hostile's own muzzle-climb animation walked its burst
    // off the player — inaccuracy that came from the sprite rather than from
    // `aimErr`, which is the knob difficulty is actually supposed to turn.
    const drawAng = this.facing === 1 ? wa.ang : Math.atan2(Math.sin(wa.ang), -Math.cos(wa.ang));
    const ballistic = this.aimLocal - this.burstClimb;
    let ang = this.facing === 1
      ? ballistic
      : Math.atan2(Math.sin(ballistic), -Math.cos(ballistic));
    ang += randSpread(this.aimErr + 0.025);
    // Advance the climb for the next round of this burst. This is what makes
    // a hostile's burst start on target and drift high — the behaviour the
    // old animation-driven angle produced by accident, now a designed number
    // that difficulty can tune instead of a side effect of the sprite.
    this.burstClimb += BURST_CLIMB * Math.max(0.5, 1 - this.difficulty * 0.05);

    const range = 1300;
    const ex = mzl.x + Math.cos(ang) * range;
    const ey = mzl.y + Math.sin(ang) * range;
    const wHit = this.world.raycast(mzl.x, mzl.y, ex, ey);
    let bestT = wHit ? wHit.t : 1;
    let hitPlayer = false;
    if (player.deadT <= 0) {
      const t = segVsBox(mzl.x, mzl.y, ex - mzl.x, ey - mzl.y, player.x - 12, player.y - 130, 24, 130);
      if (t !== null && t < bestT) { bestT = t; hitPlayer = true; }
    }
    const hx = mzl.x + (ex - mzl.x) * bestT;
    const hy = mzl.y + (ey - mzl.y) * bestT;

    if (hitPlayer) {
      player.hurt(((7 + rand(0, 5) | 0) * this.dmgMul) | 0, Math.sign(ex - mzl.x), this.x);
    } else if (wHit) {
      this.fx.impactWall(hx, hy, wHit.nx, wHit.ny, wHit.mat);
    }

    ws.flashT = 1;
    ws.flashIdx = (Math.random() * this.wpn.flashes.length) | 0;
    ws.flashScale = rand(0.8, 1.15);
    ws.recoilVel += this.wpn.recoilKick * 3;
    ws.recoilRotVel -= this.wpn.recoilRot * 24;
    ws.boltBack = 1;
    const distVol = clamp(1 - Math.abs(this.x - player.x) / 900, 0.3, 0.85);
    this.audio.shot('rifle', distVol);
    this.fx.muzzle(mzl.x, mzl.y, drawAng, 0.85);
    this.fx.tracer(mzl.x + Math.cos(ang) * 14, mzl.y + Math.sin(ang) * 14, hx, hy);
    this.fx.casing(ejl.x, ejl.y, this.facing, 4.6);
  }

  draw(g, opts = null) {
    drawSoldier(g, this.parts, this.shadow, this, { wpn: this.wpn, ws: this.ws }, opts);
  }
}

// ---------------------------------------------------------------- Boss
// A heavyweight variant of the same AI above — the patrol/suspicious/
// alert/combat state machine, awareness, cover-seeking and fire control
// are all inherited untouched. A boss just never retreats (see the
// isBoss guard in the combat state), hits harder (dmgMul), reads as
// visibly bigger (visualScale + a matching hitboxScale so it's fairly
// hittable across its larger silhouette — see the hitboxScale reads in
// player.js's hitscanShot/beamShot and fx.js's projectile hit test),
// and periodically ground-slams for a readable AOE "special attack"
// beat. Spawned solo on every 5th stage — see spawnEnemiesForStage()
// in main.js — so the regular squad encounters are untouched.
export const BOSS_NAMES = ['WARLORD KESTREL', 'THE FOREMAN', 'IRON SERGEANT', 'THE COLLECTOR', 'WARDEN VESK', 'BLACKOUT PRIME'];
// Re-exported from the difficulty module so the encounter code and the
// scaling curves cannot disagree about where bosses live.
export const BOSS_STAGE_INTERVAL = BOSS_INTERVAL;

// Which heavy weapon each boss tier carries. A boss never picks up an
// infantry rifle — the oversized silhouette is half of what makes the
// encounter read as a boss fight before the first shot lands. Cycles with the
// tier so repeat bosses at higher stages still change hands.
export const BOSS_WEAPONS = ['minigun', 'rocket', 'lmg', 'minigun', 'rocket', 'railgun'];

export class Boss extends Enemy {
  constructor(parts, shadow, rifle, world, fx, audio, x, patrolMin, patrolMax, stage) {
    super(parts, shadow, rifle, world, fx, audio, x, patrolMin, patrolMax);
    this.isBoss = true;
    const tier = Math.max(0, Math.floor(stage / BOSS_STAGE_INTERVAL) - 1);
    this.name = BOSS_NAMES[tier % BOSS_NAMES.length];
    this.weaponId = BOSS_WEAPONS[tier % BOSS_WEAPONS.length];
    this.visualScale = 1.5;
    this.hitboxScale = 1.32;
    // A boss is 1.5x the size, so it is heavy in every direction: slower to
    // start, slower to plant, and shifted noticeably less by the same round.
    // Readable before it is in range, which is the point of the silhouette.
    this.mass = BOSS_MASS;
    // Boss stats ride the shared endless curves (game/difficulty.js) instead
    // of the old `clamp(stage/3, 3, 10)` and a flat `420 + stage * 55`, both
    // of which stopped meaning anything deep into a run.
    this.dmgMul = bossDmgMul(stage);
    this.difficulty = bossSkill(stage);
    this.maxHp = bossHp(stage);
    this.hp = this.maxHp;
    this.slamCd = rand(3.5, 5);
  }

  update(dt, player, game) {
    super.update(dt, player, game);
    if (this.deadT > 0) return;
    // periodic close-range ground slam: knockback + AOE damage, telegraphed
    // by the light flash so it reads as a distinct "special attack" beat
    // rather than just more gunfire
    this.slamCd -= dt;
    if (this.slamCd <= 0 && player && player.deadT <= 0 &&
        (this.state === 'combat' || this.state === 'alert') && Math.abs(player.x - this.x) < 170) {
      this.slamCd = rand(5.5, 8);
      this.groundSlam(player);
    }
  }

  groundSlam(player) {
    this.fx.addLight(this.x, this.y - 30, 160, [255, 100, 60], 0.65, 0.2);
    this.audio.hitFlesh();
    if (Math.abs(player.x - this.x) < 180) {
      const dir = Math.sign(player.x - this.x) || this.facing;
      player.hurt(16 + this.difficulty, dir, this.x);
      player.vx += dir * 320;
    }
  }

  draw(g, opts = null) {
    g.save();
    g.filter = 'hue-rotate(-16deg) saturate(1.35) brightness(0.94)';
    g.translate(this.x, this.y);
    g.scale(this.visualScale, this.visualScale);
    g.translate(-this.x, -this.y);
    drawSoldier(g, this.parts, this.shadow, this, { wpn: this.wpn, ws: this.ws }, opts);
    g.restore();
  }
}

// Aggregates every living enemy's awareness into the single value + labelled
// state the HUD detection meter renders (hidden/suspicious/searching/
// detected/combat), taking the most alarming state across the squad.
const STATE_RANK = { hidden: 0, suspicious: 1, searching: 2, detected: 3, combat: 4 };
const ENEMY_TO_HUD = { patrol: 'hidden', suspicious: 'suspicious', search: 'searching', alert: 'detected', combat: 'combat', retreat: 'combat' };

export function getGlobalDetection(enemies) {
  let value = 0, state = 'hidden';
  for (const e of enemies) {
    if (e.deadT > 0) continue;
    value = Math.max(value, e.awareness);
    const s = ENEMY_TO_HUD[e.state] || 'hidden';
    if (STATE_RANK[s] > STATE_RANK[state]) state = s;
  }
  return { value, state };
}
