/* Estudio de videojuegos, empresa de apps y red social. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
function firm(MV, seed, type, cash) {
  const g = MV.newGame({ seed }); g.p.age = 30; g.p.money = 1e8; g.queue = []; g.p.housing = 'propia';
  MV.sys.company.found(g, type, 'Prueba');
  const c = g.p.companies[g.p.companies.length - 1];
  if (cash) MV.sys.company.inject(g, c.id, cash);
  return { g, c };
}
const S = (MV) => MV.sys.studio;
const year = (MV, g) => { g.p.age++; g.queue = []; MV.sys.company.yearly(g); };

test('los tamaños de juego tienen costo, años y ventas base', () => {
  const MV = load();
  assert.deepEqual(MV.STUDIO_SIZES.chico, Object.assign({}, MV.STUDIO_SIZES.chico, { cost: 50000, years: 1, base: 150000 }));
  assert.deepEqual([MV.STUDIO_SIZES.mediano.cost, MV.STUDIO_SIZES.mediano.years, MV.STUDIO_SIZES.mediano.base], [300000, 1, 900000]);
  assert.deepEqual([MV.STUDIO_SIZES.aaa.cost, MV.STUDIO_SIZES.aaa.years, MV.STUDIO_SIZES.aaa.base], [3000000, 2, 12000000]);
});

test('un juego tarda lo que dice su tamaño y después vende pico y cola', () => {
  const MV = load({ seed: 1 });
  const { g, c } = firm(MV, 1, 'estudio', 1e7);
  const cash0 = c.cash;
  const msg = S(MV).startGame(g, c.id, 'Pixel Pantano', 'terror', 'aaa');
  assert.ok(!BAD_TEXT.test(msg), msg);
  assert.equal(c.cash, cash0 - 3000000);
  year(MV, g);
  assert.ok(c.project, 'un AAA tarda dos años');
  assert.equal((c.games || []).length, 0);
  c.project.adj = 0;
  year(MV, g);
  assert.equal(c.project, null);
  assert.equal(c.games.length, 1);
  const G = c.games[0];
  assert.equal(G.name, 'Pixel Pantano'); assert.ok(G.stars >= 1 && G.stars <= 5);
  assert.equal(c.last.revenue, G.launch);
  year(MV, g); assert.equal(c.last.revenue, Math.round(G.launch * 0.5));
  year(MV, g); assert.equal(c.last.revenue, Math.round(G.launch * 0.25));
  year(MV, g); assert.equal(c.last.revenue, Math.round(G.launch * 0.1));
  year(MV, g); assert.equal(c.last.revenue, 0);
});

test('mejor equipo y más marketing venden más en promedio', () => {
  const MV = load({ seed: 2 });
  const avg = (team, mkt) => {
    let s = 0;
    for (let i = 0; i < 40; i++) {
      const { g, c } = firm(MV, 100 + i, 'estudio', 1e6);
      g.p.skills.programacion = 30; g.p.skills.arte = 30;
      for (let k = 0; k < team; k++) { c.staff.push({ id: 'e' + k, role: ['programador', 'artista', 'disenador'][k % 3], level: 5, salary: 1, first: 'A', last: 'B', gender: 'm', morale: 70 }); }
      MV.sys.company.setMarketing(g, c.id, mkt);
      S(MV).startGame(g, c.id, '', 'plataformas', 'chico');
      year(MV, g);
      s += c.games[0].launch;
    }
    return s / 40;
  };
  const best = avg(6, 'alto'), worst = avg(0, 'ninguno');
  assert.ok(best > worst * 2, `con equipo ${best} vs solo ${worst}`);
});

test('no se puede empezar un juego sin caja ni dos a la vez', () => {
  const MV = load({ seed: 3 });
  const { g, c } = firm(MV, 3, 'estudio');
  assert.match(S(MV).startGame(g, c.id, 'X', 'terror', 'mediano'), /caja/i);
  assert.equal(c.project || null, null);
  S(MV).startGame(g, c.id, 'X', 'terror', 'chico');
  assert.match(S(MV).startGame(g, c.id, 'Y', 'terror', 'chico'), /ya/i);
  assert.match(S(MV).startGame(g, c.id, 'Z', 'terror', 'gigante'), /no existe/i);
  const other = firm(MV, 4, 'apps', 1e6);
  assert.match(S(MV).startGame(other.g, other.c.id, 'X', 'terror', 'chico'), /estudio/i);
});

test('el crunch cambia calidad o plazo según la decisión', () => {
  const MV = load({ seed: 5 });
  const run = (i) => {
    const { g, c } = firm(MV, 5, 'estudio', 1e7);
    MV.sys.company.hire(g, c.id, 'programador', 0);
    S(MV).startGame(g, c.id, 'X', 'estrategia', 'aaa');
    const p0 = Object.assign({}, c.project), cash = c.cash, morale = c.staff[0].morale;
    MV.EV.push(g, 'crunch', { company: c.id }, true);
    const v = MV.EV.view(g);
    assert.equal(v.choices.length, 3); assert.ok(!BAD_TEXT.test(v.text));
    const res = MV.EV.choose(g, i);
    assert.ok(!BAD_TEXT.test(res.msg), res.msg);
    return { c, p0, cash, morale };
  };
  const a = run(0); assert.equal(a.c.project.adj, a.p0.adj + 10); assert.ok(a.c.staff[0].morale < a.morale);
  const b = run(1); assert.equal(b.c.project.left, b.p0.left + 1); assert.equal(b.c.cash, b.cash - 600000);
  const d = run(2); assert.equal(d.c.project.adj, d.p0.adj - 10);
});

test('las apps ganan y pierden suscriptores y pagan $30 cada uno', () => {
  const MV = load({ seed: 6 });
  const { g, c } = firm(MV, 6, 'apps', 1e6);
  const cash0 = c.cash;
  assert.ok(!BAD_TEXT.test(S(MV).newApp(g, c.id, 'Contador de Siestas', 'inutil')));
  assert.equal(c.cash, cash0 - 30000);
  assert.match(S(MV).newApp(g, c.id, 'Otra', 'citas'), /ya/i, 'una app en desarrollo por vez');
  year(MV, g);
  const app = c.apps[0];
  assert.ok(app.stars >= 1 && app.stars <= 5);
  assert.equal(app.subsAtLaunch, 1000 * app.stars * app.stars);
  assert.equal(c.last.revenue, app.subsAtLaunch * 30);
  const before = app.subs;
  year(MV, g);
  assert.equal(c.last.revenue, before * 30);
  app.age = 12; app.stars = 1; c.marketing = 'ninguno';
  const s = app.subs; year(MV, g);
  assert.ok(app.subs < s, 'una app vieja y mala pierde suscriptores');
  app.age = 0; app.stars = 5; c.marketing = 'alto';
  const s2 = app.subs; year(MV, g);
  assert.ok(app.subs > s2, 'una app nueva y buena con marketing crece');
});

test('la red social crece con el equipo y cobra $2 por usuario', () => {
  const MV = load({ seed: 7 });
  const { g, c } = firm(MV, 7, 'social', 1e7);
  year(MV, g);
  assert.equal(c.last.revenue, 2000, 'empieza con 1.000 usuarios');
  const grow = (team) => {
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const x = firm(MV, 200 + i, 'social', 1e7);
      for (let k = 0; k < team; k++) x.c.staff.push({ id: 'e' + k, role: k % 2 ? 'marketing' : 'programador', level: 5, salary: 1, first: 'A', last: 'B', gender: 'f', morale: 70 });
      year(MV, x.g); year(MV, x.g);
      s += x.c.users;
    }
    return s / 30;
  };
  assert.ok(grow(4) > grow(0) * 2);
  c.users = 2e9; year(MV, g);
  assert.ok(c.users <= 2e9);
  c.users = 1.5e8; year(MV, g);
  assert.ok(MV.global().ach.red_social, 'logro a los 100 millones');
  assert.ok(MV.ACHIEVEMENTS.find((a) => a.id === 'red_social'));
});

test('un escándalo con la empresa cerrada no rompe la cola', () => {
  const MV = load({ seed: 8 });
  const { g, c } = firm(MV, 8, 'social', 1e6);
  MV.EV.push(g, 'social_escandalo', { company: c.id, kind: 'filtracion' }, true);
  const v = MV.EV.view(g);
  assert.equal(v.choices.length, 3); assert.ok(!BAD_TEXT.test(v.text), v.text);
  MV.sys.company.close(g, c.id);
  assert.ok(!g.queue.some((q) => q.ctx && q.ctx.company === c.id));
  const x = firm(MV, 9, 'social', 1e6);
  MV.EV.push(x.g, 'social_escandalo', { company: x.c.id, kind: 'politico' }, true);
  x.g.p.companies = [];
  const res = MV.EV.choose(x.g, 1);
  assert.ok(res && !BAD_TEXT.test(res.msg || ''), res && res.msg);
});
