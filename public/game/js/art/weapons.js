// Original weapon designs, painted at ASSET_SCALE with machined-metal
// gradients, polymer texture, wear on edges and engraved detail. Each weapon
// carries its gameplay stats plus named attachment points (grips, muzzle,
// ejection port, magazine) so the rig can place hands exactly on the grips
// and animate the magazine / bolt as separate painted sprites.

import {
  makeSprite, lingrad, radgrad, rr, grunge, scratches, shade, withA, COL,
} from './paint.js';
import { makeRng } from '../engine/math.js';

const rng = makeRng(4242);

// Machined metal fill: bright top edge, mid tone, dark under-shadow.
function metal(g, y0, y1, base = COL.gunmetal) {
  return lingrad(g, 0, y0, 0, y1, [
    [0, shade(base, 0.3)],
    [0.18, shade(base, 0.08)],
    [0.55, base],
    [1, shade(base, -0.38)],
  ]);
}
function polymer(g, y0, y1, base = COL.polymer) {
  return lingrad(g, 0, y0, 0, y1, [
    [0, shade(base, 0.16)],
    [0.5, base],
    [1, shade(base, -0.3)],
  ]);
}
// Fine speckle so polymer reads as textured, not flat.
function speckle(g, x, y, w, h, n = 60) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = rng.chance(0.5) ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)';
    g.fillRect(x + rng() * w, y + rng() * h, 0.5, 0.5);
  }
}

// ============================ VK-77 "VANDAL" ============================
// Original 7.62 battle-rifle silhouette: short-stroke piston upper, full
// rail, skeleton stock, canted iron + red-dot. Painted in weapon space:
// origin (0,0) = trigger-hand grip point, muzzle faces +x.

// Emissive energy core: additive glow strip + bright filament. Drawn on top
// of a recoloured body so energy weapons read as "powered".
function drawCore(g, x0, y0, x1, y1, c) {
  const [r, gg, b] = c;
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  g.strokeStyle = `rgba(${r},${gg},${b},0.32)`; g.lineWidth = 5;
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  g.strokeStyle = `rgba(${Math.min(255, r + 90)},${Math.min(255, gg + 90)},${Math.min(255, b + 90)},0.95)`;
  g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  g.restore();
}

function paintRifleBody(variant, finish) {
  const dark = variant === 'phantom';
  const rec = (finish && finish.rec) || (dark ? '#2c2e33' : COL.gunmetal);
  const poly = (finish && finish.poly) || (dark ? '#232529' : COL.polymer);
  // box: x -20..+40 (60), y -12..+8 (20); anchor at (20,12) inside sprite.
  return makeSprite(60, 20, 20, 12, (g) => {
    g.translate(20, 12);  // move origin to grip point

    // -- skeleton stock (-20..-6)
    g.fillStyle = polymer(g, -8, 2, poly);
    g.beginPath();
    g.moveTo(-6, -7.4);
    g.lineTo(-16.5, -6.6);
    g.quadraticCurveTo(-19.6, -6.4, -19.4, -3.4);
    g.lineTo(-19.8, 1.6);                       // butt pad
    g.lineTo(-16.6, 1.4);
    g.lineTo(-9, -1.2);
    g.lineTo(-6, -1);
    g.closePath(); g.fill();
    // stock cutout
    g.fillStyle = 'rgba(8,9,11,0.9)';
    g.beginPath();
    g.moveTo(-9.6, -5.2); g.lineTo(-15.8, -4.6);
    g.lineTo(-15.4, -1.6); g.lineTo(-10, -2.6);
    g.closePath(); g.fill();
    // butt pad
    g.fillStyle = '#191a1c';
    g.beginPath();
    g.moveTo(-19.4, -6.5); g.lineTo(-20.4, -6.3); g.lineTo(-20.8, 1.8); g.lineTo(-19.6, 1.8);
    g.closePath(); g.fill();
    // cheek riser
    g.fillStyle = polymer(g, -9, -6, shade(poly, 0.06));
    rr(g, -15, -8.6, 7.5, 2.6, 1); g.fill();

    // -- lower receiver + grip
    g.fillStyle = metal(g, -6, 4, rec);
    g.beginPath();
    g.moveTo(-6.5, -6.8);
    g.lineTo(10.5, -6.8);
    g.lineTo(10.5, -0.4);
    g.lineTo(6.2, 0.4);          // mag well front
    g.lineTo(1.8, 0.2);
    g.lineTo(-1, -0.6);
    g.lineTo(-6.5, -0.8);
    g.closePath(); g.fill();
    // pistol grip (hand anchors here at 0,0)
    g.fillStyle = polymer(g, -1, 8, poly);
    g.beginPath();
    g.moveTo(-1.2, -1);
    g.quadraticCurveTo(-2.8, 3.4, -4.4, 6.6);
    g.quadraticCurveTo(-4.6, 8, -2.6, 8);
    g.quadraticCurveTo(-0.4, 7.8, 0.4, 5);
    g.lineTo(1.6, -0.6);
    g.closePath(); g.fill();
    // grip texture
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.4;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(-1.8 - i * 0.8, 1.5 + i * 1.6);
      g.lineTo(0.2 - i * 0.7, 2 + i * 1.6);
      g.stroke();
    }
    // trigger guard + trigger
    g.strokeStyle = shade(rec, -0.15); g.lineWidth = 1;
    g.beginPath();
    g.moveTo(1.6, 0);
    g.quadraticCurveTo(4.6, 3.6, 7.4, 0.4);
    g.stroke();
    g.strokeStyle = '#1a1b1e'; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(3.8, 0.2); g.quadraticCurveTo(3.4, 1.8, 4.4, 2.6); g.stroke();

    // -- upper receiver (flat top)
    g.fillStyle = metal(g, -10.4, -6, shade(rec, 0.03));
    rr(g, -7, -10.6, 24.5, 4.4, 0.8); g.fill();
    // picatinny rail teeth
    g.fillStyle = 'rgba(0,0,0,0.42)';
    for (let x = -6; x < 16.4; x += 1.7) g.fillRect(x, -11, 0.9, 1);
    // ejection port (bolt sprite overlays here)
    g.fillStyle = '#101114';
    rr(g, 6.8, -6.4, 5.8, 2.6, 0.6); g.fill();
    // engraved detail
    g.fillStyle = 'rgba(210,218,228,0.28)';
    g.font = '1.8px monospace';
    g.fillText('VK-77', -5.4, -7.6);
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.35;
    g.strokeRect(-6, -9.6, 7.6, 2.6);

    // -- handguard with M-LOK slots (10.5..26)
    g.fillStyle = polymer(g, -9.6, -3, shade(poly, 0.05));
    rr(g, 10.5, -9.8, 16, 6.2, 1.4); g.fill();
    g.fillStyle = 'rgba(8,9,11,0.85)';
    for (let i = 0; i < 3; i++) { rr(g, 12.4 + i * 4.6, -7.4, 3, 1.4, 0.7); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,0.42)';
    for (let x = 11.2; x < 26; x += 1.7) g.fillRect(x, -10.2, 0.9, 0.9);
    // front support-hand stop
    g.fillStyle = polymer(g, -4, -1, poly);
    g.beginPath();
    g.moveTo(22.4, -3.6); g.lineTo(25.6, -3.6); g.lineTo(24.8, -0.8); g.lineTo(22.8, -1);
    g.closePath(); g.fill();

    // -- barrel + gas block + muzzle brake (26..40)
    g.fillStyle = metal(g, -6.6, -4, shade(rec, -0.08));
    g.fillRect(26.5, -6.4, 8.5, 2.3);
    g.fillStyle = metal(g, -8.4, -4.4, rec);
    rr(g, 27.5, -8.6, 2.6, 3, 0.5); g.fill();  // gas block
    // muzzle brake with side ports
    g.fillStyle = metal(g, -7.4, -3.4, shade(rec, 0.04));
    rr(g, 35, -7.4, 5, 4.2, 1); g.fill();
    g.fillStyle = '#0e0f11';
    g.fillRect(36.2, -7.8, 1, 5);
    g.fillRect(38, -7.8, 1, 5);

    // -- optics: low-profile red dot
    g.fillStyle = metal(g, -14.6, -10.6, '#26282c');
    rr(g, -1.5, -14.8, 7.5, 4.4, 1); g.fill();
    g.fillStyle = 'rgba(10,11,13,1)';
    rr(g, -0.6, -14, 2.2, 3, 0.5); g.fill();
    // lens with red dot glint
    g.fillStyle = lingrad(g, 0, -14, 0, -11, [[0, '#3c5a66'], [1, '#152229']]);
    rr(g, 4.2, -14.2, 1.5, 3.4, 0.4); g.fill();
    g.fillStyle = '#ff5a48';
    g.fillRect(4.6, -13, 0.7, 0.7);
    // front sight post (folded)
    g.fillStyle = shade(rec, -0.1);
    rr(g, 24, -11.6, 3, 1.4, 0.4); g.fill();

    // -- wear pass
    scratches(g, -18, -10, 56, 16, rng, { n: 26, color: 'rgba(200,208,220,0.16)' });
    grunge(g, -19, -11, 58, 18, rng, { n: 70, dark: 0.1, light: 0.04 });
    speckle(g, -19, -8, 14, 9, 40);
    speckle(g, 10.5, -10, 16, 7, 40);
    // top edge light
    g.strokeStyle = 'rgba(255,215,165,0.22)'; g.lineWidth = 0.6;
    g.beginPath(); g.moveTo(-6.8, -10.7); g.lineTo(17.4, -10.7); g.stroke();
    if (finish && finish.core) drawCore(g, -4, -8.4, 15.5, -8.4, finish.core);
  });
}

function paintRifleMag(variant) {
  const poly = variant === 'phantom' ? '#232529' : COL.polymer;
  // curved 30-rd magazine; anchor at top (feed) point.
  return makeSprite(10, 16, 5, 1, (g) => {
    g.translate(5, 1);
    g.fillStyle = lingrad(g, -4, 0, 5, 0, [
      [0, shade(poly, 0.14)], [0.5, poly], [1, shade(poly, -0.3)],
    ]);
    g.beginPath();
    g.moveTo(-3.4, 0);
    g.lineTo(3.4, 0);
    g.quadraticCurveTo(4.4, 7, 2.8, 12.6);     // curved front
    g.quadraticCurveTo(0.2, 14.4, -2.6, 13.2); // base plate
    g.quadraticCurveTo(-4.6, 7, -3.4, 0);
    g.closePath(); g.fill();
    // ribs
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      g.beginPath();
      g.moveTo(-3.6 + i * 0.15, i * 3);
      g.quadraticCurveTo(0, i * 3 + 0.8, 3.8 - i * 0.2, i * 3 + 0.4);
      g.stroke();
    }
    // base plate
    g.fillStyle = shade(poly, -0.35);
    g.beginPath();
    g.moveTo(-2.9, 12.2); g.quadraticCurveTo(0.2, 14.8, 3.1, 12.4);
    g.lineTo(2.8, 13.8); g.quadraticCurveTo(0, 15.6, -2.6, 13.9);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,215,165,0.16)'; g.lineWidth = 0.5;
    g.beginPath(); g.moveTo(3.5, 1); g.quadraticCurveTo(4.4, 7, 3, 12); g.stroke();
    speckle(g, -4, 0, 8, 13, 30);
  });
}

function paintBolt() {
  // charging handle / bolt carrier that cycles in the ejection port
  return makeSprite(8, 4, 1, 2, (g) => {
    g.fillStyle = lingrad(g, 0, 0, 0, 4, [[0, '#8d939c'], [0.5, '#5c6167'], [1, '#33363b']]);
    rr(g, 0.4, 0.6, 7, 2.6, 0.8); g.fill();
    g.fillStyle = '#1c1e21';
    g.fillRect(5.6, 0.2, 1.6, 3.4);
  });
}

// ============================ C-9 "CORVID" ============================
function paintPistolBody(finish) {
  const gripCol = (finish && finish.grip) || '#2a2c30';
  const frameCol = (finish && finish.frame) || '#303236';
  // box x -7..+11, y -8..+7; anchor grip at (0,0) → sprite anchor (7,8)
  return makeSprite(18, 15, 7, 8, (g) => {
    g.translate(7, 8);
    // grip with stippling
    g.fillStyle = polymer(g, -1, 7, gripCol);
    g.beginPath();
    g.moveTo(-1.8, -1.4);
    g.lineTo(-4.2, 5.2);
    g.quadraticCurveTo(-4.4, 6.8, -2.4, 6.8);
    g.lineTo(0.6, 6.4);
    g.quadraticCurveTo(1.8, 3, 2.2, -1.2);
    g.closePath(); g.fill();
    for (let i = 0; i < 14; i++) {
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fillRect(-3.4 + rng() * 4.6, 0.5 + rng() * 5, 0.5, 0.5);
    }
    // frame + trigger guard
    g.fillStyle = polymer(g, -3, 0, frameCol);
    g.beginPath();
    g.moveTo(-2.4, -2.8);
    g.lineTo(8.8, -2.8);
    g.lineTo(8.8, -0.6);
    g.lineTo(6.4, -0.2);
    g.quadraticCurveTo(6.6, 2.8, 4, 3);       // guard front
    g.quadraticCurveTo(2.4, 3, 2.2, 0.6);
    g.lineTo(-2.4, -0.6);
    g.closePath(); g.fill();
    g.strokeStyle = '#17181b'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(3.2, -0.2); g.quadraticCurveTo(2.9, 1.4, 3.8, 2); g.stroke(); // trigger
    // accessory rail
    g.fillStyle = 'rgba(0,0,0,0.4)';
    for (let x = 4; x < 8.6; x += 1.3) g.fillRect(x, -1.6, 0.7, 0.8);
    // engraving
    g.fillStyle = 'rgba(205,212,222,0.25)';
    g.font = '1.5px monospace';
    g.fillText('C-9', 4.6, 1.4);
    speckle(g, -4, -2, 12, 8, 26);
    if (finish && finish.core) drawCore(g, 0.4, -1.4, 7.6, -1.4, finish.core);
  });
}
function paintPistolSlide() {
  // separate slide for blowback animation; anchor aligns with frame top.
  return makeSprite(19, 6, 7, 6, (g) => {
    g.translate(7, 6);
    g.fillStyle = metal(g, -6, -2.4, '#3d4046');
    g.beginPath();
    g.moveTo(-6.4, -5.8);
    g.lineTo(10.8, -5.8);
    g.quadraticCurveTo(11.8, -5.8, 11.6, -4.6);
    g.lineTo(11.4, -2.9);
    g.lineTo(-6.4, -2.9);
    g.closePath(); g.fill();
    // slide serrations
    g.fillStyle = 'rgba(0,0,0,0.4)';
    for (let i = 0; i < 5; i++) g.fillRect(-5.6 + i * 1.1, -5.4, 0.5, 2.2);
    for (let i = 0; i < 4; i++) g.fillRect(6.8 + i * 1.1, -5.4, 0.5, 2.2);
    // ejection port
    g.fillStyle = '#101113';
    rr(g, 2.6, -5.2, 3.6, 1.7, 0.4); g.fill();
    // sights
    g.fillStyle = '#17181b';
    g.fillRect(-5.9, -6.7, 1.4, 1);
    g.fillRect(9.8, -6.7, 1, 1);
    g.fillStyle = '#7ec26a';
    g.fillRect(-5.6, -6.5, 0.6, 0.6);
    g.strokeStyle = 'rgba(255,215,165,0.25)'; g.lineWidth = 0.5;
    g.beginPath(); g.moveTo(-6.2, -5.9); g.lineTo(11.2, -5.9); g.stroke();
    scratches(g, -6, -6.6, 17, 4, rng, { n: 10 });
  });
}

// ============================ "TALON-7" KNIFE ============================
function paintKnife(finish) {
  // Optional energy finish: recolors the blade to an emissive edge (VOLT EDGE).
  const blade = finish && finish.blade;
  // box x -6..+16, y -4..+4; anchor at grip center → (6,4)
  return makeSprite(22, 9, 6, 4.5, (g) => {
    g.translate(6, 4.5);
    // handle: G10 scales
    g.fillStyle = lingrad(g, 0, -2.6, 0, 2.8, [
      [0, '#3f4238'], [0.5, '#31342b'], [1, '#20221c'],
    ]);
    g.beginPath();
    g.moveTo(-0.8, -2.2);
    g.lineTo(-4.6, -1.9);
    g.quadraticCurveTo(-6.2, -1.6, -5.8, 0.2);
    g.quadraticCurveTo(-5.6, 2.2, -3.8, 2.2);   // pommel curve
    g.lineTo(-0.4, 2.4);
    g.closePath(); g.fill();
    // scale texture + lanyard hole
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.4;
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.moveTo(-4.6 + i * 1.1, -1.8);
      g.lineTo(-4.2 + i * 1.1, 2.1);
      g.stroke();
    }
    g.fillStyle = '#0e0f0d';
    g.beginPath(); g.arc(-4.7, 0.2, 0.7, 0, Math.PI * 2); g.fill();
    // guard
    g.fillStyle = lingrad(g, 0, -3.2, 0, 3.2, [[0, '#6a6f76'], [1, '#2c2f33']]);
    rr(g, -0.9, -3, 1.6, 6, 0.6); g.fill();
    // blade: recurve tanto — satin steel, or an emissive energy edge
    g.fillStyle = blade
      ? lingrad(g, 0, -3, 0, 2.4, [
          [0, '#d6f6ff'], [0.4, blade], [0.62, shade(blade, -0.35)], [1, shade(blade, -0.6)],
        ])
      : lingrad(g, 0, -3, 0, 2.4, [
          [0, '#c9ced6'], [0.42, '#9aa1aa'], [0.55, '#585d64'], [1, '#3a3e44'],
        ]);
    if (blade) { g.shadowColor = blade; g.shadowBlur = 5; }
    g.beginPath();
    g.moveTo(0.7, -2.6);
    g.lineTo(9.4, -2.9);                        // spine
    g.quadraticCurveTo(13.2, -2.7, 15.6, -0.4); // tip
    g.quadraticCurveTo(11.5, 1.6, 7, 1.9);      // edge belly
    g.quadraticCurveTo(3, 2.2, 0.7, 1.9);
    g.closePath(); g.fill();
    g.shadowBlur = 0;
    // edge grind highlight
    g.fillStyle = blade
      ? lingrad(g, 0, 0.4, 0, 2.2, [[0, 'rgba(235,252,255,0.95)'], [1, withA(blade, 0.3)]])
      : lingrad(g, 0, 0.4, 0, 2.2, [[0, 'rgba(240,244,250,0.85)'], [1, 'rgba(160,168,178,0.15)']]);
    g.beginPath();
    g.moveTo(1, 1.1);
    g.quadraticCurveTo(7, 1.4, 11.4, 0.5);
    g.quadraticCurveTo(13.6, 0, 15.3, -0.4);
    g.quadraticCurveTo(11.5, 1.7, 7, 1.95);
    g.quadraticCurveTo(3, 2.2, 1, 1.9);
    g.closePath(); g.fill();
    // fuller groove
    g.strokeStyle = 'rgba(30,33,38,0.6)'; g.lineWidth = 0.6;
    g.beginPath(); g.moveTo(1.6, -1.5); g.lineTo(9.8, -1.7); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 0.3;
    g.beginPath(); g.moveTo(1.6, -1.1); g.lineTo(9.6, -1.3); g.stroke();
    // jimping on spine
    g.fillStyle = 'rgba(0,0,0,0.5)';
    for (let i = 0; i < 5; i++) g.fillRect(1 + i * 0.7, -3, 0.35, 0.7);
    scratches(g, 1, -2.4, 13, 4, rng, { n: 8, color: 'rgba(235,240,248,0.3)' });
  });
}

// ============================ P-12 "WASP" (SMG) ============================
// Original compact submachine gun: stamped-steel receiver, folding stock,
// stubby handguard, straight box mag. Same grip-point convention as the
// rifle (origin = trigger-hand grip, muzzle at +x).
function paintSmgBody(finish) {
  const rec = (finish && finish.rec) || '#3a3d42';
  const poly = (finish && finish.poly) || '#26282b';
  // box x -14..+24 (38), y -9..+7 (16); anchor (14,9)
  return makeSprite(40, 17, 14, 9, (g) => {
    g.translate(14, 9);
    // folding stock (thin wire-frame, collapsed)
    g.strokeStyle = shade(rec, -0.2); g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-3, -4.6); g.lineTo(-12.6, -3.4);
    g.quadraticCurveTo(-14.4, -3.2, -14.2, -0.6);
    g.lineTo(-14.4, 3.4); g.lineTo(-12.4, 3.2); g.lineTo(-11.8, -0.4);
    g.lineTo(-3, -1.2);
    g.stroke();
    g.fillStyle = shade(rec, -0.3);
    rr(g, -15, -1.6, 2.4, 5.4, 0.8); g.fill();

    // lower receiver + grip
    g.fillStyle = metal(g, -5, 3.6, rec);
    g.beginPath();
    g.moveTo(-3.4, -5.2);
    g.lineTo(8.6, -5.2);
    g.lineTo(8.6, -0.2);
    g.lineTo(4.4, 0.6);
    g.lineTo(0.6, 0.2);
    g.lineTo(-3.4, -0.4);
    g.closePath(); g.fill();
    g.fillStyle = polymer(g, -0.6, 7, poly);
    g.beginPath();
    g.moveTo(-0.8, -0.8);
    g.quadraticCurveTo(-2.2, 3, -3.6, 5.8);
    g.quadraticCurveTo(-3.8, 7, -2, 7);
    g.quadraticCurveTo(-0.2, 6.8, 0.4, 4.4);
    g.lineTo(1.4, -0.4);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.35;
    for (let i = 0; i < 3; i++) {
      g.beginPath(); g.moveTo(-1.4 - i * 0.7, 1.2 + i * 1.4); g.lineTo(0.4 - i * 0.6, 1.6 + i * 1.4); g.stroke();
    }
    g.strokeStyle = shade(rec, -0.15); g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(1.2, 0); g.quadraticCurveTo(3.4, 2.8, 5.6, 0.4); g.stroke();

    // upper receiver, straight box mag well
    g.fillStyle = metal(g, -8.2, -4.8, shade(rec, 0.04));
    rr(g, -4, -8.4, 18, 3.6, 0.7); g.fill();
    g.fillStyle = '#101114';
    rr(g, 5, -6, 4.6, 2.2, 0.5); g.fill();
    // stubby handguard
    g.fillStyle = polymer(g, -7.6, -3, shade(poly, 0.05));
    rr(g, 8.6, -7.8, 10.5, 5, 1.2); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.4)';
    for (let x = 9.4; x < 18.4; x += 1.5) g.fillRect(x, -8.2, 0.8, 0.8);
    // short barrel + compensator
    g.fillStyle = metal(g, -5.4, -3.2, shade(rec, -0.06));
    g.fillRect(19, -5, 5.4, 1.8);
    g.fillStyle = metal(g, -6, -2.6, rec);
    rr(g, 22.6, -5.6, 3.2, 3, 0.7); g.fill();
    g.fillStyle = '#0e0f11';
    g.fillRect(23.4, -5.9, 0.8, 3.6);
    // rear sight + mini dot rail
    g.fillStyle = metal(g, -10.6, -8.2, '#26282c');
    rr(g, -3.2, -10.4, 6, 2.4, 0.6); g.fill();
    g.fillStyle = '#ff5a48';
    g.fillRect(0.6, -9.5, 0.6, 0.6);

    g.fillStyle = 'rgba(210,218,228,0.28)';
    g.font = '1.5px monospace';
    g.fillText('P-12', -3, -6);
    scratches(g, -13, -8, 36, 12, rng, { n: 20, color: 'rgba(200,208,220,0.15)' });
    grunge(g, -14, -8.5, 38, 15, rng, { n: 50, dark: 0.1, light: 0.04 });
    speckle(g, 8.6, -7.6, 11, 5, 28);
    g.strokeStyle = 'rgba(255,215,165,0.22)'; g.lineWidth = 0.5;
    g.beginPath(); g.moveTo(-4, -8.5); g.lineTo(14, -8.5); g.stroke();
    if (finish && finish.core) drawCore(g, -2, -6.2, 12, -6.2, finish.core);
  });
}
function paintSmgMag() {
  // straight box mag; anchor at top (feed) point.
  return makeSprite(7, 15, 3.5, 1, (g) => {
    g.translate(3.5, 1);
    g.fillStyle = lingrad(g, -3, 0, 3, 0, [
      [0, shade(COL.polymer, 0.1)], [0.5, '#26282b'], [1, shade('#26282b', -0.3)],
    ]);
    rr(g, -2.6, 0, 5.2, 12.6, 0.8); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.4;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-2.6, i * 3); g.lineTo(2.6, i * 3); g.stroke(); }
    g.fillStyle = shade('#26282b', -0.35);
    rr(g, -2.9, 11.6, 5.8, 2.2, 0.6); g.fill();
    g.strokeStyle = 'rgba(255,215,165,0.16)'; g.lineWidth = 0.5;
    g.beginPath(); g.moveTo(2.7, 1); g.lineTo(2.7, 11); g.stroke();
    speckle(g, -2.6, 0, 5.2, 12, 20);
  });
}

// ============================ "RAVAGE" bowie (knife finish) ============
// Alternate blade geometry for the TALON-7 grip: straight clip-point bowie
// with a blackened Cerakote finish, unlocked as a knife variant.
function paintKnifeBowie() {
  return makeSprite(22, 9, 6, 4.5, (g) => {
    g.translate(6, 4.5);
    g.fillStyle = lingrad(g, 0, -2.6, 0, 2.8, [
      [0, '#2a2c26'], [0.5, '#1e201a'], [1, '#121310'],
    ]);
    g.beginPath();
    g.moveTo(-0.8, -2.2);
    g.lineTo(-4.6, -1.9);
    g.quadraticCurveTo(-6.2, -1.6, -5.8, 0.2);
    g.quadraticCurveTo(-5.6, 2.2, -3.8, 2.2);
    g.lineTo(-0.4, 2.4);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.4;
    for (let i = 0; i < 4; i++) {
      g.beginPath(); g.moveTo(-4.6 + i * 1.1, -1.8); g.lineTo(-4.2 + i * 1.1, 2.1); g.stroke();
    }
    g.fillStyle = '#0e0f0d';
    g.beginPath(); g.arc(-4.7, 0.2, 0.7, 0, Math.PI * 2); g.fill();
    g.fillStyle = lingrad(g, 0, -3.2, 0, 3.2, [[0, '#3c3e40'], [1, '#18191b']]);
    rr(g, -0.9, -3, 1.6, 6, 0.6); g.fill();
    // straight clip-point blade, blackened
    g.fillStyle = lingrad(g, 0, -2.6, 0, 2.2, [
      [0, '#4c4e50'], [0.4, '#33353a'], [1, '#1c1d20'],
    ]);
    g.beginPath();
    g.moveTo(0.7, -2.4);
    g.lineTo(11.4, -2.3);
    g.quadraticCurveTo(14.6, -1.2, 16.4, 0.3);
    g.quadraticCurveTo(11.5, 1.2, 6, 1.7);
    g.quadraticCurveTo(2.8, 1.9, 0.7, 1.7);
    g.closePath(); g.fill();
    g.fillStyle = lingrad(g, 0, 0.2, 0, 1.9, [[0, 'rgba(150,155,160,0.6)'], [1, 'rgba(90,95,100,0.1)']]);
    g.beginPath();
    g.moveTo(1, 1); g.quadraticCurveTo(6, 1.3, 11.4, 0.5); g.quadraticCurveTo(14, -0.3, 16.1, 0.3);
    g.quadraticCurveTo(11.5, 1.3, 6, 1.75); g.quadraticCurveTo(2.8, 1.95, 1, 1.75);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 0.5;
    g.beginPath(); g.moveTo(2, -1.4); g.lineTo(10.6, -1.4); g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.55)';
    for (let i = 0; i < 5; i++) g.fillRect(1 + i * 0.7, -3, 0.35, 0.7);
    scratches(g, 1, -2.2, 14, 4, rng, { n: 6, color: 'rgba(160,168,178,0.22)' });
  });
}

// ---- muzzle flash sprites (painted hot-core star flashes) ----
function paintFlash(seed) {
  const frng = makeRng(seed);
  return makeSprite(44, 30, 6, 15, (g) => {
    const cx = 6, cy = 15;
    g.translate(cx, cy);
    g.globalCompositeOperation = 'lighter';
    // petals
    const petals = frng.int(4, 6);
    for (let i = 0; i < petals; i++) {
      const a = frng.range(-0.7, 0.7) + (i - petals / 2) * 0.34;
      const len = frng.range(12, 30) * (Math.abs(a) < 0.4 ? 1.25 : 0.7);
      const wdt = frng.range(2.4, 4.6);
      g.save();
      g.rotate(a * 0.55);
      g.fillStyle = lingrad(g, 0, 0, len, 0, [
        [0, 'rgba(255,244,214,0.95)'],
        [0.35, 'rgba(255,196,110,0.8)'],
        [0.8, 'rgba(255,110,40,0.28)'],
        [1, 'rgba(255,70,20,0)'],
      ]);
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(len * 0.5, -wdt, len, 0);
      g.quadraticCurveTo(len * 0.5, wdt, 0, 0);
      g.closePath(); g.fill();
      g.restore();
    }
    // hot core
    g.fillStyle = radgrad(g, 0, 0, 7.5, [
      [0, 'rgba(255,252,240,1)'],
      [0.4, 'rgba(255,214,130,0.9)'],
      [1, 'rgba(255,120,40,0)'],
    ]);
    g.beginPath(); g.arc(0, 0, 7.5, 0, Math.PI * 2); g.fill();
  });
}

// ============================ definitions ============================

// Recoil pattern multipliers: cycles per consecutive shot (reset after a
// firing pause), giving each weapon a repeatable, learnable kick signature
// instead of pure randomness. Values scale the base recoilRot/recoilKick.
const PATTERN_RIFLE = [0.7, 0.85, 1.0, 1.12, 1.2, 1.1, 0.95, 1.15, 1.25, 1.05];
const PATTERN_PISTOL = [1.15, 0.75, 0.95, 0.8];
const PATTERN_SMG = [0.55, 0.65, 0.78, 0.7, 0.6, 0.82, 0.9, 0.68];

export function buildWeapons() {
  const flashes = [paintFlash(11), paintFlash(23), paintFlash(37)];

  const rifleBody = paintRifleBody('ranger');
  const rifleFinishes = {
    default: rifleBody,
    urban: paintRifleBody('ranger', { rec: '#3c4750', poly: '#2b3640' }),
    cinder: paintRifleBody('ranger', { rec: '#4a2e26', poly: '#38221c' }),
    arc: paintRifleBody('ranger', { rec: '#123742', poly: '#0c2731' }),   // ARC-9 energy
  };
  const pistolBody = paintPistolBody();
  const pistolFinishes = {
    default: pistolBody,
    desert: paintPistolBody({ grip: '#5c4f3a', frame: '#6b5c42' }),
    onyx: paintPistolBody({ grip: '#161719', frame: '#1c1d1f' }),
    gold: paintPistolBody({ grip: '#5a4718', frame: '#8a6f28' }),
  };
  const knifeBody = paintKnife();
  const knifeFinishes = {
    default: knifeBody,
    ravage: paintKnifeBowie(),
    volt: paintKnife({ blade: '#38e0ff' }),   // VOLT EDGE energy blade
  };
  const smgBody = paintSmgBody();
  const smgFinishes = {
    default: smgBody,
    viper: paintSmgBody({ rec: '#2c4a2e', poly: '#1b2e1c' }),
    arc: paintSmgBody({ rec: '#123742', poly: '#0c2731' }),
  };

  const defs = {
    rifle: {
      id: 'rifle', name: 'VK-77 "VANDAL"', slot: 1, kind: 'gun',
      body: rifleBody, finishes: rifleFinishes, finish: 'default',
      mag: paintRifleMag('ranger'), bolt: paintBolt(),
      flashes,
      // attachment points in weapon space (origin = trigger-hand grip)
      gripA: { x: 0, y: 0.6 },            // trigger hand
      gripB: { x: 17.5, y: -4.6 },        // support hand on handguard
      muzzle: { x: 40, y: -5.2 },
      eject: { x: 9.5, y: -5.4 },
      magPos: { x: 6.8, y: 0.2 },
      boltPos: { x: 6.6, y: -6.6 },
      shoulder: { x: -13, y: -4 },        // stock contact → weapon anchor offset
      // stats
      auto: true, rpm: 690, dmg: 26, spread: 0.02, pellets: 1,
      recoilKick: 1.5, recoilRot: 0.022, camKick: 0.85, camTrauma: 0.042,
      recoilPattern: PATTERN_RIFLE,
      magSize: 30, reserve: 120,
      reloadT: 2.1, reloadEmptyT: 2.75,
      shotSound: 'rifle', casingSize: 4.6,
      aimHeight: -4.8,
    },
    pistol: {
      id: 'pistol', name: 'C-9 "CORVID"', slot: 2, kind: 'gun',
      body: pistolBody, finishes: pistolFinishes, finish: 'default',
      slide: paintPistolSlide(), flashes,
      gripA: { x: 0, y: 0.8 },
      gripB: { x: 2.6, y: 1.8 },          // support hand cups front of grip
      muzzle: { x: 12.4, y: -4.2 },
      eject: { x: 4.4, y: -5 },
      magPos: { x: -2.2, y: 4 },
      shoulder: { x: 4, y: -1 },
      auto: false, rpm: 380, dmg: 34, spread: 0.014, pellets: 1,
      recoilKick: 1.28, recoilRot: 0.04, camKick: 0.66, camTrauma: 0.036,
      recoilPattern: PATTERN_PISTOL,
      magSize: 12, reserve: 48,
      reloadT: 1.65, reloadEmptyT: 2.1,
      shotSound: 'pistol', casingSize: 3.4,
      aimHeight: -4,
    },
    smg: {
      id: 'smg', name: 'P-12 "WASP"', slot: 4, kind: 'gun',
      body: smgBody, finishes: smgFinishes, finish: 'default',
      mag: paintSmgMag(), bolt: paintBolt(),
      flashes,
      gripA: { x: 0, y: 0.4 },
      gripB: { x: 12, y: -6.4 },
      muzzle: { x: 26, y: -4.8 },
      eject: { x: 6.4, y: -5.4 },
      magPos: { x: 1.5, y: 0.5 },
      boltPos: { x: 3, y: -6.8 },
      shoulder: { x: -9, y: -3 },
      auto: true, rpm: 950, dmg: 15, spread: 0.028, pellets: 1,
      recoilKick: 1.1, recoilRot: 0.017, camKick: 0.58, camTrauma: 0.034,
      recoilPattern: PATTERN_SMG,
      magSize: 35, reserve: 140,
      reloadT: 1.8, reloadEmptyT: 2.3,
      shotSound: 'pistol', casingSize: 3.6,
      aimHeight: -4.2,
      unlockLevel: 3,
    },
    knife: {
      id: 'knife', name: 'TALON-7', slot: 3, kind: 'melee',
      body: knifeBody, finishes: knifeFinishes, finish: 'default',
      gripA: { x: -2.6, y: 0 },
      dmg: 55, dmgHeavy: 95,
      range: 46, arc: 1.1,
      swingT: 0.34, heavyT: 0.62,
      aimHeight: -6,
    },
  };

  // ---- expanded arsenal: reuses the three gun silhouettes (rifle / smg /
  // pistol) with recoloured bodies + energy cores, and layers on distinct
  // firing archetypes, colours, sounds and recoil. Anchors, mag/bolt/slide
  // and reload timing are inherited from the base def, so every weapon keeps
  // a working reload animation for free.
  const R = defs.rifle, S = defs.smg, P = defs.pistol;
  const rifleSkin = (rec, poly, core) => paintRifleBody('ranger', { rec, poly, core });
  const smgSkin = (rec, poly, core) => paintSmgBody({ rec, poly, core });
  const pistolSkin = (grip, frame, core) => paintPistolBody({ grip, frame, core });

  Object.assign(defs, {
    // ------- conventional military -------
    battle: {
      ...R, id: 'battle', name: 'MK-2 "WARDEN"', body: rifleSkin('#43372a', '#302719'),
      auto: false, rpm: 340, dmg: 46, spread: 0.015,
      recoilKick: 2.1, recoilRot: 0.03, camKick: 1.15, camTrauma: 0.062,
      magSize: 20, reserve: 100, reloadT: 2.3, reloadEmptyT: 3.0, shotSound: 'rifle',
    },
    lmg: {
      ...R, id: 'lmg', name: 'M-900 "OX" LMG', body: rifleSkin('#2f3630', '#232823'),
      auto: true, rpm: 820, dmg: 24, spread: 0.032,
      recoilKick: 1.9, recoilRot: 0.03, camKick: 1.0, camTrauma: 0.05, muzzleBig: 1.35,
      magSize: 100, reserve: 200, reloadT: 3.8, reloadEmptyT: 4.4, shotSound: 'rifle',
    },
    sniper: {
      ...R, id: 'sniper', name: 'LRS-1 "TALON"', body: rifleSkin('#2a2e33', '#20242a'),
      auto: false, rpm: 55, dmg: 150, spread: 0.002,
      recoilKick: 3.2, recoilRot: 0.05, camKick: 2.4, camTrauma: 0.12, muzzleBig: 1.5,
      magSize: 5, reserve: 30, reloadT: 3.0, reloadEmptyT: 3.5,
      shotSound: 'rifle', tracerColor: [255, 244, 210], tracerWidth: 2.6,
    },
    // ------- energy: projectiles -------
    raygun: {
      ...P, id: 'raygun', name: 'RAY GUN', body: pistolSkin('#3a1d55', '#4a2668', [200, 110, 255]),
      energy: true, fireMode: 'projectile', auto: false, rpm: 200, dmg: 62, spread: 0.02,
      projectile: { color: [200, 110, 255], radius: 5, speed: 900, blast: 44, headMul: 1.6, life: 1.6 },
      recoilKick: 1.4, recoilRot: 0.03, camKick: 0.8, camTrauma: 0.05, muzzleBig: 1.15,
      magSize: 10, reserve: 60, shotSound: 'ray',
    },
    plasma: {
      ...R, id: 'plasma', name: 'PLASMA RIFLE', body: rifleSkin('#123742', '#0c2731', [80, 220, 255]),
      energy: true, fireMode: 'projectile', auto: true, rpm: 420, dmg: 34, spread: 0.022,
      projectile: { color: [80, 220, 255], radius: 4.6, speed: 1050, blast: 28, life: 1.4 },
      heatPerShot: 0.05, heatCool: 0.55, muzzleBig: 1.15,
      recoilKick: 1.4, recoilRot: 0.02, camKick: 0.8, camTrauma: 0.045, shotSound: 'plasma',
    },
    pulse: {
      ...R, id: 'pulse', name: 'PULSE RIFLE', body: rifleSkin('#1c3a2a', '#12281c', [120, 255, 170]),
      energy: true, fireMode: 'projectile', auto: true, rpm: 640, dmg: 22, spread: 0.02,
      projectile: { color: [120, 255, 170], radius: 3.8, speed: 1250, life: 1.2 },
      recoilKick: 1.2, recoilRot: 0.018, camKick: 0.62, camTrauma: 0.036, shotSound: 'pulse',
    },
    eshotgun: {
      ...R, id: 'eshotgun', name: 'ENERGY SHOTGUN', body: rifleSkin('#43301a', '#2f2112', [255, 160, 60]),
      energy: true, fireMode: 'projectile', auto: false, rpm: 75, dmg: 15, spread: 0.14, pellets: 8,
      projectile: { color: [255, 160, 60], radius: 3.4, speed: 820, life: 0.55 },
      recoilKick: 2.8, recoilRot: 0.04, camKick: 1.6, camTrauma: 0.09, muzzleBig: 1.4,
      magSize: 6, reserve: 36, reloadT: 2.6, reloadEmptyT: 3.2, shotSound: 'plasma',
    },
    quantum: {
      ...P, id: 'quantum', name: 'QUANTUM PISTOL', body: pistolSkin('#123045', '#164a63', [90, 200, 255]),
      energy: true, fireMode: 'projectile', auto: false, rpm: 300, dmg: 40, spread: 0.016,
      projectile: { color: [120, 220, 255], radius: 4, speed: 1400, pierce: 1, life: 1.2 },
      recoilKick: 1.2, recoilRot: 0.03, camKick: 0.6, camTrauma: 0.04, shotSound: 'ray',
      magSize: 14, reserve: 70,
    },
    // ------- energy: charge weapons -------
    railgun: {
      ...R, id: 'railgun', name: 'GAUSS RAILGUN', body: rifleSkin('#2e3238', '#202429', [150, 220, 255]),
      energy: true, fireMode: 'projectile', auto: false, rpm: 60, dmg: 120, spread: 0.001,
      projectile: { color: [150, 220, 255], radius: 4.2, speed: 2600, pierce: 4, life: 0.8 },
      charge: { time: 0.9, minMul: 0.5, maxMul: 1.5 },
      recoilKick: 3.0, recoilRot: 0.045, camKick: 2.2, camTrauma: 0.12, muzzleBig: 1.6,
      magSize: 5, reserve: 30, reloadT: 2.8, reloadEmptyT: 3.3, shotSound: 'rail',
    },
    ion: {
      ...R, id: 'ion', name: 'ION CANNON', body: rifleSkin('#173d3a', '#0f2b29', [80, 255, 210]),
      energy: true, fireMode: 'projectile', auto: false, rpm: 40, dmg: 90, spread: 0.004,
      projectile: { color: [80, 255, 210], radius: 7, speed: 720, blast: 130, life: 2 },
      charge: { time: 1.1, minMul: 0.5, maxMul: 1.7 },
      recoilKick: 2.6, recoilRot: 0.04, camKick: 2.0, camTrauma: 0.14, muzzleBig: 1.7,
      magSize: 4, reserve: 24, reloadT: 3.0, reloadEmptyT: 3.6, shotSound: 'ion',
    },
    emp: {
      ...R, id: 'emp', name: 'EMP LAUNCHER', body: rifleSkin('#26364a', '#1a2636', [120, 200, 255]),
      energy: true, fireMode: 'projectile', auto: false, rpm: 70, dmg: 40, spread: 0.01,
      projectile: { color: [140, 210, 255], radius: 6, speed: 640, blast: 150, life: 2.2 },
      recoilKick: 2.0, recoilRot: 0.03, camKick: 1.4, camTrauma: 0.09, muzzleBig: 1.4,
      magSize: 5, reserve: 25, reloadT: 2.7, reloadEmptyT: 3.2, shotSound: 'ion',
    },
    gravity: {
      ...R, id: 'gravity', name: 'GRAVITY GUN', body: rifleSkin('#3a2450', '#281634', [180, 120, 255]),
      energy: true, fireMode: 'projectile', auto: false, rpm: 90, dmg: 55, spread: 0.008,
      projectile: { color: [180, 120, 255], radius: 6, speed: 560, blast: 110, life: 2.4 },
      recoilKick: 1.8, recoilRot: 0.03, camKick: 1.2, camTrauma: 0.08, muzzleBig: 1.4,
      magSize: 8, reserve: 40, shotSound: 'ion',
    },
    // ------- energy: beams -------
    lasersmg: {
      ...S, id: 'lasersmg', name: 'LASER SMG', body: smgSkin('#3a1420', '#280d16', [255, 70, 90]),
      energy: true, fireMode: 'beam', auto: true, rpm: 1100, dmg: 9, spread: 0.02,
      beam: { color: [255, 70, 90], width: 2.2 }, heatPerShot: 0.03, heatCool: 0.6,
      recoilKick: 0.7, recoilRot: 0.012, camKick: 0.4, camTrauma: 0.024, shotSound: 'laser',
    },
    particle: {
      ...R, id: 'particle', name: 'PARTICLE BEAM', body: rifleSkin('#2a1d55', '#1c1440', [190, 120, 255]),
      energy: true, fireMode: 'beam', auto: true, rpm: 520, dmg: 16, spread: 0.006,
      beam: { color: [190, 120, 255], width: 2.6 }, heatPerShot: 0.045, heatCool: 0.5,
      recoilKick: 0.9, recoilRot: 0.014, camKick: 0.5, camTrauma: 0.03, shotSound: 'particle',
    },
    lightning: {
      ...R, id: 'lightning', name: 'LIGHTNING RIFLE', body: rifleSkin('#26364a', '#1a2636', [130, 200, 255]),
      energy: true, fireMode: 'beam', auto: true, rpm: 260, dmg: 20, spread: 0.01,
      beam: { color: [150, 210, 255], width: 2, arc: true }, shotSound: 'lightning',
      recoilKick: 1.0, recoilRot: 0.016, camKick: 0.6, camTrauma: 0.04,
    },
    cryo: {
      ...R, id: 'cryo', name: 'CRYO GUN', body: rifleSkin('#1d3a4a', '#122a36', [160, 230, 255]),
      energy: true, fireMode: 'beam', auto: true, rpm: 700, dmg: 8, spread: 0.03,
      beam: { color: [170, 235, 255], width: 3.4, range: 360 }, shotSound: 'cryo',
      recoilKick: 0.5, recoilRot: 0.008, camKick: 0.3, camTrauma: 0.02,
    },
    flame: {
      ...R, id: 'flame', name: 'FLAME THROWER', body: rifleSkin('#3a1f12', '#2a150c', [255, 130, 40]),
      energy: true, fireMode: 'beam', auto: true, rpm: 900, dmg: 6, spread: 0.05,
      beam: { color: [255, 130, 40], width: 6, range: 300, flame: true }, shotSound: 'flame',
      recoilKick: 0.4, recoilRot: 0.006, camKick: 0.3, camTrauma: 0.024,
    },
  });

  return defs;
}
