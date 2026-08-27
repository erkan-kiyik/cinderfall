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
export function paintScrap(g, w, h, scale = 1) {
  g.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const size = Math.min(w, h);
  const s = (size / 57) * scale;   // fills the icon box rather than floating in it
  const tiny = size <= 30;
  g.save();
  g.translate(cx, cy);
  g.scale(s, s);

  const base = '#8e9099';
  const outline = '#1c1f24';
  const R = 25;
  const lw = tiny ? 2.6 : 3.2;
  g.lineJoin = 'round';
  g.lineCap = 'round';

  // ground shadow (skipped at icon size — reads as noise that small)
  if (!tiny) {
    g.fillStyle = 'rgba(0,0,0,0.30)';
    g.beginPath(); g.ellipse(0, R + 4, R * 0.78, 3.5, 0, 0, Math.PI * 2); g.fill();
  }

  // ---- bolt, raked up to the right and passing behind the nut. Drawn first
  // so the nut sits on it, which is what makes the two read as one assembled
  // piece of hardware rather than two icons side by side.
  g.save();
  g.rotate(-0.55);
  const half = R * 0.26;                 // half the shaft's thickness
  // The head is pushed out far enough to clear the nut's lower-left flat.
  // Tucked in behind it the bolt read as a stub poking out of one side; with
  // both ends showing, the silhouette is a bolt run through a nut.
  const tipX = R * 1.16, headX = -R * 1.06;
  const shaftG = g.createLinearGradient(0, -half, 0, half);
  shaftG.addColorStop(0, shade(base, 1.34));
  shaftG.addColorStop(0.45, shade(base, 0.98));
  shaftG.addColorStop(1, shade(base, 0.46));
  g.fillStyle = shaftG;
  g.beginPath();
  g.moveTo(headX, -half);
  g.lineTo(tipX - half * 0.7, -half);
  g.quadraticCurveTo(tipX, -half, tipX, 0);        // rounded tip
  g.quadraticCurveTo(tipX, half, tipX - half * 0.7, half);
  g.lineTo(headX, half);
  g.closePath();
  g.fill();
  g.strokeStyle = outline; g.lineWidth = lw; g.stroke();
  // thread pitch — raked ticks, the detail that says "screw" and not "rod"
  if (!tiny) {
    g.save();
    g.beginPath();
    g.rect(R * 0.24, -half, tipX - R * 0.24, half * 2);
    g.clip();
    g.strokeStyle = 'rgba(18,20,26,0.50)';
    g.lineWidth = 1.5;
    for (let x = R * 0.3; x < tipX; x += 4.4) {
      g.beginPath(); g.moveTo(x + 1.8, -half); g.lineTo(x - 1.8, half); g.stroke();
    }
    g.restore();
  }
  // hex head on the near end
  const hr = R * 0.42;
  const headG = g.createLinearGradient(headX - hr, -hr, headX + hr, hr);
  headG.addColorStop(0, shade(base, 1.42));
  headG.addColorStop(1, shade(base, 0.58));
  g.fillStyle = headG;
  hexPath(g, headX, 0, hr); g.fill();
  g.strokeStyle = outline; g.lineWidth = lw; g.stroke();
  g.restore();

  // ---- the nut itself: the hero shape, sitting just left of centre so the
  // bolt's threaded end stays visible past its top-right flat.
  const nx = -R * 0.14, ny = R * 0.06;
  const nr = R * 0.78;

  const nutG = g.createLinearGradient(nx - nr, ny - nr, nx + nr * 0.7, ny + nr);
  nutG.addColorStop(0, shade(base, 1.36));
  nutG.addColorStop(0.44, base);
  nutG.addColorStop(1, shade(base, 0.50));
  g.fillStyle = nutG;
  hexPath(g, nx, ny, nr); g.fill();

  g.save();
  hexPath(g, nx, ny, nr); g.clip();
  // chamfered top face — the bevel every real nut has, and the thing that
  // stops the hexagon reading as a flat sticker
  g.fillStyle = 'rgba(255,248,232,0.26)';
  hexPath(g, nx, ny - nr * 0.10, nr * 0.86); g.fill();
  g.fillStyle = 'rgba(10,12,16,0.32)';
  g.fillRect(nx - nr, ny + nr * 0.42, nr * 2, nr);
  if (!tiny) {
    g.strokeStyle = 'rgba(20,22,28,0.34)';
    g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(nx - nr * 0.6, ny + nr * 0.3); g.lineTo(nx + nr * 0.2, ny + nr * 0.52); g.stroke();
  }
  g.restore();

  g.strokeStyle = outline; g.lineWidth = lw;
  hexPath(g, nx, ny, nr); g.stroke();

  // the bore through it — dark, so the nut is unmistakably a nut
  const br = nr * 0.44;
  g.fillStyle = '#15171c';
  g.beginPath(); g.arc(nx, ny, br, 0, Math.PI * 2); g.fill();
  g.strokeStyle = outline; g.lineWidth = tiny ? 1.8 : 2.2;
  g.beginPath(); g.arc(nx, ny, br, 0, Math.PI * 2); g.stroke();
  // a sliver of light on the far inner wall, so the hole has depth
  g.strokeStyle = 'rgba(255,250,238,0.26)';
  g.lineWidth = tiny ? 1.6 : 2;
  g.beginPath(); g.arc(nx, ny, br * 0.82, Math.PI * 0.85, Math.PI * 1.75); g.stroke();

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
