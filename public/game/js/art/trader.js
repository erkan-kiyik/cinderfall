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

// The stall is drawn in two passes with CROW composited between them, so he
// is genuinely *behind* his counter: the plank and the crates stacked under
// it occlude his lower body, which is what sells him as sitting at it rather
// than standing in front of a painted backdrop.
//
// Geometry is shared between the two passes so they cannot drift apart.
// Sized so the stall FRAMES CROW rather than perching on him: the uprights
// have to stand outside his shoulders and the awning has to clear his hood by
// a real margin, or the whole thing reads as a hat. At these numbers his
// silhouette spans about 85% of the gap between the poles.
// Lamp position in stall units (see lanternFixture / lanternGlow).
const LAMP = { x: -26, y: -70 };

const STALL = {
  poleH: 92,     // pole height in `u`
  poleW: 3.4,
  spread: 96,    // distance between the two uprights
  counterY: -30, // top of the counter plank — crosses his chest, not his waist
};

// ---------------------------------------------------------------- backdrop
// The scene used to be one stall against a flat dark rectangle, which left the
// outer thirds of a 900px banner as literal nothing and gave the stall no
// world to stand in. This is that world: a shuttered sector frontage receding
// into haze. It is deliberately low-contrast and made of big shapes — at the
// 380px end of the banner's range it has to read as texture, not as detail,
// and it must never compete with CROW for the eye.
function backdrop(g, w, h, groundY, u) {
  // night sky / upper wall
  const sky = g.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, '#0e1016');
  sky.addColorStop(0.55, '#141119');
  sky.addColorStop(1, '#221a16');
  g.fillStyle = sky;
  g.fillRect(0, 0, w, groundY);

  // far tower silhouettes with a handful of lit windows, well back in the haze
  const rnd = rng(0x9e21);
  // Darker than the sky behind them, not lighter — at rgba(26,24,32) these
  // came out a shade *above* the sky value and the whole row read as a pale
  // lavender wall pasted across the middle of the banner.
  const farTop = groundY - 68 * u;
  g.fillStyle = 'rgba(9,9,14,0.92)';
  let x = -8 * u;
  while (x < w + 8 * u) {
    const bw = (14 + rnd() * 20) * u;
    const bh = (18 + rnd() * 40) * u;
    g.fillRect(x, farTop - bh + 20 * u, bw, bh + 60 * u);
    // a few windows, warm and dim
    for (let i = 0; i < 3; i++) {
      if (rnd() > 0.55) {
        g.fillStyle = `rgba(255,186,110,${0.035 + rnd() * 0.05})`;
        g.fillRect(x + (2 + rnd() * (bw / u - 6)) * u, farTop - bh + (24 + i * 7) * u, 2.2 * u, 3 * u);
        g.fillStyle = 'rgba(9,9,14,0.92)';
      }
    }
    x += bw + (3 + rnd() * 5) * u;
  }

  // near frontage: roller shutters and doorways, the wall the stall backs onto
  // Kept below CROW's shoulder line. At -46u its top edge ran straight through
  // his upper chest, and a hard horizontal landing across the subject is the
  // one place a backdrop edge must never sit.
  const wallTop = groundY - 34 * u;
  g.fillStyle = '#17130f';
  g.fillRect(0, wallTop, w, groundY - wallTop);
  // shutter bays, each a slightly different height so the run is not a stripe
  const bay = 30 * u;
  let bi = 0;
  for (let bx = -bay; bx < w + bay; bx += bay) {
    const jog = ((bi++ * 7919) % 5) * 1.1 * u;
    g.fillStyle = 'rgba(9,8,7,0.6)';
    g.fillRect(bx + 3 * u, wallTop + 8 * u + jog, bay - 8 * u, groundY - wallTop - 8 * u - jog);
    // corrugation
    g.strokeStyle = 'rgba(255,220,180,0.030)';
    g.lineWidth = Math.max(0.6, 0.5 * u);
    for (let rx = bx + 5 * u; rx < bx + bay - 6 * u; rx += 2.4 * u) {
      g.beginPath(); g.moveTo(rx, wallTop + 9 * u + jog); g.lineTo(rx, groundY - 1 * u); g.stroke();
    }
    // lintel
    g.fillStyle = 'rgba(255,210,160,0.05)';
    g.fillRect(bx + 2 * u, wallTop + 5 * u + jog, bay - 6 * u, 1.4 * u);
  }
  // service pipe running the length of the frontage, and its shadow
  g.fillStyle = 'rgba(8,8,10,0.55)';
  g.fillRect(0, wallTop + 1.4 * u, w, 2.6 * u);
  g.fillStyle = 'rgba(255,214,170,0.055)';
  g.fillRect(0, wallTop + 1.4 * u, w, 0.8 * u);
  for (let bx = 6 * u; bx < w; bx += 34 * u) {
    g.fillStyle = 'rgba(6,6,8,0.6)';
    g.fillRect(bx, wallTop + 0.6 * u, 2.2 * u, 4.4 * u);
  }

  // slack cable strung across the frontage — one sagging curve, reads instantly
  // as an inhabited back-street and costs a single path
  g.strokeStyle = 'rgba(6,6,9,0.75)';
  g.lineWidth = Math.max(1, 0.7 * u);
  g.beginPath();
  g.moveTo(-4 * u, wallTop - 14 * u);
  g.quadraticCurveTo(w * 0.5, wallTop - 2 * u, w + 4 * u, wallTop - 18 * u);
  g.stroke();

  // atmospheric haze: the sector's sodium light hanging in the air, thickest
  // just above the street so everything below the wall line softens
  const haze = g.createLinearGradient(0, wallTop - 16 * u, 0, groundY);
  haze.addColorStop(0, withA(HAZE, 0));
  haze.addColorStop(0.65, withA(HAZE, 0.05));
  haze.addColorStop(1, withA(HAZE, 0.10));
  g.fillStyle = haze;
  g.fillRect(0, wallTop - 16 * u, w, groundY - wallTop + 16 * u);
}

// ---------------------------------------------------------------- lantern
// The warm light in this scene used to be a radial gradient with nothing
// making it — light with no lamp, which is the single fastest way to make a
// painted scene look unfinished. This is the lamp: a hooded bulb wired to the
// crossbeam, and it is what every warm value in the frame is now coming from.
// Drawn in stall-local coordinates.
function lanternGlow(g, u, x, y) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  // the throw
  const cone = g.createRadialGradient(x, y, 1 * u, x, y, 54 * u);
  cone.addColorStop(0, 'rgba(255,176,96,0.42)');
  cone.addColorStop(0.35, 'rgba(255,140,60,0.16)');
  cone.addColorStop(1, 'rgba(255,120,40,0)');
  g.fillStyle = cone;
  g.beginPath(); g.arc(x, y, 54 * u, 0, Math.PI * 2); g.fill();
  // the hot spot
  const core = g.createRadialGradient(x, y, 0, x, y, 7 * u);
  core.addColorStop(0, 'rgba(255,232,190,0.85)');
  core.addColorStop(1, 'rgba(255,170,90,0)');
  g.fillStyle = core;
  g.beginPath(); g.arc(x, y, 7 * u, 0, Math.PI * 2); g.fill();
  g.restore();
}

function lanternFixture(g, u, x, y, hangFrom) {
  // flex lead up to the crossbeam
  g.strokeStyle = 'rgba(8,8,10,0.9)';
  g.lineWidth = Math.max(1, 0.6 * u);
  g.beginPath();
  g.moveTo(x, hangFrom);
  g.quadraticCurveTo(x + 1.4 * u, (hangFrom + y) / 2, x, y - 4.6 * u);
  g.stroke();
  // conical tin shade
  g.fillStyle = shadeA(RUST, 0.85, 1);
  g.beginPath();
  g.moveTo(x - 6.4 * u, y - 1.6 * u);
  g.lineTo(x - 1.6 * u, y - 6.4 * u);
  g.lineTo(x + 1.6 * u, y - 6.4 * u);
  g.lineTo(x + 6.4 * u, y - 1.6 * u);
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,206,150,0.18)';
  g.beginPath();
  g.moveTo(x - 6.4 * u, y - 1.6 * u);
  g.lineTo(x - 1.6 * u, y - 6.4 * u);
  g.lineTo(x - 0.4 * u, y - 6.4 * u);
  g.lineTo(x - 4.6 * u, y - 1.6 * u);
  g.closePath(); g.fill();
  // bulb
  g.fillStyle = 'rgba(255,238,204,0.95)';
  g.beginPath(); g.ellipse(x, y, 1.9 * u, 2.3 * u, 0, 0, Math.PI * 2); g.fill();
}

// Back half: uprights, crossbeam, sagging awning, goods strung up to sell.
function stallBack(g, u, seed) {
  const rnd = rng(seed);
  const { poleH, poleW, spread } = STALL;
  const H = poleH * u, W = poleW * u, S = spread * u;

  g.fillStyle = shadeA(WOOD, 1, 1);
  g.fillRect(-S / 2 - W / 2, -H, W, H);
  g.fillRect(S / 2 - W / 2, -H, W, H);
  g.fillRect(-S / 2 - W, -H - 2 * u, S + W * 2, 3 * u);

  // sagging canvas awning, front edge lower than the back so it reads as
  // cloth rather than a rigid roof
  g.fillStyle = shadeA(CANVAS_AWN, 1, 0.94);
  g.beginPath();
  g.moveTo(-S / 2 - 6 * u, -H - 2 * u);
  g.quadraticCurveTo(0, -H + 9 * u, S / 2 + 6 * u, -H - 2 * u);
  g.lineTo(S / 2 + 2 * u, -H - 13 * u);
  g.quadraticCurveTo(0, -H - 21 * u, -S / 2 - 2 * u, -H - 13 * u);
  g.closePath(); g.fill();
  g.strokeStyle = shadeA('#000000', 1, 0.25);
  g.lineWidth = u;
  g.beginPath();
  for (let x = -S / 2; x <= S / 2; x += 6 * u) {
    g.moveTo(x, -H - 17 * u); g.lineTo(x + 3 * u, -H - 7 * u);
  }
  g.stroke();

  // Torn hem along the front edge of the canvas. A perfectly clean curve reads
  // as a printed sheet; the notches are what make it a tarp that has been up
  // through a few Sector 9 winters.
  g.fillStyle = 'rgba(9,9,12,0.55)';
  for (let x = -S / 2 - 4 * u; x < S / 2 + 4 * u; x += 5.5 * u) {
    const t = (x + S / 2) / S;                       // sag follows the curve
    const yEdge = -H - 2 * u + Math.sin(Math.PI * t) * 11 * u;
    const d = (1.2 + rnd() * 2.2) * u;
    g.beginPath();
    g.moveTo(x, yEdge - 0.5 * u);
    g.lineTo(x + 2.7 * u, yEdge - 0.5 * u);
    g.lineTo(x + 1.35 * u, yEdge + d);
    g.closePath(); g.fill();
  }

  // Hung goods along the crossbeam. These were alternating dots and squares,
  // which at banner size read as a string of beads rather than as stock. Each
  // one is now a nameable object — a gas canister, a coil of cable, a length
  // of chain, a salvaged helmet — because a market stall is only convincing
  // if you can tell what is for sale. Kept to the outer thirds so nothing
  // dangles in front of CROW's head.
  const hangY = -H + 2 * u;
  const goods = [
    { x: -0.38, kind: 'canister' },
    { x: -0.22, kind: 'coil' },
    { x: 0.24, kind: 'chain' },
    { x: 0.39, kind: 'helmet' },
  ];
  g.lineWidth = 0.5 * u;
  for (const it of goods) {
    const hx = it.x * S;
    const drop = (3 + rnd() * 2) * u;
    g.strokeStyle = shadeA('#000000', 1, 0.65);
    g.beginPath(); g.moveTo(hx, hangY); g.lineTo(hx, hangY + drop); g.stroke();
    const y = hangY + drop;
    g.fillStyle = shadeA(RUST, 1, 0.9);
    g.strokeStyle = shadeA('#000000', 1, 0.55);
    if (it.kind === 'canister') {
      rrPath(g, hx - 2.1 * u, y, 4.2 * u, 9 * u, 1.8 * u); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,196,132,0.16)';
      g.fillRect(hx - 1.5 * u, y + 1 * u, 1 * u, 6.6 * u);
      g.fillStyle = shadeA(STEEL, 0.55, 1);
      g.fillRect(hx - 0.9 * u, y - 1.4 * u, 1.8 * u, 1.6 * u);   // valve
    } else if (it.kind === 'coil') {
      g.strokeStyle = shadeA(STEEL, 0.42, 1);
      g.lineWidth = 0.9 * u;
      for (let r = 0; r < 3; r++) {
        g.beginPath();
        g.ellipse(hx, y + 3.4 * u + r * 1.5 * u, 3.4 * u - r * 0.4 * u, 1.5 * u, 0, 0, Math.PI * 2);
        g.stroke();
      }
      g.lineWidth = 0.5 * u;
    } else if (it.kind === 'chain') {
      g.strokeStyle = shadeA(STEEL, 0.5, 1);
      g.lineWidth = 0.8 * u;
      for (let l = 0; l < 5; l++) {
        g.beginPath();
        g.ellipse(hx, y + 1.4 * u + l * 2.2 * u, 1.3 * u, 1.2 * u, 0, 0, Math.PI * 2);
        g.stroke();
      }
      g.lineWidth = 0.5 * u;
    } else {
      // helmet, hung by its chin strap
      g.fillStyle = shadeA(CANVAS, 1.5, 1);
      g.beginPath(); g.arc(hx, y + 4 * u, 3.8 * u, Math.PI, 0); g.fill();
      g.fillRect(hx - 3.8 * u, y + 4 * u, 7.6 * u, 1.5 * u);
      g.fillStyle = 'rgba(255,196,132,0.14)';
      g.beginPath(); g.arc(hx - 0.8 * u, y + 4 * u, 2.6 * u, Math.PI, Math.PI * 1.55); g.fill();
    }
  }
}

// Local rounded-rect path helper (this module does not import paint.js).
function rrPath(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}

// Front half: the counter plank and what is stacked against it, all of which
// sits between CROW and the camera.
function stallFront(g, u) {
  const { spread, counterY } = STALL;
  const S = spread * u, cy = counterY * u;

  // counter plank, with a lit top edge so it reads as a surface
  g.fillStyle = shadeA(WOOD, 1.15, 1);
  g.fillRect(-S / 2 - 4 * u, cy, S + 8 * u, 3.2 * u);
  g.fillStyle = 'rgba(255,186,120,0.16)';
  g.fillRect(-S / 2 - 4 * u, cy, S + 8 * u, 0.8 * u);
  // Boarded apron, running from the plank all the way down to the street. It
  // stops short of the right-hand upright on purpose: that open bay is where
  // the camera sees the crate CROW is sitting on and the knee he has pushed
  // out, and without it his lower cloak is just an unreadable mass under the
  // counter. Everything left of the bay is closed off.
  const bayX = 12 * u;
  g.fillStyle = shadeA(WOOD, 0.58, 1);
  g.fillRect(-S / 2 - 4 * u, cy + 3.2 * u, (S / 2 + 4 * u) + bayX, -cy - 3.2 * u);
  // vertical boards, so the apron reads as planking rather than a flat slab
  g.strokeStyle = 'rgba(0,0,0,0.40)';
  g.lineWidth = 0.6 * u;
  for (let x = -S / 2; x < bayX; x += 9 * u) {
    g.beginPath(); g.moveTo(x, cy + 4 * u); g.lineTo(x, 0); g.stroke();
  }
  // a lit lip just under the plank, separating counter from apron
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(-S / 2 - 4 * u, cy + 3.2 * u, (S / 2 + 4 * u) + bayX, 1.4 * u);

  // crate stacked against the left end, in front of the upright
  g.fillStyle = shadeA(WOOD, 0.88, 1);
  g.fillRect(-S / 2 - 6 * u, -15 * u, 12 * u, 15 * u);
  g.strokeStyle = 'rgba(0,0,0,0.45)';
  g.lineWidth = 0.5 * u;
  g.strokeRect(-S / 2 - 6 * u, -15 * u, 12 * u, 15 * u);
}

// Paints the wide trader-panel banner into a `w`×`h` box: two stalls flanking
// CROW at his own counter, lit by the same fire his portrait uses.
export function paintTraderScene(g, w, h) {
  g.clearRect(0, 0, w, h);
  const u = h / 140;   // reference scale: composition designed at ~140 units tall
  const groundY = h * 0.90;

  const cx = w * 0.5;
  // Where the lamp hangs, in stall units — the single source every warm value
  // in this painting is derived from. Offset left of centre so CROW is lit
  // from one side rather than flatly from straight on.
  const lampX = LAMP.x * u, lampY = LAMP.y * u;

  // ---- the sector behind him: shuttered frontage, far towers, hanging haze
  backdrop(g, w, h, groundY, u);

  // ---- ground: wet asphalt. The street edge stays a hard line (the game's own
  // convention for "this is the floor"), but everything below it is now a
  // reflective surface, which is what a rainy sector street should be and what
  // finally gives the bottom third of the banner something to do.
  const road = g.createLinearGradient(0, groundY, 0, h);
  road.addColorStop(0, '#15120f');
  road.addColorStop(0.45, '#0d0b0a');
  road.addColorStop(1, '#08080a');
  g.fillStyle = road;
  g.fillRect(0, groundY, w, h - groundY);

  // reflection of the stall and lamp, mirrored in the wet road. Painted from a
  // second pass of the same painters rather than faked with streaks, so it can
  // never disagree with what is standing above it.
  const refl = document.createElement('canvas');
  refl.width = Math.max(1, Math.round(w));
  refl.height = Math.max(1, Math.round(h));
  const rg = refl.getContext('2d');
  rg.save(); rg.translate(cx, groundY);
  stallBack(rg, u, 0x5a37);
  stallFront(rg, u);
  lanternGlow(rg, u, lampX, lampY);
  rg.restore();
  g.save();
  const K = 0.5;                       // foreshortening of the mirrored image
  g.globalAlpha = 0.42;
  g.translate(0, groundY * (1 + K));
  g.scale(1, -K);
  g.drawImage(refl, 0, 0, w, h);
  g.restore();
  // fade the reflection out with distance from the kerb
  const fade = g.createLinearGradient(0, groundY, 0, h);
  fade.addColorStop(0, 'rgba(8,8,10,0)');
  fade.addColorStop(0.55, 'rgba(8,8,10,0.55)');
  fade.addColorStop(1, 'rgba(8,8,10,0.95)');
  g.fillStyle = fade;
  g.fillRect(0, groundY, w, h - groundY);

  // standing water: a couple of shallow puddles catching the lamp
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const [px, pw, pa] of [[0.30, 0.10, 0.05], [0.62, 0.14, 0.07], [0.86, 0.07, 0.035]]) {
    const pgd = g.createRadialGradient(w * px, groundY + 5 * u, 0, w * px, groundY + 5 * u, w * pw);
    pgd.addColorStop(0, `rgba(255,168,92,${pa})`);
    pgd.addColorStop(1, 'rgba(255,168,92,0)');
    g.fillStyle = pgd;
    g.beginPath(); g.ellipse(w * px, groundY + 5 * u, w * pw, 3.4 * u, 0, 0, Math.PI * 2); g.fill();
  }
  g.restore();

  // the kerb itself
  g.strokeStyle = 'rgba(255,190,130,0.20)';
  g.lineWidth = Math.max(1, 0.7 * u);
  g.beginPath(); g.moveTo(0, groundY); g.lineTo(w, groundY); g.stroke();

  // ---- ONE stall, dead centre. It used to be three — two dressed-back ones
  // flanking CROW's own — which split the eye three ways and left him as the
  // middle of a row rather than the reason the row exists. A single stall he
  // is sitting at makes him the subject and the market the setting.
  g.save(); g.translate(cx, groundY); stallBack(g, u, 0x5a37); g.restore();

  // lamp throw, laid down before CROW so he is lit BY it rather than in front
  // of it — this is what puts the warm gradient behind his hood
  g.save(); g.translate(cx, groundY);
  lanternGlow(g, u, lampX, lampY);
  g.restore();

  // ---- CROW, seated behind his own counter.
  //
  // The bust painter has no lower body — it is cropped at the shoulders — so
  // "seated" has to come entirely from staging, and the order things are
  // painted in IS the staging:
  //
  //   bust  →  legs  →  forearm  →  counter
  //
  // The bust goes down first and its cloak drapes below the counter line. The
  // legs are painted over that drape, which is the correct occlusion for a
  // man sitting with his knees in front of his own coat — painted underneath
  // instead, they vanished and the drape was left showing as a shapeless mass
  // with the bandolier strap cutting across it. The counter goes on last and
  // takes the rest.
  const figH = Math.min(64 * u, groundY * 0.80), figW = figH;
  const off = document.createElement('canvas');
  off.width = Math.max(1, Math.round(figW));
  off.height = Math.max(1, Math.round(figH));
  paintTrader(off.getContext('2d'), off.width, off.height);
  // Sunk 16u rather than sitting on the street: the counter has to cross his
  // chest for the seated read, and any more cloak than that hanging below it
  // just piles up in the open bay as a dark mass with no shape to it.
  const figX = cx - figW / 2, figY = groundY - 16 * u - figH;

  // Rim light. Against a dark frontage his cloak is a dark mass on a dark
  // wall, which is the one thing that stops a silhouette from reading as a
  // person. A haze-tinted copy of his own sprite, offset up and away from the
  // lamp and drawn UNDER him, shows only along the edge that faces the sector
  // lights — the cheapest true rim there is, and it can never disagree with
  // his outline because it IS his outline.
  const rim = document.createElement('canvas');
  rim.width = off.width; rim.height = off.height;
  const rgc = rim.getContext('2d');
  rgc.drawImage(off, 0, 0);
  rgc.globalCompositeOperation = 'source-in';
  const rimGrad = rgc.createLinearGradient(0, rim.height * 0.75, rim.width, 0);
  rimGrad.addColorStop(0, withA(HAZE, 0));
  rimGrad.addColorStop(0.6, withA(HAZE, 0));   // nothing on the lamp side
  rimGrad.addColorStop(1, withA(HAZE, 0.9));
  rgc.fillStyle = rimGrad;
  rgc.fillRect(0, 0, rim.width, rim.height);
  g.save();
  // Thin and faint on purpose: at 0.75 alpha and a 1.3u offset this read as a
  // blue sticker outline traced round him rather than as light catching an
  // edge.
  g.globalAlpha = 0.34;
  g.drawImage(rim, figX + 0.8 * u, figY - 0.8 * u, figW, figH);
  g.restore();

  g.drawImage(off, figX, figY, figW, figH);

  g.save();
  g.translate(cx, groundY);
  // the crate he sits on, in the open bay the counter apron leaves clear
  g.fillStyle = shadeA(WOOD, 0.86, 1);
  g.fillRect(20 * u, -19 * u, 20 * u, 19 * u);
  g.fillStyle = 'rgba(255,186,120,0.07)';
  g.fillRect(20 * u, -19 * u, 20 * u, 1.2 * u);      // lit top edge
  g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 0.6 * u;
  g.strokeRect(20 * u, -19 * u, 20 * u, 19 * u);
  g.strokeStyle = 'rgba(0,0,0,0.30)'; g.lineWidth = 0.5 * u;
  g.beginPath(); g.moveTo(20 * u, -12 * u); g.lineTo(40 * u, -12 * u); g.stroke();
  g.beginPath(); g.moveTo(20 * u, -6 * u); g.lineTo(40 * u, -6 * u); g.stroke();

  // Thigh, bent knee and boot — the only part of him below the counter the
  // camera resolves, and the cue that says "sitting" rather than "cropped by
  // furniture". Painted as three reading shapes rather than one silhouette:
  // as a single smooth curve it was the right colour and still came out a
  // shapeless lump, because nothing in it said knee, ankle or sole.
  const legFill = g.createLinearGradient(0, -24 * u, 0, -8 * u);
  legFill.addColorStop(0, shadeA(CANVAS, 1.34, 1));
  legFill.addColorStop(1, shadeA(CANVAS, 0.82, 1));
  g.fillStyle = legFill;
  g.beginPath();
  g.moveTo(14 * u, -24 * u);
  g.quadraticCurveTo(36 * u, -23 * u, 37 * u, -9 * u);
  g.lineTo(26 * u, -8 * u);
  g.quadraticCurveTo(26 * u, -17 * u, 13 * u, -17 * u);
  g.closePath(); g.fill();
  // knee crease + a fold along the thigh
  g.strokeStyle = 'rgba(0,0,0,0.38)'; g.lineWidth = 0.7 * u;
  g.beginPath();
  g.moveTo(30 * u, -21.5 * u);
  g.quadraticCurveTo(33.5 * u, -18 * u, 33.5 * u, -12 * u);
  g.stroke();
  g.strokeStyle = 'rgba(255,190,130,0.10)'; g.lineWidth = 0.6 * u;
  g.beginPath();
  g.moveTo(17 * u, -22 * u); g.quadraticCurveTo(28 * u, -21.5 * u, 32 * u, -19 * u);
  g.stroke();

  // boot: shaft, toe cap and a sole that actually meets the street
  g.fillStyle = shadeA(LEATHER, 1.0, 1);
  g.beginPath();
  g.moveTo(25.5 * u, -9.5 * u);
  g.lineTo(37 * u, -9.5 * u);
  g.quadraticCurveTo(42 * u, -8 * u, 42 * u, -3.4 * u);
  g.lineTo(25.5 * u, -3.4 * u);
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,178,110,0.13)';
  g.fillRect(25.5 * u, -9.5 * u, 13 * u, 1 * u);     // lamp on the boot top
  g.fillStyle = '#100e0c';
  g.fillRect(24.6 * u, -3.4 * u, 18.2 * u, 3.4 * u); // sole
  g.fillStyle = 'rgba(255,186,120,0.09)';
  g.fillRect(24.6 * u, -3.4 * u, 18.2 * u, 0.7 * u);
  g.restore();

  // ---- forearm laid along the counter. Drawn after the bust and before the
  // plank, so it sits on his side of the wood and the plank's front edge laps
  // over it — an arm resting on a surface, not floating above one.
  g.save();
  g.translate(cx, groundY);
  g.fillStyle = shadeA(CANVAS, 0.95, 1);
  g.beginPath();
  g.moveTo(-26 * u, -32 * u);
  g.quadraticCurveTo(-8 * u, -37 * u, 12 * u, -34 * u);
  g.lineTo(12 * u, -28 * u);
  g.quadraticCurveTo(-8 * u, -27 * u, -26 * u, -26 * u);
  g.closePath(); g.fill();
  // gloved hand at the end of it
  g.fillStyle = shadeA(LEATHER, 1.1, 1);
  g.beginPath(); g.ellipse(15 * u, -32 * u, 4.6 * u, 3.4 * u, -0.15, 0, Math.PI * 2); g.fill();
  g.restore();

  g.save(); g.translate(cx, groundY); stallFront(g, u); g.restore();

  // ---- the lamp itself, hung off the crossbeam. Painted last of the stall
  // parts so its shade sits in front of everything it is lighting.
  g.save(); g.translate(cx, groundY);
  lanternFixture(g, u, lampX, lampY, -(STALL.poleH + 1) * u);
  g.restore();

  // ---- scrap laid out for sale on the counter top, to his off side
  g.save();
  g.translate(cx - 36 * u, groundY + (STALL.counterY - 1.8) * u);
  for (let i = 0; i < 3; i++) {
    g.save();
    g.translate(i * 6 * u, -Math.sin(i * 1.3) * 0.6 * u);
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
