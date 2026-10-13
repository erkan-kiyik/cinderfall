// Gun state machine tests for the LAB. Run: node tools/lab/guns.test.mjs
import { Gun, GUNS } from '../../public/lab/js/game/guns.js';

const DT = 1 / 120;
let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) passes++; else { fails++; console.log('FAIL', msg); } };
const near = (a, b, e) => Math.abs(a - b) <= e;
// seeded rng so spread checks are repeatable
const seeded = (s = 1) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
function run(g, sec, f) {
  const out = [], n = Math.round(sec / DT);
  for (let i = 0; i < n; i++) for (const e of g.update(DT, f(i * DT, i))) out.push({ ...e, t: i * DT });
  return out;
}
const I = (o = {}) => ({ trigger: false, pressed: false, reload: false, moving: 0, air: 0, crouch: 0, ...o });
const count = (ev, type) => ev.filter((e) => e.type === type).length;

// 1. full-auto: fire rate matches rpm, the mag empties, then auto reload
{ const g = new Gun('kestrel', { rng: seeded() });
  const ev = run(g, 1.0, (t) => I({ trigger: true, pressed: t === 0 }));
  const shots = count(ev, 'fire'), want = Math.floor(1.0 / (60 / GUNS.kestrel.rpm)) + 1;
  ok(Math.abs(shots - want) <= 1, `auto rate: ${shots} shots in 1 s, want ~${want}`);
  const ev2 = run(g, 4.5, () => I({ trigger: true }));
  ok(g.reserve === 120 && g.ammo > 0, `auto: emptied and reloaded (ammo ${g.ammo}, reserve ${g.reserve})`);
  ok(count(ev2, 'magOut') === 1 && count(ev2, 'magIn') === 1 && count(ev2, 'charge') === 1, 'empty reload: mag out, mag in, charging handle');
  ok(count(ev2, 'dry') >= 1, 'dry click when the mag runs out'); }
// 2. semi-auto needs a press per shot; presses during the cooldown are buffered
{ const g = new Gun('wren9');
  const ev = run(g, 1.0, () => I({ trigger: true }));
  ok(count(ev, 'fire') === 0, 'semi: holding without a press does not fire');
  const ev2 = run(g, 0.5, (t, i) => I({ trigger: true, pressed: i % 6 === 0 }));
  const cd = 60 / GUNS.wren9.rpm;
  ok(count(ev2, 'fire') === Math.floor(0.5 / cd) + 1 || count(ev2, 'fire') === Math.floor(0.5 / cd), `semi: spam limited by rpm (${count(ev2, 'fire')})`); }
// 3. tactical reload keeps the chambered count, takes the right time
{ const g = new Gun('kestrel');
  run(g, 0.3, (t) => I({ trigger: true, pressed: t === 0 }));
  const left = g.ammo, res = g.reserve;
  let done = -1;
  run(g, 3, (t, i) => { if (done < 0 && g.state === 'idle' && i > 2) done = t; return I({ reload: i === 0 }); });
  ok(g.ammo === 30 && g.reserve === res - (30 - left), `tac reload: ammo ${g.ammo}, reserve ${g.reserve}`);
  ok(near(done, GUNS.kestrel.reload, 0.02), `tac reload time ${done.toFixed(2)} s`); }
// 4. pump: one shot, then a pump cycle that ejects; no fire during the pump
{ const g = new Gun('ramrod');
  const ev = run(g, 0.3, (t, i) => I({ trigger: true, pressed: i % 3 === 0 }));
  ok(count(ev, 'fire') === 1 && g.state === 'pump', 'pump: spam fires once, then pumps');
  const ev2 = run(g, 0.4, () => I());
  ok(count(ev, 'eject') + count(ev2, 'eject') === 1 && g.state === 'idle', 'pump: ejects one shell, then ready');
  const shot = ev.find((e) => e.type === 'fire');
  ok(shot.dirs.length === 9, 'pump: 9 pellets'); }
// 5. shotgun reload: shell by shell, the trigger interrupts after the current shell
{ const g = new Gun('ramrod');
  for (let k = 0; k < 4; k++) run(g, 0.8, (t) => I({ trigger: true, pressed: t === 0 }));
  ok(g.ammo === 2, `shotgun after 4 shots: ${g.ammo}`);
  let ev = run(g, 0.3 + 0.5 * 2.5, (t, i) => I({ reload: i === 0 }));
  ok(count(ev, 'shellIn') === 2 && g.ammo === 4, `shells in after 2.5 cycles: ${count(ev, 'shellIn')} (ammo ${g.ammo})`);
  ev = run(g, 0.05, () => I({ trigger: true, pressed: true }));
  ev = run(g, 1.2, () => I());
  ok(g.ammo === 5 && g.state === 'idle', `interrupt: finishes the shell in hand (ammo ${g.ammo})`); }
// 6. recoil climbs while spraying and recovers after
{ const g = new Gun('kestrel', { rng: seeded(7) });
  run(g, 0.6, () => I({ trigger: true }));
  const peak = g.recoil;
  run(g, 1.0, () => I());
  ok(peak > 0.1 && g.recoil < peak * 0.05, `recoil climb ${peak.toFixed(3)} → ${g.recoil.toFixed(4)}`); }
// 7. spread grows with movement and air
{ const spreadOf = (o) => { const g = new Gun('marksman', { rng: seeded(3) }); let m = 0;
    for (let k = 0; k < 40; k++) { g.ammo = 10; g.recoil = 0; g.bloom = 0; g.cd = 0; g.spray = 0; const ev = g.update(DT, I({ pressed: true, ...o })); const f = ev.find((e) => e.type === 'fire'); if (f) m = Math.max(m, Math.abs(f.dirs[0])); }
    return m; };
  const still = spreadOf({}), moving = spreadOf({ moving: 1 }), air = spreadOf({ air: 1 });
  ok(still < 0.004 && moving > still * 4 && air > moving, `spread still ${still.toFixed(4)} moving ${moving.toFixed(4)} air ${air.toFixed(4)}`); }
// 8. cancel mid-reload with the mag out leaves the gun empty
{ const g = new Gun('kestrel'); g.ammo = 12;
  run(g, 0.8, (t, i) => I({ reload: i === 0 }));
  g.cancel();
  ok(g.ammo === 0 && g.state === 'idle', `cancel after mag out: ammo ${g.ammo}`); }
// 9. pistol slide locks back on the last round and releases on reload
{ const g = new Gun('wren9'); g.ammo = 1;
  run(g, 0.1, (t) => I({ pressed: t === 0 }));
  ok(g.locked && g.slide === 1, 'slide locked back on empty');
  run(g, 2, () => I());
  ok(!g.locked && g.ammo === 15, 'slide released after the reload'); }
// 10. reload pressed during the pump happens right after it
{ const g = new Gun('ramrod');
  run(g, 0.05, (t) => I({ pressed: t === 0 }));
  run(g, 0.05, (t) => I({ reload: t === 0 }));
  run(g, 0.5, () => I());
  ok(g.state === 'reload', `buffered reload after the pump (${g.state})`); }
console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
