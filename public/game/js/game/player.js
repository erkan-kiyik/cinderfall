// Player: movement + full weapon handling. Every weapon state from the spec
// is here — idle sway, walk/run/sprint blending, jump/land settle, fire with
// recoil springs and shell ejection, tactical + empty reloads with animated
// magazine and bolt rack, inspect, equip/unequip, and the knife's quick /
// heavy slashes. All transitions are spring- or envelope-blended.

import {
  clamp, lerp, damp, rand, randSpread, easeOutCubic, easeInOutQuad, TAU,
} from '../engine/math.js';
import { newWeaponState, computePose, weaponAnchor, weaponPoint, toWorld } from './rig.js';
import { drawSoldier } from './rig.js';

// Movement feel: snappier ground acceleration and blends for more responsive
// controls, without changing top speeds (preserves the existing game balance).
const RUN = 300, SPRINT = 450, ACCEL = 2800, JUMP = -900;
const STEALTH_RANGE = 56;      // reach for a takedown from directly behind

export class Player {
  constructor(parts, shadow, weapons, world, fx, cam, audio, hud) {
    this.parts = parts; this.shadow = shadow;
    this.world = world; this.fx = fx; this.cam = cam;
    this.audio = audio; this.hud = hud;

    this.x = 260; this.y = 0; // y set by spawn
    this.vx = 0; this.vy = 0;
    this.halfW = 10; this.h = 126;
    this.onGround = false; this.airTime = 0;
    this.facing = 1;
    this.aimLocal = 0; this.aimSmooth = 0; this.aimWorld = 0;
    this.gaitPhase = 0; this.speedNorm = 0;
    this.breathT = rand(0, 9); this.lean = 0;
    this.crouchSpring = 0; this.crouchVel = 0;
    this.crouchHold = 0;          // 0..1 held-crouch blend (feeds the rig pose)
    this.crouched = false;
    this.stealth = null;          // active takedown timeline
    this.stealthTarget = null;    // hostile that can currently be taken down
    this.hurtT = 0; this.deadT = 0;

    this.hp = 100; this.maxHp = 100;
    this.armor = 0; this.maxArmor = 0;
    this.stamina = 100; this.sprinting = false; this.sprintBlend = 0;
    this.kills = 0; this.headshots = 0; this.shots = 0; this.hits = 0;
    this.lastHurtT = -99; this.lastShotT = -99;
    this.stunT = 0;
    this.time = 0;

    this.weapons = weapons;   // base defs, for finish/unlock lookups
    this.arsenal = {
      rifle: { wpn: weapons.rifle, ws: newWeaponState(), mag: weapons.rifle.magSize, reserve: weapons.rifle.reserve },
      pistol: { wpn: weapons.pistol, ws: newWeaponState(), mag: weapons.pistol.magSize, reserve: weapons.pistol.reserve },
      knife: { wpn: weapons.knife, ws: newWeaponState() },
      smg: { wpn: weapons.smg, ws: newWeaponState(), mag: weapons.smg.magSize, reserve: weapons.smg.reserve },
    };
    this.smgUnlocked = false;
    this.current = 'rifle';
    this.pendingSwitch = null;

    this.fireCd = 0;
    this.recoilAccum = 0;
    this.reload = null;       // {t,T,empty,fired:{s0,s1,s2},dropped}
    this.inspectT = -1;
    this.equipT = 0.01;       // start with a raise
    this.unequipT = -1;
    this.slash = null;        // {t,T,heavy,hitDone}
    this.footPrev = 0;
    this.visSpread = 0;
  }

  get cur() { return this.arsenal[this.current]; }

  // ---------------------------------------------------------------- update

  update(dt, ctx) {
    this.time += dt;
    const { input, enemies, game } = ctx;

    if (this.deadT > 0) {
      this.deadT += dt;
      this.world.moveEntity(this, dt);
      this.vx = damp(this.vx, 0, 8, dt);
      this.integrateSprings(dt);
      return;
    }

    // ---- stealth takedown: a scripted assassination locks control until done
    if (this.stealth) { this.updateStealth(dt, ctx); return; }

    // ---- aim & facing
    const vw = ctx.vw, vh = ctx.vh;
    const m = this.cam.screenToWorld(input.mouse.x, input.mouse.y, vw, vh);
    const ox = this.x, oy = this.y - 95;
    this.aimWorld = Math.atan2(m.y - oy, m.x - ox);
    const strike = this.slash && this.slash.t / this.slash.T > 0.25;
    if (!strike) this.facing = m.x >= this.x ? 1 : -1;
    const raw = this.facing === 1
      ? this.aimWorld
      : Math.atan2(Math.sin(this.aimWorld), -Math.cos(this.aimWorld));
    this.aimLocal = clamp(raw, -1.15, 1.2);
    this.aimSmooth = damp(this.aimSmooth, this.aimLocal, 15, dt);

    // ---- crouch: hold to lower stance (slower, steadier, harder to spot).
    // Smoothly blended so the pose eases down/up rather than snapping.
    const wantCrouch = input.crouch && this.onGround && this.stunT <= 0 && !this.reload;
    this.crouchHold = damp(this.crouchHold, wantCrouch ? 1 : 0, 12, dt);
    this.crouched = this.crouchHold > 0.5;

    // ---- movement
    this.stunT = Math.max(0, this.stunT - dt);
    const stunMul = this.stunT > 0 ? 0.3 : 1;
    const mx = input.moveX;
    const wantSprint = input.sprint && mx !== 0 && this.stamina > 1 && !this.reload && this.stunT <= 0 && !wantCrouch;
    this.sprinting = wantSprint;
    this.sprintBlend = damp(this.sprintBlend, wantSprint ? 1 : 0, 9, dt);
    const crouchMul = lerp(1, 0.5, this.crouchHold);
    const top = lerp(RUN, SPRINT, this.sprintBlend) * stunMul * crouchMul;
    const target = mx * top;
    const rate = (this.onGround ? ACCEL : ACCEL * 0.45) * stunMul;
    this.vx = this.vx > target
      ? Math.max(target, this.vx - rate * dt)
      : Math.min(target, this.vx + rate * dt);

    if (input.jump && this.onGround) {
      this.vy = JUMP;
      this.onGround = false;
      this.fx.landDust(this.x, this.y, false);
      this.cam.landBounce(-1.4);
    }

    const landed = this.world.moveEntity(this, dt);
    if (landed > 200) {
      this.crouchVel += landed / 950;
      this.fx.landDust(this.x, this.y, landed > 750);
      this.cam.landBounce(clamp(landed * 0.004, 0.8, 4.2));
      if (landed > 1000) this.hurt(Math.floor((landed - 1000) / 40), 0);
    }
    this.airTime = this.onGround ? 0 : this.airTime + dt;

    // gait, lean, breathing
    const sp = Math.abs(this.vx);
    this.gaitPhase += sp * dt / 23;
    this.speedNorm = sp / SPRINT;
    this.lean = damp(this.lean, (this.vx / SPRINT) * 0.15 * this.facing, 6, dt);
    this.breathT += dt;

    // footsteps
    if (this.onGround && sp > 50) {
      const s = Math.sin(this.gaitPhase);
      if (s > 0 !== this.footPrev > 0) this.fx.footstep(this.x, this.y, Math.sign(this.vx), this.speedNorm);
      this.footPrev = s;
    }

    // stamina + slow out-of-combat regen
    if (this.sprinting) this.stamina = Math.max(0, this.stamina - 24 * dt);
    else this.stamina = Math.min(100, this.stamina + 16 * dt);
    if (this.time - this.lastHurtT > 6 && this.hp > 0) {
      this.hp = Math.min(this.maxHp, this.hp + 3.5 * dt);
    }
    this.hurtT = Math.max(0, this.hurtT - dt);

    // environmental hazards: open flame / sparking cable emitters burn on contact
    this.hazardT = (this.hazardT || 0) - dt;
    for (const em of this.world.emitters) {
      if (em.kind !== 'fire' && em.kind !== 'sparks') continue;
      const d = Math.hypot(this.x - em.x, (this.y - 70) - em.y);
      if (d < 34 && this.hazardT <= 0) {
        this.hazardT = 0.5;
        this.hurt(em.kind === 'fire' ? 4 : 8, 0, em.x);
      }
    }

    // loot pickups
    const got = this.world.collectPickup(this.x, this.y);
    if (got) {
      if (got.kind === 'health') this.hp = Math.min(this.maxHp, this.hp + 35);
      else if (got.kind === 'armor') this.armor = Math.min(this.maxArmor, this.armor + 25);
      else {
        for (const slot of ['rifle', 'pistol', 'smg']) {
          const s = this.arsenal[slot];
          if (s) s.reserve = Math.min(s.wpn.reserve, s.reserve + Math.round(s.wpn.reserve * 0.35));
        }
      }
      this.audio.pickup(got.kind);
      this.hud.notify(got.kind === 'health' ? 'MEDKIT RECOVERED' : got.kind === 'armor' ? 'ARMOR PLATE RECOVERED' : 'AMMO RESUPPLIED');
    }

    this.integrateSprings(dt);

    // ---- stealth: is there an unaware hostile we're standing behind? If so
    // and the action button is pressed, start the takedown (skips weapon use).
    this.stealthTarget = this.findStealthTarget(enemies);
    if (this.stealthTarget && input.interact) {
      this.startStealth(this.stealthTarget, game);
      this.stealthTarget = null;
      this.hud.update(this);
      return;
    }

    this.updateWeapon(dt, input, enemies, game);
    this.hud.update(this);
  }

  // ------------------------------------------------------------- stealth

  // A hostile qualifies for a silent takedown when it is unaware, not in a
  // combat state, the operator is directly behind it (on the side its back
  // faces) within reach, and on the same footing. Returns the nearest one.
  findStealthTarget(enemies) {
    if (!enemies || !this.onGround || this.reload || this.slash || this.sprinting) return null;
    let best = null, bestD = Infinity;
    for (const e of enemies) {
      if (!e || e.deadT > 0) continue;
      if (e.awareness > 0.45) continue;
      if (e.state === 'alert' || e.state === 'combat' || e.state === 'retreat') continue;
      const dx = e.x - this.x;
      const dist = Math.abs(dx);
      if (dist > STEALTH_RANGE || dist < 6) continue;
      if (Math.abs(e.y - this.y) > 44) continue;
      // player must be on the side the enemy's back faces (behind it)
      const side = Math.sign(this.x - e.x);      // which side of the enemy we're on
      if (side !== -e.facing) continue;
      // and be facing toward the enemy
      if (this.facing !== Math.sign(dx)) continue;
      if (dist < bestD) { bestD = dist; best = e; }
    }
    return best;
  }

  startStealth(target, game) {
    const side = Math.sign(target.x - this.x) || this.facing;
    this.facing = side;
    this.stealth = { t: 0, T: 0.66, target, game, struck: false, side };
    this.reload = null; this.inspectT = -1; this.slash = null;
    this.sprinting = false; this.sprintBlend = 0;
    this.audio.equip();               // soft blade-ready click
  }

  // Scripted assassination: glide to just behind the target, thrust, drop the
  // hostile silently, then hand control back. Movement/animation flow through
  // the normal rig via a forward lean + knife swipe FX.
  updateStealth(dt, ctx) {
    const s = this.stealth;
    s.t += dt;
    const k = clamp(s.t / s.T, 0, 1);

    // close the last gap to a spot right behind the target during the wind-up
    const goalX = s.target.x - s.side * 24;
    const toGoal = goalX - this.x;
    this.vx = k < 0.55 ? clamp(toGoal * 9, -420, 420) : damp(this.vx, 0, 12, dt);
    this.world.moveEntity(this, dt);

    // pose: crouch into the target and lean hard toward it (reads as a grab)
    this.crouchHold = damp(this.crouchHold, 0.6, 10, dt);
    this.crouched = true;
    this.lean = damp(this.lean, 0.22 * this.facing, 10, dt);
    this.aimLocal = this.aimSmooth = damp(this.aimSmooth, 0.5, 12, dt);
    this.breathT += dt;

    // strike at the midpoint: silent kill + a short blade arc, close blood
    if (!s.struck && k > 0.46) {
      s.struck = true;
      if (s.target.deadT <= 0 && s.target.stealthKill) {
        s.target.stealthKill(this);
        this.audio.stab();
        this.fx.slash(this.x, this.y - 92, -0.4 * this.facing, 0.9 * this.facing, 40, this.facing);
        this.fx.blood(s.target.x - s.side * 5, s.target.y - 92, s.side);
        this.hud.hitmark('kill');
        this.hud.notify('SILENT TAKEDOWN');
        if (s.game && s.game.onStealthKill) s.game.onStealthKill(s.target);
      }
    }

    this.integrateSprings(dt);
    this.hud.update(this);
    if (k >= 1) { this.stealth = null; this.lean = 0; }
  }

  integrateSprings(dt) {
    // landing crouch spring
    this.crouchVel += -this.crouchSpring * 120 * dt;
    this.crouchVel *= Math.exp(-10 * dt);
    this.crouchSpring = Math.max(0, this.crouchSpring + this.crouchVel * dt * 34);
  }

  // ------------------------------------------------------------- weapons

  // Applies an unlocked cosmetic finish (palette swap) to one weapon slot
  // without mutating the shared base weapon def other entities reference.
  applyFinish(slot, finishKey) {
    const base = this.weapons[slot];
    if (!base || !base.finishes || !base.finishes[finishKey]) return;
    const cur = this.arsenal[slot];
    cur.wpn = finishKey === 'default' ? base : { ...base, body: base.finishes[finishKey], finish: finishKey };
  }

  switchTo(slot) {
    if (slot === this.current || this.pendingSwitch) return;
    this.pendingSwitch = slot;
    this.unequipT = 0;
    this.reload = null;
    this.inspectT = -1;
    this.audio.equip();
  }

  updateWeapon(dt, input, enemies, game) {
    const cur = this.cur;
    const { wpn, ws } = cur;

    // slot selection
    if (input.hit('Digit1')) this.switchTo('rifle');
    if (input.hit('Digit2')) this.switchTo('pistol');
    if (input.hit('Digit3')) this.switchTo('knife');
    if (input.hit('Digit4') && this.smgUnlocked) this.switchTo('smg');

    // recoil springs — stiffer restoring force + heavier damping so the
    // weapon snaps back to center quickly and settles smoothly (no bounce)
    ws.recoilVel += -ws.recoil * 340 * dt;
    ws.recoilVel *= Math.exp(-20 * dt);
    ws.recoil = Math.max(0, ws.recoil + ws.recoilVel * dt * 44);
    ws.recoilRotVel += -ws.recoilRot * 360 * dt;
    ws.recoilRotVel *= Math.exp(-19 * dt);
    ws.recoilRot += ws.recoilRotVel * dt * 40;
    ws.flashT = Math.max(0, ws.flashT - dt * 14);
    ws.boltBack = Math.max(0, ws.boltBack - dt * 9);
    ws.slideBack = Math.max(0, ws.slideBack - dt * 10);
    this.fireCd -= dt;
    // aim-drift bloom recovers faster → tighter sustained accuracy
    this.recoilAccum = Math.max(0, this.recoilAccum - dt * 0.17);
    // energy weapons cool between shots; overheat clears once cooled enough
    ws.heat = Math.max(0, ws.heat - dt * (wpn.heatCool || 0.6));
    if (ws.overheated && ws.heat <= 0.2) ws.overheated = false;

    // baseline pose modifiers
    let offX = 0, offY = 0, rot = 0;
    // idle sway + breathing
    rot += Math.sin(this.breathT * 1.7) * 0.014 * (1 - this.speedNorm);
    offY += Math.sin(this.breathT * 1.7 + 1) * 0.4;
    // locomotion bob
    offY += Math.abs(Math.sin(this.gaitPhase)) * 1.5 * this.speedNorm;
    offX += Math.sin(this.gaitPhase * 0.5) * 0.6 * this.speedNorm;
    // airborne raise / falling drop
    if (!this.onGround) {
      rot += clamp(this.vy * 0.00028, -0.16, 0.22);
      offY += clamp(-this.vy * 0.002, -2, 2);
    }
    // landing dip
    offY += this.crouchSpring * 3;
    // sprint carry
    const sb = this.sprintBlend;
    rot += sb * 0.82;
    offX -= sb * 2.4;
    offY += sb * 1.6;
    // weapon aim lag (weapon trails the aim slightly)
    rot += (this.aimSmooth - this.aimLocal) * 0.55;

    // ---- switch timelines
    if (this.pendingSwitch !== null) {
      this.unequipT += dt;
      const T = 0.2;
      const k = clamp(this.unequipT / T, 0, 1);
      rot += k * 1.1; offY += k * 14;
      if (k >= 1) {
        this.current = this.pendingSwitch;
        this.pendingSwitch = null;
        this.equipT = 0;
        this.audio.equip();
      }
      this.applyWs(ws, offX, offY, rot);
      return;
    }
    if (this.equipT >= 0) {
      this.equipT += dt;
      const T = 0.34;
      const k = clamp(this.equipT / T, 0, 1);
      const e = 1 - easeOutCubic(k);
      rot += e * 1.1; offY += e * 15;
      if (k >= 1) this.equipT = -1;
    }

    if (wpn.kind === 'melee') {
      this.updateKnife(dt, input, enemies, ws, rot, offX, offY, game);
      return;
    }

    // ---- inspect
    if (input.hit('KeyF') && !this.reload && this.equipT < 0 && this.onGround && !this.sprinting) {
      this.inspectT = 0;
      this.audio.equip();
    }
    if (this.inspectT >= 0) {
      this.inspectT += dt;
      const T = 2.3, k = this.inspectT / T;
      if (k >= 1 || input.mouse.down || this.sprinting) this.inspectT = -1;
      else {
        const w1 = easeInOutQuad(clamp(k / 0.3, 0, 1));
        const w2 = easeInOutQuad(clamp((k - 0.35) / 0.3, 0, 1));
        const w3 = easeInOutQuad(clamp((k - 0.75) / 0.25, 0, 1));
        rot += -0.72 * w1 + 1.35 * w2 - 0.63 * w3;
        offX += -2.4 * w1 + 2 * w2;
        offY += -2.2 * w1 + 2.2 * w3 - w2;
      }
    }

    // ---- reload
    if (input.hit('KeyR') && !this.reload && cur.mag < wpn.magSize && cur.reserve > 0 && this.equipT < 0) {
      this.startReload(cur);
    }
    if (this.reload) {
      const r = this.reload;
      r.t += dt;
      const k = clamp(r.t / r.T, 0, 1);
      // weapon dips and tilts toward the body
      rot += Math.sin(Math.min(k, 0.92) * Math.PI) * 0.34;
      offY += Math.sin(k * Math.PI) * 2;
      // mag out
      if (k < 0.3) {
        const e = easeInOutQuad(k / 0.3);
        ws.magOffY = e * 15; ws.magRot = e * 0.45;
        ws.magHand = k > 0.08;
        if (!r.s0 && k > 0.1) { r.s0 = true; this.audio.reload(0); }
      } else if (k < 0.45) {
        if (!r.dropped) {
          r.dropped = true;
          ws.magVisible = false;
          const pose = computePose(this);
          const wa = weaponAnchor(pose, wpn, ws, this.aimSmooth);
          const mp = toWorld(this, weaponPoint(wa, wpn.magPos));
          this.fx.magDrop(mp.x, mp.y, this.facing);
        }
        ws.magHand = true;
      } else if (k < 0.66) {
        const e = 1 - easeOutCubic((k - 0.45) / 0.21);
        ws.magVisible = true;
        ws.magOffY = e * 15; ws.magRot = e * -0.3;
        ws.magHand = true;
        if (!r.s1 && k > 0.6) {
          r.s1 = true; this.audio.reload(1);
          const need = wpn.magSize - cur.mag;
          const take = Math.min(need, cur.reserve);
          cur.mag += take; cur.reserve -= take;
        }
      } else {
        ws.magOffY = 0; ws.magRot = 0; ws.magHand = false;
        if (r.empty) {
          const bk = clamp((k - 0.7) / 0.3, 0, 1);
          ws.boltBack = Math.sin(bk * Math.PI);
          if (!r.s2 && k > 0.78) { r.s2 = true; this.audio.reload(2); }
        }
      }
      if (k >= 1) this.reload = null;
    }

    // ---- firing
    const blocked = this.reload || this.equipT >= 0 || this.sprintBlend >= 0.55;
    if (wpn.charge) {
      // charge weapons: hold to build charge, release to fire (bigger = stronger)
      const holding = input.mouse.down && !blocked && !ws.overheated && cur.mag > 0;
      if (holding) {
        if (this.sprinting) this.sprinting = false;
        ws.charging = true;
        ws.charge = Math.min(1, ws.charge + dt / wpn.charge.time);
      } else if (ws.charging) {
        ws.charging = false;
        if (cur.mag > 0 && this.fireCd <= 0 && !blocked && ws.charge > 0.15) {
          const mul = wpn.charge.minMul + (wpn.charge.maxMul - wpn.charge.minMul) * ws.charge;
          this.fire(cur, enemies, game, mul);
        }
        ws.charge = 0;
      } else {
        ws.charge = Math.max(0, ws.charge - dt * 2);
      }
    } else {
      const wantFire = wpn.auto ? input.mouse.down : input.mouse.clicked;
      const canFire = !blocked && this.fireCd <= 0 && !ws.overheated;
      if (wantFire && this.sprinting) this.sprinting = false;
      if (wantFire && canFire) {
        if (cur.mag <= 0) {
          this.audio.dryFire();
          this.fireCd = 0.25;
          if (cur.reserve > 0) this.startReload(cur);
        } else {
          this.fire(cur, enemies, game);
        }
      } else if (wantFire && ws.overheated && this.fireCd <= 0) {
        this.fireCd = 0.2;
        if (this.audio.overheat) this.audio.overheat();
      }
    }
    // surface heat / charge to the HUD
    if (this.hud.setWeaponMeter) this.hud.setWeaponMeter(ws.heat, ws.overheated, ws.charge);

    this.visSpread = wpn.spread + this.speedNorm * 0.045 + (this.onGround ? 0 : 0.05) + this.recoilAccum;
    // crouching braces the weapon — tighter cone as a reward for a slow approach
    this.visSpread *= lerp(1, 0.68, this.crouchHold);
    this.applyWs(ws, offX, offY, rot);
  }

  applyWs(ws, offX, offY, rot) {
    ws.offX = offX; ws.offY = offY; ws.rot = rot + (this.reloadRotHold || 0);
  }

  startReload(cur) {
    const empty = cur.mag <= 0;
    this.reload = { t: 0, T: empty ? cur.wpn.reloadEmptyT : cur.wpn.reloadT, empty, s0: false, s1: false, s2: false, dropped: false };
    this.inspectT = -1;
  }

  // Fires one trigger pull, dispatching by wpn.fireMode. `chargeMul` scales
  // damage / projectile power for charge weapons (default 1).
  fire(cur, enemies, game, chargeMul = 1) {
    const { wpn, ws } = cur;
    cur.mag--;
    this.shots++;
    this.fireCd = 60 / wpn.rpm;
    this.lastShotT = this.time;

    const pose = computePose(this);
    const wa = weaponAnchor(pose, wpn, ws, this.aimSmooth);
    const mzl = toWorld(this, weaponPoint(wa, wpn.muzzle));
    const ejl = toWorld(this, weaponPoint(wa, wpn.eject || wpn.muzzle));
    const baseAng = this.facing === 1 ? wa.ang : Math.atan2(Math.sin(wa.ang), -Math.cos(wa.ang));
    const shotAng = () => baseAng + randSpread(this.visSpread) - this.recoilAccum * 0.32 * this.facing;

    const mode = wpn.fireMode || 'hitscan';
    const n = wpn.pellets || 1;
    if (mode === 'projectile') {
      const pj = wpn.projectile;
      for (let i = 0; i < n; i++) {
        this.fx.spawnProjectile(mzl.x, mzl.y, shotAng(), {
          color: pj.color, radius: pj.radius, speed: pj.speed * (0.85 + 0.4 * chargeMul),
          dmg: wpn.dmg * chargeMul, headMul: pj.headMul || 1.6,
          blast: (pj.blast || 0) * chargeMul, pierce: pj.pierce || 0, life: pj.life || 1.6,
        });
      }
    } else if (mode === 'beam') {
      for (let i = 0; i < n; i++) this.beamShot(mzl, shotAng(), wpn, enemies, game, wpn.dmg * chargeMul);
    } else {
      for (let i = 0; i < n; i++) this.hitscanShot(mzl, shotAng(), wpn, enemies, game, wpn.dmg * chargeMul);
    }

    this.presentShot(cur, mzl, ejl, baseAng, chargeMul);
  }

  hitscanShot(mzl, ang, wpn, enemies, game, dmg) {
    const range = 1600;
    const ex = mzl.x + Math.cos(ang) * range, ey = mzl.y + Math.sin(ang) * range;
    const wHit = this.world.raycast(mzl.x, mzl.y, ex, ey);
    let bestT = wHit ? wHit.t : 1;
    let hitEnemy = null;
    for (const e of enemies) {
      if (e.deadT > 0) continue;
      const t = segVsBox(mzl.x, mzl.y, ex - mzl.x, ey - mzl.y, e.x - 13, e.y - 134, 26, 134);
      if (t !== null && t < bestT) { bestT = t; hitEnemy = e; }
    }
    const hx = mzl.x + (ex - mzl.x) * bestT, hy = mzl.y + (ey - mzl.y) * bestT;
    if (hitEnemy) {
      const headshot = hy < hitEnemy.y - 108;
      const d = dmg * (headshot ? 1.9 : 1);
      this.hits++;
      if (headshot) this.headshots++;
      const killed = hitEnemy.hp <= d;
      hitEnemy.damage(d, Math.sign(ex - mzl.x), this);
      this.fx.blood(hx, hy, Math.sign(ex - mzl.x));
      this.hud.hitmark(killed ? 'kill' : headshot ? 'headshot' : 'hit');
      if (killed) this.hud.notify(headshot ? 'HOSTILE ELIMINATED — HEADSHOT' : 'HOSTILE ELIMINATED');
      if (game && game.onPlayerHit) game.onPlayerHit(headshot, killed);
    } else if (wHit && wHit.tag === 'barrel') {
      game.damageBarrel(wHit.ref, dmg);
      this.fx.impactWall(hx, hy, wHit.nx, wHit.ny);
    } else if (wHit) {
      this.fx.impactWall(hx, hy, wHit.nx, wHit.ny);
    }
    this.fx.tracer(mzl.x + Math.cos(ang) * 14, mzl.y + Math.sin(ang) * 14, hx, hy,
      wpn.tracerColor || null, wpn.tracerWidth || 1.4);
  }

  beamShot(mzl, ang, wpn, enemies, game, dmg) {
    const range = (wpn.beam && wpn.beam.range) || 1600;
    const ex = mzl.x + Math.cos(ang) * range, ey = mzl.y + Math.sin(ang) * range;
    const wHit = this.world.raycast(mzl.x, mzl.y, ex, ey);
    let bestT = wHit ? wHit.t : 1;
    let hitEnemy = null;
    for (const e of enemies) {
      if (e.deadT > 0) continue;
      const t = segVsBox(mzl.x, mzl.y, ex - mzl.x, ey - mzl.y, e.x - 13, e.y - 134, 26, 134);
      if (t !== null && t < bestT) { bestT = t; hitEnemy = e; }
    }
    const hx = mzl.x + (ex - mzl.x) * bestT, hy = mzl.y + (ey - mzl.y) * bestT;
    const col = wpn.beam.color;
    if (hitEnemy) {
      const headshot = hy < hitEnemy.y - 108;
      const d = dmg * (headshot ? 1.7 : 1);
      this.hits++;
      if (headshot) this.headshots++;
      const killed = hitEnemy.hp <= d;
      hitEnemy.damage(d, Math.sign(ex - mzl.x), this);
      this.fx.energyImpact(hx, hy, col, 0);
      this.hud.hitmark(killed ? 'kill' : headshot ? 'headshot' : 'hit');
      if (killed) this.hud.notify(headshot ? 'HOSTILE ELIMINATED — HEADSHOT' : 'HOSTILE ELIMINATED');
      if (game && game.onPlayerHit) game.onPlayerHit(headshot, killed);
    } else if (wHit) {
      if (wHit.tag === 'barrel') game.damageBarrel(wHit.ref, dmg);
      this.fx.energyImpact(hx, hy, col, 0);
    }
    if (wpn.beam.arc) this.fx.arc(mzl.x, mzl.y, hx, hy, col);
    else this.fx.beam(mzl.x, mzl.y, hx, hy, col, wpn.beam.width || 3);
    if (wpn.beam.flame) this.fx.flameSpit(mzl.x, mzl.y, hx, hy, ang);
  }

  presentShot(cur, mzl, ejl, ang, chargeMul) {
    const { wpn, ws } = cur;
    ws.flashT = 1;
    ws.flashIdx = (Math.random() * (wpn.flashes ? wpn.flashes.length : 1)) | 0;
    ws.flashScale = rand(0.85, 1.25) * (0.85 + chargeMul * 0.35);
    // recoil pattern: repeatable per-weapon signature, resets after a pause
    if (this.time - (ws.lastFireT || -99) > 0.28) ws.shotIndex = 0;
    ws.lastFireT = this.time;
    const pat = wpn.recoilPattern;
    const patMul = pat ? pat[ws.shotIndex % pat.length] : 1;
    ws.shotIndex = (ws.shotIndex || 0) + 1;
    ws.recoilVel += wpn.recoilKick * 2.1 * patMul * chargeMul;
    ws.recoilRotVel -= wpn.recoilRot * 18 * patMul * chargeMul;
    if (wpn.bolt) ws.boltBack = 1;
    if (wpn.slide) ws.slideBack = 1;
    this.recoilAccum = Math.min(0.05, this.recoilAccum + 0.008);
    this.cam.recoil(wpn.camKick * chargeMul);
    this.cam.addTrauma(wpn.camTrauma * chargeMul);
    if (wpn.heatPerShot) {
      ws.heat = Math.min(1, ws.heat + wpn.heatPerShot);
      if (ws.heat >= 1) { ws.overheated = true; if (this.audio.overheat) this.audio.overheat(); }
    }
    if (wpn.energy) {
      const c = (wpn.projectile && wpn.projectile.color) || (wpn.beam && wpn.beam.color) || wpn.tracerColor || [120, 200, 255];
      if (this.audio.energyShot) this.audio.energyShot(wpn.shotSound); else this.audio.shot('rifle');
      this.fx.energyMuzzle(mzl.x, mzl.y, ang, c, wpn.muzzleBig || 1);
    } else {
      this.audio.shot(wpn.shotSound);
      this.fx.muzzle(mzl.x, mzl.y, ang, wpn.muzzleBig || 1);
      this.fx.casing(ejl.x, ejl.y, this.facing, wpn.casingSize || 3.6);
    }
  }

  // ------------------------------------------------------------- knife

  updateKnife(dt, input, enemies, ws, rot, offX, offY, game) {
    const wpn = this.cur.wpn;
    // rest pose w/ breathing + sprint pump
    let ang = 0.42 + Math.sin(this.breathT * 1.9) * 0.05;
    let reach = 25 + Math.sin(this.breathT * 1.9 + 1) * 0.8;
    let wrist = 0.34;
    ang += this.sprintBlend * 0.5;
    reach -= this.sprintBlend * 4;
    // gait pump
    ang += Math.sin(this.gaitPhase) * 0.08 * this.speedNorm;

    if (this.equipT >= 0) {
      const e = 1 - easeOutCubic(clamp(this.equipT / 0.34, 0, 1));
      ang += e * 1.4; reach -= e * 8;
    }

    // inspect: turn the blade over
    if (input.hit('KeyF') && !this.slash) { this.inspectT = 0; this.audio.equip(); }
    if (this.inspectT >= 0) {
      this.inspectT += dt;
      const k = this.inspectT / 2;
      if (k >= 1 || input.mouse.clicked) this.inspectT = -1;
      else {
        const w1 = easeInOutQuad(clamp(k / 0.35, 0, 1));
        const w2 = easeInOutQuad(clamp((k - 0.5) / 0.35, 0, 1));
        ang += -0.75 * w1 + 0.75 * w2;
        wrist += 2.6 * w1 - 2.6 * w2;
        reach -= 6 * w1 * (1 - w2);
      }
    }

    this.meleeCd = Math.max(0, (this.meleeCd || 0) - dt);
    if (!this.slash && this.meleeCd <= 0 && (input.mouse.clicked || (input.mouse.rdown && this.stamina > 15))) {
      const heavy = input.mouse.rdown;
      this.slash = { t: 0, T: heavy ? wpn.heavyT : wpn.swingT, heavy, hitDone: false, sounded: false };
      this.inspectT = -1;
      if (heavy) this.stamina = Math.max(0, this.stamina - 18);
      this.meleeCd = heavy ? 0.12 : 0.06;
    }
    if (this.slash) {
      const s = this.slash;
      s.t += dt;
      const k = clamp(s.t / s.T, 0, 1);
      const windEnd = 0.32, strikeEnd = 0.62;
      const back = s.heavy ? -1.65 : -1.05;
      const fwd = s.heavy ? 1.5 : 1.2;
      if (k < windEnd) {
        const e = easeInOutQuad(k / windEnd);
        ang = lerp(0.42, back, e); reach = lerp(25, 20, e); wrist = 0.5;
      } else if (k < strikeEnd) {
        const e = easeOutCubic((k - windEnd) / (strikeEnd - windEnd));
        ang = lerp(back, fwd, e);
        reach = lerp(20, s.heavy ? 38 : 34, Math.sin(e * Math.PI));
        wrist = lerp(0.5, -0.1, e);
        if (!s.sounded) {
          s.sounded = true;
          this.audio.swish(s.heavy);
          this.fx.slash(this.x, this.y - 92, back * 0.8, fwd * 0.8, s.heavy ? 52 : 44, this.facing);
          if (s.heavy) this.vx += this.facing * 260;
        }
        if (!s.hitDone && e > 0.35) {
          s.hitDone = true;
          this.knifeHit(enemies, s.heavy, game);
        }
      } else {
        const e = easeInOutQuad((k - strikeEnd) / (1 - strikeEnd));
        ang = lerp(fwd, 0.42, e); reach = lerp(34, 25, e); wrist = lerp(-0.1, 0.34, e);
      }
      if (k >= 1) this.slash = null;
    }

    ws.knifeAng = ang; ws.knifeReach = reach; ws.knifeWrist = wrist;
    this.visSpread = 0;
    this.applyWs(ws, offX, offY, rot);
  }

  knifeHit(enemies, heavy, game) {
    const wpn = this.cur.wpn;
    let hit = false;
    for (const e of enemies) {
      if (e.deadT > 0) continue;
      const dx = (e.x - this.x) * this.facing;
      const dy = Math.abs((e.y - 70) - (this.y - 70));
      if (dx > 2 && dx < wpn.range && dy < 70) {
        const dmg = heavy ? wpn.dmgHeavy : wpn.dmg;
        this.hits++;
        const killed = e.hp <= dmg;
        e.damage(dmg, this.facing, this, true);
        this.fx.blood(e.x - this.facing * 6, e.y - 92, this.facing);
        this.hud.hitmark(killed ? 'kill' : 'hit');
        if (killed) this.hud.notify('HOSTILE ELIMINATED — MELEE');
        if (game && game.onPlayerHit) game.onPlayerHit(false, killed);
        hit = true;
      }
    }
    if (hit) this.audio.stab();
  }

  // ------------------------------------------------------------- damage

  hurt(dmg, dirX, sourceX) {
    if (this.deadT > 0 || dmg <= 0) return;
    // armor soaks a share of incoming damage before health
    let toHp = dmg;
    if (this.armor > 0) {
      const absorb = Math.min(this.armor, dmg * 0.6);
      this.armor = Math.max(0, this.armor - absorb);
      toHp = dmg - absorb;
    }
    this.hp -= toHp;
    this.hurtT = 0.4;
    this.lastHurtT = this.time;
    this.stunT = Math.max(this.stunT, dmg > 14 ? 0.16 : 0.06);
    this.audio.hurt();
    this.cam.addTrauma(clamp(0.15 + dmg * 0.009, 0.15, 0.4));
    this.hud.damageFlash(this.hp / this.maxHp);
    this.fx.blood(this.x, this.y - 90, dirX);
    this.hud.damageDirection(sourceX === undefined ? 0 : sourceX - this.x, sourceX === undefined);
    if (this.hp <= 0) {
      this.hp = 0;
      this.deadT = 0.001;
      this.cam.addTrauma(0.7);
    }
  }

  draw(g) {
    const cur = this.cur;
    drawSoldier(g, this.parts, this.shadow, this, { wpn: cur.wpn, ws: cur.ws });
  }
}

// segment (p + t*d, t∈[0,1]) vs AABB — returns entry t or null
export function segVsBox(px, py, dx, dy, bx, by, bw, bh) {
  let tmin = 0, tmax = 1;
  for (let axis = 0; axis < 2; axis++) {
    const o = axis ? py : px, d = axis ? dy : dx;
    const lo = axis ? by : bx, hi = axis ? by + bh : bx + bw;
    if (Math.abs(d) < 1e-6) { if (o < lo || o > hi) return null; continue; }
    let t1 = (lo - o) / d, t2 = (hi - o) / d;
    if (t1 > t2) { const tt = t1; t1 = t2; t2 = tt; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin;
}
