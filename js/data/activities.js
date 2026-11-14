/* Mil Vidas — actividades (pestaña Actividades). Cada una: {id, cat, icon, label, sub, minAge, maxAge, when, limit, opts, run}. */
(function (MV) {
  'use strict';
  const U = MV.U;
  const fx = MV.fx;

  MV.ACT_CATS = [
    { id: 'infancia', name: 'Cosas de niños', icon: '🧸', min: 3, max: 12 },
    { id: 'mente', name: 'Mente y cuerpo', icon: '🧘', min: 6 },
    { id: 'salud', name: 'Salud', icon: '🏥', min: 0 },
    { id: 'amor', name: 'Amor y amistad', icon: '💘', min: 13 },
    { id: 'ocio', name: 'Ocio y vicios', icon: '🎉', min: 8 },
    { id: 'azar', name: 'Azar y apuestas', icon: '🎰', min: 18 },
    { id: 'crimen', name: 'Crimen', icon: '🦹', min: 10 },
    { id: 'tramites', name: 'Trámites y vida', icon: '📋', min: 16 }
  ];

  const ACTS = [];
  const A = (o) => ACTS.push(o);
  const bets = (g) => [100, 1000, 10000, 100000].filter((v) => g.p.money >= v).map((v) => ({ id: v, icon: '🪙', label: `Apostar ${U.money(v)}` }))
    .concat(g.p.money > 0 ? [{ id: 'todo', icon: '🔥', label: `Apostarlo todo (${U.money(g.p.money)})` }] : []);
  const betAmt = (g, o) => (o === 'todo' ? Math.max(0, g.p.money) : +o);
  const gamble = (g, amt) => { fx.addic(g, 'apuestas', amt >= 10000 ? 8 : 4); g.p.counters.apuestas = (g.p.counters.apuestas || 0) + 1; };

  // ——— Cosas de niños ———
  A({ id: 'jugar_afuera', cat: 'infancia', icon: '🌳', label: 'Jugar afuera', sub: '+salud, +felicidad', limit: 3,
    run: (g) => { fx.stat(g, 'health', U.int(1, 3)); fx.stat(g, 'happy', U.int(2, 5)); fx.skill(g, 'deporte', 1); return U.pick(['Jugaste a la pelota hasta que se hizo de noche.', 'Trepaste un árbol. Bajar fue otra historia.', 'Encontraste un bicho rarísimo y lo adoptaste por 10 minutos.', 'Jugaste a la mancha con los vecinos. Hiciste trampa.']); } });
  A({ id: 'berrinche', cat: 'infancia', icon: '😭', label: 'Hacer un berrinche', sub: 'Técnica de negociación', limit: 2,
    run: (g) => { if (U.chance(0.45)) { fx.stat(g, 'happy', 5); return U.pick(['Te tiraste al piso del supermercado. Funcionó: te compraron el chocolate.', 'Gritaste tan fuerte que te dieron lo que querías solo para que pararas.']); } MV.rels(g, 'padre').forEach((x) => { x.r.rel = U.clamp(x.r.rel - 4, 0, 100); }); fx.stat(g, 'happy', -3); return 'Hiciste un berrinche épico. Te mandaron a tu cuarto. Sin postre.'; } });
  A({ id: 'dibujos', cat: 'infancia', icon: '📺', label: 'Ver dibujos animados', sub: '+felicidad', limit: 2,
    run: (g) => { fx.stat(g, 'happy', U.int(2, 4)); return U.pick(['Viste dibujos toda la mañana en pijama. Vida perfecta.', 'Viste el mismo episodio 14 veces. Te lo sabes de memoria.', 'Los dibujos te enseñaron una lección de amistad. Y una canción pegadiza.']); } });
  A({ id: 'travesura', cat: 'infancia', icon: '😈', label: 'Hacer una travesura', sub: 'Elige tu caos', limit: 2,
    opts: () => [{ id: 'pared', icon: '🖍️', label: 'Dibujar en la pared' }, { id: 'llaves', icon: '🔑', label: 'Esconder las llaves de tus padres' }, { id: 'gato', icon: '✂️', label: 'Cortarle el pelo al gato (o a tu hermano)' }, { id: 'timbre', icon: '🔔', label: 'Tocar timbres y salir corriendo' }],
    run: (g, o) => { fx.stat(g, 'karma', -1); fx.stat(g, 'happy', U.int(2, 5)); const caught = U.chance(0.5); if (caught) MV.rels(g, 'padre').forEach((x) => { x.r.rel = U.clamp(x.r.rel - 5, 0, 100); });
      const t = { pared: 'Dibujaste un mural en la pared del living. Tu madre no apreció el arte.', llaves: 'Escondiste las llaves. Tus padres llegaron tarde al trabajo. Nunca lo supieron.', gato: 'Le cortaste el flequillo a tu hermano. Parece un hongo.', timbre: 'Tocaste todos los timbres de la cuadra y huiste. Adrenalina pura.' }[o];
      return t + (caught ? ' Te atraparon y te castigaron.' : ''); } });
  A({ id: 'leer_cuentos', cat: 'infancia', icon: '📕', label: 'Leer un libro de cuentos', sub: '+inteligencia', limit: 2,
    run: (g) => { fx.stat(g, 'smarts', U.int(1, 3)); return U.pick(['Leíste un libro de dragones. Ahora quieres uno.', 'Leíste un libro de piratas y te pusiste un parche todo el día.', 'Leíste una enciclopedia de dinosaurios. Sabes más que tu maestra.']); } });
  A({ id: 'golosinas', cat: 'infancia', icon: '🍭', label: 'Pedir golosinas a los abuelos', sub: 'Siempre dicen que sí', limit: 1, when: (g) => MV.rels(g, 'abuelo').length > 0,
    run: (g) => { const ab = U.pick(MV.rels(g, 'abuelo')); const amt = U.int(5, 60); fx.money(g, amt); fx.stat(g, 'happy', 4); ab.r.rel = U.clamp(ab.r.rel + 4, 0, 100); return `${ab.n.first} te dio ${U.money(amt)} "para golosinas" y te pellizcó el cachete.`; } });
  A({ id: 'puesto_limonada', cat: 'infancia', icon: '🍋', label: 'Montar un puesto de limonada', sub: 'Tu primer negocio', minAge: 6, limit: 1,
    run: (g) => { const amt = U.int(0, 40) + Math.round(g.p.skills.carisma / 4); fx.money(g, amt); fx.skill(g, 'carisma', 2); return amt > 20 ? `Vendiste limonada y ganaste ${U.money(amt)}. Futuro magnate.` : `Vendiste dos vasos. Uno a tu madre. Ganaste ${U.money(amt)}.`; } });

  // ——— Mente y cuerpo ———
  A({ id: 'hobby', cat: 'mente', icon: '🎨', label: 'Practicar un hobby', sub: 'Cada año seguido suma racha y baja más el estrés', minAge: 8, limit: 2,
    opts: (g) => Object.keys(MV.HOBBIES).map((k) => { const s = ((g.p.hobbies || {})[k] || {}).streak || 0; return { id: k, icon: MV.HOBBIES[k].icon, label: MV.HOBBIES[k].name, sub: s ? `Racha de ${s} año${s === 1 ? '' : 's'}` : 'Sin racha todavía' }; }),
    run: (g, k) => MV.sys.wellbeing.hobby(g, k) });
  A({ id: 'clases', cat: 'mente', icon: '🧑‍🏫', label: 'Tomar una clase', sub: '$200 · baile, idiomas, manejo o cocina', minAge: 10, limit: 2, when: (g) => g.p.money >= 200,
    opts: () => [{ id: 'baile', icon: '💃', label: 'Baile', sub: '+carisma, +deporte' }, { id: 'idiomas', icon: '🗣️', label: 'Idiomas', sub: '+idiomas' },
      { id: 'manejo', icon: '🚗', label: 'Manejo', sub: 'Para no chocar el primer día' }, { id: 'cocina', icon: '👨‍🍳', label: 'Cocina', sub: '+cocina, +salud' }],
    run: (g, k) => { fx.money(g, -200);
      if (k === 'baile') { fx.skill(g, 'carisma', 2); fx.skill(g, 'deporte', 1); fx.stat(g, 'happy', 3); return U.pick(['Aprendiste salsa. Pisaste a tu pareja de baile 11 veces, pero con ritmo.', 'Fuiste a clase de tango. El profesor dijo que "tienes actitud". No dijo nada del talento.']); }
      if (k === 'idiomas') { fx.skill(g, 'idiomas', 4); return U.pick(['Clase de italiano: ya sabes pedir una pizza y quejarte de ella.', 'Clase de japonés: aprendiste a decir "gracias" y "perdón". Lo básico para sobrevivir.']); }
      if (k === 'manejo') { fx.stat(g, 'smarts', 1); fx.stat(g, 'stress', -1); return g.p.age < 16 ? 'Te dejaron manejar en un estacionamiento vacío. Le diste a un cono. El cono se lo merecía.' : U.pick(['Practicaste estacionar en paralelo. A la sexta, salió.', 'Tu instructor frenó con su pedal 14 veces. Dice que vas mejorando.']); }
      fx.skill(g, 'cocina', 4); fx.stat(g, 'health', 1); return U.pick(['Aprendiste a hacer pasta casera. Tu cocina parece una nevada de harina.', 'Hiciste tu primer flan sin que se desarme. Casi lloras.']); } });
  A({ id: 'museo', cat: 'mente', icon: '🏛️', label: 'Ir a un museo', sub: '$20 · +inteligencia, +arte', minAge: 6, limit: 1, when: (g) => g.p.money >= 20,
    run: (g) => { fx.money(g, -20); fx.stat(g, 'smarts', U.int(1, 3)); fx.skill(g, 'arte', 1);
      return U.pick(['Miraste un cuadro 20 minutos para parecer culto. Te terminó gustando.', 'Viste un esqueleto de dinosaurio. Te sentiste joven.', 'Una obra de arte moderno era un balde. O eso, o el balde del de limpieza.']); } });
  A({ id: 'maraton', cat: 'mente', icon: '🏃', label: 'Correr un maratón', sub: '42 km · necesita Deporte 40+', minAge: 16, limit: 1,
    check: (g) => (g.p.skills.deporte < 40 ? 'Necesitas Deporte 40+ para correr 42 km. Tus rodillas ya lo saben.' : null),
    run: (g) => { fx.skill(g, 'deporte', 3); fx.stat(g, 'health', U.int(2, 4));
      if (U.chance(0.04)) { MV.sys.health.add(g, 'fractura'); return 'En el kilómetro 30 tu pie dijo basta. Terminaste en ambulancia, pero con la medalla.'; }
      fx.stat(g, 'happy', U.int(6, 10)); if (U.chance(0.1)) fx.stat(g, 'fame', 1);
      return U.pick(['Terminaste el maratón en 4 horas y 12 minutos. Lloraste en la meta.', 'Corriste los 42 km. Ahora caminas como un pingüino, pero orgulloso.', 'Te pasó un señor de 70 años disfrazado de banana. Igual llegaste.']); } });
  A({ id: 'gimnasio', cat: 'mente', icon: '🏋️', label: 'Ir al gimnasio', sub: '+salud, +apariencia', minAge: 13, limit: 3,
    run: (g) => { fx.stat(g, 'health', U.int(1, 4)); fx.stat(g, 'looks', U.int(0, 2)); fx.stat(g, 'stress', -3); fx.skill(g, 'deporte', 2);
      if (U.chance(0.04)) { MV.sys.health.add(g, 'fractura'); return 'Intentaste levantar más peso del que podías. Crack.'; }
      return U.pick(['Fuiste al gimnasio y te sacaste 40 selfies.', 'Hiciste piernas. Mañana no podrás bajar escaleras.', 'Un señor de 70 años levantó más peso que tú. Humildad.', 'Entrenaste fuerte. Te sientes un semidiós (con calambres).']); } });
  A({ id: 'correr', cat: 'mente', icon: '🏃', label: 'Salir a correr', sub: '+salud', minAge: 10, limit: 3,
    run: (g) => { fx.stat(g, 'health', U.int(1, 3)); fx.stat(g, 'stress', -4); fx.skill(g, 'deporte', 1); return U.pick(['Corriste 5 km. Bueno, 3. Bueno, caminaste.', 'Un perro te persiguió y batiste tu récord personal.', 'Corriste al amanecer. Te sientes protagonista de película.']); } });
  A({ id: 'meditar', cat: 'mente', icon: '🧘', label: 'Meditar', sub: '-estrés, +karma', minAge: 8, limit: 2,
    run: (g) => { fx.stat(g, 'stress', -U.int(6, 12)); fx.stat(g, 'happy', U.int(1, 4)); fx.stat(g, 'karma', 1); return U.pick(['Meditaste 20 minutos. Pensaste en pizza 19 de ellos.', 'Alcanzaste la paz interior. Duró hasta que sonó el teléfono.', 'Hiciste yoga. Te quedaste trabado en una postura.']); } });
  A({ id: 'biblioteca', cat: 'mente', icon: '📚', label: 'Ir a la biblioteca', sub: '+inteligencia', minAge: 6, limit: 3,
    run: (g) => { fx.stat(g, 'smarts', U.int(1, 3)); return U.pick(['Leíste sobre agujeros negros. Ahora tienes una crisis existencial.', 'Leíste una novela entera en una tarde.', 'Te quedaste dormido en la sección de filosofía. Muy apropiado.', 'Aprendiste algo nuevo que nadie te preguntará nunca.']); } });
  A({ id: 'dieta', cat: 'mente', icon: '🥗', label: 'Hacer dieta', sub: '+salud, +apariencia, -felicidad', minAge: 14, limit: 1,
    run: (g) => { fx.stat(g, 'health', U.int(1, 4)); fx.stat(g, 'looks', U.int(1, 3)); fx.stat(g, 'happy', -U.int(1, 4)); return U.pick(['Comiste ensalada todo el mes. Sueñas con milanesas.', 'Dejaste el azúcar. Ahora odias a todo el mundo, pero te ves bien.']); } });
  A({ id: 'club_deporte', cat: 'mente', icon: '🏟️', label: 'Entrenar en un club deportivo', sub: 'Elige un deporte (cuota anual)', minAge: 18, limit: 1,
    when: (g) => !MV.sys.sports.isPro(g.p),
    opts: (g) => Object.keys(MV.SPORTS).map((k) => ({ id: k, icon: MV.SPORTS[k].icon, label: MV.SPORTS[k].club, sub: MV.sys.sports.clubSports(g.p).includes(k) ? 'Ya entrenas aquí' : `Tu nivel: ${MV.sys.sports.rating(g, k)}/100, cuota ${U.money(MV.SPORTS[k].clubCost || 300)}/año` })),
    check: (g, k) => (k == null ? null : MV.sys.edu.joinRefusal(g, 'sport:' + k)),
    run: (g, k) => MV.sys.sports.joinClub(g, k) });
  A({ id: 'practicar', cat: 'mente', icon: '🎯', label: 'Practicar una habilidad', sub: 'Elige qué entrenar', minAge: 6, limit: 3,
    opts: () => Object.keys(MV.SKILLS).filter((k) => k !== 'crimen').map((k) => ({ id: k, icon: MV.SKILLS[k].icon, label: MV.SKILLS[k].name })),
    run: (g, k) => {
      fx.skill(g, k, U.int(3, 6)); fx.stat(g, 'stress', 1);
      const T = { musica: ['Practicaste guitarra. Los vecinos pusieron música más fuerte.', 'Tocaste el piano durante horas. Te salió una canción triste.'], deporte: ['Entrenaste en la plaza. Un niño te ganó.', 'Practicaste tiros al arco. Rompiste una ventana.'], cocina: ['Cocinaste un risotto. Era arroz con queso, pero con orgullo.', 'Hiciste pan casero. Tu cocina parece la escena de un crimen.'], programacion: ['Programaste una app que no sirve para nada. Funciona perfecto.', 'Pasaste 6 horas buscando un punto y coma.'], arte: ['Pintaste un cuadro abstracto. Nadie entiende qué es. Tú tampoco.', 'Dibujaste retratos de tu familia. Se ofendieron.'], carisma: ['Practicaste discursos frente al espejo. El espejo quedó convencido.', 'Fuiste a un taller de oratoria. Ya no dices "eh" cada tres palabras.'], idiomas: ['Estudiaste un idioma con una app. El búho te amenaza si faltas.', 'Viste series en otro idioma sin subtítulos. Entendiste el 30%.'] };
      return U.pick(T[k] || ['Practicaste mucho.']);
    } });

  // ——— Salud ———
  A({ id: 'medico', cat: 'salud', icon: '🩺', label: 'Tratar una enfermedad', sub: 'Elige condición y tratamiento', when: (g) => g.p.conds.length > 0, limit: 4,
    opts: (g) => {
      const out = [];
      g.p.conds.forEach((c) => {
        const C = MV.CONDITIONS[c.id];
        Object.keys(MV.sys.health.TIERS).forEach((t) => {
          const T = MV.sys.health.TIERS[t];
          const ins = MV.sys.insurance.healthFactor(g) < 1;
          const cost = g.p.age < 18 ? 0 : Math.round(C.cost * T.cost * MV.sys.insurance.healthFactor(g));
          out.push({ id: c.id + '|' + t, icon: C.icon, label: `${C.name}: ${T.name}`, sub: g.p.age < 18 ? 'Pagan tus padres' : `${U.money(cost)}${ins ? ' (con seguro)' : ''}` });
        });
      });
      return out;
    },
    run: (g, o) => { const [id, tier] = String(o).split('|'); return MV.sys.health.treat(g, id, tier); } });
  A({ id: 'chequeo', cat: 'salud', icon: '🩻', label: 'Chequeo médico general', sub: '$200 · prevenir', limit: 1,
    run: (g) => { if (g.p.age >= 18) fx.money(g, -200); fx.stat(g, 'health', U.int(1, 3)); fx.stat(g, 'stress', -2); if (g.p.age > 40 && U.chance(0.15)) { const c = U.pick(['hipertension', 'diabetes', 'cardiopatia']); MV.sys.health.add(g, c); return 'El chequeo detectó algo a tiempo. Mejor saberlo.'; } return U.pick(['El médico dijo que estás "bien para tu edad". No sabes cómo tomarlo.', 'Todo en orden. El médico te recetó "caminar más".', 'Te pesaron. No hablemos de eso.']); } });
  A({ id: 'psicologo', cat: 'salud', icon: '🛋️', label: 'Ir al psicólogo', sub: '$600 · -estrés, cura emocional', minAge: 8, limit: 2,
    run: (g) => { if (g.p.age >= 18) fx.money(g, -600); fx.stat(g, 'stress', -U.int(8, 15)); fx.stat(g, 'happy', U.int(2, 6));
      const emo = g.p.conds.find((c) => ['depresion', 'ansiedad', 'insomnio'].includes(c.id));
      if (emo && U.chance(0.4)) { MV.sys.health.remove(g, emo.id); return `La terapia funcionó: superaste tu ${MV.CONDITIONS[emo.id].name.toLowerCase()}.`; }
      return U.pick(['Hablaste de tu infancia durante una hora. Todo es culpa de tu madre, al parecer.', 'Tu psicólogo te dijo "¿y eso cómo te hace sentir?" 12 veces. Funcionó.', 'Lloraste en terapia. Saliste más liviano.']); } });
  A({ id: 'cirugia', cat: 'salud', icon: '💉', label: 'Cirugía estética', sub: 'Riesgosa', minAge: 18, limit: 1,
    opts: (g) => [{ id: 'nariz', icon: '👃', label: 'Rinoplastia ($6.000)', c: 6000 }, { id: 'botox', icon: '💉', label: 'Bótox ($1.500)', c: 1500 }, { id: 'lipo', icon: '🩱', label: 'Liposucción ($9.000)', c: 9000 }, { id: 'total', icon: '✨', label: 'Rejuvenecimiento total ($40.000)', c: 40000 }].filter((o) => g.p.money >= o.c),
    run: (g, o) => {
      const cost = { nariz: 6000, botox: 1500, lipo: 9000, total: 40000 }[o]; fx.money(g, -cost);
      if (U.chance(o === 'total' ? 0.15 : 0.12)) { fx.stat(g, 'looks', -U.int(8, 20)); fx.stat(g, 'health', -U.int(3, 10)); fx.stat(g, 'happy', -10); return U.pick(['La cirugía salió mal. Pareces un personaje de cera.', 'El cirujano estornudó en el peor momento. Resultado: asimétrico.']); }
      const gain = { nariz: [5, 12], botox: [2, 6], lipo: [5, 10], total: [12, 25] }[o];
      fx.stat(g, 'looks', U.int(gain[0], gain[1])); fx.stat(g, 'happy', 6);
      return U.pick(['La cirugía fue un éxito. Tu reflejo te guiña el ojo.', 'Quedaste espectacular. Tus amigos preguntan si te "hiciste algo". Lo niegas.']);
    } });
  A({ id: 'rehab', cat: 'salud', icon: '🌱', label: 'Ir a rehabilitación', sub: '$5.000 · combatir adicciones', minAge: 14, limit: 1, when: (g) => Math.max.apply(null, Object.values(g.p.addic)) >= 20,
    opts: (g) => Object.keys(g.p.addic).filter((k) => g.p.addic[k] >= 20).map((k) => ({ id: k, icon: { alcohol: '🍺', drogas: '💊', apuestas: '🎰', tabaco: '🚬' }[k], label: `Adicción: ${k} (${Math.round(g.p.addic[k])})` })),
    run: (g, k) => {
      if (g.p.age >= 18) fx.money(g, -5000);
      if (U.chance(0.55 + g.p.stats.smarts / 400)) { const was = g.p.addic[k]; g.p.addic[k] = U.int(0, 8); fx.stat(g, 'health', U.int(3, 10)); fx.stat(g, 'happy', 6); if (was >= 50) MV.ach.unlock(g, 'rehab'); return `Completaste la rehabilitación por ${k}. Un día a la vez.`; }
      g.p.addic[k] = Math.max(0, g.p.addic[k] - 15);
      return 'Te escapaste de rehabilitación por una ventana del baño. Algo avanzaste, igual.';
    } });

  // ——— Amor y amistad ———
  A({ id: 'app_citas', cat: 'amor', icon: '📱', label: 'Usar una app de citas', sub: 'Desliza a ver qué sale', minAge: 18, limit: 3,
    run: (g) => { const n = MV.sys.rels.candidate(g); MV.EV.push(g, 'match', { target: n.id }, true); return ''; } });
  A({ id: 'conocer_teen', cat: 'amor', icon: '💌', label: 'Declararte a alguien de la escuela', sub: 'Valentía adolescente', minAge: 13, maxAge: 17, limit: 1,
    run: (g) => { const n = MV.sys.rels.candidate(g); if (U.chance(0.3 + g.p.stats.looks / 250 + g.p.skills.carisma / 300)) return MV.sys.rels.startDating(g, n); delete g.people[n.id]; fx.stat(g, 'happy', -6); return U.pick(['Te declaraste con una carta. La leyó en voz alta frente a todo el curso.', 'Le dijiste lo que sentías y respondió "ay, qué tierno". Derrota.', 'Te temblaba la voz tanto que no se entendió nada. Lo intentarás otro año.']); } });
  A({ id: 'discoteca', cat: 'amor', icon: '🪩', label: 'Ir a la discoteca', sub: 'La noche es joven', minAge: 18, limit: 2,
    opts: (g) => [{ id: 'bailar', icon: '💃', label: 'Bailar toda la noche' }, { id: 'beber', icon: '🍸', label: 'Beber hasta olvidar' }, { id: 'ligar', icon: '😏', label: 'Buscar compañía para esta noche' }, { id: 'pastilla', icon: '💊', label: 'Aceptar "algo" de un desconocido' }],
    run: (g, o) => {
      const p = g.p; fx.money(g, -U.int(30, 120));
      if (o === 'bailar') { fx.stat(g, 'happy', U.int(3, 7)); fx.stat(g, 'health', 1); if (U.chance(0.25)) { const n = MV.sys.rels.candidate(g); MV.addRel(g, n, 'amigo', U.int(45, 70)); return `Bailaste como si nadie te viera. ${n.first} te vio y ahora es tu amig${U.gw(n.gender, 'o', 'a')}.`; } return U.pick(['Bailaste reguetón, cumbia y una canción de los 80 que nadie más conocía.', 'Inventaste un paso de baile. Tres personas lo copiaron.']); }
      if (o === 'beber') { fx.addic(g, 'alcohol', U.int(5, 10)); fx.stat(g, 'happy', U.int(2, 6)); fx.stat(g, 'health', -U.int(1, 3)); if (U.chance(0.1)) { fx.stat(g, 'health', -8); return 'Bebiste tanto que terminaste en una ambulancia. Los paramédicos te conocen.'; } return U.pick(['Despertaste abrazado a un inodoro ajeno.', 'No recuerdas nada, pero tienes 38 fotos con un señor disfrazado de pollo.', 'Bebiste, cantaste y lloraste por tu ex. Noche completa.']); }
      if (o === 'ligar') {
        const n = MV.sys.rels.candidate(g);
        if (!U.chance(0.3 + p.stats.looks / 200 + p.skills.carisma / 300)) { delete g.people[n.id]; fx.stat(g, 'happy', -3); return 'Intentaste ligar toda la noche. Volviste a casa con un kebab.'; }
        fx.stat(g, 'happy', U.int(4, 8)); fx.stat(g, 'stress', -4); p.counters.ligues = (p.counters.ligues || 0) + 1;
        const partner = MV.partner(g);
        let caught = '';
        if (partner) {
          fx.stat(g, 'karma', -4);
          if (U.chance(0.25)) { partner.r.rel = U.clamp(partner.r.rel - 30, 0, 100); fx.stat(g, 'karma', -2); caught = ` ${partner.n.first} vio una foto tuya con ${n.first} en redes. Problemas.`; }
        }
        // Tú eliges la protección y, a la mañana siguiente, qué son.
        MV.EV.push(g, 'proteccion', { target: n.id, casual: true }, true);
        return `Conociste a ${n.first} en la pista y la noche siguió en otro lado.${caught}`;
      }
      fx.addic(g, 'drogas', U.int(8, 15)); fx.stat(g, 'happy', U.int(5, 10));
      if (U.chance(0.04 + p.addic.drogas / 1000)) { MV.sys.legacy.die(g, 'una sobredosis en una discoteca'); return 'Aceptaste algo de un desconocido. Fue la última mala decisión.'; }
      if (U.chance(0.15)) { fx.stat(g, 'health', -U.int(5, 15)); return 'Lo que tomaste no era lo que te dijeron. Terminaste viendo dragones en el baño.'; }
      return 'Bailaste 8 horas seguidas y abrazaste a 40 desconocidos. Mañana será terrible.';
    } });
  A({ id: 'amigos_buscar', cat: 'amor', icon: '🤝', label: 'Buscar nuevos amigos', sub: 'Club, gimnasio, vecinos...', minAge: 13, limit: 2,
    run: (g) => { const p = g.p; if (!U.chance(0.45 + p.skills.carisma / 200)) { fx.stat(g, 'happy', -2); return U.pick(['Fuiste a un club de lectura. Eras el único que leyó el libro.', 'Saludaste a un vecino. Cerró la puerta.']); } const n = MV.newNPC(g, { age: U.clamp(p.age + U.int(-6, 6), 13, 99), country: p.country }); MV.addRel(g, n, 'amigo', U.int(45, 70)); fx.skill(g, 'carisma', 2); return `Conociste a ${MV.fullName(n)} ${U.pick(['en una clase de cerámica', 'en la fila del banco', 'en un grupo de senderismo', 'peleando por el último pan'])}. Ahora son amig${U.gw(n.gender, 'os', 'as')}.`; } });
  A({ id: 'adoptar_mascota', cat: 'amor', icon: '🐾', label: 'Adoptar una mascota', sub: 'Un amigo para siempre', minAge: 18, limit: 2,
    opts: (g) => Object.keys(MV.SPECIES).filter((k) => !MV.SPECIES[k].mythic && g.p.money >= MV.SPECIES[k].price).map((k) => ({ id: k, icon: MV.SPECIES[k].icon, label: MV.SPECIES[k].name, sub: U.money(MV.SPECIES[k].price) })),
    run: (g, k) => { const S = MV.SPECIES[k]; fx.money(g, -S.price); const pet = MV.newPet(g, k); MV.addRel(g, pet, 'mascota', U.int(60, 90)); fx.stat(g, 'happy', 8); MV.ach.check(g); return `Adoptaste ${U.gw(pet.gender, 'un', 'una')} ${S.name.toLowerCase()} y le pusiste ${pet.first}. ${U.pick(['Ya rompió algo.', 'Te ama incondicionalmente (o al menos a tu comida).', 'Es lo mejor que te pasó este año.'])}`; } });
  A({ id: 'adoptar_hijo', cat: 'amor', icon: '👶', label: 'Adoptar un hijo', sub: '$8.000 · trámite largo', minAge: 25, limit: 1, when: (g) => g.p.money >= 8000,
    run: (g) => { if (U.chance(g.p.record.length ? 0.15 : 0.6)) { fx.money(g, -8000); const pt = MV.partner(g); return MV.sys.rels.birth(g, pt ? pt.n : null, true); } return 'La agencia de adopción rechazó tu solicitud. Dijeron que tu departamento "huele a soltería".'; } });

  // ——— Ocio y vicios ———
  A({ id: 'vacaciones', cat: 'ocio', icon: '✈️', label: 'Irte de vacaciones', sub: 'Elige destino', minAge: 18, limit: 2,
    opts: (g) => MV.DESTINATIONS.filter((d) => g.p.money >= d.cost).map((d) => ({ id: d.id, icon: d.icon, label: d.name, sub: U.money(d.cost) })),
    opts2Title: '¿Con quién vas?',
    opts2: (g, id) => {
      const D = MV.DESTINATIONS.find((d) => d.id === id) || { cost: 0 };
      const out = [{ id: 'solo', icon: '🎒', label: 'Ir sol' + U.gw(g.p.gender, 'o', 'a'), sub: `${U.money(D.cost)}. Más chances de conocer gente` }];
      if (g.p.money < D.cost * 2) return out;
      MV.rels(g, ['conyuge', 'pareja', 'amante', 'hijo', 'padre', 'hermano', 'abuelo', 'amigo']).forEach(({ r, n }) => {
        if (n.species !== 'humano' || (r.type === 'amigo' && n.age < 16) || (r.type === 'hijo' && n.age < 3)) return;
        out.push({ id: n.id, icon: '🧳', label: `Con ${n.first}`, sub: `${MV.relLabel(r.type, n)}. Pagas los dos pasajes: ${U.money(D.cost * 2)}` });
      });
      return out;
    },
    run: (g, id, withId) => {
      const D = MV.DESTINATIONS.find((d) => d.id === id); const p = g.p;
      const mate = withId && withId !== 'solo' ? MV.person(g, withId) : null;
      const mr = mate && mate.alive ? MV.relOf(g, mate.id) : null;
      const comp = mr && p.money >= D.cost * 2 ? mate : null;
      fx.money(g, -D.cost * (comp ? 2 : 1)); fx.stat(g, 'happy', U.int(6, 14)); fx.stat(g, 'stress', -U.int(10, 25)); fx.skill(g, 'idiomas', 2);
      p.counters.viajes = (p.counters.viajes || 0) + 1;
      if (id !== 'espacio' && !MV.sys.mythic.has(g, 'dragon') && U.chance(0.05)) MV.EV.push(g, 'mercader', {});
      if (comp) {
        mr.rel = U.clamp(mr.rel + U.int(8, 18), 0, 100);
        comp.health = U.clamp(comp.health + 2, 0, 100);
        if (id === 'espacio') MV.ach.unlock(g, 'astronauta');
        const romantic = ['conyuge', 'pareja', 'amante'].includes(mr.type);
        const story = romantic ? U.pick([`vieron el atardecer abrazados y ${comp.first} dijo que fue el mejor viaje de su vida`, `${comp.first} se perdió en un mercado y l${U.gw(comp.gender, 'o', 'a')} encontraste comprando un sombrero ridículo`, 'se pelearon por el mapa, se reconciliaron con un helado gigante'])
          : U.pick([`${comp.first} sacó 900 fotos, 600 de comida`, `${comp.first} roncó en el avión y te tocó pedir disculpas a medio pasaje`, `se rieron tanto con ${comp.first} que ahora tienen chistes internos para siempre`]);
        return `Viajaste a ${D.name} con ${comp.first} (${MV.relLabel(mr.type, comp).toLowerCase()}). En el viaje ${story}.`;
      }
      if (id === 'espacio') { MV.ach.unlock(g, 'astronauta'); return 'Viajaste al espacio. Viste la Tierra entera y entendiste lo pequeño que es tu problema con el vecino.'; }
      if (U.chance(0.15)) { const n = MV.sys.rels.candidate(g); MV.addRel(g, n, 'amigo', U.int(50, 75)); return `Viajaste sol${U.gw(p.gender, 'o', 'a')} a ${D.name}. Conociste a ${n.first} en un hostal y siguen en contacto.`; }
      if (U.chance(0.1)) { MV.sys.health.add(g, U.pick(['gripe', 'resfriado', 'fractura'])); return `Fuiste a ${D.name} y volviste con un recuerdo no deseado.`; }
      if (U.chance(0.15)) { const n = MV.sys.rels.candidate(g); MV.addRel(g, n, 'amigo', U.int(50, 75)); return `En ${D.name} conociste a ${n.first}. Prometieron seguir en contacto (y lo cumplieron).`; }
      const T = { playa: ['Te quemaste tanto que parecías un camarón.', 'Tomaste cócteles con sombrillitas toda la semana.'], paris: ['Comiste croissants hasta enfermarte. Valió la pena.', 'Un mimo te siguió dos cuadras. Fue perturbador.'], tokio: ['Cantaste karaoke con oficinistas a las 3 a.m.', 'Te perdiste en el metro durante 4 horas.'], patagonia: ['Viste glaciares. El viento casi te lleva.', 'Acampaste bajo las estrellas. Un zorro te robó el desayuno.'], nyc: ['Caminaste tanto que se te gastaron las zapatillas.', 'Pagaste 18 dólares por un café. Lloraste un poco.'], safari: ['Un león te miró. Tú lo miraste. Nadie ganó.', 'Una jirafa te lamió el sombrero.'], crucero: ['Comiste en el bufé libre como si no hubiera mañana.', 'Ganaste el concurso de karaoke del barco.'], pueblo: ['Ordeñaste una vaca. La vaca no estaba de acuerdo.', 'Tu tía abuela te dio de comer 6 veces al día.'], vegas: ['Lo que pasó en Las Vegas se queda en Las Vegas. Y tu dinero también.', 'Viste un show de magia. Tu billetera desapareció.'] };
      return `Viajaste a ${D.name}. ${U.pick(T[id] || ['Fue increíble.'])}`;
    } });
  A({ id: 'redes', cat: 'ocio', icon: '📸', label: 'Publicar en redes sociales', sub: 'Gana seguidores (y haters)', minAge: 13, limit: 3,
    opts: () => [{ id: 'selfie', icon: '🤳', label: 'Selfie con filtro' }, { id: 'opinion', icon: '🔥', label: 'Opinión polémica' }, { id: 'meme', icon: '😂', label: 'Un meme' }, { id: 'baile', icon: '🕺', label: 'Video bailando' }, { id: 'comida', icon: '🍝', label: 'Foto de tu comida' }],
    run: (g, o) => {
      const p = g.p;
      const base = { selfie: p.stats.looks, opinion: p.skills.carisma + 20, meme: p.stats.smarts * 0.7 + 10, baile: p.skills.musica * 0.5 + p.stats.looks * 0.5, comida: p.skills.cocina + 10 }[o];
      let gain = Math.round(U.int(0, 40) * (1 + base / 40) * (1 + p.fame / 25));
      if (U.chance(0.03 + base / 4000)) {
        gain = Math.round(gain * 50 + 20000); p.followers += gain; fx.stat(g, 'fame', U.int(8, 15)); MV.ach.unlock(g, 'viral');
        return `¡Tu publicación se hizo VIRAL! Ganaste ${U.num(gain)} seguidores. Ahora te reconocen en la calle.`;
      }
      if (o === 'opinion' && U.chance(0.25)) { p.followers = Math.max(0, p.followers - U.int(10, 500)); fx.stat(g, 'happy', -5); fx.stat(g, 'stress', 6); return 'Tu opinión polémica desató una guerra en los comentarios. Te cancelaron por 48 horas.'; }
      p.followers += gain; fx.stat(g, 'happy', 1);
      return `Publicaste ${{ selfie: 'una selfie', opinion: 'una opinión polémica', meme: 'un meme', baile: 'un video bailando', comida: 'una foto de tu comida' }[o]}. +${U.num(gain)} seguidores (total: ${U.num(p.followers)}).`;
    } });
  const work = (kind) => (g, o) => MV.sys.works.create(g, kind, o && o.title, o && o.genre);
  A({ id: 'libro', cat: 'ocio', icon: '✍️', label: 'Escribir un libro', sub: 'Con título propio. Puede ser un best seller', minAge: 16, limit: 1, ui: 'work', work: 'libro', run: work('libro') });
  A({ id: 'cancion', cat: 'ocio', icon: '🎵', label: 'Componer una canción', sub: 'Con título propio. Puede ser un hit', minAge: 12, limit: 1, ui: 'work', work: 'cancion', run: work('cancion') });
  A({ id: 'programar_juego', cat: 'ocio', icon: '🎮', label: 'Programar un juego', sub: 'Con título propio. Programación (y un poco de Arte)', minAge: 12, limit: 1, ui: 'work', work: 'juego', run: work('juego') });
  A({ id: 'programar_app', cat: 'ocio', icon: '📱', label: 'Programar una app', sub: 'Con título propio. Puede ser la app del año', minAge: 14, limit: 1, ui: 'work', work: 'app', run: work('app') });
  A({ id: 'cuadro', cat: 'ocio', icon: '🎨', label: 'Pintar un cuadro', sub: 'Con título propio. Quizás termine en un museo', minAge: 8, limit: 1, ui: 'work', work: 'cuadro', run: work('cuadro') });
  A({ id: 'voluntariado', cat: 'ocio', icon: '🤲', label: 'Hacer voluntariado', sub: '+karma, +felicidad', minAge: 12, limit: 2,
    run: (g) => { fx.stat(g, 'karma', U.int(3, 7)); fx.stat(g, 'happy', U.int(2, 5));
      if (U.chance(0.03)) { const pet = MV.sys.mythic.grant(g, 'guardian'); if (pet) return `Limpiando un bosque, una criaturita de musgo te siguió hasta casa. Se llama ${pet.first}, dice que es guardián del bosque y que te va a vigilar.`; }
      return U.pick(['Serviste comida en un comedor. Una señora te dio un abrazo que no olvidarás.', 'Limpiaste una playa. Encontraste 3 zapatos izquierdos.', 'Paseaste perros de un refugio. Quieres adoptar a todos.', 'Le leíste a ancianos en un geriátrico. Te contaron chismes de 1960.']); } });
  A({ id: 'karaoke', cat: 'ocio', icon: '🎤', label: 'Ir al karaoke', sub: '$30 · desafinar en público', minAge: 14, limit: 1, when: (g) => g.p.money >= 30,
    run: (g) => { fx.money(g, -30); const p = g.p;
      if (U.chance(0.3 + p.skills.musica / 150)) { fx.stat(g, 'happy', U.int(5, 9)); fx.skill(g, 'musica', 1); fx.skill(g, 'carisma', 1); return U.pick(['Cantaste una balada y el bar entero hizo silencio. Después aplaudieron de pie.', 'Hiciste un dúo con un desconocido. Ahora tienen un grupo de mensajes.']); }
      fx.stat(g, 'happy', U.int(1, 4)); fx.stat(g, 'stress', -3);
      return U.pick(['Desafinaste tanto que el DJ te bajó el volumen. Te divertiste igual.', 'Elegiste una canción de 9 minutos. A los 4 ya nadie te escuchaba.', 'Cantaste con los ojos cerrados. Al abrirlos, el bar estaba vacío.']); } });
  A({ id: 'escape_room', cat: 'ocio', icon: '🔐', label: 'Hacer un escape room', sub: '$60 · 60 minutos para salir', minAge: 12, limit: 1, when: (g) => g.p.money >= 60,
    run: (g) => { fx.money(g, -60); fx.stat(g, 'smarts', U.int(1, 2));
      if (U.chance(0.25 + g.p.stats.smarts / 160)) { fx.stat(g, 'happy', U.int(5, 8)); return U.pick(['Saliste con 3 minutos de sobra. Te sacaron una foto con un cartel de "genios".', 'Descifraste el último candado tú solo. Tus amigos te miran distinto.']); }
      fx.stat(g, 'happy', U.int(1, 3));
      return U.pick(['No saliste. El encargado te abrió la puerta con cara de lástima.', 'Pasaste 40 minutos intentando abrir un cajón que era decorativo.']); } });
  A({ id: 'refugio', cat: 'ocio', icon: '🐾', label: 'Voluntariado en un refugio de animales', sub: '+karma, muchos pelos', minAge: 12, limit: 1,
    run: (g) => { fx.stat(g, 'karma', U.int(3, 6)); fx.stat(g, 'happy', U.int(3, 6)); fx.stat(g, 'stress', -3);
      if (U.chance(0.08)) { const pet = MV.sys.mythic.strayCat(g, U.pick(['adulto', 'anciano'])); MV.addRel(g, pet, 'mascota', U.int(70, 95)); MV.sys.talkcat.noteRescue(g); MV.ach.check(g); return `En el refugio, ${U.gw(pet.gender, 'un gato', 'una gata')} de ${pet.age} años se te subió a los hombros y no se bajó más. Te llevaste a ${pet.first} a casa.`; }
      return U.pick(['Bañaste a 6 perros. Ahora tú también necesitas un baño.', 'Le diste el biberón a gatitos huérfanos. Lloraste un poco.', 'Paseaste a un perro viejo que caminaba más lento que tu abuela. Fue perfecto.']); } });
  A({ id: 'picnic', cat: 'ocio', icon: '🧺', label: 'Hacer un picnic', sub: '$15 · pasto, sándwiches y hormigas', minAge: 6, limit: 1, when: (g) => g.p.money >= 15,
    run: (g) => { fx.money(g, -15); fx.stat(g, 'happy', U.int(3, 6)); fx.stat(g, 'stress', -3);
      const x = MV.rels(g, ['pareja', 'conyuge', 'padre', 'hijo', 'amigo']).filter(({ n }) => n.species === 'humano')[0];
      if (x) { x.r.rel = U.clamp(x.r.rel + U.int(3, 7), 0, 100); return `Hiciste un picnic con ${x.n.first}. ${U.pick(['Las hormigas se llevaron medio sándwich.', 'Se quedaron dormidos al sol.', 'Jugaron a las cartas sobre el mantel.'])}`; }
      return 'Hiciste un picnic solo en el parque. Las palomas te acompañaron con mucho interés.'; } });
  A({ id: 'estrellas', cat: 'ocio', icon: '🔭', label: 'Observar las estrellas', sub: 'Gratis · -estrés', minAge: 6, limit: 1,
    run: (g) => { fx.stat(g, 'stress', -4); fx.stat(g, 'smarts', 1); fx.stat(g, 'happy', 2);
      if (U.chance(0.05)) { fx.stat(g, 'happy', 4); return 'Viste una estrella fugaz y pediste un deseo. No lo vas a contar, por las dudas.'; }
      return U.pick(['Encontraste la Cruz del Sur (o un avión, no estás seguro).', 'Te acostaste en el pasto a mirar el cielo. Te sentiste chiquito y en paz.', 'Bajaste una app de constelaciones. Ahora todo te parece un cucharón.']); } });
  A({ id: 'retiro_descanso', cat: 'ocio', icon: '🧖', label: 'Retiro de descanso', sub: '$3.000 · spa, silencio y cero celular', minAge: 18, limit: 1, when: (g) => g.p.money >= 3000,
    run: (g) => { fx.money(g, -3000); fx.stat(g, 'stress', -U.int(25, 40)); fx.stat(g, 'health', U.int(2, 5)); fx.stat(g, 'happy', U.int(4, 8));
      return U.pick(['Pasaste una semana en un spa de montaña. Te dieron una bata y te sacaron el celular. Volviste a nacer.', 'Hiciste un retiro de silencio. El tercer día hablaste con una piedra, pero volviste en paz.', 'Fuiste a unas termas. Saliste tan relajad' + U.gw(g.p.gender, 'o', 'a') + ' que olvidaste dónde estacionaste.']); } });
  A({ id: 'plantar_arboles', cat: 'ocio', icon: '🌱', label: 'Plantar árboles', sub: '$200 · +karma', minAge: 12, limit: 2, when: (g) => g.p.money >= 200,
    run: (g) => { fx.money(g, -200); fx.stat(g, 'karma', U.int(2, 5)); fx.stat(g, 'happy', U.int(1, 3)); fx.stat(g, 'stress', -2);
      if (U.chance(0.08)) { const pet = MV.sys.mythic.grant(g, 'guardian'); if (pet) return `Mientras plantabas, salió de entre las raíces una criaturita de musgo con cejas enormes. Se llama ${pet.first}, habla por los árboles y decidió mudarse contigo para vigilarte.`; }
      return U.pick(['Plantaste diez árboles. Uno ya tiene un pájaro. Te sientes madre o padre de un bosque.', 'Plantaste un árbol y le pusiste nombre. Lo vas a visitar más que a tu familia.', 'Plantaste árboles con una ONG. Te dieron una gorra y una ampolla.']); } });
  A({ id: 'gato_callejero', cat: 'ocio', icon: '🐈', label: 'Recoger un gato callejero', sub: 'Gratis · elige la edad', minAge: 12, limit: 2,
    opts: () => Object.keys(MV.STRAY_AGES).map((k) => ({ id: k, icon: MV.STRAY_AGES[k].icon, label: MV.STRAY_AGES[k].label, sub: MV.STRAY_AGES[k].sub })),
    run: (g, k) => {
      const p = g.p, parents = p.housing === 'padres' && MV.rels(g, 'padre').length > 0;
      if (parents && U.chance(0.4)) { fx.stat(g, 'happy', -3); return `Llegaste a casa con un gato en brazos. Tus padres dijeron que no. El gato también parecía decepcionado.`; }
      const vet = U.int(50, 150), pays = p.age >= 18 && p.money >= vet;
      if (pays) fx.money(g, -vet);
      const pet = MV.sys.mythic.strayCat(g, k);
      MV.addRel(g, pet, 'mascota', U.int(60, 90));
      MV.sys.talkcat.noteRescue(g);
      fx.stat(g, 'karma', k === 'anciano' ? 6 : 3); fx.stat(g, 'happy', U.int(4, 8));
      MV.ach.check(g);
      const age = pet.age === 0 ? 'meses' : `${pet.age} año${pet.age === 1 ? '' : 's'}`;
      const bill = pays ? `El veterinario te cobró ${U.money(vet)}.` : parents ? 'Tus padres pagaron el veterinario (y te lo van a recordar).' : 'El veterinario del barrio no te cobró: dijo que ya le pagarías con fotos del gato.';
      return `Recogiste a ${U.gw(pet.gender, 'un gato', 'una gata')} de ${age} que ${pet.street} y le pusiste ${pet.first}. ${bill}${k === 'anciano' ? ' Nadie adopta a los viejitos. Tú sí.' : ''}`;
    } });
  A({ id: 'templo', cat: 'ocio', icon: '⛪', label: 'Ir a un templo', sub: '+karma, +paz', minAge: 6, limit: 1,
    run: (g) => { fx.stat(g, 'karma', U.int(1, 4)); fx.stat(g, 'happy', U.int(1, 4)); fx.stat(g, 'stress', -4); return U.pick(['Fuiste a misa. Te dormiste en el sermón.', 'Rezaste por dinero. Ya veremos.', 'Encendiste una vela por tu familia. Casi incendias el banco.']); } });
  A({ id: 'videojuegos', cat: 'ocio', icon: '🎮', label: 'Jugar videojuegos', sub: '+felicidad, -estrés', minAge: 6, limit: 3,
    run: (g) => { fx.stat(g, 'happy', U.int(2, 5)); fx.stat(g, 'stress', -4); fx.skill(g, 'programacion', U.chance(0.3) ? 1 : 0); return U.pick(['Jugaste 9 horas seguidas. El sol es un rumor.', 'Un niño de 9 años te insultó en línea. Perdiste.', 'Ganaste una partida épica. Nadie lo vio.', 'Construiste una ciudad virtual más ordenada que tu cuarto.']); } });
  A({ id: 'concierto', cat: 'ocio', icon: '🎸', label: 'Ir a un concierto', sub: '$120', minAge: 12, limit: 2,
    run: (g) => { fx.money(g, g.p.age >= 18 ? -120 : 0); fx.stat(g, 'happy', U.int(4, 8)); fx.skill(g, 'musica', 1); return U.pick(['Gritaste todas las canciones. Te quedaste sin voz tres días.', 'Viste el concierto a través de la pantalla del celular del de adelante.', 'El cantante te señaló. Seguramente era a otro, pero igual.']); } });
  A({ id: 'cine', cat: 'ocio', icon: '🍿', label: 'Ir al cine', sub: '$20', minAge: 8, limit: 2,
    run: (g) => { if (g.p.age >= 18) fx.money(g, -20); fx.stat(g, 'happy', U.int(2, 4)); return U.pick(['Viste una película de superhéroes. Había 12 escenas post-créditos.', 'Viste una de terror. Dormiste con la luz prendida.', 'Viste una película de arte. Duraba 4 horas. Era en blanco y negro. Sobre un pato.']); } });
  A({ id: 'bar', cat: 'ocio', icon: '🍺', label: 'Ir a un bar', sub: 'Socializar con alcohol', minAge: 18, limit: 2,
    run: (g) => { fx.money(g, -U.int(20, 80)); fx.addic(g, 'alcohol', U.int(3, 7)); fx.stat(g, 'happy', U.int(2, 5)); fx.skill(g, 'carisma', 1); if (U.chance(0.12)) { fx.stat(g, 'health', -U.int(5, 12)); return 'Te metiste en una pelea de bar por un partido de fútbol. Perdiste un diente.'; } return U.pick(['Le contaste tu vida al bartender. Te cobró igual.', 'Ganaste un torneo de dardos. Premio: más cerveza.', 'Cantaste en el karaoke. El bar se vació.']); } });
  A({ id: 'fumar', cat: 'ocio', icon: '🚬', label: 'Fumar un cigarrillo', sub: 'Mala idea', minAge: 14, limit: 3,
    run: (g) => { fx.addic(g, 'tabaco', U.int(4, 8)); fx.stat(g, 'stress', -3); fx.stat(g, 'health', -1); return U.pick(['Fumaste a escondidas. Tosiste como abuelo.', 'Fumaste para parecer cool. No funcionó.', 'Fumaste uno. Después otro. Tu madre lo olió desde otro país.']); } });
  A({ id: 'tatuaje', cat: 'ocio', icon: '🖋️', label: 'Hacerte un tatuaje', sub: 'Minijuego: dibuja tu diseño', minAge: 18, limit: 1, ui: 'tattoo',
    check: (g, o) => (o && o.design ? MV.sys.tattoo.refusal(g, o.design, o.cover) : null),
    run: (g, o) => (o && o.design ? MV.sys.tattoo.apply(g, o.design, o.artist, o.place, { cover: o.cover })
      : MV.sys.tattoo.apply(g, MV.sys.tattoo.randomDesign(), U.pick(Object.keys(MV.TATTOO_ARTISTS).filter((k) => !MV.TATTOO_ARTISTS[k].hidden)), U.pick(Object.keys(MV.TATTOO_PLACES)))) });

  // ——— Azar ———
  A({ id: 'ruleta', cat: 'azar', icon: '🎡', label: 'Ruleta (rojo o negro)', sub: 'x2 · 47%', limit: 4, opts: bets,
    run: (g, o) => { const amt = betAmt(g, o); gamble(g, amt); if (U.chance(0.47)) { fx.money(g, amt); fx.stat(g, 'happy', 5); return `Salió tu color. Ganaste ${U.money(amt)}.`; } fx.money(g, -amt); fx.stat(g, 'happy', -5); return `Salió el otro color. Perdiste ${U.money(amt)}.`; } });
  A({ id: 'tragamonedas', cat: 'azar', icon: '🎰', label: 'Tragamonedas', sub: 'Luces y esperanza', limit: 4, opts: bets,
    run: (g, o) => { const amt = betAmt(g, o); gamble(g, amt); const r = U.rand(); if (r < 0.01) { fx.money(g, amt * 30); fx.stat(g, 'happy', 15); return `¡JACKPOT! Ganaste ${U.money(amt * 30)}. Las luces te dejaron medio ciego.`; } if (r < 0.3) { fx.money(g, Math.round(amt * 0.8)); return `Ganaste ${U.money(amt * 1.8)}... un poquito más de lo que pusiste.`; } fx.money(g, -amt); fx.stat(g, 'happy', -3); return `Perdiste ${U.money(amt)}. La máquina hizo un sonido que parecía una risa.`; } });
  A({ id: 'blackjack', cat: 'azar', icon: '🃏', label: 'Blackjack', sub: 'x2 · un poco de cabeza', limit: 4, opts: bets,
    run: (g, o) => { const amt = betAmt(g, o); gamble(g, amt); if (U.chance(0.42 + g.p.stats.smarts / 1000)) { fx.money(g, amt); fx.stat(g, 'happy', 5); return `21. Ganaste ${U.money(amt)}. El crupier te mira con respeto.`; } fx.money(g, -amt); fx.stat(g, 'happy', -4); return `Te pasaste de 21. Perdiste ${U.money(amt)}.`; } });
  A({ id: 'poker', cat: 'azar', icon: '♠️', label: 'Póker', sub: 'x2,5 · faroles', limit: 3, opts: bets,
    run: (g, o) => { const amt = betAmt(g, o); gamble(g, amt); if (U.chance(0.3 + g.p.stats.smarts / 400 + g.p.skills.carisma / 500 + g.p.skills.crimen / 600)) { fx.money(g, Math.round(amt * 1.5)); fx.stat(g, 'happy', 7); return `Tu farol fue perfecto. Ganaste ${U.money(amt * 1.5)}.`; } fx.money(g, -amt); fx.stat(g, 'happy', -5); return `Tenías un par de dos. El otro tenía escalera real. Perdiste ${U.money(amt)}.`; } });
  A({ id: 'caballos', cat: 'azar', icon: '🏇', label: 'Carreras de caballos', sub: 'Elige caballo', limit: 3,
    opts: (g) => (g.p.money >= 200 ? [{ id: 'fav', icon: '🐎', label: '"Relámpago" (favorito) · x2', sub: '$200' }, { id: 'med', icon: '🐴', label: '"Tormenta Lenta" · x5', sub: '$200' }, { id: 'bat', icon: '🦄', label: '"Pata de Palo" (sin chances) · x25', sub: '$200' }] : []),
    run: (g, o) => { gamble(g, 200); fx.money(g, -200); const [p, m] = { fav: [0.42, 2], med: [0.17, 5], bat: [0.035, 25] }[o]; if (U.chance(p)) { fx.money(g, 200 * m); fx.stat(g, 'happy', 8); return `¡Ganó tu caballo! Cobraste ${U.money(200 * m)}.`; } return U.pick(['Tu caballo se detuvo a comer pasto en plena carrera.', 'Tu caballo llegó último. Saludó al público.', 'Tu caballo perdió por una nariz. Una nariz muy larga.']); } });
  A({ id: 'loteria', cat: 'azar', icon: '🎟️', label: 'Comprar lotería', sub: 'Soñar no cuesta... bueno, sí', limit: 5,
    opts: (g) => [{ id: 1, icon: '🎫', label: '1 boleto ($10)' }, { id: 10, icon: '🎫', label: '10 boletos ($100)' }, { id: 100, icon: '🎫', label: '100 boletos ($1.000)' }].filter((o) => g.p.money >= o.id * 10),
    run: (g, n) => { n = +n || 1; fx.money(g, -10 * n); gamble(g, n * 10); if (U.chance(n / 8000)) { const prize = U.int(1, 40) * 1000000; fx.money(g, prize); fx.stat(g, 'happy', 30); MV.ach.unlock(g, 'loteria'); MV.rels(g).forEach((x) => { if (x.r.type !== 'mascota') x.r.rel = U.clamp(x.r.rel + 10, 0, 100); }); return `¡¡GANASTE LA LOTERÍA!! ${U.money(prize)}. De repente tienes 40 primos nuevos.`; } if (U.chance(n / 40)) { const pr = U.int(20, 2000); fx.money(g, pr); return `Ganaste un premio menor de ${U.money(pr)}.`; } return n > 10 ? `Compraste ${n} boletos. Ninguno ganó. Ni el reintegro.` : 'No ganaste. Como siempre.'; } });

  // ——— Crimen ———
  Object.keys(MV.CRIMES).forEach((id) => {
    const C = MV.CRIMES[id];
    A({ id: 'crimen_' + id, cat: 'crimen', icon: C.icon, label: C.name, sub: `Gravedad ${'★'.repeat(C.sev)}`, minAge: C.age, limit: 2, confirm: C.sev >= 3 ? `¿Seguro? (${C.name})` : null, run: (g) => MV.sys.crime.commit(g, id) });
  });
  A({ id: 'mafia', cat: 'crimen', icon: '🕴️', label: 'Buscar a la mafia', sub: 'Requiere Crimen 15+', minAge: 16, limit: 1, when: (g) => !g.p.job || g.p.job.id !== 'mafia',
    run: (g) => MV.sys.career.audition(g, 'mafia') });

  // ——— Trámites y vida ———
  // Licencias: examen de preguntas (hoja propia en la interfaz; sin respuestas, se simula).
  Object.keys(MV.LICENSES).forEach((kind) => {
    const L = MV.LICENSES[kind];
    A({ id: 'lic_' + kind, cat: 'tramites', icon: L.icon, label: L.label, sub: `${U.money(L.cost)} · examen de ${L.n} preguntas`, minAge: L.minAge, limit: 2, ui: 'quiz', license: kind,
      when: (g) => !g.p.prison && !MV.sys.license.has(g, kind) && (!L.requires || MV.sys.license.has(g, L.requires)),
      check: (g) => { const c = MV.sys.license.canTake(g, kind); return c.ok ? null : `No puedes rendir: ${c.why.join(', ').toLowerCase()}.`; },
      run: (g, o) => MV.sys.license.take(g, kind, o) });
  });
  A({ id: 'emigrar', cat: 'tramites', icon: '🧳', label: 'Emigrar a otro país', sub: '$3.000 · empezar de cero', minAge: 18, limit: 1, when: (g) => g.p.money >= 3000 && !g.p.wanted,
    opts: (g) => Object.keys(MV.COUNTRIES).filter((k) => k !== g.p.country).sort((a, b) => MV.COUNTRIES[a].name.localeCompare(MV.COUNTRIES[b].name, 'es'))
      .map((k) => ({ id: k, icon: MV.COUNTRIES[k].flag, label: MV.COUNTRIES[k].name, sub: MV.COUNTRIES[k].region })),
    run: (g, k) => {
      const p = g.p, C = MV.COUNTRIES[k];
      fx.money(g, -3000); p.country = k; p.city = U.pick(C.cities); p.flags.emigro = true;
      MV.rels(g, ['amigo', 'companero']).forEach((x) => { x.r.rel = U.clamp(x.r.rel - 20, 0, 100); });
      if (p.job && p.job.type === 'full' && U.chance(0.7)) MV.sys.career.leave(g, 'emigración');
      MV.ach.unlock(g, 'emigrante');
      fx.stat(g, 'happy', p.skills.idiomas > 40 ? 8 : -2); fx.stat(g, 'stress', 10);
      return `Te mudaste a ${p.city}, ${C.name} ${C.flag}. ${p.skills.idiomas > 40 ? 'Te adaptaste rápido.' : 'No entiendes ni el menú del bar, pero ya aprenderás.'}`;
    } });
  A({ id: 'demandar', cat: 'tramites', icon: '⚖️', label: 'Demandar a alguien', sub: 'Abogado: $3.000', minAge: 18, limit: 1, when: (g) => g.p.money >= 3000,
    opts: () => [{ id: 'cafe', icon: '☕', label: 'A una cadena de café (estaba muy caliente)' }, { id: 'vecino', icon: '🔊', label: 'Al vecino ruidoso' }, { id: 'aerolinea', icon: '🧳', label: 'A la aerolínea que perdió tu valija' }, { id: 'horoscopo', icon: '🔮', label: 'Al horóscopo del diario (no acertó)' }],
    run: (g, o) => {
      fx.money(g, -3000); const ch = { cafe: 0.35, vecino: 0.5, aerolinea: 0.55, horoscopo: 0.03 }[o] + g.p.stats.smarts / 500;
      if (U.chance(ch)) { const amt = { cafe: U.int(20000, 400000), vecino: U.int(1000, 15000), aerolinea: U.int(2000, 20000), horoscopo: U.int(1, 10) * 100000 }[o]; fx.money(g, amt); fx.stat(g, 'happy', 10); return `¡Ganaste la demanda! Te pagaron ${U.money(amt)}.`; }
      fx.stat(g, 'happy', -6); return U.pick(['Perdiste la demanda. El juez te miró como a un payaso.', 'El caso fue desestimado. Tu abogado ya cobró.']);
    } });
  A({ id: 'nombre', cat: 'tramites', icon: '🪪', label: 'Cambiarte el nombre', sub: '$500', minAge: 18, limit: 1,
    opts: (g) => U.shuffle(MV.countryOf(g.p.country).names[g.p.gender]).slice(0, 4).map((n) => ({ id: n, icon: '🏷️', label: n })).concat([{ id: '__raro', icon: '🤡', label: 'Algo ridículo' }]),
    run: (g, n) => { fx.money(g, -500); const old = g.p.first; g.p.first = n === '__raro' ? U.pick(['Batman', 'Tostadora', 'Rey Supremo', 'Lady Croqueta', 'Sr. Misterio', 'Wifi']) : n; fx.stat(g, 'happy', 3); return `Te cambiaste el nombre de ${old} a ${g.p.first}.${n === '__raro' ? ' Tu familia finge que no te conoce.' : ''}`; } });
  A({ id: 'prestamo', cat: 'tramites', icon: '🏦', label: 'Pedir un préstamo', sub: 'A 5 años con interés', minAge: 18, limit: 1,
    opts: (g) => [5000, 20000, 100000].map((v) => ({ id: v, icon: '💳', label: U.money(v), sub: `${U.money(Math.round(v * 1.25 / 5))}/año` })),
    run: (g, v) => { v = +v; const p = g.p; if (!p.job && !p.business && !p.assets.length) return 'El banco no presta a gente sin ingresos ni bienes. Te ofrecieron un caramelo.'; if (p.loans.length >= 3) return 'Ya tienes demasiados préstamos. El banco dice basta.'; MV.sys.money.addLoan(g, 'Préstamo personal', v, 5, p.age + 1); fx.money(g, v); return `El banco te prestó ${U.money(v)}. Que la fuerza te acompañe al pagarlo.`; } });

  MV.ACTS = ACTS;

  /** Actividades visibles ahora para una categoría. */
  MV.actsFor = function (g, cat) {
    const p = g.p;
    return ACTS.filter((a) => a.cat === cat && (a.minAge == null || p.age >= a.minAge) && (a.maxAge == null || p.age <= a.maxAge) && (!a.when || a.when(g)));
  };
  MV.catsFor = function (g) {
    const p = g.p;
    return MV.ACT_CATS.filter((c) => p.age >= c.min && (c.max == null || p.age <= c.max) && MV.actsFor(g, c.id).length);
  };

  // — Evento de la app de citas —
  MV.ev({
    id: 'match', manual: true, icon: '📱', scene: 'ciudad', title: 'Nuevo perfil',
    text: (g, ctx) => {
      const n = MV.person(g, ctx.target);
      const bio = U.pick(['Amante de los viajes y del vino barato.', 'Si no te gustan los perros, sigue deslizando.', 'Busco a alguien que me aguante los audios de 7 minutos.', 'Ingeniero/a de día, DJ fracasado/a de noche.', 'Mi signo es importante para mí.', 'Solo vine a ver qué onda.', 'Cocino bien. Miento sobre todo lo demás.']);
      return `${n.first}, ${n.age} años. Apariencia: ${n.looks}/100. Trabaja como ${(n.job || 'algo que no explica').toLowerCase()}. Bio: "${bio}"`;
    },
    choices: [
      { t: '💚 Deslizar a la derecha', eff: (g, ctx) => {
        const n = MV.person(g, ctx.target);
        const ch = 0.35 + (g.p.stats.looks - n.looks) / 200 + g.p.skills.carisma / 400;
        if (U.chance(U.clamp(ch, 0.08, 0.9))) { MV.EV.push(g, 'match_cita', { target: n.id }, true); return `¡Match! Quedaron para una cita con ${n.first}.`; }
        delete g.people[n.id]; g.p.stats.happy = U.clamp(g.p.stats.happy - 2, 0, 100);
        return `${n.first} no te dio match. Te consuelas pensando que no vio tu foto bien.`;
      } },
      { t: '💔 Deslizar a la izquierda', eff: (g, ctx) => { delete g.people[ctx.target]; return 'Siguiente.'; } },
      { t: '⭐ Superlike ($10)', eff: (g, ctx) => {
        const n = MV.person(g, ctx.target); MV.fx.money(g, -10);
        if (U.chance(U.clamp(0.5 + (g.p.stats.looks - n.looks) / 200, 0.1, 0.95))) { MV.EV.push(g, 'match_cita', { target: n.id }, true); return `¡Match con superlike! Quedaron para una cita con ${n.first}.`; }
        delete g.people[n.id];
        return 'Pagaste un superlike y te ignoraron. Doble dolor.';
      } }
    ]
  });

  MV.ev({
    id: 'match_cita', manual: true, prison: 'any', icon: '💘', scene: 'ciudad', title: 'Después de la cita',
    text: 'La cita con {t} salió mejor de lo esperado. Están en la puerta y nadie quiere irse. ¿Y ahora?',
    choices: [
      { t: '💑 Proponer que sean pareja', when: (g) => !MV.partner(g), eff: (g, ctx) => MV.sys.rels.startDating(g, MV.person(g, ctx.target)) },
      { t: '🤫 Empezar una aventura en secreto', when: (g) => !!MV.partner(g), eff: (g, ctx) => MV.sys.rels.startDating(g, MV.person(g, ctx.target)) },
      { t: '🌙 Pasar la noche, sin compromiso', eff: (g, ctx) => { MV.EV.push(g, 'proteccion', { target: ctx.target, casual: true }, true); return `La cita con ${MV.person(g, ctx.target).first} siguió en tu casa.`; } },
      { t: '🤝 Quedar como amigos', eff: (g, ctx) => { const n = MV.person(g, ctx.target); MV.addRel(g, n, 'amigo', U.int(40, 65)); return `Quedaron como amigos con ${n.first}. Sin presiones.`; } },
      { t: '👋 No volver a verse', eff: (g, ctx) => `Fue lindo, pero no. Le deseaste suerte a ${MV.person(g, ctx.target).first} y borraste la app (hasta mañana).` }
    ]
  });
})(window.MV = window.MV || {});
