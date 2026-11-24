/* Memoria: los tipos de recuerdo y cómo se guardan. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
const MEM = (MV) => MV.sys.memory;
/** Partida con el jugador a esa edad, sin cola y sin mascotas. */
function game(MV, seed, age) {
  const g = MV.newGame({ seed }); g.p.age = age == null ? 30 : age; g.queue = [];
  g.p.rels = g.p.rels.filter((r) => r.type !== 'mascota');
  return g;
}
/** Agrega una persona con esa relación. */
function person(MV, g, type, gender) {
  const n = MV.newNPC(g, { gender: gender || 'm', age: 35 });
  g.people[n.id] = n;
  return { n, r: MV.addRel(g, n, type || 'amigo', 60) };
}

test('guardar un recuerdo', () => {
  const MV = load({ seed: 1 }); const g = game(MV, 1, 30); const { n, r } = person(MV, g);
  const m = MEM(MV).remember(g, n.id, 'prestamo', 5000);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r.mem)), [{ k: 'prestamo', a: 30, v: 2, d: 5000 }]);
  assert.strictEqual(m, r.mem[0]);
});

test('repetir refuerza el mismo recuerdo', () => {
  const MV = load({ seed: 2 }); const g = game(MV, 2, 30); const { n, r } = person(MV, g);
  for (const age of [30, 31, 32]) { g.p.age = age; MEM(MV).remember(g, n.id, 'prestamo', 1000); }
  assert.strictEqual(r.mem.length, 1);
  assert.strictEqual(r.mem[0].v, 3); assert.strictEqual(r.mem[0].d, 3000); assert.strictEqual(r.mem[0].a, 32);

  const b = person(MV, g);
  MEM(MV).remember(g, b.n.id, 'insulto', 'es un inútil');
  MEM(MV).remember(g, b.n.id, 'insulto', 'es un cobarde');
  assert.strictEqual(b.r.mem.length, 1);
  assert.strictEqual(b.r.mem[0].v, -2); assert.strictEqual(b.r.mem[0].d, 'es un cobarde');

  r.mem[0].done = true;
  MEM(MV).remember(g, n.id, 'prestamo', 1000);
  assert.strictEqual(r.mem.length, 2);
});

test('el peso del dinero depende del monto', () => {
  const MV = load({ seed: 3 }); const g = game(MV, 3, 30);
  const w = (k, d, x) => {
    const { n } = person(MV, g);
    return MEM(MV).remember(g, n.id, k, d, x).v;
  };
  assert.strictEqual(w('dinero', 500), 1);
  assert.strictEqual(w('dinero', 1000), 2);
  assert.strictEqual(w('dinero', 20000), 3);
  assert.strictEqual(w('regalo', 'Reloj', 2), 2);
});

test('nunca más de 6, y el orden de descarte', () => {
  const MV = load({ seed: 4 }); const g = game(MV, 4, 30);
  const fill = (r) => {
    r.mem = [
      { k: 'prestamo', a: 20, v: 2, d: 1 }, { k: 'dinero', a: 25, v: 3, d: 1 },
      { k: 'apoyo', a: 22, v: 1 }, { k: 'espiar', a: 21, v: -2 },
      { k: 'golpe', a: 10, v: -3 }, { k: 'broma', a: 24, v: -1 }
    ];
  };
  const a = person(MV, g); fill(a.r);
  MEM(MV).remember(g, a.n.id, 'ruptura');
  assert.strictEqual(a.r.mem.length, 6);
  // |v| = 1: apoyo (a 22) y broma (a 24); se va el más viejo, apoyo.
  assert.ok(!a.r.mem.some((m) => m.k === 'apoyo'));
  assert.ok(a.r.mem.some((m) => m.k === 'broma') && a.r.mem.some((m) => m.k === 'ruptura'));

  const b = person(MV, g); fill(b.r); b.r.mem[4].done = true;
  MEM(MV).remember(g, b.n.id, 'ruptura');
  assert.strictEqual(b.r.mem.length, 6);
  assert.ok(!b.r.mem.some((m) => m.k === 'golpe'));
  assert.ok(b.r.mem.some((m) => m.k === 'apoyo'));
});

test('quiénes no guardan recuerdos', () => {
  const MV = load({ seed: 5 }); const g = game(MV, 5, 30);
  const pet = MV.newPet(g, 'gato', { age: 3 }); const pr = MV.addRel(g, pet, 'mascota', 70);
  assert.strictEqual(MEM(MV).remember(g, pet.id, 'golpe'), null); assert.ok(!pr.mem);
  const st = person(MV, g, 'acosador');
  assert.strictEqual(MEM(MV).remember(g, st.n.id, 'golpe'), null); assert.ok(!st.r.mem);
  assert.strictEqual(MEM(MV).remember(g, 'nadie', 'golpe'), null);
  const ok = person(MV, g);
  g.p.alive = false;
  assert.strictEqual(MEM(MV).remember(g, ok.n.id, 'golpe'), null); assert.ok(!ok.r.mem);
});

test('cada tipo se lee bien con y sin dato', () => {
  const MV = load({ seed: 6 }); const g = game(MV, 6, 30);
  const kinds = Object.keys(MV.MEMORY_KINDS);
  assert.strictEqual(kinds.length, 15);
  const datum = { prestamo: 5000, dinero: 20000, regalo: 'Un reloj', inversion: 5000, insulto: 'es un inútil', infidelidad: 'su prima' };
  for (const gender of ['m', 'f']) {
    const { n } = person(MV, g, 'amigo', gender);
    for (const k of kinds) {
      const without = MEM(MV).said(g, n, { k });
      assert.ok(without && !BAD_TEXT.test(without) && !without.includes('"'), `${k} sin dato: ${without}`);
      const d = datum[k];
      const withD = MEM(MV).said(g, n, { k, d });
      assert.ok(!BAD_TEXT.test(withD) && !withD.includes('"'), `${k} con dato: ${withD}`);
      if (typeof d === 'number') assert.ok(withD.includes(MV.U.money(d)), withD);
      else if (d) assert.ok(withD.includes(d.toLowerCase()) || withD.includes(d), withD);
    }
  }
  const f = person(MV, g, 'amigo', 'f').n; const m = person(MV, g, 'amigo', 'm').n;
  assert.strictEqual(MEM(MV).said(g, f, { k: 'espiar' }), 'la espiaste');
  assert.strictEqual(MEM(MV).said(g, m, { k: 'espiar' }), 'lo espiaste');
  assert.strictEqual(MEM(MV).ago(g, { a: 29 }), 'hace 1 año');
  assert.strictEqual(MEM(MV).ago(g, { a: 15 }), 'hace 15 años');
});

// ——— Tarea 2: de dónde salen los recuerdos ———
const mems = (r) => JSON.parse(JSON.stringify(r.mem || []));
const memOf = (r, k) => (r.mem || []).find((m) => m.k === k);
/** Partida adulta con dinero y una persona de ese tipo. */
function setup(seed, type, gender) {
  const MV = load({ seed }); MV.rng.seed(seed);
  const g = game(MV, seed, 30); g.p.money = 100000;
  const x = person(MV, g, type || 'amigo', gender);
  return { MV, g, n: x.n, r: x.r };
}
/** Ejecuta una acción de relación por su id. */
function act(MV, g, r, n, id, opt) {
  r.acts = {};
  const a = MV.sys.rels.actions(g, r, n).find((x) => x.id === id);
  assert.ok(a, 'acción ' + id);
  return MV.doAction(g, a, opt, r.acts);
}
/** Abre un evento con esa opción y la elige. */
function choose(MV, g, id, ctx, label) {
  g.queue = []; MV.EV.push(g, id, ctx || {}, true);
  const v = MV.EV.view(g);
  const c = v.choices.find((x) => label.test(x.label));
  assert.ok(c, 'opción ' + label);
  return MV.EV.choose(g, c.i);
}
/** Comprueba que la persona tiene ese recuerdo con ese signo y dato. */
function has(r, k, sign, d) {
  const m = memOf(r, k);
  assert.ok(m, `falta el recuerdo ${k}: ${JSON.stringify(mems(r))}`);
  assert.strictEqual(Math.sign(m.v), sign, k);
  if (d !== undefined) assert.deepStrictEqual(m.d, d, k);
  return m;
}
/** Recorre semillas hasta que la prueba devuelva "visto" para cada rama pedida. */
function eachSeed(from, n, fn) {
  const seen = {};
  for (let s = from; s < from + n; s++) { const tag = fn(s); if (tag) seen[tag] = (seen[tag] || 0) + 1; }
  return seen;
}

test('cada fuente deja su recuerdo', () => {
  let t;
  t = setup(101); act(t.MV, t.g, t.r, t.n, 'prestar'); has(t.r, 'prestamo', 1, 1000);
  t = setup(102); choose(t.MV, t.g, 'amigo_prestamo', { target: t.n.id }, /^Prestarle/); has(t.r, 'prestamo', 1, 1000);
  t = setup(103, 'hijo'); act(t.MV, t.g, t.r, t.n, 'dar_dinero', 1000); has(t.r, 'dinero', 1, 1000);
  t = setup(104); t.MV.sys.rels.giveGift(t.g, t.n.id, 'carta'); has(t.r, 'regalo', 1, t.MV.GIFTS.find((x) => x.id === 'carta').name);
  assert.strictEqual(memOf(t.r, 'regalo').v, 1);
  t = setup(105); t.MV.sys.rels.giveGift(t.g, t.n.id, 'reloj'); assert.strictEqual(memOf(t.r, 'regalo').v, 2);
  t = setup(106); act(t.MV, t.g, t.r, t.n, 'escuchar'); has(t.r, 'apoyo', 1);
  t = setup(107); t.r.mem = [];
  let seen = eachSeed(1000, 40, (s) => {
    const x = setup(s); const before = x.g.p.money;
    choose(x.MV, x.g, 'inversion_amigo', { target: x.n.id }, /Invertir/);
    has(x.r, 'inversion', 1, 5000); return x.g.p.money > before ? 'ok' : 'ko';
  });
  assert.ok(seen.ok && seen.ko, JSON.stringify(seen));
  seen = eachSeed(2000, 60, (s) => {
    const x = setup(s);
    const msg = choose(x.MV, x.g, 'discurso_boda', { target: x.n.id }, /Discurso emotivo/);
    if (/Hiciste llorar/.test(msg.text || msg.msg || JSON.stringify(msg))) { has(x.r, 'discurso', 1); return 'ok'; }
    assert.ok(!memOf(x.r, 'discurso'), 'discurso que sale mal'); return 'ko';
  });
  assert.ok(seen.ok && seen.ko, JSON.stringify(seen));
  t = setup(108); act(t.MV, t.g, t.r, t.n, 'insultar');
  const ins = has(t.r, 'insulto', -1);
  assert.strictEqual(typeof ins.d, 'string');
  assert.ok(t.g.log[t.g.log.length - 1].items.some((i) => (i.text || i.msg || JSON.stringify(i)).includes(ins.d)), 'la frase del texto es el dato');
  t = setup(109); act(t.MV, t.g, t.r, t.n, 'atacar'); has(t.r, 'golpe', -1);
  seen = eachSeed(3000, 80, (s) => {
    const x = setup(s, 'pareja', 'f'); const res = act(x.MV, x.g, x.r, x.n, 'espiar_celular');
    if (/te descubrió/.test(res.msg)) { has(x.r, 'espiar', -1); return 'caught'; }
    assert.ok(!memOf(x.r, 'espiar'), 'celular sin descubrir'); return 'free';
  });
  assert.ok(seen.caught && seen.free, JSON.stringify(seen));
  seen = eachSeed(4000, 80, (s) => {
    const x = setup(s); const res = act(x.MV, x.g, x.r, x.n, 'broma');
    if (/salió fatal/.test(res.msg)) { has(x.r, 'broma', -1); return 'mal'; }
    assert.ok(!memOf(x.r, 'broma'), 'broma que sale bien'); return 'bien';
  });
  assert.ok(seen.mal && seen.bien, JSON.stringify(seen));
  // Infidelidad descubierta
  seen = eachSeed(5000, 200, (s) => {
    const x = setup(s, 'conyuge'); const lover = person(x.MV, x.g, 'amante');
    x.g.queue = []; x.MV.sys.rels.yearly(x.g);
    if (x.g.queue.some((e) => e.id === 'infiel_descubierto')) { has(x.r, 'infidelidad', -1, lover.n.first); return 'visto'; }
    return null;
  });
  assert.ok(seen.visto, JSON.stringify(seen));
  t = setup(110, 'pareja'); t.MV.sys.rels.breakUp(t.g, t.n); has(t.r, 'ruptura', -1);
  t = setup(111, 'conyuge'); t.MV.sys.rels.divorce(t.g, t.n, false); has(t.r, 'divorcio', -1);
  // Trabajo
  const office = (s) => {
    const x = setup(s); x.MV.sys.career.hire(x.g, x.MV.jobById('cajero'));
    x.g.p.job.mates[0].role = 'aliado'; x.g.p.job.mates[1].role = 'rival'; return x;
  };
  seen = eachSeed(6000, 60, (s) => {
    const x = office(s); const ids = x.g.p.job.mates.map((m) => m.id);
    const before = JSON.stringify(ids.map((id) => mems(x.MV.relOf(x.g, id))));
    const msg = choose(x.MV, x.g, 'trabajo_error', {}, /Culpar a un compañero/);
    const blamed = ids.filter((id) => memOf(x.MV.relOf(x.g, id), 'humillacion'));
    assert.strictEqual(blamed.length, 1, before);
    const r = x.MV.relOf(x.g, blamed[0]); has(r, 'humillacion', -1);
    return /Te creyeron/.test(JSON.stringify(msg)) ? 'creen' : 'camaras';
  });
  assert.ok(seen.creen && seen.camaras, JSON.stringify(seen));
  seen = eachSeed(7000, 60, (s) => {
    const x = office(s); x.MV.sys.workplace.boss(x.g).r.rel = 50;
    const rival = x.MV.sys.workplace.mate(x.g, 'rival');
    const msg = choose(x.MV, x.g, 'trabajo_credito', {}, /^Reclamar ante/);
    if (/te dio la razón/.test(JSON.stringify(msg))) { has(rival.r, 'humillacion', -1); return 'razon'; }
    assert.ok(!memOf(rival.r, 'humillacion'), 'el jefe no te creyó'); return 'no';
  });
  assert.ok(seen.razon && seen.no, JSON.stringify(seen));
  // Espiar con tu gato
  seen = eachSeed(8000, 120, (s) => {
    const x = setup(s); x.g.p.age = 30;
    const c = x.MV.newPet(x.g, 'gato', { age: 3 }); x.MV.addRel(x.g, c, 'mascota', 90);
    x.MV.sys.talkcat.grant(x.g, c, 'karma'); x.r.rel = 50;
    const msg = x.MV.sys.talkcat.prank(x.g, 'espiar', x.n.id);
    if (x.r.rel === 38) { has(x.r, 'espiar', -1); return 'caught'; }
    assert.ok(!memOf(x.r, 'espiar'), msg); return 'free';
  });
  assert.ok(seen.caught && seen.free, JSON.stringify(seen));
});

test('lo que no deja recuerdo', () => {
  // Divorcio que pide tu ex
  let t = setup(201, 'conyuge'); t.MV.sys.rels.divorce(t.g, t.n, true); assert.ok(!t.r.mem || !t.r.mem.length);
  // Pedir un consejo
  t = setup(202); act(t.MV, t.g, t.r, t.n, 'consejo'); assert.ok(!t.r.mem || !t.r.mem.length);
  // Una broma que sale bien, un celular sin descubrir y un discurso que sale mal quedan cubiertos en 'cada fuente deja su recuerdo'.
});

test('los efectos de siempre no cambian', () => {
  let ok = 0;
  for (let s = 0; s < 400; s++) {
    const x = setup(9000 + s); x.g.p.money = 50000;
    choose(x.MV, x.g, 'inversion_amigo', { target: x.n.id }, /Invertir/);
    // Invertir cuesta $5.000 en los dos casos; si sale bien, se recuperan entre $8.000 y $40.000.
    if (x.g.p.money > 45000) { ok++; assert.ok(x.g.p.money >= 50000 - 5000 + 8000 && x.g.p.money <= 50000 - 5000 + 40000, 'ganancia: ' + x.g.p.money); }
    else assert.strictEqual(x.g.p.money, 45000);
  }
  assert.ok(ok / 400 >= 0.22 && ok / 400 <= 0.38, 'sale bien ' + ok / 400);
  const rels = eachSeed(9500, 80, (s) => {
    const x = setup(s); x.r.rel = 50; const h = x.g.p.stats.happy;
    const msg = JSON.stringify(choose(x.MV, x.g, 'discurso_boda', { target: x.n.id }, /Discurso emotivo/));
    if (/Hiciste llorar/.test(msg)) { assert.strictEqual(x.r.rel, 62); return 'ok'; }
    assert.ok(/Te trabaste/.test(msg), msg); assert.strictEqual(x.r.rel, 52); assert.strictEqual(x.g.p.stats.happy, h - 3); return 'ko';
  });
  assert.ok(rels.ok && rels.ko, JSON.stringify(rels));
});

// ——— Tarea 3: favores ———
/** Encola mem_favor para esa persona y devuelve la vista. */
function favor(MV, g, n, k, d, v) {
  g.queue = [];
  MV.EV.push(g, 'mem_favor', { target: n.id, k, a: g.p.age - 15, d, v }, true);
  return MV.EV.view(g);
}
const accept = (MV, g, v) => MV.EV.choose(g, v.choices.find((c) => /Aceptar/.test(c.label)).i);
/** Partida "sana": sin trabajo imposible, salud alta, sin deudas ni pareja, con trabajo, para que solo falle lo que se arme. */
function calm(seed, gender) {
  const MV = load({ seed }); MV.rng.seed(seed);
  const g = game(MV, seed, 30);
  const p = g.p; p.money = 50000; p.loans = []; p.conds = []; p.prison = null; p.retired = false;
  p.stats.health = 80; p.edu.stage = null;
  p.job = { id: 'cajero', level: 0, salary: 30000, perf: 60, years: 1 };
  const x = person(MV, g, 'amigo', gender);
  return { MV, g, p, n: x.n, r: x.r };
}

test('cada favor encaja con tu situación', () => {
  // abogado
  let s = calm(31); s.p.prison = { left: 4, total: 4, crime: 'Robo', behavior: 50, gang: false, since: 28 };
  assert.strictEqual(MEM(s.MV).favorFor(s.g, s.r, s.n, {}), 'abogado');
  let v = favor(s.MV, s.g, s.n, 'prestamo', 5000, 'abogado'); accept(s.MV, s.g, v);
  assert.strictEqual(s.p.prison.left, 3);
  s = calm(32); s.p.prison = { left: 1, total: 1, crime: 'Robo', behavior: 50, gang: false, since: 28 };
  v = favor(s.MV, s.g, s.n, 'prestamo', 5000, 'abogado'); accept(s.MV, s.g, v);
  assert.strictEqual(s.p.prison.left, 1);

  // plata
  s = calm(33); s.p.money = -700;
  assert.strictEqual(MEM(s.MV).favorFor(s.g, s.r, s.n, {}), 'plata');
  v = favor(s.MV, s.g, s.n, 'prestamo', 500, 'plata'); accept(s.MV, s.g, v);
  assert.strictEqual(s.p.money, -700 + 2000);
  s = calm(34); s.p.money = -700;
  v = favor(s.MV, s.g, s.n, 'prestamo', 5000, 'plata'); accept(s.MV, s.g, v);
  assert.strictEqual(s.p.money, -700 + 10000);
  s = calm(35); s.p.money = -90000;
  v = favor(s.MV, s.g, s.n, 'prestamo', 5000, 'plata'); accept(s.MV, s.g, v);
  assert.strictEqual(s.p.money, -90000 + 50000);
  s = calm(36); s.p.money = 1000; s.p.job = null; s.p.loans = [{ start: 20, left: 90000, pay: 60000 }];
  assert.strictEqual(MEM(s.MV).favorFor(s.g, s.r, s.n, {}), 'plata');

  // entrevista
  s = calm(37); s.p.job = null;
  assert.strictEqual(MEM(s.MV).favorFor(s.g, s.r, s.n, {}), 'entrevista');
  v = favor(s.MV, s.g, s.n, 'apoyo', undefined, 'entrevista'); accept(s.MV, s.g, v);
  const q = s.g.queue[0];
  assert.strictEqual(q.id, 'oferta_trabajo');
  const J = s.MV.jobById(q.ctx.job);
  assert.ok(J && s.MV.sys.career.meets(s.g, J).ok);
  assert.strictEqual(q.ctx.level, 0);
  assert.ok(q.ctx.salary >= Math.round(J.pay[0] * 0.9) && q.ctx.salary <= Math.round(J.pay[0] * 1.1));

  // cuidado
  s = calm(38); s.p.stats.health = 30; s.p.stats.happy = 50; s.p.stress = 50;
  assert.strictEqual(MEM(s.MV).favorFor(s.g, s.r, s.n, {}), 'cuidado');
  v = favor(s.MV, s.g, s.n, 'apoyo', undefined, 'cuidado'); accept(s.MV, s.g, v);
  assert.strictEqual(s.p.stats.health, 40); assert.strictEqual(s.p.stats.happy, 56); assert.strictEqual(s.p.stress, 45);

  // pareja
  s = calm(39); const pa = person(s.MV, s.g, 'pareja', 'f'); pa.r.rel = 30;
  assert.strictEqual(MEM(s.MV).favorFor(s.g, s.r, s.n, {}), 'pareja');
  v = favor(s.MV, s.g, s.n, 'apoyo', undefined, 'pareja'); accept(s.MV, s.g, v);
  assert.strictEqual(pa.r.rel, 45);

  // regalo
  s = calm(40);
  assert.strictEqual(MEM(s.MV).favorFor(s.g, s.r, s.n, {}), 'regalo');
  let trips = 0, cash = 0;
  for (let i = 0; i < 40; i++) {
    const t = calm(100 + i); t.p.stats.happy = 50; t.p.stress = 50;
    const m0 = t.p.money, v0 = t.p.counters.viajes || 0;
    accept(t.MV, t.g, favor(t.MV, t.g, t.n, 'apoyo', undefined, 'regalo'));
    if ((t.p.counters.viajes || 0) === v0 + 1) {
      trips++; assert.strictEqual(t.p.stats.happy, 60); assert.strictEqual(t.p.stress, 42); assert.strictEqual(t.p.money, m0);
    } else {
      cash++; const dm = t.p.money - m0;
      assert.ok(dm >= 300 && dm <= 2000, 'dinero ' + dm); assert.strictEqual(t.p.stats.happy, 54);
    }
  }
  assert.ok(trips > 0 && cash > 0, `viajes ${trips}, dinero ${cash}`);
});

test('el orden de los favores', () => {
  let s = calm(41); s.p.prison = { left: 4, total: 4, crime: 'Robo', behavior: 50, gang: false, since: 28 }; s.p.money = -500;
  assert.strictEqual(MEM(s.MV).favorFor(s.g, s.r, s.n, {}), 'abogado');
  s = calm(42); s.p.money = -500; s.p.job = null;
  assert.strictEqual(MEM(s.MV).favorFor(s.g, s.r, s.n, {}), 'plata');
});

test('el texto nombra a la persona, el hecho y los años', () => {
  for (const gender of ['m', 'f']) {
    for (const d of [undefined, 5000]) {
      const s = calm(50, gender); s.p.money = -300;
      const v = favor(s.MV, s.g, s.n, 'prestamo', d, 'plata');
      const mm = { k: 'prestamo', a: s.p.age - 15, d };
      assert.ok(v.text.includes(s.n.first), v.text);
      assert.ok(v.text.includes(MEM(s.MV).said(s.g, s.n, mm)), v.text);
      assert.ok(v.text.includes(MEM(s.MV).ago(s.g, mm)), v.text);
      assert.ok(!BAD_TEXT.test(v.text), v.text);
    }
  }
  for (const id of ['abogado', 'plata', 'entrevista', 'cuidado', 'pareja', 'regalo']) {
    const s = calm(51, 'f'); const v = favor(s.MV, s.g, s.n, 'apoyo', undefined, id);
    assert.ok(!BAD_TEXT.test(v.text) && v.text.includes(s.n.first), id + ': ' + v.text);
  }
});

test('rechazar con orgullo', () => {
  const s = calm(60); s.p.money = -700; s.r.rel = 60;
  const before = JSON.stringify([s.p.money, s.p.stats, s.p.stress, s.p.job, s.g.queue]);
  const v = favor(s.MV, s.g, s.n, 'prestamo', 500, 'plata');
  const res = s.MV.EV.choose(s.g, v.choices.find((c) => /Rechazarlo/.test(c.label)).i);
  assert.ok(res.msg && !BAD_TEXT.test(res.msg));
  assert.strictEqual(s.r.rel, 58);
  assert.strictEqual(JSON.stringify([s.p.money, s.p.stats, s.p.stress, s.p.job, s.g.queue]), before.replace(/\[\]$/, '[]'));
});

test('el favor también llega a la cárcel', () => {
  const s = calm(70); s.p.prison = { left: 4, total: 4, crime: 'Robo', behavior: 50, gang: false, since: 28 };
  const v = favor(s.MV, s.g, s.n, 'prestamo', 500, 'abogado');
  assert.ok(v && v.id === 'mem_favor');
});

test('el riesgo de deudas del gato no cambia', () => {
  const s = calm(80);
  s.p.loans = [{ start: 20, left: 5000, pay: 8000 }, { start: 99, left: 100, pay: 100 }];
  assert.strictEqual(s.MV.sys.money.dues(s.g), 5000);
  s.p.pension = 200; assert.strictEqual(s.MV.sys.money.income(s.g), 30200);
  s.p.job = null; assert.strictEqual(s.MV.sys.money.income(s.g), 200);
});

test('el favor del abogado concuerda con el género de la jugadora', () => {
  const s = calm(90); s.p.gender = 'f'; s.p.prison = { left: 4, total: 4, crime: 'Robo', behavior: 50, gang: false, since: 28 };
  const v = favor(s.MV, s.g, s.n, 'prestamo', 500, 'abogado');
  assert.ok(/presa/.test(v.text) && !/preso/.test(v.text), v.text);
  const t = calm(91); t.p.gender = 'm'; t.p.prison = { left: 4, total: 4, crime: 'Robo', behavior: 50, gang: false, since: 28 };
  const w = favor(t.MV, t.g, t.n, 'prestamo', 500, 'abogado');
  assert.ok(/preso/.test(w.text) && !/presa/.test(w.text), w.text);
});

// ——— Vueltas de la vida y "Ya te perdoné" ———
const KINDS_OF = { empresa: ['prestamo', 'inversion', 'dinero'], devuelve: ['prestamo'], medico: ['apoyo'], padrino: ['discurso'] };
function twist(MV, g, n, k, d, v) {
  g.queue = [];
  MV.EV.push(g, 'mem_vuelta', { target: n.id, k, a: g.p.age - 15, d, v }, true);
  return MV.EV.view(g);
}
function perdon(MV, g, n, k, d) {
  g.queue = [];
  MV.EV.push(g, 'mem_perdon', { target: n.id, k, a: g.p.age - 15, d, v: null }, true);
  return MV.EV.view(g);
}
const pick = (MV, g, v, re) => () => MV.EV.choose(g, v.choices.find((c) => re.test(c.label)).i);

test('cada vuelta de la vida', () => {
  const ids = (s, k, d) => { const out = new Set(); for (let i = 0; i < 60; i++) out.add(MEM(s.MV).twistFor(s.g, s.r, s.n, { k, d })); return out; };
  let s = calm(200); s.n.age = 40;
  assert.ok(ids(s, 'prestamo', 1000).has('empresa') && ids(s, 'prestamo', 1000).has('devuelve'));
  assert.ok(ids(s, 'inversion', 1000).has('empresa') && ids(s, 'dinero', 1000).has('empresa'));
  assert.ok(ids(s, 'apoyo').has('medico'));
  assert.ok(ids(s, 'discurso').has('padrino'));
  assert.ok(ids(s, 'regalo').has('recomienda') && ids(s, 'regalo').size === 1);
  assert.ok(!ids(s, 'apoyo').has('empresa') && !ids(s, 'discurso').has('medico') && !ids(s, 'prestamo').has('padrino'));
  s.n.age = 24;
  assert.ok(!ids(s, 'prestamo', 1000).has('empresa') && !ids(s, 'apoyo').has('medico'));
  assert.ok(ids(s, 'discurso').has('padrino'));
  s.n.age = 21; assert.ok(!ids(s, 'discurso').has('padrino'));
  s.n.age = 51; assert.ok(!ids(s, 'discurso').has('padrino'));

  // empresa
  for (const [d, exp] of [[1000, 5000], [undefined, 5000], [3000, 15000], [50000, 100000]]) {
    s = calm(201); const m0 = s.p.money;
    const v = twist(s.MV, s.g, s.n, 'inversion', d, 'empresa'); pick(s.MV, s.g, v, /Aceptar/)();
    assert.strictEqual(s.p.money - m0, exp, 'empresa ' + d);
  }
  // devuelve
  for (const [d, exp] of [[1000, 2000], [undefined, 2000], [7000, 14000]]) {
    s = calm(202); const m0 = s.p.money;
    pick(s.MV, s.g, twist(s.MV, s.g, s.n, 'prestamo', d, 'devuelve'), /Aceptar/)();
    assert.strictEqual(s.p.money - m0, exp, 'devuelve ' + d);
  }
  // medico
  s = calm(203); s.p.conds = [{ id: 'gripe' }, { id: 'alergia' }]; s.p.stats.health = 50;
  let res = pick(s.MV, s.g, twist(s.MV, s.g, s.n, 'apoyo', undefined, 'medico'), /Aceptar/)();
  assert.deepStrictEqual(s.p.conds.map((c) => c.id), ['alergia']); assert.strictEqual(s.p.stats.health, 50);
  assert.ok(!BAD_TEXT.test(res.msg), res.msg);
  s = calm(204); s.p.stats.health = 50;
  pick(s.MV, s.g, twist(s.MV, s.g, s.n, 'apoyo', undefined, 'medico'), /Aceptar/)();
  assert.strictEqual(s.p.stats.health, 58);
  // padrino
  s = calm(205); s.p.stats.happy = 50; s.r.rel = 60;
  pick(s.MV, s.g, twist(s.MV, s.g, s.n, 'discurso', undefined, 'padrino'), /Aceptar/)();
  assert.strictEqual(s.p.stats.happy, 58); assert.strictEqual(s.r.rel, 70); assert.strictEqual(s.p.karma, 2);
  // recomienda
  s = calm(206); s.p.job.perf = 60;
  pick(s.MV, s.g, twist(s.MV, s.g, s.n, 'regalo', 'Reloj', 'recomienda'), /Aceptar/)();
  assert.strictEqual(s.p.job.perf, 75);
  s = calm(207); s.p.job.perf = 95;
  pick(s.MV, s.g, twist(s.MV, s.g, s.n, 'regalo', 'Reloj', 'recomienda'), /Aceptar/)();
  assert.strictEqual(s.p.job.perf, 100);
  // sin trabajo al elegir, o vuelta desconocida: no se rompe
  s = calm(208); const v = twist(s.MV, s.g, s.n, 'regalo', 'Reloj', 'recomienda'); s.p.job = null;
  res = pick(s.MV, s.g, v, /Aceptar/)(); assert.ok(res.msg && !BAD_TEXT.test(res.msg), res.msg);
  s = calm(209); res = pick(s.MV, s.g, twist(s.MV, s.g, s.n, 'regalo', undefined, 'zzz'), /Aceptar/)();
  assert.ok(res.msg && !BAD_TEXT.test(res.msg), res.msg);
  // decirle que no hacía falta
  s = calm(210); s.r.rel = 60;
  res = pick(s.MV, s.g, twist(s.MV, s.g, s.n, 'prestamo', 500, 'devuelve'), /no hacía falta/)();
  assert.strictEqual(s.r.rel, 65); assert.ok(res.msg && !BAD_TEXT.test(res.msg));
});

test('sin vuelta posible devuelve null', () => {
  let s = calm(220); s.p.job = null;
  assert.strictEqual(MEM(s.MV).twistFor(s.g, s.r, s.n, { k: 'regalo' }), null);
  s = calm(221); s.n.age = 40; s.p.prison = { left: 4, total: 4, crime: 'Robo', behavior: 50, gang: false, since: 28 };
  for (const k of ['prestamo', 'apoyo', 'discurso', 'regalo', 'inversion', 'dinero']) {
    for (let i = 0; i < 10; i++) assert.strictEqual(MEM(s.MV).twistFor(s.g, s.r, s.n, { k, d: 1000 }), null);
  }
  assert.strictEqual(MEM(s.MV).twistFor(s.g, s.r, s.n, undefined), null);
});

test('ya te perdoné', () => {
  let s = calm(230); s.r.rel = 50; s.p.stats.happy = 50;
  const res = pick(s.MV, s.g, perdon(s.MV, s.g, s.n, 'golpe'), /Agradecer/)();
  assert.strictEqual(s.r.rel, 58); assert.strictEqual(s.p.stats.happy, 53); assert.ok(res.msg && !BAD_TEXT.test(res.msg));
  s = calm(231); s.r.rel = 50;
  const r2 = pick(s.MV, s.g, perdon(s.MV, s.g, s.n, 'golpe'), /distraído/)();
  assert.strictEqual(s.r.rel, 48); assert.ok(r2.msg && !BAD_TEXT.test(r2.msg));
  s = calm(232); s.p.prison = { left: 4, total: 4, crime: 'Robo', behavior: 50, gang: false, since: 28 };
  assert.ok(perdon(s.MV, s.g, s.n, 'golpe').id === 'mem_perdon');
});

test('los textos de las vueltas y el perdón nombran a la persona, el hecho y los años', () => {
  for (const gender of ['m', 'f']) for (const pg of ['m', 'f']) for (const d of [undefined, 5000]) {
    const s = calm(240, gender); s.p.gender = pg; s.n.age = 40;
    const cases = [];
    for (const [id, k] of [['empresa', 'prestamo'], ['devuelve', 'prestamo'], ['medico', 'apoyo'], ['padrino', 'discurso'], ['recomienda', 'regalo'], ['zzz', 'dinero']]) cases.push([twist(s.MV, s.g, s.n, k, d, id), k]);
    for (const k of ['golpe', 'insulto', 'infidelidad']) cases.push([perdon(s.MV, s.g, s.n, k, d), k]);
    for (const [v, k] of cases) {
      const mm = { k, a: s.p.age - 15, d };
      assert.ok(v.text.includes(s.n.first), v.text);
      assert.ok(v.text.includes(MEM(s.MV).said(s.g, s.n, mm)), v.text);
      assert.ok(v.text.includes(MEM(s.MV).ago(s.g, mm)), v.text);
      assert.ok(!BAD_TEXT.test(v.text), v.text);
    }
  }
  const s = calm(241);
  assert.strictEqual(s.MV.EV.byId.mem_vuelta.when(s.g, undefined), false);
  assert.strictEqual(s.MV.EV.byId.mem_perdon.when(s.g, undefined), false);
});

// ——— Venganzas ———
const REVENGES = ['pareja', 'jefe', 'auto', 'escrache', 'fiesta', 'chismes'];
function venganza(MV, g, n, k, d, v) {
  g.queue = [];
  MV.EV.push(g, 'mem_venganza', { target: n.id, k, a: g.p.age - 15, d, v }, true);
  return MV.EV.view(g);
}
/** Partida "sana" con todo lo que una venganza puede tocar: pareja, jefe, auto, fama y casa propia. */
function vengeful(seed, gender) {
  const s = calm(seed, gender);
  const { MV, g, p } = s;
  p.housing = 'propia'; p.fame = 30; p.job.type = 'full';
  p.assets = (p.assets || []).filter((a) => a.type !== 'auto');
  p.assets.push({ id: 'a_test', type: 'auto', kind: 'sedan', icon: '🚗', name: 'Sedán de prueba', value: 9000, price: 9000, cond: 80 });
  s.mate = person(MV, g, 'pareja', 'f');
  s.mate.r.rel = 60;
  const b = MV.sys.workplace.boss(g);
  if (!b) {
    const bn = MV.newNPC(g, { gender: 'm', age: 45 }); g.people[bn.id] = bn;
    s.boss = MV.addRel(g, bn, 'jefe', 60);
    p.job.boss = { id: bn.id, kind: Object.keys(MV.BOSS_KINDS)[0] };
  } else s.boss = b.r;
  s.boss.rel = 60;
  return s;
}

test('cada venganza encaja con tu situación', () => {
  let s = vengeful(300);
  assert.deepStrictEqual([...MEM(s.MV).revengesFor(s.g, s.r, s.n)].sort(), REVENGES.slice().sort());
  assert.deepStrictEqual([...s.MV.MEMORY_REVENGES.map((x) => x.id)].sort(), REVENGES.slice().sort());
  s = vengeful(301); s.p.job = null; s.p.housing = 'alquiler'; s.p.fame = 0;
  s.p.assets = s.p.assets.filter((a) => a.type !== 'auto'); s.mate.r.type = 'amigo';
  assert.deepStrictEqual([...MEM(s.MV).revengesFor(s.g, s.r, s.n)], ['chismes']);
  // la pareja que es esta persona no cuenta
  s = vengeful(302); s.r.type = 'pareja'; s.mate.r.type = 'amigo';
  assert.ok(!MEM(s.MV).revengesFor(s.g, s.r, s.n).includes('pareja'));
  // fama 19 no alcanza
  s = vengeful(303); s.p.fame = 19;
  assert.ok(!MEM(s.MV).revengesFor(s.g, s.r, s.n).includes('escrache'));

  const hit = (s, id) => s.MV.MEMORY_REVENGES.find((x) => x.id === id).hit(s.g, s.r, s.n);
  // pareja
  s = vengeful(304); let t = hit(s, 'pareja');
  assert.strictEqual(s.mate.r.rel, 45); assert.ok(t && !BAD_TEXT.test(t), t);
  s.mate.r.rel = 10; hit(s, 'pareja'); assert.strictEqual(s.mate.r.rel, 0);
  // jefe
  s = vengeful(305); s.p.job.perf = 60; t = hit(s, 'jefe');
  assert.strictEqual(s.p.job.perf, 45); assert.strictEqual(s.boss.rel, 50); assert.ok(!BAD_TEXT.test(t), t);
  s.p.job.perf = 5; hit(s, 'jefe'); assert.strictEqual(s.p.job.perf, 0);
  s = vengeful(306); s.p.job.boss = null; s.p.job.perf = 60; t = hit(s, 'jefe');
  assert.strictEqual(s.p.job.perf, 45); assert.ok(!BAD_TEXT.test(t), t);
  s = vengeful(307); s.p.job.perf = undefined; t = hit(s, 'jefe');
  assert.ok(!BAD_TEXT.test(t), t);
  // auto
  s = vengeful(308); t = hit(s, 'auto');
  assert.strictEqual(s.p.assets.find((a) => a.type === 'auto').cond, 60); assert.ok(!BAD_TEXT.test(t), t);
  s.p.assets.find((a) => a.type === 'auto').cond = 12; hit(s, 'auto');
  assert.strictEqual(s.p.assets.find((a) => a.type === 'auto').cond, 0);
  // escrache
  s = vengeful(309); s.p.fame = 30; s.p.stats.happy = 50; t = hit(s, 'escrache');
  assert.strictEqual(s.p.fame, 25); assert.strictEqual(s.p.stats.happy, 44); assert.ok(!BAD_TEXT.test(t), t);
  // fiesta
  s = vengeful(310); s.p.stats.happy = 50; t = hit(s, 'fiesta');
  assert.strictEqual(s.p.stats.happy, 42); assert.ok(!BAD_TEXT.test(t), t);
  // chismes
  s = vengeful(311); s.p.stats.happy = 50; t = hit(s, 'chismes');
  assert.strictEqual(s.p.stats.happy, 45); assert.ok(!BAD_TEXT.test(t), t);
});

test('las tres respuestas', () => {
  let ok = 0, bad = 0;
  for (let seed = 400; seed < 700; seed++) {
    const s = vengeful(seed); s.p.stats.happy = 50; s.r.rel = 50;
    const v = venganza(s.MV, s.g, s.n, 'insulto', 'es un inútil', 'chismes');
    const res = pick(s.MV, s.g, v, /Disculparte/)();
    assert.ok(res.msg && !BAD_TEXT.test(res.msg), res.msg);
    if (s.r.rel === 60 && s.p.stats.happy === 50) ok++;
    else { bad++; assert.strictEqual(s.p.stats.happy, 45); assert.strictEqual(s.r.rel, 50); }
  }
  assert.ok(ok >= 90 && ok <= 150, 'aceptadas ' + ok); assert.strictEqual(ok + bad, 300);
  for (let seed = 700; seed < 720; seed++) {
    const s = vengeful(seed); s.p.stats.happy = 50;
    const res = pick(s.MV, s.g, venganza(s.MV, s.g, s.n, 'golpe', undefined, 'chismes'), /Ignorarlo/)();
    assert.strictEqual(s.p.stats.happy, 45); assert.ok(res.msg && !BAD_TEXT.test(res.msg), res.msg);
  }
});

test('devolver el golpe', () => {
  let s = vengeful(720); s.p.stats.happy = 50; s.r.rel = 60;
  let res = pick(s.MV, s.g, venganza(s.MV, s.g, s.n, 'insulto', 'es un inútil', 'chismes'), /Devolver/)();
  assert.strictEqual(s.r.type, 'enemigo'); assert.strictEqual(s.r.rel, 35);
  assert.strictEqual(s.p.stats.happy, 48); has(s.r, 'revancha', Math.sign(memOf(s.r, 'revancha').v));
  assert.ok(res.msg && !BAD_TEXT.test(res.msg), res.msg);
  for (const type of ['hermano', 'conyuge']) {
    s = vengeful(721); s.r.type = type; s.r.rel = 60;
    pick(s.MV, s.g, venganza(s.MV, s.g, s.n, 'golpe', undefined, 'fiesta'), /Devolver/)();
    assert.strictEqual(s.r.type, type); assert.strictEqual(s.r.rel, 35);
    assert.ok(memOf(s.r, 'revancha'), 'revancha ' + type);
  }
});

test('una venganza nunca quita dinero ni mata', () => {
  for (const money of [-500, 0, 100000]) for (const id of REVENGES) for (const re of [/Disculparte/, /Devolver/, /Ignorarlo/]) {
    for (let seed = 800; seed < 806; seed++) {
      const s = vengeful(seed); s.p.money = money; s.p.loans = [];
      const v = venganza(s.MV, s.g, s.n, 'golpe', undefined, id);
      assert.strictEqual(v.id, 'mem_venganza');
      const res = pick(s.MV, s.g, v, re)();
      assert.strictEqual(s.p.money, money, `${id} ${re}`);
      assert.ok(s.p.alive !== false && !s.g.dead, 'vivo'); assert.ok(!s.p.prison, 'sin cárcel');
      assert.ok(!s.g.queue.some((q) => q.id === 'juicio'), 'sin juicio');
      assert.ok(res.msg && !BAD_TEXT.test(res.msg), res.msg);
    }
  }
});

test('los textos de las venganzas nombran a la persona, el hecho y los años', () => {
  for (const gender of ['m', 'f']) for (const pg of ['m', 'f']) for (const d of [undefined, 5000]) {
    const s = vengeful(900, gender); s.p.gender = pg;
    for (const id of REVENGES.concat(['zzz'])) for (const k of ['golpe', 'insulto', 'infidelidad']) {
      const v = venganza(s.MV, s.g, s.n, k, d, id);
      const mm = { k, a: s.p.age - 15, d };
      assert.ok(v.text.includes(s.n.first), v.text);
      assert.ok(v.text.includes(MEM(s.MV).said(s.g, s.n, mm)), v.text);
      assert.ok(v.text.includes(MEM(s.MV).ago(s.g, mm)), v.text);
      assert.ok(!BAD_TEXT.test(v.text), v.text);
    }
  }
  const s = vengeful(901);
  assert.strictEqual(s.MV.EV.byId.mem_venganza.when(s.g, undefined), false);
  assert.strictEqual(s.MV.EV.byId.mem_venganza.title, 'Te la tenía guardada');
});

// ---- Tarea 6: cuándo vuelve un recuerdo ----
const MEMEV = ['mem_favor', 'mem_vuelta', 'mem_perdon', 'mem_venganza'];
const memQ = (g) => g.queue.filter((q) => MEMEV.includes(q.id));
/** Persona con un recuerdo viejo (hace `ago` años). */
function old(MV, g, k, v, ago, rel, type) {
  const s = person(MV, g, type || 'amigo');
  s.r.rel = rel == null ? 60 : rel;
  s.r.mem = [{ k, a: g.p.age - (ago == null ? 5 : ago), v }];
  return s;
}

test('nada vuelve antes de 3 años', () => {
  const MV = load({ seed: 1000 }); const g = game(MV, 1000, 30);
  const a = old(MV, g, 'prestamo', 2, 2), b = old(MV, g, 'prestamo', 2, 3);
  const got = MEM(MV).recall(g).map((x) => x.r);
  assert.ok(!got.includes(a.r)); assert.ok(got.includes(b.r));
  const x = MEM(MV).recall(g).find((e) => e.r === b.r);
  assert.strictEqual(x.n, b.n); assert.strictEqual(x.m, b.r.mem[0]);
});

test('uno por año, cerca del 20 %', () => {
  let hit = 0;
  for (let seed = 1100; seed < 1600; seed++) {
    const MV = load({ seed }); const g = game(MV, seed, 30);
    for (let i = 0; i < 5; i++) old(MV, g, i % 2 ? 'prestamo' : 'insulto', i % 2 ? 2 : -2, 6);
    MEM(MV).yearly(g);
    const q = memQ(g).length; assert.ok(q <= 1, 'más de uno');
    hit += q;
  }
  assert.ok(hit >= 75 && hit <= 125, 'veces ' + hit);
});

test('cada recuerdo vuelve una vez, y la persona espera 5 años', () => {
  for (let seed = 1700; seed < 1800; seed++) {
    const MV = load({ seed }); const g = game(MV, seed, 30);
    const s = old(MV, g, 'prestamo', 2, 6);
    s.r.mem.push({ k: 'apoyo', a: 20, v: 1 });
    MEM(MV).yearly(g);
    if (!memQ(g).length) continue;
    assert.strictEqual(s.r.mem.filter((m) => m.done).length, 1);
    assert.strictEqual(s.r.memNext, 35);
    assert.strictEqual(MEM(MV).recall(g).length, 0);
    g.p.age = 34; assert.strictEqual(MEM(MV).recall(g).length, 0);
    g.p.age = 35; assert.strictEqual(MEM(MV).recall(g).length, 1);
    return;
  }
  assert.fail('nunca volvió');
});

test('el evento correcto', () => {
  const MV0 = load({ seed: 2000 }); const g0 = game(MV0, 2000, 30);
  const s0 = old(MV0, g0, 'prestamo', 2, 6);
  const o = MEM(MV0).outcome(g0, s0.r, s0.n, s0.r.mem[0]);
  assert.ok(['mem_favor', 'mem_vuelta'].includes(o.ev)); assert.ok(o.v);
  let vuelta = 0, total = 0;
  for (let seed = 2100; seed < 2500; seed++) {
    const MV = load({ seed }); const g = game(MV, seed, 30);
    const s = old(MV, g, 'prestamo', 2, 6);
    if (!MEM(MV).twistFor(g, s.r, s.n, { k: 'prestamo', a: 24 })) continue;
    total++;
    const out = MEM(MV).outcome(g, s.r, s.n, s.r.mem[0]);
    assert.ok(['mem_favor', 'mem_vuelta'].includes(out.ev));
    if (out.ev === 'mem_vuelta') vuelta++;
  }
  assert.ok(total >= 300, 'con vuelta posible ' + total);
  assert.ok(vuelta / total >= 0.2 && vuelta / total <= 0.4, 'vueltas ' + vuelta + '/' + total);
  const MV = load({ seed: 2600 }); const g = game(MV, 2600, 30);
  const p70 = old(MV, g, 'insulto', -2, 6, 70), p69 = old(MV, g, 'insulto', -2, 6, 69);
  const a = MEM(MV).outcome(g, p70.r, p70.n, p70.r.mem[0]);
  assert.strictEqual(a.ev, 'mem_perdon'); assert.strictEqual(a.v, null);
  const b = MEM(MV).outcome(g, p69.r, p69.n, p69.r.mem[0]);
  assert.strictEqual(b.ev, 'mem_venganza'); assert.ok(MEM(MV).revengesFor(g, p69.r, p69.n).includes(b.v));
});

test('desde la cárcel, solo favores', () => {
  let seen = 0;
  for (let seed = 2700; seed < 2900; seed++) {
    const MV = load({ seed }); const g = game(MV, seed, 30);
    old(MV, g, 'prestamo', 2, 6); old(MV, g, 'insulto', -2, 6, 40);
    g.p.prison = { years: 2 };
    MEM(MV).yearly(g);
    for (const q of memQ(g)) { assert.strictEqual(q.id, 'mem_favor'); seen++; }
  }
  assert.ok(seen > 0);
});

test('los que se fueron no vuelven', () => {
  const MV = load({ seed: 3000 }); const g = game(MV, 3000, 30);
  const dead = old(MV, g, 'prestamo', 2, 6), gone = old(MV, g, 'prestamo', 2, 6);
  const pet = old(MV, g, 'prestamo', 2, 6, 60, 'mascota'), stalker = old(MV, g, 'prestamo', 2, 6, 60, 'acosador');
  const ani = old(MV, g, 'prestamo', 2, 6); ani.n.species = 'perro';
  dead.n.alive = false; MV.removeRel(g, gone.n.id);
  assert.strictEqual(MEM(MV).recall(g).length, 0);
});

test('si la persona ya no está, su decisión desaparece', () => {
  for (const how of ['die', 'remove']) {
    const MV = load({ seed: 3100 }); const g = game(MV, 3100, 30);
    const s = old(MV, g, 'prestamo', 2, 6), t = old(MV, g, 'insulto', -2, 6, 40);
    MV.EV.push(g, 'mem_favor', { target: s.n.id, k: 'prestamo', a: 24, v: 'regalo' });
    MV.EV.push(g, 'mem_venganza', { target: s.n.id, k: 'insulto', a: 24, v: 'chismes' });
    if (how === 'die') MV.sys.people.die(g, s.n, 'enfermedad'); else MV.removeRel(g, s.n.id);
    const v = MV.EV.view(g);
    assert.ok(!v || !MEMEV.includes(v.id), how);
  }
});

test('el cierre del año lo usa', () => {
  let n = 0;
  for (let seed = 3200; seed < 3400; seed++) {
    const MV = load({ seed }); const g = game(MV, seed, 30);
    old(MV, g, 'prestamo', 2, 6);
    MV.ageUp(g);
    if (g.queue.some((q) => MEMEV.includes(q.id)) || (MV.EV.view(g) && MEMEV.includes(MV.EV.view(g).id))) n++;
  }
  assert.ok(n > 0, 'nunca encoló');
});

test('yearly no falla con partidas viejas', () => {
  const MV = load({ seed: 3500 }); const g = game(MV, 3500, 30);
  const s = old(MV, g, 'inventado', 2, 6); delete person(MV, g).r.mem;
  s.r.mem.push({ k: 'prestamo', a: 10, v: 2 });
  for (let i = 0; i < 30; i++) MEM(MV).yearly(g);
  g.p.age = 5; MEM(MV).yearly(g);
});

// ---- Tarea 7: acosadora o acosador ----
let SH;
/** Un solo MV para los recorridos largos (cargarlo cuesta ~20 ms): cada semilla trae su partida. */
const sh = (seed) => { SH = SH || load({ seed: 1 }); SH.rng.seed(seed); return SH; };
const setupS = (seed, type, gender) => {
  const MV = sh(seed); const g = game(MV, seed, 30); g.p.money = 100000;
  const x = person(MV, g, type || 'amigo', gender);
  return { MV, g, n: x.n, r: x.r };
};
const SEXUAL = /sexo|sexual|desnud|violaci|violó|violar|cama\b/i;
const stalkerOf = (MV, g) => MV.rels(g, 'acosador')[0] || null;
/** Partida con una persona ya vuelta acosador, en esa etapa. */
function stalked(seed, gender, stage) {
  const t = setupS(seed, 'amigo', gender);
  assert.strictEqual(MEM(t.MV).makeStalker(t.g, t.n, 'fan'), true);
  t.r = t.MV.relOf(t.g, t.n.id);
  t.r.stalk.stage = stage || 1;
  return t;
}

test('cómo empieza', () => {
  // Una noche: 6 %.
  let hit = 0;
  for (let s = 0; s < 1000; s++) {
    const MV = sh(7000 + s); const g = game(MV, 7000 + s, 30);
    const n = MV.newNPC(g, { age: 30 });
    choose(MV, g, 'despues_noche', { target: n.id, casual: true }, /Solo fue una noche/);
    const r = MV.relOf(g, n.id);
    if (r && r.type === 'acosador') { hit++; assert.strictEqual(r.stalk.stage, 1); assert.strictEqual(r.stalk.since, 30); }
  }
  assert.ok(hit >= 30 && hit <= 90, 'noche ' + hit);

  // Ruptura y divorcio: 8 %, y el ex es el mismo.
  const run = (seeds, type, fn) => {
    let h = 0;
    for (let s = 0; s < seeds; s++) {
      const MV = sh(8000 + s); const g = game(MV, 8000 + s, 30);
      const x = person(MV, g, type);
      fn(MV, g, x.n);
      const r = MV.relOf(g, x.n.id);
      if (r.type === 'acosador') { h++; assert.strictEqual(r.stalk.stage, 1); } else assert.strictEqual(r.type, 'ex');
    }
    return h;
  };
  const b = run(1000, 'pareja', (MV, g, n) => MV.sys.rels.breakUp(g, n));
  assert.ok(b >= 50 && b <= 110, 'ruptura ' + b);
  const d = run(1000, 'conyuge', (MV, g, n) => MV.sys.rels.divorce(g, n, false));
  assert.ok(d >= 50 && d <= 110, 'divorcio ' + d);
  const e = run(400, 'conyuge', (MV, g, n) => MV.sys.rels.divorce(g, n, true));
  assert.strictEqual(e, 0);

  // El fan que sale mal: 30 % de los fallos, con un fan nuevo de 18 a 45.
  let ko = 0, fans = 0;
  for (let s = 0; s < 1000; s++) {
    const MV = sh(9000 + s); const g = game(MV, 9000 + s, 30); g.p.fame = 50;
    const before = Object.keys(g.people).length;
    const res = choose(MV, g, 'fan_obsesivo', {}, /Responderle con amabilidad/);
    assert.ok(res.msg && !BAD_TEXT.test(res.msg), res.msg);
    if (/acampa/.test(res.msg)) ko++;
    const st = stalkerOf(MV, g);
    if (st) {
      fans++;
      assert.ok(/acampa/.test(res.msg));
      assert.ok(st.n.age >= 18 && st.n.age <= 45);
      assert.strictEqual(Object.keys(g.people).length, before + 1);
    }
  }
  assert.ok(ko > 200, 'fallos ' + ko);
  assert.ok(fans / ko >= 0.2 && fans / ko <= 0.4, `fans ${fans}/${ko}`);
  // El karma +2 se aplica en las dos ramas.
  const MV = sh(9500); const g = game(MV, 9500, 30); g.p.karma = 0; g.p.fame = 50;
  choose(MV, g, 'fan_obsesivo', {}, /Responderle con amabilidad/);
  assert.strictEqual(g.p.karma, 2);
});

test('uno a la vez y dos por vida', () => {
  const MV = sh(7100); const g = game(MV, 7100, 30);
  const a = person(MV, g, 'ex'), b = person(MV, g, 'ex'), c = person(MV, g, 'ex');
  assert.strictEqual(MEM(MV).makeStalker(g, a.n, 'ruptura'), true);
  assert.strictEqual(a.r.type, 'acosador'); assert.strictEqual(g.p.counters.acosadores, 1);
  assert.strictEqual(MEM(MV).makeStalker(g, b.n, 'ruptura'), false); assert.strictEqual(b.r.type, 'ex');
  MV.removeRel(g, a.n.id);
  assert.strictEqual(MEM(MV).makeStalker(g, b.n, 'noche'), true);
  MV.removeRel(g, b.n.id);
  assert.strictEqual(MEM(MV).makeStalker(g, c.n, 'fan'), false); assert.strictEqual(c.r.type, 'ex');
  assert.strictEqual(g.p.counters.acosadores, 2);
  // Un acosador muerto no bloquea.
  const MV2 = sh(7101); const g2 = game(MV2, 7101, 30);
  const d = person(MV2, g2, 'ex'), e = person(MV2, g2, 'ex');
  MEM(MV2).makeStalker(g2, d.n, 'fan'); d.n.alive = false;
  assert.strictEqual(MEM(MV2).makeStalker(g2, e.n, 'fan'), true);
  // Partidas viejas sin contador.
  const MV3 = sh(7102); const g3 = game(MV3, 7102, 30); delete g3.p.counters.acosadores;
  assert.strictEqual(MEM(MV3).makeStalker(g3, person(MV3, g3, 'ex').n, 'fan'), true);
});

test('cada respuesta', () => {
  const RATE = { hablar: 0.25, bloquear: 0.5, policia: 0.4, orden: 1, mudarte: 0.7 };
  for (const how of Object.keys(RATE)) {
    let ended = 0;
    const N = 400;
    for (let s = 0; s < N; s++) {
      const t = stalked(10000 + s, s % 2 ? 'f' : 'm', 1);
      t.g.p.stress = 20; t.g.p.money = 100000;
      const res = MEM(t.MV).stalkRespond(t.g, t.n.id, how);
      assert.ok(typeof res === 'string' && res && !BAD_TEXT.test(res), res);
      const gone = !t.MV.relOf(t.g, t.n.id);
      if (gone) {
        ended++;
        assert.ok(t.g.people[t.n.id], 'no se borra de g.people');
      } else {
        assert.strictEqual(t.r.stalk.stage, 1);
        assert.strictEqual(t.g.p.stress, 23, how + ' fallo');
      }
      if (how === 'orden') { assert.strictEqual(t.g.p.money, 95000); assert.ok(t.g.p.stress === 20 || t.g.p.stress === 30); }
      if (how === 'mudarte') assert.strictEqual(t.g.p.money, 98000);
      if (how !== 'orden' && how !== 'mudarte') assert.strictEqual(t.g.p.money, 100000);
    }
    assert.ok(Math.abs(ended / N - RATE[how]) <= 0.1, `${how} ${ended}/${N}`);
  }
  // La orden: el 20 % la viola una vez, con estrés +10 y el acosador preso.
  let viol = 0;
  for (let s = 0; s < 400; s++) {
    const t = stalked(11000 + s, 'm', 2); t.g.p.stress = 20;
    const res = MEM(t.MV).stalkRespond(t.g, t.n.id, 'orden');
    if (t.g.p.stress === 30) { viol++; assert.ok(/arrest|detuv|preso/i.test(res), res); }
    assert.ok(!t.g.p.prison);
  }
  assert.ok(viol / 400 >= 0.1 && viol / 400 <= 0.3, 'violaciones ' + viol);
  // Bloquear fuera de la etapa 1 nunca funciona.
  for (let s = 0; s < 200; s++) {
    const t = stalked(12000 + s, 'f', 2 + (s % 2));
    MEM(t.MV).stalkRespond(t.g, t.n.id, 'bloquear');
    assert.ok(t.MV.relOf(t.g, t.n.id), 'bloquear en etapa 2 o 3');
  }
  // Ignorar: hace el daño de su etapa, sube de etapa y se queda en 3. Nunca termina.
  const t = stalked(13000, 'm', 1); t.g.p.stress = 20; t.g.p.stats.happy = 50;
  MEM(t.MV).stalkRespond(t.g, t.n.id, 'ignorar');
  assert.strictEqual(t.r.stalk.stage, 2); assert.strictEqual(t.g.p.stress, 26); assert.strictEqual(t.g.p.stats.happy, 50);
  MEM(t.MV).stalkRespond(t.g, t.n.id, 'ignorar');
  assert.strictEqual(t.r.stalk.stage, 3); assert.strictEqual(t.g.p.stress, 34); assert.strictEqual(t.g.p.stats.happy, 45);
  MEM(t.MV).stalkRespond(t.g, t.n.id, 'ignorar');
  assert.strictEqual(t.r.stalk.stage, 3); assert.strictEqual(t.g.p.stress, 42); assert.strictEqual(t.g.p.stats.happy, 40);
  assert.ok(t.MV.relOf(t.g, t.n.id));
  // Sin plata, la orden y la mudanza no cobran.
  const u = stalked(13001, 'm', 1); u.g.p.money = 1000;
  MEM(u.MV).stalkRespond(u.g, u.n.id, 'orden'); MEM(u.MV).stalkRespond(u.g, u.n.id, 'mudarte');
  assert.strictEqual(u.g.p.money, 1000);
  assert.ok(u.MV.relOf(u.g, u.n.id));
});

test('el daño de la etapa 3', () => {
  const t = stalked(14000, 'f', 3); t.g.p.stress = 20;
  const par = person(t.MV, t.g, 'pareja'); par.r.rel = 70;
  MEM(t.MV).stalkRespond(t.g, t.n.id, 'ignorar');
  assert.strictEqual(par.r.rel, 60); assert.strictEqual(t.g.p.stress, 28);
  const u = stalked(14001, 'f', 3); u.g.p.stress = 20; u.g.p.stats.happy = 50;
  MEM(u.MV).stalkRespond(u.g, u.n.id, 'ignorar');
  assert.strictEqual(u.g.p.stress, 28); assert.strictEqual(u.g.p.stats.happy, 45);
  assert.ok(u.MV.relOf(u.g, u.n.id).type === 'acosador');
});

test('la decisión anual', () => {
  let n = 0;
  for (let s = 0; s < 400; s++) {
    const t = stalked(15000 + s, 'm', 1);
    t.g.queue = [];
    MEM(t.MV).stalkYearly(t.g);
    const q = t.g.queue.filter((x) => x.id === 'acoso');
    assert.ok(q.length <= 1);
    if (q.length) { n++; assert.strictEqual(q[0].ctx.target, t.n.id); }
  }
  assert.ok(n >= 200 && n <= 280, 'acoso ' + n);
  // Preso, nunca. Muerto, nunca. Si respondiste desde la ficha el año anterior, nunca.
  for (let s = 0; s < 200; s++) {
    const a = stalked(16000 + s, 'm', 1); a.g.p.prison = { years: 2, left: 2 }; a.g.queue = [];
    MEM(a.MV).stalkYearly(a.g); assert.strictEqual(a.g.queue.length, 0);
    const b = stalked(16300 + s, 'f', 1); b.n.alive = false; b.g.queue = [];
    MEM(b.MV).stalkYearly(b.g); assert.strictEqual(b.g.queue.length, 0);
    const c = stalked(16600 + s, 'f', 2); c.r.stalk.acted = c.g.p.age - 1; c.g.queue = [];
    MEM(c.MV).stalkYearly(c.g); assert.strictEqual(c.g.queue.length, 0);
  }
  // `yearly` la llama aunque no haya recuerdos que vuelvan.
  let viaYearly = 0;
  for (let s = 0; s < 100; s++) {
    const t = stalked(17000 + s, 'm', 1); t.g.queue = [];
    MEM(t.MV).yearly(t.g);
    if (t.g.queue.some((x) => x.id === 'acoso')) viaYearly++;
  }
  assert.ok(viaYearly > 30, 'por yearly ' + viaYearly);
  // Partida vieja: acosador sin `stalk`.
  const o = stalked(17500, 'm', 1); delete o.r.stalk;
  assert.doesNotThrow(() => { MEM(o.MV).stalkYearly(o.g); MEM(o.MV).stalkActions(o.g, o.r, o.n); MEM(o.MV).stalkRespond(o.g, o.n.id, 'hablar'); });
});

test('su ficha', () => {
  const t = stalked(18000, 'f', 1); t.g.p.money = 100000;
  const list = t.MV.sys.rels.actions(t.g, t.r, t.n);
  const ids = list.map((a) => a.id);
  assert.deepStrictEqual([...ids], ['acoso_hablar', 'acoso_bloquear', 'acoso_policia', 'acoso_orden', 'acoso_mudarte']);
  for (const a of list) assert.strictEqual(a.limit, 1);
  // Una sola por año: `acted` (la ficha) o `ev` (el evento) bloquean; sin ninguno, no.
  for (const key of [null, 'acted', 'ev']) {
    const w = stalked(18003, 'f', 1); w.g.p.money = 100000;
    if (key) w.r.stalk[key] = w.g.p.age;
    w.r.acts = {};
    const a = w.MV.sys.rels.actions(w.g, w.r, w.n).find((x) => x.id === 'acoso_hablar');
    const res = w.MV.doAction(w.g, a, null, w.r.acts);
    assert.strictEqual(!!res.blocked, !!key, 'bloqueo con ' + key);
    if (key) assert.ok(w.MV.relOf(w.g, w.n.id) && !w.g.p.yearActs.acoso_hablar);
    else assert.strictEqual(w.r.stalk.acted, w.g.p.age);
  }
  // La segunda del mismo año, tras usar la primera (se fuerza que no termine).
  const sec = stalked(18004, 'f', 1); sec.g.p.money = 100000; sec.r.acts = {};
  const al = sec.MV.sys.rels.actions(sec.g, sec.r, sec.n);
  sec.MV.rng.seed(1);
  sec.MV.doAction(sec.g, al.find((x) => x.id === 'acoso_hablar'), null, sec.r.acts);
  sec.r.type = 'acosador'; if (!sec.MV.relOf(sec.g, sec.n.id)) sec.g.p.rels.push(sec.r);
  assert.strictEqual(sec.r.stalk.acted, sec.g.p.age);
  assert.ok(sec.MV.doAction(sec.g, al.find((x) => x.id === 'acoso_policia'), null, sec.r.acts).blocked);
  // Etapa 2: ya no hay bloquear. Sin plata: ni orden ni mudanza.
  const u = stalked(18001, 'm', 2); u.g.p.money = 4999;
  assert.deepStrictEqual([...u.MV.sys.rels.actions(u.g, u.r, u.n).map((a) => a.id)], ['acoso_hablar', 'acoso_policia', 'acoso_mudarte']);
  u.g.p.money = 1999;
  assert.deepStrictEqual([...u.MV.sys.rels.actions(u.g, u.r, u.n).map((a) => a.id)], ['acoso_hablar', 'acoso_policia']);
  // Responder al evento gasta el año de la ficha, y al revés.
  const v = stalked(18002, 'f', 1); v.g.p.money = 100000;
  v.g.queue = []; v.MV.EV.push(v.g, 'acoso', { target: v.n.id }, true);
  const view = v.MV.EV.view(v.g);
  v.MV.EV.choose(v.g, view.choices.find((c) => /Ignorarla/.test(c.label)).i);
  assert.strictEqual(v.r.stalk.ev, v.g.p.age);
  const acts = v.MV.sys.rels.actions(v.g, v.r, v.n);
  v.r.acts = {};
  const blocked = v.MV.doAction(v.g, acts.find((a) => a.id === 'acoso_hablar'), null, v.r.acts);
  assert.ok(blocked.blocked);
  assert.strictEqual(v.r.stalk.acted, undefined);
  // Y no hay recuerdos con ellos.
  assert.strictEqual(MEM(v.MV).remember(v.g, v.n.id, 'golpe'), null);
});

test('no guarda recuerdos ni le vuelven', () => {
  const t = setupS(19000, 'ex');
  t.r.mem = [{ k: 'prestamo', a: 20, v: 2 }];
  assert.strictEqual(MEM(t.MV).recall(t.g).length, 1);
  assert.strictEqual(MEM(t.MV).makeStalker(t.g, t.n, 'ruptura'), true);
  assert.strictEqual(t.MV.relOf(t.g, t.n.id).type, 'acosador');
  assert.strictEqual(MEM(t.MV).recall(t.g).length, 0);
  assert.strictEqual(MEM(t.MV).remember(t.g, t.n.id, 'insulto'), null);
});

test('los textos', () => {
  for (const gender of ['m', 'f']) for (const stage of [1, 2, 3]) for (const partner of [false, true]) {
    const t = stalked(20000 + stage, gender, stage); t.g.p.money = 100000;
    if (partner) person(t.MV, t.g, 'pareja', gender === 'm' ? 'f' : 'm');
    t.g.queue = []; t.MV.EV.push(t.g, 'acoso', { target: t.n.id }, true);
    const v = t.MV.EV.view(t.g);
    const tag = `${gender}${stage}${partner}`;
    assert.ok(v && v.id === 'acoso', tag);
    assert.ok(!BAD_TEXT.test(v.text) && !SEXUAL.test(v.text), tag + v.text);
    assert.ok(v.text.includes(t.n.first), tag);
    const labels = v.choices.map((c) => c.label);
    labels.forEach((l) => assert.ok(!BAD_TEXT.test(l), l));
    assert.strictEqual(labels.some((l) => /Bloquear/.test(l)), stage === 1, tag);
    assert.ok(labels.some((l) => /Ignorar/.test(l)));
    assert.ok(labels.some((l) => (gender === 'f' ? /Ignorarla/ : /Ignorarlo/).test(l)), tag);
    assert.strictEqual(labels.length, stage === 1 ? 6 : 5, tag);
    if (stage === 3 && partner) assert.ok(/pareja|novi/i.test(v.text), v.text);
    for (const c of v.choices) {
      const u = stalked(20000 + stage, gender, stage); u.g.p.money = 100000;
      if (partner) person(u.MV, u.g, 'pareja', 'f');
      u.g.queue = []; u.MV.EV.push(u.g, 'acoso', { target: u.n.id }, true);
      const vv = u.MV.EV.view(u.g);
      const res = u.MV.EV.choose(u.g, vv.choices[v.choices.indexOf(c)].i);
      assert.ok(res.msg && !BAD_TEXT.test(res.msg) && !SEXUAL.test(res.msg), tag + c.label + res.msg);
      assert.ok(u.g.p.money >= 0 && !u.g.p.prison);
    }
  }
  // Con poca plata, sin orden ni mudanza.
  const p = stalked(20100, 'm', 1); p.g.p.money = 1500; p.g.queue = [];
  p.MV.EV.push(p.g, 'acoso', { target: p.n.id }, true);
  const l = p.MV.EV.view(p.g).choices.map((c) => c.label);
  assert.ok(!l.some((x) => /orden|Mudarte/i.test(x)), l.join('|'));
  p.g.p.money = 2000;
  p.g.queue = []; p.MV.EV.push(p.g, 'acoso', { target: p.n.id }, true);
  const l2 = p.MV.EV.view(p.g).choices.map((c) => c.label);
  assert.ok(l2.some((x) => /Mudarte/i.test(x)) && !l2.some((x) => /orden/i.test(x)), l2.join('|'));
  // Sin acosador, el evento se descarta.
  const q = setupS(20200); q.g.queue = []; q.MV.EV.push(q.g, 'acoso', { target: q.n.id }, true);
  assert.strictEqual(q.MV.EV.view(q.g), null);
  assert.doesNotThrow(() => q.MV.EV.byId.acoso.when(q.g));
});

test('los menores no tienen acosador', () => {
  for (const [pa, na] of [[16, 16], [30, 16], [16, 30], [17, 40]]) {
    const MV = sh(21000 + pa + na); const g = game(MV, 21000, pa);
    const x = person(MV, g, 'ex'); x.n.age = na;
    assert.strictEqual(MEM(MV).makeStalker(g, x.n, 'ruptura'), false, `${pa}/${na}`);
    assert.strictEqual(MV.relOf(g, x.n.id).type, 'ex'); assert.ok(!g.p.counters.acosadores);
  }
  const MV = sh(21100); const g = game(MV, 21100, 18); const x = person(MV, g, 'ex'); x.n.age = 18;
  assert.strictEqual(MEM(MV).makeStalker(g, x.n, 'ruptura'), true);
});

test('un recuerdo en cola no llega a quien se volvió acosador', () => {
  for (const [ev, ctx] of [['mem_venganza', { k: 'insulto', a: 24, v: 'chismes' }], ['mem_favor', { k: 'prestamo', a: 24, v: 'regalo' }],
    ['mem_vuelta', { k: 'prestamo', a: 24, v: 'devuelve' }], ['mem_perdon', { k: 'insulto', a: 24 }]]) {
    const MV = sh(22000); const g = game(MV, 22000, 30);
    const s = old(MV, g, ctx.k, ctx.v === undefined || ev === 'mem_venganza' ? -2 : 2, 6, 60, 'ex');
    MV.EV.push(g, ev, Object.assign({ target: s.n.id }, ctx));
    assert.strictEqual(MEM(MV).makeStalker(g, s.n, 'ruptura'), true);
    let v; assert.doesNotThrow(() => { v = MV.EV.view(g); }, ev);
    assert.ok(!v || !MEMEV.includes(v.id), ev);
  }
  // Una mascota tampoco.
  const MV = sh(22100); const g = game(MV, 22100, 30);
  const pet = MV.newPet(g, 'gato', { age: 3 }); MV.addRel(g, pet, 'mascota', 70);
  MV.EV.push(g, 'mem_favor', { target: pet.id, k: 'prestamo', a: 24, v: 'regalo' });
  assert.ok(!MV.EV.view(g));
});

// ---- Tarea 8: heredero, partidas guardadas y jugador automático ----
test('el heredero empieza sin recuerdos', () => {
  const MV = load({ seed: 30000 }); const g = game(MV, 30000, 70); g.p.money = 50000; g.p.loans = [];
  const kids = [];
  for (let i = 0; i < 2; i++) { const k = MV.newNPC(g, { age: 40 + i, last: g.p.last }); MV.addRel(g, k, 'hijo', 80); kids.push(k); }
  const sp = person(MV, g, 'conyuge', 'f'); const am = person(MV, g, 'amigo');
  const marked = [...kids.map((k) => MV.relOf(g, k.id)), sp.r, am.r];
  marked.forEach((r) => { r.mem = [{ k: 'prestamo', a: 60, v: 2, d: 1000 }]; r.memNext = 75; r.stalk = { stage: 2, since: 65 }; });
  g.p.counters.acosadores = 2;
  MV.sys.legacy.die(g, 'una prueba');
  const ng = MV.sys.legacy.continueAs(g, kids[0].id);
  assert.ok(ng.p.rels.length > 0);
  ng.p.rels.forEach((r) => { assert.ok(!('mem' in r) && !('memNext' in r) && !('stalk' in r), r.type); });
  assert.ok(!ng.p.counters.acosadores);
  assert.ok(!MV.rels(ng, 'acosador').length);
  assert.doesNotThrow(() => { MV.ageUp(ng); });
});

test('la partida guardada conserva todo', () => {
  const MV = load({ seed: 30100 }); const g = game(MV, 30100, 30);
  const a = person(MV, g, 'amigo'); a.r.mem = [{ k: 'prestamo', a: 20, v: 2, d: 5000, done: true }]; a.r.memNext = 40;
  const s = person(MV, g, 'amigo', 'f'); assert.strictEqual(MEM(MV).makeStalker(g, s.n, 'noche'), true);
  const copy = JSON.parse(JSON.stringify(g));
  const ra = MV.relOf(copy, a.n.id), rs = MV.relOf(copy, s.n.id);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(ra.mem)), [{ k: 'prestamo', a: 20, v: 2, d: 5000, done: true }]);
  assert.strictEqual(ra.memNext, 40);
  assert.strictEqual(rs.type, 'acosador'); assert.deepStrictEqual(JSON.parse(JSON.stringify(rs.stalk)), JSON.parse(JSON.stringify(MV.relOf(g, s.n.id).stalk)));
  assert.strictEqual(copy.p.counters.acosadores, 1);
  assert.doesNotThrow(() => { MEM(MV).yearly(copy); MEM(MV).stalkYearly(copy); MV.ageUp(copy); });
  // Una partida de antes, sin esos campos.
  const old2 = JSON.parse(JSON.stringify(game(MV, 30101, 30)));
  old2.p.rels.forEach((r) => { delete r.mem; delete r.memNext; delete r.stalk; });
  assert.doesNotThrow(() => { MEM(MV).yearly(old2); MV.ageUp(old2); });
});

test('el jugador automático vive 30 vidas con memoria', () => {
  const { live } = require('./agent');
  let back = 0;
  for (let seed = 600; seed < 630; seed++) {
    const MV = load({ seed }); const g = MV.newGame({ seed });
    live(MV, g, { acts: 4 });
    assert.ok(g.over, `seed ${seed}`);
    if (Object.keys(g.evDone || {}).some((k) => /^mem_/.test(k))) back++;
  }
  console.log('vidas con un recuerdo que volvió:', back, 'de 30');
  assert.ok(back > 0, 'nunca volvió un recuerdo');
});

test('en 40 vidas hay algún acosador', () => {
  const { live } = require('./agent');
  let n = 0;
  for (let seed = 700; seed < 740; seed++) {
    const MV = load({ seed }); const g = MV.newGame({ seed });
    live(MV, g, { acts: 4 });
    if (g.p.counters.acosadores) n++;
  }
  console.log('vidas con acosador:', n, 'de 40');
  assert.ok(n > 0, 'ninguna vida tuvo un acosador');
});
