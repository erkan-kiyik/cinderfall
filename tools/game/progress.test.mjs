// Progression rules (docs §10.41): the week's tasks, what a level pays, costumes and
// mastery, the finishes' patterns, the easy difficulty. Run: node tools/game/progress.test.mjs
import { WEEKLY, ensureWeekly, claimWeekly, progressDaily, levelReward, COSTUMES, hasCostume, takeCostume, costumeOf, masteryOf, MASTERY, SKINS, PATTERNS, weekKey } from '../../public/game/js/core/economy.js';
import { freshSave, migrate, applyMission, xpFor } from '../../public/game/js/core/save.js';
import { DIFF } from '../../public/game/js/game/ai/brain.js';

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('FAIL', msg); } };
const fakeSave = () => ({ data: freshSave(), get d() { return this.data; }, set(fn) { fn(this.data); } });
const R = (o) => ({ id: 'm1', done: true, diff: 'normal', op: 'vex', stars: [true, true, false], time: 200, kills: 10, heads: 3, shots: 100, hits: 50, deaths: 0, byWeapon: {}, par: 300, ...o });

{ // the week: three tasks, the same three all week, progress from results, the third claimed brings a crate
  const s = fakeSave();
  ensureWeekly(s);
  ok(s.d.weekly.week === weekKey() && s.d.weekly.tasks.length === 3, 'three tasks this week');
  ok(new Set(s.d.weekly.tasks.map((k) => k.id)).size === 3, 'three different tasks');
  const ids = s.d.weekly.tasks.map((k) => k.id).join();
  ensureWeekly(s);
  ok(s.d.weekly.tasks.map((k) => k.id).join() === ids, 'the same three on a second look');
  for (const k of s.d.weekly.tasks) k.n = WEEKLY[k.id].goal - 1;
  ok(claimWeekly(s, 0) === null, 'not done: nothing to claim');
  for (const k of s.d.weekly.tasks) k.n = WEEKLY[k.id].goal;
  const p0 = s.d.profile.parca, a = claimWeekly(s, 0), b = claimWeekly(s, 1);
  ok(a && !a.crate && b && !b.crate, 'the first two pay PARÇA only');
  ok(claimWeekly(s, 0) === null, 'a task claimed once');
  const c = claimWeekly(s, 2);
  ok(c && c.crate === 'plus' && s.d.inv.crates.plus === 1, 'the third brings a Gelişmiş crate');
  ok(s.d.profile.parca === p0 + a.parca + b.parca + c.parca, 'PARÇA adds up');
  ok(s.d.stats.weeks === 1, 'a full week counted');
}
{ // results move the week's counters
  const s = fakeSave(); ensureWeekly(s);
  s.d.weekly.tasks = Object.keys(WEEKLY).map((id) => ({ id, n: 0, claimed: false }));
  progressDaily(s.d, R({ id: 'm3', diff: 'hard', kills: 12, heads: 4 }));
  const n = Object.fromEntries(s.d.weekly.tasks.map((k) => [k.id, k.n]));
  ok(n.wkills === 12 && n.wheads === 4 && n.wmissions === 1 && n.wstars === 2, 'kills, heads, missions, stars');
  ok(n.wboss === 1 && n.whard === 1, 'mission 3 on hard: a boss mission, a hard one');
  progressDaily(s.d, { endless: true, wave: 7, kills: 30, heads: 2, shots: 300, done: false, stars: [false, false, false] });
  ok(s.d.weekly.tasks.find((k) => k.id === 'wendless').n === 7, 'endless waves');
}
{ // a level pays: PARÇA every time, a crate on every fifth, a better one on every tenth
  ok(levelReward(2).parca > 0 && !levelReward(2).crate, 'level 2: PARÇA');
  ok(levelReward(5).crate === 'std' && levelReward(10).crate === 'plus', 'levels 5 and 10: crates');
  const s = fakeSave();
  s.d.profile.xp = xpFor(1) - 10;
  const g = applyMission(s, 'm1', R());
  ok(g.levelUps >= 1 && g.levelPay.length === g.levelUps && g.levelPay[0].level === 2, 'the level-up is reported with its pay');
  ok(s.d.profile.parca === g.parca + g.levelPay.reduce((x, y) => x + y.parca, 0), 'the level pay is in the PARÇA');
}
{ // costumes: standard for all, two bought, one earned with mastery
  const s = fakeSave();
  ok(COSTUMES[0].id === 'std' && hasCostume(s.d, 'vex', 'std'), 'standard is everyone\'s');
  ok(!hasCostume(s.d, 'vex', 'night') && !takeCostume(s, 'vex', 'night'), 'no PARÇA, no costume');
  s.d.profile.parca = 5000;
  ok(takeCostume(s, 'vex', 'night') && s.d.profile.parca === 5000 - COSTUMES.find((c) => c.id === 'night').price, 'bought');
  ok(costumeOf(s.d, 'vex').id === 'night' && costumeOf(s.d, 'hale').id === 'std', 'worn by that operator only');
  ok(takeCostume(s, 'vex', 'std') && takeCostume(s, 'vex', 'night') && s.d.profile.parca === 5000 - 1500, 'changing back and forth costs nothing');
  const earned = COSTUMES.find((c) => c.mastery);
  ok(!takeCostume(s, 'vex', earned.id), 'the earned one is locked at first');
  s.d.stats.byOp.vex = { missions: 30, kills: 500 };
  ok(masteryOf(s.d, 'vex').lvl >= earned.mastery && takeCostume(s, 'vex', earned.id), 'mastery opens it');
  ok(masteryOf(s.d, 'brick').lvl === 0 && masteryOf(s.d, 'brick').next === MASTERY[1], 'mastery 0 at the start');
}
{ // finishes: patterns are known kinds; every rarity a crate can roll has a finish
  ok(SKINS.filter((k) => k.pat).every((k) => Object.values(PATTERNS).includes(k.pat)), 'patterns are known');
  for (const r of ['common', 'rare', 'epic', 'legendary', 'mythic', 'ultra']) ok(SKINS.some((k) => k.rar === r && k.id !== 'factory'), `a finish of rarity ${r}`);
}
{ // easy: kinder than normal in every way
  const E = DIFF.easy, N = DIFF.normal;
  ok(E && E.reaction > N.reaction && E.errMax > N.errMax && E.tokens <= N.tokens && E.dmg < N.dmg, 'easy is easier');
}
{ // an old save gets the new fields
  const old = freshSave(); delete old.weekly; delete old.roster.costume; delete old.tutorial; delete old.settings.aimAssist;
  const m = migrate(JSON.parse(JSON.stringify(old)));
  ok(m.weekly && m.roster.costume && m.tutorial === false && m.settings.aimAssist === 'low', 'migrate fills weekly, costumes, tips, aim help');
}
console.log(`progress: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
