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
        if (r && r.type === 'jefe') { if (r.rel >= 80) r.type = 'amigo'; else MV.removeRel(g, job.boss.id); }
      }
      (job.mates || []).forEach((m) => { // la pareja o el enemigo de la oficina siguen siéndolo
        const r = MV.relOf(g, m.id);
        if (r && r.type === 'companero') { if (r.rel > 60) r.type = 'amigo'; else MV.removeRel(g, m.id); }
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
      // Seguimientos de decisiones del año pasado
      if (job.cooked === p.age - 1) {
        delete job.cooked;
        if (U.chance(0.35)) {
          p.record.push({ crime: 'Fraude contable', age: p.age, years: 0 });
          MV.fx.stat(g, 'karma', -2);
          MV.sys.career.fire(g, 'La auditoría encontró los números que "ajustaste". Te llevaste un antecedente de regalo.');
          return;
        }
      }
      if (job.hidden === p.age - 1) {
        delete job.hidden;
        if (U.chance(0.5)) { job.perf = U.clamp(job.perf - 25, 0, 100); MV.log(g, 'Salió a la luz el error que escondiste el año pasado. Ahora todos te revisan dos veces el trabajo.', '💥', 'bad'); }
      }
      if (!workplace.boss(g)) workplace.newBoss(g, true);
      workplace.staff(g);
      const B = workplace.boss(g);
      const extra = (B ? B.K.stress : 0) + (job.weekends ? 4 : 0);
      if (extra) MV.fx.stat(g, 'stress', extra);
      workplace.bonus(g);
    },

    /** Traslado a otro país con +30 %: país y ciudad nuevos, jefe y compañeros nuevos. Pareja, hijos y bienes no cambian. */
    move(g) {
      const p = g.p;
      const k = U.pick(Object.keys(MV.COUNTRIES).filter((c) => c !== p.country)), C = MV.COUNTRIES[k];
      p.country = k;
      p.city = U.pick(C.cities);
      p.job.salary = Math.round(p.job.salary * 1.3);
      workplace.restaff(g);
      MV.fx.stat(g, 'happy', 5);
      MV.fx.stat(g, 'stress', 5);
      return `Te mudaste a ${p.city}, ${C.name} ${C.flag}. Nuevo sueldo: ${U.money(p.job.salary)} al año, jefe nuevo y una máquina de café que no entiendes.`;
    },

    // ——— Encargos freelance (con o sin trabajo) ———
    /** Un encargo por cada habilidad con nivel 10 o más. */
    freelanceOptions(g) {
      const p = g.p;
      return MV.FREELANCE.filter((f) => (p.skills[f.skill] || 0) >= 10)
        .map((f) => ({ id: f.skill, icon: f.icon, label: f.label, sub: `${MV.SKILLS[f.skill].name} ${Math.floor(p.skills[f.skill])} · paga según tu nivel` }));
    },

    /** Hace el encargo: paga nivel × $150–400 (15 %: la mitad), +3 de estrés y entrena la habilidad. */
    freelance(g, skill) {
      const p = g.p, F = MV.FREELANCE.find((f) => f.skill === skill);
      if (!F) return 'Ese encargo no existe.';
      let pay = Math.round((p.skills[skill] || 0) * U.int(150, 400));
      const half = U.chance(0.15);
      if (half) pay = Math.round(pay / 2);
      MV.fx.money(g, pay);
      MV.fx.stat(g, 'stress', 3);
      MV.fx.skill(g, skill, 1);
      if (half) return `${F.icon} ${F.label}: el cliente te pagó la mitad y el resto "en exposición". Cobraste ${U.money(pay)}.`;
      return `${F.icon} ${F.label}: ${U.pick(['el cliente quedó feliz y pidió "un cambio chiquito" once veces.', 'lo entregaste a tiempo. Nadie lo puede creer, ni tú.', 'te recomendaron a un amigo que "paga en cuanto cobre".'])} Cobraste ${U.money(pay)}.`;
    },

    /** Acción de la hoja de Ocupación: con opciones si hay habilidades; si no, explica qué falta. */
    freelanceAction(g) {
      const os = workplace.freelanceOptions(g);
      const a = { id: 'freelance', icon: '💼', label: 'Hacer un encargo freelance', sub: '2 por año · según tus habilidades', limit: 2,
        check: (gg) => (gg.p.age < 16 ? 'Los encargos freelance son desde los 16 años.' : !workplace.freelanceOptions(gg).length ? 'Para tomar encargos necesitas alguna habilidad en 10 o más (programación, arte, idiomas, cocina, música o carisma).' : null),
        run: (gg, opt) => workplace.freelance(gg, opt) };
      if (os.length && g.p.age >= 16) a.opts = () => workplace.freelanceOptions(g);
      return a;
    }
  };

  MV.sys.workplace = workplace;
})(window.MV = window.MV || {});
