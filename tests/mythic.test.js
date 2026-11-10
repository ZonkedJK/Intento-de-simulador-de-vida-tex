/* Mascotas míticas (guardián del bosque, dragoncito, unicornio, fantasma) y gatos callejeros. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
const MYTHIC = ['guardian', 'dragon', 'unicornio', 'fantasma'];

function adult(MV, seed) {
  const g = MV.newGame({ seed }); g.p.age = 30; g.p.money = 1e7; g.p.housing = 'propia'; g.queue = [];
  return g;
}
const act = (MV, id) => MV.ACTS.find((a) => a.id === id);
const run = (MV, g, id, opt, opt2) => { g.p.yearActs = {}; return MV.doAction(g, act(MV, id), opt, undefined, opt2); };
const petsOf = (MV, g, sp) => MV.rels(g, 'mascota').filter(({ n }) => !sp || n.species === sp);

test('las míticas no se adoptan en la tienda y tienen trucos propios', () => {
  const MV = load({ seed: 1 });
  const g = adult(MV, 1);
  const ids = act(MV, 'adoptar_mascota').opts(g).map((o) => o.id);
  MYTHIC.forEach((sp) => {
    assert.ok(MV.SPECIES[sp] && MV.SPECIES[sp].mythic, sp);
    assert.ok(!ids.includes(sp), 'se vende ' + sp);
    assert.ok((MV.PET_TRICKS[sp] || []).length >= 3, 'trucos de ' + sp);
  });
  assert.ok(ids.includes('perro'));
});

test('plantar árboles cuesta $200, da karma, a veces trae al guardián y nunca dos', () => {
  const MV = load({ seed: 2 });
  const g = adult(MV, 2);
  const m0 = g.p.money, k0 = g.p.karma;
  run(MV, g, 'plantar_arboles');
  assert.equal(g.p.money, m0 - 200);
  assert.ok(g.p.karma > k0);
  for (let i = 0; i < 200; i++) { g.queue = []; run(MV, g, 'plantar_arboles'); }
  assert.equal(petsOf(MV, g, 'guardian').length, 1);
  assert.equal(MV.sys.mythic.grant(g, 'guardian'), null, 'grant no da un segundo guardián');
});

test('el voluntariado también puede traer al guardián', () => {
  const MV = load({ seed: 3 });
  const g = adult(MV, 3);
  for (let i = 0; i < 300 && !MV.sys.mythic.has(g, 'guardian'); i++) { g.queue = []; run(MV, g, 'voluntariado'); }
  assert.ok(MV.sys.mythic.has(g, 'guardian'));
});

test('el guardián da karma y se va con karma muy bajo o un delito', () => {
  const MV = load({ seed: 4 });
  const g = adult(MV, 4);
  const pet = MV.sys.mythic.grant(g, 'guardian');
  assert.ok(pet && pet.species === 'guardian');
  g.p.karma = 10;
  MV.sys.mythic.yearly(g);
  assert.equal(g.p.karma, 11);
  g.p.karma = -31;
  MV.sys.mythic.yearly(g);
  assert.ok(!MV.sys.mythic.has(g, 'guardian'), 'se fue con karma -31');
  MV.sys.mythic.grant(g, 'guardian');
  g.p.karma = 20;
  MV.sys.mythic.yearly(g);
  assert.ok(MV.sys.mythic.has(g, 'guardian'));
  g.p.age = 30; MV.sys.crime.commit(g, Object.keys(MV.CRIMES).find((k) => MV.CRIMES[k].age <= 30 && !MV.CRIMES[k].needs && !MV.CRIMES[k].needsJob));
  g.queue = [];
  MV.sys.mythic.yearly(g);
  assert.ok(!MV.sys.mythic.has(g, 'guardian'), 'se fue tras un delito');
});

test('una reserva natural trae al guardián (10 % por año)', () => {
  const MV = load({ seed: 5 });
  const g = adult(MV, 5);
  g.p.assets.push({ id: 'isla1', type: 'lujo', kind: 'Isla privada', name: 'Isla Test', value: 1e6, cond: 100, project: { type: 'reserva', name: 'Reserva', level: 1, rep: 50 } });
  let years = 0;
  while (!MV.sys.mythic.has(g, 'guardian') && years < 200) { MV.sys.mythic.yearly(g); years++; }
  assert.ok(MV.sys.mythic.has(g, 'guardian'));
});

test('el unicornio aparece solo con karma 60 y se va con karma bajo', () => {
  const MV = load({ seed: 6 });
  const g = adult(MV, 6);
  g.p.karma = 59;
  for (let i = 0; i < 300; i++) MV.sys.mythic.yearly(g);
  assert.ok(!MV.sys.mythic.has(g, 'unicornio'));
  g.p.karma = 60;
  for (let i = 0; i < 400 && !MV.sys.mythic.has(g, 'unicornio'); i++) MV.sys.mythic.yearly(g);
  assert.ok(MV.sys.mythic.has(g, 'unicornio'));
  const h0 = g.p.stats.happy = 50;
  MV.sys.mythic.yearly(g);
  assert.ok(g.p.stats.happy > h0, 'da felicidad');
  g.p.karma = 39;
  MV.sys.mythic.yearly(g);
  assert.ok(!MV.sys.mythic.has(g, 'unicornio'));
});

test('el fantasma viene con una casa embrujada, baja el estrés y se queda en la casa si la vendes', () => {
  const MV = load({ seed: 7 });
  const g = adult(MV, 7);
  for (let i = 0; i < 200; i++) MV.sys.mythic.yearly(g);
  assert.ok(!MV.sys.mythic.has(g, 'fantasma'));
  g.p.assets.push({ id: 'casa1', type: 'casa', kind: 'Casa embrujada (eso dicen)', icon: '👻', name: 'Casona', value: 50000, cond: 60, haunted: true });
  for (let i = 0; i < 200 && !MV.sys.mythic.has(g, 'fantasma'); i++) MV.sys.mythic.yearly(g);
  assert.ok(MV.sys.mythic.has(g, 'fantasma'));
  g.p.stress = 50;
  MV.sys.mythic.yearly(g);
  assert.ok(g.p.stress < 50);
  g.p.assets = [];
  MV.sys.mythic.yearly(g);
  assert.ok(!MV.sys.mythic.has(g, 'fantasma'));
});

test('el mercader de los viajes vende el dragón por $50.000', () => {
  const MV = load({ seed: 8 });
  const g = adult(MV, 8);
  let seen = false;
  for (let i = 0; i < 200 && !seen; i++) { g.queue = []; run(MV, g, 'vacaciones', MV.DESTINATIONS[0].id, 'solo'); seen = g.queue.some((q) => q.id === 'mercader'); }
  assert.ok(seen, 'el mercader aparece en algún viaje');
  g.queue = [];
  g.p.money = 60000;
  MV.EV.push(g, 'mercader', {}, true);
  const v = MV.EV.view(g);
  const buy = v.choices.find((c) => /50\.000/.test(c.label));
  assert.ok(buy, v.choices.map((c) => c.label).join(' | '));
  const res = MV.EV.choose(g, buy.i);
  assert.ok(!BAD_TEXT.test(res.msg), res.msg);
  assert.equal(g.p.money, 10000);
  assert.ok(MV.sys.mythic.has(g, 'dragon'));
  g.p.money = 1000; g.queue = [];
  MV.EV.push(g, 'mercader', {}, true);
  assert.ok(!MV.EV.view(g).choices.some((c) => /50\.000/.test(c.label)), 'sin dinero no se ofrece la compra');
});

test('el dragón a veces quema dinero o se hace viral', () => {
  const MV = load({ seed: 9 });
  const g = adult(MV, 9);
  MV.sys.mythic.grant(g, 'dragon');
  let burned = false, viral = false;
  for (let i = 0; i < 200; i++) {
    const m = g.p.money, f = g.p.fame;
    MV.sys.mythic.yearly(g);
    if (g.p.money < m) burned = true;
    if (g.p.fame > f) viral = true;
  }
  assert.ok(burned && viral);
});

test('cada mítica tiene dibujo propio sin textos rotos', () => {
  const MV = load();
  const svgs = MYTHIC.map((sp) => MV.UI.mythicSVG(sp));
  svgs.forEach((s, i) => { assert.match(s, /^<svg/, MYTHIC[i]); assert.ok(!BAD_TEXT.test(s), MYTHIC[i]); });
  assert.equal(new Set(svgs).size, 4);
  assert.equal(MV.UI.mythicSVG('perro'), '');
});

test('si una mítica se va con un evento suyo pendiente, la cola sigue sin errores', () => {
  const MV = load({ seed: 10 });
  const g = adult(MV, 10);
  const pet = MV.sys.mythic.grant(g, 'guardian');
  MV.EV.push(g, 'mascota_destrozo', { target: pet.id });
  g.p.karma = -60;
  MV.sys.mythic.yearly(g);
  assert.ok(!g.queue.some((q) => q.ctx && q.ctx.target === pet.id), 'el evento de la mascota que se fue sigue en la cola');
  for (let i = 0; i < 20 && g.queue.length; i++) { const v = MV.EV.view(g); if (!v) break; MV.EV.choose(g, v.choices[0].i); }
  assert.ok(!MV.relOf(g, pet.id));
});

test('las míticas no mueren de accidentes misteriosos', () => {
  const MV = load({ seed: 11 });
  const g = adult(MV, 11);
  const pets = ['guardian', 'unicornio', 'fantasma'].map((sp) => MV.sys.mythic.grant(g, sp));
  for (let i = 0; i < 60; i++) MV.sys.people.yearly(g);
  pets.forEach((p) => assert.ok(p.alive, p.species));
});

test('recoger un gato callejero de cada edad le da esa edad y vida restante', () => {
  const MV = load({ seed: 12 });
  const ranges = { gatito: [0, 0], joven: [1, 3], adulto: [4, 9], anciano: [10, 15] };
  const opts = act(MV, 'gato_callejero').opts(adult(MV, 12)).map((o) => o.id);
  assert.deepEqual(opts, Object.keys(ranges));
  for (let i = 0; i < 40; i++) {
    const g = adult(MV, 100 + i);
    const k = Object.keys(ranges)[i % 4], [lo, hi] = ranges[k];
    const m0 = g.p.money, had = new Set(petsOf(MV, g).map(({ n }) => n.id));
    const res = run(MV, g, 'gato_callejero', k);
    assert.ok(!BAD_TEXT.test(res.msg), res.msg);
    const cats = petsOf(MV, g, 'gato').filter(({ n }) => !had.has(n.id));
    assert.equal(cats.length, 1, res.msg);
    const cat = cats[0].n;
    assert.ok(cat.age >= lo && cat.age <= hi, `${k}: ${cat.age}`);
    assert.ok(cat.lifespan >= cat.age + 1, `${k}: vida ${cat.lifespan} con edad ${cat.age}`);
    assert.ok(m0 - g.p.money >= 50 && m0 - g.p.money <= 150, 'veterinario $50–150');
  }
});

test('el gato anciano da más karma', () => {
  const MV = load({ seed: 13 });
  const gain = (k, seed) => { const g = adult(MV, seed); g.p.karma = 0; run(MV, g, 'gato_callejero', k); return g.p.karma; };
  assert.equal(gain('anciano', 1), 6);
  assert.equal(gain('gatito', 2), 3);
});

test('con tus padres a veces no te dejan quedarte con el gato', () => {
  const MV = load({ seed: 14 });
  let no = 0, yes = 0;
  for (let i = 0; i < 100; i++) {
    const g = MV.newGame({ seed: 200 + i }); g.p.age = 13; g.p.money = 500; g.queue = [];
    if (!MV.rels(g, 'padre').length) continue;
    g.p.housing = 'padres';
    const before = petsOf(MV, g).length;
    run(MV, g, 'gato_callejero', 'joven');
    if (petsOf(MV, g).length > before) yes++; else no++;
  }
  assert.ok(no > 15 && yes > 30, `sí ${yes}, no ${no}`);
});

test('el evento del gato que te sigue lo agrega a tus mascotas', () => {
  const MV = load({ seed: 15 });
  const g = adult(MV, 15);
  MV.EV.push(g, 'gato_sigue', {}, true);
  const v = MV.EV.view(g);
  assert.ok(!BAD_TEXT.test(v.text), v.text);
  assert.equal(v.choices.length, 3);
  const before = petsOf(MV, g, 'gato').length;
  const res = MV.EV.choose(g, v.choices[0].i);
  assert.ok(!BAD_TEXT.test(res.msg), res.msg);
  assert.equal(petsOf(MV, g, 'gato').length, before + 1);
});
