/* Mil Vidas — catálogo de regalos: precio, grupo y gustos (rasgos, edad y tipo de relación). */
(function (MV) {
  'use strict';
  /* Etiquetas de gusto: rasgos de personalidad, 'nino' (<13), 'teen' (13-17), 'mayor' (65+), 'pareja' (relación romántica). */
  const G = (id, name, icon, price, group, o) => Object.assign({ id, name, icon, price, group }, o || {});
  MV.GIFT_GROUPS = ['Detalles', 'Clásicos', 'Caprichos', 'Lujo', 'Locuras'];
  MV.GIFTS = [
    G('carta', 'Una carta escrita a mano', '💌', 2, 'Detalles', { likes: ['mayor', 'pareja', 'amable'], hates: ['tacaño'] }),
    G('caramelos', 'Una bolsa de caramelos', '🍬', 5, 'Detalles', { likes: ['nino'] }),
    G('calcetines', 'Unos calcetines de colores', '🧦', 10, 'Detalles', { likes: ['mayor'], hates: ['teen', 'dramático'] }),
    G('vino', 'Una botella de vino', '🍷', 15, 'Detalles', { likes: ['fiestero'], hates: ['religioso'], age: [18, 120] }),
    G('taza', 'Una taza personalizada', '☕', 20, 'Detalles', { likes: ['tranquilo'] }),
    G('chocolates', 'Una caja de chocolates', '🍫', 25, 'Detalles', { likes: ['pareja', 'nino'] }),
    G('libro', 'Un libro', '📕', 30, 'Detalles', { likes: ['ambicioso', 'tranquilo', 'mayor'], hates: ['fiestero'] }),
    G('planta', 'Una planta', '🪴', 30, 'Detalles', { likes: ['tranquilo', 'amable'] }),
    G('peluche', 'Un peluche gigante', '🧸', 35, 'Detalles', { likes: ['nino', 'pareja', 'teen'], hates: ['tóxico'] }),
    G('flores', 'Un ramo de flores', '💐', 40, 'Detalles', { likes: ['pareja', 'mayor', 'dramático'] }),
    G('juego_mesa', 'Un juego de mesa', '🎲', 60, 'Clásicos', { likes: ['nino', 'divertido'] }),
    G('pesca', 'Un equipo de pesca', '🎣', 120, 'Clásicos', { likes: ['tranquilo', 'mayor'], hates: ['dramático'] }),
    G('perfume', 'Un perfume', '🧴', 150, 'Clásicos', { likes: ['pareja', 'dramático'], age: [13, 120] }),
    G('cocina_kit', 'Un set de cocina profesional', '🍳', 180, 'Clásicos', { likes: ['mayor', 'generoso'], hates: ['perezoso'] }),
    G('concierto', 'Entradas para un concierto', '🎟️', 200, 'Clásicos', { likes: ['fiestero', 'divertido', 'teen'], age: [10, 120] }),
    G('cena', 'Una cena en un restaurante caro', '🍝', 250, 'Clásicos', { likes: ['pareja', 'chismoso'] }),
    G('ropa', 'Ropa de marca', '👗', 300, 'Clásicos', { likes: ['dramático', 'teen'], hates: ['tacaño'] }),
    G('spa', 'Un día de spa', '🧖', 350, 'Clásicos', { likes: ['pareja', 'tranquilo'], age: [16, 120] }),
    G('bicicleta', 'Una bicicleta', '🚲', 400, 'Clásicos', { likes: ['nino', 'teen'] }),
    G('consola', 'Una consola de videojuegos', '🎮', 500, 'Clásicos', { likes: ['nino', 'teen', 'perezoso'], hates: ['mayor', 'religioso'] }),
    G('cachorro', 'Un cachorro', '🐶', 600, 'Caprichos', { likes: ['nino', 'amable', 'leal'], hates: ['tóxico'], special: 'pet' }),
    G('guitarra', 'Una guitarra', '🎸', 900, 'Caprichos', { likes: ['teen', 'fiestero', 'divertido'] }),
    G('celular', 'Un celular último modelo', '📱', 1200, 'Caprichos', { likes: ['teen', 'chismoso'], age: [8, 120] }),
    G('laptop', 'Una laptop', '💻', 1500, 'Caprichos', { likes: ['ambicioso', 'teen'] }),
    G('bolso', 'Un bolso de diseñador', '👜', 2500, 'Caprichos', { likes: ['dramático', 'pareja'], age: [16, 120] }),
    G('reloj', 'Un reloj elegante', '⌚', 3000, 'Caprichos', { likes: ['ambicioso', 'mayor'], age: [16, 120] }),
    G('viaje', 'Un viaje sorpresa', '✈️', 4000, 'Caprichos', { likes: ['pareja', 'fiestero', 'divertido'], special: 'trip' }),
    G('joyas', 'Joyas', '💍', 8000, 'Caprichos', { likes: ['pareja', 'dramático'], age: [16, 120] }),
    G('moto', 'Una moto', '🏍️', 12000, 'Caprichos', { likes: ['fiestero'], hates: ['mayor'], age: [18, 75], special: 'money' }),
    G('viaje_lujo', 'Un viaje de lujo por el mundo', '🌍', 30000, 'Lujo', { likes: ['pareja', 'mayor', 'fiestero'], special: 'trip' }),
    G('auto', 'Un auto nuevo', '🚗', 35000, 'Lujo', { likes: ['ambicioso'], age: [18, 120], special: 'money' }),
    G('anillo', 'Un anillo de diamantes', '💎', 50000, 'Lujo', { likes: ['pareja', 'dramático'], age: [18, 120] }),
    G('reloj_suizo', 'Un reloj suizo de colección', '🕰️', 90000, 'Lujo', { likes: ['ambicioso', 'mayor'], age: [18, 120] }),
    G('cuadro', 'Un cuadro de un pintor famoso', '🖼️', 200000, 'Lujo', { likes: ['tranquilo', 'mayor'], special: 'money' }),
    G('departamento', 'Un departamento', '🏢', 250000, 'Lujo', { likes: ['ambicioso', 'generoso'], age: [18, 120], special: 'money' }),
    G('yate', 'Un yate', '🛥️', 2000000, 'Locuras', { likes: ['fiestero', 'dramático'], age: [18, 120], special: 'money' }),
    G('mansion', 'Una mansión', '🏰', 5000000, 'Locuras', { likes: ['ambicioso', 'dramático'], age: [18, 120], special: 'money' })
  ];

  /** Etiquetas de una persona para los gustos. */
  MV.giftTags = function (n, relType) {
    const t = (n.traits || []).slice();
    if (n.age < 13) t.push('nino'); else if (n.age < 18) t.push('teen');
    if (n.age >= 65) t.push('mayor');
    if (['pareja', 'conyuge', 'amante'].includes(relType)) t.push('pareja');
    return t;
  };

  /** Reacción de la persona a un regalo: 'love' | 'like' | 'meh' | 'hate'. */
  MV.giftReaction = function (n, gift, relType) {
    if (gift.age && (n.age < gift.age[0] || n.age > gift.age[1])) return 'hate';
    const tags = MV.giftTags(n, relType);
    if ((gift.hates || []).some((x) => tags.includes(x))) return 'hate';
    if ((gift.likes || []).some((x) => tags.includes(x))) return 'love';
    return gift.price >= Math.max(50, (n.money || 0) * 0.05) ? 'like' : 'meh';
  };
})(window.MV = window.MV || {});
