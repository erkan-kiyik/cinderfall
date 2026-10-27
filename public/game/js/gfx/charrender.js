// KOR — character renderer.
//
// A character is a stack of overlapping part sprites. Each character is
// first drawn into its own slot of an offscreen "slot sheet" (local,
// facing-right space), and the slot is then composited into the scene through
// a shader that works on the whole silhouette at once: a rim of the night's
// ambient light along the edge that faces the key light, and a faint soft
// contact shade outside it (docs §11: no ink line round anyone). With the
// accessibility option on, enemies get a clear outline instead.
//
// A street lamp near someone also throws their shadow on the wall behind
// them: the same slot drawn as a soft dark shape, projected from the lamp
// (a copy magnified about it, so it falls away from the lamp and sinks
// below the line where the wall meets the street), cut at that line (shadow()).
//
// Slots are rendered lazily in groups, so any number of characters works.
// The slot box is wide enough for a rifle aimed straight up or down, so most
// of it is empty: each character is composited (and cast) over only the part
// its parts covered this frame, plus the reach of the shade (§10.18).
import { program, Target } from './gl.js';

const VS = `#version 300 es
uniform mat3 uView;
uniform vec4 uRect;   // world x0, y0, x1, y1 (x0 > x1 mirrors)
uniform vec4 uUV;     // slot u0, vTop, u1, vBottom
out vec2 vUV;
void main() {
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1));
  vec2 p = mix(uRect.xy, uRect.zw, c);
  gl_Position = vec4((uView * vec3(p, 1.0)).xy, 0.0, 1.0);
  vUV = mix(uUV.xy, uUV.zw, c);
}`;
const FS = `#version 300 es
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uR;        // contact shade reach in uv
uniform vec4 uClamp;    // slot uv bounds
uniform vec4 uInk;      // premultiplied shade / outline colour
uniform float uHard;    // 1: a hard outline (accessibility), 0: soft shade
uniform vec2 uL;        // toward the key light, in uv, rim width long
uniform vec3 uRim;      // rim light colour × strength
uniform vec4 uFlash;    // rgb, amount (hit flash)
uniform vec3 uWet;      // rain on them: strength, then "up" in uv (one rim width)
in vec2 vUV; out vec4 o;
vec4 tap(vec2 uv) { return texture(uTex, clamp(uv, uClamp.xy, uClamp.zw)); }
void main() {
  vec4 s = tap(vUV);
  float mx = 0.0, av = 0.0;
  for (int i = 0; i < 12; i++) {
    float t = float(i) * 0.5235988;
    vec2 d = vec2(cos(t), sin(t)) * uR;
    float a1 = tap(vUV + d).a, a2 = tap(vUV + d * 0.5).a;
    mx = max(mx, max(a1, a2));
    av += a1 * 0.35 + a2 * 0.65;
  }
  av /= 12.0;
  // the rim: inside, where the neighbour toward the light is empty
  float r1 = 1.0 - tap(vUV + uL).a, r2 = 1.0 - tap(vUV + uL * 0.45).a;
  float rim = s.a * max(r1 * 0.55, r2);
  s.rgb = mix(s.rgb, uFlash.rgb * s.a, uFlash.a);
  s.rgb += uRim * rim;
  // out in the rain every upward face is wet: a thin cool sheen along the tops of
  // the shoulders, the helmet, the arms, broken up a little as water runs
  if (uWet.x > 0.0) {
    float up = s.a * (1.0 - tap(vUV + uWet.yz).a) * (1.0 - tap(vUV + uWet.yz * 2.2).a * 0.5);
    float run = 0.6 + 0.4 * fract(sin(dot(floor(vUV * 900.0), vec2(12.9898, 78.233))) * 43758.5453);
    s.rgb += vec3(0.5, 0.58, 0.68) * up * run * uWet.x * s.a;
  }
  float a = mix(av * 0.8, mx, uHard);
  o = s + uInk * (1.0 - s.a) * a;
}`;

const SVS = `#version 300 es
uniform mat3 uView;
uniform vec4 uRect;
uniform vec4 uUV;
uniform vec3 uCast;   // lamp x, y, magnification (wall depth over lamp depth, plus one)
out vec2 vUV; out float vY;
void main() {
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1));
  vec2 p = uCast.xy + (mix(uRect.xy, uRect.zw, c) - uCast.xy) * uCast.z;
  gl_Position = vec4((uView * vec3(p, 1.0)).xy, 0.0, 1.0);
  vUV = mix(uUV.xy, uUV.zw, c); vY = p.y;
}`;
const SFS = `#version 300 es
precision mediump float;
uniform sampler2D uTex;
uniform vec4 uClamp;
uniform vec2 uR;        // penumbra reach in uv
uniform float uA;       // darkness
uniform float uGround;  // world y where the wall meets the street
in vec2 vUV; in float vY; out vec4 o;
float tap(vec2 uv) { return texture(uTex, clamp(uv, uClamp.xy, uClamp.zw)).a; }
void main() {
  if (vY > uGround) discard;
  float a = tap(vUV) * 0.2;
  for (int i = 0; i < 8; i++) { float t = float(i) * 0.7853982; a += tap(vUV + vec2(cos(t), sin(t)) * uR) * 0.1; }
  a *= uA;
  o = vec4(vec3(0.012, 0.014, 0.02) * a, a);
}`;

// Local slot box (units): wide enough for long rifles aimed up or down.
export const BOX = [-46, -98, 62, 10];

export class CharRenderer {
  constructor(gl, batch, size = 2048) {
    this.gl = gl; this.batch = batch;
    this.size = Math.min(size, gl.getParameter(gl.MAX_TEXTURE_SIZE));
    this.sheet = new Target(gl, this.size, this.size);
    this.prog = program(gl, VS, FS);
    this.sprog = program(gl, SVS, SFS);
    this.vao = gl.createVertexArray();
    this.view = new Float32Array(9);
    this.ink = [0.035, 0.027, 0.022, 0.4]; // the soft contact shade (style INK, faint)
    this.outline = 0.9;     // its reach in units
    this.rim = [0.2, 0.23, 0.27]; // the night's ambient along the lit edge
    this.rimW = 0.7;        // rim width in units
    this.light = [0.55, -0.84]; // style LIGHT
    this.enemyInk = null; // accessibility: a bright outline colour for enemies
    this.wet = 0;           // rain on the figures (scenes set it outdoors)
    this.ppu = 5; this.cols = 1; this.cap = 1;
    this.queue = []; this.done = new Map(); this.slots = [];
    this.used = new WeakMap(); // character → the local box its parts covered
  }

  // Slot resolution follows the scene's pixels per unit, capped so 9 fit.
  configure(ppu) {
    const bw = BOX[2] - BOX[0], bh = BOX[3] - BOX[1];
    this.ppu = Math.min(ppu, (this.size - 6) / 3 / Math.max(bw, bh));
    this.sw = Math.ceil(bw * this.ppu) + 2; this.sh = Math.ceil(bh * this.ppu) + 2;
    this.cols = Math.floor(this.size / this.sw); this.cap = this.cols * Math.floor(this.size / this.sh);
  }

  // Characters to draw this frame, in draw order.
  begin(list) { this.queue = list; this.done.clear(); this.slots.length = 0; this.next = 0; }

  // Render the next group of slots (up to `cap`) starting at index i.
  renderGroup(i, restore) {
    const gl = this.gl, B = this.batch;
    const S = this.sheet;
    gl.bindFramebuffer(gl.FRAMEBUFFER, S.fb);
    gl.enable(gl.SCISSOR_TEST);
    const n = Math.min(this.cap, this.queue.length - i);
    const bw = BOX[2] - BOX[0], bh = BOX[3] - BOX[1];
    for (let k = 0; k < n; k++) {
      const ch = this.queue[i + k];
      // whoever had this slot before is drawn over: they must be drawn again
      // when they are next needed, or they would show the new one's picture
      const prev = this.slots[k];
      if (prev && prev !== ch) this.done.delete(prev);
      this.slots[k] = ch;
      const cx = (k % this.cols) * this.sw, cy = Math.floor(k / this.cols) * this.sh;
      gl.viewport(cx + 1, cy + 1, this.sw - 2, this.sh - 2);
      gl.scissor(cx, cy, this.sw, this.sh);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      // local units → slot clip space
      const v = this.view, sx = 2 / bw, sy = -2 / bh;
      v[0] = sx; v[1] = 0; v[2] = 0; v[3] = 0; v[4] = sy; v[5] = 0;
      v[6] = -(BOX[0] + bw / 2) * sx; v[7] = -(BOX[1] + bh / 2) * sy; v[8] = 1;
      B.begin(v);
      let u = this.used.get(ch);
      if (!u) { u = new Float32Array(4); this.used.set(ch, u); }
      u[0] = u[1] = Infinity; u[2] = u[3] = -Infinity;
      B.bounds = u;
      ch.drawParts(B);
      B.bounds = null;
      B.end();
      const W = this.size;
      this.done.set(ch, [(cx + 1) / W, (cy + this.sh - 1) / W, (cx + this.sw - 1) / W, (cy + 1) / W]);
    }
    gl.disable(gl.SCISSOR_TEST);
    this.next = i + n;
    restore(); // back to the scene target
  }

  // The used part of ch's slot grown by m units (clipped to the slot box), as
  // a local box and the slot uv under it; false when nothing was drawn.
  quad(ch, m) {
    const u = this.used.get(ch), s = this.done.get(ch), q = this._q || (this._q = new Float32Array(8));
    const x0 = Math.max(BOX[0], u[0] - m), y0 = Math.max(BOX[1], u[1] - m);
    const x1 = Math.min(BOX[2], u[2] + m), y1 = Math.min(BOX[3], u[3] + m);
    if (!(x1 > x0 && y1 > y0)) return false;
    const bw = BOX[2] - BOX[0], bh = BOX[3] - BOX[1];
    q[0] = x0; q[1] = y0; q[2] = x1; q[3] = y1;
    q[4] = s[0] + (x0 - BOX[0]) / bw * (s[2] - s[0]); q[5] = s[1] + (y0 - BOX[1]) / bh * (s[3] - s[1]);
    q[6] = s[0] + (x1 - BOX[0]) / bw * (s[2] - s[0]); q[7] = s[1] + (y1 - BOX[1]) / bh * (s[3] - s[1]);
    return q;
  }

  // Composite character `ch` into the bound scene target. `restore` rebinds
  // the scene target after any slot rendering this call needs.
  // The shadow the lamp at (lx, ly) throws of `ch` on the wall behind, `k` the
  // magnification about the lamp, `a` its darkness.
  shadow(ch, view, restore, lx, ly, k, a) {
    if (!this.done.has(ch)) this.renderGroup(this.queue.indexOf(ch), restore);
    const uv = this.done.get(ch), reach = 1.0 + (k - 1) * 6, q = this.quad(ch, reach + 0.5);
    if (!q) return;
    const gl = this.gl, p = this.sprog, f = ch.facing, x = ch.rx, y = ch.ry, W = this.size;
    gl.useProgram(p.p);
    gl.uniformMatrix3fv(p.u.uView, false, view);
    gl.uniform4f(p.u.uRect, x + q[0] * f, y + q[1], x + q[2] * f, y + q[3]);
    gl.uniform4f(p.u.uUV, q[4], q[5], q[6], q[7]);
    gl.uniform3f(p.u.uCast, lx, ly, k);
    gl.uniform1f(p.u.uGround, y);
    gl.uniform4f(p.u.uClamp, uv[0] + 0.5 / W, uv[3] + 0.5 / W, uv[2] - 0.5 / W, uv[1] - 0.5 / W);
    const r = reach * this.ppu / W;
    gl.uniform2f(p.u.uR, r, r);
    gl.uniform1f(p.u.uA, a);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.sheet.tex); gl.uniform1i(p.u.uTex, 0);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  composite(ch, view, restore) {
    if (!this.done.has(ch)) this.renderGroup(this.queue.indexOf(ch), restore);
    const uv = this.done.get(ch), hard = ch.team === 1 && this.enemyInk;
    const q = this.quad(ch, (hard ? 0.95 : this.outline) + 0.6);
    if (!q) return;
    const gl = this.gl, p = this.prog, f = ch.facing, x = ch.rx, y = ch.ry;
    gl.useProgram(p.p);
    gl.uniformMatrix3fv(p.u.uView, false, view);
    gl.uniform4f(p.u.uRect, x + q[0] * f, y + q[1], x + q[2] * f, y + q[3]);
    gl.uniform4f(p.u.uUV, q[4], q[5], q[6], q[7]);
    const W = this.size, r = (hard ? 0.95 : this.outline) * this.ppu / W;
    gl.uniform2f(p.u.uR, r, r);
    gl.uniform1f(p.u.uHard, hard ? 1 : 0);
    const rw = this.rimW * this.ppu / W;
    gl.uniform2f(p.u.uL, this.light[0] * f * rw, -this.light[1] * rw);
    gl.uniform3f(p.u.uRim, this.rim[0], this.rim[1], this.rim[2]);
    gl.uniform3f(p.u.uWet, this.wet, 0, this.rimW * 0.8 * this.ppu / W);
    gl.uniform4f(p.u.uClamp, uv[0] + 0.5 / W, uv[3] + 0.5 / W, uv[2] - 0.5 / W, uv[1] - 0.5 / W);
    const ink = hard || this.ink;
    gl.uniform4f(p.u.uInk, ink[0], ink[1], ink[2], ink[3]);
    const fc = ch.flashCol || [1, 1, 1];
    gl.uniform4f(p.u.uFlash, fc[0], fc[1], fc[2], (ch.flash || 0) * 0.45);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.sheet.tex); gl.uniform1i(p.u.uTex, 0);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }
}
