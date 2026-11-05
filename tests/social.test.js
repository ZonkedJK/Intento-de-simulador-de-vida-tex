/* Regalos, acciones nuevas de relaciones y viajes con compañía. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;

function withPerson(MV, type, age, seed) {
  const g = MV.newGame({ seed: seed || 1 });
  g.p.age = 30; g.p.money = 1e7;
  const n = MV.newNPC(g, { age, money: 1000, traits: ['tranquilo', 'leal'] });
  const r = MV.addRel(g, n, type, 50);
  return { g, n, r };
}

test('hay 35 regalos o más, con ids únicos y al menos 4 grupos', () => {
  const MV = load();
  assert.ok(MV.GIFTS.length >= 35, 'regalos: ' + MV.GIFTS.length);
  assert.equal(new Set(MV.GIFTS.map((x) => x.id)).size, MV.GIFTS.length);
  assert.ok(new Set(MV.GIFTS.map((x) => x.group)).size >= 4);
  MV.GIFTS.forEach((x) => assert.ok(x.price > 0 && x.name && x.icon, 'regalo incompleto: ' + x.id));
});

test('solo se ofrecen los regalos que puedes pagar', () => {
  const MV = load();
  const { g, r } = withPerson(MV, 'amigo', 30);
  g.p.money = 120;
  const opts = MV.sys.rels.giftOptions(g, r.id);
  assert.ok(opts.length > 0 && opts.every((x) => x.price <= 120));
});

test('un juguete a un niño le encanta y el vino le cae fatal', () => {
  const MV = load();
  const { g, n } = withPerson(MV, 'hijo', 7);
  assert.equal(MV.giftReaction(n, MV.GIFTS.find((x) => x.id === 'consola'), 'hijo'), 'love');
  assert.equal(MV.giftReaction(n, MV.GIFTS.find((x) => x.id === 'vino'), 'hijo'), 'hate');
});

test('un regalo caro sube más la relación que uno barato, y uno odiado la baja', () => {
  const MV = load({ seed: 4 });
  const avg = (gift) => { let s = 0; for (let i = 0; i < 40; i++) { const { g, r } = withPerson(MV, 'amigo', 40, 100 + i); const before = r.rel; MV.sys.rels.giveGift(g, r.id, gift); s += r.rel - before; } return s / 40; };
  assert.ok(avg('reloj_suizo') > avg('caramelos'), 'caro > barato');
  const { g, r } = withPerson(MV, 'hijo', 8, 7);
  const before = r.rel;
  MV.sys.rels.giveGift(g, r.id, 'vino');
  assert.ok(r.rel < before, 'el vino a un niño baja la relación');
});

test('regalar cobra el precio y los regalos especiales funcionan', () => {
  const MV = load({ seed: 5 });
  const { g, r } = withPerson(MV, 'pareja', 30);
  const m0 = g.p.money;
  const msg = MV.sys.rels.giveGift(g, r.id, 'cachorro');
  assert.equal(g.p.money, m0 - MV.GIFTS.find((x) => x.id === 'cachorro').price);
  assert.ok(!BAD_TEXT.test(msg), msg);
  MV.GIFTS.forEach((gift) => {
    const { g: g2, r: r2 } = withPerson(MV, 'conyuge', 35, 9);
    const m = MV.sys.rels.giveGift(g2, r2.id, gift.id);
    assert.ok(typeof m === 'string' && m.length && !BAD_TEXT.test(m), gift.id + ': ' + m);
  });
});

test('la acción de regalo usa el menú desplegable en la interfaz', () => {
  const MV = load();
  const { g, n, r } = withPerson(MV, 'amigo', 30);
  const a = MV.sys.rels.actions(g, r, n).find((x) => x.id === 'regalo');
  assert.equal(a.ui, 'gift');
  assert.equal(a.relId, r.id);
});
