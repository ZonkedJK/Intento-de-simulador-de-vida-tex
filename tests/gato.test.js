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
  g.log.push({ age: g.p.age, year: g.year, items: [] }); // su presentación queda en el año anterior del diario
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

// ——— Tarea 2: consejo del año ———
/** Gato que habla en una vida sin ningún riesgo. */
function calm(MV, seed, kind) {
  const t = talker(MV, seed, kind, 30); const p = t.g.p;
  p.stats.health = 80; p.stress = 10; p.loans = []; p.money = 10000; p.dirty = 0; p.prison = null; p.wanted = 0; p.conds = [];
  p.job = null; p.rels = p.rels.filter((r) => !['pareja', 'conyuge'].includes(r.type));
  return t;
}
const partner = (MV, g, rel) => { const n = MV.newNPC(g, { age: 30 }); MV.addRel(g, n, 'pareja', rel); return n; };

test('cada riesgo aislado da su consejo con el dato', () => {
  const MV = load({ seed: 20 });
  const U = MV.U;
  /** Arma el riesgo, comprueba su id y que el consejo nombre el dato. */
  const check = (id, setup, datum) => KINDS.forEach((kind, i) => {
    const { g, n } = calm(MV, 200 + i, kind);
    assert.equal(T(MV).risk(g), null, 'la base no tiene riesgos');
    const d = setup(g);
    g.queue = [];
    const r = T(MV).risk(g);
    assert.equal(r && r.id, id, `${kind}: esperaba ${id}`);
    const s = T(MV).advise(g);
    assert.ok(s.startsWith(`${n.first}: "`) && s.endsWith('"'), s);
    assert.ok(!BAD_TEXT.test(s), s);
    const want = typeof datum === 'function' ? datum(g, d) : datum;
    if (want) assert.ok(s.includes(want), `${kind}/${id}: falta "${want}" en: ${s}`);
  });
  check('preso', (g) => { g.p.prison = { left: 4, total: 6, crime: 'Robo', behavior: 50, since: 28 }; }, '4 años');
  check('profugo', (g) => { g.p.wanted = 3; }, '3 años');
  check('salud', (g) => { g.p.stats.health = 20; });
  check('salud', (g) => { MV.sys.health.add(g, 'apendicitis'); }, 'apendicitis');
  check('deudas', (g) => { g.p.money = 5000; g.p.loans.push({ name: 'Préstamo', left: 40000, pay: 9000, start: g.p.age }); }, U.money(9000));
  check('deudas', (g) => { g.p.money = -700; }, U.money(700));
  check('sucio', (g) => { g.p.dirty = 80000; }, U.money(80000));
  check('pareja', (g) => partner(MV, g, 20), (g, n) => n.first);
  check('trabajo', (g) => { MV.sys.career.hire(g, MV.jobById('cajero')); g.p.job.perf = 10; }, (g) => MV.sys.career.title(g.p));
  check('estres', (g) => { g.p.stress = 80; });
  check('seguro', (g) => { g.p.age = 55; });
  // Con seguro de salud, los 55 años no son un riesgo.
  const { g } = calm(MV, 210); g.p.age = 55; g.p.insurance = { vida: 0, salud: true, hogar: {} };
  assert.equal(T(MV).risk(g), null);
});

test('una hipoteca que puedes pagar no es un riesgo', () => {
  const MV = load({ seed: 21 });
  const { g } = calm(MV, 21); g.p.money = 50000;
  g.p.loans.push({ name: 'Hipoteca', left: 300000, pay: 9000, start: g.p.age });
  assert.equal(T(MV).risk(g), null);
  g.p.loans.push({ name: 'Préstamo estudiantil', left: 90000, pay: 80000, start: g.p.age + 3 });
  assert.equal(T(MV).risk(g), null, 'una cuota que aún no empezó no cuenta');
});

test('con dos riesgos gana el primero de la lista', () => {
  const MV = load({ seed: 22 });
  let { g } = calm(MV, 22); g.p.stress = 80; g.p.dirty = 80000;
  assert.equal(T(MV).risk(g).id, 'sucio');
  ({ g } = calm(MV, 23)); g.p.stats.health = 20; g.p.prison = { left: 2, total: 2, crime: 'Robo', behavior: 50, since: 30 };
  assert.equal(T(MV).risk(g).id, 'preso');
  ({ g } = calm(MV, 24)); g.p.wanted = 2; g.p.money = -50;
  assert.equal(T(MV).risk(g).id, 'profugo');
});

test('sin riesgos dice una frase suya', () => {
  const MV = load({ seed: 25 });
  const ADVICE = ['preso', 'profugo', 'salud', 'deudas', 'sucio', 'pareja', 'trabajo', 'estres', 'seguro'];
  KINDS.forEach((kind, i) => {
    const V = MV.CAT_VOICES[kind];
    assert.ok(V.idle.length >= 4, kind + ' tiene pocas frases sueltas');
    assert.deepEqual(Object.keys(V.advice).sort(), ADVICE.slice().sort());
    const { g, n } = calm(MV, 250 + i, kind);
    assert.equal(T(MV).risk(g), null);
    const idle = V.idle.map((f) => `${n.first}: "${f(T(MV).ctx(g, n))}"`);
    const seen = new Set();
    for (let s = 0; s < 40; s++) { const x = T(MV).advise(g); assert.ok(idle.includes(x), x); seen.add(x); }
    assert.ok(seen.size >= 3, 'varía');
  });
});

test('el consejo está en su ficha, una vez por año, también en prisión', () => {
  const MV = load({ seed: 26 });
  const { g, n, r } = calm(MV, 26); r.acts = {};
  const common = cat(MV, g, 90);
  const ids = (rr, nn) => MV.sys.rels.actions(g, rr, nn).map((a) => a.id);
  assert.ok(ids(r, n).includes('gato_consejo'));
  assert.ok(ids(r, n).indexOf('gato_consejo') < ids(r, n).indexOf('regalar_mascota'), 'antes de dar en adopción');
  assert.ok(!ids(common.r, common.n).includes('gato_consejo'));
  assert.deepEqual(T(MV).actions(g, common.r, common.n), []);
  const act = MV.sys.rels.actions(g, r, n).find((a) => a.id === 'gato_consejo');
  assert.equal(act.label, 'Pedirle consejo'); assert.equal(act.limit, 1);
  const before = JSON.stringify([g.p.stats, g.p.stress, g.p.karma, g.p.money, r.rel]);
  const res = MV.doAction(g, act, undefined, r.acts);
  assert.ok(!res.blocked && res.msg.startsWith(n.first), res.msg);
  assert.equal(JSON.stringify([g.p.stats, g.p.stress, g.p.karma, g.p.money, r.rel]), before, 'el consejo no cambia nada');
  assert.ok(MV.doAction(g, act, undefined, r.acts).blocked, 'una vez por año');
  g.p.prison = { left: 5, total: 5, crime: 'Robo', behavior: 50, since: 30 }; g.p.yearActs = {}; r.acts = {};
  const jail = MV.sys.rels.actions(g, r, n).find((a) => a.id === 'gato_consejo');
  assert.ok(jail, 'también en prisión');
  assert.ok(MV.doAction(g, jail, undefined, r.acts).msg.includes('5 años'));
});

// ——— Tarea 3: comentario en el diario ———
/** Lo que dijo el gato en el último año del diario. */
const said = (g, n) => g.log[g.log.length - 1].items.map((i) => i.t).filter((t) => t.startsWith(`${n.first}: "`));
const idleLines = (MV, g, n) => MV.CAT_VOICES[n.talk.kind].idle.map((f) => T(MV).say(n, f(T(MV).ctx(g, n))));

test('comenta cada hecho del año', () => {
  const MV = load({ seed: 30 });
  /** Provoca el hecho, cierra el año y devuelve el único comentario. */
  const check = (id, cause, datum) => KINDS.forEach((kind, i) => {
    const { g, n } = calm(MV, 300 + i, kind);
    const d = cause(g);
    g.queue = [];
    const f = T(MV).fact(g, n.talk.snap);
    assert.equal(f && f.id, id, `${kind}: esperaba ${id}`);
    T(MV).yearly(g);
    const lines = said(g, n);
    assert.equal(lines.length, 1, `${kind}/${id}: ${lines.join(' | ')}`);
    assert.ok(!idleLines(MV, g, n).includes(lines[0]), 'no es una frase suelta');
    assert.equal(lines[0], T(MV).say(n, MV.CAT_VOICES[kind].facts[id](T(MV).ctx(g, n, f.d))));
    assert.ok(!BAD_TEXT.test(lines[0]), lines[0]);
    const want = typeof datum === 'function' ? datum(g, d) : datum;
    if (want) assert.ok(lines[0].includes(want), `${kind}/${id}: falta "${want}" en: ${lines[0]}`);
    // El año siguiente, sin novedades, no repite el hecho.
    g.log.push({ age: g.p.age + 1, year: g.year + 1, items: [] });
    assert.equal(T(MV).fact(g, n.talk.snap), null, 'el hecho ya quedó registrado');
  });
  check('carcel', (g) => { MV.sys.crime.jail(g, 3, 'Robo'); });
  check('muerte', (g) => { const s = MV.newNPC(g, { age: 40 }); MV.addRel(g, s, 'hermano', 70); T(MV).cat(g).talk.snap = T(MV).snapshot(g); MV.sys.people.die(g, s, 'un infarto'); return s; }, (g, s) => s.first);
  check('boda', (g) => { const s = MV.newNPC(g, { age: 30 }); MV.addRel(g, s, 'conyuge', 80); g.p.counters.bodas = 1; return s; }, (g, s) => s.first);
  check('divorcio', (g) => { g.p.counters.divorcios = 1; });
  check('hijo', (g) => { const k = MV.newNPC(g, { age: 0, last: g.p.last }); MV.addRel(g, k, 'hijo', 90); return k; }, (g, k) => k.first);
  check('despido', (g) => { MV.sys.career.hire(g, MV.jobById('cajero')); T(MV).cat(g).talk.snap = T(MV).snapshot(g); MV.sys.career.fire(g, 'Recorte de personal.'); });
  check('ascenso', (g) => { MV.sys.career.hire(g, MV.jobById('cajero')); T(MV).cat(g).talk.snap = T(MV).snapshot(g); g.p.job.level++; }, (g) => MV.sys.career.title(g.p));
  check('casa', (g) => { g.p.assets.push({ id: 'casa1', type: 'casa', kind: 'Casa', icon: '🏡', name: 'Casa de prueba', value: 100000, cond: 80 }); });
  KINDS.forEach((kind) => assert.deepEqual(Object.keys(MV.CAT_VOICES[kind].facts).sort(),
    ['ascenso', 'boda', 'carcel', 'casa', 'despido', 'divorcio', 'hijo', 'muerte']));
});

test('con dos hechos gana el primero', () => {
  const MV = load({ seed: 31 });
  const { g, n } = calm(MV, 31, 'diva');
  const s = MV.newNPC(g, { age: 30 }); MV.addRel(g, s, 'conyuge', 80); g.p.counters.bodas = 1;
  MV.sys.crime.jail(g, 3, 'Robo'); g.queue = [];
  T(MV).yearly(g);
  assert.deepEqual(said(g, n), [T(MV).say(n, MV.CAT_VOICES.diva.facts.carcel(T(MV).ctx(g, n, {})))]);
  // Cambiar de trabajo no es un ascenso.
  const t = calm(MV, 32); MV.sys.career.hire(t.g, MV.jobById('cajero')); t.n.talk.snap = T(MV).snapshot(t.g);
  MV.sys.career.hire(t.g, MV.jobById('programador'), 2);
  assert.equal(T(MV).fact(t.g, t.n.talk.snap), null);
});

test('un año tranquilo calla casi siempre', () => {
  const MV = load({ seed: 33 });
  let spoke = 0;
  for (let s = 0; s < 400; s++) {
    MV.rng.seed(3300 + s);
    const { g, n } = calm(MV, 3300 + s);
    T(MV).yearly(g);
    const lines = said(g, n);
    assert.ok(lines.length <= 1, 'más de un comentario en el año');
    if (lines.length) { spoke++; assert.ok(idleLines(MV, g, n).includes(lines[0]), lines[0]); }
  }
  assert.ok(spoke / 400 > 0.17 && spoke / 400 < 0.33, 'comentó ' + spoke / 400);
});

test('el año en que empieza a hablar no comenta', () => {
  const MV = load({ seed: 34 });
  const g = game(MV, 34); g.p.karma = 0;
  const { n, r } = cat(MV, g, 85); r.loyal = 4;
  const s = MV.newNPC(g, { age: 30 }); MV.addRel(g, s, 'conyuge', 80); g.p.counters.bodas = 1;
  T(MV).yearly(g);
  assert.ok(n.talk && n.talk.snap, 'guarda la foto del año al empezar a hablar');
  const intro = T(MV).say(n, MV.CAT_VOICES[n.talk.kind].intro(T(MV).ctx(g, n)));
  assert.deepEqual(said(g, n), [intro], 'solo su presentación');
  assert.equal(T(MV).fact(g, n.talk.snap), null, 'la boda de ese año ya no es novedad');
});

test('un gato de una partida vieja no rompe el cierre del año', () => {
  const MV = load({ seed: 35 });
  const g = game(MV, 35);
  const { n } = cat(MV, g, 90); n.talk = { kind: 'diva' };
  g.p.flags.gatoHabla = n.id; g.p.counters = {}; delete g.p.loans; g.p.jobs = [];
  T(MV).yearly(g);
  assert.deepEqual(said(g, n), []);
  assert.ok(n.talk.snap && Array.isArray(n.talk.snap.dead), 'deja guardada la foto del año');
  assert.ok(!BAD_TEXT.test(T(MV).advise(g)));
  // Marca perdida: nadie habla, y nada falla.
  const h = game(MV, 36);
  const c = cat(MV, h, 90); c.n.talk = { kind: 'filosofo' };
  delete h.p.flags; delete h.p.counters;
  assert.equal(T(MV).cat(h), null);
  T(MV).yearly(h);
  assert.equal(T(MV).rescued(h), 0);
});
