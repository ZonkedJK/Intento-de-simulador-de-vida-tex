/* Mil Vidas — dinero sucio: una bolsa aparte que hay que lavar, con riesgo de investigación. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const METHODS = {
    negocio: { icon: '🏪', label: 'Pasarlo por tu negocio', fee: 0.10, risk: 0.05, cap: 50000 },
    casino: { icon: '🎰', label: 'Lavar en el casino', fee: 0.25, risk: 0.10, cap: Infinity },
    contador: { icon: '🧮', label: 'Contador "creativo"', fee: 0.20, risk: 0.15, cap: 200000 },
    inmueble: { icon: '🏘️', label: 'Comprar y vender un inmueble', fee: 0.15, risk: 0.20, cap: 500000 }
  };
  const pct = (x) => `${Math.round(x * 100)} %`;
  const owned = (p) => (p.business ? 1 : 0) + (p.companies || []).length;

  const dirty = {
    METHODS,

    add(g, amount) {
      const p = g.p;
      p.dirty = Math.max(0, Math.round((p.dirty || 0) + amount));
    },

    /** Cuánto se lava como máximo con ese método. */
    limit(g, method) {
      const M = METHODS[method];
      if (!M) return 0;
      return method === 'negocio' ? M.cap * owned(g.p) : M.cap;
    },

    /** Motivo para no poder lavar (o null). */
    why(g, method) {
      const p = g.p;
      if (!METHODS[method]) return 'Ese método no existe.';
      if (p.prison) return 'Desde la cárcel no se lava nada. Bueno, la ropa sí.';
      if (!(p.dirty > 0)) return 'No tienes dinero sucio para lavar.';
      if (dirty.limit(g, method) <= 0) return 'Necesitas un negocio o una empresa propia para pasar el dinero por ahí.';
      return null;
    },

    launder(g, method) {
      const why = dirty.why(g, method);
      if (why) return why;
      const p = g.p, M = METHODS[method];
      const amt = Math.min(p.dirty, dirty.limit(g, method));
      const fee = Math.round(amt * M.fee), clean = amt - fee;
      p.dirty -= amt;
      MV.fx.money(g, clean);
      let msg = `${M.icon} Lavaste ${U.money(amt)}: te quedaron ${U.money(clean)} limpios (comisión ${U.money(fee)}).`;
      if (U.chance(M.risk) && !dirty.pending(g)) {
        MV.EV.push(g, 'investigacion_lavado', {});
        msg += ' Un empleado del banco te miró raro y anotó algo.';
      }
      return msg;
    },

    /** Ya hay una investigación en la cola. */
    pending(g) { return g.queue.some((q) => q.id === 'investigacion_lavado'); },

    actions(g) {
      return Object.keys(METHODS).map((k) => {
        const M = METHODS[k];
        const cap = k === 'negocio' ? `hasta ${U.money(M.cap)} por negocio` : M.cap === Infinity ? 'todo de una vez' : `hasta ${U.money(M.cap)}`;
        return { id: 'lavar_' + k, icon: M.icon, label: M.label, sub: `${cap} · comisión ${pct(M.fee)} · riesgo ${pct(M.risk)}`, limit: 1,
          check: (gg) => dirty.why(gg, k), run: (gg) => dirty.launder(gg, k) };
      });
    },

    /** Con mucho sucio, alguien empieza a hacer preguntas. */
    yearly(g) {
      const p = g.p;
      if (p.prison || !(p.dirty > 50000) || dirty.pending(g)) return;
      if (U.chance(Math.min(0.35, p.dirty / 1000000))) MV.EV.push(g, 'investigacion_lavado', {});
    },

    /** Al morir: la policía lo encuentra y nadie lo hereda. */
    seizeAtDeath(g) {
      const p = g.p;
      if (p.dirty > 0) MV.log(g, `La policía encontró ${U.money(p.dirty)} escondidos.`, '🚔');
      p.dirty = 0;
    }
  };

  MV.sys.dirty = dirty;
})(window.MV = window.MV || {});
