/* Mil Vidas — deportes profesionales: escaleras, sueldos, retiro, clubes y trofeos (todo ficticio). */
(function (MV) {
  'use strict';

  /**
   * team: deporte de equipo (sube más el Carisma) · prize: cobra premios variables en vez de sueldo fijo
   * key: pesos de estadísticas/habilidades para el nivel · start: [edad mínima, edad máxima para empezar]
   * retire: [edad en que empieza el declive, retiro obligatorio] · injury: riesgo de lesión por temporada
   */
  MV.SPORTS = {
    futbol: {
      name: 'Fútbol', icon: '⚽', team: true, club: 'Equipo de fútbol', start: [16, 24], retire: [32, 39], health: 60, injury: 0.12,
      key: { deporte: 0.55, health: 0.25, carisma: 0.05 },
      titles: ['Juvenil de un club local', 'Jugador de primera división|Jugadora de primera división', 'Titular en un club grande', 'Estrella internacional', 'Leyenda del fútbol'],
      pay: [18000, 140000, 1900000, 9500000, 26000000],
      clubs: ['Atlético Ribera', 'Deportivo Las Lomas', 'Real Unión del Sur', 'Sporting Capital', 'Racing del Puerto', 'Olímpico Norte', 'FC Galaxia', 'Inter Metropolitano', 'Unión Celeste', 'Juventud Imperial'],
      trophies: ['la liga nacional', 'la copa continental', 'el Mundial de Clubes'], scout: 'un ojeador'
    },
    basquet: {
      name: 'Básquet', icon: '🏀', team: true, club: 'Equipo de básquet', start: [17, 24], retire: [32, 39], health: 65, injury: 0.11, draft: true,
      key: { deporte: 0.55, health: 0.25, looks: 0.05 },
      titles: ['Jugador de liga de desarrollo|Jugadora de liga de desarrollo', 'Suplente en la Liga Norteamericana', 'Titular en la Liga Norteamericana', 'All-Star de la Liga Norteamericana', 'Leyenda del básquet'],
      pay: [30000, 950000, 6500000, 19000000, 38000000],
      clubs: ['Halcones de Bahía', 'Toros de Ciudad Central', 'Relámpagos de Costa Azul', 'Lobos del Norte', 'Titanes del Valle', 'Cometas del Lago', 'Piratas de Puerto Sol', 'Dragones de Montaña'],
      trophies: ['el anillo de campeón', 'la final de conferencia', 'el oro olímpico'], scout: 'un reclutador de la Liga Norteamericana'
    },
    tenis: {
      name: 'Tenis', icon: '🎾', team: false, prize: true, club: 'Escuela de tenis', start: [15, 22], retire: [31, 38], health: 60, injury: 0.1,
      key: { deporte: 0.55, health: 0.2, smarts: 0.1 },
      titles: ['Jugador del circuito juvenil|Jugadora del circuito juvenil', 'Profesional del circuito (puesto 300)', 'Top 50 del ranking', 'Top 10 mundial', 'Número 1 del mundo'],
      pay: [8000, 160000, 1600000, 8500000, 21000000],
      clubs: ['la Academia Arcilla Roja', 'el Club de Tenis Las Palmas', 'la Escuela Saque Directo'],
      trophies: ['un torneo de Grand Slam', 'el Masters de fin de año', 'el oro olímpico'], scout: 'un entrenador de una academia de élite'
    },
    voley: {
      name: 'Vóley', icon: '🏐', team: true, club: 'Equipo de vóley', start: [16, 25], retire: [32, 38], health: 55, injury: 0.09,
      key: { deporte: 0.55, health: 0.25, carisma: 0.05 },
      titles: ['Juvenil de un club', 'Jugador de liga profesional|Jugadora de liga profesional', 'Titular en un club de Europa', 'Estrella de la selección'],
      pay: [10000, 65000, 320000, 950000],
      clubs: ['Club Remate Norte', 'Voleibol Costa Brava', 'Unión Bloqueo', 'Atlético Red Alta'],
      trophies: ['la liga', 'la Champions de vóley', 'el campeonato mundial'], scout: 'una entrenadora de la selección juvenil'
    },
    beisbol: {
      name: 'Béisbol', icon: '⚾', team: true, club: 'Equipo de béisbol', start: [17, 25], retire: [35, 41], health: 55, injury: 0.08,
      key: { deporte: 0.55, health: 0.2, smarts: 0.1 },
      titles: ['Jugador de ligas menores|Jugadora de ligas menores', 'Novato en las Grandes Ligas', 'Titular en las Grandes Ligas', 'Estrella del béisbol', 'Salón de la Fama'],
      pay: [14000, 750000, 5200000, 21000000, 31000000],
      clubs: ['Tiburones del Golfo', 'Leones de la Capital', 'Navegantes del Caribe', 'Águilas de Monterrey Sur', 'Cardenales del Valle'],
      trophies: ['la Serie Mundial', 'la Serie del Caribe', 'el campeonato de conferencia'], scout: 'un cazatalentos de las Grandes Ligas'
    },
    boxeo: {
      name: 'Boxeo', icon: '🥊', team: false, prize: true, club: 'Gimnasio de boxeo', start: [17, 27], retire: [33, 41], health: 65, injury: 0.2,
      key: { deporte: 0.5, health: 0.35 },
      titles: ['Boxeador amateur|Boxeadora amateur', 'Boxeador profesional|Boxeadora profesional', 'Contendiente al título', 'Campeón mundial|Campeona mundial', 'Leyenda del boxeo'],
      pay: [5000, 85000, 950000, 13000000, 42000000],
      clubs: ['el Gimnasio Puño de Hierro', 'el Club Esquina Roja', 'el Gimnasio del Barrio Sur'],
      trophies: ['el cinturón mundial', 'la pelea del año', 'el oro olímpico'], scout: 'un promotor de boxeo'
    },
    golf: {
      name: 'Golf', icon: '⛳', team: false, prize: true, club: 'Club de golf', start: [16, 30], retire: [44, 55], health: 35, injury: 0.04,
      key: { deporte: 0.45, smarts: 0.2, health: 0.1 },
      titles: ['Golfista amateur', 'Profesional del circuito', 'Ganador de torneos|Ganadora de torneos', 'Top 10 mundial', 'Leyenda del golf'],
      pay: [5000, 210000, 1600000, 7200000, 15500000],
      clubs: ['el Country Club Los Robles', 'el Golf Club Bahía Verde', 'el Club de Campo del Lago'],
      trophies: ['un torneo major', 'la chaqueta del campeón', 'la copa de naciones'], scout: 'un patrocinador del circuito'
    },
    atletismo: {
      name: 'Atletismo', icon: '🏃', team: false, olympic: true, club: 'Club de atletismo', start: [15, 23], retire: [30, 37], health: 70, injury: 0.12,
      key: { deporte: 0.55, health: 0.3 },
      titles: ['Atleta juvenil', 'Atleta profesional', 'Medallista internacional', 'Campeón olímpico|Campeona olímpica'],
      pay: [6000, 55000, 420000, 2600000],
      clubs: ['el Club Atlético Pista Azul', 'la Federación Regional', 'el Club Velocidad'],
      trophies: ['el campeonato mundial', 'la Liga de Diamante', 'el oro olímpico'], scout: 'un entrenador de la federación'
    },
    natacion: {
      name: 'Natación', icon: '🏊', team: false, olympic: true, club: 'Club de natación', start: [14, 21], retire: [27, 34], health: 65, injury: 0.07,
      key: { deporte: 0.55, health: 0.3 },
      titles: ['Nadador juvenil|Nadadora juvenil', 'Nadador profesional|Nadadora profesional', 'Medallista internacional', 'Campeón olímpico|Campeona olímpica'],
      pay: [6000, 48000, 360000, 2300000],
      clubs: ['el Club Náutico Delfines', 'la Piscina Olímpica Municipal', 'el Club Aguas Claras'],
      trophies: ['el campeonato mundial', 'el récord mundial', 'el oro olímpico'], scout: 'una entrenadora olímpica'
    },
    automovilismo: {
      name: 'Automovilismo', icon: '🏎️', team: false, club: 'Escuela de karting', start: [14, 20], retire: [36, 44], health: 50, injury: 0.08, clubCost: 4000,
      key: { deporte: 0.4, smarts: 0.25, health: 0.15 },
      titles: ['Piloto de karting', 'Piloto de fórmula juvenil', 'Piloto de la Fórmula Mundial', 'Campeón de la Fórmula Mundial|Campeona de la Fórmula Mundial'],
      pay: [0, 70000, 4200000, 31000000],
      clubs: ['la escudería Velox', 'la escudería Torino', 'el equipo Kondor Racing', 'la escudería Fénix'],
      trophies: ['el campeonato de pilotos', 'el Gran Premio de Mónaco Sur', 'las 24 horas'], scout: 'el jefe de una escudería'
    },
    esports: {
      name: 'E-sports', icon: '🎮', team: true, club: 'Club de videojuegos', start: [14, 25], retire: [26, 32], health: 0, injury: 0.03,
      key: { programacion: 0.5, smarts: 0.32 }, skill: 'programacion',
      titles: ['Jugador amateur de e-sports|Jugadora amateur de e-sports', 'Profesional de e-sports', 'Estrella de un equipo internacional', 'Campeón mundial de e-sports|Campeona mundial de e-sports'],
      pay: [3000, 65000, 520000, 2100000],
      clubs: ['Pixel Lords', 'Team Nébula', 'Furia Digital', 'Los Lag'],
      trophies: ['el campeonato mundial', 'el torneo internacional', 'la liga regional'], scout: 'el mánager de un equipo profesional'
    }
  };

  /** Talento natural (oculto) para cada deporte: se sortea al nacer. */
  MV.rollTalent = function () {
    const t = {};
    Object.keys(MV.SPORTS).forEach((k) => { t[k] = MV.U.int(-12, 15); });
    return t;
  };

  /** Empleos generados a partir de cada deporte (id: sport_<deporte>). */
  MV.SPORT_JOBS = {};
  Object.keys(MV.SPORTS).forEach((k) => {
    const S = MV.SPORTS[k];
    MV.SPORT_JOBS['sport_' + k] = {
      id: 'sport_' + k, sport: k, sector: S.name, icon: S.icon, type: 'sport', stress: 5, skillUp: S.skill || 'deporte',
      titles: S.titles, pay: S.pay, req: { age: S.start[0], maxAge: S.start[1], health: S.health }
    };
  });
})(window.MV = window.MV || {});
