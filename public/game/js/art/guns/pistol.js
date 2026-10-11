// Handguns: the C-9 "CORVID" (polymer-frame striker pistol, slide on top),
// the QUANTUM PISTOL (the same ergonomics around a sealed emitter and a power
// cell in the grip) and the RAY GUN (a lathe-turned retro blaster).
//
// Weapon space: origin = trigger-hand grip point, +x toward the muzzle.

import { svg, rpoly, rrect, ell, tube } from '../gunkit.js';
import { muzzle } from './acc.js';

const BORE = -5.0;

// ------------------------------------------------------------- shared frame
// The polymer frame every modern handgun here shares the hand-fit of: grip
// raked back 18°, beavertail, square-fronted trigger guard, dust cover with
// a short accessory rail. `top` is the frame's top edge (under the slide).
function frame(k, L, { top = -3.2, front = 9.8, cell = false } = {}) {
  // grip with a slight palm swell and finger-groove front
  k.part('furn', 'poly', svg(`M -4.6 ${top} L 1.6 ${top} L 1.4 -1.6 Q 0.9 0.2 0.8 1.6 Q 0.4 2.4 0.6 3.2
    Q 0.2 4.4 -0.2 5.6 Q -0.6 6.8 -0.8 7.6 L -5.0 7.6 Q -5.6 7.6 -5.5 6.8 Q -5.0 2.8 -4.6 -0.4
    Q -5.4 -1.2 -6.2 -2.0 Q -6.4 -2.8 -5.6 ${top} Z`), { tex: 'stipple' });
  // dust cover + trigger-guard
  k.part('furn', 'poly', svg(`M 1.0 ${top} L ${front} ${top} L ${front} -1.2 Q ${front} -0.8 ${front - 0.6} -0.8
    L 5.6 -0.8 L 5.6 0.6 Q 5.6 1.4 4.8 1.4 L 1.4 1.4 L 1.0 0.6 Z`));
  guardHole(k);
  // short accessory rail under the dust cover
  k.detail((g) => {
    g.fillStyle = 'rgba(0,0,0,0.45)';
    for (let x = 6.2; x < front - 0.8; x += 1.3) g.fillRect(x, -1.6, 0.6, 0.7);
  });
  // trigger
  k.part('steel', 'steel', svg('M 2.4 -1.6 Q 3.2 -0.8 2.8 0.4 L 2.4 0.4 Q 2.6 -0.6 2.0 -1.4 Z'), { line: false });
  // mag release, takedown lever
  k.part('furn', 'poly', rrect(0.6, -2.6, 1.0, 0.9, 0.3), { bevel: 'soft' });
  k.part('steel', 'steel', rrect(3.2, -2.9, 1.6, 0.6, 0.25), { bevel: 'soft' });
  // beavertail seam, grip texture panel
  k.seam('M -4.2 -1.0 Q -3.8 2.6 -4.4 6.4', 0.16, 0.3);
  if (cell) {
    // window onto the power cell
    k.part('emit', 'emit', rrect(-3.6, 1.4, 1.1, 4.0, 0.5), { spill: 0.4 });
  }
}

// Trigger-guard opening: knocked out of the frame after the fact, so the
// guard is a ring and not a solid plate.
function guardHole(k) {
  k.detail((g) => {
    g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.moveTo(1.8, -0.8); g.lineTo(4.9, -0.8); g.quadraticCurveTo(5.0, 0.6, 4.4, 0.7);
    g.lineTo(2.0, 0.7); g.quadraticCurveTo(1.5, 0.6, 1.6, -0.2); g.closePath(); g.fill();
  });
}

// --------------------------------------------------------------------- C-9

function c9Body(k, L) {
  frame(k, L);
  const acc = L.acc || {};
  if (acc.light) {
    // weapon light under the dust cover rail
    k.part('fixed', 'poly', rpoly([[5.4, -1.6], [10.6, -1.6], [11.0, -1.0], [11.0, 0.6], [10.6, 1.0], [5.6, 1.0], [5.4, 0.4]], 0.4), { color: L.optic || '#303237' });
    k.part('fixed', 'glass', rrect(10.7, -1.2, 0.5, 1.9, 0.25));
  }
  k.formLight([-7.4, -3.2, 10, 7.6]);
}

// Slide: drawn as its own sprite so it can run back under recoil. Origin is
// the weapon origin, so it lands on the frame with no offset.
function c9Slide(k, L) {
  const acc = L.acc || {};
  // barrel crown visible at the front, so the bore has metal round it
  k.part('steel', 'steel', tube(10.6, 12.6, BORE, 0.75));
  k.part('metal', 'steel', svg(`M -6.0 -7.4 L 11.0 -7.4 Q 12.0 -7.4 12.2 -6.6 L 12.4 -4.4 Q 12.4 -3.4 11.6 -3.4
    L -6.0 -3.4 Q -6.6 -3.4 -6.6 -4.0 L -6.6 -6.8 Q -6.6 -7.4 -6.0 -7.4 Z`), { color: L.slide || L.steel, light: 'box' });
  // ejection port, barrel hood showing in it
  k.part('steel', 'steel', rrect(2.0, -7.3, 4.4, 1.5, 0.3), { color: L.hood || '#6b6457' });
  k.seam('M 2.0 -5.8 L 6.4 -5.8', 0.18, 0.5);
  // rear serrations
  k.detail((g) => {
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.28;
    for (let i = 0; i < 6; i++) { const x = -5.6 + i * 0.62; g.beginPath(); g.moveTo(x, -6.8); g.lineTo(x + 0.5, -4.0); g.stroke(); }
    g.strokeStyle = 'rgba(230,236,244,0.18)'; g.lineWidth = 0.14;
    for (let i = 0; i < 6; i++) { const x = -5.4 + i * 0.62; g.beginPath(); g.moveTo(x, -6.8); g.lineTo(x + 0.5, -4.0); g.stroke(); }
  });
  k.seam('M -6.4 -4.4 L 11.8 -4.4', 0.16, 0.35);
  // sights
  k.part('steel', 'steel', rpoly([[-5.8, -7.0], [-5.6, -8.4], [-3.8, -8.4], [-3.6, -7.0]], 0.2));
  k.part('steel', 'steel', rpoly([[10.0, -7.0], [10.2, -8.2], [11.0, -8.2], [11.2, -7.0]], 0.2));
  if (acc.optic === 'rmr') {
    // pistol red dot milled into the slide behind the ejection port
    k.part('fixed', 'alu', svg('M -3.4 -7.0 L -3.2 -8.8 Q -3.0 -9.6 -2.2 -9.6 L 0.6 -9.6 Q 1.4 -9.4 1.6 -8.6 L 1.8 -7.0 Z'), { color: L.optic || '#303237' });
    k.part('fixed', 'glass', rpoly([[-2.6, -8.8], [-2.4, -9.3], [0.8, -9.3], [1.0, -8.8], [0.9, -7.6], [-2.5, -7.6]], 0.2));
  }
  k.out.muzzle = { x: acc.muzzle ? muzzle(k, acc.muzzle, 12.4, BORE, 0.7) : 12.6, y: BORE };
  k.formLight([-6.6, -9.6, 12.6, -3.4]);
}

// Magazine: sits inside the grip (drawn behind the frame), so only the base
// plate shows until a reload pulls it out. Origin = magPos.
function c9Mag(k, L) {
  k.part('metal', 'steel', rpoly([[-0.6, -7.6], [3.0, -7.6], [1.8, 2.8], [-1.8, 2.8]], 0.4), { color: L.magSteel || '#3a3c40' });
  k.part('furn', 'poly', rpoly([[-2.2, 2.4], [2.0, 2.4], [2.1, 3.6], [-2.4, 3.6]], 0.4));     // base plate
}

export const PISTOL = {
  id: 'pistol',
  look: { poly: '#2f3134', steel: '#3a3d42', alu: '#3a3d42' },
  body: c9Body, slide: c9Slide, mag: c9Mag,
  rig: {
    gripA: { x: 0, y: 0.8 },
    gripB: { x: 2.4, y: 2.0 },
    muzzle: { x: 12.6, y: BORE },
    eject: { x: 4.2, y: -7.0 },
    magPos: { x: -3.2, y: 4.2 },
    shoulder: { x: -17, y: -1 },
  },
  mounts: { bore: { x0: -7.0, x1: 14.0, y: -5.4, r: 2.2 },  barrel: { x: 12.4, y: BORE, r: 0.7 }, panel: { x0: -6.4, x1: 12.2, y0: -7.3, y1: -3.6, part: 'slide' } },
};

// ----------------------------------------------------------------- QUANTUM
// Same hand-fit as the C-9 around a sealed upper: no slide, a finned emitter
// housing, vents that show the charge, a power cell in the grip.

function quantumBody(k, L) {
  frame(k, L, { cell: true });
  // sealed upper housing
  k.part('metal', 'alu', svg(`M -6.2 -7.6 L 9.0 -7.6 Q 10.4 -7.6 10.8 -6.6 L 11.4 -5.4 L 11.4 -3.6 Q 11.4 -3.0 10.6 -3.0
    L -6.2 -3.0 Q -6.8 -3.0 -6.8 -3.6 L -6.8 -7.0 Q -6.8 -7.6 -6.2 -7.6 Z`));
  // emitter: a short barrel with a lens ring
  k.part('steel', 'steel', tube(10.4, 12.8, BORE, 1.05));
  k.part('steel', 'steel', tube(12.4, 13.4, BORE, 1.35));
  k.part('emit', 'emit', ell(13.4, BORE, 0.35, 0.9), { spill: 0.8 });
  // charge vents along the housing
  for (let i = 0; i < 3; i++) {
    const x = 2.4 + i * 2.2;
    k.slot(x, -6.6, 1.3, 2.4, 0.5);
    k.glow(`M ${x + 0.65} -6.1 L ${x + 0.65} -4.7`, 0.42);
  }
  k.seam('M -6.6 -4.4 L 10.8 -4.4', 0.16, 0.35);
  k.part('steel', 'steel', rpoly([[-6.0, -7.4], [-5.8, -8.6], [-4.0, -8.6], [-3.8, -7.4]], 0.2));
  k.part('steel', 'steel', rpoly([[8.6, -7.4], [8.8, -8.4], [9.6, -8.4], [9.8, -7.4]], 0.2));
  k.out.muzzle = { x: 13.6, y: BORE };
  k.formLight([-7.4, -8.6, 13.6, 7.6]);
}

// Power cell: the magazine of the QUANTUM, glowing at the window when seated.
function quantumCell(k, L) {
  k.part('metal', 'alu', rpoly([[-0.6, -7.6], [3.0, -7.6], [1.8, 2.8], [-1.8, 2.8]], 0.4), { color: '#4a4f57' });
  k.part('emit', 'emit', rpoly([[0.4, -6.0], [2.0, -6.0], [1.2, 1.2], [-0.4, 1.2]], 0.3), { spill: 0.4 });
  k.part('furn', 'poly', rpoly([[-2.2, 2.4], [2.0, 2.4], [2.1, 3.6], [-2.4, 3.6]], 0.4));
}

export const QUANTUM = {
  id: 'quantum',
  look: { poly: '#28323c', alu: '#3c4a58', steel: '#3a3f46', core: [90, 200, 255] },
  body: quantumBody, mag: quantumCell,
  rig: {
    gripA: { x: 0, y: 0.8 },
    gripB: { x: 2.4, y: 2.0 },
    muzzle: { x: 13.6, y: BORE },
    eject: null,
    magPos: { x: -3.2, y: 4.2 },
    shoulder: { x: -17, y: -1 },
  },
  mounts: { bore: { x0: 10.0, x1: 13.8, y: BORE, r: 1.4 },  panel: { x0: -6.6, x1: 10.8, y0: -7.5, y1: -3.2 } },
};

// ----------------------------------------------------------------- RAY GUN
// A lathe-turned blaster: bakelite grip, a bulbous chromed body, cooling
// fins stepping down the barrel to a bell, and a glass charge bulb on top.

function rayBody(k, L) {
  // grip: rounded bakelite with a ring pommel
  k.part('furn', 'poly', svg(`M -4.8 -2.4 L 1.4 -2.4 Q 1.6 0.4 0.6 3.4 Q 0.0 5.8 -0.6 7.0 Q -1.2 7.8 -2.4 7.8
    L -5.2 7.8 Q -6.4 7.8 -6.2 6.6 Q -5.6 3.0 -5.6 0.2 Q -5.8 -1.4 -4.8 -2.4 Z`), { light: 'cyl', tex: 'grain' });
  k.part('steel', 'steel', rrect(-6.6, 7.2, 6.2, 1.2, 0.5));
  // trigger guard: a swept loop
  k.part('metal', 'alu', svg('M 0.6 -2.8 L 3.4 -2.8 Q 5.2 -1.2 5.2 0.8 Q 5.0 2.2 3.6 2.2 L 0.4 2.2 L 0.4 0.9 L 3.2 0.9 Q 3.9 0.9 3.8 0.2 Q 3.4 -1.0 1.0 -1.0 Z'));
  k.part('steel', 'steel', svg('M 2.0 -1.8 Q 2.8 -0.8 2.4 0.4 L 2.0 0.4 Q 2.2 -0.6 1.6 -1.6 Z'), { line: false });
  // body: a teardrop running into the barrel
  k.part('metal', 'alu', svg(`M -5.8 -4.8 Q -5.8 -8.2 -2.0 -8.2 L 3.6 -8.2 Q 7.0 -8.0 7.6 -5.4 Q 7.0 -2.0 3.6 -1.8
    L -2.6 -1.8 Q -5.8 -1.8 -5.8 -4.8 Z`), { light: 'cyl' });
  k.hi('M -4.4 -7.2 Q -0.6 -7.8 4.4 -7.4', 0.3, 0.35);
  // barrel and fins (large to small), seated on one continuous barrel
  k.part('steel', 'steel', tube(6.4, 12.2, -5.0, 0.9));
  for (const [x, r] of [[7.6, 2.7], [9.2, 2.3], [10.7, 1.9]]) {
    k.part('metal', 'alu', svg(`M ${x - 0.45} ${-5.0 - r} L ${x + 0.45} ${-5.0 - r * 0.85} L ${x + 0.45} ${-5.0 + r * 0.85} L ${x - 0.45} ${-5.0 + r} Z`), { light: 'cyl' });
  }
  // emitter bell
  k.part('metal', 'alu', svg('M 11.6 -5.9 L 13.6 -7.0 Q 14.2 -7.0 14.2 -6.4 L 14.2 -3.6 Q 14.2 -3.0 13.6 -3.0 L 11.6 -4.1 Z'), { light: 'cyl' });
  k.part('emit', 'emit', ell(14.2, -5.0, 0.35, 1.4), { spill: 0.9 });
  // charge bulb on a collar
  k.part('steel', 'steel', rrect(-1.6, -9.4, 3.6, 1.6, 0.5));
  k.part('emit', 'emit', ell(0.2, -11.0, 2.0, 1.9), { spill: 1.0 });
  k.detail((g) => {
    g.fillStyle = 'rgba(255,255,255,0.45)';
    g.beginPath(); g.ellipse(-0.5, -11.8, 0.6, 0.4, -0.5, 0, Math.PI * 2); g.fill();
  });
  k.out.muzzle = { x: 14.4, y: -5.0 };
  k.formLight([-6.6, -12.9, 14.4, 8.4]);
}

export const RAYGUN = {
  id: 'raygun',
  look: { poly: '#5a2c1e', alu: '#8a8f99', steel: '#5f646c', core: [200, 110, 255] },
  body: rayBody,
  rig: {
    gripA: { x: 0, y: 0.8 },
    gripB: { x: 2.0, y: 2.6 },
    muzzle: { x: 14.4, y: -5.0 },
    eject: null,
    shoulder: { x: -17, y: -1 },
  },
  mounts: { bore: { x0: 6.2, x1: 14.6, y: -5.0, r: 2.8 },  panel: { x0: -5.4, x1: 7.0, y0: -8.0, y1: -2.0 } },
};
