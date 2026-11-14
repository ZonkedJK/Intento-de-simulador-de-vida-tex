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

    /** Personas (no mascotas) vivas de tus relaciones: a ellas se las puede espiar. */
    spyable(g) { return MV.rels(g).filter(({ n }) => n.species === 'humano'); },

    /** Una travesura con tu gato: 'pescaderia', 'vecino' o 'espiar' (con el id de la persona). No es un delito. */
    prank(g, kind, targetId) {
      const p = g.p, n = talkcat.cat(g);
      if (!n) return 'Tu gato te mira en silencio. Hoy no hay travesuras.';
      const r = MV.relOf(g, n.id), who = n.first;
      if (kind === 'pescaderia') {
        if (U.chance(0.65)) {
          MV.fx.stat(g, 'happy', 6); r.rel = U.clamp(r.rel + 3, 0, 100);
          return U.pick([`${who} distrajo al pescadero con un maullido lastimero mientras tú te llevabas dos merluzas. Cenaron como reyes.`,
            `Entraron, salieron y nadie vio nada. ${who} dice que fue un trabajo limpio; el olor a pescado de tu mochila dice otra cosa.`]);
        }
        MV.fx.stat(g, 'karma', -1);
        if (p.age >= 18 && p.money >= 300) {
          MV.fx.money(g, -300);
          return `El pescadero los atrapó con las manos en la merluza. ${who} huyó por la ventana y a ti te tocó pagar una multa de ${U.money(300)}.`;
        }
        MV.fx.stat(g, 'happy', -3);
        return `El pescadero los corrió con una escoba durante tres cuadras. ${who} llegó ${U.gw(n.gender, 'primero', 'primera')} a casa y no piensa hablar del tema.`;
      }
      if (kind === 'vecino') {
        MV.fx.stat(g, 'happy', 5); MV.fx.stat(g, 'karma', -3);
        let msg = U.pick([`Mientras ${who} tiraba uno por uno los adornos de la repisa, tú le cambiaste los muebles de lugar al vecino. Tardó una semana en encontrar el control remoto.`,
          `${who} dejó huellas de barro por toda la cama del vecino y tú le pusiste sal en el azucarero. Arte puro.`]);
        if (U.chance(0.3)) {
          const nb = MV.newNPC(g, { age: U.int(25, 70) });
          MV.addRel(g, nb, 'enemigo', 15);
          msg += ` ${nb.first}, ${U.gw(nb.gender, 'el dueño', 'la dueña')} de casa, los vio salir por la ventana y juró venganza.`;
        }
        return msg;
      }
      if (kind === 'espiar') {
        const x = talkcat.spyable(g).find((y) => y.n.id === targetId);
        if (!x) return `${who} buscó por todo el barrio y no encontró a quién espiar. Volvió ${U.gw(n.gender, 'ofendido', 'ofendida')} y con hambre.`;
        const t = x.n.first, k = U.rand();
        if (k < 0.5) {
          x.r.rel = U.clamp(x.r.rel + 8, 0, 100);
          return `${who} siguió a ${t} toda la tarde y volvió con el informe: habla maravillas de ti cuando no estás. Ahora ${U.gw(x.n.gender, 'lo', 'la')} quieres un poco más.`;
        }
        if (k < 0.8) {
          x.r.rel = U.clamp(x.r.rel - 8, 0, 100);
          return `${who} escuchó a ${t} desde atrás de una maceta: dice que no te soporta y que cocinas peor. Ahora lo sabes.`;
        }
        x.r.rel = U.clamp(x.r.rel - 12, 0, 100); MV.fx.stat(g, 'happy', -2);
        return `${t} encontró a ${who} adentro de su bolso y a ti detrás de la cortina. No hubo forma de explicarlo.`;
      }
      return `${who} no entendió el plan. Tú tampoco.`;
    },

    /** Acciones propias del gato que habla, para su ficha. */
    actions(g, r, n) {
      if (!n || talkcat.cat(g) !== n) return [];
      return [
        { id: 'gato_consejo', icon: '🗨️', label: 'Pedirle consejo', sub: 'Te dice qué anda mal en tu vida', limit: 1, run: (gg) => talkcat.advise(gg) },
        { id: 'gato_travesura', icon: '😼', label: U.gw(n.gender, 'Planear algo con tu gato', 'Planear algo con tu gata'), sub: 'Una vez por año. Puede salir mal', limit: 1,
          when: (gg) => gg.p.age >= 12 && !gg.p.prison,
          opts: (gg) => [
            { id: 'pescaderia', icon: '🐟', label: 'Asaltar la pescadería', sub: `Pescado gratis… o una multa de ${U.money(300)}` },
            { id: 'vecino', icon: '🏚️', label: 'Desordenarle la casa al vecino', sub: 'Muy divertido, pero baja tu karma' }
          ].concat(talkcat.spyable(gg).map((x) => ({ id: 'espiar:' + x.n.id, icon: '🕵️', label: `Espiar a ${x.n.first}`, sub: `${MV.relLabel(x.r.type, x.n)}. Puedes enterarte de algo bueno, de algo feo, o que te descubran` }))),
          run: (gg, o) => { const [kind, id] = String(o).split(':'); return talkcat.prank(gg, kind, id); } }
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

    /** Sus últimas palabras, en lugar del aviso común de las mascotas. */
    farewell(g, n) {
      MV.EV.info(g, { title: 'Últimas palabras', icon: '🕯️', scene: 'cementerio',
        text: talkcat.say(n, talkcat.voice(n).farewell(talkcat.ctx(g, n))) });
      MV.ach.unlock(g, 'ultimas_palabras');
    },

    /** Lo que dice cuando lo das en adopción. */
    adopted(g, n) { return talkcat.say(n, talkcat.voice(n).adopted(talkcat.ctx(g, n))); },

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
