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

// Every operator used to be the same model in a different colour: same
// helmet, same pack, same pouches, so a Mythic skin was a recolour of the
// Common one and read as exactly that at gameplay distance. `headGear` and
// `backGear` give each one a piece of kit that changes its OUTLINE, which is
// the only thing that survives being 40 pixels tall on a phone.
//
//   headGear  none | nvg | hood | crest | antenna | visor
//   backGear  pack | slim | radio | tanks | plates | cloak
//
// They are spread so no two operators share a pair, and so the expensive
// tiers carry the additions that change the silhouette most (a full visor and
// pauldrons, a cloak) while the cheap ones stay close to the reference shape.
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
    headGear: 'none', backGear: 'pack',
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
    headGear: 'nvg', backGear: 'slim',
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
    headGear: 'hood', backGear: 'pack',
  },
  // -- equippable operator skins (crate/store cosmetics; see meta.js CATALOG) --
  viper: {
    seed: 6613,
    uniform: '#243325', uniformDark: '#17211a',
    vest: '#2c3d2a', vestDark: '#1e2a1c',
    helmet: '#202b1f',
    glove: '#161d15',
    boot: '#11150f',
    skin: '#8a6f52',
    masked: true,
    pad: '#1a2417',
    headGear: 'hood', backGear: 'slim',
  },
  arctic: {
    seed: 8842,
    uniform: '#c7d0d6', uniformDark: '#9aa6ad',
    vest: '#d9e2e6', vestDark: '#aeb9be',
    helmet: '#b7c2c8',
    glove: '#8f9aa0',
    boot: '#5c6469',
    skin: COL.skin,
    masked: false,
    pad: '#9fabb1',
    headGear: 'antenna', backGear: 'slim',
  },
  // The roster above ran green / grey / tan / green / white, which is two
  // pairs that read alike at gameplay distance — an operator you cannot name
  // from its silhouette and value is not really a second skin. These five are
  // picked to sit apart from those and from each other: each one owns a
  // different corner of the palette (burnt orange, near-black blue, oxide
  // brown, cold steel, black-and-gold) and a different mask state, so the
  // whole set stays distinguishable at a glance.
  ember: {
    seed: 3301,
    uniform: '#5a3320', uniformDark: '#3e2214',
    vest: '#7a4526', vestDark: '#57301a',
    helmet: '#4e2c1a',
    glove: '#331d11',
    boot: '#26150c',
    skin: '#8a6a4e',
    masked: true,
    pad: '#42241a',
    headGear: 'crest', backGear: 'pack',
  },
  midnight: {
    seed: 5158,
    uniform: '#1d2436', uniformDark: '#131824',
    vest: '#232b40', vestDark: '#171d2b',
    helmet: '#1a2131',
    glove: '#10141d',
    boot: '#0c0f16',
    skin: '#7d6249',
    masked: true,
    pad: '#161c29',
    headGear: 'nvg', backGear: 'radio',
  },
  rust: {
    seed: 7724,
    uniform: '#6b4a32', uniformDark: '#4d3423',
    vest: '#7d5535', vestDark: '#5a3d26',
    helmet: '#5e412c',
    glove: '#3d2a1c',
    boot: '#2e2015',
    skin: COL.skin,
    masked: false,
    pad: '#4a3323',
    headGear: 'crest', backGear: 'tanks',
  },
  vanguard: {
    seed: 2276,
    uniform: '#3c4650', uniformDark: '#2b333b',
    vest: '#55626e', vestDark: '#3e4954',
    helmet: '#46515c',
    glove: '#2a3138',
    boot: '#1f252a',
    skin: COL.skin,
    masked: false,
    pad: '#333b43',
    headGear: 'visor', backGear: 'plates',
  },
  // Gold pads against near-black kit: the one variant whose accent colour is
  // not a shade of its own uniform, which is what makes it read as the
  // trophy skin rather than another dark one.
  sable: {
    seed: 9934,
    uniform: '#1f1e22', uniformDark: '#141317',
    vest: '#2b2830', vestDark: '#1c1a20',
    helmet: '#232128',
    glove: '#151418',
    boot: '#100f13',
    skin: '#6f563f',
    masked: true,
    pad: '#8a6a2e',
    headGear: 'visor', backGear: 'cloak',
  },
};

// ---- head gear -----------------------------------------------------------
// Drawn last on the head sprite, in the head's own coordinates: the helmet
// crown sits around y 0.4..10 and the face fills y 8..21, with the front of
// the head at +x. Each of these is chosen to break the outline somewhere
// different — forward, backward, or up — so two operators never read alike
// even in pure silhouette.
function headGear(g, cx, V) {
  const kind = V.headGear;
  if (!kind || kind === 'none') return;
  const shell = V.helmet;

  if (kind === 'nvg') {
    // Quad-tube night vision, folded down over the eyes. The one piece of kit
    // that pushes the outline forward, so it is unmistakable side-on.
    g.fillStyle = shade(shell, -0.42);
    rr(g, cx + 4.6, 1.6, 5.2, 3.0, 0.8); g.fill();          // helmet shroud
    g.fillStyle = lingrad(g, 0, 2, 0, 9, [[0, shade(shell, 0.1)], [1, shade(shell, -0.4)]]);
    g.beginPath();                                           // arm
    g.moveTo(cx + 8.4, 2.4); g.lineTo(cx + 12.6, 4.6);
    g.lineTo(cx + 12.0, 6.2); g.lineTo(cx + 8.0, 4.2);
    g.closePath(); g.fill();
    for (const [ox, oy] of [[0, 0], [0, 3.4]]) {             // two tube pairs
      g.fillStyle = lingrad(g, 0, 4 + oy, 0, 9 + oy, [
        [0, '#3b4046'], [0.5, '#22262b'], [1, '#14171a'],
      ]);
      rr(g, cx + 11.0 + ox, 4.4 + oy, 5.6, 3.0, 1.3); g.fill();
      g.fillStyle = '#0a0c0e';
      g.beginPath(); g.ellipse(cx + 16.2 + ox, 5.9 + oy, 0.9, 1.2, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(122,220,190,0.5)';                 // phosphor
      g.beginPath(); g.ellipse(cx + 16.1 + ox, 5.9 + oy, 0.5, 0.8, 0, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = 'rgba(226,232,240,0.18)';
    g.fillRect(cx + 11.4, 4.5, 5.0, 0.5);
    g.fillRect(cx + 11.4, 7.9, 5.0, 0.5);
  } else if (kind === 'hood') {
    // Shemagh / shroud pulled over the helmet and down the neck — the outline
    // grows backward and loses the helmet's hard rim.
    const c = V.uniform;
    g.fillStyle = lingrad(g, 0, -1, 0, 20, [
      [0, shade(c, 0.2)], [0.45, c], [1, shade(V.uniformDark, -0.2)],
    ]);
    g.beginPath();
    g.moveTo(cx + 8.4, 3.2);
    g.quadraticCurveTo(cx + 6, -2.4, cx - 3, -1.8);
    g.quadraticCurveTo(cx - 13, -1.0, cx - 13.4, 8);
    g.quadraticCurveTo(cx - 14.2, 16, cx - 9.6, 21.5);
    g.lineTo(cx - 4.6, 22.6);
    g.quadraticCurveTo(cx - 8.4, 15, cx - 7.6, 8.4);
    g.quadraticCurveTo(cx - 6.6, 3.4, cx + 1, 2.6);
    g.closePath(); g.fill();
    // fold shadows so the cloth is not a flat plate
    g.strokeStyle = withA(shade(V.uniformDark, -0.4), 0.55); g.lineWidth = 0.8;
    for (const [ax0, ay0, ax1, ay1] of [[-11.6, 3.4, -8.4, 10], [-13, 9.6, -9.2, 16]]) {
      g.beginPath();
      g.moveTo(cx + ax0, ay0);
      g.quadraticCurveTo(cx + (ax0 + ax1) / 2 - 1, (ay0 + ay1) / 2, cx + ax1, ay1);
      g.stroke();
    }
    g.strokeStyle = 'rgba(255,224,180,0.20)'; g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(cx + 1.4, 1.0); g.quadraticCurveTo(cx - 6, -0.6, cx - 11.6, 4.2); g.stroke();
  } else if (kind === 'crest') {
    // Longitudinal rail spine with a strobe on the back plate: reads as a
    // ridge along the top of the skull.
    g.fillStyle = lingrad(g, 0, -3.4, 0, 2, [
      [0, shade(shell, 0.22)], [1, shade(shell, -0.36)],
    ]);
    g.beginPath();
    g.moveTo(cx - 7.4, 2.0);
    g.quadraticCurveTo(cx - 3, -3.6, cx + 3.4, -3.2);
    g.quadraticCurveTo(cx + 7.6, -2.6, cx + 8.6, 1.4);
    g.quadraticCurveTo(cx + 3, -1.0, cx - 3.6, -0.4);
    g.closePath(); g.fill();
    g.fillStyle = shade(shell, -0.5);
    for (let i = 0; i < 5; i++) rr(g, cx - 5.4 + i * 2.7, -2.6, 1.1, 2.0, 0.3), g.fill();
    g.fillStyle = 'rgba(226,232,240,0.24)';
    g.fillRect(cx - 6.6, -2.4, 14.4, 0.5);
    // IR strobe on the rear plate
    g.fillStyle = shade(shell, -0.44);
    rr(g, cx - 10.4, 1.6, 3.4, 3.0, 0.7); g.fill();
    g.fillStyle = 'rgba(240,120,90,0.75)';
    g.beginPath(); g.arc(cx - 8.7, 3.1, 0.75, 0, Math.PI * 2); g.fill();
  } else if (kind === 'antenna') {
    // Whip antenna off the back of the helmet plus a small counterweight —
    // the outline gains a thin vertical, which nothing else here has.
    g.fillStyle = shade(shell, -0.4);
    rr(g, cx - 10.4, 2.0, 4.0, 3.4, 0.8); g.fill();          // radio mount
    g.fillStyle = 'rgba(226,232,240,0.16)';
    g.fillRect(cx - 10.1, 2.2, 3.4, 0.5);
    g.strokeStyle = '#181a1e'; g.lineWidth = 0.85; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(cx - 8.6, 2.2);
    g.quadraticCurveTo(cx - 10.6, -5.2, cx - 6.4, -9.4);
    g.stroke();
    g.strokeStyle = 'rgba(226,232,240,0.28)'; g.lineWidth = 0.35;
    g.beginPath();
    g.moveTo(cx - 8.4, 1.8); g.quadraticCurveTo(cx - 10.2, -5.0, cx - 6.6, -9.0);
    g.stroke();
    g.fillStyle = '#2c3036';
    g.beginPath(); g.arc(cx - 6.3, -9.6, 0.8, 0, Math.PI * 2); g.fill();
    // counterweight pouch on the rear of the shell
    g.fillStyle = lingrad(g, 0, 5, 0, 10, [[0, shade(shell, -0.14)], [1, shade(shell, -0.42)]]);
    rr(g, cx - 11.0, 5.2, 4.6, 4.6, 1.2); g.fill();
  } else if (kind === 'visor') {
    // Full-face armoured visor. The most expensive silhouette change in the
    // set: it closes the face off entirely, so the head becomes one smooth
    // mass instead of helmet-plus-jaw.
    g.fillStyle = lingrad(g, 0, 6, 0, 22, [
      [0, shade(shell, 0.12)], [0.42, shade(shell, -0.14)], [1, shade(shell, -0.46)],
    ]);
    g.beginPath();
    g.moveTo(cx - 8.6, 8.6);
    g.quadraticCurveTo(cx + 2, 9.6, cx + 9.2, 8.2);
    g.quadraticCurveTo(cx + 11.4, 13, cx + 9.4, 17.4);
    g.quadraticCurveTo(cx + 6, 22.4, cx - 1, 22.6);
    g.quadraticCurveTo(cx - 6.6, 22.4, cx - 8.2, 18.6);
    g.closePath(); g.fill();
    // the lens band
    g.fillStyle = '#0a0c10';
    g.beginPath();
    g.moveTo(cx - 6.6, 11.0);
    g.quadraticCurveTo(cx + 2, 12.0, cx + 9.4, 10.6);
    g.lineTo(cx + 8.8, 15.0);
    g.quadraticCurveTo(cx + 2, 16.4, cx - 6.4, 15.2);
    g.closePath(); g.fill();
    g.fillStyle = withA(V.pad, 0.55);
    g.beginPath();
    g.moveTo(cx - 5.6, 11.8);
    g.quadraticCurveTo(cx + 2, 12.7, cx + 8.6, 11.4);
    g.lineTo(cx + 8.2, 13.4);
    g.quadraticCurveTo(cx + 2, 14.6, cx - 5.4, 13.6);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.22)';
    g.beginPath();
    g.moveTo(cx + 1.6, 11.9); g.lineTo(cx + 6.6, 11.4);
    g.lineTo(cx + 6.2, 12.6); g.lineTo(cx + 1.4, 13.0);
    g.closePath(); g.fill();
    // filter vents on the jaw
    g.fillStyle = shade(shell, -0.55);
    for (let i = 0; i < 3; i++) rr(g, cx + 1.6 + i * 2.2, 18.0, 1.5, 2.6, 0.4), g.fill();
    g.strokeStyle = 'rgba(226,232,240,0.20)'; g.lineWidth = 0.5;
    g.beginPath();
    g.moveTo(cx - 8.2, 9.4); g.quadraticCurveTo(cx + 1, 10.4, cx + 9.0, 9.0); g.stroke();
  }
}

// ---- back gear -----------------------------------------------------------
// Drawn FIRST on the torso sprite, so the body covers whatever overlaps it.
// Torso coordinates: hip pivot at (hipX, 46), shoulders around y 2..10, the
// chest faces +x and the back is -x. These change the outline where it counts
// on a side-on character — behind the shoulders and above them.
function backGear(g, hipX, V, ao) {
  const kind = V.backGear || 'pack';
  const packGrad = (y0, y1) => lingrad(g, 0, y0, 0, y1, [
    [0, shade(V.vest, -0.02)], [1, shade(V.vestDark, -0.25)],
  ]);

  if (kind === 'pack') {
    // Standard assault pack — the reference shape.
    g.fillStyle = packGrad(6, 34);
    rr(g, hipX - 15.5, 7, 10, 26, 3.5); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.9;
    rr(g, hipX - 15.5, 7, 10, 26, 3.5); g.stroke();
    g.fillStyle = shade(V.vestDark, -0.3);
    g.fillRect(hipX - 15, 12, 9, 1.6);
    g.fillRect(hipX - 15, 22, 9, 1.6);
    g.fillStyle = shade(V.uniformDark, -0.1);
    rr(g, hipX - 15, 3.8, 9, 4.5, 2); g.fill();
    ao(g, hipX - 10, 33, 7, 3, 0.35);
  } else if (kind === 'slim') {
    // Low-profile plate bag: short, tight to the spine. Reads as a lighter
    // operator without changing where the body sits.
    g.fillStyle = packGrad(9, 28);
    rr(g, hipX - 12.4, 10, 7, 18, 2.4); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.8;
    rr(g, hipX - 12.4, 10, 7, 18, 2.4); g.stroke();
    g.fillStyle = shade(V.vestDark, -0.32);
    g.fillRect(hipX - 12, 17, 6.2, 1.3);
    // two compression straps running down it
    g.strokeStyle = withA(shade(V.uniformDark, -0.3), 0.8); g.lineWidth = 0.7;
    for (const sx of [hipX - 10.6, hipX - 7.6]) {
      g.beginPath(); g.moveTo(sx, 10.6); g.lineTo(sx, 27.4); g.stroke();
    }
    ao(g, hipX - 8, 28, 5, 2.4, 0.3);
  } else if (kind === 'radio') {
    // Manpack radio with a folded whip: a tall box plus a vertical, which is
    // the tallest outline in the set.
    g.fillStyle = packGrad(4, 32);
    rr(g, hipX - 15.5, 5, 10, 27, 2.0); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.9;
    rr(g, hipX - 15.5, 5, 10, 27, 2.0); g.stroke();
    // handset pouch and faceplate
    g.fillStyle = shade(V.vestDark, -0.38);
    rr(g, hipX - 14.4, 8.4, 7.6, 6.2, 0.8); g.fill();
    g.fillStyle = 'rgba(120,200,150,0.42)';
    g.fillRect(hipX - 13.4, 10.0, 5.4, 1.5);
    g.fillStyle = shade(V.vest, 0.14);
    for (let i = 0; i < 3; i++) g.fillRect(hipX - 13.6 + i * 2.6, 17.4, 1.7, 1.7);
    // whip antenna
    g.strokeStyle = '#181a1e'; g.lineWidth = 0.9; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(hipX - 13.2, 5.6);
    g.quadraticCurveTo(hipX - 16.6, -3.4, hipX - 12.4, -7.4);
    g.stroke();
    g.strokeStyle = 'rgba(226,232,240,0.26)'; g.lineWidth = 0.35;
    g.beginPath();
    g.moveTo(hipX - 13.0, 5.2);
    g.quadraticCurveTo(hipX - 16.2, -3.2, hipX - 12.6, -7.0);
    g.stroke();
    ao(g, hipX - 10, 32, 7, 3, 0.35);
  } else if (kind === 'tanks') {
    // Twin scavenged cylinders on a frame — a bumpy, industrial back line
    // that no other operator has.
    g.fillStyle = shade(V.vestDark, -0.34);
    rr(g, hipX - 14.2, 8, 8.6, 22, 1.4); g.fill();     // frame
    for (const cy of [13.2, 23.4]) {
      g.fillStyle = lingrad(g, hipX - 15, 0, hipX - 6, 0, [
        [0, shade(V.vest, -0.24)], [0.4, shade(V.vest, 0.16)], [1, shade(V.vestDark, -0.34)],
      ]);
      rr(g, hipX - 16.4, cy - 4.4, 9.4, 8.8, 4.2); g.fill();
      g.fillStyle = 'rgba(226,232,240,0.16)';
      rr(g, hipX - 15.4, cy - 3.6, 2.0, 7.2, 1.0); g.fill();
      g.fillStyle = shade(V.uniformDark, -0.25);      // collar
      rr(g, hipX - 8.4, cy - 2.0, 2.2, 4.0, 0.6); g.fill();
    }
    // hose looping from the top tank to the shoulder
    g.strokeStyle = '#1a1c1f'; g.lineWidth = 1.3; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(hipX - 7.4, 11.4);
    g.quadraticCurveTo(hipX - 2.6, 6.2, hipX + 1.6, 9.4);
    g.stroke();
    ao(g, hipX - 10, 30, 7, 3, 0.35);
  } else if (kind === 'plates') {
    // Breacher armour: a hard pauldron over the near shoulder and a heavy
    // back plate. The one outline in the set that gets visibly *wider*.
    g.fillStyle = packGrad(9, 30);
    rr(g, hipX - 13.6, 10, 8, 20, 1.6); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.9;
    rr(g, hipX - 13.6, 10, 8, 20, 1.6); g.stroke();
    // segmented back plate
    g.fillStyle = shade(V.vest, 0.1);
    for (let i = 0; i < 3; i++) {
      rr(g, hipX - 13.0, 11.4 + i * 6.0, 6.8, 4.6, 1.0); g.fill();
    }
    ao(g, hipX - 9, 30, 6, 2.6, 0.32);
    // The pauldron itself is not drawn here — it sits ON the shoulder, so it
    // goes in backGearOver() after the torso body, or the body would bury it.
  } else if (kind === 'cloak') {
    // Short shoulder cloak. Falls from the collar to mid-thigh behind the
    // body: a long soft mass where every other operator has a hard box, which
    // is why it is on the one skin at the top of the table.
    const c = shade(V.uniformDark, -0.12);
    g.fillStyle = lingrad(g, 0, 2, 0, 48, [
      [0, shade(c, 0.24)], [0.35, c], [1, shade(c, -0.42)],
    ]);
    // Swept well clear of the body. Hugging the spine at -16 the cloak merged
    // with the legs in silhouette and the one skin at the top of the table
    // read as the reference shape again; it has to stand off the back to be
    // an outline of its own.
    g.beginPath();
    g.moveTo(hipX + 2.0, 3.0);
    g.quadraticCurveTo(hipX - 9.0, 1.0, hipX - 13.6, 8.0);
    g.quadraticCurveTo(hipX - 22.6, 24, hipX - 21.0, 46);
    g.quadraticCurveTo(hipX - 17.0, 49.6, hipX - 10.4, 47.4);
    g.quadraticCurveTo(hipX - 10.0, 26, hipX - 5.4, 12.0);
    g.quadraticCurveTo(hipX - 2.4, 5.4, hipX + 2.6, 5.2);
    g.closePath(); g.fill();
    // folds
    g.strokeStyle = withA(shade(c, -0.5), 0.6); g.lineWidth = 0.9;
    for (const [x0, y0, x1, y1] of [[-12.4, 12, -17.4, 42], [-8.6, 16, -11.4, 44]]) {
      g.beginPath();
      g.moveTo(hipX + x0, y0);
      g.quadraticCurveTo(hipX + (x0 + x1) / 2 - 1.6, (y0 + y1) / 2, hipX + x1, y1);
      g.stroke();
    }
    // trim along the leading edge, in the variant's accent colour
    g.strokeStyle = withA(V.pad, 0.75); g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(hipX + 2.2, 4.2);
    g.quadraticCurveTo(hipX - 3.0, 5.6, hipX - 6.0, 12.6);
    g.quadraticCurveTo(hipX - 10.0, 27, hipX - 10.6, 46.8);
    g.stroke();
    // collar clasp
    g.fillStyle = V.pad;
    g.beginPath(); g.arc(hipX + 1.2, 4.6, 1.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.3)';
    g.beginPath(); g.arc(hipX + 0.7, 4.1, 0.6, 0, Math.PI * 2); g.fill();
    ao(g, hipX - 16, 47, 8, 3, 0.3);
  }
}

// Back gear that belongs in FRONT of the torso body — a pauldron sits on the
// shoulder, not behind it. Called at the end of the torso painter.
function backGearOver(g, hipX, V) {
  if (V.backGear !== 'plates') return;
  g.fillStyle = lingrad(g, 0, -2, 0, 16, [
    [0, shade(V.vest, 0.30)], [0.45, V.vest], [1, shade(V.vestDark, -0.32)],
  ]);
  g.beginPath();
  g.moveTo(hipX - 8.6, 5.4);
  g.quadraticCurveTo(hipX + 0.5, -3.4, hipX + 11.4, 3.6);
  g.quadraticCurveTo(hipX + 13.2, 8.6, hipX + 10.6, 13.6);
  g.quadraticCurveTo(hipX + 0.5, 7.8, hipX - 7.8, 13.2);
  g.closePath(); g.fill();
  // lames
  g.strokeStyle = 'rgba(0,0,0,0.42)'; g.lineWidth = 0.85;
  for (const t of [0.34, 0.62]) {
    g.beginPath();
    g.moveTo(hipX - 8.4 + t * 3.2, 6.0 + t * 6.2);
    g.quadraticCurveTo(hipX + 0.5, -2.2 + t * 9, hipX + 11.0 - t * 1.0, 4.4 + t * 8);
    g.stroke();
  }
  g.strokeStyle = 'rgba(255,224,180,0.30)'; g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(hipX - 8.0, 4.8); g.quadraticCurveTo(hipX + 0.5, -2.8, hipX + 10.9, 3.2); g.stroke();
  // rivets along the edge
  g.fillStyle = 'rgba(226,232,240,0.28)';
  for (let i = 0; i < 4; i++) {
    const t = 0.18 + i * 0.22;
    const px = hipX - 8.0 + t * 19, py = 4.8 - Math.sin(t * Math.PI) * 6.4 + t * 2;
    g.beginPath(); g.arc(px, py, 0.5, 0, Math.PI * 2); g.fill();
  }
}

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
  // Box 26x28 anchored at the neck base (13,26), padded out to 42x38 so head
  // gear has somewhere to go: an NVG arm reaches forward past the old right
  // wall, a hood falls behind the old left one and an antenna stands above
  // the old ceiling. The painter translates by the pad and the anchor moves
  // with it, so every coordinate below is unchanged and the head still hangs
  // off the same point on the neck.
  const HP = { l: 8, t: 15 };
  parts.head = makeSprite(26 + HP.l + 10, 28 + HP.t, 13 + HP.l, 26 + HP.t, (g) => {
    g.translate(HP.l, HP.t);
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
    headGear(g, cx, V);
    grunge(g, 4, 0, 18, 11, rng, { n: 40, dark: 0.12, light: 0.06 });
  });

  // ---------------- torso ----------------
  // box 34x50, anchor at hip pivot (16, 46). Chest faces +x, backpack -x.
  // Padded out from 34x50 so back gear has room: a radio antenna stands above
  // the old ceiling, a cloak falls past the old left wall and pauldrons reach
  // past the old right one. Same trick as the head — translate by the pad and
  // move the anchor with it, so every coordinate below is untouched.
  const TP = { l: 22, t: 10, r: 8 };
  parts.torso = makeSprite(34 + TP.l + TP.r, 50 + TP.t, 16 + TP.l, 46 + TP.t, (g) => {
    g.translate(TP.l, TP.t);
    const hipX = 16;
    backGear(g, hipX, V, ao);

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
    backGearOver(g, hipX, V);
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
