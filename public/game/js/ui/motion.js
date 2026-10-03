// Springy UI motion: the one place every menu interaction gets its feel from.
//
// The menus used to have exactly one response to anything — lift 2px on hover,
// drop on press — so a crate, a purchase and a back button all felt the same.
// This module gives each *kind* of interaction its own behaviour, built from a
// handful of primitives:
//
//   press(el)          squash on touch, spring back with overshoot on release
//   hold(el, opts)     press-and-hold to confirm, with a filling ring
//   deny(el)           the "no" wobble: a decaying side-to-side shake
//   popIn(nodes)       staggered spring entrance for a freshly built list
//   tilt(el)           card leans toward the finger while it is held
//   coinsTo(from, to)  scrap tokens arc from one element to another
//   sparks(el, opts)   a small radial burst, tinted per call
//   haptic(kind)       vibration through Capacitor Haptics, falling back to
//                      navigator.vibrate, honouring the player's setting
//
// Cost rules (the game has to run on cheap phones):
//   - transform/opacity only, through WAAPI or CSS classes — no layout work;
//   - every effect checks level(): 0 when the OS asks for reduced motion
//     (instant, no decoration), 1 on the Low graphics tier (the core squash
//     only — no tilt, sparks or coin flights), 2 otherwise;
//   - no per-frame JS while idle; the only rAF loops run during a hold or a
//     coin flight and stop themselves.

import { settings } from '../engine/settings.js';
import { quality } from '../engine/quality.js';
import { paintScrap } from '../art/currency.js';

// Spring curves. `linear()` gives a real overshoot-and-settle that a single
// cubic-bezier cannot; WebViews older than Chrome 113 fall back to a
// back-out bezier, which still overshoots once.
const SPRING_LINEAR = 'linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1)';
let springOk = null;
export function spring() {
  if (springOk == null) {
    try { springOk = CSS.supports('animation-timing-function', SPRING_LINEAR); } catch { springOk = false; }
  }
  return springOk ? SPRING_LINEAR : 'cubic-bezier(0.34, 1.56, 0.64, 1)';
}
export const EASE_OUT = 'cubic-bezier(0.16, 0.84, 0.44, 1)';

let reduceMq = null;
export function level() {
  if (reduceMq == null && window.matchMedia) reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMq && reduceMq.matches) return 0;
  return quality.data && quality.data.tier === 'low' ? 1 : 2;
}

function canAnimate(el) {
  return !!el && typeof el.animate === 'function' && level() > 0;
}

// ---- haptics --------------------------------------------------------------
// Capacitor's Haptics plugin when running in the app (proper taptic patterns,
// and it carries the VIBRATE permission), the Vibration API in a browser.
const VIBRATE = { tap: 8, soft: 12, tick: 5, success: [14, 40, 22], warn: [26, 50, 26], heavy: 34 };
export function haptic(kind = 'tap') {
  if (!settings.haptics) return;
  const H = window.Capacitor?.isNativePlatform?.() && window.Capacitor.Plugins?.Haptics;
  try {
    if (H) {
      if (kind === 'success') H.notification({ type: 'SUCCESS' });
      else if (kind === 'warn') H.notification({ type: 'WARNING' });
      else if (kind === 'heavy') H.impact({ style: 'HEAVY' });
      else if (kind === 'soft') H.impact({ style: 'MEDIUM' });
      else if (kind === 'tick') H.selectionChanged ? H.selectionChanged() : H.impact({ style: 'LIGHT' });
      else H.impact({ style: 'LIGHT' });
      return;
    }
    if (navigator.vibrate) navigator.vibrate(VIBRATE[kind] || VIBRATE.tap);
  } catch { /* a missing motor is not an error */ }
}

// ---- sound ----------------------------------------------------------------
let audioRef = null;
export function bindAudio(a) { audioRef = a; }
export function sfx(name, ...args) {
  if (audioRef && typeof audioRef[name] === 'function') audioRef[name](...args);
}

// ---- press: squash and spring back ---------------------------------------
// Bound once per element. Pointer events cover mouse and touch alike; the
// release animation runs from wherever the squash had got to, so a quick tap
// still gets the full bounce.
export function press(el, { scale = 0.92, sound = true, buzz = 'tap' } = {}) {
  if (!el || el._press) return el;
  el._press = true;
  el.classList.add('mo-press');
  let anim = null;
  const down = (e) => {
    if (el.disabled || (e.button != null && e.button > 0)) return;
    if (sound) sfx('uiPress');
    if (buzz) haptic(buzz);
    if (!canAnimate(el)) return;
    if (anim) anim.cancel();
    anim = el.animate([{ transform: 'scale(1)' }, { transform: `scale(${scale})` }],
      { duration: 110, easing: EASE_OUT, fill: 'forwards' });
  };
  const up = () => {
    if (!anim) return;
    anim.cancel();
    anim = el.animate([
      { transform: `scale(${scale})` },
      { transform: 'scale(1)' },
    ], { duration: 520, easing: spring() });
    anim.onfinish = () => { anim = null; };
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointerleave', up);
  el.addEventListener('pointercancel', up);
  return el;
}

// ---- deny: decaying wobble -------------------------------------------------
export function deny(el, { sound = true } = {}) {
  if (sound) sfx('uiDeny');
  haptic('warn');
  if (!el) return;
  el.classList.remove('mo-deny');
  void el.offsetWidth;
  el.classList.add('mo-deny');
  setTimeout(() => el.classList.remove('mo-deny'), 700);
  if (!canAnimate(el)) return;
  el.animate([
    { transform: 'translateX(0) rotate(0)' },
    { transform: 'translateX(-9px) rotate(-2deg)', offset: 0.14 },
    { transform: 'translateX(8px) rotate(1.6deg)', offset: 0.3 },
    { transform: 'translateX(-5px) rotate(-1deg)', offset: 0.48 },
    { transform: 'translateX(3px) rotate(0.5deg)', offset: 0.66 },
    { transform: 'translateX(-1px)', offset: 0.82 },
    { transform: 'translateX(0) rotate(0)' },
  ], { duration: 560, easing: 'ease-out' });
}

// ---- bump: one springy pulse (a counter changing, a tab receiving) --------
export function bump(el, amount = 1.14) {
  if (!canAnimate(el)) return;
  el.animate([{ transform: 'scale(1)' }, { transform: `scale(${amount})`, offset: 0.25 }, { transform: 'scale(1)' }],
    { duration: 560, easing: spring() });
}

// ---- popIn: staggered spring entrance --------------------------------------
// Capped at 14 staggered children so a long grid does not take a second to
// finish arriving; the rest come in with the last group.
export function popIn(nodes, { step = 38, from = 0.86, rise = 14 } = {}) {
  const list = Array.from(nodes || []);
  const lv = level();
  if (lv === 0) return;
  list.forEach((n, i) => {
    if (typeof n.animate !== 'function') return;
    const delay = Math.min(i, 14) * step;
    n.animate([
      { transform: `translateY(${rise}px) scale(${from})`, opacity: 0 },
      { transform: 'translateY(0) scale(1)', opacity: 1 },
    ], { duration: lv === 1 ? 260 : 620, delay, easing: lv === 1 ? EASE_OUT : spring(), fill: 'backwards' });
  });
}

// ---- tilt: the card leans toward the finger -------------------------------
// Only while a pointer is down on it (hover-tilt would never be seen on a
// phone, and would cost a style write per mousemove on desktop for nothing).
export function tilt(el, { max = 9 } = {}) {
  if (!el || el._tilt) return el;
  el._tilt = true;
  el.classList.add('mo-tilt');
  let active = false, raf = 0, rx = 0, ry = 0, gx = 50, gy = 50;
  const apply = () => {
    raf = 0;
    el.style.setProperty('--tx', `${rx.toFixed(2)}deg`);
    el.style.setProperty('--ty', `${ry.toFixed(2)}deg`);
    el.style.setProperty('--gx', `${gx.toFixed(1)}%`);
    el.style.setProperty('--gy', `${gy.toFixed(1)}%`);
  };
  const move = (e) => {
    if (!active) return;
    const r = el.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    ry = (px - 0.5) * 2 * max;
    rx = -(py - 0.5) * 2 * max;
    gx = px * 100; gy = py * 100;
    if (!raf) raf = requestAnimationFrame(apply);
  };
  const start = (e) => {
    if (level() < 2) return;
    active = true;
    el.classList.add('tilting');
    move(e);
  };
  const end = () => {
    if (!active) return;
    active = false;
    rx = ry = 0;
    el.classList.remove('tilting');
    apply();
  };
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointerleave', end);
  el.addEventListener('pointercancel', end);
  return el;
}

// ---- hold: press-and-hold to confirm ---------------------------------------
// The button grows a ring (CSS conic-gradient driven by --hold) that fills
// over `ms`. Let go early and it springs back empty with a hint; hold to the
// end and onConfirm runs. A plain click (keyboard Enter/Space, or assistive
// tech) confirms immediately — the hold is a guard against fat-finger taps on
// a touch screen, not an accessibility barrier.
export function hold(el, { ms = 520, onConfirm, onHint, canStart } = {}) {
  if (!el) return el;
  el.classList.add('mo-hold');
  let t0 = 0, raf = 0, ticks = 0, pointerId = null, confirmed = false;
  const set = (p) => el.style.setProperty('--hold', String(p));
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  const frame = (now) => {
    const p = Math.min(1, (now - t0) / ms);
    set(p);
    const tick = Math.floor(p * 5);
    if (tick > ticks) { ticks = tick; sfx('uiHoldTick', p); haptic('tick'); }
    if (p >= 1) {
      stop();
      confirmed = true;
      el.classList.remove('holding');
      el.classList.add('held');
      setTimeout(() => { el.classList.remove('held'); set(0); }, 420);
      if (onConfirm) onConfirm();
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  el.addEventListener('pointerdown', (e) => {
    if (e.button != null && e.button > 0) return;
    if (canStart && !canStart()) return;
    confirmed = false;
    pointerId = e.pointerId;
    t0 = performance.now(); ticks = 0;
    el.classList.add('holding');
    stop();
    raf = requestAnimationFrame(frame);
  });
  const cancel = (e) => {
    if (pointerId == null || (e && e.pointerId !== pointerId)) return;
    pointerId = null;
    if (!raf) return;
    const p = Number(el.style.getPropertyValue('--hold')) || 0;
    stop();
    el.classList.remove('holding');
    set(0);
    if (p < 0.98 && onHint) onHint(p);
  };
  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointerleave', cancel);
  el.addEventListener('pointercancel', cancel);
  // keyboard / assistive activation: no pointer involved, confirm directly
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    if (e.detail === 0 && !confirmed) { if (!canStart || canStart()) onConfirm && onConfirm(); }
    confirmed = false;
  });
  return el;
}

// ---- shared fx layer --------------------------------------------------------
let layer = null;
function fxLayer() {
  if (layer && document.body.contains(layer)) return layer;
  layer = document.createElement('div');
  layer.className = 'mo-layer';
  document.body.appendChild(layer);
  return layer;
}

let coinUrl = null;
function coinSprite() {
  if (coinUrl) return coinUrl;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 40;
  paintScrap(cv.getContext('2d'), 40, 40);
  coinUrl = cv.toDataURL('image/png');
  return coinUrl;
}

function centre(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

// ---- coinsTo: tokens arc from one element to another ----------------------
// Used for spending (balance -> item) and earning (source -> balance). Each
// token takes its own slightly different arc so they read as a handful rather
// than a single blob. Resolves when the first one lands, so the caller can
// sync the balance tick with the arrival.
export function coinsTo(fromEl, toEl, { count = 6, onLand } = {}) {
  if (!fromEl || !toEl || level() < 2) { if (onLand) onLand(); return; }
  const a = centre(fromEl), b = centre(toEl);
  if (!a.w || !b.w) { if (onLand) onLand(); return; }
  const host = fxLayer();
  const url = coinSprite();
  let landed = false;
  for (let i = 0; i < count; i++) {
    const c = document.createElement('img');
    c.className = 'mo-coin';
    c.src = url; c.alt = '';
    c.style.left = `${a.x}px`; c.style.top = `${a.y}px`;
    host.appendChild(c);
    const dx = b.x - a.x, dy = b.y - a.y;
    const lift = -40 - Math.random() * 40;
    const spread = (Math.random() - 0.5) * 50;
    const anim = c.animate([
      { transform: 'translate(-50%,-50%) translate(0,0) scale(0.5)', opacity: 0 },
      { transform: `translate(-50%,-50%) translate(${spread * 0.6}px, ${lift * 0.5}px) scale(1.1)`, opacity: 1, offset: 0.18 },
      { transform: `translate(-50%,-50%) translate(${dx * 0.55 + spread}px, ${dy * 0.4 + lift}px) scale(1)`, opacity: 1, offset: 0.55 },
      { transform: `translate(-50%,-50%) translate(${dx}px, ${dy}px) scale(0.55)`, opacity: 0.2 },
    ], { duration: 640 + i * 40, delay: i * 45, easing: 'cubic-bezier(0.45, 0, 0.3, 1)', fill: 'backwards' });
    anim.onfinish = () => {
      c.remove();
      if (!landed) { landed = true; if (onLand) onLand(); }
    };
    anim.oncancel = () => c.remove();
  }
}

// ---- sparks: radial burst --------------------------------------------------
export function sparks(el, { count = 12, color = '#ffd27a', spread = 90, size = 6 } = {}) {
  if (!el || level() < 2) return;
  const c = centre(el);
  if (!c.w) return;
  const host = fxLayer();
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'mo-spark';
    s.style.left = `${c.x}px`; s.style.top = `${c.y}px`;
    s.style.background = color;
    s.style.width = s.style.height = `${size * (0.6 + Math.random() * 0.7)}px`;
    host.appendChild(s);
    const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const d = spread * (0.55 + Math.random() * 0.6);
    const anim = s.animate([
      { transform: 'translate(-50%,-50%) translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(-50%,-50%) translate(${Math.cos(ang) * d}px, ${Math.sin(ang) * d + 18}px) scale(0.2)`, opacity: 0 },
    ], { duration: 520 + Math.random() * 260, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' });
    anim.onfinish = () => s.remove();
    anim.oncancel = () => s.remove();
  }
}

// ---- ripple: soft circle from the touch point ------------------------------
export function ripple(el, e) {
  if (!el || level() < 2) return;
  const r = el.getBoundingClientRect();
  const d = document.createElement('span');
  d.className = 'mo-ripple';
  const size = Math.max(r.width, r.height) * 2.2;
  d.style.width = d.style.height = `${size}px`;
  d.style.left = `${(e ? e.clientX : r.left + r.width / 2) - r.left}px`;
  d.style.top = `${(e ? e.clientY : r.top + r.height / 2) - r.top}px`;
  el.appendChild(d);
  const anim = d.animate([
    { transform: 'translate(-50%,-50%) scale(0)', opacity: 0.32 },
    { transform: 'translate(-50%,-50%) scale(1)', opacity: 0 },
  ], { duration: 560, easing: EASE_OUT });
  anim.onfinish = () => d.remove();
}

// ---- count: springy number change ------------------------------------------
// Counts both ways (the old helper snapped on a spend, so money vanished
// without the eye seeing where), then gives the number one bounce.
export function countTo(el, from, to, dur = 520) {
  if (!el) return;
  from = Number(from) || 0; to = Number(to) || 0;
  if (from === to || level() === 0) { el.textContent = String(to); return; }
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = String(Math.round(from + (to - from) * e));
    if (p < 1) requestAnimationFrame(step);
    else { el.textContent = String(to); bump(el, to < from ? 0.9 : 1.18); }
  };
  requestAnimationFrame(step);
}
