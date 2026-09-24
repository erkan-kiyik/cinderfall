// Keyboard + mouse + gamepad state. Consumers read state; edge events are
// latched per frame. Gamepad input is synthesized into its own held/edge
// sets (never the real keyboard ones) so a connected-but-idle controller
// can never clobber real keyboard state, and vice versa — down()/hit() just
// check both sources. Touch input (engine/touch.js) drives this same Input
// instance through the same arrangement: its synthetic keys live in
// `touchKeys`, its analog move in `axisX`, and its trigger in a fire hold
// (see hold()), so all three sources compose instead of overwriting each other.

const GP_DEADZONE = 0.22;
const GP_OUTER = 0.95;      // a worn stick rarely reports a clean 1.0 at the rim
const GP_STICK_MAX = 0.9;   // full-tilt threshold for the sprint shortcut
// Right-stick deflection before it takes the aim. Radial and higher than the
// move deadzone: a released stick springs back through the middle, and the
// direction it reports on the way is noise that would swing the aim.
const GP_AIM_DEADZONE = 0.35;

// Stick aim (gamepad right stick here, the touch aim stick in touch.js) puts
// the crosshair this far out from the operator's chest, as a fraction of the
// SHORTER viewport axis — scaled off the long edge, a full upward push on an
// 844x390 phone lands the crosshair off the top of the screen. AIM_MARGIN is
// kept clear of every edge when the ray is pulled back into view.
export const AIM_REACH = 0.4;
const AIM_MARGIN = 26;

// Every key the game binds. Ctrl is a crouch key, so Ctrl + one of these is an
// ordinary thing to press mid-fight — and Ctrl+R reloads the page, Ctrl+D
// bookmarks it, Ctrl+1–4 jump to another tab, Ctrl+F opens find.
const GAME_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyD', 'KeyC', 'KeyE', 'KeyF', 'KeyR', 'Space',
  'Digit1', 'Digit2', 'Digit3', 'Digit4',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight',
]);

// Keys that are never "the player pressing a key" as far as skipping a
// cinematic goes: function keys (F3 is the debug overlay; F5/F11/F12 belong
// to the browser) and bare modifiers, which are only ever half of something.
const NON_SKIP = /^(F\d{1,2}$|Shift|Control|Alt|Meta|OS|CapsLock|NumLock|ScrollLock|Fn|ContextMenu)/;
export function isSkipKey(code) { return !NON_SKIP.test(code || ''); }

function isEditable(el) {
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || ''));
}

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();       // keys that went down since last endFrame()
    this.mouse = { x: 0, y: 0, down: false, clicked: false, rdown: false };
    this.canvas = canvas;
    // Analog horizontal move, -1..1, written by the touch layer (and left at 0
    // by keyboard/gamepad). A keyboard can only ever say "full left" or "full
    // right"; a thumb on a stick can say "a third of the way", and the
    // movement code already multiplies by whatever moveX returns, so honouring
    // that costs nothing downstream.
    this.axisX = 0;
    // The gamepad left stick's own analog axis, same range and meaning. Kept
    // apart from axisX so neither source can zero the other's.
    this.gpAxisX = 0;
    // Keys held by the on-screen touch buttons/sticks. Their own set, like the
    // gamepad's, so a touch control letting go never deletes a real key.
    this.touchKeys = new Set();
    // True while play is running (fed from the game's state changes, via
    // TouchControls.setVisible). Gates the Ctrl-chord suppression below, so
    // the menus keep every browser shortcut.
    this.gameplay = false;
    // Where the operator's chest is on screen, reported by the game each
    // frame. Stick aim works outward from here so the stick angle and the shot
    // angle are the same thing. Screen centre until the game reports one.
    this.aimAnchor = { x: 0, y: 0, set: false };
    // Is the crosshair a direction (stick aim: only its angle from the chest
    // means anything) or a position (mouse)? Set by whichever wrote it last.
    this.aimDirectional = false;

    // Who is holding the trigger / the heavy strike. mouse.down and
    // mouse.rdown are just "is anyone holding it" (see hold()).
    this._fireHolds = new Set();
    this._heavyHolds = new Set();

    // gamepad-synthesized state, kept separate from real keyboard state
    this._gpKeys = new Set();
    this._gpPressed = new Set();
    this._gpBtnPrev = [];
    this._gpFiring = false;

    // Viewport, cached: see TouchControls — read on resize, not per frame.
    this._vw = window.innerWidth;
    this._vh = window.innerHeight;
    const onResize = () => { this._vw = window.innerWidth; this._vh = window.innerHeight; };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    window.addEventListener('keydown', (e) => {
      // Ctrl+<game key> during play is the crouch key plus a move, not a
      // browser shortcut. Checked before the repeat bail-out, because a held
      // Ctrl+R auto-repeats and every repeat would reload the page. (Ctrl+W
      // is reserved by some browsers and cannot be stopped from a page.)
      if (e.ctrlKey && this.gameplay && GAME_KEYS.has(e.code) && !isEditable(e.target)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      this.pressed.add(e.code);
      // F3 opens the browser's own find bar in some builds, which steals the
      // keystroke the debug overlay is bound to. Everything else here is
      // swallowed because the page would otherwise scroll under the game.
      if (['Space', 'ArrowUp', 'ArrowDown', 'F3'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.keys.clear(); this.touchKeys.clear(); this.axisX = 0;
      this._fireHolds.clear(); this._heavyHolds.clear();
      this.mouse.down = false; this.mouse.rdown = false;
    });

    // A browser replays every tap as mousemove/mousedown/mouseup on whatever
    // was under the finger. Fingers belong to the touch layer, so a replayed
    // tap still counts as a click (it is how a tap skips the deploy
    // cinematic) but never as a mouse: it must not swing the aim to a stray
    // tap in the HUD strip, or hold the trigger. sourceCapabilities says so
    // outright where it exists; elsewhere, "just after a touch" does.
    this._touchT = -1e9;
    const touched = () => { this._touchT = performance.now(); };
    window.addEventListener('touchstart', touched, { capture: true, passive: true });
    window.addEventListener('touchend', touched, { capture: true, passive: true });
    const fromTouch = (e) => (e.sourceCapabilities
      ? e.sourceCapabilities.firesTouchEvents
      : performance.now() - this._touchT < 800);

    canvas.addEventListener('mousemove', (e) => {
      if (fromTouch(e)) return;
      const r = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left;
      this.mouse.y = e.clientY - r.top;
      this.aimDirectional = false;
    });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.clicked = true;
      if (fromTouch(e)) return;
      if (e.button === 0) this.hold('fire', 'mouse', true);
      if (e.button === 2) this.hold('heavy', 'mouse', true);
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.hold('fire', 'mouse', false);
      if (e.button === 2) this.hold('heavy', 'mouse', false);
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  down(code) { return this.keys.has(code) || this._gpKeys.has(code) || this.touchKeys.has(code); }
  hit(code) { return this.pressed.has(code) || this._gpPressed.has(code); }

  // A source (mouse button, gamepad trigger, touch aim stick…) holding or
  // releasing the trigger ('fire' → mouse.down) or the heavy strike ('heavy'
  // → mouse.rdown). The logical field is the OR of every holder, so a source
  // letting go only ever releases its own hold: a trigger coming up cannot
  // cancel a mouse button that is still down, and a touch stick sitting idle
  // cannot cancel either.
  hold(kind, source, on) {
    const set = kind === 'heavy' ? this._heavyHolds : this._fireHolds;
    if (on) set.add(source); else set.delete(source);
    if (kind === 'heavy') this.mouse.rdown = set.size > 0;
    else this.mouse.down = set.size > 0;
  }

  // The operator's screen position (chest height), from the game loop.
  setAimAnchor(x, y) { this.aimAnchor.x = x; this.aimAnchor.y = y; this.aimAnchor.set = true; }

  get moveX() {
    // An analog axis wins when it is live — touch first, then the gamepad
    // stick; digital keys are the fallback, so a player can lift their thumb
    // off the stick and finish the run on a keyboard (or a gamepad d-pad)
    // without anything getting stuck.
    if (this.axisX !== 0) return this.axisX;
    if (this.gpAxisX !== 0) return this.gpAxisX;
    return (this.down('KeyD') || this.down('ArrowRight') ? 1 : 0) -
           (this.down('KeyA') || this.down('ArrowLeft') ? 1 : 0);
  }
  get jump() { return this.hit('Space') || this.hit('KeyW') || this.hit('ArrowUp'); }
  get sprint() { return this.down('ShiftLeft') || this.down('ShiftRight'); }
  // hold to crouch; C or either Ctrl (Ctrl is also a common console-shooter bind)
  get crouch() { return this.down('KeyC') || this.down('ControlLeft') || this.down('ControlRight'); }
  // context action (silent takedown): E, or F when not otherwise bound
  get interact() { return this.hit('KeyE'); }
  // Did the player ask to skip a cinematic this frame? Any key, pad button or
  // click/tap — except function keys and bare modifiers (see isSkipKey), so
  // toggling the F3 overlay to watch a cutscene doesn't end it.
  get skipHit() {
    if (this.mouse.clicked) return true;
    for (const c of this.pressed) if (isSkipKey(c)) return true;
    for (const c of this._gpPressed) if (isSkipKey(c)) return true;
    return false;
  }

  // Standard-mapping gamepad → the same key/mouse surface everything else
  // reads. Call once per rendered frame (not per fixed-step). No-op, cheaply,
  // when nothing is connected.
  //
  //   left stick  move (analog)      d-pad ←/→  move (digital)
  //   A  jump     B  takedown        X  reload     Y  next weapon
  //   LB sprint   LT crouch (hold)   RB heavy strike (hold)   RT fire
  //   d-pad ↑  inspect               Start  pause   right stick  aim
  pollGamepad() {
    const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
    let gp = null;
    for (const p of pads) if (p && p.connected) { gp = p; break; }
    this._gpKeys.clear();
    if (!gp) {
      // Unplugged, or asleep, mid-press: let go of everything it was holding,
      // or a trigger held at the moment the battery died fires forever.
      this.gpAxisX = 0;
      this._gpFiring = false;
      this.hold('fire', 'pad', false);
      this.hold('heavy', 'pad', false);
      this._gpBtnPrev.length = 0;
      return;
    }

    const btn = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const val = (i) => (gp.buttons[i] ? gp.buttons[i].value : 0);

    // movement: the left stick is analog, like the touch move stick — the
    // deadzone is cut out and the rest rescaled, so a partial push walks and
    // the first live input is a creep rather than a jump to 22% speed. The
    // d-pad stays digital (keys, below).
    const lx = gp.axes[0] || 0;
    const lmag = Math.abs(lx);
    this.gpAxisX = lmag <= GP_DEADZONE ? 0
      : Math.sign(lx) * Math.min(1, (lmag - GP_DEADZONE) / (GP_OUTER - GP_DEADZONE));
    // The digital keys stay in sync for anything that reads them directly;
    // gpAxisX is what actually sets the speed (see moveX).
    if (this.gpAxisX > 0.05 || btn(15)) this._gpKeys.add('KeyD');
    if (this.gpAxisX < -0.05 || btn(14)) this._gpKeys.add('KeyA');
    // sprint: full stick tilt or the left bumper
    if (lmag > GP_STICK_MAX || btn(4)) this._gpKeys.add('ShiftLeft');
    // crouch (hold): left trigger
    if (val(6) > 0.4) this._gpKeys.add('KeyC');

    // Aim: the right stick points the crosshair out from the operator's own
    // screen position, exactly like the touch aim stick — push at 2 o'clock,
    // the shot goes to 2 o'clock, whatever the camera is doing. Only the
    // direction is taken; the crosshair sits at full reach. A stick springs
    // back to centre when released, and scaling the distance by deflection
    // would collapse the crosshair onto the chest every time a thumb lifted.
    // Written only while deflected, so an idle pad never takes the aim off a
    // mouse, and a released stick holds the last aim like touch does.
    const rx = gp.axes[2] || 0, ry = gp.axes[3] || 0;
    const rmag = Math.hypot(rx, ry);
    if (rmag > GP_AIM_DEADZONE) {
      const vw = this._vw, vh = this._vh;
      const a = this.aimAnchor;
      const ax = a.set ? a.x : vw / 2, ay = a.set ? a.y : vh / 2;
      const reach = Math.min(vw, vh) * AIM_REACH;
      const p = shrinkToView(ax, ay, (rx / rmag) * reach, (ry / rmag) * reach, vw, vh);
      this.mouse.x = p.x;
      this.mouse.y = p.y;
      this.aimDirectional = true;
    }
    // fire: right trigger (analog or digital pad). A hold like any other
    // source's, so coming off the trigger stops the gun (it used to latch
    // mouse.down on and never clear it) without touching a held mouse button.
    const firing = val(7) > 0.3 || btn(7);
    if (firing && !this._gpFiring) this.mouse.clicked = true;
    this.hold('fire', 'pad', firing);
    this._gpFiring = firing;
    // heavy strike (hold): right bumper — the same field right-click drives
    this.hold('heavy', 'pad', btn(5));

    // edge-triggered buttons: jump (A), reload (X), takedown (B), pause
    // (Start), inspect (d-pad up)
    this._edge(gp, 0, 'Space');
    this._edge(gp, 2, 'KeyR');
    this._edge(gp, 1, 'KeyE');
    this._edge(gp, 9, 'Escape');
    this._edge(gp, 12, 'KeyF');
    // Weapon swap (Y). A logical "next weapon" rather than a guessed digit:
    // only the Player knows what is equipped and what is unlocked, so it
    // decides what "next" is (the old private 1→4 counter wasted a press on
    // the locked SMG and drifted away from the equipped weapon).
    this._edge(gp, 3, 'WeaponNext');

    this._gpBtnPrev = gp.buttons.map((b) => b.pressed);
  }

  _risingEdge(gp, i) {
    const now = !!(gp.buttons[i] && gp.buttons[i].pressed);
    const was = !!this._gpBtnPrev[i];
    return now && !was;
  }

  _edge(gp, i, code) {
    if (this._risingEdge(gp, i)) this._gpPressed.add(code);
  }

  endFrame() {
    this.pressed.clear();
    this._gpPressed.clear();
    this.mouse.clicked = false;
  }
}

// Shortens the vector (dx,dy) from (ax,ay) by whatever factor is needed to land
// inside the viewport minus AIM_MARGIN, preserving its direction exactly —
// a per-axis clamp would bend a diagonal shot toward the nearest edge, which is
// the one thing the aim must never do. Returns the endpoint. If the anchor
// itself is off screen there is nothing useful to preserve, so the result is
// clamped per-axis as a last resort. Shared with the touch aim stick.
export function shrinkToView(ax, ay, dx, dy, vw, vh) {
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

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
