// KOR LAB — frame pipeline.
//
//   scene  (render scale)  world sprites, opaque background first
//   light  (light scale)   ambient + additive point/cone lights, stored at ½
//   lit    (render scale)  scene × light×2, then emissive sprites added on top
//   bloom  (½ and ¼)       bright pass → separable blur, two levels
//   screen                 lit + bloom, vignette, grade, dither; upscaled
//
// All targets are RGBA8. Resizing a target never touches the DOM.
import { program, Target, FS_TRI } from './gl.js';

const LIGHT_VS = `#version 300 es
layout(location=0) in vec4 aL0;   // x, y, radius, intensity
layout(location=1) in vec4 aL1;   // r, g, b, cone cos (−1 = omni)
layout(location=2) in vec2 aL2;   // direction angle, cone softness
uniform mat3 uView;
out vec2 vLocal; out vec3 vCol; out vec3 vCone;
void main() {
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec2 p = aL0.xy + c * aL0.z;
  gl_Position = vec4((uView * vec3(p, 1.0)).xy, 0.0, 1.0);
  vLocal = c;
  vCol = aL1.rgb * aL0.w * 0.5;
  vCone = vec3(aL2.x, aL1.a, aL2.y);
}`;
const LIGHT_FS = `#version 300 es
precision mediump float;
in vec2 vLocal; in vec3 vCol; in vec3 vCone;
out vec4 o;
void main() {
  float d = length(vLocal);
  float a = clamp(1.0 - d, 0.0, 1.0);
  a *= a;
  if (vCone.y > -1.0) {
    vec2 dir = vec2(cos(vCone.x), sin(vCone.x));
    float k = dot(normalize(vLocal + 1e-5), dir);
    a *= smoothstep(vCone.y, vCone.y + vCone.z, k);
  }
  o = vec4(vCol * a, 0.0);
}`;

const COMPOSE_FS = `#version 300 es
precision mediump float;
uniform sampler2D uScene, uLight;
in vec2 vUV; out vec4 o;
void main() {
  vec4 s = texture(uScene, vUV);
  vec3 l = texture(uLight, vUV).rgb * 2.0;
  o = vec4(s.rgb * l, 1.0);
}`;

const BRIGHT_FS = `#version 300 es
precision mediump float;
uniform sampler2D uTex; uniform vec2 uTexel; uniform float uThresh;
in vec2 vUV; out vec4 o;
void main() {
  // 4-tap box downsample, then a soft-knee threshold on luminance
  vec3 c = texture(uTex, vUV + uTexel * vec2(-0.5, -0.5)).rgb + texture(uTex, vUV + uTexel * vec2(0.5, -0.5)).rgb
         + texture(uTex, vUV + uTexel * vec2(-0.5, 0.5)).rgb + texture(uTex, vUV + uTexel * vec2(0.5, 0.5)).rgb;
  c *= 0.25;
  float l = max(c.r, max(c.g, c.b));
  float k = clamp((l - uThresh) / (1.0 - uThresh + 1e-4), 0.0, 1.0);
  o = vec4(c * k * k, 1.0);
}`;

const BLUR_FS = `#version 300 es
precision mediump float;
uniform sampler2D uTex; uniform vec2 uDir;
in vec2 vUV; out vec4 o;
void main() {
  // 9-tap Gaussian via 5 linear-filtered fetches
  vec3 c = texture(uTex, vUV).rgb * 0.2270270270;
  c += texture(uTex, vUV + uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture(uTex, vUV - uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture(uTex, vUV + uDir * 3.2307692308).rgb * 0.0702702703;
  c += texture(uTex, vUV - uDir * 3.2307692308).rgb * 0.0702702703;
  o = vec4(c, 1.0);
}`;

const FINAL_FS = `#version 300 es
precision mediump float;
uniform sampler2D uLit, uB1, uB2;
uniform vec3 uBloom;      // level 1 gain, level 2 gain, enabled
uniform vec4 uGrade;      // saturation, contrast, vignette, grain
uniform vec3 uTint;       // shadow tint
uniform float uTime;
in vec2 vUV; out vec4 o;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 c = texture(uLit, vUV).rgb;
  if (uBloom.z > 0.0) c += texture(uB1, vUV).rgb * uBloom.x + texture(uB2, vUV).rgb * uBloom.y;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uGrade.x);
  c = (c - 0.5) * uGrade.y + 0.5;
  c += uTint * (1.0 - smoothstep(0.0, 0.5, l));
  vec2 q = vUV - 0.5;
  c *= 1.0 - uGrade.z * smoothstep(0.25, 0.75, dot(q, q) * 2.2);
  c += (hash(vUV * 997.0 + uTime) - 0.5) * uGrade.w;
  o = vec4(c, 1.0);
}`;

export const QUALITY = {
  low: { scale: 0.7, light: 0.33, bloom: 0, particles: 1024, dpr: 1.5 },
  med: { scale: 0.85, light: 0.5, bloom: 1, particles: 2048, dpr: 2 },
  high: { scale: 1.0, light: 0.5, bloom: 2, particles: 4096, dpr: 2.5 },
};
// dynamic resolution never goes below 80 %: the picture stays sharp, the
// frame rate is held by the steps above it
export const RES_STEPS = [1.0, 0.92, 0.85, 0.8];

export class Renderer {
  constructor(gl, canvas) {
    this.gl = gl; this.canvas = canvas;
    this.q = QUALITY.med; this.dyn = 1; // dynamic resolution multiplier
    this.ambient = [0.72, 0.74, 0.86];
    this.grade = { sat: 1.06, con: 1.04, vig: 0.42, grain: 0.012, tint: [0.0, 0.006, 0.02] };
    this.bloomOn = true; this.lightsOn = true;
    this.scene = new Target(gl, 2, 2); this.light = new Target(gl, 2, 2); this.lit = new Target(gl, 2, 2);
    this.b1a = new Target(gl, 2, 2); this.b1b = new Target(gl, 2, 2); this.b2a = new Target(gl, 2, 2); this.b2b = new Target(gl, 2, 2);
    this.pLight = program(gl, LIGHT_VS, LIGHT_FS);
    this.pCompose = program(gl, FS_TRI, COMPOSE_FS);
    this.pBright = program(gl, FS_TRI, BRIGHT_FS);
    this.pBlur = program(gl, FS_TRI, BLUR_FS);
    this.pFinal = program(gl, FS_TRI, FINAL_FS);
    this.emptyVAO = gl.createVertexArray();
    // light instances
    this.LCAP = 256; this.lf = new Float32Array(this.LCAP * 10); this.ln = 0;
    this.lvao = gl.createVertexArray(); this.lvbo = gl.createBuffer();
    gl.bindVertexArray(this.lvao); gl.bindBuffer(gl.ARRAY_BUFFER, this.lvbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.lf.byteLength, gl.DYNAMIC_DRAW);
    const at = (loc, n, off) => { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 40, off); gl.vertexAttribDivisor(loc, 1); };
    at(0, 4, 0); at(1, 4, 16); at(2, 2, 32);
    gl.bindVertexArray(null);
    this.passes = 0; this.lastLights = 0;
    this.time = 0;
  }

  setQuality(name) { this.q = QUALITY[name]; this.qName = name; this.resize(true); }
  setDyn(m) { if (m !== this.dyn) { this.dyn = m; this.resize(true); } }

  // Canvas backing store follows CSS size × DPR (capped); targets follow it.
  resize(force = false) {
    const c = this.canvas, dpr = Math.min(window.devicePixelRatio || 1, this.q.dpr, this.dprCap || 9);
    const W = Math.round(c.clientWidth * dpr), H = Math.round(c.clientHeight * dpr);
    if (!force && W === c.width && H === c.height) return;
    c.width = W; c.height = H;
    const s = this.q.scale * this.dyn;
    this.rw = Math.round(W * s); this.rh = Math.round(H * s);
    this.scene.resize(this.rw, this.rh); this.lit.resize(this.rw, this.rh);
    this.light.resize(W * this.q.light * this.dyn, H * this.q.light * this.dyn);
    this.b1a.resize(this.rw / 2, this.rh / 2); this.b1b.resize(this.rw / 2, this.rh / 2);
    this.b2a.resize(this.rw / 4, this.rh / 4); this.b2b.resize(this.rw / 4, this.rh / 4);
  }

  // --- lights ---------------------------------------------------------------
  // color as [r,g,b] 0..1; cone: dir angle (rad), half-angle cos, softness
  addLight(x, y, radius, intensity, color, dir = 0, coneCos = -2, soft = 0.15) {
    if (this.ln >= this.LCAP) return;
    const i = this.ln * 10, f = this.lf;
    f[i] = x; f[i + 1] = y; f[i + 2] = radius; f[i + 3] = intensity;
    f[i + 4] = color[0]; f[i + 5] = color[1]; f[i + 6] = color[2]; f[i + 7] = coneCos;
    f[i + 8] = dir; f[i + 9] = soft;
    this.ln++;
  }

  // --- passes -----------------------------------------------------------------
  beginScene() { this.passes = 0; this.scene.bind(); const gl = this.gl; gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); }

  lightPass(view) {
    const gl = this.gl;
    this.light.bind();
    const a = this.lightsOn ? this.ambient : [1, 1, 1];
    gl.clearColor(a[0] * 0.5, a[1] * 0.5, a[2] * 0.5, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    if (this.lightsOn && this.ln) {
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(this.pLight.p);
      gl.uniformMatrix3fv(this.pLight.u.uView, false, view);
      gl.bindVertexArray(this.lvao); gl.bindBuffer(gl.ARRAY_BUFFER, this.lvbo);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.lf, 0, this.ln * 10);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.ln);
      gl.bindVertexArray(null);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      this.passes++;
    }
    this.lastLights = this.ln;
    this.ln = 0;
  }

  fsPass(prog, target, tex, setU) {
    const gl = this.gl;
    if (target) target.bind(); else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, this.canvas.width, this.canvas.height); }
    gl.useProgram(prog.p);
    tex.forEach((t, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); });
    if (setU) setU(prog.u);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(this.emptyVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.BLEND);
    this.passes++;
  }

  // scene × light → lit; leaves `lit` bound for emissive drawing
  compose() {
    const gl = this.gl;
    this.fsPass(this.pCompose, this.lit, [this.scene.tex, this.light.tex], (u) => { gl.uniform1i(u.uScene, 0); gl.uniform1i(u.uLight, 1); });
  }

  finish(time) {
    const gl = this.gl, lv = this.bloomOn ? this.q.bloom : 0;
    if (lv > 0) {
      this.fsPass(this.pBright, this.b1a, [this.lit.tex], (u) => { gl.uniform1i(u.uTex, 0); gl.uniform2f(u.uTexel, 1 / this.lit.w, 1 / this.lit.h); gl.uniform1f(u.uThresh, 0.62); });
      this.blur(this.b1a, this.b1b);
      if (lv > 1) {
        this.fsPass(this.pBright, this.b2a, [this.b1a.tex], (u) => { gl.uniform1i(u.uTex, 0); gl.uniform2f(u.uTexel, 1 / this.b1a.w, 1 / this.b1a.h); gl.uniform1f(u.uThresh, 0.0); });
        this.blur(this.b2a, this.b2b);
      }
    }
    const G = this.grade;
    this.fsPass(this.pFinal, null, [this.lit.tex, this.b1a.tex, this.b2a.tex], (u) => {
      gl.uniform1i(u.uLit, 0); gl.uniform1i(u.uB1, 1); gl.uniform1i(u.uB2, 2);
      gl.uniform3f(u.uBloom, 0.9, lv > 1 ? 0.7 : 0, lv > 0 ? 1 : 0);
      gl.uniform4f(u.uGrade, G.sat, G.con, G.vig, G.grain);
      gl.uniform3f(u.uTint, G.tint[0], G.tint[1], G.tint[2]);
      gl.uniform1f(u.uTime, time % 100);
    });
  }

  blur(a, b) {
    const gl = this.gl;
    this.fsPass(this.pBlur, b, [a.tex], (u) => { gl.uniform1i(u.uTex, 0); gl.uniform2f(u.uDir, 1 / a.w, 0); });
    this.fsPass(this.pBlur, a, [b.tex], (u) => { gl.uniform1i(u.uTex, 0); gl.uniform2f(u.uDir, 0, 1 / a.h); });
  }
}
