/* Parte C1 — trabajo: jefe, compañeros, negociación, más empleos, freelance y decisiones laborales. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
const NEW_JOBS = {
  jardinero: [16000, 28000, 52000], cartero: [17000, 25000, 40000], pescador: [15000, 32000, 70000],
  bibliotecario: [16000, 27000, 45000], barista: [14000, 24000, 46000], tatuador: [12000, 30000, 85000],
  crupier: [18000, 30000, 70000], detective: [22000, 45000, 90000], paramedico: [26000, 38000, 56000],
  farmaceutico: [36000, 55000, 120000], dentista: [42000, 75000, 140000], sommelier: [18000, 34000, 80000],
  controlador: [38000, 70000, 105000], diplomatico: [40000, 75000, 150000], guardaparques: [20000, 32000, 52000]
};

test('datos: caracteres de jefe, roles y encargos', () => {
  const MV = load();
  assert.deepEqual(Object.keys(MV.BOSS_KINDS).sort(), ['ausente', 'buenazo', 'controlador', 'griton', 'trepador']);
  assert.equal(MV.BOSS_KINDS.buenazo.raise, 0.15);
  assert.equal(MV.BOSS_KINDS.trepador.raise, -0.1);
  assert.equal(MV.BOSS_KINDS.buenazo.promo, 0.1);
  const stress = {};
  Object.keys(MV.BOSS_KINDS).forEach((k) => { if (MV.BOSS_KINDS[k].stress) stress[k] = MV.BOSS_KINDS[k].stress; });
  assert.deepEqual(stress, { controlador: 2, griton: 3 });
  Object.values(MV.BOSS_KINDS).forEach((K) => { assert.ok(K.icon && K.name, 'carácter con ícono y nombre'); });
  assert.equal(Object.keys(MV.MATE_ROLES).length, 3);
  assert.deepEqual(MV.FREELANCE.map((f) => f.skill), ['programacion', 'arte', 'idiomas', 'cocina', 'musica', 'carisma']);
  MV.FREELANCE.forEach((f) => { assert.ok(MV.SKILLS[f.skill], f.skill); assert.ok(f.icon && f.label); });
});

test('relación jefe', () => {
  const MV = load();
  assert.equal(MV.relLabel('jefe', { gender: 'f' }), 'Jefa');
  assert.equal(MV.relLabel('jefe', { gender: 'm' }), 'Jefe');
  assert.equal(MV.REL_ORDER.indexOf('jefe'), MV.REL_ORDER.indexOf('companero') + 1);
});

test('15 empleos nuevos con la forma de los demás', () => {
  const MV = load();
  Object.keys(NEW_JOBS).forEach((id) => {
    const J = MV.jobById(id);
    assert.ok(J, id);
    assert.equal(J.type, 'full', id);
    assert.equal(J.titles.length, 3, id);
    assert.deepEqual(J.pay, NEW_JOBS[id], id);
    J.titles.forEach((t) => { assert.ok(!/\|/.test(MV.gt(t, 'f')) && !/\|/.test(MV.gt(t, 'm')), t); });
  });
  assert.equal(MV.jobById('tatuador').skillUp, 'arte');
  assert.equal(MV.jobById('barista').skillUp, 'cocina');
  assert.equal(MV.jobById('sommelier').skillUp, 'cocina');
  assert.equal(MV.jobById('diplomatico').skillUp, 'idiomas');
  assert.equal(MV.jobById('controlador').stress, 9);
});

test('requisitos de los empleos nuevos', () => {
  const MV = load({ seed: 3 });
  const g = MV.newGame({ seed: 3 }); g.p.age = 30;
  const dent = MV.jobById('dentista');
  const m = MV.sys.career.meets(g, dent);
  assert.equal(m.ok, false);
  assert.ok(m.why.some((w) => /Título en Medicina/.test(w)), m.why.join(', '));
  g.p.edu.degrees.push({ kind: 'universidad', major: 'medicina' });
  assert.equal(MV.sys.career.meets(g, dent).ok, true);
});
