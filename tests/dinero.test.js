/* Parte C2 — dinero: inmuebles, inquilinos, seguros, jubilación y dinero sucio. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
const TYPES = { local: [120000, 900000], terreno: [25000, 400000], edificio: [1200000, 6000000], vacaciones: [150000, 1500000] };

function adult(MV, seed, money) {
  const g = MV.newGame({ seed }); g.p.age = 35; g.p.money = money == null ? 1e7 : money; g.queue = [];
  return g;
}
/** Agrega un inmueble directamente (sin pasar por el listado). */
function own(MV, g, type, value, extra) {
  const a = Object.assign({ id: 'a' + type + Math.round(Math.random() * 1e9), type, kind: type, icon: '🏠', name: 'Prueba ' + type, value, cond: 80, bought: g.p.age, price: value }, extra || {});
  g.p.assets.push(a);
  return a;
}
const R = (MV) => MV.sys.realty;

// ——— Tarea 1: datos, compra y mercado ———
test('listados de los 4 tipos nuevos', () => {
  const MV = load({ seed: 1 });
  const g = adult(MV, 1);
  Object.keys(TYPES).forEach((k) => {
    const items = MV.sys.money.listings(g, k);
    assert.ok(items.length >= 1 && items.length <= 6, k);
    items.forEach((it) => {
      assert.equal(it.type, k);
      const V = MV.REALTY[k].find((v) => v.kind === it.kind);
      assert.ok(V, it.kind);
      assert.ok(it.value >= V.price[0] - 100 && it.value <= V.price[1] + 100, `${it.kind} ${it.value}`);
      assert.ok(it.value >= TYPES[k][0] - 100 && it.value <= TYPES[k][1] + 100, `${k} fuera de rango ${it.value}`);
      assert.ok(!BAD_TEXT.test(it.name), it.name);
    });
  });
  assert.deepEqual(Object.keys(MV.REALTY_NAMES).sort(), ['edificio', 'local', 'terreno', 'vacaciones']);
});

test('un inmueble que no es casa nunca es tu hogar', () => {
  const MV = load({ seed: 2 });
  Object.keys(TYPES).forEach((k) => {
    const g = adult(MV, 2); g.p.housing = 'alquiler'; g.p.rent = MV.RENTALS[1]; g.p.home = null;
    const it = MV.sys.money.listings(g, k)[0];
    MV.sys.money.buy(g, it, false);
    assert.ok(g.p.assets.some((a) => a.type === k), 'compró ' + k);
    assert.equal(g.p.housing, 'alquiler', k);
    assert.equal(g.p.home, null, k);
  });
});

test('mantenimiento por tipo', () => {
  const MV = load({ seed: 3 });
  const g = adult(MV, 3);
  const up = (type) => MV.sys.money.upkeep(g, { type, value: 100000 });
  assert.equal(up('local'), 1000);
  assert.equal(up('terreno'), 200);
  assert.equal(up('edificio'), 1500);
  assert.equal(up('vacaciones'), 1000);
});

test('el mercado alterna fases y mueve los valores', () => {
  const MV = load({ seed: 4 });
  const g = adult(MV, 4);
  const phases = [];
  for (let i = 0; i < 60; i++) { R(MV).yearly(g); phases.push(R(MV).market(g).phase); }
  const runs = [];
  phases.forEach((ph, i) => { if (!i || ph !== phases[i - 1]) runs.push({ ph, n: 1 }); else runs[runs.length - 1].n++; });
  runs.slice(1, -1).forEach((r) => assert.ok(r.n >= 2 && r.n <= 5, `tramo ${r.ph} de ${r.n} años`));
  for (let i = 1; i < runs.length; i++) assert.notEqual(runs[i].ph, runs[i - 1].ph);
  assert.ok(runs.length >= 8, 'hay varios cambios de fase');
  assert.equal(R(MV).marketMod({ realty: { phase: 'auge', left: 2 } }), 0.06);
  assert.equal(R(MV).marketMod({ realty: { phase: 'caida', left: 2 } }), -0.06);
  let diff = 0;
  for (let s = 0; s < 200; s++) {
    const ch = (phase) => {
      MV.rng.seed(5000 + s);
      const h = adult(MV, 5000 + s); h.realty = { phase, left: 5 };
      const a = own(MV, h, 'casa', 100000);
      MV.sys.money.yearly(h);
      return a.value / 100000 - 1;
    };
    diff += ch('auge') - ch('caida');
  }
  const avg = diff / 200;
  assert.ok(avg > 0.10 && avg < 0.14, 'auge − caída ≈ 0,12: ' + avg);
});

test('los terrenos se valorizan más', () => {
  const MV = load({ seed: 6 });
  let diff = 0;
  for (let s = 0; s < 300; s++) {
    const ch = (type) => {
      MV.rng.seed(6000 + s);
      const h = adult(MV, 6000 + s); h.realty = { phase: 'estable', left: 5 };
      const a = own(MV, h, type, 100000);
      MV.sys.money.yearly(h);
      return a.value / 100000 - 1;
    };
    diff += ch('terreno') - ch('casa');
  }
  const avg = diff / 300;
  assert.ok(avg > 0.02 && avg < 0.06, 'terreno − casa entre 2 y 6 %: ' + avg);
});

// ——— Tarea 2: alquiler, inquilinos, edificio, vacaciones y construir ———
function rented(MV, g, type, value, level, kind) {
  const a = own(MV, g, type, value);
  R(MV).rentOut(g, a.id, level);
  if (kind && a.rent.tenant) a.rent.tenant.kind = kind;
  return a;
}

test('renta por nivel y tipo', () => {
  const MV = load({ seed: 21 });
  const g = adult(MV, 21);
  rented(MV, g, 'casa', 100000, 'barato', 'puntual');
  assert.equal(R(MV).income(g).amount, 3500);
  const h = adult(MV, 22);
  rented(MV, h, 'local', 100000, 'barato', 'puntual');
  assert.equal(R(MV).income(h).amount, 5250);
});

test('años vacíos según el nivel', () => {
  const MV = load({ seed: 23 });
  const rate = (level) => {
    let vac = 0;
    for (let s = 0; s < 400; s++) {
      MV.rng.seed(7000 + s);
      const g = adult(MV, 7000 + s); rented(MV, g, 'casa', 100000, level, 'puntual');
      if (R(MV).income(g).amount === 0) vac++;
    }
    return vac / 400;
  };
  const caro = rate('caro');
  assert.ok(caro > 0.13 && caro < 0.27, 'caro vacía ' + caro);
  assert.equal(rate('barato'), 0);
});

test('inquilinos según el nivel', () => {
  const MV = load({ seed: 24 });
  const g = adult(MV, 24);
  const casa = own(MV, g, 'casa', 100000), local = own(MV, g, 'local', 100000);
  let moroso = 0;
  for (let i = 0; i < 2000; i++) if (R(MV).newTenant(g, casa, 'caro').kind === 'moroso') moroso++;
  assert.ok(moroso / 2000 > 0.30 && moroso / 2000 < 0.40, 'morosos ' + moroso / 2000);
  const t = R(MV).newTenant(g, casa, 'normal');
  assert.ok(MV.TENANT_KINDS[t.kind] && t.name && !BAD_TEXT.test(t.name));
  for (let i = 0; i < 20; i++) assert.ok(MV.SHOP_TENANTS.includes(R(MV).newTenant(g, local, 'normal').name));
});

test('moroso, fiestero y cuidadoso', () => {
  const MV = load({ seed: 25 });
  let unpaid = 0, broke = 0;
  for (let s = 0; s < 300; s++) {
    MV.rng.seed(7500 + s);
    const g = adult(MV, 7500 + s); const a = rented(MV, g, 'casa', 100000, 'barato', 'moroso');
    if (R(MV).income(g).amount === 0) { unpaid++; assert.equal(a.rent.unpaid, g.p.age); }
    MV.rng.seed(7900 + s);
    const h = adult(MV, 7900 + s); const b = rented(MV, h, 'casa', 100000, 'barato', 'fiestero');
    R(MV).income(h); if (b.rent.broke === h.p.age) broke++;
  }
  assert.ok(unpaid / 300 > 0.3 && unpaid / 300 < 0.5, 'moroso sin pagar ' + unpaid / 300);
  assert.ok(broke / 300 > 0.2 && broke / 300 < 0.4, 'fiestero rompe ' + broke / 300);
  let careful = 0, none = 0;
  for (let s = 0; s < 300; s++) {
    const wear = (kind) => {
      MV.rng.seed(8300 + s);
      const g = adult(MV, 8300 + s); g.realty = { phase: 'estable', left: 5 };
      const a = kind ? rented(MV, g, 'casa', 100000, 'barato', kind) : own(MV, g, 'casa', 100000);
      MV.sys.money.yearly(g);
      return 80 - a.cond;
    };
    careful += wear('cuidadoso'); none += wear(null);
  }
  assert.ok(Math.abs(careful / 300 - none / 600) < 0.7, `cuidadoso ${careful / 300} vs ${none / 300}`);
});

test('edificio', () => {
  const MV = load({ seed: 26 });
  for (let s = 0; s < 200; s++) {
    MV.rng.seed(8800 + s);
    const g = adult(MV, 8800 + s); const a = own(MV, g, 'edificio', 3000000); R(MV).rentOut(g, a.id, 'caro');
    const r = R(MV).income(g);
    assert.ok(r.amount <= 3000000 * 0.05 * 1.3 + 1, 'renta ' + r.amount);
    assert.ok(r.lines.some((l) => /de 6 departamentos pagaron/.test(l)), r.lines.join(' | '));
  }
});

test('vacaciones y veranear', () => {
  const MV = load({ seed: 27 });
  for (let s = 0; s < 100; s++) {
    MV.rng.seed(9000 + s);
    const g = adult(MV, 9000 + s); own(MV, g, 'vacaciones', 500000);
    const r = R(MV).income(g).amount;
    assert.ok(r >= 0 && r <= 60000, 'temporada ' + r);
  }
  for (let s = 0; s < 60; s++) {
    MV.rng.seed(9200 + s);
    const g = adult(MV, 9200 + s); const a = own(MV, g, 'vacaciones', 500000);
    g.p.stats.happy = 50; g.p.stress = 50;
    const act = R(MV).summerAction(g, a.id);
    assert.equal(act.limit, 1);
    assert.ok(!MV.doAction(g, act).blocked);
    assert.equal(g.p.stats.happy, 56); assert.equal(g.p.stress, 42);
    assert.ok(MV.doAction(g, act).blocked, 'una vez por año');
    assert.ok(R(MV).income(g).amount <= 30000, 'veraneando rinde la mitad');
  }
});

test('construir en un terreno', () => {
  const MV = load({ seed: 28 });
  const g = adult(MV, 28, 500000);
  const t = own(MV, g, 'terreno', 100000);
  R(MV).build(g, t.id, 'casa');
  assert.equal(g.p.money, 400000);
  assert.equal(t.type, 'casa'); assert.equal(t.name, 'Casa en tu terreno'); assert.equal(t.value, 220000); assert.equal(t.cond, 100);
  const h = adult(MV, 29, 500000);
  const u = own(MV, h, 'terreno', 100000);
  R(MV).build(h, u.id, 'local');
  assert.equal(h.p.money, 380000); assert.equal(u.type, 'local'); assert.equal(u.value, 250000);
  const k = adult(MV, 30, 1000);
  const v = own(MV, k, 'terreno', 100000);
  const msg = R(MV).build(k, v.id, 'casa');
  assert.ok(/alcanza/.test(msg), msg); assert.equal(v.type, 'terreno'); assert.equal(k.p.money, 1000);
});

test('cambiar el nivel una vez por año', () => {
  const MV = load({ seed: 31 });
  const g = adult(MV, 31);
  const a = rented(MV, g, 'casa', 100000, 'normal');
  const t = a.rent.tenant;
  R(MV).setLevel(g, a.id, 'caro');
  assert.equal(a.rent.level, 'caro'); assert.equal(a.rent.tenant, t, 'el inquilino se queda');
  assert.match(R(MV).setLevel(g, a.id, 'barato'), /este año/);
  assert.equal(a.rent.level, 'caro');
});

test('mudarte a tu casa alquilada saca al inquilino', () => {
  const MV = load({ seed: 32 });
  const g = adult(MV, 32); g.p.housing = 'alquiler';
  const a = rented(MV, g, 'casa', 100000, 'barato', 'puntual');
  R(MV).moveIn(g, a.id);
  assert.equal(a.rent, undefined); assert.equal(a.rented, false); assert.equal(g.p.home, a.id); assert.equal(g.p.housing, 'propia');
  assert.equal(R(MV).income(g).amount, 0);
  assert.ok(!R(MV).rentable(g, a), 'tu hogar no se alquila');
});

// ——— Tarea 3: seguros ———
const I = (MV) => MV.sys.insurance;

test('primas exactas', () => {
  const MV = load({ seed: 40 });
  const g = adult(MV, 40); g.p.age = 40; g.p.stats.health = 80;
  assert.equal(I(MV).premium(g, 'vida', 500000), 3000);
  g.p.stats.health = 30;
  assert.equal(I(MV).premium(g, 'vida', 500000), 6000);
  assert.equal(I(MV).premium(g, 'salud'), 3100);
  const casa = own(MV, g, 'casa', 200000);
  assert.equal(I(MV).premium(g, 'hogar', casa.id), 600);
});

test('quién puede contratar', () => {
  const MV = load({ seed: 41 });
  const g = adult(MV, 41); g.p.age = 17;
  assert.ok(!/contrataste/i.test(I(MV).buy(g, 'salud')));
  assert.equal(I(MV).covered(g, 'salud'), false);
  const h = adult(MV, 42); h.p.stats.health = 15;
  assert.equal(I(MV).buy(h, 'vida', 500000), 'Ninguna aseguradora te quiere: dicen que eres un riesgo con patas');
  assert.equal(I(MV).covered(h, 'vida'), false);
  h.p.stats.health = 70;
  I(MV).buy(h, 'vida', 500000);
  assert.equal(I(MV).covered(h, 'vida'), true);
  assert.equal(h.p.insurance.vida, 500000);
  const casa = own(MV, h, 'casa', 200000);
  I(MV).buy(h, 'hogar', casa.id);
  assert.equal(I(MV).covered(h, 'hogar', casa.id), true);
  assert.ok(!/contrataste/i.test(I(MV).buy(h, 'hogar', 'no-existe')));
  I(MV).cancel(h, 'vida');
  assert.equal(I(MV).covered(h, 'vida'), false);
});

test('cobro anual y cancelación por falta de pago', () => {
  const MV = load({ seed: 43 });
  const g = adult(MV, 43); g.p.stats.health = 80;
  I(MV).buy(g, 'vida', 500000);
  I(MV).buy(g, 'salud');
  const m = g.p.money;
  I(MV).yearly(g);
  assert.equal(g.p.money, m - I(MV).premium(g, 'vida', 500000) - I(MV).premium(g, 'salud'));
  g.p.money = 100;
  I(MV).yearly(g);
  assert.equal(g.p.money, 100);
  assert.equal(I(MV).covered(g, 'vida'), false);
  assert.equal(I(MV).covered(g, 'salud'), false);
  const text = g.log.map((y) => y.items.map((i) => i.t).join(' ')).join(' ');
  assert.match(text, /Se canceló tu seguro de vida por falta de pago/);
});

test('salud paga el 80 % de los tratamientos', () => {
  const MV = load({ seed: 44 });
  const id = Object.keys(MV.CONDITIONS).find((k) => MV.CONDITIONS[k].cost > 1000);
  const C = MV.CONDITIONS[id], T = MV.sys.health.TIERS.hospital;
  const g = adult(MV, 44);
  I(MV).buy(g, 'salud');
  g.p.conds = []; MV.sys.health.add(g, id);
  const m = g.p.money;
  MV.sys.health.treat(g, id, 'hospital');
  assert.equal(m - g.p.money, Math.round(C.cost * T.cost * 0.2));
  const h = adult(MV, 45);
  h.p.conds = []; MV.sys.health.add(h, id);
  const n = h.p.money;
  MV.sys.health.treat(h, id, 'hospital');
  assert.equal(n - h.p.money, Math.round(C.cost * T.cost));
});

test('vida suma la herencia de los herederos', () => {
  const total = (withIns) => {
    const MV = load({ seed: 46 });
    const g = adult(MV, 46, 50000); g.p.age = 60; g.p.loans = []; g.p.stats.health = 70;
    const kid = MV.newNPC(g, { age: 30, last: g.p.last }); MV.addRel(g, kid, 'hijo', 80);
    if (withIns) { I(MV).buy(g, 'vida', 500000); g.p.money = 50000; }
    MV.sys.legacy.die(g, 'una prueba');
    return { MV, g, kid, total: MV.sys.legacy.estateFor(g, kid.id).total };
  };
  const a = total(false), b = total(true);
  assert.equal(b.total - a.total, 500000);
  assert.equal(b.g.summary.lifeIns, 500000);
  const ng = b.MV.sys.legacy.continueAs(b.g, b.kid.id);
  assert.deepEqual(ng.p.insurance, { vida: 0, salud: false, hogar: {} });
});

test('vender una propiedad asegurada borra su póliza', () => {
  const MV = load({ seed: 47 });
  const g = adult(MV, 47);
  const casa = own(MV, g, 'casa', 200000);
  I(MV).buy(g, 'hogar', casa.id);
  MV.sys.money.sellFor(g, casa.id, 200000);
  assert.equal(I(MV).covered(g, 'hogar', casa.id), false);
  const m = g.p.money;
  I(MV).yearly(g);
  assert.equal(g.p.money, m);
});
