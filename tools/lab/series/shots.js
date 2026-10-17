// KOR — the series: thirty stills along the story, no one in them; the places,
// the light and what was left behind. Each: id, name, cap (the line under it),
// cam { mm, pos, yaw, pitch }, scene(cam, shot) → tracer spec, tex (the
// pictures it needs), air (rain, steam, sparks drawn over it through the same
// camera, in the browser), post (the film look).
import { steelworks } from './scenes/steel.js';
import { harbour } from './scenes/harbour.js';
import { rooftop, towerFoot } from './scenes/city.js';
import { basement, backroom, office, records } from './scenes/rooms.js';
import { fence, castHouse, posterWall, alley, foundry, metro, droneWorks, lobby, embers } from './scenes/places.js';
import { gate, market, governor } from '../plate/scenes.js';
import { K } from './scenes/common.js';
import { rng } from '../../../public/lab/js/cine/noise.js';
import { aim, obox } from './scenes/common.js';

const look = (pos, at, mm) => ({ mm, pos, ...aim(pos, at) });

// rain over a frame: many thin streaks, brighter where the light is
function rain(g, cam, A, { n = 1, col = '#c9d0d8', light = 0.5, wind = 0.6, seed = 3, box = [10, 8, 0.6, 40] } = {}) {
  const R = new A.Rain({ n: [Math.round(1300 * n), Math.round(420 * n), Math.round(40 * n)], box, speed: 8.6, wind, seed });
  for (let i = 0; i < 40; i++) R.update(1 / 30, cam, 0, false);
  R.draw(g, cam, { col, light });
}
// a plume of steam (soft lumpy puffs) rising from p, lit warm from below or cold from the side
function plume(g, cam, A, p, { n = 26, rise = 18, spread = 9, size = 7, col = '#d8c8b8', a = 0.12, seed = 5, lean = [0.4, 0] } = {}) {
  const r = A.rng(seed), sp = A.smokeSprite(seed % 4);
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) {
    const k = i / n, x = p[0] + lean[0] * rise * k + (r() - 0.5) * spread * k, y = p[1] + rise * k + r() * 2, z = p[2] + lean[1] * rise * k + (r() - 0.5) * spread * 0.5 * k;
    const q = cam.project(x, y, z); if (q[2] <= 0) continue;
    const s = (size * (0.4 + k * 1.4)) * q[3], al = a * (1 - k * 0.7);
    g.globalAlpha = al; g.drawImage(A.tinted(sp, col), q[0] - s / 2, q[1] - s / 2, s, s);
  }
  g.restore();
}

// dust in a beam: fine points in a box of air, brighter in the light (lit: a function of the point → 0..1)
function dust(g, cam, A, box, { n = 400, lit = () => 1, col = '255,236,210', size = 1.2, seed = 11 } = {}) {
  const r = A.rng(seed); g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) {
    const p = [box[0] + r() * (box[3] - box[0]), box[1] + r() * (box[4] - box[1]), box[2] + r() * (box[5] - box[2])], k = lit(p); if (k <= 0.02) continue;
    const q = cam.project(...p); if (q[2] <= 0) continue;
    const s = Math.max(0.6, size * q[3] * 0.004), a = Math.min(1, 0.5 * k * (0.4 + r()));
    g.fillStyle = `rgba(${col},${a.toFixed(3)})`; g.beginPath(); g.arc(q[0], q[1], s, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}
// a thin curl of smoke from a point: many small soft puffs along a wandering line
function curl(g, cam, A, p, { n = 60, rise = 0.5, col = '#b8b0a8', a = 0.05, seed = 7, size = 0.03 } = {}) {
  const r = A.rng(seed), sp = A.smokeSprite(seed % 4); g.save(); g.globalCompositeOperation = 'screen';
  let x = p[0], z = p[2];
  for (let i = 0; i < n; i++) { const k = i / n; x += Math.sin(k * 9 + seed) * 0.004 + (r() - 0.5) * 0.004; z += Math.cos(k * 7) * 0.003; const y = p[1] + rise * k; const q = cam.project(x, y, z); if (q[2] <= 0) continue; const s = size * (0.5 + k * 3) * q[3]; g.globalAlpha = a * (1 - k * 0.8); g.drawImage(A.tinted(sp, col), q[0] - s / 2, q[1] - s / 2, s, s); }
  g.restore();
}

// sparks: short bright streaks going up from a bed, the hottest white-yellow, the rest orange
function sparks(g, cam, A, c, { n = 120, spread = 0.2, rise = 0.25, seed = 9, len = 0.012 } = {}) {
  const r = A.rng(seed); g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const h = r() * r() * rise, x = c[0] + (r() - 0.5) * spread * (0.4 + h / rise), z = c[2] + (r() - 0.5) * spread * 0.6, y = c[1] + h, l = len * (0.5 + r());
    const a = cam.project(x, y, z), b = cam.project(x + (r() - 0.5) * l * 0.4, y + l, z); if (a[2] <= 0 || b[2] <= 0) continue;
    const hot = r(), al = (1 - h / rise) * (0.4 + 0.6 * r());
    g.strokeStyle = hot > 0.85 ? `rgba(255,236,190,${al})` : `rgba(255,${(110 + hot * 80) | 0},40,${al})`; g.lineWidth = Math.max(0.7, 0.0007 * a[3]);
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  }
  g.restore();
}
// the title over the embers: KOR, set wide, lit by them; the line under it
function title(g, w, h) {
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  // a little dark under the type, so it reads off the coals
  const sh = g.createRadialGradient(w / 2, h * 0.46, h * 0.05, w / 2, h * 0.46, h * 0.5); sh.addColorStop(0, 'rgba(0,0,0,0.45)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(0, 0, w, h);
  g.font = `600 ${Math.round(h * 0.2)}px "Inter", "Helvetica Neue", Arial, sans-serif`; if ('letterSpacing' in g) g.letterSpacing = `${Math.round(h * 0.06)}px`;
  g.shadowColor = 'rgba(255,120,40,0.5)'; g.shadowBlur = h * 0.05; g.fillStyle = 'rgba(244,226,204,0.96)'; g.fillText('KOR', w / 2 + h * 0.03, h * 0.4);
  g.font = `400 ${Math.round(h * 0.045)}px "Inter", Arial, sans-serif`; if ('letterSpacing' in g) g.letterSpacing = `${Math.round(h * 0.008)}px`;
  g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = h * 0.02; g.fillStyle = 'rgba(240,230,214,0.92)'; g.fillText('Kül olmadı. Kor kaldı.', w / 2, h * 0.6);
  g.restore();
}
// the market after the raid: the stalls knocked about, crates down, fruit in the road, the
// sign dark, a notice pasted on the shutter, a grey cold morning
function marketAfter(cam) {
  const s = market(cam), r = rng(91), P = s.prims;
  s.prims = P.filter((q) => !(q.m === 'tarp' && q.box === undefined && q.hull && q.hull.aabb[2] > 16 && q.hull.aabb[2] < 18.5 && q.hull.aabb[0] > 1));
  for (let k = 0; k < 14; k++) { const x = -2 + r() * 4, z = 8 + r() * 14, a = r() * 3, c = Math.cos(a), sn = Math.sin(a); s.prims.push({ hull: obox([x, 0.16 + (k % 4 === 0 ? 0.32 : 0), z], [[c, 0, sn], [0, 1, 0], [-sn, 0, c]], [0.25, 0.16, 0.18]), m: 'crate', o: { col: [0.34, 0.25, 0.16] } }); }
  const FR = [[0.5, 0.04, 0.02], [0.6, 0.22, 0.02], [0.55, 0.45, 0.04]];
  for (let k = 0; k < 70; k++) s.prims.push({ sph: [-2.5 + r() * 5, 0.036, 9 + r() * 12, 0.036], m: 'fruit', o: { col: FR[k % 3] } });
  s.prims.push({ box: [1.2, 0.0, 19.5, 2.6, 0.02, 21.2], m: 'tarp2' });
  s.mats.fruit = { kind: 'flat', ro: 0.35, wet: 0.4 }; s.mats.tarp2 = { kind: 'cloth', col: [0.35, 0.05, 0.03], folds: 5, wet: 0.6 };
  s.lights = s.lights.filter((l) => !(l.c && l.c[1] === 0.25));
  s.sky = { zen: [0.16, 0.18, 0.2], hor: [0.32, 0.33, 0.34], cloud: 1, cloudCol: [0.2, 0.2, 0.21], scale: 0.4, seed: 52 };
  s.amb = { sky: [0.08, 0.09, 0.1], gnd: [0.025, 0.024, 0.023] }; s.fog = { s: 0.016, g: 0.4, c: [0.12, 0.125, 0.13], sky: 300, k: 1 };
  s.exposure = 1.1; return s;
}
// the market with HAWK's sign lit in its box
function marketSign(cam) {
  const s = market(cam); s.prims.push({ box: [0.12, 3.82, 18.17, 2.88, 4.73, 18.2], m: 'hawk' }); s.mats.hawk = { kind: 'image', tex: 'hawkSign', emit: 2.4, ro: 0.3 };
  return s;
}
// the gate, the hut's window cooler, a television flickering in it
function gateHut(cam) {
  const s = gate(cam); s.mats.hutwin = { ...s.mats.hutwin, e: K(3200, 0.25) }; s.lights.push({ p: [4.3, 1.4, 24.6], c: [0.45, 0.6, 1], I: 0.9, r: 0.15, vol: 0.2 }); return s;
}

const LIST = [
  {
    id: '01', name: 'Söndürme gecesi', cap: 'Dört yıl önce. Üç numaralı fırın son kez yanıyor.',
    cam: look([-60, 1.8, -250], [-10, 26, 0], 50), tex: [],
    scene: (cam) => steelworks(cam, { state: 'hot', floods: [[-260, -330, -10], [-230, -300, 4], [-200, -280, 14]] }),
    air: (g, cam, A) => { plume(g, cam, A, [0, 24, -22], { col: '#e8a070', a: 0.1, rise: 40, spread: 26, size: 14, lean: [0.5, 0.1] }); plume(g, cam, A, [0, 46, 0], { col: '#d89068', a: 0.08, rise: 30, spread: 14, size: 10, seed: 9 }); rain(g, cam, A, { n: 0.5, col: '#e0b090', light: 0.25 }); },
    post: { grain: 0.1, halation: 0.6, lift: [7, 5, 4], warm: 0.06, vignette: 0.6, dirt: 0.4 },
  },
  {
    id: '04', name: 'Ocak soğuk', cap: 'Bugün. Döküm holünün kapısı mühürlü; fırının sacından kireç akıyor.',
    cam: look([20, 1.5, -80], [-2, 13, -26], 28), tex: ['sealNotice'],
    scene: (cam) => steelworks(cam, { state: 'cold' }),
    air: (g, cam, A) => rain(g, cam, A, { n: 1.2, col: '#c7ced6', light: 0.55 }),
    post: { grain: 0.08, halation: 0.35, lift: [6, 7, 8], cool: 0.06, vignette: 0.55, dirt: 0.4 },
  },
  {
    id: '06', name: 'Şehir, çatıdan', cap: 'Bugün. Bacalar dumansız; kulenin ışığı çatıları tarıyor.',
    cam: look([-1.2, 25.7, 5.2], [14, 8, 400], 35), tex: [],
    scene: (cam) => rooftop(cam, {}),
    air: (g, cam, A) => rain(g, cam, A, { n: 1.4, col: '#c4ccd6', light: 0.6, wind: 0.8 }),
    post: { grain: 0.08, halation: 0.5, lift: [5, 6, 8], cool: 0.05, vignette: 0.6, dirt: 0.35 },
  },
  {
    id: '07', name: 'Kule', cap: 'Kule. Vasquez buradan bakar; onu gören olmadı.',
    cam: look([4, 1.3, -40], [0, 42, 60], 14), tex: [],
    scene: (cam) => towerFoot(cam, {}),
    air: (g, cam, A) => rain(g, cam, A, { n: 1.2, col: '#c9d0d8', light: 0.5, wind: 0.4 }),
    post: { grain: 0.08, halation: 0.55, lift: [5, 6, 8], cool: 0.05, vignette: 0.6, dirt: 0.35 },
  },
  {
    id: '14', name: 'Liman, gece', cap: 'Liman Vanta\'nın. Gemi üç gündür yanaşık; vinç hiç durmuyor.',
    cam: look([196, 3.4, -178], [60, 22, -20], 35), tex: [],
    scene: (cam) => harbour(cam, { time: 'night', pierZ: -176 }),
    air: (g, cam, A) => rain(g, cam, A, { n: 1.1, col: '#d0c4b4', light: 0.6, wind: 0.7 }),
    post: { grain: 0.08, halation: 0.5, lift: [6, 6, 7], vignette: 0.6, dirt: 0.35 },
  },
  {
    id: '09', name: 'Bodrum', cap: 'Bodrum. Harita, telsiz, iki kupa. Kapı beş dakika tutulacak.',
    cam: look([0.05, 1.72, -1.25], [0.02, 0.78, 0.08], 32), tex: ['cityMap', 'photoWorks'],
    scene: (cam) => basement(cam, { lampI: 1.1, exposure: 1.1 }),
    air: (g, cam, A) => curl(g, cam, A, [-0.28, 0.81, 0.27], { rise: 0.6, n: 80 }),
    post: { grain: 0.08, halation: 0.4, lift: [5, 4, 3], vignette: 0.7, dirt: 0.12 },
  },
  {
    id: '10', name: 'Atkı', cap: 'Halil Usta\'nın atkısı hâlâ çivide. Fotoğrafın altında: Kasım.',
    cam: look([0.15, 1.5, 1.55], [1.25, 1.3, 3.2], 35), tex: ['cityMap', 'photoWorks', 'note'],
    scene: (cam) => basement(cam, { wallI: 0.9, note: true }),
    air: null,
    post: { grain: 0.08, halation: 0.4, lift: [5, 4, 3], vignette: 0.7, dirt: 0.12 },
  },
  {
    id: '17', name: 'Arka oda', cap: 'HAWK\'ın defteri. Her satırın bir fiyatı var; sonuncunun yok.',
    cam: look([-0.9, 1.55, 0.35], [1.1, 0.95, 3.6], 28), tex: ['ledger'],
    scene: (cam) => backroom(cam, {}),
    air: (g, cam, A) => dust(g, cam, A, [0.4, 0.8, 3.0, 1.9, 1.6, 4.15], { n: 160, size: 0.7, lit: (p) => { const k = (4.2 - p[2]) * 0.85, y0 = 1.0 - k, y1 = 1.56 - k; return p[1] > y0 && p[1] < y1 ? 0.6 : 0; } }),
    post: { grain: 0.08, halation: 0.45, lift: [6, 5, 4], vignette: 0.6, dirt: 0.12 },
  },
  {
    id: '20', name: 'Sekreterin odası', cap: 'Valilik. Sekreter Gall yasakları bu masada imzalar.',
    cam: look([-2.8, 1.65, 0.6], [0.2, 1.1, 5.0], 24), tex: ['kulPlani', 'phoneLCD'],
    scene: (cam) => office(cam, {}),
    air: null,
    post: { grain: 0.07, halation: 0.4, lift: [5, 5, 6], cool: 0.03, vignette: 0.6, dirt: 0.12 },
  },
  {
    id: '21', name: 'Kül Planı', cap: 'Kül Planı. Telefon çalıyor; ekranda tek harf: H.',
    cam: look([-0.12, 1.3, 5.38], [-0.2, 0.76, 4.62], 35), tex: ['kulPlani', 'phoneLCD'],
    scene: (cam) => office(cam, { lampI: 0.6, exposure: 0.85 }),
    air: null,
    post: { grain: 0.07, halation: 0.4, lift: [5, 5, 6], vignette: 0.6, dirt: 0.12 },
  },
  {
    id: '23', name: 'Kayıtlar', cap: 'Dökümhanenin altı. Söndürme gecesi, kutu kutu: otuz yedi kişi.',
    cam: look([0.15, 1.55, 0.3], [0, 1.15, 12], 28), tex: ['fileSpines'],
    scene: (cam) => records(cam, {}),
    air: (g, cam, A) => dust(g, cam, A, [-0.6, 1.0, 3, 0.6, 2.3, 8], { n: 500, lit: (p) => Math.max(0, 1 - Math.hypot(p[0], p[1] - 2.2, p[2] - 5.5) / 1.6) }),
    post: { grain: 0.08, halation: 0.4, lift: [5, 5, 5], vignette: 0.65, dirt: 0.3 },
  },
  {
    id: '02', name: 'Tel örgü', cap: 'Aynı gece. Meşale çamurda yanıyor; kamyonlar yarda.',
    cam: look([0.2, 0.42, 1.3], [0.4, 1.1, 40], 50), tex: ['chainlink'],
    scene: (cam) => fence(cam, {}),
    air: (g, cam, A) => { plume(g, cam, A, [0.86, 0.1, 7.56], { col: '#ff5040', a: 0.07, rise: 2.5, spread: 1.2, size: 0.8, n: 30, lean: [0.1, 0.2], seed: 4 }); rain(g, cam, A, { n: 1.3, col: '#d8d0cc', light: 0.7, wind: 0.5 }); },
    post: { grain: 0.11, halation: 0.7, lift: [8, 5, 4], warm: 0.05, vignette: 0.65, dirt: 0.4 },
  },
  {
    id: '03', name: 'Son döküm', cap: 'Döküm holü, son döküm. Kırk yılın demiri oluklardan akıyor.',
    cam: look([3.6, 0.9, 6.5], [-0.8, 4.6, 28], 20), tex: [],
    scene: (cam) => castHouse(cam, { state: 'hot' }),
    air: (g, cam, A) => { sparks(g, cam, A, [0, 0.5, 26.5], { n: 220, spread: 3, rise: 3.5, len: 0.12 }); plume(g, cam, A, [0, 1.5, 24], { col: '#e09060', a: 0.06, rise: 12, spread: 8, size: 5, n: 30, lean: [0, -0.2] }); },
    post: { grain: 0.11, halation: 0.8, lift: [8, 5, 4], warm: 0.05, vignette: 0.6, dirt: 0.4 },
  },
  {
    id: '05', name: 'Döküm holü, bugün', cap: 'Bugün. Oluklarda demir taş kesilmiş; çivide bir önlük.',
    cam: look([9, 6.5, -6], [0, 0.5, 20], 24), tex: [],
    scene: (cam) => castHouse(cam, { state: 'cold' }),
    air: (g, cam, A) => dust(g, cam, A, [-8, 0.5, 0, 10, 14, 20], { n: 500, size: 1.5, col: '230,232,236', lit: () => 0.3 }),
    post: { grain: 0.08, halation: 0.4, lift: [6, 7, 8], cool: 0.04, vignette: 0.55, dirt: 0.25 },
  },
  {
    id: '08', name: 'Afiş', cap: 'DÜZEN · GÜVENLİK · İTAAT. Üstüne gece biri KOR yazmış.',
    cam: look([0.35, 0.45, -2.6], [-0.4, 1.35, 0], 28), tex: ['posterVanta', 'sealNotice'],
    scene: (cam) => posterWall(cam, {}),
    air: (g, cam, A) => rain(g, cam, A, { n: 1.0, col: '#c8d0d8', light: 0.6, wind: 0.3, box: [5, 5, 0.4, 12] }),
    post: { grain: 0.08, halation: 0.5, lift: [5, 5, 7], vignette: 0.6, dirt: 0.3 },
  },
  {
    id: '11', name: 'Ara sokak', cap: 'Bodrumun kapısı. Devriye doksan saniye önce geçti.',
    cam: look([0.35, 0.55, 0.6], [0.2, 2.6, 30], 32), tex: [],
    scene: (cam) => alley(cam, {}),
    air: (g, cam, A) => { plume(g, cam, A, [0, 0.1, 10.3], { col: '#e8c8a8', a: 0.09, rise: 4, spread: 2, size: 1.6, n: 40, lean: [0.1, 0.05] }); rain(g, cam, A, { n: 1.2, col: '#e0c8a8', light: 0.7, wind: 0.3 }); },
    post: { grain: 0.08, halation: 0.6, lift: [6, 5, 5], vignette: 0.6, dirt: 0.3 },
  },
  {
    id: '12', name: 'Kapı', cap: 'Liman kapısı, gece. Bariyer, kulübe, tek projektör.',
    cam: look([-1.4, 1.55, 4], [0.6, 2.4, 30], 32), tex: [],
    scene: (cam) => gate(cam),
    air: (g, cam, A) => rain(g, cam, A, { n: 1.3, col: '#cdd4dc', light: 0.6, wind: 0.6 }),
    post: { grain: 0.08, halation: 0.5, lift: [5, 6, 8], cool: 0.03, vignette: 0.6, dirt: 0.3 },
  },
  {
    id: '13', name: 'Kulübe', cap: 'Kulübede iki nöbetçi. Kamera yok, sadece göz.',
    cam: look([-1.6, 0.95, 21.3], [3.6, 1.45, 23.9], 35), tex: [],
    scene: (cam) => gateHut(cam),
    air: (g, cam, A) => rain(g, cam, A, { n: 1.3, col: '#cdd4dc', light: 0.6, wind: 0.6, box: [6, 6, 0.4, 20] }),
    post: { grain: 0.08, halation: 0.5, lift: [5, 6, 8], cool: 0.03, vignette: 0.6, dirt: 0.3 },
  },
  {
    id: '15', name: 'Pazar', cap: 'Pazar, sabah altı. Şehre giren her şey HAWK\'tan geçer.',
    cam: look([-0.6, 4.3, 0], [0.3, 1.2, 30], 35), tex: [],
    scene: (cam) => market(cam),
    air: (g, cam, A) => rain(g, cam, A, { n: 0.4, col: '#d8dce0', light: 0.3, wind: 0.2 }),
    post: { grain: 0.07, halation: 0.35, lift: [8, 8, 9], vignette: 0.5, dirt: 0.25 },
  },
  {
    id: '16', name: 'HAWK', cap: 'HAWK. A harfi yıllardır yanmıyor.',
    cam: look([0.3, 0.85, 14.6], [1.5, 4.25, 18.3], 28), tex: ['hawkSign'],
    scene: (cam) => marketSign(cam),
    air: (g, cam, A) => rain(g, cam, A, { n: 0.5, col: '#e0d0d0', light: 0.5, wind: 0.2, box: [6, 6, 0.4, 20] }),
    post: { grain: 0.08, halation: 0.6, lift: [7, 7, 8], vignette: 0.55, dirt: 0.25 },
  },
  {
    id: '18', name: 'Valilik', cap: 'Valilik. Sözleşme altı ayda bir bu kapının ardında uzatılır.',
    cam: look([0, 1.6, 2], [0, 7.6, 34], 28), tex: [],
    scene: (cam) => governor(cam),
    air: (g, cam, A) => rain(g, cam, A, { n: 1.4, col: '#c8d0d8', light: 0.6, wind: 0.5 }),
    post: { grain: 0.08, halation: 0.55, lift: [5, 6, 8], cool: 0.03, vignette: 0.6, dirt: 0.3 },
  },
  {
    id: '19', name: 'Basamaklar', cap: 'On iki basamak, iki sancak, altı projektör.',
    cam: look([2.4, 0.42, 21.0], [0.6, 9.5, 33.5], 20), tex: [],
    scene: (cam) => governor(cam),
    air: (g, cam, A) => rain(g, cam, A, { n: 1.4, col: '#c8d0d8', light: 0.6, wind: 0.5, box: [8, 8, 0.4, 30] }),
    post: { grain: 0.08, halation: 0.55, lift: [5, 6, 8], cool: 0.03, vignette: 0.6, dirt: 0.3 },
  },
  {
    id: '22', name: 'Dökümhane', cap: 'Dökümhane. Çatısı çökmüş; kayıtlar aşağıda.',
    cam: look([5, 1.7, 3], [-1, 4, 60], 24), tex: [],
    scene: (cam) => foundry(cam, {}),
    air: (g, cam, A) => dust(g, cam, A, [-10, 0.5, 6, 10, 16, 40], { n: 500, size: 1.5, col: '235,236,238', lit: () => 0.3 }),
    post: { grain: 0.08, halation: 0.45, lift: [6, 6, 7], cool: 0.02, vignette: 0.55, dirt: 0.25 },
  },
  {
    id: '24', name: 'Metro', cap: 'Metro, ikinci hat. Trenler dört yıldır işlemiyor.',
    cam: look([1.4, 2.55, -1], [-0.5, 2.2, 60], 24), tex: ['metroSign', 'posterVanta'],
    scene: (cam) => metro(cam, {}),
    air: null,
    post: { grain: 0.08, halation: 0.45, lift: [5, 6, 6], vignette: 0.6, dirt: 0.25 },
  },
  {
    id: '25', name: 'Dron fabrikası', cap: 'Dron fabrikası. Hat durmuyor; şehirde gözler çoğalıyor.',
    cam: look([-6.5, 2.6, 1], [0.5, 1.2, 40], 28), tex: ['vantaWall'],
    scene: (cam) => droneWorks(cam, {}),
    air: null,
    post: { grain: 0.07, halation: 0.45, lift: [5, 6, 8], cool: 0.05, vignette: 0.55, dirt: 0.2 },
  },
  {
    id: '26', name: 'Ocak yeniden', cap: 'Dört yıl sonra. Ocak yeniden yanıyor.',
    cam: look([-60, 1.8, -250], [-10, 26, 0], 50), tex: [],
    scene: (cam) => steelworks(cam, { state: 'relit' }),
    air: (g, cam, A) => { plume(g, cam, A, [0, 46, 0], { col: '#f0d8c8', a: 0.12, rise: 50, spread: 20, size: 14, seed: 9, lean: [0.6, 0.1] }); plume(g, cam, A, [0, 24, -22], { col: '#f0c8a8', a: 0.08, rise: 30, spread: 18, size: 10, lean: [0.5, 0.1] }); },
    post: { grain: 0.08, halation: 0.6, lift: [10, 8, 7], warm: 0.04, vignette: 0.5, dirt: 0.3 },
  },
  {
    id: '27', name: 'Kule, giriş', cap: 'Kule, giriş katı. Turnikeler kırmızı.',
    cam: look([1.2, 1.1, -3], [0, 4.2, 26], 24), tex: ['vantaWall'],
    scene: (cam) => lobby(cam, {}),
    air: null,
    post: { grain: 0.07, halation: 0.5, lift: [4, 4, 6], cool: 0.03, vignette: 0.6, dirt: 0.2 },
  },
  {
    id: '28', name: 'Baskından sonra', cap: 'Baskından sonra. Rotayı biri satmış.',
    cam: look([-1.0, 1.5, 4.5], [0.8, 1.3, 25], 28), tex: [],
    scene: (cam) => marketAfter(cam),
    air: (g, cam, A) => rain(g, cam, A, { n: 0.6, col: '#d8dce0', light: 0.3, wind: 0.2 }),
    post: { grain: 0.08, halation: 0.3, lift: [9, 9, 10], cool: 0.04, vignette: 0.5, dirt: 0.25 },
  },
  {
    id: '29', name: 'Liman, şafak', cap: 'Şafak. Gemi gitmiş; rıhtım boş.',
    cam: look([196, 3.4, -178], [60, 18, -20], 35), tex: [],
    scene: (cam) => harbour(cam, { time: 'dawn', ship: false, pierZ: -176 }),
    air: null,
    post: { grain: 0.07, halation: 0.45, lift: [10, 9, 9], vignette: 0.5, dirt: 0.25 },
  },
  {
    id: '30', name: 'Kor', cap: 'Kül olmadı. Kor kaldı.',
    cam: look([0, 0.16, -0.36], [0, 0.015, 0.08], 50), tex: [],
    scene: (cam) => embers(cam, {}),
    air: (g, cam, A) => { sparks(g, cam, A, [0, 0.03, 0.08], { n: 40, spread: 0.25, rise: 0.25, len: 0.004 }); title(g, A.w, A.h); },
    post: { grain: 0.1, halation: 0.7, lift: [3, 2, 1], vignette: 0.7, dirt: 0.3 },
  },
];
export const SHOTS = LIST.sort((a, b) => a.id.localeCompare(b.id));
