// The daily reward card (docs §10.40). Run: node tools/game/login.test.mjs
import { LOGIN, loginCard, loginReady, claimLogin, dayKey } from '../../public/game/js/core/economy.js';
import { freshSave, migrate } from '../../public/game/js/core/save.js';

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('FAIL', msg); } };
const fakeSave = () => { const s = { data: freshSave(), get d() { return this.data; }, set(fn) { fn(this.data); } }; return s; };
const day = (n) => new Date(2026, 0, 1 + n, 12);

{ // seven days in a row: every box once, the stock and PARÇA add up
  const s = fakeSave();
  let parca = 0; const crates = { std: 0, plus: 0, crow: 0 };
  for (let i = 0; i < 7; i++) {
    ok(loginReady(s.d, day(i)), `day ${i + 1} ready`);
    ok(loginCard(s.d, day(i)).today === i, `day ${i + 1}: box ${i} is today's`);
    const got = claimLogin(s, day(i));
    ok(got && got.i === i, `day ${i + 1} gives box ${i}`);
    ok(claimLogin(s, day(i)) === null, `day ${i + 1}: a second take gives nothing`);
    ok(!loginReady(s.d, day(i)), `day ${i + 1}: taken`);
    parca += LOGIN[i].parca || 0; if (LOGIN[i].crate) crates[LOGIN[i].crate]++;
  }
  ok(s.d.profile.parca === parca, `PARÇA ${s.d.profile.parca} = ${parca}`);
  ok(JSON.stringify(s.d.inv.crates) === JSON.stringify(crates), 'crates in stock');
  const st = loginCard(s.d, day(6));
  ok(st.stamped === 7 && st.week === 1 && !st.ready, 'after the seventh: the full card shows, week 1');
  const nx = loginCard(s.d, day(7));
  ok(nx.stamped === 0 && nx.week === 2 && nx.ready && nx.today === 0, 'the next day: a new card, week 2');
  ok(claimLogin(s, day(7)).i === 0, 'week 2 starts at box 0');
}
{ // a missed day does not wipe the card
  const s = fakeSave();
  claimLogin(s, day(0)); claimLogin(s, day(1));
  const st = loginCard(s.d, day(5));
  ok(st.ready && st.today === 2 && st.stamped === 2, 'after a gap the next box waits');
  ok(claimLogin(s, day(5)).i === 2, 'the gap takes box 2');
}
{ // an old save without the field is filled in
  const old = freshSave(); delete old.login;
  const m = migrate(JSON.parse(JSON.stringify(old)));
  ok(m.login && m.login.n === 0 && m.login.day === '' && loginReady(m, day(0)), 'an old save gets an empty card, today\'s box ready');
}
ok(dayKey(day(0)) === '2026-01-01', 'day keys are local dates');
console.log(`login: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
