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
