/* Mil Vidas — educación: escuela, universidad, técnicas, posgrado, acciones de estudiante. */
(function (MV) {
  'use strict';
  const U = MV.U;
  const E = MV.EDU;
  MV.sys = MV.sys || {};

  const edu = {
    yearsOf(e) {
      if (e.stage === 'universidad') return (E.majors[e.major] || { years: 4 }).years;
      if (e.stage === 'posgrado') return (E.post[e.type] || { years: 2 }).years;
      if (e.stage === 'secundaria' && e.adult) return 3;
      return E.stages[e.stage] ? E.stages[e.stage].years : 4;
    },

    stageName(e) {
      if (!e.stage) return null;
      if (e.stage === 'universidad') return `${E.majors[e.major].name} (universidad)`;
      if (e.stage === 'tecnica') return `${E.tech[e.major].name} (técnica)`;
      if (e.stage === 'posgrado') return `${E.post[e.type].name}`;
      if (e.stage === 'secundaria' && e.adult) return 'Escuela nocturna para adultos';
      return E.stages[e.stage].name;
    },

    studying(p) { return !!p.edu.stage; },
    inHigher(p) { return ['universidad', 'tecnica', 'posgrado'].includes(p.edu.stage); },

    start(g, stage, o) {
      o = o || {};
      const e = g.p.edu;
      e.stage = stage; e.year = 0; e.major = o.major || null; e.type = o.type || null;
      e.payer = o.payer || 'publica'; e.adult = !!o.adult;
      e.perf = U.clamp(Math.round(g.p.stats.smarts * 0.6 + 20), 10, 90);
      e.cost = o.cost || 0;
    },

    yearly(g) {
      const p = g.p, e = p.edu, S = p.stats;
      if (p.age === 3) MV.log(g, U.pick(['Empezaste el jardín de infantes. Mordiste a un compañero el primer día.',
        'Empezaste el jardín. Te hiciste amigo de un niño que come plastilina.', 'Primer día de jardín: lloraste, pero la maestra también.']), '🧸');
      if (p.age === 6 && !e.stage && !e.done.includes('primaria')) {
        edu.start(g, 'primaria');
        MV.log(g, 'Empezaste la escuela primaria. Mochila nueva, miedos nuevos.', '🏫');
        return;
      }
      if (!e.stage) return;
      e.year++;
      const acts = p.yearActs;
      const bonus = (acts.estudiar || 0) * 5 - (acts.faltar || 0) * 7 - (p.addic.drogas > 40 ? 10 : 0);
      e.perf = U.clamp(Math.round(e.perf * 0.5 + (S.smarts * 0.6 + 20 + U.int(-14, 14)) * 0.5 + bonus), 0, 100);
      if (e.year >= edu.yearsOf(e)) { edu.graduate(g); return; }
      if (edu.inHigher(p) && e.perf < 15 && U.chance(0.35)) {
        MV.EV.info(g, { title: 'Expulsión', text: `Te expulsaron de ${edu.stageName(e)} por bajo rendimiento.`, icon: '🚪', scene: 'universidad' });
        e.stage = null; e.dropped = true; MV.fx.stat(g, 'happy', -12);
        return;
      }
      if (!edu.inHigher(p) && e.perf < 20 && U.chance(0.35)) {
        e.year--;
        MV.log(g, 'Repetiste de año. Tus nuevos compañeros te miran como a un abuelo.', '🔁', 'bad');
        MV.fx.stat(g, 'happy', -6);
      }
    },

    graduate(g) {
      const p = g.p, e = p.edu;
      const st = e.stage, grade = MV.grade(e.perf);
      if (!e.done.includes(st)) e.done.push(st);
      e.stage = null;
      if (st === 'primaria') {
        MV.log(g, `Terminaste la primaria con promedio ${grade}. Ahora, la secundaria.`, '🎒', 'good');
        edu.start(g, 'secundaria');
        return;
      }
      if (st === 'secundaria') {
        MV.fx.stat(g, 'happy', 8);
        if (e.adult) {
          MV.EV.info(g, { title: '¡Lo lograste!', text: `Terminaste la secundaria en la escuela nocturna con promedio ${grade}. Nunca es tarde.`, icon: '🎓', scene: 'escuela' });
        } else {
          MV.log(g, `Terminaste la secundaria con promedio ${grade}.`, '🎓', 'good');
          MV.EV.push(g, 'fin_secundaria', { grade, offer: MV.sys.sports.scoutAtGraduation(g) });
        }
        return;
      }
      if (st === 'tecnica') {
        e.degrees.push({ kind: 'tecnica', major: e.major });
        MV.EV.info(g, { title: 'Título técnico', text: `Te recibiste en ${E.tech[e.major].name} con promedio ${grade}.`, icon: E.tech[e.major].icon, scene: 'universidad' });
        MV.fx.stat(g, 'happy', 10);
        return;
      }
      if (st === 'universidad') {
        e.degrees.push({ kind: 'universidad', major: e.major, honors: e.perf >= 85 });
        if (!e.done.includes('universidad')) e.done.push('universidad');
        MV.fx.stat(g, 'happy', 15);
        MV.ach.unlock(g, 'graduado');
        MV.EV.info(g, {
          title: '¡Te recibiste!', icon: '🎓', scene: 'universidad',
          text: `Terminaste ${E.majors[e.major].name} con promedio ${grade}${e.perf >= 85 ? ', con honores' : ''}. Tu familia lloró. Tu cuenta bancaria también.`
        });
        return;
      }
      if (st === 'posgrado') {
        const under = (e.degrees.find((d) => d.kind === 'universidad') || {}).major;
        e.degrees.push({ kind: 'posgrado', type: e.type, major: under });
        if (!e.done.includes('posgrado')) e.done.push('posgrado');
        if (e.type === 'doctorado') MV.ach.unlock(g, 'doctorado');
        MV.fx.stat(g, 'happy', 12);
        MV.fx.stat(g, 'smarts', 5);
        MV.EV.info(g, { title: 'Posgrado terminado', text: `Terminaste tu ${E.post[e.type].name.toLowerCase()}. Ahora puedes corregir a la gente en las cenas familiares.`, icon: '📜', scene: 'universidad' });
      }
    },

    drop(g) {
      const e = g.p.edu;
      const name = edu.stageName(e);
      e.stage = null; e.dropped = true;
      MV.ach.unlock(g, 'abandono');
      return `Abandonaste ${name}. ${U.pick(['Libertad.', 'Tu madre no te habla.', 'Grandes genios también lo hicieron. Algunos.'])}`;
    },

    /** Inscripción a la universidad tras elegir carrera y forma de pago. */
    enrollUni(g, major, payer) {
      const M = E.majors[major];
      edu.start(g, 'universidad', { major, payer, cost: payer === 'publica' || payer === 'beca' ? 0 : M.cost });
      return `Empezaste ${M.name}. ${payer === 'padres' ? 'Tus padres pagan (y te lo van a recordar siempre).' :
        payer === 'prestamo' ? 'Con un préstamo estudiantil que pagarás hasta los 50.' : payer === 'beca' ? '¡Con beca completa!' :
          payer === 'publica' ? 'En la universidad pública, gratis y con paros.' : 'Pagando de tu bolsillo.'}`;
    },

    canEnrollUni(p) { return p.edu.done.includes('secundaria') && !p.edu.stage && !p.prison; },

    /** Opciones de posgrado disponibles (requiere título universitario). */
    postOptions(g) {
      const p = g.p;
      if (p.edu.stage || !MV.hasDegree(p, 'universidad')) return [];
      return Object.keys(E.post).map((k) => {
        const P = E.post[k];
        let why = '';
        if (P.smarts && p.stats.smarts < P.smarts) why = `Inteligencia ${P.smarts}+`;
        if (P.major && !MV.hasDegree(p, 'universidad', P.major)) why = `Título en ${E.majors[P.major].name}`;
        if (p.edu.degrees.some((d) => d.type === k)) why = 'Ya lo tienes';
        return { id: k, icon: P.icon, label: P.name, sub: why || (P.cost ? `${U.money(P.cost)}/año, ${P.years} años` : `Becado, ${P.years} años`), ok: !why };
      });
    },

    enrollPost(g, type) {
      const P = E.post[type], p = g.p;
      const payer = !P.cost ? 'beca' : p.money >= P.cost ? 'propio' : 'prestamo';
      edu.start(g, 'posgrado', { type, payer, cost: P.cost });
      return `Empezaste ${P.name.toLowerCase()}${payer === 'prestamo' ? ' con un préstamo estudiantil' : payer === 'beca' ? ' con beca' : ''}.`;
    },

    /** Escuela nocturna para adultos que no terminaron la secundaria. */
    enrollNight(g) {
      const e = g.p.edu;
      if (!e.done.includes('primaria')) e.done.push('primaria');
      edu.start(g, 'secundaria', { adult: true });
      return 'Te anotaste en la escuela nocturna. Tus compañeros tienen entre 18 y 70 años y todos traen termo.';
    },

    payingParent(g, total) {
      const ps = MV.rels(g, 'padre').filter((x) => x.r.rel >= 40 && x.n.money >= total);
      return ps.length ? ps[0] : null;
    },

    /** Acciones disponibles mientras estudias (pestaña Ocupación). */
    actions(g) {
      const p = g.p, e = p.edu;
      if (!e.stage) return [];
      const higher = edu.inHigher(p);
      const list = [
        { id: 'estudiar', icon: '📚', label: 'Estudiar más', sub: 'Mejora tus notas e inteligencia', limit: 3,
          run: (g) => { MV.fx.stat(g, 'smarts', U.int(1, 3)); MV.fx.stat(g, 'stress', 3); e.perf = U.clamp(e.perf + U.int(3, 8), 0, 100); return U.pick(['Estudiaste hasta tarde. Tu cerebro cruje.', 'Hiciste resúmenes de colores. Sientes que eres otra persona.', 'Te quedaste dormido sobre el libro, pero algo entró por ósmosis.']); } },
        { id: 'faltar', icon: '🛹', label: 'Faltar a clases', sub: 'Más diversión, peores notas', limit: 3,
          run: (g) => {
            MV.fx.stat(g, 'happy', U.int(2, 6)); e.perf = U.clamp(e.perf - U.int(4, 9), 0, 100);
            if (!higher && U.chance(0.35)) { MV.rels(g, 'padre').forEach((x) => { x.r.rel = U.clamp(x.r.rel - 6, 0, 100); }); return 'Faltaste a clases y te descubrieron. En casa hubo un discurso de 40 minutos.'; }
            return U.pick(['Faltaste a clases y fuiste a la plaza. Valió la pena.', 'Te escapaste de clase. El profesor ni lo notó.']);
          } },
        { id: 'profesor', icon: '🧑‍🏫', label: 'Hablar con el profesor', sub: 'Puede ayudar... o no', limit: 1,
          run: (g) => U.pick([
            () => { e.perf = U.clamp(e.perf + 6, 0, 100); return 'El profesor te dio consejos útiles y te tiene más estima.'; },
            () => { MV.fx.stat(g, 'happy', -3); return 'El profesor te habló 30 minutos de su divorcio. No aprendiste nada.'; },
            () => { MV.fx.stat(g, 'smarts', 2); return 'Tuvieron una charla inspiradora. Quieres saber más de todo.'; }
          ])() },
        { id: 'trampa', icon: '📝', label: 'Hacer trampa en un examen', sub: 'Arriesgado', limit: 1,
          run: (g) => {
            if (U.chance(0.55 + p.skills.crimen / 200)) { e.perf = U.clamp(e.perf + 12, 0, 100); MV.fx.stat(g, 'karma', -3); MV.fx.skill(g, 'crimen', 1); return 'Copiaste del de al lado. Sacaste mejor nota que él.'; }
            e.perf = U.clamp(e.perf - 15, 0, 100); MV.fx.stat(g, 'happy', -8);
            return 'Te atraparon con un machete escrito en el brazo. Cero y citación a tus padres.';
          } },
        { id: 'club', icon: '🏅', label: higher ? 'Unirte a un equipo o club' : 'Unirte a un club', sub: 'Deportes y talleres', limit: 1,
          opts: () => Object.keys(MV.SPORTS).map((k) => {
            const S = MV.SPORTS[k];
            return { id: 'sport:' + k, icon: S.icon, label: (higher ? S.club.replace('Equipo', 'Equipo universitario') : S.club), sub: p.club === k ? 'Ya entrenas aquí' : `Deporte. Años de práctica: ${MV.sys.sports.exp(p, k)}${S.clubCost ? `, cuota ${U.money(S.clubCost)}/año` : ''}` };
          }).concat(E.clubs.map((c) => ({ id: c.id, icon: c.icon, label: c.name, sub: MV.SKILLS[c.skill].name }))),
          run: (g, opt) => {
            if (String(opt).startsWith('sport:')) return MV.sys.sports.joinClub(g, String(opt).slice(6));
            const c = E.clubs.find((x) => x.id === opt) || E.clubs[0];
            MV.fx.skill(g, c.skill, U.int(5, 10)); MV.fx.stat(g, c.stat, U.int(2, 5)); MV.fx.stat(g, 'happy', 3);
            if (U.chance(0.35)) {
              const f = MV.newNPC(g, { age: p.age + U.int(-1, 1), country: p.country, money: 0, job: 'Estudiante' });
              MV.addRel(g, f, 'amigo', U.int(50, 75));
              return `Te uniste a ${c.name.toLowerCase()} y te hiciste amigo de ${f.first}.`;
            }
            return `Te uniste a ${c.name.toLowerCase()}. ${U.pick(['Eres sorprendentemente bueno.', 'Eres el peor del grupo, pero el más entusiasta.', 'Te divertiste mucho.'])}`;
          } },
        { id: 'amigos', icon: '🤝', label: 'Hacer amigos', sub: 'Conoce a tus compañeros', limit: 2,
          run: (g) => {
            const chance = 0.35 + p.skills.carisma / 200 + p.stats.looks / 400;
            if (!U.chance(chance)) { MV.fx.stat(g, 'happy', -2); return U.pick(['Intentaste unirte a un grupo y te ignoraron. Duele.', 'Contaste un chiste. Nadie se rió. Silencio absoluto.']); }
            const f = MV.newNPC(g, { age: p.age + U.int(-1, 1), country: p.country, money: 0, job: higher ? 'Estudiante universitario' : 'Estudiante' });
            MV.addRel(g, f, 'amigo', U.int(45, 75));
            MV.fx.skill(g, 'carisma', 2);
            return `Te hiciste amig${f.gender === 'f' ? 'a' : 'o'} de ${f.first}. ${U.pick(['Tienen el mismo humor raro.', 'Comparten la merienda.', 'Se conocieron odiando al mismo profesor.'])}`;
          } }
      ];
      if (p.flags.abuson) list.push({ id: 'abuson', icon: '👊', label: 'Enfrentar al abusón', sub: 'Ya basta', limit: 1,
        run: (g) => {
          if (U.chance(0.35 + p.skills.deporte / 150 + p.stats.health / 400)) { delete p.flags.abuson; MV.fx.stat(g, 'happy', 12); MV.fx.stat(g, 'karma', 2); return 'Le plantaste cara al abusón. Se fue llorando. Eres leyenda en el recreo.'; }
          MV.fx.stat(g, 'health', -U.int(4, 10)); MV.fx.stat(g, 'happy', -8); return 'Enfrentaste al abusón... y perdiste. Te robó la merienda y la dignidad.';
        } });
      if (higher) list.push({ id: 'fiesta_uni', icon: '🍻', label: 'Ir a una fiesta universitaria', sub: '+felicidad, -notas', limit: 2,
        run: (g) => {
          MV.fx.stat(g, 'happy', U.int(4, 9)); MV.fx.addic(g, 'alcohol', 4); e.perf = U.clamp(e.perf - 3, 0, 100);
          if (U.chance(0.25)) { const f = MV.newNPC(g, { age: p.age + U.int(-2, 2), country: p.country, money: 0, job: 'Estudiante universitario' }); MV.addRel(g, f, 'amigo', U.int(40, 70)); return `Fiesta épica. Conociste a ${f.first} bailando sobre una mesa.`; }
          return U.pick(['Fiesta épica. No recuerdas cómo llegaste a casa con un cono de tránsito.', 'La fiesta estuvo aburrida, pero la pizza fría del día siguiente compensó.']);
        } });
      if ((e.stage === 'secundaria' && p.age >= 16) || higher || e.adult) list.push({ id: 'abandonar', icon: '🚪', label: 'Abandonar los estudios', sub: 'Sin vuelta atrás (por ahora)', limit: 1, confirm: '¿Seguro que quieres abandonar?',
        run: (g) => edu.drop(g) });
      return list;
    }
  };
  MV.sys.edu = edu;

  // — Eventos de decisión educativa (manuales: los encolan los sistemas) —
  MV.ev({
    id: 'fin_secundaria', manual: true, prison: 'any', icon: '🎓', scene: 'escuela', title: 'Terminaste la secundaria',
    text: (g, ctx) => {
      let t = `Promedio final: ${ctx.grade || '?'}. Todo el mundo te pregunta qué vas a hacer con tu vida.`;
      if (ctx.offer) { const S = MV.SPORTS[ctx.offer.sport]; t += ` Además, ${S.scout} de ${ctx.offer.club} te vio en ${S.club.toLowerCase()} y te ofrece un contrato profesional de ${U.money(ctx.offer.salary)} al año.`; }
      return t + ' ¿Qué decides?';
    },
    choices: [
      { t: (g, ctx) => `${MV.SPORTS[ctx.offer.sport].icon} Firmar con ${ctx.offer.club}`, when: (g, ctx) => !!ctx.offer, eff: (g, ctx) => MV.sys.sports.sign(g, ctx.offer) },
      { t: '🏅 Universidad con beca deportiva', when: (g, ctx) => !!ctx.offer, eff: (g, ctx) => { MV.EV.push(g, 'elegir_carrera', { becaDep: ctx.offer.sport }, true); return 'Elegiste estudiar y seguir jugando: la universidad te quiere en su equipo.'; } },
      { t: '🎓 Ir a la universidad', eff: (g) => { MV.EV.push(g, 'elegir_carrera', {}, true); return 'Decidiste ir a la universidad.'; } },
      { t: '🔧 Estudiar una carrera técnica', eff: (g) => { MV.EV.push(g, 'elegir_tecnica', {}, true); return 'Decidiste estudiar algo práctico.'; } },
      { t: '💼 Ponerme a trabajar', eff: { happy: 2, msg: 'Decidiste salir a trabajar. Mira las ofertas en la pestaña Ocupación.' } },
      { t: '🌴 Tomarme un año sabático', eff: { happy: 10, stress: -15, flag: 'sabatico', msg: 'Te tomaste un año sabático para "encontrarte". Encontraste el sillón.' } },
      { t: '🎖️ Alistarme en el ejército', when: (g) => g.p.stats.health >= 60 && !g.p.record.length,
        eff: (g) => { MV.sys.career.hire(g, MV.jobById('militar')); return 'Te alistaste en el ejército. Corte de pelo incluido.'; } }
    ]
  });

  MV.ev({
    id: 'elegir_carrera', manual: true, prison: 'any', icon: '📚', scene: 'universidad', title: '¿Qué vas a estudiar?',
    text: (g) => `Tu inteligencia es ${g.p.stats.smarts}. Las carreras exigentes tienen examen de ingreso en la universidad pública.`,
    choices: Object.keys(E.majors).map((k) => ({
      t: `${E.majors[k].icon} ${E.majors[k].name} · ${E.majors[k].years} años`,
      eff: (g, ctx) => { MV.EV.push(g, 'pagar_universidad', { major: k, mname: E.majors[k].name, becaDep: ctx.becaDep || null }, true); return `Elegiste ${E.majors[k].name}.`; }
    })).concat([{ t: '❌ Mejor no', eff: { msg: 'Lo pensaste mejor. La universidad puede esperar.' } }])
  });

  MV.ev({
    id: 'pagar_universidad', manual: true, prison: 'any', icon: '💸', scene: 'universidad', title: '¿Cómo vas a pagar {mname}?',
    text: (g, ctx) => {
      const M = E.majors[ctx.major];
      return `La privada cuesta ${U.money(M.cost)} al año durante ${M.years} años. La pública es gratis pero exige un examen (dificultad ${M.smarts}).`;
    },
    choices: [
      { t: '🏛️ Universidad pública (rendir examen)', when: (g, ctx) => !ctx.failed,
        eff: (g, ctx) => {
          const M = E.majors[ctx.major];
          if (g.p.stats.smarts + U.int(-15, 15) + (g.p.yearActs.estudiar || 0) * 3 >= M.smarts) return edu.enrollUni(g, ctx.major, 'publica');
          MV.EV.push(g, 'pagar_universidad', Object.assign({}, ctx, { failed: true }), true);
          MV.fx.stat(g, 'happy', -6);
          return 'Reprobaste el examen de ingreso. Quedan otras opciones...';
        } },
      { t: '👪 Privada: que paguen mis padres', when: (g, ctx) => !!edu.payingParent(g, E.majors[ctx.major].cost * 2),
        eff: (g, ctx) => edu.enrollUni(g, ctx.major, 'padres') },
      { t: '🏦 Privada: préstamo estudiantil', eff: (g, ctx) => edu.enrollUni(g, ctx.major, 'prestamo') },
      { t: '💵 Privada: pagar con mi dinero', when: (g, ctx) => g.p.money >= E.majors[ctx.major].cost,
        eff: (g, ctx) => edu.enrollUni(g, ctx.major, 'propio') },
      { t: '🏅 Solicitar una beca', when: (g, ctx) => g.p.stats.smarts >= 70 && !ctx.noBeca,
        eff: (g, ctx) => {
          if (U.chance((g.p.stats.smarts - 60) / 45)) return edu.enrollUni(g, ctx.major, 'beca');
          MV.EV.push(g, 'pagar_universidad', Object.assign({}, ctx, { noBeca: true }), true);
          return 'No te dieron la beca. Se la dieron al sobrino del rector.';
        } },
      { t: (g, ctx) => `🏅 Beca deportiva (${MV.SPORTS[ctx.becaDep || g.p.flags.becaOfrecida || g.p.club].name.toLowerCase()})`, when: (g, ctx) => !!ctx.becaDep || !!g.p.flags.becaOfrecida || (!!g.p.club && MV.sys.sports.rating(g, g.p.club) >= 60),
        eff: (g, ctx) => { const sp = ctx.becaDep || g.p.flags.becaOfrecida || g.p.club; delete g.p.flags.becaOfrecida; g.p.club = sp; return edu.enrollUni(g, ctx.major, 'beca').replace('¡Con beca completa!', `¡Con beca deportiva! Jugarás en el equipo de ${MV.SPORTS[sp].name.toLowerCase()} de la universidad.`); } },
      { t: '❌ Olvídalo', eff: { msg: 'Decidiste no estudiar por ahora.' } }
    ]
  });

  MV.ev({
    id: 'elegir_tecnica', manual: true, prison: 'any', icon: '🔧', scene: 'universidad', title: 'Carrera técnica',
    text: 'Dos años, salida laboral rápida. ¿Qué te tienta?',
    choices: Object.keys(E.tech).map((k) => ({
      t: `${E.tech[k].icon} ${E.tech[k].name} · ${U.money(E.tech[k].cost)}/año`,
      eff: (g) => {
        const T = E.tech[k];
        const parent = g.p.age < 23 ? edu.payingParent(g, T.cost * 2) : null;
        edu.start(g, 'tecnica', { major: k, payer: parent ? 'padres' : 'propio', cost: T.cost });
        return `Empezaste ${T.name}.${parent ? ' Tus padres pagan la cuota.' : ''}`;
      }
    })).concat([{ t: '❌ Mejor no', eff: { msg: 'Mejor no.' } }])
  });
})(window.MV = window.MV || {});
