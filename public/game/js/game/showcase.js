// KOR — the live backdrop behind the menus.
//
// The cells' basement (docs §10.9): the lamp swinging over the map table,
// the stove, the radio's light; a slow camera drift, and the selected
// operator standing at low ready with their loadout, breathing and glancing
// around. Switching operators drops the new one in with a landing; the menus
// only say where on screen the operator should stand (focus) and how close.
import { M2Scene } from '../test/m2scene.js';
import { Level, T } from '../phys/level.js';
import { Mover } from '../phys/mover.js';
import { Character } from './character.js';
import { ParticleSystem, col } from '../gfx/particles.js';
import { rgba } from '../gfx/batch.js';
import { LAMP, LAMP_BULB, STOVE, RADIO, ASHTRAY } from '../art/env/hideout.js';

const COLS = 160;
function basement() {
  const rows = [];
  for (let r = 0; r < 25; r++) rows.push('.'.repeat(COLS));
  for (let r = 25; r < 30; r++) rows.push('#'.repeat(COLS));
  return {
    level: new Level(rows, -200), width: COLS * T, interior: true,
    props: [], front: [], deco: [], lamps: [], facade: [],
    back: [0, 1, 2].map((i) => ({ name: `h.room${i}` })).concat([{ name: 'h.table' }]),
    floor: [0, 1, 2].map((i) => ({ name: `h.floor${i}` })),
    spawn: [520, 0], enemies: [],
    // the stove's fire, the radio's LED, the street's sodium through the window, the door
    lights: [[STOVE.x, -18, 70, 0.75, [1, 0.5, 0.22], 'fire'], [RADIO[0], RADIO[1], 14, 0.5, [0.3, 1, 0.45]], [340, -40, 70, 0.3, [1, 0.6, 0.3]], [100, -150, 40, 0.4, [1, 0.66, 0.36]]],
    glows: [[STOVE.x, -17.5, 9, 5, '#ff8a3a', 0.5, 'fire'], [RADIO[0], RADIO[1], 1.6, 1.6, '#5cff7a', 0.9], [320, -136, 24, 10, '#ff9a40', 0.12], [100, -152.3, 18, 1.4, '#ffc27a', 0.7]],
  };
}

const rand = (a, b) => a + Math.random() * (b - a);

export class Showcase extends M2Scene {
  constructor(eng) {
    super(eng, { aimMode: 'dir', aimDX: 1, aimDY: 0.3, moveX: 0, take: () => false }, basement());
    this.focus = 0.3; this.zoom = 112; this.lift = 8; this.t0 = 0;
    // dust turning in the lamp's light; the lamp swings, harder after a knock
    this.motes = new ParticleSystem(eng.gl, eng.atlas, eng.atlas.get('fx.dot'), 160, { additive: true });
    this.swing = 0.24;
    this.setOperator('vex', null);
  }

  // id + { primary, sidearm } (null: the operator's defaults)
  setOperator(id, loadout) {
    const x = this.C.spawn[0];
    this.mover = new Mover(this.L, x, this.dropFrom ?? -26); this.mover.facing = 1; this.dropFrom = null;
    this.player = new Character(id, this.e.atlas, this.mover, loadout ? { weapon: loadout.primary, sidearm: loadout.sidearm } : {});
    this.player.wind = 0.04; // a basement: no wind, the scarf's tails hang
    this.opId = id; this.landed = false; this.look = 0;
  }

  // after the opening: start wide and high so the camera settles in as the
  // operator (set next) drops from above the frame
  entrance() { this.e.camera.viewH = 168; this.cam.y -= 30; this.swing = 0.5; }

  // the lamp: its angle and the bulb's place (the pivot at the ceiling)
  lampAt() {
    const a = this.swing * Math.sin(this.t * Math.PI * 2 * 0.45);
    return [LAMP.x + Math.sin(a) * LAMP_BULB, LAMP.y + Math.cos(a) * LAMP_BULB, a];
  }

  // the swinging bulb throws the operator's shadow on the back wall, swaying with it
  shadowLamps() { const [x, y] = this.lampAt(); return [[x, y, 1.3]]; }

  // where the operator stands on screen (0 left … 1 right), how tall the view
  // is, and how far above the bottom edge the floor sits (to clear the menus)
  frame(focus, zoom = 112, lift = 8) { this.focus = focus; this.zoom = zoom; this.lift = lift; }

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
    this.swing += (0.24 - this.swing) * Math.min(1, dt * 0.25);
    // dust in the lamp's cone, the cigarette's smoke off the ashtray
    const [lx, ly] = this.lampAt();
    if (Math.random() < dt * 7) this.motes.emit(this.t, lx + rand(-34, 34), ly + rand(6, 80), rand(-1.6, 1.6), rand(-2.4, 0.8), rand(4, 7), rand(0.25, 0.4), 0.15, col('#ffe2b0', 0.4), col('#ffe2b0', 0), 0, 0.2, 0, 0);
    if (Math.random() < dt * 3) this.dust.emit(this.t, ASHTRAY[0] + 3, ASHTRAY[1] - 1, rand(-0.6, 0.6), rand(-5, -3), rand(3, 4.5), 0.6, 4, col('#b8b4ac', 0.22), col('#b8b4ac', 0), -1, 0.4, rand(0, 6), 0.3);
    // camera: the operator at `focus` across the screen, a slow drift
    cam.viewH += (this.zoom - cam.viewH) * Math.min(1, dt * 4);
    const c = this.cam;
    c.px = c.x; c.py = c.y;
    const tx = m.x + (0.5 - this.focus) * cam.viewW + Math.sin(this.t * 0.17) * 6;
    const ty = -cam.viewH / 2 + this.lift + Math.sin(this.t * 0.23) * 1.5;
    c.x += (tx - c.x) * Math.min(1, dt * 3); c.y += (ty - c.y) * Math.min(1, dt * 3);
    cam.update(dt);
  }

  // the lamp itself, swung from its pivot, behind the operator
  drawWorldExtras(B, w) {
    const [, , a] = this.lampAt();
    B.begin(w); B.draw(this.e.atlas.get('h.lamp'), LAMP.x, LAMP.y, 1, 1, -a); B.end();
  }

  drawGlow(B, w) {
    const [lx, ly] = this.lampAt(), glow = this.e.atlas.get('fx.glow');
    B.begin(w); B.setBlend(1);
    B.draw(glow, lx, ly, 7, 4, 0, rgba('#ffe2b0', 0.7));
    B.draw(glow, lx, ly + 2, 26, 12, 0, rgba('#ffb060', 0.12));
    B.setBlend(0); B.end();
    this.motes.draw(w, this.t);
  }

  addLights(R) {
    const m = this.mover, [lx, ly, a] = this.lampAt();
    // the one lamp, its pool moving with the swing; a little of it bounced
    // off the table; a cold rim from the window so the operator's edge reads
    R.addLight(lx, ly, 150, 1.5, [1, 0.8, 0.52], Math.PI / 2 - a, Math.cos(0.75), 0.25);
    R.addLight(lx, ly + 2, 30, 0.9, [1, 0.84, 0.6]);
    R.addLight(m.x - 40, -40, 70, 0.35, [0.7, 0.75, 0.9]);
  }
}
