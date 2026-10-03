// Shared "currency gained" feedback: a scale bump + glow flash on the
// balance pill, a short screen-space particle burst fanning out from its
// icon, and a collection chime — used anywhere the scrap balance increases
// (HUD readout, header pill, achievement/ad/trade claims). Centralized here
// so every currency gain in the game feels and
// looks the same, and so the burst stays a handful of DOM nodes on cheap
// compositor-only CSS animations (mobile-safe, no canvas/particle-sim cost).

let fxLayer = null;
function getLayer() {
  if (fxLayer && document.body.contains(fxLayer)) return fxLayer;
  fxLayer = document.createElement('div');
  fxLayer.id = 'currency-fx-layer';
  document.body.appendChild(fxLayer);
  return fxLayer;
}

import { paintScrap } from '../art/currency.js';

// Coin sprite for the burst, painted once from the same painter as every
// other scrap icon so the flying tokens are the currency, not dots.
let coinUrl = null;
function coinSprite() {
  if (coinUrl) return coinUrl;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 48;
  paintScrap(cv.getContext('2d'), 48, 48);
  coinUrl = cv.toDataURL('image/png');
  return coinUrl;
}

// Tokens pop out of the pill, hang for a beat, then get pulled back into it —
// the "collected" read, rather than sparks flying away and vanishing.
function spawnBurst(el) {
  if (!el || !el.getBoundingClientRect) return;
  const rect = el.getBoundingClientRect();
  if (!rect.width && !rect.height) return;
  const icon = el.querySelector && el.querySelector('.cur-icon');
  const r2 = icon ? icon.getBoundingClientRect() : rect;
  const cx = r2.left + r2.width / 2, cy = r2.top + r2.height / 2;
  const count = 7;
  const layer = getLayer();
  const url = coinSprite();
  for (let i = 0; i < count; i++) {
    const p = document.createElement('img');
    p.className = 'cur-fx-coin';
    p.src = url; p.alt = '';
    const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const dist = 26 + Math.random() * 22;
    p.style.left = `${cx}px`; p.style.top = `${cy}px`;
    p.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(ang) * dist + 10}px`);
    p.style.setProperty('--rot', `${(Math.random() - 0.5) * 240}deg`);
    p.style.animationDelay = `${i * 22}ms`;
    layer.appendChild(p);
    const cleanup = () => p.remove();
    p.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, 1200);
  }
}

// Triggers the full "gained" feedback on a pill/readout element. `audio`, if
// passed, plays the collection chime. Safe to call rapidly — the reflow trick
// makes the CSS animation restart cleanly even mid-flight.
//
// The old signature took a `kind` ('para' | 'diamond'); with one currency
// there is nothing to switch on, and callers that still pass a second
// argument are harmlessly ignored.
export function playCurrencyGain(el, _kind, audio) {
  if (!el) return;
  el.classList.remove('bump', 'cur-flash');
  void el.offsetWidth;
  el.classList.add('bump', 'cur-flash');
  spawnBurst(el);
  if (audio && audio.coinGain) audio.coinGain();
}

// Eased count-up tween for a text node showing a currency total. Cheap
// (a handful of rAF ticks over ~450ms) and only ever runs on the small
// deltas a kill/claim/purchase grants — never on the initial paint.
export function animateCount(el, from, to, dur = 450) {
  if (!el) return;
  from = Number(from) || 0; to = Number(to) || 0;
  if (to === from) { el.textContent = String(to); return; }
  const start = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = String(Math.round(from + (to - from) * eased));
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = String(to);
  };
  requestAnimationFrame(step);
}
