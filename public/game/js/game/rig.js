// Skeletal rig: poses the painted soldier parts each frame with procedural
// gait, breathing, lean and landing recovery, and solves both arms with
// two-bone IK onto the current weapon's grip points — hands land exactly on
// the grips by construction, so they never float or clip. Weapon sprites
// (body / magazine / bolt / slide / flash) are drawn between the correct
// body layers.

import { BONES } from '../art/soldier.js';
import { drawSprite } from '../art/paint.js';
import { ik2, clamp, lerp, easeOutCubic, smootherstep, TAU } from '../engine/math.js';

// Draw a limb sprite stretched between two joints.
function drawBone(g, spr, x0, y0, x1, y1, len, sx = 1) {
  const dx = x1 - x0, dy = y1 - y0;
  const d = Math.hypot(dx, dy) || 0.001;
  const rot = Math.atan2(-dx, dy);
  drawSprite(g, spr, x0, y0, rot, sx, d / len);
}

// Gait humanisation constants.
// WEIGHT_BIAS: how much more the body rises over one leg than the other
// (0 = perfectly symmetric machine gait). PELVIC_LIST: hip drop toward the
// swinging leg, in world units. STEP_BIAS: stride-length difference between
// the two legs. All deliberately small — the read should be "a person", not
// "an injured person".
const WEIGHT_BIAS = 0.16;
const PELVIC_LIST = 1.15;
const STEP_BIAS = 0.12;

// ---- posture ----
// The operator used to stand bolt upright and stay upright at a sprint, which
// is the single biggest reason the character read as amateur: a soldier under
// threat never stands like that. STANCE_PITCH is the permanent forward set of
// the torso at rest — chest over the balls of the feet, weapon up. RUN_PITCH
// adds to it with speed, because the faster you move the further your mass
// leads your feet.
const STANCE_PITCH = 0.085;   // radians of forward lean, standing
const RUN_PITCH = 0.20;       // extra radians at a full sprint
// The head does NOT follow the torso all the way down — eyes stay on the
// threat. This is how much of the torso pitch the neck cancels.
const HEAD_COUNTER = 0.62;

// ---- run cycle ----
// Counter-rotation: the shoulders twist against the hips once per stride.
// Without it the upper and lower body move as one plank, which is the "kütük"
// read — a mannequin being slid along rather than a person running.
const SHOULDER_COUNTER = 2.6;    // px of horizontal shoulder offset
// Hip drive: the pelvis pushes forward on the drive leg's stance phase.
const HIP_DRIVE = 2.1;
// How much higher the knee comes up once the gait crosses into a run.
const RUN_KNEE_LIFT = 5.5;
// Heel-strike to toe-off: the planted foot rolls instead of staying flat.
const FOOT_ROLL = 2.4;

// 0.995 keeps ik2 off its own singularity (a perfectly straight two-bone chain
// has no defined bend direction).
const REACH_LIMIT = 0.995;
const ARM_REACH = (BONES.upperArm + BONES.foreArm) * REACH_LIMIT;
const LEG_REACH = (BONES.thigh + BONES.shin) * REACH_LIMIT;

// Pulls `target` back onto the circle the limb can actually reach from `root`.
// Direction is preserved, so the limb still points where it was asked to.
//
// This has to happen on the *target*, not inside ik2. ik2 clamps the distance
// it uses to place the joint, but the end effector is drawn where the caller
// asked for it — so an out-of-reach target left the joint on its circle and
// stretched the second bone's sprite across the remainder. That is the visible
// "limb grows" artefact, and it showed up on both the vaulting arm and, at a
// sprint, the shin.
function clampReach(root, target, max) {
  const dx = target.x - root.x, dy = target.y - root.y;
  const d = Math.hypot(dx, dy);
  if (d <= max || d === 0) return target;
  const s = max / d;
  return { x: root.x + dx * s, y: root.y + dy * s };
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
  // Footing irregularity the Player integrates (see gaitNoise there); zero
  // for entities that don't track it, so hostiles keep the tidy cycle.
  const noise = (ent.gaitNoise || 0) * (1 - air);

  // Vertical bob. Real gait is not symmetric: the body rises less over the
  // weaker/trailing leg than the driving one, so alternate strides get
  // different amplitude. WEIGHT_BIAS is what stops the walk reading as a
  // two-frame piston loop.
  const stride = Math.sin(ent.gaitPhase);
  const strideSide = Math.sin(ent.gaitPhase * 0.5);          // −1..1, one full stride
  const bobAmp = 3.1 * (1 + WEIGHT_BIAS * strideSide);
  const bob = Math.abs(stride) * bobAmp * sp * (1 - air) + noise * 0.9;

  // Lateral weight shift once per full stride, plus a pelvic list: the hip
  // drops toward the swinging leg as the opposite one takes the load, which
  // is the single strongest "this is a person walking" cue.
  const sway = strideSide * 1.4 * sp * (1 - air);
  const pelvicList = strideSide * PELVIC_LIST * sp * (1 - air);

  // stumbleLean is a transient the Player adds on top of its damped lean —
  // kept separate so the tilt can't feed back into the damping and linger.
  //
  // The stance pitch is added last and is not part of ent.lean, so the Player's
  // damping and the stumble transient still work on their own terms — this
  // just sets where "upright" is. Crouching straightens the torso back up
  // (you are already low; folding further would put the head on the knees).
  const posture = (STANCE_PITCH + RUN_PITCH * sp * sp) * (1 - air * 0.7)
                  * (1 - clamp(crouch * 0.4, 0, 0.55));
  const lean = ent.lean + (ent.stumbleLean || 0)
               + air * clamp(ent.vy * 0.00035, -0.12, 0.2) + posture;

  // Shoulders counter-rotate against the hips, once per full stride. Pure
  // horizontal offset rather than a real twist — in a side view that is what
  // a torso rotation looks like, and it costs nothing.
  const counter = -strideSide * SHOULDER_COUNTER * sp * (1 - air);
  // Hips drive forward as the stance leg extends.
  const drive = Math.abs(stride) * HIP_DRIVE * sp * (1 - air);

  const hipX = lean * 13 + sway + noise * 1.6 + drive;
  const hipY = -BONES.hipStand + crouch * 9 - bob + air * 4 + breath * 0.4 + pelvicList;

  const torsoLen = BONES.torso - crouch * 2.5;
  // Head holds its line while the chest drops — the operator is looking at
  // where he is going, not at the floor.
  const neckLean = lean - posture * HEAD_COUNTER;
  const neck = {
    x: hipX + Math.sin(neckLean) * torsoLen,
    y: hipY - Math.cos(neckLean) * torsoLen,
  };
  const shLen = torsoLen - BONES.shoulderDrop;
  const shoulder = {
    x: hipX + Math.sin(lean) * shLen + counter,
    y: hipY - Math.cos(lean) * shLen + breath * 0.4,
  };

  // legs
  const legs = [];
  const S = 11 + sp * 11;
  const liftH = 3.5 + sp * 8;
  // Above a jog the swing leg folds up under the body instead of pendulum-ing
  // through straight. A straight-through swing is the other half of the
  // "logs for legs" read; a real runner's knee comes up first.
  const runK = clamp((sp - 0.45) / 0.55, 0, 1);
  for (let i = 0; i < 2; i++) {
    const ph = ent.gaitPhase + (i ? Math.PI : 0);
    // One leg takes a marginally longer step and lifts marginally higher than
    // the other. Nobody's stride is truly even, and the asymmetry is what
    // keeps a looping cycle from reading as mechanical.
    const legS = S * (1 + (i ? STEP_BIAS : -STEP_BIAS));
    const legLift = liftH * (1 + (i ? -STEP_BIAS : STEP_BIAS));
    const gx = -Math.cos(ph) * legS + hipX * 0.55;
    const sw = Math.max(0, Math.sin(ph));          // 0 planted → 1 mid-swing
    // The knee leads the foot: extra lift concentrated in the first half of
    // the swing, so the leg folds up and then reaches out rather than
    // sweeping through as one rigid bar.
    const lift = sw * legLift + Math.pow(sw, 1.6) * RUN_KNEE_LIFT * runK;
    // Planted foot rolls heel→toe across its stance phase instead of staying
    // pinned flat to the street.
    const roll = (1 - sw) * Math.sin(ph) * FOOT_ROLL * sp;
    const standX = i ? -4.5 : 5.5;
    let fx = lerp(standX, gx + roll, mv) + noise * 0.8;
    let fy = -lerp(0, lift, mv);
    if (air > 0) {
      // tuck in the air; reach for the ground while falling fast
      const falling = clamp((ent.vy - 140) / 500, 0, 1);
      const tx = i ? -7 : 10;
      const ty = i ? -13 : lerp(-24, -8, falling);
      fx = lerp(fx, tx, air);
      fy = lerp(fy, ty, air);
    }
    const hip = { x: hipX + (i ? -1.4 : 1.4), y: hipY + 1.5 };
    // Clamped before the solve: the knee lift can otherwise ask the foot to
    // reach further than the leg is long, and the shin sprite stretches.
    const ankle = clampReach(hip, { x: fx, y: fy - 5 }, LEG_REACH);
    const knee = ik2(hip.x, hip.y, ankle.x, ankle.y, BONES.thigh, BONES.shin, -1);
    legs.push({ hip, knee, ankle });
  }

  // ---- vault blend ----
  // While vaulting the body is thrown into a horizontal slide: torso pitched
  // hard over the obstacle, hips high and forward, both legs swept to one
  // side and tucked. It blends in and out rather than snapping, so the
  // transition out of the run cycle reads continuously.
  const vk = ent.vaultK || 0;
  if (vk > 0.001) {
    // eased in over the first fifth and out over the last quarter, so the
    // pose is fully committed across the middle of the slide
    const w = Math.min(smootherstep(clamp(vk / 0.2, 0, 1)),
                       smootherstep(clamp((1 - vk) / 0.25, 0, 1)));
    const pose = vaultPose(ent, vk, hipX, hipY, lean);
    return blendPose(
      { hipX, hipY, neck, shoulder, lean, legs, breath, air },
      pose, w,
    );
  }

  return { hipX, hipY, neck, shoulder, lean, legs, breath, air };
}


// ---- vault pose ----
// Built as a complete alternative pose and cross-faded against the walk, which
// keeps the vault out of the gait maths entirely — no phase to fight, nothing
// to unwind when it ends.
function vaultPose(ent, k, hipX, hipY, lean) {
  // Torso pitches hard over the obstacle and recovers on the way out. This is
  // the whole move now that nothing reaches for the surface: the operator
  // crosses on the body, so the body has to be doing the work.
  const pitch = Math.sin(Math.PI * clamp(k, 0, 1));
  const vLean = lean + 0.95 * pitch;
  // hips ride forward and up — chest over the obstacle, weight already past it
  const vHipX = hipX + 9 * pitch;
  const vHipY = hipY - 8 * pitch;

  const torsoLen = BONES.torso - 2.2 * pitch;
  const neck = {
    x: vHipX + Math.sin(vLean) * torsoLen,
    y: vHipY - Math.cos(vLean) * torsoLen,
  };
  const shLen = torsoLen - BONES.shoulderDrop;
  const shoulder = {
    x: vHipX + Math.sin(vLean) * shLen,
    y: vHipY - Math.cos(vLean) * shLen,
  };

  // Both legs sweep through to the front and tuck up under the hips — the
  // scissor kick that carries the body across. The lead leg swings out first
  // and the trail leg follows a beat behind, which is what makes it read as
  // one continuous motion instead of both legs snapping to the same shape.
  const legs = [];
  for (let i = 0; i < 2; i++) {
    const lead = i === 0;
    const swing = lead
      ? lerp(-8, 24, clamp(k * 1.3, 0, 1))
      : lerp(-18, 12, clamp((k - 0.15) * 1.3, 0, 1));
    // Feet come up level with the hips at the peak — knees clear the obstacle
    // rather than trailing through it.
    const tuck = lead ? -24 - 9 * pitch : -15 - 13 * pitch;
    const hip = { x: vHipX + (lead ? 1.4 : -1.4), y: vHipY + 1.5 };
    const ankle = clampReach(hip, { x: vHipX * 0.4 + swing, y: tuck }, LEG_REACH);
    const knee = ik2(hip.x, hip.y, ankle.x, ankle.y, BONES.thigh, BONES.shin, -1);
    legs.push({ hip, knee, ankle });
  }
  return { hipX: vHipX, hipY: vHipY, neck, shoulder, lean: vLean, legs, breath: 0, air: 0 };
}

// Linear cross-fade between two poses. Only the fields the renderer reads.
function blendPose(a, b, w) {
  const mixPt = (p, q) => ({ x: lerp(p.x, q.x, w), y: lerp(p.y, q.y, w) });
  return {
    hipX: lerp(a.hipX, b.hipX, w),
    hipY: lerp(a.hipY, b.hipY, w),
    neck: mixPt(a.neck, b.neck),
    shoulder: mixPt(a.shoulder, b.shoulder),
    lean: lerp(a.lean, b.lean, w),
    legs: a.legs.map((leg, i) => ({
      hip: mixPt(leg.hip, b.legs[i].hip),
      knee: mixPt(leg.knee, b.legs[i].knee),
      ankle: mixPt(leg.ankle, b.legs[i].ankle),
    })),
    breath: lerp(a.breath, b.breath, w),
    air: lerp(a.air, b.air, w),
    vaultW: w,
  };
}

// ------------------------------------------------------ weapon placement

// How far the muzzle drops, and how far the whole weapon rides down the body,
// at a fully relaxed one-handed carry (ws.relax === 1). See RELAX_* in
// player.js for the timing that drives it.
const RELAX_MUZZLE_DIP = 0.62;   // radians, toward the ground
const RELAX_DROP_Y = 7.5;        // px, weapon carried lower on the body
const RELAX_DROP_X = -3.5;       // px, drawn back toward the hip

// Anchor of the weapon (its grip origin) in character-local space.
export function weaponAnchor(pose, wpn, ws, aim) {
  const relax = ws.relax || 0;
  const pivot = {
    x: pose.shoulder.x + 2.2 + RELAX_DROP_X * relax,
    y: pose.shoulder.y + 2.2 + RELAX_DROP_Y * relax,
  };
  // Muzzle dips toward the ground as the weapon comes off aim. The pose is
  // built in facing-neutral local space (the horizontal flip happens at draw
  // time, see g.scale(ent.facing, 1)), so a positive angle is always "down"
  // here — folding `facing` in would invert the dip when facing left.
  const dip = RELAX_MUZZLE_DIP * relax;
  const ang = aim + ws.rot + ws.recoilRot + dip;
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
// ------------------------------------------------------------ ground accent
// Characters used to be separated from the background by a dark contour
// stamped around a flattened copy of the whole rig. At any real device scale
// that stack of offset silhouettes read as a dark slab behind the operator
// rather than an edge, so it is gone entirely — no scratch buffers, no
// silhouette layers, nothing drawn behind the body.
//
// What replaces it is a single hairline accent under the feet: one tapered
// stroke that marks where the character is standing. It is the only mark
// besides the body itself, it never overlaps the sprite, and it costs one
// path per entity instead of eight full-rig blits.

// Accent geometry in entity-local units. Width is deliberately narrower than
// the stance so it reads as a marker, not a shadow.
const ACCENT_W = 17;

function drawGroundAccent(g, ent, o) {
  // Fades out as the character leaves the ground — an accent pinned to the
  // street means nothing while airborne.
  const air = ent.onGround ? 1 : clamp(1 - ent.airTime * 2.6, 0, 1);
  if (air <= 0.01) return;
  const grad = g.createLinearGradient(-ACCENT_W, 0, ACCENT_W, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.5, o.color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.save();
  g.globalAlpha = air;
  g.strokeStyle = grad;
  g.lineWidth = o.px;
  g.lineCap = 'butt';
  g.beginPath();
  g.moveTo(-ACCENT_W, 1.5);
  g.lineTo(ACCENT_W, 1.5);
  g.stroke();
  g.restore();
}

export function drawSoldier(g, parts, shadow, ent, weapon, opts = null) {
  g.save();
  g.translate(ent.x, ent.y);

  // contact shadow (before mirroring; fades in the air)
  const airK = ent.onGround ? 1 : clamp(1 - ent.airTime * 1.8, 0.25, 1);
  g.globalAlpha = 0.9 * airK;
  drawSprite(g, shadow, 0, 1, 0, 1.15 * airK + 0.25, 1);
  g.globalAlpha = 1;

  // Position accent, under the body and skipped for corpses (a downed
  // operator is not a position the player needs marked).
  const o = opts && opts.accent;
  if (o && ent.deadT <= 0) drawGroundAccent(g, ent, o);

  drawBody(g, parts, ent, weapon);

  g.restore();
}

// The rig itself, in entity-local space (caller has already translated to
// ent.x/ent.y). Split out of drawSoldier so it can be rendered either straight
// to the screen or, historically, into an offscreen buffer.
function drawBody(g, parts, ent, weapon) {
  g.save();
  g.scale(ent.facing, 1);

  // Squash & stretch, anchored at the feet (local origin) so the operator
  // never sinks into or floats above the street. Entities that don't set
  // these (hostiles) are untouched.
  if (ent.squashX !== undefined && (ent.squashX !== 1 || ent.squashY !== 1)) {
    g.scale(ent.squashX, ent.squashY);
  }

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
      // Support hand: on the foregrip when the weapon is up, released and
      // hanging at the side once the operator relaxes into a one-handed carry.
      const onGrip = weaponPoint(wa, wpn.gripB);
      const relax = ws.relax || 0;
      if (relax > 0.001) {
        const rest = {
          x: pose.shoulder.x - 3.5,
          y: pose.shoulder.y + 31 + pose.breath * 0.5,
        };
        gripB = {
          x: onGrip.x + (rest.x - onGrip.x) * relax,
          y: onGrip.y + (rest.y - onGrip.y) * relax,
        };
        // the released hand opens out of its grip shape as it falls
        if (relax > 0.55) handSprB = 'handOpen';
      } else {
        gripB = onGrip;
      }
      // Vault: the support hand tucks in against the chest instead of reaching
      // for the obstacle.
      //
      // It used to plant on the obstacle top, which is a world point up to a
      // body-length away from the shoulder. ik2 clamps the *elbow* to arm
      // reach but the hand target itself stayed where it was, so drawBone
      // stretched the forearm sprite across the gap — the arm visibly grew.
      // Nothing touches the obstacle now: the operator goes over it on the
      // body alone, which is what a hood slide actually is.
      const vw = pose.vaultW || 0;
      if (vw > 0.001) {
        const tuck = {
          x: pose.shoulder.x + 7.5,
          y: pose.shoulder.y + 11,
        };
        gripB = {
          x: lerp(gripB.x, tuck.x, vw),
          y: lerp(gripB.y, tuck.y, vw),
        };
      }
    }
    handAngB = wa.ang + (weapon.ws.magHand ? 0.5 : 0) + 1.3 * (ws.relax || 0);
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
  // Hands can never be pulled past what the arm can physically reach.
  //
  // ik2 already clamps the elbow, but the hand target is what drawBone
  // measures the forearm against — an out-of-reach target stretched the
  // forearm sprite to span the gap. Clamping the target itself means the arm
  // straightens and stops, the way an arm does, no matter what asks for it.
  gripF = clampReach(shF, gripF, ARM_REACH);
  gripB = clampReach(shB, gripB, ARM_REACH);
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
