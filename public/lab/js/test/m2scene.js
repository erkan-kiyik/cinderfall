// KOR LAB — M2: movement course.
//
// The first playable: an operator with the full movement set (run, sprint,
// crouch, slide, jump, mantle, ladders, one-way decks, slopes) on a course
// built from tiles, rendered with the runtime rig and live outline. Syndicate
// troopers at the far end track the player with their aim.
import { STREET } from '../art/env/street.js';
import { BUILDINGS, buildingBakeList, facadeLayout } from '../art/env/city.js';
import { buildCourse } from '../art/env/course.js';
import { FX, DENS } from './m1scene.js';
import { charBakeList } from '../game/bakechars.js';
import { Character } from '../game/character.js';
import { Mover } from '../phys/mover.js';
import { CharRenderer } from '../gfx/charrender.js';
import { ParticleSystem, col } from '../gfx/particles.js';
import { rgba } from '../gfx/batch.js';
import { StreetLife } from '../game/streetlife.js';

export const BAKE_VERSION = 'm2-6';
export const OPERATORS = ['vex', 'hale', 'morrow', 'kite', 'brick'];
export const COURSE = buildCourse();

export function bakeList(quality, course = COURSE) {
  const [bg, ch, fx] = DENS[quality];
  const E = [];
  const layer = (name, box, paint, scale) => E.push({ name, box, scale, paint, chunk: 300 });
  layer('sky', [-10, -176, 610, -20], STREET.sky, Math.min(2, bg));
  layer('far', [-10, -182, 610, -58], STREET.farCity, bg * 0.6);
  layer('mid', [-10, -168, 610, -38], STREET.midIndustry, bg * 0.75);
  E.push(...buildingBakeList(bg));
  layer('ground', [-10, -0.5, 610, 42], STREET.ground, bg);
  for (const p of [...course.props, ...course.front, ...course.deco]) E.push({ name: p.name, box: p.box, scale: ch, paint: p.paint, outline: 0.85 });
  E.push(...charBakeList([...OPERATORS, 'tet', 'kal'], ch));
  for (const [n, p] of Object.entries(FX)) {
    const box = n === 'tracer' || n === 'beam' ? [0, -0.5, 1, 0.5] : n === 'flame' ? [-0.6, -1.05, 0.6, 0.05] : [-1, -1, 1, 1];
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
    // the buildings along the street (scenes that do not lay them out get a default street)
    if (!this.C.facade) this.C.facade = facadeLayout(-10, this.C.width + 10, 3);
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
    this.life = new StreetLife(this);
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

  // light flicker by kind: HAWK's neon stutters now and then, the hotel sign
  // on its own beat, fires breathe; each building on its own phase
  flicker(kind, seed = 0) {
    const t = this.t + seed * 0.013;
    if (kind === 'neon') return (t % 6.1) > 5.8 && ((t * 30) | 0) % 2 ? 0.25 : 1;
    if (kind === 'neon2') return (t % 8.3) > 8.0 && ((t * 24) | 0) % 2 ? 0.3 : 1;
    if (kind === 'fire') return 0.8 + Math.sin(t * 11) * 0.1 + Math.sin(t * 4.7) * 0.1;
    if (kind === 'buzz') { const v = Math.sin(t * 37 + seed) * Math.sin(t * 13.7 + seed * 1.3); return v > 0.9 ? 0.35 : 0.92 + 0.08 * Math.sin(t * 61 + seed); }
    return 1;
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
    // the buildings in view: their windows, neon and fires
    const vis = this.C.facade.filter((f) => f.x + BUILDINGS[f.type].w > x0 && f.x < x1);
    for (const f of vis) for (const [lx, ly, rad, k, c, fl] of BUILDINGS[f.type].lights || []) R.addLight(f.x + lx, ly, rad, k * this.flicker(fl, f.x), c);
    for (const [lx, ly, rad, k, c, fl] of this.C.lights || []) if (lx > x0 && lx < x1) R.addLight(lx, ly, rad, k * this.flicker(fl, lx), c);
    const fire = 0.86 + Math.sin(t * 23) * 0.06 + Math.sin(t * 7.3) * 0.06;
    // a fire is an x on the street, or [x, y] (a brazier up on something)
    for (const f of this.C.fires || []) { const [fx, fy] = f.length ? f : [f, 0]; if (fx > x0 && fx < x1) R.addLight(fx, fy - 20, 80, 1.2 * fire, [1, 0.55, 0.24]); }
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
    this.life.step(t, cam);
    layer('sky', this.viewFor('sky', PLX.sky, cam.x));
    const vFar = this.viewFor('far', PLX.far, 300);
    layer('far', vFar); this.life.drawFar(B, vFar, A, t, kMax);
    const vMid = this.viewFor('mid', PLX.mid, 300);
    layer('mid', vMid); this.life.drawMid(B, vMid, A, t, kMax);
    layer('ground', w);
    B.begin(w);
    for (const f of vis) B.draw(A.get(`b.${f.type}`), f.x, 0);
    // contact shadows: every prop that stands on the street, every character on its feet
    const glow0 = A.get('fx.glow'), shade = rgba('#05060a', 0.55);
    const foot = (x, y, hw) => B.draw(glow0, x, y + 0.4, hw, 2.4, 0, shade);
    for (const p of [...this.C.deco, ...this.C.props, ...this.C.front]) {
      // pieces drawn at several spots: their shadow is [dx, half width] from the spot
      if (p.at) { const [fdx, fw] = p.foot || [0, 5]; for (const x of p.at) if (x > x0 && x < x1) foot(x + fdx, 0, fw); continue; }
      if (!p.box) continue;
      const [bx0, by0, bx1, by1] = p.box;
      if (by1 < -2 || by1 > 2 || by0 > -6) continue;
      if (bx1 < x0 || bx0 > x1) continue;
      foot((bx0 + bx1) / 2, 0, (bx1 - bx0) * 0.55);
    }
    for (const c of chars) if (!c.rag && c.m.grounded) foot(c.rx, c.ry, 10);
    // props behind the characters
    for (const p of this.C.deco) {
      const r = A.get(p.name);
      if (p.at) for (const x of p.at) B.draw(r, x, 0); else B.draw(r, 0, 0);
    }
    for (const p of this.C.props) { const r = A.get(p.name); if (p.at) for (const x of p.at) B.draw(r, x, 0); else B.draw(r, 0, 0); }
    B.end();
    this.drawWorldExtras(B, w, x0, x1);
    // characters (each composited through the outline shader)
    for (const c of chars) this.cr.composite(c, w, restore);
    // cover in front
    B.begin(w);
    for (const p of this.C.front) { const r = A.get(p.name); if (p.at) for (const x of p.at) B.draw(r, x, 0); else B.draw(r, 0, 0); }
    B.end();
    this.dust.draw(w, t);
    this.drawFrontExtras(B, w);
    this.life.drawRain(B, w, A);
    this.addLights(R);
    R.lightPass(w);
    R.compose();
    // emissive
    const glow = A.get('fx.glow'), flame = A.get('fx.flame');
    B.begin(w); B.setBlend(1);
    for (const lx of this.C.lamps) B.draw(glow, lx + 15, -79, 9, 5, 0, rgba('#fff1d0', 0.6));
    // neon: the buildings', the barricades', each smeared down the wet road
    for (const f of vis) for (const [gx, gy, sx, sy, c, a, fl] of BUILDINGS[f.type].glows || []) {
      const k = this.flicker(fl, f.x);
      B.draw(glow, f.x + gx, gy, sx, sy, 0, rgba(c, a * k));
      this.life.reflect(B, glow, t, f.x + gx, sx, c, a * k);
    }
    for (const [gx, gy, sx, sy, c, a, fl] of this.C.glows || []) {
      if (gx < x0 || gx > x1) continue;
      const k = this.flicker(fl, gx);
      B.draw(glow, gx, gy, sx, sy, 0, rgba(c, a * k));
      this.life.reflect(B, glow, t, gx, sx, c, a * k);
    }
    for (const lx of this.C.lamps) if (lx > x0 && lx < x1) this.life.reflect(B, glow, t, lx + 15, 8, '#ffd9a0', 0.5);
    for (const f of this.C.fires || []) { const fx = f.length ? f[0] : f; if (fx > x0 && fx < x1) this.life.reflect(B, glow, t, fx, 6, '#ff8a3a', 0.6); }
    for (const en of this.enemies) if (en.alive) B.draw(glow, en.rx + en.facing * 3.5, en.ry - 56.4, 6, 3, 0, rgba('#ff3347', 0.7));
    for (const f of this.C.fires || []) for (let k = 0; k < 3; k++) {
      const [fx, fy] = f.length ? f : [f, 0], ph = t * (9 + k * 3) + k * 2.1;
      B.draw(flame, fx + (k - 1) * 2.4, fy - 14, 3.6 + Math.sin(ph) * 0.6, 6 + Math.sin(ph * 1.3) * 1.6 - k * 0.8, Math.sin(ph * 0.7) * 0.15, rgba(k === 1 ? '#ffd56a' : '#ff8a3a', 0.9));
    }
    B.end();
    this.drawGlow(B, w);
    R.finish(t);
  }
}
