/* Mil Vidas — datos del curso: caracteres de tutor, papeles de compañeros y constantes de la escuela. */
(function (MV) {
  'use strict';

  /** Carácter del tutor: efecto chico en números. Nombres en formato "m|f". */
  MV.TEACHER_KINDS = {
    exigente: { icon: '📏', name: 'Exigente', perf: -3, study: 2 },
    buena: { icon: '🌟', name: 'Buena onda', perf: 3 },
    distraido: { icon: '🙃', name: 'Distraído|Distraída', cheat: 0.15 },
    estricto: { icon: '🧐', name: 'Estricto|Estricta', cheat: -0.15, catch: 0.15, stress: 2 },
    cansado: { icon: '😴', name: 'Cansado|Cansada' }
  };

  /** Papeles de los compañeros de curso. `rel` es el rango de relación inicial. */
  MV.CLASS_ROLES = {
    amigo: { icon: '🤝', name: 'mejor amigo|mejor amiga', rel: [65, 80] },
    rival: { icon: '⚔️', name: 'rival', rel: [35, 50] },
    abuson: { icon: '😈', name: 'abusón|abusona', rel: [20, 35], chance: 0.6 },
    payaso: { icon: '🤡', name: 'payaso del curso|payasa del curso', rel: [50, 65] },
    crush: { icon: '💘', name: 'te gusta', rel: [45, 60], minAge: 14 }
  };

  MV.SCHOOL = { CATCH: 0.25, EXPEL: 3, HIGH: 70, LOW: 30 };
})(window.MV = window.MV || {});
