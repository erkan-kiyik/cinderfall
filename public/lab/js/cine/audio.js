// KOR — cinematics: sound, built live with Web Audio, no files
// (docs/KOR_STORY_CINEMATIC.md §5.11).
//
// Beds that run under a shot and are faded per shot:
//   rain      three noise layers filtered for tin roof, asphalt and puddles
//   furnace   a low roar (filtered noise + a slow sub)
//   city      distant traffic, a low wide band
//   hum       a bulb's 100 Hz buzz with harmonics
//   drone     a cello-like low pad for the title
// One-shots, placed by the scene's cue sheet: clack, siren, uav, step,
// radio (squelch on/off), cloth, door, hiss (the furnace dying), boom,
// crackle, flare.
export class CineAudio {
  constructor(ctx, dest) {
    this.c = ctx; this.out = ctx.createGain(); this.out.gain.value = 0.9; this.out.connect(dest);
    const N = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(2, N, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = this.noise.getChannelData(ch); for (let i = 0; i < N; i++) d[i] = Math.random() * 2 - 1; }
    // brown-ish noise for rumbles
    this.brown = ctx.createBuffer(1, N, ctx.sampleRate);
    { const d = this.brown.getChannelData(0); let last = 0; for (let i = 0; i < N; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; } }
    this.verbStreet = this.reverb(2.4, 2.2);
    this.verbRoom = this.reverb(0.6, 3.5);
    this.beds = {};
  }
  get now() { return this.c.currentTime; }

  reverb(sec, decay) {
    const c = this.c, len = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    const v = c.createConvolver(); v.buffer = b;
    const g = c.createGain(); g.gain.value = 0.35; v.connect(g); g.connect(this.out);
    return v;
  }
  src(buf = this.noise, loop = true) { const s = this.c.createBufferSource(); s.buffer = buf; s.loop = loop; return s; }
  filt(type, f, q = 0.7) { const b = this.c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
  gain(v = 0) { const g = this.c.createGain(); g.gain.value = v; return g; }
  pan(p) { const n = this.c.createStereoPanner(); n.pan.value = p; return n; }

  // --- beds --------------------------------------------------------------------------------
  bed(name) {
    if (this.beds[name]) return this.beds[name];
    const c = this.c, G = this.gain(0); G.connect(this.out);
    const parts = [];
    const chain = (buf, nodes, level) => { const s = this.src(buf); let n = s; for (const x of nodes) { n.connect(x); n = x; } const g = this.gain(level); n.connect(g); g.connect(G); s.start(this.now + Math.random() * 0.05, Math.random() * 1.5); parts.push(s); return g; };
    if (name === 'rain') {
      chain(this.noise, [this.filt('highpass', 2800), this.filt('lowpass', 9000)], 0.35);     // fine hiss
      chain(this.noise, [this.filt('bandpass', 1200, 0.6)], 0.22);                           // asphalt
      const tin = chain(this.noise, [this.filt('bandpass', 4200, 2.2)], 0.0);               // tin roof (per shot)
      this.tin = tin;
      chain(this.brown, [this.filt('lowpass', 300)], 0.25);                                 // weight
    } else if (name === 'furnace') {
      chain(this.brown, [this.filt('lowpass', 140, 0.9)], 0.9);
      chain(this.noise, [this.filt('bandpass', 380, 0.5)], 0.06);
      const o = c.createOscillator(); o.frequency.value = 38; const og = this.gain(0.16); o.connect(og); og.connect(G); o.start(); parts.push(o);
      const lfo = c.createOscillator(); lfo.frequency.value = 0.23; const lg = this.gain(0.08); lfo.connect(lg); lg.connect(og.gain); lfo.start(); parts.push(lfo);
    } else if (name === 'city') {
      chain(this.brown, [this.filt('lowpass', 420), this.filt('highpass', 50)], 0.5);
      chain(this.noise, [this.filt('bandpass', 700, 0.3)], 0.03);
    } else if (name === 'hum') {
      for (const [f, a] of [[100, 0.05], [200, 0.025], [300, 0.012], [1200, 0.004]]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const g = this.gain(a); const lp = this.filt('lowpass', 1800); o.connect(lp); lp.connect(g); g.connect(G); o.start(); parts.push(o); }
    } else if (name === 'drone') {
      for (const [f, d] of [[55, -6], [55, 7], [82.4, 3], [110, -4]]) {
        const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d;
        const lp = this.filt('lowpass', 380, 0.8), g = this.gain(0.06);
        o.connect(lp); lp.connect(g); g.connect(G); g.connect(this.verbStreet); o.start(); parts.push(o);
      }
    }
    return (this.beds[name] = { G, parts });
  }
  // fade a bed to `level` over `sec`
  level(name, level, sec = 0.6) {
    const b = this.bed(name), g = b.G.gain, n = this.now;
    g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); g.linearRampToValueAtTime(level, n + Math.max(0.01, sec));
  }
  tinRoof(level, sec = 0.5) { if (!this.tin) return; const g = this.tin.gain, n = this.now; g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); g.linearRampToValueAtTime(level, n + sec); }

  stop(sec = 0.6) {
    const n = this.now;
    this.out.gain.cancelScheduledValues(n); this.out.gain.setValueAtTime(this.out.gain.value, n); this.out.gain.linearRampToValueAtTime(0, n + sec);
    setTimeout(() => { for (const b of Object.values(this.beds)) for (const p of b.parts) { try { p.stop(); } catch { /* already stopped */ } } this.out.disconnect(); }, sec * 1000 + 100);
  }

  // --- one-shots -------------------------------------------------------------------------------
  burst(at, dur, { type = 'bandpass', f = 1000, q = 1, vol = 0.5, pan = 0, attack = 0.002, buf = this.noise, verb = null, sweep = null } = {}) {
    const s = this.src(buf, false), fl = this.filt(type, f, q), g = this.gain(0), p = this.pan(pan);
    if (sweep) { fl.frequency.setValueAtTime(f, at); fl.frequency.exponentialRampToValueAtTime(sweep, at + dur); }
    s.connect(fl); fl.connect(g); g.connect(p); p.connect(this.out); if (verb) p.connect(verb);
    g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(vol, at + attack); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    s.start(at, Math.random() * 1.5); s.stop(at + dur + 0.05);
  }
  tone(at, dur, f0, f1, { vol = 0.3, type = 'sine', pan = 0, verb = null } = {}) {
    const o = this.c.createOscillator(), g = this.gain(0), p = this.pan(pan);
    o.type = type; o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), at + dur);
    o.connect(g); g.connect(p); p.connect(this.out); if (verb) p.connect(verb);
    g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(vol, at + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.start(at); o.stop(at + dur + 0.05);
  }

  cue(name, o = {}) {
    const n = this.now + (o.delay || 0), pan = o.pan || 0, v = o.vol ?? 1;
    switch (name) {
      case 'clack': // a floodlight's breaker, far
        this.burst(n, 0.09, { f: 1800, q: 3, vol: 0.5 * v, pan, verb: this.verbStreet });
        this.tone(n, 0.25, 120, 60, { vol: 0.25 * v, pan, verb: this.verbStreet });
        break;
      case 'step': { // a boot: heel, then the roll; wet adds a splash
        const wet = o.wet ?? 0.6;
        this.burst(n, 0.06, { type: 'lowpass', f: 600, vol: 0.32 * v, pan });
        this.burst(n + 0.04, 0.12, { f: 2200, q: 0.8, vol: 0.12 * v * wet, pan, verb: o.room ? this.verbRoom : this.verbStreet });
        break;
      }
      case 'radio': { // squelch: a short burst of band-limited hiss and a click
        this.burst(n, 0.16, { f: 2400, q: 1.6, vol: 0.18 * v, pan });
        this.tone(n, 0.03, 1700, 1700, { vol: 0.08 * v, type: 'square', pan });
        break;
      }
      case 'siren': { // far two-tone, moving across, through the street reverb
        const o2 = this.c.createOscillator(), g = this.gain(0), p = this.pan(-0.6), lp = this.filt('lowpass', 1400);
        o2.type = 'triangle';
        for (let i = 0; i < 8; i++) { o2.frequency.setValueAtTime(i % 2 ? 640 : 780, n + i * 0.55); }
        o2.connect(lp); lp.connect(g); g.connect(p); p.connect(this.verbStreet); p.connect(this.out);
        g.gain.setValueAtTime(0.0001, n); g.gain.linearRampToValueAtTime(0.03 * v, n + 1.2); g.gain.linearRampToValueAtTime(0.0001, n + 4.4);
        p.pan.linearRampToValueAtTime(0.7, n + 4.4);
        o2.start(n); o2.stop(n + 4.5);
        break;
      }
      case 'uav': { // a small drone passing: buzz with doppler
        const o2 = this.c.createOscillator(), g = this.gain(0), p = this.pan(-0.8), bp = this.filt('bandpass', 900, 2);
        o2.type = 'sawtooth'; o2.frequency.setValueAtTime(230, n); o2.frequency.linearRampToValueAtTime(205, n + 2.2);
        o2.connect(bp); bp.connect(g); g.connect(p); p.connect(this.out);
        g.gain.setValueAtTime(0.0001, n); g.gain.linearRampToValueAtTime(0.09 * v, n + 1.0); g.gain.linearRampToValueAtTime(0.0001, n + 2.4);
        p.pan.linearRampToValueAtTime(0.8, n + 2.4);
        o2.start(n); o2.stop(n + 2.5);
        break;
      }
      case 'cloth': this.burst(n, 0.35, { f: 1500, q: 0.5, vol: 0.12 * v, attack: 0.08, pan, sweep: 3000 }); break;
      case 'nail': this.tone(n, 0.08, 2600, 2400, { vol: 0.05 * v, type: 'triangle', pan }); break;
      case 'door': // a heavy steel door
        this.tone(n, 0.5, 340, 290, { vol: 0.05 * v, type: 'sawtooth', pan, verb: this.verbStreet });
        this.burst(n + 0.45, 0.25, { type: 'lowpass', f: 300, vol: 0.4 * v, pan, verb: this.verbStreet });
        break;
      case 'hiss': this.burst(n, o.dur || 2.4, { type: 'highpass', f: 3000, vol: 0.12 * v, attack: 0.3, sweep: 900 }); break;
      case 'flare': this.burst(n, o.dur || 4, { f: 3200, q: 0.5, vol: 0.05 * v, attack: 0.05, pan }); break;
      case 'boom': // the title hit: sub drop and a dark crack
        this.tone(n, 3.2, 62, 28, { vol: 0.5 * v, verb: this.verbStreet });
        this.burst(n, 1.4, { type: 'lowpass', f: 900, vol: 0.35 * v, buf: this.brown, verb: this.verbStreet, sweep: 120 });
        break;
      case 'crackle': for (let i = 0; i < (o.n || 14); i++) this.burst(n + Math.random() * (o.dur || 3), 0.015 + Math.random() * 0.02, { f: 2500 + Math.random() * 3000, q: 4, vol: (0.05 + Math.random() * 0.08) * v, pan: Math.random() * 0.6 - 0.3 }); break;
      case 'megaphone': // an unintelligible far voice: formant-filtered pulses
        for (let i = 0; i < 6; i++) this.burst(n + i * 0.32 + Math.random() * 0.1, 0.22, { f: 900 + Math.random() * 500, q: 5, vol: 0.05 * v, pan: -0.4, verb: this.verbStreet });
        break;
      case 'paper': this.burst(n, 0.4, { f: 4000, q: 0.4, vol: 0.05 * v, attack: 0.05, pan }); break;
      case 'car': { // a car passing above, muffled
        const s = this.src(this.brown, false), lp = this.filt('lowpass', 180), g = this.gain(0);
        s.connect(lp); lp.connect(g); g.connect(this.out);
        g.gain.setValueAtTime(0.0001, n); g.gain.linearRampToValueAtTime(0.5 * v, n + 1.2); g.gain.linearRampToValueAtTime(0.0001, n + 3);
        s.start(n); s.stop(n + 3.1);
        break;
      }
      case 'buzzphone': for (let i = 0; i < 3; i++) this.tone(n + i * 0.9, 0.45, 165, 165, { vol: 0.06 * v, type: 'square' }); break;
      default: break;
    }
  }
}
