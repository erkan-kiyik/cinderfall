// Graphics quality presets. "High" is the baseline the game already shipped
// at (dpr cap 2, full bloom + grain, 2600-particle pool, ASSET_SCALE 3) — so
// picking High changes nothing for anyone. Lower presets trade bloom/grain/
// particle density/sprite bake resolution for headroom on weaker hardware;
// Ultra spends a little more where the device can afford it. Source art is
// unaffected either way — every tier still paints from the same procedural
// definitions, just baked at a different resolution (see ASSET_SCALE).

const KEY = 'cinderfall.quality.v1';

// `accentPx` is the width in screen pixels of the hairline position marker
// drawn under each character (0 = off). It is a single stroke per entity —
// cheap enough that only the weakest tier drops it.
// `lightScale` is the resolution the light map is rendered at, as a fraction
// of the main canvas. A light map is low-frequency by nature — broad radial
// falloffs multiplied over the scene — so halving it is invisible in motion
// while quartering the fill and the texture the compositor has to upload each
// frame. On weak hardware that composite was the single spikiest step in the
// frame (measured p95 of 158ms at 6x CPU throttle).
//
// `renderScale` is the fraction of the (already dpr-capped) resolution the
// scene canvas is actually rendered at; the element is CSS-sized to the
// viewport either way, so the browser scales the result back up. This is the
// bluntest and most effective lever there is on a rasterisation-bound canvas
// game — 0.7 is half the pixels — and it costs only softness in the scene
// itself. The HUD, menus and all type are DOM and stay pin sharp.
//
// `bloom` is a full-canvas `filter: blur()` pass, which is the single most
// expensive step in the frame on mobile — and it was on at Medium, the tier
// most phones land on. Measured at a 2x CPU throttle, Medium ran at roughly a
// quarter of Low's frame rate, almost all of it that one pass. It is a High
// and Ultra feature now, which also makes the ladder mean something: the tiers
// below it are the ones that have to hold 60.
//
// `richGrade` selects the full four-pass colour grade. The warm-highlight and
// cool-shadow passes use `overlay` and `soft-light`, which are the two most
// expensive blend modes a mobile GPU has to service; the cheap path folds them
// into one `source-over` fill of the same net tint.
export const PRESETS = {
  low:    { name: 'LOW',    dprCap: 1,   assetScale: 2,   particleMax: 900,  bloom: false, bloomBlur: 0,  grain: false, ambientMul: 0.4,  accentPx: 0,   lightScale: 0.5,  richGrade: false, renderScale: 0.7 },
  medium: { name: 'MEDIUM', dprCap: 1.5, assetScale: 2.5, particleMax: 1600, bloom: false, bloomBlur: 0,  grain: false, ambientMul: 0.7,  accentPx: 1.2, lightScale: 0.75, richGrade: true,  renderScale: 0.85 },
  high:   { name: 'HIGH',   dprCap: 2,   assetScale: 3,   particleMax: 2600, bloom: true,  bloomBlur: 13, grain: true,  ambientMul: 1,    accentPx: 1.4, lightScale: 1,    richGrade: true,  renderScale: 1 },
  ultra:  { name: 'ULTRA',  dprCap: 3,   assetScale: 3.5, particleMax: 3600, bloom: true,  bloomBlur: 16, grain: true,  ambientMul: 1.25, accentPx: 1.4, lightScale: 1,    richGrade: true,  renderScale: 1 },
};
const ORDER = ['low', 'medium', 'high', 'ultra'];
// How many times the runtime may step the preset down on its own. Two is
// enough to walk High -> Low, and bounded so a device having one bad minute
// cannot end up permanently on the lowest tier over many sessions.
const MAX_AUTO_LOWER = 2;

// Auto-pick. Desktop (no touch) starts at High — the game's original baseline,
// and a desktop GPU is not the constraint here.
//
// Phones default DOWN rather than up. The previous rule was the other way
// round — High unless the device advertised a low-power signal — which meant
// the majority of Android phones, whose `hardwareConcurrency` looks generous
// because it counts little cores, started on full dpr, full bloom and film
// grain. Measured at a 4x CPU throttle that is the difference between about
// 10fps and about 19fps. The device probes available in a WebView cannot tell
// a fast phone from a slow one with any confidence, so the honest default is
// the one that is smooth everywhere and a deliberate opt-in for the rest: a
// phone starts at Medium, and only a strong, corroborated signal (plenty of
// cores AND plenty of memory AND a large screen) starts at High.
//
// Low and Ultra are never auto-selected; Low is still reachable by the runtime
// step-down in tryAutoLower().
function detectDefaultTier() {
  const touch = (typeof window !== 'undefined') &&
    (('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0);
  if (!touch) return 'high';
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory;   // Chrome/Android only; undefined elsewhere
  const shortEdge = Math.min(window.screen.width, window.screen.height);
  const strong = cores >= 8 && (mem === undefined || mem >= 6) && shortEdge >= 500;
  return strong ? 'high' : 'medium';
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && PRESETS[d.tier]) return d;
    }
  } catch (e) { /* private browsing / unavailable */ }
  return { tier: detectDefaultTier(), pinned: false, autoLowered: 0 };
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

  // Automatic step-down when sustained frame time is poor. Applies even to a
  // pinned choice (a strained preset isn't a good experience either).
  //
  // This used to be strictly one-shot, which meant a phone that started on
  // High and was still struggling on Medium had no way down to Low without the
  // player finding the graphics control. It is a budget of MAX_AUTO_LOWER
  // steps now instead — still strictly monotonic, so it can never oscillate,
  // and still bounded, so it can never walk the game down over time.
  tryAutoLower() {
    const used = this.autoLoweredCount;
    if (used >= MAX_AUTO_LOWER) return null;
    const i = ORDER.indexOf(this.data.tier);
    if (i <= 0) { this.data.autoLowered = MAX_AUTO_LOWER; this.save(); return null; }
    this.data.tier = ORDER[i - 1];
    this.data.autoLowered = used + 1;
    this.save();
    return this.data.tier;
  }

  // `autoLowered` was a boolean before it was a count; an existing save can
  // still hold `true`, which reads as one step already spent.
  get autoLoweredCount() {
    const v = this.data.autoLowered;
    if (v === true) return 1;
    return typeof v === 'number' ? v : 0;
  }

  // True once the step-down budget is spent — the frame loop uses this to stop
  // re-checking rather than encoding the same rule itself.
  get autoLowerExhausted() { return this.autoLoweredCount >= MAX_AUTO_LOWER; }
}

export const quality = new Quality();
export { ORDER as QUALITY_ORDER };
