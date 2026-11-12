/* Mil Vidas — seguros: vida (para tus herederos), salud (tratamientos al 20 %) y hogar (por propiedad). */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const SUMS = [100000, 500000, 2000000];
  const NAMES = { vida: 'vida', salud: 'salud', hogar: 'hogar' };

  /** Pólizas del jugador (se crean vacías si faltan). */
  function ins(g) {
    const p = g.p;
    if (!p.insurance) p.insurance = { vida: 0, salud: false, hogar: {} };
    if (!p.insurance.hogar) p.insurance.hogar = {};
    return p.insurance;
  }
  const assetOf = (g, id) => g.p.assets.find((a) => a.id === id && MV.sys.realty.isRealty(a));

  const insurance = {
    SUMS,

    premium(g, kind, arg) {
      const p = g.p;
      if (kind === 'vida') {
        const sum = arg || ins(g).vida;
        return Math.round(sum * (0.002 + p.age / 10000) * (p.stats.health < 40 ? 2 : 1));
      }
      if (kind === 'salud') return Math.round(1500 + p.age * 40);
      if (kind === 'hogar') { const a = assetOf(g, arg); return a ? Math.round(a.value * 0.003) : 0; }
      return 0;
    },

    covered(g, kind, arg) {
      const I = ins(g);
      if (kind === 'vida') return I.vida > 0;
      if (kind === 'salud') return !!I.salud;
      if (kind === 'hogar') return !!I.hogar[arg] && !!assetOf(g, arg);
      return false;
    },

    buy(g, kind, arg) {
      const p = g.p, I = ins(g);
      if (p.age < 18) return 'Ninguna aseguradora firma contratos con menores de 18.';
      if (kind === 'vida') {
        if (!SUMS.includes(arg)) return 'Esa suma no está en el catálogo.';
        if (p.stats.health < 20) return 'Ninguna aseguradora te quiere: dicen que eres un riesgo con patas';
        I.vida = arg;
        return `Contrataste un seguro de vida por ${U.money(arg)} para tus herederos. Prima: ${U.money(insurance.premium(g, 'vida'))} al año.`;
      }
      if (kind === 'salud') {
        if (I.salud) return 'Ya tienes seguro de salud.';
        I.salud = true;
        return `Contrataste un seguro de salud: pagarás solo el 20 % de los tratamientos. Prima: ${U.money(insurance.premium(g, 'salud'))} al año.`;
      }
      if (kind === 'hogar') {
        const a = assetOf(g, arg);
        if (!a) return 'Esa propiedad no es tuya.';
        if (I.hogar[a.id]) return `${a.name} ya está asegurada.`;
        I.hogar[a.id] = true;
        return `Contrataste un seguro de hogar para ${a.name}. Prima: ${U.money(insurance.premium(g, 'hogar', a.id))} al año.`;
      }
      return 'Ese seguro no existe.';
    },

    cancel(g, kind, arg) {
      const I = ins(g);
      if (kind === 'vida') { I.vida = 0; return 'Cancelaste tu seguro de vida.'; }
      if (kind === 'salud') { I.salud = false; return 'Cancelaste tu seguro de salud.'; }
      if (kind === 'hogar') { delete I.hogar[arg]; const a = assetOf(g, arg); return `Cancelaste el seguro de hogar${a ? ' de ' + a.name : ''}.`; }
      return 'Ese seguro no existe.';
    },

    healthFactor(g) { return insurance.covered(g, 'salud') ? 0.2 : 1; },

    /** La propiedad ya no es tuya: su póliza de hogar desaparece. */
    forget(g, assetId) { delete ins(g).hogar[assetId]; },

    /** Cobra cada póliza; la que no se puede pagar se cancela. */
    yearly(g) {
      const p = g.p, I = ins(g);
      Object.keys(I.hogar).forEach((id) => { if (!assetOf(g, id)) delete I.hogar[id]; });
      let paid = 0;
      const charge = (kind, arg, label) => {
        const cost = insurance.premium(g, kind, arg);
        if (p.money < cost) {
          insurance.cancel(g, kind, arg);
          MV.log(g, `Se canceló tu seguro de ${label} por falta de pago.`, '📄', 'bad');
          return;
        }
        MV.fx.money(g, -cost); paid += cost;
      };
      if (I.vida) charge('vida', null, NAMES.vida);
      if (I.salud) charge('salud', null, NAMES.salud);
      Object.keys(I.hogar).forEach((id) => charge('hogar', id, `hogar de ${assetOf(g, id).name}`));
      if (paid) MV.log(g, `Pagaste ${U.money(paid)} en seguros.`, '📄');
    }
  };

  MV.sys.insurance = insurance;
})(window.MV = window.MV || {});
