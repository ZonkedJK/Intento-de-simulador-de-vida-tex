/* Mil Vidas — modo desafío: se revisa cada año; cumplido o perdido, avisa una sola vez. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};
  const def = (id) => MV.CHALLENGES.find((c) => c.id === id) || null;

  const challenge = {
    /** Elige el desafío de la partida (o ninguno si el id no existe). */
    start(g, id) {
      g.challenge = def(id) ? { id, done: false, failed: false, startGen: g.generation || 1, countries: g.p ? [g.p.country] : [] } : null;
      return g.challenge;
    },

    status(g) {
      const c = g && g.challenge, D = c && def(c.id);
      return D ? { def: D, done: !!c.done, failed: !!c.failed } : null;
    },

    /** Revisa el desafío: anota el país, y si se cumplió o se perdió avisa una vez. */
    yearly(g) {
      const c = g.challenge, D = c && def(c.id);
      if (!D || c.done || c.failed) return;
      c.countries = c.countries || [];
      if (g.p.country && !c.countries.includes(g.p.country)) c.countries.push(g.p.country);
      if (D.check(g)) {
        c.done = true;
        MV.ach.unlock(g, 'desafio');
        const glob = MV.global();
        glob.challenges = (glob.challenges || 0) + 1;
        MV.saveGlobal();
        MV.EV.info(g, { title: '¡Desafío cumplido!', icon: '🎯', scene: 'escenario', tone: 'good', text: `${D.icon} ${D.name}: lo lograste. ${U.pick(['Que lo cuenten tus nietos.', 'Nadie te lo va a creer.', 'Ya puedes presumirlo en cada cena familiar.'])}` });
      } else if (D.fail && D.fail(g)) {
        c.failed = true;
        MV.EV.info(g, { title: 'Desafío perdido', icon: '🎯', scene: 'hogar', tone: 'bad', text: `${D.icon} ${D.name}: ya no se puede cumplir en esta vida. Siempre queda la próxima.` });
      }
    },

    /** Texto corto para el resumen y la ficha. */
    label(g) {
      const s = challenge.status(g);
      if (!s) return null;
      return `${s.def.icon} ${s.def.name} (${s.done ? 'cumplido' : s.failed ? 'perdido' : 'sin cumplir'})`;
    }
  };
  MV.sys.challenge = challenge;
})(window.MV = window.MV || {});
