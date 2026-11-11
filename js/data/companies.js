/* Mil Vidas — empresas propias: tipos, puestos y marketing (todo inventado). */
(function (MV) {
  'use strict';

  /** Tipos de empresa: costo inicial (va a la caja), múltiplo de valuación, costo fijo anual y puestos. */
  MV.COMPANY_TYPES = {
    estudio: { name: 'Estudio de videojuegos', art: 'un', icon: '🎮', cost: 50000, mult: 4, fixed: 20000, roles: ['programador', 'artista', 'disenador', 'marketing'], desc: 'Haz juegos chicos, medianos o AAA' },
    apps: { name: 'Empresa de apps', art: 'una', icon: '📱', cost: 30000, mult: 5, fixed: 10000, roles: ['programador', 'disenador', 'marketing'], desc: 'Apps con suscriptores que pagan cada año' },
    social: { name: 'Red social', art: 'una', icon: '🌐', cost: 80000, mult: 8, fixed: 30000, roles: ['programador', 'moderador', 'marketing', 'abogado'], desc: 'Usuarios, publicidad y escándalos' },
    esports: { name: 'Agencia de eSports', art: 'una', icon: '🕹️', cost: 100000, mult: 3, fixed: 25000, roles: ['entrenador', 'analista', 'community'], desc: 'Un equipo que compite por premios y patrocinios' },
    representacion: { name: 'Agencia de representación', art: 'una', icon: '🤝', cost: 40000, mult: 3, fixed: 8000, roles: ['scout', 'abogado', 'rrpp'], desc: 'Deportistas, actores y músicos que te pagan comisión' }
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

  /** Bolsa de valores: 12 empresas inventadas { id (sigla), name, sector, price, vol (volatilidad), div (dividendo anual) }. */
  MV.STOCKS = [
    { id: 'VOLT', name: 'Volta Motors', sector: 'autos', icon: '🚗', price: 120, vol: 0.25, div: 0 },
    { id: 'OKAM', name: 'Okami Electrónica', sector: 'tech', icon: '💻', price: 85, vol: 0.3, div: 0.01 },
    { id: 'BSUR', name: 'Banco del Sur', sector: 'banca', icon: '🏦', price: 40, vol: 0.2, div: 0.04 },
    { id: 'PETR', name: 'Petrolera Austral', sector: 'energia', icon: '🛢️', price: 55, vol: 0.25, div: 0.05 },
    { id: 'VITA', name: 'Farmacéutica Vitalis', sector: 'salud', icon: '💊', price: 70, vol: 0.2, div: 0.02 },
    { id: 'SMAX', name: 'Supermercados Supermax', sector: 'consumo', icon: '🛒', price: 30, vol: 0.15, div: 0.03 },
    { id: 'COND', name: 'Aerolínea Cóndor', sector: 'viajes', icon: '✈️', price: 22, vol: 0.35, div: 0 },
    { id: 'MINA', name: 'Minera Andina', sector: 'mineria', icon: '⛏️', price: 48, vol: 0.3, div: 0.03 },
    { id: 'BNNA', name: 'Bananín Coin', sector: 'cripto', icon: '🍌', price: 3, vol: 0.8, div: 0 },
    { id: 'TORR', name: 'Inmobiliaria Torres', sector: 'inmobiliario', icon: '🏢', price: 35, vol: 0.2, div: 0.04 },
    { id: 'NUBE', name: 'Streaming Nube', sector: 'entretenimiento', icon: '📺', price: 60, vol: 0.35, div: 0 },
    { id: 'POLL', name: 'Pollo Feliz', sector: 'comida', icon: '🍗', price: 18, vol: 0.15, div: 0.02 }
  ];
  /** Nombres de los sectores para los textos. */
  MV.SECTOR_NAMES = { autos: 'autos', tech: 'tecnología', banca: 'bancos', energia: 'energía', salud: 'salud', consumo: 'consumo masivo', viajes: 'viajes',
    mineria: 'minería', cripto: 'criptomonedas', inmobiliario: 'inmobiliarias', entretenimiento: 'entretenimiento', comida: 'comida rápida' };
  /** Efecto de cada noticia del mundo en la bolsa: corrimientos que se suman (all = a todas). */
  MV.MARKET_NEWS = {
    recesion: { all: -0.15, banca: -0.1, viajes: -0.1 },
    auge: { all: 0.12 },
    burbuja_cripto: { cripto: 0.9, tech: 0.05 },
    desplome_cripto: { cripto: -0.6 },
    auge_inmobiliario: { inmobiliario: 0.25, banca: 0.05 },
    crisis_inmobiliaria: { inmobiliario: -0.3, banca: -0.15 },
    pandemia: { all: -0.05, salud: 0.3, viajes: -0.4, entretenimiento: 0.15, comida: 0.05 },
    inflacion: { all: -0.05, energia: 0.15, consumo: -0.05 },
    auge_tech: { tech: 0.35, entretenimiento: 0.1, autos: 0.05 },
    guerra: { all: -0.08, energia: 0.3, mineria: 0.2, viajes: -0.2 },
    ola_calor: { energia: 0.1, comida: -0.03 },
    elecciones: { banca: -0.05 },
    furor_deporte: { entretenimiento: 0.1, comida: 0.03 },
    escandalo: { banca: -0.1 },
    vacuna: { all: 0.03, salud: 0.2, viajes: 0.2 }
  };

  /** Marketing anual: costo e impulso a ventas y crecimiento. */
  MV.MARKETING = {
    ninguno: { name: 'Ninguno', cost: 0, boost: 0 },
    bajo: { name: 'Bajo', cost: 10000, boost: 0.1 },
    medio: { name: 'Medio', cost: 50000, boost: 0.25 },
    alto: { name: 'Alto', cost: 200000, boost: 0.5 }
  };
})(window.MV = window.MV || {});
