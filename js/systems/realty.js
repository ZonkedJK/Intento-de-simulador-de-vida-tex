/* Mil Vidas — inmuebles: mercado inmobiliario, alquiler con inquilinos, edificios, casas de vacaciones y construir. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const TYPES = ['casa', 'local', 'terreno', 'edificio', 'vacaciones'];
  const PHASES = { auge: 0.06, estable: 0, caida: -0.06 };

  const realty = {
    TYPES,
    isRealty(a) { return !!a && TYPES.includes(a.type); },

    /** Mercado inmobiliario de la partida (se crea estable si falta). */
    market(g) {
      if (!g.realty || !PHASES.hasOwnProperty(g.realty.phase)) g.realty = { phase: 'estable', left: 3 };
      return g.realty;
    },
    marketMod(g) { return PHASES[realty.market(g).phase]; },

    /** Avanza el ciclo: cada fase dura de 2 a 5 años y nunca se repite seguida. */
    yearly(g) {
      const m = realty.market(g);
      m.left--;
      if (m.left <= 0) {
        m.phase = U.pick(Object.keys(PHASES).filter((k) => k !== m.phase));
        m.left = U.int(2, 5);
      }
    }
  };

  MV.sys.realty = realty;
})(window.MV = window.MV || {});
