// Player settings that had no home.
//
// Graphics and brightness already own their own modules and their own storage
// (engine/quality.js, engine/brightness.js) because each drives real machinery
// beyond a stored number. These two do not, and until now that meant they
// simply did not exist:
//
//   volume — the audio master gain was `0.7`, written once at init and never
//     read from anywhere else. There was no way to turn the game down and no
//     way to mute it. On a phone, in public, with no headphones, the only
//     available control was the OS volume rocker or closing the app.
//
//   shake — camera trauma is one of the loudest things in the frame (a heavy
//     weapon throws 26px of translation and 1.3 degrees of roll) and some
//     people cannot play with it on at all. It is a standard accessibility
//     control in any shooter and the game had no equivalent.
//
// Both are per-device rather than per-save, for the same reason brightness is:
// the right volume is a property of where you are sitting, not of your
// progress.

const KEY = 'cinderfall.settings.v1';

export const SHAKE_LEVELS = [
  { id: 'off',    label: 'set.shake.off',    mul: 0 },
  { id: 'low',    label: 'set.shake.low',    mul: 0.45 },
  { id: 'normal', label: 'set.shake.normal', mul: 1 },
  { id: 'high',   label: 'set.shake.high',   mul: 1.4 },
];
const SHAKE_DEFAULT = 2;        // 'normal' — the authored amount

// The gain the game was hardcoded to before any of this existed. Kept as the
// default so an existing player's first launch after this change sounds
// exactly like their last one before it.
const VOLUME_DEFAULT = 0.7;

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

class Settings {
  constructor() {
    const d = this.load();
    this.volume = d.volume;
    this.shakeIndex = d.shakeIndex;
    // Set by audio.js once the context exists, so a volume change made before
    // the first sound has played is not lost.
    this._onVolume = null;
  }

  load() {
    const def = { volume: VOLUME_DEFAULT, shakeIndex: SHAKE_DEFAULT };
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return def;
      const d = JSON.parse(raw);
      return {
        volume: typeof d.volume === 'number' && d.volume >= 0 && d.volume <= 1
          ? d.volume : VOLUME_DEFAULT,
        shakeIndex: Number.isInteger(d.shakeIndex)
          && d.shakeIndex >= 0 && d.shakeIndex < SHAKE_LEVELS.length
          ? d.shakeIndex : SHAKE_DEFAULT,
      };
    } catch (e) {
      // Private mode, disabled storage, or a corrupt value. Run at the
      // defaults rather than failing to boot over a preference.
      return def;
    }
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        volume: this.volume, shakeIndex: this.shakeIndex,
      }));
    } catch (e) { /* not fatal */ }
  }

  setVolume(v) {
    this.volume = clamp01(v);
    this.save();
    if (this._onVolume) this._onVolume(this.volume);
  }

  // Registered by the audio engine. Called immediately with the stored value
  // so the gain node starts at the player's setting rather than the default.
  onVolume(fn) {
    this._onVolume = fn;
    fn(this.volume);
  }

  get muted() { return this.volume <= 0; }

  setShake(i) {
    if (!Number.isInteger(i) || i < 0 || i >= SHAKE_LEVELS.length) return;
    this.shakeIndex = i;
    this.save();
  }

  get shake() { return SHAKE_LEVELS[this.shakeIndex] || SHAKE_LEVELS[SHAKE_DEFAULT]; }
  // Multiplier the camera applies to every trauma impulse. 0 disables shake
  // entirely without any call site needing to know that.
  get shakeMul() { return this.shake.mul; }
}

export const settings = new Settings();
