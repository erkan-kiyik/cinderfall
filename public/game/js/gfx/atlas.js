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
    this.sealed = false; // no more sprites go on it (it is on the GPU)
    this.phantom = false; // a gap that keeps the next stage on a texture group of its own
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
    for (const p of this.pages) { if (p.sealed) continue; pos = p.place(w, h); if (pos) { page = p; break; } }
    if (!pos) { page = new Page(this.size); this.pages.push(page); pos = page.place(w, h); }
    if (!page.canvas) { page.canvas = new OffscreenCanvas(this.size, this.size); page.g = page.canvas.getContext('2d', { willReadFrequently: true }); }
    page.g.drawImage(img, pos.x + PAD, pos.y + PAD);
    const r = new Region(name, this.pages.indexOf(page), pos.x + PAD + margin, pos.y + PAD, img.width - 2 * margin, img.height, this.size, unitW, unitH, ax, ay);
    this.regions.set(name, r);
    return r;
  }

  get(name) { return this.regions.get(name); }

  // A 2D canvas queues its drawing until something reads it; reading a pixel
  // makes the page draw what it has now, so the cost is spread sprite by
  // sprite instead of landing in one long frame at the upload (docs §10.28).
  settle(i) { const p = this.pages[i]; try { p?.g?.getImageData(0, 0, 1, 1); } catch { /* not needed to work */ } }

  // Every page into one layer of the texture array, mipmapped.
  upload() { this.uploadAll(this.pages.map((p) => p.canvas)); }

  // sources[p] for page p (null: a gap). A group's array has as many layers as
  // its last real page needs, so the gaps cost no memory.
  uploadAll(sources) {
    for (const t of this.texs) if (t) this.gl.deleteTexture(t);
    this.texs = [];
    for (let g0 = 0; g0 < Math.max(1, sources.length); g0 += GROUP) {
      let n = 0;
      for (let i = 0; i < GROUP && g0 + i < sources.length; i++) if (sources[g0 + i]) n = i + 1;
      const tex = this.groupTex(Math.max(1, n));
      for (let i = 0; i < n; i++) if (sources[g0 + i]) this.layer(tex, i, sources[g0 + i]);
      this.finish(tex);
      this.texs.push(tex);
    }
  }
  groupTex(n) {
    const gl = this.gl, S = this.size, tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, Math.floor(Math.log2(S)) + 1, gl.RGBA8, S, S, n);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
    return tex;
  }
  layer(tex, i, src) {
    const gl = this.gl, S = this.size;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, S, S, 1, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
  }
  finish(tex) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
  }

  // Close the pages so far: nothing more goes on them. The next sprites start
  // on a new texture group (gap pages fill the current one), so the groups
  // already on the GPU are never uploaded again. Returns where the new pages start.
  seal() {
    for (const p of this.pages) p.sealed = true;
    while (this.pages.length % GROUP) { const p = new Page(this.size); p.sealed = p.phantom = true; this.pages.push(p); }
    return this.pages.length;
  }
  // The pages from `from` on (a later bake stage), one layer per frame so the
  // game keeps running; each group is used only once it is complete.
  async uploadLate(from, frame) {
    for (let g0 = from; g0 < this.pages.length; g0 += GROUP) {
      const pages = this.pages.slice(g0, g0 + GROUP), tex = this.groupTex(pages.length);
      for (let i = 0; i < pages.length; i++) { if (pages[i].canvas) this.layer(tex, i, pages[i].canvas); await frame(); }
      this.finish(tex);
      this.texs[g0 / GROUP] = tex;
    }
  }

  // The pages' 2D canvases are no longer needed once they are on the GPU.
  release(from = 0, to = this.pages.length) {
    for (const p of this.pages.slice(from, to)) { if (p.canvas) { p.canvas.width = 1; p.canvas.height = 1; } p.canvas = null; p.g = null; }
  }

  // Serialisable layout (for the bake cache).
  layout() {
    return { size: this.size, pages: this.pages.length, regions: [...this.regions.values()].map((r) => [r.name, r.page, r.x, r.y, r.pw, r.ph, r.w, r.h, r.ax, r.ay]) };
  }
  restore(layout, bitmaps) {
    this.size = layout.size;
    this.pages = bitmaps.map((b) => { const p = new Page(this.size); if (!b) p.sealed = p.phantom = true; return p; });
    for (const [name, page, x, y, pw, ph, w, h, ax, ay] of layout.regions) this.regions.set(name, new Region(name, page, x, y, pw, ph, this.size, w, h, ax, ay));
    this.uploadAll(bitmaps);
    for (const b of bitmaps) b?.close?.();
  }
  memoryMB() { return (this.pages.filter((p) => !p.phantom).length * this.size * this.size * 4 * 1.33) / 1048576; }
}
