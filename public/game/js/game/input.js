// KOR — player input: keyboard + mouse, a gamepad, and touch.
//
// Everything lands in one Controls object the simulation reads each step:
//   moveX (−1..1 analog), up, down, jump, sprint, crouch, fire (held),
//   jumpPressed, firePressed, reload / swap / melee (edges, consumed by the
//   step), aim: screen-space direction from the player, or a world point (mouse).
//
// Keyboard: the keys are the player's (Settings › Controls, docs §10.41); the
// arrows always move as well. Gamepad (standard mapping): left stick moves
// (pushed all the way: sprint), right stick aims, RT fires, A jump, B crouch,
// X reload, Y swap, RB knife, LB / LT the two abilities, R3 the ultimate,
// Start pauses.
//
// Touch layout (landscape):
//   left half  — floating move stick; push fully sideways to sprint,
//                up/down for ladders
//   right half — floating aim stick (aim follows the thumb's direction);
//                push it past the outer ring to fire
//   buttons    — jump, crouch, reload, knife, swap (the HUD editor places them),
//                pause in the top-left corner
// Where no thumb is down the two sticks rest, faint, where thumbs usually land.

import { t } from '../ui/i18n.js';

// the keyboard's actions and their keys out of the box
export const KEYS_DEFAULT = {
  left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', jump: 'Space', sprint: 'ShiftLeft', crouch: 'KeyC',
  reload: 'KeyR', swap: 'KeyQ', knife: 'KeyF', ab1: 'KeyE', ab2: 'KeyG', ult: 'KeyX',
};
export const KEY_ACTIONS = Object.keys(KEYS_DEFAULT);
// a key code as a person reads it
export function keyName(code) {
  if (!code) return '—';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
  return { Space: '␣', ShiftLeft: 'Shift', ShiftRight: 'Shift R', ControlLeft: 'Ctrl', ControlRight: 'Ctrl R', AltLeft: 'Alt', AltRight: 'Alt R',
    ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Tab: 'Tab', Enter: 'Enter', Backquote: '`', CapsLock: 'Caps' }[code] || code;
}

export class Controls {
  constructor() {
    this.moveX = 0; this.up = false; this.down = false;
    this.jump = false; this.sprint = false; this.crouch = false;
    this.jumpPressed = false;
    this.aimMode = 'dir'; this.aimDX = 1; this.aimDY = 0; this.aimHeld = false; // direction (screen space)
    this.aimSX = 0; this.aimSY = 0; // mouse position (CSS px) when aimMode = 'point'
    this.fire = false; this.firePressed = false; this.touchFire = false;
    this.reloadPressed = false; this.swapPressed = false; this.meleePressed = false;
    this.ab1Pressed = false; this.ab2Pressed = false; this.ultPressed = false; // abilities (read by the mission)
    this.pausePressed = false; // a gamepad's Start (read by the app)
    this.keys = { ...KEYS_DEFAULT };
    this.capture = null; // Settings › keys: the next key pressed goes here instead
  }
  // consumed by each simulation step
  take() { const j = this.jumpPressed; this.jumpPressed = false; return j; }
  takeWeapon(out) {
    out.trigger = this.fire; out.pressed = this.firePressed; out.reload = this.reloadPressed;
    out.swap = this.swapPressed; out.melee = this.meleePressed; out.auto = this.touchFire;
    this.firePressed = this.reloadPressed = this.swapPressed = this.meleePressed = false;
    return out;
  }
}

export function bindKeyboard(ctl, canvas) {
  const keys = new Set();
  const on = (a) => keys.has(ctl.keys[a]);
  const upd = () => {
    ctl.moveX = (on('right') || keys.has('ArrowRight') ? 1 : 0) - (on('left') || keys.has('ArrowLeft') ? 1 : 0);
    ctl.up = on('up') || keys.has('ArrowUp');
    ctl.down = on('down') || keys.has('ArrowDown');
    ctl.sprint = on('sprint') || keys.has('ShiftRight');
    ctl.crouch = on('crouch') || keys.has('ControlLeft');
    ctl.jump = on('jump');
  };
  addEventListener('keydown', (e) => {
    if (ctl.capture) { e.preventDefault(); e.stopImmediatePropagation(); const f = ctl.capture; ctl.capture = null; f(e.code); return; }
    if (e.repeat) return;
    keys.add(e.code);
    const K = ctl.keys, c = e.code;
    if (c === K.jump) ctl.jumpPressed = true;
    if (c === K.reload) ctl.reloadPressed = true;
    if (c === K.swap || c === 'Digit1' || c === 'Digit2') ctl.swapPressed = true;
    if (c === K.knife || c === 'KeyV') ctl.meleePressed = true;
    if (c === K.ab1) ctl.ab1Pressed = true;
    if (c === K.ab2) ctl.ab2Pressed = true;
    if (c === K.ult) ctl.ultPressed = true;
    upd();
  });
  addEventListener('keyup', (e) => { keys.delete(e.code); upd(); });
  addEventListener('blur', () => { keys.clear(); upd(); });
  canvas.addEventListener('mousemove', (e) => { ctl.aimMode = 'point'; ctl.aimSX = e.clientX; ctl.aimSY = e.clientY; });
  canvas.addEventListener('mousedown', (e) => {
    ctl.aimMode = 'point'; ctl.aimSX = e.clientX; ctl.aimSY = e.clientY;
    if (e.button === 0) { ctl.fire = true; ctl.firePressed = true; }
    if (e.button === 2) ctl.meleePressed = true;
  });
  addEventListener('mouseup', (e) => { if (e.button === 0) ctl.fire = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > 8) ctl.swapPressed = true; }, { passive: true });
}

// --- gamepad ----------------------------------------------------------------------------
// Polled once a frame. The pad only writes what it is using: a pad lying on the
// table leaves the keyboard and the touch sticks alone.
const DZ = 0.2;
export function pollPad(ctl, st) {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let g = null;
  for (const p of pads) if (p && p.connected) { g = p; break; }
  st = st || { was: [], move: false, aim: false, fire: false, held: {} };
  if (!g) return st;
  const ax = g.axes, b = (i) => !!(g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.5));
  const edge = (i) => b(i) && !st.was[i];
  const dz = (v) => (Math.abs(v || 0) < DZ ? 0 : v);
  const lx = dz(ax[0]), ly = dz(ax[1]), rx = dz(ax[2]), ry = dz(ax[3]);
  // the d-pad moves too
  const dx = (b(15) ? 1 : 0) - (b(14) ? 1 : 0), mx = lx || dx;
  if (mx || st.move) {
    ctl.moveX = Math.abs(mx) < 0.15 ? 0 : mx; ctl.sprint = Math.abs(lx) > 0.92;
    ctl.up = ly < -0.6 || b(12); ctl.down = ly > 0.6 || b(13);
    st.move = !!(mx || ctl.up || ctl.down);
  }
  const rm = Math.hypot(rx, ry);
  if (rm > 0.25) { ctl.aimMode = 'dir'; ctl.aimDX = rx; ctl.aimDY = ry; ctl.aimHeld = true; st.aim = true; } else if (st.aim) { ctl.aimHeld = false; st.aim = false; }
  const fire = b(7);
  if (fire || st.fire) { if (fire && !ctl.fire) ctl.firePressed = true; ctl.fire = fire; st.fire = fire; }
  // held: jump, crouch
  for (const [i, k] of [[0, 'jump'], [1, 'crouch']]) {
    if (b(i) || st.held[k]) { ctl[k] = b(i); st.held[k] = b(i); }
  }
  if (edge(0)) ctl.jumpPressed = true;
  if (edge(2)) ctl.reloadPressed = true;
  if (edge(3)) ctl.swapPressed = true;
  if (edge(5)) ctl.meleePressed = true;
  if (edge(4)) ctl.ab1Pressed = true;
  if (edge(6)) ctl.ab2Pressed = true;
  if (edge(11)) ctl.ultPressed = true;
  if (edge(9)) ctl.pausePressed = true;
  st.a = edge(0); // the app uses A on a paused card
  for (let i = 0; i < g.buttons.length; i++) st.was[i] = b(i);
  return st;
}

// Floating sticks: the ring appears where the thumb lands.
// opts: { layout: { jump|crouch|reload|knife|swap: { r, b, s } } (px from the
// bottom-right corner, from the HUD editor), fireRing: 0..1 of the reach,
// onPause: the pause button, hints: the resting sticks say what they do }
export function bindTouch(ctl, root, opts = {}) {
  const layer = document.createElement('div');
  layer.className = 'touch' + (opts.hints ? ' hints' : '');
  layer.innerHTML = `
    <div class="rest l"><i></i><span>${t('hud.moveZone')}</span></div>
    <div class="rest r"><i></i><span>${t('hud.aimHint')}</span></div>
    <div class="stick l"><div class="knob"></div></div>
    <div class="stick r"><div class="knob"></div></div>
    <button class="tpause" aria-label="${t('game.pause')}"><i></i><i></i></button>
    ${['jump', 'crouch', 'reload', 'knife', 'swap'].map((k) => `<button class="tbtn ${k}">${t(`hud.${k}`)}</button>`).join('')}`;
  root.appendChild(layer);
  const [sl, sr] = layer.querySelectorAll('.stick'), [rl, rr] = layer.querySelectorAll('.rest');
  const R = 46, FIRE = opts.fireRing || 0.78; // fire past this share of the stick's reach
  if (opts.layout) for (const [k, L] of Object.entries(opts.layout)) {
    const b = layer.querySelector('.tbtn.' + k);
    if (b) Object.assign(b.style, { right: `${L.r}px`, bottom: `${L.b}px`, width: `${L.s}px`, height: `${L.s}px` });
  }
  const pads = new Map(); // pointerId → { side, x0, y0 }
  const show = (el, x, y) => { el.style.display = 'block'; el.style.left = x - R + 'px'; el.style.top = y - R + 'px'; el.firstElementChild.style.transform = 'translate(0,0)'; };
  const knob = (el, dx, dy) => { el.firstElementChild.style.transform = `translate(${dx}px,${dy}px)`; };
  layer.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.tbtn, .tpause')) return;
    const side = e.clientX < innerWidth / 2 ? 'l' : 'r';
    if ([...pads.values()].some((p) => p.side === side)) return;
    pads.set(e.pointerId, { side, x0: e.clientX, y0: e.clientY });
    layer.setPointerCapture(e.pointerId);
    show(side === 'l' ? sl : sr, e.clientX, e.clientY);
    (side === 'l' ? rl : rr).classList.add('off');
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
      const firing = d >= R * FIRE;
      if (firing && !ctl.fire) ctl.firePressed = true;
      ctl.fire = firing; ctl.touchFire = firing;
      sr.classList.toggle('fire', firing);
    }
  });
  const end = (e) => {
    const p = pads.get(e.pointerId); if (!p) return;
    pads.delete(e.pointerId);
    if (p.side === 'l') { sl.style.display = 'none'; rl.classList.remove('off'); ctl.moveX = 0; ctl.sprint = false; ctl.up = false; ctl.down = false; }
    else { sr.style.display = 'none'; rr.classList.remove('off'); sr.classList.remove('fire'); ctl.aimHeld = false; ctl.fire = false; ctl.touchFire = false; }
  };
  layer.addEventListener('pointerup', end); layer.addEventListener('pointercancel', end);
  const hold = (btn, on, off) => {
    btn.addEventListener('pointerdown', (e) => { e.stopPropagation(); btn.classList.add('on'); on(); });
    const up = () => { btn.classList.remove('on'); off(); };
    btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('pointerleave', up);
  };
  hold(layer.querySelector('.jump'), () => { ctl.jump = true; ctl.jumpPressed = true; }, () => { ctl.jump = false; });
  hold(layer.querySelector('.crouch'), () => { ctl.crouch = true; }, () => { ctl.crouch = false; });
  hold(layer.querySelector('.reload'), () => { ctl.reloadPressed = true; }, () => {});
  hold(layer.querySelector('.knife'), () => { ctl.meleePressed = true; }, () => {});
  hold(layer.querySelector('.swap'), () => { ctl.swapPressed = true; }, () => {});
  const pb = layer.querySelector('.tpause');
  pb.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
  pb.addEventListener('click', (e) => { e.stopPropagation(); opts.onPause?.(); });
  layer.hints = (on) => layer.classList.toggle('hints', !!on);
  return layer;
}
