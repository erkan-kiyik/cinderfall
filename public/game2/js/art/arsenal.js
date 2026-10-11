// The LAB arsenal: every weapon drawn as its own object (see guns/*), with
// its own rig and its own skins, wired into the defs the game consumes.
//
// A def is gameplay stats (arsenal-stats.js, unchanged from the shipping
// game) plus art and rig:
//   body / mag / bolt / slide   baked sprites (mag, bolt and slide are drawn
//                               as their own parts so they can animate)
//   gripA / gripB               where each hand closes, on this weapon's own
//                               grip and fore-end — nothing is inherited
//   shoulder / pivot            how it is held: shouldered, at the hip, or up
//                               on top of the shoulder
//   gripBOnBolt                 the support hand rides the bolt (a pump)
//   muzzle / eject / magPos / boltPos
//   finishes                    every skin, each a complete weapon (body plus
//                               its own magazine, slide and bolt, plus rig
//                               overrides such as a longer muzzle once a
//                               suppressor is fitted)

import { makeSprite, lingrad, radgrad } from './paint.js';
import { bake } from './gunkit.js';
import { makeRng } from '../engine/math.js';
import { buildSkin, WEAPON_SKINS } from './skins.js';
import { STATS } from './arsenal-stats.js';
import { RIFLE } from './guns/rifle.js';
import { PISTOL, QUANTUM, RAYGUN } from './guns/pistol.js';
import { SMG, LASERSMG } from './guns/smg.js';
import { KNIFE } from './guns/knife.js';
import { BATTLE, SNIPER, LMG } from './guns/battle.js';
import { MINIGUN, ROCKET, FLAME } from './guns/heavy.js';
import {
  PLASMA, PULSE, ESHOTGUN, ION, EMP, GRAVITY, LIGHTNING, CRYO, PARTICLE, RAILGUN,
} from './guns/energy.js';

export const SPECS = [
  RIFLE, PISTOL, SMG, KNIFE, BATTLE, LMG, MINIGUN, ROCKET, SNIPER, RAYGUN, PLASMA, PULSE,
  ESHOTGUN, QUANTUM, RAILGUN, ION, EMP, GRAVITY, LASERSMG, PARTICLE, LIGHTNING, CRYO, FLAME,
];

// ---- muzzle flash sprites (hot-core star flashes) ----
function paintFlash(seed) {
  const frng = makeRng(seed);
  return makeSprite(44, 30, 6, 15, (g) => {
    g.translate(6, 15);
    g.globalCompositeOperation = 'lighter';
    const petals = frng.int(4, 6);
    for (let i = 0; i < petals; i++) {
      const a = frng.range(-0.7, 0.7) + (i - petals / 2) * 0.34;
      const len = frng.range(12, 30) * (Math.abs(a) < 0.4 ? 1.25 : 0.7);
      const wdt = frng.range(2.4, 4.6);
      g.save();
      g.rotate(a * 0.55);
      g.fillStyle = lingrad(g, 0, 0, len, 0, [
        [0, 'rgba(255,244,214,0.95)'], [0.35, 'rgba(255,196,110,0.8)'],
        [0.8, 'rgba(255,110,40,0.28)'], [1, 'rgba(255,70,20,0)'],
      ]);
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(len * 0.5, -wdt, len, 0);
      g.quadraticCurveTo(len * 0.5, wdt, 0, 0);
      g.closePath(); g.fill();
      g.restore();
    }
    g.fillStyle = radgrad(g, 0, 0, 7.5, [
      [0, 'rgba(255,252,240,1)'], [0.4, 'rgba(255,214,130,0.9)'], [1, 'rgba(255,120,40,0)'],
    ]);
    g.beginPath(); g.arc(0, 0, 7.5, 0, Math.PI * 2); g.fill();
  });
}

const RIG_KEYS = ['gripA', 'gripB', 'muzzle', 'eject', 'magPos', 'boltPos', 'shoulder', 'pivot', 'gripBOnBolt', 'supportAng'];

export function buildWeapons() {
  const flashes = [paintFlash(11), paintFlash(23), paintFlash(37)];
  const defs = {};
  for (const spec of SPECS) {
    const look = { ...spec.look, acc: {} };
    const body = bake(spec.body, look);
    const mag = spec.mag ? bake(spec.mag, look) : null;
    const bolt = spec.bolt ? bake(spec.bolt, look) : null;
    const slide = spec.slide ? bake(spec.slide, look) : null;
    const def = {
      ...STATS[spec.id],
      body, mag, bolt, slide,
      flashes,
      finish: 'default',
    };
    for (const k of RIG_KEYS) if (spec.rig[k] !== undefined) def[k] = spec.rig[k];
    // where the painter measured the muzzle to be, with the default fittings
    const out = { ...(body.out || {}), ...((slide && slide.out) || {}) };
    if (out.muzzle) def.muzzle = out.muzzle;
    body.spriteId = `${spec.id}__default`;
    def.finishes = lazyFinishes(spec, body);
    defs[spec.id] = def;
  }
  return defs;
}

// A skin is a dozen canvas passes (zone masks, a neutral lighting pass,
// pattern, wear, engraving, inlay) times every part of the weapon. Baking all
// 77 of them at boot cost over a second on a desktop and several on a phone,
// for skins most sessions never show. So each finish is a getter that bakes
// on first use and then replaces itself with the result; `warmFinishes`
// fills the cache in idle time so menus that show many skins at once are
// still instant.
function lazyFinishes(spec, body) {
  const fin = { default: body };
  for (const id of Object.keys(WEAPON_SKINS[spec.id] || {})) {
    Object.defineProperty(fin, id, {
      enumerable: true, configurable: true,
      get() {
        const v = buildSkin(spec, spec.look, id);
        Object.defineProperty(fin, id, { value: v, enumerable: true, configurable: true, writable: false });
        return v;
      },
    });
  }
  return fin;
}

function isBaked(fin, id) {
  const d = Object.getOwnPropertyDescriptor(fin, id);
  return !!d && !d.get;
}

// Bakes not-yet-baked finishes one at a time in idle slices while
// `allowed()` says so (the game passes "not in a firefight"). Stops by
// itself when everything is baked.
export function warmFinishes(defs, allowed = () => true) {
  const queue = [];
  for (const def of Object.values(defs)) for (const id of Object.keys(def.finishes || {})) queue.push([def.finishes, id]);
  const ric = window.requestIdleCallback || ((cb) => setTimeout(() => cb({ timeRemaining: () => 12 }), 60));
  const step = (deadline) => {
    while (queue.length && allowed() && deadline.timeRemaining() > 6) {
      const [fin, id] = queue.shift();
      if (!isBaked(fin, id)) { void fin[id]; break; }      // one bake per slice
    }
    if (queue.length) ric(step, { timeout: 2000 });
  };
  ric(step, { timeout: 2000 });
}

// A weapon wearing one of its finishes: the finish's own body, magazine,
// slide and bolt, and its rig overrides. Every place that equips a skin goes
// through here, so a skin can never arrive with the default magazine still
// hanging off it, or with the muzzle flash at the bare barrel's end when a
// suppressor has been fitted.
export function withFinish(base, key) {
  if (!base || !base.finishes || !key || key === 'default' || !base.finishes[key]) return base;
  const fin = base.finishes[key];
  return {
    ...base,
    body: fin,
    mag: fin.mag || base.mag,
    slide: fin.slide || base.slide,
    bolt: fin.bolt || base.bolt,
    ...(fin.over || {}),
    finish: key,
  };
}
