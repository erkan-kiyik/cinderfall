// KOR LAB — gun handling: stats and the fire / reload state machine.
//
// Pure logic, no rendering: a Gun is stepped at the simulation rate with the
// trigger state and reports events (shots, magazine out/in, pump, ...) that
// the scene turns into bullets, effects, sounds and debris, and that the
// animator turns into hands and moving parts.
//
// Angles are radians in the shooter's local facing-right space (+ = down).
// Recoil climbs the muzzle (negative angle) following a per-gun pattern and
// recovers on its own; spread is a random cone on top of it.

export const GUNS = {
  wren9: {
    name: 'SERÇE-9', mode: 'semi', pistol: true, mob: 92, rpm: 420, dmg: 27, pellets: 1, mag: 15, reserve: 75,
    zone: { head: 2.2, body: 1, limb: 0.85 }, falloff: [380, 900, 0.6],
    reload: 1.35, reloadEmpty: 1.65, swap: 0.32,
    spread: 0.008, moveSpread: 0.022, airSpread: 0.05, crouchK: 0.7, bloom: 0.014, bloomMax: 0.05,
    climb: [0.042], jitter: 0.012, recover: 7, kick: [1.7, 0.2], shake: 0.1, sound: 'pistol', tracer: 0.55,
  },
  kestrel: {
    name: 'KERKENEZ AR', mode: 'auto', mob: 76, rpm: 690, dmg: 24, pellets: 1, mag: 30, reserve: 150,
    zone: { head: 2.4, body: 1, limb: 0.85 }, falloff: [520, 1200, 0.7],
    reload: 2.05, reloadEmpty: 2.5, swap: 0.4,
    spread: 0.005, moveSpread: 0.028, airSpread: 0.08, crouchK: 0.7, bloom: 0.006, bloomMax: 0.04,
    climb: [0.012, 0.016, 0.02, 0.022, 0.022, 0.02, 0.017, 0.014, 0.011, 0.009, 0.008], jitter: 0.009, recover: 5.5,
    kick: [1.4, 0.07], shake: 0.06, sound: 'rifle', tracer: 0.9,
  },
  ramrod: {
    name: 'HARBİ-12', mode: 'pump', mob: 70, rpm: 300, dmg: 12, pellets: 9, mag: 6, reserve: 36,
    zone: { head: 1.6, body: 1, limb: 0.85 }, falloff: [110, 380, 0.25],
    reloadStart: 0.3, reloadShell: 0.5, reloadEnd: 0.28, pumpTime: 0.46, swap: 0.42,
    spread: 0.075, moveSpread: 0.01, airSpread: 0.02, crouchK: 0.9, bloom: 0, bloomMax: 0,
    climb: [0.12], jitter: 0.02, recover: 4, kick: [3.4, 0.3], shake: 0.3, sound: 'shotgun', tracer: 0.5,
  },
  marksman: {
    name: 'ATMACA DMR', mode: 'semi', mob: 58, rpm: 210, dmg: 58, pellets: 1, mag: 10, reserve: 50,
    zone: { head: 2.5, body: 1, limb: 0.85 }, falloff: [900, 1600, 0.85],
    reload: 2.4, reloadEmpty: 2.85, swap: 0.46,
    spread: 0.0015, moveSpread: 0.045, airSpread: 0.11, crouchK: 0.5, bloom: 0.02, bloomMax: 0.05,
    climb: [0.075], jitter: 0.01, recover: 4.5, kick: [2.4, 0.22], shake: 0.16, sound: 'dmr', tracer: 1,
  },
  // the eight that came later (pitch: the shot sound's playback rate)
  mule: {
    name: 'KATIR .50', mode: 'semi', pistol: true, mob: 88, rpm: 240, dmg: 52, pellets: 1, mag: 7, reserve: 42,
    zone: { head: 2.6, body: 1, limb: 0.85 }, falloff: [420, 1000, 0.6],
    reload: 1.6, reloadEmpty: 1.9, swap: 0.36,
    spread: 0.009, moveSpread: 0.026, airSpread: 0.06, crouchK: 0.7, bloom: 0.03, bloomMax: 0.07,
    climb: [0.09], jitter: 0.016, recover: 5, kick: [2.6, 0.3], shake: 0.16, sound: 'pistol', pitch: 0.7, tracer: 0.75,
  },
  hornet: {
    name: 'ARI', mode: 'auto', mob: 86, rpm: 950, dmg: 15, pellets: 1, mag: 32, reserve: 192,
    zone: { head: 2.0, body: 1, limb: 0.85 }, falloff: [260, 700, 0.5],
    reload: 1.7, reloadEmpty: 2.1, swap: 0.3,
    spread: 0.012, moveSpread: 0.016, airSpread: 0.04, crouchK: 0.75, bloom: 0.004, bloomMax: 0.05,
    climb: [0.008, 0.01, 0.012, 0.012, 0.011, 0.01], jitter: 0.014, recover: 6, kick: [1.0, 0.05], shake: 0.04, sound: 'pistol', pitch: 1.15, tracer: 0.6,
  },
  lynx: {
    name: 'VAŞAK', mode: 'auto', mob: 84, suppressed: true, rpm: 780, dmg: 18, pellets: 1, mag: 30, reserve: 180,
    zone: { head: 2.2, body: 1, limb: 0.85 }, falloff: [320, 820, 0.55],
    reload: 1.8, reloadEmpty: 2.2, swap: 0.32,
    spread: 0.008, moveSpread: 0.018, airSpread: 0.045, crouchK: 0.72, bloom: 0.004, bloomMax: 0.04,
    climb: [0.007, 0.009, 0.011, 0.011, 0.01], jitter: 0.011, recover: 6, kick: [0.9, 0.04], shake: 0.03, sound: 'dmr', pitch: 1.35, vol: 0.45, tracer: 0.5,
  },
  bastion: {
    name: 'BURÇ BR', mode: 'burst', burst: 3, burstDelay: 0.34, mob: 72, rpm: 800, dmg: 34, pellets: 1, mag: 24, reserve: 120,
    zone: { head: 2.4, body: 1, limb: 0.85 }, falloff: [600, 1300, 0.75],
    reload: 2.2, reloadEmpty: 2.7, swap: 0.42,
    spread: 0.004, moveSpread: 0.03, airSpread: 0.08, crouchK: 0.6, bloom: 0.008, bloomMax: 0.04,
    climb: [0.018, 0.022, 0.026], jitter: 0.008, recover: 6, kick: [1.8, 0.12], shake: 0.08, sound: 'rifle', pitch: 0.9, tracer: 0.95,
  },
  saw: {
    name: 'TESTERE-20', mode: 'auto', mob: 68, rpm: 260, dmg: 10, pellets: 8, mag: 10, reserve: 50,
    zone: { head: 1.5, body: 1, limb: 0.85 }, falloff: [100, 340, 0.25],
    reload: 2.4, reloadEmpty: 2.9, swap: 0.44,
    spread: 0.085, moveSpread: 0.012, airSpread: 0.02, crouchK: 0.9, bloom: 0.01, bloomMax: 0.03,
    climb: [0.08, 0.1, 0.11], jitter: 0.02, recover: 4.5, kick: [2.8, 0.25], shake: 0.24, sound: 'shotgun', pitch: 1.08, tracer: 0.5,
  },
  longbow: {
    name: 'KARTAL', mode: 'bolt', mob: 54, rpm: 60, pumpTime: 0.85, dmg: 110, pellets: 1, mag: 5, reserve: 30,
    zone: { head: 3, body: 1, limb: 0.85 }, falloff: [1200, 2000, 0.9],
    reload: 2.8, reloadEmpty: 3.2, swap: 0.5,
    spread: 0.001, moveSpread: 0.06, airSpread: 0.14, crouchK: 0.4, bloom: 0, bloomMax: 0,
    climb: [0.11], jitter: 0.006, recover: 3.5, kick: [3.0, 0.3], shake: 0.22, sound: 'dmr', pitch: 0.72, tracer: 1.2,
  },
  anvil: {
    name: 'ÖRS LMG', mode: 'auto', mob: 48, moveK: 0.82, rpm: 620, dmg: 26, pellets: 1, mag: 80, reserve: 240,
    zone: { head: 2.2, body: 1, limb: 0.85 }, falloff: [560, 1300, 0.7],
    reload: 4.2, reloadEmpty: 4.8, swap: 0.6,
    spread: 0.01, moveSpread: 0.045, airSpread: 0.1, crouchK: 0.55, bloom: 0.004, bloomMax: 0.05,
    climb: [0.01, 0.012, 0.014, 0.016, 0.016, 0.015, 0.014, 0.013], jitter: 0.012, recover: 5, kick: [1.6, 0.08], shake: 0.08, sound: 'rifle', pitch: 0.8, tracer: 1,
  },
  // grenades instead of bullets: the scene flies them (launcher: blast radius and damage)
  thumper: {
    name: 'TOKMAK GL', mode: 'pump', mob: 66, rpm: 75, pumpTime: 0.22, dmg: 0, pellets: 1, mag: 4, reserve: 16,
    launcher: { r: 62, dmg: 125, speed: 430 },
    zone: { head: 1, body: 1, limb: 1 }, falloff: [9999, 9999, 1],
    reloadStart: 0.35, reloadShell: 0.62, reloadEnd: 0.3, swap: 0.5,
    spread: 0.006, moveSpread: 0.02, airSpread: 0.04, crouchK: 0.8, bloom: 0, bloomMax: 0,
    climb: [0.14], jitter: 0.01, recover: 4, kick: [3.2, 0.3], shake: 0.2, sound: 'thunk', tracer: 0,
  },
};

// Reload choreography, normalised time (0..1) of the reload. Mag-fed:
//   reach → pull (mag comes out) → drop → pouch → fetch (new mag in hand)
//   → insert (ammo refilled at its end) → [charge] → return
export const MAG_TL = {
  rifle: {
    tac: { reach: 0.16, pull: 0.3, pouch: 0.5, fetch: 0.72, insert: 0.84, charge: 0.84, ret: 1 },
    empty: { reach: 0.13, pull: 0.24, pouch: 0.41, fetch: 0.6, insert: 0.7, charge: 0.88, ret: 1 },
  },
  // pistols drop the mag free while the hand is already on its way
  pistol: {
    tac: { reach: 0, pull: 0.12, pouch: 0.36, fetch: 0.62, insert: 0.74, charge: 0.74, ret: 1 },
    empty: { reach: 0, pull: 0.1, pouch: 0.3, fetch: 0.52, insert: 0.64, charge: 0.84, ret: 1 },
  },
};

const rnd = (r) => (r() * 2 - 1);

export class Gun {
  constructor(id, { infinite = false, rng = Math.random, autoReload = true } = {}) {
    this.id = id; this.s = GUNS[id]; this.rng = rng; this.auto = autoReload;
    this.ammo = this.s.mag; this.reserve = infinite ? Infinity : this.s.reserve;
    this.state = 'idle'; // idle | reload | pump | swap
    this.t = 0; this.dur = 0;
    this.cd = 0;               // time until the next shot may fire
    this.recoil = 0;           // current climb (rad, ≥ 0 = muzzle up)
    this.bloom = 0;
    this.spray = 0;            // shots in the current string
    this.sinceShot = 9;
    this.buffered = 0;         // a semi-auto press waiting for the cooldown
    this.dryT = 0;
    this.empty = false;        // the reload in progress started from empty
    this.shells = 0;           // pump reload: shells loaded so far in this reload
    this.wantStop = false;     // pump reload interrupted by the trigger
    this.loadEnd = null;       // pump reload: time the last shell went in
    this.reloadBuf = 0;        // a pending reload request (seconds left)
    this.slide = 0; this.pump = 0; // 0..1 moving part travel (animation)
    this.locked = false;       // slide / bolt locked back on empty
    this.ev = [];
    this.magTL = MAG_TL[this.s.pistol ? 'pistol' : 'rifle'];
    this.burstLeft = 0;          // rounds still to come in a burst
  }

  get ready() { return this.state === 'idle'; }
  get reloading() { return this.state === 'reload'; }
  // reload progress 0..1 (for the HUD)
  get progress() { return this.state === 'reload' ? Math.min(1, this.t / this.dur) : 0; }

  startReload() {
    if (this.state !== 'idle' || this.ammo >= this.s.mag || this.reserve <= 0) return false;
    this.state = 'reload'; this.t = 0; this.empty = this.ammo === 0; this.wantStop = false; this.shells = 0; this.loadEnd = null;
    const s = this.s;
    if (s.mode === 'pump') {
      const n = Math.min(s.mag - this.ammo, this.reserve);
      this.dur = s.reloadStart + n * s.reloadShell + s.reloadEnd + (this.empty ? s.pumpTime : 0);
    } else this.dur = this.empty ? s.reloadEmpty : s.reload;
    this.ev.push({ type: 'reload', empty: this.empty });
    return true;
  }

  // Stops a reload (weapon swap). Mag-fed: if the mag is already out it stays out.
  cancel() {
    if (this.state === 'reload' && this.s.mode !== 'pump') {
      const tl = this.empty ? this.magTL.empty : this.magTL.tac, u = this.t / this.dur;
      if (u > tl.pull && u < tl.insert) this.ammo = 0;
    }
    this.state = 'idle'; this.t = 0;
  }

  // in: { trigger, pressed (edge), reload (edge), moving 0..1, air 0..1, crouch 0..1 }
  update(dt, inp) {
    const s = this.s;
    this.ev.length = 0;
    this.cd = Math.max(0, this.cd - dt);
    this.sinceShot += dt;
    this.dryT = Math.max(0, this.dryT - dt);
    if (inp.pressed) this.buffered = 0.16; else this.buffered = Math.max(0, this.buffered - dt);
    // a reload asked for mid-pump or mid-swap happens as soon as it can
    if (inp.reload) this.reloadBuf = 0.6; else this.reloadBuf = Math.max(0, this.reloadBuf - dt);
    // recoil and bloom recover once the string stops
    if (this.sinceShot > 60 / s.rpm + 0.03) {
      this.recoil *= Math.exp(-s.recover * dt);
      if (this.recoil < 0.004) this.spray = 0;
    }
    this.bloom *= Math.exp(-6 * dt);
    // moving parts spring home
    if (!this.locked) this.slide = Math.max(0, this.slide - dt * 22);

    if (this.state === 'reload') this.stepReload(dt, inp);
    else if (this.state === 'pump') {
      this.t += dt;
      const u = this.t / s.pumpTime;
      // pump: rest → back (shell out at the rear) → forward
      const back = u < 0.18 ? 0 : u < 0.5 ? (u - 0.18) / 0.32 : u < 0.86 ? 1 - (u - 0.5) / 0.36 : 0;
      const u0 = (this.t - dt) / s.pumpTime, cross = (k) => u0 < k && u >= k;
      if (cross(0.18)) this.ev.push({ type: 'pumpBack' });
      if (cross(0.5)) this.ev.push({ type: 'eject' });
      if (cross(0.56)) this.ev.push({ type: 'pumpFwd' });
      this.pump = Math.min(1, back);
      if (this.t >= s.pumpTime) { this.state = 'idle'; this.pump = 0; }
    } else if (this.state === 'swap') {
      this.t += dt;
      if (this.t >= this.dur) this.state = 'idle';
    }

    if (this.state !== 'idle') return this.ev;
    if (this.reloadBuf > 0 || (this.auto && this.ammo === 0 && this.reserve > 0 && this.sinceShot > 0.25)) {
      this.reloadBuf = 0;
      if (this.startReload()) return this.ev;
    }
    // trigger
    const want = s.mode === 'auto' ? inp.trigger : s.mode === 'burst' ? this.burstLeft > 0 || this.buffered > 0 : this.buffered > 0;
    if (!want || this.cd > 0) return this.ev;
    if (this.ammo <= 0) {
      this.burstLeft = 0;
      if (this.dryT <= 0) { this.ev.push({ type: 'dry' }); this.dryT = 0.25; this.buffered = 0; }
      if (this.reserve > 0) this.startReload();
      return this.ev;
    }
    this.fire(inp);
    return this.ev;
  }

  fire(inp) {
    const s = this.s;
    this.ammo--; this.buffered = 0;
    this.cd = 60 / s.rpm;
    // a burst: the trigger starts it, the rest follow at the cyclic rate, then a pause
    if (s.mode === 'burst') {
      if (this.burstLeft <= 0) this.burstLeft = s.burst;
      this.burstLeft--;
      if (this.burstLeft <= 0 || this.ammo === 0) { this.burstLeft = 0; this.cd = s.burstDelay; }
    }
    // spread cone half-angle from movement, air, crouch and bloom
    let cone = s.spread + s.moveSpread * (inp.moving || 0) + s.airSpread * (inp.air || 0) + this.bloom;
    cone *= 1 - (1 - s.crouchK) * (inp.crouch || 0);
    const climb = s.climb[Math.min(this.spray, s.climb.length - 1)];
    const kickAng = climb + rnd(this.rng) * s.jitter * 0.3;
    const dirs = [];
    for (let i = 0; i < s.pellets; i++) {
      // pellets: even spread over the cone; single shots: normal-ish
      const r = s.pellets > 1 ? (i / (s.pellets - 1) * 2 - 1) * cone + rnd(this.rng) * cone * 0.25 : (this.rng() + this.rng() - 1) * cone;
      dirs.push(-this.recoil + r + rnd(this.rng) * s.jitter * (this.spray ? 1 : 0.2));
    }
    this.recoil += kickAng;
    this.bloom = Math.min(s.bloomMax, this.bloom + s.bloom);
    this.spray++; this.sinceShot = 0;
    this.slide = 1;
    if (this.ammo === 0 && s.pistol) this.locked = true;
    this.ev.push({ type: 'fire', dirs, last: this.ammo === 0 });
    // pump and bolt guns cycle by hand after each shot (the case comes out then)
    if (s.mode === 'pump' || s.mode === 'bolt') { this.state = 'pump'; this.t = 0; }
    else this.ev.push({ type: 'eject' });
  }

  stepReload(dt, inp) {
    const s = this.s, t0 = this.t;
    this.t += dt;
    if (s.mode === 'pump') {
      // start, then one shell per cycle (the shell goes in at 82% of the
      // cycle); the trigger stops the reload after the shell in hand
      if (inp.pressed && this.ammo > 0) this.wantStop = true;
      if (this.loadEnd === null) {
        const tin = s.reloadStart + (this.shells + 0.82) * s.reloadShell;
        if (this.t >= tin) {
          this.ammo++; this.reserve--; this.shells++;
          this.ev.push({ type: 'shellIn' });
          if (this.wantStop || this.ammo >= s.mag || this.reserve <= 0) {
            this.loadEnd = s.reloadStart + this.shells * s.reloadShell;
            this.dur = this.loadEnd + s.reloadEnd + (this.empty ? s.pumpTime : 0);
          }
        }
      } else if (this.empty) {
        // chamber a shell with the pump
        const ps = this.loadEnd + s.reloadEnd * 0.5, u = (this.t - ps) / s.pumpTime, u0 = (t0 - ps) / s.pumpTime;
        if (u0 < 0.1 && u >= 0.1) this.ev.push({ type: 'pumpBack' });
        if (u0 < 0.5 && u >= 0.5) this.ev.push({ type: 'pumpFwd' });
        this.pump = u < 0 ? 0 : u < 0.5 ? u / 0.5 : u < 1 ? 1 - (u - 0.5) / 0.5 : 0;
      }
    } else {
      const tl = this.empty ? this.magTL.empty : this.magTL.tac;
      const u0 = t0 / this.dur, u = this.t / this.dur;
      const cross = (k) => u0 < k && u >= k;
      if (cross(tl.pull)) this.ev.push({ type: 'magOut' });
      if (cross(tl.fetch - 0.04)) this.ev.push({ type: 'magGrab' });
      if (cross(tl.insert)) {
        const need = s.mag - this.ammo, take = Math.min(need, this.reserve);
        this.ammo += take; this.reserve -= take;
        this.ev.push({ type: 'magIn' });
      }
      if (this.empty && cross((tl.insert + tl.charge) / 2 + 0.02)) { this.locked = false; this.slide = 1; this.ev.push({ type: 'charge' }); }
    }
    if (this.t >= this.dur) { this.state = 'idle'; this.t = 0; this.pump = 0; this.ev.push({ type: 'reloaded' }); }
  }

  // swap: lower the old gun / raise this one (the scene switches the active gun at the midpoint)
  raise() { this.state = 'swap'; this.t = 0; this.dur = this.s.swap; }
}
