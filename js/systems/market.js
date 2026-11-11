/* Mil Vidas — bolsa de valores: precios con noticias, crash, burbujas, dividendos, compra y venta. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const DRIFT = 0.06, COMMISSION = 0.01, MAX_HIST = 60, MIN_PRICE = 0.5, SHARES = 1e6, MIN_IPO = 5e6;
  const OWN_SECTOR = { estudio: 'tech', apps: 'tech', social: 'tech', esports: 'entretenimiento', representacion: 'entretenimiento' };
  const round2 = (v) => Math.round(v * 100) / 100;
  const stockOf = (id) => MV.STOCKS.find((s) => s.id === id) || null;

  const market = {
    /** Crea el mercado la primera vez que hace falta. */
    ensure(g) {
      if (!g.market) {
        g.market = { prices: {}, last: {}, hist: {}, bubble: null, custom: {} };
        MV.STOCKS.forEach((s) => { g.market.prices[s.id] = s.price; g.market.last[s.id] = s.price; g.market.hist[s.id] = [s.price]; });
      }
      g.p.portfolio = g.p.portfolio || {};
      return g.market;
    },

    /** Datos de una acción: las 12 de la bolsa o las que se suman después (custom). */
    info(g, id) { const s = stockOf(id); return s || (g.market && g.market.custom[id]) || null; },
    price(g, id) { market.ensure(g); return g.market.prices[id] || 0; },

    list(g) {
      const m = market.ensure(g);
      return Object.keys(m.prices).map((id) => {
        const I = market.info(g, id) || { name: id, sector: 'tech', icon: '📈' };
        const last = m.last[id] || m.prices[id];
        return { id, name: I.name, sector: I.sector, icon: I.icon || '📈', price: m.prices[id], change: last ? m.prices[id] / last - 1 : 0, shares: (g.p.portfolio[id] || {}).shares || 0 };
      });
    },

    /** Corrimiento por la noticia del año para un sector. */
    newsShift(g, sector) {
      const N = MV.sys.world.current(g), E = N ? MV.MARKET_NEWS[N.id] || {} : {};
      return (E.all || 0) + (E[sector] || 0);
    },

    crash(g) {
      const m = market.ensure(g);
      Object.keys(m.prices).forEach((id) => { m.prices[id] = Math.max(MIN_PRICE, round2(m.prices[id] * U.float(0.4, 0.7))); });
      return 'Crash en la bolsa: todas las acciones se desplomaron. Los corredores lloran en el piso de la bolsa.';
    },

    /** Un año de bolsa. opts.quiet: sin crash ni burbujas nuevas al azar (pruebas). */
    yearly(g, opts) {
      opts = opts || {};
      const m = market.ensure(g), p = g.p;
      let bubbleShift = 0, bubbleSector = null;
      if (m.bubble) {
        bubbleSector = m.bubble.sector;
        if (m.bubble.years > 0) { bubbleShift = 0.3; m.bubble.years--; } else { bubbleShift = -0.5; m.bubble = null; MV.log(g, `📉 Reventó la burbuja de ${MV.SECTOR_NAMES[bubbleSector] || bubbleSector}. Los que entraron último salen en pijama.`, '🫧', 'bad'); }
      }
      const tip = m.insider;
      m.insider = null;
      Object.keys(m.prices).forEach((id) => {
        const I = market.info(g, id);
        if (!I) return;
        m.last[id] = m.prices[id];
        if (I.own) { const c = MV.sys.company.get(g, I.own); if (c) m.prices[id] = Math.max(MIN_PRICE, c.value / SHARES); return; }
        const r = DRIFT + market.newsShift(g, I.sector) + (I.sector === bubbleSector ? bubbleShift : 0) + (tip && tip.id === id ? tip.boost : 0) + U.gauss(0, I.vol != null ? I.vol : 0.3);
        m.prices[id] = Math.max(I.minPrice != null ? I.minPrice : MIN_PRICE, round2(m.prices[id] * (1 + r)));
      });
      // Junta de accionistas de tus empresas cotizantes
      (p.companies || []).forEach((c) => {
        if (!c.public) return;
        c.public.badYears = c.last.result < 0 ? (c.public.badYears || 0) + 1 : 0;
        if (c.public.badYears < 2) return;
        c.public.badYears = 0;
        if (p.prison) { if (U.chance(0.5)) market.oust(g, c.id, 0); } else MV.EV.push(g, 'junta_accionistas', { company: c.id });
      });
      // Información privilegiada
      if (!opts.quiet && p.age >= 18 && p.money >= 10000 && !p.prison && U.chance(0.04)) {
        const src = U.pick(['un amigo que trabaja en finanzas', 'tu cuñado, que "conoce gente"', 'un mozo que escuchó una reunión', (p.companies || []).length ? 'un empleado de tu empresa' : 'un vecino misterioso']);
        MV.EV.push(g, 'dato_privilegiado', { stock: U.pick(MV.STOCKS).id, source: src });
      }
      if (!opts.quiet) {
        if (U.chance(0.03)) MV.log(g, market.crash(g), '💥', 'bad');
        if (!m.bubble && U.chance(0.04)) { m.bubble = { sector: U.pick(MV.STOCKS).sector, years: U.int(2, 3) }; MV.log(g, `🫧 Todos hablan de las acciones de ${MV.SECTOR_NAMES[m.bubble.sector] || m.bubble.sector}. Hasta tu peluquero compró.`, '🫧'); }
      }
      Object.keys(m.prices).forEach((id) => { m.hist[id] = (m.hist[id] || []).concat([m.prices[id]]).slice(-MAX_HIST); });
      // Dividendos
      let div = 0;
      Object.keys(p.portfolio || {}).forEach((id) => { const I = market.info(g, id), h = p.portfolio[id]; if (I && I.div && h.shares > 0) div += Math.round(h.shares * m.prices[id] * I.div); });
      if (div) { MV.fx.money(g, div); MV.log(g, `Dividendos de tus acciones: ${U.money(div)}.`, '💵', 'good'); }
    },

    buy(g, id, qty) {
      const m = market.ensure(g), p = g.p, I = market.info(g, id);
      if (!I || !m.prices[id]) return 'Esa acción no existe (todavía).';
      if (I.own) return 'Es tu propia empresa: para comprar acciones usa "Recomprar acciones" en su hoja.';
      const price = m.prices[id];
      if (qty === 'all') qty = Math.floor(p.money / (price * (1 + COMMISSION)));
      qty = Math.floor(qty);
      if (!(qty > 0)) return 'No te alcanza ni para una acción.';
      const cost = Math.round(price * qty * (1 + COMMISSION));
      if (cost > p.money) return `No te alcanza: ${qty} acciones de ${id} cuestan ${U.money(cost)} con la comisión.`;
      MV.fx.money(g, -cost);
      const h = p.portfolio[id] || (p.portfolio[id] = { shares: 0, cost: 0 });
      h.shares += qty; h.cost += cost;
      return `Compraste ${U.num(qty)} acciones de ${I.name} (${id}) a ${U.money(price)} cada una. Total con comisión: ${U.money(cost)}.`;
    },

    sell(g, id, qty) {
      const m = market.ensure(g), p = g.p, h = p.portfolio[id], I = market.info(g, id);
      if (!h || !h.shares) return `No tienes acciones de ${id}.`;
      if (qty === 'all') qty = h.shares;
      qty = Math.floor(qty);
      if (!(qty > 0)) return 'Elige cuántas acciones vender.';
      if (qty > h.shares) return `No tienes tantas: tienes ${U.num(h.shares)} acciones de ${id}.`;
      const got = Math.round(m.prices[id] * qty * (1 - COMMISSION));
      const costPart = Math.round(h.cost * qty / h.shares);
      h.shares -= qty; h.cost -= costPart;
      if (!h.shares) delete p.portfolio[id];
      MV.fx.money(g, got);
      const gain = got - costPart;
      return `Vendiste ${U.num(qty)} acciones de ${(I || { name: id }).name} por ${U.money(got)}. ${gain >= 0 ? `Ganaste ${U.money(gain)}.` : `Perdiste ${U.money(-gain)}. Comprar caro, vender barato: un clásico.`}`;
    },

    // ——— Salida a bolsa ———
    canIpo(g, cid) {
      const c = MV.sys.company.get(g, cid), p = g.p;
      if (!c) return { ok: false, why: 'Esa empresa ya no es tuya.' };
      if (c.public) return { ok: false, why: `${c.name} ya cotiza en bolsa.` };
      if (c.value < MIN_IPO) return { ok: false, why: `Tiene que valer al menos ${U.money(MIN_IPO)} (hoy vale ${U.money(c.value)}).` };
      if (p.age - c.since < 3) return { ok: false, why: 'Necesita al menos 3 años de historia para salir a bolsa.' };
      return { ok: true, why: '' };
    },

    tickerFor(g, name) {
      const m = market.ensure(g);
      const letters = String(name).normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase();
      const base = (letters + 'XXXX').slice(0, 4);
      if (!m.prices[base]) return base;
      for (let i = 0; i < 26 * 26; i++) { const t = base.slice(0, 2) + String.fromCharCode(65 + Math.floor(i / 26)) + String.fromCharCode(65 + (i % 26)); if (!m.prices[t]) return t; }
      return base;
    },

    ipo(g, cid, pct) {
      const can = market.canIpo(g, cid);
      if (!can.ok) return can.why;
      const c = MV.sys.company.get(g, cid), m = market.ensure(g);
      pct = U.clamp(Math.round((pct || 0.3) * 100) / 100, 0.2, 0.4);
      const pay = Math.round(c.value * pct), ticker = market.tickerFor(g, c.name);
      MV.fx.money(g, pay);
      c.public = { ticker, stake: Math.round((1 - pct) * 100) / 100, badYears: 0 };
      m.custom[ticker] = { name: c.name, sector: OWN_SECTOR[c.type] || 'tech', icon: MV.COMPANY_TYPES[c.type].icon, vol: 0.3, div: 0, own: c.id };
      m.prices[ticker] = m.last[ticker] = c.value / SHARES;
      m.hist[ticker] = [m.prices[ticker]];
      MV.fx.stat(g, 'fame', U.int(2, 6)); MV.fx.stat(g, 'happy', 10);
      MV.ach.unlock(g, 'campana');
      return `¡${c.name} salió a bolsa como ${ticker}! Tocaste la campana, vendiste el ${Math.round(pct * 100)} % y cobraste ${U.money(pay)}. Ahora tienes accionistas que preguntan cosas.`;
    },

    buyback(g, cid, pct) {
      const c = MV.sys.company.get(g, cid), p = g.p;
      if (!c || !c.public) return 'Esa empresa no cotiza en bolsa.';
      pct = Math.min(Math.round(pct * 100) / 100, Math.round((1 - c.public.stake) * 100) / 100);
      if (!(pct > 0)) return 'Ya tienes todas las acciones.';
      const cost = Math.round(c.value * pct * 1.1);
      if (cost > p.money) return `No te alcanza: recomprar el ${Math.round(pct * 100)} % cuesta ${U.money(cost)}.`;
      MV.fx.money(g, -cost);
      c.public.stake = Math.round((c.public.stake + pct) * 100) / 100;
      if (c.public.stake >= 0.999) {
        const t = c.public.ticker;
        market.delist(g, t);
        c.public = null;
        return `Recompraste todas las acciones (${U.money(cost)}). ${c.name} dejó de cotizar: vuelve a ser toda tuya y sin juntas.`;
      }
      return `Recompraste el ${Math.round(pct * 100)} % de ${c.name} por ${U.money(cost)}. Ahora tienes el ${Math.round(c.public.stake * 100)} %.`;
    },

    delist(g, ticker) {
      const m = g.market;
      if (!m) return;
      delete m.prices[ticker]; delete m.last[ticker]; delete m.hist[ticker]; delete m.custom[ticker];
    },

    /** Te echan como director: la empresa deja de ser tuya y te quedan tus acciones (y una indemnización). */
    oust(g, cid, severance, resigned) {
      const c = MV.sys.company.get(g, cid), m = market.ensure(g);
      if (!c || !c.public) return 'Esa empresa ya no es tuya.';
      const t = c.public.ticker, shares = Math.round(c.public.stake * SHARES);
      m.prices[t] = c.value / SHARES;
      m.custom[t] = Object.assign({}, m.custom[t], { own: null, minPrice: 0.01 });
      g.p.portfolio[t] = { shares, cost: 0 };
      c.public = null;
      MV.sys.company.remove(g, cid);
      if (severance) MV.fx.money(g, severance);
      MV.fx.stat(g, 'happy', -12);
      const rest = `Te quedan ${U.num(shares)} acciones de ${t}${severance ? ` y ${U.money(severance)} de indemnización` : ''}.`;
      MV.EV.info(g, resigned ? { title: 'Dejaste tu empresa', icon: '🚪', scene: 'trabajo', text: `Renunciaste como director de ${c.name} antes de que votaran. ${rest}` }
        : { title: 'Te echaron de tu empresa', icon: '🪑', scene: 'trabajo', text: `La junta de accionistas votó y ya no diriges ${c.name}. ${rest}` });
      return '';
    },

    /** Valor de tu cartera a precios de hoy. */
    portfolioValue(g) {
      const p = g.p;
      if (!p.portfolio || !g.market) return 0;
      return Object.keys(p.portfolio).reduce((s, id) => s + Math.round((p.portfolio[id].shares || 0) * (g.market.prices[id] || 0)), 0);
    }
  };
  MV.sys.market = market;

  // — Eventos —
  const goneCo = 'Esa empresa ya no es tuya. La junta se hizo sin ti.';
  MV.ev({ id: 'junta_accionistas', manual: true, icon: '🪑', scene: 'trabajo', title: 'Junta de accionistas',
    text: (g, ctx) => { const c = MV.sys.company.get(g, ctx.company); return c ? `Los accionistas de ${c.name} están furiosos: dos años seguidos de pérdidas. Quieren tu cabeza (en sentido figurado, casi seguro).` : goneCo; },
    choices: [
      { t: 'Prometer resultados', eff: (g, ctx) => { const c = MV.sys.company.get(g, ctx.company); if (!c) return goneCo; if (U.chance(0.5)) return 'Prometiste el doble de ganancias y nadie preguntó cómo. Sigues al mando, por ahora.'; market.oust(g, c.id, 0); return 'No te creyeron. Votaron y perdiste.'; } },
      { t: 'Recortar la mitad del personal', when: (g, ctx) => { const c = MV.sys.company.get(g, ctx.company); return !!(c && c.staff.length); }, eff: (g, ctx) => { const c = MV.sys.company.get(g, ctx.company); if (!c) return goneCo; const out = c.staff.slice(0, Math.ceil(c.staff.length / 2)); out.forEach((e) => MV.sys.company.fire(g, c.id, e.id)); MV.fx.stat(g, 'karma', -4); return `Despediste a ${out.length} personas. Los accionistas aplaudieron; el equipo, no.`; } },
      { t: 'Renunciar con indemnización', eff: (g, ctx) => { const c = MV.sys.company.get(g, ctx.company); if (!c) return goneCo; const sev = Math.round(c.value * 0.05); market.oust(g, c.id, sev, true); return `Renunciaste con la frente en alto y ${U.money(sev)} de indemnización.`; } }
    ] });

  MV.ev({ id: 'dato_privilegiado', manual: true, icon: '🤫', scene: 'ciudad', title: 'Un dato al oído',
    text: (g, ctx) => { const I = market.info(g, ctx.stock) || { name: ctx.stock }; return `${U.cap(ctx.source || 'alguien')} te cuenta en voz baja que ${I.name} (${ctx.stock}) va a anunciar algo enorme. "No lo sabe nadie todavía", te dice, y mira para los costados.`; },
    choices: [
      { t: 'Comprar ya (hasta la mitad de tu dinero)', eff: (g, ctx) => {
        const m = market.ensure(g), price = m.prices[ctx.stock];
        if (!price) return 'Esa acción ya no cotiza. El dato llegó tarde.';
        const qty = Math.floor((g.p.money * 0.5) / (price * 1.01));
        if (qty < 1) return 'No te alcanza ni para una acción. El dato se queda en chisme.';
        const res = market.buy(g, ctx.stock, qty);
        const boost = Math.round(U.float(0.4, 1.2) * 100) / 100;
        m.insider = { id: ctx.stock, boost };
        MV.fx.stat(g, 'karma', -6);
        if (U.chance(0.25)) MV.EV.later(g, 'investigacion_bolsa', U.int(1, 2), { gain: Math.round(qty * price * boost) });
        return `${res} Ahora a esperar el anuncio (y a no hablar de esto por teléfono).`;
      } },
      { t: 'No hacer nada', eff: { karma: 1, msg: 'No hiciste nada. Dormiste tranquilo y con la billetera igual.' } },
      { t: 'Denunciarlo', eff: (g) => { MV.fx.stat(g, 'karma', 4); MV.fx.stat(g, 'fame', 1); return 'Lo denunciaste ante la comisión de valores. Te mandaron una carta de agradecimiento con un error de ortografía.'; } }
    ] });

  MV.ev({ id: 'investigacion_bolsa', manual: true, icon: '🕵️', scene: 'tribunal', title: 'Investigación',
    text: (g, ctx) => `La comisión de valores investiga compras sospechosas antes de un anuncio. Encontraron tu nombre. Te reclaman ${U.money(ctx.gain || 0)} de ganancias.`,
    choices: [
      { t: 'Contratar un abogado carísimo ($50.000)', when: (g) => g.p.money >= 50000, eff: (g, ctx) => { MV.fx.money(g, -50000 - (ctx.gain || 0)); if (U.chance(0.5)) return 'Tu abogado habló tres horas sin respirar. Pagaste la multa, pero no hubo juicio.'; MV.sys.crime.arrest(g, 'Uso de información privilegiada', 2); return 'Ni el abogado carísimo pudo con las pruebas. Hay juicio.'; } },
      { t: 'Enfrentar la investigación', eff: (g, ctx) => { MV.fx.money(g, -(ctx.gain || 0)); MV.sys.crime.arrest(g, 'Uso de información privilegiada', 2); return 'Pagaste la multa y te citaron a juicio. Tus mensajes de "compren ya" eran bastante claros.'; } }
    ] });
})(window.MV = window.MV || {});
