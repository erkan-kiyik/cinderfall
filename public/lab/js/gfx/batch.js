// CINDERFALL LAB — instanced sprite batcher.
//
// Every sprite is one instance of a 4-vertex strip: 48 bytes of per-instance
// data (position, size, anchor, rotation, UV rect, tint). The batch flushes
// only when the atlas page or blend mode changes, so a whole layer usually
// costs one draw call. No allocation happens while drawing.
import { program } from './gl.js';

const VS = `#version 300 es
layout(location=0) in vec4 aRect;   // x, y, w, h (world; negative w flips)
layout(location=1) in vec3 aAR;     // anchor x, anchor y, rotation
layout(location=2) in vec4 aUV;     // u0, v0, u1, v1
layout(location=3) in vec4 aTint;   // premultiplied rgba
uniform mat3 uView;
out vec2 vUV;
out vec4 vTint;
void main() {
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1));
  vec2 p = (c - aAR.xy) * aRect.zw;
  float s = sin(aAR.z), k = cos(aAR.z);
  p = vec2(p.x * k - p.y * s, p.x * s + p.y * k) + aRect.xy;
  gl_Position = vec4((uView * vec3(p, 1.0)).xy, 0.0, 1.0);
  vUV = mix(aUV.xy, aUV.zw, c);
  vTint = aTint;
}`;

const FS = `#version 300 es
precision mediump float;
uniform sampler2D uTex;
in vec2 vUV;
in vec4 vTint;
out vec4 o;
void main() { o = texture(uTex, vUV) * vTint; }`;

const FLOATS = 12, BYTES = FLOATS * 4;

export class SpriteBatch {
  constructor(gl, atlas, capacity = 16384) {
    this.gl = gl; this.atlas = atlas; this.cap = capacity;
    this.prog = program(gl, VS, FS);
    this.buf = new ArrayBuffer(capacity * BYTES);
    this.f = new Float32Array(this.buf);
    this.u = new Uint32Array(this.buf);
    this.n = 0; this.page = -1; this.blend = 0;
    this.drawCalls = 0; this.sprites = 0;
    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.buf.byteLength, gl.DYNAMIC_DRAW);
    const attr = (loc, n, type, norm, off) => {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, n, type, norm, BYTES, off);
      gl.vertexAttribDivisor(loc, 1);
    };
    attr(0, 4, gl.FLOAT, false, 0);
    attr(1, 3, gl.FLOAT, false, 16);
    attr(2, 4, gl.FLOAT, false, 28);
    attr(3, 4, gl.UNSIGNED_BYTE, true, 44);
    gl.bindVertexArray(null);
    this.view = new Float32Array(9);
  }

  begin(view) {
    this.view.set(view);
    this.n = 0; this.page = -1; this.blend = 0;
  }

  // Additive (1) or normal premultiplied (0).
  setBlend(mode) {
    if (mode === this.blend) return;
    this.flush(); this.blend = mode;
  }

  // Draw region r with its anchor at (x, y). sx/sy scale (negative flips),
  // rot in radians, tint as 0xAABBGGRR premultiplied by the caller or by alpha.
  draw(r, x, y, sx = 1, sy = 1, rot = 0, rgba = 0xffffffff, alpha = 1) {
    if (r.page !== this.page) { this.flush(); this.page = r.page; }
    if (this.n === this.cap) this.flush();
    const i = this.n * FLOATS, f = this.f;
    f[i] = x; f[i + 1] = y; f[i + 2] = r.w * sx; f[i + 3] = r.h * sy;
    f[i + 4] = r.ax; f[i + 5] = r.ay; f[i + 6] = rot;
    f[i + 7] = r.u0; f[i + 8] = r.v0; f[i + 9] = r.u1; f[i + 10] = r.v1;
    this.u[i + 11] = alpha === 1 ? rgba : premul(rgba, alpha);
    this.n++;
  }

  // Stretched quad from region r between two points (tracers, beams).
  line(r, x0, y0, x1, y1, width, rgba = 0xffffffff, alpha = 1) {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    if (len < 1e-4) return;
    const sx = len / r.w, sy = width / r.h;
    const ax = r.ax, ay = r.ay; r.ax = 0; r.ay = 0.5;
    this.draw(r, x0, y0, sx, sy, Math.atan2(dy, dx), rgba, alpha);
    r.ax = ax; r.ay = ay;
  }

  flush() {
    if (!this.n) return;
    const gl = this.gl;
    gl.useProgram(this.prog.p);
    gl.uniformMatrix3fv(this.prog.u.uView, false, this.view);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlas.pages[this.page].tex);
    gl.uniform1i(this.prog.u.uTex, 0);
    if (this.blend) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.f, 0, this.n * FLOATS);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.n);
    gl.bindVertexArray(null);
    this.drawCalls++; this.sprites += this.n;
    this.n = 0;
  }

  end() { this.flush(); this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA); }
  resetStats() { this.drawCalls = 0; this.sprites = 0; }
}

// 0xAABBGGRR with every channel multiplied by alpha.
export function premul(c, a) {
  const r = (c & 255) * a, g = ((c >>> 8) & 255) * a, b = ((c >>> 16) & 255) * a, al = ((c >>> 24) & 255) * a;
  return ((al & 255) << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0;
}

// '#rrggbb' + alpha → premultiplied 0xAABBGGRR.
export function rgba(hex, a = 1) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) * a, g = ((n >> 8) & 255) * a, b = (n & 255) * a;
  return ((Math.round(a * 255) & 255) << 24 | (Math.round(b) & 255) << 16 | (Math.round(g) & 255) << 8 | (Math.round(r) & 255)) >>> 0;
}
