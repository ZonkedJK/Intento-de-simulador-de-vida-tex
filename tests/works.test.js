/* Obras con nombre: libros, canciones y cuadros con críticas, éxitos y regalías. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD = /undefined|NaN|\[object|null\b|\$\{/;
function artist(MV, seed, skill) {
  const g = MV.newGame({ seed }); g.p.age = 30; g.p.money = 1000;
  g.p.skills.arte = skill; g.p.skills.musica = skill; g.p.stats.smarts = skill;
  return g;
}

test('cada tipo de obra tiene géneros, títulos al azar y textos', () => {
  const MV = load();
  ['libro', 'cancion', 'cuadro'].forEach((k) => {
    const K = MV.WORK_KINDS[k];
    assert.ok(K && K.name && K.icon && K.skill in MV.SKILLS, k);
    assert.ok(K.genres.length >= 4, k);
    for (let i = 0; i < 20; i++) { const t = MV.sys.works.randomTitle(k); assert.ok(t.length >= 4 && !BAD.test(t), t); }
  });
  [1, 2, 3, 4, 5].forEach((s) => assert.ok(MV.WORK_REVIEWS[s].length >= 3));
});

test('el título se limpia y se recorta a 40 letras', () => {
  const MV = load();
  const t = MV.sys.works.clean('   <script>{alert}</script>   Una   novela ${x} larguísima que no termina nunca jamás   ');
  assert.ok(t.length <= 40, t);
  assert.ok(!/[<>{}$]/.test(t), t);
  assert.ok(!/^\s|\s$|\s\s/.test(t), t);
});

test('sin título se usa uno al azar y el género inválido usa el primero', () => {
  const MV = load({ seed: 1 });
  const g = artist(MV, 1, 40);
  const msg = MV.sys.works.create(g, 'libro', '   ', 'inventado');
  const w = g.p.works[0];
  assert.ok(w.title.length >= 4);
  assert.equal(w.genre, MV.WORK_KINDS.libro.genres[0].id);
  assert.ok(msg.includes(w.title) && !BAD.test(msg), msg);
});

test('más habilidad da mejores estrellas en promedio', () => {
  const MV = load({ seed: 2 });
  const avg = (skill) => { let s = 0; for (let i = 0; i < 200; i++) { const g = artist(MV, 100 + i, skill); MV.sys.works.create(g, 'cancion', 'Prueba', null); s += g.p.works[0].stars; } return s / 200; };
  const lo = avg(5), hi = avg(90);
  assert.ok(hi > lo + 1.2, `${lo} vs ${hi}`);
  assert.ok(lo >= 1 && hi <= 5);
});

test('un éxito paga, da el logro y deja regalías que bajan cada año', () => {
  const MV = load({ seed: 3 });
  let g = null;
  for (let i = 0; i < 200 && !g; i++) {
    const t = artist(MV, 400 + i, 100); t.p.fame = 100;
    MV.sys.works.create(t, 'libro', 'Éxito', null);
    if (t.p.works[0].hit) g = t;
  }
  assert.ok(g, 'nunca hubo un éxito');
  assert.ok(g.p.money > 1000 + 50000);
  assert.ok(g.achLife.includes('escritor'));
  const w = g.p.works[0];
  const m0 = g.p.money; g.log.push({ age: 31, year: g.year, items: [] });
  MV.sys.works.yearly(g); const r1 = g.p.money - m0;
  MV.sys.works.yearly(g); const r2 = g.p.money - m0 - r1;
  assert.ok(r1 > 0 && r2 > 0 && r2 < r1, `${r1} ${r2}`);
  for (let y = 0; y < 30; y++) MV.sys.works.yearly(g);
  assert.equal(w.royalty, 0);
});

test('las tres actividades guardan la obra con su título', () => {
  const MV = load({ seed: 4 });
  const g = artist(MV, 4, 50);
  ['libro', 'cancion', 'cuadro'].forEach((id) => {
    const a = MV.ACTS.find((x) => x.id === id);
    assert.equal(a.ui, 'work', id);
    MV.doAction(g, a, { title: 'Obra ' + id, genre: MV.WORK_KINDS[id].genres[1].id });
  });
  assert.deepEqual(g.p.works.map((w) => w.kind), ['libro', 'cancion', 'cuadro']);
  assert.deepEqual(g.p.works.map((w) => w.title), ['Obra libro', 'Obra cancion', 'Obra cuadro']);
  // El jugador automático no pasa opciones: título y género al azar
  const h = artist(MV, 5, 50);
  MV.doAction(h, MV.ACTS.find((x) => x.id === 'cuadro'));
  assert.equal(h.p.works.length, 1);
});

// ——— Parte B: juegos y apps ———
function coder(MV, seed, prog, arte) {
  const g = MV.newGame({ seed }); g.p.age = 30; g.p.money = 1000; g.queue = [];
  g.p.skills.programacion = prog; g.p.skills.arte = arte == null ? prog : arte; g.p.stats.smarts = 50; g.p.fame = 0;
  return g;
}

test('juegos y apps aparecen como obras con 6 géneros cada una', () => {
  const MV = load();
  assert.deepEqual(MV.WORK_KINDS.juego.genres.map((x) => x.id), ['plataformas', 'terror', 'estrategia', 'mundo_abierto', 'simulador_vida', 'battle_royale']);
  assert.deepEqual(MV.WORK_KINDS.app.genres.map((x) => x.id), ['productividad', 'citas', 'fitness', 'finanzas', 'red_nicho', 'inutil']);
  assert.equal(MV.WORK_KINDS.juego.skill, 'programacion'); assert.equal(MV.WORK_KINDS.juego.minAge, 12);
  assert.deepEqual(MV.WORK_KINDS.juego.hit, [60000, 1200000]); assert.deepEqual(MV.WORK_KINDS.juego.fame, [8, 18]);
  assert.equal(MV.WORK_KINDS.app.minAge, 14); assert.deepEqual(MV.WORK_KINDS.app.hit, [40000, 800000]); assert.deepEqual(MV.WORK_KINDS.app.fame, [4, 10]);
  ['gamedev', 'appdev'].forEach((id) => assert.ok(MV.ACHIEVEMENTS.find((a) => a.id === id), id));
  ['programar_juego', 'programar_app'].forEach((id) => { const a = MV.ACTS.find((x) => x.id === id); assert.ok(a && a.ui === 'work', id); });
  for (let i = 0; i < 20; i++) ['juego', 'app'].forEach((k) => { const t = MV.sys.works.randomTitle(k); assert.ok(t.length >= 4 && !BAD.test(t), t); });
});

test('crear un juego usa Programación y da textos sin errores', () => {
  const MV = load({ seed: 40 });
  for (let i = 0; i < 30; i++) {
    const g = coder(MV, 400 + i, 40);
    const before = g.p.skills.programacion;
    const msg = MV.sys.works.create(g, i % 2 ? 'juego' : 'app', i % 3 ? '' : 'Mi <b>juego</b>', MV.WORK_KINDS[i % 2 ? 'juego' : 'app'].genres[i % 6].id);
    assert.ok(!BAD.test(msg), msg);
    assert.ok(g.p.skills.programacion > before, 'sube Programación');
    assert.equal(g.p.works[g.p.works.length - 1].kind, i % 2 ? 'juego' : 'app');
  }
});

test('un juego con mucha Programación y Arte saca más estrellas en promedio que uno sin habilidad', () => {
  const MV = load({ seed: 41 });
  const avg = (prog, arte) => { let s = 0; for (let i = 0; i < 80; i++) { const g = coder(MV, 500 + i, prog, arte); MV.sys.works.create(g, 'juego', '', 'plataformas'); const w = g.p.works[g.p.works.length - 1]; assert.equal(w.kind, 'juego'); s += w.stars; } return s / 80; };
  const pro = avg(95, 95), noob = avg(0, 0), noArt = avg(95, 0);
  assert.ok(pro > noob + 1, `pro ${pro} vs novato ${noob}`);
  assert.ok(noArt > noob + 0.8, `la Programación es la habilidad principal: ${noArt} vs ${noob}`);
  assert.ok(pro > noArt, `con Arte ${pro} vs sin Arte ${noArt}`);
});

test('un éxito de un juego da fama y regalías los años siguientes', () => {
  const MV = load({ seed: 42 });
  let found = null;
  for (let i = 0; i < 200 && !found; i++) {
    const g = coder(MV, 600 + i, 100);
    g.p.fame = 60;
    MV.sys.works.create(g, 'juego', 'Pixel Pantano', 'mundo_abierto');
    const w = g.p.works[g.p.works.length - 1];
    assert.equal(w.kind, 'juego');
    if (w.hit) found = { g, w };
  }
  assert.ok(found, 'algún juego es un éxito');
  assert.ok(found.w.earned >= 60000 && found.w.earned <= 1200000);
  assert.ok(found.w.royalty > 0);
  const m0 = found.g.p.money;
  MV.sys.works.yearly(found.g);
  assert.ok(found.g.p.money > m0, 'cobra regalías');
});
