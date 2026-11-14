/* El gato que habla: llegada, consejo, comentario, travesuras, decisiones y final. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
const KINDS = ['filosofo', 'diva', 'aristocrata'];

const T = (MV) => MV.sys.talkcat;
/** Partida con el jugador a esa edad, sin cola y sin mascotas. */
function game(MV, seed, age) {
  const g = MV.newGame({ seed }); g.p.age = age == null ? 30 : age; g.queue = [];
  g.p.rels = g.p.rels.filter((r) => r.type !== 'mascota');
  return g;
}
/** Agrega un gato con esa relación. */
function cat(MV, g, rel, extra) {
  const n = MV.newPet(g, 'gato', { age: 3 }); Object.assign(n, extra || {});
  return { n, r: MV.addRel(g, n, 'mascota', rel == null ? 70 : rel) };
}
/** Partida con un gato que ya habla, de la personalidad pedida. */
function talker(MV, seed, kind, age) {
  const g = game(MV, seed, age); const c = cat(MV, g, 90);
  T(MV).grant(g, c.n, 'karma'); if (kind) c.n.talk.kind = kind;
  g.queue = [];
  return { g, n: c.n, r: c.r };
}
const talking = (g) => Object.values(g.people).filter((n) => n.talk);

// ——— Tarea 1: voces, llegada y vida ———
test('la lealtad hace hablar a tu gato a los 5 años seguidos', () => {
  const MV = load({ seed: 1 });
  const g = game(MV, 1); g.p.karma = 0;
  const { n, r } = cat(MV, g, 85);
  for (let i = 0; i < 4; i++) T(MV).yearly(g);
  assert.equal(n.talk, undefined); assert.equal(r.loyal, 4);
  T(MV).yearly(g);
  assert.equal(n.talk.how, 'lealtad'); assert.equal(n.talk.since, g.p.age);
  assert.ok(KINDS.includes(n.talk.kind));
  assert.equal(g.p.flags.gatoHabla, n.id);
  assert.equal(T(MV).cat(g), n);
  assert.ok(g.achLife.includes('gato_habla'));
  const info = g.queue.find((q) => q.info && /Tu gat[oa] habló/.test(q.info.title));
  assert.ok(info, 'falta el aviso');
  assert.ok(info.info.text.includes(n.first) && !BAD_TEXT.test(info.info.text), info.info.text);
  assert.equal(info.info.title, n.gender === 'f' ? 'Tu gata habló' : 'Tu gato habló');
});

test('la lealtad vuelve a cero si un año cierra por debajo de 80', () => {
  const MV = load({ seed: 2 });
  const g = game(MV, 2); g.p.karma = 0;
  const { n, r } = cat(MV, g, 85);
  for (let i = 0; i < 4; i++) T(MV).yearly(g);
  r.rel = 79; T(MV).yearly(g);
  assert.equal(r.loyal, 0);
  r.rel = 85;
  for (let i = 0; i < 4; i++) T(MV).yearly(g);
  assert.equal(n.talk, undefined, 'todavía no');
  T(MV).yearly(g);
  assert.equal(n.talk.how, 'lealtad');
});

test('el tercer rescate hace hablar al rescatado más reciente', () => {
  const MV = load({ seed: 3 });
  const g = game(MV, 3); g.p.karma = 0;
  const stray = (gg, since) => { const c = cat(MV, gg, 50, { street: 'vivía detrás de una panadería' }); c.r.since = since; T(MV).noteRescue(gg); return c; };
  const a = stray(g, 20), b = stray(g, 25);
  T(MV).yearly(g);
  assert.equal(talking(g).length, 0, 'con dos rescates nadie habla');
  const c = stray(g, 30);
  T(MV).yearly(g);
  assert.equal(c.n.talk.how, 'rescate'); assert.equal(a.n.talk, undefined); assert.equal(b.n.talk, undefined);
  // A igualdad de fecha, el último de tus relaciones.
  const h = game(MV, 31); h.p.karma = 0;
  stray(h, 20); stray(h, 20); const last = stray(h, 20);
  T(MV).yearly(h);
  assert.equal(h.p.flags.gatoHabla, last.n.id);
  // Si ya no queda ninguno contigo, la meta espera al próximo rescate.
  const k = game(MV, 32); k.p.karma = 0;
  [stray(k, 20), stray(k, 21), stray(k, 22)].forEach((x) => MV.removeRel(k, x.n.id));
  T(MV).yearly(k);
  assert.equal(talking(k).length, 0);
  const next = stray(k, 30);
  T(MV).yearly(k);
  assert.equal(next.n.talk.how, 'rescate');
});

test('los tres caminos de rescate cuentan', () => {
  const MV = load({ seed: 4 });
  const g = game(MV, 4, 30); g.p.housing = 'alquiler'; g.p.money = 5000;
  MV.doAction(g, MV.ACTS.find((a) => a.id === 'gato_callejero'), 'joven');
  assert.equal(g.p.counters.gatosRescatados, 1);
  g.queue = []; MV.EV.push(g, 'gato_sigue', { group: 'adulto' }, true);
  const v = MV.EV.view(g);
  MV.EV.choose(g, v.choices.find((c) => /Adoptar/.test(c.label)).i);
  assert.equal(g.p.counters.gatosRescatados, 2);
  T(MV).noteRescue(g);
  assert.equal(T(MV).rescued(g), 3);
  // El refugio también cuenta (el gato llega 1 de cada 12 veces).
  const refugio = MV.ACTS.find((a) => a.id === 'refugio');
  for (let s = 0; s < 300; s++) {
    MV.rng.seed(4100 + s);
    const h = game(MV, 4100 + s, 30);
    MV.doAction(h, refugio);
    if (MV.rels(h, 'mascota').length) { assert.equal(h.p.counters.gatosRescatados, 1); return; }
  }
  assert.fail('el refugio nunca dio un gato');
});

test('en una partida sin contador, los rescates se cuentan desde tus gatos', () => {
  const MV = load({ seed: 5 });
  const g = game(MV, 5); delete g.p.counters.gatosRescatados;
  const a = cat(MV, g, 50, { street: 'dormía arriba de los autos' }); cat(MV, g, 50, { street: 'era el jefe del callejón' });
  cat(MV, g, 50); // un gato comprado no cuenta
  a.n.alive = false; // uno que murió sigue contando
  assert.equal(T(MV).rescued(g), 2);
  cat(MV, g, 50, { street: 'robaba salchichas' }); T(MV).noteRescue(g);
  assert.equal(T(MV).rescued(g), 3); assert.equal(g.p.counters.gatosRescatados, 3);
  T(MV).noteRescue(g);
  assert.equal(g.p.counters.gatosRescatados, 4);
});

test('con buen karma habla el gato que más te quiere', () => {
  const MV = load({ seed: 6 });
  const g = game(MV, 6); g.p.karma = 59;
  const a = cat(MV, g, 50), b = cat(MV, g, 70);
  T(MV).yearly(g);
  assert.equal(talking(g).length, 0, 'con karma 59 nadie');
  g.p.karma = 60; T(MV).yearly(g);
  assert.equal(b.n.talk.how, 'karma'); assert.equal(a.n.talk, undefined);
  const h = game(MV, 61); h.p.karma = 80;
  const first = cat(MV, h, 70); cat(MV, h, 70);
  T(MV).yearly(h);
  assert.equal(h.p.flags.gatoHabla, first.n.id, 'a igualdad, el primero');
  const k = game(MV, 62); k.p.karma = 80;
  MV.addRel(k, MV.newPet(k, 'perro', { age: 3 }), 'mascota', 99);
  T(MV).yearly(k);
  assert.equal(talking(k).length, 0, 'solo hablan los gatos');
});

test('si se cumplen varias metas gana la primera', () => {
  const MV = load({ seed: 7 });
  const g = game(MV, 7); g.p.karma = 60;
  const a = cat(MV, g, 85); a.r.loyal = 4;
  const b = cat(MV, g, 95);
  T(MV).yearly(g);
  assert.equal(a.n.talk.how, 'lealtad'); assert.equal(b.n.talk, undefined);
});

test('dos gatos igual de leales: habla uno solo y siempre el mismo', () => {
  const pick = (rel2) => {
    const MV = load({ seed: 8 });
    const g = game(MV, 8); g.p.karma = 0;
    const a = cat(MV, g, 85), b = cat(MV, g, rel2);
    a.r.loyal = 4; b.r.loyal = 4;
    T(MV).yearly(g);
    assert.equal(talking(g).length, 1);
    return a.n.talk ? 0 : 1;
  };
  assert.equal(pick(85), pick(85));
  assert.equal(pick(85), 0, 'empate total: el primero de tus relaciones');
  assert.equal(pick(92), 1, 'a igual lealtad, el de mejor relación');
});

test('antes de los 6 años no habla', () => {
  const MV = load({ seed: 9 });
  const g = game(MV, 9, 4); g.p.karma = 80;
  const { n } = cat(MV, g, 70);
  T(MV).yearly(g);
  assert.equal(n.talk, undefined);
  g.p.age = 6; T(MV).yearly(g);
  assert.equal(n.talk.how, 'karma');
});

test('uno por vida', () => {
  const MV = load({ seed: 10 });
  const { g, n } = talker(MV, 10); g.p.karma = 80;
  const other = cat(MV, g, 95); other.r.loyal = 10;
  T(MV).yearly(g);
  assert.equal(other.n.talk, undefined);
  MV.sys.people.die(g, n, 'vejez'); g.queue = [];
  assert.equal(T(MV).cat(g), null);
  T(MV).yearly(g); T(MV).yearly(g);
  assert.equal(other.n.talk, undefined, 'tampoco después de su muerte');
  assert.equal(talking(g).length, 1);
});

test('salen las tres personalidades', () => {
  const MV = load({ seed: 11 });
  const seen = new Set();
  for (let s = 0; s < 60; s++) { MV.rng.seed(1100 + s); seen.add(talker(MV, 1100 + s).n.talk.kind); }
  assert.deepEqual([...seen].sort(), KINDS.slice().sort());
  const { n } = talker(MV, 11, 'filosofo');
  n.gender = 'f'; assert.equal(T(MV).kindName(n), 'filósofa gruñona');
  n.gender = 'm'; assert.equal(T(MV).kindName(n), 'filósofo gruñón');
  n.talk.kind = 'diva'; assert.equal(T(MV).kindName(n), 'divo dramático');
  n.gender = 'f'; assert.equal(T(MV).kindName(n), 'diva dramática');
  n.talk.kind = 'aristocrata'; assert.equal(T(MV).kindName(n), 'aristócrata venida a menos');
});

test('vive más y no muere por accidente', () => {
  const MV = load({ seed: 12 });
  const spans = new Set();
  for (let s = 0; s < 60; s++) {
    MV.rng.seed(1200 + s);
    const { n } = talker(MV, 1200 + s);
    assert.ok(n.lifespan >= 24 && n.lifespan <= 30, 'vida ' + n.lifespan);
    spans.add(n.lifespan);
  }
  assert.ok(spans.size >= 4, 'la vida varía');
  const g = game(MV, 13); const old = cat(MV, g, 90, { age: 29 });
  T(MV).grant(g, old.n, 'karma');
  assert.equal(old.n.lifespan, 32);
  for (let s = 0; s < 400; s++) {
    MV.rng.seed(1300 + s);
    const t = talker(MV, 1300 + s); t.n.age = 5;
    MV.sys.people.yearly(t.g);
    assert.ok(t.n.alive, 'murió por accidente con la semilla ' + s);
  }
});

/** Recorre una voz y llama a cada frase. Devuelve la forma (claves) para comparar entre voces. */
function walk(node, path, onLine) {
  if (typeof node === 'function') { onLine(node, path); return 'frase'; }
  if (Array.isArray(node)) { node.forEach((x, i) => walk(x, `${path}[${i}]`, onLine)); return 'lista'; }
  if (node && typeof node === 'object') {
    const out = {};
    Object.keys(node).sort().forEach((k) => { out[k] = walk(node[k], path ? `${path}.${k}` : k, onLine); });
    return out;
  }
  return typeof node;
}

test('todas las frases de las tres voces salen limpias', () => {
  const MV = load({ seed: 14 });
  const V = MV.CAT_VOICES;
  assert.deepEqual(Object.keys(V).sort(), KINDS.slice().sort());
  const d = { years: 3, cond: 'gripe', amount: 12345, name: 'Ana', title: 'Cajera', label: 'hermana' };
  const shapes = KINDS.map((kind) => {
    let shape = null;
    ['m', 'f'].forEach((pg) => ['m', 'f'].forEach((cg) => {
      const { g, n } = talker(MV, 14, kind); g.p.gender = pg; n.gender = cg;
      const c = T(MV).ctx(g, n, d);
      shape = walk(V[kind], '', (fn, path) => {
        const s = fn(c);
        assert.ok(typeof s === 'string' && s.length > 10, `${kind}.${path}: ${s}`);
        assert.ok(!BAD_TEXT.test(s), `${kind}.${path}: ${s}`);
        assert.ok(!s.includes('"'), `${kind}.${path} lleva comillas dobles: ${s}`);
      });
    }));
    assert.ok(/\|/.test(V[kind].name) && typeof V[kind].intro === 'function', kind);
    return JSON.stringify(shape);
  });
  assert.equal(shapes[0], shapes[1]); assert.equal(shapes[1], shapes[2]);
  const { g, n } = talker(MV, 15);
  assert.deepEqual(T(MV).ctx(g, n).d, {});
});
