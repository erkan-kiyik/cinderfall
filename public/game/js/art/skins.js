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
export const MOUNTS = {
  rifle:  { muzzle: { x: 40,   y: -5.3, s: 1.0 },  rail: { x: 1,    y: -15.4, s: 1.0 }, span: [-20, 40] },
  pistol: { muzzle: { x: 10.2, y: -5.2, s: 0.5 },  rail: { x: 1,    y: -9.6,  s: 0.5 }, span: [-7, 11] },
  smg:    { muzzle: { x: 24,   y: -5.6, s: 0.8 },  rail: { x: 0,    y: -11.6, s: 0.75 }, span: [-14, 24] },
  knife:  { muzzle: null,                          rail: null,                          span: [-6, 16] },
};

// Extra canvas room a skinned sprite needs around the base, so muzzle devices
// and optics aren't clipped at the sprite edge.
const PAD = {
  rifle:  { l: 3, r: 18, t: 9, b: 3 },
  pistol: { l: 2, r: 9,  t: 7, b: 2 },
  smg:    { l: 2, r: 13, t: 8, b: 2 },
  knife:  { l: 3, r: 4,  t: 4, b: 4 },
};

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
    // multicam-style blotches
    const cols = palette.camo || ['#4c5340', '#3a4030', '#6b6a52', '#26291f'];
    for (let i = 0; i < 26; i++) {
      g.fillStyle = withA(cols[rng.int(0, cols.length - 1)], rng.range(0.35, 0.7));
      const bx = x0 + rng() * w, by = y0 + rng() * h;
      g.beginPath();
      g.ellipse(bx, by, rng.range(1.6, 5.2), rng.range(1.2, 3.4), rng.range(0, 3), 0, Math.PI * 2);
      g.fill();
    }
  } else if (kind === 'carbon') {
    // fine twill weave: two crossing hatch sets
    g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 0.45;
    for (let i = -30; i < w + 30; i += 1.8) {
      g.beginPath(); g.moveTo(x0 + i, y0); g.lineTo(x0 + i + h, y0 + h); g.stroke();
    }
    g.strokeStyle = 'rgba(0,0,0,0.22)';
    for (let i = -30; i < w + 30; i += 1.8) {
      g.beginPath(); g.moveTo(x0 + i + h, y0); g.lineTo(x0 + i, y0 + h); g.stroke();
    }
  } else if (kind === 'chrome') {
    // mirror finish: a hard specular band across the middle of the body
    g.fillStyle = lingrad(g, 0, y0, 0, y0 + h, [
      [0, 'rgba(255,255,255,0.05)'],
      [0.36, 'rgba(255,255,255,0.62)'],
      [0.46, 'rgba(255,255,255,0.16)'],
      [0.58, 'rgba(20,26,38,0.55)'],
      [1, 'rgba(160,180,210,0.30)'],
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
    // edge wear: bare metal scratches and chipped corners
    for (let i = 0; i < 30; i++) {
      g.fillStyle = `rgba(190,196,205,${rng.range(0.12, 0.4)})`;
      const sx = x0 + rng() * w, sy = y0 + rng() * h;
      g.fillRect(sx, sy, rng.range(0.6, 3.4), rng.range(0.3, 0.7));
    }
    for (let i = 0; i < 10; i++) {
      g.fillStyle = `rgba(70,60,48,${rng.range(0.2, 0.45)})`;
      const sx = x0 + rng() * w, sy = y0 + rng() * h;
      g.beginPath(); g.arc(sx, sy, rng.range(0.5, 1.6), 0, Math.PI * 2); g.fill();
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
    // angular glyph band along the receiver
    for (let i = 0; i < 16; i++) {
      const gx = x0 + 3 + i * ((x1 - x0 - 6) / 16), gy = -8 + rng.range(-1, 1);
      g.beginPath();
      g.moveTo(gx, gy);
      g.lineTo(gx + 1.4, gy - 2.2);
      g.lineTo(gx + 2.6, gy);
      if (rng.chance(0.5)) { g.moveTo(gx + 0.6, gy - 1); g.lineTo(gx + 2, gy - 1); }
      g.stroke();
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
    // long can with heat-wrap ribbing
    g.fillStyle = lingrad(g, 0, -4, 0, 4, [[0, shade(met, 0.22)], [0.45, shade(met, -0.06)], [1, shade(met, -0.45)]]);
    rr(g, 0, -4, 20, 8, 3.4); g.fill();
    g.strokeStyle = 'rgba(8,9,12,0.45)'; g.lineWidth = 0.6;
    for (let i = 1; i < 7; i++) { g.beginPath(); g.moveTo(i * 2.7, -4); g.lineTo(i * 2.7, 4); g.stroke(); }
    g.fillStyle = '#0c0d10';
    g.beginPath(); g.ellipse(20, 0, 1.2, 3, 0, 0, Math.PI * 2); g.fill();
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
    // core beam channel
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = withA(c, 0.75);
    g.fillRect(0, -0.9, 20, 1.8);
    g.fillStyle = radgrad(g, 20, 0, 6, [[0, withA(c, 0.8)], [1, withA(c, 0)]]);
    g.fillRect(12, -7, 16, 14);
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
    // twin accelerator rails, emissive gap between them
    const c = (glow && glow.color) || '#9fd4ff';
    g.fillStyle = lingrad(g, 0, -5, 0, 5, [[0, shade(met, 0.3)], [1, shade(met, -0.4)]]);
    rr(g, 0, -5.4, 16, 2.4, 0.8); g.fill();
    rr(g, 0, 3.0, 16, 2.4, 0.8); g.fill();
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = withA(c, 0.6);
    g.fillRect(0, -1.2, 16, 2.4);
    g.fillStyle = radgrad(g, 16, 0, 8, [[0, withA(c, 0.7)], [1, withA(c, 0)]]);
    g.fillRect(8, -9, 18, 18);
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
function edgeGlowPass(g, span, glow) {
  if (!glow) return;
  const [x0, x1] = span;
  g.save();
  g.globalCompositeOperation = 'source-atop';
  const grad = lingrad(g, x0, 0, x1, 0, [
    [0, withA(glow.color, 0.05 * glow.intensity)],
    [0.45, withA(glow.color, 0.30 * glow.intensity)],
    [1, withA(glow.color, 0.10 * glow.intensity)],
  ]);
  g.fillStyle = grad;
  g.fillRect(x0, -8.4, x1 - x0, 1.1);        // top rail line
  g.fillRect(x0, -1.2, x1 - x0, 0.9);        // belly line
  g.restore();
}

// ------------------------------------------------------------- skin tables
// The data structure the whole system reads from. One entry per skin; the
// tier is what the UI colours the card by, and everything else is what the
// painter composites. Adding a skin means adding a row here — no new code.
export const SKIN_TIERS = ['common', 'rare', 'epic', 'legendary', 'mythic', 'ultraLimited'];

export const WEAPON_SKINS = {
  rifle: {
    urban: {
      name: 'VK-77 · URBAN', tier: 'common',
      palette: { rec: '#48596b', poly: '#2f3d4a' },
      coating: 'hydrodip',
      camo: ['#3f4a58', '#55606e', '#2b3440', '#6a7484'],
    },
    cinder: {
      name: 'VK-77 · CINDER', tier: 'rare',
      palette: { rec: '#8a3820', poly: '#5c2414' },
      coating: 'weathered', muzzle: 'brake', engraving: 'tally',
    },
    arc: {
      name: 'ARC-9 · PULSE', tier: 'legendary',
      palette: { rec: '#15515f', poly: '#0e3946' },
      coating: 'carbon', muzzle: 'plasmaVent', rail: 'holo',
      engraving: 'circuit', engravingColor: 'rgba(120,230,255,0.55)',
      glow: { color: '#3fd2ff', intensity: 1.0 },
    },
    inferno: {
      name: 'VK-77 · INFERNO', tier: 'mythic',
      palette: { rec: '#8a1c1c', poly: '#570f0f' },
      coating: 'lacquer', muzzle: 'prongFlash', rail: 'scope',
      engraving: 'runes', engravingColor: 'rgba(255,180,120,0.6)',
      glow: { color: '#ff5a3c', intensity: 1.15 },
    },
    spectre: {
      name: 'VK-77 · SPECTRE', tier: 'epic',
      palette: { rec: '#20242c', poly: '#15181d' },
      coating: 'chrome', muzzle: 'suppressor', rail: 'laser',
      glow: { color: '#b26bff', intensity: 0.55 },
    },
    warden: {
      name: 'VK-77 · WARDEN', tier: 'ultraLimited',
      palette: { rec: '#243a2a', poly: '#16241a' },
      coating: 'carbon', muzzle: 'railTip', rail: 'scope',
      engraving: 'runes', engravingColor: 'rgba(140,255,190,0.55)',
      glow: { color: '#39e6a0', intensity: 1.3 },
    },
  },

  pistol: {
    desert: {
      name: 'C-9 · DESERT', tier: 'common',
      palette: { rec: '#8a7048', poly: '#6b5638', grip: '#6b5638', frame: '#8a7048' },
      coating: 'hydrodip', camo: ['#8a7048', '#6b5638', '#a08a5e', '#4e3f28'],
    },
    onyx: {
      name: 'C-9 · ONYX', tier: 'rare',
      palette: { rec: '#1d2129', poly: '#14171c', grip: '#14171c', frame: '#1d2129' },
      coating: 'lacquer', muzzle: 'brake',
    },
    gold: {
      name: 'C-9 · GILDED', tier: 'epic',
      palette: { rec: '#d9ac2e', poly: '#8a6a16', grip: '#8a6a16', frame: '#d9ac2e' },
      coating: 'chrome', engraving: 'runes', engravingColor: 'rgba(255,236,180,0.6)',
      glow: { color: '#ffd166', intensity: 0.5 },
    },
    quantum: {
      name: 'C-9 · QUANTUM', tier: 'legendary',
      palette: { rec: '#2a1d55', poly: '#1c1440', grip: '#1c1440', frame: '#2a1d55' },
      coating: 'carbon', muzzle: 'plasmaVent', rail: 'laser',
      engraving: 'circuit', engravingColor: 'rgba(200,150,255,0.55)',
      glow: { color: '#b26bff', intensity: 1.05 },
    },
  },

  smg: {
    viper: {
      name: 'P-12 · VIPER', tier: 'rare',
      palette: { rec: '#2f4a34', poly: '#1e3122' },
      coating: 'hydrodip', camo: ['#2f4a34', '#456b3f', '#1b2a1c', '#5c7a4a'],
      muzzle: 'brake',
    },
    arc: {
      name: 'P-12 · TESLA', tier: 'epic',
      palette: { rec: '#1a4a58', poly: '#0f2f3a' },
      coating: 'carbon', muzzle: 'plasmaVent', rail: 'holo',
      engraving: 'circuit', engravingColor: 'rgba(120,230,255,0.5)',
      glow: { color: '#3fd2ff', intensity: 0.9 },
    },
    hornet: {
      name: 'P-12 · HORNET', tier: 'legendary',
      palette: { rec: '#5a4a12', poly: '#2e2508' },
      coating: 'lacquer', muzzle: 'suppressor', rail: 'laser',
      engraving: 'tally',
      glow: { color: '#ffd166', intensity: 0.85 },
    },
  },
};

// ---------------------------------------------------------------- builder

// Composites one skin over a base body sprite.
export function buildSkin(kind, base, skin, seed = 1) {
  const mounts = MOUNTS[kind] || MOUNTS.rifle;
  const pad = PAD[kind] || PAD.rifle;
  const rng = makeRng(seed);
  const palette = skin.palette || {};
  const glow = skin.glow || null;
  const span = mounts.span;

  // Outer bloom: the base silhouette stamped in the glow colour, under the
  // body, with `lighter`. Composite-add only — structurally incapable of
  // producing a dark halo, which is the failure mode a plain offset stamp has.
  const under = glow ? (g) => {
    const sil = silhouette(base, glow.color);
    const S = ASSET_SCALE;
    const ax = base.ax / S, ay = base.ay / S;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.10 * glow.intensity;
    for (let a = 0; a < 8; a++) {
      const th = (a / 8) * Math.PI * 2;
      const r = 1.6;
      g.drawImage(
        sil,
        -ax + Math.cos(th) * r, -ay + Math.sin(th) * r,
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
    edgeGlowPass(g, span, glow);
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
export function buildSkinSet(kind, defaultBody, paintBase) {
  const table = WEAPON_SKINS[kind] || {};
  const finishes = { default: defaultBody };
  let seed = 11;
  for (const [id, skin] of Object.entries(table)) {
    const body = paintBase(skin.palette || {});
    finishes[id] = buildSkin(kind, body, skin, seed);
    seed += 137;
  }
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
