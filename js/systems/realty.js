/* Mil Vidas — inmuebles: mercado inmobiliario, alquiler con inquilinos, edificios, casas de vacaciones y construir. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const TYPES = ['casa', 'local', 'terreno', 'edificio', 'vacaciones'];
  const PHASES = { auge: 0.06, estable: 0, caida: -0.06 };

  const realty = {
    TYPES,
    isRealty(a) { return !!a && TYPES.includes(a.type); },

    /** Mercado inmobiliario de la partida (se crea estable si falta). */
    market(g) {
      if (!g.realty || !PHASES.hasOwnProperty(g.realty.phase)) g.realty = { phase: 'estable', left: 3 };
      return g.realty;
    },
    marketMod(g) { return PHASES[realty.market(g).phase]; },

    /** Avanza el ciclo: cada fase dura de 2 a 5 años y nunca se repite seguida. */
    yearly(g) {
      const m = realty.market(g);
      m.left--;
      if (m.left <= 0) {
        m.phase = U.pick(Object.keys(PHASES).filter((k) => k !== m.phase));
        m.left = U.int(2, 5);
      }
    },

    /** Se puede alquilar: una casa que no es tu hogar, un local o un edificio. */
    rentable(g, a) {
      if (!a) return false;
      if (a.type === 'casa') return g.p.home !== a.id;
      return a.type === 'local' || a.type === 'edificio';
    },

    /** Sortea un inquilino según la mezcla del nivel: una persona en casas, un negocio en locales. */
    newTenant(g, a, level) {
      const L = MV.RENT_LEVELS[level] || MV.RENT_LEVELS.normal;
      const kind = U.pickW(Object.keys(L.mix), (k) => L.mix[k]);
      if (a.type === 'local') return { name: U.pick(MV.SHOP_TENANTS), kind };
      const gender = U.pick(['m', 'f']);
      return { name: `${MV.randomFirst(gender, g.p.country)} ${MV.randomLast(g.p.country)}`, kind, gender };
    },

    /** "puntual", "morosa", "fiestero"… según el género del inquilino. */
    kindName(t) {
      const K = MV.TENANT_KINDS[t.kind] || MV.TENANT_KINDS.puntual;
      const [m, f] = K.name.split('|');
      return t.gender === 'f' ? (f || m) : m;
    },

    rentOut(g, id, level) {
      const a = g.p.assets.find((x) => x.id === id);
      if (!realty.rentable(g, a)) return 'Eso no se puede alquilar.';
      const lv = MV.RENT_LEVELS[level] ? level : 'normal';
      const tenant = a.type === 'edificio' ? null : realty.newTenant(g, a, lv);
      a.rent = { level: lv, tenant, since: g.p.age };
      a.rented = true;
      if (!tenant) return `Pusiste en alquiler los 6 departamentos de ${a.name} a precio ${lv}.`;
      const K = MV.TENANT_KINDS[tenant.kind];
      return `Alquilaste ${a.name} a precio ${lv}. Se instala ${tenant.name} ${K.icon} (${realty.kindName(tenant)}).`;
    },

    stopRent(g, id) {
      const a = g.p.assets.find((x) => x.id === id);
      if (!a || !a.rent) return 'Eso no está en alquiler.';
      const t = a.rent.tenant;
      delete a.rent;
      a.rented = false;
      return t ? `${t.name} dejó ${a.name}. Ya no está en alquiler.` : `Sacaste ${a.name} del alquiler.`;
    },

    /** Cambia el precio del alquiler; una vez por año y el inquilino se queda. */
    setLevel(g, id, level) {
      const a = g.p.assets.find((x) => x.id === id);
      if (!a || !a.rent) return 'Eso no está en alquiler.';
      if (!MV.RENT_LEVELS[level]) return 'Ese precio no existe.';
      if (a.rent.changed === g.p.age) return 'Ya cambiaste el precio este año.';
      a.rent.level = level;
      a.rent.changed = g.p.age;
      return `Ahora ${a.name} se alquila a precio ${level}.`;
    },

    /** Te mudas a una casa tuya: si estaba alquilada, el inquilino se va. */
    moveIn(g, id) {
      const p = g.p, a = p.assets.find((x) => x.id === id);
      if (!a || a.type !== 'casa') return 'Solo puedes mudarte a una casa.';
      const t = a.rent && a.rent.tenant;
      realty.stopRent(g, id);
      a.rented = false;
      p.housing = 'propia'; p.home = a.id; p.rent = null;
      MV.fx.stat(g, 'happy', 5);
      return `Te mudaste a ${a.name}.${t ? ` ${t.name} tuvo que buscarse otro lugar.` : ''}`;
    },

    /** Lo que rinden en el año los inmuebles alquilados y las casas de vacaciones. */
    income(g) {
      const p = g.p, lines = [];
      let amount = 0;
      p.assets.forEach((a) => {
        if (a.type === 'vacaciones') {
          let r = Math.round(a.value * U.float(0, 0.12));
          // El año se cobra al cumplir años: cuenta el verano de este año o del que termina.
          if (a.summer != null && a.summer >= p.age - 1) r = Math.round(r / 2);
          if (r > 0) { amount += r; lines.push(`temporada en ${a.name} ${U.money(r)}`); }
          return;
        }
        if (!a.rent && a.rented && realty.rentable(g, a)) a.rent = { level: 'normal', tenant: a.type === 'edificio' ? null : realty.newTenant(g, a, 'normal'), since: p.age };
        if (!a.rent) return;
        if (!realty.rentable(g, a)) { realty.stopRent(g, a.id); return; }
        const L = MV.RENT_LEVELS[a.rent.level] || MV.RENT_LEVELS.normal;
        if (a.type === 'edificio') {
          let paid = 0;
          for (let i = 0; i < 6; i++) if (!U.chance(L.unitVacancy) && !U.chance(L.unitMoroso)) paid++;
          const r = Math.round(a.value * 0.05 / 6 * paid * L.factor);
          amount += r;
          lines.push(`${a.name}: ${paid} de 6 departamentos pagaron ${U.money(r)}`);
          return;
        }
        let r = Math.round(a.value * L.pct * (a.type === 'local' ? 1.5 : 1));
        // Desalojado: queda vacía el año del desalojo (se cobra al cumplir años, de ahí el −1).
        if (a.rent.vacant != null && a.rent.vacant >= p.age - 1) {
          lines.push(`${a.name} estuvo vacío`);
          return;
        }
        if (U.chance(L.vacancy)) {
          a.rent.tenant = realty.newTenant(g, a, a.rent.level);
          delete a.rent.owed;
          lines.push(`${a.name} estuvo vacío`);
          return;
        }
        const t = a.rent.tenant || (a.rent.tenant = realty.newTenant(g, a, a.rent.level));
        if (t.kind === 'moroso' && U.chance(0.4)) {
          a.rent.unpaid = p.age;
          lines.push(`${t.name} no pagó ${a.name}`);
          MV.EV.push(g, 'inquilino_no_paga', { asset: a.id });
          return;
        }
        let broke = false;
        if (t.kind === 'fiestero' && U.chance(0.3)) { a.rent.broke = p.age; broke = true; }
        if (a.rent.owed) { r *= 2; delete a.rent.owed; }
        amount += r;
        lines.push(`alquiler de ${a.name} ${U.money(r)}`);
        if (broke) MV.EV.push(g, 'inquilino_rompe', { asset: a.id });
        else if (U.chance(0.05)) MV.EV.push(g, 'inquilino_compra', { asset: a.id });
        else if (U.chance(0.08)) MV.EV.push(g, 'inquilino_se_va', { asset: a.id });
      });
      return { amount, lines };
    },

    /** "Veranear ahí": una vez por año en cada casa de vacaciones. */
    summerAction(g, id) {
      return {
        id: 'veranear_' + id, icon: '🏖️', limit: 1,
        check: (gg) => (gg.p.assets.some((x) => x.id === id) ? null : 'Esa casa ya no es tuya.'),
        run: (gg) => {
          const a = gg.p.assets.find((x) => x.id === id);
          a.summer = gg.p.age;
          MV.fx.stat(gg, 'happy', 6); MV.fx.stat(gg, 'stress', -8);
          return `Pasaste el verano en ${a.name}. ${U.pick(['Volviste con arena hasta en los bolsillos.', 'Dormiste siestas de campeonato.', 'Este año la temporada rinde menos, pero valió la pena.'])}`;
        }
      };
    },

    /** Construye en un terreno: una casa (cuesta 1× el valor) o un local (1,2×). */
    build(g, id, what) {
      const p = g.p, a = p.assets.find((x) => x.id === id);
      if (!a || a.type !== 'terreno') return 'Solo se construye en un terreno.';
      const casa = what === 'casa';
      const cost = Math.round(a.value * (casa ? 1 : 1.2));
      if (p.money < cost) return `No te alcanza: construir ${casa ? 'una casa' : 'un local'} cuesta ${U.money(cost)}.`;
      MV.fx.money(g, -cost);
      Object.assign(a, casa
        ? { type: 'casa', kind: 'Casa en tu terreno', name: 'Casa en tu terreno', icon: '🏡', value: Math.round(a.value * 2.2), cond: 100 }
        : { type: 'local', kind: 'Local en tu terreno', name: 'Local en tu terreno', icon: '🏪', value: Math.round(a.value * 2.5), cond: 100 });
      return `Construiste ${casa ? 'una casa' : 'un local'} en tu terreno por ${U.money(cost)}. Ahora vale ${U.money(a.value)}.`;
    }
  };

  MV.sys.realty = realty;
})(window.MV = window.MV || {});
