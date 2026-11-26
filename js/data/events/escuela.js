/* Mil Vidas — los eventos de la escuela: cada uno nombra a quien corresponde del curso y se va si esa persona ya no está. */
(function (MV) {
  'use strict';
  const U = MV.U, ev = MV.ev, fx = MV.fx;
  const S = () => MV.sys.school;
  const clamp = U.clamp;

  /** Barra de popularidad sin crearla. */
  const bar = (g) => { const e = g.p.edu; return e.pop == null ? S().basePop(g.p) : e.pop; };
  const secondary = (g) => g.p.edu.stage === 'secundaria';
  /** Compañero del curso con ese id, o null. */
  const mateOf = (g, id) => S().mates(g).find((x) => x.n.id === id) || null;
  /** Id de un compañero al azar con alguno de esos papeles, o null. */
  const pickMate = (g, roles) => { const x = U.pick(S().mates(g).filter((y) => roles.includes(y.m.role))); return x ? x.n.id : null; };
  /** "el profesor Pérez" / "la maestra Ana" (o "el profesor" sin nadie). */
  const tutor = (g) => { const t = S().teacher(g); return t ? `${U.gw(t.n.gender, 'el', 'la')} ${t.n.job.toLowerCase()} ${t.n.first}` : 'el profesor'; };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  /** Cómo se llama su papel, en su género: "tu rival", "tu mejor amiga". */
  const lab = (n, role) => {
    if (role === 'rival') return 'tu rival';
    if (role === 'amigo') return U.gw(n.gender, 'tu mejor amigo', 'tu mejor amiga');
    if (role === 'payaso') return U.gw(n.gender, 'el payaso del curso', 'la payasa del curso');
    if (role === 'abuson') return U.gw(n.gender, 'el abusón del curso', 'la abusona del curso');
    return U.gw(n.gender, 'un compañero', 'una compañera');
  };
  const bumpRel = (g, id, d) => { const r = MV.relOf(g, id); if (r) r.rel = clamp(r.rel + d, 0, 100); };
  const bumpParents = (g, d) => MV.rels(g, 'padre').forEach((x) => { x.r.rel = clamp(x.r.rel + d, 0, 100); });
  const perf = (g, d) => { const e = g.p.edu; e.perf = clamp((e.perf || 0) + d, 0, 100); };
  /** Efecto `then` que mueve la barra de popularidad. */
  const pop = (d) => (g) => { S().pop(g, d); return ''; };
  /** Marca al abusón por su id para "Enfrentar al abusón". */
  const markBully = (g, ctx) => { g.p.flags.abuson = ctx.target; return ''; };

  /**
   * Evento de la escuela. `who`: papeles del compañero del que habla ('teacher' para el tutor);
   * `fresh(g)`: condición que solo se mira al sortearlo; `keep(g, ctx)`: la que se mira siempre.
   * Si la persona ya no está en el curso, el evento en cola se descarta.
   */
  const esc = (d) => {
    const who = d.who, fresh = d.fresh || (() => true), keep = d.keep || (() => true);
    const here = (g, ctx) => {
      const id = ctx && ctx.target;
      if (!id) return true;
      if (who === 'teacher') { const t = S().teacher(g); return !!t && t.n.id === id; }
      const x = mateOf(g, id);
      return !!x && who.includes(x.m.role);
    };
    const def = Object.assign({ scene: 'escuela' }, d, {
      when: (g, ctx) => S().active(g.p) && here(g, ctx) && keep(g, ctx) && (ctx || fresh(g)),
      target: d.target || ((g) => { if (who === 'teacher') { const t = S().teacher(g); return t ? t.n.id : null; } return pickMate(g, who); })
    });
    delete def.who; delete def.fresh; delete def.keep;
    return ev(def);
  };

  // 1. Elección de delegado
  esc({ id: 'esc_delegado', age: [12, 17], who: ['rival'], fresh: (g) => secondary(g) && bar(g) >= MV.SCHOOL.HIGH, icon: '🗳️', title: 'Elección de delegado',
    text: (g, ctx) => `Hay elecciones de delegado y varios compañeros te propusieron como candidat{o}. ${MV.person(g, ctx.target).first}, tu rival, ya empapeló el pasillo con carteles. Las promesas van desde "más recreo" hasta "una máquina de helados en el patio".`,
    choices: [
      { t: 'Presentarte con propuestas serias', eff: { p: (g) => clamp((bar(g) - 20) / 100 + g.p.stats.smarts / 500, 0.2, 0.9),
        ok: { happy: 6, karma: 1, ach: 'delegado', then: pop(5), msg: 'Diste un discurso sobre los baños y el recreo largo. Ganaste por amplia mayoría: ahora eres delegad{o} del curso, con todo y brazalete.' },
        ko: { happy: -3, then: pop(-2), msg: 'Tu discurso fue tan serio que a mitad de camino se durmieron hasta los de la primera fila. Ganó {t}.' } } },
      { t: 'Hacer campaña con memes y caramelos', eff: { p: (g) => clamp(bar(g) / 130 + g.p.skills.carisma / 300, 0.2, 0.85),
        ok: { happy: 7, ach: 'delegado', skills: { carisma: 2 }, then: pop(5), msg: 'Tus memes del profe y tus caramelos hicieron milagros. Ganaste: eres delegad{o} del curso y ya tienes lista de pedidos.' },
        ko: { happy: -4, then: pop(-3), msg: 'Te descalificaron por repartir caramelos en horario de clase. {t} ganó y te miró con aire de víctima.' } } },
      { t: 'Dejar que se presente otro', eff: { happy: -1, msg: 'Te quedaste mirando desde la última fila. Ganó {t} y ahora reparte tareas con cara de presidente.' } }
    ] });

  // 2. Cumpleaños o fiesta del curso
  esc({ id: 'esc_cumple', age: [6, 17], who: ['amigo', 'payaso', 'rival', 'comun'], fresh: (g) => bar(g) >= MV.SCHOOL.HIGH || bar(g) <= MV.SCHOOL.LOW, icon: '🎂', title: 'Cumpleaños del curso',
    target: (g) => pickMate(g, bar(g) >= MV.SCHOOL.HIGH ? ['amigo', 'payaso'] : ['payaso', 'rival']) || pickMate(g, ['amigo', 'payaso', 'rival', 'comun']),
    ctx: (g) => ({ mode: bar(g) >= MV.SCHOOL.HIGH ? 'in' : 'out' }),
    text: (g, ctx) => ctx.mode === 'in'
      ? `{t} festeja su cumpleaños con piñata, torta y un animador que nadie pidió. Te invitó entre los primeros: dijo que "sin ti no es lo mismo".`
      : `{t} hizo una fiesta de cumpleaños y te enteraste por los comentarios del recreo. No te invitaron, y no es que hayas esperado la tarjeta con ansias. Bueno, un poco sí.`,
    choices: [
      { t: 'Ir con un regalo', sub: '$30', when: (g, ctx) => ctx.mode === 'in' && g.p.money >= 30, eff: (g, ctx) => { fx.money(g, -30); fx.stat(g, 'happy', 6); S().pop(g, 3); bumpRel(g, ctx.target, 6); return 'Llevaste un regalo envuelto con tanto papel que {t} tardó más en abrirlo que en jugar con él. Fue un éxito.'; } },
      { t: 'Ir con las manos vacías', when: (g, ctx) => ctx.mode === 'in', eff: (g, ctx) => { fx.stat(g, 'happy', 4); S().pop(g, 3); bumpRel(g, ctx.target, 2); return 'Llegaste sin regalo, pero con muy buen humor, y te llevaste dos porciones de torta por las dudas.'; } },
      { t: 'Quedarte en casa estudiando', when: (g, ctx) => ctx.mode === 'in', eff: (g) => { fx.stat(g, 'happy', -1); perf(g, 2); return 'Te quedaste estudiando. La torta no se enteró y tus apuntes tampoco.'; } },
      { t: 'Hacer como si nada', when: (g, ctx) => ctx.mode === 'out', eff: (g) => { fx.stat(g, 'happy', -3); return 'Hiciste como si nada. En el recreo hablaste del clima con una intensidad sospechosa.'; } },
      { t: (g) => { const a = S().mate(g, 'amigo'); return a ? `Armar tu propio plan con ${lab(a.n, 'amigo')}` : 'Armar tu propio plan'; }, when: (g, ctx) => ctx.mode === 'out', eff: (g) => { const a = S().mate(g, 'amigo'); fx.stat(g, 'happy', 3); if (a) bumpRel(g, a.n.id, 6); return `${a ? `Tú y ${a.n.first}` : 'Tú'} se hicieron su propio festejo con pizza y una película de terror mala. Muy superior, según ustedes.`; } },
      { t: 'Preguntar sin vueltas por qué', when: (g, ctx) => ctx.mode === 'out', eff: { p: 0.5, ok: { happy: 1, rel: 8, msg: '{t} se puso colorad{to}: la invitación se había perdido entre mensajes. Te pidió perdón y te guardó torta.' }, ko: { happy: -4, msg: '{t} contestó: "ay, es que éramos pocos". Eran treinta.' } } }
    ] });

  // 3. Trabajo en grupo
  esc({ id: 'esc_grupo', age: [8, 17], who: ['rival', 'amigo'], icon: '📚', title: 'Trabajo en grupo',
    text: (g, ctx) => { const x = mateOf(g, ctx.target); return `${cap(tutor(g))} armó los grupos del trabajo práctico y te tocó con {t}, ${lab(x.n, x.m.role)}. Hay que entregarlo en una semana.`; },
    choices: [
      { t: 'Hacerlo todo tú', eff: (g, ctx) => { perf(g, 6); fx.stat(g, 'stress', 4); bumpRel(g, ctx.target, -2); return 'Lo hiciste todo tú, hasta la portada con letras de colores. Sacaron buena nota y {t} ni lo miró.'; } },
      { t: 'Repartir el trabajo', eff: (g, ctx) => { perf(g, 4); fx.skill(g, 'carisma', 2); fx.stat(g, 'happy', 2); bumpRel(g, ctx.target, 6); return 'Se repartieron las partes. Discutieron por la tipografía, pero entregaron a tiempo y casi sin gritos.'; } },
      { t: 'Dejar que lo haga {t}', eff: { p: 0.55,
        ok: { karma: -2, rel: -6, then: (g) => { perf(g, 3); return ''; }, msg: 'Dejaste que {t} cargara con todo y pusiste tu nombre en la portada. Sacaron una nota excelente. Te sientes un poquito culpable.' },
        ko: { karma: -2, rel: -6, then: (g) => { perf(g, -3); return ''; }, msg: '{t} hizo la mitad del trabajo, y la mitad equivocada. Sacaron una nota bajísima y se culparon mutuamente.' } } }
    ] });

  // 4. El rival te desafía
  esc({ id: 'esc_rival', age: [8, 17], who: ['rival'], icon: '⚔️', title: 'El desafío del rival',
    ctx: () => ({ kind: U.pick(['notas', 'carrera']) }),
    text: (g, ctx) => ctx.kind === 'notas'
      ? '{t}, tu rival, te desafía delante de todos: "A ver quién saca mejor nota en el próximo examen". Alguien ya empezó a apostar caramelos.'
      : '{t}, tu rival, te desafía delante de todos a una carrera hasta el árbol del patio. Alguien ya trajo un pañuelo para la largada.',
    choices: [
      { t: 'Aceptar el desafío', eff: { p: (g, ctx) => clamp(ctx.kind === 'notas' ? 0.3 + g.p.stats.smarts / 200 + (g.p.edu.perf || 0) / 500 : 0.3 + g.p.skills.deporte / 200 + g.p.stats.health / 400, 0.15, 0.85),
        ok: { happy: 5, rel: -3, then: pop(4), msg: 'Ganaste. {t} se fue murmurando que "fue de casualidad". Todo el curso lo vio y lo sabe.' },
        ko: { happy: -4, then: pop(-3), msg: 'Perdiste por muy poco, que es la forma más molesta de perder. {t} lo celebró como si fuera el Mundial.' } } },
      { t: 'Proponer un empate', eff: { karma: 1, rel: 6, happy: 1, msg: 'Propusiste un empate "por el bien de todos". {t} aceptó, desconfiad{to}, y por un día hubo paz en el patio.' } },
      { t: 'Ignorar el desafío', eff: (g) => { fx.stat(g, 'happy', -1); S().pop(g, -2); return 'Hiciste oídos sordos. {t} lo tomó como una victoria y se lo contó a medio colegio.'; } }
    ] });

  // 5. El abusón te elige
  esc({ id: 'esc_abuson', age: [6, 17], who: ['abuson'], icon: '😠', title: (g, ctx) => `${U.gw((MV.person(g, ctx.target) || {}).gender, 'El abusón', 'La abusona')} te elige`,
    w: (g) => (bar(g) <= MV.SCHOOL.LOW ? 3 : 1),
    text: (g) => secondary(g)
      ? '{t} te acorraló junto a los casilleros y te exigió que le pases la tarea, además de tus apuntes. "Total, tú entiendes", dijo, sin ningún argumento más.'
      : '{t} te frenó en el patio y te exigió la merienda: "como cada día". Nadie dijo que fuera costumbre, pero ya lo parece.',
    choices: [
      { t: (g) => { const t = S().teacher(g); return t ? `Contárselo ${U.gw(t.n.gender, 'al', 'a la')} ${t.n.job.toLowerCase()}` : 'Contárselo al tutor'; },
        eff: (g, ctx) => {
          if (U.chance(0.6)) { fx.stat(g, 'happy', 3); fx.stat(g, 'karma', 1); return `${cap(tutor(g))} habló con {t}. Ahora te mira de lejos, y sin gritar. Un avance.`; }
          fx.stat(g, 'happy', -6); S().pop(g, -3); markBully(g, ctx);
          return `${cap(tutor(g))} habló con {t}, pero {el} te llamó chivat{o} delante de todos. Ahora te odia con motivo.`;
        } },
      { t: 'Plantarle cara', eff: { p: (g) => clamp(0.35 + g.p.skills.deporte / 150 + g.p.stats.health / 400, 0.1, 0.85),
        ok: { happy: 8, karma: 1, rel: -4, then: pop(8), msg: 'Le dijiste "basta" sin parpadear. {t} se quedó callad{to}, miró alrededor y se fue. Por un día, en el recreo no se habló de otra cosa.' },
        ko: { happy: -6, stress: 3, then: (g, ctx) => { S().pop(g, -5); return markBully(g, ctx); }, msg: 'Le dijiste "basta" con voz de ratón. {t} se rió, se llevó lo que quería y encima te sacó la lengua.' } } },
      { t: 'Ignorarl{to}', eff: (g, ctx) => { fx.stat(g, 'happy', -4); S().pop(g, -1); markBully(g, ctx); return 'Hiciste como si {t} no existiera. Funcionó un día. Al siguiente {el} volvió, con más ganas.'; } },
      { t: 'Hacerte su amig{o}', eff: { p: (g) => clamp(0.3 + g.p.skills.carisma / 150, 0.1, 0.8),
        ok: { happy: 5, rel: 15, skills: { carisma: 3 }, then: pop(3), msg: 'Le hiciste un chiste y se rió. Ahora te saluda en el pasillo y hasta te cuida la merienda.' },
        ko: { happy: -5, then: (g, ctx) => { S().pop(g, -3); return markBully(g, ctx); }, msg: 'Le contaste un chiste que no entendió y ahora cree que te burlaste de {el}. Mal comienzo para una amistad.' } } }
    ] });

  // 6. Ves al abusón molestar a otro
  esc({ id: 'esc_testigo', age: [7, 17], who: ['rival', 'payaso', 'comun'], keep: (g) => !!S().mate(g, 'abuson'), icon: '👀', title: 'Lo que viste en el recreo',
    ctx: (g) => { const a = S().mate(g, 'abuson'); return { b: a ? a.n.first : 'alguien', be: a ? U.gw(a.n.gender, 'él', 'ella') : 'él' }; },
    text: '{b} le escondió los útiles a {t} y se ríe con dos amigos. {t} se quedó quiet{to}, colorad{to} hasta las orejas, sin saber qué hacer.',
    choices: [
      { t: 'Defenderl{to}', eff: { p: (g) => clamp(0.45 + g.p.skills.carisma / 200 + g.p.skills.deporte / 400, 0.2, 0.85),
        ok: { karma: 3, happy: 3, rel: 15, then: pop(3), msg: 'Le dijiste a {b} que dejara en paz a {t}. Por una vez, {be} te hizo caso, y {t} te miró como si hubieras salvado el recreo.' },
        ko: { karma: 2, happy: -2, rel: 8, then: pop(-2), msg: 'Intentaste defender a {t}, pero {b} te dejó sin palabras. Al menos {t} vio que lo intentaste.' } } },
      { t: 'Mirar para otro lado', eff: (g, ctx) => { fx.stat(g, 'karma', -1); fx.stat(g, 'happy', -2); bumpRel(g, ctx.target, -4); return 'Miraste para otro lado. Te sentiste mal el resto del día, y la merienda no te ayudó.'; } },
      { t: 'Sumarte a la burla', eff: (g, ctx) => S().tease(g, ctx.target, 'burla') }
    ] });

  // 7. Quien te gusta te escribe
  esc({ id: 'esc_crush', age: [14, 17], who: ['crush'], icon: '💘', title: 'Un mensaje',
    fresh: (g) => g.p.age >= 14 && !MV.partner(g) && !!S().mate(g, 'crush') && MV.sys.rels.canRomance(g, S().mate(g, 'crush').n, S().mate(g, 'crush').r),
    keep: (g) => { const c = S().mate(g, 'crush'); return !!c && !MV.partner(g) && MV.sys.rels.canRomance(g, c.n, c.r); },
    text: () => `{t} te escribió un mensaje: "${U.pick(['¿hiciste la tarea de mate?', '¿me prestas tu goma?', 'te guardé un lugar en el recreo', 'hoy te vi en el patio y me acordé de ti'])}". Lo releíste ocho veces y después apagaste el celular, por si acaso.`,
    choices: [
      { t: 'Proponerle salir', when: (g, ctx) => { const x = mateOf(g, ctx.target); return !!x && !MV.partner(g) && MV.sys.rels.canRomance(g, x.n, x.r); },
        eff: (g, ctx) => { const x = mateOf(g, ctx.target); if (U.chance(clamp(x.r.rel / 110 + g.p.skills.carisma / 300, 0.1, 0.85))) return MV.sys.rels.startDating(g, x.n); x.r.rel = clamp(x.r.rel - 5, 0, 100); fx.stat(g, 'happy', -3); return `Le propusiste salir y {t} contestó que "tiene que hacer la tarea". Tarea de qué, no aclaró.`; } },
      { t: 'Responder con un meme', eff: { rel: 8, happy: 3, msg: 'Le mandaste un meme de un gato en un monopatín. {t} respondió con tres emojis de risa y una pregunta sobre el gato.' } },
      { t: 'Compartir tu merienda en el recreo', eff: { rel: 10, happy: 4, msg: 'Compartieron una bolsa de papas en el recreo y se rieron de nada en particular. Fue mejor que cualquier cita en una película.' } },
      { t: 'Fingir que no lo viste', eff: { rel: -3, happy: -2, msg: 'Dejaste el mensaje sin responder. Tu mano temblaba y tu orgullo, también. Ya lo estás lamentando.' } }
    ] });

  // 8. Pelea con tu mejor amigo
  esc({ id: 'esc_pelea_amigo', age: [7, 17], who: ['amigo'], icon: '💢', title: 'Peleados',
    text: () => `{t}, tu mejor amig{to}, se enojó contigo por ${U.pick(['una tontería: dijiste que su serie favorita era "para bebés"', 'haberle contado un secreto a otra persona, sin querer, pero igual', 'sentarte con otro grupo en el almuerzo', 'no devolverle un cuaderno que ya ni recuerdas haber pedido'])}. Hace dos días que no se hablan.`,
    choices: [
      { t: 'Pedirle perdón', eff: { rel: 10, karma: 1, happy: 2, msg: 'Le pediste perdón con una nota y una galletita. {t} la aceptó con una condición: no volver a tocar el tema de la serie.' } },
      { t: 'Esperar a que se le pase', eff: { p: 0.5, ok: { rel: 4, msg: 'Se le pasó solo. Un día llegó al aula y te pidió una goma como si nada. Amistad restaurada, orgullo intacto.' }, ko: { rel: -10, happy: -3, msg: 'Pasó una semana sin hablarse. Ahora ni te acuerdas de qué pelea era, pero ninguno quiere ser el primero.' } } },
      { t: 'Romper la amistad', eff: (g, ctx) => { const x = mateOf(g, ctx.target); if (x) { x.r.rel = Math.min(x.r.rel, 15); x.m.role = 'comun'; } fx.stat(g, 'happy', -5); fx.stat(g, 'karma', -1); fx.stat(g, 'stress', 2); return 'Dijiste que ya no eran amigos. Fue mucho más fácil de decir que de aguantar a la hora del recreo.'; } }
    ] });

  // 9. El tutor ve tu talento
  const TALENT = {
    musica: ['la música', 'un concurso de bandas entre escuelas'], deporte: ['el deporte', 'unas olimpíadas deportivas interescolares'],
    cocina: ['la cocina', 'un concurso de cocina escolar'], programacion: ['la programación', 'una olimpíada de programación'],
    arte: ['el arte', 'un concurso de dibujo y pintura'], carisma: ['hablar en público', 'un torneo de oratoria'], idiomas: ['los idiomas', 'una olimpíada de idiomas']
  };
  /** La habilidad en la que destacas: la de tu taller o la más alta (60 o más), o null. */
  const talent = (g) => {
    const p = g.p, out = [];
    MV.sys.edu.clubsOf(p).forEach((id) => { const c = MV.sys.edu.clubInfo(id); const k = c && (c.workshop ? c.workshop.skill : 'deporte'); if (TALENT[k]) out.push(k); });
    Object.keys(TALENT).forEach((k) => { if ((p.skills[k] || 0) >= 60) out.push(k); });
    return out.sort((a, b) => (p.skills[b] || 0) - (p.skills[a] || 0))[0] || null;
  };
  esc({ id: 'esc_talento', age: [8, 17], who: 'teacher', fresh: (g) => !!talent(g), icon: '🌟', title: 'Un talento a la vista',
    text: (g) => { const k = talent(g) || 'arte'; return `${cap(tutor(g))} te llamó aparte: "Tienes un talento especial para ${TALENT[k][0]}. Hay ${TALENT[k][1]} y creo que deberías participar".`; },
    choices: [
      { t: 'Aceptar y prepararte', eff: (g) => {
        const k = talent(g) || 'arte', p = g.p;
        if (U.chance(clamp(0.35 + (p.skills[k] || 0) / 200 + p.stats.smarts / 500, 0.2, 0.85))) { fx.skill(g, k, 4); fx.stat(g, 'happy', 8); perf(g, 4); S().pop(g, 4); return `Practicaste todo el año y llegaste a ganar en ${TALENT[k][1]}. Tu foto salió en el cuadro de honor, con una sonrisa dudosa.`; }
        fx.skill(g, k, 2); fx.stat(g, 'happy', -2); return `No ganaste en ${TALENT[k][1]}, pero aprendiste mucho y conociste gente simpática. Y volviste con una medalla de participación.`;
      } },
      { t: 'Pedir tiempo para pensarlo', eff: { msg: 'Dijiste que lo ibas a pensar. Lo pensaste tanto que cerraron la inscripción.' } },
      { t: 'Decir que no, por vergüenza', eff: { happy: -2, msg: 'Dijiste que no, que te daba vergüenza. {t} asintió con una mirada que decía "algún día".' } }
    ] });

  // 10. Citación a tus padres
  esc({ id: 'esc_citacion', age: [6, 17], who: 'teacher', icon: '📨', title: 'Citación',
    fresh: (g) => { const e = g.p.edu; return (e.susp || 0) > 0 || (e.lastBully != null && e.lastBully >= g.p.age - 1); },
    text: (g) => { const e = g.p.edu, par = MV.rels(g, 'padre').length ? 'tus padres' : 'tu familia'; return `${cap(tutor(g))} citó a ${par} a la escuela ${(e.susp || 0) > 0 ? 'por tu suspensión' : 'por cómo te portaste con tus compañeros'}. En casa ya se huele la tormenta.`; },
    choices: [
      { t: 'Admitir lo que hiciste', eff: (g) => { fx.stat(g, 'karma', 2); fx.stat(g, 'stress', 4); bumpParents(g, -3); return 'Dijiste la verdad, sin adornos. En casa suspiraron, pero te apretaron la mano al salir. Menos mal.'; } },
      { t: 'Poner cara de ángel', eff: { p: (g) => clamp(0.35 + g.p.skills.carisma / 200, 0.2, 0.8),
        ok: { happy: 3, msg: 'Pusiste cara de ángel y hasta soltaste una lagrimita. Se lo creyeron todo. Tienes talento para la actuación.' },
        ko: { happy: -4, stress: 4, then: (g) => { bumpParents(g, -8); return ''; }, msg: 'La cara de ángel no convenció a nadie, y se nota. Te explicaron durante media hora lo que opinan de las caras de ángel.' } } },
      { t: 'Echarle la culpa a otro', eff: { p: 0.3,
        ok: { karma: -3, happy: 2, msg: 'Echaste la culpa a alguien del curso, y por esta vez coló. Tu conciencia te anda mirando con cara fea.' },
        ko: { karma: -3, happy: -6, then: (g) => { bumpParents(g, -10); return ''; }, msg: 'Tu historia tenía tantos agujeros que se coló el ruido del viento. Terminaron sabiendo la verdad y la mentira.' } } }
    ] });

  // 11. Viste a alguien copiarse
  esc({ id: 'esc_copia', age: [8, 17], who: ['rival', 'comun', 'payaso', 'abuson'], icon: '📝', title: 'Machete en la manga',
    text: (g) => `En el examen ves que {t} mira un machete escondido en la manga. ${cap(tutor(g))} está de espaldas, borrando el pizarrón.`,
    choices: [
      { t: 'Acusarl{to}', eff: (g, ctx) => { fx.stat(g, 'karma', 1); S().pop(g, -6); bumpRel(g, ctx.target, -15); const t = S().teacher(g); if (t) t.r.rel = clamp(t.r.rel + 5, 0, 100); return `Levantaste la mano y ${U.gw((MV.person(g, ctx.target) || {}).gender, 'lo', 'la')} acusaste. ${cap(tutor(g))} le sacó el examen, y {t} te miró con cara de "esto no se queda así".`; } },
      { t: 'Callarte', eff: { stress: 2, msg: 'Te callaste. Hasta el final del examen sentiste que alguien debía decir algo, y ese alguien no eras tú.' } },
      { t: 'Pedirle que te pase las respuestas', eff: (g) => {
        const t = S().teacher(g), K = (t && t.K) || {};
        fx.stat(g, 'karma', -2);
        if (U.chance(clamp(0.5 + (K.cheat || 0), 0.2, 0.8))) { perf(g, 5); return '{t} te pasó las respuestas con un papelito. Sacaste una buena nota, aunque tu conciencia no se ve tan bien.'; }
        perf(g, -5); fx.stat(g, 'stress', 4); S().pop(g, -2);
        return `${cap(tutor(g))} vio el papelito y se lo quedó. Les anotó a los dos un cero y una carita triste.`;
      } }
    ] });

  // 12. Foto vergonzosa
  esc({ id: 'esc_foto', age: [12, 17], who: ['payaso', 'rival', 'comun', 'abuson'], icon: '📸', title: 'Foto vergonzosa',
    text: 'Alguien sacó una foto de ti dormid{o} en clase, con la boca abierta y un hilito de baba. Ya circula por todos los celulares del curso. {t} fue quien la reenvió primero.',
    choices: [
      { t: 'Reírte de ti', eff: (g) => { S().pop(g, -8); if (g.p.skills.carisma >= 40) { S().pop(g, 4); fx.stat(g, 'happy', 2); return 'Te reíste primero, te hiciste un sticker con la foto y hasta lo pusiste de foto de perfil. Recuperaste la mitad del respeto perdido.'; } fx.stat(g, 'happy', -2); return 'Te reíste, pero se notó que era una risa de las que duelen. La foto sigue dando vueltas.'; } },
      { t: 'Enojarte', eff: (g, ctx) => { S().pop(g, -8); fx.stat(g, 'happy', -4); fx.stat(g, 'stress', 4); bumpRel(g, ctx.target, -10); return 'Te enojaste a los gritos con {t}. Fue mucho peor: ahora hay una segunda foto, de tu cara enojada.'; } },
      { t: 'Ignorar la foto', eff: (g) => { S().pop(g, -8); fx.stat(g, 'stress', 2); return 'Hiciste como si la foto no existiera. En una semana nadie se acordaba. Bueno, casi nadie.'; } }
    ] });
  // — Romance con un docente universitario (adultos) y comité de ética —
  const SUBJ = {
    medicina: 'Anatomía', derecho: 'Derecho Civil', ingenieria: 'Análisis Matemático', informatica: 'Algoritmos', psicologia: 'Psicología Social',
    administracion: 'Gestión de Empresas', economia: 'Macroeconomía', arquitectura: 'Historia de la Arquitectura', educacion: 'Didáctica',
    periodismo: 'Redacción Periodística', biologia: 'Genética', enfermeria: 'Cuidados Críticos', veterinaria: 'Fisiología Animal',
    bellasartes: 'Dibujo', musica: 'Armonía', filosofia: 'Ética', idiomas: 'Lingüística', gastronomia: 'Técnicas de Cocina',
    mecanica: 'Motores', electricidad: 'Circuitos', estetica: 'Colorimetría', programacion: 'Desarrollo Web', aviacion: 'Navegación Aérea'
  };
  const SUBJ_GEN = ['Metodología de la Investigación', 'Estadística', 'Historia del Pensamiento', 'Redacción Académica', 'Ética Profesional'];
  const profKey = (e) => e.stage + ':' + (e.major || e.type || '');
  const markProf = (g) => { g.p.edu.profEv = profKey(g.p.edu); };
  const RO = ['pareja', 'conyuge', 'amante'];
  const suspended = (n) => U.gw(n.gender, 'Profesor suspendido', 'Profesora suspendida');

  ev({ id: 'uni_profe', age: [18, 130], w: 0.5, cd: 3, icon: '🍎', scene: 'universidad', title: 'Un docente te mira distinto',
    when: (g) => { const p = g.p, e = p.edu; return p.age >= 18 && !!e && MV.sys.edu.inHigher(p) && (p.stats.looks >= 50 || p.skills.carisma >= 50) && e.profEv !== profKey(e); },
    ctx: (g) => {
      const p = g.p, e = p.edu, gender = p.orientation === 'bi' ? U.pick(['m', 'f']) : p.orientation === 'homo' ? p.gender : (p.gender === 'm' ? 'f' : 'm');
      const key = e.stage === 'posgrado' ? ((e.degrees || []).find((d) => d.kind === 'universidad') || {}).major : e.major;
      return { pf: MV.randomFirst(gender, p.country), pl: MV.randomLast(p.country), pg: gender, pa: U.int(28, 60), subj: SUBJ[key] || U.pick(SUBJ_GEN) };
    },
    text: (g, ctx) => `${U.gw(ctx.pg, 'El profesor', 'La profesora')} ${ctx.pf} ${ctx.pl}, de ${ctx.subj}, te pidió que te quedaras un momento después de clase. Habló de tu trabajo final treinta segundos y después, mirando el escritorio, te invitó a tomar un café "fuera del campus". Tiene ${ctx.pa} años y fama de dar el examen oral más temido de la facultad. Tu corazón acaba de hacer un parcial sorpresa.`,
    choices: [
      { t: 'Aceptar', eff: (g, ctx) => {
        markProf(g);
        const cur = MV.partner(g);
        const n = MV.newNPC(g, { first: ctx.pf, last: ctx.pl, gender: ctx.pg, age: ctx.pa, job: U.gw(ctx.pg, 'Profesor universitario', 'Profesora universitaria') });
        if (!MV.sys.rels.canRomance(g, n, null)) { // antes de la relación: una pareja ya no "puede" ser pareja
          delete g.people[n.id];
          return `Ibas a decir que sí, pero te echaste atrás en la puerta del aula. ${U.gw(ctx.pg, 'El profesor', 'La profesora')} ${ctx.pf} se quedó con el café frío y tú, con la duda.`;
        }
        MV.addRel(g, n, cur ? 'amante' : 'pareja', U.int(60, 75)).prof = true;
        MV.fx.stat(g, 'happy', 6);
        return `Dijiste que sí. El café se alargó hasta la cena y el resto de la noche no es asunto de nadie. Desde entonces ${ctx.pf} te manda mensajes con bibliografía y emojis, y lo sospechoso son los emojis.${cur ? ` ${cur.n.first} no sabe nada... todavía.` : ''}`;
      } },
      { t: 'Rechazar con amabilidad', eff: (g, ctx) => { markProf(g); return `Le agradeciste la invitación y dijiste que preferías mantener lo académico en lo académico. ${ctx.pf} asintió con dignidad y te puso un "muy bien" en el siguiente trabajo, sin rencores.`; } },
      { t: 'Contárselo a la facultad', eff: (g, ctx) => { markProf(g); MV.fx.stat(g, 'karma', 1); return `Fuiste a la oficina de la facultad y lo contaste todo. ${U.gw(ctx.pg, 'El profesor', 'La profesora')} ${ctx.pf} fue sancionad${U.gw(ctx.pg, 'o', 'a')} y ahora te saluda de lejos. En el pasillo te miran con respeto, y un poco de miedo.`; } }
    ] });

  ev({ id: 'comite_etica', pushOnly: true, age: [18, 130], icon: '⚖️', scene: 'universidad', title: 'Comité de ética',
    when: (g, ctx) => { const r = ctx && ctx.target ? MV.relOf(g, ctx.target) : null; return MV.sys.edu.inHigher(g.p) && !!r && !!r.prof && RO.includes(r.type); },
    text: (g, ctx) => `El comité de ética de la facultad abrió un expediente: alguien los vio a {t} y a ti salir juntos del café de la esquina. ${U.gw((MV.person(g, ctx.target) || {}).gender, 'El profesor', 'La profesora')} quedó suspendid{to} mientras se investiga, y tu rendimiento se resintió entre rumores y miradas en los pasillos.`,
    choices: [
      { t: 'Seguir juntos', eff: { msg: 'Decidieron aguantar el temporal. Los pasillos hablan, pero {t} y tú se miran en el comedor como si el expediente fuera de otras personas.' } },
      { t: 'Terminar', eff: (g, ctx) => {
        const n = MV.person(g, ctx.target), r = MV.relOf(g, ctx.target);
        let m = '';
        if (r.type === 'conyuge') m = MV.sys.rels.divorce(g, n);
        else if (r.type === 'amante') { MV.sys.rels.makeEx(g, r); MV.fx.stat(g, 'happy', -4); m = `Le dijiste a ${n.first} que esto no podía seguir. Se acabó el misterio y también la bibliografía con emojis.`; }
        else m = MV.sys.rels.breakUp(g, n);
        delete r.prof;
        return m + ' El comité cerró el expediente por falta de nada que investigar.';
      } },
      { t: 'Pedir cambio de cátedra', eff: (g, ctx) => { const r = MV.relOf(g, ctx.target); if (r) delete r.prof; perf(g, 5); return 'Pediste cambiarte a otra cátedra y el comité lo aceptó sin hacer preguntas. Tu nuevo profesor es un señor de 70 años que no sabe quién eres. Un alivio.'; } }
    ] });
})(window.MV = window.MV || {});
