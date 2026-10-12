// CROW, sixth design (front view) — see docs/CROW_DESIGN.md for the brief, the anatomy
// grid and the acceptance checklist this was reviewed against.
//
// Character units: origin at the base of the neck, y up is negative. The head
// is 37 units crown to chin, eye line at y −34. Every shape is an SVG path
// (Path2D) so curves are authored, not approximated from polylines, and every
// shadow is a drawn shape clipped to its form — no gradient smudges standing
// in for planes.
//
// Light: warm key from the lamp above-right, red neon rim from the left, the
// hat brim's shadow across the brow. The face is the brightest thing in the
// frame and the hat is the strongest shape in the silhouette.
//
// Three layers, so the head can move on the body:
//   body   — coat, vest, bandolier, pauldron, back hair
//   head   — neck top, face, beard, hair, hat (pivots at HEAD_PIVOT)
//   collar — scarf and coat collar, drawn over the neck seam
// plus live features drawn each frame in head space: irises (they look at
// you, then at the bird) and lids for the blink.

const P = (d) => new Path2D(d);

export const SKIN = { l: '#eab48c', m: '#c48460', d: '#86513d', dd: '#4f2c27' };
const HAIR = { g: '#8f8a85', m: '#2b2a2d', d: '#18171a' };
const HAT = { l: '#6a5340', m: '#3d2f25', d: '#22191a', band: '#1f1612' };
const COAT = { l: '#313944', m: '#1f252d', d: '#13161b', dd: '#0b0d10' };
const SCARF = { l: '#c13a46', m: '#8e2330', d: '#571219' };
const BRASS = { l: '#f0d08a', m: '#c9a35e', d: '#7a5a2c' };
const INK = 'rgba(8,8,11,0.88)';
const KEY = '#ffd9a8';
const RIM = '#ff4a52';

// --------------------------------------------------------------- helpers
function fill(g, d, style, alpha = 1) {
  g.globalAlpha = alpha; g.fillStyle = style; g.fill(typeof d === 'string' ? P(d) : d); g.globalAlpha = 1;
}
function stroke(g, d, style, w, alpha = 1) {
  g.globalAlpha = alpha; g.strokeStyle = style; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
  g.stroke(typeof d === 'string' ? P(d) : d); g.globalAlpha = 1;
}
function clip(g, d, fn) { g.save(); g.clip(typeof d === 'string' ? P(d) : d); fn(); g.restore(); }
function lin(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (const [t, c] of stops) gr.addColorStop(t, c);
  return gr;
}
function rad(g, x, y, r0, r1, stops) {
  const gr = g.createRadialGradient(x, y, r0, x, y, r1);
  for (const [t, c] of stops) gr.addColorStop(t, c);
  return gr;
}
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ================================================================== HEAD
// Front view, straight to camera: a plain, evenly proportioned face. Head
// 37 units crown to chin, eyes on the halfway line one eye-width apart,
// nose base and mouth on the classic thirds. Lamp key from the right, so
// the left half of the face sits in a soft shadow; the brim shades the brow.
const FACE = 'M -9.6 -46 C -4 -48.4 4 -48.4 9.6 -46 C 10.8 -42 11.2 -37 10.9 -32.5 C 10.7 -28.5 10 -25 8.6 -21.6 C 7.0 -18.2 4.4 -15.6 0 -14.8 C -4.4 -15.6 -7.0 -18.2 -8.6 -21.6 C -10 -25 -10.7 -28.5 -10.9 -32.5 C -11.2 -37 -10.8 -42 -9.6 -46 Z';
const EAR_L = 'M -10.5 -36.8 C -12.9 -37.6 -13.8 -34.8 -13.4 -31.6 C -13.1 -29.0 -12.1 -27.0 -10.3 -26.6 Z';
const EAR_R = 'M 10.5 -36.8 C 12.9 -37.6 13.8 -34.8 13.4 -31.6 C 13.1 -29.0 12.1 -27.0 10.3 -26.6 Z';
export const EYE_SHAPE_L = 'M -7.4 -34.0 C -6.0 -35.2 -3.4 -35.4 -1.8 -34.2 C -3.2 -33.2 -5.8 -33.0 -7.4 -34.0 Z';
export const EYE_SHAPE_R = 'M 1.8 -34.2 C 3.4 -35.4 6.0 -35.2 7.4 -34.0 C 5.8 -33.0 3.2 -33.2 1.8 -34.2 Z';
const BEARD = 'M -10.3 -27.6 C -9.6 -25 -8.6 -23.4 -6.6 -22.9 C -5.0 -22.6 -4.6 -21.2 -4.4 -19.9 C -2.4 -19.2 2.4 -19.2 4.4 -19.9 C 4.6 -21.2 5.0 -22.6 6.6 -22.9 C 8.6 -23.4 9.6 -25 10.3 -27.6 C 10.6 -22 9.0 -18 6.4 -15.6 C 4.0 -13.4 1.4 -12.8 0 -12.8 C -1.4 -12.8 -4.0 -13.4 -6.4 -15.6 C -9.0 -18 -10.6 -22 -10.3 -27.6 Z';
const MUSTACHE = 'M -5.2 -21.5 C -4.4 -23.3 -2.0 -23.9 0 -23.4 C 2.0 -23.9 4.4 -23.3 5.2 -21.5 C 4.0 -21.9 2.4 -22.3 0 -22.1 C -2.4 -22.3 -4.0 -21.9 -5.2 -21.5 Z';

export const HEAD_PIVOT = { x: 0, y: -18 };
export const EYES = [
  { x: -4.6, y: -34.15, r: 1.3, shape: EYE_SHAPE_L },
  { x: 4.6, y: -34.15, r: 1.3, shape: EYE_SHAPE_R },
];

function neckTop(g) {
  const NECK = 'M -6.6 -22 C -6.4 -14 -7 -6 -7.8 0 L 7.8 0 C 7 -6 6.4 -14 6.6 -22 Z';
  fill(g, NECK, lin(g, -8, 0, 8, 0, [[0, SKIN.dd], [0.5, SKIN.d], [1, SKIN.m]]));
  fill(g, 'M -6.6 -22 L 6.6 -22 L 6.6 -15 C 3 -13.6 -3 -13.6 -6.6 -15 Z', SKIN.dd, 0.55);   // jaw shadow
}

// Short hair: only what shows between the hat and the ears, and at the
// nape. (Long hair either side read as a curtain and narrowed the face.)
const FACE_W = 1.1;     // the face is drawn 10% wider than authored
function backHair(g) {
  g.save(); g.scale(FACE_W, 1);
  for (const side of [-1, 1]) {
    const d = side < 0
      ? 'M -9.9 -45.6 C -11.6 -44.6 -12.4 -42.6 -12.2 -40.2 C -11.6 -39.0 -10.9 -38.4 -10.6 -38.0 C -10.6 -40.6 -10.4 -43.2 -9.9 -45.6 Z'
      : 'M 9.9 -45.6 C 11.6 -44.6 12.4 -42.6 12.2 -40.2 C 11.6 -39.0 10.9 -38.4 10.6 -38.0 C 10.6 -40.6 10.4 -43.2 9.9 -45.6 Z';
    fill(g, d, side < 0 ? HAIR.d : HAIR.m);
    // the nape, behind and below the ear
    const n = side < 0
      ? 'M -10.6 -27 C -11.6 -24 -11.0 -21 -9.0 -19 L -7.6 -21.6 C -8.8 -23 -9.6 -25 -10.0 -27 Z'
      : 'M 10.6 -27 C 11.6 -24 11.0 -21 9.0 -19 L 7.6 -21.6 C 8.8 -23 9.6 -25 10.0 -27 Z';
    fill(g, n, HAIR.d, 0.9);
  }
  g.restore();
}

function ears(g) {
  for (const [d, side] of [[EAR_L, -1], [EAR_R, 1]]) {
    fill(g, d, side < 0 ? SKIN.d : SKIN.m);
    clip(g, d, () => {
      stroke(g, side < 0 ? 'M -11.2 -35.4 C -12.6 -34.6 -12.8 -31.6 -12.0 -29.4' : 'M 11.2 -35.4 C 12.6 -34.6 12.8 -31.6 12.0 -29.4', SKIN.dd, 0.4, 0.75);
      if (side < 0) fill(g, 'M -14 -35 C -14 -31 -13 -28 -11.6 -26.4 L -13 -26 C -14.4 -28 -14.8 -32 -14.4 -35 Z', RIM, 0.5);
    });
  }
}

function face(g) {
  fill(g, FACE, SKIN.m);
  clip(g, FACE, () => {
    // the lamp-side half a step lighter, soft-edged down the middle
    g.save(); g.filter = 'blur(0.8px)';
    fill(g, 'M 1.2 -48 L 12 -48 L 12 -14 L 1.6 -14 C 2.8 -20 3.0 -28 2.4 -34 C 2.0 -39 1.6 -44 1.2 -48 Z', SKIN.l, 0.45);
    // the far-side plane in shadow, along the left of the face
    fill(g, 'M -12 -48 L -7.0 -48 C -8.0 -42 -8.4 -36 -7.8 -31 C -7.2 -26 -5.8 -21 -3.4 -15.6 L -12 -15.6 Z', SKIN.d, 0.75);
    g.restore();
    // eye sockets
    for (const [x, a] of [[-4.6, 0.5], [4.6, 0.35]]) {
      g.fillStyle = SKIN.d; g.globalAlpha = a;
      g.beginPath(); g.ellipse(x, -34.4, 3.9, 2.4, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    }
    // cheekbones: lit on the right, a quiet hollow under each
    g.save(); g.filter = 'blur(1px)';
    g.fillStyle = SKIN.l; g.globalAlpha = 0.35;
    g.beginPath(); g.ellipse(7.4, -30.2, 2.8, 1.4, -0.15, 0, Math.PI * 2); g.fill();
    g.fillStyle = SKIN.d; g.globalAlpha = 0.18;
    g.beginPath(); g.ellipse(7.2, -26.6, 2.6, 1.2, 0.1, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(-7.2, -26.6, 2.6, 1.2, -0.1, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1; g.restore();
    // the brim's shadow across the brow, lower on the side away from the lamp
    g.save(); g.filter = 'blur(0.5px)';
    fill(g, 'M -12 -48 L 12 -48 L 12 -38.8 C 6 -38.0 -6 -37.6 -12 -37.8 Z', SKIN.dd, 0.55);
    g.restore();
    // a few lines of age, kept light
    stroke(g, 'M -5 -40.6 C -2 -41.2 2 -41.2 5 -40.6', SKIN.dd, 0.3, 0.4);
    stroke(g, 'M -2.6 -27.0 C -3.8 -25.0 -4.4 -23.2 -4.4 -21.6', SKIN.dd, 0.35, 0.45);
    stroke(g, 'M 2.6 -27.0 C 3.8 -25.0 4.4 -23.2 4.4 -21.6', SKIN.dd, 0.35, 0.35);
    fill(g, 'M -11.2 -40 C -10.8 -32 -10.2 -26 -8.6 -21.6 L -10.4 -21 C -11.6 -26 -12 -33 -11.8 -40 Z', RIM, 0.4);
  });
}

function eyesBaked(g) {
  for (const E of EYES) fill(g, E.shape, '#dacfc2');
  for (const E of EYES) clip(g, E.shape, () => fill(g, `M ${E.x - 4} -36 L ${E.x + 4} -36 L ${E.x + 4} -34.1 C ${E.x + 2} -34.8 ${E.x - 2} -34.8 ${E.x - 4} -34.1 Z`, 'rgba(60,30,20,0.32)'));
}

function eyeLidsBaked(g) {
  stroke(g, 'M -7.8 -34.0 C -6.0 -35.6 -3.2 -35.8 -1.5 -34.3', '#24120c', 0.75);
  stroke(g, 'M 1.5 -34.3 C 3.2 -35.8 6.0 -35.6 7.8 -34.0', '#24120c', 0.75);
  stroke(g, 'M -7.0 -36.1 C -5.4 -36.9 -3.2 -36.9 -2.0 -36.2', SKIN.dd, 0.3, 0.6);
  stroke(g, 'M 2.0 -36.2 C 3.2 -36.9 5.4 -36.9 7.0 -36.1', SKIN.dd, 0.3, 0.5);
  stroke(g, 'M -6.8 -33.3 C -5.2 -32.7 -3.4 -32.8 -2.2 -33.4', SKIN.l, 0.25, 0.4);
  stroke(g, 'M 2.2 -33.4 C 3.4 -32.8 5.2 -32.7 6.8 -33.3', SKIN.l, 0.25, 0.5);
}

function brows(g) {
  fill(g, 'M -8.0 -37.0 C -6.0 -38.3 -3.2 -38.3 -1.2 -37.3 L -1.3 -36.4 C -3.4 -37.2 -6.0 -37.2 -7.8 -36.2 Z', HAIR.m);
  fill(g, 'M 8.0 -37.0 C 6.0 -38.3 3.2 -38.3 1.2 -37.3 L 1.3 -36.4 C 3.4 -37.2 6.0 -37.2 7.8 -36.2 Z', HAIR.m);
  stroke(g, 'M 2.0 -37.6 C 3.8 -37.9 5.8 -37.8 7.4 -37.1', HAIR.g, 0.28, 0.5);
}

function nose(g) {
  // front-on: a quiet bridge, the shadow side on the left, a lit tip
  fill(g, 'M -0.7 -35.4 C -1.2 -31.4 -1.8 -28.8 -2.7 -26.8 C -1.7 -26.0 -0.5 -25.8 0.3 -26.2 C -0.4 -29 -0.5 -32.4 -0.7 -35.4 Z', SKIN.d, 0.85);
  stroke(g, 'M 0.8 -35.0 C 1.0 -32 1.2 -29.6 1.4 -27.8', SKIN.l, 0.45, 0.6);
  g.fillStyle = SKIN.l; g.globalAlpha = 0.8;
  g.beginPath(); g.ellipse(0.5, -27.1, 1.0, 0.7, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
  stroke(g, 'M -2.9 -26.6 C -2.6 -25.4 -1.6 -25.0 -0.8 -25.4', SKIN.dd, 0.4, 0.8);
  stroke(g, 'M 2.9 -26.6 C 2.6 -25.4 1.6 -25.0 0.8 -25.4', SKIN.dd, 0.4, 0.6);
  g.fillStyle = 'rgba(40,18,14,0.8)';
  for (const x of [-1.4, 1.4]) { g.beginPath(); g.ellipse(x, -25.65, 0.65, 0.3, 0, 0, Math.PI * 2); g.fill(); }
  fill(g, 'M -2.6 -25.1 C -1 -24.5 1 -24.5 2.8 -25.1 C 1.6 -24.1 -1.4 -24.1 -2.6 -25.1 Z', SKIN.dd, 0.35);
}

function mouthAndBeard(g) {
  const r = rng(0xbea4d);
  // lips: a closed, level mouth
  fill(g, 'M -3.4 -21.2 C -1.6 -20.3 1.6 -20.3 3.4 -21.2 C 2.0 -19.8 -2.0 -19.8 -3.4 -21.2 Z', '#9a5745');
  stroke(g, 'M -2.4 -20.7 C -1 -20.3 1 -20.3 2.4 -20.7', '#e3a088', 0.25, 0.5);
  stroke(g, 'M -4.0 -21.5 C -2.0 -21.8 2.0 -21.8 4.0 -21.6', '#2a120c', 0.5);
  // a short, kept beard on the jaw and chin, salt-and-pepper
  g.save(); g.filter = 'blur(0.6px)';
  // sideburns, thin and tapering, running from the temple hair into the beard
  fill(g, 'M -10.9 -38.8 C -11.0 -34 -10.8 -30 -10.3 -27.2 L -8.8 -27.6 C -9.4 -30 -9.8 -34 -9.9 -38.8 Z', HAIR.m, 0.6);
  fill(g, 'M 10.9 -38.8 C 11.0 -34 10.8 -30 10.3 -27.2 L 8.8 -27.6 C 9.4 -30 9.8 -34 9.9 -38.8 Z', HAIR.m, 0.6);
  g.restore();
  fill(g, BEARD, HAIR.m);
  clip(g, BEARD, () => {
    fill(g, 'M 2 -28 L 12 -28 L 12 -12 L 2 -12 Z', '#46444a', 0.6);
    for (let i = 0; i < 110; i++) {
      const x = -10 + r() * 20, y = -27 + r() * 14;
      const grey = r() > 0.5;
      stroke(g, `M ${x.toFixed(2)} ${y.toFixed(2)} l ${(r() * 0.4 - 0.2).toFixed(2)} ${(0.7 + r() * 0.5).toFixed(2)}`,
        grey ? HAIR.g : HAIR.d, 0.22, grey ? 0.65 : 0.6);
    }
    fill(g, 'M -10.6 -27 C -10.4 -22 -9 -18 -6.6 -15.4 L -7.6 -14.8 C -10.2 -17.6 -11.4 -22 -11.2 -27 Z', RIM, 0.4);
  });
  fill(g, MUSTACHE, HAIR.m);
  clip(g, MUSTACHE, () => {
    stroke(g, 'M -4.2 -22.4 C -2.6 -23.2 -1.0 -23.2 -0.2 -22.9', HAIR.g, 0.3, 0.5);
    stroke(g, 'M 0.2 -22.9 C 1.0 -23.2 2.6 -23.2 4.2 -22.4', HAIR.g, 0.3, 0.6);
  });
}

function hairUnderHat(g) {
  // the hairline just showing under the brim at the temples
  fill(g, 'M -9.8 -45.6 C -10.8 -43 -11.0 -40.4 -10.8 -38.4 L -9.6 -39.4 C -9.6 -41.4 -9.2 -43.4 -8.2 -45.6 Z', HAIR.m);
  fill(g, 'M 9.8 -45.6 C 10.8 -43 11.0 -40.4 10.8 -38.4 L 9.6 -39.4 C 9.6 -41.4 9.2 -43.4 8.2 -45.6 Z', HAIR.m);
}

function hat(g) {
  // feather in the band on the left
  g.save(); g.translate(-9.4, -47.4); g.rotate(-2.0);
  fill(g, 'M 0 -0.6 C 4 -2.6 10 -2.6 15 -0.2 C 10 1.4 4 1.6 0 0.6 Z', lin(g, 0, -2, 0, 2, [[0, '#3d5a6a'], [0.45, '#121418'], [1, '#050506']]));
  stroke(g, 'M 0.4 0 L 14.4 -0.2', 'rgba(150,200,220,0.55)', 0.3);
  for (let i = 1; i < 9; i++) stroke(g, `M ${i * 1.6} 0 l 1.3 -1.2 M ${i * 1.6} 0 l 1.3 1.0`, 'rgba(0,0,0,0.5)', 0.18);
  g.restore();
  // crown, front-on: a centre crease and a pinch either side
  const CROWN = 'M -11.6 -45 C -12.2 -50 -11.2 -55.2 -8.6 -58.0 C -5.4 -60.0 -2.2 -58.8 0 -57.6 C 2.2 -58.8 5.4 -60.0 8.6 -58.0 C 11.2 -55.2 12.2 -50 11.6 -45 Z';
  fill(g, CROWN, HAT.m);
  clip(g, CROWN, () => {
    fill(g, 'M 3 -61 L 13 -61 L 13 -44 L 4.6 -44 C 4.2 -50 3.8 -55 3 -61 Z', HAT.l, 0.75);
    fill(g, 'M -13 -61 L -6.4 -61 C -7.6 -55 -7.8 -50 -7.4 -44 L -13 -44 Z', HAT.d, 0.85);
    fill(g, 'M 0.4 -57.8 C 0.8 -54 0.6 -50 0.2 -47.4 C -0.6 -50.4 -0.6 -54 -0.4 -57.6 Z', HAT.d, 0.8);
    for (const sx of [-1, 1]) fill(g, `M ${sx * 5.8} -56.6 C ${sx * 6.8} -54.6 ${sx * 7.0} -52.4 ${sx * 6.4} -50.6 C ${sx * 5.6} -52.2 ${sx * 5.4} -54.2 ${sx * 5.8} -56.6 Z`, HAT.d, 0.6);
    fill(g, 'M -12 -55 C -11.2 -51 -11 -48 -11.2 -45 L -12.8 -45 C -12.8 -48 -12.6 -52 -12 -55 Z', RIM, 0.6);
  });
  stroke(g, CROWN, INK, 0.45);
  // band and buckle
  const BAND = 'M -11.7 -45 L 11.7 -45 L 11.6 -48.1 C 4 -48.9 -4 -48.9 -11.5 -48.1 Z';
  fill(g, BAND, HAT.band);
  clip(g, BAND, () => stroke(g, 'M -11.4 -47.6 C -4 -48.3 4 -48.3 11.4 -47.6', 'rgba(220,180,130,0.35)', 0.22));
  fill(g, 'M 5.0 -48.6 L 8.0 -48.6 L 8.0 -45.1 L 5.0 -45.1 Z', BRASS.m);
  fill(g, 'M 5.7 -47.9 L 7.3 -47.9 L 7.3 -45.8 L 5.7 -45.8 Z', HAT.band);
  // goggles on the front of the crown
  stroke(g, 'M -11.2 -51.8 C -4 -52.6 4 -52.6 11.2 -51.8', '#1a1512', 1.1);
  stroke(g, 'M -1.0 -52.2 L 1.0 -52.2', BRASS.d, 0.8);
  for (const cx of [-3.6, 3.6]) {
    const cy = -52.0, rr = 2.5;
    g.fillStyle = lin(g, cx - rr, cy - rr, cx + rr, cy + rr, [[0, BRASS.l], [0.5, BRASS.m], [1, BRASS.d]]);
    g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.fill();
    g.fillStyle = rad(g, cx - 0.5, cy - 0.5, 0, rr, [[0, '#3f6a72'], [0.7, '#14262b'], [1, '#081114']]);
    g.beginPath(); g.arc(cx, cy, rr * 0.68, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,240,220,0.8)';
    g.beginPath(); g.ellipse(cx - 0.6, cy - 0.7, 0.55, 0.35, -0.6, 0, Math.PI * 2); g.fill();
  }
  // brim, front-on: wide, the top lit toward the lamp, the underside showing
  // along the front edge
  const BRIM = 'M -27 -44 C -20 -46.6 -8 -47.4 0 -47.4 C 8 -47.4 20 -46.6 27 -44 C 28.6 -43.2 28.2 -41.8 26.4 -41.4 C 18 -40.2 8 -41.4 0 -41.4 C -8 -41.4 -18 -40.2 -26.4 -41.4 C -28.2 -41.8 -28.6 -43.2 -27 -44 Z';
  fill(g, BRIM, HAT.m);
  clip(g, BRIM, () => {
    fill(g, 'M 4 -48 L 30 -48 L 30 -40 L 4 -40 Z', HAT.l, 0.7);
    fill(g, 'M -30 -43.4 C -18 -42.6 -8 -42.8 0 -42.8 C 8 -42.8 18 -42.6 30 -43.4 L 30 -39 L -30 -39 Z', HAT.d, 0.95);
    stroke(g, 'M -25 -44.2 C -12 -46.4 12 -46.4 25 -44.2', '#8a6a52', 0.3, 0.5);
    fill(g, 'M -29 -44 C -27 -45.6 -24 -46 -21 -46.2 L -21 -44.4 C -24 -44 -26.6 -43.2 -29 -42.4 Z', RIM, 0.6);
  });
  stroke(g, BRIM, INK, 0.5);
}

export function paintCrowHead(g) {
  g.save(); g.scale(FACE_W, 1);
  neckTop(g);
  face(g);
  ears(g);
  eyesBaked(g);
  nose(g);
  eyeLidsBaked(g);
  brows(g);
  mouthAndBeard(g);
  hairUnderHat(g);
  g.restore();
  hat(g);
}

// Live features in head space: where the eyes look (lx, ly in -1..1) and
// the blink (0 open .. 1 shut).
export function crowEyesLive(g, lx = 0, ly = 0, blink = 0) {
  g.save(); g.scale(FACE_W, 1);
  for (const E of EYES) {
    clip(g, E.shape, () => {
      const x = E.x + lx * 1.3, y = E.y + ly * 0.45;
      g.fillStyle = rad(g, x, y, 0, E.r, [[0, '#e6eef2'], [0.55, '#8ea3ae'], [0.85, '#45565f'], [1, '#26323a']]);
      g.beginPath(); g.arc(x, y, E.r, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#060709';
      g.beginPath(); g.arc(x, y, E.r * 0.42, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,250,240,0.95)';
      g.beginPath(); g.arc(x + E.r * 0.35, y - E.r * 0.38, E.r * 0.24, 0, Math.PI * 2); g.fill();
      fill(g, `M ${E.x - 5} ${E.y - 3} L ${E.x + 5} ${E.y - 3} L ${E.x + 5} ${E.y - 0.5} C ${E.x + 2} ${E.y - 1.1} ${E.x - 2} ${E.y - 1.1} ${E.x - 5} ${E.y - 0.4} Z`, 'rgba(50,22,14,0.38)');
      if (blink > 0) fill(g, `M ${E.x - 5} ${E.y - 3} L ${E.x + 5} ${E.y - 3} L ${E.x + 5} ${E.y - 2 + 4 * blink} L ${E.x - 5} ${E.y - 2 + 4 * blink} Z`, SKIN.m);
    });
    if (blink > 0.35) {
      const y = E.y - 0.6 + 1.6 * blink;
      stroke(g, `M ${E.x - 2.9} ${y + 0.2} C ${E.x - 1} ${y - 0.3} ${E.x + 1} ${y - 0.3} ${E.x + 2.9} ${y + 0.2}`, '#24120c', 0.7);
    }
  }
  g.restore();
}

// ================================================================== BODY
// Coat, vest and bandolier, the perch pauldron on the left shoulder. Drawn in
// character units; the visible bust runs to about y = +34.
export function paintCrowBody(g) {
  const r = rng(0xc0a7);
  backHair(g);
  // coat: shoulders, falling to the frame
  const COAT_S = 'M -39 40 C -41 28 -41 18 -37.6 11 C -33.6 4 -23 0 -12 -1 L 14 -1 C 25 0 35.4 4 39.4 11 C 42.4 18 42.6 28 41.6 40 Z';
  fill(g, COAT_S, COAT.m);
  clip(g, COAT_S, () => {
    fill(g, 'M 14 -2 C 24 0 34 4 39 11 C 42 18 43 26 42 40 L 27 40 C 29 28 27 16 21 6 Z', COAT.l, 0.85);
    fill(g, 'M -42 -2 L -18 -2 C -25 6 -29 18 -28 40 L -42 40 Z', COAT.d, 0.9);
    fill(g, 'M -42 8 C -40 5 -38 3.6 -35 2.6 L -38.6 14 L -42 32 Z', RIM, 0.55);
    // seams and folds
    stroke(g, 'M 27 9 C 29 18 30 28 29 40', COAT.dd, 0.6, 0.7);
    stroke(g, 'M -25 11 C -27 20 -27 30 -26 40', COAT.dd, 0.6, 0.7);
    stroke(g, 'M 31 11 C 33 18 34 26 34 34', COAT.l, 0.4, 0.4);
  });
  // the coat's stand collar, behind the scarf: dark outside, a lighter
  // lining on the inner face where it turns toward the lamp
  const SC_L = 'M -16.6 2.0 C -17.6 -3 -16.8 -8.6 -14.0 -12.2 C -12.6 -11.6 -11.2 -10.6 -10.0 -9.2 C -11.2 -5.6 -11.4 -1.6 -10.8 2.0 Z';
  const SC_R = 'M 18.0 2.0 C 19.0 -3 18.4 -8.4 15.8 -12.0 C 14.4 -11.4 13.0 -10.4 11.8 -9.0 C 13.0 -5.4 13.2 -1.4 12.6 2.0 Z';
  fill(g, SC_L, COAT.d); fill(g, SC_R, COAT.m);
  clip(g, SC_R, () => fill(g, 'M 11 -13 L 15 -13 C 13.6 -8 13.6 -3 14.0 3 L 11 3 Z', '#4a5260', 0.9));
  clip(g, SC_L, () => fill(g, 'M -18 -13 L -15.6 -13 C -17 -8 -17 -3 -16.4 3 L -18 3 Z', RIM, 0.55));
  stroke(g, SC_L, INK, 0.4); stroke(g, SC_R, INK, 0.4);
  // shirt collar points showing at the neck
  fill(g, 'M -7.6 -0.6 L -2.6 -0.6 L -4.6 5.4 Z', '#cfc6b4'); fill(g, 'M 5.2 -0.6 L 10.6 -0.6 L 7.4 5.6 Z', '#e3dacb');
  // vest in the open front with brass buttons
  const VEST = 'M -8 -0.6 L 11 -0.6 L 12 40 L -8.4 40 Z';
  fill(g, VEST, '#2f2621');
  clip(g, VEST, () => {
    fill(g, 'M 5 -1 L 17 -1 L 17 40 L 7 40 Z', '#4a3a30', 0.7);
    stroke(g, 'M 1.6 2 L 2.4 40', '#120e0c', 0.5);
    for (let i = 0; i < 4; i++) {
      const y = 8 + i * 7;
      g.fillStyle = BRASS.m; g.beginPath(); g.arc(3.8, y, 0.8, 0, Math.PI * 2); g.fill();
      g.fillStyle = BRASS.l; g.beginPath(); g.arc(3.6, y - 0.25, 0.3, 0, Math.PI * 2); g.fill();
    }
  });
  // lapels of the coat over the vest edges
  // wide lapels turned back over it, the near one lit along its edge
  fill(g, 'M -13 -1 L -5.6 -1 C -4.4 8 -5.4 22 -7.2 40 L -14 40 C -13.6 24 -13.4 10 -13 -1 Z', COAT.d);
  fill(g, 'M 9.6 -1 L 18 -1 C 17.6 10 18 24 19.4 40 L 11.2 40 C 10.6 24 10.0 10 9.6 -1 Z', COAT.m);
  clip(g, 'M 9.6 -1 L 18 -1 C 17.6 10 18 24 19.4 40 L 11.2 40 C 10.6 24 10.0 10 9.6 -1 Z', () => fill(g, 'M 14 -1 L 19 -1 L 20 40 L 15 40 Z', COAT.l, 0.8));
  stroke(g, 'M 9.8 -1 C 10.2 10 10.8 24 11.4 40', 'rgba(255,217,168,0.35)', 0.4);
  stroke(g, 'M -5.6 -1 C -4.6 8 -5.4 22 -7.2 40', 'rgba(0,0,0,0.6)', 0.45);
  // crow-skull pin on the right lapel
  g.save(); g.translate(16.4, 8);
  fill(g, 'M -1.4 -1.2 C -1.4 -2.4 1.0 -2.6 1.6 -1.4 L 3.4 -0.6 L 1.4 -0.1 C 1.2 1.0 -1.2 1.2 -1.4 -0.2 Z', '#e9e1cf');
  g.fillStyle = '#1a1714'; g.beginPath(); g.arc(-0.2, -1.1, 0.42, 0, Math.PI * 2); g.fill();
  g.restore();

  // bandolier, right shoulder down across to the left hip, red shells in loops
  g.save(); g.translate(22, 0); g.rotate(Math.atan2(40, -44));
  const BLEN = 54;
  fill(g, `M 0 -3.2 L ${BLEN} -3.2 L ${BLEN} 3.2 L 0 3.2 Z`, lin(g, 0, -3.2, 0, 3.2, [[0, '#5c4532'], [0.5, '#45331f'], [1, '#2a1f15']]));
  stroke(g, `M 0 -2.5 L ${BLEN} -2.5 M 0 2.5 L ${BLEN} 2.5`, 'rgba(230,200,160,0.3)', 0.22);
  for (let i = 0; i < 8; i++) {
    const x = 6 + i * 5.6;
    fill(g, `M ${x} -4.6 L ${x + 2.6} -4.6 L ${x + 2.6} 1.4 L ${x} 1.4 Z`, lin(g, x, 0, x + 2.6, 0, [[0, '#7a1c22'], [0.5, '#c23a3e'], [1, '#6a161b']]));
    fill(g, `M ${x} 1.4 L ${x + 2.6} 1.4 L ${x + 2.6} 3.2 L ${x} 3.2 Z`, lin(g, x, 0, x + 2.6, 0, [[0, BRASS.d], [0.5, BRASS.l], [1, BRASS.d]]));
    fill(g, `M ${x - 0.4} -1.0 L ${x + 3.0} -1.0 L ${x + 3.0} 1.0 L ${x - 0.4} 1.0 Z`, '#2a1f15', 0.9);
  }
  g.restore();

  // left shoulder: the bird's perch — two layered leather plates following
  // the slope of the shoulder, riveted, scored by talons, a few crow
  // feathers tucked under the lower plate
  for (let i = 0; i < 5; i++) {
    const x = -39.6 + i * 3.4, y = 16.6 - i * 1.5;
    g.save(); g.translate(x, y); g.rotate(Math.PI * 0.56 + (r() - 0.5) * 0.3);
    const len = 5 + r() * 2.6;
    fill(g, `M 0 -1.4 C 2 -2.2 ${len * 0.7} -2 ${len} 0 C ${len * 0.7} 2 2 2.2 0 1.4 Z`, lin(g, 0, -2, 0, 2, [[0, '#2f4652'], [0.5, '#101215'], [1, '#050506']]));
    stroke(g, `M 0.3 0 L ${(len - 0.4).toFixed(2)} 0`, 'rgba(140,190,210,0.35)', 0.2);
    g.restore();
  }
  const P2 = 'M -41.0 18.6 C -41.4 13 -38.2 8.6 -31.6 6.6 C -28.2 5.8 -25.0 5.8 -22.6 6.6 C -26.2 9.0 -30.6 11.8 -34.2 14.8 C -36.6 16.6 -38.8 17.8 -41.0 18.6 Z';
  const P1 = 'M -39.4 12.8 C -39.6 6.2 -35.2 1.2 -26.4 -0.8 C -21 -1.8 -16.4 -0.8 -14.2 1.6 C -16.4 3.4 -19.6 4.4 -23.4 5.0 C -29.6 6.2 -35.0 8.6 -39.4 12.8 Z';
  for (const [PL, top] of [[P2, false], [P1, true]]) {
    fill(g, PL, lin(g, -40, -2, -16, 12, [[0, '#55402e'], [0.45, '#3a2a1e'], [1, '#1e150e']]));
    clip(g, PL, () => {
      fill(g, 'M -42 -4 L -14 -4 L -14 1.6 C -20 0.4 -28 1.0 -34 4.2 C -37 6 -39.4 8.6 -42 12 Z', '#7a5d44', top ? 0.6 : 0.35);
      fill(g, 'M -43 20 C -43 12 -40 6 -35 3 L -34 5 C -37.6 8 -39.6 13 -39.6 19 Z', RIM, 0.55);
      if (top) for (let i = 0; i < 6; i++) {     // talon scores
        const x = -33 + i * 2.6 + r(), y = 0.6 + r() * 2.4;
        stroke(g, `M ${x.toFixed(2)} ${y.toFixed(2)} l ${(1.4 + r()).toFixed(2)} ${(0.5 + r() * 0.5).toFixed(2)}`, '#b0927a', 0.22, 0.75);
      }
    });
    stroke(g, PL, INK, 0.42);
  }
  for (const [x, y] of [[-36.4, 9.4], [-30, 5.6], [-23.4, 3.6], [-37.6, 15.4], [-31.4, 10.4]]) {
    g.fillStyle = BRASS.d; g.beginPath(); g.arc(x, y, 0.62, 0, Math.PI * 2); g.fill();
    g.fillStyle = BRASS.l; g.beginPath(); g.arc(x - 0.15, y - 0.18, 0.28, 0, Math.PI * 2); g.fill();
  }
}

// ================================================================== COLLAR
// The red dust scarf, pulled down off the face and bunched round the neck,
// and the coat's stand collar either side of it.
export function paintCrowCollar(g) {
  // wound twice round the neck: three overlapping bands, narrow at the jaw
  // and piling wider onto the chest, each lit from the right and shadowed on
  // the left, with the fold where one band tucks under the next
  const BANDS = [
    'M -9.6 -12.8 C -4 -10.8 4 -10.6 11.0 -12.4 C 12.4 -10.2 12.6 -7.8 11.8 -5.6 C 5 -4.0 -3 -4.2 -10.0 -6.0 C -10.8 -8.4 -10.6 -10.8 -9.6 -12.8 Z',
    'M -11.2 -7.4 C -4 -5.0 5 -5.0 12.6 -7.0 C 13.8 -4.6 13.8 -1.8 12.8 0.6 C 5 2.4 -4 2.2 -11.6 0.2 C -12.4 -2.4 -12.2 -5.0 -11.2 -7.4 Z',
    'M -10.0 -1.4 C -4 0.8 5 0.8 11.6 -1.0 C 12.6 0.8 12.6 2.6 11.6 4.2 C 5 5.6 -4 5.6 -10.4 4.0 C -11 2.4 -10.8 0.4 -10.0 -1.4 Z',
  ];
  for (let i = BANDS.length - 1; i >= 0; i--) {
    const d = BANDS[i];
    fill(g, d, SCARF.m);
    clip(g, d, () => {
      fill(g, 'M 3 -16 L 16 -16 L 16 8 L 6 8 C 7.4 2 6.4 -6 3 -16 Z', SCARF.l, 0.65);
      fill(g, 'M -14 -16 L -5 -16 C -7 -8 -7 -1 -5.4 8 L -14 8 Z', SCARF.d, 0.9);
      fill(g, 'M -14 -16 L -10.4 -16 C -11.8 -8 -11.8 -1 -11 8 L -14 8 Z', RIM, 0.35);
      stroke(g, 'M -9 0 C -3 1.6 5 1.6 12 0', SCARF.d, 0.5, 0.0);
    });
    // the shadow each band throws on the one below
    clip(g, d, () => {
      const below = i === 0 ? null : BANDS[i - 1];
      if (below) fill(g, below, 'rgba(40,6,10,0.0)');
    });
    stroke(g, d, INK, 0.35, 0.8);
  }
  // fold shadows where the bands overlap
  stroke(g, 'M -10.4 -6.4 C -3 -4.4 5 -4.2 12.0 -5.8', SCARF.d, 0.7, 0.85);
  stroke(g, 'M -11.0 0.4 C -4 2.4 5 2.6 12.2 0.8', SCARF.d, 0.7, 0.85);
  stroke(g, 'M 3.4 -11.0 C 6 -11.2 8.6 -11.8 10.6 -12.4', '#e86a72', 0.35, 0.6);
  // the knot's loose end hanging over the vest, frayed at the tip
  const TAIL = 'M 6.4 3.0 C 9.0 6.4 9.8 10.4 9.2 15.0 L 8.0 13.8 L 7.2 15.6 L 6.4 14.0 L 5.4 15.2 C 4.8 11 4.2 7 3.2 3.6 Z';
  fill(g, TAIL, SCARF.m);
  clip(g, TAIL, () => fill(g, 'M 7.0 2 L 11 2 L 11 17 L 7.8 17 C 8.4 11 8.0 6 7.0 2 Z', SCARF.l, 0.6));
  stroke(g, TAIL, INK, 0.35);
}
