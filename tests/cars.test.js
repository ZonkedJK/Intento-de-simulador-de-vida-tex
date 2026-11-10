/* Autos: concesionaria por categorías, dibujos pixelados, prestigio, tuneo, carreras y seguro. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
const CATS = ['hiperauto', 'deportivo', 'sedan', 'suv', 'pickup', 'electrico', 'clasico', 'moto', 'lujo'];

function adult(MV, seed, money) {
  const g = MV.newGame({ seed }); g.p.age = 30; g.p.money = money == null ? 1e7 : money; g.queue = []; g.p.followers = 0;
  return g;
}

test('el catálogo tiene 9 categorías y al menos 40 modelos con datos válidos', () => {
  const MV = load();
  assert.deepEqual(Object.keys(MV.CAR_CATS), CATS);
  CATS.forEach((c) => { assert.ok(MV.CAR_CATS[c].name && MV.CAR_CATS[c].icon, c); });
  assert.ok(MV.CAR_CATALOG.length >= 40, 'modelos: ' + MV.CAR_CATALOG.length);
  const ids = new Set();
  MV.CAR_CATALOG.forEach((m) => {
    assert.ok(!ids.has(m.id), 'id repetido ' + m.id); ids.add(m.id);
    assert.ok(CATS.includes(m.cat), m.id);
    assert.ok(typeof m.brand === 'string' && m.brand && typeof m.model === 'string' && m.model, m.id);
    assert.ok(m.price >= 1000 && m.price <= 5e6, m.id + ' precio');
    assert.ok(m.speed >= 90 && m.speed <= 500, m.id + ' velocidad');
    assert.ok(m.accel >= 1.5 && m.accel <= 25, m.id + ' 0 a 100');
    assert.ok(m.fuel >= 0 && m.fuel <= 40, m.id + ' consumo');
    assert.ok(m.prestige >= 0 && m.prestige <= 100, m.id + ' prestigio');
  });
  CATS.forEach((c) => assert.ok(MV.CAR_CATALOG.filter((m) => m.cat === c).length >= 3, 'pocos modelos en ' + c));
  assert.equal(MV.CAR_COLORS.length, 8);
  MV.CAR_COLORS.forEach((c) => { assert.ok(c.id && c.name); assert.match(c.hex, /^#[0-9a-f]{6}$/i); });
});

test('comprar un modelo cobra y guarda modelo, color, tuneo vacío y sin seguro', () => {
  const MV = load({ seed: 1 });
  const g = adult(MV, 1);
  const m = MV.CAR_CATALOG.find((x) => x.cat === 'deportivo');
  const msg = MV.sys.money.buyCar(g, m.id, 'azul');
  assert.ok(!BAD_TEXT.test(msg), msg);
  assert.equal(g.p.money, 1e7 - m.price);
  const a = g.p.assets.find((x) => x.model === m.id);
  assert.ok(a, msg);
  assert.equal(a.type, 'auto'); assert.equal(a.color, 'azul'); assert.equal(a.value, m.price);
  assert.deepEqual(a.tune, {}); assert.equal(a.insured, false);
  assert.match(a.name, new RegExp(m.brand));
});

test('sin dinero, siendo menor o con un modelo inexistente no se compra', () => {
  const MV = load({ seed: 2 });
  const m = MV.CAR_CATALOG.find((x) => x.cat === 'hiperauto');
  const poor = adult(MV, 2, 1000);
  assert.match(MV.sys.money.buyCar(poor, m.id, 'rojo'), /alcanza/);
  assert.equal(poor.p.assets.filter((a) => a.type === 'auto').length, 0);
  assert.equal(poor.p.money, 1000);
  const kid = adult(MV, 3); kid.p.age = 15;
  assert.match(MV.sys.money.buyCar(kid, m.id, 'rojo'), /menor/);
  const g = adult(MV, 4);
  assert.match(MV.sys.money.buyCar(g, 'no_existe', 'rojo'), /no existe/);
  assert.equal(g.p.assets.filter((a) => a.type === 'auto').length, 0);
});

test('un auto de prestigio alto suma apariencia y fama cada año', () => {
  const MV = load({ seed: 5 });
  const top = MV.CAR_CATALOG.filter((x) => x.prestige >= 70).sort((a, b) => a.price - b.price)[0];
  const low = MV.CAR_CATALOG.filter((x) => x.prestige < 70)[0];
  assert.ok(top && low);
  const g = adult(MV, 5);
  MV.sys.money.buyCar(g, top.id, 'negro');
  assert.equal(MV.sys.money.carPrestige(g.p), top.prestige);
  g.p.stats.looks = 50; g.p.fame = 10;
  MV.sys.money.yearly(g);
  assert.equal(g.p.stats.looks, 51);
  assert.equal(g.p.fame, 11);
  const h = adult(MV, 6);
  MV.sys.money.buyCar(h, low.id, 'blanco');
  h.p.stats.looks = 50; h.p.fame = 10;
  MV.sys.money.yearly(h);
  assert.equal(h.p.stats.looks, 50);
  assert.equal(h.p.fame, 10);
  assert.equal(MV.sys.money.carPrestige(adult(MV, 7).p), 0, 'sin autos');
});

test('cada modelo, color y auto viejo se dibuja en pixel art sin textos rotos', () => {
  const MV = load();
  const seen = new Set();
  MV.CAR_CATALOG.forEach((m) => MV.CAR_COLORS.forEach((c) => {
    const s = MV.UI.carSVG(m, c.id);
    assert.match(s, /^<svg/); assert.match(s, /crispEdges/); assert.ok(!BAD_TEXT.test(s), m.id + ' ' + c.id);
    assert.ok(s.includes(c.hex), `${m.id} no usa el color ${c.id}`);
    seen.add(s);
  }));
  assert.ok(seen.size >= MV.CAR_CATALOG.length * 8 * 0.9, 'dibujos repetidos');
  const shapes = new Set(MV.CAR_CATALOG.map((m) => MV.UI.carSVG(m, 'rojo')));
  assert.ok(shapes.size >= 30, 'pocos dibujos distintos: ' + shapes.size);
  MV.CARS.forEach((t, i) => {
    const old = { id: 'a' + i, type: 'auto', kind: t.kind, icon: t.icon, name: 'Viejo', value: 1000, cond: 50 };
    const s = MV.UI.carSVG(old);
    assert.match(s, /^<svg/, t.kind); assert.ok(!BAD_TEXT.test(s), t.kind);
  });
});
