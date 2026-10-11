// Weapon skins, LAB edition.
//
// A skin is a finished weapon, not a tint. Each one chooses, per weapon:
//   look     the materials — anodised colour, furniture colour, steel tone,
//            wood, the energy core's colour
//   acc      what is fitted to it (optic, muzzle device, laser, light) on
//            the weapons that take attachments
//   finish   a surface treatment painted onto the right parts: camouflage
//            on furniture and receiver, Damascus on steel, engraved scroll on
//            the receiver panel, titanium heat tint on a barrel, frost…
//   wear     how much bare metal shows on the edges
//   inlay    luminous inlay laid into the engraving (the "glow" skins)
//
// Finishes go on through the weapon's zone masks (see gunkit.js), so camo
// covers the stock and the receiver but never the bore, the optic glass or
// the rubber butt pad, and they are shaded by the gun's own lighting so a
// pattern follows the form instead of lying flat on top of it.

import { ASSET_SCALE, makeCanvas, shade, withA, hexRgb } from './paint.js';
import { bake } from './gunkit.js';
import { makeRng } from '../engine/math.js';

export const SKIN_TIERS = ['common', 'rare', 'epic', 'legendary', 'mythic', 'ultraLimited'];

// ------------------------------------------------------------- palettes

const CAMO = {
  urban:    ['#666b72', '#474b52', '#8b9097', '#2c2f34'],
  woodland: ['#4d5737', '#303824', '#6e6c47', '#1f231a'],
  desert:   ['#9c875f', '#77633f', '#bda980', '#56472e'],
  arctic:   ['#d3d8dd', '#a8b1ba', '#eef1f4', '#76818c'],
  multicam: ['#7b7255', '#5a583f', '#a29570', '#3c3a2b'],
  ash:      ['#3d3d3f', '#2a2a2c', '#58585b', '#1c1c1e'],
  ember:    ['#5a2418', '#3a160e', '#8a3a20', '#24100a'],
  jungle:   ['#3e5a3a', '#26382a', '#5d7a48', '#1a2618'],
  storm:    ['#3c4d5e', '#283442', '#5a6e82', '#1c242e'],
};

// ---------------------------------------------------------- composition

// Draws `fn` in weapon units onto a canvas the size of `spr`.
function layer(spr, fn) {
  const { cv, g } = makeCanvas(spr.cv.width, spr.cv.height);
  const S = ASSET_SCALE;
  g.setTransform(S, 0, 0, S, spr.ax, spr.ay);
  fn(g);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return { cv, g };
}

// Sprite bounds in weapon units.
function unitsBox(spr) {
  const S = ASSET_SCALE;
  return [-spr.ax / S, -spr.ay / S, (spr.cv.width - spr.ax) / S, (spr.cv.height - spr.ay) / S];
}

// Union of zone masks.
function zoneMask(spr, zones) {
  const { cv, g } = makeCanvas(spr.cv.width, spr.cv.height);
  for (const z of zones) if (spr.zones[z]) g.drawImage(spr.zones[z], 0, 0);
  return cv;
}

// Lays a flat-colour pattern onto the sprite through a zone mask, shaded by
// a neutral-grey render of the same weapon (hard-light: mid grey is neutral,
// lighter lifts, darker deepens — so the pattern keeps every bevel, seam and
// highlight the painter drew).
function laySurface(spr, paint, look, zones, draw, alpha = 1) {
  const pat = layer(spr, draw);
  const neutral = bake(paint, look, { neutral: true, bounds: spr.rect });
  pat.g.globalCompositeOperation = 'hard-light';
  pat.g.drawImage(neutral.cv, 0, 0);
  pat.g.globalCompositeOperation = 'destination-in';
  pat.g.drawImage(zoneMask(spr, zones), 0, 0);
  const g = spr.cv.getContext('2d');
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);     // the bake left a weapon-units transform on it
  g.globalCompositeOperation = 'source-atop';
  g.globalAlpha = alpha;
  g.drawImage(pat.cv, 0, 0);
  g.restore();
}

// Overlay (not re-shaded): highlights, engraving, grain — drawn straight on
// through a mask.
function layOver(spr, zones, draw, { op = 'source-atop', alpha = 1 } = {}) {
  const ov = layer(spr, draw);
  ov.g.globalCompositeOperation = 'destination-in';
  ov.g.drawImage(zoneMask(spr, zones), 0, 0);
  const g = spr.cv.getContext('2d');
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = op;
  g.globalAlpha = alpha;
  g.drawImage(ov.cv, 0, 0);
  g.restore();
}

// ---------------------------------------------------------- pattern makers

// An organic blob: a closed curve through jittered radii.
function blob(g, cx, cy, rx, ry, rng) {
  const n = 8;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng.range(-0.2, 0.2);
    const k = rng.range(0.62, 1.25);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  g.beginPath();
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let m = mid(pts[n - 1], pts[0]);
  g.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = mid(pts[i], pts[(i + 1) % n]);
    g.quadraticCurveTo(p[0], p[1], q[0], q[1]);
  }
  g.closePath();
  g.fill();
}

function camo(box, colors, rng, { size = 2.4, density = 0.95, stretch = 1.7 } = {}) {
  return (g) => {
    const [x0, y0, x1, y1] = box;
    g.fillStyle = colors[0];
    g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let li = 1; li < colors.length; li++) {
      g.fillStyle = colors[li];
      const n = Math.round(((x1 - x0) * (y1 - y0)) / (size * size * 4) * density * (li === colors.length - 1 ? 0.6 : 1));
      for (let i = 0; i < n; i++) {
        const r = size * rng.range(0.55, 1.2);
        blob(g, rng.range(x0, x1), rng.range(y0, y1), r * stretch, r, rng);
      }
    }
  };
}

function tiger(box, colors, rng) {
  return (g) => {
    const [x0, y0, x1, y1] = box;
    g.fillStyle = colors[0];
    g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let i = 0; i < Math.round((x1 - x0) * 0.9); i++) {
      g.fillStyle = colors[1 + (i % (colors.length - 1))];
      const cx = rng.range(x0, x1), cy = rng.range(y0, y1);
      const len = rng.range(6, 14), th = rng.range(0.45, 1.1), tilt = rng.range(-0.25, 0.25);
      g.save(); g.translate(cx, cy); g.rotate(tilt);
      g.beginPath(); g.moveTo(-len / 2, 0);
      g.quadraticCurveTo(-len / 4, -th * 1.4, 0, -th * 0.6);
      g.quadraticCurveTo(len / 4, -th * 1.2, len / 2, 0);
      g.quadraticCurveTo(len / 4, th * 0.9, 0, th * 0.4);
      g.quadraticCurveTo(-len / 4, th * 1.1, -len / 2, 0);
      g.fill(); g.restore();
    }
  };
}

// Damascus: folded-steel contour lines, flowing along the part.
function damascus(box, light, dark, rng, { pitch = 0.42 } = {}) {
  return (g) => {
    const [x0, y0, x1, y1] = box;
    const ph = rng.range(0, 6);
    let i = 0;
    for (let y = y0 - 2; y < y1 + 2; y += pitch, i++) {
      g.strokeStyle = i % 2 ? dark : light;
      g.lineWidth = pitch * 0.55;
      g.beginPath();
      for (let x = x0; x <= x1; x += 0.6) {
        const yy = y + Math.sin(x * 0.42 + ph + y * 0.8) * 0.7 + Math.sin(x * 0.13 + y * 1.7) * 0.9;
        if (x === x0) g.moveTo(x, yy); else g.lineTo(x, yy);
      }
      g.stroke();
    }
  };
}

// Engraved scroll: a running vine with curling spirals and leaves, the
// classic ornament on a presentation-grade receiver.
function scrollPath(panel, rng) {
  const p = new Path2D();
  const { x0, x1, y0, y1 } = panel;
  const cy = (y0 + y1) / 2, amp = (y1 - y0) * 0.18;
  const a = x0 + 0.8, b = x1 - 0.8;
  p.moveTo(a, cy);
  for (let x = a; x <= b; x += 0.4) p.lineTo(x, cy + Math.sin((x - a) * 0.5) * amp);
  // a few curls off the vine, alternately up and down, and a leaf at each
  const n = Math.max(1, Math.floor((b - a) / 7));
  for (let i = 0; i < n; i++) {
    const x = a + (i + 0.5) * ((b - a) / n);
    const y = cy + Math.sin((x - a) * 0.5) * amp;
    const dir = i % 2 ? 1 : -1;
    let r = Math.min(1.2, (y1 - y0) * 0.2), ang = 0;
    p.moveTo(x, y);
    for (let t = 0; t < 22; t++) { ang += 0.45; r *= 0.92; p.lineTo(x + Math.sin(ang) * r * 1.2, y + dir * (1 - Math.cos(ang)) * r); }
    p.moveTo(x - 0.4, y);
    p.quadraticCurveTo(x - 1.2, y - dir * 1.0, x - 2.0, y - dir * 0.5);
  }
  return p;
}

// Pinstripe inlay: a pair of fine parallel lines along the panel, closing to
// a point at the front — the clean, premium way luminous inlay is laid.
function pinstripePath(panel) {
  const p = new Path2D();
  const { x0, x1, y0, y1 } = panel;
  const y = y0 + (y1 - y0) * 0.34, gap = Math.min(0.7, (y1 - y0) * 0.12);
  const a = x0 + 1.0, b = x1 - 1.2;
  p.moveTo(a, y - gap); p.lineTo(b - 1.4, y - gap); p.quadraticCurveTo(b, y - gap, b, y);
  p.moveTo(a, y + gap); p.lineTo(b - 1.4, y + gap); p.quadraticCurveTo(b, y + gap, b, y);
  return p;
}

function engrave(spr, panel, rng, color = null) {
  if (!panel) return;
  const path = scrollPath(panel, rng);
  layOver(spr, panel.zones || ['metal'], (g) => {
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = 'rgba(0,0,0,0.42)'; g.lineWidth = 0.24;
    g.stroke(path);
    g.translate(0, -0.12);
    g.strokeStyle = color || 'rgba(245,232,200,0.42)'; g.lineWidth = 0.12;
    g.stroke(path);
  });
}

// Luminous inlay laid into an engraving (or along a panel's centreline).
function inlay(spr, path, color) {
  const [r, gg, b] = hexRgb(color);
  layOver(spr, ['metal', 'furn', 'steel'], (g) => {
    g.filter = `blur(${(0.35 * ASSET_SCALE).toFixed(1)}px)`;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = `rgba(${r},${gg},${b},0.55)`; g.lineWidth = 0.7;
    g.stroke(path);
  }, { op: 'lighter' });
  layOver(spr, ['metal', 'furn', 'steel'], (g) => {
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.42; g.stroke(path);      // the groove it sits in
    g.strokeStyle = `rgb(${r},${gg},${b})`; g.lineWidth = 0.22; g.stroke(path);
    g.strokeStyle = `rgb(${Math.min(255, r + 120)},${Math.min(255, gg + 120)},${Math.min(255, b + 120)})`; g.lineWidth = 0.08; g.stroke(path);
  });
}

// Bare metal along the upper edges, chips and fine scratches.
function wear(spr, amount, rng, metal = '#b4bcc6') {
  const S = ASSET_SCALE;
  const m = zoneMask(spr, ['metal', 'furn', 'steel']);
  const { cv: e, g } = makeCanvas(m.width, m.height);
  g.drawImage(m, 0, 0);
  g.globalCompositeOperation = 'destination-out';
  g.drawImage(m, 0, Math.round(0.45 * S));
  // break the edge up: keep it only under random dashes
  const keep = layer(spr, (h) => {
    const [x0, y0, x1, y1] = unitsBox(spr);
    h.fillStyle = '#fff';
    const n = Math.round((x1 - x0) * 2.2 * amount);
    for (let i = 0; i < n; i++) h.fillRect(rng.range(x0, x1), rng.range(y0, y1), rng.range(0.6, 2.8), 2.0);
  });
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(keep.cv, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = withA(metal, 0.55 * Math.min(1, amount + 0.3));
  g.fillRect(0, 0, e.width, e.height);
  const sg = spr.cv.getContext('2d');
  sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = 'source-atop'; sg.drawImage(e, 0, 0); sg.restore();
  // scratches
  layOver(spr, ['metal', 'furn'], (h) => {
    const [x0, y0, x1, y1] = unitsBox(spr);
    h.strokeStyle = withA(metal, 0.22 * amount); h.lineWidth = 0.12;
    for (let i = 0; i < Math.round((x1 - x0) * 0.6 * amount); i++) {
      const x = rng.range(x0, x1), y = rng.range(y0, y1), l = rng.range(0.8, 2.6), a = rng.range(-0.5, 0.5);
      h.beginPath(); h.moveTo(x, y); h.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); h.stroke();
    }
  });
}

// Polish: a reflected sky band and a dark horizon across bright metal.
function polish(spr, zones, strength = 1) {
  layOver(spr, zones, (g) => {
    const [x0, y0, x1, y1] = unitsBox(spr);
    for (let x = x0 - 20; x < x1; x += 14) {
      const gr = g.createLinearGradient(x, y0, x + 10, y1);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.42, `rgba(255,255,255,${0.09 * strength})`);
      gr.addColorStop(0.58, `rgba(0,0,0,${0.07 * strength})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(x, y1); g.lineTo(x + 4, y1); g.lineTo(x + 14, y0); g.lineTo(x + 10, y0); g.closePath(); g.fill();
    }
  });
}

// Titanium heat tint: straw → bronze → purple → blue along the steel.
function heatTint(box, rng) {
  return (g) => {
    const [x0, y0, x1, y1] = box;
    const gr = g.createLinearGradient(x0, 0, x1, 0);
    const c = ['#c9a14a', '#a66a3a', '#6b3f8a', '#3a5aa8', '#4a8ac0'];
    const off = rng.range(0, 0.2);
    c.forEach((col, i) => gr.addColorStop(Math.min(1, off + i * 0.2), col));
    g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  };
}

function frost(spr, rng) {
  layOver(spr, ['metal', 'furn', 'steel'], (g) => {
    const [x0, y0, x1, y1] = unitsBox(spr);
    g.filter = `blur(${0.5 * ASSET_SCALE}px)`;
    g.fillStyle = 'rgba(232,246,255,0.55)';
    for (let i = 0; i < Math.round((x1 - x0) * 0.5); i++) blob(g, rng.range(x0, x1), rng.range(y0, y1 * 0.4 + y0 * 0.6), rng.range(1.0, 2.4), rng.range(0.6, 1.4), rng);
    g.filter = 'none';
    g.fillStyle = 'rgba(245,252,255,0.8)';
    for (let i = 0; i < Math.round((x1 - x0) * 2); i++) g.fillRect(rng.range(x0, x1), rng.range(y0, y1), 0.22, 0.22);
  });
}

function hazard(spr, band) {
  if (!band) return;
  layOver(spr, ['metal'], (g) => {
    g.save();
    g.beginPath(); g.rect(band.x0, band.y0, band.x1 - band.x0, band.y1 - band.y0); g.clip();
    g.fillStyle = 'rgba(214,170,40,0.9)'; g.fillRect(band.x0, band.y0, band.x1 - band.x0, band.y1 - band.y0);
    g.fillStyle = 'rgba(20,20,20,0.92)';
    for (let x = band.x0 - 8; x < band.x1 + 8; x += 2.4) {
      g.beginPath(); g.moveTo(x, band.y1); g.lineTo(x + 1.2, band.y1); g.lineTo(x + 1.2 + (band.y1 - band.y0), band.y0); g.lineTo(x + (band.y1 - band.y0), band.y0); g.closePath(); g.fill();
    }
    g.restore();
  });
}

// ------------------------------------------------------------- the build

// Floor for base-coat values: anything darker reads as a hole on the night
// street, not as a dark gun. Lifted along its own hue.
const COAT_FLOOR = 30;
function liftToFloor(hex) {
  if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  let [r, g, b] = hexRgb(hex);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (lum >= COAT_FLOOR) return hex;
  const k = (COAT_FLOOR - lum) / 255;
  const up = (v) => Math.min(255, Math.round(v + (255 - v) * k * 1.35 + 6));
  return `#${[up(r), up(g), up(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
function readable(look) {
  const out = {};
  for (const [k, v] of Object.entries(look)) out[k] = typeof v === 'string' ? liftToFloor(v) : v;
  return out;
}

// One sprite (body, magazine, slide or bolt) with a skin's treatments.
function finishPart(paint, look, skin, mounts, seed, isMain) {
  const f = skin.finish || {};
  const treat = !!(skin.wear || skin.inlay || Object.keys(f).length);
  const spr = bake(paint, look, { zones: treat });
  if (!treat) return spr;
  const rng = makeRng(seed);
  const box = unitsBox(spr);
  const on = f.on || ['metal', 'furn'];
  if (f.type === 'camo') laySurface(spr, paint, look, on, camo(box, CAMO[f.camo] || f.colors, rng, f), f.alpha || 1);
  else if (f.type === 'tiger') laySurface(spr, paint, look, on, tiger(box, CAMO[f.camo] || f.colors, rng), f.alpha || 1);
  else if (f.type === 'damascus') layOver(spr, f.on || ['steel'], damascus(box, f.light || 'rgba(235,240,246,0.32)', f.dark || 'rgba(10,12,16,0.32)', rng));
  else if (f.type === 'heat' && mounts.bore) {
    // titanium heat tint, only on the barrel run — never on sights or struts
    const B = mounts.bore, h = B.r * 2 + 0.6;
    const tint = heatTint([B.x0, B.y - h, B.x1, B.y + h], rng);
    laySurface(spr, paint, look, f.on || ['steel'], (g) => { g.beginPath(); g.rect(B.x0, B.y - h, B.x1 - B.x0, h * 2); g.clip(); tint(g); }, f.alpha || 0.85);
  }
  else if (f.type === 'frost') frost(spr, rng);
  if (f.damascus) layOver(spr, f.damascus, damascus(box, 'rgba(235,240,246,0.30)', 'rgba(10,12,16,0.30)', rng));
  if (f.polish) polish(spr, f.polish === true ? ['metal', 'steel'] : f.polish, f.polishStrength || 1);
  if (isMain && f.hazard && mounts.hazard) hazard(spr, mounts.hazard);
  const onPanel = isMain && mounts.panel && (!mounts.panel.part || mounts.panel.part === isMain);
  if (onPanel && f.engrave) engrave(spr, mounts.panel, rng, f.engraveColor);
  if (skin.wear) wear(spr, skin.wear, rng);
  if (onPanel && skin.inlay) inlay(spr, pinstripePath(mounts.panel), skin.inlay);
  delete spr.zones;
  return spr;
}

// One finish for one weapon spec: the body sprite carrying its own repainted
// parts (mag / slide / bolt) and rig overrides (`over` — e.g. where the muzzle
// ends up once a suppressor is fitted), so a skin is a complete weapon, never
// a body on default parts.
function seedOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 100000 + 7;
}

export function buildSkin(spec, baseLook, id) {
  const skin = (WEAPON_SKINS[spec.id] || {})[id];
  if (!skin) return null;
  const seed = seedOf(`${spec.id}:${id}`);
  const look = readable({ ...baseLook, ...(skin.look || {}), acc: { ...(skin.acc || {}) } });
  const m = spec.mounts || {};
  const body = finishPart(spec.body, look, skin, m, seed, 'body');
  if (spec.mag) body.mag = finishPart(spec.mag, look, { ...skin, inlay: null, finish: skin.finish && skin.finish.onMag ? skin.finish : null }, m, seed + 1, false);
  if (spec.slide) body.slide = finishPart(spec.slide, look, skin, m, seed + 2, 'slide');
  if (spec.bolt) body.bolt = finishPart(spec.bolt, look, { ...skin, inlay: null }, m, seed + 3, false);
  const over = { ...(body.out || {}), ...((body.slide && body.slide.out) || {}) };
  body.over = {};
  if (over.muzzle) body.over.muzzle = over.muzzle;
  body.spriteId = `${spec.id}__${id}`;
  return body;
}

// Every finish for one weapon, baked now (tools and tests use this; the game
// itself bakes finishes on first use — see arsenal.js).
export function buildSkinSet(spec, baseLook) {
  const finishes = {};
  for (const id of Object.keys(WEAPON_SKINS[spec.id] || {})) finishes[id] = buildSkin(spec, baseLook, id);
  return finishes;
}

export function skinList() {
  const out = [];
  for (const [kind, table] of Object.entries(WEAPON_SKINS)) {
    for (const [id, skin] of Object.entries(table)) out.push({ kind, id, ...skin });
  }
  return out;
}

// ================================================================= table
// Ids, names and tiers are the game's economy (crates, trader, saves) and
// stay as they were; everything about how each one looks is new.

const G = (color, intensity = 1) => ({ color, intensity });   // meta's GLOW tag

export const WEAPON_SKINS = {
  // ------------------------------------------------------------ VK-77
  rifle: {
    urban:   { name: 'VK-77 · URBAN', tier: 'common',
               look: { alu: '#5c6168', poly: '#4a4e55' }, finish: { type: 'camo', camo: 'urban' } },
    cinder:  { name: 'VK-77 · CINDER', tier: 'rare',
               look: { alu: '#7a3c24', poly: '#3a2a24', mag: '#3c3e42' }, acc: { muzzle: 'brake' }, wear: 0.9 },
    spectre: { name: 'VK-77 · SPECTRE', tier: 'epic', glow: G('#b26bff', 0.55),
               look: { alu: '#2a2c33', poly: '#26272c', steel: '#2e3036' }, acc: { muzzle: 'can', laser: true, optic: 'holo' },
               finish: { polish: ['metal'] }, inlay: '#b26bff' },
    arc:     { name: 'ARC-9 · PULSE', tier: 'legendary', glow: G('#3fd2ff', 1.0),
               look: { alu: '#1f5b6a', poly: '#22343a', steel: '#3a3d42' }, acc: { muzzle: 'comp', optic: 'acog' },
               finish: { type: 'heat', on: ['steel'] }, inlay: '#3fd2ff' },
    inferno: { name: 'VK-77 · INFERNO', tier: 'mythic', glow: G('#ff5a3c', 1.15),
               look: { alu: '#8a1e1a', poly: '#2a1a18', steel: '#c9a23a', mag: '#2a2a2c' }, acc: { muzzle: 'prong', optic: 'lpvo' },
               finish: { polish: ['metal', 'steel'], engrave: true, engraveColor: 'rgba(255,214,140,0.7)' }, inlay: '#ff6a3c' },
    warden:  { name: 'VK-77 · WARDEN', tier: 'ultraLimited', glow: G('#39e6a0', 1.3),
               look: { alu: '#2e4a36', poly: '#26302a', steel: '#5a5f66' }, acc: { muzzle: 'can', optic: 'lpvo', laser: true },
               finish: { damascus: ['steel'], engrave: true }, inlay: '#39e6a0' },
  },

  // -------------------------------------------------------------- C-9
  pistol: {
    desert:  { name: 'C-9 · DESERT', tier: 'common',
               look: { poly: '#8e7a56', slide: '#7a6a4c' }, finish: { type: 'camo', camo: 'desert', size: 1.8 } },
    onyx:    { name: 'C-9 · ONYX', tier: 'rare',
               look: { poly: '#26272a', slide: '#2c2e33', hood: '#8a7a54' }, acc: { muzzle: 'comp' }, finish: { polish: ['metal'] } },
    gold:    { name: 'C-9 · GILDED', tier: 'epic', glow: G('#ffd166', 0.5),
               look: { poly: '#2a2420', slide: '#c9a23a', steel: '#b8912e', hood: '#d8b850' }, acc: { muzzle: 'comp' },
               finish: { polish: ['metal', 'steel'], engrave: true, engraveColor: 'rgba(255,240,190,0.75)' } },
    quantum: { name: 'C-9 · QUANTUM', tier: 'legendary', glow: G('#b26bff', 1.05),
               look: { poly: '#2c2440', slide: '#3a3f4a', steel: '#3a3d44' }, acc: { optic: 'rmr', light: true },
               finish: { type: 'heat', on: ['steel', 'metal'], alpha: 0.75 }, inlay: '#b26bff' },
    reaper:  { name: 'C-9 · REAPER', tier: 'mythic', glow: G('#ff4d6d', 1.2),
               look: { poly: '#2a1a1e', slide: '#2a2c30', steel: '#3a3d42' }, acc: { muzzle: 'can', optic: 'rmr', light: true },
               finish: { damascus: ['steel'], engrave: true }, inlay: '#ff4d6d' },
  },

  // -------------------------------------------------------------- P-12
  smg: {
    viper:   { name: 'P-12 · VIPER', tier: 'rare',
               look: { alu: '#3e5038', poly: '#33402e' }, acc: { muzzle: 'comp' }, finish: { type: 'camo', camo: 'jungle' } },
    arc:     { name: 'P-12 · TESLA', tier: 'epic', glow: G('#3fd2ff', 0.9),
               look: { alu: '#2a4a58', poly: '#22303a' }, acc: { optic: 'reddot', muzzle: 'can' }, finish: { type: 'heat', on: ['steel'] }, inlay: '#3fd2ff' },
    hornet:  { name: 'P-12 · HORNET', tier: 'legendary', glow: G('#ffd166', 0.85),
               look: { alu: '#2e2c28', poly: '#c99a2a', steel: '#3a3832' }, acc: { optic: 'holo', muzzle: 'brake' },
               finish: { polish: ['metal'] }, inlay: '#ffd166' },
    nightfall: { name: 'P-12 · NIGHTFALL', tier: 'mythic', glow: G('#8b5cf6', 1.2),
               look: { alu: '#2a2636', poly: '#221e2c', steel: '#3a3a44' }, acc: { optic: 'acog', muzzle: 'can' },
               finish: { polish: ['metal'], engrave: true, damascus: ['steel'] }, inlay: '#8b5cf6' },
  },

  // --------------------------------------------------------- TALON-7
  knife: {
    ravage:   { name: 'TALON-7 · RAVAGE', tier: 'rare',
                look: { blade: 'bowie', handle: 'wood', poly: '#6a4529', bladeColor: '#8f969f', guard: '#5a4a3a' }, wear: 0.8 },
    voidedge: { name: 'VOID EDGE', tier: 'epic', glow: G('#8b5cf6', 1.45),
                look: { blade: 'tanto', poly: '#26222e', bladeColor: '#3a3a46', edge: [178, 107, 255] } },
    volt:     { name: 'VOLT EDGE', tier: 'legendary', glow: G('#3fd2ff', 1.2),
                look: { blade: 'clip', poly: '#22343c', bladeColor: '#9aa4ae', edge: [63, 210, 255] },
                finish: { type: 'damascus', on: ['steel'] } },
    bloodmoon:{ name: 'BLOODMOON', tier: 'mythic', glow: G('#ff2d55', 1.3),
                look: { blade: 'bowie', handle: 'wood', poly: '#5a1a22', bladeColor: '#2c2a2e', guard: '#c9a23a', edge: [255, 45, 85] },
                finish: { polish: ['steel'] } },
    eventide: { name: 'EVENTIDE', tier: 'ultraLimited', glow: G('#4ee0d6', 1.4),
                look: { blade: 'tanto', poly: '#1e3a36', bladeColor: '#a8b2bc', guard: '#3a6a64', edge: [78, 224, 214] },
                finish: { type: 'damascus', on: ['steel'], polish: ['steel'] } },
  },

  // ------------------------------------------------------------- MK-2
  battle: {
    ranger:    { name: 'MK-2 · RANGER', tier: 'rare',
                 look: { alu: '#5a5e44', poly: '#4a4e38' }, finish: { type: 'camo', camo: 'woodland' }, wear: 0.4 },
    marksman:  { name: 'MK-2 · MARKSMAN', tier: 'epic',
                 look: { alu: '#3a4048', poly: '#2e333a' }, acc: { optic: 'lpvo', muzzle: 'can' }, finish: { type: 'camo', camo: 'storm' } },
    sovereign: { name: 'MK-2 · SOVEREIGN', tier: 'legendary', glow: G('#ffd166', 0.8),
                 look: { alu: '#2a2620', poly: '#5a3a24', steel: '#c9a23a', rubber: '#2a2420' }, acc: { optic: 'acog', muzzle: 'brake' },
                 finish: { polish: ['steel', 'metal'], engrave: true, engraveColor: 'rgba(255,230,170,0.7)' }, inlay: '#ffd166' },
  },

  // ------------------------------------------------------------ M-900
  lmg: {
    trench:     { name: 'M-900 · TRENCH', tier: 'rare',
                  look: { alu: '#4a4e3a', poly: '#3e4232', box: '#5a5a3e' }, finish: { type: 'camo', camo: 'multicam' }, wear: 0.6 },
    juggernaut: { name: 'M-900 · JUGGERNAUT', tier: 'epic',
                  look: { alu: '#33363b', poly: '#2a2c30', box: '#2e3034' }, acc: { optic: 'acog', muzzle: 'brake' }, wear: 1.0 },
    devastator: { name: 'M-900 · DEVASTATOR', tier: 'legendary', glow: G('#ff6a3c', 1.0),
                  look: { alu: '#3a2420', poly: '#2a1c18', box: '#3a2420' }, acc: { optic: 'holo', muzzle: 'prong' },
                  finish: { type: 'tiger', camo: 'ember' }, inlay: '#ff6a3c' },
  },

  // ------------------------------------------------------------ LRS-1
  sniper: {
    frost:    { name: 'LRS-1 · FROST', tier: 'rare',
                look: { alu: '#c8ced4', poly: '#dfe4e8' }, finish: { type: 'camo', camo: 'arctic', size: 2.6 } },
    ghost:    { name: 'LRS-1 · GHOST', tier: 'epic',
                look: { alu: '#3a3e44', poly: '#383c40' }, acc: { muzzle: 'can' }, finish: { type: 'camo', camo: 'ash' } },
    longshot: { name: 'LRS-1 · LONGSHOT', tier: 'legendary', glow: G('#3fd2ff', 0.9),
                look: { alu: '#2a3e48', poly: '#2a3a42', steel: '#4a5058' }, acc: { muzzle: 'brake' },
                finish: { type: 'heat', on: ['steel'], engrave: true }, inlay: '#3fd2ff' },
  },

  // ------------------------------------------------------ ANNIHILATOR
  minigun: {
    warlord:     { name: 'ANNIHILATOR · WARLORD', tier: 'epic',
                   look: { alu: '#5a4a32', steel: '#3a3630', can: '#5a5038', poly: '#2e2a24' }, finish: { type: 'camo', camo: 'desert' }, wear: 0.7 },
    executioner: { name: 'ANNIHILATOR · EXECUTIONER', tier: 'legendary', glow: G('#ff5a3c', 1.0),
                   look: { alu: '#2a2a2e', steel: '#3a3a40', can: '#5a1a16', poly: '#26262a' },
                   finish: { type: 'heat', on: ['steel'], engrave: true }, inlay: '#ff5a3c' },
    apocalypse:  { name: 'ANNIHILATOR · APOCALYPSE', tier: 'ultraLimited', glow: G('#7fb3ff', 1.3),
                   look: { alu: '#c9a23a', steel: '#2e3036', can: '#2a2c32', poly: '#2a2420' },
                   finish: { polish: ['metal'], engrave: true, damascus: ['steel'], engraveColor: 'rgba(255,236,190,0.7)' }, inlay: '#7fb3ff' },
  },

  // ------------------------------------------------------ SIEGEBREAKER
  rocket: {
    foreman:    { name: 'SIEGEBREAKER · FOREMAN', tier: 'epic',
                  look: { alu: '#6a6e5a', wood: '#8a5a32', warhead: '#6a6e52' }, wear: 0.9 },
    demolition: { name: 'SIEGEBREAKER · DEMOLITION', tier: 'legendary', glow: G('#ffa63c', 0.9),
                  look: { alu: '#3a3a36', wood: '#5a3a22', warhead: '#c98a2a', motor: '#3a3a36' },
                  finish: { hazard: true, engrave: true }, inlay: '#ffa63c' },
    doomsday:   { name: 'SIEGEBREAKER · DOOMSDAY', tier: 'ultraLimited', glow: G('#d46bff', 1.3),
                  look: { alu: '#2a2430', wood: '#3a2420', warhead: '#3a2a46', steel: '#c9a23a', motor: '#2a2430' },
                  finish: { polish: ['metal', 'steel'], engrave: true, engraveColor: 'rgba(255,230,190,0.7)' }, inlay: '#d46bff' },
  },

  // ---------------------------------------------------- QUANTUM PISTOL
  quantum: {
    phase:    { name: 'QUANTUM · PHASE', tier: 'rare',
                look: { poly: '#2e3a4a', alu: '#4a5a6e', core: [120, 200, 255] }, finish: { type: 'camo', camo: 'storm', size: 1.8 } },
    entangle: { name: 'QUANTUM · ENTANGLE', tier: 'epic', glow: G('#b26bff', 1.0),
                look: { poly: '#2a2238', alu: '#3a3052', core: [178, 107, 255] }, finish: { polish: ['metal'], type: 'heat', on: ['steel'] } },
    paradox:  { name: 'QUANTUM · PARADOX', tier: 'legendary', glow: G('#4ee0d6', 1.2),
                look: { poly: '#1e2e2e', alu: '#c9a23a', steel: '#2e3a3a', core: [78, 224, 214] },
                finish: { polish: ['metal'], engrave: true, engraveColor: 'rgba(255,236,190,0.7)' }, inlay: '#4ee0d6' },
  },

  // ----------------------------------------------------------- RAY GUN
  raygun: {
    retro:        { name: 'RAY GUN · RETRO', tier: 'rare',
                    look: { alu: '#b04a3a', poly: '#e8dcc0', steel: '#c9ccd2', core: [255, 120, 90] }, finish: { polish: ['metal', 'steel'] } },
    atomic:       { name: 'RAY GUN · ATOMIC', tier: 'epic', glow: G('#9cff6b', 1.0),
                    look: { alu: '#cfd4da', poly: '#2a3a24', steel: '#8a9098', core: [156, 255, 107] }, finish: { polish: ['metal', 'steel'] } },
    annihilation: { name: 'RAY GUN · ANNIHILATION', tier: 'legendary', glow: G('#ff4d9d', 1.2),
                    look: { alu: '#c9a23a', poly: '#2a1a24', steel: '#d8b850', core: [255, 77, 157] },
                    finish: { polish: ['metal', 'steel'], engrave: true, engraveColor: 'rgba(255,236,200,0.7)' }, inlay: '#ff4d9d' },
  },

  // ------------------------------------------------------ PLASMA RIFLE
  plasma: {
    coolant:    { name: 'PLASMA · COOLANT', tier: 'rare',
                  look: { poly: '#c8d0d6', alu: '#9aa6ae', cell: '#7a8a96', core: [120, 220, 255] }, finish: { type: 'camo', camo: 'arctic' } },
    solarflare: { name: 'PLASMA · SOLAR FLARE', tier: 'epic', glow: G('#ffa63c', 1.0),
                  look: { poly: '#3a2a1e', alu: '#5a3a1e', core: [255, 166, 60] }, acc: { optic: 'holo' }, finish: { type: 'heat', on: ['steel'] } },
    starcore:   { name: 'PLASMA · STARCORE', tier: 'legendary', glow: G('#b26bff', 1.1),
                  look: { poly: '#2a2238', alu: '#3a2e52', core: [178, 107, 255] }, acc: { optic: 'acog' },
                  finish: { polish: ['metal'], engrave: true }, inlay: '#b26bff' },
  },

  // ------------------------------------------------------- PULSE RIFLE
  pulse: {
    tracer:    { name: 'PULSE · TRACER', tier: 'rare',
                 look: { poly: '#4a4e3a', alu: '#4a4e3a', core: [180, 255, 120] }, finish: { type: 'camo', camo: 'multicam' } },
    resonance: { name: 'PULSE · RESONANCE', tier: 'epic', glow: G('#3fd2ff', 0.9),
                 look: { poly: '#26343e', alu: '#2a3a46', copper: '#7a8a96', core: [63, 210, 255] }, finish: { type: 'camo', camo: 'storm' } },
    harmonic:  { name: 'PULSE · HARMONIC', tier: 'legendary', glow: G('#39e6a0', 1.1),
                 look: { poly: '#1e2e26', alu: '#2a3a32', copper: '#c9a23a', core: [57, 230, 160] },
                 finish: { engrave: true, polish: ['steel'] }, inlay: '#39e6a0' },
  },

  // ---------------------------------------------------- ENERGY SHOTGUN
  eshotgun: {
    scatter:    { name: 'SCATTER · FIELD', tier: 'rare',
                  look: { alu: '#5a5040', poly: '#4a4232', wood: '#7a5230' }, finish: { type: 'camo', camo: 'desert' }, wear: 0.5 },
    breacher:   { name: 'SCATTER · BREACHER', tier: 'epic', glow: G('#ff4d6d', 0.9),
                  look: { alu: '#3a2a30', poly: '#2a2024', core: [255, 77, 109] }, wear: 0.8 },
    stormfront: { name: 'SCATTER · STORMFRONT', tier: 'legendary', glow: G('#63b3ff', 1.1),
                  look: { alu: '#2a3a48', poly: '#26323e', core: [99, 179, 255] },
                  finish: { type: 'heat', on: ['steel'], engrave: true }, inlay: '#63b3ff' },
  },

  // -------------------------------------------------------- ION CANNON
  ion: {
    driver:      { name: 'ION · DRIVER', tier: 'rare',
                   look: { alu: '#4a5a48', poly: '#3a4638', core: [120, 255, 180] }, finish: { type: 'camo', camo: 'woodland' }, wear: 0.5 },
    cascade:     { name: 'ION · CASCADE', tier: 'epic', glow: G('#6b8cff', 1.0),
                   look: { alu: '#2a3458', poly: '#242a40', core: [107, 140, 255] }, finish: { type: 'heat', on: ['steel'] } },
    singularity: { name: 'ION · SINGULARITY', tier: 'legendary', glow: G('#c26bff', 1.2),
                   look: { alu: '#2a2230', poly: '#221c28', steel: '#3a3442', core: [194, 107, 255] },
                   finish: { polish: ['metal'], engrave: true, damascus: ['steel'] }, inlay: '#c26bff' },
  },

  // ------------------------------------------------------ EMP LAUNCHER
  emp: {
    disruptor: { name: 'EMP · DISRUPTOR', tier: 'rare',
                 look: { alu: '#3a4858', poly: '#2e3a46', core: [120, 200, 255] }, finish: { type: 'camo', camo: 'storm' } },
    blackout:  { name: 'EMP · BLACKOUT', tier: 'epic', glow: G('#7fb3ff', 0.9),
                 look: { alu: '#2c2e33', poly: '#26282c', core: [127, 179, 255] }, acc: { optic: 'acog' }, wear: 0.6 },
    overload:  { name: 'EMP · OVERLOAD', tier: 'legendary', glow: G('#5cff8f', 1.1),
                 look: { alu: '#2a3a2a', poly: '#223022', core: [92, 255, 143] }, finish: { engrave: true, type: 'heat', on: ['steel'] }, inlay: '#5cff8f' },
  },

  // ------------------------------------------------------- GRAVITY GUN
  gravity: {
    anchor:       { name: 'GRAVITY · ANCHOR', tier: 'rare',
                    look: { alu: '#5a5a62', poly: '#c08a2a', core: [200, 160, 255] }, wear: 0.9 },
    eventhorizon: { name: 'GRAVITY · EVENT HORIZON', tier: 'epic', glow: G('#9b6bff', 1.0),
                    look: { alu: '#2a2440', poly: '#221e30', core: [155, 107, 255] }, finish: { polish: ['metal'] } },
    collapse:     { name: 'GRAVITY · COLLAPSE', tier: 'legendary', glow: G('#d4a6ff', 1.2),
                    look: { alu: '#26242c', poly: '#1e1c24', steel: '#c9a23a', core: [212, 166, 255] },
                    finish: { polish: ['metal', 'steel'], engrave: true }, inlay: '#d4a6ff' },
  },

  // --------------------------------------------------- LIGHTNING RIFLE
  lightning: {
    arcline:     { name: 'LIGHTNING · ARCLINE', tier: 'rare',
                   look: { wood: '#4a3a24', alu: '#3a4030', copper: '#b06838', core: [160, 220, 255] }, wear: 0.6 },
    thunderhead: { name: 'LIGHTNING · THUNDERHEAD', tier: 'epic', glow: G('#8fd0ff', 1.0),
                   look: { wood: '#2e3440', alu: '#2a3442', copper: '#8a9aa8', core: [143, 208, 255] }, finish: { polish: ['metal', 'steel'] } },
    tempest:     { name: 'LIGHTNING · TEMPEST', tier: 'legendary', glow: G('#ffe45c', 1.2),
                   look: { wood: '#5a2a1a', alu: '#2a2420', copper: '#c9a23a', brass: '#e0c060', core: [255, 228, 92] },
                   finish: { engrave: true, polish: ['steel'] }, inlay: '#ffe45c' },
  },

  // ---------------------------------------------------------- CRYO GUN
  cryo: {
    permafrost: { name: 'CRYO · PERMAFROST', tier: 'rare',
                  look: { alu: '#5a6a76', poly: '#4a5864', tank: '#b8c4cc' }, finish: { type: 'frost' } },
    glacier:    { name: 'CRYO · GLACIER', tier: 'epic', glow: G('#9fe4ff', 1.0),
                  look: { alu: '#c8d4dc', poly: '#9aaab6', tank: '#eef4f8', core: [159, 228, 255] }, finish: { type: 'camo', camo: 'arctic' } },
    absolute:   { name: 'CRYO · ABSOLUTE ZERO', tier: 'legendary', glow: G('#7fe8ff', 1.2),
                  look: { alu: '#2a3a46', poly: '#22303a', tank: '#3a4a56', core: [127, 232, 255] },
                  finish: { type: 'frost', engrave: true, polish: ['steel'] }, inlay: '#7fe8ff' },
  },

  // ------------------------------------------------------- LASER SMG
  lasersmg: {
    beamline: { name: 'LASER SMG · BEAMLINE', tier: 'rare',
                look: { poly: '#2e2a40', alu: '#3a3450', core: [140, 120, 255] }, finish: { type: 'camo', camo: 'storm' } },
    photon:   { name: 'LASER SMG · PHOTON', tier: 'epic', glow: G('#ff6b9d', 1.0),
                look: { poly: '#e2dcd8', alu: '#b8b0ac', core: [255, 107, 157] }, finish: { polish: ['metal'] } },
    prism:    { name: 'LASER SMG · PRISM', tier: 'legendary', glow: G('#5cffcc', 1.2),
                look: { poly: '#1e302a', alu: '#26403a', core: [92, 255, 204] }, finish: { type: 'heat', on: ['steel', 'metal'], engrave: true }, inlay: '#5cffcc' },
  },

  // --------------------------------------------------- PARTICLE BEAM
  particle: {
    emitter:     { name: 'PARTICLE · EMITTER', tier: 'rare',
                   look: { alu: '#4a4a52', poly: '#3a3a42', core: [200, 140, 255] }, wear: 0.7 },
    fluxcore:    { name: 'PARTICLE · FLUX CORE', tier: 'epic', glow: G('#3fd2ff', 1.0),
                   look: { alu: '#2a4250', poly: '#22343e', ring: '#c9a23a', core: [63, 210, 255] }, finish: { polish: ['metal'] } },
    annihilator: { name: 'PARTICLE · ANNIHILATOR', tier: 'legendary', glow: G('#ff6bff', 1.2),
                   look: { alu: '#3a1e3a', poly: '#2a1a2a', ring: '#2a2a30', core: [255, 107, 255] },
                   finish: { engrave: true, type: 'heat', on: ['steel'] }, inlay: '#ff6bff' },
  },

  // ---------------------------------------------------- GAUSS RAILGUN
  railgun: {
    coilwork:      { name: 'RAILGUN · COILWORK', tier: 'rare',
                     look: { alu: '#4a4e44', poly: '#3a3e34', copper: '#b06838' }, finish: { type: 'camo', camo: 'multicam' } },
    magnetar:      { name: 'RAILGUN · MAGNETAR', tier: 'epic', glow: G('#6b8cff', 1.0),
                     look: { alu: '#262c44', poly: '#20253a', copper: '#7a8ab0', core: [107, 140, 255] }, finish: { polish: ['metal'] } },
    hypervelocity: { name: 'RAILGUN · HYPERVELOCITY', tier: 'legendary', glow: G('#ffd166', 1.1),
                     look: { alu: '#2a2620', poly: '#3a2a1e', copper: '#c9a23a', core: [255, 209, 102] },
                     finish: { engrave: true, polish: ['steel', 'metal'], engraveColor: 'rgba(255,230,170,0.7)' }, inlay: '#ffd166' },
  },

  // ---------------------------------------------------- FLAME THROWER
  flame: {
    scorch:    { name: 'FLAME · SCORCH', tier: 'rare',
                 look: { alu: '#4a3a2a', poly: '#3a3028', tank: '#5a4a2a' }, finish: { type: 'heat', on: ['steel'] }, wear: 0.8 },
    pyroclast: { name: 'FLAME · PYROCLAST', tier: 'epic', glow: G('#ff7a3c', 1.0),
                 look: { alu: '#2e2622', poly: '#2a201c', tank: '#8a3a1a' }, finish: { type: 'tiger', camo: 'ember' } },
    hellfire:  { name: 'FLAME · HELLFIRE', tier: 'legendary', glow: G('#ff4d1a', 1.2),
                 look: { alu: '#2a1a16', poly: '#221614', tank: '#5a1a12', steel: '#c9a23a' },
                 finish: { polish: ['steel', 'metal'], engrave: true, engraveColor: 'rgba(255,220,160,0.7)' }, inlay: '#ff4d1a' },
  },
};
