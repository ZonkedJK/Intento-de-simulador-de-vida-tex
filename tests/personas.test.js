'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');
const MV = load({ seed: 1 });

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
/** Partida con el jugador a esa edad, sin cola ni relaciones. */
function game(MV, seed, age) {
  const g = MV.newGame({ seed }); g.p.age = age == null ? 30 : age; g.queue = []; g.p.rels = [];
  return g;
}
/** Persona con esos rasgos y ese tipo de relación. */
function person(MV, g, type, traits, extra) {
  const n = MV.newNPC(g, Object.assign({ age: 30, traits: traits || [] }, extra || {}));
  return { n, r: MV.addRel(g, n, type || 'amigo', 50) };
}

test('los rasgos concuerdan con el género', () => {
  const g = game(MV, 1);
  const f = person(MV, g, 'amigo', [], { gender: 'f' }).n;
  const m = person(MV, g, 'amigo', [], { gender: 'm' }).n;
  assert.strictEqual(MV.traitLabel('tóxico', f), 'tóxica');
  assert.strictEqual(MV.traitLabel('tóxico', m), 'tóxico');
  assert.strictEqual(MV.traitLabel('amable', f), 'amable');
  for (const id of MV.TRAITS) {
    for (const n of [f, m]) {
      const l = MV.traitLabel(id, n);
      assert.ok(l && typeof l === 'string' && !BAD_TEXT.test(l), id);
    }
  }
  assert.strictEqual(MV.traitLabel('inexistente', f), 'inexistente');
});

test('hay 18 rasgos y todos tienen tabla', () => {
  assert.strictEqual(MV.TRAITS.length, 18);
  for (const id of MV.TRAITS) {
    const t = MV.TRAIT_INFO[id];
    assert.ok(t, id);
    assert.ok(t.f && t.up && t.down, id);
  }
});

test('cada tag de la tabla existe', () => {
  const known = new Set();
  Object.values(MV.ACTION_TAGS).forEach((tags) => tags.forEach((t) => known.add(t)));
  for (const id of MV.TRAITS) {
    const t = MV.TRAIT_INFO[id];
    const used = Object.keys(t.up).concat(Object.keys(t.down), t.flip || []);
    for (const tag of used) assert.ok(tag === '*' || known.has(tag), id + ': ' + tag);
  }
});

test('las personas viejas conservan sus rasgos', () => {
  const g = game(MV, 2);
  const { n } = person(MV, g, 'amigo', ['tóxico', 'leal'], { gender: 'f' });
  assert.deepStrictEqual(n.traits, ['tóxico', 'leal']);
  assert.deepStrictEqual(n.traits.map((t) => MV.traitLabel(t, n)), ['tóxica', 'leal']);
});

// ——— Tarea 2: el ajuste por personalidad ———

/** Corre la acción `id` con una persona de esos rasgos (misma semilla) y devuelve { delta, msg, r, n }. */
function runAction(MV, seed, traits, id, extra, type) {
  MV.rng.seed(seed);
  const g = game(MV, seed, 30);
  const { n, r } = person(MV, g, type || 'amigo', traits, Object.assign({ gender: 'm' }, extra || {}));
  const a = MV.sys.rels.actions(g, r, n).find((x) => x.id === id);
  assert.ok(a, 'falta la acción ' + id);
  const before = r.rel;
  const out = a.run(g);
  const msg = typeof out === 'string' ? out : '';
  return { delta: r.rel - before, msg, r, n, before };
}

test('cada rasgo mueve la acción hacia su lado', () => {
  let big = 0;
  for (let s = 1; s <= 30; s++) {
    const base = runAction(MV, s, [], 'escuchar').delta;
    assert.ok(base >= 5 && base <= 10);
    for (const t of ['amable', 'sensible']) {
      const d = runAction(MV, s, [t], 'escuchar').delta;
      assert.strictEqual(d, Math.round(base * 1.5), t + ' s' + s);
      if (d > base) big++;
    }
    const ins = runAction(MV, s, [], 'insultar').delta;
    assert.ok(ins <= -10);
    assert.strictEqual(runAction(MV, s, ['dramático'], 'insultar').delta, Math.round(ins * 2), 'dramático');
    assert.strictEqual(runAction(MV, s, ['amable'], 'insultar').delta, Math.round(ins * 0.75), 'amable');
    assert.strictEqual(runAction(MV, s, ['competitivo'], 'gym_juntos').delta, Math.round(runAction(MV, s, [], 'gym_juntos').delta * 1.5), 'competitivo');
  }
  assert.ok(big > 0);
  let bad = 0;
  for (let s = 1; s <= 80; s++) {
    if (runAction(MV, s, [], 'broma').delta < 0) {
      assert.strictEqual(runAction(MV, s, ['divertido'], 'broma').delta, 2, 'divertido s' + s);
      bad++;
    }
  }
  assert.ok(bad > 0, 'alguna broma sale mal');
});

test('el factor queda entre 0,5 y 2', () => {
  const g = game(MV, 3);
  const a = person(MV, g, 'amigo', ['dramático', 'sensible']).n;
  assert.strictEqual(MV.sys.persona.factor(a, ['ofensa'], -1), 2);
  const b = person(MV, g, 'amigo', ['tímido', 'tranquilo']).n;
  assert.strictEqual(MV.sys.persona.factor(b, ['salida', 'fiesta'], 1), 0.5);
  const c = person(MV, g, 'amigo', ['tóxico', 'dramático']).n;
  assert.strictEqual(MV.sys.persona.factor(c, ['ofensa'], -1), 2);
  assert.ok(MV.sys.persona.has(a, 'sensible') && !MV.sys.persona.has(a, 'leal'));
});

test('sin rasgos o sin grupo, nada cambia', () => {
  const g = game(MV, 4);
  const none = person(MV, g, 'amigo', []).n;
  const undef = person(MV, g, 'amigo', []).n;
  delete undef.traits;
  for (const n of [none, undef]) {
    assert.strictEqual(MV.sys.persona.factor(n, ['ofensa'], -1), 1);
    assert.strictEqual(MV.sys.persona.factor(n, [], 1), 1);
    assert.strictEqual(MV.sys.persona.forgiveAt(n), 70);
    assert.strictEqual(MV.sys.persona.spite(n), 1);
  }
  const dram = person(MV, g, 'amigo', ['dramático']).n;
  assert.strictEqual(MV.sys.persona.factor(dram, [], -1), 1);
  for (let s = 1; s <= 20; s++) {
    const kid = { age: 10 };
    const a = runAction(MV, s, ['dramático', 'sensible'], 'castigar', kid, 'hijo');
    const b = runAction(MV, s, [], 'castigar', kid, 'hijo');
    assert.strictEqual(a.delta, b.delta);
    assert.ok(!BAD_TEXT.test(a.msg));
  }
});

test('la línea de reacción nombra a la persona', () => {
  for (const gender of ['f', 'm']) {
    let seen = 0;
    for (let s = 1; s <= 200; s++) {
      const { msg, n } = runAction(MV, s, ['dramático'], 'insultar', { gender });
      assert.ok(!BAD_TEXT.test(msg), msg);
      if (msg.split(n.first).length > 2) seen++;
    }
    assert.ok(seen > 0, 'alguna vez trae línea (' + gender + ')');
  }
  for (const id of MV.TRAITS) {
    const t = MV.TRAIT_INFO[id];
    for (const gender of ['f', 'm']) {
      const n = { first: 'Zoe', gender };
      for (const side of ['up', 'down']) {
        assert.ok(t.lines && t.lines[side] && t.lines[side].length >= 2, id + ' ' + side);
        for (const f of t.lines[side]) {
          const s = f(n);
          assert.ok(s.includes('Zoe') && !BAD_TEXT.test(s), id + ': ' + s);
        }
      }
    }
  }
});

test('fire y wrap: la marca no se arrastra', () => {
  const P = MV.sys.persona;
  const g = game(MV, 5);
  const { n, r } = person(MV, g, 'amigo', ['dramático']);
  r.rel = 40;
  P.fire();
  assert.strictEqual(P.adjust(g, r, n, 'insultar', 50), '');
  assert.strictEqual(r.rel, 40, 'la especial no se toca');
  r.rel = 30; // venía de 50: bajó 20, con dramático baja 40
  P.adjust(g, r, n, 'insultar', 50);
  assert.strictEqual(r.rel, 10, 'la marca ya se borró: 50 - 20 x 2');
  const raw = { id: 'x', run: () => 'hola' };
  assert.strictEqual(P.wrap(g, r, n, raw).run(g), 'hola');
  const noRun = { id: 'y' };
  assert.strictEqual(P.wrap(g, r, n, noRun), noRun);
  const pet = MV.newPet(g, 'perro', { age: 2 });
  const act = { id: 'insultar', run: () => { return 'x'; } };
  assert.strictEqual(P.wrap(g, r, pet, act), act);
});

test('el perdón depende del rasgo', () => {
  const mk = (traits, rel) => {
    const g = game(MV, 6);
    const { n, r } = person(MV, g, 'amigo', traits);
    r.rel = rel;
    return MV.sys.memory.outcome(g, r, n, { k: 'insulto', a: 10, d: 'x', v: -2 }).ev;
  };
  assert.strictEqual(mk(['leal'], 62), 'mem_perdon');
  assert.strictEqual(mk([], 62), 'mem_venganza');
  assert.strictEqual(mk(['rencoroso'], 85), 'mem_venganza');
  assert.strictEqual(mk(['leal', 'rencoroso'], 85), 'mem_venganza');
  assert.strictEqual(mk(['leal', 'rencoroso'], 90), 'mem_perdon');
  assert.strictEqual(mk([], 70), 'mem_perdon');
});

test('los rencorosos se vengan más', () => {
  let rencor = 0;
  const N = 600;
  for (let s = 1; s <= N; s++) {
    MV.rng.seed(s);
    const g = game(MV, s, 40);
    const a = person(MV, g, 'amigo', ['rencoroso']), b = person(MV, g, 'amigo', []);
    for (const x of [a, b]) x.r.mem = [{ k: 'insulto', a: 20, d: 'x', v: -2 }];
    let picked = null;
    const real = MV.U.chance, realPush = MV.EV.push;
    MV.EV.push = function (gg, id, data) { picked = data.target; };
    MV.U.chance = () => true;
    try { MV.sys.memory.yearly(g); } finally { MV.U.chance = real; MV.EV.push = realPush; }
    if (picked === a.n.id) rencor++;
  }
  assert.ok(rencor / N > 0.53 && rencor / N < 0.67, String(rencor / N));
});
