/* Mil Vidas — empresas de producto: estudio de videojuegos, empresa de apps y red social. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};
  const C = () => MV.sys.company;

  MV.STUDIO_SIZES = {
    chico: { name: 'Chico', cost: 50000, years: 1, base: 150000 },
    mediano: { name: 'Mediano', cost: 300000, years: 1, base: 900000 },
    aaa: { name: 'AAA', cost: 3000000, years: 2, base: 12000000 }
  };
  const STAR_MULT = [0.2, 0.5, 1, 2, 4];
  const TAIL = [1, 0.5, 0.25, 0.1];
  const APP_COST = 30000, APP_PRICE = 30, AD_PER_USER = 2, MAX_USERS = 2e9;
  const worldMod = (g) => { const N = MV.sys.world.current(g); return N && N.id === 'auge_tech' ? 1.2 : N && N.id === 'recesion' ? 0.8 : 1; };
  const genreOf = (kind, id) => (MV.WORK_KINDS[kind].genres.find((x) => x.id === id) || MV.WORK_KINDS[kind].genres[0]);
  const mine = (g, cid, type) => { const c = C().get(g, cid); return c && c.type === type ? c : null; };

  const studio = {
    startGame(g, cid, name, genre, size) {
      const c = C().get(g, cid);
      if (!c) return 'Esa empresa ya no es tuya.';
      if (c.type !== 'estudio') return 'Solo un estudio de videojuegos hace juegos.';
      const Z = MV.STUDIO_SIZES[size];
      if (!Z) return 'Ese tamaño de juego no existe.';
      if (c.project) return `${c.name} ya está haciendo "${c.project.name}". Uno por vez.`;
      if (c.cash < Z.cost) return `La caja no alcanza: un juego ${Z.name.toLowerCase()} cuesta ${U.money(Z.cost)}.`;
      c.cash -= Z.cost;
      const Gn = genreOf('juego', genre);
      c.project = { name: MV.sys.works.clean(name) || MV.sys.works.randomTitle('juego'), genre: Gn.id, size, left: Z.years, adj: 0 };
      return `${c.name} empezó a desarrollar "${c.project.name}" (${Gn.name.toLowerCase()}, ${Z.name}). Sale en ${Z.years} año${Z.years === 1 ? '' : 's'}.`;
    },

    newApp(g, cid, name, genre) {
      const c = C().get(g, cid);
      if (!c) return 'Esa empresa ya no es tuya.';
      if (c.type !== 'apps') return 'Solo una empresa de apps hace apps.';
      c.apps = c.apps || [];
      if (c.apps.some((a) => a.age < 0)) return `${c.name} ya está haciendo una app. Una por vez.`;
      if (c.cash < APP_COST) return `La caja no alcanza: una app cuesta ${U.money(APP_COST)}.`;
      c.cash -= APP_COST;
      const Gn = genreOf('app', genre);
      const a = { name: MV.sys.works.clean(name) || MV.sys.works.randomTitle('app'), genre: Gn.id, stars: 0, subs: 0, subsAtLaunch: 0, age: -1 };
      c.apps.push(a);
      return `${c.name} empezó a programar "${a.name}" (${Gn.name.toLowerCase()}). Sale el año que viene.`;
    },

    /** Lanzamiento de un juego: estrellas por equipo, tus habilidades y azar; ventas por estrellas, marketing y el mundo. */
    release(g, c) {
      const p = g.p, pr = c.project, Z = MV.STUDIO_SIZES[pr.size];
      const q = C().power(c, ['programador', 'artista', 'disenador']) * 0.5 + p.skills.programacion * 0.2 + p.skills.arte * 0.1 + U.int(-15, 25) + pr.adj;
      const stars = U.clamp(Math.round(q / 20), 1, 5);
      const launch = Math.round(Z.base * STAR_MULT[stars - 1] * (1 + C().boost(c)) * worldMod(g));
      c.games = (c.games || []).concat([{ name: pr.name, genre: pr.genre, size: pr.size, stars, launch, age: 0 }]).slice(-20);
      c.project = null;
      MV.fx.stat(g, 'fame', stars >= 4 ? U.int(2, 6) : 0);
      MV.EV.info(g, { title: 'Salió tu juego', icon: '🎮', scene: 'trabajo', text: `${c.name} lanzó "${pr.name}". ${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} La crítica: ${U.pick(MV.WORK_REVIEWS[stars])} El primer año vendió ${U.money(launch)}.` });
    },

    revenueStudio(g, c) {
      if (c.project) {
        c.project.left--;
        if (c.project.left <= 0) studio.release(g, c);
        else if (c.project.size === 'aaa' && !g.p.prison && U.chance(0.3)) MV.EV.push(g, 'crunch', { company: c.id });
      }
      let total = 0;
      (c.games || []).forEach((x) => { if (x.age < TAIL.length) total += Math.round(x.launch * TAIL[x.age]); x.age++; });
      return total;
    },

    revenueApps(g, c) {
      const p = g.p;
      let total = 0;
      (c.apps || []).forEach((a) => {
        if (a.age < 0) {
          const q = C().power(c, ['programador', 'disenador']) * 0.6 + p.skills.programacion * 0.2 + U.int(-15, 25);
          a.stars = U.clamp(Math.round(q / 20), 1, 5);
          a.subs = a.subsAtLaunch = 1000 * a.stars * a.stars;
          a.age = 0;
          MV.log(g, `📱 ${c.name} lanzó "${a.name}": ${'★'.repeat(a.stars)}${'☆'.repeat(5 - a.stars)} y ${U.num(a.subs)} suscriptores el primer año.`, '📱');
        }
        total += a.subs * APP_PRICE;
        const growth = 0.3 * a.stars / 5 + C().boost(c) - (0.1 + 0.05 * a.age);
        a.subs = Math.max(0, Math.round(a.subs * (1 + growth)));
        a.age++;
      });
      return total;
    },

    revenueSocial(g, c) {
      if (c.users == null) c.users = 1000;
      const total = c.users * AD_PER_USER;
      const f = 1 + C().power(c, ['programador', 'marketing']) / 100 * 1.5 + C().boost(c) * 2 + U.float(-0.2, 0.3);
      c.users = U.clamp(Math.round(c.users * f), 0, MAX_USERS);
      if (c.users >= 1e8) MV.ach.unlock(g, 'red_social');
      if (!g.p.prison && U.chance(0.15)) MV.EV.push(g, 'social_escandalo', { company: c.id, kind: U.pick(['filtracion', 'moderacion', 'politico']) });
      return total;
    }
  };
  MV.sys.studio = studio;
  C().register('estudio', { init: (c) => { c.games = []; c.project = null; }, revenue: studio.revenueStudio });
  C().register('apps', { init: (c) => { c.apps = []; }, revenue: studio.revenueApps });
  C().register('social', { init: (c) => { c.users = 1000; }, revenue: studio.revenueSocial });

  // — Eventos —
  const gone = 'Esa empresa ya no es tuya. El problema es de otra persona ahora.';
  MV.ev({ id: 'crunch', manual: true, icon: '🔥', scene: 'trabajo', title: 'Crunch',
    text: (g, ctx) => { const c = mine(g, ctx.company, 'estudio'); return c && c.project ? `El juego "${c.project.name}" de ${c.name} viene atrasado. El equipo duerme debajo de los escritorios y huele a pizza fría.` : gone; },
    choices: [
      { t: 'Crunch: todos a trabajar 80 horas', eff: (g, ctx) => { const c = mine(g, ctx.company, 'estudio'); if (!c || !c.project) return gone; c.project.adj += 10; c.staff.forEach((e) => { e.morale = U.clamp(e.morale - 20, 0, 100); }); MV.fx.stat(g, 'karma', -2); return 'Hubo crunch. El juego va a estar más pulido; el equipo, más roto.'; } },
      { t: 'Retrasar el lanzamiento un año', eff: (g, ctx) => { const c = mine(g, ctx.company, 'estudio'); if (!c || !c.project) return gone; const extra = Math.round(MV.STUDIO_SIZES[c.project.size].cost * 0.2); c.project.left += 1; c.project.adj += 5; c.cash -= extra; return `Anunciaste un retraso "para cumplir con la visión". Costó ${U.money(extra)} más. Internet se enojó tres días.`; } },
      { t: 'Lanzar igual', eff: (g, ctx) => { const c = mine(g, ctx.company, 'estudio'); if (!c || !c.project) return gone; c.project.adj -= 10; return 'Lo lanzan igual. Ya prometiste un parche para el día uno.'; } }
    ] });
  const SCANDAL = {
    filtracion: 'se filtraron los datos de millones de usuarios, incluidas sus búsquedas de las 3 de la mañana',
    moderacion: 'los moderadores borraron por error la cuenta de una abuela famosa y ahora hay marchas en su honor',
    politico: 'un político muy conocido te pide "favores" con el algoritmo antes de las elecciones'
  };
  MV.ev({ id: 'social_escandalo', manual: true, icon: '📰', scene: 'trabajo', title: 'Escándalo en tu red social',
    text: (g, ctx) => { const c = mine(g, ctx.company, 'social'); return c ? `En ${c.name} ${SCANDAL[ctx.kind] || SCANDAL.filtracion}.` : gone; },
    choices: [
      { t: 'Pedir perdón en un video con música triste', eff: (g, ctx) => { const c = mine(g, ctx.company, 'social'); if (!c) return gone; c.users = Math.round(c.users * 0.9); MV.fx.stat(g, 'karma', 1); return 'Pediste perdón con cara de cachorro. Perdiste algunos usuarios, pero salvaste la reputación.'; } },
      { t: 'Echarle la culpa a un becario', eff: (g, ctx) => { const c = mine(g, ctx.company, 'social'); if (!c) return gone; MV.fx.stat(g, 'karma', -3); if (U.chance(0.5)) { c.users = Math.round(c.users * 0.75); return 'Nadie te creyó lo del becario. Se fue un cuarto de los usuarios.'; } return 'Le echaste la culpa al becario. Funcionó. El becario no tanto.'; } },
      { t: 'Lanzar un filtro de perritos para distraer', eff: (g, ctx) => { const c = mine(g, ctx.company, 'social'); if (!c) return gone; c.users = Math.round(c.users * 1.05); return 'Lanzaste un filtro de perritos. Todos se olvidaron del escándalo en 48 horas.'; } }
    ] });
})(window.MV = window.MV || {});
