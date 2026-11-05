/* Mil Vidas — eventos de la vejez (65+ años). */
(function (MV) {
  'use strict';
  const U = MV.U, ev = MV.ev, fx = MV.fx, H = MV.EVH;

  ev({ id: 'nietos_celular', age: [62, 110], when: H.has('hijo', (n) => n.age >= 25), icon: '📱', text: 'Tus nietos vinieron de visita y te enseñaron a usar el celular. Otra vez. Mandaste un audio de 8 minutos sin querer.', auto: { happy: 4, then: (g) => { g.p.counters.nietos = Math.max(g.p.counters.nietos || 0, 1); } } });
  ev({ id: 'lentes_puestos', age: [60, 110], icon: '👓', text: 'Buscaste los lentes durante una hora. Los tenías puestos.', auto: { happy: -1, smarts: -1 } });
  ev({ id: 'geriatrico', age: [75, 110], once: true, when: H.has('hijo', (n) => n.age >= 30), target: H.rel('hijo', (n) => n.age >= 30), icon: '🏥', scene: 'hospital', title: 'La conversación difícil',
    text: '{t} sugiere "con todo cariño" que te mudes a una residencia para mayores.',
    choices: [
      { t: 'Aceptar', eff: { health: 6, happy: -4, rel: 4, then: (g) => { g.p.flags.residencia = true; return 'Te mudaste a la residencia. Hay bingo los martes y un romance prohibido en el tercer piso.'; } } },
      { t: 'Negarte rotundamente', eff: { rel: -8, happy: 2, msg: 'Te negaste. "De acá me sacan con los pies para adelante", dijiste. Dramático y efectivo.' } },
      { t: 'Mudarte a la casa de {t}', eff: { rel: -4, happy: 5, msg: 'Te mudaste con {t}. Reorganizaste su cocina el primer día.' } }
    ] });
  ev({ id: 'bingo', age: [60, 110], icon: '🎱', scene: 'fiesta', title: 'Bingo del club',
    text: 'Gran torneo de bingo en el club de jubilados. El premio: una licuadora y $500.',
    choices: [
      { t: 'Jugar limpio', eff: { p: 0.15, ok: { money: 500, happy: 10, msg: '¡BINGO! Gritaste tan fuerte que a un señor se le cayó la dentadura.' }, ko: { happy: 2, msg: 'No ganaste, pero comiste 12 sándwiches de miga.' } } },
      { t: 'Hacer trampa con cartones marcados', eff: { karma: -3, p: 0.4, ok: { money: 500, happy: 6, msg: 'Ganaste con trampa. La señora Amalia te mira con sospecha eterna.' }, ko: { happy: -5, msg: 'Te descubrieron. Te prohibieron el bingo de por vida. Escándalo en el club.' } } }
    ] });
  ev({ id: 'romance_tardio', age: [62, 100], when: (g) => !MV.partner(g), icon: '💘', title: 'Romance otoñal',
    text: 'Alguien del club de jubilados te guiña el ojo durante la clase de tango.',
    choices: [
      { t: 'Guiñar de vuelta', eff: (g) => { const n = MV.sys.rels.candidate(g); return MV.sys.rels.startDating(g, n) + ' El amor no tiene edad (pero sí horario: se acuestan a las 21).'; } },
      { t: 'Hacerte el distraído', eff: { msg: 'Fingiste que te entró algo en el ojo. Te guiñaste solo. Confusión general.' } }
    ] });
  ev({ id: 'pelea_herencia', age: [68, 110], when: (g) => MV.rels(g, 'hijo').length >= 2 && g.p.money > 10000, icon: '📜', title: 'Buitres familiares',
    text: 'Tus hijos ya discuten tu herencia en la mesa del domingo. Y tú sigues ahí, comiendo.',
    choices: [
      { t: 'Elegir heredero al más cariñoso', eff: (g) => { const best = MV.rels(g, 'hijo').sort((a, b) => b.r.rel - a.r.rel)[0]; g.p.heirId = best.n.id; best.r.rel = U.clamp(best.r.rel + 10, 0, 100); MV.rels(g, 'hijo').forEach((x) => { if (x !== best) x.r.rel = U.clamp(x.r.rel - 10, 0, 100); }); return `Nombraste heredero a ${best.n.first}. Los demás ya no te traen facturas los domingos.`; } },
      { t: 'Dejarle todo a la mascota', when: H.has('mascota'), eff: (g) => { MV.rels(g, 'hijo').forEach((x) => { x.r.rel = U.clamp(x.r.rel - 15, 0, 100); }); g.p.heirId = null; fx.stat(g, 'happy', 6); return 'Anunciaste que le dejas todo a tu mascota. Tus hijos ahora la tratan como a la realeza.'; } },
      { t: 'Gastarlo todo en vida', eff: (g) => { const amt = Math.round(g.p.money * 0.3); fx.money(g, -amt); fx.stat(g, 'happy', 15); g.p.counters.viajes = (g.p.counters.viajes || 0) + 1; return `Te gastaste ${U.money(amt)} en un crucero de lujo. "La herencia es la experiencia", les dijiste.`; } }
    ] });
  ev({ id: 'tablet', age: [65, 110], once: true, icon: '📲', title: 'Regalo tecnológico',
    text: 'Te regalan una tablet. Tiene "aplicaciones". Y botones invisibles.',
    choices: [
      { t: 'Aprender a usarla', eff: { smarts: 3, happy: 3, msg: 'Aprendiste a usarla. Ahora mandas cadenas de oraciones a 200 contactos por día.' } },
      { t: 'Usarla de posavasos', eff: { happy: 1, msg: 'Es el posavasos más caro del barrio. Y funciona perfecto.' } }
    ] });
  ev({ id: 'plaza_desconocido', age: [65, 110], icon: '🪑', text: 'Saliste a caminar y le contaste tu vida entera a un desconocido en la plaza. Él también te contó la suya. Ahora son íntimos.', auto: { happy: 3, stress: -4 } });
  ev({ id: 'reunion_exalumnos', age: [65, 95], once: true, icon: '🏫', scene: 'escuela', title: 'Reunión de exalumnos',
    text: 'Organizan una reunión de tu promoción, 50 años después.',
    choices: [
      { t: 'Ir', eff: { p: 0.7, ok: { happy: 8, msg: 'Fuiste. Quedaban 11. El abusón de la escuela ahora es pastor y te pidió perdón.' }, ko: { happy: -3, msg: 'Fuiste. Solo había 3 personas y nadie te reconoció. Te sacaron fotos igual.' } } },
      { t: 'No ir', eff: { msg: 'No fuiste. "Para ver viejos me miro al espejo", dijiste.' } }
    ] });
  ev({ id: 'termas', age: [62, 100], when: (g) => g.p.money >= 1500, icon: '♨️', scene: 'naturaleza', title: 'Viaje de jubilados',
    text: 'El club organiza un viaje a las termas. $1.500 con todo incluido.',
    choices: [
      { t: 'Ir', eff: { money: -1500, health: 5, happy: 8, stress: -12, count: 'viajes', msg: 'Pasaste una semana en las termas. Ganaste el concurso de baile. Tu cadera no opina igual.' } },
      { t: 'Quedarte en casa', eff: { msg: 'Te quedaste. Te mandaron 300 fotos por el grupo.' } }
    ] });
  ev({ id: 'cien_anos', age: [100, 100], once: true, icon: '💯', scene: 'fiesta', text: '¡Cumpliste 100 años! El intendente te dio una placa, una torta y una foto que salió en el diario.', auto: { happy: 15, fame: 5 }, modal: true, title: '¡Un siglo!' });
  ev({ id: 'palomas', age: [65, 110], icon: '🕊️', text: 'Alimentas a las palomas de la plaza todos los días. Una se llama Roberto y te reconoce.', auto: { happy: 3, karma: 1 } });
  ev({ id: 'colchon_dinero', age: [60, 110], once: true, w: 0.5, icon: '🛏️', text: 'Encontraste dinero que escondiste en el colchón hace décadas y olvidaste: {amount}.', auto: { money: [500, 15000], happy: 6 } });
  ev({ id: 'medico_dieta', age: [60, 110], icon: '🩺', scene: 'hospital', title: 'Órdenes médicas',
    text: 'El médico te dice que dejes la sal, el azúcar, la grasa y, básicamente, la alegría.',
    choices: [
      { t: 'Obedecer', eff: { health: 6, happy: -5, msg: 'Comes todo hervido. Tu salud mejora. Tu humor no.' } },
      { t: 'Ignorarlo', eff: { health: -4, happy: 5, msg: 'Comiste un asado entero para celebrar. "De algo hay que morir", dijiste.' } },
      { t: 'Negociar: solo los domingos', eff: { health: 2, happy: 1, msg: 'Dieta de lunes a sábado, banquete los domingos. El médico se rindió.' } }
    ] });
  ev({ id: 'baston', age: [70, 110], once: true, icon: '🦯', text: 'Te compraste un bastón. Lo usas más para señalar cosas y espantar palomas que para caminar.', auto: { happy: 1 } });
  ev({ id: 'memorias', age: [70, 110], once: true, icon: '📖', title: 'Tus memorias',
    text: 'Tus nietos te piden que escribas tus memorias.',
    choices: [
      { t: 'Escribir la verdad', eff: { smarts: 1, karma: 2, happy: 4, msg: 'Escribiste la verdad. Tu familia descubrió cosas que preferiría no saber.' } },
      { t: 'Exagerar un poquito', eff: { happy: 6, skills: { arte: 3 }, msg: 'En tu versión, peleaste con un oso y fuiste espía. Es un best seller familiar.' } },
      { t: 'Negarte: "lo que pasó, pasó"', eff: { msg: 'Te llevarás tus secretos a la tumba. Misterio garantizado.' } }
    ] });
  ev({ id: 'taxi_lento', age: [70, 110], icon: '🐢', text: 'Cruzaste la calle tan despacio que el semáforo cambió tres veces. Los autos te aplaudieron.', auto: { happy: 1, fame: 0 } });
})(window.MV = window.MV || {});
