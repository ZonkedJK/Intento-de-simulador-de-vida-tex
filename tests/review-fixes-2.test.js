/* Correcciones de la segunda revisión: cada prueba reproduce un hallazgo. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

function grandFamily(MV, seed, gcAge) {
  const g = MV.newGame({ seed }); g.p.age = 78; g.p.money = 1000000;
  const kid = MV.newNPC(g, { age: 45, last: g.p.last }); MV.addRel(g, kid, 'hijo', 80);
  MV.sys.people.marryKid(g, kid); g.queue = [];
  const a = MV.sys.people.grandchild(g, kid); const b = MV.sys.people.grandchild(g, kid); g.queue = [];
  a.age = gcAge; b.age = gcAge + 2;
  return { g, kid, a, b };
}

test('R1: la muerte de un nieto es cercana (aviso y más tristeza)', () => {
  const MV = load({ seed: 1 });
  const { g, a } = grandFamily(MV, 1, 10);
  g.queue = [];
  MV.sys.people.die(g, a, 'un accidente');
  assert.ok(g.queue.some((q) => q.info && /Descanse en paz/.test(q.info.title)), 'sin aviso por la muerte del nieto');
});

test('R2: si el heredero nombrado murió, los nietos se reparten la herencia completa', () => {
  const MV = load({ seed: 2 });
  const { g, kid, a } = grandFamily(MV, 2, 20);
  g.p.heirId = kid.id; kid.alive = false;
  g.p.assets = []; g.p.loans = []; g.p.money = 1000000;
  MV.sys.legacy.die(g, 'una prueba');
  const ng = MV.sys.legacy.continueAs(g, a.id);
  assert.ok(ng.p.money >= 400000, 'heredó ' + ng.p.money);
});

test('R3: un nieto menor que hereda tiene un padre o madre vivo', () => {
  const MV = load({ seed: 3 });
  const { g, kid, a } = grandFamily(MV, 3, 8);
  kid.alive = false;
  MV.sys.legacy.die(g, 'una prueba');
  const ng = MV.sys.legacy.continueAs(g, a.id);
  const parents = MV.rels(ng, 'padre');
  assert.ok(parents.length >= 1, 'sin padres vivos');
  assert.equal(`${parents[0].n.first} ${parents[0].n.last}`.trim(), kid.spouseName);
});

test('R4: textos nuevos con el género correcto', () => {
  const MV = load({ seed: 4 });
  // Concurso: el artículo concuerda con la especie, no con el sexo de tu mascota
  for (let i = 0; i < 80; i++) {
    const g = MV.newGame({ seed: 40 + i }); g.p.age = 30; g.p.money = 1000;
    const pet = MV.newPet(g, i % 2 ? 'tortuga' : 'perro', { age: 3 }); pet.gender = i % 4 < 2 ? 'f' : 'm';
    const r = MV.addRel(g, pet, 'mascota', 10); pet.health = 0; pet.tricks = [];
    const msg = MV.sys.rels.petShow(g, pet, r);
    assert.ok(!/una perro|un tortuga/.test(msg), msg);
  }
  // Boda desde la cárcel: "presa" para una mujer
  const g = MV.newGame({ seed: 5, gender: 'f' }); g.p.age = 55;
  const kid = MV.newNPC(g, { age: 28 }); MV.addRel(g, kid, 'hijo', 80);
  MV.sys.crime.jail(g, 4, 'Robo'); MV.sys.people.marryKid(g, kid);
  const v = MV.EV.view(g); const res = MV.EV.choose(g, v.choices[0].i);
  assert.ok(!/está preso\?/.test(res.msg) && /presa/.test(res.msg), res.msg);
  // Otra nieta
  const h = MV.newGame({ seed: 6 }); h.p.age = 70; h.p.counters.nietos = 3;
  const k2 = MV.newNPC(h, { age: 35 }); MV.addRel(h, k2, 'hijo', 80); k2.married = true;
  let sawGirl = false;
  for (let i = 0; i < 20; i++) { h.queue = []; const gc = MV.sys.people.grandchild(h, k2); const t = h.queue[0].info.title; if (gc.gender === 'f') { sawGirl = true; assert.equal(t, 'Otra nieta'); } else assert.equal(t, 'Otro nieto'); }
  assert.ok(sawGirl);
  // Obras: "del libro" y "La compraron" para una canción
  assert.ok(MV.WORK_KINDS.libro.noun === 'el libro' && MV.sys.works.titleHint('libro') === 'Título del libro');
  assert.equal(MV.sys.works.titleHint('cancion'), 'Título de la canción');
  for (let i = 0; i < 60; i++) {
    const w = MV.newGame({ seed: 70 + i }); w.p.age = 30; w.p.skills.musica = 0; w.p.stats.smarts = 0;
    const msg = MV.sys.works.create(w, 'cancion', 'Prueba', null);
    assert.ok(!/Lo compraron/.test(msg), msg);
  }
});

test('R5: un escritor promedio tiene chances reales de un best seller', () => {
  const MV = load({ seed: 5 });
  let lives = 0;
  for (let i = 0; i < 60; i++) {
    const g = MV.newGame({ seed: 500 + i }); g.p.age = 20; g.p.skills.arte = 35; g.p.stats.smarts = 50; g.p.fame = 0;
    for (let y = 0; y < 40; y++) MV.sys.works.create(g, 'libro', 'Libro ' + y, null);
    if (g.p.works.some((w) => w.hit)) lives++;
  }
  assert.ok(lives >= 30, 'vidas con éxito: ' + lives + '/60');
});

test('R6: el desplome cripto nunca anota una pérdida mayor a lo invertido', () => {
  const MV = load({ seed: 6 });
  for (let i = 0; i < 200; i++) {
    const g = MV.newGame({ seed: 600 + i }); g.p.age = 40; g.p.money = 1e6; g.p.inv.cripto = 100000;
    g.world = { age: g.p.age, id: 'desplome_cripto', past: [] };
    g.log.push({ age: 40, year: g.year, items: [] });
    MV.sys.money.yearly(g);
    const line = g.log[g.log.length - 1].items.map((x) => x.t).find((t) => /Criptomonedas/.test(t)) || '';
    const m = line.match(/\((-?\d+)%\)/);
    if (m) assert.ok(+m[1] >= -100, line);
    assert.ok(!/perdiste \$1\d{2}\./.test(line) || /100\.000/.test(line), line);
  }
});

test('R7: ganar la presidencia a los 49 cumple el desafío', () => {
  const MV = load({ seed: 7 });
  const g = MV.newGame({ seed: 7, challenge: 'presidente_50' }); g.p.age = 49; g.p.edu.done = ['primaria', 'secundaria'];
  MV.sys.career.hire(g, MV.jobById('politico'), 3);
  g.p.job.lvlYears = 5; g.p.job.perf = 100;
  MV.sys.career.promote(g);
  assert.equal(g.p.job.level, 4);
  g.p.age = 50; g.p.job = null; // al año siguiente ya no es presidente (perdió la reelección)
  MV.sys.challenge.yearly(g);
  assert.equal(MV.sys.challenge.status(g).done, true);
});

test('R8: el cambio de trabajo de un hijo no dice "trabaja de desempleado"', () => {
  const MV = load({ seed: 8 });
  for (let i = 0; i < 80; i++) {
    const g = MV.newGame({ seed: 800 + i }); g.p.age = 60;
    const kid = MV.newNPC(g, { age: 33 }); MV.addRel(g, kid, 'hijo', 80); kid.married = true;
    g.log.push({ age: 60, year: g.year, items: [] });
    for (let y = 0; y < 30; y++) { MV.sys.people.familyLife(g); g.queue = []; }
    g.log[g.log.length - 1].items.forEach((it) => assert.ok(!/trabaja de (desemplead|am[oa] de casa)/i.test(it.t), it.t));
  }
});

test('R9: los eventos viejos concuerdan con nietos y trucos reales', () => {
  const MV = load({ seed: 9 });
  const g = MV.newGame({ seed: 9 }); g.p.age = 75;
  assert.equal(MV.EV.eligible(g, MV.EV.byId.memorias), null, 'memorias sin nietos');
  const pet = MV.newPet(g, 'perro', { age: 4 }); MV.addRel(g, pet, 'mascota', 80);
  g.queue = []; MV.EV.fire(g, MV.EV.byId.mascota_truco, { target: pet.id });
  assert.ok((pet.tricks || []).length === 1, 'el truco no quedó guardado');
});

test('R10: un menor que regala un cachorro a sus padres trae el perro a casa', () => {
  const MV = load({ seed: 10 });
  const g = MV.newGame({ seed: 10 }); g.p.age = 14; g.p.money = 1000;
  const mom = MV.rels(g, 'padre')[0].n; mom.traits = ['amable'];
  const before = MV.rels(g, 'mascota').length;
  MV.sys.rels.giveGift(g, mom.id, 'cachorro');
  assert.equal(MV.rels(g, 'mascota').length, before + 1);
});
