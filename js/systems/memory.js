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

    /** El favor que te devuelve esta persona: el primero de MV.MEMORY_FAVORS cuya condición se cumple. */
    favorFor(g, r, n, ctx) {
      const f = (MV.MEMORY_FAVORS || []).find((x) => { try { return x.when(g, r, n, ctx || {}); } catch (e) { return false; } });
      return f ? f.id : 'regalo';
    },

    /** La vuelta de la vida de esta persona: una al azar entre las de MV.MEMORY_TWISTS que encajan con ctx.k y cuya condición se cumple. Null si no hay o estás preso. */
    twistFor(g, r, n, ctx) {
      if (g.p.prison || !ctx) return null;
      const ok = (MV.MEMORY_TWISTS || []).filter((x) => x.kinds.includes(ctx.k) && (() => { try { return x.when(g, r, n, ctx); } catch (e) { return false; } })());
      return ok.length ? MV.U.pick(ok).id : null;
    },

    /** Las venganzas de MV.MEMORY_REVENGES que encajan con tu situación ahora. `chismes` siempre está. */
    revengesFor(g, r, n) {
      return (MV.MEMORY_REVENGES || []).filter((x) => { try { return x.when(g, r, n); } catch (e) { return false; } }).map((x) => x.id);
    },

    /** Los recuerdos que podrían volver: sin `done`, de hace 3 años o más, de humanos vivos que siguen en tus relaciones. */
    recall(g) {
      const out = [], age = g.p.age;
      for (const r of g.p.rels || []) {
        if (NO_MEM.includes(r.type) || !Array.isArray(r.mem)) continue;
        const n = g.people[r.id];
        if (!n || !n.alive || n.species !== 'humano') continue;
        if (r.memNext != null && age < r.memNext) continue;
        for (const m of r.mem) {
          if (m && !m.done && MV.MEMORY_KINDS[m.k] && age - m.a >= 3) out.push({ r, n, m });
        }
      }
      return out;
    },

    /** Qué pasa con este recuerdo: { ev, v } (el evento y su dato: el favor, la vuelta o la venganza). */
    outcome(g, r, n, m) {
      const ctx = { k: m.k, a: m.a, d: m.d }, U = MV.U;
      if (m.v > 0) {
        const twist = memory.twistFor(g, r, n, ctx);
        if (twist && U.chance(0.3)) return { ev: 'mem_vuelta', v: twist };
        return { ev: 'mem_favor', v: memory.favorFor(g, r, n, ctx) };
      }
      if (r.rel >= 70) return { ev: 'mem_perdon', v: null };
      return { ev: 'mem_venganza', v: U.pick(memory.revengesFor(g, r, n)) };
    },

    /** Cada año, con 20 %, vuelve un recuerdo viejo (uno solo). Preso, solo los buenos. */
    yearly(g) {
      const p = g.p, U = MV.U;
      if (!p.alive || g.over || p.age < 8) return;
      let all = memory.recall(g);
      if (p.prison) all = all.filter((e) => e.m.v > 0);
      if (!all.length || !U.chance(0.2)) return;
      const e = U.pickW(all, (x) => Math.abs(x.m.v) * (p.age - x.m.a));
      if (!e) return;
      const o = memory.outcome(g, e.r, e.n, e.m);
      e.m.done = true; e.r.memNext = p.age + 5;
      MV.EV.push(g, o.ev, { target: e.n.id, k: e.m.k, a: e.m.a, d: e.m.d, v: o.v });
    },

    /** "hace 3 años". */
    ago(g, m) {
      const y = g.p.age - m.a;
      return `hace ${y} año${y === 1 ? '' : 's'}`;
    }
  };

  MV.sys.memory = memory;
})(window.MV = window.MV || {});
