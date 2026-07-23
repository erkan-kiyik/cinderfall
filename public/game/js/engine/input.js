// Keyboard + mouse + gamepad state. Consumers read state; edge events are
// latched per frame. Gamepad input is synthesized into its own held/edge
// sets (never the real keyboard ones) so a connected-but-idle controller
// can never clobber real keyboard state, and vice versa — down()/hit() just
// check both sources. Touch input (engine/touch.js) drives this same Input
// instance directly via its keys/mouse fields, so all three sources compose.

const GP_DEADZONE = 0.22;
const GP_STICK_MAX = 0.9;   // full-tilt threshold for the sprint shortcut

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();       // keys that went down since last endFrame()
    this.mouse = { x: 0, y: 0, down: false, clicked: false, rdown: false };
    this.canvas = canvas;

    // gamepad-synthesized state, kept separate from real keyboard state
    this._gpKeys = new Set();
    this._gpPressed = new Set();
    this._gpBtnPrev = [];
    this._gpSwapIdx = 0;
    this._gpFiring = false;

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.pressed.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.mouse.down = false; });

    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left;
      this.mouse.y = e.clientY - r.top;
    });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) { this.mouse.down = true; this.mouse.clicked = true; }
      if (e.button === 2) this.mouse.rdown = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.down = false;
      if (e.button === 2) this.mouse.rdown = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  down(code) { return this.keys.has(code) || this._gpKeys.has(code); }
  hit(code) { return this.pressed.has(code) || this._gpPressed.has(code); }

  get moveX() {
    return (this.down('KeyD') || this.down('ArrowRight') ? 1 : 0) -
           (this.down('KeyA') || this.down('ArrowLeft') ? 1 : 0);
  }
  get jump() { return this.hit('Space') || this.hit('KeyW') || this.hit('ArrowUp'); }
  get sprint() { return this.down('ShiftLeft') || this.down('ShiftRight'); }
  // hold to crouch; C or either Ctrl (Ctrl is also a common console-shooter bind)
  get crouch() { return this.down('KeyC') || this.down('ControlLeft') || this.down('ControlRight'); }
  // context action (silent takedown): E, or F when not otherwise bound
  get interact() { return this.hit('KeyE'); }

  // Standard-mapping gamepad → the same key/mouse surface everything else
  // reads. Call once per rendered frame (not per fixed-step). No-op, cheaply,
  // when nothing is connected.
  pollGamepad() {
    const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
    let gp = null;
    for (const p of pads) if (p && p.connected) { gp = p; break; }
    this._gpKeys.clear();
    if (!gp) return;

    const dz = (v) => (Math.abs(v) < GP_DEADZONE ? 0 : v);
    const lx = dz(gp.axes[0] || 0);
    const rx = dz(gp.axes[2] || 0), ry = dz(gp.axes[3] || 0);
    const btn = (i) => gp.buttons[i] && gp.buttons[i].pressed;
    const val = (i) => (gp.buttons[i] ? gp.buttons[i].value : 0);

    // movement: left stick or d-pad
    if (lx > 0.32 || btn(15)) this._gpKeys.add('KeyD');
    if (lx < -0.32 || btn(14)) this._gpKeys.add('KeyA');
    // sprint: full stick tilt or the left bumper
    if (Math.abs(lx) > GP_STICK_MAX || btn(4)) this._gpKeys.add('ShiftLeft');
    // crouch (hold): left trigger
    if (val(6) > 0.4) this._gpKeys.add('KeyC');

    // aim: right stick sets a screen-relative point, same convention as the
    // touch aim stick, so the whole downstream aim/camera math is untouched
    if (rx * rx + ry * ry > 0.03) {
      const R = 320;
      this.mouse.x = window.innerWidth / 2 + rx * R;
      this.mouse.y = window.innerHeight / 2 + ry * R;
    }
    // fire: right trigger (analog or digital pad) — only ever asserts true,
    // never forces mouse.down false, so it can't fight real mouse/touch input
    const firing = val(7) > 0.3 || btn(7);
    if (firing) {
      this.mouse.down = true;
      if (!this._gpFiring) this.mouse.clicked = true;
    }
    this._gpFiring = firing;

    // edge-triggered buttons: jump (A), reload (X), takedown (B), pause (Start)
    this._edge(gp, 0, 'Space');
    this._edge(gp, 2, 'KeyR');
    this._edge(gp, 1, 'KeyE');
    this._edge(gp, 9, 'Escape');
    // weapon swap (Y): cycles the same four slots the touch swap button does
    if (this._risingEdge(gp, 3)) {
      this._gpSwapIdx = (this._gpSwapIdx + 1) % 4;
      this._gpPressed.add(['Digit1', 'Digit2', 'Digit3', 'Digit4'][this._gpSwapIdx]);
    }

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
