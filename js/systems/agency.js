/* Mil Vidas — agencias: equipo de eSports, representación de talentos, negociación de contratos y mánager propio. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};
  const C = () => MV.sys.company;
  const MAX_ROSTER = 5, MAX_CLIENTS = 10;
  const mine = (g, cid, type) => { const c = C().get(g, cid); return c && c.type === type ? c : null; };
  const profName = (prof, gender) => { const n = MV.AGENCY_PROFS[prof].name.split('|'); return gender === 'f' ? n[1] : n[0]; };
  const lawyers = (c) => Math.min(3, (c.staff || []).filter((e) => e.role === 'abogado').length);
  const selfPro = (p) => !!p.job && p.job.id === 'sport_esports';

  const agency = {
    // ——— eSports ———
    players(g, cid) {
      const c = mine(g, cid, 'esports'), p = g.p;
      if (!c) return [];
      if (!c.market || c.market.age !== p.age) {
        c.market = { age: p.age, list: [0, 1, 2].map(() => {
          const gender = U.pick(['m', 'f']), skill = U.int(30, Math.min(95, 70 + Math.round((c.rep || 0) / 4)));
          return { id: U.uid('gp'), first: MV.randomFirst(gender, p.country), last: MV.randomLast(p.country), gender, alias: U.pick(MV.GAMER_ALIASES), skill, salary: agency.wage(skill), age: U.int(16, 28) };
        }) };
      }
      return c.market.list;
    },
    /** Sueldo anual de un jugador según su habilidad, y precio de su pase (fichar y vender cuestan lo mismo). */
    wage(skill) { return skill * 800; },
    fee(skill) { return skill * 3000; },
    /** Lugares ocupados del plantel (tú cuentas solo si sigues siendo gamer profesional). */
    size(c, p) { return (c.roster || []).length + (c.selfPlay && (!p || selfPro(p)) ? 1 : 0); },

    sign(g, cid, i) {
      const c = mine(g, cid, 'esports');
      if (!c) return 'Esa agencia ya no es tuya.';
      c.roster = c.roster || [];
      if (agency.size(c, g.p) >= MAX_ROSTER) return `El plantel ya tiene ${MAX_ROSTER} jugadores. Vende a alguien primero.`;
      const list = agency.players(g, cid), x = list[i];
      if (!x) return 'Ese jugador ya firmó con otro equipo.';
      const fee = agency.fee(x.skill);
      if (c.cash < fee) return `La caja no alcanza: el pase de "${x.alias}" cuesta ${U.money(fee)}.`;
      list.splice(i, 1);
      c.cash -= fee;
      C().revalue(c);
      c.roster.push(x);
      return `Fichaste a "${x.alias}" (${x.first} ${x.last}, habilidad ${x.skill}): pase de ${U.money(fee)} y ${U.money(x.salary)} de sueldo al año. Ya pidió una silla gamer nueva.`;
    },

    sellPlayer(g, cid, id) {
      const c = mine(g, cid, 'esports'), x = c && (c.roster || []).find((r) => r.id === id);
      if (!x) return 'Ese jugador ya no está en tu equipo.';
      const fee = agency.fee(x.skill);
      c.cash += fee;
      c.roster = c.roster.filter((r) => r !== x);
      C().revalue(c);
      return `Vendiste a "${x.alias}" a otro equipo por ${U.money(fee)}. Hizo un video de despedida llorando.`;
    },

    joinOwnTeam(g, cid) {
      const c = mine(g, cid, 'esports'), p = g.p;
      if (!c) return 'Esa agencia ya no es tuya.';
      if (!selfPro(p)) return 'Para jugar en tu equipo tienes que ser gamer profesional de e-sports.';
      if (c.selfPlay) return 'Ya juegas en tu propio equipo.';
      if (agency.size(c, p) >= MAX_ROSTER) return `El plantel ya tiene ${MAX_ROSTER} jugadores. Vende a alguien primero.`;
      c.selfPlay = true;
      p.job.club = c.name;
      return `Ahora juegas en ${c.name}, tu propio equipo. Eres jugador, dueño y el que paga las pizzas.`;
    },

    /** Temporada: liga por reputación, puesto contra 7 rivales, premio y reputación. */
    season(g, c) {
      const p = g.p, roster = (c.roster || []).map((x) => x.skill);
      if (c.selfPlay && selfPro(p)) roster.push(MV.sys.sports.rating(g, 'esports'));
      if (roster.length < 3) return { league: null, place: 0, prize: 0 };
      const rep = c.rep || 0, league = rep < 40 ? 'regional' : rep < 75 ? 'internacional' : 'mundial', L = MV.ESPORTS_LEAGUES[league];
      const team = roster.reduce((s, v) => s + v, 0) / roster.length + C().power(c, ['entrenador']) / 10 + U.int(-10, 10);
      const rivals = [0, 1, 2, 3, 4, 5, 6].map(() => U.int(35, 85) + L.strength);
      const place = 1 + rivals.filter((r) => r > team).length;
      const pool = U.int(L.prize[0], L.prize[1]);
      const prize = Math.round(pool * ({ 1: 1, 2: 0.5, 3: 0.25 }[place] || 0));
      c.rep = U.clamp(rep + (5 - place) * 3, 0, 100);
      return { league, place, prize };
    },

    revenueEsports(g, c) {
      const s = agency.season(g, c);
      c.lastSeason = s;
      (c.roster || []).forEach((x) => { x.skill = U.clamp(x.skill + U.int(-2, 3) + (C().power(c, ['analista']) >= 24 ? 1 : 0), 20, 99); x.age++; });
      if (c.selfPlay && !selfPro(g.p)) c.selfPlay = false;
      const sponsors = Math.round((c.rep || 0) * 6000);
      if (s.league) MV.log(g, `🕹️ ${c.name} terminó ${s.place}.º en la ${MV.ESPORTS_LEAGUES[s.league].name.toLowerCase()}${s.prize ? ` y ganó ${U.money(s.prize)}` : ''}. Patrocinios: ${U.money(sponsors)}.`, '🏆', s.place <= 3 ? 'good' : '');
      if (s.place === 1 && s.league === 'mundial') MV.ach.unlock(g, 'campeon_esports');
      return s.prize + sponsors;
    },

    // ——— Representación ———
    talents(g, cid) {
      const c = mine(g, cid, 'representacion'), p = g.p;
      if (!c) return [];
      if (!c.scouted || c.scouted.age !== p.age) {
        const bonus = C().power(c, ['scout']) >= 40 ? 1 : 0;
        c.scouted = { age: p.age, list: [0, 1, 2].map(() => {
          const gender = U.pick(['m', 'f']), prof = U.pick(Object.keys(MV.AGENCY_PROFS)), level = U.clamp(U.pick([1, 1, 2, 2, 3, 4]) + bonus, 1, 5);
          return { id: U.uid('cl'), first: MV.randomFirst(gender, p.country), last: MV.randomLast(p.country), gender, prof, level, salary: Math.round(MV.AGENCY_PROFS[prof].pay[level - 1] * U.float(0.8, 1.2)), left: U.int(1, 3) };
        }) };
      }
      return c.scouted.list;
    },

    signClient(g, cid, i, commission) {
      const c = mine(g, cid, 'representacion');
      if (!c) return 'Esa agencia ya no es tuya.';
      c.clients = c.clients || [];
      if (c.clients.length >= MAX_CLIENTS) return `Ya representas a ${MAX_CLIENTS} personas. No das abasto.`;
      const list = agency.talents(g, cid), x = list[i];
      if (!x) return 'Ese talento ya firmó con otra agencia.';
      const com = U.clamp(Math.round((commission || 0.15) * 100) / 100, 0.1, 0.2);
      list.splice(i, 1);
      const who = profName(x.prof, x.gender).toLowerCase();
      if (!U.chance(0.9 - (com - 0.1) * 4 + (c.rep || 0) / 200)) return `${x.first} ${x.last} (${who}) leyó la comisión del ${Math.round(com * 100)} %, se rió y firmó con otra agencia.`;
      c.clients.push(Object.assign({}, x, { commission: com, down: 0 }));
      return `Ahora representas a ${x.first} ${x.last}, ${who} de nivel ${x.level} que gana ${U.money(x.salary)} al año. Te llevas el ${Math.round(com * 100)} %.`;
    },

    revenueAgency(g, c) {
      const p = g.p;
      let total = 0;
      (c.clients || []).slice().forEach((x) => {
        if (x.slump) { x.salary = x.base; x.slump = 0; }
        total += Math.round(x.salary * x.commission);
        const before = x.salary;
        x.salary = Math.round(x.salary * agency.clientGrowth());
        x.down = x.salary < before ? (x.down || 0) + 1 : 0;
        if (x.down >= 2 || U.chance(0.05)) {
          c.clients = c.clients.filter((y) => y !== x);
          MV.log(g, `🤝 ${x.first} ${x.last} dejó ${c.name}. Dijo que necesitaba "un cambio de energía".`, '👋', 'bad');
          return;
        }
        x.left = (x.left || 0) - 1;
        if (x.left <= 0) {
          if (p.prison) { x.salary = Math.round(x.salary * 1.05); x.left = U.int(2, 4); } else MV.EV.push(g, 'renovar_contrato', { company: c.id, client: x.id });
        }
      });
      c.rep = U.clamp((c.rep || 0) + (c.clients || []).length, 0, 100);
      return total;
    },

    /** Cambio anual del sueldo de un representado (promedio apenas por encima de 1). */
    clientGrowth() { return U.float(0.85, 1.2); },

    /** Negociación: 'mas' (pedir más), 'aceptar' o 'amenazar' (con irse). Devuelve si salió bien y el factor del sueldo. */
    negotiate(g, how, who) {
      const lvl = who.level || 1, car = who.carisma || 0, law = who.lawyer || 0;
      if (how === 'aceptar') return { ok: true, factor: 1.05 };
      if (how === 'amenazar') { const ok = U.chance(0.3 + car / 300 + lvl * 0.05); return { ok, factor: ok ? Math.round(U.float(1.4, 1.8) * 100) / 100 : 0.3 }; }
      const ok = U.chance(0.45 + car / 250 + law * 0.05 + lvl * 0.03);
      return { ok, factor: ok ? Math.round(U.float(1.15, 1.35) * 100) / 100 : 0.9 };
    }
  };
  // ——— Tu carrera: mánager o representarte a ti mismo ———
  const careerOk = (p) => !!p.job && (p.job.type === 'sport' || p.job.type === 'fame');
  agency.hireManager = function (g) {
    const p = g.p;
    if (!careerOk(p)) return 'Un mánager solo sirve si eres deportista, gamer profesional o famoso.';
    if (p.manager) return `Ya tienes mánager: ${p.manager.first} ${p.manager.last}.`;
    const gender = U.pick(['m', 'f']);
    p.manager = { first: MV.randomFirst(gender, p.country), last: MV.randomLast(p.country), gender, fee: 0.1 };
    return `Contrataste a ${p.manager.first} ${p.manager.last} como ${U.gw(gender, 'tu mánager', 'tu mánager')}. Se queda con el 10 % de lo que ganas, pero negocia como un tiburón.`;
  };
  agency.fireManager = function (g) {
    const p = g.p;
    if (!p.manager) return 'No tienes mánager.';
    const m = p.manager;
    p.manager = null;
    return `Despediste a ${m.first} ${m.last}. Desde ahora negocias tú (con tu Carisma y tu cara de póker).`;
  };
  /** Mejora de una oferta o sueldo por tener mánager (1 si no tienes). */
  agency.managerBoost = (p) => (p.manager ? U.float(1.1, 1.25) : 1);
  /** ¿El sueldo de esta carrera se recalcula cada año (fama y deportes con premios)? */
  agency.recomputed = (job) => { if (!job) return false; if (job.type === 'fame') return true; const J = job.type === 'sport' && MV.jobById(job.id); return !!(J && MV.SPORTS[J.sport] && MV.SPORTS[J.sport].prize); };
  /** Comisión anual del mánager (10 % de tu sueldo); si ya no tienes carrera, se va. Repone un sueldo castigado por una amenaza fallida. */
  agency.managerFee = function (g) {
    const p = g.p;
    if (p.flags.slump && p.job) { p.job.salary = Math.max(p.job.salary, p.flags.slump); }
    if (p.flags.slumpDeal && p.job) p.job.deal = p.flags.slumpDeal;
    delete p.flags.slump; delete p.flags.slumpDeal;
    if (!p.manager) return 0;
    if (!careerOk(p)) { MV.log(g, `${p.manager.first}, tu mánager, renunció: sin carrera no hay comisión.`, '💼'); p.manager = null; return 0; }
    return Math.round(p.job.salary * p.manager.fee);
  };
  agency.careerActions = function (g) {
    const p = g.p, out = [];
    if (!careerOk(p)) return out;
    if (p.manager) out.push({ id: 'despedir_manager', icon: '💼', label: `Despedir a tu mánager (${p.manager.first})`, sub: 'Te ahorras el 10 %, pero negocias tú', limit: 1, confirm: '¿Despedir a tu mánager?', run: (g) => agency.fireManager(g) });
    else {
      out.push({ id: 'contratar_manager', icon: '💼', label: 'Contratar un mánager', sub: 'Cobra 10 % de tu sueldo; mejores ofertas y sueldos', limit: 1, run: (g) => agency.hireManager(g) });
      out.push({ id: 'negociar_propio', icon: '🤝', label: 'Negociar tu contrato', sub: 'Pedir más, aceptar o amenazar con irte', limit: 1, run: (g) => { MV.EV.push(g, 'negociar_propio', {}, true); return 'Pediste una reunión para hablar de tu contrato. Te pusiste tu mejor camisa.'; } });
    }
    return out;
  };

  MV.sys.agency = agency;
  C().register('esports', { init: (c) => { c.roster = []; c.selfPlay = false; }, revenue: agency.revenueEsports, costs: (g, c) => (c.roster || []).reduce((s, x) => s + x.salary, 0) });
  C().register('representacion', { init: (c) => { c.clients = []; }, revenue: agency.revenueAgency });

  // — Evento: renovación del contrato de un representado —
  const gone = 'Esa persona ya no es tu cliente. Que le vaya bien (o no).';
  const findClient = (g, ctx) => { const c = mine(g, ctx.company, 'representacion'); const x = c && (c.clients || []).find((y) => y.id === ctx.client); return { c, x }; };
  const renew = (how) => (g, ctx) => {
    const { c, x } = findClient(g, ctx);
    if (!x) return gone;
    const r = agency.negotiate(g, how, { level: x.level, carisma: g.p.skills.carisma, lawyer: lawyers(c) });
    const before = x.salary;
    if (how === 'amenazar' && !r.ok) { x.base = before; x.slump = 1; }
    x.salary = Math.round(before * r.factor);
    x.left = U.int(2, 4);
    if (how === 'amenazar') MV.fx.skill(g, 'carisma', 1);
    if (r.ok && r.factor > 1.1) return `¡Negociación brillante! ${x.first} pasa de ${U.money(before)} a ${U.money(x.salary)} al año. Te llevas el ${Math.round(x.commission * 100)} %.`;
    if (r.ok) return `Firmaron la renovación: ${x.first} gana ${U.money(x.salary)} al año. Sin dramas.`;
    return how === 'amenazar' ? `La otra parte dijo "adiós". ${x.first} se quedó un año casi sin contrato (${U.money(x.salary)}) y te mira feo.` : `Pediste de más y la oferta bajó a ${U.money(x.salary)}. ${x.first} firmó con cara de velorio.`;
  };
  const selfDeal = (how) => (g) => {
    const p = g.p, job = p.job;
    if (!job || !careerOk(p)) return 'Ya no tienes contrato que negociar.';
    const before = job.salary, r = agency.negotiate(g, how, { level: (job.level || 0) + 1, carisma: p.skills.carisma, lawyer: 0 });
    if (agency.recomputed(job)) {
      // Fama y deportes con premios: el sueldo se recalcula cada año, así que se guarda el trato.
      const prev = job.deal || 1;
      if (how === 'amenazar' && !r.ok) p.flags.slumpDeal = prev;
      job.deal = Math.round(U.clamp(prev * r.factor, 0.3, 2) * 100) / 100;
    } else if (how === 'amenazar' && !r.ok) p.flags.slump = before;
    job.salary = Math.round(before * r.factor);
    MV.fx.skill(g, 'carisma', 1);
    if (r.ok && r.factor > 1.1) return `¡Lo lograste! Tu sueldo pasa de ${U.money(before)} a ${U.money(job.salary)}.`;
    if (r.ok) return `Firmaste: ahora ganas ${U.money(job.salary)}. Prudente.`;
    return how === 'amenazar' ? `Te dijeron "ahí está la puerta". Este año ganas ${U.money(job.salary)}. Duele.` : `Pediste de más y te bajaron a ${U.money(job.salary)}. Mejor contrata un mánager.`;
  };
  MV.ev({ id: 'negociar_propio', manual: true, icon: '🤝', scene: 'trabajo', title: 'Tu contrato',
    text: (g) => { const job = g.p.job; return job ? `Te sientas a negociar tu contrato sin mánager. Hoy ganas ${U.money(job.salary)} al año. Del otro lado hay tres abogados y un café frío.` : 'Ya no tienes contrato que negociar.'; },
    choices: [
      { t: 'Pedir más', eff: selfDeal('mas') },
      { t: 'Aceptar lo que ofrecen', eff: selfDeal('aceptar') },
      { t: 'Amenazar con irte', eff: selfDeal('amenazar') }
    ] });
  MV.ev({ id: 'renovar_contrato', manual: true, icon: '✍️', scene: 'trabajo', title: 'Renovación de contrato',
    text: (g, ctx) => { const { c, x } = findClient(g, ctx); return x ? `Vence el contrato de ${x.first} ${x.last} (${profName(x.prof, x.gender).toLowerCase()}, nivel ${x.level}), cliente de ${c.name}. Hoy gana ${U.money(x.salary)} al año. ¿Cómo negocias?` : gone; },
    choices: [
      { t: 'Pedir más', eff: renew('mas') },
      { t: 'Aceptar la oferta', eff: renew('aceptar') },
      { t: 'Amenazar con irse a otro lado', eff: renew('amenazar') }
    ] });
})(window.MV = window.MV || {});
