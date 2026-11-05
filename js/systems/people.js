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
          if (n.age >= (n.lifespan || 12) || U.chance(0.01)) people.die(g, n, n.age >= (n.lifespan || 12) ? 'vejez' : 'un accidente misterioso');
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
    },

    die(g, n, cause) {
      n.alive = false;
      n.deathAge = n.age;
      n.cause = cause;
      const r = MV.relOf(g, n.id);
      if (!r || !g.p.alive) return;
      const label = MV.relLabel(r.type, n).toLowerCase();
      const close = ['padre', 'hijo', 'conyuge', 'hermano', 'pareja', 'abuelo', 'mascota'].includes(r.type);
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
