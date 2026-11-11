/* Agencias de eSports y de representación, negociación de contratos y mánager. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
function agency(MV, seed, type, cash) {
  const g = MV.newGame({ seed }); g.p.age = 30; g.p.money = 1e8; g.queue = []; g.p.housing = 'propia';
  MV.sys.company.found(g, type, 'Agencia');
  const c = g.p.companies[g.p.companies.length - 1];
  if (cash) MV.sys.company.inject(g, c.id, cash);
  return { g, c };
}
const A = (MV) => MV.sys.agency;
const year = (MV, g) => { g.p.age++; g.queue = []; MV.sys.company.yearly(g); };
const pro = (n, skill) => ({ id: 'x' + n, first: 'A', last: 'B', gender: 'm', alias: 'Zz' + n, skill, salary: skill * 1500, age: 20 });

test('fichar y vender jugadores cobra y paga lo justo y no pasa de 5', () => {
  const MV = load({ seed: 1 });
  const { g, c } = agency(MV, 1, 'esports', 1e6);
  const list = A(MV).players(g, c.id);
  assert.equal(list.length, 3);
  assert.deepEqual(A(MV).players(g, c.id), list, 'los mismos jugadores durante el año');
  list.forEach((x) => { assert.ok(x.skill >= 30 && x.skill <= 95); assert.equal(x.salary, A(MV).wage(x.skill)); assert.ok(x.alias); });
  const first = list[0];
  assert.ok(!BAD_TEXT.test(A(MV).sign(g, c.id, 0)));
  assert.equal(c.roster[0].alias, first.alias);
  for (let i = 0; i < 6; i++) c.roster.push(pro(i, 50));
  c.roster = c.roster.slice(0, 5);
  assert.match(A(MV).sign(g, c.id, 0), /5/);
  const cash = c.cash, who = c.roster[1];
  assert.ok(!BAD_TEXT.test(A(MV).sellPlayer(g, c.id, who.id)));
  assert.equal(c.cash, cash + who.skill * 3000);
  assert.equal(c.roster.length, 4);
  const sal = c.roster.reduce((s, x) => s + x.salary, 0);
  MV.sys.company.register('esports', Object.assign({}, MV.sys.company.hooks.esports, { revenue: () => 0 }));
  const cash2 = c.cash; year(MV, g);
  assert.equal(c.last.costs, sal + 25000, 'el plantel cobra desde la caja');
  assert.equal(c.cash, cash2 - sal - 25000);
});

test('un plantel mejor sale mejor ubicado en promedio', () => {
  const MV = load({ seed: 2 });
  const avg = (skill) => {
    let s = 0;
    for (let i = 0; i < 60; i++) { const { g, c } = agency(MV, 100 + i, 'esports', 1e7); for (let k = 0; k < 5; k++) c.roster.push(pro(k, skill)); s += A(MV).season(g, c).place; }
    return s / 60;
  };
  const top = avg(95), bad = avg(35);
  assert.ok(top < bad - 2, `estrellas ${top} vs amateurs ${bad}`);
  const { g, c } = agency(MV, 3, 'esports', 1e6);
  c.roster.push(pro(1, 90), pro(2, 90));
  assert.deepEqual(A(MV).season(g, c), { league: null, place: 0, prize: 0 }, 'con menos de 3 no compite');
});

test('la reputación sube con buenos puestos y cambia la liga', () => {
  const MV = load({ seed: 4 });
  const { g, c } = agency(MV, 4, 'esports', 1e7);
  for (let k = 0; k < 5; k++) c.roster.push(pro(k, 95));
  c.staff.push({ id: 'e1', role: 'entrenador', level: 5, salary: 1, first: 'A', last: 'B', gender: 'f', morale: 70 });
  assert.equal(A(MV).season(g, c).league, 'regional');
  c.rep = 50; assert.equal(A(MV).season(g, c).league, 'internacional');
  c.rep = 80; const s = A(MV).season(g, c);
  assert.equal(s.league, 'mundial');
  if (s.place === 1) assert.ok(s.prize >= 500000 && s.prize <= 2000000);
  c.rep = 10; const r0 = c.rep; const s2 = A(MV).season(g, c);
  assert.equal(c.rep, Math.max(0, Math.min(100, r0 + (5 - s2.place) * 3)));
});

test('el gamer profesional puede jugar en su propio equipo', () => {
  const MV = load({ seed: 5 });
  const { g, c } = agency(MV, 5, 'esports', 1e6);
  assert.match(A(MV).joinOwnTeam(g, c.id), /profesional/i);
  g.p.job = { id: 'sport_esports', level: 1, salary: 50000, perf: 60, years: 1, lvlYears: 1, type: 'sport', start: 28, club: 'Otro' };
  assert.ok(!BAD_TEXT.test(A(MV).joinOwnTeam(g, c.id)));
  assert.equal(c.selfPlay, true);
  c.roster.push(pro(1, 60), pro(2, 60));
  assert.notEqual(A(MV).season(g, c).league, null, 'contigo son 3: compiten');
});

test('firmar un cliente depende de la comisión', () => {
  const MV = load({ seed: 6 });
  const rate = (com) => {
    let ok = 0;
    for (let i = 0; i < 80; i++) { const { g, c } = agency(MV, 300 + i, 'representacion', 1e6); c.rep = 10; A(MV).talents(g, c.id); const msg = A(MV).signClient(g, c.id, 0, com); assert.ok(!BAD_TEXT.test(msg), msg); if ((c.clients || []).length) ok++; }
    return ok;
  };
  const cheap = rate(0.1), greedy = rate(0.2);
  assert.ok(cheap > greedy + 10, `10 %: ${cheap} vs 20 %: ${greedy}`);
  const { g, c } = agency(MV, 7, 'representacion', 1e6);
  c.rep = 100; const t = A(MV).talents(g, c.id)[0];
  A(MV).signClient(g, c.id, 0, 0.5);
  assert.equal(c.clients[0].commission, 0.2, 'la comisión se limita a 20 %');
  assert.equal(c.clients[0].first, t.first);
});

test('la agencia cobra la comisión de sus clientes cada año', () => {
  const MV = load({ seed: 8 });
  const { g, c } = agency(MV, 8, 'representacion', 1e6);
  c.clients = [{ id: 'k1', first: 'Ana', last: 'Paz', gender: 'f', prof: 'actor', level: 3, salary: 400000, commission: 0.15, left: 3 },
    { id: 'k2', first: 'Leo', last: 'Sol', gender: 'm', prof: 'deportista', level: 2, salary: 150000, commission: 0.1, left: 3 }];
  year(MV, g);
  assert.equal(c.last.revenue, Math.round(400000 * 0.15) + Math.round(150000 * 0.1));
});

test('negociar: amenazar sube más pero puede perder el contrato; aceptar siempre sube un poco', () => {
  const MV = load({ seed: 9 });
  const who = { level: 3, carisma: 50, lawyer: 1 };
  assert.deepEqual(A(MV).negotiate({}, 'aceptar', who), { ok: true, factor: 1.05 });
  let lost = 0, big = 0, mas = 0;
  for (let i = 0; i < 300; i++) {
    const t = A(MV).negotiate({}, 'amenazar', who);
    if (t.ok) { big++; assert.ok(t.factor >= 1.4 && t.factor <= 1.8); } else { lost++; assert.equal(t.factor, 0.3); }
    const m = A(MV).negotiate({}, 'mas', who);
    if (m.ok) { mas++; assert.ok(m.factor >= 1.15 && m.factor <= 1.35); } else assert.equal(m.factor, 0.9);
  }
  assert.ok(lost > 50 && big > 50, `amenazar: ${big} bien, ${lost} mal`);
  assert.ok(mas > big, 'pedir más sale bien más seguido que amenazar');
  const charm = (car) => { let ok = 0; for (let i = 0; i < 300; i++) if (A(MV).negotiate({}, 'mas', { level: 1, carisma: car, lawyer: 0 }).ok) ok++; return ok; };
  assert.ok(charm(100) > charm(0) + 30, 'el Carisma ayuda');
});

test('renovar_contrato aplica la negociación y aguanta que el cliente ya se haya ido', () => {
  const MV = load({ seed: 10 });
  const { g, c } = agency(MV, 10, 'representacion', 1e6);
  c.clients = [{ id: 'k1', first: 'Ana', last: 'Paz', gender: 'f', prof: 'musico', level: 3, salary: 300000, commission: 0.15, left: 0 }];
  MV.EV.push(g, 'renovar_contrato', { company: c.id, client: 'k1' }, true);
  const v = MV.EV.view(g);
  assert.equal(v.choices.length, 3); assert.ok(!BAD_TEXT.test(v.text), v.text);
  MV.EV.choose(g, 1);
  assert.equal(c.clients[0].salary, Math.round(300000 * 1.05));
  assert.ok(c.clients[0].left >= 2);
  MV.EV.push(g, 'renovar_contrato', { company: c.id, client: 'k1' }, true);
  c.clients = [];
  const res = MV.EV.choose(g, 0);
  assert.ok(res && !BAD_TEXT.test(res.msg), res && res.msg);
});

test('cuando vence un contrato llega la renovación y los clientes pueden irse', () => {
  const MV = load({ seed: 11 });
  let renew = 0, left = 0;
  for (let i = 0; i < 60; i++) {
    const { g, c } = agency(MV, 500 + i, 'representacion', 1e6);
    c.clients = [{ id: 'k1', first: 'Ana', last: 'Paz', gender: 'f', prof: 'actor', level: 2, salary: 100000, commission: 0.1, left: 1 }];
    year(MV, g);
    if (g.queue.some((q) => q.id === 'renovar_contrato')) renew++;
    for (let y = 0; y < 15; y++) year(MV, g);
    if (!c.clients.length) left++;
  }
  assert.ok(renew > 40, 'renovaciones: ' + renew);
  assert.ok(left > 5, 'se fueron: ' + left);
});

// ——— Tu carrera: mánager o representarte a ti mismo ———
function athlete(MV, seed) {
  const g = MV.newGame({ seed }); g.p.age = 24; g.p.money = 1e6; g.queue = [];
  g.p.skills.deporte = 95; g.p.stats.health = 100; g.p.club = 'futbol'; g.p.sportsExp = { futbol: 10 };
  g.p.job = { id: 'sport_futbol', level: 1, salary: 100000, perf: 70, years: 3, lvlYears: 3, type: 'sport', start: 21, club: 'Club Uno' };
  return g;
}

test('el mánager cobra 10 % y mejora las ofertas en promedio', () => {
  const MV = load({ seed: 20 });
  const best = (withMgr) => {
    let s = 0, n = 0;
    for (let i = 0; i < 60; i++) {
      const g = athlete(MV, 700 + i);
      if (withMgr) MV.sys.agency.hireManager(g);
      const offers = MV.sys.sports.teamOffers(g);
      if (offers.length) { s += Math.max(...offers.map((o) => o.salary)); n++; }
    }
    return s / Math.max(1, n);
  };
  const a = best(true), b = best(false);
  assert.ok(a > b * 1.08, `con mánager ${a} vs sin ${b}`);
  const g = athlete(MV, 21);
  assert.ok(!BAD_TEXT.test(MV.sys.agency.hireManager(g)));
  assert.equal(g.p.manager.fee, 0.1);
  assert.equal(MV.sys.agency.managerFee(g), 10000);
  assert.match(MV.sys.agency.hireManager(g), /ya tienes/i);
  assert.ok(!BAD_TEXT.test(MV.sys.agency.fireManager(g)));
  assert.equal(g.p.manager, null);
  assert.equal(MV.sys.agency.managerFee(g), 0);
});

test('con mánager, los sueldos de la fama suben y si pierdes la carrera el mánager se va', () => {
  const MV = load({ seed: 22 });
  const avg = (mgr) => {
    let s = 0, n = 0;
    for (let i = 0; i < 80; i++) {
      const g = MV.newGame({ seed: 800 + i }); g.p.age = 30; g.queue = [];
      const J = MV.FAME.actor;
      const job = { id: 'actor', level: 2, salary: 1, perf: 60, years: 2, lvlYears: 2, type: 'fame', start: 28 };
      g.p.job = job;
      if (mgr) MV.sys.agency.hireManager(g);
      MV.sys.career.yearlySpecial(g, J);
      s += job.salary; n++;
    }
    return s / n;
  };
  assert.ok(avg(true) > avg(false) * 1.08);
  const g = athlete(MV, 23);
  MV.sys.agency.hireManager(g);
  g.p.job = null;
  assert.equal(MV.sys.agency.managerFee(g), 0);
  assert.equal(g.p.manager, null, 'sin carrera, el mánager se va');
});

test('sin trabajo de deporte o fama no se contrata mánager', () => {
  const MV = load({ seed: 24 });
  const g = MV.newGame({ seed: 24 }); g.p.age = 30;
  assert.match(MV.sys.agency.hireManager(g), /deport|fama|famos/i);
  g.p.job = { id: MV.JOBS[0].id, level: 0, salary: 30000, perf: 50, years: 1, lvlYears: 1, type: 'full', start: 29 };
  assert.match(MV.sys.agency.hireManager(g), /deport|fama|famos/i);
  assert.equal(g.p.manager || null, null);
});

test('negociar tu propio contrato cambia tu sueldo según la decisión', () => {
  const MV = load({ seed: 25 });
  const g = athlete(MV, 25);
  const act = () => MV.sys.career.actions(g).find((a) => a.id === 'negociar_propio');
  assert.ok(act(), 'sin mánager puedes negociar tú');
  const res = MV.doAction(g, act());
  assert.ok(!BAD_TEXT.test(res.msg), res.msg);
  const v = MV.EV.view(g);
  assert.equal(v.id, 'negociar_propio'); assert.equal(v.choices.length, 3);
  assert.ok(!BAD_TEXT.test(v.text), v.text);
  MV.EV.choose(g, 1);
  assert.equal(g.p.job.salary, Math.round(100000 * 1.05));
  MV.sys.agency.hireManager(g);
  assert.ok(!act(), 'con mánager negocia él');
  assert.ok(MV.sys.career.actions(g).find((a) => a.id === 'despedir_manager'));
});
