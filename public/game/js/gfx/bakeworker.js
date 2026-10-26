// KOR — a bake worker (gfx/baker.js). It builds the same entry list as the
// main thread (the scene module's bakeList at the same quality), loads the
// game's fonts (the signs and stencils are lettered), and paints the entries
// it is handed, sending each sprite back as a transferable ImageBitmap.
import { paintEntry } from './baker.js';

let list = null;

// the @font-face rules of the game's sheet, as FontFaces this worker can use
async function loadFonts(cssUrl) {
  const css = await (await fetch(cssUrl)).text(), base = new URL(cssUrl), jobs = [];
  for (const [, b] of css.matchAll(/@font-face\s*{([^}]*)}/g)) {
    const fam = /font-family:\s*['"]?([^;'"]+)['"]?/.exec(b), url = /url\(\s*['"]?([^)'"]+)['"]?\s*\)/.exec(b);
    if (!fam || !url) continue;
    const d = {}, w = /font-weight:\s*([^;]+)/.exec(b), st = /font-style:\s*([^;]+)/.exec(b), ur = /unicode-range:\s*([^;]+)/.exec(b);
    if (w) d.weight = w[1].trim(); if (st) d.style = st[1].trim(); if (ur) d.unicodeRange = ur[1].trim();
    const f = new FontFace(fam[1].trim(), `url(${new URL(url[1], base).href})`, d);
    self.fonts.add(f); jobs.push(f.load().catch(() => null));
  }
  await Promise.all(jobs);
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'init') {
      await loadFonts(data.css);
      const M = await import(data.module);
      list = M.bakeList(data.quality);
      self.postMessage({ type: 'ready', n: list.length });
    } else if (data.type === 'paint') {
      const items = paintEntry(list[data.i]).map((it) => ({ ...it, img: it.img.transferToImageBitmap ? it.img.transferToImageBitmap() : it.img }));
      self.postMessage({ type: 'done', i: data.i, items }, items.map((it) => it.img));
    }
  } catch (e) { self.postMessage({ type: 'error', msg: String((e && e.stack) || e) }); }
};
