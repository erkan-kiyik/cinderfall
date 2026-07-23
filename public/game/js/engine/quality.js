// Graphics quality presets. "High" is the baseline the game already shipped
// at (dpr cap 2, full bloom + grain, 2600-particle pool, ASSET_SCALE 3) — so
// picking High changes nothing for anyone. Lower presets trade bloom/grain/
// particle density/sprite bake resolution for headroom on weaker hardware;
// Ultra spends a little more where the device can afford it. Source art is
// unaffected either way — every tier still paints from the same procedural
// definitions, just baked at a different resolution (see ASSET_SCALE).

const KEY = 'cinderfall.quality.v1';

export const PRESETS = {
  low:    { name: 'LOW',    dprCap: 1,   assetScale: 2,   particleMax: 900,  bloom: false, bloomBlur: 0,  grain: false, ambientMul: 0.4 },
  medium: { name: 'MEDIUM', dprCap: 1.5, assetScale: 2.5, particleMax: 1600, bloom: true,  bloomBlur: 8,  grain: false, ambientMul: 0.7 },
  high:   { name: 'HIGH',   dprCap: 2,   assetScale: 3,   particleMax: 2600, bloom: true,  bloomBlur: 13, grain: true,  ambientMul: 1 },
  ultra:  { name: 'ULTRA',  dprCap: 3,   assetScale: 3.5, particleMax: 3600, bloom: true,  bloomBlur: 16, grain: true,  ambientMul: 1.25 },
};
const ORDER = ['low', 'medium', 'high', 'ultra'];

// Conservative auto-pick: desktop (no touch) always starts at High — the
// game's original baseline. Only a touch device with a real low-power signal
// (few cores, or a small-screen phone rather than a tablet) starts at
// Medium. Low/Ultra are never auto-selected; they're deliberate opt-ins.
function detectDefaultTier() {
  const touch = (typeof window !== 'undefined') &&
    (('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0);
  if (!touch) return 'high';
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory;   // Chrome/Android only; undefined elsewhere
  const shortEdge = Math.min(window.screen.width, window.screen.height);
  const weak = cores <= 4 || (mem !== undefined && mem <= 3) || shortEdge < 400;
  return weak ? 'medium' : 'high';
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && PRESETS[d.tier]) return d;
    }
  } catch (e) { /* private browsing / unavailable */ }
  return { tier: detectDefaultTier(), pinned: false, autoLowered: false };
}

class Quality {
  constructor() {
    this.data = load();
  }
  get tier() { return this.data.tier; }
  get preset() { return PRESETS[this.data.tier]; }
  get pinned() { return this.data.pinned; }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ }
  }

  // Explicit user choice (from the pause-menu graphics control) — pins the
  // tier so runtime auto-downgrade never overrides it.
  set(tier) {
    if (!PRESETS[tier]) return;
    this.data.tier = tier;
    this.data.pinned = true;
    this.save();
  }

  // Cycles Low → Medium → High → Ultra → Low, for a single-button control.
  cycle() {
    const i = ORDER.indexOf(this.data.tier);
    this.set(ORDER[(i + 1) % ORDER.length]);
    return this.data.tier;
  }

  // One-shot automatic step-down when sustained frame time is poor. Applies
  // even to a pinned choice (a strained preset isn't a good experience
  // either) but only ever fires once per install, so it can't oscillate.
  tryAutoLower() {
    if (this.data.autoLowered) return null;
    const i = ORDER.indexOf(this.data.tier);
    if (i <= 0) { this.data.autoLowered = true; this.save(); return null; }
    this.data.tier = ORDER[i - 1];
    this.data.autoLowered = true;
    this.save();
    return this.data.tier;
  }
}

export const quality = new Quality();
export { ORDER as QUALITY_ORDER };
