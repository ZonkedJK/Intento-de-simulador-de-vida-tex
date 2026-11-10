/* Jugador automático: hace acciones al azar en todas las pestañas para estresar el motor. */
'use strict';

function optsOf(MV, g, a) {
  if (!a.opts) return [undefined];
  const o = a.opts(g) || [];
  return o.map((x) => x.id);
}

/** Lista de acciones posibles este año: [{a, scope, opt}] */
function possibleActions(MV, g) {
  const out = [];
  const add = (a, scope) => {
    const os = optsOf(MV, g, a);
    if (!os.length) return;
    const opt = MV.U.pick(os);
    const opt2 = a.opts2 ? MV.U.pick((a.opts2(g, opt) || []).map((x) => x.id)) : undefined;
    out.push({ a, scope, opt, opt2 });
  };
  const p = g.p;
  if (p.prison) MV.sys.crime.prisonActions(g).forEach((a) => add(a));
  else {
    MV.catsFor(g).forEach((c) => MV.actsFor(g, c.id).forEach((a) => add(a)));
    MV.sys.edu.actions(g).forEach((a) => add(a));
    MV.sys.career.actions(g).forEach((a) => add(a));
  }
  MV.rels(g).forEach(({ r, n }) => {
    r.acts = r.acts || {};
    MV.sys.rels.actions(g, r, n).forEach((a) => add(a, r.acts));
  });
  // Vehículos e instrumentos desde la ficha de cada bien
  (p.assets || []).forEach((a) => {
    MV.sys.vehicles.actions(g, a).forEach((x) => add(x));
    MV.sys.music.actions(g, a).forEach((x) => add(x));
  });
  return out;
}

function special(MV, g) {
  const U = MV.U, p = g.p;
  if (p.prison || p.age < 14) return;
  const r = U.rand();
  if (r < 0.15 && p.age >= 14) {
    const pool = MV.JOBS.concat(MV.PARTTIME).filter((J) => MV.sys.career.meets(g, J).ok);
    const J = U.pick(pool);
    if (J) MV.sys.career.apply(g, J.id);
  } else if (r < 0.2 && p.age >= 16) {
    if (U.chance(0.5)) MV.sys.career.audition(g, U.pick(Object.keys(MV.FAME)));
    else MV.sys.sports.tryout(g, U.pick(Object.keys(MV.SPORTS)));
  } else if (r < 0.28 && p.age >= 18) {
    const kind = U.pick(['casa', 'auto', 'lujo']);
    const it = U.pick(MV.sys.money.listings(g, kind));
    if (it) MV.sys.money.buy(g, it, kind === 'casa' && U.chance(0.5));
  } else if (r < 0.31 && p.assets.length) {
    MV.sys.money.sell(g, U.pick(p.assets).id);
  } else if (r < 0.35 && p.money > 1000) {
    MV.sys.money.invest(g, U.pick(Object.keys(MV.INVEST)), Math.round(p.money * 0.3));
  } else if (r < 0.37) {
    MV.sys.money.withdraw(g, U.pick(Object.keys(MV.INVEST)));
  } else if (r < 0.4 && p.age >= 18 && !p.business) {
    MV.sys.money.openBusiness(g, U.pick(MV.BUSINESSES).id);
  } else if (r < 0.41 && p.business) {
    MV.sys.money.sellBusiness(g);
  } else if (r < 0.45 && p.age >= 18) {
    MV.sys.money.rent(g, U.pick(MV.RENTALS).id);
  } else if (r < 0.48 && MV.sys.edu.canEnrollUni(p) && p.age >= 18) {
    MV.EV.push(g, 'elegir_carrera', {}, true);
  } else if (r < 0.5 && p.age >= 8) {
    MV.sys.music.buy(g, U.pick(MV.INSTRUMENTS).id);
  } else if (r < 0.53 && p.age >= 18) {
    // Islas: a veces regala una para probar el desarrollo; si hay una, la desarrolla o la mejora.
    let isla = p.assets.find((a) => MV.sys.island.isIsland(a));
    if (!isla && U.chance(0.3)) { isla = { id: MV.U.uid('a'), type: 'lujo', kind: 'Isla privada', icon: '🏝️', name: 'Isla privada', value: 15000000, cond: 100 }; p.assets.push(isla); p.money += 12000000; }
    if (isla && !isla.project) MV.sys.island.develop(g, isla.id, U.pick(Object.keys(MV.ISLAND_TYPES)), U.chance(0.5) ? 'Isla <Prueba> ${x}' : '', '');
    else if (isla && U.chance(0.5)) MV.sys.island.upgrade(g, isla.id);
    else if (isla && U.chance(0.1)) MV.sys.island.close(g, isla.id);
  } else if (r < 0.6 && p.age >= 16) {
    // Autos de la concesionaria: comprar, tunear, correr y asegurar (los viejos también).
    const cars = p.assets.filter((a) => a.type === 'auto');
    const k = U.rand();
    const check = (t) => { if (typeof t !== 'string' || BAD_TEXT.test(t)) throw new Error('Texto roto en autos: ' + t); };
    if (!cars.length || k < 0.25) {
      const m = U.pick(MV.CAR_CATALOG.filter((x) => x.price <= Math.max(0, p.money)));
      if (m) check(MV.sys.money.buyCar(g, m.id, U.pick(MV.CAR_COLORS).id));
    } else {
      const a = U.pick(cars);
      if (k < 0.5) check(MV.sys.cars.tune(g, a.id, U.pick(Object.keys(MV.CAR_TUNES))));
      else if (k < 0.8) check(MV.sys.cars.race(g, a.id, U.pick(['calle', 'circuito']), U.pick([0, 500, 2000])));
      else check(MV.sys.cars.insure(g, a.id, U.chance(0.7)));
    }
    if (U.chance(0.3)) {
      const part = U.pick(['exercise', 'diet']);
      check(MV.sys.wellbeing.setRoutine(g, part, U.pick(Object.keys(MV.ROUTINES[part]))));
    }
  } else if (r < 0.62 && p.age >= 18 && !p.prison) {
    // Vehículos: a veces regala uno para probar sus acciones.
    const kinds = ['Avión privado', 'Helicóptero', 'Yate'];
    if (!p.assets.some((a) => kinds.includes(a.kind))) { const k = U.pick(kinds); p.assets.push({ id: MV.U.uid('a'), type: 'lujo', kind: k, icon: '🛥️', name: k, value: 1000000, cond: 100 }); }
  }
}

const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
const seen = new Set();

function resolveQueue(MV, g) {
  let guard = 0;
  while (g.queue.length && !g.over && guard++ < 50) {
    const v = MV.EV.view(g);
    if (!v) break;
    if (!v.choices.length) throw new Error('Evento sin opciones visibles: ' + v.id);
    [v.text, v.title || ''].concat(v.choices.map((c) => c.label)).forEach((t) => {
      if (typeof t !== 'string' || BAD_TEXT.test(t)) throw new Error(`Texto roto en el evento ${v.id}: ${t}`);
    });
    seen.add(v.id || 'info');
    const res = MV.EV.choose(g, MV.U.pick(v.choices).i);
    if (res && res.msg && BAD_TEXT.test(res.msg)) throw new Error(`Resultado roto en ${v.id}: ${res.msg}`);
  }
}

/** Vive una vida completa. Devuelve la partida final. */
function live(MV, g, o) {
  o = o || {};
  const actsPerYear = o.acts == null ? 3 : o.acts;
  let guard = 0;
  while (!g.over && guard++ < 140) {
    resolveQueue(MV, g);
    if (g.over) break;
    const n = MV.U.int(0, actsPerYear);
    for (let i = 0; i < n && !g.over; i++) {
      if (MV.U.chance(0.2)) special(MV, g);
      else {
        const list = possibleActions(MV, g);
        const x = MV.U.pick(list);
        if (x) MV.doAction(g, x.a, x.opt, x.scope, x.opt2);
      }
      resolveQueue(MV, g);
      if (o.check) o.check(g);
    }
    if (g.over) break;
    resolveQueue(MV, g);
    MV.ageUp(g);
    if (o.check) o.check(g);
  }
  return g;
}

module.exports = { live, possibleActions, resolveQueue, seen };
