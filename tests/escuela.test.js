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
  g.p.edu.pop = 60; g.p.clubs = ['robotica', 'sport:futbol']; g.p.lastActs = {};
  S().yearly(g);
  assert.strictEqual(g.p.edu.pop, 63);
  const h = student(MV, 34, 9);
  h.p.edu.pop = 60; h.p.clubs = []; h.p.lastActs = { faltar: 2 };
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
  S().restaff(g, 'stage');
  assert.strictEqual(g.p.edu.pop, 60);
  g.p.edu.pop = 50;
  S().restaff(g, 'repeat');
  assert.strictEqual(g.p.edu.pop, 45);
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

test('faltar dos veces en el año baja la barra (por MV.ageUp)', () => {
  const run = (times) => {
    const g = student(MV, 51, 9);
    g.p.edu.pop = 60; g.p.edu.perf = 80; g.p.clubs = [];
    const f = MV.sys.edu.actions(g).find((a) => a.id === 'faltar');
    for (let i = 0; i < times; i++) MV.doAction(g, f);
    assert.strictEqual(g.p.yearActs.faltar, times, 'yearActs sigue contando');
    MV.rng.seed(777);
    MV.ageUp(g);
    return g.p.edu.pop;
  };
  assert.strictEqual(run(1), 59); // 60 -> 10 % hacia 50
  assert.strictEqual(run(2), 55); // 60 - 4 = 56 -> 55
});

test('estudiar durante el año sube el rendimiento que calcula edu.yearly', () => {
  const run = (times) => {
    const g = student(MV, 53, 9);
    g.p.edu.perf = 50;
    const f = MV.sys.edu.actions(g).find((a) => a.id === 'estudiar');
    for (let i = 0; i < times; i++) MV.doAction(g, f);
    g.p.edu.perf = 50; g.p.stats.smarts = 50; g.p.stats.stress = 20; g.p.addic.drogas = 0;
    MV.rng.seed(778);
    MV.ageUp(g);
    return g.p.edu.perf;
  };
  assert.strictEqual(run(2) - run(0), 10);
});

// — Tarea 6: ser el abusón —
const bully = (g, id) => MV.sys.edu.actions(g).find((a) => a.id === id);
const mkStudent = (seed, age, noTraits) => {
  MV.rng.seed(seed);
  const g = student(MV, seed, age);
  if (noTraits) S().mates(g).forEach((x) => { x.n.traits = []; });
  return g;
};
const victim = (g) => S().mates(g).find((x) => x.m.role === 'rival');
const parentsOf = (g) => { const out = []; for (let i = 0; i < 2; i++) { const q = person(MV, g, 'padre'); q.r.rel = 60; out.push(q); } return out; };

test('molestar a un compañero', () => {
  const g = mkStudent(7, 9, true);
  g.p.edu.pop = 50;
  assert.ok(['burla', 'broma_pesada', 'merienda'].every((id) => bully(g, id)));
  assert.ok(bully(g, 'burla').limit === 1);
  const ch = MV.U.chance; MV.U.chance = () => false;
  try {
    for (const [id, pop, karma, rel, mem] of [['burla', 4, -3, 15, 'humillacion'], ['broma_pesada', 4, -2, 12, 'broma'], ['merienda', 0, -2, 10, 'humillacion']]) {
      const h = mkStudent(8, 9, true); h.p.edu.pop = 50; h.p.stats.karma = 50;
      const v = victim(h), before = v.r.rel, hap = h.p.stats.happy;
      const t = bully(h, id).run(h, v.n.id);
      assert.ok(!BAD_TEXT.test(t) && t.includes(v.n.first), t);
      assert.strictEqual(h.p.edu.pop, 50 + pop);
      assert.strictEqual(h.p.stats.karma, 50 + karma);
      assert.strictEqual(v.r.rel, before - rel);
      assert.ok(v.r.mem.some((m) => m.k === mem));
      if (id === 'merienda') assert.strictEqual(h.p.stats.happy, hap + 2);
    }
  } finally { MV.U.chance = ch; }
  const sec = mkStudent(9, 13, true);
  assert.ok(!bully(sec, 'merienda') && bully(sec, 'burla'));
});

test('al mejor amigo no', () => {
  const g = mkStudent(10, 9);
  const am = S().mate(g, 'amigo');
  for (const id of ['burla', 'broma_pesada', 'merienda']) {
    const ids = bully(g, id).opts(g).map((o) => o.id);
    assert.ok(ids.length >= 2 && !ids.includes(am.n.id));
  }
});

test('te pillan', () => {
  const g = mkStudent(11, 9, true);
  g.p.edu.pop = 50; g.p.edu.perf = 60;
  const ps = parentsOf(g);
  const ch = MV.U.chance; MV.U.chance = () => true;
  try { const t = bully(g, 'burla').run(g, victim(g).n.id); assert.ok(!BAD_TEXT.test(t), t); } finally { MV.U.chance = ch; }
  assert.strictEqual(g.p.edu.pop, 52);
  assert.strictEqual(g.p.edu.perf, 52);
  ps.forEach((q) => assert.strictEqual(q.r.rel, 54));
  assert.strictEqual(g.p.edu.susp, 1);
});

test('tres suspensiones y te cambian de escuela', () => {
  const g = mkStudent(12, 9, true);
  g.p.edu.pop = 60; g.p.edu.year = 2;
  const oldT = S().teacher(g).n.id;
  const ch = MV.U.chance; MV.U.chance = () => true;
  let t;
  try {
    for (let i = 0; i < 3; i++) {
      const sc = g.p.yearActs; delete sc.burla;
      t = bully(g, 'burla').run(g, victim(g).n.id);
    }
  } finally { MV.U.chance = ch; }
  assert.ok(!BAD_TEXT.test(t) && /expulsaron/.test(t), t);
  assert.strictEqual(g.p.edu.susp, 0);
  assert.strictEqual(g.p.edu.year, 2);
  assert.strictEqual(g.p.edu.pop, 60 + 6 - 10);
  assert.strictEqual(g.p.edu.bullied, 3);
  assert.ok(S().teacher(g) && S().teacher(g).n.id !== oldT);
  assert.ok(g.p.edu.stage === 'primaria');
});

test('abusón del curso', () => {
  const g = mkStudent(13, 9, true);
  assert.ok(!g.p.flags.abusador);
  const ch = MV.U.chance; MV.U.chance = () => false;
  try {
    for (let i = 0; i < 3; i++) {
      assert.ok(!g.p.flags.abusador || i === 3);
      g.p.yearActs = {};
      bully(g, 'broma_pesada').run(g, victim(g).n.id);
    }
  } finally { MV.U.chance = ch; }
  assert.strictEqual(g.p.flags.abusador, true);
  assert.strictEqual(g.p.edu.bullied, 3);
});

test('burlarte de alguien sensible', () => {
  const rate = (traits) => {
    let caught = 0, N = 400;
    for (let s = 1; s <= N; s++) {
      MV.rng.seed(s);
      const g = student(MV, s, 9);
      g.p.edu.class.teacher.kind = 'cansado';
      const v = victim(g); v.n.traits = traits;
      const t = bully(g, 'burla').run(g, v.n.id);
      assert.ok(!BAD_TEXT.test(t), t);
      if (g.p.edu.susp) caught++;
    }
    return caught / N;
  };
  const sens = rate(['sensible']), plain = rate([]);
  assert.ok(sens >= 0.30 && sens <= 0.50, 'sensible ' + sens);
  assert.ok(plain >= 0.17 && plain <= 0.33, 'sin rasgos ' + plain);
  // texto propio, recuerdo de peso 3 y la relación se duplica
  const g = mkStudent(14, 9);
  const v = victim(g); v.n.traits = ['sensible']; v.r.rel = 50;
  const ch = MV.U.chance; MV.U.chance = () => false;
  let t;
  try { t = bully(g, 'burla').run(g, v.n.id); } finally { MV.U.chance = ch; }
  assert.match(t, /llorar/);
  assert.strictEqual(v.r.rel, 20);
  const m = v.r.mem.find((x) => x.k === 'humillacion');
  assert.strictEqual(Math.abs(m.v), 3);
});

test('el abusón con nombre', () => {
  let withAb = 0, without = 0;
  for (let s = 1; s <= 40 && (withAb < 3 || without < 3); s++) {
    MV.rng.seed(s);
    const g = student(MV, s, 9);
    const ab = S().mate(g, 'abuson');
    const ev = MV.EV.byId.abuson;
    if (ab) {
      withAb++;
      assert.ok(!ev.when(g));
      g.p.flags.abuson = ab.n.id;
      const a = MV.sys.edu.actions(g).find((x) => x.id === 'abuson');
      let named = false, lost = false;
      for (let k = 1; k <= 60 && !(named && lost); k++) {
        MV.rng.seed(k); g.p.yearActs = {}; g.p.flags.abuson = ab.n.id; ab.r.rel = 30;
        const t = a.run(g);
        assert.ok(!BAD_TEXT.test(t) && t.includes(ab.n.first), t);
        named = true;
        if (g.p.flags.abuson) { lost = true; assert.strictEqual(ab.r.rel, 25); } else assert.strictEqual(ab.r.rel, 30);
      }
      assert.ok(lost);
    } else {
      without++;
      assert.ok(ev.when(g), 'sin abusón el evento sale');
      g.p.flags.abuson = true;
      const t = MV.sys.edu.actions(g).find((x) => x.id === 'abuson').run(g);
      assert.ok(!BAD_TEXT.test(t));
    }
  }
  assert.ok(withAb >= 3 && without >= 3);
  // sin curso, el evento sigue como hoy
  const g0 = game(MV, 3, 8); MV.sys.edu.start(g0, 'primaria'); g0.p.edu.class = null;
  assert.ok(MV.EV.byId.abuson.when(g0));
});

test('ninguna acción de abusón describe violencia', () => {
  const FORBID = /golpe|sangre|pegó|pegaste|herid/i;
  for (let s = 1; s <= 150; s++) {
    MV.rng.seed(s);
    const g = student(MV, s, 9);
    if (s % 2) { const ch = MV.U.chance; MV.U.chance = () => true; try { for (const a of MV.sys.edu.actions(g)) if (['burla', 'broma_pesada', 'merienda'].includes(a.id)) { g.p.yearActs = {}; const v = victim(g); v.n.traits = s % 3 ? ['sensible'] : []; const t = a.run(g, v.n.id); assert.ok(!FORBID.test(t) && !BAD_TEXT.test(t), t); assert.ok(!FORBID.test(a.label + a.sub)); } } finally { MV.U.chance = ch; } }
    else for (const a of MV.sys.edu.actions(g)) if (['burla', 'broma_pesada', 'merienda'].includes(a.id)) { const v = victim(g); const t = a.run(g, v.n.id); assert.ok(!FORBID.test(t) && !BAD_TEXT.test(t), t); }
  }
});

test('el recuerdo de humillación no habla del trabajo', () => {
  const g = game(MV, 5, 30);
  for (const gender of ['m', 'f']) {
    const { n } = person(MV, g, 'amigo', [], { gender });
    const a = MV.sys.memory.said(g, n, { k: 'humillacion', a: 10, v: -2 });
    const b = MV.sys.memory.said(g, n, { k: 'humillacion', a: 10, v: -2, d: 'x' });
    for (const t of [a, b]) assert.ok(!/trabajo/.test(t) && !BAD_TEXT.test(t) && /ridículo/.test(t), t);
  }
});

test('las víctimas pasan al siguiente curso como enemigos y guardan el recuerdo', () => {
  MV.rng.seed(21);
  const g = student(MV, 21, 9, 'primaria');
  S().mates(g).forEach((x) => { x.n.traits = []; });
  S()._newMate(g, 'payaso').traits = [];
  const mates = S().mates(g).filter((x) => x.m.role !== 'amigo');
  const [vic, cold, warm] = mates;
  cold.r.rel = 40; warm.r.rel = 70;
  const ch = MV.U.chance; MV.U.chance = () => false;
  try { MV.sys.edu.actions(g).find((a) => a.id === 'burla').run(g, vic.n.id); } finally { MV.U.chance = ch; }
  const rel = vic.r.rel;
  assert.ok(vic.r.rel < 60);
  S().cleanup(g);
  assert.strictEqual(MV.relOf(g, vic.n.id).type, 'enemigo');
  assert.strictEqual(MV.relOf(g, vic.n.id).rel, rel);
  assert.ok(MV.relOf(g, vic.n.id).mem.some((m) => m.k === 'humillacion'));
  assert.ok(!MV.relOf(g, cold.n.id), 'sin recuerdo malo se va');
  assert.strictEqual(MV.relOf(g, warm.n.id).type, 'amigo');
});

function egresar(seed, perf, adult) {
  const g = game(MV, seed, 17);
  const p = g.p;
  p.edu.done = ['primaria']; p.edu.stage = 'secundaria'; p.edu.year = 5; p.edu.perf = perf;
  if (adult) p.edu.adult = true; else MV.sys.edu.start(g, 'secundaria');
  p.edu.stage = 'secundaria'; p.edu.perf = perf;
  g.queue = [];
  return g;
}

test('se guarda el promedio de egreso', () => {
  const g = egresar(31, 89, false);
  g.p.edu.pop = 64;
  MV.sys.edu.graduate(g);
  assert.strictEqual(g.p.edu.gpa, 89);
  assert.strictEqual(g.p.edu.popEgreso, 64);
  const n = egresar(32, 70, true);
  MV.sys.edu.graduate(n);
  assert.strictEqual(n.p.edu.gpa, 70);
  assert.strictEqual(n.p.edu.popEgreso, undefined);
});

test('el promedio suma en el examen', () => {
  const E = MV.sys.edu;
  const mk = (gpa) => { const p = { edu: {} }; if (gpa !== undefined) p.edu.gpa = gpa; return p; };
  assert.strictEqual(E.examBonus(mk(89)), 9);
  assert.strictEqual(E.examBonus(mk(33)), -5);
  assert.strictEqual(E.examBonus(mk()), 0);
  assert.strictEqual(E.examBonus(mk(55)), 0);
});

test('beca por promedio', () => {
  const E = MV.sys.edu;
  const mk = (smarts, gpa) => ({ stats: { smarts }, edu: gpa == null ? {} : { gpa } });
  assert.strictEqual(E.canBeca(mk(50, 84)), true);
  assert.ok(Math.abs(E.becaChance(mk(50, 84)) - 0.3) < 1e-9);
  assert.strictEqual(E.canBeca(mk(69, 83)), false);
  assert.strictEqual(E.becaChance(mk(105, 100)), 0.95);
  const g = game(MV, 40, 18);
  g.p.stats.smarts = 50; g.p.edu.gpa = 90;
  MV.EV.push(g, 'pagar_universidad', { major: 'medicina', mname: 'Medicina' }, true);
  const v = MV.EV.view(g);
  assert.ok(v.choices.some((c) => /Solicitar una beca/.test(c.label)));
  const h = game(MV, 41, 18);
  h.p.stats.smarts = 50; h.p.edu.gpa = 60;
  MV.EV.push(h, 'pagar_universidad', { major: 'medicina', mname: 'Medicina' }, true);
  assert.ok(!MV.EV.view(h).choices.some((c) => /Solicitar una beca/.test(c.label)));
});

test('el texto dice tu promedio', () => {
  for (const gpa of [60, 84, 95]) {
    const g = game(MV, 50, 18);
    g.p.edu.gpa = gpa; g.p.stats.smarts = 60;
    MV.EV.push(g, 'fin_secundaria', { grade: MV.grade(gpa) }, true);
    const t = MV.EV.view(g).text;
    assert.ok(t.includes(MV.grade(gpa)), t);
    assert.ok(!BAD_TEXT.test(t), t);
    assert.strictEqual(/beca/.test(t), gpa >= 84, t);
  }
  for (const [gpa, re] of [[89, /suma 9 puntos/], [33, /resta 5/], [55, /^(?!.*promedio te)/]]) {
    const g = game(MV, 51, 18);
    g.p.edu.gpa = gpa;
    MV.EV.push(g, 'pagar_universidad', { major: 'medicina', mname: 'Medicina' }, true);
    const t = MV.EV.view(g).text;
    assert.match(t, re);
    assert.ok(!BAD_TEXT.test(t), t);
  }
});

// — Tarea 8: eventos de la escuela y logros —
const ESC = ['esc_delegado', 'esc_cumple', 'esc_grupo', 'esc_rival', 'esc_abuson', 'esc_testigo', 'esc_crush', 'esc_pelea_amigo', 'esc_talento', 'esc_citacion', 'esc_copia', 'esc_foto'];
/** Un alumno con curso completo: abusón y alguien que te gusta (si tiene 14 o más). */
function escScene(seed, age, pop) {
  for (let s = seed; s < seed + 400; s++) {
    MV.rng.seed(s);
    const g = student(MV, s, age);
    if (!S().mate(g, 'abuson')) S()._newMate(g, 'abuson');
    if (age >= 14 && !S().mate(g, 'crush')) continue;
    g.p.edu.pop = pop == null ? 50 : pop;
    g.p.skills.carisma = 10;
    return g;
  }
  throw new Error('sin escena');
}
const forceCtx = (g, d) => { const c = {}; if (d.target) c.target = d.target(g); if (d.ctx) Object.assign(c, d.ctx(g)); return c; };
const showEv = (g, id) => { const d = MV.EV.byId[id]; MV.EV.push(g, id, forceCtx(g, d), true); return MV.EV.view(g); };
const labelIdx = (v, re) => { const c = v.choices.find((x) => re.test(x.label)); assert.ok(c, 'opción ' + re + ' en ' + v.choices.map((x) => x.label).join(' | ')); return c.i; };
const quiet = (val, fn) => { const ch = MV.U.chance; MV.U.chance = () => val; try { return fn(); } finally { MV.U.chance = ch; } };

/** Cambia el género del jugador y de todo el curso; quien te gusta sigue gustándote. */
function setGenders(g, pg, og) {
  g.p.gender = pg;
  S().mates(g).forEach((x) => {
    x.n.gender = og;
    if (x.m.role === 'crush') x.n.gender = g.p.orientation === 'bi' ? og : g.p.orientation === 'homo' ? pg : (pg === 'm' ? 'f' : 'm');
  });
  S().teacher(g).n.gender = og;
}

test('cada evento sale con su condición', () => {
  const ok = (g, id) => assert.ok(MV.EV.eligible(g, MV.EV.byId[id]), id + ' debía salir');
  const no = (g, id) => assert.strictEqual(MV.EV.eligible(g, MV.EV.byId[id]), null, id + ' no debía salir');
  assert.deepStrictEqual(ESC.filter((id) => !MV.EV.byId[id]), []);
  ESC.forEach((id) => assert.ok(MV.EV.byId[id].choices.length >= 3, id));
  // delegado: secundaria y barra 70+
  let g = escScene(1, 15, 70); ok(g, 'esc_delegado');
  g.p.edu.pop = 69; no(g, 'esc_delegado');
  g = escScene(1, 9, 90); no(g, 'esc_delegado');
  // cumpleaños: 70+ o 30-
  g = escScene(1, 12, 80); ok(g, 'esc_cumple'); g.p.edu.pop = 70; ok(g, 'esc_cumple');
  g.p.edu.pop = 30; ok(g, 'esc_cumple'); g.p.edu.pop = 31; no(g, 'esc_cumple'); g.p.edu.pop = 69; no(g, 'esc_cumple');
  // los que solo piden estar en la escuela
  g = escScene(2, 15, 50);
  ['esc_grupo', 'esc_rival', 'esc_abuson', 'esc_testigo', 'esc_pelea_amigo', 'esc_copia', 'esc_foto'].forEach((id) => ok(g, id));
  g = escScene(2, 9, 50);
  ['esc_grupo', 'esc_rival', 'esc_abuson', 'esc_testigo', 'esc_pelea_amigo', 'esc_copia'].forEach((id) => ok(g, id));
  no(g, 'esc_foto'); no(g, 'esc_crush');
  // abusón y testigo piden un abusón en el curso
  const ab = S().mate(g, 'abuson'); ab.m.role = 'comun';
  S().mates(g).filter((x) => x.m.role === 'payaso').forEach((x) => { x.m.role = 'comun'; });
  no(g, 'esc_abuson'); no(g, 'esc_testigo');
  // crush
  g = escScene(3, 15, 50); ok(g, 'esc_crush');
  g.p.edu.class.mates = g.p.edu.class.mates.filter((m) => m.role !== 'crush'); no(g, 'esc_crush');
  // talento: taller o habilidad alta
  g = escScene(4, 14, 50);
  Object.keys(g.p.skills).forEach((k) => { g.p.skills[k] = 10; }); g.p.clubs = [];
  no(g, 'esc_talento');
  g.p.skills.arte = 70; ok(g, 'esc_talento');
  g.p.skills.arte = 10; g.p.clubs = ['arte']; ok(g, 'esc_talento');
  // citación: molestaste este año o el anterior, o una suspensión
  g = escScene(5, 14, 50);
  g.p.edu.susp = 0; delete g.p.edu.lastBully; no(g, 'esc_citacion');
  g.p.edu.lastBully = g.p.age; ok(g, 'esc_citacion');
  g.p.edu.lastBully = g.p.age - 1; ok(g, 'esc_citacion');
  g.p.edu.lastBully = g.p.age - 2; no(g, 'esc_citacion');
  g.p.edu.susp = 1; ok(g, 'esc_citacion');
  // la acción de molestar deja la marca
  g = escScene(6, 14, 50);
  quiet(false, () => S().actions(g).find((a) => a.id === 'burla').run(g, S().mate(g, 'rival').n.id));
  assert.strictEqual(g.p.edu.lastBully, g.p.age);
  // fuera de la escuela y en la cárcel, ninguno
  const adult = game(MV, 7, 30);
  ESC.forEach((id) => no(adult, id));
  g = escScene(8, 15, 80); g.p.edu.susp = 1; g.p.prison = { left: 3, total: 3, crime: 'Robo', behavior: 50, gang: false, since: 15 };
  ESC.forEach((id) => no(g, id));
  g = escScene(8, 15, 80); g.p.edu.adult = true;
  ESC.forEach((id) => no(g, id));
});

test('esc_abuson pesa 3 con la barra baja y 1 si no', () => {
  const g = escScene(9, 12, 30);
  const d = MV.EV.byId.esc_abuson;
  assert.strictEqual(MV.EV.weight(g, d), 3);
  g.p.edu.pop = 29; assert.strictEqual(MV.EV.weight(g, d), 3);
  g.p.edu.pop = 31; assert.strictEqual(MV.EV.weight(g, d), 1);
  g.p.edu.pop = 90; assert.strictEqual(MV.EV.weight(g, d), 1);
  ESC.filter((id) => id !== 'esc_abuson').forEach((id) => assert.strictEqual(MV.EV.weight(g, MV.EV.byId[id]), 1, id));
  ESC.forEach((id) => assert.strictEqual(MV.EV.byId[id].cd, 6, id));
});

test('si la persona se va, su evento desaparece', () => {
  for (const how of ['die', 'removeRel']) {
    for (const [id, role, age] of [['esc_rival', 'rival', 12], ['esc_crush', 'crush', 15], ['esc_abuson', 'abuson', 12], ['esc_pelea_amigo', 'amigo', 12], ['esc_testigo', 'rival', 12]]) {
      const g = escScene(11, age, 50);
      const d = MV.EV.byId[id];
      const ctx = MV.EV.eligible(g, d);
      assert.ok(ctx, id);
      const gone = id === 'esc_testigo' ? ctx.target : S().mate(g, role).n.id;
      MV.EV.push(g, id, ctx, true);
      assert.ok(MV.EV.view(g), 'antes se ve');
      if (how === 'die') MV.sys.people.die(g, MV.person(g, gone), 'accidente'); else MV.removeRel(g, gone);
      let v;
      assert.doesNotThrow(() => { v = MV.EV.view(g); });
      assert.ok(!v || v.id !== id, id + ' ya no debía verse');
    }
  }
  // el tutor de la citación y del talento
  for (const id of ['esc_citacion', 'esc_talento']) {
    const g = escScene(12, 14, 50); g.p.edu.susp = 1; g.p.skills.arte = 80;
    const ctx = MV.EV.eligible(g, MV.EV.byId[id]);
    MV.EV.push(g, id, ctx, true);
    MV.sys.people.die(g, S().teacher(g).n, 'accidente');
    const v = MV.EV.view(g);
    assert.ok(!v || v.id !== id);
  }
  // y si se acaba el curso
  const g = escScene(13, 15, 50);
  const ctx = MV.EV.eligible(g, MV.EV.byId.esc_rival);
  MV.EV.push(g, 'esc_rival', ctx, true);
  S().cleanup(g);
  assert.ok(!MV.EV.view(g));
});

test('los textos de los eventos de la escuela', () => {
  const checkText = (t, where) => { assert.ok(typeof t === 'string' && t.length, where); assert.ok(!BAD_TEXT.test(t), where + ': ' + t); };
  let seen = 0;
  for (const pg of ['m', 'f']) for (const og of ['m', 'f']) for (const bar of [15, 69, 85]) for (const age of [9, 15]) {
    const g = escScene(20 + seen, age, bar);
    setGenders(g, pg, og);
    g.p.edu.susp = 1; g.p.skills.arte = 70;
    for (const id of ESC) {
      if (id === 'esc_crush' && age < 14) continue;
      if (id === 'esc_foto' && age < 12) continue;
      if (id === 'esc_delegado' && age < 12) continue;
      g.queue = [];
      const v = showEv(g, id);
      assert.ok(v && v.id === id, id);
      seen++;
      const all = [v.title, v.text].concat(v.choices.map((c) => c.label + ' ' + (c.sub || '')));
      all.forEach((t) => checkText(t, id));
      if (bar < 70) all.forEach((t) => assert.ok(!/popular/i.test(t.replace(/no eres popular/gi, '')), id + ': ' + t));
      // y los resultados de cada opción
      v.choices.forEach((c) => {
        for (const val of [true, false]) {
          const h = escScene(20 + seen, age, bar);
          setGenders(h, pg, og); h.p.skills.arte = 70; h.p.edu.susp = 1;
          const w = showEv(h, id);
          const ci = w.choices.find((x) => x.label === c.label);
          if (!ci) continue;
          const res = quiet(val, () => MV.EV.choose(h, ci.i));
          checkText(res.msg, id + '#' + ci.i);
          if (bar < 70) assert.ok(!/popular/i.test(res.msg.replace(/no eres popular/gi, '')), res.msg);
          assert.ok(h.p.money >= 0, id + ' dejó el dinero negativo');
        }
      });
    }
  }
  assert.ok(seen > 100);
});

test('todas las opciones de los eventos de la escuela funcionan', () => {
  for (const id of ESC) {
    const n = MV.EV.byId[id].choices.length;
    for (let i = 0; i < n; i++) for (const bar of [20, 50, 85]) for (const val of [true, false]) for (const money of [0, 100]) {
      const g = escScene(40 + i, 15, bar);
      g.p.money = money; g.p.skills.arte = 70; g.p.edu.susp = 1;
      const v = showEv(g, id);
      if (!v.choices.some((x) => x.i === i)) continue;
      let res;
      assert.doesNotThrow(() => { res = quiet(val, () => MV.EV.choose(g, i)); }, `${id}#${i}`);
      assert.ok(res.msg && !BAD_TEXT.test(res.msg), `${id}#${i}: ${res.msg}`);
      assert.ok(g.p.money >= 0, `${id}#${i} dejó el dinero negativo`);
      assert.ok(g.p.edu.pop >= 0 && g.p.edu.pop <= 100);
    }
  }
});

test('el delegado: +5 y el logro', () => {
  const g = escScene(50, 15, 80);
  const v = showEv(g, 'esc_delegado');
  assert.ok(v.text.includes(S().mate(g, 'rival').n.first));
  quiet(true, () => MV.EV.choose(g, labelIdx(v, /propuestas/i)));
  assert.strictEqual(g.p.edu.pop, 85);
  assert.ok(g.achLife.includes('delegado'));
  const h = escScene(50, 15, 80);
  const w = showEv(h, 'esc_delegado');
  quiet(false, () => MV.EV.choose(h, labelIdx(w, /propuestas/i)));
  assert.ok(!(h.achLife || []).includes('delegado'));
  assert.ok(h.p.edu.pop <= 80);
});

test('el cumpleaños: invitado suma 3 y sin invitación no mueve la barra', () => {
  const g = escScene(51, 12, 75);
  const v = showEv(g, 'esc_cumple');
  assert.ok(/invit/i.test(v.text));
  MV.EV.choose(g, v.choices[0].i);
  assert.strictEqual(g.p.edu.pop, 78);
  const h = escScene(51, 12, 20);
  const w = showEv(h, 'esc_cumple');
  assert.ok(/no te invit/i.test(w.text), w.text);
  assert.ok(w.choices.length >= 2);
  w.choices.forEach((c) => {
    const x = escScene(51, 12, 20);
    const y = showEv(x, 'esc_cumple');
    MV.EV.choose(x, y.choices.find((q) => q.label === c.label).i);
    assert.strictEqual(x.p.edu.pop, 20);
  });
});

test('el abusón te elige: marca al abusón por su id', () => {
  const g = escScene(52, 9, 25);
  const ab = S().mate(g, 'abuson');
  const v = showEv(g, 'esc_abuson');
  assert.ok(v.text.includes(ab.n.first));
  assert.ok(v.choices.length === 4);
  MV.EV.choose(g, labelIdx(v, /Ignorar/i));
  assert.strictEqual(g.p.flags.abuson, ab.n.id);
  const a = MV.sys.edu.actions(g).find((x) => x.id === 'abuson');
  assert.ok(a);
  assert.ok(quiet(true, () => a.run(g)).includes(ab.n.first));
  const ok = escScene(52, 9, 25), vo = showEv(ok, 'esc_abuson');
  quiet(true, () => MV.EV.choose(ok, labelIdx(vo, /Contárselo/i)));
  assert.ok(!ok.p.flags.abuson);
  const ko = escScene(52, 9, 25), vk = showEv(ko, 'esc_abuson');
  const p0 = ko.p.edu.pop;
  quiet(false, () => MV.EV.choose(ko, labelIdx(vk, /Contárselo/i)));
  assert.strictEqual(ko.p.flags.abuson, S().mate(ko, 'abuson').n.id);
  assert.ok(ko.p.edu.pop < p0);
  const pl = escScene(52, 9, 50), vp = showEv(pl, 'esc_abuson');
  quiet(true, () => MV.EV.choose(pl, labelIdx(vp, /Plantar/i)));
  assert.ok(pl.p.edu.pop > 50);
  const FORBID = /golpe|sangre|pegó|pegaste|herid|puñ|patada/i;
  for (const val of [true, false]) for (let i = 0; i < 4; i++) {
    const h = escScene(53 + i, 9, 25), w = showEv(h, 'esc_abuson');
    const r = quiet(val, () => MV.EV.choose(h, i));
    assert.ok(!FORBID.test(w.text + r.msg), r.msg);
  }
});

test('ves al abusón molestar a otro: sumarte es molestar', () => {
  const g = escScene(54, 12, 50);
  const ab = S().mate(g, 'abuson');
  const v = showEv(g, 'esc_testigo');
  const t = MV.person(g, v.target.id);
  assert.ok(v.text.includes(ab.n.first) && v.text.includes(t.first), v.text);
  const r = MV.relOf(g, t.id), rel0 = r.rel, b0 = g.p.edu.bullied || 0;
  quiet(false, () => MV.EV.choose(g, labelIdx(v, /Sumarte/i)));
  assert.ok(r.rel < rel0);
  assert.strictEqual(g.p.edu.bullied, b0 + 1);
  assert.strictEqual(g.p.edu.lastBully, g.p.age);
  assert.ok(r.mem.some((m) => m.k === 'humillacion'));
  assert.ok(g.p.edu.pop > 50);
  const h = escScene(54, 12, 50), w = showEv(h, 'esc_testigo');
  quiet(true, () => MV.EV.choose(h, labelIdx(w, /Sumarte/i)));
  assert.strictEqual(h.p.edu.susp, 1);
  const k = escScene(54, 12, 50), x = showEv(k, 'esc_testigo');
  quiet(true, () => MV.EV.choose(k, labelIdx(x, /Defender/i)));
  assert.ok(!k.p.edu.bullied);
  assert.strictEqual(typeof S().tease, 'function');
});

test('quien te gusta te escribe y puede ser tu pareja', () => {
  const g = escScene(55, 15, 50);
  const c = S().mate(g, 'crush');
  const v = showEv(g, 'esc_crush');
  assert.ok(v.text.includes(c.n.first));
  assert.ok(!/sex|beso|desnud|cuerpo/i.test(v.text + v.choices.map((x) => x.label).join(' ')));
  quiet(true, () => MV.EV.choose(g, labelIdx(v, /salir/i)));
  assert.ok(MV.partner(g) && MV.partner(g).n.id === c.n.id);
  const h = escScene(55, 15, 50), w = showEv(h, 'esc_crush');
  quiet(false, () => MV.EV.choose(h, labelIdx(w, /salir/i)));
  assert.ok(!MV.partner(h));
  for (let i = 0; i < w.choices.length; i++) {
    const x = escScene(55, 15, 50), y = showEv(x, 'esc_crush');
    if (!y.choices.some((q) => q.i === i)) continue;
    MV.EV.choose(x, i);
    assert.ok(x.p.money >= 0);
  }
  const p = escScene(55, 15, 50); MV.addRel(p, MV.newNPC(p, { age: 15 }), 'pareja', 60);
  assert.strictEqual(MV.EV.eligible(p, MV.EV.byId.esc_crush), null);
});

test('la foto vergonzosa, la copia y la pelea con el mejor amigo', () => {
  let g = escScene(56, 15, 50); g.p.skills.carisma = 10;
  let v = showEv(g, 'esc_foto');
  assert.ok(/dorm/i.test(v.text), v.text);
  MV.EV.choose(g, labelIdx(v, /Reírte/i));
  assert.strictEqual(g.p.edu.pop, 42);
  g = escScene(56, 15, 50); g.p.skills.carisma = 80;
  v = showEv(g, 'esc_foto'); MV.EV.choose(g, labelIdx(v, /Reírte/i));
  assert.strictEqual(g.p.edu.pop, 46);
  g = escScene(56, 15, 50); v = showEv(g, 'esc_foto'); MV.EV.choose(g, labelIdx(v, /Ignorar/i));
  assert.strictEqual(g.p.edu.pop, 42);
  g = escScene(57, 15, 50); const k0 = g.p.karma;
  v = showEv(g, 'esc_copia'); MV.EV.choose(g, labelIdx(v, /Acusar/i));
  assert.strictEqual(g.p.edu.pop, 44);
  assert.strictEqual(g.p.karma, k0 + 1);
  g = escScene(58, 15, 50); const am = S().mate(g, 'amigo');
  v = showEv(g, 'esc_pelea_amigo');
  assert.ok(v.text.includes(am.n.first));
  MV.EV.choose(g, labelIdx(v, /Romper/i));
  assert.ok(am.r.rel < 40);
  assert.notStrictEqual(am.m.role, 'amigo');
  g = escScene(58, 15, 50); const a2 = S().mate(g, 'amigo'); a2.r.rel = 50;
  v = showEv(g, 'esc_pelea_amigo'); MV.EV.choose(g, labelIdx(v, /perd[oó]n/i));
  assert.ok(a2.r.rel > 50);
});

test('los logros de la escuela', () => {
  ['delegado', 'abanderado', 'recreo'].forEach((id) => assert.ok(MV.ach.def(id) && MV.ach.def(id).name && MV.ach.def(id).icon && MV.ach.def(id).desc, id));
  assert.strictEqual(MV.ach.def('delegado').name, 'Delegado del curso');
  assert.strictEqual(MV.ach.def('recreo').name, 'Rey o reina del recreo');
  let g = egresar(60, 95, false); MV.sys.edu.graduate(g);
  assert.ok(g.achLife.includes('abanderado'));
  g = egresar(61, 94, false); MV.sys.edu.graduate(g);
  assert.ok(!(g.achLife || []).includes('abanderado'));
  g = student(MV, 62, 15);
  g.p.edu.pop = 88; S().pop(g, 1); assert.ok(!(g.achLife || []).includes('recreo'));
  S().pop(g, 2); assert.ok(g.achLife.includes('recreo'));
  g = student(MV, 63, 9); g.p.edu.pop = 80; S().pop(g, 15);
  assert.ok(!(g.achLife || []).includes('recreo'), 'en primaria no');
  g = student(MV, 64, 15); g.p.edu.pop = 95; MV.ach.check(g);
  assert.ok(g.achLife.includes('recreo'));
});

test('el viejo pelea_patio nombra al rival y nerd_amigo usa al curso', () => {
  const g = student(MV, 70, 9); g.queue = [];
  const rv = S().mate(g, 'rival');
  MV.EV.push(g, 'pelea_patio', {}, true);
  const v = MV.EV.view(g);
  assert.ok(v.text.includes(rv.n.first), v.text);
  assert.ok(!BAD_TEXT.test(v.text));
  v.choices.forEach((c) => { const h = student(MV, 70, 9); MV.EV.push(h, 'pelea_patio', {}, true); assert.doesNotThrow(() => MV.EV.choose(h, c.i)); });
  const s = student(MV, 71, 9); s.p.edu.class = null; s.queue = [];
  MV.EV.push(s, 'pelea_patio', {}, true);
  assert.ok(/^Un compañero/.test(MV.EV.view(s).text));
  const n = student(MV, 72, 15); n.queue = [];
  if (!S().mates(n).some((x) => x.m.role === 'payaso' || x.m.role === 'comun')) S()._newMate(n, 'payaso');
  const d = MV.EV.byId.nerd_amigo, ctx = MV.EV.eligible(n, d);
  assert.ok(ctx && ctx.mate);
  MV.EV.push(n, 'nerd_amigo', ctx, true);
  const nv = MV.EV.view(n);
  assert.ok(nv.text.includes(MV.person(n, ctx.mate).first), nv.text);
  const people = Object.keys(n.people).length, rel0 = MV.relOf(n, ctx.mate).rel;
  MV.EV.choose(n, 0);
  assert.strictEqual(Object.keys(n.people).length, people, 'no crea gente nueva');
  assert.ok(MV.relOf(n, ctx.mate).rel > rel0);
  const o = student(MV, 73, 15); o.p.edu.class = null; o.queue = [];
  const oc = MV.EV.eligible(o, d);
  MV.EV.push(o, 'nerd_amigo', oc, true);
  const pp = Object.keys(o.people).length;
  MV.EV.choose(o, 0);
  assert.strictEqual(Object.keys(o.people).length, pp + 1);
});

// — Tarea 8, ronda de correcciones 1 —
/** Todo lo que se ve de un evento: título, texto, opciones y resultados de cada opción con el azar forzado en las dos ramas. */
function everything(mk, id, withEvent) {
  const out = [];
  const g0 = mk();
  const v0 = withEvent(g0, id);
  out.push(v0.title, v0.text, ...v0.choices.map((c) => c.label + ' ' + (c.sub || '')));
  v0.choices.forEach((c) => {
    for (const val of [true, false]) {
      const g = mk();
      const v = withEvent(g, id);
      const ci = v.choices.find((x) => x.label === c.label);
      if (!ci) continue;
      out.push(quiet(val, () => MV.EV.choose(g, ci.i)).msg);
    }
  });
  return out;
}
const withOld = (g, id) => { MV.EV.push(g, id, {}, true); return MV.EV.view(g); };
const evOf = (g, id) => (id === 'pelea_patio' ? withOld(g, id) : showEv(g, id));

test('concordancia de género en los eventos de la escuela', () => {
  const MASC = /el delegado|el distraído|el sordo|soplón|Ignorarlo|Defenderlo|Acusarlo|lo acusaste|un héroe|un actor|el tutor|El tutor|Él se|\bél\b|tu mejor amigo|Hacerte su amigo|que lo dejara|el abusón|El abusón|\bun compañero\b|el payaso|el profesor|el maestro|Lo ignoraste/;
  const FEM = /la delegada|la distraída|la sorda|soplona|Ignorarla|Defenderla|Acusarla|la acusaste|una heroína|una actriz|la tutora|La tutora|Ella se|\bella\b|tu mejor amiga|Hacerte su amiga|la abusona|La abusona|una compañera|la payasa|la profesora|la maestra|Hacerte la|Eres la|La ignoraste/;
  const mk = (pg, og) => (() => { const g = escScene(80, 15, 50); setGenders(g, pg, og); g.p.edu.susp = 1; g.p.skills.arte = 70; return g; });
  const kids = (id) => id === 'pelea_patio' ? (() => { const g = escScene(80, 9, 50); return g; }) : null;
  void kids;
  for (const id of ESC.concat(['pelea_patio'])) {
    const fem = everything(mk('f', 'f'), id, evOf);
    fem.forEach((t) => { assert.ok(!BAD_TEXT.test(t), t); assert.ok(!MASC.test(t), `${id} (todas mujeres): "${t}" ->  ${t.match(MASC)}`); });
    const masc = everything(mk('m', 'm'), id, evOf);
    masc.forEach((t) => assert.ok(!FEM.test(t), `${id} (todos hombres): "${t}" -> ${t.match(FEM)}`));
  }
});

test('sin fama en los resultados con la barra baja', () => {
  const BIG = /leyenda|\brey\b|\breina\b|famos|popular/i;
  for (const bar of [15, 69]) for (const id of ESC) {
    const mk = () => { const g = escScene(81, 15, bar); g.p.edu.susp = 1; g.p.skills.arte = 70; return g; };
    everything(mk, id, showEv).forEach((t) => assert.ok(!BIG.test(t.replace(/no eres popular/gi, '')), `${id}: ${t}`));
  }
});

test('echarle la culpa a otro resta 3 de karma en las dos ramas', () => {
  for (const val of [true, false]) {
    const g = escScene(82, 14, 50); g.p.edu.susp = 1;
    const k0 = g.p.karma;
    const v = showEv(g, 'esc_citacion');
    quiet(val, () => MV.EV.choose(g, labelIdx(v, /culpa/i)));
    assert.strictEqual(g.p.karma, k0 - 3, 'rama ' + val);
  }
});

test('las olimpíadas se leen bien y pelea_patio no describe heridas', () => {
  const g = escScene(83, 14, 50); g.p.skills.deporte = 80;
  Object.keys(g.p.skills).forEach((k) => { if (k !== 'deporte') g.p.skills[k] = 10; });
  g.p.clubs = [];
  const v = showEv(g, 'esc_talento');
  assert.ok(!/Hay las /.test(v.text) && /unas olimpíadas/.test(v.text), v.text);
  const INJURY = /ojo|sangre|golpe|pegó|pegaste|herid|moret/i;
  for (const age of [9]) {
    const mk = () => escScene(84, age, 50);
    everything(mk, 'pelea_patio', evOf).forEach((t) => assert.ok(!INJURY.test(t), t));
  }
  // los efectos de pelear siguen siendo los mismos
  const win = escScene(84, 9, 50), lose = escScene(84, 9, 50);
  const vw = withOld(win, 'pelea_patio'), k0 = win.p.karma;
  quiet(true, () => MV.EV.choose(win, vw.choices[2].i));
  assert.strictEqual(win.p.karma, k0 - 2);
  const h0 = lose.p.stats.health, vl = withOld(lose, 'pelea_patio');
  quiet(false, () => MV.EV.choose(lose, vl.choices[2].i));
  assert.strictEqual(lose.p.stats.health, h0 - 5);
});

// — Tarea 9: romance con un docente universitario —
function uni(seed, age, o) {
  o = o || {};
  const g = game(MV, seed, age);
  g.p.gender = o.gender || 'm'; g.p.orientation = o.orientation || 'hetero';
  g.p.stats.looks = o.looks == null ? 60 : o.looks; g.p.skills.carisma = o.carisma == null ? 10 : o.carisma;
  MV.sys.edu.start(g, o.stage || 'universidad', { major: o.major === undefined ? 'derecho' : o.major });
  return g;
}
const PROFE = () => MV.EV.byId.uni_profe;

test('el docente solo en estudios superiores', () => {
  const ok = (g) => assert.ok(MV.EV.eligible(g, PROFE()), 'debía salir');
  const no = (g, why) => assert.strictEqual(MV.EV.eligible(g, PROFE()), null, why);
  no(uni(1, 17), '17 años');
  const sec = uni(2, 18, { stage: 'secundaria', major: null }); no(sec, 'secundaria');
  no(uni(3, 20, { looks: 40, carisma: 40 }), 'looks y carisma bajos');
  const g = uni(4, 20); ok(g);
  ok(uni(5, 20, { looks: 10, carisma: 55 }));
  ok(uni(6, 25, { stage: 'tecnica', major: 'mecanica' }));
  ok(uni(7, 25, { stage: 'posgrado', major: null }));
  const v = showEv(g, 'uni_profe');
  MV.EV.choose(g, labelIdx(v, /Rechazar/));
  no(g, 'ya salió en esta etapa');
  const h = uni(8, 20); h.p.edu.stage = 'universidad'; h.p.edu.profEv = 'universidad:derecho'; no(h, 'marca de etapa');
  h.p.edu.major = 'medicina'; ok(h);
});

test('aceptar', () => {
  for (const [pg, ori] of [['m', 'hetero'], ['f', 'hetero'], ['m', 'homo'], ['f', 'bi']]) {
    for (let s = 1; s <= 25; s++) {
      MV.rng.seed(s);
      const g = uni(s, 21, { gender: pg, orientation: ori });
      const v = showEv(g, 'uni_profe');
      assert.ok(!BAD_TEXT.test(v.text), v.text);
      MV.EV.choose(g, labelIdx(v, /Aceptar/));
      const x = MV.rels(g, ['pareja', 'amante'])[0];
      assert.ok(x && x.r.type === 'pareja' && x.r.prof === true, 'pareja con prof');
      assert.ok(!x.n.schoolTeacher);
      assert.ok(x.n.age >= 28 && x.n.age <= 60);
      assert.match(x.n.job, /^Profesor(a)? universitari[oa]$/);
      assert.strictEqual(x.n.job.endsWith('a'), x.n.gender === 'f');
      assert.ok(MV.sys.rels.attracted(g.p, x.n));
      assert.ok(x.r.rel >= 60 && x.r.rel <= 75);
      assert.ok(v.text.includes(x.n.first), 'el texto nombra a quien se crea');
    }
  }
  const g = uni(31, 21);
  const sp = person(MV, g, 'conyuge', [], { gender: 'f', age: 24 });
  const v = showEv(g, 'uni_profe');
  const r = MV.EV.choose(g, labelIdx(v, /Aceptar/));
  assert.ok(!BAD_TEXT.test(r.msg), r.msg);
  const lover = MV.rels(g, ['amante'])[0];
  assert.ok(lover && lover.r.prof === true);
  assert.ok(r.msg.includes(sp.n.first), 'infidelidad');
  assert.strictEqual(MV.rels(g, ['pareja']).length, 0);
  // las reglas de infidelidad de rels.yearly siguen valiendo
  let found = 0;
  for (let s = 1; s <= 200; s++) {
    MV.rng.seed(s);
    const h = uni(s, 21); const c = person(MV, h, 'conyuge', [], { gender: 'f', age: 24 });
    const w = showEv(h, 'uni_profe'); MV.EV.choose(h, labelIdx(w, /Aceptar/));
    h.queue = []; MV.sys.rels.yearly(h);
    if (h.queue.length) found++;
  }
  assert.ok(found > 0, 'a veces te descubren');
});

test('contárselo a la facultad', () => {
  const g = uni(40, 21); const k0 = g.p.karma, n0 = g.p.rels.length, ppl = Object.keys(g.people).length;
  const v = showEv(g, 'uni_profe');
  const r = MV.EV.choose(g, labelIdx(v, /facultad/));
  assert.strictEqual(g.p.karma, k0 + 1);
  assert.strictEqual(g.p.rels.length, n0);
  assert.strictEqual(Object.keys(g.people).length, ppl, 'no se crea a nadie');
  assert.match(r.msg, /sancionad/);
  assert.ok(!BAD_TEXT.test(r.msg));
});

function comite(seed, type) {
  const g = uni(seed, 21);
  const x = person(MV, g, type || 'pareja', [], { gender: 'f', age: 40, job: 'Profesora universitaria' });
  x.r.prof = true;
  return { g, x };
}
test('el comité', () => {
  let n = 0;
  for (let s = 1; s <= 400; s++) {
    MV.rng.seed(s);
    const { g } = comite(s);
    S().profYearly(g);
    if (g.queue.some((q) => q.id === 'comite_etica')) n++;
  }
  assert.ok(n >= 72 && n <= 128, 'comités ' + n);
  assert.strictEqual(MV.EV.byId.comite_etica.pushOnly, true);
  // al salir a la luz se aplican los efectos, una sola vez
  let g, x;
  for (let s = 1; s < 100; s++) {
    MV.rng.seed(s); ({ g, x } = comite(s));
    const p0 = g.p.edu.perf; S().profYearly(g);
    if (g.queue.length) { assert.strictEqual(g.p.edu.perf, Math.max(0, p0 - 10)); break; }
  }
  assert.match(x.n.job, /Profesora suspendida/);
  assert.strictEqual(g.queue[0].ctx.target, x.n.id);
  const p1 = g.p.edu.perf;
  const v = MV.EV.view(g); MV.EV.view(g);
  assert.strictEqual(g.p.edu.perf, p1, 'ver no cambia nada');
  assert.ok(!BAD_TEXT.test(v.text), v.text);
  assert.ok(v.text.includes(x.n.first));
  // opciones
  const run = (type, re) => {
    let q; for (let s = 1; s < 100; s++) { MV.rng.seed(s); q = comite(s, type); S().profYearly(q.g); if (q.g.queue.length) break; }
    q.g.p.edu.perf = 50;
    const r = MV.EV.choose(q.g, labelIdx(MV.EV.view(q.g), re));
    assert.ok(!BAD_TEXT.test(r.msg), r.msg);
    return q;
  };
  let q = run('pareja', /Seguir/); assert.strictEqual(q.x.r.type, 'pareja'); assert.strictEqual(q.g.p.edu.perf, 50); assert.ok(q.x.r.prof);
  q = run('pareja', /Terminar/); assert.strictEqual(q.x.r.type, 'ex'); assert.ok(!q.x.r.prof);
  q = run('amante', /Terminar/); assert.strictEqual(q.x.r.type, 'ex'); assert.ok(!q.x.r.prof);
  q = run('pareja', /cátedra/); assert.strictEqual(q.g.p.edu.perf, 55); assert.ok(!q.x.r.prof); assert.strictEqual(q.x.r.type, 'pareja');
  const h = comite(5).g; h.p.edu.perf = 3; S().profYearly(h); assert.ok(h.p.edu.perf >= 0);
});

test('al recibirte queda normal', () => {
  for (const how of ['graduate', 'drop']) {
    const { g, x } = comite(50);
    MV.sys.edu[how](g);
    assert.ok(!MV.relOf(g, x.n.id).prof, how);
  }
  const { g, x } = comite(51);
  MV.sys.edu.start(g, 'universidad', { major: 'derecho' }); g.p.edu.year = 4; g.p.edu.perf = 80;
  MV.sys.edu.yearly(g);
  assert.ok(!g.p.rels.some((r) => r.prof), 'yearly que gradúa');
  // en la escuela no se toca
  const s = student(MV, 52, 14); const m = person(MV, s, 'amigo'); m.r.prof = true;
  MV.sys.edu.graduate(s);
  assert.ok(m.r.prof, 'solo estudios superiores');
});

test('los textos del docente', () => {
  const BAD2 = /sexo|desnud|cama/i;
  for (const pg of ['m', 'f']) for (const ori of ['hetero', 'homo']) {
    for (let s = 1; s <= 12; s++) {
      MV.rng.seed(s);
      const g = uni(60 + s, 22, { gender: pg, orientation: ori });
      const v = showEv(g, 'uni_profe');
      const all = [v.title, v.text, ...v.choices.map((c) => c.label + ' ' + (c.sub || ''))];
      for (let i = 0; i < 3; i++) {
        MV.rng.seed(s);
        const h = uni(60 + s, 22, { gender: pg, orientation: ori });
        const w = showEv(h, 'uni_profe'); all.push(MV.EV.choose(h, labelIdx(w, [/Aceptar/, /Rechazar/, /facultad/][i])).msg);
        assert.ok(h.p.money >= 0);
      }
      for (const type of ['pareja', 'amante']) for (const re of [/Seguir/, /Terminar/, /cátedra/]) {
        MV.rng.seed(s);
        const { g: k, x } = comite(60 + s, type); x.n.gender = pg === 'm' ? 'f' : 'm'; if (ori === 'homo') x.n.gender = pg; x.n.job = x.n.gender === 'f' ? 'Profesora universitaria' : 'Profesor universitario';
        k.p.gender = pg;
        S().profYearly(k); if (!k.queue.length) k.queue.push({ id: 'comite_etica', ctx: { target: x.n.id } });
        const w = MV.EV.view(k); all.push(w.title, w.text, ...w.choices.map((c) => c.label));
        all.push(MV.EV.choose(k, labelIdx(w, re)).msg);
        assert.ok(k.p.money >= 0);
      }
      for (const t of all) { assert.ok(!BAD_TEXT.test(t) && !BAD2.test(t), t); }
    }
  }
});
