// Copies the KOR web game (../public/game) into ./www, which Capacitor
// uses as its webDir. The game uses only relative asset paths, so it runs
// unchanged from the wrapper's root origin. Run automatically on install and
// before every `cap add` / `cap sync`.
//
// Node 16.7+ (fs.cp) — no external dependencies.

import { cp, rm, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
// GAME_DIR picks which folder under public/ is packaged; 'game' (KOR) is the
// only one.
const SRC = resolve(here, '..', '..', 'public', process.env.GAME_DIR || 'game');
const DEST = resolve(here, '..', 'www');

try {
  await access(SRC);
} catch {
  console.error(`[sync-www] source not found: ${SRC}`);
  process.exit(1);
}

// Not shipped: a service worker (Capacitor serves locally; it would only add
// a second cache over the WebView) and dev/, the review pages.
const SKIP = new Set(['sw.js', 'dev']);

await rm(DEST, { recursive: true, force: true });
await mkdir(DEST, { recursive: true });
await cp(SRC, DEST, {
  recursive: true,
  filter: (src) => !SKIP.has(src.split('/').pop()),
});

console.log(`[sync-www] copied game → ${DEST}`);
