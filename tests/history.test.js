/* Historia de la vida para gráficos, resumen del año y gráfico de líneas. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');
const { resolveQueue } = require('./agent');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null|Infinity/;

test('cada año se guarda una fila de historia (y nunca más de 130)', () => {
  const MV = load({ seed: 1 });
  const g = MV.newGame({ seed: 1 });
  assert.equal(g.p.history.length, 1);
  assert.equal(g.p.history[0].age, 0);
  for (let y = 0; y < 10 && !g.over; y++) { resolveQueue(MV, g); MV.ageUp(g); }
  const ages = g.p.history.map((r) => r.age);
  assert.deepEqual(ages, Array.from({ length: g.p.age + 1 }, (_, i) => i));
  g.p.history.forEach((r) => ['worth', 'happy', 'health', 'smarts', 'looks'].forEach((k) => assert.ok(Number.isFinite(r[k]), k)));
  MV.sys.history.record(g);
  assert.equal(g.p.history.length, g.p.age + 1, 'grabar dos veces el mismo año reemplaza la fila');
  for (let a = 0; a < 200; a++) { g.p.age = 20 + a; MV.sys.history.record(g); }
  assert.equal(g.p.history.length, 130);
  assert.equal(g.p.history[129].age, 219);
});

test('el resumen tiene los cambios y hasta 3 momentos destacados', () => {
  const MV = load({ seed: 2 });
  const g = MV.newGame({ seed: 2 }); g.p.age = 30; g.queue = [];
  const before = MV.sys.history.snapshot(g);
  g.p.age = 31; g.log.push({ age: 31, year: g.year + 1, items: [] });
  g.p.stats.happy += 7; g.p.stats.health -= 4; g.p.money += 5000;
  MV.log(g, 'Balance del año: $0 de ingresos.', '🧾');
  MV.log(g, 'Te ascendieron.', '📈', 'good');
  MV.log(g, 'Viste un eclipse.', '🌑');
  MV.log(g, 'Te rompiste una pierna.', '🦴', 'bad');
  MV.log(g, 'Te mudaste.', '📦');
  const s = MV.sys.history.yearSummary(before, g);
  assert.equal(s.age, 31);
  assert.equal(s.from, 31);
  assert.deepEqual(s.changes, [{ k: 'happy', d: 7 }, { k: 'health', d: -4 }, { k: 'money', d: 5000 }]);
  assert.equal(s.highlights.length, 3);
  assert.deepEqual(s.highlights.slice(0, 2), ['Te ascendieron.', 'Te rompiste una pierna.'], 'primero lo bueno y lo malo');
  assert.ok(!s.highlights.some((t) => /Balance/.test(t)), 'el balance no es un momento destacado');
  const quiet = MV.sys.history.yearSummary(MV.sys.history.snapshot(g), g);
  assert.deepEqual(quiet.changes, []);
});

test('el gráfico se dibuja con una o muchas filas sin textos rotos', () => {
  const MV = load();
  const mk = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const cases = [
    { xs: [0], series: [{ key: 'w', name: 'Patrimonio', color: 'var(--series-1)', values: [0] }] },
    { xs: [3, 4], series: [{ key: 'w', name: 'Patrimonio', color: 'var(--series-1)', values: [-500, 2500] }] },
    { xs: mk(100, (i) => i), series: ['happy', 'health', 'smarts', 'looks'].map((k, j) => ({ key: k, name: k, color: `var(--series-${j + 1})`, values: mk(100, (i) => (i * (j + 3)) % 101) })) },
    { xs: mk(5, (i) => i + 20), series: [{ key: 'flat', name: 'Plano', color: 'var(--series-2)', values: [50, 50, 50, 50, 50] }] }
  ];
  cases.forEach((c, i) => {
    const svg = MV.UI.lineChart(c.series, { xs: c.xs, title: 'Prueba ' + i, fmt: (v) => String(Math.round(v)) });
    assert.match(svg, /^<svg/);
    assert.ok(!BAD_TEXT.test(svg), `caso ${i}: ${svg.match(/.{40}(NaN|undefined|Infinity|null).{20}/)}`);
    c.series.forEach((s) => assert.ok(svg.includes(s.color), 'usa el color de la serie'));
  });
  assert.equal(MV.UI.lineChart([], { xs: [] }), '');
});
