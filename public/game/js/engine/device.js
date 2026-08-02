// Device / render-environment probe.
//
// The game is developed against desktop Chrome but ships inside an Android
// WebView (Capacitor). Those two render HTML and canvas slightly differently,
// and every difference that isn't handled here shows up only after the APK is
// built — which is exactly the class of bug that keeps getting missed.
//
// Rather than sniffing browser versions (unreliable, and wrong the moment a
// vendor ships a fix), every entry below is a direct capability test: ask the
// platform whether the specific feature works, and let the caller pick a path.
// The results are also written to <html> as classes so CSS can react without
// any per-component JS.

function testCanvasFilter() {
  try {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 2;
    const g = cv.getContext('2d');
    if (!g || !('filter' in g)) return false;
    g.filter = 'blur(2px)';
    // An engine that doesn't implement filters keeps the property at 'none'
    // instead of throwing, so the assignment silently does nothing — which is
    // precisely how an unblurred bloom pass reaches the screen as a bright
    // wash on device while looking correct on desktop.
    return g.filter !== 'none' && g.filter !== '';
  } catch (e) {
    return false;
  }
}

function testCss(prop, value) {
  try {
    return typeof CSS !== 'undefined' && CSS.supports &&
      (CSS.supports(prop, value) || CSS.supports(`-webkit-${prop}`, value));
  } catch (e) {
    return false;
  }
}

// True inside a packaged app shell (Capacitor/Cordova bridge present, an
// Android WebView UA, or a PWA launched standalone) rather than a browser tab.
function detectNative() {
  if (typeof window === 'undefined') return false;
  if (window.Capacitor || window.cordova) return true;
  const ua = navigator.userAgent || '';
  if (/\bwv\b/.test(ua)) return true;                       // Android WebView marker
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
  return !!navigator.standalone;                            // iOS home-screen app
}

export const device = {
  native: detectNative(),
  android: /Android/i.test((typeof navigator !== 'undefined' && navigator.userAgent) || ''),
  ios: /iPad|iPhone|iPod/i.test((typeof navigator !== 'undefined' && navigator.userAgent) || ''),
  touch: (typeof window !== 'undefined') &&
    (('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0),
  // ---- render capabilities the draw code actually branches on ----
  canvasFilter: testCanvasFilter(),
  backdropFilter: testCss('backdrop-filter', 'blur(4px)'),
  safeArea: testCss('padding-top', 'env(safe-area-inset-top)'),
};

// ---------------------------------------------------------------- UI scale
//
// The DOM overlay is built from clamp()-ed viewport units, which keeps it
// sane across window sizes but still drifts on the extreme aspect ratios
// phones actually report (very short landscape strips, very tall portrait).
// `--ui-scale` gives every one of those rules a single multiplier to hang
// off, computed from whichever axis is scarcer, so the whole overlay
// tightens or relaxes together instead of each cluster deciding on its own.

const UI_SCALE_MIN = 0.82;
const UI_SCALE_MAX = 1.15;

export function computeUiScale(w = window.innerWidth, h = window.innerHeight) {
  // Reference frame: a 900x520 landscape phone viewport, roughly the middle
  // of the range this game is played at.
  const byW = w / 900;
  const byH = h / 520;
  const raw = Math.min(byW, byH);
  return Math.max(UI_SCALE_MIN, Math.min(UI_SCALE_MAX, raw));
}

// Writes the capability classes and the live UI scale onto <html>. Safe to
// call repeatedly (resize / orientation change) — it only rewrites values.
export function applyDeviceProfile() {
  const el = document.documentElement;
  el.classList.toggle('is-native', device.native);
  el.classList.toggle('is-touch', device.touch);
  el.classList.toggle('no-backdrop-filter', !device.backdropFilter);
  el.classList.toggle('no-canvas-filter', !device.canvasFilter);
  el.classList.toggle('no-safe-area', !device.safeArea);
  el.style.setProperty('--ui-scale', computeUiScale().toFixed(3));
}
