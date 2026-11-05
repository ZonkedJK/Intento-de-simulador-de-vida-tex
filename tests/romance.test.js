/* Ligues y relaciones: tú decides si son pareja, y eliges protección antes de la intimidad. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

function adult(MV, seed, gender) {
  const g = MV.newGame({ seed, gender: gender || 'm' }); g.p.age = 28; g.p.money = 10000;
  g.p.stats.looks = 100; g.p.skills.carisma = 100;
  return g;
}
function opposite(MV, g) {
  const n = MV.newNPC(g, { age: 27, gender: g.p.gender === 'm' ? 'f' : 'm' });
  return n;
}
const pick = (MV, g, re) => { const v = MV.EV.view(g); const c = v.choices.find((x) => re.test(x.label)); assert.ok(c, 'falta la opción ' + re + ' en ' + v.choices.map((x) => x.label).join(' | ')); return MV.EV.choose(g, c.i); };

test('ligar en la discoteca pregunta por protección y no te deja en pareja solo', () => {
  const MV = load({ seed: 1 });
  let asked = 0;
  for (let i = 0; i < 40; i++) {
    const g = adult(MV, 100 + i);
    MV.doAction(g, MV.ACTS.find((a) => a.id === 'discoteca'), 'ligar');
    if (g.queue[0] && g.queue[0].id === 'proteccion') {
      asked++;
      assert.equal(MV.rels(g, ['pareja', 'amante']).length, 0, 'quedaste en pareja sin elegirlo');
    }
  }
  assert.ok(asked >= 25, 'preguntas: ' + asked);
});

test('con protección nunca hay embarazo', () => {
  const MV = load({ seed: 2 });
  for (let i = 0; i < 150; i++) {
    const g = adult(MV, 300 + i); const n = opposite(MV, g);
    g.queue = []; MV.EV.push(g, 'proteccion', { target: n.id, casual: true }, true);
    pick(MV, g, /Con protección/);
    assert.ok(!g.queue.some((q) => q.id === 'embarazo_sorpresa'));
  }
});

test('sin protección el embarazo ronda el 60 %', () => {
  const MV = load({ seed: 3 });
  let preg = 0;
  for (let i = 0; i < 300; i++) {
    const g = adult(MV, 600 + i); const n = opposite(MV, g);
    g.queue = []; MV.EV.push(g, 'proteccion', { target: n.id, casual: true }, true);
    pick(MV, g, /Sin protección \(60 % de embarazo\)/);
    if (g.queue.some((q) => q.id === 'embarazo_sorpresa')) preg++;
  }
  assert.ok(preg >= 150 && preg <= 210, 'embarazos: ' + preg);
});

test('sin riesgo de embarazo (mismo género) la opción no promete un porcentaje', () => {
  const MV = load({ seed: 4 });
  const g = adult(MV, 4, 'f'); const n = MV.newNPC(g, { age: 27, gender: 'f' });
  g.queue = []; MV.EV.push(g, 'proteccion', { target: n.id, casual: true }, true);
  const labels = MV.EV.view(g).choices.map((c) => c.label).join(' | ');
  assert.ok(!/60 %/.test(labels), labels);
  pick(MV, g, /Sin protección/);
  assert.ok(!g.queue.some((q) => q.id === 'embarazo_sorpresa'));
});

test('después de una noche casual decides: pareja, amigos o nada', () => {
  const MV = load({ seed: 5 });
  const run = (re) => {
    const g = adult(MV, 5); const n = opposite(MV, g);
    g.queue = []; MV.EV.push(g, 'proteccion', { target: n.id, casual: true }, true);
    pick(MV, g, /Con protección/);
    assert.equal(g.queue[0].id, 'despues_noche');
    pick(MV, g, re);
    return { g, r: MV.relOf(g, n.id) };
  };
  assert.equal(run(/pareja/i).r.type, 'pareja');
  assert.equal(run(/amigos/i).r.type, 'amigo');
  const once = run(/Solo fue una noche/);
  assert.equal(once.r, null);
});

test('si ya tienes pareja, la opción es una aventura en secreto', () => {
  const MV = load({ seed: 6 });
  const g = adult(MV, 6); const cur = opposite(MV, g); MV.addRel(g, cur, 'pareja', 70);
  const n = opposite(MV, g);
  g.queue = []; MV.EV.push(g, 'despues_noche', { target: n.id }, true);
  const labels = MV.EV.view(g).choices.map((c) => c.label).join(' | ');
  assert.ok(!/Proponer que sean pareja/.test(labels), labels);
  pick(MV, g, /secreto/);
  assert.equal(MV.relOf(g, n.id).type, 'amante');
});

test('la app de citas te deja elegir qué son después del match', () => {
  const MV = load({ seed: 7 });
  let decided = 0;
  for (let i = 0; i < 30 && !decided; i++) {
    const g = adult(MV, 900 + i);
    MV.doAction(g, MV.ACTS.find((a) => a.id === 'app_citas'));
    pick(MV, g, /derecha/);
    if (g.queue[0] && g.queue[0].id === 'match_cita') {
      assert.equal(MV.rels(g, ['pareja', 'amante']).length, 0, 'el match te dejó en pareja sin elegir');
      const n = MV.person(g, g.queue[0].ctx.target);
      pick(MV, g, /amigos/i);
      assert.equal(MV.relOf(g, n.id).type, 'amigo');
      decided++;
    }
  }
  assert.ok(decided, 'nunca hubo match');
});

test('pasar la noche con tu pareja también pregunta por protección', () => {
  const MV = load({ seed: 8 });
  const g = adult(MV, 8); const n = opposite(MV, g); const r = MV.addRel(g, n, 'pareja', 70);
  const act = MV.sys.rels.actions(g, r, n).find((a) => a.id === 'intimidad');
  r.acts = {}; g.queue = [];
  MV.doAction(g, act, undefined, r.acts);
  assert.equal(g.queue[0].id, 'proteccion');
  assert.ok(!g.queue.some((q) => q.id === 'embarazo_sorpresa'), 'el embarazo solo sale de la elección');
  pick(MV, g, /Sin protección/);
  assert.ok(!g.queue.some((q) => q.id === 'despues_noche'), 'con tu pareja no se pregunta qué son');
});
