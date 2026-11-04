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
    out.push({ a, scope, opt: MV.U.pick(os) });
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
    MV.sys.career.audition(g, U.pick(Object.keys(MV.FAME)));
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
        if (x) MV.doAction(g, x.a, x.opt, x.scope);
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
