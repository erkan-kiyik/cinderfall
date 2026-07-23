// Skeletal rig: poses the painted soldier parts each frame with procedural
// gait, breathing, lean and landing recovery, and solves both arms with
// two-bone IK onto the current weapon's grip points — hands land exactly on
// the grips by construction, so they never float or clip. Weapon sprites
// (body / magazine / bolt / slide / flash) are drawn between the correct
// body layers.

import { BONES } from '../art/soldier.js';
import { drawSprite } from '../art/paint.js';
import { ik2, clamp, lerp, easeOutCubic, TAU } from '../engine/math.js';

// Draw a limb sprite stretched between two joints.
function drawBone(g, spr, x0, y0, x1, y1, len, sx = 1) {
  const dx = x1 - x0, dy = y1 - y0;
  const d = Math.hypot(dx, dy) || 0.001;
  const rot = Math.atan2(-dx, dy);
  drawSprite(g, spr, x0, y0, rot, sx, d / len);
}

const rot2 = (px, py, ang) => {
  const c = Math.cos(ang), s = Math.sin(ang);
  return { x: px * c - py * s, y: px * s + py * c };
};

// ---------------------------------------------------------------- pose

export function computePose(ent) {
  const sp = clamp(ent.speedNorm, 0, 1);
  const air = ent.onGround ? 0 : clamp(ent.airTime * 5, 0, 1);
  // landing spring + held crouch both lower the stance; held crouch dominates
  const crouch = clamp(ent.crouchSpring + (ent.crouchHold || 0) * 1.15, 0, 1.7);
  const mv = clamp(sp * 5, 0, 1);

  const breath = Math.sin(ent.breathT * 1.8) * (1 - sp * 0.7);
  const bob = Math.abs(Math.sin(ent.gaitPhase)) * 2.4 * sp * (1 - air);

  const lean = ent.lean + air * clamp(ent.vy * 0.00035, -0.12, 0.2);

  const hipX = lean * 13;
  const hipY = -BONES.hipStand + crouch * 9 - bob + air * 4 + breath * 0.4;

  const torsoLen = BONES.torso - crouch * 2.5;
  const neck = {
    x: hipX + Math.sin(lean) * torsoLen,
    y: hipY - Math.cos(lean) * torsoLen,
  };
  const shLen = torsoLen - BONES.shoulderDrop;
  const shoulder = {
    x: hipX + Math.sin(lean) * shLen,
    y: hipY - Math.cos(lean) * shLen + breath * 0.4,
  };

  // legs
  const legs = [];
  const S = 11 + sp * 11;
  const liftH = 3.5 + sp * 8;
  for (let i = 0; i < 2; i++) {
    const ph = ent.gaitPhase + (i ? Math.PI : 0);
    const gx = -Math.cos(ph) * S + hipX * 0.55;
    const lift = Math.max(0, Math.sin(ph)) * liftH;
    const standX = i ? -4.5 : 5.5;
    let fx = lerp(standX, gx, mv);
    let fy = -lerp(0, lift, mv);
    if (air > 0) {
      // tuck in the air; reach for the ground while falling fast
      const falling = clamp((ent.vy - 140) / 500, 0, 1);
      const tx = i ? -7 : 10;
      const ty = i ? -13 : lerp(-24, -8, falling);
      fx = lerp(fx, tx, air);
      fy = lerp(fy, ty, air);
    }
    const ankle = { x: fx, y: fy - 5 };
    const hip = { x: hipX + (i ? -1.4 : 1.4), y: hipY + 1.5 };
    const knee = ik2(hip.x, hip.y, ankle.x, ankle.y, BONES.thigh, BONES.shin, -1);
    legs.push({ hip, knee, ankle });
  }

  return { hipX, hipY, neck, shoulder, lean, legs, breath, air };
}

// ------------------------------------------------------ weapon placement

// Anchor of the weapon (its grip origin) in character-local space.
export function weaponAnchor(pose, wpn, ws, aim) {
  const pivot = { x: pose.shoulder.x + 2.2, y: pose.shoulder.y + 2.2 };
  const ang = aim + ws.rot + ws.recoilRot;
  const off = rot2(
    ws.offX - ws.recoil - (wpn.shoulder ? wpn.shoulder.x : 0),
    ws.offY - (wpn.shoulder ? wpn.shoulder.y : 0),
    ang
  );
  return { x: pivot.x + off.x, y: pivot.y + off.y, ang };
}

export function weaponPoint(wa, p) {
  const r = rot2(p.x, p.y, wa.ang);
  return { x: wa.x + r.x, y: wa.y + r.y };
}

// Convert a character-local point to world space.
export function toWorld(ent, p) {
  return { x: ent.x + p.x * ent.facing, y: ent.y + p.y };
}

// ---------------------------------------------------------- weapon draw

function drawGun(g, wpn, ws, wa) {
  // magazine (behind receiver)
  if (wpn.mag && ws.magVisible) {
    const mp = weaponPoint(wa, { x: wpn.magPos.x + ws.magOffX, y: wpn.magPos.y + ws.magOffY });
    drawSprite(g, wpn.mag, mp.x, mp.y, wa.ang + ws.magRot);
  }
  drawSprite(g, wpn.body, wa.x, wa.y, wa.ang);
  // cycling bolt / slide
  if (wpn.bolt) {
    const bp = weaponPoint(wa, { x: wpn.boltPos.x - ws.boltBack * 4.5, y: wpn.boltPos.y });
    drawSprite(g, wpn.bolt, bp.x, bp.y, wa.ang);
  }
  if (wpn.slide) {
    const sp = weaponPoint(wa, { x: -ws.slideBack * 4, y: 0 });
    drawSprite(g, wpn.slide, sp.x, sp.y, wa.ang);
  }
  // muzzle flash (additive)
  if (ws.flashT > 0) {
    const m = weaponPoint(wa, wpn.muzzle);
    const s = ws.flashT * ws.flashScale;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = clamp(ws.flashT * 1.6, 0, 1);
    drawSprite(g, wpn.flashes[ws.flashIdx], m.x, m.y, wa.ang, s, s * (0.8 + 0.4 * Math.random()));
    g.restore();
  }
}

// ------------------------------------------------------------ character

// ent needs: x, y, facing, aimLocal, gaitPhase, speedNorm, onGround, airTime,
// vy, crouchSpring, breathT, lean, hurtT, deadT.
// weapon: null | { wpn, ws } — ws is the animation state from the entity.
export function drawSoldier(g, parts, shadow, ent, weapon) {
  g.save();
  g.translate(ent.x, ent.y);

  // contact shadow (before mirroring; fades in the air)
  const airK = ent.onGround ? 1 : clamp(1 - ent.airTime * 1.8, 0.25, 1);
  g.globalAlpha = 0.9 * airK;
  drawSprite(g, shadow, 0, 1, 0, 1.15 * airK + 0.25, 1);
  g.globalAlpha = 1;

  g.scale(ent.facing, 1);

  // death fall: tip backward around the feet, limbs go limp
  let deadRot = 0;
  if (ent.deadT > 0) {
    deadRot = easeOutCubic(clamp(ent.deadT / 0.6, 0, 1)) * 1.42;
    g.rotate(-deadRot);
    if (ent.deadT > 5) g.globalAlpha = clamp(1 - (ent.deadT - 5) / 2.5, 0, 1);
  }

  const pose = computePose(ent);
  const aim = ent.deadT > 0 ? 0.6 : ent.aimLocal;

  // --- resolve hand targets
  let wa = null;
  let gripF = null, gripB = null;      // front (near) hand = trigger hand
  let handSprF = 'handGrip', handSprB = 'handGrip';
  let handAngF = 0, handAngB = 0;
  let knifeDraw = null;

  const weaponAlive = weapon && ent.deadT <= 0;
  if (weaponAlive && weapon.wpn.kind === 'gun') {
    const { wpn, ws } = weapon;
    wa = weaponAnchor(pose, wpn, ws, aim);
    gripF = weaponPoint(wa, wpn.gripA);
    handSprF = 'handTrigger';
    handAngF = wa.ang;
    if (ws.magHand && wpn.mag) {
      // support hand rides the magazine during reloads
      gripB = weaponPoint(wa, { x: wpn.magPos.x + ws.magOffX, y: wpn.magPos.y + ws.magOffY + 3 });
      handSprB = 'handGrip';
    } else {
      gripB = weaponPoint(wa, wpn.gripB);
    }
    handAngB = wa.ang + (weapon.ws.magHand ? 0.5 : 0);
  } else if (weaponAlive && weapon.wpn.kind === 'melee') {
    const { wpn, ws } = weapon;
    const reach = ws.knifeReach;
    const a = ws.knifeAng;
    gripF = {
      x: pose.shoulder.x + Math.cos(a) * reach,
      y: pose.shoulder.y + 2 + Math.sin(a) * reach,
    };
    handSprF = 'handGrip';
    handAngF = a + ws.knifeWrist;
    knifeDraw = { wpn, ang: a + ws.knifeWrist, pos: gripF };
    // off-hand guard fist
    gripB = { x: pose.shoulder.x + 9, y: pose.shoulder.y + 7 + pose.breath * 0.4 };
    handSprB = 'handFist';
    handAngB = -0.5;
  } else {
    // unarmed / dead: arms hang
    gripF = { x: pose.shoulder.x + 4, y: pose.shoulder.y + 34 };
    gripB = { x: pose.shoulder.x - 2.5, y: pose.shoulder.y + 33 };
    handSprF = handSprB = 'handOpen';
    handAngF = handAngB = 1.4;
  }

  const shF = { x: pose.shoulder.x + 2, y: pose.shoulder.y };
  const shB = { x: pose.shoulder.x - 2.5, y: pose.shoulder.y + 1 };
  const elbF = ik2(shF.x, shF.y, gripF.x, gripF.y, BONES.upperArm, BONES.foreArm, 1);
  const elbB = ik2(shB.x, shB.y, gripB.x, gripB.y, BONES.upperArm, BONES.foreArm, 1);

  const L = pose.legs;
  const back = L[1], front = L[0];

  // --- draw order: far side → near side
  drawBone(g, parts.upperArm, shB.x, shB.y, elbB.x, elbB.y, BONES.upperArm, 1.05);
  drawBone(g, parts.thigh, back.hip.x, back.hip.y, back.knee.x, back.knee.y, BONES.thigh, 1.14);
  drawBone(g, parts.shin, back.knee.x, back.knee.y, back.ankle.x, back.ankle.y, BONES.shin, 1.1);

  drawSprite(g, parts.pelvis, pose.hipX, pose.hipY + 1, pose.lean * 0.5);
  // torso is anchored at the hip with its art extending upward — draw it
  // rotated by the lean (drawBone would flip it, since hip→neck points up)
  const torsoD = Math.hypot(pose.neck.x - pose.hipX, pose.neck.y - pose.hipY);
  drawSprite(g, parts.torso, pose.hipX, pose.hipY, pose.lean, 1, torsoD / BONES.torso);

  drawBone(g, parts.thigh, front.hip.x, front.hip.y, front.knee.x, front.knee.y, BONES.thigh, 1.14);
  drawBone(g, parts.shin, front.knee.x, front.knee.y, front.ankle.x, front.ankle.y, BONES.shin, 1.1);

  // head (tracks aim)
  const headTilt = ent.deadT > 0 ? 0.5 : clamp(aim * 0.35, -0.3, 0.42) + pose.lean * 0.4;
  drawSprite(g, parts.head, pose.neck.x, pose.neck.y + 1, headTilt);

  // weapon between far hand and near arm
  if (wa && weaponAlive) drawGun(g, weapon.wpn, weapon.ws, wa);
  if (knifeDraw) {
    const kOff = rot2(1.5, -0.8, knifeDraw.ang);
    drawSprite(g, knifeDraw.wpn.body, knifeDraw.pos.x + kOff.x, knifeDraw.pos.y + kOff.y, knifeDraw.ang);
  }

  // far forearm + hand over the weapon
  drawBone(g, parts.foreArm, elbB.x, elbB.y, gripB.x, gripB.y, BONES.foreArm, 1.05);
  drawSprite(g, parts[handSprB], gripB.x, gripB.y, handAngB);

  // near arm on top
  drawBone(g, parts.upperArm, shF.x, shF.y, elbF.x, elbF.y, BONES.upperArm, 1.05);
  drawBone(g, parts.foreArm, elbF.x, elbF.y, gripF.x, gripF.y, BONES.foreArm, 1.05);
  drawSprite(g, parts[handSprF], gripF.x, gripF.y, handAngF);

  // hurt flash
  if (ent.hurtT > 0) {
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = clamp(ent.hurtT * 1.8, 0, 0.55);
    const gr = g.createRadialGradient(pose.hipX, pose.hipY - 20, 2, pose.hipX, pose.hipY - 20, 34);
    gr.addColorStop(0, 'rgba(255,60,40,0.8)');
    gr.addColorStop(1, 'rgba(255,60,40,0)');
    g.fillStyle = gr;
    g.beginPath(); g.arc(pose.hipX, pose.hipY - 20, 34, 0, TAU); g.fill();
  }

  g.restore();
}

// Fresh weapon animation-state object (one per gun per entity).
export function newWeaponState() {
  return {
    offX: 0, offY: 0, rot: 0,
    recoil: 0, recoilVel: 0, recoilRot: 0, recoilRotVel: 0,
    magVisible: true, magOffX: 0, magOffY: 0, magRot: 0, magHand: false,
    boltBack: 0, slideBack: 0,
    flashT: 0, flashIdx: 0, flashScale: 1,
    knifeAng: 0.35, knifeWrist: 0.3, knifeReach: 26,
    // energy weapons: heat 0..1 (overheat lock), charge 0..1 (charge shots)
    heat: 0, overheated: false, charge: 0, charging: false, wasDown: false,
  };
}
