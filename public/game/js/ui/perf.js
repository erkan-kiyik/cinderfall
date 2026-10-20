// KOR — performance overlay.
// Text refreshes 4×/s; the frame-time graph redraws every frame from the
// loop's ring buffer (one small 2D canvas, no allocation).

export class PerfOverlay {
  constructor(root, loop, info) {
    this.loop = loop; this.info = info;
    this.el = document.createElement('div');
    this.el.className = 'perf';
    this.txt = document.createElement('pre');
    this.cv = document.createElement('canvas');
    this.cv.width = 240; this.cv.height = 46;
    this.el.append(this.txt, this.cv);
    root.appendChild(this.el);
    this.g = this.cv.getContext('2d');
    this.next = 0;
    this.visible = true;
  }

  toggle() { this.visible = !this.visible; this.el.style.display = this.visible ? '' : 'none'; }

  update(now) {
    if (!this.visible) return;
    const L = this.loop, g = this.g, W = 240, H = 46;
    const budget = 1000 / L.hz;
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(13,16,21,0.75)'; g.fillRect(0, 0, W, H);
    const k = H / (budget * 3);
    for (let j = 0; j < W; j++) {
      const i = (L.i - W + j + L.N * 2) % L.N, ms = L.frameMs[i];
      const h = Math.min(H, ms * k);
      g.fillStyle = ms > budget * 1.5 ? '#ff3347' : ms > budget * 1.08 ? '#ffc93c' : '#3ee8e0';
      g.fillRect(j, H - h, 1, h);
    }
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0, H - budget * k, W, 1);
    if (now < this.next) return;
    this.next = now + 250;
    const s = L.stats(120);
    if (!s) return;
    const i = this.info();
    this.txt.textContent =
      `FPS ${s.fps.toFixed(1).padStart(5)}  ekran ${s.hz} Hz\n` +
      `kare ${s.avg.toFixed(2)} ms  p95 ${s.p95.toFixed(2)}  en kötü ${s.max.toFixed(1)}\n` +
      `CPU  sim ${s.upd.toFixed(2)} ms  çizim ${s.rnd.toFixed(2)} ms\n` +
      `draw ${i.draws}  sprite ${i.sprites}  ışık ${i.lights}  geçiş ${i.passes}\n` +
      `çöz. ${i.res}  ${i.quality}  dinamik ×${i.dyn}\n` +
      `atlas ${i.pages} sayfa ~${i.mem} MB  pişirme ${i.bake}`;
  }
}
