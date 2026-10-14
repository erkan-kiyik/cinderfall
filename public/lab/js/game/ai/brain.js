// KOR LAB — enemy AI.
//
// One Brain per enemy drives its Character exactly like a player would: it
// fills a movement input for the Mover, sets the aim point and pulls the
// trigger. States:
//   guard   stands or patrols, glancing around; builds awareness from what it
//           sees (cone in front, range, line of sight) and hears (shots)
//   search  walks to the last known position, looks both ways, gives up
//   combat  per type: the rifleman takes cover and peeks to fire bursts, the
//           assault rushes in with the shotgun, the shield trooper pushes
//           forward and bashes
// Fairness: a squad hands out fire tokens (at most N shooting at once),
// reaction time and aim error come from the difficulty.
import { rayTiles } from '../ballistics.js';

export const DIFF = {
  normal: { reaction: 0.65, errMax: 0.12, errMin: 0.04, settle: 0.02, tokens: 2, dmg: 0.32, burst: 1 },
  hard: { reaction: 0.4, errMax: 0.09, errMin: 0.022, settle: 0.03, tokens: 3, dmg: 0.55, burst: 1.3 },
};

const KIND = {
  tet: { sight: 430, cone: 0.85, walk: 0.32, prefer: [170, 330], burst: [3, 5], pause: [0.9, 1.6] },
  huc: { sight: 380, cone: 0.85, walk: 0.4, prefer: [0, 70], burst: [1, 1], pause: [0.5, 0.9] },
  kal: { sight: 360, cone: 0.85, walk: 0.3, prefer: [0, 30], burst: [0, 0], pause: [1.4, 1.4] },
};

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// Fire tokens shared by a group of enemies.
export class Squad {
  constructor(max = 2) { this.max = max; this.hold = new Set(); }
  request(b, force = false) {
    if (this.hold.has(b)) return true;
    if (this.hold.size >= this.max && !force) return false;
    this.hold.add(b); return true;
  }
  release(b) { this.hold.delete(b); }
}

export class Brain {
  // ch: Character; opts: { kind, zone: [x0, x1], patrol: [x0, x1] | null, diff }
  constructor(ch, opts) {
    this.ch = ch; this.kind = opts.kind; this.K = KIND[opts.kind];
    this.D = opts.diff || DIFF.normal;
    this.zone = opts.zone || [ch.m.x - 200, ch.m.x + 200];
    this.patrol = opts.patrol || null;
    this.home = ch.m.x;
    this.state = 'guard';
    this.aw = 0;                  // awareness 0..1
    this.seenT = 0; this.lostT = 0;
    this.lx = ch.m.x; this.ly = ch.m.y; // last known target position (feet)
    this.ax = ch.m.x + ch.m.facing * 100; this.ay = ch.m.y - 46; // aim point
    this.err = this.D.errMax;
    this.burst = 0; this.pause = rand(0.4, 1.0);
    this.cover = null; this.peek = 0; this.hide = rand(0.8, 1.5); this.supp = 0;
    this.lookT = rand(2, 4); this.patrolDir = 1; this.waitT = 0;
    this.searchT = 0; this.dodgeT = 0; this.bashT = 0; this.bashReq = false;
    this.inp = { moveX: 0, up: false, down: false, jump: false, jumpPressed: false, sprint: false, crouch: false, face: ch.m.facing };
    this.see = false;
    this._n = {};
  }

  // a shot or a hit: full alert toward (x, y)
  alarm(x, y, strength = 1) {
    if (!this.ch.alive) return;
    this.lx = x; this.ly = y;
    this.aw = Math.min(1, this.aw + strength);
    if (this.aw >= 1) { if (this.state !== 'combat') this.enter('combat'); }
    else if (this.state === 'guard') { this.state = 'search'; this.searchT = 0; }
  }
  suppress(k) { this.supp = Math.min(2, this.supp + k); }

  enter(s) {
    this.state = s;
    if (s === 'combat') { this.seenT = Math.min(this.seenT, 0.2); this.lostT = 0; }
    if (s === 'search') this.searchT = 0;
  }

  // Can the eye see the target? Checks the head first, then the chest.
  sees(level, tgt) {
    const m = this.ch.m, tm = tgt.m;
    const ex = m.x + m.facing * 2, ey = m.y - (m.crouching ? 36 : 54);
    const dx0 = tm.x - m.x;
    const dist = Math.hypot(tm.x - ex, tm.y - 40 - ey);
    if (dist > this.K.sight * (this.state === 'combat' ? 1.25 : 1)) return false;
    // in front (a wide cone in combat, where it keeps turning to the target)
    if (this.state !== 'combat' && dx0 * m.facing < -6) return false;
    for (const off of [tm.crouching ? 36 : 54, tm.crouching ? 24 : 34]) {
      const tx = tm.x, ty = tm.y - off, dx = tx - ex, dy = ty - ey, d = Math.hypot(dx, dy);
      if (d < 1) return true;
      // the slope of the look: no seeing straight up or down
      if (this.state !== 'combat' && Math.abs(dy) > Math.abs(dx) * 1.6 + 30) continue;
      if (rayTiles(level, ex, ey, dx / d, dy / d, d, this._n) >= d - 1) return true;
    }
    return false;
  }

  // floor ahead within a small drop? (stops guards walking off ledges)
  floorAhead(level, dir, drop = 26) {
    const m = this.ch.m, x = m.x + dir * 12;
    return level.surface(x - 1, x + 1, x, m.y - 10, m.y + drop) !== null;
  }

  // an obstacle taller than a step right in front (non-climbers stop there)
  wallAhead(level, dir) {
    const m = this.ch.m, x = m.x + dir * 9.5;
    return level.solidBox(x - 1, m.y - 22, x + 1, m.y - 9);
  }
  // can it walk from x0 to x1 on this level without climbing?
  pathClear(level, x0, x1, y) {
    return !level.solidBox(Math.min(x0, x1) - 8, y - 22, Math.max(x0, x1) + 8, y - 9);
  }

  pickCover(level, covers, tx) {
    const m = this.ch.m;
    let best = null, bs = -1e9;
    for (const c of covers) {
      if (c.used && c.used !== this) continue;
      if (c.x < this.zone[0] || c.x > this.zone[1]) continue;
      if (Math.abs(c.y - m.y) > 44) continue;             // same level, or a step
      if ((tx - c.x) * c.side <= 0) continue;              // protects from the target's side
      if (this.kind !== 'huc' && !this.pathClear(level, m.x, c.x, c.y)) continue;
      const d = Math.abs(tx - c.x), travel = Math.abs(c.x - m.x);
      if (travel > 260) continue;
      const [lo, hi] = this.K.prefer;
      let s = -travel * 0.6 - (d < lo ? (lo - d) * 2 : d > hi ? (d - hi) * 1.2 : 0);
      if (c === this.cover) s += 40;
      if (s > bs) { bs = s; best = c; }
    }
    if (this.cover && this.cover !== best) this.cover.used = null;
    if (best) best.used = this;
    this.cover = best;
  }

  // One AI step: returns the movement input; sets aim and trigger on the character.
  think(dt, world) {
    const ch = this.ch, m = ch.m, inp = this.inp, K = this.K, D = this.D;
    const L = world.level, P = world.player;
    inp.moveX = 0; inp.jump = false; inp.jumpPressed = false; inp.sprint = false; inp.crouch = false; inp.up = false; inp.down = false;
    let trigger = false, pressed = false;
    this.supp = Math.max(0, this.supp - dt * 0.5);
    this.dodgeT = Math.max(0, this.dodgeT - dt); this.bashT = Math.max(0, this.bashT - dt);
    if (!ch.alive) { if (this.cover) this.cover.used = null; world.squad.release(this); return inp; }
    const alive = P && P.alive;
    this.see = alive && this.sees(L, P);
    const pm = alive ? P.m : null;
    const dist = pm ? Math.abs(pm.x - m.x) : 1e9;
    // --- awareness ------------------------------------------------------------------
    if (this.see) {
      const near = 1 - clamp(dist / K.sight, 0, 1);
      this.aw = Math.min(1, this.aw + dt * (0.9 + 3.2 * near) * (pm.crouching ? 0.6 : 1) * (this.state === 'combat' ? 3 : 1));
      this.lx = pm.x; this.ly = pm.y;
      this.seenT += dt; this.lostT = 0;
      if (this.aw >= 1 && this.state !== 'combat') { this.enter('combat'); world.alert(this, pm.x, pm.y); }
    } else {
      this.seenT = Math.max(0, this.seenT - dt * 2);
      this.lostT += dt;
      if (this.state !== 'combat') this.aw = Math.max(0, this.aw - dt * 0.12);
    }
    if (!alive && this.state === 'combat') this.enter('search');
    // --- states ------------------------------------------------------------------------
    let face = m.facing;
    if (this.state === 'guard') face = this.guard(dt, L);
    else if (this.state === 'search') face = this.search(dt, L);
    else {
      if (this.lostT > 5) { this.enter('search'); world.squad.release(this); }
      face = this.lx < m.x ? -1 : 1;
      if (this.kind === 'tet') ({ trigger, pressed } = this.rifleman(dt, world, dist));
      else if (this.kind === 'huc') ({ trigger, pressed } = this.assault(dt, world, dist));
      else this.shield(dt, world, dist);
    }
    inp.face = face;
    // --- aim: settle onto the target with an error that shrinks while watching ---------
    const tgx = this.see ? pm.x : this.lx, tgy = this.see ? pm.y - (pm.crouching ? 26 : 40) : this.ly - 40;
    if (this.state !== 'combat') { this.ax += (m.x + face * 120 - this.ax) * Math.min(1, dt * 3); this.ay += (m.y - 44 - this.ay) * Math.min(1, dt * 3); }
    else {
      const k = 1 - Math.exp(-dt * (this.see ? 7 : 2));
      this.ax += (tgx - this.ax) * k; this.ay += (tgy - this.ay) * k;
    }
    this.err = this.see ? Math.max(D.errMin, this.err - dt * D.settle * (1 + this.seenT)) : Math.min(D.errMax, this.err + dt * 0.04);
    const pmv = pm ? Math.min(1, Math.abs(pm.vx) / 200) : 0; // moving targets are harder
    const e = (this.err + pmv * 0.03) * Math.max(60, dist);
    ch.setAim(this.ax + Math.sin(world.t * 2.7 + this.home) * e, this.ay + Math.cos(world.t * 3.3 + this.home * 0.7) * e * 0.8);
    ch.weaponInput({ trigger, pressed });
    // never leave the zone; only the rusher climbs over things
    if ((m.x < this.zone[0] && inp.moveX < 0) || (m.x > this.zone[1] && inp.moveX > 0)) inp.moveX = 0;
    if (this.kind !== 'huc' && inp.moveX && this.wallAhead(L, Math.sign(inp.moveX))) inp.moveX = 0;
    return inp;
  }

  guard(dt, L) {
    const m = this.ch.m, inp = this.inp;
    if (this.patrol) {
      if (this.waitT > 0) { this.waitT -= dt; return m.facing; }
      const goal = this.patrolDir > 0 ? this.patrol[1] : this.patrol[0];
      if (Math.abs(goal - m.x) < 6 || !this.floorAhead(L, this.patrolDir)) { this.patrolDir *= -1; this.waitT = rand(1.2, 2.6); return m.facing; }
      inp.moveX = this.patrolDir * this.K.walk;
      return this.patrolDir;
    }
    // stands guard, glancing back now and then
    this.lookT -= dt;
    if (this.lookT <= 0) { this.lookT = rand(2.5, 5); return -m.facing; }
    return m.facing;
  }

  search(dt, L) {
    const m = this.ch.m, inp = this.inp;
    this.searchT += dt;
    const dx = this.lx - m.x;
    if (Math.abs(dx) > 14 && this.searchT < 6 && this.floorAhead(L, Math.sign(dx), 60)) { inp.moveX = Math.sign(dx) * 0.55; return Math.sign(dx); }
    // look both ways, then give up
    if (this.searchT > 9) { this.state = 'guard'; this.aw = 0.3; }
    return Math.sin(this.searchT * 1.3) > 0 ? 1 : -1;
  }

  // shoot in bursts with a fire token; returns trigger state
  fire(dt, world, force = false) {
    const g = this.ch.gun;
    if (!g) return { trigger: false, pressed: false };
    // fairness: nobody shoots from outside the player's screen
    const onScreen = !world.onScreen || world.onScreen(this.ch.m.x, this.ch.m.y - 40);
    const ready = this.see && onScreen && this.seenT > this.D.reaction;
    if (this.burst > 0) {
      if (!ready || g.state === 'reload') { this.burst = 0; world.squad.release(this); return { trigger: false, pressed: false }; }
      const before = this._ammo ?? g.ammo;
      if (g.ammo < before) this.burst -= before - g.ammo;
      this._ammo = g.ammo;
      if (this.burst <= 0) { world.squad.release(this); this.pause = rand(...this.K.pause); return { trigger: false, pressed: false }; }
      return { trigger: true, pressed: true };
    }
    this.pause -= dt;
    if (this.pause > 0 || !ready) return { trigger: false, pressed: false };
    if (!world.squad.request(this, force)) { this.pause = rand(0.2, 0.5); return { trigger: false, pressed: false }; }
    const [a, b] = this.K.burst;
    this.burst = Math.round(rand(a, b) * this.D.burst) || 1; this._ammo = g.ammo;
    return { trigger: true, pressed: true };
  }

  rifleman(dt, world, dist) {
    const m = this.ch.m, inp = this.inp, L = world.level;
    if (!this.cover || (this.lx - this.cover.x) * this.cover.side <= 0) this.pickCover(L, world.covers, this.lx);
    const c = this.cover;
    if (c) {
      const dx = c.x - m.x;
      if (Math.abs(dx) > 3) {
        // run to cover (crouch the last bit if under fire)
        inp.moveX = Math.sign(dx) * (Math.abs(dx) > 40 ? 1 : 0.5);
        inp.sprint = Math.abs(dx) > 80;
        return this.fire(dt, world);
      }
      // in cover: hide, then rise and shoot
      if (this.peek > 0) {
        this.peek -= dt;
        const f = this.fire(dt, world);
        if (this.peek <= 0 && this.burst <= 0) { this.hide = rand(0.9, 1.8) + this.supp; world.squad.release(this); }
        return f;
      }
      inp.crouch = true;
      this.hide -= dt;
      const g = this.ch.gun;
      if (g && g.ammo < g.s.mag * 0.5 && g.state === 'idle') this.ch.weaponInput({ reload: true });
      if (this.hide <= 0 && this.supp < 1) { this.peek = rand(1.2, 2.0); this.seenT = Math.max(this.seenT, this.D.reaction * 0.6); }
      return { trigger: false, pressed: false };
    }
    // no cover: hold a comfortable range, crouch at long range
    const [lo, hi] = this.K.prefer, dir = Math.sign(this.lx - m.x) || 1;
    if (dist < lo - 30 && this.floorAhead(L, -dir)) inp.moveX = -dir * 0.6;
    else if (dist > hi + 40 && this.floorAhead(L, dir)) inp.moveX = dir * 0.7;
    else if (!this.see && this.floorAhead(L, dir)) inp.moveX = dir * 0.6;
    inp.crouch = this.see && dist > 260 && inp.moveX === 0;
    return this.fire(dt, world);
  }

  assault(dt, world, dist) {
    const m = this.ch.m, inp = this.inp, L = world.level, P = world.player;
    const dir = Math.sign(this.lx - m.x) || 1;
    if (dist > 52 && this.floorAhead(L, dir, 70)) { inp.moveX = dir; inp.sprint = dist > 140 && this.burst <= 0; }
    // a step back after a blast at point-blank range
    if (dist < 30 && this.floorAhead(L, -dir)) inp.moveX = -dir * 0.6;
    // jump the player's aim: when looked at from close, hop or slide
    if (P && this.dodgeT <= 0 && dist < 220 && dist > 90 && this.see) {
      const sh = P.shoulder(this._sh || (this._sh = [0, 0])), a = Math.atan2(m.y - 36 - sh[1], m.x - sh[0]);
      const pa = Math.atan2(P.aimY - sh[1], P.aimX - sh[0]);
      if (Math.abs(Math.atan2(Math.sin(a - pa), Math.cos(a - pa))) < 0.12 && Math.random() < dt * 2.5) {
        this.dodgeT = rand(2.2, 3.4);
        if (Math.random() < 0.5) { inp.jump = true; inp.jumpPressed = true; } else { inp.crouch = true; inp.sprint = true; }
      }
    }
    // only worth firing up close
    if (dist > 120) return { trigger: false, pressed: false };
    return this.fire(dt, world, dist < 80);
  }

  shield(dt, world, dist) {
    const m = this.ch.m, inp = this.inp, L = world.level;
    const dir = Math.sign(this.lx - m.x) || 1;
    if (dist > 34 && this.floorAhead(L, dir, 40)) inp.moveX = dir * (dist > 160 ? 0.5 : 0.36);
    if (this.see && dist < 40 && this.bashT <= 0 && Math.abs(world.player.m.y - m.y) < 30) {
      this.bashT = 1.5;
      this.bashReq = true; // the scene resolves the hit
    }
  }
}
