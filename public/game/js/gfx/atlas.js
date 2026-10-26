// KOR — texture atlas.
//
// Baked sprites are packed into square pages with a skyline packer and every
// sprite becomes a Region: its page, UV rectangle, size in world units and
// anchor. The pages are the layers of GPU texture arrays (premultiplied
// alpha, mipmapped), GROUP pages to an array: the batcher switches textures
// only between groups, so a frame is a handful of draw calls whatever pages
// its sprites sit on, and no single allocation is larger than ~100 MB (a
// phone's driver may refuse one big block) (docs §10.17).
//
// Memory: a sprite is drawn into its page the moment it is placed and is not
// kept; the pages' 2D canvases live only until they are on the GPU (and in
// the bake cache), then release() lets them go.

const PAD = 4;
export const GROUP = 6; // pages per texture array

export class Region {
  constructor(name, page, x, y, w, h, size, unitW, unitH, ax, ay) {
    this.name = name; this.page = page;
    this.x = x; this.y = y; this.pw = w; this.ph = h;
    this.u0 = x / size; this.v0 = y / size; this.u1 = (x + w) / size; this.v1 = (y + h) / size;
    this.w = unitW; this.h = unitH; // world size
    this.ax = ax; this.ay = ay; // anchor, 0..1 of the sprite
  }
}

class Page {
  constructor(size) {
    this.size = size;
    this.sky = [{ x: 0, y: 0, w: size }];
    this.canvas = null; this.g = null;
  }
  // Skyline bottom-left: lowest position that fits w×h.
  fit(w, h) {
    let best = null;
    for (let i = 0; i < this.sky.length; i++) {
      const x = this.sky[i].x;
      if (x + w > this.size) break;
      let y = 0, rem = w, j = i;
      while (rem > 0 && j < this.sky.length) { y = Math.max(y, this.sky[j].y); rem -= this.sky[j].w; j++; }
      if (y + h > this.size) continue;
      if (!best || y < best.y || (y === best.y && x < best.x)) best = { x, y, i };
    }
    return best;
  }
  place(w, h) {
    const f = this.fit(w, h);
    if (!f) return null;
    const node = { x: f.x, y: f.y + h, w };
    const sky = this.sky;
    sky.splice(f.i, 0, node);
    for (let i = f.i + 1; i < sky.length; i++) {
      const prevEnd = sky[i - 1].x + sky[i - 1].w;
      if (sky[i].x < prevEnd) {
        const cut = prevEnd - sky[i].x;
        sky[i].x += cut; sky[i].w -= cut;
        if (sky[i].w <= 0) { sky.splice(i, 1); i--; } else break;
      } else break;
    }
    for (let i = 0; i < sky.length - 1; i++) if (sky[i].y === sky[i + 1].y) { sky[i].w += sky[i + 1].w; sky.splice(i + 1, 1); i--; }
    return { x: f.x, y: f.y };
  }
}

export class Atlas {
  constructor(gl, size = 2048) {
    this.gl = gl;
    this.size = Math.min(size, gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : size);
    this.pages = [];
    this.regions = new Map();
    this.texs = []; // TEXTURE_2D_ARRAYs: page p is layer p % GROUP of texs[p / GROUP | 0]
  }

  // Add a baked image (canvas/bitmap) that covers unitW×unitH world units.
  // `margin` px on the left and right are baked context only (chunk seams).
  add(name, img, unitW, unitH, ax = 0.5, ay = 1, margin = 0) {
    const w = img.width + PAD * 2, h = img.height + PAD * 2;
    if (w > this.size || h > this.size) throw new Error(`atlas: ${name} ${img.width}×${img.height} exceeds page ${this.size}`);
    let page = null, pos = null;
    for (const p of this.pages) { pos = p.place(w, h); if (pos) { page = p; break; } }
    if (!pos) { page = new Page(this.size); this.pages.push(page); pos = page.place(w, h); }
    if (!page.canvas) { page.canvas = new OffscreenCanvas(this.size, this.size); page.g = page.canvas.getContext('2d'); }
    page.g.drawImage(img, pos.x + PAD, pos.y + PAD);
    const r = new Region(name, this.pages.indexOf(page), pos.x + PAD + margin, pos.y + PAD, img.width - 2 * margin, img.height, this.size, unitW, unitH, ax, ay);
    this.regions.set(name, r);
    return r;
  }

  get(name) { return this.regions.get(name); }

  // Every page into one layer of the texture array, mipmapped.
  upload() { this.uploadAll(this.pages.map((p) => p.canvas)); }

  uploadAll(sources) {
    const gl = this.gl, S = this.size, levels = Math.floor(Math.log2(S)) + 1;
    for (const t of this.texs) gl.deleteTexture(t);
    this.texs = [];
    for (let g0 = 0; g0 < Math.max(1, sources.length); g0 += GROUP) {
      const n = Math.max(1, Math.min(GROUP, sources.length - g0)), tex = gl.createTexture();
      this.texs.push(tex);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, gl.RGBA8, S, S, n);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      for (let i = 0; i < n; i++) { const src = sources[g0 + i]; if (src) gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, S, S, 1, gl.RGBA, gl.UNSIGNED_BYTE, src); }
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
  }

  // The pages' 2D canvases are no longer needed once they are on the GPU.
  release() { for (const p of this.pages) { if (p.canvas) { p.canvas.width = 1; p.canvas.height = 1; } p.canvas = null; p.g = null; } }

  // Serialisable layout (for the bake cache).
  layout() {
    return { size: this.size, pages: this.pages.length, regions: [...this.regions.values()].map((r) => [r.name, r.page, r.x, r.y, r.pw, r.ph, r.w, r.h, r.ax, r.ay]) };
  }
  restore(layout, bitmaps) {
    this.size = layout.size;
    this.pages = bitmaps.map(() => new Page(this.size));
    for (const [name, page, x, y, pw, ph, w, h, ax, ay] of layout.regions) this.regions.set(name, new Region(name, page, x, y, pw, ph, this.size, w, h, ax, ay));
    this.uploadAll(bitmaps);
    for (const b of bitmaps) b.close?.();
  }
  memoryMB() { return (this.pages.length * this.size * this.size * 4 * 1.33) / 1048576; }
}
