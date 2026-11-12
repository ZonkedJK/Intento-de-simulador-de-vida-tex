/* Mil Vidas — logros, aspiraciones, muerte, epitafios, cementerio y herencia (continuar como hijo). */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  MV.ach = {
    def: (id) => MV.ACHIEVEMENTS.find((a) => a.id === id),
    unlock(g, id) {
      const A = MV.ach.def(id);
      if (!A) return false;
      g.achLife = g.achLife || [];
      if (g.achLife.includes(id)) return false;
      g.achLife.push(id);
      const glob = MV.global();
      if (!glob.ach[id]) {
        glob.ach[id] = { date: new Date().toISOString().slice(0, 10), who: g.p ? MV.fullName(g.p) : '' };
        MV.saveGlobal();
        if (typeof MV.onAch === 'function') MV.onAch(A);
      }
      return true;
    },
    check(g) {
      MV.ACHIEVEMENTS.forEach((a) => {
        try { if (a.check && a.check(g)) MV.ach.unlock(g, a.id); } catch (e) { /* datos incompletos */ }
      });
    }
  };

  const legacy = {
    yearly(g) {
      const p = g.p;
      if (p.age === 14 && !p.aspiration) {
        MV.EV.push(g, 'elegir_aspiracion', { opts: U.shuffle(MV.ASPIRATIONS.map((a) => a.id)).slice(0, 3) });
      }
      if (p.aspiration && !p.aspiration.done) {
        const A = MV.ASPIRATIONS.find((a) => a.id === p.aspiration.id);
        if (A && A.check(g)) {
          p.aspiration.done = true;
          p.aspiration.age = p.age;
          MV.fx.stat(g, 'happy', 25);
          MV.fx.stat(g, 'karma', 5);
          MV.ach.unlock(g, 'aspiracion');
          MV.EV.info(g, { title: '¡Sueño cumplido!', text: `Cumpliste tu aspiración de vida: ${A.name}. Te sientes en paz con el universo (por un rato).`, icon: '🌈', scene: 'naturaleza' });
        }
      }
      MV.ach.check(g);
    },

    epitaph(g) {
      const p = g.p, nw = MV.netWorth(g), kids = MV.rels(g, 'hijo', true).length;
      const el = U.gw(p.gender, 'él', 'ella');
      const rules = [
        [p.prison, 'Murió entre rejas. Al menos la comida era gratis.'],
        [(p.counters.asesinatos || 0) > 0, `Nadie se atrevió a hablar mal de ${el} en el funeral.`],
        [p.flags.muerteAbsurda, 'Su muerte será un meme durante generaciones.'],
        [p.fame >= 80, 'Su nombre seguirá apareciendo en programas de chismes.'],
        [nw >= 1e7, 'Murió rico. Sus herederos ya están peleando.'],
        [nw <= -10000, 'Se llevó sus deudas a la tumba. El banco sigue llamando.'],
        [p.karma >= 60, 'Hizo del mundo un lugar un poco mejor.'],
        [p.karma <= -60, 'El mundo respira un poco más tranquilo.'],
        [kids >= 4, 'Dejó una familia enorme y un grupo de chat caótico.'],
        [p.age >= 95, 'Vivió tanto que dejó de cumplir años por vergüenza.'],
        [p.age < 18, 'Se fue demasiado pronto.'],
        [p.edu.degrees.some((d) => d.type === 'doctorado'), 'Corrigió la gramática hasta en su lecho de muerte.'],
        [(p.counters.divorcios || 0) >= 2, 'Amó mucho. A mucha gente. En distintas etapas.'],
        [p.aspiration && p.aspiration.done, 'Cumplió su sueño. Pocos pueden decirlo.']
      ];
      const hit = rules.find((r) => r[0]);
      return hit ? hit[1] : U.pick(['Vivió. Más o menos.', 'Hizo lo que pudo con lo que tenía.', 'Una vida normal, con momentos extraordinarios.', 'Nunca devolvió aquel táper.']);
    },

    verdict(karma) {
      if (karma >= 40) return { icon: '😇', name: 'Cielo', text: 'Subiste al cielo. Las nubes son más cómodas de lo que parecían.' };
      if (karma <= -40) return { icon: '😈', name: 'Infierno', text: 'Bajaste al infierno. El aire acondicionado lleva siglos roto.' };
      return { icon: '🫥', name: 'Purgatorio', text: 'Una sala de espera eterna con música de ascensor.' };
    },

    /** Termina la vida del jugador. */
    die(g, cause) {
      const p = g.p;
      if (!p.alive) return g.summary;
      p.alive = false;
      p.cause = cause;
      g.over = true;
      g.queue = [];
      MV.ach.check(g);
      MV.sys.challenge.yearly(g);
      g.queue = [];
      if (p.age < 30) MV.ach.unlock(g, 'joven');
      if (p.flags.muerteAbsurda) MV.ach.unlock(g, 'muerte_absurda');
      MV.sys.dirty.seizeAtDeath(g);
      const J = p.job ? MV.sys.career.title(p) : (p.jobs.length ? p.jobs[p.jobs.length - 1].title : null);
      const best = p.edu.degrees.length ? p.edu.degrees[p.edu.degrees.length - 1] : null;
      const summary = {
        id: p.id, name: MV.fullName(p), gender: p.gender, look: p.look, born: g.year - p.age, died: g.year,
        age: p.age, cause, worth: MV.netWorth(g), job: J ? (p.retired ? `${J} (${U.gw(p.gender, 'jubilado', 'jubilada')})` : J) : 'Sin trabajo',
        edu: best ? (best.kind === 'universidad' ? MV.EDU.majors[best.major].name : best.kind === 'tecnica' ? MV.EDU.tech[best.major].name : MV.EDU.post[best.type].name) : MV.EDU.names[MV.EDU.order[MV.eduLevel(p)]],
        kids: MV.rels(g, 'hijo', true).length, marriages: p.counters.bodas || 0, crimes: p.counters.delitos || 0,
        karma: p.karma, fame: p.fame, stats: Object.assign({}, p.stats), epitaph: legacy.epitaph(g), verdict: legacy.verdict(p.karma),
        ach: (g.achLife || []).slice(), aspiration: p.aspiration ? Object.assign({ name: (MV.ASPIRATIONS.find((a) => a.id === p.aspiration.id) || {}).name }, p.aspiration) : null,
        generation: g.generation, dynasty: g.dynasty, country: p.country, city: p.city,
        grandkids: MV.rels(g, 'nieto', true).length,
        works: (p.works || []).filter((w) => w.hit).map((w) => w.title).slice(-3),
        challenge: MV.sys.challenge.label(g),
        lifeIns: (p.insurance && p.insurance.vida) || 0
      };
      g.summary = summary;
      MV.log(g, `Moriste a los ${p.age} años por ${cause}.`, '🪦', 'bad');
      const glob = MV.global();
      glob.graveyard.unshift(summary);
      if (glob.graveyard.length > 200) glob.graveyard.length = 200;
      glob.lives = (glob.lives || 0) + 1;
      MV.saveGlobal();
      if (glob.lives >= 10) MV.ach.unlock(g, 'reencarnacion');
      return summary;
    },

    /** Resumen en texto para copiar o compartir (requiere g.summary, es decir, la vida terminada). */
    summaryText(g) {
      const s = g.summary;
      if (!s) return '';
      const C = MV.COUNTRIES[s.country] || { name: '', flag: '' };
      const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
      const fam = [s.kids ? plural(s.kids, 'hijo', 'hijos') : 'sin hijos', s.grandkids ? plural(s.grandkids, 'nieto', 'nietos') : null, s.marriages ? plural(s.marriages, 'boda', 'bodas') : null].filter(Boolean).join(', ');
      const achs = (s.ach || []).map((id) => MV.ach.def(id)).filter(Boolean);
      const lines = [
        `🪦 ${s.name} (${s.born}–${s.died}), ${plural(s.age, 'año', 'años')}`,
        `${C.flag} ${s.city ? s.city + ', ' : ''}${C.name}. Murió por ${s.cause}.`,
        `💼 ${s.job} · 🎓 ${s.edu} · 💰 ${U.money(s.worth)}`,
        `👪 ${U.cap(fam)} · ☯️ karma ${s.karma} · ⭐ fama ${s.fame}`,
        s.works && s.works.length ? `🏆 Éxitos: ${s.works.map((t) => `"${t}"`).join(', ')}` : null,
        achs.length ? `🏅 Logros: ${achs.slice(0, 6).map((a) => `${a.icon} ${a.name}`).join(', ')}${achs.length > 6 ? ` y ${achs.length - 6} más` : ''}` : null,
        s.challenge ? `🎯 Desafío: ${s.challenge}` : null,
        `${s.verdict.icon} ${s.verdict.name}. «${s.epitaph}»`,
        `Generación ${s.generation}${s.dynasty ? ` de la dinastía ${s.dynasty.name}` : ''} · Mil Vidas`
      ];
      return lines.filter(Boolean).join('\n');
    },

    /** Qué recibe un heredero: la casa familiar siempre (donde vivías o tu casa más valiosa) y, si es el
        único o el nombrado, todos los bienes. Su valor se descuenta de su parte (patrimonio × 0,9 × porcentaje). */
    estateFor(g, heirId) {
      const old = g.p, pool = legacy.heirs(g);
      const n = Math.max(1, pool.length);
      // El heredero nombrado solo cuenta si sigue entre los herederos (si murió, se reparte en partes iguales).
      const named = old.heirId && pool.some((x) => x.id === old.heirId) ? old.heirId : null;
      let share = named ? (named === heirId ? 0.85 : 0.15 / Math.max(1, n - 1)) : 1 / n;
      if (n === 1) share = 1;
      const worth = Math.max(0, g.summary ? g.summary.worth : MV.netWorth(g));
      // El seguro de vida se cobra aparte: no paga impuesto de herencia.
      const life = g.summary ? (g.summary.lifeIns || 0) : ((old.insurance && old.insurance.vida) || 0);
      const total = Math.round(worth * 0.9 * share) + Math.round(life * share);
      const houses = old.assets.filter((a) => a.type === 'casa');
      const home = houses.find((a) => a.id === old.home) || houses.slice().sort((a, b) => b.value - a.value)[0] || null;
      // Un menor no puede administrar ni vender bienes: recibe la casa y el resto en dinero.
      const minor = ((g.people[heirId] || {}).age || 0) < 18;
      const all = (n === 1 || named === heirId) && !minor;
      const assets = all ? old.assets.slice() : home ? [home] : [];
      return { assets, home, total, cash: Math.max(0, total - U.sum(assets, (a) => a.value)) };
    },

    /** Herederos: los hijos vivos; si no queda ninguno, los nietos vivos. */
    heirs(g) {
      const kids = MV.rels(g, 'hijo').map((x) => x.n);
      return kids.length ? kids : MV.rels(g, 'nieto').map((x) => x.n);
    },

    /** Crea una nueva partida jugando como uno de los hijos. */
    continueAs(g, kidId) {
      const old = g.p, c = g.people[kidId];
      if (!c || !c.alive) throw new Error('Ese heredero no está disponible.');
      const grand = (MV.relOf(g, kidId) || {}).type === 'nieto';
      const ng = {
        version: MV.VERSION, year: g.year, startYear: g.year - c.age, people: {}, log: [], queue: [], evDone: {}, favs: (g.favs || []).slice(),
        generation: (g.generation || 1) + 1, dynasty: g.dynasty, over: false, achLife: [], rng: 0,
        challenge: null
      };
      const ch = MV.sys.challenge.status(g);
      if (ch && ch.def.dynasty && !ch.done && !ch.failed) ng.challenge = Object.assign({}, g.challenge, { countries: [] });
      const p = MV.newPlayerBase({
        first: c.first, last: c.last || old.last, gender: c.gender, age: c.age, country: old.country, city: old.city, look: c.look,
        stats: { happy: U.int(35, 65), health: U.clamp(c.health, 30, 100), smarts: c.smarts, looks: c.looks }
      });
      ng.p = p;
      p.flags.clase = old.flags.clase;
      // El jugador anterior pasa a ser un padre fallecido.
      const oldRel = MV.relOf(g, kidId);
      ng.people[old.id] = {
        id: old.id, first: old.first, last: old.last, gender: old.gender, age: old.age, alive: false, species: 'humano', look: old.look,
        looks: old.stats.looks, smarts: old.stats.smarts, health: 0, money: 0, job: g.summary ? g.summary.job : '', traits: [], deathAge: old.age, cause: old.cause
      };
      p.rels.push({ id: old.id, type: grand ? 'abuelo' : 'padre', rel: oldRel ? oldRel.rel : 60, since: 0 });
      const copy = (n) => { ng.people[n.id] = U.deepClone(n); return ng.people[n.id]; };
      if (grand) {
        // Como nieto: tu padre o madre es el hijo del jugador anterior (vivo o no).
        const par = c.parentId && g.people[c.parentId];
        if (par) {
          copy(par); p.rels.push({ id: par.id, type: 'padre', rel: par.alive ? U.int(50, 90) : 60, since: 0 });
          // El otro padre o madre (la pareja del hijo) pasa a ser una persona real que te cría.
          if (par.spouseName) {
            const [first, ...rest] = par.spouseName.split(' ');
            const op = MV.newNPC(ng, { gender: par.spouseGender || (par.gender === 'm' ? 'f' : 'm'), age: U.clamp(par.age + U.int(-4, 4), c.age + 18, 110), first, last: rest.join(' ') || undefined });
            p.rels.push({ id: op.id, type: 'padre', rel: U.int(55, 90), since: 0 });
          }
        }
      } else {
        const other = c.otherParent && g.people[c.otherParent];
        if (other && other.alive) { copy(other); const orr = MV.relOf(g, other.id); p.rels.push({ id: other.id, type: 'padre', rel: orr ? U.clamp(orr.rel, 40, 90) : 60, since: 0 }); }
      }
      const siblings = grand ? MV.rels(g, 'nieto').filter((x) => x.n.id !== kidId && x.n.parentId === c.parentId) : MV.rels(g, 'hijo').filter((x) => x.n.id !== kidId);
      siblings.forEach(({ n }) => { copy(n); p.rels.push({ id: n.id, type: 'hermano', rel: U.int(35, 85), since: 0 }); });
      MV.rels(g, 'mascota').forEach(({ n, r }) => { if (c.age < 30) { copy(n); p.rels.push({ id: n.id, type: 'mascota', rel: r.rel, since: c.age }); } });

      // Herencia: la casa familiar siempre; todos los bienes si es el único o el nombrado.
      const est = legacy.estateFor(g, kidId);
      const copies = est.assets.map((a) => Object.assign(U.deepClone(a), { id: U.uid('a'), bought: c.age }));
      copies.forEach((a) => p.assets.push(a));
      const cash = est.cash;
      const homeCopy = est.home ? copies[est.assets.indexOf(est.home)] : null;
      if (homeCopy && c.age >= 18) { p.housing = 'propia'; p.home = homeCopy.id; p.rent = null; homeCopy.rented = false; }
      const houseTxt = copies.length ? ` y ${copies.length === 1 ? copies[0].name.toLowerCase() : `${copies.length} bienes (entre ellos ${(homeCopy || copies[0]).name.toLowerCase()})`}` : '';
      p.money = cash;

      // Educación y trabajo según la edad del heredero.
      if (c.age >= 6 && c.age < 12) { p.edu.stage = 'primaria'; p.edu.year = c.age - 6; }
      else if (c.age >= 12 && c.age < 18) { p.edu.done.push('primaria'); p.edu.stage = 'secundaria'; p.edu.year = c.age - 12; }
      else if (c.age >= 18) {
        p.edu.done.push('primaria', 'secundaria');
        if (c.age >= 23 && c.smarts >= 45 && U.chance(0.55)) {
          const major = U.pick(Object.keys(MV.EDU.majors).filter((k) => MV.EDU.majors[k].smarts <= c.smarts));
          if (major) { p.edu.done.push('universidad'); p.edu.degrees.push({ kind: 'universidad', major }); }
        }
        if (c.age < 65) {
          const options = MV.JOBS.filter((J) => MV.sys.career.meets(ng, J).ok);
          const J = U.pick(options);
          if (J) { MV.sys.career.hire(ng, J, U.clamp(Math.floor((c.age - 20) / 9), 0, J.titles.length - 1)); p.job.start = Math.max(18, c.age - 3); }
        } else { p.retired = true; p.pension = U.int(9000, 25000); }
        if (p.housing !== 'propia') { p.housing = 'alquiler'; p.rent = MV.RENTALS[1]; }
        const ownKids = grand ? [] : MV.sys.people.grandkidsOf(g, kidId).filter((x) => x.n.alive);
        if (!grand && (c.spouseName || ownKids.length)) {
          // Su familia real: la pareja con la que se casó y sus hijos (los nietos del jugador anterior).
          let sp = null;
          if (c.spouseName) {
            const [first, ...rest] = c.spouseName.split(' ');
            sp = MV.newNPC(ng, { gender: c.spouseGender || (c.gender === 'm' ? 'f' : 'm'), age: U.clamp(c.age + U.int(-4, 4), 18, 110), first, last: rest.join(' ') || undefined });
            p.rels.push({ id: sp.id, type: 'conyuge', rel: U.int(50, 85), since: c.marriedAge || Math.max(18, c.age - 3) });
            p.counters.bodas = 1;
          }
          ownKids.forEach(({ n, r }) => {
            const k = copy(n);
            delete k.parentId;
            k.otherParent = sp ? sp.id : null;
            p.rels.push({ id: k.id, type: 'hijo', rel: U.clamp(r.rel + 15, 40, 100), since: Math.max(0, c.age - k.age) });
          });
        } else if (c.age >= 25 && U.chance(0.55)) {
          const sp = MV.sys.rels.candidate(ng);
          p.rels.push({ id: sp.id, type: 'conyuge', rel: U.int(45, 85), since: c.age - U.int(1, Math.max(1, c.age - 22)) });
          p.counters.bodas = 1;
          if (c.age >= 28) {
            const n = U.pickW([0, 1, 2, 3], (k) => [25, 35, 28, 12][k]);
            for (let i = 0; i < n; i++) {
              const kid = MV.newNPC(ng, { age: U.int(0, Math.min(c.age - 20, 20)), last: p.last, parents: [{ look: p.look }, sp], money: 0, job: '-' });
              kid.otherParent = sp.id;
              p.rels.push({ id: kid.id, type: 'hijo', rel: U.int(55, 95), since: c.age - kid.age });
            }
          }
        }
      }
      if (c.age >= 18 && U.chance(0.7)) p.license = true;
      if (c.age >= 15) p.aspiration = null;
      ng.log.push({ age: c.age, year: ng.year, items: [] });
      MV.log(ng, `Ahora eres ${MV.fullName(p)}, ${grand ? U.gw(p.gender, 'nieto', 'nieta') : U.gw(p.gender, 'hijo', 'hija')} de ${MV.fullName(old)}. Generación ${ng.generation} de la dinastía ${ng.dynasty.name}.`, '🌳');
      MV.log(ng, cash > 0 || houseTxt ? `Heredaste ${U.money(cash)}${houseTxt}.` : 'No heredaste nada. Ni el reloj del abuelo.', '📜');
      if (p.job) MV.log(ng, `Trabajas como ${MV.sys.career.title(p)}.`, '💼');
      MV.ach.unlock(ng, 'heredero');
      MV.ach.check(ng);
      ng.rng = MV.rng.getState();
      return ng;
    }
  };
  MV.sys.legacy = legacy;

  MV.ev({
    id: 'elegir_aspiracion', manual: true, prison: 'any', icon: '🌠', scene: 'naturaleza', title: '¿Qué quieres de la vida?',
    text: 'Una noche, mirando el techo, te preguntas qué quieres lograr antes de morir. Tu aspiración te dará una gran recompensa si la cumples.',
    choices: [0, 1, 2].map((i) => ({
      t: (g, ctx) => { const A = MV.ASPIRATIONS.find((a) => a.id === ctx.opts[i]); return `${A.icon} ${A.name}: ${A.desc}`; },
      eff: (g, ctx) => { const A = MV.ASPIRATIONS.find((a) => a.id === ctx.opts[i]); g.p.aspiration = { id: A.id, done: false }; return `Tu aspiración de vida: ${A.name}.`; }
    })).concat([{ t: '🤷 No necesito metas', eff: { happy: 3, msg: 'Decidiste vivir sin metas. Muy zen. O muy vago.' } }])
  });
})(window.MV = window.MV || {});
