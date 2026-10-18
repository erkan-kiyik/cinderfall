// Exports the game's own painted art into website/assets/art as WebP.
//
// Nothing in the game ships as a bitmap: every weapon, skin, the supply crate,
// the scrap cog, the achievement medals and CROW are painted onto canvases at
// boot by public/game/js/art/*. So the only way to put the real art on the
// website — rather than a redraw that drifts from the game — is to run those
// same painters in a browser and save what they produce. That is this script.
//
// Dev-only. It needs Playwright and its Chromium, which the site build does
// not: the WebP files it writes are committed, and scripts/build-website.mjs
// just copies them. Re-run it whenever the art in public/game/js/art changes:
//
//   node website/tools/export-game-art.mjs
//
// (If Playwright is installed globally rather than in this repo, point Node at
// it: NODE_PATH="$(npm root -g)" node website/tools/export-game-art.mjs)

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, dirname, extname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const out = resolve(root, 'website/assets/art');

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Playwright is not installed. Install it (npm i -D playwright) or set NODE_PATH to a global install.');
  process.exit(1);
}

// ---- a tiny static server: the art modules are ES modules, which a browser
// will only import over http(s), never from file://.
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const file = resolve(root, '.' + path);
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try {
    const body = path === '/' ? '<!doctype html><title>export</title>' : await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'text/html' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

// The weapons shown on the site, in roster order, and the VK-77 finishes used
// for the skin ladder. Ids are the game's own (art/weapons.js, art/skins.js).
const WEAPON_IDS = [
  'rifle', 'pistol', 'smg', 'lmg', 'sniper', 'battle',
  'plasma', 'pulse', 'eshotgun', 'emp', 'gravity', 'lightning', 'cryo', 'raygun', 'quantum', 'lasersmg', 'particle', 'railgun',
  'ion', 'flame', 'minigun', 'rocket',
  'knife',
];
const RIFLE_FINISHES = ['urban', 'cinder', 'spectre', 'arc', 'inferno'];
const MEDALS = [
  ['first_blood', 'easy', 'skull'],
  ['boss_slayer', 'easy', 'crown'],
  ['sharpshooter', 'medium', 'target'],
  ['combo_breaker', 'medium', 'bolt'],
  ['ghost', 'hard', 'fire'],
  ['sector_master', 'hard', 'flag'],
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.goto(origin + '/');

const result = await page.evaluate(async ({ WEAPON_IDS, RIFLE_FINISHES, MEDALS }) => {
  const paint = await import('/public/game/js/art/paint.js');
  // Paint well above the game's own 3x so the cards stay sharp at 2x DPR.
  const SCALE = 10;
  paint.setAssetScale(SCALE);
  const { buildWeapons } = await import('/public/game/js/art/weapons.js');
  const { paintCrateBody, paintCrateLid } = await import('/public/game/js/art/crate.js');
  const { paintScrap } = await import('/public/game/js/art/currency.js');
  const { drawMedal } = await import('/public/game/js/art/medal.js');
  const { paintTrader } = await import('/public/game/js/art/trader.js');
  const { WEAPON_SKINS } = await import('/public/game/js/art/skins.js');
  const meta = await import('/public/game/js/game/meta.js');

  // How a weapon is obtained, from the game's own catalog (game/meta.js).
  const weaponItem = (id) => ['wpn_primary', 'wpn_secondary', 'wpn_special']
    .map((slot) => meta.itemById(`${slot}:${id}`)).find(Boolean) || null;
  const acquire = (id, item) => {
    if (id === 'knife' || meta.STARTER_WEAPON_IDS.includes(id)) return 'starter';
    if (item && item.tag === 'BOSS') return 'boss';
    return 'crate';
  };

  const encode = (cv, q = 0.9) => cv.toDataURL('image/webp', q);

  // Crop a canvas to its painted pixels (+pad), so every file is tight.
  function trim(cv, pad = 8) {
    const g = cv.getContext('2d');
    const { data, width: w, height: h } = g.getImageData(0, 0, cv.width, cv.height);
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return cv;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
    x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
    const o = document.createElement('canvas');
    o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
    o.getContext('2d').drawImage(cv, -x0, -y0);
    return o;
  }

  // Same assembly as previewItem() in public/game/js/main.js: magazine, body,
  // bolt, slide — a weapon is several sprites, not one.
  function assemble(def, body) {
    const parts = [];
    const mag = body.mag || def.mag;
    if (mag && def.magPos) parts.push([mag, def.magPos.x, def.magPos.y]);
    parts.push([body, 0, 0]);
    if (def.bolt && def.boltPos) parts.push([def.bolt, def.boltPos.x, def.boltPos.y]);
    const slide = body.slide || def.slide;
    if (slide) parts.push([slide, 0, 0]);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [sp, px, py] of parts) {
      const l = px - sp.ax * sp.s, t = py - sp.ay * sp.s;
      x0 = Math.min(x0, l); y0 = Math.min(y0, t);
      x1 = Math.max(x1, l + sp.w); y1 = Math.max(y1, t + sp.h);
    }
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((x1 - x0) * SCALE); cv.height = Math.ceil((y1 - y0) * SCALE);
    const g = cv.getContext('2d');
    g.translate(-x0 * SCALE, -y0 * SCALE);
    for (const [sp, px, py] of parts) paint.drawSprite(g, sp, px * SCALE, py * SCALE, 0, SCALE, SCALE);
    const t = trim(cv);
    return { cv: t, worldW: +(t.width / SCALE).toFixed(1), worldH: +(t.height / SCALE).toFixed(1) };
  }

  const files = {};
  const manifest = { weapons: {}, finishes: {} };
  const W = buildWeapons();

  for (const id of WEAPON_IDS) {
    const def = W[id];
    if (!def) throw new Error('unknown weapon ' + id);
    const a = assemble(def, def.body);
    files[`weapon-${id}.webp`] = encode(a.cv);
    manifest.weapons[id] = {
      name: def.name, kind: def.kind, w: a.cv.width, h: a.cv.height, worldW: a.worldW, worldH: a.worldH,
      // Real stats, straight from the def. Melee has no ballistics.
      dmg: def.dmg, rpm: def.rpm ?? null, spread: def.spread ?? null, magSize: def.magSize ?? null,
      reloadT: def.reloadT ?? null, pellets: def.pellets ?? 1, energy: !!def.energy,
      fireMode: def.fireMode || (def.kind === 'gun' ? 'hitscan' : 'melee'),
      charge: !!def.charge, dmgHeavy: def.dmgHeavy ?? null, range: def.range ?? null,
      recoilKick: def.recoilKick ?? null,
      auto: !!def.auto,
      explosive: !!def.projectile?.explode,
      blast: !!(def.projectile?.blast || def.projectile?.explode),
      pierce: def.projectile?.pierce || 0,
      rarity: weaponItem(id)?.rarity || null,
      acquire: acquire(id, weaponItem(id)),
      slots: ['wpn_primary', 'wpn_secondary', 'wpn_special']
        .filter((slot) => meta.itemById(`${slot}:${id}`)).map((slot) => slot.slice(4)),
      skins: Object.values(WEAPON_SKINS[id] || {}).map((s) => s.tier),
    };
  }
  const rifle = W.rifle;
  for (const f of ['default', ...RIFLE_FINISHES]) {
    const body = f === 'default' ? rifle.body : rifle.finishes[f];
    if (!body) throw new Error('unknown rifle finish ' + f);
    const a = assemble(rifle, body);
    files[`skin-rifle-${f}.webp`] = encode(a.cv);
    manifest.finishes[f] = { w: a.cv.width, h: a.cv.height };
  }

  // Crate: body and lid are separate canvases in the game so the lid can be
  // thrown off on open; the site animates them the same way.
  for (const [name, fn] of [['crate-body', paintCrateBody], ['crate-lid', paintCrateLid]]) {
    const cv = document.createElement('canvas');
    cv.width = 660; cv.height = 510;
    const g = cv.getContext('2d');
    g.setTransform(3, 0, 0, 3, 0, 0);
    fn(g);
    files[`${name}.webp`] = encode(cv, 0.92);   // untrimmed: body and lid share one box
  }

  {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 192;
    paintScrap(cv.getContext('2d'), 192, 192);
    files['scrap.webp'] = encode(trim(cv, 4), 0.92);
  }

  for (const [id, tier, icon] of MEDALS) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    // 'ready' is the struck metal on its own: no lock, no claimed tick
    drawMedal(cv.getContext('2d'), 256, tier, icon, 'ready');
    files[`medal-${id}.webp`] = encode(trim(cv, 6), 0.92);
  }

  {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 480;
    paintTrader(cv.getContext('2d'), 480, 480);
    files['trader-crow.webp'] = encode(cv, 0.86);
  }

  return { files, manifest };
}, { WEAPON_IDS, RIFLE_FINISHES, MEDALS });

await browser.close();
server.close();

await mkdir(out, { recursive: true });
let bytes = 0;
for (const [name, url] of Object.entries(result.files)) {
  const buf = Buffer.from(url.split(',')[1], 'base64');
  bytes += buf.length;
  await writeFile(resolve(out, name), buf);
}
await writeFile(resolve(out, 'manifest.json'), JSON.stringify(result.manifest, null, 2) + '\n');
console.log(`wrote ${Object.keys(result.files).length} files (${(bytes / 1024).toFixed(0)} KB) + manifest.json to ${out}`);
