// KOR — the plates of the opening (public/lab/js/cine/opening.js): the series'
// scenes traced from the plate cameras in public/lab/js/cine/plates.js, with
// what moves left out to be drawn live (the searchlight's beam) and a
// variant where a light changes (the tube off; the coals cooler), so the
// shot can flicker or breathe between the two.
// node tools/lab/series/render.mjs --plates [names…] → public/lab/assets/plates/<name>.webp
import { steelworks } from './scenes/steel.js';
import { rooftop } from './scenes/city.js';
import { posterWall, alley, embers } from './scenes/places.js';

export const OPEN = {
  open_furnace: { scene: (cam) => steelworks(cam, { state: 'cold' }), tex: ['sealNotice'] },
  open_roof: { scene: (cam) => rooftop(cam, { searchI: 0 }), tex: [] },
  open_poster: { scene: (cam) => posterWall(cam, {}), tex: ['posterVanta', 'sealNotice'] },
  open_poster_off: { scene: (cam) => posterWall(cam, { tubeOff: true }), tex: ['posterVanta', 'sealNotice'] },
  open_alley: { scene: (cam) => alley(cam, {}), tex: [] },
  open_coals: { scene: (cam) => embers(cam, {}), tex: [], dof: { focus: 0.3, n: 3.5, max: 16 } },
  open_coals_dim: { scene: (cam) => embers(cam, { heatK: 0.6 }), tex: [], dof: { focus: 0.3, n: 3.5, max: 16 } },
};
