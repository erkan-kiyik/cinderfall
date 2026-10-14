// KOR LAB — texture atlas.
//
// Baked sprites are packed into square pages with a skyline packer, each
// page is one GPU texture (premultiplied alpha, mipmapped), and every sprite
// becomes a Region: its page, UV rectangle, size in world units and anchor.
// One page = one draw call for everything on it.

const PAD = 4;

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
    this.canvas = null;
    this.tex = null;
    this.items = [];
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
  }

  // Add a baked image (canvas/bitmap) that covers unitW×unitH world units.
  // `margin` px on the left and right are baked context only (chunk seams).
  add(name, img, unitW, unitH, ax = 0.5, ay = 1, margin = 0) {
    const w = img.width + PAD * 2, h = img.height + PAD * 2;
    if (w > this.size || h > this.size) throw new Error(`atlas: ${name} ${img.width}×${img.height} exceeds page ${this.size}`);
    let page = null, pos = null;
    for (const p of this.pages) { pos = p.place(w, h); if (pos) { page = p; break; } }
    if (!pos) { page = new Page(this.size); this.pages.push(page); pos = page.place(w, h); }
    page.items.push({ img, x: pos.x + PAD, y: pos.y + PAD });
    const r = new Region(name, this.pages.indexOf(page), pos.x + PAD + margin, pos.y + PAD, img.width - 2 * margin, img.height, this.size, unitW, unitH, ax, ay);
    this.regions.set(name, r);
    return r;
  }

  get(name) { return this.regions.get(name); }

  // Compose each page on a 2D canvas and upload it as a mipmapped texture.
  upload() {
    const gl = this.gl;
    for (const p of this.pages) {
      if (!p.canvas) {
        p.canvas = new OffscreenCanvas(this.size, this.size);
        const g = p.canvas.getContext('2d');
        for (const it of p.items) g.drawImage(it.img, it.x, it.y);
      }
      this.uploadPage(p, p.canvas);
    }
  }

  uploadPage(p, src) {
    const gl = this.gl;
    if (!p.tex) p.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, p.tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  // Serialisable layout (for the bake cache).
  layout() {
    return { size: this.size, pages: this.pages.length, regions: [...this.regions.values()].map((r) => [r.name, r.page, r.x, r.y, r.pw, r.ph, r.w, r.h, r.ax, r.ay]) };
  }
  restore(layout, bitmaps) {
    this.size = layout.size;
    this.pages = bitmaps.map(() => new Page(this.size));
    for (const [name, page, x, y, pw, ph, w, h, ax, ay] of layout.regions) this.regions.set(name, new Region(name, page, x, y, pw, ph, this.size, w, h, ax, ay));
    bitmaps.forEach((b, i) => this.uploadPage(this.pages[i], b));
  }
  memoryMB() { return (this.pages.length * this.size * this.size * 4 * 1.33) / 1048576; }
}
