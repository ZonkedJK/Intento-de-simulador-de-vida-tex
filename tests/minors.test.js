/* Detalles menores pendientes de la revisión anterior. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

function rich() { const strokes = []; for (let i = 0; i < 8; i++) { const pts = []; for (let x = 10; x <= 60; x += 2) pts.push(x, 20 + i * 6); strokes.push({ c: i % 3, w: 2, pts }); } return { strokes, texts: [] }; }

test('láser sin dinero no cobra ni borra', () => {
  const MV = load({ seed: 1 });
  const g = MV.newGame({ seed: 1 }); g.p.age = 25; g.p.money = 10000;
  MV.sys.tattoo.apply(g, rich(), 'estudio', 'brazo');
  g.p.money = 100;
  const msg = MV.sys.tattoo.laser(g, g.p.tattoos[0].id);
  assert.equal(g.p.tattoos.length, 1);
  assert.equal(g.p.money, 100);
  assert.match(msg, /alcanza/);
});

test('toda ruptura directa borra la convivencia', () => {
  const MV = load({ seed: 2 });
  // Huir del país ante un embarazo
  const g = MV.newGame({ seed: 2, gender: 'm' }); g.p.age = 30;
  const n = MV.sys.rels.candidate(g); MV.addRel(g, n, 'pareja', 70); g.p.flags.convive = n.id;
  g.queue = []; MV.EV.push(g, 'embarazo_sorpresa', { target: n.id }, true);
  const v = MV.EV.view(g); MV.EV.choose(g, v.choices.find((c) => /Huir/.test(c.label)).i);
  assert.equal(MV.relOf(g, n.id).type, 'ex');
  assert.ok(!g.p.flags.convive, 'huir dejó la convivencia');
  // Ir a prisión y que te dejen
  let left = 0;
  for (let i = 0; i < 40; i++) {
    const h = MV.newGame({ seed: 100 + i }); h.p.age = 30;
    const m = MV.sys.rels.candidate(h); MV.addRel(h, m, 'pareja', 20); h.p.flags.convive = m.id;
    MV.sys.crime.jail(h, 5, 'Robo');
    if (MV.relOf(h, m.id).type === 'ex') { left++; assert.ok(!h.p.flags.convive, 'la cárcel dejó la convivencia'); }
  }
  assert.ok(left > 0);
  // Te dejan por la mala relación
  let gone = 0;
  for (let i = 0; i < 60; i++) {
    const h = MV.newGame({ seed: 300 + i }); h.p.age = 30;
    const m = MV.sys.rels.candidate(h); MV.addRel(h, m, 'pareja', 5); h.p.flags.convive = m.id;
    MV.sys.rels.yearly(h);
    const r = MV.relOf(h, m.id);
    if (r && r.type === 'ex') { gone++; assert.ok(!h.p.flags.convive, 'que te dejen dejó la convivencia'); }
  }
  assert.ok(gone > 0);
});

test('regalar un cachorro a quien vive contigo trae un perro a casa', () => {
  const MV = load({ seed: 3 });
  const g = MV.newGame({ seed: 3 }); g.p.age = 30; g.p.money = 10000;
  const n = MV.sys.rels.candidate(g); MV.addRel(g, n, 'conyuge', 70);
  n.traits = ['amable'];
  const before = MV.rels(g, 'mascota').length;
  MV.sys.rels.giveGift(g, n.id, 'cachorro');
  const pets = MV.rels(g, 'mascota');
  assert.equal(pets.length, before + 1);
  assert.equal(pets[pets.length - 1].n.species, 'perro');
  // A un amigo no: el perro es de él
  const f = MV.sys.rels.candidate(g); MV.addRel(g, f, 'amigo', 70); f.traits = ['amable'];
  MV.sys.rels.giveGift(g, f.id, 'cachorro');
  assert.equal(MV.rels(g, 'mascota').length, before + 1);
});

test('vender la casa donde vives no te muda a una que alquilas', () => {
  const MV = load({ seed: 4 });
  const g = MV.newGame({ seed: 4 }); g.p.age = 40; g.p.money = 0;
  const home = { id: 'h1', type: 'casa', kind: 'Casa familiar', icon: '🏡', name: 'Casa', value: 200000, cond: 90, upgrades: [] };
  const rented = { id: 'h2', type: 'casa', kind: 'Departamento', icon: '🏢', name: 'Depto', value: 150000, cond: 90, upgrades: [], rented: true };
  g.p.assets.push(home, rented); g.p.home = 'h1'; g.p.housing = 'propia';
  MV.sys.money.sellFor(g, 'h1', 200000);
  assert.notEqual(g.p.home, 'h2');
  assert.equal(g.p.housing, 'alquiler');
});

test('una casa que ya trae piscina no ofrece instalar otra', () => {
  const MV = load({ seed: 5 });
  const g = MV.newGame({ seed: 5 }); g.p.age = 40; g.p.money = 1e7;
  g.p.assets.push({ id: 'h1', type: 'casa', kind: 'Casa con piscina', icon: '🏡', name: 'Casa con piscina', value: 500000, cond: 90, upgrades: [] });
  const pool = MV.sys.money.upgradeOptions(g, 'h1').find((o) => o.id === 'piscina');
  assert.equal(pool.ok, false);
  assert.match(pool.sub, /Ya (la )?tiene/);
});

test('un tatuaje de la cárcel queda en el álbum', () => {
  const MV = load({ seed: 6 });
  let got = 0;
  for (let i = 0; i < 20; i++) {
    const g = MV.newGame({ seed: 600 + i }); g.p.age = 30; MV.sys.crime.jail(g, 5, 'Robo');
    g.queue = []; MV.EV.push(g, 'carcel_tatuaje', {}, true);
    const v = MV.EV.view(g); MV.EV.choose(g, v.choices.find((c) => /Aceptar/.test(c.label)).i);
    assert.equal(g.p.tattoos.length, 1, 'no quedó en el álbum');
    assert.equal(g.p.tattoos[0].artist, 'carcel');
    got++;
  }
  assert.equal(got, 20);
});
