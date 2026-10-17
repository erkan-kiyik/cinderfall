// KOR — render stills of the series: node tools/lab/series/render.mjs 01 02 …
//   --w 1920   output width (2.39:1)      --ss 2   supersampling per axis
//   --quick    a fast look (no supersampling, fewer samples)
//   --out dir  where the frames go (default: the scratch folder next to the repo)
// Each still: traced in bands over worker threads (tools/lab/plate/trace.js),
// the wet streaks over the whole frame, boxed down in linear light, the film
// curve; then a headless Chromium puts the moving air on it (rain, steam,
// sparks, from shots' `air`) and the film look (js/cine/post.js), and writes
// a JPEG and a PNG.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import os from 'node:os'; import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url'; import http from 'node:http';
import { compile, renderBand, film, smear } from '../plate/trace.js';
import { SHOTS } from './shots.js';
import { encodePNG, decodePNG, toLinear } from './png.mjs';

const HERE = path.dirname(url.fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '../../..');
const camFor = (s, W, H) => ({ W, H, f: (s.cam.mm / 36) * W, cx: W / 2, cy: H / 2, p: s.cam.pos.slice(), yaw: s.cam.yaw || 0, pitch: s.cam.pitch || 0 });
const HQ = { hdr: true, aa: false, aoStep: 1, ao: { n: 12 }, vs: 2, vn: 20, shadowN: 2 };
const QUICK = { hdr: true, aa: false, aoStep: 2, ao: { n: 5 }, vs: 4, vn: 8, shadowN: 1 };

function specFor(s, cam, tex, quick) {
  const spec = s.scene(cam, s);
  spec.textures = tex;
  const q = quick ? QUICK : HQ;
  const vs = Math.min(q.vs, spec.vs ?? 99);
  Object.assign(spec, q, { vs, ao: { ...(spec.ao || {}), ...q.ao } });
  if (spec.gi) spec.gi = { ...spec.gi, n: quick ? Math.min(8, spec.gi.n ?? 16) : spec.gi.n ?? 24, step: quick ? 4 : spec.gi.step ?? 2 };
  return spec;
}

if (!isMainThread) {
  const { tex } = workerData, cache = new Map();
  parentPort.on('message', ({ id, W, H, y0, y1, quick }) => {
    const key = id + W + quick;
    if (!cache.has(key)) { const s = SHOTS.find((x) => x.id === id); cache.clear(); cache.set(key, compile(specFor(s, camFor(s, W, H), tex, quick))); }
    const r = renderBand(cache.get(key), y0, y1);
    parentPort.postMessage({ y0, ...r }, [r.fl.buffer, r.ref.buffer, r.rr.buffer]);
  });
} else {
  const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const quick = args.includes('--quick'), ss = quick ? 1 : +opt('--ss', 2), w = +opt('--w', quick ? 960 : 1920), h = Math.round(w / 2.39);
  const out = opt('--out', path.join(REPO, '../../lab/out/series'));
  const ids = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && ['--w', '--ss', '--out'].includes(args[i - 1])));
  const list = ids.length ? SHOTS.filter((s) => ids.includes(s.id)) : SHOTS;
  fs.mkdirSync(out, { recursive: true });
  // the pictures the scenes use, painted once in Chromium (textures.js)
  const { chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs');
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const sv = http.createServer((q, r) => { const f = path.join(REPO, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': f.endsWith('.js') || f.endsWith('.mjs') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); r.end(b); } }); });
  await new Promise((r) => sv.listen(0, r));
  const base = `http://127.0.0.1:${sv.address().port}`;
  const pg = await br.newPage();
  await pg.goto(base + '/tools/lab/series/blank.html');
  const need = [...new Set(list.flatMap((s) => s.tex || []))];
  const tex = {};
  for (const name of need) {
    const b64 = await pg.evaluate(async (name) => { const T = await import('/tools/lab/series/textures.js'); return T.paint(name); }, name);
    tex[name] = toLinear(decodePNG(Buffer.from(b64, 'base64')));
  }
  for (const s of list) {
    const t0 = performance.now(), W = w * ss, H = h * ss;
    const fl = new Float32Array(W * H * 3), ref = new Float32Array(W * H * 3), rr = new Float32Array(W * H);
    const bands = []; const bh = Math.max(8, Math.ceil(H / 48)); for (let y = 0; y < H; y += bh) bands.push([y, Math.min(H, y + bh)]);
    const total = bands.length; let left = total;
    await new Promise((done) => {
      for (let k = 0; k < Math.max(1, os.cpus().length); k++) {
        const wk = new Worker(url.fileURLToPath(import.meta.url), { workerData: { tex } });
        const next = () => { const b = bands.shift(); if (b) wk.postMessage({ id: s.id, W, H, y0: b[0], y1: b[1], quick }); else wk.terminate(); };
        wk.on('message', (m) => { fl.set(m.fl, m.y0 * W * 3); ref.set(m.ref, m.y0 * W * 3); rr.set(m.rr, m.y0 * W); left--; if (left % 12 === 0 && process.stdout.isTTY) process.stdout.write(`\r${s.id} ${s.name}: ${Math.round((1 - left / total) * 100)}%   `); if (!left) done(); next(); });
        wk.on('error', (e) => { console.error(e); process.exit(1); });
        next();
      }
    });
    const spec = s.scene(camFor(s, W, H), s);
    smear(ref, rr, W, H, spec.refl?.streak ?? Math.round(W * 0.01));
    for (let i = 0; i < fl.length; i++) fl[i] += ref[i];
    const sm = new Float32Array(w * h * 3), k = 1 / (ss * ss);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) { let v = 0; for (let j = 0; j < ss; j++) for (let i = 0; i < ss; i++) v += fl[((y * ss + j) * W + x * ss + i) * 3 + c]; sm[(y * w + x) * 3 + c] = v * k; }
    const raw = encodePNG(film(sm, w, h, spec.exposure ?? 1), w, h);
    fs.writeFileSync(path.join(out, `${s.id}_raw.png`), raw);
    // the air and the film, in Chromium
    const jpg = await pg.evaluate(async ({ id, src, w, h }) => { const O = await import('/tools/lab/series/finish.js'); return O.finish(id, src, w, h); }, { id: s.id, src: 'data:image/png;base64,' + raw.toString('base64'), w, h });
    fs.writeFileSync(path.join(out, `${s.id}.jpg`), Buffer.from(jpg, 'base64'));
    console.log(`${s.id} ${s.name}: ${w}×${h} (×${ss}) in ${((performance.now() - t0) / 1000).toFixed(0)} s → ${path.join(out, s.id + '.jpg')}`);
  }
  await br.close(); sv.close();
}
