/* Mil Vidas — instrumentos: comprar, practicar, tocar en la calle o en un bar, y el representante. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const music = {
    owned(p) { return (p.assets || []).filter((a) => a.type === 'instrumento'); },
    /** Mejor calidad de instrumento que tienes (0 si no tienes ninguno). */
    best(p) { return Math.max(0, ...music.owned(p).map((a) => a.quality || 1)); },

    buy(g, id) {
      const I = MV.INSTRUMENTS.find((x) => x.id === id), p = g.p;
      if (!I) return 'Ese instrumento no existe.';
      if (p.money < I.price) return `No te alcanza para ${I.name.toLowerCase()}: cuesta ${U.money(I.price)}.`;
      MV.fx.money(g, -I.price);
      p.assets.push({ id: U.uid('a'), type: 'instrumento', kind: I.id, icon: I.icon, name: I.name, value: I.price, cond: 100, quality: I.quality, bought: p.age });
      MV.fx.stat(g, 'happy', 4);
      return `Compraste ${I.art} ${I.name.toLowerCase()}. ${U.pick(['Los vecinos ya están preocupados.', 'Lo miraste un rato largo antes de animarte a tocarlo.', 'Ahora eres oficialmente "alguien que toca".'])}`;
    },

    actions(g, a) {
      const p = g.p;
      if (!a || a.type !== 'instrumento' || p.prison) return [];
      const q = a.quality || 1, n = a.name.toLowerCase();
      const list = [];
      list.push({ id: 'practicar_inst', icon: '🎼', label: `Practicar con tu ${n}`, sub: '+Música (más que la práctica común)', limit: 1,
        run: (g) => { MV.fx.skill(g, 'musica', U.int(4, 8) + q); MV.fx.stat(g, 'stress', -2);
          return U.pick([`Practicaste ${n} durante horas. Te salió algo parecido a una canción.`, `Practicaste escalas con tu ${n} hasta que te dolieron los dedos.`, `Tocaste tu ${n} con la ventana abierta. Un vecino aplaudió. Otro no.`]); } });
      if (p.age >= 10) list.push({ id: 'tocar_calle', icon: '🪙', label: 'Tocar en la calle', sub: 'Monedas y, quizás, un poco de fama', limit: 1,
        run: (g) => {
          const amt = Math.round(U.int(5, 40) * (1 + p.skills.musica / 20));
          MV.fx.money(g, amt); MV.fx.skill(g, 'musica', 1);
          if (U.chance(0.1)) MV.fx.stat(g, 'fame', 1);
          return amt > 150 ? `Tocaste en la calle con tu ${n} y juntaste ${U.money(amt)}. Hasta un turista te filmó.` : `Tocaste en la calle con tu ${n}. Juntaste ${U.money(amt)} y un chicle usado.`;
        } });
      if (p.age >= 16 && p.skills.musica >= 30) list.push({ id: 'tocar_bar', icon: '🍻', label: 'Tocar en un bar', sub: 'Más dinero y fama. A veces aparece un representante', limit: 1,
        run: (g) => {
          const amt = Math.round(U.int(150, 600) * (1 + p.skills.musica / 40) * (1 + q * 0.2));
          MV.fx.money(g, amt); MV.fx.stat(g, 'fame', U.int(1, 2)); MV.fx.skill(g, 'musica', 1); MV.fx.stat(g, 'happy', 4);
          if (p.job && p.job.id === 'musico') { p.job.perf = U.clamp(p.job.perf + 8, 0, 100); return `Tocaste en un bar lleno. Ganaste ${U.money(amt)} y tu carrera musical lo nota.`; }
          if (U.chance(U.clamp(0.08 + p.skills.musica / 300 + p.fame / 300 + q * 0.03, 0, 0.6))) MV.EV.push(g, 'representante', {}, true);
          return `Tocaste en un bar con tu ${n}. Ganaste ${U.money(amt)}. ${U.pick(['Pidieron otra.', 'Alguien lloró en la primera fila. De emoción, creemos.', 'El dueño te ofreció volver el sábado.'])}`;
        } });
      return list;
    }
  };
  MV.sys.music = music;

  MV.ev({
    id: 'representante', manual: true, prison: 'any', icon: '🕶️', scene: 'escenario', title: 'Un representante',
    text: 'Un representante con lentes de sol bajo techo te escuchó tocar en el bar. Quiere firmarte un contrato.',
    choices: [
      { t: '✍️ Firmar el contrato', eff: (g) => {
        const J = MV.FAME.musico, lvl = g.p.skills.musica >= 60 ? 2 : 1;
        MV.sys.career.hire(g, J, lvl); MV.fx.stat(g, 'fame', U.int(3, 6)); MV.fx.stat(g, 'happy', 10);
        return `Firmaste. Ahora eres ${MV.sys.career.title(g.p).toLowerCase()} y ganas ${U.money(g.p.job.salary)} al año.`;
      } },
      { t: '🙅 Rechazar: prefiero ser independiente', eff: { happy: 2, msg: 'Le dijiste que no. Se fue murmurando "este es de los que se arrepienten".' } }
    ]
  });
})(window.MV = window.MV || {});
