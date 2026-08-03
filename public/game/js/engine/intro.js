// Animated boot sequence.
//
// Replaces the static loading card (a wordmark, a label and a bar sitting
// still while assets painted) with a short canvas cinematic that runs *during*
// asset painting, so the wait is the show rather than a screen you stare at.
//
// Beats, in order:
//   0.00  black. a CRT power-on line snaps open into a scanline field
//   0.35  two eyes fade up out of the dark and blink once
//   1.10  SECTOR 9 resolves out of RGB-split glitch slices
//   1.70  CINDERFALL strikes in, embers drift up through it
//   2.60  earliest it will hand off — waits for assets if they're still going
//
// It is always skippable: any tap, click or key jumps straight to the handoff,
// because the second time a player launches the app this is just latency.

const BG = '#07090c';
const AMBER = [255, 122, 60];
const MIN_RUN = 2.6;          // seconds before the intro will hand off
const FADE = 0.42;            // seconds of cross-fade into the menu

// Cheap deterministic noise so glitch slices don't reshuffle every frame.
function hash(n) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

export class Intro {
  // `canvas` is a full-bleed canvas inside the loading overlay.
  constructor(canvas) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.t = 0;
    this.done = false;
    this.skipped = false;
    this.fadeT = 0;
    this.assetsReady = false;
    this.embers = [];
    this._onEnd = null;
    this._raf = 0;
    this._last = 0;

    this._skip = () => this.skip();
    // pointerdown rather than click: it fires on the first touch contact, so
    // the skip feels immediate rather than waiting for the tap to complete
    window.addEventListener('pointerdown', this._skip, { passive: true });
    window.addEventListener('keydown', this._skip);
  }

  // Called by the boot sequence once every asset is painted.
  assetsDone() { this.assetsReady = true; }

  skip() {
    if (this.done || this.skipped) return;
    this.skipped = true;
    // jump to just before the handoff rather than cutting to black instantly,
    // so the transition still reads as deliberate
    this.t = Math.max(this.t, MIN_RUN);
  }

  // Resolves once the sequence has faded out.
  run() {
    return new Promise((resolve) => {
      this._onEnd = resolve;
      this._last = performance.now();
      const tick = (now) => {
        // Clamped at both ends. The upper bound is the usual "don't let a
        // stalled tab jump the animation"; the lower bound matters more here:
        // a rAF timestamp can land *before* the performance.now() captured in
        // run(), which made dt negative, drove `t` below zero and turned
        // Math.pow(t, 0.35) into NaN. That threw out of draw(), killed the rAF
        // loop, and left the boot promise permanently unresolved — the game
        // hung on the intro and never reached the menu.
        const dt = Math.max(0, Math.min(0.05, (now - this._last) / 1000));
        this._last = now;
        this.update(dt);
        this.draw();
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

    // embers start once the title lands
    if (this.t > 1.7 && this.embers.length < 46 && Math.random() < dt * 45) {
      this.embers.push({
        x: Math.random(), y: 1.05 + Math.random() * 0.1,
        vy: 0.05 + Math.random() * 0.09,
        vx: (Math.random() - 0.5) * 0.03,
        r: 0.6 + Math.random() * 1.7,
        life: 0, max: 2.2 + Math.random() * 2,
      });
    }
    for (const e of this.embers) {
      e.y -= e.vy * dt;
      e.x += e.vx * dt;
      e.life += dt;
    }
    this.embers = this.embers.filter((e) => e.life < e.max && e.y > -0.1);

    // hand off only when the sequence has played AND the game is ready
    if (this.t >= MIN_RUN && this.assetsReady) {
      this.fadeT += dt;
      if (this.fadeT >= FADE) this.done = true;
    }
  }

  draw() {
    const g = this.g;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Never let a degenerate viewport reach the gradient constructors, which
    // reject non-finite and produce a divide-by-zero composition at 0.
    const W = Math.max(1, window.innerWidth || 1);
    const H = Math.max(1, window.innerHeight || 1);
    if (this.cv.width !== W * dpr || this.cv.height !== H * dpr) {
      this.cv.width = W * dpr; this.cv.height = H * dpr;
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = BG;
    g.fillRect(0, 0, W, H);

    const t = Math.max(0, this.t);
    const cx = W / 2, cy = H / 2;
    // everything is sized off the shorter axis so the composition holds on
    // both a phone in portrait and a desktop window
    const u = Math.min(W, H) / 100;

    // ---- 0.00 CRT power-on: a bright line snaps open vertically ----
    if (t < 0.42) {
      const k = t / 0.42;
      const h = Math.pow(k, 0.35) * H;
      g.save();
      g.globalCompositeOperation = 'lighter';
      const grad = g.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
      grad.addColorStop(0, 'rgba(120,150,190,0)');
      grad.addColorStop(0.5, `rgba(150,180,220,${0.5 * (1 - k)})`);
      grad.addColorStop(1, 'rgba(120,150,190,0)');
      g.fillStyle = grad;
      g.fillRect(0, cy - h / 2, W, h);
      g.fillStyle = `rgba(220,235,255,${0.9 * (1 - k)})`;
      g.fillRect(0, cy - 1, W, 2);
      g.restore();
    }

    // ---- scanline field, always on, very faint ----
    g.save();
    g.globalAlpha = 0.055;
    g.fillStyle = '#7f95b5';
    for (let y = (t * 26) % 3; y < H; y += 3) g.fillRect(0, y, W, 1);
    g.restore();

    // ---- 0.35 the eyes ----
    // Two slits in the dark. The whole identity of the game is a soldier you
    // can barely see, so the first thing the player meets is the part of him
    // that is lit.
    if (t > 0.35) {
      const k = Math.min(1, (t - 0.35) / 0.55);
      // one blink, mid-beat
      const blinkAt = 1.25;
      const bl = Math.abs(t - blinkAt) < 0.09 ? 1 - Math.abs(t - blinkAt) / 0.09 : 0;
      const open = 1 - bl;
      const ey = cy - u * 8;
      const gap = u * 5.2;
      const ew = u * 3.4, eh = u * 0.95 * open;
      // fade the eyes back down once the wordmark takes over
      const vis = k * (t > 1.6 ? Math.max(0, 1 - (t - 1.6) / 0.5) : 1);
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (const s of [-1, 1]) {
        const x = cx + s * gap;
        const glow = g.createRadialGradient(x, ey, 0, x, ey, u * 9);
        glow.addColorStop(0, `rgba(${AMBER[0]},${AMBER[1]},${AMBER[2]},${0.30 * vis})`);
        glow.addColorStop(1, 'rgba(255,122,60,0)');
        g.fillStyle = glow;
        g.fillRect(x - u * 9, ey - u * 9, u * 18, u * 18);
        if (eh > 0.2) {
          g.fillStyle = `rgba(255,196,150,${0.95 * vis})`;
          g.beginPath();
          g.ellipse(x, ey, ew / 2, eh, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.restore();
    }

    // ---- 1.10 SECTOR 9, resolving out of glitch slices ----
    if (t > 1.1) {
      const k = Math.min(1, (t - 1.1) / 0.5);
      g.save();
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = `700 ${u * 2.6}px Rajdhani, "Segoe UI", sans-serif`;
      const ty = cy + u * 9;
      // during the resolve, draw the string in horizontal slices that slide in
      const slices = 7;
      for (let i = 0; i < slices; i++) {
        const sy = ty - u * 1.8 + (i / slices) * u * 3.6;
        const sh = (u * 3.6) / slices + 1;
        const jitter = (1 - k) * (hash(i * 3.3 + Math.floor(t * 26)) - 0.5) * u * 7;
        g.save();
        g.beginPath(); g.rect(0, sy, W, sh); g.clip();
        // RGB split while unstable
        if (k < 1) {
          g.globalCompositeOperation = 'lighter';
          g.fillStyle = `rgba(255,60,60,${0.5 * (1 - k)})`;
          g.fillText('S E C T O R   9', cx + jitter - u * 0.5, ty);
          g.fillStyle = `rgba(60,200,255,${0.5 * (1 - k)})`;
          g.fillText('S E C T O R   9', cx + jitter + u * 0.5, ty);
        }
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = `rgba(226,222,212,${0.35 + 0.6 * k})`;
        g.fillText('S E C T O R   9', cx + jitter, ty);
        g.restore();
      }
      g.restore();
    }

    // ---- 1.70 CINDERFALL strikes in ----
    if (t > 1.7) {
      const k = Math.min(1, (t - 1.7) / 0.42);
      // overshoot ease so it lands with weight
      const e = 1 - Math.pow(1 - k, 3);
      const scale = 1.18 - 0.18 * e;
      const ty = cy + u * 2;
      g.save();
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.translate(cx, ty);
      g.scale(scale, scale);
      g.font = `800 ${u * 8.2}px Orbitron, Rajdhani, sans-serif`;
      // impact flash on the frame it lands
      if (k < 0.3) {
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.fillStyle = `rgba(255,150,90,${0.5 * (1 - k / 0.3)})`;
        g.fillText('CINDERFALL', 0, 0);
        g.restore();
      }
      g.fillStyle = `rgba(240,236,228,${e})`;
      g.fillText('CINDERFALL', 0, 0);
      // hairline under the title
      g.fillStyle = `rgba(255,122,60,${0.75 * e})`;
      g.fillRect(-u * 22 * e, u * 5.4, u * 44 * e, u * 0.22);
      g.restore();
    }

    // ---- embers ----
    if (this.embers.length) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (const em of this.embers) {
        const fade = Math.min(1, em.life / 0.4) * Math.max(0, 1 - em.life / em.max);
        g.fillStyle = `rgba(255,${140 + Math.floor(hash(em.r * 9) * 70)},70,${0.5 * fade})`;
        g.beginPath();
        g.arc(em.x * W, em.y * H, em.r * u * 0.34, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    }

    // ---- occasional full-frame glitch tear ----
    const tear = hash(Math.floor(t * 12));
    if (t > 0.9 && t < 2.4 && tear > 0.93) {
      const ty = hash(Math.floor(t * 12) + 7) * H;
      const th = u * (1 + hash(Math.floor(t * 12) + 3) * 3);
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = 'rgba(120,190,255,0.12)';
      g.fillRect(0, ty, W, th);
      g.restore();
    }

    // ---- vignette ----
    const vg = g.createRadialGradient(cx, cy, Math.min(W, H) * 0.22, cx, cy, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.72)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);

    // ---- fade to menu ----
    if (this.fadeT > 0) {
      g.fillStyle = `rgba(7,9,12,${Math.min(1, this.fadeT / FADE)})`;
      g.fillRect(0, 0, W, H);
    }
  }
}
