/* Hijos con vida propia, nietos reales y herencia. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

function family(MV, seed, kidAge) {
  const g = MV.newGame({ seed }); g.p.age = kidAge + 26; g.p.money = 50000;
  const kid = MV.newNPC(g, { age: kidAge, last: g.p.last, money: 5000 });
  MV.addRel(g, kid, 'hijo', 80);
  return { g, kid };
}
function years(MV, g, n) {
  for (let y = 0; y < n; y++) {
    Object.values(g.people).forEach((x) => { if (x.alive) x.age++; });
    g.p.age++;
    MV.sys.people.familyLife(g);
    g.queue = [];
  }
}

test('un hijo adulto con los años se casa y tiene hijos que son nietos reales', () => {
  const MV = load({ seed: 1 });
  let married = 0, withKids = 0;
  for (let i = 0; i < 20; i++) {
    const { g, kid } = family(MV, 10 + i, 22);
    years(MV, g, 20);
    if (kid.married) { married++; assert.ok(kid.spouseName && /\S+ \S+/.test(kid.spouseName)); }
    const nietos = MV.rels(g, 'nieto');
    if (nietos.length) {
      withKids++;
      nietos.forEach(({ n }) => { assert.equal(n.parentId, kid.id); assert.equal(MV.relLabel('nieto', n), n.gender === 'f' ? 'Nieta' : 'Nieto'); });
    }
  }
  assert.ok(married >= 14, 'casados: ' + married);
  assert.ok(withKids >= 10, 'con hijos: ' + withKids);
});

test('la boda de tu hijo es un evento con opciones', () => {
  const MV = load({ seed: 2 });
  const { g, kid } = family(MV, 2, 28);
  MV.sys.people.marryKid(g, kid);
  assert.ok(kid.married);
  const v = MV.EV.view(g);
  assert.equal(v.id || g.queue[0].id, 'hijo_boda');
  const before = MV.relOf(g, kid.id).rel;
  MV.EV.choose(g, v.choices.find((c) => /No ir/.test(c.label)).i);
  assert.ok(MV.relOf(g, kid.id).rel < before);
});

test('un hijo muerto no se casa ni tiene hijos', () => {
  const MV = load({ seed: 3 });
  const { g, kid } = family(MV, 3, 25);
  kid.alive = false;
  years(MV, g, 30);
  assert.ok(!kid.married);
  assert.equal(MV.rels(g, 'nieto').length, 0);
});

test('sin hijos vivos, los nietos son los herederos', () => {
  const MV = load({ seed: 4 });
  const { g, kid } = family(MV, 4, 30);
  MV.sys.people.marryKid(g, kid); g.queue = [];
  const gc = MV.sys.people.grandchild(g, kid); g.queue = [];
  assert.deepEqual(MV.sys.legacy.heirs(g).map((n) => n.id), [kid.id]);
  kid.alive = false;
  assert.deepEqual(MV.sys.legacy.heirs(g).map((n) => n.id), [gc.id]);
});

test('continuar como nieto deja al hijo como padre y al jugador como abuelo', () => {
  const MV = load({ seed: 5 });
  const { g, kid } = family(MV, 5, 40);
  g.p.age = 75;
  MV.sys.people.marryKid(g, kid); g.queue = [];
  const gc = MV.sys.people.grandchild(g, kid); g.queue = [];
  gc.age = 19;
  const sib = MV.sys.people.grandchild(g, kid); g.queue = [];
  kid.alive = false;
  MV.sys.legacy.die(g, 'una prueba');
  const ng = MV.sys.legacy.continueAs(g, gc.id);
  const relTo = (id) => ng.p.rels.find((r) => r.id === id);
  assert.equal(relTo(g.p.id).type, 'abuelo');
  assert.equal(relTo(kid.id).type, 'padre');
  assert.equal(relTo(sib.id).type, 'hermano');
  const text = ng.log[ng.log.length - 1].items.map((i) => i.t).join(' ');
  assert.match(text, /niet[oa] de/);
});

test('continuar como un hijo casado trae a su pareja y a sus hijos', () => {
  const MV = load({ seed: 6 });
  const { g, kid } = family(MV, 6, 35);
  g.p.age = 70;
  MV.sys.people.marryKid(g, kid); g.queue = [];
  const gc = MV.sys.people.grandchild(g, kid); g.queue = [];
  MV.sys.legacy.die(g, 'una prueba');
  const ng = MV.sys.legacy.continueAs(g, kid.id);
  const spouse = MV.rels(ng, 'conyuge')[0];
  assert.ok(spouse, 'sin pareja');
  assert.equal(`${spouse.n.first} ${spouse.n.last}`, kid.spouseName);
  const kids = MV.rels(ng, 'hijo').map((x) => x.n.id);
  assert.ok(kids.includes(gc.id));
  assert.equal(ng.people[gc.id].otherParent, spouse.n.id);
});

test('las acciones con nietos existen y concuerdan en género', () => {
  const MV = load({ seed: 7 });
  const { g, kid } = family(MV, 7, 35);
  g.p.age = 65;
  MV.sys.people.marryKid(g, kid); g.queue = [];
  const gc = MV.sys.people.grandchild(g, kid); g.queue = [];
  gc.age = 6; gc.gender = 'f';
  const r = MV.relOf(g, gc.id);
  const acts = MV.sys.rels.actions(g, r, gc);
  const ids = acts.map((a) => a.id);
  ['consentir', 'parque', 'historias_nieto'].forEach((id) => assert.ok(ids.includes(id), id));
  assert.match(acts.find((a) => a.id === 'parque').label, /Llevarla/);
  acts.forEach((a) => { r.acts = {}; const res = MV.doAction(g, a, a.opts ? (a.opts(g)[0] || {}).id : undefined, r.acts); assert.ok(!/undefined|NaN/.test(res.msg), a.id + ': ' + res.msg); });
});

test('la boda de tu hijo estando preso solo ofrece mandar una carta', () => {
  const MV = load({ seed: 8 });
  const { g, kid } = family(MV, 8, 28);
  MV.sys.crime.jail(g, 4, 'Robo');
  MV.sys.people.marryKid(g, kid);
  const v = MV.EV.view(g);
  assert.deepEqual(v.choices.map((c) => /carta/.test(c.label)), [true]);
});
