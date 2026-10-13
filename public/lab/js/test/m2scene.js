// CINDERFALL LAB — M2: movement course.
//
// The first playable: an operator with the full movement set (run, sprint,
// crouch, slide, jump, mantle, ladders, one-way decks, slopes) on a course
// built from tiles, rendered with the runtime rig and live outline. Syndicate
// troopers at the far end track the player with their aim.
import { STREET } from '../art/env/street.js';
import { buildCourse } from '../art/env/course.js';
import { FX, DENS } from './m1scene.js';
import { charBakeList } from '../game/bakechars.js';
import { Character } from '../game/character.js';
import { Mover } from '../phys/mover.js';
import { CharRenderer } from '../gfx/charrender.js';
import { ParticleSystem, col } from '../gfx/particles.js';
import { rgba } from '../gfx/batch.js';

export const BAKE_VERSION = 'm2-1';
export const OPERATORS = ['vex', 'hale', 'morrow', 'kite', 'brick'];
export const COURSE = buildCourse();

export function bakeList(quality, course = COURSE) {
  const [bg, ch, fx] = DENS[quality];
  const E = [];
  const layer = (name, box, paint, scale) => E.push({ name, box, scale, paint, chunk: 300 });
  layer('sky', [-10, -176, 610, -20], STREET.sky, Math.min(2, bg));
  layer('far', [-10, -182, 610, -58], STREET.farCity, bg * 0.6);
  layer('mid', [-10, -168, 610, -38], STREET.midIndustry, bg * 0.75);
  layer('fac', [-10, -118, 610, 0.5], STREET.facades, bg);
  layer('ground', [-10, -0.5, 610, 42], STREET.ground, bg);
  for (const p of [...course.props, ...course.front, ...course.deco]) E.push({ name: p.name, box: p.box, scale: ch, paint: p.paint, outline: 0.85 });
  E.push(...charBakeList([...OPERATORS, 'tet', 'kal'], ch));
  for (const [n, p] of Object.entries(FX)) {
    const box = n === 'tracer' ? [0, -0.5, 1, 0.5] : n === 'flame' ? [-0.6, -1.05, 0.6, 0.05] : [-1, -1, 1, 1];
    E.push({ name: 'fx.' + n, box, scale: fx * (n === 'tracer' ? 2 : 1), paint: p });
  }
  return E;
}

const PLX = { sky: 0, far: 0.15, mid: 0.35 };
const LAYER_Y = { sky: -176, far: -182, mid: -168, fac: -118, ground: -0.5 };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class M2Scene {
  constructor(eng, controls, course = COURSE) {
    this.e = eng; this.ctl = controls; this.C = course;
    const { gl, atlas, batch } = eng;
    this.L = this.C.level;
    this.cr = new CharRenderer(gl, batch);
    this.dust = new ParticleSystem(gl, atlas, atlas.get('fx.smoke'), 512, { additive: false });
    this.opIndex = 0;
    const [sx, sy] = this.C.spawn;
    this.mover = new Mover(this.L, sx, sy);
    this.player = new Character(OPERATORS[0], atlas, this.mover);
    this.enemies = this.C.enemies.map((d) => {
      const m = new Mover(this.L, d.x, d.y); m.facing = -1;
      const c = new Character(d.id, atlas, m); return c;
    });
    this.t = 0;
    this.cam = { x: sx + 60, y: -50, px: sx + 60, py: -50 };
    this.mats = { sky: new Float32Array(9), far: new Float32Array(9), mid: new Float32Array(9), world: new Float32Array(9) };
    this.inp = { moveX: 0, up: false, down: false, jump: false, jumpPressed: false, sprint: false, crouch: false, face: 1 };
  }

  switchOperator() {
    this.opIndex = (this.opIndex + 1) % OPERATORS.length;
    const p = new Character(OPERATORS[this.opIndex], this.e.atlas, this.mover);
    p.setAim(this.player.aimX, this.player.aimY);
    this.player = p;
    return OPERATORS[this.opIndex];
  }

  // world aim point from the controls
  aimPoint() {
    if (this.aimWorld) return this.aimWorld; // test hook: a fixed world point
    const c = this.ctl, m = this.mover, cam = this.e.camera, cv = this.e.renderer.canvas;
    if (c.aimMode === 'point') {
      const [wx, wy] = cam.toWorld(c.aimSX / cv.clientWidth, c.aimSY / cv.clientHeight);
      return [wx, wy];
    }
    // touch: stick direction, or the way you are moving when the stick is idle
    let dx = c.aimDX, dy = c.aimDY;
    if (!c.aimHeld && Math.abs(c.moveX) > 0.2) { dx = Math.sign(c.moveX); dy = 0; }
    const d = Math.hypot(dx, dy) || 1;
    return [m.x + (dx / d) * 200, m.y - 48 + (dy / d) * 200];
  }

  update(dt) {
    this.t += dt;
    const m = this.mover, c = this.ctl, inp = this.inp;
    const [ax, ay] = this.aimPoint();
    inp.moveX = c.moveX; inp.up = c.up; inp.down = c.down; inp.jump = c.jump; inp.sprint = c.sprint; inp.crouch = c.crouch;
    inp.jumpPressed = c.take();
    inp.face = Math.abs(ax - m.x) > 2 ? Math.sign(ax - m.x) : m.facing;
    if (m.state === 'ladder' && Math.abs(c.moveX) > 0.2) inp.face = Math.sign(c.moveX);
    const P = this.player;
    P.setAim(ax, ay);
    this.beforePlayerStep(dt, inp);
    P.preStep();
    m.step(dt, inp);
    P.postStep(dt, this.L);
    this.afterPlayerStep(dt);
    // dust: take-off, landing, sliding
    const ev = m.ev;
    if (ev.jump) this.puff(m.x, m.y, 4, 0.5);
    if (ev.land) this.puff(m.x, m.y, Math.min(10, 3 + ev.land / 80), 0.8);
    if (m.state === 'slide' && Math.random() < dt * 40) this.puff(m.x - m.facing * 6, m.y, 1, 0.5);
    if (ev.mantle) this.puff(m.mantle.x1, m.mantle.y1, 3, 0.4);
    // fell out of the world: back to the start
    if (m.y > 300) { m.x = this.C.spawn[0]; m.y = this.C.spawn[1] - 20; m.vx = m.vy = 0; m.state = 'air'; }
    this.updateEnemies(dt);
    // camera: lead in the facing direction, ease vertically
    const cam = this.cam, e = this.e.camera;
    cam.px = cam.x; cam.py = cam.y;
    // lead in the facing direction and a little toward where you aim
    const lead = m.facing * 36 + m.vx * 0.12 + clamp((ax - m.x) * 0.12, -26, 26);
    const tx = clamp(m.x + lead, e.viewW / 2 + 4, this.C.width - e.viewW / 2 - 4);
    const ty = clamp(m.y - 44 + clamp((ay - m.y + 48) * 0.3, -44, 30), -176 + e.viewH / 2, 42 - e.viewH / 2);
    cam.x += (tx - cam.x) * (1 - Math.exp(-dt * 5));
    cam.y += (ty - cam.y) * (1 - Math.exp(-dt * 3.5));
    e.update(dt);
    this.afterUpdate(dt);
  }

  // --- hooks for scenes built on this one ---------------------------------------------
  beforePlayerStep() {}
  afterPlayerStep() {}
  afterUpdate() {}
  drawWorldExtras() {}
  drawFrontExtras() {}
  addLights() {}
  drawGlow() {}
  // troopers track the player's chest
  updateEnemies(dt) {
    const m = this.mover;
    for (const e of this.enemies) {
      e.m.facing = m.x < e.m.x ? -1 : 1;
      e.setAim(m.x, m.y - (m.crouching ? 30 : 42));
      e.preStep(); e.m.step(dt, { moveX: 0, face: e.m.facing }); e.postStep(dt, this.L);
    }
  }

  puff(x, y, n, s) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI, sp = 10 + Math.random() * 30;
      this.dust.emit(this.t, x + (Math.random() - 0.5) * 8, y - 1, Math.cos(a) * sp, -Math.sin(a) * sp * 0.4, 0.6 + Math.random() * 0.4, 2 * s, 7 * s, col('#a49c96', 0.4), col('#a49c96', 0), -8, 2.6, Math.random() * 6, 0.5);
    }
  }

  viewFor(key, p, ax) {
    const cam = this.e.camera, save = cam.x;
    if (p !== 1) cam.x = ax + (save - ax) * p;
    cam.matrix(1, this.mats[key]);
    cam.x = save;
    return this.mats[key];
  }

  render(alpha) {
    const e = this.e, R = e.renderer, B = e.batch, A = e.atlas, cam = e.camera, t = this.t;
    cam.x = this.cam.px + (this.cam.x - this.cam.px) * alpha;
    cam.y = this.cam.py + (this.cam.y - this.cam.py) * alpha;
    const w = this.viewFor('world', 1);
    const ppu = R.rh / cam.viewH;
    this.cr.configure(ppu);
    // characters this frame (prepared before anything binds the scene target)
    const chars = [...this.enemies, this.player];
    for (const c of chars) c.prepare(alpha);
    this.cr.begin(chars);
    // lights
    const vw = cam.viewW, x0 = cam.x - vw / 2 - 120, x1 = cam.x + vw / 2 + 120;
    for (const lx of this.C.lamps) if (lx > x0 && lx < x1) { R.addLight(lx + 15, -78, 100, 1.2, [1, 0.84, 0.6], Math.PI / 2, Math.cos(0.44), 0.18); R.addLight(lx + 15, -80, 22, 0.8, [1, 0.9, 0.7]); }
    const neon = (t % 6.1) > 5.8 && ((t * 30) | 0) % 2 ? 0.25 : 1;
    const kN = Math.ceil(this.C.width / 600) + 1;
    for (let k = -1; k < kN; k++) {
      const ox = k * 600;
      if (232 + ox > x0 && 232 + ox < x1) { R.addLight(232 + ox, -72, 70, 0.95 * neon, [1, 0.4, 0.3]); R.addLight(221 + ox, -6, 60, 0.55, [1, 0.56, 0.32]); }
      if (364 + ox > x0 && 364 + ox < x1) R.addLight(364 + ox, -100, 54, 0.45, [1, 0.22, 0.26]);
    }
    R.addLight(1107, -20, 80, 1.2 * (0.86 + Math.sin(t * 23) * 0.06 + Math.sin(t * 7.3) * 0.06), [1, 0.55, 0.24]);
    for (const en of this.enemies) if (en.alive) R.addLight(en.rx + en.facing * 4, en.ry - 55, 12, 0.6, [1, 0.2, 0.25]);
    // background: parallax layers repeated along the street
    R.beginScene();
    B.resetStats();
    const restore = () => { R.scene.bind(); };
    const kMax = Math.ceil(this.C.width / 600) + 1;
    // each layer is 600 wide; copies every 600 cover the whole course
    const layer = (name, view) => {
      B.begin(view);
      for (let k = -2; k < kMax; k++) for (let i = 0; ; i++) {
        const r = A.get(`${name}#${i}`); if (!r) break;
        B.draw(r, -10 + i * 300 + k * 600, LAYER_Y[name]);
      }
      B.end();
    };
    layer('sky', this.viewFor('sky', PLX.sky, cam.x));
    layer('far', this.viewFor('far', PLX.far, 300));
    layer('mid', this.viewFor('mid', PLX.mid, 300));
    layer('fac', w); layer('ground', w);
    // props behind the characters
    B.begin(w);
    for (const p of this.C.deco) {
      const r = A.get(p.name);
      if (p.at) for (const x of p.at) B.draw(r, x, 0); else B.draw(r, 0, 0);
    }
    for (const p of this.C.props) B.draw(A.get(p.name), 0, 0);
    B.end();
    this.drawWorldExtras(B, w, x0, x1);
    // characters (each composited through the outline shader)
    for (const c of chars) this.cr.composite(c, w, restore);
    // cover in front
    B.begin(w);
    for (const p of this.C.front) B.draw(A.get(p.name), 0, 0);
    B.end();
    this.dust.draw(w, t);
    this.drawFrontExtras(B, w);
    this.addLights(R);
    R.lightPass(w);
    R.compose();
    // emissive
    const glow = A.get('fx.glow'), flame = A.get('fx.flame');
    B.begin(w); B.setBlend(1);
    for (const lx of this.C.lamps) B.draw(glow, lx + 15, -79, 9, 5, 0, rgba('#fff1d0', 0.6));
    for (let k = -1; k < kN; k++) B.draw(glow, 232 + k * 600, -74, 34, 14, 0, rgba('#ff6b52', 0.22 * neon));
    for (const en of this.enemies) if (en.alive) B.draw(glow, en.rx + en.facing * 3.5, en.ry - 56.4, 6, 3, 0, rgba('#ff3347', 0.7));
    for (let k = 0; k < 3; k++) {
      const ph = t * (9 + k * 3) + k * 2.1;
      B.draw(flame, 1107 + (k - 1) * 2.4, -14, 3.6 + Math.sin(ph) * 0.6, 6 + Math.sin(ph * 1.3) * 1.6 - k * 0.8, Math.sin(ph * 0.7) * 0.15, rgba(k === 1 ? '#ffd56a' : '#ff8a3a', 0.9));
    }
    B.end();
    this.drawGlow(B, w);
    R.finish(t);
  }
}
