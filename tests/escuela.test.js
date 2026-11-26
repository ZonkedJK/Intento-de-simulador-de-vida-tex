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

// ——— Tarea 5: popularidad y año escolar ———
test('la barra empieza según tu aspecto y tu carisma', () => {
  const g = student(MV, 31, 9);
  g.p.stats.looks = 50; g.p.skills.carisma = 20;
  assert.strictEqual(S().basePop(g.p), 46);
  g.p.stats.looks = 100; g.p.skills.carisma = 100;
  assert.strictEqual(S().basePop(g.p), 75);
  g.p.stats.looks = 0; g.p.skills.carisma = 0;
  assert.strictEqual(S().basePop(g.p), 30);
  // sin barra, pop() parte de la base
  delete g.p.edu.pop;
  assert.strictEqual(S().pop(g, 5), 35);
  assert.strictEqual(S().pop(g, 500), 100);
  assert.strictEqual(S().pop(g, -500), 0);
});

test('lo que hace un año', () => {
  const g = student(MV, 33, 9);
  g.p.edu.pop = 60; g.p.clubs = ['robotica', 'sport:futbol']; g.p.yearActs = {};
  S().yearly(g);
  assert.strictEqual(g.p.edu.pop, 63);
  const h = student(MV, 34, 9);
  h.p.edu.pop = 60; h.p.clubs = []; h.p.yearActs = { faltar: 2 };
  S().yearly(h);
  assert.strictEqual(h.p.edu.pop, 55);
  // fuera de la escuela, nada
  const u = game(MV, 35, 19);
  u.p.edu.done = ['primaria', 'secundaria'];
  MV.sys.edu.enrollUni(u, Object.keys(MV.EDU.majors)[0], 'publica');
  S().yearly(u);
  assert.strictEqual(u.p.edu.pop, undefined);
});

test('la barra pasa al curso siguiente', () => {
  const g = student(MV, 37, 11, 'primaria');
  g.p.stats.looks = 50; g.p.skills.carisma = 0; // base 40
  assert.strictEqual(S().basePop(g.p), 40);
  g.p.edu.pop = 80;
  g.p.edu.year = MV.sys.edu.yearsOf(g.p.edu) - 1;
  g.p.age = 12;
  MV.sys.edu.yearly(g);
  assert.strictEqual(g.p.edu.stage, 'secundaria');
  assert.ok(Math.abs(g.p.edu.pop - 60) <= 3, 'pop ' + g.p.edu.pop); // el año pesa un poco antes del traspaso
  const h = student(MV, 38, 13);
  h.p.edu.pop = 50;
  S().restaff(h, 'repeat');
  assert.strictEqual(h.p.edu.pop, 45);
  S().restaff(h, 'expel');
  assert.strictEqual(h.p.edu.pop, 35);
  h.p.edu.pop = 80; h.p.stats.looks = 50; h.p.skills.carisma = 0;
  S().restaff(h);
  assert.strictEqual(h.p.edu.pop, 60);
  delete h.p.edu.pop;
  S().restaff(h, 'repeat');
  assert.strictEqual(h.p.edu.pop, S().basePop(h.p));
  h.p.edu.pop = 3;
  S().restaff(h, 'expel');
  assert.strictEqual(h.p.edu.pop, 0);
});

test('el tutor pesa', () => {
  const run = (kind, f) => {
    MV.rng.seed(41);
    const g = student(MV, 41, 9);
    g.p.edu.class.teacher.kind = kind; g.p.edu.perf = 50; g.p.edu.pop = 50; g.p.stress = g.p.stats.stress; g.p.yearActs = {};
    f(g);
    return g;
  };
  const yr = (k) => run(k, (g) => { S().yearly(g); });
  assert.strictEqual(yr('cansado').p.edu.perf - yr('exigente').p.edu.perf, 3);
  const st = (k) => { const g = run(k, (x) => { x.p.stats.stress = 30; }); const b = g.p.stats.stress; S().yearly(g); return g.p.stats.stress - b; };
  assert.strictEqual(st('estricto') - st('cansado'), 2);
  const study = (k) => run(k, (g) => { MV.rng.seed(99); MV.sys.edu.actions(g).find((a) => a.id === 'estudiar').run(g); }).p.edu.perf;
  assert.strictEqual(study('exigente') - study('cansado'), 2);
});

test('las acciones mueven la barra', () => {
  const act = (g, id) => MV.sys.edu.actions(g).find((a) => a.id === id);
  // amigos que sale bien: +3
  let g = student(MV, 43, 9);
  g.p.stats.looks = 100; g.p.skills.carisma = 100; g.p.edu.pop = 50;
  const txt = act(g, 'amigos').run(g);
  assert.ok(!BAD_TEXT.test(txt));
  assert.strictEqual(g.p.edu.pop, 53);
  // con la barra baja cuesta más
  const rate = (pop) => { let ok = 0; for (let s = 1; s <= 400; s++) { MV.rng.seed(s); const h = student(MV, s, 9); h.p.stats.looks = 0; h.p.skills.carisma = 0; h.p.edu.pop = pop; const before = Object.keys(h.people).length; act(h, 'amigos').run(h); if (Object.keys(h.people).length > before) ok++; } return ok; };
  assert.ok(rate(60) - rate(30) >= 20, 'popularidad ≤ 30 resta 0,10');
  // abusón: gana +10, pierde -5
  let win = 0, lose = 0;
  for (let s = 1; s <= 80 && (!win || !lose); s++) {
    MV.rng.seed(s);
    const h = student(MV, s, 9); h.p.flags.abuson = true; h.p.edu.pop = 50;
    const r = act(h, 'abuson').run(h);
    assert.ok(!BAD_TEXT.test(r));
    if (!h.p.flags.abuson) { win++; assert.strictEqual(h.p.edu.pop, 60); } else { lose++; assert.strictEqual(h.p.edu.pop, 45); }
  }
  assert.ok(win && lose, 'vimos las dos salidas');
  // trampa pillada: -4
  let caught = 0, free = 0;
  for (let s = 1; s <= 80 && (!caught || !free); s++) {
    MV.rng.seed(s);
    const h = student(MV, s, 12); h.p.edu.pop = 50; h.p.edu.perf = 50; h.p.edu.class.teacher.kind = 'cansado';
    act(h, 'trampa').run(h);
    if (h.p.edu.perf > 50) { free++; assert.strictEqual(h.p.edu.pop, 50); } else { caught++; assert.strictEqual(h.p.edu.pop, 46); }
  }
  assert.ok(caught && free, 'vimos las dos salidas');
  // el tutor: nombra y cambia la relación
  const seen = new Set();
  for (let s = 1; s <= 60; s++) {
    MV.rng.seed(s);
    const h = student(MV, s, 12); const t = S().teacher(h);
    const before = t.r.rel;
    const r = act(h, 'profesor').run(h);
    assert.ok(!BAD_TEXT.test(r) && r.includes(t.n.first), r);
    if (/consejos/.test(r)) { seen.add('a'); assert.strictEqual(t.r.rel, before + 5); }
    else if (/divorcio/.test(r)) { seen.add('b'); assert.strictEqual(t.r.rel, before - 3); }
    else { seen.add('c'); assert.strictEqual(t.r.rel, before); }
  }
  assert.strictEqual(seen.size, 3);
  // universidad: sin barra
  const u = game(MV, 44, 19);
  u.p.edu.done = ['primaria', 'secundaria'];
  MV.sys.edu.enrollUni(u, Object.keys(MV.EDU.majors)[0], 'publica');
  for (const id of ['amigos', 'trampa', 'fiesta_uni', 'profesor']) assert.ok(!BAD_TEXT.test(act(u, id).run(u)));
  assert.strictEqual(u.p.edu.pop, undefined);
});

test('ser popular ayuda con quien te gusta', () => {
  const rate = (pop) => {
    let ok = 0;
    for (let s = 1; s <= 400; s++) {
      MV.rng.seed(s);
      const g = student(MV, s, 15);
      S().staff(g);
      const c = S().mate(g, 'crush');
      c.n.traits = []; g.p.edu.pop = pop;
      const a = MV.sys.rels.actions(g, c.r, c.n).find((x) => x.id === 'coquetear');
      MV.rng.seed(1000 + s);
      const txt = a.run(g);
      assert.ok(!BAD_TEXT.test(txt));
      if (c.r.type === 'pareja') ok++;
    }
    return ok / 4;
  };
  const diff = rate(75) - rate(60);
  assert.ok(diff >= 5 && diff <= 15, 'diferencia ' + diff);
});

test('en el centro de menores el curso se congela', () => {
  const g = student(MV, 47, 14);
  g.p.edu.pop = 55;
  const pop = g.p.edu.pop, year = g.p.edu.year, ids = JSON.stringify(g.p.edu.class), stage = g.p.edu.stage;
  for (let i = 0; i < 50 && !g.over; i++) {
    g.p.prison = { years: 2 };
    g.queue = [];
    MV.ageUp(g);
    assert.ok(!/"esc_/.test(JSON.stringify(g.queue)), 'sin eventos esc_');
    g.queue = [];
    if (g.over) break;
    assert.strictEqual(g.p.edu.pop, pop);
    assert.strictEqual(g.p.edu.year, year);
    assert.strictEqual(g.p.edu.stage, stage);
  }
  g.p.prison = null;
  assert.strictEqual(JSON.stringify(g.p.edu.class), ids);
});
