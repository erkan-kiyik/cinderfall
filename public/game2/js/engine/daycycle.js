// TimeShift — the sector's in-game clock.
//
// The clock is not wall-time and it is not tied to the frame loop. It moves
// when the *player's story* moves: every death (every ATTEMPT tick) pushes it
// one hour forward, and clearing a stage pushes it further. So a player who
// walls out on stage 3 watches dusk turn to night to dawn over their attempts,
// and the sky becomes a readable record of how long they have been fighting.
//
// It persists, so the hour survives a reload the same way the attempt counter
// does — coming back to a session should feel like returning to the same night,
// not resetting the world.

const KEY = 'cinderfall.clock.v1';

// The baked sky (art/background.js paintSky) is painted at dusk, so starting
// the clock there means a fresh save opens on the art at its intended value.
export const START_HOUR = 18.5;

// Hours added per event.
export const HOURS_PER_ATTEMPT = 1;
export const HOURS_PER_STAGE = 1.5;

// ---- grade keyframes ----
// Each entry is an overlay applied over the whole parallax stack at draw time:
//   tint    rgb of the wash laid over the backdrop
//   a       how strongly that wash covers
//   ambient multiplier on world light intensity (1 = full night lighting,
//           lower = daylight washes the practicals out)
//   key     i18n key for the HUD label
// Keys are in clock hours and interpolate circularly.
const KEYFRAMES = [
  { h: 0,    tint: [18, 26, 52],   a: 0.52, ambient: 1.00, key: 'time.night' },
  { h: 4,    tint: [24, 32, 60],   a: 0.48, ambient: 1.00, key: 'time.night' },
  { h: 5.5,  tint: [70, 58, 92],   a: 0.38, ambient: 0.86, key: 'time.dawn' },
  { h: 6.5,  tint: [214, 126, 96], a: 0.30, ambient: 0.62, key: 'time.dawn' },
  { h: 8,    tint: [206, 186, 168], a: 0.16, ambient: 0.34, key: 'time.morning' },
  { h: 11,   tint: [200, 208, 220], a: 0.10, ambient: 0.16, key: 'time.day' },
  { h: 14,   tint: [206, 210, 216], a: 0.09, ambient: 0.14, key: 'time.day' },
  { h: 16.5, tint: [226, 178, 122], a: 0.18, ambient: 0.30, key: 'time.afternoon' },
  { h: 18,   tint: [226, 138, 84],  a: 0.26, ambient: 0.52, key: 'time.dusk' },
  { h: 19.5, tint: [138, 84, 104],  a: 0.34, ambient: 0.78, key: 'time.dusk' },
  { h: 21,   tint: [40, 42, 82],    a: 0.46, ambient: 0.95, key: 'time.night' },
  { h: 24,   tint: [18, 26, 52],    a: 0.52, ambient: 1.00, key: 'time.night' },
];

function lerp(a, b, t) { return a + (b - a) * t; }

// Interpolates the grade table at an arbitrary hour.
export function gradeAt(hour) {
  const h = ((hour % 24) + 24) % 24;
  let lo = KEYFRAMES[0], hi = KEYFRAMES[KEYFRAMES.length - 1];
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (h >= KEYFRAMES[i].h && h <= KEYFRAMES[i + 1].h) {
      lo = KEYFRAMES[i]; hi = KEYFRAMES[i + 1];
      break;
    }
  }
  const span = hi.h - lo.h;
  const t = span <= 0 ? 0 : (h - lo.h) / span;
  return {
    hour: h,
    tint: [
      Math.round(lerp(lo.tint[0], hi.tint[0], t)),
      Math.round(lerp(lo.tint[1], hi.tint[1], t)),
      Math.round(lerp(lo.tint[2], hi.tint[2], t)),
    ],
    a: lerp(lo.a, hi.a, t),
    ambient: lerp(lo.ambient, hi.ambient, t),
    // The label snaps to whichever keyframe is nearer, so the HUD doesn't
    // flicker between two phase names halfway through a transition.
    key: t < 0.5 ? lo.key : hi.key,
    isNight: lerp(lo.ambient, hi.ambient, t) > 0.7,
  };
}

// Formats the clock as HH:MM for the HUD.
export function formatHour(hour) {
  const h = ((hour % 24) + 24) % 24;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export class DayCycle {
  constructor() {
    this.hour = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw !== null) {
        const v = parseFloat(raw);
        if (Number.isFinite(v)) return ((v % 24) + 24) % 24;
      }
    } catch (e) { /* storage unavailable — this session only */ }
    return START_HOUR;
  }

  save() {
    try { localStorage.setItem(KEY, String(this.hour)); } catch (e) { /* ignore */ }
  }

  // Advance and persist. Returns the new hour.
  advance(hours) {
    this.hour = ((this.hour + hours) % 24 + 24) % 24;
    this.save();
    return this.hour;
  }

  // One death = one hour gone.
  onAttempt() { return this.advance(HOURS_PER_ATTEMPT); }

  // Clearing ground also costs time, so a long successful run walks the sky
  // forward too rather than freezing it until the next death.
  onStageCleared() { return this.advance(HOURS_PER_STAGE); }

  grade() { return gradeAt(this.hour); }

  label() { return formatHour(this.hour); }

  reset() { this.hour = START_HOUR; this.save(); }
}

// ---- weather ----
// Weather is a function of how deep the campaign has gone and how hard the
// player is struggling, so the sector visibly deteriorates as a run drags on.
// Seeded, so a given (stage, attempts) always looks the same — no flicker
// between frames or between reloads.
export const WEATHER = ['clear', 'overcast', 'fog', 'rain', 'storm'];

export function pickWeather(stage, attempts = 0, hour = START_HOUR) {
  if (stage <= 1 && attempts === 0) return 'clear';       // the opening shot is always clean
  // deterministic hash of the run state
  let s = (stage * 92821 + attempts * 6151 + Math.floor(hour) * 131) >>> 0;
  s = (s ^ (s >>> 15)) * 2246822519 >>> 0;
  s = (s ^ (s >>> 13)) * 3266489917 >>> 0;
  const r = ((s ^ (s >>> 16)) >>> 0) / 4294967296;
  // Deeper stages and higher attempt counts push toward the harsher end.
  const severity = Math.min(0.8, stage * 0.045 + attempts * 0.03);
  if (r < 0.5 - severity * 0.45) return 'clear';
  if (r < 0.72 - severity * 0.2) return 'overcast';
  if (r < 0.86 - severity * 0.1) return 'fog';
  if (r < 0.96) return 'rain';
  return 'storm';
}
