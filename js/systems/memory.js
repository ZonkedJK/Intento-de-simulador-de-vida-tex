/* Mil Vidas — la memoria: cada persona recuerda lo que le hiciste (hasta 6 recuerdos por relación, en r.mem).
   Un recuerdo es { k, a, v, d?, done? }: tipo, edad en que pasó, valor (+ bueno, - malo; |v| de 1 a 3) y dato. */
(function (MV) {
  'use strict';
  MV.sys = MV.sys || {};

  const MAX = 6;
  /** Relaciones que no guardan recuerdos. */
  const NO_MEM = ['mascota', 'acosador'];

  const memory = {
    /** Guarda (o refuerza) un recuerdo de lo que le hiciste a esa persona. Devuelve el recuerdo o null. */
    remember(g, id, k, d, w) {
      const p = g.p, K = MV.MEMORY_KINDS[k];
      if (!K || !p.alive) return null;
      const r = MV.relOf(g, id), n = g.people[id];
      if (!r || !n || NO_MEM.includes(r.type) || n.species !== 'humano') return null;
      r.mem = r.mem || [];
      const old = r.mem.find((m) => m.k === k && !m.done);
      if (old) {
        old.v = Math.sign(old.v) * Math.min(3, Math.abs(old.v) + 1);
        if (typeof d === 'number' && typeof old.d === 'number') old.d += d;
        else if (d != null) old.d = d;
        old.a = p.age;
        return old;
      }
      const weight = w != null ? w : (typeof K.w === 'function' ? K.w(d) : K.w);
      const m = { k, a: p.age, v: (K.good ? 1 : -1) * weight, d };
      r.mem.push(m);
      if (r.mem.length > MAX) {
        const pool = r.mem.some((x) => x.done) ? r.mem.filter((x) => x.done) : r.mem;
        const out = pool.reduce((a, b) => {
          if (pool === r.mem && Math.abs(b.v) !== Math.abs(a.v)) return Math.abs(b.v) < Math.abs(a.v) ? b : a;
          return b.a < a.a ? b : a;
        });
        r.mem.splice(r.mem.indexOf(out), 1);
      }
      return m;
    },

    /** Lo que le hiciste, en pasado y en segunda persona: "le prestaste $5.000". */
    said(g, n, m) { return MV.MEMORY_KINDS[m.k].did(n, m.d); },

    /** "hace 3 años". */
    ago(g, m) {
      const y = g.p.age - m.a;
      return `hace ${y} año${y === 1 ? '' : 's'}`;
    }
  };

  MV.sys.memory = memory;
})(window.MV = window.MV || {});
