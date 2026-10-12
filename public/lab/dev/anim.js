// Dev-only: runtime rig review. ?mode=lineup | strip&id=vex&state=run
import { createGL } from '../js/gfx/gl.js';
import { Atlas } from '../js/gfx/atlas.js';
import { SpriteBatch } from '../js/gfx/batch.js';
import { CharRenderer } from '../js/gfx/charrender.js';
import { bakeAll } from '../js/gfx/baker.js';
import { charBakeList } from '../js/game/bakechars.js';
import { Character } from '../js/game/character.js';

const q = new URLSearchParams(location.search);
const mode = q.get('mode') || 'lineup';
const W = +(q.get('w') || 1800), H = +(q.get('h') || 560);
const cv = document.getElementById('c'); cv.width = W; cv.height = H; cv.style.width = W + 'px'; cv.style.height = H + 'px';
const gl = createGL(cv);
const atlas = new Atlas(gl);
const ids = ['vex', 'hale', 'morrow', 'kite', 'brick', 'tet', 'kal'];
const ppu = +(q.get('ppu') || 6);
await bakeAll(atlas, charBakeList(ids, ppu));
const B = new SpriteBatch(gl, atlas);
const CR = new CharRenderer(gl, B);
CR.configure(ppu);

function fakeMover(o = {}) {
  return { x: 0, y: 0, vx: 0, vy: 0, facing: 1, grounded: true, state: 'ground', crouching: false, h: 58, mantle: { t: 0, dur: 0.3 }, ev: { land: 0 }, ...o };
}
const STATES = {
  idle: {}, walk: { vx: 70 }, run: { vx: 165 }, sprint: { vx: 240 }, back: { vx: -110 },
  crouch: { crouching: true }, crouchwalk: { crouching: true, vx: 55 },
  jump: { grounded: false, state: 'air', vy: -300 }, fall: { grounded: false, state: 'air', vy: 400 },
  slide: { state: 'slide', vx: 230, crouching: true }, ladder: { state: 'ladder', grounded: false },
  mantle: { state: 'mantle', grounded: false, mantle: { t: 0.15, dur: 0.3 } },
};
// simulate `sec` seconds of a state so blends and the gait settle
function makeChar(id, st, sec, aim = 0, facing = 1, phase = null) {
  const m = fakeMover({ ...STATES[st], facing });
  const c = new Character(id, atlas, m);
  c.setAim(m.x + facing * 200, m.y - 50 + Math.tan(aim) * 200);
  const n = Math.round(sec * 120);
  for (let i = 0; i < n; i++) {
    c.preStep();
    m.x += m.vx / 120; if (st === 'ladder') m.y -= 96 / 120;
    if (st === 'mantle') m.mantle.t = Math.min(m.mantle.dur, 0.06 + i / 120 * 0.1);
    c.postStep(1 / 120);
  }
  if (phase !== null) c.anim.phase = phase;
  m.x = 0; m.y = 0; c.px = 0; c.py = 0;
  for (const { c: ch } of c.chains) ch.init = false;
  for (let i = 0; i < 90; i++) { m.x += 0; c.postStep(1 / 120); }
  c.prepare(1, null);
  return c;
}

const view = new Float32Array(9);
function setView(cx, cy, viewH) {
  const vw = viewH * W / H, sx = 2 / vw, sy = -2 / viewH;
  view.set([sx, 0, 0, 0, sy, 0, -cx * sx, -cy * sy, 1]);
}
gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
gl.clearColor(0.165, 0.196, 0.239, 1); gl.clear(gl.COLOR_BUFFER_BIT);
const restore = () => { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); };
const list = [];
if (mode === 'lineup') {
  const spacing = 64;
  ids.forEach((id, i) => { const c = makeChar(id, 'idle', 1.0, 0); c.rx = i * spacing; c.ry = 0; list.push(c); });
  const v = makeChar('vex', 'idle', 1.0, -0.4, -1); v.rx = ids.length * spacing; v.ry = 0; list.push(v);
  setView((ids.length * spacing) / 2, -40, 168);
} else if (mode === 'states') {
  const id = q.get('id') || 'vex';
  const sts = ['idle', 'crouch', 'crouchwalk', 'jump', 'fall', 'slide', 'ladder', 'mantle', 'back'];
  sts.forEach((st, i) => { const c = makeChar(id, st, 0.6, st === 'back' ? -0.3 : 0, 1, 0.3); c.rx = i * 62; c.ry = 0; list.push(c); });
  setView(((sts.length - 1) * 62) / 2, -40, 175);
} else {
  const id = q.get('id') || 'vex', st = q.get('state') || 'run', n = +(q.get('n') || 8);
  const aim = +(q.get('aim') || 0);
  for (let i = 0; i < n; i++) { const c = makeChar(id, st, 0.8, aim, 1, i / n); c.rx = i * 60; c.ry = 0; list.push(c); }
  setView(((n - 1) * 60) / 2, -40, 112);
}
CR.begin(list);
for (const c of list) CR.composite(c, view, restore);
// ground line
window.__dbg = list.map((c) => c.chains.map(({ c: ch }) => [Array.from(ch.x).map((v) => +v.toFixed(1)), Array.from(ch.y).map((v) => +v.toFixed(1))]));
window.__done = 1;
