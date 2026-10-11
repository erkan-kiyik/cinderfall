// Supply crate — the thing the CRATES tab is about, painted rather than built
// out of CSS borders. A rugged military case in the same stylised language as
// the rest of the art: three flat tones per surface, a bold outline, one
// highlight. The lid is a separate canvas so the opening beat can throw it
// off the case. The emblem is the scrap cog, because scrap is what it costs.

import { paintScrap } from './currency.js';

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function lin(g, y0, y1, stops) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  for (const [t, c] of stops) gr.addColorStop(t, c);
  return gr;
}

const OUT = '#0b0f14';

// Body of the case, in a 220 x 170 design box.
export function paintCrateBody(g) {
  // corner-protected case
  rr(g, 14, 64, 192, 94, 10);
  g.fillStyle = lin(g, 64, 158, [[0, '#3f4a58'], [0.55, '#2f3843'], [1, '#202730']]);
  g.fill();
  g.lineWidth = 3; g.strokeStyle = OUT; g.stroke();
  g.save(); rr(g, 14, 64, 192, 94, 10); g.clip();
  // end caps
  g.fillStyle = '#1b2129';
  g.fillRect(14, 64, 22, 94); g.fillRect(184, 64, 22, 94);
  g.fillStyle = 'rgba(255,255,255,0.06)';
  g.fillRect(36, 64, 2, 94); g.fillRect(182, 64, 2, 94);
  // pressed ribs
  for (const y of [96, 130]) {
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(38, y, 144, 4);
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(38, y - 1.5, 144, 1.5);
  }
  // top highlight
  g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(14, 66, 192, 3);
  g.restore();
  // rivets on the end caps
  for (const x of [25, 195]) for (const y of [78, 111, 144]) {
    g.fillStyle = '#5d6774'; g.beginPath(); g.arc(x, y, 2.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(x - 0.8, y - 0.8, 1, 0, Math.PI * 2); g.fill();
  }
  // emblem plate with the scrap cog
  g.fillStyle = '#1a2028';
  g.beginPath(); g.arc(110, 113, 22, 0, Math.PI * 2); g.fill();
  g.lineWidth = 3; g.strokeStyle = OUT; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1.5;
  g.beginPath(); g.arc(110, 113, 18.5, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  const ic = document.createElement('canvas'); ic.width = ic.height = 96;
  paintScrap(ic.getContext('2d'), 96, 96);
  g.drawImage(ic, 92, 95, 36, 36);
  // stencil
  g.fillStyle = 'rgba(214,206,186,0.45)';
  g.font = '700 9px Rajdhani, "Arial Narrow", sans-serif';
  g.textAlign = 'center';
  g.fillText('SECTOR 9', 68, 117);
  g.fillText('SUPPLY', 152, 117);
  // latch keepers on the body, under the lid clasps
  for (const x of [62, 158]) {
    rr(g, x - 7, 64, 14, 10, 2);
    g.fillStyle = '#5a636e'; g.fill(); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke();
  }
}

// Lid, in the same design box — drawn on its own canvas.
export function paintCrateLid(g) {
  // carry handle
  rr(g, 84, 18, 52, 12, 6);
  g.fillStyle = '#20262e'; g.fill();
  g.lineWidth = 3; g.strokeStyle = OUT; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(90, 20, 40, 2);
  // lid shell
  rr(g, 10, 28, 200, 40, 10);
  g.fillStyle = lin(g, 28, 68, [[0, '#4d5a6a'], [0.6, '#38424f'], [1, '#2a323c']]);
  g.fill();
  g.lineWidth = 3; g.strokeStyle = OUT; g.stroke();
  g.save(); rr(g, 10, 28, 200, 40, 10); g.clip();
  // hazard band
  g.save();
  g.beginPath(); g.rect(36, 42, 148, 12); g.clip();
  g.fillStyle = '#d6453a'; g.fillRect(36, 42, 148, 12);
  g.fillStyle = '#161a20';
  for (let x = 20; x < 200; x += 14) {
    g.beginPath(); g.moveTo(x, 54); g.lineTo(x + 7, 54); g.lineTo(x + 19, 42); g.lineTo(x + 12, 42); g.closePath(); g.fill();
  }
  g.restore();
  g.strokeStyle = OUT; g.lineWidth = 2; g.strokeRect(36, 42, 148, 12);
  // end caps + highlight
  g.fillStyle = '#20272f'; g.fillRect(10, 28, 24, 40); g.fillRect(186, 28, 24, 40);
  g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(10, 30, 200, 3);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(10, 62, 200, 6);
  g.restore();
  // clasps
  for (const x of [62, 158]) {
    rr(g, x - 8, 56, 16, 16, 3);
    g.fillStyle = lin(g, 56, 72, [[0, '#b6bec8'], [1, '#6c7580']]);
    g.fill(); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke();
    g.fillStyle = '#2a3038'; g.fillRect(x - 3, 62, 6, 4);
  }
}

// HiDPI paint of either part into a canvas sized by CSS to the design box.
export function renderCrate(bodyCv, lidCv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  for (const [cv, fn] of [[bodyCv, paintCrateBody], [lidCv, paintCrateLid]]) {
    if (!cv) continue;
    const w = cv.clientWidth || 220, h = cv.clientHeight || 170;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const g = cv.getContext('2d');
    g.setTransform(dpr * (w / 220), 0, 0, dpr * (h / 170), 0, 0);
    g.clearRect(0, 0, 220, 170);
    fn(g);
  }
}
