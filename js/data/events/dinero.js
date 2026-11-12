/* Mil Vidas — eventos del dinero: inquilinos, desastres en tus propiedades. */
(function (MV) {
  'use strict';
  const U = MV.U, ev = MV.ev, fx = MV.fx;
  const R = () => MV.sys.realty;
  const INS = () => MV.sys.insurance;

  /** La propiedad del evento, si sigue siendo tuya y alquilada. */
  const rentedOf = (g, ctx) => { const a = g.p.assets.find((x) => x.id === ctx.asset); return a && a.rent ? a : null; };
  const tenantOf = (g, ctx) => { const a = rentedOf(g, ctx); return (a && a.rent.tenant) || null; };
  const who = (g, ctx) => { const t = tenantOf(g, ctx); return t ? t.name : 'Tu inquilino'; };
  const GONE = 'Esa propiedad ya no está en tus manos. Problema de otro.';
  const repair = (a) => Math.round(a.value * 0.05);
  /** Cambia de inquilino conservando el nivel del alquiler. */
  const swap = (g, a) => { a.rent.tenant = R().newTenant(g, a, a.rent.level); delete a.rent.owed; return a.rent.tenant; };
  const arrival = (t) => `${t.name} ${MV.TENANT_KINDS[t.kind].icon} (${R().kindName(t)})`;

  // ——— El moroso no paga ———
  ev({
    id: 'inquilino_no_paga', manual: true, icon: '🐌', scene: 'ciudad',
    title: (g, ctx) => `${who(g, ctx)} no pagó`,
    text: (g, ctx) => {
      const a = rentedOf(g, ctx);
      return a ? `${who(g, ctx)} no pagó el alquiler de ${a.name} este año. Jura que "la semana que viene, seguro".` : GONE;
    },
    choices: [
      { t: 'Esperar', sub: 'Mitad y mitad: el año que viene paga el doble… o nada',
        eff: (g, ctx) => {
          const a = rentedOf(g, ctx); if (!a) return GONE;
          const t = a.rent.tenant || {};
          if (U.chance(0.5)) { a.rent.owed = true; return `Esperaste. ${t.name || 'Tu inquilino'} prometió pagarte todo junto el año que viene.`; }
          const n = swap(g, a);
          return `Esperaste… y un día encontraste las llaves en el buzón: ${t.name || 'tu inquilino'} se fue sin pagar. Ya llegó ${arrival(n)}.`;
        } },
      { t: 'Desalojarlo', sub: 'Abogado: $3.000. La propiedad queda vacía este año',
        eff: (g, ctx) => {
          const a = rentedOf(g, ctx); if (!a) return GONE;
          const t = a.rent.tenant || {};
          fx.money(g, -3000);
          const n = swap(g, a);
          a.rent.vacant = g.p.age;
          return `Pagaste ${U.money(3000)} de abogado y ${t.name || 'tu inquilino'} tuvo que irse. ${a.name} queda vacía este año; el próximo llega ${arrival(n)}.`;
        } },
      { t: 'Perdonarlo', sub: '+3 de karma',
        eff: (g, ctx) => {
          const a = rentedOf(g, ctx); if (!a) return GONE;
          fx.stat(g, 'karma', 3);
          const t = a.rent.tenant;
          if (t && U.chance(0.5)) { t.kind = 'puntual'; return `Le perdonaste la deuda a ${t.name}. Tanta fue la emoción que desde ahora paga puntual.`; }
          return `Le perdonaste la deuda a ${t ? t.name : 'tu inquilino'}. Te mandó un mensaje con muchos emojis de corazón.`;
        } }
    ]
  });

  // ——— El fiestero rompe algo ———
  const THINGS = ['el calefón', 'la puerta del baño', 'tres ventanas', 'el inodoro (no preguntes cómo)', 'la escalera', 'el techo del balcón'];
  ev({
    id: 'inquilino_rompe', manual: true, icon: '💥', scene: 'ciudad',
    title: (g, ctx) => `${who(g, ctx)} rompió algo`,
    text: (g, ctx) => {
      const a = rentedOf(g, ctx);
      return a ? `${who(g, ctx)} hizo una fiesta en ${a.name} y rompió ${U.pick(THINGS)}. La reparación cuesta ${U.money(repair(a))}.` : GONE;
    },
    choices: [
      { t: 'Cobrarle', sub: 'Casi siempre paga',
        eff: (g, ctx) => {
          const a = rentedOf(g, ctx); if (!a) return GONE;
          const t = a.rent.tenant || {};
          if (U.chance(0.7)) return `${t.name || 'Tu inquilino'} pagó la reparación de mala gana.`;
          a.cond = U.clamp(a.cond - 15, 0, 100);
          const n = swap(g, a);
          return `${t.name || 'Tu inquilino'} se fue ofendidísimo sin pagar. Nadie arregló nada y ${a.name} quedó peor. Ya llegó ${arrival(n)}.`;
        } },
      { t: (g, ctx) => { const a = rentedOf(g, ctx); return a ? `Pagarlo tú (${U.money(repair(a))})` : 'Pagarlo tú'; }, sub: 'Para no pelear',
        eff: (g, ctx) => {
          const a = rentedOf(g, ctx); if (!a) return GONE;
          fx.money(g, -repair(a));
          return `Pagaste ${U.money(repair(a))} de reparación. Tu inquilino prometió "fiestas más tranquilas".`;
        } },
      { t: 'Usar el seguro de hogar', sub: 'No pagas nada', when: (g, ctx) => !!rentedOf(g, ctx) && INS().covered(g, 'hogar', ctx.asset),
        eff: (g, ctx) => {
          const a = rentedOf(g, ctx); if (!a) return GONE;
          return `El seguro de hogar pagó la reparación de ${a.name}. Por fin le sacaste provecho.`;
        } }
    ]
  });

  // ——— El inquilino quiere comprar ———
  const offer = (a) => Math.round(a.value * 1.05);
  ev({
    id: 'inquilino_compra', manual: true, icon: '🤝', scene: 'ciudad',
    title: (g, ctx) => `${who(g, ctx)} quiere comprar`,
    text: (g, ctx) => {
      const a = rentedOf(g, ctx);
      return a ? `${who(g, ctx)} se enamoró de ${a.name} y te ofrece ${U.money(offer(a))}: un 5 % más de lo que vale.` : GONE;
    },
    choices: [
      { t: (g, ctx) => { const a = rentedOf(g, ctx); return a ? `Vender por ${U.money(offer(a))}` : 'Vender'; }, sub: 'Sin comisiones ni visitas',
        eff: (g, ctx) => {
          const a = rentedOf(g, ctx); if (!a) return GONE;
          const t = a.rent.tenant || {};
          return `${MV.sys.money.sellFor(g, a.id, offer(a))} ${t.name || 'Tu inquilino'} ya está eligiendo cortinas.`;
        } },
      { t: 'No vender', sub: 'Sigue alquilando',
        eff: (g, ctx) => {
          const a = rentedOf(g, ctx); if (!a) return GONE;
          return `Le dijiste que ${a.name} no está en venta. Sigue alquilando y suspirando.`;
        } }
    ]
  });

  // ——— El inquilino se va (aviso) ———
  ev({
    id: 'inquilino_se_va', manual: true, modal: true, icon: '📦', scene: 'ciudad', title: 'Cambio de inquilino',
    // El texto se arma en el efecto (el motor lo lee después de aplicarlo).
    text: (g, ctx) => ctx.msg || '',
    auto: (g, ctx) => {
      const a = rentedOf(g, ctx);
      if (!a) { ctx.msg = GONE; return ''; }
      const t = a.rent.tenant;
      const n = swap(g, a);
      ctx.msg = `${t ? t.name : 'Tu inquilino'} se mudó de ${a.name}. ${U.pick(['Dejó una planta y una nota amable.', 'Se llevó hasta los focos.', 'Dice que te va a extrañar.'])} Ya llegó ${arrival(n)}.`;
      return '';
    }
  });

  // ——— Desastre en una propiedad (aviso) ———
  const damageable = (g) => g.p.assets.filter((a) => MV.sys.realty.isRealty(a) && a.type !== 'terreno');
  const DISASTERS = [
    (n) => `Un incendio en la cocina de ${n} dejó todo negro y con olor a asado fallido.`,
    (n) => `Una inundación convirtió ${n} en una pileta techada.`,
    (n) => `El árbol del vecino se cayó sobre ${n}. El vecino dice que "el árbol es del municipio".`
  ];
  ev({
    id: 'desastre_hogar', age: [18, 130], w: 0.3, cd: 4, modal: true, icon: '🔥', scene: 'ciudad', title: 'Desastre en tu propiedad',
    when: (g) => damageable(g).length > 0,
    ctx: (g) => ({ asset: U.pick(damageable(g)).id }),
    text: (g, ctx) => ctx.msg || '',
    auto: (g, ctx) => {
      const a = g.p.assets.find((x) => x.id === ctx.asset);
      if (!a) { ctx.msg = GONE; return ''; }
      a.cond = U.clamp(a.cond - 40, 0, 100);
      const txt = U.pick(DISASTERS)(a.name);
      if (INS().covered(g, 'hogar', a.id)) { ctx.msg = `${txt} El seguro de hogar pagó la reparación.`; return ''; }
      const cost = Math.round(a.value * 0.1);
      fx.money(g, -cost);
      ctx.msg = `${txt} Sin seguro, la reparación te costó ${U.money(cost)}.`;
      return '';
    }
  });

  // ——— Investigación por lavado (la encolan dirty.launder y dirty.yearly) ———
  ev({
    id: 'investigacion_lavado', pushOnly: true, icon: '🕵️', scene: 'ciudad', title: 'Te investigan por lavado',
    when: (g) => !g.p.prison && g.p.dirty > 0,
    text: (g) => `Un fiscal pidió tus cuentas: no le cierran ${U.money(g.p.dirty)} que nadie sabe de dónde salieron. Tu teléfono suena demasiado.`,
    choices: [
      { t: 'Contratar un abogado', sub: '$20.000. Casi siempre se archiva',
        eff: (g) => {
          const p = g.p;
          fx.money(g, -20000);
          if (U.chance(0.6)) return `Tu abogado habló de "errores administrativos" durante tres horas. El fiscal archivó la causa por cansancio.`;
          const seized = p.dirty, fine = Math.max(0, Math.round(p.money * 0.2));
          p.dirty = 0;
          fx.money(g, -fine);
          return `Ni tu abogado pudo. Te decomisaron ${U.money(seized)} y te multaron con ${U.money(fine)}.`;
        } },
      { t: 'Confesar', sub: 'Pierdes el sucio y vas preso 2 años',
        eff: (g) => {
          const p = g.p, seized = p.dirty;
          p.dirty = 0;
          // Confesar evita el juicio: la condena es directa.
          p.counters.arrestos = (p.counters.arrestos || 0) + 1;
          p.record.push({ crime: 'Lavado de dinero', age: p.age, years: 2 });
          MV.sys.crime.jail(g, 2, 'Lavado de dinero');
          return `Confesaste todo. Te decomisaron ${U.money(seized)} y te dieron 2 años por lavado de dinero. Al menos dormiste tranquilo.`;
        } },
      { t: 'Huir', sub: 'Conservas el sucio, pero te buscan',
        eff: (g) => {
          const p = g.p;
          p.wanted = Math.max(p.wanted || 0, 3);
          fx.stat(g, 'stress', 10);
          return `Te fuiste con lo puesto y ${U.money(p.dirty)} en una mochila. Ahora eres prófugo: cuidado con los controles.`;
        } }
    ]
  });
})(window.MV = window.MV || {});
