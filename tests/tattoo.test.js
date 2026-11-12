/* Motor del tatuaje: normalización, calificación, efectos, álbum y láser. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;

/** Diseño "rico": 8 trazos en 3 colores que cubren ~1/4 del lienzo. */
function richDesign() {
  const strokes = [];
  for (let i = 0; i < 8; i++) {
    const pts = [];
    for (let x = 10; x <= 60; x += 2) pts.push(x, 20 + i * 6 + (x % 4));
    strokes.push({ c: i % 3, w: 2, pts });
  }
  return { strokes, texts: [] };
}
function adult(MV, seed) {
  const g = MV.newGame({ seed: seed || 1 });
  g.p.age = 25; g.p.money = 100000;
  return g;
}

test('un diseño vacío tiene nota 0 y el tatuador no cobra', () => {
  const MV = load({ seed: 1 });
  const g = adult(MV);
  assert.equal(MV.sys.tattoo.score({ strokes: [], texts: [] }, 'estudio', 0).score, 0);
  const msg = MV.sys.tattoo.apply(g, { strokes: [{ c: 0, w: 1, pts: [50, 50] }], texts: [] }, 'estudio', 'brazo');
  assert.equal(g.p.money, 100000, 'no debería cobrar');
  assert.equal(g.p.tattoos.length, 0);
  assert.ok(typeof msg === 'string' && msg.length && !BAD_TEXT.test(msg));
});

test('un diseño rico en un estudio saca 55 o más', () => {
  const MV = load({ seed: 2 });
  const r = MV.sys.tattoo.score(richDesign(), 'estudio', 0);
  assert.ok(r.coverage >= 0.2, 'cobertura ' + r.coverage);
  assert.equal(r.colors, 3);
  assert.ok(r.score >= 55, 'nota ' + r.score);
});

test('el tatuador importa: garaje < estudio < famoso', () => {
  const MV = load({ seed: 3 });
  const avg = (artist) => { let s = 0; for (let i = 0; i < 50; i++) s += MV.sys.tattoo.score(richDesign(), artist, 20).score; return s / 50; };
  const a = avg('garaje'), b = avg('estudio'), c = avg('famoso');
  assert.ok(a < b && b < c, `${a} < ${b} < ${c}`);
});

test('normalize deja puntos enteros 0-100 y como máximo 900', () => {
  const MV = load();
  const pts = [];
  for (let i = 0; i < 3000; i++) pts.push(i % 130 - 15 + 0.37, (i * 7) % 120 - 10);
  const d = MV.sys.tattoo.normalize({ strokes: [{ c: 9, w: 7, pts }], texts: [{ t: '<b>Mamá con un texto larguísimo</b>', x: 150, y: -3, c: 1 }] });
  const all = d.strokes.flatMap((s) => s.pts);
  assert.ok(all.length / 2 <= 900, 'puntos ' + all.length / 2);
  assert.ok(all.every((v) => Number.isInteger(v) && v >= 0 && v <= 100));
  assert.ok(d.strokes[0].c >= 0 && d.strokes[0].c < MV.TATTOO_INKS.length && d.strokes[0].w >= 1 && d.strokes[0].w <= 3);
  assert.ok(d.texts[0].t.length <= 16 && !/[<>]/.test(d.texts[0].t));
  assert.ok(JSON.stringify(d).length < 12000, 'el diseño ocupa demasiado');
});

test('apply cobra, guarda en el álbum y cambia apariencia y felicidad', () => {
  const MV = load({ seed: 4 });
  const g = adult(MV);
  const before = Object.assign({}, g.p.stats);
  const msg = MV.sys.tattoo.apply(g, richDesign(), 'estudio', 'espalda');
  assert.equal(g.p.money, 100000 - MV.TATTOO_ARTISTS.estudio.cost);
  assert.equal(g.p.tattoos.length, 1);
  const t = g.p.tattoos[0];
  assert.equal(t.place, 'espalda');
  assert.ok(t.score > 0 && t.design.strokes.length === 8);
  assert.ok(g.p.stats.looks !== before.looks || g.p.stats.happy !== before.happy);
  assert.ok(!BAD_TEXT.test(msg));
});

test('el álbum no supera 12 tatuajes', () => {
  const MV = load({ seed: 5 });
  const g = adult(MV);
  for (let i = 0; i < 15; i++) MV.sys.tattoo.apply(g, richDesign(), 'estudio', 'brazo');
  assert.equal(g.p.tattoos.length, 12);
});

test('un tatuaje en la cara marca la bandera y el nombre de la pareja se recuerda', () => {
  const MV = load({ seed: 6 });
  const g = adult(MV);
  const pt = MV.sys.rels.candidate(g); MV.addRel(g, pt, 'pareja', 70);
  const d = richDesign(); d.texts.push({ t: pt.first, x: 40, y: 80, c: 1 });
  MV.sys.tattoo.apply(g, d, 'estudio', 'cara');
  assert.ok(g.p.flags.tatuajeCara);
  assert.equal(g.p.tattoos[0].partnerName, pt.first);
});

test('el láser quita el tatuaje y cobra $1.500', () => {
  const MV = load({ seed: 7 });
  const g = adult(MV);
  MV.sys.tattoo.apply(g, richDesign(), 'estudio', 'brazo');
  const money = g.p.money, id = g.p.tattoos[0].id;
  const msg = MV.sys.tattoo.laser(g, id);
  assert.equal(g.p.tattoos.length, 0);
  assert.equal(g.p.money, money - 1500);
  assert.ok(!BAD_TEXT.test(msg));
});

test('render produce un SVG sin textos rotos', () => {
  const MV = load({ seed: 8 });
  const d = richDesign(); d.texts.push({ t: 'Mamá', x: 50, y: 85, c: 1 });
  const svg = MV.sys.tattoo.render(d, { wobble: 4, seed: 99 });
  assert.match(svg, /^<svg/);
  assert.ok(!BAD_TEXT.test(svg));
  assert.match(svg, /Mamá/);
});

test('el texto usa el artículo correcto para cada lugar', () => {
  const MV = load({ seed: 9 });
  const g = adult(MV);
  const msg = MV.sys.tattoo.apply(g, richDesign(), 'estudio', 'cara');
  assert.match(msg, /en la cara/);
});

test('un tatuaje en la cara baja la chance de quedar en una entrevista', () => {
  const MV = load({ seed: 10 });
  const rate = (face) => {
    let hired = 0;
    for (let i = 0; i < 600; i++) {
      const g = adult(MV, 3000 + i);
      g.p.edu.done = ['primaria', 'secundaria'];
      if (face) g.p.flags.tatuajeCara = true;
      MV.EV.push(g, 'entrevista', { job: 'cajero', q: 0, order: [1, 0, 2] }, true);
      MV.EV.choose(g, 0);
      if (g.p.job || g.queue.some((q) => q.id === 'oferta_trabajo')) hired++; // aprobar trae una oferta (Parte C1)
    }
    return hired / 600;
  };
  const a = rate(false), b = rate(true);
  assert.ok(a - b > 0.03, `sin tatuaje ${a}, con tatuaje ${b}`);
});

test('la acción de tatuaje abre el minijuego en la interfaz y acepta un diseño', () => {
  const MV = load({ seed: 11 });
  const g = adult(MV);
  const a = MV.ACTS.find((x) => x.id === 'tatuaje');
  assert.equal(a.ui, 'tattoo');
  MV.doAction(g, a, { design: richDesign(), artist: 'famoso', place: 'pierna' });
  assert.equal(g.p.tattoos.length, 1);
  assert.equal(g.p.tattoos[0].artist, 'famoso');
  // sin diseño (jugador automático): usa una plantilla al azar
  const g2 = adult(MV, 2);
  MV.doAction(g2, a);
  assert.equal(g2.p.tattoos.length, 1);
});

test('el nombre de una ex tatuado dispara un evento para taparlo o borrarlo', () => {
  const MV = load({ seed: 12 });
  const g = adult(MV);
  const pt = MV.sys.rels.candidate(g); MV.addRel(g, pt, 'pareja', 70);
  const d = richDesign(); d.texts.push({ t: pt.first, x: 40, y: 80, c: 1 });
  MV.sys.tattoo.apply(g, d, 'estudio', 'brazo');
  const ev = MV.EV.byId.tatuaje_ex;
  assert.ok(ev, 'falta el evento tatuaje_ex');
  assert.equal(MV.EV.eligible(g, ev), null, 'no debe aparecer mientras siguen juntos');
  MV.sys.rels.breakUp(g, pt);
  assert.ok(MV.EV.eligible(g, ev), 'debe aparecer después de terminar');
  // tapar marca el tatuaje para cubrirlo en el estudio
  MV.EV.fire(g, ev, MV.EV.eligible(g, ev));
  const v = MV.EV.view(g);
  const cover = v.choices.find((c) => /Tapar/.test(c.label));
  MV.EV.choose(g, cover.i);
  assert.equal(g.p.flags.taparTatuaje, g.p.tattoos[0].id);
  // láser lo borra
  const g2 = adult(MV, 5);
  const pt2 = MV.sys.rels.candidate(g2); MV.addRel(g2, pt2, 'pareja', 70);
  const d2 = richDesign(); d2.texts.push({ t: pt2.first, x: 40, y: 80, c: 1 });
  MV.sys.tattoo.apply(g2, d2, 'estudio', 'brazo');
  MV.sys.rels.breakUp(g2, pt2);
  MV.EV.fire(g2, ev, MV.EV.eligible(g2, ev));
  const v2 = MV.EV.view(g2);
  MV.EV.choose(g2, v2.choices.find((c) => /láser/i.test(c.label)).i);
  assert.equal(g2.p.tattoos.length, 0);
});
