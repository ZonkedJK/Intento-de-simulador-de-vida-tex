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
      r.type = 'ex'; r.rel = U.clamp(r.rel - 30, 0, 100);
      g.p.counters.divorcios = (g.p.counters.divorcios || 0) + 1;
      MV.fx.stat(g, 'happy', -15);
      let lost = 0;
      if (g.p.money > 0) { lost = Math.round(g.p.money * U.float(0.2, 0.5)); MV.fx.money(g, -lost); n.money += lost; }
      MV.ach.check(g);
      return `${theyLeft ? `${n.first} pidió el divorcio.` : `Te divorciaste de ${n.first}.`}${lost ? ` El acuerdo te costó ${U.money(lost)}.` : ''}`;
    },

    breakUp(g, n) {
      const r = MV.relOf(g, n.id);
      if (!r) return '';
      r.type = 'ex'; r.rel = U.clamp(r.rel - 25, 0, 100);
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
        else { part.r.type = 'ex'; MV.EV.info(g, { title: 'Te dejaron', text: `${part.n.first} te dejó. Dijo que necesitaba "encontrarse". Se encontró con otra persona.`, icon: '💔', scene: 'hogar' }); MV.fx.stat(g, 'happy', -10); }
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

    /** Acciones disponibles con una relación concreta. */
    actions(g, r, n) {
      const p = g.p, list = [];
      if (!n || !n.alive) return list;
      const t = r.type, adult = p.age >= 18, human = n.species === 'humano';
      const A = (o) => list.push(o);
      if (!human) {
        A({ id: 'jugar', icon: '🎾', label: 'Jugar', sub: '+relación', limit: 2, run: (g) => { r.rel = U.clamp(r.rel + U.int(4, 10), 0, 100); MV.fx.stat(g, 'happy', U.int(2, 5)); return U.pick([`Jugaste con ${n.first}. Te mordió con cariño.`, `${n.first} trajo la pelota 40 veces. Tú te cansaste primero.`, `${n.first} te ignoró olímpicamente, pero se notaba feliz.`]); } });
        if (n.species === 'perro') A({ id: 'pasear', icon: '🦮', label: 'Pasear', sub: '+salud para ambos', limit: 2, run: (g) => { r.rel = U.clamp(r.rel + U.int(3, 8), 0, 100); MV.fx.stat(g, 'health', U.int(1, 3)); n.health = U.clamp(n.health + 3, 0, 100); return `Paseaste a ${n.first}. Olfateó cada poste del barrio.`; } });
        A({ id: 'vet', icon: '🩺', label: 'Llevar al veterinario', sub: '$250', limit: 1, run: (g) => { MV.fx.money(g, -250); n.health = U.clamp(n.health + U.int(10, 25), 0, 100); n.lifespan = (n.lifespan || 10) + (U.chance(0.3) ? 1 : 0); return `${n.first} fue al veterinario. Odia al veterinario.`; } });
        A({ id: 'regalar_mascota', icon: '📦', label: 'Dar en adopción', sub: 'Adiós', limit: 1, confirm: `¿Dar en adopción a ${n.first}?`, run: (g) => { MV.removeRel(g, n.id); MV.fx.stat(g, 'karma', -5); MV.fx.stat(g, 'happy', -6); return `Diste en adopción a ${n.first}. Te miró por última vez con ojos de traición.`; } });
        return list;
      }
      A({ id: 'conversar', icon: '💬', label: 'Conversar', sub: '+relación', limit: 2, run: (g) => { r.rel = U.clamp(r.rel + U.int(1, 6), 0, 100); return U.pick([`Hablaste con ${n.first} sobre la vida. ${U.cap(MV.relLabel(t, n).toLowerCase())} feliz.`, `Charlaron de todo y de nada con ${n.first}.`, `${n.first} te contó un chisme jugoso.`, `Hablaron del clima durante 20 minutos. Intensísimo.`]); } });
      A({ id: 'tiempo', icon: '🫂', label: 'Pasar tiempo juntos', sub: '+relación, +felicidad', limit: 2, run: (g) => { r.rel = U.clamp(r.rel + U.int(4, 10), 0, 100); MV.fx.stat(g, 'happy', U.int(2, 5)); return U.pick([`Pasaste la tarde con ${n.first}. ${U.pick(['Vieron una película malísima.', 'Cocinaron algo incomible y se rieron mucho.', 'Fueron a caminar por el parque.', 'Jugaron cartas y hubo trampas.'])}`]); } });
      A({ id: 'cumplido', icon: '🌹', label: 'Hacer un cumplido', sub: 'Endulza el día', limit: 1, run: (g) => { if (U.chance(0.8)) { r.rel = U.clamp(r.rel + U.int(2, 6), 0, 100); return `Le dijiste a ${n.first} que ${U.pick(['tiene una sonrisa preciosa', 'es una persona increíble', 'cocina mejor que nadie', 'su corte de pelo le queda genial'])}. Se sonrojó.`; } r.rel = U.clamp(r.rel - 3, 0, 100); return `Intentaste decirle un cumplido a ${n.first} pero sonó raro. Muy raro.`; } });
      A({ id: 'regalo', icon: '🎁', label: 'Hacer un regalo', sub: 'Cuesta dinero', limit: 1,
        opts: () => [{ id: 20, icon: '🍬', label: 'Caramelos ($20)' }, { id: 200, icon: '💐', label: 'Flores y chocolates ($200)' }, { id: 2000, icon: '⌚', label: 'Algo caro ($2.000)' }, { id: 20000, icon: '💎', label: 'Algo carísimo ($20.000)' }].filter((o) => p.money >= o.id),
        run: (g, amt) => { amt = +amt || 20; MV.fx.money(g, -amt); const boost = Math.round(4 + Math.log10(amt) * 4 * (1 + (n.traits.includes('tacaño') ? 0.3 : 0))); r.rel = U.clamp(r.rel + boost, 0, 100); return `Le regalaste a ${n.first} algo de ${U.money(amt)}. ${boost > 14 ? 'Casi se desmaya de la emoción.' : 'Le gustó.'}`; } });
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
            if (rels.fertile(g, n) && U.chance(0.06)) { MV.EV.push(g, 'embarazo_sorpresa', { target: n.id }, true); }
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
      return list;
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
      { t: '🏃 Huir del país (moralmente dudoso)', when: (g) => g.p.gender === 'm', eff: (g, ctx) => { const r = MV.relOf(g, ctx.target); if (r) { r.type = 'ex'; r.rel = 0; } MV.fx.stat(g, 'karma', -25); return 'Desapareciste. Cambiaste de número. Tu karma tomó nota.'; } },
      { t: '🤝 Decidirlo juntos con calma', eff: (g, ctx) => { if (U.chance(0.5)) return rels.birth(g, MV.person(g, ctx.target)); return 'Lo hablaron con calma y decidieron que no era el momento. Siguen juntos.'; } }
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
