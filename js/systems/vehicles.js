/* Mil Vidas — usar tus vehículos: avión privado, helicóptero y yate (con licencia, o pagando tripulación). */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const KIND = { 'Avión privado': 'avion', 'Helicóptero': 'helicoptero', 'Yate': 'yate' };
  const CREW = { avion: 5000, helicoptero: 3000, yate: 1500 };
  const CREW_NAME = { avion: 'un piloto', helicoptero: 'un piloto', yate: 'un capitán' };
  const NO_FLY = ['espacio', 'crucero'];
  const fuel = (D) => Math.round(D.cost * 0.25);

  const vehicles = {
    kindOf(a) { return (a && KIND[a.kind]) || null; },

    /** Lo que cuesta la tripulación si no tienes la licencia (0 si la tienes). */
    crew(g, kind) { return MV.sys.license.has(g, kind) ? 0 : CREW[kind]; },

    /** Acciones del vehículo (comparten el contador del año: 2 usos por acción). */
    actions(g, a) {
      const k = vehicles.kindOf(a), p = g.p;
      if (!k || p.prison) return [];
      const crew = vehicles.crew(g, k);
      const extra = crew ? ` + ${U.money(crew)} de ${CREW_NAME[k]} (sin licencia)` : '';
      const who = crew ? ` con ${CREW_NAME[k]} contratado` : `, al mando tú`;
      const list = [];
      const A = (o) => list.push(o);
      if (k === 'avion') {
        A({ id: 'volar', icon: '✈️', label: 'Volar a un destino', sub: `Solo combustible: el 25 % del pasaje${extra}`, limit: 2,
          when: () => MV.DESTINATIONS.some((D) => !NO_FLY.includes(D.id) && p.money >= fuel(D) + crew),
          opts: (g) => MV.DESTINATIONS.filter((D) => !NO_FLY.includes(D.id) && g.p.money >= fuel(D) + crew).map((D) => ({ id: D.id, icon: D.icon, label: D.name, sub: U.money(fuel(D) + crew) })),
          run: (g, id) => {
            const D = MV.DESTINATIONS.find((x) => x.id === id);
            if (!D) return 'Ese destino no existe.';
            MV.fx.money(g, -(fuel(D) + crew));
            MV.fx.stat(g, 'happy', U.int(6, 12)); MV.fx.stat(g, 'stress', -U.int(10, 20)); MV.fx.skill(g, 'idiomas', 2);
            g.p.counters.viajes = (g.p.counters.viajes || 0) + 1;
            MV.ach.check(g);
            return `Volaste en tu ${a.name.toLowerCase()} a ${D.name}${who}. ${U.pick(['Sin colas, sin escalas y con tu propia música.', 'Aterrizaste y alguien te pidió una foto pensando que eras famoso.', 'Hubo turbulencia. Dijiste que era a propósito.'])}`;
          } });
      }
      if (k === 'helicoptero') {
        A({ id: 'paseo_heli', icon: '🚁', label: 'Paseo sobre la ciudad', sub: `$500 de combustible${extra}`, limit: 2, when: () => p.money >= 500 + crew,
          run: (g) => { MV.fx.money(g, -(500 + crew)); MV.fx.stat(g, 'happy', U.int(5, 10)); MV.fx.stat(g, 'stress', -U.int(5, 12));
            return `Paseaste sobre la ciudad en helicóptero${who}. ${U.pick(['Desde arriba hasta tu barrio parece lindo.', 'Saludaste a la gente. Nadie te saludó.', 'Viste tu casa. Tienes que limpiar el techo.'])}`; } });
        A({ id: 'fiesta_heli', icon: '🎉', label: 'Llegar en helicóptero a una fiesta', sub: `$1.500 de combustible${extra}. Fama y seguidores`, limit: 2, when: () => p.money >= 1500 + crew,
          run: (g) => { MV.fx.money(g, -(1500 + crew)); MV.fx.stat(g, 'fame', U.int(2, 5)); const f = U.int(200, 3000); g.p.followers += f; MV.fx.stat(g, 'happy', 5);
            return `Llegaste a la fiesta en helicóptero${who}. Volaron sombreros, servilletas y la peluca de un invitado. +${U.num(f)} seguidores.`; } });
      }
      if (k === 'yate') {
        A({ id: 'paseo_yate', icon: '🛥️', label: 'Paseo en yate', sub: `$800 de combustible${extra}. Menos estrés`, limit: 2, when: () => p.money >= 800 + crew,
          run: (g) => { MV.fx.money(g, -(800 + crew)); MV.fx.stat(g, 'stress', -U.int(12, 25)); MV.fx.stat(g, 'happy', U.int(4, 8));
            return `Saliste a navegar en tu yate${who}. ${U.pick(['Viste delfines. Uno te miró con lástima.', 'El mar estaba tan tranquilo que te dormiste en cubierta.', 'Te mareaste un poco, pero con estilo.'])}`; } });
        A({ id: 'fiesta_yate', icon: '🍾', label: 'Fiesta en el yate', sub: `$5.000${extra}. Fama, amigos nuevos y algún desastre`, limit: 2, when: () => p.money >= 5000 + crew,
          run: (g) => {
            MV.fx.money(g, -(5000 + crew)); MV.fx.stat(g, 'fame', U.int(1, 4)); MV.fx.stat(g, 'happy', U.int(5, 10)); MV.fx.addic(g, 'alcohol', 3);
            let extraTxt = '';
            if (U.chance(0.4)) { const n = MV.sys.rels.candidate(g); MV.addRel(g, n, 'amigo', U.int(45, 70)); extraTxt = ` Te hiciste amig${U.gw(n.gender, 'o', 'a')} de ${n.first}.`; }
            if (U.chance(0.15)) { MV.fx.stat(g, 'health', -U.int(2, 6)); extraTxt += ' Un invitado se tiró al agua para impresionar y hubo que rescatarlo. Ahora la fiesta tiene un video viral.'; }
            return `Hiciste una fiesta en tu yate${who}. La música se escuchaba desde la costa.${extraTxt}`;
          } });
      }
      return list.filter((x) => !x.when || x.when(g));
    }
  };
  MV.sys.vehicles = vehicles;
})(window.MV = window.MV || {});
