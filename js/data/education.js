/* Mil Vidas — educación: etapas, carreras universitarias, técnicas, posgrados y clubes. */
(function (MV) {
  'use strict';

  MV.EDU = {
    order: ['ninguna', 'primaria', 'secundaria', 'tecnica', 'universidad', 'posgrado'],
    names: {
      ninguna: 'Sin estudios', primaria: 'Primaria completa', secundaria: 'Secundaria completa',
      tecnica: 'Título técnico', universidad: 'Título universitario', posgrado: 'Posgrado'
    },
    stages: {
      primaria: { name: 'Escuela primaria', years: 6, icon: '🏫', scene: 'escuela' },
      secundaria: { name: 'Escuela secundaria', years: 6, icon: '🏫', scene: 'escuela' },
      tecnica: { name: 'Instituto técnico', years: 2, icon: '🔧', scene: 'universidad' },
      universidad: { name: 'Universidad', years: 4, icon: '🎓', scene: 'universidad' },
      posgrado: { name: 'Posgrado', years: 2, icon: '📜', scene: 'universidad' }
    },
    majors: {
      medicina: { name: 'Medicina', years: 6, smarts: 70, cost: 16000, icon: '🩺' },
      derecho: { name: 'Derecho', years: 5, smarts: 55, cost: 11000, icon: '⚖️' },
      ingenieria: { name: 'Ingeniería', years: 5, smarts: 60, cost: 12000, icon: '🛠️' },
      informatica: { name: 'Informática', years: 4, smarts: 55, cost: 11000, icon: '💻', skill: 'programacion' },
      psicologia: { name: 'Psicología', years: 5, smarts: 45, cost: 8000, icon: '🛋️' },
      administracion: { name: 'Administración de Empresas', years: 4, smarts: 40, cost: 9000, icon: '📊' },
      economia: { name: 'Economía', years: 4, smarts: 55, cost: 9000, icon: '📈' },
      arquitectura: { name: 'Arquitectura', years: 5, smarts: 55, cost: 12000, icon: '📐', skill: 'arte' },
      educacion: { name: 'Profesorado', years: 4, smarts: 35, cost: 4000, icon: '🍎' },
      periodismo: { name: 'Periodismo', years: 4, smarts: 40, cost: 7000, icon: '📰', skill: 'carisma' },
      biologia: { name: 'Biología', years: 5, smarts: 55, cost: 8000, icon: '🧬' },
      enfermeria: { name: 'Enfermería', years: 4, smarts: 40, cost: 6000, icon: '💉' },
      veterinaria: { name: 'Veterinaria', years: 5, smarts: 55, cost: 10000, icon: '🐾' },
      bellasartes: { name: 'Bellas Artes', years: 4, smarts: 25, cost: 7000, icon: '🎨', skill: 'arte' },
      musica: { name: 'Conservatorio de Música', years: 4, smarts: 25, cost: 8000, icon: '🎼', skill: 'musica' },
      filosofia: { name: 'Filosofía', years: 4, smarts: 50, cost: 5000, icon: '🤔' },
      idiomas: { name: 'Traductorado', years: 4, smarts: 45, cost: 6000, icon: '🌍', skill: 'idiomas' }
    },
    tech: {
      gastronomia: { name: 'Gastronomía', icon: '🍳', skill: 'cocina', cost: 5000 },
      mecanica: { name: 'Mecánica automotriz', icon: '🔧', cost: 3000 },
      electricidad: { name: 'Electricidad', icon: '⚡', cost: 3000 },
      estetica: { name: 'Estética y peluquería', icon: '💇', skill: 'arte', cost: 3500 },
      programacion: { name: 'Desarrollo web (bootcamp)', icon: '⌨️', skill: 'programacion', cost: 6000 },
      aviacion: { name: 'Escuela de aviación', icon: '✈️', cost: 30000 }
    },
    post: {
      master: { name: 'Máster', years: 2, cost: 18000, icon: '📜' },
      mba: { name: 'MBA', years: 2, cost: 40000, icon: '💼' },
      doctorado: { name: 'Doctorado', years: 4, cost: 0, icon: '🎓', smarts: 70 },
      especialidad: { name: 'Especialidad médica', years: 3, cost: 0, icon: '🩻', major: 'medicina' }
    },
    clubs: [
      { id: 'futbol', name: 'Equipo de fútbol', icon: '⚽', skill: 'deporte', stat: 'health' },
      { id: 'banda', name: 'Banda de música', icon: '🥁', skill: 'musica', stat: 'happy' },
      { id: 'teatro', name: 'Taller de teatro', icon: '🎭', skill: 'carisma', stat: 'looks' },
      { id: 'ajedrez', name: 'Club de ajedrez', icon: '♟️', skill: 'idiomas', stat: 'smarts' },
      { id: 'robotica', name: 'Club de robótica', icon: '🤖', skill: 'programacion', stat: 'smarts' },
      { id: 'arte', name: 'Taller de arte', icon: '🖌️', skill: 'arte', stat: 'happy' },
      { id: 'debate', name: 'Club de debate', icon: '🎤', skill: 'carisma', stat: 'smarts' },
      { id: 'cocina', name: 'Club de cocina', icon: '🧁', skill: 'cocina', stat: 'happy' },
      { id: 'atletismo', name: 'Atletismo', icon: '🏃', skill: 'deporte', stat: 'health' }
    ]
  };

  /** Nivel educativo más alto alcanzado (índice en MV.EDU.order). */
  MV.eduLevel = function (p) {
    let best = 0;
    p.edu.done.forEach((s) => { best = Math.max(best, MV.EDU.order.indexOf(s)); });
    return best;
  };
  MV.hasDegree = function (p, kind, major) {
    return p.edu.degrees.some((d) => d.kind === kind && (!major || d.major === major ||
      (Array.isArray(major) && major.includes(d.major))));
  };
  MV.grade = (perf) => (Math.round((1 + perf * 0.09) * 10) / 10).toFixed(1).replace('.', ',');
})(window.MV = window.MV || {});
