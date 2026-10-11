// Weapon stat readout.
//
// Turns a raw weapon def (art/weapons.js) into printable, comparable rows for
// the inspect panel. Two things matter here:
//
//  1. Bars are normalised against the *whole roster*, not against an arbitrary
//     constant. A full damage bar means "the hardest-hitting weapon in the
//     game", so comparing two cards is meaningful rather than decorative.
//
//  2. For metrics where lower is better (recoil, spread, reload) the bar is
//     inverted, so a long bar always reads as "good" no matter the metric.
//     The number printed next to it is still the raw value — the bar is the
//     comparison, the number is the fact.

import { t } from '../engine/i18n.js';

// Each metric: where to read it, its i18n key, how to format the raw value,
// and whether a lower raw value is the better outcome.
const METRICS = [
  {
    id: 'damage', key: 'stat.damage', lowerIsBetter: false,
    read: (w) => w.dmg,
    fmt: (v) => String(Math.round(v)),
  },
  {
    id: 'rpm', key: 'stat.rpm', lowerIsBetter: false,
    read: (w) => w.rpm,
    fmt: (v) => `${Math.round(v)} RPM`,
  },
  {
    id: 'spread', key: 'stat.spread', lowerIsBetter: true,
    read: (w) => w.spread,
    // spread is radians of cone; a percentage of "how tight" reads better
    fmt: (v, norm) => `${Math.round(norm * 100)}%`,
  },
  {
    id: 'recoil', key: 'stat.recoil', lowerIsBetter: true,
    read: (w) => w.recoilKick,
    fmt: (v) => v.toFixed(2),
  },
  {
    id: 'mag', key: 'stat.mag', lowerIsBetter: false,
    read: (w) => w.magSize,
    fmt: (v) => String(Math.round(v)),
  },
  {
    id: 'reload', key: 'stat.reload', lowerIsBetter: true,
    read: (w) => w.reloadT,
    fmt: (v) => `${v.toFixed(1)}s`,
  },
];

// Roster-wide min/max per metric, computed once per weapon table.
// Cached on the table object so repeated panel opens don't rescan it.
const RANGE_CACHE = new WeakMap();

function ranges(weapons) {
  const hit = RANGE_CACHE.get(weapons);
  if (hit) return hit;
  const out = {};
  for (const m of METRICS) {
    let lo = Infinity, hi = -Infinity;
    for (const w of Object.values(weapons)) {
      if (!w || w.kind !== 'gun') continue;          // melee has no ballistics
      const v = m.read(w);
      if (typeof v !== 'number' || !Number.isFinite(v)) continue;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    out[m.id] = { lo, hi };
  }
  RANGE_CACHE.set(weapons, out);
  return out;
}

// Fill colour ramp: weak -> strong. Kept in one place so the bar and any
// numeric emphasis can't drift apart.
export function fillColor(fill) {
  if (fill >= 0.75) return '#5cc98a';       // strong
  if (fill >= 0.5) return '#c9bf5c';        // decent
  if (fill >= 0.28) return '#d69a4a';       // middling
  return '#c9564a';                          // weak
}

// Builds the rows for one weapon.
// Returns [] for anything without ballistics (knife, or an unknown id), which
// the caller uses to decide whether to render a stat block at all.
export function weaponStatRows(weapon, weapons) {
  if (!weapon || weapon.kind !== 'gun') return [];
  const R = ranges(weapons);
  const rows = [];
  for (const m of METRICS) {
    const raw = m.read(weapon);
    if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
    const { lo, hi } = R[m.id];
    // Degenerate range (every weapon identical on this metric): show it full
    // rather than dividing by zero.
    const span = hi - lo;
    let norm = span > 1e-9 ? (raw - lo) / span : 1;
    if (m.lowerIsBetter) norm = 1 - norm;
    norm = Math.max(0.04, Math.min(1, norm));   // keep a sliver visible at zero
    rows.push({
      id: m.id,
      label: t(m.key),
      value: m.fmt(raw, norm),
      fill: norm,
      color: fillColor(norm),
    });
  }
  return rows;
}

// Resolves which weapon def an inventory item describes.
// Skins carry `weaponId`; weapon picks carry `apply.weapon`; everything else
// (operators, etc.) has no weapon and returns null.
export function weaponForItem(item, weapons) {
  if (!item) return null;
  const id = item.weaponId
    || (item.apply && item.apply.type === 'weaponBody' && item.apply.weapon)
    || (item.apply && item.apply.type === 'finish' && item.apply.weapon)
    || null;
  return id ? (weapons[id] || null) : null;
}
