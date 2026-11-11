/* Interfaz A ("el cuaderno, mejorado"): subtítulos de opción y variables de estilo. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;

test('auditoría: subtítulos con concordancia y resultado tranquilo/tranquila', () => {
  const MV = load({ seed: 1 });
  for (const [gender, word] of [['m', 'tranquilo'], ['f', 'tranquila']]) {
    const g = MV.newGame({ seed: 1 }); g.p.age = 40; g.p.gender = gender; g.p.money = 100000; g.queue = [];
    g.p.job = { id: 'actor', level: 1, salary: 100000, perf: 60, years: 1, lvlYears: 1, type: 'fame', start: 39 };
    MV.EV.push(g, 'auditoria', {}, true);
    const v = MV.EV.view(g);
    assert.deepEqual(v.choices.map((c) => c.sub), [`Pagas las diferencias y dormirás ${word}`, 'Puede salir muy bien… o muy mal', 'Una moneda al aire con tu plata', 'En cómodas cuotas']);
    v.choices.forEach((c) => assert.ok(!BAD_TEXT.test(c.label + c.sub), c.label));
    assert.match(MV.EV.choose(g, 0).msg, new RegExp(`Dormirás ${word}\\.`));
  }
});

test('las opciones sin sub no lo traen; sub acepta función y plantillas', () => {
  const MV = load({ seed: 2 });
  MV.ev({ id: 'prueba_sub', manual: true, icon: '🧪', title: 'Prueba', text: 'x', choices: [{ t: 'A', eff: {} }, { t: 'B', sub: () => 'List{o}', eff: {} }] });
  const g = MV.newGame({ seed: 2 }); g.p.gender = 'f'; g.queue = [];
  MV.EV.push(g, 'prueba_sub', {}, true);
  const [a, b] = MV.EV.view(g).choices;
  assert.ok(!('sub' in a));
  assert.equal(b.sub, 'Lista');
});
