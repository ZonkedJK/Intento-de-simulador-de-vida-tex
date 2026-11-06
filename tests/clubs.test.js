/* Hasta 3 clubes o talleres a la vez, mezclando deportes y talleres. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

function student(MV, seed, age) {
  const g = MV.newGame({ seed }); g.p.age = age || 14; g.p.money = 50000;
  g.p.edu.done = ['primaria']; g.p.edu.stage = 'secundaria'; g.p.edu.year = 2;
  g.log.push({ age: g.p.age, year: g.year, items: [] });
  return g;
}
const E = (MV) => MV.sys.edu;

test('se puede estar en 3 clubes y el cuarto pide dejar uno', () => {
  const MV = load({ seed: 1 });
  const g = student(MV, 1);
  E(MV).joinClub(g, 'sport:futbol'); E(MV).joinClub(g, 'sport:basquet'); E(MV).joinClub(g, 'robotica');
  assert.deepEqual(g.p.clubs, ['sport:futbol', 'sport:basquet', 'robotica']);
  assert.match(E(MV).joinClub(g, 'ajedrez'), /dej/i);
  assert.equal(g.p.clubs.length, 3);
  assert.match(E(MV).joinClub(g, 'robotica'), /Ya /);
  E(MV).leaveClub(g, 'sport:basquet');
  assert.deepEqual(g.p.clubs, ['sport:futbol', 'robotica']);
  assert.equal(g.p.club, 'futbol', 'el deporte principal sigue siendo un club en el que estás');
  const act = E(MV).actions(g).find((a) => a.id === 'club');
  assert.ok(act.limit >= 3, 'se pueden sumar varios en un año');
  const leave = E(MV).actions(g).find((a) => a.id === 'dejar_club');
  assert.deepEqual(leave.opts(g).map((o) => o.id), ['sport:futbol', 'robotica']);
});

test('cada deporte suma sus años de práctica cada año', () => {
  const MV = load({ seed: 2 });
  const g = student(MV, 2);
  E(MV).joinClub(g, 'sport:futbol'); E(MV).joinClub(g, 'sport:tenis');
  const f0 = MV.sys.sports.exp(g.p, 'futbol'), t0 = MV.sys.sports.exp(g.p, 'tenis');
  MV.sys.sports.yearly(g);
  assert.equal(MV.sys.sports.exp(g.p, 'futbol'), f0 + 1);
  assert.equal(MV.sys.sports.exp(g.p, 'tenis'), t0 + 1);
});

test('cada taller sube su habilidad cada año mientras estudias', () => {
  const MV = load({ seed: 3 });
  const g = student(MV, 3);
  E(MV).joinClub(g, 'robotica'); E(MV).joinClub(g, 'cocina');
  const p0 = g.p.skills.programacion, c0 = g.p.skills.cocina;
  E(MV).clubsYearly(g);
  assert.ok(g.p.skills.programacion > p0 && g.p.skills.cocina > c0);
});

test('los talleres terminan al dejar de estudiar y los deportes siguen', () => {
  const MV = load({ seed: 4 });
  const g = student(MV, 4, 18);
  E(MV).joinClub(g, 'sport:voley'); E(MV).joinClub(g, 'teatro');
  g.p.edu.stage = null; g.p.edu.done.push('secundaria');
  E(MV).clubsYearly(g);
  assert.deepEqual(g.p.clubs, ['sport:voley']);
});

test('el cazatalentos mira tu mejor deporte', () => {
  const MV = load({ seed: 5 });
  let seen = 0;
  for (let i = 0; i < 40; i++) {
    const g = student(MV, 500 + i, 17);
    E(MV).joinClub(g, 'sport:futbol'); E(MV).joinClub(g, 'sport:tenis');
    g.p.sportsExp.futbol = 0; g.p.sportsExp.tenis = 8; g.p.talent.tenis = 15; g.p.talent.futbol = -15;
    g.p.skills.deporte = 90; g.p.stats.health = 100;
    const offer = MV.sys.sports.scoutAtGraduation(g);
    if (offer) { seen++; assert.equal(offer.sport, 'tenis'); }
  }
  assert.ok(seen > 10, 'ofertas: ' + seen);
});

test('una partida con p.club se pasa a p.clubs', () => {
  const MV = load({ seed: 6 });
  const g = student(MV, 6); g.p.club = 'boxeo'; delete g.p.clubs;
  assert.deepEqual(E(MV).clubsOf(g.p), ['sport:boxeo']);
});
