// CINDERFALL LAB — the live backdrop behind the menus.
//
// The street from the game, a slow camera drift, and the selected operator
// standing at low ready with their loadout, breathing and glancing around.
// Switching operators drops the new one in with a landing; the menus only
// say where on screen the operator should stand (focus) and how close.
import { M2Scene } from '../test/m2scene.js';
import { Level, T } from '../phys/level.js';
import { Mover } from '../phys/mover.js';
import { Character } from './character.js';
import { ParticleSystem, col } from '../gfx/particles.js';
import { facadeLayout } from '../art/env/city.js';

const COLS = 160;
function street() {
  const rows = [];
  for (let r = 0; r < 25; r++) rows.push('.'.repeat(COLS));
  for (let r = 25; r < 30; r++) rows.push('#'.repeat(COLS));
  const lamps = [300, 760];
  return {
    level: new Level(rows, -200), width: COLS * T,
    props: [], front: [], lamps,
    deco: [{ name: 'c.lamp', at: lamps }],
    spawn: [520, 0], enemies: [],
    // the Syndicate banner right behind the operator in the lobby
    facade: facadeLayout(-10, COLS * T + 10, 2, ['walkupB', 'crow', 'walkup', 'alley', 'synBlock', 'hotel', 'garage', 'ruin', 'warehouse']),
  };
}

const rand = (a, b) => a + Math.random() * (b - a);

export class Showcase extends M2Scene {
  constructor(eng) {
    super(eng, { aimMode: 'dir', aimDX: 1, aimDY: 0.3, moveX: 0, take: () => false }, street());
    this.focus = 0.3; this.zoom = 112; this.t0 = 0;
    this.embers = new ParticleSystem(eng.gl, eng.atlas, eng.atlas.get('fx.dot'), 160, { additive: true });
    this.setOperator('vex', null);
  }

  // id + { primary, sidearm } (null: the operator's defaults)
  setOperator(id, loadout) {
    const x = this.C.spawn[0];
    this.mover = new Mover(this.L, x, this.dropFrom ?? -26); this.mover.facing = 1; this.dropFrom = null;
    this.player = new Character(id, this.e.atlas, this.mover, loadout ? { weapon: loadout.primary, sidearm: loadout.sidearm } : {});
    this.opId = id; this.landed = false; this.look = 0;
  }

  // after the opening: start wide and high so the camera settles in as the
  // operator (set next) drops from above the frame
  entrance() { this.e.camera.viewH = 168; this.cam.y -= 30; this.dropFrom = -120; }

  // where the operator stands on screen (0 left … 1 right) and how tall the view is
  frame(focus, zoom = 112) { this.focus = focus; this.zoom = zoom; }

  update(dt) {
    this.t += dt;
    const m = this.mover, P = this.player, cam = this.e.camera;
    // low ready, now and then a glance toward the street
    this.look -= dt;
    if (this.look <= 0) { this.look = rand(3, 6); this.lookY = rand(-0.1, 0.35); }
    const ay = m.y - 46 + (this.lookY ?? 0.3) * 120;
    P.setAim(m.x + 130, ay);
    P.preStep();
    m.step(dt, { moveX: 0, face: 1 });
    P.postStep(dt, this.L);
    if (m.ev.land && !this.landed) { const hard = m.ev.land > 320; this.landed = true; this.puff(m.x, m.y, hard ? 14 : 8, hard ? 1.3 : 0.9); this.e.camera.addShake(hard ? 0.18 : 0.08); }
    // embers drifting up through the light
    if (Math.random() < dt * 9) {
      const x = cam.x + rand(-cam.viewW / 2, cam.viewW / 2);
      this.embers.emit(this.t, x, 8, rand(-6, 6), rand(-26, -12), rand(2.5, 4.5), rand(0.35, 0.6), 0.1, col('#ffb070', 0.9), col('#ff6b2c', 0), -4, 0.3, 0, 0);
    }
    // camera: the operator at `focus` across the screen, a slow drift
    cam.viewH += (this.zoom - cam.viewH) * Math.min(1, dt * 4);
    const c = this.cam;
    c.px = c.x; c.py = c.y;
    const tx = m.x + (0.5 - this.focus) * cam.viewW + Math.sin(this.t * 0.17) * 6;
    const ty = -cam.viewH / 2 + 8 + Math.sin(this.t * 0.23) * 1.5;
    c.x += (tx - c.x) * Math.min(1, dt * 3); c.y += (ty - c.y) * Math.min(1, dt * 3);
    cam.update(dt);
  }

  drawGlow(B, w) { this.embers.draw(w, this.t); }

  addLights(R) {
    const m = this.mover;
    // key light from the street side and a warm rim behind the operator
    R.addLight(m.x + 70, -70, 150, 0.9, [1, 0.86, 0.72]);
    R.addLight(m.x - 30, -40, 70, 1.1, [1, 0.42, 0.18]);
  }
}
