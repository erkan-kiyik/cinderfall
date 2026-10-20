// Interface string checks for KOR. Run: node tools/game/i18n.test.mjs
//
// Every key the menus ask for must exist in every language, with the same
// {placeholders}. Keys come from the sources (t('…') calls) plus the dynamic
// families expanded from the catalogue data.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tr from '../../public/game/js/ui/lang/tr.js';
import en from '../../public/game/js/ui/lang/en.js';
import { OPS, WEAPON_LIST, MISSIONS, CRATES } from '../../public/game/js/ui/data.js';
import { HUD_KEYS } from '../../public/game/js/ui/screens/hudedit.js';
import { SKINS, TASKS } from '../../public/game/js/core/economy.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/game/js');
let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) passes++; else { fails++; console.log('FAIL', msg); } };

// 1. static keys in the sources
const files = [path.join(ROOT, 'app.js')];
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (f !== 'lang') walk(p); } else if (f.endsWith('.js')) files.push(p); } };
walk(path.join(ROOT, 'ui'));
walk(path.join(ROOT, 'game'));
walk(path.join(ROOT, 'cine'));
const used = new Set(), dynamic = [];
const NS = /(?<!h\()'((?:ui|app|nav|hub|lobby|play|camp|prep|stat|ops|ars|att|trader|prof|res|set|hud|game|story|cine)\.[\w.]+)'/g;
const src = {};
for (const f of files) {
  const s = src[f] = fs.readFileSync(f, 'utf8').replace(/^\s*\/\/.*$/gm, '');
  for (const m of s.matchAll(/\bt\(\s*'([^']+)'/g)) used.add(m[1]);
  // keys passed around as data (section tables, ternaries inside t())
  for (const m of s.matchAll(NS)) used.add(m[1]);
  for (const m of s.matchAll(/\bt\(\s*`([^`]+)`/g)) dynamic.push(m[1]);
}
ok(used.size > 150, `found ${used.size} static keys`);

// 2. dynamic families, expanded from the data
const add = (k) => used.add(k);
for (const o of OPS) {
  add(`role.${o.role}`); for (const f of ["bio", "job", "night", "keep", "quote"]) add(`op.${o.id}.${f}`);
  for (const [k] of o.abil) { add(`ab.${o.id}.${k}`); add(`ab.${o.id}.${k}.d`); }
}
for (const w of WEAPON_LIST) { add(`cls.${w.cls}`); add(`wpn.${w.id}`); }
for (const s of SKINS) add(`skin.${s.id}`);
for (const k of Object.keys(TASKS)) add(`daily.${k}`);
for (const k of ['weapon', 'skin', 'crate']) add(`trader.kind.${k}`);
for (const m of MISSIONS) {
  add(`mission.${m.id}`); add(`mission.${m.id}.where`); add(`camp.act${m.act}`);
  if (m.ready) { add(`mission.${m.id}.brief`); for (let i = 1; i <= 4; i++) add(`mission.${m.id}.o${i}`); }
}
for (const c of CRATES) { add(`crate.${c.id}`); add(`crate.${c.id}.k`); for (const [r] of c.odds) add(`rar.${r}`); }
for (const k of Object.values(HUD_KEYS)) add(k);
for (const k of ['normal', 'hard']) add(`diff.${k}`);
for (const k of ['semi', 'auto', 'pump']) add(`mode.fire.${k}`);
for (const k of ['sight', 'barrel', 'mag', 'under']) add(`att.${k}`);
for (const k of ['campaign', 'daily', 'endless']) { add(`mode.${k}`); add(`mode.${k}.kicker`); add(`mode.${k}.desc`); }
const list = (file, re) => [...(src[path.join(ROOT, 'ui/screens', file)].match(re)?.[1] ?? '').matchAll(/'(\w+)'/g)].map((m) => m[1]);
const profTabs = list('profile.js', /TABS = \[([^\]]+)\]/);
const setTabs = [...src[path.join(ROOT, 'ui/screens/settings.js')].matchAll(/\['(\w+)', '\w+'\]/g)].map((m) => m[1]);
const achs = [...src[path.join(ROOT, 'ui/screens/profile.js')].matchAll(/\['(\w+)', \(/g)].map((m) => m[1]);
ok(profTabs.length === 5 && setTabs.length === 6 && achs.length === 8, `families: ${profTabs.length} profile tabs, ${setTabs.length} settings tabs, ${achs.length} achievements`);
for (const k of profTabs) add(`prof.${k}`);
for (const k of setTabs) add(`set.${k}`);
for (const k of achs) { add(`ach.${k}`); add(`ach.${k}.d`); }

// every dynamic template must be one of the families above
const FAMILIES = /^(role|op|ab|cls|wpn|mission|camp\.act|crate|rar|diff|mode|att|prof|set|ach|hud|skin|daily|trader\.kind)[.$]/;
for (const d of dynamic) ok(FAMILIES.test(d), `dynamic key family known: ${d}`);

// 3. every key in every language, with matching placeholders
const holes = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
for (const [name, L] of Object.entries({ tr, en })) {
  const missing = [...used].filter((k) => typeof L[k] !== 'string' || !L[k].trim());
  ok(missing.length === 0, `${name}: missing ${missing.join(' ')}`);
}
const extra = Object.keys(en).filter((k) => !(k in tr));
ok(extra.length === 0, `en keys not in tr: ${extra.join(' ')}`);
const notEn = Object.keys(tr).filter((k) => !(k in en));
ok(notEn.length === 0, `tr keys not in en: ${notEn.join(' ')}`);
for (const k of Object.keys(tr)) if (k in en) ok(holes(tr[k]) === holes(en[k]), `placeholders match for ${k}: ${holes(tr[k])} vs ${holes(en[k])}`);
const unused = Object.keys(tr).filter((k) => !used.has(k));
ok(unused.length === 0, `unused keys: ${unused.join(' ')}`);

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
