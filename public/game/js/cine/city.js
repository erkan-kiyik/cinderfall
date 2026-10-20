// KOR — cinematics: the city at night seen from a roof (§2, shot 5).
// Blocks on a loose grid, cut into buildings of mixed heights; windows lit
// here and there in mixed colour temperatures; sodium lamps along the
// streets, their light rising between the rows of roofs into the rain; the
// low cloud lit orange from below. Drawn far to near into a plate, a few
// rows at a time (bake()) so it can be made while the shot before it plays.
import { rng, canvas, kelvin, clamp, fbm2, fogTexture } from './noise.js';

const TAU = Math.PI * 2;
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const WINK = [[2400, 0.34], [2800, 0.3], [3400, 0.14], [4300, 0.1], [6000, 0.12]];

// the plan: perimeter blocks of narrow apartment buildings (4–7 floors,
// 9–14 m wide) round a courtyard; streets 10 m; lamps both sides
export function buildCity(seed, { x0 = -900, x1 = 900, z0 = 60, z1 = 1300, street = 10, bw = 40, bd = 34 } = {}) {
  const r = rng(seed), boxes = [], lamps = [], rows = [];
  // some streets have been changed over to white LED, whole streets at a time
  const led = (k) => (Math.sin(k * 12.9898) * 43758.5453 % 1 + 1) % 1 < 0.28 ? 4200 : 1950;
  const add = (x0, x1, z0, z1) => {
    let fl = 4 + (r() * 4 | 0); if (r() < 0.08) fl += 3 + (r() * 4 | 0);
    boxes.push({ x0, x1, z0, z1, h: fl * 3 + 1.2 + r() * 0.8, fl, s: r(), occ: 0.12 + r() * r() * 0.45, tone: 0.55 + r() * 0.9, stair: r() < 0.55 });
  };
  for (let gz = z0; gz < z1; gz += bd + street) {
    rows.push(gz - street / 2);
    const off = (r() - 0.5) * 8;
    for (let gx = x0 + off; gx < x1; gx += bw + street) {
      if (r() < 0.04) continue;                                     // a yard, a car park
      const far = Math.hypot(gx, gz) > 650;
      if (far) { add(gx, gx + bw, gz, gz + bd); continue; }          // too far to see the courtyard
      // front and back rows: narrow buildings side by side, uneven
      for (const [za, zb] of [[gz, gz + 12 + r() * 3], [gz + bd - 12 - r() * 3, gz + bd]]) {
        for (let x = gx; x < gx + bw - 4;) { const w = Math.min(gx + bw - x, 9 + r() * 6); add(x, x + w, za, zb); x += w; }
      }
      // the two ends close the block
      add(gx, gx + 10 + r() * 2, gz + 13, gz + bd - 13); add(gx + bw - 10 - r() * 2, gx + bw, gz + 13, gz + bd - 13);
    }
  }
  for (let gz = z0; gz < z1; gz += bd + street) for (let x = x0; x < x1; x += 24 + r() * 8) {
    if (r() < 0.15) continue;
    lamps.push({ x, z: gz - street + 1.0 + (r() < 0.5 ? 0 : street - 2), y: 7.5, k: 0.6 + r() * 0.5, K: led(gz) });
  }
  for (let gx = x0; gx < x1; gx += bw + street) for (let z = z0; z < z1; z += 24 + r() * 8) {
    if (r() < 0.15) continue;
    lamps.push({ x: gx - street + 1.0 + (r() < 0.5 ? 0 : street - 2), z, y: 7.5, k: 0.6 + r() * 0.5, K: led(gx * 3.1) });
  }
  return { boxes, lamps, rows, street };
}

// sky: dark at the top, the cloud base orange-brown over the town
export function drawSky(g, W, H, horizon, seed = 4) {
  const gr = g.createLinearGradient(0, 0, 0, horizon);
  gr.addColorStop(0, '#07080b'); gr.addColorStop(0.45, '#0f0e10'); gr.addColorStop(0.8, '#241a14'); gr.addColorStop(1, '#3a281a');
  g.fillStyle = gr; g.fillRect(0, 0, W, horizon + 2);
  // the underside of the cloud: lumps lit unevenly, brighter low down
  const fog = softEdges(fogTexture(512, 128, seed, 5));
  g.save();
  g.globalAlpha = 0.16; g.drawImage(fog, -W * 0.15, horizon * 0.05, W * 1.3, horizon * 0.8);
  g.globalAlpha = 0.1; g.drawImage(fog, W * 0.2, horizon * 0.3, W * 1.2, horizon * 0.65);
  g.restore();
  // the horizon: the town's light in the wet air, a band brighter than the sky
  const hb = g.createLinearGradient(0, horizon - H * 0.12, 0, horizon + H * 0.06);
  hb.addColorStop(0, 'rgba(70,48,30,0)'); hb.addColorStop(0.65, 'rgba(84,58,36,0.55)'); hb.addColorStop(1, 'rgba(60,42,28,0.9)');
  g.fillStyle = hb; g.fillRect(0, horizon - H * 0.12, W, H * 0.18);
  // the ground: from the glowing horizon down to the dark near streets
  const gr2 = g.createLinearGradient(0, horizon, 0, H);
  gr2.addColorStop(0, 'rgb(62,44,30)'); gr2.addColorStop(0.12, 'rgb(30,23,18)'); gr2.addColorStop(0.5, 'rgb(13,11,10)'); gr2.addColorStop(1, 'rgb(10,9,8)');
  g.fillStyle = gr2; g.fillRect(0, horizon + 2, W, H);
}
// a texture faded out toward its four edges (so its rectangle never shows)
export function softEdges(src) {
  const c = canvas(src.width, src.height), g = c.getContext('2d');
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'destination-in';
  const gx = g.createLinearGradient(0, 0, c.width, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(0.2, 'rgba(0,0,0,1)'); gx.addColorStop(0.8, 'rgba(0,0,0,1)'); gx.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gx; g.fillRect(0, 0, c.width, c.height);
  const gy = g.createLinearGradient(0, 0, 0, c.height); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.3, 'rgba(0,0,0,1)'); gy.addColorStop(0.7, 'rgba(0,0,0,1)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gy; g.fillRect(0, 0, c.width, c.height);
  return c;
}

// the plate, far to near. opts: { haze: [r,g,b], hazeD, lit: 0..1 }
export function* bakeCity(g, cam, city, opts = {}) {
  const haze = opts.haze || [58, 40, 28], hazeD = opts.hazeD || 650, r = rng(opts.seed || 9);
  const C = cam.pos, P = (x, y, z) => cam.project(x, y, z, [0, 0, 0, 0]);
  const W = cam.W, H = cam.H, margin = W * 0.12;
  const onScreen = (q) => q[2] > 0 && q[0] > -margin && q[0] < W + margin && q[1] > -H * 0.5 && q[1] < H * 1.5;
  const dist = (x, z) => Math.hypot(x - C[0], z - C[2]);
  // the far carpet beyond the blocks: lights to the horizon
  {
    const n = 2600;
    for (let i = 0; i < n; i++) {
      const z = 1500 + Math.pow(r(), 0.6) * 4500, x = (r() - 0.5) * z * 1.5, q = P(x, 6 + r() * 20, z);
      if (!onScreen(q)) continue;
      const hk = 1 - Math.exp(-z / (hazeD * 1.6)), K = r() < 0.75 ? 2000 : r() < 0.5 ? 3200 : 5000;
      const c = mix(kelvin(K), haze, hk * 0.7);
      g.fillStyle = css(c, (0.25 + r() * 0.55) * (1 - hk * 0.6));
      const s = r() < 0.08 ? 1.6 : 0.9; g.fillRect(q[0], q[1], s, s * 0.8);
    }
    yield;
  }
  // the streets: dark wet strips with a pool of light under every lamp
  const drawList = [];
  for (const b of city.boxes) drawList.push({ k: 'box', b, d: dist(clamp(C[0], b.x0, b.x1), b.z0) });
  for (const L of city.lamps) drawList.push({ k: 'lamp', L, d: dist(L.x, L.z) });
  // the light hanging in the rain over each cross street
  for (const z of city.rows) drawList.push({ k: 'haze', z, d: z - C[2] });
  // anything else standing in the town, drawn at its depth: { d, draw(g) }
  for (const e of opts.extra || []) drawList.push({ k: 'extra', e, d: e.d });
  drawList.sort((a, b) => b.d - a.d);

  let n = 0;
  for (const it of drawList) {
    if (++n % 60 === 0) yield;
    if (it.k === 'lamp') {
      const L = it.L, q = P(L.x, L.y, L.z); if (!onScreen(q)) continue;
      const hk = 1 - Math.exp(-it.d / hazeD), c = kelvin(L.K || 1950);
      // the pool on the wet road and the lamp itself
      const pq = P(L.x, 0, L.z), pr = Math.max(1.5, 7 * pq[3]);
      g.save(); g.globalCompositeOperation = 'lighter';
      const gp = g.createRadialGradient(pq[0], pq[1], 0, pq[0], pq[1], pr);
      gp.addColorStop(0, css(c, 0.22 * L.k * (1 - hk))); gp.addColorStop(1, css(c, 0));
      g.fillStyle = gp; g.beginPath(); g.ellipse(pq[0], pq[1], pr, pr * 0.35, 0, 0, TAU); g.fill();
      const lr = Math.max(0.7, 0.5 * q[3]), gl = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], lr * 7);
      gl.addColorStop(0, css(L.K > 3000 ? [235, 240, 255] : [255, 220, 160], 0.9 * L.k * (1 - hk * 0.7))); gl.addColorStop(0.15, css(c, 0.35 * L.k * (1 - hk * 0.5))); gl.addColorStop(1, css(c, 0));
      g.fillStyle = gl; g.fillRect(q[0] - lr * 7, q[1] - lr * 7, lr * 14, lr * 14);
      g.restore();
      continue;
    }
    if (it.k === 'extra') { it.e.draw(g); continue; }
    if (it.k === 'haze') {
      const z = it.z, a = P(-2000, 0, z), b = P(-2000, 26, z); if (a[2] <= 0) continue;
      const hk = 1 - Math.exp(-it.d / hazeD), c = mix(kelvin(1950), haze, hk * 0.6);
      const gr = g.createLinearGradient(0, a[1], 0, b[1]);
      gr.addColorStop(0, css(c, 0.1 * (1 - hk * 0.5))); gr.addColorStop(1, css(c, 0));
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(0, b[1], W, a[1] - b[1]); g.restore();
      continue;
    }
    drawBox(g, cam, it.b, it.d, haze, hazeD, P, onScreen);
  }
}

function drawBox(g, cam, b, d, haze, hazeD, P, onScreen) {
  const C = cam.pos, hk = 1 - Math.exp(-d / hazeD);
  const q0 = P(b.x0, 0, b.z0), q1 = P(b.x1, b.h, b.z0);
  if (q0[2] <= 0) return;
  if (q1[0] < -cam.W * 0.15 || q0[0] > cam.W * 1.15 || q1[1] > cam.H * 1.4) return;
  const base = mix([8 + 6 * b.tone, 7.5 + 6 * b.tone, 7.5 + 6 * b.tone], haze, hk * 0.8);
  const side = mix([7 * b.tone, 6.8 * b.tone, 6.8 * b.tone], haze, hk * 0.8);
  const roof = mix([15 * b.tone, 13 * b.tone, 12 * b.tone], haze, hk * 0.75);
  const face = (pts, col, uplight) => {
    const q = pts.map((p) => P(p[0], p[1], p[2])); if (q.some((v) => v[2] <= 0)) return null;
    g.beginPath(); g.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) g.lineTo(q[i][0], q[i][1]); g.closePath();
    g.fillStyle = css(col); g.fill();
    if (uplight) {
      // the street lamps light the lower floors from below
      const yb = Math.max(q[0][1], q[1][1]), yt = P(pts[0][0], Math.min(12, b.h), pts[0][2])[1];
      const gr = g.createLinearGradient(0, yb, 0, yt);
      gr.addColorStop(0, `rgba(160,96,40,${(0.22 * (1 - hk)).toFixed(3)})`); gr.addColorStop(1, 'rgba(160,96,40,0)');
      g.save(); g.clip(); g.fillStyle = gr; g.fillRect(Math.min(...q.map((v) => v[0])), yt, Math.max(...q.map((v) => v[0])) - Math.min(...q.map((v) => v[0])), yb - yt); g.restore();
    }
    return q;
  };
  // the sides that face the camera, then the front, then the roof
  if (C[0] < b.x0) face([[b.x0, 0, b.z1], [b.x0, 0, b.z0], [b.x0, b.h, b.z0], [b.x0, b.h, b.z1]], side, true);
  if (C[0] > b.x1) face([[b.x1, 0, b.z0], [b.x1, 0, b.z1], [b.x1, b.h, b.z1], [b.x1, b.h, b.z0]], side, true);
  face([[b.x0, 0, b.z0], [b.x1, 0, b.z0], [b.x1, b.h, b.z0], [b.x0, b.h, b.z0]], base, true);
  windows(g, cam, b, d, hk, haze, P);
  if (C[1] > b.h) {
    face([[b.x0, b.h, b.z0], [b.x1, b.h, b.z0], [b.x1, b.h, b.z1], [b.x0, b.h, b.z1]], roof, false);
    // the parapet's edge catches the sky
    const a = P(b.x0, b.h, b.z0), e = P(b.x1, b.h, b.z0);
    g.strokeStyle = css(mix([44, 34, 28], haze, hk), 0.5); g.lineWidth = Math.max(0.5, 0.3 * a[3]);
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(e[0], e[1]); g.stroke();
    if (d < 520) clutter(g, cam, b, d, hk, haze, P);
  }
}

function windows(g, cam, b, d, hk, haze, P) {
  const r = rng((b.s * 1e6) | 0), C = cam.pos;
  const floors = b.fl || Math.max(1, Math.floor((b.h - 3) / 3.1));
  const darkFloor = Array.from({ length: floors }, () => r() < 0.2);
  const fronts = [['z', b.z0, b.x0, b.x1]];
  if (C[0] < b.x0) fronts.push(['x', b.x0, b.z0, b.z1]);
  if (C[0] > b.x1) fronts.push(['x', b.x1, b.z0, b.z1]);
  for (const [ax, at, s0, s1] of fronts) {
    const cols = Math.max(1, Math.floor((s1 - s0 - 1.5) / 3.1)), mid = (cols / 2) | 0, pad = (s1 - s0 - cols * 3.1) / 2;
    for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
      // the stairwell: a column of small windows on a timer, often on
      const stair = b.stair && ax === 'z' && c === mid;
      const lit = stair ? r() < 0.6 : !darkFloor[f] && r() < b.occ, y = (stair ? 4.3 : 3.0) + f * 3, u = s0 + pad + 0.8 + c * 3.1;
      if (stair) {
        const q = P(u + 0.3, y, at), e = P(u + 0.9, y + 0.8, at); if (q[2] <= 0) continue;
        g.fillStyle = lit ? css(mix(kelvin(r() < 0.5 ? 5600 : 3000), haze, hk * 0.5), 0.75 * (1 - hk * 0.7)) : css(mix([16, 14, 14], haze, hk * 0.8));
        g.fillRect(q[0], e[1], Math.max(0.7, e[0] - q[0]), Math.max(0.7, q[1] - e[1]));
        continue;
      }
      if (!lit) { if (d > 480) continue; }
      const pts = ax === 'z' ? [[u, y, at], [u + 1.3, y, at], [u + 1.3, y + 1.6, at], [u, y + 1.6, at]] : [[at, y, u], [at, y, u + 1.3], [at, y + 1.6, u + 1.3], [at, y + 1.6, u]];
      const q = pts.map((p) => P(p[0], p[1], p[2]));
      if (q.some((v) => v[2] <= 0)) continue;
      const w = Math.abs(q[1][0] - q[0][0]), h = Math.abs(q[2][1] - q[1][1]);
      if (!lit) {
        // dark glass: a little of the sky in it
        if (w < 1.2) continue;
        g.fillStyle = css(mix([20, 18, 19], haze, hk * 0.8), 0.9);
        quad(g, q); g.fill();
        continue;
      }
      let K = 2400, x = r(); for (const [k, p] of WINK) { if (x < p) { K = k; break; } x -= p; }
      const lum = (0.35 + r() * 0.65) * (1 - hk * 0.75);
      const col = mix(kelvin(K), haze, hk * 0.5);
      if (w < 1.4 || h < 1.4) {
        g.fillStyle = css(col, lum * 0.8); g.fillRect(q[0][0], q[3][1], Math.max(0.8, w), Math.max(0.8, h));
        continue;
      }
      g.fillStyle = css(col, lum); quad(g, q); g.fill();
      // what is in the window: a curtain half drawn, blinds, a lamp's hot spot
      const kind = r();
      if (kind < 0.3) { g.fillStyle = css([30, 22, 18], 0.55); const k = 0.3 + r() * 0.5; quad(g, [q[0], lerp2(q[0], q[1], k), lerp2(q[3], q[2], k), q[3]]); g.fill(); }
      else if (kind < 0.5 && h > 5) { g.fillStyle = css([10, 8, 8], 0.35); for (let i = 1; i < 6; i++) { const a = lerp2(q[0], q[3], i / 6), e = lerp2(q[1], q[2], i / 6); g.fillRect(a[0], a[1], e[0] - a[0], Math.max(0.5, h * 0.05)); } }
      else if (kind < 0.62) { g.fillStyle = css([255, 236, 200], 0.25 * lum); const m = lerp2(lerp2(q[0], q[1], 0.3 + r() * 0.4), lerp2(q[3], q[2], 0.5), 0.5); g.beginPath(); g.arc(m[0], m[1], Math.max(0.8, w * 0.25), 0, TAU); g.fill(); }
      // the frame's cross bar
      if (w > 6) { g.fillStyle = 'rgba(8,7,7,0.6)'; const a = lerp2(q[0], q[1], 0.5), e = lerp2(q[3], q[2], 0.5); g.fillRect(a[0] - 0.5, e[1], 1, a[1] - e[1]); }
    }
  }
}
const lerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
function quad(g, q) { g.beginPath(); g.moveTo(q[0][0], q[0][1]); g.lineTo(q[1][0], q[1][1]); g.lineTo(q[2][0], q[2][1]); g.lineTo(q[3][0], q[3][1]); g.closePath(); }

// on the roofs: stair housings, water tanks, dishes, a forest of aerials
function clutter(g, cam, b, d, hk, haze, P) {
  const r = rng((b.s * 7e5) | 0 + 3), col = css(mix([9, 9, 10], haze, hk * 0.8));
  g.fillStyle = col; g.strokeStyle = col;
  const n = 1 + (r() * 4 | 0);
  for (let i = 0; i < n; i++) {
    const x = b.x0 + 2 + r() * (b.x1 - b.x0 - 4), z = b.z0 + 2 + r() * (b.z1 - b.z0 - 4), k = r();
    if (k < 0.3) {
      // the stair housing: a small box with a door
      const w = 3 + r() * 2, hh = 2.6;
      quad(g, [P(x, b.h, z), P(x + w, b.h, z), P(x + w, b.h + hh, z), P(x, b.h + hh, z)].map((v) => [v[0], v[1]])); g.fill();
    } else if (k < 0.55) {
      // a water tank on legs
      const a = P(x, b.h, z), t = P(x, b.h + 1.1, z), R = 0.8 * a[3];
      g.fillRect(a[0] - R * 0.8, t[1], 1, a[1] - t[1]); g.fillRect(a[0] + R * 0.8, t[1], 1, a[1] - t[1]);
      g.beginPath(); g.ellipse(t[0], t[1] - R * 0.7, R, R * 0.9, 0, 0, TAU); g.fill();
    } else if (k < 0.8) {
      // satellite dishes, two or three, all looking the same way
      for (let j = 0; j < 1 + (r() * 3 | 0); j++) {
        const a = P(x + j * 0.9, b.h + 0.9, z + j * 0.3), R = 0.4 * a[3];
        g.beginPath(); g.ellipse(a[0], a[1], R * 0.45, R, -0.3, 0, TAU); g.fill();
        g.fillRect(a[0], a[1], Math.max(0.6, R * 0.12), P(x + j * 0.9, b.h, z)[1] - a[1]);
      }
    } else {
      // an aerial: a mast and a couple of cross bars
      const a = P(x, b.h, z), t = P(x, b.h + 2.5 + r() * 2.5, z);
      g.lineWidth = Math.max(0.5, 0.05 * a[3]);
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(t[0], t[1]); g.stroke();
      for (let j = 0; j < 2; j++) { const y = t[1] + (a[1] - t[1]) * j * 0.18, w = 0.8 * a[3]; g.beginPath(); g.moveTo(t[0] - w, y); g.lineTo(t[0] + w, y); g.stroke(); }
    }
  }
}
