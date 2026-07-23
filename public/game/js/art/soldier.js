// Soldier part atlas. Each body part is painted once per palette variant at
// ASSET_SCALE resolution with painted-in shading: gradient key light from
// above, cool core shadow, cloth folds, gear pouches, stitching, wear and
// ambient occlusion at the joints. Parts are assembled + posed by rig.js.
//
// Variants: 'ranger' (player — olive/tan) and 'phantom' (hostiles — charcoal).

import {
  makeSprite, makeCanvas, lingrad, radgrad, rr, grunge, scratches, fold, ao,
  shade, mix, withA, COL,
} from './paint.js';
import { makeRng } from '../engine/math.js';

// Skeleton dimensions in world units (px). Shared with rig.js.
export const BONES = {
  thigh: 31, shin: 30, footH: 7,
  torso: 42, neck: 9,
  upperArm: 23, foreArm: 21,
  hipStand: 64,          // hip height above feet when standing
  shoulderDrop: 5,       // shoulder below neck top
};

const VARIANTS = {
  ranger: {
    seed: 1337,
    uniform: '#4d5340', uniformDark: '#3a4030',
    vest: '#6b6350', vestDark: '#524c3c',
    helmet: '#4a4f3d',
    glove: '#3d382e',
    boot: '#2e2921',
    skin: COL.skin,
    masked: false,
    pad: '#35342c',
  },
  phantom: {
    seed: 9021,
    uniform: '#3a3d42', uniformDark: '#2b2e33',
    vest: '#32353a', vestDark: '#26282d',
    helmet: '#33363b',
    glove: '#26282c',
    boot: '#1f2023',
    skin: '#a07a5c',
    masked: true,
    pad: '#24262a',
  },
  nomad: {
    seed: 4477,
    uniform: '#7a6a4c', uniformDark: '#5d5039',
    vest: '#8a7a54', vestDark: '#6b5d40',
    helmet: '#6e5f42',
    glove: '#4a4130',
    boot: '#3a3122',
    skin: COL.skin,
    masked: true,
    pad: '#453b29',
  },
};

// Fabric base fill: lit from top with warm key, cool shadow at bottom.
function cloth(g, x, y, w, h, base) {
  g.fillStyle = lingrad(g, x, y, x, y + h, [
    [0, shade(base, 0.16)],
    [0.35, base],
    [1, shade(base, -0.32)],
  ]);
}

export function buildSoldier(name) {
  const V = VARIANTS[name];
  const rng = makeRng(V.seed);
  const parts = {};

  // ---------------- head (facing +x) ----------------
  // box 26x28, anchor at neck base (13, 26)
  parts.head = makeSprite(26, 28, 13, 26, (g) => {
    const cx = 13;
    // neck
    g.fillStyle = lingrad(g, 0, 18, 0, 27, [
      [0, V.masked ? V.uniform : V.skin],
      [1, V.masked ? V.uniformDark : COL.skinShade],
    ]);
    g.beginPath();
    g.moveTo(cx - 4, 18); g.lineTo(cx + 4.5, 18);
    g.lineTo(cx + 4, 27); g.lineTo(cx - 4.5, 27);
    g.closePath(); g.fill();
    // neck gaiter
    g.fillStyle = lingrad(g, 0, 20, 0, 27, [[0, V.uniform], [1, shade(V.uniformDark, -0.15)]]);
    g.beginPath();
    g.moveTo(cx - 5.5, 21); g.quadraticCurveTo(cx, 19.4, cx + 6, 21);
    g.lineTo(cx + 5, 27.5); g.lineTo(cx - 5, 27.5);
    g.closePath(); g.fill();

    // skull / face
    const faceGrad = lingrad(g, 0, 4, 0, 22, [
      [0, shade(V.skin, 0.12)],
      [0.55, V.skin],
      [1, COL.skinShade],
    ]);
    g.fillStyle = faceGrad;
    g.beginPath();
    g.moveTo(cx - 7.5, 9);
    g.quadraticCurveTo(cx - 8, 19, cx - 4, 21);   // back of jaw
    g.quadraticCurveTo(cx + 1, 22.5, cx + 5, 20.5); // chin
    g.quadraticCurveTo(cx + 7.6, 19, cx + 7.4, 15); // jaw front
    g.lineTo(cx + 7.6, 9);
    g.closePath(); g.fill();

    if (V.masked) {
      // balaclava lower face
      g.fillStyle = lingrad(g, 0, 12, 0, 22, [[0, '#2c2e32'], [1, '#1d1f22']]);
      g.beginPath();
      g.moveTo(cx - 7.6, 12.5);
      g.quadraticCurveTo(cx - 8, 19, cx - 4, 21);
      g.quadraticCurveTo(cx + 1, 22.5, cx + 5, 20.5);
      g.quadraticCurveTo(cx + 7.6, 19, cx + 7.5, 12.5);
      g.closePath(); g.fill();
      // goggles
      g.fillStyle = '#1a1b1e';
      rr(g, cx - 7, 8.6, 14.6, 5.6, 2.4); g.fill();
      g.fillStyle = lingrad(g, cx - 2, 9, cx + 7, 13, [
        [0, '#8a6a30'], [0.5, '#c89a46'], [1, '#5c3f1c'],
      ]);
      rr(g, cx + 0.5, 9.5, 6.2, 3.8, 1.6); g.fill();
      g.fillStyle = 'rgba(255,235,190,0.55)';
      rr(g, cx + 1.4, 10, 2.2, 1.2, 0.6); g.fill();
      // strap
      g.fillStyle = '#232529';
      g.fillRect(cx - 8.5, 9.8, 2, 3);
    } else {
      // brow shadow under helmet
      g.fillStyle = 'rgba(30,18,12,0.35)';
      rr(g, cx - 5, 8.2, 12.4, 3, 1.5); g.fill();
      // eye
      g.fillStyle = '#241812';
      g.beginPath(); g.ellipse(cx + 4.4, 11.2, 1.5, 0.9, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.fillRect(cx + 4.6, 10.7, 0.6, 0.4);
      // brow
      g.strokeStyle = 'rgba(40,24,14,0.6)'; g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(cx + 2.4, 9.8); g.lineTo(cx + 6.4, 9.6); g.stroke();
      // nose + mouth hints
      g.strokeStyle = withA(COL.skinShade, 0.85); g.lineWidth = 0.9;
      g.beginPath(); g.moveTo(cx + 6.8, 12); g.quadraticCurveTo(cx + 7.8, 14, cx + 6.6, 15.2); g.stroke();
      g.strokeStyle = 'rgba(70,38,26,0.55)'; g.lineWidth = 0.7;
      g.beginPath(); g.moveTo(cx + 3.6, 17.6); g.lineTo(cx + 6, 17.3); g.stroke();
      // ear
      g.fillStyle = shade(V.skin, -0.08);
      g.beginPath(); g.ellipse(cx - 3.4, 13.4, 1.8, 2.6, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = withA(COL.skinShade, 0.7); g.lineWidth = 0.6;
      g.beginPath(); g.ellipse(cx - 3.4, 13.4, 0.9, 1.5, 0, 0, Math.PI * 2); g.stroke();
      // cheek shading
      g.fillStyle = withA(COL.skinShade, 0.25);
      g.beginPath(); g.ellipse(cx + 1, 15.5, 3.4, 2.6, -0.3, 0, Math.PI * 2); g.fill();
      // stubble
      g.fillStyle = 'rgba(50,34,24,0.18)';
      g.beginPath(); g.ellipse(cx + 2.5, 18.6, 4.4, 3, -0.2, 0, Math.PI * 2); g.fill();
    }

    // helmet — high-cut ballistic shell
    g.fillStyle = lingrad(g, 0, 0, 0, 12, [
      [0, shade(V.helmet, 0.22)],
      [0.5, V.helmet],
      [1, shade(V.helmet, -0.28)],
    ]);
    g.beginPath();
    g.moveTo(cx - 9, 9.5);
    g.quadraticCurveTo(cx - 9.6, 0.6, cx + 0.5, 0.4);
    g.quadraticCurveTo(cx + 9.6, 0.8, cx + 9.2, 8.2);
    g.quadraticCurveTo(cx + 9, 9.6, cx + 7.6, 9.6);
    g.lineTo(cx - 7.2, 10.6);
    g.quadraticCurveTo(cx - 8.8, 10.8, cx - 9, 9.5);
    g.closePath(); g.fill();
    // helmet rim shadow + edge light
    g.strokeStyle = 'rgba(10,10,8,0.5)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(cx - 8.6, 9.9); g.quadraticCurveTo(cx, 10.9, cx + 8.9, 8.6); g.stroke();
    g.strokeStyle = 'rgba(255,220,170,0.28)'; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(cx - 8.2, 3.2); g.quadraticCurveTo(cx, 0.9, cx + 7.8, 2.6); g.stroke();
    // side rail + NVG mount
    g.fillStyle = shade(V.helmet, -0.35);
    rr(g, cx - 5.5, 5.4, 8.5, 1.7, 0.8); g.fill();
    g.fillStyle = shade(V.helmet, -0.2);
    rr(g, cx + 5.4, 3.4, 3.4, 2.6, 0.7); g.fill();
    // strap
    g.strokeStyle = '#26241f'; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(cx - 4, 10.5); g.lineTo(cx + 1.5, 20.6); g.stroke();
    g.beginPath(); g.moveTo(cx + 6.5, 9.8); g.lineTo(cx + 2.2, 20.2); g.stroke();
    // comms headset + boom mic
    g.fillStyle = '#22242a';
    g.beginPath(); g.ellipse(cx - 4, 13, 2.6, 3.2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(200,210,225,0.25)';
    g.beginPath(); g.ellipse(cx - 4.7, 11.9, 0.9, 1.1, 0, 0, Math.PI * 2); g.fill();
    if (!V.masked) {
      g.strokeStyle = '#191a1d'; g.lineWidth = 0.9;
      g.beginPath(); g.moveTo(cx - 3, 15.4); g.quadraticCurveTo(cx + 2, 19.8, cx + 5.4, 18.6); g.stroke();
      g.fillStyle = '#111214';
      g.beginPath(); g.ellipse(cx + 5.6, 18.5, 1.3, 0.9, 0.3, 0, Math.PI * 2); g.fill();
    }
    grunge(g, 4, 0, 18, 11, rng, { n: 40, dark: 0.12, light: 0.06 });
  });

  // ---------------- torso ----------------
  // box 34x50, anchor at hip pivot (16, 46). Chest faces +x, backpack -x.
  parts.torso = makeSprite(34, 50, 16, 46, (g) => {
    const hipX = 16;
    // assault pack (behind body)
    g.fillStyle = lingrad(g, 0, 6, 0, 34, [
      [0, shade(V.vest, -0.02)], [1, shade(V.vestDark, -0.25)],
    ]);
    rr(g, hipX - 15.5, 7, 10, 26, 3.5); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.9;
    rr(g, hipX - 15.5, 7, 10, 26, 3.5); g.stroke();
    // pack straps + roll
    g.fillStyle = shade(V.vestDark, -0.3);
    g.fillRect(hipX - 15, 12, 9, 1.6);
    g.fillRect(hipX - 15, 22, 9, 1.6);
    g.fillStyle = shade(V.uniformDark, -0.1);
    rr(g, hipX - 15, 3.8, 9, 4.5, 2); g.fill();
    ao(g, hipX - 10, 33, 7, 3, 0.35);

    // torso core (shirt) — hip to neck
    cloth(g, hipX - 8, 0, 17, 46, V.uniform);
    g.beginPath();
    g.moveTo(hipX - 7, 46);                       // hip back
    g.quadraticCurveTo(hipX - 9, 30, hipX - 7.5, 14);  // back
    g.quadraticCurveTo(hipX - 6.5, 2.5, hipX + 1, 2);  // shoulder top
    g.quadraticCurveTo(hipX + 8.5, 2.8, hipX + 9, 12); // chest top
    g.quadraticCurveTo(hipX + 10, 26, hipX + 7.5, 34); // chest → belly
    g.lineTo(hipX + 6.5, 46);                     // hip front
    g.closePath(); g.fill();

    // plate carrier
    g.fillStyle = lingrad(g, 0, 8, 0, 36, [
      [0, shade(V.vest, 0.14)], [0.4, V.vest], [1, shade(V.vestDark, -0.2)],
    ]);
    g.beginPath();
    g.moveTo(hipX - 6.5, 10);
    g.quadraticCurveTo(hipX + 1, 7.2, hipX + 8, 10.5);
    g.quadraticCurveTo(hipX + 9.4, 20, hipX + 7, 30);
    g.quadraticCurveTo(hipX + 1, 33.4, hipX - 5, 31);
    g.quadraticCurveTo(hipX - 7.6, 20, hipX - 6.5, 10);
    g.closePath(); g.fill();
    // MOLLE rows
    g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 0.8;
    for (let i = 0; i < 4; i++) {
      const y = 13.5 + i * 4.6;
      g.beginPath(); g.moveTo(hipX - 5.5, y); g.lineTo(hipX + 7.5, y - 0.8); g.stroke();
    }
    // double mag pouch on chest
    for (let i = 0; i < 2; i++) {
      const px = hipX + 0.5 + i * 4.4;
      g.fillStyle = lingrad(g, 0, 17, 0, 26, [[0, shade(V.vest, 0.1)], [1, shade(V.vestDark, -0.12)]]);
      rr(g, px, 17.5, 4, 8, 1.2); g.fill();
      g.fillStyle = shade(V.vest, 0.18);
      rr(g, px, 17.5, 4, 2.6, 1.2); g.fill();   // flap
      g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.6;
      rr(g, px, 17.5, 4, 8, 1.2); g.stroke();
      g.fillStyle = '#1d1d1a';
      g.fillRect(px + 1.4, 19.6, 1.2, 1.6);      // buckle
    }
    // radio on left chest strap
    g.fillStyle = '#232528';
    rr(g, hipX - 5.8, 12.5, 4.2, 7, 1); g.fill();
    g.fillStyle = 'rgba(200,215,235,0.25)';
    g.fillRect(hipX - 5.2, 13.2, 3, 1);
    g.strokeStyle = '#141517'; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(hipX - 4.6, 12.5); g.lineTo(hipX - 4.6, 8.6); g.stroke(); // antenna
    // admin pouch low
    g.fillStyle = shade(V.vestDark, 0.05);
    rr(g, hipX - 3.5, 26.5, 7.5, 5, 1.2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; rr(g, hipX - 3.5, 26.5, 7.5, 5, 1.2); g.stroke();
    // shoulder strap
    g.fillStyle = lingrad(g, 0, 2, 0, 12, [[0, shade(V.vest, 0.08)], [1, shade(V.vestDark, -0.1)]]);
    g.beginPath();
    g.moveTo(hipX - 4.5, 2.4); g.lineTo(hipX + 2.5, 2.2);
    g.lineTo(hipX + 5, 11.5); g.lineTo(hipX - 4.5, 11);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(hipX - 4, 2.6); g.lineTo(hipX + 4.6, 11.2); g.stroke();

    // belt + buckle
    g.fillStyle = lingrad(g, 0, 40, 0, 45, [[0, '#3a372e'], [1, '#26241d']]);
    g.fillRect(hipX - 7.2, 40.5, 14, 4.6);
    g.fillStyle = '#191813';
    g.fillRect(hipX - 7.2, 40.5, 14, 1);
    g.fillStyle = '#6d6a5e';
    rr(g, hipX + 1.5, 41.4, 3.4, 2.8, 0.6); g.fill();
    // belt pouch
    g.fillStyle = shade(V.uniformDark, -0.08);
    rr(g, hipX - 6.8, 38.5, 5, 6.5, 1.4); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.4)'; rr(g, hipX - 6.8, 38.5, 5, 6.5, 1.4); g.stroke();

    // cloth folds at waist + under vest
    fold(g, hipX - 6, 36, hipX + 6, 35.4, 0.12, 1.3, 0.24, 0.08);
    fold(g, hipX - 5, 38.8, hipX + 4, 38.4, -0.1, 1.1, 0.2, 0.07);
    fold(g, hipX + 6.8, 14, hipX + 8.6, 24, 0.15, 1, 0.2, 0.09);

    // collar
    g.fillStyle = shade(V.uniform, -0.12);
    g.beginPath();
    g.moveTo(hipX - 3.5, 2.6); g.quadraticCurveTo(hipX + 0.5, 0.4, hipX + 5, 3);
    g.lineTo(hipX + 4, 5.6); g.quadraticCurveTo(hipX + 0.5, 3.4, hipX - 3, 5.2);
    g.closePath(); g.fill();

    // AO under vest + at hip, rim light on chest
    ao(g, hipX + 0.5, 33.5, 9, 3.4, 0.32);
    ao(g, hipX, 45, 8, 3, 0.3);
    g.strokeStyle = 'rgba(255,214,160,0.2)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(hipX + 8.6, 12); g.quadraticCurveTo(hipX + 9.8, 22, hipX + 7.6, 31); g.stroke();
    grunge(g, hipX - 8, 4, 18, 42, rng, { n: 90, dark: 0.1, light: 0.04 });
  });

  // ---------------- pelvis ----------------
  parts.pelvis = makeSprite(22, 18, 11, 4, (g) => {
    cloth(g, 2, 1, 18, 16, V.uniform);
    rr(g, 2, 0.5, 18, 16, 5); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.22)';
    g.beginPath(); g.moveTo(11, 6); g.lineTo(10.2, 16); g.lineTo(12.2, 16); g.closePath(); g.fill();
    fold(g, 4, 6, 9, 11, 0.2, 1.1, 0.2, 0.07);
    fold(g, 13, 5.5, 18, 10, -0.2, 1.1, 0.2, 0.07);
    ao(g, 11, 2.5, 8, 2.6, 0.32);
    grunge(g, 3, 2, 16, 13, rng, { n: 30 });
  });

  // ---------------- upper arm ----------------
  // anchor at shoulder joint (6, 5); hangs down.
  parts.upperArm = makeSprite(13, 32, 6.5, 5, (g) => {
    const grad = lingrad(g, 1, 0, 12, 0, [
      [0, shade(V.uniform, -0.28)], [0.35, shade(V.uniform, 0.1)], [1, shade(V.uniform, -0.2)],
    ]);
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(1.5, 6);
    g.quadraticCurveTo(0.8, 1, 6.5, 0.8);      // deltoid
    g.quadraticCurveTo(12.2, 1, 11.6, 6.5);
    g.quadraticCurveTo(11.2, 16, 10.4, 27);    // toward elbow
    g.quadraticCurveTo(6.5, 30.4, 3.2, 27.5);
    g.quadraticCurveTo(2, 16, 1.5, 6);
    g.closePath(); g.fill();
    // shoulder patch
    g.fillStyle = shade(V.uniformDark, -0.05);
    rr(g, 3.4, 6.5, 6.6, 5, 1); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.5;
    rr(g, 3.4, 6.5, 6.6, 5, 1); g.stroke();
    g.fillStyle = 'rgba(190,180,150,0.35)';
    g.fillRect(4.4, 8, 4.6, 1.9);
    // elbow pad
    g.fillStyle = lingrad(g, 0, 24, 0, 31, [[0, shade(V.pad, 0.14)], [1, shade(V.pad, -0.25)]]);
    rr(g, 3, 24.5, 7.6, 6.5, 3); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.7;
    rr(g, 3, 24.5, 7.6, 6.5, 3); g.stroke();
    fold(g, 3, 14, 10.5, 15, 0.22, 1.1, 0.22, 0.08);
    fold(g, 3.4, 20, 10, 21, -0.18, 1, 0.18, 0.06);
    ao(g, 6.5, 4, 5.5, 2.4, 0.4);
    grunge(g, 2, 2, 10, 27, rng, { n: 34 });
  });

  // ---------------- forearm ----------------
  // anchor at elbow (5.5, 4)
  parts.foreArm = makeSprite(11, 28, 5.5, 4, (g) => {
    g.fillStyle = lingrad(g, 1, 0, 10, 0, [
      [0, shade(V.uniform, -0.3)], [0.4, shade(V.uniform, 0.08)], [1, shade(V.uniform, -0.22)],
    ]);
    g.beginPath();
    g.moveTo(1.6, 4.5);
    g.quadraticCurveTo(1.2, 1, 5.5, 0.9);
    g.quadraticCurveTo(9.8, 1, 9.4, 4.5);
    g.quadraticCurveTo(9, 14, 8.2, 22.5);      // taper to wrist
    g.quadraticCurveTo(5.5, 24.6, 3.4, 22.8);
    g.quadraticCurveTo(2.2, 14, 1.6, 4.5);
    g.closePath(); g.fill();
    // glove cuff
    g.fillStyle = lingrad(g, 0, 21, 0, 27, [[0, shade(V.glove, 0.1)], [1, shade(V.glove, -0.2)]]);
    rr(g, 2.6, 21.5, 6.4, 5.5, 2); g.fill();
    g.fillStyle = '#15140f';
    g.fillRect(3, 22.2, 5.6, 1);               // strap
    fold(g, 2.6, 10, 9, 10.6, 0.2, 1, 0.2, 0.07);
    fold(g, 3, 16, 8.6, 16.6, -0.16, 0.9, 0.16, 0.06);
    ao(g, 5.5, 3.4, 4.4, 2, 0.4);
    grunge(g, 2, 2, 8, 22, rng, { n: 26 });
  });

  // ---------------- gloved hands (one per grip pose) ----------------
  // Anchor = wrist. Painted large-ish (11x11) with knuckle plate, finger
  // seams, stitching. Poses: trigger, wrap (foregrip/knife), open, fist.
  const handPainter = (pose) => (g) => {
    const base = V.glove;
    const grad = lingrad(g, 0, 1, 0, 10, [
      [0, shade(base, 0.22)], [0.5, base], [1, shade(base, -0.3)],
    ]);
    g.fillStyle = grad;
    if (pose === 'open') {
      // relaxed open hand, fingers slightly curled
      g.beginPath();
      g.moveTo(2, 1.5);
      g.quadraticCurveTo(8.5, 0.8, 9.6, 4);
      g.quadraticCurveTo(10.4, 7.5, 8, 9.8);
      g.quadraticCurveTo(4.5, 11, 2.6, 8.5);
      g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.55;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(5.5 + i * 1.6, 3.2);
        g.quadraticCurveTo(6.4 + i * 1.6, 6.2, 5 + i * 1.6, 9.2);
        g.stroke();
      }
    } else {
      // closed grip mass
      g.beginPath();
      g.moveTo(2, 2);
      g.quadraticCurveTo(7.8, 0.6, 9.4, 3.4);
      g.quadraticCurveTo(10.6, 6.6, 8.6, 9);
      g.quadraticCurveTo(5, 10.8, 2.6, 8.6);
      g.closePath(); g.fill();
      // wrapped fingers
      g.strokeStyle = 'rgba(0,0,0,0.42)'; g.lineWidth = 0.55;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(4.2 + i * 1.45, 2.6);
        g.quadraticCurveTo(5.6 + i * 1.45, 5, 4.4 + i * 1.45, 8.6);
        g.stroke();
      }
      // finger tip highlights
      g.fillStyle = 'rgba(255,225,180,0.14)';
      for (let i = 0; i < 4; i++) g.fillRect(4 + i * 1.45, 7.6, 1, 1.4);
      if (pose === 'trigger') {
        // extended index finger along trigger guard
        g.fillStyle = grad;
        rr(g, 6.8, 8.2, 4.4, 2, 1); g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.4;
        g.beginPath(); g.moveTo(8.6, 8.4); g.lineTo(8.6, 10); g.stroke();
      }
    }
    // hard knuckle plate
    g.fillStyle = lingrad(g, 0, 1.5, 0, 4.5, [[0, shade(base, 0.34)], [1, shade(base, -0.05)]]);
    rr(g, 3.4, 1.4, 5.6, 3, 1.4); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.5;
    rr(g, 3.4, 1.4, 5.6, 3, 1.4); g.stroke();
    // knuckle ridges
    g.fillStyle = 'rgba(255,235,200,0.2)';
    for (let i = 0; i < 4; i++) g.fillRect(4.1 + i * 1.25, 2, 0.7, 0.7);
    // wrist strap + stitching
    g.fillStyle = '#17160f';
    g.fillRect(1.6, 0.6, 2.2, 8);
    g.strokeStyle = 'rgba(210,200,170,0.3)'; g.lineWidth = 0.35;
    g.setLineDash([0.7, 0.7]);
    g.beginPath(); g.moveTo(3, 1); g.lineTo(3, 8.4); g.stroke();
    g.setLineDash([]);
  };
  parts.handTrigger = makeSprite(12, 11, 2.5, 4.5, handPainter('trigger'));
  parts.handGrip = makeSprite(12, 11, 2.5, 4.5, handPainter('grip'));
  parts.handOpen = makeSprite(12, 11, 2.5, 4.5, handPainter('open'));
  parts.handFist = makeSprite(12, 11, 2.5, 4.5, handPainter('grip'));

  // ---------------- thigh ----------------
  // anchor at hip joint (7, 4)
  parts.thigh = makeSprite(15, 38, 7.5, 4, (g) => {
    g.fillStyle = lingrad(g, 1, 0, 14, 0, [
      [0, shade(V.uniform, -0.26)], [0.4, shade(V.uniform, 0.1)], [1, shade(V.uniform, -0.24)],
    ]);
    g.beginPath();
    g.moveTo(1.6, 5);
    g.quadraticCurveTo(1.4, 0.8, 7.5, 0.8);
    g.quadraticCurveTo(13.6, 0.8, 13.2, 5.5);
    g.quadraticCurveTo(12.6, 20, 11, 33);
    g.quadraticCurveTo(7.5, 35.8, 4.6, 33.4);
    g.quadraticCurveTo(2.6, 20, 1.6, 5);
    g.closePath(); g.fill();
    // cargo pocket
    g.fillStyle = shade(V.uniformDark, 0.02);
    rr(g, 3.6, 13, 8, 9, 1.4); g.fill();
    g.fillStyle = shade(V.uniform, 0.08);
    rr(g, 3.6, 13, 8, 3.2, 1.4); g.fill();      // flap
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.6;
    rr(g, 3.6, 13, 8, 9, 1.4); g.stroke();
    g.fillStyle = '#1d1c17';
    g.fillRect(6.8, 15.2, 1.6, 1.6);
    // holster strap hint
    g.fillStyle = 'rgba(20,18,14,0.5)';
    g.fillRect(2.4, 8.5, 10.5, 1.7);
    fold(g, 3, 25, 12, 26, 0.2, 1.1, 0.22, 0.07);
    fold(g, 3.5, 29.5, 11, 30.4, -0.14, 1, 0.18, 0.06);
    ao(g, 7.5, 3.6, 5.6, 2.6, 0.42);
    grunge(g, 2, 2, 11, 31, rng, { n: 36 });
  });

  // ---------------- shin + boot ----------------
  // anchor at knee (6.5, 4); boot toe faces +x.
  parts.shin = makeSprite(20, 40, 6.5, 4, (g) => {
    // knee pad
    g.fillStyle = lingrad(g, 0, 0, 0, 9, [[0, shade(V.pad, 0.2)], [1, shade(V.pad, -0.22)]]);
    rr(g, 2, 0.6, 9.4, 8.8, 3.4); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.8;
    rr(g, 2, 0.6, 9.4, 8.8, 3.4); g.stroke();
    g.strokeStyle = 'rgba(255,225,180,0.16)'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(3.4, 2.4); g.quadraticCurveTo(6.8, 1.2, 10.2, 2.6); g.stroke();
    // calf
    g.fillStyle = lingrad(g, 1, 0, 12, 0, [
      [0, shade(V.uniform, -0.28)], [0.4, shade(V.uniform, 0.06)], [1, shade(V.uniform, -0.26)],
    ]);
    g.beginPath();
    g.moveTo(2.6, 8);
    g.quadraticCurveTo(2, 18, 3.4, 26);
    g.lineTo(10, 26);
    g.quadraticCurveTo(11.4, 18, 10.8, 8);
    g.closePath(); g.fill();
    fold(g, 3.4, 14, 10.4, 14.6, 0.16, 1, 0.2, 0.06);
    // boot
    g.fillStyle = lingrad(g, 0, 25, 0, 37, [
      [0, shade(V.boot, 0.16)], [0.5, V.boot], [1, shade(V.boot, -0.3)],
    ]);
    g.beginPath();
    g.moveTo(3, 25.5);
    g.lineTo(2.6, 33.5);
    g.quadraticCurveTo(2.6, 35.4, 5, 35.6);     // heel
    g.lineTo(15.6, 36);
    g.quadraticCurveTo(18.4, 36, 17.8, 33.8);   // toe cap
    g.quadraticCurveTo(16.8, 31.4, 13, 30.6);
    g.quadraticCurveTo(11, 28.6, 10.6, 25.5);
    g.closePath(); g.fill();
    // sole
    g.fillStyle = '#171512';
    g.beginPath();
    g.moveTo(2.6, 34.4); g.lineTo(2.6, 36.2); g.lineTo(17.9, 36.6);
    g.quadraticCurveTo(18.6, 35.6, 18.2, 34.6);
    g.closePath(); g.fill();
    // laces
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.7;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(4.4, 26.5 + i * 2.4); g.lineTo(9.6, 27.5 + i * 2.4);
      g.stroke();
    }
    g.strokeStyle = 'rgba(255,220,170,0.18)'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(13.4, 31.2); g.quadraticCurveTo(16.4, 32, 17.2, 33.8); g.stroke();
    ao(g, 6.5, 3.4, 5, 2.4, 0.36);
    grunge(g, 2.6, 8, 9, 26, rng, { n: 30 });
    scratches(g, 4, 30, 12, 5, rng, { n: 5, color: 'rgba(160,150,130,0.25)' });
  });

  return parts;
}

// Painted round shadow blob reused for all characters/props.
export function makeShadowSprite() {
  const { cv, g } = makeCanvas(128, 40);
  const gr = g.createRadialGradient(64, 20, 2, 64, 20, 60);
  gr.addColorStop(0, 'rgba(4,4,6,0.42)');
  gr.addColorStop(0.6, 'rgba(4,4,6,0.25)');
  gr.addColorStop(1, 'rgba(4,4,6,0)');
  g.save();
  g.translate(64, 20); g.scale(1, 0.3); g.translate(-64, -20);
  g.fillStyle = gr;
  g.fillRect(0, -60, 128, 160);
  g.restore();
  return { cv, ax: 64, ay: 20, s: 1 / 2, w: 64, h: 20 };
}
