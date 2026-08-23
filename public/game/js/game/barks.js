// MOTH's in-mission radio barks.
//
// The interlude (engine/interlude.js) gives MOTH the space between stages.
// This gives it a voice *during* one: short reactive lines that fire off
// gameplay events — a streak, a headshot, a near-miss, a barrel going up —
// so the drone reads as watching the fight rather than only appearing when
// the fight is over.
//
// ---------------------------------------------------------------------------
// Why this is so aggressively rate-limited
// ---------------------------------------------------------------------------
// A companion that comments on everything stops being a character and starts
// being noise — and the events here fire fast (a good streak is several kills
// a second). Four rules keep MOTH sparse enough to stay likeable:
//
//   1. a global cooldown, so two events landing on the same frame can only
//      ever produce one bark
//   2. a per-event cooldown much longer than the global one, so the same
//      line cannot chase itself even if the trigger repeats
//   3. priority — a low-health warning outranks a kill quip, and a higher
//      priority bark is allowed to interrupt a lower one that is still on
//      screen (nothing else may interrupt)
//   4. `chance` per event, so even an eligible trigger usually stays quiet
//
// Silence is the default state. That is deliberate.
//
// Prose lives in the TR/EN dictionaries per the convention game/intel.js
// documents; this module only decides *when* MOTH talks.

import { t } from '../engine/i18n.js';

// Seconds. Nothing may bark within GLOBAL_CD of the previous bark.
const GLOBAL_CD = 9;
// Seconds a bark stays on screen before it auto-hides.
const HOLD = 3.4;
// Barks at or above this priority carry information the player can act on —
// "you are about to die", "that is a boss" — so they ignore the global
// cooldown. Without this a flavour quip about a barrel could swallow the
// low-health warning that lands two seconds later, which is exactly backwards:
// the quip is the line that should lose. They still respect their own,
// much longer, per-event cooldown, so they cannot chatter either.
const URGENT_PRIO = 3;

// Event table. `lines` is how many variants exist in the dictionaries under
// `bark.<id>.<n>`; `cd` is this event's own cooldown; `chance` is the roll it
// has to pass once eligible; `prio` breaks ties and gates interruption.
const EVENTS = {
  // --- combat rhythm ---
  streak3:    { lines: 3, cd: 45,  chance: 0.7,  prio: 1 },
  streak6:    { lines: 3, cd: 60,  chance: 0.9,  prio: 2 },
  headshot:   { lines: 3, cd: 50,  chance: 0.35, prio: 1 },
  stealth:    { lines: 3, cd: 40,  chance: 0.55, prio: 1 },
  barrel:     { lines: 3, cd: 55,  chance: 0.5,  prio: 1 },
  // --- pressure ---
  lowHp:      { lines: 3, cd: 30,  chance: 1.0,  prio: 4 },
  survived:   { lines: 3, cd: 70,  chance: 0.8,  prio: 3 },
  // --- texture ---
  firstBlood: { lines: 2, cd: 999, chance: 1.0,  prio: 2 },
  quiet:      { lines: 3, cd: 75,  chance: 1.0,  prio: 0 },
  bossSpot:   { lines: 2, cd: 120, chance: 1.0,  prio: 4 },
};

// How long the player has to go without a kill before MOTH fills the silence.
const QUIET_AFTER = 42;
// Health fraction that counts as "low" for the warning bark.
const LOW_HP = 0.28;

export class Barks {
  // `el` is the bark strip in the HUD; `audio` is optional (a soft radio
  // click sells the line as coming over a channel rather than appearing).
  constructor(el, audio = null) {
    this.el = el || null;
    this.textEl = this.el ? this.el.querySelector('.bark-text') : null;
    this.audio = audio;
    this.reset();
  }

  // Called on every fresh deployment: a new run should not inherit the
  // previous one's cooldowns, and firstBlood has to be able to fire again.
  reset() {
    this.cd = 0;              // global cooldown remaining
    this.hold = 0;            // time left on the current line
    this.last = {};           // eventId -> seconds until it may fire again
    this.curPrio = -1;        // priority of the line currently showing
    this.sinceKill = 0;       // seconds since the last elimination
    this.lowFired = false;    // low-HP latch, re-armed when health recovers
    this.hide();
  }

  // dt-driven bookkeeping. `ctx` carries the live run state the ambient
  // triggers need: { hp, maxHp, playing }.
  update(dt, ctx = null) {
    if (this.cd > 0) this.cd -= dt;
    for (const k of Object.keys(this.last)) {
      if (this.last[k] > 0) this.last[k] -= dt;
    }
    if (this.hold > 0) {
      this.hold -= dt;
      if (this.hold <= 0) this.hide();
    }
    if (!ctx || !ctx.playing) return;

    this.sinceKill += dt;

    // low health — latched, so it warns on the way down rather than once per
    // frame, and re-arms only after the operator is genuinely back up
    const frac = ctx.maxHp > 0 ? ctx.hp / ctx.maxHp : 1;
    if (frac <= LOW_HP && !this.lowFired) {
      this.lowFired = true;
      this.fire('lowHp');
    } else if (frac > LOW_HP + 0.18) {
      // Hysteresis band rather than a bare `> LOW_HP`: sitting exactly on the
      // threshold while regen ticks would otherwise re-arm and re-fire the
      // warning every couple of seconds.
      if (this.lowFired) this.fire('survived');
      this.lowFired = false;
    }

    // a long lull with nothing to shoot
    if (this.sinceKill > QUIET_AFTER) {
      this.sinceKill = 0;
      this.fire('quiet');
    }
  }

  // Records an elimination for the lull timer. Separate from fire() because
  // every kill feeds this, but only some kills produce a line.
  noteKill() { this.sinceKill = 0; }

  // Attempts a bark. Returns true if MOTH actually said something — most
  // calls return false, which is the point.
  fire(id) {
    const ev = EVENTS[id];
    if (!ev || !this.el || !this.textEl) return false;
    // A higher-priority line may cut in over one still on screen; an urgent
    // one also ignores the global cooldown (see URGENT_PRIO).
    const interrupting = this.hold > 0;
    const urgent = ev.prio >= URGENT_PRIO;
    if (interrupting && ev.prio <= this.curPrio) return false;
    if (!interrupting && !urgent && this.cd > 0) return false;
    if ((this.last[id] || 0) > 0) return false;
    if (ev.chance < 1 && Math.random() > ev.chance) return false;

    const n = Math.floor(Math.random() * ev.lines);
    const line = t(`bark.${id}.${n}`);
    if (!line || line === `bark.${id}.${n}`) return false;   // missing key: stay silent

    return this.show(line, { hold: HOLD, prio: ev.prio, cooldown: GLOBAL_CD, eventId: id, eventCd: ev.cd });
  }

  // Puts a line on screen. Split out of fire() so callers that are not part of
  // the bark event table can share the presentation and, more importantly, the
  // one-at-a-time rule — game/tutorial.js pushes coaching through here so a
  // lesson and a quip can never overlap or replace each other mid-read.
  //
  // `prio` still gates interruption exactly as it does for barks, so a tip
  // (which outranks every event) cannot be knocked off by flavour.
  show(line, { hold = HOLD, prio = 0, cooldown = GLOBAL_CD, eventId = null, eventCd = 0 } = {}) {
    if (!line || !this.el || !this.textEl) return false;
    if (this.hold > 0 && prio <= this.curPrio) return false;
    this.textEl.textContent = line;
    this.el.classList.remove('show');
    void this.el.offsetWidth;      // restart the animation on a repeat
    this.el.classList.add('show');
    // The strip's CSS animation carries its own duration, so a line that is
    // meant to linger (a tip) has to drive it explicitly rather than inherit
    // the bark timing.
    this.el.style.animationDuration = `${hold}s`;
    this.hold = hold;
    this.cd = cooldown;
    this.curPrio = prio;
    if (eventId) this.last[eventId] = eventCd;
    if (this.audio && this.audio.ui) this.audio.ui();
    return true;
  }

  hide() {
    this.curPrio = -1;
    if (this.el) this.el.classList.remove('show');
  }
}
