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

// ——— Tarea 4: eventos de inquilinos, desastres y robos ———
/** Encola un evento y devuelve su vista. */
function pushView(MV, g, id, ctx) { g.queue = []; MV.EV.push(g, id, ctx, true); return MV.EV.view(g); }
const idx = (v, re) => { const c = v.choices.find((x) => re.test(x.label)); assert.ok(c, 'falta ' + re + ' en ' + v.choices.map((x) => x.label).join(' | ')); return c.i; };
const clean = (v) => { [v.title, v.text].concat(v.choices.map((c) => c.label + ' ' + (c.sub || ''))).forEach((s) => assert.ok(!BAD_TEXT.test(s), s)); };

test('los eventos de inquilinos tienen textos limpios y hacen lo que dicen', () => {
  const MV = load({ seed: 50 });
  const setup = (seed, kind) => { const g = adult(MV, seed); const a = rented(MV, g, 'casa', 200000, 'normal', kind); return { g, a }; };
  // No paga: desalojar y perdonar
  let { g, a } = setup(50, 'moroso');
  let v = pushView(MV, g, 'inquilino_no_paga', { asset: a.id }); clean(v);
  assert.ok(v.choices.length === 3);
  let m = g.p.money; const old = a.rent.tenant;
  let r = MV.EV.choose(g, idx(v, /Desalojar/));
  assert.equal(g.p.money, m - 3000); assert.equal(a.rent.vacant, g.p.age); assert.notEqual(a.rent.tenant, old);
  assert.equal(R(MV).income(g).amount, 0, 'vacía ese año');
  assert.ok(!BAD_TEXT.test(r.msg), r.msg);
  ({ g, a } = setup(51, 'moroso'));
  v = pushView(MV, g, 'inquilino_no_paga', { asset: a.id });
  const k = g.p.karma; r = MV.EV.choose(g, idx(v, /Perdonar/));
  assert.equal(g.p.karma, k + 3); assert.ok(!BAD_TEXT.test(r.msg), r.msg);
  // Esperar: mitad debe el doble, mitad se va
  let owed = 0;
  for (let s = 0; s < 200; s++) {
    ({ g, a } = setup(5200 + s, 'moroso')); const t = a.rent.tenant;
    v = pushView(MV, g, 'inquilino_no_paga', { asset: a.id });
    r = MV.EV.choose(g, idx(v, /Esperar/));
    assert.ok(!BAD_TEXT.test(r.msg), r.msg);
    if (a.rent.owed) owed++; else assert.notEqual(a.rent.tenant, t, 'si no debe, se fue');
  }
  assert.ok(owed > 70 && owed < 130, 'esperar ' + owed);
  // Rompe: pagarlo tú, el seguro solo con póliza, cobrarle
  ({ g, a } = setup(53, 'fiestero'));
  v = pushView(MV, g, 'inquilino_rompe', { asset: a.id }); clean(v);
  assert.ok(!v.choices.some((c) => /seguro/i.test(c.label)), 'sin póliza no hay seguro');
  m = g.p.money; r = MV.EV.choose(g, idx(v, /Pagarlo/));
  assert.equal(g.p.money, m - Math.round(200000 * 0.05)); assert.ok(!BAD_TEXT.test(r.msg), r.msg);
  ({ g, a } = setup(54, 'fiestero')); I(MV).buy(g, 'hogar', a.id);
  v = pushView(MV, g, 'inquilino_rompe', { asset: a.id });
  m = g.p.money; const cond = a.cond; r = MV.EV.choose(g, idx(v, /seguro/i));
  assert.equal(g.p.money, m); assert.equal(a.cond, cond); assert.ok(!BAD_TEXT.test(r.msg), r.msg);
  let left = 0;
  for (let s = 0; s < 200; s++) {
    ({ g, a } = setup(5500 + s, 'fiestero')); const t = a.rent.tenant, c0 = a.cond, m0 = g.p.money;
    v = pushView(MV, g, 'inquilino_rompe', { asset: a.id });
    r = MV.EV.choose(g, idx(v, /Cobrar/));
    assert.equal(g.p.money, m0);
    if (a.rent.tenant !== t) { left++; assert.equal(a.cond, c0 - 15); } else assert.equal(a.cond, c0);
  }
  assert.ok(left > 35 && left < 85, 'se va enojado ' + left);
  // Compra: vender y no vender
  ({ g, a } = setup(56, 'puntual'));
  v = pushView(MV, g, 'inquilino_compra', { asset: a.id }); clean(v);
  m = g.p.money; r = MV.EV.choose(g, idx(v, /^Vender/));
  assert.ok(!g.p.assets.includes(a)); assert.ok(Math.abs(g.p.money - (m + 200000 * 1.05)) <= 1, 'cobraste ' + (g.p.money - m));
  assert.ok(!BAD_TEXT.test(r.msg), r.msg);
  ({ g, a } = setup(57, 'puntual'));
  v = pushView(MV, g, 'inquilino_compra', { asset: a.id });
  r = MV.EV.choose(g, idx(v, /No vender/));
  assert.ok(g.p.assets.includes(a)); assert.ok(!BAD_TEXT.test(r.msg), r.msg);
  // Se va (aviso): llega otro
  ({ g, a } = setup(58, 'puntual')); const t0 = a.rent.tenant;
  g.queue = []; MV.EV.push(g, 'inquilino_se_va', { asset: a.id });
  assert.notEqual(a.rent.tenant, t0);
  assert.ok(g.queue.length === 1 && g.queue[0].info && !BAD_TEXT.test(g.queue[0].info.text), JSON.stringify(g.queue));
  // Desastre: −40 de condición y 10 % sin seguro; gratis con seguro
  ({ g, a } = setup(59, 'puntual')); a.cond = 90;
  m = g.p.money; g.queue = []; MV.EV.push(g, 'desastre_hogar', { asset: a.id });
  assert.equal(a.cond, 50); assert.equal(g.p.money, m - 20000);
  assert.ok(!BAD_TEXT.test(g.queue[0].info.text), g.queue[0].info.text);
  ({ g, a } = setup(60, 'puntual')); a.cond = 90; I(MV).buy(g, 'hogar', a.id);
  m = g.p.money; MV.EV.push(g, 'desastre_hogar', { asset: a.id });
  assert.equal(a.cond, 50); assert.equal(g.p.money, m);
});

test('esperar al moroso puede traer el doble', () => {
  const MV = load({ seed: 61 });
  const g = adult(MV, 61);
  const a = rented(MV, g, 'casa', 100000, 'barato', 'puntual');
  a.rent.owed = true;
  assert.equal(R(MV).income(g).amount, 7000);
  assert.equal(a.rent.owed, undefined);
  assert.equal(R(MV).income(g).amount, 3500);
});

test('el robo en tu casa asegurada no te cuesta', () => {
  const MV = load({ seed: 62 });
  const g = adult(MV, 62);
  const casa = own(MV, g, 'casa', 200000); g.p.home = casa.id; g.p.housing = 'propia';
  I(MV).buy(g, 'hogar', casa.id);
  const v = pushView(MV, g, 'robo_casa', {});
  const m = g.p.money;
  const r = MV.EV.choose(g, idx(v, /Llamar a la policía/));
  assert.equal(g.p.money, m);
  assert.match(r.msg, /seguro/i);
  const h = adult(MV, 63);
  const c2 = own(MV, h, 'casa', 200000); h.p.home = c2.id; h.p.housing = 'propia';
  const w = pushView(MV, h, 'robo_casa', {});
  const n = h.p.money;
  MV.EV.choose(h, idx(w, /Llamar a la policía/));
  assert.ok(h.p.money < n, 'sin seguro te roban');
});

test('income encola los eventos', () => {
  const MV = load({ seed: 64 });
  for (let s = 0; s < 40; s++) {
    MV.rng.seed(6400 + s);
    const g = adult(MV, 6400 + s); const a = rented(MV, g, 'casa', 100000, 'barato', 'moroso');
    if (R(MV).income(g).amount === 0) {
      assert.ok(g.queue.some((q) => q.id === 'inquilino_no_paga' && q.ctx.asset === a.id), JSON.stringify(g.queue));
      return;
    }
  }
  assert.fail('ningún moroso dejó de pagar');
});

// ——— Tarea 5: jubilación ———
const RT = (MV) => MV.sys.retirement;
function worker(MV, seed, age, salary) {
  const g = adult(MV, seed); g.p.age = age;
  const J = MV.JOBS.find((j) => j.type === 'full');
  MV.sys.career.hire(g, J, 0, salary);
  g.p.job.start = age - 5; g.p.jobs = [];
  return g;
}

test('factor por edad', () => {
  const MV = load({ seed: 70 });
  [[55, 0.7], [60, 0.85], [65, 1], [70, 1.2], [75, 1.2]].forEach(([age, f]) => assert.ok(Math.abs(RT(MV).ageFactor(age) - f) < 1e-9, `${age}: ${RT(MV).ageFactor(age)}`));
  assert.deepEqual(RT(MV).RATES, [0, 0.05, 0.10, 0.15]);
});

test('aportes y crecimiento del fondo', () => {
  const MV = load({ seed: 71 });
  const g = worker(MV, 71, 40, 50000);
  RT(MV).setRate(g, 0.10);
  assert.equal(g.p.pensionRate, 0.10);
  const m = g.p.money;
  RT(MV).yearly(g);
  assert.equal(g.p.money, m - 5000);
  assert.ok(g.p.pensionFund >= 5000 * 1.01 - 1 && g.p.pensionFund <= 5000 * 1.06 + 1, 'fondo ' + g.p.pensionFund);
  const h = worker(MV, 72, 40, 50000);
  RT(MV).setRate(h, 0.10); h.p.money = 4000;
  RT(MV).yearly(h);
  assert.equal(h.p.money, 4000); assert.equal(h.p.pensionFund, 0);
  assert.ok(!/undefined|NaN/.test(RT(MV).setRate(h, 0.33)));
  assert.equal(h.p.pensionRate, 0.10, 'un aporte fuera del catálogo no cambia nada');
});

test('pensión con fondo y edad', () => {
  const MV = load({ seed: 73 });
  const g = worker(MV, 73, 60, 80000); g.p.pensionFund = 250000;
  const P = RT(MV).pensionFor(g);
  assert.equal(P.base, Math.round(80000 * 0.25));
  assert.equal(P.total, Math.round(P.base * 0.85 + 250000 / 25));
  const msg = MV.sys.career.retire(g);
  assert.equal(g.p.pension, P.total); assert.equal(g.p.pensionFund, 0); assert.ok(g.p.retired);
  assert.ok(!BAD_TEXT.test(msg), msg);
});

test('jubilarse desde los 55', () => {
  const MV = load({ seed: 74 });
  const g = worker(MV, 74, 54, 60000);
  assert.equal(MV.sys.career.retire(g), 'Aún no puedes jubilarte.');
  assert.ok(!MV.sys.career.actions(g).some((a) => a.id === 'jubilarse'));
  g.p.age = 55;
  const act = MV.sys.career.actions(g).find((a) => a.id === 'jubilarse');
  assert.ok(act);
  MV.doAction(g, act);
  assert.ok(g.p.retired); assert.equal(g.p.pension, Math.round(Math.round(60000 * 0.25) * 0.7));
});

test('retirarte con tu ahorro y sacar el fondo', () => {
  const MV = load({ seed: 75 });
  const g = adult(MV, 75); g.p.age = 56; g.p.job = null; g.p.pensionFund = 290000;
  const msg = RT(MV).retireWithSavings(g);
  assert.equal(g.p.pension, Math.round(290000 / 29)); assert.ok(g.p.retired); assert.equal(g.p.pensionFund, 0);
  assert.ok(!BAD_TEXT.test(msg), msg);
  const y = adult(MV, 76); y.p.age = 50; y.p.job = null; y.p.pensionFund = 290000;
  RT(MV).retireWithSavings(y); assert.ok(!y.p.retired, 'antes de los 55 no');
  const w = worker(MV, 77, 56, 40000); w.p.pensionFund = 290000;
  RT(MV).retireWithSavings(w); assert.ok(!w.p.retired, 'con trabajo se usa Jubilarte');
  const h = adult(MV, 78); h.p.pensionFund = 100000;
  const m = h.p.money;
  RT(MV).withdraw(h);
  assert.equal(h.p.money, m + 70000); assert.equal(h.p.pensionFund, 0);
});

test('el fondo suma al patrimonio', () => {
  const MV = load({ seed: 79 });
  const g = adult(MV, 79);
  const w = MV.netWorth(g);
  g.p.pensionFund = 123456;
  assert.equal(MV.netWorth(g), w + 123456);
});

test('el heredero empieza sin fondo', () => {
  const MV = load({ seed: 80 });
  const g = adult(MV, 80); g.p.age = 70; g.p.pensionFund = 300000; g.p.pensionRate = 0.15; g.p.loans = [];
  const kid = MV.newNPC(g, { age: 40, last: g.p.last }); MV.addRel(g, kid, 'hijo', 80);
  MV.sys.legacy.die(g, 'una prueba');
  const ng = MV.sys.legacy.continueAs(g, kid.id);
  assert.equal(ng.p.pensionFund, 0); assert.equal(ng.p.pensionRate, 0);
});

// ——— Tarea 6: dinero sucio ———
const D = (MV) => MV.sys.dirty;

test('los delitos, la mafia y los sobornos dan dinero sucio', () => {
  const MV = load({ seed: 90 });
  let got = false;
  for (let s = 0; s < 60 && !got; s++) {
    MV.rng.seed(9000 + s);
    const g = adult(MV, 9000 + s); g.p.dirty = 0; const m = g.p.money;
    const msg = MV.sys.crime.commit(g, 'robo_auto');
    if (g.p.dirty > 0) {
      got = true;
      assert.equal(g.p.money, m); assert.match(msg, /dinero sucio/);
      assert.equal(MV.netWorth(g), m, 'el sucio no suma al patrimonio');
    }
  }
  assert.ok(got, 'ningún robo salió bien');
  const job = (id, act) => {
    for (let s = 0; s < 60; s++) {
      MV.rng.seed(9100 + s);
      const g = adult(MV, 9100 + s); g.p.dirty = 0;
      MV.sys.career.hire(g, MV.jobById(id));
      const m = g.p.money;
      const r = MV.doAction(g, MV.sys.career.actions(g).find((a) => a.id === act));
      if (g.p.dirty > 0) { assert.equal(g.p.money, m); assert.match(r.msg, /dinero sucio/); return; }
    }
    assert.fail(act + ' nunca pagó');
  };
  job('mafia', 'encargo');
  job('politico', 'corrupcion');
});

test('lavar respeta límite, comisión y requisito', () => {
  const MV = load({ seed: 91 });
  const g = adult(MV, 91, 0); g.p.dirty = 300000; g.p.business = null; g.p.companies = [];
  D(MV).launder(g, 'contador');
  assert.equal(g.p.dirty, 100000); assert.equal(g.p.money, 160000);
  const h = adult(MV, 92, 0); h.p.dirty = 300000;
  D(MV).launder(h, 'casino');
  assert.equal(h.p.dirty, 0); assert.equal(h.p.money, 225000);
  const k = adult(MV, 93, 0); k.p.dirty = 300000; k.p.business = null; k.p.companies = [];
  assert.equal(D(MV).limit(k, 'negocio'), 0);
  const act = D(MV).actions(k).find((a) => a.id === 'lavar_negocio');
  const r = MV.doAction(k, act);
  assert.ok(r.blocked && /negocio|empresa/.test(r.msg), r.msg);
  assert.equal(k.p.dirty, 300000);
  k.p.money = 1e6; MV.sys.company.found(k, 'apps', 'Lavandería Digital'); k.p.money = 0;
  assert.equal(D(MV).limit(k, 'negocio'), 50000);
  assert.ok(!MV.doAction(k, act).blocked);
  assert.equal(k.p.dirty, 250000); assert.equal(k.p.money, 45000);
  assert.ok(MV.doAction(k, act).blocked, 'una vez por año');
  Object.keys(D(MV).METHODS).forEach((m) => { const M = D(MV).METHODS[m]; assert.ok(M.icon && M.label && M.fee > 0 && M.risk > 0, m); });
  const z = adult(MV, 94); z.p.dirty = 0;
  assert.ok(MV.doAction(z, D(MV).actions(z).find((a) => a.id === 'lavar_casino')).blocked, 'sin sucio no hay nada que lavar');
});

test('la investigación se abre según el sucio', () => {
  const MV = load({ seed: 95 });
  const rate = (dirty, prison) => {
    let n = 0;
    for (let s = 0; s < 200; s++) {
      MV.rng.seed(9500 + s);
      const g = adult(MV, 9500 + s); g.p.dirty = dirty;
      if (prison) g.p.prison = { left: 2, total: 2, crime: 'x', behavior: 50, since: 30 };
      D(MV).yearly(g);
      if (g.queue.some((q) => q.id === 'investigacion_lavado')) n++;
    }
    return n / 200;
  };
  assert.equal(rate(40000), 0);
  const r = rate(1000000);
  assert.ok(r > 0.25 && r < 0.45, 'con un millón ' + r);
  assert.equal(rate(1000000, true), 0);
});

test('las tres salidas de la investigación', () => {
  const MV = load({ seed: 96 });
  const open = (seed) => { MV.rng.seed(seed); const g = adult(MV, seed, 100000); g.p.dirty = 200000; const v = pushView(MV, g, 'investigacion_lavado', {}); clean(v); return { g, v }; };
  let archived = 0, seized = 0;
  for (let s = 0; s < 60; s++) {
    const { g, v } = open(9600 + s);
    const r = MV.EV.choose(g, idx(v, /abogado/i));
    assert.ok(!BAD_TEXT.test(r.msg), r.msg);
    if (g.p.dirty === 200000) { archived++; assert.equal(g.p.money, 80000); } else { seized++; assert.equal(g.p.dirty, 0); assert.equal(g.p.money, 64000); }
  }
  assert.ok(archived > 20 && seized > 10, `archivadas ${archived}, decomisos ${seized}`);
  let { g, v } = open(9700);
  let r = MV.EV.choose(g, idx(v, /Confesar/));
  assert.ok(g.p.prison && g.p.dirty === 0); assert.ok(g.p.record.some((x) => x.crime === 'Lavado de dinero'));
  assert.ok(!BAD_TEXT.test(r.msg), r.msg);
  ({ g, v } = open(9701));
  r = MV.EV.choose(g, idx(v, /Huir/));
  assert.ok(g.p.wanted >= 3); assert.equal(g.p.dirty, 200000);
  assert.ok(!BAD_TEXT.test(r.msg), r.msg);
});

test('el dinero sucio no se hereda', () => {
  const MV = load({ seed: 97 });
  const g = adult(MV, 97, 50000); g.p.age = 70; g.p.loans = []; g.p.dirty = 80000;
  const kid = MV.newNPC(g, { age: 40, last: g.p.last }); MV.addRel(g, kid, 'hijo', 80);
  const w = MV.netWorth(g);
  MV.sys.legacy.die(g, 'una prueba');
  assert.equal(g.summary.worth, w);
  const text = g.log.map((y) => y.items.map((i) => i.t).join(' ')).join(' ');
  assert.match(text, /La policía encontró \$80\.000 escondidos/);
  const ng = MV.sys.legacy.continueAs(g, kid.id);
  assert.equal(ng.p.dirty, 0);
});

// ——— Tarea 7: partidas versión 9 ———
test('migración v8 → v9', () => {
  const MV = load({ seed: 99 });
  assert.equal(MV.VERSION, 9);
  const g = adult(MV, 99);
  const casa = own(MV, g, 'casa', 150000); casa.rented = true;
  delete g.p.dirty; delete g.p.insurance; delete g.p.pensionFund; delete g.p.pensionRate; delete g.realty;
  g.version = 8;
  const back = MV.migrate(JSON.parse(JSON.stringify(g)));
  assert.equal(back.version, 9);
  assert.equal(back.p.dirty, 0); assert.equal(back.p.pensionFund, 0); assert.equal(back.p.pensionRate, 0);
  assert.deepEqual(back.p.insurance, { vida: 0, salud: false, hogar: {} });
  assert.equal(back.realty.phase, 'estable');
  const c = back.p.assets.find((a) => a.id === casa.id);
  assert.equal(c.rent.level, 'normal'); assert.ok(c.rent.tenant && c.rent.tenant.name && MV.TENANT_KINDS[c.rent.tenant.kind]);
  assert.ok(MV.validGame(back));
});

// ——— Tarea 8: el jugador automático usa todo lo nuevo ———
test('el jugador automático vive 20 vidas con inmuebles, seguros, jubilación y dinero sucio', () => {
  const { live } = require('./agent');
  const MV = load({ seed: 300 });
  const done = new Set();
  let rented = 0, insured = 0, funds = 0;
  for (let s = 300; s < 320; s++) {
    const g = MV.newGame({ seed: s });
    live(MV, g, { acts: 4, check: (gg) => {
      const p = gg.p;
      if (p.assets.some((a) => a.rent)) rented++;
      if (p.insurance && (p.insurance.vida || p.insurance.salud || Object.keys(p.insurance.hogar).length)) insured++;
      if (p.pensionFund > 0) funds++;
      assert.ok(Number.isFinite(p.dirty) && p.dirty >= 0 && Number.isFinite(p.pensionFund), 'valores de dinero inválidos');
    } });
    Object.keys(g.evDone).forEach((k) => done.add(k));
  }
  assert.ok(['inquilino_no_paga', 'inquilino_rompe', 'inquilino_compra', 'inquilino_se_va'].some((k) => done.has(k)), 'ningún evento de inquilino');
  assert.ok(done.has('investigacion_lavado'), 'ninguna investigación');
  assert.ok(rented && insured && funds, `alquiló ${rented}, aseguró ${insured}, aportó ${funds}`);
});
