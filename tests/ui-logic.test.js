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

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
const OUTFITS = ['medico', 'policia', 'chef', 'deporte', 'presidente', 'preso', 'piloto', 'estudiante', 'traje'];

test('el avatar se dibuja con 9 peinados, 4 barbas, 5 ánimos y 9 ropas', () => {
  const MV = load();
  let n = 0;
  for (let style = 0; style < 9; style++) for (let beard = 0; beard < 4; beard++) for (const mood of [5, 25, 50, 75, 95]) for (const outfit of OUTFITS) {
    const look = { v: 2, skin: '#c48b62', hair: '#3a2618', eyes: '#24507a', style, beardStyle: beard, piercing: true, glasses: n % 2 === 0, freckles: true };
    const svg = MV.UI.avatarSVG({ age: 30, gender: n % 2 ? 'f' : 'm', look, id: 'x' + n, mood, outfit, acc: ['auriculares', 'lentes_sol'] });
    assert.match(svg, /^<svg/);
    assert.ok(!BAD_TEXT.test(svg), `estilo ${style} barba ${beard} ánimo ${mood} ropa ${outfit}`);
    n++;
  }
  assert.equal(n, 9 * 4 * 5 * 9);
});

test('las expresiones cambian con el ánimo (lágrimas y sonrisa con dientes)', () => {
  const MV = load();
  const look = { v: 2, skin: '#efc6a4', hair: '#17130f', eyes: '#3a2618', style: 0 };
  assert.match(MV.UI.avatarSVG({ age: 30, gender: 'm', look, id: 'a', mood: 5 }), /data-tears/);
  assert.match(MV.UI.avatarSVG({ age: 30, gender: 'm', look, id: 'a', mood: 95 }), /data-teeth/);
});

test('los aspectos viejos siguen funcionando y el tatuaje del cuello se ve', () => {
  const MV = load();
  const old = { skin: '#dfab84', hair: '#5e3d22', eyes: '#3c7a4a', style: 4, beard: true, glasses: false };
  const svg = MV.UI.avatarSVG({ age: 50, gender: 'm', look: old, id: 'viejo', mood: 60 });
  assert.match(svg, /^<svg/);
  assert.ok(!BAD_TEXT.test(svg));
  assert.match(MV.UI.avatarSVG({ age: 30, gender: 'f', look: old, id: 't', mood: 60, neckTattoo: true }), /data-neck-tattoo/);
});

test('outfitFor elige la ropa según la ocupación', () => {
  const MV = load();
  const g = MV.newGame({ seed: 3 });
  const p = g.p;
  p.age = 30; p.edu.done = ['primaria', 'secundaria', 'universidad']; p.edu.degrees = [{ kind: 'universidad', major: 'medicina' }];
  MV.sys.career.hire(g, MV.jobById('medico'));
  assert.equal(MV.UI.outfitFor(p), 'medico');
  p.prison = { left: 2, total: 3, crime: 'Robo', behavior: 50 };
  assert.equal(MV.UI.outfitFor(p), 'preso');
  p.prison = null;
  MV.sys.sports.sign(g, MV.sys.sports.makeOffer(g, 'automovilismo', 1));
  assert.equal(MV.UI.outfitFor(p), 'piloto');
  const k = MV.newGame({ seed: 4 }).p; k.age = 10; k.edu.stage = 'primaria';
  assert.equal(MV.UI.outfitFor(k), 'estudiante');
});

test('makeLook crea aspectos nuevos con peinado 0-8 y barba 0-3', () => {
  const MV = load({ seed: 5 });
  for (let i = 0; i < 100; i++) {
    const l = MV.makeLook(i % 2 ? 'm' : 'f');
    assert.equal(l.v, 2);
    assert.ok(l.style >= 0 && l.style <= 8);
    assert.ok(l.beardStyle >= 0 && l.beardStyle <= 3);
    if (i % 2 === 0) assert.equal(l.beardStyle, 0);
  }
});
