'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');
const MV = load({ seed: 1 });

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
/** Partida con el jugador a esa edad, sin cola ni relaciones. */
function game(MV, seed, age) {
  const g = MV.newGame({ seed }); g.p.age = age == null ? 30 : age; g.queue = []; g.p.rels = [];
  return g;
}
/** Persona con esos rasgos y ese tipo de relación. */
function person(MV, g, type, traits, extra) {
  const n = MV.newNPC(g, Object.assign({ age: 30, traits: traits || [] }, extra || {}));
  return { n, r: MV.addRel(g, n, type || 'amigo', 50) };
}

test('los rasgos concuerdan con el género', () => {
  const g = game(MV, 1);
  const f = person(MV, g, 'amigo', [], { gender: 'f' }).n;
  const m = person(MV, g, 'amigo', [], { gender: 'm' }).n;
  assert.strictEqual(MV.traitLabel('tóxico', f), 'tóxica');
  assert.strictEqual(MV.traitLabel('tóxico', m), 'tóxico');
  assert.strictEqual(MV.traitLabel('amable', f), 'amable');
  for (const id of MV.TRAITS) {
    for (const n of [f, m]) {
      const l = MV.traitLabel(id, n);
      assert.ok(l && typeof l === 'string' && !BAD_TEXT.test(l), id);
    }
  }
  assert.strictEqual(MV.traitLabel('inexistente', f), 'inexistente');
});

test('hay 18 rasgos y todos tienen tabla', () => {
  assert.strictEqual(MV.TRAITS.length, 18);
  for (const id of MV.TRAITS) {
    const t = MV.TRAIT_INFO[id];
    assert.ok(t, id);
    assert.ok(t.f && t.up && t.down, id);
  }
});

test('cada tag de la tabla existe', () => {
  const known = new Set();
  Object.values(MV.ACTION_TAGS).forEach((tags) => tags.forEach((t) => known.add(t)));
  for (const id of MV.TRAITS) {
    const t = MV.TRAIT_INFO[id];
    const used = Object.keys(t.up).concat(Object.keys(t.down), t.flip || []);
    for (const tag of used) assert.ok(tag === '*' || known.has(tag), id + ': ' + tag);
  }
});

test('las personas viejas conservan sus rasgos', () => {
  const g = game(MV, 2);
  const { n } = person(MV, g, 'amigo', ['tóxico', 'leal'], { gender: 'f' });
  assert.deepStrictEqual(n.traits, ['tóxico', 'leal']);
  assert.deepStrictEqual(n.traits.map((t) => MV.traitLabel(t, n)), ['tóxica', 'leal']);
});

// ——— Tarea 2: el ajuste por personalidad ———

/** Corre la acción `id` con una persona de esos rasgos (misma semilla) y devuelve { delta, msg, r, n }. */
function runAction(MV, seed, traits, id, extra, type) {
  MV.rng.seed(seed);
  const g = game(MV, seed, 30);
  const { n, r } = person(MV, g, type || 'amigo', traits, Object.assign({ gender: 'm' }, extra || {}));
  const a = MV.sys.rels.actions(g, r, n).find((x) => x.id === id);
  assert.ok(a, 'falta la acción ' + id);
  const before = r.rel;
  const out = a.run(g);
  const msg = typeof out === 'string' ? out : '';
  return { delta: r.rel - before, msg, r, n, before };
}

test('cada rasgo mueve la acción hacia su lado', () => {
  let big = 0;
  for (let s = 1; s <= 30; s++) {
    const base = runAction(MV, s, [], 'escuchar').delta;
    assert.ok(base >= 5 && base <= 10);
    for (const t of ['amable', 'sensible']) {
      const d = runAction(MV, s, [t], 'escuchar').delta;
      assert.strictEqual(d, Math.round(base * 1.5), t + ' s' + s);
      if (d > base) big++;
    }
    const ins = runAction(MV, s, [], 'insultar').delta;
    assert.ok(ins <= -10);
    assert.strictEqual(runAction(MV, s, ['dramático'], 'insultar').delta, Math.round(ins * 2), 'dramático');
    assert.strictEqual(runAction(MV, s, ['amable'], 'insultar').delta, Math.round(ins * 0.75), 'amable');
    assert.strictEqual(runAction(MV, s, ['competitivo'], 'gym_juntos').delta, Math.round(runAction(MV, s, [], 'gym_juntos').delta * 1.5), 'competitivo');
  }
  assert.ok(big > 0);
  let bad = 0;
  for (let s = 1; s <= 80; s++) {
    if (runAction(MV, s, [], 'broma').delta < 0) {
      assert.strictEqual(runAction(MV, s, ['divertido'], 'broma').delta, 2, 'divertido s' + s);
      bad++;
    }
  }
  assert.ok(bad > 0, 'alguna broma sale mal');
});

test('el factor queda entre 0,5 y 2', () => {
  const g = game(MV, 3);
  const a = person(MV, g, 'amigo', ['dramático', 'sensible']).n;
  assert.strictEqual(MV.sys.persona.factor(a, ['ofensa'], -1), 2);
  const b = person(MV, g, 'amigo', ['tímido', 'tranquilo']).n;
  assert.strictEqual(MV.sys.persona.factor(b, ['salida', 'fiesta'], 1), 0.5);
  const c = person(MV, g, 'amigo', ['tóxico', 'dramático']).n;
  assert.strictEqual(MV.sys.persona.factor(c, ['ofensa'], -1), 2);
  assert.ok(MV.sys.persona.has(a, 'sensible') && !MV.sys.persona.has(a, 'leal'));
});

test('sin rasgos o sin grupo, nada cambia', () => {
  const g = game(MV, 4);
  const none = person(MV, g, 'amigo', []).n;
  const undef = person(MV, g, 'amigo', []).n;
  delete undef.traits;
  for (const n of [none, undef]) {
    assert.strictEqual(MV.sys.persona.factor(n, ['ofensa'], -1), 1);
    assert.strictEqual(MV.sys.persona.factor(n, [], 1), 1);
    assert.strictEqual(MV.sys.persona.forgiveAt(n), 70);
    assert.strictEqual(MV.sys.persona.spite(n), 1);
  }
  const dram = person(MV, g, 'amigo', ['dramático']).n;
  assert.strictEqual(MV.sys.persona.factor(dram, [], -1), 1);
  for (let s = 1; s <= 20; s++) {
    const kid = { age: 10 };
    const a = runAction(MV, s, ['dramático', 'sensible'], 'castigar', kid, 'hijo');
    const b = runAction(MV, s, [], 'castigar', kid, 'hijo');
    assert.strictEqual(a.delta, b.delta);
    assert.ok(!BAD_TEXT.test(a.msg));
  }
});

test('la línea de reacción nombra a la persona', () => {
  for (const gender of ['f', 'm']) {
    let seen = 0;
    for (let s = 1; s <= 200; s++) {
      const { msg, n } = runAction(MV, s, ['dramático'], 'insultar', { gender });
      assert.ok(!BAD_TEXT.test(msg), msg);
      if (msg.split(n.first).length > 2) seen++;
    }
    assert.ok(seen > 0, 'alguna vez trae línea (' + gender + ')');
  }
  for (const id of MV.TRAITS) {
    const t = MV.TRAIT_INFO[id];
    for (const gender of ['f', 'm']) {
      const n = { first: 'Zoe', gender };
      for (const side of ['up', 'down']) {
        assert.ok(t.lines && t.lines[side] && t.lines[side].length >= 2, id + ' ' + side);
        for (const f of t.lines[side]) {
          const s = f(n);
          assert.ok(s.includes('Zoe') && !BAD_TEXT.test(s), id + ': ' + s);
        }
      }
    }
  }
});

test('fire y wrap: la marca no se arrastra', () => {
  const P = MV.sys.persona;
  const g = game(MV, 5);
  const { n, r } = person(MV, g, 'amigo', ['dramático']);
  r.rel = 40;
  P.fire();
  assert.strictEqual(P.adjust(g, r, n, 'insultar', 50), '');
  assert.strictEqual(r.rel, 40, 'la especial no se toca');
  r.rel = 30; // venía de 50: bajó 20, con dramático baja 40
  P.adjust(g, r, n, 'insultar', 50);
  assert.strictEqual(r.rel, 10, 'la marca ya se borró: 50 - 20 x 2');
  const raw = { id: 'x', run: () => 'hola' };
  assert.strictEqual(P.wrap(g, r, n, raw).run(g), 'hola');
  const noRun = { id: 'y' };
  assert.strictEqual(P.wrap(g, r, n, noRun), noRun);
  const pet = MV.newPet(g, 'perro', { age: 2 });
  const act = { id: 'insultar', run: () => { return 'x'; } };
  assert.strictEqual(P.wrap(g, r, pet, act), act);
});

test('el perdón depende del rasgo', () => {
  const mk = (traits, rel) => {
    const g = game(MV, 6);
    const { n, r } = person(MV, g, 'amigo', traits);
    r.rel = rel;
    return MV.sys.memory.outcome(g, r, n, { k: 'insulto', a: 10, d: 'x', v: -2 }).ev;
  };
  assert.strictEqual(mk(['leal'], 62), 'mem_perdon');
  assert.strictEqual(mk([], 62), 'mem_venganza');
  assert.strictEqual(mk(['rencoroso'], 85), 'mem_venganza');
  assert.strictEqual(mk(['leal', 'rencoroso'], 85), 'mem_venganza');
  assert.strictEqual(mk(['leal', 'rencoroso'], 90), 'mem_perdon');
  assert.strictEqual(mk([], 70), 'mem_perdon');
});

test('los rencorosos se vengan más', () => {
  let rencor = 0;
  const N = 600;
  for (let s = 1; s <= N; s++) {
    MV.rng.seed(s);
    const g = game(MV, s, 40);
    const a = person(MV, g, 'amigo', ['rencoroso']), b = person(MV, g, 'amigo', []);
    for (const x of [a, b]) x.r.mem = [{ k: 'insulto', a: 20, d: 'x', v: -2 }];
    let picked = null;
    const real = MV.U.chance, realPush = MV.EV.push;
    MV.EV.push = function (gg, id, data) { picked = data.target; };
    MV.U.chance = () => true;
    try { MV.sys.memory.yearly(g); } finally { MV.U.chance = real; MV.EV.push = realPush; }
    if (picked === a.n.id) rencor++;
  }
  assert.ok(rencor / N > 0.53 && rencor / N < 0.67, String(rencor / N));
});

test('ninguna línea trae un adjetivo masculino para una mujer', () => {
  const MASC = /\b(rojo|contento|emocionado|encantado|enojado|ofendido|dolido|aburrido|callado|preocupado|furioso|celoso|dormido|sorprendido|cansado)\b/i;
  for (const id of MV.TRAITS) {
    const t = MV.TRAIT_INFO[id];
    for (const side of ['up', 'down', 'less']) {
      for (const f of (t.lines && t.lines[side]) || []) {
        const fem = f({ first: 'Zoe', gender: 'f' }), mas = f({ first: 'Leo', gender: 'm' });
        assert.ok(!MASC.test(fem), id + ' ' + side + ': ' + fem);
        assert.ok(!BAD_TEXT.test(fem) && !BAD_TEXT.test(mas), id + ' ' + side);
      }
    }
  }
});

test('las ganancias que un rasgo reduce usan líneas "less"', () => {
  for (const id of ['fiestero', 'tímido', 'perezoso', 'religioso', 'tranquilo', 'tóxico']) {
    const t = MV.TRAIT_INFO[id];
    assert.ok(t.lines.less && t.lines.less.length >= 2, id);
    for (const f of t.lines.less) assert.ok(f({ first: 'Zoe', gender: 'f' }).includes('Zoe'));
  }
  const g = game(MV, 9);
  const { n, r } = person(MV, g, 'amigo', ['fiestero']);
  const less = new Set(MV.TRAIT_INFO.fiestero.lines.less.map((f) => f(n)));
  const up = new Set(MV.TRAIT_INFO.fiestero.lines.up.map((f) => f(n)));
  let seen = 0;
  for (let s = 1; s <= 60; s++) {
    MV.rng.seed(s);
    r.rel = 50;
    r.rel = 60;
    const msg = MV.sys.persona.adjust(g, r, n, 'desayuno', 50);
    assert.ok(!up.has(msg), 'no usa up: ' + msg);
    if (less.has(msg)) seen++;
  }
  assert.ok(seen > 0);
});

// ——— Tarea 3: las siete reacciones especiales ———

/** Prepara una partida y una persona y devuelve cómo correr una acción suya. */
function setup(seed, traits, type, extra, age) {
  MV.rng.seed(seed);
  const g = game(MV, seed, age == null ? 30 : age);
  g.p.money = 100000;
  const { n, r } = person(MV, g, type || 'amigo', traits, Object.assign({ gender: 'f', money: 100000 }, extra || {}));
  const act = (id, opt) => {
    const a = MV.sys.rels.actions(g, r, n).find((x) => x.id === id);
    assert.ok(a, 'falta ' + id);
    return a.run(g, opt);
  };
  return { g, n, r, act };
}
const clean = (msg) => assert.ok(typeof msg === 'string' && msg && !BAD_TEXT.test(msg), msg);

test('las siete especiales', () => {
  // 1. regalo caro a un tacaño
  const g1 = MV.GIFTS.find((x) => x.price >= 1000), g0 = MV.GIFTS.find((x) => x.price < 1000 && x.price > 10);
  let guardado = 0, normal = 0;
  for (let s = 1; s <= 30; s++) {
    for (const [tr, gift] of [[['tacaño'], g1], [[], g1], [['tacaño'], g0]]) {
      const x = setup(s, tr, 'amigo');
      const b = x.r.rel;
      const msg = x.act('regalo', gift.id);
      clean(msg);
      x.d = x.r.rel - b; x.msg = msg; x.tr = tr; x.gift = gift;
      if (tr.length && gift === g1) {
        const y = setup(s, [], 'amigo'); const b2 = y.r.rel; MV.rng.seed(s); y.act('regalo', g1.id);
        guardado += /sin abrir/.test(msg) ? 1 : 0; normal++;
        assert.ok(/sin abrir|en voz baja/.test(msg), msg);
        assert.ok(x.d >= 5, 'al menos el extra');
      } else if (tr.length) assert.ok(!/sin abrir|en voz baja/.test(msg), 'regalo barato no activa: ' + msg);
      else assert.ok(!/sin abrir|en voz baja/.test(msg));
    }
  }
  assert.ok(guardado > 5 && guardado < normal - 5, guardado + '/' + normal);
  { // el extra es exacto: +5 sobre el regalo sin rasgo, misma semilla
    for (let s = 1; s <= 10; s++) {
      const a = setup(s, ['tacaño']), b = setup(s, ['avaro-no']);
      const ba = a.r.rel, bb = b.r.rel;
      MV.rng.seed(s); a.act('regalo', g1.id); MV.rng.seed(s); b.act('regalo', g1.id);
      const da = a.r.rel - ba, db = b.r.rel - bb;
      assert.ok(da === Math.min(100, ba + db + 5) - ba || a.r.rel === 100, 'extra +5 s' + s);
    }
  }

  // 2. insultar a un dramático: se entera un familiar, o un amigo
  for (let s = 1; s <= 20; s++) {
    const x = setup(s, ['dramático'], 'amigo');
    const sib = person(MV, x.g, 'hermano', []); sib.n.parentId = 'padre-x'; x.n.parentId = 'padre-x';
    const other = person(MV, x.g, 'amigo', []);
    const pet = MV.newNPC(x.g, { species: 'perro', age: 3 }); const pr = MV.addRel(x.g, pet, 'mascota', 50);
    const bs = sib.r.rel, bo = other.r.rel, bp = pr.rel;
    clean(x.act('insultar'));
    assert.strictEqual(sib.r.rel, bs - 5, 'el hermano se entera');
    assert.strictEqual(other.r.rel, bo); assert.strictEqual(pr.rel, bp);
    const y = setup(s, [], 'amigo'); y.n.parentId = 'padre-x';
    const sib2 = person(MV, y.g, 'hermano', []); sib2.n.parentId = 'padre-x';
    const b2 = sib2.r.rel; y.act('insultar'); assert.strictEqual(sib2.r.rel, b2, 'sin rasgo no se entera');
  }
  { // sin familia: una amistad al azar; sin nadie: nadie baja
    const x = setup(3, ['dramático'], 'amigo');
    const f = person(MV, x.g, 'amigo', []); const b = f.r.rel;
    clean(x.act('insultar')); assert.strictEqual(f.r.rel, b - 5);
    const z = setup(4, ['dramático'], 'amigo');
    const m = z.act('insultar'); clean(m); assert.ok(/redes/.test(m), m);
  }

  // 3. generoso da un 50 % más
  let dio = 0;
  for (let s = 1; s <= 40; s++) {
    const a = setup(s, ['generoso'], 'amigo'), b = setup(s, [], 'amigo');
    a.r.rel = b.r.rel = 100;
    const ma = a.g.p.money, mb = b.g.p.money;
    const ta = a.act('pedir_dinero'), tb = b.act('pedir_dinero'); clean(ta); clean(tb);
    const da = a.g.p.money - ma;
    if (da > 0) {
      dio++;
      const base = Math.max(20, Math.round(Math.min(100000 * 0.15, 50000)));
      assert.ok(da <= Math.round(base * 1.5) && da >= 30, String(da));
      assert.ok(a.g.p.money >= 0);
    }
  }
  assert.ok(dio > 10);
  { // exacto: misma semilla, con y sin rasgo, con chance forzada
    const real = MV.U.chance; MV.U.chance = () => true;
    try {
      for (let s = 1; s <= 5; s++) {
        const a = setup(s, ['generoso']), b = setup(s, []);
        const ma = a.g.p.money, mb = b.g.p.money;
        MV.rng.seed(s); a.act('pedir_dinero'); MV.rng.seed(s); b.act('pedir_dinero');
        assert.strictEqual(a.g.p.money - ma, Math.round((b.g.p.money - mb) * 1.5), 'x1,5 s' + s);
        assert.strictEqual(a.r.rel, b.r.rel);
      }
    } finally { MV.U.chance = real; }
  }

  // 4. coquetear con alguien tímido
  let ran4 = 0;
  for (let s = 1; s <= 10; s++) {
    const x = setup(s, ['tímido'], 'amigo', { gender: 'f', age: 25 }, 25);
    x.g.p.gender = 'm'; x.n.orientation = x.n.orientation;
    if (!MV.sys.rels.canRomance(x.g, x.n, x.r)) continue;
    ran4++;
    const real = MV.U.chance; MV.U.chance = () => true;
    try {
      const m1 = x.act('coquetear'); clean(m1);
      assert.strictEqual(x.r.shy, x.g.p.age, 'la primera vez dice que no');
      assert.strictEqual(x.r.type, 'amigo');
      x.r.acts = {};
      x.g.p.age += 1;
      const m2 = x.act('coquetear'); clean(m2);
      assert.ok(x.r.type !== 'amigo', 'al año siguiente sí (chance forzada)');
    } finally { MV.U.chance = real; }
  }
  assert.ok(ran4 > 0, 'coquetear corrió');
  { // la chance se duplica con tope 0,95 el año siguiente, y no en otros años
    let calls = null;
    for (const [dt, doubled] of [[1, true], [2, false]]) {
      const x = setup(7, ['tímido'], 'amigo', { age: 25 }, 25);
      x.r.shy = x.g.p.age; x.g.p.age += dt; x.r.rel = 40;
      const real = MV.U.chance; let seen = [];
      MV.U.chance = (c) => { seen.push(c); return false; };
      try { x.act('coquetear'); } finally { MV.U.chance = real; }
      calls = seen.find((c) => c > 0.05 && c <= 0.95);
      const y = setup(7, [], 'amigo', { age: 25 }, 25);
      y.g.p.age += dt; y.r.rel = 40; seen = [];
      MV.U.chance = (c) => { seen.push(c); return false; };
      try { y.act('coquetear'); } finally { MV.U.chance = real; }
      const base = seen.find((c) => c > 0.05 && c <= 0.95);
      if (doubled) assert.ok(Math.abs(calls - Math.min(0.95, base * 2)) < 1e-9, calls + ' vs ' + base);
      else assert.ok(Math.abs(calls - base) < 1e-9);
    }
  }

  // 5. broma a un divertido: felicidad +3 y relación +5 más
  let ok5 = 0;
  for (let s = 1; s <= 60; s++) {
    const a = setup(s, ['divertido']), b = setup(s, []);
    a.g.p.stats.happy = b.g.p.stats.happy = 50; const ha = 50, hb = 50;
    MV.rng.seed(s); const ma = a.act('broma'); MV.rng.seed(s); const mb = b.act('broma'); clean(ma); clean(mb);
    if (b.r.rel === 53) {
      ok5++;
      assert.strictEqual(a.r.rel, 58); assert.strictEqual(b.r.rel, 53);
      assert.strictEqual(a.g.p.stats.happy - ha, b.g.p.stats.happy - hb + 3);
    }
  }
  assert.ok(ok5 > 0);

  // 6. fiestero en una salida tranquila
  for (const id of ['tiempo', 'cine_juntos', 'cena_casera']) {
    const type = id === 'tiempo' ? 'amigo' : 'pareja';
    let seen = 0;
    for (let s = 1; s <= 10; s++) {
      const a = setup(s, ['fiestero'], type), b = setup(s, [], type);
      a.g.p.stats.happy = b.g.p.stats.happy = 50; a.g.p.stats.stress = b.g.p.stats.stress = 50;
      MV.rng.seed(s); const ma = a.act(id); MV.rng.seed(s); const mb = b.act(id); clean(ma); clean(mb);
      assert.strictEqual(a.g.p.stats.happy - b.g.p.stats.happy, 4, id);
      assert.strictEqual(a.g.p.stats.stress - b.g.p.stats.stress, 3, id);
      assert.strictEqual(a.r.rel, b.r.rel, 'sin escalado ' + id);
      assert.ok(ma.includes(a.n.first));
      seen++;
    }
    assert.strictEqual(seen, 10);
  }

  // 7. espiar a un celoso
  for (let s = 1; s <= 10; s++) {
    const a = setup(s, ['celoso'], 'pareja');
    const real = MV.EV.push; const pushed = [];
    MV.EV.push = (g, id, d) => pushed.push([id, d]);
    try {
      const b = a.r.rel;
      const m = a.act('espiar_celular'); clean(m);
      assert.ok(b - a.r.rel >= 20 && b - a.r.rel <= 30, 'cae 20-30: ' + (b - a.r.rel));
      assert.ok(a.r.mem && a.r.mem.some((x) => x.k === 'espiar'));
      assert.strictEqual(pushed.length, 0, 'sin amante no encola');
      const lover = person(MV, a.g, 'amante', [], { first: 'Marta' });
      a.r.acts = {}; a.r.rel = 80;
      a.act('espiar_celular');
      assert.strictEqual(pushed.length, 1);
      assert.strictEqual(pushed[0][0], 'infiel_descubierto');
      assert.strictEqual(pushed[0][1].target, a.n.id); assert.strictEqual(pushed[0][1].lover, 'Marta');
      void lover;
    } finally { MV.EV.push = real; }
  }
  { // sin el rasgo no siempre te descubre
    let free = 0;
    for (let s = 1; s <= 40; s++) { const a = setup(s, [], 'pareja'); const m = a.act('espiar_celular'); clean(m); if (/memes/.test(m)) free++; }
    assert.ok(free > 0);
  }
});
