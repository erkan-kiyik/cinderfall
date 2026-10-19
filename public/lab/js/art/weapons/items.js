// KOR LAB — small weapon items: casings, shells, knife, holster, and
// the combat effect shapes that need real art (slash arc, bullet hole).
//
// Same units and light as the weapons. Casings are centred on their middle
// (they tumble); the knife's origin is the middle of its handle, blade +x.
import { cel, fill, stroke, clip } from '../kit.js';
import { M, tone } from '../style.js';
import { MAT } from './index.js';

const rr = (x0, y0, x1, y1, r) => `M ${x0 + r} ${y0} L ${x1 - r} ${y0} Q ${x1} ${y0} ${x1} ${y0 + r} L ${x1} ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} L ${x0 + r} ${y1} Q ${x0} ${y1} ${x0} ${y1 - r} L ${x0} ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} Z`;

const BRASS = M.brass;
const STEEL = tone('#e3e8ee', '#b4bdc8', '#7d8794', '#2b3038');

export const ITEMS = {
  // rifle casing: bottle neck to the right
  'casing.rifle': {
    box: [-1.9, -0.9, 1.9, 0.9],
    paint: (g) => {
      const d = 'M -1.3 -0.42 L 0.55 -0.42 L 0.9 -0.26 L 1.3 -0.26 L 1.3 0.26 L 0.9 0.26 L 0.55 0.42 L -1.3 0.42 Z';
      cel(g, d, BRASS, { sh: 0.35, hl: 0.3 });
      fill(g, rr(-1.42, -0.48, -1.1, 0.48, 0.08), BRASS.d);
    },
  },
  'casing.pistol': {
    box: [-1.3, -0.9, 1.3, 0.9],
    paint: (g) => {
      cel(g, rr(-0.8, -0.45, 0.8, 0.45, 0.12), BRASS, { sh: 0.35, hl: 0.3 });
      fill(g, rr(-0.9, -0.5, -0.62, 0.5, 0.08), BRASS.d);
    },
  },
  // shotgun shell: red hull, brass head on the left
  'casing.shell': {
    box: [-2.1, -1.1, 2.1, 1.1],
    paint: (g) => {
      cel(g, rr(-0.8, -0.62, 1.6, 0.62, 0.2), MAT.shell, { sh: 0.4, hl: 0.3 });
      stroke(g, 'M -0.4 -0.3 L 1.3 -0.3', MAT.shell.l, 0.14, 0.8);
      cel(g, rr(-1.6, -0.7, -0.6, 0.7, 0.15), BRASS, { sh: 0.4, hl: 0.3 });
      fill(g, rr(-1.7, -0.74, -1.45, 0.74, 0.08), BRASS.d);
    },
  },
  // tactical knife, handle centred on the origin
  knife: {
    box: [-4.4, -1.6, 9.2, 1.6],
    paint: (g) => {
      const BLADE = 'M 1.4 -0.85 L 6.2 -0.85 Q 8.2 -0.85 9.0 -0.1 L 8.6 0.2 Q 6.8 0.9 4.0 0.9 L 1.4 0.9 Z';
      cel(g, BLADE, STEEL, { sh: 0.45, hl: 0.35 });
      clip(g, BLADE, () => {
        fill(g, 'M 1.4 -0.85 L 6.6 -0.85 L 6.2 -0.2 L 1.4 -0.2 Z', STEEL.d, 0.7);
        stroke(g, 'M 2.0 0.55 L 7.2 0.45', '#ffffff', 0.16, 0.7);
      });
      cel(g, rr(0.8, -1.25, 1.6, 1.25, 0.2), MAT.dark, { sh: 0.3, hl: 0.2 });
      const H = rr(-4.0, -0.75, 0.9, 0.75, 0.45);
      cel(g, H, MAT.poly, { sh: 0.5, hl: 0.3 });
      clip(g, H, () => { for (let x = -3.2; x < 0.6; x += 0.8) stroke(g, `M ${x} -0.8 L ${x} 0.8`, MAT.poly.d, 0.22); });
      fill(g, rr(-4.3, -0.55, -3.6, 0.55, 0.2), MAT.accent.m);
    },
  },
  // ammo box dropped by enemies (sits on its bottom edge)
  'pickup.ammo': {
    box: [-5.4, -6.4, 5.4, 1.2],
    paint: (g) => {
      const B = rr(-4.6, -5.0, 4.6, 0, 0.5);
      cel(g, B, tone('#7a8a5a', '#5c6b40', '#434f2e', '#1d2412'), { sh: 0.6, hl: 0.3 });
      clip(g, B, () => {
        fill(g, rr(-4.6, -5.0, 4.6, -3.8, 0.2), '#2d3520');
        fill(g, rr(-2.6, -3.0, 2.6, -1.0, 0.3), MAT.accent.m);
        g.font = '700 1.6px Rajdhani'; g.fillStyle = '#1a1c20'; g.fillText('AMMO', -2.2, -1.5);
      });
      cel(g, rr(-1.6, -6.0, 1.6, -5.0, 0.3), MAT.dark, { sh: 0.3, hl: 0.2 });
    },
  },
  // thigh holster (drawn over a holstered pistol, weapon space)
  holster: {
    box: [-4.2, -6.6, 7.4, -0.8],
    paint: (g) => {
      const d = 'M -3.6 -5.9 L 6.6 -5.9 Q 7.0 -5.9 7.0 -5.4 L 7.0 -2.4 Q 7.0 -1.4 6.0 -1.4 L -1.0 -1.4 L -3.0 -2.6 L -3.6 -3.4 Z';
      cel(g, d, M.charcoal, { sh: 0.5, hl: 0.25 });
      clip(g, d, () => {
        stroke(g, 'M -3.2 -5.2 L 6.6 -5.2', M.charcoal.l, 0.2, 0.7);
        fill(g, rr(1.0, -4.8, 3.4, -2.6, 0.3), M.charcoal.d);
      });
      fill(g, rr(1.4, -6.3, 2.6, -5.5, 0.2), MAT.accent.m);
    },
  },
};

// White shapes tinted at draw time ------------------------------------------
export const FX_SHAPES = {
  // knife swoosh: a crescent, thick at the leading edge (+y side, front)
  slash: {
    box: [-1.05, -1.05, 1.05, 1.05],
    paint: (g) => {
      const gr = g.createLinearGradient(-1, -1, 1, 1);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(0, 0, 1, -1.4, 1.2); g.arc(-0.22, -0.05, 0.84, 1.2, -1.4, true); g.closePath(); g.fill();
    },
  },
  // bullet hole: dark pit with a lighter chipped rim (normal blend)
  hole: {
    box: [-1.05, -1.05, 1.05, 1.05],
    paint: (g) => {
      g.fillStyle = 'rgba(205,200,190,0.55)';
      g.beginPath();
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, r = i % 2 ? 0.72 : 1; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.fill();
      g.fillStyle = '#0d1015'; g.beginPath(); g.arc(0, 0, 0.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.arc(0.08, 0.06, 0.32, 0, Math.PI * 2); g.fill();
    },
  },
  // crisp four-point muzzle star, long axis +x
  // a muzzle blast as a camera catches it: no hard star, a soft cone of burning gas
  // thrown forward, two soft tongues out of the brake to the sides, a hot core at
  // the muzzle; all soft-edged, white so the game tints it
  muzzle: {
    box: [-0.4, -1.05, 1.05, 1.05],
    paint: (g) => {
      const blob = (x, y, rx, ry, rot, a) => {
        g.save(); g.translate(x, y); g.rotate(rot); g.scale(rx, ry);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
        gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.45, `rgba(255,255,255,${a * 0.55})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore();
      };
      // the forward cone: a few overlapping lobes, longer and thinner toward its tip
      blob(0.3, 0, 0.62, 0.3, 0, 0.9);
      blob(0.62, 0.02, 0.4, 0.17, 0.03, 0.7);
      blob(0.86, -0.01, 0.2, 0.08, -0.04, 0.5);
      // the side tongues out of the brake
      blob(0.2, -0.4, 0.13, 0.46, 0.5, 0.6);
      blob(0.2, 0.4, 0.13, 0.46, -0.5, 0.6);
      // the gas tearing at the plume's edges
      for (const [x, y, r] of [[0.46, -0.14, 0.09], [0.54, 0.13, 0.08], [0.72, -0.08, 0.06], [0.36, 0.17, 0.07]]) blob(x, y, r * 1.6, r, 0.2, 0.45);
      // the core
      blob(0.02, 0, 0.18, 0.16, 0, 1);
    },
  },
  // flat white pixel block for UI lines and bars
  white: { box: [-1, -1, 1, 1], paint: (g) => { g.fillStyle = '#fff'; g.fillRect(-1, -1, 2, 2); } },
};
