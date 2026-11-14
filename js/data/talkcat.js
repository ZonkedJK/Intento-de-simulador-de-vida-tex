/* Mil Vidas — el gato que habla: las tres voces (filósofo gruñón, diva dramática y aristócrata venido a menos).
   Cada frase es una función (c) => texto, con c = { g, p, n, d }: partida, jugador, gato y datos del caso.
   Las frases van sin comillas dobles y sin el nombre del gato delante: eso lo pone quien las usa. */
(function (MV) {
  'use strict';
  const U = MV.U;
  /** Según el género del gato (n) o del jugador (p). */
  const gn = (c, m, f) => U.gw(c.n.gender, m, f);

  MV.CAT_VOICES = {
    filosofo: {
      name: 'filósofo gruñón|filósofa gruñona',
      intro: (c) => `Sí, hablo. Llevo años oyéndote decir tonterías y alguien tenía que contestar. Como dice el refrán: ${gn(c, 'gato', 'gata')} que calla, piensa peor de ti.`
    },
    diva: {
      name: 'divo dramático|diva dramática',
      intro: (c) => `¡Por fin! ¿Sabes lo que es pasar años sin poder decirte que ese sillón es MÍO? Siéntate, que tenemos mucho de qué hablar. Sobre mí, principalmente.`
    },
    aristocrata: {
      name: 'aristócrata venido a menos|aristócrata venida a menos',
      intro: (c) => `No te asustes. En mi otra vida fui ${gn(c, 'conde', 'condesa')} y me atendían mejor, pero contigo me conformo. Sigue sirviendo el atún: desde hoy te diré si está a la altura.`
    }
  };
})(window.MV = window.MV || {});
