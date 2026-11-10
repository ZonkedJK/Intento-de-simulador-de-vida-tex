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

test('un heredero de 18 o 19 años con trabajo tiene un puesto válido', () => {
  const MV = load({ seed: 1 });
  for (const age of [18, 19]) {
    for (let i = 0; i < 10; i++) {
      const g = MV.newGame({ seed: 100 + i });
      g.p.age = 50;
      const k = MV.newNPC(g, { age, last: g.p.last, money: 0, job: '-' });
      MV.addRel(g, k, 'hijo', 80);
      MV.sys.legacy.die(g, 'una prueba');
      const ng = MV.sys.legacy.continueAs(g, k.id);
      if (!ng.p.job) continue;
      assert.ok(ng.p.job.level >= 0, 'nivel ' + ng.p.job.level);
      assert.ok(MV.sys.career.title(ng.p), 'sin título');
      const log = ng.log.flatMap((y) => y.items.map((it) => it.t)).join(' ');
      assert.ok(!/undefined/.test(log), log);
    }
  }
});

test('una partida de la versión 2 se migra a la 3 (tatuajes, mejoras y aspecto)', () => {
  const MV = load({ seed: 12 });
  const g = MV.newGame({ seed: 8 });
  g.version = 2;
  delete g.p.tattoos;
  g.p.age = 40;
  g.p.look = { skin: '#dfab84', hair: '#5e3d22', eyes: '#3c7a4a', style: 2, beard: true, glasses: false };
  g.p.assets.push({ id: 'c1', type: 'casa', kind: 'Casa familiar', icon: '🏡', name: 'Casa vieja', value: 200000, cond: 70 });
  MV.store.set('milvidas.partida', g);
  const back = MV.loadGame();
  assert.ok(back, 'no se cargó');
  assert.equal(back.version, MV.VERSION);
  assert.ok(MV.VERSION >= 3);
  assert.equal(JSON.stringify(back.p.tattoos), '[]');
  assert.equal(JSON.stringify(back.p.assets.find((a) => a.id === 'c1').upgrades), '[]');
  assert.match(MV.UI.avatarSVG({ age: 40, gender: back.p.gender, look: back.p.look, id: 'm', mood: 50 }), /^<svg/);
  assert.ok(MV.sys.money.upgradeOptions(back, 'c1').length === 14);
  for (let y = 0; y < 5 && !back.over; y++) { resolveQueue(MV, back); MV.ageUp(back); }
});

test('una partida v3 con mascotas e hijos se migra a v4 y sigue jugando', () => {
  const { load } = require('./load');
  const { resolveQueue } = require('./agent');
  const MV = load({ seed: 44 });
  const g = MV.newGame({ seed: 44 }); g.p.age = 50; g.p.money = 20000;
  const pet = MV.newPet(g, 'perro', { age: 4 }); MV.addRel(g, pet, 'mascota', 80);
  const kid = MV.newNPC(g, { age: 24, last: g.p.last }); MV.addRel(g, kid, 'hijo', 80);
  g.version = 3; delete g.p.works; delete g.world; delete g.challenge; delete pet.tricks;
  MV.store.set('milvidas.partida', g);
  const back = MV.loadGame();
  assert.equal(back.version, MV.VERSION);
  assert.ok(MV.VERSION >= 4);
  assert.ok(Array.isArray(back.p.works));
  assert.equal(back.world, null);
  assert.equal(back.challenge, null);
  for (let y = 0; y < 25 && !back.over; y++) { resolveQueue(MV, back); MV.ageUp(back); }
  assert.ok(back.p.age > 50);
});

test('una partida v4 con licencia de conducir y club se migra a v5', () => {
  const { load } = require('./load');
  const { resolveQueue } = require('./agent');
  const MV = load({ seed: 55 });
  const g = MV.newGame({ seed: 55 }); g.p.age = 17; g.p.license = true; g.p.club = 'futbol';
  g.version = 4; delete g.p.licenses; delete g.p.clubs;
  MV.store.set('milvidas.partida', g);
  const back = MV.loadGame();
  assert.equal(back.version, 5);
  assert.equal(MV.VERSION, 5);
  assert.deepEqual(back.p.licenses, { auto: true });
  assert.deepEqual(back.p.clubs, ['sport:futbol']);
  for (let y = 0; y < 20 && !back.over; y++) { resolveQueue(MV, back); MV.ageUp(back); }
  assert.ok(back.p.age > 17);
});
