/* Mil Vidas — la personalidad cambia cuánto te afecta lo que haces con alguien. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  /** Marca de "esta acción ya tuvo su reacción propia" (la ponen las especiales). */
  let fired = false;

  const traitsOf = (n) => (n && Array.isArray(n.traits) ? n.traits : []);

  /** De un rasgo: el número y el rasgo más alejados de 1 entre los tags que coinciden y '*'. */
  function pickOne(id, tags, sign) {
    const info = MV.TRAIT_INFO[id];
    const tab = info && (sign > 0 ? info.up : info.down);
    if (!tab) return 1;
    let best = 1;
    const consider = (k) => { const v = tab[k]; if (typeof v === 'number' && Math.abs(v - 1) > Math.abs(best - 1)) best = v; };
    consider('*');
    (tags || []).forEach(consider);
    return best;
  }

  const persona = {
    has(n, id) { return traitsOf(n).includes(id); },

    /** El factor de la persona para esos tags: un número por rasgo, multiplicados, entre 0,5 y 2. */
    factor(n, tags, sign) {
      if (!tags || !tags.length) return 1;
      let f = 1;
      traitsOf(n).forEach((id) => { f *= pickOne(id, tags, sign); });
      return U.clamp(f, 0.5, 2);
    },

    /** El rasgo cuyo número estuvo más lejos de 1, o null. */
    mainTrait(n, tags, sign) {
      let best = null, far = 0;
      traitsOf(n).forEach((id) => {
        const d = Math.abs(pickOne(id, tags, sign) - 1);
        if (d > far) { far = d; best = id; }
      });
      return best;
    },

    /** Marca que la acción ya tuvo su reacción propia. */
    fire() { fired = true; },

    /** Una línea de reacción del rasgo (lado 'up' o 'down'), o ''. */
    line(id, side, n) {
      const t = MV.TRAIT_INFO[id], arr = t && t.lines && t.lines[side];
      if (!arr || !arr.length) return '';
      return U.pick(arr)(n);
    },

    /** Ajusta el cambio de `r.rel` que hizo la acción según la personalidad. Devuelve una línea o ''. */
    adjust(g, r, n, actionId, before) {
      const was = fired;
      fired = false;
      if (was || !r || !n || typeof before !== 'number') return '';
      const d = r.rel - before;
      if (!d) return '';
      const tags = MV.ACTION_TAGS[actionId] || [];
      if (!tags.length) return '';
      if (d < 0) {
        const flip = traitsOf(n).find((id) => { const t = MV.TRAIT_INFO[id]; return t && (t.flip || []).some((x) => tags.includes(x)); });
        if (flip) {
          r.rel = U.clamp(before + 2, 0, 100);
          return U.chance(0.5) ? persona.line(flip, 'up', n) : '';
        }
      }
      const sign = d > 0 ? 1 : -1;
      const f = persona.factor(n, tags, sign);
      if (f === 1) return '';
      r.rel = U.clamp(before + Math.round(d * f), 0, 100);
      const main = persona.mainTrait(n, tags, sign);
      if (!main || !U.chance(0.5)) return '';
      return persona.line(main, sign > 0 ? 'up' : 'down', n);
    },

    /** Devuelve la misma acción con un `run` que aplica el ajuste y suma la línea de reacción. */
    wrap(g, r, n, action) {
      if (!action || typeof action.run !== 'function' || !n || n.species !== 'humano') return action;
      const orig = action.run;
      action.run = function () {
        const before = r.rel;
        fired = false;
        const out = orig.apply(this, arguments);
        const line = persona.adjust(g, r, n, action.id, before);
        return line && typeof out === 'string' ? `${out} ${line}` : out;
      };
      return action;
    },

    /** Desde qué relación perdona esta persona un recuerdo malo. */
    forgiveAt(n) {
      let best = 70, any = false;
      traitsOf(n).forEach((id) => {
        const t = MV.TRAIT_INFO[id];
        if (t && typeof t.forgive === 'number' && (!any || t.forgive > best)) { best = t.forgive; any = true; }
      });
      return best;
    },

    /** El peso de sus recuerdos malos al sortear venganzas. */
    spite(n) { return traitsOf(n).some((id) => MV.TRAIT_INFO[id] && MV.TRAIT_INFO[id].spite) ? 1.5 : 1; }
  };

  MV.sys.persona = persona;
})(window.MV = window.MV || {});
