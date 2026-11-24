/* Mil Vidas — la memoria: el favor que te devuelve alguien a quien ayudaste, años después. */
(function (MV) {
  'use strict';
  const U = MV.U, ev = MV.ev, fx = MV.fx;
  const M = () => MV.sys.memory;

  /** El primer trabajo para el que cumples requisitos, o null. */
  const hireable = (g) => (MV.JOBS || []).find((J) => J && J.pay && MV.sys.career.meets(g, J).ok) || null;
  /** Tu pareja o cónyuge (que no sea esa persona) con la relación por debajo de 40. */
  const coldPartner = (g, n) => MV.rels(g, ['conyuge', 'pareja']).find((x) => x.n.id !== n.id && x.r.rel < 40) || null;

  /** Los favores, en orden de prioridad: el primero que encaja con tu situación. */
  MV.MEMORY_FAVORS = [
    { id: 'abogado', when: (g) => !!g.p.prison,
      ok: (g, r, n) => {
        const pr = g.p.prison;
        pr.left = Math.max(1, pr.left - 1);
        return `${n.first} le pagó a un abogado que movió papeles. Te quitaron un año de condena; te quedan ${pr.left}.`;
      } },
    { id: 'plata', when: (g) => g.p.money < 0 || MV.sys.money.dues(g) > g.p.money + MV.sys.money.income(g),
      ok: (g, r, n, ctx) => {
        const p = g.p, falta = Math.max(0, MV.sys.money.dues(g) - p.money, -p.money);
        const base = 2 * (typeof ctx.d === 'number' && isFinite(ctx.d) ? ctx.d : 1000);
        const amt = U.clamp(Math.max(falta, base), 2000, 50000);
        fx.money(g, amt);
        return `${n.first} te depositó ${U.money(amt)} sin preguntar nada. "Ni me lo agradezcas", escribió.`;
      } },
    { id: 'entrevista',
      when: (g) => {
        const p = g.p;
        return !p.job && p.age >= 18 && p.age <= 64 && !MV.sys.edu.studying(p) && !p.retired && !p.prison && !!hireable(g);
      },
      ok: (g, r, n) => {
        const J = hireable(g);
        if (!J) return `${n.first} lo intentó, pero no apareció nada.`;
        MV.EV.push(g, 'oferta_trabajo', { job: J.id, level: 0, salary: Math.round(J.pay[0] * U.float(0.9, 1.1)) }, true);
        return `${n.first} habló con un conocido y te consiguió una entrevista. Ya te están esperando.`;
      } },
    { id: 'cuidado',
      when: (g) => {
        const p = g.p;
        return p.stats.health < 40 || (p.conds || []).some((c) => { const C = MV.CONDITIONS[c.id]; return C && (C.drain[1] >= 8 || C.urgent); });
      },
      ok: (g, r, n) => {
        fx.stat(g, 'health', 10); fx.stat(g, 'happy', 6); fx.stat(g, 'stress', -5);
        return `${n.first} se quedó contigo, cocinó, te acompañó a los médicos y no se quejó ni una vez.`;
      } },
    { id: 'pareja', when: (g, r, n) => !!coldPartner(g, n),
      ok: (g, r, n) => {
        const x = coldPartner(g, n);
        if (x) x.r.rel = U.clamp(x.r.rel + 15, 0, 100);
        return `${n.first} habló con ${x ? x.n.first : 'tu pareja'} y le contó qué clase de persona eres. Las cosas en casa mejoraron.`;
      } },
    { id: 'regalo', when: () => true,
      ok: (g, r, n) => {
        if (U.chance(0.5)) {
          fx.stat(g, 'happy', 10); fx.stat(g, 'stress', -8);
          g.p.counters.viajes = (g.p.counters.viajes || 0) + 1;
          return `${n.first} te regaló un viaje. "Te lo debía", dijo, y te dio los pasajes antes de que pudieras protestar.`;
        }
        const amt = U.int(300, 2000);
        fx.money(g, amt); fx.stat(g, 'happy', 4);
        return `${n.first} te dejó ${U.money(amt)} en un sobre. "Para que te des un gusto."`;
      } }
  ];

  const favorOf = (ctx) => MV.MEMORY_FAVORS.find((f) => f.id === ctx.v) || MV.MEMORY_FAVORS[MV.MEMORY_FAVORS.length - 1];
  /** Lo que te ofrece cada favor, para el texto. */
  const OFFER = {
    abogado: (g) => `Se enteró de que estás ${U.gw(g.p.gender, 'preso', 'presa')} y te ofrece pagarte un abogado.`,
    plata: () => `Se enteró de que andas mal de plata y te ofrece una mano con el dinero.`,
    entrevista: () => `Se enteró de que no tienes trabajo y te ofrece conseguirte una entrevista.`,
    cuidado: () => `Se enteró de que no andas bien de salud y te ofrece cuidarte unos días.`,
    pareja: (g, n) => `Se enteró de que las cosas con tu pareja andan frías y te ofrece hablar con ${U.gw(n.gender, 'él', 'ella')}.`,
    regalo: () => `No necesitas nada, pero quiere devolverte la mano con un regalo.`
  };

  // ——— Un favor de vuelta (lo encola el motor de memoria cuando alguien te debe una) ———
  ev({
    id: 'mem_favor', pushOnly: true, prison: 'any', icon: '🤝', scene: 'hogar', title: 'Un favor de vuelta',
    when: (g, ctx) => !!ctx && !!MV.relOf(g, ctx.target),
    text: (g, ctx) => {
      const n = MV.person(g, ctx.target) || { first: 'Alguien', gender: 'm' };
      const m = { k: ctx.k, a: ctx.a, d: ctx.d };
      const did = M().said(g, n, m), ago = M().ago(g, m);
      const offer = (OFFER[ctx.v] || OFFER.regalo)(g, n);
      return `${n.first} no se olvidó de lo que hiciste: ${ago}, ${did}. ${offer}`;
    },
    choices: [
      { t: 'Aceptar',
        eff: (g, ctx) => {
          const n = MV.person(g, ctx.target) || { first: 'Alguien', gender: 'm' };
          return favorOf(ctx).ok(g, MV.relOf(g, ctx.target), n, ctx);
        } },
      { t: 'Rechazarlo con orgullo',
        eff: (g, ctx) => {
          const n = MV.person(g, ctx.target) || { first: 'Alguien', gender: 'm' };
          const r = MV.relOf(g, ctx.target);
          if (r) r.rel = U.clamp(r.rel - 2, 0, 100);
          return `Le dijiste a ${n.first} que no hacía falta. Se fue sin entender si eso era orgullo o torpeza.`;
        } }
    ]
  });
})(window.MV = window.MV || {});
