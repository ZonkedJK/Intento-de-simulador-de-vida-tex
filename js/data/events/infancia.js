/* Mil Vidas — eventos de la infancia (0-12 años). */
(function (MV) {
  'use strict';
  const U = MV.U, ev = MV.ev, fx = MV.fx, H = MV.EVH;
  const parents = (g) => MV.rels(g, 'padre');
  const bumpParents = (g, d) => parents(g).forEach((x) => { x.r.rel = U.clamp(x.r.rel + d, 0, 100); });
  const mom = (g) => parents(g).find((x) => x.n.gender === 'f');

  ev({ id: 'primeros_pasos', age: [1, 2], once: true, icon: '👣', text: 'Diste tus primeros pasos. Directo hacia el enchufe más cercano.', auto: { happy: 3, health: 1 } });
  ev({ id: 'llanto_nocturno', age: [0, 2], icon: '😭', text: 'Lloraste todas las noches durante un mes. Tus padres envejecieron cinco años.', auto: { happy: 1, then: (g) => { bumpParents(g, -2); } } });
  ev({ id: 'primera_palabra', age: [1, 2], once: true, icon: '🗣️', scene: 'hogar', title: 'Tu primera palabra',
    text: 'Toda la familia te mira expectante. Es el momento de tu primera palabra.',
    choices: [
      { t: '"Mamá"', eff: { happy: 2, msg: 'Dijiste "mamá". Tu madre lo publicó en todos los grupos de la familia.', then: (g) => { const m = mom(g); if (m) m.r.rel = U.clamp(m.r.rel + 8, 0, 100); } } },
      { t: '"Papá"', eff: { happy: 2, msg: 'Dijiste "papá". Tu padre se lo recordará a tu madre para siempre.', then: (g) => { const d = parents(g).find((x) => x.n.gender === 'm'); if (d) d.r.rel = U.clamp(d.r.rel + 8, 0, 100); } } },
      { t: '"Galleta"', eff: { happy: 4, smarts: 1, msg: 'Tu primera palabra fue "galleta". Prioridades claras desde el principio.' } },
      { t: 'Una mala palabra que escuchaste', eff: { karma: -1, happy: 3, msg: 'Dijiste una grosería perfecta. La abuela casi se desmaya. Tu tío lloró de risa.' } }
    ] });
  ev({ id: 'chupete', age: [1, 3], once: true, icon: '🍼', title: 'Adiós al chupete',
    text: 'Tus padres decidieron que es hora de dejar el chupete.',
    choices: [
      { t: 'Aceptarlo con dignidad', eff: { happy: -3, smarts: 1, msg: 'Lo dejaste sin drama. Un ejemplo de madurez a los dos años.' } },
      { t: 'Llorar hasta que lo devuelvan', eff: { happy: 2, msg: 'Lloraste 3 días. Te lo devolvieron. Ganaste la primera guerra.', then: (g) => bumpParents(g, -3) } },
      { t: 'Esconder uno de repuesto', eff: { happy: 3, skills: { crimen: 1 }, msg: 'Escondiste un chupete de emergencia en el osito. Mente criminal en desarrollo.' } }
    ] });
  ev({ id: 'monstruo_cama', age: [3, 7], icon: '👹', scene: 'hogar', title: 'Algo debajo de la cama',
    text: 'Estás convencido de que hay un monstruo debajo de tu cama.',
    choices: [
      { t: 'Gritar hasta que vengan tus padres', eff: { happy: 1, msg: 'Tus padres revisaron con una linterna. Solo había un calcetín. Sospechoso.', then: (g) => bumpParents(g, -1) } },
      { t: 'Enfrentarlo con una linterna', eff: { p: 0.8, ok: { happy: 4, karma: 1, msg: 'Lo enfrentaste. Era el gato. Igual te sentiste un héroe.' }, ko: { happy: -4, msg: 'Miraste debajo de la cama y algo se movió. No dormiste en un mes.' } } },
      { t: 'Hacerte amigo del monstruo', eff: { happy: 5, smarts: 1, msg: 'Le pusiste nombre al monstruo: Ramón. Ahora le cuentas tus secretos.' } }
    ] });
  ev({ id: 'perro_callejero', age: [5, 12], icon: '🐕', scene: 'ciudad', title: 'Un perro te sigue',
    text: 'Un perro callejero con una oreja caída te sigue hasta casa.',
    choices: [
      { t: 'Rogar que te dejen quedártelo', eff: (g) => {
        const ok = U.chance(0.5);
        if (!ok) { fx.stat(g, 'happy', -4); return 'Tus padres dijeron que no. Lloraste mirando por la ventana como en una película.'; }
        const pet = MV.newPet(g, 'perro', { age: U.int(1, 5) }); MV.addRel(g, pet, 'mascota', U.int(70, 95)); fx.stat(g, 'happy', 10); fx.stat(g, 'karma', 3);
        return `¡Te dejaron quedártelo! Lo llamaste ${pet.first}.`;
      } },
      { t: 'Darle tu merienda', eff: { karma: 3, happy: 2, msg: 'Le diste tu sándwich. Te miró como si fueras su dios.' } },
      { t: 'Ignorarlo', eff: { karma: -1, msg: 'Lo ignoraste. Se fue triste. Tú también un poco.' } }
    ] });
  ev({ id: 'diente_leche', age: [5, 8], once: true, icon: '🦷', text: 'Se te cayó un diente. El ratoncito te dejó {amount} debajo de la almohada.', auto: { happy: 3, money: [1, 20] } });
  ev({ id: 'abuson', age: [6, 15], once: true, when: H.school, icon: '😠', scene: 'escuela', title: 'El abusón',
    text: 'Un chico más grande te exige tu merienda todos los días.',
    choices: [
      { t: 'Dársela', eff: { happy: -6, flag: 'abuson', msg: 'Le diste la merienda. Y mañana también. Y pasado...' } },
      { t: 'Decírselo a la maestra', eff: { p: 0.6, ok: { happy: 3, msg: 'La maestra intervino. El abusón ya no te molesta... de frente.' }, ko: { happy: -6, flag: 'abuson', msg: 'La maestra habló con él. Ahora te odia más. "Buchón".' } } },
      { t: 'Pegarle en la nariz', eff: (g) => {
        if (U.chance(0.4 + g.p.skills.deporte / 150)) { fx.stat(g, 'happy', 8); fx.stat(g, 'karma', -1); return 'Le diste un golpe y salió llorando. Te suspendieron un día, pero eres leyenda.'; }
        fx.stat(g, 'health', -5); fx.stat(g, 'happy', -6); g.p.flags.abuson = true; return 'Le pegaste. Él te pegó más fuerte. Mucho más fuerte.';
      } },
      { t: 'Intentar hacerte su amigo', eff: { p: (g) => 0.3 + g.p.skills.carisma / 150, ok: { happy: 5, skills: { carisma: 3 }, msg: 'Le hiciste un chiste y se rió. Ahora te protege de los demás.' }, ko: { happy: -5, flag: 'abuson', msg: 'Intentaste ser su amigo. Te metió en un tacho de basura.' } } }
    ] });
  ev({ id: 'concurso_dibujo', age: [6, 12], when: H.school, icon: '🖍️', scene: 'escuela', title: 'Concurso de dibujo',
    text: 'Hay un concurso de dibujo en la escuela. El premio: una caja de lápices de 48 colores.',
    choices: [
      { t: 'Dibujar a tu familia', eff: { p: (g) => 0.25 + g.p.skills.arte / 100, ok: { happy: 8, skills: { arte: 4 }, msg: '¡Ganaste! Aunque tu padre aparece con seis dedos.' }, ko: { skills: { arte: 2 }, msg: 'No ganaste. Tu madre pegó el dibujo en la heladera igual.' } } },
      { t: 'Dibujar un dinosaurio comiéndose la escuela', eff: { p: 0.3, ok: { happy: 8, skills: { arte: 4 }, msg: 'Ganaste con tu dinosaurio destructor. El director no sabe si reír.' }, ko: { skills: { arte: 2 }, msg: 'La maestra dijo que era "preocupante". Ganó otro niño con un arcoíris.' } } },
      { t: 'Calcar un dibujo de internet', eff: { karma: -2, p: 0.5, ok: { happy: 4, msg: 'Ganaste con un dibujo calcado. La culpa te acompañará siempre (o una semana).' }, ko: { happy: -6, msg: 'La maestra reconoció el dibujo. Descalificado y humillado.' } } }
    ] });
  ev({ id: 'vecina_galletas', age: [4, 10], icon: '🍪', text: 'La vecina te regaló galletas caseras. Estaban duras como piedras, pero hechas con amor.', auto: { happy: 2, karma: 1 } });
  ev({ id: 'perdido_super', age: [3, 7], icon: '🛒', scene: 'ciudad', title: 'Perdido en el súper',
    text: 'Miras a tu alrededor en el supermercado. Tus padres no están por ningún lado.',
    choices: [
      { t: 'Llorar en el pasillo de cereales', eff: { happy: -3, msg: 'Lloraste a todo pulmón. Te llamaron por altoparlante. Vergüenza familiar.' } },
      { t: 'Buscar a un guardia de seguridad', eff: { smarts: 2, msg: 'Buscaste ayuda como un adulto. Tus padres llegaron corriendo, más asustados que tú.' } },
      { t: 'Aprovechar las muestras gratis', eff: { happy: 5, health: -1, msg: 'Comiste 23 muestras gratis de queso. Mejor día de tu vida.' } }
    ] });
  ev({ id: 'hermanito', age: [2, 10], once: true, when: (g) => { const m = mom(g); return !!m && m.n.age <= 42; }, w: 0.8, icon: '👶', scene: 'hospital', title: 'Un hermanito',
    text: 'Tus padres te sientan en el sillón con cara seria: vas a tener un hermanito.',
    choices: ['¡Qué alegría!', 'Exigir que lo devuelvan', 'Pedir un perro en su lugar'].map((t, i) => ({
      t, eff: (g) => {
        const ps = parents(g).map((x) => x.n);
        const sib = MV.newNPC(g, { gender: U.pick(['m', 'f']), age: 0, last: g.p.last, parents: ps, money: 0, job: '-' });
        MV.addRel(g, sib, 'hermano', [75, 40, 55][i]);
        fx.stat(g, 'happy', [6, -4, 0][i]);
        const o = U.gw(sib.gender, 'o', 'a');
        return [`Nació ${U.gw(sib.gender, 'tu hermanito', 'tu hermanita')} ${sib.first}. Ya l${o} quieres mucho (aunque llora).`, `Nació ${sib.first}. Exigiste devolverl${o}. No aceptan devoluciones.`, `No hubo perro. Nació ${sib.first}. Huele parecido, eso sí.`][i];
      }
    })) });
  ev({ id: 'padres_pelean', age: [4, 16], when: (g) => parents(g).length >= 2, icon: '🗯️', title: 'Gritos en la cocina',
    text: 'Tus padres discuten a los gritos en la cocina. Algo sobre dinero y la suegra.',
    choices: [
      { t: 'Taparte los oídos con la almohada', eff: { happy: -4, stress: 5, msg: 'Te encerraste en tu cuarto. Dormiste con música.' } },
      { t: 'Entrar y pedir que paren', eff: { p: 0.5, ok: { happy: 2, karma: 2, msg: 'Pararon al verte. Hasta se abrazaron. Por ahora.' }, ko: { happy: -5, msg: 'Te mandaron a tu cuarto. Siguieron peleando, ahora también por ti.' } } },
      { t: 'Grabarlo todo "por si acaso"', eff: { skills: { crimen: 1 }, smarts: 1, msg: 'Grabaste la pelea. Ese video será muy útil para negociar tu mesada.' } }
    ] });
  ev({ id: 'divorcio_padres', age: [5, 16], once: true, w: (g) => (g.p.flags.padresDivorciados ? 4 : 0.6), when: (g) => parents(g).length >= 2, icon: '💔', scene: 'tribunal', title: 'El divorcio',
    text: 'Tus padres se divorcian. El juez te pregunta con quién quieres vivir.',
    choices: [
      { t: 'Con mamá', eff: (g) => { const d = parents(g).find((x) => x.n.gender === 'm'); if (d) d.r.rel = U.clamp(d.r.rel - 12, 0, 100); fx.stat(g, 'happy', -8); g.p.flags.padresDivorciados = true; return 'Te fuiste a vivir con tu madre. Ves a tu padre fines de semana alternos y en cumpleaños con tensión.'; } },
      { t: 'Con papá', eff: (g) => { const m = mom(g); if (m) m.r.rel = U.clamp(m.r.rel - 12, 0, 100); fx.stat(g, 'happy', -8); g.p.flags.padresDivorciados = true; return 'Te fuiste a vivir con tu padre. Comen pizza 5 días por semana.'; } },
      { t: 'Una semana con cada uno', eff: { happy: -6, stress: 8, flag: 'padresDivorciados', msg: 'Vives con una mochila permanente. Tienes dos cepillos de dientes y cero estabilidad.' } }
    ] });
  ev({ id: 'cumple_fiesta', age: [4, 12], icon: '🎂', scene: 'fiesta', title: '¡Tu cumpleaños!',
    text: 'Se acerca tu cumpleaños. ¿Qué fiesta quieres?',
    choices: [
      { t: 'Piñata y payaso', eff: { p: 0.75, ok: { happy: 7, msg: 'La piñata explotó y hubo una estampida de niños. Fiesta perfecta.' }, ko: { happy: -2, msg: 'El payaso llegó borracho y lloró en el inflable. Inolvidable, por las razones equivocadas.' } } },
      { t: 'Fiesta temática de dinosaurios', eff: { happy: 6, smarts: 1, msg: 'Fiesta de dinosaurios. Tu tío se disfrazó de T-Rex y se cayó en la torta.' } },
      { t: 'Pedir dinero en vez de fiesta', eff: { money: [20, 200], happy: 2, skills: { crimen: 1 }, msg: 'Pediste el dinero en efectivo. Recaudaste {amount}. Futuro empresario o futuro estafador.' } }
    ] });
  ev({ id: 'jarron_roto', age: [5, 12], icon: '🏺', title: 'El jarrón',
    text: 'Rompiste el jarrón favorito de tu madre jugando a la pelota adentro.',
    choices: [
      { t: 'Confesar', eff: { karma: 3, happy: -2, msg: 'Confesaste. Te castigaron, pero tu madre valoró la honestidad (después de gritar).' } },
      { t: 'Culpar a tu hermano', when: H.has('hermano'), eff: (g) => { const s = U.pick(MV.rels(g, 'hermano')); s.r.rel = U.clamp(s.r.rel - 12, 0, 100); fx.stat(g, 'karma', -4); return `Culpaste a ${s.n.first}. Lo castigaron a él. Te mira con odio desde entonces.`; } },
      { t: 'Culpar a la mascota', when: H.has('mascota'), eff: { karma: -2, happy: 1, msg: 'Culpaste a la mascota. Nadie la castigó: es una mascota. Crimen perfecto.' } },
      { t: 'Esconder los pedazos', eff: { p: 0.35, ok: { happy: 2, skills: { crimen: 2 }, msg: 'Escondiste los pedazos en el jardín. Nadie se dio cuenta. Todavía.' }, ko: { happy: -6, msg: 'El perro desenterró los pedazos. Castigo doble por mentir.' } } }
    ] });
  ev({ id: 'oido_musical', age: [5, 12], once: true, icon: '🎵', scene: 'escuela', title: 'Oído musical',
    text: 'La profesora de música dice que tienes un oído especial.',
    choices: [
      { t: 'Aprender piano', eff: { skills: { musica: 8 }, happy: 2, msg: 'Empezaste piano. Ya tocas "Para Elisa" (mal).' } },
      { t: 'Aprender batería', eff: { skills: { musica: 7 }, happy: 4, msg: 'Empezaste batería. Los vecinos iniciaron una petición en tu contra.' } },
      { t: 'Que no me molesten', eff: { happy: 1, msg: 'Preferiste seguir comiendo plastilina. Respetable.' } }
    ] });
  ev({ id: 'deporte_infantil', age: [6, 12], icon: '⚽', title: 'Probar un deporte',
    text: 'Te invitan a probar un deporte en el club del barrio.',
    choices: [
      { t: 'Fútbol', eff: { skills: { deporte: 6 }, health: 3, happy: 3, msg: 'Jugaste de arquero. Te metieron 11 goles. Pero atajaste uno.' } },
      { t: 'Natación', eff: { skills: { deporte: 5 }, health: 4, msg: 'Aprendiste a nadar. Bueno, a no ahogarte, que ya es algo.' } },
      { t: 'Artes marciales', eff: { skills: { deporte: 6 }, health: 2, karma: 1, msg: 'Empezaste karate. Ahora rompes tablas (y una lámpara).' } },
      { t: 'Prefiero mi consola', eff: { happy: 3, health: -1, skills: { programacion: 1 }, msg: 'Elegiste la consola. Tus pulgares están en forma olímpica.' } }
    ] });
  ev({ id: 'pelea_patio', age: [6, 12], when: H.school, icon: '🥊', scene: 'escuela', title: 'Provocación',
    text: (g) => `Un compañero dice que tu ${U.pick(['madre', 'padre'])} tiene cara de sapo.`,
    choices: [
      { t: 'Ignorarlo', eff: { karma: 1, msg: 'Lo ignoraste. Él se aburrió y molestó a otro.' } },
      { t: 'Responder con un insulto creativo', eff: { p: (g) => 0.4 + g.p.skills.carisma / 100, ok: { happy: 5, skills: { carisma: 3 }, msg: 'Tu respuesta fue tan buena que todo el patio hizo "uuuuh". Ganaste.' }, ko: { happy: -3, msg: 'Te trabaste a la mitad del insulto. Se rieron de ti.' } } },
      { t: 'Pelear', eff: { p: (g) => 0.45 + g.p.skills.deporte / 200, ok: { happy: 4, karma: -2, msg: 'Ganaste la pelea. Te suspendieron, pero valió la pena.' }, ko: { health: -5, happy: -5, msg: 'Perdiste la pelea y tu dignidad. Volviste a casa con un ojo morado.' } } }
    ] });
  ev({ id: 'invento', age: [7, 12], icon: '💡', title: 'Un invento',
    text: (g) => `Se te ocurre un invento revolucionario: ${U.pick(['zapatillas con ruedas y frenos', 'un robot que hace la tarea', 'un paraguas para gatos', 'una máquina de hacer helado con la bici'])}.`,
    choices: [
      { t: 'Construirlo en el garaje', eff: { p: 0.35, ok: { smarts: 4, skills: { programacion: 2 }, money: [10, 300], msg: 'Funcionó (más o menos). Un vecino te lo compró por {amount}.' }, ko: { smarts: 2, health: -2, msg: 'Explotó. Un poco. Tus cejas volverán a crecer.' } } },
      { t: 'Dibujar los planos y guardarlos', eff: { smarts: 2, flag: 'inventor', msg: 'Guardaste los planos en una caja. Algún día...' } },
      { t: 'Olvidarlo', eff: { msg: 'Lo olvidaste a los cinco minutos. Así se pierden los genios.' } }
    ] });
  ev({ id: 'peli_terror', age: [4, 9], icon: '👻', text: 'Viste una película de terror a escondidas. No dormiste en una semana y ahora le temes a los payasos.', auto: { happy: -3, stress: 4 } });
  ev({ id: 'receta_abuela', age: [3, 12], when: H.has('abuelo'), target: H.rel('abuelo'), icon: '🥧', text: (g, ctx) => `${U.gw(H.t(g, ctx).gender, 'Tu abuelo', 'Tu abuela')} {t} te enseñó su receta secreta. Te hizo jurar que no la contarías.`, auto: { skills: { cocina: 4 }, rel: 5, happy: 2 } });
  ev({ id: 'libro_magos', age: [7, 12], icon: '🪄', text: 'Leíste un libro sobre magos y ahora apuntas a todo el mundo con una ramita.', auto: { happy: 2, smarts: 1 } });
  ev({ id: 'pregunta_dificil', age: [8, 12], when: H.school, icon: '✋', scene: 'escuela', title: 'Pregunta difícil',
    text: 'La maestra hace una pregunta difícil y mira a la clase. Silencio total.',
    choices: [
      { t: 'Levantar la mano', eff: (g) => { if (g.p.stats.smarts >= 55 || U.chance(0.3)) { fx.stat(g, 'smarts', 2); g.p.edu.perf = U.clamp(g.p.edu.perf + 5, 0, 100); return 'Respondiste bien. La maestra te sonrió. Los demás te odian un poquito.'; } fx.stat(g, 'happy', -4); return 'Respondiste "¿Napoleón?" a una pregunta de matemáticas. Risas generales.'; } },
      { t: 'Fingir que se te cayó el lápiz', eff: { msg: 'Te agachaste a buscar un lápiz imaginario hasta que preguntaron a otro.' } },
      { t: 'Responder con un chiste', eff: { skills: { carisma: 2 }, happy: 3, msg: 'Toda la clase se rió. La maestra no. Anotación en el cuaderno.' } }
    ] });
  ev({ id: 'vacaciones_familia', age: [4, 12], when: (g) => g.p.flags.clase !== 'pobre', icon: '🧳', scene: 'playa', title: 'Vacaciones en familia',
    text: 'Tus padres preguntan adónde quieres ir de vacaciones.',
    choices: [
      { t: 'A la playa', eff: { happy: 6, health: 1, msg: 'Fueron a la playa. Te enterraron en la arena y casi te olvidan ahí.' } },
      { t: 'A la montaña', eff: { happy: 5, health: 2, msg: 'Fueron a la montaña. Tu padre insistió en que "el aire es más puro". Llovió toda la semana.' } },
      { t: 'A visitar a la tía abuela', eff: { happy: 1, karma: 2, money: [5, 50], msg: 'Visitaron a la tía abuela. Te pellizcó los cachetes y te dio {amount}.' } }
    ] });
  ev({ id: 'dinero_patio', age: [6, 12], icon: '💵', title: 'Dinero en el suelo',
    text: 'Encuentras un billete en el suelo del patio de la escuela.',
    choices: [
      { t: 'Quedártelo', eff: { money: [10, 100], karma: -1, msg: 'Te quedaste {amount}. Nadie lo reclamó. Tu conciencia, un poco.' } },
      { t: 'Entregarlo a la maestra', eff: { karma: 4, happy: 1, msg: 'Lo entregaste. La maestra te felicitó delante de todos. Se lo quedó ella, probablemente.' } },
      { t: 'Comprar golosinas para todos', eff: { happy: 5, skills: { carisma: 3 }, karma: 1, msg: 'Compraste golosinas para toda la clase. Eres el rey/la reina del recreo por un día.' } }
    ] });
  ev({ id: 'tarea_perro', age: [7, 12], when: H.school, icon: '📓', scene: 'escuela', title: 'La tarea',
    text: 'Te diste cuenta en la fila de entrada: no hiciste la tarea.',
    choices: [
      { t: '"El perro se la comió"', eff: { p: 0.25, ok: { happy: 3, msg: 'La maestra te creyó. Increíble. Es que tienes cara de inocente.' }, ko: { happy: -3, msg: '"Tú no tienes perro", dijo la maestra. Silencio.' } } },
      { t: 'Copiarla en el recreo', eff: { p: 0.7, ok: { skills: { crimen: 1 }, msg: 'Copiaste la tarea de un compañero en 4 minutos. Récord.' }, ko: { happy: -4, msg: 'Copiaste hasta el nombre del compañero. Te descubrieron.' } } },
      { t: 'Asumirlo con honestidad', eff: { karma: 2, msg: 'Admitiste que no la hiciste. Te pusieron una nota baja y un poquito de respeto.' } }
    ] });
  ev({ id: 'hipo', age: [3, 9], icon: '😮', text: 'Tuviste hipo durante tres días seguidos. El barrio entero intentó asustarte.', auto: { happy: -1, fame: 1 } });
  ev({ id: 'disfraces', age: [4, 10], icon: '🦸', scene: 'fiesta', title: 'Fiesta de disfraces',
    text: 'Hay fiesta de disfraces en la escuela. ¿De qué te disfrazas?',
    choices: [
      { t: 'De superhéroe', eff: { happy: 5, msg: 'Fuiste de superhéroe. Intentaste volar desde una silla. No funcionó.' } },
      { t: 'De fantasma (una sábana)', eff: { happy: 2, msg: 'Fuiste de fantasma con una sábana. Chocaste con tres puertas.' } },
      { t: 'De la maestra', eff: { p: 0.5, ok: { happy: 6, skills: { carisma: 3 }, msg: 'Te disfrazaste de la maestra. Se rió tanto que te dio un premio.' }, ko: { happy: -4, msg: 'Te disfrazaste de la maestra. No le hizo gracia. Para nada.' } } }
    ] });
  ev({ id: 'superdotado', age: [6, 11], once: true, when: (g) => g.p.stats.smarts >= 85 && H.school(g), icon: '🧠', scene: 'escuela', title: 'Test de inteligencia',
    text: 'Un test revela que eres superdotado. La escuela no sabe qué hacer contigo.',
    choices: [
      { t: 'Adelantar un año', eff: { smarts: 4, happy: -2, then: (g) => { g.p.edu.year++; return 'Te adelantaron un año. Tus compañeros nuevos te tratan como a una mascota.'; } } },
      { t: 'Seguir con mis amigos', eff: { happy: 4, msg: 'Preferiste quedarte con tus amigos. Te aburres, pero eres feliz.' } },
      { t: 'Exigir un sueldo por ser genio', eff: { skills: { carisma: 2 }, happy: 2, msg: 'Exigiste un sueldo. Te dieron un diploma y una calcomanía.' } }
    ] });
  ev({ id: 'bici', age: [5, 10], once: true, icon: '🚲', title: 'Sin rueditas',
    text: 'Hoy aprendes a andar en bici sin rueditas.',
    choices: [
      { t: 'Con casco y rodilleras', eff: { happy: 4, health: 1, msg: 'Aprendiste a andar en bici. Pareces un astronauta, pero intacto.' } },
      { t: 'Sin casco, como los valientes', eff: { p: 0.7, ok: { happy: 6, msg: '¡Aprendiste a la primera! El viento en la cara. Libertad.' }, ko: { cond: 'fractura', happy: -5, msg: 'Te estrellaste contra un buzón. El buzón ganó.' } } },
      { t: 'Que me sigan sosteniendo', eff: { happy: 2, msg: 'Tu padre corrió detrás de ti dos kilómetros. Ahora él necesita un cardiólogo.' } }
    ] });
  ev({ id: 'amor_infantil', age: [8, 12], icon: '💌', scene: 'escuela', title: 'Te gusta alguien',
    text: 'Te gusta alguien de tu clase. Mucho. Te pones rojo cuando pasa.',
    choices: [
      { t: 'Darle una carta', eff: { p: 0.4, ok: { happy: 8, msg: 'Te respondió con otra carta: "Sí, me gustas. ¿Quieres compartir el recreo?"' }, ko: { happy: -6, msg: 'Leyó tu carta en voz alta frente a todos. Trauma desbloqueado.' } } },
      { t: 'Tirarle del pelo (método antiguo)', eff: { karma: -1, happy: -2, msg: 'Le tiraste del pelo. No funcionó. Nunca funciona.' } },
      { t: 'Sufrir en silencio', eff: { happy: -2, skills: { arte: 2 }, msg: 'Escribiste su nombre 400 veces en tu cuaderno. Arte puro.' } }
    ] });
  ev({ id: 'hermano_juguete', age: [4, 12], when: H.has('hermano'), target: H.rel('hermano'), icon: '🧸', title: 'Juguete roto',
    text: '{t} rompió tu juguete favorito. Dice que fue "sin querer".',
    choices: [
      { t: 'Perdonarl{to}', eff: { karma: 2, rel: 6, msg: 'Perdonaste a {t}. Te dio su postre como compensación.' } },
      { t: 'Romperle algo suyo', eff: { karma: -2, rel: -10, happy: 2, msg: 'Le rompiste algo a {t}. Ojo por ojo, juguete por juguete.' } },
      { t: 'Acusarl{to} con mamá', eff: { rel: -5, msg: 'Acusaste a {t}. Lo castigaron. Ahora planea su venganza.' } }
    ] });
  ev({ id: 'abuelo_cuentos', age: [3, 10], when: H.has('abuelo'), target: H.rel('abuelo'), icon: '👴', text: '{t} te contó historias de cuando era joven. La mitad son mentira, pero son las mejores.', auto: { smarts: 1, happy: 2, rel: 4 } });
  ev({ id: 'piojos_escuela', age: [4, 11], when: H.school, icon: '🪳', text: 'Hubo una epidemia de piojos en la escuela. Tu madre te pasó el peine fino durante tres horas.', auto: { happy: -2, then: (g) => { if (U.chance(0.5)) MV.sys.health.add(g, 'piojos'); } } });
  ev({ id: 'acto_escolar', age: [5, 12], when: H.school, icon: '🎭', scene: 'escuela', title: 'Acto escolar',
    text: 'Te dieron un papel en el acto escolar.',
    choices: [
      { t: 'Darlo todo como protagonista', eff: { p: 0.6, ok: { happy: 6, skills: { carisma: 4 }, msg: 'Fuiste la estrella del acto. Tu familia filmó todo y lo pasará en cada Navidad.' }, ko: { happy: -5, msg: 'Olvidaste tu texto y te quedaste congelado. Alguien estornudó. Fue lo más emocionante.' } } },
      { t: 'Ser el árbol del fondo', eff: { happy: 1, msg: 'Fuiste el árbol. El mejor árbol de la historia del colegio.' } },
      { t: 'Fingir fiebre ese día', eff: { karma: -1, msg: 'Fingiste fiebre. Tu madre no te creyó, pero te dejó faltar igual.' } }
    ] });
  ev({ id: 'mascota_hamster', age: [6, 12], when: (g) => !MV.rels(g, 'mascota').length, once: true, icon: '🐹', title: 'La mascota del aula',
    text: 'La maestra pregunta quién quiere cuidar al hámster del aula durante las vacaciones.',
    choices: [
      { t: 'Yo, yo, yo', eff: { p: 0.75, ok: { happy: 5, karma: 2, msg: 'Cuidaste al hámster. Sobrevivió. Eres responsable.' }, ko: { happy: -6, msg: 'El hámster se escapó y vive dentro de la pared de tu casa. A veces lo escuchas.' } } },
      { t: 'No, gracias', eff: { msg: 'Se lo llevó otro. Volvió con otro hámster parecido. Nadie dijo nada.' } }
    ] });
  ev({ id: 'trabajo_padres', age: [6, 12], when: (g) => parents(g).length > 0, target: H.rel('padre'), icon: '🏢', text: (g, ctx) => `Fuiste con {t} al trabajo (${(H.t(g, ctx).job || 'su trabajo').toLowerCase()}). Te aburriste, pero te regalaron caramelos.`, auto: { happy: 2, rel: 3, smarts: 1 } });
  ev({ id: 'nieve', age: [4, 14], icon: '⛄', text: 'Nevó por primera vez en años. Hiciste un muñeco de nieve que parecía un político.', auto: { happy: 4 } });
})(window.MV = window.MV || {});
