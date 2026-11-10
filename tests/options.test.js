/* Más opciones: actividades nuevas, una opción más en los 15 eventos más frecuentes y acciones de trabajo. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
function adult(MV, seed) {
  const g = MV.newGame({ seed }); g.p.age = 30; g.p.money = 1e6; g.queue = []; g.p.housing = 'propia';
  return g;
}
const act = (MV, id) => MV.ACTS.find((a) => a.id === id);

const NEW_ACTS = ['karaoke', 'escape_room', 'refugio', 'clases', 'museo', 'picnic', 'estrellas', 'maraton'];

test('las actividades nuevas existen y sus textos están bien', () => {
  const MV = load({ seed: 1 });
  NEW_ACTS.forEach((id) => {
    const a = act(MV, id);
    assert.ok(a, 'falta ' + id);
    for (let i = 0; i < 15; i++) {
      const g = adult(MV, 100 + i); g.p.skills.deporte = 60;
      const opts = a.opts ? a.opts(g) : [undefined];
      opts.forEach((o) => {
        g.p.yearActs = {};
        const res = MV.doAction(g, a, o && o.id);
        assert.ok(res.msg && !BAD_TEXT.test(res.msg), `${id}: ${res.msg}`);
      });
    }
  });
  assert.deepEqual(act(MV, 'clases').opts(adult(MV, 2)).map((o) => o.id), ['baile', 'idiomas', 'manejo', 'cocina']);
});

test('el maratón pide Deporte 40 y el refugio a veces te deja un gato', () => {
  const MV = load({ seed: 2 });
  const g = adult(MV, 2); g.p.skills.deporte = 20;
  const res = MV.doAction(g, act(MV, 'maraton'));
  assert.ok(res.blocked); assert.match(res.msg, /40/);
  let cats = 0;
  for (let i = 0; i < 80; i++) {
    const h = adult(MV, 300 + i);
    const before = MV.rels(h, 'mascota').length;
    MV.doAction(h, act(MV, 'refugio'));
    if (MV.rels(h, 'mascota').length > before) cats++;
  }
  assert.ok(cats >= 2 && cats <= 30, 'gatos adoptados en el refugio: ' + cats);
});

/** Cantidad de opciones que tenían antes de la Parte D. */
const BEFORE = { vecino_nuevo: 3, vecino_ruidoso: 4, donar_sangre: 3, bunker: 2, principe_correo: 3, vida_calle: 4, reunion_familiar: 3, padre_enfermo: 3,
  discurso_boda: 3, amigo_prestamo: 2, perro_puerta: 3, carcel_estudio: 2, prestamista: 3, auditoria: 3, carcel_guardia: 3 };

function setup(MV, seed, id) {
  const g = adult(MV, seed);
  const ctx = {};
  const friend = () => { const n = MV.newNPC(g, { age: 30 }); MV.addRel(g, n, 'amigo', 60); return n.id; };
  if (id === 'discurso_boda' || id === 'amigo_prestamo') ctx.target = friend();
  if (id === 'padre_enfermo') { const dad = MV.rels(g, 'padre')[0] || { n: MV.newNPC(g, { age: 60 }) }; if (!MV.relOf(g, dad.n.id)) MV.addRel(g, dad.n, 'padre', 60); dad.n.age = 60; ctx.target = dad.n.id; }
  if (id === 'carcel_estudio' || id === 'carcel_guardia') g.p.prison = { left: 3, total: 3, crime: 'Robo', behavior: 50, gang: false, since: 29 };
  if (id === 'prestamista') g.p.money = -5000;
  if (id === 'auditoria') { g.p.job = { id: MV.JOBS[0].id, level: 1, salary: 80000, perf: 60, years: 2, lvlYears: 1, type: 'full', start: 28 }; }
  if (id === 'vida_calle') g.p.housing = 'calle';
  if (id === 'reunion_familiar') for (let k = 0; k < 3; k++) MV.addRel(g, MV.newNPC(g, { age: 30 + k }), 'hermano', 60);
  return { g, ctx };
}

test('los 15 eventos tienen una opción más que funciona', () => {
  const MV = load({ seed: 3 });
  Object.keys(BEFORE).forEach((id) => {
    const d = MV.EV.byId[id];
    assert.ok(d, 'falta el evento ' + id);
    assert.equal(d.choices.length, BEFORE[id] + 1, id);
    const last = d.choices.length - 1;
    for (let i = 0; i < 12; i++) {
      const { g, ctx } = setup(MV, 400 + i, id);
      MV.EV.push(g, id, ctx, true);
      const v = MV.EV.view(g);
      assert.ok(v && v.id === id, id + ' no se mostró');
      const c = v.choices.find((x) => x.i === last);
      assert.ok(c, `${id}: la opción nueva no está disponible`);
      assert.ok(!BAD_TEXT.test(c.label), c.label);
      const res = MV.EV.choose(g, last);
      assert.ok(res && !BAD_TEXT.test(res.msg || ''), `${id}: ${res && res.msg}`);
    }
  });
});

function withJob(MV, seed) {
  const g = adult(MV, seed);
  const J = MV.JOBS.find((c) => !c.req.lic && !c.req.edu && c.titles.length >= 3);
  MV.sys.career.hire(g, J, 0);
  return { g, J };
}
const jobAct = (MV, g, id) => MV.sys.career.actions(g).find((a) => a.id === id);

test('trabajar desde casa baja el estrés y un poco el rendimiento', () => {
  const MV = load({ seed: 4 });
  const { g } = withJob(MV, 4);
  g.p.stress = 60; const perf = g.p.job.perf;
  const res = MV.doAction(g, jobAct(MV, g, 'desde_casa'));
  assert.ok(!BAD_TEXT.test(res.msg), res.msg);
  assert.ok(g.p.stress < 60);
  assert.ok(g.p.job.perf <= perf);
});

test('el año sabático deja el trabajo y lo puedes recuperar al año siguiente', () => {
  const MV = load({ seed: 5 });
  let back = 0, lost = 0;
  for (let i = 0; i < 40; i++) {
    const { g, J } = withJob(MV, 500 + i);
    const salary = g.p.job.salary;
    const res = MV.doAction(g, jobAct(MV, g, 'sabatico'));
    assert.ok(!BAD_TEXT.test(res.msg), res.msg);
    assert.equal(g.p.job, null, 'deja el trabajo');
    g.p.age++;
    MV.sys.career.yearly(g);
    if (g.p.job) { back++; assert.equal(g.p.job.id, J.id); assert.ok(g.p.job.salary >= salary); } else lost++;
    assert.ok(!g.p.flags.sabbatical, 'el sabático termina al año siguiente');
  }
  assert.ok(back > 15 && lost > 0, `recuperados ${back}, perdidos ${lost}`);
});

test('la capacitación cuesta, sube el rendimiento y ayuda al ascenso', () => {
  const MV = load({ seed: 6 });
  const { g } = withJob(MV, 6);
  const m0 = g.p.money, perf = g.p.job.perf;
  const res = MV.doAction(g, jobAct(MV, g, 'capacitacion'));
  assert.ok(!BAD_TEXT.test(res.msg), res.msg);
  assert.equal(g.p.money, m0 - 1500);
  assert.ok(g.p.job.perf > perf);
  assert.equal(g.p.job.trained, g.p.age);
  g.p.money = 100; g.p.yearActs = {};
  assert.ok(!jobAct(MV, g, 'capacitacion') || MV.doAction(g, jobAct(MV, g, 'capacitacion')).blocked, 'sin dinero no se capacita');
});

test('si caes preso durante el año sabático, el puesto no te espera', () => {
  const MV = load({ seed: 7 });
  for (let i = 0; i < 15; i++) {
    const { g } = withJob(MV, 700 + i);
    g.p.job.perf = 100;
    MV.doAction(g, jobAct(MV, g, 'sabatico'));
    g.p.prison = { left: 2, total: 2, crime: 'Robo', behavior: 50, gang: false, since: g.p.age };
    g.p.age++;
    MV.sys.career.yearly(g);
    assert.equal(g.p.job, null);
  }
});
