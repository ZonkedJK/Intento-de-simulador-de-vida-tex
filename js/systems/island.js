/* Mil Vidas — desarrollar islas privadas: proyecto con nombre, 5 niveles, ganancias según turismo y eventos. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const MAX_LEVEL = 5;
  const BACK = 0.7; // parte de lo invertido que suma al valor de la isla
  const TOURISM = { pandemia: 0.3, recesion: 0.75, guerra: 0.85, auge: 1.2, ola_calor: 1.1 };
  const clean = (s) => MV.sys.works.clean(s);

  const island = {
    MAX_LEVEL,
    isIsland(a) { return !!a && a.type === 'lujo' && a.kind === 'Isla privada'; },
    find(g, id) { const a = g.p.assets.find((x) => x.id === id); return island.isIsland(a) ? a : null; },

    develop(g, assetId, type, name, mascot) {
      const a = island.find(g, assetId), T = MV.ISLAND_TYPES[type], p = g.p;
      if (!a) return 'Esa isla ya no es tuya.';
      if (!T) return 'Ese proyecto no existe.';
      if (a.project) return `Ya tiene un proyecto: ${a.project.name}.`;
      if (p.money < T.cost) return `Necesitas ${U.money(T.cost)} para empezar.`;
      MV.fx.money(g, -T.cost);
      a.project = { type, name: clean(name) || U.pick(T.names), mascot: T.mascot ? clean(mascot) || U.pick(T.mascots) : null, level: 1, rep: 50, invested: T.cost, last: 0, since: p.age };
      a.value += Math.round(T.cost * BACK);
      MV.fx.stat(g, 'happy', 8); MV.fx.stat(g, 'stress', 6);
      const pr = a.project;
      return `Inauguraste ${pr.name}, ${T.name.toLowerCase()} en tu isla${pr.mascot ? `, con ${pr.mascot} como mascota` : ''}. Inversión: ${U.money(T.cost)}.`;
    },

    /** Subir al nivel N cuesta la inversión inicial × 0,6 × N. */
    upgradeCost(a) { return Math.round(MV.ISLAND_TYPES[a.project.type].cost * 0.6 * (a.project.level + 1)); },

    upgrade(g, assetId) {
      const a = island.find(g, assetId), p = g.p;
      if (!a || !a.project) return 'No hay un proyecto para mejorar.';
      const pr = a.project;
      if (pr.level >= MAX_LEVEL) return `${pr.name} ya está al máximo.`;
      const cost = island.upgradeCost(a);
      if (p.money < cost) return `Necesitas ${U.money(cost)} para mejorarlo.`;
      MV.fx.money(g, -cost);
      pr.level++; pr.invested += cost; pr.rep = U.clamp(pr.rep + 5, 0, 100);
      a.value += Math.round(cost * BACK);
      if (pr.level === MAX_LEVEL) MV.ach.unlock(g, 'magnate_isla');
      return `${pr.name} subió al nivel ${pr.level}. ${U.pick(['Más atracciones, más turistas, más filas.', 'Los turistas llegan en barcos cada vez más grandes.', 'Hasta las gaviotas parecen más contentas.'])}`;
    },

    close(g, assetId) {
      const a = island.find(g, assetId);
      if (!a || !a.project) return 'No hay un proyecto para cerrar.';
      const pr = a.project;
      a.value = Math.max(Math.round(a.value * 0.5), a.value - Math.round(pr.invested * BACK));
      delete a.project;
      g.queue = g.queue.filter((q) => !(q.ctx && q.ctx.asset === a.id));
      MV.fx.stat(g, 'happy', -5);
      return `Cerraste ${pr.name}. La isla vuelve a ser solo tuya (y de los cangrejos).`;
    },

    /** Factor de turismo según la noticia del año. */
    tourism(g) { const N = MV.sys.world.current(g); return (N && TOURISM[N.id]) || 1; },

    /** Ganancias, reputación, karma o fama y eventos de cada isla con proyecto. */
    yearly(g) {
      g.p.assets.filter((a) => island.isIsland(a) && a.project).forEach((a) => {
        const pr = a.project, T = MV.ISLAND_TYPES[pr.type];
        const t = island.tourism(g);
        const inc = Math.round(T.base * pr.level * (pr.rep / 50) * t * U.float(0.8, 1.2));
        MV.fx.money(g, inc);
        pr.last = inc;
        pr.rep = U.clamp(pr.rep + U.int(-4, 4), 5, 100);
        if (T.karma) MV.fx.stat(g, 'karma', T.karma);
        if (T.fame) MV.fx.stat(g, 'fame', T.fame);
        MV.log(g, `${T.icon} ${pr.name} dejó ${U.money(inc)} este año${t < 1 ? ' (las noticias espantaron a los turistas)' : t > 1 ? ' (las noticias trajeron más turistas)' : ''}.`, '🏝️', 'good');
        if (U.chance(0.25)) MV.EV.push(g, U.pick(T.events), { asset: a.id });
      });
    }
  };
  MV.sys.island = island;

  // — Eventos de las islas (se resuelven solos si la isla ya no existe) —
  const proj = (g, ctx) => { const a = island.find(g, ctx.asset); return a && a.project ? a : null; };
  const name = (g, ctx) => { const a = proj(g, ctx); return a ? a.project.name : 'tu isla'; };
  const rep = (a, d) => { if (a) a.project.rep = U.clamp(a.project.rep + d, 5, 100); };
  const gone = 'Ese proyecto ya no existe. Problema resuelto solo.';
  const ev = (d) => MV.ev(Object.assign({ manual: true, prison: 'any', scene: 'playa' }, d));

  ev({ id: 'isla_mascota', icon: '🦝', title: 'Escándalo en el parque',
    text: (g, ctx) => { const a = proj(g, ctx); return `En ${name(g, ctx)}, ${a ? a.project.mascot : 'la mascota'} mordió a un niño durante una foto. El video ya tiene dos millones de vistas.`; },
    choices: [
      { t: '💸 Pagar una indemnización ($200.000)', when: (g) => g.p.money >= 200000, eff: (g, ctx) => { const a = proj(g, ctx); if (!a) return gone; MV.fx.money(g, -200000); rep(a, -3); MV.fx.stat(g, 'karma', 1); return 'Pagaste, pediste perdón y le regalaste al niño un pase de por vida. Su familia ahora viene todos los fines de semana.'; } },
      { t: '🙄 Decir que el niño mordió primero', eff: (g, ctx) => { const a = proj(g, ctx); if (!a) return gone; rep(a, -12); MV.fx.stat(g, 'karma', -4); MV.fx.stat(g, 'fame', 2); return 'Diste una conferencia diciendo que el niño mordió primero. Internet no te creyó, pero se volvió un meme.'; } },
      { t: '🧑‍🎤 Despedir al que estaba disfrazado', eff: (g, ctx) => { const a = proj(g, ctx); if (!a) return gone; rep(a, -5); MV.fx.stat(g, 'karma', -2); return 'Despediste al empleado del disfraz. Dijo que el traje tenía los dientes de verdad. Nadie quiso saber más.'; } }
    ] });
  ev({ id: 'isla_montana', icon: '🎢', title: 'La montaña rusa se trabó',
    text: (g, ctx) => `La montaña rusa de ${name(g, ctx)} se trabó con 30 personas cabeza abajo durante dos horas.`,
    choices: [
      { t: '🎟️ Devolver las entradas y regalar pases', when: (g) => g.p.money >= 100000, eff: (g, ctx) => { const a = proj(g, ctx); if (!a) return gone; MV.fx.money(g, -100000); rep(a, 4); return 'Devolviste todo y regalaste pases. Los pasajeros se volvieron fanáticos del parque.'; } },
      { t: '🤑 Venderlo como "experiencia extrema"', eff: (g, ctx) => { const a = proj(g, ctx); if (!a) return gone; MV.fx.money(g, 150000); rep(a, -8); MV.fx.stat(g, 'karma', -3); return 'Le subiste el precio y la llamaste "La Colgada". Hay filas de dos horas. Para colgarse dos horas.'; } },
      { t: '🔧 Cerrarla para revisarla', eff: (g, ctx) => { const a = proj(g, ctx); if (!a) return gone; MV.fx.money(g, -Math.min(50000, Math.max(0, g.p.money))); rep(a, 1); return 'Cerraste la atracción una semana. Los mecánicos encontraron un tornillo flojo y una billetera de 1987.'; } }
    ] });
  ev({ id: 'isla_resena', icon: '⭐', title: 'Una influencer en el resort',
    text: (g, ctx) => `Una influencer con 30 millones de seguidores se hospeda en ${name(g, ctx)} y está por publicar su reseña.`,
    choices: [
      { t: '👑 Darle la suite presidencial gratis', when: (g) => g.p.money >= 80000, eff: (g, ctx) => { const a = proj(g, ctx); if (!a) return gone; MV.fx.money(g, -80000); if (U.chance(0.7)) { rep(a, 12); return 'Publicó 47 historias desde la suite. Las reservas se agotaron por un año.'; } rep(a, 4); return 'Le encantó la suite, pero subió todo con un filtro tan fuerte que nadie reconoció el lugar.'; } },
      { t: '🙂 Tratarla como a cualquier huésped', eff: (g, ctx) => { const a = proj(g, ctx); if (!a) return gone; if (U.chance(0.5)) { rep(a, 6); return 'Valoró que la trataran normal. Su reseña habló de "autenticidad".'; } rep(a, -6); return 'Esperaba alfombra roja. Su reseña tituló: "Me dieron una toalla normal".'; } },
      { t: '💰 Cobrarle doble por la vista al mar', eff: (g, ctx) => { const a = proj(g, ctx); if (!a) return gone; MV.fx.money(g, 20000); rep(a, -15); return 'Le cobraste el doble. Su video "El resort más tacaño del mundo" ya va por los diez millones.'; } }
    ] });
  ev({ id: 'isla_redada', icon: '🚔', title: 'Redada en el casino', scene: 'carcel',
    text: (g, ctx) => `La policía llegó en lanchas a ${name(g, ctx)}: dicen que hay apuestas ilegales y lavado de dinero.`,
    choices: [
      { t: '🤝 Sobornar al comisario ($500.000)', when: (g) => g.p.money >= 500000 && !g.p.prison, eff: (g, ctx) => { const a = proj(g, ctx); if (!a) return gone; MV.fx.money(g, -500000); MV.fx.stat(g, 'karma', -6); if (U.chance(0.7)) return 'El comisario se fue con una sonrisa y una ficha de recuerdo. Aquí no pasó nada.'; MV.sys.crime.arrest(g, 'Soborno', 3); return 'El comisario era honesto. Grabó todo.'; } },
      { t: '⚖️ Contratar a los mejores abogados ($300.000)', when: (g) => g.p.money >= 300000, eff: (g, ctx) => { const a = proj(g, ctx); if (!a) return gone; MV.fx.money(g, -300000); rep(a, -5); if (U.chance(0.8)) return 'Tus abogados encontraron 14 errores en la orden. El caso se archivó.'; MV.fx.money(g, -1000000); return 'Los abogados perdieron. Te pusieron una multa de un millón.'; } },
      { t: '🚪 Cerrar el casino', eff: (g, ctx) => { if (!proj(g, ctx)) return gone; MV.fx.stat(g, 'karma', 2); return island.close(g, ctx.asset); } }
    ] });
  ev({ id: 'isla_documental', icon: '🎥', title: 'Un documental en la reserva',
    text: (g, ctx) => `Un equipo de televisión quiere filmar un documental sobre las tortugas de ${name(g, ctx)}.`,
    choices: [
      { t: '🎙️ Aparecer en el documental', eff: (g, ctx) => { const a = proj(g, ctx); if (!a) return gone; MV.fx.stat(g, 'fame', 6); MV.fx.stat(g, 'karma', 2); rep(a, 3); return `Saliste en el documental hablando con una tortuga. Te volviste ${U.gw(g.p.gender, 'el "guardián', 'la "guardiana')} de las tortugas" de internet.`; } },
      { t: '🐢 Que las protagonistas sean las tortugas', eff: (g, ctx) => { const a = proj(g, ctx); if (!a) return gone; MV.fx.stat(g, 'karma', 4); rep(a, 6); return 'El documental ganó un premio. Las tortugas no fueron a buscarlo.'; } },
      { t: '💵 Cobrar por filmar ($50.000)', eff: (g, ctx) => { const a = proj(g, ctx); if (!a) return gone; MV.fx.money(g, 50000); rep(a, -4); return 'Cobraste por filmar. En el documental apareces de fondo contando billetes.'; } }
    ] });
})(window.MV = window.MV || {});
