/* Herencia: la casa familiar y, si es el único o el nombrado, todos los bienes. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

function estate(MV, seed, kids) {
  const g = MV.newGame({ seed }); g.p.age = 75; g.p.money = 10000; g.p.loans = [];
  const ks = [];
  for (let i = 0; i < kids; i++) { const k = MV.newNPC(g, { age: 40 + i, last: g.p.last }); MV.addRel(g, k, 'hijo', 80); ks.push(k); }
  const home = { id: 'h1', type: 'casa', kind: 'Casa familiar', icon: '🏡', name: 'Casa familiar', value: 400000, cond: 90, upgrades: [{ id: 'piscina', added: 20000, cost: 25000 }] };
  g.p.assets.push(home); g.p.home = 'h1'; g.p.housing = 'propia';
  return { g, ks, home };
}
const inherited = (ng, kind) => ng.p.assets.find((a) => a.kind === kind);

test('el heredero recibe la casa familiar con sus mejoras aunque valga más que su parte', () => {
  const MV = load({ seed: 1 });
  const { g, ks } = estate(MV, 1, 2);
  MV.sys.legacy.die(g, 'una prueba');
  const ng = MV.sys.legacy.continueAs(g, ks[1].id);
  const h = inherited(ng, 'Casa familiar');
  assert.ok(h, 'no heredó la casa');
  assert.equal(h.upgrades[0].id, 'piscina');
  assert.equal(ng.p.money, 0, 'la casa vale más que su parte en dinero');
});

test('si alquilabas, recibe tu casa más valiosa', () => {
  const MV = load({ seed: 2 });
  const { g, ks } = estate(MV, 2, 1);
  g.p.home = null; g.p.housing = 'alquiler';
  g.p.assets.push({ id: 'h2', type: 'casa', kind: 'Penthouse', icon: '🌆', name: 'Penthouse', value: 900000, cond: 90, upgrades: [], rented: true });
  MV.sys.legacy.die(g, 'una prueba');
  const ng = MV.sys.legacy.continueAs(g, ks[0].id);
  assert.equal(ng.p.assets.find((a) => a.id === ng.p.home).kind, 'Penthouse');
});

test('el único heredero recibe todos los bienes y la isla con su proyecto', () => {
  const MV = load({ seed: 3 });
  const { g, ks } = estate(MV, 3, 1);
  g.p.money = 5e7;
  g.p.assets.push({ id: 'c1', type: 'auto', kind: 'Sedán', icon: '🚗', name: 'Sedán', value: 15000, cond: 80 });
  g.p.assets.push({ id: 'i1', type: 'lujo', kind: 'Isla privada', icon: '🏝️', name: 'Isla', value: 2e7, cond: 100 });
  MV.sys.island.develop(g, 'i1', 'reserva', 'Santuario Verde');
  MV.sys.legacy.die(g, 'una prueba');
  const worth = g.summary.worth;
  const ng = MV.sys.legacy.continueAs(g, ks[0].id);
  assert.deepEqual(ng.p.assets.map((a) => a.kind).sort(), ['Casa familiar', 'Isla privada', 'Sedán']);
  assert.equal(inherited(ng, 'Isla privada').project.name, 'Santuario Verde');
  const assetsValue = ng.p.assets.reduce((s, a) => s + a.value, 0);
  assert.ok(Math.abs(ng.p.money - (Math.round(worth * 0.9) - assetsValue)) <= 2, `${ng.p.money}`);
});

test('con varios herederos, el nombrado recibe todo y otro solo la casa', () => {
  const MV = load({ seed: 4 });
  const mk = () => { const e = estate(MV, 4, 2); e.g.p.money = 2e6; e.g.p.assets.push({ id: 'c1', type: 'auto', kind: 'Sedán', icon: '🚗', name: 'Sedán', value: 15000, cond: 80 }); e.g.p.heirId = e.ks[0].id; MV.sys.legacy.die(e.g, 'una prueba'); return e; };
  const a = mk();
  const named = MV.sys.legacy.continueAs(a.g, a.ks[0].id);
  assert.ok(inherited(named, 'Sedán') && inherited(named, 'Casa familiar'));
  const b = mk();
  const other = MV.sys.legacy.continueAs(b.g, b.ks[1].id);
  assert.ok(inherited(other, 'Casa familiar') && !inherited(other, 'Sedán'));
});

test('un heredero adulto vive en la casa heredada', () => {
  const MV = load({ seed: 5 });
  const { g, ks } = estate(MV, 5, 1);
  MV.sys.legacy.die(g, 'una prueba');
  const ng = MV.sys.legacy.continueAs(g, ks[0].id);
  assert.equal(ng.p.housing, 'propia');
  assert.equal(ng.p.assets.find((a) => a.id === ng.p.home).kind, 'Casa familiar');
  assert.match(ng.log[ng.log.length - 1].items.map((i) => i.t).join(' '), /casa familiar/i);
});
