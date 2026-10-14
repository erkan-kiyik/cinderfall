// KOR LAB — the save.
//
// One JSON document with a schema version, kept in localStorage with a
// backup copy of the last good state. Loading validates and migrates; a
// corrupt main copy falls back to the backup, then to a fresh save. Writes
// are debounced so a burst of setting changes costs one write.

export const SAVE_VERSION = 1;
const KEY = 'kor.lab.save', BAK = 'kor.lab.save.bak';

export const OPERATOR_IDS = ['vex', 'hale', 'morrow', 'kite', 'brick'];
const DEFAULT_PRIMARY = { vex: 'kestrel', hale: 'ramrod', morrow: 'wren9', kite: 'marksman', brick: 'kestrel' };

export function freshSave() {
  const loadout = {};
  for (const id of OPERATOR_IDS) loadout[id] = { primary: DEFAULT_PRIMARY[id], sidearm: id === 'morrow' ? null : 'wren9' };
  return {
    v: SAVE_VERSION,
    created: Date.now(),
    profile: { name: 'OPERATÖR', level: 1, xp: 0, parca: 0 },
    roster: { op: 'vex', loadout },
    campaign: {},          // missionId -> { done, stars: [bool×3], best, plays }
    stats: { missions: 0, kills: 0, heads: 0, shots: 0, hits: 0, deaths: 0, time: 0, byWeapon: {}, byOp: {} },
    settings: {
      quality: 'auto', dynRes: true, bloom: true, lights: true, fps: false,
      vol: { master: 0.8, sfx: 1, ui: 0.7, music: 0.6 },
      haptics: true, uiScale: 1, enemyMark: 'off', reduceMotion: false, shake: 1,
      lang: 'tr', fireRing: 0.78, diff: 'normal',
    },
    hud: { layout: null },  // touch button positions (HUD editor)
  };
}

// Fill in anything missing (new fields in later builds) from a fresh save.
function deepFill(dst, src) {
  for (const k of Object.keys(src)) {
    const v = src[k];
    if (dst[k] === undefined || dst[k] === null && v !== null) dst[k] = structuredClone(v);
    else if (v && typeof v === 'object' && !Array.isArray(v) && dst[k] && typeof dst[k] === 'object') deepFill(dst[k], v);
  }
  return dst;
}

// Older schema versions → current. (v1 is the first; later versions add steps.)
export function migrate(s) {
  if (!s || typeof s !== 'object') throw new Error('not a save');
  if (typeof s.v !== 'number' || s.v > SAVE_VERSION) throw new Error('unknown version');
  // if (s.v === 1) { ...; s.v = 2; }
  // the first builds named every player KÜLKUZGUN; that default is gone
  if (s.profile && s.profile.name === 'KÜLKUZGUN') s.profile.name = 'OPERATÖR';
  return deepFill(s, freshSave());
}

function read(store, key) {
  try { const raw = store.getItem(key); return raw ? migrate(JSON.parse(raw)) : null; } catch { return null; }
}

export class Save {
  constructor(store = globalThis.localStorage) {
    this.store = store;
    this.recovered = false;
    let s = read(store, KEY);
    if (!s) {
      const b = read(store, BAK);
      if (b) { s = b; this.recovered = !!safeGet(store, KEY); }
    }
    this.data = s || freshSave();
    this.timer = null; this.listeners = new Set();
    this.flush();
  }
  get d() { return this.data; }

  // change something: fn(data), then a debounced write and a change event
  set(fn) {
    fn(this.data);
    for (const l of this.listeners) { try { l(this.data); } catch { /* listener error */ } }
    if (this.timer) return;
    this.timer = setTimeout(() => { this.timer = null; this.flush(); }, 120);
  }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  flush() {
    if (!this.store) return;
    try {
      const json = JSON.stringify(this.data);
      // the current main copy becomes the backup if it still parses
      const prev = this.store.getItem(KEY);
      if (prev) { try { JSON.parse(prev); this.store.setItem(BAK, prev); } catch { /* keep the old backup */ } }
      this.store.setItem(KEY, json);
    } catch { /* storage full or unavailable */ }
  }

  reset() { this.data = freshSave(); this.flush(); for (const l of this.listeners) l(this.data); }
}

function safeGet(store, key) { try { return store.getItem(key); } catch { return null; } }

// --- progression helpers ------------------------------------------------------------
// XP needed to go from level n to n+1
export const xpFor = (n) => 400 + (n - 1) * 150;

// Apply a finished mission's result to the save; returns what was earned.
export function applyMission(save, id, r) {
  const out = { xp: 0, parca: 0, levelUps: 0, newStars: 0, firstClear: false };
  save.set((d) => {
    const c = d.campaign[id] || (d.campaign[id] = { done: false, stars: [false, false, false], best: null, plays: 0 });
    c.plays++;
    if (r.done) {
      out.firstClear = !c.done;
      c.done = true;
      r.stars.forEach((on, i) => { if (on && !c.stars[i]) { c.stars[i] = true; out.newStars++; } });
      if (c.best === null || r.time < c.best) c.best = r.time;
      if (r.diff === 'hard') c.hard = true;
    }
    const S = d.stats;
    S.missions += r.done ? 1 : 0; S.kills += r.kills; S.heads += r.heads; S.shots += r.shots; S.hits += r.hits;
    S.deaths += r.deaths; S.time += r.time;
    const o = S.byOp[r.op] || (S.byOp[r.op] = { missions: 0, kills: 0 });
    o.missions += r.done ? 1 : 0; o.kills += r.kills;
    for (const [w, ws] of Object.entries(r.byWeapon || {})) {
      const t = S.byWeapon[w] || (S.byWeapon[w] = { kills: 0, shots: 0, hits: 0, heads: 0 });
      for (const k of Object.keys(t)) t[k] += ws[k] || 0;
    }
    // rewards: a clear, its stars (new ones pay more), and kills
    out.xp = (r.done ? 300 : 60) + r.kills * 12 + r.heads * 6;
    out.parca = (r.done ? 150 : 20) + out.newStars * 100 + r.stars.filter(Boolean).length * 15 + r.kills * 4;
    d.profile.parca += out.parca;
    let xp = d.profile.xp + out.xp;
    while (xp >= xpFor(d.profile.level)) { xp -= xpFor(d.profile.level); d.profile.level++; out.levelUps++; }
    d.profile.xp = xp;
  });
  return out;
}
