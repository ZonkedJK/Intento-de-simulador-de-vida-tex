/* Mil Vidas — proyectos para islas privadas: resort, parque temático, casino y reserva natural.
   cost: inversión inicial; base: ganancia por nivel; events: eventos con decisiones (1 de cada 4 años). */
(function (MV) {
  'use strict';
  MV.ISLAND_TYPES = {
    resort: { name: 'Resort de lujo', icon: '🏨', cost: 5000000, base: 600000, events: ['isla_resena'],
      desc: 'Habitaciones con vista al mar, spa y playas privadas. Vive de las reseñas.',
      names: ['Paraíso Escondido', 'Bahía Serena', 'Arena Dorada Resort', 'Coral Azul', 'Palmeras del Fin del Mundo'] },
    parque: { name: 'Parque temático', icon: '🎢', cost: 8000000, base: 1000000, mascot: true, events: ['isla_mascota', 'isla_montana'],
      desc: 'Atracciones, desfiles y una mascota propia. Muy rentable... hasta el primer escándalo.',
      names: ['Mundo Mapache', 'Reino Chancleta', 'Isla Fantasía Pirata', 'Planeta Alegría', 'Valle Algodón'],
      mascots: ['Mapache Pepe', 'Capitán Cangrejo', 'Tortuga Tula', 'Pato Fortunato', 'Ardilla Turbo'] },
    casino: { name: 'Casino y club privado', icon: '🎰', cost: 6000000, base: 1400000, events: ['isla_redada'],
      desc: 'Ruletas, celebridades y fiestas hasta el amanecer. La policía mira de cerca.',
      names: ['Fortuna Real', 'Club Medianoche', 'La Ruleta de Oro', 'Isla Jackpot'] },
    reserva: { name: 'Reserva natural', icon: '🐢', cost: 1000000, base: 100000, karma: 3, fame: 2, events: ['isla_documental'],
      desc: 'Gana poco, pero el mundo te quiere: tortugas, manglares y documentales.',
      names: ['Santuario Verde', 'Reserva Tortuga Feliz', 'Refugio del Manglar', 'Isla de los Pelícanos'] }
  };
})(window.MV = window.MV || {});
