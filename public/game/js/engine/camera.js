// Cinematic camera: spring follow, trauma-based shake, recoil kick,
// landing bounce, sprint sway. All offsets are composed in applyTransform().

import { clamp, damp, lerp, makeNoise1D } from './math.js';

export class Camera {
  constructor() {
    this.x = 0; this.y = 0;
    this.zoom = 1;
    this.lookAhead = 0;

    this.trauma = 0;            // 0..1, shake = trauma^2
    this.noiseX = makeNoise1D(11);
    this.noiseY = makeNoise1D(29);
    this.noiseR = makeNoise1D(47);

    this.kickY = 0; this.kickVel = 0;    // recoil / landing spring
    this.bobPhase = 0; this.bobAmp = 0;  // sprint sway

    this.shakeX = 0; this.shakeY = 0; this.shakeRot = 0;
    this.time = 0;
  }

  follow(tx, ty, aimDx, dt, snap = false) {
    this.lookAhead = damp(this.lookAhead, clamp(aimDx, -1, 1) * 120, 2.2, dt);
    const gx = tx + this.lookAhead;
    const gy = ty - 70;
    if (snap) { this.x = gx; this.y = gy; return; }
    this.x = damp(this.x, gx, 5.5, dt);
    this.y = damp(this.y, gy, 4.2, dt);
  }

  addTrauma(t) { this.trauma = clamp(this.trauma + t, 0, 1); }
  recoil(v) { this.kickVel -= v; }
  landBounce(v) { this.kickVel += v; }

  update(dt, sprinting, moving) {
    this.time += dt;
    // shake
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    const s = this.trauma * this.trauma;
    const t = this.time * 18;
    this.shakeX = this.noiseX(t) * 26 * s;
    this.shakeY = this.noiseY(t) * 20 * s;
    this.shakeRot = this.noiseR(t) * 0.022 * s;
    // recoil / landing spring
    this.kickVel += -this.kickY * 180 * dt;
    this.kickVel *= Math.exp(-11 * dt);
    this.kickY += this.kickVel * dt * 60;
    // sprint sway
    const targetAmp = sprinting && moving ? 3.2 : 0;
    this.bobAmp = damp(this.bobAmp, targetAmp, 6, dt);
    this.bobPhase += dt * (sprinting ? 11 : 8);
  }

  applyTransform(g, vw, vh) {
    g.translate(vw / 2, vh / 2);
    if (this.shakeRot) g.rotate(this.shakeRot);
    g.scale(this.zoom, this.zoom);
    const bobX = Math.cos(this.bobPhase) * this.bobAmp;
    const bobY = Math.abs(Math.sin(this.bobPhase)) * this.bobAmp * 0.8;
    g.translate(
      -this.x + this.shakeX + bobX,
      -this.y + this.shakeY + bobY + this.kickY
    );
  }

  screenToWorld(sx, sy, vw, vh) {
    return {
      x: (sx - vw / 2) / this.zoom + this.x - this.shakeX,
      y: (sy - vh / 2) / this.zoom + this.y - this.shakeY - this.kickY,
    };
  }
}
