// On-screen touch controls. Rather than a parallel input path, this drives the
// existing Input instance — synthesising key presses (KeyA/KeyD/Space/KeyR/
// Digit1-4, ShiftLeft) and mouse state (aim position + fire) — so the whole
// gameplay layer reads input exactly as it does with a keyboard + mouse.

const isTouch = () =>
  (typeof window !== 'undefined') &&
  (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));

export class TouchControls {
  constructor(input, { force = false } = {}) {
    this.input = input;
    this.enabled = force || isTouch();
    this.el = document.getElementById('touch');
    this.visible = false;
    this.swapIndex = 0;
    // seed a sensible default aim so the crosshair isn't at 0,0 before first drag
    input.mouse.x = window.innerWidth * 0.68;
    input.mouse.y = window.innerHeight * 0.46;
  }

  mount() {
    if (!this.enabled || !this.el) return;
    this.bindStick('tc-move', (nx, ny, active) => this.onMove(nx, ny, active));
    this.bindStick('tc-aim', (nx, ny, active) => this.onAim(nx, ny, active));
    this.bindButton('tc-jump', () => this.press('Space'));
    this.bindButton('tc-reload', () => this.press('KeyR'));
    this.bindButton('tc-swap', () => this.cycleWeapon());
    this.bindHold('tc-crouch', 'KeyC');
    this.bindButton('tc-takedown', () => this.press('KeyE'));
    this.bindButton('tc-pause', () => this.press('Escape'));
  }

  // Holds a key down for as long as the touch button is pressed (unlike
  // press(), which is a momentary tap) — used for crouch.
  bindHold(id, code) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); this.key(code, true); el.classList.add('on'); });
    const up = () => { this.key(code, false); el.classList.remove('on'); };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
  }

  setTakedownAvailable(on) {
    const el = document.getElementById('tc-takedown');
    if (el) el.classList.toggle('avail', !!on);
  }

  setVisible(on) {
    this.visible = on && this.enabled;
    if (this.el) this.el.classList.toggle('on', this.visible);
    if (!this.visible) { this.onMove(0, 0, false); this.onAim(0, 0, false); }
  }

  // ---- helpers driving the shared Input ----
  key(code, down) {
    if (down) this.input.keys.add(code); else this.input.keys.delete(code);
  }
  press(code) { this.input.keys.add(code); this.input.pressed.add(code); setTimeout(() => this.input.keys.delete(code), 40); }

  onMove(nx, ny, active) {
    this.key('KeyD', active && nx > 0.34);
    this.key('KeyA', active && nx < -0.34);
    // full tilt = sprint; hard up flick = jump (rising edge)
    this.key('ShiftLeft', active && Math.abs(nx) > 0.82);
    const wantJump = active && ny < -0.6;
    if (wantJump && !this._jumpLatch) { this.input.pressed.add('Space'); this._jumpLatch = true; }
    if (!wantJump) this._jumpLatch = false;
  }

  onAim(nx, ny, active) {
    const m = this.input.mouse;
    if (active && (nx * nx + ny * ny) > 0.04) {
      const R = 320;
      m.x = window.innerWidth / 2 + nx * R;
      m.y = window.innerHeight / 2 + ny * R;
      if (!this._aimLatch) { m.clicked = true; this._aimLatch = true; }
      m.down = true;
    } else {
      m.down = false;
      this._aimLatch = false;
    }
  }

  cycleWeapon() {
    const codes = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];
    this.swapIndex = (this.swapIndex + 1) % codes.length;
    this.press(codes[this.swapIndex]);
  }

  bindButton(id, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(); });
  }

  // Reports normalised nub offset (-1..1) and active state to `cb`.
  bindStick(id, cb) {
    const stick = document.getElementById(id);
    if (!stick) return;
    const nub = stick.querySelector('.tc-nub');
    let pid = null;
    const maxR = 46;

    const update = (e) => {
      const r = stick.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const len = Math.hypot(dx, dy) || 1;
      const cl = Math.min(len, maxR);
      const ux = dx / len, uy = dy / len;
      nub.style.transform = `translate(${ux * cl}px, ${uy * cl}px)`;
      cb(dx / maxR, dy / maxR, true);
    };
    const reset = () => {
      nub.style.transform = 'translate(0,0)';
      cb(0, 0, false);
    };

    stick.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pid = e.pointerId;
      stick.setPointerCapture(pid);
      update(e);
    });
    stick.addEventListener('pointermove', (e) => { if (e.pointerId === pid) update(e); });
    const end = (e) => {
      if (e.pointerId !== pid) return;
      pid = null; reset();
    };
    stick.addEventListener('pointerup', end);
    stick.addEventListener('pointercancel', end);
  }
}
