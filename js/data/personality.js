/* Mil Vidas — personalidades: etiquetas con género y tabla de reacciones por rasgo (solo datos). */
(function (MV) {
  'use strict';

  /** Grupos de acciones: id de acción -> tags. Las acciones que no están no tienen tags. */
  const GROUPS = {
    carino: ['conversar', 'tiempo', 'cumplido', 'escuchar', 'consejo', 'videollamada', 'historias', 'cuento', 'historias_nieto', 'desayuno', 'series', 'cena_casera'],
    casa: ['series', 'cena_casera', 'desayuno', 'tiempo'],
    consejo: ['consejo'],
    regalo: ['regalo', 'sorpresa'],
    plata: ['pedir_dinero', 'prestar', 'dar_dinero'],
    ofensa: ['discutir', 'insultar', 'broma', 'atacar', 'espiar_celular', 'burla', 'broma_pesada', 'merienda'],
    broma: ['broma', 'broma_pesada'],
    romance: ['cita', 'cita_teen', 'coquetear', 'poema', 'votos', 'bailar', 'sorpresa'],
    salida: ['fiesta_amigo', 'bailar', 'cine_juntos', 'comer_afuera', 'gym_juntos', 'parque', 'ensenar_deporte'],
    fiesta: ['fiesta_amigo', 'bailar'],
    deporte: ['gym_juntos', 'ensenar_deporte']
  };

  MV.ACTION_TAGS = {};
  Object.keys(GROUPS).forEach((tag) => {
    GROUPS[tag].forEach((id) => { (MV.ACTION_TAGS[id] = MV.ACTION_TAGS[id] || []).push(tag); });
  });

  /**
   * Por rasgo: f = etiqueta en femenino; up/down = { tag: factor } (el tag '*' vale para todos) que se aplican
   * a las subidas y a las bajadas; flip = tags cuyas bajadas se vuelven +2; forgive = umbral de perdón;
   * spite = peso de los recuerdos malos.
   */
  MV.TRAIT_INFO = {
    'amable': { f: 'amable', up: { carino: 1.5 }, down: { '*': 0.75 }, forgive: 60 },
    'tóxico': { f: 'tóxica', up: { regalo: 1.5, carino: 0.75 }, down: { ofensa: 2 }, spite: 1.5 },
    'generoso': { f: 'generosa', up: { plata: 1.5 }, down: {} },
    'tacaño': { f: 'tacaña', up: { regalo: 1.5 }, down: { plata: 1.5 } },
    'chismoso': { f: 'chismosa', up: { carino: 1.25 }, down: {} },
    'leal': { f: 'leal', up: { carino: 1.25 }, down: { '*': 0.75 }, forgive: 60 },
    'celoso': { f: 'celosa', up: { romance: 1.25 }, down: { ofensa: 1.5 } },
    'divertido': { f: 'divertida', up: { salida: 1.5 }, down: {}, flip: ['broma'] },
    'perezoso': { f: 'perezosa', up: { carino: 1.25, salida: 0.5 }, down: {} },
    'ambicioso': { f: 'ambiciosa', up: { consejo: 1.5 }, down: {} },
    'religioso': { f: 'religiosa', up: { carino: 1.25, fiesta: 0.5 }, down: { ofensa: 1.5 } },
    'fiestero': { f: 'fiestera', up: { salida: 1.5, casa: 0.5 }, down: {} },
    'dramático': { f: 'dramática', up: { romance: 1.5, regalo: 1.5 }, down: { '*': 2 }, spite: 1.5 },
    'tranquilo': { f: 'tranquila', up: { carino: 1.5, fiesta: 0.5 }, down: { ofensa: 1.5 } },
    'rencoroso': { f: 'rencorosa', up: {}, down: { '*': 1.25 }, forgive: 90, spite: 1.5 },
    'tímido': { f: 'tímida', up: { carino: 1.25, salida: 0.5, fiesta: 0.5 }, down: {} },
    'competitivo': { f: 'competitiva', up: { deporte: 1.5 }, down: {} },
    'sensible': { f: 'sensible', up: { carino: 1.5 }, down: { ofensa: 2 } }
  };

  /**
   * Líneas de reacción por rasgo: `up` cuando el rasgo cambió una subida, `down` cuando cambió una bajada.
   * Cada una recibe la persona y nombra a `n.first`; la concordancia de género va con U.gw.
   */
  const gw = (n, a, b) => MV.U.gw(n.gender, a, b);
  const lab = (id, n) => MV.traitLabel(id, n);
  const LINES = {
    'amable': {
      up: [(n) => `${n.first} es tan ${lab('amable', n)} que te agradeció por agradecerle.`, (n) => `${n.first} sonrió con toda la cara. Siempre lo hace, pero esta vez se nota más.`],
      down: [(n) => `${n.first} es ${lab('amable', n)}: se ofendió, pero te pidió disculpas por ofenderse.`, (n) => `${n.first} respiró hondo y dijo "no pasa nada". Algo pasó, pero no lo va a decir.`]
    },
    'tóxico': {
      up: [(n) => `${n.first} aceptó el gesto con una sonrisa de contrato. Seguro lo anotó para cobrártelo.`, (n) => `${n.first} dijo "ya era hora" y lo tomó como un derecho.`],
      down: [(n) => `${n.first} lo recordará y lo sacará a relucir en cada cena durante años.`, (n) => `${n.first} sacó una libreta mental, y tú estás en la primera página.`]
    },
    'generoso': {
      up: [(n) => `${n.first} es ${lab('generoso', n)} y quiso devolverte el favor antes de que terminaras de hablar.`, (n) => `${n.first} insistió en invitar, aunque la invitación era tuya.`],
      down: [(n) => `${n.first} no suele guardar rencor, pero esta vez hizo una excepción de media hora.`, (n) => `${n.first} te perdonó casi enseguida, para no arruinar el almuerzo.`]
    },
    'tacaño': {
      up: [(n) => `${n.first} contó el vuelto dos veces, por si acaso.`, (n) => `${n.first} calculó cuánto habría costado el gesto y lo agradeció igual.`],
      down: [(n) => `${n.first} guardó el recibo de la ofensa, por si hay que reclamar.`, (n) => `${n.first} dijo "esto me va a costar" y no hablaba de dinero. O sí.`]
    },
    'chismoso': {
      up: [(n) => `${n.first} ya tiene tres personas a las que contárselo.`, (n) => `${n.first} fingió sorpresa, pero ya lo sabía desde el martes.`],
      down: [(n) => `${n.first} no dijo nada. Lo está publicando en el grupo de chat.`, (n) => `${n.first} puso cara de "no cuento nada" y a los diez minutos lo sabía el barrio.`]
    },
    'leal': {
      up: [(n) => `${n.first} te defendería hasta de ti mismo. Y esta vez lo anotó con cariño.`, (n) => `${n.first} es ${lab('leal', n)} y tomó el gesto como un pacto de por vida.`],
      down: [(n) => `A ${n.first} le dolió más de lo que dice, pero te sigue defendiendo en voz baja.`, (n) => `${n.first} te perdonó casi sin parpadear. Casi.`]
    },
    'celoso': {
      up: [(n) => `${n.first} lo disfrutó, aunque revisó dos veces quién más estaba en la foto.`, (n) => `${n.first} sonrió y, de reojo, miró tu celular. Rutina.`],
      down: [(n) => `${n.first} puso cara de investigador privado y te hizo ocho preguntas.`, (n) => `${n.first} se pasó la noche pensando en quién tenía la culpa. Spoiler: tú.`]
    },
    'divertido': {
      up: [(n) => `${n.first} se rió tan fuerte que los vecinos preguntaron si todo estaba bien.`, (n) => `${n.first} lo convirtió en anécdota antes de que terminara el día.`],
      down: [(n) => `${n.first} lo tomó con humor y te devolvió la broma. Con intereses.`, (n) => `${n.first} se rió y quedó en que "mañana nos vemos las caras".`]
    },
    'perezoso': {
      up: [(n) => `${n.first} aprobó el plan, siempre que se hiciera desde el sillón.`, (n) => `${n.first} agradeció la idea y bostezó un poco, para no perder la costumbre.`],
      down: [(n) => `${n.first} pensó en enojarse, pero le dio pereza.`, (n) => `${n.first} se ofendió un rato y se quedó dormid${gw(n, 'o', 'a')} en pleno enojo.`]
    },
    'ambicioso': {
      up: [(n) => `${n.first} tomó nota. Tiene un plan de cinco años y tú eres el paso tres.`, (n) => `${n.first} escuchó con atención y ya piensa cómo sacarle provecho.`],
      down: [(n) => `${n.first} te anotó en su lista de obstáculos. Es una lista larga, pero estás arriba.`, (n) => `${n.first} no se detuvo: usó la ofensa como combustible.`]
    },
    'religioso': {
      up: [(n) => `${n.first} dijo "Dios te lo pague". Con eso quedó todo cobrado.`, (n) => `${n.first} agradeció el gesto y rezó un poquito por ti. Por si acaso.`],
      down: [(n) => `${n.first} se persignó y dijo que rezará por ti. Esto no suena tranquilizador.`, (n) => `${n.first} te miró con paciencia de santo y un poco de decepción.`]
    },
    'fiestero': {
      up: [(n) => `${n.first} ya está armando la lista de invitados y una playlist.`, (n) => `${n.first} dijo "esto hay que festejarlo" y festejó. Sin ti.`],
      down: [(n) => `${n.first} cambió de tema enseguida: tiene una fiesta el sábado y no quiere malos rollos.`, (n) => `${n.first} lo olvidó a la segunda ronda de tragos.`]
    },
    'dramático': {
      up: [(n) => `${n.first} se llevó la mano al pecho y dijo que jamás había sentido algo así.`, (n) => `${n.first} lloró de emoción. Después lloró de nuevo, por si no se había notado.`],
      down: [(n) => `Como es ${lab('dramático', n)}, ${n.first} lo contó en tres grupos de chat.`, (n) => `${n.first} se tiró al sofá como si le hubieran anunciado el fin del mundo.`]
    },
    'tranquilo': {
      up: [(n) => `${n.first} sonrió en silencio y puso a hervir el agua del té.`, (n) => `${n.first} asintió despacio. Eso, en ${gw(n, 'él', 'ella')}, es un abrazo.`],
      down: [(n) => `${n.first} no levantó la voz. Se quedó callad${gw(n, 'o', 'a')} y eso fue peor.`, (n) => `${n.first} lo tomó con calma y una mirada que enfría el té.`]
    },
    'rencoroso': {
      up: [(n) => `${n.first} agradeció el gesto, pero aún guarda tres cosas más en el cajón del rencor.`, (n) => `${n.first} sonrió, aunque su memoria sigue siendo muy selectiva.`],
      down: [(n) => `${n.first} no olvida: lo archivó con fecha, hora y testigos.`, (n) => `${n.first} dijo "no pasa nada" y lo anotó en el libro de cuentas pendientes.`]
    },
    'tímido': {
      up: [(n) => `${n.first} se puso rojo, dijo "gracias" a media voz y miró al piso.`, (n) => `${n.first} sonrió un segundo y se escondió detrás del cuello de la camisa.`],
      down: [(n) => `${n.first} no contestó nada, pero se le quebró un poquito la voz.`, (n) => `${n.first} se encogió de hombros y se fue en silencio, sin hacer ruido.`]
    },
    'competitivo': {
      up: [(n) => `${n.first} lo convirtió en una carrera y, por supuesto, ganó.`, (n) => `${n.first} dijo "la próxima vez te gano" con una sonrisa que da miedo.`],
      down: [(n) => `${n.first} lo tomó como un desafío y ya está entrenando la respuesta.`, (n) => `${n.first} apretó los puños. Después llevó la cuenta de los puntos.`]
    },
    'sensible': {
      up: [(n) => `${n.first} se emocionó y tuvo que sentarse un rato.`, (n) => `${n.first} es ${lab('sensible', n)} y le llegó hasta el último detalle.`],
      down: [(n) => `A ${n.first} se le llenaron los ojos de lágrimas y se fue a "tomar aire".`, (n) => `${n.first} lo sintió en el alma y te lo hizo saber con un suspiro largo.`]
    }
  };
  Object.keys(LINES).forEach((id) => { if (MV.TRAIT_INFO[id]) MV.TRAIT_INFO[id].lines = LINES[id]; });

  /** La etiqueta de un rasgo con el género de la persona; con un id desconocido devuelve el id. */
  MV.traitLabel = function (id, n) {
    const t = MV.TRAIT_INFO[id];
    return t && n && n.gender === 'f' ? t.f : id;
  };
})(window.MV);
