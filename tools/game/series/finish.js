// KOR — the last pass on a still of the series, in the browser: the moving
// air drawn through the same camera (rain, steam, sparks — the shot's `air`),
// then the film look of the cinematics (js/cine/post.js). → JPEG, base64.
import { SHOTS } from './shots.js';
import { Post } from '../../../public/game/js/cine/post.js';
import { Cam } from '../../../public/game/js/cine/cam.js';
import * as FX from '../../../public/game/js/cine/fx.js';
import { rng, fogTexture } from '../../../public/game/js/cine/noise.js';

export async function finish(id, src, w, h) {
  const s = SHOTS.find((x) => x.id === id);
  const img = new Image(); img.src = src; await img.decode();
  const buf = document.createElement('canvas'); buf.width = w; buf.height = h;
  const g = buf.getContext('2d'); g.drawImage(img, 0, 0);
  const cam = new Cam(w, h); cam.mm = s.cam.mm; cam.pos = s.cam.pos.slice(); cam.yaw = s.cam.yaw || 0; cam.pitch = s.cam.pitch || 0; cam.update(0);
  if (s.air) { g.save(); s.air(g, cam, { ...FX, rng, fogTexture, w, h }); g.restore(); }
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const post = new Post();
  // (no lens dirt: on a still its smudges sit round the frame like a border)
  post.apply(out.getContext('2d'), w, h, buf, 1.3, { weave: 0, flicker: 0, ...(s.post || {}), dirt: 0 });
  return out.toDataURL('image/jpeg', 0.93).split(',')[1];
}
