// Full-power rifles: the MK-2 "WARDEN" (7.62 battle rifle on the SCAR
// pattern: folding stock, long monolithic upper, magnified optic), the LRS-1
// "TALON" (bolt-action sniper in a thumbhole chassis stock) and the M-900
// "OX" (belt-fed light machine gun with a box under the receiver).
//
// Weapon space: origin = trigger-hand grip point, +x toward the muzzle.

import { svg, rpoly, rrect, ell, tube } from '../gunkit.js';
import { optic, muzzle, laser, irons } from './acc.js';

// Shared A2-style pistol grip, fitted to the hand at the origin.
function a2Grip(k, color) {
  k.part('furn', 'poly', svg(`M -2.8 -1.8 Q -3.4 -1.6 -3.2 -0.8 Q -3.6 3.0 -4.8 7.0 Q -5.0 8.4 -3.6 8.5 L -2.0 8.5
    Q -1.0 8.4 -0.8 7.4 Q -0.6 5.8 0.0 4.6 Q 0.6 3.6 0.6 2.4 Q 0.9 0.2 1.6 -1.0 L 1.6 -1.8 Z`), { tex: 'stipple', color });
}
function triggerGuard(k, x0 = 1.0, x1 = 3.4) {
  k.part('metal', 'alu', svg(`M ${x0} -1.6 L ${x0 + 0.6} -1.6 Q ${x0 + 1.0} 0.4 ${x1} 0.4 L ${x1} 1.2 Q ${x0 + 0.4} 1.4 ${x0 - 0.2} -0.4 Z`));
  k.part('steel', 'steel', svg(`M ${x0 + 0.9} -1.5 Q ${x0 + 1.5} -0.6 ${x0 + 1.1} 0.4 L ${x0 + 0.8} 0.4 Q ${x0 + 1.0} -0.5 ${x0 + 0.6} -1.4 Z`), { line: false });
}

// ================================================================ MK-2

const B_BORE = -5.6;
const B_RAIL = -10.3;
const B_BARREL = 38.4;

function mk2Body(k, L) {
  const acc = L.acc || {};
  // ---- folding stock with cheek riser and hinge block
  k.part('furn', 'poly', svg(`M -7.4 -8.8 L -20.2 -8.6 Q -21.8 -8.6 -22.0 -7.4 L -22.2 0.8 Q -22.2 1.8 -21.0 1.8
    L -17.6 1.2 Q -15.0 0.6 -13.4 -1.4 L -10.4 -3.4 Q -9.0 -4.2 -7.4 -4.4 Z`), { tex: 'stipple' });
  k.part('furn', 'poly', svg('M -17.6 -8.6 L -17.2 -10.0 Q -16.8 -10.4 -16.2 -10.4 L -11.6 -10.4 Q -10.8 -10.4 -10.6 -9.8 L -10.4 -8.6 Z'));
  k.seam('M -20.6 -6.6 L -12.4 -6.8 L -10.4 -5.4', 0.18, 0.4);
  k.part('fixed', 'rubber', svg('M -21.6 -8.7 L -22.6 -8.5 Q -23.2 -8.2 -23.2 -7.4 L -23.2 1.1 Q -23.2 2.1 -22.2 2.1 L -21.6 2.1 Z'));
  k.part('metal', 'alu', rrect(-8.2, -9.0, 1.8, 5.0, 0.4));                    // hinge block
  // ---- lower receiver (polymer)
  k.part('furn', 'poly', svg(`M -6.8 -5.6 L 9.8 -5.6 L 9.8 -3.2 Q 9.4 -2.4 9.4 -1.2 L 9.6 0.6 L 3.4 0.6 L 3.2 -1.4
    L -1.4 -1.4 Q -3.6 -1.6 -4.6 -2.6 L -6.8 -3.8 Z`));
  k.screw(-4.6, -3.8, 0.34); k.screw(1.6, -3.6, 0.3);
  triggerGuard(k);
  a2Grip(k);
  // ---- upper receiver: one long aluminium monolith, stepping down at the front
  k.part('metal', 'alu', svg(`M -7.4 -9.2 L 23.6 -9.2 Q 24.4 -9.2 24.4 -8.4 L 24.4 -4.0 Q 24.4 -3.0 23.4 -3.0
    L 10.4 -3.0 L 9.8 -5.2 L -7.0 -5.2 Q -7.6 -5.2 -7.6 -5.8 L -7.6 -8.8 Z`));
  k.detail((g) => { g.fillStyle = 'rgba(6,7,9,0.92)'; g.fillRect(3.0, -7.8, 5.0, 1.8); g.fillStyle = 'rgba(150,156,164,0.3)'; g.fillRect(3.4, -7.3, 3.6, 0.5); });
  k.seam('M 10.6 -5.6 L 23.6 -5.6', 0.18, 0.4);
  for (let i = 0; i < 3; i++) k.slot(12.0 + i * 3.8, -8.0, 2.6, 1.1, 0.5);
  k.rail(11.6, 22.6, -3.4, 0.9);                                                // bottom rail section
  k.rail(-7.2, 24.2, B_RAIL);
  // ---- barrel, gas block under the nose of the upper
  k.part('steel', 'steel', tube(22.0, B_BARREL + 0.6, B_BORE, 1.05));
  k.part('steel', 'steel', rrect(24.0, -7.2, 2.0, 3.4, 0.4));
  // ---- sights, optic, muzzle
  irons(k, 21.0, B_RAIL);
  if (acc.laser) laser(k, 15.0, B_RAIL);
  optic(k, acc.optic === undefined ? 'lpvo' : acc.optic, acc.optic === 'reddot' || acc.optic === 'holo' ? -1.0 : -6.2, B_RAIL);
  k.out.muzzle = { x: muzzle(k, acc.muzzle || 'brake', B_BARREL, B_BORE, 1.05), y: B_BORE };
  k.formLight([-23.2, -18, 45, 8.5]);
}

// 20-round 7.62 magazine: nearly straight. Origin = magPos.
function mk2Mag(k, L) {
  k.part('furn', 'poly', svg(`M -2.9 -2.6 L 2.8 -2.6 L 2.9 0.6 Q 3.2 4.0 4.2 7.4 L 4.4 8.2 L -1.4 8.8 Q -2.2 5.0 -2.8 1.0 Z`), { color: L.mag || L.poly });
  k.part('furn', 'poly', rpoly([[-1.6, 8.4], [4.8, 7.6], [5.0, 8.6], [-1.4, 9.4]], 0.3), { color: L.mag || L.poly });
  k.seam('M -2.4 3.0 Q 0.4 2.8 3.2 2.4', 0.16, 0.4);
}

export const BATTLE = {
  id: 'battle',
  look: { alu: '#7c6a4c', poly: '#6e5e44', steel: '#3a3c40', rubber: '#2a2724' },
  body: mk2Body, mag: mk2Mag,
  rig: {
    gripA: { x: 0, y: 0.6 },
    gripB: { x: 17.6, y: -2.6 },
    muzzle: { x: B_BARREL + 5.8, y: B_BORE },
    eject: { x: 5.4, y: -7.0 },
    magPos: { x: 6.5, y: 0.6 },
    shoulder: { x: -14.6, y: -4.6 },
  },
  mounts: { bore: { x0: 24.4, x1: 45.0, y: B_BORE, r: 1.1 },  barrel: { x: B_BARREL, y: B_BORE, r: 1.05 }, rail: { y: B_RAIL }, panel: { x0: -6.4, x1: 23.6, y0: -5.6, y1: -3.2 } },
};

// =============================================================== LRS-1

const S_BORE = -5.4;
const S_BARREL = 44.2;

function lrsBody(k, L) {
  const acc = L.acc || {};
  // ---- barrel first: the forend wraps its lower half
  k.part('steel', 'steel', tube(8.0, S_BARREL + 0.6, S_BORE, 1.0));
  k.detail((g) => {                                                              // flutes
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.2;
    for (const dy of [-0.35, 0.3]) { g.beginPath(); g.moveTo(17.6, S_BORE + dy); g.lineTo(38.4, S_BORE + dy); g.stroke(); }
  });
  // ---- action: a round receiver with a rail on top
  k.part('metal', 'steel', tube(-6.4, 10.6, -6.2, 2.3, 'round', 'flat'), { color: L.alu });
  k.detail((g) => { g.fillStyle = 'rgba(6,7,9,0.9)'; g.fillRect(1.4, -8.0, 5.0, 1.6); });
  k.rail(-6.0, 10.4, -9.6, 1.0);
  // ---- chassis stock: thumbhole butt, vertical grip, forend
  k.part('furn', 'poly', svg(`M -6.6 -4.4 L -8.8 -8.8 L -20.8 -9.0 Q -23.6 -9.0 -23.8 -7.2 L -24.2 1.0
    Q -24.2 2.4 -22.8 2.4 L -19.6 2.2 Q -17.2 2.0 -16.4 0.2 L -14.6 -1.2 Q -11.4 -2.4 -7.6 -1.2
    Q -6.4 2.8 -6.8 7.0 Q -6.8 8.0 -5.8 8.0 L -2.6 8.0 Q -1.6 8.0 -1.4 7.0 Q -0.8 3.6 0.6 0.6 L 0.8 -1.4
    L 4.6 -1.4 L 4.6 -2.4 L 10.0 -2.4 L 16.0 -2.4 Q 17.4 -2.4 17.4 -3.8 L 17.4 -4.6 Q 17.4 -5.4 16.6 -5.4
    L 9.6 -5.4 L 8.0 -4.4 Z`), { tex: 'stipple' });
  k.detail((g) => {
    g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.moveTo(-14.6, -6.6); g.lineTo(-9.2, -6.6); g.quadraticCurveTo(-8.0, -6.4, -8.6, -4.6);
    g.quadraticCurveTo(-9.6, -3.2, -12.4, -3.2); g.quadraticCurveTo(-15.0, -3.4, -15.2, -5.0); g.quadraticCurveTo(-15.4, -6.4, -14.6, -6.6);
    g.closePath(); g.fill();
  });
  // adjustable cheek piece
  k.part('furn', 'poly', svg('M -21.2 -9.0 L -21.0 -10.2 Q -20.8 -10.6 -20.2 -10.6 L -12.6 -10.6 Q -12.0 -10.6 -11.8 -10.0 L -11.6 -9.0 Z'));
  k.part('fixed', 'rubber', svg('M -23.6 -9.0 L -24.6 -8.8 Q -25.2 -8.4 -25.2 -7.6 L -25.2 1.6 Q -25.2 2.6 -24.2 2.6 L -23.6 2.6 Z'));
  k.seam('M 8.0 -4.4 L 16.8 -4.4', 0.16, 0.35);
  // trigger guard
  k.part('furn', 'poly', svg('M 0.6 -1.6 Q 0.8 1.4 2.6 1.4 L 4.8 1.4 L 4.8 0.4 L 2.8 0.4 Q 1.8 0.4 1.6 -1.6 Z'));
  k.part('steel', 'steel', svg('M 2.2 -1.4 Q 2.9 -0.6 2.5 0.4 L 2.1 0.4 Q 2.3 -0.5 1.8 -1.2 Z'), { line: false });
  // ---- folded bipod under the forend tip
  k.part('steel', 'alu', rrect(15.2, -2.8, 2.4, 1.6, 0.4));
  k.part('steel', 'alu', rpoly([[16.4, -2.4], [27.6, -3.6], [27.8, -2.8], [16.6, -1.4]], 0.3));
  // ---- optic, muzzle
  optic(k, acc.optic === undefined ? 'longscope' : acc.optic, -5.6, -9.6);
  k.out.muzzle = { x: muzzle(k, acc.muzzle || 'brake', S_BARREL, S_BORE, 1.0), y: S_BORE };
  k.formLight([-25.2, -18, 52, 8]);
}

// Bolt: the handle and the bolt's rear shroud, cycled back on every shot.
// Origin = boltPos (the bolt's rear face on the action's centreline).
function lrsBolt(k, L) {
  k.part('steel', 'steel', tube(-1.4, 2.4, 0, 1.3, 'round', 'flat'));
  k.part('steel', 'steel', svg('M 1.6 0.2 L 2.4 0.2 L 1.2 4.0 L 0.2 3.8 Z'), { light: 'cyl' });
  k.part('steel', 'steel', ell(0.6, 4.4, 1.0, 0.9));
}

function lrsMag(k, L) {
  k.part('metal', 'alu', svg('M -2.4 -2.4 L 2.4 -2.4 L 2.6 2.4 L -2.2 2.6 Z'), { color: L.mag || '#33363a' });
  k.part('metal', 'alu', rpoly([[-2.6, 2.2], [2.8, 2.0], [3.0, 3.0], [-2.4, 3.2]], 0.3), { color: L.mag || '#33363a' });
}

export const SNIPER = {
  id: 'sniper',
  look: { alu: '#3d4140', poly: '#4b5a3c', steel: '#323538' },
  body: lrsBody, bolt: lrsBolt, mag: lrsMag,
  rig: {
    gripA: { x: -1.6, y: 1.2 },
    gripB: { x: 13.0, y: -2.0 },
    muzzle: { x: S_BARREL + 5.8, y: S_BORE },
    eject: { x: 3.6, y: -7.6 },
    magPos: { x: 7.2, y: -0.4 },
    boltPos: { x: -5.2, y: -6.2 },
    shoulder: { x: -16.2, y: -4.4 },
  },
  mounts: { bore: { x0: 17.4, x1: 51.0, y: S_BORE, r: 1.0 },  barrel: { x: S_BARREL, y: S_BORE, r: 1.0 }, rail: { y: -9.6 }, panel: { x0: -22.0, x1: 16.0, y0: -8.6, y1: -2.6 } },
};

// =============================================================== M-900

const M_BORE = -5.2;
const M_BARREL = 38.6;

function oxBody(k, L) {
  const acc = L.acc || {};
  // ---- fixed stock
  k.part('furn', 'poly', svg(`M -8.4 -8.2 L -21.8 -7.8 Q -23.6 -7.8 -23.8 -6.4 L -24.0 1.4 Q -24.0 2.4 -22.8 2.4
    L -20.6 2.0 Q -15.6 0.2 -11.6 -2.0 L -8.4 -3.4 Z`), { tex: 'stipple' });
  k.seam('M -22.4 -5.4 Q -16.0 -5.6 -9.6 -6.2', 0.18, 0.4);
  k.part('fixed', 'rubber', svg('M -23.6 -7.9 L -24.6 -7.7 Q -25.2 -7.4 -25.2 -6.6 L -25.2 1.8 Q -25.2 2.8 -24.2 2.8 L -23.6 2.8 Z'));
  // ---- barrel, gas tube under it
  k.part('steel', 'steel', tube(12.0, M_BARREL + 0.6, M_BORE, 1.2));
  k.part('steel', 'steel', tube(13.0, 30.8, -2.8, 0.85));
  k.part('steel', 'steel', rrect(29.6, -4.6, 2.0, 2.8, 0.4));                    // gas block / regulator
  // ---- receiver: stamped box, feed cover on top
  k.part('metal', 'steel', svg(`M -8.8 -8.6 L 14.6 -8.6 Q 15.4 -8.6 15.4 -7.8 L 15.4 -2.4 L -8.8 -2.4 Z`), { color: L.alu });
  k.part('metal', 'steel', svg(`M -4.6 -8.4 L -4.4 -10.4 Q -4.2 -10.8 -3.6 -10.8 L 9.4 -10.8 Q 10.2 -10.8 10.4 -10.0 L 10.6 -8.4 Z`), { color: L.alu });
  k.seam('M -4.4 -8.6 L 10.4 -8.6', 0.2, 0.55);
  k.part('steel', 'steel', rpoly([[-4.4, -10.8], [-4.2, -12.0], [-2.4, -12.0], [-2.2, -10.8]], 0.2));   // rear sight
  k.rail(-1.6, 9.8, -11.8, 0.9);
  k.detail((g) => { g.fillStyle = 'rgba(6,7,9,0.9)'; g.fillRect(6.0, -4.4, 4.6, 1.4); });            // link/case port
  k.screw(-6.6, -4.6, 0.36); k.screw(12.6, -6.6, 0.36);
  // ---- trigger group and grip
  k.part('metal', 'alu', svg('M -4.4 -2.8 L 3.6 -2.8 L 3.6 -1.4 L -4.4 -1.4 Z'));
  triggerGuard(k, 1.0, 3.6);
  a2Grip(k);
  // ---- lower handguard, heat shield, carry handle
  k.part('furn', 'poly', svg('M 14.2 -4.2 L 21.6 -4.2 Q 22.6 -4.2 22.6 -3.2 L 22.4 -1.6 Q 22.2 -0.6 21.2 -0.6 L 15.0 -0.6 Q 14.2 -0.6 14.2 -1.4 Z'), { tex: 'stipple' });
  k.part('metal', 'alu', svg('M 15.0 -6.4 L 27.4 -6.4 Q 28.0 -6.4 28.0 -7.0 L 28.0 -7.6 L 15.0 -7.6 Z'));
  k.part('metal', 'alu', svg(`M 17.4 -6.8 L 17.8 -11.4 Q 18.0 -12.4 19.0 -12.4 L 22.4 -12.4 Q 23.4 -12.4 23.6 -11.4
    L 24.0 -6.8 L 22.8 -6.8 L 22.6 -10.8 Q 22.4 -11.2 22.0 -11.2 L 19.4 -11.2 Q 19.0 -11.2 19.0 -10.8 L 18.8 -6.8 Z`));
  // folded bipod
  k.part('steel', 'alu', rrect(30.6, -4.0, 1.8, 2.2, 0.4));
  k.part('steel', 'alu', rpoly([[31.4, -2.6], [38.6, -3.4], [38.8, -2.6], [31.6, -1.6]], 0.3));
  k.part('steel', 'steel', rpoly([[36.0, -6.4], [36.2, -8.2], [37.2, -8.2], [37.4, -6.4]], 0.2));    // front sight
  if (acc.optic) optic(k, acc.optic, -1.0, -11.8);
  k.out.muzzle = { x: muzzle(k, acc.muzzle || 'a2', M_BARREL, M_BORE, 1.2), y: M_BORE };
  k.formLight([-25.2, -15, 44, 8.5]);
}

// Ammunition box: a hard plastic 200-round box with a belt window and a
// carry strap; seated up into the feed. Origin = magPos.
function oxBox(k, L) {
  k.part('furn', 'poly', svg(`M -3.6 -1.4 L 4.4 -1.4 Q 5.4 -1.4 5.4 -0.4 L 5.4 8.6 Q 5.4 9.8 4.2 9.8 L -3.4 9.8
    Q -4.6 9.8 -4.6 8.6 L -4.6 -0.4 Q -4.6 -1.4 -3.6 -1.4 Z`), { color: L.box || '#4a5038' });
  k.seam('M -4.4 1.0 L 5.2 1.0', 0.2, 0.45);
  k.part('fixed', 'brass', rrect(-2.6, 2.2, 5.6, 1.6, 0.4));
  k.detail((g) => {
    g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.2;
    for (let x = -2.0; x < 3.0; x += 1.0) { g.beginPath(); g.moveTo(x, 2.2); g.lineTo(x, 3.8); g.stroke(); }
  });
  k.part('furn', 'poly', rrect(-3.6, 6.0, 8.0, 1.2, 0.5), { color: L.strap || '#2e3226' });
}

export const LMG = {
  id: 'lmg',
  look: { alu: '#3a3d40', poly: '#353833', steel: '#323538' },
  body: oxBody, mag: oxBox,
  rig: {
    gripA: { x: 0, y: 0.6 },
    gripB: { x: 18.2, y: -1.0 },
    muzzle: { x: M_BARREL + 4.0, y: M_BORE },
    eject: { x: 8.0, y: -3.4 },
    magPos: { x: 8.6, y: -1.4 },
    shoulder: { x: -16.2, y: -3.6 },
  },
  mounts: { bore: { x0: 22.6, x1: 43.0, y: M_BORE, r: 1.2 },  barrel: { x: M_BARREL, y: M_BORE, r: 1.2 }, rail: { y: -11.8 }, panel: { x0: -8.6, x1: 15.2, y0: -8.4, y1: -2.6 } },
};
