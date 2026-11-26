'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');
const MV = load({ seed: 1 });

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
function game(MV, seed, age) {
  const g = MV.newGame({ seed }); g.p.age = age == null ? 30 : age; g.queue = []; g.p.rels = [];
  return g;
}
function person(MV, g, type, traits, extra) {
  const n = MV.newNPC(g, Object.assign({ age: 30, traits: traits || [] }, extra || {}));
  return { n, r: MV.addRel(g, n, type || 'amigo', 50) };
}
function student(MV, seed, age, stage) {
  const g = game(MV, seed, age);
  MV.sys.edu.start(g, stage || (age < 12 ? 'primaria' : 'secundaria'));
  return g;
}
const S = () => MV.sys.school;

test('al empezar la primaria hay curso', () => {
  let abu = 0;
  const N = 300;
  for (let s = 1; s <= N; s++) {
    MV.rng.seed(s);
    const g = student(MV, s, 6);
    const t = S().teacher(g);
    assert.ok(t && t.r.type === 'profe' && t.n.alive, 'tutor');
    assert.ok(t.n.age >= 25 && t.n.age <= 60);
    assert.match(t.n.job, /^Maestr[oa]$/);
    assert.ok(t.r.rel >= 50 && t.r.rel <= 65);
    assert.ok(MV.TEACHER_KINDS[t.kind]);
    const am = S().mate(g, 'amigo'), rv = S().mate(g, 'rival'), ab = S().mate(g, 'abuson'), pa = S().mate(g, 'payaso');
    assert.ok(am && rv && (ab || pa) && !(ab && pa), 'papeles');
    for (const [x, role] of [[am, 'amigo'], [rv, 'rival'], [ab || pa, ab ? 'abuson' : 'payaso']]) {
      const [lo, hi] = MV.CLASS_ROLES[role].rel;
      assert.ok(x.r.rel >= lo && x.r.rel <= hi, role);
      assert.ok(x.n.age >= 5 && x.n.age <= 7);
      assert.strictEqual(x.r.type, 'curso');
      assert.strictEqual(x.n.job, 'Estudiante');
      assert.strictEqual(x.n.money, 0);
    }
    assert.ok(!S().mate(g, 'crush'));
    if (ab) abu++;
  }
  assert.ok(abu >= 150 && abu <= 210, 'abusón ' + abu);
});

test('desde los 14, alguien que te gusta', () => {
  for (let s = 1; s <= 30; s++) {
    MV.rng.seed(s);
    const g = student(MV, s, 14);
    S().staff(g);
    const c = S().mate(g, 'crush');
    assert.ok(c, 'crush ' + s);
    assert.ok(MV.sys.rels.canRomance(g, c.n, c.r));
    assert.ok(c.n.age < 18);
    assert.ok(c.r.rel >= 45 && c.r.rel <= 60);
    const g13 = student(MV, s, 13);
    S().staff(g13);
    assert.ok(!S().mate(g13, 'crush'));
  }
});

test('al pasar a secundaria cambia el curso', () => {
  MV.rng.seed(5);
  const g = student(MV, 5, 11, 'primaria');
  const old = S().mates(g), oldT = S().teacher(g);
  old[0].r.rel = 70; old[1].r.rel = 55;
  const keep = old[0].n.id, gone = old[1].n.id;
  g.p.edu.year = MV.sys.edu.yearsOf(g.p.edu) - 1;
  g.p.age = 12;
  MV.sys.edu.yearly(g);
  assert.strictEqual(g.p.edu.stage, 'secundaria');
  assert.strictEqual(MV.relOf(g, keep).type, 'amigo');
  assert.ok(!MV.relOf(g, gone));
  const t = S().teacher(g);
  assert.ok(t && t.n.id !== oldT.n.id);
  assert.match(t.n.job, /^Profesor[a]?$/);
  assert.ok(!old.some((x) => S().mates(g).some((y) => y.n.id === x.n.id)));
  assert.ok(S().mate(g, 'amigo'));
});

test('quien deja de ser tu amigo pierde el papel', () => {
  MV.rng.seed(7);
  const g = student(MV, 7, 9);
  const am = S().mate(g, 'amigo');
  const c = S().mates(g).find((x) => x.m.role === 'rival');
  void c;
  // otro compañero común de buena relación
  const extra = S()._newMate(g, 'amigo'); extra.job = 'Estudiante';
  g.p.edu.class.mates[g.p.edu.class.mates.length - 1].role = 'comun';
  MV.relOf(g, extra.id).rel = 55;
  am.r.rel = 25;
  S().staff(g);
  assert.strictEqual(am.m.role, 'comun');
  const nuevo = S().mate(g, 'amigo');
  assert.ok(nuevo && nuevo.n.id === extra.id);
  // sin candidatos llega alguien nuevo
  nuevo.r.rel = 10;
  const before = g.p.edu.class.mates.length;
  S().staff(g);
  assert.strictEqual(g.p.edu.class.mates.length, before + 1);
  assert.ok(S().mate(g, 'amigo') && S().mate(g, 'amigo').n.id !== extra.id);
  // idempotente
  const snap = JSON.stringify(g.p.edu.class), ppl = Object.keys(g.people).length, rels = g.p.rels.length;
  S().staff(g);
  assert.strictEqual(JSON.stringify(g.p.edu.class), snap);
  assert.strictEqual(Object.keys(g.people).length, ppl);
  assert.strictEqual(g.p.rels.length, rels);
});

test('si alguien muere, su papel se llena', () => {
  MV.rng.seed(9);
  const g = student(MV, 9, 9);
  const rv = S().mate(g, 'rival');
  MV.sys.people.die(g, rv.n, 'accidente');
  assert.doesNotThrow(() => S().staff(g));
  const nr = S().mate(g, 'rival');
  assert.ok(nr && nr.n.id !== rv.n.id && nr.n.alive);
  // tutor muerto
  const t = S().teacher(g);
  MV.sys.people.die(g, t.n, 'accidente');
  S().staff(g);
  const t2 = S().teacher(g);
  assert.ok(t2 && t2.n.id !== t.n.id);
});

test('nunca romance con un profesor de la escuela', () => {
  MV.rng.seed(11);
  const g = student(MV, 11, 18, 'secundaria');
  const t = S().teacher(g);
  t.n.age = 25; t.n.gender = g.p.orientation === 'homo' ? g.p.gender : (g.p.gender === 'm' ? 'f' : 'm');
  assert.strictEqual(MV.sys.rels.canRomance(g, t.n, t.r), false);
  const acts = MV.sys.rels.actions(g, t.r, t.n);
  assert.ok(acts.length > 0, 'hay acciones');
  const h = game(MV, 12, 16);
  const amg = person(MV, h, 'curso', [], { age: 16, gender: h.p.orientation === 'homo' ? h.p.gender : (h.p.gender === 'm' ? 'f' : 'm') });
  h.p.orientation = h.p.orientation || 'hetero';
  assert.ok(MV.sys.rels.actions(h, amg.r, amg.n).some((a) => a.id === 'coquetear'), 'el compañero sí puede');
  assert.ok(!acts.some((a) => a.id === 'coquetear'));
  // aunque fuera otro tipo de relación con 'profe', el tipo manda
  const x = person(MV, g, 'amigo', [], { age: 25 });
  assert.strictEqual(MV.sys.rels.canRomance(g, x.n, Object.assign({}, x.r, { type: 'profe' })), false);
});

test('la nocturna y la universidad no tienen curso', () => {
  const g = game(MV, 3, 30);
  g.p.edu.done = ['primaria'];
  MV.sys.edu.start(g, 'secundaria', { adult: true });
  assert.strictEqual(S().active(g.p), false);
  S().staff(g);
  assert.ok(!g.p.edu.class);
  const h = game(MV, 4, 19);
  h.p.edu.done = ['primaria', 'secundaria'];
  MV.sys.edu.enrollUni(h, Object.keys(MV.EDU.majors)[0], 'publica');
  assert.strictEqual(S().active(h.p), false);
  S().staff(h);
  assert.ok(!h.p.edu.class);
  assert.strictEqual(h.p.rels.length, 0);
});

test('partida vieja sin curso', () => {
  const g = student(MV, 13, 9);
  g.p.rels = []; delete g.p.edu.class;
  assert.doesNotThrow(() => S().staff(g));
  assert.ok(g.p.edu.class && S().teacher(g) && S().mate(g, 'amigo') && S().mate(g, 'rival'));
});

test('en la cárcel el curso se congela', () => {
  const g = student(MV, 15, 15);
  const n = g.p.rels.length;
  g.p.prison = { years: 2 };
  assert.strictEqual(S().active(g.p), false);
  S().staff(g);
  assert.strictEqual(g.p.rels.length, n);
});

test('abandonar y repetir arman o cierran el curso; los textos no rompen', () => {
  const g = student(MV, 17, 10);
  const old = S().teacher(g).n.id;
  g.p.edu.perf = 5;
  const r = MV.sys.edu.drop(g);
  assert.ok(!BAD_TEXT.test(r));
  assert.ok(!g.p.edu.class);
  assert.ok(!MV.relOf(g, old) || MV.relOf(g, old).type !== 'profe');
  const h = student(MV, 18, 10);
  const t = S().teacher(h).n.id;
  S().restaff(h);
  assert.notStrictEqual(S().teacher(h).n.id, t);
  for (const k of ['curso', 'profe']) { assert.ok(MV.REL_ORDER.includes(k)); assert.ok(!BAD_TEXT.test(MV.relLabel(k, h.people[t]))); }
});

// ——— Ronda de arreglos 1 ———
test('un ex tutor nunca es romance, ni como amigo', () => {
  for (let s = 1; s <= 20; s++) {
    MV.rng.seed(s);
    const g = student(MV, s, 18, 'secundaria');
    const t = S().teacher(g);
    t.n.gender = g.p.orientation === 'homo' ? g.p.gender : (g.p.gender === 'm' ? 'f' : 'm');
    t.n.age = 25; t.r.rel = 85;
    const id = t.n.id;
    g.p.edu.year = MV.sys.edu.yearsOf(g.p.edu) - 1;
    MV.sys.edu.yearly(g);
    const r = MV.relOf(g, id);
    assert.strictEqual(r.type, 'amigo');
    assert.strictEqual(MV.sys.rels.canRomance(g, g.people[id], r), false);
    assert.ok(!MV.sys.rels.actions(g, r, g.people[id]).some((a) => a.id === 'coquetear'));
  }
});

test('el crush es un compañero menor: ni a los 18 ni adulto', () => {
  for (let s = 1; s <= 30; s++) {
    MV.rng.seed(s);
    const g18 = student(MV, s, 18, 'secundaria');
    S().staff(g18);
    assert.ok(!S().mate(g18, 'crush'), 'sin crush a los 18');
    const g = student(MV, s, 15);
    S().staff(g);
    const c = S().mate(g, 'crush');
    assert.ok(c, 'crush a los 15');
    assert.ok(c.n.age >= 14 && c.n.age <= 17);
    assert.strictEqual(c.n.job, 'Estudiante');
    assert.strictEqual(c.n.money, 0);
  }
});

test('con pareja no llega un crush nuevo', () => {
  MV.rng.seed(21);
  const g = student(MV, 21, 15);
  S().staff(g);
  const c = S().mate(g, 'crush');
  assert.ok(c);
  MV.sys.rels.startDating(g, c.n);
  assert.strictEqual(c.r.type, 'pareja');
  S().staff(g);
  assert.ok(!S().mate(g, 'crush'));
  assert.ok(!g.p.edu.class.mates.some((m) => m.role === 'crush'));
});

test('el payaso puede ser mejor amigo y el curso se rellena', () => {
  MV.rng.seed(23);
  const g = student(MV, 23, 9);
  let pa = S().mate(g, 'payaso');
  if (!pa) { // el curso salió con abusón: convertimos a un compañero en payaso
    const ab = S().mate(g, 'abuson');
    ab.m.role = 'payaso'; pa = S().mate(g, 'payaso');
  }
  const am = S().mate(g, 'amigo');
  am.r.rel = 25; pa.r.rel = 55;
  S().staff(g);
  assert.strictEqual(am.m.role, 'comun');
  assert.strictEqual(pa.m.role, 'amigo');
  assert.ok(S().mate(g, 'abuson') || S().mate(g, 'payaso'), 'curso con abusón o payaso nuevo');
});
