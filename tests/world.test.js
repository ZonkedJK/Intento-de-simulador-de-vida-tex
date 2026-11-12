/* Noticias del mundo: titulares anuales con efectos en la economía y la salud. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const MOD_KEYS = ['inv', 'house', 'living', 'hire', 'layoff', 'sick', 'happy', 'elderHealth'];

test('cada titular tiene id, icono, texto y modificadores válidos', () => {
  const MV = load();
  assert.ok(MV.WORLD_NEWS.length >= 12);
  const ids = new Set();
  MV.WORLD_NEWS.forEach((N) => {
    assert.ok(N.id && !ids.has(N.id), N.id); ids.add(N.id);
    assert.ok(N.icon && N.title && N.text && N.text.length > 20, N.id);
    Object.keys(N.mods).forEach((k) => assert.ok(MOD_KEYS.includes(k), N.id + ': ' + k));
    Object.keys(N.mods.inv || {}).forEach((k) => assert.ok(k in MV.INVEST, N.id + ': ' + k));
    if (N.mods.sick) assert.ok(MV.CONDITIONS[N.mods.sick.cond], N.id);
    assert.ok(MV.sys.world.describe(N).length > 5, N.id);
  });
});

test('el mismo titular no sale dos años seguidos y hay años tranquilos', () => {
  const MV = load({ seed: 2 });
  const g = MV.newGame({ seed: 2 }); g.p.age = 30;
  let prev = null, calm = 0;
  for (let i = 0; i < 400; i++) {
    g.p.age++;
    MV.sys.world.yearly(g);
    const cur = g.world.id;
    if (!cur) calm++; else assert.notEqual(cur, prev);
    prev = cur;
  }
  assert.ok(calm > 120 && calm < 240, 'años tranquilos: ' + calm);
  assert.ok(g.world.past.length <= 10);
});

function avgInvest(MV, id, n) {
  let total = 0;
  for (let i = 0; i < n; i++) {
    const g = MV.newGame({ seed: 50 + i }); g.p.age = 40; g.p.money = 1e6; g.p.inv.acciones = 100000;
    g.world = id ? { age: g.p.age, id, past: [] } : null;
    MV.sys.money.yearly(g);
    total += g.p.inv.acciones;
  }
  return total / n;
}

test('una recesión baja el rendimiento de las acciones', () => {
  const MV = load({ seed: 3 });
  assert.ok(avgInvest(MV, 'recesion', 300) < avgInvest(MV, null, 300) - 10000);
});

test('la inflación sube el costo de vida', () => {
  const MV = load({ seed: 4 });
  const g = MV.newGame({ seed: 4 }); g.p.age = 30; g.p.housing = 'alquiler';
  const calm = MV.sys.money.livingCost(g);
  g.world = { age: g.p.age, id: 'inflacion', past: [] };
  assert.ok(MV.sys.money.livingCost(g) > calm * 1.1);
});

function hireRate(MV, id) {
  let ok = 0;
  for (let i = 0; i < 300; i++) {
    const g = MV.newGame({ seed: 900 + i }); g.p.age = 25; g.p.edu.done = ['primaria', 'secundaria'];
    g.world = id ? { age: g.p.age, id, past: [] } : null;
    g.queue = []; MV.EV.push(g, 'entrevista', { job: 'cajero', q: 0, order: [1, 0, 2] }, true);
    const v = MV.EV.view(g); MV.EV.choose(g, v.choices[0].i);
    if (g.p.job || g.queue.some((q) => q.id === 'oferta_trabajo')) ok++; // aprobar trae una oferta (Parte C1)
  }
  return ok / 300;
}

test('el auge tecnológico ayuda a conseguir trabajo y la recesión lo complica', () => {
  const MV = load({ seed: 5 });
  assert.ok(hireRate(MV, 'auge_tech') > hireRate(MV, 'recesion') + 0.1);
});

test('el titular queda en el diario del año', () => {
  const MV = load({ seed: 6 });
  const g = MV.newGame({ seed: 6 }); g.p.age = 30;
  g.log.push({ age: 30, year: g.year, items: [] });
  MV.sys.world.set(g, 'pandemia');
  const items = g.log[g.log.length - 1].items;
  assert.ok(items.some((it) => it.i === '📰' && /Pandemia/.test(it.t)), JSON.stringify(items));
  assert.equal(MV.sys.world.current(g).id, 'pandemia');
});

test('en una pandemia la gente se contagia más', () => {
  const MV = load({ seed: 7 });
  let sick = 0;
  for (let i = 0; i < 200; i++) {
    const g = MV.newGame({ seed: 1200 + i }); g.p.age = 30; g.p.conds = [];
    g.log.push({ age: 30, year: g.year, items: [] });
    MV.sys.world.set(g, 'pandemia');
    if (g.p.conds.some((c) => c.id === 'gripe')) sick++;
  }
  assert.ok(sick > 25, 'contagios: ' + sick);
});
