// CINDERFALL LAB — bake procedural art into the atlas, with a disk cache.
//
// A bake entry describes a world-space box, a pixel density and a painter.
// Wide layers are split into chunks that fit an atlas page; each chunk is
// baked with a margin of real content around it and the region UVs cover
// only the inner part, so bilinear filtering never samples a transparent
// edge and chunk seams stay invisible.
//
// The packed pages are stored in IndexedDB (PNG blobs + layout JSON) keyed by
// art version and quality: the second launch skips painting entirely.
import { outlined, canvas, setRoot } from '../art/kit.js';

const DB = 'cf-lab-bake', STORE = 'pages';

function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbGet(key) {
  try {
    const db = await idb();
    return await new Promise((res) => { const t = db.transaction(STORE).objectStore(STORE).get(key); t.onsuccess = () => res(t.result || null); t.onerror = () => res(null); });
  } catch { return null; }
}
async function idbPut(key, val) {
  try {
    const db = await idb();
    await new Promise((res) => { const t = db.transaction(STORE, 'readwrite'); t.objectStore(STORE).put(val, key); t.oncomplete = res; t.onerror = res; });
  } catch { /* cache is optional */ }
}

const frame = () => new Promise((r) => requestAnimationFrame(() => r()));

// entry: { name, box: [x0, y0, x1, y1], scale, paint(g), outline?: radius,
//          chunk?: units (split wide layers), anchor?: [ax, ay] }
function bakeOne(atlas, e) {
  const [x0, y0, x1, y1] = e.box;
  const s = e.scale;
  if (!e.chunk) {
    const W = Math.ceil((x1 - x0) * s), H = Math.ceil((y1 - y0) * s);
    const paint = (g) => { setRoot(g); e.paint(g); };
    let img;
    if (e.outline) img = outlined(W, H, s, -x0 * s, -y0 * s, paint, e.outline);
    else { img = canvas(W, H); const g = img.getContext('2d'); g.translate(-x0 * s, -y0 * s); g.scale(s, s); paint(g); }
    const ax = e.anchor ? e.anchor[0] : -x0 / (x1 - x0), ay = e.anchor ? e.anchor[1] : -y0 / (y1 - y0);
    atlas.add(e.name, img, W / s, H / s, ax, ay);
    return 1;
  }
  // chunked layer: name#i, each anchored at its own top-left
  const n = Math.ceil((x1 - x0) / e.chunk), m = 2 / s; // 2 px of margin
  for (let i = 0; i < n; i++) {
    const cx0 = x0 + i * e.chunk, cx1 = Math.min(x1, cx0 + e.chunk);
    const W = Math.ceil((cx1 - cx0) * s), H = Math.ceil((y1 - y0) * s);
    const img = canvas(W + 4, H);
    const g = img.getContext('2d');
    g.translate(-(cx0 - m) * s, -y0 * s); g.scale(s, s); setRoot(g); e.paint(g);
    atlas.add(`${e.name}#${i}`, img, W / s, H / s, 0, 0, 2);
  }
  return n;
}

export async function bakeAll(atlas, entries, { key, onProgress } = {}) {
  const t0 = performance.now();
  if (key) {
    const hit = await idbGet(key);
    if (hit && hit.layout && hit.blobs) {
      try {
        const bitmaps = await Promise.all(hit.blobs.map((b) => createImageBitmap(b, { premultiplyAlpha: 'premultiply' })));
        atlas.restore(hit.layout, bitmaps);
        return { cached: true, ms: performance.now() - t0 };
      } catch { /* fall through and repaint */ }
    }
  }
  let last = performance.now();
  for (let i = 0; i < entries.length; i++) {
    bakeOne(atlas, entries[i]);
    if (onProgress) onProgress((i + 1) / entries.length);
    if (performance.now() - last > 30) { await frame(); last = performance.now(); }
  }
  atlas.upload();
  const ms = performance.now() - t0;
  if (key) {
    // encode after the first frames are on screen; never blocks the start
    setTimeout(async () => {
      try {
        const blobs = await Promise.all(atlas.pages.map((p) => p.canvas.convertToBlob({ type: 'image/png' })));
        await idbPut(key, { layout: atlas.layout(), blobs });
      } catch { /* optional */ }
    }, 1500);
  }
  return { cached: false, ms };
}
