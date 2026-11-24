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

  // ——— Las vueltas de la vida: algo bueno que te llega gracias a lo que hiciste por alguien ———
  const amount = (ctx) => (typeof ctx.d === 'number' && isFinite(ctx.d) ? ctx.d : 1000);
  const GOOD = () => Object.keys(MV.MEMORY_KINDS || {}).filter((k) => MV.MEMORY_KINDS[k].good);
  MV.MEMORY_TWISTS = [
    { id: 'empresa', kinds: ['prestamo', 'inversion', 'dinero'], when: (g, r, n) => n.age >= 25,
      ok: (g, r, n, ctx) => {
        const amt = Math.min(100000, Math.max(5000, 5 * amount(ctx)));
        fx.money(g, amt);
        return `${n.first} te mandó ${U.money(amt)}: tu parte de la empresa que levantó con tu ayuda. "Sin ti no existiría", escribió.`;
      } },
    { id: 'devuelve', kinds: ['prestamo'], when: () => true,
      ok: (g, r, n, ctx) => {
        const amt = 2 * amount(ctx);
        fx.money(g, amt);
        return `${n.first} te devolvió ${U.money(amt)}, el doble de lo que le prestaste. "Los intereses", dijo.`;
      } },
    { id: 'medico', kinds: ['apoyo'], when: (g, r, n) => n.age >= 25,
      ok: (g, r, n) => {
        const c = (g.p.conds || [])[0];
        if (c) {
          MV.sys.health.remove(g, c.id);
          const C = MV.CONDITIONS[c.id];
          return `${n.first} ahora es ${U.gw(n.gender, 'médico', 'médica')} y te atendió ${U.gw(n.gender, 'él mismo', 'ella misma')}. Te curó: ${C ? C.name.toLowerCase() : 'lo que tenías'}.`;
        }
        fx.stat(g, 'health', 8);
        return `${n.first} ahora es ${U.gw(n.gender, 'médico', 'médica')} y te hizo un chequeo completo, gratis. Saliste mejor de lo que entraste.`;
      } },
    { id: 'padrino', kinds: ['discurso'], when: (g, r, n) => n.age >= 22 && n.age <= 50,
      ok: (g, r, n) => {
        fx.stat(g, 'happy', 8); fx.stat(g, 'karma', 2);
        if (r) r.rel = U.clamp(r.rel + 10, 0, 100);
        return `Fuiste ${U.gw(g.p.gender, 'el padrino', 'la madrina')} del hijo de ${n.first}. Lloraste más que los padres.`;
      } },
    { id: 'recomienda', get kinds() { return GOOD(); }, when: (g) => !!g.p.job,
      ok: (g, r, n) => {
        const job = g.p.job;
        if (!job) return `${n.first} quiso recomendarte en tu trabajo, pero ya no estás ahí. La intención cuenta.`;
        job.perf = U.clamp(job.perf + 15, 0, 100);
        return `${n.first} habló bien de ti con gente que conoce a tu jefe. En la oficina empezaron a mirarte distinto.`;
      } }
  ];

  const twistOf = (ctx) => MV.MEMORY_TWISTS.find((t) => t.id === ctx.v) || MV.MEMORY_TWISTS[MV.MEMORY_TWISTS.length - 1];
  /** Lo que trae cada vuelta, para el texto. */
  const BRINGS = {
    empresa: (g, n) => `Su empresa creció y quiere darte lo que te corresponde.`,
    devuelve: () => `Quiere devolverte lo que le prestaste, con intereses.`,
    medico: (g, n) => `Ahora es ${U.gw(n.gender, 'médico', 'médica')} y quiere atenderte.`,
    padrino: (g, n) => `Te pide que seas ${U.gw(g.p.gender, 'el padrino', 'la madrina')} de su hijo.`,
    recomienda: () => `Quiere hablar bien de ti con gente que conoce a tu jefe.`
  };
  const nobody = (g, ctx) => MV.person(g, ctx.target) || { first: 'Alguien', gender: 'm' };
  /** Lo que hiciste, y cuándo: "hace 3 años, le prestaste $5.000". */
  const deed = (g, n, ctx) => {
    const m = { k: ctx.k, a: ctx.a, d: ctx.d };
    return `${M().ago(g, m)}, ${M().said(g, n, m)}`;
  };

  // ——— Una vuelta de la vida (la encola el motor de memoria) ———
  ev({
    id: 'mem_vuelta', pushOnly: true, icon: '🔄', scene: 'hogar', title: 'Vueltas de la vida',
    when: (g, ctx) => !!ctx && !!MV.relOf(g, ctx.target),
    text: (g, ctx) => {
      const n = nobody(g, ctx);
      return `${n.first} no se olvidó de lo que hiciste: ${deed(g, n, ctx)}. ${(BRINGS[ctx.v] || BRINGS.recomienda)(g, n)}`;
    },
    choices: [
      { t: 'Aceptar', eff: (g, ctx) => twistOf(ctx).ok(g, MV.relOf(g, ctx.target), nobody(g, ctx), ctx) },
      { t: 'Decirle que no hacía falta',
        eff: (g, ctx) => {
          const r = MV.relOf(g, ctx.target);
          if (r) r.rel = U.clamp(r.rel + 5, 0, 100);
          return `Le dijiste a ${nobody(g, ctx).first} que no hacía falta. Sonrió: "Para eso estamos."`;
        } }
    ]
  });

  // ——— Ya te perdoné: alguien a quien le hiciste algo malo lo dejó atrás ———
  ev({
    id: 'mem_perdon', pushOnly: true, prison: 'any', icon: '🕊️', scene: 'hogar', title: 'Ya te perdoné',
    when: (g, ctx) => !!ctx && !!MV.relOf(g, ctx.target),
    text: (g, ctx) => {
      const n = nobody(g, ctx);
      return `${n.first} te buscó por algo que sigue en el aire: ${deed(g, n, ctx)}. "Ya lo superé", te dice. "Ya te perdoné. Cargar con eso pesaba demasiado."`;
    },
    choices: [
      { t: 'Agradecer',
        eff: (g, ctx) => {
          const r = MV.relOf(g, ctx.target);
          if (r) r.rel = U.clamp(r.rel + 8, 0, 100);
          fx.stat(g, 'happy', 3);
          return `Le agradeciste a ${nobody(g, ctx).first}. Algo que cargabas sin saberlo se aflojó.`;
        } },
      { t: 'Hacerte el distraído',
        eff: (g, ctx) => {
          const r = MV.relOf(g, ctx.target);
          if (r) r.rel = U.clamp(r.rel - 2, 0, 100);
          return `Hiciste como que no sabías de qué hablaba. ${nobody(g, ctx).first} asintió despacio y cambió de tema.`;
        } }
    ]
  });
  // ——— Te la tenía guardada: alguien a quien le hiciste algo malo te lo cobra ———
  const firstCar = (g) => (g.p.assets || []).find((a) => a && a.type === 'auto') || null;
  const otherPartner = (g, n) => MV.rels(g, ['conyuge', 'pareja']).find((x) => x.n.id !== n.id) || null;
  /** Las venganzas: ninguna toca el dinero. `hit` aplica el daño y cuenta qué pasó. */
  MV.MEMORY_REVENGES = [
    { id: 'pareja', when: (g, r, n) => !!otherPartner(g, n),
      hit: (g, r, n) => {
        const x = otherPartner(g, n);
        if (x) x.r.rel = U.clamp(x.r.rel - 15, 0, 100);
        return `${n.first} le contó a ${x ? x.n.first : 'tu pareja'} todo lo que sabe de ti. En casa el ambiente se enfrió.`;
      } },
    { id: 'jefe', when: (g) => !!g.p.job,
      hit: (g, r, n) => {
        const job = g.p.job;
        if (job && typeof job.perf === 'number') job.perf = U.clamp(job.perf - 15, 0, 100);
        const b = MV.sys.workplace.boss(g);
        if (b) b.r.rel = U.clamp(b.r.rel - 10, 0, 100);
        return `${n.first} habló mal de ti con gente de tu trabajo. En la oficina te miran distinto, y no para bien.`;
      } },
    { id: 'auto', when: (g) => !!firstCar(g),
      hit: (g, r, n) => {
        const a = firstCar(g);
        if (a) a.cond = U.clamp((typeof a.cond === 'number' ? a.cond : 100) - 20, 0, 100);
        return `${n.first} le dejó el auto hecho un desastre: ${a && a.name ? a.name : 'tu auto'} amaneció rayado y con un espejo colgando.`;
      } },
    { id: 'escrache', when: (g) => (g.p.fame || 0) >= 20,
      hit: (g, r, n) => {
        fx.stat(g, 'fame', -5); fx.stat(g, 'happy', -6);
        return `${n.first} publicó tu historia con nombre y apellido. Se compartió bastante más de lo que quisieras.`;
      } },
    { id: 'fiesta', when: (g) => g.p.housing === 'propia',
      hit: (g, r, n) => {
        fx.stat(g, 'happy', -8);
        return `${n.first} montó una fiesta ruidosa frente a tu casa, con parlantes y todo, hasta que amaneció.`;
      } },
    { id: 'chismes', when: () => true,
      hit: (g, r, n) => {
        fx.stat(g, 'happy', -5);
        return `${n.first} fue contándole a todo el mundo lo que le hiciste. Los rumores llegaron antes que tú.`;
      } }
  ];

  const revengeOf = (ctx) => MV.MEMORY_REVENGES.find((x) => x.id === ctx.v) || MV.MEMORY_REVENGES[MV.MEMORY_REVENGES.length - 1];
  /** Lo que hace la persona, para el texto. */
  const DOING = {
    pareja: (g, n) => `Está por contarle a tu pareja todo lo que sabe de ti.`,
    jefe: () => `Está hablando mal de ti con gente de tu trabajo.`,
    auto: (g, n) => `Anda rondando tu auto con cara de pocos amigos y una llave en la mano.`,
    escrache: () => `Está armando una publicación con tu nombre para que todos se enteren.`,
    fiesta: (g, n) => `Está organizando una fiesta a todo volumen frente a tu casa.`,
    chismes: () => `Está contándole tu historia a todo el que quiera escuchar.`
  };

  ev({
    id: 'mem_venganza', pushOnly: true, icon: '😠', scene: 'hogar', title: 'Te la tenía guardada',
    when: (g, ctx) => !!ctx && !!MV.relOf(g, ctx.target),
    text: (g, ctx) => {
      const n = nobody(g, ctx);
      return `${n.first} no se olvidó de lo que hiciste: ${deed(g, n, ctx)}. ${(DOING[ctx.v] || DOING.chismes)(g, n)}`;
    },
    choices: [
      { t: 'Disculparte',
        eff: (g, ctx) => {
          const n = nobody(g, ctx), r = MV.relOf(g, ctx.target);
          if (U.chance(0.4)) {
            if (r) r.rel = U.clamp(r.rel + 10, 0, 100);
            return `Le pediste perdón a ${n.first} sin excusas. ${U.gw(n.gender, 'Lo', 'La')} pensó un buen rato y aceptó: lo dejó pasar.`;
          }
          return `${n.first} escuchó tu disculpa y no la creyó. ${revengeOf(ctx).hit(g, r, n)}`;
        } },
      { t: 'Devolver el golpe',
        eff: (g, ctx) => {
          const n = nobody(g, ctx), r = MV.relOf(g, ctx.target);
          const out = revengeOf(ctx).hit(g, r, n);
          fx.stat(g, 'happy', 3);
          M().remember(g, n.id, 'revancha');
          let tail = '';
          if (r) {
            r.rel = U.clamp(r.rel - 25, 0, 100);
            if (!MV.FAMILY.includes(r.type) && !['pareja', 'conyuge', 'amante'].includes(r.type)) {
              r.type = 'enemigo';
              tail = ` Ahora ${n.first} es ${U.gw(n.gender, 'tu enemigo', 'tu enemiga')}.`;
            }
          }
          return `Le respondiste a ${n.first} con la misma moneda. ${out}${tail}`;
        } },
      { t: 'Ignorarlo',
        eff: (g, ctx) => {
          const n = nobody(g, ctx);
          return `Hiciste como que no pasaba nada. ${revengeOf(ctx).hit(g, MV.relOf(g, ctx.target), n)}`;
        } }
    ]
  });
})(window.MV = window.MV || {});