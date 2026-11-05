/* Mil Vidas — eventos de la adultez (18-64 años): vivienda, trabajo, pareja, hijos y crisis. */
(function (MV) {
  'use strict';
  const U = MV.U, ev = MV.ev, fx = MV.fx, H = MV.EVH;
  const C = () => MV.sys.career;

  // — Vivienda y vida adulta —
  ev({ id: 'mudanza', age: [19, 32], cd: 4, when: (g) => g.p.housing === 'padres' && MV.rels(g, 'padre').length > 0, icon: '📦', title: 'La indirecta',
    text: 'Tus padres dejan folletos de alquileres "olvidados" sobre tu cama.',
    choices: [
      { t: 'Alquilar un monoambiente', eff: (g) => MV.sys.money.rent(g, 'mono') + ' Tu madre lloró. De alegría.' },
      { t: 'Mudarme a una pensión con desconocidos', eff: (g) => MV.sys.money.rent(g, 'pieza') + ' Tu compañero de cuarto toca la flauta a las 6 a.m.' },
      { t: 'Hacerme el que no entiendo', eff: { happy: -2, then: (g) => { MV.rels(g, 'padre').forEach((x) => { x.r.rel = U.clamp(x.r.rel - 6, 0, 100); }); return 'Fingiste no entender. Ahora te cobran "alquiler simbólico" en forma de tareas domésticas.'; } } }
    ] });
  ev({ id: 'herencia_tio', age: [22, 80], once: true, w: 0.4, icon: '📜', title: 'Un abogado llama',
    text: 'Un abogado te informa que un tío lejano que nunca conociste te dejó una herencia.',
    choices: [
      { t: 'Aceptar la herencia', eff: (g) => {
        const r = U.rand();
        if (r < 0.45) { const amt = U.int(5, 120) * 1000; fx.money(g, amt); fx.stat(g, 'happy', 10); return `Heredaste ${U.money(amt)}. Brindas por el tío Eusebio, quienquiera que fuera.`; }
        if (r < 0.75) { const H2 = MV.HOUSES.find((h) => h.haunted); g.p.assets.push({ id: U.uid('a'), type: 'casa', kind: H2.kind, icon: H2.icon, name: 'Casona del tío Eusebio', value: U.int(30000, 80000), cond: 30, haunted: true, bought: g.p.age }); return 'Heredaste una casona vieja en las afueras. Los vecinos dicen que de noche se escuchan cadenas.'; }
        const debt = U.int(3000, 20000); fx.money(g, -debt); fx.stat(g, 'happy', -8); return `Heredaste... sus deudas: ${U.money(debt)}. Gracias, tío.`;
      } },
      { t: 'Rechazarla (huele a estafa)', eff: { smarts: 1, msg: 'La rechazaste. Nunca sabrás qué había. Tu prima sí la aceptó y ahora tiene un yate.' } }
    ] });
  ev({ id: 'principe_correo', age: [25, 95], icon: '📧', title: 'Correo urgente',
    text: 'Un "príncipe" te escribe: necesita tu cuenta bancaria para transferir su fortuna y te dará el 30%.',
    choices: [
      { t: 'Ayudar al príncipe', eff: (g) => { if (g.p.stats.smarts > 80 && U.chance(0.5)) return 'Empezaste a responder y te diste cuenta a tiempo. Uf.'; const lost = Math.round(Math.max(200, g.p.money * U.float(0.05, 0.3))); fx.money(g, -lost); fx.stat(g, 'happy', -8); return `El príncipe desapareció con ${U.money(lost)}. Su reino era un cibercafé.`; } },
      { t: 'Ignorar', eff: { msg: 'Lo mandaste a spam. El príncipe insiste cada semana.' } },
      { t: 'Estafar al estafador', eff: { p: (g) => 0.2 + g.p.skills.crimen / 120 + g.p.stats.smarts / 400, ok: { money: [500, 5000], skills: { crimen: 2 }, msg: 'Le hiciste creer que eras millonario y te mandó {amount} "para gastos". Justicia poética.' }, ko: { msg: 'El estafador era mejor que tú. Te bloqueó y te dejó un emoji de payaso.' } } }
    ] });
  ev({ id: 'vecino_ruidoso', age: [18, 90], icon: '🔊', title: 'El vecino de arriba',
    text: 'Tu vecino pone música a todo volumen a las 3 de la mañana. Otra vez.',
    choices: [
      { t: 'Golpear el techo con una escoba', eff: { stress: 3, msg: 'Golpeaste el techo. Subió el volumen. Era un mensaje claro.' } },
      { t: 'Llamar a la policía', eff: { p: 0.6, ok: { stress: -4, msg: 'La policía vino. Silencio total. Ahora el vecino te mira raro en el ascensor.' }, ko: { stress: 4, msg: 'La policía vino y se quedó a la fiesta.' } } },
      { t: 'Unirte a la fiesta', eff: (g) => { fx.stat(g, 'happy', 6); fx.addic(g, 'alcohol', 3); const n = MV.newNPC(g, { age: U.clamp(g.p.age + U.int(-8, 8), 18, 90), country: g.p.country }); MV.addRel(g, n, 'amigo', U.int(45, 70)); return `Subiste en pijama y terminaste siendo amigo de ${n.first}, el vecino. La música era buenísima.`; } },
      { t: 'Vengarte con música peor', eff: { happy: 3, karma: -2, msg: 'Pusiste polka a todo volumen a las 7 a.m. Victoria total.' } }
    ] });
  ev({ id: 'robo_casa', age: [18, 95], w: 0.6, when: (g) => g.p.housing !== 'padres' && g.p.housing !== 'calle', icon: '🦹', title: '¡Ladrones!',
    text: 'Escuchas ruidos en tu casa a medianoche. Alguien está robando.',
    choices: [
      { t: 'Enfrentar al ladrón', eff: (g) => { if (U.chance(0.4 + g.p.skills.deporte / 200)) { fx.stat(g, 'happy', 8); fx.stat(g, 'fame', 2); return 'Atrapaste al ladrón con un paraguas. Saliste en las noticias locales.'; } fx.stat(g, 'health', -U.int(8, 20)); const lost = Math.round(Math.max(100, g.p.money * 0.05)); fx.money(g, -lost); return `El ladrón te empujó y escapó con ${U.money(lost)}.`; } },
      { t: 'Llamar a la policía en silencio', eff: (g) => { const lost = Math.round(Math.max(50, g.p.money * 0.03)); fx.money(g, -lost); return `La policía llegó 40 minutos tarde. Se llevaron ${U.money(lost)} y tu tostadora.`; } },
      { t: 'Esconderte en el armario', eff: (g) => { const lost = Math.round(Math.max(100, g.p.money * 0.06)); fx.money(g, -lost); fx.stat(g, 'happy', -4); return `Te escondiste en el armario hasta el amanecer. Se llevaron ${U.money(lost)}.`; } }
    ] });
  ev({ id: 'inversion_amigo', age: [22, 65], when: (g) => g.p.money >= 5000 && MV.rels(g, 'amigo').length > 0, target: H.rel('amigo'), icon: '💡', title: 'Una idea brillante',
    text: (g) => `{t} te ofrece invertir $5.000 en su negocio de ${U.pick(['comida para perros veganos', 'paraguas inteligentes', 'cursos de cómo hacer cursos', 'una app para encontrar el control remoto', 'cerveza artesanal de pepino'])}.`,
    choices: [
      { t: 'Invertir $5.000', eff: { money: -5000, p: 0.3, ok: { money: [8000, 40000], happy: 10, rel: 10, msg: '¡El negocio funcionó! Recuperaste {amount}. {t} te invita a cenar de por vida.' }, ko: { happy: -6, rel: -5, msg: 'El negocio fracasó en dos meses. {t} se mudó a otra provincia. Tu dinero también.' } } },
      { t: 'No, gracias', eff: { rel: -3, msg: 'Le dijiste que no a {t}. Se ofendió un poco. Tu billetera está tranquila.' } }
    ] });
  ev({ id: 'choque_auto', age: [18, 85], w: 0.8, when: (g) => g.p.assets.some((a) => a.type === 'auto'), icon: '💥', scene: 'ciudad', title: 'Choque',
    text: (g) => `Chocaste tu auto contra ${U.pick(['un poste', 'un camión de helados', 'el auto de tu jefe', 'una estatua del prócer local', 'una vaca suelta'])}.`,
    choices: [
      { t: 'Pagar los daños', eff: (g) => { const car = g.p.assets.find((a) => a.type === 'auto'); const cost = Math.round(car.value * U.float(0.1, 0.3)) + 300; fx.money(g, -cost); car.cond = U.clamp(car.cond - 30, 0, 100); return `Pagaste ${U.money(cost)} en daños. Tu auto quedó con una abolladura que parece una sonrisa.`; } },
      { t: 'Huir de la escena', eff: (g) => { fx.stat(g, 'karma', -6); if (U.chance(0.35)) { MV.sys.crime.arrest(g, 'Fuga tras un accidente', 2); return 'Huiste... pero una cámara tenía tu patente.'; } return 'Huiste a toda velocidad. Nadie te vio. Tu conciencia sí.'; } },
      { t: 'Culpar al otro a los gritos', eff: { p: 0.4, ok: { skills: { carisma: 2 }, msg: 'Gritaste tanto que el otro conductor terminó pidiendo perdón.' }, ko: { money: -800, happy: -3, msg: 'El otro tenía cámara en el auto. Pagaste $800 y quedaste como loco.' } } }
    ] });
  ev({ id: 'sin_licencia', age: [18, 85], when: (g) => !g.p.license && g.p.assets.some((a) => a.type === 'auto'), icon: '🚓', text: 'Te paró la policía manejando sin licencia. Multa de {amount} y un sermón sobre la responsabilidad.', auto: { money: [-1500, -400], happy: -4, then: (g) => { if (U.chance(0.2)) { g.p.record.push({ crime: 'Manejar sin licencia', age: g.p.age, years: 0 }); return 'Quedó en tus antecedentes.'; } } } });
  ev({ id: 'ex_super', age: [20, 70], when: H.has('ex'), target: H.rel('ex'), icon: '🛒', scene: 'ciudad', title: 'Encuentro incómodo',
    text: 'Te cruzas con {t}, tu ex, en el supermercado. Te vio. Tú le viste.',
    choices: [
      { t: 'Saludar con naturalidad', eff: { rel: 5, karma: 1, msg: 'Saludaste a {t}. Hablaron del clima. Fue sorprendentemente normal.' } },
      { t: 'Esconderte detrás de los fideos', eff: { happy: -2, msg: 'Te escondiste detrás de los fideos. {t} te vio igual. Ahora es peor.' } },
      { t: 'Coquetear', when: (g, ctx) => !MV.partner(g) && MV.sys.rels.canRomance(g, MV.person(g, ctx.target), null), eff: (g, ctx) => { const n = H.t(g, ctx); if (U.chance(0.3 + MV.relOf(g, n.id).rel / 200)) { MV.relOf(g, n.id).type = 'pareja'; fx.stat(g, 'happy', 8); return `Volviste con ${n.first}. Tus amigos ya están organizando la apuesta de cuánto dura.`; } fx.stat(g, 'happy', -4); return `${n.first} te dijo que está "en otra etapa". La etapa se llama "lejos de ti".`; } }
    ] });
  ev({ id: 'crisis_30', age: [29, 31], once: true, icon: '🎂', title: 'Los 30',
    text: 'Cumples 30. De repente te duele la espalda al despertar y escuchas radio.',
    choices: [
      { t: 'Comprarme algo caro', when: (g) => g.p.money >= 2000, eff: { money: -2000, happy: 6, msg: 'Te compraste una cafetera de $2.000. Hace el mismo café, pero con estilo.' } },
      { t: 'Replantearme toda mi vida', eff: { smarts: 2, stress: 6, msg: 'Pasaste tres meses pensando qué hacer con tu vida. Conclusión: nadie sabe.' } },
      { t: 'Ir a terapia', eff: { stress: -10, happy: 4, money: -600, msg: 'Fuiste a terapia. Descubriste que no eres viejo, solo tienes 30. Es distinto.' } },
      { t: 'Negarlo y salir de fiesta', eff: { happy: 5, health: -3, addic: { alcohol: 4 }, msg: 'Saliste como si tuvieras 20. Tu cuerpo tardó 4 días en perdonarte.' } }
    ] });
  ev({ id: 'crisis_40', age: [39, 43], once: true, icon: '🏍️', title: 'Crisis de los 40',
    text: 'Te miras al espejo y ves canas. Muchas canas. Algo hay que hacer.',
    choices: [
      { t: 'Comprar un deportivo rojo', when: (g) => g.p.money >= 60000, eff: (g) => { const car = { id: U.uid('a'), type: 'auto', kind: 'Deportivo', icon: '🏎️', name: `${U.pick(MV.CAR_BRANDS)} GT rojo (deportivo)`, value: 60000, cond: 100, bought: g.p.age }; fx.money(g, -60000); g.p.assets.push(car); fx.stat(g, 'happy', 10); return 'Te compraste un deportivo rojo. Lo manejas a 40 km/h por el barrio para que te vean.'; } },
      { t: 'Teñirme el pelo', eff: { looks: 2, happy: 3, msg: 'Te teñiste el pelo. Quedó un tono "berenjena". Nadie dice nada por respeto.' } },
      { t: 'Correr una maratón', eff: { p: (g) => g.p.stats.health / 110, ok: { health: 8, happy: 10, skills: { deporte: 4 }, msg: '¡Terminaste la maratón! Lloraste en la meta. Medalla colgada en el living.' }, ko: { health: -6, msg: 'Abandonaste en el kilómetro 3. Te llevó una ambulancia muy amable.' } } },
      { t: 'Aceptarlo con sabiduría', eff: { karma: 2, stress: -8, msg: 'Aceptaste tus canas. Te ves interesante, como un profesor de película.' } }
    ] });
  ev({ id: 'discurso_boda', age: [22, 55], when: H.has('amigo', (n) => n.age >= 22), target: H.rel('amigo', (n) => n.age >= 22), icon: '🥂', scene: 'boda', title: 'El discurso',
    text: '{t} se casa y te pide que des el discurso en la fiesta.',
    choices: [
      { t: 'Discurso emotivo', eff: { p: (g) => 0.4 + g.p.skills.carisma / 100, ok: { rel: 12, happy: 6, skills: { carisma: 3 }, msg: 'Hiciste llorar a 200 personas. {t} te abrazó 10 minutos.' }, ko: { rel: 2, happy: -3, msg: 'Te trabaste, dijiste el nombre de su ex y te sentaste rápido.' } } },
      { t: 'Contar anécdotas vergonzosas', eff: { p: 0.5, ok: { rel: 6, happy: 6, msg: 'Todos se rieron con tus anécdotas. Incluso {t}.' }, ko: { rel: -15, msg: 'Contaste LA anécdota. La familia del novio/novia no la conocía. Silencio sepulcral.' } } },
      { t: 'Tomar coraje (líquido) antes', eff: { addic: { alcohol: 5 }, rel: -5, happy: 4, msg: 'Diste el discurso borracho y terminaste cantando una ranchera. Viral en la familia.' } }
    ] });
  ev({ id: 'robo_merito', age: [20, 64], when: H.job, icon: '🦊', scene: 'trabajo', title: 'Te robaron el mérito',
    text: 'Un compañero presentó tu proyecto como si fuera suyo. El jefe lo felicitó.',
    choices: [
      { t: 'Denunciarlo con pruebas', eff: (g) => { if (U.chance(0.55)) { g.p.job.perf = U.clamp(g.p.job.perf + 12, 0, 100); return 'Mostraste los correos con fechas. El jefe le pidió explicaciones. Ganaste.'; } g.p.job.perf = U.clamp(g.p.job.perf - 5, 0, 100); return 'El jefe dijo que "lo importante es el equipo". El compañero sonrió.'; } },
      { t: 'Sabotear su próximo proyecto', eff: { karma: -5, skills: { crimen: 1 }, then: (g) => { g.p.job.perf = U.clamp(g.p.job.perf + 4, 0, 100); return 'Cambiaste un número en su presentación. Lo humillaron en la reunión. Dulce venganza.'; } } },
      { t: 'Dejarlo pasar', eff: { stress: 5, karma: 1, msg: 'Lo dejaste pasar. Te carcome por dentro, pero eres superior.' } }
    ] });
  ev({ id: 'fiesta_empresa', age: [18, 64], when: H.job, icon: '🎄', scene: 'fiesta', title: 'Fiesta de fin de año',
    text: 'Fiesta de fin de año de la empresa. Barra libre.',
    choices: [
      { t: 'Portarme ejemplarmente', eff: (g) => { g.p.job.perf = U.clamp(g.p.job.perf + 3, 0, 100); return 'Te portaste de diez. Hablaste con el jefe del jefe. Punto para ti.'; } },
      { t: 'Bailar sobre la mesa', eff: (g) => { fx.stat(g, 'happy', 8); fx.addic(g, 'alcohol', 5); g.p.job.perf = U.clamp(g.p.job.perf - 6, 0, 100); return 'Bailaste sobre la mesa con la corbata en la cabeza. Hay video. Hay muchos videos.'; } },
      { t: 'Decirle al jefe lo que pienso', eff: (g) => { if (U.chance(0.3)) { g.p.job.perf = U.clamp(g.p.job.perf + 10, 0, 100); return 'Le dijiste al jefe lo que piensas. Le gustó tu sinceridad. Increíble.'; } if (U.chance(0.4)) { C().fire(g, 'Le dijiste al jefe que su peluquín parece una ardilla.'); return 'Hablaste de más.'; } g.p.job.perf = U.clamp(g.p.job.perf - 10, 0, 100); return 'Le dijiste al jefe lo que piensas. Ahora te saluda con frialdad polar.'; } }
    ] });
  ev({ id: 'jefe_grita', age: [18, 64], when: H.job, icon: '😡', scene: 'trabajo', title: 'El jefe explota',
    text: 'Tu jefe te grita delante de toda la oficina por un error que no fue tuyo.',
    choices: [
      { t: 'Renunciar en el acto', eff: (g) => { const t = C().title(g.p); C().leave(g, 'renuncia'); fx.stat(g, 'happy', 6); fx.stat(g, 'stress', -12); return `Te sacaste el gafete, lo tiraste sobre su escritorio y renunciaste a tu puesto de ${t}. Aplausos.`; } },
      { t: 'Llorar en el baño', eff: { happy: -6, stress: 6, msg: 'Lloraste en el baño. Otro compañero lloraba en el cubículo de al lado. Se hicieron amigos.' } },
      { t: 'Responderle con calma', eff: (g) => { if (U.chance(0.5 + g.p.skills.carisma / 200)) { g.p.job.perf = U.clamp(g.p.job.perf + 6, 0, 100); return 'Le respondiste con calma y argumentos. Se disculpó. La oficina te venera.'; } g.p.job.perf = U.clamp(g.p.job.perf - 10, 0, 100); return 'Le respondiste. Se enojó más. Ahora te asigna las peores tareas.'; } },
      { t: 'Sonreír y planear venganza', eff: { karma: -2, stress: 3, skills: { crimen: 1 }, msg: 'Sonreíste. Esa noche le escribiste una reseña anónima de una estrella a su restaurante favorito.' } }
    ] });
  ev({ id: 'oferta_exterior', age: [24, 55], when: H.job, icon: '🌎', title: 'Oferta internacional',
    ctx: (g) => ({ pais: U.pick(Object.keys(MV.COUNTRIES).filter((c) => c !== g.p.country)) }),
    text: (g, ctx) => `Te ofrecen un puesto similar en ${MV.COUNTRIES[ctx.pais].name} ${MV.COUNTRIES[ctx.pais].flag} con 30% más de sueldo.`,
    choices: [
      { t: 'Aceptar y mudarme', eff: (g, ctx) => { const k = ctx.pais; const Cc = MV.COUNTRIES[k]; g.p.country = k; g.p.city = U.pick(Cc.cities); g.p.flags.emigro = true; if (g.p.job) g.p.job.salary = Math.round(g.p.job.salary * 1.3); MV.ach.unlock(g, 'emigrante'); MV.rels(g, ['amigo', 'companero']).forEach((x) => { x.r.rel = U.clamp(x.r.rel - 15, 0, 100); }); fx.stat(g, 'stress', 8); return `Te mudaste a ${g.p.city}, ${Cc.name}. Nueva vida, nuevo sueldo, nuevo idioma para equivocarte.`; } },
      { t: 'Rechazar', eff: { msg: 'Rechazaste la oferta. Te quedas cerca de los tuyos (y de tu panadería favorita).' } }
    ] });
  ev({ id: 'hijo_dibujo', age: [20, 70], when: H.has('hijo', (n) => n.age >= 3 && n.age <= 9), target: H.rel('hijo', (n) => n.age >= 3 && n.age <= 9), icon: '🖍️', text: '{t} te dibujó como un monstruo con colmillos y cuchillos. Dice que es "un retrato de la familia".', auto: { happy: 2, rel: 3 } });
  ev({ id: 'hijo_escuela_problema', age: [22, 70], when: H.has('hijo', (n) => n.age >= 6 && n.age <= 17), target: H.rel('hijo', (n) => n.age >= 6 && n.age <= 17), icon: '🏫', scene: 'escuela', title: 'Llamado de la escuela',
    text: (g) => `Te llaman de la escuela: {t} ${U.pick(['mordió a un compañero', 'vendía tareas en el recreo', 'le cortó el pelo a una compañera', 'organizó una huelga contra la sopa', 'hackeó el proyector'])}.`,
    choices: [
      { t: 'Castigarl{to}', eff: { rel: -8, msg: 'Castigaste a {t} un mes sin consola. Te odia, pero aprenderá.' } },
      { t: 'Defenderl{to} ante la directora', eff: { rel: 10, karma: -1, msg: 'Defendiste a {t} con uñas y dientes. La directora te teme. {t} te adora.' } },
      { t: 'Felicitarl{to} en secreto', eff: { rel: 6, happy: 3, msg: 'En el auto le dijiste a {t}: "Bien hecho, pero que no se repita". Se repetirá.' } }
    ] });
  ev({ id: 'hijo_pide_dinero', age: [36, 90], when: H.has('hijo', (n) => n.age >= 18), target: H.rel('hijo', (n) => n.age >= 18), icon: '💸', title: 'Inversión familiar',
    text: (g) => `{t} te pide $2.000 para "un emprendimiento de ${U.pick(['criptomonedas', 'velas aromáticas', 'NFTs de gatos', 'un food truck de sushi-tacos', 'un podcast'])}".`,
    choices: [
      { t: 'Darle $2.000', when: (g) => g.p.money >= 2000, eff: { money: -2000, rel: 10, p: 0.25, ok: { msg: '¡El emprendimiento de {t} funcionó! Te devolvió el dinero y te regaló una taza.' }, ko: { msg: 'El emprendimiento de {t} fracasó. Te quedaste con 300 velas aromáticas.' } } },
      { t: 'Negarte', eff: { rel: -8, msg: 'Te negaste. {t} dijo que "nunca crees en sus sueños". Drama familiar.' } },
      { t: 'Ofrecerle un trabajo honesto', eff: { rel: -2, karma: 2, msg: 'Le ofreciste trabajo a {t}. Te miró como si le hubieras ofrecido veneno.' } }
    ] });
  ev({ id: 'pareja_celosa', age: [18, 70], when: H.has(['pareja', 'conyuge'], (n) => n.traits.includes('celoso')), target: H.rel(['pareja', 'conyuge'], (n) => n.traits.includes('celoso')), icon: '🔍', title: 'Celos',
    text: '{t} revisó tu celular mientras dormías.',
    choices: [
      { t: 'Mostrarle todo', eff: { rel: 5, stress: 3, msg: 'Le mostraste todo a {t}. Encontró un "jaja" sospechoso a tu primo. Media hora de explicaciones.' } },
      { t: 'Cambiar la contraseña', eff: { rel: -10, msg: 'Cambiaste la contraseña. {t} ahora está segur{to} de que escondes algo.' } },
      { t: 'Revisar el suyo también', eff: { p: 0.3, ok: { rel: -20, happy: -8, msg: 'Revisaste el celular de {t} y encontraste mensajes con otra persona. Qué ironía.' }, ko: { rel: -5, msg: 'Revisaste el celular de {t}. Solo había memes y fotos de comida.' } } }
    ] });
  ev({ id: 'aniversario_olvidado', age: [19, 90], when: H.has('conyuge'), target: H.rel('conyuge'), icon: '📅', title: 'El aniversario',
    text: 'Es tu aniversario con {t}... y te acabas de dar cuenta. Son las 8 p.m.',
    choices: [
      { t: 'Improvisar una cena de lujo ($300)', when: (g) => g.p.money >= 300, eff: { money: -300, rel: 6, msg: 'Conseguiste mesa en un restaurante caro. {t} sospecha, pero disfrutó.' } },
      { t: 'Decir que la sorpresa es mañana', eff: { p: 0.5, ok: { rel: 4, msg: 'Al día siguiente hiciste una sorpresa épica. {t} nunca supo la verdad.' }, ko: { rel: -12, msg: '{t} te conoce demasiado. No hubo sorpresa, hubo silencio.' } } },
      { t: 'Admitir que lo olvidé', eff: { rel: -8, karma: 1, msg: 'Lo admitiste. {t} apreció la honestidad... dentro de dos semanas.' } }
    ] });
  ev({ id: 'suegra', age: [22, 70], when: H.has('conyuge'), target: H.rel('conyuge'), icon: '👵', title: 'Visita prolongada',
    text: 'La madre de {t} viene a vivir con ustedes "unas semanitas".',
    choices: [
      { t: 'Aceptar con una sonrisa', eff: { rel: 8, stress: 10, happy: -4, msg: 'Lleva 7 meses. Reorganizó tu cocina. {t} está feliz.' } },
      { t: 'Inventar una plaga de termitas', eff: { p: 0.6, ok: { karma: -2, msg: 'Inventaste las termitas. La suegra se fue a un hotel. Funcionó.' }, ko: { rel: -15, msg: 'La suegra trajo un fumigador amigo. No había termitas. Te descubrieron.' } } },
      { t: 'Hablarlo con {t}', eff: { p: 0.5, ok: { rel: 3, msg: 'Lo hablaron con calma. La suegra viene solo los domingos.' }, ko: { rel: -8, msg: 'Lo hablaste con {t}. Ahora la suegra sabe que no la quieres.' } } }
    ] });
  ev({ id: 'loteria_oficina', age: [20, 64], when: H.job, icon: '🎟️', scene: 'trabajo', title: 'La vaquita',
    text: 'Tus compañeros juntan dinero para comprar lotería en grupo.',
    choices: [
      { t: 'Poner $20', eff: { money: -20, p: 0.01, ok: { money: [200000, 600000], happy: 20, msg: '¡¡GANARON!! Tu parte: {amount}. La mitad de la oficina renunció ese mismo día.' }, ko: { msg: 'No ganaron. Como siempre. Pero se rieron imaginando qué harían.' } } },
      { t: 'No participar', eff: (g) => { if (U.chance(0.01)) { fx.stat(g, 'happy', -20); return 'No pusiste dinero. GANARON. Ya no tienes compañeros, todos renunciaron millonarios.'; } return 'No participaste. No ganaron. Tenías razón.'; } }
    ] });
  ev({ id: 'bunker', age: [25, 90], icon: '☢️', title: 'El fin del mundo',
    text: 'Un vecino jura que el fin del mundo llega el martes y te ofrece un lugar en su búnker por $2.000.',
    choices: [
      { t: 'Comprar el lugar', when: (g) => g.p.money >= 2000, eff: { money: -2000, happy: -2, msg: 'Pasaste el martes en un búnker comiendo atún. El mundo siguió. El vecino dice que "se postergó".' } },
      { t: 'Reírte en su cara', eff: { happy: 2, msg: 'Te reíste. El martes no pasó nada. El vecino no te saluda más.' } }
    ] });
  ev({ id: 'donar_sangre', age: [18, 60], icon: '🩸', title: 'Campaña de donación',
    text: 'Hay una campaña de donación de sangre en tu barrio.',
    choices: [
      { t: 'Donar', eff: { karma: 5, health: -1, happy: 3, msg: 'Donaste sangre. Te dieron un jugo y una galletita. Eres un héroe con curita.' } },
      { t: 'Desmayarte de solo ver la aguja', eff: { happy: -2, msg: 'Te desmayaste antes de que te tocaran. Te dieron el jugo igual.' } },
      { t: 'No ir', eff: { msg: 'No fuiste. Seguramente alguien más donó.' } }
    ] });
  ev({ id: 'perro_puerta', age: [18, 90], when: (g) => g.p.housing !== 'padres', icon: '🐶', title: 'Un visitante',
    text: 'Un perro callejero se instaló en tu puerta. Te mira con ojos de "adóptame".',
    choices: [
      { t: 'Adoptarlo', eff: (g) => { const pet = MV.newPet(g, 'perro', { age: U.int(1, 8) }); MV.addRel(g, pet, 'mascota', U.int(70, 95)); fx.stat(g, 'happy', 8); fx.stat(g, 'karma', 4); MV.ach.check(g); return `Adoptaste al perro y lo llamaste ${pet.first}. Ya duerme en tu cama.`; } },
      { t: 'Darle comida y agua', eff: { karma: 3, msg: 'Le diste comida. Vuelve todos los días. Técnicamente ya es tuyo.' } },
      { t: 'Ahuyentarlo', eff: { karma: -3, msg: 'Lo ahuyentaste. Se fue mirándote por encima del hombro. Fuiste el villano.' } }
    ] });
  ev({ id: 'reality_show', age: [18, 45], when: (g) => g.p.stats.looks >= 60 || g.p.fame >= 20, icon: '📺', scene: 'escenario', title: 'Reality show',
    text: 'Una productora te invita a participar en "Encerrados en la Mansión".',
    choices: [
      { t: 'Aceptar', eff: (g) => { const r = U.rand(); fx.stat(g, 'fame', U.int(8, 20)); if (r < 0.2) { fx.money(g, 100000); fx.stat(g, 'happy', 12); return '¡Ganaste el reality! $100.000 y miles de seguidores.'; } if (r < 0.6) { g.p.followers += U.int(5000, 40000); return 'Llegaste a la semifinal. Te volviste famoso por una pelea con un participante sobre el último yogur.'; } fx.stat(g, 'happy', -6); fx.stat(g, 'karma', -3); return 'Te expulsaron en la primera semana. Ahora eres meme por llorar abrazado a una planta.'; } },
      { t: 'Rechazar', eff: { msg: 'Rechazaste. Tu dignidad agradece. Tu cuenta bancaria no tanto.' } }
    ] });
  ev({ id: 'luz_extrana', age: [18, 85], w: 0.3, once: true, icon: '🛸', scene: 'naturaleza', title: 'Luces en el cielo',
    text: 'Una luz extraña flota sobre tu casa a las 3 de la mañana.',
    choices: [
      { t: 'Salir a ver', eff: (g) => { fx.stat(g, 'smarts', U.int(-3, 6)); return U.pick(['Despertaste en el jardín con el pijama al revés y un recuerdo borroso de luces verdes.', 'Era un dron de un vecino. Lo derribaste con una escoba.', 'La luz te habló. Dijo "nos equivocamos de casa" y se fue.']); } },
      { t: 'Esconderte bajo la cama', eff: { happy: -2, msg: 'Te escondiste bajo la cama hasta el amanecer. La luz se fue. Nadie te cree.' } }
    ] });
  ev({ id: 'premio_radio', age: [18, 90], icon: '📻', text: 'Llamaste a la radio y ganaste un concurso: un año de mayonesa gratis. 365 frascos.', auto: { happy: 3 } });
  ev({ id: 'auditoria', age: [25, 70], when: (g) => (g.p.job && g.p.job.salary >= 60000) || !!g.p.business, icon: '🧾', title: 'Inspección fiscal',
    text: 'La agencia de impuestos anuncia que va a revisar tus cuentas.',
    choices: [
      { t: 'Pagar todo en regla', eff: (g) => { const amt = Math.round(Math.max(500, g.p.money * 0.05)); fx.money(g, -amt); fx.stat(g, 'karma', 2); return `Pagaste ${U.money(amt)} de diferencias. Dormirás tranquilo.`; } },
      { t: 'Contratar un contador "creativo" ($3.000)', when: (g) => g.p.money >= 3000, eff: { money: -3000, karma: -3, p: 0.7, ok: { msg: 'El contador hizo magia contable. Todo en orden (en los papeles).' }, ko: { then: (g) => { MV.sys.crime.arrest(g, 'Evasión fiscal', 3); return 'El contador era tan creativo que lo buscaba la policía. Te arrastró con él.'; } } } },
      { t: 'Esconder el dinero en el colchón', eff: { p: 0.5, ok: { skills: { crimen: 2 }, msg: 'Los inspectores no encontraron nada. Tu colchón es el más caro del país.' }, ko: { then: (g) => { const amt = Math.round(Math.max(1000, g.p.money * 0.2)); fx.money(g, -amt); return `Encontraron el colchón. Multa de ${U.money(amt)}.`; } } } }
    ] });
  ev({ id: 'amigo_prestamo', age: [18, 80], when: (g) => g.p.money >= 1000 && MV.rels(g, 'amigo').length > 0, target: H.rel('amigo'), icon: '🤲', title: 'Un favor',
    text: '{t} te pide prestados $1.000. Jura que te los devuelve el mes que viene.',
    choices: [
      { t: 'Prestarle', eff: (g, ctx) => { fx.money(g, -1000); MV.EVH.bump(g, ctx, 8); MV.EV.later(g, 'amigo_devuelve', U.int(1, 3), { target: ctx.target }); return 'Le prestaste $1.000 a {t}. Te abrazó. Ya veremos.'; } },
      { t: 'Negarte', eff: { rel: -10, msg: 'Le dijiste que no a {t}. Ahora te dice "tacaño/a" en el grupo.' } }
    ] });
  ev({ id: 'boda_ex', age: [22, 70], when: H.has('ex'), target: H.rel('ex'), icon: '💒', scene: 'boda', title: 'Invitación',
    text: '{t}, tu ex, te invita a su boda. Con alguien que se parece sospechosamente a ti.',
    choices: [
      { t: 'Ir con tu mejor ropa', eff: { looks: 1, happy: 3, rel: 5, msg: 'Fuiste espectacular. Bailaste toda la noche. Fuiste más feliz que los novios.' } },
      { t: 'Ir y objetar en la ceremonia', eff: { karma: -6, fame: 2, rel: -40, msg: '"¡Yo me opongo!" Te sacaron entre cuatro primos. Eres leyenda en esa familia.' } },
      { t: 'No ir', eff: { msg: 'No fuiste. Mandaste un regalo: una tostadora. Mensaje claro.' } }
    ] });
  ev({ id: 'gimnasio_anual', age: [20, 70], icon: '🏋️', text: 'Pagaste la membresía del gimnasio todo el año. Fuiste dos veces. Una fue para preguntar dónde quedaba el baño.', auto: { money: -400, happy: -1 } });
  ev({ id: 'pareja_propone', age: [20, 60], when: H.has('pareja', (n, r, g) => n.age >= 18 && g.p.age - r.since >= 2 && r.rel >= 60), target: H.rel('pareja', (n, r, g) => n.age >= 18 && g.p.age - r.since >= 2 && r.rel >= 60), icon: '💍', scene: 'boda', title: '¡Te proponen matrimonio!',
    text: '{t} se arrodilla con un anillo en la mano. Todo el restaurante mira.',
    choices: [
      { t: '¡Sí!', eff: (g, ctx) => { MV.EV.push(g, 'boda', { target: ctx.target }, true); fx.stat(g, 'happy', 8); return 'Dijiste que sí. El restaurante aplaudió. Les regalaron un postre.'; } },
      { t: 'No', eff: (g, ctx) => MV.sys.rels.breakUp(g, H.t(g, ctx)) + ' En medio del restaurante. Incómodo para todos.' },
      { t: 'Necesito pensarlo', eff: { rel: -10, msg: '"Necesito pensarlo." {t} guardó el anillo despacio. Muy despacio.' } }
    ] });
  ev({ id: 'quiere_hijos', age: [22, 44], when: (g) => { const s = MV.rels(g, 'conyuge')[0]; return !!s && MV.sys.rels.fertile(g, s.n) && !MV.rels(g, 'hijo').length && !g.p.flags.buscandoBebe; }, target: H.rel('conyuge'), icon: '🍼', title: 'La conversación',
    text: '{t} quiere tener hijos. Te lo dijo mientras mirabas videos de bebés en el sillón.',
    choices: [
      { t: 'Sí, busquemos un bebé', eff: { rel: 10, flag: 'buscandoBebe', msg: 'Decidieron buscar un bebé. Ya están discutiendo nombres.' } },
      { t: 'Todavía no', eff: { rel: -4, msg: 'Le dijiste que todavía no. {t} dijo "ok" de esa forma que significa "no está ok".' } },
      { t: 'Nunca', eff: { rel: -18, msg: 'Le dijiste a {t} que nunca. La relación se enfrió como un helado en el freezer.' } }
    ] });
  ev({ id: 'recorte_personal', age: [20, 64], w: 0.6, when: H.job, icon: '✂️', scene: 'trabajo', text: 'La empresa anunció un "proceso de optimización de recursos humanos".', auto: { stress: 8, then: (g) => { if (g.p.job.perf < 55 && U.chance(0.5)) { C().fire(g, 'Recorte de personal. Te despidieron por correo electrónico.'); return ''; } return 'Sobreviviste al recorte. Algunos compañeros no.'; } } });
  ev({ id: 'empleado_mes', age: [18, 64], when: (g) => H.job(g) && g.p.job.perf >= 70, icon: '🏆', scene: 'trabajo', text: 'Te nombraron empleado del mes. Tu foto está en la pared, al lado del baño.', auto: { happy: 4, then: (g) => { g.p.job.perf = U.clamp(g.p.job.perf + 4, 0, 100); } } });
  ev({ id: 'mafia_invitacion', age: [18, 55], when: (g) => g.p.skills.crimen >= 20 && (!g.p.job || g.p.job.id !== 'mafia') && !g.p.prison, icon: '🕴️', scene: 'ciudad', title: 'Una oferta que no puedes rechazar',
    text: 'Un señor de traje y anillo dorado te invita a "trabajar para la familia". Tu fama en la calle llegó lejos.',
    choices: [
      { t: 'Aceptar', eff: (g) => { C().hire(g, MV.FAME.mafia); fx.stat(g, 'karma', -8); return 'Ahora trabajas para la familia. El seguro médico es raro, pero el sueldo es bueno.'; } },
      { t: 'Rechazar con respeto', eff: { msg: 'Rechazaste con respeto. Te dio una palmada en la mejilla. Aún no sabes si fue una amenaza.' } },
      { t: 'Denunciarlo a la policía', eff: (g) => { fx.stat(g, 'karma', 6); MV.EV.later(g, 'venganza_mafia', U.int(1, 4)); return 'Lo denunciaste. La policía tomó nota. La familia también.'; } }
    ] });
  ev({ id: 'encargo_mafia', age: [16, 80], when: (g) => !!g.p.job && g.p.job.id === 'mafia', icon: '🔫', scene: 'ciudad', title: 'Un encargo especial',
    text: 'La familia te pide "convencer" a un comerciante que no quiere pagar protección.',
    choices: [
      { t: 'Hacerlo a la manera de la familia', eff: (g) => { fx.stat(g, 'karma', -12); fx.skill(g, 'crimen', 4); g.p.job.perf = U.clamp(g.p.job.perf + 15, 0, 100); if (U.chance(0.15)) { MV.sys.crime.arrest(g, 'Extorsión agravada', 3); return 'El comerciante tenía cámaras. Ups.'; } fx.money(g, U.int(5000, 20000)); return 'El comerciante ahora paga puntualmente. El jefe está orgulloso.'; } },
      { t: 'Negarte', eff: (g) => { if (U.chance(0.5)) { fx.stat(g, 'health', -U.int(10, 25)); return 'Te negaste. La familia te recordó, a golpes, que no se negocia.'; } g.p.job.perf = U.clamp(g.p.job.perf - 15, 0, 100); return 'Te negaste. El jefe te miró largo rato. Muy largo.'; } },
      { t: 'Avisarle al comerciante', eff: { karma: 8, p: 0.6, ok: { msg: 'Le avisaste al comerciante, que huyó a tiempo. Nadie sabe que fuiste tú.' }, ko: { health: -20, msg: 'La familia se enteró de que avisaste. Despertaste en un hospital.' } } }
    ] });
  ev({ id: 'oferta_freelance', age: [20, 64], when: (g) => g.p.skills.programacion >= 40 || g.p.skills.arte >= 40, icon: '💻', title: 'Trabajo extra',
    text: 'Un cliente te ofrece un trabajo freelance urgente para el fin de semana.',
    choices: [
      { t: 'Aceptarlo', eff: (g) => { const amt = U.int(800, 5000); fx.money(g, amt); fx.stat(g, 'stress', 7); fx.skill(g, g.p.skills.programacion >= g.p.skills.arte ? 'programacion' : 'arte', 2); return `Trabajaste todo el fin de semana. Ganaste ${U.money(amt)}. El cliente pidió "un cambio chiquito" 14 veces.`; } },
      { t: 'Rechazarlo', eff: { stress: -3, msg: 'Lo rechazaste. Pasaste el fin de semana en paz. El dinero no lo es todo.' } }
    ] });
  ev({ id: 'compañero_romance', age: [18, 64], when: (g) => H.job(g) && !MV.partner(g), icon: '💘', scene: 'trabajo', title: 'Química en la oficina',
    text: 'Hay alguien en la oficina que te mira mucho en las reuniones.',
    choices: [
      { t: 'Invitarle un café', eff: (g) => { const n = MV.sys.rels.candidate(g); if (U.chance(0.45 + g.p.stats.looks / 300)) return MV.sys.rels.startDating(g, n) + ' Romance de oficina oficial.'; delete g.people[n.id]; fx.stat(g, 'happy', -4); return 'Le invitaste un café. Te dijo que te miraba porque tenías espinaca en los dientes.'; } },
      { t: 'Mantener lo profesional', eff: { karma: 1, msg: 'Mantuviste la distancia profesional. Recursos Humanos aprueba.' } }
    ] });
  ev({ id: 'hijo_graduacion', age: [38, 90], when: H.has('hijo', (n) => n.age >= 18 && n.age <= 26), target: H.rel('hijo', (n) => n.age >= 18 && n.age <= 26), icon: '🎓', scene: 'universidad', text: (g, ctx) => `{t} se graduó de ${U.pick(['la universidad', 'una carrera técnica', 'un curso de barista'])}. Lloraste más que en tu propia graduación.`, auto: { happy: 8, rel: 5 } });
  ev({ id: 'cumple_hijo', age: [20, 80], when: H.has('hijo', (n) => n.age >= 2 && n.age <= 12), target: H.rel('hijo', (n) => n.age >= 2 && n.age <= 12), icon: '🎈', scene: 'fiesta', title: 'Cumpleaños de {t}',
    text: '{t} cumple años. Quiere una fiesta "como la de su compañero rico".',
    choices: [
      { t: 'Fiesta épica ($1.500)', when: (g) => g.p.money >= 1500, eff: { money: -1500, rel: 12, happy: 4, msg: 'Contrataste un mago, un inflable y un pony. {t} es el rey del barrio.' } },
      { t: 'Fiesta casera', eff: { rel: 6, happy: 3, msg: 'Torta casera, globos y juegos. {t} se divirtió muchísimo (el pony no hacía falta).' } },
      { t: 'Olvidarlo (trabajo mucho)', eff: { rel: -15, happy: -4, msg: 'Olvidaste el cumpleaños de {t}. Te lo recordará en terapia dentro de 20 años.' } }
    ] });
  ev({ id: 'vecina_chisme', age: [18, 90], icon: '👂', text: (g) => `La vecina del 3°B le contó a todo el edificio que ${U.pick(['eres espía', 'tienes una cabra en el departamento', 'te vio llorar con una telenovela', 'cantas en la ducha muy mal'])}. Solo una cosa es verdad.`, auto: { happy: -1 } });
  ev({ id: 'atasco', age: [18, 75], when: (g) => g.p.assets.some((a) => a.type === 'auto') || H.job(g), icon: '🚦', text: 'Pasaste 3 horas atascado en el tráfico. Aprendiste un idioma entero con un pódcast.', auto: { stress: 5, skills: { idiomas: 2 } } });
  ev({ id: 'apagon', age: [8, 95], icon: '🕯️', text: 'Hubo un apagón de dos días. Descubriste que tu familia es interesante cuando no hay wifi.', auto: { happy: 1, then: (g) => { MV.rels(g, ['padre', 'hijo', 'conyuge', 'hermano']).forEach((x) => { x.r.rel = U.clamp(x.r.rel + 3, 0, 100); }); } } });
  ev({ id: 'emprender_idea', age: [22, 60], once: true, when: (g) => !g.p.business && g.p.money >= 15000, icon: '🚀', title: 'Ser tu propio jefe',
    text: 'Te despiertas con una idea: ¿y si abres tu propio negocio? Tienes algo de dinero ahorrado.',
    choices: [
      { t: 'Abrir una tienda online ($15.000)', eff: (g) => MV.sys.money.openBusiness(g, 'tienda') },
      { t: 'Abrir un food truck ($20.000)', when: (g) => g.p.money >= 20000, eff: (g) => MV.sys.money.openBusiness(g, 'foodtruck') },
      { t: 'Seguir como estoy', eff: { msg: 'La idea se quedó en la almohada. Como casi todas.' } }
    ] });
})(window.MV = window.MV || {});
