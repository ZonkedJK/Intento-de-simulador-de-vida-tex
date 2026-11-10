/* Mil Vidas — vivir mejor: bienestar, hobbies con racha y rutina anual de ejercicio y dieta. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  MV.HOBBIES = {
    jardineria: { name: 'Jardinería', icon: '🪴', lines: ['Tus tomates salieron con forma de corazón.', 'Hablaste con tus plantas. Te escucharon mejor que tu familia.'] },
    pesca: { name: 'Pesca', icon: '🎣', lines: ['Pescaste una bota. Y después una trucha. Buen día.', 'Cuatro horas sin pescar nada y la mejor siesta del año.'] },
    yoga: { name: 'Yoga', icon: '🧘', lines: ['Lograste tocarte los pies. Bueno, casi.', 'Hiciste la postura del árbol sin caerte. El profe aplaudió.'] },
    cocina: { name: 'Cocina', icon: '🍳', lines: ['Hiciste pan casero. Duro como piedra, pero tuyo.', 'Tu salsa secreta ya tiene fans en la familia.'] },
    lectura: { name: 'Lectura', icon: '📚', lines: ['Terminaste un libro de 800 páginas. Ahora usas palabras raras.', 'Leíste en una plaza. Te sentiste en una película francesa.'] },
    fotografia: { name: 'Fotografía', icon: '📷', lines: ['Sacaste una foto de un atardecer que parece de revista.', 'Fotografiaste a una paloma con mucha personalidad.'] }
  };

  /** Rutina anual: costo por año y efectos. Los menores no pagan (pagan sus padres). */
  MV.ROUTINES = {
    exercise: {
      ninguno: { name: 'Nada de ejercicio', cost: 0, fx: {} },
      ligero: { name: 'Ligero (caminar, bici)', cost: 300, fx: { health: 2, looks: 1, stress: -2 } },
      intenso: { name: 'Intenso (gimnasio 5 veces por semana)', cost: 1200, fx: { health: 4, looks: 2, stress: 1, happy: -1 } }
    },
    diet: {
      libre: { name: 'Libre (lo que venga)', cost: 0, fx: { happy: 1 } },
      equilibrada: { name: 'Equilibrada', cost: 500, fx: { health: 2 } },
      estricta: { name: 'Estricta (pollo y brócoli)', cost: 1500, fx: { health: 3, looks: 1, happy: -2 } }
    }
  };
  const CLOSE = ['padre', 'pareja', 'conyuge', 'hijo', 'amigo'];

  const W = {
    /** Bienestar 0–100: 35 % felicidad, 30 % salud, 20 % calma (100 − estrés) y 15 % vínculos cercanos (50 si no hay). */
    score(g) {
      const p = g.p;
      const close = MV.rels(g, CLOSE).filter(({ n }) => n.species === 'humano');
      const rel = close.length ? close.reduce((s, { r }) => s + r.rel, 0) / close.length : 50;
      const score = Math.round(U.clamp(0.35 * p.stats.happy + 0.3 * p.stats.health + 0.2 * (100 - p.stress) + 0.15 * rel, 0, 100));
      const label = score >= 80 ? 'Floreciendo' : score >= 60 ? 'Bien' : score >= 40 ? 'Regular' : 'Mal';
      return { score, label };
    },

    hobby(g, k) {
      const p = g.p, H = MV.HOBBIES[k];
      if (!H) return 'Ese hobby no existe (todavía).';
      p.hobbies = p.hobbies || {};
      const h = p.hobbies[k] || (p.hobbies[k] = { streak: 0, last: null });
      if (h.last !== p.age) { h.streak = h.last === p.age - 1 ? h.streak + 1 : 1; h.last = p.age; }
      MV.fx.stat(g, 'stress', -(2 + Math.min(h.streak, 10)));
      MV.fx.stat(g, 'happy', U.int(2, 4));
      if (k === 'cocina') MV.fx.stat(g, 'health', 1);
      if (k === 'lectura') MV.fx.stat(g, 'smarts', 1);
      if (k === 'yoga') MV.fx.stat(g, 'health', 1);
      const streak = h.streak > 1 ? ` Racha: ${h.streak} años seguidos.` : '';
      return `${H.icon} ${U.pick(H.lines)}${streak}`;
    },

    /** Una racha sobrevive si practicaste el año anterior; si no, vuelve a cero. */
    hobbyYearly(g) {
      const p = g.p;
      Object.values(p.hobbies || {}).forEach((h) => { if (h.last == null || h.last < p.age - 1) h.streak = 0; });
    },

    setRoutine(g, part, value) {
      const R = MV.ROUTINES[part];
      if (!R || !R[value]) return 'Esa rutina no existe (todavía).';
      g.p.routine = Object.assign({ exercise: 'ninguno', diet: 'libre' }, g.p.routine, { [part]: value });
      return `${part === 'exercise' ? 'Ejercicio' : 'Dieta'}: ${R[value].name.toLowerCase()}. Se aplica cada año.`;
    },

    routineYearly(g) {
      const p = g.p, r = p.routine || {};
      ['exercise', 'diet'].forEach((part) => {
        const R = MV.ROUTINES[part][r[part]];
        if (!R) return;
        if (R.cost && p.age >= 18) {
          if (p.money < R.cost) return;
          MV.fx.money(g, -R.cost);
        }
        Object.keys(R.fx).forEach((k) => MV.fx.stat(g, k, R.fx[k]));
      });
    },

    yearly(g) {
      if (!g.p.alive) return;
      W.hobbyYearly(g);
      if (!g.p.prison) W.routineYearly(g);
    }
  };
  MV.sys.wellbeing = W;
})(window.MV = window.MV || {});
