/* Resumen de la vida para compartir. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');
const BAD = /undefined|NaN|\[object|null\b|\$\{/;

test('el resumen tiene nombre, edad, país, causa, patrimonio, logros y epitafio', () => {
  const MV = load({ seed: 1 });
  const g = MV.newGame({ seed: 1, gender: 'f' }); g.p.age = 72; g.p.money = 1234567; g.p.retired = true;
  g.p.jobs.push({ id: 'medico', title: 'Médica', from: 30, to: 65 });
  const kid = MV.newNPC(g, { age: 40 }); MV.addRel(g, kid, 'hijo', 80);
  g.p.works = [{ id: 'w1', kind: 'libro', title: 'Cien años de mi suegra', genre: 'misterio', age: 50, stars: 5, hit: true, earned: 1, royalty: 0 }];
  MV.ach.unlock(g, 'millonario');
  MV.sys.legacy.die(g, 'un infarto');
  const t = MV.sys.legacy.summaryText(g);
  const C = MV.COUNTRIES[g.p.country];
  [MV.fullName(g.p), '72 años', C.name, 'un infarto', U$(MV, g.summary.worth), g.summary.epitaph, 'Cien años de mi suegra', 'Millonario', '1 hijo'].forEach((s) => assert.ok(t.includes(s), 'falta: ' + s + '\n' + t));
  assert.ok(!BAD.test(t), t);
  assert.match(t, /jubilada/);
  assert.match(t, /Mil Vidas/);
});
function U$(MV, n) { return MV.U.money(n); }

test('el resumen funciona sin logros, sin hijos y sin trabajo', () => {
  const MV = load({ seed: 2 });
  const g = MV.newGame({ seed: 2 }); g.p.age = 3;
  MV.sys.legacy.die(g, 'atragantarse con un caramelo');
  const t = MV.sys.legacy.summaryText(g);
  assert.ok(!BAD.test(t), t);
  assert.ok(t.split('\n').length >= 4);
});
