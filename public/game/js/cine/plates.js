// KOR — cinematics: plates. The still parts of a few shots (a building's
// front, a square, a yard of containers) are ray traced ahead of time
// (tools/game/plate/: shadows, wet reflections, lamplight in the mist) into an
// image a little bigger than the frame, from where the shot's camera stands.
// The shot draws it every frame, moved for the operator's hand and scaled for
// a slow zoom, and puts the moving things on top.
//
// PLATES: each plate's camera. `core` is the width (px) the lens is reckoned
// on; W×H is the image, the core plus a margin all round for the moves.

// a camera at p looking at q (yaw, pitch), the plate a little bigger than the frame
function look(p, q) { const d = [q[0] - p[0], q[1] - p[1], q[2] - p[2]]; return { pos: p, yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), core: 1280, W: 1376, H: 632 }; }
const OPEN = {
  furnace: { mm: 50, pos: [-60, 1.8, -250], yaw: 0.1974, pitch: 0.0946, core: 1280, W: 1376, H: 632 },
  roof: { mm: 35, pos: [-1.2, 25.7, 5.2], yaw: 0.0385, pitch: -0.0448, core: 1280, W: 1376, H: 632 },
  poster: { mm: 28, pos: [0.35, 0.45, -2.6], yaw: -0.2808, pitch: 0.3211, core: 1280, W: 1376, H: 632 },
  alley: { mm: 32, pos: [0.35, 0.55, 0.6], yaw: -0.0051, pitch: 0.0696, core: 1280, W: 1376, H: 632 },
  coals: { mm: 60, pos: [0, 0.1, -0.26], yaw: 0, pitch: -0.2276, core: 1280, W: 1376, H: 632 },
};
export const PLATES = {
  governor: { mm: 24, pos: [0, 1.0, 0], yaw: 0, pitch: 0.1, core: 1280, W: 1376, H: 632 },
  gate: { mm: 50, pos: [-0.6, 1.5, -2], yaw: 0.06, pitch: -0.015, core: 1280, W: 1376, H: 632 },
  market: { mm: 35, pos: [-0.6, 4.3, 0], yaw: -0.03, pitch: -0.15, core: 1280, W: 1500, H: 632 },
  // the opening (cine/opening.js), from the series' cameras (tools/game/series/opening.js);
  // a plate and its variant (a light off, the coals cooler) share a camera
  open_furnace: OPEN.furnace, open_roof: OPEN.roof, open_poster: OPEN.poster, open_poster_off: OPEN.poster,
  open_alley: OPEN.alley, open_coals: OPEN.coals, open_coals_dim: OPEN.coals,
  // act 2's films (docs §10.31), from the series' cameras (tools/game/series/shots.js 22, 24,
  // 25, 26): the foundry, the metro, the drone works; the furnace lit again (the opening's camera)
  foundry: { mm: 24, pos: [5, 1.7, 3], yaw: -0.1049, pitch: 0.0401, core: 1280, W: 1376, H: 632 },
  metro: { mm: 24, pos: [1.4, 2.55, -1], yaw: -0.0311, pitch: -0.0057, core: 1280, W: 1376, H: 632 },
  drones: { mm: 28, pos: [-6.5, 2.6, 1], yaw: 0.1776, pitch: -0.0353, core: 1280, W: 1376, H: 632 },
  open_furnace_relit: OPEN.furnace,
  // act 3's films (docs §10.44; tools/game/series/scenes/act3.js): the boardroom on the
  // forty-second floor, the loading bay (and with its lamps cut), the roof by night (and lit
  // by lightning), the flagpole at dawn, the works' gate and its safety board that morning
  boardroom: { mm: 20, ...look([2.4, 1.55, -1.6], [-4.2, 1.15, 14]) },
  bay: { mm: 28, ...look([-2.6, 1.55, -3.5], [1.2, 1.7, 8]) },
  bay_dark: { mm: 28, ...look([-2.6, 1.55, -3.5], [1.2, 1.7, 8]) },
  roof: { mm: 18, ...look([-4.5, 1.1, -12], [0.6, 12.5, 14]) },
  roof_flash: { mm: 18, ...look([-4.5, 1.1, -12], [0.6, 12.5, 14]) },
  roof_dawn: { mm: 35, ...look([2.4, 1.5, -9], [7.6, 10.2, 1.5]) },
  works_gate: { mm: 28, ...look([-30.5, 1.65, -182], [-25.5, 7.4, -100]) },
  works_board: { mm: 50, ...look([-34.6, 2.0, -165.5], [-32.7, 2.6, -160.76]) },
};

// the camera a plate is traced from (ss: supersampling)
export function plateCam(name, ss = 1) {
  const P = PLATES[name], W = P.W * ss, H = P.H * ss;
  return { W, H, f: (P.mm / 36) * P.core * ss, cx: W / 2, cy: H / 2, p: P.pos.slice(), yaw: P.yaw, pitch: P.pitch };
}

export class Plate {
  constructor(name) {
    this.P = PLATES[name]; this.img = new Image(); this.ok = false;
    this.img.src = new URL(`../../assets/plates/${name}.webp`, import.meta.url).href;
    this.ready = this.img.decode().then(() => { this.ok = true; }, (e) => { console.warn('plate', name, e); });
  }
  // the transform from plate pixels to the screen, as `cam` sees it now (same
  // place; turned a little, zoomed a little)
  frame(g, cam) {
    const P = this.P, s = cam.f / ((P.mm / 36) * P.core);
    g.translate(cam.W / 2, cam.H / 2); g.rotate(cam._roll || 0);
    g.translate(-cam.f * (cam._yaw - P.yaw), cam.f * (cam._pitch - P.pitch));
    g.scale(s, s); g.translate(-P.W / 2, -P.H / 2);
  }
  draw(g, cam, alpha = 1) {
    if (!this.ok) return false;
    g.save(); g.globalAlpha = alpha; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    this.frame(g, cam); g.drawImage(this.img, 0, 0);
    g.restore();
    return true;
  }
  // a world point → plate pixels (the plate's own camera)
  at(x, y, z) {
    const P = this.P, fp = (P.mm / 36) * P.core, cy = Math.cos(P.yaw), sy = Math.sin(P.yaw), cp = Math.cos(P.pitch), sp = Math.sin(P.pitch);
    const dx = x - P.pos[0], dy = y - P.pos[1], dz = z - P.pos[2];
    const x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy, y2 = dy * cp - z1 * sp, z2 = dy * sp + z1 * cp;
    return [P.W / 2 + (x1 / z2) * fp, P.H / 2 - (y2 / z2) * fp];
  }
}
