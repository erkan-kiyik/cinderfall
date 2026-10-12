// CROW — the scrap trader, and the container shop he works out of.
//
// Painted rather than shipped as an image, like every other asset here: crisp
// at any DPR, no download, re-lit by changing a few numbers.
//
// The man is in crowchar.js; his design history, brief and the checklist he
// was reviewed against are in docs/CROW_DESIGN.md. This file is the place
// and the staging.
//
// And a place, not a backdrop: a shipping container fitted out as a shop —
// corrugated walls, a pegboard of weapons, ammo cans, a red neon sign with his
// name and mark, a pendant lamp over a steel counter, and the rainy street
// through the open door. Three lights, each with a visible source: the warm
// pendant (key, above right), the red neon (rim, left), the cold street haze
// (fill, through the door).

import {
  paintCrowBody, paintCrowHead, paintCrowCollar, crowEyesLive, HEAD_PIVOT,
} from './crowchar.js';

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.min(255, Math.max(0, Math.round(v * k)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}
function lin(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (const [t, c] of stops) gr.addColorStop(t, c);
  return gr;
}
function rad(g, x, y, r0, r1, stops) {
  const gr = g.createRadialGradient(x, y, r0, x, y, r1);
  for (const [t, c] of stops) gr.addColorStop(t, c);
  return gr;
}
function rrect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const WALL = '#1a1f24';
const STEEL = '#3a4048';
const BRASS = '#a98a52';
const NEON = '#ff3b4a';
const LAMP = '#ffc27a';
const HAZE = '#7fa6c4';

// All painting below happens in "scene units": the scene is 140 units tall,
// x = 0 at the horizontal centre, y = 0 at the top. FLOOR and COUNTER are the
// two horizontal lines everything is staged against.
const FLOOR = 131;
const COUNTER = 106;

// ------------------------------------------------------------- container
function container(g, halfW) {
  // back wall, corrugated
  g.fillStyle = lin(g, 0, 0, 0, FLOOR, [[0, '#14181c'], [0.55, WALL], [1, '#101316']]);
  g.fillRect(-halfW, 0, halfW * 2, FLOOR);
  for (let x = -halfW; x < halfW; x += 4.2) {
    g.fillStyle = 'rgba(0,0,0,0.26)'; g.fillRect(x, 8, 1.3, FLOOR - 8);
    g.fillStyle = 'rgba(190,210,230,0.035)'; g.fillRect(x + 2.2, 8, 1.0, FLOOR - 8);
  }
  // roof beam and floor plate
  g.fillStyle = '#0c0e11'; g.fillRect(-halfW, 0, halfW * 2, 8);
  g.fillStyle = 'rgba(190,210,230,0.06)'; g.fillRect(-halfW, 7.4, halfW * 2, 0.6);
  g.fillStyle = lin(g, 0, FLOOR, 0, 140, [[0, '#1a1b1d'], [1, '#0a0b0c']]);
  g.fillRect(-halfW, FLOOR, halfW * 2, 140 - FLOOR);
  g.fillStyle = 'rgba(255,200,140,0.08)'; g.fillRect(-halfW, FLOOR, halfW * 2, 0.6);
  // checker-plate dimples on the floor
  g.fillStyle = 'rgba(255,255,255,0.025)';
  for (let x = -halfW; x < halfW; x += 5) for (let y = FLOOR + 2; y < 140; y += 3.4) {
    g.fillRect(x + ((y * 7) % 5) * 0.4, y, 1.6, 0.5);
  }
}

// open door on the right: rainy street, sodium lamp, haze spilling in
function doorway(g, x0, halfW) {
  const w = halfW - x0;
  if (w < 6) return;
  g.fillStyle = lin(g, 0, 8, 0, FLOOR, [[0, '#0d1520'], [0.7, '#1a2634'], [1, '#22303d']]);
  g.fillRect(x0, 8, w, FLOOR - 8);
  // far buildings
  const r = rng(0x77a1);
  for (let x = x0; x < halfW; x += 9 + r() * 8) {
    const top = 30 + r() * 40;
    g.fillStyle = 'rgba(8,12,18,0.8)'; g.fillRect(x, top, 8 + r() * 6, FLOOR - top);
    if (r() > 0.4) { g.fillStyle = 'rgba(255,190,110,0.22)'; g.fillRect(x + 2, top + 6 + r() * 10, 1.6, 2.2); }
  }
  // sodium lamp
  g.fillStyle = rad(g, x0 + w * 0.6, 24, 0, 30, [[0, 'rgba(255,190,110,0.35)'], [1, 'rgba(255,190,110,0)']]);
  g.fillRect(x0, 8, w, 50);
  // rain
  g.strokeStyle = 'rgba(170,200,230,0.16)'; g.lineWidth = 0.35;
  g.beginPath();
  for (let i = 0; i < w * 1.4; i++) {
    const x = x0 + r() * w, y = 8 + r() * (FLOOR - 14);
    g.moveTo(x, y); g.lineTo(x - 1.2, y + 5);
  }
  g.stroke();
  // haze spill onto the container floor
  g.fillStyle = lin(g, x0, 0, x0 - 60, 0, [[0, rgba(HAZE, 0.10)], [1, rgba(HAZE, 0)]]);
  g.fillRect(x0 - 60, 8, 60, FLOOR - 8);
  // door frame + the swung-open door leaf
  g.fillStyle = '#0b0d10'; g.fillRect(x0 - 3, 8, 4, FLOOR - 8);
  g.fillStyle = lin(g, x0 - 3, 0, x0 - 16, 0, [[0, '#2a3036'], [1, '#161a1f']]);
  g.beginPath(); g.moveTo(x0 - 3, 10); g.lineTo(x0 - 16, 4); g.lineTo(x0 - 16, FLOOR + 6); g.lineTo(x0 - 3, FLOOR); g.closePath(); g.fill();
  g.fillStyle = 'rgba(0,0,0,0.3)';
  for (let i = 1; i < 4; i++) {
    const t = i / 4, x = x0 - 3 - 13 * t;
    g.fillRect(x, 10 - 6 * t, 0.8, FLOOR - 10 + 6 * t * 2);
  }
  // lock rods on the leaf
  g.fillStyle = '#5a6068';
  g.fillRect(x0 - 9, 12, 0.9, FLOOR - 16); g.fillRect(x0 - 13, 10, 0.9, FLOOR - 12);
}

// ------------------------------------------------------------- pegboard
function rifle(g, x, y, len, col = STEEL, mag = true) {
  const s = len / 40;
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = shade(col, 0.8);
  g.beginPath();            // stock
  g.moveTo(0, -1); g.lineTo(9, -2); g.lineTo(9, 2.6); g.lineTo(1, 3.8); g.lineTo(0, 3.8); g.closePath(); g.fill();
  g.fillStyle = col;
  g.fillRect(9, -2.6, 13, 4.4);                 // receiver
  g.fillRect(22, -1.8, 9, 3.0);                 // handguard
  g.fillStyle = shade(col, 0.7); g.fillRect(31, -1.0, 9, 1.4);  // barrel
  g.fillStyle = shade(col, 0.6);
  g.beginPath(); g.moveTo(11, 1.8); g.lineTo(13.4, 1.8); g.lineTo(12.2, 6); g.lineTo(10.2, 6); g.closePath(); g.fill();  // grip
  if (mag) { g.beginPath(); g.moveTo(15, 1.8); g.lineTo(18.4, 1.8); g.lineTo(19.2, 7.4); g.lineTo(16.4, 7.6); g.closePath(); g.fill(); }
  g.fillStyle = shade(col, 0.55); g.fillRect(12, -4.4, 6, 1.8);  // optic
  g.fillStyle = 'rgba(220,230,240,0.16)'; g.fillRect(9, -2.6, 22, 0.6);
  g.restore();
}
function pegboard(g, x0, x1) {
  const top = 18, bot = 78;
  g.fillStyle = '#2a2520';
  g.fillRect(x0, top, x1 - x0, bot - top);
  g.fillStyle = 'rgba(0,0,0,0.45)';
  for (let x = x0 + 2.5; x < x1 - 1; x += 3.4) for (let y = top + 2.5; y < bot - 1; y += 3.4) g.fillRect(x, y, 0.7, 0.7);
  g.strokeStyle = '#141210'; g.lineWidth = 1.2; g.strokeRect(x0, top, x1 - x0, bot - top);
  g.fillStyle = 'rgba(255,210,160,0.06)'; g.fillRect(x0, top, x1 - x0, 0.8);
}

function wallStock(g, side) {
  // side = -1 (left of CROW) or +1 (right); racks start clear of his shoulders
  const a = side < 0 ? -112 : 42, b = side < 0 ? -42 : 112;
  pegboard(g, a, b);
  const cols = [STEEL, '#3a3a2e', '#2f3a3a', '#463428'];
  const r = rng(side < 0 ? 0x3317 : 0x4421);
  for (let i = 0; i < 3; i++) {
    const len = 46 + r() * 12;
    const x = a + 6 + r() * (b - a - 12 - len);
    // pegs
    g.fillStyle = '#7a7f86';
    g.fillRect(x + len * 0.25, 24 + i * 17, 1.0, 2.4); g.fillRect(x + len * 0.7, 24 + i * 17, 1.0, 2.4);
    rifle(g, x, 27 + i * 17, len, cols[(i + (side > 0 ? 1 : 0)) % cols.length], i !== 1);
  }
  // price tags on string
  g.fillStyle = '#d8cfb8';
  for (let i = 0; i < 2; i++) {
    const tx = a + 10 + i * 30 + r() * 10, ty = 33 + i * 17;
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.3;
    g.beginPath(); g.moveTo(tx, ty - 3); g.lineTo(tx + 1, ty); g.stroke();
    g.save(); g.translate(tx, ty); g.rotate(0.12 - i * 0.2);
    g.fillRect(0, 0, 4.6, 2.6);
    g.fillStyle = 'rgba(40,30,20,0.7)'; g.fillRect(0.6, 0.9, 3.2, 0.4); g.fillRect(0.6, 1.6, 2.2, 0.4);
    g.fillStyle = '#d8cfb8';
    g.restore();
  }
}

// ammo cans and a crate stack against the wall, below the sign
function floorStock(g, x) {
  // crate
  g.fillStyle = lin(g, 0, 98, 0, FLOOR, [[0, '#5a4630'], [1, '#33271a']]);
  g.fillRect(x, 102, 30, FLOOR - 102);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(x, 112, 30, 0.8); g.fillRect(x, 122, 30, 0.8);
  g.fillRect(x + 2, 102, 1.4, FLOOR - 102); g.fillRect(x + 26.6, 102, 1.4, FLOOR - 102);
  g.fillStyle = 'rgba(230,215,185,0.45)'; g.font = 'bold 4.2px monospace'; g.fillText('7.62', x + 9, 119);
  // ammo cans on the crate
  for (let i = 0; i < 2; i++) {
    const cx = x + 2 + i * 14;
    g.fillStyle = lin(g, 0, 90, 0, 102, [[0, '#4d5a3c'], [1, '#2c3422']]);
    g.fillRect(cx, 91, 12, 11);
    g.fillStyle = '#1c2116'; g.fillRect(cx, 91, 12, 1.6); g.fillRect(cx + 4, 89.6, 4, 1.6);
    g.fillStyle = 'rgba(235,225,180,0.55)'; g.font = 'bold 2.6px monospace'; g.fillText('AMMO', cx + 2.4, 98);
  }
}

// ------------------------------------------------------------- neon sign
function neonSign(g, x, y) {
  // backing board
  g.fillStyle = '#0d0e10';
  rrect(g, x - 2, y - 2, 52, 26, 2); g.fill();
  g.strokeStyle = '#26282c'; g.lineWidth = 0.8; g.stroke();
  // light spill on the wall around the sign
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = rad(g, x + 24, y + 11, 2, 54, [[0, rgba(NEON, 0.22)], [1, rgba(NEON, 0)]]);
  g.fillRect(x - 40, y - 30, 130, 90);
  g.restore();
  // crow head glyph: skull line, beak, eye
  const tube = (draw) => {
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [lw, a] of [[3.2, 0.12], [1.8, 0.3]]) { g.strokeStyle = rgba(NEON, a); g.lineWidth = lw; draw(); g.stroke(); }
    g.strokeStyle = '#ffd6da'; g.lineWidth = 0.55; draw(); g.stroke();
    g.restore();
  };
  tube(() => {
    g.beginPath();
    g.moveTo(x + 3, y + 18); g.quadraticCurveTo(x + 2, y + 5, x + 9, y + 4);
    g.quadraticCurveTo(x + 13, y + 4, x + 14, y + 8);
    g.lineTo(x + 20, y + 10.5); g.lineTo(x + 13.6, y + 12);
    g.quadraticCurveTo(x + 12, y + 17, x + 8, y + 19);
  });
  tube(() => { g.beginPath(); g.arc(x + 9.6, y + 8.2, 1.0, 0, Math.PI * 2); });
  // lettering
  g.save();
  g.font = '700 13px Rajdhani, "Arial Narrow", sans-serif';
  g.textBaseline = 'middle';
  g.globalCompositeOperation = 'lighter';
  g.lineJoin = 'round';
  for (const [lw, a] of [[2.6, 0.14], [1.3, 0.32]]) { g.strokeStyle = rgba(NEON, a); g.lineWidth = lw; g.strokeText('CROW', x + 22, y + 11.5); }
  g.fillStyle = '#ffd0d5'; g.fillText('CROW', x + 22, y + 11.5);
  g.restore();
}

// ------------------------------------------------------------- pendant lamp
function pendant(g, x, y) {
  g.strokeStyle = '#08090a'; g.lineWidth = 0.6;
  g.beginPath(); g.moveTo(x, 8); g.lineTo(x, y - 6); g.stroke();
  g.fillStyle = lin(g, x - 9, 0, x + 9, 0, [[0, '#2a3b33'], [0.4, '#4a6656'], [1, '#1c2822']]);
  g.beginPath(); g.moveTo(x - 2, y - 6); g.lineTo(x + 2, y - 6); g.lineTo(x + 9, y); g.lineTo(x - 9, y); g.closePath(); g.fill();
  g.fillStyle = '#fff2d8';
  g.beginPath(); g.ellipse(x, y + 0.6, 2.6, 1.2, 0, 0, Math.PI * 2); g.fill();
}
function pendantLight(g, x, y) {
  g.save(); g.globalCompositeOperation = 'lighter';
  // cone onto the counter
  g.fillStyle = lin(g, 0, y, 0, COUNTER + 6, [[0, rgba(LAMP, 0.20)], [1, rgba(LAMP, 0.04)]]);
  g.beginPath(); g.moveTo(x - 8, y); g.lineTo(x + 8, y); g.lineTo(x + 52, COUNTER + 4); g.lineTo(x - 52, COUNTER + 4); g.closePath(); g.fill();
  g.fillStyle = rad(g, x, y + 2, 0, 16, [[0, rgba(LAMP, 0.55)], [1, rgba(LAMP, 0)]]);
  g.fillRect(x - 16, y - 14, 32, 32);
  // pool on the counter top
  g.fillStyle = rad(g, x, COUNTER, 0, 46, [[0, rgba(LAMP, 0.22)], [1, rgba(LAMP, 0)]]);
  g.beginPath(); g.ellipse(x, COUNTER, 50, 7, 0, 0, Math.PI * 2); g.fill();
  g.restore();
}

// ------------------------------------------------------------- CROW
// The man himself lives in crowchar.js (fifth design, docs/CROW_DESIGN.md).
// He is staged here in "character units" — origin at the base of his neck —
// scaled and placed by CHAR: a medium close-up, hat brim to mid-chest, so
// his face carries the banner instead of being a small figure in a wide box.
const CHAR = { x: -4, y: 88.5, k: 1.25 };
// the pendant hangs clear of the hat brim, above and to his right: it is the
// key light on his face
const LAMP_X = 54;

// ------------------------------------------------------------- counter
function counter(g, halfW) {
  const x0 = -Math.min(124, halfW - 4), x1 = Math.min(116, halfW - 30);
  // top slab
  g.fillStyle = lin(g, 0, COUNTER - 1, 0, COUNTER + 4, [[0, '#5a616a'], [1, '#2a2f35']]);
  g.fillRect(x0, COUNTER - 1, x1 - x0, 5);
  g.fillStyle = 'rgba(255,230,200,0.22)'; g.fillRect(x0, COUNTER - 1, x1 - x0, 0.6);
  // rubber mat on top
  g.fillStyle = '#1d2a22'; g.fillRect(-46, COUNTER - 1.6, 92, 1.2);
  // front: steel panels with a hazard strip
  g.fillStyle = lin(g, 0, COUNTER + 4, 0, FLOOR, [[0, '#262b31'], [1, '#14171b']]);
  g.fillRect(x0 + 2, COUNTER + 4, x1 - x0 - 4, FLOOR - COUNTER - 4);
  const strip = COUNTER + 5;
  g.save();
  g.beginPath(); g.rect(x0 + 2, strip, x1 - x0 - 4, 3.2); g.clip();
  g.fillStyle = '#c99a2e'; g.fillRect(x0, strip, x1 - x0, 3.2);
  g.fillStyle = '#16181b';
  for (let x = x0 - 4; x < x1; x += 5) { g.beginPath(); g.moveTo(x, strip + 3.2); g.lineTo(x + 2.5, strip + 3.2); g.lineTo(x + 5.7, strip); g.lineTo(x + 3.2, strip); g.closePath(); g.fill(); }
  g.restore();
  for (let x = x0 + 2; x + 31 <= x1 - 2; x += 32) {
    g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 0.6;
    g.strokeRect(x + 1.5, strip + 6, 29, FLOOR - strip - 9);
    g.fillStyle = '#7a8088';
    for (const [rx, ry] of [[x + 3.5, strip + 8], [x + 28.5, strip + 8], [x + 3.5, FLOOR - 5], [x + 28.5, FLOOR - 5]]) { g.beginPath(); g.arc(rx, ry, 0.55, 0, Math.PI * 2); g.fill(); }
  }
  // legs' shadow
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x0, FLOOR - 1, x1 - x0, 1.5);
}

function counterGoods(g) {
  // the rifle he is selling, laid across the mat under his right hand
  // scrap: a heap of nuts, bolts and gears
  const r = rng(0x5c4a);
  for (let i = 0; i < 26; i++) {
    const x = -72 + r() * 22, y = COUNTER - 1.6 - r() * 3.2 * (1 - Math.abs(x + 61) / 12);
    const c = r() > 0.5 ? '#8a8f97' : '#a0784a';
    g.fillStyle = c;
    if (r() > 0.6) { g.beginPath(); g.arc(x, y, 1.1 + r() * 0.6, 0, Math.PI * 2); g.fill(); g.fillStyle = '#16181b'; g.beginPath(); g.arc(x, y, 0.4, 0, Math.PI * 2); g.fill(); }
    else { g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.lineTo(x + Math.cos(a) * 1.1, y + Math.sin(a) * 1.1); } g.closePath(); g.fill(); }
  }
  // ammo box, lid open
  g.fillStyle = lin(g, 0, COUNTER - 10, 0, COUNTER, [[0, '#5a6a46'], [1, '#2d3622']]);
  g.fillRect(64, COUNTER - 8, 14, 7);
  g.fillStyle = '#2a3320';
  g.beginPath(); g.moveTo(64, COUNTER - 8); g.lineTo(78, COUNTER - 8); g.lineTo(80, COUNTER - 14); g.lineTo(66, COUNTER - 14); g.closePath(); g.fill();
  for (let i = 0; i < 5; i++) { g.fillStyle = BRASS; g.fillRect(65.4 + i * 2.5, COUNTER - 10.4, 1.6, 2.6); g.fillStyle = '#6d5a3c'; g.fillRect(65.4 + i * 2.5, COUNTER - 11.4, 1.6, 1.0); }
  // price card propped against the box
  g.save(); g.translate(82, COUNTER - 1); g.rotate(-0.18);
  g.fillStyle = '#d8cfb8'; g.fillRect(0, -7, 9, 7);
  g.fillStyle = '#b8302a'; g.fillRect(1, -6, 7, 1.6);
  g.fillStyle = 'rgba(40,30,20,0.75)'; g.fillRect(1, -3.4, 5, 0.6); g.fillRect(1, -2.2, 3.6, 0.6);
  g.restore();
}

// ------------------------------------------------------------- the crow
// His bird, perched on the leather pad on his left shoulder, beak at his ear.
// the dark; now it sits on his shoulder and watches you shop. Crows move
// their heads in snaps, not sweeps — the head holds still, jerks to a new
// angle, holds again — and that one behaviour sells the animal more than
// any amount of feather detail.
//
// Drawn at its feet (0,0), facing +x, ~17 units long. `pose` is
// { head, blink, wing, beak } — all 0..1 except head (radians).
function petCrow(g, pose) {
  const { head = 0, blink = 0, wing = 0, beak = 0 } = pose || {};
  g.lineJoin = 'round'; g.lineCap = 'round';
  // legs gripping the shoulder seam
  g.strokeStyle = '#24262b'; g.lineWidth = 0.7;
  g.beginPath(); g.moveTo(-1.6, -3.4); g.lineTo(-2.0, 0); g.moveTo(1.0, -3.2); g.lineTo(1.2, 0); g.stroke();
  g.lineWidth = 0.45;
  g.beginPath();
  for (const fx of [-2.0, 1.2]) { g.moveTo(fx, 0); g.lineTo(fx + 1.6, 0.5); g.moveTo(fx, 0); g.lineTo(fx - 1.2, 0.6); }
  g.stroke();
  g.fillStyle = BRASS; g.fillRect(0.6, -2.4, 1.1, 0.8);          // leg ring
  // tail: a wedge of long feathers down and back
  g.fillStyle = lin(g, -14, 0, -3, 0, [[0, '#07080a'], [1, '#15171c']]);
  g.beginPath();
  g.moveTo(-4.8, -6.6); g.lineTo(-12.6, 4.6); g.lineTo(-11.2, 6.2); g.lineTo(-9.4, 5.0); g.lineTo(-2.8, -3.4); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(110,160,180,0.22)'; g.lineWidth = 0.25;
  g.beginPath(); g.moveTo(-5.4, -5.2); g.lineTo(-11.8, 5.0); g.moveTo(-4.6, -4.2); g.lineTo(-10.2, 5.2); g.stroke();
  // body
  g.save(); g.translate(-0.6, -7.2); g.rotate(-0.42);
  g.fillStyle = lin(g, 0, -5, 0, 5, [[0, '#1d2128'], [0.5, '#0e0f13'], [1, '#060708']]);
  g.beginPath(); g.ellipse(0, 0, 7.4, 4.6, 0, 0, Math.PI * 2); g.fill();
  // folded wing, lifting a touch on a flick
  g.save(); g.translate(-1.6, -0.6); g.rotate(-wing * 0.55);
  g.fillStyle = lin(g, -6, -3, 5, 3, [[0, '#0a0b0e'], [0.55, '#191c22'], [1, '#0b0c0f']]);
  g.beginPath(); g.moveTo(5.2, -2.2); g.quadraticCurveTo(-2, -4.4, -9.6, 1.4); g.quadraticCurveTo(-2, 2.6, 5.2, 1.6); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 0.22;
  for (let i = 0; i < 5; i++) { const x = -7.6 + i * 2.2; g.beginPath(); g.moveTo(x, 1.4 - i * 0.1); g.lineTo(x + 2.6, -1.0 - i * 0.25); g.stroke(); }
  g.fillStyle = 'rgba(105,170,195,0.30)';            // the oil-slick sheen
  g.beginPath(); g.moveTo(4.6, -2.0); g.quadraticCurveTo(-1.6, -3.8, -7.4, 0.2); g.quadraticCurveTo(-1.6, -2.6, 4.6, -1.2); g.closePath(); g.fill();
  g.restore();
  // neon rim along the back, the same red that edges CROW's coat
  g.strokeStyle = 'rgba(255,70,80,0.38)'; g.lineWidth = 0.55;
  g.beginPath(); g.ellipse(0, 0, 7.2, 4.4, 0, Math.PI * 1.02, Math.PI * 1.62); g.stroke();
  g.restore();
  g.strokeStyle = 'rgba(255,70,80,0.30)'; g.lineWidth = 0.45;
  g.beginPath(); g.moveTo(-5.0, -7.0); g.lineTo(-12.4, 4.4); g.stroke();
  // head: pivots at the neck
  g.save(); g.translate(3.4, -10.6); g.rotate(head);
  g.fillStyle = lin(g, -2, -4, 2, 3, [[0, '#262b33'], [0.45, '#121418'], [1, '#08090b']]);
  g.beginPath(); g.ellipse(1.6, -2.4, 3.9, 3.3, -0.2, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(120,185,205,0.34)';
  g.beginPath(); g.ellipse(1.2, -4.4, 2.6, 0.9, -0.25, 0, Math.PI * 2); g.fill();
  // beak: upper mandible, lower one hinging open on a caw
  g.fillStyle = lin(g, 4, -4, 10, -1, [[0, '#3a3e45'], [0.5, '#22252a'], [1, '#0d0e10']]);
  g.beginPath(); g.moveTo(4.6, -3.6); g.quadraticCurveTo(8.6, -3.6, 10.8, -1.9); g.lineTo(4.9, -1.8); g.closePath(); g.fill();
  g.save(); g.translate(4.9, -1.8); g.rotate(beak * 0.42);
  g.fillStyle = '#16181c';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(5.4, -0.05); g.quadraticCurveTo(3, 1.1, 0, 0.9); g.closePath(); g.fill();
  g.restore();
  g.fillStyle = 'rgba(230,236,244,0.40)'; g.fillRect(5.4, -3.4, 3.2, 0.32);
  // eye: dark, with a wet glint — and a lid for the blink
  g.fillStyle = '#05060a'; g.beginPath(); g.arc(2.8, -3.1, 0.95, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(160,170,180,0.55)'; g.lineWidth = 0.18; g.stroke();
  g.fillStyle = 'rgba(255,250,240,0.95)'; g.beginPath(); g.arc(3.15, -3.45, 0.3, 0, Math.PI * 2); g.fill();
  if (blink > 0) {
    g.fillStyle = '#1b1e24';
    g.beginPath(); g.ellipse(2.8, -3.1, 1.15, 1.15 * blink, 0, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

// Deterministic pseudo-random per integer, for the bird's schedule.
function hash01(n) {
  let x = (n * 2654435761) >>> 0;
  x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}

// The bird's pose at time t (seconds).
function crowPose(t) {
  const SEG = 1.35;
  const k = Math.floor(t / SEG), f = t - k * SEG;
  const angle = (i) => -0.38 + hash01(i * 7 + 3) * 0.62;
  // snap: 0.11s to the new angle, then hold — with a breath of drift
  const e = Math.min(1, f / 0.11);
  const ease = 1 - Math.pow(1 - e, 3);
  let head = angle(k - 1) + (angle(k) - angle(k - 1)) * ease + Math.sin(t * 2.3) * 0.015;
  const blink = (t % 3.3) < 0.13 ? Math.sin(((t % 3.3) / 0.13) * Math.PI) : 0;
  const r = hash01(k * 13 + 5);
  const wing = r > 0.82 && f < 0.5 ? Math.sin((f / 0.5) * Math.PI) : 0;
  const beak = r < 0.1 && f > 0.15 && f < 0.55 ? Math.sin(((f - 0.15) / 0.4) * Math.PI) : 0;
  if (beak) head -= beak * 0.12;      // the head lifts as it caws
  return { head, blink, wing, beak };
}

// ------------------------------------------------------------- scene
//
// The stall is drawn in three baked layers and a handful of live elements:
//
//   back  — container, door, racks, neon sign, lamp cone          (baked)
//   man   — CROW himself, rim-lit by neon and lamp                (baked)
//   front — forearms and hands, counter, goods, lamp shade, grade (baked)
//   live  — breathing, the bird, cigarette smoke and ember, the optic's
//           pulse, the neon's flicker, rain in the doorway, dust in the
//           lamp light
//
// The bakes are the expensive part (~100ms of path work) and happen once per
// size; a frame is three blits and a few dozen small shapes.

// The banner frames the scene from just under the roof beam to just below
// the counter's hazard strip, not the whole 140-unit container: the floor
// and the counter's lower panels are empty, and showing them made CROW a
// small figure in a wide box. Cropped like this he fills two-thirds of the
// banner's height.
const VIEW_TOP = 3, VIEW_H = 114;

function sceneGeom(w, h) {
  const u = h / VIEW_H;
  const halfW = w / 2 / u;
  return { u, halfW, doorX: Math.max(120, halfW - 34), door: halfW > 128, wideSign: halfW > 150 };
}

function bakeLayer(w, h, dpr, paint) {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(h * dpr));
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  paint(g);
  return cv;
}

// One part of CROW baked at `px` device pixels per scene unit over the box
// [x0,y0]-[x1,y1], with the two rim lights cut from its own silhouette.
function bakePart(px, x0, y0, x1, y1, paint, neonA = 0.5, lampA = 0.3) {
  const W = Math.max(1, Math.ceil((x1 - x0) * px)), H = Math.max(1, Math.ceil((y1 - y0) * px));
  const L = document.createElement('canvas'); L.width = W; L.height = H;
  const lg = L.getContext('2d');
  lg.scale(px, px); lg.translate(-x0, -y0);
  paint(lg);
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const og = out.getContext('2d');
  const rim = (col, dx, dy, a, fromLeft) => {
    const R = document.createElement('canvas'); R.width = W; R.height = H;
    const rc = R.getContext('2d');
    rc.drawImage(L, 0, 0);
    rc.globalCompositeOperation = 'source-in';
    rc.fillStyle = lin(rc, 0, 0, W, 0, fromLeft
      ? [[0, rgba(col, a)], [0.42, rgba(col, 0)], [1, rgba(col, 0)]]
      : [[0, rgba(col, 0)], [0.55, rgba(col, 0)], [1, rgba(col, a)]]);
    rc.fillRect(0, 0, W, H);
    og.drawImage(R, dx * px, dy * px);
  };
  rim(NEON, -0.5, 0, neonA, true);
  rim(LAMP, 0.4, -0.3, lampA, false);
  og.drawImage(L, 0, 0);
  return { cv: out, x0, y0, w: x1 - x0, h: y1 - y0 };
}

function buildTraderScene(w, h, dpr) {
  const G = sceneGeom(w, h);
  const { u, halfW } = G;
  const inScene = (g, fn) => { g.save(); g.translate(w / 2, -VIEW_TOP * u); g.scale(u, u); fn(g); g.restore(); };
  const sharp = bakeLayer(w, h, dpr, (g) => inScene(g, (g) => {
    container(g, halfW);
    if (G.door) doorway(g, G.doorX, halfW);
    wallStock(g, -1);
    wallStock(g, 1);
    if (G.wideSign) { neonSign(g, -halfW + 10, 22); floorStock(g, -halfW + 12); }
    pendantLight(g, LAMP_X, 20);
  }));
  // A shallow depth of field: the shop behind him goes soft and a step
  // darker, so he reads as the subject rather than one more object in it.
  const back = document.createElement('canvas'); back.width = sharp.width; back.height = sharp.height;
  {
    const bg = back.getContext('2d');
    bg.filter = `blur(${Math.max(0.5, 0.9 * dpr).toFixed(2)}px)`;
    bg.drawImage(sharp, 0, 0);
    bg.filter = 'none';
    bg.fillStyle = 'rgba(6,8,11,0.22)'; bg.fillRect(0, 0, back.width, back.height);
  }
  // CROW in three parts at device resolution, in character units. bakePart
  // adds a soft silhouette rim on top of the rim light painted into the art.
  const px = u * dpr * CHAR.k;
  const body = bakePart(px, -46, -48, 46, 42, paintCrowBody, 0.3, 0.2);
  const head = bakePart(px, -30, -63, 34, -10, paintCrowHead, 0.3, 0.2);
  const collar = bakePart(px, -15, -15, 16, 17, paintCrowCollar, 0.2, 0.15);
  const front = bakeLayer(w, h, dpr, (g) => {
    inScene(g, (g) => {
      counter(g, halfW);
      counterGoods(g);
      pendant(g, LAMP_X, 20);
      g.fillStyle = rgba(HAZE, 0.035); g.fillRect(-halfW, 0, halfW * 2, 140);
    });
    const vig = g.createRadialGradient(w / 2, h * 0.45, h * 0.3, w / 2, h * 0.5, w * 0.62);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.5)');
    g.fillStyle = vig; g.fillRect(0, 0, w, h);
  });
  return { w, h, dpr, G, back, body, head, collar, front };
}

// CROW's own idle at time t. He looks straight at you; every 9.5s his eyes go to the
// bird and his head follows a little, then both come back. Blinks on their
// own beat, plus one as the glance starts (people blink when they move their
// eyes a long way).
function crowLife(t) {
  const breath = Math.sin(t * 1.25) * 0.32;
  const gk = t % 9.5;
  const look = gk > 5.4 && gk < 7.8 ? Math.sin(((gk - 5.4) / 2.4) * Math.PI) : 0;
  const ease = look * look * (3 - 2 * look);
  const lx = -ease * 0.9;
  const ly = ease * 0.5;
  const tilt = Math.sin(t * 0.45) * 0.018 - ease * 0.05;
  const bk = (t + 1.7) % 4.3;
  let blink = bk < 0.16 ? Math.sin((bk / 0.16) * Math.PI) : 0;
  if (gk > 5.4 && gk < 5.56) blink = Math.max(blink, Math.sin(((gk - 5.4) / 0.16) * Math.PI));
  return { breath, tilt, lx, ly, blink };
}

// Neon intensity: steady, with the odd stutter a tired transformer makes.
function neonLevel(t) {
  const k = Math.floor(t / 0.9), f = t - k * 0.9;
  const r = hash01(k * 31 + 11);
  if (r > 0.86 && f < 0.32) return (Math.floor(f / 0.05) % 2) ? 0.25 : 0.9;
  return 0.94 + Math.sin(t * 37) * 0.03;
}

function drawTraderFrame(g, S, t) {
  const { w, h, G } = S;
  const { u, halfW } = G;
  g.save();
  g.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  g.drawImage(S.back, 0, 0, w, h);

  g.save(); g.translate(w / 2, -VIEW_TOP * u); g.scale(u, u);

  // neon: a dropout dims the tube and its spill
  if (G.wideSign) {
    const lv = neonLevel(t), x = -halfW + 10, y = 22;
    if (lv < 0.9) { g.fillStyle = `rgba(6,7,9,${(0.9 - lv) * 0.85})`; g.fillRect(x - 2, y - 2, 52, 26); }
    else {
      g.save(); g.globalCompositeOperation = 'lighter';
      g.fillStyle = rad(g, x + 24, y + 11, 2, 40, [[0, rgba(NEON, 0.05 + (lv - 0.94) * 0.8)], [1, rgba(NEON, 0)]]);
      g.fillRect(x - 20, y - 20, 90, 64);
      g.restore();
    }
  }

  // rain through the open door
  if (G.door) {
    const x0 = G.doorX, dw = halfW - x0;
    g.save(); g.beginPath(); g.rect(x0, 8, dw, FLOOR - 10); g.clip();
    g.strokeStyle = 'rgba(175,205,235,0.24)'; g.lineWidth = 0.35;
    g.beginPath();
    const n = Math.round(dw * 1.3), span = FLOOR + 20;
    for (let i = 0; i < n; i++) {
      const x = x0 + hash01(i * 3 + 1) * (dw + 6);
      const y = ((hash01(i * 5 + 2) * span + t * (95 + hash01(i) * 40)) % span) - 6;
      g.moveTo(x, y); g.lineTo(x - 1.3, y + 5.5);
    }
    g.stroke();
    g.restore();
  }

  // dust turning in the lamp's cone
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 16; i++) {
    const p = (t * (0.03 + hash01(i + 40) * 0.04) + hash01(i + 9)) % 1;
    const yy = 26 + p * (COUNTER - 30);
    const spread = 8 + (yy - 22) * 0.62;
    const xx = LAMP_X + (hash01(i + 70) - 0.5) * 2 * spread * 0.8 + Math.sin(t * 0.6 + i) * 2;
    const tw = 0.5 + 0.5 * Math.sin(t * 1.7 + i * 2.1);
    g.fillStyle = rgba(LAMP, 0.10 + 0.22 * tw * Math.sin(p * Math.PI));
    g.fillRect(xx, yy, 0.55, 0.55);
  }
  g.restore();

  // ---- CROW. Everything below is in character units.
  g.save();
  g.translate(CHAR.x, CHAR.y); g.scale(CHAR.k, CHAR.k);
  const pose = crowLife(t);
  const P = (p, dy) => g.drawImage(p.cv, p.x0, p.y0 + dy, p.w, p.h);
  P(S.body, pose.breath);
  g.save();
  g.translate(HEAD_PIVOT.x, HEAD_PIVOT.y + pose.breath);
  g.rotate(pose.tilt);
  g.translate(-HEAD_PIVOT.x, -HEAD_PIVOT.y);
  P(S.head, 0);
  crowEyesLive(g, pose.lx, pose.ly, pose.blink);
  g.restore();
  P(S.collar, pose.breath);
  // his bird on the perch pad, turned toward him with its beak at his ear —
  // his confidant — its tail falling away off the outside of the shoulder
  g.save(); g.translate(-37.6, 3.4 + pose.breath * 0.9); g.scale(1.75, 1.75);
  petCrow(g, crowPose(t));
  g.restore();
  g.restore();


  g.restore();
  g.drawImage(S.front, 0, 0, w, h);
  g.save(); g.translate(w / 2, -VIEW_TOP * u); g.scale(u, u);

  g.globalAlpha = 1;

  g.restore();
  g.restore();
}

// A still frame (shop thumbnails, anywhere without an animation loop).
export function paintTraderScene(g, w, h, t = 2.2) {
  const S = buildTraderScene(w, h, 1);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
  drawTraderFrame(tmp.getContext('2d'), S, t);
  g.clearRect(0, 0, w, h);
  g.drawImage(tmp, 0, 0);
  g.restore();
}

// Bust, for any square use: the scene cropped onto CROW.
export function paintTrader(g, w, h) {
  const cv = document.createElement('canvas');
  const H = Math.round(h * 1.5);
  cv.width = Math.round(H * 2.6); cv.height = H;
  paintTraderScene(cv.getContext('2d'), cv.width, cv.height);
  const sw = cv.height * (w / h) * 0.9, sh = cv.height * 0.9;
  g.clearRect(0, 0, w, h);
  g.drawImage(cv, cv.width / 2 - sw / 2 - sw * 0.1, cv.height * 0.01, sw, sh, 0, 0, w, h);
}

export function renderTraderPortrait(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 120, h = cv.clientHeight || 120;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  paintTrader(cv.getContext('2d'), cv.width, cv.height);
}

// The live banner. Idempotent: calling it again on the same canvas (every
// time the Trader tab is shown) only rebuilds the bakes if the size changed.
// The loop draws at ~30fps while the canvas is on screen and idles — a cheap
// visibility check twice a second — while it is not (other tab, in a match,
// app in the background). With reduced motion it paints one still frame.
const LIVE = new WeakMap();
export function renderTraderScene(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 640, h = cv.clientHeight || 220;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  let st = LIVE.get(cv);
  if (!st) { st = { S: null, raf: 0, t0: performance.now(), last: 0 }; LIVE.set(cv, st); }
  if (!st.S || st.S.w !== w || st.S.h !== h || st.S.dpr !== dpr) st.S = buildTraderScene(w, h, dpr);
  const g = cv.getContext('2d');
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  drawTraderFrame(g, st.S, reduced ? 2.2 : (performance.now() - st.t0) / 1000);
  if (reduced || st.running) return;
  st.running = true;
  const tick = (now) => {
    if (!cv.isConnected) { st.running = false; return; }
    if (document.hidden || !cv.offsetWidth) { setTimeout(() => requestAnimationFrame(tick), 500); return; }
    if (now - st.last >= 32) {
      st.last = now;
      drawTraderFrame(g, st.S, (now - st.t0) / 1000);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
