/* Correcciones de la revisión de la Parte A: cada prueba reproduce un hallazgo. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

test('R1: un menor que es único heredero recibe la casa y el resto en dinero, sin quedar en bancarrota', () => {
  const MV = load({ seed: 1 });
  const g = MV.newGame({ seed: 1 }); g.p.age = 45; g.p.money = 2000000; g.p.loans = [];
  const kid = MV.newNPC(g, { age: 9, last: g.p.last }); MV.addRel(g, kid, 'hijo', 90);
  g.p.assets.push({ id: 'h1', type: 'casa', kind: 'Casa familiar', icon: '🏡', name: 'Casa familiar', value: 300000, cond: 90, upgrades: [] });
  g.p.home = 'h1'; g.p.housing = 'propia';
  g.p.assets.push({ id: 'p1', type: 'lujo', kind: 'Avión privado', icon: '🛩️', name: 'Avión privado', value: 30000000, cond: 100 });
  g.p.assets.push({ id: 'y1', type: 'lujo', kind: 'Yate', icon: '🛥️', name: 'Yate', value: 8000000, cond: 100 });
  MV.sys.legacy.die(g, 'una prueba');
  const ng = MV.sys.legacy.continueAs(g, kid.id);
  assert.deepEqual(ng.p.assets.map((a) => a.kind), ['Casa familiar']);
  assert.ok(ng.p.money > 30000000, 'efectivo: ' + ng.p.money);
});

test('R2a: hacerse profesional cierra los clubes deportivos y retirarse no los trae de vuelta', () => {
  const MV = load({ seed: 2 });
  const g = MV.newGame({ seed: 2 }); g.p.age = 17; g.p.edu.done = ['primaria', 'secundaria']; g.p.money = 100000;
  MV.sys.edu.joinClub(g, 'sport:tenis'); MV.sys.edu.joinClub(g, 'sport:futbol'); MV.sys.edu.joinClub(g, 'robotica');
  MV.sys.sports.sign(g, MV.sys.sports.makeOffer(g, 'esports', 0));
  assert.deepEqual(g.p.clubs, ['robotica']);
  MV.sys.edu.clubsYearly(g); MV.sys.sports.yearly(g);
  assert.equal(g.p.club, 'esports');
  MV.sys.sports.retire(g, 'Prueba.');
  MV.sys.edu.clubsYearly(g); MV.sys.sports.yearly(g);
  assert.equal(g.p.club, null);
  assert.ok(!g.p.clubs.some((c) => c.startsWith('sport:')));
});

test('R2b: la beca deportiva te deja entrenando en ese deporte', () => {
  const MV = load({ seed: 3 });
  const g = MV.newGame({ seed: 3 }); g.p.age = 18; g.p.edu.done = ['primaria', 'secundaria']; g.p.stats.smarts = 80;
  g.p.clubs = []; g.p.club = null; g.p.flags.becaOfrecida = 'tenis';
  g.queue = []; MV.EV.push(g, 'elegir_carrera', {}, true);
  let v = MV.EV.view(g); MV.EV.choose(g, v.choices[0].i);
  v = MV.EV.view(g);
  const beca = v.choices.find((c) => /Beca deportiva/.test(c.label));
  assert.ok(beca, v.choices.map((c) => c.label).join(' | '));
  MV.EV.choose(g, beca.i);
  assert.ok(g.p.clubs.includes('sport:tenis'));
  const e0 = MV.sys.sports.exp(g.p, 'tenis');
  MV.sys.edu.clubsYearly(g); MV.sys.sports.yearly(g);
  assert.equal(MV.sys.sports.exp(g.p, 'tenis'), e0 + 1);
});

test('R3: la rotonda gira en sentido antihorario (se circula por la derecha)', () => {
  const MV = load();
  assert.match(MV.UI.signSVG('rotonda'), /A26 26 0 1 0 /);
});

test('R4: textos con concordancia y artículos', () => {
  const MV = load({ seed: 4 });
  const g = MV.newGame({ seed: 4, gender: 'f' }); g.p.age = 25; g.p.money = 1e7;
  for (let i = 0; i < 10; i++) assert.ok(!/Lo miraste|tocarlo/.test(MV.sys.music.buy(g, 'criolla')));
  const fam = [];
  for (let i = 0; i < 40; i++) { const h = MV.newGame({ seed: 40 + i, gender: 'f' }); h.p.age = 30; h.p.money = 1e6; h.p.licenses = { auto: true, avion: true };
    const a = { id: 'v', type: 'lujo', kind: 'Avión privado', icon: '🛩️', name: 'Avión privado', value: 1e6, cond: 100 }; h.p.assets.push(a);
    fam.push(MV.doAction(h, MV.sys.vehicles.actions(h, a)[0], 'paris').msg); }
  assert.ok(fam.every((m) => !/eras famoso/.test(m)));
  const r = MV.EV.byId.representante.choices[1];
  const hh = MV.newGame({ seed: 5, gender: 'f' }); hh.p.age = 25; hh.queue = []; MV.EV.push(hh, 'representante', {}, true);
  assert.ok(!/este es de los que/.test(MV.EV.choose(hh, 1).msg) || r === null);
  const st = MV.newGame({ seed: 6, gender: 'f' }); st.p.age = 14; st.p.edu.stage = 'secundaria'; st.log.push({ age: 14, year: st.year, items: [] });
  const msgs = [MV.sys.edu.joinClub(st, 'robotica'), MV.sys.edu.joinClub(st, 'robotica'), MV.sys.edu.joinClub(st, 'banda')];
  st.p.edu.stage = null; MV.sys.edu.clubsYearly(st);
  msgs.push(...st.log[st.log.length - 1].items.map((x) => x.t));
  msgs.forEach((m) => assert.ok(!/\b(en|a|terminó) (club|taller|banda) de/i.test(m) && !/el más entusiasta/.test(m), m));
});

test('R5: mejorar la isla al nivel N cuesta inversión × 0,6 × N', () => {
  const MV = load({ seed: 7 });
  const g = MV.newGame({ seed: 7 }); g.p.age = 40; g.p.money = 1e9;
  const a = { id: 'i', type: 'lujo', kind: 'Isla privada', icon: '🏝️', name: 'Isla', value: 2e7, cond: 100 }; g.p.assets.push(a);
  MV.sys.island.develop(g, 'i', 'resort', 'Coral');
  assert.equal(MV.sys.island.upgradeCost(a), 5e6 * 0.6 * 2);
});

test('R6: piloto de helicóptero no pide secundaria', () => {
  const MV = load({ seed: 8 });
  const g = MV.newGame({ seed: 8 }); g.p.age = 21; g.p.edu.done = ['primaria']; g.p.licenses = { auto: true, helicoptero: true };
  assert.equal(MV.sys.career.meets(g, MV.jobById('piloto_heli')).ok, true);
});

test('R7: intentar entrar a un cuarto club o a uno repetido no gasta el intento', () => {
  const MV = load({ seed: 9 });
  const g = MV.newGame({ seed: 9 }); g.p.age = 14; g.p.edu.stage = 'secundaria'; g.p.edu.done = ['primaria'];
  const club = () => MV.sys.edu.actions(g).find((a) => a.id === 'club');
  MV.doAction(g, club(), 'robotica');
  const left = MV.usesLeft(g, club());
  const res = MV.doAction(g, club(), 'robotica');
  assert.ok(res.blocked); assert.equal(MV.usesLeft(g, club()), left);
  MV.sys.edu.joinClub(g, 'teatro'); MV.sys.edu.joinClub(g, 'cocina');
  const left2 = MV.usesLeft(g, club());
  assert.ok(MV.doAction(g, club(), 'ajedrez').blocked);
  assert.equal(MV.usesLeft(g, club()), left2);
  const adult = MV.newGame({ seed: 10 }); adult.p.age = 30; adult.p.money = 1e5;
  ['sport:futbol', 'sport:tenis', 'sport:golf'].forEach((id) => MV.sys.edu.joinClub(adult, id));
  const cd = MV.ACTS.find((a) => a.id === 'club_deporte');
  assert.ok(MV.doAction(adult, cd, 'boxeo').blocked);
  assert.equal(MV.usesLeft(adult, cd), 1);
});

test('R8: se pueden ver las licencias que tienes', () => {
  const MV = load({ seed: 11 });
  const g = MV.newGame({ seed: 11 }); g.p.license = true; g.p.licenses = { auto: true, yate: true };
  assert.deepEqual(MV.sys.license.held(g), ['Licencia de conducir', 'Licencia de yate']);
});
