/* Mil Vidas — relaciones: desgaste anual, romance, matrimonio, hijos y acciones sociales. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const ROMANTIC = ['pareja', 'conyuge', 'amante'];

  const rels = {
    /** ¿La orientación del jugador encaja con el género de la otra persona? */
    attracted(p, n) {
      if (p.orientation === 'bi') return true;
      return p.orientation === 'homo' ? n.gender === p.gender : n.gender !== p.gender;
    },

    /** Romance permitido: ambos adultos, o ambos adolescentes (14-17) de edad parecida. */
    canRomance(g, n, r) {
      const p = g.p;
      if (!n || !n.alive || n.species !== 'humano') return false;
      if (r && (MV.FAMILY.includes(r.type) || ROMANTIC.includes(r.type))) return false;
      if (p.age < 14 || n.age < 14) return false;
      const minor = p.age < 18 || n.age < 18;
      if (minor && (p.age >= 18 || n.age >= 18 || Math.abs(p.age - n.age) > 2)) return false;
      return rels.attracted(p, n);
    },

    fertile(g, n) {
      const p = g.p;
      if (!n || n.gender === p.gender || p.age < 18 || n.age < 18) return false;
      const woman = p.gender === 'f' ? p : n;
      return woman.age <= 45;
    },

    /** Genera una persona que podría salir con el jugador. */
    candidate(g, o) {
      const p = g.p;
      o = o || {};
      const gender = p.orientation === 'bi' ? U.pick(['m', 'f']) : p.orientation === 'homo' ? p.gender : (p.gender === 'm' ? 'f' : 'm');
      const age = p.age < 18 ? U.clamp(p.age + U.int(-1, 1), 14, 17) : U.clamp(p.age + U.int(-7, 7), 18, 95);
      return MV.newNPC(g, { gender, age, country: o.country || p.country, looks: o.looks, money: age >= 18 ? U.int(0, 60000) : 0 });
    },

    startDating(g, n) {
      const cur = MV.partner(g);
      MV.addRel(g, n, cur ? 'amante' : 'pareja', U.int(55, 85));
      MV.fx.stat(g, 'happy', 8);
      return cur ? `Empezaste una aventura secreta con ${n.first}. ${cur.n.first} no sabe nada... todavía.` : `¡Ahora sales con ${n.first}!`;
    },

    marry(g, n) {
      const r = MV.relOf(g, n.id);
      r.type = 'conyuge'; r.since = g.p.age;
      g.p.counters.bodas = (g.p.counters.bodas || 0) + 1;
      MV.ach.unlock(g, 'casado');
      MV.fx.stat(g, 'happy', 15);
      // Patrimonio compartido (una parte).
      if (n.money > 0) { const share = Math.round(n.money * 0.5); MV.fx.money(g, share); n.money -= share; }
    },

    divorce(g, n, theyLeft) {
      const r = MV.relOf(g, n.id);
      if (!r) return '';
      rels.makeEx(g, r); r.rel = U.clamp(r.rel - 30, 0, 100);
      g.p.counters.divorcios = (g.p.counters.divorcios || 0) + 1;
      MV.fx.stat(g, 'happy', -15);
      let lost = 0;
      if (g.p.money > 0) { lost = Math.round(g.p.money * U.float(0.2, 0.5)); MV.fx.money(g, -lost); n.money += lost; }
      MV.ach.check(g);
      return `${theyLeft ? `${n.first} pidió el divorcio.` : `Te divorciaste de ${n.first}.`}${lost ? ` El acuerdo te costó ${U.money(lost)}.` : ''}`;
    },

    /** Enseña un truco a una mascota. Aprende según la relación, su salud y su viveza. */
    teachTrick(g, n, r) {
      const all = MV.PET_TRICKS[n.species] || MV.PET_TRICKS.perro;
      n.tricks = n.tricks || [];
      const next = all.find((t) => !n.tricks.includes(t));
      if (!next) return `${n.first} ya sabe todos los trucos de su especie. Ahora te enseña trucos a ti.`;
      const hard = all.indexOf(next) / all.length;
      r.rel = U.clamp(r.rel + U.int(2, 5), 0, 100);
      if (U.chance(U.clamp(0.3 + r.rel / 250 + n.health / 400 + (n.smarts || 30) / 300 - hard * 0.25, 0.1, 0.9))) {
        n.tricks.push(next);
        MV.fx.stat(g, 'happy', 3);
        return `¡${n.first} aprendió a ${next}! ${U.pick(['Lo festejaste como un gol.', 'Le diste tantos premios que ahora está gordit' + U.gw(n.gender, 'o', 'a') + '.', 'Ya lo filmaste para las redes.'])}`;
      }
      return U.pick([`Intentaste enseñarle a ${n.first} a ${next}. Te miró como si el animal fueras tú.`, `${n.first} no aprendió a ${next}, pero se comió todos los premios.`, `Una hora practicando "${next}". ${n.first} se durmió en la mitad.`]);
    },

    /** Concurso de mascotas: $50 de inscripción; trucos, salud, relación y azar deciden el puesto. */
    petShow(g, n, r) {
      const p = g.p;
      if (p.money < 50) return 'No te alcanza para la inscripción.';
      MV.fx.money(g, -50);
      const score = (n.tricks || []).length * 12 + n.health * 0.3 + r.rel * 0.2 + (n.looks || 50) * 0.15 + U.int(0, 35);
      const place = score >= 100 ? 1 : score >= 84 ? 2 : score >= 70 ? 3 : 0;
      const sp = (MV.SPECIES[n.species] || { name: 'mascota' }).name.toLowerCase();
      if (!place) return U.pick([`${n.first} se distrajo con un jurado y no ganó nada. Te costó $50 y un poco de dignidad.`, `En el concurso, ${n.first} hizo todo menos lo que practicaron. El público aplaudió por lástima.`, `Ganó ${(MV.SPECIES[n.species] || {}).art || 'un'} ${sp} con moño. ${n.first} y tú vuelven a casa en silencio.`]);
      const prize = place === 1 ? U.int(1500, 5000) : place === 2 ? U.int(600, 1500) : U.int(300, 600);
      MV.fx.money(g, prize);
      n.trophies = (n.trophies || 0) + 1;
      r.rel = U.clamp(r.rel + 5, 0, 100);
      MV.fx.stat(g, 'happy', place === 1 ? 8 : 4);
      if (place === 1) { n.wins = (n.wins || 0) + 1; MV.fx.stat(g, 'fame', 1); MV.ach.unlock(g, 'mascota_campeona'); }
      return `${['', '🥇 ¡Primer puesto!', '🥈 Segundo puesto.', '🥉 Tercer puesto.'][place]} ${n.first} ${(n.tricks || []).length ? `deslumbró con "${U.pick(n.tricks)}"` : 'se ganó al jurado con pura simpatía'}. Premio: ${U.money(prize)}.`;
    },

    /** Probabilidad de embarazo sin protección (con protección es 0). */
    UNPROTECTED_PREGNANCY: 0.6,

    /** Resuelve la elección de protección: embarazo, ETS en lo casual, y qué son después. */
    afterNight(g, ctx, safe) {
      const n = MV.person(g, ctx.target);
      if (!n || !n.alive) return 'La noche terminó antes de empezar.';
      const pregnant = !safe && rels.fertile(g, n) && U.chance(rels.UNPROTECTED_PREGNANCY);
      if (ctx.casual && U.chance(safe ? 0.01 : 0.12)) MV.sys.health.add(g, 'ets');
      // Al frente de la cola, en orden inverso: primero "a la mañana siguiente", después la noticia.
      if (pregnant) MV.EV.push(g, 'embarazo_sorpresa', { target: n.id }, true);
      if (ctx.casual) MV.EV.push(g, 'despues_noche', { target: n.id }, true);
      return safe ? U.pick([`Usaron protección con ${n.first}. Responsables y románticos a la vez. Fundido a negro.`, 'Protección primero, pasión después. Tu profesor de biología estaría orgulloso. Fundido a negro.'])
        : U.pick([`Decidieron arriesgarse con ${n.first}. Fundido a negro... y que sea lo que el destino quiera.`, 'Sin protección. Fundido a negro. Tu yo del futuro tomó nota.']);
    },

    /** Convierte la relación en ex y deja de convivir si vivían juntos. */
    makeEx(g, r) {
      if (!r) return;
      r.type = 'ex';
      if (g.p.flags.convive === r.id) delete g.p.flags.convive;
    },

    breakUp(g, n) {
      const r = MV.relOf(g, n.id);
      if (!r) return '';
      rels.makeEx(g, r); r.rel = U.clamp(r.rel - 25, 0, 100);
      MV.fx.stat(g, 'happy', -6);
      return `Terminaste con ${n.first}. ${U.pick(['Lloró en tu cara.', 'Te devolvió tu buzo, sin lavar.', 'Dijo "ya lo veía venir".', 'Cambió su estado a "liberad' + U.gw(n.gender, 'o', 'a') + '".'])}`;
    },

    /** Nacimiento de un hijo. Devuelve el texto. */
    birth(g, partner, adopted) {
      const p = g.p;
      const make = () => {
        const gender = U.pick(['m', 'f']);
        const kid = MV.newNPC(g, {
          gender, age: adopted ? U.int(0, 6) : 0, last: p.last, country: p.country,
          parents: adopted ? null : [{ look: p.look }, partner || { look: p.look }],
          smarts: U.clamp(Math.round(((p.stats.smarts + (partner ? partner.smarts : 50)) / 2) + U.int(-25, 25)), 5, 100),
          looks: U.clamp(Math.round(((p.stats.looks + (partner ? partner.looks : 50)) / 2) + U.int(-25, 25)), 5, 100),
          money: 0, job: '-'
        });
        kid.otherParent = partner ? partner.id : null;
        MV.addRel(g, kid, 'hijo', U.int(80, 100));
        return kid;
      };
      const twins = !adopted && U.chance(0.03);
      const kids = twins ? [make(), make()] : [make()];
      p.counters.hijos = (p.counters.hijos || 0) + kids.length;
      MV.fx.stat(g, 'happy', 15);
      MV.fx.stat(g, 'stress', 10);
      if (twins) MV.ach.unlock(g, 'gemelos');
      MV.ach.check(g);
      const names = kids.map((k) => `${k.first} (${U.gw(k.gender, 'niño', 'niña')})`).join(' y ');
      if (adopted) return `Adoptaste a ${names}. Bienvenid${U.gw(kids[0].gender, 'o', 'a')} a la familia.`;
      return twins ? `¡Gemelos! Nacieron ${names}. Duermes 2 horas por noche desde entonces.` :
        `${p.gender === 'f' ? 'Diste a luz a' : (partner ? `${partner.first} dio a luz a` : 'Nació')} ${names}.`;
    },

    yearly(g) {
      const p = g.p;
      p.rels.forEach((r) => { r.acts = {}; });
      MV.rels(g).forEach(({ r, n }) => {
        if (r.type === 'mascota') return;
        const decay = ['amigo', 'companero', 'pareja', 'amante'].includes(r.type) ? U.int(0, 4) : r.type === 'conyuge' ? U.int(0, 3) : U.int(0, 2);
        r.rel = U.clamp(r.rel - decay, 0, 100);
        if (r.type === 'companero' && !p.job && U.chance(0.4)) { r.type = r.rel > 60 ? 'amigo' : 'conocido'; }
        if (r.type === 'amigo' && r.rel < 8 && U.chance(0.5)) { MV.log(g, `Tú y ${n.first} dejaron de hablarse. La amistad murió por abandono.`, '🍂'); r.type = 'conocido'; }
      });
      p.rels = p.rels.filter((r) => r.type !== 'conocido');
      // Parejas que se van
      const part = MV.partner(g);
      if (part && part.r.rel < 18 && U.chance(0.35)) {
        if (part.r.type === 'conyuge') MV.EV.info(g, { title: 'Divorcio', text: rels.divorce(g, part.n, true), icon: '💔', scene: 'tribunal' });
        else { rels.makeEx(g, part.r); MV.EV.info(g, { title: 'Te dejaron', text: `${part.n.first} te dejó. Dijo que necesitaba "encontrarse". Se encontró con otra persona.`, icon: '💔', scene: 'hogar' }); MV.fx.stat(g, 'happy', -10); }
      }
      // Infidelidad descubierta
      const lover = MV.rels(g, 'amante')[0];
      const cur = MV.partner(g);
      if (lover && cur && U.chance(0.2)) MV.EV.push(g, 'infiel_descubierto', { target: cur.n.id, lover: lover.n.first });
      // Bebé en camino
      if (p.flags.buscandoBebe && cur && rels.fertile(g, cur.n)) {
        if (U.chance(0.45)) { delete p.flags.buscandoBebe; MV.EV.info(g, { title: '¡Bebé!', text: rels.birth(g, cur.n), icon: '👶', scene: 'hospital' }); }
      } else delete p.flags.buscandoBebe;
      // Hijos que crecen
      MV.rels(g, 'hijo').forEach(({ n }) => {
        if (n.age === 6) MV.log(g, `${n.first} empezó la primaria.`, '🎒');
        if (n.age === 18) MV.log(g, `${n.first} cumplió 18 y ${U.pick(['se fue de casa.', 'dice que se va de casa, pero sigue en su cuarto.', 'se fue a estudiar lejos.'])}`, '🎂');
      });
    },

    /** Regalos que puedes pagar. */
    giftOptions(g, relId) { return MV.GIFTS.filter((x) => x.price <= g.p.money && relId); },

    /** Hace un regalo y devuelve el texto del resultado. */
    giveGift(g, relId, giftId) {
      const n = g.people[relId], r = MV.relOf(g, relId), gift = MV.GIFTS.find((x) => x.id === giftId);
      if (!n || !r || !gift) return 'Ese regalo no está disponible.';
      if (g.p.money < gift.price) return `No te alcanza para ${gift.name.toLowerCase()}.`;
      MV.fx.money(g, -gift.price);
      const react = MV.giftReaction(n, gift, r.type);
      const base = 3 + Math.log10(gift.price + 1) * 3 * (n.traits.includes('tacaño') ? 1.3 : 1);
      const d = react === 'hate' ? -U.int(5, 12) : Math.round(react === 'love' ? base * 1.6 + 3 : react === 'like' ? base : base * 0.5);
      r.rel = U.clamp(r.rel + d, 0, 100);
      let extra = '';
      if (gift.special === 'pet' && react !== 'hate') {
        const home = r.type === 'conyuge' || g.p.flags.convive === n.id || (r.type === 'hijo' && n.age < 18) || (r.type === 'padre' && g.p.age < 18);
        if (home) { const pet = MV.newPet(g, 'perro', { age: 0 }); MV.addRel(g, pet, 'mascota', U.int(60, 85)); MV.ach.check(g); extra = ` Ahora en casa hay un perrito: ${n.first} le puso ${pet.first}.`; }
        else extra = ` Ahora ${n.first} tiene un perrito y te manda fotos todos los días.`;
      }
      if (gift.special === 'trip' && react !== 'hate') { MV.fx.stat(g, 'happy', 3); extra = ` ${n.first} volvió broncead${U.gw(n.gender, 'o', 'a')} y con un imán para tu heladera.`; }
      if (gift.special === 'money') n.money = (n.money || 0) + Math.round(gift.price * 0.3);
      const line = {
        love: [`¡A ${n.first} le encantó! Te abrazó tan fuerte que crujió algo.`, `${n.first} lloró de emoción. Era justo lo que quería.`],
        like: [`A ${n.first} le gustó mucho. Gracias sinceras.`, `${n.first} sonrió y lo guardó con cuidado.`],
        meh: [`${n.first} dijo "gracias" con la misma emoción que un lunes.`, `${n.first} lo aceptó por educación. Ya está pensando en a quién regalárselo.`],
        hate: [`A ${n.first} no le gustó nada. Silencio incómodo.`, `${n.first} te miró como si le hubieras regalado una piedra.`]
      }[react];
      return `Le regalaste ${gift.name.toLowerCase()} (${U.money(gift.price)}). ${U.pick(line)}${extra}`;
    },

    /** Acciones disponibles con una relación concreta. */
    actions(g, r, n) {
      const p = g.p, list = [];
      if (!n || !n.alive) return list;
      const t = r.type, adult = p.age >= 18, human = n.species === 'humano';
      const A = (o) => list.push(o);
      if (!human) {
        A({ id: 'jugar', icon: '🎾', label: 'Jugar', sub: '+relación', limit: 2, run: (g) => { r.rel = U.clamp(r.rel + U.int(4, 10), 0, 100); MV.fx.stat(g, 'happy', U.int(2, 5)); return U.pick([`Jugaste con ${n.first}. Te mordió con cariño.`, `${n.first} trajo la pelota 40 veces. Tú te cansaste primero.`, `${n.first} te ignoró olímpicamente, pero se notaba feliz.`]); } });
        if (n.species === 'perro') A({ id: 'pasear', icon: '🦮', label: 'Pasear', sub: '+salud para ambos', limit: 2, run: (g) => { r.rel = U.clamp(r.rel + U.int(3, 8), 0, 100); MV.fx.stat(g, 'health', U.int(1, 3)); n.health = U.clamp(n.health + 3, 0, 100); return `Paseaste a ${n.first}. Olfateó cada poste del barrio.`; } });
        if (n.age >= 1) A({ id: 'truco', icon: '🎓', label: 'Enseñarle un truco', sub: (n.tricks || []).length ? `Sabe ${n.tricks.length} truco${n.tricks.length === 1 ? '' : 's'}` : 'Todavía no sabe ninguno', limit: 1, run: (g) => rels.teachTrick(g, n, r) });
        if (n.age >= 1) A({ id: 'concurso', icon: '🏆', label: 'Anotarl' + U.gw(n.gender, 'o', 'a') + ' en un concurso', sub: '$50 de inscripción. Premios en efectivo', limit: 1, when: () => p.money >= 50, run: (g) => rels.petShow(g, n, r) });
        A({ id: 'vet', icon: '🩺', label: 'Llevar al veterinario', sub: '$250', limit: 1, run: (g) => { MV.fx.money(g, -250); n.health = U.clamp(n.health + U.int(10, 25), 0, 100); n.lifespan = (n.lifespan || 10) + (U.chance(0.3) ? 1 : 0); return `${n.first} fue al veterinario. Odia al veterinario.`; } });
        MV.sys.talkcat.actions(g, r, n).forEach(A);
        A({ id: 'regalar_mascota', icon: '📦', label: 'Dar en adopción', sub: 'Adiós', limit: 1, confirm: `¿Dar en adopción a ${n.first}?${n.talk ? ' Ningún otro gato volverá a hablarte.' : ''}`,
          run: (g) => { const bye = n.talk ? MV.sys.talkcat.adopted(g, n) : null; MV.removeRel(g, n.id); MV.fx.stat(g, 'karma', -5); MV.fx.stat(g, 'happy', -6); return bye || `Diste en adopción a ${n.first}. Te miró por última vez con ojos de traición.`; } });
        return list.filter((a) => !a.when || a.when(g));
      }
      A({ id: 'conversar', icon: '💬', label: 'Conversar', sub: '+relación', limit: 2, run: (g) => { r.rel = U.clamp(r.rel + U.int(1, 6), 0, 100); return U.pick([`Hablaste con ${n.first} sobre la vida. ${U.cap(MV.relLabel(t, n).toLowerCase())} feliz.`, `Charlaron de todo y de nada con ${n.first}.`, `${n.first} te contó un chisme jugoso.`, `Hablaron del clima durante 20 minutos. Intensísimo.`]); } });
      A({ id: 'tiempo', icon: '🫂', label: 'Pasar tiempo juntos', sub: '+relación, +felicidad', limit: 2, run: (g) => { r.rel = U.clamp(r.rel + U.int(4, 10), 0, 100); MV.fx.stat(g, 'happy', U.int(2, 5)); return U.pick([`Pasaste la tarde con ${n.first}. ${U.pick(['Vieron una película malísima.', 'Cocinaron algo incomible y se rieron mucho.', 'Fueron a caminar por el parque.', 'Jugaron cartas y hubo trampas.'])}`]); } });
      A({ id: 'cumplido', icon: '🌹', label: 'Hacer un cumplido', sub: 'Endulza el día', limit: 1, run: (g) => { if (U.chance(0.8)) { r.rel = U.clamp(r.rel + U.int(2, 6), 0, 100); return `Le dijiste a ${n.first} que ${U.pick(['tiene una sonrisa preciosa', 'es una persona increíble', 'cocina mejor que nadie', 'su corte de pelo le queda genial'])}. Se sonrojó.`; } r.rel = U.clamp(r.rel - 3, 0, 100); return `Intentaste decirle un cumplido a ${n.first} pero sonó raro. Muy raro.`; } });
      A({ id: 'regalo', icon: '🎁', label: 'Hacer un regalo', sub: 'Elige entre más de 35 regalos', limit: 1, ui: 'gift', relId: n.id,
        opts: (g) => rels.giftOptions(g, n.id).map((x) => ({ id: x.id, icon: x.icon, label: x.name, sub: U.money(x.price) })),
        run: (g, giftId) => rels.giveGift(g, n.id, giftId) });
      if (['padre', 'abuelo', 'hermano', 'conyuge', 'amigo', 'hijo'].includes(t) && n.age >= 18) A({ id: 'pedir_dinero', icon: '💸', label: 'Pedir dinero', sub: 'Depende de la relación', limit: 1,
        run: (g) => {
          const generous = n.traits.includes('generoso') ? 0.25 : n.traits.includes('tacaño') ? -0.3 : 0;
          if (n.money > 100 && U.chance(U.clamp(r.rel / 120 + generous - (p.age > 30 ? 0.2 : 0), 0.05, 0.9))) {
            const amt = Math.max(20, Math.round(Math.min(n.money * U.float(0.02, 0.15), 50000)));
            n.money -= amt; MV.fx.money(g, amt); r.rel = U.clamp(r.rel - 3, 0, 100);
            return `${n.first} te dio ${U.money(amt)}. ${U.pick(['"No le digas a nadie."', '"La última vez, eh."', 'Lo anotó en una libreta.'])}`;
          }
          r.rel = U.clamp(r.rel - 6, 0, 100);
          return `${n.first} se negó. ${U.pick(['"¿Te crees que soy un banco?"', '"Consigue un trabajo."', 'Se hizo el dormido.'])}`;
        } });
      if (t === 'hijo') {
        if (n.age < 13) A({ id: 'jugar_hijo', icon: '🧸', label: 'Jugar juntos', sub: '+relación', limit: 2, run: (g) => { r.rel = U.clamp(r.rel + U.int(5, 10), 0, 100); MV.fx.stat(g, 'happy', 4); n.smarts = U.clamp(n.smarts + 1, 0, 100); return `Jugaste con ${n.first}. ${U.pick(['Construyeron un fuerte de almohadas.', 'Te obligó a ser el caballo. Te duele la espalda.', 'Perdiste a las escondidas a propósito. Bueno, no tan a propósito.'])}`; } });
        if (n.age < 9) A({ id: 'cuento', icon: '📖', label: 'Leerle un cuento', sub: '+inteligencia del niño', limit: 1, run: (g) => { r.rel = U.clamp(r.rel + 5, 0, 100); n.smarts = U.clamp(n.smarts + U.int(1, 3), 0, 100); return `Le leíste un cuento a ${n.first}. Se durmió en la página 2. Tú en la 3.`; } });
        if (n.age >= 5) A({ id: 'castigar', icon: '🚫', label: 'Castigar', sub: 'Disciplina', limit: 1, run: (g) => { r.rel = U.clamp(r.rel - U.int(5, 12), 0, 100); n.smarts = U.clamp(n.smarts + 1, 0, 100); return `Castigaste a ${n.first} sin pantallas. ${U.pick(['Te dijo que eres el peor padre/madre del universo.', 'Lloró tres horas.', 'Se encerró en su cuarto a componer una canción sobre ti.'])}`; } });
        A({ id: 'dar_dinero', icon: '💵', label: 'Darle dinero', sub: 'Ayuda económica', limit: 1,
          opts: () => [{ id: 50, icon: '🪙', label: '$50' }, { id: 1000, icon: '💵', label: '$1.000' }, { id: 20000, icon: '💰', label: '$20.000' }].filter((o) => p.money >= o.id),
          run: (g, amt) => { amt = +amt || 50; MV.fx.money(g, -amt); n.money += amt; r.rel = U.clamp(r.rel + Math.round(3 + Math.log10(amt) * 2), 0, 100); return `Le diste ${U.money(amt)} a ${n.first}.`; } });
        A({ id: 'heredero', icon: '📜', label: p.heirId === n.id ? 'Ya es tu heredero' : 'Nombrar heredero', sub: 'Heredará casi todo', limit: 1, run: (g) => { p.heirId = n.id; r.rel = U.clamp(r.rel + 5, 0, 100); return `Nombraste a ${n.first} como heredero principal en tu testamento. Tus otros hijos aún no lo saben.`; } });
      }
      if (t === 'padre' && p.age >= 4 && p.age <= 12) A({ id: 'pedir_mascota', icon: '🐶', label: 'Pedir una mascota', sub: 'Insistir mucho', limit: 1,
        run: (g) => { if (U.chance(r.rel / 180)) { const sp = U.pick(['perro', 'gato', 'hamster', 'pez', 'conejo']); const pet = MV.newPet(g, sp); MV.addRel(g, pet, 'mascota', U.int(70, 95)); MV.fx.stat(g, 'happy', 12); return `¡${n.first} dijo que sí! Ahora tienes un ${MV.SPECIES[sp].name.toLowerCase()} llamado ${pet.first}.`; } MV.fx.stat(g, 'happy', -3); return `${n.first} dijo: "Ya veremos". Que significa "no".`; } });
      if (t === 'abuelo') A({ id: 'historias', icon: '🪑', label: 'Escuchar sus historias', sub: '+inteligencia', limit: 1, run: (g) => { r.rel = U.clamp(r.rel + 6, 0, 100); MV.fx.stat(g, 'smarts', U.int(1, 2)); return `${n.first} te contó cómo era todo "en sus tiempos". Incluye una guerra, un amor perdido y el precio del pan.`; } });
      // Romance
      if (ROMANTIC.includes(t)) {
        if (adult) A({ id: 'cita', icon: '🍷', label: 'Salir en una cita', sub: '$150', limit: 2, run: (g) => { MV.fx.money(g, -150); r.rel = U.clamp(r.rel + U.int(4, 10), 0, 100); MV.fx.stat(g, 'happy', U.int(3, 6)); return U.pick([`Cena romántica con ${n.first}. El mesero cantó. Nadie se lo pidió.`, `Fueron al cine con ${n.first}. No recuerdas la película.`, `Picnic con ${n.first}. Las hormigas también vinieron.`]); } });
        else A({ id: 'cita_teen', icon: '🍦', label: 'Ir por un helado', sub: 'Cita adolescente', limit: 2, run: (g) => { r.rel = U.clamp(r.rel + U.int(4, 9), 0, 100); MV.fx.stat(g, 'happy', 4); return `Fueron por un helado con ${n.first}. Se tomaron de la mano. Momento histórico.`; } });
        if (adult && n.age >= 18) A({ id: 'intimidad', icon: '🌙', label: 'Pasar la noche juntos', sub: '(fundido a negro)', limit: 2,
          run: (g) => {
            r.rel = U.clamp(r.rel + U.int(3, 8), 0, 100); MV.fx.stat(g, 'happy', U.int(4, 8)); MV.fx.stat(g, 'stress', -4);
            MV.EV.push(g, 'proteccion', { target: n.id, casual: false }, true);
            return U.pick([`Pasaste la noche con ${n.first}. Los detalles quedan entre ustedes y las sábanas.`, `Noche especial con ${n.first}. Los vecinos golpearon la pared.`, `Velas, música... y un calambre en el peor momento. Igual fue lindo.`]);
          } });
        if (rels.fertile(g, n) && t !== 'amante') A({ id: 'bebe', icon: '👶', label: p.flags.buscandoBebe ? 'Ya están buscando un bebé' : 'Buscar un bebé', sub: 'Puede tardar', limit: 1,
          run: (g) => { p.flags.buscandoBebe = true; return `Tú y ${n.first} decidieron buscar un bebé. Pronto lo sabrán.`; } });
        if (t === 'pareja' && adult && n.age >= 18) A({ id: 'proponer', icon: '💍', label: 'Proponer matrimonio', sub: 'El gran paso', limit: 1,
          run: (g) => {
            const ch = U.clamp(r.rel / 100 - 0.15 + (g.p.age - r.since >= 2 ? 0.15 : -0.1), 0.05, 0.95);
            if (U.chance(ch)) { MV.EV.push(g, 'boda', { target: n.id }, true); return `¡${n.first} dijo que SÍ! Lloraron los dos.`; }
            r.rel = U.clamp(r.rel - 15, 0, 100); MV.fx.stat(g, 'happy', -12);
            return `${n.first} dijo que no. Delante de todo el restaurante. El violinista dejó de tocar.`;
          } });
        if (t === 'conyuge') A({ id: 'terapia', icon: '🛋️', label: 'Terapia de pareja', sub: '$1.500', limit: 1, run: (g) => { MV.fx.money(g, -1500); r.rel = U.clamp(r.rel + U.int(8, 20), 0, 100); return `Fueron a terapia de pareja. Descubrieron que el problema era la forma de colgar el papel higiénico.`; } });
        if (t === 'conyuge') A({ id: 'divorcio', icon: '⚖️', label: 'Pedir el divorcio', sub: 'Te puede costar caro', limit: 1, confirm: '¿Pedir el divorcio?', run: (g) => rels.divorce(g, n) });
        else A({ id: 'romper', icon: '💔', label: 'Terminar la relación', sub: '', limit: 1, confirm: '¿Terminar la relación?', run: (g) => rels.breakUp(g, n) });
      }
      if (['amigo', 'companero', 'ex', 'enemigo'].includes(t) && rels.canRomance(g, n, r)) A({ id: 'coquetear', icon: '😏', label: t === 'ex' ? 'Intentar volver' : 'Coquetear', sub: 'Podría salir bien...', limit: 1,
        run: (g) => {
          const ch = U.clamp(r.rel / 140 + (p.stats.looks - n.looks) / 250 + p.skills.carisma / 300 + (t === 'ex' ? -0.1 : 0) + (t === 'enemigo' ? -0.3 : 0), 0.05, 0.85);
          if (U.chance(ch)) return rels.startDating(g, n);
          r.rel = U.clamp(r.rel - 8, 0, 100); MV.fx.stat(g, 'happy', -4);
          return `Coqueteaste con ${n.first}. ${U.pick(['Te dijo que te ve "como un hermano".', 'Se rió pensando que era un chiste.', 'Te dejó en visto. En persona.'])}`;
        } });
      if (t === 'enemigo') A({ id: 'paces', icon: '🕊️', label: 'Hacer las paces', sub: '', limit: 1, run: (g) => { if (U.chance(0.45)) { r.type = 'amigo'; r.rel = 45; MV.fx.stat(g, 'karma', 4); return `Hiciste las paces con ${n.first}. Hasta se abrazaron.`; } return `${n.first} no quiere saber nada contigo.`; } });
      if (t === 'amigo' && adult) A({ id: 'fiesta_amigo', icon: '🪩', label: 'Salir de fiesta juntos', sub: '+felicidad', limit: 1, run: (g) => { r.rel = U.clamp(r.rel + U.int(5, 10), 0, 100); MV.fx.stat(g, 'happy', U.int(4, 8)); MV.fx.addic(g, 'alcohol', 3); return `Salieron de fiesta con ${n.first}. ${U.pick(['Terminaron cantando en un karaoke a las 5 a.m.', 'Hicieron amigos con un grupo de turistas suecos.', 'Perdiste el celular. Lo encontraste en el freezer.'])}`; } });
      // — Planes nuevos con la pareja —
      const bump = (lo, hi) => { r.rel = U.clamp(r.rel + U.int(lo, hi), 0, 100); };
      if (ROMANTIC.includes(t) && adult && n.age >= 18) {
        A({ id: 'cena_casera', icon: '🕯️', label: 'Cocinarle una cena', sub: 'Depende de tu Cocina', limit: 1, run: (g) => {
          MV.fx.skill(g, 'cocina', 2);
          if (U.chance(0.35 + p.skills.cocina / 120)) { bump(6, 12); return `Le cocinaste a ${n.first} una cena con velas. Pidió repetir el postre.`; }
          bump(-2, 3); return `Quemaste la cena. ${n.first} pidió pizza y se rió de ti toda la noche. Igual fue lindo.`;
        } });
        A({ id: 'poema', icon: '📝', label: 'Escribirle un poema', sub: 'Depende de tu Arte', limit: 1, run: (g) => {
          MV.fx.skill(g, 'arte', 2);
          if (U.chance(0.4 + p.skills.arte / 120)) { bump(6, 12); return `Le escribiste un poema a ${n.first}. Lo pegó en la heladera y lo lee en voz alta a las visitas.`; }
          bump(0, 3); return `Tu poema rimaba "amor" con "calor" y "tractor". ${n.first} lo guardó por lástima.`;
        } });
        A({ id: 'bailar', icon: '💃', label: 'Bailar juntos', sub: '+relación, +felicidad', limit: 1, run: (g) => { bump(4, 9); MV.fx.stat(g, 'happy', 4); MV.fx.skill(g, 'musica', 1); return `Bailaron en la cocina con música de los 80. ${n.first} pisó tu pie tres veces. Romántico.`; } });
        A({ id: 'series', icon: '📺', label: 'Maratón de series', sub: '-estrés, +relación', limit: 1, run: (g) => { bump(3, 7); MV.fx.stat(g, 'stress', -6); return `Vieron 9 capítulos seguidos con ${n.first}. Discutieron sobre el final. Cada uno tiene su teoría.`; } });
        A({ id: 'sorpresa', icon: '🎉', label: 'Planear una sorpresa', sub: '$500', limit: 1, when: () => p.money >= 500, run: (g) => {
          MV.fx.money(g, -500);
          if (U.chance(0.8)) { bump(8, 14); return `Le organizaste una sorpresa a ${n.first}: amigos escondidos, globos y su comida favorita. Lloró.`; }
          bump(-4, 2); return `${n.first} odia las sorpresas. Gritó, tiró la torta y después se disculpó.`;
        } });
        A({ id: 'desayuno', icon: '🥞', label: 'Desayuno en la cama', sub: '+relación', limit: 1, run: (g) => { bump(4, 8); return `Le llevaste el desayuno a la cama a ${n.first}. Hubo migas en las sábanas durante una semana.`; } });
        if (t === 'pareja' && p.flags.convive !== n.id && p.age >= 18) A({ id: 'convivir', icon: '📦', label: 'Mudarse juntos', sub: 'Comparten los gastos de vida', limit: 1, run: (g) => {
          p.flags.convive = n.id; bump(5, 10); MV.fx.stat(g, 'stress', 4);
          return `Tú y ${n.first} se mudaron juntos. Los gastos se comparten. La pelea por el lado de la cama, también.`;
        } });
        if (t === 'conyuge' && p.age - r.since >= 5) A({ id: 'votos', icon: '💒', label: 'Renovar los votos', sub: '$5.000', limit: 1, when: () => p.money >= 5000, run: (g) => {
          MV.fx.money(g, -5000); bump(10, 18); MV.fx.stat(g, 'happy', 8);
          return `Renovaron los votos después de ${p.age - r.since} años. ${n.first} se equivocó de nombre en el discurso, pero se rieron todos.`;
        } });
        A({ id: 'espiar_celular', icon: '🔍', label: 'Revisar su celular', sub: 'Arriesgado', limit: 1, run: (g) => {
          MV.fx.stat(g, 'karma', -2);
          if (U.chance(0.3)) { bump(-25, -15); return `${n.first} te descubrió revisando su celular. Discusión monumental.`; }
          if (U.chance(0.2)) { bump(-10, -5); MV.fx.stat(g, 'happy', -8); return `Encontraste mensajes sospechosos de ${n.first} con alguien llamado "Mecánico 2". Ahora no duermes.`; }
          MV.fx.stat(g, 'stress', -2); return 'Revisaste su celular. Solo había memes, fotos de comida y 400 capturas de pantalla de recetas.';
        } });
      }
      // — Planes con familia y amigos —
      if (['amigo', 'padre', 'hermano', 'hijo', 'abuelo', 'companero', 'conyuge', 'pareja'].includes(t) && n.age >= 14 && p.age >= 14) {
        A({ id: 'comer_afuera', icon: '🍔', label: 'Salir a comer', sub: '$80', limit: 1, when: () => p.money >= 80 || p.age < 18, run: (g) => { if (p.age >= 18) MV.fx.money(g, -80); bump(4, 8); return `Salieron a comer con ${n.first}. ${U.pick(['Pidieron demasiado.', 'El mozo se equivocó con todo y igual dejaron propina.', 'Hablaron tres horas sin mirar el celular.'])}`; } });
        A({ id: 'cine_juntos', icon: '🍿', label: 'Ir al cine juntos', sub: '+relación', limit: 1, run: (g) => { bump(3, 7); MV.fx.stat(g, 'happy', 2); return `Fueron al cine con ${n.first}. ${U.pick(['Se durmió a la mitad.', 'Lloraron los dos y fingieron que no.', 'Comentó toda la película. Toda.'])}`; } });
        A({ id: 'gym_juntos', icon: '🏋️', label: 'Ir al gimnasio juntos', sub: '+salud, +relación', limit: 1, run: (g) => { bump(3, 7); MV.fx.stat(g, 'health', 2); n.health = U.clamp(n.health + 2, 0, 100); return `Entrenaron juntos con ${n.first}. Se motivaron mutuamente (y se quejaron mutuamente).`; } });
        A({ id: 'consejo', icon: '🧭', label: 'Pedir un consejo', sub: '+felicidad', limit: 1, run: (g) => { bump(2, 5); MV.fx.stat(g, 'happy', 3); MV.fx.stat(g, 'stress', -4); return `Le pediste consejo a ${n.first}. ${U.pick(['Te dijo justo lo que necesitabas escuchar.', 'Te contó una historia larguísima que, al final, tenía sentido.', 'Su consejo fue "hacé lo que sientas". Gracias.'])}`; } });
        A({ id: 'escuchar', icon: '👂', label: 'Escuchar sus problemas', sub: '+relación, +karma', limit: 1, run: (g) => { bump(5, 10); MV.fx.stat(g, 'karma', 2); MV.fx.skill(g, 'carisma', 1); return `Escuchaste a ${n.first} durante horas. Se sintió mucho mejor. Tú también.`; } });
        if (p.age >= 18) A({ id: 'prestar', icon: '🤝', label: 'Prestarle dinero', sub: '$1.000', limit: 1, when: () => p.money >= 1000, run: (g) => {
          MV.fx.money(g, -1000); n.money = (n.money || 0) + 1000; bump(5, 10);
          if (U.chance(0.5)) { MV.EV.later(g, 'amigo_devuelve', U.int(1, 3), { target: n.id }); return `Le prestaste $1.000 a ${n.first}. Juró devolverlo "la semana que viene".`; }
          return `Le prestaste $1.000 a ${n.first}. Los dos saben que no lo vas a volver a ver.`;
        } });
        if (p.flags.emigro || (['hijo', 'padre', 'hermano'].includes(t) && p.age >= 18 && n.age >= 18)) A({ id: 'videollamada', icon: '📹', label: 'Hacer una videollamada', sub: 'Acorta la distancia', limit: 1, run: (g) => { bump(3, 7); return `Videollamada con ${n.first}. ${U.pick(['Se congeló la imagen en una cara horrible.', 'Te mostró su casa entera con la cámara al revés.', 'Hablaron una hora. Se nota que te extraña.'])}`; } });
      }
      if (['padre', 'abuelo'].includes(t) && n.age >= 60 && p.age >= 16) A({ id: 'medico_familiar', icon: '🏥', label: 'Llevarl' + U.gw(n.gender, 'o', 'a') + ' al médico', sub: '+salud de tu familiar', limit: 1, run: (g) => {
        n.health = U.clamp(n.health + U.int(8, 18), 0, 100); bump(4, 8); MV.fx.stat(g, 'karma', 2);
        return `Llevaste a ${n.first} al médico. Le ajustaron las pastillas y se quejó de la sala de espera todo el viaje.`;
      } });
      if (t === 'nieto') A({ id: 'consentir', icon: '🍭', label: 'Malcriarl' + U.gw(n.gender, 'o', 'a'), sub: '$100. Golosinas y permisos', limit: 1, when: () => p.money >= 100, run: (g) => {
        MV.fx.money(g, -100); bump(6, 12); MV.fx.stat(g, 'happy', 3);
        const par = n.parentId && g.people[n.parentId], pr = par && MV.relOf(g, par.id);
        if (pr && par.alive && U.chance(0.3)) { pr.rel = U.clamp(pr.rel - 3, 0, 100); return `Le diste a ${n.first} tres helados antes de cenar. ${par.first} te miró con odio.`; }
        return U.pick([`Llevaste a ${n.first} a comprar juguetes. Salieron con la mitad del negocio.`, `Le dejaste a ${n.first} quedarse despiert${U.gw(n.gender, 'o', 'a')} hasta las 2. Es tu secreto.`, `${n.first} te dijo "sos ${U.gw(g.p.gender, 'el mejor abuelo', 'la mejor abuela')} del mundo". Valió cada peso.`]);
      } });
      if (t === 'nieto' && n.age >= 4 && n.age <= 16) A({ id: 'historias_nieto', icon: '🪑', label: 'Contarle historias de tu vida', sub: '+relación', limit: 1, run: (g) => {
        bump(4, 9); n.smarts = U.clamp(n.smarts + 1, 0, 100);
        return U.pick([`Le contaste a ${n.first} cómo era el mundo sin internet. No te creyó.`, `Le contaste a ${n.first} tus aventuras de juventud. Exageraste un 300 %.`, `${n.first} escuchó tus historias con la boca abierta. Después preguntó si eras un dinosaurio.`]);
      } });
      if (t === 'hijo' && n.age >= 6 && n.age <= 15) A({ id: 'tarea', icon: '✏️', label: 'Ayudar con la tarea', sub: '+inteligencia del niño', limit: 1, run: (g) => {
        n.smarts = U.clamp(n.smarts + U.int(2, 5), 0, 100); bump(3, 7);
        return U.pick([`Ayudaste a ${n.first} con la tarea de matemáticas. Descubriste que no recordabas nada.`, `Hicieron una maqueta del sistema solar. Plutón quedó como planeta, por las dudas.`]);
      } });
      if ((t === 'hijo' || t === 'nieto') && n.age >= 2 && n.age <= 12) A({ id: 'parque', icon: '🛝', label: 'Llevarl' + U.gw(n.gender, 'o', 'a') + ' al parque', sub: '+relación, +felicidad', limit: 1, run: (g) => { bump(4, 9); MV.fx.stat(g, 'happy', 3); n.health = U.clamp(n.health + 2, 0, 100); return `Fueron al parque. ${n.first} se tiró del tobogán 47 veces. Tú una, y te trabaste.`; } });
      if ((t === 'hijo' || t === 'nieto') && n.age >= 5 && n.age <= 17 && (p.skills.deporte >= 40 || Object.values(p.sportsExp || {}).some((x) => x >= 3))) A({ id: 'ensenar_deporte', icon: '⚽', label: 'Enseñarle tu deporte', sub: '+salud y relación', limit: 1, run: (g) => {
        n.health = U.clamp(n.health + U.int(2, 5), 0, 100); bump(4, 9); MV.fx.skill(g, 'deporte', 1);
        return `Le enseñaste a ${n.first} a jugar. ${U.pick(['Tiene talento: ya te gana.', 'Pateó la pelota al techo del vecino. Dos veces.', 'Dice que de grande quiere ser como tú.'])}`;
      } });
      // Conflicto
      A({ id: 'discutir', icon: '😤', label: 'Discutir', sub: '-relación', limit: 1, run: (g) => { r.rel = U.clamp(r.rel - U.int(5, 12), 0, 100); MV.fx.stat(g, 'stress', 3); return U.pick([`Discutiste con ${n.first} por ${U.pick(['política', 'quién lava los platos', 'una deuda de hace años', 'el final de una serie', 'nada en particular'])}.`, `Le gritaste a ${n.first}. Te gritó más fuerte.`]); } });
      A({ id: 'insultar', icon: '🤬', label: 'Insultar', sub: '-relación, -karma', limit: 1, run: (g) => { r.rel = U.clamp(r.rel - U.int(10, 20), 0, 100); MV.fx.stat(g, 'karma', -2); return `Le dijiste a ${n.first} que ${U.pick(['tiene cara de papa hervida', 'su comida sabe a cartón', 'nadie lo soporta', 'se viste como un sillón viejo'])}. Silencio incómodo.`; } });
      A({ id: 'broma', icon: '🃏', label: 'Hacerle una broma', sub: 'Puede salir mal', limit: 1, run: (g) => { if (U.chance(0.55)) { r.rel = U.clamp(r.rel + 3, 0, 100); MV.fx.stat(g, 'happy', 4); return `Le pusiste sal al café de ${n.first}. Se rió (después de escupir).`; } r.rel = U.clamp(r.rel - 8, 0, 100); return `Tu broma a ${n.first} salió fatal. Ahora planea venganza.`; } });
      if (p.age >= 8) A({ id: 'atacar', icon: '👊', label: 'Atacar', sub: 'Violencia: mala idea', limit: 1, confirm: `¿Atacar a ${n.first}?`,
        run: (g) => {
          r.rel = U.clamp(r.rel - U.int(25, 45), 0, 100); MV.fx.stat(g, 'karma', -8);
          const win = U.chance(0.45 + p.skills.deporte / 200 + (p.stats.health - n.health) / 300);
          if (win) n.health = U.clamp(n.health - U.int(10, 30), 0, 100); else MV.fx.stat(g, 'health', -U.int(8, 20));
          if (adult && U.chance(0.3)) { MV.sys.crime.arrest(g, 'Agresión', 2); return `Atacaste a ${n.first} y alguien llamó a la policía.`; }
          if (r.rel < 15 && !MV.FAMILY.includes(t) && !ROMANTIC.includes(t)) r.type = 'enemigo';
          return win ? `Le diste una paliza a ${n.first}. No te sientes orgullos${U.gw(p.gender, 'o', 'a')}... o sí.` : `Atacaste a ${n.first} y te devolvió el doble. Mala idea.`;
        } });
      if (p.age >= 16) A({ id: 'asesinar', icon: '🔪', label: 'Deshacerte de esta persona', sub: 'Crimen grave', limit: 1, confirm: `¿Intentar asesinar a ${n.first}? Esto es muy grave.`,
        opts: () => [
          { id: 'veneno', icon: '☕', label: 'Algo raro en su café' },
          { id: 'accidente', icon: '🪜', label: 'Un "accidente" doméstico' },
          { id: 'sicario', icon: '🕶️', label: 'Contratar a un sicario ($30.000)' }
        ],
        run: (g, m) => MV.sys.crime.murder(g, n.id, m) });
      if (['amigo', 'companero', 'ex', 'enemigo'].includes(t)) A({ id: 'olvidar', icon: '🚮', label: 'Sacar de tu vida', sub: 'Eliminar contacto', limit: 1, confirm: `¿Sacar a ${n.first} de tu vida?`, run: (g) => { MV.removeRel(g, n.id); return `Borraste a ${n.first} de tu vida y de tus contactos.`; } });
      return list.filter((a) => !a.when || a.when(g));
    }
  };
  MV.sys.rels = rels;

  // — Eventos manuales de relaciones —
  MV.ev({
    id: 'boda', manual: true, prison: 'any', icon: '💒', scene: 'boda', title: '¡Boda!',
    text: '¿Cómo va a ser la boda con {t}?',
    choices: [
      { t: '🏰 Boda de cuento ($40.000)', when: (g) => g.p.money >= 40000, eff: (g, ctx) => { MV.fx.money(g, -40000); const n = MV.person(g, ctx.target); rels.marry(g, n); MV.fx.stat(g, 'happy', 8); return `Boda espectacular con ${n.first}: fuegos artificiales, 300 invitados y un tío borracho bailando sobre la mesa.`; } },
      { t: '🌿 Boda sencilla ($4.000)', when: (g) => g.p.money >= 4000, eff: (g, ctx) => { MV.fx.money(g, -4000); const n = MV.person(g, ctx.target); rels.marry(g, n); return `Boda íntima y hermosa con ${n.first}. Lloraste en los votos.`; } },
      { t: '🎰 Escaparse a Las Vegas ($800)', eff: (g, ctx) => { MV.fx.money(g, -800); const n = MV.person(g, ctx.target); rels.marry(g, n); MV.rels(g, 'padre').forEach((x) => { x.r.rel = U.clamp(x.r.rel - 10, 0, 100); }); return `Te casaste con ${n.first} en una capilla de Las Vegas. Los casó un imitador de un cantante famoso. Tu familia no está contenta.`; } },
      { t: '🏛️ Solo el registro civil', eff: (g, ctx) => { const n = MV.person(g, ctx.target); rels.marry(g, n); return `Te casaste con ${n.first} en el registro civil. Firma, foto y empanadas.`; } }
    ]
  });

  MV.ev({
    id: 'embarazo_sorpresa', manual: true, icon: '🍼', scene: 'hospital', title: 'Sorpresa',
    text: (g) => g.p.gender === 'f' ? 'Estás embarazada. Con {t}. No estaba en los planes.' : '{t} está embarazada. De ti. No estaba en los planes.',
    choices: [
      { t: '👶 Tener al bebé', eff: (g, ctx) => rels.birth(g, MV.person(g, ctx.target)) },
      { t: '🏃 Huir del país (moralmente dudoso)', when: (g) => g.p.gender === 'm', eff: (g, ctx) => { const r = MV.relOf(g, ctx.target); if (r) { rels.makeEx(g, r); r.rel = 0; } MV.fx.stat(g, 'karma', -25); return 'Desapareciste. Cambiaste de número. Tu karma tomó nota.'; } },
      { t: '🤝 Decidirlo juntos con calma', eff: (g, ctx) => { if (U.chance(0.5)) return rels.birth(g, MV.person(g, ctx.target)); return 'Lo hablaron con calma y decidieron que no era el momento. Siguen juntos.'; } }
    ]
  });

  MV.ev({
    id: 'proteccion', manual: true, prison: 'any', icon: '🛡️', scene: 'hogar', title: 'Antes de apagar la luz',
    text: 'Con {t} la noche promete. Antes de que se apague la luz, una pregunta de adultos: ¿protección?',
    choices: [
      { t: (g, ctx) => (rels.fertile(g, MV.person(g, ctx.target)) ? '🛡️ Con protección (0 % de embarazo)' : '🛡️ Con protección'), eff: (g, ctx) => rels.afterNight(g, ctx, true) },
      { t: (g, ctx) => (rels.fertile(g, MV.person(g, ctx.target)) ? `🎲 Sin protección (${Math.round(rels.UNPROTECTED_PREGNANCY * 100)} % de embarazo)` : `🎲 Sin protección (sin riesgo de embarazo${ctx.casual ? ', pero ojo con las ETS' : ''})`), eff: (g, ctx) => rels.afterNight(g, ctx, false) }
    ]
  });

  MV.ev({
    id: 'despues_noche', manual: true, prison: 'any', icon: '☕', scene: 'hogar', title: 'A la mañana siguiente',
    text: 'Desayuno con {t}. Hay café, medialunas y un silencio que alguien tiene que romper. ¿Qué son ahora?',
    choices: [
      { t: '💑 Proponer que sean pareja', when: (g) => !MV.partner(g), eff: (g, ctx) => { const n = MV.person(g, ctx.target); MV.addRel(g, n, 'pareja', U.int(55, 80)); MV.fx.stat(g, 'happy', 8); return `Le propusiste a ${n.first} que sean pareja y dijo que sí. Ahora salen.`; } },
      { t: '🤫 Seguir viéndose en secreto', when: (g) => !!MV.partner(g), eff: (g, ctx) => { const n = MV.person(g, ctx.target); MV.addRel(g, n, 'amante', U.int(45, 70)); MV.fx.stat(g, 'karma', -3); return `${n.first} y tú acordaron seguir viéndose. En secreto. ${MV.partner(g).n.first} no sabe nada... todavía.`; } },
      { t: '🤝 Quedar como amigos', eff: (g, ctx) => { const n = MV.person(g, ctx.target); MV.addRel(g, n, 'amigo', U.int(40, 65)); return `Quedaron como amigos con ${n.first}. Raro, pero funciona.`; } },
      { t: '👋 Solo fue una noche', eff: (g, ctx) => { const n = MV.person(g, ctx.target); return `Se despidieron con un abrazo. ${n.first} será un buen recuerdo (o una anécdota).`; } }
    ]
  });

  MV.ev({
    id: 'infiel_descubierto', manual: true, icon: '📱', scene: 'hogar', title: '¡Te descubrieron!',
    text: (g, ctx) => `{t} encontró mensajes tuyos con ${ctx.lover}. Está furios${'{to}'}.`,
    choices: [
      { t: '🙏 Pedir perdón de rodillas', eff: (g, ctx) => { const r = MV.relOf(g, ctx.target); const lover = MV.rels(g, 'amante')[0]; if (lover) MV.removeRel(g, lover.n.id); if (U.chance(r.rel / 110)) { r.rel = U.clamp(r.rel - 25, 0, 100); return 'Te perdonó. Pero lo va a sacar en cada discusión durante 30 años.'; } const n = MV.person(g, ctx.target); return r.type === 'conyuge' ? rels.divorce(g, n, true) : rels.breakUp(g, n); } },
      { t: '🤷 Negarlo todo', eff: (g, ctx) => { const r = MV.relOf(g, ctx.target); MV.fx.stat(g, 'karma', -5); if (U.chance(0.25)) return '"Era mi primo." Increíblemente, funcionó.'; const n = MV.person(g, ctx.target); return r.type === 'conyuge' ? rels.divorce(g, n, true) : rels.breakUp(g, n); } },
      { t: '💘 Quedarme con mi amante', eff: (g, ctx) => { const n = MV.person(g, ctx.target), r = MV.relOf(g, ctx.target); const msg = r.type === 'conyuge' ? rels.divorce(g, n) : rels.breakUp(g, n); const lover = MV.rels(g, 'amante')[0]; if (lover) lover.r.type = 'pareja'; return msg + ` Ahora sales oficialmente con ${ctx.lover}.`; } }
    ]
  });
})(window.MV = window.MV || {});
