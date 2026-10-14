// KOR LAB — GPU particles.
//
// Each particle is written once, at birth, into a ring buffer: start
// position and velocity, birth time, life, size and colour ramps, gravity,
// drag and spin. The vertex shader computes where it is now analytically
// (exponential drag, constant gravity), so the CPU never touches a live
// particle again: no per-frame update loop, no per-frame upload beyond the
// handful of new births.
import { program } from './gl.js';

const VS = `#version 300 es
layout(location=0) in vec4 aPV;   // x0, y0, vx, vy
layout(location=1) in vec4 aTL;   // birth, life, size0, size1
layout(location=2) in vec4 aGD;   // gravity, drag, rot0, spin
layout(location=3) in vec4 aC0;
layout(location=4) in vec4 aC1;
uniform mat3 uView; uniform float uTime; uniform vec4 uUV; uniform float uStreak;
out vec2 vUV; out vec4 vCol;
void main() {
  float age = uTime - aTL.x, k = age / aTL.y;
  if (age < 0.0 || k >= 1.0) { gl_Position = vec4(2.0, 2.0, 0.0, 1.0); return; }
  float d = aGD.y, e = exp(-d * age);
  float travel = d > 0.0 ? (1.0 - e) / d : age;
  vec2 pos = aPV.xy + aPV.zw * travel + vec2(0.0, 0.5 * aGD.x * age * age);
  vec2 vel = aPV.zw * e + vec2(0.0, aGD.x * age);
  float size = mix(aTL.z, aTL.w, k);
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) - 0.5;
  vec2 p;
  if (uStreak > 0.0) {
    float sp = length(vel);
    vec2 dir = sp > 1e-3 ? vel / sp : vec2(1.0, 0.0);
    p = dir * c.x * (size + sp * uStreak) + vec2(-dir.y, dir.x) * c.y * size * 0.4;
  } else {
    float r = aGD.z + aGD.w * age, s = sin(r), co = cos(r);
    p = vec2(c.x * co - c.y * s, c.x * s + c.y * co) * size;
  }
  gl_Position = vec4((uView * vec3(pos + p, 1.0)).xy, 0.0, 1.0);
  vUV = mix(uUV.xy, uUV.zw, c + 0.5);
  vCol = mix(aC0, aC1, k);
  vCol.rgb *= vCol.a;
}`;
const FS = `#version 300 es
precision mediump float;
uniform sampler2D uTex;
in vec2 vUV; in vec4 vCol; out vec4 o;
void main() { o = texture(uTex, vUV) * vCol; }`;

const F = 14, B = F * 4;
let shared = null;

export class ParticleSystem {
  // region: atlas sprite; additive: blend; streak: >0 stretches along velocity
  constructor(gl, atlas, region, capacity, { additive = true, streak = 0 } = {}) {
    this.gl = gl; this.atlas = atlas; this.r = region; this.cap = capacity;
    this.additive = additive; this.streak = streak;
    if (!shared) shared = program(gl, VS, FS);
    this.prog = shared;
    this.buf = new ArrayBuffer(capacity * B);
    this.f = new Float32Array(this.buf); this.u = new Uint32Array(this.buf);
    // everything starts dead
    for (let i = 0; i < capacity; i++) { this.f[i * F + 4] = -1e9; this.f[i * F + 5] = 1; }
    this.head = 0; this.lo = capacity; this.hi = -1; this.dirtyAll = true;
    this.epoch = 0; // the shader's time is (sim time − epoch) to keep float32 precise
    this.vao = gl.createVertexArray(); this.vbo = gl.createBuffer();
    gl.bindVertexArray(this.vao); gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.buf.byteLength, gl.DYNAMIC_DRAW);
    const at = (loc, n, type, norm, off) => { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, n, type, norm, B, off); gl.vertexAttribDivisor(loc, 1); };
    at(0, 4, gl.FLOAT, false, 0); at(1, 4, gl.FLOAT, false, 16); at(2, 4, gl.FLOAT, false, 32);
    at(3, 4, gl.UNSIGNED_BYTE, true, 48); at(4, 4, gl.UNSIGNED_BYTE, true, 52);
    gl.bindVertexArray(null);
    this.alive = 0; this.lastBirth = -1e9; this.maxLife = 0;
  }

  // c0/c1: 0xAABBGGRR, not premultiplied (the shader does it per frame)
  emit(t, x, y, vx, vy, life, s0, s1, c0, c1, grav = 0, drag = 0, rot = 0, spin = 0) {
    const i = this.head, o = i * F, f = this.f;
    f[o] = x; f[o + 1] = y; f[o + 2] = vx; f[o + 3] = vy;
    f[o + 4] = t - this.epoch; f[o + 5] = life; f[o + 6] = s0; f[o + 7] = s1;
    f[o + 8] = grav; f[o + 9] = drag; f[o + 10] = rot; f[o + 11] = spin;
    this.u[o + 12] = c0; this.u[o + 13] = c1;
    if (i < this.lo) this.lo = i;
    if (i > this.hi) this.hi = i;
    this.head = (i + 1) % this.cap;
    this.lastBirth = t; if (life > this.maxLife) this.maxLife = life;
  }

  draw(view, t) {
    const gl = this.gl;
    if (t - this.lastBirth > this.maxLife) return; // nothing alive
    gl.bindVertexArray(this.vao); gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    if (this.dirtyAll) { gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.f); this.dirtyAll = false; }
    else if (this.hi >= this.lo) gl.bufferSubData(gl.ARRAY_BUFFER, this.lo * B, this.f, this.lo * F, (this.hi - this.lo + 1) * F);
    this.lo = this.cap; this.hi = -1;
    const p = this.prog;
    gl.useProgram(p.p);
    gl.uniformMatrix3fv(p.u.uView, false, view);
    gl.uniform1f(p.u.uTime, t - this.epoch);
    gl.uniform4f(p.u.uUV, this.r.u0, this.r.v0, this.r.u1, this.r.v1);
    gl.uniform1f(p.u.uStreak, this.streak);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.atlas.pages[this.r.page].tex);
    gl.uniform1i(p.u.uTex, 0);
    if (this.additive) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.cap);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(null);
    return 1;
  }
}

// '#rrggbb' + alpha → 0xAABBGGRR (straight alpha)
export function col(hex, a = 1) {
  const n = parseInt(hex.slice(1), 16);
  return ((Math.round(a * 255) << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | ((n >> 16) & 255)) >>> 0;
}
