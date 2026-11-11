/* Mil Vidas — motor de eventos (definición, elegibilidad, cola y decisiones). */
(function (MV) {
  'use strict';
  const U = MV.U;

  const EV = {
    list: [],
    byId: {},

    /**
     * Define un evento.
     *  id, age:[min,max], w (peso o función), once, cd (enfriamiento en años),
     *  prison (true=solo en cárcel, 'any'=siempre), when(g), target(g)->id,
     *  icon, scene, title, text (string con {claves} o función(g,ctx)),
     *  ctx(g)->{datos extra del contexto}, choices:[{t, eff, when}]  ó  auto: efecto,
     *  modal (mostrar ventana aunque sea automático).
     */
    def(d) {
      if (!d || !d.id) throw new Error('Evento sin id');
      if (EV.byId[d.id]) throw new Error('Evento duplicado: ' + d.id);
      d.age = d.age || [0, 130];
      d.w = d.w == null ? 1 : d.w;
      d.cd = d.cd == null ? 6 : d.cd;
      d.scene = d.scene || 'hogar';
      d.icon = d.icon || '📖';
      EV.list.push(d);
      EV.byId[d.id] = d;
      return d;
    },

    /** Devuelve el contexto si el evento puede ocurrir, o null. */
    eligible(g, d) {
      const p = g.p;
      if (p.age < d.age[0] || p.age > d.age[1]) return null;
      const inPrison = !!p.prison;
      if (d.prison === true && !inPrison) return null;
      if (!d.prison && inPrison) return null;
      const last = g.evDone[d.id];
      if (last != null && (d.once || p.age - last < d.cd)) return null;
      try {
        if (d.when && !d.when(g)) return null;
        const ctx = {};
        if (d.target) {
          const t = d.target(g);
          if (!t) return null;
          ctx.target = t;
        }
        if (d.ctx) Object.assign(ctx, d.ctx(g));
        return ctx;
      } catch (e) {
        if (MV.debug) console.error('Error en condición de evento', d.id, e);
        return null;
      }
    },

    weight(g, d) {
      return typeof d.w === 'function' ? d.w(g) : d.w;
    },

    text(g, d, ctx) {
      const t = typeof d.text === 'function' ? d.text(g, ctx) : d.text;
      return MV.fx.tpl(g, t || '', ctx);
    },

    /** Elige y dispara los eventos del año. */
    runYear(g) {
      const p = g.p;
      // Consecuencias programadas en años anteriores.
      if (g.later && g.later.length) {
        const due = g.later.filter((l) => l.at <= p.age);
        g.later = g.later.filter((l) => l.at > p.age);
        due.forEach((l) => {
          const d = EV.byId[l.id];
          if (!d) return;
          if (d.prison !== 'any' && !!d.prison !== !!p.prison) {
            // Aplazar mientras la situación no encaje (p. ej. estás en la cárcel).
            l.tries = (l.tries || 0) + 1;
            if (l.tries < 10) { l.at = p.age + 1; g.later.push(l); }
            return;
          }
          if (d.when && !d.when(g)) return;
          EV.fire(g, d, l.ctx || {});
        });
      }
      if (p.age === 0) return;
      const pool = [];
      EV.list.forEach((d) => {
        if (d.manual) return;
        const ctx = EV.eligible(g, d);
        if (ctx) pool.push({ d, ctx, w: EV.weight(g, d) });
      });
      const nChoice = p.age < 3 ? (U.chance(0.6) ? 1 : 0) : U.pickW([0, 1, 2], (k) => [12, 50, 38][k]);
      const nAuto = U.pickW([0, 1, 2], (k) => [30, 45, 25][k]);
      const pickFrom = (arr, n) => {
        const out = [];
        let a = arr.slice();
        for (let i = 0; i < n && a.length; i++) {
          const x = U.pickW(a, 'w');
          if (!x) break;
          out.push(x);
          a = a.filter((y) => y !== x);
        }
        return out;
      };
      pickFrom(pool.filter((x) => x.d.choices), nChoice).forEach((x) => EV.fire(g, x.d, x.ctx));
      pickFrom(pool.filter((x) => !x.d.choices), nAuto).forEach((x) => EV.fire(g, x.d, x.ctx));
    },

    /** Dispara un evento ya elegido: a la cola si tiene decisiones, aplicado si es automático. */
    fire(g, d, ctx, front) {
      g.evDone[d.id] = g.p.age;
      if (d.choices) {
        const item = { id: d.id, ctx: ctx || {} };
        if (front) g.queue.unshift(item); else g.queue.push(item);
        return;
      }
      MV.fx.begin();
      const res = MV.fx.apply(g, d.auto, ctx);
      const text = EV.text(g, d, ctx); // después del efecto: así {amount} ya está calculado
      MV.fx.end();
      const full = (text + (res ? ' ' + res : '')).trim();
      MV.log(g, full, d.icon, d.tone);
      if (d.modal) g.queue.push({ info: { title: d.title || '', text: full, icon: d.icon, scene: d.scene } });
    },

    /** Encola un evento por id sin comprobar elegibilidad (lo usan los sistemas). */
    push(g, id, ctx, front) {
      const d = EV.byId[id];
      if (!d) throw new Error('Evento desconocido: ' + id);
      EV.fire(g, d, ctx || {}, front);
    },

    /** Programa una consecuencia dentro de `years` años. */
    later(g, id, years, ctx) {
      g.later = g.later || [];
      g.later.push({ id, at: g.p.age + Math.max(1, years), ctx: ctx || {} });
    },

    /** Ventana informativa (y entrada en el diario). */
    info(g, o, noLog) {
      if (!noLog) MV.log(g, o.text, o.icon, o.tone);
      g.queue.push({ info: { title: o.title || '', text: o.text, icon: o.icon || '📖', scene: o.scene || 'hogar' } });
    },

    /** Prepara la vista del primer elemento de la cola. */
    view(g) {
      const item = g.queue[0];
      if (!item) return null;
      if (item.info) return { info: true, ...item.info, choices: [{ label: 'Continuar', i: 0 }] };
      const d = EV.byId[item.id];
      const ctx = item.ctx || {};
      if (!d || !EV.stillValid(g, d, ctx)) { g.queue.shift(); return EV.view(g); }
      const choices = d.choices.map((c, i) => ({ c, i }))
        .filter((x) => !x.c.when || x.c.when(g, ctx))
        .map((x) => {
          const o = { label: MV.fx.tpl(g, typeof x.c.t === 'function' ? x.c.t(g, ctx) : x.c.t, ctx), i: x.i };
          if (x.c.sub != null) o.sub = MV.fx.tpl(g, typeof x.c.sub === 'function' ? x.c.sub(g, ctx) : x.c.sub, ctx);
          return o;
        });
      const t = ctx.target ? MV.person(g, ctx.target) : null;
      return {
        id: d.id, title: MV.fx.tpl(g, typeof d.title === 'function' ? d.title(g, ctx) : (d.title || ''), ctx),
        text: item.txt || (item.txt = EV.text(g, d, ctx)), icon: d.icon, scene: typeof d.scene === 'function' ? d.scene(g, ctx) : d.scene,
        target: t, choices
      };
    },

    /** Un evento en cola puede quedar obsoleto (p. ej. te despidieron antes de verlo). */
    stillValid(g, d, ctx) {
      if (ctx.target) {
        const t = MV.person(g, ctx.target);
        if (!t || !t.alive) return false;
      }
      if (d.manual) return true;
      if (!!d.prison !== !!g.p.prison && d.prison !== 'any') return false;
      try { return !d.when || !!d.when(g); } catch (e) { return false; }
    },

    /** Resuelve la decisión `i` del primer elemento de la cola. */
    choose(g, i) {
      const item = g.queue.shift();
      if (!item) return null;
      if (item.info) return { msg: '', deltas: [], info: true };
      const d = EV.byId[item.id];
      const c = d && d.choices[i];
      if (!c) return { msg: '', deltas: [] };
      const ctx = item.ctx || {};
      MV.fx.begin();
      let msg = '';
      try {
        msg = MV.fx.apply(g, c.eff, ctx);
      } finally {
        var deltas = MV.fx.end();
      }
      const label = MV.fx.tpl(g, typeof c.t === 'function' ? c.t(g, ctx) : c.t, ctx);
      MV.log(g, msg || label, d.icon, d.tone);
      return { msg: msg || label, deltas, icon: d.icon, title: label };
    }
  };

  MV.EV = EV;
  MV.ev = (d) => EV.def(d);

  /** Ayudantes para escribir eventos de forma compacta. */
  MV.EVH = {
    /** target(): id de una relación viva al azar de esos tipos (y filtro opcional). */
    rel(types, filter) {
      return (g) => {
        const xs = MV.rels(g, types).filter((x) => !filter || filter(x.n, x.r, g));
        const x = U.pick(xs);
        return x ? x.n.id : null;
      };
    },
    has(types, filter) {
      return (g) => MV.rels(g, types).some((x) => !filter || filter(x.n, x.r, g));
    },
    t: (g, ctx) => MV.person(g, ctx.target),
    school: (g) => !!g.p.edu.stage && !MV.sys.edu.inHigher(g.p),
    job: (g) => !!g.p.job && g.p.job.type === 'full',
    anyJob: (g) => !!g.p.job,
    partner: (g) => !!MV.partner(g),
    /** Cambia la relación con ctx.target. */
    bump(g, ctx, d) { const r = MV.relOf(g, ctx.target); if (r) r.rel = U.clamp(r.rel + d, 0, 100); }
  };
})(window.MV = window.MV || {});
