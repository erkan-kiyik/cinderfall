// KOR — boot.
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
import * as M1 from './test/m1scene.js';
import * as M2 from './test/m2scene.js';
import * as M3 from './test/m3scene.js';
import * as M4 from './game/mission.js';
import { Controls, bindKeyboard, bindTouch } from './game/input.js';
import { PerfOverlay } from './ui/perf.js';
import { Save } from './core/save.js';
import { Sfx } from './audio/sfx.js';
import { setLang } from './ui/i18n.js';
import { App } from './app.js';
import { opName } from './ui/data.js';
import { Intro } from './ui/intro.js';

export const VERSION = 'M5 · ' + '2026-10-13';

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };

// the picture is kept at high on every device; dynamic resolution (floor
// 80 %) holds the frame rate, and Settings can still lower it
function autoQuality() { return 'high'; }

async function main() {
  const canvas = $('#game');
  const gl = createGL(canvas);
  if (!gl) { $('#boot').classList.add('fail'); $('#boot .msg').textContent = 'Bu cihaz WebGL2 desteklemiyor.'; return; }
  // the app (menus) unless a dev scene is asked for: ?scene=m1|m2|m3|mission
  const DEV = { m1: M1, m2: M2, m3: M3, mission: M4 }[params.get('scene')] || null;
  const save = DEV ? null : new Save();
  if (save) setLang(save.d.settings.lang);
  const savedQ = save && save.d.settings.quality !== 'auto' ? save.d.settings.quality : null;
  const quality = params.get('q') || savedQ || (DEV && store.get('kor-lab-q')) || autoQuality();
  // the sample text pulls in the latin-ext halves too: the signs are lettered in Turkish
  await Promise.all(['700 20px Rajdhani', '600 20px Rajdhani', '400 12px Inter', "800 20px 'Big Shoulders Stencil'", "700 20px 'Barlow Condensed'", "400 12px Barlow", "400 12px 'Special Elite'"].map((f) => document.fonts.load(f, 'AaİŞĞÇÖÜış')));
  // the opening plays over the bake (not for dev scenes; ?nointro skips it)
  let intro = null;
  if (!DEV && !params.has('nointro')) {
    const cv = document.createElement('canvas'); cv.id = 'intro'; document.body.appendChild(cv);
    $('#boot').classList.add('done');
    intro = new Intro(cv, { reduce: save.d.settings.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches });
    intro.run();
  }

  const bar = $('#boot .fill');
  const atlas = new Atlas(gl, 2048);
  const SC = DEV || M4;
  const play = SC !== M1;
  const bake = await bakeAll(atlas, SC.bakeList(quality), {
    key: params.has('nocache') ? null : `${SC.BAKE_VERSION}:${quality}:${atlas.size}`,
    onProgress: (p) => { bar.style.width = (p * 100).toFixed(0) + '%'; intro?.setProgress(p); },
  });
  const renderer = new Renderer(gl, canvas);
  // phones with 3 GB or less: the same quality, at most 2× pixel ratio
  if ((navigator.deviceMemory || 8) <= 3) renderer.dprCap = 2;
  renderer.setQuality(quality);
  const camera = new Camera(); camera.viewH = play ? 192 : 150;
  const batch = new SpriteBatch(gl, atlas);
  const eng = { gl, atlas, batch, camera, renderer, sfx: DEV ? null : new Sfx() };
  // street effects level 0..2: phones with little memory start one step lighter
  eng.fxMax = 2; eng.fxLevel = (navigator.deviceMemory || 8) <= 3 ? 1 : 2;
  const controls = new Controls();
  let scene = null, app = null;
  if (DEV) scene = SC === M1 ? new M1.M1Scene(eng) : SC === M2 ? new M2.M2Scene(eng, controls) : SC === M3 ? new M3.M3Scene(eng, controls) : new M4.MissionScene(eng, controls, { id: params.get('m') || 'm1', diff: params.get('diff') || 'normal' });
  if (DEV && play) {
    bindKeyboard(controls, canvas);
    if (matchMedia('(pointer: coarse)').matches || params.has('touch')) bindTouch(controls, $('#hud'));
  }
  if (scene && params.get('stress') && scene.setStress) scene.setStress(+params.get('stress'));

  // dynamic resolution: step down after 1 s over budget, back up after 4 s of headroom
  const dyn = { on: true, step: 0, over: 0, under: 0, failedAt: new Float64Array(RES_STEPS.length).fill(-1e9), next: 0 };
  function dynTick(now) {
    if (!dyn.on || now < dyn.next) return;
    dyn.next = now + 500;
    const s = loop.stats(60); if (!s) return;
    const budget = 1000 / loop.hz;
    if (s.avg > budget * 1.08) { dyn.over++; dyn.under = 0; } else if (s.avg < budget * 1.02 && s.p95 < budget * 1.35) { dyn.under++; dyn.over = 0; } else { dyn.over = 0; dyn.under = 0; }
    if (dyn.over >= 2 && dyn.step < RES_STEPS.length - 1) { dyn.failedAt[dyn.step] = now; dyn.step++; dyn.over = 0; renderer.setDyn(RES_STEPS[dyn.step]); }
    // resolution already at its floor and still over budget: thin the street effects (rain, reflections, steam)
    else if (dyn.over >= 4 && dyn.step === RES_STEPS.length - 1 && eng.fxLevel > 0) { eng.fxLevel--; dyn.over = 0; dyn.fxAt = now; }
    else if (dyn.under >= 16 && eng.fxLevel < eng.fxMax && now - (dyn.fxAt || 0) > 30000) { eng.fxLevel++; dyn.under = 0; }
    else if (dyn.under >= 8 && dyn.step > 0 && now - dyn.failedAt[dyn.step - 1] > 20000) { dyn.step--; dyn.under = 0; renderer.setDyn(RES_STEPS[dyn.step]); }
  }

  const loop = new Loop({
    update: (dt) => (app || scene).update(dt),
    render: (alpha) => {
      renderer.resize();
      camera.aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
      (app || scene).render(alpha);
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

  // dev scenes: a control bar for stress, quality and effects
  if (DEV) {
    const ctl = $('#ctl');
    const btn = (label, fn) => { const b = document.createElement('button'); b.className = 'chip cut'; b.textContent = label; b.onclick = (ev) => { ev.stopPropagation(); fn(b); }; ctl.appendChild(b); return b; };
    const STRESS = [0, 2000, 10000, 20000];
    if (play) btn('OPERATÖR ' + opName('vex'), (b) => { b.textContent = 'OPERATÖR ' + opName(scene.switchOperator()); });
    else btn(`STRES ${scene.N}`, (b) => { const n = STRESS[(STRESS.indexOf(scene.N) + 1) % STRESS.length]; scene.setStress(n); b.textContent = `STRES ${n}`; });
    const QN = ['low', 'med', 'high'], QL = { low: 'DÜŞÜK', med: 'ORTA', high: 'YÜKSEK' };
    btn(`KALİTE ${QL[quality]}`, (b) => { const q = QN[(QN.indexOf(renderer.qName) + 1) % 3]; renderer.setQuality(q); store.set('kor-lab-q', q); b.textContent = `KALİTE ${QL[q]}`; });
    btn('OTO ÇÖZ. AÇIK', (b) => { dyn.on = !dyn.on; if (!dyn.on) { dyn.step = 0; renderer.setDyn(1); } b.textContent = dyn.on ? 'OTO ÇÖZ. AÇIK' : 'OTO ÇÖZ. KAPALI'; });
    btn('BLOOM AÇIK', (b) => { renderer.bloomOn = !renderer.bloomOn; b.textContent = renderer.bloomOn ? 'BLOOM AÇIK' : 'BLOOM KAPALI'; });
    btn('IŞIK AÇIK', (b) => { renderer.lightsOn = !renderer.lightsOn; b.textContent = renderer.lightsOn ? 'IŞIK AÇIK' : 'IŞIK KAPALI'; });
    if (SC === M1) btn('PATLAT', () => scene.explode(scene.camX + (Math.random() - 0.5) * 120, -4));
    btn('PANEL', () => perf.toggle());
    if (scene.pause) btn('DURAKLAT', () => scene.pause());
    addEventListener('keydown', (e) => { if (e.code === 'Escape' && scene.pause) scene.pause(); });

  }
  // drag pans the camera; a tap sets off an explosion where you touched
  let down = null;
  if (SC === M1) canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }; canvas.setPointerCapture(e.pointerId); });
  if (SC === M1) canvas.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x; down.moved += Math.abs(dx); down.x = e.clientX;
    if (down.moved > 6) scene.pan(-dx / canvas.clientHeight * camera.viewH);
  });
  if (SC === M1) canvas.addEventListener('pointerup', (e) => {
    if (down && down.moved <= 6 && performance.now() - down.t < 400) {
      const [wx] = camera.toWorld(e.clientX / canvas.clientWidth, e.clientY / canvas.clientHeight);
      scene.explode(wx, -4);
    }
    down = null;
  });

  if (!DEV) {
    eng.loop = loop;
    perf.toggle(); // hidden unless the player turns it on in Settings
    app = new App(eng, { save, version: VERSION, controls, perf, dyn });
  }
  $('#boot').classList.add('done');
  // with the opening, the lobby starts at the hand-off so its entrance plays as the intro fades
  const go = () => { app?.start({ entrance: !!intro }); loop.start(); };
  if (intro) { intro.onHandoff = go; intro.assetsDone(); } else go();
  // test harness hook
  window.__lab = { loop, get scene() { return app ? app.scene : scene; }, app, renderer, atlas, bake, batch, camera, controls, setStress: (n) => scene && scene.setStress && scene.setStress(n), setQuality: (q) => renderer.setQuality(q), dyn };
}

main().catch((err) => {
  console.error(err);
  const m = $('#boot .msg'); if (m) m.textContent = 'Hata: ' + err.message;
  $('#boot').classList.add('fail');
});
