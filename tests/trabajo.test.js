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

// ——— Tarea 2: jefe y compañeros ———
function worker(MV, seed, jobId) {
  const g = MV.newGame({ seed }); g.p.age = 30; g.p.money = 100000; g.queue = [];
  if (jobId) MV.sys.career.hire(g, MV.jobById(jobId));
  return g;
}
const W = (MV) => MV.sys.workplace;

test('contratar crea jefe y 2 compañeros de roles distintos', () => {
  const MV = load({ seed: 21 });
  const g = worker(MV, 21, 'cajero');
  const b = W(MV).boss(g);
  assert.ok(b, 'hay jefe');
  assert.equal(b.r.type, 'jefe');
  assert.ok(MV.BOSS_KINDS[b.kind], b.kind);
  assert.ok(b.n.age >= 30 && b.n.age <= 65, 'edad del jefe ' + b.n.age);
  assert.ok(b.r.rel >= 45 && b.r.rel <= 60, 'relación inicial ' + b.r.rel);
  assert.equal(g.p.job.mates.length, 2);
  assert.notEqual(g.p.job.mates[0].role, g.p.job.mates[1].role);
  g.p.job.mates.forEach((m) => {
    assert.ok(MV.MATE_ROLES[m.role], m.role);
    assert.equal(MV.relOf(g, m.id).type, 'companero');
    assert.ok(m.bossRel >= 30 && m.bossRel <= 70);
    assert.ok(W(MV).mate(g, m.role), 'mate() encuentra ' + m.role);
  });
});

test('dejar el trabajo limpia jefe y compañeros según la relación', () => {
  const MV = load({ seed: 22 });
  const g = worker(MV, 22, 'cajero');
  const bossId = g.p.job.boss.id, [a, b] = g.p.job.mates.map((m) => m.id);
  MV.relOf(g, bossId).rel = 85; MV.relOf(g, a).rel = 70; MV.relOf(g, b).rel = 30;
  MV.sys.career.leave(g, 'renuncia');
  assert.equal(MV.relOf(g, bossId).type, 'amigo');
  assert.equal(MV.relOf(g, a).type, 'amigo');
  assert.equal(MV.relOf(g, b), undefined);
  assert.equal(g.p.job, null);
});

test('cambiar de trabajo trae gente nueva', () => {
  const MV = load({ seed: 23 });
  const g = worker(MV, 23, 'cajero');
  const oldBoss = g.p.job.boss.id;
  MV.relOf(g, oldBoss).rel = 50;
  MV.sys.career.hire(g, MV.jobById('cartero'));
  assert.equal(MV.relOf(g, oldBoss), undefined, 'el jefe viejo ya no es relación');
  assert.ok(W(MV).boss(g));
  assert.notEqual(W(MV).boss(g).n.id, oldBoss);
  assert.equal(MV.rels(g, 'jefe').length, 1);
});

test('el sabático vuelve con gente nueva', () => {
  const MV = load({ seed: 24 });
  let back = 0;
  for (let s = 0; s < 30 && back < 3; s++) {
    MV.rng.seed(500 + s);
    const g = worker(MV, 500 + s, 'cajero');
    const job = g.p.job;
    g.p.flags.sabbatical = { job: Object.assign({}, job), until: g.p.age + 1, perf: 100 };
    MV.sys.career.leave(g, 'año sabático');
    g.p.age++;
    MV.sys.career.yearly(g);
    if (!g.p.job) continue;
    back++;
    assert.ok(W(MV).boss(g), 'vuelve con jefe');
    g.p.job.mates.forEach((m) => assert.ok(MV.relOf(g, m.id), 'cada compañero es relación'));
    assert.equal(g.p.job.mates.length, 2);
  }
  assert.ok(back >= 1, 'algún regreso del sabático');
});

test('medio tiempo, fama y deporte no tienen jefe', () => {
  const MV = load({ seed: 25 });
  const sport = Object.keys(MV.SPORT_JOBS)[0];
  [MV.jobById('repartidor'), MV.FAME.actor, MV.SPORT_JOBS[sport]].forEach((J) => {
    const g = worker(MV, 25);
    MV.sys.career.hire(g, J);
    assert.ok(!g.p.job.boss, J.id + ' sin jefe');
    assert.equal(MV.rels(g, 'jefe').length, 0, J.id);
    assert.equal(W(MV).boss(g), null);
  });
});
