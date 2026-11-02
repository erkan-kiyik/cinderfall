// KOR — the sound effects synthesised off the main thread (docs §10.20): the
// same recipes as audio/sfx.js, each sample buffer sent back as it is made,
// so the first seconds of a mission never wait on the synthesis.
import { RECIPES } from './sfx.js';

onmessage = () => {
  for (const n of Object.keys(RECIPES)) { const d = RECIPES[n](); postMessage({ n, d }, [d.buffer]); }
  postMessage({ done: true });
};
