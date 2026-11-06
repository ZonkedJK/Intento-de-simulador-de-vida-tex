/* Mil Vidas — empleos, carreras de fama, mafia y preguntas de entrevista.
   Títulos: "Masculino|Femenino" (si no hay "|", es igual para ambos). */
(function (MV) {
  'use strict';
  const U = MV.U;

  MV.gt = (title, gender) => {
    const parts = String(title).split('|');
    return gender === 'f' && parts[1] ? parts[1] : parts[0];
  };

  const JOBS = [];
  function J(id, sector, icon, titles, pay, req, extra) {
    JOBS.push(Object.assign({ id, sector, icon, titles, pay, req: req || {}, type: 'full', stress: 3 }, extra || {}));
  }

  // — Sin estudios / oficios —
  J('barrendero', 'Limpieza urbana', '🧹', ['Barrendero|Barrendera', 'Supervisor de limpieza|Supervisora de limpieza'], [15000, 24000], { edu: 'ninguna', age: 16 }, { stress: 1 });
  J('sepulturero', 'Funeraria', '⚰️', ['Sepulturero|Sepulturera', 'Embalsamador|Embalsamadora', 'Director de funeraria|Directora de funeraria'], [17000, 26000, 48000], { edu: 'ninguna', age: 18 }, { stress: 1 });
  J('payaso', 'Animación de fiestas', '🤡', ['Payaso de cumpleaños|Payasa de cumpleaños', 'Payaso de circo|Payasa de circo', 'Payaso legendario|Payasa legendaria'], [10000, 22000, 45000], { edu: 'ninguna', skill: { carisma: 15 } }, { stress: 4, skillUp: 'carisma' });
  J('peon', 'Construcción', '🏗️', ['Peón de obra', 'Oficial de obra', 'Capataz'], [17000, 26000, 40000], { edu: 'ninguna', health: 45, age: 16 }, { stress: 3 });
  J('mesero', 'Restaurante', '🍽️', ['Mesero|Mesera', 'Jefe de sala|Jefa de sala', 'Maître'], [15000, 23000, 36000], { edu: 'ninguna', looks: 20 }, { stress: 4 });
  J('operario', 'Fábrica', '🏭', ['Operario|Operaria', 'Jefe de línea|Jefa de línea', 'Supervisor de planta|Supervisora de planta'], [18000, 27000, 42000], { edu: 'primaria' }, { stress: 3 });

  // — Secundaria —
  J('teleoperador', 'Call center', '🎧', ['Teleoperador|Teleoperadora', 'Supervisor de call center|Supervisora de call center'], [14000, 23000], { edu: 'secundaria' }, { stress: 7 });
  J('cajero', 'Supermercado', '🛒', ['Cajero|Cajera', 'Jefe de cajas|Jefa de cajas', 'Gerente de sucursal'], [17000, 25000, 44000], { edu: 'secundaria' }, { stress: 3 });
  J('vendedor', 'Ventas', '🤝', ['Vendedor|Vendedora', 'Vendedor senior|Vendedora senior', 'Jefe de ventas|Jefa de ventas', 'Director comercial|Directora comercial'], [19000, 30000, 52000, 95000], { edu: 'secundaria', skill: { carisma: 10 } }, { stress: 5, skillUp: 'carisma' });
  J('recepcionista', 'Oficina', '📞', ['Recepcionista', 'Asistente administrativo|Asistente administrativa', 'Jefe de administración|Jefa de administración'], [18000, 26000, 46000], { edu: 'secundaria' }, { stress: 3 });
  J('inmobiliario', 'Inmobiliaria', '🏘️', ['Agente inmobiliario|Agente inmobiliaria', 'Corredor estrella|Corredora estrella', 'Dueño de inmobiliaria|Dueña de inmobiliaria'], [20000, 55000, 120000], { edu: 'secundaria', skill: { carisma: 25 } }, { stress: 6, skillUp: 'carisma' });
  J('guardia', 'Seguridad privada', '💂', ['Guardia de seguridad', 'Jefe de seguridad|Jefa de seguridad'], [19000, 31000], { edu: 'secundaria', health: 50, clean: true, age: 18 }, { stress: 3 });
  J('policia', 'Policía', '👮', ['Cadete', 'Oficial de policía', 'Sargento', 'Inspector|Inspectora', 'Comisario|Comisaria'], [22000, 32000, 43000, 62000, 88000], { edu: 'secundaria', health: 55, clean: true, age: 18 }, { stress: 6 });
  J('bombero', 'Bomberos', '🚒', ['Bombero|Bombera', 'Teniente de bomberos', 'Capitán de bomberos|Capitana de bomberos'], [26000, 36000, 54000], { edu: 'secundaria', health: 65, age: 18 }, { stress: 5 });
  J('militar', 'Ejército', '🎖️', ['Soldado', 'Cabo', 'Sargento', 'Teniente', 'Capitán|Capitana', 'Coronel', 'General'], [20000, 25000, 32000, 45000, 62000, 88000, 135000], { edu: 'secundaria', health: 60, clean: true, age: 18 }, { stress: 6 });
  J('camionero', 'Transporte', '🚚', ['Camionero|Camionera', 'Camionero de larga distancia|Camionera de larga distancia'], [26000, 39000], { edu: 'primaria', license: true, age: 21 }, { stress: 4 });
  J('taxista', 'Transporte urbano', '🚕', ['Conductor de app|Conductora de app', 'Taxista', 'Dueño de flota de taxis|Dueña de flota de taxis'], [16000, 24000, 62000], { edu: 'primaria', license: true, age: 18 }, { stress: 5 });
  J('religioso', 'Religión', '⛪', ['Asistente parroquial', 'Predicador|Predicadora', 'Líder espiritual'], [12000, 22000, 45000], { edu: 'secundaria', karma: 20 }, { stress: 1 });

  // — Técnicos —
  J('peluquero', 'Belleza', '💇', ['Aprendiz de peluquería', 'Estilista', 'Estilista de celebridades'], [12000, 26000, 75000], { tech: ['estetica'] }, { stress: 3, skillUp: 'arte' });
  J('cocinero', 'Gastronomía', '👨‍🍳', ['Ayudante de cocina', 'Cocinero|Cocinera', 'Sous chef', 'Chef ejecutivo|Chef ejecutiva', 'Chef con estrella'], [15000, 24000, 38000, 75000, 160000], { edu: 'secundaria', skill: { cocina: 20 }, alt: (g) => MV.hasDegree(g.p, 'tecnica', 'gastronomia') }, { stress: 6, skillUp: 'cocina', altReqOnly: true });
  J('mecanico', 'Taller mecánico', '🔧', ['Ayudante de mecánico|Ayudante de mecánica', 'Mecánico|Mecánica', 'Jefe de taller|Jefa de taller'], [16000, 30000, 48000], { tech: ['mecanica'] }, { stress: 3 });
  J('electricista', 'Oficios', '⚡', ['Ayudante de electricista', 'Electricista', 'Contratista eléctrico|Contratista eléctrica'], [17000, 34000, 62000], { tech: ['electricidad'] }, { stress: 3 });
  J('webdev', 'Tecnología', '🖥️', ['Desarrollador web junior|Desarrolladora web junior', 'Desarrollador web|Desarrolladora web', 'Líder técnico|Líder técnica'], [26000, 46000, 78000], { tech: ['programacion'], alt: (g) => g.p.skills.programacion >= 55 }, { stress: 5, skillUp: 'programacion' });
  J('piloto', 'Aviación', '✈️', ['Copiloto', 'Piloto', 'Comandante de vuelo'], [52000, 98000, 165000], { tech: ['aviacion'], health: 70, smarts: 50, clean: true }, { stress: 6 });

  // — Universitarios —
  J('medico', 'Medicina', '🩺', ['Médico residente|Médica residente', 'Médico|Médica', 'Médico especialista|Médica especialista', 'Jefe de servicio|Jefa de servicio', 'Director médico|Directora médica'], [32000, 62000, 98000, 150000, 220000], { major: ['medicina'] }, { stress: 8 });
  J('enfermero', 'Salud', '💉', ['Enfermero|Enfermera', 'Enfermero jefe|Enfermera jefa', 'Supervisor de enfermería|Supervisora de enfermería'], [26000, 38000, 54000], { major: ['enfermeria', 'medicina'] }, { stress: 7 });
  J('abogado', 'Bufete', '⚖️', ['Pasante legal', 'Abogado junior|Abogada junior', 'Abogado|Abogada', 'Abogado senior|Abogada senior', 'Socio del bufete|Socia del bufete'], [20000, 40000, 66000, 115000, 260000], { major: ['derecho'] }, { stress: 7, skillUp: 'carisma' });
  J('ingeniero', 'Ingeniería', '🛠️', ['Ingeniero junior|Ingeniera junior', 'Ingeniero|Ingeniera', 'Ingeniero senior|Ingeniera senior', 'Director de ingeniería|Directora de ingeniería'], [38000, 60000, 92000, 155000], { major: ['ingenieria'] }, { stress: 5 });
  J('programador', 'Software', '💻', ['Programador junior|Programadora junior', 'Programador|Programadora', 'Programador senior|Programadora senior', 'Arquitecto de software|Arquitecta de software', 'CTO'], [36000, 62000, 98000, 145000, 250000], { major: ['informatica', 'ingenieria'] }, { stress: 6, skillUp: 'programacion' });
  // — Con licencia de vehículo —
  J('piloto_comercial', 'Aerolínea', '✈️', ['Copiloto', 'Primer oficial|Primera oficial', 'Comandante', 'Comandante de vuelos internacionales'], [60000, 95000, 160000, 240000], { age: 21, edu: 'secundaria', lic: ['avion'] }, { stress: 6 });
  J('piloto_heli', 'Aviación', '🚁', ['Piloto de helicóptero turístico', 'Piloto de rescate', 'Piloto ejecutivo|Piloto ejecutiva'], [50000, 85000, 140000], { age: 20, edu: 'secundaria', lic: ['helicoptero'] }, { stress: 6 });
  J('capitan_yate', 'Náutica', '⛵', ['Patrón de lancha|Patrona de lancha', 'Capitán de yate|Capitana de yate', 'Capitán de superyate|Capitana de superyate'], [32000, 70000, 150000], { age: 18, lic: ['yate'] }, { stress: 4 });
  J('psicologo', 'Psicología', '🛋️', ['Psicólogo|Psicóloga', 'Psicólogo clínico|Psicóloga clínica', 'Director de clínica|Directora de clínica'], [28000, 48000, 88000], { major: ['psicologia'] }, { stress: 5 });
  J('gerente', 'Corporación', '💼', ['Analista', 'Coordinador|Coordinadora', 'Gerente', 'Director|Directora', 'CEO'], [32000, 48000, 82000, 155000, 480000], { major: ['administracion', 'economia', 'ingenieria'] }, { stress: 8, skillUp: 'carisma' });
  J('financiero', 'Banca', '🏦', ['Analista financiero|Analista financiera', 'Banquero|Banquera', 'Gestor de fondos|Gestora de fondos', 'Director de inversiones|Directora de inversiones'], [42000, 78000, 145000, 320000], { major: ['economia', 'administracion'], smarts: 60 }, { stress: 9 });
  J('arquitecto', 'Estudio de arquitectura', '📐', ['Arquitecto junior|Arquitecta junior', 'Arquitecto|Arquitecta', 'Socio del estudio|Socia del estudio'], [30000, 56000, 115000], { major: ['arquitectura'] }, { stress: 6, skillUp: 'arte' });
  J('maestro', 'Educación', '🍎', ['Maestro suplente|Maestra suplente', 'Maestro|Maestra', 'Director de escuela|Directora de escuela'], [16000, 26000, 43000], { major: ['educacion', 'filosofia', 'idiomas'] }, { stress: 6 });
  J('periodista', 'Medios', '📰', ['Redactor|Redactora', 'Periodista', 'Editor|Editora', 'Director del diario|Directora del diario'], [20000, 32000, 52000, 92000], { major: ['periodismo', 'filosofia'] }, { stress: 6, skillUp: 'carisma' });
  J('cientifico', 'Laboratorio', '🔬', ['Investigador asistente|Investigadora asistente', 'Investigador|Investigadora', 'Científico principal|Científica principal'], [25000, 43000, 82000], { major: ['biologia', 'medicina'] }, { stress: 4 });
  J('veterinario', 'Veterinaria', '🐾', ['Veterinario|Veterinaria', 'Veterinario jefe|Veterinaria jefa', 'Dueño de clínica veterinaria|Dueña de clínica veterinaria'], [30000, 48000, 88000], { major: ['veterinaria'] }, { stress: 5 });
  J('disenador', 'Diseño', '🎨', ['Diseñador junior|Diseñadora junior', 'Diseñador gráfico|Diseñadora gráfica', 'Director de arte|Directora de arte'], [20000, 34000, 66000], { major: ['bellasartes', 'arquitectura'], alt: (g) => g.p.skills.arte >= 55 && MV.eduLevel(g.p) >= 2 }, { stress: 5, skillUp: 'arte' });
  J('orquesta', 'Música clásica', '🎻', ['Profesor de música|Profesora de música', 'Músico de orquesta|Música de orquesta', 'Director de orquesta|Directora de orquesta'], [16000, 35000, 92000], { major: ['musica'], skill: { musica: 35 } }, { stress: 4, skillUp: 'musica' });
  J('traductor', 'Idiomas', '🌍', ['Traductor|Traductora', 'Intérprete', 'Intérprete de la ONU'], [24000, 40000, 88000], { major: ['idiomas'], alt: (g) => g.p.skills.idiomas >= 65 && MV.eduLevel(g.p) >= 2 }, { stress: 4, skillUp: 'idiomas' });

  // — Después del deporte profesional —
  J('entrenador', 'Cuerpo técnico', '📋', ['Entrenador asistente|Entrenadora asistente', 'Entrenador|Entrenadora', 'Director técnico|Directora técnica', 'Seleccionador nacional|Seleccionadora nacional'], [28000, 60000, 180000, 650000], { edu: 'secundaria', skill: { deporte: 60 }, alt: (g) => !!g.p.flags.exAtleta }, { stress: 7, skillUp: 'carisma' });
  J('comentarista', 'Televisión deportiva', '🎙️', ['Comentarista deportivo|Comentarista deportiva', 'Analista estrella de TV', 'Voz oficial del Mundial'], [45000, 220000, 700000], { edu: 'secundaria', skill: { carisma: 55 }, major: ['periodismo'], alt: (g) => !!g.p.flags.exAtleta && g.p.fame >= 30 }, { stress: 4, skillUp: 'carisma' });

  // — Posgrado —
  J('cirujano', 'Cirugía', '🔪', ['Cirujano|Cirujana', 'Cirujano jefe|Cirujana jefa', 'Eminencia de la cirugía'], [160000, 260000, 420000], { major: ['medicina'], post: true, smarts: 70 }, { stress: 9 });
  J('juez', 'Poder Judicial', '👨‍⚖️', ['Juez|Jueza', 'Juez de cámara|Jueza de cámara', 'Juez de la Corte Suprema|Jueza de la Corte Suprema'], [120000, 175000, 265000], { major: ['derecho'], post: true, smarts: 65, clean: true, age: 35 }, { stress: 6 });
  J('profesor', 'Universidad', '🎓', ['Profesor adjunto|Profesora adjunta', 'Profesor titular|Profesora titular', 'Decano|Decana'], [40000, 72000, 125000], { postType: 'doctorado' }, { stress: 4 });
  J('astronauta', 'Agencia espacial', '🚀', ['Candidato a astronauta|Candidata a astronauta', 'Astronauta', 'Comandante de misión'], [72000, 125000, 210000], { major: ['ingenieria', 'biologia', 'medicina', 'informatica'], post: true, smarts: 85, health: 80, maxAge: 50 }, { stress: 8 });

  // — Medio tiempo (14+) —
  const PART = [];
  function P(id, icon, title, pay, req) { PART.push({ id, icon, titles: [title], pay: [pay], req: req || {}, type: 'part', sector: 'Medio tiempo', stress: 2 }); }
  P('ninera', '🍼', 'Niñero|Niñera', 4000, {});
  P('paseador', '🐕', 'Paseador de perros|Paseadora de perros', 3500, {});
  P('repartidor', '🚲', 'Repartidor en bici|Repartidora en bici', 5200, { health: 40 });
  P('lavaplatos', '🧽', 'Lavaplatos', 4800, {});
  P('comida_rapida', '🍔', 'Empleado de comida rápida|Empleada de comida rápida', 6000, {});
  P('socorrista', '🏊', 'Socorrista', 6500, { health: 60, skill: { deporte: 20 } });
  P('tutor', '📚', 'Tutor particular|Tutora particular', 5800, { smarts: 70 });
  P('boletero', '🎟️', 'Boletero de cine|Boletera de cine', 4500, {});
  P('mascota_evento', '🦖', 'Persona disfrazada de dinosaurio', 5000, {});
  P('streaming_mod', '🛡️', 'Moderador de chat|Moderadora de chat', 3000, { skill: { programacion: 10 } });

  // — Carreras especiales (fama) —
  const FAME = {
    actor: {
      id: 'actor', sector: 'Actuación', icon: '🎬', type: 'fame', key: (p) => p.stats.looks * 0.5 + p.skills.carisma * 0.5,
      titles: ['Extra', 'Actor de reparto|Actriz de reparto', 'Actor protagonista|Actriz protagonista', 'Estrella de cine', 'Leyenda del cine'],
      pay: [8000, 42000, 190000, 950000, 3200000], req: { age: 16 }, stress: 6, skillUp: 'carisma', audition: 'casting'
    },
    musico: {
      id: 'musico', sector: 'Música', icon: '🎤', type: 'fame', key: (p) => p.skills.musica * 0.75 + p.stats.looks * 0.25,
      titles: ['Músico callejero|Música callejera', 'Músico de bar|Música de bar', 'Artista con contrato', 'Estrella del pop', 'Ícono musical'],
      pay: [6000, 18000, 95000, 850000, 2600000], req: { age: 14 }, stress: 5, skillUp: 'musica', audition: 'demo'
    },
    modelo: {
      id: 'modelo', sector: 'Moda', icon: '📸', type: 'fame', key: (p) => p.stats.looks,
      titles: ['Modelo de catálogo', 'Modelo de pasarela', 'Supermodelo'],
      pay: [12000, 92000, 720000], req: { age: 16, maxAge: 35, looks: 72 }, stress: 5, audition: 'casting', retireAge: 45
    },
    politico: {
      id: 'politico', sector: 'Política', icon: '🏛️', type: 'fame', key: (p) => p.skills.carisma * 0.5 + p.stats.smarts * 0.3 + p.fame * 0.2,
      titles: ['Concejal|Concejala', 'Diputado|Diputada', 'Senador|Senadora', 'Gobernador|Gobernadora', 'Presidente|Presidenta'],
      pay: [42000, 92000, 145000, 205000, 310000], req: { age: 25, edu: 'secundaria', skill: { carisma: 25 } }, stress: 8, skillUp: 'carisma', audition: 'eleccion'
    },
    mafia: {
      id: 'mafia', sector: 'La Familia', icon: '🕴️', type: 'crime', key: (p) => p.skills.crimen * 0.7 + p.stats.smarts * 0.3,
      titles: ['Recadero|Recadera', 'Matón|Matona', 'Soldado de la familia', 'Lugarteniente', 'Jefe de la familia|Jefa de la familia'],
      pay: [15000, 40000, 92000, 260000, 950000], req: { age: 16, skill: { crimen: 15 } }, stress: 7, skillUp: 'crimen'
    }
  };

  MV.JOBS = JOBS;
  MV.PARTTIME = PART;
  MV.FAME = FAME;
  MV.jobById = (id) => {
    if (id === 'atleta') id = 'sport_futbol'; // partidas anteriores a los deportes
    return JOBS.find((j) => j.id === id) || PART.find((j) => j.id === id) || FAME[id] || (MV.SPORT_JOBS && MV.SPORT_JOBS[id]) || null;
  };

  /** Título aleatorio para NPC adultos (padres, parejas...). */
  MV.randomJobTitle = function (n) {
    if (U.chance(0.07)) return n.gender === 'f' ? 'Desempleada' : 'Desempleado';
    if (U.chance(0.05)) return n.gender === 'f' ? 'Ama de casa' : 'Amo de casa';
    const j = U.pick(JOBS);
    const lvl = U.int(0, Math.min(j.titles.length - 1, Math.floor((n.age - 18) / 8)));
    return MV.gt(j.titles[lvl], n.gender);
  };

  MV.INTERVIEW = [
    { q: '¿Cuál es tu mayor defecto?', a: ['Me cuesta delegar porque me involucro demasiado.', 'Soy perfeccionista.', 'Robo bolígrafos. Muchos.'] },
    { q: '¿Dónde te ves en cinco años?', a: ['Creciendo con la empresa y liderando proyectos.', 'Trabajando, supongo.', 'En tu silla.'] },
    { q: '¿Por qué quieres trabajar aquí?', a: ['Admiro lo que hacen y creo que puedo aportar.', 'Me queda cerca de casa.', 'Mi madre dijo que si no consigo trabajo me echa.'] },
    { q: 'Cuéntame de un conflicto que hayas resuelto.', a: ['Mediante el diálogo encontré una solución para ambas partes.', 'Lo ignoré hasta que se resolvió solo.', 'Gané la pelea. Fin.'] },
    { q: '¿Qué salario esperas?', a: ['Lo que sea justo para el puesto y el mercado.', 'Lo máximo posible.', 'Con que alcance para el alquiler y una pizza, firmo.'] },
    { q: 'Si fueras un animal, ¿cuál serías?', a: ['Un delfín: inteligente y trabaja en equipo.', 'Un perro, supongo.', 'Un mapache. Por la basura.'] },
    { q: '¿Trabajas bien bajo presión?', a: ['Sí, me organizo y priorizo.', 'Más o menos.', 'Lloro, pero entrego.'] },
    { q: '¿Tienes preguntas para nosotros?', a: ['¿Cómo es un día típico en el equipo?', 'No, ninguna.', '¿Hay comida gratis? ¿Cuánta?'] }
  ];
})(window.MV = window.MV || {});
