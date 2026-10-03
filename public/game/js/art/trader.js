// CROW — the scrap trader, and the container shop he works out of.
//
// Painted rather than shipped as an image, like every other asset here: crisp
// at any DPR, no download, re-lit by changing a few numbers.
//
// Design brief. The first CROW was a hooded silhouette with a glowing visor
// slot — the stock "mysterious vendor" every generated game ships, with
// nothing in it that said *this* trader or *this* name. The redesign is built
// on the name:
//
//   - a beaked respirator (a plague-doctor nose cone in riveted steel), turned
//     three-quarters so the beak breaks the hood's outline — the one shape
//     that makes him CROW in silhouette before any detail resolves
//   - a mantle of black feathers and shredded cloth over the shoulders, with
//     the blue-green sheen real crow plumage has
//   - two round brass-rimmed goggle lenses instead of a sci-fi visor
//   - hands on the counter, one of them on a rifle he is selling
//
// And a place, not a backdrop: a shipping container fitted out as a shop —
// corrugated walls, a pegboard of weapons, ammo cans, a red neon sign with his
// name and mark, a pendant lamp over a steel counter, and the rainy street
// through the open door. Three lights, each with a visible source: the warm
// pendant (key, above right), the red neon (rim, left), the cold street haze
// (fill, through the door).

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
const COAT = '#17181c';
const FEATHER = '#101115';
const SHEEN = '#3d5566';     // crow-plumage blue-green
const LEATHER = '#3b2f26';
const BRASS = '#a98a52';
const NEON = '#ff3b4a';
const LAMP = '#ffc27a';
const HAZE = '#7fa6c4';

// All painting below happens in "scene units": the scene is 140 units tall,
// x = 0 at the horizontal centre, y = 0 at the top. FLOOR and COUNTER are the
// two horizontal lines everything is staged against.
const FLOOR = 131;
const COUNTER = 94;

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
function pistol(g, x, y, s, col = STEEL) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = col; g.fillRect(0, -2, 9, 2.4);
  g.fillStyle = shade(col, 0.65);
  g.beginPath(); g.moveTo(0.6, 0.4); g.lineTo(3, 0.4); g.lineTo(2.2, 4.6); g.lineTo(-0.4, 4.6); g.closePath(); g.fill();
  g.fillStyle = 'rgba(220,230,240,0.18)'; g.fillRect(0, -2, 9, 0.5);
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
// A man, not a mask. The second design (a beaked plague-doctor respirator) was
// rejected: a faceless figure gives the player nobody to deal with. CROW is an
// old scavenger who has outlived the sector — weathered face, grey stubble,
// a knit cap with one black crow feather tucked in it, a scar through the eye
// he lost and replaced with a cheap red optic, a shearling-collared work coat,
// a cigarette, and his hands folded on the counter waiting for your offer.
const SKIN = '#ad7d5c';
const SKIN_D = '#7a5038';
const SKIN_L = '#d4a27c';
const COAT_C = '#2f2b23';
const FUR = '#8c7556';

function feather(g, x, y, len, ang, w, sheen) {
  g.save(); g.translate(x, y); g.rotate(ang);
  g.fillStyle = lin(g, 0, -w, 0, w, [[0, sheen ? shade(SHEEN, 0.9) : '#1c1f26'], [0.5, FEATHER], [1, '#060608']]);
  g.beginPath();
  g.moveTo(0, -w * 0.6);
  g.quadraticCurveTo(len * 0.55, -w, len, 0);
  g.quadraticCurveTo(len * 0.55, w, 0, w * 0.6);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(120,150,170,0.18)'; g.lineWidth = 0.25;
  g.beginPath(); g.moveTo(0.5, 0); g.lineTo(len * 0.92, 0); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.18;
  for (let t = 0.2; t < 0.9; t += 0.09) {
    const x = len * t, hw = w * 0.8 * Math.sin(Math.PI * t);
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + hw * 0.7, -hw); g.moveTo(x, 0); g.lineTo(x + hw * 0.7, hw); g.stroke();
  }
  g.restore();
}

function skinPath(g) {
  g.beginPath();
  g.moveTo(-10, 31);
  g.quadraticCurveTo(-11, 37, -10.6, 42);
  g.quadraticCurveTo(-10.2, 48, -7.4, 53);
  g.quadraticCurveTo(-3.4, 57.8, 1.4, 58);
  g.quadraticCurveTo(6.4, 57.8, 9.6, 53);
  g.quadraticCurveTo(12.4, 48, 12.6, 42);
  g.quadraticCurveTo(13, 37, 12, 31);
  g.closePath();
}

function crow(g) {
  const r = rng(0xc120);
  // ---- coat: broad, a little hunched over the counter
  g.fillStyle = lin(g, -44, 0, 44, 0, [[0, '#1a1814'], [0.55, COAT_C], [1, '#3e382d']]);
  g.beginPath();
  g.moveTo(-46, COUNTER + 4);
  g.quadraticCurveTo(-46, 74, -34, 66);
  g.quadraticCurveTo(-22, 60, -10, 60);
  g.lineTo(12, 60);
  g.quadraticCurveTo(24, 60, 36, 66);
  g.quadraticCurveTo(48, 74, 48, COUNTER + 4);
  g.closePath(); g.fill();
  // seams + a pocket flap so it reads as a work coat
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.5;
  g.beginPath(); g.moveTo(-30, 67); g.quadraticCurveTo(-27, 80, -29, COUNTER); g.stroke();
  g.beginPath(); g.moveTo(32, 67); g.quadraticCurveTo(29, 80, 31, COUNTER); g.stroke();
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-26, 80, 11, 2.2); g.fillRect(17, 80, 11, 2.2);
  g.fillStyle = 'rgba(255,215,170,0.07)'; g.fillRect(17, 80, 11, 0.5);
  // sweater + satchel strap
  g.fillStyle = '#1d1e20';
  g.beginPath(); g.moveTo(-9, 60); g.lineTo(11, 60); g.lineTo(8, COUNTER + 4); g.lineTo(-6, COUNTER + 4); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 0.4;
  for (let y = 64; y < COUNTER; y += 2.2) { g.beginPath(); g.moveTo(-7, y); g.lineTo(9, y); g.stroke(); }
  g.fillStyle = LEATHER;
  g.beginPath(); g.moveTo(16, 60); g.lineTo(21, 60); g.lineTo(-30, COUNTER + 4); g.lineTo(-36, COUNTER + 4); g.closePath(); g.fill();
  g.fillStyle = BRASS; g.fillRect(-1, 76, 3, 3.6); g.fillStyle = '#2a2018'; g.fillRect(-0.2, 76.8, 1.4, 2);

  // ---- neck, with the crow inked on it
  g.fillStyle = lin(g, -6, 0, 8, 0, [[0, SKIN_D], [0.6, SKIN], [1, SKIN_D]]);
  g.beginPath(); g.moveTo(-6, 52); g.lineTo(8, 52); g.lineTo(9, 63); g.lineTo(-7, 63); g.closePath(); g.fill();
  g.fillStyle = 'rgba(28,32,40,0.75)';
  g.beginPath();   // tiny crow in flight
  g.moveTo(-5.4, 59.4); g.quadraticCurveTo(-4.2, 57.6, -2.8, 58.8); g.quadraticCurveTo(-1.6, 57.4, -0.2, 58.6);
  g.lineTo(-1.8, 59.4); g.lineTo(-2.8, 60.4); g.lineTo(-3.6, 59.4); g.closePath(); g.fill();

  // ---- shearling collar, big and worn
  g.fillStyle = lin(g, 0, 54, 0, 70, [[0, shade(FUR, 1.15)], [1, shade(FUR, 0.6)]]);
  g.beginPath();
  g.moveTo(-9, 58);
  g.quadraticCurveTo(-20, 58, -26, 66);
  g.quadraticCurveTo(-18, 71, -9, 68);
  g.lineTo(-5, 62);
  g.closePath(); g.fill();
  g.beginPath();
  g.moveTo(11, 58);
  g.quadraticCurveTo(22, 58, 28, 66);
  g.quadraticCurveTo(20, 71, 11, 68);
  g.lineTo(7, 62);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(60,44,28,0.55)'; g.lineWidth = 0.35;
  for (let i = 0; i < 40; i++) {
    const side = i % 2 ? 1 : -1;
    const t = r();
    const x = side * (8 + t * 17) + 1, y = 60 + t * 6 + r() * 3;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + side * (0.6 + r()), y + 0.8 + r()); g.stroke();
  }

  // ---- head, drawn 1.22x about the chin: at 1:1 it sat on that coat
  // like a doll's head
  g.save(); g.translate(1, 57); g.scale(1.22, 1.22); g.translate(-1, -57);

  // ---- ears
  for (const [ex, flip] of [[-11, -1], [13, 1]]) {
    g.fillStyle = flip < 0 ? SKIN_D : SKIN;
    g.beginPath(); g.ellipse(ex, 42, 2.0, 3.6, flip * 0.15, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(70,40,26,0.5)';
    g.beginPath(); g.ellipse(ex + flip * 0.3, 42, 0.9, 2.2, 0, 0, Math.PI * 2); g.fill();
  }

  // ---- face: lit from the pendant above-right, neon on the left
  g.fillStyle = lin(g, -11, 0, 13, 0, [[0, SKIN_D], [0.35, SKIN], [0.75, SKIN_L], [1, SKIN]]);
  skinPath(g); g.fill();
  g.save(); skinPath(g); g.clip();
  // form shadows: eye sockets, under the cheekbones, under the brow
  g.fillStyle = 'rgba(80,46,30,0.38)';
  g.beginPath(); g.ellipse(-4.4, 40, 4.2, 2.8, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(6.6, 40, 4.0, 2.8, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(80,46,30,0.3)';
  g.beginPath(); g.ellipse(-7.4, 48, 3, 4, 0.2, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(9.4, 48, 2.6, 4, -0.2, 0, Math.PI * 2); g.fill();
  // grey stubble and moustache over the jaw
  g.fillStyle = 'rgba(132,128,122,0.72)';
  g.beginPath();
  g.moveTo(-10.4, 45); g.quadraticCurveTo(-9, 52, -4, 56); g.quadraticCurveTo(1.4, 59, 6.8, 56);
  g.quadraticCurveTo(11.8, 52, 12.6, 45); g.lineTo(10, 47.5);
  g.quadraticCurveTo(6, 47, 4, 48.4); g.quadraticCurveTo(1.4, 47.2, -1.2, 48.4);
  g.quadraticCurveTo(-4, 47, -8, 47.5); g.closePath(); g.fill();
  g.lineWidth = 0.22; g.lineCap = 'round';
  for (let i = 0; i < 120; i++) {
    const x = -9.6 + r() * 21.6, y = 47.5 + r() * 9.5;
    const lit = x > 2;
    g.strokeStyle = lit ? 'rgba(225,220,212,0.35)' : 'rgba(60,56,52,0.35)';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (x - 1) * 0.04, y + 0.9); g.stroke();
  }
  g.lineCap = 'butt';
  g.fillStyle = 'rgba(150,146,138,0.85)';   // moustache
  g.beginPath();
  g.moveTo(-3.4, 49.6); g.quadraticCurveTo(1.4, 47.4, 6.2, 49.4);
  g.quadraticCurveTo(6.6, 50.6, 5.6, 50.8); g.quadraticCurveTo(1.4, 49.4, -2.8, 51);
  g.quadraticCurveTo(-3.8, 50.6, -3.4, 49.6); g.closePath(); g.fill();
  g.restore();

  // nose
  g.fillStyle = 'rgba(90,52,34,0.45)';
  g.beginPath(); g.moveTo(0.4, 39); g.quadraticCurveTo(-0.6, 43, -1.2, 46.2); g.lineTo(0.6, 46.4); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,214,176,0.35)';
  g.beginPath(); g.moveTo(1.8, 39.5); g.quadraticCurveTo(2.6, 43, 2.8, 45.4); g.lineTo(2.0, 45.6); g.quadraticCurveTo(1.8, 43, 1.4, 39.6); g.closePath(); g.fill();
  g.fillStyle = 'rgba(70,38,24,0.6)';
  g.beginPath(); g.ellipse(0.0, 46.8, 1.0, 0.45, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(3.4, 46.7, 0.9, 0.42, 0, 0, Math.PI * 2); g.fill();
  // nasolabial folds and a mouth that has stopped smiling
  g.strokeStyle = 'rgba(80,44,28,0.5)'; g.lineWidth = 0.4;
  g.beginPath(); g.moveTo(-1.6, 46.4); g.quadraticCurveTo(-4.4, 49, -4, 52); g.stroke();
  g.beginPath(); g.moveTo(4.8, 46.2); g.quadraticCurveTo(7.4, 48.8, 7.2, 52); g.stroke();
  g.strokeStyle = '#4a2a1c'; g.lineWidth = 0.55;
  g.beginPath(); g.moveTo(-2.2, 51.4); g.quadraticCurveTo(1.4, 51.0, 5.0, 51.6); g.stroke();
  g.fillStyle = 'rgba(160,96,76,0.5)'; g.fillRect(-1, 52, 4.4, 0.6);

  // brows: heavy, the left one lifted a touch — sizing you up
  g.fillStyle = '#5c5650';
  g.beginPath(); g.moveTo(-8.6, 36.6); g.quadraticCurveTo(-5, 34.6, -1.2, 36.2); g.lineTo(-1.4, 37.2); g.quadraticCurveTo(-5, 36, -8.4, 37.6); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(3.4, 36.8); g.quadraticCurveTo(7, 35.8, 10.6, 37.2); g.lineTo(10.4, 38); g.quadraticCurveTo(7, 37, 3.6, 37.8); g.closePath(); g.fill();

  // his own eye
  g.fillStyle = '#e6dccb';
  g.beginPath(); g.moveTo(-7, 40); g.quadraticCurveTo(-4.4, 38.4, -1.8, 40); g.quadraticCurveTo(-4.4, 41.2, -7, 40); g.closePath(); g.fill();
  g.fillStyle = '#4a3220'; g.beginPath(); g.arc(-4.2, 39.9, 1.05, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#0c0806'; g.beginPath(); g.arc(-4.2, 39.9, 0.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,240,220,0.9)'; g.fillRect(-3.8, 39.3, 0.45, 0.45);
  g.strokeStyle = '#3a2216'; g.lineWidth = 0.6;
  g.beginPath(); g.moveTo(-7.2, 40); g.quadraticCurveTo(-4.4, 38.1, -1.6, 39.8); g.stroke();   // heavy lid
  g.strokeStyle = 'rgba(80,44,28,0.45)'; g.lineWidth = 0.35;
  g.beginPath(); g.moveTo(-6.4, 41.8); g.quadraticCurveTo(-4.4, 42.6, -2.4, 41.6); g.stroke();  // bag
  // crow's feet
  g.beginPath(); g.moveTo(-7.6, 40); g.lineTo(-9.2, 39.2); g.moveTo(-7.6, 40.4); g.lineTo(-9.2, 41); g.stroke();

  // scar through where the other eye was, then the optic bolted over it
  g.strokeStyle = 'rgba(70,30,22,0.7)'; g.lineWidth = 1.1;
  g.beginPath(); g.moveTo(10.2, 32.6); g.lineTo(3.4, 47.6); g.stroke();
  g.strokeStyle = 'rgba(232,170,150,0.7)'; g.lineWidth = 0.45;
  g.beginPath(); g.moveTo(10.0, 32.8); g.lineTo(3.3, 47.4); g.stroke();
  g.fillStyle = lin(g, 3, 37, 10, 43, [[0, '#9aa1aa'], [0.5, '#5b626b'], [1, '#2b3036']]);
  g.beginPath();
  g.moveTo(3.4, 38.2); g.lineTo(6.2, 36.8); g.lineTo(10, 38); g.lineTo(10.4, 41.4); g.lineTo(7.6, 43.2); g.lineTo(4, 42.2);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.3; g.stroke();
  g.fillStyle = '#111316'; g.beginPath(); g.arc(6.9, 40, 2.0, 0, Math.PI * 2); g.fill();
  g.fillStyle = rad(g, 6.9, 40, 0, 1.7, [[0, '#ffd2c4'], [0.3, '#ff4a3a'], [1, '#5a0c08']]);
  g.beginPath(); g.arc(6.9, 40, 1.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#d0d4da';
  for (const [x, y] of [[4.4, 38.6], [9.4, 38.6], [8.0, 42.4]]) { g.beginPath(); g.arc(x, y, 0.32, 0, Math.PI * 2); g.fill(); }

  // ---- knit cap with the feather tucked under its cuff
  feather(g, 9.4, 32, 17, -0.72, 3.0, true);
  feather(g, 10.4, 32.4, 12, -0.5, 2.0, false);
  g.fillStyle = lin(g, -12, 0, 13, 0, [[0, '#17181b'], [0.6, '#26282c'], [1, '#33363b']]);
  g.beginPath();
  g.moveTo(-12.2, 35);
  g.quadraticCurveTo(-13, 22, 0.6, 19.6);
  g.quadraticCurveTo(13.6, 20, 13.6, 35);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.35;
  for (let x = -9; x <= 11; x += 2.4) { g.beginPath(); g.moveTo(x, 22.5); g.quadraticCurveTo(x * 1.05, 28, x * 1.08, 30); g.stroke(); }
  g.fillStyle = lin(g, 0, 29, 0, 35, [[0, '#2e3035'], [1, '#1c1d20']]);
  g.beginPath(); g.moveTo(-12.6, 29.6); g.quadraticCurveTo(0.6, 27.6, 14, 29.6); g.lineTo(14, 35); g.quadraticCurveTo(0.6, 33.4, -12.6, 35.2); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.45;
  for (let x = -11.6; x < 13.6; x += 1.3) { g.beginPath(); g.moveTo(x, 29.4 - Math.cos(x / 9) * 0.6); g.lineTo(x, 34.6 - Math.cos(x / 9) * 0.6); g.stroke(); }
  g.fillStyle = 'rgba(255,214,170,0.12)';
  g.beginPath(); g.ellipse(6, 23, 5, 2, 0.3, 0, Math.PI * 2); g.fill();

  // ---- cigarette, in the corner of the mouth
  g.save(); g.translate(4.6, 51.4); g.rotate(0.22);
  g.fillStyle = '#e8e2d4'; g.fillRect(0, -0.5, 6.4, 1.0);
  g.fillStyle = '#c08a52'; g.fillRect(0, -0.5, 1.4, 1.0);
  g.fillStyle = '#6a6460'; g.fillRect(6.4, -0.5, 0.8, 1.0);
  g.fillStyle = rad(g, 7.3, 0, 0, 2.2, [[0, 'rgba(255,170,90,0.95)'], [0.4, 'rgba(255,90,40,0.5)'], [1, 'rgba(255,90,40,0)']]);
  g.beginPath(); g.arc(7.3, 0, 2.2, 0, Math.PI * 2); g.fill();
  g.restore();
  g.restore();   // head scale
}

// smoke drawn on the scene, not his layer, so it can drift above his head
function smoke(g) {
  g.save();
  g.lineCap = 'round';
  const r = rng(0x5e0c);
  for (let k = 0; k < 3; k++) {
    g.strokeStyle = `rgba(200,205,212,${0.10 - k * 0.025})`;
    g.lineWidth = 1.2 + k * 1.4;
    g.beginPath();
    let x = 11.6, y = 52.6;
    g.moveTo(x, y);
    for (let i = 0; i < 9; i++) {
      const nx = x + (r() - 0.35) * 5 + k, ny = y - 5 - r() * 2;
      g.quadraticCurveTo(x + (r() - 0.5) * 6, (y + ny) / 2, nx, ny);
      x = nx; y = ny;
    }
    g.stroke();
  }
  g.restore();
}

function gloves(g) {
  g.save();
  // forearms laid on the counter, hands folded in the middle
  for (const side of [-1, 1]) {
    g.fillStyle = lin(g, 0, COUNTER - 8, 0, COUNTER, [[0, side < 0 ? '#2a261f' : '#3a352b'], [1, '#1a1814']]);
    g.beginPath();
    g.moveTo(side * 40, COUNTER - 9);
    g.quadraticCurveTo(side * 22, COUNTER - 9.6, side * 6, COUNTER - 6);
    g.lineTo(side * 6, COUNTER - 0.6);
    g.lineTo(side * 40, COUNTER - 0.6);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,214,170,0.07)'; g.fillRect(side > 0 ? 8 : -38, COUNTER - 9.2, 30, 0.6);
    // cuff
    g.fillStyle = '#4a3a2a';
    g.fillRect(side > 0 ? 6 : -11, COUNTER - 6.4, 5, 5.8);
  }
  // left fist under, right hand over it: fingerless gloves, bare knuckles
  g.translate(1, COUNTER - 1); g.scale(1.4, 1.4); g.translate(-1, -(COUNTER - 1));
  g.fillStyle = lin(g, 0, COUNTER - 7, 0, COUNTER, [[0, '#3a2e24'], [1, '#1e1812']]);
  rrect(g, -7, COUNTER - 7, 9, 6.6, 2.4); g.fill();
  g.fillStyle = lin(g, 0, COUNTER - 8, 0, COUNTER, [[0, SKIN_L], [1, SKIN_D]]);
  rrect(g, -2.6, COUNTER - 8.4, 9.4, 4.4, 1.8); g.fill();
  g.strokeStyle = 'rgba(70,40,26,0.6)'; g.lineWidth = 0.3;
  for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-2.6 + i * 2.35, COUNTER - 8.2); g.lineTo(-2.4 + i * 2.35, COUNTER - 4.2); g.stroke(); }
  g.fillStyle = '#2a221a';
  rrect(g, -1, COUNTER - 5, 9, 4.6, 1.6); g.fill();
  // a hex nut turned over in his fingers — the only currency he takes
  g.fillStyle = '#9aa0a8';
  g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3; g.lineTo(9.6 + Math.cos(a) * 1.6, COUNTER - 6.4 + Math.sin(a) * 1.6); } g.closePath(); g.fill();
  g.fillStyle = '#1a1c1f'; g.beginPath(); g.arc(9.6, COUNTER - 6.4, 0.6, 0, Math.PI * 2); g.fill();
  g.restore();
}

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
  // stencil
  g.fillStyle = 'rgba(214,206,186,0.32)';
  g.font = '700 8px Rajdhani, "Arial Narrow", sans-serif';
  g.fillText('SCRAP ONLY', -22, 121);
  // legs' shadow
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x0, FLOOR - 1, x1 - x0, 1.5);
}

function counterGoods(g) {
  // the rifle he is selling, laid across the mat under his right hand
  rifle(g, 20, COUNTER - 4.4, 38, '#454c55', true);
  // scrap: a heap of nuts, bolts and gears
  const r = rng(0x5c4a);
  for (let i = 0; i < 26; i++) {
    const x = -46 + r() * 22, y = COUNTER - 1.6 - r() * 3.2 * (1 - Math.abs(x + 35) / 12);
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

// ------------------------------------------------------------- scene
export function paintTraderScene(g, w, h) {
  g.clearRect(0, 0, w, h);
  const u = h / 140;
  const halfW = w / 2 / u;
  g.save();
  g.translate(w / 2, 0);
  g.scale(u, u);

  container(g, halfW);
  // door only where the banner is wide enough to show it beside the racks
  const doorX = Math.max(120, halfW - 34);
  if (halfW > 128) doorway(g, doorX, halfW);
  wallStock(g, -1);
  wallStock(g, 1);
  if (halfW > 150) { neonSign(g, -halfW + 10, 22); floorStock(g, -halfW + 12); }
  else neonSign(g, -26, -40);        // too narrow for the sign: keep it off-frame

  pendantLight(g, 34, 22);

  // CROW in his own layer: the neon cuts a red rim down his left edge and the
  // pendant a warm one along his hood, both from his own silhouette
  // layer resolution follows the device pixel scale, not CSS pixels, or he
  // comes out soft on a 2x screen
  const px = u * Math.abs(g.getTransform().a / u);
  const L = document.createElement('canvas');
  L.width = Math.ceil(90 * px); L.height = Math.ceil((COUNTER + 8) * px);
  const lg = L.getContext('2d');
  lg.scale(px, px); lg.translate(45, 0);
  crow(lg);
  const rimLayer = (col, dx, dy, a, fromLeft) => {
    const R = document.createElement('canvas'); R.width = L.width; R.height = L.height;
    const rc = R.getContext('2d');
    rc.drawImage(L, 0, 0);
    rc.globalCompositeOperation = 'source-in';
    rc.fillStyle = lin(rc, 0, 0, R.width, 0, fromLeft
      ? [[0, rgba(col, a)], [0.45, rgba(col, 0)], [1, rgba(col, 0)]]
      : [[0, rgba(col, 0)], [0.5, rgba(col, 0)], [1, rgba(col, a)]]);
    rc.fillRect(0, 0, R.width, R.height);
    g.drawImage(R, -45 + dx, dy, 90, COUNTER + 8);
  };
  rimLayer(NEON, -0.6, 0, 0.42, true);
  rimLayer(LAMP, 0.5, -0.4, 0.28, false);
  g.drawImage(L, -45, 0, 90, COUNTER + 8);

  counter(g, halfW);
  counterGoods(g);
  gloves(g);
  smoke(g);
  pendant(g, 34, 22);

  // grade: cool haze lifts the darks a touch, vignette holds the edges
  g.fillStyle = rgba(HAZE, 0.035); g.fillRect(-halfW, 0, halfW * 2, 140);
  g.restore();
  const vig = g.createRadialGradient(w / 2, h * 0.45, h * 0.3, w / 2, h * 0.5, w * 0.62);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.5)');
  g.fillStyle = vig; g.fillRect(0, 0, w, h);
}

// Bust, for any square use: the scene cropped onto CROW.
export function paintTrader(g, w, h) {
  const cv = document.createElement('canvas');
  const H = Math.round(h * 1.5);
  cv.width = Math.round(H * 2.6); cv.height = H;
  paintTraderScene(cv.getContext('2d'), cv.width, cv.height);
  const sw = cv.height * (w / h) * 0.7, sh = cv.height * 0.7;
  g.clearRect(0, 0, w, h);
  g.drawImage(cv, cv.width / 2 - sw / 2, cv.height * 0.08, sw, sh, 0, 0, w, h);
}

export function renderTraderPortrait(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 120, h = cv.clientHeight || 120;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  paintTrader(cv.getContext('2d'), cv.width, cv.height);
}

// HiDPI-aware convenience for the wide banner.
export function renderTraderScene(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 640, h = cv.clientHeight || 220;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  paintTraderScene(g, w, h);
}
