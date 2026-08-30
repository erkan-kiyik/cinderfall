// Background paintings: a sky ramp, a drifting cloud bank, and a single
// contiguous wall of New York-style tenement apartments.
//
// There used to be three building layers here — a hazed industrial skyline, a
// factory line with cooling towers and gasometers, and a neon block band. All
// of that is gone. The sector reads as a city street now, so the backdrop is
// exactly one thing: apartments, joined shoulder to shoulder the way a real
// Manhattan block is, with no gap, no factory and no horizon clutter behind
// them.

import { makeCanvas, lingrad, radgrad, shade, mix, withA } from './paint.js';
import { makeRng } from '../engine/math.js';
import { device } from '../engine/device.js';

const SKY_W = 1600, SKY_H = 900;

// ---------------- depth grade ----------------
// Aerial perspective, baked once at boot: the further a parallax layer sits,
// the more it loses saturation and value and the softer its edges get. Doing
// it here rather than per frame matters — a runtime canvas `filter` on
// full-screen layers would be one of the most expensive steps in the render
// loop, and none of this ever changes once painted.
export const DEPTH_GRADE = {
  sky:    { brightness: 0.78, saturate: 0.82 },                        // stretched, never tiled — no blur to gain
  clouds: { brightness: 0.70, saturate: 0.62, blur: 2.6, wrap: true },
  // The one building layer. It sits closest to the play surface, so it keeps
  // the most contrast — but it is still graded down enough that the characters
  // in front of it remain the brightest thing on screen.
  //
  // The blur is the depth-of-field cue. It was 0.5, which is below the
  // threshold where the eye reads "out of focus" at all — the apartments were
  // simply slightly soft. At 1.8 the facade detail (window mullions, fire
  // escapes, panel joints) goes just far enough out of focus that the stick
  // figure and the cover he is fighting from become the plane the eye settles
  // on, without the backdrop turning into mush. Baked once at boot, so the
  // focus pull costs nothing per frame.
  city:   { brightness: 0.62, saturate: 0.72, blur: 1.8, wrap: true },
  // Depth of field cuts both ways: the near plane is out of focus too, and
  // more so than the far one, because it is closer to the lens than the
  // subject is. Darkened rather than brightened for the same reason the
  // building layer is — the characters stay the brightest thing on screen.
  fore:   { brightness: 0.55, saturate: 0.6, blur: 2.4, wrap: true },
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
    city: paintCityBlock(),
    haze: paintHazeBank(),
    fore: paintForeground(),
  };
  for (const layer of Object.keys(DEPTH_GRADE)) depthTreat(bg[layer], DEPTH_GRADE[layer]);
  return bg;
}

// ---------------- foreground kerb ----------------
// The stack ran sky 0.05, apartments 0.42, haze 0.55, street 1.0 — and then
// stopped. There was nothing in FRONT of the play surface at all, which is
// the single strongest depth cue a side-scroller has: the eye reads depth
// from differential motion, and differential motion only exists in one
// direction if nothing ever moves faster than the subject.
//
// So this is the near plane: the far kerb of the road, seen across it, with
// the rubble and cable spans that collect against a kerb in a district nobody
// has cleared in forty days. It scrolls at 1.24, so it visibly outruns the
// street the operator is standing on.
//
// It lives strictly BELOW the play surface. That is the whole design
// constraint: a foreground layer that crosses the characters looks superb in
// a screenshot and is indefensible in a shooter, where the player has to read
// their own feet and a hostile's hitbox at all times. Everything here is
// painted downward from the anchor, and the tallest element stops short of
// the road — see FORE_TOP_CLEAR. Nothing in this layer can ever occlude a
// target.
//
// It is also near-black by design. This is a silhouette band catching a
// little bounce light off the road, not a second scene: the moment it carries
// readable detail it competes with the characters, which is the opposite of
// what a foreground is for.
const FORE_W = 2048;
const FORE_H = 240;
const FORE_TOP_CLEAR = 12;   // px of empty margin at the top of the strip
function paintForeground() {
  const { cv, g } = makeCanvas(FORE_W, FORE_H);
  const rng = makeRng(9137);

  // Kerb face: the flat top edge the eye reads as "this is a solid surface
  // between me and the street", then the shadowed face falling away from it.
  const kerbTop = FORE_TOP_CLEAR + 10;
  g.fillStyle = lingrad(g, 0, kerbTop, 0, kerbTop + 26, [
    [0, '#171a20'], [0.16, '#0f1217'], [1, '#070910'],
  ]);
  g.fillRect(0, kerbTop, FORE_W, FORE_H - kerbTop);

  // The lit lip along the top of the kerb — the only genuinely bright line in
  // the layer, and what keeps the band from reading as a black bar across the
  // bottom of the screen.
  g.fillStyle = 'rgba(164,178,200,0.42)';
  g.fillRect(0, kerbTop, FORE_W, 1.6);
  g.fillStyle = 'rgba(104,116,138,0.20)';
  g.fillRect(0, kerbTop + 1.6, FORE_W, 2.4);

  // Kerb stones: the joints between them are what stop the lip being one
  // unbroken 2048px line, which is what would give the tiling away.
  let x = rng.range(0, 60);
  while (x < FORE_W) {
    const wSeg = rng.range(90, 190);
    g.fillStyle = 'rgba(4,5,8,0.75)';
    g.fillRect(x, kerbTop, 2.2, rng.range(9, 18));
    // a stone sitting slightly proud of its neighbours
    if (rng.range(0, 1) < 0.3) {
      const lift = rng.range(0.8, 2.4);
      g.fillStyle = '#12151b';
      g.fillRect(x + 2.2, kerbTop - lift, wSeg - 2.2, lift + 3);
      g.fillStyle = 'rgba(150,164,186,0.22)';
      g.fillRect(x + 2.2, kerbTop - lift, wSeg - 2.2, 1.2);
    }
    x += wSeg;
  }

  // Rubble heaped against the kerb. Wrap-aware — a mound straddling the seam
  // is drawn on both sides so the repeat has no visible edge, same rule the
  // cloud and haze banks follow.
  const mound = (mx, w, h) => {
    for (const ox of [mx, mx - FORE_W, mx + FORE_W]) {
      if (ox + w < 0 || ox - w > FORE_W) continue;
      g.fillStyle = '#0b0d13';
      g.beginPath();
      g.moveTo(ox - w, kerbTop + 4);
      let px = ox - w;
      while (px < ox + w) {
        const t = (px - (ox - w)) / (2 * w);
        const yy = kerbTop + 4 - Math.sin(t * Math.PI) * h * rng.range(0.86, 1.06);
        g.lineTo(px, yy);
        px += rng.range(4, 11);
      }
      g.lineTo(ox + w, kerbTop + 4);
      g.closePath();
      g.fill();
      // A couple of chunks catching the same top light as the kerb lip, so the
      // mound reads as broken masonry rather than a black hill.
      for (let i = 0; i < 4; i++) {
        const cx2 = ox + rng.range(-w * 0.8, w * 0.8);
        const cy2 = kerbTop + 2 - rng.range(0, h * 0.7);
        g.fillStyle = `rgba(126,138,158,${rng.range(0.05, 0.14).toFixed(3)})`;
        g.fillRect(cx2, cy2, rng.range(2, 7), rng.range(1, 2.2));
      }
    }
  };
  for (let i = 0; i < 9; i++) {
    mound(rng.range(0, FORE_W), rng.range(50, 150), rng.range(6, FORE_TOP_CLEAR + 8));
  }

  // Downed cable spans, hanging from off the top of the strip into the kerb.
  // These are the fastest-reading depth cue in the layer because they are the
  // only thing in it with a curve.
  g.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const x0 = rng.range(0, FORE_W), len = rng.range(120, 330);
    const sag = rng.range(10, 26);
    g.strokeStyle = `rgba(3,4,7,${rng.range(0.6, 0.85).toFixed(2)})`;
    g.lineWidth = rng.range(1.4, 3.2);
    g.beginPath();
    g.moveTo(x0, kerbTop - rng.range(0, FORE_TOP_CLEAR));
    g.quadraticCurveTo(x0 + len / 2, kerbTop + sag, x0 + len, kerbTop - rng.range(0, FORE_TOP_CLEAR));
    g.stroke();
  }

  // Ground haze pooling along the kerb, so the band does not end on a hard
  // horizontal edge at the bottom of the frame.
  const fade = lingrad(g, 0, kerbTop - 6, 0, kerbTop + 40, [
    [0, 'rgba(18,22,30,0.5)'], [1, 'rgba(18,22,30,0)'],
  ]);
  g.fillStyle = fade;
  g.fillRect(0, kerbTop - 6, FORE_W, 46);
  return cv;
}

// ---------------- drifting haze ----------------
// A ragged band of smoke/dust that scrolls between the apartments and the
// street. It is deliberately its own layer rather than another screen-space
// gradient: a flat wash sits still while the camera moves and reads as a
// filter over the lens, whereas this parallaxes, so the air itself has depth.
//
// The bank is painted with a hard alpha ceiling and no opaque core — it has to
// veil the building line without ever hiding a hostile standing in front of
// it. It is not depth-graded (it is airborne dust, not a distant solid), so it
// is built after the grade loop reads its layers.
function paintHazeBank() {
  const W = 2048, H = 300;
  const { cv, g } = makeCanvas(W, H);
  const rng = makeRng(4471);

  // Wrap-aware, same reasoning as the cloud bank: a puff straddling the tile
  // seam is drawn on both sides so the scroll has no visible repeat edge.
  //
  // The gradient is built *inside* the translate/scale, centred on the local
  // origin the arc is drawn around. A canvas gradient is defined in the user
  // space current when it is created, and the transform in force at fill time
  // re-maps it — so building it at (x, y) and then translating to (x, y) puts
  // the gradient's centre at roughly double the intended offset, leaving the
  // arc filled with the transparent outer stop. Setting the transform first
  // keeps the falloff concentric with the shape.
  const puff = (x, y, rx, ry, a) => {
    for (const ox of [0, -W, W]) {
      if (x + ox + rx < -4 || x + ox - rx > W + 4) continue;
      g.save();
      g.translate(x + ox, y);
      g.scale(1, ry / rx);
      g.fillStyle = radgrad(g, 0, 0, rx, [
        [0, withA('#8e94a4', a)],
        [0.55, withA('#7c8494', a * 0.45)],
        [1, 'rgba(120,128,144,0)'],
      ]);
      g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill();
      g.restore();
    }
  };

  // Two rows at different heights so the band has a torn top edge instead of
  // reading as one uniform ribbon. The lower row is the body of the bank; the
  // upper row is thinner wisps lifting off it.
  //
  // The alphas stay low on purpose. This layer lands on pixels the scene
  // already works — the street-level fog gradient, the aerial-perspective haze
  // and, on a fog or storm stage, the weather pass. Painted at a value that
  // looks right in isolation it stacks into mud on the worst-weather stages,
  // so it is tuned to be the thing you notice *moving* rather than the thing
  // you notice.
  for (let i = 0; i < 34; i++) {
    puff(rng.range(0, W), rng.range(150, 250), rng.range(170, 330), rng.range(40, 82), rng.range(0.07, 0.15));
  }
  for (let i = 0; i < 18; i++) {
    puff(rng.range(0, W), rng.range(60, 150), rng.range(120, 240), rng.range(28, 58), rng.range(0.04, 0.09));
  }
  return cv;
}

// ---------------- sky ----------------
// Painted at dusk. The live time-of-day tint is applied at draw time over the
// whole parallax stack (see engine/daycycle.js + World.drawBackground), so
// this bake stays neutral enough to sit under any hour.
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

// =====================================================================
//                    NYC TENEMENT BLOCK (the only building layer)
// =====================================================================
// A real Manhattan block is one unbroken wall of masonry: party walls shared
// between neighbours, no alley, no sky between buildings. Heights and facade
// colours change at every property line, and that stepped roofline plus the
// vertical seam is the entire silhouette. So this is painted as a contiguous
// run — `x += bw` with no gap — and the variation comes from the buildings
// themselves rather than from spacing.

// Brick / brownstone / limestone palette, the range a NYC block actually runs.
const FACADE_COLS = [
  '#5a3b32',  // red brick
  '#4a3129',  // dark brick
  '#6b4a3a',  // brownstone
  '#3f3a3d',  // soot-grey brick
  '#6d6153',  // limestone
  '#54413a',  // faded red
];

const NEON = ['#ff4d6d', '#3fd2ff', '#b26bff', '#ffd166', '#39e6a0'];

// ---- facade helpers ----

// Brick coursing plus grime. Horizontal courses read as masonry where the old
// vertical panel joints read as a curtain-wall office block, which is exactly
// the wrong building type for this street.
function brickCourses(g, x, y, w, h, col, rng) {
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  // mortar courses
  g.strokeStyle = withA(shade(col, 0.22), 0.16);
  g.lineWidth = 1;
  for (let jy = y + 5; jy < y + h; jy += 7) {
    g.beginPath(); g.moveTo(x, jy); g.lineTo(x + w, jy); g.stroke();
  }
  // broken vertical joints, offset course to course so it reads as bond
  g.strokeStyle = withA(shade(col, 0.16), 0.10);
  for (let jy = y + 5, row = 0; jy < y + h; jy += 7, row++) {
    const off = (row % 2) * 7;
    for (let jx = x + off; jx < x + w; jx += 14) {
      g.beginPath(); g.moveTo(jx, jy); g.lineTo(jx, jy + 7); g.stroke();
    }
  }
  // soot washing down from the cornice, heavier at the top
  g.fillStyle = 'rgba(6,8,13,0.13)';
  for (let i = 0; i < 6; i++) {
    const sx = x + rng() * w;
    g.fillRect(sx, y, rng.range(2, 6), rng.range(h * 0.15, h * 0.6));
  }
  // grain
  for (let i = 0; i < 110; i++) {
    g.fillStyle = rng.chance(0.5) ? 'rgba(255,240,220,0.022)' : 'rgba(0,0,0,0.05)';
    g.fillRect(x + rng() * w, y + rng() * h, 1, 1);
  }
  g.restore();
}

// Heavy projecting cornice — the single most recognisable tenement feature,
// and what makes the roofline read as pre-war brick rather than a flat parapet.
function cornice(g, x, y, w, col) {
  // shadow the cornice casts on the wall below it
  g.fillStyle = 'rgba(6,8,13,0.4)';
  g.fillRect(x, y + 9, w, 5);
  // bed mould
  g.fillStyle = shade(col, 0.1);
  g.fillRect(x - 3, y + 5, w + 6, 5);
  // corbel brackets along the underside
  g.fillStyle = shade(col, -0.12);
  for (let bx = x + 4; bx < x + w - 4; bx += 15) g.fillRect(bx, y + 9, 5, 4);
  // crown
  g.fillStyle = lingrad(g, 0, y - 4, 0, y + 6, [
    [0, shade(col, 0.3)], [1, shade(col, -0.05)],
  ]);
  g.fillRect(x - 5, y - 4, w + 10, 10);
  // top fillet catching sky
  g.fillStyle = shade(col, 0.42);
  g.fillRect(x - 5, y - 4, w + 10, 1.8);
}

// Stone sill + lintel around an opening. Cheap, but it is the difference
// between a window and a hole punched in a wall.
function windowTrim(g, wx, wy, ww, wh, col) {
  g.fillStyle = shade(col, 0.26);
  g.fillRect(wx - 2, wy - 3.5, ww + 4, 3.5);       // lintel
  g.fillStyle = shade(col, 0.34);
  g.fillRect(wx - 2.5, wy + wh, ww + 5, 3);        // sill, projecting
  g.fillStyle = 'rgba(6,8,13,0.45)';
  g.fillRect(wx - 2.5, wy + wh + 3, ww + 5, 1.6);  // sill shadow
}

// Wall-mounted air-conditioning box on its bracket — sat in the window opening
// the way they actually are, not bolted to blank wall.
function acUnit(g, x, y, col) {
  g.fillStyle = shade(col, 0.2);
  g.fillRect(x, y, 12, 8);
  g.fillStyle = 'rgba(6,8,13,0.55)';
  g.fillRect(x, y + 8, 12, 2);
  g.strokeStyle = 'rgba(6,8,13,0.4)'; g.lineWidth = 0.7;
  for (let i = 1; i < 4; i++) {
    g.beginPath(); g.moveTo(x + i * 3, y + 1.4); g.lineTo(x + i * 3, y + 6.6); g.stroke();
  }
}

// Zig-zag fire escape: landings joined by angled stair flights, plus the
// drop-ladder at the bottom. On a NYC tenement this runs the full height of
// the front facade, so it is drawn as a single storey-aligned run.
function fireEscape(g, x, y, h, floorH, rng) {
  const W = 30;
  const n = Math.max(2, Math.round(h / floorH));
  g.strokeStyle = 'rgba(10,12,18,0.72)';
  g.fillStyle = 'rgba(10,12,18,0.72)';
  // vertical stringers
  g.lineWidth = 1.7;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + n * floorH); g.stroke();
  g.beginPath(); g.moveTo(x + W, y); g.lineTo(x + W, y + n * floorH); g.stroke();
  for (let i = 0; i < n; i++) {
    const ly = y + i * floorH;
    g.fillRect(x - 2, ly, W + 4, 2.6);                    // landing deck
    g.lineWidth = 0.9;
    for (let rx = x; rx <= x + W; rx += 6) {              // railing uprights
      g.beginPath(); g.moveTo(rx, ly); g.lineTo(rx, ly - 11); g.stroke();
    }
    g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x - 2, ly - 11); g.lineTo(x + W + 2, ly - 11); g.stroke();
    if (i < n - 1) {                                      // stair flight
      const l2r = i % 2 === 0;
      const x0 = l2r ? x + 2 : x + W - 2;
      const x1 = l2r ? x + W - 2 : x + 2;
      g.lineWidth = 1.7;
      g.beginPath(); g.moveTo(x0, ly + 2.6); g.lineTo(x1, ly + floorH); g.stroke();
      g.lineWidth = 0.8;
      for (let s = 0.15; s < 1; s += 0.2) {
        const tx = x0 + (x1 - x0) * s, ty = ly + 2.6 + (floorH - 2.6) * s;
        g.beginPath(); g.moveTo(tx - 2, ty); g.lineTo(tx + 2, ty); g.stroke();
      }
    }
  }
  // drop ladder hanging off the lowest landing
  g.lineWidth = 1.3;
  const by = y + (n - 1) * floorH + 2.6;
  g.beginPath(); g.moveTo(x + 7, by); g.lineTo(x + 7, by + 26); g.stroke();
  g.beginPath(); g.moveTo(x + 15, by); g.lineTo(x + 15, by + 26); g.stroke();
  for (let ry = by + 4; ry < by + 26; ry += 5) {
    g.beginPath(); g.moveTo(x + 7, ry); g.lineTo(x + 15, ry); g.stroke();
  }
}

// Rooftop water tank on its stilt frame — the classic tenement roofline.
function waterTank(g, x, baseY, col, rng) {
  const w = rng.range(20, 30), h = rng.range(18, 26), legH = rng.range(9, 15);
  const y = baseY - legH - h;
  g.strokeStyle = 'rgba(8,10,16,0.75)'; g.lineWidth = 1.8;
  for (const lx of [x + 2, x + w - 2]) {
    g.beginPath(); g.moveTo(lx, y + h); g.lineTo(lx, baseY); g.stroke();
  }
  g.beginPath(); g.moveTo(x + 2, y + h + legH * 0.5); g.lineTo(x + w - 2, y + h + legH * 0.5); g.stroke();
  // cedar barrel
  g.fillStyle = lingrad(g, x, y, x + w, y, [
    [0, '#6a4c33'], [0.45, '#8a6644'], [1, '#3f2c1e'],
  ]);
  g.fillRect(x, y, w, h);
  // staves
  g.strokeStyle = 'rgba(20,12,6,0.3)'; g.lineWidth = 0.6;
  for (let sx = x + 3; sx < x + w; sx += 4) {
    g.beginPath(); g.moveTo(sx, y); g.lineTo(sx, y + h); g.stroke();
  }
  // iron hoops
  g.strokeStyle = 'rgba(6,8,13,0.5)'; g.lineWidth = 1.1;
  for (let i = 1; i < 3; i++) {
    g.beginPath(); g.moveTo(x, y + (h / 3) * i); g.lineTo(x + w, y + (h / 3) * i); g.stroke();
  }
  // conical lid
  g.fillStyle = '#2e2823';
  g.beginPath();
  g.moveTo(x - 2, y); g.lineTo(x + w / 2, y - 7); g.lineTo(x + w + 2, y);
  g.closePath(); g.fill();
}

// Roof bulkhead — the stair head-house every walk-up has.
function bulkhead(g, x, baseY, w, h, col) {
  g.fillStyle = lingrad(g, x, 0, x + w, 0, [
    [0, shade(col, -0.1)], [0.5, shade(col, -0.24)], [1, shade(col, -0.4)],
  ]);
  g.fillRect(x, baseY - h, w, h);
  g.fillStyle = shade(col, 0.06);
  g.fillRect(x - 2, baseY - h - 3, w + 4, 3);
  // door
  g.fillStyle = 'rgba(8,10,15,0.6)';
  g.fillRect(x + w * 0.32, baseY - h * 0.62, w * 0.36, h * 0.62);
}

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

  g.save();
  g.strokeStyle = col;
  g.lineWidth = 2.4;
  g.lineCap = 'round';
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
  g.restore();
}

// Ground-floor storefront: the retail band under every tenement. Gives the
// bottom of the block a different rhythm from the residential floors above,
// which is what stops a tall facade reading as one repeating stamp.
function storefront(g, x, baseY, w, h, col, rng) {
  // recessed shopfront box
  g.fillStyle = 'rgba(9,11,16,0.72)';
  g.fillRect(x, baseY - h, w, h);
  // pier at each end (the masonry the upper floors actually sit on)
  g.fillStyle = shade(col, -0.22);
  g.fillRect(x, baseY - h, 7, h);
  g.fillRect(x + w - 7, baseY - h, 7, h);
  // transom + display glass, lit from inside about half the time
  const open = rng.chance(0.45);
  if (open) {
    const tint = rng.chance(0.5) ? '#ffd9a0' : '#bfe6ff';
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = radgrad(g, x + w / 2, baseY - h * 0.5, w * 0.8, [
      [0, withA(tint, 0.30)], [0.6, withA(tint, 0.10)], [1, withA(tint, 0)],
    ]);
    g.fillRect(x - 12, baseY - h - 12, w + 24, h + 24);
    g.restore();
    g.fillStyle = withA(tint, 0.5);
    g.fillRect(x + 9, baseY - h + 7, w - 18, h - 20);
    // mullions across the display window
    g.fillStyle = 'rgba(10,10,14,0.6)';
    for (let mx = x + 9 + (w - 18) / 3; mx < x + w - 9; mx += (w - 18) / 3) {
      g.fillRect(mx, baseY - h + 7, 1.6, h - 20);
    }
  } else {
    // shutter down
    g.fillStyle = 'rgba(26,28,34,0.9)';
    g.fillRect(x + 8, baseY - h + 7, w - 16, h - 18);
    g.strokeStyle = 'rgba(8,9,12,0.5)'; g.lineWidth = 0.8;
    for (let sy = baseY - h + 9; sy < baseY - 11; sy += 3.4) {
      g.beginPath(); g.moveTo(x + 8, sy); g.lineTo(x + w - 8, sy); g.stroke();
    }
  }
  // awning over the shopfront
  if (rng.chance(0.5)) {
    const aw = w - 6;
    g.fillStyle = withA(rng.chance(0.5) ? '#7b2f34' : '#2f4f3f', 0.85);
    g.beginPath();
    g.moveTo(x + 3, baseY - h + 5);
    g.lineTo(x + 3 + aw, baseY - h + 5);
    g.lineTo(x + 3 + aw - 4, baseY - h + 17);
    g.lineTo(x + 7, baseY - h + 17);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(6,8,13,0.35)';
    g.fillRect(x + 7, baseY - h + 17, aw - 8, 2);
  }
  // stoop steps beside the shop — the other half of a tenement ground floor
  if (rng.chance(0.4)) {
    g.fillStyle = shade(col, -0.3);
    for (let i = 0; i < 4; i++) {
      g.fillRect(x + w * 0.72, baseY - 4 - i * 4, w * 0.24 - i * 3, 4);
    }
  }
}

// ---------------- the block ----------------
function paintCityBlock() {
  const W = 2048, H = 620;
  const { cv, g } = makeCanvas(W, H);
  const rng = makeRng(7731);
  const baseY = H;

  // Contiguous run: each building starts exactly where the last one ended.
  // `x` is never advanced by a gap — that is the whole point of the layer.
  let x = -70;
  let prevTop = null;
  while (x < W + 130) {
    const bw = rng.range(120, 235);
    const bh = rng.range(300, 560);
    const top = baseY - bh;
    const col = FACADE_COLS[rng.int(0, FACADE_COLS.length - 1)];

    // storey height drives the window grid, the fire escape landings and the
    // storefront, so they all line up like a real elevation
    const floorH = rng.range(44, 54);
    const shopH = floorH * 1.5;

    // ---- main mass ----
    g.fillStyle = lingrad(g, 0, top, 0, baseY, [
      [0, shade(col, 0.18)],
      [0.4, col],
      [1, shade(col, -0.5)],
    ]);
    g.fillRect(x, top, bw, bh);
    brickCourses(g, x, top, bw, bh, col, rng);

    // ---- party wall ----
    // Where two buildings meet there is no gap, just a seam: the neighbour's
    // wall in shadow, and a sliver of light on the near return.
    if (prevTop !== null) {
      g.fillStyle = 'rgba(6,8,13,0.5)';
      g.fillRect(x - 2, top, 3, bh);
      g.fillStyle = 'rgba(255,240,220,0.05)';
      g.fillRect(x + 1, top, 1.2, bh);
      // if this building is taller, its exposed flank rises above the neighbour
      if (top < prevTop) {
        g.fillStyle = 'rgba(6,8,13,0.28)';
        g.fillRect(x, top, 9, prevTop - top);
      }
    }

    // ---- cornice at the roofline ----
    cornice(g, x, top, bw, col);

    // ---- residential floors ----
    // Windows sit in regular bays. `bays` is derived from width so a wide
    // building gets more windows rather than wider ones.
    const bays = Math.max(2, Math.round((bw - 20) / 38));
    const bayW = (bw - 20) / bays;
    const ww = Math.min(17, bayW * 0.5), wh = floorH * 0.55;
    const floors = Math.floor((bh - shopH - 18) / floorH);

    for (let f = 0; f < floors; f++) {
      const wy = top + 18 + f * floorH;
      for (let b = 0; b < bays; b++) {
        const wx = x + 10 + b * bayW + (bayW - ww) / 2;
        const lit = rng.chance(0.34);
        if (lit) {
          const warm = rng.chance(0.76);
          const tint = warm ? '#ffbe6e' : '#9fd4ff';
          const a = rng.range(0.42, 0.9);
          // Soft bleed: a lit room throws light onto the brick around its
          // opening. This is the detail that stops windows reading as
          // stickers on a flat wall.
          g.save();
          g.globalCompositeOperation = 'lighter';
          g.fillStyle = radgrad(g, wx + ww / 2, wy + wh / 2, 26, [
            [0, withA(tint, a * 0.28)],
            [0.5, withA(tint, a * 0.09)],
            [1, withA(tint, 0)],
          ]);
          g.fillRect(wx - 20, wy - 16, ww + 40, wh + 34);
          g.restore();
          g.fillStyle = withA(tint, a);
          g.fillRect(wx, wy, ww, wh);
          // double-hung sash: meeting rail across the middle, one mullion
          g.fillStyle = 'rgba(22,16,10,0.5)';
          g.fillRect(wx, wy + wh * 0.46, ww, 1.6);
          g.fillRect(wx + ww / 2 - 0.6, wy, 1.2, wh);
          // occasional occupant silhouette in the glass
          if (rng.chance(0.1)) {
            g.fillStyle = 'rgba(20,14,10,0.55)';
            g.fillRect(wx + ww * 0.3, wy + wh * 0.2, ww * 0.3, wh * 0.8);
          }
        } else {
          g.fillStyle = 'rgba(10,12,18,0.68)';
          g.fillRect(wx, wy, ww, wh);
          g.fillStyle = 'rgba(120,140,175,0.09)';   // sky in dark glass
          g.fillRect(wx, wy, ww, wh * 0.3);
        }
        windowTrim(g, wx, wy, ww, wh, col);
        // AC box sitting in the lower sash
        if (rng.chance(0.15)) acUnit(g, wx + ww * 0.5 - 6, wy + wh - 8, col);
      }
    }

    // ---- fire escape down the front ----
    // Required by law on NYC walk-ups, so most buildings carry one. Aligned to
    // the storey height and to a window bay, not floated arbitrarily.
    if (rng.chance(0.72) && floors >= 3) {
      const bay = rng.int(0, bays - 1);
      const fx = x + 10 + bay * bayW + (bayW - 30) / 2;
      fireEscape(g, fx, top + 18 + floorH * 0.82, floorH * (floors - 1), floorH, rng);
    }

    // ---- ground-floor storefront ----
    storefront(g, x + 2, baseY, bw - 4, shopH, col, rng);

    // ---- roofline furniture ----
    if (rng.chance(0.62)) waterTank(g, x + bw * rng.range(0.12, 0.5), top - 4, col, rng);
    if (rng.chance(0.5)) bulkhead(g, x + bw * rng.range(0.55, 0.78), top - 4, rng.range(22, 34), rng.range(18, 30), col);
    if (rng.chance(0.45)) {
      // brick chimney / vent stack
      g.fillStyle = shade(col, -0.3);
      const sw = rng.range(8, 14), sh = rng.range(20, 44);
      const sx2 = x + bw * rng.range(0.2, 0.85);
      g.fillRect(sx2, top - 4 - sh, sw, sh);
      g.fillStyle = shade(col, -0.1);
      g.fillRect(sx2 - 1.5, top - 4 - sh, sw + 3, 3);
    }
    if (rng.chance(0.3)) {
      // roof-edge aerial mast
      const mx = x + bw * rng.range(0.8, 0.94);
      const mh = rng.range(20, 44);
      g.strokeStyle = 'rgba(8,10,16,0.7)'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(mx, top - 4); g.lineTo(mx, top - 4 - mh); g.stroke();
      g.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        const ay = top - 4 - (mh / 4) * i;
        g.beginPath(); g.moveTo(mx - 5, ay); g.lineTo(mx + 5, ay); g.stroke();
      }
    }

    // ---- neon: a hanging shop blade sign or a rooftop board ----
    if (rng.chance(0.4)) {
      const col2 = NEON[rng.int(0, NEON.length - 1)];
      if (rng.chance(0.45)) {
        neonSign(g, x + bw * 0.2, top - 22, bw * 0.6, 11, col2, rng);
      } else {
        // vertical blade sign hung off the facade above the shopfront
        neonSign(g, x + bw * rng.range(0.6, 0.82), baseY - shopH - rng.range(80, 150), 15, rng.range(64, 130), col2, rng);
      }
    }

    prevTop = top;
    x += bw;                       // <-- contiguous: no gap between buildings
  }

  // base haze so the block sits into the street rather than on top of it
  g.fillStyle = lingrad(g, 0, H - 190, 0, H, [
    [0, 'rgba(120,132,164,0)'],
    [1, 'rgba(118,130,160,0.3)'],
  ]);
  g.fillRect(0, 0, W, H);
  return cv;
}
