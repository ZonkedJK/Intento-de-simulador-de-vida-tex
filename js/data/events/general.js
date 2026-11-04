/* Mil Vidas — eventos generales: cualquier edad, mascotas, fama, cárcel, dinero y consecuencias encadenadas. */
(function (MV) {
  'use strict';
  const U = MV.U, ev = MV.ev, fx = MV.fx, H = MV.EVH;

  // — Cualquier edad —
  ev({ id: 'tormenta', age: [3, 110], icon: '⛈️', text: 'Una tormenta tremenda se llevó el techo del vecino. El tuyo resistió, pero ahora tienes una gotera con forma de pato.', auto: { stress: 2 } });
  ev({ id: 'eclipse', age: [5, 110], once: true, icon: '🌑', text: 'Hubo un eclipse total. Lo miraste sin lentes especiales durante un segundo. Viste manchitas toda la tarde.', auto: { happy: 3, smarts: 1 } });
  ev({ id: 'famoso_super', age: [8, 110], icon: '🌟', text: 'Viste a una celebridad en el supermercado. Compraba papel higiénico como cualquier mortal.', auto: { happy: 2 } });
  ev({ id: 'sueno_raro', age: [5, 110], icon: '💭', text: (g) => `Soñaste que ${U.pick(['tus dientes se caían en una entrevista', 'eras una tostadora con sentimientos', 'tu profesor de primaria era presidente', 'volabas pero solo a un metro del suelo', 'te casabas con un pingüino'])}. Despertaste confundido.`, auto: {} });
  ev({ id: 'gripe_mundial', age: [0, 110], once: true, w: 0.4, icon: '😷', text: 'Una gripe nueva recorre el mundo. Todos usan barbijo y aprenden a hacer pan casero.', auto: { stress: 8, then: (g) => { if (U.chance(0.4)) MV.sys.health.add(g, 'gripe'); } } });
  ev({ id: 'billete_pantalon', age: [10, 110], icon: '👖', text: 'Encontraste {amount} en un pantalón viejo. El mejor sueldo que cobraste nunca.', auto: { money: [10, 300], happy: 3 } });
  ev({ id: 'vecino_nuevo', age: [8, 110], icon: '🏘️', title: 'Vecino nuevo',
    text: 'Se mudó alguien nuevo a la casa de al lado.',
    choices: [
      { t: 'Darle la bienvenida con una torta', eff: (g) => { const n = MV.newNPC(g, { age: U.clamp(g.p.age + U.int(-10, 10), 8, 99), country: g.p.country }); MV.addRel(g, n, 'amigo', U.int(45, 70)); fx.stat(g, 'karma', 2); return `Le llevaste una torta a ${n.first}. Te invitó a pasar. Ahora son amig${U.gw(n.gender, 'os', 'as')}.`; } },
      { t: 'Espiar por la ventana', eff: { karma: -1, happy: 1, msg: 'Lo espiaste tres días. Tiene una colección de enanos de jardín. Inquietante.' } },
      { t: 'Ignorarlo', eff: { msg: 'Lo ignoraste. Él también a ti. Paz vecinal.' } }
    ] });
  ev({ id: 'karma_bueno', age: [10, 110], when: (g) => g.p.karma >= 45, icon: '🍀', text: (g) => U.pick(['Un desconocido te pagó el café. El universo devuelve favores.', 'Encontraste el último asiento libre en el transporte. El karma existe.', 'Te devolvieron la billetera perdida con todo adentro y una nota amable.']), auto: { happy: 4 } });
  ev({ id: 'karma_malo', age: [10, 110], when: (g) => g.p.karma <= -40, icon: '🐦', text: (g) => U.pick(['Una paloma te eligió. Otra vez. Justo en la cabeza.', 'Pisaste un chicle, después un charco y después algo peor.', 'Se te cayó el celular en el inodoro. El universo lleva la cuenta.']), auto: { happy: -4 } });
  ev({ id: 'internet_caido', age: [10, 110], icon: '📡', text: 'Se cayó internet tres días. Leíste un libro, hablaste con tu familia y descubriste que hay un mundo afuera.', auto: { smarts: 2, happy: -1, stress: -3 } });

  // — Mascotas —
  ev({ id: 'mascota_destrozo', age: [3, 110], when: H.has('mascota'), target: H.rel('mascota'), icon: '🛋️', title: 'Escena del crimen',
    text: '{t} destrozó el sillón. Te mira como si no hubiera pasado nada.',
    choices: [
      { t: 'Retarl{to}', eff: { rel: -5, msg: 'Retaste a {t}. Te ignoró y se durmió sobre los restos del sillón.' } },
      { t: 'Comprar otro sillón ($400)', when: (g) => g.p.money >= 400 || g.p.age < 18, eff: (g) => { if (g.p.age >= 18) fx.money(g, -400); return 'Compraste otro sillón. {t} ya lo está evaluando.'; } },
      { t: 'Sacar foto para redes', eff: (g) => { const gain = U.int(20, 400) + (U.chance(0.05) ? 20000 : 0); g.p.followers += gain; if (gain > 10000) { fx.stat(g, 'fame', 8); MV.ach.unlock(g, 'viral'); return `La foto de {t} sobre el sillón destruido se hizo viral. +${U.num(gain)} seguidores.`; } return `Publicaste la foto. +${U.num(gain)} seguidores. {t} es más famos{to} que tú.`; } }
    ] });
  ev({ id: 'mascota_escapa', age: [3, 110], when: H.has('mascota', (n) => ['perro', 'gato', 'conejo', 'huron', 'loro'].includes(n.species)), target: H.rel('mascota', (n) => ['perro', 'gato', 'conejo', 'huron', 'loro'].includes(n.species)), icon: '🔦', title: '¡Se escapó!',
    text: '{t} se escapó de casa. La puerta estaba abierta (alguien la dejó abierta, no diremos quién).',
    choices: [
      { t: 'Buscarl{to} toda la noche', eff: (g, ctx) => { if (U.chance(0.75)) { H.bump(g, ctx, 10); fx.stat(g, 'health', -1); return 'Buscaste a {t} hasta las 4 a.m. Estaba en la casa del vecino comiendo salchichas.'; } MV.removeRel(g, ctx.target); fx.stat(g, 'happy', -12); return 'No encontraste a {t}. Te gusta pensar que vive feliz en una granja.'; } },
      { t: 'Poner carteles', eff: (g, ctx) => { if (U.chance(0.6)) return 'Pusiste carteles. Una señora devolvió a {t} y pidió recompensa en empanadas.'; MV.removeRel(g, ctx.target); fx.stat(g, 'happy', -10); return 'Nadie llamó. {t} desapareció para siempre.'; } },
      { t: 'Esperar a que vuelva solo', eff: (g, ctx) => { if (U.chance(0.45)) return '{t} volvió solo a los tres días, sucio y con un collar nuevo de otra familia.'; MV.removeRel(g, ctx.target); fx.stat(g, 'happy', -10); return '{t} nunca volvió. Esperar no fue buena estrategia.'; } }
    ] });
  ev({ id: 'mascota_truco', age: [3, 110], when: H.has('mascota', (n) => ['perro', 'loro', 'cerdo'].includes(n.species)), target: H.rel('mascota', (n) => ['perro', 'loro', 'cerdo'].includes(n.species)), icon: '🎪', text: (g, ctx) => H.t(g, ctx).species === 'loro' ? '{t} aprendió a decir una grosería. Solo la dice cuando viene la abuela.' : '{t} aprendió un truco nuevo: hacerse el muerto cuando le hablas de bañarse.', auto: { happy: 3, rel: 4 } });

  // — Fama —
  ev({ id: 'paparazzi', age: [16, 110], when: (g) => g.p.fame >= 45, icon: '📸', scene: 'ciudad', title: 'Paparazzi',
    text: 'Un paparazzi te sigue a todas partes, incluso al supermercado.',
    choices: [
      { t: 'Posar con tu mejor ángulo', eff: { fame: 3, happy: 2, msg: 'Posaste con elegancia. Saliste en portada: "Celebridad compra lechuga".' } },
      { t: 'Romperle la cámara', eff: (g) => { fx.stat(g, 'fame', 4); fx.stat(g, 'karma', -3); const fine = U.int(2000, 15000); fx.money(g, -fine); return `Le rompiste la cámara. Te demandó: pagaste ${U.money(fine)}. Titular: "Celebridad violenta".`; } },
      { t: 'Disfrazarte para salir', eff: { happy: -1, msg: 'Saliste con bigote falso y sombrero. Te reconocieron igual. Ahora hay fotos tuyas disfrazado.' } }
    ] });
  ev({ id: 'fan_obsesivo', age: [16, 110], when: (g) => g.p.fame >= 35, icon: '💌', title: 'Fan número uno',
    text: 'Un fan te manda cartas todos los días. La última incluía un mechón de pelo.',
    choices: [
      { t: 'Responderle con amabilidad', eff: { karma: 2, p: 0.7, ok: { msg: 'Le respondiste. Lloró de emoción y prometió respetar tu espacio.' }, ko: { stress: 10, msg: 'Le respondiste. Ahora acampa en tu puerta.' } } },
      { t: 'Ignorar', eff: { stress: 3, msg: 'Lo ignoraste. Las cartas siguen llegando, ahora con dibujos.' } },
      { t: 'Llamar a la policía', eff: { stress: -3, msg: 'La policía le pidió que se alejara. Ahora te manda correos.' } }
    ] });
  ev({ id: 'publicidad', age: [16, 110], when: (g) => g.p.fame >= 25 || g.p.followers >= 20000, icon: '📺', title: 'Contrato publicitario',
    text: (g) => `Una marca de ${U.pick(['yogur probiótico', 'seguros de vida', 'cerveza sin alcohol', 'pañales para adultos', 'colchones', 'tónico capilar'])} te ofrece protagonizar su campaña.`,
    choices: [
      { t: 'Aceptar', eff: (g) => { const amt = Math.round((g.p.fame * 2000 + g.p.followers * 0.3) * U.float(0.6, 1.4)) + 1000; fx.money(g, amt); fx.stat(g, 'fame', 2); return `Aceptaste. Ganaste ${U.money(amt)}. Ahora tu cara está en todos los colectivos.`; } },
      { t: 'Rechazar (tengo principios)', eff: { karma: 1, msg: 'Rechazaste. Tus principios valen más que el dinero. Por ahora.' } }
    ] });
  ev({ id: 'escandalo', age: [18, 110], when: (g) => g.p.fame >= 50, icon: '🗞️', title: 'Escándalo',
    text: (g) => `Una revista publica que ${U.pick(['tienes un hijo secreto con un pingüino', 'te operaste la nariz siete veces', 'odias a los cachorros', 'eres un robot'])}. Es mentira, pero se vende.`,
    choices: [
      { t: 'Demandar a la revista', eff: { p: 0.5, ok: { money: [10000, 150000], msg: 'Ganaste la demanda. La revista te pagó {amount} y una disculpa en letra chiquita.' }, ko: { money: -8000, msg: 'Perdiste la demanda. El juez leía esa revista.' } } },
      { t: 'Reírte en una entrevista', eff: { fame: 3, happy: 2, skills: { carisma: 2 }, msg: 'Te reíste en televisión nacional. El público te amó más.' } },
      { t: 'Desaparecer un tiempo', eff: { fame: -5, stress: -8, msg: 'Te fuiste a una cabaña sin señal. El escándalo murió solo.' } }
    ] });

  // — Dinero y salud —
  ev({ id: 'prestamista', age: [18, 90], when: (g) => g.p.money < -3000, icon: '🦈', title: 'Dinero "fácil"',
    text: 'Las deudas te ahogan. Un tipo con cadena de oro te ofrece $10.000 "sin papeles ni preguntas".',
    choices: [
      { t: 'Aceptar', eff: (g) => { fx.money(g, 10000); MV.EV.later(g, 'prestamista_cobra', U.int(1, 2)); return 'Aceptaste los $10.000. Él sonrió mostrando un diente de oro.'; } },
      { t: 'Rechazar', eff: { stress: 4, msg: 'Rechazaste. Sigues con deudas, pero con todas tus rodillas.' } },
      { t: 'Vender algo para salir del pozo', when: (g) => g.p.assets.length > 0, eff: (g) => { const a = g.p.assets.slice().sort((x, y) => x.value - y.value)[0]; return MV.sys.money.sell(g, a.id); } }
    ] });
  ev({ id: 'vida_calle', age: [16, 110], cd: 1, w: 6, when: (g) => g.p.housing === 'calle', icon: '📦', scene: 'ciudad', title: 'Vivir en la calle',
    text: 'Duermes en un banco de la plaza. Las palomas ya te consideran parte del grupo. ¿Qué haces?',
    choices: [
      { t: 'Pedir ayuda a la familia', when: (g) => MV.rels(g, 'padre').concat(MV.rels(g, 'hermano')).some((x) => x.r.rel >= 25), eff: (g) => { g.p.housing = 'padres'; g.p.rent = null; fx.stat(g, 'happy', 6); return 'Tu familia te recibió con un abrazo, un plato de sopa y un sermón de dos horas.'; } },
      { t: 'Ir a un refugio', eff: { health: 6, happy: 3, karma: 1, msg: 'Pasaste el invierno en un refugio. Comida caliente y una cama de verdad.' } },
      { t: 'Hacer changas por la calle', eff: { money: [300, 1500], health: -1, msg: 'Hiciste changas: cargaste cajas, limpiaste vidrios. Ganaste {amount}.' } },
      { t: 'Alquilar una pieza barata', when: (g) => g.p.money >= 3500, eff: (g) => MV.sys.money.rent(g, 'pieza') + ' Volviste a tener techo.' }
    ] });
  ev({ id: 'alerta_salud', age: [25, 110], when: (g) => g.p.stats.health < 30 && !g.p.prison, icon: '⚠️', text: 'Te sientes muy mal últimamente: cansancio, mareos, crujidos. Quizás deberías ir al médico (pestaña Actividades).', auto: { stress: 4 } });
  ev({ id: 'devolucion_impuestos', age: [20, 90], when: H.anyJob, icon: '💌', text: 'Te devolvieron {amount} de impuestos. Un error a tu favor. Disfrútalo antes de que se den cuenta.', auto: { money: [100, 1500], happy: 3 } });

  // — Familia —
  ev({ id: 'nieto_nace', age: [38, 110], when: H.has('hijo', (n) => n.age >= 20 && n.age <= 45), target: H.rel('hijo', (n) => n.age >= 20 && n.age <= 45), icon: '👶', scene: 'hospital', text: (g, ctx) => `¡{t} tuvo un bebé! Ahora eres ${U.gw(g.p.gender, 'abuelo', 'abuela')}. Ya estás dando consejos que nadie pidió.`, auto: { happy: 10, rel: 6, count: 'nietos' } });
  ev({ id: 'hermano_boda', age: [16, 90], when: H.has('hermano', (n) => n.age >= 22 && n.age <= 50), target: H.rel('hermano', (n) => n.age >= 22 && n.age <= 50), icon: '💒', scene: 'boda', text: '{t} se casó. Tú llevaste los anillos y los perdiste durante 10 minutos de pánico.', auto: { happy: 4, rel: 4 } });
  ev({ id: 'abuelo_regalo', age: [5, 25], when: H.has('abuelo', (n) => n.money > 500), target: H.rel('abuelo', (n) => n.money > 500), icon: '🎁', text: '{t} te regaló {amount} "para que te compres algo lindo". Y un suéter que tejió.', auto: { money: [20, 400], happy: 3, rel: 3 } });
  ev({ id: 'padre_enfermo', age: [15, 80], when: H.has('padre', (n) => n.age >= 55), target: H.rel('padre', (n) => n.age >= 55), icon: '🏥', scene: 'hospital', title: 'Malas noticias',
    text: '{t} está internad{to} en el hospital. Los médicos dicen que es delicado.',
    choices: [
      { t: 'Quedarme a su lado', eff: (g, ctx) => { H.bump(g, ctx, 15); fx.stat(g, 'stress', 8); const n = H.t(g, ctx); n.health = U.clamp(n.health + 10, 0, 100); return 'Pasaste noches enteras en el hospital con {t}. Se recuperó. Te agradeció con lágrimas.'; } },
      { t: 'Pagar el mejor tratamiento ($8.000)', when: (g) => g.p.money >= 8000, eff: (g, ctx) => { fx.money(g, -8000); H.bump(g, ctx, 10); const n = H.t(g, ctx); n.health = U.clamp(n.health + 25, 0, 100); return 'Pagaste el mejor tratamiento. {t} se recuperó como nuevo.'; } },
      { t: 'Estoy muy ocupad{o}', eff: (g, ctx) => { H.bump(g, ctx, -20); fx.stat(g, 'karma', -4); const n = H.t(g, ctx); n.health = U.clamp(n.health - 10, 0, 100); return 'No fuiste a verl{to}. {t} lo recordará. El resto de la familia también.'; } }
    ] });
  ev({ id: 'reunion_familiar', age: [6, 110], when: (g) => MV.rels(g, MV.FAMILY).length >= 3, icon: '🍗', scene: 'hogar', title: 'Almuerzo familiar',
    text: 'Almuerzo familiar del domingo. Tu tío empieza a hablar de política.',
    choices: [
      { t: 'Debatir con argumentos', eff: { p: 0.3, ok: { skills: { carisma: 3 }, smarts: 1, msg: 'Ganaste el debate. Tu tío admitió que tenías razón (es la primera vez en la historia).' }, ko: { stress: 6, msg: 'El debate terminó con tu tío gritando y tu abuela llorando. Postre cancelado.' } } },
      { t: 'Cambiar de tema hábilmente', eff: { skills: { carisma: 2 }, msg: '"¿Y cómo están los perros?" Funcionó. Hablaron de perros dos horas.' } },
      { t: 'Comer en silencio', eff: { health: -1, happy: 2, msg: 'Comiste tres platos en silencio total. Ganador moral del almuerzo.' } }
    ] });

  // — Cárcel —
  ev({ id: 'carcel_companero', prison: true, age: [10, 110], icon: '🛏️', scene: 'carcel', title: 'Compañero de celda',
    text: (g) => `Tu nuevo compañero de celda, ${MV.randomFirst('m', g.p.country)} "${U.pick(['El Martillo', 'Cucaracha', 'Dedos', 'El Abuelo', 'Sonrisas'])}", ronca como un oso y habla dormido.`,
    choices: [
      { t: 'Hacerte su amigo', eff: (g) => { const n = MV.newNPC(g, { gender: 'm', age: U.int(20, 60), country: g.p.country, job: 'Recluso' }); MV.addRel(g, n, 'amigo', U.int(40, 70)); fx.skill(g, 'crimen', 2); return `Te hiciste amigo de ${n.first}. Te enseñó a abrir cerraduras con un clip.`; } },
      { t: 'Pedir cambio de celda', eff: { p: 0.4, ok: { stress: -5, msg: 'Te cambiaron de celda. El nuevo compañero solo silba. Mejora.' }, ko: { stress: 5, msg: 'El guardia se rió. Te quedas con el oso.' } } },
      { t: 'Marcar territorio', eff: { p: 0.5, ok: { happy: 3, msg: 'Le dejaste claro quién manda. Ahora ronca más bajito.' }, ko: { health: -10, msg: 'Intentaste marcar territorio. Él marcó tu cara.' } } }
    ] });
  ev({ id: 'carcel_comida', prison: true, age: [10, 110], icon: '🥣', scene: 'carcel', text: (g) => `La comida de hoy: ${U.pick(['algo gris con grumos', 'sopa de "carne" (no se especifica de qué)', 'puré de algo que se movía', 'pan duro con esperanza'])}. Tu estómago llora.`, auto: { health: -1, happy: -2 } });
  ev({ id: 'carcel_visita', prison: true, age: [10, 110], when: H.has(['padre', 'conyuge', 'hijo', 'hermano', 'pareja'], (n, r) => r.rel >= 40), target: H.rel(['padre', 'conyuge', 'hijo', 'hermano', 'pareja'], (n, r) => r.rel >= 40), icon: '🫂', scene: 'carcel', text: '{t} vino a visitarte. Lloró, te trajo comida casera y te dijo que te espera.', auto: { happy: 8, rel: 5 } });
  ev({ id: 'carcel_pandilla', prison: true, age: [14, 110], icon: '⛓️', scene: 'carcel', title: 'Protección',
    text: 'Una pandilla te exige pagar "protección" o atenerte a las consecuencias.',
    choices: [
      { t: 'Pagar ($1.000)', when: (g) => g.p.money >= 1000, eff: { money: -1000, msg: 'Pagaste. Ahora tienes "amigos" que te cuidan las espaldas.' } },
      { t: 'Pelear', eff: { p: (g) => 0.35 + g.p.skills.deporte / 200, ok: { happy: 6, skills: { crimen: 2 }, msg: 'Peleaste contra tres. Ganaste. Te dejan en paz y te llaman "Tormenta".' }, ko: { health: -18, msg: 'Peleaste. Perdiste. Pasaste un mes en la enfermería.' } } },
      { t: 'Unirte a ellos', eff: (g) => { if (g.p.prison) g.p.prison.gang = true; fx.stat(g, 'karma', -5); fx.skill(g, 'crimen', 3); return 'Te uniste a la pandilla. Ahora tú cobras protección.'; } }
    ] });
  ev({ id: 'carcel_tatuaje', prison: true, age: [14, 110], icon: '🖊️', scene: 'carcel', title: 'Arte carcelario',
    text: 'Un recluso ofrece tatuarte con una birome y una aguja de coser.',
    choices: [
      { t: 'Aceptar', eff: (g) => { if (U.chance(0.2)) MV.sys.health.add(g, 'ets'); fx.stat(g, 'looks', U.int(-3, 2)); return U.pick(['Te tatuó una calavera. O un hongo. No queda claro.', 'Te tatuó "MAMÁ" pero le faltó una A.']); } },
      { t: 'Rechazar', eff: { msg: 'Rechazaste. Tu piel y tu salud te lo agradecen.' } }
    ] });
  ev({ id: 'carcel_guardia', prison: true, age: [14, 110], icon: '💂', scene: 'carcel', title: 'Un guardia "amigo"',
    text: 'Un guardia te ofrece privilegios (celular, comida decente) a cambio de dinero.',
    choices: [
      { t: 'Pagar ($2.000)', when: (g) => g.p.money >= 2000, eff: { money: -2000, happy: 8, msg: 'Ahora comes milanesas y ves series. La vida en prisión mejoró mucho.' } },
      { t: 'Denunciarlo al director', eff: (g) => { if (g.p.prison) g.p.prison.behavior = U.clamp(g.p.prison.behavior + 15, 0, 100); fx.stat(g, 'karma', 3); return 'Denunciaste al guardia. El director te anotó buena conducta. Los guardias te odian.'; } },
      { t: 'Ignorarlo', eff: { msg: 'Lo ignoraste. Sigues comiendo la sopa gris.' } }
    ] });
  ev({ id: 'carcel_estudio', prison: true, age: [16, 110], icon: '🎓', scene: 'carcel', title: 'Programa educativo',
    text: 'La cárcel ofrece un programa para terminar los estudios.',
    choices: [
      { t: 'Inscribirme', eff: (g) => { fx.stat(g, 'smarts', U.int(3, 6)); if (g.p.prison) g.p.prison.behavior = U.clamp(g.p.prison.behavior + 10, 0, 100); if (!g.p.edu.done.includes('secundaria') && g.p.age >= 17 && U.chance(0.5)) { g.p.edu.done.push('secundaria'); if (!g.p.edu.done.includes('primaria')) g.p.edu.done.push('primaria'); return '¡Terminaste la secundaria en prisión! El director te dio un diploma y un apretón de manos.'; } return 'Estudiaste mucho. Ya puedes explicar el teorema de Pitágoras a tus compañeros.'; } },
      { t: 'Prefiero el patio', eff: { health: 2, msg: 'Preferiste el patio. Tus bíceps lo agradecen.' } }
    ] });

  // — Consecuencias programadas (manuales, se disparan con EV.later) —
  ev({ id: 'banda_exito', manual: true, icon: '🎶', title: 'Del pasado',
    text: 'Una canción de tu vieja banda del garaje se volvió viral en internet. ¡Alguien la subió!',
    choices: [
      { t: 'Reunir a la banda para una gira', eff: (g) => { fx.stat(g, 'fame', U.int(8, 18)); const amt = U.int(5000, 80000); fx.money(g, amt); fx.skill(g, 'musica', 4); return `Hicieron una gira nostálgica. Ganaste ${U.money(amt)} y lloraste en cada concierto.`; } },
      { t: 'Negar que eras tú', eff: { happy: -1, msg: 'Negaste ser la voz de esa canción. Tu madre te delató en los comentarios.' } }
    ] });
  ev({ id: 'cazatalentos', manual: true, icon: '🔭', title: 'Cazatalentos',
    text: 'Un cazatalentos te vio entrenar y quiere hacerte una prueba para el deporte profesional.',
    choices: [
      { t: 'Hacer la prueba', eff: (g) => MV.sys.career.audition(g, 'atleta') || 'Aceptaste la prueba.' },
      { t: 'No me interesa', eff: { msg: 'Lo rechazaste. Seguirás jugando los domingos con tus amigos.' } }
    ] });
  ev({ id: 'documento_falso_cae', manual: true, icon: '🚔', text: 'La policía te encontró el documento falso en un control. Multa de {amount} y una llamada a tus padres.', auto: { money: [-300, -100], happy: -6, then: (g) => { MV.rels(g, 'padre').forEach((x) => { x.r.rel = U.clamp(x.r.rel - 10, 0, 100); }); } } });
  ev({ id: 'amigo_devuelve', manual: true, icon: '🤝', text: (g, ctx) => { const n = H.t(g, ctx); return n && n.alive ? `${n.first} te devolvió el préstamo. ¡Existen los milagros!` : 'Nunca te devolvieron aquel préstamo.'; }, auto: (g, ctx) => { const n = H.t(g, ctx); if (n && n.alive && U.chance(0.6)) { fx.money(g, 1000); H.bump(g, ctx, 6); return '+$1.000.'; } H.bump(g, ctx, -15); return 'Bueno... en realidad no. Inventó una excusa con su abuela. Otra vez.'; } });
  ev({ id: 'venganza_mafia', manual: true, icon: '🐟', title: 'Un mensaje',
    text: 'Encontraste un pescado envuelto en papel de diario en tu puerta. La familia no olvida.',
    choices: [
      { t: 'Mudarme lejos', eff: { money: -3000, stress: 10, msg: 'Te mudaste de barrio con nombre falso. Ahora miras por la ventana cada 5 minutos.' } },
      { t: 'Pedir protección policial', eff: { p: 0.6, ok: { msg: 'La policía te protegió. La familia perdió interés.' }, ko: { health: -25, msg: 'La protección policial duró dos días. La familia, más.' } } },
      { t: 'Cocinar el pescado', eff: { happy: 2, skills: { cocina: 2 }, msg: 'Lo cocinaste a la parrilla con limón. Si la mafia te va a amenazar, al menos que sea con proteína.' } }
    ] });
  ev({ id: 'prestamista_cobra', manual: true, icon: '🦈', title: 'Día de cobro',
    text: 'El prestamista volvió. Quiere $15.000. Hoy.',
    choices: [
      { t: 'Pagar $15.000', eff: { money: -15000, msg: 'Pagaste. Te devolvió la sonrisa del diente de oro.' } },
      { t: 'Huir', eff: { p: 0.5, ok: { stress: 10, msg: 'Huiste por la ventana del baño. Sigues huyendo, en general.' }, ko: { health: -25, money: -5000, msg: 'No llegaste lejos. Te quebraron dos dedos y te sacaron lo que tenías.' } } },
      { t: 'Ofrecer trabajar para él', eff: { karma: -6, skills: { crimen: 4 }, msg: 'Ahora cobras deudas para él. La vida da vueltas.' } }
    ] });
})(window.MV = window.MV || {});
