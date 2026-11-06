/* Licencias: examen de conducir, yate, avión y helicóptero. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const KINDS = ['auto', 'yate', 'avion', 'helicoptero'];
const act = (MV, kind) => MV.ACTS.find((a) => a.id === 'lic_' + kind);
function person(MV, seed, age) {
  const g = MV.newGame({ seed }); g.p.age = age; g.p.money = 50000; g.p.edu.done = ['primaria', 'secundaria'];
  return g;
}
const right = (exam) => exam.questions.map((q) => q.answer);
const withWrong = (exam, n) => exam.questions.map((q, i) => (i < n ? (q.answer + 1) % 3 : q.answer));

test('los bancos tienen preguntas válidas', () => {
  const MV = load();
  KINDS.forEach((k) => {
    const L = MV.LICENSES[k];
    assert.ok(L && L.name && L.icon && L.cost > 0 && L.n === 10 && L.pass === 7, k);
    assert.ok(MV.ach.def(L.ach), 'logro de ' + k);
    const bank = MV.QUIZ[k];
    assert.ok(bank.length >= (k === 'auto' ? 20 : 12), k + ': ' + bank.length);
    const ids = new Set();
    bank.forEach((q) => {
      assert.ok(q.id && !ids.has(q.id), k + ' ' + q.id); ids.add(q.id);
      assert.ok(q.q && q.a, q.id);
      assert.ok(new Set(q.wrong).size >= 2 && !q.wrong.includes(q.a), q.id);
    });
    if (k === 'auto') assert.equal(bank.filter((q) => q.sign).length, bank.length);
  });
  assert.deepEqual([MV.LICENSES.auto.cost, MV.LICENSES.yate.cost, MV.LICENSES.avion.cost, MV.LICENSES.helicoptero.cost], [150, 3000, 8000, 12000]);
  assert.deepEqual([MV.LICENSES.auto.minAge, MV.LICENSES.yate.minAge, MV.LICENSES.avion.minAge, MV.LICENSES.helicoptero.minAge], [16, 18, 18, 18]);
});

test('el examen tiene 10 preguntas distintas con 3 opciones y una correcta', () => {
  const MV = load({ seed: 1 });
  KINDS.forEach((k) => {
    const e = MV.sys.license.exam(k);
    assert.equal(e.kind, k);
    assert.equal(e.questions.length, 10);
    assert.equal(new Set(e.questions.map((q) => q.id)).size, 10);
    e.questions.forEach((q) => {
      assert.equal(q.options.length, 3);
      assert.equal(new Set(q.options).size, 3);
      const Q = MV.QUIZ[k].find((x) => x.id === q.id);
      assert.equal(q.options[q.answer], Q.a);
    });
  });
});

test('aprobar con 7 guarda la licencia y cobra; reprobar con 6 cobra y no la guarda', () => {
  const MV = load({ seed: 2 });
  const g = person(MV, 2, 16);
  const e = MV.sys.license.exam('auto');
  const r = MV.sys.license.grade(g, 'auto', e, withWrong(e, 3));
  assert.equal(r.correct, 7); assert.equal(r.passed, true);
  assert.equal(r.mistakes.length, 3);
  assert.ok(r.mistakes.every((m) => m.q && m.given && m.right && m.given !== m.right));
  assert.ok(MV.sys.license.has(g, 'auto') && g.p.license === true);
  assert.equal(g.p.money, 50000 - 150);
  const h = person(MV, 3, 16);
  const e2 = MV.sys.license.exam('auto');
  const r2 = MV.sys.license.grade(h, 'auto', e2, withWrong(e2, 4));
  assert.equal(r2.passed, false);
  assert.ok(!MV.sys.license.has(h, 'auto'));
  assert.equal(h.p.money, 50000 - 150);
});

test('conducir se rinde desde los 16; las de vehículos piden conducir y 18', () => {
  const MV = load({ seed: 3 });
  const g = person(MV, 3, 15);
  assert.equal(MV.sys.license.canTake(g, 'auto').ok, false);
  assert.ok(!MV.actsFor(g, 'tramites').some((a) => a.id === 'lic_auto'));
  g.p.age = 16;
  assert.equal(MV.sys.license.canTake(g, 'auto').ok, true);
  assert.ok(MV.actsFor(g, 'tramites').some((a) => a.id === 'lic_auto'));
  g.p.age = 18;
  assert.equal(MV.sys.license.canTake(g, 'avion').ok, false, 'sin licencia de conducir');
  g.p.license = true;
  ['yate', 'avion', 'helicoptero'].forEach((k) => assert.equal(MV.sys.license.canTake(g, k).ok, true, k));
  g.p.age = 17;
  assert.equal(MV.sys.license.canTake(g, 'yate').ok, false);
  g.p.age = 20; g.p.licenses = { auto: true, yate: true };
  assert.ok(!MV.actsFor(g, 'tramites').some((a) => a.id === 'lic_yate'), 'ya la tiene');
});

test('una partida con p.license cuenta como licencia de conducir', () => {
  const MV = load({ seed: 4 });
  const g = person(MV, 4, 30); delete g.p.licenses; g.p.license = true;
  assert.equal(MV.sys.license.has(g, 'auto'), true);
  assert.ok(!MV.actsFor(g, 'tramites').some((a) => a.id === 'lic_auto'));
});

test('sin dinero el intento se rechaza sin gastar el año', () => {
  const MV = load({ seed: 5 });
  const g = person(MV, 5, 20); g.p.license = true; g.p.money = 2000;
  const a = act(MV, 'avion');
  const e = MV.sys.license.exam('avion');
  const res = MV.doAction(g, a, { exam: e, answers: right(e) });
  assert.ok(res.blocked);
  assert.equal(MV.usesLeft(g, a), 2);
  assert.equal(g.p.money, 2000);
  assert.ok(!MV.sys.license.has(g, 'avion'));
});

test('con la acción y respuestas correctas se aprueba y gasta un intento', () => {
  const MV = load({ seed: 6 });
  const g = person(MV, 6, 18); g.p.license = true;
  const a = act(MV, 'yate');
  assert.equal(a.ui, 'quiz'); assert.equal(a.license, 'yate');
  const e = MV.sys.license.exam('yate');
  const res = MV.doAction(g, a, { exam: e, answers: right(e) });
  assert.ok(MV.sys.license.has(g, 'yate'), res.msg);
  assert.match(res.msg, /10 de 10/);
  assert.equal(MV.usesLeft(g, a), 1);
});

test('en la cárcel no aparecen los exámenes', () => {
  const MV = load({ seed: 7 });
  const g = person(MV, 7, 20);
  MV.sys.crime.jail(g, 3, 'Robo');
  assert.ok(!MV.ACTS.filter((a) => /^lic_/.test(a.id)).some((a) => !a.when || a.when(g)));
});

test('el jugador automático aprueba más con más inteligencia', () => {
  const MV = load({ seed: 8 });
  const rate = (smarts) => {
    let ok = 0;
    for (let i = 0; i < 200; i++) { const g = person(MV, 800 + i, 17); g.p.stats.smarts = smarts; MV.doAction(g, act(MV, 'auto')); if (MV.sys.license.has(g, 'auto')) ok++; }
    return ok / 200;
  };
  const lo = rate(5), hi = rate(95);
  assert.ok(hi > lo + 0.3, `${lo} vs ${hi}`);
});

test('los trabajos pueden pedir una licencia', () => {
  const MV = load({ seed: 9 });
  const g = person(MV, 9, 25);
  const J = { id: 'x', titles: ['X'], pay: [1], req: { lic: ['avion'] }, type: 'full' };
  assert.ok(MV.sys.career.meets(g, J).why.includes('Licencia de avión'));
  g.p.licenses = { auto: true, avion: true };
  assert.equal(MV.sys.career.meets(g, J).ok, true);
});

test('los trabajos de piloto y capitán piden su licencia, edad y pagan bien', () => {
  const MV = load({ seed: 10 });
  const g = person(MV, 10, 22); g.p.license = true; g.p.licenses = { auto: true };
  const cases = [['piloto_comercial', 'avion', 'Licencia de avión', 21, 240000], ['piloto_heli', 'helicoptero', 'Licencia de helicóptero', 20, 140000], ['capitan_yate', 'yate', 'Licencia de yate', 18, 150000]];
  cases.forEach(([id, lic, name, age, top]) => {
    const J = MV.jobById(id);
    assert.ok(J, id);
    assert.equal(J.pay[J.pay.length - 1], top, id);
    assert.equal(J.req.age, age, id);
    assert.ok(MV.sys.career.meets(g, J).why.includes(name), id);
    g.p.licenses[lic] = true;
    assert.equal(MV.sys.career.meets(g, J).ok, true, id + ': ' + MV.sys.career.meets(g, J).why.join(', '));
  });
  assert.equal(MV.gt(MV.jobById('piloto_comercial').titles[1], 'f'), 'Primera oficial');
  assert.equal(MV.gt(MV.jobById('capitan_yate').titles[1], 'f'), 'Capitana de yate');
});
