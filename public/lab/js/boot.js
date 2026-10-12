// CINDERFALL LAB — boot (M1: engine test).
//
// WebGL2 check → quality pick → bake or load the atlas from cache → start the
// 120 Hz loop on the engine test scene, with the performance overlay and a
// small control bar for stress, quality and effect toggles.
import { createGL } from './gfx/gl.js';
import { Atlas } from './gfx/atlas.js';
import { SpriteBatch } from './gfx/batch.js';
import { Camera } from './gfx/camera.js';
import { Renderer, RES_STEPS } from './gfx/renderer.js';
import { bakeAll } from './gfx/baker.js';
import { Loop } from './core/loop.js';
import { M1Scene, bakeList, BAKE_VERSION } from './test/m1scene.js';
import { PerfOverlay } from './ui/perf.js';

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };

function autoQuality() {
  const mobile = matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
  if (!mobile) return 'high';
  const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
  return mem <= 3 || cores <= 4 ? 'low' : 'med';
}

async function main() {
  const canvas = $('#game');
  const gl = createGL(canvas);
  if (!gl) { $('#boot').classList.add('fail'); $('#boot .msg').textContent = 'Bu cihaz WebGL2 desteklemiyor.'; return; }
  const quality = params.get('q') || store.get('cf-lab-q') || autoQuality();
  await Promise.all(['700 20px Rajdhani', '600 20px Rajdhani', '400 12px Inter'].map((f) => document.fonts.load(f)));

  const bar = $('#boot .fill');
  const atlas = new Atlas(gl, 2048);
  const bake = await bakeAll(atlas, bakeList(quality), {
    key: params.has('nocache') ? null : `${BAKE_VERSION}:${quality}:${atlas.size}`,
    onProgress: (p) => { bar.style.width = (p * 100).toFixed(0) + '%'; },
  });
  const renderer = new Renderer(gl, canvas);
  renderer.setQuality(quality);
  const camera = new Camera(); camera.viewH = 150;
  const batch = new SpriteBatch(gl, atlas);
  const eng = { gl, atlas, batch, camera, renderer };
  const scene = new M1Scene(eng);
  if (params.get('stress')) scene.setStress(+params.get('stress'));

  // dynamic resolution: step down after 1 s over budget, back up after 4 s of headroom
  const dyn = { on: true, step: 0, over: 0, under: 0, failedAt: new Float64Array(RES_STEPS.length).fill(-1e9), next: 0 };
  function dynTick(now) {
    if (!dyn.on || now < dyn.next) return;
    dyn.next = now + 500;
    const s = loop.stats(60); if (!s) return;
    const budget = 1000 / loop.hz;
    if (s.avg > budget * 1.08) { dyn.over++; dyn.under = 0; } else if (s.avg < budget * 1.02 && s.p95 < budget * 1.35) { dyn.under++; dyn.over = 0; } else { dyn.over = 0; dyn.under = 0; }
    if (dyn.over >= 2 && dyn.step < RES_STEPS.length - 1) { dyn.failedAt[dyn.step] = now; dyn.step++; dyn.over = 0; renderer.setDyn(RES_STEPS[dyn.step]); }
    else if (dyn.under >= 8 && dyn.step > 0 && now - dyn.failedAt[dyn.step - 1] > 20000) { dyn.step--; dyn.under = 0; renderer.setDyn(RES_STEPS[dyn.step]); }
  }

  const loop = new Loop({
    update: (dt) => scene.update(dt),
    render: (alpha) => {
      renderer.resize();
      camera.aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
      scene.render(alpha);
      const now = performance.now();
      dynTick(now);
      perf.update(now);
    },
  });
  const perf = new PerfOverlay($('#hud'), loop, () => ({
    draws: batch.drawCalls, sprites: batch.sprites, lights: renderer.lastLights, passes: renderer.passes,
    res: `${renderer.rw}×${renderer.rh}`, quality: { low: 'DÜŞÜK', med: 'ORTA', high: 'YÜKSEK' }[renderer.qName], dyn: renderer.dyn.toFixed(2),
    pages: atlas.pages.length, mem: atlas.memoryMB().toFixed(0), bake: bake.cached ? `önbellek ${bake.ms.toFixed(0)} ms` : `${bake.ms.toFixed(0)} ms`,
  }));

  // controls
  const ctl = $('#ctl');
  const btn = (label, fn) => { const b = document.createElement('button'); b.className = 'chip cut'; b.textContent = label; b.onclick = (ev) => { ev.stopPropagation(); fn(b); }; ctl.appendChild(b); return b; };
  const STRESS = [0, 2000, 10000, 20000];
  btn(`STRES ${scene.N}`, (b) => { const n = STRESS[(STRESS.indexOf(scene.N) + 1) % STRESS.length]; scene.setStress(n); b.textContent = `STRES ${n}`; });
  const QN = ['low', 'med', 'high'], QL = { low: 'DÜŞÜK', med: 'ORTA', high: 'YÜKSEK' };
  btn(`KALİTE ${QL[quality]}`, (b) => { const q = QN[(QN.indexOf(renderer.qName) + 1) % 3]; renderer.setQuality(q); store.set('cf-lab-q', q); b.textContent = `KALİTE ${QL[q]}`; });
  btn('OTO ÇÖZ. AÇIK', (b) => { dyn.on = !dyn.on; if (!dyn.on) { dyn.step = 0; renderer.setDyn(1); } b.textContent = dyn.on ? 'OTO ÇÖZ. AÇIK' : 'OTO ÇÖZ. KAPALI'; });
  btn('BLOOM AÇIK', (b) => { renderer.bloomOn = !renderer.bloomOn; b.textContent = renderer.bloomOn ? 'BLOOM AÇIK' : 'BLOOM KAPALI'; });
  btn('IŞIK AÇIK', (b) => { renderer.lightsOn = !renderer.lightsOn; b.textContent = renderer.lightsOn ? 'IŞIK AÇIK' : 'IŞIK KAPALI'; });
  btn('PATLAT', () => scene.explode(scene.camX + (Math.random() - 0.5) * 120, -4));
  btn('PANEL', () => perf.toggle());

  // drag pans the camera; a tap sets off an explosion where you touched
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x; down.moved += Math.abs(dx); down.x = e.clientX;
    if (down.moved > 6) scene.pan(-dx / canvas.clientHeight * camera.viewH);
  });
  canvas.addEventListener('pointerup', (e) => {
    if (down && down.moved <= 6 && performance.now() - down.t < 400) {
      const [wx] = camera.toWorld(e.clientX / canvas.clientWidth, e.clientY / canvas.clientHeight);
      scene.explode(wx, -4);
    }
    down = null;
  });

  $('#boot').classList.add('done');
  loop.start();
  // test harness hook
  window.__lab = { loop, scene, renderer, atlas, bake, batch, camera, setStress: (n) => scene.setStress(n), setQuality: (q) => renderer.setQuality(q), dyn };
}

main().catch((err) => {
  console.error(err);
  const m = $('#boot .msg'); if (m) m.textContent = 'Hata: ' + err.message;
  $('#boot').classList.add('fail');
});
