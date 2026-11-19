// KOR — the plates of the opening (public/game/js/cine/opening.js) and of act 2's and act 3's films: the series'
// scenes traced from the plate cameras in public/game/js/cine/plates.js, with
// what moves left out to be drawn live (the searchlight's beam) and a
// variant where a light changes (the tube off; the coals cooler), so the
// shot can flicker or breathe between the two.
// node tools/game/series/render.mjs --plates [names…] → public/game/assets/plates/<name>.webp
import { steelworks } from './scenes/steel.js';
import { rooftop } from './scenes/city.js';
import { posterWall, alley, embers, foundry, metro, droneWorks } from './scenes/places.js';
import { boardroom, bay, roof, worksGate } from './scenes/act3.js';

export const OPEN = {
  open_furnace: { scene: (cam) => steelworks(cam, { state: 'cold' }), tex: ['sealNotice'] },
  open_roof: { scene: (cam) => rooftop(cam, { searchI: 0 }), tex: [] },
  open_poster: { scene: (cam) => posterWall(cam, {}), tex: ['posterVanta', 'sealNotice'] },
  open_poster_off: { scene: (cam) => posterWall(cam, { tubeOff: true }), tex: ['posterVanta', 'sealNotice'] },
  open_alley: { scene: (cam) => alley(cam, {}), tex: [] },
  open_coals: { scene: (cam) => embers(cam, {}), tex: [], dof: { focus: 0.3, n: 3.5, max: 16 } },
  open_coals_dim: { scene: (cam) => embers(cam, { heatK: 0.6 }), tex: [], dof: { focus: 0.3, n: 3.5, max: 16 } },
  // act 2's films (public/game/js/cine/shots3.js; docs §10.31): the series' places, no one in them,
  // what moves (dust, steam, the drones' lights, the rain) drawn live
  foundry: { scene: (cam) => foundry(cam, {}), tex: [] },
  metro: { scene: (cam) => metro(cam, {}), tex: ['metroSign', 'posterVanta'] },
  drones: { scene: (cam) => droneWorks(cam, {}), tex: ['vantaWall'] },
  open_furnace_relit: { scene: (cam) => steelworks(cam, { state: 'relit' }), tex: [] },
  // act 3's films (public/game/js/cine/shots5.js; docs §10.44): new places, no one in them
  boardroom: { scene: (cam) => boardroom(cam, {}), tex: ['ocaksanGhost', 'vantaWall', 'oldWorks'] },
  bay: { scene: (cam) => bay(cam, {}), tex: ['bay1', 'bay2', 'bay3'] },
  bay_dark: { scene: (cam) => bay(cam, { lampsOff: true }), tex: ['bay1', 'bay2', 'bay3'] },
  roof: { scene: (cam) => roof(cam, { time: 'night' }), tex: ['helipad'] },
  roof_flash: { scene: (cam) => roof(cam, { time: 'flash' }), tex: ['helipad'] },
  roof_dawn: { scene: (cam) => roof(cam, { time: 'dawn' }), tex: ['helipad'] },
  works_gate: { scene: (cam) => worksGate(cam, {}), tex: ['gateSign', 'hiringBanner', 'safetyBoard'] },
  works_board: { scene: (cam) => worksGate(cam, {}), tex: ['gateSign', 'hiringBanner', 'safetyBoard'], dof: { focus: 5.1, n: 2.8, max: 18 } },
};
