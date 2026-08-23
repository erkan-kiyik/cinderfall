// Scrap icon — the game's one currency, painted procedurally at any
// resolution so it stays crisp on retina displays and costs nothing to ship
// (no PNG asset, consistent with every other icon in this game — weapons,
// operators and achievements are all canvas-painted).
//
// The game used to run two currencies with two icons: a struck coin for Para
// and a cut gem for Diamonds. Both are wrong for what the economy is now.
// Scrap is salvage — the usable metal stripped off what the operator downs —
// so the icon is a bolted plate fragment with a torn edge rather than
// something minted or mined. It has to read at 14px in a HUD pill, so the
// silhouette is one chunky shape with a single bolt, not a busy composition.

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
  const w = cv.clientWidth || 48, h = cv.clientHeight || 48;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { g, w, h };
}

// ---- SCRAP: a salvaged steel plate fragment, one corner sheared off, a bolt
// through it. Warm steel rather than the HUD amber, so a scrap count never
// reads as the same thing as an objective marker. ----
export function paintScrap(g, w, h, scale = 1) {
  g.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const size = Math.min(w, h);
  const s = (size / 64) * scale;
  const tiny = size <= 30;
  g.save();
  g.translate(cx, cy);
  g.scale(s, s);

  const base = '#8e9099';
  const outline = '#1c1f24';
  const R = 25;

  // ground shadow (skipped at icon size — reads as noise that small)
  if (!tiny) {
    g.fillStyle = 'rgba(0,0,0,0.30)';
    g.beginPath(); g.ellipse(0, R + 5, R * 0.72, 3.5, 0, 0, Math.PI * 2); g.fill();
  }

  // plate body: a rough quad with one sheared corner, so the silhouette says
  // "torn off something" rather than "manufactured"
  const plate = () => {
    g.beginPath();
    g.moveTo(-R, -R * 0.72);
    g.lineTo(R * 0.52, -R * 0.86);
    g.lineTo(R, -R * 0.1);      // sheared corner
    g.lineTo(R * 0.72, R * 0.8);
    g.lineTo(-R * 0.66, R * 0.86);
    g.closePath();
  };

  const body = g.createLinearGradient(-R, -R, R * 0.6, R);
  body.addColorStop(0, shade(base, 1.32));
  body.addColorStop(0.42, base);
  body.addColorStop(1, shade(base, 0.52));
  g.fillStyle = body;
  plate(); g.fill();

  // top-left bevel catching the key light
  g.save();
  plate(); g.clip();
  g.fillStyle = 'rgba(255,248,232,0.30)';
  g.beginPath();
  g.moveTo(-R, -R * 0.72); g.lineTo(R * 0.52, -R * 0.86);
  g.lineTo(R * 0.4, -R * 0.6); g.lineTo(-R * 0.86, -R * 0.44);
  g.closePath(); g.fill();
  // underside shadow
  g.fillStyle = 'rgba(10,12,16,0.34)';
  g.beginPath();
  g.moveTo(-R * 0.66, R * 0.86); g.lineTo(R * 0.72, R * 0.8);
  g.lineTo(R * 0.66, R * 0.5); g.lineTo(-R * 0.6, R * 0.56);
  g.closePath(); g.fill();
  // a couple of scuffs, only where they'll read
  if (!tiny) {
    g.strokeStyle = 'rgba(20,22,28,0.34)';
    g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-R * 0.5, R * 0.1); g.lineTo(R * 0.1, R * 0.3); g.stroke();
    g.strokeStyle = 'rgba(255,250,238,0.20)';
    g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(-R * 0.44, -R * 0.06); g.lineTo(R * 0.2, R * 0.12); g.stroke();
  }
  g.restore();

  g.strokeStyle = outline;
  g.lineWidth = tiny ? 2.6 : 3.2;
  g.lineJoin = 'round';
  plate(); g.stroke();

  // bolt through the plate — the one detail that survives at 14px and makes
  // the shape read as hardware rather than as an abstract polygon
  const bx = -R * 0.16, by = -R * 0.04;
  const br = tiny ? R * 0.3 : R * 0.26;
  g.fillStyle = shade(base, 0.42);
  g.beginPath(); g.arc(bx, by, br * 1.35, 0, Math.PI * 2); g.fill();
  const boltG = g.createLinearGradient(bx - br, by - br, bx + br, by + br);
  boltG.addColorStop(0, shade(base, 1.45));
  boltG.addColorStop(1, shade(base, 0.72));
  g.fillStyle = boltG;
  // hex head
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const px = bx + Math.cos(a) * br, py = by + Math.sin(a) * br;
    if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
  }
  g.closePath(); g.fill();
  g.strokeStyle = outline; g.lineWidth = tiny ? 1.6 : 1.9;
  g.stroke();

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
