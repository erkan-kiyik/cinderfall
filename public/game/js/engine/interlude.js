// Between-stage interlude.
//
// Sector 9 told its story entirely through recovered paper (see game/intel.js)
// — which the player reads in a menu, long after the fight. Nothing spoke to
// the operator *during* a run. This is the other half: a short canvas
// cinematic between stages where somebody talks directly to you.
//
// The somebody is MOTH: a scavenged recon drone with one working eye, a bent
// antenna and a hull full of dents, which has attached itself to the operator
// and has opinions about the assignment. It is the game's only voice, and it
// only ever gets a few seconds at a time — the interlude is deliberately
// shorter than the patience of someone who has just cleared a stage.
//
// Beats, in order:
//   0.00  black + a signal-lock sweep across the scanline field
//   0.30  the eye wakes out of the dark, iris ring spinning up
//   0.60  the hull fades in around it, rotors blurring, antenna twitching
//   0.95  MOTH's line types out under the drone
//   2.45  the stage stamp lands
//   3.10  earliest hand-off
//
// Always skippable — the second time you see a line it is just latency.
// Nothing here can block the campaign: run() resolves on its own timer even
// if drawing throws (see the try/catch in tick), because a cosmetic
// interstitial must never be able to strand a player between stages.

import { t } from './i18n.js';

const BG = '#07090c';
const MIN_RUN = 3.1;      // seconds before it will hand off
const FADE = 0.34;        // seconds of fade-out into the next stage
const TYPE_START = 0.95;  // when the line starts typing
const TYPE_CPS = 42;      // characters per second

// How many lines exist per bracket in the dictionaries. Brackets escalate:
// early MOTH is briskly professional, and the further the campaign runs the
// less it pretends this is a normal job.
const BRACKETS = [
  { max: 4,        key: 'early',  lines: 4 },
  { max: 9,        key: 'mid',    lines: 4 },
  { max: 19,       key: 'late',   lines: 4 },
  { max: Infinity, key: 'deep',   lines: 4 },
];

// Boss stages get their own set — being told "something big is moving" reads
// very differently from the between-block chatter.
const BOSS_LINES = 3;

function bracketFor(stage) {
  for (const b of BRACKETS) if (stage <= b.max) return b;
  return BRACKETS[BRACKETS.length - 1];
}

// Deterministic per-stage pick, so a given stage always greets you with the
// same line — a player who dies and replays stage 7 hears stage 7's line, and
// the run reads as authored rather than shuffled.
function lineFor(stage, isBoss) {
  if (isBoss) {
    const i = Math.floor(stage / 5) % BOSS_LINES;
    return t(`moth.boss.${i}`);
  }
  const b = bracketFor(stage);
  const i = stage % b.lines;
  return t(`moth.${b.key}.${i}`);
}

export class Interlude {
  // `canvas` is a full-bleed canvas in the interlude overlay.
  constructor(canvas) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.reset(1, false);
    this._skip = () => this.skip();
  }

  reset(stage, isBoss) {
    this.stage = stage;
    this.isBoss = !!isBoss;
    this.line = '';
    this.t = 0;
    this.fadeT = 0;
    this.done = false;
    this.skipped = false;
    this._raf = 0;
    this._last = 0;
  }

  skip() {
    if (this.done || this.skipped) return;
    this.skipped = true;
    // jump to just before the hand-off rather than cutting instantly, so the
    // transition still reads as deliberate
    this.t = Math.max(this.t, MIN_RUN);
  }

  // Resolves once the interlude has faded out. `stage` is the stage being
  // entered; `isBoss` selects the boss line set.
  run(stage, isBoss) {
    this.reset(stage, isBoss);
    // Resolved through t() at play time rather than construction, so a
    // language switch mid-run picks up the new dictionary.
    this.line = lineFor(stage, isBoss) || '';
    window.addEventListener('pointerdown', this._skip, { passive: true });
    window.addEventListener('keydown', this._skip);
    return new Promise((resolve) => {
      this._last = performance.now();
      const tick = (now) => {
        // Same clamp as the boot intro: a rAF timestamp can land before the
        // performance.now() captured here, and a negative dt drives `t` below
        // zero and NaNs the easing curves.
        const dt = Math.max(0, Math.min(0.05, (now - this._last) / 1000));
        this._last = now;
        this.update(dt);
        try {
          this.draw();
        } catch (e) {
          // A cosmetic interstitial must never strand the campaign: if
          // drawing fails, stop drawing and let the timer finish the beat.
          this.done = true;
        }
        if (this.done) {
          this.destroy();
          resolve();
          return;
        }
        this._raf = requestAnimationFrame(tick);
      };
      this._raf = requestAnimationFrame(tick);
    });
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('pointerdown', this._skip);
    window.removeEventListener('keydown', this._skip);
  }

  update(dt) {
    this.t += dt;
    if (this.t >= MIN_RUN) {
      this.fadeT += dt;
      if (this.fadeT >= FADE) this.done = true;
    }
  }

  draw() {
    const g = this.g;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(1, window.innerWidth || 1);
    const H = Math.max(1, window.innerHeight || 1);
    if (this.cv.width !== W * dpr || this.cv.height !== H * dpr) {
      this.cv.width = W * dpr; this.cv.height = H * dpr;
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = BG;
    g.fillRect(0, 0, W, H);

    const t = Math.max(0, this.t);
    const cx = W / 2;
    // Sized off the shorter axis so the composition survives both a phone in
    // portrait and a desktop window, same rule as the boot intro.
    const u = Math.min(W, H) / 100;
    // The drone sits above centre so the typed line has room under it without
    // either element drifting into the safe-area notch.
    const cy = H * 0.42;

    // ---- signal-lock sweep: a bright band crossing the field once ----
    if (t < 0.5) {
      const k = t / 0.5;
      const y = k * H;
      g.save();
      g.globalCompositeOperation = 'lighter';
      const grad = g.createLinearGradient(0, y - 40 * u * 0.1, 0, y + 40 * u * 0.1);
      grad.addColorStop(0, 'rgba(120,150,190,0)');
      grad.addColorStop(0.5, `rgba(150,180,220,${0.35 * (1 - k)})`);
      grad.addColorStop(1, 'rgba(120,150,190,0)');
      g.fillStyle = grad;
      g.fillRect(0, y - 4 * u, W, 8 * u);
      g.restore();
    }

    // ---- scanline field, always on, very faint ----
    g.save();
    g.globalAlpha = 0.05;
    g.fillStyle = '#8fb2d8';
    for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    g.restore();

    this.drawDrone(g, cx, cy, u, t);
    this.drawLine(g, cx, cy, u, t, W);
    this.drawStamp(g, cx, cy, u, t);

    // ---- fade out ----
    if (this.fadeT > 0) {
      g.fillStyle = `rgba(7,9,12,${Math.min(1, this.fadeT / FADE)})`;
      g.fillRect(0, 0, W, H);
    }
  }

  // MOTH itself: a dented shell, one amber eye, blurred rotors, a bent
  // antenna that twitches when it talks. Painted procedurally — it is a
  // handful of shapes and it animates every frame, so baking a sprite for it
  // would cost more than it saves.
  drawDrone(g, cx, cy, u, t) {
    const wake = Math.min(1, Math.max(0, (t - 0.3) / 0.45));   // eye
    const body = Math.min(1, Math.max(0, (t - 0.6) / 0.5));    // hull
    if (wake <= 0) return;

    // idle hover — a slow bob plus a shallow tilt, so it never sits still
    const bob = Math.sin(t * 2.1) * 1.4 * u * 0.3;
    const tilt = Math.sin(t * 1.3) * 0.05;
    const talking = t > TYPE_START && t < TYPE_START + this.line.length / TYPE_CPS;

    g.save();
    g.translate(cx, cy + bob);
    g.rotate(tilt);

    const R = 11 * u;         // hull half-width

    if (body > 0) {
      g.globalAlpha = body;

      // ---- rotor blur: two translucent discs either side, spun fast ----
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (const side of [-1, 1]) {
        const rx = side * R * 1.15;
        const spin = t * 26 * side;
        const rg = g.createRadialGradient(rx, -R * 0.62, 0, rx, -R * 0.62, R * 0.62);
        rg.addColorStop(0, 'rgba(150,180,215,0.16)');
        rg.addColorStop(1, 'rgba(150,180,215,0)');
        g.fillStyle = rg;
        g.beginPath(); g.ellipse(rx, -R * 0.62, R * 0.62, R * 0.15, 0, 0, Math.PI * 2); g.fill();
        // two blade streaks so the disc reads as rotation rather than a smudge
        g.strokeStyle = 'rgba(190,215,245,0.2)';
        g.lineWidth = Math.max(1, u * 0.14);
        for (const off of [0, Math.PI / 2]) {
          g.beginPath();
          g.ellipse(rx, -R * 0.62, R * 0.58, R * 0.12, 0, spin + off, spin + off + 0.7);
          g.stroke();
        }
        // rotor arm out to the hull
        g.globalCompositeOperation = 'source-over';
        g.strokeStyle = 'rgba(58,64,72,0.95)';
        g.lineWidth = u * 0.5;
        g.beginPath();
        g.moveTo(side * R * 0.55, -R * 0.16);
        g.lineTo(rx, -R * 0.6);
        g.stroke();
        g.globalCompositeOperation = 'lighter';
      }
      g.restore();

      // ---- hull: a squat rounded shell, lit warm from above ----
      const hg = g.createLinearGradient(0, -R * 0.75, 0, R * 0.8);
      hg.addColorStop(0, '#5a636e');
      hg.addColorStop(0.45, '#3a4149');
      hg.addColorStop(1, '#1d2126');
      g.fillStyle = hg;
      g.beginPath();
      g.ellipse(0, 0, R, R * 0.78, 0, 0, Math.PI * 2);
      g.fill();
      // belly shadow so it sits in its own light rather than floating flat
      g.fillStyle = 'rgba(6,8,11,0.5)';
      g.beginPath();
      g.ellipse(0, R * 0.3, R * 0.86, R * 0.34, 0, 0, Math.PI * 2);
      g.fill();
      // dents — this drone has been shot at, and the hull should say so
      g.fillStyle = 'rgba(10,12,15,0.45)';
      for (const [dx, dy, dr] of [[-0.5, -0.18, 0.16], [0.42, 0.2, 0.12], [0.1, -0.42, 0.1]]) {
        g.beginPath(); g.ellipse(dx * R, dy * R, dr * R, dr * R * 0.7, 0.4, 0, Math.PI * 2); g.fill();
      }
      // top rim light
      g.strokeStyle = 'rgba(255,214,160,0.28)';
      g.lineWidth = Math.max(1, u * 0.12);
      g.beginPath();
      g.ellipse(0, 0, R * 0.98, R * 0.76, 0, Math.PI * 1.15, Math.PI * 1.9);
      g.stroke();

      // ---- bent antenna, twitching while it talks ----
      const tw = talking ? Math.sin(t * 30) * 0.16 : Math.sin(t * 1.7) * 0.04;
      g.strokeStyle = 'rgba(120,130,142,0.95)';
      g.lineWidth = Math.max(1, u * 0.16);
      g.beginPath();
      g.moveTo(-R * 0.2, -R * 0.7);
      g.quadraticCurveTo(-R * 0.55, -R * 1.5, -R * 0.28 + tw * R, -R * 1.95);
      g.stroke();
      g.fillStyle = talking ? '#ff9a5c' : '#6f7885';
      g.beginPath(); g.arc(-R * 0.28 + tw * R, -R * 1.95, u * 0.28, 0, Math.PI * 2); g.fill();
    }

    // ---- the eye: wakes first, stays brightest ----
    const eyeR = R * 0.42 * (0.6 + 0.4 * wake);
    // blink on a slow irregular cycle, and never while a line is typing
    const blinkPhase = (t * 0.7) % 3.4;
    const blink = !talking && blinkPhase > 3.2 ? (blinkPhase - 3.2) / 0.2 : 0;
    const squash = 1 - Math.sin(Math.min(1, blink) * Math.PI) * 0.92;

    g.save();
    g.globalAlpha = wake;
    // outer glow
    g.globalCompositeOperation = 'lighter';
    const eg = g.createRadialGradient(0, 0, 0, 0, 0, eyeR * 3.4);
    eg.addColorStop(0, `rgba(255,150,80,${0.36 * wake})`);
    eg.addColorStop(1, 'rgba(255,150,80,0)');
    g.fillStyle = eg;
    g.beginPath(); g.arc(0, 0, eyeR * 3.4, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'source-over';
    // socket
    g.fillStyle = '#0e1114';
    g.beginPath(); g.ellipse(0, 0, eyeR * 1.5, eyeR * 1.5, 0, 0, Math.PI * 2); g.fill();
    // iris — a ring that spins up as it wakes
    g.save();
    g.scale(1, Math.max(0.04, squash));
    const ig = g.createRadialGradient(0, 0, 0, 0, 0, eyeR);
    ig.addColorStop(0, '#ffd9a8');
    ig.addColorStop(0.45, '#ff8a3c');
    ig.addColorStop(1, '#a33d12');
    g.fillStyle = ig;
    g.beginPath(); g.arc(0, 0, eyeR, 0, Math.PI * 2); g.fill();
    // rotating aperture ticks
    g.strokeStyle = 'rgba(20,12,6,0.55)';
    g.lineWidth = Math.max(1, u * 0.16);
    for (let i = 0; i < 6; i++) {
      const a = t * 1.6 + (i / 6) * Math.PI * 2;
      g.beginPath();
      g.moveTo(Math.cos(a) * eyeR * 0.55, Math.sin(a) * eyeR * 0.55);
      g.lineTo(Math.cos(a) * eyeR * 0.95, Math.sin(a) * eyeR * 0.95);
      g.stroke();
    }
    // pupil + catchlight
    g.fillStyle = '#160a04';
    g.beginPath(); g.arc(0, 0, eyeR * 0.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,240,220,0.85)';
    g.beginPath(); g.arc(-eyeR * 0.3, -eyeR * 0.32, eyeR * 0.16, 0, Math.PI * 2); g.fill();
    g.restore();
    g.restore();

    g.restore();
  }

  // MOTH's line, typed out under the drone. Wrapped by hand rather than with
  // a layout pass: the lines are short by design and a wrap that can push the
  // block to three rows on a narrow phone is enough.
  drawLine(g, cx, cy, u, t, W) {
    if (t < TYPE_START || !this.line) return;
    const shown = Math.min(
      this.line.length,
      Math.floor((t - TYPE_START) * TYPE_CPS)
    );
    if (shown <= 0) return;
    const text = this.line.slice(0, shown);
    const size = Math.max(11, Math.min(19, u * 1.9));
    g.font = `600 ${size}px "Rajdhani", "Inter", system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';

    // wrap to the narrower of 78% of the viewport or a comfortable measure
    const maxW = Math.min(W * 0.78, size * 34);
    const words = text.split(' ');
    const rows = [];
    let row = '';
    for (const w of words) {
      const next = row ? `${row} ${w}` : w;
      if (g.measureText(next).width > maxW && row) { rows.push(row); row = w; }
      else row = next;
    }
    if (row) rows.push(row);

    const lineH = size * 1.5;
    const top = cy + u * 17;
    // speaker tag
    g.font = `700 ${Math.max(9, size * 0.62)}px "Rajdhani", "Inter", system-ui, sans-serif`;
    g.fillStyle = 'rgba(255,138,60,0.85)';
    g.fillText('M O T H', cx, top - lineH * 0.9);

    g.font = `600 ${size}px "Rajdhani", "Inter", system-ui, sans-serif`;
    g.fillStyle = 'rgba(232,236,244,0.94)';
    for (let i = 0; i < rows.length; i++) {
      g.fillText(rows[i], cx, top + i * lineH);
    }
    // caret while still typing
    if (shown < this.line.length && Math.floor(t * 3) % 2 === 0) {
      const last = rows[rows.length - 1] || '';
      const w = g.measureText(last).width;
      g.fillStyle = 'rgba(255,138,60,0.9)';
      g.fillRect(cx + w / 2 + size * 0.22, top + (rows.length - 1) * lineH - size * 0.42, size * 0.1, size * 0.85);
    }
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
  }

  // The stage stamp — lands after the line, so the beat ends on where you are
  // going rather than on the chatter.
  drawStamp(g, cx, cy, u, t) {
    const k = Math.min(1, Math.max(0, (t - 2.45) / 0.4));
    if (k <= 0) return;
    const size = Math.max(13, Math.min(26, u * 2.6));
    // eases in with a slight overshoot in scale
    const s = 1 + (1 - k) * 0.16;
    g.save();
    g.globalAlpha = k;
    g.translate(cx, cy + u * 34);
    g.scale(s, s);
    g.font = `700 ${size}px "Orbitron", "Rajdhani", system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const label = this.isBoss
      ? t_safe('interlude.bossStamp', { n: this.stage })
      : t_safe('interlude.stamp', { n: this.stage });
    g.fillStyle = this.isBoss ? 'rgba(255,90,70,0.95)' : 'rgba(255,138,60,0.92)';
    g.fillText(label, 0, 0);
    // hairline rule under it
    const w = g.measureText(label).width;
    g.fillStyle = this.isBoss ? 'rgba(255,90,70,0.4)' : 'rgba(255,138,60,0.35)';
    g.fillRect(-w / 2, size * 0.82, w, Math.max(1, u * 0.09));
    g.restore();
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
  }
}

// t() with a fallback, so a missing key shows the stage rather than the raw
// key string in front of the player.
function t_safe(key, vars) {
  const s = t(key, vars);
  return s === key ? `STAGE ${vars.n}` : s;
}
