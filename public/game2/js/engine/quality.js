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
// `fpsCap` bounds how often the scene is drawn. A 120Hz phone otherwise
// renders every frame twice for no visible gain, and Low holds a steady 30
// rather than a ragged 40-50 — steadier, cooler and lighter on the battery.
// Medium no longer runs the rich grade: its overlay and soft-light passes are
// the two most expensive blend modes a mobile GPU services, for a tint the
// cheap path reproduces closely.
// `bgScale` is the resolution of the parallax backdrop (sky, clouds, the
// apartment block, haze, rain, the fog and time-of-day washes) relative to the
// scene. That stack is seven full-screen passes and measured as the single
// largest cost in the frame; it is distant, fogged and soft by design, so it
// is drawn into its own smaller canvas and stretched back in one blit.
//
// High no longer runs the rich grade or film grain: the overlay / soft-light
// passes and the tiled overlay grain measured as High's largest cost, and the
// baked single-pass grade is within a hair of the same tint. Ultra keeps both.
// `foreground` (the near-plane parallax strip) is its own flag now rather than
// riding on richGrade, so High keeps it.
//
// Every tier targets 60fps now (Low used to cap at 30). Holding it is the job
// of the dynamic resolution in main.js: when frames run long the scene
// resolution steps down in small increments, and climbs back when there is
// headroom, before the runtime ever drops a whole tier.
export const PRESETS = {
  low:    { name: 'LOW',    dprCap: 1,   assetScale: 2,   particleMax: 700,  bloom: false, bloomBlur: 0,  grain: false, ambientMul: 0.4,  accentPx: 0,   lightScale: 0.4,  richGrade: false, renderScale: 0.7,  bgScale: 0.5,  fpsCap: 60 },
  medium: { name: 'MEDIUM', dprCap: 1.5, assetScale: 2.5, particleMax: 1200, bloom: false, bloomBlur: 0,  grain: false, ambientMul: 0.6,  accentPx: 1.2, lightScale: 0.5,  richGrade: false, renderScale: 0.72, bgScale: 0.6,  fpsCap: 60 },
  high:   { name: 'HIGH',   dprCap: 2,   assetScale: 3,   particleMax: 2600, bloom: true,  bloomBlur: 13, grain: false, ambientMul: 1,    accentPx: 1.4, lightScale: 0.75, richGrade: false, foreground: true, renderScale: 1,    bgScale: 0.75, fpsCap: 60 },
  ultra:  { name: 'ULTRA',  dprCap: 3,   assetScale: 3.5, particleMax: 3600, bloom: true,  bloomBlur: 16, grain: true,  ambientMul: 1.25, accentPx: 1.4, lightScale: 1,    richGrade: true,  foreground: true, renderScale: 1,    bgScale: 1,    fpsCap: 60 },
};
const ORDER = ['low', 'medium', 'high', 'ultra'];
// How many times the runtime may step the preset down on its own. Two is
// enough to walk High -> Low, and bounded so a device having one bad minute
// cannot end up permanently on the lowest tier over many sessions.
const MAX_AUTO_LOWER = 3;

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
  // Every phone starts on Medium. The "strong device" probe (8 cores, 6GB,
  // big screen) matched most mid-range Android phones, whose GPUs cannot
  // carry High's full-resolution bloom and grain — they started on High,
  // stuttered, and waited for the runtime step-down to rescue them. High is
  // one tap away in Settings for the phones that can hold it.
  return 'medium';
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

  // Dynamic-resolution multiplier (see main.js). Remembered per device so a
  // phone that settled at 0.7 last session starts there instead of spending
  // its first seconds stuttering its way back down.
  get dyn() {
    const v = this.data.dyn;
    return typeof v === 'number' && v >= 0.5 && v <= 1 ? v : 1;
  }
  setDyn(v) {
    this.data.dyn = Math.round(v * 1000) / 1000;
    clearTimeout(this._dynSave);
    this._dynSave = setTimeout(() => this.save(), 1500);   // debounced: steps come in runs
  }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ }
  }

  // Explicit user choice (from the pause-menu graphics control) — pins the
  // tier so runtime auto-downgrade never overrides it.
  set(tier) {
    if (!PRESETS[tier]) return;
    this.data.tier = tier;
    this.data.pinned = true;
    this.data.dyn = 1;        // a new tier is judged afresh
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
    this.data.dyn = 0.85;
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
