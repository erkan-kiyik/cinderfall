// Original weapon designs, painted at ASSET_SCALE with machined-metal
// gradients, polymer texture, wear on edges and engraved detail. Each weapon
// carries its gameplay stats plus named attachment points (grips, muzzle,
// ejection port, magazine) so the rig can place hands exactly on the grips
// and animate the magazine / bolt as separate painted sprites.

import {
  makeSprite, lingrad, radgrad, rr, grunge, scratches, shade, withA, COL,
} from './paint.js';
import { makeRng } from '../engine/math.js';
import { buildSkinSet } from './skins.js';

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
// Picatinny rail. Drawn as a real part — a dark bed with recoil slots milled
// into it and a thin lit edge on the tooth tops — rather than dark notches
// stamped straight onto the receiver. The old version left the receiver's warm
// top-edge highlight showing through every gap, so at asset scale the rail
// read as a cream-and-black zipper stuck along the gun instead of steel.
function railTeeth(g, x0, x1, yTop, base, { pitch = 1.7, slot = 0.8 } = {}) {
  const h = 1.15;
  g.fillStyle = lingrad(g, 0, yTop, 0, yTop + h, [
    [0, shade(base, 0.14)], [0.45, shade(base, -0.10)], [1, shade(base, -0.34)],
  ]);
  g.fillRect(x0, yTop, x1 - x0, h);
  // milled slots
  g.fillStyle = 'rgba(0,0,0,0.55)';
  for (let x = x0 + 0.5; x < x1 - slot; x += pitch) g.fillRect(x, yTop + 0.15, slot, h - 0.15);
  // lit tooth crowns, clipped to the rail so nothing spills onto the receiver
  g.save();
  g.beginPath(); g.rect(x0, yTop, x1 - x0, 0.34); g.clip();
  g.fillStyle = 'rgba(226,232,240,0.30)';
  g.fillRect(x0, yTop, x1 - x0, 0.34);
  g.fillStyle = 'rgba(0,0,0,0.5)';
  for (let x = x0 + 0.5; x < x1 - slot; x += pitch) g.fillRect(x, yTop, slot, 0.34);
  g.restore();
}

// Overall form light. Every part on these guns is filled with its own small
// vertical gradient, which makes each piece read but leaves the assembled
// weapon one flat plate of a single value end to end — the desert battle rifle
// was the clearest case, a tan silhouette with nothing to separate barrel from
// receiver from stock. This lays one shared light over the whole silhouette:
// sky above, bounce below, shadow along the underside. source-atop keeps it on
// pixels that are already painted, so it never leaks into the air around the
// gun. Call it after the wear pass, last.
function formLight(g, x, y, w, h) {
  g.save();
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = lingrad(g, 0, y, 0, y + h, [
    [0, 'rgba(214,228,246,0.13)'],
    [0.30, 'rgba(214,228,246,0.02)'],
    [0.62, 'rgba(0,0,0,0)'],
    [0.88, 'rgba(0,0,0,0.20)'],
    [1, 'rgba(0,0,0,0.34)'],
  ]);
  g.fillRect(x, y, w, h);
  g.restore();
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
  // Box sized off the geometry, with margin. Several painters drew past
  // their canvas and the excess was silently sheared flat at the edge —
  // the parts that looked "detached" or "chopped" were simply cropped.
  return makeSprite(64, 25, 22, 16, (g) => {
    g.translate(22, 16);  // move origin to grip point

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
    railTeeth(g, -6.6, 17.2, -11.35, rec);
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
    railTeeth(g, 11.0, 26.2, -10.5, shade(poly, 0.1), { pitch: 1.7, slot: 0.8 });
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
    g.save();
    g.globalCompositeOperation = 'source-atop';
    scratches(g, -18, -10, 56, 16, rng, { n: 26, color: 'rgba(200,208,220,0.16)' });
    grunge(g, -19, -11, 58, 18, rng, { n: 70, dark: 0.1, light: 0.04 });
    g.restore();
    speckle(g, -19, -8, 14, 9, 40);
    speckle(g, 10.5, -10, 16, 7, 40);
    // Body highlights. The top edge is the rail's job now; a warm cream line
    // laid under the teeth is what made the rail read as a zipper, and stacked
    // on top of metal()'s own bright top stop it widened into a tan band
    // running the length of the receiver. What is left is a cool hairline.
    g.strokeStyle = 'rgba(198,212,228,0.13)'; g.lineWidth = 0.35;
    g.beginPath(); g.moveTo(-6.4, -9.85); g.lineTo(17.0, -9.85); g.stroke();
    // Contact shadow under the barrel line, so the gun sits in its own light
    // instead of reading as one flat grey plate end to end.
    g.strokeStyle = 'rgba(0,0,0,0.34)'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(10.8, -3.7); g.lineTo(26.2, -3.7); g.stroke();
    g.beginPath(); g.moveTo(26.6, -4.2); g.lineTo(34.8, -4.2); g.stroke();
    formLight(g, -20, -12, 60, 20);
    if (finish && finish.core) drawCore(g, -4, -8.4, 15.5, -8.4, finish.core);
  });
}

function paintRifleMag(variant, finish) {
  const poly = (finish && finish.poly) || (variant === 'phantom' ? '#232529' : COL.polymer);
  // curved 30-rd magazine; anchor at top (feed) point.
  return makeSprite(10, 16, 5, 1, (g) => {
    g.translate(5, 1);
    // Seated 0.8 up into the well. The receiver's underside slopes from 0.4 at
    // the well's front to -0.4 at its rear, so a magazine whose feed lip sat
    // flat at 0.2 met the gun at one corner and showed daylight at the other.
    g.translate(0, -0.8);
    // Narrower and darker than the pistol grip in front of it. At 6.8 units
    // across and the same value as the grip, the magazine read as a second
    // handle rather than something the gun was fed from — the SMG had the same
    // problem worse. A rifle mag is a thin curved box; this is one.
    const skin = shade(poly, -0.16);
    g.fillStyle = lingrad(g, -2.6, 0, 3, 0, [
      [0, shade(skin, 0.16)], [0.42, skin], [1, shade(skin, -0.38)],
    ]);
    g.beginPath();
    g.moveTo(-2.3, 0);
    g.lineTo(2.3, 0);
    g.quadraticCurveTo(3.3, 7, 2.1, 12.4);     // curved front
    g.quadraticCurveTo(0.1, 13.5, -1.9, 12.9);
    g.quadraticCurveTo(-3.3, 7, -2.3, 0);
    g.closePath(); g.fill();
    // Witness holes down the spine: the detail that says "magazine" at a
    // glance, where the old horizontal bands said "grip".
    g.fillStyle = 'rgba(0,0,0,0.42)';
    for (let i = 0; i < 4; i++) {
      const t = 2.1 + i * 2.7;
      rr(g, -0.9 + t * 0.045, t, 1.7, 1.0, 0.45); g.fill();
    }
    // floorplate, proud of the body on both sides
    g.fillStyle = shade(skin, -0.42);
    rr(g, -2.5, 12.2, 4.9, 1.9, 0.5); g.fill();
    g.fillStyle = 'rgba(226,232,240,0.14)';
    g.fillRect(-2.4, 12.3, 4.7, 0.3);
    // spine light down the leading edge
    g.strokeStyle = 'rgba(226,232,240,0.20)'; g.lineWidth = 0.45;
    g.beginPath(); g.moveTo(2.35, 0.6); g.quadraticCurveTo(3.3, 7, 2.2, 12); g.stroke();
    speckle(g, -3, 0, 6, 12.5, 26);
  });
}

function paintBolt(rec = '#41454b') {
  // Charging handle / bolt carrier riding in the ejection port. It used to
  // start at #8d939c — brighter than anything else on the gun — so it read as
  // a white block sitting on the receiver rather than a part inside it. Now it
  // is receiver-valued with a lit top edge and its own port shadow, and it
  // takes the chassis' own colour: a fixed grey block sat on the olive LMG
  // and the teal energy rifles like a part off a different gun.
  return makeSprite(8, 4, 1, 2, (g) => {
    g.fillStyle = 'rgba(0,0,0,0.45)';
    rr(g, 0.2, 0.4, 7.4, 3.0, 0.9); g.fill();
    g.fillStyle = lingrad(g, 0, 0, 0, 4, [
      [0, shade(rec, 0.34)], [0.42, rec], [1, shade(rec, -0.34)],
    ]);
    rr(g, 0.4, 0.6, 7, 2.6, 0.8); g.fill();
    g.fillStyle = 'rgba(226,232,240,0.26)';
    g.fillRect(0.7, 0.7, 6.4, 0.3);
    // serrated latch at the rear of the handle
    g.fillStyle = shade(rec, -0.62);
    g.fillRect(5.6, 0.2, 1.6, 3.4);
    g.fillStyle = 'rgba(226,232,240,0.14)';
    for (let i = 0; i < 3; i++) g.fillRect(5.8 + i * 0.5, 0.5, 0.22, 2.8);
  });
}

// ============================ C-9 "CORVID" ============================
function paintPistolBody(finish) {
  const gripCol = (finish && finish.grip) || '#2a2c30';
  const frameCol = (finish && finish.frame) || '#303236';
  // box x -7..+11, y -8..+7; anchor grip at (0,0) → sprite anchor (7,8)
  return makeSprite(21, 17, 8, 9, (g) => {
    g.translate(8, 9);
    // grip with stippling
    g.fillStyle = polymer(g, -1, 7, gripCol);
    g.beginPath();
    g.moveTo(-1.8, -1.4);
    g.lineTo(-4.2, 5.2);
    g.quadraticCurveTo(-4.4, 6.8, -2.4, 6.8);
    g.lineTo(0.6, 6.4);
    g.quadraticCurveTo(1.8, 3, 2.2, -1.2);
    g.closePath(); g.fill();
    // Stipple panel. Scattering fourteen random dots read as dirt on the grip;
    // a staggered lattice reads as the moulded texture it is meant to be.
    g.save();
    g.beginPath();
    g.moveTo(-1.8, -1.4); g.lineTo(-4.2, 5.2);
    g.quadraticCurveTo(-4.4, 6.8, -2.4, 6.8);
    g.lineTo(0.6, 6.4); g.quadraticCurveTo(1.8, 3, 2.2, -1.2);
    g.closePath(); g.clip();
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 5; col++) {
        const x = -3.6 + col * 1.15 + (row % 2) * 0.55 + row * 0.18;
        const y = 0.2 + row * 0.72;
        g.fillStyle = 'rgba(0,0,0,0.34)'; g.fillRect(x, y, 0.42, 0.42);
        g.fillStyle = 'rgba(226,232,240,0.10)'; g.fillRect(x, y - 0.22, 0.42, 0.2);
      }
    }
    g.restore();
    // frame + trigger guard
    g.fillStyle = polymer(g, -3, 0, frameCol);
    // The dust cover used to stop at 8.8 while the slide above it ran to 11.6,
    // leaving the front of the slide hanging over open air. The frame now
    // carries it almost to the bushing, stepping down where the guard ends.
    g.beginPath();
    g.moveTo(-4.4, -2.8);          // tang under the slide's rear overhang
    g.lineTo(10.6, -2.8);
    g.lineTo(10.6, -1.5);
    g.lineTo(8.8, -0.9);
    g.lineTo(6.4, -0.2);
    g.quadraticCurveTo(6.6, 2.8, 4, 3);       // guard front
    g.quadraticCurveTo(2.4, 3, 2.2, 0.6);
    g.lineTo(-2.4, -0.6);
    g.lineTo(-3.9, -1.5);
    g.closePath(); g.fill();
    // shadow line where the slide overhangs the dust cover
    g.strokeStyle = 'rgba(0,0,0,0.38)'; g.lineWidth = 0.3;
    g.beginPath(); g.moveTo(-2.2, -2.55); g.lineTo(10.5, -2.55); g.stroke();
    g.strokeStyle = '#17181b'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(3.2, -0.2); g.quadraticCurveTo(2.9, 1.4, 3.8, 2); g.stroke(); // trigger
    railTeeth(g, 3.9, 8.8, -1.75, shade(frameCol, -0.05), { pitch: 1.3, slot: 0.6 });
    // engraving
    g.fillStyle = 'rgba(205,212,222,0.25)';
    g.font = '1.5px monospace';
    g.fillText('C-9', 4.6, 1.4);
    speckle(g, -4, -2, 12, 8, 26);
    formLight(g, -7, -8, 18, 15);
    if (finish && finish.core) drawCore(g, 0.4, -1.4, 7.6, -1.4, finish.core);
  });
}
function paintPistolSlide(finish) {
  const metalCol = (finish && finish.metal) || '#3d4046';
  // separate slide for blowback animation; anchor aligns with frame top.
  // 21 wide, not 19: the barrel bushing added at the muzzle end runs to x=13.1
  // and the old box stopped the sprite dead at 12, shearing the crown off.
  return makeSprite(22, 9, 7, 8, (g) => {
    g.translate(7, 8);
    g.fillStyle = metal(g, -6, -2.4, metalCol);
    g.beginPath();
    // Rear face pulled in from -6.4 to -4.6, level with the grip's backstrap.
    // It used to cantilever nearly two units past the frame with nothing under
    // it, which read as a bar balanced on a handle rather than a slide.
    g.moveTo(-4.6, -5.8);
    g.lineTo(10.8, -5.8);
    g.quadraticCurveTo(11.8, -5.8, 11.6, -4.6);
    g.lineTo(11.4, -2.9);
    g.lineTo(-4.6, -2.9);
    g.closePath(); g.fill();
    // slide serrations
    g.fillStyle = 'rgba(0,0,0,0.4)';
    for (let i = 0; i < 4; i++) g.fillRect(-4.1 + i * 1.1, -5.4, 0.5, 2.2);
    for (let i = 0; i < 4; i++) g.fillRect(6.8 + i * 1.1, -5.4, 0.5, 2.2);
    // ejection port
    g.fillStyle = '#101113';
    rr(g, 2.6, -5.2, 3.6, 1.7, 0.4); g.fill();
    // Barrel bushing and crown. The slide used to stop dead at its front face
    // with nothing behind it, so the pistol read as a block on a grip with no
    // business end — the one part of a handgun the eye looks for.
    g.fillStyle = metal(g, -5.4, -3.2, shade(metalCol, -0.16));
    rr(g, 11.2, -5.2, 1.9, 2.0, 0.4); g.fill();
    g.fillStyle = '#0c0d0f';
    g.beginPath(); g.ellipse(12.5, -4.2, 0.55, 0.72, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(226,232,240,0.30)'; g.lineWidth = 0.28;
    g.beginPath(); g.arc(12.5, -4.2, 0.72, Math.PI * 0.75, Math.PI * 1.7); g.stroke();
    // front bevel, so the slide is not a plain slab end-on
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.beginPath();
    g.moveTo(10.2, -5.8); g.lineTo(11.6, -5.8); g.lineTo(11.5, -4.6);
    g.closePath(); g.fill();
    // sights
    g.fillStyle = '#17181b';
    g.fillRect(-4.3, -6.7, 1.4, 1);
    g.fillRect(9.8, -6.7, 1, 1);
    g.fillStyle = '#7ec26a';
    g.fillRect(-4.0, -6.5, 0.6, 0.6);
    // Cool hairline, not the old warm one: stacked on metal()'s bright top
    // stop, a cream stroke widened into a tan band across the whole slide.
    g.strokeStyle = 'rgba(198,212,228,0.16)'; g.lineWidth = 0.35;
    g.beginPath(); g.moveTo(-4.4, -5.85); g.lineTo(11.2, -5.85); g.stroke();
    // slide-stop / takedown line breaks up the flank
    g.strokeStyle = 'rgba(0,0,0,0.34)'; g.lineWidth = 0.3;
    g.beginPath(); g.moveTo(-2.2, -3.15); g.lineTo(10.6, -3.15); g.stroke();
    g.save();
    g.globalCompositeOperation = 'source-atop';
    scratches(g, -4.6, -6.6, 16, 4, rng, { n: 10 });
    g.restore();
  });
}

// ============================ "TALON-7" KNIFE ============================
function paintKnife(finish) {
  // Optional energy finish: recolors the blade to an emissive edge (VOLT EDGE).
  const blade = finish && finish.blade;
  // box x -6.5..+17.5, y -4.5..+4.5; anchor at grip centre. 22 wide put the
  // canvas wall right where the point is, so the tip was being shaved off.
  return makeSprite(24, 9, 6.5, 4.5, (g) => {
    g.translate(6.5, 4.5);
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
    // 5 units is 15 device pixels of coloured bloom baked into the body
    // sprite, before the skin system adds its own halo on top. Two glows
    // stacked is what turned the emissive blades into blobs.
    if (blade) { g.shadowColor = blade; g.shadowBlur = 2.2; }
    // Clip point. The spine used to curve smoothly into the edge belly, which
    // gave the blade a rounded nose — it read as a spoon rather than something
    // that stabs. The spine now runs flat, breaks at the clip and comes to an
    // actual point.
    g.beginPath();
    g.moveTo(0.7, -2.6);
    g.lineTo(11.4, -2.9);                       // spine
    g.lineTo(14.2, -2.05);                      // clip break
    g.lineTo(16.4, -0.55);                      // point
    g.quadraticCurveTo(11.5, 1.6, 7, 1.9);      // edge belly
    g.quadraticCurveTo(3, 2.2, 0.7, 1.9);
    g.closePath(); g.fill();
    g.shadowBlur = 0;
    // false edge along the clip
    g.fillStyle = blade ? withA(blade, 0.5) : 'rgba(226,232,240,0.30)';
    g.beginPath();
    g.moveTo(11.4, -2.9); g.lineTo(14.2, -2.05); g.lineTo(16.4, -0.55);
    g.lineTo(14.0, -1.35); g.lineTo(11.6, -2.35);
    g.closePath(); g.fill();
    // edge grind highlight
    g.fillStyle = blade
      ? lingrad(g, 0, 0.4, 0, 2.2, [[0, 'rgba(235,252,255,0.95)'], [1, withA(blade, 0.3)]])
      : lingrad(g, 0, 0.4, 0, 2.2, [[0, 'rgba(240,244,250,0.85)'], [1, 'rgba(160,168,178,0.15)']]);
    g.beginPath();
    g.moveTo(1, 1.1);
    g.quadraticCurveTo(7, 1.4, 11.4, 0.5);
    g.quadraticCurveTo(14, 0.05, 16.2, -0.52);
    g.quadraticCurveTo(11.5, 1.7, 7, 1.95);
    g.quadraticCurveTo(3, 2.2, 1, 1.9);
    g.closePath(); g.fill();
    // Structure lines. An emissive blade has no natural shading of its own,
    // so without these the whole thing flattens into one lit shape and stops
    // reading as a knife at all.
    if (blade) {
      g.strokeStyle = withA(shade(blade, -0.62), 0.85); g.lineWidth = 0.42;
      g.beginPath(); g.moveTo(1.2, -2.55); g.lineTo(11.4, -2.85); g.stroke();  // spine
      g.beginPath();
      g.moveTo(2.2, -1.5); g.quadraticCurveTo(7.5, -1.7, 12.4, -1.1); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.3;
      g.beginPath();
      g.moveTo(1.4, 1.35); g.quadraticCurveTo(8, 1.5, 15.6, -0.55); g.stroke();  // edge
    }
    // fuller groove
    g.strokeStyle = 'rgba(30,33,38,0.6)'; g.lineWidth = 0.6;
    g.beginPath(); g.moveTo(1.6, -1.5); g.lineTo(9.8, -1.7); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 0.3;
    g.beginPath(); g.moveTo(1.6, -1.1); g.lineTo(9.6, -1.3); g.stroke();
    // jimping on spine
    g.fillStyle = 'rgba(0,0,0,0.5)';
    for (let i = 0; i < 5; i++) g.fillRect(1 + i * 0.7, -3, 0.35, 0.7);
    g.save();
    g.globalCompositeOperation = 'source-atop';
    scratches(g, 1, -2.4, 13, 4, rng, { n: 8, color: 'rgba(235,240,248,0.3)' });
    g.restore();
  });
}

// ============================ P-12 "WASP" (SMG) ============================
// Original compact submachine gun: stamped-steel receiver, folding stock,
// stubby handguard, straight box mag. Same grip-point convention as the
// rifle (origin = trigger-hand grip, muzzle at +x).
// ---- Laser SMG ----
//
// This was the last genuine palette swap left in the roster: it called
// paintSmgBody, so it was the P-12 in red. The occupancy-grid uniqueness test
// only ever separated the two by the random wear speckle they happened to get
// from the shared rng, which is not a silhouette difference at all — it was a
// false pass, and shifting the rng stream elsewhere exposed it.
//
// The frame here shares nothing with the P-12 but its size class: a slab
// emitter housing instead of an upper receiver, an exposed lens stack down the
// top deck, a vertical foregrip, and a side-mounted battery instead of a
// bottom magazine well. Box matches paintSmgBody (x −14..+24, anchor (14,9))
// so the smg mount points and hand IK still apply.
function paintLaserSmg(finish) {
  const rec = (finish && finish.rec) || '#3a1420';
  const poly = (finish && finish.poly) || '#280d16';
  const core = (finish && finish.core) || [255, 70, 90];
  const [cr, cg, cb] = core;
  return makeSprite(44, 22, 15, 13, (g) => {
    g.translate(15, 13);
    const emissive = (x, y, w, h, a) => {
      g.save(); g.globalCompositeOperation = 'lighter';
      g.fillStyle = `rgba(${cr},${cg},${cb},${a})`;
      g.fillRect(x, y, w, h); g.restore();
    };

    // rear counterweight block — no folding wire stock at all
    g.fillStyle = metal(g, -12, -2, shade(rec, -0.14));
    rr(g, -13.5, -6.2, 8, 7.4, 1.6); g.fill();
    emissive(-12.6, -4.6, 1.4, 4.2, 0.5);

    // slab emitter housing: one continuous wedge, deeper at the front
    g.fillStyle = metal(g, -6, -3, rec);
    g.beginPath();
    g.moveTo(-6, -7.4); g.lineTo(17, -8.6); g.lineTo(19, -3.6);
    g.lineTo(8.4, -1.4); g.lineTo(-6, -1.8);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.10)';
    g.fillRect(-6, -7.4, 23, 0.9);

    // lens stack down the top deck — three rings, brightest at the muzzle
    for (let i = 0; i < 3; i++) {
      const x = 4 + i * 4.6;
      g.fillStyle = shade(rec, -0.24);
      rr(g, x, -9.4, 3, 2.4, 0.6); g.fill();
      emissive(x + 0.4, -9, 2.2, 1.6, 0.35 + i * 0.16);
    }
    // muzzle aperture
    g.fillStyle = shade(rec, 0.14);
    rr(g, 19, -8.2, 3.4, 4.6, 1); g.fill();
    emissive(20.6, -7.6, 1.6, 3.4, 0.7);

    // side battery, clipped flat to the housing flank (not a hanging mag)
    g.fillStyle = polymer(g, -3, 2, poly);
    rr(g, -2.4, -5.8, 9, 4.4, 1); g.fill();
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = `rgba(${cr},${cg},${cb},0.42)`;
    rr(g, -1.2, -4.8, 6.6, 1.4, 0.6); g.fill();
    g.restore();

    // pistol grip (hand anchors at 0,0 — same as the P-12 so the IK holds)
    g.fillStyle = polymer(g, -0.6, 7, poly);
    g.beginPath();
    g.moveTo(-0.8, -1.4); g.quadraticCurveTo(-2.2, 2.6, -3.6, 5.6);
    g.quadraticCurveTo(-3.8, 6.9, -2, 6.9);
    g.quadraticCurveTo(-0.2, 6.7, 0.4, 4.2); g.lineTo(1.4, -1);
    g.closePath(); g.fill();
    g.strokeStyle = shade(rec, -0.15); g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(1.2, -0.4); g.quadraticCurveTo(3.4, 2.4, 5.6, 0); g.stroke();

    // vertical foregrip — nothing else in the size class has one
    g.fillStyle = polymer(g, 9, 6, shade(poly, 0.06));
    // Top raised into the housing. The emitter's underside slopes from -1.6 to
    // -2.3 across the grip's width, so a grip starting flat at -1.4 hung below
    // it the whole way — joined by an antialiased pixel at one corner, which
    // is why an automated connectivity check passed it while the eye did not.
    rr(g, 9.4, -3.0, 3.2, 8.2, 1.3); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.35;
    for (let i = 0; i < 3; i++) {
      g.beginPath(); g.moveTo(9.6, 0.4 + i * 1.7); g.lineTo(12.4, 0.4 + i * 1.7); g.stroke();
    }

    g.save();
    g.globalCompositeOperation = 'source-atop';
    scratches(g, -14, -10, 37, 18, rng, { n: 6 });
    grunge(g, -14, -10, 37, 18, rng, { n: 30, dark: 0.1 });
    g.restore();
  });
}

function paintSmgBody(finish) {
  const rec = (finish && finish.rec) || '#3a3d42';
  const poly = (finish && finish.poly) || '#26282b';
  // Box x -16..+26, y -13..+9. Was 40x17 at (14,9): the folding stock ran off
  // the left wall and the sight rail off the top, both sheared flat.
  return makeSprite(44, 23, 16, 13, (g) => {
    g.translate(16, 13);
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
    g.save();
    g.globalCompositeOperation = 'source-atop';
    scratches(g, -13, -8, 36, 12, rng, { n: 20, color: 'rgba(200,208,220,0.15)' });
    grunge(g, -14, -8.5, 38, 15, rng, { n: 50, dark: 0.1, light: 0.04 });
    g.restore();
    speckle(g, 8.6, -7.6, 11, 5, 28);
    g.strokeStyle = 'rgba(198,212,228,0.14)'; g.lineWidth = 0.35;
    g.beginPath(); g.moveTo(-4, -8.45); g.lineTo(14, -8.45); g.stroke();
    formLight(g, -14, -12, 40, 24);
    if (finish && finish.core) drawCore(g, -2, -6.2, 12, -6.2, finish.core);
  });
}
function paintSmgMag(finish) {
  const body = (finish && finish.poly) || '#26282b';
  // straight box mag; anchor at top (feed) point.
  return makeSprite(7, 15, 3.5, 1, (g) => {
    g.translate(3.5, 1);
    g.translate(0, -0.8);   // seated into the well, same as the rifle's
    // 5.2 units across and lit to shade(body, 0.32) on its left edge, this
    // magazine was as wide and as bright as the pistol grip immediately in
    // front of it — the two merged into one fat handle. Narrower, darker, and
    // detailed as a magazine rather than a gripped surface.
    const skin = shade(body, -0.10);
    g.fillStyle = lingrad(g, -2, 0, 2, 0, [
      [0, shade(skin, 0.14)], [0.42, skin], [1, shade(skin, -0.36)],
    ]);
    rr(g, -1.9, 0, 3.8, 12.4, 0.7); g.fill();
    // witness holes, not grip bands
    g.fillStyle = 'rgba(0,0,0,0.44)';
    for (let i = 0; i < 4; i++) { rr(g, -0.7, 2.0 + i * 2.6, 1.4, 0.9, 0.4); g.fill(); }
    g.fillStyle = shade(skin, -0.44);
    rr(g, -2.2, 11.9, 4.4, 1.9, 0.5); g.fill();
    g.fillStyle = 'rgba(226,232,240,0.13)';
    g.fillRect(-2.1, 12.0, 4.2, 0.3);
    g.strokeStyle = 'rgba(226,232,240,0.18)'; g.lineWidth = 0.4;
    g.beginPath(); g.moveTo(1.95, 0.8); g.lineTo(1.95, 11.4); g.stroke();
    speckle(g, -1.9, 0, 3.8, 12, 18);
  });
}

// ============================ "RAVAGE" bowie (knife finish) ============
// Alternate blade geometry for the TALON-7 grip: straight clip-point bowie
// with a blackened Cerakote finish, unlocked as a knife variant. `finish`
// optionally overrides the handle wrap colour and/or swaps the blade for an
// emissive energy edge (same convention as paintKnife's `blade` override),
// so higher-rarity bowie variants can read as visibly distinct without a
// second geometry.
function paintKnifeBowie(finish) {
  const handle = (finish && finish.handle) || ['#2a2c26', '#1e201a', '#121310'];
  const blade = finish && finish.blade;
  return makeSprite(22, 9, 6, 4.5, (g) => {
    g.translate(6, 4.5);
    g.fillStyle = lingrad(g, 0, -2.6, 0, 2.8, [
      [0, handle[0]], [0.5, handle[1]], [1, handle[2]],
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
    // straight clip-point blade — blackened steel, or an emissive energy edge
    g.fillStyle = blade
      ? lingrad(g, 0, -2.6, 0, 2.2, [
          [0, '#eafcff'], [0.38, blade], [0.62, shade(blade, -0.35)], [1, shade(blade, -0.6)],
        ])
      : lingrad(g, 0, -2.6, 0, 2.2, [
          [0, '#4c4e50'], [0.4, '#33353a'], [1, '#1c1d20'],
        ]);
    if (blade) { g.shadowColor = blade; g.shadowBlur = 5; }
    g.beginPath();
    g.moveTo(0.7, -2.4);
    g.lineTo(11.4, -2.3);
    g.quadraticCurveTo(14.6, -1.2, 16.4, 0.3);
    g.quadraticCurveTo(11.5, 1.2, 6, 1.7);
    g.quadraticCurveTo(2.8, 1.9, 0.7, 1.7);
    g.closePath(); g.fill();
    g.shadowBlur = 0;
    g.fillStyle = blade
      ? lingrad(g, 0, 0.2, 0, 1.9, [[0, 'rgba(240,253,255,0.95)'], [1, withA(blade, 0.25)]])
      : lingrad(g, 0, 0.2, 0, 1.9, [[0, 'rgba(150,155,160,0.6)'], [1, 'rgba(90,95,100,0.1)']]);
    g.beginPath();
    g.moveTo(1, 1); g.quadraticCurveTo(6, 1.3, 11.4, 0.5); g.quadraticCurveTo(14, -0.3, 16.1, 0.3);
    g.quadraticCurveTo(11.5, 1.3, 6, 1.75); g.quadraticCurveTo(2.8, 1.95, 1, 1.75);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 0.5;
    g.beginPath(); g.moveTo(2, -1.4); g.lineTo(10.6, -1.4); g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.55)';
    for (let i = 0; i < 5; i++) g.fillRect(1 + i * 0.7, -3, 0.35, 0.7);
    g.save();
    g.globalCompositeOperation = 'source-atop';
    scratches(g, 1, -2.2, 14, 4, rng, { n: 6, color: 'rgba(160,168,178,0.22)' });
    g.restore();
  });
}

// ==================== purpose-built energy weapon bodies ====================
// The energy roster used to be the VK-77 receiver in different colours, which
// meant a PARTICLE BEAM read as a rifle wearing a costume. These are their own
// silhouettes: no magazine well, no ejection port, no stock comb — the shapes
// come from what the weapon is supposed to *be* (a coil emitter, a rail, a
// pressurised tank) instead of from a cartridge gun.
//
// They share the rifle's weapon-space contract so the rig needs no changes:
// origin (0,0) is the trigger-hand grip, +x is the muzzle direction, and the
// support hand lands near x=17, y=-5.

// Shared: pistol grip + trigger guard at the origin. Every one of these is
// held the same way, so the grip is drawn once.
function energyGrip(g, poly, rec) {
  g.fillStyle = polymer(g, -1, 8, poly);
  g.beginPath();
  g.moveTo(-1.2, -1);
  g.quadraticCurveTo(-2.8, 3.4, -4.4, 6.6);
  g.quadraticCurveTo(-4.6, 8, -2.6, 8);
  g.quadraticCurveTo(-0.4, 7.8, 0.4, 5);
  g.lineTo(1.6, -0.6);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.4;
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.moveTo(-1.8 - i * 0.8, 1.5 + i * 1.6);
    g.lineTo(0.2 - i * 0.7, 2 + i * 1.6);
    g.stroke();
  }
  g.strokeStyle = shade(rec, -0.15); g.lineWidth = 1;
  g.beginPath(); g.moveTo(1.6, 0); g.quadraticCurveTo(4.6, 3.6, 7.4, 0.4); g.stroke();
  g.strokeStyle = '#1a1b1e'; g.lineWidth = 1.1;
  g.beginPath(); g.moveTo(3.8, 0.2); g.quadraticCurveTo(3.4, 1.8, 4.4, 2.6); g.stroke();
}

// Glowing coil ring seen edge-on — the motif that says "this accelerates
// something" rather than "this contains gunpowder".
function coilRing(g, x, yTop, yBot, c, w = 2.4) {
  const [r, gg, b] = c;
  g.fillStyle = `rgba(${r},${gg},${b},0.25)`;
  rr(g, x - w / 2, yTop, w, yBot - yTop, w / 2); g.fill();
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = `rgba(${Math.min(255, r + 70)},${Math.min(255, gg + 70)},${Math.min(255, b + 70)},0.75)`;
  rr(g, x - w / 4, yTop + 0.6, w / 2, yBot - yTop - 1.2, w / 4); g.fill();
  g.restore();
}

// ---- PARTICLE BEAM: coil emitter. Stacked accelerator rings down an open
// cage, twin plasma feed lines along the spine, no barrel at all — the
// business end is a flared emitter throat. ----
function paintParticleThrower(finish) {
  const rec = (finish && finish.rec) || '#2a1d55';
  const poly = (finish && finish.poly) || '#1c1440';
  const core = (finish && finish.core) || [190, 120, 255];
  const [cr, cg, cb] = core;
  return makeSprite(64, 26, 21, 15, (g) => {
    g.translate(21, 15);

    // rear energy cell — a fat cylinder where a stock would be
    g.fillStyle = metal(g, -9, 2, shade(rec, -0.1));
    rr(g, -19, -8.6, 12, 10.4, 3.2); g.fill();
    g.fillStyle = 'rgba(8,9,14,0.75)';
    rr(g, -17.4, -7, 3.2, 7.4, 1.2); g.fill();
    // charge indicator bars on the cell
    for (let i = 0; i < 3; i++) {
      g.fillStyle = `rgba(${cr},${cg},${cb},${0.85 - i * 0.22})`;
      g.fillRect(-13.2, -6.4 + i * 2.6, 4.4, 1.5);
    }

    // main spine housing (grip mounts to this)
    g.fillStyle = metal(g, -6, 3, rec);
    g.beginPath();
    g.moveTo(-7.4, -7);
    g.lineTo(9.5, -7);
    g.lineTo(9.5, -0.6);
    g.lineTo(-7.4, -0.6);
    g.closePath(); g.fill();
    energyGrip(g, poly, rec);

    // twin plasma feed lines running the length of the spine
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = `rgba(${cr},${cg},${cb},0.55)`; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(-8, -5.6); g.lineTo(24, -5.6); g.stroke();
    g.beginPath(); g.moveTo(-8, -2.2); g.lineTo(22, -2.2); g.stroke();
    g.restore();

    // open accelerator cage: two rails with coil rings threaded along them,
    // deliberately skeletal so the silhouette is unmistakable
    g.fillStyle = metal(g, -10.4, -8.6, shade(rec, 0.14));
    g.fillRect(9.5, -10.2, 22, 1.8);
    g.fillRect(9.5, 0.4, 22, 1.8);
    for (let i = 0; i < 5; i++) {
      coilRing(g, 12.5 + i * 4.6, -10.4, 2.4, core, 2.6);
    }

    // flared emitter throat — the "muzzle", a cone not a tube
    g.fillStyle = metal(g, -12, 3, shade(rec, 0.06));
    g.beginPath();
    g.moveTo(31.5, -9.4);
    g.lineTo(38.5, -12.4);
    g.lineTo(38.5, 3.6);
    g.lineTo(31.5, 1.2);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.7; g.stroke();
    // throat mouth glow
    g.save();
    g.globalCompositeOperation = 'lighter';
    const throat = lingrad(g, 36, -12, 40, 3.6, [
      [0, `rgba(${cr},${cg},${cb},0)`],
      [1, `rgba(${Math.min(255, cr + 60)},${Math.min(255, cg + 60)},${Math.min(255, cb + 60)},0.9)`],
    ]);
    g.fillStyle = throat;
    g.beginPath();
    g.moveTo(37, -11.6); g.lineTo(39, -12.4); g.lineTo(39, 3.6); g.lineTo(37, 2.8);
    g.closePath(); g.fill();
    g.restore();

    // support-hand shroud under the cage (hand lands ~x17,y-5)
    g.fillStyle = polymer(g, -3, 2, poly);
    rr(g, 13, -2.4, 11, 3.4, 1.2); g.fill();

    g.save();
    g.globalCompositeOperation = 'source-atop';
    scratches(g, -18, -11, 56, 15, rng, { n: 18, color: 'rgba(200,190,240,0.14)' });
    g.restore();
  });
}

// ---- GAUSS RAILGUN: two long parallel rails with a capacitor bank slung
// underneath. Reads as a linear accelerator — nothing about it is a rifle. ----
// ---- energy sidearms ----
// raygun and quantum were the last true palette swap in the roster: both were
// the C-9 pistol frame in a different colour. They get their own frames here,
// differing at the emitter, the top deck and the grip angle.
//
// Box matches paintPistolBody (x -7..+11, y -8..+7, anchor at the grip) so the
// hand IK and the pistol mount points still apply.
function paintEnergyPistol(variant, finish) {
  const grip = (finish && (finish.grip || finish.poly)) || '#2a2c30';
  const frame = (finish && (finish.frame || finish.rec)) || '#303236';
  const core = (finish && finish.core) || [200, 110, 255];
  const [cr, cg, cb] = core;
  const glow = (x, y, w, h, a) => {
    g0.save(); g0.globalCompositeOperation = 'lighter';
    g0.fillStyle = `rgba(${cr},${cg},${cb},${a})`;
    g0.fillRect(x, y, w, h);
    g0.restore();
  };
  let g0;
  // 18x15 at (7,8) cut the emitter bell off the front and the sight rib off
  // the top on both the ray gun and the quantum pistol.
  return makeSprite(24, 21, 8, 13, (g) => {
    g0 = g;
    g.translate(8, 13);

    // grip — raked back on the raygun, near-vertical on the quantum
    const rake = variant === 'bell' ? 2.2 : 0.6;
    g.fillStyle = polymer(g, -1, 6, grip);
    g.beginPath();
    g.moveTo(-1.4, -1); g.lineTo(2.2, -1);
    g.lineTo(1.4 - rake * 0.3, 6.6); g.lineTo(-2.6 - rake, 6.6);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.32)'; g.lineWidth = 0.35;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(-1.6 - i * 0.5, 1 + i * 1.5); g.lineTo(1.4 - i * 0.4, 1.3 + i * 1.5); g.stroke();
    }

    if (variant === 'bell') {
      // ---- RAY GUN: retro bulb emitter on a stubby frame ----
      g.fillStyle = metal(g, -6, 0, frame);
      rr(g, -5.4, -5.6, 11, 5.4, 1.4); g.fill();
      // Spherical charge bulb. It used to be one radial gradient fading to 10%
      // alpha at its own rim, so it had no edge at all — a purple fog the size
      // of the gun rather than a glass bulb sitting on it. Now: a housing
      // collar, glass with a defined rim, the plasma inside it, and a bloom
      // that stays well inside the silhouette.
      g.fillStyle = metal(g, -5.4, -3.6, shade(frame, -0.12));
      rr(g, -3.4, -5.6, 4.2, 2.2, 0.5); g.fill();        // collar onto the frame
      g.save();
      g.globalCompositeOperation = 'lighter';
      const halo = g.createRadialGradient(-1.4, -7.8, 1.2, -1.4, -7.8, 5.4);
      halo.addColorStop(0, `rgba(${cr},${cg},${cb},0.22)`);
      halo.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      g.fillStyle = halo;
      g.beginPath(); g.arc(-1.4, -7.8, 5.4, 0, Math.PI * 2); g.fill();
      g.restore();
      const bg = g.createRadialGradient(-2.4, -8.8, 0.3, -1.4, -7.8, 3.5);
      bg.addColorStop(0, `rgba(255,255,255,0.92)`);
      bg.addColorStop(0.38, `rgba(${cr},${cg},${cb},0.85)`);
      bg.addColorStop(1, `rgba(${Math.round(cr * 0.35)},${Math.round(cg * 0.3)},${Math.round(cb * 0.45)},0.92)`);
      g.fillStyle = bg;
      g.beginPath(); g.arc(-1.4, -7.8, 3.5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = shade(frame, 0.26); g.lineWidth = 0.9;
      g.beginPath(); g.arc(-1.4, -7.8, 3.5, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.42)'; g.lineWidth = 0.45;
      g.beginPath(); g.arc(-1.4, -7.8, 2.9, Math.PI * 1.05, Math.PI * 1.55); g.stroke();
      // flared muzzle bell
      g.fillStyle = metal(g, -7, -1, shade(frame, 0.1));
      g.beginPath();
      g.moveTo(5.6, -5.2); g.lineTo(11, -8.2); g.lineTo(11, 0.6); g.lineTo(5.6, -0.6);
      g.closePath(); g.fill();
      glow(9.4, -7, 1.6, 7.2, 0.55);
      // ring around the bell throat
      g.strokeStyle = shade(frame, -0.2); g.lineWidth = 0.9;
      g.beginPath(); g.moveTo(7.4, -6.4); g.lineTo(7.4, 0); g.stroke();
    } else {
      // ---- QUANTUM: flat slab frame with a split prism barrel ----
      g.fillStyle = metal(g, -7, 0, frame);
      rr(g, -6.4, -7, 13.4, 6.6, 0.8); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.10)';
      g.fillRect(-6.4, -7, 13.4, 0.9);
      // twin prism rails with an open slot between them
      g.fillStyle = metal(g, -6.6, -4.6, shade(frame, 0.08));
      rr(g, 7, -6.8, 4.2, 2, 0.5); g.fill();
      rr(g, 7, -2.6, 4.2, 2, 0.5); g.fill();
      glow(7, -4.9, 4.2, 2.4, 0.6);
      // floating core cube in a cutout on the deck
      g.fillStyle = 'rgba(8,9,14,0.8)';
      rr(g, -3.4, -6, 5, 4.4, 0.6); g.fill();
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.translate(-0.9, -3.8); g.rotate(Math.PI / 4);
      g.fillStyle = `rgba(${cr},${cg},${cb},0.85)`;
      g.fillRect(-1.3, -1.3, 2.6, 2.6);
      g.restore();
      // rear vent fins
      g.fillStyle = shade(frame, -0.22);
      for (let i = 0; i < 3; i++) g.fillRect(-6.2 + i * 1.7, -9.2, 1.1, 2.4);
    }

    g.save();
    g.globalCompositeOperation = 'source-atop';
    scratches(g, -6, -8, 17, 13, rng, { n: 6 });
    grunge(g, -6, -8, 17, 13, rng, { n: 34, dark: 0.1 });
    g.restore();
    formLight(g, -8, -13, 24, 21);
  });
}

// =====================================================================
//                        MODULAR WEAPON CHASSIS
// =====================================================================
// Eleven weapons used to share one rifle body with nothing but the receiver
// and polymer colours swapped — a Cryo Rifle was a Plasma Rifle was a Battle
// Rifle in a different shade. This builds each of them out of genuinely
// different structural parts instead.
//
// The grip zone (x -6..10, hand anchored at 0,0) is deliberately held
// constant across every chassis: gripA/gripB and the magazine attachment
// points are inherited from the rifle def, so the two-bone hand IK keeps
// landing exactly on the grips. Everything *outside* that zone — the stock
// behind it, the barrel assembly and muzzle ahead of it, the magazine below,
// the accessory above — is what varies, which is precisely what a silhouette
// is made of.

// ---- stocks (behind the grip, x < -6) ----
function chassisStock(g, kind, rec, poly, core) {
  const [cr, cg, cb] = core || [140, 190, 255];
  if (kind === 'solid') {
    // full rifle stock: straight comb, thick butt pad
    g.fillStyle = polymer(g, -9, 2, poly);
    g.beginPath();
    g.moveTo(-6, -7.6); g.lineTo(-21, -6.4); g.lineTo(-21.6, 2.2); g.lineTo(-6, -0.6);
    g.closePath(); g.fill();
    g.fillStyle = '#191a1c';
    g.fillRect(-22.4, -6.6, 1.8, 9);
    g.fillStyle = polymer(g, -9, -6, shade(poly, 0.08));
    rr(g, -17, -9, 8, 2.6, 1); g.fill();
  } else if (kind === 'skeleton') {
    // open frame: two thin rails and a hollow centre
    g.strokeStyle = shade(rec, -0.05); g.lineWidth = 2.1;
    g.beginPath(); g.moveTo(-6, -6.6); g.lineTo(-20, -5.4); g.stroke();
    g.beginPath(); g.moveTo(-6, -1.2); g.lineTo(-19, 0.6); g.stroke();
    g.strokeStyle = shade(rec, -0.2); g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-20, -5.4); g.lineTo(-19.6, 0.8); g.stroke();
    g.fillStyle = '#191a1c';
    g.fillRect(-21.4, -6, 1.7, 7.6);
  } else if (kind === 'folded') {
    // side-folded stock: a short stub tucked along the receiver
    g.fillStyle = metal(g, -8, -3, shade(rec, -0.12));
    rr(g, -14, -8.2, 8.5, 3, 1.2); g.fill();
    g.fillStyle = polymer(g, -3, 1, poly);
    rr(g, -9, -5.4, 3.4, 5.4, 1); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.09)';
    g.fillRect(-14, -8.2, 8.5, 0.8);
  } else if (kind === 'brace') {
    // single-strut brace with a shoulder pad
    g.fillStyle = metal(g, -6, -2, shade(rec, -0.06));
    g.fillRect(-17, -5.4, 11, 2.4);
    g.fillStyle = polymer(g, -8, 2, poly);
    g.beginPath();
    g.moveTo(-17, -8.4); g.lineTo(-13.5, -8); g.lineTo(-13.5, 1.6); g.lineTo(-17, 2);
    g.closePath(); g.fill();
  } else if (kind === 'tank') {
    // pressure vessel where a stock would be — the energy-weapon read
    g.fillStyle = metal(g, -9, 2, shade(rec, -0.08));
    rr(g, -21, -8.4, 15, 11, 5); g.fill();
    g.strokeStyle = 'rgba(8,9,14,0.5)'; g.lineWidth = 0.9;
    for (let i = 1; i < 4; i++) {
      g.beginPath(); g.moveTo(-21 + i * 3.6, -8.2); g.lineTo(-21 + i * 3.6, 2.4); g.stroke();
    }
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = `rgba(${cr},${cg},${cb},0.5)`;
    rr(g, -19, -6.6, 2.2, 7.6, 1); g.fill();
    g.restore();
  }
  // 'none' draws nothing — the receiver simply ends
}

// ---- barrel assemblies (ahead of the handguard, x > 10) ----
function chassisBarrel(g, kind, rec, core) {
  const [cr, cg, cb] = core || [140, 190, 255];
  const g0 = g;
  const emissive = (x, y, w, h, a) => {
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = `rgba(${cr},${cg},${cb},${a})`;
    g.fillRect(x, y, w, h);
    g.restore();
  };

  if (kind === 'long') {
    // Twenty-two units of featureless bar was a quarter of the weapon's length
    // with nothing on it. It steps down past the gas block the way a real
    // profile does, and ends in a ported flash hider rather than a knob.
    g.fillStyle = metal(g, -6.8, -3.8, shade(rec, -0.10));
    g.fillRect(24, -6.4, 8, 2.6);                 // chamber end, thicker
    g.fillStyle = metal(g, -6.5, -4.1, shade(rec, -0.16));
    g.fillRect(32, -6.1, 12.4, 2.0);              // stepped-down profile
    // gas block + folded front sight
    g.fillStyle = metal(g, -8.4, -4, shade(rec, 0.04));
    rr(g, 30.4, -8.0, 3.2, 4.2, 0.5); g.fill();
    g.fillStyle = shade(rec, -0.34);
    g.fillRect(31.4, -9.3, 1.1, 1.5);
    // ported flash hider
    g.fillStyle = metal(g, -7.6, -3.4, rec);
    rr(g, 44, -7.2, 5.2, 4, 1); g.fill();
    g.fillStyle = '#0e0f11';
    for (let i = 0; i < 3; i++) g.fillRect(44.9 + i * 1.4, -7.5, 0.7, 2.2);
    g.beginPath(); g.ellipse(49.0, -5.2, 0.5, 1.2, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(226,232,240,0.22)'; g.lineWidth = 0.3;
    g.beginPath(); g.moveTo(44.2, -7.0); g.lineTo(48.9, -7.0); g.stroke();
  } else if (kind === 'heavy') {
    // thick fluted barrel with a bipod stub
    g.fillStyle = metal(g, -7.4, -3, shade(rec, -0.05));
    rr(g, 22, -7.4, 20, 4.6, 1.4); g.fill();
    g.strokeStyle = 'rgba(8,9,12,0.4)'; g.lineWidth = 0.7;
    for (let i = 0; i < 5; i++) {
      g.beginPath(); g.moveTo(25 + i * 3.4, -7); g.lineTo(25 + i * 3.4, -3.2); g.stroke();
    }
    // Bipod. Two bare rectangles hanging off the barrel read as chopsticks —
    // no hinge to swing on and no foot to stand on. It now has a yoke it
    // folds from, splayed legs and pads at the ends.
    g.fillStyle = shade(rec, -0.22);
    rr(g, 29.4, -3.6, 6.6, 2.4, 0.6); g.fill();      // yoke under the barrel
    g.fillStyle = shade(rec, -0.4);
    g.beginPath(); g.arc(32.7, -2.4, 0.85, 0, Math.PI * 2); g.fill();  // pivot
    g.fillStyle = shade(rec, -0.32);
    for (const [top, bot] of [[30.4, 28.9], [34.9, 36.4]]) {
      g.beginPath();
      g.moveTo(top - 0.8, -2.2); g.lineTo(top + 0.9, -2.2);
      g.lineTo(bot + 0.85, 4.0); g.lineTo(bot - 0.85, 4.0);
      g.closePath(); g.fill();
      // foot pad
      g.fillStyle = shade(rec, -0.46);
      rr(g, bot - 1.6, 3.6, 3.2, 1.2, 0.4); g.fill();
      g.fillStyle = shade(rec, -0.32);
    }
  } else if (kind === 'shroud') {
    // perforated cooling shroud over a thin barrel
    g.fillStyle = metal(g, -8, -2.6, shade(rec, 0.04));
    rr(g, 21, -8, 20, 6, 2); g.fill();
    g.fillStyle = 'rgba(8,9,12,0.75)';
    for (let i = 0; i < 6; i++) {
      g.beginPath(); g.arc(24 + i * 2.9, -5, 1.05, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = metal(g, -6.4, -4.4, shade(rec, -0.15));
    g.fillRect(41, -6.2, 6, 2.2);
  } else if (kind === 'coil') {
    // induction coils stacked along an exposed rail
    g.fillStyle = metal(g, -6, -4, shade(rec, -0.2));
    g.fillRect(20, -5.8, 26, 1.8);
    for (let i = 0; i < 5; i++) {
      const x = 22 + i * 5;
      g.fillStyle = metal(g, -8.4, -1.4, shade(rec, i % 2 ? -0.16 : 0.12));
      rr(g, x, -8.6, 2.6, 7.4, 1); g.fill();
      emissive(x, -5.6, 2.6, 1.6, 0.55);
    }
    emissive(20, -5.4, 28, 1.1, 0.5);
  } else if (kind === 'twin') {
    // Twin accelerator rails. The gap used to be 2.6 units between rails that
    // were each 2.4 thick, which at real size closed up into one solid bar —
    // the hole that makes this outline is only worth drawing if it survives.
    // Thinner rails, a wider gap, and struts that read as struts.
    g.fillStyle = metal(g, -10.2, -7.4, shade(rec, 0.10));
    rr(g, 20, -10.2, 26, 2.0, 0.7); g.fill();
    g.fillStyle = metal(g, -2.4, -0.2, shade(rec, -0.20));
    rr(g, 20, -2.4, 26, 2.0, 0.7); g.fill();
    // two struts across the gap, near and far
    g.fillStyle = shade(rec, -0.3);
    for (const sx of [26.5, 35.5]) g.fillRect(sx, -8.6, 1.6, 6.4);
    emissive(20.6, -8.2, 25, 5.8, 0.16);
    // muzzle bridge closing the rails
    g.fillStyle = metal(g, -10.6, 0, shade(rec, 0.04));
    rr(g, 43.4, -10.6, 2.8, 10.6, 0.8); g.fill();
    emissive(43.8, -8.6, 2.0, 6.6, 0.45);
  } else if (kind === 'nozzle') {
    // flared emitter bell
    g.fillStyle = metal(g, -6, -3, shade(rec, -0.06));
    g.fillRect(20, -6.4, 14, 3);
    g.fillStyle = metal(g, -9, 1, shade(rec, 0.1));
    g.beginPath();
    g.moveTo(34, -6.8); g.lineTo(44, -10.2); g.lineTo(44, 3.4); g.lineTo(34, -0.2);
    g.closePath(); g.fill();
    emissive(41.6, -9, 2.4, 11, 0.5);
    g.fillStyle = 'rgba(8,9,12,0.5)';
    g.fillRect(37, -8.4, 0.9, 9.4);
  } else if (kind === 'vent') {
    // Ported heat block. The ports used to be dark rectangles painted onto a
    // plain bar, so in silhouette this was indistinguishable from every other
    // energy barrel. They are cut clean through the top now — the outline is
    // castellated, which is the whole point of the part.
    g.fillStyle = metal(g, -9.4, -3.4, shade(rec, -0.04));
    rr(g, 21, -9.4, 17, 6.8, 1.4); g.fill();
    // knock the ports out of the block itself
    g.save();
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 4; i++) rr(g, 23.2 + i * 3.7, -10.2, 2.0, 4.4, 0.5), g.fill();
    g.restore();
    // lit walls inside each port
    g.fillStyle = 'rgba(226,232,240,0.16)';
    for (let i = 0; i < 4; i++) {
      g.fillRect(22.9 + i * 3.7, -5.9, 2.6, 0.35);
    }
    emissive(22.4, -5.6, 15, 1.3, 0.5);
    // stepped muzzle
    g.fillStyle = metal(g, -6.6, -3.8, rec);
    rr(g, 38, -7.0, 5.5, 3.6, 1); g.fill();
    g.fillStyle = '#0c0e11';
    g.beginPath(); g.ellipse(43.2, -5.2, 0.6, 1.4, 0, 0, Math.PI * 2); g.fill();
  } else if (kind === 'arc') {
    // ---- LIGHTNING: a pair of tesla prongs with a discharge between them.
    // Nothing else in the arsenal forks at the muzzle, so the outline says
    // which gun this is before any colour does.
    g.fillStyle = metal(g, -6.6, -3.2, shade(rec, -0.06));
    g.fillRect(20, -6.6, 14, 3.4);
    g.fillStyle = metal(g, -7.6, -2.2, shade(rec, 0.08));
    rr(g, 32, -7.8, 4.4, 5.8, 1); g.fill();
    // the two horns
    g.fillStyle = metal(g, -12, 2, shade(rec, 0.02));
    for (const dir of [-1, 1]) {
      g.beginPath();
      g.moveTo(35, -4.9 + dir * 0.9);
      g.quadraticCurveTo(41, -4.9 + dir * 5.2, 45.6, -4.9 + dir * 5.6);
      g.lineTo(45.6, -4.9 + dir * 4.0);
      g.quadraticCurveTo(41.4, -4.9 + dir * 3.6, 37.4, -4.9 + dir * 0.5);
      g.closePath(); g.fill();
      // insulator collar at the root of each horn
      g.fillStyle = shade(rec, -0.34);
      rr(g, 35.4, -5.4 + dir * 1.6, 1.6, 1.8, 0.4); g.fill();
      g.fillStyle = metal(g, -12, 2, shade(rec, 0.02));
    }
    // electrode tips + the arc jumping the gap
    g.fillStyle = shade(rec, 0.3);
    g.beginPath(); g.arc(45.6, -10.5, 1.0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(45.6, 0.7, 1.0, 0, Math.PI * 2); g.fill();
    emissive(45.0, -10.2, 1.3, 10.6, 0.30);
    g0.save(); g0.globalCompositeOperation = 'lighter';
    const ar = makeRng(613);
    g0.beginPath(); g0.moveTo(45.6, -10.0);
    for (let i = 1; i <= 6; i++) g0.lineTo(45.6 + (ar() - 0.5) * 2.4, -10.0 + (i / 6) * 10.0);
    g0.strokeStyle = `rgba(${Math.min(255, cr + 70)},${Math.min(255, cg + 70)},${Math.min(255, cb + 70)},0.75)`;
    g0.lineWidth = 0.45; g0.lineJoin = 'miter'; g0.stroke();
    g0.restore();
  } else if (kind === 'lens') {
    // ---- GRAVITY: a heavy focusing ring on a short stem. A big open circle
    // is the one outline no other weapon here has.
    g.fillStyle = metal(g, -6.4, -3.4, shade(rec, -0.08));
    g.fillRect(20, -6.4, 12, 3.2);
    g.fillStyle = metal(g, -13, 4, shade(rec, 0.06));
    g.beginPath(); g.arc(39, -4.8, 8.2, 0, Math.PI * 2); g.fill();
    g.save();
    g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.arc(39, -4.8, 5.4, 0, Math.PI * 2); g.fill();
    g.restore();
    // three lobes clamping the ring to the stem
    g.fillStyle = metal(g, -8, 0, shade(rec, -0.12));
    for (const a of [Math.PI, Math.PI * 0.55, Math.PI * 1.45]) {
      g.save(); g.translate(39, -4.8); g.rotate(a);
      rr(g, 4.4, -1.5, 4.4, 3, 0.8); g.fill();
      g.restore();
    }
    g.strokeStyle = 'rgba(226,232,240,0.22)'; g.lineWidth = 0.5;
    g.beginPath(); g.arc(39, -4.8, 7.9, Math.PI * 1.1, Math.PI * 1.85); g.stroke();
    // the field held inside the ring
    g0.save(); g0.globalCompositeOperation = 'lighter';
    const lg = g0.createRadialGradient(39, -4.8, 0.6, 39, -4.8, 5.4);
    lg.addColorStop(0, `rgba(${cr},${cg},${cb},0.55)`);
    lg.addColorStop(0.6, `rgba(${cr},${cg},${cb},0.16)`);
    lg.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    g0.fillStyle = lg;
    g0.beginPath(); g0.arc(39, -4.8, 5.4, 0, Math.PI * 2); g0.fill();
    g0.restore();
    g.strokeStyle = `rgba(${cr},${cg},${cb},0.5)`; g.lineWidth = 0.5;
    g.beginPath(); g.arc(39, -4.8, 5.4, 0, Math.PI * 2); g.stroke();
  } else if (kind === 'frost') {
    // ---- CRYO: a condenser stack — vanes standing off a chilled core, with
    // rime creeping along them. Reads as radiator fins, not a tube.
    // Chilled core, thick enough that the vanes are standing on something.
    g.fillStyle = metal(g, -7.4, -2.4, shade(rec, -0.04));
    rr(g, 20, -7.4, 24, 5.0, 0.8); g.fill();
    // Vanes: nine close-packed fins, darker than the core (they sit in its
    // shadow) with rime only on the exposed tips. Six tall pale spikes spread
    // wide read as a garden fence, not a radiator.
    for (let i = 0; i < 9; i++) {
      const x = 20.8 + i * 2.5, h = 3.2 + (i % 3 === 1 ? 1.5 : 0);
      g.fillStyle = metal(g, -7.6 - h, -4.4, shade(rec, -0.22));
      rr(g, x, -7.6 - h, 1.7, h + 1.6, 0.4); g.fill();
      g.fillStyle = 'rgba(214,236,255,0.42)';
      g.fillRect(x + 0.15, -7.5 - h, 1.4, 0.55);
      g.fillStyle = 'rgba(6,10,16,0.32)';
      g.fillRect(x + 1.7, -7.4 - h, 0.5, h + 1.2);
    }
    emissive(20.6, -5.2, 23, 1.4, 0.42);
    // chilled muzzle ring
    g.fillStyle = metal(g, -7.4, -2.2, shade(rec, 0.1));
    rr(g, 43.4, -7.4, 3.6, 5.4, 1); g.fill();
    g.fillStyle = '#0b1016';
    g.beginPath(); g.ellipse(46.6, -4.7, 0.6, 1.7, 0, 0, Math.PI * 2); g.fill();
    emissive(43.6, -6.9, 3.2, 4.4, 0.28);
  } else if (kind === 'stub') {
    // short heavy muzzle with a wide choke
    g.fillStyle = metal(g, -7.6, -2.6, shade(rec, -0.02));
    rr(g, 20, -7.8, 11, 5.4, 1.6); g.fill();
    g.fillStyle = metal(g, -8.6, -1.6, shade(rec, 0.12));
    rr(g, 31, -8.6, 4.6, 7, 1.6); g.fill();
    g.fillStyle = '#0d0e10';
    g.beginPath(); g.ellipse(35.4, -5, 1.1, 3, 0, 0, Math.PI * 2); g.fill();
  }
}

// ---- magazines / feed (below the receiver) ----
function chassisMag(g, kind, rec, poly, core) {
  const [cr, cg, cb] = core || [140, 190, 255];
  if (kind === 'stick') {
    // Six units across in the same tone as the grip in front of it, this read
    // as a second handle. Narrower, darker, with witness holes and a
    // floorplate — the details that say "magazine" at a glance.
    const skin = shade(poly, -0.14);
    g.fillStyle = polymer(g, 1, 12, skin);
    g.beginPath();
    g.moveTo(7.0, 0.2); g.lineTo(11.4, 0.2); g.lineTo(10.5, 11.6); g.lineTo(6.4, 11.6);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.42)';
    for (let i = 0; i < 4; i++) { rr(g, 8.0 - i * 0.12, 2.0 + i * 2.4, 1.5, 0.9, 0.4); g.fill(); }
    g.fillStyle = shade(skin, -0.42);
    rr(g, 6.1, 11.2, 4.7, 1.8, 0.5); g.fill();
    g.fillStyle = 'rgba(226,232,240,0.16)';
    g.fillRect(10.6, 0.6, 0.34, 10.6);
  } else if (kind === 'box') {
    const skin = shade(poly, -0.12);
    g.fillStyle = polymer(g, 1, 9, skin);
    rr(g, 6.0, 0.2, 6.6, 9.2, 1); g.fill();
    g.fillStyle = 'rgba(8,9,12,0.42)';
    for (let i = 0; i < 3; i++) { rr(g, 7.6, 1.8 + i * 2.4, 1.5, 0.9, 0.4); g.fill(); }
    g.fillStyle = shade(skin, -0.4);
    rr(g, 5.7, 9.0, 7.2, 1.7, 0.5); g.fill();
    g.fillStyle = 'rgba(226,232,240,0.15)';
    g.fillRect(12.3, 0.6, 0.32, 8.4);
  } else if (kind === 'drum') {
    g.fillStyle = metal(g, 1, 14, shade(rec, -0.12));
    g.beginPath(); g.arc(9.4, 7.4, 6.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = shade(rec, 0.1);
    g.beginPath(); g.arc(9.4, 7.4, 2.4, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(8,9,12,0.4)'; g.lineWidth = 0.8;
    g.beginPath(); g.arc(9.4, 7.4, 4.6, 0, Math.PI * 2); g.stroke();
  } else if (kind === 'belt') {
    // Ammo belt out of a feed tray. The rounds used to be six loose rectangles
    // whose tops were scattered +/-1.2 about the tray's lower edge, so half of
    // them hung in clear air below the gun — the belt read as spilled bricks.
    // They hang from a single link strip that starts inside the tray.
    g.fillStyle = metal(g, 0, 6, shade(rec, -0.2));
    rr(g, 4.6, 0.2, 10, 5.4, 1); g.fill();
    g.fillStyle = 'rgba(8,9,12,0.5)';
    g.fillRect(5.2, 4.4, 8.8, 1.2);
    const sag = (i) => 4.9 + Math.sin(i * 0.55) * 0.55 + i * 0.42;
    // link strip the cases are pinned to
    g.fillStyle = shade(rec, -0.34);
    g.beginPath();
    g.moveTo(5.0, sag(0));
    for (let i = 0; i <= 6; i++) g.lineTo(5.0 + i * 1.75, sag(i));
    for (let i = 6; i >= 0; i--) g.lineTo(5.0 + i * 1.75, sag(i) + 1.5);
    g.closePath(); g.fill();
    for (let i = 0; i < 6; i++) {
      const x = 5.4 + i * 1.75, y = sag(i) + 0.3;
      // case
      g.fillStyle = lingrad(g, x, 0, x + 1.3, 0, [
        [0, '#c39a49'], [0.45, '#9c7833'], [1, '#5f4620'],
      ]);
      g.fillRect(x, y, 1.3, 3.6);
      // projectile tip, so a case reads as a round rather than a stick
      g.fillStyle = '#6d5a3c';
      g.beginPath();
      g.moveTo(x, y + 3.6); g.lineTo(x + 1.3, y + 3.6);
      g.lineTo(x + 0.65, y + 5.0); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,240,205,0.22)';
      g.fillRect(x + 0.15, y, 0.28, 3.4);
    }
  } else if (kind === 'cell') {
    // translucent energy cell with a charge window
    g.fillStyle = polymer(g, 1, 10, shade(poly, -0.05));
    rr(g, 5.6, 0.2, 7.6, 10, 1.6); g.fill();
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = `rgba(${cr},${cg},${cb},0.55)`;
    rr(g, 7, 1.6, 4.8, 7, 1); g.fill();
    g.restore();
    g.fillStyle = 'rgba(8,9,12,0.45)';
    g.fillRect(7, 4.4, 4.8, 0.8);
  }
  // 'none' — no feed device at all (gravity/beam weapons)
}

// ---- topside accessory ----
// The receiver's top deck. Every accessory below has to reach this line, or
// it is floating: the deck is what an optic's mount, a carry handle's feet or
// a heat sink's base physically bolts to.
//
// None of them did. The scope's rings stopped at -9.2, the carry handle's
// feet at -10.4, the emitter at -10.2 and the fin stack's base plate at -9.4,
// leaving gaps of 1.0 to 2.2 units of clear air between the accessory and the
// gun on all eleven chassis weapons. (This is a different bug from the one
// fixed in skins.js, which was about skin-*added* optics; these are the
// weapon's own built-in parts.) Each one now runs down to the deck.
const DECK_Y = -8.2;

function chassisTop(g, kind, rec, core) {
  const [cr, cg, cb] = core || [140, 190, 255];
  if (kind === 'carry') {
    // Fixed carry handle. The old outline was a 16 x 7.2 square loop standing
    // clear of the receiver — it read as a suitcase handle bolted to the gun.
    // Lower, shorter, with radiused corners and a grip wrap across the top.
    const TOP = -13.4;
    g.fillStyle = metal(g, -14, -9, shade(rec, 0.02));
    g.beginPath();
    g.moveTo(-1, DECK_Y);
    g.lineTo(-1, TOP + 1.6);
    g.quadraticCurveTo(-1, TOP, 0.8, TOP);
    g.lineTo(11.4, TOP);
    g.quadraticCurveTo(13.2, TOP, 13.2, TOP + 1.6);
    g.lineTo(13.2, DECK_Y);
    g.lineTo(10.9, DECK_Y);
    g.lineTo(10.9, TOP + 2.1);
    g.lineTo(1.3, TOP + 2.1);
    g.lineTo(1.3, DECK_Y);
    g.closePath(); g.fill();
    // knurled grip wrap on the bar the hand actually takes
    g.fillStyle = 'rgba(8,9,12,0.5)';
    for (let i = 0; i < 7; i++) g.fillRect(2.6 + i * 1.2, TOP + 0.15, 0.55, 1.8);
    g.fillStyle = 'rgba(226,232,240,0.18)';
    g.fillRect(0.6, TOP + 0.05, 11.8, 0.3);
  } else if (kind === 'scope') {
    // Sat 3.2 units clear of the deck on two thin posts, with a tube as thick
    // as the receiver and a saturated cyan disc on its front face — a thermos
    // on scaffolding. Lower, slimmer, on solid rings, with the bells at the
    // ends where a scope actually has them and glass instead of a cyan chip.
    const TUBE_T = -14.9, TUBE_B = -11.6, MID = (TUBE_T + TUBE_B) / 2;
    // one-piece mount: base plate on the deck plus two solid rings
    g.fillStyle = shade(rec, -0.2);
    g.fillRect(0.4, DECK_Y - 1.5, 12.4, 1.7);
    g.fillStyle = shade(rec, -0.32);
    rr(g, 1.4, TUBE_B - 0.4, 2.6, DECK_Y - TUBE_B + 1.0, 0.5); g.fill();
    rr(g, 9.2, TUBE_B - 0.4, 2.6, DECK_Y - TUBE_B + 1.0, 0.5); g.fill();
    // tube
    g.fillStyle = metal(g, TUBE_T, TUBE_B, shade(rec, 0.06));
    rr(g, 0.4, TUBE_T, 13.4, TUBE_B - TUBE_T, 1.5); g.fill();
    // ocular bell (rear, at the shooter) and objective bell (front)
    g.fillStyle = metal(g, TUBE_T - 0.7, TUBE_B + 0.7, shade(rec, 0.02));
    rr(g, -1.6, TUBE_T - 0.7, 3.0, TUBE_B - TUBE_T + 1.4, 1.1); g.fill();
    rr(g, 12.6, TUBE_T - 0.6, 3.2, TUBE_B - TUBE_T + 1.2, 1.1); g.fill();
    // turret
    g.fillStyle = shade(rec, -0.12);
    rr(g, 5.6, TUBE_T - 1.5, 2.8, 1.7, 0.4); g.fill();
    // glass: dark, with a cool sheen across it — not a bright chip of colour
    g.fillStyle = lingrad(g, 0, TUBE_T, 0, TUBE_B, [
      [0, 'rgba(96,132,152,0.85)'], [0.45, 'rgba(24,38,46,0.95)'], [1, 'rgba(12,18,22,0.95)'],
    ]);
    rr(g, 14.4, TUBE_T + 0.2, 1.2, TUBE_B - TUBE_T + 0.4, 0.5); g.fill();
    g.fillStyle = 'rgba(190,222,238,0.35)';
    g.fillRect(14.6, TUBE_T + 0.5, 0.8, 0.7);
    // lit edge along the top of the tube
    g.fillStyle = 'rgba(226,232,240,0.20)';
    g.fillRect(1.0, TUBE_T + 0.1, 12.2, 0.32);
  } else if (kind === 'emitter') {
    // dorsal emitter fin with a lit slot
    g.fillStyle = metal(g, -15, -10, shade(rec, -0.1));
    g.beginPath();
    g.moveTo(-1, DECK_Y); g.lineTo(3, -15.2); g.lineTo(12, -15.2); g.lineTo(14, DECK_Y);
    g.closePath(); g.fill();
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = `rgba(${cr},${cg},${cb},0.6)`;
    g.fillRect(3.4, -13.4, 8, 1.5);
    g.restore();
  } else if (kind === 'fins') {
    // heat-sink fin stack on a base plate that sits flat on the deck
    g.fillStyle = shade(rec, -0.16);
    for (let i = 0; i < 5; i++) g.fillRect(0.5 + i * 2.7, -14.4, 1.7, 4.4);
    g.fillStyle = shade(rec, 0.08);
    g.fillRect(0, -10.6, 14.5, DECK_Y - -10.6 + 0.4);
  }
}

// The magazine as a detachable sprite.
//
// Anchored at the weapon-space ORIGIN (0,0), not at the magazine itself, and
// painted with chassisMag's own coordinates. Drawing it at magPos {0,0} then
// reproduces exactly where the body expects the well to be filled — the
// alignment is structural, not a number somebody has to keep in sync.
function paintChassisMag(kind, rec, poly, core) {
  if (!kind || kind === 'none') return null;
  // Box covers every feed device's extent: x 2.8..16, y 0.2..14 (the drum is
  // the widest and the stick the deepest), plus margin for the wear pass.
  const AX = 4, AY = 4;
  return makeSprite(24, 22, AX, AY, (g) => {
    g.translate(AX, AY);
    // Lifted into the receiver rather than hung below it. Every feed device
    // used to start at y 0.2 while the receiver's underside runs -0.4..0.4 and
    // the handguard's is -1.0, so the magazine met the gun along a hairline at
    // best and floated a unit clear of it at worst. It is drawn *behind* the
    // body, so overlapping into the well costs nothing visually and the joint
    // simply stops existing.
    g.translate(0, -1.2);
    chassisMag(g, kind, rec, poly, core);
    // Wear clipped to the magazine's own pixels, exactly as paintChassis does
    // for the body. Unclipped, these scattered over the whole 15x15 box and
    // left loose diagonal scratches hanging in the air under the gun with no
    // geometry beneath them — the stray marks visible below the grip on every
    // chassis weapon.
    g.save();
    g.globalCompositeOperation = 'source-atop';
    scratches(g, 2, 0, 15, 15, rng, { n: 3 });
    grunge(g, 2, 0, 15, 15, rng, { n: 16, dark: 0.1 });
    g.restore();
  });
}

// Composes one complete weapon body from its structural parts.
function paintChassis(cfg) {
  const rec = cfg.rec || COL.gunmetal;
  const poly = cfg.poly || COL.polymer;
  const core = cfg.core || [140, 190, 255];
  // Canvas box: local x −24..52, y −18..10.
  //
  // This used to be 60×20 anchored at (20,12), giving x −20..40 and y −12..8 —
  // smaller than the parts being drawn into it. Every barrel that reaches past
  // 40 (long ends at 49, shroud and coil at 47, twin at 46) was sliced off
  // square at the canvas edge, and every topside accessory was decapitated:
  // the scope sits at y −16.4 and the carry handle at −15.4, both well above
  // the old −12 ceiling. That flat cut is what read as an attachment floating
  // detached from the gun — it was not misplaced, it was cropped.
  return makeSprite(76, 28, 24, 18, (g) => {
    g.translate(24, 18);

    chassisStock(g, cfg.stock, rec, poly, core);

    // ---- receiver + grip: identical across every chassis so the hand IK
    // keeps landing on the grips no matter which parts are bolted on ----
    g.fillStyle = metal(g, -6, 4, rec);
    g.beginPath();
    g.moveTo(-6.5, -8.2); g.lineTo(12, -8.2); g.lineTo(12, -0.4);
    g.lineTo(6.2, 0.4); g.lineTo(1.8, 0.2); g.lineTo(-1, -0.6); g.lineTo(-6.5, -0.8);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.08)';
    g.fillRect(-6.5, -8.2, 18.5, 1.1);

    // pistol grip (hand anchors at 0,0)
    g.fillStyle = polymer(g, -1, 8, poly);
    g.beginPath();
    g.moveTo(-1.2, -1); g.quadraticCurveTo(-2.8, 3.4, -4.4, 6.6);
    g.quadraticCurveTo(-4.6, 8, -2.6, 8);
    g.quadraticCurveTo(-0.4, 7.8, 0.4, 5); g.lineTo(1.6, -0.6);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.4;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(-1.8 - i * 0.8, 1.5 + i * 1.6);
      g.lineTo(0.2 - i * 0.7, 2 + i * 1.6);
      g.stroke();
    }
    // trigger guard
    g.strokeStyle = shade(rec, -0.15); g.lineWidth = 1;
    g.beginPath(); g.moveTo(1.6, 0); g.quadraticCurveTo(4.6, 3.6, 7.4, 0.4); g.stroke();

    // The magazine is deliberately NOT painted here — it is a separate sprite
    // (paintChassisMag) so the reload animation can drop it out of the well.
    // Both are drawn from the same coordinates in chassisMag(), so the loaded
    // magazine sits in the well by construction rather than by a hand-tuned
    // offset that drifts the moment a chassis changes.

    // handguard bridging receiver to barrel — length varies per chassis
    const hgEnd = cfg.hg || 22;
    // Polymer, not another shade of the receiver. At shade(rec, -0.06) the
    // handguard was within a hair of the receiver's own value, so the front
    // half of every chassis weapon read as one continuous slab.
    g.fillStyle = polymer(g, -8.4, -1, poly);
    rr(g, 12, -8.4, hgEnd - 12, 7.4, 1.2); g.fill();
    g.fillStyle = 'rgba(8,9,12,0.46)';
    for (let x = 14; x < hgEnd - 2; x += 3.4) g.fillRect(x, -6.6, 1.3, 4);
    // seam where the handguard meets the receiver
    g.fillStyle = 'rgba(0,0,0,0.30)';
    g.fillRect(11.7, -8.2, 0.6, 7.2);

    chassisBarrel(g, cfg.barrel, rec, core);
    chassisTop(g, cfg.top, rec, core);

    // Shared wear pass so a chassis never looks like clean vector art.
    //
    // Clipped to the silhouette with source-atop. The wear scatters over the
    // whole box, and on the enlarged canvas that put loose speckle in the air
    // around the gun — dirt with nothing under it, which at a glance reads as
    // debris stuck to the weapon. source-atop can only mark pixels that are
    // already painted, so wear lands on metal and nowhere else.
    g.save();
    g.globalCompositeOperation = 'source-atop';
    scratches(g, -22, -16, 72, 24, rng, { n: 12 });
    grunge(g, -22, -16, 72, 24, rng, { n: 70, dark: 0.1 });
    g.restore();
    formLight(g, -24, -18, 76, 28);
  });
}

// ---- boss heavy weapons ----
// The two silhouettes that belong to bosses. They are deliberately oversized
// and top-heavy — a boss should be readable as a boss from its outline alone,
// before a single shot is fired, and an infantry rifle never did that.

// Rotary minigun: six-barrel cluster on a rotor, ammo drum slung underneath,
// spade grips at the rear. Nothing else in the arsenal has a barrel cluster,
// so the read is instant even in silhouette.
function paintMinigun(finish) {
  const rec = (finish && finish.rec) || '#33383e';
  const poly = (finish && finish.poly) || '#22262b';
  return makeSprite(80, 34, 24, 17, (g) => {
    g.translate(24, 17);

    // ammo drum hanging below the receiver
    g.fillStyle = metal(g, 2, 13, shade(rec, -0.2));
    rr(g, -12, 1.5, 20, 12, 3.4); g.fill();
    g.strokeStyle = 'rgba(8,9,12,0.55)'; g.lineWidth = 0.9;
    for (let i = 1; i < 4; i++) {
      g.beginPath(); g.moveTo(-12 + i * 5, 2.2); g.lineTo(-12 + i * 5, 12.8); g.stroke();
    }
    // feed chute from drum up into the receiver
    g.fillStyle = shade(rec, -0.32);
    g.beginPath();
    g.moveTo(4, 2.2); g.lineTo(10, -3.4); g.lineTo(13, -1.2); g.lineTo(7.5, 3.6);
    g.closePath(); g.fill();

    // Spade grips at the rear, on a backplate. Standing on their own they
    // read as an I-beam floating behind the gun with nothing joining them.
    g.fillStyle = metal(g, -8, 3, shade(rec, -0.14));
    rr(g, -17.5, -7, 4, 12, 1.2); g.fill();
    g.fillStyle = poly;
    rr(g, -20, -7.5, 4.2, 15, 1.6); g.fill();
    g.fillStyle = shade(poly, -0.2);
    rr(g, -21.5, -8.5, 7, 3.4, 1.2); g.fill();
    rr(g, -21.5, 5.4, 7, 3.4, 1.2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      g.beginPath(); g.moveTo(-19.7, -4.6 + i * 2.6); g.lineTo(-16.1, -4.6 + i * 2.6); g.stroke();
    }

    // receiver housing
    g.fillStyle = metal(g, -8, 3, rec);
    rr(g, -16, -8, 24, 11, 2.6); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.10)';
    g.fillRect(-16, -8, 24, 1.5);

    // Rotor housing. A bare circle stuck on the front of the receiver showed
    // as a crescent poking out above and below it — the gun looked like it had
    // a claw. The housing is a shroud the rotor turns inside: a squared block
    // blended into the receiver, with the rotor face and spindle on it.
    g.fillStyle = metal(g, -9.4, 5, shade(rec, -0.12));
    rr(g, 2, -9.4, 13.4, 14.4, 3); g.fill();
    g.fillStyle = 'rgba(226,232,240,0.10)';
    g.fillRect(2.6, -9.2, 12.2, 1.1);
    g.fillStyle = shade(rec, -0.32);
    g.beginPath(); g.arc(9, -2.4, 6.2, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(6,8,11,0.55)'; g.lineWidth = 0.8;
    g.beginPath(); g.arc(9, -2.4, 6.2, 0, Math.PI * 2); g.stroke();
    g.fillStyle = shade(rec, 0.16);
    g.beginPath(); g.arc(9, -2.4, 2.8, 0, Math.PI * 2); g.fill();
    g.fillStyle = shade(rec, -0.5);
    g.beginPath(); g.arc(9, -2.4, 1.1, 0, Math.PI * 2); g.fill();

    // Six barrels on the rotor. The comment claimed they were drawn back to
    // front, but the loop ran in index order — so a far barrel could be laid
    // over a near one, and with no gap between them the cluster fused into a
    // single grey slab of horizontal stripes. Sorted by depth, separated by a
    // dark shoulder, and each one bored at the muzzle.
    const BARREL_L = 30;
    const bars = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.35;
      bars.push({ oy: Math.sin(a) * 4.8, depth: (Math.cos(a) + 1) / 2 });
    }
    bars.sort((p, q) => p.depth - q.depth);           // far first
    for (const b of bars) {
      const shadeAmt = -0.40 + b.depth * 0.42;
      // dark shoulder under each tube so neighbours never merge
      g.fillStyle = 'rgba(6,8,11,0.75)';
      rr(g, 9, -4.0 + b.oy, BARREL_L + 3.6, 3.4, 1.3); g.fill();
      g.fillStyle = metal(g, -3.4 + b.oy, 0.8 + b.oy, shade(rec, shadeAmt));
      rr(g, 9, -3.6 + b.oy, BARREL_L, 2.6, 1.1); g.fill();
      g.fillStyle = `rgba(226,232,240,${0.06 + b.depth * 0.16})`;
      g.fillRect(10, -3.4 + b.oy, BARREL_L - 2.4, 0.5);
      // muzzle crown + bore
      g.fillStyle = shade(rec, shadeAmt - 0.16);
      rr(g, 9 + BARREL_L - 3, -4.2 + b.oy, 3.6, 3.8, 1); g.fill();
      g.fillStyle = '#0b0d10';
      g.beginPath(); g.ellipse(9 + BARREL_L + 0.2, -2.3 + b.oy, 0.55, 1.05, 0, 0, Math.PI * 2); g.fill();
    }

    // barrel clamp ring near the muzzle end
    g.fillStyle = shade(rec, -0.1);
    rr(g, 9 + BARREL_L - 12, -6.8, 3.6, 10.2, 1.2); g.fill();
    g.fillStyle = 'rgba(226,232,240,0.16)';
    g.fillRect(9 + BARREL_L - 11.7, -6.6, 3.0, 0.4);
    formLight(g, -24, -17, 80, 34);
  });
}

// Shoulder-fired rocket launcher: fat smooth-bore tube, blast cone at the
// rear, optic on a rail, forward grip. Reads long and hollow — the opposite
// of the minigun's dense cluster.
function paintRocketLauncher(finish) {
  const rec = (finish && finish.rec) || '#3d4237';
  const poly = (finish && finish.poly) || '#262a22';
  // 80x26 at (24,13) sheared the blast cone off the back, the optic off the
  // top and the forward grip off the bottom.
  return makeSprite(88, 34, 30, 17, (g) => {
    g.translate(30, 17);

    // main tube
    g.fillStyle = metal(g, -6.5, 5.5, rec);
    rr(g, -18, -6.5, 50, 12, 5.4); g.fill();
    // top highlight + lower shadow so the tube reads round
    g.fillStyle = 'rgba(255,255,255,0.12)';
    rr(g, -16, -6.2, 45, 2.2, 1.1); g.fill();
    g.fillStyle = 'rgba(6,8,12,0.35)';
    rr(g, -16, 3.4, 45, 2.2, 1.1); g.fill();

    // rear blast cone
    g.fillStyle = metal(g, -9, 8, shade(rec, -0.24));
    g.beginPath();
    g.moveTo(-18, -6.5); g.lineTo(-26, -9.5);
    g.lineTo(-26, 9.5); g.lineTo(-18, 6.5);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(6,8,12,0.75)';
    g.beginPath(); g.ellipse(-25.4, 0, 1.8, 8.6, 0, 0, Math.PI * 2); g.fill();

    // Warhead. Two flat brown fills and a red stripe read as a traffic cone
    // stuck in the tube. It is lit as a body of revolution now, with a seeker
    // tip, a driving band and stabiliser fins folded against the case.
    g.fillStyle = lingrad(g, 0, -4.8, 0, 4.8, [
      [0, '#a5764a'], [0.28, '#7e5533'], [0.62, '#63401f'], [1, '#3c2612'],
    ]);
    rr(g, 30, -4.8, 9.4, 9.6, 2.2); g.fill();
    // ogive nose
    g.fillStyle = lingrad(g, 0, -4.8, 0, 4.8, [
      [0, '#b58254'], [0.3, '#8a5e38'], [1, '#452a14'],
    ]);
    g.beginPath();
    g.moveTo(39.2, -4.7);
    g.quadraticCurveTo(45.2, -3.2, 47.4, 0);
    g.quadraticCurveTo(45.2, 3.2, 39.2, 4.7);
    g.closePath(); g.fill();
    // seeker tip
    g.fillStyle = '#20242a';
    g.beginPath(); g.ellipse(46.6, 0, 1.1, 1.5, 0, 0, Math.PI * 2); g.fill();
    // stabiliser fins folded along the case
    g.fillStyle = 'rgba(28,20,12,0.8)';
    g.beginPath();
    g.moveTo(30.4, -4.8); g.lineTo(36.4, -4.8); g.lineTo(35.2, -6.6); g.lineTo(31.2, -6.6);
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(30.4, 4.8); g.lineTo(36.4, 4.8); g.lineTo(35.2, 6.6); g.lineTo(31.2, 6.6);
    g.closePath(); g.fill();
    // yellow driving band + red warning stripe
    g.fillStyle = 'rgba(206,168,58,0.9)';
    g.fillRect(35.6, -4.8, 1.6, 9.6);
    g.fillStyle = 'rgba(196,54,44,0.92)';
    g.fillRect(31.5, -4.8, 2.4, 9.6);
    g.fillStyle = 'rgba(255,236,206,0.16)';
    g.fillRect(30.2, -4.4, 9.0, 1.0);

    // optic on a short rail
    g.fillStyle = shade(rec, -0.35);
    g.fillRect(2, -9.6, 14, 3.2);
    g.fillStyle = metal(g, -14, -9, shade(rec, 0.08));
    rr(g, 4, -14.4, 10, 5.2, 1.6); g.fill();
    g.fillStyle = 'rgba(120,200,255,0.5)';
    rr(g, 12.4, -13.4, 1.8, 3.2, 0.7); g.fill();

    // pistol grip + trigger guard
    g.fillStyle = poly;
    g.beginPath();
    g.moveTo(-6, 5.5); g.lineTo(1.5, 5.5); g.lineTo(-0.5, 16); g.lineTo(-7, 16);
    g.closePath(); g.fill();
    g.strokeStyle = shade(poly, -0.25); g.lineWidth = 1.6;
    g.beginPath(); g.arc(-1.5, 8.4, 4.2, 0.1, Math.PI * 0.95); g.stroke();

    // forward grip under the tube
    g.fillStyle = shade(poly, 0.06);
    rr(g, 16, 5.5, 4.6, 9, 1.8); g.fill();
    // finger grooves on both grips, so they are not two blank rounded slabs
    g.strokeStyle = 'rgba(0,0,0,0.34)'; g.lineWidth = 0.6;
    for (let i = 0; i < 4; i++) {
      g.beginPath(); g.moveTo(16.3, 7.2 + i * 1.8); g.lineTo(20.3, 7.2 + i * 1.8); g.stroke();
      g.beginPath(); g.moveTo(-5.6 - i * 0.35, 8.2 + i * 1.8); g.lineTo(0.6 - i * 0.35, 8.2 + i * 1.8); g.stroke();
    }
    formLight(g, -30, -17, 88, 34);
  });
}

// ---- GAUSS RAILGUN ---------------------------------------------------
// Redesigned. The first pass built it as two thin rails with a wide open gap
// between them, so the front half of the weapon was an empty rectangle — a
// picture frame bolted to a receiver, with three drums dangling underneath on
// straps. At the size these are actually seen it read as a hole, not a gun.
//
// What it is now: one solid accelerator housing with a narrow slot milled
// along it, the arc visible *inside* that slot, and the capacitor bank as a
// stepped block faired into the underside instead of luggage hanging off it.
// Heavy, closed, and unmistakable in silhouette.
function paintRailgun(finish) {
  const rec = (finish && finish.rec) || '#2e3238';
  const poly = (finish && finish.poly) || '#202429';
  const core = (finish && finish.core) || [150, 220, 255];
  const [cr, cg, cb] = core;
  const emissive = (fn, a) => {
    g0.save(); g0.globalCompositeOperation = 'lighter';
    g0.fillStyle = `rgba(${cr},${cg},${cb},${a})`;
    fn(); g0.restore();
  };
  let g0;
  return makeSprite(76, 32, 22, 19, (g) => {
    g0 = g;
    g.translate(22, 19);

    // ---- shoulder brace ------------------------------------------------
    g.fillStyle = metal(g, -8.6, 2.6, shade(rec, -0.16));
    g.beginPath();
    g.moveTo(-6, -7.0); g.lineTo(-14.6, -7.0);
    g.quadraticCurveTo(-17.8, -6.8, -17.6, -3.4);
    g.lineTo(-17.8, 2.6); g.lineTo(-14.8, 2.6); g.lineTo(-14.2, -2.2);
    g.lineTo(-6, -2.2);
    g.closePath(); g.fill();
    // recoil pad on the butt
    g.fillStyle = polymer(g, -7, 3, poly);
    rr(g, -18.6, -7.2, 2.2, 10.2, 0.8); g.fill();
    // brace cutout, so it is a frame rather than a slab
    g.fillStyle = 'rgba(8,10,14,0.85)';
    rr(g, -15.4, -5.4, 7.4, 2.4, 0.6); g.fill();

    // ---- receiver ------------------------------------------------------
    g.fillStyle = metal(g, -8.6, 3.4, rec);
    rr(g, -7.0, -8.8, 20, 9.2, 1.2); g.fill();
    g.fillStyle = 'rgba(226,232,240,0.10)';
    g.fillRect(-6.6, -8.7, 19.2, 1.0);
    // charge readout on the receiver flank
    g.fillStyle = 'rgba(6,8,12,0.75)';
    rr(g, -4.4, -6.6, 8.4, 2.6, 0.5); g.fill();
    emissive(() => {
      for (let i = 0; i < 5; i++) g0.fillRect(-3.8 + i * 1.6, -6.1, 1.0, 1.6);
    }, 0.55);
    energyGrip(g, poly, rec);

    // ---- accelerator housing -------------------------------------------
    // One closed block from the receiver to the muzzle. The rails live inside
    // it; the slot is what you see of them.
    const H0 = 11, H1 = 46;
    g.fillStyle = metal(g, -10.4, -0.6, shade(rec, 0.04));
    rr(g, H0, -10.4, H1 - H0, 9.8, 1.4); g.fill();
    // top face light + underside shadow so the housing reads as a solid prism
    g.fillStyle = 'rgba(226,232,240,0.16)';
    g.fillRect(H0 + 0.6, -10.3, H1 - H0 - 1.2, 1.1);
    g.fillStyle = 'rgba(0,0,0,0.30)';
    g.fillRect(H0 + 0.6, -1.6, H1 - H0 - 1.2, 1.0);
    // panel seams
    g.fillStyle = 'rgba(0,0,0,0.34)';
    for (const sx of [19, 28, 37]) g.fillRect(sx, -10.2, 0.8, 9.4);

    // ---- the slot: rails inside, arc between them -----------------------
    const S0 = H0 + 2.6, S1 = H1 - 3.2, SY = -7.2, SH = 3.4;
    g.fillStyle = '#080a0d';
    rr(g, S0, SY, S1 - S0, SH, 0.5); g.fill();
    // rail faces, top and bottom of the slot
    g.fillStyle = lingrad(g, 0, SY, 0, SY + 1.0, [
      [0, shade(rec, 0.34)], [1, shade(rec, -0.1)],
    ]);
    g.fillRect(S0, SY, S1 - S0, 0.85);
    g.fillStyle = lingrad(g, 0, SY + SH - 0.9, 0, SY + SH, [
      [0, shade(rec, -0.1)], [1, shade(rec, 0.2)],
    ]);
    g.fillRect(S0, SY + SH - 0.85, S1 - S0, 0.85);
    // arc walking the slot, clipped so it can never spill onto the housing
    g.save();
    g.beginPath(); g.rect(S0, SY + 0.85, S1 - S0, SH - 1.7); g.clip();
    g.globalCompositeOperation = 'lighter';
    const MID = SY + SH / 2;
    const arc = (x0, x1, seed, alpha) => {
      const r = makeRng(seed);
      g.beginPath();
      g.moveTo(x0, MID);
      for (let i = 1; i <= 8; i++) {
        const t = i / 8;
        g.lineTo(x0 + (x1 - x0) * t, MID + (r() - 0.5) * 1.5);
      }
      g.strokeStyle = `rgba(${cr},${cg},${cb},${alpha * 0.30})`;
      g.lineWidth = 1.9; g.stroke();
      g.strokeStyle = `rgba(${Math.min(255, cr + 70)},${Math.min(255, cg + 70)},${Math.min(255, cb + 70)},${alpha})`;
      g.lineWidth = 0.42; g.stroke();
    };
    g.lineJoin = 'miter'; g.lineCap = 'round';
    arc(S0 - 1, (S0 + S1) / 2, 91, 0.55);
    arc((S0 + S1) / 2 - 1, S1 + 1, 137, 0.5);
    g.restore();
    // slot lip highlight, drawn last so the arc sits behind it
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.35;
    g.strokeRect(S0, SY, S1 - S0, SH);

    // ---- capacitor bank, faired into the underside ----------------------
    // Three drums on straps looked like luggage. This is one stepped pack
    // that belongs to the housing, with a charge window per cell.
    g.fillStyle = metal(g, -1.2, 5.0, shade(rec, -0.18));
    g.beginPath();
    g.moveTo(13.5, -1.0);
    g.lineTo(41.5, -1.0);
    g.lineTo(40.0, 4.4);
    g.quadraticCurveTo(39.2, 5.2, 37.8, 5.2);
    g.lineTo(17.4, 5.2);
    g.quadraticCurveTo(16.0, 5.2, 15.4, 4.4);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(226,232,240,0.12)';
    g.fillRect(14.2, -0.9, 26.6, 0.7);
    for (let i = 0; i < 3; i++) {
      const cx = 17.6 + i * 7.4;
      g.fillStyle = 'rgba(6,8,12,0.75)';
      rr(g, cx, 0.9, 5.4, 2.6, 0.5); g.fill();
      emissive(() => { g0.fillRect(cx + 0.5, 1.4, 4.4, 1.6); }, 0.5);
      g.fillStyle = 'rgba(0,0,0,0.32)';
      g.fillRect(cx + 6.0, 0.2, 0.7, 4.4);
    }

    // ---- support grip under the housing ---------------------------------
    g.fillStyle = polymer(g, 4.6, 11.4, poly);
    g.beginPath();
    g.moveTo(20.6, 5.0); g.lineTo(25.4, 5.0);
    g.lineTo(24.6, 11.2); g.quadraticCurveTo(23.0, 12.0, 21.4, 11.2);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.36)'; g.lineWidth = 0.45;
    for (let i = 0; i < 3; i++) {
      g.beginPath(); g.moveTo(20.9, 6.6 + i * 1.5); g.lineTo(24.9, 6.6 + i * 1.5); g.stroke();
    }

    // ---- muzzle collar ---------------------------------------------------
    g.fillStyle = metal(g, -11.4, 0.4, shade(rec, 0.1));
    rr(g, 44.6, -11.4, 4.6, 11.8, 1); g.fill();
    g.fillStyle = 'rgba(226,232,240,0.20)';
    g.fillRect(45.0, -11.3, 3.8, 0.8);
    g.fillStyle = '#07090c';
    rr(g, 46.2, SY + 0.3, 3.4, SH - 0.6, 0.4); g.fill();
    emissive(() => {
      g0.fillRect(46.4, SY + 0.6, 3.0, SH - 1.2);
      // Bloom kept inside the collar's own width. At r=2.6 centred past the
      // muzzle face it ballooned into a pale bubble hanging off the end.
      const mg = g0.createRadialGradient(49.2, MID, 0.3, 49.2, MID, 2.2);
      mg.addColorStop(0, `rgba(${cr},${cg},${cb},0.9)`);
      mg.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      g0.fillStyle = mg;
      g0.beginPath(); g0.arc(49.2, MID, 2.2, 0, Math.PI * 2); g0.fill();
    }, 0.42);

    // ---- optic on the housing deck ---------------------------------------
    g.fillStyle = shade(rec, -0.26);
    g.fillRect(15.5, -12.4, 11, 2.2);
    g.fillStyle = metal(g, -15.8, -12.2, shade(rec, 0.08));
    rr(g, 14.5, -15.8, 13, 3.6, 1); g.fill();
    g.fillStyle = '#0b0f14';
    rr(g, 25.4, -15.4, 1.4, 2.8, 0.4); g.fill();
    emissive(() => { g0.fillRect(25.6, -14.8, 1.0, 1.0); }, 0.7);
    g.fillStyle = 'rgba(226,232,240,0.20)';
    g.fillRect(15.0, -15.7, 12, 0.4);

    g.save();
    g.globalCompositeOperation = 'source-atop';
    // Short marks. Long straight strokes across a flat receiver stop reading
    // as wear and start reading as cracks in the panel.
    scratches(g, -14, -12, 60, 16, rng, { n: 22, len: 3.2, color: 'rgba(210,225,240,0.11)' });
    grunge(g, -16, -13, 64, 18, rng, { n: 54, dark: 0.1 });
    g.restore();
    formLight(g, -22, -19, 76, 32);
  });
}

// ---- FLAME THROWER: pressurised tank, hose loop, wide nozzle with a live
// pilot flame. The one weapon here that shouldn't look high-tech at all. ----
function paintFlamethrower(finish) {
  const rec = (finish && finish.rec) || '#3a1f12';
  const poly = (finish && finish.poly) || '#2a150c';
  return makeSprite(70, 24, 21, 14, (g) => {
    g.translate(21, 14);

    // fuel tank where the stock would be — fat, ribbed, with a pressure gauge
    g.fillStyle = metal(g, -9, 3, shade(rec, 0.05));
    rr(g, -19, -9, 14, 11.4, 5); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      g.beginPath(); g.moveTo(-16.6 + i * 4, -8.6); g.lineTo(-16.6 + i * 4, 2); g.stroke();
    }
    g.fillStyle = '#c9d2dc';
    g.beginPath(); g.arc(-12, -4.6, 2.2, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#1a1b1e'; g.lineWidth = 0.5; g.stroke();
    g.strokeStyle = '#c0392b'; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(-12, -4.6); g.lineTo(-10.6, -5.8); g.stroke();

    // body + grip
    g.fillStyle = metal(g, -6, 3, rec);
    rr(g, -5.4, -6.6, 15, 6.2, 1); g.fill();
    energyGrip(g, poly, rec);

    // fuel hose looping from tank to nozzle — the signature shape
    g.strokeStyle = shade(poly, -0.1); g.lineWidth = 2.6; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-8, -1.2);
    g.quadraticCurveTo(2, 7.4, 14, 1.2);
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(-8, -1.9);
    g.quadraticCurveTo(2, 6.4, 14, 0.5);
    g.stroke();
    g.lineCap = 'butt';

    // barrel tube + wide nozzle
    g.fillStyle = metal(g, -8.4, -3.6, shade(rec, 0.1));
    // Starts at 8.2, not 9.6: butted exactly against the body's rounded corner
    // the two cylinders met along a hairline and showed daylight between them.
    rr(g, 8.2, -8, 23.4, 4.6, 1.2); g.fill();
    g.fillStyle = metal(g, -9.6, -2.4, shade(rec, -0.15));
    g.beginPath();
    g.moveTo(31.6, -8.6); g.lineTo(38.6, -10.2); g.lineTo(38.6, -1); g.lineTo(31.6, -2.6);
    g.closePath(); g.fill();
    // pilot flame at the nozzle lip
    g.save();
    g.globalCompositeOperation = 'lighter';
    const pilot = radgrad(g, 39.4, -5.6, 4.6, [
      [0, 'rgba(255,230,150,0.95)'],
      [0.4, 'rgba(255,150,50,0.55)'],
      [1, 'rgba(255,90,20,0)'],
    ]);
    g.fillStyle = pilot;
    g.beginPath(); g.arc(39.4, -5.6, 4.6, 0, Math.PI * 2); g.fill();
    g.restore();

    // support-hand foregrip on the tube
    g.fillStyle = polymer(g, -3.4, 1.6, poly);
    rr(g, 14, -3.2, 9.5, 3.2, 1.1); g.fill();

    g.save();
    g.globalCompositeOperation = 'source-atop';
    scratches(g, -18, -10, 56, 14, rng, { n: 22, color: 'rgba(240,200,160,0.16)' });
    grunge(g, -19, -10, 58, 15, rng, { n: 50, dark: 0.14, light: 0.03 });
    g.restore();
    formLight(g, -21, -14, 70, 24);
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

// ---- spray patterns ----
// PATTERN_* above only scales how hard each shot kicks the *sprite*; the aim
// itself never moved, so holding the trigger down cost nothing but a wider
// random cone. That is the opposite of how a shooter is supposed to read:
// randomness you cannot answer is just noise, while a muzzle that walks a
// fixed path is a skill you can learn to pull against.
//
// These are radians of muzzle climb contributed by each consecutive shot,
// applied to the operator's actual aim (so it is visible on screen and the
// bullets follow it — see Player.spray). The shape is what matters:
//
//   * the first shots barely move, so tapping stays precise
//   * the middle of the burst climbs hardest — the part you must drag down
//   * late in the burst the climb tails off and starts alternating sign, so a
//     long hold wanders rather than rising forever
//
// A weapon that spreads a base def (`...R`) inherits that class's pattern, so
// the whole chassis family gets a sensible one without repeating it.
// On magnitude. These were first written at roughly twice these numbers,
// which put a rifle's full burst about 8.8 degrees off target. That reads
// fine as a number and is badly wrong in this game: the camera is fixed and
// side-on, so 8.8 degrees at a 700px engagement is ~107px of rise — a clean
// miss over the head of a 126px-tall hostile, with no way to see it coming on
// the first magazine. Held to a ~4 degree total climb instead, a full burst
// walks about a third of a body height at that range: unmistakable, worth
// correcting, and survivable while you are still learning the pattern.
// On where the climb sits in the burst. The first four rounds are close to
// free on every automatic here, and that is deliberate: a tap or a short
// burst is the disciplined play, so it should cost nothing at all, and a
// pattern that starts biting on round two just reads as the gun being
// inaccurate. The climb is loaded into the middle of the magazine instead —
// exactly where "I am holding this trigger down" becomes a decision.
const SPRAY_RIFLE = [
  0.0008, 0.0015, 0.003, 0.005, 0.008, 0.010, 0.011, 0.010,
  0.008, 0.006, -0.003, 0.006, -0.004, 0.005, -0.004, 0.004,
];
const SPRAY_SMG = [
  0.0006, 0.0012, 0.0022, 0.0035, 0.005, 0.006, 0.0065, 0.006,
  0.005, -0.002, 0.004, -0.003, 0.0035, -0.0025, 0.003, -0.003,
];
// Semi-auto: one firm step per pull that recovers between shots, so a fast
// double-tap is punished but a paced one is not.
const SPRAY_PISTOL = [0.010, 0.012, 0.013, 0.011];
// Belt-fed: never really settles, and the climb keeps its sign much longer.
// The worst offender in the game by design — this is the cost of the ammo.
const SPRAY_LMG = [
  0.001, 0.002, 0.004, 0.007, 0.010, 0.012, 0.013, 0.013,
  0.012, 0.011, 0.010, 0.008, -0.004, 0.007, -0.005, 0.006,
];
// One heavy shot at a time — a single hard step, nothing to learn past it.
const SPRAY_HEAVY = [0.030];

export function buildWeapons() {
  const flashes = [paintFlash(11), paintFlash(23), paintFlash(37)];

  // Finish palettes are pushed noticeably more saturated/contrasty than a
  // plain recolor of the default gunmetal — each named skin should read as a
  // distinct, premium coating at a glance, not a dye-swap of the stock gun.
  const rifleBody = paintRifleBody('ranger');
  // Skins are composited assets, not palette swaps: buildSkinSet re-paints the
  // body in the skin's palette and then layers coating, engraving, emissive
  // rim, rail optic and muzzle device on top. See art/skins.js for the tables.
  const rifleFinishes = buildSkinSet('rifle', rifleBody,
    (pal) => paintRifleBody('ranger', pal), 'rifle',
    (pal) => paintRifleMag('ranger', pal));
  const pistolBody = paintPistolBody();
  const pistolFinishes = buildSkinSet('pistol', pistolBody,
    (pal) => paintPistolBody({ grip: pal.grip || pal.poly, frame: pal.frame || pal.rec }), 'pistol', null,
    (pal) => paintPistolSlide({ metal: pal.rec || pal.frame }));
  // Knife skins keep their bespoke blade geometry — the bowie is a different
  // shape, not a recolour — and the composited pass runs on top of whichever
  // base the skin id selects.
  const KNIFE_BOWIE = new Set(['ravage', 'voidedge', 'bloodmoon']);
  const KNIFE_BLADE_COL = {
    // Kept out of the top of the value range. '#f2f6ff' is white: an emissive
    // blade fill at that value has no darker tone left to draw a spine, a
    // fuller or a grind against, so the knife came out as a glowing lozenge.
    ravage: undefined, voidedge: '#9d4dff', volt: '#22c8ea',
    bloodmoon: '#e02748', eventide: '#7fe4d8',
  };
  const knifeBody = paintKnife();
  const knifeFinishes = buildSkinSet('knife', knifeBody, (pal, id) => (
    KNIFE_BOWIE.has(id)
      ? paintKnifeBowie(id === 'bloodmoon'
          ? { handle: ['#4a1620', '#341019', '#1c0810'], blade: KNIFE_BLADE_COL[id] }
          : { blade: KNIFE_BLADE_COL[id] })
      : paintKnife({ blade: KNIFE_BLADE_COL[id] })
  ));
  const smgBody = paintSmgBody();
  const smgFinishes = buildSkinSet('smg', smgBody, (pal) => paintSmgBody(pal), 'smg',
    (pal) => paintSmgMag(pal));

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
      recoilPattern: PATTERN_RIFLE, sprayPattern: SPRAY_RIFLE,
      magSize: 30, reserve: 120,
      reloadT: 2.1, reloadEmptyT: 2.75,
      shotSound: 'rifle', casingSize: 4.6,
      aimHeight: -4.8,
    },
    pistol: {
      id: 'pistol', recoilFeel: 'light', name: 'C-9 "CORVID"', slot: 2, kind: 'gun',
      body: pistolBody, finishes: pistolFinishes, finish: 'default',
      slide: paintPistolSlide(), flashes,
      gripA: { x: 0, y: 0.8 },
      gripB: { x: 2.6, y: 1.8 },          // support hand cups front of grip
      muzzle: { x: 12.4, y: -4.2 },
      eject: { x: 4.4, y: -5 },
      magPos: { x: -2.2, y: 4 },
      // weaponAnchor SUBTRACTS this, so a negative x pushes the weapon out in
      // front of the operator and a positive x pulls it back into his chest.
      // Every other gun in the game is negative (-13 for the rifle class, -9
      // for the SMGs); this one was +4, which folded the firing arm down to
      // about 5 units of extension against the rifle's 15 and left the C-9
      // buried in the operator's own torso, muzzle pointing at the floor. On
      // screen the pistol simply looked absent.
      //
      // Handguns are punched out, not shouldered, so this sits a little
      // further forward than the rifle's — ~18 units of extension, still less
      // than half of what the arm can physically reach. Shared by the RAY GUN
      // and QUANTUM PISTOL, which spread this def.
      shoulder: { x: -17, y: -1 },
      auto: false, rpm: 380, dmg: 34, spread: 0.014, pellets: 1,
      recoilKick: 1.28, recoilRot: 0.04, camKick: 0.66, camTrauma: 0.036,
      recoilPattern: PATTERN_PISTOL, sprayPattern: SPRAY_PISTOL,
      magSize: 12, reserve: 48,
      reloadT: 1.65, reloadEmptyT: 2.1,
      shotSound: 'pistol', casingSize: 3.4,
      aimHeight: -4,
    },
    smg: {
      id: 'smg', recoilFeel: 'light', name: 'P-12 "WASP"', slot: 4, kind: 'gun',
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
      recoilPattern: PATTERN_SMG, sprayPattern: SPRAY_SMG,
      magSize: 35, reserve: 140,
      reloadT: 1.8, reloadEmptyT: 2.3,
      shotSound: 'pistol', casingSize: 3.6,
      aimHeight: -4.2,
      unlockLevel: 3,
    },
    knife: {
      id: 'knife', name: 'TALON-7', slot: 3, kind: 'melee',
      body: knifeBody, finishes: knifeFinishes, finish: 'default',
      // Motion-trail colour per finish (see player.js bladeTrailColor).
      // Energy blades streak in their own light; steel gets a cool white.
      trailColors: {
        default: 'rgba(226,240,255,0.5)',
        ravage: 'rgba(200,210,225,0.45)',
        voidedge: 'rgba(178,107,255,0.7)',
        volt: 'rgba(56,224,255,0.75)',
        bloodmoon: 'rgba(255,59,92,0.75)',
        eventide: 'rgba(242,246,255,0.8)',
      },
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

  // Structural build per weapon. No two rows share a combination, so no two
  // weapons share a silhouette — the outline differs at the stock, the barrel,
  // the feed device and the topside accessory, not just in colour.
  const CHASSIS = {
    battle:    { stock: 'solid',    barrel: 'long',   mag: 'box',   top: 'scope',   hg: 24 },
    lmg:       { stock: 'solid',    barrel: 'heavy',  mag: 'belt',  top: 'carry',   hg: 22 },
    sniper:    { stock: 'skeleton', barrel: 'shroud', mag: 'stick', top: 'scope',   hg: 21 },
    plasma:    { stock: 'tank',     barrel: 'vent',   mag: 'cell',  top: 'emitter', hg: 21 },
    pulse:     { stock: 'brace',    barrel: 'coil',   mag: 'cell',  top: 'fins',    hg: 20 },
    eshotgun:  { stock: 'folded',   barrel: 'stub',   mag: 'drum',  top: 'none',    hg: 20 },
    ion:       { stock: 'tank',     barrel: 'twin',   mag: 'cell',  top: 'emitter', hg: 20 },
    emp:       { stock: 'brace',    barrel: 'nozzle', mag: 'cell',  top: 'fins',    hg: 20 },
    // Gravity, lightning and cryo used to share 'coil', 'twin' and 'shroud'
    // with other weapons, so seven energy guns came out of this table with the
    // same outline: receiver, grip, and a bar pointing forward. Each of the
    // three now has a forward mass nothing else in the arsenal has — a focus
    // ring, a forked electrode, a condenser stack.
    gravity:   { stock: 'tank',     barrel: 'lens',   mag: 'none',  top: 'emitter', hg: 20 },
    lightning: { stock: 'none',     barrel: 'arc',    mag: 'cell',  top: 'fins',    hg: 20 },
    cryo:      { stock: 'tank',     barrel: 'frost',  mag: 'cell',  top: 'none',    hg: 21 },
  };
  // ---- attachment geometry --------------------------------------------
  //
  // Every chassis weapon used to inherit the *rifle's* mount points along with
  // its stats (`...R`), so the muzzle flash fired from x=40 whether the barrel
  // ended at 35.6 (stub) or 49 (long), a rifle stick magazine hung off a
  // weapon with a drum or no magwell at all, and a cycling bolt sat on energy
  // weapons that have none. That is what read as parts floating loose.
  //
  // These are measured off the painters above — the same numbers the geometry
  // is drawn from — so an attachment lands on the part it belongs to.

  // Where each barrel assembly actually ends, and the bore centreline there.
  const BARREL_TIP = {
    long:   { x: 49.0, y: -5.2 },   // 24..46 tube + brake to 49
    heavy:  { x: 42.0, y: -5.1 },   // fluted tube 22..42
    shroud: { x: 47.0, y: -5.1 },   // shroud to 41 + thin barrel to 47
    coil:   { x: 47.0, y: -4.9 },   // rail 20..46, last coil at 44.6
    twin:   { x: 46.0, y: -4.9 },   // twin rails 20..46, bridge at 43..45.2
    nozzle: { x: 44.0, y: -3.4 },   // flared bell mouth, wide and low
    vent:   { x: 43.5, y: -5.0 },   // vent block to 38 + muzzle to 43.5
    arc:    { x: 46.0, y: -4.9 },   // discharge jumps between the horn tips
    lens:   { x: 47.2, y: -4.8 },   // focus ring centred at 39, r 8.2
    frost:  { x: 47.0, y: -4.7 },   // vane stack to 43.4 + chill ring to 47
    stub:   { x: 35.6, y: -5.0 },   // short tube to 31 + choke to 35.6
  };

  // Deck height of each topside accessory — where a rail optic bolts on.
  // 'none' falls back to the bare receiver top, so a sight sits on metal
  // instead of hovering where a scope would have been.
  const TOP_RAIL_Y = {
    carry: -15.4, scope: -16.2, emitter: -14.8, fins: -14.2, none: -8.6,
  };

  // Conventional actions cycle a bolt; energy weapons have no reciprocating
  // mass, and drawing one on them put a rifle part on a plasma receiver.
  const BOLTED = new Set(['battle', 'lmg', 'sniper']);

  // Builds a body for `id` in the given palette, from its structural row.
  const chassisBody = (id, pal) => paintChassis({
    ...CHASSIS[id],
    rec: pal.rec, poly: pal.poly, core: pal.core,
  });

  // Every mount point for `id`, derived from the row that builds its art.
  // Spread over the inherited rifle def so the corrected values win.
  const chassisMounts = (id, pal) => {
    const row = CHASSIS[id];
    const tip = BARREL_TIP[row.barrel];
    const mag = paintChassisMag(row.mag, pal.rec, pal.poly, pal.core);
    return {
      muzzle: { x: tip.x, y: tip.y },
      // The mag sprite is anchored on the weapon origin, so its attach point
      // is the origin — offsetting it here would double-apply.
      mag,
      magPos: { x: 0, y: 0 },
      // Support hand rides the back of this chassis's own handguard.
      gripB: { x: row.hg - 4.5, y: -5.2 },
      bolt: BOLTED.has(id) ? paintBolt(pal.rec) : null,
      railY: TOP_RAIL_Y[row.top],
    };
  };
  const smgSkin = (rec, poly, core) => paintSmgBody({ rec, poly, core });

  Object.assign(defs, {
    // ------- conventional military -------
    battle: {
      ...R, id: 'battle', recoilFeel: 'heavy', name: 'MK-2 "WARDEN"', body: chassisBody('battle', { rec: '#43372a', poly: '#302719', core: null }),
      ...chassisMounts('battle', { rec: '#43372a', poly: '#302719', core: null }),
      auto: false, rpm: 340, dmg: 46, spread: 0.015,
      recoilKick: 2.1, recoilRot: 0.03, camKick: 1.15, camTrauma: 0.062,
      magSize: 20, reserve: 100, reloadT: 2.3, reloadEmptyT: 3.0, shotSound: 'rifle',
    },
    lmg: {
      ...R, id: 'lmg', sprayPattern: SPRAY_LMG, recoilFeel: 'heavy', name: 'M-900 "OX" LMG', body: chassisBody('lmg', { rec: '#2f3630', poly: '#232823', core: null }),
      ...chassisMounts('lmg', { rec: '#2f3630', poly: '#232823', core: null }),
      auto: true, rpm: 820, dmg: 24, spread: 0.032,
      recoilKick: 1.9, recoilRot: 0.03, camKick: 1.0, camTrauma: 0.05, muzzleBig: 1.35,
      magSize: 100, reserve: 200, reloadT: 3.8, reloadEmptyT: 4.4, shotSound: 'rifle',
    },
    // ------- boss heavy weapons -------
    // Only ever wielded by bosses, and only obtainable as a 1/1000 Boss
    // Redeemable (see game/loot.js). Both are tuned well above the craftable
    // ceiling on purpose — that is what makes the drop worth chasing.
    minigun: {
      ...R, id: 'minigun', sprayPattern: SPRAY_LMG, recoilFeel: 'heavy', name: 'ANNIHILATOR', body: paintMinigun(),
      auto: true, rpm: 1400, dmg: 26, spread: 0.055,
      recoilKick: 1.1, recoilRot: 0.012, camKick: 0.7, camTrauma: 0.075, muzzleBig: 1.6,
      magSize: 250, reserve: 500, reloadT: 5.2, reloadEmptyT: 6.0, shotSound: 'rifle',
      mag: null, bolt: null,
      tracerColor: [255, 214, 150], tracerWidth: 2.2,
    },
    rocket: {
      ...R, id: 'rocket', sprayPattern: SPRAY_HEAVY, recoilFeel: 'heavy', name: 'SIEGEBREAKER', body: paintRocketLauncher(),
      auto: false, rpm: 42, dmg: 210, spread: 0.004,
      fireMode: 'projectile',
      projectile: { speed: 900, radius: 6, explode: 96, headMul: 1.2, color: [255, 170, 90] },
      recoilKick: 3.6, recoilRot: 0.055, camKick: 2.8, camTrauma: 0.16, muzzleBig: 2.0,
      magSize: 1, reserve: 12, reloadT: 3.2, reloadEmptyT: 3.6, shotSound: 'rifle',
      mag: null, bolt: null,
    },
    sniper: {
      ...R, id: 'sniper', sprayPattern: SPRAY_HEAVY, recoilFeel: 'heavy', name: 'LRS-1 "TALON"', body: chassisBody('sniper', { rec: '#2a2e33', poly: '#20242a', core: null }),
      ...chassisMounts('sniper', { rec: '#2a2e33', poly: '#20242a', core: null }),
      auto: false, rpm: 55, dmg: 150, spread: 0.002,
      recoilKick: 3.2, recoilRot: 0.05, camKick: 2.4, camTrauma: 0.12, muzzleBig: 1.5,
      magSize: 5, reserve: 30, reloadT: 3.0, reloadEmptyT: 3.5,
      shotSound: 'rifle', tracerColor: [255, 244, 210], tracerWidth: 2.6,
    },
    // ------- energy: projectiles -------
    raygun: {
      ...P, id: 'raygun', recoilFeel: 'energy', name: 'RAY GUN', body: paintEnergyPistol('bell', { grip: '#3a1d55', frame: '#4a2668', core: [200, 110, 255] }),
      // Its own support-hand point. These two spread the C-9's def, but they
      // do not share its frame: paintEnergyPistol's grip column ends at about
      // x=1 where the C-9's runs to 2.6, so the inherited gripB had the
      // support hand closing on a unit of empty air beside the weapon.
      gripB: { x: 0.8, y: 2.2 },
      // Neither of these has a reciprocating slide, but both spread the C-9's
      // def — so the conventional steel slide sprite was being drawn straight
      // across the emitter, a grey pistol laid over a ray gun.
      slide: null,
      muzzle: { x: 11.4, y: -3.4 },
      eject: null,
      energy: true, fireMode: 'projectile', auto: false, rpm: 200, dmg: 62, spread: 0.02,
      projectile: { color: [200, 110, 255], radius: 5, speed: 900, blast: 44, headMul: 1.6, life: 1.6 },
      recoilKick: 1.4, recoilRot: 0.03, camKick: 0.8, camTrauma: 0.05, muzzleBig: 1.15,
      magSize: 10, reserve: 60, shotSound: 'ray',
    },
    plasma: {
      ...R, id: 'plasma', recoilFeel: 'energy', name: 'PLASMA RIFLE', body: chassisBody('plasma', { rec: '#123742', poly: '#0c2731', core: [80, 220, 255] }),
      ...chassisMounts('plasma', { rec: '#123742', poly: '#0c2731', core: [80, 220, 255] }),
      energy: true, fireMode: 'projectile', auto: true, rpm: 420, dmg: 34, spread: 0.022,
      projectile: { color: [80, 220, 255], radius: 4.6, speed: 1050, blast: 28, life: 1.4 },
      heatPerShot: 0.05, heatCool: 0.55, muzzleBig: 1.15,
      recoilKick: 1.4, recoilRot: 0.02, camKick: 0.8, camTrauma: 0.045, shotSound: 'plasma',
    },
    pulse: {
      ...R, id: 'pulse', recoilFeel: 'energy', name: 'PULSE RIFLE', body: chassisBody('pulse', { rec: '#1c3a2a', poly: '#12281c', core: [120, 255, 170] }),
      ...chassisMounts('pulse', { rec: '#1c3a2a', poly: '#12281c', core: [120, 255, 170] }),
      energy: true, fireMode: 'projectile', auto: true, rpm: 640, dmg: 22, spread: 0.02,
      projectile: { color: [120, 255, 170], radius: 3.8, speed: 1250, life: 1.2 },
      recoilKick: 1.2, recoilRot: 0.018, camKick: 0.62, camTrauma: 0.036, shotSound: 'pulse',
    },
    eshotgun: {
      ...R, id: 'eshotgun', sprayPattern: SPRAY_HEAVY, recoilFeel: 'heavy', name: 'ENERGY SHOTGUN', body: chassisBody('eshotgun', { rec: '#43301a', poly: '#2f2112', core: [255, 160, 60] }),
      ...chassisMounts('eshotgun', { rec: '#43301a', poly: '#2f2112', core: [255, 160, 60] }),
      energy: true, fireMode: 'projectile', auto: false, rpm: 75, dmg: 15, spread: 0.14, pellets: 8,
      projectile: { color: [255, 160, 60], radius: 3.4, speed: 820, life: 0.55 },
      recoilKick: 2.8, recoilRot: 0.04, camKick: 1.6, camTrauma: 0.09, muzzleBig: 1.4,
      magSize: 6, reserve: 36, reloadT: 2.6, reloadEmptyT: 3.2, shotSound: 'plasma',
    },
    quantum: {
      ...P, id: 'quantum', recoilFeel: 'energy', name: 'QUANTUM PISTOL', body: paintEnergyPistol('prism', { grip: '#123045', frame: '#164a63', core: [90, 200, 255] }),
      // Its own support-hand point. These two spread the C-9's def, but they
      // do not share its frame: paintEnergyPistol's grip column ends at about
      // x=1 where the C-9's runs to 2.6, so the inherited gripB had the
      // support hand closing on a unit of empty air beside the weapon.
      gripB: { x: 0.8, y: 2.2 },
      // Neither of these has a reciprocating slide, but both spread the C-9's
      // def — so the conventional steel slide sprite was being drawn straight
      // across the emitter, a grey pistol laid over a ray gun.
      slide: null,
      muzzle: { x: 11.6, y: -4.6 },
      eject: null,
      energy: true, fireMode: 'projectile', auto: false, rpm: 300, dmg: 40, spread: 0.016,
      projectile: { color: [120, 220, 255], radius: 4, speed: 1400, pierce: 1, life: 1.2 },
      recoilKick: 1.2, recoilRot: 0.03, camKick: 0.6, camTrauma: 0.04, shotSound: 'ray',
      magSize: 14, reserve: 70,
    },
    // ------- energy: charge weapons -------
    railgun: {
      ...R, id: 'railgun', sprayPattern: SPRAY_HEAVY, recoilFeel: 'heavy', name: 'GAUSS RAILGUN', body: paintRailgun(),
      // no magazine well and no reciprocating bolt on this frame — the
      // rifle def these inherit from would otherwise draw both floating.
      mag: null, bolt: null,
      energy: true, fireMode: 'projectile', auto: false, rpm: 60, dmg: 120, spread: 0.001,
      projectile: { color: [150, 220, 255], radius: 4.2, speed: 2600, pierce: 4, life: 0.8 },
      charge: { time: 0.9, minMul: 0.5, maxMul: 1.5 },
      recoilKick: 3.0, recoilRot: 0.045, camKick: 2.2, camTrauma: 0.12, muzzleBig: 1.6,
      magSize: 5, reserve: 30, reloadT: 2.8, reloadEmptyT: 3.3, shotSound: 'rail',
    },
    ion: {
      ...R, id: 'ion', sprayPattern: SPRAY_HEAVY, recoilFeel: 'heavy', name: 'ION CANNON', body: chassisBody('ion', { rec: '#173d3a', poly: '#0f2b29', core: [80, 255, 210] }),
      ...chassisMounts('ion', { rec: '#173d3a', poly: '#0f2b29', core: [80, 255, 210] }),
      energy: true, fireMode: 'projectile', auto: false, rpm: 40, dmg: 90, spread: 0.004,
      projectile: { color: [80, 255, 210], radius: 7, speed: 720, blast: 130, life: 2 },
      charge: { time: 1.1, minMul: 0.5, maxMul: 1.7 },
      recoilKick: 2.6, recoilRot: 0.04, camKick: 2.0, camTrauma: 0.14, muzzleBig: 1.7,
      magSize: 4, reserve: 24, reloadT: 3.0, reloadEmptyT: 3.6, shotSound: 'ion',
    },
    emp: {
      ...R, id: 'emp', recoilFeel: 'energy', name: 'EMP LAUNCHER', body: chassisBody('emp', { rec: '#26364a', poly: '#1a2636', core: [120, 200, 255] }),
      ...chassisMounts('emp', { rec: '#26364a', poly: '#1a2636', core: [120, 200, 255] }),
      energy: true, fireMode: 'projectile', auto: false, rpm: 70, dmg: 40, spread: 0.01,
      projectile: { color: [140, 210, 255], radius: 6, speed: 640, blast: 150, life: 2.2 },
      recoilKick: 2.0, recoilRot: 0.03, camKick: 1.4, camTrauma: 0.09, muzzleBig: 1.4,
      magSize: 5, reserve: 25, reloadT: 2.7, reloadEmptyT: 3.2, shotSound: 'ion',
    },
    gravity: {
      ...R, id: 'gravity', recoilFeel: 'energy', name: 'GRAVITY GUN', body: chassisBody('gravity', { rec: '#3a2450', poly: '#281634', core: [180, 120, 255] }),
      ...chassisMounts('gravity', { rec: '#3a2450', poly: '#281634', core: [180, 120, 255] }),
      energy: true, fireMode: 'projectile', auto: false, rpm: 90, dmg: 55, spread: 0.008,
      projectile: { color: [180, 120, 255], radius: 6, speed: 560, blast: 110, life: 2.4 },
      recoilKick: 1.8, recoilRot: 0.03, camKick: 1.2, camTrauma: 0.08, muzzleBig: 1.4,
      magSize: 8, reserve: 40, shotSound: 'ion',
    },
    // ------- energy: beams -------
    lasersmg: {
      ...S, id: 'lasersmg', recoilFeel: 'beam', name: 'LASER SMG',
      body: paintLaserSmg({ rec: '#3a1420', poly: '#280d16', core: [255, 70, 90] }),
      // its own frame: no bottom magazine, no reciprocating bolt
      mag: null, bolt: null,
      muzzle: { x: 22.4, y: -5.9 }, gripB: { x: 11, y: 1.4 },
      energy: true, fireMode: 'beam', auto: true, rpm: 1100, dmg: 9, spread: 0.02,
      beam: { color: [255, 70, 90], width: 2.2 }, heatPerShot: 0.03, heatCool: 0.6,
      recoilKick: 0.7, recoilRot: 0.012, camKick: 0.4, camTrauma: 0.024, shotSound: 'laser',
    },
    particle: {
      ...R, id: 'particle', recoilFeel: 'beam', name: 'PARTICLE BEAM', body: paintParticleThrower(),
      // no magazine well and no reciprocating bolt on this frame — the
      // rifle def these inherit from would otherwise draw both floating.
      mag: null, bolt: null,
      energy: true, fireMode: 'beam', auto: true, rpm: 520, dmg: 16, spread: 0.006,
      beam: { color: [190, 120, 255], width: 2.6 }, heatPerShot: 0.045, heatCool: 0.5,
      recoilKick: 0.9, recoilRot: 0.014, camKick: 0.5, camTrauma: 0.03, shotSound: 'particle',
    },
    lightning: {
      ...R, id: 'lightning', recoilFeel: 'beam', name: 'LIGHTNING RIFLE', body: chassisBody('lightning', { rec: '#26364a', poly: '#1a2636', core: [130, 200, 255] }),
      ...chassisMounts('lightning', { rec: '#26364a', poly: '#1a2636', core: [130, 200, 255] }),
      energy: true, fireMode: 'beam', auto: true, rpm: 260, dmg: 20, spread: 0.01,
      beam: { color: [150, 210, 255], width: 2, arc: true }, shotSound: 'lightning',
      recoilKick: 1.0, recoilRot: 0.016, camKick: 0.6, camTrauma: 0.04,
    },
    cryo: {
      ...R, id: 'cryo', recoilFeel: 'beam', name: 'CRYO GUN', body: chassisBody('cryo', { rec: '#1d3a4a', poly: '#122a36', core: [160, 230, 255] }),
      ...chassisMounts('cryo', { rec: '#1d3a4a', poly: '#122a36', core: [160, 230, 255] }),
      energy: true, fireMode: 'beam', auto: true, rpm: 700, dmg: 8, spread: 0.03,
      beam: { color: [170, 235, 255], width: 3.4, range: 360 }, shotSound: 'cryo',
      recoilKick: 0.5, recoilRot: 0.008, camKick: 0.3, camTrauma: 0.02,
    },
    flame: {
      ...R, id: 'flame', recoilFeel: 'beam', name: 'FLAME THROWER', body: paintFlamethrower(),
      // no magazine well and no reciprocating bolt on this frame — the
      // rifle def these inherit from would otherwise draw both floating.
      mag: null, bolt: null,
      energy: true, fireMode: 'beam', auto: true, rpm: 900, dmg: 6, spread: 0.05,
      beam: { color: [255, 130, 40], width: 6, range: 300, flame: true }, shotSound: 'flame',
      recoilKick: 0.4, recoilRot: 0.006, camKick: 0.3, camTrauma: 0.024,
    },
  });

  // ------------------------------------------------------------------
  // Skin sets for every remaining weapon.
  //
  // rifle / pistol / smg / knife already got theirs above (their finish maps
  // are referenced directly by their defs). This covers the other 19 so that
  // no weapon in the game ships without skins.
  //
  // `mount` names which chassis the weapon's body actually is — most energy
  // weapons share the rifle chassis, so they share its muzzle/rail mount
  // points, but each still gets its own skin table and its own composited
  // sprites. `paint` re-paints that chassis in the skin's palette.
  const SKIN_BASES = {
    // conventional, rifle chassis
    // Each of these paints its *own* chassis, so a skin keeps the weapon's
    // silhouette instead of reverting it to the shared rifle body.
    battle:   { mount: 'battle', paint: (p) => chassisBody('battle', p) },
    lmg:      { mount: 'lmg', paint: (p) => chassisBody('lmg', p) },
    sniper:   { mount: 'sniper', paint: (p) => chassisBody('sniper', p) },
    plasma:   { mount: 'plasma', paint: (p) => chassisBody('plasma', p) },
    pulse:    { mount: 'pulse', paint: (p) => chassisBody('pulse', p) },
    eshotgun: { mount: 'eshotgun', paint: (p) => chassisBody('eshotgun', p) },
    ion:      { mount: 'ion', paint: (p) => chassisBody('ion', p) },
    emp:      { mount: 'emp', paint: (p) => chassisBody('emp', p) },
    gravity:  { mount: 'gravity', paint: (p) => chassisBody('gravity', p) },
    lightning:{ mount: 'lightning', paint: (p) => chassisBody('lightning', p) },
    cryo:     { mount: 'cryo', paint: (p) => chassisBody('cryo', p) },
    // energy, pistol chassis
    // These two paint their own energy frames, not the C-9 pistol body, so a
    // skin recolours the bulb-and-bell / prism-slab silhouette rather than
    // quietly reverting both guns to the same shared pistol shape.
    raygun:   { mount: 'pistol', paint: (p) => paintEnergyPistol('bell', p) },
    quantum:  { mount: 'pistol', paint: (p) => paintEnergyPistol('prism', p) },
    // energy, smg chassis
    lasersmg: { mount: 'lasersmg', paint: (p) => paintLaserSmg(p) },
    // purpose-built chassis, each with its own painter and mount points
    particle: { mount: 'particle', paint: (p) => paintParticleThrower(p) },
    railgun:  { mount: 'railgun',  paint: (p) => paintRailgun(p) },
    flame:    { mount: 'flame',    paint: (p) => paintFlamethrower(p) },
    minigun:  { mount: 'minigun',  paint: (p) => paintMinigun(p) },
    rocket:   { mount: 'rocket',   paint: (p) => paintRocketLauncher(p) },
  };

  for (const [id, base] of Object.entries(SKIN_BASES)) {
    const def = defs[id];
    if (!def) continue;
    // Chassis weapons carry a detachable magazine, so each skin repaints it
    // from the same structural row the body came from.
    const magPaint = CHASSIS[id]
      ? (pal) => paintChassisMag(CHASSIS[id].mag, pal.rec, pal.poly, pal.core)
      : null;
    def.finishes = buildSkinSet(id, def.body, base.paint, base.mount, magPaint);
    def.finish = 'default';
  }

  return defs;
}
