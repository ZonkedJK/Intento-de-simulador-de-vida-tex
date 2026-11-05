/* Mil Vidas — trabajo: requisitos, entrevistas, rendimiento, ascensos, fama, política y mafia. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const career = {
    title(p) {
      if (!p.job) return null;
      const J = MV.jobById(p.job.id);
      return J ? MV.gt(J.titles[Math.min(p.job.level, J.titles.length - 1)], p.gender) : '¿?';
    },

    /** ¿Cumple los requisitos? Devuelve {ok, why[]} */
    meets(g, J) {
      const p = g.p, r = J.req || {}, why = [];
      const lvl = MV.eduLevel(p);
      if (r.age && p.age < r.age) why.push(`Edad mínima ${r.age}`);
      if (r.maxAge && p.age > r.maxAge) why.push(`Edad máxima ${r.maxAge}`);
      if (J.type === 'part' && p.age < 14) why.push('Edad mínima 14');
      if (J.type === 'full' && p.age < 16) why.push('Edad mínima 16');
      const altOk = r.alt ? r.alt(g) : false;
      if (!altOk) {
        if (r.edu && lvl < MV.EDU.order.indexOf(r.edu)) why.push(MV.EDU.names[r.edu]);
        if (r.major && !MV.hasDegree(p, 'universidad', r.major)) why.push('Título en ' + r.major.map((m) => MV.EDU.majors[m].name).join(' o '));
        if (r.tech && !r.tech.some((t) => MV.hasDegree(p, 'tecnica', t))) why.push('Técnica en ' + r.tech.map((t) => MV.EDU.tech[t].name).join(' o '));
        if (r.post && !p.edu.degrees.some((d) => d.kind === 'posgrado')) why.push('Un posgrado');
        if (r.postType && !p.edu.degrees.some((d) => d.type === r.postType)) why.push(MV.EDU.post[r.postType].name);
        if (r.skill) Object.keys(r.skill).forEach((k) => { if (p.skills[k] < r.skill[k]) why.push(`${MV.SKILLS[k].name} ${r.skill[k]}+`); });
        if (r.alt && why.length && J.id === 'cocinero') why.splice(0, why.length, 'Cocina 20+ o técnica en Gastronomía');
      }
      if (r.smarts && p.stats.smarts < r.smarts) why.push(`Inteligencia ${r.smarts}+`);
      if (r.looks && p.stats.looks < r.looks) why.push(`Apariencia ${r.looks}+`);
      if (r.health && p.stats.health < r.health) why.push(`Salud ${r.health}+`);
      if (r.karma && p.karma < r.karma) why.push(`Karma ${r.karma}+`);
      if (r.license && !p.license) why.push('Licencia de conducir');
      if (r.clean && p.record.length) why.push('Sin antecedentes penales');
      return { ok: !why.length, why };
    },

    /** Empieza el proceso de entrevista (evento). */
    apply(g, jobId) {
      const J = MV.jobById(jobId);
      if (!J) return 'Ese trabajo no existe.';
      const m = career.meets(g, J);
      if (!m.ok) return `No cumples los requisitos: ${m.why.join(', ')}.`;
      if (g.p.job && g.p.job.id === J.id) return 'Ya trabajas ahí.';
      MV.EV.push(g, 'entrevista', { job: J.id, q: U.int(0, MV.INTERVIEW.length - 1), order: U.shuffle([0, 1, 2]) }, true);
      return '';
    },

    hire(g, J, level) {
      const p = g.p;
      if (p.job) career.leave(g, 'cambio');
      const lvl = U.clamp(Math.round(level || 0), 0, J.titles.length - 1); // defensa: nunca fuera de la escalera
      p.job = { id: J.id, level: lvl, salary: Math.round(J.pay[lvl] * U.float(0.9, 1.1)), perf: 55, years: 0, lvlYears: 0, type: J.type, start: p.age };
      p.retired = false;
      MV.ach.check(g);
      return p.job;
    },

    leave(g, why) {
      const p = g.p;
      if (!p.job) return;
      p.jobs.push({ id: p.job.id, title: career.title(p), from: p.job.start, to: p.age, why });
      p.job = null;
    },

    fire(g, reason) {
      const t = career.title(g.p);
      career.leave(g, 'despido');
      MV.fx.stat(g, 'happy', -15);
      MV.fx.stat(g, 'stress', 10);
      MV.EV.info(g, { title: 'Despedido', text: `Te despidieron de tu puesto de ${t}. ${reason || ''}`.trim(), icon: '📦', scene: 'trabajo' });
    },

    promote(g) {
      const p = g.p, J = MV.jobById(p.job.id);
      if (p.job.level >= J.titles.length - 1) return false;
      p.job.level++;
      p.job.lvlYears = 0;
      const base = J.pay[p.job.level];
      p.job.salary = Math.max(Math.round(base * U.float(0.92, 1.12)), Math.round(p.job.salary * 1.1));
      p.job.perf = U.clamp(p.job.perf - 15, 30, 100);
      MV.fx.stat(g, 'happy', 10);
      const t = career.title(p);
      if (p.job.id === 'gerente' && p.job.level === J.titles.length - 1) MV.ach.unlock(g, 'ceo');
      if (J.type === 'fame' && p.job.level === J.titles.length - 1 && p.job.id !== 'politico') MV.ach.unlock(g, 'estrella');
      if (p.job.id === 'mafia' && p.job.level === J.titles.length - 1) MV.ach.unlock(g, 'jefe_mafia');
      if (p.job.id === 'politico' && p.job.level === J.titles.length - 1) { MV.ach.unlock(g, 'presidente'); if (p.flags.presidenteEdad == null) p.flags.presidenteEdad = p.age; }
      MV.EV.info(g, { title: '¡Ascenso!', text: `Te ascendieron a ${t}. Nuevo sueldo: ${U.money(p.job.salary)} al año.`, icon: '📈', scene: 'trabajo' });
      return true;
    },

    retire(g) {
      const p = g.p;
      if (!p.job || p.age < 60) return 'Aún no puedes jubilarte.';
      const years = p.age - p.job.start + p.jobs.reduce((a, j) => a + Math.max(0, j.to - j.from), 0);
      const rate = years >= 25 ? 0.65 : years >= 12 ? 0.45 : 0.25;
      p.pension = Math.round(p.job.salary * rate);
      const t = career.title(p);
      career.leave(g, 'jubilación');
      p.retired = true;
      MV.ach.unlock(g, 'jubilado');
      MV.fx.stat(g, 'happy', 12);
      MV.fx.stat(g, 'stress', -25);
      return `Te jubilaste como ${t}. Pensión: ${U.money(p.pension)} al año. Ahora, a ver palomas.`;
    },

    yearly(g) {
      const p = g.p;
      if (p.prison && p.job && p.job.type !== 'crime') {
        career.fire(g, 'Faltar al trabajo por estar en prisión no está bien visto.');
        return;
      }
      if (!p.job) { if (p.fame > 0 && U.chance(0.6)) MV.fx.stat(g, 'fame', -U.int(1, 3)); return; }
      const J = MV.jobById(p.job.id);
      if (!J) { p.job = null; return; }
      const job = p.job;
      job.years++; job.lvlYears++;
      const acts = p.yearActs;
      job.perf = U.clamp(Math.round(job.perf * 0.6 + (p.stats.smarts * 0.4 + 30 + U.int(-12, 12)) * 0.4 +
        (acts.esforzarse || 0) * 4 - (acts.holgazanear || 0) * 6 - (p.addic.alcohol > 50 ? 6 : 0) - (p.addic.drogas > 50 ? 10 : 0)), 0, 100);
      MV.fx.stat(g, 'stress', J.stress || 3);
      if (J.skillUp) MV.fx.skill(g, J.skillUp, U.int(1, 3));
      if (J.type === 'part') {
        if (p.age >= 23 && U.chance(0.15)) MV.log(g, 'Sigues en tu trabajo de medio tiempo. Tu jefe tiene tu edad y lo disfruta.', '😬');
        return;
      }
      if (J.type === 'sport') { MV.sys.sports.careerYearly(g, J); return; }
      if (J.type === 'fame' || J.type === 'crime') { career.yearlySpecial(g, J); return; }
      job.salary = Math.round(job.salary * U.float(1.01, 1.05));
      if (job.perf >= 72 && job.lvlYears >= 2 && job.level < J.titles.length - 1 && U.chance(0.45)) career.promote(g);
      else if (job.perf <= 22 && U.chance(0.4)) career.fire(g, 'Tu rendimiento fue "decepcionante", según el correo de Recursos Humanos.');
      else if (U.chance(MV.sys.world.mods(g).layoff * (job.perf < 60 ? 1.5 : 0.6))) career.fire(g, `Recorte de personal por la crisis: "${MV.sys.world.current(g).title.toLowerCase()}", decía el correo.`);
      if (p.job && p.age >= 72 && U.chance(0.3)) MV.log(g, 'En el trabajo te preguntan "sutilmente" cuándo piensas jubilarte.', '👴');
    },

    yearlySpecial(g, J) {
      const p = g.p, job = p.job;
      const key = J.key(p);
      // Ingresos variables
      job.salary = Math.round(J.pay[job.level] * U.float(0.6, 1.4) * (0.7 + key / 200));
      if (J.type === 'fame') MV.fx.stat(g, 'fame', job.level * 3 + U.int(0, 4));
      if (J.retireAge && p.age >= J.retireAge) {
        const t = career.title(p);
        career.leave(g, 'retiro');
        MV.EV.info(g, { title: 'Retiro', text: `Te retiraste de tu carrera como ${t}. El cuerpo (o la cara) ya no acompaña.`, icon: J.icon, scene: 'trabajo' });
        return;
      }
      if (J.id === 'politico') {
        if (job.years % 4 === 0) MV.EV.push(g, 'eleccion', { job: 'politico', reelect: true });
        return;
      }
      const need = 25 + job.level * 17;
      if (job.lvlYears >= 1 && job.level < J.titles.length - 1 && key >= need && U.chance(0.35 + (key - need) / 150)) career.promote(g);
      else if (key < need - 30 && U.chance(0.2) && J.type === 'fame') {
        career.leave(g, 'fracaso');
        MV.EV.info(g, { title: 'Fin de la fama', text: `Tu carrera en ${J.sector.toLowerCase()} se apagó. Nadie te llama.`, icon: '📉', scene: 'trabajo' });
      }
      if (J.type === 'crime' && p.job) {
        MV.fx.stat(g, 'karma', -U.int(2, 6));
        if (U.chance(0.07 * (1 - p.skills.crimen / 160))) {
          MV.log(g, 'La policía desmanteló una operación de la familia. Te detuvieron.', '🚨', 'bad');
          MV.sys.crime.arrest(g, 'Asociación ilícita', 3);
        }
      }
    },

    /** Acciones del trabajo actual. */
    actions(g) {
      const p = g.p;
      if (!p.job) return [];
      const J = MV.jobById(p.job.id);
      if (J.type === 'sport') return MV.sys.sports.actions(g);
      const job = p.job;
      const list = [
        { id: 'esforzarse', icon: '💪', label: 'Esforzarte más', sub: '+rendimiento, +estrés', limit: 3,
          run: (g) => { job.perf = U.clamp(job.perf + U.int(4, 10), 0, 100); MV.fx.stat(g, 'stress', 4); if (J.skillUp) MV.fx.skill(g, J.skillUp, 1); return U.pick(['Trabajaste horas extra. Tu jefe lo notó (o eso crees).', 'Te quedaste hasta tarde. El guardia ya te saluda por tu nombre.', 'Entregaste todo antes de tiempo. Sospechoso.']); } },
        { id: 'holgazanear', icon: '🛋️', label: 'Holgazanear', sub: '+felicidad, -rendimiento', limit: 3,
          run: (g) => {
            job.perf = U.clamp(job.perf - U.int(5, 10), 0, 100); MV.fx.stat(g, 'happy', 4); MV.fx.stat(g, 'stress', -5);
            if (job.perf < 15 && U.chance(0.4) && J.type === 'full') { career.fire(g, 'Te encontraron durmiendo en el depósito.'); return 'Te despidieron por vago.'; }
            return U.pick(['Pasaste la tarde mirando videos de cabras gritando.', 'Hiciste como que trabajabas moviendo el mouse cada tanto.', 'Fuiste al baño 14 veces. Récord personal.']);
          } }
      ];
      if (J.type === 'full') {
        list.push({ id: 'aumento', icon: '💰', label: 'Pedir un aumento', sub: 'Depende de tu rendimiento', limit: 1,
          run: (g) => {
            if (U.chance(job.perf / 130 + p.skills.carisma / 300)) { const inc = Math.round(job.salary * U.float(0.05, 0.15)); job.salary += inc; MV.fx.stat(g, 'happy', 6); return `¡Te dieron un aumento de ${U.money(inc)} al año!`; }
            job.perf = U.clamp(job.perf - 5, 0, 100); MV.fx.stat(g, 'happy', -4);
            return U.pick(['Tu jefe se rió. Mucho. Demasiado.', 'Te dijeron que "no es buen momento para la empresa". Hace 10 años que no lo es.']);
          } });
        list.push({ id: 'companeros', icon: '☕', label: 'Socializar con compañeros', sub: 'Haz amigos (o enemigos)', limit: 2,
          run: (g) => {
            const c = MV.newNPC(g, { age: U.clamp(p.age + U.int(-8, 8), 18, 70), country: p.country, job: career.title(p) });
            if (U.chance(0.75)) { MV.addRel(g, c, 'companero', U.int(40, 70)); MV.fx.stat(g, 'happy', 3); return `Tomaste café con ${MV.fullName(c)}. ${U.pick(['Odian al mismo jefe. Base sólida.', 'Te contó todos los chismes de la oficina.', 'Resultó ser muy simpátic' + (c.gender === 'f' ? 'a' : 'o') + '.'])}`; }
            MV.addRel(g, c, 'enemigo', U.int(5, 25)); return `Discutiste con ${MV.fullName(c)} por el último café. Ahora es tu enemig${c.gender === 'f' ? 'a' : 'o'} declarad${c.gender === 'f' ? 'a' : 'o'}.`;
          } });
        list.push({ id: 'jefe', icon: '👔', label: 'Hablar con tu jefe', sub: 'Lotería emocional', limit: 1,
          run: (g) => U.pick([
            () => { job.perf = U.clamp(job.perf + 5, 0, 100); return 'Tu jefe te felicitó. Estás en su radar (en el bueno).'; },
            () => { MV.fx.stat(g, 'stress', 5); return 'Tu jefe te dio tres proyectos nuevos "porque eres de confianza".'; },
            () => { MV.fx.stat(g, 'happy', -3); return 'Tu jefe te mostró 200 fotos de su viaje a la playa.'; }
          ])() });
      }
      if (J.type === 'fame' && J.id !== 'politico') list.push({ id: 'promo', icon: '📣', label: 'Promocionarte', sub: '+fama', limit: 2,
        run: (g) => { MV.fx.stat(g, 'fame', U.int(2, 6)); MV.fx.skill(g, 'carisma', 1); return U.pick(['Diste una entrevista en la tele. Hablaste de más.', 'Saliste en una revista. Te photoshoparon hasta ser irreconocible.', 'Hiciste un video viral bailando con tu abuela.']); } });
      if (J.id === 'politico') list.push({ id: 'corrupcion', icon: '🤑', label: 'Aceptar un sobre', sub: 'Dinero fácil, karma difícil', limit: 1,
        run: (g) => {
          const amt = Math.round(job.salary * U.float(0.5, 3));
          MV.fx.money(g, amt); MV.fx.stat(g, 'karma', -10);
          if (U.chance(0.2)) { MV.sys.crime.arrest(g, 'Corrupción', 3); return `Aceptaste ${U.money(amt)} "para la campaña". Un periodista lo filmó todo.`; }
          return `Aceptaste ${U.money(amt)} de un empresario "amigo". Nadie se enteró. Por ahora.`;
        } });
      if (J.id === 'mafia') list.push({ id: 'encargo', icon: '💼', label: 'Hacer un encargo para la familia', sub: 'Sube en la organización', limit: 2,
        run: (g) => {
          MV.fx.skill(g, 'crimen', U.int(2, 4)); MV.fx.stat(g, 'karma', -4);
          if (U.chance(0.15 * (1 - p.skills.crimen / 150))) { MV.sys.crime.arrest(g, 'Extorsión', 3); return 'El encargo salió mal. Sirenas.'; }
          const pay = U.int(2000, 15000) * (job.level + 1); MV.fx.money(g, pay); job.perf = U.clamp(job.perf + 8, 0, 100);
          return U.pick([`"Convenciste" a un comerciante de pagar protección. La familia te dio ${U.money(pay)}.`, `Llevaste un paquete sin preguntar qué había adentro. ${U.money(pay)}.`, `Diste un mensaje "con contundencia". ${U.money(pay)} y una palmada del jefe.`]);
        } });
      list.push({ id: 'renunciar', icon: '🚪', label: 'Renunciar', sub: 'Dejar este trabajo', limit: 1, confirm: '¿Seguro que quieres renunciar?',
        run: (g) => {
          if (J.id === 'mafia' && U.chance(0.4)) { MV.fx.stat(g, 'health', -U.int(15, 35)); career.leave(g, 'renuncia'); return 'De la familia no se renuncia así nomás. Te dieron una paliza de despedida.'; }
          const t = career.title(p); career.leave(g, 'renuncia'); MV.fx.stat(g, 'stress', -10);
          return `Renunciaste a tu puesto de ${t}. ${U.pick(['Saliste con la frente en alto y una abrochadora robada.', 'Le dijiste a tu jefe lo que pensabas. Todo.', 'Mandaste un correo de despedida a toda la empresa con un GIF.'])}`;
        } });
      if (J.type === 'full' && p.age >= 60) list.push({ id: 'jubilarse', icon: '🏖️', label: 'Jubilarte', sub: 'Cobrar pensión', limit: 1, confirm: '¿Jubilarte?', run: (g) => career.retire(g) });
      return list;
    },

    /** Prueba de ingreso a una carrera de fama. */
    audition(g, id) {
      if (id === 'atleta') return MV.sys.sports.tryout(g, g.p.club || 'futbol');
      const J = MV.FAME[id];
      const m = career.meets(g, J);
      if (!m.ok) return `No cumples los requisitos: ${m.why.join(', ')}.`;
      if (id === 'politico') { MV.EV.push(g, 'eleccion', { job: 'politico' }, true); return ''; }
      if (id === 'mafia') {
        if (U.chance(0.4 + g.p.skills.crimen / 120)) { career.hire(g, J); MV.fx.stat(g, 'karma', -8); return 'Te presentaron "a la familia". Te besaron en ambas mejillas. Ya eres parte.'; }
        MV.fx.stat(g, 'health', -U.int(3, 10)); return 'Preguntaste por la mafia en el bar equivocado. Te echaron a patadas.';
      }
      MV.EV.push(g, 'audicion', { job: id }, true);
      return '';
    }
  };
  MV.sys.career = career;

  // — Eventos de trabajo —
  MV.ev({
    id: 'entrevista', manual: true, prison: 'any', icon: '🤝', scene: 'trabajo',
    title: (g, ctx) => `Entrevista: ${MV.gt(MV.jobById(ctx.job).titles[0], g.p.gender)}`,
    text: (g, ctx) => `El entrevistador te mira por encima de los lentes y pregunta: «${MV.INTERVIEW[ctx.q].q}»`,
    choices: [0, 1, 2].map((i) => ({
      t: (g, ctx) => MV.INTERVIEW[ctx.q].a[ctx.order[i]],
      eff: (g, ctx) => {
        const J = MV.jobById(ctx.job), p = g.p;
        const quality = ctx.order[i];
        let chance = 0.45 + (p.stats.smarts - 50) / 250 + (p.stats.looks - 50) / 350 + p.skills.carisma / 400 + [0.25, 0, -0.25][quality];
        if (p.record.length) chance -= 0.15;
        if (p.flags.tatuajeCara) chance -= 0.08;
        if (J.type === 'part') chance += 0.2;
        chance += MV.sys.world.mods(g).hire;
        if (quality === 2 && U.chance(0.1)) chance = 1;
        if (U.chance(U.clamp(chance, 0.05, 0.95))) {
          career.hire(g, J);
          MV.fx.stat(g, 'happy', 10);
          return `¡Te contrataron como ${career.title(p)}! Sueldo: ${U.money(p.job.salary)} al año.`;
        }
        MV.fx.stat(g, 'happy', -5);
        return U.pick(['"Te llamaremos." Nunca llamaron.', 'Eligieron a otro candidato. Tenía un primo en Recursos Humanos.', 'No quedaste. El entrevistador bostezó dos veces.']);
      }
    }))
  });

  const AUD = {
    casting: ['🎭 Monólogo dramático', '😂 Improvisar algo gracioso', '😏 Coquetear con el director', '💵 Sobornar al de casting'],
    demo: ['🎸 Tocar un tema propio', '🎤 Cantar un clásico', '🕺 Bailar mientras cantas', '💵 Pagar por aparecer en la radio'],
    prueba: ['🏃 Darlo todo', '🧠 Jugar con inteligencia', '😤 Provocar al rival', '💵 Sobornar al entrenador']
  };
  MV.ev({
    id: 'audicion', manual: true, prison: 'any', icon: '🌟', scene: 'escenario',
    title: (g, ctx) => `Prueba: ${MV.FAME[ctx.job].sector}`,
    text: (g, ctx) => ({ actor: 'Sala llena de aspirantes con la misma foto de perfil. Te toca.', musico: 'Un productor con lentes de sol bajo techo te escucha.', atleta: 'El cazatalentos anota algo. Esperas que sea bueno.', modelo: 'Te piden caminar en línea recta sin caerte. Fácil, ¿no?' })[ctx.job],
    choices: [0, 1, 2, 3].map((i) => ({
      t: (g, ctx) => (AUD[MV.FAME[ctx.job].audition] || AUD.casting)[i],
      when: (g) => i !== 3 || g.p.money >= 5000,
      eff: (g, ctx) => {
        const J = MV.FAME[ctx.job], p = g.p;
        let ch = J.key(p) / 100 + [0.05, 0.05, -0.05, 0.15][i] - 0.1;
        if (i === 3) { MV.fx.money(g, -5000); MV.fx.stat(g, 'karma', -5); }
        if (i === 2) MV.fx.stat(g, 'karma', -3);
        if (U.chance(U.clamp(ch, 0.05, 0.9))) {
          career.hire(g, J); MV.fx.stat(g, 'fame', U.int(3, 8)); MV.fx.stat(g, 'happy', 12);
          return `¡Lo lograste! Empiezas como ${career.title(p)}.`;
        }
        MV.fx.stat(g, 'happy', -7);
        return U.pick(['Te dijeron que "no tienes el perfil". ¿Qué perfil?', 'No quedaste. Tu madre dice que se lo perdieron ellos.', 'Te rechazaron con una sonrisa falsa y un caramelo.']);
      }
    }))
  });

  MV.ev({
    id: 'eleccion', manual: true, prison: 'any', icon: '🗳️', scene: 'ciudad',
    title: (g, ctx) => ctx.reelect ? 'Año electoral' : 'Te postulas: ' + MV.gt(MV.FAME.politico.titles[0], g.p.gender),
    text: (g, ctx) => ctx.reelect ? `Hay elecciones. Eres ${career.title(g.p)}. ¿Cuál es tu estrategia?` : 'Es tu primera campaña. Tu cara está en carteles junto a un poste de luz. ¿Cómo haces campaña?',
    choices: [
      { t: '📋 Propuestas serias', eff: (g, ctx) => career._election(g, ctx, 0.05, 0) },
      { t: '🎪 Prometer lo imposible', eff: (g, ctx) => career._election(g, ctx, 0.12, -4) },
      { t: '🗞️ Ensuciar al rival', eff: (g, ctx) => career._election(g, ctx, 0.08, -8) },
      { t: '💵 Comprar votos ($50.000)', when: (g) => g.p.money >= 50000, eff: (g, ctx) => { MV.fx.money(g, -50000); return career._election(g, ctx, 0.25, -12, 0.15); } },
      { t: '🙅 No presentarme', when: (g, ctx) => !!ctx.reelect, eff: (g) => { const t = career.title(g.p); career.leave(g, 'retiro'); return `Te retiraste de la política como ${t}. Escribirás memorias aburridísimas.`; } }
    ]
  });
  career._election = function (g, ctx, bonus, karma, scandal) {
    const p = g.p, J = MV.FAME.politico;
    MV.fx.stat(g, 'karma', karma);
    if (scandal && U.chance(scandal)) { if (p.job && p.job.id === 'politico') career.leave(g, 'escándalo'); MV.sys.crime.arrest(g, 'Fraude electoral', 3); return 'Te descubrieron comprando votos. Escándalo nacional.'; }
    const target = ctx.reelect ? Math.min(p.job.level + 1, J.titles.length - 1) : 0;
    const diff = 30 + target * 12;
    const ch = U.clamp(0.5 + (J.key(p) - diff) / 100 + bonus - (ctx.reelect ? 0 : 0.05), 0.08, 0.9);
    if (U.chance(ch)) {
      MV.fx.stat(g, 'fame', U.int(4, 10)); MV.fx.stat(g, 'happy', 12);
      if (!ctx.reelect) { career.hire(g, J); return `¡Ganaste! Eres ${career.title(p)}.`; }
      if (target > p.job.level) { career.promote(g); return `¡Arrasaste en las urnas! Subes a ${career.title(p)}.`; }
      return `Reelegid${U.gw(p.gender, 'o', 'a')} como ${career.title(p)}.`;
    }
    MV.fx.stat(g, 'happy', -12);
    if (ctx.reelect && p.job) { const t = career.title(p); career.leave(g, 'derrota'); return `Perdiste la elección. Ya no eres ${t}.`; }
    return 'Perdiste la elección. Sacaste menos votos que el candidato que era un perro (literalmente).';
  };
})(window.MV = window.MV || {});
