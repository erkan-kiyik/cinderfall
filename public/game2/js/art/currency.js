// Scrap icon — the game's one currency, painted procedurally at any
// resolution so it stays crisp on retina displays and costs nothing to ship
// (no PNG asset, consistent with every other icon in this game — weapons,
// operators and achievements are all canvas-painted).
//
// The game used to run two currencies with two icons: a struck coin for Para
// and a cut gem for Diamonds. Both are wrong for what the economy is now.
// Scrap is salvage — the usable metal stripped off what the operator downs —
// so the icon has to look like hardware pulled off a machine, not like
// something minted or mined. It is a hex nut with a threaded bolt run through
// it: two named shapes rather than one abstract one, which is what lets it
// survive being shown at 14px in a HUD pill.

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
  r = Math.min(255, Math.max(0, Math.round(r * k)));
  gg = Math.min(255, Math.max(0, Math.round(gg * k)));
  b = Math.min(255, Math.max(0, Math.round(b * k)));
  return `rgb(${r},${gg},${b})`;
}

// Draws into the canvas `cv` sized to its CSS box at up to 2x DPR — callers
// just need a <canvas> element with the right CSS width/height set.
export function setupHiDpi(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  // Measure once and remember it. Writing cv.width changes the element's
  // intrinsic size, so re-measuring after a repaint returned dpr x the
  // previous box — an icon whose CSS box came from its width/height
  // attributes doubled on every remount until it swallowed its own button.
  // Cached rather than pinned via cv.style so the stylesheet stays in charge
  // of how big the icon actually draws.
  let w = cv._logicalW, h = cv._logicalH;
  if (!w || !h) {
    w = cv.clientWidth || 48; h = cv.clientHeight || 48;
    cv._logicalW = w; cv._logicalH = h;
  }
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { g, w, h };
}

// Flat-top hexagon path, centred on (x,y).
function hexPath(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
  }
  g.closePath();
}

// ---- SCRAP: salvaged hardware — a heavy hex nut with a threaded bolt lying
// through it. Warm steel rather than the HUD amber, so a scrap count never
// reads as the same thing as an objective marker.
//
// This was a torn steel plate with a single bolt on it, and the plate was
// doing nothing for it: an irregular quad is a shape with no name, so at HUD
// size it read as a grey blob and the one bolt was too small to rescue it.
// Salvage currency should look like the stuff you actually strip off a
// machine, so the hardware IS the icon now. A hex nut is the right hero —
// it is instantly nameable, its silhouette is symmetric enough to stay
// legible at 14px, and the hole through the middle survives any scale.
// Redesigned as a brass scrap cog: a geared token with a hex bore. The grey
// nut-and-bolt was honest but dull — a mid-grey shape with a mid-grey outline
// that sank into the dark HUD and read as a settings icon. A currency is the
// thing a player wants more of; it should be warm, bright and instantly
// countable, while the gear teeth and the nut bore keep it "salvage".
// Three flat tones, one highlight, a bold outline: stylised, not rendered.
function gearPath(g, r0, r1, teeth) {
  g.beginPath();
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    const t0 = a - step * 0.24, t1 = a + step * 0.24;   // tooth top
    const b0 = a - step * 0.40, b1 = a + step * 0.40;   // tooth root
    if (i === 0) g.moveTo(Math.cos(b0) * r0, Math.sin(b0) * r0);
    g.lineTo(Math.cos(t0) * r1, Math.sin(t0) * r1);
    g.lineTo(Math.cos(t1) * r1, Math.sin(t1) * r1);
    g.lineTo(Math.cos(b1) * r0, Math.sin(b1) * r0);
    g.arc(0, 0, r0, b1, b1 + step * 0.2);
  }
  g.closePath();
}

export function paintScrap(g, w, h, scale = 1) {
  g.clearRect(0, 0, w, h);
  const size = Math.min(w, h);
  const s = (size / 60) * scale;
  const tiny = size <= 30;
  g.save();
  g.translate(w / 2, h / 2);
  g.scale(s, s);
  g.lineJoin = 'round';
  const OUT = '#2a1606';
  const lw = tiny ? 4.2 : 3.4;

  // gear body
  const body = g.createLinearGradient(0, -28, 0, 28);
  body.addColorStop(0, '#ffe08a');
  body.addColorStop(0.45, '#f2a93b');
  body.addColorStop(1, '#b8601a');
  gearPath(g, 22, 28, 8);
  g.fillStyle = body; g.fill();
  g.strokeStyle = OUT; g.lineWidth = lw; g.stroke();

  // raised inner face
  const face = g.createLinearGradient(0, -19, 0, 19);
  face.addColorStop(0, '#ffd36a');
  face.addColorStop(1, '#d9822a');
  g.fillStyle = face;
  g.beginPath(); g.arc(0, 0, 18, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(80,36,6,0.55)'; g.lineWidth = tiny ? 2.6 : 2;
  g.stroke();

  // hex bore
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(a) * 8.6, y = Math.sin(a) * 8.6;
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.closePath();
  g.fillStyle = '#3a1d07'; g.fill();
  g.strokeStyle = OUT; g.lineWidth = tiny ? 3 : 2.4; g.stroke();
  // light catching the bore's lower inner wall
  g.fillStyle = 'rgba(255,190,90,0.55)';
  g.beginPath(); g.moveTo(-7.4, 4.3); g.lineTo(7.4, 4.3); g.lineTo(4.3, 7.4); g.lineTo(-4.3, 7.4); g.closePath(); g.fill();

  // gloss: one soft arc across the top-left of the face
  g.save();
  g.beginPath(); g.arc(0, 0, 18, 0, Math.PI * 2); g.clip();
  g.fillStyle = 'rgba(255,255,240,0.45)';
  g.beginPath(); g.ellipse(-6, -11, 12, 5, -0.5, 0, Math.PI * 2); g.fill();
  g.restore();
  if (!tiny) {
    // a single sparkle on the rim
    g.fillStyle = '#fffbe8';
    g.beginPath();
    g.moveTo(17, -22); g.lineTo(18.4, -18.4); g.lineTo(22, -17); g.lineTo(18.4, -15.6);
    g.lineTo(17, -12); g.lineTo(15.6, -15.6); g.lineTo(12, -17); g.lineTo(15.6, -18.4);
    g.closePath(); g.fill();
  }
  g.restore();
}

// ---- Convenience: paint straight into a <canvas> element (HiDPI-aware) ----
export function renderScrapIcon(cv) {
  const { g, w, h } = setupHiDpi(cv);
  paintScrap(g, w, h);
}

// ---- Batch mount: paints every currency icon canvas under `root`. Call once
// at boot (icons are static markup) and again after inserting any new DOM
// that carries `canvas.cur-scrap` elements. ----
export function mountCurrencyIcons(root = document) {
  root.querySelectorAll('canvas.cur-scrap').forEach(renderScrapIcon);
}
