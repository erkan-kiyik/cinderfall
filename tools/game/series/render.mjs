// KOR — render stills of the series: node tools/game/series/render.mjs 01 02 …
//   --w 1920   output width (2.39:1)      --ss 2   supersampling per axis
//   --quick    a fast look (no supersampling, fewer samples)
//   --out dir  where the frames go (default: the scratch folder next to the repo)
//   --plates [names…]  bake the opening's plates instead (opening.js; cameras in
//              public/game/js/cine/plates.js) to public/game/assets/plates/<name>.webp
// Each image: traced in bands over worker threads (tools/game/plate/trace.js),
// the wet streaks over the whole frame, the lens (dof.mjs) where asked, boxed
// down in linear light, the film curve. A still then gets the moving air
// (rain, steam, sparks, from shots' `air`) and the film look (js/cine/post.js)
// in a headless Chromium and is written as a JPEG; a plate goes out as a WebP
// with neither (the opening draws those live).
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import os from 'node:os'; import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url'; import http from 'node:http';
import { compile, renderBand, film, smear } from '../plate/trace.js';
import { SHOTS } from './shots.js';
import { OPEN } from './opening.js';
import { PLATES, plateCam } from '../../../public/game/js/cine/plates.js';
import { encodePNG, decodePNG, toLinear } from './png.mjs';
import { lensBlur } from './dof.mjs';

const HERE = path.dirname(url.fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '../../..');
const HQ = { hdr: true, aa: false, aoStep: 1, ao: { n: 12 }, vs: 2, vn: 20, shadowN: 2 };
const QUICK = { hdr: true, aa: false, aoStep: 2, ao: { n: 5 }, vs: 4, vn: 8, shadowN: 1 };

// a job: a shot of the series or a plate of the opening, at a size (W×H traced, ss× the output)
function job(kind, key) {
  if (kind === 'plate') {
    const o = OPEN[key], P = PLATES[key];
    return { key, name: key, tex: o.tex, dof: o.dof, scene: o.scene, size: () => [P.W, P.H], cam: (W, H, ss) => plateCam(key, ss) };
  }
  const s = SHOTS.find((x) => x.id === key);
  return { key, name: `${s.id} ${s.name}`, tex: s.tex || [], dof: s.dof, scene: (cam) => s.scene(cam, s), shot: s,
    cam: (W, H) => ({ W, H, f: (s.cam.mm / 36) * W, cx: W / 2, cy: H / 2, p: s.cam.pos.slice(), yaw: s.cam.yaw || 0, pitch: s.cam.pitch || 0 }) };
}

function specFor(j, cam, tex, quick) {
  const spec = j.scene(cam);
  spec.textures = tex;
  const q = quick ? QUICK : HQ;
  const vs = Math.min(q.vs, spec.vs ?? 99);
  Object.assign(spec, q, { vs, ao: { ...(spec.ao || {}), ...q.ao } });
  if (spec.gi) spec.gi = { ...spec.gi, n: quick ? Math.min(8, spec.gi.n ?? 16) : spec.gi.n ?? 24, step: quick ? 4 : spec.gi.step ?? 2 };
  return spec;
}

if (!isMainThread) {
  const { tex } = workerData, cache = new Map();
  parentPort.on('message', ({ kind, key, W, H, ss, y0, y1, quick }) => {
    const ck = kind + key + W + quick;
    if (!cache.has(ck)) { const j = job(kind, key); cache.clear(); cache.set(ck, compile(specFor(j, j.cam(W, H, ss), tex, quick))); }
    const r = renderBand(cache.get(ck), y0, y1);
    parentPort.postMessage({ y0, ...r }, [r.fl.buffer, r.ref.buffer, r.rr.buffer, r.dep.buffer]);
  });
} else {
  const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const plates = args.includes('--plates'), quick = args.includes('--quick');
  const ss = quick ? 1 : +opt('--ss', 2), w = +opt('--w', quick ? 960 : 1920), h = Math.round(w / 2.39);
  const out = opt('--out', plates ? path.join(REPO, 'public/game/assets/plates') : path.join(REPO, '../../lab/out/series'));
  const ids = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && ['--w', '--ss', '--out'].includes(args[i - 1])));
  const kind = plates ? 'plate' : 'shot';
  const keys = ids.length ? ids : plates ? Object.keys(OPEN) : SHOTS.map((s) => s.id);
  const jobs = keys.map((k) => job(kind, k));
  fs.mkdirSync(out, { recursive: true });
  // the pictures the scenes use, painted once in Chromium (textures.js)
  const { chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs');
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const sv = http.createServer((q, r) => { const f = path.join(REPO, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': f.endsWith('.js') || f.endsWith('.mjs') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); r.end(b); } }); });
  await new Promise((r) => sv.listen(0, r));
  const pg = await br.newPage();
  await pg.goto(`http://127.0.0.1:${sv.address().port}/tools/game/series/blank.html`);
  const tex = {};
  for (const name of new Set(jobs.flatMap((j) => j.tex))) {
    const b64 = await pg.evaluate(async (name) => { const T = await import('/tools/game/series/textures.js'); return T.paint(name); }, name);
    tex[name] = toLinear(decodePNG(Buffer.from(b64, 'base64')));
  }
  for (const j of jobs) {
    const t0 = performance.now(), [ow, oh] = j.size ? j.size() : [w, h], W = ow * ss, H = oh * ss;
    const fl = new Float32Array(W * H * 3), ref = new Float32Array(W * H * 3), rr = new Float32Array(W * H), dep = new Float32Array(W * H);
    const bands = []; const bh = Math.max(8, Math.ceil(H / 48)); for (let y = 0; y < H; y += bh) bands.push([y, Math.min(H, y + bh)]);
    let left = bands.length;
    await new Promise((done) => {
      for (let k = 0; k < Math.max(1, os.cpus().length); k++) {
        const wk = new Worker(url.fileURLToPath(import.meta.url), { workerData: { tex } });
        const next = () => { const b = bands.shift(); if (b) wk.postMessage({ kind, key: j.key, W, H, ss, y0: b[0], y1: b[1], quick }); else wk.terminate(); };
        wk.on('message', (m) => { fl.set(m.fl, m.y0 * W * 3); ref.set(m.ref, m.y0 * W * 3); rr.set(m.rr, m.y0 * W); dep.set(m.dep, m.y0 * W); if (!--left) done(); next(); });
        wk.on('error', (e) => { console.error(e); process.exit(1); });
        next();
      }
    });
    const cam = j.cam(W, H, ss), spec = j.scene(cam);
    smear(ref, rr, W, H, spec.refl?.streak ?? Math.round(W * 0.01));
    for (let i = 0; i < fl.length; i++) fl[i] += ref[i];
    // the lens: depth of field where it is asked for (dof: { focus: m, n: f-number })
    if (j.dof) lensBlur(fl, dep, W, H, cam, { ...j.dof, max: (j.dof.max ?? 14) * ss });
    const sm = new Float32Array(ow * oh * 3), k = 1 / (ss * ss);
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) for (let c = 0; c < 3; c++) { let v = 0; for (let jj = 0; jj < ss; jj++) for (let i = 0; i < ss; i++) v += fl[((y * ss + jj) * W + x * ss + i) * 3 + c]; sm[(y * ow + x) * 3 + c] = v * k; }
    const raw = encodePNG(film(sm, ow, oh, spec.exposure ?? 1), ow, oh), secs = ((performance.now() - t0) / 1000).toFixed(0);
    if (plates) {
      const b64 = await pg.evaluate(async (src) => { const img = new Image(); img.src = src; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); return c.toDataURL('image/webp', 0.86).split(',')[1]; }, 'data:image/png;base64,' + raw.toString('base64'));
      const f = path.join(out, `${j.key}.webp`); fs.writeFileSync(f, Buffer.from(b64, 'base64'));
      console.log(`${j.key}: ${ow}×${oh} (×${ss}) in ${secs} s → ${f} (${(fs.statSync(f).size / 1024).toFixed(0)} KB)`);
      continue;
    }
    fs.writeFileSync(path.join(out, `${j.shot.id}_raw.png`), raw);
    // the air and the film, in Chromium
    const jpg = await pg.evaluate(async ({ id, src, w, h }) => { const O = await import('/tools/game/series/finish.js'); return O.finish(id, src, w, h); }, { id: j.shot.id, src: 'data:image/png;base64,' + raw.toString('base64'), w: ow, h: oh });
    fs.writeFileSync(path.join(out, `${j.shot.id}.jpg`), Buffer.from(jpg, 'base64'));
    console.log(`${j.name}: ${ow}×${oh} (×${ss}) in ${secs} s → ${path.join(out, j.shot.id + '.jpg')}`);
  }
  await br.close(); sv.close();
}
