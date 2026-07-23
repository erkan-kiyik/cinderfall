// Environment prop & facade painters. Everything is painted per-instance with
// its own deterministic wear (no two barrels rust the same way) and shares the
// dusk-industrial palette: warm top light, cool shadow, painted AO at contact.

import {
  makeSprite, makeCanvas, lingrad, radgrad, rr, grunge, streaks, scratches,
  ao, rivet, rim, shade, mix, withA, COL,
} from './paint.js';
import { makeRng } from '../engine/math.js';

let seedCounter = 77;
const nextRng = () => makeRng((seedCounter += 1013));

// ---------------- shipping container ----------------
// w×h world units, anchor bottom-center. Corrugated walls, door end, stencil.
export function container(colorKey = 'containerRed', label = 'HLC-407', w = 108, h = 44) {
  const rng = nextRng();
  const base = COL[colorKey] || colorKey;
  return makeSprite(w, h + 4, w / 2, h + 2, (g) => {
    const y0 = 2;
    // body
    g.fillStyle = lingrad(g, 0, y0, 0, y0 + h, [
      [0, shade(base, 0.18)], [0.3, shade(base, 0.02)], [1, shade(base, -0.36)],
    ]);
    g.fillRect(0, y0, w, h);
    // corrugation
    for (let x = 4; x < w - 4; x += 5) {
      g.fillStyle = 'rgba(0,0,0,0.16)';
      g.fillRect(x, y0 + 2, 1.6, h - 4);
      g.fillStyle = 'rgba(255,235,205,0.07)';
      g.fillRect(x + 2.6, y0 + 2, 1.2, h - 4);
    }
    // corner posts + top rail
    g.fillStyle = shade(base, -0.45);
    g.fillRect(0, y0, 3.5, h); g.fillRect(w - 3.5, y0, 3.5, h);
    g.fillStyle = lingrad(g, 0, y0 - 0.5, 0, y0 + 3, [[0, shade(base, 0.3)], [1, shade(base, -0.05)]]);
    g.fillRect(0, y0, w, 3);
    // door end (right): hinges, lock rods, handles
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.fillRect(w - 22, y0 + 2, 18, h - 4);
    for (let i = 0; i < 2; i++) {
      const dx = w - 18 + i * 8;
      g.fillStyle = shade(base, -0.2);
      g.fillRect(dx, y0 + 2, 1.8, h - 4);
      g.fillStyle = '#22201c';
      g.fillRect(dx - 0.6, y0 + h * 0.35, 3, 2.4);
      g.fillRect(dx - 0.6, y0 + h * 0.6, 3, 2.4);
    }
    // stencil label + ID
    g.fillStyle = 'rgba(235,230,215,0.5)';
    g.font = 'bold 5px monospace';
    g.fillText(label, 8, y0 + 9);
    g.font = '3.5px monospace';
    g.fillText('MAX GROSS 30,480 KG', 8, y0 + h - 5);
    g.fillStyle = 'rgba(235,230,215,0.32)';
    g.fillRect(8, y0 + 11, 22, 0.8);
    // hazard diamond
    g.save();
    g.translate(w * 0.55, y0 + h * 0.45); g.rotate(Math.PI / 4);
    g.strokeStyle = 'rgba(230,220,200,0.35)'; g.lineWidth = 1;
    g.strokeRect(-4, -4, 8, 8);
    g.restore();
    // weathering
    streaks(g, 0, y0, w, h, rng, { n: 14, color: 'rgba(48,30,18,0.22)', wMax: 3 });
    grunge(g, 0, y0, w, h, rng, { n: 160, dark: 0.14 });
    scratches(g, 2, y0 + 2, w - 4, h - 4, rng, { n: 14 });
    rim(g, 0, y0, w, h);
    ao(g, w / 2, y0 + h + 1, w * 0.55, 5, 0.4);
  });
}

// ---------------- barrels ----------------
export function barrel(variant = 'rust') {
  const rng = nextRng();
  const base = variant === 'red' ? '#8a3b2e' : variant === 'blue' ? '#3d5161' : '#5c5a4a';
  return makeSprite(16, 22, 8, 21, (g) => {
    g.fillStyle = lingrad(g, 1, 0, 15, 0, [
      [0, shade(base, -0.3)], [0.28, shade(base, 0.2)], [0.55, base], [1, shade(base, -0.42)],
    ]);
    rr(g, 1, 1, 14, 20, 2); g.fill();
    // ribs
    for (const y of [6, 12]) {
      g.fillStyle = 'rgba(0,0,0,0.28)';
      g.fillRect(1, y, 14, 1.8);
      g.fillStyle = 'rgba(255,240,210,0.12)';
      g.fillRect(1, y - 0.8, 14, 0.8);
    }
    // lid
    g.fillStyle = lingrad(g, 0, 0.4, 0, 2.6, [[0, shade(base, 0.28)], [1, shade(base, -0.1)]]);
    g.beginPath(); g.ellipse(8, 2, 7, 1.8, 0, 0, Math.PI * 2); g.fill();
    if (variant === 'red') {
      // flammable marking
      g.fillStyle = 'rgba(240,230,205,0.55)';
      g.font = 'bold 3.2px monospace';
      g.fillText('FLAM', 4.4, 10.5);
      g.save(); g.translate(8, 16); g.rotate(Math.PI / 4);
      g.strokeStyle = 'rgba(240,230,205,0.4)'; g.lineWidth = 0.8;
      g.strokeRect(-2.4, -2.4, 4.8, 4.8);
      g.restore();
    }
    streaks(g, 1, 2, 14, 18, rng, { n: 6, color: 'rgba(70,40,20,0.3)', wMax: 2 });
    grunge(g, 1, 1, 14, 20, rng, { n: 60 });
    ao(g, 8, 21, 9, 3, 0.4);
  });
}

// ---------------- wooden crate ----------------
export function crate(w = 30, h = 25) {
  const rng = nextRng();
  const base = COL.woodCrate;
  return makeSprite(w, h + 3, w / 2, h + 1.5, (g) => {
    g.fillStyle = lingrad(g, 0, 0, 0, h, [
      [0, shade(base, 0.14)], [0.5, shade(base, -0.06)], [1, shade(base, -0.32)],
    ]);
    g.fillRect(0.5, 0.5, w - 1, h);
    // planks
    g.strokeStyle = 'rgba(40,28,14,0.5)'; g.lineWidth = 0.8;
    for (let i = 1; i < 3; i++) {
      g.beginPath(); g.moveTo(1, (h / 3) * i); g.lineTo(w - 1, (h / 3) * i + rng.range(-0.5, 0.5)); g.stroke();
    }
    // frame
    g.fillStyle = shade(base, -0.18);
    g.fillRect(0.5, 0.5, 3, h); g.fillRect(w - 3.5, 0.5, 3, h);
    g.fillRect(0.5, 0.5, w - 1, 2.6); g.fillRect(0.5, h - 2.1, w - 1, 2.6);
    // wood grain
    g.strokeStyle = 'rgba(60,44,22,0.3)'; g.lineWidth = 0.4;
    for (let i = 0; i < 6; i++) {
      const y = rng.range(4, h - 4);
      g.beginPath(); g.moveTo(rng.range(4, 8), y);
      g.quadraticCurveTo(w / 2, y + rng.range(-1, 1), w - rng.range(4, 8), y);
      g.stroke();
    }
    // stencil
    g.fillStyle = 'rgba(45,32,16,0.6)';
    g.font = 'bold 4px monospace';
    g.fillText('9-C', w / 2 - 4, h / 2 + 1.6);
    for (const [nx, ny] of [[2, 2], [w - 2, 2], [2, h - 1], [w - 2, h - 1]]) rivet(g, nx, ny, 0.8);
    grunge(g, 1, 1, w - 2, h - 1, rng, { n: 50 });
    rim(g, 0, 0, w, h, { top: 0.14, bottom: 0.26 });
    ao(g, w / 2, h + 1, w * 0.55, 3, 0.38);
  });
}

// ---------------- sandbag emplacement ----------------
export function sandbags(scale = 1) {
  const rng = nextRng();
  return makeSprite(40 * scale, 18 * scale, 20 * scale, 17 * scale, (g) => {
    g.scale(scale, scale);
    const bag = (x, y, w, h, rot) => {
      g.save(); g.translate(x, y); g.rotate(rot);
      g.fillStyle = lingrad(g, 0, -h / 2, 0, h / 2, [
        [0, shade(COL.khaki, 0.12)], [0.5, shade(COL.khaki, -0.08)], [1, shade(COL.khaki, -0.3)],
      ]);
      rr(g, -w / 2, -h / 2, w, h, h / 2.2); g.fill();
      g.strokeStyle = 'rgba(50,40,22,0.4)'; g.lineWidth = 0.5;
      rr(g, -w / 2, -h / 2, w, h, h / 2.2); g.stroke();
      g.strokeStyle = 'rgba(255,240,210,0.14)'; g.lineWidth = 0.7;
      g.beginPath(); g.moveTo(-w / 2 + 2, -h / 2 + 1.2); g.quadraticCurveTo(0, -h / 2, w / 2 - 2, -h / 2 + 1.4); g.stroke();
      g.restore();
    };
    bag(8, 14.5, 14, 6, -0.04); bag(21, 14.8, 13, 6, 0.05); bag(33, 14.4, 12, 6, -0.06);
    bag(11, 9.6, 13, 6, 0.06); bag(24, 9.4, 14, 6, -0.05); bag(34, 10, 10, 5.6, 0.08);
    bag(16, 4.8, 14, 6, -0.03); bag(28, 5.2, 12, 6, 0.06);
    grunge(g, 2, 2, 36, 14, rng, { n: 60 });
    ao(g, 20, 17, 20, 3, 0.4);
  });
}

// ---------------- street lamp ----------------
export function lamp() {
  const rng = nextRng();
  // anchor at base; light head at (14, -86) relative to anchor
  return makeSprite(30, 92, 6, 90, (g) => {
    // pole
    g.fillStyle = lingrad(g, 4, 0, 9, 0, [
      [0, '#22252a'], [0.4, '#4e545c'], [1, '#191b1f'],
    ]);
    g.fillRect(4.6, 6, 3.2, 82);
    g.fillStyle = '#2a2d33';
    rr(g, 2.6, 86, 7.2, 4, 1); g.fill();
    // arm
    g.strokeStyle = '#3a3e45'; g.lineWidth = 2.6;
    g.beginPath(); g.moveTo(6.2, 8); g.quadraticCurveTo(7, 2.4, 18, 3); g.stroke();
    // head + lens
    g.fillStyle = lingrad(g, 0, 1, 0, 6.4, [[0, '#4a4f57'], [1, '#22242a']]);
    rr(g, 15.5, 1.2, 9.5, 4.6, 1.6); g.fill();
    g.fillStyle = 'rgba(255,214,150,0.95)';
    rr(g, 16.6, 4.6, 7.2, 1.6, 0.8); g.fill();
    // service panel + sticker
    g.fillStyle = '#15171a';
    g.fillRect(4.9, 60, 2.6, 6);
    g.fillStyle = 'rgba(200,180,60,0.5)';
    g.fillRect(4.9, 44, 2.6, 3);
    streaks(g, 4.6, 10, 3.2, 70, rng, { n: 3, color: 'rgba(60,40,22,0.35)', wMax: 1.4 });
    ao(g, 6, 90, 8, 2.6, 0.4);
  });
}

// ---------------- power pole with crossarm ----------------
export function powerPole() {
  const rng = nextRng();
  return makeSprite(34, 110, 17, 108, (g) => {
    g.fillStyle = lingrad(g, 14, 0, 20, 0, [
      [0, '#2e2822'], [0.4, '#54493c'], [1, '#221d18'],
    ]);
    g.fillRect(15, 4, 4, 104);
    // wood grain
    g.strokeStyle = 'rgba(30,22,14,0.5)'; g.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      const x = 15.6 + rng() * 2.6;
      g.beginPath(); g.moveTo(x, 8); g.lineTo(x + rng.range(-1, 1), 100); g.stroke();
    }
    // crossarms + insulators
    for (const y of [8, 20]) {
      g.fillStyle = '#463c30';
      g.fillRect(2, y, 30, 2.6);
      g.fillStyle = '#3a332a';
      g.fillRect(2, y + 2.6, 30, 0.8);
      for (const x of [4, 12, 22, 29]) {
        g.fillStyle = '#565e66';
        rr(g, x - 1, y - 3.4, 2, 3.6, 0.8); g.fill();
      }
    }
    // transformer can
    g.fillStyle = lingrad(g, 0, 30, 0, 44, [[0, '#494e44'], [1, '#26291f']]);
    rr(g, 8, 30, 7.5, 13, 1.6); g.fill();
    g.strokeStyle = '#191b16'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(11.6, 30); g.lineTo(13, 22.6); g.stroke();
    streaks(g, 8, 32, 7.5, 11, rng, { n: 4, color: 'rgba(60,40,20,0.3)', wMax: 1.6 });
    ao(g, 17, 108, 9, 2.6, 0.4);
  });
}

// ---------------- chain-link fence segment ----------------
export function fence(w = 70) {
  const rng = nextRng();
  return makeSprite(w, 42, w / 2, 41, (g) => {
    // posts
    for (const x of [1.5, w - 2.5]) {
      g.fillStyle = lingrad(g, x, 0, x + 2, 0, [[0, '#565c64'], [1, '#23262b']]);
      g.fillRect(x, 2, 2.2, 38);
    }
    // rails
    g.fillStyle = '#3c4148';
    g.fillRect(1.5, 3, w - 3, 1.6);
    g.fillRect(1.5, 36.5, w - 3, 1.4);
    // mesh
    g.strokeStyle = 'rgba(150,158,168,0.4)'; g.lineWidth = 0.45;
    for (let x = -40; x < w + 6; x += 4.6) {
      g.beginPath(); g.moveTo(x, 4); g.lineTo(x + 34, 37); g.stroke();
      g.beginPath(); g.moveTo(x + 34, 4); g.lineTo(x, 37); g.stroke();
    }
    // sagging top + torn patch
    g.strokeStyle = 'rgba(120,128,138,0.5)'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(2, 4.4); g.quadraticCurveTo(w / 2, 6.8, w - 2, 4.6); g.stroke();
    g.strokeStyle = 'rgba(9,10,12,0.6)';
    g.beginPath();
    g.moveTo(w * 0.6, 20);
    g.quadraticCurveTo(w * 0.66, 27, w * 0.58, 34);
    g.stroke();
    ao(g, w / 2, 41, w / 2, 2.6, 0.3);
  });
}

// ---------------- dumpster ----------------
export function dumpster() {
  const rng = nextRng();
  const base = '#3f4d42';
  return makeSprite(40, 28, 20, 27, (g) => {
    g.fillStyle = lingrad(g, 0, 4, 0, 26, [
      [0, shade(base, 0.14)], [0.4, base], [1, shade(base, -0.38)],
    ]);
    g.beginPath();
    g.moveTo(2, 6); g.lineTo(38, 6); g.lineTo(36.5, 25.5); g.lineTo(3.5, 25.5);
    g.closePath(); g.fill();
    // open lid leaning back + trash
    g.fillStyle = shade(base, -0.22);
    g.beginPath();
    g.moveTo(2, 6.5); g.lineTo(10, 0.8); g.lineTo(34, 1); g.lineTo(38, 6);
    g.closePath(); g.fill();
    g.fillStyle = '#1c1e1b';
    g.beginPath(); g.moveTo(6, 6); g.lineTo(34, 6); g.lineTo(33, 4); g.lineTo(7, 4); g.closePath(); g.fill();
    // bags poking out
    g.fillStyle = '#22242a';
    g.beginPath(); g.ellipse(14, 4.6, 4.4, 2.6, 0.2, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(24, 4.2, 5, 3, -0.15, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(200,205,215,0.16)';
    g.beginPath(); g.ellipse(13, 3.6, 2, 1, 0.2, 0, Math.PI * 2); g.fill();
    // side ribs + pocket
    g.fillStyle = 'rgba(0,0,0,0.2)';
    for (const x of [10, 19, 28]) g.fillRect(x, 8, 2, 16);
    g.fillStyle = shade(base, -0.3);
    g.fillRect(4, 19, 8, 4.6);
    // stencil
    g.fillStyle = 'rgba(225,220,205,0.4)';
    g.font = 'bold 3.6px monospace';
    g.fillText('CWD 09', 15, 14);
    // wheels
    g.fillStyle = '#17181a';
    g.beginPath(); g.arc(7, 26, 2, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(33, 26, 2, 0, Math.PI * 2); g.fill();
    streaks(g, 2, 7, 36, 18, rng, { n: 8, color: 'rgba(40,28,14,0.3)', wMax: 2.2 });
    grunge(g, 2, 6, 36, 19, rng, { n: 80 });
    ao(g, 20, 27, 21, 3, 0.42);
  });
}

// ---------------- tire stack ----------------
export function tires() {
  const rng = nextRng();
  return makeSprite(20, 18, 10, 17, (g) => {
    for (let i = 0; i < 3; i++) {
      const y = 14.4 - i * 5;
      const off = rng.range(-1.2, 1.2);
      g.fillStyle = lingrad(g, 0, y - 3, 0, y + 3, [[0, '#33353a'], [0.5, '#232529'], [1, '#121316']]);
      g.beginPath(); g.ellipse(10 + off, y, 8.6, 3.2, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#0d0e10';
      g.beginPath(); g.ellipse(10 + off, y - 0.4, 3.6, 1.2, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(200,205,215,0.1)'; g.lineWidth = 0.7;
      g.beginPath(); g.ellipse(10 + off, y - 1.4, 7.4, 2.2, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    }
    ao(g, 10, 17, 10.5, 2.6, 0.4);
  });
}

// ---------------- trash / rubble pile ----------------
export function rubble() {
  const rng = nextRng();
  return makeSprite(30, 10, 15, 9, (g) => {
    for (let i = 0; i < 16; i++) {
      const x = rng.range(2, 28), y = rng.range(4, 8.4);
      const s = rng.range(1.4, 4);
      g.save(); g.translate(x, y); g.rotate(rng.range(0, 3));
      g.fillStyle = shade(COL.concreteDark, rng.range(-0.3, 0.2));
      g.fillRect(-s / 2, -s / 3, s, s * 0.6);
      g.fillStyle = 'rgba(255,235,205,0.1)';
      g.fillRect(-s / 2, -s / 3, s, s * 0.16);
      g.restore();
    }
    // rebar
    g.strokeStyle = '#4a3a2c'; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(6, 8); g.quadraticCurveTo(14, 0.6, 24, 4); g.stroke();
    ao(g, 15, 9, 15, 2.6, 0.36);
  });
}

// ---------------- street sign ----------------
export function sign(kind = 'sector') {
  const rng = nextRng();
  return makeSprite(26, 56, 13, 54, (g) => {
    g.fillStyle = lingrad(g, 12, 0, 15, 0, [[0, '#4c525a'], [1, '#1e2126']]);
    g.fillRect(12, 4, 2.6, 50);
    if (kind === 'sector') {
      g.save();
      g.translate(13, 10); g.rotate(-0.02);
      g.fillStyle = lingrad(g, 0, -7, 0, 7, [[0, '#5d6a55'], [1, '#39422f']]);
      rr(g, -12, -7, 24, 14, 1.4); g.fill();
      g.strokeStyle = 'rgba(230,228,215,0.6)'; g.lineWidth = 0.8;
      rr(g, -10.8, -5.8, 21.6, 11.6, 1); g.stroke();
      g.fillStyle = 'rgba(232,230,218,0.85)';
      g.font = 'bold 4.6px monospace';
      g.textAlign = 'center';
      g.fillText('SECTOR 9', 0, -0.6);
      g.font = '3.2px monospace';
      g.fillText('CINDER WORKS', 0, 4);
      g.textAlign = 'left';
      g.restore();
    } else {
      g.save();
      g.translate(13, 12); g.rotate(0.04);
      g.fillStyle = lingrad(g, 0, -8, 0, 8, [[0, '#a08428'], [1, '#6e5716']]);
      rr(g, -9, -9, 18, 18, 1.2); g.fill();
      g.fillStyle = 'rgba(20,18,10,0.85)';
      g.font = 'bold 4px monospace'; g.textAlign = 'center';
      g.fillText('DANGER', 0, -1.4);
      g.font = '2.8px monospace';
      g.fillText('HIGH VOLTAGE', 0, 3);
      g.textAlign = 'left';
      // bullet holes
      for (let i = 0; i < 2; i++) {
        const bx = rng.range(-6, 6), by = rng.range(-6, 6);
        g.fillStyle = '#141210';
        g.beginPath(); g.arc(bx, by, 0.9, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255,240,210,0.3)'; g.lineWidth = 0.4;
        g.beginPath(); g.arc(bx, by, 1.3, 0, Math.PI * 2); g.stroke();
      }
      g.restore();
    }
    streaks(g, 12, 14, 2.6, 38, rng, { n: 2, color: 'rgba(60,40,22,0.4)', wMax: 1.2 });
    ao(g, 13, 54, 7, 2.2, 0.36);
  });
}

// ---------------- loading dock platform (walkable) ----------------
export function dock(w = 160, h = 42) {
  const rng = nextRng();
  return makeSprite(w, h + 3, w / 2, h, (g) => {
    // concrete deck
    g.fillStyle = lingrad(g, 0, 0, 0, 8, [
      [0, shade(COL.concrete, 0.12)], [1, shade(COL.concrete, -0.12)],
    ]);
    g.fillRect(0, 0, w, 8);
    // yellow safety edge, chipped
    g.fillStyle = 'rgba(178,150,52,0.75)';
    g.fillRect(0, 0, w, 2);
    for (let i = 0; i < 14; i++) {
      g.fillStyle = withA(COL.concrete, 0.9);
      g.fillRect(rng() * w, 0, rng.range(1, 3.4), rng.range(0.6, 1.8));
    }
    // face: shuttered bays + concrete piers
    g.fillStyle = lingrad(g, 0, 8, 0, h, [
      [0, shade(COL.concreteDark, -0.16)], [1, shade(COL.concreteDark, -0.5)],
    ]);
    g.fillRect(0, 8, w, h - 8);
    const bays = Math.floor(w / 54);
    for (let b = 0; b < bays; b++) {
      const bx = 14 + b * 54;
      g.fillStyle = lingrad(g, 0, 10, 0, h - 2, [[0, '#4b5058'], [1, '#25282d']]);
      g.fillRect(bx, 11, 34, h - 13);
      g.fillStyle = 'rgba(0,0,0,0.25)';
      for (let y = 13; y < h - 4; y += 3.4) g.fillRect(bx, y, 34, 1.2);
      g.fillStyle = 'rgba(255,236,205,0.06)';
      for (let y = 12; y < h - 5; y += 3.4) g.fillRect(bx, y, 34, 0.7);
      // bumpers
      g.fillStyle = '#1a1b1e';
      g.fillRect(bx - 5, h - 10, 4, 8);
      g.fillRect(bx + 35, h - 10, 4, 8);
    }
    // cracks + stains
    g.strokeStyle = 'rgba(20,20,18,0.4)'; g.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      let cx = rng() * w, cy = 8;
      g.beginPath(); g.moveTo(cx, cy);
      for (let s = 0; s < 4; s++) { cx += rng.range(-6, 6); cy += rng.range(4, 9); g.lineTo(cx, cy); }
      g.stroke();
    }
    streaks(g, 0, 8, w, h - 8, rng, { n: 18, color: 'rgba(30,28,24,0.3)', wMax: 3 });
    grunge(g, 0, 0, w, h, rng, { n: 200 });
    rim(g, 0, 0, w, h, { top: 0.12, bottom: 0.24 });
  });
}

// ---------------- warehouse facade (near-background strip) ----------------
// A long painted building wall that sits directly behind the gameplay layer:
// panel walls, roller doors, lit/dark windows, pipes, vents, an open storage
// bay with interior shelving, roofline against the sky.
export function facade(wid = 560, hei = 190, opts = {}) {
  const rng = nextRng();
  const panel = opts.brick ? COL.brick : COL.metalPanel;
  return makeSprite(wid, hei, 0, hei, (g) => {
    // wall base
    g.fillStyle = lingrad(g, 0, 0, 0, hei, [
      [0, shade(panel, 0.05)], [0.55, shade(panel, -0.14)], [1, shade(panel, -0.4)],
    ]);
    g.fillRect(0, 0, wid, hei);

    if (opts.brick) {
      g.strokeStyle = 'rgba(30,20,14,0.25)'; g.lineWidth = 0.5;
      for (let y = 6; y < hei; y += 6) {
        g.beginPath(); g.moveTo(0, y); g.lineTo(wid, y); g.stroke();
      }
      for (let y = 6; y < hei; y += 6) {
        for (let x = ((y / 6) % 2) * 7; x < wid; x += 14) {
          g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 6); g.stroke();
        }
      }
    } else {
      // vertical metal panels
      for (let x = 0; x < wid; x += 22) {
        g.fillStyle = 'rgba(0,0,0,0.18)';
        g.fillRect(x, 0, 1.6, hei);
        g.fillStyle = 'rgba(235,240,250,0.05)';
        g.fillRect(x + 2, 0, 1, hei);
      }
    }

    // roofline parapet + cap
    g.fillStyle = shade(panel, -0.42);
    g.fillRect(0, 0, wid, 7);
    g.fillStyle = 'rgba(255,220,170,0.2)';
    g.fillRect(0, 0, wid, 1.4);

    // high windows: mix of lit (warm interior) and dark/broken
    const winY = 26;
    for (let x = 24; x < wid - 50; x += 68) {
      const lit = rng.chance(0.45);
      const broken = !lit && rng.chance(0.35);
      g.fillStyle = '#1a1d22';
      rr(g, x - 2, winY - 2, 42, 26, 1.4); g.fill();
      if (lit) {
        g.fillStyle = lingrad(g, 0, winY, 0, winY + 22, [
          [0, 'rgba(255,206,130,0.95)'], [1, 'rgba(200,130,60,0.85)'],
        ]);
        g.fillRect(x, winY, 38, 22);
        // interior silhouettes: shelving + hanging lamp
        g.fillStyle = 'rgba(40,24,10,0.75)';
        g.fillRect(x + 3, winY + 9, 12, 1.6);
        g.fillRect(x + 3, winY + 15, 12, 1.6);
        g.fillRect(x + 4.4, winY + 9, 1.2, 13);
        g.fillRect(x + 12.6, winY + 9, 1.2, 13);
        for (let bx = 0; bx < 3; bx++) g.fillRect(x + 5.5 + bx * 3.2, winY + 5.6 + (bx % 2) * 6, 2.4, 3.2);
        g.fillRect(x + 26, winY, 0.9, 6.5);
        g.beginPath(); g.arc(x + 26.5, winY + 8, 2.6, Math.PI, 0); g.fill();
        g.fillStyle = 'rgba(255,240,200,0.9)';
        g.beginPath(); g.arc(x + 26.5, winY + 8.6, 1.1, 0, Math.PI * 2); g.fill();
      } else {
        g.fillStyle = lingrad(g, 0, winY, 0, winY + 22, [
          [0, '#2c3644'], [1, '#161b22'],
        ]);
        g.fillRect(x, winY, 38, 22);
        // sky reflection streak
        g.fillStyle = 'rgba(150,170,200,0.12)';
        g.beginPath();
        g.moveTo(x + 4, winY); g.lineTo(x + 14, winY); g.lineTo(x + 6, winY + 22); g.lineTo(x, winY + 18);
        g.closePath(); g.fill();
      }
      // mullions
      g.strokeStyle = 'rgba(12,13,16,0.85)'; g.lineWidth = 1.2;
      g.strokeRect(x, winY, 38, 22);
      g.beginPath(); g.moveTo(x + 19, winY); g.lineTo(x + 19, winY + 22); g.stroke();
      g.beginPath(); g.moveTo(x, winY + 11); g.lineTo(x + 38, winY + 11); g.stroke();
      if (broken) {
        g.fillStyle = '#0d0f13';
        g.beginPath();
        g.moveTo(x + 22, winY + 12); g.lineTo(x + 30, winY + 13); g.lineTo(x + 27, winY + 19); g.lineTo(x + 21, winY + 17);
        g.closePath(); g.fill();
        g.strokeStyle = 'rgba(200,215,235,0.35)'; g.lineWidth = 0.4;
        g.beginPath(); g.moveTo(x + 24, winY + 13); g.lineTo(x + 20, winY + 8); g.stroke();
        g.beginPath(); g.moveTo(x + 27, winY + 15); g.lineTo(x + 33, winY + 12); g.stroke();
      }
    }

    // ground-level roller doors + man door + open storage bay
    const gy = hei;
    let x = 30;
    let bayDone = false;
    while (x < wid - 90) {
      if (!bayDone && x > wid * 0.35 && opts.openBay !== false) {
        // open bay: dark interior with shelving, crates, hanging work lamp
        const bw = 88, bh = 74;
        g.fillStyle = lingrad(g, 0, gy - bh, 0, gy, [[0, '#0e1013'], [1, '#191b1a']]);
        g.fillRect(x, gy - bh, bw, bh);
        // interior back wall hint
        g.fillStyle = 'rgba(70,64,52,0.22)';
        g.fillRect(x + 6, gy - bh + 8, bw - 12, bh - 14);
        // shelving racks
        g.fillStyle = 'rgba(16,17,15,0.95)';
        for (const sx of [x + 10, x + 52]) {
          g.fillRect(sx, gy - 52, 26, 2);
          g.fillRect(sx, gy - 34, 26, 2);
          g.fillRect(sx, gy - 16, 26, 2);
          g.fillRect(sx + 1, gy - 52, 2, 52);
          g.fillRect(sx + 23, gy - 52, 2, 52);
          // boxes on shelves
          for (let b = 0; b < 3; b++) {
            g.fillStyle = shade('#5a4c34', rng.range(-0.3, 0.1));
            g.fillRect(sx + 3 + b * 7, gy - 50 + (b % 2) * 18, 5.6, 6.5);
            g.fillStyle = 'rgba(16,17,15,0.95)';
          }
        }
        // hanging work lamp with warm pool
        g.strokeStyle = '#101211'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(x + bw / 2, gy - bh); g.lineTo(x + bw / 2, gy - bh + 14); g.stroke();
        g.fillStyle = '#1c1e1d';
        g.beginPath(); g.arc(x + bw / 2, gy - bh + 16, 4, Math.PI, 0); g.fill();
        const lg = radgrad(g, x + bw / 2, gy - bh + 18, 44, [
          [0, 'rgba(255,200,120,0.5)'], [1, 'rgba(255,180,90,0)'],
        ]);
        g.fillStyle = lg;
        g.fillRect(x, gy - bh, bw, bh);
        g.fillStyle = 'rgba(255,235,190,0.95)';
        g.beginPath(); g.arc(x + bw / 2, gy - bh + 16.6, 1.6, 0, Math.PI * 2); g.fill();
        // door frame
        g.fillStyle = shade(panel, -0.5);
        g.fillRect(x - 3, gy - bh - 6, bw + 6, 6);
        g.fillRect(x - 3, gy - bh - 6, 3, bh + 6);
        g.fillRect(x + bw, gy - bh - 6, 3, bh + 6);
        x += bw + 40;
        bayDone = true;
        continue;
      }
      // closed roller door
      const dw = 62, dh = 66;
      g.fillStyle = lingrad(g, 0, gy - dh, 0, gy, [[0, '#4d525a'], [0.7, '#33373d'], [1, '#212429']]);
      g.fillRect(x, gy - dh, dw, dh);
      g.fillStyle = 'rgba(0,0,0,0.25)';
      for (let y = gy - dh + 4; y < gy - 3; y += 4.4) g.fillRect(x, y, dw, 1.4);
      g.fillStyle = 'rgba(240,245,255,0.05)';
      for (let y = gy - dh + 2.6; y < gy - 4; y += 4.4) g.fillRect(x, y, dw, 0.8);
      g.fillStyle = shade(panel, -0.5);
      g.fillRect(x - 3, gy - dh - 6, dw + 6, 6);
      // stencil number
      g.fillStyle = 'rgba(220,215,200,0.4)';
      g.font = 'bold 7px monospace';
      g.fillText(String(rng.int(1, 9)).padStart(2, '0'), x + dw / 2 - 4, gy - dh + 12);
      x += dw + 46;
    }
    // man door with caged bulb (painted glow; real light added by world)
    const mdX = wid - 60;
    g.fillStyle = lingrad(g, 0, gy - 46, 0, gy, [[0, '#3c342c'], [1, '#221d17']]);
    g.fillRect(mdX, gy - 46, 24, 46);
    g.fillStyle = '#171410';
    g.fillRect(mdX + 17, gy - 26, 2.6, 4);
    g.fillStyle = shade(panel, -0.5);
    g.fillRect(mdX - 2.6, gy - 50, 29, 4.4);
    g.fillStyle = '#22242a';
    g.beginPath(); g.arc(mdX + 12, gy - 54, 3.6, Math.PI, 0); g.fill();
    g.fillStyle = 'rgba(255,220,150,0.9)';
    g.beginPath(); g.arc(mdX + 12, gy - 53, 1.4, 0, Math.PI * 2); g.fill();

    // pipes running along wall
    g.fillStyle = lingrad(g, 0, 88, 0, 94, [[0, '#5a5f52'], [1, '#2b2e26']]);
    g.fillRect(0, 88, wid, 5);
    g.fillStyle = '#3c4036';
    for (let px = 16; px < wid; px += 60) g.fillRect(px, 86.6, 5, 8);
    g.strokeStyle = 'rgba(255,220,170,0.14)'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(0, 88.6); g.lineTo(wid, 88.6); g.stroke();
    // vertical downpipe
    g.fillStyle = lingrad(g, wid * 0.22, 0, wid * 0.22 + 4, 0, [[0, '#4c5044'], [1, '#23251f']]);
    g.fillRect(wid * 0.22, 7, 4, hei - 7);
    // vents
    for (const vx of [wid * 0.12, wid * 0.72]) {
      g.fillStyle = '#2b2e33';
      rr(g, vx, 62, 16, 10, 1.4); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.4)';
      for (let i = 0; i < 4; i++) g.fillRect(vx + 1.6, 63.6 + i * 2, 12.8, 1);
    }

    // grime, streaks, edge wear
    streaks(g, 0, 7, wid, hei - 7, rng, { n: Math.floor(wid / 16), color: 'rgba(24,20,16,0.3)', wMax: 3.4 });
    grunge(g, 0, 0, wid, hei, rng, { n: Math.floor(wid * 1.2), dark: 0.12 });
    // ground contact shadow
    g.fillStyle = lingrad(g, 0, hei - 14, 0, hei, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(4,5,7,0.5)']]);
    g.fillRect(0, hei - 14, wid, 14);
  });
}

// ---------------- ground strip ----------------
// Painted once for the whole map: asphalt road, sidewalk, cracks, oil stains,
// faded lane paint, manholes. Anchor at top-left of strip (y = ground line).
export function groundStrip(w, depth = 80) {
  const rng = nextRng();
  return makeSprite(w, depth, 0, 0, (g) => {
    // asphalt body
    g.fillStyle = lingrad(g, 0, 0, 0, depth, [
      [0, shade(COL.asphalt, 0.06)], [0.25, COL.asphalt], [1, shade(COL.asphalt, -0.4)],
    ]);
    g.fillRect(0, 0, w, depth);
    // top lip catches the warm key light
    g.fillStyle = 'rgba(255,215,165,0.16)';
    g.fillRect(0, 0, w, 1.6);
    g.fillStyle = 'rgba(10,10,12,0.5)';
    g.fillRect(0, 1.6, w, 1);
    // aggregate speckle
    for (let i = 0; i < w * 2.4; i++) {
      g.fillStyle = rng.chance(0.6) ? 'rgba(0,0,0,0.14)' : 'rgba(220,215,200,0.06)';
      g.fillRect(rng() * w, rng() * depth, rng.range(0.5, 1.6), rng.range(0.5, 1.2));
    }
    // faded lane line
    g.fillStyle = 'rgba(190,175,120,0.3)';
    for (let x = 20; x < w; x += 90) g.fillRect(x, 12, 46, 2.6);
    // cracks
    g.strokeStyle = 'rgba(12,12,12,0.55)'; g.lineWidth = 0.8;
    for (let i = 0; i < w / 70; i++) {
      let cx = rng() * w, cy = rng.range(2, 10);
      g.beginPath(); g.moveTo(cx, cy);
      for (let s = 0; s < 5; s++) { cx += rng.range(-10, 10); cy += rng.range(3, 9); g.lineTo(cx, cy); }
      g.stroke();
    }
    // oil stains
    for (let i = 0; i < w / 240; i++) {
      const ox = rng() * w, oy = rng.range(8, depth - 20);
      g.fillStyle = radgrad(g, ox, oy, rng.range(12, 26), [
        [0, 'rgba(10,10,14,0.4)'], [1, 'rgba(10,10,14,0)'],
      ]);
      g.beginPath(); g.arc(ox, oy, 26, 0, Math.PI * 2); g.fill();
    }
    // manholes
    for (let x = 260; x < w; x += 700) {
      g.fillStyle = '#26272a';
      g.beginPath(); g.ellipse(x, 8, 9, 3, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(150,150,145,0.25)'; g.lineWidth = 0.7;
      g.beginPath(); g.ellipse(x, 7.4, 7.4, 2.2, 0, 0, Math.PI * 2); g.stroke();
    }
    // scattered small litter
    for (let i = 0; i < w / 60; i++) {
      const lx = rng() * w, ly = rng.range(3, 14);
      g.fillStyle = `rgba(${rng.int(120, 200)},${rng.int(110, 180)},${rng.int(90, 150)},0.25)`;
      g.fillRect(lx, ly, rng.range(1, 3), rng.range(0.6, 1.4));
    }
  });
}
