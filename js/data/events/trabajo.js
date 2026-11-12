/* Mil Vidas — eventos del trabajo de tiempo completo: oferta, pedido de aumento y decisiones laborales. */
(function (MV) {
  'use strict';
  const U = MV.U, ev = MV.ev, fx = MV.fx;
  const WP = () => MV.sys.workplace;
  const C = () => MV.sys.career;
  const ch = (x) => U.chance(U.clamp(x, 0.05, 0.95));
  const fullJob = (g) => !!(g.p.job && g.p.job.type === 'full');

  // ——— Oferta al pasar la entrevista ———
  ev({
    id: 'oferta_trabajo', manual: true, icon: '📝', scene: 'trabajo',
    title: (g, ctx) => `Oferta: ${MV.gt(MV.jobById(ctx.job).titles[ctx.level || 0], g.p.gender)}`,
    text: (g, ctx) => `Recursos Humanos te ofrece ${U.money(ctx.salary)} al año y una taza con el logo de la empresa. ¿Qué respondes?`,
    choices: [
      { t: (g, ctx) => `Aceptar ${U.money(ctx.salary)}`, sub: 'Sin riesgo',
        eff: (g, ctx) => { const J = MV.jobById(ctx.job); C().hire(g, J, ctx.level, ctx.salary); fx.stat(g, 'happy', 8);
          return `Aceptaste. Empiezas como ${C().title(g.p)} con ${U.money(g.p.job.salary)} al año.`; } },
      { t: (g, ctx) => `Pedir ${U.money(Math.round(ctx.salary * 1.1))}`, sub: 'Casi siempre sale bien',
        eff: (g, ctx) => {
          const J = MV.jobById(ctx.job);
          if (ch(0.8 + g.p.skills.carisma / 500 + MV.sys.world.mods(g).hire)) {
            C().hire(g, J, ctx.level, Math.round(ctx.salary * 1.1)); fx.stat(g, 'happy', 10);
            return `"Nos parece razonable." Empiezas como ${C().title(g.p)} con ${U.money(g.p.job.salary)} al año.`;
          }
          C().hire(g, J, ctx.level, ctx.salary); fx.stat(g, 'happy', 6);
          return `"Es lo que hay." Aceptaste igual: ${U.money(g.p.job.salary)} al año como ${C().title(g.p)}.`;
        } },
      { t: (g, ctx) => `Pedir ${U.money(Math.round(ctx.salary * 1.25))}`, sub: 'Puede salir bien… o pueden retirar la oferta',
        eff: (g, ctx) => {
          const J = MV.jobById(ctx.job);
          if (ch(0.4 + g.p.skills.carisma / 250 + MV.sys.world.mods(g).hire)) {
            C().hire(g, J, ctx.level, Math.round(ctx.salary * 1.25)); fx.stat(g, 'happy', 12);
            return `Negociaste como si te sobrara el trabajo. Funcionó: ${U.money(g.p.job.salary)} al año como ${C().title(g.p)}.`;
          }
          if (U.chance(0.5)) {
            C().hire(g, J, ctx.level, ctx.salary); fx.stat(g, 'happy', 4);
            return `Te dijeron que no, pero la oferta sigue en pie. Aceptaste ${U.money(g.p.job.salary)} al año, con la dignidad un poco abollada.`;
          }
          fx.stat(g, 'happy', -8);
          return 'Recursos Humanos te agradeció "la sinceridad" y retiró la oferta. Contrataron a alguien que pidió menos.';
        } }
    ]
  });

  // ——— Pedir un aumento ———
  const bossRel = (g) => { const B = WP().boss(g); return B ? B.r.rel : 50; };
  const bumpBoss = (g, d) => { const B = WP().boss(g); if (B) B.r.rel = U.clamp(B.r.rel + d, 0, 100); };
  ev({
    id: 'pedir_aumento', manual: true, icon: '💰', scene: 'trabajo', when: fullJob, title: 'Pedir un aumento',
    text: (g) => {
      const B = WP().boss(g);
      return B ? `Entras a la oficina de ${U.gw(B.n.gender, 'tu jefe', 'tu jefa')} ${B.n.first}. Te mira por encima de la pantalla, sin pestañear.` : 'Entras a Recursos Humanos. Huele a café recalentado y a "no".';
    },
    choices: [
      { t: 'Pedir un 5 %', sub: 'Lo más probable es que salga',
        eff: (g) => {
          const job = g.p.job;
          if (ch(0.55 + job.perf / 250 + (bossRel(g) - 50) / 200 + WP().raiseMod(g))) { job.salary = Math.round(job.salary * 1.05); fx.stat(g, 'happy', 4); return `Te dieron el 5 %. Nuevo sueldo: ${U.money(job.salary)} al año.`; }
          bumpBoss(g, -2); return '"Este año no se puede." Lo dijeron con cara de que el año que viene tampoco.';
        } },
      { t: 'Pedir un 15 %', sub: 'Depende de tu rendimiento y de tu jefe',
        eff: (g) => {
          const job = g.p.job;
          if (ch(0.15 + job.perf / 200 + (bossRel(g) - 50) / 150 + WP().raiseMod(g))) { job.salary = Math.round(job.salary * 1.15); fx.stat(g, 'happy', 8); return `¡Aceptaron el 15 %! Nuevo sueldo: ${U.money(job.salary)} al año. Saliste caminando como en cámara lenta.`; }
          bumpBoss(g, -5); fx.stat(g, 'happy', -3); return 'Se rieron. No contigo: de ti. Volviste a tu escritorio con el 0 % y las orejas rojas.';
        } },
      { t: 'Amenazar con irte', sub: 'Todo o nada: +20 % o te muestran la puerta',
        eff: (g) => {
          const job = g.p.job;
          if (ch(0.1 + job.perf / 180 + (bossRel(g) - 50) / 150)) { job.salary = Math.round(job.salary * 1.2); fx.stat(g, 'happy', 10); return `No querían perderte: +20 %. Nuevo sueldo: ${U.money(job.salary)} al año.`; }
          if (U.chance(0.5)) {
            const t = C().title(g.p); C().leave(g, 'renuncia'); fx.stat(g, 'happy', -10);
            return `"Aceptamos tu renuncia." Te fuiste de tu puesto de ${t} con una caja y mucho que pensar.`;
          }
          bumpBoss(g, -15); fx.stat(g, 'stress', 5);
          return 'No te dieron nada y ahora te miran raro en cada reunión. Nadie te acompaña a almorzar.';
        } }
    ]
  });
})(window.MV = window.MV || {});
