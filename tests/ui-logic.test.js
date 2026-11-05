/* Lógica pura de la interfaz: niveles de barra y avatares. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

test('barLevel usa los umbrales 40/70', () => {
  const MV = load();
  assert.equal(MV.barLevel(0), 'lo');
  assert.equal(MV.barLevel(39), 'lo');
  assert.equal(MV.barLevel(40), 'mid');
  assert.equal(MV.barLevel(70), 'mid');
  assert.equal(MV.barLevel(71), 'hi');
  assert.equal(MV.barLevel(100), 'hi');
});
