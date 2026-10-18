// Dev render helpers shared by the review sheets and the UI mocks.
import { outlined, setRoot } from '../js/art/kit.js';
import { drawFigure, gunPoint } from '../js/art/figure.js';
import { OPS as OPS0 } from '../js/art/ops/index.js';
import { TETIKCI, KALKANLI, HUCUMCU, GALL } from '../js/art/enemies/syndicate.js';
import { WEAPONS } from '../js/art/weapons/index.js';
import { STREET, crate, barrier, lampPost, dumpster, burnBarrel, cone } from '../js/art/env/street.js';

export const OPS = { ...OPS0, tetikci: TETIKCI, kalkanli: KALKANLI, hucumcu: HUCUMCU, gall: GALL };
export { WEAPONS };

export function figureCanvas(op, s, pose) {
  const W = Math.round(80 * s), H = Math.round(82 * s);
  return outlined(W, H, s, W * 0.42, H - 6 * s, (g) => drawFigure(g, op, pose));
}

export function weaponCanvas(w, s, r = 0.55) {
  const [x0, y0, x1, y1] = w.box;
  const W = Math.round((x1 - x0 + 3) * s), H = Math.round((y1 - y0 + 3) * s);
  return outlined(W, H, s, (-x0 + 1.5) * s, (-y0 + 1.5) * s, (g) => { setRoot(g); w.paint(g); }, r);
}

export function streetScene(s = 4) {
  const W = 600 * s, H = 200 * s, oy = 168 * s;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.save(); g.translate(0, oy); g.scale(s, s); setRoot(g);
  STREET.sky(g); STREET.farCity(g); STREET.midIndustry(g); STREET.facades(g); STREET.ground(g);
  g.restore();
  const aim = (k = 0.96) => ({ w: WEAPONS.kestrel, at: [10.6, -46.6], ang: -0.03, k });
  const vexPose = { ...OPS.vex.pose, lean: -0.05, head: -0.1, nThigh: 0.32, nShin: 0.12, fThigh: -0.3, fShin: -0.04, gun: aim() };
  const tetPose = { ...OPS.tetikci.pose, lean: -0.04, head: -0.06, gun: { ...aim(), mat: OPS.tetikci.pose.gun.mat } };
  const actors = [
    [OPS.vex, vexPose, 186, false],
    [OPS.tetikci, tetPose, 444, true],
    [OPS.kalkanli, OPS.kalkanli.pose, 486, true],
  ];
  const play = outlined(W, H, s, 0, oy, (pg) => {
    setRoot(pg);
    lampPost(pg, 128); crate(pg, 92); crate(pg, 110, 14, 12); cone(pg, 300);
    for (const [op, pose, x, flip] of actors) { pg.save(); pg.translate(x, 0); drawFigure(pg, op, pose, flip); pg.restore(); setRoot(pg); }
    barrier(pg, 396); dumpster(pg, 522); burnBarrel(pg, 574);
  });
  g.drawImage(play, 0, 0);
  g.save(); g.translate(0, oy); g.scale(s, s);
  STREET.lampLight(g, 128); STREET.fireLight(g, 574);
  // tracer from VEX's muzzle into the barrier, with a flash and sparks
  const m = gunPoint(vexPose.gun, WEAPONS.kestrel.muzzle);
  const mx = 186 + m[0], my = m[1];
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = '#ff9a5c'; g.lineCap = 'round';
  g.globalAlpha = 0.25; g.lineWidth = 2.2; g.beginPath(); g.moveTo(mx + 30, my + 0.4); g.lineTo(398, -14.6); g.stroke();
  g.globalAlpha = 0.95; g.lineWidth = 0.6; g.strokeStyle = '#ffe2c4'; g.beginPath(); g.moveTo(mx + 46, my + 0.8); g.lineTo(398, -14.6); g.stroke();
  g.globalAlpha = 1;
  g.fillStyle = '#ffd08a';
  g.beginPath(); g.moveTo(mx, my - 2.6); g.lineTo(mx + 6, my); g.lineTo(mx, my + 2.6); g.lineTo(mx + 1.6, my); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(mx + 1, my - 1.2); g.lineTo(mx + 9, my); g.lineTo(mx + 1, my + 1.2); g.closePath(); g.fill();
  g.fillStyle = '#ffd08a'; g.globalAlpha = 0.5; g.beginPath(); g.arc(398, -14.6, 2.2, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
  for (const [x0, y0, x1, y1] of [[397, -15.6, 393.4, -20.6], [396.4, -14.2, 391.6, -15.2], [397.8, -16.2, 396.6, -22.4], [396.8, -15.0, 392.8, -18.0], [398.6, -16.0, 399.4, -20.0]]) { g.lineWidth = 0.35; g.strokeStyle = '#ffe2b0'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  g.restore();
  // foreground silhouettes and a soft vignette
  g.fillStyle = '#0b0e13';
  g.beginPath(); g.moveTo(-10, 40); g.lineTo(-10, 22); g.lineTo(18, 18); g.lineTo(30, 24); g.lineTo(46, 21); g.lineTo(64, 30); g.lineTo(64, 40); g.fill();
  g.beginPath(); g.moveTo(560, 40); g.lineTo(566, 24); g.lineTo(610, 24); g.lineTo(610, 40); g.fill();
  g.restore();
  const v = g.createRadialGradient(W / 2, H * 0.45, H * 0.4, W / 2, H * 0.45, W * 0.62);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(5,7,12,0.55)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c;
}

