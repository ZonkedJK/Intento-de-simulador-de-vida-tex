/* Vivir mejor: bienestar, hobbies con racha, retiro de descanso y rutina anual. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
function adult(MV, seed) {
  const g = MV.newGame({ seed }); g.p.age = 30; g.p.money = 1e6; g.queue = []; g.p.housing = 'propia';
  return g;
}
const act = (MV, id) => MV.ACTS.find((a) => a.id === id);
const run = (MV, g, id, opt) => { g.p.yearActs = {}; return MV.doAction(g, act(MV, id), opt); };

test('el bienestar usa los pesos del diseño y su palabra', () => {
  const MV = load({ seed: 1 });
  const g = adult(MV, 1);
  g.p.rels = [];
  Object.assign(g.p.stats, { happy: 80, health: 60 }); g.p.stress = 30;
  // 0,35·80 + 0,30·60 + 0,20·70 + 0,15·50 (sin vínculos) = 28 + 18 + 14 + 7,5 = 67,5
  assert.deepEqual(MV.sys.wellbeing.score(g), { score: 68, label: 'Bien' });
  const friend = MV.newNPC(g, { age: 30 }); MV.addRel(g, friend, 'amigo', 90);
  const pet = MV.newPet(g, 'perro'); MV.addRel(g, pet, 'mascota', 0);
  const enemy = MV.newNPC(g, { age: 30 }); MV.addRel(g, enemy, 'enemigo', 0);
  // solo cuentan vínculos cercanos humanos: amigo 90 → 0,15·90 = 13,5 → 73,5
  assert.equal(MV.sys.wellbeing.score(g).score, 74);
  Object.assign(g.p.stats, { happy: 100, health: 100 }); g.p.stress = 0;
  assert.equal(MV.sys.wellbeing.score(g).label, 'Floreciendo');
  Object.assign(g.p.stats, { happy: 30, health: 40 }); g.p.stress = 60;
  assert.equal(MV.sys.wellbeing.score(g).label, 'Regular');
  Object.assign(g.p.stats, { happy: 5, health: 10 }); g.p.stress = 100;
  assert.equal(MV.sys.wellbeing.score(g).label, 'Mal');
});

test('los 6 hobbies existen y practicar uno varios años sube la racha y baja más el estrés', () => {
  const MV = load({ seed: 2 });
  assert.deepEqual(Object.keys(MV.HOBBIES), ['jardineria', 'pesca', 'yoga', 'cocina', 'lectura', 'fotografia']);
  const g = adult(MV, 2);
  const drops = [];
  for (let y = 0; y < 5; y++) {
    g.p.stress = 80;
    const res = run(MV, g, 'hobby', 'yoga');
    assert.ok(!BAD_TEXT.test(res.msg), res.msg);
    drops.push(80 - g.p.stress);
    g.p.age++; MV.sys.wellbeing.hobbyYearly(g);
  }
  assert.equal(g.p.hobbies.yoga.streak, 5);
  assert.ok(drops[4] > drops[0], 'con racha baja más el estrés: ' + drops.join(','));
  assert.match(MV.ACTS.find((a) => a.id === 'hobby').opts(g).find((o) => o.id === 'yoga').sub, /5 años/);
});

test('saltear un año reinicia la racha', () => {
  const MV = load({ seed: 3 });
  const g = adult(MV, 3);
  run(MV, g, 'hobby', 'pesca');
  g.p.age++; MV.sys.wellbeing.hobbyYearly(g);
  run(MV, g, 'hobby', 'pesca');
  assert.equal(g.p.hobbies.pesca.streak, 2);
  g.p.age++; MV.sys.wellbeing.hobbyYearly(g);
  assert.equal(g.p.hobbies.pesca.streak, 2, 'el año siguiente todavía la conserva');
  g.p.age++; MV.sys.wellbeing.hobbyYearly(g);
  assert.equal(g.p.hobbies.pesca.streak, 0, 'un año sin practicar la reinicia');
  run(MV, g, 'hobby', 'pesca');
  assert.equal(g.p.hobbies.pesca.streak, 1);
});

test('la rutina intensa con dieta estricta sube la salud y cuesta', () => {
  const MV = load({ seed: 4 });
  const g = adult(MV, 4);
  assert.deepEqual(g.p.routine, { exercise: 'ninguno', diet: 'libre' });
  assert.ok(!BAD_TEXT.test(MV.sys.wellbeing.setRoutine(g, 'exercise', 'intenso')));
  MV.sys.wellbeing.setRoutine(g, 'diet', 'estricta');
  assert.match(MV.sys.wellbeing.setRoutine(g, 'diet', 'solo_pizza'), /no existe/);
  g.p.stats.health = 50; g.p.stats.looks = 50;
  const m0 = g.p.money;
  MV.sys.wellbeing.routineYearly(g);
  assert.ok(g.p.stats.health >= 56, 'salud ' + g.p.stats.health);
  assert.ok(g.p.stats.looks > 50);
  assert.equal(m0 - g.p.money, MV.ROUTINES.exercise.intenso.cost + MV.ROUTINES.diet.estricta.cost);
  g.p.money = 0;
  MV.sys.wellbeing.routineYearly(g);
  assert.equal(g.p.money, 0, 'sin dinero no se cobra (ni se aplica)');
  const kid = adult(MV, 5); kid.p.age = 12; kid.p.money = 0;
  MV.sys.wellbeing.setRoutine(kid, 'exercise', 'ligero');
  const h0 = kid.p.stats.health = 50;
  MV.sys.wellbeing.routineYearly(kid);
  assert.ok(kid.p.stats.health > h0, 'a los menores la rutina la pagan los padres');
});

test('el retiro de descanso baja mucho el estrés y sube un poco la salud', () => {
  const MV = load({ seed: 6 });
  const g = adult(MV, 6);
  g.p.stress = 90; g.p.stats.health = 50;
  const m0 = g.p.money;
  const res = run(MV, g, 'retiro_descanso');
  assert.ok(!BAD_TEXT.test(res.msg), res.msg);
  assert.ok(g.p.stress <= 65, 'estrés ' + g.p.stress);
  assert.ok(g.p.stats.health > 50);
  assert.ok(g.p.money < m0);
});

test('el año aplica la rutina y las rachas de hobbies', () => {
  const MV = load({ seed: 7 });
  const g = adult(MV, 7);
  const W = MV.sys.wellbeing, calls = { routine: 0, hobby: 0 };
  const r0 = W.routineYearly, h0 = W.hobbyYearly;
  W.routineYearly = (x) => { calls.routine++; return r0(x); };
  W.hobbyYearly = (x) => { calls.hobby++; return h0(x); };
  run(MV, g, 'hobby', 'lectura');
  let years = 0;
  for (let y = 0; y < 3 && !g.over; y++) { g.queue = []; MV.ageUp(g); years++; }
  assert.equal(calls.routine, years);
  assert.equal(calls.hobby, years);
  assert.equal(g.p.hobbies.lectura.streak, 0, 'tres años sin practicar');
});
