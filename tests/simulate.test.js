/* Simula cientos de vidas completas con un jugador automático y comprueba invariantes. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');
const { live } = require('./agent');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;

function checker(MV) {
  let seenItems = 0;
  return (g) => {
    const p = g.p;
    for (const k of ['happy', 'health', 'smarts', 'looks']) {
      assert.ok(p.stats[k] >= 0 && p.stats[k] <= 100, `${k} fuera de rango: ${p.stats[k]}`);
    }
    assert.ok(p.stress >= 0 && p.stress <= 100, 'estrés fuera de rango');
    assert.ok(p.fame >= 0 && p.fame <= 100, 'fama fuera de rango');
    assert.ok(p.karma >= -100 && p.karma <= 100, 'karma fuera de rango');
    assert.ok(Number.isFinite(p.money), 'dinero no finito: ' + p.money);
    for (const k of Object.keys(p.skills)) assert.ok(p.skills[k] >= 0 && p.skills[k] <= 100, 'habilidad fuera de rango ' + k);
    for (const r of p.rels) assert.ok(r.rel >= 0 && r.rel <= 100 && g.people[r.id], 'relación inválida');
    assert.ok(Number.isFinite(MV.netWorth(g)), 'patrimonio no finito');
    // Textos nuevos del diario
    let n = 0;
    for (const y of g.log) for (const it of y.items) {
      if (n++ < seenItems) continue;
      assert.equal(typeof it.t, 'string');
      assert.ok(it.t.length > 0, 'entrada vacía en el diario');
      assert.ok(!BAD_TEXT.test(it.t), 'texto roto en el diario: ' + it.t);
    }
    seenItems = n;
    // Eventos pendientes: deben poder mostrarse sin textos rotos
    if (g.queue.length) {
      const v = MV.EV.view(g);
      if (v) {
        assert.ok(!BAD_TEXT.test(v.text), 'texto de evento roto: ' + v.id + ': ' + v.text);
        assert.ok(!BAD_TEXT.test(v.title || ''), 'título roto: ' + v.id);
        v.choices.forEach((c) => assert.ok(c.label && !BAD_TEXT.test(c.label), 'opción rota en ' + v.id + ': ' + c.label));
      }
    }
  };
}

test('cientos de vidas completas sin errores y con valores válidos', () => {
  const MV = load({ seed: 1 });
  const ages = [];
  for (let i = 0; i < 160; i++) {
    const g = MV.newGame({ seed: 7000 + i });
    live(MV, g, { check: checker(MV) });
    assert.ok(g.over, 'la vida debería terminar');
    assert.ok(g.summary && typeof g.summary.cause === 'string' && g.summary.cause.length, 'falta la causa de muerte');
    assert.ok(g.p.age >= 0 && g.p.age <= 130, 'edad imposible');
    ages.push(g.p.age);
    const heirs = MV.sys.legacy.heirs(g);
    if (heirs.length && i % 2 === 0) {
      const ng = MV.sys.legacy.continueAs(g, heirs[0].id);
      assert.equal(ng.generation, g.generation + 1);
      live(MV, ng, { check: checker(MV) });
      assert.ok(ng.over);
    }
  }
  ages.sort((a, b) => a - b);
  const median = ages[Math.floor(ages.length / 2)];
  assert.ok(median > 25 && median < 95, 'mediana de edad de muerte poco razonable: ' + median);
});

test('vidas pasivas (sin acciones) llegan a edades razonables', () => {
  const MV = load({ seed: 2 });
  const ages = [];
  for (let i = 0; i < 120; i++) {
    const g = MV.newGame({ seed: 300 + i });
    live(MV, g, { acts: 0 });
    ages.push(g.p.age);
  }
  ages.sort((a, b) => a - b);
  const median = ages[Math.floor(ages.length / 2)];
  assert.ok(median >= 55 && median <= 90, 'mediana pasiva fuera de rango: ' + median);
});

test('la misma semilla produce la misma vida', () => {
  const run = () => {
    const MV = load();
    const g = MV.newGame({ seed: 4242, year: 2026 });
    live(MV, g);
    return { age: g.p.age, money: g.p.money, name: MV.fullName(g.p), entries: g.log.reduce((a, y) => a + y.items.length, 0) };
  };
  assert.deepStrictEqual(run(), run());
});
