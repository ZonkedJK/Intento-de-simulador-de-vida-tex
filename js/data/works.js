/* Mil Vidas — obras: libros, canciones y cuadros con género, títulos al azar y críticas. */
(function (MV) {
  'use strict';
  const G = (id, name, bonus) => ({ id, name, bonus: bonus || (() => 0) });
  MV.WORK_KINDS = {
    libro: {
      name: 'Libro', icon: '📚', skill: 'arte', minAge: 16, stress: 6, verb: 'Publicaste', noun: 'el libro', action: '✍️ Publicar',
      hit: [80000, 900000], fame: [10, 20], royalty: 0.25, ach: 'escritor', hitText: '¡Es un best seller! Las librerías no dan abasto.',
      genres: [G('misterio', 'Novela de misterio', (p) => (p.stats.smarts - 50) / 5), G('autoayuda', 'Autoayuda', (p) => (p.skills.carisma - 40) / 6),
        G('fantasia', 'Saga de fantasía'), G('memorias', 'Memorias exageradas', (p) => p.fame / 8), G('cocina', 'Libro de cocina', (p) => (p.skills.cocina - 40) / 4), G('poesia', 'Poesía oscura', (p) => (50 - p.stats.happy) / 6)],
      a: ['El silencio de', 'Cien años de', 'Crónica de', 'Memorias de', 'Sombras sobre', 'La venganza de', 'Manual para sobrevivir a', 'El último secreto de', 'Cartas a'],
      b: ['los lunes', 'mi suegra', 'un mapache', 'la heladera', 'nadie', 'un contador', 'las palomas', 'mi ex', 'la oficina', 'un pueblo sin wifi']
    },
    cancion: {
      name: 'Canción', icon: '🎵', skill: 'musica', minAge: 12, stress: 3, verb: 'Grabaste', noun: 'la canción', action: '🎙️ Grabar',
      hit: [50000, 600000], fame: [12, 25], royalty: 0.3, ach: 'hit', hitText: '¡Llegó al número 1! Suena en todas las radios y en todos los taxis.',
      genres: [G('pop', 'Pop', (p) => (p.stats.looks - 50) / 6), G('rock', 'Rock'), G('reggaeton', 'Reguetón', (p) => p.fame / 10), G('balada', 'Balada romántica', (p) => (p.skills.carisma - 40) / 6),
        G('tango', 'Tango', (p) => (p.age - 40) / 5), G('trap', 'Trap', (p) => (30 - p.age) / 4)],
      a: ['Bailando con', 'Lágrimas de', 'Perreo en', 'Te extraño,', 'Corazón de', 'Fuego en', 'Noches de', 'Adiós a', 'Llorando en'],
      b: ['tu ex', 'la cumbia', 'mi moto', 'medianoche', 'mi barrio', 'neón', 'la terraza', 'un taxi', 'agosto', 'la playa']
    },
    cuadro: {
      name: 'Cuadro', icon: '🖼️', skill: 'arte', minAge: 8, stress: 2, verb: 'Pintaste', noun: 'el cuadro', action: '🖌️ Exponer',
      hit: [30000, 400000], fame: [6, 12], royalty: 0, ach: 'museo', hitText: '¡Lo compró un museo! Ahora hay gente mirándolo con la mano en el mentón.',
      genres: [G('retrato', 'Retrato'), G('paisaje', 'Paisaje', (p) => (p.counters.viajes || 0) * 2), G('abstracto', 'Arte abstracto', (p) => (p.stats.smarts - 50) / 6),
        G('naturaleza', 'Naturaleza muerta'), G('urbano', 'Arte urbano', (p) => (p.skills.crimen || 0) / 6)],
      a: ['Retrato de', 'Paisaje con', 'Composición en', 'Estudio de', 'Naturaleza muerta con', 'Sueño de', 'Grito de'],
      b: ['un gato triste', 'azul y rabia', 'una silla', 'mi abuela', 'bananas', 'el vacío', 'un lunes', 'la ciudad dormida', 'un pez']
    }
  };
  /** Citas de la crítica por estrellas (1 a 5). */
  MV.WORK_REVIEWS = {
    1: ['"Una obra que nos recuerda que no todo el mundo debería expresarse."', '"Lo terminé por obligación profesional. Pido aumento."', '"El autor tiene un gran futuro en otra cosa."', '"Hubo silencio en la sala. Del incómodo."'],
    2: ['"Tiene momentos. Pocos. Cortos."', '"Se nota el esfuerzo. Lamentablemente, se nota mucho."', '"Correcta, olvidable y un poco larga."', '"A tu madre le encantó, y eso ya es algo."'],
    3: ['"Prolija y entretenida. No cambiará tu vida, pero tampoco la arruina."', '"Hay talento ahí, escondido detrás de los clichés."', '"Una propuesta honesta. Esperamos la próxima."', '"Cumple. Como un buen sándwich."'],
    4: ['"Una sorpresa refrescante. Hay que seguirle la pista."', '"Inteligente, emotiva y con mucho oficio."', '"De lo mejor que vimos este año."', '"Te deja pensando un rato largo."'],
    5: ['"Una obra maestra. Lloramos en la redacción."', '"Así se hace. Nadie va a hablar de otra cosa."', '"Brillante de principio a fin. Envidia pura."', '"Un antes y un después. Lo dijimos primero."']
  };
})(window.MV = window.MV || {});
