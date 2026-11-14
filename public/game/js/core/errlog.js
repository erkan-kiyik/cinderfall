// KOR — the error log (docs §10.27). With no crash reporting service (and no
// data leaving the phone), errors the game hits are kept on the device: the
// last twenty, with when, where and the first lines of the stack. Settings >
// Privacy shows them, copies them for a bug report, and clears them.
const KEY = 'kor.errors.v1', MAX = 20;
let build = '?';

function read() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
function write(a) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(-MAX))); } catch {} }

export function logError(msg, where = '', stack = '') {
  const a = read(), m = String(msg || 'error').slice(0, 300);
  const last = a[a.length - 1];
  // the same error again within a second: count it, do not fill the log
  if (last && last.m === m && Date.now() - last.t < 1000) { last.n = (last.n || 1) + 1; write(a); return; }
  a.push({ t: Date.now(), b: build, m, w: String(where).slice(0, 160), s: String(stack || '').split('\n').slice(0, 6).join('\n').slice(0, 600) });
  write(a);
}
export function errors() { return read(); }
export function clearErrors() { write([]); }
export function errorsText() {
  return read().map((e) => `${new Date(e.t).toISOString().slice(0, 19).replace('T', ' ')} · build ${e.b}${e.n > 1 ? ` · x${e.n}` : ''}\n${e.m}${e.w ? `\n  at ${e.w}` : ''}${e.s ? `\n${e.s}` : ''}`).join('\n\n');
}
export function installErrorLog(version) {
  build = version || '?';
  addEventListener('error', (e) => logError(e.message, e.filename ? `${e.filename.split('/').slice(-2).join('/')}:${e.lineno}:${e.colno}` : '', e.error?.stack));
  addEventListener('unhandledrejection', (e) => { const r = e.reason; logError(r?.message || r, '', r?.stack); });
}
