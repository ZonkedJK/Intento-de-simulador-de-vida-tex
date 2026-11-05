/* Mejoras de casas, mantenimiento y venta con precio propio. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');
const { resolveQueue } = require('./agent');

function owner(MV, kind, seed) {
  const g = MV.newGame({ seed: seed || 1 });
  g.p.age = 35; g.p.money = 5e6;
  const a = { id: MV.U.uid('a'), type: 'casa', kind, icon: '🏡', name: kind + ' de prueba', value: 300000, cond: 90, upgrades: [] };
  g.p.assets.push(a); g.p.housing = 'propia'; g.p.home = a.id;
  return { g, a };
}
const opt = (MV, g, a, id) => MV.sys.money.upgradeOptions(g, a.id).find((o) => o.id === id);

test('hay 14 mejoras y la piscina no entra en un departamento', () => {
  const MV = load();
  assert.equal(MV.HOUSE_UPGRADES.length, 14);
  const { g, a } = owner(MV, 'Departamento de 2 ambientes');
  const pool = opt(MV, g, a, 'piscina');
  assert.equal(pool.ok, false);
  assert.ok(pool.why.length > 0);
  const { g: g2, a: a2 } = owner(MV, 'Casa familiar');
  assert.equal(opt(MV, g2, a2, 'piscina').ok, true);
});

test('agregar una mejora cobra y sube el valor según su fracción', () => {
  const MV = load();
  const { g, a } = owner(MV, 'Casa familiar');
  const o = opt(MV, g, a, 'piscina');
  const U = MV.HOUSE_UPGRADES.find((u) => u.id === 'piscina');
  const v0 = a.value, m0 = g.p.money;
  MV.sys.money.addUpgrade(g, a.id, 'piscina');
  assert.equal(g.p.money, m0 - o.cost);
  assert.equal(a.value, v0 + Math.round(o.cost * U.back));
  assert.equal(a.upgrades.length, 1);
  assert.equal(opt(MV, g, a, 'piscina').ok, false, 'no se puede instalar dos veces');
});

test('el tobogán baja el valor y quitar una mejora lo revierte cobrando la demolición', () => {
  const MV = load();
  const { g, a } = owner(MV, 'Casa familiar');
  const v0 = a.value;
  MV.sys.money.addUpgrade(g, a.id, 'tobogan');
  assert.ok(a.value < v0, 'el tobogán debería restar valor');
  MV.sys.money.addUpgrade(g, a.id, 'sauna');
  const vWith = a.value, m = g.p.money;
  MV.sys.money.removeUpgrade(g, a.id, 'sauna');
  assert.ok(a.value < vWith, 'quitar la sauna baja el valor');
  assert.ok(g.p.money < m, 'la demolición cuesta');
  assert.equal(a.upgrades.length, 1);
});

test('las mejoras dan efectos solo en tu hogar y suman mantenimiento', () => {
  const MV = load({ seed: 3 });
  const { g, a } = owner(MV, 'Casa con piscina');
  const up0 = MV.sys.money.upkeep(g, a);
  MV.sys.money.addUpgrade(g, a.id, 'sauna');
  MV.sys.money.addUpgrade(g, a.id, 'tenis');
  assert.ok(MV.sys.money.upkeep(g, a) > up0, 'el mantenimiento debería subir');
  g.p.stress = 80;
  const exp0 = (g.p.sportsExp.tenis || 0);
  MV.sys.money.homeYearly(g);
  assert.ok(g.p.stress < 80, 'la sauna baja el estrés');
  assert.equal(g.p.sportsExp.tenis, exp0 + 1, 'la cancha suma práctica de tenis');
  // si no vives ahí, no hay efecto
  g.p.home = null; g.p.housing = 'alquiler'; g.p.stress = 80;
  MV.sys.money.homeYearly(g);
  assert.equal(g.p.stress, 80);
});

test('vender pidiendo 20% menos siempre se vende al precio pedido', () => {
  const MV = load({ seed: 4 });
  for (let i = 0; i < 30; i++) {
    const { g, a } = owner(MV, 'Casa familiar', 100 + i);
    const est = MV.sys.money.estimate(a), m0 = g.p.money;
    MV.sys.money.sellAt(g, a.id, -0.2);
    assert.equal(g.p.assets.length, 0);
    assert.equal(g.p.money, m0 + Math.round(est * 0.8));
  }
});

test('pedir 50% más casi siempre termina en contraoferta, y aceptarla vende al monto ofrecido', () => {
  const MV = load({ seed: 5 });
  let counters = 0;
  for (let i = 0; i < 30; i++) {
    const { g, a } = owner(MV, 'Casa familiar', 200 + i);
    MV.sys.money.sellAt(g, a.id, 0.5);
    const item = g.queue.find((q) => q.id === 'contraoferta');
    if (!item) continue;
    counters++;
    const m0 = g.p.money, offer = item.ctx.offer;
    g.queue = [item];
    const v = MV.EV.view(g);
    MV.EV.choose(g, v.choices.find((c) => /Aceptar/.test(c.label)).i);
    assert.equal(g.p.money, m0 + offer);
    assert.equal(g.p.assets.length, 0);
  }
  assert.ok(counters >= 25, 'contraofertas: ' + counters);
});

test('vender la casa con mejoras en la que vives reasigna el hogar', () => {
  const MV = load({ seed: 6 });
  const { g, a } = owner(MV, 'Casa familiar');
  MV.sys.money.addUpgrade(g, a.id, 'jardin');
  MV.sys.money.sellAt(g, a.id, -0.2);
  assert.equal(g.p.home, null);
  assert.equal(g.p.housing, 'alquiler');
  for (let y = 0; y < 3; y++) { resolveQueue(MV, g); MV.ageUp(g); }
});

test('el balance del año muestra el mantenimiento de los bienes', () => {
  const MV = load({ seed: 7 });
  const { g, a } = owner(MV, 'Mansión');
  a.value = 5e6;
  MV.ageUp(g);
  const items = g.log[g.log.length - 1].items.map((i) => i.t).join(' ');
  assert.match(items, /mantenimiento de bienes/);
});
