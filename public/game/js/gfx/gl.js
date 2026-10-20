// KOR — WebGL2 helpers: context, programs, render targets.

export function createGL(canvas) {
  const gl = canvas.getContext('webgl2', {
    alpha: false, antialias: false, depth: false, stencil: false,
    premultipliedAlpha: true, preserveDrawingBuffer: false,
    powerPreference: 'high-performance', desynchronized: true,
  });
  if (!gl) return null;
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied alpha everywhere
  return gl;
}

function shader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error('shader: ' + log + '\n' + src.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n'));
  }
  return s;
}

// Program with every active uniform's location collected into `u`.
export function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, shader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, shader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name);
  }
  return { p, u };
}

export function texture(gl, w, h, { filter = gl.LINEAR, wrap = gl.CLAMP_TO_EDGE, data = null } = {}) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter === gl.LINEAR_MIPMAP_LINEAR ? gl.LINEAR : filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  return t;
}

// Offscreen render target (colour only).
export class Target {
  constructor(gl, w, h) { this.gl = gl; this.fb = gl.createFramebuffer(); this.tex = null; this.resize(w, h); }
  resize(w, h) {
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    if (w === this.w && h === this.h) return;
    const gl = this.gl;
    if (this.tex) gl.deleteTexture(this.tex);
    this.w = w; this.h = h;
    this.tex = texture(gl, w, h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  bind() { const gl = this.gl; gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb); gl.viewport(0, 0, this.w, this.h); }
}

// Fullscreen triangle vertex shader shared by post passes.
export const FS_TRI = `#version 300 es
out vec2 vUV;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUV = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
