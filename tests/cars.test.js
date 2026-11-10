/* Autos: concesionaria por categorías, dibujos pixelados, prestigio, tuneo, carreras y seguro. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
const CATS = ['hiperauto', 'deportivo', 'sedan', 'suv', 'pickup', 'electrico', 'clasico', 'moto', 'lujo'];

function adult(MV, seed, money) {
  const g = MV.newGame({ seed }); g.p.age = 30; g.p.money = money == null ? 1e7 : money; g.queue = []; g.p.followers = 0;
  return g;
}

test('el catálogo tiene 9 categorías y al menos 40 modelos con datos válidos', () => {
  const MV = load();
  assert.deepEqual(Object.keys(MV.CAR_CATS), CATS);
  CATS.forEach((c) => { assert.ok(MV.CAR_CATS[c].name && MV.CAR_CATS[c].icon, c); });
  assert.ok(MV.CAR_CATALOG.length >= 40, 'modelos: ' + MV.CAR_CATALOG.length);
  const ids = new Set();
  MV.CAR_CATALOG.forEach((m) => {
    assert.ok(!ids.has(m.id), 'id repetido ' + m.id); ids.add(m.id);
    assert.ok(CATS.includes(m.cat), m.id);
    assert.ok(typeof m.brand === 'string' && m.brand && typeof m.model === 'string' && m.model, m.id);
    assert.ok(m.price >= 1000 && m.price <= 5e6, m.id + ' precio');
    assert.ok(m.speed >= 90 && m.speed <= 500, m.id + ' velocidad');
    assert.ok(m.accel >= 1.5 && m.accel <= 25, m.id + ' 0 a 100');
    assert.ok(m.fuel >= 0 && m.fuel <= 40, m.id + ' consumo');
    assert.ok(m.prestige >= 0 && m.prestige <= 100, m.id + ' prestigio');
  });
  CATS.forEach((c) => assert.ok(MV.CAR_CATALOG.filter((m) => m.cat === c).length >= 3, 'pocos modelos en ' + c));
  assert.equal(MV.CAR_COLORS.length, 8);
  MV.CAR_COLORS.forEach((c) => { assert.ok(c.id && c.name); assert.match(c.hex, /^#[0-9a-f]{6}$/i); });
});

test('comprar un modelo cobra y guarda modelo, color, tuneo vacío y sin seguro', () => {
  const MV = load({ seed: 1 });
  const g = adult(MV, 1);
  const m = MV.CAR_CATALOG.find((x) => x.cat === 'deportivo');
  const msg = MV.sys.money.buyCar(g, m.id, 'azul');
  assert.ok(!BAD_TEXT.test(msg), msg);
  assert.equal(g.p.money, 1e7 - m.price);
  const a = g.p.assets.find((x) => x.model === m.id);
  assert.ok(a, msg);
  assert.equal(a.type, 'auto'); assert.equal(a.color, 'azul'); assert.equal(a.value, m.price);
  assert.deepEqual(a.tune, {}); assert.equal(a.insured, false);
  assert.match(a.name, new RegExp(m.brand));
});

test('sin dinero, siendo menor o con un modelo inexistente no se compra', () => {
  const MV = load({ seed: 2 });
  const m = MV.CAR_CATALOG.find((x) => x.cat === 'hiperauto');
  const poor = adult(MV, 2, 1000);
  assert.match(MV.sys.money.buyCar(poor, m.id, 'rojo'), /alcanza/);
  assert.equal(poor.p.assets.filter((a) => a.type === 'auto').length, 0);
  assert.equal(poor.p.money, 1000);
  const kid = adult(MV, 3); kid.p.age = 15;
  assert.match(MV.sys.money.buyCar(kid, m.id, 'rojo'), /menor/);
  const g = adult(MV, 4);
  assert.match(MV.sys.money.buyCar(g, 'no_existe', 'rojo'), /no existe/);
  assert.equal(g.p.assets.filter((a) => a.type === 'auto').length, 0);
});

test('un auto de prestigio alto suma apariencia y fama cada año', () => {
  const MV = load({ seed: 5 });
  const top = MV.CAR_CATALOG.filter((x) => x.prestige >= 70).sort((a, b) => a.price - b.price)[0];
  const low = MV.CAR_CATALOG.filter((x) => x.prestige < 70)[0];
  assert.ok(top && low);
  const g = adult(MV, 5);
  MV.sys.money.buyCar(g, top.id, 'negro');
  assert.equal(MV.sys.money.carPrestige(g.p), top.prestige);
  g.p.stats.looks = 50; g.p.fame = 10;
  MV.sys.money.yearly(g);
  assert.equal(g.p.stats.looks, 51);
  assert.equal(g.p.fame, 11);
  const h = adult(MV, 6);
  MV.sys.money.buyCar(h, low.id, 'blanco');
  h.p.stats.looks = 50; h.p.fame = 10;
  MV.sys.money.yearly(h);
  assert.equal(h.p.stats.looks, 50);
  assert.equal(h.p.fame, 10);
  assert.equal(MV.sys.money.carPrestige(adult(MV, 7).p), 0, 'sin autos');
});

test('cada modelo, color y auto viejo se dibuja en pixel art sin textos rotos', () => {
  const MV = load();
  const seen = new Set();
  MV.CAR_CATALOG.forEach((m) => MV.CAR_COLORS.forEach((c) => {
    const s = MV.UI.carSVG(m, c.id);
    assert.match(s, /^<svg/); assert.match(s, /crispEdges/); assert.ok(!BAD_TEXT.test(s), m.id + ' ' + c.id);
    assert.ok(s.includes(c.hex), `${m.id} no usa el color ${c.id}`);
    seen.add(s);
  }));
  assert.ok(seen.size >= MV.CAR_CATALOG.length * 8 * 0.9, 'dibujos repetidos');
  const shapes = new Set(MV.CAR_CATALOG.map((m) => MV.UI.carSVG(m, 'rojo')));
  assert.ok(shapes.size >= 30, 'pocos dibujos distintos: ' + shapes.size);
  MV.CARS.forEach((t, i) => {
    const old = { id: 'a' + i, type: 'auto', kind: t.kind, icon: t.icon, name: 'Viejo', value: 1000, cond: 50 };
    const s = MV.UI.carSVG(old);
    assert.match(s, /^<svg/, t.kind); assert.ok(!BAD_TEXT.test(s), t.kind);
  });
});

// ——— Tuneo, carreras, seguro y choques ———
function withCar(MV, seed, modelId, o) {
  const g = adult(MV, seed);
  g.p.licenses = { auto: true }; g.p.license = true;
  MV.sys.money.buyCar(g, modelId || 'okami_sereno', 'rojo');
  const a = g.p.assets.filter((x) => x.type === 'auto').pop();
  Object.assign(a, o || {});
  return { g, a };
}

test('las piezas de tuneo tienen costo, rendimiento y valor', () => {
  const MV = load();
  assert.deepEqual(Object.keys(MV.CAR_TUNES), ['motor', 'llantas', 'pintura', 'aleron', 'nitro']);
  Object.values(MV.CAR_TUNES).forEach((t) => { assert.ok(t.name && t.icon && t.cost > 0 && t.perf >= 0 && t.back > 0 && t.back < 1, t.name); });
});

test('tunear cobra, sube el rendimiento y el valor, y no repite pieza', () => {
  const MV = load({ seed: 20 });
  const { g, a } = withCar(MV, 20);
  const p0 = MV.sys.cars.perf(a), m0 = g.p.money, v0 = a.value;
  const msg = MV.sys.cars.tune(g, a.id, 'motor');
  assert.ok(!BAD_TEXT.test(msg), msg);
  assert.equal(g.p.money, m0 - MV.CAR_TUNES.motor.cost);
  assert.ok(MV.sys.cars.perf(a) > p0);
  assert.ok(a.value > v0);
  assert.ok(a.tune.motor);
  const m1 = g.p.money;
  assert.match(MV.sys.cars.tune(g, a.id, 'motor'), /ya tiene/i);
  assert.equal(g.p.money, m1);
  g.p.money = 10;
  assert.match(MV.sys.cars.tune(g, a.id, 'nitro'), /alcanza/);
  assert.match(MV.sys.cars.tune(g, a.id, 'turbo_cuantico'), /no existe/);
});

test('ganar una carrera en circuito depende del rendimiento y cuesta $500 de inscripción', () => {
  const MV = load({ seed: 21 });
  const wins = (modelId, tune) => {
    let w = 0;
    for (let i = 0; i < 120; i++) {
      const { g, a } = withCar(MV, 300 + i, modelId);
      if (tune) Object.keys(MV.CAR_TUNES).forEach((k) => MV.sys.cars.tune(g, a.id, k));
      const m0 = g.p.money;
      const msg = MV.sys.cars.race(g, a.id, 'circuito');
      assert.ok(!BAD_TEXT.test(msg), msg);
      if (/primer puesto|ganaste/i.test(msg)) w++;
      assert.ok(g.p.money >= m0 - 500 - 1, 'en circuito solo pierdes la inscripción');
    }
    return w;
  };
  const fast = wins('ardenne_quimera'), slow = wins('fenix_compacto'), tuned = wins('fenix_compacto', true);
  assert.ok(fast > slow + 30, `rápido ${fast} vs lento ${slow}`);
  assert.ok(tuned > slow, `tuneado ${tuned} vs lento ${slow}`);
});

test('carrera callejera pide 18 y licencia, y a veces trae policía o choque', () => {
  const MV = load({ seed: 22 });
  const { g, a } = withCar(MV, 22);
  g.p.age = 17;
  assert.match(MV.sys.cars.race(g, a.id, 'calle', 1000), /18/);
  g.p.age = 25; g.p.licenses = {}; g.p.license = false;
  assert.match(MV.sys.cars.race(g, a.id, 'calle', 1000), /licencia/);
  assert.match(MV.sys.cars.race(g, a.id, 'circuito'), /licencia/);
  let police = 0, crash = 0, won = 0;
  for (let i = 0; i < 200; i++) {
    const x = withCar(MV, 500 + i);
    x.g.p.age = 25;
    const m0 = x.g.p.money;
    const msg = MV.sys.cars.race(x.g, x.a.id, 'calle', 1000);
    assert.ok(!BAD_TEXT.test(msg), msg);
    if (/polic/i.test(msg)) police++;
    if (/choc/i.test(msg)) { crash++; assert.ok(x.a.cond < 100 || !x.g.p.assets.includes(x.a), 'el choque daña el auto'); }
    if (x.g.p.money > m0) won++;
  }
  assert.ok(police > 5 && crash > 5 && won > 10, `policía ${police}, choques ${crash}, ganadas ${won}`);
  assert.equal(MV.sys.cars.race(withCar(MV, 9).g, 'nope', 'circuito'), 'No tienes ese auto.');
});

test('el seguro cuesta el 3 % del valor cada año y cubre un robo', () => {
  const MV = load({ seed: 23 });
  const { g, a } = withCar(MV, 23, 'vellano_sentinella');
  const m0 = g.p.money, prem = Math.round(a.value * 0.03);
  const msg = MV.sys.cars.insure(g, a.id, true);
  assert.ok(!BAD_TEXT.test(msg), msg);
  assert.equal(a.insured, true);
  assert.equal(g.p.money, m0 - prem);
  let stolen = false;
  for (let y = 0; y < 200 && !stolen; y++) {
    const before = g.p.money, value = a.value, p = Math.round(a.value * 0.03);
    g.queue = [];
    MV.sys.cars.yearly(g);
    if (!g.p.assets.includes(a)) { stolen = true; assert.equal(g.p.money - before, value - p, 'el seguro paga el valor del auto robado'); }
  }
  assert.ok(stolen, 'un auto carísimo se roba alguna vez');
  assert.match(MV.sys.cars.insure(g, 'nope', true), /No tienes/);
});

test('sin seguro un robo te deja sin auto y sin dinero', () => {
  const MV = load({ seed: 24 });
  const { g, a } = withCar(MV, 24, 'vellano_sentinella');
  let stolen = false;
  for (let y = 0; y < 300 && !stolen; y++) {
    const before = g.p.money;
    g.queue = [];
    MV.sys.cars.yearly(g);
    if (!g.p.assets.includes(a)) { stolen = true; assert.equal(g.p.money, before); }
  }
  assert.ok(stolen);
});

test('los choques del año son más probables con alcohol y carreras callejeras', () => {
  const MV = load({ seed: 25 });
  const crashes = (drunk) => {
    let n = 0;
    for (let i = 0; i < 300; i++) {
      const { g, a } = withCar(MV, 700 + i, 'okami_sereno');
      if (drunk) { g.p.addic.alcohol = 80; g.p.flags.lastStreetRace = g.p.age; }
      g.queue = [];
      MV.sys.cars.yearly(g);
      if (a.cond < 100) n++;
    }
    return n;
  };
  const sober = crashes(false), risky = crashes(true);
  assert.ok(risky > sober * 2, `con riesgo ${risky} vs sobrio ${sober}`);
});

test('un auto viejo sin modelo también se tunea, corre y se asegura', () => {
  const MV = load({ seed: 26 });
  const g = adult(MV, 26); g.p.licenses = { auto: true }; g.p.license = true;
  const old = { id: 'viejo1', type: 'auto', kind: 'Sedán', icon: '🚙', name: 'Torino LX (sedán)', value: 30000, cond: 70, bought: 20 };
  g.p.assets.push(old);
  assert.ok(MV.sys.cars.perf(old) > 0);
  assert.ok(!BAD_TEXT.test(MV.sys.cars.tune(g, old.id, 'llantas')));
  assert.ok(old.tune.llantas);
  assert.ok(!BAD_TEXT.test(MV.sys.cars.race(g, old.id, 'circuito')));
  assert.ok(!BAD_TEXT.test(MV.sys.cars.insure(g, old.id, true)));
  assert.equal(old.insured, true);
  for (let y = 0; y < 20; y++) { g.queue = []; MV.sys.cars.yearly(g); }
});

test('el alerón y la pintura de carreras se ven en el dibujo', () => {
  const MV = load({ seed: 27 });
  const { g, a } = withCar(MV, 27, 'okami_sereno');
  const plain = MV.UI.carSVG(a);
  MV.sys.cars.tune(g, a.id, 'aleron');
  const winged = MV.UI.carSVG(a);
  assert.notEqual(winged, plain);
  MV.sys.cars.tune(g, a.id, 'pintura');
  assert.notEqual(MV.UI.carSVG(a), winged);
  assert.ok(MV.UI.carSVG(a).includes('#ffffff'), 'franjas blancas');
});
