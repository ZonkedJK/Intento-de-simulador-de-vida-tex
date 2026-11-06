/* Instrumentos: tienda de música, práctica, tocar en la calle o en un bar, y carrera de músico. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

function musician(MV, seed, musica, age) {
  const g = MV.newGame({ seed }); g.p.age = age || 22; g.p.money = 100000; g.p.skills.musica = musica || 0;
  g.log.push({ age: g.p.age, year: g.year, items: [] });
  return g;
}
const instr = (g) => g.p.assets.find((a) => a.type === 'instrumento');
const act = (MV, g, a, id) => MV.sys.music.actions(g, a).find((x) => x.id === id);

test('la tienda tiene 10 instrumentos con los precios del diseño', () => {
  const MV = load();
  assert.equal(MV.INSTRUMENTS.length, 10);
  const price = Object.fromEntries(MV.INSTRUMENTS.map((i) => [i.name, i.price]));
  assert.deepEqual([price['Guitarra criolla'], price['Guitarra eléctrica'], price['Bajo'], price['Teclado'], price['Violín'], price['Saxofón'], price['Batería'], price['Equipo de DJ'], price['Piano de cola'], price['Micrófono profesional']],
    [150, 900, 700, 400, 600, 1200, 1500, 2000, 25000, 300]);
  MV.INSTRUMENTS.forEach((i) => assert.ok(i.quality >= 1 && i.quality <= 3, i.id));
});

test('comprar un instrumento cobra y lo deja en tus bienes; sin dinero no se compra', () => {
  const MV = load({ seed: 1 });
  const g = musician(MV, 1);
  MV.sys.music.buy(g, 'electrica');
  assert.equal(g.p.money, 100000 - 900);
  assert.equal(instr(g).name, 'Guitarra eléctrica');
  assert.equal(MV.sys.music.best(g.p), 2);
  g.p.money = 100;
  assert.match(MV.sys.music.buy(g, 'piano'), /alcanza/);
  assert.equal(g.p.assets.filter((a) => a.type === 'instrumento').length, 1);
});

test('practicar con instrumento sube más Música que practicar sin él', () => {
  const MV = load({ seed: 2 });
  let withI = 0, without = 0;
  for (let i = 0; i < 100; i++) {
    const g = musician(MV, 100 + i, 10); MV.sys.music.buy(g, 'piano');
    MV.doAction(g, act(MV, g, instr(g), 'practicar_inst')); withI += g.p.skills.musica - 10;
    const h = musician(MV, 100 + i, 10);
    MV.doAction(h, MV.ACTS.find((a) => a.id === 'practicar'), 'musica'); without += h.p.skills.musica - 10;
  }
  assert.ok(withI > without * 1.5, `${withI} vs ${without}`);
});

test('tocar en un bar pide Música 30 y 16 años', () => {
  const MV = load({ seed: 3 });
  const g = musician(MV, 3, 25); MV.sys.music.buy(g, 'criolla');
  assert.ok(!act(MV, g, instr(g), 'tocar_bar'));
  assert.ok(act(MV, g, instr(g), 'tocar_calle'));
  g.p.skills.musica = 30;
  assert.ok(act(MV, g, instr(g), 'tocar_bar'));
  g.p.age = 15;
  assert.ok(!act(MV, g, instr(g), 'tocar_bar'));
  g.p.age = 22;
  const m0 = g.p.money; MV.doAction(g, act(MV, g, instr(g), 'tocar_bar'));
  assert.ok(g.p.money > m0);
});

test('el representante ofrece un contrato en la carrera musical', () => {
  const MV = load({ seed: 4 });
  const g = musician(MV, 4, 70); MV.sys.music.buy(g, 'electrica');
  g.queue = []; MV.EV.push(g, 'representante', {}, true);
  const v = MV.EV.view(g);
  MV.EV.choose(g, v.choices.find((c) => /Firmar/.test(c.label)).i);
  assert.equal(g.p.job.id, 'musico');
  assert.equal(g.p.job.level, 2);
  let offers = 0;
  for (let i = 0; i < 200; i++) {
    const h = musician(MV, 400 + i, 60); MV.sys.music.buy(h, 'electrica'); h.queue = [];
    MV.doAction(h, act(MV, h, instr(h), 'tocar_bar'));
    if (h.queue.some((q) => q.id === 'representante')) offers++;
  }
  assert.ok(offers > 20 && offers < 160, 'ofertas: ' + offers);
});

test('un instrumento mejora las canciones y las audiciones de música', () => {
  const MV = load({ seed: 5 });
  let s0 = 0, s1 = 0, a0 = 0, a1 = 0;
  for (let i = 0; i < 200; i++) {
    const g = musician(MV, 500 + i, 40); MV.sys.works.create(g, 'cancion', 'X', 'rock'); s0 += g.p.works[0].stars;
    const h = musician(MV, 500 + i, 40); MV.sys.music.buy(h, 'piano'); MV.sys.works.create(h, 'cancion', 'X', 'rock'); s1 += h.p.works[0].stars;
    const k = musician(MV, 900 + i, 40); k.queue = []; MV.EV.push(k, 'audicion', { job: 'musico' }, true); MV.EV.choose(k, MV.EV.view(k).choices[0].i); if (k.p.job) a0++;
    const m = musician(MV, 900 + i, 40); MV.sys.music.buy(m, 'piano'); m.queue = []; MV.EV.push(m, 'audicion', { job: 'musico' }, true); MV.EV.choose(m, MV.EV.view(m).choices[0].i); if (m.p.job) a1++;
  }
  assert.ok(s1 > s0, `estrellas ${s0} vs ${s1}`);
  assert.ok(a1 > a0 + 10, `audiciones ${a0} vs ${a1}`);
});

test('en la cárcel no hay acciones y el instrumento pierde un poco de valor cada año', () => {
  const MV = load({ seed: 6 });
  const g = musician(MV, 6, 40); MV.sys.music.buy(g, 'saxo');
  MV.sys.money.yearly(g);
  assert.ok(instr(g).value < 1200 && instr(g).value > 900);
  MV.sys.crime.jail(g, 2, 'Robo');
  assert.equal(MV.sys.music.actions(g, instr(g)).length, 0);
});
