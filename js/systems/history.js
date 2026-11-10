/* Mil Vidas — historia de la vida (una fila por año, para los gráficos) y resumen del año. */
(function (MV) {
  'use strict';
  MV.sys = MV.sys || {};
  const MAX = 130;
  const KEYS = ['happy', 'health', 'smarts', 'looks', 'money'];

  const history = {
    /** Foto del momento: edad, patrimonio, dinero y estadísticas. */
    snapshot(g) {
      const p = g.p;
      return { age: p.age, worth: Math.round(MV.netWorth(g)), money: Math.round(p.money), happy: p.stats.happy, health: p.stats.health, smarts: p.stats.smarts, looks: p.stats.looks };
    },

    /** Guarda la fila del año (si ya existe una de esa edad, la reemplaza). */
    record(g) {
      const p = g.p;
      p.history = Array.isArray(p.history) ? p.history : [];
      const s = history.snapshot(g);
      const row = { age: s.age, worth: s.worth, happy: s.happy, health: s.health, smarts: s.smarts, looks: s.looks };
      const last = p.history[p.history.length - 1];
      if (last && last.age === row.age) p.history[p.history.length - 1] = row;
      else p.history.push(row);
      if (p.history.length > MAX) p.history.splice(0, p.history.length - MAX);
    },

    /** Qué cambió desde `before` y hasta 3 momentos destacados del diario (primero lo bueno y lo malo). */
    yearSummary(before, g) {
      const now = history.snapshot(g);
      const changes = KEYS.map((k) => ({ k, d: Math.round(now[k] - before[k]) })).filter((x) => x.d !== 0);
      const items = [];
      g.log.forEach((y) => { if (y.age > before.age) y.items.forEach((it) => { if (it.i !== '🧾') items.push(it); }); });
      const toned = items.filter((it) => it.tone === 'good' || it.tone === 'bad');
      const rest = items.filter((it) => !toned.includes(it));
      const highlights = toned.concat(rest).slice(0, 3).map((it) => it.t);
      return { from: before.age + 1, age: now.age, changes, highlights };
    }
  };
  MV.sys.history = history;
})(window.MV = window.MV || {});
