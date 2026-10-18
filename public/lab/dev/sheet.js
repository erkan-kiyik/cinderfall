// Dev-only review sheets for the LAB art (not shipped).
import { silhouette, canvas } from '../js/art/kit.js';
import { OPS, WEAPONS, figureCanvas, weaponCanvas, streetScene } from './render.js';

await document.fonts.load('700 20px Rajdhani'); await document.fonts.load('600 20px Rajdhani');
const q = new URLSearchParams(location.search);
const what = q.get('what') || 'op';

function grey(src) {
  const c = canvas(src.width, src.height), g = c.getContext('2d');
  g.filter = 'grayscale(1)'; g.drawImage(src, 0, 0);
  return c;
}
function toCanvasEl(src, bg) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const g = c.getContext('2d'); if (bg) { g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); }
  g.drawImage(src, 0, 0); return c;
}
const row = () => { const d = document.createElement('div'); d.style.cssText = 'display:flex;gap:8px;padding:8px;align-items:flex-end'; document.body.appendChild(d); return d; };

if (what === 'op') {
  const op = OPS[q.get('op') || 'vex'];
  const s = +(q.get('s') || 7);
  const fig = figureCanvas(op, s);
  const r = row();
  r.appendChild(toCanvasEl(fig, '#2a323d'));
  r.appendChild(toCanvasEl(grey(fig), '#3c4654'));
  r.appendChild(toCanvasEl(silhouette(fig), '#d9dee5'));
  // head and hands close-up
  const z = 22, big = figureCanvas(op, z);
  const crop = document.createElement('canvas'); crop.width = 30 * z; crop.height = 26 * z;
  const cg = crop.getContext('2d'); cg.fillStyle = '#2a323d'; cg.fillRect(0, 0, crop.width, crop.height);
  cg.drawImage(big, -(big.width * 0.42 - 15 * z), -(big.height - 6 * z - 70 * z));
  const r2 = row(); r2.appendChild(crop);
  // real in-game size (2.6 px per unit at 1x, shown at device pixel ratio 2.5)
  const real = figureCanvas(op, 2.6 * 2.5);
  const r3 = row(); r3.appendChild(toCanvasEl(real, '#1e252e'));
}
if (what === 'hawk') {
  const { paintHawk } = await import('../js/art/hawk.js');
  const r = row();
  for (const px of [120, 520]) { const c = document.createElement('canvas'); c.width = c.height = px; paintHawk(c.getContext('2d'), px, 1); r.appendChild(c); }
}
if (what === 'row') {
  // several figures side by side at one scale: ?ids=a,b,c&s=
  const r = row(), s = +(q.get('s') || 8);
  for (const id of (q.get('ids') || 'tetikci,kalkanli,hucumcu,gall').split(',')) r.appendChild(toCanvasEl(figureCanvas(OPS[id], s), q.get('bg') || '#2a2522'));
}
if (what === 'big') {
  // one operator large, on the warm dark of the shelter, for the detail review
  const op = OPS[q.get('op') || 'vex'], fig = figureCanvas(op, +(q.get('s') || 15));
  row().appendChild(toCanvasEl(fig, q.get('bg') || '#2a2522'));
  // and the head and shoulders at 40 px per unit
  const z = 40, big = figureCanvas(op, z), crop = document.createElement('canvas');
  crop.width = 24 * z; crop.height = 20 * z;
  const cg = crop.getContext('2d'); cg.fillStyle = q.get('bg') || '#2a2522'; cg.fillRect(0, 0, crop.width, crop.height);
  cg.drawImage(big, -(big.width * 0.42 - 12 * z), -(big.height - 6 * z - 72 * z));
  row().appendChild(crop);
}
if (what === 'poses') {
  // one operator in the poses the game uses most, on one strip, plus real size and the silhouette
  const op = OPS[q.get('op') || 'vex'];
  const s = +(q.get('s') || 6);
  const gun = (id, at, ang, k = 0.96) => ({ w: WEAPONS[id], at, ang, k, mat: op.pose.gun && op.pose.gun.mat });
  const W = q.get('w') || 'kestrel';
  const POSES = [
    ['idle', op.pose],
    ['aim', { lean: -0.05, head: -0.08, nThigh: 0.28, nShin: 0.1, fThigh: -0.26, fShin: -0.04, gun: gun(W, [10.2, -48.2], -0.03) }],
    ['run', { lean: -0.16, head: -0.04, nThigh: 0.62, nShin: 0.85, fThigh: -0.55, fShin: -0.15, gun: gun(W, [10.6, -46.4], 0.25) }],
    ['crouch', { lean: -0.12, head: -0.02, nThigh: 1.15, nShin: -0.9, fThigh: 0.55, fShin: -1.35, hipX: -1, gun: gun(W, [10.6, -34.0], -0.02) }],
    ['up', { lean: 0.08, head: 0.2, nThigh: 0.2, nShin: 0.06, fThigh: -0.2, fShin: -0.06, gun: gun(W, [8.2, -51], -0.9) }],
  ];
  const r = row();
  for (const [name, pose] of POSES) {
    const c = toCanvasEl(figureCanvas(op, s, pose), '#2a323d');
    const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;color:#939dab;font:600 14px sans-serif';
    wrap.append(c, name); r.appendChild(wrap);
  }
  const r2 = row();
  r2.appendChild(toCanvasEl(figureCanvas(op, 2.6 * 2.6, POSES[1][1]), '#1e252e'));
  r2.appendChild(toCanvasEl(silhouette(figureCanvas(op, 2.6 * 2.6, POSES[1][1])), '#d9dee5'));
  r2.appendChild(toCanvasEl(grey(figureCanvas(op, 2.6 * 2.6, POSES[1][1])), '#3c4654'));
  const z = 20, big = figureCanvas(op, z, POSES[1][1]);
  const crop = document.createElement('canvas'); crop.width = 34 * z; crop.height = 30 * z;
  const cg = crop.getContext('2d'); cg.fillStyle = '#2a323d'; cg.fillRect(0, 0, crop.width, crop.height);
  cg.drawImage(big, -(big.width * 0.42 - 13 * z), -(big.height - 6 * z - 70 * z));
  r2.appendChild(crop);
}
if (what === 'env' || what === 'props') {
  // every building and every obstacle at a readable size, on the night ground
  const { BUILDINGS } = await import('../js/art/env/city.js');
  const env = await import('../js/art/env/street.js');
  const m1 = await import('../js/art/env/mission1.js');
  const co = await import('../js/art/env/course.js');
  const { outlined, setRoot: sr } = await import('../js/art/kit.js');
  const s = +(q.get('s') || 3);
  const pane = (w, top, bottom, paint, outline) => {
    void 0;
    const W = Math.ceil(w * s), H = Math.ceil((bottom - top) * s);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.fillStyle = '#151b27'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2a303c'; g.fillRect(0, -top * s, W, H);
    if (outline) { const o = outlined(W, H, s, 0, -top * s, (gg) => { sr(gg); paint(gg); }, 0.55); g.drawImage(o, 0, 0); }
    else { g.save(); g.translate(0, -top * s); g.scale(s, s); sr(g); paint(g); g.restore(); }
    return c;
  };
  let r = row();
  let acc = 0;
  for (const [t, b] of what === 'props' ? [] : Object.entries(BUILDINGS)) {
    if (acc + b.w > 520) { r = row(); acc = 0; }
    const c = pane(b.w + 6, b.top - 2, 8, (g) => { g.translate(3, 0); b.paint(g); });
    const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;color:#939dab;font:600 14px sans-serif';
    wrap.append(c, t); r.appendChild(wrap); acc += b.w + 10;
  }
  const props = [
    ['crate', 24, -20, (g) => env.crate(g, 4, 16, 16)],
    ['barrier', 42, -20, (g) => env.barrier(g, 4, 34)],
    ['concrete', 26, -44, (g) => m1.concrete(g, 5, 21, 40)],
    ['barricade', 36, -40, (g) => co.barricade(g, 6, 30, 32, '#ff3fa4')],
    ['scrap', 44, -40, (g) => co.scrapBarricade(g, 6, 34, 32)],
    ['burnBarrel', 18, -18, (g) => env.burnBarrel(g, 4)],
    ['dumpster', 48, -26, (g) => env.dumpster(g, 4)],
    ['cone', 14, -12, (g) => env.cone(g, 7)],
    ['booth', 56, -70, (g) => m1.booth(g, 6)],
    ['terminal', 30, -30, (g) => m1.terminal(g, 10)],
    ['lamp', 34, -90, (g) => env.lampPost(g, 6)],
    ['container', 86, -44, (g) => co.container(g, 3, -40, 83, 0, co.CONT.teal)],
  ];
  r = row(); acc = 0;
  for (const [n, w, top, paint] of props) {
    if (acc + w > (what === 'props' ? 160 : 300)) { r = row(); acc = 0; }
    const c = pane(w, top, 4, paint, true);
    const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;color:#939dab;font:600 14px sans-serif';
    wrap.append(c, n); r.appendChild(wrap); acc += w + 6;
  }
}
if (what === 'avatars') {
  // the menu portraits at the sizes the menus use, and large
  const { avatar } = await import('../js/ui/portraits.js');
  for (const px of [30, 46, 64, 160]) { const r = row(); for (const id of ['vex', 'hale', 'morrow', 'kite', 'brick']) r.appendChild(avatar(id, px)); }
}
if (what === 'weapons') {
  for (const w of Object.values(WEAPONS)) {
    const s = Math.min(26, 880 / (w.box[2] - w.box[0]));
    const c = weaponCanvas(w, s);
    const r = row();
    r.appendChild(toCanvasEl(c, '#2a323d'));
    r.appendChild(toCanvasEl(grey(c), '#3c4654'));
    const sil = toCanvasEl(silhouette(c), '#d9dee5'); sil.style.width = (c.width / 2) + 'px'; r.appendChild(sil);
  }
}
// --- delivery boards ---------------------------------------------------------
function board(W, H, title, sub) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#151a21'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#ff6b2c'; g.fillRect(48, 44, 8, 52);
  g.fillStyle = '#f4f1ea'; g.font = '700 46px Rajdhani'; g.textBaseline = 'alphabetic';
  g.fillText(title, 72, 80);
  g.fillStyle = '#939dab'; g.font = '600 22px Rajdhani'; g.fillText(sub, 74, 108);
  document.body.appendChild(c);
  return g;
}
function label(g, x, y, name, role, lines = []) {
  g.textAlign = 'center';
  g.fillStyle = '#f4f1ea'; g.font = '700 44px Rajdhani'; g.fillText(name, x, y);
  g.fillStyle = '#ff9a5c'; g.font = '700 20px Rajdhani'; g.fillText(role, x, y + 28);
  g.fillStyle = '#939dab'; g.font = '600 18px Rajdhani';
  lines.forEach((l, i) => g.fillText(l, x, y + 58 + i * 24));
  g.textAlign = 'left';
}
const ABIL = {
  vex: ['Atılma · Flaş', 'Ulti: Aşırı Yük'], hale: ['Kalkan Duvarı · Tuzak Mayını', 'Ulti: Taret'],
  morrow: ['Duman · Yavaşlatma Alanı', 'Ulti: Karartma'], kite: ['Dron · Isı Görüşü', 'Ulti: Gözetleme'],
  brick: ['Kalkan Hücumu · Zırh Paketi', 'Ulti: Yenilmez'],
};
if (what === 'board-ops') {
  const ids = ['vex', 'hale', 'morrow', 'kite', 'brick'];
  const g = board(2400, 1090, 'OPERATÖRLER', 'KOR LAB · M0 STİL PANOSU · temiz stilize, 3 ton gölge, koyu dış çizgi');
  const s = 7.4;
  ids.forEach((id, i) => {
    const f = figureCanvas(OPS[id], s);
    const cx = 240 + i * 480;
    g.drawImage(f, cx - f.width * 0.42, 110);
    label(g, cx, 110 + f.height + 30, OPS[id].name, OPS[id].role, ABIL[id]);
  });
  // silhouette strip
  g.fillStyle = '#d9dee5'; g.fillRect(0, 910, 2400, 180);
  ids.forEach((id, i) => {
    const sil = silhouette(figureCanvas(OPS[id], 2.0), '#0d1015');
    g.drawImage(sil, 240 + i * 480 - sil.width * 0.42, 920);
  });
  g.fillStyle = '#3c4654'; g.font = '700 18px Rajdhani'; g.fillText('SİLÜET KONTROLÜ', 48, 1080);
}
if (what === 'board-faces') {
  const ids = ['vex', 'hale', 'morrow', 'kite', 'brick'];
  const g = board(2400, 760, 'YÜZLER', 'yakın plan · oyunda baş ~9 birim; düz renk blokları, net göz ve kaş');
  const z = 30;
  ids.forEach((id, i) => {
    const big = figureCanvas(OPS[id], z);
    const x0 = 40 + i * 470, w = 440, h = 520;
    g.save(); g.beginPath(); g.rect(x0, 150, w, h); g.clip();
    g.fillStyle = '#2a323d'; g.fillRect(x0, 150, w, h);
    g.drawImage(big, x0 + w / 2 - big.width * 0.42 - 2 * z, 150 - (big.height - 6 * z - 68 * z));
    g.restore();
    g.fillStyle = '#f4f1ea'; g.font = '700 30px Rajdhani'; g.fillText(OPS[id].name, x0, 712);
    g.fillStyle = '#ff9a5c'; g.font = '700 18px Rajdhani'; g.fillText(OPS[id].role, x0 + 120, 712);
  });
}
if (what === 'board-arms') {
  const g = board(2400, 1240, 'SİLAHLAR VE DÜŞMANLAR', 'fabrika görünümü · metal açık çelik, polimer koyu, turuncu vurgu · VANTA SYNDICATE soğuk mavi + kırmızı vizör');
  const list = [['wren9', 'TABANCA · hızlı, isabetli yan silah'], ['kestrel', 'TÜFEK · tam otomatik, kırmızı nokta'], ['ramrod', 'POMPALI · yan saddle fişek, pompa'], ['marksman', 'KESKİN NİŞANCI · dürbün, susturucu, bipod']];
  let y = 150;
  for (const [id, desc] of list) {
    const w = WEAPONS[id];
    const hh = 270, s = Math.min(1000 / (w.box[2] - w.box[0] + 3), 230 / (w.box[3] - w.box[1] + 3));
    const c = weaponCanvas(w, s, 0.55);
    g.fillStyle = '#1e252e'; g.fillRect(48, y, 1320, hh - 16);
    g.drawImage(c, 48 + 300 + (1020 - c.width) / 2, y + (hh - 16 - c.height) / 2);
    g.fillStyle = '#f4f1ea'; g.font = '700 34px Rajdhani'; g.fillText(w.name, 70, y + 46);
    g.fillStyle = '#939dab'; g.font = '600 18px Rajdhani'; g.fillText(desc, 70, y + 72);
    y += hh;
  }
  const es = 6.4;
  for (const [i, id] of ['tetikci', 'kalkanli'].entries()) {
    const f = figureCanvas(OPS[id], es);
    const cx = 1600 + i * 520;
    g.drawImage(f, cx - f.width * 0.42, 260);
    label(g, cx, 260 + f.height + 46, OPS[id].name, OPS[id].role, [id === 'tetikci' ? 'siper kullanır, 3-5 mermilik seri' : 'önden geçilmez, arkadan zayıf']);
  }
}
if (what === 'street') document.body.appendChild(streetScene(+(q.get('s') || 4)));
window.__done = 1;
