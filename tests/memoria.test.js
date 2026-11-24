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
