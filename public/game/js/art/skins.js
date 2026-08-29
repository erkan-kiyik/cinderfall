// Weapon skins.
//
// A skin used to be two hex colours handed to the body painter — the whole
// "skin system" was a palette swap, and a Legendary looked exactly like a
// Common in a different shade. This module replaces that with real assets:
// every skin composites additional geometry and light on top of the baked
// body, so tiers are distinguishable by silhouette alone.
//
// What a skin can add, escalating by tier:
//   palette    the base metal/polymer colours (what used to be the whole thing)
//   coating    a surface treatment — camo hydrodip, carbon weave, chrome,
//              gloss lacquer, battle wear
//   engraving  etched pattern over the receiver
//   muzzle     a real muzzle device sticking out past the barrel
//   rail       an optic or laser mounted on the top rail
//   glow       emissive edge light plus an outer bloom halo
//
// Composition strategy: the base body is already a finished sprite, so rather
// than re-running (and re-parameterising) every body painter, a skin builds a
// larger canvas, stamps the base into it, and paints around and over it.
// Surface treatments use `source-atop`, which clips them to the weapon's own
// pixels for free — no masking geometry, no per-weapon shape knowledge.

import { makeCanvas, lingrad, radgrad, shade, withA, rr, ASSET_SCALE } from './paint.js';
import { makeRng } from '../engine/math.js';

// ---------------------------------------------------------------- mounts
// Where attachments bolt on, in each body's own local space (origin = the
// grip/trigger anchor, +x toward the muzzle). Measured off the body painters
// in weapons.js — see the "box:" comment at the top of each.
// `rail.y` for every entry below is the weapon's own DECK — the top surface
// a real accessory's mounting foot would rest on — not the top of whatever
// happens to be sitting there. That distinction is the whole bug this table
// used to have: every `rail.y` had been set to roughly where the body's own
// built-in optic/carry-handle/fin stack STARTS (its top edge), because that
// was the easiest thing to eyeball off the body art. But railDevice() below
// draws each attachment's shape growing upward FROM the mount point — so a
// mount pinned at an accessory's top left every skin-added scope, laser or
// holo sight floating 3-8 units above the gun with nothing connecting it to
// the body, on every single weapon that had one. `eshotgun` and `cryo`,
// which carry no built-in topside accessory at all, already had the deck
// value right (-8.6) — that's the number that was generalised to the rest.
//
// Verified per-weapon against a ruler overlay rendered on each body sprite
// (ax.rail.y crosshair against the receiver/frame's real top surface), not
// guessed from the paint code alone.
export const MOUNTS = {
  // conventional bodies
  rifle:  { muzzle: { x: 40,   y: -5.3, s: 1.0 },  rail: { x: 1,   y: -10.2, s: 1.0 },  span: [-20, 40] },
  // Pistol's barrel/slide is a *separate* sprite from its body (blowback
  // animation — see paintPistolSlide in weapons.js), composited on top only
  // at real render time. Both numbers above were eyeballed off the body
  // alone, which doesn't have a barrel on it at all, so muzzle devices sat
  // out near the rear sight and rail optics floated a full unit above the
  // slide. Re-measured against the body+slide composite (matching how
  // rig.js actually draws the gun): muzzle sits right at the slide's front
  // curve (bore centre ~y:-4.4), rail sits right on the slide's top deck
  // (~y:-6.9, just above its built-in iron sights). Also used by the RAY
  // GUN / QUANTUM energy pistols, which share this mount (see SKIN_BASES).
  pistol: { muzzle: { x: 11.8, y: -4.4, s: 0.5 },  rail: { x: 1,   y: -6.9,  s: 0.5 },  span: [-7, 11] },
  smg:    { muzzle: { x: 24,   y: -5.6, s: 0.8 },  rail: { x: 0,   y: -9.3,  s: 0.75 }, span: [-14, 24] },
  // Laser SMG: its own frame, so its own mounts. The aperture sits at 22.4.
  lasersmg: { muzzle: { x: 22.4, y: -5.9, s: 0.75 }, rail: { x: 1, y: -8.0,  s: 0.7 }, span: [-14, 23] },
  knife:  { muzzle: null,                          rail: null,                          span: [-6, 16] },
  // purpose-built energy / heavy bodies. Each has its own emitter geometry,
  // so the muzzle mount sits where that body's barrel actually ends rather
  // than at a shared guess.
  railgun:  { muzzle: { x: 39.4, y: -4.6, s: 0.95 }, rail: { x: 0, y: -8.5,  s: 0.95 }, span: [-20, 40] },
  particle: { muzzle: { x: 39.0, y: -3.9, s: 0.95 }, rail: { x: 0, y: -8.5,  s: 0.9 },  span: [-20, 39] },
  flame:    { muzzle: { x: 38.6, y: -4.2, s: 0.9 },  rail: { x: 0, y: -7.0,  s: 0.85 }, span: [-20, 39] },
  minigun:  { muzzle: { x: 41,   y: -2.5, s: 1.15 }, rail: { x: -8, y: -10.5, s: 1.0 }, span: [-22, 52] },
  rocket:   { muzzle: { x: 47,   y: 0,    s: 1.1 },  rail: { x: 2,  y: -8.5,  s: 1.0 }, span: [-26, 56] },

  // ---- modular-chassis weapons ------------------------------------------
  // These eleven share one receiver+grip (see paintChassis in weapons.js —
  // "identical across every chassis"), so they share one deck height too:
  // -8.6, confirmed against eshotgun's bare receiver (no topside accessory
  // to obscure it) and against where battle/sniper's own built-in scope and
  // lmg's carry handle actually meet the frame.
  //
  // Muzzle x/y still mirrors BARREL_TIP in weapons.js — that part was never
  // wrong, only rail.y was.
  battle:    { muzzle: { x: 49.0, y: -5.2, s: 1.0 },  rail: { x: 1,  y: -8.6, s: 1.0 },  span: [-22, 49] },
  lmg:       { muzzle: { x: 42.0, y: -5.1, s: 1.1 },  rail: { x: 1,  y: -8.6, s: 1.0 },  span: [-22, 42] },
  sniper:    { muzzle: { x: 47.0, y: -5.1, s: 1.0 },  rail: { x: 1,  y: -8.6, s: 1.05 }, span: [-21, 47] },
  plasma:    { muzzle: { x: 43.5, y: -5.0, s: 0.95 }, rail: { x: 1,  y: -8.6, s: 0.95 }, span: [-21, 44] },
  pulse:     { muzzle: { x: 47.0, y: -4.9, s: 0.95 }, rail: { x: 1,  y: -8.6, s: 0.9 },  span: [-17, 47] },
  eshotgun:  { muzzle: { x: 35.6, y: -5.0, s: 1.05 }, rail: { x: 1,  y: -8.6,  s: 0.85 }, span: [-14, 36] },
  ion:       { muzzle: { x: 46.0, y: -4.9, s: 0.95 }, rail: { x: 1,  y: -8.6, s: 0.95 }, span: [-21, 46] },
  emp:       { muzzle: { x: 44.0, y: -3.4, s: 1.0 },  rail: { x: 1,  y: -8.6, s: 0.9 },  span: [-17, 44] },
  gravity:   { muzzle: { x: 47.0, y: -4.9, s: 0.95 }, rail: { x: 1,  y: -8.6, s: 0.95 }, span: [-21, 47] },
  lightning: { muzzle: { x: 46.0, y: -4.9, s: 0.95 }, rail: { x: 1,  y: -8.6, s: 0.9 },  span: [-7, 46] },
  cryo:      { muzzle: { x: 47.0, y: -5.1, s: 0.95 }, rail: { x: 1,  y: -8.6,  s: 0.85 }, span: [-21, 47] },
};

// Padding is keyed off the mount kind, so a minigun gets room for its rotor
// cluster and a pistol does not waste canvas.
const PAD_BY_KIND = {
  rifle:    { l: 3, r: 18, t: 9,  b: 3 },
  pistol:   { l: 2, r: 9,  t: 7,  b: 2 },
  smg:      { l: 2, r: 13, t: 8,  b: 2 },
  lasersmg: { l: 2, r: 13, t: 9,  b: 2 },
  knife:    { l: 3, r: 4,  t: 4,  b: 4 },
  railgun:  { l: 3, r: 18, t: 9,  b: 3 },
  particle: { l: 3, r: 18, t: 9,  b: 3 },
  flame:    { l: 3, r: 18, t: 9,  b: 3 },
  minigun:  { l: 3, r: 20, t: 10, b: 4 },
  rocket:   { l: 3, r: 20, t: 10, b: 4 },
};

// Chassis weapons reuse the rifle's padding, widened on the right so a brake
// bolted to the longest barrel (x=49) still lands inside the canvas rather
// than being clipped at the edge.
for (const id of ['battle', 'lmg', 'sniper', 'plasma', 'pulse', 'eshotgun',
                  'ion', 'emp', 'gravity', 'lightning', 'cryo']) {
  PAD_BY_KIND[id] = { l: 3, r: 24, t: 11, b: 3 };
}



// ------------------------------------------------------------ composition

// Builds a padded canvas around `base`, blits the base in, and hands the
// painter a context whose origin sits on the base's own anchor — so callers
// can use the exact same coordinates the body painters use.
//
// `under` paints before the base (glow halos); `over` paints after.
function skinSprite(base, pad, under, over) {
  const S = ASSET_SCALE;
  const w = base.w + pad.l + pad.r;
  const h = base.h + pad.t + pad.b;
  const { cv, g } = makeCanvas(w * S, h * S);
  const ax = base.ax / S, ay = base.ay / S;      // base anchor, logical units

  const setLocal = () => {
    g.setTransform(S, 0, 0, S, 0, 0);
    g.translate(pad.l + ax, pad.t + ay);
  };

  if (under) { setLocal(); under(g); }
  // 1:1 device-pixel blit — the base is already rendered at ASSET_SCALE.
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(base.cv, pad.l * S, pad.t * S);
  if (over) { setLocal(); over(g); }

  g.setTransform(1, 0, 0, 1, 0, 0);
  return { cv, ax: (pad.l + ax) * S, ay: (pad.t + ay) * S, s: 1 / S, w, h };
}

// A flat colour cut to the base sprite's silhouette — the raw material for
// glow halos.
function silhouette(base, color) {
  const { cv, g } = makeCanvas(base.cv.width, base.cv.height);
  g.drawImage(base.cv, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, cv.width, cv.height);
  return cv;
}

// ---------------------------------------------------------------- coatings
// All of these run under `source-atop`, so they can only paint where the
// weapon already is. `span` is the body's x extent, used to size patterns.

function coatingPass(g, kind, span, palette, rng) {
  const [x0, x1] = span;
  const w = x1 - x0, y0 = -16, h = 30;
  g.save();
  g.globalCompositeOperation = 'source-atop';

  if (kind === 'hydrodip') {
    // Multicam blotches. The skin tables pick four colours close to the base
    // coat — which is what a real dip looks like on a paint chip and what it
    // looked like on the gun: nothing at all. Each blotch is now pushed away
    // from the base value, alternately lighter and darker, and given a
    // darker rim, so the pattern survives being 60 pixels wide on screen.
    const cols = palette.camo || ['#4c5340', '#3a4030', '#6b6a52', '#26291f'];
    for (let i = 0; i < 30; i++) {
      const c = cols[rng.int(0, cols.length - 1)];
      const lift = i % 2 ? rng.range(0.16, 0.34) : -rng.range(0.20, 0.40);
      const bx = x0 + rng() * w, by = y0 + rng() * h;
      const rx = rng.range(2.0, 6.0), ry = rng.range(1.4, 3.8), rot = rng.range(0, 3);
      g.fillStyle = withA(shade(c, lift), rng.range(0.55, 0.85));
      g.beginPath(); g.ellipse(bx, by, rx, ry, rot, 0, Math.PI * 2); g.fill();
      // rim, so neighbouring blotches read as separate shapes
      g.strokeStyle = withA(shade(c, lift - 0.3), 0.4); g.lineWidth = 0.4;
      g.beginPath(); g.ellipse(bx, by, rx, ry, rot, 0, Math.PI * 2); g.stroke();
    }
  } else if (kind === 'carbon') {
    // Twill weave. At 1.8-unit spacing and 0.10/0.22 contrast this came out
    // as a black-and-white fishnet thrown over the gun rather than a woven
    // surface. Half the pitch, a third of the contrast, and a soft sheen
    // across the middle so it reads as a material and not as a pattern.
    g.lineWidth = 0.3;
    g.strokeStyle = 'rgba(255,255,255,0.055)';
    for (let i = -30; i < w + 30; i += 0.9) {
      g.beginPath(); g.moveTo(x0 + i, y0); g.lineTo(x0 + i + h, y0 + h); g.stroke();
    }
    g.strokeStyle = 'rgba(0,0,0,0.085)';
    for (let i = -30; i < w + 30; i += 0.9) {
      g.beginPath(); g.moveTo(x0 + i + h, y0); g.lineTo(x0 + i, y0 + h); g.stroke();
    }
    g.fillStyle = lingrad(g, 0, y0, 0, y0 + h, [
      [0, 'rgba(255,255,255,0.10)'], [0.42, 'rgba(255,255,255,0.02)'],
      [0.7, 'rgba(0,0,0,0.10)'], [1, 'rgba(0,0,0,0.22)'],
    ]);
    g.fillRect(x0, y0, w, h);
  } else if (kind === 'chrome') {
    // Mirror finish. The old ramp went from 5% to 62% white over the whole
    // upper half, which is not a mirror — it is a bucket of white paint, and
    // it erased every engraved detail underneath. A mirror is *contrast*: a
    // narrow blown specular, a hard horizon, and a dark reflected floor.
    g.fillStyle = lingrad(g, 0, y0, 0, y0 + h, [
      [0, 'rgba(196,214,236,0.30)'],
      [0.26, 'rgba(120,140,168,0.14)'],
      [0.34, 'rgba(255,255,255,0.72)'],   // specular band, deliberately thin
      [0.40, 'rgba(255,255,255,0.10)'],
      [0.47, 'rgba(14,18,26,0.62)'],      // horizon
      [0.72, 'rgba(30,38,52,0.34)'],
      [1, 'rgba(150,172,200,0.26)'],      // bounce off the ground
    ]);
    g.fillRect(x0, y0, w, h);
  } else if (kind === 'lacquer') {
    // deep gloss: bright top rail, dark belly, tight highlight line
    g.fillStyle = lingrad(g, 0, y0, 0, y0 + h, [
      [0, 'rgba(255,255,255,0.30)'],
      [0.3, 'rgba(255,255,255,0.06)'],
      [0.75, 'rgba(0,0,0,0.30)'],
      [1, 'rgba(0,0,0,0.45)'],
    ]);
    g.fillRect(x0, y0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.4)';
    g.fillRect(x0, -9.4, w, 0.5);
  } else if (kind === 'weathered') {
    // Edge wear. Thirty specks scattered at random over a 60x30 field put
    // most of the wear in the middle of flat panels, where nothing rubs, and
    // at 0.12 alpha none of it showed. Wear concentrates on the two edges the
    // gun is actually handled and holstered by.
    for (const [ey, n] of [[-9.6, 26], [-1.6, 18]]) {
      for (let i = 0; i < n; i++) {
        g.fillStyle = `rgba(198,204,214,${rng.range(0.22, 0.6)})`;
        const sx = x0 + rng() * w, sy = ey + rng.range(-1.1, 1.1);
        g.fillRect(sx, sy, rng.range(0.8, 4.2), rng.range(0.3, 0.65));
      }
    }
    // chipped corners down to bare metal
    for (let i = 0; i < 14; i++) {
      g.fillStyle = `rgba(176,182,192,${rng.range(0.3, 0.6)})`;
      const sx = x0 + rng() * w, sy = -12 + rng() * 12;
      g.beginPath(); g.arc(sx, sy, rng.range(0.4, 1.2), 0, Math.PI * 2); g.fill();
    }
    // rust bleeding down from the chips
    for (let i = 0; i < 12; i++) {
      const sx = x0 + rng() * w, sy = -10 + rng() * 7;
      g.fillStyle = lingrad(g, 0, sy, 0, sy + 4, [
        [0, `rgba(122,74,48,${rng.range(0.3, 0.5)})`], [1, 'rgba(122,74,48,0)'],
      ]);
      g.fillRect(sx, sy, rng.range(0.5, 1.3), 4);
    }
  }
  g.restore();
}

// Etched pattern over the body — also source-atop clipped.
function engravingPass(g, kind, span, color, rng) {
  const [x0, x1] = span;
  g.save();
  g.globalCompositeOperation = 'source-atop';
  g.strokeStyle = color;
  g.lineWidth = 0.5;
  if (kind === 'circuit') {
    // PCB traces: orthogonal runs with via pads
    for (let i = 0; i < 9; i++) {
      let cx = x0 + rng() * (x1 - x0), cy = -12 + rng() * 16;
      g.beginPath(); g.moveTo(cx, cy);
      for (let s = 0; s < 3; s++) {
        if (rng.chance(0.5)) cx += rng.range(-6, 8); else cy += rng.range(-4, 4);
        g.lineTo(cx, cy);
      }
      g.stroke();
      g.fillStyle = color;
      g.beginPath(); g.arc(cx, cy, 0.7, 0, Math.PI * 2); g.fill();
    }
  } else if (kind === 'runes') {
    // Angular glyph band. Every glyph used to be the same chevron with an
    // optional crossbar, sixteen in a row — which is a sawtooth ribbon, not
    // writing. Six different marks, drawn from a set, spaced irregularly.
    const GLYPHS = [
      [[0, 0], [0, -2.6], [1.5, -1.3], [0, 0]],                  // flag
      [[0, -2.6], [0, 0], [1.6, 0]],                             // L
      [[0, 0], [1.6, -2.6], [0, -2.6], [1.6, 0]],                // Z through
      [[0.8, 0], [0.8, -2.6], [-0.3, -1.6], [1.9, -1.6]],        // cross-staff
      [[0, 0], [0.9, -2.6], [1.8, 0]],                           // caret
      [[0, -2.6], [1.6, -2.6], [1.6, -1.3], [0, -1.3], [0, 0], [1.6, 0]], // S
    ];
    let gx = x0 + 3;
    const end = x1 - 4;
    let i = 0;
    while (gx < end) {
      const gl = GLYPHS[(i * 3 + Math.floor(rng() * 2)) % GLYPHS.length];
      const gy = -8 + rng.range(-0.4, 0.4);
      g.beginPath();
      gl.forEach(([px, py], k) => (k ? g.lineTo(gx + px, gy + py) : g.moveTo(gx + px, gy + py)));
      g.stroke();
      gx += 2.2 + rng.range(0.7, 1.8);
      i++;
    }
  } else if (kind === 'tally') {
    // kill tally scratched into the stock
    for (let i = 0; i < 12; i++) {
      const gx = x0 + 4 + i * 1.5;
      g.beginPath(); g.moveTo(gx, -6.5); g.lineTo(gx - 0.4, -3.4); g.stroke();
    }
  }
  g.restore();
}

// ------------------------------------------------------------- attachments
// Drawn over the base, in weapon-local coordinates. `s` scales the device so
// the same part reads correctly on a pistol and on a rifle.

function muzzleDevice(g, kind, mount, palette, glow) {
  if (!kind || !mount) return;
  const { x, y, s } = mount;
  const met = palette.rec || '#3a3d42';
  g.save();
  g.translate(x, y);
  g.scale(s, s);

  if (kind === 'brake') {
    // ported compensator: blocky, three top vents
    g.fillStyle = lingrad(g, 0, -3.4, 0, 3.4, [[0, shade(met, 0.3)], [0.5, met], [1, shade(met, -0.4)]]);
    rr(g, 0, -3.4, 11, 6.8, 1.2); g.fill();
    g.fillStyle = 'rgba(8,9,12,0.9)';
    for (let i = 0; i < 3; i++) g.fillRect(1.6 + i * 3, -3.4, 1.5, 3.2);
    g.fillStyle = '#0c0d10';
    g.beginPath(); g.ellipse(11, 0, 1.1, 2.4, 0, 0, Math.PI * 2); g.fill();
  } else if (kind === 'suppressor') {
    // Can with heat-wrap ribbing. 20 units long put a suppressor on the C-9
    // that was two-thirds the length of the pistol itself.
    g.fillStyle = lingrad(g, 0, -3.4, 0, 3.4, [[0, shade(met, 0.22)], [0.45, shade(met, -0.06)], [1, shade(met, -0.45)]]);
    rr(g, 0, -3.4, 15, 6.8, 2.9); g.fill();
    g.strokeStyle = 'rgba(8,9,12,0.45)'; g.lineWidth = 0.55;
    for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(i * 2.5, -3.4); g.lineTo(i * 2.5, 3.4); g.stroke(); }
    g.fillStyle = 'rgba(226,232,240,0.16)';
    g.fillRect(1.2, -3.3, 12.6, 0.45);
    g.fillStyle = '#0c0d10';
    g.beginPath(); g.ellipse(15, 0, 1.0, 2.4, 0, 0, Math.PI * 2); g.fill();
  } else if (kind === 'plasmaVent') {
    // coil stack around an emissive core — the energy-tier silhouette
    const c = (glow && glow.color) || '#3fd2ff';
    g.fillStyle = lingrad(g, 0, -4.6, 0, 4.6, [[0, shade(met, 0.24)], [1, shade(met, -0.42)]]);
    rr(g, 0, -3, 6, 6, 1); g.fill();
    for (let i = 0; i < 4; i++) {
      const cx = 6 + i * 3.4;
      g.fillStyle = shade(met, i % 2 ? -0.2 : 0.14);
      rr(g, cx, -4.8, 2.3, 9.6, 1); g.fill();
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = withA(c, 0.55);
      g.fillRect(cx, -1.1, 2.3, 2.2);
      g.restore();
    }
    // Core beam channel. A 1.8-unit solid bar at 0.75 alpha running the full
    // length, plus an r=6 bloom off the end, buried the coil stack it is
    // supposed to be threaded through.
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = withA(c, 0.5);
    g.fillRect(0, -0.55, 16, 1.1);
    g.fillStyle = radgrad(g, 16.4, 0, 3.6, [[0, withA(c, 0.7)], [1, withA(c, 0)]]);
    g.fillRect(12, -4.5, 9, 9);
    g.restore();
  } else if (kind === 'prongFlash') {
    // three-prong flash hider — open, aggressive silhouette
    g.fillStyle = lingrad(g, 0, -3, 0, 3, [[0, shade(met, 0.26)], [1, shade(met, -0.4)]]);
    rr(g, 0, -3, 4.4, 6, 1); g.fill();
    g.strokeStyle = shade(met, 0.06); g.lineWidth = 1.5; g.lineCap = 'round';
    for (const oy of [-3.0, 0, 3.0]) {
      g.beginPath();
      g.moveTo(4.4, oy * 0.6);
      g.quadraticCurveTo(9, oy * 0.9, 12.5, oy);
      g.stroke();
    }
    if (glow) {
      g.save(); g.globalCompositeOperation = 'lighter';
      g.fillStyle = radgrad(g, 8, 0, 7, [[0, withA(glow.color, 0.45)], [1, withA(glow.color, 0)]]);
      g.fillRect(0, -8, 18, 16);
      g.restore();
    }
  } else if (kind === 'railTip') {
    // Twin accelerator prongs with an emissive gap. At 16 units long, with a
    // 2.4-unit solid bar of light down the middle and an r=8 bloom on the
    // end, this stopped reading as a muzzle device and started reading as a
    // lightsaber blade bolted to the gun. Shorter, with the light confined to
    // a thin filament between the prongs and a bloom that stays at the tip.
    const c = (glow && glow.color) || '#9fd4ff';
    g.fillStyle = lingrad(g, 0, -4.4, 0, 4.4, [[0, shade(met, 0.3)], [1, shade(met, -0.4)]]);
    rr(g, 0, -4.4, 10, 2.0, 0.7); g.fill();
    rr(g, 0, 2.4, 10, 2.0, 0.7); g.fill();
    // cross-brace at the root, so the prongs come out of something
    g.fillStyle = shade(met, -0.2);
    rr(g, 0, -4.4, 2.2, 8.8, 0.7); g.fill();
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = withA(c, 0.55);
    g.fillRect(1.8, -0.5, 8.2, 1.0);
    g.fillStyle = radgrad(g, 10.4, 0, 3.4, [[0, withA(c, 0.75)], [1, withA(c, 0)]]);
    g.fillRect(7, -4, 7, 8);
    g.restore();
  }
  g.restore();
}

function railDevice(g, kind, mount, palette, glow) {
  if (!kind || !mount) return;
  const { x, y, s } = mount;
  const met = palette.rec || '#3a3d42';
  g.save();
  g.translate(x, y);
  g.scale(s, s);

  if (kind === 'holo') {
    // holographic sight: open frame with an emissive projected reticle
    g.fillStyle = shade(met, -0.3);
    rr(g, 0, 0, 12, 2, 0.6); g.fill();                 // base
    g.fillStyle = lingrad(g, 0, -6, 0, 0, [[0, shade(met, 0.16)], [1, shade(met, -0.3)]]);
    rr(g, 0, -6.4, 3.2, 6.6, 0.8); g.fill();           // rear housing
    rr(g, 9, -5.6, 3, 5.8, 0.8); g.fill();             // front hood
    const c = (glow && glow.color) || '#7dffb0';
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = withA(c, 0.28);
    g.fillRect(3.4, -5.4, 5.4, 5);                     // glass
    g.fillStyle = withA(c, 0.95);
    g.fillRect(5.7, -3.6, 0.8, 0.8);                   // dot
    g.restore();
  } else if (kind === 'scope') {
    // magnified tube on twin rings
    g.fillStyle = shade(met, -0.28);
    g.fillRect(1.5, -1.6, 1.8, 2.6);
    g.fillRect(8.5, -1.6, 1.8, 2.6);
    g.fillStyle = lingrad(g, 0, -6, 0, -1, [[0, shade(met, 0.2)], [0.5, shade(met, -0.05)], [1, shade(met, -0.4)]]);
    rr(g, -1, -6, 14, 4.6, 2.2); g.fill();
    g.fillStyle = 'rgba(120,190,230,0.55)';
    rr(g, 11.6, -5.4, 1.4, 3.4, 0.6); g.fill();
    g.fillStyle = 'rgba(10,12,16,0.85)';
    rr(g, -1, -5.4, 1.4, 3.4, 0.6); g.fill();
  } else if (kind === 'laser') {
    // compact designator with a visible emitter
    const c = (glow && glow.color) || '#ff4d6d';
    g.fillStyle = lingrad(g, 0, -4, 0, 0, [[0, shade(met, 0.14)], [1, shade(met, -0.34)]]);
    rr(g, 2, -4, 7.5, 4.4, 0.8); g.fill();
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = withA(c, 0.9);
    g.beginPath(); g.arc(9.4, -1.9, 0.85, 0, Math.PI * 2); g.fill();
    g.fillStyle = radgrad(g, 9.4, -1.9, 5, [[0, withA(c, 0.5)], [1, withA(c, 0)]]);
    g.fillRect(4, -7, 12, 11);
    g.restore();
  }
  g.restore();
}

// Emissive rim on the weapon body itself. Runs `source-atop` + `lighter`, so
// it can only ever add light inside the silhouette — it cannot darken, and it
// cannot bleed outside the weapon.
function edgeGlowPass(g, span, glow, base) {
  if (!glow) return;
  const [x0, x1] = span;
  // The two lines were pinned at y -8.4 and -1.2, which are the rifle
  // chassis' rail and belly. On the knife (which spans about -4.5..4.5) the
  // top line missed the weapon entirely and the belly line cut across the
  // blade. Placed off the body's own extent instead.
  const S = ASSET_SCALE;
  const top = base ? -base.ay / S : -8.4;
  const bot = base ? top + base.h : 0;
  const inset = (bot - top) * 0.18;
  // Small weapons take a weaker rim. Two full-span bands at 0.39 alpha are a
  // detail on a 60-unit rifle and most of the visible surface of a 22-unit
  // knife — which is why the mythic blade came out as a red lozenge with no
  // knife in it.
  const k = sizeFactor(base);
  g.save();
  g.globalCompositeOperation = 'source-atop';
  const grad = lingrad(g, x0, 0, x1, 0, [
    [0, withA(glow.color, 0.05 * glow.intensity * k)],
    [0.45, withA(glow.color, 0.30 * glow.intensity * k)],
    [1, withA(glow.color, 0.10 * glow.intensity * k)],
  ]);
  g.fillStyle = grad;
  g.fillRect(x0, top + inset, x1 - x0, Math.min(1.1, Math.max(0.45, inset * 0.5)));
  g.fillRect(x0, bot - inset * 1.4, x1 - x0, Math.min(0.9, Math.max(0.4, inset * 0.4)));
  g.restore();
}

// How much of a full-size rifle this weapon is, clamped. Every emissive pass
// scales by it, so a knife does not get a rifle's worth of light laid over a
// third of the surface area.
function sizeFactor(base) {
  if (!base) return 1;
  return Math.max(0.42, Math.min(1, base.w / 52));
}

function glowIntensity(glow) { return glow ? glow.intensity : 0; }

// ------------------------------------------------------------- skin tables
// The data structure the whole system reads from. One entry per skin; the
// tier is what the UI colours the card by, and everything else is what the
// painter composites. Adding a skin means adding a row here — no new code.
export const SKIN_TIERS = ['common', 'rare', 'epic', 'legendary', 'mythic', 'ultraLimited'];

export const WEAPON_SKINS = {
  // ===================== CONVENTIONAL FIREARMS =====================

  // VK-77 "VANDAL" — assault rifle
  rifle: {
    urban:   { name: 'VK-77 · URBAN', tier: 'common',
               palette: { rec: '#48596b', poly: '#2f3d4a' },
               coating: 'hydrodip', camo: ['#3f4a58', '#55606e', '#2b3440', '#6a7484'] },
    cinder:  { name: 'VK-77 · CINDER', tier: 'rare',
               palette: { rec: '#8a3820', poly: '#5c2414' },
               coating: 'weathered', muzzle: 'brake', engraving: 'tally' },
    spectre: { name: 'VK-77 · SPECTRE', tier: 'epic',
               palette: { rec: '#20242c', poly: '#15181d' },
               coating: 'chrome', muzzle: 'suppressor', rail: 'laser',
               glow: { color: '#b26bff', intensity: 0.55 } },
    arc:     { name: 'ARC-9 · PULSE', tier: 'legendary',
               palette: { rec: '#15515f', poly: '#0e3946' },
               coating: 'carbon', muzzle: 'plasmaVent', rail: 'holo',
               engraving: 'circuit', engravingColor: 'rgba(120,230,255,0.55)',
               glow: { color: '#3fd2ff', intensity: 1.0 } },
    inferno: { name: 'VK-77 · INFERNO', tier: 'mythic',
               palette: { rec: '#8a1c1c', poly: '#570f0f' },
               coating: 'lacquer', muzzle: 'prongFlash', rail: 'scope',
               engraving: 'runes', engravingColor: 'rgba(255,180,120,0.6)',
               glow: { color: '#ff5a3c', intensity: 1.15 } },
    warden:  { name: 'VK-77 · WARDEN', tier: 'ultraLimited',
               palette: { rec: '#243a2a', poly: '#16241a' },
               coating: 'carbon', muzzle: 'railTip', rail: 'scope',
               engraving: 'runes', engravingColor: 'rgba(140,255,190,0.55)',
               glow: { color: '#39e6a0', intensity: 1.3 } },
  },

  // C-9 sidearm
  pistol: {
    desert:  { name: 'C-9 · DESERT', tier: 'common',
               palette: { rec: '#8a7048', poly: '#6b5638', grip: '#6b5638', frame: '#8a7048' },
               coating: 'hydrodip', camo: ['#8a7048', '#6b5638', '#a08a5e', '#4e3f28'] },
    onyx:    { name: 'C-9 · ONYX', tier: 'rare',
               palette: { rec: '#1d2129', poly: '#14171c', grip: '#14171c', frame: '#1d2129' },
               coating: 'lacquer', muzzle: 'brake' },
    gold:    { name: 'C-9 · GILDED', tier: 'epic',
               palette: { rec: '#d9ac2e', poly: '#8a6a16', grip: '#8a6a16', frame: '#d9ac2e' },
               coating: 'chrome', engraving: 'runes', engravingColor: 'rgba(255,236,180,0.6)',
               muzzle: 'brake', glow: { color: '#ffd166', intensity: 0.5 } },
    quantum: { name: 'C-9 · QUANTUM', tier: 'legendary',
               palette: { rec: '#2a1d55', poly: '#1c1440', grip: '#1c1440', frame: '#2a1d55' },
               coating: 'carbon', muzzle: 'plasmaVent', rail: 'laser',
               engraving: 'circuit', engravingColor: 'rgba(200,150,255,0.55)',
               glow: { color: '#b26bff', intensity: 1.05 } },
    reaper:  { name: 'C-9 · REAPER', tier: 'mythic',
               palette: { rec: '#3a1020', poly: '#220a13', grip: '#220a13', frame: '#3a1020' },
               coating: 'lacquer', muzzle: 'suppressor', rail: 'holo',
               engraving: 'runes', engravingColor: 'rgba(255,120,150,0.6)',
               glow: { color: '#ff4d6d', intensity: 1.2 } },
  },

  // P-12 "WASP" SMG
  smg: {
    viper:   { name: 'P-12 · VIPER', tier: 'rare',
               palette: { rec: '#2f4a34', poly: '#1e3122' },
               coating: 'hydrodip', camo: ['#2f4a34', '#456b3f', '#1b2a1c', '#5c7a4a'],
               muzzle: 'brake' },
    arc:     { name: 'P-12 · TESLA', tier: 'epic',
               palette: { rec: '#1a4a58', poly: '#0f2f3a' },
               coating: 'carbon', muzzle: 'plasmaVent', rail: 'holo',
               engraving: 'circuit', engravingColor: 'rgba(120,230,255,0.5)',
               glow: { color: '#3fd2ff', intensity: 0.9 } },
    hornet:  { name: 'P-12 · HORNET', tier: 'legendary',
               palette: { rec: '#5a4a12', poly: '#2e2508' },
               coating: 'lacquer', muzzle: 'suppressor', rail: 'laser',
               engraving: 'tally', glow: { color: '#ffd166', intensity: 0.85 } },
    nightfall: { name: 'P-12 · NIGHTFALL', tier: 'mythic',
               palette: { rec: '#1c1030', poly: '#100820' },
               coating: 'chrome', muzzle: 'railTip', rail: 'scope',
               engraving: 'circuit', engravingColor: 'rgba(180,140,255,0.55)',
               glow: { color: '#8b5cf6', intensity: 1.2 } },
  },

  // TALON-7 combat knife — no muzzle/rail, so its tiers escalate through
  // coating, etching and blade glow only.
  knife: {
    ravage:  { name: 'TALON-7 · RAVAGE', tier: 'rare',
               palette: { rec: '#6b2a18', poly: '#3a1409' },
               coating: 'weathered', engraving: 'tally' },
    voidedge:{ name: 'VOID EDGE', tier: 'epic',
               palette: { rec: '#241a3a', poly: '#150f24' },
               coating: 'carbon', engraving: 'circuit',
               engravingColor: 'rgba(170,130,255,0.6)',
               glow: { color: '#8b5cf6', intensity: 0.9 } },
    volt:    { name: 'VOLT EDGE', tier: 'legendary',
               palette: { rec: '#0f4050', poly: '#082630' },
               coating: 'chrome', engraving: 'circuit',
               engravingColor: 'rgba(120,240,255,0.65)',
               glow: { color: '#3fd2ff', intensity: 1.15 } },
    bloodmoon:{ name: 'BLOODMOON', tier: 'mythic',
               palette: { rec: '#4a0f18', poly: '#2a0810' },
               coating: 'lacquer', engraving: 'runes',
               engravingColor: 'rgba(255,140,150,0.65)',
               glow: { color: '#ff2d55', intensity: 1.3 } },
    eventide:{ name: 'EVENTIDE', tier: 'ultraLimited',
               palette: { rec: '#0d3a34', poly: '#06211d' },
               coating: 'chrome', engraving: 'runes',
               engravingColor: 'rgba(120,255,220,0.65)',
               glow: { color: '#4ee0d6', intensity: 1.35 } },
  },

  // MK-2 "WARDEN" battle rifle
  battle: {
    ranger:  { name: 'MK-2 · RANGER', tier: 'rare',
               palette: { rec: '#4a4230', poly: '#2f2a1c' },
               coating: 'hydrodip', camo: ['#4a4230', '#63583c', '#2a2618', '#7a6c4a'],
               muzzle: 'brake' },
    marksman:{ name: 'MK-2 · MARKSMAN', tier: 'epic',
               palette: { rec: '#2b3540', poly: '#1a222b' },
               coating: 'carbon', muzzle: 'suppressor', rail: 'scope',
               engraving: 'tally' },
    sovereign:{ name: 'MK-2 · SOVEREIGN', tier: 'legendary',
               palette: { rec: '#4a3a10', poly: '#2a2008' },
               coating: 'chrome', muzzle: 'prongFlash', rail: 'scope',
               engraving: 'runes', engravingColor: 'rgba(255,230,160,0.6)',
               glow: { color: '#ffd166', intensity: 1.0 } },
  },

  // M-900 "OX" LMG
  lmg: {
    trench:  { name: 'M-900 · TRENCH', tier: 'rare',
               palette: { rec: '#33402f', poly: '#1f281c' },
               coating: 'weathered', muzzle: 'brake', engraving: 'tally' },
    juggernaut:{ name: 'M-900 · JUGGERNAUT', tier: 'epic',
               palette: { rec: '#2a2d33', poly: '#1a1c20' },
               coating: 'carbon', muzzle: 'prongFlash', rail: 'holo' },
    devastator:{ name: 'M-900 · DEVASTATOR', tier: 'legendary',
               palette: { rec: '#5a1a10', poly: '#320d07' },
               coating: 'lacquer', muzzle: 'railTip', rail: 'scope',
               engraving: 'runes', engravingColor: 'rgba(255,160,110,0.6)',
               glow: { color: '#ff6a3c', intensity: 1.1 } },
  },

  // LRS-1 "TALON" sniper
  sniper: {
    frost:   { name: 'LRS-1 · FROST', tier: 'rare',
               palette: { rec: '#5a6a78', poly: '#39454f' },
               coating: 'hydrodip', camo: ['#8fa3b5', '#5a6a78', '#c3d2de', '#39454f'],
               rail: 'scope' },
    ghost:   { name: 'LRS-1 · GHOST', tier: 'epic',
               palette: { rec: '#1e2228', poly: '#12151a' },
               coating: 'chrome', muzzle: 'suppressor', rail: 'scope',
               engraving: 'tally' },
    longshot:{ name: 'LRS-1 · LONGSHOT', tier: 'legendary',
               palette: { rec: '#14323a', poly: '#0a1e24' },
               coating: 'carbon', muzzle: 'railTip', rail: 'scope',
               engraving: 'circuit', engravingColor: 'rgba(140,230,255,0.55)',
               glow: { color: '#3fd2ff', intensity: 1.05 } },
  },

  // ===================== ENERGY: RIFLE CHASSIS =====================

  plasma: {
    coolant: { name: 'PLASMA · COOLANT', tier: 'rare',
               palette: { rec: '#1a3a4a', poly: '#0e2430' },
               coating: 'carbon', muzzle: 'plasmaVent' },
    solarflare:{ name: 'PLASMA · SOLAR FLARE', tier: 'epic',
               palette: { rec: '#5a3a10', poly: '#331f06' },
               coating: 'lacquer', muzzle: 'plasmaVent', rail: 'holo',
               engraving: 'circuit', engravingColor: 'rgba(255,200,120,0.55)',
               glow: { color: '#ffa63c', intensity: 0.95 } },
    starcore:{ name: 'PLASMA · STARCORE', tier: 'legendary',
               palette: { rec: '#2a1050', poly: '#160828' },
               coating: 'chrome', muzzle: 'railTip', rail: 'scope',
               engraving: 'runes', engravingColor: 'rgba(210,160,255,0.6)',
               glow: { color: '#b26bff', intensity: 1.25 } },
  },

  pulse: {
    tracer:  { name: 'PULSE · TRACER', tier: 'rare',
               palette: { rec: '#1a4442', poly: '#0d2725' },
               coating: 'carbon', muzzle: 'plasmaVent' },
    resonance:{ name: 'PULSE · RESONANCE', tier: 'epic',
               palette: { rec: '#123a52', poly: '#08202e' },
               coating: 'chrome', muzzle: 'plasmaVent', rail: 'holo',
               engraving: 'circuit', engravingColor: 'rgba(130,230,255,0.55)',
               glow: { color: '#3fd2ff', intensity: 0.9 } },
    harmonic:{ name: 'PULSE · HARMONIC', tier: 'legendary',
               palette: { rec: '#0f3a2a', poly: '#062018' },
               coating: 'carbon', muzzle: 'railTip', rail: 'scope',
               engraving: 'runes', engravingColor: 'rgba(130,255,200,0.6)',
               glow: { color: '#39e6a0', intensity: 1.2 } },
  },

  eshotgun: {
    scatter: { name: 'SCATTER · FIELD', tier: 'rare',
               palette: { rec: '#40331a', poly: '#241c0d' },
               coating: 'weathered', muzzle: 'brake' },
    breacher:{ name: 'SCATTER · BREACHER', tier: 'epic',
               palette: { rec: '#3a2030', poly: '#20101c' },
               coating: 'lacquer', muzzle: 'prongFlash', rail: 'holo',
               glow: { color: '#ff4d6d', intensity: 0.85 } },
    stormfront:{ name: 'SCATTER · STORMFRONT', tier: 'legendary',
               palette: { rec: '#13303f', poly: '#081a24' },
               coating: 'carbon', muzzle: 'plasmaVent', rail: 'scope',
               engraving: 'circuit', engravingColor: 'rgba(150,220,255,0.55)',
               glow: { color: '#63b3ff', intensity: 1.15 } },
  },

  ion: {
    driver:  { name: 'ION · DRIVER', tier: 'rare',
               palette: { rec: '#153a48', poly: '#0a222c' },
               coating: 'carbon', muzzle: 'plasmaVent' },
    cascade: { name: 'ION · CASCADE', tier: 'epic',
               palette: { rec: '#1a2a58', poly: '#0d1734' },
               coating: 'chrome', muzzle: 'railTip', rail: 'holo',
               engraving: 'circuit', engravingColor: 'rgba(150,180,255,0.55)',
               glow: { color: '#6b8cff', intensity: 1.0 } },
    singularity:{ name: 'ION · SINGULARITY', tier: 'legendary',
               palette: { rec: '#2c0f3a', poly: '#180620' },
               coating: 'lacquer', muzzle: 'railTip', rail: 'scope',
               engraving: 'runes', engravingColor: 'rgba(220,150,255,0.6)',
               glow: { color: '#c26bff', intensity: 1.3 } },
  },

  emp: {
    disruptor:{ name: 'EMP · DISRUPTOR', tier: 'rare',
               palette: { rec: '#243848', poly: '#141f2a' },
               coating: 'carbon', muzzle: 'plasmaVent' },
    blackout:{ name: 'EMP · BLACKOUT', tier: 'epic',
               palette: { rec: '#15181e', poly: '#0b0d11' },
               coating: 'chrome', muzzle: 'suppressor', rail: 'holo',
               engraving: 'circuit', engravingColor: 'rgba(160,200,255,0.5)',
               glow: { color: '#7fb3ff', intensity: 0.9 } },
    overload:{ name: 'EMP · OVERLOAD', tier: 'legendary',
               palette: { rec: '#1a3a1a', poly: '#0d200d' },
               coating: 'carbon', muzzle: 'railTip', rail: 'scope',
               engraving: 'runes', engravingColor: 'rgba(150,255,150,0.6)',
               glow: { color: '#5cff8f', intensity: 1.2 } },
  },

  gravity: {
    anchor:  { name: 'GRAVITY · ANCHOR', tier: 'rare',
               palette: { rec: '#2a2438', poly: '#171322' },
               coating: 'carbon', muzzle: 'plasmaVent' },
    eventhorizon:{ name: 'GRAVITY · EVENT HORIZON', tier: 'epic',
               palette: { rec: '#180f2e', poly: '#0c0718' },
               coating: 'lacquer', muzzle: 'railTip', rail: 'holo',
               engraving: 'circuit', engravingColor: 'rgba(190,150,255,0.55)',
               glow: { color: '#9b6bff', intensity: 1.05 } },
    collapse:{ name: 'GRAVITY · COLLAPSE', tier: 'legendary',
               palette: { rec: '#0a0a14', poly: '#05050a' },
               coating: 'chrome', muzzle: 'railTip', rail: 'scope',
               engraving: 'runes', engravingColor: 'rgba(220,190,255,0.6)',
               glow: { color: '#d4a6ff', intensity: 1.35 } },
  },

  lightning: {
    arcline: { name: 'LIGHTNING · ARCLINE', tier: 'rare',
               palette: { rec: '#2a3a1a', poly: '#17220d' },
               coating: 'carbon', muzzle: 'plasmaVent' },
    thunderhead:{ name: 'LIGHTNING · THUNDERHEAD', tier: 'epic',
               palette: { rec: '#1a2f48', poly: '#0d1a2a' },
               coating: 'chrome', muzzle: 'plasmaVent', rail: 'holo',
               engraving: 'circuit', engravingColor: 'rgba(170,220,255,0.6)',
               glow: { color: '#8fd0ff', intensity: 1.0 } },
    tempest: { name: 'LIGHTNING · TEMPEST', tier: 'legendary',
               palette: { rec: '#3a3410', poly: '#201d06' },
               coating: 'lacquer', muzzle: 'railTip', rail: 'scope',
               engraving: 'runes', engravingColor: 'rgba(255,240,150,0.6)',
               glow: { color: '#ffe45c', intensity: 1.3 } },
  },

  cryo: {
    permafrost:{ name: 'CRYO · PERMAFROST', tier: 'rare',
               palette: { rec: '#20404a', poly: '#12262e' },
               coating: 'hydrodip', camo: ['#8fb5c4', '#20404a', '#c3dde6', '#12262e'] },
    glacier: { name: 'CRYO · GLACIER', tier: 'epic',
               palette: { rec: '#183a4a', poly: '#0c2029' },
               coating: 'chrome', muzzle: 'plasmaVent', rail: 'holo',
               engraving: 'circuit', engravingColor: 'rgba(180,235,255,0.55)',
               glow: { color: '#9fe4ff', intensity: 0.95 } },
    absolute:{ name: 'CRYO · ABSOLUTE ZERO', tier: 'legendary',
               palette: { rec: '#0d2a3a', poly: '#061620' },
               coating: 'carbon', muzzle: 'railTip', rail: 'scope',
               engraving: 'runes', engravingColor: 'rgba(200,245,255,0.65)',
               glow: { color: '#7fe8ff', intensity: 1.3 } },
  },

  // ===================== ENERGY: PISTOL CHASSIS =====================

  raygun: {
    retro:   { name: 'RAY GUN · RETRO', tier: 'rare',
               palette: { rec: '#4a2a58', poly: '#2a1434', grip: '#2a1434', frame: '#4a2a58' },
               coating: 'lacquer', muzzle: 'plasmaVent' },
    atomic:  { name: 'RAY GUN · ATOMIC', tier: 'epic',
               palette: { rec: '#3a5a20', poly: '#1f3410', grip: '#1f3410', frame: '#3a5a20' },
               coating: 'chrome', muzzle: 'plasmaVent', rail: 'laser',
               engraving: 'circuit', engravingColor: 'rgba(180,255,150,0.55)',
               glow: { color: '#9cff6b', intensity: 1.0 } },
    annihilation:{ name: 'RAY GUN · ANNIHILATION', tier: 'legendary',
               palette: { rec: '#500f2a', poly: '#2c0716', grip: '#2c0716', frame: '#500f2a' },
               coating: 'lacquer', muzzle: 'railTip', rail: 'holo',
               engraving: 'runes', engravingColor: 'rgba(255,150,190,0.6)',
               glow: { color: '#ff4d9d', intensity: 1.3 } },
  },

  quantum: {
    phase:   { name: 'QUANTUM · PHASE', tier: 'rare',
               palette: { rec: '#243a58', poly: '#121f34', grip: '#121f34', frame: '#243a58' },
               coating: 'carbon', muzzle: 'plasmaVent' },
    entangle:{ name: 'QUANTUM · ENTANGLE', tier: 'epic',
               palette: { rec: '#2e1a58', poly: '#180c34', grip: '#180c34', frame: '#2e1a58' },
               coating: 'chrome', muzzle: 'plasmaVent', rail: 'laser',
               engraving: 'circuit', engravingColor: 'rgba(200,170,255,0.55)',
               glow: { color: '#b26bff', intensity: 1.0 } },
    paradox: { name: 'QUANTUM · PARADOX', tier: 'legendary',
               palette: { rec: '#0d3a3a', poly: '#062020', grip: '#062020', frame: '#0d3a3a' },
               coating: 'lacquer', muzzle: 'railTip', rail: 'holo',
               engraving: 'runes', engravingColor: 'rgba(150,255,240,0.6)',
               glow: { color: '#4ee0d6', intensity: 1.3 } },
  },

  // ===================== ENERGY: SMG CHASSIS =====================

  lasersmg: {
    beamline:{ name: 'LASER SMG · BEAMLINE', tier: 'rare',
               palette: { rec: '#2a1a4a', poly: '#160d2a' },
               coating: 'carbon', muzzle: 'plasmaVent' },
    photon:  { name: 'LASER SMG · PHOTON', tier: 'epic',
               palette: { rec: '#4a1a2a', poly: '#2a0d16' },
               coating: 'chrome', muzzle: 'plasmaVent', rail: 'holo',
               engraving: 'circuit', engravingColor: 'rgba(255,170,190,0.55)',
               glow: { color: '#ff6b9d', intensity: 1.0 } },
    prism:   { name: 'LASER SMG · PRISM', tier: 'legendary',
               palette: { rec: '#123a30', poly: '#08201a' },
               coating: 'lacquer', muzzle: 'railTip', rail: 'scope',
               engraving: 'runes', engravingColor: 'rgba(160,255,220,0.6)',
               glow: { color: '#5cffcc', intensity: 1.3 } },
  },

  // ===================== PURPOSE-BUILT BODIES =====================

  // Particle Thrower — its own emitter chassis (paintParticleThrower).
  particle: {
    emitter: { name: 'PARTICLE · EMITTER', tier: 'rare',
               palette: { rec: '#2a1d55', poly: '#1c1440' },
               coating: 'carbon', muzzle: 'plasmaVent' },
    fluxcore:{ name: 'PARTICLE · FLUX CORE', tier: 'epic',
               palette: { rec: '#123a4a', poly: '#082028' },
               coating: 'chrome', muzzle: 'plasmaVent', rail: 'holo',
               engraving: 'circuit', engravingColor: 'rgba(140,230,255,0.55)',
               glow: { color: '#3fd2ff', intensity: 1.05 } },
    annihilator:{ name: 'PARTICLE · ANNIHILATOR', tier: 'legendary',
               palette: { rec: '#3a0f3a', poly: '#200820' },
               coating: 'lacquer', muzzle: 'railTip', rail: 'scope',
               engraving: 'runes', engravingColor: 'rgba(255,160,255,0.6)',
               glow: { color: '#ff6bff', intensity: 1.35 } },
  },

  // Railgun — twin-rail accelerator chassis (paintRailgun).
  railgun: {
    coilwork:{ name: 'RAILGUN · COILWORK', tier: 'rare',
               palette: { rec: '#26323a', poly: '#141c22' },
               coating: 'carbon', muzzle: 'railTip' },
    magnetar:{ name: 'RAILGUN · MAGNETAR', tier: 'epic',
               palette: { rec: '#1a2a58', poly: '#0d1634' },
               coating: 'chrome', muzzle: 'railTip', rail: 'scope',
               engraving: 'circuit', engravingColor: 'rgba(160,190,255,0.55)',
               glow: { color: '#6b8cff', intensity: 1.1 } },
    hypervelocity:{ name: 'RAILGUN · HYPERVELOCITY', tier: 'legendary',
               palette: { rec: '#3a2a08', poly: '#201705' },
               coating: 'lacquer', muzzle: 'railTip', rail: 'scope',
               engraving: 'runes', engravingColor: 'rgba(255,225,140,0.6)',
               glow: { color: '#ffd166', intensity: 1.35 } },
  },

  // Flamethrower — tank-and-wand chassis (paintFlamethrower).
  flame: {
    scorch:  { name: 'FLAME · SCORCH', tier: 'rare',
               palette: { rec: '#4a2a10', poly: '#2a1608' },
               coating: 'weathered', muzzle: 'brake' },
    pyroclast:{ name: 'FLAME · PYROCLAST', tier: 'epic',
               palette: { rec: '#5a1a0a', poly: '#320e05' },
               coating: 'lacquer', muzzle: 'prongFlash', rail: 'holo',
               engraving: 'tally', glow: { color: '#ff7a3c', intensity: 1.0 } },
    hellfire:{ name: 'FLAME · HELLFIRE', tier: 'legendary',
               palette: { rec: '#3a0a0a', poly: '#1f0505' },
               coating: 'chrome', muzzle: 'plasmaVent', rail: 'scope',
               engraving: 'runes', engravingColor: 'rgba(255,150,100,0.6)',
               glow: { color: '#ff4d1a', intensity: 1.35 } },
  },

  // ===================== BOSS HEAVY WEAPONS =====================
  // Only obtainable as 1/1000 Boss Redeemables (see game/loot.js), so their
  // skins start at epic — there is no common-tier version of a boss weapon.

  minigun: {
    warlord: { name: 'ANNIHILATOR · WARLORD', tier: 'epic',
               palette: { rec: '#3a2a1a', poly: '#20160d' },
               coating: 'weathered', muzzle: 'brake', engraving: 'tally' },
    executioner:{ name: 'ANNIHILATOR · EXECUTIONER', tier: 'legendary',
               palette: { rec: '#4a1010', poly: '#280808' },
               coating: 'lacquer', muzzle: 'prongFlash', rail: 'holo',
               engraving: 'runes', engravingColor: 'rgba(255,150,120,0.6)',
               glow: { color: '#ff5a3c', intensity: 1.2 } },
    apocalypse:{ name: 'ANNIHILATOR · APOCALYPSE', tier: 'ultraLimited',
               palette: { rec: '#1a1a2e', poly: '#0d0d18' },
               coating: 'chrome', muzzle: 'railTip', rail: 'scope',
               engraving: 'circuit', engravingColor: 'rgba(180,200,255,0.6)',
               glow: { color: '#7fb3ff', intensity: 1.45 } },
  },

  rocket: {
    foreman: { name: 'SIEGEBREAKER · FOREMAN', tier: 'epic',
               palette: { rec: '#3d4237', poly: '#262a22' },
               coating: 'weathered', muzzle: 'brake', engraving: 'tally' },
    demolition:{ name: 'SIEGEBREAKER · DEMOLITION', tier: 'legendary',
               palette: { rec: '#5a3a0a', poly: '#322005' },
               coating: 'lacquer', muzzle: 'prongFlash', rail: 'scope',
               engraving: 'runes', engravingColor: 'rgba(255,200,120,0.6)',
               glow: { color: '#ffa63c', intensity: 1.2 } },
    doomsday:{ name: 'SIEGEBREAKER · DOOMSDAY', tier: 'ultraLimited',
               palette: { rec: '#2a0a2a', poly: '#160516' },
               coating: 'chrome', muzzle: 'railTip', rail: 'holo',
               engraving: 'circuit', engravingColor: 'rgba(230,160,255,0.6)',
               glow: { color: '#d46bff', intensity: 1.45 } },
  },
};

// ---------------------------------------------------------------- builder

// Composites one skin over a base body sprite.
export function buildSkin(kind, base, skin, seed = 1) {
  const mounts = MOUNTS[kind] || MOUNTS.rifle;
  const pad = PAD_BY_KIND[kind] || PAD_BY_KIND.rifle;
  const rng = makeRng(seed);
  const palette = readablePalette(skin.palette || {});
  const glow = skin.glow || null;
  const span = mounts.span;

  // Outer bloom: the base silhouette stamped in the glow colour, under the
  // body, with `lighter`. Composite-add only — structurally incapable of
  // producing a dark halo, which is the failure mode a plain offset stamp has.
  // Outer bloom radius scales with the weapon. A flat 1.6 units is 3% of a
  // rifle's length and 8% of the knife's — on the knife eight stamps at that
  // radius fused into a lozenge of pure colour with the blade nowhere in it,
  // so the priciest finishes were the ones you could least identify. Small
  // weapons now get a proportionally smaller, dimmer halo.
  const bloomR = Math.max(0.55, Math.min(1.5, base.w * 0.022));
  const bloomA = 0.085 * sizeFactor(base) * glowIntensity(glow);
  const under = glow ? (g) => {
    const sil = silhouette(base, glow.color);
    const S = ASSET_SCALE;
    const ax = base.ax / S, ay = base.ay / S;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = bloomA;
    for (let a = 0; a < 8; a++) {
      const th = (a / 8) * Math.PI * 2;
      g.drawImage(
        sil,
        -ax + Math.cos(th) * bloomR, -ay + Math.sin(th) * bloomR,
        base.w, base.h,
      );
    }
    g.restore();
  } : null;

  const over = (g) => {
    if (skin.coating) {
      coatingPass(g, skin.coating, span, { ...palette, camo: skin.camo }, rng);
    }
    if (skin.engraving) {
      engravingPass(g, skin.engraving, span, skin.engravingColor || 'rgba(220,220,230,0.35)', rng);
    }
    edgeGlowPass(g, span, glow, base);
    railDevice(g, skin.rail, mounts.rail, palette, glow);
    muzzleDevice(g, skin.muzzle, mounts.muzzle, palette, glow);
  };

  return skinSprite(base, pad, under, over);
}

// Builds the full `finishes` map for one weapon kind.
//
// `paintBase(palette)` re-paints the body in the skin's palette — the colour
// half of a skin, which still matters, it just is not the whole thing any
// more. Everything else is composited on top by buildSkin.
// `weaponId` keys the skin table; `mountKind` says which body geometry the
// weapon uses (many weapons share the rifle chassis, so they share its mount
// points but get their own skins). Defaults to the weapon id when the weapon
// has a body all of its own.
// Lowest luminance a skin's base coat is allowed to reach.
//
// Several tiers were authored down at luminance 10-27 (`#0a0a14` is
// effectively black), which on the game's own night-street background is not a
// dark gun — it is a hole. The weapon still has to read as an object with a
// top and an underside, and metal()/polymer()'s own highlights cannot build a
// value range out of nothing. Palettes above the floor are passed through
// untouched; the ones below it are lifted along their own hue, so a "black"
// skin still reads as the darkest thing in the arsenal.
const COAT_FLOOR = 30;

function liftToFloor(hex) {
  if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (lum >= COAT_FLOOR) return hex;
  // Lift toward the hue's own bright end rather than toward grey, so the
  // colour identity of the skin survives the correction.
  const k = (COAT_FLOOR - lum) / 255;
  const up = (v) => Math.min(255, Math.round(v + (255 - v) * k * 1.35 + 6));
  r = up(r); g = up(g); b = up(b);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function readablePalette(pal) {
  const out = {};
  for (const [k, v] of Object.entries(pal)) out[k] = liftToFloor(v);
  return out;
}

export function buildSkinSet(weaponId, defaultBody, paintBase, mountKind = weaponId, paintMag = null, paintSlide = null) {
  const table = WEAPON_SKINS[weaponId] || {};
  const finishes = { default: defaultBody };
  let seed = 11 + weaponId.length * 31;
  for (const [id, skin] of Object.entries(table)) {
    // paintBase gets the skin id too, so a weapon whose variants use
    // genuinely different base geometry (the knife's straight blade vs its
    // bowie) can pick the right painter rather than being forced onto one.
    const pal = readablePalette(skin.palette || {});
    const body = paintBase(pal, id, skin);
    finishes[id] = buildSkin(mountKind, body, skin, seed);
    // Detachable magazines are drawn as their own sprite, so a skin has to
    // repaint them too — otherwise a Mythic coating ships with the drab
    // default magazine still hanging off it, which reads as a mismatched part.
    if (paintMag) {
      const mag = paintMag(pal, id, skin);
      if (mag) finishes[id].mag = mag;
    }
    // Same reasoning as the magazine: the pistol's slide is a separate sprite
    // for the blowback animation, so it needs its own repaint or every finish
    // — including the priciest tiers — shows a plain gunmetal slide bolted
    // onto a fully coated frame.
    if (paintSlide) {
      const slide = paintSlide(pal, id, skin);
      if (slide) finishes[id].slide = slide;
    }
    // Every composited skin carries its own sprite identity, so nothing
    // downstream can confuse two skins that happen to share a base body.
    finishes[id].spriteId = `${weaponId}__${id}`;
    seed += 137;
  }
  if (defaultBody && !defaultBody.spriteId) defaultBody.spriteId = `${weaponId}__default`;
  return finishes;
}

// Flat list for the UI: every skin with its weapon kind and tier.
export function skinList() {
  const out = [];
  for (const [kind, table] of Object.entries(WEAPON_SKINS)) {
    for (const [id, skin] of Object.entries(table)) {
      out.push({ kind, id, ...skin });
    }
  }
  return out;
}
