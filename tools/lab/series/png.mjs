// KOR — a small PNG reader and writer (8-bit RGB/RGBA, not interlaced), so
// the series tools need nothing outside node.
import zlib from 'node:zlib';

const T = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (b) => { let c = -1; for (const x of b) c = T[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };

export function encodePNG(px, W, H) {
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; Buffer.from(px.buffer, px.byteOffset + y * W * 4, W * 4).copy(raw, y * (W * 4 + 1) + 1); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// → { w, h, data: Uint8Array RGBA }
export function decodePNG(buf) {
  let p = 8, W = 0, H = 0, type = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), t = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (t === 'IHDR') { W = d.readUInt32BE(0); H = d.readUInt32BE(4); if (d[8] !== 8 || d[12] !== 0) throw new Error('png: 8-bit, not interlaced only'); type = d[9]; }
    else if (t === 'IDAT') idat.push(d);
    else if (t === 'IEND') break;
    p += 12 + len;
  }
  const bpp = type === 6 ? 4 : type === 2 ? 3 : type === 0 ? 1 : type === 4 ? 2 : 0;
  if (!bpp) throw new Error('png: colour type ' + type);
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = W * bpp, out = new Uint8Array(W * H * 4), cur = new Uint8Array(stride), prev = new Uint8Array(stride);
  for (let y = 0; y < H; y++) {
    const f = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v = row[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[x] = v & 255;
    }
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4, i = x * bpp;
      if (bpp >= 3) { out[o] = cur[i]; out[o + 1] = cur[i + 1]; out[o + 2] = cur[i + 2]; out[o + 3] = bpp === 4 ? cur[i + 3] : 255; }
      else { out[o] = out[o + 1] = out[o + 2] = cur[i]; out[o + 3] = bpp === 2 ? cur[i + 1] : 255; }
    }
    prev.set(cur);
  }
  return { w: W, h: H, data: out };
}

// sRGB bytes → linear floats (the tracer's textures)
export function toLinear(img) {
  const n = img.w * img.h, d = new Float32Array(n * 4), L = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const c = i / 255; L[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
  for (let i = 0; i < n; i++) { d[i * 4] = L[img.data[i * 4]]; d[i * 4 + 1] = L[img.data[i * 4 + 1]]; d[i * 4 + 2] = L[img.data[i * 4 + 2]]; d[i * 4 + 3] = img.data[i * 4 + 3] / 255; }
  return { w: img.w, h: img.h, data: d };
}
