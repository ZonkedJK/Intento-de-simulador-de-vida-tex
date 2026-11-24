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
