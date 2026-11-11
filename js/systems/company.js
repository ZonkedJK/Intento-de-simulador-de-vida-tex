/* Mil Vidas — motor común de empresas propias: caja, empleados, marketing, año, valuación, quiebra, venta y cierre. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const LEVELS = [1, 1, 2, 2, 2, 3, 3, 4, 5];
  const T = (c) => MV.COMPANY_TYPES[c.type];
  const list = (p) => (p.companies = Array.isArray(p.companies) ? p.companies : []);

  const company = {
    MAX: 3,
    hooks: {},

    /** Cada tipo aporta sus ingresos (y costos propios, como el plantel) del año. */
    register(type, h) { company.hooks[type] = h; },

    /** Empresas que cuentan para el límite: las propias más el negocio clásico. */
    count(p) { return list(p).length + (p.business ? 1 : 0); },
    get(g, cid) { return list(g.p).find((c) => c.id === cid) || null; },
    roleName(role, gender) { const n = (MV.COMPANY_ROLES[role] || { name: role }).name.split('|'); return gender === 'f' ? n[1] || n[0] : n[0]; },

    found(g, type, name) {
      const p = g.p, K = MV.COMPANY_TYPES[type];
      if (!K) return 'Ese tipo de empresa no existe (todavía).';
      if (p.age < 18) return 'Tienes que tener 18 años para fundar una empresa.';
      if (p.prison) return 'Desde la cárcel no se fundan empresas (las legales, al menos).';
      if (company.count(p) >= company.MAX) return `Ya tienes ${company.MAX} empresas (contando tu negocio). Vende o cierra una primero.`;
      if (p.money < K.cost) return `Necesitas ${U.money(K.cost)} para fundar ${K.name.toLowerCase()}.`;
      MV.fx.money(g, -K.cost);
      const nm = MV.sys.works.clean(name) || `${K.name} ${p.last}`;
      const c = { id: U.uid('co'), type, name: nm, cash: K.cost, since: p.age, staff: [], marketing: 'ninguno', redYears: 0,
        last: { revenue: 0, costs: 0, result: 0 }, value: K.cost, hist: [{ age: p.age, value: K.cost }], public: null, rep: 10 };
      list(p).push(c);
      MV.fx.stat(g, 'stress', 8);
      return `Fundaste ${nm} (${K.name.toLowerCase()}) y pusiste ${U.money(K.cost)} en su caja. ${U.pick(['Ya tienes tarjetas con tu nombre y "CEO" abajo.', 'Tu madre ya le contó a todo el barrio.', 'La oficina es tu cocina, por ahora.'])}`;
    },

    /** Tres candidatos por puesto, fijos durante el año. */
    candidates(g, cid, role) {
      const c = company.get(g, cid), p = g.p;
      if (!c || !(T(c).roles.includes(role) || role === 'gerente')) return [];
      if (!c.cand || c.cand.age !== p.age) c.cand = { age: p.age, byRole: {} };
      if (!c.cand.byRole[role]) {
        c.cand.byRole[role] = [0, 1, 2].map(() => {
          const gender = U.pick(['m', 'f']), level = U.pick(LEVELS);
          return { first: MV.randomFirst(gender, p.country), last: MV.randomLast(p.country), gender, level, salary: Math.round(20000 * level * U.float(0.9, 1.1) / 100) * 100 };
        });
      }
      return c.cand.byRole[role];
    },

    hire(g, cid, role, i) {
      const c = company.get(g, cid);
      if (!c) return 'Esa empresa ya no es tuya.';
      if (!(MV.COMPANY_ROLES[role] && (T(c).roles.includes(role) || role === 'gerente'))) return 'Ese puesto no existe en esta empresa.';
      if (role === 'gerente' && c.staff.some((e) => e.role === 'gerente')) return `${c.name} ya tiene gerente general.`;
      const cands = company.candidates(g, cid, role), x = cands[i];
      if (!x) return 'No hay más candidatos para ese puesto este año.';
      cands.splice(i, 1);
      const e = Object.assign({ id: U.uid('e'), role, since: g.p.age, morale: 70 }, x);
      c.staff.push(e);
      return `Contrataste a ${e.first} ${e.last} como ${company.roleName(role, e.gender).toLowerCase()} (nivel ${e.level}) por ${U.money(e.salary)} al año.`;
    },

    fire(g, cid, eid) {
      const c = company.get(g, cid), e = c && c.staff.find((x) => x.id === eid);
      if (!e) return 'Esa persona ya no trabaja ahí.';
      const sev = Math.round(e.salary / 4);
      c.cash -= sev;
      c.staff = c.staff.filter((x) => x !== e);
      return `Despediste a ${e.first} ${e.last}. La indemnización (${U.money(sev)}) salió de la caja. ${U.pick(['Se llevó la abrochadora.', 'Te dejó una reseña de una estrella en internet.', 'Lloró en el ascensor.'])}`;
    },

    raise(g, cid, eid) {
      const c = company.get(g, cid), e = c && c.staff.find((x) => x.id === eid);
      if (!e) return 'Esa persona ya no trabaja ahí.';
      e.salary = Math.round(e.salary * 1.15);
      e.morale = U.clamp(e.morale + 20, 0, 100);
      return `Le subiste el sueldo a ${e.first}: ahora gana ${U.money(e.salary)} al año.`;
    },

    setMarketing(g, cid, level) {
      const c = company.get(g, cid);
      if (!c) return 'Esa empresa ya no es tuya.';
      if (!MV.MARKETING[level]) return 'Ese plan de marketing no existe.';
      c.marketing = level;
      return `Marketing de ${c.name}: ${MV.MARKETING[level].name.toLowerCase()} (${U.money(MV.MARKETING[level].cost)} al año).`;
    },

    inject(g, cid, amount) {
      const c = company.get(g, cid), p = g.p;
      amount = Math.round(amount);
      if (!c) return 'Esa empresa ya no es tuya.';
      if (!(amount > 0)) return 'Elige un monto mayor a cero.';
      if (amount > p.money) return `No tienes ${U.money(amount)}.`;
      MV.fx.money(g, -amount);
      c.cash += amount;
      return `Pusiste ${U.money(amount)} en la caja de ${c.name}.`;
    },

    withdraw(g, cid, amount) {
      const c = company.get(g, cid);
      amount = Math.round(amount);
      if (!c) return 'Esa empresa ya no es tuya.';
      if (!(amount > 0)) return 'Elige un monto mayor a cero.';
      if (amount > c.cash) return `La caja de ${c.name} no tiene ${U.money(amount)}.`;
      c.cash -= amount;
      MV.fx.money(g, amount);
      return `Sacaste ${U.money(amount)} de dividendos de ${c.name}.`;
    },

    /** Fuerza del equipo en ciertos puestos: suma de niveles × 8, tope 100. */
    power(c, roles) { return U.clamp((c.staff || []).filter((e) => roles.includes(e.role)).reduce((s, e) => s + e.level * 8, 0), 0, 100); },
    boost(c) { return (MV.MARKETING[c.marketing] || MV.MARKETING.ninguno).boost; },
    stake(c) { return c.public ? c.public.stake : 1; },

    /** Saca la empresa de tu vida y borra sus eventos pendientes. */
    remove(g, cid) {
      g.p.companies = list(g.p).filter((c) => c.id !== cid);
      const keep = (it) => !(it.ctx && it.ctx.company === cid);
      g.queue = g.queue.filter(keep);
      if (g.later) g.later = g.later.filter(keep);
    },

    sell(g, cid) {
      const c = company.get(g, cid);
      if (!c) return 'Esa empresa ya no es tuya.';
      const price = Math.round(c.value * U.float(0.8, 1.2) * company.stake(c));
      MV.fx.money(g, price);
      company.remove(g, cid);
      if (price >= 1e6) MV.ach.unlock(g, 'emprendedor');
      return `Vendiste ${c.name} por ${U.money(price)}. ${U.pick(['El comprador ya cambió el logo.', 'Brindaste con el equipo. Algunos lloraron.', 'Ahora eres "inversor". Suena bien en las fiestas.'])}`;
    },

    close(g, cid) {
      const c = company.get(g, cid);
      if (!c) return 'Esa empresa ya no es tuya.';
      c.staff.slice().forEach((e) => { c.cash -= Math.round(e.salary / 4); });
      const back = Math.max(0, c.cash);
      if (back) MV.fx.money(g, back);
      company.remove(g, cid);
      MV.fx.stat(g, 'happy', -5);
      return `Cerraste ${c.name}. Pagaste las indemnizaciones${back ? ` y te quedaron ${U.money(back)} de la caja` : ''}. Apagaste la luz al salir.`;
    },

    yearly(g) {
      const p = g.p;
      if (!p.alive) return;
      list(p).slice().forEach((c) => {
        const K = T(c);
        if (!K) return;
        const hook = company.hooks[c.type] || {};
        const revenue = Math.round(hook.revenue ? hook.revenue(g, c) : 0);
        const costs = Math.round(c.staff.reduce((s, e) => s + e.salary, 0) + (MV.MARKETING[c.marketing] || MV.MARKETING.ninguno).cost + K.fixed + (hook.costs ? hook.costs(g, c) : 0));
        const result = revenue - costs;
        c.cash += result;
        c.last = { revenue, costs, result };
        c.value = Math.max(0, Math.round(revenue * K.mult + c.cash));
        c.hist = (c.hist || []).concat([{ age: p.age, value: c.value }]).slice(-60);
        MV.fx.stat(g, 'stress', c.staff.some((e) => e.role === 'gerente') ? 1 : 3);
        c.redYears = c.cash < 0 ? (c.redYears || 0) + 1 : 0;
        if (c.redYears >= 2) {
          company.remove(g, c.id);
          MV.fx.stat(g, 'happy', -15);
          MV.EV.info(g, { title: 'Quiebra', icon: '🪦', scene: 'ciudad', text: `${c.name} quebró después de dos años con la caja en rojo. Te quedaron un logo, una deuda emocional y una planta de oficina.` });
          return;
        }
        MV.log(g, `${K.icon} ${c.name}: ${result >= 0 ? 'ganó' : 'perdió'} ${U.money(Math.abs(result))} este año. Caja: ${U.money(c.cash)}.`, '🏢', result >= 0 ? 'good' : 'bad');
        if (!p.prison && c.staff.length && U.chance(0.1)) MV.EV.push(g, 'empleado_aumento', { company: c.id, emp: U.pick(c.staff).id });
      });
    }
  };
  MV.sys.company = company;

  // — Evento: un empleado pide aumento —
  const ctxOf = (g, ctx) => { const c = company.get(g, ctx.company); const e = c && c.staff.find((x) => x.id === ctx.emp); return { c, e }; };
  const gone = 'Esa persona ya no trabaja en tu empresa. Problema resuelto solo.';
  MV.ev({ id: 'empleado_aumento', manual: true, prison: 'any', icon: '💼', scene: 'trabajo', title: 'Te piden un aumento',
    text: (g, ctx) => { const { c, e } = ctxOf(g, ctx); return e ? `${e.first} ${e.last} (${company.roleName(e.role, e.gender).toLowerCase()} de ${c.name}) pide un aumento del 20 %. Dice que otra empresa le ofreció más.` : gone; },
    choices: [
      { t: 'Darle el aumento', eff: (g, ctx) => { const { e } = ctxOf(g, ctx); if (!e) return gone; e.salary = Math.round(e.salary * 1.2); e.morale = U.clamp(e.morale + 25, 0, 100); return `Le diste el aumento a ${e.first}. Ahora gana ${U.money(e.salary)} y te trajo medialunas.`; } },
      { t: 'Negarlo', eff: (g, ctx) => { const { c, e } = ctxOf(g, ctx); if (!e) return gone; if (U.chance(0.4)) { c.staff = c.staff.filter((x) => x !== e); return `${e.first} renunció y se fue a la competencia. Se llevó dos clientes y tu taza favorita.`; } e.morale = U.clamp(e.morale - 20, 0, 100); return `${e.first} se quedó, pero ahora suspira fuerte en cada reunión.`; } },
      { t: 'Despedirlo', eff: (g, ctx) => { const { c, e } = ctxOf(g, ctx); if (!e) return gone; return company.fire(g, c.id, e.id); } }
    ] });
})(window.MV = window.MV || {});
