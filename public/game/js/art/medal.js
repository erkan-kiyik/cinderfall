// Achievement medals. Each tier is a metal (bronze / silver / gold) struck as
// a hexagonal badge with two ribbon tabs, a recessed face and the
// achievement's glyph in relief. Stylised, flat-lit, no grunge — it has to
// read at 48px on a phone.
//
// The glyphs come from drawAchievementIcon(), which paints with
// destination-out for its cut-outs (skull eyes, crate slats). Drawn straight
// onto the medal those would punch holes through it, so the glyph is painted
// into its own small canvas first and composited on.

import { drawAchievementIcon } from '../game/achievements.js';

export const METALS = {
  easy:   { name: 'bronze', hi: '#f0c08a', mid: '#b97b45', lo: '#6e4322', ribbon: '#9b3b2c' },
  medium: { name: 'silver', hi: '#f4f7fa', mid: '#aeb8c4', lo: '#5d6672', ribbon: '#2f5f9a' },
  hard:   { name: 'gold',   hi: '#fff0b8', mid: '#e3b043', lo: '#8a5a12', ribbon: '#8e1f3a' },
};
const STEEL = { hi: '#6a7380', mid: '#3a414b', lo: '#1c2027', ribbon: '#2a2f37' };

function hexPath(g, cx, cy, r) {
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + i * Math.PI / 3;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.closePath();
}

let glyphCv = null;
function glyph(kind, size, color) {
  if (!glyphCv) glyphCv = document.createElement('canvas');
  glyphCv.width = glyphCv.height = Math.ceil(size);
  const g = glyphCv.getContext('2d');
  g.clearRect(0, 0, glyphCv.width, glyphCv.height);
  drawAchievementIcon(g, kind, size, size, color);
  return glyphCv;
}

// state: 'locked' | 'progress' | 'ready' | 'claimed'
export function drawMedal(g, size, tierKey, iconKind, state = 'progress') {
  const locked = state === 'locked' || state === 'progress';
  const M = locked ? STEEL : (METALS[tierKey] || METALS.easy);
  const cx = size / 2, cy = size * 0.56, r = size * 0.4;

  // ribbon tabs behind the badge
  g.fillStyle = M.ribbon;
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(cx + s * r * 0.15, cy - r * 0.6);
    g.lineTo(cx + s * r * 0.62, cy - r * 1.36);
    g.lineTo(cx + s * r * 0.3, cy - r * 1.18);
    g.lineTo(cx + s * r * 0.05, cy - r * 1.42);
    g.lineTo(cx - s * r * 0.12, cy - r * 0.7);
    g.closePath(); g.fill();
  }

  // drop shadow
  g.fillStyle = 'rgba(0,0,0,0.35)';
  hexPath(g, cx, cy + size * 0.03, r); g.fill();

  // rim: a diagonal metal sweep
  const rim = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  rim.addColorStop(0, M.hi); rim.addColorStop(0.45, M.mid); rim.addColorStop(1, M.lo);
  g.fillStyle = rim;
  hexPath(g, cx, cy, r); g.fill();

  // recessed face
  const face = g.createLinearGradient(cx, cy - r, cx, cy + r);
  face.addColorStop(0, M.lo); face.addColorStop(1, M.mid);
  g.fillStyle = face;
  hexPath(g, cx, cy, r * 0.78); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = Math.max(1, size * 0.02);
  hexPath(g, cx, cy, r * 0.78); g.stroke();

  // glyph in relief: dark offset copy, then the lit glyph
  const gs = r * 1.15;
  const lit = locked ? 'rgba(160,170,182,0.55)' : M.hi;
  g.globalAlpha = 0.55;
  g.drawImage(glyph(iconKind, gs, '#000'), cx - gs / 2 + size * 0.012, cy - gs / 2 + size * 0.02, gs, gs);
  g.globalAlpha = 1;
  g.drawImage(glyph(iconKind, gs, lit), cx - gs / 2, cy - gs / 2, gs, gs);

  // top-edge shine
  g.save();
  hexPath(g, cx, cy, r); g.clip();
  g.fillStyle = 'rgba(255,255,255,0.16)';
  g.beginPath(); g.ellipse(cx - r * 0.2, cy - r * 0.75, r * 0.9, r * 0.35, -0.3, 0, Math.PI * 2); g.fill();
  g.restore();

  if (state === 'locked') {
    // padlock, drawn — the emoji rendered differently on every phone
    const lx = cx + r * 0.55, ly = cy + r * 0.5, ls = size * 0.16;
    g.fillStyle = '#0d1014';
    g.beginPath(); g.arc(lx, ly, ls * 1.05, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#c9d0d8'; g.lineWidth = Math.max(1.2, ls * 0.22);
    g.beginPath(); g.arc(lx, ly - ls * 0.18, ls * 0.34, Math.PI, 0); g.stroke();
    g.fillStyle = '#c9d0d8';
    g.fillRect(lx - ls * 0.5, ly - ls * 0.16, ls, ls * 0.72);
  } else if (state === 'claimed') {
    // check seal
    const lx = cx + r * 0.55, ly = cy + r * 0.5, ls = size * 0.16;
    g.fillStyle = '#2f8f4e';
    g.beginPath(); g.arc(lx, ly, ls * 1.05, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#eafff0'; g.lineWidth = Math.max(1.4, ls * 0.26); g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(lx - ls * 0.45, ly); g.lineTo(lx - ls * 0.1, ly + ls * 0.35); g.lineTo(lx + ls * 0.5, ly - ls * 0.35); g.stroke();
  }
}

// Paints a medal into a canvas element at its CSS size (DPR-aware).
export function paintMedalCanvas(cv, tierKey, iconKind, state) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const s = cv.clientWidth || 56;
  cv.width = s * dpr; cv.height = s * dpr;
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, s, s);
  drawMedal(g, s, tierKey, iconKind, state);
}
