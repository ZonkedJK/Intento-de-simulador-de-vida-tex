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

const ids = (MV, g, r, n) => MV.sys.rels.actions(g, r, n).map((a) => a.id);

test('la pareja tiene acciones románticas nuevas', () => {
  const MV = load();
  const { g, n, r } = withPerson(MV, 'pareja', 30);
  const list = ids(MV, g, r, n);
  ['cena_casera', 'poema', 'bailar', 'series', 'sorpresa', 'desayuno', 'convivir', 'espiar_celular'].forEach((id) => assert.ok(list.includes(id), 'falta ' + id));
});

test('mudarse juntos comparte los gastos y se termina al cortar', () => {
  const MV = load({ seed: 21 });
  const { g, n, r } = withPerson(MV, 'pareja', 30);
  g.p.housing = 'alquiler'; g.p.rent = MV.RENTALS[2];
  const before = MV.sys.money.livingCost(g);
  const a = MV.sys.rels.actions(g, r, n).find((x) => x.id === 'convivir');
  MV.doAction(g, a, undefined, r.acts = {});
  assert.equal(g.p.flags.convive, n.id);
  assert.ok(MV.sys.money.livingCost(g) < before, 'los gastos deberían bajar');
  assert.ok(!ids(MV, g, r, n).includes('convivir'), 'ya conviven');
  MV.sys.rels.breakUp(g, n);
  assert.equal(g.p.flags.convive, undefined);
});

test('renovar los votos requiere años de casados y cuesta dinero', () => {
  const MV = load({ seed: 22 });
  const { g, n, r } = withPerson(MV, 'conyuge', 40);
  r.since = g.p.age - 2;
  assert.ok(!ids(MV, g, r, n).includes('votos'), 'con 2 años de casados no');
  r.since = g.p.age - 10;
  const a = MV.sys.rels.actions(g, r, n).find((x) => x.id === 'votos');
  assert.ok(a);
  const m = g.p.money, rel = r.rel;
  MV.doAction(g, a, undefined, r.acts = {});
  assert.ok(g.p.money < m && r.rel > rel);
});

test('con los hijos hay tareas, parque y deporte; con padres mayores, llevarlos al médico', () => {
  const MV = load({ seed: 23 });
  const { g, n, r } = withPerson(MV, 'hijo', 9);
  g.p.skills.deporte = 60;
  ['tarea', 'parque', 'ensenar_deporte'].forEach((id) => assert.ok(ids(MV, g, r, n).includes(id), 'falta ' + id));
  const s0 = n.smarts;
  MV.doAction(g, MV.sys.rels.actions(g, r, n).find((x) => x.id === 'tarea'), undefined, r.acts = {});
  assert.ok(n.smarts > s0, 'la tarea sube la inteligencia del hijo');
  const o = withPerson(MV, 'padre', 72, 24);
  o.n.health = 40;
  MV.doAction(o.g, MV.sys.rels.actions(o.g, o.r, o.n).find((x) => x.id === 'medico_familiar'), undefined, o.r.acts = {});
  assert.ok(o.n.health > 40);
});

test('amigos y familia tienen planes nuevos', () => {
  const MV = load();
  const { g, n, r } = withPerson(MV, 'amigo', 30);
  ['comer_afuera', 'cine_juntos', 'gym_juntos', 'consejo', 'escuchar', 'prestar'].forEach((id) => assert.ok(ids(MV, g, r, n).includes(id), 'falta ' + id));
  g.p.flags.emigro = true;
  assert.ok(ids(MV, g, r, n).includes('videollamada'));
});

const trip = (MV) => MV.ACTS.find((a) => a.id === 'vacaciones');

test('las vacaciones preguntan con quién vas', () => {
  const MV = load();
  const { g, n } = withPerson(MV, 'pareja', 30);
  const comp = trip(MV).opts2(g, 'paris');
  assert.ok(comp.some((c) => c.id === 'solo'));
  assert.ok(comp.some((c) => c.id === n.id), 'la pareja debería poder viajar');
});

test('viajar con la pareja cobra doble y sube la relación', () => {
  const MV = load({ seed: 31 });
  const { g, n, r } = withPerson(MV, 'pareja', 30);
  const cost = MV.DESTINATIONS.find((d) => d.id === 'paris').cost;
  const m = g.p.money, rel = r.rel;
  const res = MV.doAction(g, trip(MV), 'paris', undefined, n.id);
  assert.equal(g.p.money, m - cost * 2);
  assert.ok(r.rel - rel >= 8, 'relación +' + (r.rel - rel));
  assert.match(res.msg, new RegExp(n.first));
});

test('viajar solo cobra un pasaje y un compañero inexistente cuenta como solo', () => {
  const MV = load({ seed: 32 });
  const { g } = withPerson(MV, 'amigo', 30);
  const cost = MV.DESTINATIONS.find((d) => d.id === 'tokio').cost;
  let m = g.p.money;
  MV.doAction(g, trip(MV), 'tokio', undefined, 'solo');
  assert.equal(g.p.money, m - cost);
  g.p.yearActs = {};
  m = g.p.money;
  const res = MV.doAction(g, trip(MV), 'tokio', undefined, 'n-no-existe');
  assert.equal(g.p.money, m - cost);
  assert.ok(!BAD_TEXT.test(res.msg));
});
