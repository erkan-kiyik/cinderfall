// Accessories: optics, muzzle devices and lasers, painted with the same kit as
// the weapons so they share materials, zones and light.
//
// Every accessory is seated INTO the part it mounts on — an optic's foot
// sinks into the rail, a muzzle device's sleeve runs back over the barrel
// threads — so a mounted part can never sit on its host by a hairline.

import { svg, rpoly, rrect, ell, tube } from '../gunkit.js';

// ---------------------------------------------------------------- optics
// x is the optic's rear end, y the rail's top surface.

export function optic(k, kind, x, y) {
  if (!kind) return 0;
  // Optics keep their own black anodising whatever the skin does to the gun.
  const OPT = { color: k.L.optic || '#303237' };
  if (kind === 'irons') return irons(k, x, y);
  if (kind === 'reddot') {
    // Micro red dot: a short tube on a low mount, lens caps at both ends.
    k.part('fixed', 'alu', rpoly([[x + 0.6, y + 0.7], [x + 0.9, y - 2.4], [x + 5.6, y - 2.4], [x + 6.0, y + 0.7]], 0.3), OPT);
    k.part('fixed', 'alu', tube(x + 0.4, x + 6.2, y - 3.4, 1.85), { ...OPT, light: 'cyl' });
    k.part('fixed', 'alu', rrect(x + 2.3, y - 6.0, 1.6, 1.2, 0.3), OPT);          // elevation turret
    k.part('fixed', 'glass', rrect(x + 5.9, y - 4.9, 0.6, 3.0, 0.25));
    k.detail((g) => { g.fillStyle = '#ff4a3a'; g.fillRect(x + 6.0, y - 3.6, 0.35, 0.35); });
    k.seam(`M ${x + 1.6} ${y - 5.2} L ${x + 1.6} ${y - 1.6}`, 0.18, 0.4);
    return 6.4;
  }
  if (kind === 'holo') {
    // Holographic sight: a box with a hooded window, battery housing forward.
    k.part('fixed', 'alu', rpoly([[x, y + 0.7], [x, y - 1.2], [x + 8.6, y - 1.2], [x + 8.6, y + 0.7]], 0.3), OPT);
    k.part('fixed', 'alu', rpoly([[x + 0.2, y - 1.0], [x + 0.6, y - 6.2], [x + 2.0, y - 6.6], [x + 6.6, y - 6.6],
      [x + 8.2, y - 5.6], [x + 8.4, y - 1.0]], 0.5));
    k.part('fixed', 'glass', rpoly([[x + 1.3, y - 2.0], [x + 1.6, y - 5.6], [x + 6.2, y - 5.6], [x + 6.6, y - 2.0]], 0.4));
    k.part('fixed', 'alu', rrect(x + 6.8, y - 4.0, 2.4, 2.8, 0.6), OPT);          // battery cap
    k.detail((g) => {
      g.strokeStyle = 'rgba(255,90,70,0.85)'; g.lineWidth = 0.18;
      g.beginPath(); g.arc(x + 3.9, y - 3.8, 0.8, 0, Math.PI * 2); g.stroke();
    });
    return 9.2;
  }
  if (kind === 'acog') {
    // Prism sight: a short fat body with a flared objective and a top fibre.
    k.part('fixed', 'alu', rpoly([[x + 0.8, y + 0.7], [x + 1.0, y - 1.4], [x + 6.8, y - 1.4], [x + 7.0, y + 0.7]], 0.3), OPT);
    k.part('fixed', 'alu', svg(`M ${x} ${y - 2.6} L ${x + 1.2} ${y - 3.0} L ${x + 1.2} ${y - 1.6} L ${x + 7.4} ${y - 1.2}
      L ${x + 9.6} ${y - 0.9} L ${x + 9.6} ${y - 6.9} L ${x + 7.4} ${y - 6.0} L ${x + 1.2} ${y - 6.2} L ${x + 1.2} ${y - 4.8}
      L ${x} ${y - 5.2} Z`), { ...OPT, light: 'cyl' });
    k.part('fixed', 'glass', rrect(x + 9.2, y - 6.4, 0.6, 5.0, 0.25));
    k.part('fixed', 'alu', rrect(x + 3.2, y - 7.6, 2.4, 1.8, 0.4), OPT);
    k.detail((g) => { g.fillStyle = 'rgba(255,110,60,0.9)'; g.fillRect(x + 3.4, y - 7.9, 2.0, 0.35); });
    return 9.8;
  }
  if (kind === 'lpvo' || kind === 'longscope') {
    // Variable scope in rings: eyepiece bell, tube with turrets, objective
    // bell. The long version is the sniper's.
    const L = kind === 'longscope' ? 19 : 13;
    const ob = kind === 'longscope' ? 2.9 : 2.4;
    const ring = (rx) => k.part('fixed', 'alu', rpoly([[rx, y + 0.7], [rx + 0.2, y - 3.4], [rx + 2.0, y - 3.4], [rx + 2.2, y + 0.7]], 0.3), OPT);
    ring(x + 2.6); ring(x + L - 6.2);
    const yc = y - 4.6;
    k.part('fixed', 'alu', svg(`M ${x} ${yc - 2.0} Q ${x} ${yc - 2.3} ${x + 0.4} ${yc - 2.3} L ${x + 2.8} ${yc - 2.2}
      L ${x + 4.4} ${yc - 1.4} L ${x + L - 5.0} ${yc - 1.4} L ${x + L - 2.6} ${yc - ob} L ${x + L} ${yc - ob}
      L ${x + L} ${yc + ob} L ${x + L - 2.6} ${yc + ob} L ${x + L - 5.0} ${yc + 1.4} L ${x + 4.4} ${yc + 1.4}
      L ${x + 2.8} ${yc + 2.2} L ${x + 0.4} ${yc + 2.3} Q ${x} ${yc + 2.3} ${x} ${yc + 2.0} Z`), { ...OPT, light: 'cyl' });
    k.part('fixed', 'alu', rrect(x + L * 0.42, yc - 3.4, 2.0, 2.2, 0.4), OPT);     // elevation turret
    k.part('fixed', 'alu', rrect(x + L * 0.42 + 0.3, yc - 0.6, 1.4, 1.0, 0.3), OPT); // windage
    k.part('fixed', 'rubber', rrect(x - 0.6, yc - 2.0, 1.0, 4.0, 0.4));
    k.part('fixed', 'glass', rrect(x + L - 0.3, yc - ob + 0.3, 0.6, ob * 2 - 0.6, 0.25));
    k.seam(`M ${x + L * 0.42 - 0.6} ${yc - 1.3} L ${x + L * 0.42 - 0.6} ${yc + 1.3}`, 0.16, 0.4);
    return L;
  }
  return 0;
}

// Folded flip-up backup sights: a low rear and a low front hump.
export function irons(k, x, y, frontX = null) {
  const OPT = { color: k.L.optic || '#303237' };
  k.part('fixed', 'alu', rpoly([[x, y + 0.6], [x + 0.2, y - 1.2], [x + 2.4, y - 1.6], [x + 3.2, y - 1.0], [x + 3.4, y + 0.6]], 0.3), OPT);
  if (frontX != null) {
    k.part('fixed', 'alu', rpoly([[frontX, y + 0.6], [frontX + 0.3, y - 1.0], [frontX + 2.4, y - 1.6], [frontX + 3.0, y - 1.2], [frontX + 3.2, y + 0.6]], 0.3), OPT);
  }
  return 3.4;
}

// ---------------------------------------------------------- muzzle devices
// x is the barrel's end (thread shoulder), yc the bore line, r the barrel
// radius there. Returns the muzzle point x (where shots leave).

export function muzzle(k, kind, x, yc, r = 1) {
  const R = Math.max(1.1, r * 1.25);
  if (!kind || kind === 'a2') {
    // Birdcage flash hider: crown, slotted cage, closed bottom.
    k.part('steel', 'steel', tube(x - 0.8, x + 4.0, yc, R));
    k.detail((g) => {
      g.fillStyle = 'rgba(4,5,7,0.85)';
      for (let i = 0; i < 2; i++) g.fillRect(x + 1.0 + i * 1.4, yc - R + 0.25, 0.65, R * 1.1);
      g.fillStyle = 'rgba(0,0,0,0.6)';
      g.beginPath(); g.ellipse(x + 4.0, yc, 0.35, R * 0.62, 0, 0, Math.PI * 2); g.fill();
    });
    return x + 4.0;
  }
  if (kind === 'brake') {
    // Two-chamber muzzle brake: wider than the barrel, big side ports.
    const B = R * 1.25;
    k.part('steel', 'steel', rpoly([[x - 0.8, yc - R], [x + 0.6, yc - B], [x + 5.4, yc - B], [x + 5.8, yc - B + 0.5],
      [x + 5.8, yc + B - 0.5], [x + 5.4, yc + B], [x + 0.6, yc + B], [x - 0.8, yc + R]], 0.35), { light: 'cyl' });
    k.slot(x + 1.2, yc - B * 0.55, 1.2, B * 1.1, 0.35);
    k.slot(x + 3.4, yc - B * 0.55, 1.2, B * 1.1, 0.35);
    return x + 5.8;
  }
  if (kind === 'comp') {
    // Compensator: ports on top only, so it is solid below.
    k.part('steel', 'steel', tube(x - 0.8, x + 4.2, yc, R * 1.08));
    k.slot(x + 0.9, yc - R * 1.08 + 0.2, 0.7, 0.9, 0.3);
    k.slot(x + 2.2, yc - R * 1.08 + 0.2, 0.7, 0.9, 0.3);
    return x + 4.2;
  }
  if (kind === 'can') {
    // Suppressor: a long, fat can with a mount collar where it meets the
    // barrel and a subtle seam at each end cap.
    const C = Math.max(1.9, r * 2.0);
    const len = 11.5;
    k.part('steel', 'steel', tube(x - 1.0, x + 1.4, yc, R * 1.1));
    // The can is its own part: a skin's Damascus or heat tint on a
    // suppressor tube read as twisted rope, so it keeps its own finish.
    k.part('fixed', 'alu', tube(x + 0.6, x + len, yc, C), { light: 'cyl', color: k.L.can || '#3a3d42' });
    k.seam(`M ${x + 2.0} ${yc - C + 0.15} L ${x + 2.0} ${yc + C - 0.15}`, 0.18, 0.45);
    k.seam(`M ${x + len - 1.2} ${yc - C + 0.15} L ${x + len - 1.2} ${yc + C - 0.15}`, 0.18, 0.45);
    return x + len;
  }
  if (kind === 'prong') {
    // Three-prong flash hider.
    k.part('steel', 'steel', tube(x - 0.8, x + 1.6, yc, R));
    k.part('steel', 'steel', rpoly([[x + 1.2, yc - R], [x + 4.6, yc - R * 0.9], [x + 4.6, yc - R * 0.35], [x + 1.6, yc - R * 0.25]], 0.25));
    k.part('steel', 'steel', rpoly([[x + 1.2, yc + R], [x + 4.6, yc + R * 0.9], [x + 4.6, yc + R * 0.35], [x + 1.6, yc + R * 0.25]], 0.25));
    k.part('steel', 'steel', rrect(x + 1.2, yc - 0.3, 3.2, 0.6, 0.25));
    return x + 4.6;
  }
  return x;
}

// ---------------------------------------------------------------- lasers
// A PEQ-style box on the rail's front end. x is its rear, y the rail top.
export function laser(k, x, y) {
  const OPT = { color: k.L.optic || '#303237' };
  k.part('fixed', 'alu', rpoly([[x + 0.5, y + 0.7], [x + 0.6, y - 1.0], [x + 4.8, y - 1.0], [x + 5.0, y + 0.7]], 0.3), OPT);
  k.part('fixed', 'poly', rpoly([[x, y - 0.8], [x, y - 3.4], [x + 5.6, y - 3.4], [x + 6.0, y - 3.0], [x + 6.0, y - 0.8]], 0.5), OPT);
  k.part('fixed', 'glass', rrect(x + 5.6, y - 3.0, 0.5, 1.0, 0.2));
  k.part('fixed', 'glass', rrect(x + 5.6, y - 1.8, 0.5, 0.9, 0.2));
  k.screw(x + 1.4, y - 2.1, 0.32);
  return 6;
}
