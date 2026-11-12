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

// ——— Tarea 3: el jefe en el año laboral ———
function withBoss(MV, seed, kind, rel) {
  const g = worker(MV, seed, 'cajero');
  g.p.job.boss.kind = kind;
  MV.relOf(g, g.p.job.boss.id).rel = rel;
  g.p.job.mates.forEach((m) => { m.bossRel = 50; });
  return g;
}
const act = (MV, g, id) => MV.sys.career.actions(g).find((a) => a.id === id);

test('la relación con el jefe mueve el ascenso', () => {
  const MV = load({ seed: 31 });
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, a + ' ≈ ' + b);
  near(W(MV).promoMod(withBoss(MV, 31, 'ausente', 100)), 0.25);
  near(W(MV).promoMod(withBoss(MV, 31, 'ausente', 0)), -0.25);
  near(W(MV).promoMod(withBoss(MV, 31, 'trepador', 40)), -0.25);
  near(W(MV).promoMod(withBoss(MV, 31, 'buenazo', 50)), 0.1);
  const g = withBoss(MV, 31, 'ausente', 50);
  g.p.job.mates[0].role = 'rival'; g.p.job.mates[0].bossRel = 70;
  near(W(MV).promoMod(g), -0.1);
});

test('regla de despido', () => {
  const MV = load({ seed: 32 });
  assert.deepEqual(W(MV).fireRule(withBoss(MV, 32, 'ausente', 20)), { perf: 30, chance: 0.55 });
  assert.deepEqual(W(MV).fireRule(withBoss(MV, 32, 'ausente', 50)), { perf: 22, chance: 0.4 });
});

test('estrés por carácter y fines de semana', () => {
  const MV = load({ seed: 33 });
  const delta = (kind, weekends) => {
    const g = withBoss(MV, 33, kind, 50); g.p.job.perf = 50; g.p.stress = 40;
    if (weekends) g.p.job.weekends = true;
    W(MV).yearly(g);
    return g.p.stress - 40;
  };
  const base = delta('ausente');
  assert.equal(delta('controlador') - base, 2);
  assert.equal(delta('griton') - base, 3);
  assert.equal(delta('ausente', true) - base, 4);
});

test('bono: solo con buen rendimiento y sin crisis', () => {
  const MV = load({ seed: 34 });
  let paid = 0;
  for (let s = 0; s < 50; s++) {
    MV.rng.seed(700 + s);
    const g = withBoss(MV, 700 + s, 'ausente', 50); g.p.job.perf = 90;
    const m0 = g.p.money, amt = W(MV).bonus(g);
    if (amt) { paid++; assert.equal(g.p.money, m0 + amt); assert.ok(amt >= g.p.job.salary * 0.05 - 1 && amt <= g.p.job.salary * 0.15 + 1, 'bono ' + amt); }
  }
  assert.ok(paid >= 1, 'algún bono');
  const crisis = MV.WORLD_NEWS.find((n) => n.mods && n.mods.hire < 0);
  for (let s = 0; s < 30; s++) {
    MV.rng.seed(800 + s);
    const g = withBoss(MV, 800 + s, 'ausente', 50); g.p.job.perf = 70;
    assert.equal(W(MV).bonus(g), 0, 'sin bono con rendimiento 70');
    const h = withBoss(MV, 800 + s, 'ausente', 50); h.p.job.perf = 95; h.world = { id: crisis.id, age: h.p.age };
    assert.equal(W(MV).bonus(h), 0, 'sin bono en crisis');
  }
});

test('sin jefe el trabajo sigue y llega otro', () => {
  const MV = load({ seed: 35 });
  const g = withBoss(MV, 35, 'buenazo', 90);
  const old = g.p.job.boss.id;
  MV.removeRel(g, old);
  assert.equal(W(MV).boss(g), null);
  assert.equal(W(MV).promoMod(g), 0, 'sin jefe cuenta como relación 50 y Ausente');
  assert.doesNotThrow(() => MV.sys.career.actions(g));
  W(MV).yearly(g);
  assert.ok(W(MV).boss(g), 'llegó un jefe nuevo');
  assert.notEqual(W(MV).boss(g).n.id, old);
  const h = withBoss(MV, 36, 'ausente', 50);
  MV.person(h, h.p.job.boss.id).alive = false;
  W(MV).yearly(h);
  assert.ok(W(MV).boss(h) && W(MV).boss(h).n.alive, 'si el jefe muere, llega otro');
});

test('hablar con el jefe según su carácter', () => {
  const MV = load({ seed: 37 });
  const talk = (kind, seed) => {
    MV.rng.seed(seed);
    const g = withBoss(MV, seed, kind, 50); g.p.job.perf = 50; g.p.stats.happy = 50;
    const r = MV.relOf(g, g.p.job.boss.id);
    const res = MV.doAction(g, act(MV, g, 'jefe'));
    assert.ok(!BAD_TEXT.test(res.msg), res.msg);
    return { rel: r.rel - 50, perf: g.p.job.perf - 50, happy: g.p.stats.happy - 50, msg: res.msg };
  };
  assert.equal(talk('buenazo', 1).rel, 5);
  assert.equal(talk('controlador', 2).perf, 4);
  const a = talk('ausente', 3); assert.equal(a.rel, 0); assert.equal(a.perf, 0);
  const t = talk('trepador', 4); assert.equal(t.rel, 3); assert.equal(t.perf, -3);
  const seen = new Set();
  for (let s = 0; s < 40; s++) seen.add(talk('griton', 100 + s).happy);
  assert.ok(seen.has(-4) && seen.has(0), [...seen].join(','));
});

test('caerle bien al jefe', () => {
  const MV = load({ seed: 38 });
  const g = withBoss(MV, 38, 'ausente', 50); g.p.karma = 10;
  const mates0 = g.p.job.mates.map((m) => MV.relOf(g, m.id).rel);
  const a = act(MV, g, 'adular');
  assert.ok(a, 'existe la acción');
  assert.equal(a.limit, 1);
  MV.doAction(g, a);
  const rel = MV.relOf(g, g.p.job.boss.id).rel;
  assert.ok(rel >= 54 && rel <= 60, 'relación ' + rel);
  assert.equal(g.p.karma, 9);
  g.p.job.mates.forEach((m, i) => assert.equal(MV.relOf(g, m.id).rel, mates0[i] - 2));
  assert.ok(MV.doAction(g, a).blocked, 'límite 1 por año');
  const h = worker(MV, 39, 'repartidor');
  assert.ok(!act(MV, h, 'adular'), 'medio tiempo no tiene adular');
});

test('jefe gritón: esforzarse rinde 3 más; controlador: el año pesa más', () => {
  const MV = load({ seed: 40 });
  for (let s = 0; s < 20; s++) {
    MV.rng.seed(900 + s);
    const g = withBoss(MV, 900 + s, 'griton', 50); g.p.job.perf = 50;
    MV.doAction(g, act(MV, g, 'esforzarse'));
    assert.ok(g.p.job.perf - 50 >= 7 && g.p.job.perf - 50 <= 13, 'gritón ' + (g.p.job.perf - 50));
  }
  const avg = (kind) => {
    let sum = 0, n = 0;
    for (let s = 0; s < 60; s++) {
      MV.rng.seed(1200 + s);
      const g = withBoss(MV, 1200 + s, kind, 50); g.p.job.perf = 100; g.p.stats.smarts = 0; g.p.job.lvlYears = 0;
      MV.sys.career.yearly(g);
      if (g.p.job) { sum += g.p.job.perf; n++; }
    }
    return sum / n;
  };
  assert.ok(avg('controlador') < avg('ausente') - 4, 'con controlador el rendimiento cae más rápido');
});

// ——— Tarea 4: negociar el sueldo ———
function interview(MV, g, jobId) {
  g.queue = [];
  MV.EV.push(g, 'entrevista', { job: jobId, q: 0, order: [0, 1, 2] }, true);
  return MV.EV.choose(g, 0); // la respuesta 0 es la de mejor calidad
}
function offer(MV, g, jobId, salary) {
  g.queue = [];
  MV.EV.push(g, 'oferta_trabajo', { job: jobId, level: 0, salary }, true);
  return MV.EV.view(g);
}

test('pasar la entrevista de tiempo completo trae una oferta', () => {
  const MV = load({ seed: 41 });
  let offers = 0;
  for (let s = 0; s < 20 && !offers; s++) {
    MV.rng.seed(1500 + s);
    const g = worker(MV, 1500 + s); Object.assign(g.p.stats, { smarts: 100, looks: 100 }); g.p.skills.carisma = 100;
    interview(MV, g, 'barrendero');
    if (!g.queue.length) continue;
    offers++;
    assert.equal(g.queue[0].id, 'oferta_trabajo');
    assert.equal(g.p.job, null, 'todavía no te contrataron');
    const sal = g.queue[0].ctx.salary, J = MV.jobById('barrendero');
    assert.ok(sal >= J.pay[0] * 0.9 - 1 && sal <= J.pay[0] * 1.1 + 1, 'sueldo ofrecido ' + sal);
  }
  assert.ok(offers, 'alguna entrevista aprobada');
});

test('medio tiempo se contrata directo', () => {
  const MV = load({ seed: 42 });
  let hired = 0;
  for (let s = 0; s < 20 && !hired; s++) {
    MV.rng.seed(1600 + s);
    const g = worker(MV, 1600 + s); Object.assign(g.p.stats, { smarts: 100, looks: 100, health: 100 });
    interview(MV, g, 'repartidor');
    if (g.p.job) { hired++; assert.equal(g.p.job.id, 'repartidor'); assert.ok(!g.queue.some((q) => q.id === 'oferta_trabajo')); }
  }
  assert.ok(hired);
});

test('oferta: aceptar, pedir 10 % y pedir 25 %', () => {
  const MV = load({ seed: 43 });
  const g = worker(MV, 43);
  const v = offer(MV, g, 'cajero', 20000);
  assert.equal(v.choices.length, 3);
  v.choices.forEach((c) => { assert.ok(c.sub, 'subtítulo con el riesgo'); assert.ok(!BAD_TEXT.test(c.label + c.sub), c.label); });
  assert.match(v.choices[1].label, /22\.000/);
  assert.match(v.choices[2].label, /25\.000/);
  MV.EV.choose(g, 0);
  assert.equal(g.p.job.id, 'cajero'); assert.equal(g.p.job.salary, 20000); assert.ok(W(MV).boss(g));
  const ten = new Set();
  for (let s = 0; s < 200; s++) {
    MV.rng.seed(2000 + s);
    const h = worker(MV, 2000 + s); h.p.skills.carisma = 0;
    offer(MV, h, 'cajero', 20000);
    const r = MV.EV.choose(h, 1);
    assert.ok(h.p.job, 'pedir 10 % nunca deja sin trabajo');
    ten.add(h.p.job.salary);
    assert.ok(!BAD_TEXT.test(r.msg), r.msg);
  }
  assert.deepEqual([...ten].sort(), [20000, 22000]);
  let up = 0; const seen = new Set();
  for (let s = 0; s < 200; s++) {
    MV.rng.seed(3000 + s);
    const h = worker(MV, 3000 + s, 'cartero'); h.p.skills.carisma = 0;
    const oldBoss = h.p.job.boss.id;
    offer(MV, h, 'cajero', 20000);
    const r = MV.EV.choose(h, 2);
    assert.ok(!BAD_TEXT.test(r.msg), r.msg);
    if (h.p.job.id === 'cartero') { seen.add('retirada'); assert.equal(h.p.job.boss.id, oldBoss, 'el trabajo anterior sigue intacto'); continue; }
    if (h.p.job.salary === 25000) { up++; seen.add('25'); } else { assert.equal(h.p.job.salary, 20000); seen.add('igual'); }
  }
  assert.deepEqual([...seen].sort(), ['25', 'igual', 'retirada']);
  assert.ok(up / 200 >= 0.3 && up / 200 <= 0.5, 'tasa de éxito ' + up / 200);
});

test('aceptar una oferta con trabajo previo cambia la gente', () => {
  const MV = load({ seed: 44 });
  const g = worker(MV, 44, 'cajero');
  const oldBoss = g.p.job.boss.id; MV.relOf(g, oldBoss).rel = 50;
  offer(MV, g, 'cartero', 21000);
  MV.EV.choose(g, 0);
  assert.equal(g.p.job.id, 'cartero');
  assert.equal(MV.relOf(g, oldBoss), undefined);
  assert.ok(W(MV).boss(g) && W(MV).boss(g).n.id !== oldBoss);
});

test('pedir aumento: tres opciones', () => {
  const MV = load({ seed: 45 });
  const g = withBoss(MV, 45, 'ausente', 50);
  const res = MV.doAction(g, act(MV, g, 'aumento'));
  assert.equal(res.msg, '');
  assert.equal(g.queue[0].id, 'pedir_aumento');
  const v = MV.EV.view(g);
  assert.equal(v.choices.length, 3);
  v.choices.forEach((c) => assert.ok(c.sub && !BAD_TEXT.test(c.label + c.sub + v.text), c.label));
  const ask = (seed, kind, rel, perf, i) => {
    MV.rng.seed(seed);
    const h = withBoss(MV, seed, kind, rel); h.p.job.perf = perf; h.p.job.salary = 100000; h.queue = [];
    MV.EV.push(h, 'pedir_aumento', {}, true);
    const r = MV.EV.choose(h, i);
    assert.ok(!BAD_TEXT.test(r.msg), r.msg);
    return h;
  };
  let ok5 = 0;
  for (let s = 0; s < 100; s++) if (ask(4000 + s, 'buenazo', 100, 100, 0).p.job.salary === 105000) ok5++;
  assert.ok(ok5 >= 90, 'el 5 % casi siempre sale con todo a favor: ' + ok5);
  let ok15 = 0;
  for (let s = 0; s < 100; s++) if (ask(5000 + s, 'trepador', 0, 0, 1).p.job.salary === 115000) ok15++;
  assert.ok(ok15 <= 10, 'el 15 % casi nunca sale con todo en contra: ' + ok15);
  const seen = new Set();
  for (let s = 0; s < 200; s++) {
    const h = ask(6000 + s, 'ausente', 50, 50, 2);
    if (!h.p.job) { seen.add('afuera'); assert.equal(MV.rels(h, 'jefe').length, 0, 'se limpió el jefe'); }
    else if (h.p.job.salary === 120000) seen.add('20');
    else { assert.equal(MV.relOf(h, h.p.job.boss.id).rel, 35); seen.add('-15'); }
  }
  assert.deepEqual([...seen].sort(), ['-15', '20', 'afuera']);
});

// ——— Tarea 5: encargos freelance ———
function skilled(MV, seed, skills, age) {
  const g = MV.newGame({ seed }); g.p.age = age || 30; g.queue = [];
  Object.keys(g.p.skills).forEach((k) => { g.p.skills[k] = 0; });
  Object.assign(g.p.skills, skills || {});
  return g;
}

test('freelance: opciones según habilidades', () => {
  const MV = load({ seed: 51 });
  const g = skilled(MV, 51, { programacion: 30, arte: 5 });
  const os = W(MV).freelanceOptions(g);
  assert.deepEqual(os.map((o) => o.id), ['programacion']);
  assert.ok(os[0].icon && os[0].label && os[0].sub);
});

test('freelance: pago, mitad y límite', () => {
  const MV = load({ seed: 52 });
  let half = 0;
  for (let s = 0; s < 300; s++) {
    MV.rng.seed(7000 + s);
    const g = skilled(MV, 7000 + s, { programacion: 40 }); g.p.money = 0; g.p.stress = 20;
    const msg = W(MV).freelance(g, 'programacion');
    assert.ok(!BAD_TEXT.test(msg), msg);
    assert.ok(g.p.money >= 40 * 75 && g.p.money <= 40 * 400, 'pago ' + g.p.money);
    assert.ok(g.p.skills.programacion > 40 && g.p.skills.programacion <= 41, 'habilidad ' + g.p.skills.programacion); // +1 con rendimientos decrecientes (fx.skill)
    assert.equal(g.p.stress, 23);
    if (/exposición/.test(msg)) { half++; assert.ok(g.p.money <= 40 * 200); }
  }
  assert.ok(half >= 1, 'a veces te pagan en exposición');
  const g = skilled(MV, 53, { programacion: 40 });
  const a = W(MV).freelanceAction(g);
  assert.equal(a.id, 'freelance'); assert.equal(a.limit, 2);
  assert.ok(!MV.doAction(g, a, 'programacion').blocked);
  assert.ok(!MV.doAction(g, a, 'programacion').blocked);
  assert.ok(MV.doAction(g, a, 'programacion').blocked, 'la tercera queda bloqueada');
});

test('freelance: sin habilidad o muy joven explica qué falta', () => {
  const MV = load({ seed: 54 });
  const g = skilled(MV, 54, {});
  const a = W(MV).freelanceAction(g);
  assert.ok(!a.opts, 'sin opciones no hay lista');
  assert.equal(a.check(g), 'Para tomar encargos necesitas alguna habilidad en 10 o más (programación, arte, idiomas, cocina, música o carisma).');
  const y = skilled(MV, 55, { arte: 50 }, 15);
  assert.equal(W(MV).freelanceAction(y).check(y), 'Los encargos freelance son desde los 16 años.');
});

test('freelance con o sin trabajo', () => {
  const MV = load({ seed: 56 });
  const g = skilled(MV, 56, { cocina: 25 }); g.p.job = null;
  assert.ok(!MV.doAction(g, W(MV).freelanceAction(g), 'cocina').blocked);
  const h = worker(MV, 57, 'cajero'); h.p.skills.cocina = 25;
  assert.ok(!MV.doAction(h, W(MV).freelanceAction(h), 'cocina').blocked);
});

// ——— Tarea 6: decisiones laborales y traslado ———
const WORK_EVENTS = ['trabajo_maquillar', 'trabajo_huelga', 'trabajo_traslado', 'trabajo_romance', 'trabajo_credito', 'trabajo_fiesta',
  'trabajo_reestructuracion', 'trabajo_competencia', 'trabajo_ascenso_trampa', 'trabajo_error', 'trabajo_jefe_nuevo', 'trabajo_aliado'];
/** Oficina completa: cajero nivel 1 de 3 (no máximo), un aliado, un rival y un chismoso. */
function office(MV, seed) {
  MV.rng.seed(seed);
  const g = worker(MV, seed, 'cajero');
  g.p.job.level = 1; g.p.money = 100000; g.p.job.salary = 50000;
  g.p.job.mates[0].role = 'aliado'; g.p.job.mates[1].role = 'rival';
  const n = MV.newNPC(g, { age: 30 }); MV.addRel(g, n, 'companero', 60);
  g.p.job.mates.push({ id: n.id, role: 'chismoso', bossRel: 50 });
  return g;
}
const copy = (g) => JSON.parse(JSON.stringify(g));
function decide(MV, g, id, i) {
  g.queue = []; MV.EV.push(g, id, {}, true);
  const v = MV.EV.view(g);
  const c = v.choices.find((x) => x.i === i) || v.choices[i];
  return MV.EV.choose(g, c.i);
}

test('los 12 eventos se disparan con textos limpios', () => {
  const MV = load({ seed: 61 });
  WORK_EVENTS.forEach((id) => {
    assert.ok(MV.EV.byId[id], id);
    const g = office(MV, 61);
    if (id === 'trabajo_reestructuracion') g.p.job.level = 2; // pide nivel 2 o más
    g.queue = []; MV.EV.push(g, id, {}, true);
    if (!MV.EV.byId[id].choices) { // automático: va directo al diario
      const it = g.log[g.log.length - 1].items.slice(-1)[0];
      assert.ok(it && !BAD_TEXT.test(it.t), id + ': ' + (it && it.t));
      return;
    }
    const v = MV.EV.view(g);
    assert.ok(v, id + ' se puede ver');
    assert.ok(!BAD_TEXT.test(v.title + v.text), id + ': ' + v.title + ' ' + v.text);
    v.choices.forEach((c) => {
      assert.ok(!BAD_TEXT.test(c.label + (c.sub || '')), id + ': ' + c.label);
      const h = copy(g);
      const res = MV.EV.choose(h, c.i);
      assert.ok(res && !BAD_TEXT.test(res.msg), id + ' / ' + c.label + ': ' + (res && res.msg));
    });
  });
});

test('efectos principales de las decisiones', () => {
  const MV = load({ seed: 62 });
  // Maquillar: hacerlo deja la marca; al año siguiente, a veces sale a la luz
  let g = office(MV, 62); const m0 = g.p.money;
  decide(MV, g, 'trabajo_maquillar', 0);
  assert.equal(g.p.job.cooked, g.p.age); assert.equal(g.p.money, m0 + 5000);
  let caught = 0;
  for (let s = 0; s < 200; s++) {
    const h = office(MV, 9000 + s); h.p.job.cooked = h.p.age - 1;
    W(MV).yearly(h);
    if (!h.p.job) { caught++; assert.ok(h.p.record.some((r) => r.crime === 'Fraude contable')); }
  }
  assert.ok(caught / 200 > 0.2 && caught / 200 < 0.5, 'sale a la luz ~35 %: ' + caught / 200);
  // Huelga: sumarte cuesta el 10 % del sueldo
  g = office(MV, 63); const m1 = g.p.money; decide(MV, g, 'trabajo_huelga', 0);
  assert.equal(g.p.money, m1 - 5000);
  // Traslado: otro país, ciudad de ese país y +30 %
  g = office(MV, 64); const c0 = g.p.country; decide(MV, g, 'trabajo_traslado', 0);
  assert.notEqual(g.p.country, c0);
  assert.ok(MV.COUNTRIES[g.p.country].cities.includes(g.p.city), g.p.city);
  assert.equal(g.p.job.salary, 65000);
  // Romance: sin pareja → pareja; con cónyuge → amante
  g = office(MV, 65); decide(MV, g, 'trabajo_romance', 0);
  assert.equal(MV.rels(g, 'pareja').length, 1);
  g = office(MV, 66); const sp = MV.newNPC(g, { age: 30 }); MV.addRel(g, sp, 'conyuge', 70);
  decide(MV, g, 'trabajo_romance', 0);
  assert.equal(MV.rels(g, 'amante').length, 1);
  // Crédito: vengarte deja al rival como enemigo
  g = office(MV, 67); const rival = W(MV).mate(g, 'rival').n.id; decide(MV, g, 'trabajo_credito', 2);
  assert.equal(MV.relOf(g, rival).type, 'enemigo');
  // Fiesta: irte temprano baja 3 de estrés
  g = office(MV, 68); g.p.stress = 40; decide(MV, g, 'trabajo_fiesta', 2);
  assert.equal(g.p.stress, 37);
  // Reestructuración: despedir al rival / renunciar en protesta
  g = office(MV, 69); g.p.job.level = 2; const rv = W(MV).mate(g, 'rival').n.id;
  decide(MV, g, 'trabajo_reestructuracion', 0);
  assert.equal(MV.relOf(g, rv).type, 'enemigo'); assert.ok(!g.p.job.mates.some((m) => m.id === rv));
  g = office(MV, 70); g.p.job.level = 2; decide(MV, g, 'trabajo_reestructuracion', 2);
  assert.equal(g.p.job, null);
  // Competencia: aceptar da +20 %, jefe nuevo y lvlYears 0
  g = office(MV, 71); const b0 = g.p.job.boss.id; MV.relOf(g, b0).rel = 50; g.p.job.lvlYears = 3;
  decide(MV, g, 'trabajo_competencia', 0);
  assert.equal(g.p.job.salary, 60000); assert.notEqual(W(MV).boss(g).n.id, b0); assert.equal(g.p.job.lvlYears, 0);
  // Ascenso con trampa: sube de nivel y fija los fines de semana
  g = office(MV, 72); decide(MV, g, 'trabajo_ascenso_trampa', 0);
  assert.equal(g.p.job.level, 2); assert.equal(g.p.job.weekends, true);
  // Error: culpar con éxito deja al compañero como enemigo
  let blamed = 0;
  for (let s = 0; s < 40 && !blamed; s++) {
    g = office(MV, 9500 + s); const before = g.p.job.mates.map((m) => m.id);
    decide(MV, g, 'trabajo_error', 1);
    if (before.some((id) => (MV.relOf(g, id) || {}).type === 'enemigo')) blamed++;
  }
  assert.ok(blamed, 'culpar a veces funciona');
  // Esconderlo: al año siguiente, a veces se descubre
  let found = 0;
  for (let s = 0; s < 100; s++) { const h = office(MV, 9600 + s); h.p.job.perf = 60; h.p.job.hidden = h.p.age - 1; W(MV).yearly(h); if (h.p.job.perf === 35) found++; }
  assert.ok(found > 25 && found < 75, 'esconderlo sale a la luz ~50 %: ' + found);
  // Jefe nuevo y aliado (automáticos)
  g = office(MV, 73); const b1 = g.p.job.boss.id; MV.EV.push(g, 'trabajo_jefe_nuevo', {}, true);
  assert.notEqual(W(MV).boss(g).n.id, b1);
  g = office(MV, 74); g.p.job.perf = 50; MV.EV.push(g, 'trabajo_aliado', {}, true);
  assert.equal(g.p.job.perf, 56);
});

test('traslado con casa, pareja e hijos', () => {
  const MV = load({ seed: 75 });
  const g = office(MV, 75);
  g.p.housing = 'propia'; g.p.assets.push({ id: 'casa1', type: 'casa', kind: 'Casa pequeña', value: 100000, cond: 80, bought: 25 }); g.p.home = 'casa1';
  const sp = MV.newNPC(g, { age: 30 }); MV.addRel(g, sp, 'conyuge', 70);
  const kid = MV.newNPC(g, { age: 5 }); MV.addRel(g, kid, 'hijo', 80);
  decide(MV, g, 'trabajo_traslado', 0);
  assert.equal(MV.relOf(g, sp.id).type, 'conyuge');
  assert.equal(MV.relOf(g, kid.id).type, 'hijo');
  assert.ok(g.p.assets.some((a) => a.id === 'casa1'));
  assert.ok(MV.COUNTRIES[g.p.country].cities.includes(g.p.city));
  g.queue = [];
  assert.doesNotThrow(() => MV.ageUp(g));
});

test('los eventos no salen sin trabajo de tiempo completo', () => {
  const MV = load({ seed: 76 });
  const none = worker(MV, 76); const part = worker(MV, 77, 'repartidor');
  WORK_EVENTS.forEach((id) => {
    assert.equal(MV.EV.eligible(none, MV.EV.byId[id]), null, id + ' sin trabajo');
    assert.equal(MV.EV.eligible(part, MV.EV.byId[id]), null, id + ' con medio tiempo');
  });
});

test('la pareja de la oficina no se vuelve "amiga" al dejar el trabajo', () => {
  const MV = load({ seed: 78 });
  const g = office(MV, 78);
  decide(MV, g, 'trabajo_romance', 0);
  const lover = MV.rels(g, 'pareja')[0].n.id;
  MV.relOf(g, lover).rel = 90;
  MV.sys.career.leave(g, 'renuncia');
  assert.equal(MV.relOf(g, lover).type, 'pareja');
});

test('un despido por la auditoría corta el año laboral sin errores', () => {
  const MV = load({ seed: 79 });
  let fired = 0;
  for (let s = 0; s < 60; s++) {
    const g = office(MV, 9700 + s); g.p.job.cooked = g.p.age - 1; g.p.job.perf = 90; g.p.job.lvlYears = 5;
    assert.doesNotThrow(() => MV.sys.career.yearly(g));
    if (!g.p.job) fired++;
  }
  assert.ok(fired, 'algún despido por la auditoría');
});
