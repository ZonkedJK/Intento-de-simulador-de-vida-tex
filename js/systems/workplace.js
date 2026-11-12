/* Mil Vidas — lugar de trabajo: jefe y compañeros con nombre en los trabajos de tiempo completo. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const isFull = (p) => !!(p.job && p.job.type === 'full');
  /** Relación viva de un id, o null. */
  const live = (g, id) => {
    const r = id && MV.relOf(g, id), n = r && MV.person(g, id);
    return r && n && n.alive ? { r, n } : null;
  };

  const workplace = {
    /** Completa jefe y 2 compañeros si faltan (solo trabajos de tiempo completo). */
    staff(g) {
      const p = g.p;
      if (!isFull(p)) return;
      const job = p.job;
      if (!job.boss || !live(g, job.boss.id)) {
        const n = MV.newNPC(g, { age: U.int(30, 65), country: p.country, job: MV.sys.career.title(p) });
        MV.addRel(g, n, 'jefe', U.int(45, 60));
        job.boss = { id: n.id, kind: U.pick(Object.keys(MV.BOSS_KINDS)) };
      }
      job.mates = (job.mates || []).filter((m) => live(g, m.id));
      const roles = U.shuffle(Object.keys(MV.MATE_ROLES).filter((k) => !job.mates.some((m) => m.role === k)));
      while (job.mates.length < 2 && roles.length) {
        const n = MV.newNPC(g, { age: U.clamp(p.age + U.int(-15, 15), 18, 70), country: p.country, job: MV.sys.career.title(p) });
        MV.addRel(g, n, 'companero', U.int(40, 65));
        job.mates.push({ id: n.id, role: roles.shift(), bossRel: U.int(30, 70) });
      }
    },

    /** Al dejar el trabajo: el jefe y los compañeros queridos quedan como amigos; el resto se va. */
    cleanup(g) {
      const job = g.p.job;
      if (!job) return;
      if (job.boss) {
        const r = MV.relOf(g, job.boss.id);
        if (r) { if (r.rel >= 80) r.type = 'amigo'; else MV.removeRel(g, job.boss.id); }
      }
      (job.mates || []).forEach((m) => {
        const r = MV.relOf(g, m.id);
        if (r) { if (r.rel > 60) r.type = 'amigo'; else MV.removeRel(g, m.id); }
      });
      job.boss = null;
      job.mates = [];
    },

    restaff(g) { workplace.cleanup(g); workplace.staff(g); },

    /** Jefe vivo que sigue siendo relación: {n, r, kind, K} o null. */
    boss(g) {
      const job = g.p.job;
      if (!isFull(g.p) || !job.boss) return null;
      const x = live(g, job.boss.id);
      return x ? { n: x.n, r: x.r, kind: job.boss.kind, K: MV.BOSS_KINDS[job.boss.kind] } : null;
    },

    /** Compañero vivo de ese rol: {n, r, m} o null. */
    mate(g, role) {
      const job = g.p.job;
      if (!isFull(g.p)) return null;
      for (const m of job.mates || []) {
        if (m.role !== role) continue;
        const x = live(g, m.id);
        if (x) return { n: x.n, r: x.r, m };
      }
      return null;
    }
  };

  MV.sys.workplace = workplace;
})(window.MV = window.MV || {});
