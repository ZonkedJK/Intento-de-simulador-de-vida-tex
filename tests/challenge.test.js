/* Modo desafío: metas opcionales al crear la vida. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

test('cada desafío tiene datos y comprobaciones que no fallan en una vida nueva', () => {
  const MV = load({ seed: 1 });
  assert.ok(MV.CHALLENGES.length >= 10);
  const ids = new Set();
  MV.CHALLENGES.forEach((C) => {
    assert.ok(C.id && !ids.has(C.id) && C.icon && C.name && C.desc, C.id); ids.add(C.id);
    const g = MV.newGame({ seed: 1, challenge: C.id });
    assert.equal(C.check(g), false, C.id);
    assert.equal(!!(C.fail && C.fail(g)), false, C.id);
  });
});

test('newGame guarda el desafío elegido; uno inválido se ignora', () => {
  const MV = load({ seed: 2 });
  assert.equal(MV.newGame({ seed: 2, challenge: 'centenario' }).challenge.id, 'centenario');
  assert.equal(MV.newGame({ seed: 2, challenge: 'nada' }).challenge, null);
  assert.equal(MV.newGame({ seed: 2 }).challenge, null);
});

test('cumplir el desafío lo marca, avisa y da el logro', () => {
  const MV = load({ seed: 3 });
  const g = MV.newGame({ seed: 3, challenge: 'millonario_sin_uni' }); g.p.age = 40; g.p.money = 2e6;
  MV.sys.challenge.yearly(g);
  assert.equal(MV.sys.challenge.status(g).done, true);
  assert.ok(g.achLife.includes('desafio'));
  assert.ok(g.queue.some((q) => q.info && /cumplido/i.test(q.info.title)));
  g.queue = []; MV.sys.challenge.yearly(g);
  assert.equal(g.queue.length, 0, 'no avisa dos veces');
});

test('entrar a la universidad pierde el desafío de millonario sin universidad', () => {
  const MV = load({ seed: 4 });
  const g = MV.newGame({ seed: 4, challenge: 'millonario_sin_uni' }); g.p.age = 19;
  g.p.edu.stage = 'universidad';
  MV.sys.challenge.yearly(g);
  assert.equal(MV.sys.challenge.status(g).failed, true);
  g.p.money = 5e6; MV.sys.challenge.yearly(g);
  assert.equal(MV.sys.challenge.status(g).done, false, 'perdido no se cumple después');
});

test('vivir en tres países cuenta las mudanzas', () => {
  const MV = load({ seed: 5 });
  const g = MV.newGame({ seed: 5, challenge: 'trotamundos' });
  const others = Object.keys(MV.COUNTRIES).filter((k) => k !== g.p.country);
  MV.sys.challenge.yearly(g);
  g.p.country = others[0]; MV.sys.challenge.yearly(g);
  assert.equal(MV.sys.challenge.status(g).done, false);
  g.p.country = others[1]; MV.sys.challenge.yearly(g);
  assert.equal(MV.sys.challenge.status(g).done, true);
});

test('el desafío aparece en el resumen de la muerte', () => {
  const MV = load({ seed: 6 });
  const g = MV.newGame({ seed: 6, challenge: 'centenario' }); g.p.age = 80;
  MV.sys.legacy.die(g, 'una prueba');
  assert.match(MV.sys.legacy.summaryText(g), /Desafío: .*Cien años.*sin cumplir/);
});

test('el desafío de dinastía pasa al heredero y se cumple en la tercera generación', () => {
  const MV = load({ seed: 7 });
  let g = MV.newGame({ seed: 7, challenge: 'dinastia_3' });
  for (let gen = 0; gen < 2; gen++) {
    g.p.age = 60;
    const kid = MV.newNPC(g, { age: 30, last: g.p.last }); MV.addRel(g, kid, 'hijo', 80);
    MV.sys.legacy.die(g, 'una prueba');
    g = MV.sys.legacy.continueAs(g, kid.id);
    assert.equal(g.challenge.id, 'dinastia_3');
  }
  MV.sys.challenge.yearly(g);
  assert.equal(MV.sys.challenge.status(g).done, true);
});
