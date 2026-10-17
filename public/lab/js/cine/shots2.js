// KOR — cinematics: shots 7–9 of the prologue (docs/KOR_STORY_CINEMATIC.md §2).
import { Cam, mirrorCam } from './cam.js';
import { Human, ik2 } from './human.js';
import { Rain, Puffs, softDot, tinted, glow, poly, reflect } from './fx.js';
import { canvas, fbm2, noise1, noise2, rng, clamp, lerp, smooth } from './noise.js';
import { v3, lit, tone, capsule3, box3, cyl3, capsulePts, boxPts, shadow, handParts } from './solid.js';

const TAU = Math.PI * 2;
const { add, sub, mul, norm } = v3;
const ease = (a, b, t) => smooth(a, b, t);

// ---------------------------------------------------------------------------------------------
// shot 7: the table (§2, shot 7). Seen from above, under a lamp with an enamel
// shade swinging on its flex (0.45 Hz, 14°): the pool of light moves over a
// map of the town marked up in pencil and red; a radio with a green light and
// its aerial, two mugs, a magazine and loose rounds. The four of them are
// their hands: WARDEN's fists on the far edge (he puts one down on the gate
// as he talks), SKYE's palms flat at the right end (one slides to the tower),
// BULWARK's hand round a mug (he takes it away at 5.5 s, leaving its ring),
// VESPER's hand near us with a pencil on the route. Every shadow swings with
// the lamp. The camera creeps in (a slow zoom, 40 → 43 mm).
const TY = 0.78, TB = { x0: -0.82, x1: 0.82, z0: -0.46, z1: 0.46 };
const MAP = { cx: -0.02, cz: 0.02, w: 0.92, h: 0.62, rot: 0.045 };
export class Basement {
  init(W, H, env) {
    this.W = W; this.H = H; this.env = env;
    const cam = this.cam = new Cam(W, H);
    cam.mm = 40; cam.pos = [0.1, 1.98, -1.4]; cam.pitch = -0.72; cam.yaw = -0.05; cam.hand = 0.2; cam.seed = 71;
    this.setCam?.(cam); cam.update(0);
    this.pivot = [0.04, 2.38, 0.03]; this.flex = 0.66;
    this.mapR = this.mapR || MAP;
    this.mapTex = this.paintMap(rng(77));
    this.bake();
    this.light = canvas(W, H); this.sh = canvas(W, H); this.near = canvas(W, H);
    this.motes = Array.from({ length: 60 }, () => ({ x: -0.6 + Math.random() * 1.2, y: TY + 0.15 + Math.random() * 0.7, z: -0.4 + Math.random() * 0.8, s: Math.random(), ph: Math.random() * 9 }));
  }
  lamp(t) {
    const th = 0.244 * Math.sin(t * TAU * 0.45 + 0.6), ph = 0.07 * Math.sin(t * TAU * 0.45 + 2.0);
    const ax = [Math.sin(th), -Math.cos(th) * Math.cos(ph), Math.sin(ph)], L = this.flex, p = this.pivot;
    const bulb = [p[0] + ax[0] * L, p[1] + ax[1] * L, p[2] + ax[2] * L];
    return { p: bulb, axis: ax, I: 0.95 * (0.98 + 0.02 * noise1(t * 40, 3)), cos0: 0.32, cos1: 0.6 };
  }
  // the town map: blocks, streets, the river, the railway to the steelworks;
  // the plan on it in pencil and red; folds, wear, tape
  paintMap(r) {
    const S = 1100, w = Math.round(MAP.w * S), h = Math.round(MAP.h * S), c = canvas(w, h), g = c.getContext('2d');
    g.fillStyle = '#cfc4a6'; g.fillRect(0, 0, w, h);
    // blocks on a slightly rotated grid, an old quarter with crooked streets
    g.save(); g.translate(w * 0.5, h * 0.5); g.rotate(0.12);
    for (let y = -h; y < h; y += 46) for (let x = -w; x < w; x += 58) { if (r() < 0.08) continue; g.fillStyle = r() < 0.12 ? '#b9c49c' : '#e3d8b8'; g.fillRect(x + 4, y + 4, 50 + (r() - 0.5) * 6, 38 + (r() - 0.5) * 6); }
    g.restore();
    // the main roads, yellow; the river; the railway
    g.lineCap = 'round';
    g.strokeStyle = '#d9b860'; g.lineWidth = 9; g.beginPath(); g.moveTo(-10, h * 0.62); g.bezierCurveTo(w * 0.3, h * 0.55, w * 0.55, h * 0.7, w + 10, h * 0.48); g.stroke();
    g.strokeStyle = '#8a7f63'; g.lineWidth = 1.2; g.stroke();
    g.strokeStyle = '#9fb2b4'; g.lineWidth = 26; g.beginPath(); g.moveTo(w * 0.12, -10); g.bezierCurveTo(w * 0.2, h * 0.3, w * 0.08, h * 0.6, w * 0.22, h + 10); g.stroke();
    g.strokeStyle = '#222'; g.lineWidth = 4; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(w * 0.4, h + 5); g.lineTo(w * 0.86, h * 0.12); g.stroke(); g.setLineDash([]);
    // the works, hatched; the governor's building; the gate; the tower
    g.save(); g.beginPath(); g.rect(w * 0.7, h * 0.04, w * 0.27, h * 0.26); g.clip(); g.strokeStyle = 'rgba(60,50,40,0.5)'; g.lineWidth = 1.2; for (let i = -40; i < 80; i++) { g.beginPath(); g.moveTo(w * 0.7 + i * 8, h * 0.04); g.lineTo(w * 0.7 + i * 8 - h * 0.3, h * 0.34); g.stroke(); } g.restore();
    g.strokeStyle = '#5c5240'; g.lineWidth = 2; g.strokeRect(w * 0.7, h * 0.04, w * 0.27, h * 0.26);
    g.fillStyle = '#3a3226'; g.font = '600 15px Rajdhani, sans-serif'; g.fillText('ÇELİKHANE', w * 0.74, h * 0.18);
    g.fillStyle = '#8e7d68'; g.fillRect(w * 0.36, h * 0.2, 46, 30); g.fillStyle = '#3a3226'; g.font = '600 12px Rajdhani, sans-serif'; g.fillText('VALİLİK', w * 0.355, h * 0.18);
    g.font = '500 10px Rajdhani, sans-serif'; g.fillStyle = 'rgba(58,50,38,0.8)';
    for (const [t, x, y] of [['Liman Cd.', 0.28, 0.6], ['Fırın Sk.', 0.55, 0.44], ['Eski Çarşı', 0.3, 0.82], ['İskele', 0.06, 0.9]]) g.fillText(t, w * x, h * y);
    // the plan: a route in pencil from where we are to the gate, the gate ringed in red,
    // the tower crossed out, times written beside them
    g.strokeStyle = 'rgba(40,40,44,0.75)'; g.lineWidth = 2.2; g.setLineDash([6, 5]);
    g.beginPath(); g.moveTo(w * 0.22, h * 0.86); g.bezierCurveTo(w * 0.34, h * 0.74, w * 0.46, h * 0.66, w * 0.6, h * 0.42); g.lineTo(w * 0.7, h * 0.3); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.moveTo(w * 0.68, h * 0.27); g.lineTo(w * 0.71, h * 0.31); g.lineTo(w * 0.665, h * 0.315); g.stroke();
    g.strokeStyle = '#b3241b'; g.lineWidth = 3; g.beginPath(); g.ellipse(w * 0.71, h * 0.29, 26, 20, 0.3, 0.2, TAU + 0.05); g.stroke();
    g.fillStyle = '#b3241b'; g.font = 'italic 600 16px "Segoe Print", "Comic Sans MS", cursive'; g.fillText('KAPI', w * 0.74, h * 0.37);
    g.strokeStyle = '#b3241b'; g.lineWidth = 3; const tx = w * 0.48, ty = h * 0.3; g.beginPath(); g.moveTo(tx - 12, ty - 12); g.lineTo(tx + 12, ty + 12); g.moveTo(tx + 12, ty - 12); g.lineTo(tx - 12, ty + 12); g.stroke();
    g.fillText('KULE', tx + 16, ty - 6);
    g.fillStyle = 'rgba(40,40,44,0.85)'; g.font = 'italic 500 14px "Segoe Print", "Comic Sans MS", cursive';
    g.fillText('02:40', w * 0.56, h * 0.56); g.fillText('90 sn', w * 0.4, h * 0.76); g.fillText('5 dk!', w * 0.79, h * 0.44);
    g.beginPath(); g.arc(w * 0.22, h * 0.86, 6, 0, TAU); g.fill();
    // folds: the map has been folded in eight and opened many times
    for (const [x0, y0, x1, y1] of [[w / 2, 0, w / 2, h], [w / 4, 0, w / 4, h], [w * 3 / 4, 0, w * 3 / 4, h], [0, h / 2, w, h / 2]]) {
      const gr = g.createLinearGradient(x0 - 6, y0 - 6, x0 + 6, y0 + 6); g.strokeStyle = 'rgba(80,70,55,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = 'rgba(255,250,235,0.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0 + 2, y0); g.lineTo(x1 + 2, y1); g.stroke(); void gr;
    }
    // grime, foxing, a corner torn, a strip of tape
    const img = g.getImageData(0, 0, w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = fbm2(x * 0.01, y * 0.01, 4, 79), e = Math.min(x, y, w - x, h - y) / 40;
      const k = (0.86 + n * 0.18) * (e < 1 ? 0.75 + e * 0.25 : 1) * (0.97 + Math.random() * 0.06);
      const o = (y * w + x) * 4; d[o] *= k; d[o + 1] *= k * 0.985; d[o + 2] *= k * 0.95;
    }
    g.putImageData(img, 0, 0);
    g.fillStyle = 'rgba(230,225,200,0.55)'; g.save(); g.translate(w * 0.03, h * 0.05); g.rotate(-0.6); g.fillRect(-30, -10, 60, 20); g.restore();
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(w, h - 40); g.lineTo(w - 30, h); g.lineTo(w, h); g.closePath(); g.fill();
    return { c, data: g.getImageData(0, 0, w, h).data, w, h, S };
  }
  // the table and the floor from the camera, per pixel: wood, the map, a sheet
  // of notes, rings left by mugs; and where each pixel is, for the light
  bake() {
    const W = this.W, H = this.H, cam = this.bc = new Cam(W, H);
    cam.mm = this.bakeMM ?? 41.5; cam.pos = this.cam.pos.slice(); cam.pitch = this.cam.pitch; cam.yaw = this.cam.yaw; cam.update(0);
    const q = 3, lw = this.lw = Math.ceil(W / q), lh = this.lh = Math.ceil(H / q);
    this.P = new Float32Array(lw * lh * 3); this.kind = new Uint8Array(lw * lh);
    const alb = this.alb = canvas(W, H), g = alb.getContext('2d'), img = g.createImageData(W, H), d = img.data;
    const cy = Math.cos(cam._yaw), sy = Math.sin(cam._yaw), cp = Math.cos(cam._pitch), sp = Math.sin(cam._pitch), C = cam._p, f = cam.f;
    const MAP = this.mapR, M = this.mapTex, cr = Math.cos(-MAP.rot), sr = Math.sin(-MAP.rot);
    const rings = this.rings || [[-0.52, -0.05, 0.043, 0.5], [0.55, 0.22, 0.045, 0.3], [-0.3, 0.3, 0.04, 0.25], [0.2, -0.32, 0.05, 0.18]];
    for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
      const x1 = (X + 0.5 - W / 2) / f, y2 = -(Y + 0.5 - H / 2) / f;
      const dy = y2 * cp + sp, z1 = -y2 * sp + cp, dx = x1 * cy + z1 * sy, dz = -x1 * sy + z1 * cy;
      let t = (TY - C[1]) / dy, x = C[0] + dx * t, z = C[2] + dz * t, k = 1;
      if (!(dy < 0 && x > TB.x0 && x < TB.x1 && z > TB.z0 && z < TB.z1)) { t = -C[1] / dy; x = C[0] + dx * t; z = C[2] + dz * t; k = 2; }
      let c;
      if (k === 1) {
        // the map?
        const mx = x - MAP.cx, mz = z - MAP.cz, u = (mx * cr - mz * sr) / MAP.w + 0.5, v = 0.5 - (mx * sr + mz * cr) / MAP.h;
        if (u > 0 && u < 1 && v > 0 && v < 1 && M.data[((v * M.h | 0) * M.w + (u * M.w | 0)) * 4 + 3] > 10) { const o = ((v * M.h | 0) * M.w + (u * M.w | 0)) * 4; c = [M.data[o], M.data[o + 1], M.data[o + 2]]; }
        else if (!this.noNotes && x < -0.5 && x > -0.78 && z > 0.02 && z < 0.4) {
          // a sheet of notes, lines of a hand in pencil
          const ly = (z - 0.05) / 0.022, line = Math.abs(ly - Math.round(ly)) < 0.12 && ly > 0 && ly < 15 && noise2(x * 60, Math.round(ly), 5) > 0.35;
          c = line ? [92, 90, 92] : [196, 192, 178];
        } else {
          // the table: planks along x, grain, the varnish worn where hands go
          const plank = Math.floor((z + 1) / 0.115), pz = ((z + 1) / 0.115) % 1, seam = pz < 0.03;
          const grain = fbm2(x * 3 + plank * 7, z * 60 + fbm2(x * 2, plank, 2, 61) * 3, 3, 62);
          const wear = Math.max(0, fbm2(x * 4, z * 4, 2, 63) - 0.55) * 1.5;
          let l = (0.42 + grain * 0.35 + (noise2(plank, 3, 64) - 0.5) * 0.15) * (seam ? 0.45 : 1) + wear * 0.15;
          c = [l * 120, l * 82, l * 52];
        }
        // rings from mugs, darker at their edge
        for (const [rx, rz, rr, a] of rings) { const dd = Math.hypot(x - rx, z - rz) - rr; if (Math.abs(dd) < 0.004) { const k2 = 1 - a * (1 - Math.abs(dd) / 0.004); c = c.map((v2) => v2 * k2); } }
      } else {
        // the floor below, beyond the table's edge
        const l = 0.28 + fbm2(x * 1.5, z * 1.5, 3, 65) * 0.18;
        c = [l * 150, l * 145, l * 135];
      }
      const o = (Y * W + X) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      if (X % q === 0 && Y % q === 0) { const i = (Y / q) * lw + X / q; this.P[i * 3] = x; this.P[i * 3 + 1] = k === 1 ? TY : 0; this.P[i * 3 + 2] = z; this.kind[i] = k; }
    }
    g.putImageData(img, 0, 0);
    this.lm = canvas(lw, lh); this.lmImg = this.lm.getContext('2d').createImageData(lw, lh);
  }
  update(dt, t) { const cam = this.cam; cam.mm = lerp(40, 43, smooth(0, 7, t)); cam.update(t); }
  // the plate's place now: the zoom scales it about the centre; the hand moves it
  xf() {
    const cam = this.cam, bc = this.bc, k = cam.mm / bc.mm, ref = [0, TY, 0];
    const a = cam.project(...ref), b = bc.project(...ref);
    return { k, ox: a[0] - b[0] * k, oy: a[1] - b[1] * k };
  }
  // where the hands are at time t
  pose(t) {
    const o = {};
    // WARDEN: fists on the far edge; the right one lifts and comes down on the gate
    const tap = ease(1.25, 1.75, t), up = Math.sin(clamp((t - 1.25) / 0.5) * Math.PI) * 0.06;
    o.wL = { w: [-0.14, TY, 0.4], dir: [0.15, 0, -1], pose: 'fist', side: -1, elbow: [-0.24, 1.08, 0.66], sh: [-0.24, 1.42, 0.8], col: [30, 33, 26] };
    o.wR = { w: [lerp(0.15, 0.17, tap), TY + up, lerp(0.41, 0.24, tap)], dir: [-0.15, 0, -1], pose: 'fist', side: 1, elbow: [0.27, 1.08, 0.66], sh: [0.24, 1.42, 0.8], col: [30, 33, 26] };
    // SKYE: palms flat at the right end; one slides to the tower at 4.4 s
    const sl = ease(4.3, 5.0, t);
    o.sL = { w: [lerp(0.7, 0.13, sl), TY, lerp(-0.13, 0.11, sl)], dir: [-1, 0, 0.1], pose: 'flat', side: -1, elbow: [1.3, 1.25, -0.1], sh: [lerp(1.12, 0.72, sl), lerp(1.36, 1.24, sl), lerp(-0.06, 0.02, sl)], col: [34, 37, 42] };
    o.sR = { w: [0.72, TY, 0.17], dir: [-1, 0, -0.15], pose: 'flat', side: 1, elbow: [1.3, 1.25, 0.3], sh: [1.15, 1.38, 0.1], col: [34, 37, 42] };
    // BULWARK: his hand round a mug; he takes it away at 5.5 s
    const lift = ease(5.4, 6.4, t);
    o.mug = [lerp(-0.52, -0.78, lift), TY + lift * 0.55, lerp(-0.05, 0.0, lift)];
    o.b = { w: [o.mug[0] - 0.095, o.mug[1] + 0.045, o.mug[2] - 0.01], dir: [1, 0, 0.05], pose: 'grip', side: 1, elbow: [-0.86 - lift * 0.1, 1.0 + lift * 0.2, -0.02], sh: [-1.12, 1.38, 0.05], col: [18, 18, 19] };
    // VESPER: near us, a pencil on the route, tracing it
    const tr = ease(0.4, 3.6, t) * 0.07;
    o.vTip = [-0.15 + tr, TY, -0.25 + tr * 0.6];
    o.v = { w: [o.vTip[0] - 0.1, TY + 0.05, o.vTip[2] - 0.11], dir: [0.5, 0, 0.6], pose: 'grip', side: 1, elbow: [-0.45, 0.86, -0.56], sh: [-0.66, 1.12, -0.82], col: [40, 30, 24] };
    return o;
  }
  // every hand and arm as capsules [a, b, ra, rb, col]
  armParts(h0) {
    let h = h0;
    const parts = handParts(h0.w, h0.dir, h0.pose, h0.side).map(([a, b, ra, rb]) => [a, b, ra, rb, [16, 16, 17]]);
    // the elbow from the shoulder and the wrist (upper arm 0.31 m, forearm 0.28 m),
    // bending the way the hint points
    const mid = v3.lerp(h.sh, h.w, 0.5), elbow = ik2(h.sh, h.w, 0.31, 0.28, sub(h.elbow, mid));
    h = { ...h, elbow };
    // the cuff of the sleeve over the glove, the forearm, the upper arm
    const cuff = add(h.w, mul(norm(sub(h.elbow, h.w)), 0.05));
    parts.unshift([h.w, cuff, 0.036, 0.046, [14, 14, 15]], [cuff, h.elbow, 0.05, 0.06, h.col], [h.elbow, h.sh, 0.064, 0.07, h.col]);
    return parts;
  }
  draw(g, t) {
    const W = this.W, H = this.H, cam = this.cam, Lm = this.lamp(t), o = this.pose(t);
    // light on the table and the floor, a third of the size
    const lw = this.lw, lh = this.lh, d = this.lmImg.data, P = this.P;
    for (let i = 0, n = lw * lh; i < n; i++) {
      const v = lit(Lm, [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]], [0, 1, 0], 0.025) * (this.kind[i] === 2 ? 0.8 : 1);
      const j = i * 4; d[j] = Math.min(255, v * 250); d[j + 1] = Math.min(255, v * 190); d[j + 2] = Math.min(255, v * 130); d[j + 3] = 255;
    }
    this.lm.getContext('2d').putImageData(this.lmImg, 0, 0);
    const X = this.xf(), lg = this.light.getContext('2d');
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.globalAlpha = 1; lg.filter = 'none';
    lg.fillStyle = '#000'; lg.fillRect(0, 0, W, H);
    lg.imageSmoothingEnabled = true; lg.imageSmoothingQuality = 'high';
    lg.setTransform(X.k, 0, 0, X.k, X.ox, X.oy); lg.drawImage(this.lm, 0, 0, W, H); lg.setTransform(1, 0, 0, 1, 0, 0);
    // shadows on the table: everything on it and over it, thrown from the lamp
    const sg = this.sh.getContext('2d');
    sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = 'source-over'; sg.globalAlpha = 1; sg.filter = 'none'; sg.clearRect(0, 0, W, H);
    const things = this.things(o);
    // the table's own shadow on the floor round it (not over the table itself)
    shadow(sg, cam, Lm.p, boxPts([0, TY, 0], [0.82, 0, 0], [0, 0.02, 0], [0, 0, 0.46]), 0.0);
    { const q = [[TB.x0, TB.z0], [TB.x1, TB.z0], [TB.x1, TB.z1], [TB.x0, TB.z1]].map(([x, z]) => cam.project(x, TY, z)); sg.globalCompositeOperation = 'destination-out'; sg.beginPath(); q.forEach((v, i) => (i ? sg.lineTo(v[0], v[1]) : sg.moveTo(v[0], v[1]))); sg.closePath(); sg.fill(); sg.globalCompositeOperation = 'source-over'; }
    for (const pts of things.shadows) shadow(sg, cam, Lm.p, pts, TY);
    lg.save(); lg.globalCompositeOperation = 'destination-out'; lg.globalAlpha = 0.82; lg.filter = `blur(${Math.max(1, W * 0.0025).toFixed(1)}px)`; lg.drawImage(this.sh, 0, 0); lg.restore();
    lg.save(); lg.globalCompositeOperation = 'destination-over'; lg.fillStyle = 'rgb(7,6,5)'; lg.fillRect(0, 0, W, H); lg.restore();
    // the plate, lit
    g.setTransform(X.k, 0, 0, X.k, X.ox, X.oy); g.drawImage(this.alb, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
    g.save(); g.globalCompositeOperation = 'multiply'; g.drawImage(this.light, 0, 0); g.restore();
    // the varnish shines where the lamp's image falls in it
    { const e = cam._p, Lp = Lm.p, k = (TY - e[1]) / ((TY - e[1]) + (TY - Lp[1])), hx = e[0] + (Lp[0] - e[0]) * k, hz = e[2] + (Lp[2] - e[2]) * k, q = cam.project(hx, TY, hz);
      if (q[2] > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.18; g.drawImage(tinted(softDot(64), '#ffcf9a'), q[0] - 0.22 * q[3], q[1] - 0.1 * q[3], 0.44 * q[3], 0.2 * q[3]); g.restore(); } }
    // the near edge of the table
    { const a = cam.project(TB.x0, TY, TB.z0), b = cam.project(TB.x1, TY, TB.z0), c = cam.project(TB.x1, TY - 0.04, TB.z0), e = cam.project(TB.x0, TY - 0.04, TB.z0);
      g.fillStyle = '#1a120c'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(e[0], e[1]); g.closePath(); g.fill(); }
    // the things and the hands, far to near
    for (const fn of things.draw) fn(g, Lm, t);
    // VESPER's arm is close to us: out of focus, on its own layer
    const ng = this.near.getContext('2d'); ng.setTransform(1, 0, 0, 1, 0, 0); ng.globalCompositeOperation = 'source-over'; ng.globalAlpha = 1; ng.filter = 'none'; ng.clearRect(0, 0, W, H);
    for (const fn of things.near) fn(ng, Lm, t);
    g.save(); g.filter = `blur(${Math.max(1, W * 0.004).toFixed(1)}px)`; g.drawImage(this.near, 0, 0); g.restore();
    // dust turning in the cone of light
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const m of this.motes) {
      const x = m.x + Math.sin(t * 0.3 + m.ph) * 0.03, y = m.y + Math.sin(t * 0.21 + m.ph * 2) * 0.02, z = m.z + Math.cos(t * 0.25 + m.ph) * 0.03;
      const q = cam.project(x, y, z), v = lit(Lm, [x, y, z], norm(sub(Lm.p, [x, y, z])), 0) * (0.5 + 0.5 * Math.sin(t * 1.7 + m.ph * 3));
      if (q[2] <= 0 || v < 0.05) continue;
      g.fillStyle = `rgba(255,214,170,${Math.min(0.6, v * 0.25).toFixed(3)})`; g.beginPath(); g.arc(q[0], q[1], Math.max(0.5, 0.0018 * q[3] * (0.6 + m.s)), 0, TAU); g.fill();
    }
    g.restore();
  }
  // the objects and the arms: how to draw each and what it throws
  things(o) {
    const cam = this.cam, draw = [], near = [], shadows = [];
    // the radio: a steel box with a grille, two knobs, a dark window, the light; its aerial
    const R0 = [0.55, TY + 0.06, 0.34], RX = [0.13, 0, 0.012], RY = [0, 0.06, 0], RZ = [-0.008, 0, 0.075];
    const aer0 = [0.66, TY + 0.12, 0.37], aer1 = [0.7, TY + 0.68, 0.42];
    shadows.push(boxPts(R0, RX, RY, RZ), capsulePts(aer0, aer1, 0.004, 0.003));
    // mugs, the magazine, rounds, the torch
    const mugA = o.mug, mugB = [0.4, TY, -0.33];
    shadows.push(capsulePts(mugA, add(mugA, [0, 0.095, 0]), 0.042, 0.042), capsulePts(mugB, add(mugB, [0, 0.1, 0]), 0.045, 0.045));
    // an ashtray, a cigarette left burning in it; its smoke climbs through the light
    const ash = [-0.4, TY, 0.3], cig0 = [-0.39, TY + 0.016, 0.29], cig1 = [-0.32, TY + 0.024, 0.27];
    shadows.push(capsulePts(ash, add(ash, [0, 0.018, 0]), 0.05, 0.05), capsulePts(cig0, cig1, 0.004, 0.004));
    draw.push((g, L) => { cyl3(g, cam, ash, 0.05, 0.018, L, [50, 48, 46], [22, 20, 19], 0.05); capsule3(g, cam, cig0, cig1, 0.0042, 0.0042, L, [200, 196, 186], 0.05); const e = cam.project(...cig1); glow(g, e[0], e[1], 0.006 * e[3], '#ff5a20', 0.55); });
    draw.push((g, L, t) => this.drawSmoke(g, L, t, cig1));
    const mag0 = [-0.2, TY + 0.012, 0.33];
    shadows.push(boxPts(mag0, [0.08, 0, 0.02], [0, 0.012, 0], [-0.006, 0, 0.018]));
    const torch = [[0.62, TY + 0.018, -0.3], [0.74, TY + 0.02, -0.18]];
    shadows.push(capsulePts(torch[0], torch[1], 0.018, 0.022));
    const arms = ['wL', 'wR', 'sL', 'sR', 'b'].map((k) => this.armParts(o[k]));
    const vArm = this.armParts(o.v);
    for (const a of arms.concat([vArm])) for (const [a1, b1, ra, rb] of a) shadows.push(capsulePts(a1, b1, ra, rb));
    const pencil = [o.vTip, add(o.vTip, [-0.07, 0.09, -0.06])];
    shadows.push(capsulePts(pencil[0], pencil[1], 0.003, 0.004));
    // drawing order: the things on the table, then the arms over them (far first)
    draw.push((g, L) => box3(g, cam, R0, RX, RY, RZ, L, [38, 40, 36], 0.05));
    draw.push((g, L, t) => {
      const fr = cam.project(R0[0], R0[1], R0[2] - 0.076);
      // front: grille lines, the window, knobs, the LED
      const P = (x, y) => cam.project(R0[0] + x, R0[1] + y, R0[2] - 0.076);
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1; for (let i = 0; i < 7; i++) { const a = P(-0.11 + i * 0.012, -0.04), b = P(-0.11 + i * 0.012, 0.03); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
      const w0 = P(0.0, 0.0), w1 = P(0.06, 0.035); g.fillStyle = '#0c1a12'; g.fillRect(w0[0], w1[1], w1[0] - w0[0], w0[1] - w1[1]);
      for (const kx of [0.08, 0.11]) { const k = P(kx, -0.025); g.fillStyle = '#121212'; g.beginPath(); g.arc(k[0], k[1], 0.009 * k[3], 0, TAU); g.fill(); }
      const led = P(0.1, 0.045), on = (t % 1.6) < 1.42; glow(g, led[0], led[1], 0.012 * led[3], '#4dff7a', on ? 0.9 : 0.2); glow(g, led[0], led[1], 0.0025 * led[3] + 0.6, '#e6ffec', on ? 1 : 0.2);
      void fr;
    });
    draw.push((g, L) => capsule3(g, cam, aer0, aer1, 0.004, 0.0028, L, [20, 20, 20], 0.05));
    draw.push((g, L) => box3(g, cam, mag0, [0.08, 0, 0.02], [0, 0.012, 0], [-0.006, 0, 0.018], L, [30, 30, 30], 0.05));
    draw.push((g, L) => { for (const [x, z, a] of [[-0.06, 0.36, 0.4], [-0.02, 0.31, 1.9], [-0.1, 0.27, 0.9]]) { const c0 = [x, TY + 0.006, z], c1 = [x + Math.cos(a) * 0.04, TY + 0.006, z + Math.sin(a) * 0.04]; capsule3(g, cam, c0, c1, 0.005, 0.005, L, [120, 86, 36], 0.05); const q = cam.project(...v3.lerp(c0, c1, 0.4)); glow(g, q[0], q[1] - 0.003 * q[3], 0.004 * q[3], '#ffe2a8', 0.5); } });
    draw.push((g, L) => capsule3(g, cam, torch[0], torch[1], 0.018, 0.022, L, [28, 28, 30], 0.05));
    draw.push((g, L) => {
      const m = cyl3(g, cam, mugB, 0.045, 0.1, L, [205, 200, 188], [60, 40, 26], 0.06);
      // tea, and the lamp's spot in it
      const lq = cam.project(mugB[0] + (L.p[0] - mugB[0]) * 0.02, TY + 0.1, mugB[2]); glow(g, lq[0], lq[1], 0.01 * lq[3], '#ffe0b0', 0.6); void m;
    });
    draw.push((g, L) => { cyl3(g, cam, mugA, 0.042, 0.095, L, [44, 62, 50], [16, 14, 12], 0.05); const h0 = add(mugA, [-0.045, 0.07, 0]), h1 = add(mugA, [-0.07, 0.03, 0]); capsule3(g, cam, h0, h1, 0.007, 0.007, L, [44, 62, 50], 0.05); });
    // the arms: WARDEN's (far), then SKYE's and BULWARK's
    for (const a of arms) draw.push((g, L) => { a.forEach(([a1, b1, ra, rb, col], i) => capsule3(g, cam, a1, b1, ra, rb, L, col, 0.035, i === 1 || i === 2 ? { folds: 4, seed: i * 7 + a1[0] * 100 } : {})); });
    // VESPER's pencil and hand, near
    near.push((g, L) => { capsule3(g, cam, pencil[0], pencil[1], 0.0025, 0.0045, L, [170, 140, 60], 0.05); vArm.forEach(([a1, b1, ra, rb, col], i) => capsule3(g, cam, a1, b1, ra, rb, L, col, 0.035, i === 1 || i === 2 ? { folds: 4, seed: 11 + i } : {})); });
    return { draw, near, shadows };
  }
  // a thread of smoke: it rises straight a little way, then breaks into
  // curls that drift; lit only inside the lamp's cone
  drawSmoke(g, L, t, src) {
    const cam = this.cam, sc = this.smokeC || (this.smokeC = canvas(this.W, this.H)), sg = sc.getContext('2d');
    sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, this.W, this.H); sg.lineCap = 'round';
    const g0 = g; g = sg;
    for (let s = 0; s < 4; s++) {
      let prev = null;
      for (let i = 0; i <= 40; i++) {
        const h = i / 40 * 0.75, age = h / 0.12, tt = t - age;
        const wob = h < 0.1 ? 0 : (h - 0.1) * (noise1(tt * 0.9 + h * 3 + s * 7, 21) * 0.5 + Math.sin(h * 11 - t * 2.3 + s * 1.7) * 0.12);
        const p = [src[0] + wob + h * 0.06, src[1] + h, src[2] + (h - 0.12) * noise1(tt * 0.7 + s * 3, 22) * 0.2 * (h > 0.12 ? 1 : 0)];
        const q = cam.project(...p);
        if (prev) {
          const v = lit(L, p, norm(sub(L.p, p)), 0), a = Math.min(0.45, v * 0.2) * (1 - h / 0.75) * (h < 0.04 ? h / 0.04 : 1) * (s ? 0.6 : 1);
          g.strokeStyle = `rgba(205,200,192,${a.toFixed(3)})`; g.lineWidth = Math.max(0.6, (0.0025 + h * 0.035) * q[3] * (1 - s * 0.2));
          g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(q[0], q[1]); g.stroke();
        }
        prev = q;
      }
    }
    g0.save(); g0.globalCompositeOperation = 'lighter'; g0.filter = 'blur(1.2px)'; g0.drawImage(sc, 0, 0); g0.restore();
  }
  post() { return { grain: 0.08, halation: 0.5, lift: [6, 5, 4], warm: 0.08, vignette: 0.65, dirt: 0.4, flicker: 0.02 }; }
}

// ---------------------------------------------------------------------------------------------
// shot 8: the scarf (§2, shot 8). 100 mm, close on the basement wall: old
// plaster raked by the bulb from the right, so every bump throws a shadow; a
// black-and-white photograph pinned up (workers in front of a furnace, a name
// written on the border); beside it a red wool scarf over a rusty nail. A
// gloved hand comes in from the right (its shadow first), takes the scarf
// and pulls it off the nail; the camera follows a beat late.
const NAIL = [0.1, 1.5, -0.03], LAMP8 = [0.95, 1.75, -0.5];
export class Scarf {
  init(W, H, env) {
    this.W = W; this.H = H; this.env = env;
    const cam = this.cam = new Cam(W, H);
    cam.mm = 100; cam.pos = [0.06, 1.47, -1.05]; cam.hand = 0.35; cam.seed = 81; cam.update(0);
    this.follow = { x: 0.06, y: 1.47 };
    this.M = Math.round(W * 0.4);
    this.gen = this.bake(); this.ready = false;
    this.cloth = this.makeCloth();
    this.hand = { p: [0.42, 1.36, -0.12] };
    this.hs = canvas(W, H); this.hl = canvas(W, H);
    this.photo = this.paintPhoto(rng(88));
  }
  prepare(ms) { if (this.ready) return; const t0 = performance.now(); while (performance.now() - t0 < ms) if (this.gen.next().done) { this.ready = true; return; } }
  // the wall in front of the lens, per pixel: plaster albedo × light from a
  // bump map (the lamp low and to the right), a little wider than the frame
  *bake() {
    const W = this.W, H = this.H, M = this.M, cam = this.cam, cw = W + M * 2, ch = Math.round(H * 1.5), oy = Math.round(H * 0.25);
    const c = this.wall = canvas(cw, ch), g = c.getContext('2d'), img = g.createImageData(cw, ch), d = img.data;
    const f = cam.f, C = cam._p; this.wallOff = [M, oy];
    // the wall is z = 0 and faces the lens: a pixel maps straight to (x, y)
    const toW = (X, Y) => [C[0] + (X - M - W / 2) / f * (0 - C[2]), C[1] - (Y - oy - H / 2) / f * (0 - C[2])];
    const hgt = (x, y) => fbm2(x * 60, y * 60, 4, 91) * 0.0016 + fbm2(x * 300, y * 300, 2, 92) * 0.00035 + Math.max(0, fbm2(x * 9, y * 9, 3, 93) - 0.62) * 0.004;
    const e = 0.0006;
    for (let Y = 0; Y < ch; Y++) {
      if (Y % 24 === 23) yield;
      for (let X = 0; X < cw; X++) {
        const [x, y] = toW(X, Y), h0 = hgt(x, y), hx = (hgt(x + e, y) - h0) / e, hy = (hgt(x, y + e) - h0) / e;
        // normal (toward the lens is −z)
        let nx = -hx, ny = -hy, nz = -1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
        const lx = LAMP8[0] - x, ly = LAMP8[1] - y, lz = LAMP8[2] - 0, ll = Math.hypot(lx, ly, lz);
        const ndl = 0, lam = Math.max(0, (nx * lx + ny * ly + nz * lz) / ll);
        // paint layers: an old cream over a grey, chipped through in places; a crack
        const chip = false, crack = false;
        let a = chip ? [118, 112, 104] : [196, 184, 160];
        const stain = fbm2(x * 3, y * 2, 3, 96); a = a.map((v) => v * (0.82 + stain * 0.25));
        if (crack) a = a.map((v) => v * 0.45);
        const fall = 1 / (1 + ((x - LAMP8[0]) ** 2 + (y - LAMP8[1]) ** 2) * 0.6);
        const v = (0.05 + lam * 1.25) * fall * (0.9 + 0.1 * Math.random());
        const o = (Y * cw + X) * 4; d[o] = Math.min(255, a[0] * v * 1.05); d[o + 1] = Math.min(255, a[1] * v * 0.8); d[o + 2] = Math.min(255, a[2] * v * 0.58); d[o + 3] = 255;
        void ndl;
      }
    }
    g.putImageData(img, 0, 0);
    // two hairline cracks in the plaster, jagged, with a lighter lip where the light catches
    const r = rng(97), toS = (x, y) => [M + W / 2 + (x - C[0]) * f / (0 - C[2]) * -1 * -1, oy + H / 2 - (y - C[1]) * f / (0 - C[2]) * -1 * -1];
    for (const [x0, y0, ang, len] of [[0.25, 1.6, -1.9, 0.14], [-0.2, 1.4, -1.2, 0.09]]) {
      let x = x0, y = y0, a = ang; const pts = [];
      for (let i = 0; i < 40; i++) { pts.push(toS(x, y)); a += (r() - 0.5) * 0.9; x += Math.cos(a) * len / 40; y += Math.sin(a) * len / 40; }
      g.strokeStyle = 'rgba(20,14,10,0.7)'; g.lineWidth = 1.2; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
      g.strokeStyle = 'rgba(255,220,180,0.18)'; g.lineWidth = 0.8; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0] + 1, p[1] - 1) : g.moveTo(p[0] + 1, p[1] - 1))); g.stroke();
    }
  }
  // the photograph: a crew in front of a furnace, the mouth glowing; grain,
  // fading, a crease; a deckled white border with a name in faded ink
  paintPhoto(r) {
    const w = 480, h = 360, c = canvas(w, h), g = c.getContext('2d'), b = 22;
    g.fillStyle = '#e9e2d0'; g.fillRect(0, 0, w, h);
    const pw = w - b * 2, ph = h - b * 2 - 26;
    const p = canvas(pw, ph), q = p.getContext('2d');
    // the furnace hall: dark steel, the mouth's glare, a gantry
    const bg = q.createLinearGradient(0, 0, 0, ph); bg.addColorStop(0, '#3a3a3a'); bg.addColorStop(0.6, '#1d1d1d'); bg.addColorStop(1, '#2a2a2a'); q.fillStyle = bg; q.fillRect(0, 0, pw, ph);
    const glowG = q.createRadialGradient(pw * 0.62, ph * 0.5, 0, pw * 0.62, ph * 0.5, pw * 0.35); glowG.addColorStop(0, '#f2f2f2'); glowG.addColorStop(0.25, '#9a9a9a'); glowG.addColorStop(1, 'rgba(60,60,60,0)'); q.fillStyle = glowG; q.fillRect(0, 0, pw, ph);
    q.fillStyle = '#121212'; q.fillRect(0, ph * 0.08, pw, ph * 0.05); for (let x = 10; x < pw; x += 44) q.fillRect(x, 0, 8, ph * 0.55);
    q.fillStyle = '#0a0a0a'; q.fillRect(pw * 0.5, ph * 0.3, pw * 0.25, ph * 0.08);
    // seven men in a row, caps and helmets, one in front kneeling; the glare behind them
    const men = [[0.12, 1, 'cap'], [0.24, 1.05, 'helm'], [0.36, 0.98, 'bare'], [0.5, 1.08, 'helm'], [0.63, 1.0, 'cap'], [0.76, 1.03, 'helm'], [0.88, 0.97, 'bare']];
    men.forEach(([x, s2, hd], mi) => {
      const cx = x * pw + (r() - 0.5) * 8, hu = ph * 0.13 * s2, top = ph * 0.3 + (1.08 - s2) * ph * 0.25, sh = hu * 0.95, lean = (r() - 0.5) * 0.15;
      q.save(); q.translate(cx, top); q.rotate(lean * 0.3);
      q.fillStyle = '#101010';
      // shoulders sloping into arms; one with hands on hips, one with arms folded
      q.beginPath(); q.moveTo(-sh * 0.2, hu * 0.95); q.quadraticCurveTo(-sh * 0.62, hu * 1.0, -sh * 0.7, hu * 1.3);
      const akimbo = mi % 3 === 1;
      if (akimbo) { q.lineTo(-sh * 1.05, hu * 2.0); q.lineTo(-sh * 0.62, hu * 2.35); q.lineTo(-sh * 0.58, ph); } else { q.lineTo(-sh * 0.74, hu * 2.4); q.lineTo(-sh * 0.62, ph); }
      q.lineTo(sh * 0.62, ph);
      if (akimbo) { q.lineTo(sh * 0.62, hu * 2.35); q.lineTo(sh * 1.05, hu * 2.0); q.lineTo(sh * 0.7, hu * 1.3); } else { q.lineTo(sh * 0.74, hu * 2.4); q.lineTo(sh * 0.7, hu * 1.3); }
      q.quadraticCurveTo(sh * 0.62, hu * 1.0, sh * 0.2, hu * 0.95); q.closePath(); q.fill();
      // neck, head
      q.fillRect(-sh * 0.12, hu * 0.7, sh * 0.24, hu * 0.3);
      q.beginPath(); q.ellipse(0, hu * 0.5, sh * 0.2, hu * 0.27, 0, 0, TAU); q.fill();
      if (hd === 'helm') { q.beginPath(); q.ellipse(0, hu * 0.36, sh * 0.29, hu * 0.2, 0, Math.PI, TAU); q.fill(); q.fillRect(-sh * 0.36, hu * 0.33, sh * 0.72, hu * 0.05); }
      if (hd === 'cap') { q.beginPath(); q.ellipse(0, hu * 0.36, sh * 0.23, hu * 0.16, 0, Math.PI, TAU); q.fill(); q.fillRect(0, hu * 0.33, sh * 0.32, hu * 0.05); }
      // the glare behind them rims shoulders and heads; overalls' straps
      const side = Math.sign(0.62 - x) || 1;
      q.strokeStyle = 'rgba(230,230,230,0.4)'; q.lineWidth = 1.4; q.beginPath(); q.moveTo(side * sh * 0.66, hu * 1.2); q.lineTo(side * sh * 0.72, hu * 2.4); q.stroke();
      q.beginPath(); q.arc(0, hu * 0.48, sh * 0.2, side > 0 ? -1.2 : Math.PI - 0.6, side > 0 ? 0.6 : Math.PI + 1.2); q.stroke();
      q.strokeStyle = 'rgba(90,90,90,0.6)'; q.lineWidth = 1; for (const sx of [-0.25, 0.25]) { q.beginPath(); q.moveTo(sx * sh, hu * 1.05); q.lineTo(sx * sh * 0.8, hu * 2.0); q.stroke(); }
      q.restore();
    });
    // the old lens: everything a touch soft
    { const tmp = canvas(pw, ph), tg = tmp.getContext('2d'); tg.filter = 'blur(1.1px)'; tg.drawImage(p, 0, 0); q.clearRect(0, 0, pw, ph); q.drawImage(tmp, 0, 0); }
    // grain, the print's fading at the edges, a crease across one corner
    const im = q.getImageData(0, 0, pw, ph), dd = im.data;
    for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
      const o = (y * pw + x) * 4, n = (r() - 0.5) * 34, e = Math.min(x, y, pw - x, ph - y) / 30, fade = e < 1 ? 0.6 + e * 0.4 : 1;
      let l = dd[o] * fade * 0.9 + 18 + n; l = Math.max(0, Math.min(255, l));
      dd[o] = l * 1.02; dd[o + 1] = l * 0.98; dd[o + 2] = l * 0.9;
    }
    q.putImageData(im, 0, 0);
    q.strokeStyle = 'rgba(255,255,255,0.35)'; q.lineWidth = 1.5; q.beginPath(); q.moveTo(pw * 0.72, ph); q.lineTo(pw, ph * 0.62); q.stroke();
    g.drawImage(p, b, b);
    // deckled edge
    g.globalCompositeOperation = 'destination-out';
    for (let x = 0; x < w; x += 6) { g.beginPath(); g.arc(x + 3, 0, 3.4, 0, TAU); g.fill(); g.beginPath(); g.arc(x + 3, h, 3.4, 0, TAU); g.fill(); }
    for (let y = 0; y < h; y += 6) { g.beginPath(); g.arc(0, y + 3, 3.4, 0, TAU); g.fill(); g.beginPath(); g.arc(w, y + 3, 3.4, 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    // the name, in ink gone brown
    g.fillStyle = 'rgba(70,52,40,0.75)'; g.font = 'italic 500 19px "Segoe Print", "Comic Sans MS", cursive'; g.fillText('Halil — 3 nolu fırın', b + 6, h - 12);
    return c;
  }
  // the scarf: a strip of knitted wool (17 cm × 1.3 m) folded over the nail,
  // as a grid of points held by sticks (verlet), the wall behind it
  makeCloth() {
    const nw = 8, nl = 40, sw = 0.17 / (nw - 1), sl = 1.3 / (nl - 1), mid = 20, P = [];
    for (let i = 0; i < nl; i++) for (let j = 0; j < nw; j++) {
      // gathered to a bunch on the nail, opening out as it falls; a fold in it
      const k = Math.abs(i - mid), front = i > mid, open = this.open(k);
      const p = [NAIL[0] + (j - (nw - 1) / 2) * sw * open, NAIL[1] + 0.004 - k * sl * 0.97, -(front ? 0.026 : 0.01) - Math.abs(Math.sin(j * 1.9 + k * 0.2)) * 0.008 * open];
      P.push({ p, o: p.slice(), pin: i === mid });
    }
    // along the length the knit holds; across, it only resists being pulled
    // wider than it is (so it can bunch at the nail and fan out below)
    const L = [], at = (i, j) => i * nw + j;
    for (let i = 0; i < nl; i++) for (let j = 0; j < nw; j++) {
      const w = sw * this.open(Math.abs(i - mid));
      if (j + 1 < nw) L.push([at(i, j), at(i, j + 1), w, false]);
      if (i + 1 < nl) L.push([at(i, j), at(i + 1, j), sl, false]);
      if (i + 1 < nl && j + 1 < nw) { L.push([at(i, j), at(i + 1, j + 1), Math.hypot(w, sl), true]); L.push([at(i, j + 1), at(i + 1, j), Math.hypot(w, sl), true]); }
    }
    // settle it before the shot starts
    const c = { P, L, nw, nl, mid, grab: -1, onNail: true };
    for (let k = 0; k < 120; k++) this.stepCloth(c, 1 / 60, 0);
    return c;
  }
  // how far the scarf has opened out, k rows from the nail
  open(k) { return Math.min(1, 0.18 + k * 0.11); }
  stepCloth(c, dt, t) {
    const g = -9.8 * dt * dt, wind = 0.02 * noise1(t * 0.7, 3) * dt * dt;
    for (let n = 0; n < c.P.length; n++) {
      const q = c.P[n]; if (q.pin && c.onNail) { const j = n % c.nw; q.p = [NAIL[0] + (j - (c.nw - 1) / 2) * 0.004, NAIL[1] + 0.006 + Math.abs(j - (c.nw - 1) / 2) * 0.001, NAIL[2] + 0.008 - (j % 2) * 0.006]; q.o = q.p.slice(); continue; }
      if (n === c.grab) continue;
      const v = [(q.p[0] - q.o[0]) * 0.985, (q.p[1] - q.o[1]) * 0.985, (q.p[2] - q.o[2]) * 0.985];
      q.o = q.p.slice(); q.p = [q.p[0] + v[0] + wind, q.p[1] + v[1] + g, q.p[2] + v[2]];
    }
    for (let it = 0; it < 6; it++) {
      for (const [a, b, l, slack] of c.L) {
        const A = c.P[a], B = c.P[b], dx = B.p[0] - A.p[0], dy = B.p[1] - A.p[1], dz = B.p[2] - A.p[2], d = Math.hypot(dx, dy, dz) || 1e-6;
        if (slack && d < l) continue;
        const k = (d - l) / d * 0.5;
        const fa = (A.pin && c.onNail) || a === c.grab ? 0 : 1, fb = (B.pin && c.onNail) || b === c.grab ? 0 : 1, s = fa + fb; if (!s) continue;
        A.p[0] += dx * k * 2 * fa / s; A.p[1] += dy * k * 2 * fa / s; A.p[2] += dz * k * 2 * fa / s;
        B.p[0] -= dx * k * 2 * fb / s; B.p[1] -= dy * k * 2 * fb / s; B.p[2] -= dz * k * 2 * fb / s;
      }
      // the wall, and the front half kept off the back half
      for (let n = 0; n < c.P.length; n++) { const q = c.P[n], i = (n / c.nw) | 0; const zmax = i > c.mid ? -0.016 : -0.005; if (q.p[2] > zmax) q.p[2] = zmax; }
    }
  }
  // the hand's path: in from the right at 1.0 s, on the scarf at 2.2, away by 3.5
  handAt(t) {
    const a = [0.4, 1.33, -0.16], b = [0.13, 1.405, -0.04], e = [0.58, 1.28, -0.3];
    if (t < 1.0) return a;
    if (t < 2.2) return v3.lerp(a, b, smooth(1.0, 2.2, t));
    return v3.lerp(b, e, smooth(2.35, 3.6, t));
  }
  update(dt, t) {
    const c = this.cloth;
    this.hand.p = this.handAt(t);
    // the grip closes on the front of the scarf, a hand's length below the nail
    if (t >= 2.2 && c.grab < 0) {
      let best = 1e9; c.P.forEach((q, n) => { const d = Math.hypot(q.p[0] - this.hand.p[0] + 0.02, q.p[1] - this.hand.p[1], q.p[2] + 0.024); if (((n / c.nw) | 0) > c.mid && d < best) { best = d; c.grab = n; } });
      this.env.audio?.cue('cloth', { vol: 1.2 });
    }
    if (c.grab >= 0) { const q = c.P[c.grab]; q.o = q.p.slice(); q.p = add(this.hand.p, [-0.03, -0.005, 0.03]); }
    // it comes off the nail once the pull lifts it
    if (c.onNail && t > 2.55) { c.onNail = false; this.env.audio?.cue('nail'); }
    const n = Math.max(1, Math.ceil(dt / (1 / 120)));
    for (let i = 0; i < n; i++) this.stepCloth(c, dt / n, t);
    // the operator follows the hand, late
    const tgt = t < 2.2 ? [0.06, 1.47] : [lerp(0.06, 0.13, smooth(2.3, 4.0, t)), lerp(1.47, 1.45, smooth(2.3, 4.0, t))];
    const k = 1 - Math.exp(-dt / 0.15); this.follow.x += (tgt[0] - this.follow.x) * k; this.follow.y += (tgt[1] - this.follow.y) * k;
    this.cam.pos[0] = this.follow.x; this.cam.pos[1] = this.follow.y; this.cam.update(t);
  }
  draw(g, t) {
    if (!this.ready) { while (!this.gen.next().done); this.ready = true; }
    const W = this.W, H = this.H, cam = this.cam, lamp = { p: LAMP8, I: 0.75 };
    // the wall plate, moved with the camera
    const a = cam.project(0, 1.5, 0), C0 = this.bakeRef || (this.bakeRef = [W / 2 + (0 - 0.06) * cam.f / 1.05, H / 2 - (1.5 - 1.47) * cam.f / 1.05]);
    g.drawImage(this.wall, a[0] - C0[0] - this.wallOff[0], a[1] - C0[1] - this.wallOff[1]);
    // the photograph, pinned, its lower corner lifting off the wall
    { const p0 = cam.project(-0.13, 1.535, 0.0005), p1 = cam.project(-0.01, 1.445, 0.0005), w = p1[0] - p0[0], h = p1[1] - p0[1];
      g.save(); g.translate(p0[0] + w / 2, p0[1] + h / 2); g.rotate(-0.035);
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.filter = 'blur(3px)'; g.fillRect(-w / 2 - 6, -h / 2 + 4, w + 4, h + 3); g.filter = 'none';
      g.drawImage(this.photo, -w / 2, -h / 2, w, h);
      // the light falls across it from the right: brighter that side
      const lg = g.createLinearGradient(-w / 2, 0, w / 2, 0); lg.addColorStop(0, 'rgba(0,0,0,0.55)'); lg.addColorStop(1, 'rgba(255,190,120,0.06)');
      g.fillStyle = lg; g.fillRect(-w / 2, -h / 2, w, h);
      g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgb(255,214,170)'; g.fillRect(-w / 2, -h / 2, w, h); g.globalCompositeOperation = 'source-over';
      // the pin
      const pr = 0.004 * p0[3]; g.fillStyle = '#7a1b16'; g.beginPath(); g.arc(0, -h / 2 + pr * 2.2, pr, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,200,160,0.6)'; g.beginPath(); g.arc(pr * 0.35, -h / 2 + pr * 1.8, pr * 0.35, 0, TAU); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.ellipse(-pr * 1.4, -h / 2 + pr * 2.6, pr * 1.2, pr * 0.5, 0.3, 0, TAU); g.fill();
      g.restore(); }
    // the nail and its shadow
    { const n0 = cam.project(NAIL[0], NAIL[1], 0), n1 = cam.project(NAIL[0] + 0.002, NAIL[1] + 0.003, NAIL[2]), s1 = cam.project(NAIL[0] - 0.03, NAIL[1] - 0.008, 0);
      g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.004 * n0[3]; g.lineCap = 'round'; g.beginPath(); g.moveTo(n0[0], n0[1]); g.lineTo(s1[0], s1[1]); g.stroke();
      g.strokeStyle = '#3d2a1f'; g.lineWidth = 0.0035 * n0[3]; g.beginPath(); g.moveTo(n0[0], n0[1]); g.lineTo(n1[0], n1[1]); g.stroke();
      g.fillStyle = '#5a4030'; g.beginPath(); g.ellipse(n1[0], n1[1], 0.004 * n0[3], 0.0045 * n0[3], 0, 0, TAU); g.fill(); }
    // shadows thrown on the wall by the scarf and the hand
    const sg = this.hs.getContext('2d'); sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, W, H);
    const wallShadow = (pts) => { const q = pts.map((p) => { const k = (0 - LAMP8[2]) / (p[2] - LAMP8[2]); return cam.project(LAMP8[0] + (p[0] - LAMP8[0]) * k, LAMP8[1] + (p[1] - LAMP8[1]) * k, 0); }); hull(sg, q); };
    const c = this.cloth;
    for (let i = 0; i < c.nl - 1; i++) wallShadow([c.P[i * c.nw].p, c.P[i * c.nw + c.nw - 1].p, c.P[(i + 1) * c.nw].p, c.P[(i + 1) * c.nw + c.nw - 1].p]);
    const hp = this.handParts();
    for (const [a1, b1, ra, rb] of hp) wallShadow(capsulePts(a1, b1, ra, rb));
    g.save(); g.globalAlpha = 0.6; g.filter = `blur(${(W * 0.006).toFixed(1)}px)`; g.drawImage(this.hs, 0, 0); g.restore();
    // the scarf: quads shaded by their facing, ribs along its length, fuzz at the edge
    this.drawCloth(g, lamp);
    // the hand, a hand-width nearer than the wall: out of focus
    const hg = this.hl.getContext('2d'); hg.setTransform(1, 0, 0, 1, 0, 0); hg.clearRect(0, 0, W, H);
    for (const [a1, b1, ra, rb, col] of hp) capsule3(hg, cam, a1, b1, ra, rb, lamp, col, 0.03, col === SLEEVE ? { folds: 5, seed: 3 } : {});
    g.save(); g.filter = `blur(${(W * 0.004).toFixed(1)}px)`; g.drawImage(this.hl, 0, 0); g.restore();
  }
  handParts() {
    const p = this.hand.p, grip = this.cloth.grab >= 0;
    const parts = handParts(p, [-1, 0.0, -0.15], grip ? 'grip' : 'flat', 1).map(([a, b, ra, rb]) => {
      // the hand stands up off the table pose: turn it to face the wall (fingers left)
      const r = (q) => [p[0] + (q[0] - p[0]), p[1] + (q[2] - p[2]) * 0.9, p[2] - (q[1] - p[1]) * 1.2 + 0.0];
      return [r(a), r(b), ra, rb, [24, 22, 20]];
    });
    const el = add(p, [0.26, -0.12, -0.14]);
    parts.unshift([p, add(p, [0.05, -0.02, -0.02]), 0.034, 0.042, [22, 20, 19]], [add(p, [0.05, -0.02, -0.02]), el, 0.05, 0.058, SLEEVE]);
    return parts;
  }
  // the scarf: every quad of the cloth gets a patch of knitted stitches
  // (mapped onto it, so the knit moves with the cloth), shaded by how the
  // quad faces the lamp; a darker band at the folded edges; loose fibres
  drawCloth(g, lamp) {
    const c = this.cloth, cam = this.cam, nw = c.nw, W = this.W, H = this.H;
    const tile = this.knit || (this.knit = knitTile());
    const lay = this.clothC || (this.clothC = canvas(W, H)), cg = lay.getContext('2d');
    cg.setTransform(1, 0, 0, 1, 0, 0); cg.globalCompositeOperation = 'source-over'; cg.globalAlpha = 1; cg.filter = 'none'; cg.clearRect(0, 0, W, H);
    const Q = c.P.map((q) => cam.project(...q.p));
    // vertex normals, for a softer shading across each quad
    const N = c.P.map(() => [0, 0, 0]);
    for (let i = 0; i < c.nl - 1; i++) for (let j = 0; j < nw - 1; j++) {
      const a = i * nw + j, b = a + 1, d = a + nw; let n = norm(v3.cross(sub(c.P[b].p, c.P[a].p), sub(c.P[d].p, c.P[a].p))); if (n[2] > 0) n = mul(n, -1);
      for (const k of [a, b, d, d + 1]) N[k] = add(N[k], n);
    }
    const shade = (k, i) => lit(lamp, c.P[k].p, norm(N[k]), 0.05) * (i > c.mid ? 1 : 0.65);
    const RED = [150, 22, 20];
    const order = []; for (let i = 0; i < c.nl - 1; i++) order.push(i);
    order.sort((a, b) => (a > c.mid ? 1 : 0) - (b > c.mid ? 1 : 0));
    // the shading first: each quad lit across from its left edge to its right
    for (const i of order) for (let j = 0; j < nw - 1; j++) {
      const a = i * nw + j, b = a + 1, d = a + nw, e = d + 1, qa = Q[a], qb = Q[b], qd = Q[d], qe = Q[e];
      const gl = cg.createLinearGradient((qa[0] + qd[0]) / 2, (qa[1] + qd[1]) / 2, (qb[0] + qe[0]) / 2, (qb[1] + qe[1]) / 2);
      gl.addColorStop(0, tone(RED, (shade(a, i) + shade(d, i)) / 2)); gl.addColorStop(1, tone(RED, (shade(b, i) + shade(e, i)) / 2));
      cg.fillStyle = gl; cg.strokeStyle = gl; cg.lineWidth = 1.2;
      cg.beginPath(); cg.moveTo(qa[0], qa[1]); cg.lineTo(qb[0], qb[1]); cg.lineTo(qe[0], qe[1]); cg.lineTo(qd[0], qd[1]); cg.closePath(); cg.fill(); cg.stroke();
    }
    // then the stitches over it, multiplied (the tile is white where the wool
    // stands up, darker in the gaps), mapped onto each quad through a, b, d
    cg.globalCompositeOperation = 'multiply';
    for (const i of order) for (let j = 0; j < nw - 1; j++) {
      const a = i * nw + j, b = a + 1, d = a + nw, e = d + 1, qa = Q[a], qb = Q[b], qd = Q[d], qe = Q[e];
      cg.save();
      cg.beginPath(); cg.moveTo(qa[0], qa[1]); cg.lineTo(qb[0], qb[1]); cg.lineTo(qe[0], qe[1]); cg.lineTo(qd[0], qd[1]); cg.closePath(); cg.clip();
      cg.setTransform(qb[0] - qa[0], qb[1] - qa[1], qd[0] - qa[0], qd[1] - qa[1], qa[0], qa[1]);
      cg.drawImage(tile, -0.02, -0.02, 1.04, 1.04);
      cg.restore();
    }
    cg.globalCompositeOperation = 'source-over';
    // the edges are the cloth's thickness: a darker line down each side
    cg.strokeStyle = 'rgba(40,4,4,0.8)'; cg.lineWidth = Math.max(1, 0.002 * cam.f / 1.05);
    for (const j of [0, nw - 1]) for (const [i0, i1] of [[0, c.mid], [c.mid, c.nl - 1]]) { cg.beginPath(); for (let i = i0; i <= i1; i++) { const q = Q[i * nw + j]; if (i === i0) cg.moveTo(q[0], q[1]); else cg.lineTo(q[0], q[1]); } cg.stroke(); }
    // loose fibres along the edges (fixed per point, they move with it)
    cg.strokeStyle = 'rgba(200,70,60,0.35)'; cg.lineWidth = 0.6;
    for (let i = 0; i < c.nl; i++) for (const j of [0, nw - 1]) { const q = Q[i * nw + j]; for (let k = 0; k < 3; k++) { const a = ((i * 7 + j * 3 + k * 11) % 17) / 17 * TAU, l = 1 + ((i + k) % 4); cg.beginPath(); cg.moveTo(q[0], q[1]); cg.lineTo(q[0] + Math.cos(a) * l, q[1] + Math.sin(a) * l); cg.stroke(); } }
    // wool is soft at this distance
    g.save(); g.filter = 'blur(0.6px)'; g.drawImage(lay, 0, 0); g.restore();
  }
  post() { return { grain: 0.085, halation: 0.35, lift: [6, 5, 4], warm: 0.08, vignette: 0.7, dirt: 0.35, flicker: 0.02 }; }
}
const SLEEVE = [44, 38, 32];
// a tile of knitted stocking stitch: columns of little V's, light on top,
// a dark gap between them (white = the wool's own colour, shaded later)
function knitTile() {
  const S = 48, c = canvas(S, S), g = c.getContext('2d');
  g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, S, S);
  const cols = 4, rows = 3, cw = S / cols, rh = S / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = i * cw, y = j * rh;
    for (const sd of [-1, 1]) {
      const gr = g.createLinearGradient(x + cw / 2, y, x + cw / 2 + sd * cw * 0.45, y + rh); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#9a9a9a');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x + cw / 2, y + rh * 0.95); g.quadraticCurveTo(x + cw / 2 + sd * cw * 0.5, y + rh * 0.55, x + cw / 2 + sd * cw * 0.42, y + rh * 0.05); g.lineTo(x + cw / 2 + sd * cw * 0.12, y + rh * 0.1); g.quadraticCurveTo(x + cw / 2 + sd * cw * 0.2, y + rh * 0.55, x + cw / 2, y + rh * 0.7); g.closePath(); g.fill();
    }
  }
  return c;
}
function hull(g, q) {
  const p = q.filter((v) => v[2] > 0).map((v) => [v[0], v[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (p.length < 3) return;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const v of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], v) <= 0) lo.pop(); lo.push(v); }
  for (let i = p.length - 1; i >= 0; i--) { const v = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], v) <= 0) up.pop(); up.push(v); }
  const h = lo.slice(0, -1).concat(up.slice(0, -1)); g.fillStyle = '#000'; g.beginPath(); h.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); g.closePath(); g.fill();
}

// ---------------------------------------------------------------------------------------------
// shot 9: the alley (§2, shot 9). Night, rain. A narrow alley seen from low
// down, the camera backing away. A door opens in the right-hand wall and the
// five come out one after another into the rain, turn, and walk at us. At the
// far end a sodium lamp on a bracket and the street beyond light them from
// behind: black figures with a rim of orange, the rain lit round them, their
// reflections in the wet ground, steam off a grate they walk through.
const AW = 1.65, AL = { lamp: [-1.42, 4.6, 19.5], far: [0.4, 5.6, 27], door: [AW, 0, 9.1] };
export class Alley {
  init(W, H, env) {
    this.W = W; this.H = H; this.env = env;
    const cam = this.cam = new Cam(W, H);
    cam.mm = 32; cam.pos = [0.05, 0.88, 0]; cam.pitch = 0.035; cam.hand = 0.5; cam.seed = 91; cam.update(0);
    const r = rng(99);
    this.wallL = this.paintWall(r, -1); this.wallR = this.paintWall(r, 1); this.floor = this.paintFloor(r);
    // the five: when each steps out, where they walk, how
    const plan = [['flint', 0.8, 0.15, 'normal'], ['warden', 1.55, -0.55, 'normal'], ['vesper', 2.2, 0.62, 'careful'], ['skye', 2.8, -0.15, 'normal'], ['bulwark', 3.5, 0.5, 'heavy']];
    this.squad = plan.map(([kit, t0, lane, gait], i) => ({ h: new Human({ kit, x: AW - 0.25, z: AL.door[2], yaw: Math.PI, gait, seed: 50 + i, phase: i * 0.3 }), t0, lane, out: false }));
    this.splash = []; this.steam = new Puffs({ rate: 9, life: 3.2, rise: 0.55, grow: 0.9, size: 0.18, col: '#e2b07a', a: 0.12, seed: 93, lumpy: true });
    for (let i = 0; i < 60; i++) this.steam.update(0.05, [[0.25, 0.05, 6.2]], 0.1);
    this.rain = new Rain({ n: [900, 420, 50], box: [3, 6, 0.5, 30], speed: 8.8, wind: 0.35, seed: 94 });
    this.refl = canvas(W, H);
  }
  // a wall of the alley as a texture, lit by the lamps (diffuse doesn't depend
  // on where we stand, so it is baked); 30 m long, 7 m high, 70 px a metre
  paintWall(r, side) {
    const S = 70, L = 30, Hh = 7, c = canvas(L * S, Hh * S), g = c.getContext('2d');
    const X = (z) => (z + 3) * S, Y = (y) => (Hh - y) * S;
    // brick, rendered over in places, wet
    g.fillStyle = side < 0 ? '#3a2c24' : '#33302c'; g.fillRect(0, 0, c.width, c.height);
    for (let y = 0; y < Hh; y += 0.075) { const off = (Math.round(y / 0.075) % 2) * 0.11; for (let z = -3 + off; z < L - 3; z += 0.22) { const k = 0.75 + r() * 0.5; g.fillStyle = `rgb(${58 * k | 0},${40 * k | 0},${32 * k | 0})`; g.fillRect(X(z) + 1, Y(y + 0.075) + 1, 0.22 * S - 2, 0.075 * S - 2); } }
    for (let i = 0; i < 14; i++) { const z = -3 + r() * 30, y = r() * 5, w = 1 + r() * 3, h = 0.8 + r() * 2.5; g.fillStyle = side < 0 ? 'rgba(92,86,78,0.9)' : 'rgba(80,78,74,0.9)'; g.beginPath(); g.moveTo(X(z), Y(y)); for (let k = 0; k < 10; k++) g.lineTo(X(z + w * (k / 9)) + (r() - 0.5) * 8, Y(y + h + (r() - 0.5) * 0.3)); g.lineTo(X(z + w), Y(y)); g.closePath(); g.fill(); }
    // damp from the ground up, streaks down from the sills
    const dg = g.createLinearGradient(0, Y(1.2), 0, Y(0)); dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = dg; g.fillRect(0, Y(1.2), c.width, 1.2 * S);
    for (let i = 0; i < 60; i++) { const z = -3 + r() * 30, y = 1 + r() * 5; g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(X(z), Y(y), 2 + r() * 4, (0.5 + r() * 2) * S); }
    // windows: barred low ones, dark ones above, one lit with a curtain
    for (let z = 1.5 + r() * 2; z < 26; z += 3.5 + r() * 2.5) {
      if (side > 0 && Math.abs(z - AL.door[2]) < 1.4) continue;
      const lit = r() < 0.12, y0 = 2.7 + (r() < 0.5 ? 0 : 3);
      g.fillStyle = '#121214'; g.fillRect(X(z), Y(y0 + 1.3), 0.9 * S, 1.3 * S);
      if (lit) { g.fillStyle = '#c98f4f'; g.fillRect(X(z) + 3, Y(y0 + 1.27), 0.9 * S - 6, 1.24 * S); g.fillStyle = 'rgba(80,40,20,0.6)'; g.fillRect(X(z) + 3, Y(y0 + 1.27), 0.5 * S, 1.24 * S); }
      g.fillStyle = 'rgba(160,150,140,0.35)'; g.fillRect(X(z) - 4, Y(y0) , 0.9 * S + 8, 5);
      if (r() < 0.5) { const yb = 0.4; g.fillStyle = '#0d0d0f'; g.fillRect(X(z), Y(yb + 0.6), 0.9 * S, 0.6 * S); g.strokeStyle = '#2a2a2c'; g.lineWidth = 3; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(X(z) + k * 0.15 * S, Y(yb + 0.6)); g.lineTo(X(z) + k * 0.15 * S, Y(yb)); g.stroke(); } }
      // an air conditioner under some windows, a dark stain below it
      if (r() < 0.4) { g.fillStyle = '#4a4a48'; g.fillRect(X(z + 0.05), Y(y0 - 0.15), 0.75 * S, 0.5 * S); g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(X(z + 0.2), Y(y0 - 0.65), 0.4 * S, 0.5 * S); g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(X(z + 0.1), Y(y0 - 0.2 - k * 0.06)); g.lineTo(X(z + 0.75), Y(y0 - 0.2 - k * 0.06)); g.stroke(); } }
    }
    // a drainpipe, cables along the wall
    { const z = side < 0 ? 7.2 : 15.8; g.fillStyle = '#1b1b1c'; g.fillRect(X(z), 0, 0.1 * S, c.height); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(X(z) + 2, 0, 2, c.height); }
    g.strokeStyle = '#111'; g.lineWidth = 2; for (const y of [3.4, 3.48]) { g.beginPath(); for (let z = -3; z < 27; z += 1) { g.moveTo(X(z), Y(y)); g.quadraticCurveTo(X(z + 0.5), Y(y - 0.05), X(z + 1), Y(y)); } g.stroke(); }
    // the door on the right: steel, open later (drawn per frame), its frame here
    if (side > 0) { g.fillStyle = '#1a1816'; g.fillRect(X(AL.door[2] - 0.55), Y(2.2), 1.1 * S, 2.2 * S); g.fillStyle = '#2b2a28'; g.fillRect(X(AL.door[2] - 0.6), Y(2.25), 1.2 * S, 0.08 * S); }
    // tags, half scrubbed
    g.save(); g.globalAlpha = 0.35; g.strokeStyle = side < 0 ? '#b8b0a0' : '#7a2a24'; g.lineWidth = 4; g.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const z = 2 + r() * 20, y = 0.8 + r() * 1; g.beginPath(); g.moveTo(X(z), Y(y)); for (let k = 0; k < 6; k++) g.quadraticCurveTo(X(z + k * 0.15 + 0.07), Y(y + (r() - 0.3) * 0.5), X(z + (k + 1) * 0.15), Y(y + (r() - 0.5) * 0.3)); g.stroke(); }
    g.restore();
    // light: the lamp on the left wall and the street at the end, falling off
    const lit = canvas(c.width, c.height), lg = lit.getContext('2d');
    lg.fillStyle = 'rgb(26,26,30)'; lg.fillRect(0, 0, c.width, c.height);
    lg.globalCompositeOperation = 'lighter';
    for (const [p, I, col] of [[AL.lamp, 1, [255, 150, 60]], [AL.far, 0.8, [255, 160, 80]], [[AW - 0.05, 1.2, AL.door[2]], 0.25, [255, 170, 90]]]) {
      const dx = Math.abs(side * AW - p[0]), R = (7 + dx * 3) * S, cx = X(p[2]), cy = Y(p[1]);
      const gr = lg.createRadialGradient(cx, cy, 0, cx, cy, R);
      const k = I / (1 + dx * dx * 0.25);
      gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${(0.9 * k).toFixed(3)})`); gr.addColorStop(0.25, `rgba(${col[0]},${col[1]},${col[2]},${(0.35 * k).toFixed(3)})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      lg.fillStyle = gr; lg.fillRect(0, 0, c.width, c.height);
    }
    g.globalCompositeOperation = 'multiply'; g.drawImage(lit, 0, 0); g.globalCompositeOperation = 'source-over';
    return { c, S, L, Hh };
  }
  // the floor from above: old asphalt, a channel down the middle, a grate
  paintFloor(r) {
    const S = 70, c = canvas(AW * 2 * S, 30 * S), g = c.getContext('2d');
    const X = (x) => (x + AW) * S, Z = (z) => (27 - z) * S;
    g.fillStyle = '#26221f'; g.fillRect(0, 0, c.width, c.height);
    const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const k = 0.8 + Math.random() * 0.4; d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; }
    g.putImageData(img, 0, 0);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(X(-0.12), 0, 0.24 * S, c.height);
    g.fillStyle = '#0c0c0c'; g.fillRect(X(0.0), Z(6.6), 0.5 * S, 0.8 * S); g.strokeStyle = '#2c2a28'; g.lineWidth = 3; for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(X(0.0) + k * 0.0625 * S, Z(6.6)); g.lineTo(X(0.0) + k * 0.0625 * S, Z(5.8)); g.stroke(); }
    for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(X(-1.5 + r() * 3), Z(r() * 27), (0.3 + r()) * S, (0.2 + r() * 0.6) * S, 0, 0, TAU); g.fill(); }
    // the lamps' light on it
    const lit = canvas(c.width, c.height), lg = lit.getContext('2d'); lg.fillStyle = 'rgb(8,7,7)'; lg.fillRect(0, 0, c.width, c.height); lg.globalCompositeOperation = 'lighter';
    for (const [p, I] of [[AL.lamp, 1], [AL.far, 0.9], [[AW - 0.4, 0, AL.door[2]], 0.2]]) { const gr = lg.createRadialGradient(X(p[0]), Z(p[2]), 0, X(p[0]), Z(p[2]), 9 * S); gr.addColorStop(0, `rgba(255,150,60,${0.8 * I})`); gr.addColorStop(0.3, `rgba(255,150,60,${0.3 * I})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); lg.fillStyle = gr; lg.fillRect(0, 0, c.width, c.height); }
    g.globalCompositeOperation = 'multiply'; g.drawImage(lit, 0, 0); g.globalCompositeOperation = 'source-over';
    return { c, S };
  }
  update(dt, t) {
    const cam = this.cam;
    cam.pos[2] = -0.38 * t; cam.update(t);
    for (const m of this.squad) {
      const h = m.h;
      if (t < m.t0) { h.t += dt; continue; }
      // out of the door, a turn, then down the alley at us
      const out = h.x < AW - 0.75;
      const target = out ? [m.lane, h.z - 3] : [AW - 1.0, AL.door[2] - 0.3];
      const want = Math.atan2(target[1] - h.z, target[0] - h.x);
      let dy = want - h.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU;
      h.yaw += dy * Math.min(1, dt * 3.5);
      h.step(dt);
      for (const st of h.takeSteps()) {
        const K = st.side > 0 ? 'R' : 'L', a = h.J['heel' + K];
        for (let i = 0; i < 8; i++) this.splash.push({ x: a[0], y: 0.02, z: a[2], vx: (Math.random() - 0.5) * 0.8, vy: 0.5 + Math.random() * 0.9, vz: (Math.random() - 0.5) * 0.8, t: 0 });
        this.env.audio?.cue('step', { wet: 1, vol: clamp(3 / Math.max(1, h.z - cam.pos[2])), pan: clamp(h.x / 2, -1, 1) });
      }
    }
    for (const p of this.splash) { p.t += dt; p.vy -= 9.8 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; }
    this.splash = this.splash.filter((p) => p.y > 0 && p.t < 0.7);
    this.steam.update(dt, [[0.25, 0.05, 6.2]], 0.12);
    this.rain.update(dt, cam, 0, true);
  }
  // a wall as vertical strips, each mapped onto its place on the screen
  drawWall(g, w, side) {
    const cam = this.cam, x = side * AW, n = 90;
    for (let i = 0; i < n; i++) {
      const z0 = -3 + (i / n) * 30, z1 = -3 + ((i + 1) / n) * 30;
      if (z1 < cam.pos[2] + 0.3) continue;
      const a = cam.project(x, w.Hh, Math.max(z0, cam.pos[2] + 0.3)), b = cam.project(x, w.Hh, z1), c = cam.project(x, 0, z1), d = cam.project(x, 0, Math.max(z0, cam.pos[2] + 0.3));
      if (a[2] <= 0 || b[2] <= 0) continue;
      const sx0 = (Math.max(z0, cam.pos[2] + 0.3) + 3) * w.S, sx1 = (z1 + 3) * w.S, sw = sx1 - sx0;
      // map texture rect (sx0, 0, sw, H) → quad a-b-c-d; the strip is thin, an affine map is close enough
      g.save();
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); g.clip();
      const th = w.c.height;
      g.setTransform((b[0] - a[0]) / sw, (b[1] - a[1]) / sw, (d[0] - a[0]) / th, (d[1] - a[1]) / th, a[0] - (b[0] - a[0]) / sw * sx0, a[1] - (b[1] - a[1]) / sw * sx0);
      g.drawImage(w.c, sx0 - 1, 0, sw + 2, th, sx0 - 1, 0, sw + 2, th);
      g.restore();
    }
  }
  drawFloor(g) {
    const cam = this.cam, f = this.floor, n = 120, zc = cam.pos[2] + 0.4;
    for (let i = 0; i < n; i++) {
      const za = zc + Math.pow(i / n, 1.6) * 27, zb = zc + Math.pow((i + 1) / n, 1.6) * 27;
      const a = cam.project(-AW, 0, zb), b = cam.project(AW, 0, zb), c = cam.project(AW, 0, za), d = cam.project(-AW, 0, za);
      if (d[2] <= 0) continue;
      const sy0 = (27 - zb) * f.S, sh = (zb - za) * f.S, tw = f.c.width;
      g.save();
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); g.clip();
      g.setTransform((b[0] - a[0]) / tw, (b[1] - a[1]) / tw, (d[0] - a[0]) / sh, (d[1] - a[1]) / sh, a[0] - (d[0] - a[0]) / sh * sy0, a[1] - (d[1] - a[1]) / sh * sy0);
      g.drawImage(f.c, 0, sy0 - 1, tw, sh + 2, 0, sy0 - 1, tw, sh + 2);
      g.restore();
    }
  }
  draw(g, t) {
    const W = this.W, H = this.H, cam = this.cam;
    // the end of the alley: the lit street beyond, a wet glow in the air
    g.fillStyle = '#060506'; g.fillRect(0, 0, W, H);
    const e = cam.project(0.2, 3, 27.5);
    const gr = g.createRadialGradient(e[0], e[1], 0, e[0], e[1], H * 1.1); gr.addColorStop(0, 'rgba(255,160,80,0.75)'); gr.addColorStop(0.12, 'rgba(180,100,50,0.4)'); gr.addColorStop(0.5, 'rgba(60,34,22,0.15)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // the building across the street at the end, its lit windows
    { const a = cam.project(-3, 0, 28.5), b = cam.project(3, 12, 28.5); g.fillStyle = 'rgba(40,26,18,0.85)'; g.fillRect(a[0], b[1], b[0] - a[0], a[1] - b[1]); for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) if ((i * 7 + j * 3) % 5 === 1) { const q = cam.project(-2.4 + i * 0.9, 3 + j * 3, 28.4); g.fillStyle = 'rgba(255,190,120,0.55)'; g.fillRect(q[0], q[1], 0.5 * q[3], 0.8 * q[3]); } }
    this.drawFloor(g);
    this.drawWall(g, this.wallL, -1); this.drawWall(g, this.wallR, 1);
    // the open door: the room's light spilling out onto the wet ground
    const op = smooth(0.25, 0.9, t);
    if (op > 0) {
      const z0 = AL.door[2] - 0.55, z1 = AL.door[2] + 0.55, zo = lerp(z0, z1, 1 - op);
      const q = [cam.project(AW, 2.2, zo), cam.project(AW, 2.2, z1), cam.project(AW, 0, z1), cam.project(AW, 0, zo)];
      g.fillStyle = 'rgba(120,70,36,0.9)'; g.beginPath(); q.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); g.closePath(); g.fill();
      const sp = cam.project(AW - 0.8, 0, AL.door[2]); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 * op; g.drawImage(tinted(softDot(64), '#ff9a50'), sp[0] - sp[3] * 1.0, sp[1] - sp[3] * 0.15, sp[3] * 2, sp[3] * 0.3); g.restore();
      // the door leaf, swung in
      const lf = [cam.project(AW, 2.2, zo), cam.project(AW - 1.1 * op * 0.9, 2.2, zo + 0.05), cam.project(AW - 1.1 * op * 0.9, 0, zo + 0.05), cam.project(AW, 0, zo)];
      g.fillStyle = '#121110'; g.beginPath(); lf.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); g.closePath(); g.fill();
    }
    // the lamps: a bracket lamp on the left wall, the street light at the end
    for (const [p, r0] of [[AL.lamp, 0.12], [AL.far, 0.18]]) { const q = cam.project(...p); glow(g, q[0], q[1], q[3] * 2.2, '#ff9a48', 0.35); glow(g, q[0], q[1], q[3] * r0, '#fff0d0', 1); }
    { const a = cam.project(-AW, 4.75, 19.5), b = cam.project(AL.lamp[0], 4.75, 19.5); g.strokeStyle = '#0c0b0b'; g.lineWidth = Math.max(1, 0.03 * a[3]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    // cables slung across overhead, black against the glow
    g.strokeStyle = '#080707'; for (const [z, y, sag] of [[12, 5.2, 0.35], [16.5, 5.6, 0.5], [21, 5.0, 0.3], [23.5, 6.0, 0.6]]) { const a = cam.project(-AW, y, z), b = cam.project(AW, y + 0.2, z + 0.3), m = cam.project(0, y - sag, z + 0.15); g.lineWidth = Math.max(0.8, 0.015 * m[3]); g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(m[0], m[1] + (m[1] - (a[1] + b[1]) / 2), b[0], b[1]); g.stroke(); }
    // reflections on the wet ground: the lamps smeared toward us, and the five, upside down
    reflect(g, cam, AL.lamp, 0, '#ffb070', 0.5, 0.35, t);
    reflect(g, cam, AL.far, 0, '#ffb070', 0.45, 0.5, t);
    const people = this.squad.filter((m) => t >= m.t0).map((m) => m.h).sort((a, b) => b.z - a.z);
    const rg = this.refl.getContext('2d'); rg.setTransform(1, 0, 0, 1, 0, 0); rg.clearRect(0, 0, W, H);
    const mc = mirrorCam(cam, 0);
    for (const h of people) h.draw(rg, mc, [], { body: '#050505', far: '#050505', emissive: false });
    g.save(); g.globalAlpha = 0.5; g.filter = 'blur(1.5px)'; g.drawImage(this.refl, 0, 0); g.restore();
    // steam off the grate, lit from behind
    g.save(); g.globalCompositeOperation = 'lighter'; this.steam.draw(g, cam, 1); g.restore();
    // the five, black against the light, rimmed by it
    const lampQ = cam.project(...AL.far);
    for (const h of people) {
      const q = cam.project(h.x, 1.2, h.z), d = h.z - cam.pos[2];
      if (h.x > AW - 0.2) continue; // still inside
      // the light is behind and above them: a thin rim, strongest at the head
      // and shoulders, fading down the body; a little cold fill from the street
      // behind us on their fronts
      const hq = cam.project(h.x, h.H * 0.95, h.z), ppm = hq[3];
      h.draw(g, cam, [{ dir: 'back', col: 'rgba(255,180,105,1)', w: 0.85, soft: 0.5, at: [hq[0], hq[1] - ppm * 0.5], fall: ppm * 1.3, glow: 0.25 }, { dir: [lampQ[0] - q[0], lampQ[1] - q[1]], col: 'rgba(255,190,120,0.55)', w: 0.6, soft: 0.5, at: [lampQ[0], lampQ[1]], fall: ppm * 2.4 }],
        { body: '#070708', far: '#060607', fill: { at: [q[0], q[1] + ppm * 0.4], r: ppm * 1.2, col: `rgba(40,48,58,${clamp(0.14 - d * 0.01, 0, 0.14).toFixed(3)})` }, visor: 0.22, scarf: '#3c0c0b' });
    }
    // the splashes off their boots, lit from behind
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,190,130,0.55)';
    for (const p of this.splash) { const q = cam.project(p.x, p.y, p.z); if (q[2] > 0) { g.beginPath(); g.arc(q[0], q[1], Math.max(0.5, 0.006 * q[3]), 0, TAU); g.fill(); } }
    g.restore();
    // rain: bright where it falls through the lamps' light
    const L1 = AL.lamp, L2 = AL.far;
    this.rain.draw(g, cam, { col: '#a9a39b', light: 0.45, puddle: true, tint: (x, y, z) => { const d1 = (x - L1[0]) ** 2 + (y - L1[1]) ** 2 + (z - L1[2]) ** 2, d2 = (x - L2[0]) ** 2 + (y - L2[1]) ** 2 + (z - L2[2]) ** 2, k = 6 / (d1 + 2) + 8 / (d2 + 3); return k > 0.15 ? ['#ffc890', clamp(k)] : null; } });
  }
  post() { return { grain: 0.08, halation: 0.55, lift: [5, 5, 6], warm: 0.05, cool: 0.06, vignette: 0.55, dirt: 0.55, flicker: 0.02 }; }
}
