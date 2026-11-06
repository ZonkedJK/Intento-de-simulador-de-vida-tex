/* Mil Vidas — deporte: clubes, nivel, reclutamiento, pruebas, temporadas profesionales y retiro. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const val = (p, k) => (k in p.stats ? p.stats[k] : k in p.skills ? p.skills[k] : p[k] || 0);

  const SAME_LEVEL_CAP = 2;
  const sports = {
    isPro: (p) => !!p.job && p.job.type === 'sport',
    exp: (p, id) => (p.sportsExp && p.sportsExp[id]) || 0,

    /** Nivel deportivo 0-100 en un deporte: estadísticas, años de práctica, país y edad. */
    rating(g, id) {
      const S = MV.SPORTS[id], p = g.p;
      if (!S) return 0;
      let r = 0;
      Object.keys(S.key).forEach((k) => { r += val(p, k) * S.key[k]; });
      const e = sports.exp(p, id);
      r += Math.min(e, 10) * 1.5 - Math.max(0, 3 - e) * 6; // sin práctica en este deporte, se nota
      r += (p.talent && p.talent[id]) || 0;
      if ((MV.COUNTRIES[p.country] || {}).sport === id) r += 4;
      if (p.age > S.retire[0]) r -= (p.age - S.retire[0]) * 4;
      if (p.conds.some((c) => c.id === 'lesion')) r -= 15;
      return U.clamp(Math.round(r), 0, 100);
    },

    title(p, id, level) { return MV.gt(MV.SPORTS[id].titles[level || 0], p.gender); },

    /** Unirse a un club deportivo (cuenta para el máximo de clubes y talleres). */
    joinClub(g, id) { return MV.sys.edu.joinClub(g, 'sport:' + id); },

    /** Primer entrenamiento al entrar a un club. */
    startTraining(g, id) {
      const p = g.p, S = MV.SPORTS[id];
      p.sportsExp = p.sportsExp || {};
      p.sportsExp[id] = p.sportsExp[id] || 0;
      MV.fx.skill(g, S.skill || 'deporte', U.int(2, 4));
      MV.fx.stat(g, 'happy', 3);
      const where = MV.sys.edu.inHigher(p) ? 'el equipo de la universidad' : p.age < 18 ? 'el equipo de la escuela' : U.pick(S.clubs);
      return `Te uniste a ${S.club.toLowerCase()} (${where}). ${S.clubCost && p.age >= 18 ? `Cuota: ${U.money(S.clubCost)} al año.` : ''}`.trim();
    },

    /** Dejar un club deportivo (por defecto, el principal). */
    leaveClub(g, id) {
      const k = id || g.p.club;
      return k ? MV.sys.edu.leaveClub(g, 'sport:' + k) : '';
    },

    /** Deportes en los que entrenas (de tus clubes). */
    clubSports(p) { return MV.sys.edu.clubsOf(p).filter((x) => String(x).startsWith('sport:')).map((x) => String(x).slice(6)).filter((k) => MV.SPORTS[k]); },

    /** Oferta de contrato para un deporte (objeto serializable para los eventos). */
    makeOffer(g, id, level) {
      const S = MV.SPORTS[id];
      const lvl = Math.min(level || 0, S.titles.length - 1);
      return { sport: id, club: U.pick(S.clubs), level: lvl, salary: Math.round(S.pay[lvl] * U.float(0.85, 1.2)) || 0 };
    },

    /** ¿Aparece un cazatalentos al terminar la secundaria? */
    scoutAtGraduation(g) {
      const p = g.p;
      MV.sys.edu.syncClub(g); // p.club = tu mejor deporte
      if (!p.club) return null;
      const S = MV.SPORTS[p.club];
      if (p.age < S.start[0] - 1 || p.age > S.start[1]) return null;
      const r = sports.rating(g, p.club);
      if (r < 48) return null;
      const ch = U.clamp((r - 42) / 50 + ((MV.COUNTRIES[p.country] || {}).sport === p.club ? 0.1 : 0), 0.05, 0.9);
      if (!U.chance(ch)) return null;
      return sports.makeOffer(g, p.club, r >= 88 ? 1 : 0);
    },

    /** Firma un contrato profesional. */
    sign(g, offer) {
      const p = g.p, S = MV.SPORTS[offer.sport], J = MV.SPORT_JOBS['sport_' + offer.sport];
      MV.sys.career.hire(g, J, offer.level || 0);
      p.job.club = offer.club;
      p.job.salary = Math.max(offer.salary || 0, S.pay[offer.level || 0]);
      p.job.perf = 60;
      p.club = offer.sport;
      // Al hacerte profesional dejas los clubes amateurs (los talleres siguen).
      p.clubs = MV.sys.edu.clubsOf(p).filter((c) => !String(c).startsWith('sport:'));
      p.flags.exAtleta = offer.sport;
      p.flags.proSports = Object.assign({}, p.flags.proSports, { [offer.sport]: true });
      MV.fx.stat(g, 'happy', 15);
      MV.fx.stat(g, 'fame', U.int(3, 8));
      MV.ach.unlock(g, 'profesional');
      const team = S.team ? `con ${offer.club}` : `representado por ${offer.club}`;
      return `¡Firmaste tu primer contrato profesional ${team}! Eres ${MV.sys.career.title(p).toLowerCase()} y ganarás ${U.money(p.job.salary)} al año${S.prize ? ' (más premios)' : ''}.`;
    },

    /** Prueba abierta para entrar al deporte profesional. */
    tryout(g, id) {
      const S = MV.SPORTS[id], p = g.p;
      if (!S) return 'Ese deporte no existe.';
      const m = sports.canTryout(g, id);
      if (!m.ok) return `No cumples los requisitos: ${m.why.join(', ')}.`;
      if (sports.isPro(p)) return 'Ya eres deportista profesional.';
      MV.EV.push(g, 'prueba_deportiva', { sport: id, sname: S.name, comeback: !!m.comeback }, true);
      return '';
    },

    /** ¿Puede hacer la prueba? Un exprofesional puede volver aunque supere la edad de inicio. */
    canTryout(g, id) {
      const S = MV.SPORTS[id], p = g.p;
      const m = MV.sys.career.meets(g, MV.SPORT_JOBS['sport_' + id]);
      const wasPro = !!(p.flags.proSports && p.flags.proSports[id]) || p.flags.exAtleta === id;
      if (!m.ok && wasPro && p.age < S.retire[1]) {
        const why = m.why.filter((w) => !/^Edad máxima/.test(w));
        return { ok: !why.length, why, comeback: true };
      }
      return { ok: m.ok, why: m.why, comeback: false };
    },

    /** Ofertas de otros equipos este año (misma categoría con mejor sueldo o la superior si te alcanza el nivel). */
    teamOffers(g) {
      const p = g.p, job = p.job;
      if (!sports.isPro(p)) return [];
      if (job.offersAge === p.age && Array.isArray(job.offers)) return job.offers;
      const J = MV.jobById(job.id), S = MV.SPORTS[J.sport];
      const r = sports.rating(g, J.sport);
      const last = J.titles.length - 1;
      const needNext = 40 + job.level * 15;
      const hurt = p.conds.some((c) => c.id === 'lesion');
      const canNext = job.level < last && !hurt && r >= needNext - 5;
      const clubs = U.shuffle(S.clubs.filter((c) => c !== job.club));
      const n = Math.min(U.int(3, 4), Math.max(1, clubs.length));
      const offers = [];
      for (let i = 0; i < n; i++) {
        const up = canNext && U.chance(U.clamp(0.3 + (r - needNext) / 60, 0.15, 0.85));
        const level = up ? job.level + 1 : job.level;
        // En la misma categoría se mejora el sueldo, pero hasta el doble de lo que paga esa categoría.
        const salary = up ? Math.round(J.pay[level] * U.float(0.85, 1.15)) : Math.round(Math.min(Math.max(job.salary, J.pay[level]) * U.float(1.05, 1.35), J.pay[level] * SAME_LEVEL_CAP));
        if (!up && salary <= job.salary) continue;
        offers.push({ sport: J.sport, club: clubs[i] || job.club, level, salary });
      }
      job.offersAge = p.age;
      job.offers = offers;
      return offers;
    },

    /** Firma con otro equipo, escudería o patrocinador. */
    joinTeam(g, offer) {
      const p = g.p, job = p.job;
      if (!sports.isPro(p) || !offer) return 'No tienes ofertas.';
      const J = MV.jobById(job.id), S = MV.SPORTS[J.sport];
      const up = offer.level > job.level;
      const prev = job.club;
      job.club = offer.club;
      job.level = U.clamp(offer.level, 0, J.titles.length - 1);
      job.salary = Math.max(offer.salary, up ? J.pay[job.level] : 0);
      job.offers = null;
      if (up) { job.lvlYears = 0; job.perf = U.clamp(job.perf - 5, 30, 100); }
      if (S.team && U.chance(0.4)) job.abroad = true;
      const t = MV.sys.career.title(p);
      if (job.level === J.titles.length - 1) { MV.ach.unlock(g, 'leyenda'); if (['tenis', 'golf'].includes(J.sport)) MV.ach.unlock(g, 'numero_uno'); }
      if (S.team && job.salary >= 10000000) MV.ach.unlock(g, 'traspaso');
      MV.fx.stat(g, 'happy', up ? 10 : 4);
      MV.fx.stat(g, 'fame', up ? U.int(3, 7) : 1);
      const who = S.team ? `Dejaste ${prev || 'tu club'} y firmaste con ${offer.club}` : `Ahora te representa ${offer.club}`;
      return `${who}. ${up ? `¡Subiste de categoría! Ahora eres ${t.toLowerCase()}.` : `Sigues como ${t.toLowerCase()}, pero mejor pagad${U.gw(p.gender, 'o', 'a')}.`} ${S.prize ? 'Tus premios ahora apuntan más alto.' : `Contrato: ${U.money(job.salary)} al año.`}`;
    },

    /** Entrenamiento en el club y reclutadores universitarios (cada año). */
    yearly(g) {
      const p = g.p;
      p.sportsExp = p.sportsExp || {};
      if (p.prison || sports.isPro(p)) return;
      sports.clubSports(p).forEach((k) => {
        const S = MV.SPORTS[k];
        if (p.age >= 18 && !MV.sys.edu.inHigher(p)) MV.fx.money(g, -(S.clubCost || 300));
        else if (S.clubCost && p.age < 18) {
          const parent = MV.rels(g, 'padre').find((x) => x.n.money >= S.clubCost);
          if (parent) parent.n.money -= S.clubCost; else { MV.log(g, `Tus padres ya no pueden pagar ${S.club.toLowerCase()}. Lo dejaste.`, S.icon, 'bad'); MV.sys.edu.leaveClub(g, 'sport:' + k); return; }
        }
        p.sportsExp[k] = (p.sportsExp[k] || 0) + 1;
        MV.fx.skill(g, S.skill || 'deporte', U.int(1, 3));
        if (k !== 'esports') MV.fx.stat(g, 'health', 1);
        if (S.team) MV.fx.skill(g, 'carisma', 1);
      });
      MV.sys.edu.syncClub(g);
      if (!p.club) return;
      const S = MV.SPORTS[p.club];
      // Reclutadores en la universidad
      if (MV.sys.edu.inHigher(p) && p.age >= S.start[0] && p.age <= S.start[1]) {
        const r = sports.rating(g, p.club);
        if (r >= 55 && U.chance(0.15 + (r - 55) / 110)) MV.EV.push(g, 'reclutamiento', Object.assign(sports.makeOffer(g, p.club, r >= 85 ? 1 : 0), { uni: true }));
      }
    },

    /** Temporada de un deportista profesional (lo llama career.yearly). */
    careerYearly(g, J) {
      const p = g.p, job = p.job, S = MV.SPORTS[J.sport];
      p.sportsExp[J.sport] = (p.sportsExp[J.sport] || 0) + 1;
      const r = sports.rating(g, J.sport);
      job.perf = U.clamp(Math.round(job.perf * 0.5 + r * 0.5 + U.int(-8, 8) + (p.yearActs.entrenar || 0) * 3), 0, 100);
      if (S.prize) job.salary = Math.round(J.pay[job.level] * U.float(0.5, 1.4) * (0.6 + r / 250));
      else job.salary = Math.round(job.salary * U.float(1, 1.06));
      MV.fx.stat(g, 'fame', job.level * 3 + U.int(0, 3));
      MV.fx.skill(g, 'carisma', S.team ? U.int(1, 3) : U.int(0, 2));
      if (job.abroad) MV.fx.skill(g, 'idiomas', 2);
      // Patrocinios
      if (p.fame >= 35) {
        const s = Math.round(p.fame * 1500 * (job.level + 1) * U.float(0.5, 1.5));
        MV.fx.money(g, s);
        MV.log(g, `Patrocinios del año: ${U.money(s)}.`, '👟', 'good');
      }
      // Lesiones
      if (U.chance(S.injury * (1.4 - p.stats.health / 150))) {
        MV.sys.health.add(g, 'lesion');
        job.perf = U.clamp(job.perf - 15, 0, 100);
        if (U.chance(0.15)) {
          MV.fx.stat(g, 'health', -U.int(8, 18));
          if (p.age >= S.retire[0] - 4) { sports.retire(g, 'Una lesión grave terminó tu carrera antes de tiempo.'); return; }
          MV.EV.info(g, { title: 'Lesión grave', text: 'Te rompiste los ligamentos en pleno partido. Meses de recuperación por delante.', icon: '🩼', scene: 'hospital' });
        }
      }
      // Título de la temporada
      if (job.level >= 1 && U.chance(0.1 + r / 600 + job.level * 0.03)) {
        const tr = U.pick(S.trophies);
        const bonus = Math.round(job.salary * 0.2) + 5000;
        MV.fx.money(g, bonus); MV.fx.stat(g, 'fame', 6); MV.fx.stat(g, 'happy', 10);
        MV.ach.unlock(g, 'campeon');
        if (/oro olímpico/.test(tr)) MV.ach.unlock(g, 'oro');
        MV.EV.info(g, { title: '¡Campeón!', text: `${S.team ? `Tu equipo, ${job.club || 'el club'}, ganó` : 'Ganaste'} ${tr}. Premio: ${U.money(bonus)}. Te tiraron al aire en la celebración (y no te atraparon del todo).`, icon: '🏆', scene: 'escenario' });
      }
      // Ascenso o traspaso
      // Cada escalón es más competitivo: llegar a la cima es para pocos.
      const need = 40 + job.level * 15;
      const last = J.titles.length - 1;
      const ch = U.clamp(0.2 + (r - need) / 150, 0.05, 0.6) * (job.level >= last - 2 ? 0.45 : 1) * (job.level === last - 1 ? 0.7 : 1);
      if (job.lvlYears >= 1 && job.level < J.titles.length - 1 && r >= need && U.chance(ch)) sports.promote(g, J);
      // Retiro
      if (p.age >= S.retire[1] || (p.age >= S.retire[0] && U.chance(0.18 + (p.age - S.retire[0]) * 0.08)) || (r < 15 && U.chance(0.3))) {
        sports.retire(g);
        return;
      }
      if (job.perf < 20 && U.chance(0.3)) {
        const t = MV.sys.career.title(p);
        MV.sys.career.leave(g, 'sin contrato');
        MV.EV.info(g, { title: 'Sin contrato', text: `No te renovaron el contrato como ${t.toLowerCase()}. Puedes intentarlo en otra prueba.`, icon: '📉', scene: 'trabajo' });
      }
    },

    promote(g, J) {
      const p = g.p, job = p.job, S = MV.SPORTS[J.sport];
      job.level++; job.lvlYears = 0;
      const base = J.pay[job.level];
      job.salary = Math.max(Math.round(base * U.float(0.9, 1.2)), Math.round(job.salary * 1.2));
      const t = MV.sys.career.title(p);
      let text;
      if (S.team) {
        const prev = job.club;
        job.club = U.pick(S.clubs.filter((c) => c !== prev)) || prev;
        if (job.level >= 2 && U.chance(0.5)) job.abroad = true;
        text = `${job.club} pagó tu traspaso${job.abroad ? ' al extranjero' : ''}. Ahora eres ${t.toLowerCase()} y cobras ${U.money(job.salary)} al año.`;
        if (job.salary >= 10000000) MV.ach.unlock(g, 'traspaso');
      } else text = `Subiste a ${t.toLowerCase()}. ${S.prize ? 'Los premios ahora tienen más ceros.' : `Nuevo ingreso: ${U.money(job.salary)} al año.`}`;
      if (job.level === J.titles.length - 1) {
        MV.ach.unlock(g, 'leyenda');
        if (['tenis', 'golf'].includes(J.sport)) MV.ach.unlock(g, 'numero_uno');
      }
      MV.fx.stat(g, 'happy', 10);
      MV.EV.info(g, { title: S.team ? '¡Fichaje!' : '¡Subiste de nivel!', text, icon: S.icon, scene: 'escenario' });
    },

    retire(g, reason) {
      const p = g.p, J = MV.jobById(p.job.id), S = MV.SPORTS[J.sport];
      const t = MV.sys.career.title(p), lvl = p.job.level;
      MV.sys.career.leave(g, 'retiro');
      p.flags.exAtleta = J.sport;
      p.club = null; p.clubs = MV.sys.edu.clubsOf(p).filter((c) => !String(c).startsWith('sport:'));
      MV.fx.stat(g, 'happy', lvl >= 2 ? 6 : -4);
      const homage = lvl >= 3 ? ' El estadio entero te despidió de pie y retiraron tu número.' : lvl >= 2 ? ' Te hicieron un homenaje emotivo.' : '';
      MV.EV.info(g, { title: 'Retiro', text: `${reason || `Te retiraste del ${S.name.toLowerCase()} profesional.`} Terminaste tu carrera como ${t.toLowerCase()}.${homage}`, icon: S.icon, scene: 'escenario' });
      MV.EV.later(g, 'oferta_post_retiro', 1);
    },

    /** Acciones del deportista profesional (pestaña Ocupación). */
    actions(g) {
      const p = g.p, job = p.job, J = MV.jobById(job.id), S = MV.SPORTS[J.sport];
      const list = [
        { id: 'entrenar', icon: '🏋️', label: 'Entrenar a fondo', sub: '+rendimiento, riesgo de lesión', limit: 3,
          run: (g) => { job.perf = U.clamp(job.perf + U.int(4, 9), 0, 100); MV.fx.skill(g, S.skill || 'deporte', U.int(1, 3)); MV.fx.stat(g, 'stress', 3); if (p.club !== 'esports') MV.fx.stat(g, 'health', 1);
            if (U.chance(0.04)) { MV.sys.health.add(g, 'lesion'); return 'Entrenaste tan fuerte que te lesionaste. El fisioterapeuta suspiró.'; }
            return U.pick(['Entrenaste en doble turno. Te duelen músculos que no sabías que tenías.', 'Repetiste la misma jugada 300 veces. Ahora te sale dormido.', 'El preparador físico te hizo correr bajo la lluvia. Sientes que estás en una película.']); } },
        { id: 'entrevista', icon: '🎙️', label: 'Dar una entrevista', sub: '+carisma, +fama', limit: 2,
          run: (g) => { MV.fx.skill(g, 'carisma', U.int(2, 3)); MV.fx.stat(g, 'fame', U.int(1, 4));
            if (U.chance(0.15)) { MV.fx.stat(g, 'fame', 3); MV.fx.stat(g, 'karma', -2); return 'Dijiste algo polémico sobre el árbitro. Eres tendencia por las razones equivocadas.'; }
            return U.pick(['Dijiste "el partido dura 90 minutos" con mucha convicción. Los periodistas lo anotaron.', 'Diste una entrevista sincera y emocionante. Tu madre la compartió 40 veces.', 'Respondiste en otro idioma para practicar. Nadie entendió, pero sonó elegante.']); } },
        { id: 'fans', icon: '✍️', label: 'Firmar autógrafos', sub: '+carisma, +felicidad', limit: 1,
          run: (g) => { MV.fx.skill(g, 'carisma', 2); MV.fx.stat(g, 'happy', 3); MV.fx.stat(g, 'karma', 1); p.followers += U.int(200, 3000) * (job.level + 1); return U.pick(['Firmaste camisetas durante dos horas. Un niño lloró de emoción.', 'Te sacaste fotos con todos. Uno te pidió que firmaras su yeso.']); } }
      ];
      if (S.team) {
        list.push({ id: 'vestuario', icon: '🍖', label: 'Unir al plantel', sub: '+carisma, +rendimiento', limit: 1,
          run: (g) => { MV.fx.skill(g, 'carisma', 3); job.perf = U.clamp(job.perf + 3, 0, 100); return 'Organizaste un asado con el plantel. Hubo discursos, abrazos y un karaoke desafinado.'; } });
        list.push({ id: 'renovar', icon: '📝', label: 'Negociar el contrato', sub: 'Pide más dinero (carisma)', limit: 1,
          run: (g) => {
            if (U.chance(p.skills.carisma / 130 + job.perf / 220)) { const inc = Math.round(job.salary * U.float(0.1, 0.3)); job.salary += inc; return `Tu representante y tu carisma lograron ${U.money(inc)} más al año.`; }
            job.perf = U.clamp(job.perf - 3, 0, 100); return 'El club no aceptó. El presidente dijo que "primero hay que ganar algo".';
          } });
      }
      list.push({ id: 'buscar_equipo', icon: '🔎', label: S.team ? 'Buscar un equipo mejor' : J.sport === 'automovilismo' ? 'Buscar una escudería mejor' : 'Buscar un patrocinador mejor', sub: 'Mejor sueldo o subir de categoría', limit: 1,
        opts: (g) => {
          const hurtNote = g.p.conds.some((c) => c.id === 'lesion') && job.level < J.titles.length - 1 ? '. Con la lesión, nadie te ofrece subir de categoría' : '';
          const offers = sports.teamOffers(g);
          if (!offers.length) return [{ id: 'nadie', icon: '🤷', label: 'Nadie te ofrece más', sub: `Ya cobras lo máximo para tu categoría${hurtNote}` }];
          return offers.map((o, i) => ({ id: i, icon: o.level > job.level ? '⬆️' : '💰', label: `${U.cap(o.club)}: ${sports.title(g.p, o.sport, o.level)}`,
            sub: `${S.prize ? 'Premios estimados' : 'Sueldo'}: ${U.money(o.salary)} al año${o.level > job.level ? '. Sube de categoría' : ''}${hurtNote}` }));
        },
        run: (g, i) => { const o = sports.teamOffers(g)[+i]; return o ? sports.joinTeam(g, o) : 'Decidiste quedarte donde estás.'; } });
      list.push({ id: 'fiesta_equipo', icon: '🪩', label: 'Salir de fiesta', sub: '+felicidad, -rendimiento', limit: 1,
        run: (g) => { MV.fx.stat(g, 'happy', 6); MV.fx.addic(g, 'alcohol', 4); job.perf = U.clamp(job.perf - 6, 0, 100);
          if (U.chance(0.25)) { MV.fx.stat(g, 'fame', 3); return 'Te fotografiaron saliendo de una discoteca a las 6 a.m. antes de un partido. Portada de todos los diarios.'; }
          return 'Saliste con tus compañeros. Nadie se enteró. Milagro.'; } });
      list.push({ id: 'retirarse', icon: '🏁', label: 'Retirarte', sub: 'Colgar las botas', limit: 1, confirm: '¿Seguro que quieres retirarte?',
        run: (g) => { sports.retire(g, 'Decidiste retirarte por tu cuenta.'); return ''; } });
      return list;
    }
  };
  MV.sys.sports = sports;

  // — Eventos manuales del deporte —
  MV.ev({
    id: 'reclutamiento', manual: true, icon: '🔭', scene: 'escenario',
    title: (g, ctx) => (MV.SPORTS[ctx.sport].draft ? '¡El draft!' : 'Una oferta profesional'),
    text: (g, ctx) => {
      const S = MV.SPORTS[ctx.sport];
      const t = sports.title(g.p, ctx.sport, ctx.level).toLowerCase();
      if (S.draft) return `Los ${ctx.club} te eligieron en el draft de la Liga Norteamericana. Te ofrecen un contrato de ${U.money(ctx.salary)} al año como ${t}.`;
      return `${U.cap(S.scout)} de ${ctx.club} te vio jugar ${S.team ? 'con tu equipo' : 'en un torneo'} y te ofrece ${U.money(ctx.salary)} al año como ${t}.`;
    },
    choices: [
      { t: (g, ctx) => (ctx.uni ? '✍️ Firmar y dejar la universidad' : '✍️ Firmar el contrato'), eff: (g, ctx) => { if (ctx.uni && g.p.edu.stage) { g.p.edu.stage = null; g.p.edu.dropped = true; } return sports.sign(g, ctx); } },
      { t: '🎓 Firmar y seguir estudiando a distancia', when: (g, ctx) => !!ctx.uni, eff: (g, ctx) => { MV.fx.stat(g, 'stress', 12); g.p.edu.perf = U.clamp(g.p.edu.perf - 15, 0, 100); return sports.sign(g, ctx) + ' Estudiarás en los viajes del equipo.'; } },
      { t: '💬 Pedir más dinero', eff: (g, ctx) => {
        if (U.chance(0.3 + g.p.skills.carisma / 160)) { const o = Object.assign({}, ctx, { salary: Math.round(ctx.salary * U.float(1.2, 1.5)) }); MV.fx.skill(g, 'carisma', 2); if (o.uni && g.p.edu.stage) { g.p.edu.stage = null; g.p.edu.dropped = true; } return 'Negociaste como un tiburón. ' + sports.sign(g, o); }
        if (U.chance(0.4)) return `${ctx.club} retiró la oferta: "hay otros jugadores más baratos".`;
        if (ctx.uni && g.p.edu.stage) { g.p.edu.stage = null; g.p.edu.dropped = true; }
        return 'No subieron la oferta, pero firmaste igual. ' + sports.sign(g, ctx);
      } },
      { t: '❌ Rechazar la oferta', eff: { happy: -3, msg: 'Rechazaste la oferta. Quizás haya otra... o quizás no.' } }
    ]
  });

  MV.ev({
    id: 'prueba_deportiva', manual: true, icon: '🏟️', scene: 'escenario', title: 'Prueba de {sname}',
    text: (g, ctx) => `Hay 80 aspirantes y solo dos lugares. Tu nivel en ${MV.SPORTS[ctx.sport].name.toLowerCase()}: ${sports.rating(g, ctx.sport)}/100. ¿Cómo encaras la prueba?`,
    choices: [
      { t: '🔥 Darlo todo', eff: (g, ctx) => sports._tryout(g, ctx, 0.05, U.chance(0.05)) },
      { t: '🧠 Jugar con inteligencia', eff: (g, ctx) => sports._tryout(g, ctx, g.p.stats.smarts / 600) },
      { t: '😤 Provocar a los rivales', eff: (g, ctx) => { MV.fx.stat(g, 'karma', -2); return sports._tryout(g, ctx, g.p.skills.carisma / 500 - 0.05); } },
      { t: '💵 Pagarle al entrenador ($5.000)', when: (g) => g.p.money >= 5000, eff: (g, ctx) => { MV.fx.money(g, -5000); MV.fx.stat(g, 'karma', -5); return sports._tryout(g, ctx, 0.15); } }
    ]
  });
  sports._tryout = function (g, ctx, bonus, hurt) {
    if (hurt) { MV.sys.health.add(g, 'lesion'); return 'Te lesionaste en plena prueba. Saliste en camilla, aplaudido por todos.'; }
    const r = sports.rating(g, ctx.sport);
    if (U.chance(U.clamp((r - 35) / 60 + bonus, 0.03, 0.92))) {
      const msg = sports.sign(g, sports.makeOffer(g, ctx.sport, ctx.comeback || r >= 90 ? 1 : 0));
      return ctx.comeback ? '¡Volviste del retiro! ' + msg.replace('tu primer contrato profesional', 'un nuevo contrato') : msg;
    }
    MV.fx.stat(g, 'happy', -6);
    MV.fx.skill(g, MV.SPORTS[ctx.sport].skill || 'deporte', 1);
    return U.pick(['No quedaste. El entrenador dijo "seguí entrenando, pibe" sin mirarte.', 'Quedaste tercero. Solo había dos lugares.', 'Te dijeron que "te falta un poquito". Un poquito bastante grande.']);
  };
})(window.MV = window.MV || {});
