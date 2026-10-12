// CROW, fifth design — see docs/CROW_DESIGN.md for the brief, the anatomy
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
// you, then at the bird), lids for the blink, and the cigar ember.

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

export const HEAD_PIVOT = { x: 2, y: -18 };
export const EYE_NEAR = { x: 3.3, y: -34.05, r: 1.42 };
export const EYE_FAR = { x: 10.3, y: -34.35, r: 0.82 };
export const CIGAR_TIP = { x: 18.6, y: -19.5 };

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
const FACE = 'M -3.0 -46.5 C 3 -47.6 9.6 -46.4 11.2 -43 C 12.4 -40.4 11.9 -38.4 11.6 -37 C 11.0 -35.8 11.0 -34.6 11.8 -33.2 C 12.9 -31 13.2 -29.4 12.6 -27.6 C 12.2 -26.2 12.0 -24.4 12.1 -22.6 C 12.2 -20.8 11.9 -19.2 11.4 -17.8 C 10.6 -16 8.6 -15 6.2 -15 C 3.6 -15 1.0 -16 -1.4 -17.8 C -4.0 -19.8 -6.0 -22.4 -7.0 -25.2 C -7.6 -27 -7.8 -29 -7.6 -31 C -7.4 -34 -7.6 -37 -7.6 -40 C -7.6 -43.6 -5.6 -46 -3.0 -46.5 Z';
const EAR = 'M -3.4 -37.2 C -6.6 -38.6 -8.9 -35.6 -8.6 -31.6 C -8.3 -28.2 -7.0 -25.4 -4.6 -25.0 C -3.3 -24.8 -2.8 -26.0 -3.0 -27.6 C -2.8 -31 -2.6 -34.4 -3.4 -37.2 Z';
const NOSE = 'M 8.6 -36.6 C 9.9 -35.0 11.6 -33.6 13.0 -32.2 C 14.4 -30.6 15.6 -29.0 16.4 -27.4 C 16.9 -26.4 16.6 -25.4 15.6 -25.2 C 14.8 -25.0 14.0 -25.4 13.4 -25.6 C 12.6 -25.0 11.4 -24.8 10.4 -25.2 C 9.2 -25.6 8.6 -26.6 8.8 -27.6 C 9.0 -30.4 8.8 -33.6 8.6 -36.6 Z';
export const EYE_NEAR_SHAPE = 'M -0.4 -33.9 C 1.4 -35.2 4.6 -35.4 6.6 -34.2 C 5.2 -33.2 1.8 -33.0 -0.4 -33.9 Z';
export const EYE_FAR_SHAPE = 'M 9.0 -34.3 C 9.8 -35.1 11.0 -35.2 11.6 -34.5 C 11.0 -33.8 9.8 -33.6 9.0 -34.3 Z';
const BEARD = 'M -6.6 -26.2 C -5.2 -25.6 -3.8 -25.0 -2.0 -25.4 C 0 -25.8 1.6 -24.6 3.0 -23.6 C 4.0 -22.8 4.8 -21.6 5.2 -20.6 C 6.4 -19.8 8.6 -19.6 10.4 -20.0 C 11.4 -20.2 11.8 -19.4 11.8 -18.2 C 11.8 -16.4 11.0 -14.6 9.4 -13.8 C 7.6 -12.8 5.0 -13.0 2.8 -14.0 C -0.4 -15.4 -3.6 -17.8 -5.6 -20.6 C -6.6 -22.2 -7.2 -24.2 -6.6 -26.2 Z';
const MUSTACHE = 'M 5.0 -23.0 C 6.4 -24.4 9.4 -24.7 11.8 -23.7 C 12.7 -23.2 12.9 -22.2 12.5 -21.2 C 12.0 -21.8 11.4 -22.4 10.6 -22.6 C 9.0 -22.8 7.4 -22.6 6.2 -22.0 C 5.4 -21.6 4.8 -21.0 4.4 -20.0 C 4.1 -21.2 4.3 -22.2 5.0 -23.0 Z';

function neckTop(g) {
  // the neck under the jaw, mostly in the beard's shadow
  const NECK = 'M -6.4 -24 C -5.8 -17 -6.6 -9 -7.4 0 L 8.4 0 C 8.0 -6 8.2 -11 9.6 -17 Z';
  fill(g, NECK, lin(g, -7, 0, 9, 0, [[0, SKIN.dd], [0.55, SKIN.d], [1, SKIN.m]]));
  // the cords of the neck, catching the lamp on the right
  stroke(g, 'M 5.6 -14 C 6.4 -9 6.8 -5 7.0 -1', SKIN.l, 0.5, 0.45);
  stroke(g, 'M -2.6 -13 C -2.0 -8 -1.8 -4 -2.2 -1', SKIN.dd, 0.55, 0.6);
}

function backHair(g) {
  // long hair falling from under the hat behind the ear to the collar, in
  // three clumps, a grey streak through the front one
  const LOCKS = [
    'M -13.2 -44 C -16.4 -38 -17.2 -30 -16.6 -22 C -16.2 -16 -14.6 -11 -12.6 -7.6 C -11.4 -10 -10.6 -14 -10.4 -19 C -10.2 -27 -9.6 -36 -8.6 -44 Z',
    'M -9.6 -44 C -11.4 -37 -11.8 -29 -11.0 -22 C -10.4 -17 -9.2 -13 -7.6 -10.2 C -6.8 -13 -6.6 -17 -7.0 -21 C -7.6 -28 -7.6 -37 -6.4 -44.6 Z',
    'M -16.4 -40 C -18.6 -33 -19.0 -25 -18.0 -18 C -17.4 -14 -16.4 -11.4 -15.0 -9.6 C -14.8 -14 -15.0 -20 -15.2 -26 C -15.4 -32 -15.4 -37 -14.6 -42 Z',
  ];
  LOCKS.forEach((d, i) => {
    fill(g, d, lin(g, -18, 0, -7, 0, [[0, HAIR.d], [0.7, HAIR.m], [1, '#3a393d']]));
    if (i === 0) {
      clip(g, d, () => {
        stroke(g, 'M -12.6 -42 C -14.4 -34 -14.6 -24 -13.2 -14 C -12.8 -12 -12.4 -10.4 -12.0 -9.4', HAIR.g, 0.9, 0.5);
      });
    }
  });
  // neon rim down the outside of the hair, kept inside its silhouette
  const all = new Path2D();
  LOCKS.forEach((d) => all.addPath(P(d)));
  g.save(); g.clip(all);
  stroke(g, 'M -19.0 -40 C -19.4 -30 -19.0 -20 -16.8 -10.4', RIM, 1.3, 0.55);
  g.restore();
}

function face(g) {
  fill(g, FACE, SKIN.m);
  clip(g, FACE, () => {
    // lamp-lit front planes
    g.save(); g.filter = 'blur(0.6px)';
    fill(g, 'M 6.6 -32.6 C 9.4 -33.4 12.6 -32.0 13.2 -29 C 13.4 -26 12.6 -23 12.0 -19 C 11.6 -17 10.4 -15.6 8.6 -15.2 C 7.4 -18 6.6 -22 6.2 -26 C 6.0 -28.6 6.0 -31 6.6 -32.6 Z', SKIN.l, 0.78);
    g.restore();
    // the side plane turned away from the lamp: a cel shadow with a soft edge
    const SIDE = 'M -9 -48 L -1.4 -48 C -3.2 -42 -2.8 -38 -1.0 -35.6 C -0.2 -33 0.3 -29.6 0.8 -27 C 1.4 -23.4 2.6 -19.6 4.6 -15 L -9 -15 Z';
    g.save(); g.filter = 'blur(0.35px)'; fill(g, SIDE, SKIN.d, 0.9); g.restore();
    // eye sockets
    fill(g, 'M -1.4 -37.8 C 2 -39.2 6.2 -38.8 7.8 -36.6 C 8.0 -34 6.8 -32.2 3.8 -32.0 C 0.8 -32.0 -1.0 -33.8 -1.4 -37.8 Z', SKIN.d, 0.55);
    fill(g, 'M 8.6 -37.2 C 10.2 -37.6 11.6 -36.8 11.8 -35.4 C 11.4 -33.6 10.0 -33.0 8.8 -33.6 Z', SKIN.d, 0.5);
    // cheekbone catching the lamp, and the hollow under it
    fill(g, 'M 6.6 -31.2 C 9.2 -32.8 11.9 -31.8 12.6 -29.4 C 11.0 -29.0 8.8 -29.0 6.6 -30.0 Z', SKIN.l, 0.9);
    fill(g, 'M 3.8 -27.4 C 6.0 -26.2 9.6 -25.4 11.6 -25.8 C 10.2 -23.4 7.0 -22.8 4.4 -23.8 Z', SKIN.d, 0.45);
    // brow ridge lit edge
    fill(g, 'M 7.8 -38.6 C 9.8 -39.2 11.4 -38.8 11.9 -37.6 C 10.6 -37.6 9.2 -37.6 7.8 -37.8 Z', SKIN.l, 0.8);
    // the brim's shadow across the brow, deeper on the side away from the lamp
    fill(g, 'M -9 -48 L 13 -48 L 13 -39.8 C 8 -39.0 3 -38.0 -2 -37.0 C -5 -36.6 -7 -36.2 -9 -35.6 Z', SKIN.dd, 0.6);
    // age: forehead lines in the shadow, crow's feet, the fold beside the mouth
    stroke(g, 'M -4 -41.6 C 0 -42.4 4 -42.4 9 -41.6', SKIN.dd, 0.35, 0.55);
    stroke(g, 'M -3 -39.8 C 1 -40.4 5 -40.4 8.6 -39.8', SKIN.dd, 0.3, 0.45);
    stroke(g, 'M -1.2 -34.0 L -2.8 -34.8 M -1.0 -33.4 L -2.6 -32.8', SKIN.dd, 0.3, 0.6);
    stroke(g, 'M 9.4 -25.4 C 7.8 -24.0 6.4 -22.6 5.6 -21.0', SKIN.dd, 0.45, 0.65);
    stroke(g, 'M 0.4 -32.0 C 2.0 -31.2 4.2 -31.2 5.8 -32.0', SKIN.dd, 0.3, 0.5);
    // neon spill on the far left edge of the face
    fill(g, 'M -8.6 -40 C -8.0 -32 -7.6 -26 -5.8 -21 L -7.6 -20 C -8.8 -26 -9.2 -33 -9.0 -40 Z', RIM, 0.45);
  });
}

function ear(g) {
  fill(g, EAR, SKIN.d);
  clip(g, EAR, () => {
    fill(g, 'M -4.0 -36.0 C -6.6 -36.6 -7.8 -34 -7.6 -31.4 C -7.4 -29.0 -6.4 -27.2 -5.0 -26.6 C -5.6 -29 -5.8 -32 -4.0 -36.0 Z', SKIN.m, 0.9);
    stroke(g, 'M -4.6 -34.6 C -6.2 -34.2 -6.6 -31.8 -6.2 -30.0 C -5.8 -28.8 -5.2 -28.2 -4.4 -28.0', SKIN.dd, 0.4, 0.8);
    fill(g, 'M -8.8 -34 C -8.6 -30 -7.6 -27 -6.0 -25.6 L -7.6 -25 C -8.8 -27 -9.4 -31 -9.0 -34.6 Z', RIM, 0.55);
  });
  // two brass rings in the lobe
  g.strokeStyle = BRASS.m; g.lineWidth = 0.38;
  g.beginPath(); g.arc(-5.0, -24.6, 0.9, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(-6.3, -26.0, 0.7, 0, Math.PI * 2); g.stroke();
}

function eyesBaked(g) {
  // whites (in the socket's shade, so not pure white) and the lid creases;
  // the irises are drawn live (see crowEyesLive)
  fill(g, EYE_NEAR_SHAPE, '#d8cbbd');
  fill(g, EYE_FAR_SHAPE, '#cbbdae');
  clip(g, EYE_NEAR_SHAPE, () => fill(g, 'M -1 -36 L 8 -36 L 8 -34.0 C 5 -34.8 2 -34.8 -1 -33.6 Z', 'rgba(60,30,20,0.35)'));
}

function eyeLidsBaked(g) {
  stroke(g, 'M -0.8 -34.0 C 1.4 -35.5 4.8 -35.8 7.0 -34.3', '#24120c', 0.8);
  stroke(g, 'M -0.4 -36.2 C 1.8 -37.2 4.8 -37.2 6.4 -36.2', SKIN.dd, 0.35, 0.7);
  stroke(g, 'M 0.0 -33.4 C 2.0 -32.6 4.6 -32.6 6.2 -33.6', SKIN.l, 0.3, 0.45);
  stroke(g, 'M 8.8 -34.4 C 9.8 -35.3 11.0 -35.4 11.8 -34.6', '#24120c', 0.55);
}

function brows(g) {
  // low and level, the inner end pulled down toward the nose: a man who
  // has already decided what your rifle is worth
  fill(g, 'M -1.8 -37.4 C 0.6 -38.3 4.2 -38.4 7.6 -36.6 L 7.3 -35.6 C 4.6 -37.0 1.4 -37.0 -1.6 -36.4 Z', HAIR.m);
  fill(g, 'M 8.8 -37.8 C 10.0 -38.5 11.3 -38.3 12.0 -37.4 L 11.8 -36.8 C 10.9 -37.4 9.9 -37.4 9.0 -37.0 Z', HAIR.m);
  stroke(g, 'M 1.6 -37.9 C 3.4 -38.1 5.2 -37.8 6.8 -37.0', HAIR.g, 0.3, 0.6);
}

function nose(g) {
  fill(g, NOSE, SKIN.m);
  clip(g, NOSE, () => {
    fill(g, 'M 10.4 -35.0 C 12.4 -33 14.6 -30.6 16.4 -27.4 L 17 -24 L 13 -24 C 12.4 -27 11.6 -30 10.4 -35.0 Z', SKIN.l, 0.9);
    fill(g, 'M 8.6 -36.6 C 9.2 -33 9.4 -30 9.4 -27.6 C 9.6 -26.4 10.4 -25.6 11.4 -25.4 C 10.8 -27 10.6 -29.4 10.8 -31.2 C 10.4 -33.4 9.6 -35.2 8.6 -36.6 Z', SKIN.d);
    fill(g, 'M 9 -26.8 C 11 -25.6 13.6 -25.6 16.6 -26.2 L 17 -24 L 9 -24 Z', SKIN.d, 0.55);
  });
  stroke(g, 'M 11.0 -34.4 C 12.8 -32.6 14.4 -30.6 15.6 -28.4', '#ffe2c4', 0.45, 0.75);
  g.fillStyle = '#ffe9d2'; g.globalAlpha = 0.8;
  g.beginPath(); g.ellipse(15.5, -27.3, 0.55, 0.42, 0.4, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
  // nostril, wing, and the shadow the nose throws on the lip
  stroke(g, 'M 10.4 -27.0 C 10.0 -26.0 10.6 -25.2 11.8 -25.2', SKIN.dd, 0.45, 0.85);
  g.fillStyle = 'rgba(40,18,14,0.85)';
  g.beginPath(); g.ellipse(13.0, -25.55, 0.95, 0.38, 0.12, 0, Math.PI * 2); g.fill();
  fill(g, 'M 9.6 -24.8 C 11.4 -24.3 13.8 -24.5 15.2 -25.0 C 14 -23.7 11.6 -23.5 9.8 -24.0 Z', SKIN.dd, 0.5);
  stroke(g, 'M 13.0 -32.2 C 14.4 -30.6 15.6 -29.0 16.4 -27.4 C 16.9 -26.4 16.6 -25.4 15.6 -25.2', INK, 0.35, 0.6);
}

function mouthAndBeard(g) {
  // lower lip and the line of the mouth: a sideways set, as if pricing you
  fill(g, 'M 6.0 -21.3 C 8.0 -20.9 10.0 -20.9 11.3 -21.6 C 10.5 -20.3 8.2 -19.9 6.6 -20.5 Z', '#8f503f');
  stroke(g, 'M 6.6 -20.9 C 8.2 -20.6 9.8 -20.7 10.8 -21.2', '#e3a088', 0.3, 0.6);
  stroke(g, 'M 5.2 -21.6 C 7.6 -21.4 9.8 -21.6 11.7 -22.5', '#2a120c', 0.5);
  // beard: short, salt-and-pepper, on the jaw and chin
  const r = rng(0xbea4d);
  // the beard thinning up the jaw toward the ear, blurred so it fades
  g.save(); g.filter = 'blur(0.7px)';
  fill(g, 'M -6.8 -25.6 C -6.6 -29 -5.6 -32 -3.8 -33.6 C -2.8 -31 -2.0 -28.4 -0.6 -26.0 C -2.6 -25.4 -4.8 -25.2 -6.8 -25.6 Z', HAIR.m, 0.55);
  g.restore();
  fill(g, BEARD, HAIR.m);
  clip(g, BEARD, () => {
    fill(g, 'M 4 -24 L 13 -24 L 13 -12 L 7 -12 C 6.4 -16 5.4 -19 4 -24 Z', '#4a4749', 0.8);
    for (let i = 0; i < 90; i++) {
      const x = -7 + r() * 19, y = -26 + r() * 13;
      const grey = r() > 0.45;
      stroke(g, `M ${x.toFixed(2)} ${y.toFixed(2)} l ${(0.25 + r() * 0.3).toFixed(2)} ${(0.7 + r() * 0.5).toFixed(2)}`,
        grey ? HAIR.g : HAIR.d, 0.22, grey ? 0.7 : 0.6);
    }
    fill(g, 'M -6.8 -26 C -6.6 -22 -5 -19 -3 -17 L -4.2 -16.4 C -6.8 -18.6 -7.8 -22 -7.6 -26 Z', RIM, 0.45);
  });
  // a ragged edge where the beard meets the cheek
  for (let i = 0; i < 16; i++) {
    const t = i / 15, x = -6.4 + t * 11, y = -25.6 + t * 4.6 - Math.sin(t * Math.PI) * 1.4;
    stroke(g, `M ${x.toFixed(2)} ${y.toFixed(2)} l ${(r() * 0.4 - 0.2).toFixed(2)} -0.9`, HAIR.m, 0.32, 0.8);
  }
  // moustache over the lip
  fill(g, MUSTACHE, HAIR.m);
  clip(g, MUSTACHE, () => {
    stroke(g, 'M 6 -23.4 C 8 -24.0 10.2 -23.9 11.8 -23.2', HAIR.g, 0.45, 0.8);
    stroke(g, 'M 5.4 -22.4 C 6.4 -23.2 7.6 -23.4 8.6 -23.4', '#5a575a', 0.3, 0.8);
  });
  // the cigar in the far corner of the mouth, pointing down and out
  g.save(); g.translate(11.2, -21.9); g.rotate(0.3);
  fill(g, 'M 0 -0.7 L 7.6 -0.75 C 8.0 -0.75 8.0 0.75 7.6 0.75 L 0 0.7 Z', lin(g, 0, -0.8, 0, 0.8, [[0, '#8a6342'], [0.5, '#5e3f27'], [1, '#3a2617']]));
  fill(g, 'M 1.2 -0.72 L 2.2 -0.73 L 2.2 0.73 L 1.2 0.72 Z', '#b0302c');
  fill(g, 'M 1.45 -0.72 L 1.95 -0.73 L 1.95 0.73 L 1.45 0.72 Z', BRASS.l, 0.8);
  fill(g, 'M 7.4 -0.76 L 8.0 -0.7 C 8.3 -0.3 8.3 0.3 8.0 0.7 L 7.4 0.76 Z', '#9a958e');
  g.restore();
}

function hairUnderHat(g) {
  // sideburn running into the beard, and a lock escaping the hat at the temple
  // No hard sideburn: a drawn bar of hair between ear and eye read as a
  // stripe across the face. The beard instead climbs the jaw toward the ear
  // and fades out softly (see mouthAndBeard), and the temple only carries
  // the hat's shadow.
  // a lock escaping the hat at the temple
  fill(g, 'M -1.6 -45.4 C -3.6 -43.6 -4.6 -41.0 -4.2 -38.6 C -3.4 -40.4 -2.0 -42.0 0.8 -43.6 Z', HAIR.m);
}

function hat(g) {
  g.save();
  g.translate(1.5, -45); g.rotate(0.07); g.translate(-1.5, 45);
  // feather in the band, behind the crown on the shadow side
  g.save(); g.translate(-8.6, -47.6); g.rotate(-2.15);
  fill(g, 'M 0 -0.6 C 4 -2.6 10 -2.6 15 -0.2 C 10 1.4 4 1.6 0 0.6 Z', lin(g, 0, -2, 0, 2, [[0, '#3d5a6a'], [0.45, '#121418'], [1, '#050506']]));
  stroke(g, 'M 0.4 0 L 14.4 -0.2', 'rgba(150,200,220,0.55)', 0.3);
  for (let i = 1; i < 9; i++) stroke(g, `M ${i * 1.6} 0 l 1.3 -1.2 M ${i * 1.6} 0 l 1.3 1.0`, 'rgba(0,0,0,0.5)', 0.18);
  g.restore();
  // crown, creased down the middle, pinched at the front
  const CROWN = 'M -11.2 -45 C -11.8 -50 -10.6 -55.2 -8.2 -58.0 C -5.2 -59.8 -1.2 -58.6 1.6 -57.4 C 4.4 -58.8 8.6 -59.6 11.2 -57.4 C 13.4 -54.6 13.8 -49.8 13.6 -45 Z';
  fill(g, CROWN, HAT.m);
  clip(g, CROWN, () => {
    fill(g, 'M 3.4 -60 L 15 -60 L 15 -44 L 6.4 -44 C 5.8 -48 4.8 -53 3.4 -60 Z', HAT.l, 0.85);
    fill(g, 'M -12 -60 L -6 -60 C -7.4 -54 -7.6 -49 -7.2 -44 L -12 -44 Z', HAT.d, 0.9);
    fill(g, 'M 1.6 -57.6 C 2.0 -54 1.8 -50 1.2 -47 C 0.4 -50.4 0.4 -54 0.6 -57.4 Z', HAT.d, 0.8);    // centre crease
    fill(g, 'M 8.2 -56.4 C 9.4 -54.6 9.6 -52.4 9.0 -50.6 C 8.2 -52.2 7.8 -54.2 8.2 -56.4 Z', HAT.d, 0.7);  // front pinch
    fill(g, 'M -11.6 -55 C -10.8 -51 -10.6 -48 -10.8 -45 L -12.4 -45 C -12.4 -48 -12.2 -52 -11.6 -55 Z', RIM, 0.6);
    // wear: a scuffed patch and stitching
    stroke(g, 'M 9.6 -57.4 C 11.6 -55.4 12.6 -52 12.8 -48.4', '#8a6a52', 0.35, 0.6);
  });
  stroke(g, CROWN, INK, 0.45);
  // band with a brass buckle
  const BAND = 'M -11.3 -45 L 13.6 -45 L 13.5 -48.1 C 5 -48.9 -3 -48.9 -11.1 -48.1 Z';
  fill(g, BAND, HAT.band);
  clip(g, BAND, () => {
    fill(g, 'M 5 -49 L 14 -49 L 14 -45 L 6 -45 Z', '#3a2a20', 0.9);
    stroke(g, 'M -11 -47.6 C -3 -48.3 5 -48.3 13.4 -47.6', 'rgba(220,180,130,0.35)', 0.22);
  });
  fill(g, 'M 3.2 -48.6 L 6.2 -48.7 L 6.2 -45.1 L 3.2 -45.1 Z', BRASS.m);
  fill(g, 'M 3.9 -47.9 L 5.5 -47.9 L 5.5 -45.8 L 3.9 -45.8 Z', HAT.band);
  stroke(g, 'M 3.3 -48.5 L 6.1 -48.6', BRASS.l, 0.3);
  // goggles strapped round the crown, lenses to the front
  stroke(g, 'M -10.6 -51.6 C -2 -52.4 6 -52.6 13.2 -51.6', '#1a1512', 1.1);
  for (const [cx, cy, rx, ry] of [[6.6, -51.8, 2.5, 2.5], [11.0, -51.5, 1.5, 2.2]]) {
    g.fillStyle = lin(g, cx - rx, cy - ry, cx + rx, cy + ry, [[0, BRASS.l], [0.5, BRASS.m], [1, BRASS.d]]);
    g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = rad(g, cx - rx * 0.2, cy - ry * 0.2, 0, rx, [[0, '#3f6a72'], [0.7, '#14262b'], [1, '#081114']]);
    g.beginPath(); g.ellipse(cx, cy, rx * 0.68, ry * 0.68, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,240,220,0.8)';
    g.beginPath(); g.ellipse(cx - rx * 0.25, cy - ry * 0.3, rx * 0.22, ry * 0.14, -0.6, 0, Math.PI * 2); g.fill();
  }
  // brim: wide, its front edge (over the face) dropping toward the lamp
  const BRIM = 'M -25.6 -44.4 C -22 -46.4 -12 -47.4 1.5 -47.2 C 14 -47.0 25 -45.8 30.4 -43.0 C 31.6 -42.2 31.0 -40.9 29.3 -40.5 C 22 -39.4 12 -41.8 1.5 -42.4 C -9 -42.8 -18 -41.8 -24.8 -42.0 C -26.8 -42.2 -27.2 -43.6 -25.6 -44.4 Z';
  fill(g, BRIM, HAT.m);
  clip(g, BRIM, () => {
    fill(g, 'M 6 -48 L 32 -48 L 32 -39 L 4 -39 Z', HAT.l, 0.8);
    fill(g, 'M -28 -43.2 C -16 -43.6 -4 -43.6 8 -43.2 C 16 -42.8 24 -41.8 32 -40.6 L 32 -38 L -28 -38 Z', HAT.d, 0.95);   // underside
    stroke(g, 'M -24.4 -44.2 C -12 -46.2 6 -46.6 29.6 -42.8', '#8a6a52', 0.3, 0.5);
    fill(g, 'M -27 -44 C -26 -45.4 -23 -46 -20 -46.2 L -20 -44.6 C -22.6 -44.2 -25 -43.4 -27 -42.6 Z', RIM, 0.6);
  });
  // a nick out of the brim on the shadow side
  fill(g, 'M -17.8 -42.0 L -16.6 -40.9 L -15.4 -42.1 Z', '#0b0c0f');
  stroke(g, BRIM, INK, 0.5);
  g.restore();
}

export function paintCrowHead(g) {
  neckTop(g);
  face(g);
  ear(g);
  eyesBaked(g);
  nose(g);
  eyeLidsBaked(g);
  brows(g);
  mouthAndBeard(g);
  hairUnderHat(g);
  hat(g);
}

export function paintCrowBackHair(g) { backHair(g); }

// Live features, in head space: where the eyes look (lx, ly in -1..1), the
// blink (0 open .. 1 shut), the cigar ember.
export function crowEyesLive(g, lx = 0, ly = 0, blink = 0) {
  for (const [E, shape, sc] of [[EYE_NEAR, EYE_NEAR_SHAPE, 1], [EYE_FAR, EYE_FAR_SHAPE, 0.62]]) {
    clip(g, shape, () => {
      const x = E.x + lx * 1.2 * sc, y = E.y + ly * 0.5 * sc;
      g.fillStyle = rad(g, x, y, 0, E.r, [[0, '#e6eef2'], [0.55, '#9fb2bc'], [0.85, '#4a5c66'], [1, '#26323a']]);
      g.beginPath(); g.arc(x, y, E.r, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#060709';
      g.beginPath(); g.arc(x, y, E.r * 0.42, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,250,240,0.95)';
      g.beginPath(); g.arc(x + E.r * 0.35, y - E.r * 0.38, E.r * 0.24, 0, Math.PI * 2); g.fill();
      // the upper lid's shadow over the top of the eye
      fill(g, `M ${E.x - 5} ${E.y - 3} L ${E.x + 5} ${E.y - 3} L ${E.x + 5} ${E.y - 0.55 * sc} C ${E.x + 2} ${E.y - 1.1 * sc} ${E.x - 2} ${E.y - 1.1 * sc} ${E.x - 5} ${E.y - 0.4 * sc} Z`, 'rgba(50,22,14,0.42)');
      if (blink > 0) {
        fill(g, `M ${E.x - 5} ${E.y - 3} L ${E.x + 5} ${E.y - 3} L ${E.x + 5} ${E.y - 2 + 4 * blink} L ${E.x - 5} ${E.y - 2 + 4 * blink} Z`, SKIN.m);
      }
    });
  }
  if (blink > 0.35) {
    stroke(g, `M -0.6 ${-34.6 + 1.8 * blink} C 1.6 ${-34.2 + 1.4 * blink} 4.6 ${-34.2 + 1.4 * blink} 6.8 ${-34.4 + 1.4 * blink}`, '#24120c', 0.7);
  }
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
