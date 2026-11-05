/* Correcciones de la revisión final: cada prueba reproduce un hallazgo. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

function rich() { const strokes = []; for (let i = 0; i < 8; i++) { const pts = []; for (let x = 10; x <= 60; x += 2) pts.push(x, 20 + i * 6); strokes.push({ c: i % 3, w: 2, pts }); } return { strokes, texts: [] }; }

test('F1: las acciones de relación con costo no aparecen sin dinero', () => {
  const MV = load();
  const g = MV.newGame({ seed: 1 }); g.p.age = 40; g.p.money = 0;
  const n = MV.newNPC(g, { age: 40, money: 0 }); const r = MV.addRel(g, n, 'conyuge', 60); r.since = 20;
  const ids = MV.sys.rels.actions(g, r, n).map((a) => a.id);
  ['sorpresa', 'votos', 'comer_afuera', 'prestar'].forEach((id) => assert.ok(!ids.includes(id), id + ' no debería aparecer con $0'));
});

test('F3: un dibujo vacío no gasta el tatuaje del año', () => {
  const MV = load();
  const g = MV.newGame({ seed: 2 }); g.p.age = 25; g.p.money = 10000;
  const a = MV.ACTS.find((x) => x.id === 'tatuaje');
  MV.doAction(g, a, { design: { strokes: [], texts: [] }, artist: 'estudio', place: 'brazo' });
  assert.equal(MV.usesLeft(g, a), 1);
  MV.doAction(g, a, { design: rich(), artist: 'estudio', place: 'brazo' });
  assert.equal(g.p.tattoos.length, 1);
});

test('F4: viajar solo al espacio siempre da el logro de astronauta', () => {
  const MV = load({ seed: 3 });
  const a = MV.ACTS.find((x) => x.id === 'vacaciones');
  for (let i = 0; i < 60; i++) {
    const g = MV.newGame({ seed: 50 + i }); g.p.age = 30; g.p.money = 1e6;
    const res = MV.doAction(g, a, 'espacio', undefined, 'solo');
    assert.ok(g.achLife.includes('astronauta'), 'sin logro: ' + res.msg);
  }
});

test('F5: regatear y reintentar no supera lo que el comprador paga en el año', () => {
  const MV = load({ seed: 4 });
  for (let i = 0; i < 80; i++) {
    const g = MV.newGame({ seed: 300 + i }); g.p.age = 35; g.p.money = 0;
    const a = { id: 'c1', type: 'casa', kind: 'Casa familiar', icon: '🏡', name: 'Casa', value: 300000, cond: 100, upgrades: [] };
    g.p.assets.push(a);
    for (let k = 0; k < 6 && g.p.assets.length; k++) {
      g.queue = [];
      MV.sys.money.sellAt(g, 'c1', 0.5);
      const it = g.queue.find((q) => q.id === 'contraoferta');
      if (!it) break;
      const v = MV.EV.view(g);
      MV.EV.choose(g, v.choices.find((c) => /Proponer/.test(c.label)).i);
    }
    if (!g.p.assets.length) assert.ok(a.market && g.p.money <= a.market.willing + 1, 'vida ' + i + ': vendió en ' + g.p.money + ' y el comprador pagaba ' + Math.round(a.market.willing));
  }
});

test('F6: buscar equipo lesionado lo explica y no repite clubes', () => {
  const MV = load({ seed: 5 });
  const g = MV.newGame({ seed: 7 }); g.p.age = 20; g.p.edu.done = ['primaria', 'secundaria'];
  MV.sys.sports.sign(g, MV.sys.sports.makeOffer(g, 'tenis', 0));
  g.p.skills.deporte = 100; g.p.stats.health = 100; g.p.talent.tenis = 15; g.p.sportsExp.tenis = 10;
  MV.sys.health.add(g, 'lesion');
  const offers = MV.sys.sports.teamOffers(g);
  assert.equal(new Set(offers.map((o) => o.club)).size, offers.length, 'clubes repetidos');
  const act = MV.sys.sports.actions(g).find((x) => x.id === 'buscar_equipo');
  const subs = act.opts(g).map((o) => o.label + ' ' + o.sub).join(' ');
  assert.match(subs, /lesi/i, 'falta la explicación de la lesión');
  assert.ok(act.opts(g).every((o) => /^[A-ZÁÉÍÓÚÑ]/.test(o.label)), 'las etiquetas deben empezar en mayúscula');
});

test('F7: tapar un tatuaje lo hace en el mismo lugar y recalcula la cara', () => {
  const MV = load({ seed: 6 });
  const g = MV.newGame({ seed: 8 }); g.p.age = 25; g.p.money = 1e5;
  MV.sys.tattoo.apply(g, rich(), 'estudio', 'cara');
  const id = g.p.tattoos[0].id;
  MV.sys.tattoo.apply(g, rich(), 'estudio', 'brazo', { cover: id });
  assert.equal(g.p.tattoos.length, 1);
  assert.equal(g.p.tattoos[0].place, 'cara', 'el diseño nuevo tapa en el mismo lugar');
  MV.sys.tattoo.laser(g, g.p.tattoos[0].id);
  assert.ok(!g.p.flags.tatuajeCara, 'sin tatuajes en la cara no hay penalización');
});

test('F8: el evento del nombre tatuado no aparece si tu cónyuge murió', () => {
  const MV = load({ seed: 7 });
  const g = MV.newGame({ seed: 9 }); g.p.age = 50; g.p.money = 1e5;
  const sp = MV.sys.rels.candidate(g); MV.addRel(g, sp, 'conyuge', 70);
  const d = rich(); d.texts.push({ t: sp.first, x: 40, y: 80, c: 1 });
  MV.sys.tattoo.apply(g, d, 'estudio', 'brazo');
  MV.sys.people.die(g, sp, 'causas naturales');
  assert.equal(MV.EV.eligible(g, MV.EV.byId.tatuaje_ex), null);
});

test('F9: un exdeportista de una partida v2 puede volver del retiro', () => {
  const MV = load({ seed: 8 });
  const g = MV.newGame({ seed: 10 });
  g.version = 2; g.p.age = 30; g.p.edu.done = ['primaria', 'secundaria'];
  g.p.flags.exAtleta = 'automovilismo'; delete g.p.flags.proSports;
  MV.store.set('milvidas.partida', g);
  const back = MV.loadGame();
  assert.equal(MV.sys.sports.canTryout(back, 'automovilismo').ok, true);
});

test('F10: los textos de viaje concuerdan con el género', () => {
  const MV = load({ seed: 9 });
  const g = MV.newGame({ seed: 11, gender: 'f' }); g.p.age = 30; g.p.money = 1e6;
  const a = MV.ACTS.find((x) => x.id === 'vacaciones');
  assert.match(a.opts2(g, 'paris')[0].label, /Ir sola/);
  for (let i = 0; i < 20; i++) { g.p.yearActs = {}; const m = MV.doAction(g, a, 'paris', undefined, 'solo').msg; assert.ok(!/Viajaste solo/.test(m), m); }
});

test('F11: buscar equipo cada año no infla el sueldo sin límite', () => {
  const MV = load({ seed: 10 });
  const g = MV.newGame({ seed: 12 }); g.p.age = 20; g.p.edu.done = ['primaria', 'secundaria'];
  MV.sys.sports.sign(g, MV.sys.sports.makeOffer(g, 'futbol', 1));
  g.p.skills.deporte = 10; g.p.talent.futbol = -12;
  for (let y = 0; y < 30; y++) { const o = MV.sys.sports.teamOffers(g).sort((a, b) => b.salary - a.salary)[0]; MV.sys.sports.joinTeam(g, o); g.p.age++; }
  assert.ok(g.p.job.salary <= MV.SPORTS.futbol.pay[g.p.job.level] * 2, 'sueldo ' + g.p.job.salary);
});

test('F9b: una partida ya migrada a v3 sin historial deportivo también puede volver del retiro', () => {
  const MV = load({ seed: 11 });
  const g = MV.newGame({ seed: 13 }); g.p.age = 30; g.p.edu.done = ['primaria', 'secundaria'];
  g.p.flags.exAtleta = 'automovilismo'; delete g.p.flags.proSports;
  assert.equal(MV.sys.sports.canTryout(g, 'automovilismo').ok, true);
  assert.equal(MV.sys.sports.canTryout(g, 'futbol').ok, false, 'solo el deporte en el que fue profesional');
});
