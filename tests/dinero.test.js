/* Parte C2 — dinero: inmuebles, inquilinos, seguros, jubilación y dinero sucio. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
const TYPES = { local: [120000, 900000], terreno: [25000, 400000], edificio: [1200000, 6000000], vacaciones: [150000, 1500000] };

function adult(MV, seed, money) {
  const g = MV.newGame({ seed }); g.p.age = 35; g.p.money = money == null ? 1e7 : money; g.queue = [];
  return g;
}
/** Agrega un inmueble directamente (sin pasar por el listado). */
function own(MV, g, type, value, extra) {
  const a = Object.assign({ id: 'a' + type + Math.round(Math.random() * 1e9), type, kind: type, icon: '🏠', name: 'Prueba ' + type, value, cond: 80, bought: g.p.age, price: value }, extra || {});
  g.p.assets.push(a);
  return a;
}
const R = (MV) => MV.sys.realty;

// ——— Tarea 1: datos, compra y mercado ———
test('listados de los 4 tipos nuevos', () => {
  const MV = load({ seed: 1 });
  const g = adult(MV, 1);
  Object.keys(TYPES).forEach((k) => {
    const items = MV.sys.money.listings(g, k);
    assert.ok(items.length >= 1 && items.length <= 6, k);
    items.forEach((it) => {
      assert.equal(it.type, k);
      const V = MV.REALTY[k].find((v) => v.kind === it.kind);
      assert.ok(V, it.kind);
      assert.ok(it.value >= V.price[0] - 100 && it.value <= V.price[1] + 100, `${it.kind} ${it.value}`);
      assert.ok(it.value >= TYPES[k][0] - 100 && it.value <= TYPES[k][1] + 100, `${k} fuera de rango ${it.value}`);
      assert.ok(!BAD_TEXT.test(it.name), it.name);
    });
  });
  assert.deepEqual(Object.keys(MV.REALTY_NAMES).sort(), ['edificio', 'local', 'terreno', 'vacaciones']);
});

test('un inmueble que no es casa nunca es tu hogar', () => {
  const MV = load({ seed: 2 });
  Object.keys(TYPES).forEach((k) => {
    const g = adult(MV, 2); g.p.housing = 'alquiler'; g.p.rent = MV.RENTALS[1]; g.p.home = null;
    const it = MV.sys.money.listings(g, k)[0];
    MV.sys.money.buy(g, it, false);
    assert.ok(g.p.assets.some((a) => a.type === k), 'compró ' + k);
    assert.equal(g.p.housing, 'alquiler', k);
    assert.equal(g.p.home, null, k);
  });
});

test('mantenimiento por tipo', () => {
  const MV = load({ seed: 3 });
  const g = adult(MV, 3);
  const up = (type) => MV.sys.money.upkeep(g, { type, value: 100000 });
  assert.equal(up('local'), 1000);
  assert.equal(up('terreno'), 200);
  assert.equal(up('edificio'), 1500);
  assert.equal(up('vacaciones'), 1000);
});

test('el mercado alterna fases y mueve los valores', () => {
  const MV = load({ seed: 4 });
  const g = adult(MV, 4);
  const phases = [];
  for (let i = 0; i < 60; i++) { R(MV).yearly(g); phases.push(R(MV).market(g).phase); }
  const runs = [];
  phases.forEach((ph, i) => { if (!i || ph !== phases[i - 1]) runs.push({ ph, n: 1 }); else runs[runs.length - 1].n++; });
  runs.slice(1, -1).forEach((r) => assert.ok(r.n >= 2 && r.n <= 5, `tramo ${r.ph} de ${r.n} años`));
  for (let i = 1; i < runs.length; i++) assert.notEqual(runs[i].ph, runs[i - 1].ph);
  assert.ok(runs.length >= 8, 'hay varios cambios de fase');
  assert.equal(R(MV).marketMod({ realty: { phase: 'auge', left: 2 } }), 0.06);
  assert.equal(R(MV).marketMod({ realty: { phase: 'caida', left: 2 } }), -0.06);
  let diff = 0;
  for (let s = 0; s < 200; s++) {
    const ch = (phase) => {
      MV.rng.seed(5000 + s);
      const h = adult(MV, 5000 + s); h.realty = { phase, left: 5 };
      const a = own(MV, h, 'casa', 100000);
      MV.sys.money.yearly(h);
      return a.value / 100000 - 1;
    };
    diff += ch('auge') - ch('caida');
  }
  const avg = diff / 200;
  assert.ok(avg > 0.10 && avg < 0.14, 'auge − caída ≈ 0,12: ' + avg);
});

test('los terrenos se valorizan más', () => {
  const MV = load({ seed: 6 });
  let diff = 0;
  for (let s = 0; s < 300; s++) {
    const ch = (type) => {
      MV.rng.seed(6000 + s);
      const h = adult(MV, 6000 + s); h.realty = { phase: 'estable', left: 5 };
      const a = own(MV, h, type, 100000);
      MV.sys.money.yearly(h);
      return a.value / 100000 - 1;
    };
    diff += ch('terreno') - ch('casa');
  }
  const avg = diff / 300;
  assert.ok(avg > 0.02 && avg < 0.06, 'terreno − casa entre 2 y 6 %: ' + avg);
});
