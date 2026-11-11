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
