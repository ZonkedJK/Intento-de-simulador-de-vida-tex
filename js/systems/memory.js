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
      memory.stalkYearly(g);
      let all = memory.recall(g);
      if (p.prison) all = all.filter((e) => e.m.v > 0);
      if (!all.length || !U.chance(0.2)) return;
      const e = U.pickW(all, (x) => Math.abs(x.m.v) * (p.age - x.m.a));
      if (!e) return;
      const o = memory.outcome(g, e.r, e.n, e.m);
      e.m.done = true; e.r.memNext = p.age + 5;
      MV.EV.push(g, o.ev, { target: e.n.id, k: e.m.k, a: e.m.a, d: e.m.d, v: o.v });
    },

    // ——— Acosadoras y acosadores: nacen de un ex, de una noche o de un fan; escalan si los ignoras ———

    /** El acosador activo (vivo y todavía en tus relaciones): { r, n } o null. */
    stalker(g) { return MV.rels(g, 'acosador')[0] || null; },

    /** Una persona se vuelve acosadora: solo uno a la vez y dos por vida. `from`: noche, ruptura o fan. */
    makeStalker(g, n, from) {
      const p = g.p;
      if (!p.alive || p.age < 18 || !n || !n.alive || n.age < 18 || n.species !== 'humano') return false;
      if (memory.stalker(g) || (p.counters.acosadores || 0) >= 2) return false;
      const old = MV.relOf(g, n.id);
      if (old && (MV.FAMILY.includes(old.type) || old.type === 'mascota')) return false;
      const r = MV.addRel(g, n, 'acosador', 40);
      r.stalk = { stage: 1, since: p.age };
      p.counters.acosadores = (p.counters.acosadores || 0) + 1;
      MV.log(g, from === 'fan' ? `${n.first} empezó con una carta y ahora no para: te escribe todos los días. Ya es alguien que te acosa.`
        : from === 'noche' ? `${n.first} no se tomó bien lo de "solo una noche". Los mensajes no paran: tienes ${MV.U.gw(n.gender, 'un acosador', 'una acosadora')}.`
          : `${n.first} no acepta que lo de ustedes terminó. Los mensajes no paran: tienes ${MV.U.gw(n.gender, 'un acosador', 'una acosadora')}.`, '🚨', 'bad');
      return true;
    },

    /** Lo que hace cada etapa cuando no lo frenas. */
    stalkDamage(g, stage) {
      const fx = MV.fx, par = MV.partner(g);
      if (stage >= 3 && par) { par.r.rel = MV.U.clamp(par.r.rel - 10, 0, 100); fx.stat(g, 'stress', 8); }
      else if (stage >= 2) { fx.stat(g, 'stress', 8); fx.stat(g, 'happy', -5); }
      else fx.stat(g, 'stress', 6);
    },

    /** Respondes al acoso: hablar, bloquear, policia, orden, mudarte o ignorar. Devuelve el texto. */
    stalkRespond(g, id, how) {
      const p = g.p, U = MV.U, fx = MV.fx;
      const r = MV.relOf(g, id), n = g.people[id];
      if (!r || !n || r.type !== 'acosador') return 'No hay nadie a quien responder.';
      r.stalk = r.stalk || { stage: 1, since: p.age };
      const st = r.stalk, o = U.gw(n.gender, 'o', 'a'), el = U.gw(n.gender, 'él', 'ella');
      const end = (txt, close) => {
        MV.removeRel(g, id);
        MV.log(g, close, '🕊️', 'good');
        return txt;
      };
      if (how === 'ignorar') {
        const stage = st.stage;
        memory.stalkDamage(g, stage);
        st.stage = Math.min(3, stage + 1);
        const Lo = U.gw(n.gender, 'Lo', 'La');
        if (stage === 1) return `${Lo} ignoraste. Los mensajes se multiplicaron: cuarenta por día, ahora con fotos de tu calle. ${n.first} ya sabe por dónde caminas.`;
        if (stage === 2) return `${Lo} ignoraste. ${n.first} apareció en la puerta de tu trabajo y, al día siguiente, frente a tu casa, con un ramo y una sonrisa que nadie pidió.`;
        const par = MV.partner(g);
        return par ? `${Lo} ignoraste. ${n.first} le escribió a ${par.n.first} para contarle mentiras sobre ti y ${U.gw(par.n.gender, 'lo', 'la')} siguió hasta la puerta del trabajo. La cena en casa fue un campo minado.`
          : `${Lo} ignoraste. ${n.first} sigue ahí, esperando, con la paciencia de quien no tiene nada mejor que hacer, y ya habla de ti con tus vecinos.`;
      }
      const COST = { orden: 5000, mudarte: 2000 };
      if (COST[how] && p.money < COST[how]) return `No te alcanza para eso: te faltan ${U.money(COST[how] - p.money)}.`;
      if (COST[how]) fx.money(g, -COST[how]);
      const CH = { hablar: 0.25, bloquear: st.stage === 1 ? 0.5 : 0, policia: 0.4, orden: 1, mudarte: 0.7 };
      if (!(how in CH)) return '';
      if (how === 'orden') {
        const viol = U.chance(0.2);
        if (viol) fx.stat(g, 'stress', 10);
        return end(viol ? `Tu abogado consiguió una orden de restricción. ${n.first} la incumplió una vez y ${U.gw(n.gender, 'lo arrestaron', 'la arrestaron')} en el acto. Pasó la noche en el calabozo y, desde entonces, ni se acerca.`
          : `Tu abogado consiguió una orden de restricción. ${n.first} la leyó, la dobló y no volvió a aparecer.`,
        `La orden de restricción puso fin al acoso de ${n.first}. Costó ${U.money(5000)}, pero se acabó.`);
      }
      if (U.chance(CH[how])) {
        const T = {
          hablar: [`Hablaste con ${n.first} cara a cara. Escuchó, bajó la mirada y prometió no volver a escribirte. Esta vez parece en serio.`, `Hablar con ${n.first} funcionó: se terminaron los mensajes.`],
          bloquear: [`Bloqueaste a ${n.first} en todos lados. Esta vez no encontró otra puerta y, tras unas semanas, se rindió.`, `Bloquear a ${n.first} dio resultado: el silencio llegó para quedarse.`],
          policia: [`La policía habló con ${n.first}. Una advertencia formal bastó: ${el} entendió que iba en serio.`, `La denuncia contra ${n.first} funcionó: nunca más supiste de ${el}.`],
          mudarte: [`Te mudaste, cambiaste de número y no se lo contaste a nadie. ${n.first} perdió tu rastro.`, `La mudanza costó ${U.money(2000)} y te sacó a ${n.first} de la vida.`]
        }[how];
        return end(T[0], T[1]);
      }
      fx.stat(g, 'stress', 3);
      return {
        hablar: `Hablaste con ${n.first}. Asintió con la cabeza, dijo que sí a todo y siguió igual.`,
        bloquear: `Bloqueaste a ${n.first}, que te escribió desde otros tres números que no conocías.`,
        policia: `Hiciste la denuncia. El oficial anotó todo y dijo "vamos a ver". Con ${n.first} no pasó nada.`,
        mudarte: `Te mudaste, pero alguien le pasó tu dirección a ${n.first}. Las cajas todavía ni se abrieron.`
      }[how];
    },

    /** Las acciones de la ficha de un acosador. Una por año (comparten el año con la decisión del evento). */
    stalkActions(g, r, n) {
      const p = g.p, U = MV.U, list = [];
      const st = r.stalk || (r.stalk = { stage: 1, since: p.age });
      const A = (how, icon, label, sub, extra) => list.push(Object.assign({
        id: 'acoso_' + how, icon, label, sub, limit: 1,
        check: () => (st.acted === g.p.age || st.ev === g.p.age ? 'Ya te ocupaste de esto este año.' : ''),
        run: () => { st.acted = g.p.age; return memory.stalkRespond(g, n.id, how); }
      }, extra));
      A('hablar', '🗣️', 'Hablar con ' + (n.gender === 'f' ? 'ella' : 'él'), '25 % de que termine');
      if (st.stage === 1) A('bloquear', '🚫', 'Bloquearl' + U.gw(n.gender, 'o', 'a'), '50 % de que termine');
      A('policia', '🚔', 'Llamar a la policía', '40 % de que termine');
      if (p.money >= 5000) A('orden', '⚖️', 'Pedir una orden de restricción', `${U.money(5000)}. Casi siempre termina`);
      if (p.money >= 2000) A('mudarte', '📦', 'Mudarte', `${U.money(2000)}. 70 % de que termine`);
      return list;
    },

    /** Cada año, con 60 %, el acosador vuelve a aparecer (salvo si estás preso o ya lo enfrentaste el año pasado). */
    stalkYearly(g) {
      const p = g.p, x = memory.stalker(g);
      if (!x || p.prison) return;
      const st = x.r.stalk || (x.r.stalk = { stage: 1, since: p.age });
      if (st.acted === p.age - 1) return;
      if (MV.U.chance(0.6)) MV.EV.push(g, 'acoso', { target: x.n.id });
    },

    /** "hace 3 años". */
    ago(g, m) {
      const y = g.p.age - m.a;
      return `hace ${y} año${y === 1 ? '' : 's'}`;
    }
  };

  MV.sys.memory = memory;
})(window.MV = window.MV || {});
