// KOR — cinematics: seeded randomness, value noise, and textures baked once
// (film grain frames, fog/cloud, grime). See docs/KOR_STORY_CINEMATIC.md §5.
export function rng(seed = 1) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => ((s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 4294967296);
}
const hash = (i, j = 0) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const fade = (t) => t * t * (3 - 2 * t);
// 1D value noise in [-1, 1]
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  return (hash(i, seed) + (hash(i + 1, seed) - hash(i, seed)) * fade(f)) * 2 - 1;
}
// 2D value noise in [0, 1]
export function noise2(x, y, seed = 0) {
  const i = Math.floor(x), j = Math.floor(y), fx = fade(x - i), fy = fade(y - j);
  const a = hash(i + seed * 131, j), b = hash(i + 1 + seed * 131, j), c = hash(i + seed * 131, j + 1), d = hash(i + 1 + seed * 131, j + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
export function fbm2(x, y, oct = 4, seed = 0) {
  let v = 0, a = 0.5, f = 1, n = 0;
  for (let o = 0; o < oct; o++) { v += noise2(x * f, y * f, seed + o) * a; n += a; a *= 0.5; f *= 2.03; }
  return v / n;
}
// layered noise for hand-held motion: frequencies in Hz, returns [-1, 1]
export function shake(t, seed, freqs = [0.7, 1.9, 4.3], amps = [1, 0.45, 0.18]) {
  let v = 0, n = 0;
  for (let i = 0; i < freqs.length; i++) { v += noise1(t * freqs[i] + i * 17.3, seed + i * 7) * amps[i]; n += amps[i]; }
  return v / n;
}

export const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

// a tileable-looking fog/cloud texture (grey, alpha in the luminance)
export function fogTexture(w = 512, h = 256, seed = 3, scale = 5) {
  const c = canvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    // blend across the seam so it tiles horizontally
    const u = x / w, v = y / h;
    const a = fbm2(u * scale, v * scale * (h / w) * 2, 5, seed), b = fbm2((u - 1) * scale, v * scale * (h / w) * 2, 5, seed);
    const n = a * (1 - u) + b * u;
    const k = Math.max(0, Math.min(1, (n - 0.32) * 2.2));
    const i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = k * 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

// film grain: n frames of mid-grey noise for an overlay pass
export function grainFrames(n = 8, size = 256, seed = 11) {
  const out = [], r = rng(seed);
  for (let f = 0; f < n; f++) {
    const c = canvas(size, size), g = c.getContext('2d'), img = g.createImageData(size, size), d = img.data;
    for (let i = 0; i < size * size; i++) {
      // roughly gaussian (sum of three), clumped a little like film
      const v = 128 + ((r() + r() + r()) - 1.5) * 120;
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    out.push(c);
  }
  return out;
}

// grime: soft blotches and a few scratches for lens dirt and old photos
export function grimeTexture(w = 512, h = 256, seed = 21) {
  const c = canvas(w, h), g = c.getContext('2d'), r = rng(seed);
  for (let i = 0; i < 26; i++) {
    const x = r() * w, y = r() * h, rad = 8 + r() * 46, a = 0.03 + r() * 0.07;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 0.6;
  for (let i = 0; i < 9; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + r() * 40, y + r() * 20, x + r() * 60, y + r() * 50, x + r() * 90 - 20, y + r() * 80); g.stroke(); }
  return c;
}

// colour temperature (Kelvin) → [r, g, b] 0..255 (Tanner Helland fit)
export function kelvin(K) {
  const t = K / 100;
  let r, g, b;
  if (t <= 66) { r = 255; g = 99.4708025861 * Math.log(t) - 161.1195681661; b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307; }
  else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); g = 288.1221695283 * Math.pow(t - 60, -0.0755148492); b = 255; }
  const c = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return [c(r), c(g), c(b)];
}
export const krgba = (K, a = 1, mul = 1) => { const [r, g, b] = kelvin(K); return `rgba(${Math.round(r * mul)},${Math.round(g * mul)},${Math.round(b * mul)},${a})`; };
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
