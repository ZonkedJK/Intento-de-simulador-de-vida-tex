/* Mil Vidas — el gato que habla: uno de tus gatos aprende a hablar al cumplir una meta (uno por vida). */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const KINDS = ['filosofo', 'diva', 'aristocrata'];
  /** Tus gatos vivos, en el orden de tus relaciones: [{ r, n }]. */
  const cats = (g) => MV.rels(g, 'mascota').filter(({ n }) => n.species === 'gato');

  const talkcat = {
    KINDS,

    /** Tu gato que habla, si vive y sigue contigo. */
    cat(g) {
      const id = g.p.flags && g.p.flags.gatoHabla;
      const n = id && g.people[id];
      if (!n || !n.alive || !n.talk) return null;
      const r = MV.relOf(g, id);
      return r && r.type === 'mascota' ? n : null;
    },

    voice(n) { return MV.CAT_VOICES[n.talk && n.talk.kind] || MV.CAT_VOICES.filosofo; },
    /** "filósofo gruñón", "diva dramática"… según el género del gato. */
    kindName(n) { return MV.gt(talkcat.voice(n).name, n.gender); },
    /** El argumento de las frases. */
    ctx(g, n, d) { return { g, p: g.p, n, d: d || {} }; },

    /** Gatos callejeros que adoptaste en esta vida (en partidas viejas, los que siguen en tus relaciones). */
    rescued(g) {
      const c = g.p.counters || {};
      if (c.gatosRescatados != null) return c.gatosRescatados;
      return MV.rels(g, 'mascota', true).filter(({ n }) => n.species === 'gato' && n.street).length;
    },
    /** Se llama justo después de sumar un gato callejero a tus relaciones. */
    noteRescue(g) {
      const p = g.p;
      p.counters = p.counters || {};
      p.counters.gatosRescatados = p.counters.gatosRescatados == null ? talkcat.rescued(g) : p.counters.gatosRescatados + 1;
    },

    /** Qué gato empieza a hablar y por cuál meta: lealtad, rescate o karma (en ese orden). */
    candidate(g) {
      const cs = cats(g);
      if (!cs.length) return null;
      const loyal = cs.filter((x) => (x.r.loyal || 0) >= 5).sort((a, b) => (b.r.loyal - a.r.loyal) || (b.r.rel - a.r.rel))[0];
      if (loyal) return { n: loyal.n, how: 'lealtad' };
      if (talkcat.rescued(g) >= 3) {
        let last = null;
        cs.forEach((x) => { if (x.n.street && (!last || (x.r.since || 0) >= (last.r.since || 0))) last = x; });
        if (last) return { n: last.n, how: 'rescate' };
      }
      if (g.p.karma >= 60) {
        let best = cs[0];
        cs.forEach((x) => { if (x.r.rel > best.r.rel) best = x; });
        return { n: best.n, how: 'karma' };
      }
      return null;
    },

    /** Ese gato empieza a hablar: personalidad al azar, vida más larga, logro y presentación. */
    grant(g, n, how) {
      const p = g.p;
      p.flags = p.flags || {};
      n.talk = { kind: U.pick(KINDS), since: p.age, how };
      p.flags.gatoHabla = n.id;
      n.lifespan = Math.max(U.int(24, 30), n.age + 3);
      MV.ach.unlock(g, 'gato_habla');
      MV.EV.info(g, { title: U.gw(n.gender, 'Tu gato habló', 'Tu gata habló'), icon: '🗨️', scene: 'hogar',
        text: `${n.first}: "${talkcat.voice(n).intro(talkcat.ctx(g, n))}"` });
      return n;
    },

    /** Cierre del año: cuenta la lealtad de cada gato y revisa si alguno empieza a hablar. */
    yearly(g) {
      const p = g.p;
      if (!p.alive) return;
      p.flags = p.flags || {};
      cats(g).forEach(({ r }) => { r.loyal = r.rel >= 80 ? (r.loyal || 0) + 1 : 0; });
      if (p.flags.gatoHabla) return;
      if (p.age < 6) return;
      const c = talkcat.candidate(g);
      if (c) talkcat.grant(g, c.n, c.how);
    }
  };

  MV.sys.talkcat = talkcat;
})(window.MV = window.MV || {});
