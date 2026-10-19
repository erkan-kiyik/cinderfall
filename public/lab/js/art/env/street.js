// KOR LAB — the street, style-board cut.
//
// Units are world units (a person is 64 tall); the street surface is y = 0
// and the scene spans x 0..600. Background layers are flat colour with no
// outline and saturation held low; anything you can stand behind, shoot or
// use is a prop with the dark outline, so the play layer always reads first.
import { cel, fill, stroke, clip, rng, setRoot } from '../kit.js';
import { M, tone, mat, C } from '../style.js';
import { texture } from '../tex.js';
import { Brush } from '../paint.js';
import { emblem } from '../enemies/syndicate.js';
import { facadeStrip } from './city.js';

const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
const ell = (x, y, rx, ry) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

const FAR = '#262e3e', FAR_WIN = '#6c6372';
const MID = '#2e3748', MID_HI = '#38425a';

function sky(g) {
  // a rain night is overcast: the sky one smooth fall from black overhead to the
  // brown of the old sodium lamps on the low cloud (docs §10.4), no stars;
  // the cloud in soft masses, their undersides catching the city's light, their
  // tops lost in the dark. It tiles every 600 units, so every mass wraps.
  const gr = g.createLinearGradient(0, -176, 0, -20);
  gr.addColorStop(0, '#0d111a'); gr.addColorStop(0.4, '#171c29'); gr.addColorStop(0.72, '#2b2834'); gr.addColorStop(1, '#4e3e40');
  fill(g, rect(-10, -176, 610, -20), gr);
  const M0 = g.getTransform(), B = new Brush(g, Math.hypot(M0.a, M0.b)), r = rng(5);
  for (let i = 0; i < 64; i++) {
    const x = r() * 600, y = -156 + r() * 112, rx = 20 + r() * 54, ry = 4 + r() * 9, a = 0.22 + r() * 0.2;
    const warm = Math.max(0, Math.min(1, (y + 156) / 112));
    for (const dx of [0, -600, 600]) {
      B.dab(x + dx, y, rx, ry, `rgba(${38 + warm * 62 | 0},${40 + warm * 40 | 0},${54 + warm * 24 | 0},${a})`);
      B.dab(x + dx, y + ry * 0.55, rx * 0.8, ry * 0.4, `rgba(156,108,72,${0.05 + warm * 0.11})`);
      B.dab(x + dx, y - ry * 0.5, rx * 0.7, ry * 0.4, 'rgba(8,10,16,0.18)');
    }
  }
  fill(g, rect(-10, -64, 610, -22), '#5a4446', 0.3);
  fill(g, rect(-10, -48, 610, -22), '#7a5040', 0.2);
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
  // a real hoarding: printed in panels, the seams showing; two floodlights on
  // arms under it washing the face from below, brightest at the bottom; the
  // rain's grime run down from the top edge; a service catwalk along its foot
  clip(g, rect(320, B - 34, 408, B - 2), () => {
    for (let x = 338; x < 408; x += 18) fill(g, rect(x, B - 34, x + 0.4, B - 2), '#000', 0.35);
    const fl = g.createLinearGradient(0, B - 2, 0, B - 34); fl.addColorStop(0, 'rgba(255,236,210,0.22)'); fl.addColorStop(0.5, 'rgba(255,236,210,0.06)'); fl.addColorStop(1, 'rgba(0,0,0,0.25)');
    fill(g, rect(320, B - 34, 408, B - 2), fl);
    for (const cx of [336, 392]) { const c = g.createRadialGradient(cx, B, 0, cx, B, 26); c.addColorStop(0, 'rgba(255,236,210,0.28)'); c.addColorStop(1, 'rgba(255,236,210,0)'); fill(g, rect(cx - 28, B - 34, cx + 28, B - 2), c); }
    const r = rng(331);
    for (let i = 0; i < 12; i++) { const x = 321 + r() * 86, L = 4 + r() * 14, st = g.createLinearGradient(0, B - 34, 0, B - 34 + L); st.addColorStop(0, 'rgba(10,8,10,0.4)'); st.addColorStop(1, 'rgba(10,8,10,0)'); fill(g, rect(x, B - 34, x + 0.4 + r() * 0.8, B - 34 + L), st); }
  });
  fill(g, rect(316, B + 1, 412, B + 1.6), '#1c2230'); for (let x = 318; x < 412; x += 4) fill(g, rect(x, B + 1.6, x + 0.3, B + 4), '#1c2230');
  fill(g, rect(316, B + 3.8, 412, B + 4.3), '#1c2230');
  for (const cx of [336, 392]) { stroke(g, `M ${cx} ${B + 4} L ${cx} ${B + 1.6}`, '#1c2230', 0.5); fill(g, poly([[cx - 2, B + 1.4], [cx + 2, B + 1.4], [cx + 1.4, B - 0.2], [cx - 1.4, B - 0.2]]), '#2a3140'); fill(g, rect(cx - 1.3, B - 0.4, cx + 1.3, B - 0.1), '#fff1dc', 0.9); }
  // haze between the layers
  fill(g, rect(-10, -64, 610, -40), '#5a5168', 0.16);
  fill(g, rect(-10, -52, 610, -40), '#5a5168', 0.14);
}

// --- ground -----------------------------------------------------------------
// docs §10.5: interlocking pavers on the pavement, a granite kerb with the
// ghost of the council's white paint, patched asphalt with the works' old
// line sunk in it, cast manholes and drains, puddles holding the sodium
// light, tracks of Vanta's armour, the leaflets their drones drop
function ground(g) {
  const r = rng(77);
  // the pavement: pavers in running bond, grey with a red one here and there,
  // some sunk, one or two gone, weeds in the joints
  fill(g, rect(-10, 0, 610, 4.2), '#3a3e4a');
  for (let row = 0; row < 2; row++) {
    const y0 = row * 2.1, off = row ? 2.4 : 0;
    for (let x = -10 + off; x < 610; x += 4.8) {
      const k = r(), P = rect(x + 0.18, y0 + 0.18, x + 4.62, y0 + 1.92);
      fill(g, P, k < 0.1 ? '#5e4c4c' : k < 0.55 ? '#5a5f6e' : '#525768');
      if (k > 0.985) fill(g, P, '#1c1e24');
      else if (k > 0.95) fill(g, P, '#000', 0.22);
      fill(g, rect(x + 0.18, y0 + 0.18, x + 4.62, y0 + 0.5), '#fff', 0.06);
    }
  }
  for (let i = 0; i < 18; i++) { const x = r() * 600, y = r() < 0.5 ? 0.1 : 2.1; stroke(g, `M ${x} ${y} l -0.4 -0.9 M ${x + 0.3} ${y} l 0.1 -1.2 M ${x + 0.6} ${y} l 0.5 -0.8`, '#4a5a3a', 0.2, 0.8); }
  fill(g, rect(-10, 0, 610, 0.5), '#7a8296', 0.5);
  // the kerb: granite blocks, a lit arris, the council's white long faded
  fill(g, rect(-10, 4.2, 610, 5.1), '#8a909e');
  fill(g, rect(-10, 5.1, 610, 7.2), '#3c414c');
  for (let x = 0; x < 610; x += 12) { stroke(g, `M ${x} 4.2 L ${x} 7.2`, '#262a33', 0.3); if (x > 370 && x < 520 && (x / 12) % 2 === 0) fill(g, rect(x + 0.3, 4.3, x + 11.7, 7.1), '#dfe2e6', 0.16); }
  for (let i = 0; i < 10; i++) { const x = r() * 600; fill(g, ell(x, 4.6, 1 + r() * 1.4, 0.35), '#2a2e36'); }
  fill(g, rect(-10, 7.2, 610, 8.8), '#191c23');
  for (const x of [70, 330, 540]) { fill(g, rect(x, 5.4, x + 10, 8.8), '#0e1014'); for (let k = x + 1; k < x + 10; k += 1.6) fill(g, rect(k, 5.4, k + 0.6, 8.8), '#2c3039'); }
  // the road: old asphalt, patched and patched again, tar run along the seams
  fill(g, rect(-10, 8.8, 610, 42), '#23262e');
  for (let i = 0; i < 9; i++) {
    const x = r() * 590, w = 22 + r() * 60, y = 9.5 + r() * 26, h = 3 + r() * 7;
    fill(g, rect(x, y, x + w, y + h), r() > 0.5 ? '#272a33' : '#1f2229');
    stroke(g, rect(x, y, x + w, y + h), '#121419', 0.35, 0.8);
  }
  // the works' line: two rails sunk in a concrete strip along the street
  fill(g, rect(-10, 15.2, 610, 21.6), '#2b2e36');
  stroke(g, 'M -10 15.2 L 610 15.2 M -10 21.6 L 610 21.6', '#15171c', 0.4);
  for (const y of [16.6, 20.2]) { fill(g, rect(-10, y, 610, y + 0.7), '#0f1115'); fill(g, rect(-10, y - 0.1, 610, y + 0.25), '#7e8798', 0.55); }
  fill(g, rect(212, 14.6, 268, 22.4), '#262930'); stroke(g, rect(212, 14.6, 268, 22.4), '#121419', 0.35, 0.8);
  for (let i = 0; i < 4; i++) { const x = r() * 560; fill(g, rect(x, 16.4, x + 6 + r() * 8, 17.4), '#5a3a26', 0.35); }
  // the grain of it: aggregate, a stone showing through here and there
  clip(g, rect(-10, 8.8, 610, 42), () => texture(g, 'concrete', 0.5, 1.6));
  clip(g, rect(-10, 0, 610, 7.2), () => texture(g, 'concrete', 0.4, 1.2));
  for (let i = 0; i < 90; i++) { const x = r() * 600, y = 9.5 + r() * 31; fill(g, ell(x, y, 0.25, 0.12), '#4a4e5a', 0.6); }
  // cracks
  for (let i = 0; i < 12; i++) {
    const x = r() * 600, y = 10 + r() * 30;
    stroke(g, `M ${x} ${y} l ${2 + r() * 3} ${r() * 1.6 - 0.8} l ${2 + r() * 3} ${r() * 1.6 - 0.8} l ${1 + r() * 2} ${r() * 1.6 - 0.8}`, '#14161b', 0.3);
  }
  // the lane line, worn to a ghost
  for (let x = 0; x < 610; x += 40) { fill(g, rect(x, 26.6, x + 20, 27.8), '#5d6373', 0.55); fill(g, rect(x + 4 + r() * 10, 26.6, x + 7 + r() * 10, 27.8), '#23262e', 0.8); }
  // the tracks of Vanta's armour, a long smear of tread
  for (const y of [33.6, 38.2]) { fill(g, rect(-10, y, 610, y + 1.6), '#1b1d23', 0.6); for (let x = -8; x < 610; x += 2.2) fill(g, rect(x, y + 0.2, x + 0.8, y + 1.4), '#15171c', 0.5); }
  // manholes cast with the council's ring, oil, puddles holding the sodium light
  for (const x of [150, 470]) {
    fill(g, ell(x, 31, 7, 1.8), '#121419'); fill(g, ell(x, 30.8, 6.2, 1.4), '#2c303a');
    stroke(g, ell(x, 30.8, 4.4, 1), '#1a1d24', 0.3);
    for (let k = -3; k <= 3; k += 1.5) stroke(g, `M ${x + k} 30.2 L ${x + k} 31.4`, '#1a1d24', 0.25);
  }
  for (const [x, y, w] of [[220, 12, 9], [410, 35, 12], [590, 13, 7]]) fill(g, ell(x, y, w, 1.4), '#121418', 0.7);
  for (const [x, y, w] of [[100, 11.6, 14], [300, 24, 10], [520, 12.4, 16]]) {
    fill(g, ell(x, y, w, 1.6), '#16181e');
    fill(g, ell(x - w * 0.2, y - 0.2, w * 0.5, 0.5), '#ffb060', 0.2);
    fill(g, ell(x + w * 0.3, y + 0.3, w * 0.25, 0.3), '#8a96b0', 0.16);
  }
  // Vanta's leaflets, dropped from the drones, trodden into the wet
  for (let i = 0; i < 16; i++) {
    const x = r() * 600, y = r() < 0.3 ? 0.6 + r() * 3 : 9 + r() * 30, a = r() * 3;
    g.save(); g.translate(x, y); g.scale(1, 0.4); g.rotate(a);
    fill(g, rect(-1.2, -1.6, 1.2, 1.6), '#cfccc2', 0.75); fill(g, rect(-1.2, -1.6, 1.2, -0.9), '#8e2330', 0.75);
    g.restore();
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
    // the slope turning away from the sky toward the foot, the rain's grey streaks
    // down it, the street's grime splashed up the foot, the paint chipped off the arrises
    const sl = g.createLinearGradient(0, -16, 0, -6);
    sl.addColorStop(0, 'rgba(255,255,255,0.1)'); sl.addColorStop(1, 'rgba(0,0,0,0.18)');
    g.fillStyle = sl; g.fillRect(x, -16, w, 10);
    const r = rng((x * 31) | 0);
    for (let i = 0; i < 7; i++) {
      const sx = x + 6 + r() * (w - 12), L = 4 + r() * 8, st = g.createLinearGradient(0, -15.6, 0, -15.6 + L);
      st.addColorStop(0, 'rgba(40,44,50,0.28)'); st.addColorStop(1, 'rgba(40,44,50,0)');
      g.fillStyle = st; g.fillRect(sx, -15.6, 0.4 + r() * 0.5, L);
    }
    for (let i = 0; i < 70; i++) { const sx = x + r() * w, sy = -r() * r() * 7; fill(g, ell(sx, sy, 0.12 + r() * 0.22, 0.1 + r() * 0.16), r() < 0.7 ? 'rgba(34,30,26,0.5)' : 'rgba(90,80,66,0.4)'); }
    for (let i = 0; i < 5; i++) { const t = r(), sx = x + 6.2 + t * (w - 12.4); fill(g, ell(sx, -15.7 + r() * 0.6, 0.5 + r() * 0.9, 0.3 + r() * 0.3), '#8e9094', 0.8); }
    g.save(); g.globalCompositeOperation = 'multiply'; const gr = g.createLinearGradient(0, -8, 0, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(60,64,70,0.45)'); g.fillStyle = gr; g.fillRect(x, -8, w, 8); g.restore();
  });
  // the LED strip and its housing
  fill(g, rect(x + 6.6, -17.2, x + w - 6.6, -16), '#11161c');
  g.save(); g.shadowColor = '#ff3347'; g.shadowBlur = 6; fill(g, rect(x + 7.2, -16.95, x + w - 7.2, -16.35), '#ff3347'); g.restore();
  fill(g, rect(x + 7.4, -16.85, x + w - 7.4, -16.65), '#ffb0b8');
}

// an old council lamp: a tapered steel pole, a swan-neck arm, a sodium head;
// Vanta's loudspeaker strapped on for the curfew, its cable taped down the pole
export function lampPost(g, x, h = 82) {
  const P = mat(tone('#646c69', '#434a48', '#2d3331', '#121514'), 'paint', 0.6);
  cel(g, poly([[x - 1.5, 0], [x - 0.9, -h], [x + 0.9, -h], [x + 1.5, 0]]), P, { sh: 0.8, hl: 0.3 });
  for (const y of [-h + 18, -h + 46]) cel(g, rect(x - 1.5, y, x + 1.5, y + 1.4), P, { sh: 0.3, hl: 0.2, lw: 0.25 });
  // the cast foot with its door, rust run down from the bolts
  const F = poly([[x - 3.4, 0], [x - 2.6, -10], [x - 1.8, -11.4], [x + 1.8, -11.4], [x + 2.6, -10], [x + 3.4, 0]]);
  cel(g, F, P, { sh: 0.7, hl: 0.3 });
  clip(g, F, () => { fill(g, rect(x - 1.3, -8.4, x + 1.3, -2.6), P.d); fill(g, ell(x + 0.8, -5.5, 0.25, 0.25), P.l); rust(g, [[x - 2, -9.6, 0.5, 3], [x + 1.8, -4, 0.6, 2]]); });
  // the swan neck out to the head
  stroke(g, `M ${x} ${-h + 4} C ${x} ${-h - 5} ${x + 7} ${-h - 6} ${x + 11} ${-h - 1.2}`, P.k, 1.9);
  stroke(g, `M ${x} ${-h + 4} C ${x} ${-h - 5} ${x + 7} ${-h - 6} ${x + 11} ${-h - 1.2}`, P.m, 1.2);
  stroke(g, `M ${x - 0.3} ${-h + 3} C ${x - 0.3} ${-h - 4.4} ${x + 6} ${-h - 5.6} ${x + 9} ${-h - 2.6}`, P.l, 0.35, 0.7);
  // the sodium head: a long shell, the amber refractor under it
  const H = `M ${x + 8.4} ${-h + 0.4} C ${x + 9.4} ${-h - 2.6} ${x + 20} ${-h - 2.6} ${x + 22.4} ${-h + 0.8} L ${x + 21.6} ${-h + 2.4} L ${x + 9} ${-h + 2.4} Z`;
  cel(g, H, P, { sh: 0.6, hl: 0.4 });
  fill(g, `M ${x + 9.4} ${-h + 2.2} Q ${x + 15} ${-h + 4.6} ${x + 21} ${-h + 2.2} Z`, '#ffc27a');
  fill(g, `M ${x + 11} ${-h + 2.3} Q ${x + 15} ${-h + 3.6} ${x + 19} ${-h + 2.3} Z`, '#fff0d2');
  // Vanta's horn, facing the street, and its cable taped down the pole
  fill(g, rect(x - 1.6, -62.2, x + 1.6, -60.8), '#16181c');
  const S = mat(tone('#c9ced6', '#9aa2ae', '#6c7480', '#24282e'), 'paint', 0.3);
  cel(g, poly([[x - 1.6, -63.4], [x - 7.4, -66.2], [x - 7.4, -56.6], [x - 1.6, -59.4]]), S, { sh: 0.5, hl: 0.3, lw: 0.3 });
  fill(g, ell(x - 7.4, -61.4, 0.9, 4.6), '#1a1c20');
  stroke(g, `M ${x + 1.2} -60 L ${x + 1.2} -14`, '#0e1012', 0.35);
  for (let y = -54; y < -16; y += 9) fill(g, rect(x - 1.3, y, x + 1.6, y + 0.9), '#2a2b2e');
  // the curfew notice at eye height
  fill(g, rect(x - 1.5, -38, x + 1.5, -31), '#d9d5cb'); fill(g, rect(x - 1.5, -38, x + 1.5, -36.6), '#8e2330');
  fill(g, rect(x - 1.5, -38, x - 0.6, -31), '#000', 0.2);
}

function lampLight(g, x, h = 82) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const cx = x + 15;
  fill(g, poly([[cx - 5, -h + 3], [cx + 5, -h + 3], [cx + 26, 0], [cx - 26, 0]]), '#ffb766', 0.10);
  fill(g, poly([[cx - 4, -h + 3], [cx + 4, -h + 3], [cx + 16, 0], [cx - 16, 0]]), '#ffb766', 0.08);
  fill(g, ell(cx, 1.5, 26, 3), '#ffb766', 0.16);
  fill(g, ell(cx, -h + 3, 6, 3), '#ffe0b0', 0.35);
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
