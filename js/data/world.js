/* Mil Vidas — bienes, enfermedades, crímenes, destinos, negocios y causas de muerte. */
(function (MV) {
  'use strict';

  MV.HOUSES = [
    { kind: 'Casa rodante', icon: '🚐', price: [15000, 40000] },
    { kind: 'Casa embrujada (eso dicen)', icon: '👻', price: [30000, 70000], haunted: true },
    { kind: 'Cabaña en el bosque', icon: '🛖', price: [40000, 110000] },
    { kind: 'Monoambiente', icon: '🏢', price: [45000, 95000] },
    { kind: 'Departamento de 2 ambientes', icon: '🏢', price: [80000, 165000] },
    { kind: 'Casa pequeña', icon: '🏠', price: [90000, 185000] },
    { kind: 'Casa familiar', icon: '🏡', price: [160000, 360000] },
    { kind: 'Casa con piscina', icon: '🏡', price: [350000, 850000], has: ['piscina'] },
    { kind: 'Penthouse', icon: '🌆', price: [700000, 2100000] },
    { kind: 'Mansión', icon: '🏰', price: [2000000, 9000000] },
    { kind: 'Castillo medieval', icon: '🏯', price: [8000000, 30000000] }
  ];
  /** Mejoras de casas. cost = fixed + pct·valor; back = fracción del costo que suma al valor (negativa resta);
      upkeep anual; house: solo casas (no departamentos); minValue: solo propiedades caras; eff: efecto anual si es tu hogar. */
  MV.HOUSE_UPGRADES = [
    { id: 'piscina', name: 'Piscina', icon: '🏊', fixed: 25000, pct: 0.03, back: 0.8, upkeep: 1500, house: true, demand: true, eff: { happy: 2, health: 1 }, desc: 'Felicidad y salud' },
    { id: 'sauna', name: 'Sauna', icon: '🧖', fixed: 12000, pct: 0.01, back: 0.6, upkeep: 600, eff: { stress: -4, health: 1 }, desc: 'Baja el estrés' },
    { id: 'tenis', name: 'Cancha de tenis', icon: '🎾', fixed: 40000, pct: 0.02, back: 0.7, upkeep: 1200, house: true, demand: true, sport: 'tenis', eff: { skills: { deporte: 1 } }, desc: 'Entrena Deporte y suma práctica de tenis' },
    { id: 'gimnasio', name: 'Gimnasio en casa', icon: '🏋️', fixed: 15000, pct: 0.01, back: 0.5, upkeep: 400, eff: { health: 2 }, desc: 'Más salud cada año' },
    { id: 'jardin', name: 'Jardín paisajista', icon: '🌷', fixed: 8000, pct: 0.015, back: 1, upkeep: 900, house: true, demand: true, eff: { happy: 1, stress: -2 }, desc: 'Felicidad y paz' },
    { id: 'cine', name: 'Cine en casa', icon: '🎬', fixed: 20000, pct: 0.01, back: 0.5, upkeep: 300, eff: { happy: 2 }, desc: 'Noches de película' },
    { id: 'bodega', name: 'Bodega de vinos', icon: '🍷', fixed: 18000, pct: 0.01, back: 0.6, upkeep: 300, eff: { happy: 1, addic: { alcohol: 2 } }, desc: 'Felicidad (y tentación)' },
    { id: 'cocina', name: 'Cocina gourmet', icon: '👨‍🍳', fixed: 30000, pct: 0.02, back: 0.9, upkeep: 200, demand: true, eff: { skills: { cocina: 2 } }, desc: 'Entrena Cocina' },
    { id: 'estudio', name: 'Estudio de música', icon: '🎙️', fixed: 25000, pct: 0.01, back: 0.5, upkeep: 300, eff: { skills: { musica: 2 } }, desc: 'Entrena Música' },
    { id: 'gamer', name: 'Sala gamer', icon: '🎮', fixed: 10000, pct: 0.005, back: 0.3, upkeep: 200, eff: { happy: 1, stress: -2, skills: { programacion: 1 } }, desc: 'Diversión y Programación' },
    { id: 'solar', name: 'Paneles solares', icon: '☀️', fixed: 15000, pct: 0.01, back: 1.1, upkeep: -800, demand: true, eff: { karma: 1 }, desc: 'Ahorran mantenimiento y suman valor' },
    { id: 'ascensor', name: 'Ascensor', icon: '🛗', fixed: 35000, pct: 0, back: 0.7, upkeep: 500, minValue: 600000, eff: {}, elderHealth: 1, desc: 'Ayuda a la salud desde los 70 años' },
    { id: 'bunker', name: 'Búnker antiapocalipsis', icon: '☢️', fixed: 120000, pct: 0, back: 0.2, upkeep: 1000, house: true, eff: { stress: -1 }, desc: 'Paz mental para el fin del mundo' },
    { id: 'tobogan', name: 'Tobogán del segundo piso al living', icon: '🛝', fixed: 6000, pct: 0, back: -0.3, upkeep: 100, eff: { happy: 3 }, desc: 'Muy divertido. A los compradores no les gusta' }
  ];

  MV.STREETS = ['Calle de los Olmos', 'Pasaje Sin Salida', 'Av. del Libertador', 'Calle Falsa', 'Barrio Jardín',
    'Camino del Puerto', 'Calle del Sol', 'Barrio Alto', 'Av. de las Américas', 'Calle Esperanza', 'Callejón del Gato'];

  MV.CARS = [
    { kind: 'Chatarra con ruedas', icon: '🚗', price: [1500, 4000] },
    { kind: 'Moto', icon: '🏍️', price: [3000, 12000] },
    { kind: 'Compacto', icon: '🚗', price: [12000, 22000] },
    { kind: 'Sedán', icon: '🚙', price: [22000, 42000] },
    { kind: 'Eléctrico', icon: '🔋', price: [35000, 90000] },
    { kind: 'Camioneta', icon: '🛻', price: [35000, 72000] },
    { kind: 'Clásico restaurado', icon: '🚘', price: [40000, 200000] },
    { kind: 'SUV de lujo', icon: '🚙', price: [70000, 145000] },
    { kind: 'Deportivo', icon: '🏎️', price: [120000, 320000] },
    { kind: 'Superdeportivo', icon: '🏎️', price: [400000, 2500000] }
  ];
  MV.CAR_BRANDS = ['Torino', 'Velox', 'Kondor', 'Ruta', 'Aurora', 'Pampa', 'Fénix', 'Zorzal', 'Halcón', 'Brava', 'Titán', 'Mistral'];
  MV.CAR_MODELS = ['GT', 'Sport', 'LX', 'Turbo', 'Eco', 'Max', 'Ranchera', 'Coupé', 'Familiar', 'Bala', 'Nube'];

  MV.LUXURY = [
    { kind: 'Guitarra firmada', icon: '🎸', price: [3000, 60000], vol: 0.1 },
    { kind: 'Reloj de lujo', icon: '⌚', price: [5000, 90000], vol: 0.05 },
    { kind: 'Collar de diamantes', icon: '💎', price: [10000, 260000], vol: 0.06 },
    { kind: 'Cuadro de un pintor famoso', icon: '🖼️', price: [20000, 3000000], vol: 0.15 },
    { kind: 'NFT de un mono aburrido', icon: '🐒', price: [500, 300000], vol: 0.7 },
    { kind: 'Yate', icon: '🛥️', price: [300000, 15000000], vol: 0.08, upkeep: 0.06 },
    { kind: 'Avión privado', icon: '🛩️', price: [3000000, 60000000], vol: 0.06, upkeep: 0.08 },
    { kind: 'Helicóptero', icon: '🚁', price: [700000, 9000000], vol: 0.07, upkeep: 0.07 },
    { kind: 'Isla privada', icon: '🏝️', price: [10000000, 90000000], vol: 0.05, upkeep: 0.02 }
  ];

  /** Enfermedades: drain=[min,max] de salud por año, heal=prob. de curarse sola por año,
      cure=prob. de cura con tratamiento, cost=precio del tratamiento. */
  MV.CONDITIONS = {
    resfriado: { name: 'Resfriado', icon: '🤧', drain: [0, 2], heal: 0.9, cure: 0.95, cost: 60 },
    gripe: { name: 'Gripe', icon: '🤒', drain: [2, 5], heal: 0.75, cure: 0.9, cost: 120 },
    piojos: { name: 'Piojos', icon: '🪳', drain: [0, 1], heal: 0.3, cure: 0.95, cost: 30, happy: -4, maxAge: 14 },
    varicela: { name: 'Varicela', icon: '🔴', drain: [2, 5], heal: 0.9, cure: 0.9, cost: 80, maxAge: 14 },
    alergia: { name: 'Alergia', icon: '🌼', drain: [0, 1], heal: 0.25, cure: 0.6, cost: 150 },
    migrana: { name: 'Migraña', icon: '🤕', drain: [0, 2], heal: 0.3, cure: 0.7, cost: 300, happy: -3 },
    fractura: { name: 'Fractura', icon: '🦴', drain: [4, 9], heal: 0.5, cure: 0.95, cost: 1500 },
    apendicitis: { name: 'Apendicitis', icon: '🩸', drain: [8, 15], heal: 0.05, cure: 0.97, cost: 4000, urgent: true },
    asma: { name: 'Asma', icon: '😮‍💨', drain: [0, 2], heal: 0.1, cure: 0.5, cost: 500 },
    depresion: { name: 'Depresión', icon: '🌧️', drain: [0, 2], heal: 0.3, cure: 0.6, cost: 1200, happy: -6 },
    ansiedad: { name: 'Ansiedad', icon: '🌀', drain: [0, 2], heal: 0.3, cure: 0.65, cost: 900, happy: -6, stress: 8 },
    ets: { name: 'Infección de transmisión sexual', icon: '🦠', drain: [2, 6], heal: 0.05, cure: 0.9, cost: 700 },
    diabetes: { name: 'Diabetes', icon: '🍬', drain: [1, 3], heal: 0, cure: 0.25, cost: 2500, minAge: 30 },
    hipertension: { name: 'Hipertensión', icon: '🫀', drain: [1, 3], heal: 0.02, cure: 0.5, cost: 900, minAge: 35 },
    cardiopatia: { name: 'Enfermedad cardíaca', icon: '💔', drain: [3, 8], heal: 0, cure: 0.4, cost: 25000, minAge: 45 },
    cancer: { name: 'Cáncer', icon: '🎗️', drain: [6, 14], heal: 0.03, cure: 0.45, cost: 60000, minAge: 25 },
    artritis: { name: 'Artritis', icon: '🦵', drain: [0, 2], heal: 0, cure: 0.3, cost: 1500, minAge: 50 },
    alzheimer: { name: 'Alzheimer', icon: '🧩', drain: [3, 6], heal: 0, cure: 0.05, cost: 30000, minAge: 65, smarts: -6 },
    cirrosis: { name: 'Cirrosis', icon: '🍺', drain: [6, 12], heal: 0, cure: 0.3, cost: 40000, minAge: 30 },
    insomnio: { name: 'Insomnio', icon: '🌙', drain: [0, 2], heal: 0.4, cure: 0.7, cost: 400, stress: 5 },
    infeccion_tatuaje: { name: 'Infección del tatuaje', icon: '🩹', drain: [1, 4], heal: 0.7, cure: 0.95, cost: 200 },
    lesion: { name: 'Lesión deportiva', icon: '🩼', drain: [2, 6], heal: 0.6, cure: 0.9, cost: 3000 },
    hipocondria: { name: 'Hipocondría', icon: '🩺', drain: [0, 1], heal: 0.2, cure: 0.5, cost: 2000, happy: -3, minAge: 20 }
  };
  // Enfermedades aleatorias por año según edad (pesos).
  MV.RANDOM_CONDS = [
    ['resfriado', 30], ['gripe', 18], ['piojos', 8], ['varicela', 5], ['alergia', 5], ['migrana', 5], ['fractura', 6],
    ['apendicitis', 2], ['asma', 2], ['depresion', 4], ['ansiedad', 5], ['diabetes', 3], ['hipertension', 4],
    ['cardiopatia', 3], ['cancer', 2.5], ['artritis', 4], ['alzheimer', 2], ['insomnio', 4], ['hipocondria', 1]
  ];

  /** Crímenes de la sección Actividades. sev: gravedad (1-5) → años de condena. */
  MV.CRIMES = {
    hurto: { name: 'Robar en una tienda', icon: '🛍️', age: 10, sev: 1, loot: [5, 300], ok: 0.75, caught: 0.4, skill: 2 },
    grafiti: { name: 'Pintar grafitis', icon: '🎨', age: 12, sev: 1, loot: [0, 0], ok: 0.8, caught: 0.3, skill: 1, art: true },
    carterista: { name: 'Robar una billetera', icon: '👛', age: 13, sev: 1, loot: [20, 900], ok: 0.62, caught: 0.4, skill: 3 },
    robo_auto: { name: 'Robar un auto', icon: '🚗', age: 16, sev: 2, loot: [2000, 30000], ok: 0.5, caught: 0.5, skill: 4 },
    robo_casa: { name: 'Entrar a robar a una casa', icon: '🏚️', age: 16, sev: 2, loot: [500, 25000], ok: 0.55, caught: 0.45, skill: 4 },
    estafa: { name: 'Estafa telefónica a jubilados', icon: '☎️', age: 18, sev: 2, loot: [1000, 40000], ok: 0.55, caught: 0.35, skill: 3, smarts: true, karma: -12 },
    vender_droga: { name: 'Vender drogas', icon: '💊', age: 16, sev: 3, loot: [2000, 60000], ok: 0.6, caught: 0.4, skill: 4 },
    hackeo: { name: 'Hackear un banco', icon: '💻', age: 16, sev: 3, loot: [10000, 600000], ok: 0.35, caught: 0.55, skill: 5, needs: { programacion: 55 } },
    fraude: { name: 'Fraude fiscal', icon: '🧾', age: 22, sev: 3, loot: [5000, 200000], ok: 0.55, caught: 0.35, skill: 3, smarts: true, needsJob: true },
    asalto_banco: { name: 'Asaltar un banco', icon: '🏦', age: 18, sev: 4, loot: [50000, 2000000], ok: 0.28, caught: 0.75, skill: 7 },
    contrabando: { name: 'Contrabando de quesos', icon: '🧀', age: 18, sev: 2, loot: [3000, 50000], ok: 0.6, caught: 0.35, skill: 3 }
  };
  MV.SENTENCE = { 1: [0, 1], 2: [1, 5], 3: [3, 10], 4: [8, 25], 5: [20, 60] };

  MV.DESTINATIONS = [
    { id: 'playa', name: 'Playa del Caribe', icon: '🏖️', cost: 2500, scene: 'playa' },
    { id: 'paris', name: 'París', icon: '🗼', cost: 4500, scene: 'ciudad' },
    { id: 'tokio', name: 'Tokio', icon: '🗾', cost: 6000, scene: 'ciudad' },
    { id: 'patagonia', name: 'Patagonia', icon: '🏔️', cost: 2000, scene: 'naturaleza' },
    { id: 'nyc', name: 'Nueva York', icon: '🗽', cost: 5000, scene: 'ciudad' },
    { id: 'safari', name: 'Safari en África', icon: '🦁', cost: 7000, scene: 'naturaleza' },
    { id: 'crucero', name: 'Crucero por el Mediterráneo', icon: '🚢', cost: 8000, scene: 'playa' },
    { id: 'pueblo', name: 'Pueblo de tus abuelos', icon: '🐄', cost: 300, scene: 'naturaleza' },
    { id: 'vegas', name: 'Las Vegas', icon: '🎰', cost: 3500, scene: 'casino' },
    { id: 'espacio', name: 'Viaje turístico al espacio', icon: '🚀', cost: 450000, scene: 'espacio' }
  ];

  MV.BUSINESSES = [
    { id: 'foodtruck', name: 'Food truck de choripanes', icon: '🌭', cost: 20000, risk: 0.25, skill: 'cocina', margin: 0.35 },
    { id: 'tienda', name: 'Tienda online', icon: '📦', cost: 15000, risk: 0.3, skill: 'programacion', margin: 0.4 },
    { id: 'cafe', name: 'Cafetería de especialidad', icon: '☕', cost: 60000, risk: 0.25, skill: 'cocina', margin: 0.3 },
    { id: 'gimnasio', name: 'Gimnasio', icon: '🏋️', cost: 150000, risk: 0.2, skill: 'deporte', margin: 0.28 },
    { id: 'startup', name: 'Startup tecnológica', icon: '🚀', cost: 100000, risk: 0.55, skill: 'programacion', margin: 0.9 },
    { id: 'restaurante', name: 'Restaurante', icon: '🍝', cost: 200000, risk: 0.3, skill: 'cocina', margin: 0.3 },
    { id: 'discoteca', name: 'Discoteca', icon: '🪩', cost: 300000, risk: 0.35, skill: 'carisma', margin: 0.45 },
    { id: 'funeraria', name: 'Funeraria', icon: '⚰️', cost: 120000, risk: 0.1, skill: 'carisma', margin: 0.25 }
  ];

  // — Tatuajes —
  MV.TATTOO_ARTISTS = {
    garaje: { name: 'Tatuador de garaje', icon: '🪛', cost: 150, wobble: 6, infect: 0.15, bonus: -15, desc: 'Barato, mano temblorosa y agujas "esterilizadas" con fuego' },
    estudio: { name: 'Estudio de tatuajes', icon: '🖋️', cost: 800, wobble: 1.5, infect: 0.02, bonus: 0, desc: 'Profesional y prolijo' },
    famoso: { name: 'Artista famoso', icon: '🌟', cost: 5000, wobble: 0, infect: 0, bonus: 15, desc: 'Mejora tu dibujo y lo sube a sus redes' },
    carcel: { name: 'Recluso con birome', icon: '🖊️', cost: 0, wobble: 9, infect: 0.2, bonus: -30, desc: 'Solo en la cárcel', hidden: true }
  };
  MV.TATTOO_PLACES = {
    brazo: { name: 'Brazo', icon: '💪', mult: 1, art: 'el' },
    espalda: { name: 'Espalda', icon: '🔙', mult: 1, art: 'la' },
    pierna: { name: 'Pierna', icon: '🦵', mult: 0.8, art: 'la' },
    cuello: { name: 'Cuello', icon: '🦒', mult: 1.3, art: 'el' },
    cara: { name: 'Cara', icon: '😶', mult: 1.6, art: 'la', flag: 'tatuajeCara' }
  };
  MV.TATTOO_INKS = ['#1b1b1b', '#c0392b', '#1f5fbf', '#2e8b57', '#e0a100', '#8e44ad'];
  MV.TATTOO_WIDTHS = [1.5, 3, 5];
  /** Plantillas para calcar (trazos guía en coordenadas 0-100). */
  MV.TATTOO_TEMPLATES = {
    corazon: { name: 'Corazón', icon: '❤️', pts: [[50, 82, 22, 55, 18, 38, 24, 26, 36, 22, 46, 28, 50, 36, 54, 28, 64, 22, 76, 26, 82, 38, 78, 55, 50, 82]] },
    ancla: { name: 'Ancla', icon: '⚓', pts: [[50, 18, 50, 80], [36, 30, 64, 30], [24, 62, 30, 74, 40, 80, 50, 82, 60, 80, 70, 74, 76, 62], [50, 12, 44, 16, 50, 22, 56, 16, 50, 12]] },
    calavera: { name: 'Calavera', icon: '💀', pts: [[30, 50, 28, 36, 34, 24, 50, 18, 66, 24, 72, 36, 70, 50, 64, 58, 64, 70, 36, 70, 36, 58, 30, 50], [38, 40, 44, 36, 48, 42, 42, 46, 38, 40], [52, 42, 56, 36, 62, 40, 58, 46, 52, 42], [42, 70, 42, 78], [50, 70, 50, 78], [58, 70, 58, 78]] },
    estrella: { name: 'Estrella', icon: '⭐', pts: [[50, 14, 59, 38, 84, 38, 64, 54, 72, 80, 50, 64, 28, 80, 36, 54, 16, 38, 41, 38, 50, 14]] }
  };

  MV.ABSURD_DEATHS = [
    'Te atragantaste con una aceituna en una boda.',
    'Una vaca cayó de un acantilado justo encima de ti.',
    'Te electrocutaste intentando arreglar la tostadora con un tenedor.',
    'Te reíste tanto de un video de gatos que te dio un infarto.',
    'Te caíste de la escalera intentando sacar una selfie "épica".',
    'Te golpeó un coco en la cabeza durante tus vacaciones.',
    'Un rayo te alcanzó mientras gritabas "¡a mí no me va a pasar nada!".',
    'Discutiste con un ganso. El ganso ganó.',
    'Comiste un hongo del bosque porque "se veía rico".',
    'Te quedaste dormido en un solárium. Para siempre.',
    'Intentaste ganar una apuesta comiendo 40 empanadas.',
    'Un satélite en desuso eligió tu patio para aterrizar.'
  ];
})(window.MV = window.MV || {});
