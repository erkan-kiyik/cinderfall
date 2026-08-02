// Background paintings: dusk sky with low sun, drifting cloud bank, far
// industrial skyline dissolved in haze, and a mid-distance factory line with
// lit windows. Each layer is a wide painted strip that tiles horizontally and
// scrolls at its own parallax rate.

import { makeCanvas, lingrad, radgrad, shade, mix, withA, COL } from './paint.js';
import { makeRng } from '../engine/math.js';
import { device } from '../engine/device.js';

const SKY_W = 1600, SKY_H = 900;

// ---------------- depth grade ----------------
// Aerial perspective, baked once at boot: the further a parallax layer sits,
// the more it loses saturation and value and the softer its edges get. Doing
// it here rather than per frame matters — a runtime canvas `filter` on
// full-screen layers would be one of the most expensive steps in the render
// loop, and none of this ever changes once painted.
//
// The net effect is that everything behind the play surface reads as a dim,
// hazy backdrop, leaving the characters as the only high-contrast, in-focus
// subjects on screen.
export const DEPTH_GRADE = {
  sky:    { brightness: 0.78, saturate: 0.82 },                        // stretched, never tiled — no blur to gain
  clouds: { brightness: 0.70, saturate: 0.62, blur: 2.6, wrap: true },
  far:    { brightness: 0.56, saturate: 0.42, blur: 3.6, wrap: true },  // furthest: flattest + softest
  mid:    { brightness: 0.68, saturate: 0.60, blur: 1.7, wrap: true },
  // Nearest parallax band. It sits closest to the play surface, so it keeps
  // the most contrast and stays sharp — but it is still graded down enough
  // that the characters in front of it remain the brightest thing on screen.
  near:   { brightness: 0.60, saturate: 0.70, blur: 0.6, wrap: true },
};

// Applies a depth grade to a finished layer, in place.
// `wrap` matters for the horizontally-tiling layers: a plain blur samples
// transparency past each edge and leaves a visible dark seam where the tile
// repeats, so the layer's own left/right neighbours are laid down first and
// the whole strip is blurred as one, then cropped back to size.
function depthTreat(cv, { blur = 0, saturate = 1, brightness = 1, wrap = false } = {}) {
  const W = cv.width, H = cv.height;
  // Where canvas filters aren't implemented (older Android WebViews) the
  // filter assignment below is a silent no-op, and every parallax layer would
  // ship at full contrast — the backdrop competing with the characters
  // instead of receding behind them. Approximate the grade with composite
  // ops instead: the blur is lost, but the depth ordering survives, which is
  // what the aerial-perspective read actually depends on.
  if (!device.canvasFilter) {
    const g = cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'saturation';        // pull toward grey
    g.fillStyle = `hsl(0, ${Math.round(saturate * 100)}%, 50%)`;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-atop';       // darken, keeping alpha
    g.fillStyle = `rgba(0,0,0,${(1 - brightness).toFixed(3)})`;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
    return;
  }
  const pad = blur > 0 ? Math.ceil(blur * 3) : 0;
  // 1) assemble the source (plus wrap neighbours) unfiltered
  const src = makeCanvas(W + pad * 2, H + pad * 2);
  if (wrap && pad) {
    src.g.drawImage(cv, pad - W, pad);
    src.g.drawImage(cv, pad + W, pad);
  }
  src.g.drawImage(cv, pad, pad);
  // 2) one filtered pass over the assembled strip
  const out = makeCanvas(W + pad * 2, H + pad * 2);
  out.g.filter = `saturate(${saturate}) brightness(${brightness})` + (blur ? ` blur(${blur}px)` : '');
  out.g.drawImage(src.cv, 0, 0);
  out.g.filter = 'none';
  // 3) crop the padding away, back into the original canvas
  const dst = cv.getContext('2d');
  dst.setTransform(1, 0, 0, 1, 0, 0);
  dst.clearRect(0, 0, W, H);
  dst.drawImage(out.cv, pad, pad, W, H, 0, 0, W, H);
}

export function buildBackground() {
  const bg = {
    sky: paintSky(),
    clouds: paintClouds(),
    far: paintFar(),
    mid: paintMid(),
    near: paintNear(),
  };
  for (const layer of Object.keys(DEPTH_GRADE)) depthTreat(bg[layer], DEPTH_GRADE[layer]);
  return bg;
}

// ---------------- sky ----------------
function paintSky() {
  const { cv, g } = makeCanvas(SKY_W, SKY_H);
  // vertical dusk ramp
  g.fillStyle = lingrad(g, 0, 0, 0, SKY_H, [
    [0, '#1c2331'],
    [0.34, '#3d4a63'],
    [0.62, '#77707e'],
    [0.78, '#b07a58'],
    [0.9, '#cf8f5c'],
    [1, '#daa268'],
  ]);
  g.fillRect(0, 0, SKY_W, SKY_H);
  // sun low on the horizon, screened through haze
  const sx = SKY_W * 0.62, sy = SKY_H * 0.82;
  g.fillStyle = radgrad(g, sx, sy, 340, [
    [0, 'rgba(255,214,150,0.55)'],
    [0.3, 'rgba(255,190,120,0.28)'],
    [1, 'rgba(255,170,100,0)'],
  ]);
  g.fillRect(0, 0, SKY_W, SKY_H);
  g.fillStyle = radgrad(g, sx, sy, 46, [
    [0, 'rgba(255,244,220,0.95)'],
    [0.6, 'rgba(255,214,150,0.55)'],
    [1, 'rgba(255,200,130,0)'],
  ]);
  g.beginPath(); g.arc(sx, sy, 46, 0, Math.PI * 2); g.fill();
  // high thin cirrus streaks
  const rng = makeRng(555);
  for (let i = 0; i < 9; i++) {
    const y = rng.range(40, SKY_H * 0.5);
    const x = rng() * SKY_W, w = rng.range(200, 500), h = rng.range(6, 16);
    g.fillStyle = lingrad(g, x, 0, x + w, 0, [
      [0, 'rgba(180,170,180,0)'],
      [0.5, `rgba(196,180,180,${rng.range(0.04, 0.1)})`],
      [1, 'rgba(180,170,180,0)'],
    ]);
    g.beginPath(); g.ellipse(x + w / 2, y, w / 2, h / 2, 0, 0, Math.PI * 2); g.fill();
  }
  // subtle grain so the ramp never bands
  for (let i = 0; i < 3200; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.02})`;
    g.fillRect(Math.random() * SKY_W, Math.random() * SKY_H, 1, 1);
  }
  return cv;
}

// ---------------- cloud bank (tiling strip) ----------------
// Painted as soft cumulus banks: cool blue-grey crowns, warm sun-lit
// undersides, a bright rim where the low sun grazes the base. Every puff is
// drawn again shifted by ±W when it crosses a seam so the strip tiles with no
// visible edge.
function paintClouds() {
  const W = 2048, H = 520;
  const { cv, g } = makeCanvas(W, H);
  const rng = makeRng(808);

  // wrap-aware soft blob: draws the puff plus a copy across whichever seam it
  // overlaps, so a cloud straddling x=0 / x=W is continuous when tiled.
  const blob = (x, y, rx, ry, stops) => {
    for (const ox of [0, -W, W]) {
      if (x + ox + rx < -4 || x + ox - rx > W + 4) continue;
      g.fillStyle = radgrad(g, x + ox, y, rx, stops);
      g.save();
      g.translate(x + ox, y);
      g.scale(1, ry / rx);
      g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill();
      g.restore();
    }
  };

  // three depth rows: high faint wisps, then two denser cloud banks lower down
  const rows = [
    { count: 5, cy: [70, 150], spread: [150, 240], puffs: [7, 11], rr: [42, 78], crown: 0.16, base: 0.12 },
    { count: 5, cy: [190, 300], spread: [180, 300], puffs: [9, 15], rr: [60, 120], crown: 0.30, base: 0.26 },
    { count: 4, cy: [320, 430], spread: [200, 340], puffs: [10, 16], rr: [70, 140], crown: 0.40, base: 0.34 },
  ];

  for (const row of rows) {
    for (let c = 0; c < row.count; c++) {
      const cx = (c + rng.range(-0.35, 0.35)) / row.count * W;
      const cy = rng.range(row.cy[0], row.cy[1]);
      const spread = rng.range(row.spread[0], row.spread[1]);
      const n = rng.int(row.puffs[0], row.puffs[1]);

      // soft ambient body first (cool), so individual puffs sit in a mass
      blob(((cx % W) + W) % W, cy, spread * 0.9, spread * 0.34, [
        [0, withA('#8790a6', row.crown * 0.5)],
        [0.7, withA('#6b7286', row.crown * 0.22)],
        [1, 'rgba(90,96,116,0)'],
      ]);

      for (let i = 0; i < n; i++) {
        const t = i / (n - 1) - 0.5;                    // -0.5..0.5 across cloud
        const px = cx + t * spread * 2;
        const dome = -Math.cos(t * Math.PI) * spread * 0.22;   // rounded top
        const py = cy + dome + rng.range(-12, 10);
        const r = rng.range(row.rr[0], row.rr[1]) * (1 - Math.abs(t) * 0.35);
        const wx = ((px % W) + W) % W;
        const under = py > cy + spread * 0.02;
        if (under) {
          // warm sun-lit underside
          blob(wx, py, r, r * 0.72, [
            [0, withA('#d8b48c', row.base)],
            [0.55, withA('#c1926e', row.base * 0.6)],
            [1, 'rgba(150,120,110,0)'],
          ]);
        } else {
          // cool shadowed crown
          blob(wx, py, r, r * 0.78, [
            [0, withA('#9aa2b6', row.crown)],
            [0.55, withA('#7b8296', row.crown * 0.55)],
            [1, 'rgba(105,112,132,0)'],
          ]);
        }
      }

      // bright rim where the low sun catches the cloud base
      blob(((cx % W) + W) % W, cy + spread * 0.22, spread * 0.75, spread * 0.09, [
        [0, withA('#f2c288', row.base * 0.7)],
        [0.6, withA('#e0a066', row.base * 0.3)],
        [1, 'rgba(210,150,100,0)'],
      ]);
    }
  }
  return cv;
}

// ---------------- far skyline ----------------
function paintFar() {
  const W = 2048, H = 620;
  const { cv, g } = makeCanvas(W, H);
  const rng = makeRng(919);
  const hazeA = mix(COL.haze, '#b58a68', 0.45);
  const hazeB = mix(COL.haze, '#6a7086', 0.4);

  // two depth rows of silhouettes
  for (let row = 0; row < 2; row++) {
    const col = row === 0 ? withA(hazeA, 0.5) : withA(hazeB, 0.72);
    const baseY = H - 40 - row * 8;
    const top = row === 0 ? 320 : 230;
    g.fillStyle = col;
    let x = row * 90;
    while (x < W + 140) {
      const bw = rng.range(70, 190);
      const bh = rng.range(60, top);
      g.fillRect(x, baseY - bh, bw, bh + 40);
      // rooftop clutter: tanks, masts, AC
      if (rng.chance(0.6)) g.fillRect(x + bw * 0.2, baseY - bh - 12, bw * 0.18, 12);
      if (rng.chance(0.5)) {
        g.fillRect(x + bw * 0.65, baseY - bh - 26, 3, 26);
        g.fillRect(x + bw * 0.65 - 4, baseY - bh - 26, 11, 3);
      }
      // smokestack cluster occasionally
      if (rng.chance(0.3)) {
        const sw = rng.range(14, 22);
        g.fillRect(x + bw + 6, baseY - bh - rng.range(50, 120), sw, bh + 160);
      }
      x += bw + rng.range(24, 90);
    }
  }
  // haze wash at base so it sits into the atmosphere
  g.fillStyle = lingrad(g, 0, H - 240, 0, H, [
    [0, 'rgba(200,150,110,0)'],
    [1, 'rgba(206,150,106,0.4)'],
  ]);
  g.fillRect(0, 0, W, H);
  return cv;
}

// ---- industrial landmark silhouettes (drawn into the mid layer) ----------

// Hyperboloid cooling tower: characteristic waisted profile, vertical ribbing,
// a lit rim at the mouth and a faint standing steam wisp.
function coolingTower(g, cx, baseY, h, w, col) {
  const topY = baseY - h;
  const waistY = topY + h * 0.62;
  const rTop = w * 0.5, rWaist = w * 0.34, rBase = w * 0.5;
  const profile = (side) => {
    g.beginPath();
    g.moveTo(cx - side * rBase, baseY);
    g.quadraticCurveTo(cx - side * rWaist * 0.7, (baseY + waistY) / 2, cx - side * rWaist, waistY);
    g.quadraticCurveTo(cx - side * rTop * 0.9, (waistY + topY) / 2, cx - side * rTop, topY);
  };
  g.fillStyle = lingrad(g, cx - rBase, 0, cx + rBase, 0, [
    [0, shade(col, -0.28)], [0.4, shade(col, 0.08)], [0.6, col], [1, shade(col, -0.34)],
  ]);
  g.beginPath();
  profile(1);
  g.lineTo(cx + rTop, topY);
  g.quadraticCurveTo(cx + rWaist * 0.9, (waistY + topY) / 2, cx + rWaist, waistY);
  g.quadraticCurveTo(cx + rBase * 0.7, (baseY + waistY) / 2, cx + rBase, baseY);
  g.closePath(); g.fill();
  // vertical ribbing
  g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 1.5;
  for (let i = -3; i <= 3; i++) {
    const fx = i / 3;
    g.beginPath();
    g.moveTo(cx + fx * rBase, baseY);
    g.quadraticCurveTo(cx + fx * rWaist * 0.85, waistY, cx + fx * rTop, topY);
    g.stroke();
  }
  // lit mouth rim + shadowed throat
  g.fillStyle = shade(col, 0.22);
  g.beginPath(); g.ellipse(cx, topY, rTop, rTop * 0.16, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(10,10,14,0.55)';
  g.beginPath(); g.ellipse(cx, topY + 2, rTop * 0.8, rTop * 0.12, 0, 0, Math.PI * 2); g.fill();
  // standing steam
  g.fillStyle = 'rgba(200,204,210,0.10)';
  for (let s = 0; s < 5; s++) {
    g.beginPath();
    g.arc(cx + Math.sin(s * 1.7) * rTop * 0.4, topY - 20 - s * 26, rTop * (0.55 - s * 0.05), 0, Math.PI * 2);
    g.fill();
  }
}

// Telescopic gasometer: banded cylinder in an external lattice guide frame.
function gasHolder(g, cx, baseY, h, w, col) {
  const topY = baseY - h, r = w * 0.5;
  g.fillStyle = lingrad(g, cx - r, 0, cx + r, 0, [
    [0, shade(col, -0.3)], [0.45, col], [1, shade(col, -0.36)],
  ]);
  rrRect(g, cx - r, topY + 14, w, h - 14, 4); g.fill();
  // domed crown
  g.beginPath(); g.ellipse(cx, topY + 14, r, 16, 0, Math.PI, 0); g.fill();
  // telescopic bands
  g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    const yy = topY + 14 + (h - 14) * (i / 4);
    g.beginPath(); g.moveTo(cx - r, yy); g.lineTo(cx + r, yy); g.stroke();
  }
  // external lattice guide columns
  g.strokeStyle = 'rgba(40,40,50,0.85)'; g.lineWidth = 3;
  for (const s of [-1, 1]) {
    g.beginPath(); g.moveTo(cx + s * (r + 6), baseY); g.lineTo(cx + s * (r + 6), topY - 8); g.stroke();
  }
  g.lineWidth = 1.4; g.strokeStyle = 'rgba(40,40,50,0.6)';
  for (let i = 0; i < 7; i++) {
    const yy = topY - 8 + (h) * (i / 7);
    g.beginPath(); g.moveTo(cx - r - 6, yy); g.lineTo(cx + r + 6, yy + 18); g.stroke();
  }
}

// Tower crane: mast + horizontal jib + counter-jib with a hanging load line.
function towerCrane(g, x, topY, h) {
  g.fillStyle = '#2e2d38';
  g.fillRect(x, topY, 7, h);                       // mast
  g.fillRect(x - 130, topY - 6, 300, 7);           // jib + counter-jib
  g.fillStyle = '#26252f';
  g.fillRect(x - 150, topY - 20, 26, 20);          // counterweight
  g.strokeStyle = 'rgba(46,45,56,0.9)'; g.lineWidth = 2;
  for (let i = 0; i < 9; i++) {                     // jib lattice
    g.beginPath(); g.moveTo(x + 10 + i * 18, topY - 5); g.lineTo(x + 20 + i * 18, topY + 8); g.stroke();
  }
  // hoist line + hook
  g.fillStyle = '#2e2d38';
  g.fillRect(x + 120, topY, 1.6, 60);
  g.fillRect(x + 116, topY + 60, 10, 6);
  // mast bracing
  g.strokeStyle = 'rgba(46,45,56,0.8)'; g.lineWidth = 1.6;
  for (let i = 0; i < Math.floor(h / 26); i++) {
    g.beginPath(); g.moveTo(x, topY + i * 26); g.lineTo(x + 7, topY + (i + 1) * 26); g.stroke();
  }
}

// small rounded-rect helper (kept local to avoid touching shared paint utils)
function rrRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ---------------- mid factory line ----------------
function paintMid() {
  const W = 2048, H = 760;
  const { cv, g } = makeCanvas(W, H);
  const rng = makeRng(1213);
  const baseY = H - 10;

  const bodyCol = (t) => mix('#3f3e48', '#5b4f4c', t);

  let x = -40;
  while (x < W + 100) {
    const bw = rng.range(150, 320);
    const bh = rng.range(180, 420);
    const t = rng();
    const col = bodyCol(t * 0.6);
    // main mass with vertical gradient (sky glow rims the top)
    g.fillStyle = lingrad(g, 0, baseY - bh, 0, baseY, [
      [0, shade(col, 0.16)],
      [0.2, col],
      [1, shade(col, -0.4)],
    ]);
    g.fillRect(x, baseY - bh, bw, bh);
    // sawtooth factory roof or parapet
    if (rng.chance(0.5)) {
      g.fillStyle = shade(col, 0.1);
      const teeth = Math.floor(bw / 46);
      for (let i = 0; i < teeth; i++) {
        const tx = x + i * 46;
        g.beginPath();
        g.moveTo(tx, baseY - bh);
        g.lineTo(tx + 30, baseY - bh - 26);
        g.lineTo(tx + 30, baseY - bh);
        g.closePath(); g.fill();
        // glazed north face catching sky
        g.fillStyle = withA('#c8935e', 0.5);
        g.beginPath();
        g.moveTo(tx + 30, baseY - bh - 25);
        g.lineTo(tx + 44, baseY - bh);
        g.lineTo(tx + 30, baseY - bh);
        g.closePath(); g.fill();
        g.fillStyle = shade(col, 0.1);
      }
    } else {
      g.fillStyle = shade(col, -0.25);
      g.fillRect(x - 3, baseY - bh - 8, bw + 6, 8);
    }
    // window grid — a scatter of warm lit cells
    const cols = Math.floor(bw / 34), rows = Math.floor(bh / 60);
    for (let cxi = 0; cxi < cols; cxi++) {
      for (let ry = 0; ry < rows; ry++) {
        const wx = x + 12 + cxi * 34, wy = baseY - bh + 22 + ry * 60;
        if (rng.chance(0.32)) {
          g.fillStyle = withA(rng.chance(0.8) ? '#e8a45e' : '#c8d2e0', rng.range(0.35, 0.8));
          g.fillRect(wx, wy, 16, 22);
          g.fillStyle = 'rgba(20,16,14,0.5)';
          g.fillRect(wx + 7, wy, 1.4, 22);
          g.fillRect(wx, wy + 10, 16, 1.4);
        } else {
          g.fillStyle = 'rgba(16,17,24,0.55)';
          g.fillRect(wx, wy, 16, 22);
        }
      }
    }
    // rooftop water tank / stack
    if (rng.chance(0.45)) {
      g.fillStyle = shade(col, -0.14);
      const tw = rng.range(26, 40);
      g.fillRect(x + bw * 0.55, baseY - bh - 34, tw, 34);
      g.beginPath();
      g.moveTo(x + bw * 0.55 - 3, baseY - bh - 34);
      g.lineTo(x + bw * 0.55 + tw / 2, baseY - bh - 48);
      g.lineTo(x + bw * 0.55 + tw + 3, baseY - bh - 34);
      g.closePath(); g.fill();
    }
    if (rng.chance(0.4)) {
      const sw = rng.range(16, 24);
      const sh = rng.range(80, 170);
      g.fillStyle = lingrad(g, x + bw + 10, 0, x + bw + 10 + sw, 0, [
        [0, shade(col, 0.1)], [0.5, shade(col, -0.1)], [1, shade(col, -0.4)],
      ]);
      g.fillRect(x + bw + 10, baseY - bh - sh, sw, bh + sh);
      // banding
      g.fillStyle = 'rgba(200,120,80,0.35)';
      g.fillRect(x + bw + 10, baseY - bh - sh + 14, sw, 5);
      g.fillStyle = 'rgba(230,230,235,0.2)';
      g.fillRect(x + bw + 10, baseY - bh - sh + 26, sw, 5);
    }
    x += bw + rng.range(30, 110);
  }

  // gantry crane silhouette
  const gx = W * 0.32, gy = baseY - 320;
  g.fillStyle = '#33323c';
  g.fillRect(gx, gy, 8, 320);
  g.fillRect(gx + 210, gy, 8, 320);
  g.fillRect(gx - 40, gy, 320, 10);
  g.fillRect(gx - 40, gy + 10, 6, 26);
  // cable + hook
  g.fillRect(gx + 120, gy + 10, 2.4, 74);
  g.fillRect(gx + 114, gy + 84, 14, 8);
  // truss cross-bracing
  g.strokeStyle = 'rgba(60,58,70,0.9)'; g.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    g.beginPath();
    g.moveTo(gx - 40 + i * 54, gy + 10);
    g.lineTo(gx + 14 + i * 54, gy);
    g.stroke();
  }

  // ---- landmark structures: cooling towers, a gasometer, tower crane ----
  // Placed by hand at spread positions (not a uniform loop) so the skyline
  // has recognisable, non-repeating silhouettes.
  coolingTower(g, W * 0.08, baseY, 300, 150, bodyCol(0.35));
  coolingTower(g, W * 0.86, baseY, 250, 128, bodyCol(0.5));
  gasHolder(g, W * 0.58, baseY, 168, 150, bodyCol(0.42));
  towerCrane(g, W * 0.7, baseY - 250, 250);

  // atmosphere: haze wash rising from the base
  g.fillStyle = lingrad(g, 0, H - 380, 0, H, [
    [0, 'rgba(190,140,100,0)'],
    [0.7, 'rgba(186,136,98,0.22)'],
    [1, 'rgba(178,132,100,0.42)'],
  ]);
  g.fillRect(0, 0, W, H);
  return cv;
}

// ---------------- near neon city ----------------
// The closest parallax band, and the layer that replaced the world-space
// building facades that used to stand directly behind the player. Those were
// full-detail brick walls a few metres behind the action and they flattened
// every fight into a corridor; this reads as a city the street runs through
// instead of a wall the street runs along.
//
// Deliberately kept to silhouette + light: block masses, a scatter of lit
// windows, and neon signage. No brick texture, no door furniture — nothing
// that competes for attention with an operator standing in front of it.

const NEON = ['#ff4d6d', '#3fd2ff', '#b26bff', '#ffd166', '#39e6a0'];

function neonSign(g, x, y, w, h, col, rng) {
  // glow pool first, then the tube itself — cheap two-pass emissive
  g.save();
  g.globalCompositeOperation = 'lighter';
  const glow = radgrad(g, x + w / 2, y + h / 2, Math.max(w, h) * 1.6, [
    [0, withA(col, 0.5)], [0.45, withA(col, 0.16)], [1, withA(col, 0)],
  ]);
  g.fillStyle = glow;
  g.fillRect(x - w, y - h * 1.6, w * 3, h * 4.2);
  g.restore();

  g.strokeStyle = col;
  g.lineWidth = 2.4;
  g.lineCap = 'round';
  // vertical strip signs read as hanging shop boards; horizontal as rooftop
  if (h > w) {
    const seg = Math.max(2, Math.floor(h / 13));
    for (let i = 0; i < seg; i++) {
      if (rng.chance(0.22)) continue;                 // dead tubes
      const sy = y + 5 + i * 13;
      g.beginPath(); g.moveTo(x + 2, sy); g.lineTo(x + w - 2, sy); g.stroke();
    }
  } else {
    g.beginPath();
    g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2);
    g.stroke();
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(x + 3, y + h / 2 - 5); g.lineTo(x + w - 3, y + h / 2 - 5);
    g.stroke();
  }
  g.restore?.();
}

function paintNear() {
  const W = 2048, H = 560;
  const { cv, g } = makeCanvas(W, H);
  const rng = makeRng(7731);
  const baseY = H;

  let x = -60;
  while (x < W + 120) {
    const bw = rng.range(110, 210);
    const bh = rng.range(190, 470);
    const top = baseY - bh;
    // Cool, desaturated concrete — the neon is the only saturated thing in
    // this layer, which is what makes it read as night-time city.
    const col = mix('#242833', '#33313f', rng());
    g.fillStyle = lingrad(g, 0, top, 0, baseY, [
      [0, shade(col, 0.2)],
      [0.35, col],
      [1, shade(col, -0.45)],
    ]);
    g.fillRect(x, top, bw, bh);

    // parapet cap
    g.fillStyle = shade(col, -0.3);
    g.fillRect(x - 4, top - 7, bw + 8, 7);

    // balcony bands — a couple of horizontal shelves break up the slab and
    // instantly say "apartment block" rather than "warehouse"
    if (rng.chance(0.62)) {
      g.fillStyle = 'rgba(12,14,20,0.5)';
      const bands = Math.floor(bh / 74);
      for (let i = 1; i <= bands; i++) {
        g.fillRect(x - 3, top + i * 74, bw + 6, 5);
      }
    }

    // lit window scatter
    const cols = Math.max(1, Math.floor(bw / 30));
    const rows = Math.max(1, Math.floor(bh / 46));
    for (let ci = 0; ci < cols; ci++) {
      for (let ri = 0; ri < rows; ri++) {
        const wx = x + 9 + ci * 30, wy = top + 16 + ri * 46;
        if (wx + 13 > x + bw - 4) continue;
        if (rng.chance(0.3)) {
          const warm = rng.chance(0.72);
          g.fillStyle = withA(warm ? '#ffbe6e' : '#9fd4ff', rng.range(0.4, 0.85));
          g.fillRect(wx, wy, 13, 18);
        } else {
          g.fillStyle = 'rgba(10,12,18,0.62)';
          g.fillRect(wx, wy, 13, 18);
        }
      }
    }

    // neon: a rooftop bar or a tall hanging sign on the facade
    if (rng.chance(0.5)) {
      const col2 = NEON[rng.int(0, NEON.length - 1)];
      if (rng.chance(0.5)) {
        neonSign(g, x + bw * 0.18, top - 20, bw * 0.64, 11, col2, rng);
      } else {
        neonSign(g, x + bw * 0.66, top + 40, 15, rng.range(70, 150), col2, rng);
      }
    }

    // rooftop aerial / chimney stack
    if (rng.chance(0.4)) {
      g.fillStyle = shade(col, -0.35);
      const sw = rng.range(7, 13);
      const sh = rng.range(30, 80);
      g.fillRect(x + bw * 0.72, top - sh, sw, sh);
      // aviation warning lamp
      g.fillStyle = 'rgba(255,70,70,0.85)';
      g.fillRect(x + bw * 0.72 - 1, top - sh - 3, sw + 2, 3);
    }

    x += bw + rng.range(14, 58);
  }

  // base haze so the layer sits into the street rather than on top of it
  g.fillStyle = lingrad(g, 0, H - 200, 0, H, [
    [0, 'rgba(120,132,164,0)'],
    [1, 'rgba(118,130,160,0.34)'],
  ]);
  g.fillRect(0, 0, W, H);
  return cv;
}
