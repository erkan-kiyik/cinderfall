// A seized Vanta crate, painted (docs §10.3 "el konmuş Vanta sandıkları",
// §11): a hard polymer case seen from above and to the right, its lid
// latched, the tier's colour band round its waist, Vanta's stencils on it and
// the ember sprayed over Vanta's mark. Lit by one lamp above and in front;
// dust on the lid, scuffs on every edge, its shadow on the floor.
// Soft-brush painting (paint.js) in a 100 × 100 frame.
import { Brush, rnd } from './paint.js';
import { texture } from './tex.js';

// faces: front, top (lid), right side; corners rounded a little
const FRONT = 'M 16 41 L 76 41 Q 78 41 78 43 L 78 77 Q 78 79 76 79 L 16 79 Q 14 79 14 77 L 14 43 Q 14 41 16 41 Z';
const TOP = 'M 16 41 L 76 41 Q 78 41 79.4 40 L 89.6 31.6 Q 90.6 30.6 88.8 30.6 L 28.8 30.6 Q 27 30.6 25.6 31.6 L 15.4 40 Q 14.6 41 16 41 Z';
const SIDE = 'M 78 43 Q 78 41 79.4 40 L 89.6 31.6 Q 90.6 30.8 90.6 32.6 L 90.6 66.6 Q 90.6 68.4 89.2 69.6 L 79.4 78.2 Q 78 79.2 78 77 Z';

// tier: { band: colour, label: stencil text }
export function paintCrate(g, size, tier = {}) {
  const k = size / 100, B = new Brush(g, k), r = rnd(19), band = tier.band || '#a39b8f';
  g.save(); g.scale(k, k);
  // the floor and the shadow it throws back and to the right of the lamp
  B.fill('M 10 80 L 82 80 L 96 70 L 98 74 L 84 86 L 8 86 Z', 'rgba(0,0,0,0.55)', 3);
  B.dab(50, 82, 44, 6, 'rgba(0,0,0,0.6)');

  // --- the side, away from the lamp
  B.fill(SIDE, '#34404d', 0.15);
  B.inside(SIDE, () => {
    B.dab(84, 40, 8, 10, 'rgba(120,140,160,0.25)');
    B.dab(86, 74, 8, 8, 'rgba(0,0,0,0.5)');
    for (let i = 0; i < 4; i++) { const x = 81 + i * 2.6; B.line(`M ${x} ${42 - i * 2.1} L ${x} ${74 - i * 2.1}`, 'rgba(0,0,0,0.35)', 0.8, 0.3); B.line(`M ${x + 0.6} ${42 - i * 2.1} L ${x + 0.6} ${74 - i * 2.1}`, 'rgba(160,180,200,0.18)', 0.4, 0.2); }
    B.fill('M 78 59 L 90.6 48.6 L 90.6 52.6 L 78 63 Z', band, 0.15, 0.7);
    B.fill('M 78 59 L 90.6 48.6 L 90.6 52.6 L 78 63 Z', 'rgba(0,0,0,0.35)', 0.2);
    texture(g, 'paint', 0.5, 5);
  });

  // --- the front
  B.fill(FRONT, '#56687b', 0.15);
  B.inside(FRONT, () => {
    // the lamp falls off down the face, the floor's bounce comes back up a little
    const gr = g.createLinearGradient(0, 41, 0, 79); gr.addColorStop(0, 'rgba(160,180,200,0.35)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = gr; g.fillRect(14, 41, 64, 38);
    B.dab(30, 52, 18, 10, 'rgba(190,206,220,0.18)');
    // the lid's lip and the seam under it
    B.fill('M 14 41 L 78 41 L 78 49.6 L 14 49.6 Z', 'rgba(150,170,190,0.22)', 0.2);
    B.line('M 14 50 L 78 50', 'rgba(8,10,14,0.85)', 0.9, 0.2);
    B.line('M 14 51 L 78 51', 'rgba(170,190,210,0.25)', 0.4, 0.2);
    // moulded ribs on the lower body
    for (let x = 20; x < 76; x += 7.6) { B.line(`M ${x} 66 L ${x} 77`, 'rgba(0,0,0,0.4)', 1.1, 0.4); B.line(`M ${x + 1} 66 L ${x + 1} 77`, 'rgba(180,200,220,0.16)', 0.5, 0.3); }
    // the tier's band round the waist
    B.fill('M 14 59 L 78 59 L 78 64 L 14 64 Z', band, 0.15, 0.9);
    B.fill('M 14 59 L 78 59 L 78 59.8 L 14 59.8 Z', 'rgba(255,255,255,0.25)', 0.2);
    B.fill('M 14 63.2 L 78 63.2 L 78 64 L 14 64 Z', 'rgba(0,0,0,0.35)', 0.2);
    // Vanta's stencils: the ring-and-bar mark, the store code
    g.save(); g.globalAlpha = 0.6; g.strokeStyle = '#dfe4ea'; g.lineWidth = 1.3; g.beginPath(); g.arc(46, 55, 3.8, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#dfe4ea'; g.fillRect(40.4, 54.4, 11.2, 1.3); g.restore();
    stencil(g, tier.label || 'VANTA · LOJİSTİK', 17, 74.6, 3.0, 0.5);
    stencil(g, `SN ${(4100 + (band.charCodeAt(1) * 7) % 900)}-${band.charCodeAt(2) % 9}`, 68.4, 47.4, 1.7, 0.45);
    // the ember sprayed over the mark, running
    B.fill('M 41.4 53.6 L 44 50.6 L 48.4 51 L 50.4 54.2 L 48.2 57.8 L 43.6 57.6 Z', 'rgba(226,105,47,0.88)', 0.35);
    B.dab(46, 54.2, 1.6, 1.4, 'rgba(255,196,122,0.9)');
    for (const [x, l] of [[43.8, 4], [46.4, 7], [48.6, 3]]) B.line(`M ${x} 57 l 0.1 ${l}`, 'rgba(226,105,47,0.8)', 0.55, 0.12);
    for (let i = 0; i < 40; i++) B.dab(39 + r() * 13, 49 + r() * 11, 0.25, 0.25, 'rgba(226,105,47,0.55)');
    // scuffs and dirt low down
    for (let i = 0; i < 14; i++) { const x = 15 + r() * 62, y = 42 + r() * 36; B.line(`M ${x} ${y} l ${2 + r() * 5} ${(r() - 0.5) * 1.2}`, 'rgba(200,214,226,0.22)', 0.25, 0.1); }
    B.dab(46, 80, 34, 6, 'rgba(40,32,24,0.5)');
    texture(g, 'paint', 0.55, 5);
  });

  // --- the lid's top, the lamp full on it, dust settled in the corners
  B.fill(TOP, '#7f93a6', 0.15);
  B.inside(TOP, () => {
    B.dab(52, 34, 32, 8, 'rgba(210,222,232,0.4)');
    B.dab(84, 32, 10, 4, 'rgba(0,0,0,0.25)');
    // the handle in its recess
    B.fill('M 44 34 L 64 34 L 67 31.8 L 47 31.8 Z', 'rgba(20,26,32,0.85)', 0.3);
    B.fill('M 46 33.4 L 62 33.4 L 64.4 32 L 48.4 32 Z', '#2a333d', 0.2);
    B.line('M 46.6 33 L 62.4 33', 'rgba(170,186,200,0.4)', 0.4, 0.15);
    // dust and grit
    for (let i = 0; i < 80; i++) B.dab(18 + r() * 70, 31 + r() * 9, 0.4 + r() * 0.8, 0.25 + r() * 0.4, `rgba(176,166,146,${0.08 + r() * 0.12})`);
    texture(g, 'paint', 0.45, 5);
  });
  // edges catching the lamp: the lid's front edge and the top-right arris
  B.line('M 16 41 L 76 41', 'rgba(230,238,246,0.7)', 0.5, 0.15);
  B.line('M 79.4 40 L 89.6 31.6', 'rgba(220,230,240,0.45)', 0.45, 0.15);
  B.line('M 78 42 L 78 77', 'rgba(10,12,16,0.6)', 0.6, 0.25);

  // --- the latches: steel clasps over the seam, one seal cut and hanging
  for (const x of [26, 64]) {
    B.fill(`M ${x - 3} 46 L ${x + 3} 46 L ${x + 3} 54 L ${x - 3} 54 Z`, '#2a3038', 0.15);
    B.fill(`M ${x - 2.4} 46.6 L ${x + 2.4} 46.6 L ${x + 2.4} 53.4 L ${x - 2.4} 53.4 Z`, '#8a9198', 0.1);
    B.fill(`M ${x - 2.4} 46.6 L ${x + 2.4} 46.6 L ${x + 2.4} 48.4 L ${x - 2.4} 48.4 Z`, 'rgba(240,244,248,0.55)', 0.15);
    B.dab(x, 52, 1, 0.7, 'rgba(0,0,0,0.6)');
  }
  B.line('M 64 54 q 1.4 3 -0.6 5.6', '#c8463a', 0.6, 0.1);
  B.dab(63.6, 59.8, 0.8, 0.8, '#a83a30');

  // the stall's dark round it, and grain
  B.grain(8, 26, 86, 60, 0.05, 23);
  g.restore();
}

// stencilled letters, set large and scaled down so the small text keeps its shapes
function stencil(g, text, x, y, size, a) {
  g.save(); g.translate(x, y); g.scale(1 / 30, 1 / 30);
  g.globalAlpha = a; g.fillStyle = '#e4e8ec';
  g.font = `800 ${size * 30}px 'Big Shoulders Stencil', 'Barlow Condensed', sans-serif`;
  g.fillText(text, 0, 0);
  g.restore();
}
