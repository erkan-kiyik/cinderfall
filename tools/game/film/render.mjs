// KOR — the films, rendered ahead of time (docs/KOR_STORY_CINEMATIC.md §10.17).
//
// Every film (the launch film, the prologue, the scenes before the missions
// and after the first act) is drawn frame by frame by the same code that used to draw it
// live (public/game/js/cine), in headless Chromium at a fixed step, and
// encoded to H.264 by ffmpeg into public/game/assets/film/<id>.mp4. The game
// plays the video and keeps only the sound, subtitles and captions live.
// The film grain is left out of the frames (noise is what costs a video its
// bits: four times the size with it) and laid over the video as it plays
// (cine/film.js, filmGrain). Re-run after changing a shot:
//
//   node tools/game/film/render.mjs [ids…]      (default: all)
//   options: --w=1280 --fps=24 --crf=24 --grain=1 (grain in the frames)
//
// Needs Playwright's Chromium and ffmpeg (libx264) on the PATH.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../public/game');
const OUT = path.join(ROOT, 'assets/film');
const args = process.argv.slice(2), opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const ALL = ['opening', 'opening_loop', 'prologue', 'm1', 'm2', 'm3', 'act1'];
// the launch film's last shot (the coals, KOR over them) as a seamless loop
// for as long as the game is still loading: LOOP s of it, the last FADE s
// crossfaded into its own start
const LOOP_AT = 17.6, LOOP = 6, FADE = 1.5;
const ids = args.filter((a) => !a.startsWith('--')); const list = ids.length ? ids : ALL;
const W = +(opt.w || 1280), FPS = +(opt.fps || 24), CRF = opt.crf || '24';

// a static server for public/game
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
await new Promise((res) => srv.listen(0, res));
const port = srv.address().port;
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
async function render(id, { from = 0, to = null, file = id } = {}) {
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  page.on('pageerror', (e) => console.error(id, e.message));
  await page.goto(`http://localhost:${port}/dev/film.html?scene=${id}&w=${W}&fps=${FPS}${to ? `&dur=${to}` : ''}&grain=${opt.grain ?? '0'}${opt.weave ? `&weave=${opt.weave}` : ''}`);
  await page.waitForFunction(() => window.__film, null, { timeout: 120000 });
  const { dur, H } = await page.evaluate(() => ({ dur: window.__film.dur, H: window.__film.H }));
  const end = to ?? dur;
  if (from > 0) await page.evaluate((s) => window.__skip(s), from);
  const n = Math.round((end - from) * FPS);
  const dst = path.join(OUT, `${file}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', CRF, '-tune', 'grain', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.0',
    '-movflags', '+faststart', '-an', dst], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const url = await page.evaluate(() => window.__film.frame());
    const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 48 === 0) process.stdout.write(`\r${file} ${i}/${n} ${((Date.now() - t0) / 1000).toFixed(0)}s   `);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`\r${file}: ${n} frames, ${W}×${H} @ ${FPS}, ${(fs.statSync(dst).size / 1048576).toFixed(1)} MB, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  await page.close();
}
for (const id of list) {
  if (id === 'opening_loop') {
    await render('opening', { from: LOOP_AT, to: LOOP_AT + LOOP + FADE, file: '_loop_src' });
    const src = path.join(OUT, '_loop_src.mp4'), dst = path.join(OUT, 'opening_loop.mp4');
    await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-filter_complex',
      `[0:v]split[a][b];[a]trim=${FADE}:${LOOP + FADE},setpts=PTS-STARTPTS[A];[b]trim=0:${FADE},setpts=PTS-STARTPTS[B];[A][B]xfade=transition=fade:duration=${FADE}:offset=${LOOP - FADE},format=yuv420p[v]`,
      '-map', '[v]', '-c:v', 'libx264', '-preset', 'slow', '-crf', CRF, '-tune', 'grain', '-profile:v', 'high', '-level', '4.0', '-movflags', '+faststart', '-an', dst], { stdio: 'inherit' })
      .on('close', (c) => (c ? rej(new Error('ffmpeg ' + c)) : res())));
    fs.unlinkSync(src);
    console.log(`opening_loop: ${LOOP} s, ${(fs.statSync(dst).size / 1048576).toFixed(1)} MB`);
  } else if (opt.from || opt.to) await render(id, { from: +(opt.from || 0), to: opt.to ? +opt.to : null, file: opt.file || id });
  else await render(id);
}
await browser.close(); srv.close();
