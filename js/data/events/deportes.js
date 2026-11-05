/* Mil Vidas — eventos del deporte: juveniles en el club y vida del deportista profesional. */
(function (MV) {
  'use strict';
  const U = MV.U, ev = MV.ev, fx = MV.fx;
  const SP = () => MV.sys.sports;
  const inClub = (g) => !!g.p.club && !SP().isPro(g.p);
  const pro = (g) => SP().isPro(g.p);
  const sport = (g) => MV.SPORTS[pro(g) ? MV.jobById(g.p.job.id).sport : g.p.club];
  const team = (g) => pro(g) && sport(g).team;
  const perf = (g, d) => { if (g.p.job) g.p.job.perf = U.clamp(g.p.job.perf + d, 0, 100); };
  const exp = (g, d) => { const k = g.p.club; if (k) g.p.sportsExp[k] = Math.max(0, (g.p.sportsExp[k] || 0) + d); };

  // ——— Juveniles (en un club, todavía amateur) ———
  ev({ id: 'torneo_escolar', age: [8, 22], when: inClub, icon: '🏆', scene: 'escuela', title: 'La gran final',
    text: (g) => `Tu equipo de ${sport(g).name.toLowerCase()} llegó a la final del torneo ${g.p.age < 18 ? 'intercolegial' : 'regional'}. Las gradas están llenas de padres gritando.`,
    choices: [
      { t: 'Darlo todo', eff: (g) => { exp(g, 1); fx.skill(g, sport(g).skill || 'deporte', U.int(2, 4)); if (U.chance(0.35 + SP().rating(g, g.p.club) / 200)) { fx.stat(g, 'happy', 10); fx.stat(g, 'fame', 2); return '¡Ganaron la final! Te llevaron en andas y saliste en el diario del barrio.'; } fx.stat(g, 'happy', -4); return 'Perdieron por poco. Lloraste en el vestuario, pero el entrenador te felicitó.'; } },
      { t: 'Dejar que juegue el suplente', eff: { karma: 3, skills: { carisma: 2 }, msg: 'Le cediste tu lugar al suplente, que nunca había jugado. Metió el punto del triunfo. Todos te aman.' } },
      { t: 'Hacer trampa', eff: { karma: -4, p: 0.5, ok: { happy: 6, msg: 'Hiciste trampa y ganaron. El trofeo pesa un poco más de lo normal.' }, ko: { happy: -8, msg: 'El árbitro te vio. Expulsado y descalificado. Tu madre se tapó la cara.' } } }
    ] });
  ev({ id: 'entrenador_talento', age: [9, 18], when: inClub, icon: '📣', text: (g) => `El entrenador de ${sport(g).club.toLowerCase()} le dijo a tus padres que tienes "algo especial".`, auto: { happy: 4, then: (g) => { exp(g, 1); fx.skill(g, sport(g).skill || 'deporte', 3); } } });
  ev({ id: 'seleccion_juvenil', age: [13, 19], once: true, when: (g) => inClub(g) && SP().rating(g, g.p.club) >= 45, icon: '🎽', scene: 'escenario', title: 'Convocatoria',
    text: (g) => `¡Te convocaron a la selección juvenil de ${sport(g).name.toLowerCase()}! Hay un torneo internacional durante la época de exámenes.`,
    choices: [
      { t: 'Ir con la selección', eff: (g) => { exp(g, 2); fx.skill(g, sport(g).skill || 'deporte', 5); fx.skill(g, 'idiomas', 2); fx.stat(g, 'fame', 4); if (g.p.edu.stage) g.p.edu.perf = U.clamp(g.p.edu.perf - 10, 0, 100); return 'Jugaste un torneo internacional. Los ojeadores tomaron nota de tu nombre. Tus notas, no tanto.'; } },
      { t: 'Quedarme a rendir exámenes', eff: (g) => { if (g.p.edu.stage) g.p.edu.perf = U.clamp(g.p.edu.perf + 8, 0, 100); fx.stat(g, 'happy', -4); return 'Te quedaste estudiando. Viste los partidos por internet con un nudo en la garganta.'; } }
    ] });
  ev({ id: 'padres_deporte', age: [8, 16], when: (g) => inClub(g) && MV.rels(g, 'padre').length > 0 && !!g.p.edu.stage && g.p.edu.perf < 55, icon: '📚', title: 'O las notas o el deporte',
    text: (g) => `Tus padres dicen que dejes ${sport(g).club.toLowerCase()} porque tus notas están bajando.`,
    choices: [
      { t: 'Obedecer y dejarlo', eff: (g) => { SP().leaveClub(g); g.p.edu.perf = U.clamp(g.p.edu.perf + 10, 0, 100); fx.stat(g, 'happy', -8); return 'Dejaste el club. Las notas mejoraron. Tu alma, no.'; } },
      { t: 'Convencerlos', eff: { p: (g) => 0.3 + g.p.skills.carisma / 120, ok: { skills: { carisma: 3 }, msg: 'Prometiste estudiar más y aceptaron. Ahora entrenas y estudias. Duermes poco.' }, ko: { happy: -5, then: (g) => { SP().leaveClub(g); return 'No los convenciste. Te sacaron del club.'; } } } },
      { t: 'Seguir a escondidas', eff: { karma: -2, p: 0.6, ok: { msg: 'Sigues entrenando y dices que vas a la biblioteca. Vuelves con olor a césped.' }, ko: { happy: -6, then: (g) => { MV.rels(g, 'padre').forEach((x) => { x.r.rel = U.clamp(x.r.rel - 10, 0, 100); }); SP().leaveClub(g); return 'Te descubrieron. Castigo, sermón y club cancelado.'; } } } }
    ] });
  ev({ id: 'lesion_juvenil', age: [10, 22], when: inClub, icon: '🦶', title: 'Dolor',
    text: 'Sientes un dolor fuerte en la rodilla, pero mañana hay partido importante.',
    choices: [
      { t: 'Jugar igual', eff: (g) => { if (U.chance(0.4)) { MV.sys.health.add(g, 'lesion'); exp(g, -1); return 'Jugaste y la rodilla dijo basta. Meses de recuperación.'; } exp(g, 1); fx.stat(g, 'happy', 4); return 'Jugaste con dolor y fuiste figura. No lo vuelvas a hacer.'; } },
      { t: 'Descansar', eff: { health: 3, msg: 'Descansaste una semana. El cuerpo te lo agradece.' } }
    ] });
  ev({ id: 'beca_deportiva_oferta', age: [16, 17], once: true, when: (g) => inClub(g) && SP().rating(g, g.p.club) >= 55, icon: '🏅', title: 'Universidades interesadas',
    text: (g) => `Una universidad te escribió: quieren que juegues en su equipo de ${sport(g).name.toLowerCase()} cuando termines la secundaria. Si eliges universidad, tendrás beca deportiva.`,
    choices: [{ t: 'Guardar la carta', eff: { happy: 6, then: (g) => { g.p.flags.becaOfrecida = g.p.club; }, msg: 'Guardaste la carta en un cajón como si fuera un tesoro. Al elegir universidad podrás usar la beca deportiva.' } }] });

  // ——— Deportista profesional ———
  ev({ id: 'final_campeonato', age: [16, 55], when: (g) => pro(g) && g.p.job.level >= 1, cd: 2, icon: '🏟️', scene: 'escenario', title: 'Último minuto',
    text: (g) => `Final de ${U.pick(sport(g).trophies)}. Queda un minuto y todo depende de ti.`,
    choices: [
      { t: 'Tomar la responsabilidad', eff: (g) => {
        const r = SP().rating(g, MV.jobById(g.p.job.id).sport);
        if (U.chance(0.3 + r / 180)) { const bonus = Math.round(g.p.job.salary * 0.15) + 10000; fx.money(g, bonus); fx.stat(g, 'fame', 8); fx.stat(g, 'happy', 12); perf(g, 10); MV.ach.unlock(g, 'campeon'); return `¡Lo lograste! Eres héroe nacional. Premio: ${U.money(bonus)}.`; }
        fx.stat(g, 'happy', -10); fx.stat(g, 'fame', 2); perf(g, -5); return 'Fallaste en el momento decisivo. Esa imagen se repetirá en la tele durante años.';
      } },
      { t: 'Pasársela a un compañero', when: team, eff: { skills: { carisma: 2 }, p: 0.5, ok: { happy: 8, fame: 2, msg: 'Tu compañero anotó. Te llevaste el mérito de la asistencia y un abrazo eterno.' }, ko: { happy: -5, msg: 'Tu compañero falló. Todos te miran a ti por no animarte.' } } },
      { t: 'Simular una falta', eff: { karma: -5, p: 0.4, ok: { fame: 3, happy: 5, msg: 'Te tiraste como en una telenovela. El árbitro compró la actuación. Ganaron.' }, ko: { fame: 4, happy: -6, msg: 'La repetición mostró que no te tocaron. Eres meme mundial por tu actuación.' } } }
    ] });
  ev({ id: 'dopaje', age: [16, 55], when: pro, icon: '💉', scene: 'hospital', title: 'Un médico "creativo"',
    text: 'Un médico del circuito te ofrece una sustancia "que no detectan los controles".',
    choices: [
      { t: 'Aceptarla', eff: (g) => {
        fx.stat(g, 'karma', -10); fx.stat(g, 'health', -5); perf(g, 20);
        if (U.chance(0.35)) { const t = MV.sys.career.title(g.p); MV.sys.career.leave(g, 'dopaje'); fx.stat(g, 'fame', 6); fx.stat(g, 'happy', -20); return `Dio positivo en el control. Te suspendieron cuatro años y perdiste tu puesto de ${t.toLowerCase()}. Escándalo mundial.`; }
        return 'Rindes como nunca. Duermes como nunca no. Nadie lo detectó... todavía.';
      } },
      { t: 'Rechazarla', eff: { karma: 3, msg: 'Lo rechazaste. Prefieres ganar limpio (o perder con dignidad).' } },
      { t: 'Denunciarlo', eff: { karma: 6, fame: 2, msg: 'Denunciaste al médico. Lo expulsaron del circuito. Algunos colegas ya no te saludan.' } }
    ] });
  ev({ id: 'amano', age: [16, 55], when: pro, icon: '🎲', title: 'Partido arreglado',
    text: (g) => `Un apostador te ofrece ${U.money(Math.max(20000, Math.round(g.p.job.salary * 0.4)))} por perder a propósito el próximo partido.`,
    choices: [
      { t: 'Aceptar el dinero', eff: (g) => {
        const amt = Math.max(20000, Math.round(g.p.job.salary * 0.4));
        fx.money(g, amt); fx.stat(g, 'karma', -15); perf(g, -10);
        if (U.chance(0.3)) { MV.sys.career.leave(g, 'amaño'); MV.sys.crime.arrest(g, 'Amaño de partidos', 2); return 'La policía tenía intervenido el teléfono del apostador. Te descubrieron.'; }
        return `Perdiste a propósito y cobraste ${U.money(amt)}. Tus hinchas lloraron. Tú también, pero en un yate.`;
      } },
      { t: 'Rechazar', eff: { karma: 3, msg: 'Lo mandaste a pasear. El apostador sonrió y se fue. Inquietante.' } },
      { t: 'Denunciarlo a la liga', eff: { karma: 8, fame: 3, msg: 'Lo denunciaste. Desarmaron una red de apuestas ilegales. Te dieron un premio al juego limpio.' } }
    ] });
  ev({ id: 'capitania', age: [18, 45], once: true, when: (g) => team(g) && g.p.job.perf >= 55, icon: '©️', title: 'La cinta de capitán',
    text: 'El entrenador te ofrece la cinta de capitán del equipo.',
    choices: [
      { t: 'Aceptar', eff: (g) => { fx.skill(g, 'carisma', 5); fx.stat(g, 'stress', 6); fx.stat(g, 'fame', 3); perf(g, 5); return 'Eres capitán. Das charlas motivacionales y discutes con el árbitro por todo el equipo.'; } },
      { t: 'Rechazar', eff: { msg: 'Preferiste concentrarte en tu juego. El veterano del equipo se quedó la cinta (y la ilusión).' } }
    ] });
  ev({ id: 'polemica_redes_dep', age: [16, 60], when: pro, icon: '📱', title: 'Polémica',
    text: (g) => `Publicaste que ${U.pick(['el árbitro necesita lentes', 'la comida del club es incomible', 'tu rival juega como tu abuela', 'el entrenador no sabe nada'])}. Se armó un escándalo.`,
    choices: [
      { t: 'Pedir disculpas', eff: { karma: 2, fame: 1, msg: 'Pediste disculpas en un video con fondo blanco y música triste. Funcionó a medias.' } },
      { t: 'Redoblar la apuesta', eff: (g) => { fx.stat(g, 'fame', 5); perf(g, -6); g.p.followers += U.int(5000, 50000); return 'Publicaste algo todavía peor. Ganaste miles de seguidores y una multa del club.'; } },
      { t: 'Borrar las redes', eff: (g) => { g.p.followers = Math.round(g.p.followers * 0.5); fx.stat(g, 'stress', -8); return 'Borraste tus redes. Paz mental total. Tu agente casi se desmaya.'; } }
    ] });
  ev({ id: 'entrenador_nuevo', age: [16, 55], when: pro, icon: '🧢', title: 'Entrenador nuevo',
    text: 'Llegó un entrenador nuevo que no parece contar contigo.',
    choices: [
      { t: 'Entrenar el doble', eff: (g) => { perf(g, 8); fx.stat(g, 'stress', 6); fx.skill(g, sport(g).skill || 'deporte', 2); return 'Entrenaste el doble hasta que no le quedó otra que ponerte. Ahora eres su favorito.'; } },
      { t: 'Hablar con él', eff: { p: (g) => 0.3 + g.p.skills.carisma / 120, ok: { skills: { carisma: 2 }, then: (g) => { perf(g, 5); return 'Tuvieron una charla sincera. Te dio una oportunidad.'; } }, ko: { then: (g) => { perf(g, -6); return 'La charla salió mal. Te mandó a entrenar con los juveniles.'; } } } },
      { t: 'Pedir el traspaso', when: team, eff: (g) => { if (U.chance(0.5)) { const S = sport(g); const prev = g.p.job.club; g.p.job.club = U.pick(S.clubs.filter((c) => c !== prev)) || prev; return `Te fuiste a ${g.p.job.club}. Nuevo club, nuevo entrenador, nueva oportunidad.`; } perf(g, -4); return 'Nadie te quiso fichar. Sigues en el banco.'; } }
    ] });
  ev({ id: 'zapatillas_firma', age: [16, 60], when: (g) => pro(g) && g.p.fame >= 30, icon: '👟', title: 'Tu propia línea',
    text: 'Una marca deportiva quiere lanzar una línea de zapatillas con tu nombre.',
    choices: [
      { t: 'Aceptar', eff: (g) => { const amt = Math.round(g.p.fame * U.int(8000, 30000)); fx.money(g, amt); fx.stat(g, 'fame', 4); return `Firmaste. Tu cara está en cajas de zapatillas de todo el mundo. Ganaste ${U.money(amt)}.`; } },
      { t: 'Rechazar (son feas)', eff: { karma: 1, msg: 'Las rechazaste: tenían luces de colores y un dibujo tuyo con alas.' } }
    ] });
  ev({ id: 'rival_lesionado', age: [16, 55], when: pro, icon: '🤕', title: 'Tu rival se lesionó',
    text: 'Tu máximo rival se lesionó y no jugará en toda la temporada.',
    choices: [
      { t: 'Visitarlo en el hospital', eff: { karma: 4, skills: { carisma: 2 }, msg: 'Fuiste a visitarlo con chocolates. La foto dio la vuelta al mundo. Ahora son amigos.' } },
      { t: 'Celebrarlo en redes', eff: { karma: -6, fame: 3, msg: 'Lo celebraste en redes. Medio mundo te odia, el otro medio te sigue. Karma anotado.' } }
    ] });
  ev({ id: 'documental', age: [18, 70], once: true, when: (g) => pro(g) && g.p.fame >= 50, icon: '🎬', scene: 'escenario', title: 'Tu documental',
    text: 'Una plataforma de streaming quiere grabar un documental sobre tu vida durante un año entero.',
    choices: [
      { t: 'Aceptar', eff: (g) => { const amt = U.int(200000, 2000000); fx.money(g, amt); fx.stat(g, 'fame', 8); fx.stat(g, 'stress', 10); return `Grabaron todo, incluso tus berrinches. El documental fue un éxito. Ganaste ${U.money(amt)}.`; } },
      { t: 'Rechazar', eff: { stress: -3, msg: 'Preferiste tu privacidad. Las cámaras se fueron a grabar a tu rival.' } }
    ] });
  ev({ id: 'novatada', age: [16, 30], once: true, when: (g) => team(g) && g.p.job.years <= 1, icon: '🎤', text: 'Como novato, los veteranos te obligaron a cantar en el autobús del equipo. Desafinaste, pero ya eres parte del grupo.', auto: { skills: { carisma: 3 }, happy: 3 } });
  ev({ id: 'nino_fan', age: [16, 70], when: pro, icon: '🧒', text: 'Un niño con tu camiseta lloró de emoción al conocerte. Le regalaste tus zapatillas.', auto: { happy: 6, karma: 2, skills: { carisma: 1 } } });
  ev({ id: 'pelea_vestuario', age: [16, 55], when: team, icon: '🥊', title: 'Pelea en el vestuario',
    text: 'Un compañero te culpa de la derrota delante de todo el plantel.',
    choices: [
      { t: 'Responderle con calma', eff: { skills: { carisma: 3 }, karma: 2, msg: 'Le respondiste con calma y el plantel te dio la razón. Él se disculpó al día siguiente.' } },
      { t: 'Ir a las manos', eff: (g) => { fx.stat(g, 'health', -U.int(3, 10)); perf(g, -8); fx.stat(g, 'fame', 2); return 'Se pelearon. Multa para los dos y un video filtrado que todos vieron.'; } },
      { t: 'Ignorarlo', eff: { stress: 4, msg: 'Lo ignoraste. El ambiente quedó tenso durante semanas.' } }
    ] });
  ev({ id: 'oferta_post_retiro', manual: true, icon: '🎙️', title: 'La vida después del deporte',
    text: 'Ya retirado, te llegan ofertas para seguir ligado al deporte.',
    choices: [
      { t: '📋 Ser entrenador', eff: (g) => { MV.sys.career.hire(g, MV.jobById('entrenador')); return 'Ahora eres entrenador. Gritas desde el costado de la cancha con la misma pasión.'; } },
      { t: '🎙️ Ser comentarista de TV', when: (g) => g.p.fame >= 30, eff: (g) => { MV.sys.career.hire(g, MV.jobById('comentarista')); return 'Ahora comentas partidos por televisión. Tus frases ya son famosas.'; } },
      { t: '🏖️ Disfrutar del retiro', eff: { happy: 6, stress: -15, msg: 'Elegiste descansar. Juegas al pádel con amigos y ganas siempre.' } }
    ] });
})(window.MV = window.MV || {});
