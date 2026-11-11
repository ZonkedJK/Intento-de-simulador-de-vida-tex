/* Motor de empresas: fundar, caja, empleados, marketing, año, valuación, quiebra, venta y herencia. */
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
const only = (MV, g) => g.p.companies[g.p.companies.length - 1];

test('hay 5 tipos de empresa con sus datos y puestos', () => {
  const MV = load();
  assert.deepEqual(Object.keys(MV.COMPANY_TYPES), ['estudio', 'apps', 'social', 'esports', 'representacion']);
  const exp = { estudio: [50000, 4, 20000], apps: [30000, 5, 10000], social: [80000, 8, 30000], esports: [100000, 3, 25000], representacion: [40000, 3, 8000] };
  Object.keys(exp).forEach((k) => { const T = MV.COMPANY_TYPES[k]; assert.deepEqual([T.cost, T.mult, T.fixed], exp[k], k); T.roles.forEach((r) => assert.ok(MV.COMPANY_ROLES[r], r)); });
  assert.ok(MV.COMPANY_ROLES.gerente);
  assert.deepEqual(Object.keys(MV.MARKETING), ['ninguno', 'bajo', 'medio', 'alto']);
  assert.deepEqual(Object.values(MV.MARKETING).map((m) => [m.cost, m.boost]), [[0, 0], [10000, 0.1], [50000, 0.25], [200000, 0.5]]);
});

test('fundar cobra el costo y lo pone en la caja', () => {
  const MV = load({ seed: 1 });
  const g = boss(MV, 1);
  const msg = C(MV).found(g, 'estudio', 'Pixel <b>Pantano</b>');
  assert.ok(!BAD_TEXT.test(msg), msg);
  const c = only(MV, g);
  assert.equal(g.p.money, 1e7 - 50000);
  assert.equal(c.cash, 50000);
  assert.equal(c.type, 'estudio'); assert.ok(!/[<>]/.test(c.name));
  assert.match(C(MV).found(boss(MV, 2, 100), 'social', 'X'), /80\.000/);
  const kid = boss(MV, 3); kid.p.age = 16;
  assert.match(C(MV).found(kid, 'apps', 'X'), /18/);
});

test('no se puede tener más de 3 empresas contando el negocio clásico', () => {
  const MV = load({ seed: 4 });
  const g = boss(MV, 4);
  MV.sys.money.openBusiness(g, 'foodtruck');
  C(MV).found(g, 'apps', 'Uno'); C(MV).found(g, 'estudio', 'Dos');
  assert.equal(C(MV).count(g.p), 3);
  const m = g.p.money;
  assert.match(C(MV).found(g, 'social', 'Tres'), /3 empresas/);
  assert.equal(g.p.money, m);
  assert.equal(g.p.companies.length, 2);
});

test('contratar elige entre 3 candidatos fijos del año y despedir paga indemnización desde la caja', () => {
  const MV = load({ seed: 5 });
  const g = boss(MV, 5);
  C(MV).found(g, 'estudio', 'Pixel');
  const c = only(MV, g);
  const a = C(MV).candidates(g, c.id, 'programador'), b = C(MV).candidates(g, c.id, 'programador');
  assert.equal(a.length, 3); assert.deepEqual(a, b, 'los mismos candidatos durante el año');
  a.forEach((x) => { assert.ok(x.level >= 1 && x.level <= 5); assert.ok(x.salary >= 18000 * x.level && x.salary <= 22000 * x.level); assert.ok(x.first && x.last); });
  const pick = a[1];
  assert.ok(!BAD_TEXT.test(C(MV).hire(g, c.id, 'programador', 1)));
  assert.equal(c.staff.length, 1); assert.equal(c.staff[0].first, pick.first); assert.equal(c.staff[0].role, 'programador');
  assert.equal(C(MV).candidates(g, c.id, 'programador').length, 2, 'el contratado ya no es candidato');
  assert.match(C(MV).hire(g, c.id, 'piloto', 0), /no existe|no hay/i);
  const cash = c.cash, sal = c.staff[0].salary;
  assert.ok(!BAD_TEXT.test(C(MV).fire(g, c.id, c.staff[0].id)));
  assert.equal(c.staff.length, 0);
  assert.equal(c.cash, cash - Math.round(sal / 4));
  C(MV).hire(g, c.id, 'gerente', 0);
  assert.match(C(MV).hire(g, c.id, 'gerente', 0), /ya tiene/i);
});

test('inyectar y sacar dinero mueve entre tu bolsillo y la caja, nunca más de lo que hay', () => {
  const MV = load({ seed: 6 });
  const g = boss(MV, 6, 100000);
  C(MV).found(g, 'apps', 'Appi');
  const c = only(MV, g);
  assert.equal(g.p.money, 70000);
  C(MV).inject(g, c.id, 20000);
  assert.deepEqual([g.p.money, c.cash], [50000, 50000]);
  assert.match(C(MV).inject(g, c.id, 999999), /no tienes/i);
  assert.match(C(MV).inject(g, c.id, -5), /monto/i);
  C(MV).withdraw(g, c.id, 30000);
  assert.deepEqual([g.p.money, c.cash], [80000, 20000]);
  assert.match(C(MV).withdraw(g, c.id, 50000), /caja/i);
  assert.deepEqual([g.p.money, c.cash], [80000, 20000]);
});

test('el año cobra sueldos, marketing y costo fijo y calcula la valuación', () => {
  const MV = load({ seed: 7 });
  const g = boss(MV, 7);
  C(MV).found(g, 'apps', 'Appi');
  const c = only(MV, g);
  C(MV).inject(g, c.id, 200000);
  C(MV).hire(g, c.id, 'programador', 0); C(MV).hire(g, c.id, 'disenador', 0);
  C(MV).setMarketing(g, c.id, 'medio');
  C(MV).register('apps', { revenue: () => 100000, costs: () => 5000 });
  const cash0 = c.cash, sal = c.staff.reduce((s, e) => s + e.salary, 0);
  C(MV).yearly(g);
  const costs = sal + 50000 + 10000 + 5000;
  assert.deepEqual(c.last, { revenue: 100000, costs, result: 100000 - costs });
  assert.equal(c.cash, cash0 + 100000 - costs);
  assert.equal(c.value, Math.max(0, 100000 * 5 + c.cash));
  assert.equal(C(MV).power({ staff: [{ role: 'programador', level: 3 }, { role: 'marketing', level: 5 }] }, ['programador']), 24);
  assert.equal(C(MV).power({ staff: Array.from({ length: 6 }, () => ({ role: 'programador', level: 5 })) }, ['programador']), 100);
  assert.equal(C(MV).boost(c), 0.25);
});

test('dos años con caja negativa quiebran la empresa y su evento pendiente desaparece de la cola', () => {
  const MV = load({ seed: 8 });
  const g = boss(MV, 8);
  C(MV).found(g, 'social', 'Rednet');
  const c = only(MV, g);
  C(MV).hire(g, c.id, 'programador', 0);
  C(MV).register('social', { revenue: () => 0 });
  C(MV).withdraw(g, c.id, c.cash);
  MV.EV.push(g, 'empleado_aumento', { company: c.id, emp: c.staff[0].id });
  C(MV).yearly(g);
  assert.ok(C(MV).get(g, c.id), 'un año en rojo todavía no quiebra');
  C(MV).yearly(g);
  assert.equal(C(MV).get(g, c.id), null, 'quebró');
  assert.ok(!g.queue.some((q) => q.ctx && q.ctx.company === c.id));
  for (let i = 0; i < 10 && g.queue.length; i++) { const v = MV.EV.view(g); if (!v) break; MV.EV.choose(g, v.choices[0].i); }
});

test('el evento del aumento funciona y aguanta que el empleado ya no esté', () => {
  const MV = load({ seed: 9 });
  const g = boss(MV, 9);
  C(MV).found(g, 'estudio', 'Pixel');
  const c = only(MV, g);
  C(MV).hire(g, c.id, 'artista', 0);
  const e = c.staff[0], s0 = e.salary;
  MV.EV.push(g, 'empleado_aumento', { company: c.id, emp: e.id }, true);
  const v = MV.EV.view(g);
  assert.equal(v.choices.length, 3); assert.ok(!BAD_TEXT.test(v.text), v.text);
  MV.EV.choose(g, 0);
  assert.equal(e.salary, Math.round(s0 * 1.2));
  MV.EV.push(g, 'empleado_aumento', { company: c.id, emp: e.id }, true);
  C(MV).fire(g, c.id, e.id);
  const res = MV.EV.choose(g, 1);
  assert.ok(res && !BAD_TEXT.test(res.msg), res && res.msg);
});

test('el gerente general baja el estrés que da la empresa', () => {
  const MV = load({ seed: 10 });
  const stressOf = (withGm) => {
    const g = boss(MV, 10);
    C(MV).found(g, 'apps', 'Appi');
    const c = only(MV, g);
    if (withGm) C(MV).hire(g, c.id, 'gerente', 0);
    C(MV).register('apps', { revenue: () => 1e6 });
    g.p.stress = 20;
    C(MV).yearly(g);
    return g.p.stress - 20;
  };
  assert.equal(stressOf(false), 3);
  assert.equal(stressOf(true), 1);
});

test('el patrimonio suma el valor de las empresas', () => {
  const MV = load({ seed: 11 });
  const g = boss(MV, 11);
  const w0 = MV.netWorth(g);
  C(MV).found(g, 'representacion', 'Agencia Uno');
  const c = only(MV, g);
  assert.equal(MV.netWorth(g), w0 - 40000 + c.value);
});

test('vender paga entre 80 % y 120 % de la valuación y cerrar devuelve la caja', () => {
  const MV = load({ seed: 12 });
  const g = boss(MV, 12);
  C(MV).found(g, 'apps', 'Appi');
  const c = only(MV, g); c.value = 1000000;
  const m = g.p.money;
  assert.ok(!BAD_TEXT.test(C(MV).sell(g, c.id)));
  assert.ok(g.p.money - m >= 800000 && g.p.money - m <= 1200000);
  assert.equal(g.p.companies.length, 0);
  C(MV).found(g, 'estudio', 'Pixel');
  const d = only(MV, g);
  C(MV).hire(g, d.id, 'programador', 0);
  const sev = Math.round(d.staff[0].salary / 4), m2 = g.p.money, cash = d.cash;
  assert.ok(!BAD_TEXT.test(C(MV).close(g, d.id)));
  assert.equal(g.p.money, m2 + Math.max(0, cash - sev));
  assert.equal(g.p.companies.length, 0);
});

test('en la cárcel las empresas siguen sin errores y sin decisiones', () => {
  const MV = load({ seed: 13 });
  const g = boss(MV, 13);
  C(MV).found(g, 'estudio', 'Pixel');
  const c = only(MV, g);
  for (let i = 0; i < 3; i++) C(MV).hire(g, c.id, 'programador', 0);
  g.p.prison = { left: 5, total: 5, crime: 'Robo', behavior: 50, gang: false, since: 30 };
  for (let y = 0; y < 30; y++) { g.queue = []; C(MV).yearly(g); assert.ok(!g.queue.some((q) => q.id === 'empleado_aumento')); }
});

test('al morir, el valor de las empresas llega al heredero como efectivo', () => {
  const MV = load({ seed: 14 });
  const g = boss(MV, 14, 0);
  g.p.money = 2000000;
  C(MV).found(g, 'apps', 'Appi');
  only(MV, g).value = 3000000;
  const kid = MV.newNPC(g, { age: 25, last: g.p.last, money: 0 }); MV.addRel(g, kid, 'hijo', 80);
  MV.sys.legacy.die(g, 'una prueba');
  const ng = MV.sys.legacy.continueAs(g, kid.id);
  assert.ok(ng.p.money >= 3000000, 'heredó ' + ng.p.money);
  assert.deepEqual(ng.p.companies, []);
});

test('abrir un negocio clásico también respeta el límite de 3', () => {
  const MV = load({ seed: 15 });
  const g = boss(MV, 15);
  ['apps', 'estudio', 'representacion'].forEach((t) => C(MV).found(g, t, t));
  const m = g.p.money;
  assert.match(MV.sys.money.openBusiness(g, 'foodtruck'), /3 empresas/);
  assert.equal(g.p.business, null);
  assert.equal(g.p.money, m);
});
