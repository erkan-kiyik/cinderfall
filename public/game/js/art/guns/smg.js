// Submachine guns: the P-12 "WASP" (roller-delayed 9mm on the MP5 pattern:
// retractable strut stock, cocking tube over the barrel, hooded front sight,
// steep-curve magazine) and the LASER SMG (a bullpup on the P90 pattern —
// thumbhole butt, front finger loop — around a sealed emitter).
//
// Weapon space: origin = trigger-hand grip point, +x toward the muzzle.

import { svg, rpoly, rrect, ell, tube } from '../gunkit.js';
import { optic, muzzle, laser } from './acc.js';

// ------------------------------------------------------------------- P-12

const BORE = -5.0;

function p12Body(k, L) {
  const acc = L.acc || {};
  // ---- retractable stock: two struts and a curved butt plate
  k.part('steel', 'steel', tube(-15.6, -5.0, -7.2, 0.5), { light: 'cyl' });
  k.part('steel', 'steel', svg('M -15.6 -2.6 L -6.0 -4.4 L -5.8 -3.4 L -15.4 -1.6 Z'), { light: 'cyl' });
  k.part('fixed', 'rubber', svg('M -15.2 -8.6 Q -16.8 -8.4 -16.9 -6.0 L -16.9 -1.4 Q -16.8 0.8 -15.2 1.0 L -14.6 1.0 L -14.6 -8.6 Z'));
  k.part('steel', 'steel', rrect(-15.0, -8.2, 1.2, 8.8, 0.4));
  // ---- receiver: stamped steel tube, rounded top, cocking tube forward
  k.part('metal', 'steel', svg(`M -6.4 -8.8 Q -6.4 -9.4 -5.6 -9.4 L 8.2 -9.4 Q 9.0 -9.4 9.2 -8.6 L 9.2 -3.4
    L -6.4 -3.4 Z`), { color: L.alu, light: 'cyl' });
  k.part('metal', 'steel', tube(8.0, 17.4, -7.7, 1.15), { color: L.alu });       // cocking tube
  k.seam('M -6.2 -5.2 L 9.0 -5.2', 0.18, 0.4);                                   // receiver weld seam
  // ejection port
  k.detail((g) => { g.fillStyle = 'rgba(6,7,9,0.92)'; g.fillRect(3.8, -7.4, 3.4, 1.6); g.fillStyle = 'rgba(150,156,164,0.3)'; g.fillRect(4.0, -7.0, 2.4, 0.5); });
  // magwell
  k.part('metal', 'steel', svg('M 2.8 -3.8 L 7.6 -3.8 L 7.4 -0.4 L 3.0 -0.4 Z'), { color: L.alu });
  // ---- trigger group: polymer lower with the pistol grip and guard moulded in
  k.part('furn', 'poly', svg(`M -5.0 -3.8 L 2.8 -3.8 L 2.8 -1.6 Q 2.0 -1.4 1.6 -0.6 L 4.4 -0.6 Q 5.0 -0.6 5.0 0.0
    L 5.0 0.8 Q 5.0 1.6 4.2 1.6 L 1.0 1.6 Q 0.6 3.4 -0.2 5.0 Q -0.6 6.4 -0.8 7.2 Q -1.0 7.8 -1.8 7.8 L -4.0 7.8
    Q -5.0 7.8 -4.8 6.8 Q -4.0 3.4 -3.6 0.6 Q -3.4 -0.6 -4.2 -1.6 L -5.0 -2.4 Z`), { tex: 'stipple' });
  k.detail((g) => {                                                              // guard opening
    g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.moveTo(1.8, -0.2); g.lineTo(4.4, -0.2); g.lineTo(4.4, 0.9); g.lineTo(1.6, 0.9); g.closePath(); g.fill();
  });
  k.part('steel', 'steel', svg('M 2.2 -1.4 Q 2.9 -0.6 2.5 0.6 L 2.1 0.6 Q 2.3 -0.5 1.8 -1.2 Z'), { line: false });
  k.part('steel', 'steel', ell(-2.6, -2.6, 0.7, 0.7));                           // selector
  k.screw(-4.4, -2.8, 0.32);
  // ---- handguard: slim, under the cocking tube
  k.part('furn', 'poly', svg(`M 8.6 -6.4 L 15.4 -6.4 Q 16.6 -6.4 16.6 -5.0 L 16.6 -3.4 Q 16.6 -2.0 15.2 -2.0
    L 9.6 -2.0 Q 8.6 -2.0 8.6 -3.0 Z`), { tex: 'stipple' });
  // ---- barrel, three-lug muzzle
  k.part('steel', 'steel', tube(15.0, 20.4, BORE, 0.75));
  k.part('steel', 'steel', tube(19.8, 21.4, BORE, 1.0));
  // ---- sights: rear drum, hooded front post
  k.part('steel', 'steel', svg('M -5.6 -8.8 L -5.2 -10.6 Q -4.4 -11.2 -3.6 -10.6 L -3.0 -8.8 Z'), { color: L.alu });
  k.part('steel', 'steel', svg(`M 15.6 -8.4 L 15.8 -10.4 Q 16.0 -11.4 17.0 -11.4 Q 18.0 -11.4 18.2 -10.4 L 18.4 -8.4
    L 18.4 -6.6 L 15.6 -6.6 Z`), { color: L.alu });
  k.detail((g) => { g.fillStyle = 'rgba(0,0,0,0.75)'; g.beginPath(); g.ellipse(17.0, -9.6, 0.7, 0.9, 0, 0, Math.PI * 2); g.fill(); });
  // optional claw-mount rail over the receiver
  if (acc.optic) {
    k.part('metal', 'alu', svg('M -3.6 -9.0 L -3.4 -10.6 L 5.6 -10.6 L 5.8 -9.0 Z'));
    k.rail(-3.4, 5.6, -11.6, 1.0);
    optic(k, acc.optic, -2.6, -11.6);
  }
  if (acc.laser) laser(k, 9.4, -2.0 + 3.6);
  k.out.muzzle = { x: acc.muzzle ? muzzle(k, acc.muzzle, 21.0, BORE, 0.75) : 21.4, y: BORE };
  k.formLight([-17, -11.4, 21.4, 7.8]);
}

// Steel 30-round magazine with the MP5's steep curve. Origin = magPos.
function p12Mag(k, L) {
  k.part('metal', 'steel', svg(`M -2.2 -2.6 L 2.2 -2.6 L 2.2 0.4 Q 3.0 4.6 5.8 8.6 L 6.0 9.4 L 1.6 10.2
    Q -0.8 5.6 -2.0 0.8 Z`), { color: L.mag || '#3d4045' });
  k.part('metal', 'steel', rpoly([[1.2, 9.8], [6.4, 9.0], [6.6, 9.8], [1.4, 10.8]], 0.3), { color: L.mag || '#3d4045' });
  k.seam('M -1.4 2.6 Q 1.0 2.4 3.2 2.0', 0.16, 0.4);
  k.seam('M -0.2 6.0 Q 2.0 5.6 4.8 5.0', 0.16, 0.4);
}

export const SMG = {
  id: 'smg',
  look: { alu: '#3c3f44', poly: '#2e3033', steel: '#33363a' },
  body: p12Body, mag: p12Mag,
  rig: {
    gripA: { x: 0, y: 0.4 },
    gripB: { x: 12.4, y: -2.8 },
    muzzle: { x: 21.4, y: BORE },
    eject: { x: 5.4, y: -6.6 },
    magPos: { x: 5.2, y: -0.6 },
    shoulder: { x: -8.4, y: -4.0 },
  },
  mounts: { bore: { x0: 15.0, x1: 22.4, y: BORE, r: 1.0 },  barrel: { x: 21.0, y: BORE, r: 0.75 }, panel: { x0: -6.2, x1: 9.0, y0: -9.2, y1: -3.6 } },
};

// -------------------------------------------------------------- LASER SMG

const LBORE = -4.6;

function laserBody(k, L) {
  // ---- one-piece polymer shell: thumbhole butt, grip, front finger loop
  k.part('furn', 'poly', svg(`M -11.6 -7.4 Q -13.4 -7.2 -13.4 -4.6 L -13.2 -0.8 Q -13.0 1.4 -10.8 1.8
    L -5.6 3.0 Q -3.2 3.6 -2.4 5.6 Q -1.6 7.6 0.4 7.4 L 6.8 6.6 Q 9.2 6.2 9.6 4.0 L 10.4 -1.8
    L 10.6 -6.6 Q 10.6 -7.4 9.8 -7.4 Z`), { tex: 'stipple' });
  k.detail((g) => {
    g.globalCompositeOperation = 'destination-out';
    // thumbhole behind the grip
    g.beginPath(); g.ellipse(-7.2, -0.2, 2.5, 1.9, -0.25, 0, Math.PI * 2); g.fill();
    // finger opening in front of it, trigger at its rear: a teardrop, not a box
    g.beginPath(); g.moveTo(1.4, -1.8); g.lineTo(6.0, -1.8); g.quadraticCurveTo(8.0, -1.8, 7.8, 0.4);
    g.quadraticCurveTo(7.4, 3.4, 5.4, 4.6); g.quadraticCurveTo(3.6, 5.4, 2.2, 4.6); g.quadraticCurveTo(1.0, 3.8, 1.2, 1.6);
    g.closePath(); g.fill();
  });
  k.part('steel', 'steel', svg('M 2.0 -1.6 Q 2.8 -0.6 2.4 0.8 L 2.0 0.8 Q 2.2 -0.4 1.6 -1.4 Z'), { line: false });
  k.seam('M -12.6 -2.6 Q -4 -2.2 10.4 -2.8', 0.18, 0.35);
  // ---- charge cell lying along the top, under a smoked cover
  k.part('metal', 'alu', svg('M -10.6 -7.2 L -10.2 -9.6 L 8.0 -9.6 Q 9.2 -9.6 9.4 -8.6 L 9.6 -7.2 Z'));
  k.part('emit', 'emit', rrect(-8.8, -9.0, 14.6, 1.2, 0.5), { spill: 0.5 });
  k.detail((g) => {
    g.fillStyle = 'rgba(20,24,30,0.45)';
    g.fillRect(-8.8, -9.0, 14.6, 1.2);
    g.fillStyle = 'rgba(0,0,0,0.5)';
    for (let x = -7.4; x < 5.8; x += 1.6) g.fillRect(x, -9.0, 0.25, 1.2);
  });
  // ---- ring sight housing
  k.part('steel', 'alu', svg('M 2.6 -9.4 L 3.2 -11.6 Q 3.6 -12.2 4.4 -12.2 L 7.6 -12.2 Q 8.4 -12.0 8.6 -11.2 L 8.8 -9.4 Z'));
  k.part('fixed', 'glass', rrect(7.9, -11.6, 0.6, 2.0, 0.25));
  // ---- emitter: a finned shroud and a recessed lens
  k.part('steel', 'steel', tube(9.6, 16.4, LBORE, 1.25));
  for (let i = 0; i < 3; i++) k.part('steel', 'alu', tube(11.0 + i * 1.6, 11.8 + i * 1.6, LBORE, 1.7), { light: 'cyl' });
  k.part('steel', 'steel', tube(15.8, 17.6, LBORE, 1.45));
  k.part('emit', 'emit', ell(17.6, LBORE, 0.35, 1.0), { spill: 0.9 });
  k.out.muzzle = { x: 17.8, y: LBORE };
  k.formLight([-13, -12.2, 17.8, 7.6]);
}

export const LASERSMG = {
  id: 'lasersmg',
  look: { poly: '#3a2a30', alu: '#4a3a40', steel: '#3a3c42', core: [255, 70, 90] },
  body: laserBody,
  rig: {
    gripA: { x: 0, y: 0.4 },
    gripB: { x: 8.8, y: 2.6 },
    muzzle: { x: 17.8, y: LBORE },
    eject: null,
    shoulder: { x: -5.2, y: -3.8 },
  },
  mounts: { bore: { x0: 9.6, x1: 18.0, y: LBORE, r: 1.7 },  panel: { x0: -12.4, x1: 10.2, y0: -7.2, y1: -2.8 } },
};
