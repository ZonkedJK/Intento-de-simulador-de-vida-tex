/* Correcciones de la revisión final de la Parte D. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
function adult(MV, seed) {
  const g = MV.newGame({ seed }); g.p.age = 30; g.p.money = 1e7; g.queue = []; g.p.licenses = { auto: true }; g.p.license = true;
  return g;
}

test('F1: el choque con un auto asegurado lo paga el seguro', () => {
  const MV = load({ seed: 1 });
  const g = adult(MV, 1);
  MV.sys.money.buyCar(g, 'fenix_compacto', 'rojo');
  MV.sys.money.buyCar(g, 'ardenne_quimera', 'azul');
  const big = g.p.assets.find((a) => a.model === 'ardenne_quimera');
  MV.sys.cars.insure(g, big.id, true);
  const m0 = g.p.money;
  MV.EV.push(g, 'choque_auto', {}, true);
  const res = MV.EV.choose(g, 0);
  assert.ok(!BAD_TEXT.test(res.msg), res.msg);
  assert.match(res.msg, /seguro/i);
  assert.ok(m0 - g.p.money <= 500, 'pagó ' + (m0 - g.p.money));
  const h = adult(MV, 2);
  MV.sys.money.buyCar(h, 'okami_sereno', 'rojo');
  const m1 = h.p.money;
  MV.EV.push(h, 'choque_auto', {}, true);
  MV.EV.choose(h, 0);
  assert.ok(m1 - h.p.money > 500, 'sin seguro sigue pagando los daños');
});

test('F3: un chico sin dinero que recoge un gato no queda endeudado', () => {
  const MV = load({ seed: 3 });
  for (let i = 0; i < 20; i++) {
    const g = MV.newGame({ seed: 30 + i }); g.p.age = 12; g.p.money = 0; g.queue = []; g.p.housing = 'propia';
    g.p.yearActs = {};
    const res = MV.doAction(g, MV.ACTS.find((a) => a.id === 'gato_callejero'), 'gatito');
    assert.ok(!BAD_TEXT.test(res.msg), res.msg);
    assert.equal(g.p.money, 0, res.msg);
  }
  const g = adult(MV, 4); g.p.money = 40; g.p.housing = 'propia'; g.p.yearActs = {};
  MV.doAction(g, MV.ACTS.find((a) => a.id === 'gato_callejero'), 'joven');
  assert.ok(g.p.money >= 0, 'un adulto sin dinero tampoco queda en negativo');
});

test('F4: el resumen del primer año dice "Tu primer año" y los demás "Tu año a los N"', () => {
  const MV = load({ seed: 5 });
  const g = MV.newGame({ seed: 5 }); g.queue = [];
  const b0 = MV.sys.history.snapshot(g);
  g.p.age = 1;
  assert.equal(MV.sys.history.yearSummary(b0, g).title, 'Tu primer año');
  const b1 = MV.sys.history.snapshot(g);
  g.p.age = 2;
  assert.equal(MV.sys.history.yearSummary(b1, g).title, 'Tu año a los 2');
  g.p.age = 6;
  assert.equal(MV.sys.history.yearSummary(b1, g).title, 'Tus años de 2 a 6');
});

test('F5: avanzar varios años se detiene si la salud cae por debajo de 30', () => {
  const MV = load({ seed: 6 });
  const g = adult(MV, 6);
  const before = MV.sys.history.snapshot(g);
  g.p.stats.health = 25;
  assert.equal(MV.sys.history.shouldPause(before, g), true);
  const sick = MV.sys.history.snapshot(g);
  g.p.stats.health = 22;
  assert.equal(MV.sys.history.shouldPause(sick, g), false, 'si ya estaba mal no frena cada año');
  g.p.stats.health = 80;
  assert.equal(MV.sys.history.shouldPause(before, g), false);
});

test('F7: el alerón y la pintura no deforman el dibujo de las motos', () => {
  const MV = load({ seed: 7 });
  const g = adult(MV, 7);
  MV.sys.money.buyCar(g, 'torino_saeta', 'rojo');
  const moto = g.p.assets.find((a) => a.model === 'torino_saeta');
  const plain = MV.UI.carSVG(moto);
  MV.sys.cars.tune(g, moto.id, 'aleron');
  MV.sys.cars.tune(g, moto.id, 'pintura');
  assert.equal(MV.UI.carSVG(moto), plain);
});

test('F8: los colores del gráfico van en style (funcionan en Safari y Firefox)', () => {
  const MV = load();
  const svg = MV.UI.lineChart([{ key: 'a', name: 'A', color: 'var(--series-1)', values: [1, 5, 3] }, { key: 'b', name: 'B', color: 'var(--series-2)', values: [2, 2, 9] }], { xs: [1, 2, 3] });
  assert.ok(!/(stroke|fill)="var\(/.test(svg), 'no usa var() en atributos de presentación');
  assert.match(svg, /style="stroke:var\(--series-1\)"/);
  assert.match(svg, /style="fill:var\(--series-2\)"/);
  const one = MV.UI.lineChart([{ key: 'a', name: 'A', color: 'var(--series-1)', values: [4] }], { xs: [9] });
  assert.ok(!/(stroke|fill)="var\(/.test(one));
});
