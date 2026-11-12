/* Ejecuta cada opción de cada evento en estados de juego preparados (cubre eventos poco frecuentes). */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');
const { resolveQueue } = require('./agent');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;

/** Partida "rica" a una edad dada, con variantes de situación. */
function richGame(MV, age, variant, seed) {
  const U = MV.U;
  const g = MV.newGame({ seed, year: 2026 });
  const p = g.p;
  Object.values(g.people).forEach((n) => { n.age += age; });
  p.age = age;
  g.log.push({ age, year: g.year + age, items: [] });
  Object.assign(p.stats, { happy: 60, health: 70, smarts: 80, looks: 80 });
  Object.keys(p.skills).forEach((k) => { p.skills[k] = 50; });
  p.fame = 60; p.followers = 30000; p.money = 2e6;
  if (age >= 6 && age < 12) { p.edu.stage = 'primaria'; p.edu.year = age - 6; }
  if (age >= 12 && age < 18) { p.edu.done = ['primaria']; p.edu.stage = 'secundaria'; p.edu.year = age - 12; }
  if (variant === 'simple') {
    p.stats.smarts = 92; p.money = 30000;
    MV.addRel(g, MV.newNPC(g, { age: Math.max(1, age - 2), last: p.last, money: 0 }), 'hermano', 60);
    if (age >= 13 && age <= 17) MV.addRel(g, MV.sys.rels.candidate(g), 'pareja', 60);
    if (age >= 18) {
      p.edu.done = ['primaria', 'secundaria'];
      if (age < 65) MV.sys.career.hire(g, MV.jobById('cajero'));
      if (age >= 22 && age <= 44) { const sp = MV.sys.rels.candidate(g); sp.gender = p.gender === 'm' ? 'f' : 'm'; sp.age = age; MV.addRel(g, sp, 'conyuge', 70); }
    }
    return g;
  }
  if (age >= 18) {
    p.edu.done = ['primaria', 'secundaria', 'universidad'];
    p.edu.degrees = [{ kind: 'universidad', major: 'informatica' }];
    p.license = true; p.housing = 'alquiler'; p.rent = MV.RENTALS[2];
    if (age < 65) MV.sys.career.hire(g, MV.jobById(variant === 'mafia' ? 'mafia' : 'programador'), 1);
    const sp = MV.sys.rels.candidate(g); MV.addRel(g, sp, variant === 'soltero' ? 'pareja' : 'conyuge', 70);
    sp.traits = ['celoso', 'generoso'];
    if (variant === 'soltero') MV.relOf(g, sp.id).since = age - 5;
    [1, 7, 15, 24, 38].forEach((a) => { if (a <= age - 18) { const k = MV.newNPC(g, { age: a, last: p.last, money: a >= 18 ? 5000 : 0 }); MV.addRel(g, k, 'hijo', 70); } });
    p.assets.push({ id: U.uid('a'), type: 'casa', kind: 'Casa', icon: '🏠', name: 'Casa de prueba', value: 200000, cond: 80 });
    p.assets.push({ id: U.uid('a'), type: 'auto', kind: 'Sedán', icon: '🚗', name: 'Auto de prueba', value: 20000, cond: 80 });
    p.business = { type: 'cafe', name: 'Café de prueba', value: 60000, last: 0, since: age, manager: false };
  }
  ['amigo', 'ex', 'enemigo', 'companero'].forEach((t) => { if (age >= 10) MV.addRel(g, MV.newNPC(g, { age: Math.max(14, age) }), t, 55); });
  MV.addRel(g, MV.newPet(g, 'perro'), 'mascota', 70);
  MV.addRel(g, MV.newPet(g, 'loro'), 'mascota', 70);
  if (variant === 'carcel') p.prison = { left: 5, total: 8, crime: 'Robo', behavior: 50, gang: false, since: age };
  if (variant === 'pobre') { p.money = -8000; p.housing = 'calle'; p.rent = null; p.karma = -60; p.stats.health = 25; p.stats.happy = 10; p.job = null; }
  if (variant === 'santo') { p.karma = 70; p.flags.padreAusente = MV.newNPC(g, { gender: 'm', age: age + 30 }).id; }
  if (variant === 'soltero') { p.addic.alcohol = 60; }
  if (variant === 'club') { p.club = 'basquet'; p.sportsExp = { basquet: 6 }; p.skills.deporte = 70; if (p.edu.stage) p.edu.perf = 40; if (p.job && age < 23) p.job = null; }
  if ((variant === 'atleta' || variant === 'atleta_ind') && age >= 16) {
    p.skills.deporte = 75; p.sportsExp = {}; p.fame = 60;
    MV.sys.sports.sign(g, MV.sys.sports.makeOffer(g, variant === 'atleta' ? 'futbol' : 'tenis', 1));
    p.job.perf = 70; p.job.years = 1;
    p.flags.exAtleta = 'futbol';
  }
  return g;
}

const VARIANTS = ['normal', 'simple', 'carcel', 'pobre', 'santo', 'soltero', 'mafia', 'club', 'atleta', 'atleta_ind'];

test('todas las opciones de los eventos aleatorios se pueden ejecutar', () => {
  const MV = load({ seed: 21 });
  let covered = 0, total = 0;
  const uncovered = [];
  MV.EV.list.filter((d) => d.choices && !d.manual).forEach((d, di) => {
    total++;
    const ages = [d.age[0], Math.round((d.age[0] + Math.min(d.age[1], 100)) / 2), Math.min(d.age[1], 100)];
    let found = null;
    outer: for (const v of VARIANTS) for (const a of ages) {
      for (let s = 0; s < 3; s++) {
        const g = richGame(MV, a, v, 900 + di * 7 + s);
        if (MV.EV.eligible(g, d)) { found = { v, a, s: 900 + di * 7 + s }; break outer; }
      }
    }
    if (!found) { uncovered.push(d.id); return; }
    covered++;
    d.choices.forEach((c, i) => {
      const g = richGame(MV, found.a, found.v, found.s);
      const ctx = MV.EV.eligible(g, d);
      assert.ok(ctx, 'el evento dejó de ser elegible: ' + d.id);
      MV.EV.fire(g, d, ctx, true);
      const view = MV.EV.view(g);
      assert.ok(view && view.id === d.id, 'no se pudo mostrar ' + d.id);
      if (c.when && !c.when(g, ctx)) return;
      assert.ok(!BAD_TEXT.test(view.text), `texto roto en ${d.id}: ${view.text}`);
      let res;
      assert.doesNotThrow(() => { res = MV.EV.choose(g, i); }, `la opción ${i} de ${d.id} lanzó un error`);
      assert.ok(res && typeof res.msg === 'string' && res.msg.length, `la opción ${i} de ${d.id} no dio resultado`);
      assert.ok(!BAD_TEXT.test(res.msg), `resultado roto en ${d.id}#${i}: ${res.msg}`);
      assert.doesNotThrow(() => resolveQueue(MV, g), `los eventos encadenados de ${d.id}#${i} fallaron`);
    });
  });
  assert.ok(covered / total >= 0.95, `solo se cubrió ${covered}/${total}. Sin cubrir: ${uncovered.join(', ')}`);
});

test('los eventos manuales funcionan con su contexto', () => {
  const MV = load({ seed: 22 });
  const cases = [
    ['fin_secundaria', 18, {}], ['elegir_carrera', 18, {}], ['pagar_universidad', 18, { major: 'medicina', mname: 'Medicina' }],
    ['elegir_tecnica', 18, {}], ['entrevista', 25, { job: 'cajero', q: 2, order: [2, 0, 1] }], ['audicion', 22, { job: 'actor' }],
    ['audicion', 20, { job: 'modelo' }], ['prueba_deportiva', 20, { sport: 'tenis', sname: 'Tenis' }], ['prueba_deportiva', 17, { sport: 'esports', sname: 'E-sports' }],
    ['reclutamiento', 18, { sport: 'basquet', club: 'Lobos del Norte', level: 0, salary: 30000 }], ['reclutamiento', 20, { sport: 'futbol', club: 'FC Galaxia', level: 1, salary: 150000, uni: true }],
    ['fin_secundaria', 18, { grade: '8,0', offer: { sport: 'voley', club: 'Club Remate Norte', level: 0, salary: 10000 } }], ['oferta_post_retiro', 38, {}], ['eleccion', 30, { job: 'politico' }], ['juicio', 30, { crime: 'Robo', sev: 3 }],
    ['juicio', 16, { crime: 'Hurto', sev: 1 }], ['elegir_aspiracion', 14, { opts: ['rico', 'famoso', 'amor'] }],
    ['banda_exito', 30, {}], ['cazatalentos', 18, {}], ['documento_falso_cae', 17, {}], ['venganza_mafia', 30, {}], ['prestamista_cobra', 30, {}]
  ];
  cases.forEach(([id, age, ctx], ci) => {
    const d = MV.EV.byId[id];
    assert.ok(d, 'falta ' + id);
    if (!d.choices) {
      const g = richGame(MV, age, 'normal', 5000 + ci);
      assert.doesNotThrow(() => { MV.EV.push(g, id, Object.assign({}, ctx), true); resolveQueue(MV, g); }, id);
      return;
    }
    d.choices.forEach((c, i) => {
      const g = richGame(MV, age, 'normal', 5000 + ci * 13 + i);
      MV.EV.push(g, id, Object.assign({}, ctx), true);
      const v = MV.EV.view(g);
      assert.ok(v, 'no se pudo mostrar ' + id);
      if (!v.choices.some((x) => x.i === i)) return;
      let res;
      assert.doesNotThrow(() => { res = MV.EV.choose(g, i); }, `${id}#${i} lanzó un error`);
      assert.ok(!BAD_TEXT.test(res.msg), `${id}#${i}: ${res.msg}`);
      assert.doesNotThrow(() => resolveQueue(MV, g), `encadenados de ${id}#${i}`);
    });
  });
  // Eventos con persona objetivo
  ['boda', 'embarazo_sorpresa', 'infiel_descubierto'].forEach((id) => {
    MV.EV.byId[id].choices.forEach((c, i) => {
      const g = richGame(MV, 30, 'soltero', 7000 + i);
      const part = MV.partner(g);
      MV.addRel(g, MV.sys.rels.candidate(g), 'amante', 60);
      MV.EV.push(g, id, { target: part.n.id, lover: 'Pepa' }, true);
      const v = MV.EV.view(g);
      if (!v || !v.choices.some((x) => x.i === i)) return;
      assert.doesNotThrow(() => MV.EV.choose(g, i), `${id}#${i}`);
      resolveQueue(MV, g);
    });
  });
});

test('todas las acciones de relaciones, actividades, trabajo y cárcel se ejecutan', () => {
  const MV = load({ seed: 23 });
  let n = 0;
  [[8, 'normal'], [16, 'normal'], [30, 'normal'], [30, 'soltero'], [40, 'mafia'], [70, 'normal'], [30, 'carcel'], [35, 'pobre'], [14, 'club'], [24, 'atleta'], [26, 'atleta_ind']].forEach(([age, v], vi) => {
    const base = richGame(MV, age, v, 300 + vi);
    const runAll = (getList, scopeOf) => {
      getList(base).forEach((a, ai) => {
        const opts = a.opts ? (a.opts(base) || []).map((o) => o.id) : [undefined];
        opts.slice(0, 6).forEach((o, oi) => {
          const g = richGame(MV, age, v, 300 + vi);
          const list = getList(g);
          const act = list.find((x) => x.id === a.id);
          if (!act) return;
          let res;
          assert.doesNotThrow(() => { res = MV.doAction(g, act, o, scopeOf(g, act)); }, `acción ${a.id} (${o}) a los ${age} [${v}]`);
          assert.ok(!BAD_TEXT.test(res.msg), `texto roto en ${a.id}: ${res.msg}`);
          assert.doesNotThrow(() => resolveQueue(MV, g), `encadenados de ${a.id}`);
          n++;
        });
      });
    };
    runAll((g) => (g.p.prison ? MV.sys.crime.prisonActions(g) : MV.catsFor(g).flatMap((c) => MV.actsFor(g, c.id))), () => undefined);
    runAll((g) => MV.sys.edu.actions(g).concat(MV.sys.career.actions(g)), () => undefined);
    MV.rels(base).forEach(({ r }, ri) => {
      const id = r.id;
      runAll((g) => { const x = MV.relOf(g, id); return x && g.people[id] ? MV.sys.rels.actions(g, x, g.people[id]) : []; }, (g) => { const x = MV.relOf(g, id); x.acts = x.acts || {}; return x.acts; });
    });
  });
  assert.ok(n > 300, 'se esperaban más acciones probadas: ' + n);
});

test('un evento automático no se aplica si otro del mismo año ya lo dejó sin sentido', () => {
  const MV = load({ seed: 98 });
  MV.ev({ id: 't_a', w: 1000, text: 'A', auto: (g) => { g.p.flags.tA = true; return ''; } });
  MV.ev({ id: 't_b', w: 1, when: (g) => !g.p.flags.tA, text: 'B', auto: (g) => { if (g.p.flags.tA) throw new Error('B se aplicó después de A'); return ''; } });
  MV.EV.list = MV.EV.list.filter((d) => d.id === 't_a' || d.id === 't_b');
  for (let s = 0; s < 200; s++) {
    const g = MV.newGame({ seed: 9800 + s }); g.p.age = 30; g.queue = []; g.evDone = {};
    MV.EV.runYear(g);
  }
});
