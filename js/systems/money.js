/* Mil Vidas — dinero: ingresos, impuestos, gastos, vivienda, préstamos, bienes, inversiones y negocios. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const INV = {
    plazo: { name: 'Plazo fijo', icon: '🏦', ret: [0.01, 0.04], desc: 'Seguro y aburrido' },
    indice: { name: 'Fondo indexado', icon: '📊', ret: [-0.18, 0.26], desc: 'Riesgo moderado' },
    acciones: { name: 'Acciones de riesgo', icon: '📈', ret: [-0.45, 0.7], desc: 'Montaña rusa' },
    cripto: { name: 'Criptomonedas', icon: '🪙', ret: [-0.75, 1.6], desc: 'Casino con gráficos' }
  };
  MV.INVEST = INV;

  const RENTALS = [
    { id: 'pieza', name: 'Habitación en una pensión', cost: 3500, happy: -4 },
    { id: 'mono', name: 'Monoambiente', cost: 6500, happy: 0 },
    { id: 'depto', name: 'Departamento de 2 ambientes', cost: 10000, happy: 3 },
    { id: 'casa', name: 'Casa con patio', cost: 16000, happy: 5 },
    { id: 'lujo', name: 'Piso de lujo', cost: 45000, happy: 9 }
  ];
  MV.RENTALS = RENTALS;

  const money = {
    tax(gross) {
      if (gross <= 20000) return gross * 0.08;
      if (gross <= 80000) return 1600 + (gross - 20000) * 0.22;
      if (gross <= 300000) return 14800 + (gross - 80000) * 0.32;
      return 85200 + (gross - 300000) * 0.4;
    },

    netWorth(g) {
      const p = g.p;
      const assets = U.sum(p.assets, (a) => a.value);
      const loans = U.sum(p.loans, (l) => l.left);
      const inv = U.sum(Object.values(p.inv));
      return Math.round(p.money + assets + inv - loans + (p.business ? p.business.value : 0));
    },

    addLoan(g, name, amount, years, startAge, assetId) {
      const l = { id: U.uid('l'), name, left: Math.round(amount), pay: Math.round(amount * 1.25 / years), start: startAge != null ? startAge : g.p.age, assetId: assetId || null };
      g.p.loans.push(l);
      return l;
    },

    /** Coste anual de vivir según la situación. */
    livingCost(g) {
      const p = g.p;
      if (p.age < 18 || p.prison) return 0;
      const withParents = p.housing === 'padres' && MV.rels(g, 'padre').length > 0;
      let c = withParents ? 600 : p.housing === 'padres' ? 1500 : p.housing === 'calle' ? 300 : 6500;
      if (p.housing === 'alquiler' && p.rent) c += p.rent.cost;
      const partner = MV.partner(g);
      if (partner && partner.r.type === 'conyuge') c *= 0.75; // gastos compartidos
      else if (partner && p.flags.convive === partner.n.id) c *= 0.8; // conviven
      const kids = MV.rels(g, 'hijo').filter((x) => x.n.age < 18).length;
      c += kids * 3200;
      c += MV.rels(g, 'mascota').length * 350;
      return Math.round(c * MV.sys.world.mods(g).living);
    },

    yearly(g) {
      const p = g.p;
      let income = 0, out = 0;
      const lines = [];
      // Sueldo
      if (p.job && !p.prison) {
        const gross = p.job.salary;
        const net = Math.round(gross - money.tax(gross));
        income += net;
        lines.push(`sueldo ${U.money(net)}`);
      }
      if (p.pension) { income += p.pension; lines.push(`pensión ${U.money(p.pension)}`); }
      // Ayuda social para adultos sin ningún ingreso
      if (p.age >= 18 && !p.job && !p.retired && !p.business && !p.prison && !p.edu.stage && p.money < 5000) {
        const aid = U.int(1800, 3200);
        income += aid; lines.push(`ayuda social ${U.money(aid)}`);
      }
      if (p.edu.stage === 'posgrado' && p.edu.type === 'doctorado') { income += 12000; lines.push('beca doctoral $12.000'); }
      // Redes sociales: patrocinios y fama
      if (p.followers > 0) {
        if (p.followers >= 5000 && p.age >= 16) { const s = Math.round(Math.min(p.followers * 0.25, 2e6)); income += s; lines.push(`patrocinios ${U.money(s)}`); }
        if (p.followers >= 50000) MV.fx.stat(g, 'fame', Math.min(4, Math.round(Math.log10(p.followers)) - 3));
        p.followers = Math.round(p.followers * U.float(0.88, 0.97));
      }
      // Hijos menores: mesada de los padres
      if (p.age >= 8 && p.age < 18 && !p.prison) {
        const parent = MV.rels(g, 'padre').sort((a, b) => b.n.money - a.n.money)[0];
        if (parent && parent.n.money > 2000 && parent.r.rel > 45 && U.chance(0.6)) {
          const amt = Math.round(U.int(20, 150) * (1 + parent.n.money / 50000));
          const real = Math.min(amt, 5000);
          income += real; parent.n.money -= real;
          lines.push(`mesada ${U.money(real)}`);
        }
      }
      // Gastos de vida
      const living = money.livingCost(g);
      out += living;
      // Estudios
      const e = p.edu;
      if (e.stage && e.cost) {
        if (e.payer === 'propio') out += e.cost;
        else if (e.payer === 'padres') {
          const pp = MV.sys.edu.payingParent(g, e.cost);
          if (pp) pp.n.money -= e.cost; else { e.payer = 'prestamo'; MV.log(g, 'Tus padres ya no pueden pagar tus estudios. Pasaste a préstamo estudiantil.', '💸', 'bad'); }
        }
        if (e.payer === 'prestamo') {
          let l = p.loans.find((x) => x.name === 'Préstamo estudiantil');
          if (!l) l = money.addLoan(g, 'Préstamo estudiantil', 0, 12, p.age + 10);
          l.left += Math.round(e.cost * 1.1);
          l.pay = Math.round(l.left / 12);
          l.start = p.age + Math.max(1, MV.sys.edu.yearsOf(e) - e.year + 1);
        }
      }
      // Préstamos
      p.loans.forEach((l) => {
        if (l.start > p.age || l.left <= 0) return;
        const pay = Math.min(l.pay, l.left);
        l.left -= pay; out += pay;
      });
      p.loans.filter((l) => l.left <= 0 && l.pay > 0).forEach((l) => MV.log(g, `¡Terminaste de pagar: ${l.name}!`, '🎉', 'good'));
      p.loans = p.loans.filter((l) => l.left > 0 || l.start > p.age);
      // Bienes: mantenimiento, valor y estado
      let maint = 0;
      p.assets.forEach((a) => {
        maint += money.upkeep(g, a);
        if (a.type === 'casa') {
          a.value = Math.round(a.value * (1 + U.float(-0.04, 0.08) + MV.sys.world.mods(g).house));
          a.cond = U.clamp(a.cond - U.int(1, 4), 0, 100);
          if (a.rented) { income += Math.round(a.value * 0.045); }
        } else if (a.type === 'auto') {
          a.value = Math.round(a.value * (a.classic ? U.float(0.98, 1.08) : U.float(0.82, 0.92)));
          a.cond = U.clamp(a.cond - U.int(3, 9), 0, 100);
        } else if (a.type === 'instrumento') {
          a.value = Math.max(20, Math.round(a.value * U.float(0.9, 0.98)));
          a.cond = U.clamp(a.cond - U.int(0, 3), 0, 100);
        } else {
          const L = MV.LUXURY.find((x) => x.kind === a.kind) || { vol: 0.1 };
          a.value = Math.max(50, Math.round(a.value * (1 + U.float(-L.vol, L.vol * 1.1))));
        }
      });
      out += maint;
      if (money.carPrestige(p) >= 70) { MV.fx.stat(g, 'looks', 1); MV.fx.stat(g, 'fame', 1); }
      money.homeYearly(g);
      // Inversiones (con el clima económico del año)
      const world = MV.sys.world.mods(g);
      Object.keys(INV).forEach((k) => {
        if (p.inv[k] > 0) {
          const r = Math.max(-1, U.float(INV[k].ret[0], INV[k].ret[1]) + (world.inv[k] || 0));
          const d = Math.round(p.inv[k] * r);
          p.inv[k] = Math.max(0, p.inv[k] + d);
          if (Math.abs(d) > 500) MV.log(g, `${INV[k].icon} ${INV[k].name}: ${d >= 0 ? 'ganaste' : 'perdiste'} ${U.money(Math.abs(d))} (${Math.round(r * 100)}%).`, d >= 0 ? '📈' : '📉', d >= 0 ? 'good' : 'bad');
        }
      });
      // Negocio
      if (p.business) {
        const b = p.business, B = MV.BUSINESSES.find((x) => x.id === b.type);
        const skill = (p.skills[B.skill] || 0) / 100;
        const r = U.gauss(0.04 + skill * 0.12 + (p.stats.smarts - 50) / 800 + (b.manager ? -0.02 : 0), B.risk * 0.6);
        const profit = Math.round(b.value * r * (b.manager ? 1 : 1.1));
        b.value = Math.max(0, Math.round(b.value * (1 + r * 0.6)));
        b.last = profit;
        income += Math.max(0, profit);
        if (profit < 0) out += -profit;
        if (!b.manager) MV.fx.stat(g, 'stress', 5);
        if (B.skill) MV.fx.skill(g, B.skill, 1);
        lines.push(`negocio ${profit >= 0 ? '+' : ''}${U.money(profit)}`);
        if (b.value < B.cost * 0.15 && U.chance(0.5)) {
          MV.EV.info(g, { title: 'Quiebra', text: `${b.name} quebró. Te queda un cartel y muchas deudas emocionales.`, icon: '🪦', scene: 'ciudad' });
          p.business = null; MV.fx.stat(g, 'happy', -15);
        }
      }
      MV.fx.money(g, income - out);
      if (p.age >= 16 && (income || out)) {
        MV.log(g, `Balance del año: ${income ? '+' + U.money(income) : '$0'} de ingresos${lines.length ? ' (' + lines.join(', ') + ')' : ''} y −${U.money(out)} de gastos${maint > 0 ? ` (incluye mantenimiento de bienes ${U.money(maint)})` : ''}.`, '🧾');
      }
      // Deudas
      if (p.money < 0) {
        const interest = Math.round(Math.min(-p.money, 200000) * 0.08);
        MV.fx.money(g, -interest);
        MV.fx.stat(g, 'stress', 4);
        MV.fx.stat(g, 'happy', -2);
        if (p.money < -25000 && p.housing === 'alquiler' && U.chance(0.5)) {
          p.housing = 'calle'; p.rent = null;
          MV.EV.info(g, { title: 'Desalojo', text: 'No pagaste el alquiler y te desalojaron. Ahora vives en la calle. Tu nueva dirección: "el banco de la plaza".', icon: '📦', scene: 'ciudad' });
        }
      }
      if (p.housing === 'calle') { MV.fx.stat(g, 'health', -U.int(1, 4)); MV.fx.stat(g, 'happy', -U.int(2, 5)); }
      if (p.housing === 'padres' && p.age >= 26) MV.fx.stat(g, 'happy', -1);
    },

    // — Mercado de bienes —
    listings(g, kind) {
      const key = 'mkt_' + kind;
      // El mercado cambia una vez por año.
      if (g._mkt && g._mkt[key] && g._mkt[key].age === g.p.age) return g._mkt[key].items;
      const src = kind === 'casa' ? MV.HOUSES : kind === 'auto' ? MV.CARS : MV.LUXURY;
      const items = U.shuffle(src).slice(0, 6).map((t) => {
        const price = Math.round(U.int(t.price[0], t.price[1]) / 100) * 100;
        const it = { id: U.uid('a'), type: kind, kind: t.kind, icon: t.icon, value: price, cond: U.int(35, 100) };
        if (kind === 'casa') { it.name = `${t.kind} en ${U.pick(MV.STREETS)}`; it.haunted = !!t.haunted; }
        else if (kind === 'auto') { it.name = `${U.pick(MV.CAR_BRANDS)} ${U.pick(MV.CAR_MODELS)} (${t.kind.toLowerCase()})`; it.classic = /Clásico/.test(t.kind); }
        else it.name = t.kind;
        return it;
      }).sort((a, b) => a.value - b.value);
      g._mkt = g._mkt || {};
      g._mkt[key] = { age: g.p.age, items };
      return items;
    },

    buy(g, item, mortgage) {
      const p = g.p;
      if (p.age < 18) return 'Eres menor de edad. El vendedor llamó a tus padres.';
      const down = mortgage ? Math.round(item.value * 0.2) : item.value;
      if (p.money < down) return `No te alcanza. Necesitas ${U.money(down)}.`;
      if (mortgage) {
        if (!p.job && !p.business && p.money < item.value * 0.5) return 'El banco no da hipotecas a gente sin ingresos. Qué raro, ¿no?';
        if (p.record.length > 2) return 'El banco revisó tus antecedentes y se rió.';
      }
      MV.fx.money(g, -down);
      const a = Object.assign({}, item, { id: U.uid('a'), bought: p.age, price: item.value });
      p.assets.push(a);
      if (mortgage) money.addLoan(g, `Hipoteca: ${a.name}`, item.value - down, 25, p.age + 1, a.id);
      const list = g._mkt && g._mkt['mkt_' + item.type];
      if (list) list.items = list.items.filter((x) => x.id !== item.id);
      if (a.type === 'casa') {
        MV.ach.unlock(g, 'casa_propia');
        if (p.housing !== 'propia') { p.housing = 'propia'; p.home = a.id; p.rent = null; }
      }
      if (a.type === 'auto' && !p.license) return `Compraste ${a.name}. Detalle menor: no tienes licencia de conducir.`;
      MV.fx.stat(g, 'happy', a.type === 'lujo' ? 6 : 8);
      return `Compraste ${a.name}${mortgage ? ' con hipoteca' : ''} por ${U.money(item.value)}.`;
    },

    /** Compra un auto nuevo de la concesionaria en el color elegido. */
    buyCar(g, modelId, colorId) {
      const p = g.p, m = MV.CAR_CATALOG.find((x) => x.id === modelId);
      if (!m) return 'Ese modelo no existe (todavía).';
      if (p.age < 18) return 'Eres menor de edad. El vendedor llamó a tus padres.';
      if (p.money < m.price) return `No te alcanza. Necesitas ${U.money(m.price)}.`;
      const C = MV.CAR_COLORS.find((c) => c.id === colorId) || MV.CAR_COLORS[0], cat = MV.CAR_CATS[m.cat];
      MV.fx.money(g, -m.price);
      const a = { id: U.uid('a'), type: 'auto', kind: cat.name, icon: cat.icon, name: `${m.brand} ${m.model} ${C.name.toLowerCase()}`, value: m.price, price: m.price, cond: 100,
        bought: p.age, model: m.id, color: C.id, tune: {}, insured: false, classic: m.cat === 'clasico' };
      p.assets.push(a);
      MV.fx.stat(g, 'happy', m.prestige >= 70 ? 10 : 6);
      const lic = MV.sys.license.has(g, 'auto') ? '' : ' Detalle menor: no tienes licencia de conducir.';
      return `Compraste un ${m.brand} ${m.model} ${C.name.toLowerCase()} 0 km por ${U.money(m.price)}. ${U.pick(['Huele a nuevo y a deuda emocional.', 'El vendedor lloró de emoción (por la comisión).', 'Ya le sacaste 40 fotos.'])}${lic}`;
    },

    /** Prestigio máximo entre tus autos de la concesionaria (0 si no tienes). */
    carPrestige(p) {
      return p.assets.reduce((mx, a) => {
        const m = a.type === 'auto' && a.model ? MV.CAR_CATALOG.find((x) => x.id === a.model) : null;
        return m ? Math.max(mx, m.prestige) : mx;
      }, 0);
    },

    /** Precio estimado de venta de un bien. */
    estimate(a) { return Math.round(a.value * (0.75 + a.cond / 400)); },

    sell(g, assetId) {
      const a = g.p.assets.find((x) => x.id === assetId);
      return a ? money.sellFor(g, assetId, money.estimate(a)) : 'No tienes eso.';
    },

    /** Vende pidiendo un precio (factor −0,2…+0,5 sobre el estimado). Si piden de más, llega una contraoferta. */
    /** Lo máximo que paga el comprador de este año (fijo durante el año: reintentar no lo cambia). */
    buyerPrice(g, a, est) {
      if (!a.market || a.market.age !== g.p.age) {
        const appeal = (a.upgrades || []).filter((u) => (MV.HOUSE_UPGRADES.find((x) => x.id === u.id) || {}).demand).length;
        a.market = { age: g.p.age, willing: (est || money.estimate(a)) * U.float(0.85, 1.25) * (1 + 0.04 * appeal) };
      }
      return a.market.willing;
    },

    sellAt(g, assetId, factor) {
      const a = g.p.assets.find((x) => x.id === assetId);
      if (!a) return 'No tienes eso.';
      const f = U.clamp(Number(factor) || 0, -0.2, 0.5);
      const est = money.estimate(a);
      const asking = Math.round(est * (1 + f));
      const willing = money.buyerPrice(g, a, est);
      if (asking <= willing) return money.sellFor(g, assetId, asking);
      const offer = Math.round(willing * U.float(0.92, 1));
      MV.EV.push(g, 'contraoferta', { asset: a.id, aname: a.name, offer, asking, willing: Math.round(willing) }, true);
      return `Pediste ${U.money(asking)} por ${a.name}. Un comprador lo pensó...`;
    },

    sellFor(g, assetId, price) {
      const p = g.p;
      const a = p.assets.find((x) => x.id === assetId);
      if (!a) return 'No tienes eso.';
      price = Math.round(price);
      const loan = p.loans.find((l) => l.assetId === a.id);
      let net = price;
      if (loan) { net -= loan.left; p.loans = p.loans.filter((l) => l !== loan); }
      MV.fx.money(g, net);
      p.assets = p.assets.filter((x) => x !== a);
      g.queue = g.queue.filter((q) => !(q.ctx && q.ctx.asset === a.id));
      if (p.home === a.id) {
        p.home = null;
        const other = p.assets.find((x) => x.type === 'casa' && !x.rented);
        if (other) p.home = other.id; else { p.housing = 'alquiler'; p.rent = RENTALS[1]; }
      }
      return `Vendiste ${a.name} por ${U.money(price)}${loan ? ` (pagaste la hipoteca y te quedaron ${U.money(net)})` : ''}.`;
    },

    /** Mantenimiento anual de un bien (incluye mejoras). */
    upkeep(g, a) {
      if (a.type === 'casa') return Math.max(0, Math.round(a.value * 0.01 + U.sum(a.upgrades || [], (u) => (MV.HOUSE_UPGRADES.find((x) => x.id === u.id) || {}).upkeep || 0)));
      if (a.type === 'auto') return Math.round(a.value * 0.05) + 400;
      const L = MV.LUXURY.find((x) => x.kind === a.kind) || {};
      return Math.round(a.value * (L.upkeep || 0));
    },

    isApartment(a) { return /Monoambiente|Departamento|Penthouse|Casa rodante/.test(a.kind || a.name || ''); },

    upgradeCost(a, U2) { return Math.round(U2.fixed + U2.pct * a.value); },

    upgradeOptions(g, assetId) {
      const a = g.p.assets.find((x) => x.id === assetId);
      if (!a || a.type !== 'casa') return [];
      return MV.HOUSE_UPGRADES.map((U2) => {
        const cost = money.upgradeCost(a, U2);
        const why = [];
        const builtIn = ((MV.HOUSES || []).find((k) => k.kind === a.kind) || {}).has || [];
        if ((a.upgrades || []).some((u) => u.id === U2.id)) why.push('Ya la tienes');
        else if (builtIn.includes(U2.id)) why.push('Ya la tiene de fábrica');
        if (U2.house && money.isApartment(a)) why.push('Solo en casas');
        if (U2.minValue && a.value < U2.minValue) why.push(`Solo en propiedades de ${U.money(U2.minValue)} o más`);
        if (g.p.money < cost) why.push(`Cuesta ${U.money(cost)}`);
        const delta = Math.round(cost * U2.back);
        return { id: U2.id, icon: U2.icon, label: U2.name, cost, ok: !why.length, why,
          sub: why.length ? why.join('. ') : `${U.money(cost)}. ${U2.desc}. Valor ${delta >= 0 ? '+' : '−'}${U.money(Math.abs(delta))}${U2.upkeep ? `, mantenimiento ${U2.upkeep > 0 ? '+' : '−'}${U.money(Math.abs(U2.upkeep))}/año` : ''}` };
      });
    },

    addUpgrade(g, assetId, upId) {
      const a = g.p.assets.find((x) => x.id === assetId);
      const U2 = MV.HOUSE_UPGRADES.find((x) => x.id === upId);
      const o = money.upgradeOptions(g, assetId).find((x) => x.id === upId);
      if (!a || !U2 || !o) return 'Esa mejora no existe.';
      if (!o.ok) return `No se puede: ${o.why.join(', ').toLowerCase()}.`;
      const added = Math.round(o.cost * U2.back);
      MV.fx.money(g, -o.cost);
      a.value = Math.max(1000, a.value + added);
      a.upgrades = (a.upgrades || []).concat([{ id: U2.id, added, cost: o.cost }]);
      MV.fx.stat(g, 'happy', 4);
      return `Instalaste ${U2.name.toLowerCase()} en ${a.name} por ${U.money(o.cost)}. ${added >= 0 ? `La propiedad vale ${U.money(added)} más.` : `Los tasadores no lo aprecian: la propiedad vale ${U.money(-added)} menos.`}`;
    },

    removeUpgrade(g, assetId, upId) {
      const a = g.p.assets.find((x) => x.id === assetId);
      const u = a && (a.upgrades || []).find((x) => x.id === upId);
      if (!u) return 'Esa mejora no está instalada.';
      const U2 = MV.HOUSE_UPGRADES.find((x) => x.id === upId) || { name: 'la mejora' };
      const demo = Math.round((u.cost || 5000) * 0.2);
      MV.fx.money(g, -demo);
      a.value = Math.max(1000, a.value - u.added);
      a.upgrades = a.upgrades.filter((x) => x !== u);
      return `Quitaste ${U2.name.toLowerCase()} (demolición: ${U.money(demo)}). ${u.added >= 0 ? `La propiedad vale ${U.money(u.added)} menos.` : `¡La propiedad recuperó ${U.money(-u.added)} de valor!`}`;
    },

    /** Efectos anuales de las mejoras de la casa en la que vives. */
    homeYearly(g) {
      const p = g.p;
      const home = p.home && p.housing === 'propia' && p.assets.find((x) => x.id === p.home);
      if (!home || p.prison) return;
      (home.upgrades || []).forEach((u) => {
        const U2 = MV.HOUSE_UPGRADES.find((x) => x.id === u.id);
        if (!U2) return;
        MV.fx.apply(g, U2.eff);
        if (U2.sport && p.age >= 6) { p.sportsExp = p.sportsExp || {}; p.sportsExp[U2.sport] = (p.sportsExp[U2.sport] || 0) + 1; }
        if (U2.elderHealth && p.age >= 70) MV.fx.stat(g, 'health', U2.elderHealth);
      });
    },

    repair(g, assetId) {
      const a = g.p.assets.find((x) => x.id === assetId);
      if (!a) return '';
      const cost = Math.round(a.value * (100 - a.cond) / 100 * 0.25) + 100;
      MV.fx.money(g, -cost);
      a.cond = 100;
      return `Arreglaste ${a.name} por ${U.money(cost)}. Como nuevo.`;
    },

    rent(g, rid) {
      const r = RENTALS.find((x) => x.id === rid);
      const p = g.p;
      if (p.age < 18) return 'Nadie le alquila a un menor de edad.';
      p.housing = 'alquiler'; p.rent = r; p.home = null;
      MV.fx.stat(g, 'happy', r.happy + 3);
      return `Te mudaste a ${r.name.toLowerCase()} (${U.money(r.cost)} al año).`;
    },

    invest(g, k, amount) {
      const p = g.p;
      amount = Math.min(amount, p.money);
      if (amount <= 0) return 'No tienes dinero para invertir.';
      MV.fx.money(g, -amount);
      p.inv[k] += amount;
      return `Invertiste ${U.money(amount)} en ${INV[k].name.toLowerCase()}.`;
    },

    withdraw(g, k) {
      const p = g.p, amt = p.inv[k];
      if (!amt) return 'No tienes nada ahí.';
      p.inv[k] = 0;
      MV.fx.money(g, amt);
      return `Retiraste ${U.money(amt)} de ${INV[k].name.toLowerCase()}.`;
    },

    openBusiness(g, type) {
      const B = MV.BUSINESSES.find((x) => x.id === type), p = g.p;
      if (p.business) return 'Ya tienes un negocio.';
      if (p.money < B.cost) return `Necesitas ${U.money(B.cost)} para empezar.`;
      MV.fx.money(g, -B.cost);
      const name = `${B.name} "${U.pick(['El Gran', 'Don', 'La Esquina de', 'Lo de', 'Club', 'Casa'])} ${p.first}"`;
      p.business = { type, name, value: Math.round(B.cost * 0.9), last: 0, since: p.age, manager: false };
      MV.fx.stat(g, 'stress', 10);
      return `Abriste ${name}. Inversión: ${U.money(B.cost)}.`;
    },

    sellBusiness(g) {
      const p = g.p, b = p.business;
      if (!b) return '';
      const price = Math.round(b.value * U.float(0.8, 1.25));
      MV.fx.money(g, price);
      p.business = null;
      if (price >= 1e6) MV.ach.unlock(g, 'emprendedor');
      return `Vendiste ${b.name} por ${U.money(price)}.`;
    }
  };
  MV.sys.money = money;
  MV.netWorth = money.netWorth;
})(window.MV = window.MV || {});
