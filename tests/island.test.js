/* Islas privadas: resort, parque temático, casino y reserva natural. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

function owner(MV, seed, money) {
  const g = MV.newGame({ seed }); g.p.age = 45; g.p.money = money == null ? 1e8 : money;
  const a = { id: 'isla1', type: 'lujo', kind: 'Isla privada', icon: '🏝️', name: 'Isla privada', value: 20000000, cond: 100 };
  g.p.assets.push(a);
  g.log.push({ age: g.p.age, year: g.year, items: [] });
  return { g, a };
}
const I = (MV) => MV.sys.island;

test('los cuatro tipos tienen los valores del diseño', () => {
  const MV = load();
  const T = MV.ISLAND_TYPES;
  assert.deepEqual(['resort', 'parque', 'casino', 'reserva'].map((k) => [T[k].cost, T[k].base]), [[5e6, 6e5], [8e6, 1e6], [6e6, 1.4e6], [1e6, 1e5]]);
  assert.ok(T.parque.mascot && T.reserva.karma > 0 && T.reserva.fame > 0);
});

test('desarrollar cobra, guarda nombre y mascota y sube el valor', () => {
  const MV = load({ seed: 1 });
  const { g, a } = owner(MV, 1);
  const msg = I(MV).develop(g, 'isla1', 'parque', '  Mundo <Mapache>  ', 'Mapache Pepe');
  assert.equal(g.p.money, 1e8 - 8e6, msg);
  assert.equal(a.project.name, 'Mundo Mapache');
  assert.equal(a.project.mascot, 'Mapache Pepe');
  assert.equal(a.project.level, 1);
  assert.equal(a.value, 20000000 + 5600000);
  assert.match(msg, /Mundo Mapache/);
  assert.match(I(MV).develop(g, 'isla1', 'resort', 'Otra'), /Ya tiene/);
  const b = owner(MV, 2); I(MV).develop(b.g, 'isla1', 'resort', '', '');
  assert.ok(b.a.project.name.length > 3, 'sin nombre se usa uno al azar');
  assert.equal(b.a.project.mascot, null);
});

test('sin dinero no se desarrolla ni se mejora', () => {
  const MV = load({ seed: 3 });
  const { g, a } = owner(MV, 3, 999999);
  assert.match(I(MV).develop(g, 'isla1', 'reserva', 'Santuario'), /Necesitas/);
  assert.equal(a.project, undefined);
  g.p.money = 1e6; I(MV).develop(g, 'isla1', 'reserva', 'Santuario');
  assert.equal(g.p.money, 0);
  assert.match(I(MV).upgrade(g, 'isla1'), /Necesitas/);
  assert.equal(a.project.level, 1);
});

test('mejorar cuesta 0,6 × inversión × nivel al que subes y llega hasta el nivel 5', () => {
  const MV = load({ seed: 4 });
  const { g, a } = owner(MV, 4);
  I(MV).develop(g, 'isla1', 'resort', 'Bahía Serena');
  assert.equal(I(MV).upgradeCost(a), 6e6);
  for (let i = 0; i < 6; i++) I(MV).upgrade(g, 'isla1');
  assert.equal(a.project.level, 5);
  assert.match(I(MV).upgrade(g, 'isla1'), /máximo/);
  assert.ok(g.achLife.includes('magnate_isla'));
});

function avgIncome(MV, level, newsId) {
  let sum = 0;
  for (let i = 0; i < 60; i++) {
    const { g, a } = owner(MV, 100 + i);
    I(MV).develop(g, 'isla1', 'casino', 'Fortuna');
    a.project.level = level; a.project.rep = 50;
    g.world = newsId ? { age: g.p.age, id: newsId, past: [] } : null;
    g.queue = [];
    const m0 = g.p.money; I(MV).yearly(g); sum += g.p.money - m0;
  }
  return sum / 60;
}

test('la ganancia sube con el nivel y baja en una pandemia', () => {
  const MV = load({ seed: 5 });
  const l1 = avgIncome(MV, 1, null), l3 = avgIncome(MV, 3, null), pand = avgIncome(MV, 3, 'pandemia');
  assert.ok(l1 > 1.1e6 && l1 < 1.7e6, 'nivel 1: ' + l1);
  assert.ok(l3 > l1 * 2.5, 'nivel 3: ' + l3);
  assert.ok(pand < l3 * 0.4, 'pandemia: ' + pand);
});

test('la ganancia queda en el diario y la reserva da karma y fama', () => {
  const MV = load({ seed: 6 });
  const { g } = owner(MV, 6);
  I(MV).develop(g, 'isla1', 'reserva', 'Santuario Verde');
  g.p.karma = 0; g.p.fame = 0; g.queue = [];
  I(MV).yearly(g);
  assert.ok(g.p.karma > 0 && g.p.fame > 0);
  assert.ok(g.log[g.log.length - 1].items.some((it) => /Santuario Verde/.test(it.t)));
});

test('cada tipo tiene sus eventos y se resuelven sin romper nada', () => {
  const MV = load({ seed: 7 });
  ['resort', 'parque', 'casino', 'reserva'].forEach((type) => {
    MV.ISLAND_TYPES[type].events.forEach((ev) => {
      for (let c = 0; c < MV.EV.byId[ev].choices.length; c++) {
        const { g, a } = owner(MV, 700 + c);
        I(MV).develop(g, 'isla1', type, 'Prueba', 'Pato Fortunato');
        g.queue = []; MV.EV.push(g, ev, { asset: a.id }, true);
        const v = MV.EV.view(g);
        const ch = v.choices[Math.min(c, v.choices.length - 1)];
        const res = MV.EV.choose(g, ch.i);
        assert.ok(res.msg && !/undefined|NaN/.test(res.msg), ev + ': ' + res.msg);
      }
    });
  });
});

test('un evento de una isla vendida se descarta', () => {
  const MV = load({ seed: 8 });
  const { g, a } = owner(MV, 8);
  I(MV).develop(g, 'isla1', 'parque', 'Reino Chancleta', 'Ardilla Turbo');
  g.queue = []; MV.EV.push(g, 'isla_mascota', { asset: a.id }, false);
  MV.sys.money.sellFor(g, 'isla1', 30000000);
  assert.ok(!g.queue.some((q) => q.ctx && q.ctx.asset === 'isla1'));
});

test('cerrar el proyecto deja la isla sola y baja el valor', () => {
  const MV = load({ seed: 9 });
  const { g, a } = owner(MV, 9);
  I(MV).develop(g, 'isla1', 'resort', 'Coral Azul'); I(MV).upgrade(g, 'isla1');
  const v = a.value;
  const msg = I(MV).close(g, 'isla1');
  assert.equal(a.project, undefined, msg);
  assert.ok(a.value < v && a.value >= 20000000 * 0.9);
});

test('en la cárcel la isla sigue dando ganancia', () => {
  const MV = load({ seed: 10 });
  const { g } = owner(MV, 10);
  I(MV).develop(g, 'isla1', 'casino', 'Club Medianoche');
  MV.sys.crime.jail(g, 3, 'Fraude'); g.queue = [];
  const m0 = g.p.money; I(MV).yearly(g);
  assert.ok(g.p.money > m0);
});
