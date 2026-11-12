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

  // ——— Decisiones laborales (solo trabajo de tiempo completo con jefe) ———
  const inOffice = (g) => fullJob(g) && !!WP().boss(g);
  const boss = (g) => WP().boss(g);
  const elJefe = (g) => { const B = boss(g); return `${U.gw(B.n.gender, 'Tu jefe', 'Tu jefa')} ${B.n.first}`; };
  const mate = (g, role) => WP().mate(g, role);
  const mateOf = (g, roles) => { for (const r of roles) { const m = mate(g, r); if (m) return m; } return null; };
  const allMates = (g) => (g.p.job.mates || []).map((m) => ({ m, r: MV.relOf(g, m.id), n: MV.person(g, m.id) })).filter((x) => x.r && x.n && x.n.alive);
  const bumpMates = (g, d) => allMates(g).forEach((x) => { x.r.rel = U.clamp(x.r.rel + d, 0, 100); });
  const dropMate = (g, id) => { g.p.job.mates = (g.p.job.mates || []).filter((m) => m.id !== id); };
  const perf = (g, d) => { g.p.job.perf = U.clamp(g.p.job.perf + d, 0, 100); };
  const romanceMate = (g) => { const x = mateOf(g, ['aliado', 'chismoso']); return x && x.n.age >= 18 && g.p.age >= 18 && x.r.type === 'companero' ? x : null; };

  ev({ id: 'trabajo_maquillar', when: inOffice, icon: '🧮', scene: 'trabajo', title: 'Números creativos',
    text: (g) => `${elJefe(g)} te pide "ajustar" las cifras del trimestre antes de la auditoría. "Es solo maquillaje", dice.`,
    choices: [
      { t: 'Hacerlo', sub: 'Bono ahora, riesgo después',
        eff: (g) => { const job = g.p.job, b = Math.round(job.salary * 0.1); fx.money(g, b); fx.stat(g, 'karma', -6); job.cooked = g.p.age;
          return `Moviste unas comas y desapareció un agujero. Bono "por compromiso": ${U.money(b)}.`; } },
      { t: 'Negarte', sub: 'Tu jefe no lo va a olvidar',
        eff: (g) => { bumpBoss(g, -15); fx.stat(g, 'karma', 2); return 'Dijiste que no. El silencio en la oficina se pudo cortar con una abrochadora.'; } },
      { t: 'Denunciarlo', sub: 'Héroe o despedido',
        eff: (g) => {
          fx.stat(g, 'karma', 8);
          if (U.chance(0.5)) { const old = boss(g).n.first; fx.stat(g, 'fame', 3); const B = WP().newBoss(g, false);
            return `Denunciaste el fraude. ${old} se fue escoltado por seguridad y ahora ${U.gw(B.n.gender, 'tu jefe', 'tu jefa')} es ${MV.fullName(B.n)}. Te dicen "el honesto" (no siempre como elogio).`; }
          C().fire(g, 'Una "reestructuración" justo después de tu denuncia. Qué casualidad.');
          return 'Denunciaste el fraude. A la semana te avisaron que tu puesto "ya no era necesario".';
        } }
    ] });

  ev({ id: 'trabajo_huelga', when: inOffice, icon: '✊', scene: 'trabajo', title: 'Huelga',
    text: 'El sindicato llama a huelga por mejores sueldos. Tus compañeros te miran esperando tu respuesta.',
    choices: [
      { t: 'Sumarte', sub: 'Pierdes el 10 % del sueldo de este año',
        eff: (g) => { const job = g.p.job; fx.money(g, -Math.round(job.salary * 0.1)); bumpMates(g, 10);
          if (U.chance(0.6)) { job.salary = Math.round(job.salary * 1.08); return `La huelga funcionó: +8 % para todos. Nuevo sueldo: ${U.money(job.salary)} al año.`; }
          return 'Marchaste, cantaste y te quemaste con el sol. La empresa no cedió, pero tus compañeros te quieren más.'; } },
      { t: 'Cruzar el piquete', sub: 'Tu jefe te lo agradece; tus compañeros, no',
        eff: (g) => { bumpBoss(g, 10); bumpMates(g, -15); fx.stat(g, 'karma', -2); return 'Entraste a trabajar mientras afuera gritaban tu nombre. No eran elogios.'; } },
      { t: 'Quedarte en casa', sub: 'Ni una cosa ni la otra',
        eff: (g) => { fx.stat(g, 'happy', 3); perf(g, -5); return 'Te quedaste en casa "por las dudas". Viste tres temporadas de una serie.'; } }
    ] });

  ev({ id: 'trabajo_traslado', when: inOffice, icon: '✈️', scene: 'trabajo', title: 'Traslado al exterior',
    text: (g) => `${elJefe(g)} te ofrece trasladarte a la oficina de otro país con un 30 % más de sueldo.`,
    choices: [
      { t: 'Aceptar', sub: 'Otro país, jefe y compañeros nuevos, +30 %', eff: (g) => WP().move(g) },
      { t: 'Rechazar', sub: 'Te quedas donde estás', eff: (g) => { bumpBoss(g, -5); return 'Dijiste que no. Tu jefe dijo "qué lástima" con cara de anotar algo.'; } }
    ] });

  ev({ id: 'trabajo_romance', when: (g) => inOffice(g) && !!romanceMate(g), icon: '💘', scene: 'trabajo', title: 'Química en la oficina',
    text: (g) => { const x = romanceMate(g); return `${x.n.first}, de tu equipo, te deja cafés en el escritorio y se ríe de todos tus chistes. Hasta de los malos.`; },
    choices: [
      { t: 'Salir', sub: 'Recursos Humanos podría enterarse',
        eff: (g) => { const x = romanceMate(g), busy = !!MV.partner(g);
          MV.addRel(g, x.n, busy ? 'amante' : 'pareja', Math.max(x.r.rel, 65));
          let msg = busy ? `Empezaste algo a escondidas con ${x.n.first}. Ahora tienes un secreto y dos agendas.` : `Saliste con ${x.n.first}. Ahora almuerzan juntos y nadie en la oficina finge sorpresa.`;
          if (U.chance(0.25)) { perf(g, -10); fx.stat(g, 'stress', 5); msg += ' Recursos Humanos los citó a una charla incómoda sobre "límites".'; }
          return msg; } },
      { t: 'Rechazar con amabilidad', sub: 'Algo incómodo, nada más',
        eff: (g) => { const x = romanceMate(g); x.r.rel = U.clamp(x.r.rel - 5, 0, 100); return `Le dijiste a ${x.n.first} que prefieres no mezclar. Los cafés siguieron llegando, pero sin corazón en la espuma.`; } },
      { t: 'Contárselo a todos', sub: 'Chisme garantizado, enemigo también',
        eff: (g) => { const x = romanceMate(g); x.r.type = 'enemigo'; fx.stat(g, 'karma', -3); return `Contaste lo de ${x.n.first} en el grupo de la oficina. Ahora te odia con la intensidad de mil cafés fríos.`; } }
    ] });

  ev({ id: 'trabajo_credito', when: (g) => inOffice(g) && !!mate(g, 'rival'), icon: '💡', scene: 'trabajo', title: 'Te robaron la idea',
    text: (g) => `${mate(g, 'rival').n.first} presentó tu idea en la reunión como si fuera suya. Y la aplaudieron.`,
    choices: [
      { t: 'Reclamar ante el jefe', sub: 'Depende de cuánto te quiera tu jefe',
        eff: (g) => { const x = mate(g, 'rival');
          if (U.chance(boss(g).r.rel / 100)) { perf(g, 8); x.r.rel = U.clamp(x.r.rel - 10, 0, 100); return `Mostraste tus borradores. ${elJefe(g)} te dio la razón y ${x.n.first} se puso del color de un tomate.`; }
          bumpBoss(g, -5); return `${elJefe(g)} dijo que "lo importante es el equipo". Traducción: no te creyó.`; } },
      { t: 'Dejarlo pasar', sub: 'Tragarte el orgullo', eff: (g) => { fx.stat(g, 'happy', -4); return 'Sonreíste y aplaudiste también. Por dentro, escribiste un discurso de venganza que nunca vas a dar.'; } },
      { t: 'Vengarte', sub: 'Karma en contra; tu jefe podría enterarse',
        eff: (g) => { const x = mate(g, 'rival'); x.r.type = 'enemigo'; fx.stat(g, 'karma', -4);
          let msg = `Cambiaste la contraseña de la impresora de ${x.n.first} justo antes de su presentación. Guerra declarada.`;
          if (U.chance(0.3)) { bumpBoss(g, -10); msg += ' Tu jefe se enteró. No le pareció gracioso.'; }
          return msg; } }
    ] });

  ev({ id: 'trabajo_fiesta', when: inOffice, icon: '🥂', scene: 'fiesta', title: 'Fiesta de fin de año',
    text: 'La empresa alquiló un salón con DJ, karaoke y barra libre. ¿Qué tipo de leyenda vas a ser esta noche?',
    choices: [
      { t: 'Emborracharte', sub: 'Diversión asegurada; el chismoso está mirando',
        eff: (g) => { fx.stat(g, 'happy', 6); const ch2 = mate(g, 'chismoso');
          if (ch2 && U.chance(0.4)) { bumpBoss(g, -8); return `Cantaste tres canciones seguidas y abrazaste a la máquina de café. ${ch2.n.first} se lo contó a tu jefe con fotos.`; }
          return 'Bailaste como si nadie te viera. Te vieron todos, pero nadie filmó. Milagro de fin de año.'; } },
      { t: 'Dar un discurso', sub: 'Puede ser épico o vergonzoso',
        eff: (g) => { fx.skill(g, 'carisma', 2);
          if (U.chance(0.5)) { bumpBoss(g, 6); return 'Tu discurso hizo reír y llorar (de emoción) a medio salón. Tu jefe brindó por ti.'; }
          fx.stat(g, 'happy', -3); return 'Empezaste agradeciendo y terminaste hablando de tu ex. Silencio total. Alguien tosió.'; } },
      { t: 'Irte temprano', sub: 'Paz y cama', eff: (g) => { fx.stat(g, 'stress', -3); return 'Te fuiste antes del karaoke. Al otro día te enteraste de todo por el grupo. No te arrepientes.'; } }
    ] });

  ev({ id: 'trabajo_reestructuracion', when: (g) => inOffice(g) && g.p.job.level >= 2 && !!(mate(g, 'rival') || mate(g, 'aliado')), icon: '✂️', scene: 'trabajo', title: 'Reestructuración',
    text: 'La empresa recorta personal y, como estás a cargo, te toca elegir a quién despedir de tu equipo.',
    choices: [
      { t: (g) => { const x = mate(g, 'rival'); return x ? `Despedir a ${x.n.first} (rival)` : 'Despedir al rival'; }, sub: 'Te sacas un problema de encima', when: (g) => !!mate(g, 'rival'),
        eff: (g) => { const x = mate(g, 'rival'); x.r.type = 'enemigo'; dropMate(g, x.n.id); fx.stat(g, 'karma', -2); return `Despediste a ${x.n.first}. Se llevó la abrochadora y una promesa de venganza.`; } },
      { t: (g) => { const x = mate(g, 'aliado'); return x ? `Despedir a ${x.n.first} (aliado)` : 'Despedir al aliado'; }, sub: 'Te va a doler más a ti', when: (g) => !!mate(g, 'aliado'),
        eff: (g) => { const x = mate(g, 'aliado'); x.r.type = 'enemigo'; dropMate(g, x.n.id); fx.stat(g, 'karma', -6); fx.stat(g, 'happy', -5); return `Despediste a ${x.n.first}, que siempre te cubría. No te volvió a hablar.`; } },
      { t: 'Renunciar en protesta', sub: 'Dejas el trabajo con la frente en alto',
        eff: (g) => { const t = C().title(g.p); C().leave(g, 'renuncia'); fx.stat(g, 'karma', 5); return `Renunciaste a tu puesto de ${t} antes que despedir a alguien. Te aplaudieron en el pasillo.`; } }
    ] });

  ev({ id: 'trabajo_competencia', when: inOffice, icon: '🕵️', scene: 'trabajo', title: 'Te quieren llevar',
    text: 'Una empresa de la competencia te ofrece el mismo puesto con un 20 % más de sueldo. Te escribieron desde un correo personal.',
    choices: [
      { t: 'Aceptar', sub: '+20 %, jefe y compañeros nuevos',
        eff: (g) => { const job = g.p.job; job.salary = Math.round(job.salary * 1.2); job.lvlYears = 0; WP().restaff(g); const B = boss(g);
          return `Te cambiaste de empresa: ${U.money(job.salary)} al año. ${U.gw(B.n.gender, 'Tu nuevo jefe', 'Tu nueva jefa')} es ${MV.fullName(B.n)}.`; } },
      { t: 'Usarla para negociar', sub: 'Puede salir un +12 %… o un mal momento',
        eff: (g) => { const job = g.p.job;
          if (U.chance(U.clamp(0.5 + (boss(g).r.rel - 50) / 200, 0.05, 0.95))) { job.salary = Math.round(job.salary * 1.12); return `Te igualaron casi todo: +12 %. Nuevo sueldo: ${U.money(job.salary)} al año.`; }
          bumpBoss(g, -10); return `"¿Y entonces por qué no te vas?", te dijo ${U.gw(boss(g).n.gender, 'tu jefe', 'tu jefa')}. No supiste qué contestar.`; } },
      { t: 'Rechazar', sub: 'Lealtad', eff: (g) => { bumpBoss(g, 3); return 'Dijiste que no. Lo contaste "sin querer" en la reunión. Tu jefe sonrió.'; } }
    ] });

  ev({ id: 'trabajo_ascenso_trampa', when: (g) => inOffice(g) && g.p.job.level < MV.jobById(g.p.job.id).titles.length - 1, icon: '🪤', scene: 'trabajo', title: 'Ascenso con letra chica',
    text: (g) => `${elJefe(g)} te ofrece un ascenso… a cambio de trabajar también los fines de semana.`,
    choices: [
      { t: 'Aceptar', sub: 'Más cargo, más sueldo y +4 de estrés cada año',
        eff: (g) => { C().promote(g); g.p.job.weekends = true; return 'Aceptaste. Tu nuevo título viene con una oficina más grande y sábados más cortos.'; } },
      { t: 'Rechazar', sub: 'Tus fines de semana son sagrados', eff: (g) => { bumpBoss(g, -3); return 'Dijiste que no. Tu jefe dijo "entiendo" de la forma en que se dice "no entiendo".'; } }
    ] });

  ev({ id: 'trabajo_error', when: inOffice, icon: '💥', scene: 'trabajo', title: 'Error grave',
    text: 'Borraste sin querer el archivo más importante del trimestre. Todavía nadie se dio cuenta.',
    choices: [
      { t: 'Confesar', sub: 'Depende del carácter de tu jefe',
        eff: (g) => { perf(g, -10); const k = boss(g).kind; const good = k === 'buenazo' || k === 'ausente'; bumpBoss(g, good ? 5 : -5);
          return good ? 'Confesaste. Tu jefe valoró la honestidad y recuperaron casi todo de una copia de seguridad.' : 'Confesaste. Tu jefe respiró hondo por la nariz durante un minuto entero.'; } },
      { t: 'Culpar a un compañero', sub: 'Karma en contra; te pueden descubrir', when: (g) => allMates(g).length > 0,
        eff: (g) => { const x = U.pick(allMates(g)); fx.stat(g, 'karma', -6);
          if (U.chance(0.6)) { x.r.type = 'enemigo'; return `Le echaste la culpa a ${x.n.first}. Te creyeron. ${x.n.first} sabe que fuiste tú.`; }
          perf(g, -20); bumpBoss(g, -15); return `Culpaste a ${x.n.first}, pero las cámaras de seguridad no mienten. Quedaste peor que el archivo borrado.`; } },
      { t: 'Esconderlo', sub: 'Mitad y mitad: nadie se entera… o se entera el año que viene',
        eff: (g) => { g.p.job.hidden = g.p.age; return 'Restauraste una versión vieja y cruzaste los dedos. Por ahora, silencio.'; } }
    ] });

  ev({ id: 'trabajo_jefe_nuevo', when: inOffice, w: 0.6, icon: '👔', scene: 'trabajo', text: 'Hubo cambios arriba en la empresa.',
    auto: (g) => { const B = WP().newBoss(g, false); return `${U.gw(B.n.gender, 'Tu nuevo jefe', 'Tu nueva jefa')} es ${MV.fullName(B.n)}. Carácter: ${B.K.icon} ${MV.gt(B.K.name, B.n.gender).toLowerCase()}.`; } });

  ev({ id: 'trabajo_aliado', when: (g) => inOffice(g) && !!mate(g, 'aliado'), icon: '🤝', scene: 'trabajo', tone: 'good', text: 'Faltaste un día sin avisar.',
    auto: (g) => { const x = mate(g, 'aliado'); perf(g, 6); x.r.rel = U.clamp(x.r.rel + 5, 0, 100); return `${x.n.first} te cubrió y dijo que estabas "en una reunión con clientes". Le debes un café. O diez.`; } });
})(window.MV = window.MV || {});
