// Energy weapons. Each one is built on a real firearm layout, so it reads as a
// plausible piece of near-future military hardware rather than a toy: the
// energy part is integrated into a stock, grip, receiver and fore-end that a
// soldier could actually shoulder.
//
//   PLASMA RIFLE    bullpup; power cell in the butt behind the grip
//   PULSE RIFLE     G36-style carry-handle sight, translucent cell magazine,
//                   coil-wound barrel
//   ENERGY SHOTGUN  pump action; the capacitor tube sits where the shell tube
//                   would, the pump cycles on every shot
//   ION CANNON      anti-materiel layout: long receiver, capacitor cylinder on
//                   top, box battery, big two-chamber nozzle
//   EMP LAUNCHER    six-shot revolver grenade launcher
//   GRAVITY GUN     an industrial projector with a pair of field claws
//   LIGHTNING RIFLE wooden stock, copper coil, ceramic insulators, electrode
//                   rods with ball terminals
//   CRYO GUN        cryogen dewar over a frosted delivery tube and fan nozzle
//   PARTICLE BEAM   accelerator housing with a ring cavity and a flanged
//                   waveguide barrel
//   GAUSS RAILGUN   precision stock, capacitor bank, open twin-rail barrel
//
// Weapon space: origin = trigger-hand grip point, +x toward the muzzle.

import { svg, rpoly, rrect, ell, tube } from '../gunkit.js';
import { optic, irons } from './acc.js';

// ---------------------------------------------------------------- shared

function a2Grip(k, opts = {}) {
  k.part('furn', 'poly', svg(`M -2.8 -1.8 Q -3.4 -1.6 -3.2 -0.8 Q -3.6 3.0 -4.8 7.0 Q -5.0 8.4 -3.6 8.5 L -2.0 8.5
    Q -1.0 8.4 -0.8 7.4 Q -0.6 5.8 0.0 4.6 Q 0.6 3.6 0.6 2.4 Q 0.9 0.2 1.6 -1.0 L 1.6 -1.8 Z`), { tex: 'stipple', ...opts });
}
function guard(k, x0 = 1.0, x1 = 3.6, top = -1.8) {
  k.part('metal', 'alu', svg(`M ${x0} ${top} L ${x0 + 0.6} ${top} Q ${x0 + 1.0} 0.4 ${x1} 0.4 L ${x1} 1.2 Q ${x0 + 0.4} 1.4 ${x0 - 0.2} -0.4 Z`));
  k.part('steel', 'steel', svg(`M ${x0 + 0.9} ${top + 0.1} Q ${x0 + 1.5} -0.6 ${x0 + 1.1} 0.4 L ${x0 + 0.8} 0.4 Q ${x0 + 1.0} -0.5 ${x0 + 0.6} ${top + 0.2} Z`), { line: false });
}
// Collapsible stock on a buffer tube, skeletonised. `x` is the receiver's
// rear face, `y` the tube centreline.
function carbineStock(k, x, y) {
  k.part('steel', 'alu', tube(x - 8.6, x + 0.6, y, 1.2), { light: 'cyl' });
  k.part('furn', 'poly', svg(`M ${x - 4.6} ${y - 2.6} L ${x - 13.0} ${y - 3.0} Q ${x - 15.0} ${y - 3.1} ${x - 15.2} ${y - 1.4}
    L ${x - 15.4} ${y + 5.8} Q ${x - 15.4} ${y + 7.0} ${x - 14.2} ${y + 6.8} L ${x - 12.6} ${y + 6.2}
    Q ${x - 9.8} ${y + 5.0} ${x - 8.2} ${y + 2.4} Q ${x - 7.0} ${y + 1.0} ${x - 5.2} ${y + 0.8} L ${x - 4.6} ${y + 0.8} Z`), { tex: 'stipple' });
  k.detail((g) => {
    g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.moveTo(x - 12.6, y - 1.2); g.lineTo(x - 8.8, y - 1.0); g.quadraticCurveTo(x - 8.2, y - 0.8, x - 8.8, y + 0.2);
    g.lineTo(x - 11.2, y + 3.6); g.quadraticCurveTo(x - 12.4, y + 4.6, x - 12.8, y + 3.2); g.lineTo(x - 13.0, y - 0.6); g.closePath(); g.fill();
  });
  k.part('fixed', 'rubber', svg(`M ${x - 15.0} ${y - 3.2} L ${x - 16.0} ${y - 3.0} Q ${x - 16.6} ${y - 2.7} ${x - 16.6} ${y - 2.0}
    L ${x - 16.6} ${y + 6.4} Q ${x - 16.6} ${y + 7.2} ${x - 15.6} ${y + 7.2} L ${x - 15.0} ${y + 7.2} Z`));
}
// Energy channel: a dark slot with a lit filament in it.
function channel(k, x0, x1, y, h = 1.0) {
  k.slot(x0, y - h / 2, x1 - x0, h, h / 2);
  k.glow(`M ${x0 + 0.5} ${y} L ${x1 - 0.5} ${y}`, Math.min(0.5, h * 0.45));
}

// ============================================================ PLASMA RIFLE

function plasmaBody(k, L) {
  const acc = L.acc || {};
  const BORE = -5.0;
  // ---- barrel shroud with heat-sink fins, emitter
  k.part('steel', 'steel', tube(10.0, 23.0, BORE, 1.6));
  for (let i = 0; i < 4; i++) k.part('steel', 'alu', tube(14.4 + i * 1.9, 15.4 + i * 1.9, BORE, 2.3), { light: 'cyl' });
  k.part('steel', 'steel', tube(22.4, 25.2, BORE, 1.9));
  k.part('emit', 'emit', ell(25.2, BORE, 0.4, 1.2), { spill: 0.9 });
  // ---- one-piece bullpup shell
  k.part('furn', 'poly', svg(`M -13.8 -8.0 Q -15.8 -8.0 -15.8 -5.6 L -15.6 -0.4 Q -15.4 1.4 -13.6 1.4 L -11.8 1.4
    L -11.8 -1.2 L -5.4 -1.2 L -5.4 -1.6 Q -3.6 -1.8 -2.8 -1.6 L 1.6 -1.6 L 2.0 -1.0 L 11.4 -1.0
    Q 12.6 -1.0 12.6 -2.2 L 12.6 -6.8 Q 12.6 -8.0 11.4 -8.0 Z`), { tex: 'stipple' });
  k.seam('M -15.2 -4.2 Q -2 -4.6 12.2 -4.0', 0.18, 0.35);
  // hand stop at the front of the fore-end
  k.part('furn', 'poly', rpoly([[9.6, -1.4], [12.4, -1.4], [11.6, 1.0], [10.2, 0.9]], 0.4));
  // long bullpup trigger guard running forward under the fore-end
  k.part('furn', 'poly', svg('M 1.0 -1.4 Q 1.4 1.4 3.4 1.4 L 9.2 1.4 L 9.6 -1.2 L 8.6 -1.2 L 8.4 0.4 L 3.6 0.4 Q 2.2 0.4 2.0 -1.4 Z'));
  k.part('steel', 'steel', svg('M 2.4 -1.2 Q 3.1 -0.4 2.7 0.6 L 2.3 0.6 Q 2.5 -0.3 2.0 -1.0 Z'), { line: false });
  a2Grip(k);
  // charge vents along the shell, rail on top
  channel(k, -3.2, 8.6, -6.0, 0.9);
  k.rail(-6.0, 11.0, -9.2, 1.0);
  k.part('fixed', 'rubber', svg('M -14.6 -8.0 Q -16.6 -8.0 -16.6 -5.6 L -16.4 -0.2 Q -16.2 1.6 -14.4 1.6 L -14.4 -8.0 Z'));
  optic(k, acc.optic === undefined ? 'reddot' : acc.optic, -2.4, -9.2);
  k.out.muzzle = { x: 25.6, y: BORE };
  k.formLight([-16.6, -15, 25.6, 8.5]);
}

// Power cell, inserted up into the butt behind the grip. Origin = magPos.
function plasmaCell(k, L) {
  k.part('metal', 'alu', rpoly([[-3.0, -3.6], [3.0, -3.6], [3.2, 4.2], [-2.8, 4.2]], 0.5), { color: L.cell || '#4a5560' });
  k.part('emit', 'emit', rrect(-1.8, -2.6, 0.9, 5.6, 0.4), { spill: 0.5 });
  k.part('emit', 'emit', rrect(0.6, -2.6, 0.9, 5.6, 0.4), { spill: 0.5 });
  k.part('metal', 'alu', rrect(-3.2, 3.6, 6.6, 1.2, 0.4), { color: L.cell || '#4a5560' });
}

export const PLASMA = {
  id: 'plasma',
  look: { poly: '#2e3a40', alu: '#3e4a52', steel: '#3a3f46', core: [80, 220, 255] },
  body: plasmaBody, mag: plasmaCell,
  rig: {
    gripA: { x: 0, y: 0.6 },
    gripB: { x: 10.8, y: -1.0 },
    muzzle: { x: 25.6, y: -5.0 },
    eject: null,
    magPos: { x: -8.6, y: 1.8 },
    shoulder: { x: -7.6, y: -3.8 },
  },
  mounts: { bore: { x0: 12.6, x1: 25.8, y: -5.0, r: 2.3 },  panel: { x0: -15.0, x1: 12.2, y0: -7.6, y1: -1.4 } },
};

// ============================================================= PULSE RIFLE

function pulseBody(k, L) {
  const BORE = -5.2;
  // ---- coil-wound barrel, emitter
  k.part('steel', 'steel', tube(16.0, 31.6, BORE, 1.0));
  k.part('steel', 'copper', tube(20.8, 27.4, BORE, 1.6), { light: 'cyl' });
  k.detail((g) => {
    g.save(); g.beginPath(); g.rect(20.8, BORE - 1.6, 6.6, 3.2); g.clip();
    g.strokeStyle = 'rgba(40,16,6,0.55)'; g.lineWidth = 0.22;
    for (let x = 20.4; x < 28; x += 0.55) { g.beginPath(); g.moveTo(x, BORE - 1.6); g.lineTo(x + 0.6, BORE + 1.6); g.stroke(); }
    g.restore();
  });
  k.part('steel', 'steel', tube(31.0, 33.6, BORE, 1.35));
  k.part('emit', 'emit', ell(33.6, BORE, 0.35, 0.9), { spill: 0.9 });
  // ---- skeleton folding stock (a single loop)
  k.part('furn', 'poly', svg(`M -6.8 -8.6 L -19.4 -8.0 Q -21.2 -7.8 -21.2 -6.0 L -21.2 1.0 Q -21.2 2.4 -19.8 2.2
    L -17.4 1.6 Q -12.0 -0.4 -6.8 -3.6 Z`), { tex: 'stipple' });
  k.detail((g) => {
    g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.moveTo(-18.6, -6.2); g.lineTo(-9.0, -6.6); g.quadraticCurveTo(-8.2, -6.4, -9.0, -5.4);
    g.quadraticCurveTo(-13.4, -2.2, -17.6, -0.6); g.quadraticCurveTo(-18.8, -0.2, -18.8, -1.4); g.closePath(); g.fill();
  });
  k.part('fixed', 'rubber', svg('M -20.8 -8.0 L -21.8 -7.8 Q -22.4 -7.5 -22.4 -6.8 L -22.4 1.8 Q -22.4 2.6 -21.4 2.6 L -20.8 2.6 Z'));
  k.part('furn', 'poly', rrect(-8.0, -8.8, 2.0, 5.6, 0.5));                      // hinge
  // ---- receiver with the grip and guard moulded in
  k.part('furn', 'poly', svg(`M -6.6 -8.6 L 16.6 -8.6 Q 17.4 -8.6 17.4 -7.8 L 17.4 -3.4 Q 17.4 -2.2 16.2 -2.2
    L 10.0 -2.2 L 9.6 -1.0 L 3.2 -1.0 L 3.0 -1.4 L -1.6 -1.4 Q -3.4 -1.6 -4.6 -2.4 L -6.6 -3.6 Z`));
  for (let i = 0; i < 4; i++) k.slot(10.4 + i * 1.6, -6.4, 0.9, 2.6, 0.45);          // handguard vents
  channel(k, -4.4, 8.6, -6.6, 0.8);
  guard(k, 1.0, 3.6, -1.6);
  a2Grip(k);
  // ---- carry handle with the optic built in
  k.part('furn', 'poly', svg(`M -4.4 -8.4 L -3.8 -13.2 Q -3.6 -14.0 -2.8 -14.0 L 11.6 -14.0 Q 12.6 -14.0 12.6 -13.0
    L 13.0 -8.4 L 11.4 -8.4 L 11.2 -11.8 Q 11.0 -12.4 10.4 -12.4 L -1.8 -12.4 Q -2.4 -12.4 -2.4 -11.8 L -2.6 -8.4 Z`));
  k.part('fixed', 'glass', rrect(11.8, -13.6, 0.7, 1.4, 0.25));
  k.part('fixed', 'rubber', rrect(-5.0, -13.8, 1.4, 1.8, 0.4));
  k.out.muzzle = { x: 33.8, y: BORE };
  k.formLight([-22.4, -14, 34, 8.5]);
}

// Translucent cell magazine: you can see the charge cells stacked inside.
function pulseMag(k, L) {
  k.part('furn', 'poly', svg(`M -2.9 -2.6 L 2.8 -2.6 L 2.9 0.6 Q 3.4 4.4 5.0 8.0 L 5.2 8.8 L -0.4 9.6 Q -1.8 5.4 -2.8 1.0 Z`),
    { color: L.magShell || '#3c4a44', light: 'soft' });
  k.part('emit', 'emit', svg('M -1.6 -1.0 L 1.6 -1.0 L 1.8 1.2 Q 2.4 4.2 3.4 7.0 L 0.8 7.4 Q -0.4 4.4 -1.4 1.2 Z'), { spill: 0.4 });
  k.detail((g) => {
    g.fillStyle = 'rgba(20,30,26,0.45)'; g.beginPath(); g.moveTo(-1.6, -1.0); g.lineTo(1.6, -1.0); g.lineTo(1.8, 1.2);
    g.quadraticCurveTo(2.4, 4.2, 3.4, 7.0); g.lineTo(0.8, 7.4); g.quadraticCurveTo(-0.4, 4.4, -1.4, 1.2); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.2;
    for (let i = 0; i < 6; i++) { const y = -0.2 + i * 1.3; g.beginPath(); g.moveTo(-1.4 + i * 0.32, y); g.lineTo(2.0 + i * 0.32, y - 0.2); g.stroke(); }
  });
  k.part('furn', 'poly', rpoly([[-0.8, 9.2], [5.6, 8.4], [5.8, 9.4], [-0.6, 10.2]], 0.3), { color: L.magShell || '#3c4a44' });
}

export const PULSE = {
  id: 'pulse',
  look: { poly: '#323a36', alu: '#3c4440', steel: '#3a3e42', copper: '#a5582d', core: [120, 255, 170] },
  body: pulseBody, mag: pulseMag,
  rig: {
    gripA: { x: 0, y: 0.6 },
    gripB: { x: 13.8, y: -2.0 },
    muzzle: { x: 33.8, y: -5.2 },
    eject: null,
    magPos: { x: 6.4, y: 0.0 },
    shoulder: { x: -13.4, y: -4.0 },
  },
  mounts: { bore: { x0: 17.4, x1: 34.0, y: -5.2, r: 1.6 },  panel: { x0: -6.4, x1: 17.2, y0: -8.4, y1: -2.4 } },
};

// ========================================================== ENERGY SHOTGUN

const E_BORE = -5.6;

function shotgunBody(k, L) {
  // ---- capacitor tube under the barrel, barrel with a vented heat shield
  k.part('steel', 'steel', tube(7.0, 26.0, -2.4, 1.15));
  k.part('steel', 'steel', tube(7.0, 30.4, E_BORE, 1.3));
  k.part('metal', 'alu', svg(`M 10.0 ${E_BORE - 1.9} L 26.8 ${E_BORE - 1.9} Q 27.4 ${E_BORE - 1.9} 27.4 ${E_BORE - 1.3} L 27.4 ${E_BORE - 0.4} L 10.0 ${E_BORE - 0.4} Z`));
  for (let i = 0; i < 6; i++) k.slot(11.0 + i * 2.6, E_BORE - 1.6, 1.6, 0.7, 0.3);
  k.part('steel', 'steel', rrect(24.6, -4.4, 2.2, 3.0, 0.4));                    // barrel clamp
  k.part('steel', 'steel', tube(29.8, 32.6, E_BORE, 1.7));                       // emitter choke
  k.part('emit', 'emit', ell(32.6, E_BORE, 0.4, 1.2), { spill: 0.9 });
  k.part('steel', 'steel', ell(29.0, E_BORE - 1.6, 0.35, 0.35));                 // bead
  // ---- receiver
  k.part('metal', 'alu', svg(`M -6.4 -8.6 L 8.0 -8.6 Q 9.0 -8.6 9.0 -7.6 L 9.0 -2.6 Q 9.0 -1.6 8.0 -1.6 L 3.6 -1.6
    L 3.4 -1.2 L -1.4 -1.2 Q -3.6 -1.4 -4.6 -2.4 L -6.4 -3.6 Z`));
  k.detail((g) => { g.fillStyle = 'rgba(6,7,9,0.9)'; g.fillRect(1.0, -7.2, 5.4, 2.0); });
  k.part('emit', 'emit', rrect(1.4, -6.8, 4.6, 1.2, 0.5), { spill: 0.5 });
  k.seam('M -6.2 -4.2 L 8.8 -4.2', 0.18, 0.35);
  guard(k, 0.8, 3.4, -1.4);
  // ---- stock with an integral pistol grip
  k.part('furn', 'poly', svg(`M -6.4 -8.4 L -19.6 -7.0 Q -21.6 -6.8 -21.6 -5.0 L -21.6 0.2 Q -21.6 1.4 -20.2 1.2
    L -17.0 0.2 Q -12.0 -1.6 -8.4 -2.4 Q -6.0 -2.6 -4.6 -1.4 Q -3.6 2.2 -4.8 6.8 Q -5.0 8.2 -3.6 8.4 L -2.0 8.4
    Q -1.0 8.4 -0.8 7.4 Q -0.4 5.0 0.4 2.6 Q 0.9 0.4 1.4 -1.2 L -6.4 -3.6 Z`), { tex: 'stipple' });
  k.part('fixed', 'rubber', svg('M -21.2 -6.9 L -22.2 -6.7 Q -22.8 -6.4 -22.8 -5.7 L -22.8 1.0 Q -22.8 1.8 -21.8 1.8 L -21.2 1.8 Z'));
  k.out.muzzle = { x: 32.8, y: E_BORE };
  k.formLight([-22.8, -9, 33, 8.4]);
}

// Pump fore-end: the shotgun's "bolt" — it runs back and forward on every
// shot, and the support hand rides it. Origin = boltPos (on the tube).
function shotgunPump(k, L) {
  k.part('furn', 'poly', svg('M -4.2 -1.8 L 4.2 -1.8 Q 5.0 -1.8 5.0 -1.0 L 5.0 1.4 Q 5.0 2.4 4.0 2.4 L -4.0 2.4 Q -5.0 2.4 -5.0 1.4 L -5.0 -1.0 Q -5.0 -1.8 -4.2 -1.8 Z'),
    { tex: 'stipple' });
  k.detail((g) => {
    g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.3;
    for (let x = -3.6; x <= 3.6; x += 1.2) { g.beginPath(); g.moveTo(x, -1.2); g.lineTo(x, 1.8); g.stroke(); }
  });
}

export const ESHOTGUN = {
  id: 'eshotgun',
  look: { alu: '#3f3d3a', poly: '#2f2e2c', steel: '#3a3c40', core: [255, 150, 60] },
  body: shotgunBody, bolt: shotgunPump,
  rig: {
    gripA: { x: 0, y: 0.6 },
    gripB: { x: 16.4, y: -1.4 },
    gripBOnBolt: true,
    muzzle: { x: 32.8, y: E_BORE },
    eject: null,
    boltPos: { x: 16.4, y: -2.4 },
    shoulder: { x: -14.0, y: -3.6 },
  },
  mounts: { bore: { x0: 9.0, x1: 33.0, y: E_BORE, r: 1.7 },  panel: { x0: -6.2, x1: 8.8, y0: -8.4, y1: -1.8 } },
};

// =============================================================== ION CANNON

const I_BORE = -5.6;

function ionBody(k, L) {
  // ---- barrel, vented shroud, two-chamber ion nozzle
  k.part('steel', 'steel', tube(20.0, 42.0, I_BORE, 1.2));
  k.part('metal', 'alu', tube(21.6, 36.6, I_BORE, 2.0), { light: 'cyl' });
  for (let i = 0; i < 5; i++) k.slot(23.0 + i * 2.6, I_BORE - 0.5, 1.6, 1.0, 0.45);
  k.part('steel', 'steel', rpoly([[41.0, I_BORE - 1.6], [42.0, I_BORE - 2.9], [47.4, I_BORE - 2.9], [47.8, I_BORE - 2.4],
    [47.8, I_BORE + 2.4], [47.4, I_BORE + 2.9], [42.0, I_BORE + 2.9], [41.0, I_BORE + 1.6]], 0.4), { light: 'cyl' });
  k.slot(42.8, I_BORE - 1.9, 1.4, 3.8, 0.5); k.slot(45.2, I_BORE - 1.9, 1.4, 3.8, 0.5);
  k.glow(`M 43.5 ${I_BORE - 1.2} L 43.5 ${I_BORE + 1.2}`, 0.5); k.glow(`M 45.9 ${I_BORE - 1.2} L 45.9 ${I_BORE + 1.2}`, 0.5);
  // ---- stock with recoil pad and monopod
  k.part('furn', 'poly', svg(`M -8.4 -8.8 L -22.4 -8.4 Q -24.2 -8.4 -24.2 -6.8 L -24.2 1.2 Q -24.2 2.4 -22.8 2.4
    L -20.4 2.2 L -18.6 0.4 L -10.4 -2.0 L -8.4 -3.0 Z`), { tex: 'stipple' });
  k.part('fixed', 'rubber', svg('M -24.0 -8.5 L -25.2 -8.3 Q -25.8 -8.0 -25.8 -7.2 L -25.8 2.0 Q -25.8 2.9 -24.8 2.9 L -24.0 2.9 Z'));
  k.part('steel', 'alu', rrect(-20.4, 1.6, 1.6, 4.6, 0.4));
  k.part('steel', 'alu', rrect(-21.2, 5.6, 3.2, 1.2, 0.4));
  // ---- long upper receiver and the lower with the box magazine well
  k.part('metal', 'alu', svg(`M -8.8 -9.2 L 22.0 -9.2 Q 23.0 -9.2 23.0 -8.2 L 23.0 -4.2 Q 23.0 -3.2 22.0 -3.2
    L -8.8 -3.2 Z`));
  k.part('metal', 'alu', svg(`M -7.6 -3.6 L 11.2 -3.6 L 11.2 0.4 L 3.4 0.4 L 3.2 -1.2 L -1.4 -1.2 Q -3.6 -1.4 -4.8 -2.2 L -7.6 -2.6 Z`));
  channel(k, -6.0, 20.0, -6.2, 0.9);
  k.screw(-6.6, -4.4, 0.4); k.screw(20.4, -4.4, 0.4);
  guard(k, 0.8, 3.4, -1.4);
  a2Grip(k);
  // ---- capacitor cylinder on top, in two clamps
  k.part('steel', 'steel', rrect(-0.6, -10.6, 2.0, 2.0, 0.3));
  k.part('steel', 'steel', rrect(14.2, -10.6, 2.0, 2.0, 0.3));
  k.part('metal', 'alu', tube(-2.4, 18.0, -12.4, 2.3, 'round', 'round'), { light: 'cyl' });
  for (const x of [2.2, 6.6, 11.0]) { k.slot(x, -13.6, 2.6, 2.4, 0.6); k.glow(`M ${x + 0.6} -12.4 L ${x + 2.0} -12.4`, 0.55); }
  k.seam('M 0 -14.4 L 16 -14.4', 0.14, 0.3);
  // ---- folded bipod
  k.part('steel', 'alu', rrect(19.4, -3.6, 2.0, 2.0, 0.4));
  k.part('steel', 'alu', rpoly([[20.2, -2.2], [32.0, -2.8], [32.2, -2.0], [20.4, -1.2]], 0.3));
  k.out.muzzle = { x: 48.0, y: I_BORE };
  k.formLight([-25.8, -15, 48, 8.5]);
}

// Box battery. Origin = magPos.
function ionBattery(k, L) {
  k.part('metal', 'alu', svg('M -3.6 -2.8 L 3.6 -2.8 L 3.6 6.6 Q 3.6 7.6 2.6 7.6 L -2.6 7.6 Q -3.6 7.6 -3.6 6.6 Z'), { color: L.cell || '#3c4a4a' });
  k.part('emit', 'emit', rrect(-2.2, 0.6, 4.4, 0.9, 0.4), { spill: 0.5 });
  k.seam('M -3.4 3.6 L 3.4 3.6', 0.2, 0.4);
}

export const ION = {
  id: 'ion',
  look: { alu: '#2f4644', poly: '#283432', steel: '#383d40', core: [80, 255, 210] },
  body: ionBody, mag: ionBattery,
  rig: {
    gripA: { x: 0, y: 0.6 },
    gripB: { x: 19.0, y: -3.0 },
    muzzle: { x: 48.0, y: I_BORE },
    eject: null,
    magPos: { x: 7.2, y: 1.6 },
    shoulder: { x: -16.8, y: -4.4 },
  },
  mounts: { bore: { x0: 23.0, x1: 48.2, y: I_BORE, r: 2.9 },  panel: { x0: -8.6, x1: 22.8, y0: -9.0, y1: -3.4 } },
};

// ============================================================ EMP LAUNCHER

const M_BORE = -5.6;

function empBody(k, L) {
  const acc = L.acc || {};
  // ---- barrel with a top rail, front grip
  k.part('steel', 'alu', tube(11.6, 23.0, M_BORE, 2.3), { light: 'cyl' });
  k.part('steel', 'steel', tube(22.4, 24.0, M_BORE, 2.6));
  k.part('emit', 'emit', ell(24.0, M_BORE, 0.4, 1.7), { spill: 0.7 });
  k.part('metal', 'alu', rrect(11.6, -9.4, 10.6, 1.8, 0.4));
  k.rail(11.8, 21.8, -10.4, 0.9);
  k.part('steel', 'alu', rrect(14.6, -3.6, 4.0, 1.6, 0.4));
  k.part('furn', 'poly', svg(`M 15.2 -2.4 L 18.0 -2.4 Q 18.2 1.4 17.8 4.4 Q 17.6 5.2 16.8 5.2 L 16.0 5.2 Q 15.2 5.2 15.2 4.4
    Q 14.8 1.4 15.2 -2.4 Z`), { tex: 'stipple' });
  // ---- revolving cylinder: six chambers, fluted
  k.part('metal', 'alu', svg(`M 1.6 -10.6 L 12.4 -10.6 Q 13.2 -10.6 13.2 -9.8 L 13.2 -1.4 Q 13.2 -0.6 12.4 -0.6 L 1.6 -0.6
    Q 0.8 -0.6 0.8 -1.4 L 0.8 -9.8 Q 0.8 -10.6 1.6 -10.6 Z`), { light: 'cyl' });
  k.detail((g) => {
    for (const y of [-8.6, -5.6, -2.6]) {
      g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(1.6, y - 0.55, 10.8, 1.1);
      g.fillStyle = 'rgba(230,236,244,0.14)'; g.fillRect(1.6, y + 0.55, 10.8, 0.25);
    }
  });
  for (const y of [-8.6, -5.6, -2.6]) k.part('emit', 'emit', rrect(12.6, y - 0.8, 0.6, 1.6, 0.3), { spill: 0.35 });
  // ---- frame: hinge strap over the cylinder, rear frame, grip, stock
  k.part('metal', 'alu', rrect(-0.4, -11.6, 14.4, 1.4, 0.5));
  k.part('metal', 'alu', svg(`M -6.4 -10.6 L 1.4 -10.6 L 1.4 -0.6 L -1.4 -0.6 L -1.4 -1.2 Q -3.6 -1.4 -4.6 -2.4 L -6.4 -3.6 Z`));
  k.part('metal', 'alu', rrect(0.2, -1.2, 13.4, 1.4, 0.5));
  guard(k, 0.8, 3.4, -0.8);
  a2Grip(k);
  carbineStock(k, -6.2, M_BORE);
  optic(k, acc.optic === undefined ? 'holo' : acc.optic, 12.4, -10.4);
  k.out.muzzle = { x: 24.2, y: M_BORE };
  k.formLight([-22.8, -17, 24.2, 8.5]);
}

export const EMP = {
  id: 'emp',
  look: { alu: '#5a5a48', poly: '#3a3a30', steel: '#3a3d40', core: [120, 200, 255] },
  body: empBody,
  rig: {
    gripA: { x: 0, y: 0.6 },
    gripB: { x: 16.6, y: 1.6 },
    muzzle: { x: 24.2, y: M_BORE },
    eject: null,
    shoulder: { x: -14.2, y: -3.8 },
  },
  mounts: { bore: { x0: 13.2, x1: 24.4, y: M_BORE, r: 2.6 },  panel: { x0: 1.0, x1: 13.0, y0: -10.4, y1: -0.8 } },
};

// ============================================================= GRAVITY GUN

const GV = -4.6;

function gravityBody(k, L) {
  // ---- field claws, the projector's front: an upper and a lower jaw cradling the lens
  k.part('metal', 'alu', svg(`M 10.6 ${GV - 3.4} Q 16.0 ${GV - 7.8} 22.6 ${GV - 5.6} Q 23.6 ${GV - 5.2} 23.0 ${GV - 4.4}
    Q 18.6 ${GV - 5.6} 15.6 ${GV - 2.4} L 12.0 ${GV - 1.4} Z`), { light: 'cyl' });
  k.part('metal', 'alu', svg(`M 10.6 ${GV + 3.4} Q 16.0 ${GV + 7.8} 22.6 ${GV + 5.6} Q 23.6 ${GV + 5.2} 23.0 ${GV + 4.4}
    Q 18.6 ${GV + 5.6} 15.6 ${GV + 2.4} L 12.0 ${GV + 1.4} Z`), { light: 'cyl' });
  k.part('steel', 'steel', tube(10.0, 16.6, GV, 1.8));
  k.part('emit', 'emit', ell(17.2, GV, 1.2, 1.6), { spill: 1.2 });
  // ---- projector housing: a heavy rounded tool body
  k.part('metal', 'alu', svg(`M -6.6 ${GV - 4.4} Q -6.6 ${GV - 5.6} -5.4 ${GV - 5.6} L 9.4 ${GV - 5.6} Q 12.0 ${GV - 5.4} 12.0 ${GV - 2.6}
    L 12.0 ${GV + 2.6} Q 12.0 ${GV + 4.4} 10.0 ${GV + 4.4} L 3.6 ${GV + 4.4} L 3.4 ${GV + 3.6} L -1.4 ${GV + 3.6}
    Q -3.6 ${GV + 3.4} -4.8 ${GV + 2.8} L -6.6 ${GV + 2.0} Z`), { light: 'cyl' });
  channel(k, -3.4, 8.8, GV - 2.6, 1.0);
  for (let i = 0; i < 3; i++) k.slot(1.0 + i * 2.6, GV + 0.2, 1.6, 2.0, 0.5);
  k.screw(-5.0, GV - 4.0, 0.4); k.screw(10.2, GV - 4.0, 0.4);
  // ---- battery pack behind, ribbed
  k.part('furn', 'poly', svg(`M -14.6 ${GV - 4.2} Q -14.6 ${GV - 5.2} -13.6 ${GV - 5.2} L -6.0 ${GV - 5.2} L -6.0 ${GV + 2.6}
    L -13.6 ${GV + 2.6} Q -14.6 ${GV + 2.6} -14.6 ${GV + 1.6} Z`));
  k.detail((g) => { g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.3; for (let x = -13.2; x < -6.6; x += 1.3) { g.beginPath(); g.moveTo(x, GV - 4.6); g.lineTo(x, GV + 2.0); g.stroke(); } });
  k.part('emit', 'emit', rrect(-12.8, GV - 1.2, 5.0, 0.8, 0.35), { spill: 0.4 });
  // ---- top handle, trigger grip, front handle
  k.part('metal', 'alu', svg(`M -3.4 ${GV - 5.2} L -3.0 ${GV - 9.0} Q -2.8 ${GV - 9.8} -2.0 ${GV - 9.8} L 6.4 ${GV - 9.8}
    Q 7.2 ${GV - 9.8} 7.4 ${GV - 9.0} L 7.8 ${GV - 5.2} L 6.4 ${GV - 5.2} L 6.2 ${GV - 8.4} L -1.8 ${GV - 8.4} L -2.0 ${GV - 5.2} Z`));
  guard(k, 0.8, 3.4, -1.2);
  a2Grip(k);
  k.part('furn', 'poly', svg(`M 7.4 ${GV + 4.0} L 10.2 ${GV + 4.0} Q 10.4 ${GV + 7.6} 10.0 ${GV + 10.4} Q 9.8 ${GV + 11.2} 9.0 ${GV + 11.2}
    L 8.2 ${GV + 11.2} Q 7.4 ${GV + 11.2} 7.4 ${GV + 10.4} Q 7.0 ${GV + 7.6} 7.4 ${GV + 4.0} Z`), { tex: 'stipple' });
  k.out.muzzle = { x: 18.6, y: GV };
  k.formLight([-14.6, GV - 10, 23.6, 8.5]);
}

export const GRAVITY = {
  id: 'gravity',
  look: { alu: '#4a4458', poly: '#2e2a36', steel: '#3a3a42', core: [180, 120, 255] },
  body: gravityBody,
  rig: {
    gripA: { x: 0, y: 0.6 },
    gripB: { x: 8.8, y: GV + 7.4 },
    muzzle: { x: 18.6, y: GV },
    eject: null,
    shoulder: { x: -6.8, y: -3.8 },
  },
  mounts: { bore: { x0: 10.0, x1: 24.0, y: GV, r: 4.6 },  panel: { x0: -6.4, x1: 11.8, y0: GV - 5.4, y1: GV + 3.4 } },
};

// ========================================================= LIGHTNING RIFLE

const LT = -5.4;

function lightningBody(k, L) {
  // ---- electrode rods on ceramic insulator stacks, ball terminals
  for (const dy of [-2.6, 2.6]) k.part('steel', 'copper', tube(18.0, 30.4, LT + dy, 0.62), { light: 'cyl' });
  for (const dy of [-2.6, 2.6]) k.part('steel', 'brass', ell(30.6, LT + dy, 1.0, 1.0), { light: 'cyl' });
  for (const x of [20.0, 25.4]) {
    k.part('fixed', 'ceramic', svg(`M ${x - 0.9} ${LT - 2.8} L ${x + 0.9} ${LT - 2.8} L ${x + 0.9} ${LT + 2.8} L ${x - 0.9} ${LT + 2.8} Z`), { light: 'cyl' });
    k.detail((g) => { g.strokeStyle = 'rgba(80,60,40,0.45)'; g.lineWidth = 0.22; for (let y = LT - 2.2; y < LT + 2.6; y += 0.9) { g.beginPath(); g.moveTo(x - 0.9, y); g.lineTo(x + 0.9, y); g.stroke(); } });
  }
  k.part('steel', 'steel', tube(16.0, 27.6, LT, 0.8));
  k.part('emit', 'emit', ell(28.2, LT, 0.6, 0.6), { spill: 1.1 });
  // ---- copper coil housing
  k.part('steel', 'copper', tube(6.4, 18.4, LT, 2.5), { light: 'cyl' });
  k.detail((g) => {
    g.save(); g.beginPath(); g.rect(6.4, LT - 2.5, 12.0, 5.0); g.clip();
    g.strokeStyle = 'rgba(50,20,8,0.5)'; g.lineWidth = 0.24;
    for (let x = 6.0; x < 19; x += 0.5) { g.beginPath(); g.moveTo(x, LT - 2.5); g.lineTo(x + 0.7, LT + 2.5); g.stroke(); }
    g.restore();
  });
  k.part('steel', 'steel', tube(5.8, 7.0, LT, 2.8));
  k.part('steel', 'steel', tube(17.8, 19.0, LT, 2.8));
  // ---- receiver and wooden furniture
  k.part('metal', 'steel', svg(`M -5.6 -8.6 L 6.8 -8.6 L 6.8 -2.4 L 3.2 -2.4 L 3.0 -1.6 L -1.4 -1.6 Q -3.6 -1.8 -4.6 -2.6 L -5.6 -3.4 Z`), { color: L.alu });
  k.part('furn', 'wood', svg(`M 5.4 -2.6 L 17.0 -2.6 Q 18.6 -2.6 18.6 -1.4 L 18.4 -0.8 Q 18.0 0.4 16.6 0.4 L 6.4 0.4
    Q 5.4 0.4 5.4 -0.6 Z`));
  k.part('furn', 'wood', svg(`M -5.4 -8.4 L -19.4 -7.0 Q -21.2 -6.8 -21.2 -5.2 L -21.2 1.8 Q -21.2 3.0 -19.8 2.8
    L -16.4 1.8 Q -11.4 0.2 -8.0 -1.0 Q -5.6 -1.8 -4.4 -1.6 Q -3.4 2.2 -4.6 6.8 Q -4.8 8.2 -3.4 8.4 L -2.0 8.4
    Q -1.0 8.4 -0.8 7.4 Q -0.4 5.0 0.4 2.6 Q 0.8 0.6 1.2 -1.4 L -5.4 -3.4 Z`));
  k.part('fixed', 'rubber', svg('M -20.8 -6.9 L -21.8 -6.7 Q -22.4 -6.4 -22.4 -5.7 L -22.4 2.6 Q -22.4 3.4 -21.4 3.4 L -20.8 3.4 Z'));
  guard(k, 0.8, 3.4, -1.4);
  // ---- capacitor canister on top, wired into the coil
  k.part('steel', 'steel', rrect(-3.0, -9.6, 1.6, 1.4, 0.3));
  k.part('steel', 'steel', rrect(3.2, -9.6, 1.6, 1.4, 0.3));
  k.part('metal', 'alu', tube(-4.4, 6.4, -11.2, 1.9, 'round', 'round'), { light: 'cyl' });
  k.part('furn', 'rubber', svg('M 6.0 -11.6 Q 9.2 -11.8 9.6 -8.6 L 9.6 -7.6 L 8.4 -7.6 L 8.4 -8.4 Q 8.2 -10.4 6.0 -10.4 Z'), { light: 'soft' });
  channel(k, -3.0, 4.8, -11.2, 0.8);
  k.out.muzzle = { x: 28.9, y: LT };
  k.formLight([-22.4, -13.4, 31.6, 8.4]);
}

export const LIGHTNING = {
  id: 'lightning',
  look: { alu: '#34383e', wood: '#6e4a2c', steel: '#3a3d42', copper: '#b06838', brass: '#c09a48', core: [150, 210, 255] },
  body: lightningBody,
  rig: {
    gripA: { x: 0, y: 0.6 },
    gripB: { x: 12.4, y: -0.4 },
    muzzle: { x: 28.9, y: LT },
    eject: null,
    shoulder: { x: -13.6, y: -3.4 },
  },
  mounts: { bore: { x0: 16.0, x1: 31.8, y: LT, r: 3.2 },  panel: { x0: -5.4, x1: 6.6, y0: -8.4, y1: -2.6 } },
};

// ================================================================ CRYO GUN

const C_BORE = -5.2;

function cryoBody(k, L) {
  // ---- delivery tube with insulation bands, fan nozzle
  k.part('steel', 'steel', tube(5.0, 27.0, C_BORE, 1.15));
  for (let i = 0; i < 5; i++) k.part('fixed', 'ceramic', tube(9.4 + i * 3.4, 11.2 + i * 3.4, C_BORE, 1.6), { color: L.lag || '#c9d3da', light: 'cyl' });
  k.part('steel', 'steel', svg(`M 26.4 ${C_BORE - 1.2} L 30.6 ${C_BORE - 2.4} Q 31.2 ${C_BORE - 2.4} 31.2 ${C_BORE - 1.8}
    L 31.2 ${C_BORE + 1.8} Q 31.2 ${C_BORE + 2.4} 30.6 ${C_BORE + 2.4} L 26.4 ${C_BORE + 1.2} Z`), { light: 'cyl' });
  k.part('emit', 'emit', rrect(30.9, C_BORE - 1.8, 0.5, 3.6, 0.25), { spill: 0.9 });
  // ---- receiver / valve block
  k.part('metal', 'alu', svg(`M -6.2 -8.6 L 6.0 -8.6 Q 7.0 -8.6 7.0 -7.6 L 7.0 -3.0 Q 7.0 -2.0 6.0 -2.0 L 3.4 -2.0
    L 3.2 -1.4 L -1.4 -1.4 Q -3.6 -1.6 -4.6 -2.4 L -6.2 -3.4 Z`));
  k.seam('M -6.0 -5.4 L 6.8 -5.4', 0.18, 0.35);
  guard(k, 0.8, 3.4, -1.2);
  a2Grip(k);
  carbineStock(k, -6.0, C_BORE - 0.6);
  // ---- cryogen dewar over the tube, its feed line, gauge, frost
  k.part('steel', 'steel', rrect(-1.2, -10.2, 1.8, 2.0, 0.3));
  k.part('steel', 'steel', rrect(10.0, -10.2, 1.8, 2.0, 0.3));
  k.part('metal', 'paint', tube(-4.6, 15.6, -12.4, 2.7, 'round', 'round'), { color: L.tank || '#d8dde2', light: 'cyl' });
  k.part('steel', 'steel', svg('M 15.0 -12.2 Q 18.6 -12.4 18.8 -9.0 L 18.8 -6.6 L 17.2 -6.6 L 17.2 -8.8 Q 17.0 -10.8 15.0 -10.8 Z'), { light: 'cyl' });
  k.part('steel', 'steel', ell(4.8, -15.2, 1.4, 1.2));
  k.part('fixed', 'ceramic', ell(4.8, -15.2, 0.95, 0.8), { line: false });
  k.detail((g) => {
    g.strokeStyle = '#2a6aa0'; g.lineWidth = 0.16; g.beginPath(); g.moveTo(4.8, -15.2); g.lineTo(5.4, -15.7); g.stroke();
    g.fillStyle = 'rgba(30,40,60,0.6)'; g.fillRect(-1.0, -12.9, 9.6, 0.9);                  // stencil band
    g.fillStyle = 'rgba(235,248,255,0.55)';
    for (const [x, y] of [[13.2, -6.6], [16.2, -3.8], [22.6, -6.4], [27.2, -3.6], [19.4, -6.8]]) { g.beginPath(); g.arc(x, y, 0.35, 0, Math.PI * 2); g.fill(); }
  });
  k.part('furn', 'poly', svg(`M 12.6 -3.8 L 15.4 -3.8 Q 15.6 0.0 15.2 3.2 Q 15.0 4.0 14.2 4.0 L 13.4 4.0 Q 12.6 4.0 12.6 3.2
    Q 12.2 0.0 12.6 -3.8 Z`), { tex: 'stipple' });
  k.part('steel', 'alu', rrect(12.0, -4.8, 4.0, 1.4, 0.4));
  k.out.muzzle = { x: 31.4, y: C_BORE };
  k.formLight([-22.6, -15.2, 31.4, 8.5]);
}

export const CRYO = {
  id: 'cryo',
  look: { alu: '#3e4a54', poly: '#2e3640', steel: '#4a525a', paint: '#d8dde2', core: [160, 230, 255] },
  body: cryoBody,
  rig: {
    gripA: { x: 0, y: 0.6 },
    gripB: { x: 14.0, y: 1.2 },
    muzzle: { x: 31.4, y: C_BORE },
    eject: null,
    shoulder: { x: -13.0, y: -4.0 },
  },
  mounts: { bore: { x0: 7.0, x1: 31.6, y: C_BORE, r: 2.4 },  panel: { x0: -6.0, x1: 6.8, y0: -8.4, y1: -2.2 } },
};

// ============================================================ PARTICLE BEAM

const P_C = -5.0;

function particleBody(k, L) {
  // ---- waveguide barrel with flanges, emitter lens
  k.part('steel', 'steel', tube(12.0, 29.6, P_C, 1.5));
  for (const x of [17.0, 21.4, 25.8]) k.part('steel', 'alu', tube(x, x + 0.9, P_C, 2.4), { light: 'cyl' });
  k.part('steel', 'steel', tube(29.0, 31.4, P_C, 2.0));
  k.part('emit', 'emit', ell(31.4, P_C, 0.4, 1.4), { spill: 1.0 });
  // ---- rear frame and padded butt
  k.part('steel', 'alu', tube(-17.6, -5.6, P_C - 0.4, 1.3), { light: 'cyl' });
  k.part('furn', 'rubber', svg(`M -16.0 -9.8 L -18.4 -9.6 Q -19.4 -9.4 -19.4 -8.2 L -19.4 1.6 Q -19.4 2.8 -18.2 2.8
    L -16.0 2.6 Z`), { light: 'soft' });
  k.part('furn', 'poly', rrect(-16.4, -9.4, 2.2, 11.6, 0.6));
  // ---- accelerator housing with its ring cavity
  k.part('metal', 'alu', tube(-6.8, 14.4, P_C, 4.0, 'round', 'flat'), { light: 'cyl' });
  k.part('metal', 'alu', rpoly([[1.4, P_C - 5.6], [8.6, P_C - 5.6], [9.4, P_C - 4.6], [9.4, P_C + 4.6], [8.6, P_C + 5.6],
    [1.4, P_C + 5.6], [0.6, P_C + 4.6], [0.6, P_C - 4.6]], 0.9), { light: 'cyl', color: L.ring || L.alu });
  for (const y of [P_C - 3.2, P_C + 0.4]) { k.slot(2.0, y, 6.0, 1.4, 0.6); k.glow(`M 2.6 ${y + 0.7} L 7.4 ${y + 0.7}`, 0.5); }
  k.seam(`M -5.6 ${P_C + 2.6} L 13.8 ${P_C + 2.6}`, 0.16, 0.3);
  // ---- carry handle, trigger grip, front grip
  k.part('metal', 'alu', svg(`M -4.0 ${P_C - 3.8} L -3.6 ${P_C - 7.6} Q -3.4 ${P_C - 8.4} -2.6 ${P_C - 8.4} L 12.0 ${P_C - 8.4}
    Q 12.8 ${P_C - 8.4} 13.0 ${P_C - 7.6} L 13.4 ${P_C - 3.6} L 12.0 ${P_C - 3.6} L 11.8 ${P_C - 7.0} L -2.2 ${P_C - 7.0} L -2.4 ${P_C - 3.8} Z`));
  guard(k, 0.8, 3.4, -1.6);
  a2Grip(k);
  k.part('furn', 'poly', svg(`M 10.6 ${P_C + 3.4} L 13.4 ${P_C + 3.4} Q 13.6 ${P_C + 7.4} 13.2 ${P_C + 10.6} Q 13.0 ${P_C + 11.4} 12.2 ${P_C + 11.4}
    L 11.4 ${P_C + 11.4} Q 10.6 ${P_C + 11.4} 10.6 ${P_C + 10.6} Q 10.2 ${P_C + 7.4} 10.6 ${P_C + 3.4} Z`), { tex: 'stipple' });
  k.out.muzzle = { x: 31.6, y: P_C };
  k.formLight([-19.4, P_C - 8.4, 31.6, 8.5]);
}

export const PARTICLE = {
  id: 'particle',
  look: { alu: '#3e3650', poly: '#2c2834', steel: '#3a3a42', core: [190, 120, 255] },
  body: particleBody,
  rig: {
    gripA: { x: 0, y: 0.6 },
    gripB: { x: 12.0, y: P_C + 7.0 },
    muzzle: { x: 31.6, y: P_C },
    eject: null,
    shoulder: { x: -11.0, y: -4.4 },
  },
  mounts: { bore: { x0: 14.4, x1: 31.8, y: P_C, r: 2.4 },  panel: { x0: -6.0, x1: 14.0, y0: P_C - 3.6, y1: P_C + 3.4 } },
};

// =========================================================== GAUSS RAILGUN

const R_BORE = -5.2;

function railgunBody(k, L) {
  const acc = L.acc || {};
  // ---- the rails: two conductors on an insulated spine, braced at intervals
  k.part('fixed', 'paint', rrect(9.0, R_BORE - 1.0, 35.0, 2.0, 0.3), { color: L.liner || '#2a2e36', bevel: false });
  k.glow(`M 10.0 ${R_BORE} L 43.0 ${R_BORE}`, 0.4);
  k.part('steel', 'copper', rrect(9.0, R_BORE - 2.6, 35.6, 1.6, 0.4), { light: 'box' });
  k.part('steel', 'copper', rrect(9.0, R_BORE + 1.0, 35.6, 1.6, 0.4), { light: 'box' });
  for (const x of [14.0, 22.0, 30.0, 38.0]) k.part('fixed', 'ceramic', rrect(x, R_BORE - 3.2, 1.6, 6.4, 0.4), { color: L.brace || '#3c4048' });
  k.part('steel', 'steel', rrect(43.6, R_BORE - 3.4, 2.2, 6.8, 0.5));
  // ---- capacitor bank under the breech
  k.part('metal', 'alu', svg(`M 2.0 -2.4 L 17.4 -2.4 Q 18.4 -2.4 18.4 -1.4 L 18.4 2.2 Q 18.4 3.2 17.4 3.2 L 4.4 3.2
    Q 2.0 3.2 2.0 1.0 Z`));
  for (let i = 0; i < 4; i++) k.slot(5.0 + i * 3.2, -1.2, 2.2, 3.0, 0.5);
  k.glow('M 5.6 0.3 L 16.4 0.3', 0.35);
  // ---- breech / receiver
  k.part('metal', 'alu', svg(`M -6.4 -9.0 L 9.8 -9.0 Q 10.8 -9.0 10.8 -8.0 L 10.8 -2.0 L 3.0 -2.0 L 3.0 -1.2
    L -1.4 -1.2 Q -3.6 -1.4 -4.6 -2.2 L -6.4 -3.4 Z`));
  channel(k, -4.6, 9.0, -6.4, 0.9);
  k.rail(-5.6, 10.4, -10.0, 1.0);
  guard(k, 0.8, 3.0, -1.2);
  a2Grip(k);
  // ---- precision stock
  k.part('furn', 'poly', svg(`M -5.2 -8.6 L -21.0 -8.4 Q -23.2 -8.4 -23.4 -6.8 L -23.6 1.4 Q -23.6 2.6 -22.2 2.6
    L -19.4 2.2 Q -14.8 0.0 -10.8 -2.0 L -6.6 -3.0 L -5.2 -3.2 Z`), { tex: 'stipple' });
  k.part('furn', 'poly', svg('M -20.4 -8.4 L -20.2 -10.0 Q -20.0 -10.4 -19.4 -10.4 L -12.0 -10.4 Q -11.4 -10.4 -11.2 -9.8 L -11.0 -8.4 Z'));
  k.part('fixed', 'rubber', svg('M -23.2 -8.5 L -24.2 -8.3 Q -24.8 -8.0 -24.8 -7.2 L -24.8 2.2 Q -24.8 3.0 -23.8 3.0 L -23.2 3.0 Z'));
  // ---- vertical foregrip under the rails
  k.part('steel', 'alu', rrect(19.6, R_BORE + 2.2, 4.6, 1.6, 0.4));
  k.part('furn', 'poly', svg(`M 20.4 ${R_BORE + 3.4} L 23.2 ${R_BORE + 3.4} Q 23.4 ${R_BORE + 7.4} 23.0 ${R_BORE + 10.4}
    Q 22.8 ${R_BORE + 11.2} 22.0 ${R_BORE + 11.2} L 21.2 ${R_BORE + 11.2} Q 20.4 ${R_BORE + 11.2} 20.4 ${R_BORE + 10.4}
    Q 20.0 ${R_BORE + 7.4} 20.4 ${R_BORE + 3.4} Z`), { tex: 'stipple' });
  optic(k, acc.optic === undefined ? 'longscope' : acc.optic, -5.2, -10.0);
  k.out.muzzle = { x: 46.0, y: R_BORE };
  k.formLight([-24.8, -18, 46, 6.0]);
}

export const RAILGUN = {
  id: 'railgun',
  look: { alu: '#3a3e44', poly: '#2c2f33', steel: '#3a3d42', copper: '#9a6a44', core: [150, 220, 255] },
  body: railgunBody,
  rig: {
    gripA: { x: 0, y: 0.6 },
    gripB: { x: 21.8, y: R_BORE + 7.0 },
    muzzle: { x: 46.0, y: R_BORE },
    eject: null,
    shoulder: { x: -15.4, y: -4.0 },
  },
  mounts: { bore: { x0: 9.0, x1: 46.2, y: R_BORE, r: 3.4 },  panel: { x0: -6.2, x1: 10.6, y0: -8.8, y1: -2.2 } },
};
