// KOR — bake procedural art into the atlas, with a disk cache.
//
// A bake entry describes a world-space box, a pixel density and a painter.
// Wide layers are split into chunks that fit an atlas page; each chunk is
// baked with a margin of real content around it and the region UVs cover
// only the inner part, so bilinear filtering never samples a transparent
// edge and chunk seams stay invisible.
//
// The packed pages are stored in IndexedDB (PNG blobs + layout JSON) keyed by
// art version and quality: the second launch skips painting entirely.
//
// The first launch paints in parallel (docs §10.17): a few module workers
// (gfx/bakeworker.js) build the same entry list and paint entries as they
// are handed out, sending each sprite back as an ImageBitmap; the main thread
// only packs them into the atlas, in order. If a worker cannot start or
// fails, whatever is left is painted here on the main thread as before.
import { outlined, canvas, setRoot } from '../art/kit.js';

const DB = 'kor-lab-bake', STORE = 'pages';

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
// → the sprites it makes: [{ name, img, w, h (world units), ax, ay, margin }]
export function paintEntry(e) {
  if (typeof e.box === 'function') { e.box = e.box(); if (!e.box) return []; }
  const [x0, y0, x1, y1] = e.box;
  const s = e.scale;
  if (!e.chunk) {
    const W = Math.ceil((x1 - x0) * s), H = Math.ceil((y1 - y0) * s);
    const paint = (g) => { setRoot(g); e.paint(g); };
    let img;
    if (e.outline) img = outlined(W, H, s, -x0 * s, -y0 * s, paint, e.outline);
    else { img = canvas(W, H); const g = img.getContext('2d'); g.translate(-x0 * s, -y0 * s); g.scale(s, s); paint(g); }
    const ax = e.anchor ? e.anchor[0] : -x0 / (x1 - x0), ay = e.anchor ? e.anchor[1] : -y0 / (y1 - y0);
    return [{ name: e.name, img, w: W / s, h: H / s, ax, ay, margin: 0 }];
  }
  // chunked layer: name#i, each anchored at its own top-left
  const n = Math.ceil((x1 - x0) / e.chunk), m = 2 / s, out = []; // 2 px of margin
  for (let i = 0; i < n; i++) {
    const cx0 = x0 + i * e.chunk, cx1 = Math.min(x1, cx0 + e.chunk);
    const W = Math.ceil((cx1 - cx0) * s), H = Math.ceil((y1 - y0) * s);
    const img = canvas(W + 4, H);
    const g = img.getContext('2d');
    g.translate(-(cx0 - m) * s, -y0 * s); g.scale(s, s); setRoot(g); e.paint(g);
    out.push({ name: `${e.name}#${i}`, img, w: W / s, h: H / s, ax: 0, ay: 0, margin: 2 });
  }
  return out;
}
const addAll = (atlas, items) => { for (const it of items) { atlas.add(it.name, it.img, it.w, it.h, it.ax, it.ay, it.margin); it.img.close?.(); } };

// Paint entries in workers; resolves with how many entries (from the start, in
// order) went into the atlas, or rejects only if nothing could be done at all.
// src: { module (URL of the module with bakeList), quality, css (the @font-face sheet) }
function bakeInWorkers(atlas, entries, src, onProgress) {
  const total = entries.length, N = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 4) - 1));
  const results = new Array(total), workers = [];
  let next = 0, added = 0, finished = false;
  return new Promise((resolve) => {
    const end = () => { if (finished) return; finished = true; clearTimeout(watchdog); for (const w of workers) w.terminate(); resolve(added); };
    const pump = () => {
      while (added < total && results[added]) { addAll(atlas, results[added]); results[added] = null; added++; onProgress?.(added / total); }
      if (added === total) end();
    };
    const give = (w) => { if (next < total) w.postMessage({ type: 'paint', i: next++ }); };
    // a worker that stops answering for this long means the main thread finishes the job
    let watchdog = setTimeout(end, 20000);
    const alive = () => { clearTimeout(watchdog); watchdog = setTimeout(end, 20000); };
    for (let k = 0; k < N; k++) {
      let w;
      try { w = new Worker(new URL('./bakeworker.js', import.meta.url), { type: 'module' }); } catch (e) { console.warn('bake worker', e); break; }
      workers.push(w);
      w.onerror = (e) => { console.warn('bake worker', e.message || e); e.preventDefault?.(); end(); };
      w.onmessage = ({ data }) => {
        if (finished) return;
        alive();
        if (data.type === 'ready') { if (data.n !== total) { console.warn('bake worker: list differs'); end(); return; } give(w); give(w); }
        else if (data.type === 'done') { results[data.i] = data.items; give(w); pump(); }
        else if (data.type === 'error') { console.warn('bake worker:', data.msg); end(); }
      };
      w.postMessage({ type: 'init', module: src.module, quality: src.quality, css: src.css });
    }
    if (!workers.length) end();
  });
}

export async function bakeAll(atlas, entries, { key, onProgress, workers = null } = {}) {
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
  let from = 0;
  if (workers && typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
    try { from = await bakeInWorkers(atlas, entries, workers, onProgress); } catch (e) { console.warn('bake workers', e); }
  }
  let last = performance.now();
  for (let i = from; i < entries.length; i++) {
    addAll(atlas, paintEntry(entries[i]));
    if (onProgress) onProgress((i + 1) / entries.length);
    if (performance.now() - last > 30) { await frame(); last = performance.now(); }
  }
  atlas.upload();
  const ms = performance.now() - t0;
  // the pages go to the cache (encoded off the main thread), then their canvases are let go
  if (key) {
    (async () => {
      try {
        const blobs = await Promise.all(atlas.pages.map((p) => p.canvas.convertToBlob({ type: 'image/png' })));
        atlas.release();
        await idbPut(key, { layout: atlas.layout(), blobs });
      } catch { atlas.release(); }
    })();
  } else atlas.release();
  return { cached: false, ms };
}
