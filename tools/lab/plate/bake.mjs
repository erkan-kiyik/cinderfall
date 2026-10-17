// KOR — bake the plates: node tools/lab/plate/bake.mjs governor [ss=2] [out=png]
// Traces the scene (scenes.js) from the plate's camera (public/lab/js/cine/
// plates.js) at ss× in each direction, in bands over worker threads; boxes
// it down in linear light; through the film curve; then a WebP for the game
// (encoded by a headless Chromium, the one the dev harnesses use).
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import os from 'node:os'; import fs from 'node:fs'; import zlib from 'node:zlib'; import path from 'node:path'; import url from 'node:url';
import { compile, renderBand, film, smear } from './trace.js';
import * as SCENES from './scenes.js';
import { PLATES, plateCam } from '../../../public/lab/js/cine/plates.js';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
// the offline settings: everything the game couldn't afford
const HQ = { hdr: true, aa: false, aoStep: 1, ao: { n: 12 }, vs: 2, vn: 20, shadowN: 2 };

if (!isMainThread) {
  const cache = new Map();
  parentPort.on('message', ({ name, ss, y0, y1, q }) => {
    const key = name + ss + JSON.stringify(q);
    if (!cache.has(key)) { const spec = SCENES[name](plateCam(name, ss)); Object.assign(spec, HQ, q, { ao: { ...spec.ao, ...HQ.ao, ...(q.ao || {}) } }); cache.set(key, compile(spec)); }
    const r = renderBand(cache.get(key), y0, y1);
    parentPort.postMessage({ y0, y1, ...r }, [r.fl.buffer, r.ref.buffer, r.rr.buffer]);
  });
} else {
  const name = process.argv[2] || 'governor', ss = +(process.argv[3] || 2), q = process.argv[4] ? JSON.parse(process.argv[4]) : {};
  const P = PLATES[name], cam = plateCam(name, ss), W = cam.W, H = cam.H;
  const t0 = performance.now(), fl = new Float32Array(W * H * 3), ref = new Float32Array(W * H * 3), rr = new Float32Array(W * H);
  const bands = []; const bh = Math.max(16, Math.ceil(H / 24)); for (let y = 0; y < H; y += bh) bands.push([y, Math.min(H, y + bh)]);
  const total = bands.length;
  const nw = Math.max(1, os.cpus().length);
  await new Promise((done) => {
    let left = bands.length;
    for (let w = 0; w < nw; w++) {
      const wk = new Worker(url.fileURLToPath(import.meta.url));
      const next = () => { const b = bands.shift(); if (b) wk.postMessage({ name, ss, y0: b[0], y1: b[1], q }); else wk.terminate(); };
      wk.on('message', (m) => { fl.set(m.fl, m.y0 * W * 3); ref.set(m.ref, m.y0 * W * 3); rr.set(m.rr, m.y0 * W); left--; process.stdout.write(`\r${name}: ${Math.round((1 - left / total) * 100)}%   `); if (!left) done(); next(); });
      next();
    }
  });
  // the wet streaks over the whole image, then down to size, in linear light
  const spec0 = SCENES[name](cam);
  smear(ref, rr, W, H, spec0.refl?.streak ?? 18);
  for (let i = 0; i < fl.length; i++) fl[i] += ref[i];
  const w = P.W, h = P.H, sm = new Float32Array(w * h * 3), k = 1 / (ss * ss);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) {
    let v = 0; for (let j = 0; j < ss; j++) for (let i = 0; i < ss; i++) v += fl[((y * ss + j) * W + x * ss + i) * 3 + c];
    sm[(y * w + x) * 3 + c] = v * k;
  }
  const spec = SCENES[name](plateCam(name, 1));
  const rgba = film(sm, w, h, q.exposure ?? spec.exposure ?? 1);
  const png = encodePNG(rgba, w, h), out = q.out || path.join(HERE, `../../../public/lab/assets/plates/${name}.webp`);
  const pngOut = out.replace(/\.webp$/, '.png');
  fs.writeFileSync(pngOut, png);
  console.log(`\n${name}: ${w}×${h} (traced ${W}×${H}) in ${((performance.now() - t0) / 1000).toFixed(1)} s → ${pngOut}`);
  if (out.endsWith('.webp')) {
    const { chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs');
    const br = await chromium.launch(); const pg = await br.newPage();
    const b64 = await pg.evaluate(async (src) => {
      const img = new Image(); img.src = src; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/webp', 0.9).split(',')[1];
    }, 'data:image/png;base64,' + png.toString('base64'));
    await br.close();
    fs.writeFileSync(out, Buffer.from(b64, 'base64')); fs.unlinkSync(pngOut);
    console.log(`→ ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
  }
}

function encodePNG(px, W, H) {
  const T = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
  const crc = (b) => { let c = -1; for (const x of b) c = T[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; Buffer.from(px.buffer, y * W * 4, W * 4).copy(raw, y * (W * 4 + 1) + 1); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
