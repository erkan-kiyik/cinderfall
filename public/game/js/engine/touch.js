// On-screen touch controls. Rather than a parallel input path, this drives the
// existing Input instance — synthesising key presses (KeyA/KeyD/Space/KeyR/
// Digit1-4, ShiftLeft), an analog move axis, and mouse state (aim position +
// fire) — so the whole gameplay layer reads input exactly as it does with a
// keyboard + mouse.
//
// ---------------------------------------------------------------------------
// What was wrong with the first version, and what each fix is for
// ---------------------------------------------------------------------------
// The original pads were fixed circles ~90px across sitting in the bottom
// corners, and playing on a phone meant hunting for them. Four things made the
// controls feel worse than they had to:
//
//   1. FIXED STICKS. A thumb that lands 20px off the pad does nothing at all,
//      and a thumb already on the pad drifts off it during a firefight. Both
//      sticks now FLOAT: the whole lower half of each side of the screen is a
//      capture zone, and the ring materialises wherever the thumb lands. You
//      never look at the controls to use them.
//
//   2. DIGITAL MOVEMENT. `nx > 0.34 → KeyD` gave three states: still, full
//      run left, full run right. There was no walking, and every input was a
//      step change the movement integrator had to absorb. Movement is analog
//      now, through Input.axisX, with a deadzone and a mild response curve so
//      small deflections creep and full tilt sprints.
//
//   3. AIM ANCHORED TO SCREEN CENTRE, at a fixed 320px radius. The operator is
//      rarely at screen centre (the camera leads them), so stick direction and
//      aim direction did not match, and the radius meant something different
//      on every screen size. Aim is now anchored to the operator's own screen
//      position and scaled to the viewport: push the stick at 2 o'clock, the
//      shot goes to 2 o'clock. It is also smoothed, so the reticle glides into
//      place instead of teleporting on the first frame of a touch.
//
//   4. NO SMOOTHING ANYWHERE. Every pointermove wrote straight to game state
//      and to DOM style. Pointer events arrive faster than frames on a 120Hz
//      digitiser, so that was both jittery and a layout-thrash source. Reads
//      are now accumulated and applied once per frame.

const isTouch = () =>
  (typeof window !== 'undefined') &&
  (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));

// Movement feel. DEADZONE kills thumb tremor; CURVE > 1 gives fine control
// near centre without costing top speed at full tilt; SPRINT_TILT is where a
// run becomes a sprint (deliberately short of 1.0, because a thumb rarely
// reaches the true edge of a floating pad).
const MOVE_DEADZONE = 0.15;
const MOVE_CURVE = 1.4;
const SPRINT_TILT = 0.84;
// Sprint LOCK. A bare tilt threshold is the wrong shape for a floating stick:
// holding a thumb at 84% of a ring it cannot feel means the sprint drops out
// every time the thumb drifts, which on a phone is constantly. So the tilt
// only has to be *reached* — hold it past SPRINT_LOCK_T and the sprint latches
// on, and it then survives all the way back down to SPRINT_KEEP. Coming off
// the sprint stays instant in the direction that matters: releasing the stick,
// or pulling back below SPRINT_KEEP, drops it on the same frame.
const SPRINT_LOCK_T = 0.18;   // seconds at full tilt before the lock takes
const SPRINT_KEEP = 0.46;     // deflection the lock survives down to
// Above this the stick counts as a jump flick (rising edge only).
const JUMP_FLICK = 0.62;
// …and its mirror: a downward flick on the move stick is a slide. Set higher
// than JUMP_FLICK because down is the direction a thumb drifts anyway as it
// tires on the glass, and a slide fired by accident costs the player their
// steering for half a second. It also requires real horizontal deflection —
// a slide from a standstill is not a move, and the Player refuses it anyway
// (see SLIDE_MIN_SPEED), so firing the input there would only be noise.
const SLIDE_FLICK = 0.70;
const SLIDE_FLICK_TILT = 0.45;

// Aim feel. FIRE_DEADZONE is where the aim stick starts shooting — holding
// near centre is how a player stops firing without lifting off. SETTLE is a
// grace period after a fresh touch during which the reticle moves but the
// weapon does not fire, so the first frame of a stab never sprays somewhere
// the player did not choose. SMOOTH is the exponential rate the reticle
// chases the stick at.
const FIRE_DEADZONE = 0.24;
const AIM_SETTLE = 0.09;   // seconds
const AIM_SMOOTH = 26;     // higher = snappier; ~2 frames to converge at 60fps

// How far out the reticle sits at full tilt, as a fraction of the SHORTER
// viewport axis. Only the *direction* decides where a shot goes, so this is
// purely about where the crosshair is drawn — and it has to be the shorter
// axis: on a 844x390 phone held in landscape, a reach scaled off the long
// edge puts the crosshair 400px above a chest that is 250px up the screen,
// i.e. off the top of the display entirely. The reticle is also clamped into
// the viewport below, so it stays visible at every aspect ratio.
const AIM_REACH = 0.4;
const AIM_MARGIN = 26;   // px kept clear of every screen edge

export class TouchControls {
  constructor(input, { force = false } = {}) {
    this.input = input;
    this.enabled = force || isTouch();
    this.el = document.getElementById('touch');
    this.visible = false;
    this.swapIndex = 0;

    // live stick state, written by pointer handlers and consumed in update()
    this.move = { x: 0, y: 0, active: false };
    this.aim = { x: 0, y: 0, active: false, heldT: 0 };
    // where the operator is on screen right now; the aim stick works outward
    // from here. Falls back to screen centre until the game reports one.
    this.anchor = { x: window.innerWidth / 2, y: window.innerHeight / 2, set: false };
    // smoothed reticle position, so the crosshair glides rather than snaps
    this.reticle = { x: window.innerWidth * 0.68, y: window.innerHeight * 0.46 };

    input.mouse.x = this.reticle.x;
    input.mouse.y = this.reticle.y;

    // Cached viewport. Reading window.innerWidth/innerHeight is not free — in
    // a frame that has already written to the DOM it can force a style and
    // layout flush, and this layer reads it every frame and on every pointer
    // event. It only changes on resize, so it is read there instead.
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this._onResize = () => { this.vw = window.innerWidth; this.vh = window.innerHeight; };
    window.addEventListener('resize', this._onResize);
    window.addEventListener('orientationchange', this._onResize);
  }

  mount() {
    if (!this.enabled || !this.el) return;
    // Sticks float inside a zone rather than living at a fixed spot. The zone
    // is the whole lower half of that side of the screen; the buttons sit
    // above it in z-order, so a tap that lands on JUMP is still a jump.
    this.bindZone('tc-zone-left', 'tc-move', this.move);
    this.bindZone('tc-zone-right', 'tc-aim', this.aim);
    this.bindButton('tc-jump', () => this.press('Space'));
    this.bindButton('tc-reload', () => this.press('KeyR'));
    this.bindButton('tc-swap', () => this.cycleWeapon());
    this.bindHold('tc-crouch', 'KeyC');
    this.bindButton('tc-takedown', () => this.press('KeyE'));
    this.bindButton('tc-pause', () => this.press('Escape'));
  }

  // The operator's screen position, reported by the game each frame. Aim works
  // outward from here so stick direction and shot direction are the same thing.
  setAimAnchor(sx, sy) {
    this.anchor.x = sx; this.anchor.y = sy; this.anchor.set = true;
  }

  // ---- per-frame: turn accumulated stick state into Input state ----
  // Called from the game loop with the frame's dt. Everything that touches
  // Input or the DOM happens here, once, rather than on every pointer event.
  update(dt) {
    if (!this.enabled || !this.visible) return;
    this.applyMove(dt);
    this.applyAim(dt);
  }

  applyMove(dt = 0) {
    const m = this.move;
    const raw = m.active ? clamp(m.x, -1, 1) : 0;
    const mag = Math.abs(raw);
    // deadzone, then rescale so the first live input is a crawl rather than a
    // jump straight to 15% speed
    let a = 0;
    if (mag > MOVE_DEADZONE) {
      const t = (mag - MOVE_DEADZONE) / (1 - MOVE_DEADZONE);
      a = Math.pow(t, MOVE_CURVE) * Math.sign(raw);
    }
    this.input.axisX = a;
    // The digital keys stay in sync for anything that reads them directly
    // (animation triggers, the vault check) — axisX is what actually sets speed.
    this.key('KeyD', a > 0.05);
    this.key('KeyA', a < -0.05);

    // Sprint lock (see SPRINT_LOCK_T / SPRINT_KEEP).
    if (!m.active) {
      this._sprintHeld = 0; this._sprintLock = false;
    } else if (mag > SPRINT_TILT) {
      this._sprintHeld = (this._sprintHeld || 0) + dt;
      if (this._sprintHeld >= SPRINT_LOCK_T) this._sprintLock = true;
    } else {
      this._sprintHeld = 0;
      if (mag < SPRINT_KEEP) this._sprintLock = false;
    }
    this.key('ShiftLeft', this._sprintLock || mag > SPRINT_TILT);

    const wantJump = m.active && m.y < -JUMP_FLICK;
    if (wantJump && !this._jumpLatch) { this.input.pressed.add('Space'); this._jumpLatch = true; }
    if (!wantJump) this._jumpLatch = false;

    // Slide flick. Synthesises the same momentary KeyC the crouch button holds,
    // so both routes into a slide go through one path in the Player and there
    // is no second slide trigger to keep in sync. Rising edge only, like the
    // jump — holding the stick down must not chain slides.
    const wantSlide = m.active && m.y > SLIDE_FLICK && mag > SLIDE_FLICK_TILT;
    if (wantSlide && !this._slideLatch) { this.press('KeyC'); this._slideLatch = true; }
    if (!wantSlide) this._slideLatch = false;
  }

  applyAim(dt) {
    const a = this.aim;
    const mouse = this.input.mouse;
    const vw = this.vw, vh = this.vh;
    const reach = Math.min(vw, vh) * AIM_REACH;
    const ax = this.anchor.set ? this.anchor.x : vw / 2;
    const ay = this.anchor.set ? this.anchor.y : vh / 2;

    const mag = Math.hypot(a.x, a.y);
    if (a.active && mag > 0.08) {
      a.heldT += dt;
      // Direction is what aims the shot; magnitude only decides how far out
      // the reticle sits, capped at full tilt.
      const k = Math.min(1, mag) / mag;
      const tx = ax + a.x * k * reach;
      const ty = ay + a.y * k * reach;
      this.reticle.x = damp(this.reticle.x, tx, AIM_SMOOTH, dt);
      this.reticle.y = damp(this.reticle.y, ty, AIM_SMOOTH, dt);
      // Fire once the stick is properly deflected AND the reticle has had a
      // beat to travel — a stab at the screen aims first, shoots second.
      const firing = mag > FIRE_DEADZONE && a.heldT > AIM_SETTLE;
      if (firing && !this._aimLatch) { mouse.clicked = true; this._aimLatch = true; }
      if (!firing) this._aimLatch = false;
      mouse.down = firing;
    } else {
      // Released or centred: hold the last aim (so the operator keeps facing
      // where they were pointed) and stop firing.
      if (!a.active) a.heldT = 0;
      mouse.down = false;
      this._aimLatch = false;
    }
    // Keep the crosshair on screen whatever the aspect ratio, and wherever the
    // camera has the operator. This pulls the reticle back ALONG the aim ray
    // rather than clamping x and y separately — a per-axis clamp would bend a
    // diagonal shot toward the nearest edge, which is the one thing the aim
    // must never do.
    const inset = shrinkToView(ax, ay, this.reticle.x - ax, this.reticle.y - ay, vw, vh);
    mouse.x = inset.x;
    mouse.y = inset.y;
  }

  // Slide readback. The move that most needs on-screen confirmation is the one
  // with no button press behind it — a stick flick leaves nothing lit — so the
  // crouch button doubles as the slide indicator.
  setSliding(on) {
    const el = document.getElementById('tc-crouch');
    if (el) el.classList.toggle('sliding', !!on);
  }

  setTakedownAvailable(on) {
    const el = document.getElementById('tc-takedown');
    if (el) el.classList.toggle('avail', !!on);
  }

  setVisible(on) {
    const next = on && this.enabled;
    if (next === this.visible) return;
    this.visible = next;
    if (this.el) this.el.classList.toggle('on', this.visible);
    // Reset in BOTH directions. Pausing mid-firefight hides the layer while a
    // thumb is still down, and the pause overlay swallows the pointerup — so
    // without a reset on the way back in, resuming would hand the player a
    // stick that is already pushed somewhere they are not touching.
    this.resetSticks();
  }

  resetSticks() {
    this.move.active = false; this.move.x = 0; this.move.y = 0;
    this.aim.active = false; this.aim.x = 0; this.aim.y = 0; this.aim.heldT = 0;
    this.input.axisX = 0;
    this.key('KeyA', false); this.key('KeyD', false); this.key('ShiftLeft', false);
    this.input.mouse.down = false;
    this._aimLatch = false; this._jumpLatch = false; this._slideLatch = false;
    this._sprintHeld = 0; this._sprintLock = false;
    this.releaseStick('tc-move'); this.releaseStick('tc-aim');
  }

  // ---- helpers driving the shared Input ----
  key(code, down) {
    if (down) this.input.keys.add(code); else this.input.keys.delete(code);
  }
  // Momentary tap. `pressed` is the edge set the game consumes once per frame;
  // `keys` is held briefly as well so anything reading the held state during
  // that frame agrees with it.
  press(code) {
    this.input.keys.add(code);
    this.input.pressed.add(code);
    setTimeout(() => this.input.keys.delete(code), 70);
  }

  cycleWeapon() {
    const codes = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];
    this.swapIndex = (this.swapIndex + 1) % codes.length;
    this.press(codes[this.swapIndex]);
  }

  bindButton(id, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
  }

  // Holds a key down for as long as the touch button is pressed (unlike
  // press(), which is a momentary tap) — used for crouch. Pointer capture
  // means a thumb that slides a few pixels off the button keeps holding it,
  // which `pointerleave` alone got wrong.
  bindHold(id, code) {
    const el = document.getElementById(id);
    if (!el) return;
    let pid = null;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      pid = e.pointerId;
      try { el.setPointerCapture(pid); } catch { /* capture is best-effort */ }
      this.key(code, true); el.classList.add('on');
    });
    const up = (e) => {
      if (pid !== null && e.pointerId !== pid) return;
      pid = null;
      this.key(code, false); el.classList.remove('on');
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  // ---- floating stick ----
  // `zoneId` is the invisible capture area; `stickId` is the ring that gets
  // moved to wherever the thumb lands inside it. `state` is the {x,y,active}
  // object update() reads — pointer handlers only ever write numbers into it,
  // never touch Input, so a 120Hz digitiser costs nothing per event.
  bindZone(zoneId, stickId, state) {
    const zone = document.getElementById(zoneId);
    const stick = document.getElementById(stickId);
    if (!zone || !stick) return;
    const nub = stick.querySelector('.tc-nub');
    let pid = null;
    let originX = 0, originY = 0;
    let raf = 0, pendingX = 0, pendingY = 0;

    // Radius the thumb travels for full deflection. Scaled to the screen so
    // it is the same physical distance on a small phone and a tablet.
    const radius = () => Math.max(42, Math.min(74, Math.min(this.vw, this.vh) * 0.13));

    // DOM writes are batched to one per frame: pointermove can fire several
    // times between frames and each write here would otherwise force layout.
    const flush = () => {
      raf = 0;
      const r = radius();
      const len = Math.hypot(pendingX, pendingY);
      const cl = len > r ? r / len : 1;
      nub.style.transform = `translate(${pendingX * cl}px, ${pendingY * cl}px)`;
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(flush); };

    const place = (x, y) => {
      const r = radius();
      stick.style.left = `${x - r}px`;
      stick.style.top = `${y - r}px`;
      stick.style.width = `${r * 2}px`;
      stick.style.height = `${r * 2}px`;
      stick.style.right = 'auto';
      stick.style.bottom = 'auto';
      stick.classList.add('active');
    };

    const read = (e) => {
      const r = radius();
      pendingX = e.clientX - originX;
      pendingY = e.clientY - originY;
      state.x = clamp(pendingX / r, -1.4, 1.4);
      state.y = clamp(pendingY / r, -1.4, 1.4);
      schedule();
    };

    zone.addEventListener('pointerdown', (e) => {
      if (pid !== null) return;               // one thumb per zone
      e.preventDefault();
      pid = e.pointerId;
      try { zone.setPointerCapture(pid); } catch { /* best-effort */ }
      originX = e.clientX; originY = e.clientY;
      place(originX, originY);
      state.active = true;
      state.x = 0; state.y = 0;
      pendingX = 0; pendingY = 0;
      schedule();
    });
    zone.addEventListener('pointermove', (e) => { if (e.pointerId === pid) read(e); });
    const end = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      state.active = false; state.x = 0; state.y = 0;
      pendingX = 0; pendingY = 0;
      this.releaseStick(stickId);
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    this._release = this._release || {};
    this._release[stickId] = () => { pendingX = 0; pendingY = 0; };
  }

  // Returns the ring to its resting corner and re-centres the nub.
  releaseStick(stickId) {
    const stick = document.getElementById(stickId);
    if (!stick) return;
    stick.classList.remove('active');
    stick.style.left = ''; stick.style.top = '';
    stick.style.right = ''; stick.style.bottom = '';
    stick.style.width = ''; stick.style.height = '';
    const nub = stick.querySelector('.tc-nub');
    if (nub) nub.style.transform = 'translate(0,0)';
    if (this._release && this._release[stickId]) this._release[stickId]();
  }
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// Shortens the vector (dx,dy) from (ax,ay) by whatever factor is needed to land
// inside the viewport minus AIM_MARGIN, preserving its direction exactly.
// Returns the endpoint. If the anchor itself is off screen there is nothing
// useful to preserve, so the result is clamped per-axis as a last resort.
function shrinkToView(ax, ay, dx, dy, vw, vh) {
  const lo = AIM_MARGIN, hiX = vw - AIM_MARGIN, hiY = vh - AIM_MARGIN;
  if (ax < lo || ax > hiX || ay < lo || ay > hiY) {
    return { x: clamp(ax + dx, lo, hiX), y: clamp(ay + dy, lo, hiY) };
  }
  let t = 1;
  if (dx > 0) t = Math.min(t, (hiX - ax) / dx);
  else if (dx < 0) t = Math.min(t, (lo - ax) / dx);
  if (dy > 0) t = Math.min(t, (hiY - ay) / dy);
  else if (dy < 0) t = Math.min(t, (lo - ay) / dy);
  t = clamp(t, 0, 1);
  return { x: ax + dx * t, y: ay + dy * t };
}
// Frame-rate independent exponential approach — same helper the camera uses.
function damp(a, b, rate, dt) { return b + (a - b) * Math.exp(-rate * dt); }
