// Heavy weapons: the ANNIHILATOR (six-barrel rotary gun, carried at the hip
// on a trigger grip and a front handle, fed from an ammunition can), the
// SIEGEBREAKER (shoulder-fired rocket launcher on the RPG pattern: steel tube,
// wooden heat guards, optical sight, rocket loaded in the muzzle) and the
// FLAME THROWER (a handheld unit with its fuel tank slung under the wand).
//
// Weapon space: origin = trigger-hand grip point, +x toward the muzzle.

import { svg, rpoly, rrect, ell, tube } from '../gunkit.js';
import { optic } from './acc.js';

// ============================================================ ANNIHILATOR

const G_CY = -2.4;          // barrel-cluster centreline
const G_END = 40.0;

function minigunBody(k, L) {
  // ---- feed chute from the receiver down to the ammunition can
  k.part('furn', 'rubber', svg(`M -1.4 1.4 Q -2.0 4.2 -5.2 4.8 L -7.6 5.2 L -7.8 3.2 L -5.6 2.8 Q -3.6 2.4 -3.4 1.0 Z`),
    { color: L.chute || '#2c2e2a', light: 'soft' });
  k.detail((g) => {
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.18;
    for (let i = 0; i < 5; i++) { const t = i / 4; const x = -1.8 - t * 5.4, y = 1.8 + t * 2.6; g.beginPath(); g.moveTo(x, y - 0.9); g.lineTo(x + 0.4, y + 0.9); g.stroke(); }
  });
  // ---- barrels: three of the six are on this side
  for (const dy of [-2.0, 0, 2.0]) k.part('steel', 'steel', tube(8.0, G_END, G_CY + dy, 0.72));
  k.detail((g) => { g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(8.0, G_CY - 1.2, G_END - 8.0, 0.35); g.fillRect(8.0, G_CY + 0.85, G_END - 8.0, 0.35); });
  // clamps: rear rotor collar, mid band, front clamp
  k.part('metal', 'alu', tube(7.0, 10.6, G_CY, 3.5), { light: 'cyl' });
  k.part('steel', 'steel', tube(20.4, 21.8, G_CY, 3.0));
  k.part('steel', 'steel', tube(36.2, 38.2, G_CY, 3.1));
  // ---- receiver / gearbox and motor housing
  k.part('metal', 'alu', svg(`M -4.0 -6.8 L 7.6 -6.8 Q 8.6 -6.8 8.6 -5.8 L 8.6 1.4 Q 8.6 2.4 7.6 2.4 L -3.4 2.4
    Q -4.4 2.4 -4.4 1.4 L -4.4 -6.4 Z`));
  k.part('metal', 'alu', tube(-13.0, -3.4, G_CY, 4.1, 'round', 'flat'), { light: 'cyl' });
  k.part('steel', 'steel', tube(-14.4, -12.2, G_CY, 2.8, 'round', 'flat'));            // motor end cap
  for (let i = 0; i < 4; i++) k.slot(-11.0 + i * 1.8, G_CY - 2.6, 0.9, 5.2, 0.4);     // cooling slots
  k.screw(-1.6, -5.2, 0.4); k.screw(6.4, -5.2, 0.4); k.screw(6.4, 0.8, 0.4);
  k.detail((g) => { g.fillStyle = 'rgba(6,7,9,0.9)'; g.fillRect(4.0, 1.4, 4.0, 1.0); });  // case ejection slot
  // ---- carry handle
  k.part('metal', 'alu', svg(`M -6.2 -6.2 L -5.8 -10.6 Q -5.6 -11.8 -4.4 -11.8 L 4.4 -11.8 Q 5.6 -11.8 5.8 -10.6
    L 6.2 -6.4 L 4.8 -6.4 L 4.6 -10.0 Q 4.4 -10.4 4.0 -10.4 L -4.0 -10.4 Q -4.4 -10.4 -4.6 -10.0 L -4.8 -6.2 Z`));
  // ---- trigger grip under the receiver, front handle under the barrels
  k.part('furn', 'poly', svg(`M -2.2 2.0 L 2.4 2.0 Q 2.2 4.8 1.2 7.8 Q 0.8 9.6 -0.6 9.6 L -2.4 9.6 Q -3.6 9.6 -3.4 8.4
    Q -2.6 5.6 -2.2 2.0 Z`), { tex: 'stipple' });
  k.part('metal', 'alu', svg('M 2.2 1.8 Q 4.6 4.4 6.4 2.2 L 6.8 2.2 Q 4.8 5.6 2.0 3.4 Z'));                  // guard
  k.part('steel', 'alu', rrect(12.6, 0.4, 5.6, 2.2, 0.6));                                                   // handle mount
  k.part('furn', 'poly', svg(`M 13.6 2.2 L 17.2 2.2 Q 17.4 6.0 17.0 9.4 Q 16.8 10.2 16.0 10.2 L 14.6 10.2
    Q 13.8 10.2 13.8 9.4 Q 13.4 6.0 13.6 2.2 Z`), { tex: 'stipple' });
  k.out.muzzle = { x: G_END + 0.4, y: G_CY };
  k.formLight([-14.4, -11.8, G_END, 10.2]);
}

// Ammunition can, hung behind the trigger grip. Origin = magPos.
function minigunCan(k, L) {
  k.part('metal', 'paint', svg('M -4.6 -1.4 L 3.6 -1.4 Q 4.4 -1.4 4.4 -0.6 L 4.4 7.4 Q 4.4 8.2 3.6 8.2 L -4.6 8.2 Q -5.4 8.2 -5.4 7.4 L -5.4 -0.6 Q -5.4 -1.4 -4.6 -1.4 Z'),
    { color: L.can || '#4a5238' });
  k.part('metal', 'paint', rrect(-5.6, -1.8, 10.2, 1.4, 0.4), { color: L.can || '#4a5238' });   // lid
  k.part('steel', 'steel', rrect(-1.6, -2.6, 2.6, 1.0, 0.4));                                      // latch
  k.seam('M -4.8 2.6 L 3.8 2.6', 0.2, 0.4);
  k.detail((g) => { g.fillStyle = 'rgba(230,220,160,0.55)'; g.fillRect(-3.8, 4.0, 5.4, 0.7); });  // stencil band
}

export const MINIGUN = {
  id: 'minigun',
  look: { alu: '#41444a', steel: '#383b40', poly: '#2e3033', paint: '#4a5238' },
  body: minigunBody, mag: minigunCan,
  rig: {
    gripA: { x: 0, y: 4.8 },
    gripB: { x: 15.4, y: 6.0 },
    muzzle: { x: G_END + 0.4, y: G_CY },
    eject: { x: 6.0, y: 2.6 },
    magPos: { x: -9.2, y: 4.6 },
    shoulder: { x: -3.0, y: -4.0 },
    pivot: { x: 1.0, y: 9.0 },
  },
  mounts: { bore: { x0: 10.6, x1: 40.6, y: G_CY, r: 2.6 },  panel: { x0: -4.2, x1: 8.4, y0: -6.6, y1: 2.2 } },
};

// ============================================================ SIEGEBREAKER

const TC = -6.2;            // tube centreline
const T0 = -26.0, T1 = 30.0;

function rocketBody(k, L) {
  // ---- rocket in the muzzle: motor stem, warhead, fuze
  k.part('steel', 'paint', tube(T1 - 1.6, 35.6, TC, 1.6), { color: L.motor || '#59604a', light: 'cyl' });
  k.part('steel', 'paint', svg(`M 35.0 ${TC - 1.6} L 37.4 ${TC - 3.4} Q 39.6 ${TC - 4.4} 41.6 ${TC - 3.8}
    Q 45.4 ${TC - 2.8} 47.6 ${TC - 1.0} L 47.6 ${TC + 1.0} Q 45.4 ${TC + 2.8} 41.6 ${TC + 3.8}
    Q 39.6 ${TC + 4.4} 37.4 ${TC + 3.4} L 35.0 ${TC + 1.6} Z`), { color: L.warhead || '#5c6448', light: 'cyl' });
  k.part('steel', 'steel', tube(47.2, 49.6, TC, 0.75));
  k.part('steel', 'steel', tube(49.2, 50.6, TC, 0.5, 'flat', 'round'));
  k.detail((g) => { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(38.8, TC - 4.2, 0.5, 8.4); g.fillStyle = 'rgba(220,200,90,0.4)'; g.fillRect(40.0, TC - 4.0, 0.7, 8.0); });
  // ---- launch tube and rear venturi
  k.part('metal', 'paint', tube(T0, T1, TC, 2.2), { color: L.alu, light: 'cyl' });
  k.part('metal', 'paint', svg(`M ${T0 + 0.6} ${TC - 2.2} L ${T0 - 6.4} ${TC - 3.9} Q ${T0 - 7.4} ${TC - 4.0} ${T0 - 7.4} ${TC - 3.0}
    L ${T0 - 7.4} ${TC + 3.0} Q ${T0 - 7.4} ${TC + 4.0} ${T0 - 6.4} ${TC + 3.9} L ${T0 + 0.6} ${TC + 2.2} Z`), { color: L.alu, light: 'cyl' });
  k.part('steel', 'steel', tube(T0 - 7.8, T0 - 6.6, TC, 4.1));
  // ---- wooden heat guards with steel bands
  for (const [a, b] of [[-15.0, -3.4], [3.6, 15.4]]) {
    k.part('furn', 'wood', tube(a, b, TC, 3.0), { light: 'cyl' });
    k.part('steel', 'steel', tube(a - 0.4, a + 0.6, TC, 3.2));
    k.part('steel', 'steel', tube(b - 0.6, b + 0.4, TC, 3.2));
  }
  // ---- grip, guard, trigger
  k.part('metal', 'paint', rrect(-2.6, TC + 1.6, 5.4, 2.0, 0.4), { color: L.alu });
  k.part('furn', 'wood', svg(`M -2.4 -2.8 L 1.8 -2.8 Q 1.4 0.4 0.6 3.6 Q 0.2 5.4 -1.2 5.4 L -2.8 5.4 Q -4.0 5.4 -3.8 4.2
    Q -3.0 0.8 -2.4 -2.8 Z`), { color: L.grip || L.wood });
  k.part('metal', 'paint', svg('M 1.6 -2.4 Q 3.8 -2.2 4.2 0.0 Q 4.2 1.4 3.0 1.4 L 1.2 1.4 L 1.2 0.4 L 2.8 0.4 Q 3.2 0.2 3.0 -0.4 Q 2.6 -1.4 1.6 -1.4 Z'), { color: L.alu });
  k.part('steel', 'steel', svg('M 2.0 -2.4 Q 2.6 -1.2 2.0 0.2 L 1.6 0.2 Q 2.0 -1.0 1.6 -2.2 Z'), { line: false });
  // ---- optical sight on its bracket, folded iron sights
  k.part('metal', 'paint', rpoly([[-1.8, TC - 1.4], [-1.4, TC - 5.8], [4.0, TC - 5.8], [4.6, TC - 1.4]], 0.3), { color: L.alu });
  k.part('steel', 'paint', svg(`M -3.4 ${TC - 5.0} L 6.8 ${TC - 5.0} Q 7.6 ${TC - 5.0} 7.6 ${TC - 5.8} L 7.6 ${TC - 8.2}
    Q 7.6 ${TC - 9.0} 6.8 ${TC - 9.0} L -3.4 ${TC - 9.0} Q -4.2 ${TC - 9.0} -4.2 ${TC - 8.2} L -4.2 ${TC - 5.8} Q -4.2 ${TC - 5.0} -3.4 ${TC - 5.0} Z`),
    { color: L.sight || '#3c4234' });
  k.part('fixed', 'rubber', rrect(-6.0, TC - 8.6, 2.2, 3.2, 0.8));
  k.part('fixed', 'glass', rrect(7.4, TC - 8.4, 0.6, 2.8, 0.25));
  k.part('steel', 'steel', rrect(1.0, TC - 10.0, 1.8, 1.2, 0.3));
  k.part('steel', 'steel', rpoly([[17.4, TC - 2.0], [17.6, TC - 3.8], [18.6, TC - 3.8], [18.8, TC - 2.0]], 0.2));
  k.out.muzzle = { x: 50.6, y: TC };
  k.formLight([T0 - 8, TC - 10, 50.6, 5.4]);
}

export const ROCKET = {
  id: 'rocket',
  look: { alu: '#4b5341', wood: '#7a4f2c', steel: '#3a3d40', paint: '#4b5341' },
  body: rocketBody,
  rig: {
    gripA: { x: 0, y: 0.4 },
    gripB: { x: 10.2, y: TC + 2.6 },
    muzzle: { x: 50.6, y: TC },
    eject: null,
    shoulder: { x: -9.0, y: TC + 0.6 },
    pivot: { x: 0, y: -2.0 },
  },
  mounts: { panel: { x0: -24, x1: 28, y0: TC - 2, y1: TC + 2 }, hazard: { x0: 18.4, x1: 24.6, y0: TC - 2.2, y1: TC + 2.2 } },
};

// =========================================================== FLAME THROWER

const F_BORE = -5.6;

function flameBody(k, L) {
  // ---- fuel tank under the wand, clamped to it
  k.part('metal', 'paint', tube(5.0, 24.4, 1.0, 3.0, 'round', 'round'), { color: L.tank || '#7a2b22', light: 'cyl' });
  k.detail((g) => { g.fillStyle = 'rgba(240,226,190,0.55)'; g.fillRect(12.0, 0.4, 6.0, 0.6); });
  k.part('steel', 'steel', rrect(9.0, -4.8, 1.6, 4.0, 0.3));
  k.part('steel', 'steel', rrect(19.0, -4.8, 1.6, 4.0, 0.3));
  // ---- wand: fuel line, heat sleeve, nozzle, igniter
  k.part('steel', 'steel', tube(4.0, 31.0, F_BORE, 1.05));
  k.part('steel', 'alu', tube(17.6, 28.4, F_BORE, 1.7), { light: 'cyl' });
  k.detail((g) => {
    g.fillStyle = 'rgba(0,0,0,0.55)';
    for (let x = 18.6; x < 27.8; x += 1.3) for (const dy of [-0.8, 0.4]) { g.beginPath(); g.arc(x, F_BORE + dy, 0.32, 0, Math.PI * 2); g.fill(); }
  });
  k.part('steel', 'steel', svg(`M 30.4 ${F_BORE - 1.3} L 34.4 ${F_BORE - 1.9} Q 35.0 ${F_BORE - 1.9} 35.0 ${F_BORE - 1.3}
    L 35.0 ${F_BORE + 1.3} Q 35.0 ${F_BORE + 1.9} 34.4 ${F_BORE + 1.9} L 30.4 ${F_BORE + 1.3} Z`), { light: 'cyl' });
  k.part('steel', 'alu', rrect(29.2, F_BORE + 1.4, 4.2, 2.0, 0.4));
  k.part('emit', 'emit', ell(34.0, F_BORE + 2.6, 0.7, 0.55), { core: [255, 150, 60], spill: 0.8 });
  // ---- hose from the tank up into the valve block
  k.part('furn', 'rubber', svg('M 4.8 1.6 Q 2.4 1.4 2.6 -1.2 L 2.8 -3.4 L 4.6 -3.4 L 4.4 -1.4 Q 4.4 -0.4 5.6 -0.4 Z'), { light: 'soft' });
  // ---- valve block / receiver
  k.part('metal', 'alu', svg(`M -6.6 -9.0 L 5.8 -9.0 Q 6.8 -9.0 6.8 -8.0 L 6.8 -3.6 Q 6.8 -2.6 5.8 -2.6 L -1.4 -2.6
    Q -3.4 -2.6 -4.6 -3.4 L -6.6 -4.4 Z`));
  k.part('steel', 'steel', ell(1.6, -9.6, 1.6, 1.3));                                   // pressure gauge
  k.part('fixed', 'ceramic', ell(1.6, -9.6, 1.1, 0.85), { line: false });
  k.detail((g) => { g.strokeStyle = '#b02a1a'; g.lineWidth = 0.18; g.beginPath(); g.moveTo(1.6, -9.6); g.lineTo(2.2, -10.1); g.stroke(); });
  k.part('steel', 'steel', rrect(-4.2, -10.0, 2.4, 1.4, 0.4));                          // valve knob
  k.seam('M -6.4 -5.8 L 6.6 -5.8', 0.18, 0.4);
  // ---- trigger guard, grip, stock
  k.part('metal', 'alu', svg('M 1.0 -2.8 L 1.6 -2.8 Q 2.0 0.4 3.6 0.4 L 4.4 0.4 L 4.4 1.2 L 3.4 1.2 Q 1.2 1.2 0.8 -1.4 Z'));
  k.part('steel', 'steel', svg('M 2.0 -2.6 Q 2.6 -1.4 2.2 0.2 L 1.8 0.2 Q 2.0 -1.2 1.6 -2.4 Z'), { line: false });
  k.part('furn', 'poly', svg(`M -2.8 -2.8 Q -3.4 -2.6 -3.2 -1.8 Q -3.6 2.4 -4.8 6.6 Q -5.0 8.0 -3.6 8.1 L -2.0 8.1
    Q -1.0 8.0 -0.8 7.0 Q -0.4 4.6 0.4 2.0 Q 0.9 0.0 1.6 -1.6 L 1.6 -2.8 Z`), { tex: 'stipple' });
  // collapsible stock on a buffer tube, skeletonised
  k.part('steel', 'alu', tube(-14.6, -6.0, F_BORE - 1.2, 1.2), { light: 'cyl' });
  k.part('furn', 'poly', svg(`M -10.6 -8.2 L -19.0 -8.6 Q -21.0 -8.7 -21.2 -7.0 L -21.4 0.2 Q -21.4 1.4 -20.2 1.2
    L -18.6 0.6 Q -15.8 -0.6 -14.2 -3.2 Q -13.0 -4.6 -11.2 -4.8 L -10.6 -4.8 Z`), { tex: 'stipple' });
  k.detail((g) => {
    g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.moveTo(-18.6, -6.8); g.lineTo(-14.8, -6.6); g.quadraticCurveTo(-14.2, -6.4, -14.8, -5.4);
    g.lineTo(-17.2, -2.0); g.quadraticCurveTo(-18.4, -1.0, -18.8, -2.4); g.lineTo(-19.0, -6.2); g.closePath(); g.fill();
  });
  k.part('fixed', 'rubber', svg('M -21.0 -8.8 L -22.0 -8.6 Q -22.6 -8.3 -22.6 -7.6 L -22.6 0.8 Q -22.6 1.6 -21.6 1.6 L -21.0 1.6 Z'));
  // ---- front grip under the tank
  k.part('furn', 'poly', svg(`M 17.6 3.6 L 21.0 3.6 Q 21.2 7.0 20.8 9.8 Q 20.6 10.6 19.8 10.6 L 18.6 10.6
    Q 17.8 10.6 17.8 9.8 Q 17.4 7.0 17.6 3.6 Z`), { tex: 'stipple' });
  k.part('steel', 'alu', rrect(17.0, 2.8, 4.6, 1.6, 0.4));
  k.out.muzzle = { x: 35.2, y: F_BORE };
  k.formLight([-22.2, -11, 35, 10.6]);
}

export const FLAME = {
  id: 'flame',
  look: { alu: '#3c3f44', poly: '#2f3134', steel: '#3a3d42', paint: '#7a2b22' },
  body: flameBody,
  rig: {
    gripA: { x: 0, y: 0.6 },
    gripB: { x: 19.4, y: 6.8 },
    muzzle: { x: 35.2, y: F_BORE },
    eject: null,
    shoulder: { x: -12.8, y: -4.0 },
  },
  mounts: { bore: { x0: 4.0, x1: 35.4, y: F_BORE, r: 1.8 },  panel: { x0: -6.4, x1: 6.6, y0: -8.8, y1: -3.0 } },
};
