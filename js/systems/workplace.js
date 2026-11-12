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
    },

    /** Suma a la chance de ascenso: relación, carácter y rival. Sin jefe cuenta como relación 50 y Ausente. */
    promoMod(g) {
      if (!isFull(g.p)) return 0;
      const B = workplace.boss(g), rel = B ? B.r.rel : 50, K = B ? B.K : MV.BOSS_KINDS.ausente;
      let m = (rel - 50) / 200 + K.promo;
      if (B && B.kind === 'trepador' && rel < 50) m -= 0.2;
      const rv = workplace.mate(g, 'rival');
      if (rv && rv.m.bossRel >= 60) m -= 0.1;
      return m;
    },

    /** Suma a la chance de aumento según el carácter del jefe. */
    raiseMod(g) {
      const B = workplace.boss(g);
      return B ? B.K.raise : 0;
    },

    /** Umbral de rendimiento y chance de despido: peores si te llevas mal con el jefe. */
    fireRule(g) {
      const B = workplace.boss(g);
      return B && B.r.rel < 25 ? { perf: 30, chance: 0.55 } : { perf: 22, chance: 0.4 };
    },

    /** Reemplaza al jefe (deja de ser relación) y, si `info`, avisa quién llegó. */
    newBoss(g, info) {
      const job = g.p.job;
      if (!isFull(g.p)) return null;
      if (job.boss && MV.relOf(g, job.boss.id)) MV.removeRel(g, job.boss.id);
      job.boss = null;
      workplace.staff(g);
      const B = workplace.boss(g);
      if (info && B) {
        const who = U.gw(B.n.gender, 'Tu nuevo jefe', 'Tu nueva jefa');
        MV.EV.info(g, { title: U.gw(B.n.gender, 'Jefe nuevo', 'Jefa nueva'), text: `${who} es ${MV.fullName(B.n)}. Carácter: ${B.K.icon} ${MV.gt(B.K.name, B.n.gender).toLowerCase()}.`, icon: '👔', scene: 'trabajo' });
      }
      return B;
    },

    /** Bono de fin de año: rendimiento 80+, sin crisis y un 60 % de suerte. Devuelve el monto pagado. */
    bonus(g) {
      const job = g.p.job;
      if (!isFull(g.p) || job.perf < 80 || MV.sys.world.mods(g).hire < 0 || !U.chance(0.6)) return 0;
      const amt = Math.round(job.salary * U.float(0.05, 0.15));
      MV.fx.money(g, amt);
      MV.log(g, `Bono de fin de año por tu rendimiento: ${U.money(amt)}. ${U.pick(['Lo gastaste mentalmente antes de cobrarlo.', 'Vino con una tarjeta firmada por todo el equipo (menos el rival).', 'Recursos Humanos lo llamó "reconocimiento variable". Tú lo llamas "por fin".'])}`, '🎁', 'good');
      return amt;
    },

    /** El año en el trabajo: reemplaza al jefe que falta, completa compañeros, estrés del carácter y bono. */
    yearly(g) {
      const p = g.p, job = p.job;
      if (!isFull(p)) return;
      if (!workplace.boss(g)) workplace.newBoss(g, true);
      workplace.staff(g);
      const B = workplace.boss(g);
      const extra = (B ? B.K.stress : 0) + (job.weekends ? 4 : 0);
      if (extra) MV.fx.stat(g, 'stress', extra);
      workplace.bonus(g);
    }
  };

  MV.sys.workplace = workplace;
})(window.MV = window.MV || {});
