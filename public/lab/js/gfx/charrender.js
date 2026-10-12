// CINDERFALL LAB — character renderer.
//
// A character is a stack of overlapping part sprites. Outlining each part
// would draw dark rings at every joint, so instead each character is first
// drawn into its own slot of an offscreen "slot sheet" (local, facing-right
// space), and the slot is then composited into the scene through an outline
// shader that dilates the union's alpha: one clean outer outline around the
// whole silhouette, exactly like the baked M0 figures — but live.
//
// Slots are rendered lazily in groups, so any number of characters works.
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
uniform vec2 uR;        // outline radius in uv
uniform vec4 uClamp;    // slot uv bounds
uniform vec4 uInk;      // premultiplied outline colour
uniform vec4 uFlash;    // rgb, amount (hit flash)
in vec2 vUV; out vec4 o;
vec4 tap(vec2 uv) { return texture(uTex, clamp(uv, uClamp.xy, uClamp.zw)); }
void main() {
  vec4 s = tap(vUV);
  float a = 0.0;
  for (int i = 0; i < 12; i++) {
    float t = float(i) * 0.5235988;
    vec2 d = vec2(cos(t), sin(t)) * uR;
    a = max(a, tap(vUV + d).a);
    a = max(a, tap(vUV + d * 0.5).a);
  }
  s.rgb = mix(s.rgb, uFlash.rgb * s.a, uFlash.a);
  o = s + uInk * (1.0 - s.a) * a;
}`;

// Local slot box (units): wide enough for long rifles aimed up or down.
export const BOX = [-46, -98, 62, 10];

export class CharRenderer {
  constructor(gl, batch, size = 2048) {
    this.gl = gl; this.batch = batch;
    this.size = Math.min(size, gl.getParameter(gl.MAX_TEXTURE_SIZE));
    this.sheet = new Target(gl, this.size, this.size);
    this.prog = program(gl, VS, FS);
    this.vao = gl.createVertexArray();
    this.view = new Float32Array(9);
    this.ink = [0.059, 0.071, 0.094, 1]; // style INK
    this.outline = 0.85;
    this.ppu = 5; this.cols = 1; this.cap = 1;
    this.queue = []; this.done = new Map();
  }

  // Slot resolution follows the scene's pixels per unit, capped so 9 fit.
  configure(ppu) {
    const bw = BOX[2] - BOX[0], bh = BOX[3] - BOX[1];
    this.ppu = Math.min(ppu, (this.size - 6) / 3 / Math.max(bw, bh));
    this.sw = Math.ceil(bw * this.ppu) + 2; this.sh = Math.ceil(bh * this.ppu) + 2;
    this.cols = Math.floor(this.size / this.sw); this.cap = this.cols * Math.floor(this.size / this.sh);
  }

  // Characters to draw this frame, in draw order.
  begin(list) { this.queue = list; this.done.clear(); this.next = 0; }

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
      const cx = (k % this.cols) * this.sw, cy = Math.floor(k / this.cols) * this.sh;
      gl.viewport(cx + 1, cy + 1, this.sw - 2, this.sh - 2);
      gl.scissor(cx, cy, this.sw, this.sh);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      // local units → slot clip space
      const v = this.view, sx = 2 / bw, sy = -2 / bh;
      v[0] = sx; v[1] = 0; v[2] = 0; v[3] = 0; v[4] = sy; v[5] = 0;
      v[6] = -(BOX[0] + bw / 2) * sx; v[7] = -(BOX[1] + bh / 2) * sy; v[8] = 1;
      B.begin(v);
      ch.drawParts(B);
      B.end();
      const W = this.size;
      this.done.set(ch, [(cx + 1) / W, (cy + this.sh - 1) / W, (cx + this.sw - 1) / W, (cy + 1) / W]);
    }
    gl.disable(gl.SCISSOR_TEST);
    this.next = i + n;
    restore(); // back to the scene target
  }

  // Composite character `ch` into the bound scene target. `restore` rebinds
  // the scene target after any slot rendering this call needs.
  composite(ch, view, restore) {
    if (!this.done.has(ch)) this.renderGroup(this.queue.indexOf(ch), restore);
    const uv = this.done.get(ch);
    const gl = this.gl, p = this.prog, f = ch.facing, x = ch.rx, y = ch.ry;
    gl.useProgram(p.p);
    gl.uniformMatrix3fv(p.u.uView, false, view);
    gl.uniform4f(p.u.uRect, x + BOX[0] * f, y + BOX[1], x + BOX[2] * f, y + BOX[3]);
    gl.uniform4f(p.u.uUV, uv[0], uv[1], uv[2], uv[3]);
    const W = this.size, r = this.outline * this.ppu / W;
    gl.uniform2f(p.u.uR, r, r);
    gl.uniform4f(p.u.uClamp, uv[0] + 0.5 / W, uv[3] + 0.5 / W, uv[2] - 0.5 / W, uv[1] - 0.5 / W);
    gl.uniform4f(p.u.uInk, this.ink[0], this.ink[1], this.ink[2], this.ink[3]);
    gl.uniform4f(p.u.uFlash, 1, 1, 1, ch.flash || 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.sheet.tex); gl.uniform1i(p.u.uTex, 0);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }
}
