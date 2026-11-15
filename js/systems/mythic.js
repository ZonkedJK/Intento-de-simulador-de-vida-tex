/* Mil Vidas — mascotas míticas (guardián del bosque, dragoncito, unicornio, fantasma) y gatos callejeros. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  MV.MYTHIC_NAMES = {
    guardian: ['Musgo', 'Raíz', 'Bellota', 'Don Tronco', 'Helecho', 'Corteza'],
    dragon: ['Brasa', 'Tizón', 'Carbonilla', 'Chamusco', 'Fósforo'],
    unicornio: ['Destello', 'Don Cuerno', 'Nube', 'Purpurina', 'Refunfuño'],
    fantasma: ['Bu', 'Sábana', 'Don Ectoplasma', 'Susurro', 'Cadenita']
  };

  /** Gatos callejeros por edad: [mín, máx] años. */
  MV.STRAY_AGES = {
    gatito: { label: 'Un gatito', sub: 'Meses de vida, todo ojos', range: [0, 0], icon: '🐱' },
    joven: { label: 'Un gato joven', sub: '1 a 3 años, pura energía', range: [1, 3], icon: '🐈' },
    adulto: { label: 'Un gato adulto', sub: '4 a 9 años, ya sabe lo que quiere', range: [4, 9], icon: '🐈‍⬛' },
    anciano: { label: 'Un gato anciano', sub: '10 a 15 años, nadie adopta a los viejitos', range: [10, 15], icon: '😿' }
  };
  const STREET = ['vivía detrás de una panadería', 'dormía arriba de los autos estacionados', 'era el jefe del callejón', 'llegó con media oreja y mucha actitud',
    'robaba salchichas en la feria', 'maullaba en la puerta del supermercado', 'pasó el invierno en una caja de zapatos'];

  const mythic = {
    has(g, sp) { return MV.rels(g, 'mascota').some(({ n }) => n.species === sp); },

    /** Da una mítica (una de cada especie). Devuelve la mascota o null. */
    grant(g, sp) {
      const S = MV.SPECIES[sp];
      if (!S || !S.mythic || mythic.has(g, sp)) return null;
      const pet = MV.newPet(g, sp, { first: U.pick(MV.MYTHIC_NAMES[sp]), age: sp === 'fantasma' ? U.int(80, 300) : U.int(1, 30) });
      pet.gender = 'm';
      pet.lifespan = pet.age + U.int(S.life[0], S.life[1]);
      MV.addRel(g, pet, 'mascota', U.int(55, 80));
      MV.ach.check(g);
      return pet;
    },

    /** La mítica se va: deja tu vida y sus eventos pendientes desaparecen de la cola. */
    leave(g, sp, text) {
      const x = MV.rels(g, 'mascota').find(({ n }) => n.species === sp);
      if (!x) return;
      MV.removeRel(g, x.n.id);
      const keep = (it) => !(it.ctx && it.ctx.target === x.n.id);
      g.queue = g.queue.filter(keep);
      if (g.later) g.later = g.later.filter(keep);
      MV.EV.info(g, { title: 'Se fue', icon: MV.SPECIES[sp].icon, text: text.replace('{n}', x.n.first) });
    },

    /** Un gato callejero de la edad elegida (gatito, joven, adulto o anciano). */
    strayCat(g, group) {
      const A = MV.STRAY_AGES[group] || MV.STRAY_AGES.joven;
      const age = U.int(A.range[0], A.range[1]);
      const pet = MV.newPet(g, 'gato', { age });
      pet.lifespan = Math.max(pet.lifespan, age + U.int(1, 4));
      pet.street = U.pick(STREET);
      return pet;
    },

    yearly(g) {
      const p = g.p;
      const crimes = p.counters.delitos || 0;
      const crimed = p.flags.mythCrimes != null && crimes > p.flags.mythCrimes;
      p.flags.mythCrimes = crimes;
      if (!p.alive) return;
      // Guardián del bosque
      if (mythic.has(g, 'guardian')) {
        if (p.karma < -30) mythic.leave(g, 'guardian', '{n}, tu guardián del bosque, se fue ofendido. Dijo que habla por los árboles y que los árboles ya no quieren hablar contigo.');
        else if (crimed) mythic.leave(g, 'guardian', '{n} se enteró de tu delito. Juntó sus bellotas y se fue al bosque sin despedirse.');
        else if (p.karma >= 0) MV.fx.stat(g, 'karma', 1);
      } else if (p.assets.some((a) => MV.sys.island.isIsland(a) && a.project && a.project.type === 'reserva') && U.chance(0.1)) {
        const pet = mythic.grant(g, 'guardian');
        if (pet) MV.EV.info(g, { title: 'Alguien salió del bosque', icon: '🌳', scene: 'naturaleza', text: `En tu reserva natural apareció una criaturita de musgo con cara de pocos amigos. Se presentó como ${pet.first}, guardián del bosque, y anunció que va a vigilar que cuides los árboles. Se mudó contigo.` });
      }
      // Unicornio gruñón
      if (mythic.has(g, 'unicornio')) {
        if (p.karma < 40) mythic.leave(g, 'unicornio', '{n}, tu unicornio gruñón, se fue galopando. Dijo que tu aura ya no combina con su crin.');
        else MV.fx.stat(g, 'happy', 2);
      } else if (p.karma >= 60 && U.chance(0.03)) {
        const pet = mythic.grant(g, 'unicornio');
        if (pet) MV.EV.info(g, { title: 'Una noche brillante', icon: '🦄', scene: 'naturaleza', text: `Una noche apareció un unicornio en tu jardín. Se llama ${pet.first}, se queja de todo y deja purpurina en la alfombra, pero eligió quedarse contigo por tu buen corazón.` });
      }
      // Fantasma doméstico
      const haunted = p.assets.some((a) => a.type === 'casa' && a.haunted);
      if (mythic.has(g, 'fantasma')) {
        if (!haunted) mythic.leave(g, 'fantasma', '{n}, tu fantasma doméstico, se quedó en la casa embrujada. Dice que no es personal: está atado a las cañerías.');
        else {
          MV.fx.stat(g, 'stress', -3);
          if (U.chance(0.25)) MV.log(g, U.pick(['Tu fantasma asustó a las visitas. Tu suegra no vuelve más. Gracias, fantasma.', 'Tu fantasma movió las sillas durante la cena con amigos. Pensaron que fue un truco tuyo.', 'Tu fantasma te dejó el café servido. Frío, pero el gesto cuenta.']), '👻');
        }
      } else if (haunted && U.chance(0.1)) {
        const pet = mythic.grant(g, 'fantasma');
        if (pet) MV.EV.info(g, { title: 'Ruidos en el ático', icon: '👻', scene: 'hogar', text: `Las cadenas no eran las cañerías: es ${pet.first}, un fantasma de ${pet.age} años. Es tímido, ordena las medias y te hace compañía de noche.` });
      }
      // Dragoncito de bolsillo
      if (mythic.has(g, 'dragon')) {
        if (U.chance(0.12)) {
          const amt = U.int(300, 3000);
          MV.fx.money(g, -amt);
          MV.log(g, `Tu dragoncito estornudó y quemó ${U.pick(['las cortinas', 'el sillón', 'la ropa recién lavada', 'el auto del vecino'])}. Pagaste ${U.money(amt)}.`, '🐉');
        } else if (U.chance(0.1)) {
          MV.fx.stat(g, 'fame', U.int(2, 5));
          MV.log(g, 'Un video de tu dragoncito encendiendo las velas de una torta se hizo viral. Medio mundo quiere uno.', '🐉');
        }
      }
    }
  };
  MV.sys.mythic = mythic;

  // — Evento: el mercader misterioso de los viajes —
  MV.ev({ id: 'mercader', manual: true, icon: '🧙', scene: 'playa', title: 'Un mercader misterioso',
    text: 'En un callejón del viaje, un mercader con capa te muestra una jaula tapada. Adentro algo ronca y echa humo. "Un dragoncito de bolsillo", susurra. "Solo para gente con buen gusto y buen seguro de hogar."',
    choices: [
      { t: 'Comprarlo ($50.000)', when: (g) => g.p.money >= 50000 && !mythic.has(g, 'dragon'), eff: (g) => {
        MV.fx.money(g, -50000);
        const pet = mythic.grant(g, 'dragon');
        if (!pet) return 'El mercader desapareció con tu dinero. Te queda una jaula vacía y una lección.';
        MV.fx.stat(g, 'happy', 8);
        return `Compraste el dragoncito y lo llamaste ${pet.first}. En el avión de vuelta quemó la revista del asiento.`;
      } },
      { t: 'Regatear', eff: (g) => { MV.fx.stat(g, 'happy', -1); return 'Ofreciste la mitad. El mercader se rio, chasqueó los dedos y desapareció en una nube de humo violeta.'; } },
      { t: 'Seguir de largo', eff: { msg: 'Seguiste de largo. Esa noche soñaste con alas chiquitas.' } }
    ] });

  // — Evento: un gato callejero te sigue hasta casa —
  MV.ev({ id: 'gato_sigue', age: [6, 100], w: 0.6, icon: '🐈', title: 'Un gato te sigue',
    text: (g, ctx) => {
      if (ctx.group == null) ctx.group = U.pick(Object.keys(MV.STRAY_AGES));
      return `${MV.STRAY_AGES[ctx.group].label} te siguió desde la esquina hasta tu puerta. Te mira como si ya viviera ahí.`;
    },
    choices: [
      { t: 'Adoptarlo', eff: (g, ctx) => {
        const pet = mythic.strayCat(g, ctx.group || 'joven');
        MV.addRel(g, pet, 'mascota', U.int(65, 90));
        MV.sys.talkcat.noteRescue(g);
        MV.fx.stat(g, 'happy', 6); MV.fx.stat(g, 'karma', ctx.group === 'anciano' ? 6 : 3);
        MV.ach.check(g);
        return `Le abriste la puerta y lo llamaste ${pet.first}. Por las marcas, ${pet.street}. Ya eligió tu almohada.`;
      } },
      { t: 'Darle de comer', eff: { karma: 2, happy: 1, msg: 'Le diste atún. Vuelve todos los días a la misma hora y te juzga si llegas tarde.' } },
      { t: 'Seguir de largo', eff: { msg: 'Cerraste la puerta. Se quedó en el felpudo un rato y después se fue a buscar a alguien con mejor corazón.' } }
    ] });
})(window.MV = window.MV || {});
