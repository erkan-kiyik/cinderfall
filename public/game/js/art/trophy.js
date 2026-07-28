// Trophy icon — the per-run score chased against a personal best. Painted
// procedurally like every other icon in this game (see currency.js), sharing
// its HiDPI/round-rect helpers. Bold single-silhouette cup so it reads at
// small HUD size: rim, handles, bowl, stem, base — no fine detail below that.

import { roundRect, setupHiDpi } from './currency.js';

export function paintTrophy(g, w, h) {
  g.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const s = Math.min(w, h) / 64;
  g.save();
  g.translate(cx, cy);
  g.scale(s, s);

  const outline = '#3a2405';
  const metal = ['#fff0c2', '#f2c14e', '#c9922f', '#8a5f1c'];

  // base plate
  const baseGrad = g.createLinearGradient(0, 20, 0, 28);
  baseGrad.addColorStop(0, metal[1]); baseGrad.addColorStop(1, metal[3]);
  g.fillStyle = baseGrad;
  roundRect(g, -13, 21, 26, 7, 2);
  g.fill();
  g.strokeStyle = outline; g.lineWidth = 2; g.lineJoin = 'round'; g.stroke();

  // stem
  g.fillStyle = baseGrad;
  roundRect(g, -4, 10, 8, 12, 1.5);
  g.fill();
  g.strokeStyle = outline; g.lineWidth = 1.8; g.stroke();

  // handles (drawn behind the bowl so only the outer curve peeks past it)
  const handleGrad = g.createLinearGradient(-30, -20, -14, 0);
  handleGrad.addColorStop(0, metal[2]); handleGrad.addColorStop(1, metal[1]);
  g.strokeStyle = outline; g.lineCap = 'round';
  g.lineWidth = 6.4;
  g.beginPath(); g.moveTo(-15, -18); g.quadraticCurveTo(-29, -15, -15, 3); g.stroke();
  g.beginPath(); g.moveTo(15, -18); g.quadraticCurveTo(29, -15, 15, 3); g.stroke();
  g.strokeStyle = handleGrad; g.lineWidth = 4;
  g.beginPath(); g.moveTo(-15, -18); g.quadraticCurveTo(-29, -15, -15, 3); g.stroke();
  g.beginPath(); g.moveTo(15, -18); g.quadraticCurveTo(29, -15, 15, 3); g.stroke();

  // cup bowl — the dominant silhouette
  const bowlGrad = g.createLinearGradient(-16, -23, 16, 12);
  bowlGrad.addColorStop(0, metal[0]);
  bowlGrad.addColorStop(0.45, metal[1]);
  bowlGrad.addColorStop(1, metal[2]);
  g.fillStyle = bowlGrad;
  g.beginPath();
  g.moveTo(-16, -23);
  g.lineTo(16, -23);
  g.lineTo(12, 6);
  g.quadraticCurveTo(0, 15, -12, 6);
  g.closePath();
  g.fill();
  g.strokeStyle = outline; g.lineWidth = 2.3; g.lineJoin = 'round'; g.stroke();

  // top rim line + specular highlight
  g.strokeStyle = outline; g.lineWidth = 2.1;
  g.beginPath(); g.moveTo(-16, -23); g.lineTo(16, -23); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.6)';
  g.beginPath(); g.ellipse(-6.5, -19, 5.5, 2.2, -0.35, 0, Math.PI * 2); g.fill();

  g.restore();
}

export function renderTrophyIcon(cv) {
  const { g, w, h } = setupHiDpi(cv);
  paintTrophy(g, w, h);
}

export function mountTrophyIcons(root = document) {
  root.querySelectorAll('canvas.cur-trophy').forEach(renderTrophyIcon);
}
