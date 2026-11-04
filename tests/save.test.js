/* Guardado, carga, exportar/importar y herencia. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');
const { live, resolveQueue } = require('./agent');

function years(MV, g, n) {
  for (let i = 0; i < n && !g.over; i++) { resolveQueue(MV, g); MV.ageUp(g); }
  resolveQueue(MV, g);
}

test('guardar y cargar conserva la partida y el azar', () => {
  const MV = load();
  const g = MV.newGame({ seed: 99, year: 2026 });
  years(MV, g, 25);
  MV.saveGame(g);
  const snapshot = JSON.stringify(g);
  years(MV, g, 15);
  const a = JSON.stringify(g.log);
  const loaded = MV.loadGame();
  assert.ok(MV.validGame(loaded));
  assert.equal(JSON.stringify(loaded), snapshot);
  years(MV, loaded, 15);
  assert.equal(JSON.stringify(loaded.log), a, 'continuar desde la carga debe dar el mismo resultado');
});

test('exportar e importar ida y vuelta', () => {
  const MV = load();
  const g = MV.newGame({ seed: 5 });
  years(MV, g, 10);
  const text = MV.exportData(g);
  const back = MV.importData(text);
  assert.equal(back.p.id, g.p.id);
  assert.equal(back.p.age, g.p.age);
  assert.throws(() => MV.importData('esto no es json'), /JSON/);
  assert.throws(() => MV.importData('{"type":"otro"}'), /Mil Vidas/);
});

test('una partida guardada inválida no se carga', () => {
  const MV = load();
  MV.store.set('milvidas.partida', { version: 999 });
  assert.equal(MV.loadGame(), null);
});

test('continuar como heredero crea una partida válida con herencia', () => {
  const MV = load({ seed: 3 });
  let tried = 0, done = false;
  for (let i = 0; i < 80 && !done; i++) {
    const g = MV.newGame({ seed: 1200 + i });
    live(MV, g);
    const heirs = MV.sys.legacy.heirs(g);
    if (!heirs.length) continue;
    tried++;
    const kid = heirs[0];
    const ng = MV.sys.legacy.continueAs(g, kid.id);
    assert.ok(MV.validGame(ng));
    assert.equal(ng.p.first, kid.first);
    assert.equal(ng.p.age, kid.age);
    assert.equal(ng.generation, g.generation + 1);
    assert.equal(ng.dynasty.id, g.dynasty.id);
    assert.ok(ng.achLife.includes('heredero'));
    assert.ok(ng.p.money >= 0);
    const parent = ng.p.rels.find((r) => r.id === g.p.id);
    assert.ok(parent && parent.type === 'padre' && ng.people[g.p.id].alive === false, 'el jugador anterior debe ser un padre fallecido');
    years(MV, ng, 5);
    done = true;
  }
  assert.ok(tried > 0, 'ninguna vida tuvo hijos en 80 intentos');
});

test('el cementerio y los logros persisten entre vidas', () => {
  const MV = load({ seed: 8 });
  MV.resetGlobal();
  const g = MV.newGame({ seed: 77 });
  MV.ach.unlock(g, 'nacer');
  live(MV, g);
  const glob = MV.global();
  assert.equal(glob.graveyard.length, 1);
  assert.ok(glob.ach.nacer);
  assert.equal(glob.lives, 1);
});
