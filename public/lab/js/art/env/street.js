// KOR LAB — the street, style-board cut.
//
// Units are world units (a person is 64 tall); the street surface is y = 0
// and the scene spans x 0..600. Background layers are flat colour with no
// outline and saturation held low; anything you can stand behind, shoot or
// use is a prop with the dark outline, so the play layer always reads first.
import { cel, fill, stroke, clip, rng, setRoot } from '../kit.js';
import { M, tone, mat, C } from '../style.js';
import { emblem } from '../enemies/syndicate.js';
import { facadeStrip } from './city.js';

const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

const SKY = ['#151b27', '#1a2130', '#202839', '#283043', '#33384d', '#433f54', '#57475a'];
const FAR = '#262e3e', FAR_WIN = '#6c6372';
const MID = '#2e3748', MID_HI = '#38425a';

function sky(g) {
  // stepped night bands, warmer toward the horizon: the old sodium lamps on
  // the low cloud, nothing burning (docs §10.4)
  const top = -172, h = 150 / SKY.length;
  SKY.forEach((c, i) => fill(g, rect(-10, top + i * h, 610, top + (i + 1) * h + 0.5), c));
  fill(g, rect(-10, -64, 610, -22), '#5a4446', 0.35);
  fill(g, rect(-10, -48, 610, -22), '#7a5040', 0.22);
  // a few stars where the smoke is thin
  const r = rng(5);
  for (let i = 0; i < 40; i++) { const x = r() * 610, y = -170 + r() * 46, k = 0.3 + r() * 0.4; fill(g, rect(x, y, x + k, y + k), '#c9cfe0', 0.35 + r() * 0.4); }
}

function farCity(g) {
  // sodium glow on the cloud over the town, white haze over the port where
  // Vanta's floodlights are; no fires: the furnace has been cold four years
  fill(g, rect(-10, -96, 610, -58), '#4a3a40', 0.32);
  fill(g, rect(-10, -80, 610, -58), '#7a5238', 0.22);
  fill(g, ell(540, -70, 110, 22), '#c9d6ec', 0.07);
  // the works: the cold blast furnace, its four stoves, the skip bridge, a dead stack
  const W = '#2c3343';
  for (const x of [20, 31, 42, 53]) { fill(g, rect(x, -126, x + 8.6, -60), W); fill(g, ell(x + 4.3, -126, 4.3, 4.6), W); }
  fill(g, poly([[64, -60], [66, -134], [70, -146], [78, -146], [82, -134], [84, -60]]), W);
  fill(g, rect(69, -158, 79, -146), W);
  stroke(g, 'M 71 -157 C 71 -168 60 -168 57 -150 L 57 -126 M 77 -157 C 77 -170 92 -170 94 -152 L 94 -60', W, 1.6);
  fill(g, poly([[78, -144], [80, -146], [128, -60], [124, -60]]), W);
  for (let k = 0; k < 9; k++) { const t = k / 9; stroke(g, `M ${80 + t * 46} ${-146 + t * 86} L ${84 + t * 46} ${-140 + t * 86}`, W, 0.4); }
  fill(g, poly([[100, -60], [102, -164], [106, -164], [108, -60]]), W);
  for (let y = -160; y > -166; y -= 2) fill(g, rect(101.6, y, 106.4, y + 0.6), '#232a38');
  // the port: two gantry cranes over the quay, Vanta's floodlight masts
  for (const cx of [492, 556]) {
    stroke(g, `M ${cx - 10} -60 L ${cx - 6} -122 M ${cx + 10} -60 L ${cx + 6} -122 M ${cx - 9} -90 L ${cx + 9} -90`, W, 1.4);
    fill(g, rect(cx - 8, -128, cx + 8, -120), W);
    fill(g, rect(cx - 30, -126, cx + 44, -123.6), W);
    stroke(g, `M ${cx} -134 L ${cx - 28} -126 M ${cx} -134 L ${cx + 42} -126`, W, 0.5);
    fill(g, rect(cx - 1, -136, cx + 1, -128), W);
  }
  for (const mx of [470, 528, 598]) { fill(g, rect(mx, -112, mx + 1, -60), W); fill(g, rect(mx - 2, -114, mx + 3, -112), W); g.save(); g.shadowColor = '#e8f0ff'; g.shadowBlur = 5; fill(g, rect(mx - 1.6, -113.6, mx + 2.6, -112.6), '#eef4ff'); g.restore(); }
  // thin smoke from the houses' stoves, here and there
  for (const [x, y] of [[180, -98], [262, -92], [350, -104], [612 - 210, -96]]) for (let k = 0; k < 5; k++) fill(g, ell(x + k * k * 0.9, y - k * 4.4, 2 + k * 1.4, 1.4 + k * 0.8), '#3a3c48', 0.32 - k * 0.05);
  const r = rng(91);
  let x = -6;
  while (x < 610) {
    const w = 14 + r() * 26, h = 20 + r() * 44, top = -84 - h;
    fill(g, rect(x, top, x + w, -60), FAR);
    // roof clutter: an antenna, a water tank, a stepped crown
    const k = r();
    if (k < 0.3) { fill(g, rect(x + w * 0.5, top - 8, x + w * 0.5 + 0.8, top), FAR); fill(g, rect(x + w * 0.5 - 2, top - 5, x + w * 0.5 + 2.8, top - 4.4), FAR); }
    else if (k < 0.5) { fill(g, rect(x + 3, top - 6, x + 9, top - 1.2), FAR); fill(g, rect(x + 3.6, top - 1.2, x + 4.4, top), FAR); fill(g, rect(x + 7.6, top - 1.2, x + 8.4, top), FAR); }
    else if (k < 0.65) fill(g, rect(x + 3, top - 5, x + w - 3, top), FAR);
    // most windows dark (the power is rationed); a few lit warm and low
    for (let wy = top + 4; wy < -64; wy += 5) for (let wx = x + 2; wx < x + w - 3; wx += 4) {
      const q = r();
      if (q > 0.86) fill(g, rect(wx, wy, wx + 1.4, wy + 2), FAR_WIN, 0.55);
      else if (q > 0.835) fill(g, rect(wx, wy, wx + 1.4, wy + 2), '#e8a060', 0.5);
    }
    x += w + r() * 3;
  }
  // a construction crane over the skyline, stopped since the works shut
  fill(g, rect(150, -150, 152, -60), FAR); fill(g, rect(126, -150, 212, -148), FAR);
  for (let k = 128; k < 210; k += 6) stroke(g, `M ${k} -148 L ${k + 3} -150`, FAR, 0.5);
  stroke(g, 'M 151 -158 L 128 -150 M 151 -158 L 210 -150', FAR, 0.5);
  fill(g, rect(150.4, -160, 151.6, -150), FAR); fill(g, rect(190, -148, 190.6, -126), '#1d2330'); fill(g, rect(187, -126, 193.6, -123), FAR);
  g.save(); g.shadowColor = C.danger; g.shadowBlur = 6; fill(g, ell(151, -160, 0.9, 0.9), C.danger); g.restore();
  // the Tower: the campaign's final objective on the horizon
  fill(g, poly([[420, -60], [424, -154], [436, -162], [448, -154], [452, -60]]), '#222a39');
  fill(g, rect(434.5, -176, 437.5, -160), '#222a39');
  g.save(); g.shadowColor = C.danger; g.shadowBlur = 10; fill(g, ell(436, -176, 1.6, 1.6), C.danger); g.restore();
  for (let y = -150; y < -66; y += 7) fill(g, rect(428, y, 444, y + 1.2), '#3a3550', 0.8);
}

function midIndustry(g) {
  // the shut works: sawtooth roofs with their glass gone, two cold stacks
  // (Vanta's searchlight on one), the rolling mill's long shed, a Syndicate billboard
  const Y = -42;
  fill(g, poly([[-10, Y], [-10, Y - 52], [20, Y - 66], [20, Y - 52], [50, Y - 66], [50, Y - 52], [80, Y - 66], [80, Y - 52], [110, Y - 66], [110, Y]]), MID);
  for (const x of [-10, 20, 50, 80]) for (let k = 0; k < 4; k++) fill(g, poly([[x + 4 + k * 6.4, Y - 52.6], [x + 9 + k * 6.4, Y - 52.6], [x + 9 + k * 6.4, Y - 56.6 - k * 2.6], [x + 4 + k * 6.4, Y - 54.4 - k * 2.6]]), '#1e2532', 0.8);
  fill(g, rect(120, Y - 92, 132, Y), MID); fill(g, rect(118, Y - 94, 134, Y - 90), MID_HI);
  fill(g, rect(146, Y - 78, 156, Y), MID); fill(g, rect(144, Y - 80, 158, Y - 76), MID_HI);
  for (const [x0, x1, y] of [[120, 132, Y - 70], [120, 132, Y - 40], [146, 156, Y - 50]]) fill(g, rect(x0, y, x1, y + 1), '#252d3c');
  fill(g, rect(123, Y - 97, 129, Y - 94), '#3a4252'); fill(g, rect(124, Y - 96.4, 128, Y - 95.4), '#dfe8f6', 0.8);
  fill(g, rect(110, Y - 40, 300, Y), MID);
  fill(g, poly([[300, Y], [300, Y - 50], [360, Y - 50], [380, Y - 38], [380, Y]]), MID);
  fill(g, rect(500, Y - 56, 610, Y), MID);
  for (let x = 504; x < 606; x += 8) fill(g, rect(x, Y - 52, x + 4, Y - 48), '#1e2532', 0.8);
  for (const x of [520, 568]) fill(g, rect(x, Y - 52, x + 4, Y - 48), '#c88a52', 0.5);
  // billboard on stilts
  const B = Y - 52;
  fill(g, rect(334, B, 336, Y), '#1c2230'); fill(g, rect(390, B, 392, Y), '#1c2230');
  fill(g, rect(318, B - 36, 410, B), '#252c3b');
  fill(g, rect(320, B - 34, 408, B - 2), '#3c2730');
  fill(g, rect(320, B - 10, 408, B - 6), C.danger, 0.8);
  emblem(g, 340, B - 22, 8, '#e8d9d9');
  g.font = '700 10px Rajdhani'; g.fillStyle = '#e8d9d9'; g.textBaseline = 'alphabetic';
  g.fillText('VANTA SYNDICATE', 354, B - 20);
  g.font = '600 6px Rajdhani'; g.fillStyle = '#c9a9ae'; g.fillText('DÜZEN · GÜVENLİK · İTAAT', 354, B - 12);
  // haze between the layers
  fill(g, rect(-10, -64, 610, -40), '#5a5168', 0.16);
  fill(g, rect(-10, -52, 610, -40), '#5a5168', 0.14);
}

// --- ground -----------------------------------------------------------------
function ground(g) {
  const r = rng(77);
  // the pavement: slabs, joints, a few cracked and stained ones
  fill(g, rect(-10, 0, 610, 4.2), '#56607a');
  fill(g, rect(-10, 0, 610, 0.8), '#7a849c');
  for (let x = -4; x < 610; x += 12) stroke(g, `M ${x} 0.8 L ${x - 0.8} 4.2`, '#46506a', 0.35);
  for (let i = 0; i < 14; i++) {
    const x = r() * 600, k = r();
    if (k < 0.5) stroke(g, `M ${x} 1 l 1.4 1.2 l -0.6 1.6`, '#3e4760', 0.25);
    else fill(g, ell(x, 2.4, 2 + r() * 3, 0.8), '#3e4760', 0.5);
  }
  // the kerb: a lit edge, its face, the gutter
  fill(g, rect(-10, 4.2, 610, 5.1), '#8c94a8');
  fill(g, rect(-10, 5.1, 610, 7.2), '#394052');
  for (let x = 0; x < 610; x += 24) stroke(g, `M ${x} 4.2 L ${x} 7.2`, '#2c3242', 0.3);
  fill(g, rect(-10, 7.2, 610, 8.8), '#1b2029');
  // storm drains in the kerb
  for (const x of [70, 330, 540]) { fill(g, rect(x, 5.4, x + 10, 8.8), '#0f1217'); for (let k = x + 1; k < x + 10; k += 1.6) fill(g, rect(k, 5.4, k + 0.6, 8.8), '#2c3242'); }
  // the road
  fill(g, rect(-10, 8.8, 610, 42), '#222833');
  for (let i = 0; i < 7; i++) { const x = r() * 590, w = 24 + r() * 50, y = 10 + r() * 22; fill(g, rect(x, y, x + w, y + 4 + r() * 6), r() > 0.5 ? '#262c38' : '#1f242e'); }
  for (let i = 0; i < 9; i++) {
    const x = r() * 600, y = 11 + r() * 26;
    stroke(g, `M ${x} ${y} l ${2 + r() * 3} ${r() * 1.6 - 0.8} l ${2 + r() * 3} ${r() * 1.6 - 0.8} l ${1 + r() * 2} ${r() * 1.6 - 0.8}`, '#171b23', 0.3);
  }
  // worn lane dashes
  for (let x = 0; x < 610; x += 40) { fill(g, rect(x, 22.6, x + 20, 24.2), '#5b6377'); fill(g, rect(x + 4 + r() * 10, 22.6, x + 7 + r() * 10, 24.2), '#222833', 0.7); }
  // manholes, oil stains, puddles catching the street lights
  for (const x of [150, 470]) { fill(g, ell(x, 31, 7, 1.8), '#14171d'); fill(g, ell(x, 30.8, 6.2, 1.4), '#2c323e'); for (let k = -4; k <= 4; k += 2) stroke(g, `M ${x + k} 29.8 L ${x + k} 31.8`, '#1b1f27', 0.3); }
  for (const [x, y, w] of [[220, 14, 9], [410, 33, 12], [590, 17, 7]]) fill(g, ell(x, y, w, 1.4), '#15191f', 0.7);
  for (const [x, y, w, c] of [[100, 12.6, 14, '#ffcf8f'], [300, 16, 10, '#ff6b52'], [520, 13, 16, '#ffcf8f']]) {
    fill(g, ell(x, y, w, 1.6), '#181c24');
    fill(g, ell(x - w * 0.2, y - 0.2, w * 0.5, 0.5), c, 0.22);
    fill(g, ell(x + w * 0.3, y + 0.3, w * 0.25, 0.3), '#8a96b0', 0.18);
  }
  fill(g, rect(-10, 36, 610, 42), '#000', 0.2);
}

// --- props (outlined play layer) ---------------------------------------------
// docs §10.2: the street's things are old and used; the cells' are made by
// hand; Vanta's are new, the same, clean.
const WOOD = mat(tone('#b38a5e', '#8c6741', '#634629', '#2e1f11'), 'wood', 0.8);
const CONC = mat(tone('#b7b7b0', '#8e8e87', '#676761', '#2f2f2b'), 'concrete', 0.7);
const POLY = mat(tone('#b3c4d3', '#8499ad', '#5c7186', '#243342'), 'paint', 0.25);
const RUST = tone('#b0663a', '#8a4a26', '#5e3118', '#2a1409');
const EMBER = '#e2692f';
// rust blooms and their runs
function rust(g, pts, a = 0.75) {
  for (const [x, y, r, run = 0] of pts) {
    fill(g, ell(x, y, r, r * 0.7), RUST.m, a);
    if (run) fill(g, poly([[x - r * 0.3, y], [x + r * 0.3, y], [x + r * 0.1, y + run], [x - r * 0.05, y + run]]), RUST.d, a * 0.7);
  }
}
// the cells' mark sprayed on a surface: an ember, its drips
export function korMark(g, x, y, r, a = 0.85) {
  g.save(); g.globalAlpha = a;
  fill(g, poly([[x - r, y], [x - r * 0.3, y - r * 0.9], [x + r * 0.6, y - r * 0.7], [x + r, y + r * 0.1], [x + r * 0.3, y + r * 0.9], [x - r * 0.7, y + r * 0.6]]), EMBER);
  fill(g, ell(x, y, r * 0.38, r * 0.32), '#ffc07a');
  for (const [dx, l] of [[-0.5, 1.4], [0.2, 2.0], [0.7, 1.0]]) stroke(g, `M ${x + dx * r} ${y + r * 0.6} l 0 ${l * r}`, EMBER, r * 0.12);
  g.restore();
}

// a supply crate: rough planks, a frame, the cells' mark and a lot number stencilled on
export function crate(g, x, w = 18, h = 16) {
  const B = rect(x, -h, x + w, 0), f = 2.2;
  cel(g, B, WOOD, { sh: 1.6, hl: 0.6 });
  clip(g, B, () => {
    // planks with gaps, each its own shade
    for (let i = 0, y = -h; y < 0; y += 3.6, i++) {
      cel(g, rect(x, y + 0.2, x + w, Math.min(0, y + 3.4)), { ...WOOD, m: i % 2 ? WOOD.m : '#916b45' }, { sh: 0.4, hl: 0.25, lw: 0.18, ao: 0.3 });
      for (const nx of [x + f + 0.8, x + w - f - 0.8]) fill(g, ell(nx, y + 1.8, 0.22, 0.22), '#3a3a3a');
    }
    // the frame boards round the edge and the brace
    cel(g, rect(x, -h, x + w, -h + f), WOOD, { sh: 0.4, hl: 0.3, lw: 0.2 });
    cel(g, rect(x, -f, x + w, 0), WOOD, { sh: 0.4, hl: 0.2, lw: 0.2 });
    cel(g, rect(x, -h, x + f, 0), WOOD, { sh: 0.4, hl: 0.3, lw: 0.2 });
    cel(g, rect(x + w - f, -h, x + w, 0), WOOD, { sh: 0.4, hl: 0.2, lw: 0.2 });
    cel(g, poly([[x + f, -f - 1.6], [x + f + 1.6, -f], [x + w - f, -h + f + 1.6], [x + w - f - 1.6, -h + f]]), WOOD, { sh: 0.4, hl: 0.3, lw: 0.2 });
    // stencils: the lot, and the cells' ember sprayed over a Vanta seal
    g.font = '700 2.2px sans-serif'; g.fillStyle = 'rgba(30,20,12,0.65)'; g.fillText('LOT 07', x + f + 1.2, -h + f + 3.0);
    emblem(g, x + w * 0.62, -h * 0.5, 2.4, 'rgba(236,240,244,0.55)');
    korMark(g, x + w * 0.66, -h * 0.46, 2.2, 0.8);
    // grime low down, a damp line
    g.save(); g.globalCompositeOperation = 'multiply'; const gr = g.createLinearGradient(0, -h * 0.4, 0, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(50,40,30,0.55)'); g.fillStyle = gr; g.fillRect(x, -h, w, h); g.restore();
  });
  // steel corners with a rivet each
  for (const [cx, cy, sx, sy] of [[x, -h, 1, 1], [x + w, -h, -1, 1], [x, 0, 1, -1], [x + w, 0, -1, -1]]) {
    const L = poly([[cx, cy], [cx + 3.4 * sx, cy], [cx + 3.4 * sx, cy + 1.1 * sy], [cx + 1.1 * sx, cy + 1.1 * sy], [cx + 1.1 * sx, cy + 3.4 * sy], [cx, cy + 3.4 * sy]]);
    cel(g, L, mat(M.gunmetal, 'steel', 0.5), { sh: 0.3, hl: 0.2, lw: 0.25 });
    fill(g, ell(cx + 0.7 * sx, cy + 0.7 * sy, 0.3, 0.3), M.gunmetal.l);
    rust(g, [[cx + 1.6 * sx, cy + 1.6 * sy, 0.5, 0.8]], 0.5);
  }
}

// a Vanta jersey barrier: blue-grey polymer, filled with water, the ring-and-bar
// mark and the number in white, a red LED strip along the top
export function barrier(g, x, w = 34) {
  const B = poly([[x, 0], [x + 4, -6], [x + 6, -16], [x + w - 6, -16], [x + w - 4, -6], [x + w, 0]]);
  cel(g, B, POLY, { sh: 1.8, hl: 0.7 });
  clip(g, B, () => {
    // the moulded foot, its fork-lift slots, the top face lit; the fill cap
    fill(g, rect(x, -6, x + w, 0), POLY.d, 0.5);
    for (const sx of [x + 7, x + w - 13]) cel(g, rect(sx, -3.6, sx + 6, -1.0), mat(tone('#2a3644', '#1c2530', '#121820', '#06080b'), 'rubber', 0.4), { sh: 0.3, hl: 0.15, lw: 0.2 });
    stroke(g, `M ${x + 6.4} -15.2 L ${x + w - 6.4} -15.2`, '#ffffff', 0.3, 0.5);
    emblem(g, x + w * 0.5, -10.6, 2.6, 'rgba(244,246,248,0.9)');
    g.font = '700 2.0px sans-serif'; g.fillStyle = 'rgba(244,246,248,0.8)'; g.fillText('V-114', x + w - 13, -7.2);
    // scuffs from boots and a tyre, the dust low down
    for (const [sx, sy] of [[x + 8, -5.0], [x + 20, -4.2], [x + 26, -12.0]]) stroke(g, `M ${sx} ${sy} l 3 0.5`, POLY.k, 0.25, 0.4);
    g.save(); g.globalCompositeOperation = 'multiply'; const gr = g.createLinearGradient(0, -8, 0, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(60,64,70,0.45)'); g.fillStyle = gr; g.fillRect(x, -8, w, 8); g.restore();
  });
  // the LED strip and its housing
  fill(g, rect(x + 6.6, -17.2, x + w - 6.6, -16), '#11161c');
  g.save(); g.shadowColor = '#ff3347'; g.shadowBlur = 6; fill(g, rect(x + 7.2, -16.95, x + w - 7.2, -16.35), '#ff3347'); g.restore();
  fill(g, rect(x + 7.4, -16.85, x + w - 7.4, -16.65), '#ffb0b8');
}

export function lampPost(g, x, h = 82) {
  const P = tone('#5d6878', '#3c4654', '#2a323d', '#12151b');
  cel(g, rect(x - 1.2, -h, x + 1.2, 0), P, { sh: 0.8, hl: 0.3 });
  // joints, an access hatch, a sticker, the base flange with bolts
  for (const y of [-h + 20, -h + 44]) cel(g, rect(x - 1.6, y, x + 1.6, y + 1.6), P, { sh: 0.3, hl: 0.2, lw: 0.25 });
  fill(g, rect(x - 0.8, -18, x + 0.8, -12), P.d);
  fill(g, rect(x - 1, -30, x + 1, -27), '#c9b991', 0.8);
  cel(g, poly([[x - 3.2, 0], [x - 2.4, -4], [x + 2.4, -4], [x + 3.2, 0]]), P, { sh: 0.6, hl: 0.3 });
  for (const bx of [x - 2.2, x + 2.2]) fill(g, ell(bx, -0.9, 0.4, 0.4), P.l);
  // the arm and the lamp head
  cel(g, poly([[x, -h], [x + 14, -h - 2], [x + 14, -h + 0.6], [x, -h + 2.2]]), P, { sh: 0.5, hl: 0.2 });
  stroke(g, `M ${x} ${-h + 6} Q ${x + 4} ${-h + 1} ${x + 9} ${-h - 0.6}`, P.d, 0.5);
  cel(g, poly([[x + 10, -h - 1.4], [x + 20, -h - 1.4], [x + 22, -h + 2.4], [x + 8, -h + 2.4]]), P, { sh: 0.5, hl: 0.3 });
  fill(g, rect(x + 12, -h - 2.6, x + 18, -h - 1.4), P.d);
  fill(g, rect(x + 9.6, -h + 2.2, x + 20.4, -h + 3.2), '#fff1d0');
}

function lampLight(g, x, h = 82) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const cx = x + 15;
  fill(g, poly([[cx - 5, -h + 3], [cx + 5, -h + 3], [cx + 26, 0], [cx - 26, 0]]), '#ffcf8f', 0.10);
  fill(g, poly([[cx - 4, -h + 3], [cx + 4, -h + 3], [cx + 16, 0], [cx - 16, 0]]), '#ffcf8f', 0.08);
  fill(g, ell(cx, 1.5, 26, 3), '#ffcf8f', 0.16);
  fill(g, ell(cx, -h + 3, 6, 3), '#fff1d0', 0.35);
  g.restore();
}

// a skip that has stood on this street for years: green paint gone to rust
export function dumpster(g, x) {
  const D = mat(tone('#5f7d62', '#45604a', '#2f4434', '#132018'), 'paint', 0.7);
  const B = poly([[x, -20], [x + 40, -20], [x + 38, -2], [x + 2, -2]]);
  cel(g, B, D, { sh: 1.8, hl: 0.6 });
  clip(g, B, () => {
    for (let k = x + 6; k < x + 38; k += 8) { stroke(g, `M ${k} -18 L ${k} -4`, D.d, 0.8); stroke(g, `M ${k + 0.8} -18 L ${k + 0.8} -4`, D.l, 0.3, 0.5); }
    rust(g, [[x + 4, -19.4, 1.4, 4], [x + 15, -19.6, 0.9, 6], [x + 30, -19.4, 1.2, 3], [x + 37, -6, 1.6], [x + 10, -4, 2.0], [x + 22, -12, 0.8, 2]]);
    // the council's plate, half the letters gone; a poster torn off; the cells' mark
    fill(g, rect(x + 26, -16, x + 35, -12), '#c9c4b6', 0.9);
    g.font = '700 2.2px sans-serif'; g.fillStyle = '#3c4a3e'; g.fillText('AT K', x + 27, -13.2);
    fill(g, poly([[x + 6, -15], [x + 12, -15.6], [x + 11.6, -10], [x + 8, -11.4], [x + 6.2, -9.8]]), '#d8cfb8', 0.6);
    korMark(g, x + 18, -9.6, 2.4, 0.75);
    fill(g, rect(x, -7, x + 40, -2), '#000', 0.18);
  });
  // the lid, a little open, its hinge and the side handles
  cel(g, poly([[x - 1, -21.6], [x + 41, -24.2], [x + 41, -22.2], [x - 1, -19.6]]), D, { sh: 0.4, hl: 0.25 });
  fill(g, rect(x - 1.6, -21.4, x + 1, -19.4), D.k);
  for (const hx of [x + 1.2, x + 36.6]) cel(g, rect(hx, -16, hx + 2.2, -14.4), mat(M.gunmetal, 'steel', 0.5), { sh: 0.2, hl: 0.2, lw: 0.25 });
  for (const wx of [x + 6, x + 34]) cel(g, ell(wx, -1.6, 1.8, 1.8), mat(M.rubber, 'rubber', 0.5), { sh: 0.4, hl: 0.2 });
}

// an oil drum with holes punched round its foot, a fire of scrap wood in it
export function burnBarrel(g, x) {
  const T = mat(tone('#8a5a46', '#63392b', '#44271d', '#20120c'), 'paint', 0.8);
  const B = poly([[x + 0.4, -14], [x + 9.6, -14], [x + 10, -12.6], [x + 10, -1], [x + 9.4, 0], [x + 0.6, 0], [x, -1], [x, -12.6]]);
  cel(g, B, T, { sh: 1.3, hl: 0.5 });
  clip(g, B, () => {
    for (const y of [-10, -4.6]) { fill(g, rect(x, y, x + 10, y + 1), T.d); fill(g, rect(x, y, x + 10, y + 0.35), T.l, 0.6); }
    rust(g, [[x + 2.4, -8.6, 1.4, 2], [x + 7.6, -12.4, 0.8, 1.6], [x + 5, -3.4, 1.2]]);
    fill(g, ell(x + 7.4, -7.2, 1.6, 1.2), T.d, 0.6);
    // the heat has scorched it black at the top
    g.save(); g.globalCompositeOperation = 'multiply'; const gr = g.createLinearGradient(0, -14, 0, -8); gr.addColorStop(0, 'rgba(20,12,8,0.75)'); gr.addColorStop(1, 'rgba(20,12,8,0)'); g.fillStyle = gr; g.fillRect(x, -14, 10, 6); g.restore();
    for (const hx of [x + 2.2, x + 5, x + 7.8]) { fill(g, ell(hx, -2.4, 0.7, 0.55), '#ff8a3a'); fill(g, ell(hx, -2.2, 0.35, 0.3), '#ffd56a'); }
  });
  cel(g, rect(x - 0.4, -14.6, x + 10.4, -13.4), T, { sh: 0.3, hl: 0.3, lw: 0.3 });
  fill(g, rect(x + 0.6, -14.4, x + 9.4, -13.8), '#2a1008');
  // the ends of the wood sticking out
  for (const [dx, a] of [[2.6, -0.5], [6.4, 0.4]]) { g.save(); g.translate(x + dx, -14.2); g.rotate(a); cel(g, rect(-0.5, -2.4, 0.5, 0), WOOD, { sh: 0.2, hl: 0.15, lw: 0.16 }); fill(g, rect(-0.5, -2.4, 0.5, -1.6), '#1a0f0a'); g.restore(); }
}

// Flames and glow sit in the light pass so they never pick up the outline.
function fireLight(g, x) {
  g.save(); g.globalCompositeOperation = 'lighter';
  fill(g, ell(x + 5, -14, 22, 16), '#ff8a3a', 0.09);
  fill(g, ell(x + 5, -14, 10, 8), '#ff8a3a', 0.12);
  g.restore();
  g.save(); g.shadowColor = '#ff8a3a'; g.shadowBlur = 10;
  fill(g, poly([[x + 1, -14], [x + 2.4, -20], [x + 3.6, -16.4], [x + 5, -23], [x + 6.4, -16.6], [x + 7.8, -20.4], [x + 9, -14]]), '#ff8a3a');
  fill(g, poly([[x + 2.6, -14], [x + 3.8, -17.2], [x + 5, -19.6], [x + 6.2, -17], [x + 7.4, -14]]), '#ffd56a');
  g.restore();
}

// a traffic cone, faded by years of sun, its reflective collar dirty
export function cone(g, x) {
  const T = mat(tone('#f0a26d', '#d9733c', '#a8501f', '#4e220d'), 'rubber', 0.5);
  const B = poly([[x - 4, 0], [x - 1, -10], [x + 1, -10], [x + 4, 0]]);
  cel(g, B, T, { sh: 0.9, hl: 0.4 });
  clip(g, B, () => {
    fill(g, poly([[x - 2.6, -4.6], [x + 2.6, -4.6], [x + 2.1, -6.4], [x - 2.1, -6.4]]), '#dcd8cc');
    g.save(); g.globalCompositeOperation = 'multiply'; const gr = g.createLinearGradient(0, -6, 0, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(70,50,30,0.5)'); g.fillStyle = gr; g.fillRect(x - 5, -6, 10, 6); g.restore();
    stroke(g, `M ${x - 1.4} -7.6 l 1.2 0.4`, T.k, 0.2, 0.6);
  });
  cel(g, rect(x - 5, -1, x + 5, 0), mat(M.black, 'rubber', 0.5), { sh: 0.3, hl: 0.1 });
}

export const STREET = { sky, farCity, midIndustry, facades: facadeStrip, ground, lampLight, fireLight };
