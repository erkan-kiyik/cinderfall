// FX director: ties particles, audio, camera and decals together.
// Owns tracers, timed dynamic lights, melee slash trails and explosions.

import { K, burstSparks, puffSmoke, kickDust } from '../engine/particles.js';
import { rand, randSpread, clamp } from '../engine/math.js';
import { segVsBox } from './player.js';

export class FX {
  constructor(particles, audio, camera, world) {
    this.ps = particles;
    this.audio = audio;
    this.cam = camera;
    this.world = world;
    this.tracers = [];    // {x0,y0,x1,y1,life,age,color,width}
    this.lights = [];     // {x,y,r,c,a,life,age}
    this.slashes = [];    // {x,y,a0,a1,r,life,age,facing}
    this.projectiles = []; // energy bolts: {x,y,vx,vy,color,radius,dmg,...}
    this.beams = [];      // {x0,y0,x1,y1,color,width,life,age}
    this.arcs = [];       // electric arcs: {pts,color,life,age}
    this.game = null;     // bound after construction for projectile damage

    particles.solidAt = (x, y) => world.solidAt(x, y);
    particles.onImpact = (kind, x, y, vx, vy, bounces) => {
      if (kind === K.CASING && bounces === 0) this.audio.casingTink();
      if (kind === K.BLOOD) this.world.bloodDecal(x, y, 7);
    };
  }

  addLight(x, y, r, c, a, life = 0.08) {
    this.lights.push({ x, y, r, c, a, life, age: 0 });
  }

  // ---- weapon fire ----
  muzzle(x, y, ang, big = 1) {
    this.addLight(x, y, 190 * big, [255, 190, 110], 0.95, 0.055);
    puffSmoke(this.ps, x + Math.cos(ang) * 8, y + Math.sin(ang) * 8, 2, 'rgba(150,148,145,0.7)', {
      vx: Math.cos(ang) * 40, vy: Math.sin(ang) * 40 - 14, sizeMul: 0.8, lifeMul: 0.8,
    });
    if (Math.random() < 0.6) burstSparks(this.ps, x, y, ang, 2, 0.35, 300);
  }

  tracer(x0, y0, x1, y1, color = null, width = 1.4) {
    this.tracers.push({ x0, y0, x1, y1, life: 0.09, age: 0, color, width });
  }

  casing(x, y, facing, size) {
    this.ps.spawn(K.CASING, {
      x, y,
      vx: -facing * rand(60, 130) + randSpread(30),
      vy: -rand(150, 240),
      vrot: randSpread(22),
      life: rand(2.5, 4), size,
      grav: 1900, bounce: 0.4,
    });
  }

  magDrop(x, y, facing) {
    this.ps.spawn(K.DEBRIS, {
      x, y, vx: -facing * rand(10, 40), vy: rand(30, 80),
      vrot: randSpread(9), life: 3.2, size: 7, color: '#2c2e31',
      grav: 1800, bounce: 0.2,
    });
  }

  // ---- impacts ----
  impactWall(x, y, nx, ny) {
    const ang = Math.atan2(ny, nx);
    burstSparks(this.ps, x + nx * 2, y + ny * 2, ang, 5, 1, 380);
    puffSmoke(this.ps, x + nx * 3, y + ny * 3, 2, 'rgba(130,124,112,0.75)', { sizeMul: 0.7 });
    for (let i = 0; i < 3; i++) {
      this.ps.spawn(K.DEBRIS, {
        x, y, vx: nx * rand(40, 160) + randSpread(70), vy: ny * rand(40, 140) - rand(30, 110),
        vrot: randSpread(14), life: rand(0.5, 1.1), size: rand(1.4, 2.8),
        color: '#55524a', grav: 1500, bounce: 0.3,
      });
    }
    this.addLight(x + nx * 3, y + ny * 3, 40, [255, 200, 130], 0.4, 0.04);
    this.world.bulletHole(x, y);
    this.audio.impact();
  }

  blood(x, y, dirX) {
    for (let i = 0; i < 9; i++) {
      this.ps.spawn(K.BLOOD, {
        x: x + randSpread(3), y: y + randSpread(5),
        vx: dirX * rand(30, 210) + randSpread(60), vy: -rand(20, 170),
        life: rand(0.5, 1.3), size: rand(1.2, 2.6),
        color: `rgb(${110 + rand(0, 40) | 0},${16 + rand(0, 10) | 0},14)`,
        grav: 1500, bounce: 1,      // bounce flag routes impact → decal
      });
    }
    puffSmoke(this.ps, x, y, 2, 'rgba(120,26,22,0.5)', { sizeMul: 0.65, lifeMul: 0.5, vy: -8 });
  }

  footstep(x, y, dir, runNorm) {
    kickDust(this.ps, x, y, -dir, 2 + (runNorm > 0.7 ? 2 : 0));
    this.audio.footstep(runNorm);
  }

  landDust(x, y, hard) {
    kickDust(this.ps, x - 6, y, -1, hard ? 7 : 3);
    kickDust(this.ps, x + 6, y, 1, hard ? 7 : 3);
    this.audio.land(hard);
  }

  slash(x, y, a0, a1, r, facing) {
    this.slashes.push({ x, y, a0, a1, r, life: 0.16, age: 0, facing });
  }

  explosion(x, y) {
    this.audio.explosion();
    this.cam.addTrauma(0.75);
    this.cam.landBounce(6);
    this.addLight(x, y - 10, 420, [255, 180, 90], 1, 0.34);
    this.world.scorch(x, y - 2, 34);
    // fireball core
    for (let i = 0; i < 14; i++) {
      const a = rand(0, Math.PI * 2), v = rand(20, 260);
      this.ps.spawn(K.EMBER, {
        x: x + randSpread(8), y: y - 8 + randSpread(8),
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120,
        life: rand(0.3, 0.8), size: rand(2.5, 5.5),
        grav: 600, drag: 2.2,
      });
    }
    burstSparks(this.ps, x, y - 10, -Math.PI / 2, 18, 2.6, 520);
    for (let i = 0; i < 10; i++) {
      this.ps.spawn(K.DEBRIS, {
        x, y: y - 6, vx: randSpread(320), vy: -rand(80, 380),
        vrot: randSpread(16), life: rand(0.8, 2), size: rand(2, 5),
        color: i % 3 ? '#4a4239' : '#6b3226', grav: 1600, bounce: 0.35,
      });
    }
    for (let i = 0; i < 12; i++) {
      this.ps.spawn(K.SMOKE, {
        x: x + randSpread(14), y: y - 10 - rand(0, 16),
        vx: randSpread(70), vy: -rand(30, 120),
        life: rand(1.2, 2.6), size: rand(9, 18), grow: rand(26, 46),
        drag: 1.4, color: 'rgba(64,58,52,0.9)', alpha: 0.85,
      });
    }
  }

  // ---- energy weapons ----
  bindGame(game) { this.game = game; }

  // Muzzle burst tuned for energy weapons: coloured core light + spark spray.
  energyMuzzle(x, y, ang, color, big = 1) {
    this.addLight(x, y, 150 * big, color, 0.95, 0.06);
    this.addLight(x, y, 60 * big, [255, 255, 255], 0.8, 0.05);
    for (let i = 0; i < 3; i++) {
      this.ps.spawn(K.EMBER, {
        x, y, vx: Math.cos(ang) * rand(80, 260) + randSpread(60),
        vy: Math.sin(ang) * rand(80, 260) + randSpread(60),
        life: rand(0.12, 0.34), size: rand(1.2, 2.6),
        color: `rgb(${color[0]},${color[1]},${color[2]})`, drag: 3, grav: 0,
      });
    }
  }

  // Persistent-looking beam for one frame (laser/particle/lightning tick).
  beam(x0, y0, x1, y1, color, width = 3, life = 0.06) {
    this.beams.push({ x0, y0, x1, y1, color, width, life, age: 0 });
    this.addLight(x1, y1, 90, color, 0.7, life);
  }

  // Rolling fire particles along the flamethrower stream.
  flameSpit(x0, y0, x1, y1, ang) {
    for (let i = 0; i < 4; i++) {
      const t = Math.random();
      this.ps.spawn(K.EMBER, {
        x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t,
        vx: Math.cos(ang) * 70 + randSpread(60), vy: Math.sin(ang) * 70 + randSpread(60) - 40,
        life: rand(0.2, 0.55), size: rand(2.2, 4.4),
        color: `rgb(255,${120 + (Math.random() * 80 | 0)},50)`, drag: 2.4, grav: -80,
      });
    }
  }

  // Jagged electric arc between two points.
  arc(x0, y0, x1, y1, color) {
    const pts = [[x0, y0]];
    const segs = 6;
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      pts.push([x0 + (x1 - x0) * t + randSpread(14), y0 + (y1 - y0) * t + randSpread(14)]);
    }
    pts.push([x1, y1]);
    this.arcs.push({ pts, color, life: 0.09, age: 0 });
  }

  // Energy hit burst — coloured sparks, ring flash, light. `blast` adds an AoE.
  energyImpact(x, y, color, blast = 0) {
    const [r, g, b] = color;
    this.addLight(x, y, 120 + blast * 2, color, 0.9, 0.14);
    for (let i = 0; i < 10 + blast / 6; i++) {
      const a = rand(0, Math.PI * 2), v = rand(40, 220 + blast);
      this.ps.spawn(K.EMBER, {
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30,
        life: rand(0.2, 0.6), size: rand(1.4, 3.2),
        color: `rgb(${r},${g},${b})`, drag: 2.6, grav: 200,
      });
    }
    puffSmoke(this.ps, x, y, 2, `rgba(${r},${g},${b},0.4)`, { sizeMul: 0.8, lifeMul: 0.7, vy: -18 });
    if (blast > 0) {
      this.cam.addTrauma(clamp(blast / 260, 0.08, 0.5));
      this.world.scorch(x, y, blast * 0.18);
    }
  }

  // Spawns a travelling energy bolt. cfg: {color,radius,speed,dmg,headMul,
  // blast,pierce,trailEvery,owner}. Damage resolves through the bound game.
  spawnProjectile(x, y, ang, cfg) {
    this.projectiles.push({
      x, y, px: x, py: y,
      vx: Math.cos(ang) * cfg.speed, vy: Math.sin(ang) * cfg.speed,
      color: cfg.color, radius: cfg.radius || 4,
      dmg: cfg.dmg, headMul: cfg.headMul || 1.6, blast: cfg.blast || 0,
      pierce: cfg.pierce || 0, hitSet: new Set(),
      life: cfg.life || 1.4, age: 0, trail: 0,
    });
  }

  _dealDamage(hitEnemy, dmg, dirX, hx, hy, headshot) {
    const g = this.game;
    if (!g) return;
    const p = g.player;
    const killed = hitEnemy.hp <= dmg;
    p.hits++;
    if (headshot) p.headshots++;
    hitEnemy.damage(dmg, dirX, p);
    this.blood(hx, hy, dirX);
    p.hud.hitmark(killed ? 'kill' : headshot ? 'headshot' : 'hit');
    if (killed) p.hud.notify(headshot ? 'HOSTILE ELIMINATED — HEADSHOT' : 'HOSTILE ELIMINATED');
    if (g.onPlayerHit) g.onPlayerHit(headshot, killed);
  }

  updateProjectiles(dt) {
    const g = this.game;
    const enemies = g ? g.enemies : [];
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.px = pr.x; pr.py = pr.y;
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      pr.age += dt;
      const dx = pr.x - pr.px, dy = pr.y - pr.py;

      // trail
      pr.trail -= dt;
      if (pr.trail <= 0) {
        pr.trail = 0.012;
        this.ps.spawn(K.EMBER, {
          x: pr.px, y: pr.py, vx: randSpread(20), vy: randSpread(20),
          life: rand(0.12, 0.3), size: pr.radius * rand(0.5, 0.9),
          color: `rgb(${pr.color[0]},${pr.color[1]},${pr.color[2]})`, drag: 3,
        });
      }

      // world hit
      const wHit = this.world.raycast(pr.px, pr.py, pr.x, pr.y);
      let bestT = wHit ? wHit.t : 1;
      let hitEnemy = null;
      for (const e of enemies) {
        if (e.deadT > 0 || pr.hitSet.has(e)) continue;
        const t = segVsBox(pr.px, pr.py, dx, dy, e.x - 14, e.y - 134, 28, 134);
        if (t !== null && t < bestT) { bestT = t; hitEnemy = e; }
      }

      if (hitEnemy) {
        const hx = pr.px + dx * bestT, hy = pr.py + dy * bestT;
        const headshot = hy < hitEnemy.y - 108;
        this._dealDamage(hitEnemy, pr.dmg * (headshot ? pr.headMul : 1), Math.sign(pr.vx) || 1, hx, hy, headshot);
        this.energyImpact(hx, hy, pr.color, pr.blast);
        if (pr.blast > 0 && g) this._splash(pr, hx, hy);
        if (pr.pierce > 0) { pr.pierce--; pr.hitSet.add(hitEnemy); }
        else { this.projectiles.splice(i, 1); }
        continue;
      }
      if (wHit) {
        const hx = pr.px + dx * bestT, hy = pr.py + dy * bestT;
        if (wHit.tag === 'barrel' && g) g.damageBarrel(wHit.ref, pr.dmg);
        this.energyImpact(hx, hy, pr.color, pr.blast);
        if (pr.blast > 0 && g) this._splash(pr, hx, hy);
        this.projectiles.splice(i, 1);
        continue;
      }
      if (pr.age >= pr.life) this.projectiles.splice(i, 1);
    }
  }

  // AoE for explosive bolts (ion cannon, plasma): radial energy damage.
  _splash(pr, x, y) {
    const g = this.game;
    for (const e of g.enemies) {
      if (e.deadT > 0 || pr.hitSet.has(e)) continue;
      const d = Math.hypot(e.x - x, (e.y - 70) - y);
      if (d < pr.blast) {
        const dmg = pr.dmg * 0.6 * (1 - d / pr.blast);
        this._dealDamage(e, dmg, Math.sign(e.x - x) || 1, e.x, e.y - 70, false);
      }
    }
  }

  update(dt) {
    this.updateProjectiles(dt);
    for (let i = this.beams.length - 1; i >= 0; i--) {
      if ((this.beams[i].age += dt) >= this.beams[i].life) this.beams.splice(i, 1);
    }
    for (let i = this.arcs.length - 1; i >= 0; i--) {
      if ((this.arcs[i].age += dt) >= this.arcs[i].life) this.arcs.splice(i, 1);
    }
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      if ((t.age += dt) >= t.life) this.tracers.splice(i, 1);
    }
    for (let i = this.lights.length - 1; i >= 0; i--) {
      const l = this.lights[i];
      if ((l.age += dt) >= l.life) this.lights.splice(i, 1);
    }
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      if ((s.age += dt) >= s.life) this.slashes.splice(i, 1);
    }
  }

  // additive world-space effects, drawn after characters
  draw(g) {
    if (this.tracers.length) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (const t of this.tracers) {
        const a = clamp(1 - t.age / t.life, 0, 1);
        const c = t.color;
        const gr = g.createLinearGradient(t.x0, t.y0, t.x1, t.y1);
        if (c) {
          gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0)`);
          gr.addColorStop(0.7, `rgba(${c[0]},${c[1]},${c[2]},${0.55 * a})`);
          gr.addColorStop(1, `rgba(255,255,255,${0.9 * a})`);
        } else {
          gr.addColorStop(0, `rgba(255,220,160,0)`);
          gr.addColorStop(0.7, `rgba(255,214,150,${0.5 * a})`);
          gr.addColorStop(1, `rgba(255,240,200,${0.85 * a})`);
        }
        g.strokeStyle = gr;
        g.lineWidth = t.width || 1.4;
        g.beginPath(); g.moveTo(t.x0, t.y0); g.lineTo(t.x1, t.y1); g.stroke();
      }
      g.restore();
    }
    // energy beams: bright white core + coloured glow
    if (this.beams.length) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.lineCap = 'round';
      for (const b of this.beams) {
        const a = clamp(1 - b.age / b.life, 0, 1);
        const [r, gg, bb] = b.color;
        g.strokeStyle = `rgba(${r},${gg},${bb},${0.4 * a})`;
        g.lineWidth = b.width * 3;
        g.beginPath(); g.moveTo(b.x0, b.y0); g.lineTo(b.x1, b.y1); g.stroke();
        g.strokeStyle = `rgba(255,255,255,${0.9 * a})`;
        g.lineWidth = b.width;
        g.beginPath(); g.moveTo(b.x0, b.y0); g.lineTo(b.x1, b.y1); g.stroke();
      }
      g.restore();
    }
    // electric arcs
    if (this.arcs.length) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (const arc of this.arcs) {
        const a = clamp(1 - arc.age / arc.life, 0, 1);
        const [r, gg, bb] = arc.color;
        g.strokeStyle = `rgba(${r},${gg},${bb},${0.5 * a})`;
        g.lineWidth = 3.4;
        g.beginPath(); g.moveTo(arc.pts[0][0], arc.pts[0][1]);
        for (const p of arc.pts) g.lineTo(p[0], p[1]);
        g.stroke();
        g.strokeStyle = `rgba(255,255,255,${0.85 * a})`;
        g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(arc.pts[0][0], arc.pts[0][1]);
        for (const p of arc.pts) g.lineTo(p[0], p[1]);
        g.stroke();
      }
      g.restore();
    }
    // energy projectiles: glow halo + hot core + comet trail
    if (this.projectiles.length) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (const pr of this.projectiles) {
        const [r, gg, bb] = pr.color;
        const rad = pr.radius;
        const glow = g.createRadialGradient(pr.x, pr.y, 0, pr.x, pr.y, rad * 4);
        glow.addColorStop(0, `rgba(${r},${gg},${bb},0.9)`);
        glow.addColorStop(0.4, `rgba(${r},${gg},${bb},0.4)`);
        glow.addColorStop(1, `rgba(${r},${gg},${bb},0)`);
        g.fillStyle = glow;
        g.beginPath(); g.arc(pr.x, pr.y, rad * 4, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.95)';
        g.beginPath(); g.arc(pr.x, pr.y, rad * 0.6, 0, Math.PI * 2); g.fill();
      }
      g.restore();
    }
    if (this.slashes.length) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (const s of this.slashes) {
        const k = s.age / s.life;
        const a = (1 - k) * 0.7;
        g.fillStyle = `rgba(220,230,245,${a})`;
        g.beginPath();
        const sweep = s.a1 - s.a0;
        const a0 = s.a0 + sweep * k * 0.5;
        g.save();
        g.translate(s.x, s.y);
        g.scale(s.facing, 1);
        g.arc(0, 0, s.r, a0, s.a0 + sweep, false);
        g.arc(0, 0, s.r * 0.55, s.a0 + sweep, a0, true);
        g.closePath();
        g.fill();
        g.restore();
      }
      g.restore();
    }
  }

  getLights() {
    const out = [];
    for (const l of this.lights) {
      const a = l.a * clamp(1 - l.age / l.life, 0, 1);
      out.push({ x: l.x, y: l.y, r: l.r, c: l.c, a, flicker: 0, seed: 0 });
    }
    // every energy bolt emits its own dynamic light
    for (const pr of this.projectiles) {
      out.push({ x: pr.x, y: pr.y, r: pr.radius * 12, c: pr.color, a: 0.7, flicker: 0.3, seed: pr.age * 30 });
    }
    return out;
  }
}
