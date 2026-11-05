/* Validación de los datos del juego: referencias, rangos e identificadores. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { load, scriptList, ROOT } = require('./load');

const MV = load({ seed: 11 });
const source = scriptList().map((s) => fs.readFileSync(path.join(ROOT, s), 'utf8')).join('\n');

test('hay mucho contenido', () => {
  assert.ok(MV.EV.list.filter((e) => !e.manual).length >= 150, 'se esperaban 150+ eventos aleatorios');
  assert.ok(MV.ACTS.length >= 50, 'se esperaban 50+ actividades');
  assert.ok(MV.JOBS.length >= 40, 'se esperaban 40+ empleos');
});

test('los eventos están bien formados', () => {
  for (const d of MV.EV.list) {
    assert.ok(d.age[0] <= d.age[1], 'rango de edad inválido en ' + d.id);
    assert.ok(d.text, 'evento sin texto: ' + d.id);
    if (d.choices) {
      assert.ok(d.choices.length >= 1, 'evento sin opciones: ' + d.id);
      d.choices.forEach((c) => assert.ok(c.t && c.eff, 'opción incompleta en ' + d.id));
    } else assert.ok('auto' in d, 'evento sin efecto: ' + d.id);
    if (typeof d.scene === 'string') assert.ok(MV.UI.SCENE_NAMES.includes(d.scene), `escena desconocida "${d.scene}" en ${d.id}`);
  }
});

test('los eventos referenciados existen', () => {
  const refs = [...source.matchAll(/EV\.(?:push|later)\(\w+, '([a-z0-9_]+)'/g)].map((m) => m[1]);
  assert.ok(refs.length > 10);
  refs.forEach((id) => assert.ok(MV.EV.byId[id], 'evento referenciado inexistente: ' + id));
});

test('los logros referenciados existen y no se repiten', () => {
  const ids = MV.ACHIEVEMENTS.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length, 'logros duplicados');
  const refs = [...source.matchAll(/(?:ach\.unlock\(\w+, |ach: )'([a-z_]+)'/g)].map((m) => m[1]);
  refs.forEach((id) => assert.ok(ids.includes(id), 'logro inexistente: ' + id));
});

test('las enfermedades referenciadas existen', () => {
  MV.RANDOM_CONDS.forEach(([id]) => assert.ok(MV.CONDITIONS[id], 'condición inexistente: ' + id));
  const refs = [...source.matchAll(/(?:health\.add\(\w+, |cond: )'([a-z_]+)'/g)].map((m) => m[1]);
  refs.forEach((id) => assert.ok(MV.CONDITIONS[id], 'condición inexistente: ' + id));
});

test('los empleos referencian carreras y técnicas válidas', () => {
  const all = MV.JOBS.concat(MV.PARTTIME).concat(Object.values(MV.FAME));
  const ids = all.map((j) => j.id);
  assert.equal(new Set(ids).size, ids.length, 'empleos duplicados');
  all.forEach((J) => {
    assert.equal(J.titles.length, J.pay.length, 'títulos y sueldos no coinciden en ' + J.id);
    (J.req.major || []).forEach((m) => assert.ok(MV.EDU.majors[m], 'carrera inexistente ' + m + ' en ' + J.id));
    (J.req.tech || []).forEach((t) => assert.ok(MV.EDU.tech[t], 'técnica inexistente ' + t + ' en ' + J.id));
    if (J.req.postType) assert.ok(MV.EDU.post[J.req.postType]);
    if (J.req.edu) assert.ok(MV.EDU.order.includes(J.req.edu));
  });
});

test('las actividades tienen ids únicos y categorías válidas', () => {
  const ids = MV.ACTS.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length, 'actividades duplicadas');
  const cats = MV.ACT_CATS.map((c) => c.id);
  MV.ACTS.forEach((a) => {
    assert.ok(cats.includes(a.cat), 'categoría inválida en ' + a.id);
    assert.equal(typeof a.run, 'function');
  });
});

test('los nombres de cada país están completos', () => {
  Object.entries(MV.COUNTRIES).forEach(([k, C]) => {
    assert.ok(C.names.m.length >= 8 && C.names.f.length >= 8 && C.last.length >= 10, 'faltan nombres en ' + k);
    assert.ok(C.cities.length >= 3, 'faltan ciudades en ' + k);
  });
});
