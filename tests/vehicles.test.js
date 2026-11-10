/* Vehículos: avión, helicóptero y yate, con o sin licencia. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

function owner(MV, seed, kind, licensed) {
  const g = MV.newGame({ seed }); g.p.age = 35; g.p.money = 1e6; g.p.license = true;
  g.p.licenses = { auto: true };
  const map = { avion: ['Avión privado', '🛩️'], helicoptero: ['Helicóptero', '🚁'], yate: ['Yate', '🛥️'] };
  if (licensed) g.p.licenses[kind] = true;
  const a = { id: 'v1', type: 'lujo', kind: map[kind][0], icon: map[kind][1], name: map[kind][0], value: 2e6, cond: 100 };
  g.p.assets.push(a);
  return { g, a };
}
const find = (MV, g, a, id) => MV.sys.vehicles.actions(g, a).find((x) => x.id === id);

test('el helicóptero se vende entre los lujos', () => {
  const MV = load();
  const H = MV.LUXURY.find((x) => x.kind === 'Helicóptero');
  assert.deepEqual(H.price, [700000, 9000000]);
});

test('volar a un destino cuesta el 25 % y cuenta como viaje', () => {
  const MV = load({ seed: 1 });
  const { g, a } = owner(MV, 1, 'avion', true);
  const volar = find(MV, g, a, 'volar');
  const ids = volar.opts(g).map((o) => o.id);
  assert.ok(ids.includes('paris') && !ids.includes('espacio') && !ids.includes('crucero'));
  const before = g.p.money, trips = g.p.counters.viajes || 0;
  const res = MV.doAction(g, volar, 'paris');
  assert.equal(before - g.p.money, 1125, res.msg);
  assert.equal(g.p.counters.viajes, trips + 1);
  assert.match(res.msg, /París/);
});

test('sin licencia se paga el piloto o el capitán', () => {
  const MV = load({ seed: 2 });
  const { g, a } = owner(MV, 2, 'avion', false);
  const volar = find(MV, g, a, 'volar');
  assert.match(volar.sub, /piloto/);
  const before = g.p.money;
  MV.doAction(g, volar, 'paris');
  assert.equal(before - g.p.money, 1125 + 5000);
  const y = owner(MV, 3, 'yate', false);
  const paseo = find(MV, y.g, y.a, 'paseo_yate');
  assert.match(paseo.sub, /capitán/);
  const m0 = y.g.p.money; MV.doAction(y.g, paseo);
  assert.equal(m0 - y.g.p.money, 800 + 1500);
});

test('sin dinero no aparecen las acciones', () => {
  const MV = load({ seed: 4 });
  const { g, a } = owner(MV, 4, 'helicoptero', true);
  g.p.money = 100;
  assert.equal(MV.sys.vehicles.actions(g, a).length, 0);
  g.p.money = 500;
  assert.ok(find(MV, g, a, 'paseo_heli'));
  assert.ok(!find(MV, g, a, 'fiesta_heli'));
});

test('en la cárcel no hay acciones', () => {
  const MV = load({ seed: 5 });
  const { g, a } = owner(MV, 5, 'yate', true);
  MV.sys.crime.jail(g, 2, 'Robo');
  assert.equal(MV.sys.vehicles.actions(g, a).length, 0);
});

test('la fiesta en el yate y la llegada en helicóptero dan fama', () => {
  const MV = load({ seed: 6 });
  const { g, a } = owner(MV, 6, 'yate', true);
  g.p.fame = 0;
  MV.doAction(g, find(MV, g, a, 'fiesta_yate'));
  assert.ok(g.p.fame > 0);
  const hh = owner(MV, 7, 'helicoptero', true);
  hh.g.p.fame = 0; const f0 = hh.g.p.followers;
  MV.doAction(hh.g, find(MV, hh.g, hh.a, 'fiesta_heli'));
  assert.ok(hh.g.p.fame > 0 && hh.g.p.followers > f0);
});

test('un bien que no es vehículo no tiene acciones', () => {
  const MV = load({ seed: 8 });
  const g = MV.newGame({ seed: 8 }); g.p.age = 30; g.p.money = 1e6;
  assert.equal(MV.sys.vehicles.actions(g, { id: 'x', type: 'lujo', kind: 'Reloj de lujo' }).length, 0);
});
