// Premium currency icons — Para (soft currency) and Diamond (premium
// currency) — painted procedurally at any resolution so they stay crisp on
// retina displays and cost nothing to ship (no PNG asset, consistent with
// every other icon in this game — weapons, operators, achievements are all
// canvas-painted). The silhouette and palette follow the reference art
// these are modeled on; this file adds the material rendering (gradients,
// facet highlights, shadows, sheen) on top of that fixed shape.

export function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

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

// ---- PARA: a bound stack of bills — one bold block silhouette so it stays
// legible at 24px, with layered material detail that rewards a closer look. ----
export function paintPara(g, w, h) {
  g.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const size = Math.min(w, h);
  const s = size / 64;
  // Below icon-slot size the two-medallion + band composition muddies into
  // noise, so small renders switch to a simplified, higher-contrast layout —
  // the same de-detailing real mobile game icon sets do for small UI slots.
  const tiny = size <= 30;
  const full = size > 90;
  g.save();
  g.translate(cx, cy);
  g.scale(s, s);

  const outline = '#0d1509';
  const bx = -27, by = -18, bw = 54, bh = 34, br = 4;

  // ground shadow
  if (!tiny) {
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath(); g.ellipse(0, 19, 24, 4, 0, 0, Math.PI * 2); g.fill();
  }

  // ---- single stack body: one bold rounded block, not separate floating
  // layers, so the silhouette reads clearly even shrunk to icon size ----
  const bodyGrad = g.createLinearGradient(bx, by, bx, by + bh);
  bodyGrad.addColorStop(0, '#b7d47f');
  bodyGrad.addColorStop(0.4, '#8bb056');
  bodyGrad.addColorStop(0.72, '#6d9440');
  bodyGrad.addColorStop(1, '#547730');
  g.fillStyle = bodyGrad;
  roundRect(g, bx, by, bw, bh, br);
  g.fill();

  // compressed page-edge lines along the lower third, clipped to the body —
  // fine detail that only reads at full size
  if (full) {
    g.save();
    roundRect(g, bx, by, bw, bh, br); g.clip();
    g.strokeStyle = 'rgba(15,26,10,0.35)'; g.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const ly = by + bh - 3 - i * 3.4;
      g.beginPath(); g.moveTo(bx + 2, ly); g.lineTo(bx + bw - 2, ly); g.stroke();
    }
    g.restore();
  }

  roundRect(g, bx, by, bw, bh, br);
  g.strokeStyle = outline; g.lineWidth = tiny ? 3 : 2.2; g.lineJoin = 'round';
  g.stroke();

  // ---- wrapper band across the middle, slightly overhanging the stack ----
  const bandY = 0, bandH = tiny ? 15 : 12;
  const bandGrad = g.createLinearGradient(0, bandY - bandH / 2, 0, bandY + bandH / 2);
  bandGrad.addColorStop(0, '#f6e7ba');
  bandGrad.addColorStop(0.5, '#e0bd77');
  bandGrad.addColorStop(1, '#b8863f');
  g.fillStyle = bandGrad;
  roundRect(g, -31, bandY - bandH / 2, 62, bandH, 2.5);
  g.fill();
  g.strokeStyle = outline; g.lineWidth = tiny ? 2.6 : 2; g.stroke();
  if (!tiny) {
    g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(-27.5, bandY - bandH / 2 + 2.4); g.lineTo(27.5, bandY - bandH / 2 + 2.4); g.stroke();
  }

  // ---- currency medallion(s), drawn on top of the band ----
  // Tiny: one big bold centered coin — the clearest possible silhouette.
  // Normal/full: two smaller coins peeking above the band, more detail.
  if (tiny) {
    paraMedallion(g, 0, -2, 11, true);
  } else {
    paraMedallion(g, -14, -7, 8, false);
    paraMedallion(g, 14, -7, 8, false);
  }

  // ---- premium gloss sheen, upper-left diagonal wash ----
  if (!tiny) {
    g.save();
    roundRect(g, bx, by, bw, bh, br); g.clip();
    const gloss = g.createLinearGradient(bx, by, bx + bw * 0.55, by + bh * 0.55);
    gloss.addColorStop(0, 'rgba(255,255,255,0.45)');
    gloss.addColorStop(0.6, 'rgba(255,255,255,0.1)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gloss;
    g.beginPath();
    g.moveTo(bx, by); g.lineTo(bx + bw * 0.62, by); g.lineTo(bx, by + bh * 0.62); g.closePath();
    g.fill();
    g.restore();
  }

  g.restore();
}

function paraMedallion(g, x, y, r, bold) {
  g.save();
  g.translate(x, y);
  const grad = g.createRadialGradient(-r * 0.32, -r * 0.32, 0, 0, 0, r * 1.15);
  grad.addColorStop(0, '#f4e9c4');
  grad.addColorStop(0.55, '#d9b96a');
  grad.addColorStop(1, '#a9812f');
  g.fillStyle = grad;
  g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#0d1509'; g.lineWidth = bold ? 2.4 : 1.6;
  g.stroke();
  if (!bold) {
    g.strokeStyle = 'rgba(13,21,9,0.4)'; g.lineWidth = 0.7;
    g.beginPath(); g.arc(0, 0, r * 0.62, 0, Math.PI * 2); g.stroke();
  }
  // small top-left specular dot for a coined/metallic read
  g.fillStyle = 'rgba(255,255,255,0.75)';
  g.beginPath(); g.ellipse(-r * 0.3, -r * 0.35, r * 0.26, r * 0.16, -0.5, 0, Math.PI * 2); g.fill();
  g.restore();
}

// ---- DIAMOND: faceted gem, cyan/blue/violet refraction ----
// `scale` is an extra size multiplier on top of the box fit — used to make
// pricier store packages' gem art read as visibly bigger within a same-size canvas.
export function paintDiamond(g, w, h, scale = 1) {
  g.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const s = (Math.min(w, h) / 64) * scale;
  g.save();
  g.translate(cx, cy);
  g.scale(s, s);

  const outline = '#0a1330';
  const top = -24, bottom = 26, wTop = 20, wMid = 24;

  // soft ambient glow behind the gem
  const glow = g.createRadialGradient(0, -2, 4, 0, -2, 32);
  glow.addColorStop(0, 'rgba(90,200,255,0.35)');
  glow.addColorStop(1, 'rgba(90,200,255,0)');
  g.fillStyle = glow;
  g.beginPath(); g.arc(0, -2, 32, 0, Math.PI * 2); g.fill();

  // ---- silhouette (crown flat top, faceted pavilion to a point) ----
  const outlinePath = () => {
    g.beginPath();
    g.moveTo(-wTop, top + 6);
    g.lineTo(-wTop, top);
    g.lineTo(wTop, top);
    g.lineTo(wTop, top + 6);
    g.lineTo(wMid, top + 12);
    g.lineTo(0, bottom);
    g.lineTo(-wMid, top + 12);
    g.closePath();
  };

  outlinePath();
  const body = g.createLinearGradient(0, top, 0, bottom);
  body.addColorStop(0, '#bdf3ff');
  body.addColorStop(0.32, '#5fd0ee');
  body.addColorStop(0.62, '#2e9fe0');
  body.addColorStop(1, '#1a5fc4');
  g.fillStyle = body;
  g.fill();

  // ---- facet planes: table (top), crown bevels, pavilion bevels ----
  g.save();
  outlinePath(); g.clip();

  // table (flat top facet)
  const table = g.createLinearGradient(-wTop, top, wTop, top + 6);
  table.addColorStop(0, 'rgba(220,255,255,0.9)');
  table.addColorStop(1, 'rgba(140,220,255,0.5)');
  g.fillStyle = table;
  g.beginPath();
  g.moveTo(-wTop, top); g.lineTo(wTop, top); g.lineTo(wTop, top + 6); g.lineTo(-wTop, top + 6);
  g.closePath(); g.fill();

  // left crown bevel — brightest facet (key light)
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.beginPath();
  g.moveTo(-wTop, top + 6); g.lineTo(0, top + 6); g.lineTo(-wMid, top + 12); g.closePath();
  g.fill();

  // right crown bevel — mid tone
  g.fillStyle = 'rgba(160,225,255,0.35)';
  g.beginPath();
  g.moveTo(wTop, top + 6); g.lineTo(0, top + 6); g.lineTo(wMid, top + 12); g.closePath();
  g.fill();

  // left pavilion (upper-mid to point) — cyan-to-violet cool shadow
  const pavL = g.createLinearGradient(-wMid, top + 12, 0, bottom);
  pavL.addColorStop(0, 'rgba(120,220,255,0.5)');
  pavL.addColorStop(1, 'rgba(120,80,235,0.35)');
  g.fillStyle = pavL;
  g.beginPath();
  g.moveTo(-wMid, top + 12); g.lineTo(0, top + 6); g.lineTo(0, bottom); g.closePath();
  g.fill();

  // right pavilion — deeper blue, core shadow side
  const pavR = g.createLinearGradient(wMid, top + 12, 0, bottom);
  pavR.addColorStop(0, 'rgba(20,70,170,0.55)');
  pavR.addColorStop(1, 'rgba(70,30,150,0.4)');
  g.fillStyle = pavR;
  g.beginPath();
  g.moveTo(wMid, top + 12); g.lineTo(0, top + 6); g.lineTo(0, bottom); g.closePath();
  g.fill();

  g.restore();

  // outer edge line
  outlinePath();
  g.strokeStyle = outline; g.lineWidth = 2.2; g.lineJoin = 'round';
  g.stroke();

  // internal facet lines (thin, bright — the "cut" lines that read as glass)
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.8;
  g.beginPath(); g.moveTo(0, top + 6); g.lineTo(0, bottom); g.stroke();
  g.beginPath(); g.moveTo(-wTop, top + 6); g.lineTo(-wMid, top + 12); g.stroke();
  g.beginPath(); g.moveTo(wTop, top + 6); g.lineTo(wMid, top + 12); g.stroke();
  g.strokeStyle = 'rgba(10,20,45,0.3)'; g.lineWidth = 0.6;
  g.beginPath(); g.moveTo(-wTop, top); g.lineTo(-wTop, top + 6); g.stroke();
  g.beginPath(); g.moveTo(wTop, top); g.lineTo(wTop, top + 6); g.stroke();

  // ---- sparkle highlights (the "glass catching light" tell) ----
  sparkle(g, -6, -10, 5.5, 1);
  sparkle(g, 6, -2, 3.5, 0.85);
  sparkle(g, -12, 4, 2, 0.6);
  smallGlint(g, 12, 10, 1.6);

  g.restore();
}

function sparkle(g, x, y, r, alpha) {
  g.save();
  g.translate(x, y);
  g.globalAlpha = alpha;
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, r * 2.2);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.beginPath(); g.arc(0, 0, r * 2.2, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#ffffff'; g.lineWidth = r * 0.32;
  g.beginPath(); g.moveTo(-r, 0); g.lineTo(r, 0); g.stroke();
  g.beginPath(); g.moveTo(0, -r); g.lineTo(0, r); g.stroke();
  g.restore();
}

function smallGlint(g, x, y, r) {
  g.save();
  g.translate(x, y);
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
  g.restore();
}

// ---- Convenience: paint straight into a <canvas> element (HiDPI-aware) ----
export function renderParaIcon(cv) {
  const { g, w, h } = setupHiDpi(cv);
  paintPara(g, w, h);
}

export function renderDiamondIcon(cv) {
  const { g, w, h } = setupHiDpi(cv);
  paintDiamond(g, w, h);
}

// ---- Batch mount: paints every currency icon canvas under `root`. Call once
// at boot (icons are static markup) and again after inserting any new DOM
// that carries `canvas.cur-para` / `canvas.cur-diamond` elements. ----
export function mountCurrencyIcons(root = document) {
  root.querySelectorAll('canvas.cur-para').forEach(renderParaIcon);
  root.querySelectorAll('canvas.cur-diamond').forEach(renderDiamondIcon);
}
