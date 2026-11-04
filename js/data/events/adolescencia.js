/* Mil Vidas — eventos de la adolescencia (13-17 años). */
(function (MV) {
  'use strict';
  const U = MV.U, ev = MV.ev, fx = MV.fx, H = MV.EVH;
  const parents = (g) => MV.rels(g, 'padre');
  const bumpParents = (g, d) => parents(g).forEach((x) => { x.r.rel = U.clamp(x.r.rel + d, 0, 100); });

  ev({ id: 'primer_beso', age: [13, 17], once: true, icon: '💋', scene: 'fiesta', title: 'Momento incómodo',
    text: 'En una fiesta, alguien de tu curso se acerca peligrosamente. Parece que quiere besarte.',
    choices: [
      { t: 'Besarle', eff: (g) => {
        fx.stat(g, 'happy', 8);
        if (U.chance(0.4)) { const n = MV.sys.rels.candidate(g); return 'Tu primer beso. Chocaron los dientes, pero fue mágico. ' + MV.sys.rels.startDating(g, n); }
        return 'Tu primer beso. Chocaron los dientes. Nunca más volvieron a hablar del tema.';
      } },
      { t: 'Huir al baño', eff: { happy: -2, msg: 'Huiste al baño y te encerraste 40 minutos. Alguien golpeó la puerta: era la misma persona.' } },
      { t: 'Fingir una llamada', eff: { msg: '"¿Hola? ¿Abuela?" Hablaste con nadie durante diez minutos. Muy convincente.' } }
    ] });
  ev({ id: 'fiesta_sin_padres', age: [14, 17], icon: '🏠', scene: 'fiesta', title: 'Fiesta sin adultos',
    text: 'Te invitan a una fiesta en la casa de alguien cuyos padres se fueron de viaje.',
    choices: [
      { t: 'Ir y portarme bien', eff: { happy: 4, skills: { carisma: 2 }, msg: 'Fuiste, bailaste y volviste a hora. Aburrido pero impecable.' } },
      { t: 'Ir y probar el alcohol', eff: (g) => {
        fx.addic(g, 'alcohol', 8); fx.stat(g, 'happy', 6);
        if (U.chance(0.35)) { bumpParents(g, -10); fx.stat(g, 'happy', -8); return 'Volviste a casa caminando en zigzag. Tu madre te esperaba despierta. Con la chancla.'; }
        return 'Bebiste, cantaste y vomitaste en un macetero. Tus padres nunca lo supieron.';
      } },
      { t: 'Quedarme en casa', eff: { happy: -2, smarts: 1, msg: 'Te quedaste en casa. Al día siguiente todos hablaban de la fiesta. Tú no entendías nada.' } },
      { t: 'Ir y vaciar el refrigerador', eff: { happy: 5, karma: -1, msg: 'Te comiste todo el refrigerador ajeno. Leyenda gastronómica.' } }
    ] });
  ev({ id: 'grano_foto', age: [13, 16], icon: '📷', text: 'Te salió un grano gigante justo el día de la foto escolar. Saldrá en el anuario para siempre.', auto: { looks: -2, happy: -3 } });
  ev({ id: 'cigarrillo', age: [13, 17], icon: '🚬', title: 'El grupo "cool"',
    text: 'Los chicos "cool" te ofrecen un cigarrillo detrás del gimnasio.',
    choices: [
      { t: 'Aceptarlo', eff: { addic: { tabaco: 12 }, happy: 2, health: -1, skills: { carisma: 1 }, msg: 'Fumaste. Tosiste como un abuelo, pero te aceptaron en el grupo.' } },
      { t: 'Rechazarlo', eff: { karma: 1, happy: -1, msg: 'Dijiste que no. Te llamaron "nene de mamá". Tus pulmones te lo agradecen.' } },
      { t: 'Fingir que fumas', eff: { skills: { carisma: 2 }, msg: 'Fingiste fumar sin tragar el humo. Nadie lo notó. Actuación de Óscar.' } }
    ] });
  ev({ id: 'examen_final', age: [13, 17], when: H.school, icon: '📝', scene: 'escuela', title: 'Examen final',
    text: 'Mañana hay un examen final que define si pasas de año.',
    choices: [
      { t: 'Estudiar toda la noche', eff: { smarts: 3, stress: 8, then: (g) => { g.p.edu.perf = U.clamp(g.p.edu.perf + 10, 0, 100); return 'Estudiaste hasta las 4 a.m. con café. Te fue bien, pero tienes ojeras de mapache.'; } } },
      { t: 'Copiarte', eff: (g) => { if (U.chance(0.55)) { g.p.edu.perf = U.clamp(g.p.edu.perf + 8, 0, 100); fx.stat(g, 'karma', -2); return 'Copiaste del celular escondido en la manga. Aprobaste.'; } g.p.edu.perf = U.clamp(g.p.edu.perf - 15, 0, 100); fx.stat(g, 'happy', -8); return 'El profesor te vio. Te quitó el examen frente a todos.'; } },
      { t: 'Encomendarte al universo', eff: (g) => { const ok = U.chance(g.p.stats.smarts / 120); g.p.edu.perf = U.clamp(g.p.edu.perf + (ok ? 4 : -8), 0, 100); return ok ? 'No estudiaste nada y aprobaste. El universo existe.' : 'El universo estaba ocupado. Reprobaste.'; } },
      { t: 'Pagarle al nerd para que te pase respuestas ($50)', when: (g) => g.p.money >= 50, eff: { money: -50, karma: -2, then: (g) => { g.p.edu.perf = U.clamp(g.p.edu.perf + 6, 0, 100); return 'El nerd te pasó las respuestas. Algunas eran incorrectas a propósito. Negocios son negocios.'; } } }
    ] });
  ev({ id: 'foto_verguenza', age: [13, 17], icon: '📱', title: 'Foto vergonzosa',
    text: 'Alguien publicó una foto tuya durmiendo con la boca abierta en clase. Ya tiene 300 comentarios.',
    choices: [
      { t: 'Reírte con todos', eff: { skills: { carisma: 4 }, happy: 2, msg: 'Comentaste "jajaja soy yo". Te ganaste el respeto de todos.' } },
      { t: 'Pedir que la borren', eff: { p: 0.5, ok: { msg: 'La borraron. Pero 40 personas ya tenían captura.' }, ko: { happy: -6, msg: 'No la borraron. Ahora es un sticker en todos los grupos.' } } },
      { t: 'Vengarte con otra foto', eff: { karma: -3, happy: 3, msg: 'Publicaste una foto peor de esa persona. Guerra declarada.' } }
    ] });
  ev({ id: 'trabajo_verano', age: [14, 17], icon: '🍦', title: 'Trabajo de verano',
    text: 'Te ofrecen un trabajo de verano.',
    choices: [
      { t: 'Vender helados en la playa', eff: { money: [400, 1200], health: 2, happy: 1, msg: 'Vendiste helados todo el verano. Ganaste {amount} y un bronceado de camiseta.' } },
      { t: 'Lavar autos', eff: { money: [300, 900], skills: { carisma: 1 }, msg: 'Lavaste autos. Ganaste {amount}. Un cliente te dejó propina en monedas de otro país.' } },
      { t: 'Nah, el verano es para dormir', eff: { happy: 5, stress: -10, msg: 'Dormiste hasta el mediodía todo el verano. Impecable.' } }
    ] });
  ev({ id: 'castigo_sabado', age: [13, 17], when: (g) => parents(g).length > 0, icon: '🚪', title: 'No sales el sábado',
    text: 'Tus padres dicen que este sábado no sales. Todos tus amigos van al cumpleaños del año.',
    choices: [
      { t: 'Escaparte por la ventana', eff: (g) => { if (U.chance(0.5)) { fx.stat(g, 'happy', 7); return 'Te escapaste por la ventana y volviste a las 5 a.m. Nadie lo notó. Agente secreto.'; } bumpParents(g, -12); fx.stat(g, 'happy', -6); return 'Te atraparon con una pierna en la ventana. Castigado hasta los 30.'; } },
      { t: 'Negociar como un abogado', eff: { p: (g) => 0.3 + g.p.skills.carisma / 100, ok: { happy: 5, skills: { carisma: 3 }, msg: 'Presentaste argumentos sólidos y un PowerPoint. Te dejaron ir hasta las 12.' }, ko: { happy: -3, msg: 'Tus argumentos no convencieron. "Porque lo digo yo" ganó otra vez.' } } },
      { t: 'Aceptarlo', eff: { happy: -3, karma: 1, then: (g) => { bumpParents(g, 4); return 'Te quedaste en casa. Tus padres te miraron con orgullo y un poco de sospecha.'; } } }
    ] });
  ev({ id: 'banda_rock', age: [13, 17], once: true, icon: '🎸', title: 'La banda',
    text: 'Unos amigos quieren formar una banda de rock en el garaje.',
    choices: [
      { t: 'Ser el cantante', eff: { skills: { musica: 6, carisma: 3 }, happy: 5, then: (g) => { MV.EV.later(g, 'banda_exito', U.int(5, 15)); return 'Eres la voz de "Los Gritones del Garaje". Los vecinos llamaron a la policía dos veces.'; } } },
      { t: 'Tocar la guitarra', eff: { skills: { musica: 8 }, happy: 4, then: (g) => { MV.EV.later(g, 'banda_exito', U.int(5, 15)); return 'Aprendiste tres acordes. Con eso alcanza para el 90% de las canciones.'; } } },
      { t: 'Ser el mánager', eff: { skills: { carisma: 5 }, smarts: 1, msg: 'Eres el mánager. Conseguiste un show en un cumpleaños de 15. Éxito total.' } },
      { t: 'No me interesa', eff: { msg: 'Pasaste. La banda duró dos ensayos. Tal vez acertaste.' } }
    ] });
  ev({ id: 'talento_deportivo', age: [13, 17], once: true, when: (g) => g.p.skills.deporte >= 25, icon: '🏅', title: 'Tienes talento',
    text: 'El entrenador del club dice que podrías llegar a profesional si entrenas en serio.',
    choices: [
      { t: 'Entrenar en serio', eff: { skills: { deporte: 10 }, health: 4, stress: 4, then: (g) => { if (!g.p.club) MV.sys.sports.joinClub(g, (MV.COUNTRIES[g.p.country] || {}).sport || 'futbol'); g.p.sportsExp[g.p.club] = (g.p.sportsExp[g.p.club] || 0) + 1; MV.EV.later(g, 'cazatalentos', U.int(1, 3)); return 'Entrenas todos los días. Comes pollo y arroz. Sueñas con estadios.'; } } },
      { t: 'Prefiero estudiar', eff: { smarts: 2, msg: 'Elegiste los libros. El entrenador te miró con decepción profunda.' } }
    ] });
  ev({ id: 'grafiti_muro', age: [13, 17], icon: '🎨', title: 'El muro de la escuela',
    text: 'Tus amigos van a pintar un grafiti gigante en el muro de la escuela esta noche.',
    choices: [
      { t: 'Unirte', eff: (g) => { fx.skill(g, 'arte', 3); fx.skill(g, 'crimen', 1); fx.stat(g, 'happy', 5); if (U.chance(0.3)) { bumpParents(g, -8); return 'Pintaron un mural épico... y te atrapó el director a la mañana siguiente. Limpiarás el muro todo el mes.'; } return 'Pintaron un mural épico. El director lo odia. Los alumnos lo aman.'; } },
      { t: 'Avisar al director', eff: { karma: 2, happy: -4, msg: 'Los delataste. El director te felicitó. Tus amigos ya no te hablan.', then: (g) => { MV.rels(g, 'amigo').forEach((x) => { if (x.n.age < 20) x.r.rel = U.clamp(x.r.rel - 15, 0, 100); }); } } },
      { t: 'Irte a casa', eff: { msg: 'Te fuiste a casa. Al día siguiente el mural decía tu nombre mal escrito.' } }
    ] });
  ev({ id: 'dieta_milagro', age: [14, 17], icon: '🥤', title: 'Dieta milagrosa',
    text: 'Una influencer promete que con su "batido detox" bajarás 10 kilos en una semana.',
    choices: [
      { t: 'Probarlo', eff: { health: -5, looks: 1, happy: -2, money: -40, msg: 'El batido era agua con apio y laxante. Pasaste la semana en el baño.' } },
      { t: 'Ignorarlo', eff: { smarts: 1, msg: 'Lo ignoraste. Bien. El cerebro funciona.' } },
      { t: 'Hacer ejercicio de verdad', eff: { health: 4, looks: 2, skills: { deporte: 2 }, msg: 'Empezaste a correr. Funciona mejor que cualquier batido.' } }
    ] });
  ev({ id: 'viaje_egresados', age: [17, 17], once: true, when: H.school, icon: '🚌', scene: 'fiesta', title: 'Viaje de egresados',
    text: 'Llegó el famoso viaje de egresados. Una semana sin padres.',
    choices: [
      { t: 'Descontrolarme', eff: { happy: 10, addic: { alcohol: 10 }, health: -3, msg: 'No dormiste en 7 días. Volviste con 4 pulseras de boliche y sin voz.' } },
      { t: 'Ir pero con calma', eff: { happy: 7, skills: { carisma: 2 }, msg: 'Fuiste, disfrutaste y cuidaste a los que se descontrolaron. Eres la persona responsable del grupo.' } },
      { t: 'No ir (no hay dinero)', eff: { happy: -5, msg: 'No fuiste. Viste todo por redes. Dolió.' } }
    ] });
  ev({ id: 'documento_falso', age: [15, 17], icon: '🪪', title: 'Documento falso',
    text: 'Un amigo hace documentos falsos para entrar a bares. Cobra $50.',
    choices: [
      { t: 'Comprar uno', when: (g) => g.p.money >= 50, eff: { money: -50, skills: { crimen: 2 }, happy: 3, then: (g) => { MV.EV.later(g, 'documento_falso_cae', U.int(1, 2)); return 'Ahora "tienes" 21 años. En la foto pareces de 12.'; } } },
      { t: 'No, gracias', eff: { karma: 1, msg: 'Dijiste que no. Mejor esperar unos años.' } }
    ] });
  ev({ id: 'crisis_identidad', age: [14, 17], icon: '🌀', title: '¿Quién soy?',
    text: 'Tienes una crisis existencial. Nada tiene sentido. Ni siquiera el álgebra.',
    choices: [
      { t: 'Teñirme el pelo', eff: (g) => { g.p.look.hair = U.pick(['#2f7dd1', '#d13f8a', '#3cbf6a', '#9b59ff', '#f2f2f2']); fx.stat(g, 'happy', 4); return 'Te teñiste el pelo de un color que no existe en la naturaleza. Tu madre gritó.'; } },
      { t: 'Hacerme vegano', eff: { health: 2, karma: 3, msg: 'Te hiciste vegano. Lo mencionas en cada conversación.' } },
      { t: 'Escribir poesía oscura', eff: { skills: { arte: 4 }, happy: 2, msg: 'Escribiste 40 poemas sobre la oscuridad del alma. Uno rimaba "existencia" con "paciencia".' } },
      { t: 'Hablar con alguien', eff: { stress: -10, happy: 3, msg: 'Hablaste con alguien de confianza. Resulta que es normal sentirse así. Qué alivio.' } }
    ] });
  ev({ id: 'acoso_redes', age: [13, 17], icon: '💬', title: 'Acoso en redes',
    text: 'Una cuenta anónima te manda mensajes horribles todos los días.',
    choices: [
      { t: 'Bloquear y seguir', eff: { happy: -2, smarts: 1, msg: 'Bloqueaste la cuenta. Aparecieron dos más. Bloqueaste también.' } },
      { t: 'Contárselo a tus padres', eff: { happy: 2, stress: -5, msg: 'Tus padres hablaron con la escuela. Descubrieron quién era. Justicia.' } },
      { t: 'Investigar quién es', eff: { p: (g) => 0.3 + g.p.skills.programacion / 100, ok: { skills: { programacion: 3 }, happy: 6, msg: 'Rastreaste la cuenta: era tu "mejor amigo". Ahora lo sabe toda la escuela.' }, ko: { happy: -5, msg: 'No lograste saber quién era. La paranoia te acompaña.' } } }
    ] });
  ev({ id: 'olimpiada', age: [13, 17], when: (g) => g.p.stats.smarts >= 70 && H.school(g), icon: '🧮', scene: 'escuela', title: 'Olimpiada de matemáticas',
    text: 'Te invitan a representar a la escuela en la olimpiada de matemáticas.',
    choices: [
      { t: 'Participar', eff: { p: (g) => g.p.stats.smarts / 130, ok: { smarts: 4, fame: 2, happy: 8, flag: 'olimpico', msg: '¡Ganaste una medalla! Saliste en el diario local. Tu abuela lo plastificó.' }, ko: { smarts: 2, happy: -3, msg: 'Quedaste en el puesto 47. De 48. El 48 no se presentó.' } } },
      { t: 'No, gracias', eff: { msg: 'Rechazaste la invitación. Las matemáticas pueden esperar.' } }
    ] });
  ev({ id: 'drama_pareja_teen', age: [13, 17], when: H.has('pareja'), target: H.rel('pareja'), icon: '💔', title: 'Drama adolescente',
    text: '{t} dice que le gusta otra persona "un poquito".',
    choices: [
      { t: 'Luchar por amor', eff: { p: 0.5, ok: { rel: 15, happy: 4, msg: 'Le escribiste una canción a {t}. Funcionó. Siguen juntos.' }, ko: { rel: -20, happy: -6, msg: 'Le escribiste una canción a {t}. Se la mostró a la otra persona. Se rieron.' } } },
      { t: 'Terminar con dignidad', eff: (g, ctx) => MV.sys.rels.breakUp(g, H.t(g, ctx)) + ' Saliste con la frente en alto.' },
      { t: 'Llorar con música triste', eff: { happy: -5, skills: { musica: 1 }, msg: 'Escuchaste la misma canción triste 200 veces. Tus vecinos también.' } }
    ] });
  ev({ id: 'padre_biologico', age: [13, 40], once: true, when: (g) => !!g.p.flags.padreAusente && !!g.people[g.p.flags.padreAusente] && g.people[g.p.flags.padreAusente].alive, icon: '🧔', title: 'Un desconocido en la puerta',
    text: (g) => `Un hombre llamado ${MV.fullName(g.people[g.p.flags.padreAusente])} toca tu puerta. Dice que es tu padre biológico.`,
    choices: [
      { t: 'Darle una oportunidad', eff: (g) => { const d = g.people[g.p.flags.padreAusente]; MV.addRel(g, d, 'padre', U.int(25, 45)); delete g.p.flags.padreAusente; fx.stat(g, 'happy', 5); fx.stat(g, 'karma', 3); return `Dejaste entrar a ${d.first}. Hablaron durante horas. Tiene tu misma nariz.`; } },
      { t: 'Cerrarle la puerta', eff: (g) => { delete g.p.flags.padreAusente; fx.stat(g, 'happy', -2); return 'Le cerraste la puerta en la cara. Llegó tarde, unos 15 años tarde.'; } },
      { t: 'Exigir los años de pensión', eff: (g) => { const d = g.people[g.p.flags.padreAusente]; const amt = Math.round(Math.min(d.money * 0.4, 40000)); d.money -= amt; fx.money(g, amt); MV.addRel(g, d, 'padre', 15); delete g.p.flags.padreAusente; return amt > 0 ? `Le exigiste la pensión atrasada. Te pagó ${U.money(amt)} con cara de culpa.` : 'Le exigiste dinero. No tiene ni para el colectivo.'; } }
    ] });
  ev({ id: 'moda_negro', age: [13, 17], icon: '🖤', text: 'Descubriste la moda. Ahora el 90% de tu ropa es negra y el otro 10% es gris oscuro.', auto: { looks: 1, happy: 2 } });
  ev({ id: 'torneo_videojuegos', age: [13, 17], icon: '🕹️', title: 'Torneo de videojuegos',
    text: 'Hay un torneo de videojuegos en el centro comercial. Primer premio: $1.000.',
    choices: [
      { t: 'Participar', eff: { p: (g) => 0.2 + g.p.skills.programacion / 200 + g.p.stats.smarts / 400, ok: { money: 1000, happy: 10, fame: 1, msg: '¡Ganaste el torneo! Un niño de 10 años lloró. Ganaste $1.000.' }, ko: { happy: -3, msg: 'Perdiste en primera ronda contra alguien que jugaba con una mano.' } } },
      { t: 'Mirar desde la tribuna', eff: { happy: 2, msg: 'Miraste el torneo y comiste nachos. Victoria personal.' } }
    ] });
  ev({ id: 'rumor_profe', age: [13, 17], when: H.school, icon: '🗣️', scene: 'escuela', title: 'El rumor',
    text: 'Corre el rumor de que estás enamorado del profesor de química.',
    choices: [
      { t: 'Negarlo con furia', eff: { happy: -3, msg: 'Lo negaste con tanta furia que ahora todos están más convencidos.' } },
      { t: 'Ignorarlo', eff: { karma: 1, msg: 'Lo ignoraste. En dos semanas el rumor pasó a otra víctima.' } },
      { t: 'Inventar un rumor peor sobre otro', eff: { karma: -4, skills: { carisma: 2 }, msg: 'Inventaste que el director tiene una doble vida como mago. Funcionó demasiado bien.' } }
    ] });
  ev({ id: 'hackeo_notas', age: [14, 17], when: (g) => g.p.skills.programacion >= 25 && H.school(g), icon: '💻', title: 'Acceso al sistema',
    text: 'Descubres cómo entrar al sistema de notas de la escuela. La contraseña era "1234".',
    choices: [
      { t: 'Subirme las notas', eff: (g) => { fx.skill(g, 'crimen', 3); fx.skill(g, 'programacion', 2); if (U.chance(0.7)) { g.p.edu.perf = U.clamp(g.p.edu.perf + 20, 0, 100); fx.stat(g, 'karma', -3); return 'Te pusiste un 10 en todo. Con moderación... un 9,5.'; } g.p.edu.perf = 5; fx.stat(g, 'happy', -12); return 'Te atraparon. Te pusieron un 1 en todo y casi te expulsan.'; } },
      { t: 'Reportar la falla', eff: { karma: 4, smarts: 2, skills: { programacion: 2 }, msg: 'Reportaste la falla. Te nombraron "asesor informático". Sin sueldo.' } },
      { t: 'Vender el acceso', eff: { money: [200, 800], karma: -5, skills: { crimen: 2 }, msg: 'Vendiste el acceso a medio curso. Ganaste {amount}. Ahora todos tienen sospechosos 10.' } }
    ] });
  ev({ id: 'amigo_borracho_auto', age: [15, 19], icon: '🚗', title: 'Te llevo',
    text: 'Un amigo que bebió toda la noche te ofrece llevarte a casa en el auto de su padre.',
    choices: [
      { t: 'Subir', eff: (g) => { if (U.chance(0.25)) { fx.stat(g, 'health', -U.int(15, 35)); MV.sys.health.add(g, 'fractura'); return 'Chocaron contra un poste. Sobreviviste de milagro. Nunca más.'; } fx.stat(g, 'stress', 6); return 'Llegaste a casa. No sabes cómo. Rezaste todo el camino.'; } },
      { t: 'Llamar a tus padres', eff: { happy: -2, karma: 2, msg: 'Llamaste a tu madre a las 3 a.m. Vino en pijama y te dio un sermón. Llegaste viv{o}.' } },
      { t: 'Quitarle las llaves', eff: { karma: 4, skills: { carisma: 1 }, msg: 'Le quitaste las llaves y pidieron un taxi. Le salvaste la vida (y el auto de su padre).' } }
    ] });
  ev({ id: 'primera_cita', age: [14, 17], when: H.has('pareja'), target: H.rel('pareja'), icon: '🌹', title: 'Primera cita',
    text: 'Tienes tu primera cita oficial con {t}. ¿Adónde van?',
    choices: [
      { t: 'Al cine', eff: { rel: 6, happy: 4, msg: 'Fueron al cine. Te tiraste el pochoclo encima en la primera escena.' } },
      { t: 'A comer hamburguesas', eff: { rel: 5, happy: 4, msg: 'Comieron hamburguesas. Hablaron durante horas. Te quedó ketchup en la nariz todo el tiempo.' } },
      { t: 'De picnic en la plaza', eff: { rel: 8, happy: 5, msg: 'Picnic romántico. Una paloma les robó un sándwich. Se rieron mucho.' } }
    ] });
  ev({ id: 'concierto_sin_entrada', age: [13, 17], icon: '🎤', title: 'Tu banda favorita',
    text: 'Tu banda favorita viene a la ciudad, pero las entradas se agotaron en 3 minutos.',
    choices: [
      { t: 'Colarte', eff: { p: 0.35, ok: { happy: 10, skills: { crimen: 1 }, msg: 'Te colaste trepando una reja. Viste el concierto entero. Valió cada raspón.' }, ko: { happy: -5, msg: 'Seguridad te atrapó y te dejó afuera. Escuchaste el concierto desde la vereda.' } } },
      { t: 'Comprar a un revendedor', when: (g) => g.p.money >= 200, eff: { money: -200, p: 0.7, ok: { happy: 10, msg: 'Pagaste una fortuna, pero viste a tu banda. Lloraste en la primera canción.' }, ko: { happy: -8, msg: 'La entrada era falsa. Te estafaron. Lección aprendida.' } } },
      { t: 'Llorar en tu cuarto', eff: { happy: -3, skills: { musica: 1 }, msg: 'Pusiste su disco a todo volumen y lloraste. Un concierto íntimo.' } }
    ] });
  ev({ id: 'hermano_ropa', age: [13, 17], when: H.has('hermano', (n) => n.age >= 10 && n.age <= 25), target: H.rel('hermano', (n) => n.age >= 10 && n.age <= 25), icon: '👕', title: 'La ropa',
    text: '{t} se llevó tu ropa favorita sin permiso y volvió con una mancha.',
    choices: [
      { t: 'Perdonarl{to}', eff: { rel: 4, karma: 1, msg: 'Lo dejaste pasar. {t} te debe una.' } },
      { t: 'Esconderle el cargador', eff: { rel: -6, happy: 3, msg: 'Le escondiste el cargador del celular a {t}. Venganza fría y efectiva.' } },
      { t: 'Gritar hasta que se entere la cuadra', eff: { rel: -8, stress: 3, msg: 'Gritaste tanto que un vecino preguntó si todo estaba bien.' } }
    ] });
  ev({ id: 'diario_leido', age: [13, 17], when: (g) => parents(g).length > 0, icon: '📔', text: 'Descubriste que tu madre leyó tu diario íntimo. Ella descubrió que la llamas "la dictadora".', auto: { happy: -4, then: (g) => bumpParents(g, -5) } });
  ev({ id: 'voz_cambio', age: [12, 15], once: true, icon: '🎙️', text: 'Tu voz cambió de golpe a la mitad de una presentación oral. Sonó como un pato en una licuadora.', auto: { happy: -2, looks: 1 } });
  ev({ id: 'nerd_amigo', age: [13, 17], when: H.school, icon: '🤓', title: 'Proyecto en grupo',
    text: 'Te toca hacer un proyecto con la persona más rara de la clase.',
    choices: [
      { t: 'Darle una oportunidad', eff: (g) => { const n = MV.newNPC(g, { age: g.p.age, country: g.p.country, money: 0, job: 'Estudiante', smarts: U.int(75, 100) }); MV.addRel(g, n, 'amigo', U.int(55, 80)); fx.stat(g, 'smarts', 2); g.p.edu.perf = U.clamp(g.p.edu.perf + 6, 0, 100); return `Resulta que ${n.first} es genial. Sacaron la mejor nota y ahora son inseparables.`; } },
      { t: 'Dejar que haga todo', eff: { karma: -2, then: (g) => { g.p.edu.perf = U.clamp(g.p.edu.perf + 4, 0, 100); return 'Dejaste que hiciera todo y pusiste tu nombre. Sacaron 10. Te sientes un poco basura.'; } } },
      { t: 'Pedir cambio de grupo', eff: { happy: -1, msg: 'Pediste cambio de grupo. Te tocó con alguien peor.' } }
    ] });
})(window.MV = window.MV || {});
