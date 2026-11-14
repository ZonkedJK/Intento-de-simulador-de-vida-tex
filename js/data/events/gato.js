/* Mil Vidas — las 7 decisiones de tu gato que habla. El texto cuenta la situación y cita al gato según su voz. */
(function (MV) {
  'use strict';
  const U = MV.U, ev = MV.ev, fx = MV.fx;
  const T = () => MV.sys.talkcat;

  /** El gato del evento (ctx.target) y la relación con él. */
  const catOf = (g, ctx) => g.people[ctx.target] || T().cat(g) || { first: 'Tu gato', gender: 'm', health: 50 };
  const bump = (g, ctx, d) => { const r = MV.relOf(g, ctx.target); if (r) r.rel = U.clamp(r.rel + d, 0, 100); };
  /** Lo que dice el gato en este evento, entre comillas. */
  const says = (g, ctx, id) => { const n = catOf(g, ctx); return `"${T().voice(n).events[id](T().ctx(g, n))}"`; };
  /** "lo" o "la" según el gato. */
  const lo = (g, ctx) => U.gw(catOf(g, ctx).gender, 'lo', 'la');
  const base = (id, extra) => ({
    id, w: 0.5, icon: '🐈', scene: 'hogar',
    when: (g) => !!T().cat(g) && (!extra || extra(g)),
    target: (g) => { const n = T().cat(g); return n ? n.id : null; }
  });

  // ——— Celos de tu pareja ———
  ev(Object.assign(base('gato_celos', (g) => !!MV.partner(g)), {
    title: (g, ctx) => `${catOf(g, ctx).first} tiene celos`,
    text: (g, ctx) => {
      const n = catOf(g, ctx), x = MV.partner(g), who = x ? x.n.first : 'tu pareja';
      return `${n.first} no soporta a ${who}: le tira las cosas de la mesa de luz y duerme arriba de su ropa limpia. Anoche te habló claro: ${says(g, ctx, 'gato_celos')}`;
    },
    choices: [
      { t: 'Darle la razón', sub: 'Tu pareja se va a ofender',
        eff: (g, ctx) => { const x = MV.partner(g); if (x) x.r.rel = U.clamp(x.r.rel - 6, 0, 100); bump(g, ctx, 6);
          return `Le diste la razón a ${catOf(g, ctx).first}. ${x ? x.n.first : 'Tu pareja'} durmió en el sillón, y no por elección propia.`; } },
      { t: 'Defender a tu pareja', sub: 'Tu gato se va a ofender',
        eff: (g, ctx) => { const x = MV.partner(g); if (x) x.r.rel = U.clamp(x.r.rel + 5, 0, 100); bump(g, ctx, -6);
          return `Defendiste a ${x ? x.n.first : 'tu pareja'}. ${catOf(g, ctx).first} pasó tres días mirándote desde arriba del ropero sin dirigirte la palabra.`; } },
      { t: (g, ctx) => `Sobornar${lo(g, ctx)} con atún ($40)`, sub: 'La paz tiene precio', when: (g) => g.p.money >= 40,
        eff: (g, ctx) => { fx.money(g, -40); bump(g, ctx, 3);
          return `Una lata de atún del bueno y ${catOf(g, ctx).first} declaró una tregua. Dura lo que dura la lata.`; } }
    ]
  }));

  // ——— El regalo ———
  ev(Object.assign(base('gato_regalo'), {
    title: (g, ctx) => `Un regalo de ${catOf(g, ctx).first}`,
    text: (g, ctx) => `${catOf(g, ctx).first} dejó algo envuelto en una media sobre tu almohada y espera tu reacción con mucha dignidad: ${says(g, ctx, 'gato_regalo')}`,
    choices: [
      { t: 'Quedártelo', sub: 'Puede valer algo… o no',
        eff: (g) => {
          const k = U.rand();
          if (k < 0.5) { const amt = U.int(50, 500); fx.money(g, amt); return `Era un reloj que alguien perdió hace años. Lo vendiste por ${U.money(amt)}.`; }
          if (k < 0.8) { fx.stat(g, 'karma', -2); return 'Eran los anteojos del vecino. Te los quedaste igual, y ahora él te saluda entrecerrando los ojos.'; }
          fx.stat(g, 'happy', -3); return 'Estaba vivo. Era una rana. Pasaste la noche buscándola debajo de la cama.';
        } },
      { t: 'Devolverlo a su dueño', sub: '+karma, pero tu gato se ofende',
        eff: (g, ctx) => { fx.stat(g, 'karma', 3); bump(g, ctx, -3);
          return `Encontraste al dueño y se lo devolviste. ${catOf(g, ctx).first} te mira como a alguien que no entiende nada de regalos.`; } },
      { t: 'Agradecer y tirarlo a escondidas', sub: 'Tu gato queda feliz',
        eff: (g, ctx) => { bump(g, ctx, 4);
          return `Agradeciste con una reverencia y lo tiraste cuando nadie miraba. ${catOf(g, ctx).first} ya está planeando el próximo.`; } }
    ]
  }));

  // ——— Desaparece unos días ———
  ev(Object.assign(base('gato_desaparece'), {
    title: (g, ctx) => `${catOf(g, ctx).first} no volvió`,
    text: (g, ctx) => `Hace cuatro días que ${catOf(g, ctx).first} no vuelve a casa. Sobre tu almohada quedó una nota llena de pelos: ${says(g, ctx, 'gato_desaparece')}`,
    choices: [
      { t: (g, ctx) => `Buscar${lo(g, ctx)} por todo el barrio`, sub: 'Cansa, pero lo valora',
        eff: (g, ctx) => { fx.stat(g, 'stress', 5); bump(g, ctx, 8); const n = catOf(g, ctx);
          return `Recorriste el barrio gritando su nombre. ${n.first} estaba en el techo de enfrente, mirándote buscar. Volvió ${U.gw(n.gender, 'conmovido', 'conmovida')}, aunque no lo admita.`; } },
      { t: 'Pegar carteles ($60)', sub: 'Con su mejor foto', when: (g) => g.p.money >= 60,
        eff: (g, ctx) => { fx.money(g, -60); bump(g, ctx, 4);
          return `Empapelaste el barrio con su cara. ${catOf(g, ctx).first} volvió al día siguiente y se quejó de la foto que elegiste.`; } },
      { t: 'Esperar: ya volverá', sub: 'Sin esfuerzo',
        eff: (g, ctx) => {
          const n = catOf(g, ctx);
          if (U.chance(0.7)) { bump(g, ctx, -4); return `${n.first} volvió a la semana, ${U.gw(n.gender, 'ofendido', 'ofendida')} porque nadie salió a buscar${lo(g, ctx)}.`; }
          fx.stat(g, 'happy', 4); return `${n.first} volvió con olor a pescado y una historia larguísima sobre un barco, una gaviota y un malentendido. Te reíste toda la noche.`;
        } }
    ]
  }));

  // ——— El amigo del barrio ———
  ev(Object.assign(base('gato_amigo'), {
    title: (g, ctx) => `${catOf(g, ctx).first} trajo visita`,
    text: (g, ctx) => `${catOf(g, ctx).first} llegó con un gato flaco y atigrado que no dice una palabra: solo maúlla. Te lo presenta así: ${says(g, ctx, 'gato_amigo')}`,
    choices: [
      { t: 'Invitarlo a comer ($80)', sub: 'Tu gato queda como un gran anfitrión', when: (g) => g.p.money >= 80,
        eff: (g, ctx) => { fx.money(g, -80); bump(g, ctx, 5);
          return `Serviste dos platos. El invitado comió por cuatro y ${catOf(g, ctx).first} quedó como la mejor casa del barrio.`; } },
      { t: 'Adoptarlo también', sub: 'Un gato más en casa',
        eff: (g, ctx) => {
          const pet = MV.sys.mythic.strayCat(g, 'joven');
          MV.addRel(g, pet, 'mascota', 60); T().noteRescue(g); MV.ach.check(g);
          return `Ahora son dos. Le pusiste ${pet.first}. No habla, pero ${catOf(g, ctx).first} traduce todo lo que maúlla (y a veces inventa).`;
        } },
      { t: 'Decirle que no', sub: 'Tu gato se ofende',
        eff: (g, ctx) => { bump(g, ctx, -5);
          return `Dijiste que no. ${catOf(g, ctx).first} acompañó a su amigo hasta la puerta y volvió sin mirarte.`; } }
    ]
  }));

  // ——— Quiere ser famoso ———
  ev(Object.assign(base('gato_famoso', (g) => g.p.age >= 13), {
    title: (g, ctx) => `${catOf(g, ctx).first} quiere ser famos${U.gw(catOf(g, ctx).gender, 'o', 'a')}`,
    text: (g, ctx) => `${catOf(g, ctx).first} vio un video de un gato tocando el piano con tres millones de vistas y no durmió en toda la noche: ${says(g, ctx, 'gato_famoso')}`,
    choices: [
      { t: 'Abrirle una cuenta', sub: 'Suma seguidores',
        eff: (g, ctx) => { const n = U.int(200, 5000); g.p.followers = (g.p.followers || 0) + n;
          return `Subiste un video de ${catOf(g, ctx).first} hablando. Sumaste ${n.toLocaleString('es-AR')} seguidores; todos creen que es un doblaje muy bien hecho.`; } },
      { t: 'Decirle que la fama corrompe', sub: '+karma, pero no le gusta oírlo',
        eff: (g, ctx) => { bump(g, ctx, -3); fx.stat(g, 'karma', 2);
          return `Le explicaste los peligros de la fama. ${catOf(g, ctx).first} te escuchó entero y después practicó poses frente al espejo.`; } },
      { t: 'Cobrar por sus fotos', sub: 'Plata fácil; tu gato se siente usado',
        eff: (g, ctx) => { const amt = U.int(100, 1500); fx.money(g, amt); bump(g, ctx, -4); const n = catOf(g, ctx);
          return `Vendiste sus fotos a una marca de arena sanitaria por ${U.money(amt)}. ${n.first} exige su parte y se siente ${U.gw(n.gender, 'usado', 'usada')}.`; } }
    ]
  }));

  // ——— Las 3 de la mañana ———
  ev(Object.assign(base('gato_madrugada'), {
    title: 'Las 3 de la mañana',
    text: (g, ctx) => { const n = catOf(g, ctx); return `Son las tres de la mañana. ${n.first} está ${U.gw(n.gender, 'sentado', 'sentada')} en tu pecho, mirándote fijo: ${says(g, ctx, 'gato_madrugada')}`; },
    choices: [
      { t: (g, ctx) => `Escuchar${lo(g, ctx)} hasta el amanecer`, sub: 'Aprendes algo y duermes poco',
        eff: (g, ctx) => { fx.stat(g, 'smarts', 2); fx.stat(g, 'stress', 4); bump(g, ctx, 6);
          return `Hablaron hasta que salió el sol. No resolvieron nada, pero ahora piensas distinto sobre los platos vacíos. Y tienes sueño.`; } },
      { t: 'Taparte con la almohada', sub: 'Duermes; tu gato se ofende',
        eff: (g, ctx) => { bump(g, ctx, -3); fx.stat(g, 'stress', -3);
          return `Te tapaste la cabeza. ${catOf(g, ctx).first} siguió hablando media hora y después se fue a filosofar con la heladera.`; } },
      { t: 'Discutirle', sub: 'Puedes ganar o perder',
        eff: (g, ctx) => {
          bump(g, ctx, 2);
          if (U.chance(0.5)) { fx.stat(g, 'smarts', 3); return `Le ganaste la discusión con un argumento brillante. ${catOf(g, ctx).first} dijo que igual tenía razón y se fue a dormir.`; }
          fx.stat(g, 'happy', -2); return `Te ganó la discusión. A las tres de la mañana, un gato te demostró que estabas ${U.gw(g.p.gender, 'equivocado', 'equivocada')}.`;
        } }
    ]
  }));

  // ——— El veterinario ———
  ev(Object.assign(base('gato_veterinario'), {
    title: 'Toca veterinario',
    text: (g, ctx) => `Toca el control anual y ${catOf(g, ctx).first} se atrincheró debajo de la cama: ${says(g, ctx, 'gato_veterinario')}`,
    choices: [
      { t: (g, ctx) => `Llevar${lo(g, ctx)} igual ($250)`, sub: 'Bueno para su salud, malo para la relación', when: (g) => g.p.money >= 250,
        eff: (g, ctx) => { const n = catOf(g, ctx); fx.money(g, -250); n.health = U.clamp((n.health || 0) + 15, 0, 100); bump(g, ctx, -5);
          return `${U.gw(n.gender, 'Lo', 'La')} llevaste en la transportadora mientras recitaba sus derechos. Está más ${U.gw(n.gender, 'sano', 'sana')} y no te habla.`; } },
      { t: 'Negociar', sub: '$250 si acepta. Depende de tu carisma', when: (g) => g.p.money >= 250,
        eff: (g, ctx) => {
          const n = catOf(g, ctx);
          if (U.chance(0.4 + g.p.skills.carisma / 200)) {
            fx.money(g, -250); n.health = U.clamp((n.health || 0) + 15, 0, 100); bump(g, ctx, 2);
            return `Tres premios, una promesa y un discurso después, ${n.first} fue por su propia pata. El veterinario dice que nunca vio un paciente tan educado.`;
          }
          fx.stat(g, 'health', -2); return `La negociación terminó cuando ${n.first} te arañó la mano. No hubo veterinario; hubo curita.`;
        } },
      { t: (g, ctx) => `Dejar${lo(g, ctx)} por este año`, sub: 'Tu gato feliz, su salud no tanto',
        eff: (g, ctx) => { const n = catOf(g, ctx); n.health = U.clamp((n.health || 0) - 5, 0, 100); bump(g, ctx, 3);
          return `Cancelaste el turno. ${n.first} salió de abajo de la cama en dos segundos y dice que eres una persona razonable.`; } }
    ]
  }));
})(window.MV = window.MV || {});
