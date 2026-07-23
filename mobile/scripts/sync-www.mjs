// Copies the CINDERFALL web game (../public/game) into ./www, which Capacitor
// uses as its webDir. The game uses only relative asset paths, so it runs
// unchanged from the wrapper's root origin. Run automatically on install and
// before every `cap add` / `cap sync`.
//
// Node 16.7+ (fs.cp) — no external dependencies.

import { cp, rm, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '..', '..', 'public', 'game');
const DEST = resolve(here, '..', 'www');

try {
  await access(SRC);
} catch {
  console.error(`[sync-www] source not found: ${SRC}`);
  process.exit(1);
}

// The service worker and PWA manifest are harmless inside the wrapper but
// unnecessary (Capacitor serves locally), so they are skipped to keep the
// bundle lean and avoid a second caching layer over the native WebView.
const SKIP = new Set(['sw.js']);

await rm(DEST, { recursive: true, force: true });
await mkdir(DEST, { recursive: true });
await cp(SRC, DEST, {
  recursive: true,
  filter: (src) => !SKIP.has(src.split('/').pop()),
});

console.log(`[sync-www] copied game → ${DEST}`);
