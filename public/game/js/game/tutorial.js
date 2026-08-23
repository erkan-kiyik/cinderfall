// First-run coaching.
//
// Cinderfall teaches nothing. A new player is handed an endless procedural
// campaign and left to discover on their own that they can vault chest-high
// cover at a run, that walking up behind an unaware hostile offers a silent
// takedown, and that the THREAT bar is a stealth state they can retreat out
// of rather than a damage meter. Those three are the systems the level design
// is actually built around, and all three are invisible until someone happens
// to trigger one by accident.
//
// ---------------------------------------------------------------------------
// Why this is not a tutorial level
// ---------------------------------------------------------------------------
// A scripted opening would fight everything else about the game: stages are
// generated, runs are short, and the retention design assumes a player can be
// in a firefight within seconds of tapping DEPLOY. So instead each lesson is a
// single line that fires the first time its situation genuinely arises, and
// never again — the player is taught vaulting while standing in front of
// something vaultable, which is the only moment the lesson means anything.
//
// The voice is MOTH's, for the same reason: the game already has a character
// whose whole job is talking to the operator (see engine/interlude.js and
// game/barks.js). Coaching delivered by that character reads as part of the
// fiction rather than as a tooltip layer bolted over it.
//
// Seen-state lives on Progression, so lessons persist across runs and deaths.
// A player who dies on stage 1 does not get taught the same thing again on
// their second attempt.

import { t } from '../engine/i18n.js';

// Each tip fires once, ever. `hold` is how long it stays up — longer than a
// bark, because these are instructions rather than flavour and a player who is
// mid-firefight needs time to actually read one.
const HOLD = 5.2;
// Minimum gap between two tips, so a player who walks into three teachable
// situations at once is coached through them one at a time rather than having
// the first replaced before it is read.
const GAP = 2.6;

// Ordered by how early a player will plausibly meet them. `id` is both the
// dictionary key suffix and the persisted seen-flag.
export const TIPS = ['threat', 'takedown', 'vault', 'reload', 'swap'];

export class Tutorial {
  // deps: { progression, barks, getTouch }
  // `getTouch` is a getter rather than the object itself — the touch layer is
  // constructed after Game is, so a captured reference would be undefined.
  constructor(deps) {
    this.p = deps.progression;
    this.barks = deps.barks;
    this.getTouch = deps.getTouch || (() => null);
    this.gap = 0;
    this._armed = {};
  }

  // Control name for the current input scheme, so a phone player is not told
  // to press a key they do not have. Read live rather than cached: the touch
  // layer decides its own visibility at runtime.
  control(id) {
    const layer = this.getTouch();
    const touch = !!(layer && layer.enabled);
    return t(`tip.key.${id}.${touch ? 'touch' : 'key'}`);
  }

  seen(id) { return this.p.tipSeen(id); }

  // Fires a tip if it has not been seen and nothing else is mid-lesson.
  // Returns true if it actually showed.
  fire(id) {
    if (this.gap > 0 || this.seen(id)) return false;
    const line = t(`tip.${id}`, { key: this.control(id) });
    if (!line || line === `tip.${id}`) return false;   // missing key: stay silent
    // Routed through Barks so there is one thing on screen at a time and one
    // presentation to maintain. `tip` outranks every bark priority, so a
    // lesson is never eaten by a quip about a barrel.
    if (!this.barks.show(line, { hold: HOLD, prio: 9 })) return false;
    this.p.markTipSeen(id);
    this.gap = GAP;
    return true;
  }

  // Called every frame with the live run state; decides which lesson (if any)
  // has become relevant. `ctx`:
  //   { playing, detState, stealthTarget, vaultCandidate, magEmpty, swapUnlocked }
  update(dt, ctx = null) {
    if (this.gap > 0) this.gap -= dt;
    if (!ctx || !ctx.playing) return;

    // THREAT — the moment the bar first leaves HIDDEN is the moment the
    // player can still act on it, so teach it there rather than once they are
    // already in a firefight.
    if (ctx.detState && ctx.detState !== 'hidden' && !this.seen('threat')) {
      this.fire('threat');
      return;
    }
    // Takedown — taught while a target is actually available.
    if (ctx.stealthTarget && !this.seen('takedown')) {
      this.fire('takedown');
      return;
    }
    // Vault — taught while standing in front of something vaultable.
    if (ctx.vaultCandidate && !this.seen('vault')) {
      this.fire('vault');
      return;
    }
    // Reload — the first time the magazine runs dry.
    if (ctx.magEmpty && !this.seen('reload')) {
      this.fire('reload');
      return;
    }
    // Weapon swap — only once a second weapon is genuinely available.
    if (ctx.swapUnlocked && !this.seen('swap')) {
      this.fire('swap');
    }
  }
}
