// CINDERFALL LAB — character movement.
//
// One state machine for every character body (the player now, AI later):
//   ground  walk / run / sprint / crouch, slopes, step off ledges (coyote time)
//   air     variable-height jump, jump buffer, fall gravity, air control
//   slide   from a sprint: low, fast, decaying; can jump out of it
//   mantle  pull up onto a ledge you run or jump into
//   ladder  climb, hop off sideways, step on/off at both ends
// Units: world units (a person is 64), seconds. Feet position (x, y), y down.
import { T, ONEWAY } from './level.js';

export const MOVE = {
  run: 165, sprint: 240, crouch: 58, backpedal: 0.72,
  accel: 1300, decel: 1700, turnAccel: 2400, airAccel: 820,
  gravity: 1500, fallMul: 1.35, maxFall: 900,
  jumpV: 380, jumpCut: 200, coyote: 0.1, buffer: 0.12,
  ladder: 96, ladderSnap: 600,
  slideMin: 190, slideBoost: 1.1, slideFric: 330, slideEnd: 80, slideMax: 0.9,
  mantleMin: 3, mantleMax: 74, snap: 8, stepUp: 8,
};
export const W = 16;
export const HEIGHT = { stand: 58, crouch: 40, slide: 26 };

export class Mover {
  constructor(level, x, y) {
    this.L = level;
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.h = HEIGHT.stand;
    this.state = 'air'; this.grounded = false;
    this.facing = 1;
    this.coyoteT = 0; this.bufferT = 0; this.dropT = 0; this.cut = false;
    this.crouching = false; this.slideT = 0;
    this.mantle = { t: 0, dur: 0, x0: 0, y0: 0, x1: 0, y1: 0 };
    this.blocked = 0;
    // one-frame events for animation and audio
    this.ev = { jump: false, land: 0, slide: false, mantle: false, ladder: false };
    this.prevCrouchIn = false;
  }

  clear(x0, y0, x1, y1) { return !this.L.solidBox(x0, y0, x1, y1); }
  canStand(h = HEIGHT.stand) { return this.clear(this.x - W / 2 + 0.5, this.y - h, this.x + W / 2 - 0.5, this.y - 0.5); }

  // in: { moveX -1..1, up, down, jump (held), jumpPressed, sprint, crouch, face (+1/−1) }
  step(dt, inp) {
    const M = MOVE, ev = this.ev;
    ev.jump = false; ev.land = 0; ev.slide = false; ev.mantle = false; ev.ladder = false;
    if (inp.face) this.facing = inp.face;
    this.bufferT = inp.jumpPressed ? M.buffer : Math.max(0, this.bufferT - dt);
    this.dropT = Math.max(0, this.dropT - dt);
    const crouchPressed = inp.crouch && !this.prevCrouchIn;
    this.prevCrouchIn = inp.crouch;

    if (this.state === 'mantle') return this.stepMantle(dt);
    if (this.state === 'ladder') return this.stepLadder(dt, inp);

    // ladders: grab when pressing up/down over one
    if ((inp.up || inp.down) && this.state !== 'slide' && Math.abs(inp.moveX) < 0.6) {
      const onIt = this.L.ladderAt(this.x, this.y - this.h + 4, this.y - 2);
      const below = inp.down && this.grounded && this.L.ladderAt(this.x, this.y + 1, this.y + 4);
      if ((inp.up && onIt) || below || (inp.down && onIt && !this.grounded)) {
        this.state = 'ladder'; this.vx = 0; this.vy = 0; this.grounded = false; this.crouching = false; this.h = HEIGHT.stand;
        if (below) this.y += 3;
        ev.ladder = true;
        return this.stepLadder(dt, inp);
      }
    }

    // --- horizontal intent
    const sliding = this.state === 'slide';
    if (!sliding && this.grounded && crouchPressed && Math.abs(this.vx) >= M.slideMin) {
      this.state = 'slide'; this.slideT = 0; this.vx *= M.slideBoost; ev.slide = true;
    }
    const wantCrouch = inp.crouch || (!this.canStand() && this.grounded);
    this.crouching = this.state === 'slide' ? true : (this.grounded && wantCrouch);
    if (this.state === 'slide') {
      this.slideT += dt;
      const s = Math.sign(this.vx);
      this.vx -= s * M.slideFric * dt;
      if (Math.sign(this.vx) !== s) this.vx = 0;
      if (!this.grounded || Math.abs(this.vx) < M.slideEnd || this.slideT > M.slideMax) {
        this.state = this.grounded ? 'ground' : 'air';
        this.crouching = this.grounded && (inp.crouch || !this.canStand());
      }
    } else {
      const mx = Math.abs(inp.moveX) < 0.12 ? 0 : inp.moveX;
      const backward = mx !== 0 && Math.sign(mx) !== this.facing;
      let max = this.crouching ? M.crouch : inp.sprint && !backward ? M.sprint : M.run;
      if (backward) max *= M.backpedal;
      const target = mx * max;
      let a;
      if (!this.grounded) a = M.airAccel;
      else if (target !== 0 && Math.sign(target) !== Math.sign(this.vx) && this.vx !== 0) a = M.turnAccel;
      else a = Math.abs(target) > Math.abs(this.vx) ? M.accel : M.decel;
      const dv = target - this.vx, step = a * dt;
      this.vx += Math.abs(dv) <= step ? dv : Math.sign(dv) * step;
    }

    // --- height (crouch / slide), never standing up into a ceiling
    const wantH = this.state === 'slide' ? HEIGHT.slide : this.crouching ? HEIGHT.crouch : HEIGHT.stand;
    if (wantH < this.h || this.canStand(wantH)) this.h = wantH;

    // --- jump
    if (this.bufferT > 0 && (this.grounded || this.coyoteT > 0)) {
      if (inp.down && this.onOneWay()) { this.dropT = 0.28; this.y += 1; this.grounded = false; this.bufferT = 0; this.state = 'air'; }
      else if (this.canStand(Math.max(this.h, HEIGHT.crouch))) {
        this.vy = -M.jumpV; this.grounded = false; this.coyoteT = 0; this.bufferT = 0; this.cut = false;
        if (this.state === 'slide') this.vx *= 0.92;
        this.state = 'air'; ev.jump = true;
        if (this.h < HEIGHT.crouch) this.h = HEIGHT.crouch;
      }
    }
    if (this.vy < 0 && !inp.jump && !this.cut) { this.vy = Math.max(this.vy, -M.jumpCut); this.cut = true; }

    // --- gravity
    if (!this.grounded) {
      this.vy += M.gravity * (this.vy > 0 ? M.fallMul : 1) * dt;
      if (this.vy > M.maxFall) this.vy = M.maxFall;
      this.coyoteT = Math.max(0, this.coyoteT - dt);
    }

    // --- move X
    this.blocked = 0;
    const nx = this.x + this.vx * dt;
    // on the ground the box starts a step above the feet: slopes and one-tile
    // steps are walked up by the vertical pass instead of blocking here
    const lift = this.grounded ? MOVE.stepUp + 0.5 : 0.5;
    if (this.clear(nx - W / 2, this.y - this.h, nx + W / 2, this.y - lift)) this.x = nx;
    else {
      const dir = Math.sign(this.vx) || this.facing;
      // flush against the wall
      const edgeTx = this.L.tx(nx + dir * W / 2);
      this.x = dir > 0 ? this.L.left(edgeTx) - W / 2 - 0.01 : this.L.left(edgeTx + 1) + W / 2 + 0.01;
      this.blocked = dir; this.vx = 0;
    }
    // --- mantle onto a ledge we push into
    const push = this.blocked !== 0 && Math.sign(inp.moveX) === this.blocked && Math.abs(inp.moveX) > 0.3;
    if (push && this.state !== 'slide' && !inp.down && this.tryMantle(this.blocked)) return;

    // --- move Y
    const oldY = this.y;
    if (this.vy >= 0) {
      const ny = this.y + this.vy * dt;
      const reach = this.grounded ? M.snap : 0;
      const s = this.L.surface(this.x - W / 2 + 1, this.x + W / 2 - 1, this.x, this.y - M.stepUp, ny + reach, this.dropT > 0, oldY);
      if (s !== null) {
        if (!this.grounded && this.vy > 60) ev.land = this.vy;
        this.y = s; this.vy = 0;
        if (!this.grounded && this.state === 'air') this.state = 'ground';
        this.grounded = true; this.coyoteT = M.coyote;
      } else {
        if (this.grounded) { this.grounded = false; if (this.state === 'ground' || this.state === 'slide') this.state = 'air'; }
        this.y = ny;
      }
    } else {
      const ny = this.y + this.vy * dt;
      if (!this.clear(this.x - W / 2 + 0.5, ny - this.h, this.x + W / 2 - 0.5, this.y - this.h + 0.01)) {
        const hitRow = this.L.ty(ny - this.h);
        this.y = this.L.top(hitRow + 1) + this.h + 0.01; this.vy = 0; this.cut = true;
      } else this.y = ny;
      this.grounded = false;
    }
    if (this.grounded && this.state === 'air') this.state = 'ground';
  }

  onOneWay() {
    const a = this.L.tx(this.x - W / 2 + 1), b = this.L.tx(this.x + W / 2 - 1), ty = this.L.ty(this.y + 0.5);
    let one = false;
    for (let tx = a; tx <= b; tx++) { const k = this.L.get(tx, ty); if (k === ONEWAY) one = true; else if (k !== 0 && k !== 3) return false; }
    return one;
  }

  // Ledge in the wall column ahead: its top must be within reach and have room
  // to stand. Starts the mantle and returns true.
  tryMantle(dir) {
    const M = MOVE, L = this.L;
    const col = L.tx(this.x + dir * (W / 2 + 1));
    let ty = L.ty(this.y - 1);
    // climb the wall column to its first open tile
    let n = 0;
    while (L.get(col, ty) === 1 && n < 12) { ty--; n++; }
    if (n === 0) return false;
    const top = L.top(ty + 1);
    const rise = this.y - top;
    if (rise < M.mantleMin || rise > M.mantleMax) return false;
    const x1 = dir > 0 ? L.left(col) + W / 2 + 1 : L.left(col + 1) - W / 2 - 1;
    if (L.solidBox(x1 - W / 2 + 0.5, top - HEIGHT.crouch, x1 + W / 2 - 0.5, top - 0.5)) return false;
    // need head room above us to rise
    if (L.solidBox(this.x - W / 2 + 0.5, top - HEIGHT.crouch, this.x + W / 2 - 0.5, this.y - this.h)) return false;
    const m = this.mantle;
    m.t = 0; m.dur = rise < 12 ? 0.14 : rise < 30 ? 0.24 : 0.36; m.x0 = this.x; m.y0 = this.y; m.x1 = x1; m.y1 = top; m.dir = dir;
    this.state = 'mantle'; this.vx = 0; this.vy = 0; this.grounded = false; this.ev.mantle = true;
    return true;
  }

  stepMantle(dt) {
    const m = this.mantle;
    m.t += dt;
    const k = Math.min(1, m.t / m.dur);
    // rise first, then over the edge
    const up = Math.min(1, k / 0.65), over = Math.max(0, (k - 0.45) / 0.55);
    const e = (u) => u * u * (3 - 2 * u);
    this.y = m.y0 + (m.y1 - m.y0) * e(up);
    this.x = m.x0 + (m.x1 - m.x0) * e(over);
    this.h = HEIGHT.crouch + (HEIGHT.stand - HEIGHT.crouch) * over;
    if (k >= 1) {
      this.state = 'ground'; this.grounded = true; this.coyoteT = MOVE.coyote; this.vx = m.dir * 60;
      if (!this.canStand()) { this.h = HEIGHT.crouch; this.crouching = true; } else this.h = HEIGHT.stand;
    }
  }

  stepLadder(dt, inp) {
    const M = MOVE, L = this.L;
    const cx = L.ladderX(this.x);
    const dx = cx - this.x, sn = M.ladderSnap * dt;
    this.x += Math.abs(dx) <= sn ? dx : Math.sign(dx) * sn;
    this.vy = (inp.down ? 1 : 0) * M.ladder - (inp.up ? 1 : 0) * M.ladder;
    // hop off
    if (inp.jumpPressed) {
      this.state = 'air'; this.vy = inp.down ? 0 : -M.jumpV * 0.7; this.vx = (inp.moveX || this.facing * 0.5) * M.run * 0.8;
      this.ev.jump = !inp.down; this.bufferT = 0; return;
    }
    const ny = this.y + this.vy * dt;
    // top: step onto the floor at the ladder's top
    const top = L.ladderTop(this.x, this.y - 2);
    if (this.vy < 0 && ny <= top + 0.01) {
      if (L.surface(this.x - W / 2 + 1, this.x + W / 2 - 1, this.x, top - 1, top + 1) !== null || !L.ladderAt(this.x, top - 8, top - 1)) {
        this.y = top; this.state = 'ground'; this.grounded = true; this.vy = 0; return;
      }
    }
    // bottom: feet reach a floor
    if (this.vy > 0) {
      const s = L.surface(this.x - W / 2 + 1, this.x + W / 2 - 1, this.x, this.y - 0.5, ny, true);
      if (s !== null && !L.ladderAt(this.x, s + 1, s + 4)) { this.y = s; this.state = 'ground'; this.grounded = true; this.vy = 0; return; }
    }
    this.y = ny;
    // left the ladder column (e.g. climbed past its bottom with no floor)
    if (!L.ladderAt(this.x, this.y - this.h + 2, this.y + 2)) { this.state = 'air'; }
  }
}
