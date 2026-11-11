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

  /** Agencias: alias de gamers, ligas de eSports y profesiones que se representan (sueldos por nivel 1 a 5). */
  MV.GAMER_ALIASES = ['xXNinjaXx', 'Tostadora', 'ElPibe', 'Sniperella', 'Morfeo', 'CapitánLag', 'Zurdo', 'Pixelia', 'Lechuza', 'NoScope', 'Abuela420',
    'Cacerola', 'Kaiser', 'Mapache', 'Turbo', 'Fideo', 'Brujita', 'Chispa', 'ElTío', 'Glitch', 'Medialuna', 'Rayo', 'Sopapilla', 'Venom', 'Yerba', 'Zeta'];
  MV.ESPORTS_LEAGUES = {
    regional: { name: 'Liga regional', prize: [5000, 20000], strength: 0 },
    internacional: { name: 'Liga internacional', prize: [50000, 300000], strength: 10 },
    mundial: { name: 'Mundial', prize: [500000, 2000000], strength: 20 }
  };
  MV.AGENCY_PROFS = {
    deportista: { name: 'Deportista|Deportista', icon: '⚽', pay: [40000, 150000, 600000, 2500000, 12000000] },
    actor: { name: 'Actor|Actriz', icon: '🎬', pay: [30000, 100000, 400000, 1500000, 8000000] },
    musico: { name: 'Músico|Música', icon: '🎤', pay: [20000, 80000, 300000, 1200000, 6000000] }
  };

  /** Marketing anual: costo e impulso a ventas y crecimiento. */
  MV.MARKETING = {
    ninguno: { name: 'Ninguno', cost: 0, boost: 0 },
    bajo: { name: 'Bajo', cost: 10000, boost: 0.1 },
    medio: { name: 'Medio', cost: 50000, boost: 0.25 },
    alto: { name: 'Alto', cost: 200000, boost: 0.5 }
  };
})(window.MV = window.MV || {});
