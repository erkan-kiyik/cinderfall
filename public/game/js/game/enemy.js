// Hostile soldier AI: layered awareness (vision cone + peripheral vision +
// hearing) drives patrol → suspicious → search → alert → combat → retreat
// states. In combat, enemies strafe, seek cover, shove the player at point
// blank range, retreat when badly hurt, and call nearby allies in to help —
// all scaled by a per-enemy `difficulty` set from the current stage number.
// Burst fire with settling accuracy, animated reloads, flinch reactions, and
// a scripted collapse on death that leaves the body in the scene.

import { clamp, lerp, damp, rand, randSpread, easeInOutQuad, angleDiff } from '../engine/math.js';
import { newWeaponState, computePose, weaponAnchor, weaponPoint, toWorld, drawSoldier } from './rig.js';
import { segVsBox } from './player.js';

const WALK = 95, CHASE = 210;

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

    this.hp = 100; this.maxHp = 100;
    this.difficulty = 0;          // set by Game from the current stage
    this.state = 'patrol';
    this.patrolMin = patrolMin; this.patrolMax = patrolMax;
    this.waitT = rand(0, 2);
    this.alertT = 0;
    this.flinchT = 0;
    this.mag = 30;
    this.reload = null;
    this.burstLeft = 0;
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

  damage(dmg, dirX, player, melee = false) {
    if (this.deadT > 0) return;
    this.hp -= dmg;
    this.hurtT = 0.35;
    this.flinchT = melee ? 0.55 : 0.3;
    this.vx += dirX * (melee ? 210 : 60);
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
    const dmg = 9 + this.difficulty * 1.4;
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

  update(dt, player, game) {
    if (this.deadT > 0) {
      // the moment we go down, alert squadmates who can see (or, for a loud
      // death, hear) it — a body is a strong "investigate here" signal
      if (!this._deathSeen) { this._deathSeen = true; this.broadcastDeath(game); }
      this.deadT += dt;
      this.vx = damp(this.vx, 0, 8, dt);
      this.world.moveEntity(this, dt);
      this.hurtT = Math.max(0, this.hurtT - dt);
      return;
    }

    this.breathT += dt;
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.flinchT = Math.max(0, this.flinchT - dt);
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
        this.vx = damp(this.vx, 0, 10, dt);
        // glance around while halted — natural area scan, not a dead stare
        if (this.lookT <= 0) { this.lookT = rand(0.7, 1.5); if (rand() < 0.55) this.facing *= -1; }
      } else {
        this.vx = damp(this.vx, this.facing * WALK, 6, dt);
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
      this.vx = damp(this.vx, 0, 8, dt);
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
        this.vx = damp(this.vx, this.facing * WALK * 1.35, 6, dt);
      } else {
        this.vx = damp(this.vx, 0, 8, dt);
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
      this.vx = damp(this.vx, 0, 10, dt);
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
        this.vx = damp(this.vx, away * CHASE * 1.05, 5, dt);
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
        if (this.hp < this.maxHp * 0.28 && rand() < dt * 0.7) {
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
              this.vx = damp(this.vx, 0, 8, dt);
            } else {
              this.vx = damp(this.vx, Math.sign(cdx) * CHASE, 5, dt);
            }
          } else {
            // hold useful range, strafing laterally instead of freezing
            this.strafeT -= dt;
            if (this.strafeT <= 0) { this.strafeDir *= -1; this.strafeT = rand(0.6, 1.6); }
            let move = this.strafeDir * 0.5;
            if (dist > 470) move = this.facing;
            else if (dist < 130) move = -this.facing;
            this.vx = damp(this.vx, move * CHASE, 5, dt);
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
    this.airTime = this.onGround ? 0 : this.airTime + dt;
    const sp = Math.abs(this.vx);
    this.gaitPhase += sp * dt / 23;
    this.speedNorm = sp / 450;
    this.lean = damp(this.lean, (this.vx / 450) * 0.14 * this.facing, 6, dt);
    this.crouchVel += -this.crouchSpring * 120 * dt;
    this.crouchVel *= Math.exp(-10 * dt);
    this.crouchSpring = Math.max(0, this.crouchSpring + this.crouchVel * dt * 34);

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
    let ang = this.facing === 1 ? wa.ang : Math.atan2(Math.sin(wa.ang), -Math.cos(wa.ang));
    ang += randSpread(this.aimErr + 0.025);

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
      player.hurt(7 + rand(0, 5) | 0, Math.sign(ex - mzl.x), this.x);
    } else if (wHit) {
      this.fx.impactWall(hx, hy, wHit.nx, wHit.ny);
    }

    ws.flashT = 1;
    ws.flashIdx = (Math.random() * this.wpn.flashes.length) | 0;
    ws.flashScale = rand(0.8, 1.15);
    ws.recoilVel += this.wpn.recoilKick * 3;
    ws.recoilRotVel -= this.wpn.recoilRot * 24;
    ws.boltBack = 1;
    const distVol = clamp(1 - Math.abs(this.x - player.x) / 900, 0.3, 0.85);
    this.audio.shot('rifle', distVol);
    this.fx.muzzle(mzl.x, mzl.y, ang, 0.85);
    this.fx.tracer(mzl.x + Math.cos(ang) * 14, mzl.y + Math.sin(ang) * 14, hx, hy);
    this.fx.casing(ejl.x, ejl.y, this.facing, 4.6);
  }

  draw(g) {
    drawSoldier(g, this.parts, this.shadow, this, { wpn: this.wpn, ws: this.ws });
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
