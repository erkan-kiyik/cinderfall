// VK-77 "VANDAL" — 5.56 carbine on the AR pattern: collapsible stock on a
// buffer tube, flat-top upper with a free-float M-LOK handguard, curved
// 30-round magazine, birdcage flash hider. Right side faces the viewer, so
// the ejection port and forward assist are the side we draw.
//
// Weapon space: origin = trigger-hand grip point, +x toward the muzzle,
// bore line at y = -5.4.

import { svg, rpoly, rrect, ell, tube } from '../gunkit.js';
import { optic, muzzle, laser, irons } from './acc.js';

const BORE = -5.4;
const RAIL_Y = -9.9;          // rail top, receiver and handguard alike
const BARREL_END = 37.0;

function body(k, L) {
  const acc = L.acc || {};
  // ---- buffer tube (under the stock, visible ahead of it)
  k.part('steel', 'alu', tube(-13.5, -4.8, BORE - 0.2, 1.25), { light: 'cyl' });
  k.part('steel', 'alu', tube(-6.6, -5.0, BORE - 0.2, 1.55));                     // castle nut
  // ---- stock: SOPMOD-style shell around the tube
  k.part('furn', 'poly', svg(`M -9.0 -7.5 L -17.6 -8.1 Q -20.8 -8.4 -21.1 -6.8 L -21.4 0.4 Q -21.4 1.6 -20.3 1.4
    L -18.2 0.6 Q -15.6 -0.6 -14.0 -2.4 Q -12.6 -3.6 -10.8 -3.7 L -9.2 -3.7 Q -8.4 -3.8 -8.4 -4.8 L -8.4 -6.8 Q -8.4 -7.5 -9.0 -7.5 Z`),
    { tex: 'stipple' });
  k.seam('M -18.6 -7.2 Q -14.6 -6.9 -10.4 -6.6', 0.18, 0.4);
  k.part('furn', 'poly', rrect(-18.2, -6.6, 6.8, 3.4, 1.4), { bevel: 'soft' });   // battery tube side
  k.part('fixed', 'rubber', svg('M -21.0 -8.6 L -22.1 -8.4 Q -22.6 -8.2 -22.6 -7.4 L -22.6 0.9 Q -22.6 1.9 -21.6 1.9 L -21.0 1.9 Z'),
    { light: 'soft' });
  k.part('furn', 'poly', rpoly([[-11.2, -3.6], [-10.0, -3.6], [-10.2, -1.6], [-11.4, -1.9]], 0.3));  // adjust lever

  // ---- lower receiver
  k.part('metal', 'alu', svg(`M -6.0 -5.2 L 10.0 -5.2 L 10.0 -3.2 Q 9.6 -2.2 9.6 -1.0 L 9.8 1.1 L 3.2 1.1 L 3.0 -1.4
    L -1.4 -1.4 Q -3.6 -1.6 -4.6 -2.6 L -6.0 -3.6 Z`));
  k.seam('M 3.4 -1.2 L 3.4 0.9', 0.16, 0.35);                                   // magwell rear edge
  k.screw(-4.4, -3.6, 0.36); k.screw(1.4, -3.5, 0.32);                           // takedown / hammer pins
  // magazine release button
  k.part('steel', 'steel', ell(2.4, -2.6, 0.55, 0.5));
  // ---- trigger guard and trigger
  k.part('metal', 'alu', svg('M 1.0 -1.6 L 1.6 -1.6 Q 2.0 0.4 3.4 0.4 L 3.4 1.2 Q 1.4 1.4 0.8 -0.4 Z'));
  k.part('steel', 'steel', svg('M 1.9 -1.5 Q 2.5 -0.6 2.1 0.4 L 1.8 0.4 Q 2.0 -0.5 1.6 -1.4 Z'), { line: false });
  // ---- pistol grip (MOE-style: finger groove, beaver tail)
  k.part('furn', 'poly', svg(`M -2.8 -1.8 Q -3.4 -1.6 -3.2 -0.8 Q -3.6 3.0 -4.8 7.0 Q -5.0 8.4 -3.6 8.5 L -2.0 8.5
    Q -1.0 8.4 -0.8 7.4 Q -0.6 5.8 0.0 4.6 Q 0.6 3.6 0.6 2.4 Q 0.9 0.2 1.6 -1.0 L 1.6 -1.8 Z`), { tex: 'stipple' });
  k.seam('M -2.4 6.2 L -0.6 6.4', 0.16, 0.35);

  // ---- upper receiver
  k.part('metal', 'alu', svg(`M -6.2 -8.7 L 10.6 -8.7 L 10.6 -5.0 L -6.0 -5.0 Q -6.6 -5.0 -6.6 -5.6 L -6.6 -8.2 Q -6.6 -8.7 -6.2 -8.7 Z`));
  // charging handle latch at the rear
  k.part('steel', 'alu', rpoly([[-7.6, -8.6], [-6.0, -8.6], [-6.0, -7.4], [-7.4, -7.6]], 0.3));
  // ejection port with its dust cover hinged open below it, brass deflector
  k.detail((g) => {
    g.fillStyle = 'rgba(6,7,9,0.92)';
    g.beginPath(); g.roundRect ? g.roundRect(2.6, -7.5, 5.0, 1.9, 0.3) : g.rect(2.6, -7.5, 5.0, 1.9); g.fill();
    g.fillStyle = 'rgba(150,156,164,0.35)'; g.fillRect(3.0, -7.0, 3.8, 0.5);  // bolt face inside
  });
  k.part('metal', 'alu', rpoly([[2.4, -5.4], [7.8, -5.4], [7.6, -4.6], [2.6, -4.6]], 0.2), { bevel: 'soft' });
  k.part('metal', 'alu', rpoly([[0.6, -8.4], [2.2, -8.4], [2.4, -6.4], [1.2, -6.2]], 0.4));   // brass deflector
  k.part('steel', 'alu', tube(8.2, 10.8, -7.2, 0.95, 'round', 'flat'));                       // forward assist
  k.seam('M -6.4 -5.0 L 10.4 -5.0', 0.18, 0.5);
  // receiver rail
  k.rail(-6.2, 10.4, RAIL_Y);

  // ---- barrel (runs back under the handguard into the receiver)
  k.part('steel', 'steel', tube(8.0, BARREL_END + 0.6, BORE, 0.95));
  // ---- handguard: free-float M-LOK, rail on top, rounded belly
  k.part('metal', 'alu', svg(`M 10.2 -8.7 L 27.2 -8.7 Q 28.0 -8.7 28.0 -7.9 L 28.0 -4.2 Q 28.0 -2.4 26.4 -2.4
    L 11.8 -2.4 Q 10.2 -2.4 10.2 -4.2 Z`));
  for (let i = 0; i < 4; i++) k.slot(12.4 + i * 3.7, -6.6, 2.6, 1.15, 0.5);
  k.slot(12.8, -4.0, 13.0, 0.5, 0.25);                                          // lower vent line
  k.part('metal', 'alu', rpoly([[10.2, -8.7], [11.2, -8.7], [11.2, -2.6], [10.2, -2.6]], 0.2), { bevel: 'soft' }); // barrel nut ring
  k.rail(10.4, 27.6, RAIL_Y);
  // hand stop under the front of the handguard
  k.part('furn', 'poly', rpoly([[22.8, -2.8], [25.8, -2.8], [25.0, -0.8], [23.4, -0.9]], 0.4));

  // ---- sights / optic
  irons(k, 24.2, RAIL_Y);                                                       // folded front BUIS
  if (acc.laser) laser(k, 17.2, RAIL_Y);
  optic(k, acc.optic === undefined ? 'reddot' : acc.optic, acc.optic === 'lpvo' ? -4.6 : -1.0, RAIL_Y);
  if (acc.optic !== 'lpvo' && acc.optic !== 'acog') irons(k, -5.6, RAIL_Y);    // folded rear BUIS

  // ---- muzzle
  k.out.muzzle = { x: muzzle(k, acc.muzzle || 'a2', BARREL_END, BORE, 0.95), y: BORE };

  k.formLight([-23, -16, 52, 9]);
}

// STANAG magazine, drawn in its own space: origin = magPos. The top runs up
// into the magwell (it is drawn behind the receiver), so it is seated by
// more than a unit of overlap, never butted.
function mag(k, L) {
  k.part('metal', 'alu', svg(`M -2.9 -2.4 L 2.8 -2.4 L 2.9 0.8 Q 3.6 4.8 5.6 8.6 L 5.8 9.4 L 0.2 10.2
    Q -1.6 6.0 -2.8 1.2 Z`), { color: L.mag || L.alu });
  k.part('metal', 'alu', rpoly([[-0.2, 9.8], [6.1, 8.9], [6.4, 9.8], [0.0, 10.8]], 0.3), { color: L.mag || L.alu }); // floorplate
  k.seam('M -2.4 3.2 Q 0.6 3.0 3.6 2.6', 0.18, 0.4);
  k.seam('M -1.2 6.4 Q 1.6 6.0 4.6 5.4', 0.18, 0.4);
  k.formLight([-3, -2.4, 6.4, 10.8]);
}

export const RIFLE = {
  id: 'rifle',
  look: { alu: '#3b3e43', poly: '#303235', steel: '#35383c' },
  body, mag,
  rig: {
    gripA: { x: 0, y: 0.6 },
    gripB: { x: 18.6, y: -3.6 },
    muzzle: { x: BARREL_END + 4.0, y: BORE },
    eject: { x: 5.2, y: -6.6 },
    magPos: { x: 6.4, y: 0.6 },
    shoulder: { x: -14.0, y: -4.4 },
  },
  mounts: { bore: { x0: 27.6, x1: 41.6, y: BORE, r: 1.3 }, 
    barrel: { x: BARREL_END, y: BORE, r: 0.95 },
    rail: { y: RAIL_Y },
    panel: { x0: -6.0, x1: 10.0, y0: -5.0, y1: -1.4 },
  },
};
