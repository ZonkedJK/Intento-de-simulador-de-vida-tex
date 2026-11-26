/* Mil Vidas — el curso: tutor y compañeros con papel en primaria y secundaria comunes. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  /** Relación y persona vivas de un id, o null. */
  const live = (g, id) => {
    const r = id && MV.relOf(g, id), n = r && MV.person(g, id);
    return r && n && n.alive ? { r, n } : null;
  };
  const roleRange = (role) => MV.CLASS_ROLES[role].rel;

  /** Las tres formas de molestar a un compañero. */
  const BULLY = {
    burla: { icon: '😏', label: 'Burlarte de un compañero', sub: 'Popularidad, pero con tu karma', pop: 4, karma: -3, happy: 0, drop: 15, mem: 'humillacion',
      say: (n) => `Te burlaste de ${n.first} delante de todo el curso. Hubo risas, y ${U.gw(n.gender, 'él', 'ella')} bajó la vista.`,
      caught: (n, t) => `${t} te vio burlarte de ${n.first}.` },
    broma_pesada: { icon: '🃏', label: 'Hacerle una broma pesada', sub: 'Popularidad, pero con tu karma', pop: 4, karma: -2, happy: 0, drop: 12, mem: 'broma',
      say: (n) => `Le escondiste la mochila a ${n.first} y la dejaste en el techo del patio. Todos se rieron, menos ${U.gw(n.gender, 'él', 'ella')}.`,
      caught: (n, t) => `${t} descubrió la broma a ${n.first}.` },
    merienda: { icon: '🥪', label: 'Quitarle la merienda', sub: 'Solo en primaria', pop: 0, karma: -2, happy: 2, drop: 10, mem: 'humillacion', primaria: true,
      say: (n) => `Le quitaste la merienda a ${n.first} y te la comiste tú. Se quedó sin recreo.`,
      caught: (n, t) => `${t} te vio quitarle la merienda a ${n.first}.` }
  };

  const school = {
    /** ¿Cursas primaria o secundaria comunes y estás libre? */
    active(p) {
      const e = p.edu;
      return !!(e && (e.stage === 'primaria' || e.stage === 'secundaria') && !e.adult && !p.prison);
    },

    /** Tutor vivo con relación `profe`: {n, r, kind, K} o null. */
    teacher(g) {
      const c = g.p.edu.class;
      if (!c || !c.teacher) return null;
      const x = live(g, c.teacher.id);
      return x && x.r.type === 'profe' ? { n: x.n, r: x.r, kind: c.teacher.kind, K: MV.TEACHER_KINDS[c.teacher.kind] } : null;
    },

    /** Compañeros vivos que siguen siendo `curso`: [{n, r, m}]. */
    mates(g) {
      const c = g.p.edu.class, out = [];
      if (!c) return out;
      for (const m of c.mates || []) {
        const x = live(g, m.id);
        if (x && x.r.type === 'curso') out.push({ n: x.n, r: x.r, m });
      }
      return out;
    },

    /** Compañero vivo con ese papel: {n, r, m} o null. */
    mate(g, role) {
      return school.mates(g).find((x) => x.m.role === role) || null;
    },

    /** Crea un compañero de tu edad ±1 (siempre menor) y lo suma al curso con ese papel. */
    _newMate(g, role, gender) {
      const p = g.p, c = p.edu.class;
      const n = MV.newNPC(g, { age: U.clamp(p.age + U.int(-1, 1), 4, 17), gender: gender, country: p.country, job: 'Estudiante', money: 0 });
      MV.addRel(g, n, 'curso', U.int(roleRange(role)[0], roleRange(role)[1]));
      c.mates.push({ id: n.id, role });
      return n;
    },

    /** Completa el curso: tutor, papeles que faltan y, desde los 14, quien te gusta. No cambia nada si ya está completo. */
    staff(g) {
      const p = g.p;
      if (!school.active(p)) return;
      const e = p.edu;
      if (!e.class) e.class = { teacher: null, mates: [] };
      const c = e.class;
      c.mates = c.mates || [];

      if (!school.teacher(g)) {
        const sec = e.stage === 'secundaria';
        const gender = U.pick(['m', 'f']);
        const job = U.gw(gender, sec ? 'Profesor' : 'Maestro', sec ? 'Profesora' : 'Maestra');
        const n = MV.newNPC(g, { gender, age: U.int(25, 60), country: p.country, job });
        n.schoolTeacher = true; // nunca romance, ni como ex tutor y amigo
        MV.addRel(g, n, 'profe', U.int(50, 65));
        c.teacher = { id: n.id, kind: U.pick(Object.keys(MV.TEACHER_KINDS)) };
      }

      // Quien ya no es compañero de curso (murió, pareja, enemigo...) sale del curso y conserva su relación.
      c.mates = c.mates.filter((m) => { const x = live(g, m.id); return x && x.r.type === 'curso'; });
      // Perder el papel de mejor amigo.
      c.mates.forEach((m) => { if (m.role === 'amigo' && MV.relOf(g, m.id).rel < 30) m.role = 'comun'; });

      if (!c.mates.some((m) => m.role === 'amigo')) {
        const cand = c.mates.filter((m) => !['rival', 'abuson', 'amigo', 'crush'].includes(m.role) && MV.relOf(g, m.id).rel >= 30).sort((a, b) => MV.relOf(g, b.id).rel - MV.relOf(g, a.id).rel)[0];
        if (cand) {
          cand.role = 'amigo';
          const r = MV.relOf(g, cand.id);
          r.rel = Math.max(r.rel, roleRange('amigo')[0]);
        } else school._newMate(g, 'amigo');
      }
      if (!c.mates.some((m) => m.role === 'rival')) school._newMate(g, 'rival');
      if (!c.mates.some((m) => m.role === 'abuson' || m.role === 'payaso')) {
        school._newMate(g, U.chance(MV.CLASS_ROLES.abuson.chance) ? 'abuson' : 'payaso');
      }

      if (p.age >= MV.CLASS_ROLES.crush.minAge && p.age <= 17 && !MV.partner(g) && !c.mates.some((m) => m.role === 'crush')) {
        const gender = p.orientation === 'bi' ? U.pick(['m', 'f']) : p.orientation === 'homo' ? p.gender : (p.gender === 'm' ? 'f' : 'm');
        const n = MV.newNPC(g, { gender, age: U.clamp(p.age + U.int(-1, 1), 14, 17), country: p.country, job: 'Estudiante', money: 0 });
        const rg = roleRange('crush');
        const r = MV.addRel(g, n, 'curso', U.int(rg[0], rg[1]));
        if (MV.sys.rels.canRomance(g, n, r)) c.mates.push({ id: n.id, role: 'crush' });
        else { MV.removeRel(g, n.id); delete g.people[n.id]; }
      }
    },


    /** Te suspenden: rendimiento -8, cada padre vivo -6 y una suspensión más en la etapa. */
    _suspend(g) {
      const e = g.p.edu;
      e.perf = U.clamp((e.perf || 0) - 8, 0, 100);
      MV.rels(g, 'padre').forEach((x) => { x.r.rel = U.clamp(x.r.rel - 6, 0, 100); });
      e.susp = (e.susp || 0) + 1;
    },

    /** Te expulsan: curso nuevo con -10 de barra, sin perder el año. Las suspensiones vuelven a 0; `bullied` se queda. */
    _expel(g) {
      const e = g.p.edu;
      school.pop(g, 0);
      school.restaff(g, 'expel');
      e.susp = 0;
    },

    /**
     * Molestar a un compañero (`how`: burla, broma_pesada o merienda). La usan la acción y el evento del testigo:
     * relación, popularidad, karma, recuerdo, personalidad, suspensión y expulsión. Devuelve el texto.
     */
    tease(g, id, how) {
      const p = g.p, e = p.edu, d = BULLY[how];
      const x = live(g, id);
      if (!d || !x || x.r.type !== 'curso') return 'Esa persona ya no está en tu curso.';
      const { n, r } = x;
      const sens = MV.sys.persona.has(n, 'sensible');
      const t = school.teacher(g), K = (t && t.K) || {};
      const before = r.rel;
      r.rel = U.clamp(r.rel - d.drop * (sens ? 2 : 1), 0, 100);
      const caught = U.chance(MV.SCHOOL.CATCH + (K.catch || 0) + (sens ? 0.15 : 0));
      MV.fx.stat(g, 'karma', d.karma);
      if (d.happy) MV.fx.stat(g, 'happy', d.happy);
      if (d.pop) school.pop(g, caught ? 2 : d.pop);
      let out = d.say(n);
      if (sens) {
        MV.sys.persona.fire();
        out += ` ${n.first} se puso a llorar en clase y ${t ? U.gw(t.n.gender, 'el', 'la') + ' ' + t.n.job.toLowerCase() : 'el profesor'} tuvo que parar la lección.`;
      }
      const line = MV.sys.persona.adjust(g, r, n, how, before);
      if (line) out += ' ' + line;
      MV.sys.memory.remember(g, n.id, d.mem, null, sens ? 3 : undefined);
      e.bullied = (e.bullied || 0) + 1;
      e.lastBully = p.age;
      if (e.bullied >= 3) p.flags.abusador = true;
      if (caught) {
        const who = t ? `${U.gw(t.n.gender, 'El', 'La')} ${t.n.job.toLowerCase()} ${t.n.first}` : 'El profesor';
        school._suspend(g);
        out += ` ${d.caught(n, who)} Te suspendieron: tus notas bajaron y en casa hubo un discurso largo.`;
        if (e.susp >= MV.SCHOOL.EXPEL) {
          school._expel(g);
          out += ' Con tres suspensiones, te expulsaron y te cambiaron de escuela. Curso nuevo, tutor nuevo y la fama quedó atrás. No perdiste el año.';
        }
      }
      return out;
    },

    /** Molestar a un compañero: tres acciones, un uso al año cada una. Solo con curso. */
    actions(g) {
      const p = g.p, e = p.edu;
      if (!school.active(p) || !school.mates(g).length) return [];
      const opts = () => school.mates(g).filter((x) => x.m.role !== 'amigo').map((x) => ({ id: x.n.id, icon: '🎒', label: x.n.first, sub: x.m.role === 'comun' ? 'Compañero del curso' : U.gw(x.n.gender, MV.CLASS_ROLES[x.m.role].name.split('|')[0], MV.CLASS_ROLES[x.m.role].name.split('|')[1] || MV.CLASS_ROLES[x.m.role].name) }));
      return Object.keys(BULLY).filter((k) => !BULLY[k].primaria || e.stage === 'primaria').map((k) => {
        const d = BULLY[k];
        return { id: k, icon: d.icon, label: d.label, sub: d.sub, limit: 1, opts, run: (g, id) => school.tease(g, id, k) };
      });
    },

    /** Fin del curso: compañeros con relación 60+ y tutor con 80+ quedan como amigos; el resto sale de tu vida. */
    cleanup(g) {
      const e = g.p.edu, c = e.class;
      if (!c) return;
      const t = c.teacher && MV.relOf(g, c.teacher.id);
      if (t && t.type === 'profe') { if (t.rel >= 80) t.type = 'amigo'; else MV.removeRel(g, t.id); }
      (c.mates || []).forEach((m) => {
        const r = MV.relOf(g, m.id);
        if (r && r.type === 'curso') {
          if (r.rel >= 60) r.type = 'amigo';
          else if ((r.mem || []).some((x) => x.v < 0 && !x.done)) r.type = 'enemigo'; // la víctima guarda el recuerdo
          else MV.removeRel(g, m.id);
        }
      });
      e.class = null;
    },

    /** Popularidad de partida según aspecto y carisma. */
    basePop(p) { return U.clamp(Math.round(30 + p.stats.looks * 0.2 + p.skills.carisma * 0.3), 15, 75); },

    /** Suma `d` a la barra de popularidad (0 a 100); sin barra, parte de la base. Devuelve el valor. */
    pop(g, d) {
      const e = g.p.edu;
      e.pop = U.clamp(Math.round((e.pop == null ? school.basePop(g.p) : e.pop) + (d || 0)), 0, 100);
      if (e.pop >= 90 && e.stage === 'secundaria' && !e.adult && MV.ach) MV.ach.unlock(g, 'recreo');
      return e.pop;
    },

    /** Cierre de año dentro del curso: popularidad y carácter del tutor. */
    yearly(g) {
      const p = g.p, e = p.edu;
      if (!school.active(p)) return;
      school.staff(g);
      const acts = p.lastActs || {};
      let pop = school.pop(g, 0) + 2 * MV.sys.edu.clubsOf(p).length - ((acts.faltar || 0) >= 2 ? 4 : 0);
      pop = pop + (50 - pop) * 0.1;
      e.pop = U.clamp(Math.round(pop), 0, 100);
      if (e.pop >= 90 && e.stage === 'secundaria' && MV.ach) MV.ach.unlock(g, 'recreo');
      const t = school.teacher(g);
      if (t) {
        if (t.K.perf) e.perf = U.clamp(e.perf + t.K.perf, 0, 100);
        if (t.K.stress) MV.fx.stat(g, 'stress', t.K.stress);
      }
    },

    /**
     * Curso nuevo. `kind` fija cómo pasa la barra: 'stage' (cambio de etapa, por defecto),
     * 'repeat' (repetir: -5) o 'expel' (expulsión: -10). Sin barra, parte de la base.
     */
    restaff(g, kind) {
      const e = g.p.edu, base = school.basePop(g.p);
      let pop = base;
      if (e.pop != null) pop = kind === 'repeat' ? e.pop - 5 : kind === 'expel' ? e.pop - 10 : Math.round((e.pop + base) / 2);
      e.pop = U.clamp(pop, 0, 100);
      school.cleanup(g); school.staff(g);
    }
  };

  MV.sys.school = school;
})(window.MV = window.MV || {});
