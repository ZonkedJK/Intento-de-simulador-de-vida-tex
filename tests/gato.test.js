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

// ——— Tarea 4: travesuras ———
/** Gato que habla listo para travesuras: valores fijos para medir los cambios. */
function mischief(MV, seed, opts) {
  opts = opts || {};
  MV.rng.seed(seed);
  const t = calm(MV, seed); const p = t.g.p;
  p.stats.happy = 50; p.karma = 0; p.money = opts.money == null ? 1000 : opts.money; t.r.rel = 50;
  if (opts.age) p.age = opts.age;
  if (opts.pg) p.gender = opts.pg;
  if (opts.cg) t.n.gender = opts.cg;
  t.g.queue = [];
  return t;
}
const friend = (MV, g, rel) => { const n = MV.newNPC(g, { age: 30 }); return { n, r: MV.addRel(g, n, 'amigo', rel == null ? 50 : rel) }; };

test('asaltar la pescadería', () => {
  const MV = load({ seed: 40 });
  let ok = 0;
  for (let s = 0; s < 300; s++) {
    const { g, n, r } = mischief(MV, 4000 + s);
    const crimes = g.p.counters.delitos || 0;
    const msg = T(MV).prank(g, 'pescaderia');
    assert.ok(msg.includes(n.first) && !BAD_TEXT.test(msg), msg);
    if (g.p.stats.happy === 56) { ok++; assert.equal(r.rel, 53); assert.equal(g.p.karma, 0); assert.equal(g.p.money, 1000); }
    else { assert.equal(g.p.karma, -1); assert.equal(g.p.money, 700); assert.equal(g.p.stats.happy, 50); assert.equal(r.rel, 50); }
    assert.equal(g.p.counters.delitos || 0, crimes, 'no cuenta como delito');
    assert.ok(!g.queue.some((q) => q.id === 'juicio'), 'no termina en juicio');
  }
  assert.ok(ok / 300 > 0.55 && ok / 300 < 0.75, 'éxitos ' + ok / 300);
});

test('la multa nunca deja el dinero en negativo', () => {
  const MV = load({ seed: 41 });
  let fails = 0;
  [{ money: 100 }, { money: 1000, age: 15 }].forEach((o) => {
    for (let s = 0; s < 120; s++) {
      const { g } = mischief(MV, 4100 + s, o);
      T(MV).prank(g, 'pescaderia');
      if (g.p.stats.happy === 56) continue;
      fails++;
      assert.equal(g.p.money, o.money, 'sin multa'); assert.equal(g.p.stats.happy, 47); assert.equal(g.p.karma, -1);
    }
  });
  assert.ok(fails > 40, 'fallos vistos ' + fails);
});

test('desordenarle la casa al vecino', () => {
  const MV = load({ seed: 42 });
  let enemies = 0;
  for (let s = 0; s < 300; s++) {
    const { g, n } = mischief(MV, 4200 + s);
    const before = MV.rels(g, 'enemigo').length;
    const msg = T(MV).prank(g, 'vecino');
    assert.ok(msg.includes(n.first) && !BAD_TEXT.test(msg), msg);
    assert.equal(g.p.stats.happy, 55); assert.equal(g.p.karma, -3);
    const now = MV.rels(g, 'enemigo');
    if (now.length > before) { enemies++; assert.equal(now.length, before + 1); assert.equal(now[now.length - 1].r.rel, 15); assert.ok(msg.includes(now[now.length - 1].n.first)); }
  }
  assert.ok(enemies / 300 > 0.2 && enemies / 300 < 0.4, 'enemigos ' + enemies / 300);
});

test('espiar a alguien', () => {
  const MV = load({ seed: 43 });
  const seen = { good: 0, bad: 0, caught: 0 };
  for (let s = 0; s < 400; s++) {
    const { g, n } = mischief(MV, 4300 + s);
    const f = friend(MV, g, 50);
    const msg = T(MV).prank(g, 'espiar', f.n.id);
    assert.ok(msg.includes(n.first) && msg.includes(f.n.first) && !BAD_TEXT.test(msg), msg);
    if (f.r.rel === 58) { seen.good++; assert.equal(g.p.stats.happy, 50); }
    else if (f.r.rel === 42) { seen.bad++; assert.equal(g.p.stats.happy, 50); }
    else { seen.caught++; assert.equal(f.r.rel, 38); assert.equal(g.p.stats.happy, 48); }
    assert.equal(g.p.karma, 0);
  }
  assert.ok(seen.good / 400 > 0.4 && seen.good / 400 < 0.6, JSON.stringify(seen));
  assert.ok(seen.bad / 400 > 0.2 && seen.bad / 400 < 0.4, JSON.stringify(seen));
  assert.ok(seen.caught / 400 > 0.12 && seen.caught / 400 < 0.28, JSON.stringify(seen));
});

test('espiar a quien ya no está no hace nada', () => {
  const MV = load({ seed: 44 });
  const { g, n } = mischief(MV, 44);
  const dead = friend(MV, g, 50); dead.n.alive = false;
  const stranger = MV.newNPC(g, { age: 30 });
  const state = () => JSON.stringify([g.p.rels, g.p.stats.happy, g.p.karma, g.p.money]);
  const before = state();
  ['no-existe', dead.n.id, n.id, stranger.id, undefined].forEach((id) => {
    const msg = T(MV).prank(g, 'espiar', id);
    assert.ok(typeof msg === 'string' && msg.length > 10 && !BAD_TEXT.test(msg), `${id}: ${msg}`);
    assert.equal(state(), before, 'nada cambia con ' + id);
  });
  assert.ok(!BAD_TEXT.test(T(MV).prank(g, 'otra-cosa')));
  assert.equal(state(), before);
});

test('la acción de travesuras', () => {
  const MV = load({ seed: 45 });
  const { g, n, r } = mischief(MV, 45); r.acts = {};
  const find = () => MV.sys.rels.actions(g, r, n).find((a) => a.id === 'gato_travesura');
  assert.ok(find(), 'está en su ficha');
  g.p.age = 11; assert.equal(find(), undefined, 'antes de los 12 no');
  g.p.age = 30; g.p.prison = { left: 2, total: 2, crime: 'Robo', behavior: 50, since: 30 };
  assert.equal(find(), undefined, 'en prisión no');
  g.p.prison = null;
  n.gender = 'f'; assert.equal(find().label, 'Planear algo con tu gata');
  n.gender = 'm'; assert.equal(find().label, 'Planear algo con tu gato');
  assert.equal(find().limit, 1);
  // Sin personas en tus relaciones no se puede espiar.
  const people = g.p.rels; g.p.rels = g.p.rels.filter((x) => x.id === n.id);
  assert.deepEqual(find().opts(g).map((o) => o.id), ['pescaderia', 'vecino']);
  g.p.rels = people;
  const f = friend(MV, g, 50);
  const spy = find().opts(g).find((o) => o.id === 'espiar:' + f.n.id);
  assert.ok(spy && spy.label === `Espiar a ${f.n.first}`, JSON.stringify(spy));
  assert.ok(!find().opts(g).some((o) => o.id === 'espiar:' + n.id), 'a las mascotas no se las espía');
  find().opts(g).forEach((o) => assert.ok(o.label && !BAD_TEXT.test(o.label + ' ' + (o.sub || '')), JSON.stringify(o)));
  // Espiar desde la acción cambia la relación con esa persona.
  const res = MV.doAction(g, find(), spy.id, r.acts);
  assert.ok(!res.blocked && f.r.rel !== 50, res.msg);
  assert.ok(MV.doAction(g, find(), 'vecino', r.acts).blocked, 'una vez por año');
  g.p.yearActs = {}; r.acts = {};
  assert.ok(!MV.doAction(g, find(), 'vecino', r.acts).blocked);
  assert.equal(g.p.karma, -3);
});

test('los textos de las travesuras nombran al gato con ambos géneros', () => {
  const MV = load({ seed: 46 });
  ['m', 'f'].forEach((pg) => ['m', 'f'].forEach((cg) => {
    for (let s = 0; s < 40; s++) {
      ['pescaderia', 'vecino', 'espiar'].forEach((kind) => {
        const { g, n } = mischief(MV, 4600 + s, { pg, cg, money: s % 2 ? 1000 : 0 });
        const f = friend(MV, g, 50);
        const msg = T(MV).prank(g, kind, f.n.id);
        assert.ok(msg.includes(n.first), msg); assert.ok(!BAD_TEXT.test(msg), msg);
      });
    }
  }));
});

// ——— Tarea 5: las 7 decisiones ———
const CAT_EVENTS = ['gato_celos', 'gato_regalo', 'gato_desaparece', 'gato_amigo', 'gato_famoso', 'gato_madrugada', 'gato_veterinario'];
/** Gato que habla con valores fijos, pareja de relación 50 y $10.000 (o lo que se pida). */
function scene(MV, seed, opts) {
  opts = opts || {};
  MV.rng.seed(seed);
  const t = calm(MV, seed, opts.kind); const p = t.g.p;
  Object.assign(p.stats, { happy: 50, smarts: 50, health: 80 });
  p.stress = 30; p.karma = 0; p.followers = 0; p.skills.carisma = 50;
  p.money = opts.money == null ? 10000 : opts.money;
  t.r.rel = 50; t.n.health = 50;
  const mate = MV.newNPC(t.g, { age: 30 }); t.mate = { n: mate, r: MV.addRel(t.g, mate, 'pareja', 50) };
  if (opts.pg) p.gender = opts.pg;
  if (opts.cg) t.n.gender = opts.cg;
  t.g.queue = [];
  return t;
}
const openEv = (MV, t, id) => { t.g.queue = []; MV.EV.push(t.g, id, { target: t.n.id }, true); return MV.EV.view(t.g); };
const choiceOf = (v, re) => { const c = v.choices.find((x) => re.test(x.label)); assert.ok(c, `falta ${re} en ${v.id}: ${v.choices.map((x) => x.label).join(' | ')}`); return c.i; };
/** Abre el evento, elige la opción y devuelve la escena con el resultado. */
function play(MV, seed, id, re, opts) {
  const t = scene(MV, seed, opts);
  const v = openEv(MV, t, id);
  assert.ok(v && v.id === id, 'no se pudo mostrar ' + id);
  t.res = MV.EV.choose(t.g, choiceOf(v, re));
  assert.ok(t.res.msg && !BAD_TEXT.test(t.res.msg), `${id}: ${t.res.msg}`);
  return t;
}
/** Juega la opción con muchas semillas y clasifica cada resultado; exige ver todos los esperados. */
function outcomes(MV, base, id, re, classify, expected) {
  const seen = {};
  for (let s = 0; s < 120; s++) { const k = classify(play(MV, base + s, id, re)); seen[k] = (seen[k] || 0) + 1; }
  assert.deepEqual(Object.keys(seen).sort(), expected.slice().sort(), `${id}: ${JSON.stringify(seen)}`);
  return seen;
}

test('cada opción de los 7 eventos hace lo que dice', () => {
  const MV = load({ seed: 50 });
  let t;
  // Celos
  t = play(MV, 5000, 'gato_celos', /Darle la razón/); assert.equal(t.mate.r.rel, 44); assert.equal(t.r.rel, 56);
  t = play(MV, 5001, 'gato_celos', /Defender/); assert.equal(t.r.rel, 44); assert.equal(t.mate.r.rel, 55);
  t = play(MV, 5002, 'gato_celos', /atún/); assert.equal(t.g.p.money, 9960); assert.equal(t.r.rel, 53);
  // El regalo
  outcomes(MV, 5100, 'gato_regalo', /Quedártelo/, (x) => {
    const p = x.g.p;
    if (p.money > 10000) { assert.ok(p.money >= 10050 && p.money <= 10500, 'valía ' + (p.money - 10000)); assert.equal(p.karma, 0); assert.equal(p.stats.happy, 50); return 'vale'; }
    if (p.karma === -2) { assert.equal(p.money, 10000); assert.equal(p.stats.happy, 50); return 'vecino'; }
    assert.equal(p.stats.happy, 47); assert.equal(p.karma, 0); assert.equal(p.money, 10000); return 'vivo';
  }, ['vale', 'vecino', 'vivo']);
  t = play(MV, 5200, 'gato_regalo', /Devolver/); assert.equal(t.g.p.karma, 3); assert.equal(t.r.rel, 47);
  t = play(MV, 5201, 'gato_regalo', /Agradecer/); assert.equal(t.r.rel, 54);
  // Desaparece
  t = play(MV, 5300, 'gato_desaparece', /Buscarl[oa]/); assert.equal(t.g.p.stress, 35); assert.equal(t.r.rel, 58);
  t = play(MV, 5301, 'gato_desaparece', /carteles/); assert.equal(t.g.p.money, 9940); assert.equal(t.r.rel, 54);
  outcomes(MV, 5400, 'gato_desaparece', /Esperar/, (x) => {
    assert.equal(T(MV).cat(x.g), x.n, 'siempre vuelve');
    if (x.r.rel === 46) { assert.equal(x.g.p.stats.happy, 50); return 'ofendido'; }
    assert.equal(x.r.rel, 50); assert.equal(x.g.p.stats.happy, 54); return 'historia';
  }, ['ofendido', 'historia']);
  // El amigo
  t = play(MV, 5500, 'gato_amigo', /Invitarlo/); assert.equal(t.g.p.money, 9920); assert.equal(t.r.rel, 55);
  const before = scene(MV, 5501); const cats0 = MV.rels(before.g, 'mascota').length, resc0 = T(MV).rescued(before.g);
  t = play(MV, 5501, 'gato_amigo', /Adoptarlo/);
  const pets = MV.rels(t.g, 'mascota');
  assert.equal(pets.length, cats0 + 1);
  const nw = pets.find((x) => x.n.id !== t.n.id);
  assert.equal(nw.n.species, 'gato'); assert.equal(nw.r.rel, 60); assert.equal(nw.n.talk, undefined);
  assert.equal(T(MV).rescued(t.g), resc0 + 1);
  assert.ok(t.res.msg.includes(nw.n.first));
  t = play(MV, 5502, 'gato_amigo', /que no/); assert.equal(t.r.rel, 45);
  // Famoso
  for (let s = 0; s < 40; s++) { t = play(MV, 5600 + s, 'gato_famoso', /cuenta/); assert.ok(t.g.p.followers >= 200 && t.g.p.followers <= 5000, 'seguidores ' + t.g.p.followers); }
  t = play(MV, 5700, 'gato_famoso', /fama corrompe/); assert.equal(t.r.rel, 47); assert.equal(t.g.p.karma, 2);
  for (let s = 0; s < 40; s++) { t = play(MV, 5800 + s, 'gato_famoso', /Cobrar/); assert.ok(t.g.p.money >= 10100 && t.g.p.money <= 11500, 'cobró ' + (t.g.p.money - 10000)); assert.equal(t.r.rel, 46); }
  // Las 3 de la mañana
  t = play(MV, 5900, 'gato_madrugada', /Escucharl[oa]/); assert.equal(t.g.p.stats.smarts, 52); assert.equal(t.g.p.stress, 34); assert.equal(t.r.rel, 56);
  t = play(MV, 5901, 'gato_madrugada', /almohada/); assert.equal(t.r.rel, 47); assert.equal(t.g.p.stress, 27);
  outcomes(MV, 6000, 'gato_madrugada', /Discutirle/, (x) => {
    assert.equal(x.r.rel, 52);
    if (x.g.p.stats.smarts === 53) { assert.equal(x.g.p.stats.happy, 50); return 'ganas'; }
    assert.equal(x.g.p.stats.smarts, 50); assert.equal(x.g.p.stats.happy, 48); return 'pierdes';
  }, ['ganas', 'pierdes']);
  // El veterinario
  t = play(MV, 6100, 'gato_veterinario', /igual/); assert.equal(t.g.p.money, 9750); assert.equal(t.n.health, 65); assert.equal(t.r.rel, 45);
  outcomes(MV, 6200, 'gato_veterinario', /Negociar/, (x) => {
    if (x.n.health === 65) { assert.equal(x.g.p.money, 9750); assert.equal(x.r.rel, 52); assert.equal(x.g.p.stats.health, 80); return 'acepta'; }
    assert.equal(x.g.p.money, 10000, 'el arañazo no cobra'); assert.equal(x.g.p.stats.health, 78); assert.equal(x.n.health, 50); return 'araña';
  }, ['acepta', 'araña']);
  t = play(MV, 6300, 'gato_veterinario', /este año/); assert.equal(t.r.rel, 53); assert.equal(t.n.health, 45);
});

test('las opciones con precio no aparecen sin dinero', () => {
  const MV = load({ seed: 51 });
  const paid = { gato_celos: /atún/, gato_desaparece: /carteles/, gato_amigo: /Invitarlo/, gato_veterinario: /igual|Negociar/ };
  CAT_EVENTS.forEach((id, i) => {
    const poor = openEv(MV, scene(MV, 5100 + i, { money: 0 }), id);
    assert.ok(poor.choices.length >= 1, id + ' quedó sin opciones');
    const rich = openEv(MV, scene(MV, 5100 + i), id);
    if (paid[id]) {
      assert.ok(!poor.choices.some((c) => paid[id].test(c.label)), `${id} ofrece pagar sin dinero`);
      assert.ok(rich.choices.some((c) => paid[id].test(c.label)), `${id} no ofrece la opción paga`);
    }
    // Ninguna opción deja el dinero en negativo.
    poor.choices.forEach((c) => { const t = scene(MV, 5100 + i, { money: 0 }); const v = openEv(MV, t, id); MV.EV.choose(t.g, v.choices.find((x) => x.label === c.label).i); assert.ok(t.g.p.money >= 0, `${id}: ${c.label}`); });
  });
});

test('el texto del evento cambia con la personalidad', () => {
  const MV = load({ seed: 52 });
  CAT_EVENTS.forEach((id, i) => {
    const texts = KINDS.map((kind) => {
      ['m', 'f'].forEach((pg) => ['m', 'f'].forEach((cg) => {
        const t = scene(MV, 5200 + i, { kind, pg, cg }); const v = openEv(MV, t, id);
        assert.ok(v.text.includes(t.n.first), `${id}/${kind}: ${v.text}`);
        assert.ok(!BAD_TEXT.test(v.text + ' ' + v.title + ' ' + v.choices.map((c) => c.label + ' ' + (c.sub || '')).join(' ')), `${id}/${kind}: ${v.text}`);
      }));
      const t = scene(MV, 5200 + i, { kind });
      return openEv(MV, t, id).text.replace(new RegExp(t.n.first, 'g'), 'X');
    });
    assert.equal(new Set(texts).size, 3, id + ' no cambia con la personalidad');
    KINDS.forEach((kind) => assert.equal(typeof MV.CAT_VOICES[kind].events[id], 'function', `${kind}.events.${id}`));
  });
  assert.equal(MV.EV.list.filter((d) => /^gato_/.test(d.id) && d.id !== 'gato_sigue').length, 7);
});

test('sin gato que habla no aparecen', () => {
  const MV = load({ seed: 53 });
  const el = (g, id) => MV.EV.eligible(g, MV.EV.byId[id]);
  const plain = game(MV, 53); cat(MV, plain, 90); MV.addRel(plain, MV.newNPC(plain, { age: 30 }), 'pareja', 50);
  CAT_EVENTS.forEach((id) => assert.equal(el(plain, id), null, id + ' sin gato que habla'));
  const t = scene(MV, 54);
  CAT_EVENTS.forEach((id) => { const ctx = el(t.g, id); assert.ok(ctx && ctx.target === t.n.id, id + ' debería poder salir'); });
  t.g.p.prison = { left: 2, total: 2, crime: 'Robo', behavior: 50, since: 30 };
  CAT_EVENTS.forEach((id) => assert.equal(el(t.g, id), null, id + ' en prisión'));
  t.g.p.prison = null;
  MV.removeRel(t.g, t.mate.n.id);
  assert.equal(el(t.g, 'gato_celos'), null, 'celos sin pareja');
  t.g.p.age = 12;
  assert.equal(el(t.g, 'gato_famoso'), null, 'famoso a los 12');
  assert.ok(el(t.g, 'gato_regalo'));
});

test('si el gato ya no está, su evento en cola desaparece', () => {
  const MV = load({ seed: 55 });
  let t = scene(MV, 55);
  MV.EV.push(t.g, 'gato_regalo', { target: t.n.id }, true);
  MV.sys.people.die(t.g, t.n, 'vejez');
  let v = MV.EV.view(t.g);
  assert.ok(!v || v.id !== 'gato_regalo', 'el evento sigue tras su muerte');
  assert.ok(!t.g.queue.some((q) => q.id === 'gato_regalo'));
  t = scene(MV, 56);
  MV.EV.push(t.g, 'gato_madrugada', { target: t.n.id }, true);
  MV.removeRel(t.g, t.n.id);
  v = MV.EV.view(t.g);
  assert.equal(v, null, 'el evento sigue tras darlo en adopción');
});

test('aparece alguno cada pocos años', () => {
  const MV = load({ seed: 57 });
  let total = 0;
  for (let s = 0; s < 40; s++) {
    MV.rng.seed(5700 + s);
    const { g } = talker(MV, 5700 + s, null, 30);
    for (let y = 0; y < 20; y++) {
      g.p.prison = null; g.over = false;
      MV.EV.runYear(g);
      total += g.queue.filter((q) => /^gato_/.test(q.id || '') && q.id !== 'gato_sigue').length;
      g.queue = []; g.p.age++;
    }
  }
  assert.ok(total >= 80 && total <= 400, `eventos del gato en 800 años: ${total}`);
});

// ——— Tarea 6: su final ———
test('se despide al morir', () => {
  const MV = load({ seed: 60 });
  const lines = KINDS.map((kind, i) => {
    const { g, n } = calm(MV, 600 + i, kind); g.p.stats.happy = 80;
    MV.sys.people.die(g, n, 'vejez');
    const info = g.queue.find((q) => q.info);
    assert.equal(info.info.title, 'Últimas palabras');
    assert.equal(info.info.text, T(MV).say(n, MV.CAT_VOICES[kind].farewell(T(MV).ctx(g, n))));
    assert.ok(info.info.text.includes(n.first) && !BAD_TEXT.test(info.info.text));
    assert.ok(!g.queue.some((q) => q.info && /Adiós, compañero/.test(q.info.title)), 'no repite el aviso común');
    assert.ok(g.achLife.includes('ultimas_palabras'));
    // Duele igual que perder a cualquier mascota con esa relación.
    const h = calm(MV, 600 + i, kind); h.g.p.stats.happy = 80;
    const common = cat(MV, h.g, 90);
    MV.sys.people.die(h.g, common.n, 'vejez');
    assert.equal(g.p.stats.happy, h.g.p.stats.happy);
    assert.ok(h.g.queue.some((q) => q.info && /Adiós, compañero/.test(q.info.title)));
    assert.ok(!(h.g.achLife || []).includes('ultimas_palabras'), 'un gato común no da el logro');
    return info.info.text.replace(n.first, 'X');
  });
  assert.equal(new Set(lines).size, 3, 'cada voz se despide a su manera');
});

test('darlo en adopción', () => {
  const MV = load({ seed: 61 });
  KINDS.forEach((kind, i) => {
    const { g, n, r } = calm(MV, 610 + i, kind); r.acts = {};
    const common = cat(MV, g, 90);
    const act = MV.sys.rels.actions(g, r, n).find((a) => a.id === 'regalar_mascota');
    assert.equal(act.confirm, `¿Dar en adopción a ${n.first}? Ningún otro gato volverá a hablarte.`);
    assert.equal(MV.sys.rels.actions(g, common.r, common.n).find((a) => a.id === 'regalar_mascota').confirm, `¿Dar en adopción a ${common.n.first}?`);
    const expected = T(MV).say(n, MV.CAT_VOICES[kind].adopted(T(MV).ctx(g, n)));
    const karma = g.p.karma;
    const res = MV.doAction(g, act, undefined, r.acts);
    assert.equal(res.msg, expected);
    assert.equal(MV.relOf(g, n.id), undefined); assert.equal(T(MV).cat(g), null);
    assert.equal(g.p.karma, karma - 5, 'mismos efectos que con cualquier mascota');
    assert.ok(!(g.achLife || []).includes('ultimas_palabras'));
  });
});

test('después de la adopción nadie más habla', () => {
  const MV = load({ seed: 62 });
  const { g, n, r } = calm(MV, 62); r.acts = {};
  MV.doAction(g, MV.sys.rels.actions(g, r, n).find((a) => a.id === 'regalar_mascota'), undefined, r.acts);
  MV.gcPeople(g);
  assert.equal(g.people[n.id], undefined, 'el juego ya limpió a ese personaje');
  const other = cat(MV, g, 95); other.r.loyal = 10; g.p.karma = 80;
  for (let i = 0; i < 3; i++) T(MV).yearly(g);
  assert.equal(other.n.talk, undefined);
  assert.equal(T(MV).cat(g), null);
  assert.ok(!BAD_TEXT.test(T(MV).advise(g)));
  assert.deepEqual(T(MV).actions(g, other.r, other.n), []);
});

/** Jugador de 70 con gato que habla y un perro, que muere y deja un heredero de esa edad. */
function heir(MV, seed, kidAge) {
  const { g, n } = calm(MV, seed); g.p.age = 70; g.p.loans = [];
  const dog = MV.newPet(g, 'perro', { age: 4 }); MV.addRel(g, dog, 'mascota', 80);
  const kid = MV.newNPC(g, { age: kidAge, last: g.p.last }); MV.addRel(g, kid, 'hijo', 80);
  MV.sys.legacy.die(g, 'una prueba');
  return { g, n, dog, ng: MV.sys.legacy.continueAs(g, kid.id) };
}
const diary = (g) => g.log.map((y) => y.items.map((i) => i.t).join(' | ')).join(' | ');

test('el heredero no lo recibe', () => {
  const MV = load({ seed: 63 });
  const { n, dog, ng } = heir(MV, 63, 25);
  const pets = MV.rels(ng, 'mascota').map((x) => x.n);
  assert.ok(pets.some((x) => x.species === 'perro' && x.first === dog.first), 'recibe al perro');
  assert.ok(!pets.some((x) => x.talk || x.first === n.first && x.species === 'gato'), 'no recibe al gato que habla');
  assert.ok(!Object.values(ng.people).some((x) => x.talk), 'el gato no viaja a la partida nueva');
  const line = ng.log[ng.log.length - 1].items.map((i) => i.t).find((t) => t.includes(n.first) && /funeral/.test(t));
  assert.ok(line && !BAD_TEXT.test(line), diary(ng));
  assert.equal(ng.p.flags.gatoHabla, undefined);
  // Un heredero que no recibe mascotas no tiene esa línea.
  const old = heir(MV, 64, 40);
  assert.equal(MV.rels(old.ng, 'mascota').length, 0);
  assert.ok(!/funeral/.test(diary(old.ng)), diary(old.ng));
  // Si el gato ya había muerto, tampoco.
  const t = calm(MV, 65); t.g.p.age = 70; t.g.p.loans = [];
  const kid = MV.newNPC(t.g, { age: 25, last: t.g.p.last }); MV.addRel(t.g, kid, 'hijo', 80);
  MV.sys.people.die(t.g, t.n, 'vejez'); t.g.queue = [];
  MV.sys.legacy.die(t.g, 'una prueba');
  assert.ok(!/funeral/.test(diary(MV.sys.legacy.continueAs(t.g, kid.id))));
});

test('el heredero puede tener su propio gato que habla', () => {
  const MV = load({ seed: 66 });
  const { ng } = heir(MV, 66, 25);
  ng.p.karma = 0;
  const c = cat(MV, ng, 85); c.r.loyal = 4;
  T(MV).yearly(ng);
  assert.equal(c.n.talk.how, 'lealtad');
  assert.equal(T(MV).cat(ng), c.n);
});
