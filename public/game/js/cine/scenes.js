// KOR — cinematics: the cut lists (docs/KOR_STORY_CINEMATIC.md §2, §4).
// Times in seconds. Subtitles name the speaker; `radio` marks a line heard
// over the radio (it gets the squelch and a different style).
import * as S from './shots.js';
import * as M from './shots3.js';

const shot = (at, dur, make) => ({ at, dur, make });

export const PROLOGUE = {
  id: 'prologue', dur: 62,
  shots: [
    shot(0, 3, () => new S.Black()),
    shot(3, 7, () => new S.Furnace()),
    shot(10, 5, () => new S.Fence()),
    shot(15, 4, () => new S.Furnace({ dying: true })),
    shot(19, 2, () => new S.Black()),
    shot(21, 8, () => new S.Rooftop()),
    shot(29, 6, () => new S.Street()),
    shot(35, 7, () => new S.Basement()),
    shot(42, 5, () => new S.Scarf()),
    shot(47, 8, () => new S.Alley()),
    shot(55, 7, () => new S.Title({ len: 7 })),
  ],
  fades: [{ at: 18.8, dur: 0.4 }, { at: 54.8, dur: 0.4 }],
  caps: [
    { at: 0.6, to: 2.8, key: 'story.cap.past', pos: 'bl' },
    { at: 19.3, to: 20.8, key: 'story.cap.today', pos: 'bl' },
    { at: 58.6, to: 61.4, key: 'story.tagline', pos: 'title' },
  ],
  subs: [
    { at: 3.6, to: 7.8, who: 'FLINT', key: 'story.p.1' },
    { at: 10.4, to: 14.6, who: 'FLINT', key: 'story.p.2' },
    { at: 15.3, to: 18.8, who: 'FLINT', key: 'story.p.3' },
    { at: 22.0, to: 26.5, who: 'FLINT', key: 'story.p.4' },
    { at: 33.0, to: 35.0, who: 'VESPER', key: 'story.p.5', radio: true },
    { at: 35.6, to: 38.6, who: 'WARDEN', key: 'story.p.6' },
    { at: 38.9, to: 41.8, who: 'SKYE', key: 'story.p.7' },
    { at: 43.2, to: 46.6, who: 'FLINT', key: 'story.p.8' },
    { at: 51.5, to: 54.5, who: 'VESPER', key: 'story.p.9', radio: true },
  ],
  beds: [
    { at: 0, name: 'rain', level: 0.5, sec: 2.5 },
    { at: 0, name: 'city', level: 0.25, sec: 3 },
    { at: 2.92, name: 'furnace', level: 0.8, sec: 0.08 },
    { at: 9.92, name: 'furnace', level: 0.35, sec: 0.1 },
    { at: 14.92, name: 'furnace', level: 0.8, sec: 0.1 },
    { at: 15.5, name: 'furnace', level: 0.0, sec: 3.2 },
    { at: 20.92, name: 'rain', level: 0.65, sec: 0.1, tin: 0.12 },
    { at: 28.92, name: 'rain', level: 0.55, sec: 0.1, tin: 0 },
    { at: 34.92, name: 'rain', level: 0.12, sec: 0.1 },
    { at: 34.92, name: 'hum', level: 0.5, sec: 0.1 },
    { at: 46.92, name: 'hum', level: 0.0, sec: 0.1 },
    { at: 46.92, name: 'rain', level: 0.7, sec: 0.1 },
    { at: 54.6, name: 'rain', level: 0.0, sec: 1.4 },
    { at: 54.6, name: 'city', level: 0.0, sec: 1.4 },
    { at: 55.2, name: 'drone', level: 0.6, sec: 2.5 },
    { at: 60.6, name: 'drone', level: 0.0, sec: 1.4 },
  ],
  cues: [
    { at: 4.4, name: 'megaphone' },
    { at: 10.0, name: 'flare', o: { dur: 5, pan: 0.1 } },
    { at: 18.1, name: 'hiss', o: { dur: 1.2 } },
    { at: 23.4, name: 'siren' },
    { at: 24.8, name: 'uav' },
    { at: 32.9, name: 'radio', o: { pan: 0.3 } },
    { at: 35.1, name: 'radio', o: { pan: 0.3, vol: 0.4 } },
    { at: 36.0, name: 'paper' },
    { at: 38.2, name: 'car' },
    { at: 43.0, name: 'cloth' },
    { at: 44.3, name: 'nail' },
    { at: 44.4, name: 'cloth', o: { vol: 1.4 } },
    { at: 47.3, name: 'door' },
    { at: 51.4, name: 'radio' },
    { at: 55.4, name: 'boom' },
    { at: 55.6, name: 'crackle', o: { dur: 6, n: 40 } },
  ],
};

// the opening title on every launch: the last shot alone
export const TITLE = {
  id: 'title', dur: 6.2,
  shots: [shot(0, 6.2, () => new S.Title({ len: 99 }))],
  caps: [{ at: 2.6, to: 99, key: 'story.tagline', pos: 'title' }],
  subs: [], beds: [], cues: [],
};

// before the missions (§4): one shot, the radio over it
const one = (id, dur, make, subs, cues = [], beds = [], caps = []) => ({ id, dur, shots: [shot(0, dur, make)], fades: [{ at: dur - 0.6, dur: 1.2 }], caps, subs, beds, cues });
export const STORY = {
  m1: one('m1', 16, () => new M.Gate(), [
    { at: 1.5, to: 5.6, who: 'VESPER', key: 'story.m1.1', radio: true },
    { at: 6.4, to: 10.6, who: 'WARDEN', key: 'story.m1.2', radio: true },
    { at: 11.6, to: 13.4, who: 'FLINT', key: 'story.m1.3' },
  ], [{ at: 1.4, name: 'radio' }, { at: 6.3, name: 'radio', o: { vol: 0.6 } }, { at: 3, name: 'siren', o: { vol: 0.3 } }],
  [{ at: 0, name: 'rain', level: 0.55, sec: 1.5 }, { at: 0, name: 'city', level: 0.25, sec: 2 }, { at: 14.8, name: 'rain', level: 0, sec: 1.2 }, { at: 14.8, name: 'city', level: 0, sec: 1.2 }]),
  m2: one('m2', 17, () => new M.Market(), [
    { at: 1.4, to: 5.2, who: 'VESPER', key: 'story.m2.1', radio: true },
    { at: 6.0, to: 9.6, who: 'SKYE', key: 'story.m2.2', radio: true },
    { at: 10.6, to: 15.4, who: 'HAWK', key: 'story.m2.3', radio: true },
  ], [{ at: 1.3, name: 'radio' }, { at: 10.3, name: 'buzzphone' }],
  [{ at: 0, name: 'rain', level: 0.2, sec: 1.5 }, { at: 0, name: 'city', level: 0.3, sec: 2 }, { at: 15.8, name: 'rain', level: 0, sec: 1.2 }, { at: 15.8, name: 'city', level: 0, sec: 1.2 }]),
  m3: one('m3', 16, () => new M.Governor(), [
    { at: 1.4, to: 5.4, who: 'VESPER', key: 'story.m3.1', radio: true },
    { at: 6.2, to: 10.2, who: 'SKYE', key: 'story.m3.2', radio: true },
    { at: 11.2, to: 13.2, who: 'FLINT', key: 'story.m3.3' },
  ], [{ at: 1.3, name: 'radio' }, { at: 6.1, name: 'radio', o: { vol: 0.6 } }],
  [{ at: 0, name: 'rain', level: 0.6, sec: 1.5 }, { at: 0, name: 'city', level: 0.2, sec: 2 }, { at: 14.8, name: 'rain', level: 0, sec: 1.2 }, { at: 14.8, name: 'city', level: 0, sec: 1.2 }]),
  act1: one('act1', 17, () => new M.Plan(), [
    { at: 1.6, to: 5.6, who: 'VESPER', key: 'story.a1.1' },
    { at: 6.6, to: 10.0, who: 'BULWARK', key: 'story.a1.2' },
  ], [{ at: 0.4, name: 'buzzphone' }, { at: 2.8, name: 'buzzphone' }, { at: 5.2, name: 'buzzphone' }, { at: 7.6, name: 'buzzphone' }, { at: 10.0, name: 'buzzphone' }, { at: 12.4, name: 'buzzphone' }],
  [{ at: 0, name: 'hum', level: 0.35, sec: 1 }, { at: 0, name: 'rain', level: 0.12, sec: 1 }, { at: 15.6, name: 'hum', level: 0, sec: 1.2 }, { at: 15.6, name: 'rain', level: 0, sec: 1.2 }],
  [{ at: 12.0, to: 16.4, key: 'story.a1.cap', pos: 'title' }]),
};
