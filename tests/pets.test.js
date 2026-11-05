/* Mascotas: trucos y concursos. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

function withPet(MV, seed, species, o) {
  const g = MV.newGame({ seed }); g.p.age = 30; g.p.money = 10000;
  const pet = MV.newPet(g, species || 'perro', Object.assign({ age: 3 }, o || {}));
  const r = MV.addRel(g, pet, 'mascota', 80);
  return { g, pet, r };
}
const act = (MV, g, r, n, id) => MV.sys.rels.actions(g, r, n).find((a) => a.id === id);

test('cada especie tiene trucos propios', () => {
  const MV = load();
  Object.keys(MV.SPECIES).forEach((k) => assert.ok((MV.PET_TRICKS[k] || []).length >= 3, k));
});

test('enseñar trucos agrega trucos de su especie sin repetir', () => {
  const MV = load({ seed: 1 });
  const { g, pet, r } = withPet(MV, 1, 'perro');
  for (let y = 0; y < 30; y++) { r.acts = {}; MV.doAction(g, act(MV, g, r, pet, 'truco'), undefined, r.acts); }
  assert.ok(pet.tricks.length >= 3, 'aprendió ' + pet.tricks.length);
  assert.equal(new Set(pet.tricks).size, pet.tricks.length);
  pet.tricks.forEach((t) => assert.ok(MV.PET_TRICKS.perro.includes(t), t));
});

test('una mascota de 0 años todavía no aprende ni compite', () => {
  const MV = load({ seed: 2 });
  const { g, pet, r } = withPet(MV, 2, 'gato', { age: 0 });
  assert.ok(!act(MV, g, r, pet, 'truco'));
  assert.ok(!act(MV, g, r, pet, 'concurso'));
});

test('el concurso cobra la inscripción y con muchos trucos gana premios', () => {
  const MV = load({ seed: 3 });
  let prizes = 0;
  for (let i = 0; i < 40; i++) {
    const { g, pet, r } = withPet(MV, 30 + i, 'perro');
    pet.tricks = MV.PET_TRICKS.perro.slice(); pet.health = 100; r.rel = 100;
    const before = g.p.money;
    MV.doAction(g, act(MV, g, r, pet, 'concurso'), undefined, r.acts);
    if (g.p.money > before) prizes++;
    else assert.equal(g.p.money, before - 50);
  }
  assert.ok(prizes >= 30, 'premios: ' + prizes);
});

test('sin $50 no aparece el concurso', () => {
  const MV = load({ seed: 4 });
  const { g, pet, r } = withPet(MV, 4, 'perro');
  g.p.money = 20;
  assert.ok(!act(MV, g, r, pet, 'concurso'));
});

test('ganar un primer puesto da trofeo y el logro Mascota campeona', () => {
  const MV = load({ seed: 5 });
  let won = false;
  for (let i = 0; i < 60 && !won; i++) {
    const { g, pet, r } = withPet(MV, 70 + i, 'perro');
    pet.tricks = MV.PET_TRICKS.perro.slice(); pet.health = 100; r.rel = 100; pet.looks = 100;
    MV.doAction(g, act(MV, g, r, pet, 'concurso'), undefined, r.acts);
    if ((pet.wins || 0) > 0) { won = true; assert.ok(g.achLife.includes('mascota_campeona')); assert.ok(pet.trophies >= 1); }
  }
  assert.ok(won);
});
