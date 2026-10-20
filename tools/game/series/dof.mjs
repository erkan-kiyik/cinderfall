// KOR — a lens for the series: depth of field from the traced depth. Each
// pixel's circle of confusion from the thin-lens formula (focal length from
// the shot's lens on a 36 mm frame, the f-number, the focus distance); then
// a gather over a disc that only takes a neighbour where the neighbour's own
// circle reaches this pixel, and never lets a blurred background spill over a
// nearer, sharper edge. Linear light in, linear light out.
export function cocRadius(cam, W, z, { focus, n }) {
  const F = (cam.f / W) * 36, S1 = focus * 1000, S2 = Math.max(1, z * 1000);
  const c = ((F * F) / (n * Math.max(1e-3, S1 - F))) * Math.abs(S2 - S1) / S2; // mm on the sensor
  return (c * W) / 36 / 2;
}

export function lensBlur(img, dep, W, H, cam, opt) {
  const maxR = opt.max ?? Math.round(W * 0.012);
  // depth along the axis, and each pixel's radius
  const z = new Float32Array(W * H), r = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x, xc = (x + 0.5 - cam.cx) / cam.f, yc = (y + 0.5 - cam.cy) / cam.f;
    z[k] = dep[k] / Math.sqrt(xc * xc + yc * yc + 1);
    r[k] = Math.min(maxR, cocRadius(cam, W, z[k], opt));
  }
  // the biggest radius near each tile: how far a pixel must look
  const T = 16, tw = Math.ceil(W / T), th = Math.ceil(H / T), tmax = new Float32Array(tw * th), near = new Float32Array(tw * th);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const t = ((y / T) | 0) * tw + ((x / T) | 0); if (r[y * W + x] > tmax[t]) tmax[t] = r[y * W + x]; }
  for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
    let m = 0; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const a = tx + i, b = ty + j; if (a >= 0 && b >= 0 && a < tw && b < th) m = Math.max(m, tmax[b * tw + a]); }
    near[ty * tw + tx] = m;
  }
  const NS = 128; // samples at most, on a Vogel spiral over the disc
  const out = new Float32Array(img.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x, R = near[((y / T) | 0) * tw + ((x / T) | 0)], rp = r[k], zp = z[k];
    if (R < 0.6) { out[k * 3] = img[k * 3]; out[k * 3 + 1] = img[k * 3 + 1]; out[k * 3 + 2] = img[k * 3 + 2]; continue; }
    const n = Math.min(NS, Math.max(12, Math.round(R * R * 0.9)));
    const w0 = 1 / Math.max(1, rp * rp);
    let sr = img[k * 3] * w0, sg = img[k * 3 + 1] * w0, sb = img[k * 3 + 2] * w0, sw = w0;
    for (let i = 0; i < n; i++) {
      const rr = Math.sqrt((i + 0.5) / n), a = i * 2.39996323, d = rr * R;
      const qx = Math.round(x + Math.cos(a) * d), qy = Math.round(y + Math.sin(a) * d);
      if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue;
      const q = qy * W + qx;
      // a farther neighbour can only blur as much as this pixel does (it is behind it)
      const rq = z[q] > zp ? Math.min(r[q], rp) : r[q];
      const cover = Math.min(1, Math.max(0, rq - d + 0.5));
      if (cover <= 0) continue;
      const w = cover / Math.max(1, rq * rq);
      sr += img[q * 3] * w; sg += img[q * 3 + 1] * w; sb += img[q * 3 + 2] * w; sw += w;
    }
    out[k * 3] = sr / sw; out[k * 3 + 1] = sg / sw; out[k * 3 + 2] = sb / sw;
  }
  img.set(out);
}
