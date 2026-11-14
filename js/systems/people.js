/* Mil Vidas — envejecimiento y muerte de los NPC, herencias. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const NPC_CAUSES = ['causas naturales', 'un infarto', 'cáncer', 'un accidente de tránsito', 'neumonía',
    'un derrame cerebral', 'complicaciones de una operación', 'atragantarse con un caramelo',
    'una caída por las escaleras', 'una gripe mal curada', 'vejez', 'una apuesta con un toro'];

  /** Probabilidad anual de muerte por edad (base para jugador y NPC). */
  MV.deathRate = function (age) {
    if (age < 1) return 0.002;
    if (age < 15) return 0.0004;
    if (age < 40) return 0.0008;
    if (age < 55) return 0.003;
    if (age < 65) return 0.008;
    if (age < 75) return 0.022;
    if (age < 85) return 0.06;
    if (age < 95) return 0.15;
    if (age < 105) return 0.3;
    return 0.5;
  };

  const people = {
    yearly(g) {
      Object.values(g.people).forEach((n) => {
        if (!n.alive) return;
        n.age++;
        if (n.species !== 'humano') {
          if (n.age >= (n.lifespan || 12) || (!(MV.SPECIES[n.species] || {}).mythic && !n.talk && U.chance(0.01))) people.die(g, n, n.age >= (n.lifespan || 12) ? 'vejez' : 'un accidente misterioso');
          return;
        }
        if (n.age > 50) n.health = U.clamp(n.health - U.int(0, 3), 0, 100);
        let rate = MV.deathRate(n.age);
        if (n.health < 30) rate *= 2;
        if (n.health <= 0 || U.chance(rate)) {
          people.die(g, n, n.age > 75 ? U.pick(['causas naturales', 'vejez', 'un infarto', 'neumonía']) : U.pick(NPC_CAUSES));
          return;
        }
        // Vida de los NPC: trabajos, jubilación y dinero.
        if (n.age === 18 && !n.job) n.job = MV.randomJobTitle(n);
        if (n.age === 67 && n.job && !/Jubilad/.test(n.job)) n.job = U.gw(n.gender, 'Jubilado', 'Jubilada');
        if (n.age >= 18) n.money = Math.max(0, Math.round(n.money + U.int(-2000, 6000)));
      });
      people.familyLife(g);
    },

    /** Vida propia de los hijos adultos: se casan, tienen hijos (tus nietos) y cambian de trabajo. */
    familyLife(g) {
      if (!g.p.alive) return;
      MV.rels(g, 'hijo').forEach(({ n }) => {
        if (n.species !== 'humano' || n.age < 18) return;
        if (!n.married && n.age >= 22 && n.age <= 50 && U.chance(n.age <= 35 ? 0.1 : 0.04)) { people.marryKid(g, n); return; }
        const kids = people.grandkidsOf(g, n.id).length;
        if (n.married && n.age >= 22 && n.age <= 44 && kids < 4 && U.chance(0.14 - kids * 0.03)) { people.grandchild(g, n); return; }
        if (n.age < 65 && U.chance(0.04)) {
          const j = MV.randomJobTitle(n);
          if (j && j !== n.job) {
            n.job = j;
            const who = `Tu ${MV.relLabel('hijo', n).toLowerCase()} ${n.first}`;
            MV.log(g, /^Desemplead/.test(j) ? `${who} se quedó sin trabajo. Ya te pidió el sillón "por unas semanas".` : /^Am[oa] de casa/.test(j) ? `${who} ahora se dedica a la casa.` : `${who} ahora trabaja de ${j.toLowerCase()}.`, '💼');
          }
        }
      });
    },

    grandkidsOf(g, kidId) { return MV.rels(g, 'nieto', true).filter((x) => x.n.parentId === kidId); },

    /** Tu hijo o hija se casa: anuncia la boda (evento con opciones). */
    marryKid(g, n) {
      const sg = U.chance(0.9) ? (n.gender === 'f' ? 'm' : 'f') : n.gender;
      n.married = true;
      n.marriedAge = n.age;
      n.spouseGender = sg;
      n.spouseName = `${MV.randomFirst(sg, g.p.country)} ${MV.randomLast(g.p.country)}`;
      MV.EV.push(g, 'hijo_boda', { target: n.id, spouse: n.spouseName, sg }, true);
    },

    /** Nace un nieto: persona real con relación "nieto". */
    grandchild(g, kid) {
      const gc = MV.newNPC(g, { age: 0, last: kid.last, country: g.p.country, parents: [{ look: kid.look }, { look: MV.makeLook(kid.spouseGender || 'f') }], money: 0, job: '-' });
      gc.parentId = kid.id;
      MV.addRel(g, gc, 'nieto', U.int(60, 90));
      const first = !(g.p.counters.nietos > 0) && !MV.rels(g, 'nieto', true).some((x) => x.n.id !== gc.id);
      g.p.counters.nietos = (g.p.counters.nietos || 0) + 1;
      MV.fx.stat(g, 'happy', first ? 10 : 5);
      const abu = U.gw(g.p.gender, 'abuelo', 'abuela');
      MV.EV.info(g, { title: first ? `¡Eres ${abu}!` : U.gw(gc.gender, 'Otro nieto', 'Otra nieta'), icon: '👶', scene: 'hospital',
        text: `${kid.first} tuvo ${U.gw(gc.gender, 'un varón', 'una nena')}: ${gc.first}. ${first ? `Ahora eres ${abu} y ya das consejos que nadie pidió.` : U.pick(['Otra criatura para malcriar.', 'Ya perdiste la cuenta de los cumpleaños.', 'Tiene tu nariz, dicen. Pobre.'])}` });
      return gc;
    },

    die(g, n, cause) {
      n.alive = false;
      n.deathAge = n.age;
      n.cause = cause;
      const r = MV.relOf(g, n.id);
      if (!r || !g.p.alive) return;
      const label = MV.relLabel(r.type, n).toLowerCase();
      const close = ['padre', 'hijo', 'nieto', 'conyuge', 'hermano', 'pareja', 'abuelo', 'mascota'].includes(r.type);
      const love = r.rel / 100;
      if (r.type === 'mascota') {
        MV.fx.stat(g, 'happy', -Math.round(4 + 10 * love));
        MV.EV.info(g, { title: 'Adiós, compañero', text: `Tu ${label} ${n.first} murió a los ${n.age} años. ${U.pick(['Era el mejor.', 'Se fue a la granja de verdad.', 'Te dejó pelos en todos los sillones para que lo recuerdes.'])}`, icon: '🌈', scene: 'cementerio' });
        return;
      }
      if (r.type === 'enemigo' || r.type === 'ex') {
        MV.log(g, `Tu ${label} ${MV.fullName(n)} murió por ${cause}. ${r.type === 'enemigo' ? 'No vas a mentir: sonreíste un poquito.' : 'Fue raro enterarte por redes sociales.'}`, '🕯️');
        if (r.type === 'enemigo') MV.fx.stat(g, 'happy', 3);
        return;
      }
      MV.fx.stat(g, 'happy', -Math.round((close ? 8 : 3) + (close ? 18 : 6) * love));
      let inherit = 0;
      if (['padre', 'abuelo', 'conyuge'].includes(r.type) && n.money > 0) {
        const heirs = r.type === 'conyuge' ? 1 : 1 + MV.rels(g, 'hermano').length;
        const share = r.type === 'conyuge' ? 0.9 : r.type === 'padre' ? 0.8 : 0.35;
        inherit = Math.round((n.money * share / heirs) * (r.rel < 25 ? 0.2 : 1));
        if (inherit > 0) MV.fx.money(g, inherit);
        n.money = 0;
      }
      if (r.type === 'conyuge') g.p.flags.viudo = true;
      const tx = `Tu ${label} ${MV.fullName(n)} murió a los ${n.age} años por ${cause}.` +
        (inherit > 0 ? ` Heredaste ${U.money(inherit)}.` : '');
      if (close) MV.EV.info(g, { title: 'Descanse en paz', text: tx, icon: '🕯️', scene: 'cementerio' });
      else MV.log(g, tx, '🕯️');
    }
  };
  MV.sys.people = people;
})(window.MV = window.MV || {});
