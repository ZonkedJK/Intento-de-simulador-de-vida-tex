/* Mil Vidas — empresas propias: tipos, puestos y marketing (todo inventado). */
(function (MV) {
  'use strict';

  /** Tipos de empresa: costo inicial (va a la caja), múltiplo de valuación, costo fijo anual y puestos. */
  MV.COMPANY_TYPES = {
    estudio: { name: 'Estudio de videojuegos', icon: '🎮', cost: 50000, mult: 4, fixed: 20000, roles: ['programador', 'artista', 'disenador', 'marketing'], desc: 'Haz juegos chicos, medianos o AAA' },
    apps: { name: 'Empresa de apps', icon: '📱', cost: 30000, mult: 5, fixed: 10000, roles: ['programador', 'disenador', 'marketing'], desc: 'Apps con suscriptores que pagan cada año' },
    social: { name: 'Red social', icon: '🌐', cost: 80000, mult: 8, fixed: 30000, roles: ['programador', 'moderador', 'marketing', 'abogado'], desc: 'Usuarios, publicidad y escándalos' },
    esports: { name: 'Agencia de eSports', icon: '🕹️', cost: 100000, mult: 3, fixed: 25000, roles: ['entrenador', 'analista', 'community'], desc: 'Un equipo que compite por premios y patrocinios' },
    representacion: { name: 'Agencia de representación', icon: '🤝', cost: 40000, mult: 3, fixed: 8000, roles: ['scout', 'abogado', 'rrpp'], desc: 'Deportistas, actores y músicos que te pagan comisión' }
  };

  /** Puestos: 'masculino|femenino' en el nombre. El gerente general existe en todos los tipos. */
  MV.COMPANY_ROLES = {
    programador: { name: 'Programador|Programadora', icon: '💻' },
    artista: { name: 'Artista|Artista', icon: '🎨' },
    disenador: { name: 'Diseñador|Diseñadora', icon: '✏️' },
    marketing: { name: 'Experto en marketing|Experta en marketing', icon: '📣' },
    moderador: { name: 'Moderador|Moderadora', icon: '🛡️' },
    abogado: { name: 'Abogado|Abogada', icon: '⚖️' },
    entrenador: { name: 'Entrenador|Entrenadora', icon: '🧢' },
    analista: { name: 'Analista|Analista', icon: '📊' },
    community: { name: 'Community manager|Community manager', icon: '💬' },
    scout: { name: 'Cazatalentos|Cazatalentos', icon: '🔭' },
    rrpp: { name: 'Relacionista público|Relacionista pública', icon: '🥂' },
    gerente: { name: 'Gerente general|Gerenta general', icon: '👔' }
  };

  /** Marketing anual: costo e impulso a ventas y crecimiento. */
  MV.MARKETING = {
    ninguno: { name: 'Ninguno', cost: 0, boost: 0 },
    bajo: { name: 'Bajo', cost: 10000, boost: 0.1 },
    medio: { name: 'Medio', cost: 50000, boost: 0.25 },
    alto: { name: 'Alto', cost: 200000, boost: 0.5 }
  };
})(window.MV = window.MV || {});
