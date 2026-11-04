/* Mil Vidas — salud: envejecimiento, enfermedades, adicciones, estrés y muerte. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const health = {
    has(g, id) { return g.p.conds.some((c) => c.id === id); },

    add(g, id) {
      const C = MV.CONDITIONS[id];
      if (!C || health.has(g, id)) return false;
      g.p.conds.push({ id, since: g.p.age });
      if (C.drain[1] >= 8 && MV.EV && g.p.alive) {
        MV.EV.info(g, { title: 'Diagnóstico', text: `Te diagnosticaron: ${C.name}. Es grave: trátala en Actividades → Salud cuanto antes.`, icon: C.icon, scene: 'hospital', tone: 'bad' });
      } else MV.log(g, `Te diagnosticaron: ${C.name}.`, C.icon, 'bad');
      return true;
    },

    remove(g, id) { g.p.conds = g.p.conds.filter((c) => c.id !== id); },

    /** Intento de tratamiento. tier: medico | hospital | curandero | experimental */
    treat(g, id, tier) {
      const C = MV.CONDITIONS[id];
      if (!C || !health.has(g, id)) return 'No tienes esa condición.';
      const T = health.TIERS[tier] || health.TIERS.medico;
      const cost = g.p.age < 18 ? 0 : Math.round(C.cost * T.cost); // a los menores les pagan sus padres
      MV.fx.money(g, -cost);
      const ok = U.chance(U.clamp(C.cure + T.bonus, 0.02, 0.99));
      if (ok) {
        health.remove(g, id);
        MV.fx.stat(g, 'happy', 6);
        MV.fx.stat(g, 'health', U.int(3, 10));
        return `${T.okText} Te curaste de ${C.name.toLowerCase()}${cost ? ` (${U.money(cost)})` : ''}.`;
      }
      if (tier === 'curandero' && U.chance(0.3)) {
        MV.fx.stat(g, 'health', -U.int(2, 8));
        return `El curandero te frotó un huevo por la espalda, cobró ${U.money(cost)} y desapareció. Te sientes peor.`;
      }
      if (tier === 'experimental' && U.chance(0.25)) {
        MV.fx.stat(g, 'health', -U.int(10, 25));
        return `El tratamiento experimental tuvo "efectos secundarios no documentados". Pagaste ${U.money(cost)}.`;
      }
      return `El tratamiento no funcionó esta vez${cost ? ` (${U.money(cost)})` : ''}.`;
    },

    TIERS: {
      curandero: { name: 'Curandero del barrio', icon: '🪬', cost: 0.1, bonus: -0.55, okText: 'Contra todo pronóstico, el curandero acertó.' },
      medico: { name: 'Médico de cabecera', icon: '🩺', cost: 1, bonus: 0, okText: 'El médico dio en el clavo.' },
      hospital: { name: 'Hospital privado', icon: '🏥', cost: 3, bonus: 0.15, okText: 'El hospital privado hizo magia (y una factura enorme).' },
      experimental: { name: 'Tratamiento experimental', icon: '🧪', cost: 6, bonus: 0.3, okText: 'El tratamiento experimental funcionó. Quizás te pongan tu nombre en un paper.' }
    },

    yearly(g) {
      const p = g.p;
      const S = p.stats;
      const age = p.age;
      // Envejecimiento
      if (age < 18) MV.fx.stat(g, 'health', U.int(0, 3));
      else if (age >= 80) MV.fx.stat(g, 'health', -U.int(2, 5));
      else if (age >= 65) MV.fx.stat(g, 'health', -U.int(1, 3));
      else if (age >= 45) MV.fx.stat(g, 'health', -U.int(0, 2));
      else if (!p.conds.length && S.health < 90) MV.fx.stat(g, 'health', U.int(0, 2));
      if (age >= 35 && age < 60) MV.fx.stat(g, 'looks', -U.int(0, 1));
      else if (age >= 60) MV.fx.stat(g, 'looks', -U.int(0, 2));
      if (age >= 3 && age <= 22) MV.fx.stat(g, 'smarts', U.int(0, 2));
      if (age >= 76) MV.fx.stat(g, 'smarts', -U.int(0, 2));
      if (age >= 11 && age <= 16) MV.fx.stat(g, 'looks', U.int(-3, 3)); // pubertad: lotería
      // La felicidad tiende lentamente a la media.
      MV.fx.stat(g, 'happy', Math.round((55 - S.happy) * 0.06));

      // Enfermedades activas
      p.conds.slice().forEach((c) => {
        const C = MV.CONDITIONS[c.id];
        if (!C) { health.remove(g, c.id); return; }
        MV.fx.stat(g, 'health', -U.int(C.drain[0], C.drain[1]));
        if (C.happy) MV.fx.stat(g, 'happy', C.happy);
        if (C.stress) MV.fx.stat(g, 'stress', C.stress);
        if (C.smarts) MV.fx.stat(g, 'smarts', C.smarts);
        if (U.chance(C.heal)) {
          health.remove(g, c.id);
          MV.log(g, `Te recuperaste de ${C.name.toLowerCase()}.`, '💪', 'good');
        } else if (C.urgent && age - c.since >= 1) {
          MV.fx.stat(g, 'health', -U.int(15, 30));
          MV.log(g, `Ignoraste ${C.name.toLowerCase()} demasiado tiempo. Muy mala idea.`, '⚠️', 'bad');
        }
      });

      // Enfermedades nuevas
      let risk = 0.07 + (age > 50 ? 0.05 : 0) + (age > 70 ? 0.07 : 0) + (S.health < 40 ? 0.05 : 0) + (p.stress > 70 ? 0.05 : 0);
      if (p.prison) risk += 0.05;
      if (U.chance(risk)) {
        const pool = MV.RANDOM_CONDS.filter(([id]) => {
          const C = MV.CONDITIONS[id];
          return (!C.minAge || age >= C.minAge) && (!C.maxAge || age <= C.maxAge) && !health.has(g, id);
        });
        const pick = U.pickW(pool, (x) => x[1]);
        if (pick) health.add(g, pick[0]);
      }

      // Adicciones
      const A = p.addic;
      if (A.alcohol > 40) { MV.fx.stat(g, 'health', -U.int(1, 4)); if (A.alcohol > 70 && U.chance(0.08)) health.add(g, 'cirrosis'); }
      if (A.drogas > 40) { MV.fx.stat(g, 'health', -U.int(2, 6)); MV.fx.stat(g, 'smarts', -U.int(0, 2)); }
      if (A.tabaco > 40) { MV.fx.stat(g, 'health', -U.int(1, 3)); MV.fx.stat(g, 'looks', -1); if (U.chance(0.02)) health.add(g, 'cancer'); }
      if (A.apuestas > 50 && p.money > 0) {
        const lost = Math.round(p.money * U.float(0.05, 0.25));
        MV.fx.money(g, -lost);
        MV.log(g, `Tu adicción al juego se comió ${U.money(lost)} este año.`, '🎰', 'bad');
      }
      Object.keys(A).forEach((k) => { if (A[k] > 0) A[k] = Math.max(0, A[k] - U.int(0, 3)); });

      // Estrés
      MV.fx.stat(g, 'stress', -U.int(3, 8));
      if (p.stress > 70) {
        MV.fx.stat(g, 'happy', -U.int(2, 6));
        MV.fx.stat(g, 'health', -U.int(1, 3));
        if (U.chance(0.15)) health.add(g, U.pick(['ansiedad', 'insomnio', 'hipertension', 'migrana']));
      }
      if (S.happy < 12 && U.chance(0.2)) health.add(g, 'depresion');
    },

    /** Devuelve la causa de muerte de este año o null. */
    deathCheck(g) {
      const p = g.p;
      const S = p.stats;
      const worst = p.conds.map((c) => MV.CONDITIONS[c.id]).filter(Boolean)
        .sort((a, b) => b.drain[1] - a.drain[1])[0];
      if (S.health <= 0) return worst ? `complicaciones por ${worst.name.toLowerCase()}` : 'un colapso total del organismo';
      if (p.addic.drogas > 75 && U.chance(0.04)) return 'una sobredosis';
      let rate = MV.deathRate(p.age);
      if (S.health < 50) rate *= 1 + (50 - S.health) / 25;
      if (S.health > 85) rate *= 0.7;
      if (!U.chance(rate)) return null;
      if (worst && U.chance(0.6)) return worst.name.toLowerCase();
      if (p.age >= 70) return U.pick(['causas naturales', 'vejez, mientras dormía', 'un infarto fulminante', 'neumonía']);
      if (U.chance(0.5)) { g.p.flags.muerteAbsurda = true; return U.pick(MV.ABSURD_DEATHS); }
      return U.pick(['un accidente de tránsito', 'un paro cardíaco', 'un aneurisma', 'un accidente doméstico']);
    }
  };
  MV.sys.health = health;
})(window.MV = window.MV || {});
