// KOR — the pictures the series needs on its surfaces (posters, papers,
// signs, a map), painted in a canvas and handed to the tracer as PNG.
// paint(name) → base64 PNG.
const P = {};
export function paint(name) {
  const p = P[name]; if (!p) throw new Error('no painter ' + name);
  const c = document.createElement('canvas'); c.width = p.w; c.height = p.h;
  const g = c.getContext('2d'); p.draw(g, p.w, p.h, rnd(name.length * 977 + 13));
  return c.toDataURL('image/png').split(',')[1];
}
function rnd(seed) { let s = seed >>> 0 || 1; return () => ((s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 4294967296); }
// grime over a whole picture: blotches and runs
function grime(g, w, h, r, a = 0.25, col = '40,30,22') {
  for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h, rr = (0.03 + r() * 0.12) * w; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, `rgba(${col},${(a * r()).toFixed(3)})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  for (let i = 0; i < 18; i++) { const x = r() * w, y0 = r() * h * 0.6, l = (0.1 + r() * 0.4) * h; const gr = g.createLinearGradient(0, y0, 0, y0 + l); gr.addColorStop(0, `rgba(${col},${(a * 0.6).toFixed(3)})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x, y0, 1 + r() * 3, l); }
}

// the cast house door: a Vanta closure notice, pasted over and rained on
P.sealNotice = { w: 512, h: 720, draw(g, w, h, r) {
  g.fillStyle = '#d8d2c2'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1b1b1b'; g.fillRect(0, 0, w, 120);
  g.fillStyle = '#d8d2c2'; g.font = '700 54px "Courier New", monospace'; g.textAlign = 'center'; g.fillText('KAPATILMIŞTIR', w / 2, 82);
  g.fillStyle = '#1b1b1b'; g.font = '700 30px "Courier New", monospace';
  ['VANTA SENDİKASI', 'KAMU DÜZENİ DAİRESİ', '', "3 NO'LU YÜKSEK FIRIN", 'VE DÖKÜM HOLÜ', '', 'GEÇİCİ GÜVENLİK', 'SÖZLEŞMESİ MD. 4', 'UYARINCA', '', 'GİRİLMEZ'].forEach((l, i) => g.fillText(l, w / 2, 190 + i * 42));
  g.strokeStyle = 'rgba(160,30,26,0.8)'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h - 110, 62, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(w / 2 - 40, h - 128); g.lineTo(w / 2, h - 84); g.lineTo(w / 2 + 40, h - 128); g.stroke();
  grime(g, w, h, r, 0.35);
} };
// stencilled plant numbers
P.stencilYF3 = { w: 512, h: 256, draw(g, w, h) {
  g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(226,220,205,0.92)'; g.font = '700 190px "Arial Narrow", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('YF-3', w / 2, h / 2 + 8);
  // stencil bridges
  g.globalCompositeOperation = 'destination-out'; g.fillRect(0, h / 2 - 4, w, 8);
} };

// paper grain and uneven ink over a page: speckle, a few fibres, a tone that drifts
function paper(g, w, h, r, tone = '216,208,190', a = 0.06) {
  g.fillStyle = `rgb(${tone})`; g.fillRect(0, 0, w, h);
  const id = g.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 255 * a; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9; }
  g.putImageData(id, 0, 0);
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(120,100,60,0.08)'); gr.addColorStop(1, 'rgba(60,50,30,0.0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}
// a fold across a page: a pale line with a shadow on one side
function crease(g, x0, y0, x1, y1, a = 0.18) {
  g.save(); g.lineWidth = 2; g.strokeStyle = `rgba(255,255,250,${a})`; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  g.lineWidth = 3; g.strokeStyle = `rgba(40,30,20,${a * 0.6})`; g.beginPath(); g.moveTo(x0 + 2, y0 + 2); g.lineTo(x1 + 2, y1 + 2); g.stroke(); g.restore();
}
// typed lines: monospace, each character a hair off, the ink not quite even
function typed(g, txt, x, y, r, size = 18, col = '30,28,26') {
  g.font = `${size}px "Courier New", Courier, monospace`;
  let cx = x;
  for (const ch of txt) { g.fillStyle = `rgba(${col},${(0.72 + r() * 0.28).toFixed(2)})`; g.fillText(ch, cx + (r() - 0.5) * 0.8, y + (r() - 0.5) * 0.9); cx += size * 0.6; }
}
// handwriting-ish: a pencil or ballpoint line of text, leaning, the size wandering
function hand(g, txt, x, y, r, size = 22, col = 'rgba(40,40,90,0.85)', rot = -0.03) {
  g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = col; let cx = 0;
  for (const ch of txt) { const s = size * (0.9 + r() * 0.2); g.font = `italic ${s.toFixed(1)}px "Comic Sans MS", "Segoe Print", cursive`; g.fillText(ch, cx, (r() - 0.5) * 2); cx += g.measureText(ch).width * (0.92 + r() * 0.1); }
  g.restore();
}
// spray paint: soft overspray, a hard core, runs where it was too thick
function spray(g, path, r, col = [150, 18, 14], width = 22) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [k, a] of [[2.6, 0.08], [1.6, 0.2], [1, 0.85]]) { g.strokeStyle = `rgba(${col},${a})`; g.lineWidth = width * k; g.beginPath(); path(g); g.stroke(); }
  g.restore();
}
function drips(g, pts, r, col = [150, 18, 14]) {
  for (const [x, y] of pts) { const l = 20 + r() * 90, w = 3 + r() * 4; const gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, `rgba(${col},0.9)`); gr.addColorStop(0.85, `rgba(${col},0.8)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - w / 2, y, w, l); g.beginPath(); g.arc(x, y + l - 3, w * 0.6, 0, Math.PI * 2); g.fillStyle = `rgba(${col},0.7)`; g.fill(); }
}
// tear an edge: clear a ragged strip so a ray passes through
function tear(g, pts) { g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.fill(); g.restore(); }
function ragged(r, x0, y0, x1, y1, n, amp) { const out = []; for (let i = 0; i <= n; i++) { const k = i / n; out.push([x0 + (x1 - x0) * k + (r() - 0.5) * amp, y0 + (y1 - y0) * k + (r() - 0.5) * amp]); } return out; }
// the syndicate's mark: a ring cut by a chevron
function mark(g, cx, cy, R, col, lw) {
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
  g.lineJoin = 'miter'; g.beginPath(); g.moveTo(cx - R * 0.62, cy - R * 0.25); g.lineTo(cx, cy + R * 0.38); g.lineTo(cx + R * 0.62, cy - R * 0.25); g.stroke(); g.restore();
}

// a chain-link fence: galvanised wire in diamonds (8 across a tile), clear between
P.chainlink = { w: 512, h: 512, draw(g, w, h) {
  g.clearRect(0, 0, w, h); const s = 64;
  for (const dir of [1, -1]) for (let k = -16; k <= 16; k++) {
    for (const [lw, c] of [[6, 'rgba(60,62,64,1)'], [3.4, 'rgba(150,152,150,1)'], [1.2, 'rgba(210,212,210,1)']]) {
      g.strokeStyle = c; g.lineWidth = lw; g.beginPath();
      // a zig-zag wire, bending at each crossing
      for (let y = -s; y <= h + s; y += s / 2) { const x = k * s + dir * y + ((y / (s / 2)) & 1 ? dir * 3 : 0); if (y === -s) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
    }
  }
} };

// the syndicate's poster: DÜZEN · GÜVENLİK · İTAAT; rained on, torn, KOR sprayed over it
P.posterVanta = { w: 600, h: 860, draw(g, w, h, r) {
  g.fillStyle = '#1c2630'; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(70,90,110,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  mark(g, w / 2, 250, 130, '#b8bec4', 22);
  g.fillStyle = '#e6e2d8'; g.textAlign = 'center'; g.font = '800 64px "Arial Narrow", Arial, sans-serif';
  g.fillText('DÜZEN', w / 2, 500); g.fillText('GÜVENLİK', w / 2, 575); g.fillStyle = '#c23a2c'; g.fillText('İTAAT', w / 2, 650);
  g.fillStyle = '#9aa4ac'; g.font = '600 20px Arial, sans-serif'; g.fillText('VANTA SENDİKASI · KAMU DÜZENİ DAİRESİ', w / 2, 720);
  g.fillStyle = '#e6e2d8'; g.fillRect(40, 750, w - 80, 2); g.font = '700 24px Arial, sans-serif'; g.fillText('SOKAĞA ÇIKMA YASAĞI 22:00 — 05:00', w / 2, 792);
  g.font = '400 14px Arial, sans-serif'; g.fillStyle = '#7d878f'; g.fillText('İhlaller Geçici Güvenlik Sözleşmesi Md. 4 uyarınca işlem görür.', w / 2, 822);
  grime(g, w, h, r, 0.5, '20,16,12');
  // the rain has lifted the paper at the foot and someone has torn a corner away
  tear(g, [[w, h * 0.62], ...ragged(r, w * 0.78, h * 0.7, w * 0.55, h, 9, 22), [w, h]]);
  tear(g, [[0, h], ...ragged(r, 0, h * 0.93, w * 0.3, h, 6, 12)]);
  tear(g, [[w * 0.2, 0], ...ragged(r, w * 0.3, 0, w * 0.45, h * 0.05, 4, 10), [w * 0.5, 0]]);
  // KOR, sprayed, and the mark of the embers
  g.save(); g.globalCompositeOperation = 'source-atop';
  spray(g, (q) => { q.moveTo(90, 330); q.lineTo(96, 470); q.moveTo(170, 330); q.lineTo(100, 400); q.lineTo(178, 470); q.moveTo(250, 400); q.arc(258, 400, 52, 0, Math.PI * 2); q.moveTo(360, 470); q.lineTo(358, 330); q.quadraticCurveTo(440, 330, 420, 385); q.quadraticCurveTo(400, 410, 362, 400); q.lineTo(440, 472); }, r, [168, 22, 16], 18);
  drips(g, [[96, 478], [178, 478], [262, 456], [440, 480], [300, 430]], r, [150, 18, 14]);
  g.restore();
} };

// the city map on the basement table: printed blocks and roads, pencil and marker over it, folded in eight
P.cityMap = { w: 1200, h: 820, draw(g, w, h, r) {
  paper(g, w, h, r, '226,222,206', 0.05);
  // the harbour basin and the sea along the bottom, the works on the left
  g.fillStyle = 'rgb(176,190,196)'; g.beginPath(); g.moveTo(0, h * 0.8); g.bezierCurveTo(w * 0.3, h * 0.74, w * 0.6, h * 0.86, w, h * 0.78); g.lineTo(w, h); g.lineTo(0, h); g.fill();
  g.fillRect(w * 0.55, h * 0.66, w * 0.22, h * 0.15);
  // blocks: a grid broken by the old town's crooked streets
  for (let y = 40; y < h * 0.76; y += 46 + r() * 20) for (let x = 30; x < w - 30; x += 52 + r() * 26) {
    if (x < w * 0.28 && y > h * 0.35) continue;
    const bw = 34 + r() * 22, bh = 30 + r() * 16; g.fillStyle = `rgb(${196 + r() * 12},${190 + r() * 10},${176 + r() * 8})`; g.save(); g.translate(x, y); g.rotate(x > w * 0.6 ? 0 : (r() - 0.5) * 0.08); g.fillRect(0, 0, bw, bh); g.strokeStyle = 'rgba(90,84,74,0.5)'; g.lineWidth = 1; g.strokeRect(0, 0, bw, bh); g.restore();
  }
  // the works: hatched
  g.save(); g.beginPath(); g.rect(20, h * 0.38, w * 0.26, h * 0.36); g.clip(); g.strokeStyle = 'rgba(80,74,66,0.5)'; for (let k = -h; k < w; k += 10) { g.beginPath(); g.moveTo(k, h * 0.38); g.lineTo(k + h * 0.36, h * 0.74); g.stroke(); } g.restore();
  g.strokeStyle = 'rgba(60,56,50,0.8)'; g.lineWidth = 2; g.strokeRect(20, h * 0.38, w * 0.26, h * 0.36);
  // the main roads
  g.strokeStyle = 'rgba(250,248,240,0.95)'; g.lineWidth = 9; g.beginPath(); g.moveTo(0, h * 0.34); g.lineTo(w, h * 0.3); g.moveTo(w * 0.42, 0); g.lineTo(w * 0.46, h * 0.8); g.stroke();
  g.strokeStyle = 'rgba(90,84,74,0.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, h * 0.34 - 5); g.lineTo(w, h * 0.3 - 5); g.moveTo(0, h * 0.34 + 5); g.lineTo(w, h * 0.3 + 5); g.stroke();
  g.fillStyle = 'rgba(40,36,32,0.9)'; g.font = '700 15px Arial, sans-serif';
  [['OCAK', 60, h * 0.36], ['LİMAN', w * 0.6, h * 0.92], ['KAPI', w * 0.86, h * 0.64], ['PAZAR', w * 0.5, h * 0.2], ['VALİLİK', w * 0.66, h * 0.43], ['KULE', w * 0.86, h * 0.1]].forEach(([t, x, y]) => g.fillText(t, x, y));
  g.font = '400 12px Arial'; g.fillText('Ölçek 1:10 000', w - 140, h - 16);
  // pencil: the route, circles, crosses, notes
  g.strokeStyle = 'rgba(70,70,74,0.75)'; g.lineWidth = 2.2; g.setLineDash([10, 6]); g.beginPath(); g.moveTo(w * 0.88, h * 0.66); g.bezierCurveTo(w * 0.78, h * 0.5, w * 0.62, h * 0.48, w * 0.67, h * 0.45); g.stroke(); g.setLineDash([]);
  g.strokeStyle = 'rgba(176,30,24,0.85)'; g.lineWidth = 3; g.beginPath(); g.ellipse(w * 0.67, h * 0.44, 46, 30, -0.2, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.ellipse(w * 0.88, h * 0.1, 40, 26, 0.1, 0, Math.PI * 2); g.stroke();
  for (const [x, y] of [[w * 0.8, h * 0.56], [w * 0.72, h * 0.5]]) { g.beginPath(); g.moveTo(x - 9, y - 9); g.lineTo(x + 9, y + 9); g.moveTo(x + 9, y - 9); g.lineTo(x - 9, y + 9); g.stroke(); }
  hand(g, '90 sn', w * 0.81, h * 0.6, r, 24, 'rgba(60,60,64,0.85)', -0.1);
  hand(g, 'devriye 22:40', w * 0.7, h * 0.56, r, 18, 'rgba(60,60,64,0.8)', 0.05);
  hand(g, 'kapı — 5 dk', w * 0.84, h * 0.72, r, 20, 'rgba(176,30,24,0.85)', -0.04);
  hand(g, 'kule bakmıyor?', w * 0.78, h * 0.18, r, 20, 'rgba(60,60,64,0.8)', 0.03);
  for (let i = 1; i < 4; i++) crease(g, (w * i) / 4, 0, (w * i) / 4 + 3, h, 0.22);
  crease(g, 0, h / 2, w, h / 2 - 2, 0.22);
  grime(g, w, h, r, 0.12, '90,70,40');
  // a ring where a mug stood
  g.strokeStyle = 'rgba(110,70,40,0.35)'; g.lineWidth = 5; g.beginPath(); g.arc(w * 0.2, h * 0.2, 46, 0.3, Math.PI * 1.85); g.stroke();
} };

// an old photograph: the furnace and its stoves from the yard, the shift in a row in front, small; black and white, a white border, a date in ink
P.photoWorks = { w: 640, h: 460, draw(g, w, h, r) {
  g.fillStyle = '#eceae2'; g.fillRect(0, 0, w, h);
  const bx = 22, by = 22, iw = w - 44, ih = h - 74;
  const sky = g.createLinearGradient(0, by, 0, by + ih); sky.addColorStop(0, '#9a9a96'); sky.addColorStop(0.7, '#cfcfcb'); sky.addColorStop(1, '#8a8a86'); g.fillStyle = sky; g.fillRect(bx, by, iw, ih);
  g.save(); g.beginPath(); g.rect(bx, by, iw, ih); g.clip();
  // smoke, the furnace, the stoves, the gantry
  for (let i = 0; i < 30; i++) { const x = bx + iw * 0.55 + r() * 90, y = by + 30 + r() * 120, rr = 20 + r() * 40; const gg = g.createRadialGradient(x, y, 0, x, y, rr); gg.addColorStop(0, 'rgba(70,70,68,0.25)'); gg.addColorStop(1, 'rgba(70,70,68,0)'); g.fillStyle = gg; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  g.fillStyle = '#3a3a38';
  for (let k = 0; k < 4; k++) { const x = bx + 40 + k * 62; g.fillRect(x, by + ih * 0.35, 46, ih * 0.65); g.beginPath(); g.arc(x + 23, by + ih * 0.35, 23, Math.PI, 0); g.fill(); }
  g.fillStyle = '#2c2c2a'; g.fillRect(bx + iw * 0.6, by + ih * 0.22, 70, ih * 0.78); g.fillRect(bx + iw * 0.57, by + ih * 0.5, 120, ih * 0.5);
  g.beginPath(); g.moveTo(bx + iw * 0.6, by + ih * 0.22); g.lineTo(bx + iw * 0.6 + 35, by + ih * 0.05); g.lineTo(bx + iw * 0.6 + 70, by + ih * 0.22); g.fill();
  g.strokeStyle = '#2c2c2a'; g.lineWidth = 6; g.beginPath(); g.moveTo(bx + iw * 0.68, by + ih * 0.3); g.lineTo(bx + iw, by + ih * 0.62); g.stroke();
  g.fillStyle = '#5a5a56'; g.fillRect(bx, by + ih * 0.86, iw, ih * 0.14);
  // the torpedo cars on the line in front, and the yard
  g.fillStyle = '#262624'; for (let k = 0; k < 4; k++) { const x = bx + 30 + k * 120; g.beginPath(); g.ellipse(x + 50, by + ih * 0.8, 52, 15, 0, 0, Math.PI * 2); g.fill(); g.fillRect(x + 10, by + ih * 0.82, 80, 8); }
  g.fillStyle = 'rgba(200,200,196,0.5)'; g.fillRect(bx, by + ih * 0.9, iw, 2);
  // grain, a little blur of age, the corners darker
  const id = g.getImageData(bx, by, iw, ih), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 40, v = (d[i] + d[i + 1] + d[i + 2]) / 3 + n; d[i] = v * 1.02; d[i + 1] = v; d[i + 2] = v * 0.94; } g.putImageData(id, bx, by);
  const vg = g.createRadialGradient(w / 2, h / 2, ih * 0.3, w / 2, h / 2, iw * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(30,20,10,0.4)'); g.fillStyle = vg; g.fillRect(bx, by, iw, ih);
  g.restore();
  hand(g, 'Ocak başı, 3 nolu — Kasım', bx + 8, h - 22, r, 20, 'rgba(30,40,90,0.75)', 0);
  grime(g, w, h, r, 0.18, '120,96,60'); crease(g, w * 0.7, 0, w * 0.62, h, 0.3);
} };

// the plan on the secretary's desk: KÜL PLANI, typed, stamped, signed
P.kulPlani = { w: 760, h: 1060, draw(g, w, h, r) {
  paper(g, w, h, r, '232,229,220', 0.04);
  g.textAlign = 'left'; g.fillStyle = '#222'; g.font = '700 18px Arial, sans-serif'; g.fillText('VANTA SENDİKASI', 60, 70); g.font = '400 14px Arial'; g.fillText('Kamu Düzeni Dairesi — Sekreterlik', 60, 92);
  g.font = '700 14px Arial'; g.fillText('Sayı: KD-SEK/0417', w - 230, 70); g.fillText('GİZLİ', w - 230, 92);
  g.fillRect(60, 110, w - 120, 2);
  g.font = '800 54px "Arial Narrow", Arial, sans-serif'; g.fillText('KÜL PLANI', 60, 190);
  g.font = '600 18px Arial'; g.fillText('Çelikhane arazisi ve liman sahasının devri — Aşama 3', 60, 224);
  const L = ['1. 3 no\'lu yüksek fırın ve döküm holü yeniden işletmeye', '   açılmayacaktır. Saha boşaltılarak alıcıya teslim edilir.', '2. Liman işletme hakkı, sözleşmenin 6. uzatımıyla birlikte', '   alıcı şirkete devredilir. Meclis onayı aranmaz.', '3. Sahada kalan kayıtlar (Söndürme, Kasım) imha edilir.', '4. Teslim tarihine kadar sokağa çıkma yasağı sürer.', '', 'Parsel   Alan (m²)   Durum', '----------------------------------', 'P-114    212 400     boşaltıldı', 'P-115     88 120     boşaltıldı', 'P-116    146 900     bekliyor', 'L-02     301 000     görüşmede', 'L-03      74 500     görüşmede'];
  L.forEach((l, i) => typed(g, l, 60, 290 + i * 30, r, 17));
  g.font = '400 14px Arial'; g.fillStyle = '#222'; g.fillText('Ek: Alıcı ile yapılan ön protokol (4 sayfa)', 60, 760);
  // signature and a stamp, a little crooked
  g.strokeStyle = 'rgba(20,30,80,0.85)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(470, 880); g.bezierCurveTo(500, 830, 520, 900, 545, 860); g.bezierCurveTo(560, 840, 575, 890, 610, 855); g.lineTo(650, 870); g.stroke();
  g.fillStyle = '#222'; g.font = '400 14px Arial'; g.fillText('Sekreter', 520, 910);
  g.save(); g.translate(240, 880); g.rotate(-0.18); g.strokeStyle = 'rgba(170,30,30,0.75)'; g.lineWidth = 5; g.strokeRect(-110, -36, 220, 72); g.fillStyle = 'rgba(170,30,30,0.75)'; g.font = '800 40px Arial'; g.textAlign = 'center'; g.fillText('GİZLİ', 0, 14); g.restore();
  crease(g, 0, h / 3, w, h / 3 + 2, 0.25); crease(g, 0, (2 * h) / 3, w, (2 * h) / 3 - 2, 0.25);
  grime(g, w, h, r, 0.08, '120,100,70');
} };

// the desk phone's little screen, ringing
P.phoneLCD = { w: 256, h: 96, draw(g, w, h) {
  g.fillStyle = '#4a5a3e'; g.fillRect(0, 0, w, h); g.fillStyle = '#121a0e'; g.font = '700 22px "Courier New", monospace'; g.textAlign = 'center'; g.fillText('GELEN ARAMA', w / 2, 38); g.font = '700 34px "Courier New", monospace'; g.fillText('H.', w / 2, 80);
} };

// HAWK's sign: red tubes on a black box; the A has gone
P.hawkSign = { w: 640, h: 200, draw(g, w, h) {
  g.fillStyle = '#060504'; g.fillRect(0, 0, w, h);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 150px "Arial Narrow", Arial, sans-serif';
  const L = ['H', 'A', 'W', 'K'], xs = [130, 260, 395, 530];
  L.forEach((c, i) => {
    const on = i !== 1;
    g.lineJoin = 'round';
    if (on) { g.strokeStyle = 'rgba(255,60,30,0.35)'; g.lineWidth = 26; g.strokeText(c, xs[i], 104); }
    g.strokeStyle = on ? 'rgba(255,120,90,1)' : 'rgba(70,24,20,1)'; g.lineWidth = 9; g.strokeText(c, xs[i], 104);
    if (on) { g.strokeStyle = 'rgba(255,230,220,1)'; g.lineWidth = 3; g.strokeText(c, xs[i], 104); }
  });
} };

// HAWK's ledger, open: prices in a column, and one line that is not a price
P.ledger = { w: 900, h: 600, draw(g, w, h, r) {
  paper(g, w, h, r, '214,204,178', 0.06);
  g.fillStyle = 'rgba(60,40,20,0.25)'; g.fillRect(w / 2 - 6, 0, 12, h);
  g.strokeStyle = 'rgba(80,110,150,0.4)'; g.lineWidth = 1; for (let y = 60; y < h; y += 30) { g.beginPath(); g.moveTo(20, y); g.lineTo(w - 20, y); g.stroke(); }
  g.strokeStyle = 'rgba(170,40,40,0.5)'; for (const x of [80, w / 2 + 70, w / 2 - 110, w - 110]) { g.beginPath(); g.moveTo(x, 20); g.lineTo(x, h - 20); g.stroke(); }
  const left = [['12.', 'un 25 kg ×6', '2 100'], ['12.', 'ilaç (kutu) ×3', '3 600'], ['13.', 'akü, 2 adet', '1 450'], ['13.', 'sigara, karton', '900'], ['14.', 'telsiz pili', '780'], ['14.', 'mazot 40 lt', '2 300'], ['15.', 'süt tozu', '640'], ['15.', 'K. — borç', '—']];
  const right = [['16.', 'un 25 kg ×4', '1 400'], ['16.', 'ateşleme kablosu', '?'], ['17.', 'yol — 2 kişi', ''], ['17.', 'liman, gece', ''], ['', 'kızım', '']];
  left.forEach((l, i) => { hand(g, l[0], 34, 86 + i * 60, r, 22); hand(g, l[1], 96, 86 + i * 60, r, 22); hand(g, l[2], w / 2 - 100, 86 + i * 60, r, 22); });
  right.forEach((l, i) => { hand(g, l[0], w / 2 + 24, 86 + i * 60, r, 22); hand(g, l[1], w / 2 + 82, 86 + i * 60, r, 22, i >= 2 ? 'rgba(30,30,40,0.9)' : undefined); hand(g, l[2], w - 100, 86 + i * 60, r, 22); });
  g.strokeStyle = 'rgba(30,30,40,0.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2 + 80, 86 + 4 * 60 + 6); g.lineTo(w / 2 + 160, 86 + 4 * 60 + 4); g.stroke();
  grime(g, w, h, r, 0.12, '100,70,40');
} };

// the spines of box files on a shelf, labels typed and handwritten
P.fileSpines = { w: 1024, h: 256, draw(g, w, h, r) {
  const n = 12, bw = w / n, C = ['#2a3640', '#3a2c22', '#2d2f30', '#40392a', '#26302a'];
  for (let i = 0; i < n; i++) {
    const x = i * bw; g.fillStyle = C[(i * 7) % C.length]; g.fillRect(x, 0, bw, h);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x, 0, 2, h);
    g.fillStyle = '#d8d2c0'; g.fillRect(x + 10, 30, bw - 20, 120);
    g.fillStyle = '#1b1b1b'; g.font = '700 16px "Courier New", monospace'; g.textAlign = 'center';
    const lab = [['GÖZALTI', 'K-' + (100 + i * 3)], ['SÖNDÜRME', 'KASIM'], ['SİCİL', String(1203 + i * 41)], ['TUTANAK', 'C. ' + (i + 2)]][i % 4];
    g.fillText(lab[0], x + bw / 2, 70); g.fillText(lab[1], x + bw / 2, 100);
    if (i === 5) { g.fillStyle = 'rgba(170,30,30,0.8)'; g.font = '700 22px Arial'; g.fillText('37', x + bw / 2, 136); }
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.beginPath(); g.arc(x + bw / 2, 200, 12, 0, Math.PI * 2); g.fill();
  }
  grime(g, w, h, r, 0.25, '30,24,18');
} };

// the mark on a wall: the ring and chevron in brushed steel, VANTA under it
P.vantaWall = { w: 800, h: 600, draw(g, w, h) {
  g.clearRect(0, 0, w, h); mark(g, w / 2, 250, 190, 'rgba(190,196,202,1)', 34);
  g.fillStyle = 'rgba(190,196,202,1)'; g.font = '700 86px "Arial Narrow", Arial, sans-serif'; g.textAlign = 'center'; g.fillText('V A N T A', w / 2, 560);
} };

// a station's line sign: the line, the direction, a white arrow on blue enamel, chipped
P.metroSign = { w: 1024, h: 200, draw(g, w, h, r) {
  g.fillStyle = '#123a6a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e8e8e4'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = '#e8e8e4'; g.beginPath(); g.arc(110, h / 2, 56, 0, Math.PI * 2); g.fill(); g.fillStyle = '#123a6a'; g.font = '800 70px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('2', 110, h / 2 + 4);
  g.fillStyle = '#e8e8e4'; g.textAlign = 'left'; g.font = '700 64px Arial'; g.fillText('LİMAN YÖNÜ', 200, h / 2 + 4);
  g.beginPath(); g.moveTo(w - 160, h / 2 - 40); g.lineTo(w - 70, h / 2); g.lineTo(w - 160, h / 2 + 40); g.closePath(); g.fill(); g.fillRect(w - 260, h / 2 - 14, 110, 28);
  for (let i = 0; i < 9; i++) { const x = r() * w, y = r() < 0.5 ? 6 + r() * 14 : h - 6 - r() * 14, s = 2 + r() * 5; g.fillStyle = 'rgba(52,40,30,0.85)'; g.beginPath(); g.ellipse(x, y, s, s * 0.7, r() * 3, 0, Math.PI * 2); g.fill(); }
} };

// a note pinned up in the basement: times and the route, in pencil and biro
P.note = { w: 420, h: 560, draw(g, w, h, r) {
  paper(g, w, h, r, '214,210,196', 0.05);
  g.strokeStyle = 'rgba(120,140,170,0.35)'; g.lineWidth = 1; for (let y = 60; y < h; y += 34) { g.beginPath(); g.moveTo(14, y); g.lineTo(w - 14, y); g.stroke(); }
  const L = [['22:40  devriye — kapı', 'rgba(40,40,60,0.85)'], ['90 sn boşluk', 'rgba(40,40,60,0.85)'], ['kapı 5 dk (W.)', 'rgba(40,40,60,0.85)'], ['çatılar temiz (S.)', 'rgba(40,40,60,0.85)'], ['kule bakmıyor?', 'rgba(40,40,60,0.85)'], ['', ''], ['ocak söner', 'rgba(160,30,24,0.85)'], ['kor kalır', 'rgba(160,30,24,0.85)']];
  L.forEach(([t, c], i) => t && hand(g, t, 26, 52 + i * 34, r, 24, c, (r() - 0.5) * 0.04));
  grime(g, w, h, r, 0.12, '110,90,60'); crease(g, 0, h * 0.5, w, h * 0.5 + 3, 0.2);
} };

// the sign over the gate hut's window: the syndicate's checkpoint plate, enamel, a bolt each corner
P.checkSign = { w: 640, h: 200, draw(g, w, h, r) {
  g.fillStyle = '#d9d5c8'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d2733'; g.fillRect(10, 10, w - 20, h - 20);
  mark(g, 100, h / 2, 56, '#d9d5c8', 12);
  g.fillStyle = '#d9d5c8'; g.textAlign = 'left'; g.textBaseline = 'middle'; let fs = 58; do { g.font = `800 ${fs}px "Arial Narrow", Arial, sans-serif`; fs -= 2; } while (g.measureText('KONTROL NOKTASI').width > w - 210); g.fillText('KONTROL NOKTASI', 178, h / 2 - 20);
  g.font = '600 26px Arial, sans-serif'; g.fillStyle = '#c23a2c'; g.fillText('DUR · KİMLİK HAZIR', 182, h / 2 + 38);
  for (const [x, y] of [[22, 22], [w - 22, 22], [22, h - 22], [w - 22, h - 22]]) { g.fillStyle = '#8a8a84'; g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); }
  grime(g, w, h, r, 0.3, '60,40,24');
} };
