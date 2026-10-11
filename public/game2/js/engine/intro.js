// Animated boot sequence.
//
// Replaces the static loading card (a wordmark, a label and a bar sitting
// still while assets painted) with a short canvas cinematic that runs *during*
// asset painting, so the wait is the show rather than a screen you stare at.
//
// Beats, in order (redesigned: the first version was three seconds of a
// black screen with two glowing dots in it):
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
    if (this.t > 0.2 && this.embers.length < 60 && Math.random() < dt * 50) {
      this.embers.push({
        x: 0.1 + Math.random() * 0.55, y: 1.05 + Math.random() * 0.1,
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

  // Static layers are painted once per viewport size, then composited each
  // frame: sky, far skyline, near skyline with the rooftop and the operator.
  buildScene(W, H, dpr) {
    const mk = () => { const c = document.createElement('canvas'); c.width = Math.ceil(W * dpr); c.height = Math.ceil(H * dpr); const g = c.getContext('2d'); g.scale(dpr, dpr); return [c, g]; };
    const u = Math.min(W, H) / 100;
    const horizon = H * 0.72;
    let seed = 91;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // far skyline: hazy, warm-lit from the fires below
    const [far, fg] = mk();
    let x = -u * 4;
    while (x < W + u * 4) {
      const bw = u * (5 + rnd() * 9), bh = u * (10 + rnd() * 26);
      const top = horizon - bh;
      fg.fillStyle = '#1b1215';
      fg.fillRect(x, top, bw, H - top);
      if (rnd() > 0.6) fg.fillRect(x + bw * 0.4, top - u * 3, u * 0.35, u * 3);   // antenna
      for (let wy = top + u * 2; wy < horizon - u; wy += u * 2.2) {
        for (let wx = x + u; wx < x + bw - u; wx += u * 1.8) {
          if (rnd() > 0.86) { fg.fillStyle = `rgba(255,${150 + rnd() * 60 | 0},90,${0.25 + rnd() * 0.35})`; fg.fillRect(wx, wy, u * 0.7, u * 0.9); fg.fillStyle = '#1b1215'; }
        }
      }
      x += bw + u * (0.4 + rnd() * 1.6);
    }

    // near skyline + rooftop, the operator on its ledge
    const [near, ng] = mk();
    x = -u * 2;
    seed = 4447;
    while (x < W + u * 2) {
      const bw = u * (8 + rnd() * 14), bh = u * (4 + rnd() * 14);
      const top = horizon + u * 4 - bh;
      ng.fillStyle = '#0a090b';
      ng.beginPath();
      ng.moveTo(x, H); ng.lineTo(x, top);
      if (rnd() > 0.55) {   // broken top
        const n = 4;
        for (let i = 1; i <= n; i++) ng.lineTo(x + bw * i / n, top + (rnd() - 0.3) * u * 3);
      } else ng.lineTo(x + bw, top);
      ng.lineTo(x + bw, H); ng.closePath(); ng.fill();
      x += bw;
    }
    // roof slab in the foreground right
    const roofY = H * 0.86;
    const roofX = W * 0.56;
    ng.fillStyle = '#050507';
    ng.fillRect(roofX, roofY, W - roofX, H - roofY);
    ng.fillStyle = 'rgba(255,120,60,0.18)';
    ng.fillRect(roofX, roofY, W - roofX, Math.max(1, u * 0.3));
    // AC unit and a vent stack on the roof
    ng.fillStyle = '#08080a';
    ng.fillRect(W * 0.86, roofY - u * 6, u * 9, u * 6);
    ng.fillRect(W * 0.94, roofY - u * 11, u * 2.2, u * 11);
    ng.fillStyle = 'rgba(255,120,60,0.14)';
    ng.fillRect(W * 0.86, roofY - u * 6, u * 0.3, u * 6);

    // the operator: side-on, rifle at the low ready, looking out over the city
    const [op, og] = mk();
    const s = (H * 0.40) / 128;   // character is ~128 units tall
    const ox = W * 0.70, oy = roofY;
    og.save(); og.translate(ox, oy); og.scale(-s, s);   // facing left, toward the fires
    og.fillStyle = '#040405';
    const P = (pts) => { og.beginPath(); og.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) og.lineTo(pts[i], pts[i + 1]); og.closePath(); og.fill(); };
    P([-19, 0, -12, -33, -5, -64, 7, -62, 1, -33, -9, 0]);               // rear leg, set back
    P([10, 0, 9, -31, 3, -64, 16, -61, 21, -31, 21, 0]);                 // lead leg, knee soft
    P([-9, 0, -22, 0, -22, -3, -10, -4]); P([10, 0, 27, 0, 27, -4, 10, -4]); // boots
    P([-8, -58, -10, -98, 0, -105, 16, -101, 18, -58]);                  // torso
    P([-9, -66, 19, -66, 21, -52, -10, -52]);                            // belt kit
    P([-9, -97, -21, -95, -22, -64, -8, -62]);                           // pack
    og.beginPath(); og.arc(4, -110, 8.5, 0, Math.PI * 2); og.fill();     // head
    P([-5, -112, -4, -120, 6, -122, 14, -116, 14, -110, -6, -109]);      // helmet
    P([12, -113, 16, -113, 16, -109, 12, -109]);                         // nvg mount
    P([2, -98, 20, -80, 25, -73, 18, -66, 0, -82]);                      // arm
    P([12, -92, 34, -74, 34, -68, 10, -84]);                             // support arm
    P([-6, -80, 56, -62, 55, -57, -6, -73]);                             // rifle, muzzle low
    P([24, -71, 30, -69, 28, -60, 23, -61]);                             // grip
    P([14, -72, 18, -72, 16, -62, 12, -62]);                             // magazine
    og.restore();
    // fire rim along the operator's front edge
    const [rim, rg] = mk();
    rg.drawImage(op, -u * 0.35, -u * 0.15, W, H);
    rg.globalCompositeOperation = 'source-in';
    rg.fillStyle = 'rgba(255,128,64,0.95)';
    rg.fillRect(0, 0, W, H);
    rg.globalCompositeOperation = 'destination-out';
    rg.drawImage(op, 0, 0, W, H);

    this.scene = { W, H, dpr, far, near, op, rim, horizon, roofY, u };
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
    if (!this.scene || this.scene.W !== W || this.scene.H !== H || this.scene.dpr !== dpr) this.buildScene(W, H, dpr);
    const S = this.scene, u = S.u;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    const t = Math.max(0, this.t);
    const cx = W / 2;
    const flick = 0.85 + 0.15 * Math.sin(t * 9.1) * Math.sin(t * 5.3 + 1);

    // ---- sky: night above, fire-lit smoke at the horizon
    const sky = g.createLinearGradient(0, 0, 0, S.horizon);
    sky.addColorStop(0, '#07080c');
    sky.addColorStop(0.55, '#1a0f12');
    sky.addColorStop(1, '#4a1a12');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // the fires: a wide glow low on the left-centre, breathing
    g.save(); g.globalCompositeOperation = 'lighter';
    const fx = W * 0.34, fy = S.horizon;
    const glow = g.createRadialGradient(fx, fy, 0, fx, fy, Math.max(W, H) * 0.55);
    glow.addColorStop(0, `rgba(255,110,40,${0.42 * flick})`);
    glow.addColorStop(0.35, `rgba(200,60,30,${0.16 * flick})`);
    glow.addColorStop(1, 'rgba(120,30,20,0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    g.restore();

    // ---- smoke plumes rolling up off the fires
    g.save();
    for (let i = 0; i < 7; i++) {
      const base = W * (0.18 + i * 0.07);
      const ph = (t * 0.06 + i * 0.37) % 1;
      const yy = S.horizon - ph * H * 0.55;
      const rr = u * (10 + ph * 22);
      const sm = g.createRadialGradient(base + Math.sin(i + t * 0.4) * u * 4, yy, 0, base, yy, rr);
      sm.addColorStop(0, `rgba(40,22,22,${0.35 * (1 - ph)})`);
      sm.addColorStop(1, 'rgba(40,22,22,0)');
      g.fillStyle = sm; g.fillRect(base - rr, yy - rr, rr * 2, rr * 2);
    }
    g.restore();

    // ---- searchlight sweeping the smoke
    g.save(); g.globalCompositeOperation = 'lighter';
    const ang = -Math.PI / 2 + Math.sin(t * 0.7 + 0.6) * 0.5;
    const sx = W * 0.82, sy = S.horizon;
    g.translate(sx, sy); g.rotate(ang);
    const beam = g.createLinearGradient(0, 0, H, 0);
    beam.addColorStop(0, 'rgba(190,210,230,0.16)'); beam.addColorStop(1, 'rgba(190,210,230,0)');
    g.fillStyle = beam;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(H * 1.1, -u * 9); g.lineTo(H * 1.1, u * 9); g.closePath(); g.fill();
    g.restore();

    // ---- skyline layers with a slow push-in
    const push = 1.06 - 0.06 * Math.min(1, t / 3);
    const layer = (img, k) => {
      const z = 1 + (push - 1) * k;
      g.drawImage(img, cx - (W * z) / 2, H - H * z, W * z, H * z);
    };
    layer(S.far, 0.6);
    // flames licking over the far roofline at the fire's heart
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const bx = W * (0.22 + i * 0.03), h = u * (3 + 3 * Math.abs(Math.sin(t * 6 + i * 1.7)));
      const fl = g.createLinearGradient(0, S.horizon - h * 3, 0, S.horizon);
      fl.addColorStop(0, 'rgba(255,170,80,0)'); fl.addColorStop(1, `rgba(255,120,50,${0.35 * flick})`);
      g.fillStyle = fl;
      const w = u * 1.8, sway = Math.sin(t * 4 + i) * u * 0.8;
      g.beginPath();
      g.moveTo(bx - w, S.horizon);
      g.quadraticCurveTo(bx - w * 0.7, S.horizon - h * 1.4, bx + sway, S.horizon - h * 3);
      g.quadraticCurveTo(bx + w * 0.7, S.horizon - h * 1.4, bx + w, S.horizon);
      g.closePath(); g.fill();
    }
    g.restore();
    layer(S.near, 1);
    layer(S.rim, 1);
    layer(S.op, 1);

    // ---- rain, slanted, catching the firelight
    g.save();
    g.strokeStyle = 'rgba(200,170,160,0.10)'; g.lineWidth = 1;
    g.beginPath();
    for (let i = 0; i < 90; i++) {
      const rx = (hash(i * 1.7) * W + t * 140 * (0.8 + hash(i) * 0.4)) % (W + 40) - 20;
      const ry = (hash(i * 3.1) * H + t * 900 * (0.8 + hash(i * 2) * 0.4)) % H;
      g.moveTo(rx, ry); g.lineTo(rx - u * 0.5, ry + u * 2.4);
    }
    g.stroke();
    g.restore();

    // ---- embers ----
    if (this.embers.length) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (const em of this.embers) {
        const fade = Math.min(1, em.life / 0.4) * Math.max(0, 1 - em.life / em.max);
        g.fillStyle = `rgba(255,${140 + Math.floor(hash(em.r * 9) * 70)},70,${0.7 * fade})`;
        g.beginPath();
        g.arc(em.x * W, em.y * H, em.r * u * 0.3, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    }

    // ---- title: letters rise in one after another, lit from below by the city
    const ty = H * 0.34;
    if (t > 0.7) {
      const word = 'CINDERFALL';
      const size = Math.min(u * 12, W / 9.5);
      g.save();
      g.font = `800 ${size}px Orbitron, Rajdhani, sans-serif`;
      g.textBaseline = 'alphabetic';
      const total = g.measureText(word).width + size * 0.08 * (word.length - 1);
      let lx = cx - total / 2;
      for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        const k = Math.min(1, Math.max(0, (t - 0.7 - i * 0.055) / 0.38));
        const e = 1 - Math.pow(1 - k, 3);
        const wch = g.measureText(ch).width;
        if (k > 0) {
          const grad = g.createLinearGradient(0, ty - size, 0, ty);
          grad.addColorStop(0, `rgba(244,240,232,${e})`);
          grad.addColorStop(0.65, `rgba(236,226,214,${e})`);
          grad.addColorStop(1, `rgba(255,150,96,${e})`);
          g.fillStyle = grad;
          g.fillText(ch, lx, ty + (1 - e) * size * 0.35);
          if (k < 1) {   // hot flash as each letter lands
            g.save(); g.globalCompositeOperation = 'lighter';
            g.fillStyle = `rgba(255,120,60,${0.6 * (1 - k)})`;
            g.fillText(ch, lx, ty + (1 - e) * size * 0.35);
            g.restore();
          }
        }
        lx += wch + size * 0.08;
      }
      // red rule and SECTOR 9
      const k2 = Math.min(1, Math.max(0, (t - 1.35) / 0.45));
      const e2 = 1 - Math.pow(1 - k2, 3);
      g.fillStyle = `rgba(214,69,58,${e2})`;
      g.fillRect(cx - total * 0.5 * e2, ty + size * 0.28, total * e2, Math.max(1.5, size * 0.035));
      g.font = `700 ${size * 0.34}px Rajdhani, "Segoe UI", sans-serif`;
      g.textAlign = 'center';
      g.fillStyle = `rgba(214,69,58,${e2})`;
      const label = 'S E C T O R   9';
      g.fillText(label.slice(0, Math.ceil(label.length * Math.min(1, (t - 1.45) / 0.4))), cx, ty + size * 0.72);
      g.restore();
    }

    // ---- grade + vignette ----
    const vg = g.createRadialGradient(cx, H * 0.45, Math.min(W, H) * 0.3, cx, H * 0.5, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.65)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    // fade up from black
    if (t < 0.6) { g.fillStyle = `rgba(7,9,12,${1 - t / 0.6})`; g.fillRect(0, 0, W, H); }

    // ---- fade to menu ----
    if (this.fadeT > 0) {
      g.fillStyle = `rgba(7,9,12,${Math.min(1, this.fadeT / FADE)})`;
      g.fillRect(0, 0, W, H);
    }
  }
}
