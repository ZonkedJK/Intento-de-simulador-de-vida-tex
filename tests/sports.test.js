/* Países nuevos, deportes profesionales, reclutamiento y migración de partidas viejas. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');
const { resolveQueue, live } = require('./agent');

test('hay 28 países con región, deporte popular y nombres', () => {
  const MV = load();
  const C = MV.COUNTRIES;
  assert.equal(Object.keys(C).length, 28);
  const count = (r) => Object.values(C).filter((c) => c.region === r).length;
  assert.ok(count('Europa') >= 10 && count('Asia') >= 9, 'faltan países de Europa o Asia');
  Object.entries(C).forEach(([k, c]) => {
    assert.ok(MV.REGIONS.includes(c.region), 'región inválida en ' + k);
    assert.ok(MV.SPORTS[c.sport], 'deporte popular inválido en ' + k);
  });
  // se puede nacer en cada país
  Object.keys(C).forEach((k, i) => {
    const g = MV.newGame({ country: k, seed: 50 + i });
    assert.equal(g.p.country, k);
    assert.ok(g.p.first && g.p.last && C[k].cities.includes(g.p.city));
  });
});

test('los deportes están bien definidos y pagan mucho en la cima', () => {
  const MV = load();
  assert.ok(Object.keys(MV.SPORTS).length >= 11);
  ['futbol', 'basquet', 'tenis', 'voley'].forEach((k) => assert.ok(MV.SPORTS[k], 'falta ' + k));
  Object.entries(MV.SPORTS).forEach(([k, S]) => {
    assert.equal(S.titles.length, S.pay.length, 'títulos y sueldos no coinciden en ' + k);
    assert.ok(S.clubs.length >= 3 && S.trophies.length >= 2, 'faltan clubes o trofeos en ' + k);
    assert.ok(S.start[0] <= S.start[1] && S.retire[0] <= S.retire[1], 'edades inválidas en ' + k);
    const J = MV.jobById('sport_' + k);
    assert.ok(J && J.type === 'sport' && J.sport === k);
  });
  const top = Math.max(...Object.values(MV.SPORTS).map((S) => S.pay[S.pay.length - 1]));
  assert.ok(top >= 20000000, 'el deporte mejor pagado debería superar los $20 millones');
});

test('un juvenil con nivel alto recibe ofertas al terminar la secundaria', () => {
  const MV = load({ seed: 5 });
  let offers = 0;
  for (let i = 0; i < 60; i++) {
    const g = MV.newGame({ seed: 400 + i });
    const p = g.p;
    p.age = 17; p.edu.done = ['primaria']; p.edu.stage = 'secundaria'; p.edu.year = 5;
    p.club = 'futbol'; p.sportsExp = { futbol: 9 }; p.skills.deporte = 70; p.stats.health = 90;
    MV.sys.edu.graduate(g);
    const item = g.queue.find((q) => q.id === 'fin_secundaria');
    assert.ok(item, 'falta el evento de fin de secundaria');
    if (item.ctx.offer) {
      offers++;
      const v = MV.EV.view(g);
      const sign = v.choices.find((c) => /Firmar/.test(c.label));
      assert.ok(sign, 'falta la opción de firmar');
      MV.EV.choose(g, sign.i);
      assert.ok(MV.sys.sports.isPro(g.p) && g.p.job.id === 'sport_futbol');
      assert.ok(g.p.job.salary >= MV.SPORTS.futbol.pay[0]);
    }
  }
  assert.ok(offers >= 25, 'se esperaban ofertas frecuentes con nivel alto: ' + offers);
});

test('sin club ni nivel no hay cazatalentos', () => {
  const MV = load({ seed: 6 });
  for (let i = 0; i < 30; i++) {
    const g = MV.newGame({ seed: 900 + i });
    g.p.age = 17;
    assert.equal(MV.sys.sports.scoutAtGraduation(g), null);
  }
});

test('en la universidad aparecen reclutadores y se puede seguir estudiando', () => {
  const MV = load({ seed: 7 });
  let found = false;
  for (let i = 0; i < 40 && !found; i++) {
    const g = MV.newGame({ seed: 1500 + i });
    const p = g.p;
    p.age = 19; p.edu.done = ['primaria', 'secundaria']; MV.sys.edu.start(g, 'universidad', { major: 'educacion', payer: 'beca' });
    p.club = 'basquet'; p.sportsExp = { basquet: 8 }; p.skills.deporte = 80; p.stats.health = 95;
    for (let y = 0; y < 3 && !found; y++) {
      MV.sys.sports.yearly(g);
      const it = g.queue.find((q) => q.id === 'reclutamiento');
      if (it) {
        found = true;
        g.queue = [it];
        const v = MV.EV.view(g);
        assert.match(v.text, /draft/i);
        const keep = v.choices.find((c) => /seguir estudiando/.test(c.label));
        MV.EV.choose(g, keep.i);
        assert.ok(MV.sys.sports.isPro(g.p));
        assert.equal(g.p.edu.stage, 'universidad', 'debería seguir estudiando');
      }
    }
  }
  assert.ok(found, 'ningún reclutador apareció en la universidad');
});

test('una carrera profesional completa avanza, paga, sube habilidades y termina en retiro', () => {
  const MV = load({ seed: 8 });
  let maxLevel = 0, retired = 0, carismaUp = 0;
  for (let i = 0; i < 40; i++) {
    const g = MV.newGame({ seed: 2000 + i });
    const p = g.p;
    p.age = 19; p.edu.done = ['primaria', 'secundaria']; p.skills.deporte = 75; p.stats.health = 90;
    MV.sys.sports.sign(g, MV.sys.sports.makeOffer(g, MV.U.pick(Object.keys(MV.SPORTS)), 0));
    const c0 = p.skills.carisma;
    for (let y = 0; y < 30 && !g.over; y++) {
      resolveQueue(MV, g);
      MV.ageUp(g);
      if (p.job && p.job.type === 'sport') maxLevel = Math.max(maxLevel, p.job.level);
      if (!p.job && p.flags.exAtleta) { retired++; break; }
    }
    if (p.skills.carisma > c0) carismaUp++;
  }
  assert.ok(maxLevel >= 3, 'nadie llegó lejos en su carrera: nivel máximo ' + maxLevel);
  assert.ok(retired >= 20, 'pocas carreras terminaron en retiro: ' + retired);
  assert.ok(carismaUp >= 30, 'el deporte debería subir el carisma');
});

test('una partida de la versión 1 con "atleta" se migra al fútbol', () => {
  const MV = load({ seed: 9 });
  const g = MV.newGame({ seed: 3 });
  g.version = 1;
  delete g.p.club; delete g.p.sportsExp;
  g.p.age = 25;
  g.p.job = { id: 'atleta', level: 2, salary: 400000, perf: 60, years: 4, lvlYears: 1, type: 'fame', start: 21 };
  MV.store.set('milvidas.partida', g);
  const back = MV.loadGame();
  assert.ok(back, 'la partida vieja no se cargó');
  assert.equal(back.version, MV.VERSION);
  assert.equal(back.p.job.id, 'sport_futbol');
  assert.equal(back.p.job.type, 'sport');
  assert.ok(back.p.sportsExp && back.p.club === 'futbol');
  for (let y = 0; y < 10 && !back.over; y++) { resolveQueue(MV, back); MV.ageUp(back); }
});

test('vidas completas con el jugador automático siguen sin errores', () => {
  const MV = load({ seed: 10 });
  let pros = 0;
  for (let i = 0; i < 80; i++) {
    const g = MV.newGame({ seed: 6000 + i, country: MV.U.pick(['FR', 'KR', 'PH', 'TH', 'TR', 'GB', 'CN', 'IN']) });
    live(MV, g, { acts: 4 });
    if (g.p.flags.exAtleta) pros++;
  }
  assert.ok(pros >= 1, 'ninguna vida llegó al deporte profesional');
});
