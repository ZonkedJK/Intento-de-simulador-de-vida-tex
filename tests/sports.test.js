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
    if (i % 4 === 0) { // perfil deportivo: club desde chico y talento natural
      const sp = MV.COUNTRIES[g.p.country].sport;
      g.p.club = sp; g.p.talent[sp] = 15; g.p.skills.deporte = 60; g.p.skills.programacion = 60;
    }
    live(MV, g, { acts: 4 });
    if (g.p.flags.exAtleta) pros++;
  }
  assert.ok(pros >= 1, 'ninguna vida llegó al deporte profesional');
});

function athlete(MV, sport, rating, seed) {
  const g = MV.newGame({ seed: seed || 1 });
  const p = g.p;
  p.age = 19; p.edu.done = ['primaria', 'secundaria'];
  MV.sys.sports.sign(g, MV.sys.sports.makeOffer(g, sport, 0));
  if (rating === 'alto') { p.skills.deporte = 100; p.skills.programacion = 100; p.stats.smarts = 100; p.stats.health = 100; p.talent[sport] = 15; p.sportsExp[sport] = 10; }
  else { p.skills.deporte = 10; p.stats.health = 50; p.talent[sport] = -12; p.sportsExp[sport] = 1; }
  return g;
}

test('buscar equipo con nivel alto ofrece la categoría superior; con nivel bajo, solo la misma', () => {
  const MV = load({ seed: 40 });
  let up = 0;
  for (let i = 0; i < 20; i++) {
    const g = athlete(MV, 'futbol', 'alto', 700 + i);
    const offers = MV.sys.sports.teamOffers(g);
    assert.ok(offers.length >= 3 && offers.length <= 4);
    if (offers.some((o) => o.level === g.p.job.level + 1)) up++;
    const low = athlete(MV, 'futbol', 'bajo', 800 + i);
    assert.ok(MV.sys.sports.teamOffers(low).every((o) => o.level === low.p.job.level), 'nivel bajo no debería subir');
  }
  assert.ok(up >= 15, 'ofertas de categoría superior: ' + up);
});

test('aceptar una oferta cambia de equipo, categoría y sueldo', () => {
  const MV = load({ seed: 41 });
  const g = athlete(MV, 'basquet', 'alto', 5);
  const best = MV.sys.sports.teamOffers(g).sort((a, b) => b.level - a.level || b.salary - a.salary)[0];
  const msg = MV.sys.sports.joinTeam(g, best);
  assert.equal(g.p.job.club, best.club);
  assert.equal(g.p.job.level, best.level);
  assert.ok(g.p.job.salary >= best.salary);
  assert.match(msg, new RegExp(best.club));
});

test('un piloto puede llegar a campeón de la Fórmula Mundial buscando escuderías', () => {
  const MV = load({ seed: 42 });
  const g = athlete(MV, 'automovilismo', 'alto', 9);
  const top = MV.SPORTS.automovilismo.titles.length - 1;
  for (let season = 0; season < 12 && g.p.job.level < top; season++) {
    const best = MV.sys.sports.teamOffers(g).sort((a, b) => b.level - a.level)[0];
    MV.sys.sports.joinTeam(g, best);
    g.p.age++;
  }
  assert.equal(g.p.job.level, top);
  assert.match(MV.sys.career.title(g.p), /Campe(ón|ona) de la Fórmula Mundial/);
});

test('lesionado solo recibe ofertas de su categoría', () => {
  const MV = load({ seed: 43 });
  const g = athlete(MV, 'tenis', 'alto', 3);
  MV.sys.health.add(g, 'lesion');
  assert.ok(MV.sys.sports.teamOffers(g).every((o) => o.level === g.p.job.level));
});

test('un exprofesional de 34 años puede volver; alguien sin pasado profesional no', () => {
  const MV = load({ seed: 44 });
  const g = athlete(MV, 'futbol', 'alto', 4);
  MV.sys.sports.retire(g, 'Prueba de retiro.');
  g.p.age = 34; g.queue = [];
  assert.equal(MV.sys.sports.canTryout(g, 'futbol').ok, true);
  assert.equal(MV.sys.sports.tryout(g, 'futbol'), '');
  const g2 = MV.newGame({ seed: 5 }); g2.p.age = 34; g2.p.edu.done = ['primaria', 'secundaria'];
  assert.equal(MV.sys.sports.canTryout(g2, 'futbol').ok, false);
});
