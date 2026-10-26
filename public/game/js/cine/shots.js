// KOR — cinematics: the shots of the prologue (docs/KOR_STORY_CINEMATIC.md §2).
// Each shot builds its still layers once in init() and animates the rest.
import { Cam, mirrorCam } from './cam.js';
import { Rain, Puffs, Sparks, softDot, tinted, glow, beam, reflect, poly } from './fx.js';
import { canvas, fbm2, noise1, noise2, rng, fogTexture, kelvin, krgba, clamp, lerp, smooth } from './noise.js';
import { Ground, mud, asphalt, concrete, bokeh } from './surf.js';
import { buildCity, bakeCity, drawSky, softEdges } from './city.js';

const TAU = Math.PI * 2;
const rgb = (K, mul = 1, a = 1) => krgba(K, a, mul);

// ---------------------------------------------------------------------------------------------
// shot 0 / 4: black, rain only (the caption is in the DOM)
export class Black {
  init() {}
  update() {}
  draw(g) { g.fillStyle = '#000'; g.fillRect(0, 0, g.canvas.width, g.canvas.height); }
  post() { return { grain: 0.05, halation: 0, dirt: 0, vignette: 0 }; }
}

// ---------------------------------------------------------------------------------------------
// shot 10 (and the opening title): a bed of charcoal seen close, from above
// at an angle. Irregular chunks of every size, most of them dead black with a
// pale coat of ash; the fire lives underneath and shows in the gaps, on the
// lower edges of the chunks and in a few cracks. It breathes in three groups.
// Depth of field: sharp across the middle, the near and far chunks soft.
// Over it, the title in plain type.
const ASH = ['#0d0c0c', '#121111', '#0a0a0a', '#171514'];
export class Title {
  constructor(o = {}) { this.o = { len: 7, ...o }; }
  init(W, H, env) {
    this.W = W; this.H = H; this.env = env;
    const cam = this.cam = new Cam(W, H);
    cam.mm = 42; cam.pos = [0, 0.36, -0.05]; cam.pitch = -0.62; cam.update(0);
    const r = rng(23);
    // ash grain pattern for the tops of the chunks
    const at = canvas(128, 128); {
      const g = at.getContext('2d'), img = g.createImageData(128, 128);
      for (let i = 0; i < 128 * 128; i++) { const x = i % 128, y = (i / 128) | 0, n = fbm2(x * 0.07, y * 0.07, 4, 2) * 0.7 + noise2(x * 0.6, y * 0.6, 4) * 0.3; const l = 60 + n * 120; img.data[i * 4] = l; img.data[i * 4 + 1] = l * 0.97; img.data[i * 4 + 2] = l * 0.93; img.data[i * 4 + 3] = 255; }
      g.putImageData(img, 0, 0);
    }
    // hot zones: where the bed burns under the pile (the rest is dying)
    const zones = Array.from({ length: 9 }, () => ({ x: (r() - 0.5) * 0.7, z: 0.15 + r() * 0.8, s: 0.05 + r() * 0.09, k: 0.5 + r() * 0.5 }));
    const heatAt = (x, z) => zones.reduce((a, q) => a + q.k * Math.exp(-((x - q.x) ** 2 + (z - q.z) ** 2) / (q.s * q.s)), 0);
    // the chunks: packed on the bed (y = 0), z 0.08…1.1 m ahead, charcoal-sized
    const chunks = [];
    for (let i = 0; i < 1300; i++) {
      const z = 0.08 + Math.pow(r(), 0.75) * 1.05, x = (r() - 0.5) * (0.3 + z * 1.05);
      const rad = 0.004 + Math.pow(r(), 2.6) * 0.03;
      const verts = 7 + Math.floor(r() * 6), shape = [];
      for (let k = 0; k < verts; k++) shape.push(0.66 + r() * 0.4);
      const heat = Math.min(1.2, heatAt(x, z));
      chunks.push({ x, z, rad, shape, rot: r() * TAU, grp: Math.floor(r() * 3), heat, hot: r() < heat * 0.75, ash: r(), crack: rad > 0.012 && r() < heat * 0.5, seed: r() * 100 });
    }
    chunks.sort((p, q) => q.z - p.z);
    this.zones = zones;
    // three depth bands, each with a base layer and three glow-group layers
    const bands = [[0.55, 9], [0.22, 0.55], [0, 0.22]];
    this.base = []; this.glow = []; this.soft = [];
    for (const [z0, z1] of bands) {
      const b = canvas(W, H), bg = b.getContext('2d');
      const gl = [canvas(W, H), canvas(W, H), canvas(W, H)], gg = gl.map((c) => c.getContext('2d'));
      if (z0 > 0.5) {
        // the bed itself, behind everything: fine dark ash, burning in the zones
        const gnd = cam.project(0, 0, 3);
        bg.fillStyle = '#060505'; bg.fillRect(0, Math.max(0, gnd[1] - 4), W, H);
        // the burning bed shows as broken pockets, not a wash: many small
        // glows scattered by the heat field
        for (let i = 0; i < 700; i++) {
          const x = (r() - 0.5) * 1.2, z = 0.08 + r() * 1.1, h = heatAt(x, z);
          if (r() > h * 0.8) continue;
          const p = cam.project(x, 0, z), R = (0.004 + r() * 0.012) * p[3];
          const n = Math.floor(r() * 3);
          gg[n].globalCompositeOperation = 'lighter'; gg[n].globalAlpha = Math.min(1, 0.35 + h * 0.5);
          gg[n].drawImage(tinted(softDot(64), rgb(1400 + r() * 500)), p[0] - R, p[1] - R * 0.55, R * 2, R * 1.1);
          gg[n].globalAlpha = 1;
        }
      }
      for (const c of chunks) {
        if (c.z < z0 || c.z >= z1) continue;
        const p = cam.project(c.x, c.rad * 0.4, c.z); if (p[2] <= 0) continue;
        const R = c.rad * p[3], sq = 0.62;
        const path = new Path2D();
        c.shape.forEach((k, n) => { const a = c.rot + (n / c.shape.length) * TAU; const px = p[0] + Math.cos(a) * R * k, py = p[1] + Math.sin(a) * R * k * sq; n ? path.lineTo(px, py) : path.moveTo(px, py); });
        path.closePath();
        // body
        bg.fillStyle = ASH[Math.floor(c.seed) % ASH.length]; bg.fill(path);
        // the ash coat on top: only lit by the fire nearby, so warm and dim
        bg.save(); bg.clip(path);
        const coat = 0.2 + c.ash * 0.8, lit = clamp(0.12 + c.heat * 0.7);
        bg.globalAlpha = coat * lit;
        bg.drawImage(at, (c.seed * 7) % 64, (c.seed * 3) % 64, 64, 64, p[0] - R, p[1] - R * sq * 1.1, R * 2, R * 1.2);
        bg.globalCompositeOperation = 'multiply'; bg.globalAlpha = 0.6 * clamp(c.heat); bg.fillStyle = '#ffb07a'; bg.fill(path); bg.globalCompositeOperation = 'source-over';
        // facets: a fan of triangles from an off-centre apex, each its own tone
        const ax = p[0] + (c.seed % 1 - 0.5) * R * 0.5, ay = p[1] - R * sq * 0.15;
        c.shape.forEach((k, n) => {
          const a1 = c.rot + (n / c.shape.length) * TAU, a2 = c.rot + ((n + 1) / c.shape.length) * TAU, k2 = c.shape[(n + 1) % c.shape.length];
          const t1 = Math.sin(a1 + 2.2) * 0.5 + noise1(c.seed + n, 4) * 0.5;
          bg.globalAlpha = Math.abs(t1) * 0.22;
          bg.fillStyle = t1 > 0 ? `rgba(${120 + c.heat * 90},${100 + c.heat * 40},90,1)` : '#000';
          bg.beginPath(); bg.moveTo(ax, ay);
          bg.lineTo(p[0] + Math.cos(a1) * R * k, p[1] + Math.sin(a1) * R * k * sq);
          bg.lineTo(p[0] + Math.cos(a2) * R * k2, p[1] + Math.sin(a2) * R * k2 * sq);
          bg.closePath(); bg.fill();
        });
        // charcoal keeps the wood's grain: fine parallel splits, and cross-checks
        if (R > 6) {
          bg.strokeStyle = '#020202'; bg.lineCap = 'round';
          const ga = c.rot * 0.3 + 0.2;
          for (let k = 0; k < 5; k++) {
            const h = (c.seed * 13.7 + k * 7.1) % 1, o = (h - 0.5) * R * 1.3, gl = R * (0.3 + ((c.seed + k * 3.3) % 1) * 0.7), sh = ((c.seed * 3 + k) % 1 - 0.5) * R * 0.6;
            const cx = p[0] - Math.sin(ga) * o + Math.cos(ga) * sh, cy = p[1] + (Math.cos(ga) * o + Math.sin(ga) * sh) * sq;
            const bend = noise1(c.seed + k, 2) * R * 0.08;
            bg.globalAlpha = 0.18 + h * 0.2; bg.lineWidth = Math.max(0.35, R * (0.008 + h * 0.014));
            bg.beginPath(); bg.moveTo(cx - Math.cos(ga) * gl, cy - Math.sin(ga) * gl * sq);
            bg.quadraticCurveTo(cx - Math.sin(ga) * bend, cy + Math.cos(ga) * bend * sq, cx + Math.cos(ga) * gl, cy + Math.sin(ga) * gl * sq); bg.stroke();
          }
        }
        bg.globalAlpha = 1;
        c.ga = c.rot * 0.3 + 0.2;
        const sh = bg.createLinearGradient(0, p[1] - R * sq, 0, p[1] + R * sq);
        sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(0.55, 'rgba(0,0,0,0.35)'); sh.addColorStop(1, 'rgba(0,0,0,0.92)');
        bg.globalAlpha = 1; bg.fillStyle = sh; bg.fillRect(p[0] - R, p[1] - R, R * 2, R * 2);
        bg.restore();
        // the fire on its lower edge (it sits on the burning bed) and in cracks
        if (c.hot || c.crack) {
          const g = gg[c.grp];
          g.save(); g.clip(path);
          g.globalCompositeOperation = 'lighter';
          const eg = g.createLinearGradient(0, p[1] + R * sq * 0.2, 0, p[1] + R * sq);
          eg.addColorStop(0, rgb(1400, 1, 0)); eg.addColorStop(1, rgb(1650, 1, c.hot ? 0.95 : 0.35));
          g.fillStyle = eg; g.fill(path);
          if (c.crack) {
            // a crack partway across the chunk, hottest in the middle
            g.strokeStyle = rgb(1900, 1, 0.9); g.lineWidth = Math.max(0.5, R * 0.035); g.lineJoin = 'round'; g.lineCap = 'round';
            g.beginPath();
            const a0 = (c.ga || c.rot) + (c.seed % 2 < 1 ? 0 : Math.PI / 2), n = 16, span = 0.9 + (c.seed % 1) * 0.8;
            for (let k = 0; k <= n; k++) {
              const u = (k / n - 0.5) * span, j = noise1(c.seed + k * 0.45, 9) * R * 0.18 + noise1(c.seed + k * 1.9, 3) * R * 0.04;
              const px = p[0] + Math.cos(a0) * u * R * 1.8 - Math.sin(a0) * j, py = p[1] + (Math.sin(a0) * u * R * 1.8 + Math.cos(a0) * j) * sq;
              k ? g.lineTo(px, py) : g.moveTo(px, py);
            }
            g.stroke();
          }
          g.restore();
          // a few glowing pores near the edge
          if (c.hot) for (let k = 0; k < 3; k++) {
            const a = c.rot + r() * TAU, d = R * (0.5 + r() * 0.35);
            const px = p[0] + Math.cos(a) * d, py = p[1] + Math.abs(Math.sin(a)) * d * sq;
            gg[c.grp].globalCompositeOperation = 'lighter';
            gg[c.grp].drawImage(tinted(softDot(64), rgb(1900)), px - R * 0.15, py - R * 0.15, R * 0.3, R * 0.3);
          }
        }
      }
      this.base.push(b); this.glow.push(gl);
    }
    // depth of field: blur the far and the near bands
    const blur = (c, px) => { if (!px) return c; const o = canvas(W, H), g = o.getContext('2d'); g.filter = `blur(${px}px)`; g.drawImage(c, 0, 0); return o; };
    const bl = [Math.round(H * 0.008), 0, Math.round(H * 0.018)];
    this.base = this.base.map((c, i) => blur(c, bl[i]));
    this.glow = this.glow.map((gl, i) => gl.map((c) => blur(c, bl[i])));
    // the light the fire throws: a big soft copy of all glow
    this.bloom = canvas(W / 2, H / 2); {
      const g = this.bloom.getContext('2d'); g.filter = `blur(${Math.round(H * 0.03)}px)`; g.globalCompositeOperation = 'lighter';
      for (const gl of this.glow) for (const c of gl) g.drawImage(c, 0, 0, W / 2, H / 2);
    }
    this.sparks = new Sparks({ seed: 3, col: '#ffb46a', drag: 1.1, gravity: 0.25 });
    this.scam = new Cam(W, H); this.scam.mm = 60; this.scam.pos = [0, 0, -3];
    this.acc = 0;
  }
  update(dt, t) {
    this.scam.update(t);
    this.acc += dt * 5;
    while (this.acc > 1) { this.acc -= 1; this.sparks.burst((Math.random() - 0.5) * 2.4, -0.6 + Math.random() * 0.25, Math.random() * 0.6, 1, 0.26, 0.8); }
    this.sparks.update(dt);
  }
  draw(g, t) {
    const W = this.W, H = this.H, len = this.o.len;
    const up = smooth(0.0, 2.0, t), out = 1 - smooth(len - 1.3, len - 0.2, t);
    const z = 1.03 + t * 0.005, dx = noise1(t * 0.15, 4) * W * 0.003, dy = noise1(t * 0.13, 5) * H * 0.003;
    g.save();
    g.translate(W / 2 + dx, H / 2 + dy); g.scale(z, z); g.translate(-W / 2, -H / 2);
    const breath = [0, 1, 2].map((n) => (0.5 + 0.5 * Math.sin(t * (0.85 + n * 0.21) + n * 2.1)) * (0.9 + 0.1 * noise1(t * 6 + n, 7)));
    for (let b = 0; b < 3; b++) {
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = (0.35 + 0.65 * up) * out;
      g.drawImage(this.base[b], 0, 0);
      g.globalCompositeOperation = 'lighter';
      for (let n = 0; n < 3; n++) { g.globalAlpha = up * out * (0.3 + 0.7 * breath[n]); g.drawImage(this.glow[b][n], 0, 0); }
    }
    g.globalAlpha = up * out * (0.45 + 0.25 * breath[0]); g.drawImage(this.bloom, 0, 0, W, H);
    g.restore();
    const sh = g.createLinearGradient(0, 0, 0, H * 0.5);
    sh.addColorStop(0, 'rgba(0,0,0,0.85)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh; g.fillRect(0, 0, W, H * 0.5);
    this.sparks.draw(g, this.scam, out * up);
    const ta = smooth(1.6, 3.0, t) * out;
    if (ta > 0) {
      const fs = Math.round(H * 0.15);
      g.save();
      g.font = `600 ${fs}px Rajdhani, 'Arial Narrow', sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if ('letterSpacing' in g) g.letterSpacing = `${Math.round(fs * 0.6)}px`;
      g.fillStyle = `rgba(236,229,217,${ta})`;
      g.fillText('KOR', W / 2 + fs * 0.3, H * 0.42);
      g.restore();
    }
  }
  post() { return { grain: 0.075, halation: 0.5, lift: [6, 6, 7], warm: 0.04, vignette: 0.55, dirt: 0.35 }; }
}

// ---------------------------------------------------------------------------------------------
// The blast furnace, 420 m away through a 135 mm lens (shots 1 and 3).
// The plant is painted once in metres on the plane z = Z; floodlights come
// on from the left. Nobody is shown: the plant tells it.
const PLANT_Z = 900;
export class Furnace {
  constructor(o = {}) { this.o = { dying: false, ...o }; }
  init(W, H, env) {
    this.W = W; this.H = H; this.env = env;
    const cam = this.cam = new Cam(W, H);
    cam.mm = 135; cam.pos = [0, 6, 0]; cam.pitch = 0.04; cam.hand = 0.25; cam.seed = 3;
    cam.update(0);
    this.fog = fogTexture(512, 256, 5, 4);
    // the plant layer, painted in metres around x ∈ [-60, 60], y ∈ [0, 70]
    const ppm = cam.f / PLANT_Z * 1.1;
    this.ppm = ppm;
    const X0 = -64, X1 = 64, Y1 = 74;
    const pw = Math.ceil((X1 - X0) * ppm), ph = Math.ceil(Y1 * ppm);
    const lay = this.plant = canvas(pw, ph), pg = lay.getContext('2d');
    pg.setTransform(ppm, 0, 0, -ppm, -X0 * ppm, ph); // y up, metres
    this.paintPlant(pg);
    this.rect = [X0, 0, X1, Y1];
    // the same plant lit from below by the fire: the cast house throws its
    // light up the shell, the stoves and the bridge
    const lit = this.plantLit = canvas(pw, ph), lg = lit.getContext('2d');
    lg.drawImage(lay, 0, 0);
    lg.globalCompositeOperation = 'source-atop';
    const fx = (3 - X0) * ppm, fy = ph - 2 * ppm;
    const up = lg.createRadialGradient(fx, fy, 0, fx, fy, 42 * ppm);
    up.addColorStop(0, rgb(1700, 1, 1)); up.addColorStop(0.3, rgb(1600, 0.85, 0.6)); up.addColorStop(1, rgb(1500, 0.4, 0));
    lg.fillStyle = up; lg.fillRect(0, 0, pw, ph);
    // the edges facing the fire catch more (a thin rim on the right-hand sides)
    lg.globalCompositeOperation = 'source-atop'; lg.globalAlpha = 0.35;
    lg.drawImage(lay, -1.5, 1.5); lg.globalAlpha = 1;
    // the glow sources of the furnace (taphole, cast house openings, the top)
    this.hot = [[3.5, 3.2, 1.0], [-6, 2.5, 0.7], [9, 2.2, 0.5], [2, 34, 0.35]];
    // three floodlights on trucks, coming on one by one from the left
    this.lamps = [{ at: 2.6, x: -95, y: 3.2, z: 560, aim: [0.83, 0.03, 0.55] }, { at: 3.2, x: -80, y: 3.4, z: 520, aim: [0.8, 0.05, 0.6] }, { at: 3.8, x: -66, y: 3.0, z: 470, aim: [0.75, 0.07, 0.66] }];
    this.rain = new Rain({ n: [900, 300, 20], box: [60, 40, 2, 260], speed: 8.5, wind: 1.4, seed: 2 });
    this.steam = new Puffs({ rate: 14, life: 11, rise: 5, grow: 16, size: 3, col: '#d7c1aa', a: 0.07, seed: 4 });
    for (let i = 0; i < 120; i++) this.steam.update(0.1, [[2, 44, PLANT_Z], [-14, 36, PLANT_Z]], 1.2);
    this.T = 0;
  }
  paintPlant(g) {
    const S = '#0b0a0b', S2 = '#100e0e', L = (w) => { g.lineWidth = w; };
    g.fillStyle = S; g.strokeStyle = S;
    const rect = (x0, y0, x1, y1, c = S) => { g.fillStyle = c; g.fillRect(x0, y0, x1 - x0, y1 - y0); };
    const line = (pts, w = 0.25, c = S) => { g.strokeStyle = c; L(w); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.stroke(); };
    // ground
    rect(-64, -1, 64, 1.2, '#070607');
    // four hot-blast stoves on the left: tall cylinders, domed
    for (const [x, w, h] of [[-36, 7.5, 40], [-27.5, 7.5, 41], [-19, 7.5, 40.5], [-45, 7, 38]]) {
      rect(x - w / 2, 0, x + w / 2, h, S2);
      g.fillStyle = S2; g.beginPath(); g.ellipse(x, h, w / 2, w * 0.38, 0, 0, Math.PI); g.fill();
      for (let y = 6; y < h; y += 5.5) line([[x - w / 2, y], [x + w / 2, y]], 0.12, '#151213');
      line([[x - w / 2 + 0.6, 0], [x - w / 2 + 0.6, h]], 0.18, '#181415');
    }
    // the hot-blast main joining the stoves to the furnace
    rect(-46, 26, -2, 28.2, S);
    // the furnace: shell tapering to the throat, the top platform, the uptakes
    g.fillStyle = S; g.beginPath();
    g.moveTo(-6.5, 0); g.lineTo(6.5, 0); g.lineTo(7.2, 12); g.lineTo(5.6, 30); g.lineTo(4.4, 34); g.lineTo(-4.4, 34); g.lineTo(-5.6, 30); g.lineTo(-7.2, 12); g.closePath(); g.fill();
    rect(-7.5, 33.6, 7.5, 35.2); // top platform
    for (const x of [-3.4, -1.1, 1.1, 3.4]) rect(x - 0.6, 35, x + 0.6, 48);
    // the uptakes join in a gooseneck and come down the downcomer to the dust catcher
    rect(-4, 47.4, 4, 49.6);
    line([[-4, 48.5], [-10, 50], [-16, 46], [-17, 30]], 1.6);
    rect(-20.5, 8, -13.5, 30, S2); g.beginPath(); g.moveTo(-20.5, 8); g.lineTo(-13.5, 8); g.lineTo(-17, 2); g.closePath(); g.fill();
    line([[-17, 2], [-17, 0]], 0.8);
    // bleeder valves on top, small
    for (const x of [-3.4, 3.4]) { rect(x - 0.4, 48, x + 0.4, 52); rect(x - 0.9, 52, x + 0.9, 52.7); }
    // the skip bridge: a long inclined truss from the ground on the right to the top
    const b0 = [38, 0], b1 = [6, 36];
    line([b0, b1], 1.2); line([[b0[0], 2.2], [b1[0], b1[1] + 2.2]], 0.5);
    for (let k = 0; k < 18; k++) { const u = k / 18, x = lerp(b0[0], b1[0], u), y = lerp(b0[1], b1[1], u); line([[x, y], [x - 1.7, y + 2.2]], 0.18); }
    rect(36, 0, 44, 4.5); // the stock house end
    // the cast house: a long low shed at the base, open on the front
    rect(-14, 0, 18, 9.5, '#0c0b0b');
    g.beginPath(); g.moveTo(-15, 9.5); g.lineTo(2, 13); g.lineTo(19, 9.5); g.closePath(); g.fillStyle = '#0c0b0b'; g.fill();
    for (let x = -12; x < 18; x += 4) line([[x, 0], [x, 9.5]], 0.25, '#131011');
    // stairs and platforms on the furnace: thin lines, handrails
    for (const [y, x0, x1] of [[14, -14, 12], [24, -8, 8], [30, -7, 7]]) { line([[x0, y], [x1, y]], 0.3); line([[x0, y + 1.1], [x1, y + 1.1]], 0.08); for (let x = x0; x <= x1; x += 1.6) line([[x, y], [x, y + 1.1]], 0.06); }
    for (let i = 0; i < 6; i++) line([[8 + i * 0.6, 14 + i * 1.6], [8.6 + i * 0.6, 14 + (i + 1) * 1.6]], 0.15);
    // pipes and a gantry crane to the left, chimneys behind
    line([[-46, 6], [-56, 6], [-56, 0]], 0.9);
    rect(-62, 0, -60.8, 46, '#0a0909'); rect(-58.6, 0, -57.6, 42, '#0a0909');
    rect(48, 0, 50, 30, '#0a0909'); line([[44, 30], [58, 30]], 0.6); line([[52, 30], [52, 18]], 0.15);
  }
  update(dt, t) {
    this.T = t;
    const cam = this.cam;
    // a 4 % push over the shot
    cam.mm = 135 * (1 + 0.04 * clamp(t / 7));
    cam.update(t + (this.o.dying ? 30 : 0));
    this.rain.update(dt, cam, 0, false);
    const hot = this.heat(t);
    this.steam.rate = 7 * hot; this.steam.update(dt, [[2, 44, PLANT_Z], [-14, 36, PLANT_Z]], 1.2);
    // floodlight breakers
    if (!this.o.dying && this.env.audio) for (const L of this.lamps) if (!L.done && t >= L.at) { L.done = true; this.env.audio.cue('clack', { pan: -0.5, vol: 0.8 }); }
  }
  heat(t) {
    if (!this.o.dying) return 1;
    // shot 3: the light inside drains away over four seconds (exponential)
    return Math.exp(-Math.max(0, t - 0.3) * 1.15) * (1 - smooth(3.0, 3.8, t));
  }
  draw(g, t) {
    const W = this.W, H = this.H, cam = this.cam, hot = this.heat(t);
    const fur = cam.project(2, 20, PLANT_Z), hor = cam.project(0, 0, 4000);
    // sky: near black above, a dirty brown toward the horizon
    const sky = g.createLinearGradient(0, 0, 0, hor[1]);
    sky.addColorStop(0, '#020304'); sky.addColorStop(0.6, '#070708'); sky.addColorStop(1, `rgb(${Math.round(14 + 18 * hot)},${Math.round(11 + 7 * hot)},${11})`);
    g.fillStyle = sky; g.fillRect(0, 0, W, hor[1] + 1);
    // the low cloud over the plant takes the fire's light
    glow(g, fur[0], fur[1] - H * 0.15, H * 0.8, rgb(1550), 0.14 * hot);
    g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.55;
    const ox = (t * 4) % W; g.drawImage(this.fog, -ox, -H * 0.05, W * 1.3, H * 0.7); g.drawImage(this.fog, W * 1.3 - ox, -H * 0.05, W * 1.3, H * 0.7);
    g.restore();
    // steam off the top, lit from below while the fire is in
    this.steam.col = hot > 0.15 ? '#b88a66' : '#5d5b5c';
    this.steam.draw(g, cam, 0.35 + 0.65 * hot);
    // the plant
    const [x0, , x1, y1] = this.rect;
    const a = cam.project(x0, y1, PLANT_Z), b = cam.project(x1, 0, PLANT_Z);
    g.drawImage(this.plant, a[0], a[1], b[0] - a[0], b[1] - a[1]);
    if (hot > 0.01) { g.globalAlpha = hot; g.drawImage(this.plantLit, a[0], a[1], b[0] - a[0], b[1] - a[1]); g.globalAlpha = 1; }
    // distance haze, thicker low down (a kilometre of rain and smoke)
    const hz = g.createLinearGradient(0, a[1], 0, b[1]);
    hz.addColorStop(0, 'rgba(20,18,18,0.05)'); hz.addColorStop(1, `rgba(${Math.round(34 + 30 * hot)},${Math.round(26 + 12 * hot)},22,0.3)`);
    g.fillStyle = hz; g.fillRect(0, a[1], W, b[1] - a[1]);
    // the fire: cast house mouths, the taphole, the runner, the throat
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [hx, hy, k] of this.hot) {
      const p = cam.project(hx, hy, PLANT_Z - 2);
      const f = (0.85 + 0.15 * noise1(t * 7 + hx, 3)) * hot * k;
      glow(g, p[0], p[1], p[3] * 14, rgb(1550), 0.45 * f);
      glow(g, p[0], p[1], p[3] * 3, rgb(1850), 0.95 * f);
    }
    // the cast house bays: the iron runs inside, the light comes out between
    // the columns, brightest at the floor
    for (let bx = -12, n = 0; bx < 17; bx += 4, n++) {
      const q0 = cam.project(bx + 0.5, 0.2, PLANT_Z - 3), q1 = cam.project(bx + 3.5, 6.5, PLANT_Z - 3);
      const fl = (0.7 + 0.3 * noise1(t * 3 + n * 1.7, 11)) * hot * (n === 3 || n === 4 ? 1 : 0.55);
      const bay = g.createLinearGradient(0, q1[1], 0, q0[1]);
      bay.addColorStop(0, rgb(1500, 1, 0)); bay.addColorStop(0.6, rgb(1600, 1, 0.35 * fl)); bay.addColorStop(1, rgb(1800, 1, 0.9 * fl));
      g.fillStyle = bay; g.fillRect(q0[0], q1[1], q1[0] - q0[0], q0[1] - q1[1]);
    }
    // the light spilling out across the yard in front
    const sp = cam.project(3, 0, PLANT_Z - 30);
    g.globalAlpha = 0.5 * hot; g.drawImage(tinted(softDot(64), rgb(1600)), sp[0] - sp[3] * 40, sp[1] - sp[3] * 4, sp[3] * 80, sp[3] * 9); g.globalAlpha = 1;
    g.restore();
    // the yard between us and the plant: wet ground, rails, the fire in the puddles
    const gy = hor[1];
    const gr = g.createLinearGradient(0, gy, 0, H);
    gr.addColorStop(0, `rgb(${Math.round(18 + 16 * hot)},${Math.round(14 + 6 * hot)},13)`); gr.addColorStop(0.25, '#0a0909'); gr.addColorStop(1, '#050505');
    g.fillStyle = gr; g.fillRect(0, b[1], W, H - b[1]);
    for (const [hx, hy, k] of this.hot.slice(0, 3)) reflect(g, cam, [hx, hy + 2, PLANT_Z - 40], 0, 1650, 0.22 * hot * k, 3, t);
    g.strokeStyle = 'rgba(80,60,48,0.35)'; g.lineWidth = 1;
    for (const rx of [6.2, 7.6]) { const r0 = cam.project(rx, 0, 260), r1 = cam.project(rx - 2, 0, PLANT_Z - 20); g.beginPath(); g.moveTo(r0[0], r0[1]); g.lineTo(r1[0], r1[1]); g.stroke(); }
    // floodlights from the left: a hard flash, then the beam through the rain
    for (const L of this.lamps) {
      const k = this.o.dying ? 1 : smooth(L.at, L.at + 0.1, t) * (1 + 0.8 * Math.exp(-(t - L.at) * 9) * (t > L.at ? 1 : 0));
      if (k <= 0) continue;
      beam(g, cam, [L.x, L.y, L.z], L.aim, 0.03, 420, 5600, 0.55 * k, this.fog, t);
      // where the beam lands on the plant: a hard white pool
      const hit = cam.project(L.x + L.aim[0] * (PLANT_Z - L.z) / L.aim[2], L.y + L.aim[1] * (PLANT_Z - L.z) / L.aim[2], PLANT_Z - 4);
      if (hit[2] > 0) glow(g, hit[0], hit[1], hit[3] * 9, rgb(5600), 0.3 * k);
      const p = cam.project(L.x, L.y, L.z);
      glow(g, p[0], p[1], p[3] * 2.2, rgb(6200), 0.95 * k);
      glow(g, p[0], p[1], p[3] * 9, rgb(6000), 0.18 * k);
    }
    // the trucks, dark against the yard
    for (const L of this.lamps) poly(g, cam, [[L.x - 4, 0, L.z], [L.x + 3, 0, L.z], [L.x + 3, 2.6, L.z], [L.x + 0.8, 3.5, L.z], [L.x - 4, 3.5, L.z]], '#040404');
    // fence posts and wire close to us, out of focus (the focus is on the plant)
    g.save(); g.filter = `blur(${Math.max(2, Math.round(H * 0.012))}px)`;
    g.fillStyle = '#030303'; g.strokeStyle = '#030303';
    // a bank of slag and rubble across the bottom of the frame
    g.beginPath(); const bz = 190; let first = true;
    for (let x = -30; x <= 30; x += 0.8) { const y = 2.2 + noise1(x * 0.35, 6) * 0.9 + noise1(x * 1.7, 7) * 0.25; const p = cam.project(x, y, bz); first ? g.moveTo(p[0], p[1]) : g.lineTo(p[0], p[1]); first = false; }
    g.lineTo(W + 10, H + 10); g.lineTo(-10, H + 10); g.closePath(); g.fill();
    for (const fx of [-16.5, 15.8]) { poly(g, cam, [[fx - 0.1, 0, 150], [fx + 0.1, 0, 150], [fx + 0.1, 3.4, 150], [fx - 0.1, 3.4, 150]], '#030303'); }
    g.lineWidth = Math.max(1, H * 0.0025);
    for (const wy of [3.0, 3.25, 3.4]) { const p0 = cam.project(-25, wy, 150), p1 = cam.project(25, wy + 0.02, 150); g.beginPath(); g.moveTo(p0[0], p0[1]); g.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + H * 0.01, p1[0], p1[1]); g.stroke(); }
    g.restore();
    // rain, lit by the lights it falls through
    this.rain.draw(g, cam, { col: '#e3d6c6', light: 0.6 + 0.4 * hot });
  }
  post() { return { grain: 0.11, halation: 0.4, lift: [10, 9, 8], warm: 0.08, vignette: 0.55, dirt: 0.6, flicker: 0.025 }; }
}

// (shots still to come)

// ---------------------------------------------------------------------------------------------
// shot 2: through the fence (§2, shot 2). The lens a step behind a chain-link
// fence at shin height. Behind it, in the yard: a red road flare burning in
// the mud, the floodlight tower and two trucks far off, all of it soft.
// Focus starts on the wire; it pulls to the flare, spitting where it fell.
const FLARE_COL = [1, 0.16, 0.1];
export class Fence {
  init(W, H, env) {
    this.W = W; this.H = H; this.env = env;
    const cam = this.cam = new Cam(W, H);
    cam.mm = 50; cam.pos = [0, 0.42, 0]; cam.pitch = -0.05; cam.hand = 0.45; cam.seed = 21; cam.update(0);
    const r = rng(41);
    this.flare = [0.55, 0.035, 3.7];
    this.flood = [-30, 12, 150];
    // --- the yard, far: sky, the plant on the horizon, trucks, the tower ---
    const far = canvas(W, H), b = far.getContext('2d');
    const hz = cam.project(0, 0.42, 400)[1];
    const sky = b.createLinearGradient(0, 0, 0, hz + 4);
    sky.addColorStop(0, '#07080a'); sky.addColorStop(0.7, '#0e1013'); sky.addColorStop(1, '#16171a');
    b.fillStyle = sky; b.fillRect(0, 0, W, H);
    // low cloud, lit from below by the town
    const fog = fogTexture(256, 64, 17, 4);
    b.globalAlpha = 0.18; b.drawImage(fog, -W * 0.2, hz - H * 0.55, W * 1.6, H * 0.5); b.globalAlpha = 1;
    // the floodlight's light hanging in the rain over the yard: what the
    // trucks stand out against
    { const f = cam.project(...this.flood), gr = b.createRadialGradient(f[0], f[1], 0, f[0], f[1], W * 0.75);
      gr.addColorStop(0, 'rgba(120,132,148,0.34)'); gr.addColorStop(0.2, 'rgba(76,84,96,0.2)'); gr.addColorStop(0.55, 'rgba(40,44,52,0.08)'); gr.addColorStop(1, 'rgba(30,34,40,0)');
      b.fillStyle = gr; b.fillRect(0, 0, W, H); }
    // a low mist over the yard, lit from the left
    { const gr = b.createLinearGradient(0, hz - H * 0.14, 0, hz + H * 0.01); gr.addColorStop(0, 'rgba(60,66,76,0)'); gr.addColorStop(0.75, 'rgba(66,72,82,0.26)'); gr.addColorStop(1, 'rgba(60,66,76,0.05)');
      b.fillStyle = gr; b.fillRect(0, hz - H * 0.14, W, H * 0.15); }
    // the plant: a long low mass with the furnace and a stack, far right
    b.fillStyle = '#0b0c0e';
    poly(b, cam, [[-60, 0, 260], [80, 0, 260], [80, 9, 260], [52, 9, 260], [50, 26, 260], [44, 30, 260], [40, 26, 260], [38, 12, 260], [10, 12, 260], [8, 7, 260], [-60, 7, 260]], '#0c0d0f');
    poly(b, cam, [[61, 0, 262], [63.4, 0, 262], [63, 44, 262], [61.6, 44, 262]], '#0c0d0f');
    // the trucks: boxy armoured shapes, side-on and three-quarter
    for (const [x, z, L, h, wv] of [[-4.6, 15, 6.5, 2.9, 1], [3.8, 21, 7.5, 3.1, -1]]) {
      const y0 = 0.25;
      poly(b, cam, [[x, y0, z], [x + L, y0, z], [x + L, h * 0.78, z], [x + L - 0.9 * wv, h, z], [x + 1.2, h, z], [x + 0.2, h * 0.72, z]], '#08090a');
      for (const wx of [x + 1.1, x + L - 1.4, x + L - 2.6]) { const q = cam.project(wx, 0.5, z - 0.1); b.fillStyle = '#050506'; b.beginPath(); b.arc(q[0], q[1], 0.52 * q[3], 0, TAU); b.fill(); }
    }
    // the floodlight tower: a lattice mast and the lamp frame
    { const [x, y, z] = this.flood; const a = cam.project(x, 0, z), c = cam.project(x, y, z); b.strokeStyle = '#0a0b0d'; b.lineWidth = Math.max(1, 0.5 * a[3]); b.beginPath(); b.moveTo(a[0], a[1]); b.lineTo(c[0], c[1]); b.stroke(); }
    // ground far off (the near ground is lit per pixel below)
    b.fillStyle = '#121215'; b.fillRect(0, hz, W, H - hz);

    this.farSharp = far;
    this.farSoft = canvas(W, H); { const g = this.farSoft.getContext('2d'); g.filter = `blur(${Math.round(H * 0.018)}px)`; g.drawImage(far, 0, 0); }
    this.farMid = canvas(W, H); { const g = this.farMid.getContext('2d'); g.filter = `blur(${Math.max(1, Math.round(H * 0.005))}px)`; g.drawImage(far, 0, 0); }
    // the lights out there, drawn as the lens sees them (discs when soft)
    this.lights = [
      ...[[-0.9, 0.5], [-0.3, 0.5], [0.3, 0.5], [0.9, 0.5], [-0.6, -0.1], [0, -0.1], [0.6, -0.1]].map(([dx, dy]) => ({ p: [this.flood[0] + dx, this.flood[1] + dy, this.flood[2]], col: '#eef2f8', a: 1.6, r: 0.25 })),
      { p: [-4.6 + 0.1, 1.1, 14.6], col: '#f2eee4', a: 0.75, r: 0.12 }, { p: [-4.6 + 0.1, 1.1, 15.4], col: '#f2eee4', a: 0.5, r: 0.12 },
      { p: [3.8 + 7.4, 1.0, 20.6], col: '#c82018', a: 0.6, r: 0.08 }, { p: [3.8 + 7.4, 1.0, 21.4], col: '#c82018', a: 0.45, r: 0.08 },
      { p: [-4.6 + 3, 3.1, 15], col: '#ffae38', a: 0.0, r: 0.1, beacon: 0.0 }, { p: [3.8 + 3.2, 3.3, 21], col: '#ffae38', a: 0.0, r: 0.1, beacon: 1.7 },
      { p: [44, 18, 259], col: '#ff8a3a', a: 0.35, r: 1.5 }, { p: [62.3, 44.5, 262], col: '#ff2a20', a: 0.5, r: 0.4, blink: true },
      { p: [-30, 6, 120], col: '#ffb468', a: 0.3, r: 0.4 }, { p: [-22, 6, 140], col: '#ffb468', a: 0.25, r: 0.4 }, { p: [24, 6, 150], col: '#ffb468', a: 0.22, r: 0.4 },
    ];
    // --- the ground, lit per pixel: mud, tyre ruts, standing water ---
    const M = mud(5);
    this.ground = new Ground(cam, {
      mat: M.mat, height: M.height, scale: 0.6, zMax: 120, lazy: true,
      lights: [
        { p: [this.flare[0] + 0.08, 0.2, this.flare[2]], col: FLARE_COL, I: 2.6, layer: true },
        { p: this.flood, K: 5600, I: 5200 },
        { p: [-4.5, 1.1, 14.6], K: 4800, I: 6 },
      ],
      mirror: [
        { p: this.flood, r: 1.6, K: 5600, I: 3.2 },
        { p: [-4.5, 1.1, 14.6], r: 0.3, K: 4800, I: 2.2 },
        { p: [11.2, 1.0, 21], r: 0.2, col: [0.8, 0.1, 0.07], I: 1.2 },
        { p: [44, 18, 259], r: 9, K: 1900, I: 0.6 },
      ],
      sky: [0.012, 0.013, 0.015], amb: [0.0035, 0.0032, 0.003], haze: { d: 70, c: [0.0028, 0.0029, 0.0032] },
    });
    // --- the fence, in the world: chain-link on a plane turned a little ---
    this.fz = (x) => 0.92 + x * 0.22;
    this.drops = [];
    this.fenceAt = this.buildFence(r);
    this.mid = canvas(W, H);
    this.sparks = new Sparks({ seed: 7, col: '#ff6a4a', drag: 1.6, gravity: -3.2 });
    this.smoke = new Puffs({ rate: 30, life: 1.3, rise: 0.32, grow: 0.4, size: 0.045, col: '#d0524a', a: 0.32, seed: 13, lumpy: true });
    this.smoke2 = new Puffs({ rate: 10, life: 4.5, rise: 0.45, grow: 0.9, size: 0.12, col: '#2e2628', a: 0.2, seed: 14, lumpy: true });
    this.rain = new Rain({ n: [700, 380, 50], box: [7, 4.2, 0.5, 30], speed: 8.8, wind: 0.7, seed: 9 });
    this.drips = [];
    for (let i = 0; i < 60; i++) { this.smoke.update(0.05, [[this.flare[0] + 0.1, 0.04, this.flare[2]]], 0.3); this.smoke2.update(0.08, [[this.flare[0] + 0.2, 0.3, this.flare[2]]], 0.35); }
  }
  // chain link: each wire zigzags between two columns and hooks into the next
  // at the bends; galvanised, 3 mm; beads of rain hang at the lower bends
  buildFence(r) {
    const W = this.W, H = this.H, cam = this.cam, M = Math.round(W * 0.06);
    const c = canvas(W + M * 2, H + M * 2), g = c.getContext('2d');
    g.translate(M, M);
    const hw = 0.036, hh = 0.04, x0 = -0.9, x1 = 0.9, y0 = -0.1, y1 = 1.4;
    const P = (x, y) => cam.project(x, y, this.fz(x));
    g.lineCap = 'round'; g.lineJoin = 'round';
    const rows = Math.ceil((y1 - y0) / hh), cols = Math.ceil((x1 - x0) / hw);
    for (let k = 0; k < cols; k++) {
      const pts = [];
      for (let j = 0; j <= rows; j++) {
        const x = x0 + k * hw + ((j + k) % 2 ? hw : 0) + (r() - 0.5) * 0.0015, y = y0 + j * hh + Math.sin(k * 0.7) * 0.004;
        pts.push(P(x, y));
      }
      const w = Math.max(1, 0.0036 * pts[0][3]);
      // the wire: straight runs with a tight turn at each bend (a short
      // rounded corner where it wraps round its neighbour)
      const path = (dx, dy) => {
        g.beginPath(); g.moveTo(pts[0][0] + dx, pts[0][1] + dy);
        for (let j = 1; j < pts.length - 1; j++) {
          const a = pts[j - 1], q = pts[j], n = pts[j + 1], c1 = 0.12;
          g.lineTo(q[0] + (a[0] - q[0]) * c1 + dx, q[1] + (a[1] - q[1]) * c1 + dy);
          g.quadraticCurveTo(q[0] + dx, q[1] + dy, q[0] + (n[0] - q[0]) * c1 + dx, q[1] + (n[1] - q[1]) * c1 + dy);
        }
        const e = pts[pts.length - 1]; g.lineTo(e[0] + dx, e[1] + dy);
      };
      g.strokeStyle = '#0b0c0e'; g.lineWidth = w; path(0, 0); g.stroke();
      // galvanising, dulled: a cold line of light along the upper edge
      g.strokeStyle = `rgba(${150 + r() * 30 | 0},${160 + r() * 25 | 0},${172 + r() * 20 | 0},${(0.28 + r() * 0.16).toFixed(2)})`; g.lineWidth = Math.max(0.5, w * 0.3); path(-w * 0.22, -w * 0.28); g.stroke();
      for (let j = 1; j < pts.length - 1; j++) {
        if ((j + k) % 2 === 0) continue;
        const q = pts[j];
        // the wrap: the two wires bulge where they turn round each other
        g.fillStyle = '#0b0c0e'; g.beginPath(); g.ellipse(q[0], q[1], w * 0.7, w * 0.95, 0, 0, TAU); g.fill();
        g.fillStyle = 'rgba(160,170,184,0.22)'; g.beginPath(); g.arc(q[0] - w * 0.25, q[1] - w * 0.35, w * 0.3, 0, TAU); g.fill();
      }
      // water gathers at the lowest turns: a bead under some, a film on others
      for (let j = 1; j < pts.length - 1; j++) {
        if ((j + k) % 2 === 1) continue;
        if (r() < 0.16) this.drops.push({ x: x0 + k * hw, y: y0 + j * hh - 0.002, s: 0.5 + r() * r() * 1.4, ph: r() * 9 });
      }
    }
    // the post: a galvanised pipe on the right, and the tension wire low down
    const pa = P(0.5, -0.1), pb = P(0.5, 1.5);
    g.strokeStyle = '#0d0e10'; g.lineWidth = 0.06 * pa[3]; g.beginPath(); g.moveTo(pa[0], pa[1]); g.lineTo(pb[0], pb[1]); g.stroke();
    g.strokeStyle = 'rgba(160,170,185,0.3)'; g.lineWidth = 0.008 * pa[3]; g.beginPath(); g.moveTo(pa[0] - 0.022 * pa[3], pa[1]); g.lineTo(pb[0] - 0.022 * pb[3], pb[1]); g.stroke();
    // dry grass along the bottom of the fence
    for (let cl = 0; cl < 12; cl++) {
      const cx = -0.8 + r() * 1.6, n = 14 + (r() * 26 | 0);
      for (let i = 0; i < n; i++) {
        const x = cx + (r() - 0.5) * 0.09, h = 0.06 + r() * r() * 0.38, z = this.fz(x) + 0.02 + r() * 0.06;
        // most stand, some lean out of the clump, a few have broken and hang
        const broke = r() < 0.12, lean = (x - cx) * 1.6 + (r() - 0.5) * 0.08;
        const a = cam.project(x, 0.0, z), m = cam.project(x + lean * 0.3, h * 0.6, z), e = broke ? cam.project(x + lean * 0.4 + 0.05, h * 0.35, z) : cam.project(x + lean, h, z);
        const wd = Math.max(0.45, (0.0011 + r() * 0.0016) * a[3]);
        // a blade: a little wider at the root, to a point, bowed
        g.fillStyle = r() < 0.5 ? '#0d0c0a' : '#12100d';
        g.beginPath(); g.moveTo(a[0] - wd, a[1]); g.quadraticCurveTo(m[0] - wd * 0.5, m[1], e[0], e[1]); g.quadraticCurveTo(m[0] + wd * 0.5, m[1], a[0] + wd, a[1]); g.closePath(); g.fill();
        // the ones on the right catch the flare from behind along one edge
        if (x > 0 && r() < 0.6) { g.strokeStyle = `rgba(255,70,50,${(0.15 + r() * 0.25).toFixed(2)})`; g.lineWidth = Math.max(0.4, wd * 0.35); g.beginPath(); g.moveTo(a[0] + wd * 0.6, a[1] - (a[1] - m[1]) * 0.3); g.quadraticCurveTo(m[0] + wd * 0.5, m[1], e[0], e[1]); g.stroke(); }
        else if (r() < 0.2) { g.strokeStyle = 'rgba(150,158,170,0.14)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(m[0] - wd * 0.4, m[1]); g.quadraticCurveTo(m[0], m[1] - (m[1] - e[1]) * 0.4, e[0], e[1]); g.stroke(); }
      }
    }
    this.fM = M; this.fRef = [0, 0.42, this.fz(0)]; const q = cam.project(...this.fRef); this.fR0 = [q[0], q[1]];
    const soft = canvas(c.width, c.height);
    return { sharp: c, soft };
  }
  prepare(ms) { this.ground.step(ms); }
  // focus distance over the shot: on the wire, then pulled to the flare in the mud
  focusAt(t) { return lerp(this.fz(0), this.flare[2], smooth(0.7, 1.9, t)); }
  update(dt, t) {
    const cam = this.cam; cam.update(t);
    // the flare spits: sparks and burning drips
    if (Math.random() < dt * 34) this.sparks.burst(this.flare[0] + 0.1, this.flare[1] + 0.02, this.flare[2], 1, 0.7, 1);
    this.sparks.update(dt);
    this.smoke.update(dt, [[this.flare[0] + 0.1, 0.04, this.flare[2]]], 0.3);
    this.smoke2.update(dt, [[this.flare[0] + 0.2, 0.3, this.flare[2]]], 0.35);
    this.rain.update(dt, cam, 0, true);
    // water running down the wire: now and then a bead lets go
    if (Math.random() < dt * 3 && this.drops.length) { const d = this.drops[Math.floor(Math.random() * this.drops.length)]; this.drips.push({ x: d.x, y: d.y, v: 0 }); }
    for (const d of this.drips) { d.v += 9.8 * dt; d.y -= d.v * dt; }
    this.drips = this.drips.filter((d) => d.y > -0.2);
  }
  draw(g, t) {
    const W = this.W, H = this.H, cam = this.cam;
    cam.focus = this.focusAt(t);
    const blurAt = (Z) => cam.coc(Z, 2.0) / 2.2;   // gaussian radius for a disc of that size
    const fl = 0.78 + 0.16 * noise1(t * 13, 2) + 0.08 * noise1(t * 41, 3);
    // far: two pre-blurred plates crossfaded by the focus
    const bf = blurAt(40), kSoft = clamp(bf / (H * 0.018));
    const sh = this.ground.offset(cam);
    g.save(); g.translate(sh[0], sh[1]);
    g.globalAlpha = 1; g.drawImage(this.farMid, 0, 0);
    g.globalAlpha = kSoft; g.drawImage(this.farSoft, 0, 0); g.globalAlpha = 1;
    g.restore();
    // the far lights: discs as big as their blur
    const q = [0, 0, 0, 0];
    for (const L of this.lights) {
      cam.project(L.p[0], L.p[1], L.p[2], q); if (q[2] <= 0) continue;
      let a = L.a;
      if (L.beacon !== undefined) { const ph = (t * 1.3 + L.beacon) % 1; a = 0.75 * Math.pow(Math.max(0, Math.cos(ph * TAU)), 6); }
      if (L.blink) a *= (t % 1.5) < 0.6 ? 1 : 0.1;
      const rr = Math.max(L.r * q[3], cam.coc(q[2], 2.0) / 2);
      if (rr > 2.5) bokeh(g, q[0], q[1], rr, L.col, a * clamp(9 / rr, 0.45, 1));
      else glow(g, q[0], q[1], Math.max(1.5, rr * 3), L.col, a);
      if (rr <= 2.5) glow(g, q[0], q[1], Math.max(0.8, rr * 0.8), '#ffffff', a * 0.6);
    }
    // the floodlight's glare in the rain: a wide soft bloom round the tower
    { const f = cam.project(...this.flood); glow(g, f[0], f[1], H * 0.55, '#8d99a8', 0.12); }
    // --- mid: ground, flare, smoke ---
    const m = this.mid.getContext('2d');
    m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1; m.filter = 'none';
    m.clearRect(0, 0, W, H);
    this.ground.draw(m, cam, [fl]);
    // the floodlight smeared in the puddles, alive with the rain
    reflect(m, cam, [this.flood[0] + 0.4, this.flood[1], this.flood[2]], 0, '#c9d2de', 0.12, 1.2, t);
    // the flare: a red tube lying in the mud, the burning end white
    // the tube half sunk in the mud: dark paper, lit along its length by its own fire
    const F0 = cam.project(this.flare[0] - 0.19, 0.008, this.flare[2] + 0.06), F1 = cam.project(this.flare[0] + 0.08, 0.016, this.flare[2]);
    { const wd = Math.max(1.5, 0.026 * F1[3]), gr = m.createLinearGradient(F0[0], F0[1], F1[0], F1[1]);
      gr.addColorStop(0, '#120605'); gr.addColorStop(0.55, '#2c0a08'); gr.addColorStop(0.9, '#7a1a12'); gr.addColorStop(1, '#ff7a5a');
      m.strokeStyle = gr; m.lineWidth = wd; m.lineCap = 'round';
      m.beginPath(); m.moveTo(F0[0], F0[1]); m.lineTo(F1[0], F1[1]); m.stroke();
      // the plastic cap on the cold end, and the mud lapping the underside
      m.fillStyle = '#0b0606'; m.beginPath(); m.arc(F0[0], F0[1], wd * 0.62, 0, TAU); m.fill();
      m.strokeStyle = 'rgba(14,10,9,0.9)'; m.lineWidth = wd * 0.5; m.lineCap = 'butt';
      m.beginPath(); m.moveTo(F0[0], F0[1] + wd * 0.42); m.lineTo(F1[0], F1[1] + wd * 0.42); m.stroke(); }
    this.smoke2.draw(m, cam, 1);
    m.save(); m.globalCompositeOperation = 'screen'; this.smoke.draw(m, cam, fl); m.restore();
    // the flame: a short jet, pink-white at the root
    const fx = cam.project(this.flare[0] + 0.1, 0.04, this.flare[2]), pr = fx[3];
    glow(m, fx[0], fx[1], pr * 0.5, '#ff2a1c', 0.55 * fl);
    glow(m, fx[0], fx[1], pr * 0.16, '#ff6a5a', 0.9 * fl);
    for (let i = 0; i < 3; i++) { const j = noise1(t * 20 + i * 3, 11) * 0.012; glow(m, fx[0] + (0.02 + i * 0.012) * pr, fx[1] - (0.012 + i * 0.01 + j) * pr, pr * (0.03 - i * 0.006), '#ffd9d0', 0.8 * fl); }
    glow(m, fx[0], fx[1], pr * 0.035, '#ffffff', 1);
    this.sparks.draw(m, cam, 1);
    // the mid layer, blurred by how far it sits from the focus
    const bm = blurAt(this.flare[2]);
    if (bm > 0.6) { g.filter = `blur(${bm.toFixed(1)}px)`; g.drawImage(this.mid, 0, 0); g.filter = 'none'; } else g.drawImage(this.mid, 0, 0);
    // rain: white in the floodlight, red near the flare
    const flr = this.flare;
    this.rain.draw(g, cam, { col: '#c4ccd6', light: 0.55, tint: (x, y, z) => { const d2 = (x - flr[0]) ** 2 + (y - 0.2) ** 2 + (z - flr[2]) ** 2; return d2 < 2.2 ? ['#ff5a44', clamp(1.2 / (d2 + 0.25)) * fl] : null; } });
    // the fence: sharp at first, a veil once the focus has passed it
    const fb = blurAt(this.fz(0)), FA = this.fenceAt;
    const fq = cam.project(...this.fRef), ox = fq[0] - this.fR0[0] - this.fM, oy = fq[1] - this.fR0[1] - this.fM;
    if (fb > 0.6) { g.filter = `blur(${fb.toFixed(1)}px)`; g.drawImage(FA.sharp, ox, oy); g.filter = 'none'; } else g.drawImage(FA.sharp, ox, oy);
    // beads of water on the wire catch the light; a few let go
    g.save(); g.globalCompositeOperation = 'lighter';
    const dq = [0, 0, 0, 0], br = Math.max(0, fb);
    for (const d of this.drops) {
      cam.project(d.x, d.y - 0.004, this.fz(d.x), dq); if (dq[2] <= 0) continue;
      const rr = 0.0022 * dq[3] * d.s, tw = 0.75 + 0.25 * Math.sin(t * 1.3 + d.ph);
      if (br > 2) bokeh(g, dq[0], dq[1], br * 1.05 + rr, d.x > 0.2 ? '#ff6650' : '#b9c6d6', 0.05 * tw);
      else { glow(g, dq[0], dq[1], rr * 3.5, d.x > 0.2 ? '#ff5a46' : '#aebccc', 0.35 * tw); glow(g, dq[0] - rr * 0.3, dq[1] - rr * 0.3, rr * 0.9, '#ffffff', 0.7 * tw); }
    }
    for (const d of this.drips) { cam.project(d.x, d.y, this.fz(d.x) - 0.01, dq); if (dq[2] > 0 && br < 3) glow(g, dq[0], dq[1], 0.004 * dq[3], '#ccd6e2', 0.5); }
    g.restore();
  }
  post() { return { grain: 0.1, halation: 0.5, lift: [4, 4, 5], warm: 0.04, cool: 0.05, vignette: 0.6, dirt: 0.55, flicker: 0.02 }; }
}

// ---------------------------------------------------------------------------------------------
// shot 5: the city from a roof (§2, shot 5). Night, rain. Over the edge of
// our roof the town goes on to the horizon: rows of flat roofs, the light of
// the sodium lamps rising between them, a window lit here and there. Far off
// to the right the steelworks, cold: four stacks with red lights and no
// smoke. On the left the Syndicate tower, its searchlight turning under the
// cloud. A drone crosses close to the lens. The operator pans 3° right.
export class Rooftop {
  init(W, H, env) {
    this.W = W; this.H = H; this.env = env;
    const cam = this.cam = new Cam(W, H);
    cam.mm = 35; cam.pos = [0, 54.75, 0]; cam.pitch = -0.075; cam.yaw = -0.026; cam.hand = 0.6; cam.seed = 51; cam.update(0);
    this.roofY = 53.0;
    // the plate is baked wider than the frame for the pan, with the same lens
    const M = this.M = Math.round(W * 0.07), bc = new Cam(W + M * 2, H);
    bc.mm = cam.mm * W / (W + M * 2); bc.pos = cam.pos.slice(); bc.pitch = cam.pitch; bc.yaw = 0; bc.update(0);
    this.bc = bc;
    this.plate = canvas(W + M * 2, H);
    this.city = buildCity(77, {});
    this.tower = { x: -250, z: 1100, h: 150 };
    this.stacks = [[392, 1420, 128], [430, 1460, 136], [478, 1400, 120], [560, 1500, 140]];
    this.gen = this.bake(); this.ready = false;
    this.rain = new Rain({ n: [900, 420, 60], box: [9, 5, 0.5, 40], speed: 8.6, wind: 1.1, seed: 31 });
    this.splash = [];
    this.drone = { x0: 6.5, x1: -7, y: cam.pos[1] + 0.15, z: 6.2, t0: 3.7, t1: 6.6 };
    this.cloud = softEdges(fogTexture(512, 96, 61, 4));
  }
  *bake() {
    const g = this.plate.getContext('2d'), bc = this.bc, W = bc.W, H = bc.H;
    const hz = bc.project(0, bc.pos[1], 20000)[1];
    drawSky(g, W, H, hz, 8);
    yield;
    // far right: the steelworks, dead. A long low mass, the furnace, the stacks
    const P = (x, y, z) => bc.project(x, y, z);
    const sil = (pts, col) => { g.beginPath(); pts.forEach(([x, y, z], i) => { const q = P(x, y, z); if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.closePath(); g.fillStyle = col; g.fill(); };
    const far = '#120e0c';
    const Z = 1480;
    sil([[300, 0, Z], [760, 0, Z], [760, 24, Z], [690, 24, Z], [684, 52, Z], [668, 60, Z], [652, 52, Z], [646, 26, Z], [560, 26, Z], [552, 34, Z], [522, 34, Z], [517, 20, Z], [300, 20, Z]], far);
    // the furnace's four stoves, a row of domes
    for (let i = 0; i < 4; i++) { const x = 600 + i * 9; sil([[x - 3.6, 0, Z - 5], [x + 3.6, 0, Z - 5], [x + 3.6, 40, Z - 5], [x + 2.4, 43, Z - 5], [x, 44, Z - 5], [x - 2.4, 43, Z - 5], [x - 3.6, 40, Z - 5]], far); }
    for (const [x, z, h] of this.stacks) { sil([[x - 4.6, 0, z], [x + 4.6, 0, z], [x + 3.2, h, z], [x - 3.2, h, z]], '#100c0b'); sil([[x - 3.5, h - 6, z - 1], [x + 3.5, h - 6, z - 1], [x + 3.5, h - 4.5, z - 1], [x - 3.5, h - 4.5, z - 1]], '#0c0a09'); }
    // the skip bridge up to the furnace top
    sil([[668, 60, Z - 2], [740, 22, Z - 2], [744, 25, Z - 2], [672, 63, Z - 2]], far);
    yield;
    // the tower: a slab with chamfered corners and a crown of lights
    const tower = () => { const T = this.tower, c = '#0d0b0b', rr = rng(5);
      // a slab, a narrower shaft above a setback, the crown, a spire
      sil([[T.x - 18, 0, T.z], [T.x + 18, 0, T.z], [T.x + 18, T.h * 0.62, T.z], [T.x + 13, T.h * 0.64, T.z], [T.x + 13, T.h - 6, T.z], [T.x + 9, T.h, T.z], [T.x - 9, T.h, T.z], [T.x - 13, T.h - 6, T.z], [T.x - 13, T.h * 0.64, T.z], [T.x - 18, T.h * 0.62, T.z]], c);
      sil([[T.x - 0.6, T.h, T.z], [T.x + 0.6, T.h, T.z], [T.x + 0.2, T.h + 26, T.z], [T.x - 0.2, T.h + 26, T.z]], c);
      // floors: offices, a few still lit, a cold white; the core's stair lights
      for (let y = 6; y < T.h - 8; y += 3.6) { const w = y < T.h * 0.62 ? 17 : 12; for (let x = -w; x < w; x += 2.4) if (rr() < 0.045) { const q = P(T.x + x, y, T.z - 0.5), e = P(T.x + x + 2, y + 1.6, T.z - 0.5); g.fillStyle = `rgba(${170 + rr() * 40 | 0},${195 + rr() * 30 | 0},225,${(0.25 + rr() * 0.3).toFixed(2)})`; g.fillRect(q[0], e[1], Math.max(0.8, e[0] - q[0]), Math.max(0.6, q[1] - e[1])); } }
      // the crown: a band of LED light under the top, and the setback's edge
      const a = P(T.x - 9, T.h - 4, T.z - 1), b = P(T.x + 9, T.h - 4, T.z - 1); g.fillStyle = 'rgba(206,224,244,0.6)'; g.fillRect(a[0], a[1], b[0] - a[0], Math.max(1, 0.9 * a[3]));
      const s0 = P(T.x - 18, T.h * 0.62, T.z - 1), s1 = P(T.x + 18, T.h * 0.62, T.z - 1); g.fillStyle = 'rgba(206,224,244,0.25)'; g.fillRect(s0[0], s0[1], s1[0] - s0[0], 1); };
    yield;
    yield* bakeCity(g, bc, this.city, { haze: [62, 44, 30], hazeD: 700, seed: 12, extra: [{ d: Math.hypot(this.tower.x, this.tower.z) - 18, draw: tower }] });
  }
  prepare(ms) { if (this.ready) return; const t0 = performance.now(); while (performance.now() - t0 < ms) if (this.gen.next().done) { this.ready = true; return; } }
  update(dt, t) {
    const cam = this.cam;
    cam.yaw = -0.026 + 0.052 * smooth(0, 8, t) ;
    cam.update(t);
    this.rainY = cam.pos[1] * 0.8 - 1;
    this.rain.update(dt, cam, 0, false);
    // rain on the coping: little crowns along the top of the parapet
    for (let i = 0; i < 40 * dt * 60 / 60 * 3; i++) if (Math.random() < 0.5) { const u = Math.random(); this.splash.push({ x: -6 + u * 12, z: 1.85 + u * 1.2, t: 0 }); }
    for (const p of this.splash) p.t += dt;
    this.splash = this.splash.filter((p) => p.t < 0.25);
  }
  draw(g, t) {
    if (!this.ready) { while (!this.gen.next().done); this.ready = true; }
    const W = this.W, H = this.H, cam = this.cam, bc = this.bc;
    // the plate, moved with the pan and the hand
    const ref = [0, cam.pos[1], 1000], q0 = bc.project(...ref), q1 = cam.project(...ref);
    const ox = q1[0] - q0[0], oy = q1[1] - q0[1];
    g.drawImage(this.plate, ox, oy);
    // the cloud base drifts; the town lights it from below
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.07;
    const hz = cam.project(0, cam.pos[1], 20000)[1], cx = (t * 6) % W;
    g.drawImage(this.cloud, -cx + ox, hz - H * 0.42, W * 1.3, H * 0.3); g.drawImage(this.cloud, W * 1.3 - cx + ox, hz - H * 0.42, W * 1.3, H * 0.3);
    g.restore();
    // the searchlight: from the top of the tower, sweeping under the cloud
    const T = this.tower, top = [T.x, T.h + 2, T.z], th = 0.35 + Math.sin(t * 0.35 - 0.6) * 0.55, ph = 0.035;
    const dir = [Math.cos(th) * Math.cos(ph), Math.sin(ph), Math.sin(th) * Math.cos(ph)];
    beam(g, cam, top, dir, 0.03, 1400, 6500, 0.7, this.cloud, t);
    // where it touches the cloud, a pale smudge
    { const k = (420 - top[1]) / dir[1], hit = cam.project(top[0] + dir[0] * k, 420, top[2] + dir[2] * k); if (hit[2] > 0) glow(g, hit[0], hit[1], 60 * hit[3], '#b8c4d0', 0.12); }
    glow(g, ...cam.project(...top).slice(0, 2), 6, '#eef4ff', 0.9);
    // aviation lights: the stacks and the tower, red, together, 40 a minute
    const on = (t * 40 / 60) % 1 < 0.45;
    for (const [x, z, h] of this.stacks) { const q = cam.project(x, h + 1, z); glow(g, q[0], q[1], on ? 7 : 3, '#ff2a1a', on ? 0.85 : 0.15); }
    { const q = cam.project(T.x, T.h + 27, T.z); glow(g, q[0], q[1], on ? 6 : 2, '#ff2a1a', on ? 0.9 : 0.1); for (const sx of [-18, 18]) { const q2 = cam.project(T.x + sx, T.h * 0.62, T.z); glow(g, q2[0], q2[1], on ? 4 : 2, '#ff2a1a', on ? 0.6 : 0.1); } }
    // a television in a near window, and a window that goes dark at 5.2 s
    { const q = cam.project(-48.4, 18.1, 130.2); g.fillStyle = `rgba(120,150,210,${(0.25 + 0.2 * noise1(t * 9, 4) + 0.1 * noise1(t * 23, 5)).toFixed(3)})`; g.fillRect(q[0], q[1], 1.3 * q[3], 1.2 * q[3]); }
    if (t < 5.2) { const q = cam.project(37.6, 15.0, 181); g.fillStyle = 'rgba(255,196,130,0.7)'; g.fillRect(q[0], q[1], 1.3 * q[3], 1.5 * q[3]); }
    // rain over everything, lit by the town behind it
    this.rain.draw(g, cam, { col: '#d9c6ad', light: 0.85, ground: this.rainY });
    // the drone: close, fast, a black shape smeared by the shutter
    this.drawDrone(g, t);
    // our roof: the parapet, the aerial, the dish
    this.drawRoof(g, t);
  }
  drawDrone(g, t) {
    const D = this.drone; if (t < D.t0 || t > D.t1) return;
    const cam = this.cam, k = (t - D.t0) / (D.t1 - D.t0), x = lerp(D.x0, D.x1, k), y = D.y + Math.sin(k * 3) * 0.12, z = D.z;
    const v = (D.x1 - D.x0) / (D.t1 - D.t0), sh = 1 / 48;
    const c = this.droneC || (this.droneC = canvas(this.W, this.H)), m = c.getContext('2d');
    m.clearRect(0, 0, this.W, this.H);
    // the shutter is open for 1/48 s: lay down the shape along its path
    for (let i = 0; i < 6; i++) {
      const xx = x - v * sh * (i / 5), q = cam.project(xx, y, z), p = q[3];
      m.globalAlpha = 0.28;
      m.fillStyle = '#060607';
      m.beginPath(); m.ellipse(q[0], q[1], 0.11 * p, 0.045 * p, 0, 0, TAU); m.fill();               // body
      m.fillRect(q[0] - 0.26 * p, q[1] - 0.012 * p, 0.52 * p, 0.024 * p);                            // arms
      m.beginPath(); m.ellipse(q[0] + 0.02 * p, q[1] + 0.05 * p, 0.035 * p, 0.03 * p, 0, 0, TAU); m.fill(); // the camera under it
      for (const s of [-1, 1]) { m.fillRect(q[0] + s * 0.24 * p - 0.01 * p, q[1] - 0.04 * p, 0.02 * p, 0.035 * p); }
    }
    m.globalAlpha = 1;
    // the props: discs you can see through
    for (const s of [-1, 1]) for (const f of [-1, 1]) {
      const q = cam.project(x + s * 0.24, y + 0.035, z + f * 0.2);
      m.fillStyle = 'rgba(8,8,9,0.35)'; m.beginPath(); m.ellipse(q[0], q[1], 0.13 * q[3], 0.018 * q[3], 0, 0, TAU); m.fill();
    }
    g.drawImage(c, 0, 0);
    // nav lights and the strobe
    const qL = cam.project(x - 0.26, y, z), qR = cam.project(x + 0.26, y, z), qS = cam.project(x, y - 0.03, z);
    glow(g, qL[0], qL[1], 0.05 * qL[3], '#ff2222', 0.8); glow(g, qR[0], qR[1], 0.05 * qR[3], '#22ff66', 0.7);
    const strobe = ((t - D.t0) % 1) < 0.06;
    if (strobe) { glow(g, qS[0], qS[1], 0.5 * qS[3], '#ffffff', 0.7); glow(g, qS[0], qS[1], 0.06 * qS[3], '#ffffff', 1); }
  }
  drawRoof(g, t) {
    const cam = this.cam, Y = this.roofY;
    const P = (x, y, z) => cam.project(x, y, z);
    // the parapet: a brick wall with a concrete coping, running off at an angle
    const A = [-7, 2.6], B = [7, 3.6], top = Y + 0.95, cop = 0.06;
    const at = (u, y, out = 0) => P(A[0] + (B[0] - A[0]) * u, y, A[1] + (B[1] - A[1]) * u - out);
    const face = [at(0, Y), at(1, Y), at(1, top), at(0, top)];
    g.fillStyle = '#0a0909'; g.beginPath(); face.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.fill();
    // the coping: its top is wet and holds the orange of the sky
    const cp = [at(0, top, 0.05), at(1, top, 0.05), at(1, top + cop, 0.05), at(0, top + cop, 0.05)];
    const tp = [at(0, top + cop, 0.05), at(1, top + cop, 0.05), at(1, top + cop, -0.3), at(0, top + cop, -0.3)];
    g.fillStyle = '#100e0d'; g.beginPath(); cp.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.fill();
    const gr = g.createLinearGradient(0, tp[3][1], 0, tp[0][1]); gr.addColorStop(0, '#2e231b'); gr.addColorStop(1, '#17120f');
    g.fillStyle = gr; g.beginPath(); tp.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.fill();
    // joints in the coping every metre, chipped corners
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1;
    for (let u = 0.04; u < 1; u += 1 / 14) { const a = at(u, top + cop, 0.05), b = at(u, top + cop, -0.3); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    // the wet edge catches the light in a thin broken line
    g.strokeStyle = 'rgba(190,150,110,0.35)'; g.lineWidth = 1;
    g.beginPath(); for (let u = 0; u <= 1; u += 0.02) { const q = at(u, top + cop, 0.05); const n = noise1(u * 40, 7); if (n > -0.2) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); } g.stroke();
    // rain hitting the coping
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const p of this.splash) { const q = P(p.x, top + cop, p.z - 0.1), k = p.t / 0.25; g.fillStyle = `rgba(220,200,170,${(0.35 * (1 - k)).toFixed(3)})`; g.beginPath(); g.ellipse(q[0], q[1] - 2 * k, 1 + 3 * k, 0.6 + k, 0, Math.PI, TAU); g.fill(); }
    g.restore();
    // the aerial on the left: a mast, a Yagi on top, a cable down to the wall
    const sway = Math.sin(t * 1.3) * 0.01 + noise1(t * 2, 9) * 0.008;
    const m0 = [-4.6, Y, 12], m1 = [-4.6 + sway * 5, Y + 3.25, 12];
    const a = P(...m0), b = P(...m1);
    g.strokeStyle = '#0b0a0a'; g.lineWidth = Math.max(1, 0.04 * a[3]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    // the boom and its elements, getting shorter toward the front
    const bm0 = [m1[0] - 0.8, m1[1] - 0.05, m1[2] + 0.9], bm1 = [m1[0] + 1.0, m1[1], m1[2] - 1.1];
    const q0 = P(...bm0), q1 = P(...bm1);
    g.lineWidth = Math.max(0.8, 0.025 * q0[3]); g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]); g.stroke();
    for (let i = 0; i < 9; i++) {
      const u = i / 8, c = [bm0[0] + (bm1[0] - bm0[0]) * u, bm0[1] + (bm1[1] - bm0[1]) * u, bm0[2] + (bm1[2] - bm0[2]) * u], L = 0.55 - u * 0.25;
      // elements square to the boom, level
      const e0 = P(c[0] - L * 0.74, c[1], c[2] - L * 0.67), e1 = P(c[0] + L * 0.74, c[1], c[2] + L * 0.67);
      g.lineWidth = Math.max(0.6, 0.012 * e0[3]); g.beginPath(); g.moveTo(e0[0], e0[1] + (i === 0 ? 0 : 0)); g.lineTo(e1[0], e1[1]); g.stroke();
    }
    // a second, older aerial, bent
    { const c0 = P(-4.6, Y + 2.5, 12), c1 = P(-3.5, Y + 2.65, 11.9), c2 = P(-5.4, Y + 2.3, 12.2); g.lineWidth = Math.max(0.7, 0.015 * c0[3]); g.beginPath(); g.moveTo(c2[0], c2[1]); g.lineTo(c0[0], c0[1]); g.lineTo(c1[0], c1[1] + 4); g.stroke(); }
    // the cable: a slack curve from the mast to the parapet and over it
    { const s0 = P(-4.6, Y + 2.6, 12), s1 = P(-1.2, top + cop, 2.75), mid = P(-3.0, Y + 0.6, 7); g.lineWidth = Math.max(0.8, 0.012 * s0[3]); g.beginPath(); g.moveTo(s0[0], s0[1]); g.quadraticCurveTo(mid[0], mid[1], s1[0], s1[1]); g.stroke(); }
    // the dish on the right, on a bracket, filmed with rain
    { const d = P(4.6, top + 0.55, 3.5), R = 0.42 * d[3];
      g.fillStyle = '#0c0b0b'; g.beginPath(); g.ellipse(d[0], d[1], R * 0.62, R, 0.35, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(170,140,110,0.3)'; g.lineWidth = 1; g.beginPath(); g.ellipse(d[0], d[1], R * 0.62, R, 0.35, -2.2, -0.6); g.stroke();
      const arm0 = P(4.6, top + 0.55, 3.5), arm1 = P(4.0, top + 0.7, 3.0); g.strokeStyle = '#0c0b0b'; g.lineWidth = Math.max(1, 0.02 * d[3]); g.beginPath(); g.moveTo(arm0[0], arm0[1]); g.lineTo(arm1[0], arm1[1]); g.stroke();
      const leg = P(4.7, Y + 0.95, 3.6); g.lineWidth = Math.max(1, 0.035 * d[3]); g.beginPath(); g.moveTo(leg[0], leg[1]); g.lineTo(d[0] + R * 0.1, d[1] + R * 0.2); g.stroke(); }
  }
  post() { return { grain: 0.075, halation: 0.4, lift: [5, 5, 6], warm: 0.05, cool: 0.04, vignette: 0.55, dirt: 0.5, flicker: 0.015 }; }
}

// ---------------------------------------------------------------------------------------------
// shot 6: the street, seen in a puddle (§2, shot 6). The lens a hand above a
// puddle, looking down into it. At the top of the frame, the real street:
// the far kerb, the bottom of a wall. Most of the frame is the puddle, and
// in it the same street upside down: the wall and on it a torn poster,
// DÜZEN · GÜVENLİK · İTAAT, with KOR sprayed across it; the patrol has just
// gone by. The rain rings the water. Focus starts on the rings and pulls
// into the reflection.
const WALL_Z = 10.5, KERB_Z = 7.4, PPM_WALL = 190;
export class Street {
  init(W, H, env) {
    this.W = W; this.H = H; this.env = env;
    const cam = this.cam = new Cam(W, H);
    cam.mm = 50; cam.pos = [0, 0.22, 0]; cam.pitch = -0.11; cam.hand = 0.12; cam.seed = 61; cam.update(0);
    this.mcam = mirrorCam(cam, 0);
    const r = rng(66);
    // the wall: x −5..5 m, 0..3.2 m, painted once with its light
    this.wall = this.paintWall(r);
    // the ground: asphalt, the puddle covering most of what we see
    const A = asphalt(9, { lanes: 0 });
    // a long puddle in the dip of the road; dry ground shows at its edges
    this.puddle = (x, z) => {
      const e = fbm2(x * 0.8, z * 0.9, 3, 71) - 0.5, f = fbm2(x * 4, z * 4, 2, 72) - 0.5;
      return z > 0.5 && z < 6.9 + e * 0.8 && Math.abs(x - 0.1 + e * 0.3) < 0.12 + 0.33 * z + e * 0.5 + f * 0.06;
    };
    this.ground = new Ground(cam, {
      mat: (x, z) => { const m = A.mat(x, z); if (this.puddle(x, z)) m.wet = 1; else m.wet = Math.max(m.wet, 0.45); if (z > KERB_Z) m.alb = m.alb.map((v) => v * 1.25); return m; },
      height: A.height, scale: 0.6, zMax: KERB_Z, fade: 0.02, lazy: true,
      lights: [{ p: [-3.5, 5.5, 8.5], K: 1950, I: 10 }, { p: [0.25, 2.75, WALL_Z - 0.25], K: 5200, I: 1.6, layer: true }],
      mirror: [], sky: [0.006, 0.006, 0.007], amb: [0.0025, 0.0022, 0.002],
    });
    // the puddle's outline on the screen (a mask for the reflection)
    this.mask = canvas(W, H);
    this.rings = []; this.debris = [];
    for (let i = 0; i < 7; i++) this.debris.push({ x: -2.2 + r() * 4.4, z: 2.6 + r() * 3.6, a: r() * 6.28, k: r() });
    this.rain = new Rain({ n: [500, 260, 30], box: [5, 3.5, 0.5, 20], speed: 8.5, wind: 0.5, seed: 62 });
    this.refl = canvas(W, H); this.real = canvas(W, H); this.tmp = canvas(W, H);
  }
  prepare(ms) {
    this.ground.step(ms);
    if (this.ground.ready && !this.maskDone) this.makeMask();
  }
  makeMask() {
    // which pixels look at standing water: march the ground plane per pixel
    const W = this.W, H = this.H, cam = this.cam, s = 3, g = this.mask.getContext('2d');
    g.clearRect(0, 0, W, H); g.fillStyle = '#fff';
    const cy = Math.cos(cam._yaw), sy = Math.sin(cam._yaw), cp = Math.cos(cam._pitch), sp = Math.sin(cam._pitch), C = cam._p, f = cam.f;
    for (let py = 0; py < H; py += s) for (let px = 0; px < W; px += s) {
      const x1 = (px - W / 2) / f, y2 = -(py - H / 2) / f;
      const dy = y2 * cp + sp, z1 = -y2 * sp + cp, dx = x1 * cy + z1 * sy, dz = -x1 * sy + z1 * cy;
      if (dy >= 0) continue;
      const t = -C[1] / dy, wx = C[0] + dx * t, wz = C[2] + dz * t;
      if (this.puddle(wx, wz)) g.fillRect(px - 0.5, py - 0.5, s + 1, s + 1);
    }
    // soften the edge a touch (the water's meniscus)
    const t2 = this.tmp.getContext('2d'); t2.clearRect(0, 0, W, H); t2.filter = 'blur(1.5px)'; t2.drawImage(this.mask, 0, 0); t2.filter = 'none';
    g.clearRect(0, 0, W, H); g.drawImage(this.tmp, 0, 0);
    this.maskDone = true;
  }
  // the wall, 10 × 3.2 m: plaster over brick, a rolled-down shutter, a drain
  // pipe, a cable, the poster and the spray; lit by a sodium lamp (base) and
  // by the fluorescent tube over the poster (a second canvas, it flickers)
  paintWall(r) {
    const Wm = 10, Hm = 3.2, S = PPM_WALL, cw = Wm * S, ch = Hm * S;
    const c = canvas(cw, ch), g = c.getContext('2d');
    const X = (x) => (x + Wm / 2) * S, Y = (y) => (Hm - y) * S;
    // plaster: blotchy grey-beige, darker at the bottom where the rain splashes it
    const img = g.createImageData(cw, ch), d = img.data;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const u = x / S, v = Hm - y / S;
      let l = 0.38 + fbm2(u * 1.3, v * 1.3, 4, 81) * 0.22 + (noise2(u * 40, v * 40, 82) - 0.5) * 0.05;
      // streaks where water runs down from the sills
      l -= Math.max(0, fbm2(u * 6, v * 0.25, 2, 83) - 0.55) * 0.5;
      l *= v < 0.35 ? 0.55 + v : 1;
      const o = (y * cw + x) * 4; d[o] = l * 140; d[o + 1] = l * 132; d[o + 2] = l * 120; d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // plaster fallen away: bricks behind it
    for (const [x0, y0, w, h] of [[-4.6, 0.25, 0.9, 0.55], [3.1, 1.9, 0.7, 0.45], [-1.6, 0.05, 0.5, 0.3]]) {
      g.save(); g.beginPath();
      for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU, rr = 0.75 + r() * 0.35; g.lineTo(X(x0 + w / 2 + Math.cos(a) * w / 2 * rr), Y(y0 + h / 2 + Math.sin(a) * h / 2 * rr)); }
      g.closePath(); g.clip();
      g.fillStyle = '#3a2620'; g.fillRect(X(x0 - 0.2), Y(y0 + h + 0.2), (w + 0.4) * S, (h + 0.4) * S);
      g.strokeStyle = '#1e1512'; g.lineWidth = 0.012 * S;
      for (let y = 0; y < Hm; y += 0.075) { g.beginPath(); g.moveTo(X(x0 - 1), Y(y)); g.lineTo(X(x0 + w + 1), Y(y)); g.stroke(); const off = (Math.round(y / 0.075) % 2) * 0.11; for (let x = x0 - 1 + off; x < x0 + w + 1; x += 0.22) { g.beginPath(); g.moveTo(X(x), Y(y)); g.lineTo(X(x), Y(y + 0.075)); g.stroke(); } }
      g.restore();
      g.strokeStyle = 'rgba(30,26,22,0.6)'; g.lineWidth = 2; g.stroke();
    }
    // a rolled-down shop shutter on the left: ribs, rust at the bottom, old tags
    { const x0 = -4.9, x1 = -1.9, y1 = 2.55; g.fillStyle = '#4a4a4a'; g.fillRect(X(x0), Y(y1), (x1 - x0) * S, y1 * S);
      for (let y = 0; y < y1; y += 0.07) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(X(x0), Y(y + 0.012), (x1 - x0) * S, 0.012 * S); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(X(x0), Y(y + 0.05), (x1 - x0) * S, 0.006 * S); }
      const rg = g.createLinearGradient(0, Y(0.5), 0, Y(0)); rg.addColorStop(0, 'rgba(90,50,30,0)'); rg.addColorStop(1, 'rgba(90,50,30,0.6)'); g.fillStyle = rg; g.fillRect(X(x0), Y(0.5), (x1 - x0) * S, 0.5 * S);
      g.fillStyle = '#2b2b2b'; g.fillRect(X(x0 - 0.06), Y(y1 + 0.32), (x1 - x0 + 0.12) * S, 0.32 * S);
      // old tags, half scrubbed off
      g.save(); g.globalAlpha = 0.35; g.strokeStyle = '#1d2a44'; g.lineWidth = 0.03 * S; g.lineCap = 'round';
      g.beginPath(); g.moveTo(X(-4.5), Y(1.1)); g.bezierCurveTo(X(-4.2), Y(1.6), X(-3.9), Y(0.8), X(-3.6), Y(1.3)); g.bezierCurveTo(X(-3.4), Y(1.6), X(-3.1), Y(1.0), X(-2.8), Y(1.2)); g.stroke(); g.restore(); }
    // the drain pipe and its brackets, a dark wet streak down the plaster beside it
    { const x = 1.75; g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X(x - 0.12), 0, 0.3 * S, ch);
      const pg = g.createLinearGradient(X(x - 0.055), 0, X(x + 0.055), 0); pg.addColorStop(0, '#1d1d1f'); pg.addColorStop(0.35, '#55565a'); pg.addColorStop(0.6, '#2e2f32'); pg.addColorStop(1, '#141416');
      g.fillStyle = pg; g.fillRect(X(x - 0.055), 0, 0.11 * S, ch - 0.05 * S);
      for (const y of [0.6, 1.8, 3.0]) { g.fillStyle = '#18181a'; g.fillRect(X(x - 0.075), Y(y + 0.03), 0.15 * S, 0.03 * S); }
      // the shoe at the bottom
      g.fillStyle = '#26272a'; g.beginPath(); g.moveTo(X(x - 0.055), Y(0.14)); g.lineTo(X(x + 0.055), Y(0.14)); g.lineTo(X(x + 0.16), Y(0.02)); g.lineTo(X(x - 0.04), Y(0.02)); g.closePath(); g.fill(); }
    // a cable along the wall at 2.6 m, clipped every half metre, sagging between
    { g.strokeStyle = '#121212'; g.lineWidth = 0.014 * S; g.beginPath(); for (let x = -5; x <= 5; x += 0.5) { g.moveTo(X(x), Y(2.62)); g.quadraticCurveTo(X(x + 0.25), Y(2.6), X(x + 0.5), Y(2.62)); } g.stroke(); }
    // the poster: 0.7 × 1.0 m, on top of older ones, wet and torn
    const px = -0.25, py = 0.82, pw = 0.95, ph = 1.35;
    // older posters underneath, showing at the edges and through the tear
    g.fillStyle = '#c7b98f'; g.fillRect(X(px - 0.08), Y(py + ph + 0.06), (pw + 0.2) * S, (ph + 0.12) * S);
    g.fillStyle = '#8f3a2c'; g.fillRect(X(px + 0.3), Y(py + 0.32), 0.45 * S, 0.3 * S);
    g.fillStyle = '#d8d2c0'; g.fillRect(X(px - 0.12), Y(py + 0.25), 0.2 * S, 0.3 * S);
    const P0 = canvas(pw * S, ph * S), q = P0.getContext('2d'), w = P0.width, h = P0.height;
    q.fillStyle = '#121418'; q.fillRect(0, 0, w, h);
    // top band and the Syndicate mark: a ring cut by a chevron
    q.fillStyle = '#7d1418'; q.fillRect(0, 0, w, h * 0.16);
    q.strokeStyle = '#e9e3d6'; q.lineWidth = h * 0.012; q.beginPath(); q.arc(w * 0.5, h * 0.08, h * 0.05, 0, TAU); q.stroke();
    q.fillStyle = '#e9e3d6'; q.beginPath(); q.moveTo(w * 0.5 - h * 0.04, h * 0.055); q.lineTo(w * 0.5, h * 0.11); q.lineTo(w * 0.5 + h * 0.04, h * 0.055); q.lineTo(w * 0.5 + h * 0.025, h * 0.055); q.lineTo(w * 0.5, h * 0.09); q.lineTo(w * 0.5 - h * 0.025, h * 0.055); q.closePath(); q.fill();
    // the picture: a helmeted head in profile, hard light, halftone
    { const cx = w * 0.5, cy = h * 0.47, R = h * 0.2;
      const gr = q.createRadialGradient(cx - R * 0.4, cy - R * 0.4, 0, cx, cy, R * 2.2); gr.addColorStop(0, '#4b4f57'); gr.addColorStop(1, '#16181c');
      q.fillStyle = gr; q.fillRect(w * 0.06, h * 0.2, w * 0.88, h * 0.52);
      q.fillStyle = '#08090b'; q.beginPath(); q.ellipse(cx, cy, R * 0.9, R, 0, 0, TAU); q.fill();
      q.fillRect(cx - R * 0.55, cy + R * 0.6, R * 1.2, R * 0.9);
      q.fillStyle = '#a3131c'; q.fillRect(cx + R * 0.1, cy - R * 0.05, R * 0.78, R * 0.13);
      q.globalCompositeOperation = 'overlay'; for (let yy = h * 0.2; yy < h * 0.72; yy += 3) for (let xx = w * 0.06; xx < w * 0.94; xx += 3) { q.fillStyle = ((xx + yy) / 3) % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'; q.fillRect(xx, yy, 1.5, 1.5); } q.globalCompositeOperation = 'source-over'; }
    // the slogan
    q.fillStyle = '#ece7da'; q.textAlign = 'center'; q.textBaseline = 'middle';
    q.font = `700 ${Math.round(h * 0.07)}px Rajdhani, "Arial Narrow", sans-serif`;
    q.fillText('DÜZEN · GÜVENLİK · İTAAT', w * 0.5, h * 0.8);
    q.font = `500 ${Math.round(h * 0.026)}px Rajdhani, sans-serif`; q.fillStyle = 'rgba(236,231,218,0.6)';
    q.fillText('VANTA SENDİKASI  ·  KAMU DÜZENİ DAİRESİ', w * 0.5, h * 0.9);
    // the rain has had it: blotches, a sag, the paste showing at the seams
    q.globalCompositeOperation = 'multiply'; for (let i = 0; i < 30; i++) { const x = r() * w, y = r() * h, rr = 5 + r() * 30; const gg = q.createRadialGradient(x, y, 0, x, y, rr); gg.addColorStop(0, 'rgba(120,110,95,0.4)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gg; q.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    q.globalCompositeOperation = 'source-over';
    q.strokeStyle = 'rgba(255,255,255,0.05)'; q.lineWidth = 1; for (let i = 0; i < 12; i++) { const y = r() * h; q.beginPath(); q.moveTo(0, y); q.bezierCurveTo(w * 0.3, y + r() * 6 - 3, w * 0.6, y + r() * 6 - 3, w, y + r() * 8 - 4); q.stroke(); }
    // torn: the lower right corner gone, a strip peeled down the left
    q.globalCompositeOperation = 'destination-out'; q.beginPath(); q.moveTo(w, h * 0.58);
    for (let i = 0; i <= 12; i++) { const k = i / 12; q.lineTo(w - k * w * 0.42 + (r() - 0.5) * 8, h * 0.58 + k * h * 0.42 + (r() - 0.5) * 8); }
    q.lineTo(w, h); q.closePath(); q.fill();
    q.beginPath(); q.moveTo(w * 0.04, h * 0.34); for (let i = 0; i <= 10; i++) q.lineTo(w * (0.04 + (r() - 0.5) * 0.02), h * (0.34 + i * 0.05)); for (let i = 10; i >= 0; i--) q.lineTo(w * (0.13 + (r() - 0.5) * 0.03), h * (0.34 + i * 0.05)); q.closePath(); q.fill();
    q.globalCompositeOperation = 'source-over';
    // the paper's white back where it tore
    q.strokeStyle = 'rgba(225,220,205,0.8)'; q.lineWidth = 2; q.beginPath(); q.moveTo(w, h * 0.58); q.lineTo(w * 0.58, h); q.stroke();
    g.drawImage(P0, X(px), Y(py + ph));
    // KOR, sprayed fast across the lower left of the poster, and the ember mark
    { g.save(); g.translate(X(px + 0.06), Y(py + 0.38)); g.rotate(-0.08);
      g.strokeStyle = '#ff6a1c'; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 0.028 * S;
      const L = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x * S, -y * S) : g.moveTo(x * S, -y * S))); g.stroke(); };
      L([[0, 0], [0, 0.22]]); L([[0.13, 0.22], [0.01, 0.1], [0.14, 0]]);
      g.beginPath(); g.ellipse(0.25 * S, -0.11 * S, 0.065 * S, 0.11 * S, 0, 0, TAU); g.stroke();
      L([[0.36, 0], [0.36, 0.22], [0.44, 0.22], [0.47, 0.17], [0.44, 0.12], [0.36, 0.12]]); L([[0.42, 0.12], [0.48, 0]]);
      // overspray, and drips running down
      g.globalAlpha = 0.25; g.lineWidth = 0.05 * S; L([[0, 0], [0, 0.22]]); g.globalAlpha = 1;
      g.lineWidth = 0.006 * S; for (const [x, y, l] of [[0, 0, 0.12], [0.13, 0, 0.07], [0.25, 0, 0.16], [0.36, 0, 0.09], [0.48, 0, 0.05]]) L([[x, y], [x + 0.003, y - l]]);
      // the ember: a coal with three short heat strokes above it
      g.translate(0.62 * S, -0.06 * S); g.fillStyle = '#ff6a1c';
      g.beginPath(); g.moveTo(0, -0.05 * S); g.lineTo(0.05 * S, 0); g.lineTo(0, 0.05 * S); g.lineTo(-0.05 * S, 0); g.closePath(); g.fill();
      g.lineWidth = 0.012 * S; for (const dx of [-0.035, 0, 0.035]) L([[dx, 0.08], [dx + 0.01, 0.14]]);
      for (let i = 0; i < 160; i++) { const a = r() * TAU, rr = (0.05 + r() * 0.4) * S; g.fillStyle = `rgba(255,106,28,${(r() * 0.4).toFixed(2)})`; g.fillRect(-0.3 * S + Math.cos(a) * rr, Math.sin(a) * rr * 0.5, 1.2, 1.2); }
      g.restore(); }
    // light: the sodium lamp up the street to the left, a falloff across the wall
    const base = canvas(cw, ch), b = base.getContext('2d');
    b.drawImage(c, 0, 0);
    b.globalCompositeOperation = 'multiply';
    const lg = b.createRadialGradient(X(-6), Y(5.5), 0, X(-6), Y(5.5), 9 * S);
    lg.addColorStop(0, 'rgb(235,160,80)'); lg.addColorStop(0.4, 'rgb(140,92,48)'); lg.addColorStop(1, 'rgb(36,25,16)');
    b.fillStyle = lg; b.fillRect(0, 0, cw, ch);
    // the tube's light: a cold cone down the wall from 2.35 m, over the poster
    const tube = canvas(cw, ch), tg = tube.getContext('2d');
    tg.drawImage(c, 0, 0);
    tg.globalCompositeOperation = 'multiply';
    const tl = tg.createRadialGradient(X(0.25), Y(2.75), 0, X(0.25), Y(2.75), 2.4 * S);
    tl.addColorStop(0, 'rgb(210,225,235)'); tl.addColorStop(0.35, 'rgb(120,130,138)'); tl.addColorStop(1, 'rgb(0,0,0)');
    tg.fillStyle = tl; tg.fillRect(0, 0, cw, ch);
    // the tube itself and its holder
    for (const cv of [base, tube]) { const k = cv.getContext('2d'); k.globalCompositeOperation = 'source-over'; k.fillStyle = '#1a1b1d'; k.fillRect(X(-0.4), Y(2.79), 1.3 * S, 0.06 * S); }
    tg.globalCompositeOperation = 'source-over'; tg.fillStyle = '#eef4f8'; tg.fillRect(X(-0.35), Y(2.75), 1.2 * S, 0.025 * S);
    return { base, tube, cw, ch, Wm, Hm };
  }
  update(dt, t) {
    const cam = this.cam; cam.update(t);
    this.mcam = mirrorCam(cam, 0);
    // rain on the puddle: rings
    const n = dt * 26;
    for (let i = 0; i < n || Math.random() < n - i; i++) { const x = (Math.random() - 0.5) * 6, z = 1.8 + Math.random() * 5; if (this.puddle(x, z)) this.rings.push({ x, z, t: 0, s: 0.7 + Math.random() * 0.6 }); if (i > 40) break; }
    for (const q of this.rings) q.t += dt;
    this.rings = this.rings.filter((q) => q.t < 0.7);
    this.rain.update(dt, cam, 0, false);
    this.tubeOn = this.tube(t);
  }
  // a failing fluorescent: mostly on, drops out in short stutters
  tube(t) {
    const k = Math.floor(t * 14), h = noise2(k * 0.37, 3, 9);
    if (h < 0.22) return 0.05;
    if (h < 0.3) return 0.45;
    return 0.92 + 0.08 * noise1(t * 50, 4);
  }
  focusAt(t) { return lerp(2.4, 2 * WALL_Z * 0.95, smooth(2.8, 4.3, t)); }
  wallRect(cam) { const a = cam.project(-this.wall.Wm / 2, this.wall.Hm, WALL_Z), b = cam.project(this.wall.Wm / 2, 0, WALL_Z); return [a[0], a[1], b[0] - a[0], b[1] - a[1]]; }
  drawWorld(g, cam, t, mir) {
    const W = this.W, H = this.H;
    // the wall and its lights
    const [x, y, w, h] = this.wallRect(cam);
    g.save();
    if (mir) {
      // the waterline is the wall's foot; the wall hangs down from it
      const top = y + h, bot = y; g.translate(0, top + bot); g.scale(1, -1);
      g.drawImage(this.wall.base, x, top, w, bot - top); g.globalCompositeOperation = 'lighter'; g.globalAlpha = this.tubeOn; g.drawImage(this.wall.tube, x, top, w, bot - top);
    }
    else { g.drawImage(this.wall.base, x, y, w, h); g.globalCompositeOperation = 'lighter'; g.globalAlpha = this.tubeOn; g.drawImage(this.wall.tube, x, y, w, h); }
    g.restore();
    // the pavement in front of the wall and the kerb
    const k0 = cam.project(-6, 0.13, KERB_Z), k1 = cam.project(6, 0.13, KERB_Z), k2 = cam.project(6, 0.13, WALL_Z), k3 = cam.project(-6, 0.13, WALL_Z);
    g.fillStyle = '#17130f'; g.beginPath(); g.moveTo(k0[0], k0[1]); g.lineTo(k1[0], k1[1]); g.lineTo(k2[0], k2[1]); g.lineTo(k3[0], k3[1]); g.closePath(); g.fill();
    const c0 = cam.project(-6, 0, KERB_Z), c1 = cam.project(6, 0, KERB_Z);
    g.fillStyle = '#26211b'; g.beginPath(); g.moveTo(c0[0], c0[1]); g.lineTo(c1[0], c1[1]); g.lineTo(k1[0], k1[1]); g.lineTo(k0[0], k0[1]); g.closePath(); g.fill();
    // the tube glows; in the water it is a bar of light
    if (this.tubeOn > 0.1) { const tq = cam.project(0.25, 2.75, WALL_Z - 0.05); glow(g, tq[0], tq[1], 0.9 * tq[3], '#cfe0ea', 0.3 * this.tubeOn); glow(g, tq[0], tq[1], 0.12 * tq[3], '#ffffff', 0.7 * this.tubeOn); }
    void W; void H;
  }
  draw(g, t) {
    const W = this.W, H = this.H, cam = this.cam, mc = this.mcam;
    if (!this.maskDone) { this.ground.finish(); this.makeMask(); }
    cam.focus = this.focusAt(t);
    const blur = (Z) => cam.coc(Z, 2.2) / 2.3;
    // the real street, top of the frame
    const rg = this.real.getContext('2d'); rg.setTransform(1, 0, 0, 1, 0, 0); rg.globalCompositeOperation = 'source-over'; rg.globalAlpha = 1; rg.filter = 'none'; rg.clearRect(0, 0, W, H);
    rg.fillStyle = '#0a0908'; rg.fillRect(0, 0, W, H);
    this.drawWorld(rg, cam, t, false);
    const bR = blur(8);
    if (bR > 0.6) { g.filter = `blur(${bR.toFixed(1)}px)`; g.drawImage(this.real, 0, 0); g.filter = 'none'; } else g.drawImage(this.real, 0, 0);
    // the ground (asphalt; the puddle's surface is dark glass)
    this.ground.draw(g, cam, [this.tubeOn]);
    // the reflection: the same street, upside down, in the puddle
    const fg = this.refl.getContext('2d'); fg.setTransform(1, 0, 0, 1, 0, 0); fg.globalCompositeOperation = 'source-over'; fg.globalAlpha = 1; fg.filter = 'none';
    fg.fillStyle = '#060505'; fg.fillRect(0, 0, W, H);
    this.drawWorld(fg, mc, t, true);
    // ripples: rows nudged sideways by the wind and the rain
    const tg = this.tmp.getContext('2d'); tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'source-over'; tg.globalAlpha = 1; tg.clearRect(0, 0, W, H);
    for (let y = 0; y < H; y += 2) { const o = noise1(y * 0.11 + t * 2.4, 5) * 1.6 + noise1(y * 0.37 - t * 5, 6) * 0.7; tg.drawImage(this.refl, 0, y, W, 2, o, y, W, 2); }
    // the water takes most of it at this angle; darker, a little warm
    tg.globalCompositeOperation = 'source-atop'; tg.fillStyle = 'rgba(12,7,3,0.3)'; tg.fillRect(0, 0, W, H);
    tg.globalCompositeOperation = 'destination-in'; tg.drawImage(this.mask, 0, 0);
    const bV = blur(2 * WALL_Z * 0.9);
    g.save(); if (bV > 0.6) g.filter = `blur(${bV.toFixed(1)}px)`; g.drawImage(this.tmp, 0, 0); g.restore();
    // on the water: rings from the rain, a cigarette end, a leaf, a sheen of oil
    const sf = this.refl.getContext('2d'); sf.setTransform(1, 0, 0, 1, 0, 0); sf.globalCompositeOperation = 'source-over'; sf.globalAlpha = 1; sf.clearRect(0, 0, W, H);
    for (const q of this.rings) {
      const k = q.t / 0.7, c = cam.project(q.x, 0, q.z), R = (0.01 + Math.sqrt(k) * 0.05) * q.s * c[3];
      sf.strokeStyle = `rgba(210,200,190,${(0.35 * (1 - k)).toFixed(3)})`; sf.lineWidth = Math.max(0.5, 0.003 * c[3]);
      sf.beginPath(); sf.ellipse(c[0], c[1], R, R * Math.max(0.05, Math.abs(cam.pos[1] / q.z) * 1.1), 0, 0, TAU); sf.stroke();
      if (k > 0.25) { sf.strokeStyle = `rgba(0,0,0,${(0.25 * (1 - k)).toFixed(3)})`; sf.beginPath(); sf.ellipse(c[0], c[1], R * 0.6, R * 0.6 * Math.abs(cam.pos[1] / q.z) * 1.1, 0, 0, TAU); sf.stroke(); }
    }
    for (const d of this.debris) {
      const c = cam.project(d.x, 0.002, d.z), s = c[3];
      // a cigarette end, floating: a segment lying on the water, filter and paper
      if (d.k < 0.3) { const ca = Math.cos(d.a), sa = Math.sin(d.a), a0 = cam.project(d.x - ca * 0.03, 0.003, d.z - sa * 0.03), a1 = cam.project(d.x + ca * 0.01, 0.003, d.z + sa * 0.01), a2 = cam.project(d.x + ca * 0.03, 0.003, d.z + sa * 0.03);
        sf.lineCap = 'round'; sf.lineWidth = Math.max(0.8, 0.008 * s); sf.strokeStyle = '#a9a294'; sf.beginPath(); sf.moveTo(a0[0], a0[1]); sf.lineTo(a1[0], a1[1]); sf.stroke(); sf.strokeStyle = '#7a5a30'; sf.beginPath(); sf.moveTo(a1[0], a1[1]); sf.lineTo(a2[0], a2[1]); sf.stroke(); }
      else if (d.k < 0.55) { sf.fillStyle = 'rgba(20,13,8,0.9)'; sf.beginPath(); sf.ellipse(c[0], c[1], 0.025 * s, 0.025 * s * Math.abs(cam.pos[1] / d.z) * 1.2, d.a * 0.1, 0, TAU); sf.fill(); }
    }
    // oil: a faint rainbow drifting on the surface
    { const c = cam.project(1.1, 0, 2.6), R = 0.5 * c[3]; const gr = sf.createRadialGradient(c[0], c[1], R * 0.2, c[0], c[1], R);
      gr.addColorStop(0, 'rgba(80,120,90,0)'); gr.addColorStop(0.5, 'rgba(110,70,120,0.06)'); gr.addColorStop(0.75, 'rgba(60,110,130,0.06)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      sf.fillStyle = gr; sf.beginPath(); sf.ellipse(c[0] + Math.sin(t * 0.3) * 4, c[1], R, R * 0.12, 0, 0, TAU); sf.fill(); }
    const bS = blur(2.6);
    g.save(); g.globalCompositeOperation = 'source-over'; if (bS > 0.6) g.filter = `blur(${bS.toFixed(1)}px)`; g.drawImage(this.refl, 0, 0); g.restore();
    // rain between us and the street
    this.rain.draw(g, cam, { col: '#cbb9a2', light: 0.55 });
  }
  post() { return { grain: 0.08, halation: 0.4, lift: [5, 5, 6], warm: 0.04, cool: 0.05, vignette: 0.55, dirt: 0.5, flicker: 0.015 }; }
}


export { Basement, Scarf, Alley } from './shots2.js';
