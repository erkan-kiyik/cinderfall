// Shared "currency gained" feedback: a scale bump + glow flash on the
// balance pill, a short screen-space particle burst fanning out from its
// icon, and a distinct collection chime — used anywhere a Para or Diamond
// balance increases (HUD readout, header pills, achievement/ad/purchase
// claims). Centralized here so every currency gain in the game feels and
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

const PARA_COLORS = ['#e0bd77', '#b7d47f', '#f6e7ba'];
const DIAMOND_COLORS = ['#8fe0ff', '#bdf3ff', '#5fd0ee'];

function spawnBurst(el, kind) {
  if (!el || !el.getBoundingClientRect) return;
  const rect = el.getBoundingClientRect();
  if (!rect.width && !rect.height) return;
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  const colors = kind === 'diamond' ? DIAMOND_COLORS : PARA_COLORS;
  const count = kind === 'diamond' ? 8 : 6;
  const layer = getLayer();
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'cur-fx-particle';
    const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const dist = 20 + Math.random() * 18;
    p.style.left = `${cx}px`; p.style.top = `${cy}px`;
    p.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
    p.style.background = colors[i % colors.length];
    p.style.color = colors[i % colors.length];
    layer.appendChild(p);
    const cleanup = () => p.remove();
    p.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, 900);
  }
  if (kind === 'diamond') {
    const burst = document.createElement('span');
    burst.className = 'cur-fx-lightburst';
    burst.style.left = `${cx}px`; burst.style.top = `${cy}px`;
    layer.appendChild(burst);
    const cleanup = () => burst.remove();
    burst.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, 700);
  }
}

// Triggers the full "gained" feedback on a pill/readout element. `kind` is
// 'para' or 'diamond'. `audio`, if passed, plays the matching collection
// chime (coinGain / gemGain). Safe to call rapidly — the reflow trick makes
// the CSS animation restart cleanly even mid-flight.
export function playCurrencyGain(el, kind, audio) {
  if (!el) return;
  el.classList.remove('bump', 'cur-flash');
  void el.offsetWidth;
  el.classList.add('bump', 'cur-flash');
  spawnBurst(el, kind);
  if (audio) {
    if (kind === 'diamond') { if (audio.gemGain) audio.gemGain(); }
    else if (audio.coinGain) audio.coinGain();
  }
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
