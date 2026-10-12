// CINDERFALL LAB — player input: keyboard + mouse, and touch.
//
// Everything lands in one Controls object the simulation reads each step:
//   moveX (−1..1 analog), up, down, jump, sprint, crouch (held),
//   jumpPressed / crouchPressed (edges, consumed by the step),
//   aim: screen-space direction from the player, or a world point (mouse).
//
// Touch layout (landscape):
//   left half  — floating move stick; push fully sideways to sprint,
//                up/down for ladders
//   right half — floating aim stick (aim follows the thumb's direction)
//   buttons    — ZIPLA (jump) and ÇÖMEL (crouch / slide) bottom right

export class Controls {
  constructor() {
    this.moveX = 0; this.up = false; this.down = false;
    this.jump = false; this.sprint = false; this.crouch = false;
    this.jumpPressed = false;
    this.aimMode = 'dir'; this.aimDX = 1; this.aimDY = 0; this.aimHeld = false; // direction (screen space)
    this.aimSX = 0; this.aimSY = 0; // mouse position (CSS px) when aimMode = 'point'
  }
  // consumed by each simulation step
  take() { const j = this.jumpPressed; this.jumpPressed = false; return j; }
}

export function bindKeyboard(ctl, canvas) {
  const keys = new Set();
  const upd = () => {
    ctl.moveX = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    ctl.up = keys.has('KeyW') || keys.has('ArrowUp');
    ctl.down = keys.has('KeyS') || keys.has('ArrowDown');
    ctl.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
    ctl.crouch = keys.has('KeyC') || keys.has('ControlLeft');
    ctl.jump = keys.has('Space');
  };
  addEventListener('keydown', (e) => {
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === 'Space') ctl.jumpPressed = true;
    upd();
  });
  addEventListener('keyup', (e) => { keys.delete(e.code); upd(); });
  canvas.addEventListener('mousemove', (e) => { ctl.aimMode = 'point'; ctl.aimSX = e.clientX; ctl.aimSY = e.clientY; });
}

// Floating sticks: the ring appears where the thumb lands.
export function bindTouch(ctl, root) {
  const layer = document.createElement('div');
  layer.className = 'touch';
  layer.innerHTML = `
    <div class="stick l"><div class="knob"></div></div>
    <div class="stick r"><div class="knob"></div></div>
    <button class="tbtn jump">ZIPLA</button>
    <button class="tbtn crouch">ÇÖMEL</button>`;
  root.appendChild(layer);
  const [sl, sr] = layer.querySelectorAll('.stick');
  const R = 46;
  const pads = new Map(); // pointerId → { side, x0, y0 }
  const show = (el, x, y) => { el.style.display = 'block'; el.style.left = x - R + 'px'; el.style.top = y - R + 'px'; el.firstElementChild.style.transform = 'translate(0,0)'; };
  const knob = (el, dx, dy) => { el.firstElementChild.style.transform = `translate(${dx}px,${dy}px)`; };
  layer.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.tbtn')) return;
    const side = e.clientX < innerWidth / 2 ? 'l' : 'r';
    if ([...pads.values()].some((p) => p.side === side)) return;
    pads.set(e.pointerId, { side, x0: e.clientX, y0: e.clientY });
    layer.setPointerCapture(e.pointerId);
    show(side === 'l' ? sl : sr, e.clientX, e.clientY);
  });
  layer.addEventListener('pointermove', (e) => {
    const p = pads.get(e.pointerId); if (!p) return;
    let dx = e.clientX - p.x0, dy = e.clientY - p.y0;
    const d = Math.hypot(dx, dy), k = d > R ? R / d : 1;
    dx *= k; dy *= k;
    if (p.side === 'l') {
      knob(sl, dx, dy);
      const nx = dx / R, ny = dy / R;
      ctl.moveX = Math.abs(nx) < 0.15 ? 0 : nx;
      ctl.sprint = Math.abs(nx) > 0.92;
      ctl.up = ny < -0.6 && Math.abs(nx) < 0.6; ctl.down = ny > 0.6 && Math.abs(nx) < 0.6;
    } else {
      knob(sr, dx, dy);
      if (d > 8) { ctl.aimMode = 'dir'; ctl.aimDX = dx; ctl.aimDY = dy; ctl.aimHeld = true; }
    }
  });
  const end = (e) => {
    const p = pads.get(e.pointerId); if (!p) return;
    pads.delete(e.pointerId);
    if (p.side === 'l') { sl.style.display = 'none'; ctl.moveX = 0; ctl.sprint = false; ctl.up = false; ctl.down = false; }
    else { sr.style.display = 'none'; ctl.aimHeld = false; }
  };
  layer.addEventListener('pointerup', end); layer.addEventListener('pointercancel', end);
  const hold = (btn, on, off) => {
    btn.addEventListener('pointerdown', (e) => { e.stopPropagation(); btn.classList.add('on'); on(); });
    const up = () => { btn.classList.remove('on'); off(); };
    btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('pointerleave', up);
  };
  hold(layer.querySelector('.jump'), () => { ctl.jump = true; ctl.jumpPressed = true; }, () => { ctl.jump = false; });
  hold(layer.querySelector('.crouch'), () => { ctl.crouch = true; }, () => { ctl.crouch = false; });
  return layer;
}
