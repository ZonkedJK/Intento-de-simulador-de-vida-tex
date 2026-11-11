/* Bolsa de valores: empresas inventadas, noticias, crash, burbujas, dividendos, compra y venta; salida a bolsa e información privilegiada. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
const IDS = ['VOLT', 'OKAM', 'BSUR', 'PETR', 'VITA', 'SMAX', 'COND', 'MINA', 'BNNA', 'TORR', 'NUBE', 'POLL'];
function investor(MV, seed, money) {
  const g = MV.newGame({ seed }); g.p.age = 30; g.p.money = money == null ? 1e7 : money; g.queue = []; g.p.housing = 'propia';
  MV.sys.market.ensure(g);
  return g;
}
const M = (MV) => MV.sys.market;
const calm = (MV) => { MV.STOCKS.forEach((s) => { s.vol = 0; }); };

test('hay 12 empresas inventadas con datos válidos y efectos para cada noticia', () => {
  const MV = load();
  assert.deepEqual(MV.STOCKS.map((s) => s.id), IDS);
  MV.STOCKS.forEach((s) => { assert.ok(s.name && s.sector && s.price > 0, s.id); assert.ok(s.vol >= 0.1 && s.vol <= 0.8, s.id); assert.ok(s.div >= 0 && s.div <= 0.05, s.id); });
  assert.equal(MV.STOCKS.find((s) => s.id === 'BNNA').vol, 0.8);
  MV.WORLD_NEWS.forEach((n) => assert.ok(MV.MARKET_NEWS[n.id], 'falta el efecto de ' + n.id));
  const g = investor(MV, 1);
  const list = M(MV).list(g);
  assert.equal(list.length, 12);
  list.forEach((x) => { assert.ok(Number.isFinite(x.price) && Number.isFinite(x.change)); });
});

test('una recesión baja el mercado y el auge tecnológico sube la tecnología en promedio', () => {
  const MV = load({ seed: 2 });
  const avgChange = (news, id) => {
    let s = 0;
    for (let i = 0; i < 150; i++) { const g = investor(MV, 100 + i); MV.sys.world.set(g, news); const p0 = M(MV).price(g, id); M(MV).yearly(g, { quiet: true }); s += M(MV).price(g, id) / p0 - 1; }
    return s / 150;
  };
  assert.ok(avgChange('recesion', 'SMAX') < 0, 'la recesión baja');
  assert.ok(avgChange('auge_tech', 'OKAM') > avgChange('auge_tech', 'PETR') + 0.15, 'el auge tecnológico sube la tecnología');
  assert.ok(avgChange('pandemia', 'VITA') > avgChange('pandemia', 'COND') + 0.4);
});

test('el crash baja todas las acciones entre 30 % y 60 %', () => {
  const MV = load({ seed: 3 });
  const g = investor(MV, 3);
  const before = Object.assign({}, g.market.prices);
  const msg = M(MV).crash(g);
  assert.ok(!BAD_TEXT.test(msg), msg);
  IDS.forEach((id) => { const r = g.market.prices[id] / before[id]; assert.ok(r >= 0.39 && r <= 0.71, `${id}: ${r}`); });
});

test('la burbuja sube y después revienta', () => {
  const MV = load({ seed: 4 });
  calm(MV);
  const g = investor(MV, 4);
  g.world = null;
  g.market.bubble = { sector: 'tech', years: 2 };
  const steps = [];
  for (let i = 0; i < 4; i++) { const p0 = M(MV).price(g, 'OKAM'); M(MV).yearly(g, { quiet: true }); steps.push(Math.round((M(MV).price(g, 'OKAM') / p0 - 1) * 100) / 100); }
  assert.deepEqual(steps, [0.36, 0.36, -0.44, 0.06]);
  assert.equal(g.market.bubble, null);
});

test('comprar y vender cobra 1 % de comisión y no vende lo que no tienes', () => {
  const MV = load({ seed: 5 });
  const g = investor(MV, 5, 100000);
  const price = M(MV).price(g, 'VOLT');
  assert.ok(!BAD_TEXT.test(M(MV).buy(g, 'VOLT', 10)));
  assert.equal(g.p.money, 100000 - Math.round(price * 10 * 1.01));
  assert.equal(g.p.portfolio.VOLT.shares, 10);
  assert.match(M(MV).sell(g, 'VOLT', 20), /no tienes/i);
  const m = g.p.money;
  assert.ok(!BAD_TEXT.test(M(MV).sell(g, 'VOLT', 'all')));
  assert.equal(g.p.money, m + Math.round(price * 10 * 0.99));
  assert.equal((g.p.portfolio.VOLT || { shares: 0 }).shares, 0);
  assert.match(M(MV).buy(g, 'NOPE', 1), /no existe/i);
  assert.match(M(MV).buy(investor(MV, 6, 10), 'VOLT', 10), /no te alcanza/i);
  const all = investor(MV, 7, 5000);
  M(MV).buy(all, 'POLL', 'all');
  assert.ok(all.p.money >= 0 && all.p.money < M(MV).price(all, 'POLL') * 1.01 + 1, 'compra todo lo que alcanza');
});

test('los dividendos se pagan cada año', () => {
  const MV = load({ seed: 8 });
  calm(MV);
  const g = investor(MV, 8);
  g.world = null;
  M(MV).buy(g, 'BSUR', 1000);
  const m = g.p.money;
  M(MV).yearly(g, { quiet: true });
  const div = MV.STOCKS.find((s) => s.id === 'BSUR').div;
  assert.equal(g.p.money, m + Math.round(1000 * M(MV).price(g, 'BSUR') * div));
});

test('el patrimonio suma las acciones', () => {
  const MV = load({ seed: 9 });
  const g = investor(MV, 9, 100000);
  const w0 = MV.netWorth(g);
  M(MV).buy(g, 'TORR', 100);
  const price = M(MV).price(g, 'TORR');
  assert.equal(MV.netWorth(g), w0 - Math.round(price * 100 * 1.01) + Math.round(price * 100));
});

// ——— Salida a bolsa, junta de accionistas e información privilegiada ———
function bigCo(MV, seed, value) {
  const g = investor(MV, seed, 1e6);
  MV.sys.company.found(g, 'estudio', 'Pixel Pantano');
  const c = g.p.companies[0];
  c.value = value == null ? 1e7 : value; c.since = g.p.age - 3;
  return { g, c };
}

test('no se sale a bolsa sin valuación ni antigüedad', () => {
  const MV = load({ seed: 20 });
  const a = bigCo(MV, 20, 4e6);
  assert.equal(M(MV).canIpo(a.g, a.c.id).ok, false);
  assert.match(M(MV).ipo(a.g, a.c.id, 0.3), /5\.000\.000/);
  const b = bigCo(MV, 21); b.c.since = b.g.p.age - 1;
  assert.match(M(MV).canIpo(b.g, b.c.id).why, /3 años/);
  assert.equal(b.c.public, null);
});

test('salir a bolsa paga tu parte y la empresa cotiza con su propia sigla; el patrimonio cuenta solo tu parte', () => {
  const MV = load({ seed: 22 });
  const { g, c } = bigCo(MV, 22);
  const w0 = MV.netWorth(g), m0 = g.p.money;
  const msg = M(MV).ipo(g, c.id, 0.3);
  assert.ok(!BAD_TEXT.test(msg), msg);
  assert.equal(g.p.money, m0 + 3000000);
  assert.match(c.public.ticker, /^[A-Z]{4}$/);
  assert.ok(!IDS.includes(c.public.ticker));
  assert.equal(c.public.stake, 0.7);
  const row = M(MV).list(g).find((x) => x.id === c.public.ticker);
  assert.ok(row, 'aparece en la bolsa'); assert.equal(row.price, 10);
  assert.equal(MV.netWorth(g), w0, 'cobrar el 30 % y quedarte con el 70 % no cambia el patrimonio');
  assert.match(M(MV).buy(g, c.public.ticker, 10), /recomprar/i);
  assert.match(M(MV).ipo(g, c.id, 0.3), /ya cotiza/i);
});

test('dos años de pérdidas llaman a la junta y si te echan te quedan las acciones', () => {
  const MV = load({ seed: 23 });
  const { g, c } = bigCo(MV, 23);
  MV.sys.company.hire(g, c.id, 'programador', 0);
  M(MV).ipo(g, c.id, 0.4);
  const t = c.public.ticker;
  MV.sys.company.register('estudio', { revenue: () => 0 });
  MV.sys.company.inject(g, c.id, 900000);
  for (let y = 0; y < 2; y++) { g.p.age++; g.queue = []; MV.sys.company.yearly(g); M(MV).yearly(g, { quiet: true }); }
  const v = g.queue.find((q) => q.id === 'junta_accionistas');
  assert.ok(v, 'llega la junta');
  g.queue = [v];
  const view = MV.EV.view(g);
  assert.equal(view.choices.length, 3); assert.ok(!BAD_TEXT.test(view.text), view.text);
  const value = c.value;
  MV.EV.choose(g, 2);
  assert.equal(MV.sys.company.get(g, c.id), null, 'ya no la manejas');
  assert.equal(g.p.portfolio[t].shares, 600000, 'te quedan tus acciones');
  assert.ok(M(MV).list(g).find((x) => x.id === t), 'sigue cotizando');
  assert.ok(Math.abs(M(MV).portfolioValue(g) - value * 0.6) <= 1, 'tus acciones valen tu parte');
  M(MV).yearly(g, { quiet: true });
  assert.ok(M(MV).price(g, t) > 0);
});

test('recomprar todo deja de cotizar y vender o quebrar la saca de la bolsa', () => {
  const MV = load({ seed: 24 });
  const { g, c } = bigCo(MV, 24);
  M(MV).ipo(g, c.id, 0.2);
  const t = c.public.ticker, m = g.p.money;
  assert.ok(!BAD_TEXT.test(M(MV).buyback(g, c.id, 0.2)));
  assert.equal(g.p.money, m - Math.round(c.value * 0.2 * 1.1));
  assert.equal(c.public, null);
  assert.ok(!M(MV).list(g).find((x) => x.id === t), 'dejó de cotizar');
  const x = bigCo(MV, 25);
  M(MV).ipo(x.g, x.c.id, 0.3);
  const t2 = x.c.public.ticker;
  MV.sys.company.sell(x.g, x.c.id);
  assert.ok(!M(MV).list(x.g).find((r) => r.id === t2), 'vender la empresa la saca de la bolsa');
});

test('el dato privilegiado hace ganar y a veces termina en juicio', () => {
  const MV = load({ seed: 26 });
  calm(MV);
  const g = investor(MV, 26, 100000);
  g.world = null;
  MV.EV.push(g, 'dato_privilegiado', { stock: 'VOLT', source: 'un amigo' }, true);
  const v = MV.EV.view(g);
  assert.equal(v.choices.length, 3); assert.ok(!BAD_TEXT.test(v.text), v.text);
  const k0 = g.p.karma, p0 = M(MV).price(g, 'VOLT');
  const res = MV.EV.choose(g, 0);
  assert.ok(!BAD_TEXT.test(res.msg), res.msg);
  assert.ok(g.p.portfolio.VOLT.shares > 0);
  assert.equal(g.p.karma, k0 - 6);
  M(MV).yearly(g, { quiet: true });
  assert.ok(M(MV).price(g, 'VOLT') >= p0 * 1.4, 'sube al año siguiente');
  let probes = 0;
  for (let i = 0; i < 200; i++) {
    const h = investor(MV, 900 + i, 100000);
    MV.EV.push(h, 'dato_privilegiado', { stock: 'BSUR', source: 'tu cuñado' }, true);
    MV.EV.choose(h, 0);
    if ((h.later || []).some((x) => x.id === 'investigacion_bolsa')) probes++;
  }
  assert.ok(probes > 25 && probes < 80, 'investigaciones: ' + probes);
  const j = investor(MV, 27, 100000);
  MV.EV.push(j, 'investigacion_bolsa', { gain: 10000 }, true);
  const iv = MV.EV.view(j);
  assert.ok(!BAD_TEXT.test(iv.text), iv.text);
  MV.EV.choose(j, iv.choices[iv.choices.length - 1].i);
  assert.equal(j.p.money, 90000);
  assert.ok(j.queue.some((q) => q.id === 'juicio'), 'termina en juicio');
  const n = investor(MV, 28, 100000);
  MV.EV.push(n, 'dato_privilegiado', { stock: 'VOLT', source: 'un amigo' }, true);
  const k1 = n.p.karma; MV.EV.choose(n, 2);
  assert.equal(n.p.karma, k1 + 4, 'denunciarlo da karma');
});
