/* Interfaz A ("el cuaderno, mejorado"): subtítulos de opción y variables de estilo. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;

test('auditoría: subtítulos con concordancia y resultado tranquilo/tranquila', () => {
  const MV = load({ seed: 1 });
  for (const [gender, word] of [['m', 'tranquilo'], ['f', 'tranquila']]) {
    const g = MV.newGame({ seed: 1 }); g.p.age = 40; g.p.gender = gender; g.p.money = 100000; g.queue = [];
    g.p.job = { id: 'actor', level: 1, salary: 100000, perf: 60, years: 1, lvlYears: 1, type: 'fame', start: 39 };
    MV.EV.push(g, 'auditoria', {}, true);
    const v = MV.EV.view(g);
    assert.deepEqual(v.choices.map((c) => c.sub), [`Pagas las diferencias y dormirás ${word}`, 'Puede salir muy bien… o muy mal', 'Una moneda al aire con tu plata', 'En cómodas cuotas']);
    v.choices.forEach((c) => assert.ok(!BAD_TEXT.test(c.label + c.sub), c.label));
    assert.match(MV.EV.choose(g, 0).msg, new RegExp(`Dormirás ${word}\\.`));
  }
});

test('las opciones sin sub no lo traen; sub acepta función y plantillas', () => {
  const MV = load({ seed: 2 });
  MV.ev({ id: 'prueba_sub', manual: true, icon: '🧪', title: 'Prueba', text: 'x', choices: [{ t: 'A', eff: {} }, { t: 'B', sub: () => 'List{o}', eff: {} }] });
  const g = MV.newGame({ seed: 2 }); g.p.gender = 'f'; g.queue = [];
  MV.EV.push(g, 'prueba_sub', {}, true);
  const [a, b] = MV.EV.view(g).choices;
  assert.ok(!('sub' in a));
  assert.equal(b.sub, 'Lista');
});

const fs = require('fs');
const path = require('path');
const CSS = () => fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');
/** Variables declaradas en el primer bloque que empieza con `start` (hasta su primera llave de cierre). */
function vars(css, start) {
  const i = css.indexOf(start);
  assert.ok(i >= 0, 'falta el bloque ' + start);
  const body = css.slice(i + start.length, css.indexOf('}', i));
  const out = {};
  for (const m of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

test('las variables del cuaderno y del pizarrón tienen los valores de Figma', () => {
  const css = CSS();
  const light = vars(css, ':root {');
  const dark = vars(css, ':root[data-theme="dark"] {');
  const media = vars(css, ':root:not([data-theme="light"]) {');
  const L = { paper: '#fffdf7', grid: '#dbe6f6', margin: '#f2a0a6', card: '#ffffff', ink: '#1f3a93', copy: '#26345f', pencil: '#5b6270',
    'hl-yellow': '#ffe066', 'hl-green': '#b8f2a0', 'hl-pink': '#ffb3c7', 'hl-blue': '#a8d8ff', 'on-hl': '#1b2a5e',
    'lvl-lo': '#e25c5c', 'lvl-mid': '#f0b429', 'lvl-hi': '#3fae5a', stone: '#eef0f4', hard: '#1f3a93', clip: '#8a94a6', 'hl-stop': '55%', 'nav-h': '92px' };
  const D = { paper: '#1e2a26', grid: '#283832', margin: 'rgba(255, 128, 128, 0.6)', card: '#25332e', ink: '#eef1e8', copy: '#dfe5dc', pencil: '#a3afa6',
    'hl-yellow': '#f2dc68', 'hl-green': '#98e0a3', 'hl-pink': '#f09ac6', 'hl-blue': '#96cdee', 'on-hl': '#1b211e',
    'lvl-lo': '#ff8a80', 'lvl-mid': '#f2c14e', 'lvl-hi': '#6fd08a', stone: '#34433d', hard: '#0f1714', clip: '#9aa6b8', 'hl-stop': '0%' };
  for (const [k, v] of Object.entries(L)) assert.equal(light[k], v, 'claro --' + k);
  for (const [k, v] of Object.entries(D)) assert.equal(dark[k], v, 'oscuro --' + k);
  assert.deepEqual(media, dark, 'los dos bloques oscuros declaran lo mismo');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /<meta name="theme-color" content="#fffdf7">/);
});
