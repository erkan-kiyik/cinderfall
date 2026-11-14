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
import { logError } from '../core/errlog.js';

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
// a task after whatever the browser has queued (input, the next frame): slices
// of background work between frames, at the pace of the clock, not the frame rate
const chan = typeof MessageChannel !== 'undefined' ? new MessageChannel() : null, tasks = [];
if (chan) chan.port1.onmessage = () => tasks.shift()?.();
const yieldTask = (fn) => { if (chan) { tasks.push(fn); chan.port2.postMessage(0); } else setTimeout(fn, 0); };

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
const addAll = (atlas, items, settle = false) => {
  for (const it of items) {
    const r = atlas.add(it.name, it.img, it.w, it.h, it.ax, it.ay, it.margin); it.img.close?.();
    // behind the lobby: draw each sprite into its page now, not all at once at the upload
    if (settle) atlas.settle(r.page);
  }
};

// Paint entries in workers, handing them out in `order`; onAdded(n) after the
// n-th (in that order) is packed. Resolves with how many were packed, or
// rejects only if nothing could be done at all. Past the first `nFirst`
// nothing is painted or packed until `gate` (the lobby is up and has drawn);
// then packing runs in slices of a few milliseconds between frames, with the
// workers at most AHEAD entries in front of it.
// src: { module (URL of the module with bakeList), quality, css (the @font-face sheet) }
const AHEAD = 12, BUDGET = 6;
function bakeInWorkers(atlas, entries, order, nFirst, gate, src, onAdded) {
  const total = order.length, N = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 4) - 1));
  const results = new Array(entries.length), workers = [], idle = [];
  let next = 0, added = 0, finished = false, queued = false;
  return new Promise((resolve) => {
    const end = () => { if (finished) return; finished = true; clearTimeout(watchdog); for (const w of workers) w.terminate(); resolve(added); };
    const give = (w) => {
      if (next >= total) return;
      if (next >= nFirst && (!open || next - added >= AHEAD)) { idle.push(w); return; }
      w.postMessage({ type: 'paint', i: order[next++] });
    };
    const ready = () => added < total && results[order[added]];
    // the rest is neither painted nor packed until the lobby has drawn its first frames
    let open = false;
    // parked workers back to work while there is work they may take (the exact
    // opposite of give()'s parking test, so this loop always ends)
    const feed = () => { while (idle.length && next < total && (next < nFirst || (open && next - added < AHEAD))) give(idle.shift()); };
    gate.then(() => { open = true; feed(); if (ready()) later(); });
    const pack = (settle) => { const i = order[added]; addAll(atlas, results[i], settle); results[i] = null; added++; onAdded(added); };
    const drain = () => {
      queued = false;
      if (finished) return;
      alive(); // packing, not a stuck worker
      const t0 = performance.now();
      while (ready() && performance.now() - t0 < BUDGET) pack(true);
      feed();
      if (added === total) end(); else if (ready()) later();
    };
    const later = () => { if (!queued) { queued = true; gate.then(() => yieldTask(drain)); } };
    const pump = () => {
      // the lobby's sprites as fast as they come; the rest behind the lobby, a little a frame
      while (ready() && added < nFirst) pack(false);
      feed();
      if (added === total) end(); else if (ready()) later();
    };
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
        if (data.type === 'ready') { if (data.n !== entries.length) { console.warn('bake worker: list differs'); end(); return; } give(w); give(w); }
        else if (data.type === 'done') { results[data.i] = data.items; give(w); pump(); }
        else if (data.type === 'error') { console.warn('bake worker:', data.msg); end(); }
      };
      w.postMessage({ type: 'init', module: src.module, quality: src.quality, css: src.css });
    }
    if (!workers.length) end();
  });
}

// the pages' PNGs for the cache (encoded off the main thread); null for the gaps
const encode = (pages) => Promise.all(pages.map((p) => (p.canvas ? p.canvas.convertToBlob({ type: 'image/png' }) : null)));

// Bake every entry into the atlas; with `split`, in two stages (docs §10.28):
// the entries split() picks first (what the lobby shows), then the call
// returns with the atlas usable for those, and the rest go on painting in the
// background into a texture group of their own. `rest` is then
// { promise, done, p (0..1), ms, saved }; missions wait for `promise`. A cache hit restores
// everything at once.
export async function bakeAll(atlas, entries, { key, onProgress, onRest, workers = null, split = null } = {}) {
  const t0 = performance.now();
  if (key) {
    const hit = await idbGet(key);
    if (hit && hit.layout && hit.blobs) {
      try {
        const bitmaps = await Promise.all(hit.blobs.map((b) => (b ? createImageBitmap(b, { premultiplyAlpha: 'premultiply' }) : null)));
        atlas.restore(hit.layout, bitmaps);
        return { cached: true, ms: performance.now() - t0, rest: null };
      } catch { /* fall through and repaint */ }
    }
  }
  const all = entries.map((_, i) => i);
  const first = split ? all.filter((i) => split(entries[i])) : all;
  const order = split && first.length < all.length ? first.concat(all.filter((i) => !split(entries[i]))) : all;
  const total = order.length, nFirst = Math.max(1, Math.min(total, first.length));
  // the rest waits for start() (the lobby on screen), then two frames
  let open;
  const gate = new Promise((r) => { open = r; }).then(frame).then(frame);
  const rest = nFirst < total ? { done: false, p: 0, ms: 0, promise: null, start: () => open() } : null;
  let firstDone, firstBlobs = null, lateFrom = 0, upMs = 0;
  const stage1 = new Promise((r) => { firstDone = r; });
  // the moment the first part is packed: on the GPU, then sealed, so the rest
  // starts on fresh pages (its own texture group) and these canvases can go
  const onAdded = (n) => {
    if (n <= nFirst) onProgress?.(n / nFirst);
    else if (rest) { rest.p = (n - nFirst) / (total - nFirst); onRest?.(rest.p); }
    if (n !== nFirst) return;
    const u0 = performance.now();
    atlas.upload();
    upMs = performance.now() - u0;
    if (rest) {
      const sealed = atlas.pages.slice();
      lateFrom = atlas.seal();
      if (key) firstBlobs = encode(sealed).then((b) => { atlas.release(0, sealed.length); return b; }, () => { atlas.release(0, sealed.length); return null; });
      else atlas.release(0, sealed.length);
    }
    firstDone();
  };
  const run = (async () => {
    let from = 0;
    if (workers && typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
      try { from = await bakeInWorkers(atlas, entries, order, nFirst, gate, workers, onAdded); } catch (e) { console.warn('bake workers', e); }
    }
    let last = performance.now();
    for (let k = from; k < total; k++) {
      if (k === nFirst) { await gate; last = performance.now(); }
      addAll(atlas, paintEntry(entries[order[k]]), k >= nFirst);
      onAdded(k + 1);
      // in the background (the lobby is running) in short slices
      if (performance.now() - last > (k + 1 > nFirst ? 8 : 30)) { await frame(); last = performance.now(); }
    }
  })();
  // a failure here is logged; what was painted is still used
  const ran = run.catch((e) => { console.error('bake', e); logError(e?.message || e, 'bake', e?.stack); });
  await stage1;
  const ms = performance.now() - t0;
  if (!rest) {
    // one stage: the pages go to the cache, then their canvases are let go
    if (key) encode(atlas.pages).then((blobs) => { atlas.release(); return idbPut(key, { layout: atlas.layout(), blobs }); }, () => atlas.release());
    else atlas.release();
    return { cached: false, ms, upMs, rest: null };
  }
  // painted and on the GPU: missions may start; the cache is written after that
  rest.promise = ran.then(async () => {
    await atlas.uploadLate(lateFrom, frame);
    rest.done = true; rest.p = 1; rest.ms = performance.now() - t0;
    return rest;
  });
  rest.saved = rest.promise.then(async () => {
    const late = key ? await encode(atlas.pages.slice(lateFrom)).catch(() => null) : null;
    atlas.release(lateFrom);
    const early = firstBlobs ? await firstBlobs : null;
    // the gap pages stay as nulls, so every region keeps its page number
    if (key && early && late) await idbPut(key, { layout: atlas.layout(), blobs: early.concat(new Array(lateFrom - early.length).fill(null), late) });
    return !!(key && early && late);
  });
  return { cached: false, ms, upMs, rest };
}
