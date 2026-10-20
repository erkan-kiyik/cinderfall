// KOR — music, synthesised live: no files to download.
//
// A small step sequencer on the Web Audio clock (look-ahead scheduling, so
// timing does not depend on frame rate) plays dark synthwave in the game's
// colours: pads and a delayed arpeggio in the lobby; in a mission a driving
// bass and drums whose density follows how hot the fight is (`intensity`
// 0..1). Tracks cross-fade. Everything goes to the music bus of the sound
// system, so the Music volume in Settings applies.

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
// chords as MIDI roots + minor/major triads, one per bar
const TRACKS = {
  lobby: { bpm: 84, chords: [[57, 'm'], [53, 'M'], [48, 'M'], [55, 'M']], drums: 0.35, bass: 'slow', arp: true, pad: 0.16 },
  mission: { bpm: 112, chords: [[50, 'm'], [46, 'M'], [48, 'M'], [45, 'm']], drums: 1, bass: 'drive', arp: false, pad: 0.1 },
};
const triad = ([root, q]) => [root, root + (q === 'm' ? 3 : 4), root + 7];

export class Music {
  constructor(sfx) {
    this.sfx = sfx; this.want = null; this.cur = null; this.intensity = 0;
    this.step = 0; this.nextT = 0; this.timer = null;
  }
  get ctx() { return this.sfx.ctx; }

  // ask for a track ('lobby', 'mission' or null for silence); starts once audio is unlocked
  play(name) {
    this.want = name;
    if (!this.timer) this.timer = setInterval(() => this.tick(), 50);
  }
  setIntensity(k) { this.intensity = Math.max(0, Math.min(1, k)); }

  setup() {
    const c = this.ctx;
    this.bus = this.sfx.musicBus;
    // a shared echo for the arpeggio and the lead
    this.delay = c.createDelay(1); this.fb = c.createGain(); this.wet = c.createGain();
    this.fb.gain.value = 0.38; this.wet.gain.value = 0.32;
    this.delay.connect(this.fb); this.fb.connect(this.delay); this.delay.connect(this.wet); this.wet.connect(this.bus);
    // noise for drums
    const n = c.createBuffer(1, c.sampleRate, c.sampleRate), d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = n;
    this.ready = true;
  }

  tick() {
    const c = this.ctx;
    if (!c || c.state !== 'running' || !this.sfx.musicBus) return;
    if (!this.ready) this.setup();
    // switch tracks with a cross-fade
    if (this.want !== (this.cur && this.cur.name)) {
      const now = c.currentTime;
      if (this.cur) { const g = this.cur.gain.gain; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0, now + 1.4); const old = this.cur.gain; setTimeout(() => old.disconnect(), 1600); }
      this.cur = null;
      if (this.want && TRACKS[this.want]) {
        const gain = c.createGain(); gain.gain.value = 0; gain.gain.linearRampToValueAtTime(1, now + 1.6); gain.connect(this.bus);
        this.cur = { name: this.want, T: TRACKS[this.want], gain };
        this.step = 0; this.nextT = now + 0.1;
        this.delay.delayTime.value = 60 / TRACKS[this.want].bpm * 0.75;
      }
    }
    if (!this.cur) return;
    const T = this.cur.T, sixteenth = 60 / T.bpm / 4;
    while (this.nextT < c.currentTime + 0.25) { this.schedule(this.step, this.nextT, T); this.step++; this.nextT += sixteenth; }
  }

  // one sixteenth note of the current track at time `t`
  schedule(step, t, T) {
    const s16 = step % 16, bar = Math.floor(step / 16), chord = T.chords[bar % T.chords.length], tones = triad(chord);
    const hot = this.intensity, out = this.cur.gain, len = 60 / T.bpm / 4;
    // pad: the chord, swelling in each bar
    if (s16 === 0) for (const n of tones) this.pad(t, NOTE(n), len * 16, T.pad, out);
    // drums
    if (T.drums >= 1) {
      if (s16 % 4 === 0) this.kick(t, 0.9, out);
      if (s16 === 4 || s16 === 12) this.snare(t, 0.35 + hot * 0.2, out);
      if (s16 % 2 === 1 || hot > 0.4) this.hat(t, (s16 % 2 ? 0.12 : 0.06) * (0.6 + hot), out);
    } else {
      if (s16 === 0 || s16 === 10) this.kick(t, 0.5 * T.drums, out);
      if (s16 % 4 === 2) this.hat(t, 0.05, out);
    }
    // bass
    const root = NOTE(chord[0] - 12);
    if (T.bass === 'drive') { if (s16 % 2 === 0 || hot > 0.5) this.bass(t, s16 % 8 === 6 ? root * 2 : root, len * 0.9, 0.26, out); }
    else if (s16 === 0 || s16 === 6 || s16 === 10) this.bass(t, root, len * 3, 0.2, out);
    // arpeggio (lobby) / lead stabs once the fight heats up (mission)
    if (T.arp && s16 % 2 === 0) { const n = tones[[0, 1, 2, 1, 2, 0, 1, 2][(s16 / 2) % 8]] + 12; this.pluck(t, NOTE(n), len * 1.6, 0.08, out); }
    if (!T.arp && hot > 0.55 && (s16 === 0 || s16 === 3 || s16 === 6 || s16 === 10)) this.pluck(t, NOTE(tones[s16 % 3] + 24), len * 1.2, 0.07 * hot, out);
  }

  // --- voices ---------------------------------------------------------------------
  env(t, gain, a, d, peak) { const g = gain.gain; g.setValueAtTime(0.0001, t); g.linearRampToValueAtTime(peak, t + a); g.exponentialRampToValueAtTime(0.0001, t + a + d); }
  pad(t, f, dur, vol, out) {
    const c = this.ctx, g = c.createGain(), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1300, t + dur * 0.5); lp.frequency.linearRampToValueAtTime(600, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    for (const det of [-7, 7]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + 0.05); }
    lp.connect(g); g.connect(out);
  }
  bass(t, f, dur, vol, out) {
    const c = this.ctx, o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.Q.value = 6;
    lp.frequency.setValueAtTime(900 + this.intensity * 700, t); lp.frequency.exponentialRampToValueAtTime(160, t + dur);
    this.env(t, g, 0.005, dur, vol);
    o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  pluck(t, f, dur, vol, out) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.value = f;
    this.env(t, g, 0.004, dur, vol);
    o.connect(g); g.connect(out); g.connect(this.delay); o.start(t); o.stop(t + dur + 0.05);
  }
  kick(t, vol, out) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    this.env(t, g, 0.002, 0.28, vol);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.32);
  }
  noiseHit(t, vol, type, freq, dur, out) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; f.type = type; f.frequency.value = freq;
    this.env(t, g, 0.001, dur, vol);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  snare(t, vol, out) { this.noiseHit(t, vol, 'bandpass', 1800, 0.16, out); }
  hat(t, vol, out) { this.noiseHit(t, vol, 'highpass', 7500, 0.04, out); }
}
