/* Mil Vidas — noticias del mundo: titulares anuales con efectos en la economía, el empleo y la salud.
   mods: inv {inversión: corrimiento del rendimiento}, house (corrimiento del valor de las casas),
   living (multiplicador del costo de vida), hire (probabilidad extra de conseguir trabajo),
   layoff (probabilidad de despido por recorte), sick {cond, p}, happy (a todos), elderHealth (mayores de 65). */
(function (MV) {
  'use strict';
  const N = (id, icon, title, text, mods, w) => ({ id, icon, title, text, mods, w: w || 2 });
  MV.WORLD_NEWS = [
    N('recesion', '📉', 'Recesión mundial', 'Los bancos tiemblan, los economistas pelean en la tele y tu jefe empezó a usar la palabra "reestructurar".',
      { inv: { indice: -0.15, acciones: -0.25, cripto: -0.2 }, house: -0.06, hire: -0.15, layoff: 0.06, happy: -2 }, 3),
    N('auge', '📈', 'Auge económico', 'Todo el mundo invierte, compra y se siente genio de las finanzas. Hasta tu tía habla de dividendos.',
      { inv: { indice: 0.12, acciones: 0.2, cripto: 0.1 }, house: 0.04, hire: 0.12, happy: 2 }, 3),
    N('burbuja_cripto', '🪙', 'Fiebre cripto', 'Una moneda con la cara de un perro vale más que una aerolínea. Tu primo se compró un yate.',
      { inv: { cripto: 0.8 } }),
    N('desplome_cripto', '💥', 'Desplome cripto', 'Las criptomonedas cayeron tanto que los "visionarios" de internet volvieron a buscar trabajo.',
      { inv: { cripto: -0.55 } }),
    N('auge_inmobiliario', '🏘️', 'Auge inmobiliario', 'Un monoambiente sin ventanas se vende como "loft industrial". Las propiedades suben sin parar.',
      { house: 0.12 }),
    N('crisis_inmobiliaria', '🏚️', 'Estalla la burbuja inmobiliaria', 'Las casas valen menos que sus hipotecas. Los agentes inmobiliarios lloran en sus autos alemanes.',
      { house: -0.14, inv: { acciones: -0.1 }, happy: -1 }),
    N('pandemia', '🦠', 'Pandemia', 'Un virus nuevo recorre el mundo. De repente todos tus contactos son expertos en epidemiología.',
      { sick: { cond: 'gripe', p: 0.3 }, hire: -0.1, layoff: 0.04, inv: { acciones: -0.1, indice: -0.05 }, happy: -3 }, 1),
    N('inflacion', '🧾', 'Inflación desbocada', 'Los precios suben por la escalera mecánica y los sueldos por la escalera de incendios.',
      { living: 1.15, inv: { plazo: -0.02 }, happy: -2 }),
    N('auge_tech', '🤖', 'Auge tecnológico', 'Una inteligencia artificial escribe poemas, contesta correos y organiza fiestas. Las empresas contratan como locas.',
      { inv: { acciones: 0.15 }, hire: 0.15 }),
    N('guerra', '🪖', 'Guerra lejana', 'Hay una guerra al otro lado del mundo. El combustible sube y los noticieros no hablan de otra cosa.',
      { living: 1.08, inv: { acciones: -0.08, plazo: 0.01 }, happy: -2 }, 1),
    N('ola_calor', '🥵', 'Ola de calor histórica', 'Hace tanto calor que los semáforos se derriten. Los ventiladores se agotan y los abuelos la pasan mal.',
      { elderHealth: -4, happy: -1 }),
    N('elecciones', '🗳️', 'Elecciones caóticas', 'Un candidato prometió feriado todos los lunes y ganó por paliza. Los mercados no saben si reír o llorar.',
      { inv: { acciones: -0.05, indice: -0.03 } }),
    N('furor_deporte', '🏟️', 'El país campeón', 'La selección ganó un torneo internacional. Hubo caravanas, feriado improvisado y miles de lesionados festejando.',
      { happy: 4 }, 1),
    N('escandalo', '🕵️', 'Escándalo financiero', 'Un banco famoso resultó ser una estafa piramidal con oficinas muy lindas. Nadie lo vio venir, salvo todos.',
      { inv: { indice: -0.1, plazo: -0.01 }, happy: -1 }),
    N('vacuna', '💉', 'Avance médico', 'Científicos anunciaron un tratamiento revolucionario. Los hospitales celebran y las farmacéuticas, más.',
      { elderHealth: 3, inv: { acciones: 0.06 }, happy: 1 }, 1)
  ];
})(window.MV = window.MV || {});
