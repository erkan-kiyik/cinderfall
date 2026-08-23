// CROW — the scrap trader's portrait.
//
// Painted rather than shipped as an image, for the same reason as every other
// asset in this game: it stays crisp at any DPR, costs no download, and can be
// re-lit by changing two numbers instead of re-exporting a PNG.
//
// Design brief. CROW is the fence on the safe side of Sector 9's line — the
// person an operator hands salvage to. They should read as *somebody you would
// not cross and would not recognise in daylight*: hooded, face behind a
// respirator and a scratched welding lens, lit from below by the burn barrel
// they work beside. The silhouette does the work — hood, shoulders, the hard
// diagonal of a loaded strap — because the portrait is shown at ~120px on a
// phone and any facial detail would be mud at that size.
//
// Lighting is the same key/fill the weapon and operator art uses: warm amber
// from the lower left (the fire), thin cold rim from the upper right (the
// sector's sodium haze), so the trader sits in the same world as everything
// else on screen.

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.min(255, Math.max(0, Math.round(r * k)));
  g = Math.min(255, Math.max(0, Math.round(g * k)));
  b = Math.min(255, Math.max(0, Math.round(b * k)));
  return `rgb(${r},${g},${b})`;
}

// Deterministic wear, so CROW looks identical every time the panel repaints
// instead of shimmering new scratches on each render.
function withA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const CANVAS = '#2a2721';   // hood fabric
const LEATHER = '#3a3128';  // shoulders / strap
const STEEL = '#7f8189';    // respirator hardware
const EMBER = '#ff8a3c';    // burn-barrel key light
const HAZE = '#7fb6d6';     // sodium-haze rim

// Paints a head-and-shoulders bust filling `w`×`h`. Composition is normalised
// to a 100×100 box and scaled, so the same painter serves the 120px panel
// portrait and any larger use without re-tuning coordinates.
export function paintTrader(g, w, h) {
  g.clearRect(0, 0, w, h);
  const s = Math.min(w, h) / 100;
  const rnd = rng(0xc0b1d3);   // fixed seed: same wear on every repaint
  g.save();
  g.translate(w / 2, h);
  g.scale(s, s);
  // work in a 100-tall box: y=0 at the top, y=100 at the bottom, x centred
  g.translate(0, -100);

  // ---- backdrop: the burn barrel he works beside, blown out to a warm
  // gradient rising from the lower left. Nothing else lights this portrait.
  const bg = g.createRadialGradient(-26, 92, 3, -6, 62, 82);
  bg.addColorStop(0, 'rgba(255,152,62,0.60)');
  bg.addColorStop(0.32, 'rgba(146,60,24,0.28)');
  bg.addColorStop(1, 'rgba(10,10,12,0)');
  g.fillStyle = bg;
  g.fillRect(-60, 0, 120, 100);

  // ---- ONE silhouette: hood and shoulders are the same cloak, so they are
  // the same path. Drawing them separately is what makes a hooded figure read
  // as a helmet sitting on a lump. The crown leans a few degrees off centre so
  // the shape is a person rather than an icon.
  const cloak = () => {
    g.beginPath();
    g.moveTo(-62, 100);
    g.bezierCurveTo(-60, 84, -44, 72, -28, 60);   // left shoulder, cropped by the frame
    g.bezierCurveTo(-26, 36, -15, 15, 3, 14);     // up the left side of the hood
    g.bezierCurveTo(21, 13, 31, 34, 29, 56);      // over the crown, down the right
    g.bezierCurveTo(44, 70, 56, 84, 58, 100);     // right shoulder, also cropped
    g.closePath();
  };

  const cloakFill = g.createLinearGradient(-30, 20, 34, 100);
  cloakFill.addColorStop(0, shade(CANVAS, 1.15));
  cloakFill.addColorStop(0.42, shade(CANVAS, 0.82));
  cloakFill.addColorStop(1, shade(CANVAS, 0.34));
  g.fillStyle = cloakFill;
  cloak(); g.fill();

  // everything textural is clipped to the cloak so nothing breaks silhouette
  g.save();
  cloak(); g.clip();

  // warm bounce off the barrel — low and to the left only, so the cloak keeps
  // its dark upper mass instead of going tan all over
  const bounce = g.createLinearGradient(-44, 100, -2, 52);
  bounce.addColorStop(0, 'rgba(255,142,62,0.34)');
  bounce.addColorStop(0.5, 'rgba(255,142,62,0.07)');
  bounce.addColorStop(1, 'rgba(255,142,62,0)');
  g.fillStyle = bounce;
  g.fillRect(-64, 10, 128, 90);

  // deep shadow under the hood's overhang and inside the right shoulder
  const shadow = g.createLinearGradient(0, 46, 0, 84);
  shadow.addColorStop(0, 'rgba(6,7,9,0)');
  shadow.addColorStop(0.34, 'rgba(6,7,9,0.55)');
  shadow.addColorStop(1, 'rgba(6,7,9,0)');
  g.fillStyle = shadow;
  g.fillRect(-70, 40, 140, 50);

  // fabric folds: long, few, following the drape rather than scattered
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(0,0,0,0.34)';
  g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(-30, 62); g.bezierCurveTo(-40, 76, -50, 88, -53, 100); g.stroke();
  g.beginPath(); g.moveTo(30, 60); g.bezierCurveTo(40, 74, 50, 88, 52, 100); g.stroke();
  g.beginPath(); g.moveTo(-19, 24); g.bezierCurveTo(-24, 34, -25, 44, -24, 54); g.stroke();
  g.strokeStyle = 'rgba(255,206,152,0.10)';
  g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(-27, 62); g.bezierCurveTo(-37, 76, -47, 88, -50, 100); g.stroke();
  g.beginPath(); g.moveTo(-16, 25); g.bezierCurveTo(-21, 35, -22, 45, -21, 55); g.stroke();

  // ---- bandolier of salvage tags across the chest. The one prop that says
  // "trader" instead of "soldier", so it gets real plates rather than a
  // painted stripe. Rectangles, wider than tall — a rotated square reads as a
  // rhombus and the whole run turns into a zip.
  g.strokeStyle = shade(LEATHER, 0.42);
  g.lineWidth = 6.4;
  g.beginPath(); g.moveTo(-36, 100); g.lineTo(15, 70); g.stroke();
  g.strokeStyle = 'rgba(255,180,110,0.10)';
  g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(-38, 100); g.lineTo(13, 70); g.stroke();
  for (let i = 0; i < 5; i++) {
    const tt = 0.08 + i * 0.2;
    const px = -36 + 51 * tt, py = 100 - 30 * tt;
    const pw = 7.4 + rnd() * 2, ph = 3.4 + rnd() * 1.1;
    g.save();
    g.translate(px, py);
    g.rotate(-0.59 + (rnd() - 0.5) * 0.3);   // along the strap, slightly loose
    const pg = g.createLinearGradient(0, -ph / 2, 0, ph / 2);
    pg.addColorStop(0, shade(STEEL, 0.72));
    pg.addColorStop(1, shade(STEEL, 0.26));
    g.fillStyle = pg;
    g.beginPath();
    g.moveTo(-pw / 2, -ph / 2); g.lineTo(pw / 2, -ph / 2 + 0.5);
    g.lineTo(pw / 2 - 0.8, ph / 2); g.lineTo(-pw / 2, ph / 2 - 0.4);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(10,11,13,0.75)'; g.lineWidth = 0.9; g.stroke();
    g.restore();
  }

  // ---- the hood opening. Painted as flat black *inside* the cloak clip, and
  // nothing lit is allowed over it afterwards: the face never resolving is the
  // whole character.
  const opening = () => {
    g.beginPath();
    g.moveTo(-13.2, 35);
    g.bezierCurveTo(-12.8, 24, -7, 20.5, 1.4, 20.5);
    g.bezierCurveTo(9.8, 20.5, 15, 25, 15, 36);
    g.bezierCurveTo(15.2, 50, 11, 60, 1, 60.5);
    g.bezierCurveTo(-9, 60, -13.6, 49, -13.2, 35);
    g.closePath();
  };
  g.fillStyle = '#07080a';
  opening(); g.fill();

  // rolled fabric edge around the opening, catching a sliver of the fire so
  // the hole reads as a hood rather than a cut-out
  g.strokeStyle = 'rgba(255,168,96,0.13)';
  g.lineWidth = 2.4;
  opening(); g.stroke();
  g.strokeStyle = 'rgba(6,7,9,0.9)';
  g.lineWidth = 1.2;
  opening(); g.stroke();

  // ---- what is inside: a respirator and a welding lens, nothing else
  g.save();
  opening(); g.clip();

  // respirator: a blunt dark muzzle. At 96px a filter grille is mud, so the
  // shape carries it and the detail is one highlight and one ember-lit port.
  const mask = g.createLinearGradient(-9, 44, 8, 60);
  mask.addColorStop(0, shade(STEEL, 0.26));
  mask.addColorStop(1, shade(STEEL, 0.10));
  g.fillStyle = mask;
  g.beginPath();
  g.moveTo(-8.2, 45.5); g.lineTo(8.8, 45);
  g.bezierCurveTo(9.4, 55, 4.6, 60.5, 0.4, 60.5);
  g.bezierCurveTo(-3.8, 60.5, -8.8, 54, -8.2, 45.5);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(4,5,7,0.9)'; g.lineWidth = 1.5; g.stroke();
  // top edge highlight — the only thing that separates mask from shadow
  g.strokeStyle = 'rgba(226,214,196,0.14)'; g.lineWidth = 1.0;
  g.beginPath(); g.moveTo(-7.4, 45.9); g.lineTo(7.9, 45.4); g.stroke();
  // exhale port, lit by the barrel
  g.fillStyle = 'rgba(255,142,62,0.42)';
  g.beginPath(); g.ellipse(-5.4, 52.5, 2.0, 1.6, 0, 0, Math.PI * 2); g.fill();

  // welding lens: one wide amber band, scratched, tilted with the head. The
  // only bright thing in the hood, so it is where the eye lands.
  g.save();
  g.translate(0.6, 36);
  g.rotate(-0.045);
  const lens = g.createLinearGradient(-13, -5, 12, 5);
  lens.addColorStop(0, 'rgba(180,84,26,0.55)');
  lens.addColorStop(0.42, 'rgba(255,196,110,0.92)');
  lens.addColorStop(1, 'rgba(150,64,20,0.5)');
  g.fillStyle = lens;
  g.beginPath();
  g.moveTo(-13.4, -4.6); g.lineTo(13.4, -4.6);
  g.lineTo(12.2, 4.4); g.lineTo(-12.2, 4.4);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(4,5,7,0.92)'; g.lineWidth = 1.7; g.stroke();
  g.save();
  g.beginPath();
  g.moveTo(-13.4, -4.6); g.lineTo(13.4, -4.6); g.lineTo(12.2, 4.4); g.lineTo(-12.2, 4.4);
  g.closePath(); g.clip();
  g.strokeStyle = 'rgba(255,244,220,0.28)'; g.lineWidth = 0.8;
  for (let i = 0; i < 4; i++) {
    const y = -3.4 + rnd() * 6.6;
    g.beginPath();
    g.moveTo(-12 + rnd() * 5, y);
    g.lineTo(-2 + rnd() * 13, y + (rnd() - 0.5) * 1.4);
    g.stroke();
  }
  // two eye glints behind the glass: enough to feel watched, not enough to
  // resolve a face
  g.fillStyle = 'rgba(255,242,212,0.72)';
  g.beginPath(); g.ellipse(-5.6, 0.4, 2.0, 0.85, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(4.8, 0.1, 2.0, 0.85, 0, 0, Math.PI * 2); g.fill();
  g.restore();
  g.restore();
  g.restore();   // end opening clip

  // lens bloom: spills onto the hood but stays inside the cloak
  g.save();
  g.globalCompositeOperation = 'lighter';
  const bloom = g.createRadialGradient(0.6, 36, 1, 0.6, 36, 20);
  bloom.addColorStop(0, 'rgba(255,166,76,0.30)');
  bloom.addColorStop(1, 'rgba(255,166,76,0)');
  g.fillStyle = bloom;
  g.beginPath(); g.arc(0.6, 36, 20, 0, Math.PI * 2); g.fill();
  g.restore();

  // ---- rim light, last inside the clip: warm along the left edge where the
  // fire is, cold down the right from the sector's sodium haze. Built as four
  // concentric strokes of the silhouette rather than filled polygons — a
  // polygon's inner boundary shows as a seam under `lighter`, a stroke clipped
  // to its own shape falls off naturally.
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineJoin = 'round';
  const rim = (width, alpha) => {
    const grad = g.createLinearGradient(-40, 60, 40, 40);
    grad.addColorStop(0, withA(EMBER, alpha));
    grad.addColorStop(0.4, 'rgba(0,0,0,0)');
    grad.addColorStop(0.62, 'rgba(0,0,0,0)');
    grad.addColorStop(1, withA(HAZE, alpha * 0.9));
    g.strokeStyle = grad;
    g.lineWidth = width;
    cloak(); g.stroke();
  };
  rim(13, 0.07); rim(8, 0.09); rim(4.5, 0.12); rim(2, 0.20);
  g.restore();

  g.restore();   // end cloak clip

  // ---- outline last, so nothing softens the read
  g.strokeStyle = '#08090b';
  g.lineWidth = 2.4;
  g.lineJoin = 'round';
  cloak(); g.stroke();

  g.restore();
}

// HiDPI-aware convenience: paint straight into a <canvas> element sized by CSS.
export function renderTraderPortrait(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 120, h = cv.clientHeight || 120;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  paintTrader(g, w, h);
}

// ---------------------------------------------------------------------------
// The stall — CROW's corner of the sector, wide banner for the trader panel
// ---------------------------------------------------------------------------
// The bust portrait above says who CROW is; this says where he does business.
// Two lean-to stalls flank him — poles, a tattered awning, salvage strung up
// to show what he deals in — receding slightly into the haze so he stays the
// thing the eye lands on. He is the same figure paintTrader already draws
// (composited in from an offscreen pass rather than redrawn, so the two
// never drift apart), just standing at his own counter instead of alone.
//
// Same two-light rule as his portrait: warm ember low or the fire, cool haze
// high off the sodium lamps, nothing else lit. A market only reads as HIS
// market if it is lit by the same fire he is.

const WOOD = '#3c2f22';      // stall timber
const CANVAS_AWN = '#463a2c'; // awning canvas, unlit
const RUST = '#6b4226';       // hung scrap / canisters

function shadeA(hex, k, a) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.min(255, Math.max(0, Math.round(r * k)));
  g = Math.min(255, Math.max(0, Math.round(g * k)));
  b = Math.min(255, Math.max(0, Math.round(b * k)));
  return `rgba(${r},${g},${b},${a})`;
}

// One lean-to stall: two raked poles, a sagging canvas roof, a counter
// plank, and a handful of things hung off the crossbeam. `flip` mirrors it
// for the right-hand side; `depth` (0..1) pushes it back into the haze —
// smaller, flatter light, less detail — so it reads as background rather
// than competing with CROW.
function stall(g, u, flip, depth, seed) {
  const rnd = rng(seed);
  const s = 1 - depth * 0.32;
  const haze = depth * 0.5;
  g.save();
  g.scale(flip, 1);
  g.scale(s, s);
  g.translate(0, -depth * 6 * u);

  const poleH = 46 * u, poleW = 2.6 * u, spread = 34 * u;
  const wood = shadeA(WOOD, 1 - haze * 0.5, 1 - haze * 0.35);
  g.fillStyle = wood;
  g.fillRect(-spread / 2 - poleW / 2, -poleH, poleW, poleH);
  g.fillRect(spread / 2 - poleW / 2, -poleH, poleW, poleH);
  // crossbeam
  g.fillRect(-spread / 2 - poleW, -poleH - 2 * u, spread + poleW * 2, 3 * u);

  // sagging canvas awning, front edge lower than the back so it reads as
  // cloth rather than a rigid roof
  g.fillStyle = shadeA(CANVAS_AWN, 1 - haze * 0.4, 0.94 - haze * 0.4);
  g.beginPath();
  g.moveTo(-spread / 2 - 6 * u, -poleH - 2 * u);
  g.quadraticCurveTo(0, -poleH + 8 * u, spread / 2 + 6 * u, -poleH - 2 * u);
  g.lineTo(spread / 2 + 2 * u, -poleH - 12 * u);
  g.quadraticCurveTo(0, -poleH - 20 * u, -spread / 2 - 2 * u, -poleH - 12 * u);
  g.closePath(); g.fill();
  // awning stripe, torn edge
  g.strokeStyle = shadeA('#000000', 1, 0.25 - haze * 0.15);
  g.lineWidth = u;
  g.beginPath();
  for (let x = -spread / 2; x <= spread / 2; x += 6 * u) {
    g.moveTo(x, -poleH - 16 * u); g.lineTo(x + 3 * u, -poleH - 6 * u);
  }
  g.stroke();

  // hung goods: strung along the crossbeam, silhouetted — canisters, coiled
  // wire, a couple of scrap plates. Just enough shape variety to read as
  // "salvage for sale" without individually resolving at banner scale.
  const hangY = -poleH + 2 * u;
  for (let i = 0; i < 4; i++) {
    const hx = -spread / 2 + 6 * u + i * ((spread - 12 * u) / 3);
    const hh = (6 + rnd() * 5) * u;
    g.fillStyle = shadeA(RUST, 1 - haze * 0.5, 0.85 - haze * 0.4);
    g.strokeStyle = shadeA('#000000', 1, 0.5);
    g.lineWidth = 0.5 * u;
    g.beginPath(); g.moveTo(hx, hangY); g.lineTo(hx, hangY + hh * 0.3); g.stroke();
    if (i % 2 === 0) {
      g.beginPath(); g.arc(hx, hangY + hh * 0.55, hh * 0.28, 0, Math.PI * 2); g.fill(); g.stroke();
    } else {
      g.fillRect(hx - hh * 0.18, hangY + hh * 0.32, hh * 0.36, hh * 0.5);
      g.strokeRect(hx - hh * 0.18, hangY + hh * 0.32, hh * 0.36, hh * 0.5);
    }
  }

  // counter plank across the front poles, waist height
  g.fillStyle = shadeA(WOOD, 1.15 - haze * 0.4, 1 - haze * 0.35);
  g.fillRect(-spread / 2 - 3 * u, -20 * u, spread + 6 * u, 3 * u);
  // a couple of crates stacked under the counter
  g.fillStyle = shadeA(WOOD, 0.85 - haze * 0.4, 0.9 - haze * 0.4);
  g.fillRect(-spread / 2, -13 * u, 10 * u, 13 * u);
  g.fillRect(-spread / 2 + 11 * u, -9 * u, 8 * u, 9 * u);

  g.restore();
}

// Paints the wide trader-panel banner into a `w`×`h` box: two stalls flanking
// CROW at his own counter, lit by the same fire his portrait uses.
export function paintTraderScene(g, w, h) {
  g.clearRect(0, 0, w, h);
  const u = h / 140;   // reference scale: composition designed at ~140 units tall
  const groundY = h * 0.90;

  // ---- back wall: dark and fairly flat, so silhouettes read against it
  // instead of dissolving into a haze. What warmth there is stays low and
  // narrow, behind CROW specifically — it is his fire, not ambient light.
  g.fillStyle = '#0d0e12';
  g.fillRect(0, 0, w, groundY);
  const wall = g.createLinearGradient(0, 0, 0, groundY);
  wall.addColorStop(0, 'rgba(20,17,15,0)');
  wall.addColorStop(1, 'rgba(46,32,20,0.5)');
  g.fillStyle = wall;
  g.fillRect(0, 0, w, groundY);
  const glow = g.createRadialGradient(w * 0.58, groundY, 2 * u, w * 0.58, groundY, w * 0.24);
  glow.addColorStop(0, 'rgba(255,140,60,0.30)');
  glow.addColorStop(1, 'rgba(255,140,60,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, w, groundY);

  // ---- ground: a street edge (one hard line, the game's own convention for
  // "this is the floor") then a darker band toward camera
  g.fillStyle = '#0a0908';
  g.fillRect(0, groundY, w, h - groundY);
  g.strokeStyle = 'rgba(255,180,120,0.14)';
  g.lineWidth = Math.max(1, 0.7 * u);
  g.beginPath(); g.moveTo(0, groundY); g.lineTo(w, groundY); g.stroke();
  g.fillStyle = 'rgba(255,150,70,0.08)';
  g.beginPath(); g.ellipse(w * 0.58, groundY, w * 0.22, 3 * u, 0, 0, Math.PI * 2); g.fill();

  // ---- background stalls, pushed back and to the sides — clearly smaller
  // and flatter than CROW's own, so the eye has somewhere to land besides him
  g.save(); g.translate(w * 0.15, groundY); stall(g, u * 0.86, 1, 0.6, 0x5a11); g.restore();
  g.save(); g.translate(w * 0.88, groundY); stall(g, u * 0.86, -1, 0.55, 0x5a29); g.restore();

  // ---- CROW's own counter, front and centre-left so his standing spot and
  // the goods on it stay clear of his own silhouette
  g.save(); g.translate(w * 0.40, groundY); stall(g, u, 1, 0, 0x5a37); g.restore();

  // scrap plates laid out on the near counter
  g.save();
  g.translate(w * 0.365, groundY - 20.2 * u);
  for (let i = 0; i < 3; i++) {
    const px = i * 6 * u, py = -Math.sin(i * 1.3) * 0.6 * u;
    g.save();
    g.translate(px, py);
    g.rotate((i - 1) * 0.22);
    const pg = g.createLinearGradient(-2.6 * u, -1.8 * u, 2.6 * u, 1.8 * u);
    pg.addColorStop(0, shade('#8e9099', 1.25));
    pg.addColorStop(1, shade('#8e9099', 0.5));
    g.fillStyle = pg;
    g.fillRect(-2.6 * u, -1.8 * u, 5.2 * u, 3.6 * u);
    g.strokeStyle = 'rgba(8,9,11,0.85)'; g.lineWidth = 0.4 * u;
    g.strokeRect(-2.6 * u, -1.8 * u, 5.2 * u, 3.6 * u);
    g.restore();
  }
  g.restore();

  // ---- CROW himself, composited from his own portrait painter so the two
  // never fall out of sync. Sized to read as the tallest thing in frame
  // without crowding the stalls either side of him, and clamped so his hood
  // always has headroom regardless of the box's aspect ratio.
  const figH = Math.min(64 * u, groundY * 0.94), figW = figH;
  const off = document.createElement('canvas');
  off.width = figW; off.height = figH;
  paintTrader(off.getContext('2d'), figW, figH);
  g.drawImage(off, w * 0.58 - figW / 2, groundY - figH, figW, figH);

  // ---- foreground vignette: darkens the bottom corners so the ground
  // doesn't compete with the item cards sitting just below the panel
  const vig = g.createLinearGradient(0, h * 0.75, 0, h);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.30)');
  g.fillStyle = vig;
  g.fillRect(0, 0, w, h);
  // edge falloff so the banner reads as a scene, not a rectangle of content
  const edge = g.createLinearGradient(0, 0, w, 0);
  edge.addColorStop(0, 'rgba(0,0,0,0.35)');
  edge.addColorStop(0.12, 'rgba(0,0,0,0)');
  edge.addColorStop(0.88, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(0,0,0,0.35)');
  g.fillStyle = edge;
  g.fillRect(0, 0, w, h);
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
