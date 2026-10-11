// TALON-7 — fixed-blade fighting knife. Three blade forms share one handle:
//   'clip'   the issue knife: clip point, fuller, stacked-washer grip
//   'bowie'  heavier and deeper, swedged spine, a little longer
//   'tanto'  straight spine, angular secondary point
// An energised blade (look.edge) carries a lit cutting edge along the grind.
//
// Knife space: origin = the hand's grip point on the handle, +x toward the tip.

import { svg, rpoly, rrect, ell, tube } from '../gunkit.js';

function knifeBody(k, L) {
  const form = L.blade || 'clip';
  // ---- pommel and handle (stacked washers, ringed)
  k.part('steel', 'steel', svg('M -7.6 -1.6 Q -8.4 -1.4 -8.4 -0.2 L -8.4 0.4 Q -8.4 1.6 -7.6 1.8 L -6.8 1.8 L -6.8 -1.6 Z'));
  k.part('furn', 'poly', svg(`M -7.0 -1.8 Q -4.0 -2.3 -0.6 -1.9 L -0.6 1.9 Q -4.0 2.4 -7.0 2.0 Z`), { light: 'cyl', tex: L.handle === 'wood' ? 'grain' : undefined });
  k.detail((g) => {
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.18;
    for (let x = -6.2; x < -1.0; x += 0.8) { g.beginPath(); g.moveTo(x, -2.0); g.quadraticCurveTo(x + 0.15, 0, x, 2.1); g.stroke(); }
  });
  // ---- guard
  k.part('steel', 'steel', rrect(-1.0, -2.8, 1.3, 5.6, 0.5), { color: L.guard || L.steel });

  // ---- blade (seated 0.8 into the guard)
  const steel = L.bladeColor || '#b9c0c9';
  let blade, grind, edge, fuller = null, tip;
  if (form === 'bowie') {
    blade = 'M -0.2 -2.0 L 10.6 -2.2 Q 13.0 -2.4 14.6 -1.2 L 17.6 0.4 Q 14.8 2.6 10.0 2.6 L -0.2 2.2 Z';
    grind = 'M 0.6 0.8 Q 9 1.0 16.4 0.6';
    edge = 'M 1.6 2.0 Q 9.6 2.2 14.6 1.2';
    fuller = 'M 1.8 -0.9 L 9.4 -1.0';
    tip = 17.6;
  } else if (form === 'tanto') {
    blade = 'M -0.2 -1.8 L 13.0 -1.8 L 15.6 -0.4 L 14.2 1.8 L -0.2 1.8 Z';
    grind = 'M 0.6 0.6 L 13.6 0.6 L 14.8 -0.2';
    edge = 'M 1.6 1.4 L 13.8 1.4';
    tip = 15.6;
  } else {
    blade = 'M -0.2 -1.8 L 9.4 -1.9 Q 12.4 -1.9 13.6 -0.8 L 15.8 -0.2 Q 13.6 1.6 9.6 2.0 L -0.2 2.0 Z';
    grind = 'M 0.6 0.6 Q 8.4 0.9 15.0 0.0';
    edge = 'M 1.6 1.5 Q 9.0 1.6 13.8 0.6';
    fuller = 'M 1.6 -0.8 L 8.6 -0.9';
    tip = 15.8;
  }
  k.part('steel', 'steel', svg(blade), { color: steel, light: 'box' });
  k.hi(grind, 0.22, 0.35);
  if (fuller) k.seam(fuller, 0.45, 0.35);
  k.hi('M 0.2 -1.6 L 9.0 -1.7', 0.16, 0.3);
  if (L.edge) k.glow(edge, 0.5, { core: L.edge });
  k.out.tip = tip;
  k.formLight([-8.4, -2.8, tip, 2.8]);
}

export const KNIFE = {
  id: 'knife',
  kind: 'melee',
  look: { steel: '#4a4e55', poly: '#4a3a2a' },
  body: knifeBody,
  rig: { gripA: { x: -3.4, y: 0 } },
  mounts: {},
};
