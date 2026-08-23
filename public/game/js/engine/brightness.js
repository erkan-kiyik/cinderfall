// Screen brightness.
//
// Cinderfall is graded very dark on purpose — dusk industrial, practical lamps
// doing most of the lifting. That reads beautifully on a good panel in a dim
// room, and it falls apart everywhere else: a phone at half brightness, an
// outdoor bus stop, a cheap LCD. Measured on a landscape phone the gameplay
// area averaged 20% luminance with 89% of pixels below quarter brightness,
// and the game shipped with no way for the player to do anything about it.
//
// Two things make that worse than a flat "it's dark" problem:
//
//   * the day/night clock advances an hour per *death* (HOURS_PER_ATTEMPT in
//     engine/daycycle.js), so the screen gets darker the more a new player is
//     struggling — precisely backwards
//   * weather severity also scales with attempts, adding rain and fog on top
//
// So this is a legibility control, not a taste slider: at LEVELS[0] the art
// direction is untouched, and every step above it lifts the floor of the
// frame without washing out the highlights the lighting pass worked for.
// Persisted per device, because the right setting is a property of the screen
// the player is holding, not of the save.

const KEY = 'cinderfall.brightness.v1';

// Multiplier applied to the final lift. 1 = the original grade, exactly as
// authored. The top of the range is deliberately generous: a bright outdoor
// screen needs much more than a "slightly brighter" nudge to be playable.
export const LEVELS = [
  { id: 'dark',    label: 'brightness.dark',    lift: 0.00 },
  { id: 'normal',  label: 'brightness.normal',  lift: 0.05 },
  { id: 'bright',  label: 'brightness.bright',  lift: 0.11 },
  { id: 'outdoor', label: 'brightness.outdoor', lift: 0.18 },
];

// Default is one step up from the authored grade. The dark end stays
// available for anyone who wants the original look, but a first-time player
// on an unknown screen should not have to go hunting through a menu before
// the game is legible.
const DEFAULT_INDEX = 1;

class Brightness {
  constructor() {
    this.index = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw == null) return DEFAULT_INDEX;
      const n = parseInt(raw, 10);
      return Number.isFinite(n) && n >= 0 && n < LEVELS.length ? n : DEFAULT_INDEX;
    } catch (e) {
      // private mode / storage disabled — run at the default rather than
      // failing to boot over a preference.
      return DEFAULT_INDEX;
    }
  }

  save() {
    try { localStorage.setItem(KEY, String(this.index)); } catch (e) { /* not fatal */ }
  }

  get level() { return LEVELS[this.index] || LEVELS[DEFAULT_INDEX]; }
  get lift() { return this.level.lift; }
  get labelKey() { return this.level.label; }

  cycle() {
    this.index = (this.index + 1) % LEVELS.length;
    this.save();
    return this.level;
  }

  // Final lift, drawn as the very last step of the grade so it raises
  // everything — background wash, world layer, lighting multiply and vignette
  // alike. 'lighter' rather than a flat white fill: adding a small constant to
  // every channel lifts the crushed blacks that are the actual problem while
  // leaving already-bright pixels alone, whereas a source-over white veil
  // would fog the whole image and kill contrast.
  apply(g, w, h) {
    const lift = this.lift;
    if (lift <= 0) return;
    const prev = g.globalCompositeOperation;
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = `rgba(150,160,185,${lift.toFixed(3)})`;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = prev;
  }
}

export const brightness = new Brightness();
