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
