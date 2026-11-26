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
