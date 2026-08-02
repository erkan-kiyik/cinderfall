// Premium currency icons — Para (soft currency) and Diamond (premium
// currency) — painted procedurally at any resolution so they stay crisp on
// retina displays and cost nothing to ship (no PNG asset, consistent with
// every other icon in this game — weapons, operators, achievements are all
// canvas-painted). The silhouette and palette follow the reference art
// these are modeled on; this file adds the material rendering (gradients,
// facet highlights, shadows, sheen) on top of that fixed shape.

function roundRect(g, x, y, w, h, r) {
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

// ---- PARA: a single clean coin medallion — one bold, legible silhouette at
// any size, metallic amber to match the HUD's accent colour (no green bill
// stack). Kept intentionally simple: a struck disc with a four-point star
// mark, not a busy composition — reads instantly in a 16px header pill. ----
export function paintPara(g, w, h) {
  g.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const size = Math.min(w, h);
  const s = size / 64;
  const tiny = size <= 30;
  g.save();
  g.translate(cx, cy);
  g.scale(s, s);

  const outline = '#3a2408';
  const r = 26;

  // soft ground shadow (skipped at icon size — reads as noise that small)
  if (!tiny) {
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.beginPath(); g.ellipse(0, r + 5, r * 0.7, 3.5, 0, 0, Math.PI * 2); g.fill();
  }

  // ---- struck disc: warm metallic gold radial gradient, key light upper-left ----
  const body = g.createRadialGradient(-r * 0.32, -r * 0.34, r * 0.15, 0, 0, r * 1.05);
  body.addColorStop(0, '#fff3cf');
  body.addColorStop(0.32, '#ffd479');
  body.addColorStop(0.65, '#e0a13a');
  body.addColorStop(1, '#a9691f');
  g.fillStyle = body;
  g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = outline; g.lineWidth = tiny ? 3 : 2.4;
  g.stroke();

  // recessed inner ring — the "struck coin" tell
  g.strokeStyle = 'rgba(58,36,8,0.4)'; g.lineWidth = tiny ? 1.4 : 1;
  g.beginPath(); g.arc(0, 0, r * 0.76, 0, Math.PI * 2); g.stroke();
  if (!tiny) {
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.8;
    g.beginPath(); g.arc(0, 0, r * 0.76, Math.PI * 1.05, Math.PI * 1.85); g.stroke();
  }

  // ---- centre mark: a simple four-point star, the one piece of "content"
  // on the coin — bold enough to read at icon size, plain enough not to
  // compete with the amount text next to it ----
  g.fillStyle = 'rgba(58,36,8,0.88)';
  star4(g, 0, 0, r * 0.42, r * 0.15);

  // ---- gloss sheen, upper-left diagonal wash ----
  g.save();
  g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.clip();
  const gloss = g.createLinearGradient(-r, -r, r * 0.2, r * 0.2);
  gloss.addColorStop(0, 'rgba(255,255,255,0.55)');
  gloss.addColorStop(0.55, 'rgba(255,255,255,0.12)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gloss;
  g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
  g.restore();

  g.restore();
}

// A compact 4-point star (diamond with concave sides) — used as the coin's
// centre mark and reused nowhere else, so it stays a private helper.
function star4(g, x, y, rOuter, rInner) {
  g.save();
  g.translate(x, y);
  g.beginPath();
  for (let i = 0; i < 4; i++) {
    const a0 = (i / 4) * TAU2, a1 = a0 + TAU2 / 8;
    const p0 = { x: Math.cos(a0) * rOuter, y: Math.sin(a0) * rOuter };
    const p1 = { x: Math.cos(a1) * rInner, y: Math.sin(a1) * rInner };
    if (i === 0) g.moveTo(p0.x, p0.y); else g.lineTo(p0.x, p0.y);
    g.lineTo(p1.x, p1.y);
  }
  g.closePath();
  g.fill();
  g.restore();
}
const TAU2 = Math.PI * 2;

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
