/* Mil Vidas — jubilación: ahorro previsional, factor por edad (55 a 70) y retiro con tu ahorro. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const RATES = [0, 0.05, 0.10, 0.15];
  const pct = (r) => `${Math.round(r * 100)} %`;

  const retirement = {
    RATES,
    MIN_AGE: 55,

    setRate(g, rate) {
      if (!RATES.includes(rate)) return 'Ese aporte no existe.';
      g.p.pensionRate = rate;
      return rate ? `Desde ahora aportas el ${pct(rate)} de tu sueldo al ahorro previsional.` : 'Dejaste de aportar al ahorro previsional.';
    },

    /** 0,70 a los 55, 1 a los 65 y 1,20 desde los 70. */
    ageFactor(age) {
      return age < 65 ? 1 - (65 - age) * 0.03 : 1 + (Math.min(age, 70) - 65) * 0.04;
    },

    /** Pensión si te jubilas hoy: la cuenta de siempre por el factor de edad, más la renta del fondo. */
    pensionFor(g) {
      const p = g.p;
      let base = 0;
      if (p.job) {
        const years = p.age - p.job.start + p.jobs.reduce((a, j) => a + Math.max(0, j.to - j.from), 0);
        const rate = years >= 25 ? 0.65 : years >= 12 ? 0.45 : 0.25;
        base = Math.round(p.job.salary * rate);
      }
      const factor = retirement.ageFactor(p.age);
      const annuity = (p.pensionFund || 0) / Math.max(10, 85 - p.age);
      return { base, factor, annuity, total: Math.round(base * factor + annuity) };
    },

    /** Aporte del año (si alcanza la plata) y crecimiento del fondo. */
    yearly(g) {
      const p = g.p;
      if (!p.pensionFund) p.pensionFund = 0;
      if (p.job && !p.retired && p.pensionRate) {
        const c = Math.round((p.job.salary || 0) * p.pensionRate);
        if (c > 0 && p.money >= c) { MV.fx.money(g, -c); p.pensionFund += c; }
      }
      if (p.pensionFund > 0) p.pensionFund = Math.round(p.pensionFund * (1 + U.float(0.01, 0.06)));
    },

    /** Sin trabajo, desde los 55 y con fondo: te jubilas con la renta del fondo. */
    retireWithSavings(g) {
      const p = g.p;
      if (p.retired) return `Ya estás ${U.gw(p.gender, 'jubilado', 'jubilada')}.`;
      if (p.job) return 'Con trabajo, la jubilación se pide desde Ocupación: "Jubilarte".';
      if (p.age < retirement.MIN_AGE) return 'Aún no puedes jubilarte.';
      if (!(p.pensionFund > 0)) return 'No tienes ahorro previsional.';
      p.pension = retirement.pensionFor(g).total;
      p.pensionFund = 0;
      p.retired = true;
      MV.ach.unlock(g, 'jubilado');
      MV.fx.stat(g, 'happy', 10);
      MV.fx.stat(g, 'stress', -20);
      return `Te retiraste con tu ahorro. Pensión: ${U.money(p.pension)} al año. Bienvenida la siesta.`;
    },

    /** Sacar el fondo antes de jubilarte: cobras el 70 %. */
    withdraw(g) {
      const p = g.p;
      if (!(p.pensionFund > 0)) return 'No tienes ahorro previsional.';
      const cash = Math.round(p.pensionFund * 0.7);
      p.pensionFund = 0;
      MV.fx.money(g, cash);
      return `Sacaste tu ahorro previsional: cobraste ${U.money(cash)}. El resto se lo quedó la administradora "por gastos".`;
    }
  };

  MV.sys.retirement = retirement;
})(window.MV = window.MV || {});
