/* Mil Vidas — crimen: delitos, arresto, juicio, cárcel, fuga y libertad condicional. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const crime = {
    commit(g, id) {
      const C = MV.CRIMES[id], p = g.p;
      if (!C) return 'Ese delito no existe (todavía).';
      if (p.age < C.age) return 'Eres demasiado joven para eso. Vuelve en unos años, delincuente en formación.';
      if (C.needs) for (const k of Object.keys(C.needs)) if (p.skills[k] < C.needs[k]) return `Necesitas ${MV.SKILLS[k].name} ${C.needs[k]}+ para intentarlo.`;
      if (C.needsJob && !p.job && !p.business) return 'Para el fraude fiscal primero necesitas ingresos que declarar mal.';
      p.counters.delitos = (p.counters.delitos || 0) + 1;
      MV.fx.stat(g, 'karma', C.karma || -(2 + C.sev * 2));
      const skill = p.skills.crimen / 100;
      const okChance = U.clamp(C.ok + skill * 0.35 + (C.smarts ? (p.stats.smarts - 50) / 200 : 0), 0.05, 0.95);
      MV.fx.skill(g, 'crimen', C.skill);
      if (U.chance(okChance)) {
        let loot = U.int(C.loot[0], C.loot[1]);
        if (id === 'fraude') loot = Math.round((p.job ? p.job.salary : p.business.value * 0.1) * U.float(0.1, 0.6));
        if (loot) MV.fx.money(g, loot);
        MV.fx.stat(g, 'happy', U.int(1, 5));
        MV.fx.stat(g, 'stress', 4);
        if (id === 'hackeo') MV.ach.unlock(g, 'hacker');
        if (C.art) MV.fx.skill(g, 'arte', 2);
        return loot ? `${C.icon} Salió bien: conseguiste ${U.money(loot)}. ${U.pick(['Nadie vio nada.', 'Te temblaban las piernas, pero lo lograste.', 'Fue sospechosamente fácil.'])}` :
          `${C.icon} Lo hiciste y nadie te vio. ${U.pick(['Tu obra es la comidilla del barrio.', 'Te sientes un artista incomprendido.'])}`;
      }
      if (U.chance(U.clamp(C.caught - skill * 0.25, 0.1, 0.9))) {
        crime.arrest(g, C.name, C.sev);
        return `${C.icon} Te atraparon con las manos en la masa. ${U.pick(['Las esposas aprietan.', 'El policía te miró con decepción paternal.', 'Un vecino filmó todo y ya es viral.'])}`;
      }
      MV.fx.stat(g, 'happy', -3);
      return `${C.icon} Salió mal, pero lograste escapar corriendo. ${U.pick(['Perdiste una zapatilla.', 'Corriste como nunca en la clase de gimnasia.', 'Te escondiste en un contenedor hasta la noche.'])}`;
    },

    arrest(g, crimeName, sev) {
      g.p.counters.arrestos = (g.p.counters.arrestos || 0) + 1;
      MV.EV.push(g, 'juicio', { crime: crimeName, sev: sev || 1 }, true);
    },

    /** Calcula la sentencia y encierra (o multa). */
    verdict(g, ctx, mitig, plea) {
      const p = g.p, sev = ctx.sev || 1;
      const guilty = plea || U.chance(U.clamp(0.82 - mitig, 0.08, 0.95));
      if (!guilty) {
        MV.fx.stat(g, 'happy', 15);
        return `¡Inocente! El jurado no encontró pruebas suficientes de "${ctx.crime.toLowerCase()}". Saliste caminando como si nada.`;
      }
      const R = MV.SENTENCE[sev] || [1, 3];
      let years = Math.round(U.int(R[0], R[1]) * (1 - mitig * 0.6) * (plea ? 0.5 : 1));
      if (p.record.length >= 2) years = Math.round(years * 1.3);
      p.record.push({ crime: ctx.crime, age: p.age, years });
      if (years <= 0) {
        const fine = sev * U.int(300, 2500);
        MV.fx.money(g, -fine);
        MV.fx.stat(g, 'happy', -6);
        return `Culpable de ${ctx.crime.toLowerCase()}. Te libraste con una multa de ${U.money(fine)} y 100 horas de servicio comunitario.`;
      }
      if (p.age < 18) years = Math.min(years, 3);
      crime.jail(g, years, ctx.crime);
      if (years >= 40) MV.ach.unlock(g, 'perpetua');
      return p.age < 18 ? `Culpable. Te enviaron a un centro de menores por ${years} año${years > 1 ? 's' : ''}.` :
        `Culpable de ${ctx.crime.toLowerCase()}. Condena: ${years} año${years > 1 ? 's' : ''} de prisión.`;
    },

    jail(g, years, crimeName) {
      const p = g.p;
      p.prison = { left: years, total: years, crime: crimeName, behavior: 50, gang: false, since: p.age };
      p.wanted = 0;
      MV.fx.stat(g, 'happy', -25);
      MV.ach.unlock(g, 'recluso');
      const partner = MV.partner(g);
      if (partner && partner.r.rel < 60 && years >= 3 && U.chance(0.5)) {
        const t = partner.n;
        MV.sys.rels.makeEx(g, partner.r);
        MV.log(g, `${t.first} te dejó: "no te voy a esperar ${years} años".`, '💔', 'bad');
      }
    },

    release(g, how) {
      const p = g.p;
      p.prison = null;
      MV.fx.stat(g, 'happy', 20);
      MV.EV.info(g, { title: 'Libertad', text: how || 'Cumpliste tu condena. Saliste con una bolsa de plástico y tus cordones de vuelta.', icon: '🕊️', scene: 'ciudad' });
    },

    yearly(g) {
      const p = g.p;
      if (p.wanted > 0 && !p.prison) {
        if (U.chance(0.18)) {
          const yrs = p.wanted + U.int(2, 5);
          crime.jail(g, yrs, 'Fuga de prisión');
          MV.EV.info(g, { title: 'Te atraparon', text: `La policía te encontró. Vuelves a la cárcel por ${yrs} años.`, icon: '🚨', scene: 'carcel' });
        } else MV.fx.stat(g, 'stress', 8);
        return;
      }
      if (!p.prison) return;
      const pr = p.prison;
      pr.left--;
      MV.fx.stat(g, 'happy', -U.int(2, 6));
      if (pr.gang) MV.fx.skill(g, 'crimen', 2);
      if (pr.left <= 0) { crime.release(g); return; }
      const served = pr.total - pr.left;
      if (pr.behavior >= 75 && served >= pr.total / 2 && U.chance(0.35)) {
        crime.release(g, `Te dieron la libertad condicional por buena conducta después de ${served} años. El guardia casi llora.`);
      }
    },

    /** Acciones dentro de la cárcel. */
    prisonActions(g) {
      const p = g.p, pr = p.prison;
      if (!pr) return [];
      return [
        { id: 'patio', icon: '🏋️', label: 'Entrenar en el patio', sub: '+salud, +respeto', limit: 2,
          run: (g) => { MV.fx.stat(g, 'health', U.int(2, 5)); MV.fx.stat(g, 'looks', U.int(0, 2)); MV.fx.skill(g, 'deporte', 2); return U.pick(['Levantaste pesas hechas con bolsas de arena. Te ves amenazante.', 'Hiciste 300 flexiones. Ya nadie te pide el postre.']); } },
        { id: 'libros_c', icon: '📚', label: 'Leer en la biblioteca', sub: '+inteligencia', limit: 2,
          run: (g) => { MV.fx.stat(g, 'smarts', U.int(1, 4)); pr.behavior = U.clamp(pr.behavior + 3, 0, 100); return U.pick(['Leíste un libro de derecho. Ahora eres el abogado del pabellón.', 'Leíste Guerra y Paz. Dos veces. Tienes tiempo.']); } },
        { id: 'conducta', icon: '😇', label: 'Portarte bien', sub: 'Acerca la libertad condicional', limit: 2,
          run: (g) => { pr.behavior = U.clamp(pr.behavior + U.int(6, 12), 0, 100); MV.fx.stat(g, 'karma', 2); return 'Limpiaste tu celda, saludaste a los guardias y ayudaste en la cocina.'; } },
        { id: 'taller', icon: '🧵', label: 'Trabajar en el taller', sub: 'Unos pesos y buena conducta', limit: 1,
          run: (g) => { MV.fx.money(g, U.int(200, 900)); pr.behavior = U.clamp(pr.behavior + 4, 0, 100); return 'Fabricaste patentes de autos durante meses. Ironía.'; } },
        { id: 'pandilla', icon: '🦹', label: pr.gang ? 'Subir en la pandilla' : 'Unirte a una pandilla', sub: 'Protección a cambio de favores', limit: 1,
          run: (g) => {
            if (!pr.gang) { if (U.chance(0.6)) { pr.gang = true; MV.fx.stat(g, 'karma', -5); pr.behavior = U.clamp(pr.behavior - 10, 0, 100); return 'Te aceptaron en la pandilla tras una iniciación que prefieres no recordar.'; } MV.fx.stat(g, 'health', -U.int(5, 15)); return 'La pandilla te rechazó. A golpes.'; }
            MV.fx.skill(g, 'crimen', 3); MV.fx.stat(g, 'karma', -3); return 'Hiciste "favores" para la pandilla. Ahora te respetan más.';
          } },
        { id: 'pelear', icon: '👊', label: 'Pelear con un recluso', sub: 'Gana respeto... o no', limit: 1,
          run: (g) => {
            pr.behavior = U.clamp(pr.behavior - 15, 0, 100);
            if (U.chance(0.4 + p.skills.deporte / 200 + p.stats.health / 400)) { MV.fx.stat(g, 'happy', 4); return 'Ganaste la pelea. El pabellón te mira distinto.'; }
            MV.fx.stat(g, 'health', -U.int(8, 20)); return 'Perdiste la pelea y terminaste en la enfermería.';
          } },
        { id: 'motin', icon: '🔥', label: 'Iniciar un motín', sub: 'Muy arriesgado', limit: 1, confirm: '¿Iniciar un motín?',
          run: (g) => {
            if (U.chance(0.1)) { crime.release(g, 'En el caos del motín te escapaste por la puerta de la cocina.'); p.wanted = pr ? pr.left : 3; MV.ach.unlock(g, 'fuga'); return 'El motín fue un caos y te escapaste.'; }
            if (U.chance(0.5)) { pr.left += U.int(2, 5); pr.total = Math.max(pr.total, pr.left); MV.fx.stat(g, 'health', -U.int(5, 15)); return 'El motín fracasó. Te sumaron años de condena.'; }
            MV.fx.stat(g, 'happy', 6); return 'Hubo un motín. Conseguiste que mejoraran la comida. Héroe del pabellón.';
          } },
        { id: 'fuga', icon: '🕳️', label: 'Intentar fugarte', sub: 'Elige un plan', limit: 1,
          opts: () => [
            { id: 'cuchara', icon: '🥄', label: 'Cavar un túnel con una cuchara', sub: 'Paciencia infinita' },
            { id: 'disfraz', icon: '👮', label: 'Disfrazarte de guardia', sub: 'Necesitas caradura' },
            { id: 'basura', icon: '🗑️', label: 'Esconderte en el camión de basura', sub: 'Huele mal, funciona a veces' },
            { id: 'soborno', icon: '💵', label: 'Sobornar a un guardia ($20.000)', sub: 'Si tienes el dinero' }
          ],
          run: (g, opt) => {
            let ch = { cuchara: 0.12, disfraz: 0.18 + p.skills.carisma / 300, basura: 0.22, soborno: 0.45 }[opt] || 0.15;
            if (opt === 'soborno') { if (p.money < 20000) return 'No tienes $20.000. El guardia se rió y te delató.'; MV.fx.money(g, -20000); }
            ch += p.stats.smarts / 400 + p.skills.crimen / 300;
            if (U.chance(ch)) {
              const left = pr.left;
              p.prison = null; p.wanted = left;
              MV.ach.unlock(g, 'fuga');
              MV.fx.stat(g, 'happy', 20);
              return { cuchara: 'Tras meses cavando con una cuchara, saliste por una alcantarilla. Eres libre (y buscado).', disfraz: 'Saliste por la puerta principal disfrazado de guardia. Hasta te saludaron.', basura: 'Te escondiste entre la basura y el camión te sacó de la cárcel. Libre y apestoso.', soborno: 'El guardia "se olvidó" de cerrar una puerta. Eres libre.' }[opt] || 'Te fugaste.';
            }
            pr.left += U.int(1, 4); pr.total = Math.max(pr.total, pr.left); pr.behavior = U.clamp(pr.behavior - 25, 0, 100);
            return 'Te atraparon en pleno intento de fuga. Más años y celda de aislamiento.';
          } },
        { id: 'apelar', icon: '⚖️', label: 'Apelar la condena', sub: 'Abogado: $8.000', limit: 1,
          run: (g) => {
            if (p.money < 8000) return 'No puedes pagar un abogado para la apelación.';
            MV.fx.money(g, -8000);
            if (U.chance(0.18)) { crime.release(g, '¡Ganaste la apelación! Un error de procedimiento te devolvió la libertad.'); return 'Ganaste la apelación.'; }
            if (U.chance(0.25)) { pr.left = Math.max(1, Math.round(pr.left * 0.7)); return 'El juez redujo tu condena. Algo es algo.'; }
            return 'Apelación rechazada. El juez ni levantó la vista.';
          } }
      ];
    },

    /** Intento de asesinato a un NPC con relación. */
    murder(g, targetId, method) {
      const p = g.p, n = MV.person(g, targetId);
      if (!n || !n.alive) return 'Esa persona ya no está entre nosotros.';
      const label = MV.relLabel((MV.relOf(g, n.id) || {}).type, n).toLowerCase();
      const M = { veneno: 0.55, accidente: 0.45, sicario: 0.65 }[method] || 0.4;
      MV.fx.stat(g, 'karma', -45);
      MV.fx.skill(g, 'crimen', 6);
      if (method === 'sicario') { if (p.money < 30000) return 'Un sicario cobra $30.000. Te faltan fondos para la maldad.'; MV.fx.money(g, -30000); }
      if (U.chance(M + p.skills.crimen / 300)) {
        MV.ach.unlock(g, 'asesino');
        p.counters.asesinatos = (p.counters.asesinatos || 0) + 1;
        MV.sys.people.die(g, n, 'circunstancias "misteriosas"');
        MV.fx.stat(g, 'stress', 15);
        if (U.chance(0.45 - p.skills.crimen / 400)) { crime.arrest(g, 'Homicidio', 5); return `Tu ${label} ${n.first} ya no está. Pero la policía encontró pruebas.`; }
        return `Tu ${label} ${n.first} sufrió un "lamentable accidente". Nadie sospecha nada... todavía.`;
      }
      if (U.chance(0.5)) { crime.arrest(g, 'Intento de homicidio', 4); return `El plan contra ${n.first} falló y te denunciaron.`; }
      const r = MV.relOf(g, n.id); if (r) { r.rel = 0; r.type = 'enemigo'; }
      return `El plan falló. ${n.first} sospecha de ti y ahora es tu enemig${n.gender === 'f' ? 'a' : 'o'}.`;
    }
  };
  MV.sys.crime = crime;

  MV.ev({
    id: 'juicio', manual: true, prison: 'any', icon: '⚖️', scene: 'tribunal', title: 'Juicio: {crime}',
    text: (g, ctx) => `Estás en el banquillo acusad${U.gw(g.p.gender, 'o', 'a')} de ${ctx.crime.toLowerCase()}. El fiscal sonríe demasiado. ¿Cómo te defiendes?`,
    choices: [
      { t: '🧑‍💼 Defensor público (gratis)', eff: (g, ctx) => crime.verdict(g, ctx, 0.05) },
      { t: (g, ctx) => `👔 Abogado privado (${U.money(6000 * ctx.sev)})`, when: (g, ctx) => g.p.money >= 6000 * ctx.sev,
        eff: (g, ctx) => { MV.fx.money(g, -6000 * ctx.sev); return crime.verdict(g, ctx, 0.3); } },
      { t: (g, ctx) => `🦈 Abogado estrella (${U.money(60000 * ctx.sev)})`, when: (g, ctx) => g.p.money >= 60000 * ctx.sev,
        eff: (g, ctx) => { MV.fx.money(g, -60000 * ctx.sev); return crime.verdict(g, ctx, 0.58); } },
      { t: '🗣️ Defenderme yo mismo', eff: (g, ctx) => crime.verdict(g, ctx, U.clamp((g.p.stats.smarts - 50) / 140 + g.p.skills.carisma / 300 - 0.05, -0.1, 0.45)) },
      { t: '🙇 Declararme culpable (condena reducida)', eff: (g, ctx) => crime.verdict(g, ctx, 0, true) },
      { t: (g, ctx) => `💵 Sobornar al juez (${U.money(25000 * ctx.sev)})`, when: (g, ctx) => g.p.money >= 25000 * ctx.sev,
        eff: (g, ctx) => {
          MV.fx.money(g, -25000 * ctx.sev); MV.fx.stat(g, 'karma', -10);
          if (U.chance(0.5)) return 'El juez aceptó el "regalo". Caso desestimado por "falta de pruebas".';
          return 'El juez era honesto (¡existen!). ' + crime.verdict(g, Object.assign({}, ctx, { crime: ctx.crime + ' e intento de soborno', sev: Math.min(5, ctx.sev + 1) }), 0);
        } }
    ]
  });
})(window.MV = window.MV || {});
