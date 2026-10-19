// KOR LAB — M2: movement course.
//
// The first playable: an operator with the full movement set (run, sprint,
// crouch, slide, jump, mantle, ladders, one-way decks, slopes) on a course
// built from tiles, rendered with the runtime rig and live outline. Syndicate
// troopers at the far end track the player with their aim.
import { STREET } from '../art/env/street.js';
import { weathered, defocus } from '../art/kit.js';
import { BUILDINGS, buildingBakeList, facadeLayout } from '../art/env/city.js';
import { buildCourse } from '../art/env/course.js';
import { FX, DENS } from './m1scene.js';
import { charBakeList } from '../game/bakechars.js';
import { WEAPONS } from '../art/weapons/index.js';
import { Character } from '../game/character.js';
import { Mover } from '../phys/mover.js';
import { CharRenderer } from '../gfx/charrender.js';
import { ParticleSystem, col } from '../gfx/particles.js';
import { rgba } from '../gfx/batch.js';
import { StreetLife } from '../game/streetlife.js';

export const BAKE_VERSION = 'm2-53';
export const OPERATORS = ['vex', 'hale', 'morrow', 'kite', 'brick'];
export const COURSE = buildCourse();

export function bakeList(quality, course = COURSE) {
  const [bg, ch, fx] = DENS[quality];
  const E = [];
  const layer = (name, box, paint, scale) => E.push({ name, box, scale, paint, chunk: 300 });
  layer('sky', [-10, -176, 610, -20], STREET.sky, Math.min(2, bg));
  layer('far', [-10, -182, 610, -58], defocus(STREET.farCity, 0.45), bg * 0.6);
  layer('mid', [-10, -168, 610, -38], defocus(STREET.midIndustry, 0.22), bg * 0.75);
  E.push(...buildingBakeList(bg));
  layer('ground', [-10, -0.5, 610, 42], STREET.ground, bg);
  // props weathered the same way as the buildings (docs §11)
  for (const p of [...course.props, ...course.front, ...course.deco]) E.push({ name: p.name, box: p.box, scale: ch, paint: weathered(p), outline: 0.85 });
  // the floor: paving laid over the street in some places, flat (no outline)
  for (const p of course.floor || []) E.push({ name: p.name, box: p.box, scale: bg, paint: p.paint });
  // every weapon the player can carry, in the factory finish
  E.push(...charBakeList([...OPERATORS, 'tet', 'kal'], ch, Object.keys(WEAPONS)));
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

  // light flicker by kind (docs §10.4): bulbs on a generator wobble and now
  // and then dip, the hotel's last neon catches and drops out, a television
  // jumps from scene to scene, fires breathe;
  // Vanta's LEDs (no kind) hold steady. Each building on its own phase.
  flicker(kind, seed = 0) {
    const t = this.t + seed * 0.013;
    if (kind === 'bulb') return (t % 9.7) > 9.45 ? 0.62 : 0.93 + Math.sin(t * 2.3 + seed) * 0.04 + Math.sin(t * 7.1 + seed * 0.7) * 0.03;
    if (kind === 'tv') { const v = Math.abs(Math.sin(t * 3.1 + seed) * Math.sin(t * 7.7 + seed * 0.7)); return 0.45 + 0.4 * v + ((((t * 6) | 0) * 7919) % 5 === 0 ? 0.25 : 0); }
    if (kind === 'dying') { const p = t % 5.3; return p > 4.2 ? (((t * 17) | 0) % 3 ? 0.08 : 0.9) : 0.78 + Math.sin(t * 50) * 0.04; }
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
  // the lamps that throw figures' shadows on the wall and warm their rims:
  // [x, y of the bulb, magnification of the shadow about it]
  shadowLamps(out) {
    if (!out) return [];
    if (!this._bulbs) this._bulbs = this.C.lamps.map((lx) => [lx + 15, -78, 1.5]);
    return this._bulbs;
  }
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
    for (const lx of this.C.lamps) if (lx > x0 && lx < x1) { R.addLight(lx + 15, -78, 100, 1.2, [1, 0.7, 0.4], Math.PI / 2, Math.cos(0.44), 0.18); R.addLight(lx + 15, -80, 22, 0.8, [1, 0.8, 0.55]); }
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
    // indoors (the lobby's basement) there is no sky, no street and no rain
    const out = !this.C.interior;
    if (out) {
      this.life.step(t, cam);
      // boots coming down on the wet street splash
      for (const c of [...this.enemies, this.player]) if (c && c.anim.plant) { this.life.kick(c.rx + c.facing * (c.anim.plant === 1 ? -1.5 : 2.5), c.ry); c.anim.plant = 0; }
      layer('sky', this.viewFor('sky', PLX.sky, cam.x));
      const vFar = this.viewFor('far', PLX.far, 300);
      layer('far', vFar); this.life.drawFar(B, vFar, A, t, kMax);
      // air between the layers (docs §10.12): the far city sinks into a low
      // haze lit from below by its own sodium lamps, the middle distance into
      // a thinner cool mist, so depth reads as it does in the traced stills
      const haze = A.get('fx.glow'), vw = cam.viewW;
      B.begin(vFar);
      B.draw(haze, 300 + (cam.x - 300) * PLX.far, -100, vw * 0.9, 70, 0, rgba('#8a7a86', 0.26));
      B.draw(haze, 300 + (cam.x - 300) * PLX.far, -78, vw * 0.8, 30, 0, rgba('#b08868', 0.2));
      B.end();
      const vMid = this.viewFor('mid', PLX.mid, 300);
      layer('mid', vMid); this.life.drawMid(B, vMid, A, t, kMax);
      B.begin(vMid);
      B.draw(haze, 300 + (cam.x - 300) * PLX.mid, -70, vw * 0.85, 50, 0, rgba('#6a7586', 0.16));
      B.end();
      layer('ground', w);
    }
    B.begin(w);
    for (const p of this.C.back || []) B.draw(A.get(p.name), 0, 0);
    for (const p of this.C.floor || []) { const r = A.get(p.name); if (p.at) { for (const x of p.at) if (x + p.box[2] > x0 && x + p.box[0] < x1) B.draw(r, x, 0); } else B.draw(r, 0, 0); }
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
    // the fallen: a long shade under the whole body where it lies
    const ext = this._ext || (this._ext = [0, 0, 0]);
    for (const c of chars) if (c.rag) { const [a, b, yb] = c.rag.extent(ext); foot((a + b) / 2, yb + 1.5, (b - a) / 2 + 4); }
    // props behind the characters
    for (const p of this.C.deco) {
      const r = A.get(p.name);
      if (p.at) for (const x of p.at) B.draw(r, x, 0); else B.draw(r, 0, 0);
    }
    for (const p of this.C.props) { const r = A.get(p.name); if (p.at) for (const x of p.at) B.draw(r, x, 0); else B.draw(r, 0, 0); }
    B.end();
    this.drawWorldExtras(B, w, x0, x1);
    // the nearest lamp to each figure: it throws their shadow on the wall behind
    // (magnified about the lamp, fainter the further off it is) and warms the
    // rim of light along the side that faces it
    // (off with the dynamic lights setting: they are light the lamps throw)
    const lit = this.e.fxLevel !== 0 && R.lightsOn, bulbs = this.shadowLamps(out);
    const near = chars.map((c) => {
      let b = null;
      if (!lit) return null;
      for (const q of bulbs) if (!b || Math.abs(c.rx - q[0]) < Math.abs(c.rx - b[0])) b = q;
      return b && Math.abs(c.rx - b[0]) < 120 ? b : null;
    });
    if (lit) chars.forEach((c, i) => {
      const b = near[i];
      if (b && !c.rag && c.alive) this.cr.shadow(c, w, restore, b[0], b[1], b[2], 0.8 * Math.pow(1 - Math.abs(c.rx - b[0]) / 120, 0.8));
    });
    // characters (each composited through the outline shader)
    const L0 = this.cr.light, R0 = this.cr.rim;
    this.cr.wet = out && lit ? 0.6 : 0;
    chars.forEach((c, i) => {
      const b = near[i];
      if (b) {
        const dx = b[0] - c.rx, dy = b[1] + 42 - c.ry, k = 1 - Math.abs(dx) / 120, n = Math.hypot(dx, dy) || 1;
        this.cr.light = [dx / n, dy / n];
        this.cr.rim = [R0[0] + 0.36 * k, R0[1] + 0.22 * k, R0[2] + 0.06 * k];
      } else { this.cr.light = L0; this.cr.rim = R0; }
      this.cr.composite(c, w, restore);
    });
    this.cr.light = L0; this.cr.rim = R0; this.cr.wet = 0;
    // cover in front
    B.begin(w);
    for (const p of this.C.front) { const r = A.get(p.name); if (p.at) for (const x of p.at) B.draw(r, x, 0); else B.draw(r, 0, 0); }
    B.end();
    this.dust.draw(w, t);
    this.drawFrontExtras(B, w);
    if (out) this.life.drawRain(B, w, A);
    this.addLights(R);
    R.lightPass(w);
    R.compose();
    // emissive
    const glow = A.get('fx.glow'), flame = A.get('fx.flame');
    B.begin(w); B.setBlend(1);
    for (const lx of this.C.lamps) B.draw(glow, lx + 15, -79, 9, 5, 0, rgba('#ffd9a0', 0.6));
    // the damp air the lamps light (docs §11): a soft cone under each, a pool where it lands,
    // and a low mist lying over the street
    for (const lx of this.C.lamps) if (lx > x0 - 40 && lx < x1 + 40) { B.draw(glow, lx + 15, -46, 20, 38, 0, rgba('#ffc88a', 0.075)); B.draw(glow, lx + 15, -6, 30, 9, 0, rgba('#ffc88a', 0.07)); }
    if (out) B.draw(glow, (x0 + x1) / 2, -3, (x1 - x0) * 0.75, 16, 0, rgba('#7f8da3', 0.06));
    // rain shows where a lamp lights it: the drops inside each cone catch the sodium
    if (out && this.e.fxLevel !== 0) {
      const tr = A.get('fx.tracer'), d = this.life.drops, n = this.life.count;
      for (const lx of this.C.lamps) {
        const cx = lx + 15;
        if (cx < x0 - 60 || cx > x1 + 60) continue;
        for (let i = 0; i < n; i++) {
          const o = i * 3, x = d[o], y = d[o + 1];
          if (y < -76 || y > 0) continue;
          const r = 6 + (y + 78) * 0.42, dx = Math.abs(x - cx);
          if (dx > r) continue;
          const sz = d[o + 2] * 0.03, k = (1 - dx / r) * (1 - (y + 76) / 110);
          B.line(tr, x - sz * 0.16, y - sz, x, y, 0.36, rgba('#ffd9a8', 0.8 * k));
        }
      }
    }
    // neon: the buildings', the barricades', each smeared down the wet road
    for (const f of vis) for (const [gx, gy, sx, sy, c, a, fl] of BUILDINGS[f.type].glows || []) {
      const k = this.flicker(fl, f.x);
      B.draw(glow, f.x + gx, gy, sx, sy, 0, rgba(c, a * k));
      if (out) this.life.reflect(B, glow, t, f.x + gx, sx, c, a * k);
    }
    for (const [gx, gy, sx, sy, c, a, fl] of this.C.glows || []) {
      if (gx < x0 || gx > x1) continue;
      const k = this.flicker(fl, gx);
      B.draw(glow, gx, gy, sx, sy, 0, rgba(c, a * k));
      if (out) this.life.reflect(B, glow, t, gx, sx, c, a * k);
    }
    for (const lx of this.C.lamps) if (lx > x0 && lx < x1) this.life.reflect(B, glow, t, lx + 15, 8, '#ffb868', 0.5);
    for (const f of this.C.fires || []) { const fx = f.length ? f[0] : f; if (fx > x0 && fx < x1) this.life.reflect(B, glow, t, fx, 6, '#ff8a3a', 0.6); }
    for (const en of this.enemies) if (en.alive) B.draw(glow, en.rx + en.facing * 3.5, en.ry - 56.4, 6, 3, 0, rgba('#ff3347', 0.7));
    for (const f of this.C.fires || []) for (let k = 0; k < 3; k++) {
      const [fx, fy] = f.length ? f : [f, 0], ph = t * (9 + k * 3) + k * 2.1;
      B.draw(flame, fx + (k - 1) * 2.4, fy - 14, 3.6 + Math.sin(ph) * 0.6, 6 + Math.sin(ph * 1.3) * 1.6 - k * 0.8, Math.sin(ph * 0.7) * 0.15, rgba(k === 1 ? '#ffd56a' : '#ff8a3a', 0.9));
    }
    B.end();
    this.drawGlow(B, w);
    // outdoors, the road is wet: it mirrors the street (renderer FINAL_FS)
    if (out && this.e.fxLevel !== 0) R.wet = this.e.fxLevel === 1 ? 0.3 : 0.45;
    R.finish(t);
  }
}
