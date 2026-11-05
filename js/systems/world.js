/* Mil Vidas — el mundo: cada año puede traer un titular que cambia la economía, el empleo y la salud. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const CALM = 0.45;
  const NONE = { inv: {}, house: 0, living: 1, hire: 0, layoff: 0, sick: null };
  const byId = (id) => MV.WORLD_NEWS.find((n) => n.id === id) || null;
  const pct = (x) => `${x > 0 ? '+' : '−'}${Math.round(Math.abs(x) * 100)} %`;

  const world = {
    /** Elige el titular del año (o un año tranquilo) y aplica sus efectos inmediatos. */
    yearly(g) {
      const prev = g.world && g.world.id;
      const pick = U.chance(CALM) ? null : U.pickW(MV.WORLD_NEWS.filter((n) => n.id !== prev), 'w');
      world.set(g, pick ? pick.id : null);
    },

    /** Fija el titular de este año (null = año tranquilo), lo anota en el diario y aplica sus efectos. */
    set(g, id) {
      const old = g.world || {};
      const past = (old.past || []).concat(old.id ? [old.id] : []).slice(-10);
      g.world = { age: g.p.age, id: byId(id) ? id : null, past };
      const N = world.current(g);
      if (!N) return;
      MV.log(g, `${N.title}. ${N.text}`, '📰');
      const m = N.mods, p = g.p;
      if (m.happy) MV.fx.stat(g, 'happy', m.happy);
      if (m.elderHealth && p.age >= 65) MV.fx.stat(g, 'health', m.elderHealth);
      if (m.sick && !p.prison && U.chance(m.sick.p)) MV.sys.health.add(g, m.sick.cond);
    },

    /** Titular vigente este año, o null. */
    current(g) {
      return g && g.world && g.world.id && g.world.age === g.p.age ? byId(g.world.id) : null;
    },

    /** Modificadores vigentes, con valores neutros si el año es tranquilo. */
    mods(g) {
      const N = world.current(g);
      return N ? Object.assign({}, NONE, N.mods, { inv: N.mods.inv || {} }) : NONE;
    },

    /** Resumen corto de los efectos, para la interfaz. */
    describe(N) {
      if (!N) return 'Año tranquilo: la economía sigue su curso.';
      const m = N.mods, out = [];
      Object.keys(m.inv || {}).forEach((k) => out.push(`${MV.INVEST[k].name.toLowerCase()} ${pct(m.inv[k])}`));
      if (m.house) out.push(`casas ${pct(m.house)}`);
      if (m.living && m.living !== 1) out.push(`costo de vida ${pct(m.living - 1)}`);
      if (m.hire) out.push(m.hire > 0 ? 'es más fácil conseguir trabajo' : 'cuesta más conseguir trabajo');
      if (m.layoff) out.push('hay despidos');
      if (m.sick) out.push('más contagios');
      if (m.elderHealth) out.push(m.elderHealth > 0 ? 'mejor salud para los mayores' : 'riesgo para los mayores');
      if (m.happy && !out.length) out.push(m.happy > 0 ? 'todos andan de buen humor' : 'el ánimo general está por el piso');
      return U.cap(out.join(', ')) + '.';
    }
  };
  MV.sys.world = world;
})(window.MV = window.MV || {});
