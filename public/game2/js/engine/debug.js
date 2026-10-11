// Developer overlay.
//
// The game had no way to see its own state. Every physics and collision
// question — is the collider where the art is, is that hostile's cone
// actually reaching the player, is the vault probe finding the ledge — had to
// be answered by adding a console.log, reloading, and reading numbers out of
// context while the thing being measured had already moved on.
//
// So this draws the state instead, over the running game, at the frame rate
// the question is actually about. It is a pure reader: it never writes to the
// world, the player or any entity, so leaving it on cannot change what it is
// measuring. Nothing in the game loop calls into it except the two draw hooks
// and the key handler.
//
// F3 toggles. The choice matters: 1-4 are weapon slots, Space is jump, and
// the brief is explicit that the control scheme does not change — F3 is free
// on every keyboard and is what a decade of games has trained this to mean.
// The state is persisted, because a debug overlay that resets on reload is
// one you turn on twenty times an hour.

const KEY = 'cinderfall.debug.v1';

// Collider outlines are keyed by material so a wrong `mat` — which silently
// gives a steel container concrete's impact recipe — is visible at a glance
// rather than only audible.
const MAT_COLOR = {
  metal: '#6fb7ff',
  wood: '#d79a54',
  concrete: '#9aa0a8',
  sand: '#d9c27a',
};
const HITBOX_COLOR = '#ff5a4a';
const PLAYER_COLOR = '#7ec26a';
const VISION_COLOR = 'rgba(255,196,80,';
const PROP_COLOR = 'rgba(120,200,255,0.30)';

// Detection states, in the order the enemy AI escalates through them.
const STATE_COLOR = {
  patrol: '#6fb7ff', suspicious: '#e8c65a', search: '#e8a05a',
  alert: '#ff8a4a', combat: '#ff4a4a', retreat: '#c07adf',
};

class Debug {
  constructor() {
    this.on = false;
    try { this.on = localStorage.getItem(KEY) === '1'; } catch (e) { /* private mode */ }
    // Rolling frame times. A single instantaneous dt reads as noise; a
    // 60-sample window is the shortest that gives a number worth acting on,
    // and the 1% low is what actually corresponds to a visible hitch.
    this.frames = new Float32Array(60);
    this.fi = 0;
    this.filled = 0;
  }

  toggle() {
    this.on = !this.on;
    try { localStorage.setItem(KEY, this.on ? '1' : '0'); } catch (e) { /* ignore */ }
    return this.on;
  }

  // Called every frame whether or not the overlay is showing, so switching it
  // on shows a populated graph instead of a second of empty history.
  sample(dt) {
    this.frames[this.fi] = dt;
    this.fi = (this.fi + 1) % this.frames.length;
    if (this.filled < this.frames.length) this.filled++;
  }

  stats() {
    let sum = 0, worst = 0;
    for (let i = 0; i < this.filled; i++) {
      const v = this.frames[i];
      sum += v;
      if (v > worst) worst = v;
    }
    const avg = this.filled ? sum / this.filled : 0;
    return { fps: avg > 0 ? 1 / avg : 0, ms: avg * 1000, worstMs: worst * 1000 };
  }

  // ---------------------------------------------------------- world space
  // Drawn inside the camera transform, so everything here is in world units
  // and lines up with the geometry it describes. Line widths are divided by
  // the zoom so an outline stays one screen pixel however far the camera has
  // pulled back — a 1-unit line is invisible at 0.7x and fat at 1.4x.
  drawWorld(g, game) {
    if (!this.on) return;
    const z = game.cam.zoom || 1;
    const px = 1 / z;
    const world = game.world;
    const halfVis = (game.vw || 1280) / (2 * z) + 260;
    const near = (x) => Math.abs(x - game.cam.x) < halfVis;

    g.save();
    g.lineWidth = px;
    g.font = `${8 * px}px monospace`;
    g.textBaseline = 'bottom';

    // ---- prop sprite bounds -------------------------------------------
    // The boxes nudgeProp() hit-tests against. Shown because a prop whose
    // sprite box does not sit over its collider is the failure that makes
    // cover look right and behave wrong.
    g.strokeStyle = PROP_COLOR;
    for (const p of world.props) {
      if (!near(p.x)) continue;
      const s = p.spr;
      g.strokeRect(p.x - s.ax * s.s, p.y - s.ay * s.s, s.w, s.h);
    }

    // ---- colliders ------------------------------------------------------
    for (const c of world.colliders) {
      if (!near(c.x + c.w / 2)) continue;
      g.strokeStyle = MAT_COLOR[c.mat] || MAT_COLOR.concrete;
      g.strokeRect(c.x, c.y, c.w, c.h);
    }

    // ---- hostiles -------------------------------------------------------
    for (const e of game.enemies) {
      if (!near(e.x)) continue;
      const hs = e.hitboxScale || 1;
      if (e.deadT > 0) {
        g.strokeStyle = 'rgba(255,90,74,0.25)';
        g.strokeRect(e.x - 13 * hs, e.y - 134 * hs, 26 * hs, 134 * hs);
        continue;
      }
      // The hitbox the player's rounds are actually tested against — which is
      // NOT the same box as the movement collider, and the difference is
      // worth being able to see.
      g.strokeStyle = HITBOX_COLOR;
      g.strokeRect(e.x - 13 * hs, e.y - 134 * hs, 26 * hs, 134 * hs);
      // The region boundaries the hit reaction reads off (see HIT_REGIONS).
      g.strokeStyle = 'rgba(255,90,74,0.4)';
      for (const f of [0.80, 0.45]) {
        const y = e.y - 134 * hs * f;
        g.beginPath(); g.moveTo(e.x - 13 * hs, y); g.lineTo(e.x + 13 * hs, y); g.stroke();
      }

      // Awareness, drawn as a filled sight line toward the player: opacity is
      // the awareness value, so a hostile winding up to detection is visible
      // before it commits.
      const eyeX = e.x, eyeY = e.y - 112 * hs;
      const p = game.player;
      if (p) {
        const sees = world.hasLineOfSight(eyeX, eyeY, p.x, p.y - 95);
        g.strokeStyle = sees
          ? `${VISION_COLOR}${(0.15 + e.awareness * 0.7).toFixed(2)})`
          : 'rgba(120,130,145,0.18)';
        g.beginPath(); g.moveTo(eyeX, eyeY); g.lineTo(p.x, p.y - 95); g.stroke();
      }
      // Facing tick + state label.
      g.strokeStyle = STATE_COLOR[e.state] || '#fff';
      g.beginPath(); g.moveTo(eyeX, eyeY); g.lineTo(eyeX + e.facing * 26, eyeY); g.stroke();
      g.fillStyle = STATE_COLOR[e.state] || '#fff';
      g.fillText(
        `${e.state} ${(e.awareness * 100) | 0}%${e.isBoss ? ' BOSS' : ''}`,
        e.x - 13 * hs, e.y - 138 * hs,
      );
      g.fillText(`m${e.mass.toFixed(2)} v${e.vx.toFixed(0)}`, e.x - 13 * hs, e.y - 128 * hs);
    }

    // ---- player ---------------------------------------------------------
    const p = game.player;
    if (p) {
      g.strokeStyle = PLAYER_COLOR;
      g.strokeRect(p.x - p.halfW, p.y - p.h, p.halfW * 2, p.h);
      // Velocity vector, scaled down so a sprint does not run off the screen.
      g.strokeStyle = '#ffd166';
      g.beginPath();
      g.moveTo(p.x, p.y - p.h / 2);
      g.lineTo(p.x + p.vx * 0.09, p.y - p.h / 2 + p.vy * 0.09);
      g.stroke();
      // Aim ray, at the angle the weapon actually fires along.
      g.strokeStyle = 'rgba(126,194,106,0.45)';
      g.beginPath();
      g.moveTo(p.x, p.y - 95);
      g.lineTo(p.x + Math.cos(p.aimWorld) * 260, p.y - 95 + Math.sin(p.aimWorld) * 260);
      g.stroke();
    }
    g.restore();
  }

  // --------------------------------------------------------- screen space
  // Drawn after the grade, so the numbers are legible whatever the day cycle
  // is doing to the scene behind them.
  drawHud(g, game, dpr = 1) {
    if (!this.on) return;
    const p = game.player;
    const s = this.stats();
    const cur = p && p.cur;
    const wpn = cur && cur.wpn;
    const ws = cur && cur.ws;

    // Movement state is derived rather than stored — the player has no single
    // state enum, it has a set of blends — so this reports the dominant one,
    // which is what a "what is he doing right now" readout is for.
    const move = !p ? '-'
      : p.deadT > 0 ? 'DEAD'
      : p.vault ? 'VAULT'
      : p.sliding ? (p.slideStuck ? 'CRAWL' : 'SLIDE')
      : !p.onGround ? (p.vy < 0 ? 'RISE' : 'FALL')
      : p.crouchHold > 0.5 ? 'CROUCH'
      : p.sprinting ? 'SPRINT'
      : Math.abs(p.vx) > 12 ? 'RUN' : 'IDLE';

    const lines = [
      `${s.fps.toFixed(0)} fps   ${s.ms.toFixed(2)}ms avg   ${s.worstMs.toFixed(2)}ms worst`,
      `state ${game.state}   stage ${game.stage}`,
    ];
    if (p) {
      lines.push(
        `move  ${move}${p.onGround ? '' : ` air ${p.airTime.toFixed(2)}s`}`,
        `pos   ${p.x.toFixed(1)}, ${p.y.toFixed(1)}   h ${p.h.toFixed(0)}`,
        `vel   ${p.vx.toFixed(1)}, ${p.vy.toFixed(1)}   |v| ${Math.hypot(p.vx, p.vy).toFixed(1)}`,
        `body  lean ${p.lean.toFixed(3)}  stumble ${p.stumbleLean.toFixed(3)}  squash ${p.squash.toFixed(3)}`,
        `grace coyote ${p.coyoteT.toFixed(3)}  jumpBuf ${p.jumpBufT.toFixed(3)}`,
        `hp ${p.hp | 0}/${p.maxHp | 0}  armor ${p.armor | 0}  stam ${p.stamina.toFixed(0)}`,
      );
    }
    if (wpn && ws) {
      lines.push(
        `wpn   ${wpn.name || '-'}  bulk ${p.weaponBulk.toFixed(3)}`,
        `ammo  ${cur.mag === undefined ? '-' : cur.mag}/${cur.reserve === undefined ? '-' : cur.reserve}` +
          `${p.reload ? '  RELOADING' : ''}`,
        `recoil kick ${ws.recoil.toFixed(2)}  climb ${ws.recoilRot.toFixed(3)}  spray ${p.spray.toFixed(4)}`,
        `spread ${p.visSpread.toFixed(4)}${ws.heat ? `  heat ${ws.heat.toFixed(2)}` : ''}`,
      );
    }
    const alive = game.enemies.filter((e) => e.deadT <= 0).length;
    lines.push(
      `enemies ${alive}/${game.enemies.length}   particles ${game.particles.count}`,
      `colliders ${game.world.colliders.length}   props ${game.world.props.length}`,
      `cam ${game.cam.x.toFixed(0)}, ${game.cam.y.toFixed(0)}  zoom ${game.cam.zoom.toFixed(3)}`,
      `F3 — hide`,
    );

    g.save();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.font = '11px ui-monospace, Menlo, Consolas, monospace';
    g.textBaseline = 'top';
    const pad = 6, lh = 14;
    // The HUD is DOM and therefore always above the canvas, so the panel
    // cannot be drawn over it — it has to be drawn where it isn't. TOP_CLEAR
    // is below the health/stamina/scrap cluster; the panel is then sized to
    // stop short of the bark card along the bottom.
    const TOP_CLEAR = 152;
    const x0 = 10, y0 = TOP_CLEAR;
    let wMax = 0;
    for (const l of lines) wMax = Math.max(wMax, g.measureText(l).width);
    g.fillStyle = 'rgba(6,8,11,0.78)';
    g.fillRect(x0, y0, wMax + pad * 2, lines.length * lh + pad * 2);
    g.fillStyle = '#cfd6e0';
    for (let i = 0; i < lines.length; i++) {
      // The first line (frame timing) is the one being watched during a
      // performance pass, so it is coloured by whether the frame budget is
      // being met rather than being left to be read digit by digit.
      if (i === 0) g.fillStyle = s.ms > 20 ? '#ff6a5a' : s.ms > 13 ? '#e8c65a' : '#7ec26a';
      else if (i === 1) g.fillStyle = '#cfd6e0';
      g.fillText(lines[i], x0 + pad, y0 + pad + i * lh);
    }
    g.restore();
  }
}

export const debug = new Debug();
