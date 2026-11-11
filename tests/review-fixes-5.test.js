/* Correcciones de la revisión final de la Parte B. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
function boss(MV, seed, money) {
  const g = MV.newGame({ seed }); g.p.age = 30; g.p.money = money == null ? 1e7 : money; g.queue = []; g.p.housing = 'propia';
  return g;
}
const C = (MV) => MV.sys.company;
const last = (g) => g.p.companies[g.p.companies.length - 1];

test('B1: mover la caja actualiza la valuación: sacar todo y vender no crea dinero ni cuenta doble', () => {
  const MV = load({ seed: 1 });
  const g = boss(MV, 1, 100000);
  for (let i = 0; i < 5; i++) {
    C(MV).found(g, 'estudio', 'Loop');
    const c = last(g);
    const w0 = MV.netWorth(g);
    C(MV).withdraw(g, c.id, c.cash);
    assert.equal(MV.netWorth(g), w0, 'sacar dividendos no cambia el patrimonio');
    assert.equal(c.value, 0);
    C(MV).sell(g, c.id);
  }
  assert.ok(g.p.money <= 100000, 'fundar, vaciar y vender no da plata: ' + g.p.money);
  C(MV).found(g, 'apps', 'Inyectada');
  const c = last(g), w1 = MV.netWorth(g);
  C(MV).inject(g, c.id, 20000);
  assert.equal(MV.netWorth(g), w1, 'inyectar no cambia el patrimonio');
});

test('B2: de una empresa que cotiza solo te llevas tu parte de la caja', () => {
  const MV = load({ seed: 2 });
  const g = boss(MV, 2);
  C(MV).found(g, 'representacion', 'Agencia');
  const c = last(g);
  C(MV).inject(g, c.id, 9960000);
  c.since = g.p.age - 3;
  MV.sys.market.ensure(g);
  MV.sys.market.ipo(g, c.id, 0.4);
  const m = g.p.money, cash = c.cash;
  C(MV).withdraw(g, c.id, cash);
  assert.equal(g.p.money, m + Math.round(cash * 0.6));
  assert.equal(c.cash, 0);
  C(MV).inject(g, c.id, 1000000);
  const m2 = g.p.money;
  C(MV).close(g, c.id);
  assert.equal(g.p.money, m2 + Math.round(1000000 * 0.6));
});

test('B3: fichar un jugador de eSports cuesta lo mismo que venderlo (no hay plata gratis)', () => {
  const MV = load({ seed: 3 });
  const g = boss(MV, 3);
  C(MV).found(g, 'esports', 'Equipo');
  const c = last(g);
  C(MV).inject(g, c.id, 1000000);
  const cash0 = c.cash, list = MV.sys.agency.players(g, c.id), fee = list[0].skill * 3000;
  MV.sys.agency.sign(g, c.id, 0);
  assert.equal(c.cash, cash0 - fee);
  MV.sys.agency.sellPlayer(g, c.id, c.roster[0].id);
  assert.equal(c.cash, cash0, 'comprar y vender en el mismo año queda en cero');
  c.cash = 1000;
  assert.match(MV.sys.agency.sign(g, c.id, 0), /caja/i);
});

test('B4: la negociación propia y el mánager duran para la fama y los deportes con premios', () => {
  const MV = load({ seed: 4 });
  const paid = (jobId, type, deal, mgr) => {
    const g = boss(MV, 40);
    g.p.job = { id: jobId, level: 2, salary: 1, perf: 60, years: 2, lvlYears: 2, type, start: 28, club: 'X' };
    if (deal) g.p.job.deal = deal;
    if (mgr) g.p.manager = { first: 'A', last: 'B', gender: 'f', fee: 0.1 };
    if (type === 'fame') MV.sys.career.yearlySpecial(g, MV.FAME[jobId]); else MV.sys.sports.careerYearly(g, MV.jobById(jobId));
    return g.p.job.salary;
  };
  assert.ok(Math.abs(paid('actor', 'fame', 1.5) - paid('actor', 'fame') * 1.5) <= 1, 'el trato negociado se mantiene en la fama');
  assert.ok(Math.abs(paid('sport_tenis', 'sport', 1.5) - paid('sport_tenis', 'sport') * 1.5) <= 1, 'y en los deportes con premios');
  let more = 0;
  for (let i = 0; i < 40; i++) { MV.rng.seed(900 + i); const a = paid('sport_tenis', 'sport', 0, true); MV.rng.seed(900 + i); const b = paid('sport_tenis', 'sport'); if (a > b) more++; }
  assert.ok(more >= 30, 'el mánager mejora los premios: ' + more);
  const g = boss(MV, 41);
  g.p.job = { id: 'actor', level: 2, salary: 100000, perf: 60, years: 2, lvlYears: 2, type: 'fame', start: 28 };
  MV.EV.push(g, 'negociar_propio', {}, true);
  MV.EV.choose(g, 1);
  assert.equal(g.p.job.deal, 1.05, 'aceptar guarda el trato');
});

test('B5: una agencia de eSports bien armada puede ganar plata; la red social se satura', () => {
  const MV = load({ seed: 5 });
  let profitable = 0;
  for (let i = 0; i < 40; i++) {
    const g = boss(MV, 500 + i);
    C(MV).found(g, 'esports', 'Equipo');
    const c = last(g);
    c.rep = 50;
    for (let k = 0; k < 5; k++) c.roster.push({ id: 'p' + k, first: 'A', last: 'B', gender: 'm', alias: 'X' + k, skill: 85, salary: MV.sys.agency.wage(85), age: 20 });
    c.staff.push({ id: 'e', role: 'entrenador', level: 4, salary: 80000, first: 'A', last: 'B', gender: 'f', morale: 70 });
    for (let y = 0; y < 5; y++) { g.p.age++; g.queue = []; C(MV).yearly(g); if (c.last.result > 0) { profitable++; break; } }
  }
  assert.ok(profitable >= 15, 'equipos rentables: ' + profitable);
  const g = boss(MV, 6);
  C(MV).found(g, 'social', 'Red');
  const c = last(g);
  c.staff.push({ id: 'e', role: 'programador', level: 5, salary: 1, first: 'A', last: 'B', gender: 'f', morale: 70 }, { id: 'f', role: 'marketing', level: 5, salary: 1, first: 'A', last: 'B', gender: 'f', morale: 70 });
  c.marketing = 'alto';
  c.users = 1.9e9;
  const u0 = c.users; g.p.age++; C(MV).yearly(g);
  assert.ok(c.users < u0 * 1.1, 'cerca del tope casi no crece: ' + c.users);
  let s = 0; for (let i = 0; i < 2000; i++) s += MV.sys.agency.clientGrowth();
  assert.ok(s / 2000 < 1.06, 'los sueldos de los representados no se disparan: ' + s / 2000);
});

test('B6: textos en buen español (concordancia, sectores, artículos y junta)', () => {
  const MV = load({ seed: 7 });
  const g = boss(MV, 7);
  C(MV).found(g, 'estudio', 'Pixel');
  const c = last(g);
  C(MV).hire(g, c.id, 'programador', 0);
  c.staff[0].gender = 'f';
  MV.EV.push(g, 'empleado_aumento', { company: c.id, emp: c.staff[0].id }, true);
  assert.ok(MV.EV.view(g).choices.some((x) => x.label === 'Despedirla'));
  g.queue = [];
  assert.match(C(MV).found(boss(MV, 8, 100), 'esports', 'X'), /fundar una agencia de eSports/);
  ['tech', 'energia', 'mineria', 'cripto', 'inmobiliario', 'entretenimiento', 'comida', 'autos', 'banca', 'salud', 'consumo', 'viajes'].forEach((k) => { assert.ok(MV.SECTOR_NAMES[k], k); });
  assert.deepEqual([MV.SECTOR_NAMES.energia, MV.SECTOR_NAMES.mineria, MV.SECTOR_NAMES.tech], ['energía', 'minería', 'tecnología']);
  // Junta: sin personal para recortar y renuncia voluntaria
  C(MV).found(g, 'apps', 'Appi');
  const d = last(g); d.value = 2e7; d.since = g.p.age - 4;
  MV.sys.market.ensure(g); MV.sys.market.ipo(g, d.id, 0.3);
  MV.EV.push(g, 'junta_accionistas', { company: d.id }, true);
  const v = MV.EV.view(g);
  assert.ok(!v.choices.some((x) => /Recortar/.test(x.label)), 'sin personal no se ofrece recortar');
  const res = MV.EV.choose(g, v.choices[v.choices.length - 1].i);
  assert.ok(!BAD_TEXT.test(res.msg));
  const info = g.queue.find((q) => q.info);
  assert.ok(info && !/echaron/i.test(info.info.title + info.info.text), 'renunciar no dice que te echaron');
});

test('B7: dejar los e-sports libera tu lugar y que te echen de una empresa sin valor no regala plata', () => {
  const MV = load({ seed: 9 });
  const g = boss(MV, 9);
  C(MV).found(g, 'esports', 'Equipo');
  const c = last(g);
  g.p.job = { id: 'sport_esports', level: 1, salary: 50000, perf: 60, years: 1, lvlYears: 1, type: 'sport', start: 28, club: 'X' };
  MV.sys.agency.joinOwnTeam(g, c.id);
  g.p.job = null;
  assert.equal(MV.sys.agency.size(c, g.p), 0, 'sin carrera ya no ocupas lugar');
  const h = boss(MV, 10);
  C(MV).found(h, 'apps', 'Chiquita');
  const d = last(h); d.value = 6e6; d.since = h.p.age - 3;
  MV.sys.market.ensure(h); MV.sys.market.ipo(h, d.id, 0.3);
  const t = d.public.ticker;
  d.value = 0;
  MV.sys.market.oust(h, d.id, 0);
  MV.sys.market.yearly(h, { quiet: true });
  assert.ok(MV.sys.market.portfolioValue(h) < 50000, 'acciones de una empresa sin valor siguen valiendo casi nada: ' + MV.sys.market.portfolioValue(h));
  assert.ok(MV.sys.market.price(h, t) < 0.05);
});

test('B8: los empleados también se dejan tentar, renuncian o se vuelven virales', () => {
  const MV = load({ seed: 11 });
  ['empleado_tentado', 'empleado_viral'].forEach((id) => assert.ok(MV.EV.byId[id], id));
  const g = boss(MV, 11);
  C(MV).found(g, 'estudio', 'Pixel');
  const c = last(g);
  C(MV).hire(g, c.id, 'artista', 0);
  const e = c.staff[0], s0 = e.salary;
  MV.EV.push(g, 'empleado_tentado', { company: c.id, emp: e.id }, true);
  const v = MV.EV.view(g);
  assert.equal(v.choices.length, 3); assert.ok(!BAD_TEXT.test(v.text), v.text);
  MV.EV.choose(g, 0);
  assert.equal(e.salary, Math.round(s0 * 1.3), 'igualar la oferta sube 30 %');
  MV.EV.push(g, 'empleado_viral', { company: c.id, emp: e.id }, true);
  const vv = MV.EV.view(g);
  assert.ok(!BAD_TEXT.test(vv.text), vv.text);
  const r = MV.EV.choose(g, 0);
  assert.ok(!BAD_TEXT.test(r.msg), r.msg);
  const seen = new Set();
  for (let i = 0; i < 400; i++) { const h = boss(MV, 1000 + i); C(MV).found(h, 'apps', 'A'); const d = last(h); C(MV).hire(h, d.id, 'programador', 0); C(MV).register('apps', { revenue: () => 1e6 }); h.p.age++; C(MV).yearly(h); h.queue.forEach((q) => q.id && seen.add(q.id)); (h.log[h.log.length - 1] || { items: [] }).items.forEach((it) => { if (/renunció/.test(it.t)) seen.add('renuncia'); }); }
  ['empleado_aumento', 'empleado_tentado', 'empleado_viral', 'renuncia'].forEach((k) => assert.ok(seen.has(k), 'falta ' + k));
});
