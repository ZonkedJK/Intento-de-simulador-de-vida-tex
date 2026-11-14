/* Mil Vidas — el gato que habla: uno de tus gatos aprende a hablar al cumplir una meta (uno por vida). */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const KINDS = ['filosofo', 'diva', 'aristocrata'];
  /** Relaciones cuya muerte el gato comenta. */
  const CLOSE = ['padre', 'hijo', 'nieto', 'hermano', 'abuelo', 'pareja', 'conyuge', 'mascota'];
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
      n.talk = { kind: U.pick(KINDS), since: p.age, how, snap: talkcat.snapshot(g) };
      p.flags.gatoHabla = n.id;
      n.lifespan = Math.max(U.int(24, 30), n.age + 3);
      MV.ach.unlock(g, 'gato_habla');
      MV.EV.info(g, { title: U.gw(n.gender, 'Tu gato habló', 'Tu gata habló'), icon: '🗨️', scene: 'hogar',
        text: talkcat.say(n, talkcat.voice(n).intro(talkcat.ctx(g, n))) });
      return n;
    },

    /** El riesgo más grande de tu vida hoy: { id, d } o null. El orden es la prioridad. */
    risk(g) {
      const p = g.p;
      if (p.prison) return { id: 'preso', d: { years: p.prison.left } };
      if (p.wanted > 0) return { id: 'profugo', d: { years: p.wanted } };
      const grave = (p.conds || []).map((c) => MV.CONDITIONS[c.id]).find((C) => C && (C.drain[1] >= 8 || C.urgent));
      if (p.stats.health < 35 || grave) return { id: 'salud', d: { cond: grave ? grave.name.toLowerCase() : null } };
      const dues = U.sum((p.loans || []).filter((l) => l.start <= p.age && l.left > 0), (l) => l.pay || 0);
      if (p.money < 0 || (dues > 0 && dues > p.money)) return { id: 'deudas', d: { amount: dues > 0 ? dues : -p.money } };
      if (p.dirty > 50000) return { id: 'sucio', d: { amount: p.dirty } };
      const x = MV.partner(g);
      if (x && x.r.rel < 35) return { id: 'pareja', d: { name: x.n.first } };
      if (p.job && p.job.perf < 30) return { id: 'trabajo', d: { title: MV.sys.career.title(p) } };
      if (p.stress > 70) return { id: 'estres', d: {} };
      if (p.age >= 50 && !MV.sys.insurance.covered(g, 'salud')) return { id: 'seguro', d: {} };
      return null;
    },

    /** Lo que dice el gato, con su nombre delante. */
    say(n, line) { return `${n.first}: "${line}"`; },

    /** El consejo del año: el riesgo más grande, o una frase suya si todo va bien. */
    advise(g) {
      const n = talkcat.cat(g);
      if (!n) return 'Tu gato te mira en silencio. Hoy no tiene nada que decir.';
      const V = talkcat.voice(n), r = talkcat.risk(g);
      const line = r ? V.advice[r.id](talkcat.ctx(g, n, r.d)) : U.pick(V.idle)(talkcat.ctx(g, n));
      return talkcat.say(n, line);
    },

    /** Acciones propias del gato que habla, para su ficha. */
    actions(g, r, n) {
      if (!n || talkcat.cat(g) !== n) return [];
      return [
        { id: 'gato_consejo', icon: '🗨️', label: 'Pedirle consejo', sub: 'Te dice qué anda mal en tu vida', limit: 1, run: (gg) => talkcat.advise(gg) }
      ];
    },

    /** Foto de tu vida al cerrar el año, para saber qué cambió al año siguiente. */
    snapshot(g) {
      const p = g.p, c = p.counters || {};
      return {
        prison: !!p.prison,
        dead: (p.rels || []).filter((r) => CLOSE.includes(r.type) && g.people[r.id] && !g.people[r.id].alive).map((r) => r.id),
        bodas: c.bodas || 0, divorcios: c.divorcios || 0,
        hijos: MV.rels(g, 'hijo', true).map(({ n }) => n.id),
        despidos: (p.jobs || []).filter((j) => j.why === 'despido').length,
        job: p.job ? p.job.id : null, level: p.job ? p.job.level : -1,
        casas: (p.assets || []).filter((a) => a.type === 'casa').length
      };
    },

    /** Lo más notable que pasó desde la foto anterior: { id, d } o null. El orden es la prioridad. */
    fact(g, old) {
      const now = talkcat.snapshot(g);
      old = old || now;
      if (now.prison && !old.prison) return { id: 'carcel', d: {} };
      const gone = now.dead.find((id) => !(old.dead || []).includes(id));
      if (gone) { const n = g.people[gone], r = MV.relOf(g, gone); return { id: 'muerte', d: { name: n.first, label: MV.relLabel(r.type, n).toLowerCase() } }; }
      if (now.bodas > (old.bodas || 0)) { const s = MV.rels(g, 'conyuge')[0]; return { id: 'boda', d: { name: s ? s.n.first : null } }; }
      if (now.divorcios > (old.divorcios || 0)) return { id: 'divorcio', d: {} };
      const kid = now.hijos.find((id) => !(old.hijos || []).includes(id));
      if (kid) return { id: 'hijo', d: { name: g.people[kid].first } };
      if (now.despidos > (old.despidos || 0)) return { id: 'despido', d: {} };
      if (now.job && now.job === old.job && now.level > old.level) return { id: 'ascenso', d: { title: MV.sys.career.title(g.p) } };
      if (now.casas > (old.casas || 0)) return { id: 'casa', d: {} };
      return null;
    },

    /** Como mucho un comentario por año en el diario: el hecho más notable o, a veces, una frase suya. */
    comment(g) {
      const n = talkcat.cat(g);
      if (!n) return;
      const V = talkcat.voice(n), old = n.talk.snap;
      let line = null;
      if (old) {
        const f = talkcat.fact(g, old);
        if (f) line = V.facts[f.id](talkcat.ctx(g, n, f.d));
        else if (U.chance(0.25)) line = U.pick(V.idle)(talkcat.ctx(g, n));
      }
      n.talk.snap = talkcat.snapshot(g);
      if (line) MV.log(g, talkcat.say(n, line), '🐈');
    },

    /** Cierre del año: cuenta la lealtad de cada gato y revisa si alguno empieza a hablar. */
    yearly(g) {
      const p = g.p;
      if (!p.alive) return;
      p.flags = p.flags || {};
      cats(g).forEach(({ r }) => { r.loyal = r.rel >= 80 ? (r.loyal || 0) + 1 : 0; });
      if (p.flags.gatoHabla) { talkcat.comment(g); return; }
      if (p.age < 6) return;
      const c = talkcat.candidate(g);
      if (c) talkcat.grant(g, c.n, c.how);
    }
  };

  MV.sys.talkcat = talkcat;
})(window.MV = window.MV || {});
