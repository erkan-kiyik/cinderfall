// KOR LAB — procedural sound effects.
//
// Every sound is synthesised once at start-up into a sample buffer (noise,
// filters, pitch sweeps, envelopes, a short street slap-back) — no audio
// files. Playback is a buffer source through gain and stereo pan into a
// compressor, with distance attenuation and a voice cap per sound.
//
// The AudioContext can only start after a user gesture; `unlock()` is wired
// to the first touch / key / click and builds the buffers then.

const SR = 44100;

// --- tiny DSP kit -------------------------------------------------------------
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1; }
function biquad(x, type, f, q = 0.707) {
  const w = (2 * Math.PI * f) / SR, cw = Math.cos(w), al = Math.sin(w) / (2 * q);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; }
  else if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; }
  else { b0 = al; b1 = 0; b2 = -al; } // band-pass (0 dB peak)
  a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al;
  b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const y = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = y; x[i] = y;
  }
  return x;
}
const buf = (sec) => new Float32Array(Math.ceil(sec * SR));
// filtered noise burst with an attack and exponential decay (seconds)
function noise(sec, seed, att, dec, filt = []) {
  const x = buf(sec), r = rng(seed);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = r() * (t < att ? t / att : Math.exp(-(t - att) / dec)); }
  for (const [type, f, q] of filt) biquad(x, type, f, q);
  return x;
}
// sine whose pitch falls from f0 toward f1 with time constant tau
function thump(sec, f0, f1, tau, dec, att = 0.002) {
  const x = buf(sec); let ph = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / SR, f = f1 + (f0 - f1) * Math.exp(-t / tau);
    ph += (2 * Math.PI * f) / SR;
    x[i] = Math.sin(ph) * (t < att ? t / att : Math.exp(-(t - att) / dec));
  }
  return x;
}
// struck metal: inharmonic partials
function ping(sec, freqs, dec, seed = 1) {
  const x = buf(sec), r = rng(seed);
  const ph = freqs.map(() => r() * Math.PI);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR; let v = 0;
    for (let k = 0; k < freqs.length; k++) v += Math.sin(ph[k] + 2 * Math.PI * freqs[k] * t) * Math.exp(-t / (dec / (1 + k * 0.6))) / (1 + k * 0.5);
    x[i] = v * Math.min(1, t / 0.0008);
  }
  return x;
}
function mix(len, ...parts) {
  const x = buf(len);
  for (const [p, g = 1, at = 0] of parts) { const o = Math.round(at * SR); for (let i = 0; i < p.length && i + o < x.length; i++) x[i + o] += p[i] * g; }
  return x;
}
// street slap-back: one dull echo off the buildings
function slap(x, delay, gain, lp = 1800) {
  const d = Math.round(delay * SR), e = new Float32Array(x.length);
  for (let i = d; i < x.length; i++) e[i] = x[i - d] * gain;
  biquad(e, 'lp', lp);
  for (let i = 0; i < x.length; i++) x[i] += e[i];
  return x;
}
function norm(x, peak = 0.9) {
  let m = 0; for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
  if (m > 0) for (let i = 0; i < x.length; i++) x[i] *= peak / m;
  // soft fade at the end
  const f = Math.min(x.length, 400); for (let i = 0; i < f; i++) x[x.length - 1 - i] *= i / f;
  return x;
}

// --- the sound set -------------------------------------------------------------
export const RECIPES = {
  pistol: () => norm(slap(mix(0.5,
    [noise(0.12, 11, 0.0005, 0.018, [['hp', 900], ['lp', 7000]]), 1],
    [thump(0.2, 190, 70, 0.02, 0.05), 0.7],
    [noise(0.5, 12, 0.01, 0.09, [['lp', 1200]]), 0.25]), 0.085, 0.3)),
  rifle: () => norm(slap(mix(0.7,
    [noise(0.16, 21, 0.0004, 0.028, [['hp', 500], ['lp', 6000]]), 1],
    [thump(0.25, 160, 48, 0.025, 0.07), 0.95],
    [noise(0.06, 22, 0.0002, 0.006, [['bp', 3400, 2]]), 0.4, 0.012],
    [noise(0.7, 23, 0.02, 0.13, [['lp', 900]]), 0.35]), 0.11, 0.34)),
  shotgun: () => norm(slap(mix(1.0,
    [noise(0.3, 31, 0.0006, 0.05, [['hp', 220], ['lp', 4200]]), 1],
    [thump(0.45, 120, 32, 0.04, 0.14), 1.2],
    [noise(1.0, 32, 0.03, 0.22, [['lp', 700]]), 0.5]), 0.13, 0.38)),
  dmr: () => norm(mix(0.45,
    [noise(0.12, 41, 0.001, 0.022, [['bp', 1500, 0.8]]), 1],
    [thump(0.15, 220, 90, 0.015, 0.03), 0.5],
    [noise(0.04, 42, 0.0002, 0.004, [['bp', 4200, 3]]), 0.7, 0.03],
    [noise(0.04, 43, 0.0002, 0.005, [['bp', 2600, 3]]), 0.6, 0.075],
    [noise(0.45, 44, 0.01, 0.07, [['lp', 900]]), 0.15])),
  dry: () => norm(mix(0.06, [noise(0.03, 51, 0.0002, 0.003, [['bp', 3800, 4]]), 1], [noise(0.03, 52, 0.0002, 0.004, [['bp', 1800, 3]]), 0.5, 0.012]), 0.6),
  magOut: () => norm(mix(0.2, [noise(0.04, 61, 0.0003, 0.006, [['bp', 2600, 3]]), 1], [noise(0.12, 62, 0.002, 0.03, [['bp', 900, 1.5]]), 0.6, 0.02]), 0.6),
  magIn: () => norm(mix(0.22, [noise(0.05, 71, 0.0002, 0.008, [['bp', 2000, 2.5]]), 1], [thump(0.1, 300, 140, 0.01, 0.03), 0.6], [noise(0.04, 72, 0.0002, 0.005, [['bp', 3600, 4]]), 0.7, 0.05]), 0.7),
  charge: () => norm(mix(0.32, [noise(0.06, 81, 0.0004, 0.012, [['bp', 1500, 2]]), 0.8], [noise(0.05, 82, 0.0002, 0.006, [['bp', 3000, 3]]), 1, 0.11], [thump(0.08, 260, 120, 0.01, 0.02), 0.5, 0.11]), 0.7),
  pumpBack: () => norm(mix(0.16, [noise(0.08, 91, 0.0005, 0.016, [['bp', 1100, 1.6]]), 1], [noise(0.03, 92, 0.0002, 0.004, [['bp', 2600, 3]]), 0.6, 0.05]), 0.7),
  pumpFwd: () => norm(mix(0.16, [noise(0.06, 93, 0.0003, 0.01, [['bp', 1500, 1.8]]), 1], [thump(0.06, 240, 110, 0.008, 0.02), 0.6]), 0.75),
  shellIn: () => norm(mix(0.12, [noise(0.04, 101, 0.0003, 0.007, [['bp', 1700, 2]]), 1], [thump(0.05, 200, 120, 0.01, 0.015), 0.5]), 0.5),
  casing: () => norm(ping(0.35, [3900, 6100, 8800], 0.06, 3), 0.35),
  casing2: () => norm(ping(0.3, [4600, 7300, 10100], 0.05, 5), 0.32),
  shellDrop: () => norm(mix(0.15, [noise(0.06, 111, 0.0003, 0.012, [['bp', 700, 1.4]]), 1], [ping(0.12, [1600, 2700], 0.025, 7), 0.3]), 0.35),
  magDrop: () => norm(mix(0.3, [noise(0.08, 121, 0.0004, 0.02, [['bp', 600, 1.2]]), 1], [ping(0.25, [1100, 2900, 4300], 0.05, 9), 0.35]), 0.5),
  gunDrop: () => norm(mix(0.5, [noise(0.12, 125, 0.0005, 0.04, [['bp', 400, 1]]), 1], [ping(0.45, [700, 1900, 3100], 0.09, 11), 0.4]), 0.6),
  hit: () => norm(mix(0.2, [noise(0.12, 131, 0.0005, 0.025, [['lp', 900]]), 1], [thump(0.12, 150, 60, 0.02, 0.04), 0.8], [noise(0.03, 132, 0.0002, 0.004, [['bp', 2400, 2]]), 0.25]), 0.75),
  head: () => norm(mix(0.4, [ping(0.4, [2100, 3350, 5200], 0.08, 13), 1], [noise(0.05, 141, 0.0002, 0.006, [['hp', 2000]]), 0.4]), 0.6),
  marker: () => norm(mix(0.05, [ping(0.05, [2600], 0.012, 2), 1]), 0.3),
  kill: () => norm(mix(0.5, [ping(0.3, [1320, 2640], 0.08, 3), 0.8], [ping(0.35, [1760, 3520], 0.1, 4), 0.9, 0.09]), 0.45),
  impact: () => norm(mix(0.3, [noise(0.08, 151, 0.0003, 0.012, [['bp', 1200, 1]]), 1], [noise(0.25, 152, 0.005, 0.05, [['lp', 2400]]), 0.4, 0.01]), 0.45),
  ricochet: () => {
    const w = buf(0.32); let ph = 0;
    for (let i = 0; i < w.length; i++) { const t = i / SR, f = 1300 + 2600 * Math.exp(-t / 0.06); ph += (2 * Math.PI * f) / SR; w[i] = Math.sin(ph) * Math.exp(-t / 0.08) * Math.min(1, t / 0.004); }
    return norm(mix(0.32, [noise(0.06, 161, 0.0003, 0.008, [['hp', 1500]]), 0.8], [w, 0.5, 0.01]), 0.4);
  },
  shield: () => norm(mix(0.5, [ping(0.5, [620, 1530, 2730, 4100], 0.12, 17), 1], [noise(0.04, 171, 0.0002, 0.006, [['hp', 1800]]), 0.6]), 0.6),
  knife: () => {
    const x = buf(0.24), r = rng(181);
    for (let i = 0; i < x.length; i++) { const t = i / SR, e = Math.sin(Math.PI * Math.min(1, t / 0.2)) ** 2; x[i] = r() * e; }
    // sweep the band upward by filtering in short blocks
    const out = buf(0.24);
    for (let b = 0; b < 12; b++) {
      const s = Math.floor((b / 12) * x.length), e = Math.floor(((b + 1) / 12) * x.length);
      const seg = x.slice(s, e); biquad(seg, 'bp', 700 + b * 260, 1.4); out.set(seg, s);
    }
    return norm(out, 0.5);
  },
  knifeHit: () => norm(mix(0.2, [noise(0.08, 191, 0.0003, 0.015, [['lp', 1400]]), 1], [thump(0.1, 180, 70, 0.015, 0.03), 0.8]), 0.7),
  swap: () => norm(mix(0.25, [noise(0.12, 201, 0.01, 0.04, [['bp', 700, 0.8]]), 0.7], [noise(0.03, 202, 0.0002, 0.005, [['bp', 2400, 3]]), 1, 0.14]), 0.45),
  hurt: () => norm(mix(0.3, [thump(0.25, 90, 40, 0.04, 0.08), 1], [noise(0.2, 211, 0.001, 0.05, [['lp', 500]]), 0.6]), 0.8),
  // operator abilities
  boom: () => norm(slap(mix(1.6,
    [noise(0.4, 231, 0.001, 0.08, [['lp', 3000]]), 1],
    [thump(0.9, 90, 28, 0.08, 0.3), 1.4],
    [noise(1.5, 232, 0.04, 0.4, [['lp', 500]]), 0.7]), 0.16, 0.4)),
  bang: () => norm(mix(1.2,
    [noise(0.12, 241, 0.0005, 0.03, [['hp', 600]]), 1],
    [thump(0.3, 160, 50, 0.03, 0.1), 0.8],
    [ping(1.1, [3800, 5400], 0.5, 33), 0.25, 0.05]), 0.85),
  whoosh: () => {
    const x = buf(0.32), r = rng(251);
    for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = r() * Math.sin(Math.PI * Math.min(1, t / 0.3)) ** 2; }
    const out = buf(0.32);
    for (let b = 0; b < 10; b++) { const s0 = Math.floor((b / 10) * x.length), e = Math.floor(((b + 1) / 10) * x.length); const seg = x.slice(s0, e); biquad(seg, 'bp', 500 + b * 180, 1.1); out.set(seg, s0); }
    return norm(out, 0.6);
  },
  zap: () => {
    const x = buf(0.5); let ph = 0;
    for (let i = 0; i < x.length; i++) { const t = i / SR, f = 300 + 1500 * (1 - Math.exp(-t / 0.08)); ph += (2 * Math.PI * f) / SR; x[i] = (Math.sin(ph) > 0 ? 1 : -1) * 0.4 * Math.exp(-t / 0.18) * Math.min(1, t / 0.003); }
    biquad(x, 'lp', 3200);
    return norm(mix(0.5, [x, 1], [noise(0.3, 261, 0.002, 0.06, [['bp', 4000, 2]]), 0.35]), 0.55);
  },
  hiss: () => norm(mix(1.2, [noise(0.04, 271, 0.0003, 0.01, [['bp', 2000, 2]]), 0.6], [noise(1.2, 272, 0.05, 0.45, [['hp', 2500]]), 1, 0.03]), 0.5),
  // interface: short, soft, tonal
  uiTap: () => norm(mix(0.06, [ping(0.06, [1850], 0.012, 21), 1], [noise(0.02, 221, 0.0002, 0.003, [['bp', 3000, 3]]), 0.3]), 0.35),
  uiTab: () => norm(mix(0.05, [ping(0.05, [2400], 0.008, 22), 1]), 0.25),
  uiBack: () => norm(mix(0.07, [ping(0.07, [1250], 0.014, 23), 1], [noise(0.02, 222, 0.0002, 0.003, [['bp', 1800, 3]]), 0.3]), 0.3),
  uiConfirm: () => norm(mix(0.22, [ping(0.12, [1320, 2640], 0.03, 24), 0.8], [ping(0.14, [1980, 3960], 0.035, 25), 0.9, 0.06]), 0.4),
  uiDeny: () => norm(mix(0.18, [thump(0.16, 210, 150, 0.05, 0.05), 1], [thump(0.12, 180, 130, 0.05, 0.04), 0.8, 0.07]), 0.4),
  uiReward: () => norm(mix(0.6, [ping(0.3, [1568, 3136], 0.08, 26), 0.7], [ping(0.3, [1976, 3952], 0.09, 27), 0.7, 0.08], [ping(0.4, [2349, 4698], 0.12, 28), 0.8, 0.16]), 0.45),
  uiLevelup: () => norm(mix(0.9, [ping(0.4, [1047, 2093], 0.1, 29), 0.7], [ping(0.4, [1319, 2637], 0.1, 30), 0.7, 0.1], [ping(0.45, [1568, 3136], 0.12, 31), 0.8, 0.2], [ping(0.6, [2093, 4186], 0.18, 32), 0.9, 0.32]), 0.5),
};
const UI = { tap: 'uiTap', tab: 'uiTab', back: 'uiBack', confirm: 'uiConfirm', deny: 'uiDeny', reward: 'uiReward', levelup: 'uiLevelup' };

export class Sfx {
  constructor() {
    this.ctx = null; this.buf = {}; this.voices = new Map(); this.muted = false;
    this.vols = { master: 0.8, sfx: 1, ui: 0.7, music: 0.6 };
    this.ear = { x: 0, y: 0 };
  }

  // call from a user gesture
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const c = this.ctx;
    this.comp = c.createDynamicsCompressor();
    this.comp.threshold.value = -14; this.comp.ratio.value = 6; this.comp.attack.value = 0.002; this.comp.release.value = 0.15;
    // buses: game sounds through the compressor, the interface beside it
    this.master = c.createGain(); this.master.gain.value = this.vols.master;
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.vols.sfx;
    this.uiBus = c.createGain(); this.uiBus.gain.value = this.vols.ui;
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.vols.music * 0.55; this.musicBus.connect(this.master);
    this.sfxBus.connect(this.comp); this.comp.connect(this.master);
    this.uiBus.connect(this.master); this.master.connect(c.destination);
    // synthesise in small slices so the first frames stay smooth
    const names = Object.keys(RECIPES);
    const next = () => {
      const t0 = performance.now();
      while (names.length && performance.now() - t0 < 6) {
        const n = names.shift(), data = RECIPES[n]();
        const b = c.createBuffer(1, data.length, SR); b.copyToChannel(data, 0);
        this.buf[n] = b;
      }
      if (names.length) setTimeout(next, 0);
    };
    next();
  }

  setVolumes(v) {
    this.vols = { ...this.vols, ...v };
    if (!this.ctx) return;
    this.master.gain.value = this.vols.master; this.sfxBus.gain.value = this.vols.sfx; this.uiBus.gain.value = this.vols.ui;
    this.musicBus.gain.value = this.vols.music * 0.55;
  }
  // interface sound by short name (tap, tab, back, confirm, deny, reward, levelup)
  ui(name, vol = 1) { if (UI[name]) this.play(UI[name], null, null, { vol, cap: 3, bus: 'ui' }); }

  // play at a world position (x, y); the listener is `ear` (the camera)
  play(name, x = null, y = null, { vol = 1, rate = 1, cap = 4, bus = 'sfx' } = {}) {
    const c = this.ctx, b = this.buf[name];
    if (!c || !b || this.muted || c.state !== 'running') return;
    let g = vol, pan = 0;
    if (x !== null) {
      const dx = x - this.ear.x, dy = y - this.ear.y, d = Math.hypot(dx, dy);
      g *= Math.max(0, 1 - d / 900) ** 1.5;
      if (g < 0.02) return;
      pan = Math.max(-0.85, Math.min(0.85, dx / 320));
    }
    const live = this.voices.get(name) || 0;
    if (live >= cap) return;
    this.voices.set(name, live + 1);
    const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = rate;
    const gn = c.createGain(); gn.gain.value = g;
    let node = gn;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; gn.connect(p); node = p; }
    s.connect(gn); node.connect(bus === 'ui' ? this.uiBus : this.sfxBus);
    s.onended = () => this.voices.set(name, Math.max(0, (this.voices.get(name) || 1) - 1));
    s.start();
  }
}
