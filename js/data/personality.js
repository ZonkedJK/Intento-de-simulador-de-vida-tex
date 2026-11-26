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

  /** La etiqueta de un rasgo con el género de la persona; con un id desconocido devuelve el id. */
  MV.traitLabel = function (id, n) {
    const t = MV.TRAIT_INFO[id];
    return t && n && n.gender === 'f' ? t.f : id;
  };
})(window.MV);
