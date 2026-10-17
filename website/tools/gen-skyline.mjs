// Generates the hero's layered city silhouettes as inline-able SVG partials.
//
//   node website/tools/gen-skyline.mjs   -> website/partials/skyline-*.svg
//
// Seeded, so the output is stable between runs and diffs stay readable. The
// shapes are the same vocabulary the game's own backdrop uses (towers with
// lit windows, sawtooth factory roofs, smokestacks, a cooling tower, a
// tower crane), drawn as flat silhouettes: the site's hero is a 2D side-view
// world, like the game, not a 3D render.

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../partials');
mkdirSync(outDir, { recursive: true });

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r1 = (n) => Math.round(n * 10) / 10;

// ------------------------------------------------------------------ far
function far() {
  const R = rng(9);
  const W = 1600, H = 420;
  let body = '', windows = '', stacks = [];
  let x = -20;
  while (x < W + 20) {
    const roll = R();
    if (roll < 0.14) {
      // sawtooth factory hall
      const w = 150 + R() * 110, h = 70 + R() * 50, teeth = Math.round(w / 34);
      let d = `M${r1(x)} ${H}V${r1(H - h)}`;
      const tw = w / teeth;
      for (let i = 0; i < teeth; i++) d += `l${r1(tw * 0.7)} -${r1(18 + R() * 4)}v${r1(18)}l${r1(tw * 0.3)} 0`;
      d += `V${H}Z`;
      body += d;
      if (R() < 0.7) {
        const sx = x + w * (0.25 + R() * 0.5), sh = h + 120 + R() * 110;
        body += `M${r1(sx)} ${H}V${r1(H - sh)}h${r1(16)}V${H}Z`;
        stacks.push([r1(sx + 8), r1(H - sh)]);
      }
      x += w + 6 + R() * 14;
    } else if (roll < 0.2) {
      // cooling tower
      const w = 110 + R() * 30, h = 150 + R() * 40, top = w * 0.62;
      const cx = x + w / 2;
      body += `M${r1(x)} ${H}C${r1(cx - w * 0.36)} ${r1(H - h * 0.55)} ${r1(cx - top * 0.38)} ${r1(H - h * 0.78)} ${r1(cx - top / 2)} ${r1(H - h)}`
        + `H${r1(cx + top / 2)}C${r1(cx + top * 0.38)} ${r1(H - h * 0.78)} ${r1(cx + w * 0.36)} ${r1(H - h * 0.55)} ${r1(x + w)} ${H}Z`;
      stacks.push([r1(cx), r1(H - h)]);
      x += w + 10;
    } else if (roll < 0.26) {
      // water tower on legs
      const w = 34 + R() * 10, legs = 60 + R() * 50, tank = 30;
      const base = H - 40 - R() * 60;
      body += `M${r1(x)} ${H}V${r1(base)}h${r1(w + 30)}V${H}Z`;
      body += `M${r1(x + 12)} ${r1(base)}l3 -${r1(legs)}h2l-1 ${r1(legs)}ZM${r1(x + w + 14)} ${r1(base)}l-3 -${r1(legs)}h-2l1 ${r1(legs)}Z`;
      body += `M${r1(x + 9)} ${r1(base - legs)}v-${tank}l${r1((w + 10) / 2)} -10l${r1((w + 10) / 2)} 10v${tank}Z`;
      x += w + 34;
    } else {
      // residential / office tower
      const w = 46 + R() * 74, h = 120 + R() * 210;
      const step = R() < 0.35 ? 10 + R() * 18 : 0;
      body += `M${r1(x)} ${H}V${r1(H - h)}h${r1(w)}V${H}Z`;
      if (step) body += `M${r1(x + w * 0.2)} ${r1(H - h)}v-${r1(step)}h${r1(w * 0.6)}v${r1(step)}Z`;
      if (R() < 0.4) {
        const ax = x + w * (0.3 + R() * 0.4), ah = 30 + R() * 50;
        body += `M${r1(ax)} ${r1(H - h - step)}v-${r1(ah)}h2v${r1(ah)}Z`;
      }
      // windows: a sparse grid, most of them dark
      const cols = Math.floor((w - 10) / 11), rows = Math.floor((h - 20) / 15);
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          if (R() < 0.075) windows += `M${r1(x + 7 + cx * 11)} ${r1(H - h + 12 + cy * 15)}h4v6h-4Z`;
        }
      }
      x += w + 2 + R() * 10;
    }
  }
  const svg = `<svg class="sky-layer__svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">`
    + `<path class="sky-far__body" d="${body}"/>`
    + `<path class="sky-far__windows" d="${windows}"/>`
    + `</svg>`;
  return { svg, stacks };
}

// ------------------------------------------------------------------ mid
function mid() {
  const R = rng(31);
  const W = 1600, H = 360;
  let body = '', lattice = '';
  const beacons = [];   // [x, y, colour, delay], placed as HTML by the build
  // ruined blocks with broken, jagged tops
  let x = -30;
  while (x < W + 30) {
    const w = 120 + R() * 150, h = 70 + R() * 120;
    let d = `M${r1(x)} ${H}V${r1(H - h)}`;
    const n = 4 + Math.floor(R() * 5);
    for (let i = 1; i <= n; i++) d += `L${r1(x + (w * i) / n)} ${r1(H - h + (R() < 0.45 ? R() * 46 : -R() * 10))}`;
    d += `V${H}Z`;
    body += d;
    if (R() < 0.5) beacons.push([r1(x + w * (0.2 + R() * 0.6)), r1(H - h - 4), R() < 0.6 ? 'amber' : 'red', r1(R() * 4)]);
    x += w - 10 + R() * 60;
  }
  // tower crane: mast lattice, jib, counter-jib, cable and hook
  const crane = (cx, mastH, jib, counter, flip = 1) => {
    const top = H - mastH;
    body += `M${r1(cx - 7)} ${H}V${r1(top)}h14V${H}Z`;
    for (let y = H; y > top + 14; y -= 14) lattice += `M${r1(cx - 7)} ${r1(y)}L${r1(cx + 7)} ${r1(y - 14)}M${r1(cx + 7)} ${r1(y)}L${r1(cx - 7)} ${r1(y - 14)}`;
    body += `M${r1(cx - counter * flip)} ${r1(top - 2)}h${r1((jib + counter) * flip)}v-8h${r1(-(jib + counter) * flip)}Z`;
    body += `M${r1(cx - 4)} ${r1(top - 10)}l4 -26l4 26Z`;
    body += `M${r1(cx - counter * flip)} ${r1(top - 10)}h${r1(22 * flip)}v18h${r1(-22 * flip)}Z`;
    const hx = cx + jib * 0.72 * flip;
    lattice += `M${r1(hx)} ${r1(top - 2)}V${r1(top + 90)}`;
    body += `M${r1(hx - 4)} ${r1(top + 90)}h8v8h-8Z`;
    beacons.push([r1(cx), r1(top - 36), 'red slow', r1(R() * 3)]);
    beacons.push([r1(cx + jib * flip), r1(top - 6), 'red slow', r1(R() * 3)]);
  };
  crane(1180, 300, 260, 70, -1);
  crane(330, 250, 210, 60, 1);
  // scaffold frame on a half-built block
  const sx = 760, sw = 150, sh = 150;
  for (let y = H; y >= H - sh; y -= 25) lattice += `M${sx} ${y}h${sw}`;
  for (let xx = sx; xx <= sx + sw; xx += 30) lattice += `M${xx} ${H}v-${sh}`;
  for (let y = H; y > H - sh; y -= 25) lattice += `M${sx} ${y}l30 -25`;
  const svg = `<svg class="sky-layer__svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">`
    + `<path class="sky-mid__body" d="${body}"/>`
    + `<path class="sky-mid__lattice" d="${lattice}"/>`
    + `</svg>`;
  return { svg, beacons: beacons.filter(([x]) => x > 0 && x < W).map(([x, y, c, d]) => [+(x / W * 100).toFixed(2), +(y / H * 100).toFixed(2), c, d]) };
}

// ------------------------------------------------------------------ near
function near() {
  const R = rng(77);
  const W = 1600, H = 200;
  let ground = `M0 ${H}V150`;
  for (let x = 0; x <= W; x += 40) ground += `L${x} ${r1(146 + R() * 6)}`;
  ground += `V${H}Z`;
  let props = '';
  // jersey barriers, a few toppled
  for (const [bx, tilt] of [[60, 0], [190, 0], [318, -14], [1220, 0], [1350, 9], [1488, 0]]) {
    props += `<path transform="rotate(${tilt} ${bx + 50} 150)" d="M${bx} 152l10 -44h80l10 44Z"/>`;
  }
  // broken fence posts with sagging wire
  let wire = '';
  for (let i = 0; i < 7; i++) {
    const px = 520 + i * 52, ph = 70 + R() * 30, lean = (R() - 0.5) * 10;
    props += `<path d="M${r1(px)} 152l${r1(lean)} -${r1(ph)}h4l${r1(-lean)} ${r1(ph)}Z"/>`;
    if (i) wire += `M${r1(px - 52 + 2)} ${r1(100 + R() * 8)}Q${r1(px - 26)} ${r1(118 + R() * 14)} ${r1(px + 2)} ${r1(100 + R() * 8)}`;
  }
  // rubble
  for (let i = 0; i < 18; i++) {
    const rx = R() * W, rw = 8 + R() * 26, rh = 4 + R() * 10;
    props += `<path d="M${r1(rx)} 152l${r1(rw * 0.2)} -${r1(rh)}l${r1(rw * 0.5)} -${r1(rh * 0.4)}l${r1(rw * 0.3)} ${r1(rh * 1.4)}Z"/>`;
  }
  // a street lamp, its head lit
  props += `<path d="M1010 152V44q0 -10 12 -12h40v6h-38q-6 0 -6 8V152Z"/>`;
  const svg = `<svg class="sky-layer__svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">`
    + `<path class="sky-near__ground" d="${ground}"/>`
    + `<g class="sky-near__props">${props}</g>`
    + `<path class="sky-near__wire" d="${wire}"/>`
    + `<rect class="sky-near__lamp" x="1030" y="38" width="30" height="5" rx="2"/>`
    + `</svg>`;
  return { svg };
}

// ------------------------------------------------------------------ cables
function cables() {
  const W = 1600, H = 220;
  const d = `M-20 30Q380 150 820 40M-20 70Q300 190 640 120Q980 40 1620 110M760 -10Q1100 170 1620 30M1180 -10Q1340 120 1620 160`;
  const svg = `<svg class="sky-layer__svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">`
    + `<path class="sky-cables__line" d="${d}"/></svg>`;
  return { svg };
}

const f = far();
writeFileSync(resolve(outDir, 'skyline-far.svg'), f.svg + '\n');
const m = mid();
writeFileSync(resolve(outDir, 'skyline-mid.svg'), m.svg + '\n');
writeFileSync(resolve(outDir, 'skyline-beacons.json'), JSON.stringify(m.beacons) + '\n');
writeFileSync(resolve(outDir, 'skyline-near.svg'), near().svg + '\n');
writeFileSync(resolve(outDir, 'skyline-cables.svg'), cables().svg + '\n');
// Smokestack tops and beacon lights, as percentages of their layer, so the
// build can place them as HTML: animating opacity/transform on an HTML box is
// composited, where animating a shape inside a large SVG repaints all of it.
writeFileSync(resolve(outDir, 'skyline-stacks.json'), JSON.stringify(f.stacks.map(([x, y]) => [+(x / 16).toFixed(2), +(y / 4.2).toFixed(2)])) + '\n');
console.log('skyline partials written to', outDir);
