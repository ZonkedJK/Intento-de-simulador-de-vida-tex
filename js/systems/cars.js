/* Mil Vidas — autos: rendimiento, tuneo, carreras (callejeras y en circuito), seguro y choques, robos y multas del año. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  /** Rendimiento base de los autos viejos (sin modelo), según su tipo. */
  const OLD_PERF = { 'Chatarra con ruedas': 10, Moto: 35, Compacto: 22, 'Sedán': 30, 'Eléctrico': 40, Camioneta: 25, 'Clásico restaurado': 40, 'SUV de lujo': 35, Deportivo: 65, Superdeportivo: 82 };
  const mine = (g, id) => g.p.assets.find((a) => a.id === id && a.type === 'auto') || null;
  const model = (a) => (a && a.model ? MV.CAR_CATALOG.find((m) => m.id === a.model) : null);
  const remove = (g, a) => { g.p.assets = g.p.assets.filter((x) => x !== a); g.queue = g.queue.filter((it) => !(it.ctx && it.ctx.asset === a.id)); };
  const short = (a) => { const m = model(a); return m ? `${m.brand} ${m.model}` : a.name; };

  const cars = {
    /** Rendimiento 0–130: velocidad y aceleración del modelo + tuneo, según el estado del auto. */
    perf(a) {
      const m = model(a);
      const base = m ? U.clamp(Math.round((m.speed - 100) / 4 + (12 - m.accel) * 3), 5, 100) : OLD_PERF[a.kind] || 25;
      const tune = Object.keys(a.tune || {}).reduce((s, k) => s + (a.tune[k] && MV.CAR_TUNES[k] ? MV.CAR_TUNES[k].perf : 0), 0);
      return Math.round((base + tune) * (0.6 + U.clamp(a.cond, 0, 100) / 250));
    },

    tune(g, assetId, part) {
      const a = mine(g, assetId), T = MV.CAR_TUNES[part], p = g.p;
      if (!a) return 'No tienes ese auto.';
      if (!T) return 'Esa pieza no existe (todavía).';
      a.tune = a.tune || {};
      if (a.tune[part]) return `Tu ${short(a)} ya tiene ${T.name.toLowerCase()}.`;
      if (p.money < T.cost) return `No te alcanza: ${T.name.toLowerCase()} cuesta ${U.money(T.cost)}.`;
      MV.fx.money(g, -T.cost);
      a.tune[part] = true;
      a.value += Math.round(T.cost * T.back);
      MV.fx.stat(g, 'happy', 2);
      return `Le pusiste ${T.name.toLowerCase()} a tu ${short(a)} por ${U.money(T.cost)}. ${U.pick(['Ahora ruge distinto.', 'El mecánico te guiñó un ojo.', 'Tus vecinos ya te odian un poco más.'])}`;
    },

    /** Carrera: 'calle' (18+, apuesta, policía y choques) o 'circuito' (inscripción $500 y premios). */
    race(g, assetId, kind, bet) {
      const p = g.p, a = mine(g, assetId);
      if (!a) return 'No tienes ese auto.';
      if (p.prison) return 'Desde la cárcel solo corres a la fila del comedor.';
      if (!MV.sys.license.has(g, 'auto')) return 'Sin licencia de conducir no te dejan correr (ni en la calle te aceptan los sin licencia).';
      if (a.cond < 10) return `Tu ${short(a)} no arranca. Primero llévalo al taller.`;
      const me = cars.perf(a);
      if (kind === 'calle') {
        if (p.age < 18) return 'Tienes que tener 18 años para correr picadas. Y ni así deberías.';
        bet = Math.max(0, Math.round(bet || 0));
        if (bet > p.money) return `No tienes ${U.money(bet)} para apostar.`;
        p.flags.lastStreetRace = p.age;
        MV.fx.stat(g, 'stress', 3);
        if (U.chance(0.12)) {
          a.cond = U.clamp(a.cond - U.int(20, 50), 0, 100);
          MV.fx.stat(g, 'health', -U.int(5, 20));
          if (bet) MV.fx.money(g, -bet);
          return `Chocaste contra un poste en plena picada. ${a.insured ? 'El seguro no cubre carreras ilegales (lo dice la letra chica).' : 'Sin seguro, el taller te espera.'} Perdiste la apuesta y algo de dignidad.`;
        }
        const won = me + U.int(-15, 15) > U.int(25, 95);
        if (won) { MV.fx.money(g, bet); MV.fx.stat(g, 'happy', 6); MV.fx.stat(g, 'fame', 1); } else { MV.fx.money(g, -bet); MV.fx.stat(g, 'happy', -3); }
        const res = won ? `Ganaste la picada con tu ${short(a)} y te llevaste ${U.money(bet)}.` : `Perdiste la picada: el otro auto tenía más motor (o menos miedo). Se llevó ${U.money(bet)}.`;
        if (U.chance(0.15)) {
          if (U.chance(0.3)) { MV.sys.crime.arrest(g, 'Carreras ilegales', 1); return `${res} Pero llegó la policía y te detuvieron.`; }
          const fine = U.int(500, 3000);
          MV.fx.money(g, -fine);
          return `${res} Llegó la policía: multa de ${U.money(fine)} y un sermón.`;
        }
        return res;
      }
      // En circuito
      if (p.money < 500) return 'La inscripción al circuito cuesta $500 y no te alcanza.';
      MV.fx.money(g, -500);
      const rivals = [0, 0, 0, 0, 0].map(() => U.int(20, 90) + U.int(-10, 10));
      const mine2 = me + U.int(-10, 10);
      const pos = 1 + rivals.filter((r) => r > mine2).length;
      if (U.chance(0.03)) { a.cond = U.clamp(a.cond - U.int(10, 25), 0, 100); return `Te despistaste en la curva 3 y terminaste en la grava. Tu ${short(a)} quedó raspado.`; }
      const prize = { 1: 8000, 2: 3000, 3: 1000 }[pos] || 0;
      if (prize) MV.fx.money(g, prize);
      MV.fx.stat(g, 'happy', pos === 1 ? 8 : pos <= 3 ? 4 : 1);
      if (pos === 1) MV.fx.stat(g, 'fame', 1);
      return pos === 1 ? `¡Ganaste! Primer puesto en el circuito con tu ${short(a)} y ${U.money(prize)} de premio.`
        : prize ? `Llegaste en el puesto ${pos} y te llevaste ${U.money(prize)}.` : `Llegaste en el puesto ${pos} de 6. ${U.pick(['El público aplaudió igual.', 'Por lo menos no fuiste último.', 'Culpaste a los neumáticos.'])}`;
    },

    premium(a) { return Math.round(a.value * 0.03); },

    insure(g, assetId, on) {
      const a = mine(g, assetId);
      if (!a) return 'No tienes ese auto.';
      if (!on) { a.insured = false; return `Cancelaste el seguro de tu ${short(a)}. Que la suerte te acompañe.`; }
      if (a.insured) return `Tu ${short(a)} ya está asegurado.`;
      const prem = cars.premium(a);
      if (g.p.money < prem) return `El seguro cuesta ${U.money(prem)} al año y no te alcanza.`;
      MV.fx.money(g, -prem);
      a.insured = true;
      return `Aseguraste tu ${short(a)} por ${U.money(prem)} al año. Cubre choques y robos.`;
    },

    /** Cobra los seguros y reparte los choques, robos y multas del año (uno por auto como mucho). */
    yearly(g) {
      const p = g.p;
      if (!p.alive || p.prison) return;
      const raced = p.flags.lastStreetRace === p.age || p.flags.lastStreetRace === p.age - 1;
      p.assets.filter((a) => a.type === 'auto').forEach((a) => {
        if (a.insured) {
          const prem = cars.premium(a);
          if (p.money >= prem) MV.fx.money(g, -prem);
          else { a.insured = false; MV.log(g, `No pudiste pagar el seguro de tu ${short(a)} y te lo dieron de baja.`, '📄', 'bad'); }
        }
        const theft = Math.min(0.06, 0.01 + a.value / 2e6 * 0.05);
        const crash = 0.02 + ((p.addic.alcohol || 0) > 40 ? 0.06 : 0) + (raced ? 0.06 : 0);
        const fine = 0.04 + (raced ? 0.05 : 0);
        const r = U.float(0, 1);
        if (r < theft) {
          remove(g, a);
          if (a.insured) { MV.fx.money(g, a.value); MV.EV.info(g, { title: 'Te robaron el auto', icon: '🚨', scene: 'ciudad', text: `Te robaron tu ${short(a)}. El seguro te pagó ${U.money(a.value)}. Ya miras autos nuevos.` }); }
          else { MV.fx.stat(g, 'happy', -10); MV.EV.info(g, { title: 'Te robaron el auto', icon: '🚨', scene: 'ciudad', text: `Te robaron tu ${short(a)}. No tenía seguro. Lo único que te queda es la llave.` }); }
        } else if (r < theft + crash) {
          MV.fx.stat(g, 'health', -U.int(3, 15));
          if (a.insured) MV.log(g, `Chocaste con tu ${short(a)}. El seguro pagó el taller; tú pagaste con un cuello ortopédico.`, '💥', 'bad');
          else { a.cond = U.clamp(a.cond - U.int(20, 60), 0, 100); MV.log(g, `Chocaste con tu ${short(a)}. Sin seguro, quedó abollado y en tu conciencia.`, '💥', 'bad'); }
        } else if (r < theft + crash + fine) {
          const amt = U.int(100, 800);
          MV.fx.money(g, -amt);
          MV.log(g, `Te llegó una multa de ${U.money(amt)} por ${U.pick(['exceso de velocidad', 'estacionar en doble fila', 'pasar en amarillo (era rojo)', 'tocar bocina frente a un hospital'])}.`, '🧾');
        }
      });
    }
  };
  MV.sys.cars = cars;
})(window.MV = window.MV || {});
